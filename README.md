# ReactiveFlow

**Cross-chain IFTTT workflow orchestrator powered by Reactive Network.**

ReactiveFlow is a no-code platform for creating cross-chain automated workflows using Reactive Network's ReactVM. Define a trigger on one chain, set conditions, and execute actions on another chain -- all fully on-chain, no servers, no keepers.

---

## Architecture

ReactiveFlow uses a **three-role model** where contracts are deployed across three distinct environments:

```
                       Reactive Network (Lasna)
                    +--------------------------+
                    |   ReactiveFlowEngine     |
  Origin Chain      |                          |      Destination Chain
  (e.g. Sepolia)    |   subscribe(event)       |      (e.g. Base Sepolia)
 +-------------+    |   react(log) {           |     +------------------+
 | FlowOrigin  |    |     evaluate condition   |     | FlowDestination  |
 |             |    |     emit Callback -------+---->|                  |
 | emit event -+--->|   }                      |     | alertCallback()  |
 |             |    |                          |     | callback()       |
 +-------------+    +--------------------------+     +------------------+
```

| Role | Contract | Chain | Purpose |
|------|----------|-------|---------|
| **Origin** | `FlowOrigin` | Any EVM chain | Emits trigger events (transfers, price updates, custom actions) |
| **Reactive** | `ReactiveFlowEngine` | Reactive Lasna | Subscribes to origin events, evaluates conditions, emits `Callback` |
| **Destination** | `FlowDestination` | Any EVM chain | Receives and records callback execution results |

**How data flows:**

1. An event is emitted on the **origin chain** (e.g., a `LargeTransfer` on Sepolia).
2. The Reactive Network relays the log to the **ReactiveFlowEngine** on Lasna.
3. `react()` evaluates the configured condition (e.g., `amount > threshold`).
4. If the condition passes, a `Callback` event is emitted targeting the **destination chain**.
5. The Reactive Network's Callback Proxy relays the call to `FlowDestination`.

---

## Features

