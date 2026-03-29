# ReactiveFlow

**Cross-chain IFTTT workflow orchestrator powered by Reactive Network.**

ReactiveFlow is a no-code platform for creating cross-chain automated workflows using Reactive Network's ReactVM. Define a trigger on one chain, set conditions, and execute actions on another chain -- all fully on-chain, no servers, no keepers.

---

## Architecture

ReactiveFlow uses a **registry + EOA deploy model**. Users deploy `ReactiveFlowEngine` directly from their wallet (EOA), then register it in the `FlowRegistry` for indexing. Each engine subscribes to origin chain events and emits cross-chain callbacks.

```
                       Reactive Network (Lasna)
                    +--------------------------+
                    |   FlowRegistry (storage) |
                    |     registerFlow()       |
  Origin Chain      |                          |      Destination Chain
  (e.g. Sepolia)    |   ReactiveFlowEngine     |      (e.g. Base Sepolia)
 +-------------+    |   (EOA deployed)         |     +------------------+
 | Any ERC-20  |    |                          |     | FlowDestination  |
 | or custom   |    |   subscribe(event)       |     |   rvm_id=0x0     |
 | contract    |    |   react(log) {           |     |                  |
 | emit event -+--->|     evaluate condition   |     | alertCallback()  |
 |             |    |     emit Callback -------+---->|   topic1=self    |
 +-------------+    |   }                      |     |                  |
                    +--------------------------+     +------------------+
```

| Role | Contract | Chain | Purpose |
|------|----------|-------|---------|
| **Registry** | `FlowRegistry` | Reactive Lasna | Stores flow metadata for on-chain indexing |
| **Origin** | Any ERC-20 or custom contract | Any EVM chain | Emits trigger events (transfers, custom events) |
| **Reactive** | `ReactiveFlowEngine` | Reactive Lasna | Subscribes to origin events, evaluates conditions, emits `Callback` |
| **Destination** | `FlowDestination` | Any EVM chain | Receives and records callback execution results |

**How data flows:**

1. User creates a Flow via the web UI (trigger + condition + action).
2. Frontend deploys `ReactiveFlowEngine` directly from the user's wallet (EOA) -- **transaction 1**.
3. Frontend calls `FlowRegistry.registerFlow()` to store flow metadata on-chain -- **transaction 2**.
4. The engine subscribes to the specified origin chain event in its constructor.
5. When the event fires on the origin chain, ReactVM calls `react()` with the log data.
6. `react()` evaluates the condition (e.g., `amount >= threshold`) and emits a `Callback` via `alertCallback`, encoding `address(this)` as `topic1` for per-flow identification.
7. The Callback Proxy relays the call to `FlowDestination` on the destination chain.

### Key Design Decisions

- **EOA deployment (not factory):** Reactive Network's ReactVM activates within ~1 minute for EOA-deployed contracts, but factory-deployed contracts (via CREATE opcode) fail to activate. ReactiveFlowEngine must be deployed directly by the user's wallet.
- **`rvm_id = address(0)` on FlowDestination:** The shared FlowDestination accepts callbacks from any RVM. Without this, `rvmIdOnly` would reject callbacks since the `_rvmId` (deployer address) differs from the FlowDestination's deployer.
- **Per-flow event filtering via `topic1`:** Each ReactiveFlowEngine encodes `address(this)` into the `alertCallback`'s `topic1` parameter. The frontend filters `AlertReceived` events by `topic1 == flow.reactiveAddress` to isolate per-flow execution history.

---

## Features

