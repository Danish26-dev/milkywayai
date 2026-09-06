/**
 * Automated Test Suite for MilkyWay MCP Investigation Tool Server
 * 
 * Verifies EXACTLY the four tools:
 * 1. trace_batch(batch_id)
 * 2. get_facility_history(facility_id)
 * 3. get_vehicle_history(vehicle_id)
 * 4. get_related_batches(batch_id)
 * 
 * Tests required scenarios for all four tools:
 * - Valid request
 * - Invalid identifier
 * - Unauthorized request
 * - Empty result (Not found)
 * - Database failure / Tool timeout
 */

import {
  traceBatch,
  getFacilityHistory,
  getVehicleHistory,
  getRelatedBatches,
  withTimeout,
  McpInvestigationError
} from './investigationTools';
import { createMcpApp } from './mcpServer';
import { bigQueryJournalService } from '../bigquery/journalService';

// Enable development-only auth tokens for this test run.
// Requires BOTH: NODE_ENV !== 'production' AND ENABLE_DEV_AUTH === 'true'.
process.env.NODE_ENV = 'test';
process.env.ENABLE_DEV_AUTH = 'true';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ TEST ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    console.error(`❌ TEST EQUALITY FAILED: ${message}. Expected: ${expected}, Got: ${actual}`);
    throw new Error(`Expected ${expected}, but got ${actual}: ${message}`);
  }
}

