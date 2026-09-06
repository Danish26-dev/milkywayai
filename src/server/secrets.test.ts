/**
 * MilkyWay — Gemini Auth & Secret-Leak Test Suite (Vertex AI + ADC)
 *
 * Verifies the Stage 3B authentication architecture and that no credentials leak:
 *  1. Production resolves to Vertex AI + ADC and does NOT require a Gemini API key.
 *  2. The agent /status route never returns a credential (reports mode/project only).
 *  3. If a local API key is set, it never appears in any API/investigation response.
 *  4. The Gemini key is never written to logs.
 *  5. Frontend source does not reference GEMINI_API_KEY.
 *  6. Server source contains no hardcoded Gemini API-key literal.
 *  7. When Gemini is unreachable, the agent returns AI_UNAVAILABLE (never fabricated output).
 *
 * Runs with NODE_ENV != 'production' by default; a sub-check flips to 'production'
 * to assert the Vertex-only, key-free selection, then restores the environment.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import express from 'express';
import { agentRouter } from './agent/agentRouter';
import { milkyWayInvestigationAgent } from './agent/investigationAgent';
import { resolveGeminiClientConfig, __resetGeminiAuthCache } from './geminiAuth';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string, details?: string) {
  if (cond) { console.log(`  ✓ PASS: ${name}`); passed++; }
  else { console.error(`  ✗ FAIL: ${name}`); if (details) console.error(`    ${details}`); failed++; }
}

const FAKE_KEY = 'TEST-SECRET-LEAK-CANARY-abcdef0123456789';

function listFilesRecursive(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'build'].includes(entry)) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listFilesRecursive(full, exts));
    else if (exts.some(e => entry.endsWith(e))) out.push(full);
  }
  return out;
}

async function startAgentApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/agent', agentRouter); // /status has no auth dependency; body inspected for leaks
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', () => resolve()));
  const port = (server.address() as any).port;
  return {
    baseUrl: `http://localhost:${port}`,
    close: () => new Promise<void>(resolve => server.close(() => resolve()))
  };
}

async function run() {
  console.log('===============================================================');
  console.log('  MilkyWay — Gemini Auth & Secret-Leak Test Suite (Vertex AI)');
  console.log('===============================================================');

  const savedNodeEnv = process.env.NODE_ENV;
  const savedKey = process.env.GEMINI_API_KEY;
  const savedUseVertex = process.env.GEMINI_USE_VERTEX;
  const savedProject = process.env.GOOGLE_CLOUD_PROJECT;

  // ---------------------------------------------------------------------------
  // 1. Production => Vertex AI + ADC, no API key required.
  // ---------------------------------------------------------------------------
  console.log('\n[1] Production resolves to Vertex AI + ADC (no API key):');
  process.env.NODE_ENV = 'production';
  process.env.GOOGLE_CLOUD_PROJECT = 'milkyway-507714';
  process.env.GEMINI_API_KEY = FAKE_KEY; // even if present, prod must NOT use it
  __resetGeminiAuthCache();
  const prodCfg = resolveGeminiClientConfig(true);
  assert(prodCfg.mode === 'vertex', 'Production auth mode is vertex', `mode=${prodCfg.mode}`);
  assert(prodCfg.project === 'milkyway-507714', 'Production uses project milkyway-507714');
  assert((prodCfg as any).apiKey === undefined, 'Production config carries NO api key');

  // Restore to a non-production test env.
  process.env.NODE_ENV = 'test';
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_USE_VERTEX;
  __resetGeminiAuthCache();

  // ---------------------------------------------------------------------------
  // 7. Unreachable Gemini (no ADC creds in CI) => AI_UNAVAILABLE, no fabrication.
  // ---------------------------------------------------------------------------
  console.log('\n[7] Unreachable Gemini -> AI_UNAVAILABLE (no fabrication):');
  const res = await milkyWayInvestigationAgent.processMessage(
    `secret-test-${Date.now()}`,
    'Investigate batch MW-10482.',
    'TEST-OFFICER'
  );
  assert(res.status === 'AI_UNAVAILABLE', 'Agent returns AI_UNAVAILABLE when Gemini unreachable', `status=${res.status}`);
  assert(res.brief === null, 'No fabricated brief when Gemini unreachable');
  assert(/temporarily unavailable/i.test(res.message), 'Safe AI_UNAVAILABLE message returned');

  // ---------------------------------------------------------------------------
  // 2 & 3. Credential never appears in /status or investigation responses.
  // Configure a local API key so we have a concrete secret to hunt for.
  // ---------------------------------------------------------------------------
  console.log('\n[2/3] Credentials never appear in API/investigation responses:');
  process.env.GEMINI_API_KEY = FAKE_KEY; // local dev key mode
  delete process.env.GEMINI_USE_VERTEX;
  __resetGeminiAuthCache();
  const localCfg = resolveGeminiClientConfig(true);
  assert(localCfg.mode === 'apikey', 'Local dev with key uses apikey mode');

  const { baseUrl, close } = await startAgentApp();
  try {
    const statusRes = await fetch(`${baseUrl}/api/agent/status`);
    const statusText = await statusRes.text();
    assert(!statusText.includes(FAKE_KEY), '/api/agent/status body does not contain the key');
    const statusJson = JSON.parse(statusText);
    assert(typeof statusJson.gemini_configured === 'boolean', '/status reports configured as boolean');
    assert(statusJson.gemini_auth_mode !== undefined, '/status reports auth mode label');
    assert(!JSON.stringify(statusJson).includes(FAKE_KEY), '/status JSON contains no key material');
  } finally {
    await close();
  }

  const invRes = await milkyWayInvestigationAgent.processMessage(
    `secret-test-inv-${Date.now()}`,
    'Investigate batch MW-10482.',
    'TEST-OFFICER'
  );
  const invSerialized = JSON.stringify({ message: invRes.message, brief: invRes.brief, toolCalls: invRes.toolCalls });
  assert(!invSerialized.includes(FAKE_KEY), 'Investigation response payload contains no key material');

  // ---------------------------------------------------------------------------
  // 4. No credential written to logs (during client init + a turn).
  // ---------------------------------------------------------------------------
  console.log('\n[4] Credentials never written to logs:');
  const logs: string[] = [];
  const origLog = console.log, origWarn = console.warn, origErr = console.error;
  console.log = (...a: any[]) => { logs.push(a.join(' ')); };
  console.warn = (...a: any[]) => { logs.push(a.join(' ')); };
  console.error = (...a: any[]) => { logs.push(a.join(' ')); };
  try {
    await milkyWayInvestigationAgent.processMessage(`secret-log-${Date.now()}`, 'Investigate batch MW-10482.', 'T');
  } finally {
    console.log = origLog; console.warn = origWarn; console.error = origErr;
  }
  assert(!logs.some(l => l.includes(FAKE_KEY)), 'No captured log line contains the key value');

  // Restore env.
  if (savedKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = savedKey;
  if (savedUseVertex === undefined) delete process.env.GEMINI_USE_VERTEX; else process.env.GEMINI_USE_VERTEX = savedUseVertex;
  if (savedProject === undefined) delete process.env.GOOGLE_CLOUD_PROJECT; else process.env.GOOGLE_CLOUD_PROJECT = savedProject;
  if (savedNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = savedNodeEnv;
  __resetGeminiAuthCache();

  // ---------------------------------------------------------------------------
  // 5. Frontend source must not reference GEMINI_API_KEY.
  // ---------------------------------------------------------------------------
  console.log('\n[5] Frontend source does not reference GEMINI_API_KEY:');
  const root = process.cwd();
  const frontendDirs = ['components', 'pages', 'context', 'lib', 'services'].map(d => path.join(root, 'src', d));
  let frontendLeak = false;
  const leakFiles: string[] = [];
  for (const dir of frontendDirs) {
    let files: string[] = [];
    try { files = listFilesRecursive(dir, ['.ts', '.tsx']); } catch { /* dir may not exist */ }
    for (const f of files) {
      if (/GEMINI_API_KEY/.test(readFileSync(f, 'utf8'))) { frontendLeak = true; leakFiles.push(f); }
    }
  }
  assert(!frontendLeak, 'No frontend file references GEMINI_API_KEY', leakFiles.join(', '));

  const clientConfig = readFileSync(path.join(root, 'firebase-applet-config.json'), 'utf8');
  assert(!/GEMINI|gemini/.test(clientConfig), 'firebase-applet-config.json contains no Gemini key');

  // ---------------------------------------------------------------------------
  // 6. Server source contains no hardcoded Gemini API-key literal (AIza...).
  // ---------------------------------------------------------------------------
  console.log('\n[6] No hardcoded Gemini credentials in server source:');
  const serverFiles = [
    path.join(root, 'server.ts'),
    ...listFilesRecursive(path.join(root, 'src', 'server'), ['.ts'])
  ].filter(f => !f.endsWith('.test.ts'));
  const AIZA = /AIza[0-9A-Za-z_\-]{35}/;
  let hardcoded = false;
  const hardcodedFiles: string[] = [];
  for (const f of serverFiles) {
    if (AIZA.test(readFileSync(f, 'utf8'))) { hardcoded = true; hardcodedFiles.push(f); }
  }
  assert(!hardcoded, 'No AIza... Gemini key literal found in server source', hardcodedFiles.join(', '));

  console.log('\n===============================================================');
  console.log(`  Gemini Auth & Secret Leak Suite Complete: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================');
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal secret-leak test error:', err);
  process.exit(1);
});
