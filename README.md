# Signal

Signal is a trust-native social platform where every post shows a Human Authenticity Score and a Trust Provenance Card explaining exactly why it appears in your feed. The platform is built on Amazon DynamoDB, deployed on Vercel, and features a real per-user Bluesky AT Protocol OAuth integration.

## Live Demo
- App: https://signal-app-ruby.vercel.app
- Architecture diagram: see [/signal-architecture-diagram.png](./signal-architecture-diagram.png) in the repo root.

## Features
- Trust-graph feed ranking
- Live Human Authenticity Scoring
- Transparent algorithm controls with plain-English explanation
- Bluesky topic Discover
- Real per-user Bluesky OAuth "Your Network" personal feed
- Dark/light theming
- Google + GitHub login

## Tech Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS, NextAuth, Amazon DynamoDB, AWS Secrets Manager, Three.js, AT Protocol (@atproto/oauth-client-node, @atproto/api), Vercel.

## Prerequisites
- Node.js 18+ and npm
- A free AWS account
- A free Google Cloud account (for Google OAuth)
- A free GitHub account (for GitHub OAuth)
- A free Bluesky account (for the topic-search service login)
- A free Vercel account (for deployment)

## Local Setup — Step by Step

### 1. Clone and install
```bash
git clone <repo-url>
cd signal-app
npm install
```

### 2. Create your environment file
```bash
cp .env.example .env.local
```

Then fill in `.env.local` with EVERY one of these variables:

#### AUTH_SECRET
A random secret NextAuth uses to encrypt sessions. Generate with:
```bash
openssl rand -base64 32
```
Paste the output as the value.

#### GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
From Google Cloud Console (https://console.cloud.google.com/apis/credentials).
1. Create a project
2. Configure OAuth consent screen (External, fill app name + support email)
3. Create Credentials → OAuth client ID → Application type: Web application
4. Authorized redirect URIs: add both `http://localhost:3000/api/auth/callback/google` AND your production URL + `/api/auth/callback/google`.
5. Copy the generated Client ID and Client Secret.

#### AUTH_GITHUB_ID and AUTH_GITHUB_SECRET
From https://github.com/settings/developers.
1. New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Register → copy Client ID
5. Generate a new client secret and copy it immediately (only shown once).
*Note: for production you need a SEPARATE GitHub OAuth app with the production URL, since GitHub only allows one callback URL per app.*

#### AWS_REGION
The AWS region you created your resources in (e.g. `ap-south-1`).

#### AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
From AWS IAM console (https://console.aws.amazon.com/iam).
1. Create a new IAM user
2. Attach policies directly → add `AmazonDynamoDBFullAccess` and `SecretsManagerReadWrite`
3. Create the user → go to its Security Credentials tab
4. Create access key → choose "Application running outside AWS"
5. Copy both values immediately (secret is shown only once).

#### DYNAMODB_TABLE_NAME
The DynamoDB table name. See the DynamoDB setup section below for how to create it; use the exact same name you create there.

#### PUBLIC_URL
The base URL your app is running at. Use `http://localhost:3000` for local dev, and your real production URL (e.g. `https://your-app.vercel.app`) when deployed.

#### BLUESKY_OAUTH_KEY_SECRET_NAME
The name of the AWS Secrets Manager secret holding your Bluesky OAuth signing key. See the Bluesky OAuth setup section below.

#### BLUESKY_IDENTIFIER and BLUESKY_APP_PASSWORD
A Bluesky account used as a service login for the public topic-search feature (separate from any user's personal OAuth connection).
1. Create a free account at https://bsky.app
2. Go to Settings → Privacy and Security → App Passwords → Add App Password
3. Name it, and use the generated password here (never use your real account password).

### 3. Set up the DynamoDB table
Go to the DynamoDB console → Create table:
- Table name: must match `DYNAMODB_TABLE_NAME` above
- Partition key: `PK` (String)
- Sort key: `SK` (String)
- Capacity mode: On-demand
- After creation, go to the Indexes tab → Create index twice:
  - GSI 1: Partition key `authorId` (String), Sort key `createdAt` (String)
  - GSI 2: Partition key `topicId` (String), Sort key `createdAt` (String)
- Go to Additional settings tab → Time to Live (TTL) → Turn on → Attribute name: `ttl`

### 4. Set up the Bluesky OAuth signing key in AWS Secrets Manager
Run this once locally to generate an ES256 keypair:
```bash
node -e "import('@atproto/oauth-client-node').then(async ({JoseKey}) => { const key = await JoseKey.generate(undefined, 'key1'); console.log(JSON.stringify(key.jwk)) })"
```
Copy the JSON output. Go to AWS Secrets Manager console:
1. Store a new secret → "Other type of secret" → Plaintext tab
2. Paste the JSON → name it (matching `BLUESKY_OAUTH_KEY_SECRET_NAME` above) → Store.
3. Delete the JSON from your terminal history/clipboard afterward — it's a private key.

### 5. Run the app locally
```bash
npm run dev
```
Visit http://localhost:3000

## Deployment (Vercel)
1. Push this repo to GitHub (must be public for hackathon submission review)
2. Go to vercel.com/new → Import the repository
3. Add every environment variable from step 2 above into Vercel's Environment Variables settings (use your production `PUBLIC_URL` there, not localhost)
4. Deploy
5. Update your Google and GitHub OAuth app callback URLs to include the new production domain

## Project Structure
- `src/app/api`: Next.js App Router API routes (Auth, Bluesky OAuth, Posts, Users)
- `src/app/compose`: Page for drafting new posts
- `src/app/connect`: Page to connect to external accounts (like Bluesky)
- `src/app/discover`: Topic-based content discovery page
- `src/app/explore`: Network and graph exploration view
- `src/app/feed`: The main trust-graph ranked feed
- `src/app/login`: Authentication and login page
- `src/app/post`: Individual post view and interactions
- `src/app/profile`: User profile and settings
- `src/components/AlgoPanel.tsx`: Component managing the algorithm adjustment sliders
- `src/components/ConnectClient.tsx`: Client-side logic for the Bluesky connect flow
- `src/components/DiscoverClient.tsx`: Interactive topic explorer and search interface
- `src/components/ExploreClient.tsx`: Visualization or listing for the explore graph
- `src/components/FeedClient.tsx`: Core rendering logic for the main feed
- `src/components/Navbar.tsx`: Global navigation header
- `src/components/PostCard.tsx`: Reusable component displaying a single post and its provenance
- `src/components/SessionProvider.tsx`: NextAuth session context wrapper
- `src/components/ThemeToggle.tsx`: Dark/light mode switcher
- `src/components/TiltCard.tsx`: 3D hover effect card container

## AWS Database Compliance
This project uses Amazon DynamoDB as its primary backend, deployed on Vercel, satisfying the AWS Databases x Vercel hackathon requirements. Single-table design with composite keys, two GSIs, and TTL-based automatic cleanup of OAuth handshake state. AWS Secrets Manager stores the Bluesky OAuth signing key.

## License
MIT
