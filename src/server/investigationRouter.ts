/**
 * MilkyWay Investigation API Router
 * 
 * Provides endpoints for the Food-Safety Officer Console:
 * - Priority investigations dashboard table
 * - Batch search & full dossier lookup
 * - Real-time SSE streaming of autonomous investigation steps
 * - Officer notes and case status updates
 * - Contextual investigation chat associated with the case
 */

import { Router, Response } from 'express';
import { caseService, CaseStatus } from './caseService';
import { bigQueryJournalService } from './bigquery/journalService';
import { milkyWayInvestigationAgent } from './agent/investigationAgent';
import { officerNoteService } from './officerNoteService';
import { chatSummaryService } from './chatSummaryService';

export const investigationRouter = Router();

// This router is always mounted behind authenticateFirebaseToken + requireRole,
// so req.user is guaranteed present. We never fall back to a fabricated identity.
function authCtx(req: any): { uid: string; isAdmin: boolean; role: string; displayName?: string; badge?: string } {
  const uid = req.user?.uid;
  return {
    uid,
    isAdmin: req.user?.role === 'ADMIN',
    role: req.user?.role,
    displayName: req.user?.displayName,
    badge: req.user?.badgeNumber
  };
}

/**
 * GET /api/investigations
 * Returns only the cases the authenticated officer is authorized to see (ADMIN: all).
 */
investigationRouter.get('/', async (req: any, res: Response) => {
  try {
    const { uid, isAdmin } = authCtx(req);
    const cases = await caseService.listCasesForOfficer(uid, isAdmin);
    res.json({ success: true, cases });
  } catch (err: any) {
    console.error('[InvestigationRouter] GET / failed:', err);
    res.status(500).json({ error: 'Failed to fetch investigation cases', details: err.message });
  }
});

/**
 * GET /api/investigations/priority
 * Prioritized cases scoped to the authenticated officer (ADMIN: all).
 */
investigationRouter.get('/priority', async (req: any, res: Response) => {
  try {
    const { uid, isAdmin } = authCtx(req);
    const priorityItems = await caseService.getPriorityInvestigations(uid, isAdmin);
    res.json({
      success: true,
      count: priorityItems.length,
      investigations: priorityItems
    });
  } catch (err: any) {
    console.error('[InvestigationRouter] GET /priority failed:', err);
    res.status(500).json({ error: 'Failed to fetch priority investigations', details: err.message });
  }
});

/**
 * GET /api/investigations/:caseId
 * Returns full dossier for a specific investigation case
 */
// NOTE: The GET '/:caseId' route is intentionally registered LAST (see bottom of file)
// so that literal single-segment routes such as '/priority' and '/stream-investigate'
// are matched before the dynamic ':caseId' parameter.

/**
 * PATCH /api/investigations/:caseId/status
 * Updates case status: OPEN, UNDER_REVIEW, INSPECTION_REQUIRED, RESOLVED
 */
investigationRouter.patch('/:caseId/status', async (req: any, res: Response) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body || {};

    const validStatuses: CaseStatus[] = ['OPEN', 'UNDER_REVIEW', 'INSPECTION_REQUIRED', 'RESOLVED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    const { uid, isAdmin } = authCtx(req);
    const updated = await caseService.updateCaseStatus(caseId, status, uid, isAdmin);
    res.json({ success: true, status: updated.status, case: updated });
  } catch (err: any) {
    if (/FORBIDDEN/.test(err.message)) {
      res.status(403).json({ error: err.message });
      return;
    }
    if (/not found/i.test(err.message)) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('[InvestigationRouter] PATCH /:caseId/status failed:', err);
    res.status(500).json({ error: 'Failed to update case status', details: err.message });
  }
});

/**
 * POST /api/investigations/:caseId/notes
 * Appends an officer note to the investigation case
 */
