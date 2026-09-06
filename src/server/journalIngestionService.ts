/**
 * MilkyWay Supply-Journal Ingestion Service (server-side)
 *
 * The trust boundary for the FARMER / SUPPLY-JOURNAL data-entry surface.
 * A collection operator records real supply-chain events; this service validates
 * them and appends them to the append-only BigQuery supply-chain journal, which
 * the deterministic anomaly engine and Officer Console then read.
 *
 * SECURITY / BOUNDARY RULES:
 * - This service has NO access to officer cases, alerts, evidence, or chat summaries.
 * - The browser NEVER writes to BigQuery directly and NEVER queries it directly.
 * - actor_id is generated SERVER-SIDE from a sanitized source id; a client-supplied
 *   actor_id is ignored entirely (never trusted).
 * - event_id and created_at are generated server-side (by the journal service).
 * - event_type is validated against the canonical enum only (no new types).
 * - The journal is append-only; existing events cannot be modified or deleted.
 * - metadata is treated as UNTRUSTED passive data (stored as JSON), never as
 *   instructions for the ADK/Gemini agent.
 */

import { bigQueryJournalService } from './bigquery/journalService';
import { CANONICAL_EVENT_TYPES, BigQueryEvent } from './bigquery/schema';

export class JournalValidationError extends Error {
  public readonly field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'JournalValidationError';
    this.field = field;
  }
}

const SAFE_ID = /^[a-zA-Z0-9_-]{3,64}$/;
// Sanitizes an arbitrary source label into a safe actor-id segment.
function sanitizeSourceId(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  const cleaned = s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  return cleaned.length >= 2 ? cleaned : 'ANON';
}

function assertCanonicalEventType(eventType: unknown): string {
  if (typeof eventType !== 'string') {
    throw new JournalValidationError('event_type is required', 'event_type');
  }
  const upper = eventType.trim().toUpperCase();
  if (!(CANONICAL_EVENT_TYPES as readonly string[]).includes(upper)) {
    throw new JournalValidationError(
      `Unsupported event_type '${eventType}'. Must be one of: ${CANONICAL_EVENT_TYPES.join(', ')}`,
      'event_type'
    );
  }
  return upper;
}

function assertQuantity(q: unknown): number {
  if (typeof q !== 'number' || isNaN(q) || q < 0) {
    throw new JournalValidationError('quantity_litres must be a non-negative number', 'quantity_litres');
  }
  if (q > 1_000_000) {
    throw new JournalValidationError('quantity_litres exceeds the maximum plausible value', 'quantity_litres');
  }
  return q;
}

function assertTimestamp(ts: unknown): string | undefined {
  if (ts === undefined || ts === null || ts === '') return undefined;
  if (typeof ts !== 'string' || isNaN(new Date(ts).getTime())) {
    throw new JournalValidationError('timestamp must be a valid ISO-8601 date-time string', 'timestamp');
  }
  return ts;
}

function assertId(value: unknown, field: string, required: boolean): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new JournalValidationError(`${field} is required`, field);
    return null;
  }
  const s = String(value).trim();
  if (!SAFE_ID.test(s)) {
    throw new JournalValidationError(
      `${field} must be 3-64 characters (letters, digits, dashes, underscores)`,
      field
    );
  }
  return s;
}

export interface RegisterBatchInput {
  batchId: string;
  originFacilityId: string;
  initialQuantityLitres: number;
  sourceId?: string; // free-text source/farm label; sanitized, NOT trusted for auth
  collectionTimestamp?: string;
  destinationFacilityId?: string;
  vehicleId?: string;
  location?: { latitude?: number; longitude?: number; label?: string };
}

export interface RecordEventInput {
  batchId: string;
  eventType: string;
  quantityLitres: number;
  facilityId?: string;
  vehicleId?: string;
  timestamp?: string;
  sourceId?: string;
  latitude?: number;
  longitude?: number;
  // Free-text operator notes — stored as passive metadata, never as instructions.
  notes?: string;
}

