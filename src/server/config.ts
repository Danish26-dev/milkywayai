/**
 * MilkyWay Centralized Server Configuration
 *
 * Single source of truth for environment-driven server settings:
 * - Gemini model selection (GEMINI_MODEL)
 * - Development authentication gating (ENABLE_DEV_AUTH)
 *
 * SECURITY INVARIANTS:
 * 1. Development / test authentication is ONLY active when BOTH:
 *      - process.env.NODE_ENV !== 'production'
 *      - process.env.ENABLE_DEV_AUTH === 'true'
 *    It is therefore impossible to activate accidentally in production, because
 *    NODE_ENV === 'production' hard-disables it regardless of ENABLE_DEV_AUTH.
 * 2. No secrets are stored here. Only names/flags read from the environment.
 */

/**
 * Returns true only when development authentication shortcuts are permitted.
 * Production ALWAYS returns false, even if ENABLE_DEV_AUTH is mistakenly set.
 */
export function isDevAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_AUTH === 'true';
}

/**
 * Single canonical Gemini model name.
 * Configured via GEMINI_MODEL; defaults to a currently supported model.
 * Never hardcode model names elsewhere — import GEMINI_MODEL instead.
 */
export const GEMINI_MODEL: string =
  (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) || 'gemini-2.5-flash';

/**
 * Gemini authentication is provided by the server-only Gemini auth provider.
 * Production uses Vertex AI + Application Default Credentials (no API key).
 * These are re-exported so callers have a single configuration entry point.
 * @see ./geminiAuth  @see ./geminiClient
 */
export {
  resolveGeminiClientConfig,
  isGeminiConfigured,
  geminiAuthSummary,
  DEFAULT_GCP_PROJECT,
  DEFAULT_VERTEX_LOCATION
} from './geminiAuth';
export { createGeminiClient } from './geminiClient';
