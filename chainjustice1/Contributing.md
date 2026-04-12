# Contributing to ChainJustice

Thank you for your interest in contributing to ChainJustice — the Decentralized AI Accountability Court.

---

## 📁 Repo Structure

All real development happens inside `chainjustice1/`. The root `chainjustice/` directory is a placeholder Next.js starter and can be ignored.

```
chainjustice1/
├── app/              ← Next.js 15 frontend (TypeScript)
├── programs/         ← Anchor/Rust smart contract
├── tests/            ← Anchor test suite
├── Anchor.toml
└── Cargo.toml
```

---

## 🛠️ Development Setup

### Smart Contract

1. Install Rust: https://rustup.rs
2. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools
3. Install Anchor CLI: https://www.anchor-lang.com/docs/installation
4. Build: `anchor build`
5. Test: `anchor test`

### Frontend

```bash
cd chainjustice1/app
cp .env.example .env.local
npm install
npm run dev
```

---

## 🔀 Git Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit with clear messages: `git commit -m "feat: add juror selection UI"`
4. Push your branch and open a Pull Request against `main`

### Commit prefixes
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `test:` — adding or fixing tests
- `refactor:` — code change with no feature addition or bug fix
- `chore:` — build, tooling, or config changes

---

## 🧪 Testing

- Write Anchor tests for any new smart contract instructions in `tests/chainjustice.ts`
- Frontend API routes should handle both live and fallback/mock mode
- All evidence uploads should degrade gracefully if Pinata keys are absent

---

## ⚠️ Important Rules

- Never commit real `.env` files or API keys
- AI output is advisory only — do not change the advisory disclaimer constant
- Human juror vote is always the binding final authority in the contract logic
- Maintain graceful demo-safe fallbacks for all external integrations

---

## 📬 Contact

Open an issue on GitHub or reach out to Team 404 Shinobi.
