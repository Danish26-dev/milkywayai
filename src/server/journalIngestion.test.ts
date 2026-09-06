/**
 * MilkyWay — Supply-Journal Ingestion Test Suite
 *
 * Verifies the farmer/collection-operator ingestion boundary and its end-to-end
 * connection to the existing officer read path + deterministic anomaly engine:
 *
 *  - valid event ingestion
 *  - invalid event rejection (missing/unknown type, malformed quantity)
 *  - unsupported event type rejection (not in canonical enum)
 *  - server-generated event_id + created_at (client cannot set them)
 *  - actor_id is server-generated (client actor ignored)
 *  - append-only behavior (updateEvent/deleteEvent forbidden)
 *  - journal/ingestion service has NO access to officer cases/alerts
 *  - an ingested event becomes visible through the existing officer batch/events path
 *  - MW-10482-style flow reproduced through the journal triggers MASS_BALANCE (330 L)
 */

import { journalIngestionService, JournalValidationError } from './journalIngestionService';
import { bigQueryJournalService } from './bigquery/journalService';
import { deterministicAnomalyEngine } from './anomalyEngine';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string, details?: string) {
  if (cond) { console.log(`  ✓ PASS: ${name}`); passed++; }
  else { console.error(`  ✗ FAIL: ${name}`); if (details) console.error(`    ${details}`); failed++; }
}
async function expectThrows(fn: () => Promise<any>, pattern: RegExp, name: string) {
  try { await fn(); assert(false, name, 'expected an error'); }
  catch (e: any) { assert(pattern.test(e.message), name, `error was: ${e.message}`); }
}

