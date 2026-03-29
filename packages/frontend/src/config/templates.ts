import {
  SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  TRANSFER_EVENT_SIG,
  LARGE_TRANSFER_EVENT_SIG,
  FLOW_ORIGIN_ADDRESSES,
  ConditionOp,
  ActionType,
} from "./contracts";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TemplateCategory = "monitoring" | "automation";

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  originChainId: number;
  destinationChainId: number;
  trigger: {
    emitterContract?: `0x${string}`;
    eventSignature: `0x${string}`;
  };
  condition: {
    operator: ConditionOp;
    threshold?: bigint;
    dataOffset?: number;
  };
  action: {
    actionType: ActionType;
  };
}

// Re-export enums for convenience
export { ConditionOp, ActionType };

// ─── Predefined Templates ───────────────────────────────────────────────────

export const FLOW_TEMPLATES: FlowTemplate[] = [
  // 1. Cross-Chain Whale Alert
  {
    id: "cross-chain-whale-alert",
    name: "Cross-Chain Whale Alert",
    description:
      "Monitor ERC-20 Transfer events on Sepolia for amounts of 10,000 or more. " +
      "Sends an alert callback to the destination contract on Sepolia. " +
      "Enter any ERC-20 contract address to watch.",
    category: "monitoring",
    originChainId: SEPOLIA_CHAIN_ID,
    destinationChainId: SEPOLIA_CHAIN_ID,
    trigger: {
      eventSignature: TRANSFER_EVENT_SIG,
    },
    condition: {
      operator: ConditionOp.GTE,
      threshold: BigInt(10_000),
      dataOffset: 0,
    },
    action: {
      actionType: ActionType.ALERT,
    },
  },

  // 2. Large Transfer Monitor
  {
    id: "large-transfer-monitor",
    name: "Large Transfer Monitor",
    description:
      "Watch for FlowOrigin LargeTransfer events on Sepolia with amounts of 50,000 or more. " +
      "Forwards an alert callback cross-chain to Base Sepolia. " +
      "Uses the deployed FlowOrigin contract as the event source.",
    category: "monitoring",
    originChainId: SEPOLIA_CHAIN_ID,
    destinationChainId: BASE_SEPOLIA_CHAIN_ID,
    trigger: {
      emitterContract: FLOW_ORIGIN_ADDRESSES[SEPOLIA_CHAIN_ID],
      eventSignature: LARGE_TRANSFER_EVENT_SIG,
    },
    condition: {
      operator: ConditionOp.GTE,
      threshold: BigInt(50_000),
      dataOffset: 0,
    },
    action: {
      actionType: ActionType.ALERT,
    },
  },

  // 3. Cross-Chain Event Bridge
  {
    id: "cross-chain-event-bridge",
    name: "Cross-Chain Event Bridge",
    description:
      "Bridge any event from Sepolia to Base Sepolia unconditionally. " +
      "Listens for custom events on an origin contract and fires a generic " +
      "callback on the destination. Useful for cross-chain automation workflows.",
    category: "automation",
    originChainId: SEPOLIA_CHAIN_ID,
    destinationChainId: BASE_SEPOLIA_CHAIN_ID,
    trigger: {
      eventSignature: TRANSFER_EVENT_SIG,
    },
    condition: {
      operator: ConditionOp.NONE,
    },
    action: {
      actionType: ActionType.GENERIC_CALLBACK,
    },
  },

  // 4. Unconditional Alert
  {
    id: "unconditional-alert",
    name: "Unconditional Alert",
    description:
      "Fire an alert for every Transfer event on a specific contract, " +
      "with no condition filtering. Ideal for logging all token movements " +
      "on a watched contract on Sepolia.",
    category: "monitoring",
    originChainId: SEPOLIA_CHAIN_ID,
    destinationChainId: SEPOLIA_CHAIN_ID,
    trigger: {
      eventSignature: TRANSFER_EVENT_SIG,
    },
    condition: {
      operator: ConditionOp.NONE,
    },
    action: {
      actionType: ActionType.ALERT,
    },
  },
];
