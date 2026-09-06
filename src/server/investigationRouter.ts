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

export const investigationRouter = Router();

/**
 * GET /api/investigations
 * Returns all investigation cases
 */
investigationRouter.get('/', async (req: any, res: Response) => {
  try {
    const cases = await caseService.getAllCases();
    res.json({ success: true, cases });
  } catch (err: any) {
    console.error('[InvestigationRouter] GET / failed:', err);
    res.status(500).json({ error: 'Failed to fetch investigation cases', details: err.message });
  }
});

/**
 * GET /api/investigations/priority
 * Returns prioritized investigation cases tailored for the dashboard:
 * Columns: Priority, Batch, Facility, Anomaly, Discrepancy, Evidence Confidence, Status, Action
 */
investigationRouter.get('/priority', async (req: any, res: Response) => {
  try {
    const priorityItems = await caseService.getPriorityInvestigations();
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
investigationRouter.get('/:caseId', async (req: any, res: Response) => {
  try {
    const { caseId } = req.params;
    const c = await caseService.getCaseById(caseId);
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

    const updated = await caseService.updateCaseStatus(caseId, status, req.user?.uid);
    res.json({ success: true, status: updated.status, case: updated });
  } catch (err: any) {
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
    const { noteText, actionTaken } = req.body || {};

    if (!noteText || typeof noteText !== 'string' || !noteText.trim()) {
      res.status(400).json({ error: 'noteText is required' });
      return;
    }

    const note = await caseService.addOfficerNote(caseId, {
      officerId: req.user?.uid || 'off-delhi-042',
      officerBadge: req.user?.badgeNumber || 'FSO-IND-9021',
      officerName: req.user?.displayName || 'P. Verma',
      noteText: noteText.trim(),
      actionTaken: actionTaken || 'INTERNAL_REVIEW'
    });

    res.json({ success: true, note });
  } catch (err: any) {
    console.error('[InvestigationRouter] POST /:caseId/notes failed:', err);
    res.status(500).json({ error: 'Failed to add officer note', details: err.message });
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

    const c = await caseService.getCaseById(caseId);
    if (!c) {
      res.status(404).json({ error: `Case not found: ${caseId}` });
      return;
    }

    // Record officer message
    await caseService.addChatMessage(c.id, 'user', message.trim());

    // Prepare contextual session for agent
    const sessionId = `case-${c.id}`;
    const contextualMessage = `[Case Context: Batch ${c.batchCode}, Facility ${c.facilityName}, Anomaly: ${c.primaryAnomaly}, Discrepancy: ${c.discrepancyDescription}]\nOfficer inquiry: ${message.trim()}`;

    const agentResult = await milkyWayInvestigationAgent.processMessage(
      sessionId,
      contextualMessage,
      req.user?.uid || 'FSO-OFFICER-01'
    );

    // Record agent response
    const agentMsg = await caseService.addChatMessage(
      c.id,
      'assistant',
      agentResult.message,
      agentResult.toolCalls
    );

    res.json({
      success: true,
      message: agentMsg,
      toolCalls: agentResult.toolCalls
    });
  } catch (err: any) {
    console.error('[InvestigationRouter] POST /:caseId/chat failed:', err);
    res.status(500).json({ error: 'Failed to process investigation chat', details: err.message });
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

    const officerId = req.user?.uid || 'FSO-OFFICER-01';
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
  const officerId = req.user?.uid || 'FSO-OFFICER-01';

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
investigationRouter.get('/batches/search', async (req: any, res: Response) => {
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
    console.error('[InvestigationRouter] GET /batches/search failed:', err);
    res.status(500).json({ error: 'Failed to search batch', details: err.message });
  }
});
