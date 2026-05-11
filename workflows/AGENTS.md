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

## Documentation Requirements
- Path: All documentation must reside in `./docs/`.
- Format: Use the "Marrow Technical Specification" format:
  1. **Overview**: High-level system purpose.
  2. **Architecture**: Diagrams or logic flow (in Mermaid.js if applicable).
  3. **State Management**: List of hooks and shared states.
  4. **Physics Configuration**: Detailed Spring values for UI.
  5. **Web3 Security**: MEV-protection status and RPC routing.