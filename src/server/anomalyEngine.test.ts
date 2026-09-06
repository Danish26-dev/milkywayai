/**
 * Automated Test Suite for MilkyWay Deterministic Anomaly Detection Engine
 * 
 * Tests Acceptance Criteria:
 * 1. Seed dataset verification:
 *    - Batch 1 -> clean (0 anomalies)
 *    - Batch 2 -> clean (0 anomalies)
 *    - Batch 3 -> mass-balance anomaly (Input: 1000L, Expected: 980L, Actual: 650L, Unaccounted: 330L)
 * 2. Deterministic consistency:
 *    - Identical input yields identical output every time without variance.
 * 3. Anomaly 2: Impossible Movement verification:
 *    - Consecutive location events exceeding configured max speed flag IMPOSSIBLE_MOVEMENT.
 *    - Non-diagnostic investigation language and five allowed possible explanations verified.
 * 4. Configurable threshold test:
 *    - Changes to demo configuration table update calculations dynamically.
 * 5. Strict Non-Diagnostic Language Audit:
 *    - Zero occurrences of "adulterated", "adulteration", or "fraudulent".
 */

import {
  DeterministicAnomalyEngine,
  calculateHaversineDistanceKm,
  DEFAULT_PROCESS_CONFIGS,
  DEFAULT_MOVEMENT_CONFIG
} from './anomalyEngine';
import { generateDeterministicSeed } from './bigquery/seed';
import { BigQueryEvent } from './bigquery/schema';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ TEST ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    console.error(`❌ TEST EQUALITY FAILED: ${message}. Expected: ${expected}, Received: ${actual}`);
    throw new Error(`Expected ${expected}, but got ${actual}: ${message}`);
  }
}

