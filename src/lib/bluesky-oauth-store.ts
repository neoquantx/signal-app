/**
 * src/lib/bluesky-oauth-store.ts
 *
 * DynamoDB-backed implementations of the NodeSavedStateStore and
 * NodeSavedSessionStore interfaces required by NodeOAuthClient.
 *
 * Verified against:
 *   node_modules/@atproto/oauth-client-node/dist/node-dpop-store.d.ts
 *   node_modules/@atproto-labs/simple-store/dist/simple-store.d.ts
 *
 * SimpleStore<K, V> requires: get(key, opts?) / set(key, value) / del(key)
 *
 * NodeSavedState  = ToDpopJwkValue<InternalStateData>
 *   => { iss, dpopJwk (Jwk), authMethod, verifier, appState? }
 *
 * NodeSavedSession = ToDpopJwkValue<Session>
 *   => { dpopJwk (Jwk), authMethod, tokenSet }
 */

import type {
  NodeSavedState,
  NodeSavedStateStore,
  NodeSavedSession,
  NodeSavedSessionStore,
} from "@atproto/oauth-client-node";

import { putItem, getItem, deleteItem } from "@/lib/dynamo";

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------
function stateKey(key: string) {
  return { PK: `BLUESKY_OAUTH_STATE#${key}`, SK: "STATE" };
}

function sessionKey(sub: string) {
  return { PK: `BLUESKY_OAUTH_SESSION#${sub}`, SK: "SESSION" };
}

// ---------------------------------------------------------------------------
// State Store — TTL 10 minutes (DynamoDB TTL on "ttl" attribute)
// ---------------------------------------------------------------------------
export const blueskyStateStore: NodeSavedStateStore = {
  async get(key) {
    const item = await getItem(
      `BLUESKY_OAUTH_STATE#${key}`,
      "STATE"
    );
    if (!item) return undefined;

    // Deserialise: DynamoDB stores dpopJwk as a plain JSON string or object.
    // We stored it as JSON.stringify so parse it back.
    const { PK, SK, ttl, dpopJwk, ...rest } = item as Record<string, unknown>;
    return {
      ...rest,
      dpopJwk:
        typeof dpopJwk === "string" ? JSON.parse(dpopJwk) : dpopJwk,
    } as NodeSavedState;
  },

  async set(key, value) {
    const ttl = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
    const { PK, SK } = stateKey(key);
    await putItem({
      PK,
      SK,
      ttl,
      // Serialise dpopJwk (Jwk object) as a JSON string for safe DynamoDB storage
      ...value,
      dpopJwk: JSON.stringify(value.dpopJwk),
    });
  },

  async del(key) {
    const { PK, SK } = stateKey(key);
    await deleteItem(PK, SK);
  },
};

// ---------------------------------------------------------------------------
// Session Store — no TTL (persistent until explicitly revoked)
// ---------------------------------------------------------------------------
export const blueskySessionStore: NodeSavedSessionStore = {
  async get(sub) {
    const item = await getItem(
      `BLUESKY_OAUTH_SESSION#${sub}`,
      "SESSION"
    );
    if (!item) return undefined;

    const { PK, SK, dpopJwk, tokenSet, ...rest } = item as Record<
      string,
      unknown
    >;

    return {
      ...rest,
      dpopJwk:
        typeof dpopJwk === "string" ? JSON.parse(dpopJwk) : dpopJwk,
      // tokenSet may contain nested objects; DynamoDB stores them as Maps which
      // the DocumentClient already deserialises to plain objects — no extra work needed.
      tokenSet: typeof tokenSet === "string" ? JSON.parse(tokenSet) : tokenSet,
    } as NodeSavedSession;
  },

  async set(sub, value) {
    const { PK, SK } = sessionKey(sub);
    await putItem({
      PK,
      SK,
      ...value,
      dpopJwk: JSON.stringify(value.dpopJwk),
      // Serialise tokenSet as JSON string to avoid issues with reserved-word field names
      tokenSet: JSON.stringify(value.tokenSet),
    });
  },

  async del(sub) {
    const { PK, SK } = sessionKey(sub);
    await deleteItem(PK, SK);
  },
};
