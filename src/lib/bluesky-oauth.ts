/**
 * src/lib/bluesky-oauth.ts
 *
 * Lazy singleton for NodeOAuthClient, and helpers for the Bluesky OAuth flow.
 *
 * API verified against:
 *   node_modules/@atproto/oauth-client-node/dist/node-oauth-client.d.ts
 *   node_modules/@atproto/oauth-client/dist/oauth-client.d.ts
 *   node_modules/@atproto/jwk-jose/dist/jose-key.d.ts
 *   node_modules/@atproto/jwk/dist/keyset.d.ts
 *
 * Key facts from the real types:
 *   - NodeOAuthClient constructor accepts { clientMetadata, keyset, stateStore, sessionStore, requestLock, ... }
 *   - keyset accepts Keyset | Iterable<Key | undefined | null | false>
 *   - JoseKey.fromJWK(input: string | Record<string,unknown>, kid?: string): Promise<JoseKey>
 *   - Keyset constructor: new Keyset(iterable: Iterable<K | null | undefined | false>)
 *   - requestLocalLock is exported from @atproto/oauth-client
 *
 * For local dev (no PUBLIC_URL):
 *   - client_id must be "http://localhost" or "http://localhost?..." (per types.d.ts)
 *   - redirect_uris must start with "http://127.0.0.1" (loopback) per AT Protocol spec
 *   - allowHttp: true must be set to allow HTTP communication
 *
 * ASSUMPTION: The loopback redirect goes to 127.0.0.1:{port} — we use port 3000.
 *   The AT Protocol server will redirect to http://127.0.0.1:3000/api/bluesky-oauth/callback
 *   which must be reachable. In Next.js dev this works since it listens on all interfaces.
 */

import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";
import { Keyset, requestLocalLock } from "@atproto/oauth-client";
import { Agent } from "@atproto/api";

import { getBlueskyOAuthKeyJwk } from "@/lib/secrets";
import { blueskyStateStore, blueskySessionStore } from "@/lib/bluesky-oauth-store";
import { getItem } from "@/lib/dynamo";

// ---------------------------------------------------------------------------
// Singleton cache
// ---------------------------------------------------------------------------
let _client: NodeOAuthClient | null = null;

/**
 * Lazily builds and caches a singleton NodeOAuthClient.
 * Must be called at request time (not module load time) because it is async
 * and depends on runtime env vars + Secrets Manager.
 */