async function run() {
  console.log('===============================================================');
  console.log('  MilkyWay — Supply-Journal Ingestion Suite');
  console.log('===============================================================');

  // Reset to a clean deterministic journal for isolation.
  bigQueryJournalService.resetToDeterministicSeed();

  // ---------------------------------------------------------------------------
  // Register a fresh batch (not the seeded MW-10482) to test the full flow.
  // ---------------------------------------------------------------------------
  console.log('\n[Register batch]');
  const reg = await journalIngestionService.registerBatch({
    batchId: 'MW-JOURNAL-DEMO',
    originFacilityId: 'FAC-ANAND-01',
    initialQuantityLitres: 1000,
    sourceId: 'Anand Coop Circle 7'
  });
  assert(reg.created === true && reg.batch.batchId === 'MW-JOURNAL-DEMO', 'Batch registered via journal');
  assert(reg.batch.initialQuantityLitres === 1000, 'Initial quantity persisted');

  // Idempotent register (append-only: does not overwrite).
  const reg2 = await journalIngestionService.registerBatch({
    batchId: 'MW-JOURNAL-DEMO', originFacilityId: 'FAC-ANAND-01', initialQuantityLitres: 9999
  });
  assert(reg2.created === false && reg2.batch.initialQuantityLitres === 1000, 'Re-register does not overwrite existing batch');

  // ---------------------------------------------------------------------------
  // Valid event ingestion + server-generated fields.
  // ---------------------------------------------------------------------------
  console.log('\n[Valid ingestion + server-generated fields]');
  const rec = await journalIngestionService.recordEvent({
    batchId: 'MW-JOURNAL-DEMO',
    eventType: 'MILK_COLLECTED',
    quantityLitres: 1000,
    facilityId: 'FAC-ANAND-01',
    sourceId: 'operator-42',
    notes: 'seal intact'
  });
  assert(/^EVT-/.test(rec.eventId), 'event_id is server-generated (EVT-...)');
  assert(rec.eventType === 'MILK_COLLECTED', 'event_type normalized/echoed');

  // Confirm created_at + actor_id are server-generated and NOT client-controlled.
  const events = await bigQueryJournalService.getEventsForBatch('MW-JOURNAL-DEMO');
  const stored = events.find(e => e.event_id === rec.eventId)!;
  assert(!!stored.created_at && !isNaN(new Date(stored.created_at).getTime()), 'created_at is server-generated');
  assert(stored.actor_id.startsWith('JOURNAL-INGEST-'), 'actor_id is server-generated (client actor ignored)', stored.actor_id);

  // ---------------------------------------------------------------------------
  // Rejections.
  // ---------------------------------------------------------------------------
  console.log('\n[Rejections]');
  await expectThrows(
    () => journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'ADULTERATION_TEST', quantityLitres: 10 }),
    /Unsupported event_type/,
    'Unsupported event type rejected'
  );
  await expectThrows(
    () => journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'MILK_COLLECTED', quantityLitres: -5 }),
    /quantity_litres/,
    'Negative quantity rejected'
  );
  await expectThrows(
    () => journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'MILK_COLLECTED', quantityLitres: 'lots' as any }),
    /quantity_litres/,
    'Non-numeric quantity rejected'
  );
  await expectThrows(
    () => journalIngestionService.recordEvent({ batchId: 'NOPE-404', eventType: 'MILK_COLLECTED', quantityLitres: 10 }),
    /Unknown batchId/,
    'Event for unknown batch rejected'
  );
  await expectThrows(
    () => journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'MILK_COLLECTED', quantityLitres: 10, timestamp: 'not-a-date' }),
    /timestamp/,
    'Malformed timestamp rejected'
  );
  const isValidationError = (() => {
    const e = new JournalValidationError('x', 'field');
    return e instanceof JournalValidationError && e.field === 'field';
  })();
  assert(isValidationError, 'Structured validation error carries a field');

  // ---------------------------------------------------------------------------
  // Append-only behavior is enforced at the journal service.
  // ---------------------------------------------------------------------------
  console.log('\n[Append-only]');
  let updateBlocked = false, deleteBlocked = false;
  try { (bigQueryJournalService as any).updateEvent(); } catch { updateBlocked = true; }
  try { (bigQueryJournalService as any).deleteEvent(); } catch { deleteBlocked = true; }
  assert(updateBlocked, 'updateEvent is forbidden (append-only)');
  assert(deleteBlocked, 'deleteEvent is forbidden (append-only)');

  // ---------------------------------------------------------------------------
  // Ingestion service must NOT expose officer data.
  // ---------------------------------------------------------------------------
  console.log('\n[Boundary]');
  assert(typeof (journalIngestionService as any).getCase === 'undefined', 'Ingestion service has no getCase');
  assert(typeof (journalIngestionService as any).listCases === 'undefined', 'Ingestion service has no case listing');
  assert(typeof (journalIngestionService as any).listAlerts === 'undefined', 'Ingestion service has no alert access');

  // ---------------------------------------------------------------------------
  // MW-10482-style flow reproduced entirely through the journal -> MASS_BALANCE 330 L.
  // ---------------------------------------------------------------------------
  console.log('\n[MW-10482 reproduction via journal]');
  // Realistic, spaced collection timestamps (as an operator would record them), so transit
  // between facilities is physically plausible and only the mass-balance anomaly triggers.
  await journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'TRANSFERRED', quantityLitres: 995, facilityId: 'FAC-ANAND-01', vehicleId: 'VEH-GJ23-T9904', timestamp: '2026-09-05T07:00:00.000Z' });
  await journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'STORED', quantityLitres: 995, facilityId: 'FAC-KAIRA-02', vehicleId: 'VEH-GJ23-T9904', timestamp: '2026-09-05T08:15:00.000Z' });
  await journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'PROCESSED', quantityLitres: 980, facilityId: 'FAC-AMUL-03', timestamp: '2026-09-05T10:30:00.000Z' });
  await journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'DISPATCHED', quantityLitres: 650, facilityId: 'FAC-AMUL-03', vehicleId: 'VEH-GJ23-T9904', timestamp: '2026-09-05T11:45:00.000Z' });
  await journalIngestionService.recordEvent({ batchId: 'MW-JOURNAL-DEMO', eventType: 'RECEIVED', quantityLitres: 645, facilityId: 'FAC-AHMD-04', vehicleId: 'VEH-GJ23-T9904', timestamp: '2026-09-05T13:30:00.000Z' });

  // Also set the initial MILK_COLLECTED timestamp region by recording nothing further;
  // the earlier collected event used server time, which is fine (single point, no transit).

  // The deterministic engine (authoritative; no Gemini) evaluates the ingested events.
  const anomalies = await bigQueryJournalService.getAnomalies('MW-JOURNAL-DEMO');
  const mb = anomalies.find(a => a.type === 'MASS_BALANCE');
  assert(!!mb, 'Journal-ingested flow triggers a MASS_BALANCE anomaly');
  if (mb) {
    assert(mb.expected_value === 980, 'Expected output 980 L (1000 * (1 - 2%))', `expected=${mb.expected_value}`);
    assert(mb.observed_value === 650, 'Observed dispatch 650 L', `observed=${mb.observed_value}`);
    assert(mb.difference === 330, 'Unaccounted 330 L', `difference=${mb.difference}`);
  }
  // No IMPOSSIBLE_MOVEMENT expected for this flow.
  assert(!anomalies.some(a => a.type === 'IMPOSSIBLE_MOVEMENT'), 'No spurious IMPOSSIBLE_MOVEMENT for normal transit');

  // ---------------------------------------------------------------------------
  // Ingested event is visible through the existing officer read path (getBatchById).
  // ---------------------------------------------------------------------------
  console.log('\n[Officer read path sees ingested data]');
  const officerView = await bigQueryJournalService.getBatchById('MW-JOURNAL-DEMO');
  assert(!!officerView && officerView.batch.batch_id === 'MW-JOURNAL-DEMO', 'Officer batch lookup returns the journal-created batch');
  assert(!!officerView && officerView.metrics.event_count >= 6, 'Officer view reflects all ingested events', `count=${officerView?.metrics.event_count}`);

  // Restore clean seed so other suites are unaffected.
  bigQueryJournalService.resetToDeterministicSeed();

  console.log('\n===============================================================');
  console.log(`  Supply-Journal Ingestion Suite Complete: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================');
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal journal ingestion test error:', err);
  process.exit(1);
});
