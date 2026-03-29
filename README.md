# ReactiveFlow

**Cross-chain IFTTT workflow orchestrator powered by Reactive Network.**

ReactiveFlow is a no-code platform for creating cross-chain automated workflows using Reactive Network's ReactVM. Define a trigger on one chain, set conditions, and execute actions on another chain -- all fully on-chain, no servers, no keepers.

---

## Architecture

ReactiveFlow uses a **factory + three-role model**. The `FlowRegistry` factory contract deploys and registers `ReactiveFlowEngine` instances, each subscribing to origin chain events and emitting cross-chain callbacks.

```
                       Reactive Network (Lasna)
                    +--------------------------+
                    |   FlowRegistry           |
                    |     createFlow() ------+ |
  Origin Chain      |                        v |      Destination Chain
  (e.g. Sepolia)    |   ReactiveFlowEngine     |      (e.g. Base Sepolia)
 +-------------+    |                          |     +------------------+
 | Any ERC-20  |    |   subscribe(event)       |     | FlowDestination  |
 | or custom   |    |   react(log) {           |     |                  |
 | contract    |    |     evaluate condition   |     | callback()       |
 | emit event -+--->|     emit Callback -------+---->| alertCallback()  |
 |             |    |   }                      |     |                  |
 +-------------+    +--------------------------+     +------------------+
```

| Role | Contract | Chain | Purpose |
|------|----------|-------|---------|
| **Factory** | `FlowRegistry` | Reactive Lasna | Deploys & registers ReactiveFlowEngine instances, on-chain flow persistence |
| **Origin** | Any ERC-20 or custom contract | Any EVM chain | Emits trigger events (transfers, custom events) |
| **Reactive** | `ReactiveFlowEngine` | Reactive Lasna | Subscribes to origin events, evaluates conditions, emits `Callback` |
| **Destination** | `FlowDestination` | Any EVM chain | Receives and records callback execution results |

**How data flows:**

1. User creates a Flow via the web UI (trigger + condition + action).
2. Frontend calls `FlowRegistry.createFlow()` which deploys a new `ReactiveFlowEngine` and registers it on-chain -- **one transaction**.
3. The engine subscribes to the specified origin chain event in its constructor.
4. When the event fires on the origin chain, ReactVM calls `react()` with the log data.
5. `react()` evaluates the condition (e.g., `amount >= threshold`) and emits a `Callback`.
6. The Callback Proxy relays the call to `FlowDestination` on the destination chain.

---

## Features

