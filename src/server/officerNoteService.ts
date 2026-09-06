/**
 * MilkyWay Officer Notes Service (server-side)
 *
 * Persists officer notes to officer_notes/{noteId}.
 * SECURITY:
 * - authorUid ALWAYS comes from the verified Firebase token (never the client body).
 * - A note can only be created for a case the caller is authorized to access.
 * - Reads are scoped to the case's authorized viewers.
 */

import { firestoreRepository, StoredOfficerNote } from './firestoreRepository';
import { caseService } from './caseService';

export class OfficerNoteService {
  /**
   * Creates a note for a case the caller is authorized to access.
   * Throws 'NOT_FOUND' or 'FORBIDDEN' accordingly.
   */
  public async createNote(params: {
    caseId: string;
    authUid: string;
    isAdmin: boolean;
    content: string;
  }): Promise<StoredOfficerNote> {
    const { caseId, authUid, isAdmin, content } = params;

    const { case: c, forbidden } = await caseService.getCaseForOfficer(caseId, authUid, isAdmin);
    if (forbidden) throw new Error('FORBIDDEN: Not authorized to add notes to this case.');
    if (!c) throw new Error('NOT_FOUND: Case not found.');

    const now = new Date().toISOString();
    const note: StoredOfficerNote = {
      noteId: `NOTE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      caseId: c.id,
      authorUid: authUid, // verified token UID only
      content: content.trim(),
      createdAt: now,
      updatedAt: now
    };

    return firestoreRepository.createNote(note);
  }

  /**
   * Lists notes for a case the caller is authorized to access.
   */
  public async listNotes(params: {
    caseId: string;
    authUid: string;
    isAdmin: boolean;
  }): Promise<StoredOfficerNote[]> {
    const { caseId, authUid, isAdmin } = params;
    const { case: c, forbidden } = await caseService.getCaseForOfficer(caseId, authUid, isAdmin);
    if (forbidden) throw new Error('FORBIDDEN: Not authorized to read notes for this case.');
    if (!c) throw new Error('NOT_FOUND: Case not found.');
    return firestoreRepository.listNotesForCase(c.id);
  }
}

export const officerNoteService = new OfficerNoteService();
