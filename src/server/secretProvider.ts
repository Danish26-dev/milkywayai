/**
 * MilkyWay Secret Provider (server-only) — GENERIC Google Secret Manager accessor.
 *
 * NOTE (Stage 3B): Gemini authentication NO LONGER uses an API key or Secret Manager.
 * Production Gemini access is via Vertex AI + Application Default Credentials
 * (see geminiAuth.ts / geminiClient.ts). This module is retained for GENUINE future
 * secrets (e.g. third-party API tokens) and is intentionally NOT used to store a
 * Gemini API key.
 *
 * SECURITY:
 *   - Uses ADC (Cloud Run runtime service account, or local
 *     `gcloud auth application-default login`). No service-account JSON key.
 *   - Secret values are never logged, never returned through an API response, and
 *     never sent to the browser.
 */

function resolveProjectId(): string | undefined {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.BIGQUERY_PROJECT_ID ||
    undefined
  );
}

/**
 * Reads the latest version of a named secret from Google Secret Manager using ADC.
 * Returns null on any failure (missing secret, no credentials, no project).
 * The client is imported lazily so environments without credentials are unaffected
 * until this path is actually exercised.
 */
export async function accessSecret(secretId: string): Promise<string | null> {
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();

    const projectId = resolveProjectId() || (await client.getProjectId().catch(() => undefined));
    if (!projectId) {
      console.warn('[SecretProvider] No GCP project id resolved; cannot access Secret Manager.');
      return null;
    }

    const name = `projects/${projectId}/secrets/${secretId}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (payload && payload.trim().length > 0) {
      return payload.trim();
    }
    console.warn(`[SecretProvider] Secret '${secretId}' returned an empty payload.`);
    return null;
  } catch (err: any) {
    // Log a short reason only; never the secret or full request metadata.
    console.warn(`[SecretProvider] Secret Manager access failed (${err?.code || 'unknown error'}).`);
    return null;
  }
}