export class JournalIngestionService {
  /**
   * Registers a new batch in the append-only journal. Optionally records the
   * initial MILK_COLLECTED event in the same call when a quantity/facility is given.
   */
  public async registerBatch(input: RegisterBatchInput): Promise<{
    batch: { batchId: string; originFacilityId: string; initialQuantityLitres: number; status: string; createdAt: string };
    created: boolean;
  }> {
    const batchId = assertId(input.batchId, 'batchId', true)!;
    const originFacilityId = assertId(input.originFacilityId, 'originFacilityId', true)!;
    const initial = assertQuantity(input.initialQuantityLitres);
    if (initial <= 0) {
      throw new JournalValidationError('initialQuantityLitres must be greater than zero', 'initialQuantityLitres');
    }

    const { batch, created } = await bigQueryJournalService.registerBatch({
      batch_id: batchId,
      origin_facility_id: originFacilityId,
      initial_quantity_litres: initial
    });

    return {
      batch: {
        batchId: batch.batch_id,
        originFacilityId: batch.origin_facility_id,
        initialQuantityLitres: batch.initial_quantity_litres,
        status: batch.status,
        createdAt: batch.created_at
      },
      created
    };
  }

  /**
   * Validates and appends a supply-chain event. event_id/created_at/actor_id are
   * server-generated; client actor ids are never trusted.
   */
  public async recordEvent(input: RecordEventInput): Promise<{
    eventId: string;
    batchId: string;
    eventType: string;
    timestamp: string;
    quantityLitres: number;
  }> {
    const batchId = assertId(input.batchId, 'batchId', true)!;
    const eventType = assertCanonicalEventType(input.eventType);
    const quantity = assertQuantity(input.quantityLitres);
    const timestamp = assertTimestamp(input.timestamp);
    const facilityId = assertId(input.facilityId, 'facilityId', false);
    const vehicleId = assertId(input.vehicleId, 'vehicleId', false);

    // The batch must already be registered (append events to known batches only).
    const exists = await bigQueryJournalService.batchExists(batchId);
    if (!exists) {
      throw new JournalValidationError(`Unknown batchId '${batchId}'. Register the batch before recording events.`, 'batchId');
    }

    // Server-generated, sanitized actor id — the client cannot choose this.
    const actorId = `JOURNAL-INGEST-${sanitizeSourceId(input.sourceId)}`;

    // Coordinates validated as numbers; metadata is passive untrusted data.
    const latitude = typeof input.latitude === 'number' && !isNaN(input.latitude) ? input.latitude : null;
    const longitude = typeof input.longitude === 'number' && !isNaN(input.longitude) ? input.longitude : null;
    const notes = typeof input.notes === 'string' ? input.notes.slice(0, 500) : undefined;

    const appended: BigQueryEvent = await bigQueryJournalService.appendEvent({
      batch_id: batchId,
      event_type: eventType,
      actor_id: actorId, // server-generated only
      facility_id: facilityId,
      vehicle_id: vehicleId,
      quantity_litres: quantity,
      timestamp,
      latitude,
      longitude,
      metadata: {
        // Clearly marked as operator-entered, untrusted data.
        ingested_via: 'supply-journal',
        source_label: sanitizeSourceId(input.sourceId),
        operator_notes: notes
      }
    });

    return {
      eventId: appended.event_id,
      batchId: appended.batch_id,
      eventType: appended.event_type,
      timestamp: appended.timestamp,
      quantityLitres: appended.quantity_litres
    };
  }

  /** Read-only reference data for the journal UI (facilities). No officer data. */
  public async listFacilities() {
    const facilities = await bigQueryJournalService.getFacilities();
    return facilities.map(f => ({
      facilityId: f.facility_id,
      name: f.name,
      type: f.facility_type,
      location: f.location
    }));
  }

  /** Read-only reference data for the journal UI (vehicles). No officer data. */
  public async listVehicles() {
    const vehicles = await bigQueryJournalService.getVehicles();
    return vehicles.map(v => ({
      vehicleId: v.vehicle_id,
      registrationNumber: v.registration_number,
      capacityLitres: v.capacity_litres
    }));
  }
}

export const journalIngestionService = new JournalIngestionService();
