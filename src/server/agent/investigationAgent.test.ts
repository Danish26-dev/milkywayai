/**
 * MilkyWay Investigation Agent - Automated Test Suite
 *
 * These tests run WITHOUT a Gemini API key configured (the default in CI/test).
 * They verify the critical stabilization guarantees:
 *
 *  G. The agent never fabricates evidence.
 *  H. When Gemini is unavailable, no fake brief is produced (status AI_UNAVAILABLE, brief === null).
 *  I. An MW-10482 investigation still retrieves REAL deterministic evidence via MCP tools.
 *
 * If a real GEMINI_API_KEY is present in the environment, the AI_UNAVAILABLE-specific
 * assertions are skipped (they only hold when the model is unavailable), but the
 * no-fabrication assertions always hold.
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

  // In CI there are no ADC credentials, so Vertex AI is not reachable. AI is only
  // actually reachable when a real local Gemini Developer API key is configured.
  // (A configured-but-unreachable Vertex mode still yields AI_UNAVAILABLE at call time,
  // which is exactly the no-fabrication behavior we assert below.)
  const hasLocalKey = !!process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim().length > 0 &&
    process.env.GEMINI_API_KEY.trim() !== 'MY_GEMINI_API_KEY';
  const aiAvailable = hasLocalKey;
  console.log(`\n[ENV] Gemini AI reasoning reachable (local key present): ${aiAvailable}`);

  // TEST 1: Investigate MW-10482 — evidence must be REAL, never fabricated
  console.log('\n[TEST 1] Investigate MW-10482 (evidence-grounding):');
  const session1Id = `test-session-mw10482-${Date.now()}`;
  const res1 = await milkyWayInvestigationAgent.processMessage(
    session1Id,
    'Investigate batch MW-10482.',
    'TEST-OFFICER-42'
  );

  assert(res1.status === 'OK' || res1.status === 'AI_UNAVAILABLE', 'Returns a valid status', `status=${res1.status}`);

  // (I) Real evidence retrieval: trace_batch must have been executed against the journal.
  const toolNames = res1.toolCalls.map(t => t.tool);
  assert(toolNames.includes('trace_batch'), 'Retrieved real evidence via trace_batch (MCP tool executed)', `tools=${JSON.stringify(toolNames)}`);

  // (G) No fabrication: every tool call recorded must be a real execution with a summary or explicit error.
  const allToolCallsReal = res1.toolCalls.every(t => t.success === true || typeof t.error === 'string');
  assert(allToolCallsReal, 'All recorded tool calls are real executions (no fabricated calls)');

  if (!aiAvailable) {
    // (H) Gemini unavailable => AI_UNAVAILABLE, no fake brief.
    console.log('\n[TEST 2] Gemini unavailable behavior (no fabrication):');
    assert(res1.status === 'AI_UNAVAILABLE', 'Status is AI_UNAVAILABLE when Gemini is not configured');
    assert(res1.brief === null, 'No fabricated brief is produced when AI is unavailable');
    assert(
      res1.message.includes('temporarily unavailable'),
      'Returns the safe AI_UNAVAILABLE message',
      res1.message
    );

    // The safe message must NOT contain fabricated investigation numbers or narratives.
    const msg = res1.message;
    assert(!/\b650\s*L\b/.test(msg), 'AI_UNAVAILABLE message does not fabricate observed volume (650 L)');
    assert(!/\b330\s*L\b/.test(msg), 'AI_UNAVAILABLE message does not fabricate shortfall (330 L)');
    assert(!/16\.2\s*km\/h/.test(msg), 'AI_UNAVAILABLE message does not fabricate vehicle speed');
    assert(!/INSPECT[_ ]NOW/i.test(msg), 'AI_UNAVAILABLE message does not fabricate a recommendation');
  } else {
    // With a real key, the brief must be evidence-grounded and use canonical enums.
    console.log('\n[TEST 2] Gemini available behavior (evidence-grounded brief):');
    assert(res1.brief !== null, 'Produces a structured brief when AI is available');
    if (res1.brief) {
      assert(res1.brief.batchId === 'MW-10482', 'Brief batchId matches investigated batch');
      assert(
        ['INSPECT_NOW', 'MONITOR', 'NO_ACTION'].includes(res1.brief.recommendedAction),
        'recommendedAction uses canonical enum'
      );
      assert(
        ['HIGH', 'MEDIUM', 'LOW'].includes(res1.brief.evidenceConfidence),
        'evidenceConfidence uses canonical enum'
      );
      assert(res1.brief.disclaimer === MANDATORY_DISCLAIMER, 'Brief carries the mandatory disclaimer');
      assert(res1.brief.supportingEvidence.length > 0, 'Brief cites at least one piece of retrieved evidence');
    }
  }

  // TEST 3: Non-diagnostic guardrails — never claim adulteration / probability
  console.log('\n[TEST 3] Non-diagnostic safety guardrails:');
  const lowerMsg = res1.message.toLowerCase();
  assert(!lowerMsg.includes('adulteration detected'), 'Does NOT claim "adulteration detected"');
  assert(!lowerMsg.includes('probability of adulteration'), 'Does NOT state probability of adulteration');
  assert(!lowerMsg.includes('this facility is guilty'), 'Does NOT claim guilt');

  // TEST 4: Non-existent batch — no fabrication, safe handling
  console.log('\n[TEST 4] Non-existent batch (no fabricated evidence):');
  const session2Id = `test-session-ghost-${Date.now()}`;
  const res2 = await milkyWayInvestigationAgent.processMessage(
    session2Id,
    'Investigate batch MW-DOES-NOT-EXIST-000.',
    'TEST-OFFICER-42'
  );
  assert(res2.brief === null || res2.brief.primaryAnomaly === 'NONE', 'No anomaly fabricated for non-existent batch');
  if (!aiAvailable) {
    assert(res2.status === 'AI_UNAVAILABLE', 'Non-existent batch under AI-unavailable stays AI_UNAVAILABLE');
  }

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
