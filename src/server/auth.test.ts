/**
 * MilkyWay Authentication & Security Invariants - Test Suite
 *
 * Verifies stabilization requirements:
 *  A. Production rejects dev/test tokens (dev auth is impossible to enable in production).
 *  B. Role is server-authoritative and cannot be elevated by client input.
 *  C. ADMIN is never inferred from email text.
 *  D. Anomaly types are the canonical MASS_BALANCE | IMPOSSIBLE_MOVEMENT only.
 *
 * These tests avoid requiring live Firebase Admin by testing the security-critical
 * pure logic (isDevAuthEnabled) and by exercising the MCP HTTP boundary, which is the
 * enforcement point for dev-token gating.
 */

import { isDevAuthEnabled } from './config';
import { createMcpApp } from './mcp/mcpServer';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    testsFailed++;
  }
}

async function startEphemeral(app: ReturnType<typeof createMcpApp>) {
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', () => resolve()));
  const port = (server.address() as any).port;
  // close() awaits full teardown so env mutations between sections cannot race
  // against in-flight requests on a previous ephemeral server.
  const close = () => new Promise<void>(resolve => server.close(() => resolve()));
  return { server, baseUrl: `http://localhost:${port}`, close };
}

async function runTests() {
  console.log('===============================================================');
  console.log('  MilkyWay Authentication & Security Invariants - Test Suite');
  console.log('===============================================================');

  // ---------------------------------------------------------------------------
  // A. Production ALWAYS disables dev auth, even if ENABLE_DEV_AUTH=true.
  // ---------------------------------------------------------------------------
  console.log('\n[A] Production rejects dev/test authentication:');

  const savedNodeEnv = process.env.NODE_ENV;
  const savedDevAuth = process.env.ENABLE_DEV_AUTH;

  // A.1 Pure gate logic
  process.env.NODE_ENV = 'production';
  process.env.ENABLE_DEV_AUTH = 'true';
  assert(isDevAuthEnabled() === false, 'isDevAuthEnabled() is FALSE in production even when ENABLE_DEV_AUTH=true');

  process.env.NODE_ENV = 'development';
  delete process.env.ENABLE_DEV_AUTH;
  assert(isDevAuthEnabled() === false, 'isDevAuthEnabled() is FALSE when ENABLE_DEV_AUTH is unset');

  process.env.NODE_ENV = 'development';
  process.env.ENABLE_DEV_AUTH = 'true';
  assert(isDevAuthEnabled() === true, 'isDevAuthEnabled() is TRUE only in non-prod with ENABLE_DEV_AUTH=true');

  // A.2 MCP HTTP boundary rejects dev token in production
  console.log('\n[A.2] MCP server rejects dev-officer token in production:');
  process.env.NODE_ENV = 'production';
  process.env.ENABLE_DEV_AUTH = 'true'; // even set, must be ignored in production
  {
    const { baseUrl, close } = await startEphemeral(createMcpApp());
    try {
      const res = await fetch(`${baseUrl}/mcp/tools/trace_batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev-officer' },
        body: JSON.stringify({ batch_id: 'BATCH-DEMO-001-CLEAN' })
      });
      // In production the dev token is not accepted; it falls through to Firebase
      // verification which fails (no valid token) -> 401 UNAUTHORIZED.
      assert(res.status === 401 || res.status === 403, 'Production MCP rejects dev-officer token', `status=${res.status}`);
      const json = await res.json();
      assert(json.error?.code === 'UNAUTHORIZED', 'Rejection uses UNAUTHORIZED code');
    } finally {
      await close();
    }
  }

  // A.3 Non-production WITH ENABLE_DEV_AUTH accepts dev-officer (the only allowed shortcut)
  console.log('\n[A.3] Non-production dev-officer token accepted only when explicitly enabled:');
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEV_AUTH = 'true';
  {
    const { baseUrl, close } = await startEphemeral(createMcpApp());
    try {
      const res = await fetch(`${baseUrl}/mcp/tools/trace_batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev-officer' },
        body: JSON.stringify({ batch_id: 'BATCH-DEMO-001-CLEAN' })
      });
      assert(res.status === 200, 'dev-officer accepted in test with ENABLE_DEV_AUTH=true', `status=${res.status}`);
    } finally {
      await close();
    }
  }

  // A.4 Non-production WITHOUT ENABLE_DEV_AUTH rejects dev-officer
  console.log('\n[A.4] Non-production without ENABLE_DEV_AUTH rejects dev-officer:');
  process.env.NODE_ENV = 'test';
  delete process.env.ENABLE_DEV_AUTH;
  {
    const { baseUrl, close } = await startEphemeral(createMcpApp());
    try {
      const res = await fetch(`${baseUrl}/mcp/tools/trace_batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev-officer' },
        body: JSON.stringify({ batch_id: 'BATCH-DEMO-001-CLEAN' })
      });
      assert(res.status === 401 || res.status === 403, 'dev-officer rejected when ENABLE_DEV_AUTH is unset', `status=${res.status}`);
    } finally {
      await close();
    }
  }

  // Restore env
  if (savedNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = savedNodeEnv;
  if (savedDevAuth === undefined) delete process.env.ENABLE_DEV_AUTH; else process.env.ENABLE_DEV_AUTH = savedDevAuth;

  // ---------------------------------------------------------------------------
  // B & C. Role source-code invariants: no email-based role inference anywhere in server code.
  //        Role must come from verified claim or Firestore, never from client input or email text.
  // ---------------------------------------------------------------------------
  console.log('\n[B/C] No email-based role inference in server auth code:');
  const fs = await import('fs');
  const path = await import('path');
  const serverSource = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  const mcpSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/server/mcp/mcpServer.ts'),
    'utf8'
  );

  // C: no "email....includes('admin')" style inference
  assert(!/email[^\n]*\.includes\(\s*['"]admin['"]\s*\)/i.test(serverSource), 'server.ts does NOT infer ADMIN from email text');
  assert(!/email[^\n]*\.includes\(\s*['"]officer['"]\s*\)/i.test(mcpSource), 'mcpServer.ts does NOT infer OFFICER from email text');
  assert(!/email[^\n]*\.includes\(\s*['"]foodsafety/i.test(mcpSource), 'mcpServer.ts does NOT authorize by email domain');

  // B: legacy demo bypass tokens are gone from server code
  assert(!/['"]demo-token['"]/.test(serverSource), 'server.ts no longer accepts demo-token');
  assert(!serverSource.includes("token.startsWith('demo-')"), 'server.ts no longer accepts demo-* tokens');

  // ---------------------------------------------------------------------------
  // D. Canonical anomaly types only.
  // ---------------------------------------------------------------------------
  console.log('\n[D] Canonical anomaly type model:');
  const engine = await import('./anomalyEngine');
  // The engine's exported default configs and evaluate paths only ever emit these two types.
  const seed = (await import('./bigquery/seed')).generateDeterministicSeed();
  const anomalyTypes = new Set(seed.anomalies.map(a => a.anomaly_type));
  const allowed = new Set(['MASS_BALANCE', 'IMPOSSIBLE_MOVEMENT']);
  let onlyCanonical = true;
  for (const t of anomalyTypes) {
    if (!allowed.has(t)) onlyCanonical = false;
  }
  assert(onlyCanonical, 'Seed anomaly types are only MASS_BALANCE | IMPOSSIBLE_MOVEMENT', `found=${[...anomalyTypes].join(',')}`);

  // Engine output type check on the anomalous batch
  const engineInstance = new engine.DeterministicAnomalyEngine();
  const batch3 = seed.batches.find(b => b.batch_id === 'BATCH-DEMO-003-ANOMALOUS')!;
  const batch3Events = seed.events.filter(e => e.batch_id === batch3.batch_id);
  const facilitiesMap = new Map(seed.facilities.map(f => [f.facility_id, f]));
  const anomalies = engineInstance.evaluateBatch(batch3.batch_id, batch3.initial_quantity_litres, batch3Events, facilitiesMap);
  assert(anomalies.length === 1 && anomalies[0].type === 'MASS_BALANCE', 'Engine emits canonical MASS_BALANCE for anomalous batch');

  console.log('\n===============================================================');
  console.log(`  Test Run Complete: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('===============================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal auth test error:', err);
  process.exit(1);
});
