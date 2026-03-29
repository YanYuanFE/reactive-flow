// ─── Chain IDs ──────────────────────────────────────────────────────────────

export const SEPOLIA_CHAIN_ID = 11155111;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const REACTIVE_LASNA_CHAIN_ID = 5318007;

// ─── Callback Proxy Addresses (per chain) ───────────────────────────────────

export const CALLBACK_PROXIES: Record<number, `0x${string}`> = {
  [SEPOLIA_CHAIN_ID]: "0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA",
  [BASE_SEPOLIA_CHAIN_ID]: "0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6",
};

// ─── System Contract (same on all Reactive networks) ────────────────────────

export const SYSTEM_CONTRACT =
  "0x0000000000000000000000000000000000fffFfF" as `0x${string}`;

// ─── Deployed Contract Addresses (update after deployment) ──────────────────

export const FLOW_DESTINATION_ADDRESSES: Record<number, `0x${string}`> = {
  [SEPOLIA_CHAIN_ID]: "0x6A38462B4233708530f4bAc1339a7b5c16c3B635",
  [BASE_SEPOLIA_CHAIN_ID]: "0x0B14eAdDAFA5E52a3e810E9CC27BA8721c8A971c",
};

export const FLOW_ORIGIN_ADDRESSES: Record<number, `0x${string}`> = {
  [SEPOLIA_CHAIN_ID]: "0x25859EF6b680249BD924F6F9716BA214A21F916c",
};

// ─── Well-known Event Signatures ────────────────────────────────────────────

/** keccak256("Transfer(address,address,uint256)") */
export const TRANSFER_EVENT_SIG =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as `0x${string}`;

/** keccak256("LargeTransfer(address,address,uint256)") */
export const LARGE_TRANSFER_EVENT_SIG =
  "0x3f6891e1a2a9b15049cb996a65b5732644814d27e4a8e1f5a3b0d23432f53f4e" as `0x${string}`;

/** keccak256("PriceUpdate(address,uint256)") */
export const PRICE_UPDATE_EVENT_SIG =
  "0x64e6e7bd72b853c4e62fd6ceaca05a104700c70a4cb567c75c7f2242ba7f037c" as `0x${string}`;

/** keccak256("CustomAction(address,bytes32,bytes)") */
export const CUSTOM_ACTION_EVENT_SIG =
  "0xee513e8675911a5fe9793d01e64e48a99d07d9e0d37b6d4b0c02a041afb7911c" as `0x${string}`;

// ─── Supported Chains Metadata ──────────────────────────────────────────────

export interface ChainInfo {
  id: number;
  name: string;
  type: "origin" | "destination" | "reactive";
  explorerUrl: string;
}

export const SUPPORTED_CHAINS: ChainInfo[] = [
  {
    id: SEPOLIA_CHAIN_ID,
    name: "Ethereum Sepolia",
    type: "origin",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  {
    id: BASE_SEPOLIA_CHAIN_ID,
    name: "Base Sepolia",
    type: "destination",
    explorerUrl: "https://sepolia.basescan.org",
  },
  {
    id: REACTIVE_LASNA_CHAIN_ID,
    name: "Reactive Lasna",
    type: "reactive",
    explorerUrl: "https://lasna.reactscan.net",
  },
];

// ─── Condition Operators ────────────────────────────────────────────────────

export enum ConditionOp {
  NONE = 0,
  GT = 1,
  LT = 2,
  GTE = 3,
  LTE = 4,
  EQ = 5,
  NEQ = 6,
}

// ─── Action Types ───────────────────────────────────────────────────────────

export enum ActionType {
  ALERT = 0,
  GENERIC_CALLBACK = 1,
}

// ─── FlowOrigin ABI ────────────────────────────────────────────────────────

export const FLOW_ORIGIN_ABI = [
  // Functions
  {
    type: "function",
    name: "simulateTransfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "simulatePriceUpdate",
    inputs: [
      { name: "token", type: "address" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "simulateCustomAction",
    inputs: [
      { name: "actionType", type: "bytes32" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Events
  {
    type: "event",
    name: "LargeTransfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PriceUpdate",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CustomAction",
    inputs: [
      { name: "actor", type: "address", indexed: true },
      { name: "actionType", type: "bytes32", indexed: true },
      { name: "data", type: "bytes", indexed: false },
    ],
  },
] as const;

// ─── FlowDestination ABI ───────────────────────────────────────────────────

export const FLOW_DESTINATION_ABI = [
  // Functions
  {
    type: "function",
    name: "alertCallback",
    inputs: [
      { name: "_rvmId", type: "address" },
      { name: "_topic1", type: "uint256" },
      { name: "_topic2", type: "uint256" },
      { name: "_data", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "genericCallback",
    inputs: [
      { name: "_rvmId", type: "address" },
      { name: "_topic1", type: "uint256" },
      { name: "_topic2", type: "uint256" },
      { name: "_data", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAlertCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAlert",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "rvmId", type: "address" },
          { name: "topic1", type: "uint256" },
          { name: "topic2", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentAlerts",
    inputs: [{ name: "count", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "rvmId", type: "address" },
          { name: "topic1", type: "uint256" },
          { name: "topic2", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "alertCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "AlertReceived",
    inputs: [
      { name: "rvmId", type: "address", indexed: true },
      { name: "topic1", type: "uint256", indexed: true },
      { name: "topic2", type: "uint256", indexed: true },
      { name: "data", type: "bytes", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "GenericCallbackExecuted",
    inputs: [
      { name: "rvmId", type: "address", indexed: true },
      { name: "success", type: "bool", indexed: false },
    ],
  },
] as const;

// ─── ReactiveFlowEngine ABI (read-only, deployed via bytecode) ─────────────

export const REACTIVE_FLOW_ENGINE_ABI = [
  // Read-only state variables
  {
    type: "function",
    name: "executionCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "maxExecutions",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "flowName",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "originChainId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "destinationChainId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "destinationContract",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "conditionOp",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "threshold",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "dataOffset",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "actionType",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "callbackSelector",
    inputs: [],
    outputs: [{ name: "", type: "bytes4" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "CALLBACK_GAS_LIMIT",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "FlowTriggered",
    inputs: [
      { name: "originChainId", type: "uint256", indexed: true },
      { name: "executionCount", type: "uint256", indexed: true },
    ],
  },
] as const;

// ─── FlowRegistry ───────────────────────────────────────────────────────────

export const FLOW_REGISTRY_ADDRESS = "0x8BDE9530910d448727f098A8847197146DEbeC5E" as `0x${string}`;

export const FLOW_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerFlow",
    inputs: [
      { name: "_reactiveContract", type: "address" },
      { name: "_name", type: "string" },
      { name: "_originChainId", type: "uint256" },
      { name: "_originContract", type: "address" },
      { name: "_destinationChainId", type: "uint256" },
      { name: "_destinationContract", type: "address" },
      { name: "_conditionOp", type: "uint8" },
      { name: "_threshold", type: "uint256" },
      { name: "_actionType", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserFlows",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "reactiveContract", type: "address" },
          { name: "name", type: "string" },
          { name: "originChainId", type: "uint256" },
          { name: "originContract", type: "address" },
          { name: "destinationChainId", type: "uint256" },
          { name: "destinationContract", type: "address" },
          { name: "conditionOp", type: "uint8" },
          { name: "threshold", type: "uint256" },
          { name: "actionType", type: "uint8" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserFlowCount",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalFlows",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allFlows",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "FlowRegistered",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "reactiveContract", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "originChainId", type: "uint256", indexed: false },
      { name: "destinationChainId", type: "uint256", indexed: false },
    ],
  },
] as const;
