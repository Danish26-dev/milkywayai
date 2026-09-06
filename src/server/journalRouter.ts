/**
 * MilkyWay Supply-Journal Ingestion Router (PUBLIC data-entry boundary)
 *
 * Routes for the farmer/collection-operator journal UI. This router is intentionally
 * NOT behind officer authentication and has NO access to officer cases/alerts/evidence.
 * It only:
 *   - registers batches and appends validated supply-chain events (server-generated ids),
 *   - returns read-only reference data (facilities/vehicles) for the form.
 *
 * The browser never writes to or queries BigQuery directly — all writes go through
 * journalIngestionService, which enforces validation, canonical event types, and
 * append-only semantics.
 *
 * PRODUCTION HARDENING NOTE: for production, this ingestion boundary should be protected
 * by an authenticated supply-side identity (e.g. a dedicated collection-operator credential
 * or signed device token) rather than being open. That is deliberately NOT the officer
 * OFFICER/ADMIN role model. Tracked as a production-hardening item.
 */

import { Router, Request, Response } from 'express';
import { journalIngestionService, JournalValidationError } from './journalIngestionService';

export const journalRouter = Router();

// --- Minimal in-memory rate limiter (per-IP fixed window). Protects the open endpoint. ---
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60; // 60 write requests / minute / IP
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimit(req: Request, res: Response): boolean {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return false;
  }
  return true;
}

function handleError(err: any, res: Response) {
  if (err instanceof JournalValidationError) {
    res.status(400).json({ error: err.message, field: err.field });
    return;
  }
  // Do not leak internal details.
  console.error('[JournalRouter] Ingestion error:', err?.message || err);
  res.status(500).json({ error: 'Failed to record supply-journal entry.' });
}

/** GET /api/journal/facilities — read-only reference data for the form. */
journalRouter.get('/facilities', async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, facilities: await journalIngestionService.listFacilities() });
  } catch (err) {
    handleError(err, res);
  }
});

/** GET /api/journal/vehicles — read-only reference data for the form. */
journalRouter.get('/vehicles', async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, vehicles: await journalIngestionService.listVehicles() });
  } catch (err) {
    handleError(err, res);
  }
});

/** POST /api/journal/batches — register a new batch (append-only). */
journalRouter.post('/batches', async (req: Request, res: Response) => {
  if (!rateLimit(req, res)) return;
  try {
    const b = req.body || {};
    const result = await journalIngestionService.registerBatch({
      batchId: b.batchId,
      originFacilityId: b.originFacilityId,
      initialQuantityLitres: b.initialQuantityLitres,
      sourceId: b.sourceId
    });
    // Audit log (no secrets): what was registered, not who beyond a sanitized label.
    console.log(`[Journal] batch register: ${result.batch.batchId} (created=${result.created})`);
    res.status(result.created ? 201 : 200).json({ success: true, ...result });
  } catch (err) {
    handleError(err, res);
  }
});

/** POST /api/journal/events — record a validated supply-chain event. */
journalRouter.post('/events', async (req: Request, res: Response) => {
  if (!rateLimit(req, res)) return;
  try {
    const e = req.body || {};
    const recorded = await journalIngestionService.recordEvent({
      batchId: e.batchId,
      eventType: e.eventType,
      quantityLitres: e.quantityLitres,
      facilityId: e.facilityId,
      vehicleId: e.vehicleId,
      timestamp: e.timestamp,
      sourceId: e.sourceId,
      latitude: e.latitude,
      longitude: e.longitude,
      notes: e.notes
    });
    console.log(`[Journal] event recorded: ${recorded.eventId} (${recorded.eventType}) batch=${recorded.batchId}`);
    res.status(201).json({ success: true, event: recorded });
  } catch (err) {
    handleError(err, res);
  }
});
