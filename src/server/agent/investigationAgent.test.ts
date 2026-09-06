/**
 * MilkyWay Investigation Agent - Automated Test Suite
 * 
 * Verifies:
 * 1. Autonomous execution of MCP investigation tools (trace_batch, get_facility_history, get_vehicle_history, get_related_batches).
 * 2. Strict compliance with required final response format (Batch, Primary anomaly, Observed, Expected, Unaccounted, Evidence, Interpretation, Recommended action, Evidence confidence, Disclaimer).
 * 3. Non-diagnostic constraint: Zero claims of adulteration; presence of mandatory physical inspection disclaimer.
 * 4. Multi-turn conversation context preservation for follow-up questions.
 * 5. Clean batch handling (NO ACTION recommendation).
 */

import { milkyWayInvestigationAgent, MANDATORY_DISCLAIMER } from './investigationAgent';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (failureDetails) console.error(`    Details: ${failureDetails}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  MilkyWay Investigation Agent - Test Suite Execution');
  console.log('===============================================================');

  // TEST 1: Autonomous batch investigation for MW-10482
  console.log('\n[TEST 1] Autonomous Investigation of Batch MW-10482:');
  const session1Id = `test-session-mw10482-${Date.now()}`;
  const res1 = await milkyWayInvestigationAgent.processMessage(
    session1Id,
    'Investigate batch MW-10482.',
    'TEST-OFFICER-42'
  );

  assert(res1.toolCalls.length >= 3, 'Autonomous MCP tool invocation sequence executed', `Called ${res1.toolCalls.length} tools`);
  const toolNames = res1.toolCalls.map(t => t.tool);
  assert(toolNames.includes('trace_batch'), 'Invoked trace_batch tool');
  assert(toolNames.includes('get_facility_history'), 'Invoked get_facility_history tool');
  assert(toolNames.includes('get_vehicle_history'), 'Invoked get_vehicle_history tool');
  assert(toolNames.includes('get_related_batches'), 'Invoked get_related_batches tool');

  // Verify Required Format Fields
  assert(res1.message.includes('Batch:') && res1.message.includes('MW-10482'), 'Includes Batch identifier (MW-10482)');
  assert(res1.message.includes('Primary anomaly:') && res1.message.includes('Mass balance discrepancy'), 'Identifies Primary anomaly: Mass balance discrepancy');
  assert(res1.message.includes('Observed:') && res1.message.includes('650 L'), 'Reports Observed volume: 650 L');
  assert(res1.message.includes('Expected:') && res1.message.includes('980 L'), 'Reports Expected volume: 980 L');
  assert(res1.message.includes('Unaccounted:') && res1.message.includes('330 L'), 'Reports Unaccounted shortfall: 330 L');
  assert(res1.message.includes('Evidence:'), 'Includes bulleted Evidence section');
  assert(res1.message.includes('Interpretation:'), 'Includes evidence-based Interpretation section');
  assert(res1.message.includes('Recommended action:') && res1.message.includes('INSPECT NOW'), 'Recommended action is INSPECT NOW');
  assert(res1.message.includes('Evidence confidence:') && res1.message.includes('HIGH'), 'Evidence confidence is HIGH');
  assert(res1.message.includes(MANDATORY_DISCLAIMER), 'Includes exact mandatory non-diagnostic disclaimer');

  // TEST 2: Non-Diagnostic Language Enforcement
  console.log('\n[TEST 2] Non-Diagnostic Safety Guardrails:');
  const lowerMsg = res1.message.toLowerCase();
  assert(!lowerMsg.includes('adulteration detected'), 'Does NOT claim "adulteration detected"');
  assert(!lowerMsg.includes('milk is definitely adulterated'), 'Does NOT claim "milk is definitely adulterated"');
  assert(!lowerMsg.includes('this facility is guilty'), 'Does NOT claim "this facility is guilty"');
  assert(!lowerMsg.includes('chance of adulteration'), 'Does NOT calculate probability of adulteration');
  assert(lowerMsg.includes('unexplained') || lowerMsg.includes('discrepancy') || lowerMsg.includes('physical inspection'), 'Uses approved non-diagnostic language');

  // TEST 3: Multi-Turn Chat - Follow-up on Facility Prioritization
  console.log('\n[TEST 3] Multi-Turn Dialogue (Follow-Up: Facility Prioritization):');
  const res2 = await milkyWayInvestigationAgent.processMessage(
    session1Id,
    'Why did you prioritize Facility FAC-AMUL-03 for inspection?',
    'TEST-OFFICER-42'
  );
  assert(res2.message.includes('FAC-AMUL-03'), 'Explains prioritization using FAC-AMUL-03 evidence');
  assert(res2.message.includes('330 L') || res2.message.includes('dispatch'), 'References specific dispatch/processing evidence');
  assert(res2.message.includes('Recommended action:'), 'Maintains structured recommendation');
  assert(res2.message.includes(MANDATORY_DISCLAIMER), 'Preserves disclaimer in follow-up');

  // TEST 4: Multi-Turn Chat - Follow-up on Vehicle Transit
  console.log('\n[TEST 4] Multi-Turn Dialogue (Follow-Up: Vehicle Check):');
  const res3 = await milkyWayInvestigationAgent.processMessage(
    session1Id,
    'Check if the same vehicle appears in other anomalies.',
    'TEST-OFFICER-42'
  );
  const vehicleToolInvoked = res3.toolCalls.some(t => t.tool === 'get_vehicle_history');
  assert(vehicleToolInvoked, 'Invoked get_vehicle_history tool for vehicle inquiry');
  assert(res3.message.includes('Vehicle:') || res3.message.includes('VEH-GJ23-T9904'), 'Analyzed vehicle transit performance');

  // TEST 5: Clean Batch Investigation
  console.log('\n[TEST 5] Clean Batch Investigation (BATCH-DEMO-001-CLEAN):');
  const sessionCleanId = `test-session-clean-${Date.now()}`;
  const resClean = await milkyWayInvestigationAgent.processMessage(
    sessionCleanId,
    'Investigate batch BATCH-DEMO-001-CLEAN.',
    'TEST-OFFICER-42'
  );
  assert(resClean.message.includes('BATCH-DEMO-001-CLEAN'), 'Traced clean batch');
  assert(resClean.message.includes('NO ACTION') || resClean.message.includes('MONITOR'), 'Recommends NO ACTION or MONITOR for compliant batch');
  assert(resClean.message.includes(MANDATORY_DISCLAIMER), 'Maintains mandatory disclaimer on clean batch');

  console.log('\n===============================================================');
  console.log(`  Test Run Complete: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('===============================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
