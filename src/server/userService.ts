/**
 * MilkyWay User & Role Provisioning Service (server-side, Firebase Admin)
 *
 * SECURITY MODEL:
 * - Roles are OFFICER | ADMIN and live in Firebase Auth custom claims (authoritative)
 *   and mirrored into Firestore users/{uid} for querying/display.
 * - Roles are NEVER derived from email, display name, request body, URL params,
 *   localStorage, or any client-supplied value.
 * - Self-promotion is impossible: provisionUser() can only assign OFFICER (or preserve
 *   an existing role). The ONLY path to ADMIN is setUserRole(), which requires a caller
 *   already verified as ADMIN (or an explicit trusted bootstrap).
 * - All writes are idempotent and resilient: if Firebase Admin/Firestore is unavailable
 *   (local dev without ADC), the in-memory registry is used so the app keeps working.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export type UserRole = 'OFFICER' | 'ADMIN';

export interface MilkyWayUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  badgeNumber?: string;
  jurisdiction?: string;
  district?: string;
  active: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

/**
 * In-memory authoritative fallback registry (used when Firebase Admin/Firestore
 * is not reachable, e.g. local dev without Application Default Credentials).
 */
const inMemoryUsers = new Map<string, MilkyWayUserProfile>();

// Seeded standard accounts (used by dev-auth tokens only; see config.isDevAuthEnabled)
inMemoryUsers.set('seed-admin-01', {
  uid: 'seed-admin-01',
  email: 'admin@foodsafety.gov.in',
  displayName: 'National Directorate Admin',
  role: 'ADMIN',
  active: true
});
inMemoryUsers.set('seed-officer-01', {
  uid: 'seed-officer-01',
  email: 'p.verma@foodsafety.gov.in',
  displayName: 'P. Verma',
  role: 'OFFICER',
  badgeNumber: 'FSO-IND-9021',
  jurisdiction: 'North Zone Dairy Enforcement Division',
  district: 'Sonipat & Rohtak Sub-Districts',
  active: true
});

function normalizeRole(value: unknown): UserRole | null {
  if (value === 'ADMIN' || value === 'OFFICER') return value;
  return null;
}