export async function getBlueskyOAuthClient(): Promise<NodeOAuthClient> {
  if (_client) return _client;

  // 1. Load the private JWK from Secrets Manager (cached in secrets.ts)
  const jwk = await getBlueskyOAuthKeyJwk();

  // 2. Build a JoseKey from the JWK
  //    JoseKey.fromJWK accepts Record<string,unknown> per jose-key.d.ts
  const privateKey = await JoseKey.fromJWK(jwk, jwk.kid as string | undefined);

  // 3. Wrap in a Keyset
  //    Keyset constructor: Iterable<K | null | undefined | false>
  const keyset = new Keyset([privateKey]);

  const publicUrl = process.env.PUBLIC_URL;

  if (publicUrl) {
    // -----------------------------------------------------------------------
    // Production / staging — hosted client metadata
    // -----------------------------------------------------------------------
    _client = new NodeOAuthClient({
      clientMetadata: {
        // client_id must be a discoverable HTTPS URL that resolves to this JSON
        client_id: `${publicUrl}/api/bluesky-oauth/client-metadata.json`,
        client_name: "Signal",
        client_uri: publicUrl as `https://${string}`,
        redirect_uris: [`${publicUrl}/api/bluesky-oauth/callback`],
        scope: "atproto transition:generic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "private_key_jwt",
        token_endpoint_auth_signing_alg: "ES256",
        // jwks_uri is served by GET /api/bluesky-oauth/jwks.json
        jwks_uri: `${publicUrl}/api/bluesky-oauth/jwks.json`,
        dpop_bound_access_tokens: true,
        // ASSUMPTION: subject_type "public" is required for AT Protocol
        subject_type: "public",
        // ASSUMPTION: authorization_signed_response_alg required by ClientMetadata type
        authorization_signed_response_alg: "ES256",
      },
      keyset,
      stateStore: blueskyStateStore,
      sessionStore: blueskySessionStore,
      // Suppress the "no lock mechanism" warning in production by providing requestLocalLock.
      // In a multi-replica deployment you would want a distributed lock (e.g. DynamoDB-based).
      // ASSUMPTION: requestLocalLock is sufficient for single-instance deployments / Vercel
      //             serverless where each instance handles one request at a time.
      requestLock: requestLocalLock,
      responseMode: "query",
    });
  } else {
    // -----------------------------------------------------------------------
    // Local development — AT Protocol loopback client
    //
    // Per the AT Protocol OAuth spec and the verified types:
    //   - client_id MUST be "http://localhost" (or with query params)
    //   - redirect_uris MUST be loopback (127.0.0.1 or [::1])
    //   - allowHttp: true to allow HTTP connections to PDS/PLC
    // -----------------------------------------------------------------------
    _client = new NodeOAuthClient({
      clientMetadata: {
        // VERIFIED: "http://localhost" is one of the allowed literal values for client_id
        // when used with loopback redirect URIs (per types.d.ts ZodUnion)
        client_id: "http://localhost",
        client_name: "Signal (dev)",
        redirect_uris: ["http://127.0.0.1:3000/api/bluesky-oauth/callback"],
        scope: "atproto transition:generic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        // No token_endpoint_auth_method / jwks_uri for loopback clients —
        // loopback clients are treated as public clients (no client authentication).
        // ASSUMPTION: token_endpoint_auth_method defaults to "none" for loopback per AT Protocol.
        token_endpoint_auth_method: "none",
        dpop_bound_access_tokens: true,
        subject_type: "public",
        authorization_signed_response_alg: "ES256",
      },
      // No keyset for loopback (public client)
      stateStore: blueskyStateStore,
      sessionStore: blueskySessionStore,
      requestLock: requestLocalLock,
      responseMode: "query",
      // Required so the client can make HTTP connections to local PDS
      allowHttp: true,
    });
  }

  return _client;
}

// ---------------------------------------------------------------------------
// getUserBlueskyAgent
// ---------------------------------------------------------------------------

/**
 * Looks up the Bluesky DID linked to a Signal user, restores their OAuth session,
 * and returns an authenticated @atproto/api Agent.
 *
 * Returns null if:
 *   - The user has not connected their Bluesky account yet, or
 *   - The stored session cannot be restored (e.g. revoked)
 *
 * The returned Agent has a dpopFetch-based fetchHandler wired in via OAuthSession,
 * so it automatically handles DPoP token binding and silent token refresh.
 *
 * ASSUMPTION: Agent accepts a FetchHandler (function) that matches the signature
 *   (url: string, init?: RequestInit) => Promise<Response>
 *   — verified from agent.d.ts: constructor(options: SessionManager | FetchHandler | FetchHandlerOptions)
 */
export async function getUserBlueskyAgent(
  signalUserId: string
): Promise<Agent | null> {
  try {
    // 1. Look up the linked DID from DynamoDB
    const link = await getItem(`USER#${signalUserId}`, "BLUESKY_LINK");
    if (!link?.did) return null;

    const did = link.did as string;

    // 2. Get the OAuth client
    const client = await getBlueskyOAuthClient();

    // 3. Restore the OAuth session (will silently refresh token if needed)
    const oauthSession = await client.restore(did);

    // 4. Build an Agent using the OAuthSession's fetchHandler
    //    OAuthSession.fetchHandler: (pathname, init?) => Promise<Response>
    //    Agent's FetchHandler type: (url: string, init?: RequestInit) => Promise<Response>
    //    ASSUMPTION: OAuthSession.fetchHandler is compatible as a FetchHandler.
    //    The fetchHandler on OAuthSession takes (pathname, init) and constructs the
    //    full URL internally based on the PDS endpoint, which is what Agent expects.
    const agent = new Agent(oauthSession.fetchHandler.bind(oauthSession));

    return agent;
  } catch (err) {
    // Session not found or revoked — not connected
    console.error("[bluesky-oauth] getUserBlueskyAgent error:", err);
    return null;
  }
}
