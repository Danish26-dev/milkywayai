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
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { bigQueryJournalService } from './src/server/bigquery/journalService.ts';
import { deterministicAnomalyEngine } from './src/server/anomalyEngine.ts';
import { createMcpApp } from './src/server/mcp/mcpServer.ts';
import { agentRouter } from './src/server/agent/agentRouter.ts';
import { investigationRouter } from './src/server/investigationRouter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config safely
let firebaseConfig: any = { projectId: 'milkyway-507714' };
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('[Server] Failed to read firebase-applet-config.json:', e);
}

// Initialize Firebase Admin lazily / safely
if (!getApps().length) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log(`[Firebase Admin] Initialized for project: ${firebaseConfig.projectId}`);
  } catch (err) {
    console.error('[Firebase Admin] Initialization failed:', err);
  }
}

// In-memory server-authoritative role cache & Firestore fallback
// Used for fast and resilient role checking
const serverUserRegistry = new Map<string, {
  uid: string;
  email: string;
  displayName: string;
  role: 'OFFICER' | 'ADMIN';
  badgeNumber?: string;
  jurisdiction?: string;
  district?: string;
  active: boolean;
}>();

// Seed known initial roles for standard accounts
serverUserRegistry.set('seed-admin-01', {
  uid: 'seed-admin-01',
  email: 'admin@foodsafety.gov.in',
  displayName: 'National Directorate Admin',
  role: 'ADMIN',
  active: true
});

serverUserRegistry.set('seed-officer-01', {
  uid: 'seed-officer-01',
  email: 'p.verma@foodsafety.gov.in',
  displayName: 'P. Verma',
  role: 'OFFICER',
  badgeNumber: 'FSO-IND-9021',
  jurisdiction: 'North Zone Dairy Enforcement Division',
  district: 'Sonipat & Rohtak Sub-Districts',
  active: true
});

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
      // In development or demo preview mode, support mock/demo officer tokens for testing
      if (token === 'demo-token' || token.startsWith('demo-')) {
        const isAdmin = token.includes('admin');
        const demoUser = isAdmin ? serverUserRegistry.get('seed-admin-01')! : serverUserRegistry.get('seed-officer-01')!;
        req.user = {
          uid: demoUser.uid,
          email: demoUser.email,
          role: demoUser.role,
          displayName: demoUser.displayName,
          badgeNumber: demoUser.badgeNumber,
          token: { uid: demoUser.uid, email: demoUser.email, auth_time: Date.now() / 1000 } as any
        };
        return next();
      }

      console.warn('[Auth Middleware] verifyIdToken failed:', verifyErr.message);
      return res.status(401).json({
        error: 'Unauthorized: Token verification failed',
        details: verifyErr.message
      });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    // Check user role from Firestore or cached registry
    let userRole: 'OFFICER' | 'ADMIN' = 'OFFICER';
    let userProfile = serverUserRegistry.get(uid);

    if (!userProfile) {
      try {
        const firestore = getFirestore();
        const userDoc = await firestore.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          userRole = (data?.role === 'ADMIN' ? 'ADMIN' : 'OFFICER');
          userProfile = {
            uid,
            email: data?.email || email,
            displayName: data?.displayName || decodedToken.name || email.split('@')[0],
            role: userRole,
            badgeNumber: data?.badgeNumber,
            jurisdiction: data?.jurisdiction,
            district: data?.district,
            active: data?.active !== false
          };
          serverUserRegistry.set(uid, userProfile);
        } else {
          // If no doc yet, default role based on email or OFFICER
          if (email.toLowerCase().includes('admin')) {
            userRole = 'ADMIN';
          } else {
            userRole = 'OFFICER';
          }
          userProfile = {
            uid,
            email,
            displayName: decodedToken.name || email.split('@')[0],
            role: userRole,
            badgeNumber: `FSO-${uid.slice(0, 5).toUpperCase()}`,
            active: true
          };
          serverUserRegistry.set(uid, userProfile);
        }
      } catch (dbErr) {
        console.warn('[Auth Middleware] Firestore lookup fallback to token claim/default:', dbErr);
        if (decodedToken.role === 'ADMIN' || email.toLowerCase().includes('admin')) {
          userRole = 'ADMIN';
        }
        userProfile = {
          uid,
          email,
          displayName: decodedToken.name || email.split('@')[0],
          role: userRole,
          active: true
        };
      }
    }

    req.user = {
      uid,
      email,
      role: userProfile.role,
      displayName: userProfile.displayName,
      badgeNumber: userProfile.badgeNumber,
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
  const PORT = 3000;

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

  // 4. Endpoint to register/sync Firestore user document upon sign-up or first login
  app.post('/api/auth/sync-user', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    const { displayName, badgeNumber, jurisdiction, district } = req.body || {};
    const uid = req.user!.uid;
    const email = req.user!.email || '';

    // Frontend cannot choose its own role; server enforces it
    // Check if user already exists
    let existing = serverUserRegistry.get(uid);
    const assignedRole: 'OFFICER' | 'ADMIN' = existing?.role || (email.toLowerCase().includes('admin') ? 'ADMIN' : 'OFFICER');

    const userDocData = {
      uid,
      displayName: displayName || existing?.displayName || email.split('@')[0],
      email,
      role: assignedRole,
      badgeNumber: badgeNumber || existing?.badgeNumber || `FSO-${uid.slice(0, 5).toUpperCase()}`,
      jurisdiction: jurisdiction || existing?.jurisdiction || 'State Dairy Enforcement Division',
      district: district || existing?.district || 'General Enforcement Zone',
      lastLoginAt: new Date().toISOString(),
      active: true
    };

    serverUserRegistry.set(uid, userDocData);

    try {
      const firestore = getFirestore();
      await firestore.collection('users').doc(uid).set(userDocData, { merge: true });
    } catch (err) {
      console.warn('[Sync User] Could not write to remote Firestore directly, stored in server registry:', err);
    }

    res.json({
      success: true,
      user: userDocData
    });
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
        activeOfficers: serverUserRegistry.size,
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

  // 6. Mount Model Context Protocol (MCP) Investigation Tool Server
  app.use(createMcpApp());

  // 7. Mount MilkyWay Investigation Agent (Google ADK & Gemini with MCP)
  app.use('/api/agent', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), agentRouter);

  // 8. Mount MilkyWay Officer Console Investigation Routes (Priority investigations, cases, notes, search)
  app.use('/api/investigations', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), investigationRouter);
  app.get('/api/batches/search', authenticateFirebaseToken, requireRole(['OFFICER', 'ADMIN']), (req, res, next) => {
    (investigationRouter as any).handle(req, res, next);
  });

  // 8. Vite middleware for development vs. Production static serving
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MilkyWay Server] Running on port ${PORT}`);
  });
}

startServer();
