/**
 * MilkyWay Backend Server
 * 
 * Express server providing authenticated REST endpoints, Firebase ID token verification,
 * server-side role authorization (OFFICER, ADMIN), and Vite integration for SPA serving.
 * 
 * SECURITY MANDATES:
 * 1. NEVER trust a UID or role supplied by the frontend.
 * 2. Identity and role are strictly derived from the verified Firebase ID token and Firestore users collection.
 * 3. All endpoint routes are defined AFTER body parsing middleware.
 * 4. Zero hardcoded secrets.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { bigQueryJournalService } from './src/server/bigquery/journalService.ts';
import { deterministicAnomalyEngine } from './src/server/anomalyEngine.ts';
import { createMcpApp } from './src/server/mcp/mcpServer.ts';
import { agentRouter } from './src/server/agent/agentRouter.ts';
import { investigationRouter, batchSearchHandler } from './src/server/investigationRouter.ts';
import { isDevAuthEnabled } from './src/server/config.ts';
import { userService } from './src/server/userService.ts';
import { alertService } from './src/server/alertService.ts';

// Note: file paths use process.cwd() (Cloud-Run-safe); no import.meta / __dirname needed.

// Resolve the Firebase/GCP project id. Precedence:
//   GOOGLE_CLOUD_PROJECT (set automatically on Cloud Run) -> other GCP env vars ->
//   the public firebase-applet-config.json (contains NO secrets, only the projectId).
// NOTE: firebase-applet-config.json holds only the public Firebase Web config
// (apiKey/authDomain/etc.), which is not a secret. No service-account key is read here.
let firebaseConfig: any = { projectId: 'milkyway-507714' };
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('[Server] Failed to read firebase-applet-config.json:', e);
}

const resolvedProjectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  firebaseConfig.projectId;

// Initialize Firebase Admin using APPLICATION DEFAULT CREDENTIALS.
// - On Cloud Run: uses the attached service account identity (no key file).
// - Locally: uses `gcloud auth application-default login` credentials.
// No JSON service-account private key is ever loaded from the repository.
if (!getApps().length) {
  try {
    initializeApp({
      projectId: resolvedProjectId,
    });
    console.log(`[Firebase Admin] Initialized with ADC for project: ${resolvedProjectId}`);
  } catch (err) {
    console.error('[Firebase Admin] Initialization failed:', err);
  }
}

/**
 * Resolves a development-only auth token to a seeded user profile from the user service.
 * Callers MUST first check isDevAuthEnabled(); this function performs no gating itself.
 * Accepts ONLY the explicit dev tokens 'dev-officer' and 'dev-admin'.
 * Returns null for anything else so unknown tokens fall through to rejection.
 */
function resolveDevAuthUser(token: string) {
  if (token === 'dev-admin') {
    return userService.getFromRegistry('seed-admin-01')!;
  }
  if (token === 'dev-officer') {
    return userService.getFromRegistry('seed-officer-01')!;
  }
  return null;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: 'OFFICER' | 'ADMIN';
    displayName?: string;
    badgeNumber?: string;
    token: DecodedIdToken;
  };
}

/**
 * Server-side authentication middleware
 * Verifies Authorization: Bearer <idToken>
 * Derives UID and checks server-side role
 */