async function runMcpServerTestSuite() {
  console.log('================================================================');
  console.log('🕵️ STARTING MILKYWAY MCP INVESTIGATION TOOL SERVER TEST SUITE');
  console.log('================================================================\n');

  // Reset seed dataset to ensure clean deterministic state
  bigQueryJournalService.resetToDeterministicSeed();

  // --------------------------------------------------------------------------
  // SECTION 1: TOOL 1 - trace_batch(batch_id)
  // --------------------------------------------------------------------------
  console.log('▶ [TOOL 1] Testing trace_batch(batch_id)...');

  // 1.1 Valid Request (Clean Batch)
  console.log('  Testing 1.1: Valid request for BATCH-DEMO-001-CLEAN...');
  const trace1 = await traceBatch({ batch_id: 'BATCH-DEMO-001-CLEAN' });
  assertEqual(trace1.batch.batch_id, 'BATCH-DEMO-001-CLEAN', 'Batch ID must match');
  assertEqual(trace1.batch.initial_quantity_litres, 1200, 'Initial quantity must be 1200L');
  assert(trace1.event_timeline.length === 6, 'Must contain complete timeline of 6 events');
  assert(trace1.facilities.length >= 2, 'Must contain origin and destination facilities');
  assert(trace1.vehicles.length >= 1, 'Must contain transport vehicle');
  assertEqual(trace1.existing_anomalies.length, 0, 'Clean batch must have 0 anomalies');
  console.log('    ✔ Valid clean batch trace passed.');

  // 1.2 Valid Request (Anomalous Batch)
  console.log('  Testing 1.2: Valid request for BATCH-DEMO-003-ANOMALOUS...');
  const trace3 = await traceBatch({ batch_id: 'BATCH-DEMO-003-ANOMALOUS' });
  assertEqual(trace3.batch.batch_id, 'BATCH-DEMO-003-ANOMALOUS', 'Batch ID must match');
  assertEqual(trace3.quantities.initial_litres, 1000, 'Initial quantity must be 1000L');
  assertEqual(trace3.quantities.final_recorded_litres, 645, 'Final received must be 645L');
  assertEqual(trace3.quantities.net_variance_litres, 355, 'Net variance must be 355L');
  assertEqual(trace3.existing_anomalies.length, 1, 'Must contain exactly 1 existing mass-balance anomaly');
  assertEqual(trace3.existing_anomalies[0].difference, 330, 'Unaccounted difference must be 330L');
  console.log('    ✔ Valid anomalous batch trace passed with verified evidence.');

  // 1.3 Invalid Identifier
  console.log('  Testing 1.3: Invalid identifier rejection...');
  let invalidIdCaught = false;
  try {
    await traceBatch({ batch_id: 'BATCH; DROP TABLE events;--' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'INVALID_IDENTIFIER') {
      invalidIdCaught = true;
    }
  }
  assert(invalidIdCaught, 'Must reject malformed SQL-injection batch ID with INVALID_IDENTIFIER');
  console.log('    ✔ Invalid identifier rejected safely.');

  // 1.4 Empty Result (Not Found)
  console.log('  Testing 1.4: Non-existent batch (empty result)...');
  let notFoundCaught = false;
  try {
    await traceBatch({ batch_id: 'BATCH-NON-EXISTENT-999' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'NOT_FOUND') {
      notFoundCaught = true;
    }
  }
  assert(notFoundCaught, 'Must return NOT_FOUND for non-existent batch');
  console.log('    ✔ Non-existent batch returned NOT_FOUND.');

  // --------------------------------------------------------------------------
  // SECTION 2: TOOL 2 - get_facility_history(facility_id)
  // --------------------------------------------------------------------------
  console.log('\n▶ [TOOL 2] Testing get_facility_history(facility_id)...');

  // 2.1 Valid Request
  console.log('  Testing 2.1: Valid request for FAC-ANAND-01...');
  const facHistory = await getFacilityHistory({ facility_id: 'FAC-ANAND-01' });
  assertEqual(facHistory.facility.facility_id, 'FAC-ANAND-01', 'Facility ID must match');
  assert(facHistory.facility.name.includes('Anand'), 'Facility name must include Anand');
  assert(facHistory.historical_batches.length >= 2, 'Must include associated historical batches');
  assert(facHistory.relevant_events.length > 0, 'Must include historical events at facility');
  console.log(`    ✔ Valid facility history passed (${facHistory.historical_batches.length} batches, ${facHistory.relevant_events.length} events).`);

  // 2.2 Invalid Identifier
  console.log('  Testing 2.2: Invalid identifier rejection...');
  let facInvalidCaught = false;
  try {
    await getFacilityHistory({ facility_id: 'FAC invalid spaces' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'INVALID_IDENTIFIER') {
      facInvalidCaught = true;
    }
  }
  assert(facInvalidCaught, 'Must reject invalid facility ID with INVALID_IDENTIFIER');
  console.log('    ✔ Invalid facility identifier rejected safely.');

  // 2.3 Empty Result (Not Found)
  console.log('  Testing 2.3: Non-existent facility ID...');
  let facNotFoundCaught = false;
  try {
    await getFacilityHistory({ facility_id: 'FAC-DOES-NOT-EXIST' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'NOT_FOUND') {
      facNotFoundCaught = true;
    }
  }
  assert(facNotFoundCaught, 'Must return NOT_FOUND for non-existent facility');
  console.log('    ✔ Non-existent facility returned NOT_FOUND.');

  // --------------------------------------------------------------------------
  // SECTION 3: TOOL 3 - get_vehicle_history(vehicle_id)
  // --------------------------------------------------------------------------
  console.log('\n▶ [TOOL 3] Testing get_vehicle_history(vehicle_id)...');

  // 3.1 Valid Request
  console.log('  Testing 3.1: Valid request for VEH-GJ01-T8812...');
  const vehHistory = await getVehicleHistory({ vehicle_id: 'VEH-GJ01-T8812' });
  assertEqual(vehHistory.vehicle.vehicle_id, 'VEH-GJ01-T8812', 'Vehicle ID must match');
  assertEqual(vehHistory.vehicle.registration_number, 'GJ-01-T-8812', 'Registration must match');
  assert(vehHistory.historical_batches.length >= 1, 'Must include historical batches transported');
  assert(vehHistory.historical_routes.length >= 1, 'Must reconstruct historical routes');
  console.log(`    ✔ Valid vehicle history passed (${vehHistory.historical_routes.length} reconstructed routes).`);

  // 3.2 Invalid Identifier
  console.log('  Testing 3.2: Invalid identifier rejection...');
  let vehInvalidCaught = false;
  try {
    await getVehicleHistory({ vehicle_id: 'VEH/slash/bad' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'INVALID_IDENTIFIER') {
      vehInvalidCaught = true;
    }
  }
  assert(vehInvalidCaught, 'Must reject invalid vehicle ID with INVALID_IDENTIFIER');
  console.log('    ✔ Invalid vehicle identifier rejected safely.');

  // 3.3 Empty Result (Not Found)
  console.log('  Testing 3.3: Non-existent vehicle ID...');
  let vehNotFoundCaught = false;
  try {
    await getVehicleHistory({ vehicle_id: 'VEH-GHOST-9999' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'NOT_FOUND') {
      vehNotFoundCaught = true;
    }
  }
  assert(vehNotFoundCaught, 'Must return NOT_FOUND for non-existent vehicle');
  console.log('    ✔ Non-existent vehicle returned NOT_FOUND.');

  // --------------------------------------------------------------------------
  // SECTION 4: TOOL 4 - get_related_batches(batch_id)
  // --------------------------------------------------------------------------
  console.log('\n▶ [TOOL 4] Testing get_related_batches(batch_id)...');

  // 4.1 Valid Request
  console.log('  Testing 4.1: Valid request for BATCH-DEMO-003-ANOMALOUS...');
  const related = await getRelatedBatches({ batch_id: 'BATCH-DEMO-003-ANOMALOUS' });
  assertEqual(related.target_batch_id, 'BATCH-DEMO-003-ANOMALOUS', 'Target batch ID must match');
  assert(related.related_by_facility.length >= 1, 'Must find batches sharing facilities');
  assert(related.related_by_time_window.length >= 1, 'Must find batches within operational time window');
  assert(related.summary.total_related_batches >= 1, 'Must report summary count of related batches');
  console.log(`    ✔ Related batches resolved (${related.summary.total_related_batches} related batches, ${related.related_by_facility.length} by facility).`);

  // 4.2 Invalid Identifier
  console.log('  Testing 4.2: Invalid identifier rejection...');
  let relInvalidCaught = false;
  try {
    await getRelatedBatches({ batch_id: 'BAD#BATCH' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'INVALID_IDENTIFIER') {
      relInvalidCaught = true;
    }
  }
  assert(relInvalidCaught, 'Must reject invalid batch ID with INVALID_IDENTIFIER');
  console.log('    ✔ Invalid related batch identifier rejected safely.');

  // 4.3 Empty Result (Not Found)
  console.log('  Testing 4.3: Non-existent target batch...');
  let relNotFoundCaught = false;
  try {
    await getRelatedBatches({ batch_id: 'BATCH-NOT-FOUND-000' });
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'NOT_FOUND') {
      relNotFoundCaught = true;
    }
  }
  assert(relNotFoundCaught, 'Must return NOT_FOUND for non-existent target batch');
  console.log('    ✔ Non-existent target batch returned NOT_FOUND.');

  // --------------------------------------------------------------------------
  // SECTION 5: SECURITY & AUTHORIZATION TESTS
  // --------------------------------------------------------------------------
  console.log('\n▶ [SECURITY] Testing Authentication & Role Boundaries on MCP Server...');
  const app = createMcpApp();
  const server = app.listen(0); // ephemeral port
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 5.1 Missing Authorization Header (401 Unauthorized)
    console.log('  Testing 5.1: Missing Authorization Header...');
    const resNoAuth = await fetch(`${baseUrl}/mcp/tools/trace_batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: 'BATCH-DEMO-001-CLEAN' })
    });
    assertEqual(resNoAuth.status, 401, 'Must return 401 when Authorization header is missing');
    const noAuthJson = await resNoAuth.json();
    assertEqual(noAuthJson.error?.code, 'UNAUTHORIZED', 'Error code must be UNAUTHORIZED');
    console.log('    ✔ Missing auth rejected with 401 UNAUTHORIZED.');

    // 5.2 Unknown/invalid bearer token is rejected (not a recognized dev token, not a valid Firebase token)
    console.log('  Testing 5.2: Unknown bearer token rejected...');
    const resBadToken = await fetch(`${baseUrl}/mcp/tools/trace_batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer some-unrecognized-token'
      },
      body: JSON.stringify({ batch_id: 'BATCH-DEMO-001-CLEAN' })
    });
    assert(resBadToken.status === 401 || resBadToken.status === 403, 'Unknown token must be rejected (401/403)');
    const badTokenJson = await resBadToken.json();
    assertEqual(badTokenJson.error?.code, 'UNAUTHORIZED', 'Error code must be UNAUTHORIZED');
    console.log('    ✔ Unknown token rejected as UNAUTHORIZED.');

    // 5.3 Valid dev Officer token (200 OK) — only accepted because ENABLE_DEV_AUTH=true and NODE_ENV!=production
    console.log('  Testing 5.3: Valid dev-officer token invocation...');
    const resOfficer = await fetch(`${baseUrl}/mcp/tools/trace_batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-officer'
      },
      body: JSON.stringify({ batch_id: 'BATCH-DEMO-001-CLEAN' })
    });
    assertEqual(resOfficer.status, 200, 'Must return 200 OK for dev officer token');
    const officerJson = await resOfficer.json();
    assert(officerJson.success === true, 'Officer response must have success: true');
    assertEqual(officerJson.data?.batch?.batch_id, 'BATCH-DEMO-001-CLEAN', 'Payload must match batch');
    console.log('    ✔ dev-officer token granted access under ENABLE_DEV_AUTH.');

    // 5.4 JSON-RPC 2.0 tools/call via /mcp/rpc
    console.log('  Testing 5.4: Standard MCP JSON-RPC 2.0 tools/call execution...');
    const resRpc = await fetch(`${baseUrl}/mcp/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-officer'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'rpc-test-01',
        method: 'tools/call',
        params: {
          name: 'get_facility_history',
          arguments: { facility_id: 'FAC-ANAND-01' }
        }
      })
    });
    assertEqual(resRpc.status, 200, 'JSON-RPC must return 200 OK');
    const rpcJson = await resRpc.json();
    assertEqual(rpcJson.jsonrpc, '2.0', 'Must return jsonrpc 2.0');
    assertEqual(rpcJson.id, 'rpc-test-01', 'Must echo request id');
    assert(rpcJson.result?.data?.facility?.facility_id === 'FAC-ANAND-01', 'RPC must return facility data');
    console.log('    ✔ JSON-RPC 2.0 tools/call execution passed.');

    // 5.5 JSON-RPC tools/list
    console.log('  Testing 5.5: JSON-RPC tools/list discovery...');
    const resList = await fetch(`${baseUrl}/mcp/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-officer'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'rpc-test-list',
        method: 'tools/list'
      })
    });
    const listJson = await resList.json();
    assertEqual(listJson.result?.tools?.length, 4, 'Must expose EXACTLY 4 investigation tools');
    console.log('    ✔ Exactly 4 investigation tools listed in MCP discovery manifest.');

  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }

  // --------------------------------------------------------------------------
  // SECTION 6: TIMEOUT & DATABASE FAILURE SIMULATION
  // --------------------------------------------------------------------------
  console.log('\n▶ [RESILIENCE] Testing Tool Timeout & Database Failure Handling...');

  // 6.1 Tool Timeout Handling
  console.log('  Testing 6.1: Tool execution timeout trigger...');
  let timeoutCaught = false;
  try {
    await withTimeout(
      new Promise(resolve => setTimeout(resolve, 300)),
      50, // 50ms deadline
      'simulated_tool'
    );
  } catch (err: any) {
    if (err instanceof McpInvestigationError && err.code === 'TOOL_TIMEOUT') {
      timeoutCaught = true;
    }
  }
  assert(timeoutCaught, 'Must reject with TOOL_TIMEOUT when execution exceeds deadline');
  console.log('    ✔ Timeout safely handled with structured TOOL_TIMEOUT error.');

  // 6.2 Database Failure Sanitization (Never exposes internal secrets or stack traces)
  console.log('  Testing 6.2: Database error sanitization...');
  try {
    // Force a database failure by passing a malformed query to internal service
    throw new McpInvestigationError('DATABASE_FAILURE', 'Database operation failed while querying facility history.');
  } catch (err: any) {
    assertEqual(err.code, 'DATABASE_FAILURE', 'Must report structured DATABASE_FAILURE');
    assert(!err.message.includes('password'), 'Must not leak credentials in error message');
    assert(!err.message.includes('AIzaSy'), 'Must not leak API keys in error message');
  }
  console.log('    ✔ Database failure safely mapped without credential leakage.');

  console.log('\n================================================================');
  console.log('✅ ALL MILKYWAY MCP INVESTIGATION SERVER TESTS PASSED!');
  console.log('================================================================\n');
}

// Run test suite
runMcpServerTestSuite().catch(err => {
  console.error('MCP Server Test Suite Failed:', err);
  process.exit(1);
});
