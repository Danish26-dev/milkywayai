/**
 * MilkyWay Gemini client factory (server-only)
 *
 * Builds a @google/genai client from the resolved GeminiClientConfig.
 * - Vertex AI mode: { vertexai: true, project, location } — auth via ADC, no API key.
 * - API key mode (local dev only): { apiKey }.
 * Returns null when Gemini is not configured ('none'), so callers return AI_UNAVAILABLE.
 *
 * Never logs credentials.
 */

import { GoogleGenAI } from '@google/genai';
import { resolveGeminiClientConfig } from './geminiAuth';

export function createGeminiClient(forceRefresh = false): GoogleGenAI | null {
  const cfg = resolveGeminiClientConfig(forceRefresh);
  try {
    if (cfg.mode === 'vertex' && cfg.project) {
      return new GoogleGenAI({ vertexai: true, project: cfg.project, location: cfg.location });
    }
    if (cfg.mode === 'apikey' && cfg.apiKey) {
      return new GoogleGenAI({ apiKey: cfg.apiKey });
    }
    return null;
  } catch (err: any) {
    console.warn(`[GeminiClient] Failed to initialize (${err?.code || 'unknown error'}).`);
    return null;
  }
}
