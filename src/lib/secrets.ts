/**
 * src/lib/secrets.ts
 *
 * Fetches and in-memory caches the Bluesky OAuth ES256 JWK from AWS Secrets Manager.
 * The cache lives for the lifetime of the warm serverless instance (module-level singleton).
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// --------------------------------------------------------------------------
// Secrets Manager client (singleton per warm instance)
// --------------------------------------------------------------------------
const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// --------------------------------------------------------------------------
// In-memory cache (reset on cold start)
// --------------------------------------------------------------------------
let cachedJwk: Record<string, unknown> | null = null;

/**
 * Returns the ES256 JWK (including private "d" field) stored in Secrets Manager.
 * Caches the result in module-level memory for subsequent calls within the same
 * warm serverless instance.
 */
export async function getBlueskyOAuthKeyJwk(): Promise<Record<string, unknown>> {
  if (cachedJwk) return cachedJwk;

  const secretName =
    process.env.BLUESKY_OAUTH_KEY_SECRET_NAME ?? "signal-app/bluesky-oauth-key";

  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  const raw = response.SecretString;
  if (!raw) {
    throw new Error(
      `Secret "${secretName}" is empty or has no SecretString value.`
    );
  }

  cachedJwk = JSON.parse(raw) as Record<string, unknown>;
  return cachedJwk;
}