investigationRouter.post('/:caseId/notes', async (req: any, res: Response) => {
  try {
    const { caseId } = req.params;
    const { noteText, content } = req.body || {};
    const text = (content || noteText || '').toString();

    if (!text.trim()) {
      res.status(400).json({ error: 'content (note text) is required' });
      return;
    }

    const { uid, isAdmin } = authCtx(req);
    // authorUid is taken from the verified token inside the service — never from the body.
    const note = await officerNoteService.createNote({ caseId, authUid: uid, isAdmin, content: text });
    res.status(201).json({ success: true, note });
  } catch (err: any) {
    if (/FORBIDDEN/.test(err.message)) { res.status(403).json({ error: err.message }); return; }
    if (/NOT_FOUND/.test(err.message)) { res.status(404).json({ error: err.message }); return; }
    console.error('[InvestigationRouter] POST /:caseId/notes failed:', err);
    res.status(500).json({ error: 'Failed to add officer note', details: err.message });
  }
});

/**
 * GET /api/investigations/:caseId/notes
 * Lists officer notes for an authorized case.
 */
investigationRouter.get('/:caseId/notes', async (req: any, res: Response) => {
  try {
    const { caseId } = req.params;
    const { uid, isAdmin } = authCtx(req);
    const notes = await officerNoteService.listNotes({ caseId, authUid: uid, isAdmin });
    res.json({ success: true, notes });
  } catch (err: any) {
    if (/FORBIDDEN/.test(err.message)) { res.status(403).json({ error: err.message }); return; }
    if (/NOT_FOUND/.test(err.message)) { res.status(404).json({ error: err.message }); return; }
    console.error('[InvestigationRouter] GET /:caseId/notes failed:', err);
    res.status(500).json({ error: 'Failed to list officer notes', details: err.message });
  }
});

/**
 * POST /api/investigations/:caseId/chat
 * Contextual investigation chat associated with the case
 */
investigationRouter.post('/:caseId/chat', async (req: any, res: Response) => {
  try {
    const { caseId } = req.params;
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message string is required' });
      return;
    }

    const { uid, isAdmin } = authCtx(req);
    const { case: c, forbidden } = await caseService.getCaseForOfficer(caseId, uid, isAdmin);
    if (forbidden) {
      res.status(403).json({ error: 'Forbidden: You are not authorized to chat on this case.' });
      return;
    }
    if (!c) {
      res.status(404).json({ error: `Case not found: ${caseId}` });
      return;
    }

    // Record officer message (multi-turn context preserved on the case)
    await caseService.addChatMessage(c.id, 'user', message.trim());

    // The agent session is keyed by case so the multi-turn conversation is preserved.
    // The browser never calls Gemini directly; this authenticated backend does.
    const sessionId = `case-${c.id}`;
    const contextualMessage = `[Case Context: Batch ${c.batchCode}, Facility ${c.facilityName}, Anomaly: ${c.primaryAnomaly}, Discrepancy: ${c.discrepancyDescription}]\nOfficer inquiry: ${message.trim()}`;

    const agentResult = await milkyWayInvestigationAgent.processMessage(
      sessionId,
      contextualMessage,
      uid // verified token UID, never client-supplied
    );

    const agentMsg = await caseService.addChatMessage(
      c.id,
      'assistant',
      agentResult.message,
      agentResult.toolCalls
    );

    // Checkpoint: attempt to (re)generate the conversation summary from the REAL
    // conversation. If the AI layer is unavailable, no summary is created (returns null).
    let summary = null;
    try {
      summary = await chatSummaryService.upsertSummaryForCase({ caseId: c.id, authUid: uid, isAdmin });
    } catch (sErr) {
      // summarization is best-effort; never blocks the chat turn
    }

    res.json({
      success: true,
      status: agentResult.status,
      message: agentMsg,
      toolCalls: agentResult.toolCalls,
      summaryUpdated: summary !== null
    });
  } catch (err: any) {
    console.error('[InvestigationRouter] POST /:caseId/chat failed:', err);
    res.status(500).json({ error: 'Failed to process investigation chat', details: err.message });
  }
});

/**
 * GET /api/investigations/:caseId/summary
 * Returns the case's chat summary if the caller is authorized.
 */