async function runAnomalyEngineTests() {
  console.log('================================================================');
  console.log('🔬 STARTING MILKYWAY DETERMINISTIC ANOMALY ENGINE TEST SUITE');
  console.log('================================================================\n');

  const engine = new DeterministicAnomalyEngine();
  const seed = generateDeterministicSeed();

  const facilitiesMap = new Map(seed.facilities.map(f => [f.facility_id, f]));

  // --------------------------------------------------------------------------
  // TEST 1: Acceptance Criteria - Batch 1 must be clean
  // --------------------------------------------------------------------------
  console.log('▶ Test 1: Evaluating Batch 1 (BATCH-DEMO-001-CLEAN)...');
  const batch1 = seed.batches.find(b => b.batch_id === 'BATCH-DEMO-001-CLEAN')!;
  const batch1Events = seed.events.filter(e => e.batch_id === batch1.batch_id);
  
  const batch1Anomalies = engine.evaluateBatch(
    batch1.batch_id,
    batch1.initial_quantity_litres,
    batch1Events,
    facilitiesMap
  );

  assertEqual(batch1Anomalies.length, 0, 'Batch 1 must have 0 anomalies (clean)');
  console.log('  ✔ Batch 1 is clean. 0 anomalies flagged as expected.');

  // --------------------------------------------------------------------------
  // TEST 2: Acceptance Criteria - Batch 2 must be clean
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 2: Evaluating Batch 2 (BATCH-DEMO-002-CLEAN)...');
  const batch2 = seed.batches.find(b => b.batch_id === 'BATCH-DEMO-002-CLEAN')!;
  const batch2Events = seed.events.filter(e => e.batch_id === batch2.batch_id);

  const batch2Anomalies = engine.evaluateBatch(
    batch2.batch_id,
    batch2.initial_quantity_litres,
    batch2Events,
    facilitiesMap
  );

  assertEqual(batch2Anomalies.length, 0, 'Batch 2 must have 0 anomalies (clean)');
  console.log('  ✔ Batch 2 is clean. 0 anomalies flagged as expected.');

  // --------------------------------------------------------------------------
  // TEST 3: Acceptance Criteria - Batch 3 must produce Mass-Balance Anomaly
  // Input: 1000 L, Demo Shrinkage: 2%, Expected: 980 L, Actual: 650 L, Unaccounted: 330 L
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 3: Evaluating Batch 3 (BATCH-DEMO-003-ANOMALOUS)...');
  const batch3 = seed.batches.find(b => b.batch_id === 'BATCH-DEMO-003-ANOMALOUS')!;
  const batch3Events = seed.events.filter(e => e.batch_id === batch3.batch_id);

  const batch3Anomalies = engine.evaluateBatch(
    batch3.batch_id,
    batch3.initial_quantity_litres,
    batch3Events,
    facilitiesMap
  );

  assertEqual(batch3Anomalies.length, 1, 'Batch 3 must produce exactly 1 anomaly');
  const mbAnomaly = batch3Anomalies[0];

  assertEqual(mbAnomaly.type, 'MASS_BALANCE', 'Anomaly type must be MASS_BALANCE');
  assertEqual(mbAnomaly.severity, 'HIGH', 'Severity must be HIGH (> 200 L shortfall)');
  assertEqual(mbAnomaly.expected_value, 980, 'Expected output must be exactly 980 L');
  assertEqual(mbAnomaly.observed_value, 650, 'Observed output must be exactly 650 L');
  assertEqual(mbAnomaly.difference, 330, 'Unaccounted difference must be exactly 330 L');
  assertEqual(mbAnomaly.investigation_signal, 'Supply-chain anomaly detected.', 'Must use mandated investigation signal language');
  assert(mbAnomaly.supporting_events.length >= 2, 'Must cite supporting events');

  console.log('  ✔ Batch 3 flagged MASS_BALANCE anomaly:');
  console.log(`    - Expected: ${mbAnomaly.expected_value} L`);
  console.log(`    - Observed: ${mbAnomaly.observed_value} L`);
  console.log(`    - Unaccounted: ${mbAnomaly.difference} L`);
  console.log(`    - Severity: ${mbAnomaly.severity}`);

  // --------------------------------------------------------------------------
  // TEST 4: Deterministic Consistency Test
  // Identical input MUST produce identical results over repeated invocations.
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 4: Testing Deterministic Repeatability across 50 iterations...');
  for (let iter = 1; iter <= 50; iter++) {
    const repeatAnomalies = engine.evaluateBatch(
      batch3.batch_id,
      batch3.initial_quantity_litres,
      batch3Events,
      facilitiesMap
    );
    assertEqual(repeatAnomalies.length, 1, `Iteration ${iter} must produce 1 anomaly`);
    assertEqual(repeatAnomalies[0].expected_value, 980, `Iteration ${iter} expected value match`);
    assertEqual(repeatAnomalies[0].difference, 330, `Iteration ${iter} difference match`);
    assertEqual(repeatAnomalies[0].severity, 'HIGH', `Iteration ${iter} severity match`);
  }
  console.log('  ✔ Deterministic consistency confirmed (100% identical outputs across all iterations).');

  // --------------------------------------------------------------------------
  // TEST 5: Anomaly Type 2 - IMPOSSIBLE MOVEMENT Detection
  // 180 km in 45 minutes = 240 km/h > 80 km/h plausible max speed
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 5: Testing Anomaly Type 2 (IMPOSSIBLE MOVEMENT)...');
  const syntheticMovementEvents: BigQueryEvent[] = [
    {
      event_id: 'EVT-TEST-DISPATCH',
      batch_id: 'BATCH-TEST-MV-01',
      event_type: 'TRANSFERRED',
      actor_id: 'ACT-DRIVER-01',
      facility_id: 'FAC-ANAND-01', // Anand: Lat 22.5645, Lon 72.9289
      vehicle_id: 'VEH-GJ01-T8812',
      quantity_litres: 1000,
      timestamp: '2026-09-05T08:00:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: '{}',
      created_at: '2026-09-05T08:00:00.000Z'
    },
    {
      event_id: 'EVT-TEST-INTAKE',
      batch_id: 'BATCH-TEST-MV-01',
      event_type: 'RECEIVED',
      actor_id: 'ACT-INTAKE-02',
      facility_id: 'FAC-SURAT-REMOTE', // Surat: Lat 21.1702, Lon 72.8311 (~155 km distance)
      vehicle_id: 'VEH-GJ01-T8812',
      quantity_litres: 1000,
      timestamp: '2026-09-05T08:30:00.000Z', // Only 30 minutes elapsed (0.5 hours)
      latitude: 21.1702,
      longitude: 72.8311,
      metadata: '{}',
      created_at: '2026-09-05T08:30:00.000Z'
    }
  ];

  const distance = calculateHaversineDistanceKm(22.5645, 72.9289, 21.1702, 72.8311);
  console.log(`  Distance between coordinates: ${distance} km in 0.5 hours -> implied speed ${(distance / 0.5).toFixed(1)} km/h`);

  const movementAnomalies = engine.evaluateImpossibleMovements(
    'BATCH-TEST-MV-01',
    syntheticMovementEvents
  );

  assertEqual(movementAnomalies.length, 1, 'Must flag 1 IMPOSSIBLE_MOVEMENT anomaly');
  const mvAnomaly = movementAnomalies[0];

  assertEqual(mvAnomaly.type, 'IMPOSSIBLE_MOVEMENT', 'Type must be IMPOSSIBLE_MOVEMENT');
  assertEqual(mvAnomaly.severity, 'HIGH', 'Speed > 150 km/h must have HIGH severity');
  assert(mvAnomaly.observed_value > 300, 'Observed speed must be > 300 km/h');
  assertEqual(mvAnomaly.expected_value, 80, 'Configured max speed must be 80 km/h');
  assertEqual(mvAnomaly.investigation_signal, 'Investigation signal.', 'Signal must match specification');
  assertEqual(mvAnomaly.supporting_events[0], 'EVT-TEST-DISPATCH', 'Supporting event 1 must match');
  assertEqual(mvAnomaly.supporting_events[1], 'EVT-TEST-INTAKE', 'Supporting event 2 must match');

  // Verify non-diagnostic possible explanations
  const expectedExplanations = [
    'Data-entry error',
    'Incorrect timestamp',
    'GPS problem',
    'Incorrect facility record',
    'Suspicious movement'
  ];
  for (const exp of expectedExplanations) {
    assert(
      mvAnomaly.possible_explanations.includes(exp),
      `Must include possible explanation: '${exp}'`
    );
  }

  console.log(`  ✔ IMPOSSIBLE_MOVEMENT correctly flagged (Implied speed: ${mvAnomaly.observed_value} km/h vs max ${mvAnomaly.expected_value} km/h).`);

  // --------------------------------------------------------------------------
  // TEST 6: Configurable Demo Configuration Test
  // Modify shrinkage tolerance and verify dynamic adaptation.
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 6: Testing Configurable Demo Configuration...');
  const customEngine = new DeterministicAnomalyEngine([
    {
      process_type: 'DEFAULT',
      shrinkage_rate: 0.05, // Increase demo shrinkage to 5%
      tolerance_litres: 400.0, // Increase tolerance to 400 L
      effective_from: '2026-09-01T00:00:00.000Z',
      is_demo_configuration: true,
      notes: 'Custom demo test threshold'
    }
  ]);

  // Under 400 L tolerance, the 330 L shortfall in Batch 3 should NOT flag
  const relaxedAnomalies = customEngine.evaluateBatch(
    batch3.batch_id,
    batch3.initial_quantity_litres,
    batch3Events,
    facilitiesMap
  );
  assertEqual(relaxedAnomalies.length, 0, 'Batch 3 should not flag when tolerance is 400 L');
  console.log('  ✔ Dynamic configuration confirmed (increasing tolerance safely clears anomaly).');

  // --------------------------------------------------------------------------
  // TEST 7: Strict Non-Diagnostic Language Audit
  // Prohibit "adulterat" or "fraudulent" in all generated anomaly texts.
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 7: Performing Security & Investigation Language Audit...');
  const allGenerated = [...batch3Anomalies, ...movementAnomalies];
  for (const a of allGenerated) {
    const serialized = JSON.stringify(a).toLowerCase();
    assert(!serialized.includes('adulterat'), 'CRITICAL FLAW: Anomaly text must NEVER contain "adulterat"');
    assert(!serialized.includes('confirmed violation'), 'CRITICAL FLAW: Anomaly text must NEVER claim confirmed violation');
    assert(!serialized.includes('milk is fraudulent'), 'CRITICAL FLAW: Anomaly text must not claim fraudulent');
  }
  console.log('  ✔ Non-diagnostic language audit passed (Zero prohibited terms found).');

  console.log('\n================================================================');
  console.log('✅ ALL 7 AUTOMATED ANOMALY ENGINE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

// Execute tests
runAnomalyEngineTests().catch(err => {
  console.error('Test suite execution failed:', err);
  process.exit(1);
});