- **Visual Flow Builder** -- 4-step wizard: Trigger, Condition, Action, Review & Deploy
- **Two-step deployment** -- Deploy ReactiveFlowEngine (EOA) + Register in FlowRegistry, with progress UI
- **On-chain flow persistence** -- FlowRegistry stores all flow metadata on-chain
- **Auto token detection** -- queries ERC-20 symbol & decimals on-chain, auto-converts threshold values
- **Auto chain switching** -- wallet automatically switches to Reactive Lasna when deploying
- **Cross-chain template library** -- pre-built flows for whale alerts, transfer monitors, event bridges
- **Per-flow isolated reactive contracts** -- each Flow deploys its own `ReactiveFlowEngine` instance
- **Configurable condition engine** -- 6 comparison operators (GT, LT, GTE, LTE, EQ, NEQ) with byte-offset data extraction
- **Per-flow execution tracking** -- execution history filtered by reactive contract address (`topic1`)
- **Multi-chain support** -- Ethereum Sepolia and Base Sepolia as origin/destination chains

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity 0.8, Foundry, [reactive-lib](https://github.com/Reactive-Network/reactive-lib) |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, wagmi, RainbowKit |
| Chain Interaction | viem, wagmi hooks, direct bytecode deployment + FlowRegistry |
| Package Manager | pnpm (monorepo) |
| Backend | **None** -- fully client-side + on-chain |

---

## Deployed Contracts

### Testnet Deployment

| Contract | Chain | Address |
|----------|-------|---------|
| FlowRegistry | Lasna | [`0x8BDE9530910d448727f098A8847197146DEbeC5E`](https://lasna.reactscan.net/address/0x8BDE9530910d448727f098A8847197146DEbeC5E) |
| FlowDestination | Sepolia | [`0x6A38462B4233708530f4bAc1339a7b5c16c3B635`](https://sepolia.etherscan.io/address/0x6A38462B4233708530f4bAc1339a7b5c16c3B635) |
| FlowDestination | Base Sepolia | [`0x0B14eAdDAFA5E52a3e810E9CC27BA8721c8A971c`](https://sepolia.basescan.org/address/0x0B14eAdDAFA5E52a3e810E9CC27BA8721c8A971c) |

### Verified End-to-End Transactions

| Step | Chain | Tx Hash |
|------|-------|---------|
| Deploy ReactiveFlowEngine (EOA) | Lasna | [`0xaeeac3...`](https://lasna.reactscan.net/tx/0xaeeac3427a2e29b171a5a7781cdc3d622217e9ca8ab9f308343242699da139f2) |
| Register Flow | Lasna | [`0xedb73f...`](https://lasna.reactscan.net/tx/0xedb73f4c4839ac103f2bf1dd235675133e289908e3e4141ba70982450da35c4f) |
| Origin Event (TUSD Transfer) | Sepolia | [`0x0721e0...`](https://sepolia.etherscan.io/tx/0x0721e0d7cbe20b0576c20fa187d87e81875171ec66791d6d6c8c38735afb207a) |
| Destination Callback | Sepolia | [`0x5f9173...`](https://sepolia.etherscan.io/tx/0x5f9173bd01630ebe140cfbb15bc7bdab0684339b237efe5ddd597c27e3fb3e88) |

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
# Edit .env with your private key and RPC URLs

forge build

# Deploy FlowRegistry (storage-only, once per network)
forge create src/FlowRegistry.sol:FlowRegistry \
  --rpc-url $REACTIVE_RPC --private-key $PRIVATE_KEY --broadcast

# Deploy FlowDestination on each destination chain (rvm_id=0x0 for shared use)
forge create src/FlowDestination.sol:FlowDestination \
  --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast \
  --constructor-args $CALLBACK_PROXY_ADDR --value 0.01ether
```

### Get lREACT Tokens

Send Sepolia ETH to the faucet contract to receive lREACT tokens:

```
Faucet: 0x9b9BB25f1A81078C544C829c5EB7822d747Cf434
Rate:   1 ETH = 100 lREACT
```

---

## How It Works

```
 User (Browser)                 Reactive Lasna              Origin / Destination Chains
 +--------------+               +------------------+        +------------------------+
 |              | 1. deploy     |                  |        |                        |
 | Flow Builder +--bytecode---->| ReactiveFlow-    |        |                        |
 | (wagmi)      |               | Engine (EOA)     |        |                        |
 |              | 2. register   |                  |        |                        |
 |              +-------------->| FlowRegistry     |        |                        |
 +--------------+               |   (storage)      |        |                        |
                                |                  |        |                        |
                                | subscribe(       |        |                        |
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
                                |  alertCallback   |        |                        |
                                |  (topic1=self) --+------->| Callback Proxy relays  |
                                |                  |        | to FlowDestination     |
                                +------------------+        +------------------------+
```

1. **Create** -- User designs a Flow via the web UI, selecting trigger event, condition, and action.
2. **Deploy** -- Frontend deploys `ReactiveFlowEngine` bytecode directly from the user's wallet (EOA). ReactVM activates within ~1 minute.
3. **Register** -- Frontend calls `FlowRegistry.registerFlow()` to store flow metadata on-chain.
4. **Subscribe** -- On construction, the engine subscribes to the specified origin chain event.
5. **React** -- When the subscribed event fires, ReactVM calls `react()` with the log data.
6. **Evaluate** -- `react()` extracts a value from log data and evaluates it against the threshold.
7. **Callback** -- If the condition passes, `alertCallback` is called with `topic1 = address(this)` for per-flow identification.
8. **Execute** -- The Callback Proxy relays the callback to `FlowDestination`.

---

## Smart Contract Details

### FlowRegistry

Storage-only registry deployed once on Lasna. Indexes all user flows on-chain.

- `registerFlow(reactiveContract, name, ...)` -- stores flow metadata and emits `FlowRegistered`
- `getUserFlows(address)` -- returns all flows created by a user
- `getUserFlowCount(address)` -- returns flow count for a user
- `getTotalFlows()` -- returns total flows across all users

### ReactiveFlowEngine

The core reactive contract deployed per flow directly by the user's wallet (EOA).

- **Condition operators:** `NONE`, `GT`, `LT`, `GTE`, `LTE`, `EQ`, `NEQ`
- **Data extraction:** Configurable `dataOffset` to read any 32-byte word from event log data
- **Execution limits:** Optional `maxExecutions` cap (0 = unlimited)
- **Callback format:** Uses `alertCallback(address, uint256, uint256, bytes)` with `topic1 = address(this)` for per-flow event filtering
- **Gas limit:** 1,000,000 per callback

### FlowDestination

Shared callback receiver deployed on destination chains. Sets `rvm_id = address(0)` to accept callbacks from any RVM.

- `alertCallback(rvmId, topic1, topic2, data)` -- structured alert with per-flow identification via `topic1`
- `genericCallback(rvmId, topic1, topic2, data)` -- generic execution callback
- `callback(address)` -- simple alert (Basic Demo compatible)
- `getRecentAlerts(count)` -- query recent alert history

### Test Suite

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
│   │   │   ├── FlowRegistry.sol        # Storage-only: register flows
│   │   │   ├── ReactiveFlowEngine.sol   # Core reactive contract (Lasna)
│   │   │   ├── FlowOrigin.sol           # Event emitter (origin chains)
│   │   │   └── FlowDestination.sol      # Callback receiver (dest chains)
│   │   ├── test/
│   │   └── lib/
│   │       └── reactive-lib/            # Reactive Network base contracts
│   └── frontend/                   # React + Vite app
│       └── src/
│           ├── config/
│           │   ├── contracts.ts         # Chain IDs, ABIs, addresses
│           │   ├── bytecode.ts          # ReactiveFlowEngine compiled bytecode
│           │   ├── templates.ts         # Flow template definitions
│           │   └── wagmi.ts             # Wallet config (Sepolia, Base Sepolia, Lasna)
│           ├── hooks/
│           │   ├── useDeployFlow.ts      # Two-step: deploy bytecode + register
│           │   ├── useUserFlows.ts       # Read flows from FlowRegistry on-chain
│           │   ├── useExecutionHistory.ts # Per-flow filtered alerts (topic1)
│           │   └── useTokenInfo.ts       # Auto-detect ERC-20 symbol & decimals
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