investigationRouter.get('/:caseId/summary', async (req: any, res: Response) => {
  try {
    const { caseId } = req.params;
    const { uid, isAdmin } = authCtx(req);
    const summary = await chatSummaryService.getSummaryForCase({ caseId, authUid: uid, isAdmin });
    res.json({ success: true, summary });
  } catch (err: any) {
    if (/FORBIDDEN/.test(err.message)) { res.status(403).json({ error: err.message }); return; }
    if (/NOT_FOUND/.test(err.message)) { res.status(404).json({ error: err.message }); return; }
    console.error('[InvestigationRouter] GET /:caseId/summary failed:', err);
    res.status(500).json({ error: 'Failed to fetch summary', details: err.message });
  }
});

/**
 * POST /api/investigations/execute
 * Triggers full investigation on a batch (synchronous JSON response)
 */
investigationRouter.post('/execute', async (req: any, res: Response) => {
  try {
    const { batchId } = req.body || {};
    if (!batchId || typeof batchId !== 'string') {
      res.status(400).json({ error: 'batchId string is required' });
      return;
    }

    const officerId = req.user!.uid; // verified token UID; router is behind auth
    const caseRecord = await caseService.executeInvestigation(batchId, officerId);

    res.json({
      success: true,
      case: caseRecord
    });
  } catch (err: any) {
    console.error('[InvestigationRouter] POST /execute failed:', err);
    res.status(500).json({ error: 'Investigation execution failed', details: err.message });
  }
});

/**
 * GET /api/investigations/stream-investigate
 * Server-Sent Events (SSE) streaming endpoint for live steps:
 * 1. Tracing batch
 * 2. Checking facility history
 * 3. Checking vehicle history
 * 4. Finding related batches
 * 5. Correlating evidence
 */
investigationRouter.get('/stream-investigate', async (req: any, res: Response) => {
  const batchId = (req.query.batchId as string) || 'MW-10482';
  const officerId = req.user!.uid; // verified token UID; router is behind auth

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const resultCase = await caseService.executeInvestigation(
      batchId,
      officerId,
      (step, status, details) => {
        sendEvent('step', {
          step,
          status,
          details,
          timestamp: new Date().toISOString()
        });
      }
    );

    sendEvent('complete', {
      success: true,
      caseId: resultCase.id,
      case: resultCase
    });
    res.end();
  } catch (err: any) {
    console.error('[InvestigationRouter] SSE Stream failed:', err);
    sendEvent('error', { error: err.message });
    res.end();
  }
});

/**
 * GET /api/batches/search
 * Batch search interface:
 * Officer enters MW-10482, then shows:
 * - Batch overview
 * - Current status
 * - Origin
 * - Quantity
 * - Timeline
 * - Facilities
 * - Vehicles
 * - Anomalies
 * - Associated case
 */
/**
 * Batch search handler.
 * Exported so it can be registered exactly once in server.ts at GET /api/batches/search,
 * BEFORE the /api/batches/:batchId route, so "search" is never parsed as a batch id.
 */
