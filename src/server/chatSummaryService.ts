/**
 * MilkyWay Chat Summary Service (server-side)
 *
 * Generates and persists automatic investigation-conversation summaries to
 * chat_summaries/{summaryId}.
 *
 * SECURITY & INTEGRITY:
 * - officerUid ALWAYS comes from the verified token (never the client).
 * - A summary is only created for a case the caller is authorized to access.
 * - The summary is generated from the ACTUAL conversation content.
 * - If Gemini is unavailable, NO fake summary is created (returns null).
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from './config';
import { createGeminiClient } from './geminiClient';
import { firestoreRepository, StoredChatSummary } from './firestoreRepository';
import { caseService, CaseChatMessage } from './caseService';
import { MANDATORY_DISCLAIMER } from './agent/investigationAgent';

// Only summarize once the conversation has enough substance.
const MIN_MESSAGES_FOR_SUMMARY = 2;

interface SummaryContent {
  summary: string;
  keyFindings: string[];
  actions: string[];
}

export class ChatSummaryService {
  private aiClient: GoogleGenAI | null = null;

  private async ensureClient(): Promise<GoogleGenAI | null> {
    if (this.aiClient) return this.aiClient;
    // Vertex AI + ADC (prod) or key (local dev). Returns null when unconfigured.
    this.aiClient = createGeminiClient();
    return this.aiClient;
  }

  /**
   * Builds a summary from the real conversation via Gemini.
   * Returns null if Gemini is unavailable or errors — NEVER fabricates.
   */
  private async summarizeConversation(messages: CaseChatMessage[]): Promise<SummaryContent | null> {
    const client = await this.ensureClient();
    if (!client) return null;

    const transcript = messages
      .map(m => `${m.role === 'user' ? 'Officer' : 'Agent'}: ${m.content}`)
      .join('\n');

    const prompt = `Summarize the following food-safety supply-chain investigation conversation.
Return STRICT JSON with keys: "summary" (string), "keyFindings" (string[]), "actions" (string[]).
Only use information present in the conversation. Do NOT invent facts, numbers, or conclusions.
Do NOT state or imply that adulteration was proven. This is anomaly detection and inspection prioritization.

CONVERSATION:
${transcript}`;

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.2 }
      });
      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings.map(String) : [],
        actions: Array.isArray(parsed.actions) ? parsed.actions.map(String) : []
      };
    } catch (err) {
      // Model error -> no fake summary.
      return null;
    }
  }

  /**
   * Creates/updates the chat summary for a case at a meaningful checkpoint.
   * Returns null when: not authorized, case missing, too few messages, or AI unavailable.
   * Throws 'FORBIDDEN'/'NOT_FOUND' for authorization/existence problems.
   */
  public async upsertSummaryForCase(params: {
    caseId: string;
    authUid: string;
    isAdmin: boolean;
  }): Promise<StoredChatSummary | null> {
    const { caseId, authUid, isAdmin } = params;

    const { case: c, forbidden } = await caseService.getCaseForOfficer(caseId, authUid, isAdmin);
    if (forbidden) throw new Error('FORBIDDEN: Not authorized to summarize this case.');
    if (!c) throw new Error('NOT_FOUND: Case not found.');

    const messages = c.chatHistory || [];
    if (messages.length < MIN_MESSAGES_FOR_SUMMARY) return null;

    const content = await this.summarizeConversation(messages);
    if (!content || !content.summary.trim()) {
      // Gemini unavailable or produced nothing usable — do NOT create a fake summary.
      return null;
    }

    const existing = await firestoreRepository.getChatSummaryForCase(c.id);
    const now = new Date().toISOString();
    const summary: StoredChatSummary = {
      summaryId: existing?.summaryId || `SUM-${c.id}`,
      caseId: c.id,
      // Ownership: the summary belongs to the case's assigned officer.
      officerUid: c.assignedOfficerUid,
      summary: `${content.summary}\n\n${MANDATORY_DISCLAIMER}`,
      keyFindings: content.keyFindings,
      actions: content.actions,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    return firestoreRepository.upsertChatSummary(summary);
  }

  /**
   * Fetches a case's summary if the caller is authorized to access the case.
   */
  public async getSummaryForCase(params: {
    caseId: string;
    authUid: string;
    isAdmin: boolean;
  }): Promise<StoredChatSummary | null> {
    const { caseId, authUid, isAdmin } = params;
    const { case: c, forbidden } = await caseService.getCaseForOfficer(caseId, authUid, isAdmin);
    if (forbidden) throw new Error('FORBIDDEN: Not authorized to read this summary.');
    if (!c) throw new Error('NOT_FOUND: Case not found.');
    return firestoreRepository.getChatSummaryForCase(c.id);
  }
}

export const chatSummaryService = new ChatSummaryService();
