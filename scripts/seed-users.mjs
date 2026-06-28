/**
 * scripts/seed-users.mjs
 *
 * One-time script to insert 6 realistic demo users into DynamoDB.
 * Run from project root:  node scripts/seed-users.mjs
 *
 * Reads AWS credentials from .env.local via dotenv.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve } from "path";

// -- Load .env.local manually (no dotenv dependency required) --
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("Could not read .env.local — relying on existing env vars.");
  }
}

loadEnvLocal();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE = process.env.DYNAMODB_TABLE_NAME;
if (!TABLE) {
  console.error("DYNAMODB_TABLE_NAME is not set. Aborting.");
  process.exit(1);
}

const SEED_USERS = [
  { id: "seed-user-001", name: "Aisha Patel",      email: "aisha@example.com",   humanScore: 97, createdAt: "2026-05-10T08:23:00Z" },
  { id: "seed-user-002", name: "Marcus Chen",      email: "marcus@example.com",  humanScore: 92, createdAt: "2026-05-14T11:45:00Z" },
  { id: "seed-user-003", name: "Sofia Johansson",  email: "sofia@example.com",   humanScore: 99, createdAt: "2026-05-17T09:00:00Z" },
  { id: "seed-user-004", name: "Daniel Okonkwo",   email: "daniel@example.com",  humanScore: 88, createdAt: "2026-05-20T14:30:00Z" },
  { id: "seed-user-005", name: "Priya Krishnaswamy", email: "priya@example.com", humanScore: 95, createdAt: "2026-05-23T07:15:00Z" },
  { id: "seed-user-006", name: "Liam O'Brien",     email: "liam@example.com",    humanScore: 85, createdAt: "2026-05-27T16:00:00Z" },
];

async function seedUser(user) {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
  const item = {
    PK: `USER#${user.id}`,
    SK: "PROFILE",
    id: user.id,
    name: user.name,
    email: user.email,
    image: avatarUrl,
    humanScore: user.humanScore,
    topicIds: [],
    createdAt: user.createdAt,
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  console.log(`  ✓ Seeded: ${user.name} (${user.id}) — score ${user.humanScore}`);
}

console.log(`\nSeeding ${SEED_USERS.length} demo users into table: ${TABLE}\n`);

for (const user of SEED_USERS) {
  await seedUser(user);
}

console.log("\nDone! Seeding complete.\n");