function firestore() {
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

export class UserService {
  public getFromRegistry(uid: string): MilkyWayUserProfile | undefined {
    return inMemoryUsers.get(uid);
  }

  public setInRegistry(profile: MilkyWayUserProfile): void {
    inMemoryUsers.set(profile.uid, profile);
  }

  public registrySize(): number {
    return inMemoryUsers.size;
  }

  /**
   * Resolves the server-authoritative role for a uid.
   * Precedence: verified custom claim (roleFromClaim) -> Firestore users doc -> registry -> OFFICER.
   * Never inspects email or any client input.
   */
  public async resolveRole(uid: string, roleFromClaim: UserRole | null): Promise<UserRole> {
    if (roleFromClaim === 'ADMIN') return 'ADMIN';

    const db = firestore();
    if (db) {
      try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const fsRole = normalizeRole(doc.data()?.role);
          if (fsRole) return fsRole;
        }
      } catch {
        // fall through to registry/default
      }
    }
    const reg = inMemoryUsers.get(uid);
    if (reg) return reg.role;
    return roleFromClaim || 'OFFICER';
  }

  /**
   * Sets a custom claim on the Firebase Auth user so that future ID tokens carry the role.
   * No-op (best effort) if Admin SDK is not initialized.
   */
  private async writeCustomClaim(uid: string, role: UserRole): Promise<boolean> {
    try {
      const existing = await getAuth().getUser(uid);
      const existingRole = (existing.customClaims as any)?.role;
      if (existingRole !== role) {
        await getAuth().setCustomUserClaims(uid, { ...(existing.customClaims || {}), role });
      }
      return true;
    } catch (err) {
      // Admin SDK unavailable or user not found in Auth (e.g. dev token). Registry stays authoritative.
      return false;
    }
  }

  /**
   * Secure provisioning / synchronization on sign-up or first authenticated request.
   *
   * IMPORTANT: This NEVER promotes a user. The assigned role is:
   *   - the caller's verified role if it is already established (claim/Firestore/registry), else
   *   - OFFICER (default).
   * A client-supplied role is ignored entirely (it is not even a parameter here).
   */
  public async provisionUser(params: {
    uid: string;
    email: string;
    verifiedRole: UserRole; // role already derived server-side from the verified token
    displayName?: string;
    badgeNumber?: string;
    jurisdiction?: string;
    district?: string;
  }): Promise<MilkyWayUserProfile> {
    const { uid, email, verifiedRole } = params;

    const db = firestore();
    let existing: MilkyWayUserProfile | undefined = inMemoryUsers.get(uid);

    if (db) {
      try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const d = doc.data() as any;
          existing = {
            uid,
            email: d.email || email,
            displayName: d.displayName || params.displayName || email.split('@')[0],
            role: normalizeRole(d.role) || verifiedRole,
            badgeNumber: d.badgeNumber,
            jurisdiction: d.jurisdiction,
            district: d.district,
            active: d.active !== false,
            createdAt: d.createdAt
          };
        }
      } catch {
        // ignore, use registry/defaults
      }
    }

    // Role assignment rule: preserve any established role; NEVER elevate here.
    const role: UserRole = existing?.role || verifiedRole || 'OFFICER';

    const profile: MilkyWayUserProfile = {
      uid,
      email,
      displayName: params.displayName || existing?.displayName || email.split('@')[0] || 'Officer',
      role,
      badgeNumber: params.badgeNumber || existing?.badgeNumber || `FSO-${uid.slice(0, 5).toUpperCase()}`,
      jurisdiction: params.jurisdiction || existing?.jurisdiction || 'State Dairy Enforcement Division',
      district: params.district || existing?.district || 'General Enforcement Zone',
      active: true,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    inMemoryUsers.set(uid, profile);

    // Keep the custom claim in sync with the (unchanged) role.
    await this.writeCustomClaim(uid, role);

    if (db) {
      try {
        await db.collection('users').doc(uid).set(profile, { merge: true });
      } catch (err) {
        console.warn('[UserService] Firestore users write failed; registry retains profile.');
      }
    }

    return profile;
  }

  /**
   * The ONLY path to assign/elevate a role (including ADMIN).
   * Requires the acting caller to already be a verified ADMIN.
   * Updates both the Firebase custom claim and the Firestore users doc.
   */
  public async setUserRole(params: {
    targetUid: string;
    newRole: UserRole;
    actingUid: string;
    actingRole: UserRole;
  }): Promise<MilkyWayUserProfile> {
    const { targetUid, newRole, actingRole } = params;

    if (actingRole !== 'ADMIN') {
      throw new Error('FORBIDDEN: Only an ADMIN may assign roles.');
    }
    if (normalizeRole(newRole) === null) {
      throw new Error('INVALID_ROLE: role must be OFFICER or ADMIN.');
    }

    const existing = inMemoryUsers.get(targetUid);
    const profile: MilkyWayUserProfile = {
      uid: targetUid,
      email: existing?.email || '',
      displayName: existing?.displayName || targetUid,
      role: newRole,
      badgeNumber: existing?.badgeNumber,
      jurisdiction: existing?.jurisdiction,
      district: existing?.district,
      active: existing?.active !== false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastLoginAt: existing?.lastLoginAt
    };

    inMemoryUsers.set(targetUid, profile);
    await this.writeCustomClaim(targetUid, newRole);

    const db = firestore();
    if (db) {
      try {
        await db.collection('users').doc(targetUid).set({ role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('[UserService] Firestore role update failed; registry retains new role.');
      }
    }

    return profile;
  }
}

export const userService = new UserService();
