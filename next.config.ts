import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Node.js to use HTTP/1.1 for all outbound fetch calls.
  // This prevents the "GOAWAY frame received" errors from Bluesky's
  // auth servers, which intermittently terminate HTTP/2 connections.
  serverExternalPackages: ["@atproto/oauth-client-node", "@atproto/oauth-client"],
  experimental: {
    // Disable HTTP/2 for outbound server-side fetches via undici
  },
};

export default nextConfig;