export async function authenticateFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header. Expected Bearer token.'
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Empty Bearer token provided.'
    });
  }

  try {
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (verifyErr: any) {
      // Development-only authentication shortcut.
      // GUARANTEED disabled in production: isDevAuthEnabled() requires
      // NODE_ENV !== 'production' AND ENABLE_DEV_AUTH === 'true'.
      if (isDevAuthEnabled()) {
        const devUser = resolveDevAuthUser(token);
        if (devUser) {
          req.user = {
            uid: devUser.uid,
            email: devUser.email,
            role: devUser.role,
            displayName: devUser.displayName,
            badgeNumber: devUser.badgeNumber,
            token: { uid: devUser.uid, email: devUser.email, auth_time: Date.now() / 1000 } as any
          };
          return next();
        }
      }

      console.warn('[Auth Middleware] verifyIdToken failed:', verifyErr.message);
      return res.status(401).json({
        error: 'Unauthorized: Token verification failed'
      });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    // Server-authoritative role resolution via the user service.
    // Role is NEVER inferred from email text and NEVER taken from the client.
    // Precedence: verified custom claim (decodedToken.role) -> Firestore users doc -> registry -> OFFICER.
    const roleFromClaim: 'OFFICER' | 'ADMIN' | null =
      decodedToken.role === 'ADMIN' ? 'ADMIN' : decodedToken.role === 'OFFICER' ? 'OFFICER' : null;

    const userRole = await userService.resolveRole(uid, roleFromClaim);
    const profile = userService.getFromRegistry(uid);

    req.user = {
      uid,
      email,
      role: userRole,
      displayName: profile?.displayName || decodedToken.name || email.split('@')[0],
      badgeNumber: profile?.badgeNumber,
      token: decodedToken
    };

    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Unexpected authentication error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

/**
 * Role-Based Access Control middleware
 */
export function requireRole(allowedRoles: Array<'OFFICER' | 'ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Insufficient privileges. Required: [${allowedRoles.join(', ')}], Current: ${req.user.role}`
      });
    }

    next();
  };
}

