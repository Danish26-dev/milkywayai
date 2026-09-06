/**
 * MilkyWay Firestore Repository (server-side, Firebase Admin)
 *
 * Single canonical persistence layer for the five collections:
 *   users/{uid}
 *   cases/{caseId}
 *   alerts/{alertId}
 *   officer_notes/{noteId}
 *   chat_summaries/{summaryId}
 *
 * DESIGN:
 * - Every officer-owned document carries the ownership fields required for
 *   authorization (assignedOfficerUid / sharedWithUids / authorUid / officerUid).
 * - This layer performs raw persistence only. Ownership ENFORCEMENT is done by the
 *   calling services (server-side) AND by Firestore security rules. This layer never
 *   trusts a client-supplied owner id — callers must pass the verified UID.
 * - Resilient fallback: when Firebase Admin/Firestore is unavailable (local dev without
 *   ADC), an in-memory store is used so the app keeps working. Availability is explicit
 *   via isFirestoreAvailable().
 */

import { getFirestore } from 'firebase-admin/firestore';

export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'INSPECTION_REQUIRED' | 'RESOLVED';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';

export interface StoredOfficerNote {
  noteId: string;
  caseId: string;
  authorUid: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAlert {
  alertId: string;
  batchId: string;
  caseId?: string | null;
  assignedOfficerUid: string;
  severity: string;
  anomalyType: 'MASS_BALANCE' | 'IMPOSSIBLE_MOVEMENT' | string;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredChatSummary {
  summaryId: string;
  caseId: string;
  officerUid: string;
  summary: string;
  keyFindings: string[];
  actions: string[];
  createdAt: string;
  updatedAt: string;
}

function db() {
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

/**
 * Strips undefined recursively to prevent Firestore write errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(sanitizeForFirestore) as any;
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as any)) {
      if (v !== undefined) clean[k] = sanitizeForFirestore(v);
    }
    return clean as any;
  }
  return data;
}

/**
 * Generic in-memory fallback collection with the minimal query surface we need.
 */
class MemoryCollection<T extends Record<string, any>> {
  private store = new Map<string, T>();
  constructor(private idKey: keyof T) {}

  set(doc: T): T {
    this.store.set(String(doc[this.idKey]), doc);
    return doc;
  }
  get(id: string): T | null {
    return this.store.get(id) || null;
  }
  all(): T[] {
    return Array.from(this.store.values());
  }
  where(pred: (d: T) => boolean): T[] {
    return this.all().filter(pred);
  }
}

export class FirestoreRepository {
  private memNotes = new MemoryCollection<StoredOfficerNote>('noteId');
  private memAlerts = new MemoryCollection<StoredAlert>('alertId');
  private memSummaries = new MemoryCollection<StoredChatSummary>('summaryId');

  public isFirestoreAvailable(): boolean {
    return db() !== null;
  }

  // ---------------------------------------------------------------------------
  // officer_notes
  // ---------------------------------------------------------------------------
  public async createNote(note: StoredOfficerNote): Promise<StoredOfficerNote> {
    this.memNotes.set(note);
    const fs = db();
    if (fs) {
      try {
        await fs.collection('officer_notes').doc(note.noteId).set(sanitizeForFirestore(note));
      } catch (err) {
        console.warn('[FirestoreRepo] createNote fell back to memory.');
      }
    }
    return note;
  }

  public async listNotesForCase(caseId: string): Promise<StoredOfficerNote[]> {
    const fs = db();
    if (fs) {
      try {
        const snap = await fs.collection('officer_notes').where('caseId', '==', caseId).get();
        if (!snap.empty) {
          const rows = snap.docs.map(d => d.data() as StoredOfficerNote);
          rows.forEach(r => this.memNotes.set(r));
          return rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
      } catch (err) {
        console.warn('[FirestoreRepo] listNotesForCase fell back to memory.');
      }
    }
    return this.memNotes
      .where(n => n.caseId === caseId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // ---------------------------------------------------------------------------
  // alerts
  // ---------------------------------------------------------------------------
  public async upsertAlert(alert: StoredAlert): Promise<StoredAlert> {
    this.memAlerts.set(alert);
    const fs = db();
    if (fs) {
      try {
        await fs.collection('alerts').doc(alert.alertId).set(sanitizeForFirestore(alert), { merge: true });
      } catch (err) {
        console.warn('[FirestoreRepo] upsertAlert fell back to memory.');
      }
    }
    return alert;
  }

  public async getAlert(alertId: string): Promise<StoredAlert | null> {
    const fs = db();
    if (fs) {
      try {
        const doc = await fs.collection('alerts').doc(alertId).get();
        if (doc.exists) {
          const a = doc.data() as StoredAlert;
          this.memAlerts.set(a);
          return a;
        }
      } catch (err) {
        console.warn('[FirestoreRepo] getAlert fell back to memory.');
      }
    }
    return this.memAlerts.get(alertId);
  }

  /**
   * Lists alerts visible to an officer: those assigned to them, or (for ADMIN) all.
   */
  public async listAlertsForOfficer(officerUid: string, isAdmin: boolean): Promise<StoredAlert[]> {
    const fs = db();
    if (fs) {
      try {
        const col = fs.collection('alerts');
        const snap = isAdmin
          ? await col.get()
          : await col.where('assignedOfficerUid', '==', officerUid).get();
        const rows = snap.docs.map(d => d.data() as StoredAlert);
        rows.forEach(r => this.memAlerts.set(r));
        if (rows.length > 0 || isAdmin) {
          return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (err) {
        console.warn('[FirestoreRepo] listAlertsForOfficer fell back to memory.');
      }
    }
    return this.memAlerts
      .where(a => isAdmin || a.assignedOfficerUid === officerUid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateAlertStatus(alertId: string, status: AlertStatus): Promise<StoredAlert | null> {
    const existing = await this.getAlert(alertId);
    if (!existing) return null;
    const updated: StoredAlert = { ...existing, status, updatedAt: new Date().toISOString() };
    return this.upsertAlert(updated);
  }

  // ---------------------------------------------------------------------------
  // chat_summaries
  // ---------------------------------------------------------------------------
  public async upsertChatSummary(summary: StoredChatSummary): Promise<StoredChatSummary> {
    this.memSummaries.set(summary);
    const fs = db();
    if (fs) {
      try {
        await fs.collection('chat_summaries').doc(summary.summaryId).set(sanitizeForFirestore(summary), { merge: true });
      } catch (err) {
        console.warn('[FirestoreRepo] upsertChatSummary fell back to memory.');
      }
    }
    return summary;
  }

  public async getChatSummary(summaryId: string): Promise<StoredChatSummary | null> {
    const fs = db();
    if (fs) {
      try {
        const doc = await fs.collection('chat_summaries').doc(summaryId).get();
        if (doc.exists) {
          const s = doc.data() as StoredChatSummary;
          this.memSummaries.set(s);
          return s;
        }
      } catch (err) {
        console.warn('[FirestoreRepo] getChatSummary fell back to memory.');
      }
    }
    return this.memSummaries.get(summaryId);
  }

  public async getChatSummaryForCase(caseId: string): Promise<StoredChatSummary | null> {
    const fs = db();
    if (fs) {
      try {
        const snap = await fs.collection('chat_summaries').where('caseId', '==', caseId).limit(1).get();
        if (!snap.empty) {
          const s = snap.docs[0].data() as StoredChatSummary;
          this.memSummaries.set(s);
          return s;
        }
      } catch (err) {
        console.warn('[FirestoreRepo] getChatSummaryForCase fell back to memory.');
      }
    }
    const rows = this.memSummaries.where(s => s.caseId === caseId);
    return rows.length > 0 ? rows[0] : null;
  }
}

export const firestoreRepository = new FirestoreRepository();
