# ⚖️ ChainJustice

### The Decentralized AI Accountability Court

> **"AI argues both sides. Humans decide. Blockchain remembers."**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?logo=solana)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Anchor](https://img.shields.io/badge/Anchor-0.30-blue)](https://www.anchor-lang.com)
[![Team](https://img.shields.io/badge/Team-404%20Shinobi-red)](https://github.com/Ayushgaurav5768/chainjustice)

---

## 📌 What is ChainJustice?

ChainJustice is a **decentralized AI accountability court** built on Solana. When an AI system causes harm — through privacy violations, bias, misleading outputs, or unsafe behavior — users currently have nowhere neutral to go. Their complaints go straight back to the company that built the AI, making the process opaque, biased, and unauditable.

ChainJustice changes that by providing:

- A structured **case filing and evidence submission** workflow
- An **Adversarial AI Council** that argues both prosecution and defense
- A **human juror panel** that makes the final binding decision
- An **on-chain Verdict Ledger** recording every outcome, trust score change, and insurance impact — permanently

---

## 🏗️ Project Structure

```
chainjustice/
├── chainjustice/        ← Default Next.js starter (ignore)
└── chainjustice1/       ← 🚀 REAL PROJECT IS HERE
    ├── app/             ← Next.js 15 frontend
    │   └── src/
    │       ├── app/     ← Pages: file-case, case/[id], juror, verdict-ledger, registry, precedents, dashboard
    │       ├── lib/     ← Solana client, IPFS, AI helpers, config, types
    │       └── components/
    ├── programs/
    │   └── chainjustice/
    │       └── src/lib.rs  ← Anchor/Rust smart contract
    ├── tests/
    │   └── chainjustice.ts ← Anchor test suite
    ├── Anchor.toml
    └── Cargo.toml
```

> ⚠️ **The real product is in `chainjustice1/`. The root `chainjustice/` folder is just a Next.js template.**

---

## ✨ Key Features

### 1. 📂 Case Filing
Users file a complaint against any registered AI model. They provide the harm description, category (bias, privacy, misinformation, safety, etc.), and relevant evidence files.

### 2. 🔒 Evidence on IPFS
Evidence files (PNG, JPG, PDF, TXT, DOCX — up to 10 MB each) are uploaded to IPFS via Pinata. Only the content hash (CID) is stored on-chain, preserving evidence integrity while keeping costs low.

### 3. 🤖 Adversarial AI Council
Our AI layer (powered by Google Gemini, with multi-provider support) generates:
- **Prosecution brief** — strongest arguments for the complainant
- **Defense brief** — strongest arguments for the AI model/provider
- **Neutral synthesis** — an objective summary of the conflict
- **Evidence gaps** — what's missing to fully resolve the case
- **Contradictions** — inconsistencies in the evidence
- **Juror questions** — suggested questions for the jury
- **AI Disagreement Meter** — low / medium / high

> 🔑 The AI is **not the judge**. It is the expert analyst. Human jurors hold final authority.

### 4. 👨‍⚖️ Human Juror Governance
Jurors stake SOL to participate, ensuring skin-in-the-game accountability. Each juror reviews the case and casts a binding vote. The verdict is finalized by majority.

### 5. 🏦 Insurance Pool & Trust Score
Every registered AI model has:
- **Trust Score** — starts at 70/100, updated on every verdict
- **Insurance Pool** — SOL deposited by the model provider

On verdict enforcement:
| Verdict | Trust Change | Payout |
|---------|-------------|--------|
| Plaintiff wins | −10 | 5% of insurance pool → complainant |
| Defendant wins | +2 | — |
| Split | −3 | — |

### 6. 📜 Verdict Ledger
A public, searchable, on-chain record of every case outcome — the AI accountability equivalent of a credit bureau. Every model's history is permanently visible and immutable.

---

## 🔧 Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Smart Contract | Anchor / Rust on Solana | Court logic, voting, trust, insurance |
| Frontend | Next.js 15, TypeScript, Tailwind CSS | Full web application |
| AI Analysis | Google Gemini (+ OpenAI / Anthropic fallback) | Adversarial legal briefs |
| Evidence Storage | IPFS via Pinata | Decentralized file storage |
| Wallet | Phantom / Solflare | User identity + transaction signing |
| Deployment | Vercel | Frontend hosting |

---

## 🔗 Smart Contract Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize_registry` | Creates the court registry on-chain |
| `register_ai_model` | Registers an AI model with metadata and insurance |
| `deposit_insurance` | Adds SOL to the model's insurance pool |
| `file_case` | Opens a new case against a model |
| `submit_evidence` | Anchors evidence metadata (IPFS CID) on-chain |
| `stake_as_juror` | Stakes SOL for juror eligibility |
| `select_jurors` | Assigns jurors to a case |
| `submit_ai_analysis` | Logs advisory AI analysis metadata |
| `log_ai_decision` | Updates analysis metadata for audit trail |
| `cast_vote` | Juror casts a binding vote |
| `enforce_verdict` | Finalizes case, updates trust + insurance |
| `update_trust_score` | Governance/appeal trust adjustment post-closure |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Rust + Solana CLI + Anchor CLI
- A Phantom or Solflare wallet (for frontend)

### 1. Clone the repo
```bash
git clone https://github.com/Ayushgaurav5768/chainjustice.git
cd chainjustice/chainjustice1
```

### 2. Install smart contract dependencies
```bash
npm install
```

### 3. Build the Anchor program
```bash
anchor build
```

### 4. Run tests
```bash
anchor test
```

### 5. Set up the frontend
```bash
cd app
cp .env.example .env.local
# Fill in your keys (see Environment Variables section below)
npm install
npm run dev
```

---

## 🔑 Environment Variables

### `chainjustice1/.env.example`
```env
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json
```

### `chainjustice1/app/.env.example`
```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# AI Analysis (required for real AI briefs)
GEMINI_API_KEY=

# IPFS / Evidence Storage (optional — mock mode used if missing)
PINATA_API_KEY=
PINATA_SECRET=

# Multi-provider AI conflict firewall (optional)
AI_COUNCIL_PROVIDER_POOL=gemini,openai,anthropic
```

> 💡 The app runs in **demo-safe mode** without these keys — all flows still work with mock data.

---

## 🧪 Test Coverage

Tests are in `tests/chainjustice.ts` and cover:

- Registry initialization
- AI model registration
- Case filing
- Evidence submission
- Juror staking
- Juror selection
- AI analysis submission
- Vote casting

Run with:
```bash
anchor test
# or
npm run test-local
```

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| MVP | Core filing, AI council, juror voting, verdict ledger | ✅ Done |
| v1.1 | Live Solana devnet deployment + IDL wiring | 🔄 In progress |
| v1.2 | Evidence encryption + permissioned IPFS retrieval | 📋 Planned |
| v1.3 | Appeals workflow + trust override governance | 📋 Planned |
| v2.0 | Enterprise compliance packs + observability dashboard | 📋 Planned |
| v2.1 | Multi-chain expansion | 📋 Planned |

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and contribution workflow.

---

## 👥 Team — 404 Shinobi

Built with ☕ and Solana at hackathon speed.

| Role | Responsibility |
|------|---------------|
| Blockchain Lead | Anchor/Rust smart contract design and testing |
| Full-Stack Lead | Next.js frontend, API routes, IPFS integration |
| AI/Product Lead | Adversarial AI council design, product flow |

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

## ⚠️ Disclaimer

ChainJustice is a hackathon MVP. The AI Council output is **advisory only and has no binding authority**. Final decisions are made exclusively by human jurors. This is not legal advice and does not constitute a formal legal proceeding.

---

<div align="center">

**⚖️ ChainJustice — Because AI needs accountability, not just intelligence.**

[Live Demo](https://chainjustice.vercel.app) • [GitHub](https://github.com/Ayushgaurav5768/chainjustice) • [Team: 404 Shinobi]

</div>