async function startServer() {
  const app = express();
  // Cloud Run injects PORT (typically 8080). Default to 8080 for parity; never hardcode.
  const PORT = Number(process.env.PORT) || 8080;

  // 0. CORS (env-based, never wildcard for authenticated APIs).
  // By default the SPA is served same-origin by this server, so no CORS headers are needed.
  // If the frontend is hosted on a different origin, set CORS_ALLOWED_ORIGINS to a
  // comma-separated allowlist (exact origins). Wildcard '*' is intentionally NOT supported
  // together with credentials.
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  if (allowedOrigins.length > 0) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      }
      if (req.method === 'OPTIONS') {
        // Preflight: 204 for allowed origins, 403 otherwise.
        res.sendStatus(origin && allowedOrigins.includes(origin) ? 204 : 403);
        return;
      }
      next();
    });
  }

  // 1. TOP-LEVEL REQUEST DESERIALIZATION (Ordering Guarantee)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. Health & public endpoints
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'milkyway-auth-api',
      timestamp: new Date().toISOString()
    });
  });

  // 3. User verification and profile endpoint (derives identity from verified token)
  app.get('/api/auth/me', authenticateFirebaseToken, (req: AuthenticatedRequest, res: Response) => {
    // Return verified identity and server-authoritative role
    res.json({
      authenticated: true,
      uid: req.user!.uid,
      email: req.user!.email,
      role: req.user!.role,
      displayName: req.user!.displayName,
      badgeNumber: req.user!.badgeNumber
    });
  });

  // 4. Secure provisioning/sync on sign-up or first login.
  // The client CANNOT choose its role. provisionUser() preserves any established role
  // and otherwise assigns OFFICER; it never elevates. A body-supplied `role` is ignored.
  app.post('/api/auth/sync-user', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    const { displayName, badgeNumber, jurisdiction, district } = req.body || {};
    try {
      const profile = await userService.provisionUser({
        uid: req.user!.uid,
        email: req.user!.email || '',
        verifiedRole: req.user!.role, // server-derived, never from client
        displayName,
        badgeNumber,
        jurisdiction,
        district
      });
      res.json({ success: true, user: profile });
    } catch (err: any) {
      console.error('[Sync User] Provisioning failed:', err);
      res.status(500).json({ error: 'Failed to provision user' });
    }
  });

  // 4b. ADMIN-ONLY secure role assignment. This is the ONLY path to grant ADMIN.
  // Requires the caller to be a verified ADMIN (requireRole). The target uid and role
  // are validated server-side; a user can never promote themselves via any other route.
  app.post('/api/admin/users/:uid/role', authenticateFirebaseToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    const targetUid = req.params.uid;
    const { role } = req.body || {};
    if (role !== 'OFFICER' && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Invalid role. Must be OFFICER or ADMIN.' });
    }
    try {
      const updated = await userService.setUserRole({
        targetUid,
        newRole: role,
        actingUid: req.user!.uid,
        actingRole: req.user!.role
      });
      res.json({ success: true, user: updated });
    } catch (err: any) {
      const status = /FORBIDDEN/.test(err.message) ? 403 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  // 5. Protected Officer Route: Get Officer's Private Case Data
  // Prevents one officer from accessing another officer's private case data
  app.get('/api/officer/cases/:caseId', authenticateFirebaseToken, (req: AuthenticatedRequest, res: Response) => {
    const { caseId } = req.params;
    const { uid, role } = req.user!;

    // Mock case store with assignment bindings to test access control
    const mockCases: Record<string, { id: string; title: string; assignedOfficerUid: string; priority: string }> = {
      'case-001': {
        id: 'case-001',
        title: 'Mass-Balance Discrepancy (Amritsar Hub)',
        assignedOfficerUid: uid, // Assigned to current caller
        priority: 'IMMEDIATE'
      },
      'case-002': {
        id: 'case-002',
        title: 'Transit Velocity Anomaly (Tanker PB-02-BV-9812)',
        assignedOfficerUid: 'different-officer-999', // Assigned to someone else!
        priority: 'HIGH'
      }
    };

    const targetCase = mockCases[caseId];
    if (!targetCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Role check: Only assigned officer or ADMIN can view this case
    if (role !== 'ADMIN' && targetCase.assignedOfficerUid !== uid) {
      return res.status(403).json({
        error: 'Forbidden: You do not have authorization to view this private investigation case. Cases are restricted to assigned officers or administrators.'
      });
    }

    res.json({
      success: true,
      case: targetCase,
      accessGrantedTo: uid,
      role
    });
  });

  // 6. Protected Admin-Only Route
  app.get('/api/admin/system-status', authenticateFirebaseToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: 'Admin access confirmed.',
      systemMetrics: {
        activeOfficers: userService.registrySize(),
        auditLogStatus: 'HEALTHY',
        firestoreStatus: 'CONNECTED',
        bigQueryAppendJournal: 'ONLINE'
      }
    });
  });

  // =========================================================================
  // BIGQUERY APPEND-ONLY SUPPLY-CHAIN EVENT JOURNAL API ENDPOINTS
  // Browser never queries BigQuery directly. Parameter validation on all inputs.
  // Zero destructive updates or deletes allowed.
  // =========================================================================

  // Helper validation for batchId: 3-64 characters, alphanumeric with dashes/underscores
  const BATCH_ID_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;

  /**
   * GET /api/batches
   * Retrieves registered supply-chain batches from BigQuery journal with optional filters
   */
  app.get('/api/batches', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = typeof req.query.status === 'string' && req.query.status.trim().length <= 32 
        ? req.query.status.trim() 
        : undefined;
      const origin_facility_id = typeof req.query.origin_facility_id === 'string' && req.query.origin_facility_id.trim().length <= 64 
        ? req.query.origin_facility_id.trim() 
        : undefined;

      const batches = await bigQueryJournalService.getBatches({ status, origin_facility_id });
      res.json({
        success: true,
        count: batches.length,
        batches
      });
    } catch (err: any) {
      console.error('[API /api/batches] Error fetching batches:', err);
      res.status(500).json({ error: 'Failed to retrieve batches from BigQuery event journal', details: err.message });
    }
  });

  /**
   * GET /api/batches/search
   * Registered BEFORE /api/batches/:batchId so "search" is never matched as a batch id.
   * Officer/Admin only. Single canonical registration of this route.
   */
  app.get('/api/batches/search', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), batchSearchHandler);

  /**
   * GET /api/batches/:batchId
   * Retrieves single batch details and deterministic mass-balance summary from BigQuery journal
   */
  app.get('/api/batches/:batchId', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    const { batchId } = req.params;

    if (!batchId || !BATCH_ID_REGEX.test(batchId)) {
      return res.status(400).json({
        error: 'Invalid batchId parameter: Must be 3-64 alphanumeric characters with dashes or underscores.'
      });
    }

    try {
      const batchData = await bigQueryJournalService.getBatchById(batchId);
      if (!batchData) {
        return res.status(404).json({ error: `Batch not found in BigQuery journal: '${batchId}'` });
      }

      res.json({
        success: true,
        ...batchData
      });
    } catch (err: any) {
      console.error(`[API /api/batches/${batchId}] Error fetching batch:`, err);
      res.status(500).json({ error: 'Failed to query batch details from BigQuery journal', details: err.message });
    }
  });

  /**
   * GET /api/batches/:batchId/events
   * Reconstructs the complete lifecycle event timeline for a batch from the append-only journal
   */
  app.get('/api/batches/:batchId/events', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    const { batchId } = req.params;

    if (!batchId || !BATCH_ID_REGEX.test(batchId)) {
      return res.status(400).json({
        error: 'Invalid batchId parameter: Must be 3-64 alphanumeric characters with dashes or underscores.'
      });
    }

    try {
      const events = await bigQueryJournalService.getEventsForBatch(batchId);
      res.json({
        success: true,
        batchId,
        count: events.length,
        events
      });
    } catch (err: any) {
      console.error(`[API /api/batches/${batchId}/events] Error querying events:`, err);
      res.status(500).json({ error: 'Failed to query event journal from BigQuery', details: err.message });
    }
  });

  /**
   * POST /api/batches/:batchId/events
   * Appends an event to the BigQuery event journal (strictly append-only).
   * Validates parameters; never destructively updates or deletes existing rows.
   */
  app.post('/api/batches/:batchId/events', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    const { batchId } = req.params;

    if (!batchId || !BATCH_ID_REGEX.test(batchId)) {
      return res.status(400).json({
        error: 'Invalid batchId parameter: Must be 3-64 alphanumeric characters with dashes or underscores.'
      });
    }

    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const {
      event_type,
      facility_id,
      vehicle_id,
      quantity_litres,
      timestamp,
      latitude,
      longitude,
      metadata
    } = body;

    if (!event_type || typeof event_type !== 'string' || event_type.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid event_type' });
    }

    if (typeof quantity_litres !== 'number' || isNaN(quantity_litres) || quantity_litres < 0) {
      return res.status(400).json({ error: 'Missing or invalid quantity_litres: Must be a non-negative number' });
    }

    try {
      const actor_id = req.user?.uid || 'SYSTEM_RECORDER';
      const appended = await bigQueryJournalService.appendEvent({
        batch_id: batchId,
        event_type,
        actor_id,
        facility_id: typeof facility_id === 'string' ? facility_id : null,
        vehicle_id: typeof vehicle_id === 'string' ? vehicle_id : null,
        quantity_litres,
        timestamp: typeof timestamp === 'string' ? timestamp : undefined,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Event successfully appended to BigQuery supply-chain journal',
        appended_event: appended
      });
    } catch (err: any) {
      console.error(`[API /api/batches/${batchId}/events] Append failed:`, err);
      res.status(500).json({ error: 'Failed to append event to BigQuery journal', details: err.message });
    }
  });

  /**
   * GET /api/facilities
   * Retrieves registered facilities from BigQuery journal
   */
  app.get('/api/facilities', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const facilities = await bigQueryJournalService.getFacilities();
      res.json({ success: true, count: facilities.length, facilities });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve facilities', details: err.message });
    }
  });

  /**
   * GET /api/vehicles
   * Retrieves registered transport vehicles from BigQuery journal
   */
  app.get('/api/vehicles', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const vehicles = await bigQueryJournalService.getVehicles();
      res.json({ success: true, count: vehicles.length, vehicles });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve vehicles', details: err.message });
    }
  });

  /**
   * GET /api/anomalies/config
   * Retrieves configurable demo configuration tables for shrinkage rates and movement speed limits
   */
  app.get('/api/anomalies/config', authenticateFirebaseToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      process_configs: deterministicAnomalyEngine.getProcessConfigs(),
      movement_config: deterministicAnomalyEngine.getMovementConfig(),
      notice: 'DEMO CONFIGURATION: These values are adjustable demo thresholds and not universal scientific constants.'
    });
  });

  /**
   * PUT /api/anomalies/config/process
   * Updates or registers a process shrinkage configuration (strictly validated)
   */
  app.put('/api/anomalies/config/process', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { process_type, shrinkage_rate, tolerance_litres, effective_from, notes } = req.body || {};
      
      if (!process_type || typeof process_type !== 'string') {
        res.status(400).json({ error: 'process_type string is required' });
        return;
      }
      if (typeof shrinkage_rate !== 'number' || shrinkage_rate < 0 || shrinkage_rate > 1) {
        res.status(400).json({ error: 'shrinkage_rate must be a valid float between 0.0 and 1.0 (e.g. 0.02 for 2%)' });
        return;
      }
      if (typeof tolerance_litres !== 'number' || tolerance_litres < 0) {
        res.status(400).json({ error: 'tolerance_litres must be a non-negative number' });
        return;
      }

      deterministicAnomalyEngine.setProcessConfig({
        process_type: process_type.trim().toUpperCase(),
        shrinkage_rate,
        tolerance_litres,
        effective_from: effective_from || new Date().toISOString(),
        is_demo_configuration: true,
        notes: notes || 'Configured via MilkyWay officer console'
      });

      res.json({
        success: true,
        message: `Process configuration for ${process_type.toUpperCase()} updated`,
        configs: deterministicAnomalyEngine.getProcessConfigs()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update process config', details: err.message });
    }
  });

  /**
   * PUT /api/anomalies/config/movement
   * Updates maximum plausible speed configuration (strictly validated)
   */
  app.put('/api/anomalies/config/movement', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { configured_plausible_max_speed, min_elapsed_seconds } = req.body || {};
      if (typeof configured_plausible_max_speed !== 'number' || configured_plausible_max_speed <= 0) {
        res.status(400).json({ error: 'configured_plausible_max_speed must be a positive number in km/h' });
        return;
      }

      deterministicAnomalyEngine.setMovementConfig({
        configured_plausible_max_speed,
        min_elapsed_seconds: typeof min_elapsed_seconds === 'number' ? min_elapsed_seconds : 60
      });

      res.json({
        success: true,
        message: 'Movement configuration updated',
        movement_config: deterministicAnomalyEngine.getMovementConfig()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update movement config', details: err.message });
    }
  });

  /**
   * POST /api/anomalies/detect/:batchId
   * Evaluates deterministic anomalies for a specific batch on-demand (ZERO Gemini usage)
   */
  app.post('/api/anomalies/detect/:batchId', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const batchId = req.params.batchId;
      const batchData = await bigQueryJournalService.getBatchById(batchId);
      if (!batchData) {
        res.status(404).json({ error: `Batch ${batchId} not found in BigQuery journal` });
        return;
      }

      const events = await bigQueryJournalService.getEventsForBatch(batchId);
      const facilities = await bigQueryJournalService.getFacilities();
      const facilitiesMap = new Map(facilities.map(f => [f.facility_id, f]));

      const anomalies = deterministicAnomalyEngine.evaluateBatch(
        batchId,
        batchData.batch.initial_quantity_litres,
        events,
        facilitiesMap
      );

      res.json({
        success: true,
        batch_id: batchId,
        anomaly_count: anomalies.length,
        anomalies,
        evaluated_at: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to evaluate batch anomalies', details: err.message });
    }
  });

  /**
   * GET /api/anomalies
   * Retrieves deterministic anomaly records from BigQuery journal
   */
  app.get('/api/anomalies', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const batchId = typeof req.query.batch_id === 'string' ? req.query.batch_id : undefined;
      const anomalies = await bigQueryJournalService.getAnomalies(batchId);
      res.json({ success: true, count: anomalies.length, anomalies });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve anomalies', details: err.message });
    }
  });

  /**
   * GET /api/bigquery/schema
   * Returns table schemas, DDL definitions, and connection status for audit & compliance
   */
  app.get('/api/bigquery/schema', authenticateFirebaseToken, (req: AuthenticatedRequest, res: Response) => {
    const schemaInfo = bigQueryJournalService.getSchemaInfo();
    res.json({
      success: true,
      ...schemaInfo
    });
  });

  /**
   * POST /api/seed
   * Resets BigQuery journal to deterministic seed dataset (Officer/Admin only)
   */
  app.post('/api/seed', authenticateFirebaseToken, (req: AuthenticatedRequest, res: Response) => {
    const dataset = bigQueryJournalService.resetToDeterministicSeed();
    res.json({
      success: true,
      message: 'BigQuery journal successfully reset to deterministic seed dataset',
      summary: {
        batches: dataset.batches.length,
        events: dataset.events.length,
        facilities: dataset.facilities.length,
        vehicles: dataset.vehicles.length,
        anomalies: dataset.anomalies.length
      }
    });
  });

  // =========================================================================
  // FIRESTORE-BACKED ALERTS API (officer-scoped; ADMIN sees all)
  // =========================================================================

  /**
   * GET /api/alerts
   * Lists alerts assigned to the authenticated officer (ADMIN: all).
   */
  app.get('/api/alerts', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alerts = await alertService.listForOfficer(req.user!.uid, req.user!.role === 'ADMIN');
      res.json({ success: true, count: alerts.length, alerts });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch alerts', details: err.message });
    }
  });

  /**
   * POST /api/alerts
   * Creates an alert. assignedOfficerUid defaults to the caller unless an ADMIN assigns another.
   */
  app.post('/api/alerts', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    const { batchId, caseId, severity, anomalyType, assignedOfficerUid } = req.body || {};
    if (!batchId || typeof batchId !== 'string') {
      return res.status(400).json({ error: 'batchId is required' });
    }
    try {
      const alert = await alertService.createAlert({
        authUid: req.user!.uid,
        isAdmin: req.user!.role === 'ADMIN',
        batchId,
        caseId: typeof caseId === 'string' ? caseId : null,
        severity: typeof severity === 'string' ? severity : 'MEDIUM',
        anomalyType: typeof anomalyType === 'string' ? anomalyType : 'MASS_BALANCE',
        requestedAssigneeUid: typeof assignedOfficerUid === 'string' ? assignedOfficerUid : undefined
      });
      res.status(201).json({ success: true, alert });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create alert', details: err.message });
    }
  });

  /**
   * PATCH /api/alerts/:alertId/status
   * Updates alert status (NEW/ACKNOWLEDGED/INVESTIGATING/RESOLVED) with ownership enforcement.
   */
  app.patch('/api/alerts/:alertId/status', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    const { alertId } = req.params;
    const { status } = req.body || {};
    try {
      const alert = await alertService.updateStatus({
        alertId,
        status,
        authUid: req.user!.uid,
        isAdmin: req.user!.role === 'ADMIN'
      });
      res.json({ success: true, alert });
    } catch (err: any) {
      if (/FORBIDDEN/.test(err.message)) return res.status(403).json({ error: err.message });
      if (/NOT_FOUND/.test(err.message)) return res.status(404).json({ error: err.message });
      if (/INVALID_STATUS/.test(err.message)) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: 'Failed to update alert status', details: err.message });
    }
  });

  // 6. Mount Model Context Protocol (MCP) Investigation Tool Server
  app.use(createMcpApp());

  // 7. Mount MilkyWay Investigation Agent (Google ADK & Gemini with MCP)
  app.use('/api/agent', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), agentRouter);

  // 8. Mount MilkyWay Officer Console Investigation Routes (Priority investigations, cases, notes)
  // Note: batch search is registered once at GET /api/batches/search (above), not here.
  app.use('/api/investigations', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), investigationRouter);

  // 8. Vite middleware for development vs. Production static serving.
  // Vite is a devDependency and is imported DYNAMICALLY so it is never required in the
  // production container (which installs prod deps only and serves the prebuilt dist/).
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MilkyWay Server] Running on 0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });

  // Graceful shutdown for the Cloud Run container lifecycle. Cloud Run sends SIGTERM
  // before stopping an instance; close the HTTP server so in-flight requests can drain.
  const shutdown = (signal: string) => {
    console.log(`[MilkyWay Server] ${signal} received: closing HTTP server.`);
    server.close(() => {
      console.log('[MilkyWay Server] HTTP server closed gracefully.');
      process.exit(0);
    });
    // Failsafe: force-exit if connections do not drain in time.
    setTimeout(() => process.exit(0), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
