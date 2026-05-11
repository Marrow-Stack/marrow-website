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

  ## Documentation Protocol
- All technical specs must reside in `./docs/`.
- If a new function is added, Jules must create a corresponding `.md` in `/docs` using the Mermaid.js architecture template.
- Jules is authorized to open a follow-up commit to the PR branch to add these files.

  ### Mermaid.js Template for System Architecture
When documenting a new MarrowStack module, include a diagram using this syntax:

```mermaid
graph TD
    subgraph Client_Interface [Tactile UI Layer]
        A[User Interaction] -->|Spring Physics| B(Marrow Atom)
        B -->|HSL Tokens| C{Refined Logic}
    end

    subgraph System_Engine [Logic Orchestration]
        C -->|useMarrowSystem| D[State Controller]
        D -->|Bun Runtime| E[Internal Registry]
    end

    subgraph Web3_Infrastructure [On-Chain Layer]
        E -->|marrow-solana| F[SVM Interaction]
        F -->|MEV-Shield| G((Solana Mainnet))
    end

    style G fill:#000,stroke:#635BFF,stroke-width:4px
    style Client_Interface fill:#111,stroke:#333

    subgraph UI_Layer [Tactile Interface]
        A[User Input] -->|Spring Physics| B(Marrow Component)
    end

    subgraph Logic_Layer [MarrowStack Core]
        B -->|useMarrowSystem| C{Logic Block}
        C -->|State| D[Internal Registry]
    end

    subgraph Infrastructure [Web3/Backend]
        D -->|Dodo API| E[Merchant of Record]
        D -->|marrow-solana| F[Solana Mainnet]
    end

    style F fill:#000,stroke:#635BFF,stroke-width:2px