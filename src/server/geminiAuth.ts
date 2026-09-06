/**
 * MilkyWay Gemini Authentication Provider (server-only)
 *
 * Resolves HOW the server authenticates to Gemini. Production uses **Vertex AI +
 * Application Default Credentials (ADC)** — NO API key, NO service-account JSON.
 *
 * Modes:
 *   'vertex'  -> new GoogleGenAI({ vertexai: true, project, location })
 *                Auth via ADC (Cloud Run runtime service account, or local
 *                `gcloud auth application-default login`). Calls aiplatform.googleapis.com.
 *   'apikey'  -> new GoogleGenAI({ apiKey })  (LOCAL-DEV convenience only)
 *                Calls generativelanguage.googleapis.com. Never used in production.
 *   'none'    -> Gemini is unavailable -> callers return AI_UNAVAILABLE (no fabrication).
 *
 * SELECTION:
 *   PRODUCTION (NODE_ENV === 'production'):
 *     Always Vertex AI + ADC. Requires a resolvable GCP project. A production
 *     GEMINI_API_KEY is NOT required and is ignored for auth selection.
 *   LOCAL DEVELOPMENT:
 *     - Vertex AI by default when a project is resolvable (uses ADC), OR
 *     - API key mode if GEMINI_API_KEY is set AND GEMINI_USE_VERTEX !== 'true'.
 *     Set GEMINI_USE_VERTEX=true to force Vertex locally (matches production).
 *
 * SECURITY: never logs credentials, never returns an API key through any API
 * response, never exposes anything to the browser.
 */

export type GeminiAuthMode = 'vertex' | 'apikey' | 'none';

export interface GeminiClientConfig {
  mode: GeminiAuthMode;
  /** GCP project id (vertex mode). */
  project?: string;
  /** Vertex AI location/region (vertex mode). */
  location?: string;
  /** API key (apikey mode, local dev only). Never surfaced outside the GoogleGenAI client. */
  apiKey?: string;
}

// Default GCP project for this deployment.
export const DEFAULT_GCP_PROJECT = 'milkyway-507714';
// Default Vertex AI region. Overridable via GEMINI_LOCATION.
export const DEFAULT_VERTEX_LOCATION = 'us-central1';

const PLACEHOLDER_KEY = 'MY_GEMINI_API_KEY';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function resolveProjectId(): string | undefined {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.BIGQUERY_PROJECT_ID ||
    DEFAULT_GCP_PROJECT ||
    undefined
  );
}

export function resolveVertexLocation(): string {
  return (
    (process.env.GEMINI_LOCATION && process.env.GEMINI_LOCATION.trim()) ||
    (process.env.VERTEX_LOCATION && process.env.VERTEX_LOCATION.trim()) ||
    (process.env.GOOGLE_CLOUD_LOCATION && process.env.GOOGLE_CLOUD_LOCATION.trim()) ||
    DEFAULT_VERTEX_LOCATION
  );
}

function localApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY;
  if (key && key.trim().length > 0 && key.trim() !== PLACEHOLDER_KEY) {
    return key.trim();
  }
  return undefined;
}

let cached: GeminiClientConfig | undefined;

/**
 * Resolves the Gemini client configuration for the current environment.
 * Cached in-process; call with forceRefresh=true (or __resetGeminiAuthCache in tests)
 * after environment changes.
 */
export function resolveGeminiClientConfig(forceRefresh = false): GeminiClientConfig {
  if (!forceRefresh && cached) return cached;

  let cfg: GeminiClientConfig;

  if (isProduction()) {
    // Production: Vertex AI + ADC only. No API key. Requires a project.
    const project = resolveProjectId();
    cfg = project
      ? { mode: 'vertex', project, location: resolveVertexLocation() }
      : { mode: 'none' };
  } else {
    // Local development.
    const project = resolveProjectId();
    const key = localApiKey();
    const preferVertex = process.env.GEMINI_USE_VERTEX === 'true';

    if (preferVertex && project) {
      cfg = { mode: 'vertex', project, location: resolveVertexLocation() };
    } else if (key) {
      // Developer convenience: explicit key uses the Gemini Developer API locally.
      cfg = { mode: 'apikey', apiKey: key };
    } else if (project) {
      // Default local path mirrors production: Vertex AI via ADC.
      cfg = { mode: 'vertex', project, location: resolveVertexLocation() };
    } else {
      cfg = { mode: 'none' };
    }
  }

  cached = cfg;
  return cfg;
}

/**
 * Whether AI reasoning is configured to be available. For Vertex mode this reflects
 * configuration (project resolved); actual reachability is confirmed when a request runs
 * and, on failure, callers return AI_UNAVAILABLE (never fabricated output).
 */
export function isGeminiConfigured(): boolean {
  return resolveGeminiClientConfig().mode !== 'none';
}

/** A non-sensitive description of the current auth mode, safe to expose in /status. */
export function geminiAuthSummary(): {
  mode: GeminiAuthMode;
  vertex: boolean;
  project?: string;
  location?: string;
} {
  const c = resolveGeminiClientConfig();
  return {
    mode: c.mode,
    vertex: c.mode === 'vertex',
    project: c.mode === 'vertex' ? c.project : undefined,
    location: c.mode === 'vertex' ? c.location : undefined
  };
}

/** Test-only: clears the cached config so env changes take effect. */
export function __resetGeminiAuthCache(): void {
  cached = undefined;
}
