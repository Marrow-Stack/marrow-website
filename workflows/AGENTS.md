# MarrowStack AI System Instructions

## 🛠 Tech Stack & Environment
- **Runtime:** Bun (Primary)
- **Frontend:** React 19, Tailwind 4, Framer Motion
- **Web3:** Solana (SVM), Jito/Flashbots for MEV resistance
- **Payment:** Dodo Payments (Merchant of Record)

## 🎨 Design Engineering Standards
- **Tokens:** Always use HSL variables (e.g., `--metal-border`). Never use hex codes.
- **Physics:** Interactions must use Spring Physics (Stiffness: 500, Damping: 15).
- **Tactility:** Buttons must maintain a 3px Y-axis displacement on `:active`.

## 🛡 Security & MEV Boundaries
- **Private RPCs:** When handling transactions, prioritize private routing to avoid mempool sandwiching.
- **Secrets:** Never touch `.env` files or output private keys to logs.

## 🤖 Executable Commands for Jules
- **Build:** `bun run build`
- **Lint:** `bun run lint:fix`
- **Test:** `bun test`
- **Solana Audit:** `cargo clippy -p marrow-solana`

## 🚫 Critical Boundaries
- Do not modify the core `Layout.tsx` without explicit confirmation.
- Do not add new UI libraries (Shadcn, Radix are allowed; others are not).