- **Visual Flow Builder** -- 4-step wizard: Trigger, Condition, Action, Review & Deploy
- **Cross-chain template library** -- pre-built flows for whale alerts, transfer monitors, event bridges
- **Per-flow isolated reactive contracts** -- each Flow deploys its own `ReactiveFlowEngine` instance
- **Configurable condition engine** -- 6 comparison operators (GT, LT, GTE, LTE, EQ, NEQ) with byte-offset data extraction
- **Real-time execution tracking** -- on-chain execution counter and alert history
- **Multi-chain support** -- Ethereum Sepolia and Base Sepolia as origin/destination chains

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity 0.8, Foundry, [reactive-lib](https://github.com/Reactive-Network/reactive-lib) |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, wagmi, RainbowKit |
| Chain Interaction | viem, wagmi hooks, direct bytecode deployment |
| Package Manager | pnpm (monorepo) |
| Backend | **None** -- fully client-side + on-chain |

---

## Deployed Contracts

### Testnet Deployment

| Contract | Chain | Address |
|----------|-------|---------|
| FlowOrigin | Sepolia | [`0x25859EF6b680249BD924F6F9716BA214A21F916c`](https://sepolia.etherscan.io/address/0x25859EF6b680249BD924F6F9716BA214A21F916c) |
| FlowDestination | Sepolia | [`0x56dcB06691f37F21CbBF8Df9D6467a0536d0644f`](https://sepolia.etherscan.io/address/0x56dcB06691f37F21CbBF8Df9D6467a0536d0644f) |
| FlowDestination | Base Sepolia | [`0x50013a4Ff622403F7a608e37e9A8fd440A192811`](https://sepolia.basescan.org/address/0x50013a4Ff622403F7a608e37e9A8fd440A192811) |
| ReactiveFlowEngine (demo) | Lasna | [`0x6Ff5b0743A4c031FfC2Ba887136543B2D1e0B091`](https://lasna.reactscan.net/address/0x6Ff5b0743A4c031FfC2Ba887136543B2D1e0B091) |

### Verified Transactions (End-to-End)

| Step | Chain | Tx Hash |
|------|-------|---------|
| Origin Event | Sepolia | [`0x48d961...`](https://sepolia.etherscan.io/tx/0x48d9616efb0c0d3e9cc4727279039818e9b49c5ecde1378c9934190469151213) |
| Reactive Deploy | Lasna | [`0x4a4972...`](https://lasna.reactscan.net/tx/0x4a4972ef42b8368dffafdde996d3cd7240a37bf8bbd2fcc2827c6453643caf0c) |
| Destination Callback | Sepolia | [`0xc36226...`](https://sepolia.etherscan.io/tx/0xc3622621dac104abc2ac0d378fad91da59b1916b2fb993259c4027e8e3da2bc8) |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** (package manager)
- **Foundry** (`forge`, `cast`) -- [install guide](https://book.getfoundry.sh/getting-started/installation)
- **MetaMask** with Sepolia ETH and lREACT tokens

### Install

```bash
git clone <repo-url>
cd reactive-hackathon
pnpm install

# Install Foundry dependencies
cd packages/contracts
forge install
```

### Run Frontend

```bash
cd packages/frontend
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Deploy Contracts

```bash
cd packages/contracts
cp .env.example .env
# Edit .env with your private key and RPC URLs:
#   SEPOLIA_RPC=<your-sepolia-rpc>
#   REACTIVE_RPC=<reactive-lasna-rpc>
#   PRIVATE_KEY=<deployer-private-key>

forge build

# Run the full demo deployment (Origin + Destination + Reactive + trigger)
bash script/deploy-demo.sh
```

### Get lREACT Tokens

Send Sepolia ETH to the faucet contract to receive lREACT tokens (required for deploying reactive contracts):

```
Faucet: 0x9b9BB25f1A81078C544C829c5EB7822d747Cf434
Rate:   1 ETH = 100 lREACT
```

---

## How It Works

```
 User (Browser)                 Reactive Lasna              Origin / Destination Chains
 +--------------+               +------------------+        +------------------------+
 |              |   deploy tx   |                  |        |                        |
 | Flow Builder +-------------->| ReactiveFlow-    |        |                        |
 | (wagmi)      |               | Engine           |        |                        |
 |              |               |                  |        |                        |
 +--------------+               | subscribe(       |        |                        |
                                |   chainId,       |        |                        |
                                |   contract,      |        |                        |
                                |   topic0)        |        |                        |
                                |                  |        |                        |
                                |         react()  |<-------+ Event emitted on       |
                                |           |      |        | origin chain           |
                                |           v      |        |                        |
                                |    evaluate      |        |                        |
                                |    condition     |        |                        |
                                |           |      |        |                        |
                                |           v      |        |                        |
                                |    emit Callback +------->| Callback Proxy relays  |
                                |                  |        | to FlowDestination     |
                                +------------------+        +------------------------+
```

1. **Create** -- User designs a Flow via the web UI, selecting a trigger event, condition, and action.
2. **Deploy** -- The frontend deploys a `ReactiveFlowEngine` contract to Reactive Lasna with the Flow's configuration baked into its constructor.
3. **Subscribe** -- On construction, the engine subscribes to the specified origin chain event via the Reactive system contract.
4. **React** -- When the subscribed event fires on the origin chain, ReactVM calls `react()` with the log data.
5. **Evaluate** -- `react()` extracts a value from the log data at the configured byte offset and evaluates it against the threshold using the configured operator (GT, LT, EQ, etc.).
6. **Callback** -- If the condition passes, a `Callback` event is emitted targeting the destination chain and contract.
7. **Execute** -- The Reactive Network's Callback Proxy relays the callback to `FlowDestination`, which records the alert on-chain.

---

## Smart Contract Details

### ReactiveFlowEngine

The core reactive contract deployed to Lasna. Each Flow gets its own isolated instance.

- **Condition operators:** `NONE` (always pass), `GT`, `LT`, `GTE`, `LTE`, `EQ`, `NEQ`
- **Data extraction:** Configurable `dataOffset` to read any 32-byte word from event log data
- **Execution limits:** Optional `maxExecutions` cap (0 = unlimited)
- **Action types:** `ALERT` (simple callback) or `GENERIC_CALLBACK` (custom selector)

### FlowOrigin

A helper contract deployed on origin chains to simulate trigger events for testing:

- `simulateTransfer(to, amount)` -- emits `LargeTransfer`
- `simulatePriceUpdate(token, price)` -- emits `PriceUpdate`
- `simulateCustomAction(actionType, data)` -- emits `CustomAction`

### FlowDestination

A callback receiver deployed on destination chains:

- `callback(address)` -- simple alert (Basic Demo compatible)
- `alertCallback(rvmId, topic1, topic2, data)` -- structured alert with full data
- `genericCallback(rvmId, topic1, topic2, data)` -- generic execution callback
- `getRecentAlerts(count)` -- query recent alert history

### Test Suite

26 unit tests covering the condition evaluation engine:

```bash
cd packages/contracts
forge test -vvv
```

---

## Flow Templates

| Template | Origin | Destination | Condition | Action |
|----------|--------|-------------|-----------|--------|
| Cross-Chain Whale Alert | Sepolia | Sepolia | Transfer amount >= 10,000 | Alert |
| Large Transfer Monitor | Sepolia | Base Sepolia | LargeTransfer amount >= 50,000 | Alert |
| Cross-Chain Event Bridge | Sepolia | Base Sepolia | None (unconditional) | Generic Callback |
| Unconditional Alert | Sepolia | Sepolia | None (unconditional) | Alert |

---

## Project Structure

```
reactive-hackathon/
├── packages/
│   ├── contracts/                  # Foundry project
│   │   ├── src/
│   │   │   ├── ReactiveFlowEngine.sol   # Core reactive contract (Lasna)
│   │   │   ├── FlowOrigin.sol           # Event emitter (origin chains)
│   │   │   └── FlowDestination.sol      # Callback receiver (dest chains)
│   │   ├── test/
│   │   │   └── ReactiveFlowEngine.t.sol # 26 unit tests
│   │   ├── script/
│   │   │   ├── DeployOrigin.s.sol       # Origin deploy script
│   │   │   ├── DeployDestination.s.sol  # Destination deploy script
│   │   │   ├── DeployReactive.s.sol     # Reactive deploy script
│   │   │   ├── TriggerDemo.s.sol        # Demo trigger script
│   │   │   └── deploy-demo.sh           # Full end-to-end deployment
│   │   └── lib/
│   │       └── reactive-lib/            # Reactive Network base contracts
│   └── frontend/                   # React + Vite app
│       └── src/
│           ├── config/
│           │   ├── contracts.ts         # Chain IDs, ABIs, addresses
│           │   ├── templates.ts         # Flow template definitions
│           │   └── wagmi.ts             # Wallet config
│           ├── hooks/
│           │   ├── useDeployFlow.ts      # Deploy ReactiveFlowEngine
│           │   ├── useExecutionHistory.ts # Track flow executions
│           │   └── useUserFlows.ts       # Manage user's flows
│           ├── pages/
│           │   ├── Landing.tsx           # Landing page
│           │   ├── CreateFlow.tsx        # 4-step flow builder wizard
│           │   ├── Templates.tsx         # Template gallery
│           │   ├── FlowList.tsx          # User's flows
│           │   ├── FlowDetail.tsx        # Flow detail + execution log
│           │   └── Dashboard.tsx         # Overview dashboard
│           ├── components/
│           │   ├── flow-builder/         # Builder step components
│           │   ├── shared/               # Layout, wallet, logo
│           │   └── ui/                   # shadcn/ui primitives
│           └── lib/
│               ├── flow-encoder.ts       # ABI encoding utilities
│               └── utils.ts              # Shared helpers
├── pnpm-workspace.yaml
└── package.json
```

---

## Links

- [Reactive Network Docs](https://dev.reactive.network)
- [Reactscan (Lasna Explorer)](https://lasna.reactscan.net)
- [Sepolia Explorer](https://sepolia.etherscan.io)
- [Base Sepolia Explorer](https://sepolia.basescan.org)

---

## License

MIT