- **Visual Flow Builder** -- 4-step wizard: Trigger, Condition, Action, Review & Deploy
- **On-chain flow persistence** -- FlowRegistry factory stores all flows on-chain, no localStorage needed
- **Auto token detection** -- queries ERC-20 symbol & decimals on-chain, auto-converts threshold values
- **Auto chain switching** -- wallet automatically switches to Reactive Lasna when deploying
- **Cross-chain template library** -- pre-built flows for whale alerts, transfer monitors, event bridges
- **Per-flow isolated reactive contracts** -- each Flow deploys its own `ReactiveFlowEngine` instance
- **Configurable condition engine** -- 6 comparison operators (GT, LT, GTE, LTE, EQ, NEQ) with byte-offset data extraction
- **Real-time execution tracking** -- on-chain execution counter and alert history from destination chain
- **Multi-chain support** -- Ethereum Sepolia and Base Sepolia as origin/destination chains

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity 0.8, Foundry, [reactive-lib](https://github.com/Reactive-Network/reactive-lib) |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, wagmi, RainbowKit |
| Chain Interaction | viem, wagmi hooks, FlowRegistry factory contract |
| Package Manager | pnpm (monorepo) |
| Backend | **None** -- fully client-side + on-chain |

---

## Deployed Contracts

### Testnet Deployment

| Contract | Chain | Address |
|----------|-------|---------|
| FlowRegistry | Lasna | [`0x29362Bf6e28884fB186Ea5B49fE50Dba463Ea578`](https://lasna.reactscan.net/address/0x29362Bf6e28884fB186Ea5B49fE50Dba463Ea578) |
| FlowOrigin | Sepolia | [`0x25859EF6b680249BD924F6F9716BA214A21F916c`](https://sepolia.etherscan.io/address/0x25859EF6b680249BD924F6F9716BA214A21F916c) |
| FlowDestination | Sepolia | [`0x56dcB06691f37F21CbBF8Df9D6467a0536d0644f`](https://sepolia.etherscan.io/address/0x56dcB06691f37F21CbBF8Df9D6467a0536d0644f) |
| FlowDestination | Base Sepolia | [`0x14C201065294464Aa74d66fAaAAcBBD726211B5e`](https://sepolia.basescan.org/address/0x14C201065294464Aa74d66fAaAAcBBD726211B5e) |

### Verified Transactions (End-to-End)

| Step | Chain | Tx Hash |
|------|-------|---------|
| Origin Event (MOCA Transfer) | Sepolia | [`0x0fab03...`](https://sepolia.etherscan.io/tx/0x0fab03a0a03e8f56009cb429987511d164bb0a4a7fd0b784e0c3988fe4877064) |
| FlowRegistry.createFlow | Lasna | [`0x008b1e...`](https://lasna.reactscan.net/tx/0x008b1efcc063602734361273e0bf92a7dd9c850f09b2160fb90c95007040cf6c) |
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
# Edit .env with your private key and RPC URLs

forge build

# Deploy FlowRegistry (only needed once)
forge create src/FlowRegistry.sol:FlowRegistry \
  --rpc-url $REACTIVE_RPC --private-key $PRIVATE_KEY --broadcast

# Deploy FlowDestination on each destination chain
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
 |              |  createFlow() |                  |        |                        |
 | Flow Builder +-------------->| FlowRegistry     |        |                        |
 | (wagmi)      |               |   |              |        |                        |
 |              |               |   v deploy       |        |                        |
 +--------------+               | ReactiveFlow-    |        |                        |
                                | Engine           |        |                        |
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
                                |    emit Callback +------->| Callback Proxy relays  |
                                |                  |        | to FlowDestination     |
                                +------------------+        +------------------------+
```

1. **Create** -- User designs a Flow via the web UI, selecting trigger event, condition, and action.
2. **Deploy** -- Frontend calls `FlowRegistry.createFlow()` which deploys a `ReactiveFlowEngine` and registers the flow on-chain in one transaction.
3. **Subscribe** -- On construction, the engine subscribes to the specified origin chain event.
4. **React** -- When the subscribed event fires, ReactVM calls `react()` with the log data.
5. **Evaluate** -- `react()` extracts a value from log data and evaluates it against the threshold.
6. **Callback** -- If the condition passes, a `Callback` event is emitted targeting the destination.
7. **Execute** -- The Callback Proxy relays the callback to `FlowDestination`.

---

## Smart Contract Details

### FlowRegistry

Factory contract deployed once on Lasna. Creates and registers all user flows on-chain.

- `createFlow(...)` -- deploys a new `ReactiveFlowEngine` and stores flow metadata
- `getUserFlows(address)` -- returns all flows created by a user
- `getUserFlowCount(address)` -- returns flow count for a user
- `getTotalFlows()` -- returns total flows across all users

### ReactiveFlowEngine

The core reactive contract deployed per flow via FlowRegistry.

- **Condition operators:** `NONE`, `GT`, `LT`, `GTE`, `LTE`, `EQ`, `NEQ`
- **Data extraction:** Configurable `dataOffset` to read any 32-byte word from event log data
- **Execution limits:** Optional `maxExecutions` cap (0 = unlimited)
- **Action types:** `ALERT` (simple callback) or `GENERIC_CALLBACK` (custom selector)

### FlowDestination

Callback receiver deployed on destination chains:

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
│   │   │   ├── FlowRegistry.sol        # Factory: deploy + register flows
│   │   │   ├── ReactiveFlowEngine.sol   # Core reactive contract (Lasna)
│   │   │   ├── FlowOrigin.sol           # Event emitter (origin chains)
│   │   │   └── FlowDestination.sol      # Callback receiver (dest chains)
│   │   ├── test/
│   │   │   └── ReactiveFlowEngine.t.sol # 26 unit tests
│   │   ├── script/
│   │   │   ├── DeployRegistry.s.sol     # Registry deploy script
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
│           │   └── wagmi.ts             # Wallet config (Sepolia, Base Sepolia, Lasna)
│           ├── hooks/
│           │   ├── useDeployFlow.ts      # Call FlowRegistry.createFlow()
│           │   ├── useUserFlows.ts       # Read flows from FlowRegistry on-chain
│           │   ├── useExecutionHistory.ts # Read alerts from destination chain
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