export async function batchSearchHandler(req: any, res: Response): Promise<void> {
  try {
    const query = (req.query.q as string || '').trim().toUpperCase();
    if (!query) {
      res.status(400).json({ error: 'Search query parameter q is required' });
      return;
    }

    const batches = await bigQueryJournalService.getBatches();
    const matchedBatch = batches.find(b => 
      b.batch_id.toUpperCase().includes(query) ||
      b.batch_id.replace('BATCH-2026-', 'MW-').toUpperCase().includes(query)
    );

    if (!matchedBatch) {
      res.status(404).json({ error: `Batch not found for query: ${query}` });
      return;
    }

    const events = await bigQueryJournalService.getEventsForBatch(matchedBatch.batch_id);
    const facilities = await bigQueryJournalService.getFacilities();
    const vehicles = await bigQueryJournalService.getVehicles();
    const anomalies = await bigQueryJournalService.getAnomalies(matchedBatch.batch_id);
    const associatedCase = await caseService.getCaseById(matchedBatch.batch_id);

    // Facilities involved in this batch
    const touchedFacilityIds = Array.from(new Set(events.map(e => e.facility_id)));
    const touchedFacilities = facilities.filter(f => touchedFacilityIds.includes(f.facility_id));

    // Vehicles used in this batch
    const touchedVehicleIds = Array.from(new Set(events.map(e => e.vehicle_id).filter(Boolean)));
    const touchedVehicles = vehicles.filter(v => touchedVehicleIds.includes(v.vehicle_id));

    const originFacility = facilities.find(f => f.facility_id === matchedBatch.origin_facility_id);

    // Current quantity from latest event
    const latestEvent = events[events.length - 1];
    const currentQuantity = latestEvent ? latestEvent.quantity_litres : matchedBatch.initial_quantity_litres;
    const unaccountedDiscrepancy = (anomalies[0]?.difference) ?? (currentQuantity - matchedBatch.initial_quantity_litres);

    res.json({
      success: true,
      batch: {
        batchId: matchedBatch.batch_id,
        batchCode: matchedBatch.batch_id,
        status: matchedBatch.status,
        origin: {
          facilityId: matchedBatch.origin_facility_id,
          name: originFacility?.name || 'Anand Collection Center',
          location: originFacility?.location || 'Anand, Gujarat'
        },
        quantity: {
          initialLitres: matchedBatch.initial_quantity_litres,
          currentLitres: currentQuantity,
          unaccountedDiscrepancyLitres: unaccountedDiscrepancy
        },
        timeline: events.map(e => ({
          eventId: e.event_id,
          eventType: e.event_type,
          timestamp: e.timestamp,
          facilityId: e.facility_id,
          facilityName: facilities.find(f => f.facility_id === e.facility_id)?.name || e.facility_id,
          quantityLitres: e.quantity_litres,
          vehicleId: e.vehicle_id,
          latitude: e.latitude,
          longitude: e.longitude
        })),
        facilities: touchedFacilities.map(f => ({
          facilityId: f.facility_id,
          name: f.name,
          type: f.facility_type,
          location: f.location
        })),
        vehicles: touchedVehicles.map(v => ({
          vehicleId: v.vehicle_id,
          registrationNumber: v.registration_number,
          capacityLitres: v.capacity_litres,
          status: v.active ? 'ACTIVE' : 'INACTIVE'
        })),
        anomalies: anomalies.map(a => ({
          anomalyId: a.anomaly_id,
          anomalyType: a.type,
          severity: a.severity,
          observedValue: a.observed_value,
          expectedValue: a.expected_value,
          differenceValue: a.difference,
          evidence: a.supporting_events,
          detectedAt: a.detected_at,
          status: a.status
        })),
        associatedCaseId: associatedCase?.id || null
      }
    });
  } catch (err: any) {
    console.error('[InvestigationRouter] batchSearchHandler failed:', err);
    res.status(500).json({ error: 'Failed to search batch', details: err.message });
  }
}

/**
 * GET /api/investigations/:caseId
 * Returns full dossier for a specific investigation case.
 * Registered LAST so literal routes (/priority, /stream-investigate) match first.
 */
investigationRouter.get('/:caseId', async (req: any, res: Response) => {
  try {
    const { caseId } = req.params;
    const { uid, isAdmin } = authCtx(req);
    const { case: c, forbidden } = await caseService.getCaseForOfficer(caseId, uid, isAdmin);
    if (forbidden) {
      res.status(403).json({ error: 'Forbidden: You are not authorized to view this investigation case.' });
      return;
    }
    if (!c) {
      res.status(404).json({ error: `Investigation case not found: ${caseId}` });
      return;
    }
    res.json({ success: true, case: c });
  } catch (err: any) {
    console.error('[InvestigationRouter] GET /:caseId failed:', err);
    res.status(500).json({ error: 'Failed to fetch investigation case', details: err.message });
  }
});
