import { JoseKey } from "@atproto/oauth-client-node"

const key = await JoseKey.generate(undefined, "key1")
console.log(JSON.stringify(key.jwk))
