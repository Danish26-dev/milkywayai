/**
 * MilkyWay — Firestore Security Rules Emulator Test Suite (Stage 2.5)
 *
 * Machine-verifies the REAL firestore.rules through the Firebase Firestore Emulator
 * using @firebase/rules-unit-testing. Authorization is NEVER mocked — every assertion
 * exercises the actual compiled rules with authenticated contexts carrying custom claims.
 *
 * REQUIREMENTS TO RUN:
 *   - A Java runtime (the Firestore emulator is a Java application).
 *   - firebase-tools (installed as a devDependency).
 * Start via:  npm run test:rules      (uses `firebase emulators:exec`)
 *
 * Contexts (with custom claims, exactly as production ID tokens would carry):
 *   - officerA : { role: 'OFFICER' }
 *   - officerB : { role: 'OFFICER' }
 *   - admin    : { role: 'ADMIN' }
 *   - noRole   : authenticated but no role claim (should be denied everywhere)
 */

import { readFileSync } from 'fs';
import path from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const PROJECT_ID = 'milkyway-rules-test';
const OFFICER_A = 'officerA';
const OFFICER_B = 'officerB';
const ADMIN = 'adminUser';

let passed = 0;
let failed = 0;

function record(ok: boolean, name: string, err?: any) {
  if (ok) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}`);
    if (err) console.error(`    ${err?.message || err}`);
    failed++;
  }
}

async function expectAllow(p: Promise<any>, name: string) {
  try { await assertSucceeds(p); record(true, name); }
  catch (e) { record(false, name, e); }
}
async function expectDeny(p: Promise<any>, name: string) {
  try { await assertFails(p); record(true, name); }
  catch (e) { record(false, name, e); }
}

function ctxDb(env: RulesTestEnvironment, uid: string | null, claims?: Record<string, any>) {
  if (!uid) return env.unauthenticatedContext().firestore();
  return env.authenticatedContext(uid, claims).firestore();
}

async function seed(env: RulesTestEnvironment) {
  // Seed fixtures with rules DISABLED (privileged), mirroring server/Admin-SDK writes.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    // users
    await setDoc(doc(db, 'users', OFFICER_A), { uid: OFFICER_A, role: 'OFFICER', displayName: 'Officer A' });
    await setDoc(doc(db, 'users', OFFICER_B), { uid: OFFICER_B, role: 'OFFICER', displayName: 'Officer B' });
    await setDoc(doc(db, 'users', ADMIN), { uid: ADMIN, role: 'ADMIN', displayName: 'Admin' });

    // cases
    await setDoc(doc(db, 'cases', 'CASE-A'), {
      caseId: 'CASE-A', batchId: 'MW-A', assignedOfficerUid: OFFICER_A, sharedWithUids: [],
      facilityId: 'FAC-1', primaryAnomaly: 'MASS_BALANCE', severity: 'HIGH', status: 'OPEN'
    });
    await setDoc(doc(db, 'cases', 'CASE-B'), {
      caseId: 'CASE-B', batchId: 'MW-B', assignedOfficerUid: OFFICER_B, sharedWithUids: [],
      facilityId: 'FAC-2', primaryAnomaly: 'MASS_BALANCE', severity: 'HIGH', status: 'OPEN'
    });
    await setDoc(doc(db, 'cases', 'CASE-SHARED'), {
      caseId: 'CASE-SHARED', batchId: 'MW-S', assignedOfficerUid: OFFICER_B, sharedWithUids: [OFFICER_A],
      facilityId: 'FAC-3', primaryAnomaly: 'MASS_BALANCE', severity: 'MEDIUM', status: 'OPEN'
    });

    // officer_notes
    await setDoc(doc(db, 'officer_notes', 'NOTE-A'), { noteId: 'NOTE-A', caseId: 'CASE-A', authorUid: OFFICER_A, content: 'a' });
    await setDoc(doc(db, 'officer_notes', 'NOTE-B'), { noteId: 'NOTE-B', caseId: 'CASE-B', authorUid: OFFICER_B, content: 'b' });

    // chat_summaries
    await setDoc(doc(db, 'chat_summaries', 'SUM-A'), { summaryId: 'SUM-A', caseId: 'CASE-A', officerUid: OFFICER_A, summary: 'sa' });
    await setDoc(doc(db, 'chat_summaries', 'SUM-B'), { summaryId: 'SUM-B', caseId: 'CASE-B', officerUid: OFFICER_B, summary: 'sb' });

    // alerts
    await setDoc(doc(db, 'alerts', 'ALERT-A'), { alertId: 'ALERT-A', batchId: 'MW-A', assignedOfficerUid: OFFICER_A, severity: 'CRITICAL', anomalyType: 'MASS_BALANCE', status: 'NEW' });
    await setDoc(doc(db, 'alerts', 'ALERT-B'), { alertId: 'ALERT-B', batchId: 'MW-B', assignedOfficerUid: OFFICER_B, severity: 'HIGH', anomalyType: 'MASS_BALANCE', status: 'NEW' });
  });
}

async function run() {
  console.log('===============================================================');
  console.log('  MilkyWay — Firestore Security Rules Emulator Test Suite');
  console.log('===============================================================');

  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8')
    }
  });

  await env.clearFirestore();
  await seed(env);

  const a = ctxDb(env, OFFICER_A, { role: 'OFFICER' });
  const b = ctxDb(env, OFFICER_B, { role: 'OFFICER' });
  const admin = ctxDb(env, ADMIN, { role: 'ADMIN' });
  const noRole = ctxDb(env, 'noRoleUser', {}); // authenticated, no role claim

  // ---------------------------------------------------------------------------
  // 3. USERS
  // ---------------------------------------------------------------------------
  console.log('\n[USERS]');
  await expectAllow(getDoc(doc(a, 'users', OFFICER_A)), 'officerA reads own profile');
  await expectDeny(getDoc(doc(a, 'users', OFFICER_B)), 'officerA cannot read officerB profile');
  await expectAllow(getDoc(doc(admin, 'users', OFFICER_A)), 'admin can read any profile');

  await expectDeny(updateDoc(doc(a, 'users', OFFICER_A), { role: 'ADMIN' }), 'officerA cannot promote self to ADMIN');
  await expectDeny(updateDoc(doc(a, 'users', OFFICER_A), { uid: 'someone-else' }), 'officerA cannot change own uid');
  await expectAllow(updateDoc(doc(a, 'users', OFFICER_A), { displayName: 'A Renamed' }), 'officerA can update non-authorization field');
  await expectDeny(updateDoc(doc(a, 'users', OFFICER_B), { role: 'ADMIN' }), 'officerA cannot modify officerB role');
  // A no-role authenticated user cannot read arbitrary profiles.
  await expectDeny(getDoc(doc(noRole, 'users', OFFICER_A)), 'no-role user cannot read another profile');
  // Self-create cannot grant a privileged role.
  const cCreate = ctxDb(env, 'freshUser', { role: 'OFFICER' });
  await expectDeny(setDoc(doc(cCreate, 'users', 'freshUser'), { uid: 'freshUser', role: 'ADMIN' }), 'self-create cannot grant ADMIN');
  await expectAllow(setDoc(doc(cCreate, 'users', 'freshUser'), { uid: 'freshUser', role: 'OFFICER' }), 'self-create with OFFICER allowed');

  // ---------------------------------------------------------------------------
  // 4. CASES
  // ---------------------------------------------------------------------------
  console.log('\n[CASES]');
  await expectAllow(getDoc(doc(a, 'cases', 'CASE-A')), 'officerA reads own case');
  await expectDeny(getDoc(doc(a, 'cases', 'CASE-B')), 'officerA cannot read officerB private case');
  await expectAllow(getDoc(doc(a, 'cases', 'CASE-SHARED')), 'officerA reads case shared with them');
  await expectAllow(getDoc(doc(admin, 'cases', 'CASE-B')), 'admin reads any case');

  await expectDeny(
    updateDoc(doc(a, 'cases', 'CASE-A'), { assignedOfficerUid: OFFICER_B }),
    'officerA cannot reassign own case to officerB (no hijack)'
  );
  await expectAllow(
    updateDoc(doc(a, 'cases', 'CASE-A'), { status: 'UNDER_REVIEW' }),
    'officerA can update own case status'
  );
  await expectDeny(
    updateDoc(doc(a, 'cases', 'CASE-B'), { status: 'RESOLVED' }),
    'officerA cannot update officerB case'
  );
  await expectDeny(
    setDoc(doc(a, 'cases', 'CASE-NEW-A'), { caseId: 'CASE-NEW-A', batchId: 'MW-N', assignedOfficerUid: OFFICER_B, sharedWithUids: [] }),
    'officerA cannot create a case assigned to officerB'
  );
  await expectAllow(
    setDoc(doc(a, 'cases', 'CASE-NEW-A2'), { caseId: 'CASE-NEW-A2', batchId: 'MW-N2', assignedOfficerUid: OFFICER_A, sharedWithUids: [] }),
    'officerA can create a case assigned to themselves'
  );
  await expectAllow(
    updateDoc(doc(admin, 'cases', 'CASE-A'), { assignedOfficerUid: OFFICER_B }),
    'admin can reassign a case'
  );

  // ---------------------------------------------------------------------------
  // 5. OFFICER NOTES
  // ---------------------------------------------------------------------------
  console.log('\n[OFFICER_NOTES]');
  await expectAllow(
    setDoc(doc(a, 'officer_notes', 'NOTE-A-NEW'), { noteId: 'NOTE-A-NEW', caseId: 'CASE-A', authorUid: OFFICER_A, content: 'x' }),
    'officerA creates a note with own authorUid'
  );
  await expectDeny(
    setDoc(doc(a, 'officer_notes', 'NOTE-IMPERSONATE'), { noteId: 'NOTE-IMPERSONATE', caseId: 'CASE-A', authorUid: OFFICER_B, content: 'x' }),
    'officerA cannot create a note impersonating officerB authorUid'
  );
  await expectAllow(getDoc(doc(a, 'officer_notes', 'NOTE-A')), 'officerA reads own note');
  await expectDeny(getDoc(doc(a, 'officer_notes', 'NOTE-B')), 'officerA cannot read officerB note');
  await expectDeny(
    updateDoc(doc(b, 'officer_notes', 'NOTE-B'), { authorUid: OFFICER_A }),
    'note author cannot change authorUid'
  );

  // ---------------------------------------------------------------------------
  // 6. CHAT SUMMARIES
  // ---------------------------------------------------------------------------
  console.log('\n[CHAT_SUMMARIES]');
  await expectAllow(getDoc(doc(a, 'chat_summaries', 'SUM-A')), 'officerA reads own summary');
  await expectDeny(getDoc(doc(a, 'chat_summaries', 'SUM-B')), 'officerA cannot read officerB summary');
  await expectDeny(
    setDoc(doc(a, 'chat_summaries', 'SUM-IMP'), { summaryId: 'SUM-IMP', caseId: 'CASE-A', officerUid: OFFICER_B, summary: 'x' }),
    'officerA cannot create a summary claiming officerB officerUid'
  );
  await expectAllow(
    setDoc(doc(a, 'chat_summaries', 'SUM-A-NEW'), { summaryId: 'SUM-A-NEW', caseId: 'CASE-A', officerUid: OFFICER_A, summary: 'x' }),
    'officerA creates a summary with own officerUid'
  );

  // ---------------------------------------------------------------------------
  // 7. ALERTS
  // ---------------------------------------------------------------------------
  console.log('\n[ALERTS]');
  await expectAllow(getDoc(doc(a, 'alerts', 'ALERT-A')), 'officerA reads own alert');
  await expectDeny(getDoc(doc(a, 'alerts', 'ALERT-B')), 'officerA cannot read officerB alert');
  await expectDeny(
    updateDoc(doc(a, 'alerts', 'ALERT-B'), { status: 'RESOLVED' }),
    'officerA cannot modify officerB alert'
  );
  await expectAllow(
    updateDoc(doc(a, 'alerts', 'ALERT-A'), { status: 'ACKNOWLEDGED' }),
    'officerA can update own alert status'
  );
  await expectDeny(
    updateDoc(doc(a, 'alerts', 'ALERT-A'), { assignedOfficerUid: OFFICER_B }),
    'officerA cannot reassign own alert to officerB'
  );
  await expectAllow(getDoc(doc(admin, 'alerts', 'ALERT-B')), 'admin reads any alert');

  await env.cleanup();

  console.log('\n===============================================================');
  console.log(`  Rules Emulator Suite Complete: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================');
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal rules emulator test error:', err);
  process.exit(1);
});
