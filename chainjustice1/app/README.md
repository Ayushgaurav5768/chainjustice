# ChainJustice Frontend (Next.js)

This app lives in `chainjustice1/app` and includes both frontend UI and API routes (`/api/ai-legal`, `/api/ipfs`).

## Local development

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Install and run:

```bash
npm ci
npm run dev
```

3. Open `http://localhost:3000`.

## Build and production run

```bash
npm run build
npm run start
```

The app is demo-safe by default:
- If AI keys are missing, `/api/ai-legal` returns structured advisory fallback responses.
- If Pinata keys are missing, `/api/ipfs` returns deterministic mock CID responses.
- If on-chain ledger fetch is unavailable, UI falls back to mock ledger data.

## Environment variables

See `.env.example` for the complete list.

Common required frontend variables:
- `NEXT_PUBLIC_SOLANA_NETWORK`
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_CHAINJUSTICE_PROGRAM_ID`

Optional live integrations:
- `GOOGLE_API_KEY` or `GEMINI_API_KEY`
- `PINATA_JWT` (or `PINATA_API_KEY` + `PINATA_SECRET`)
- `AI_COUNCIL_PROVIDER_POOL`

## Vercel deployment

Set Vercel project root to `app/`.

Build settings:
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `.next`

Set environment variables in Vercel for the target environment (Preview/Production) using `.env.example` as reference.
