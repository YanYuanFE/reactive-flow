import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  FLOW_REGISTRY_ADDRESS,
  FLOW_REGISTRY_ABI,
  REACTIVE_LASNA_CHAIN_ID,
} from "@/config/contracts";
import { parseEther, decodeEventLog } from "viem";

// ─── Enums (mirrors of Solidity) ────────────────────────────────────────────

export enum ConditionOp {
  NONE = 0,
  GT = 1,
  LT = 2,
  GTE = 3,
  LTE = 4,
  EQ = 5,
  NEQ = 6,
}

export enum ActionType {
  ALERT = 0,
  GENERIC_CALLBACK = 1,
}

// Re-export for backward compatibility
export { REACTIVE_LASNA_CHAIN_ID };

/** Default funding amount sent with deploy (0.1 lREACT) */
export const DEFAULT_DEPLOY_VALUE = BigInt("100000000000000000"); // 0.1 ETH

// ─── Deploy params interface ────────────────────────────────────────────────

export interface DeployFlowParams {
  name: string;
  originChainId: number;
  originContract: `0x${string}`;
  topic0: `0x${string}`;
  destinationChainId: number;
  destinationContract: `0x${string}`;
  conditionOp: number;
  threshold: bigint;
  dataOffset: number;
  actionType: number;
  callbackSelector: `0x${string}`;
  maxExecutions: bigint;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDeployFlow() {
  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /**
   * Deploy a new ReactiveFlowEngine contract via FlowRegistry.
   * Calls createFlow on the registry which deploys and registers the engine.
   */
  async function deployFlow(params: DeployFlowParams) {
    await writeContractAsync({
      address: FLOW_REGISTRY_ADDRESS,
      abi: FLOW_REGISTRY_ABI,
      functionName: "createFlow",
      args: [
        params.name,
        BigInt(params.originChainId),
        params.originContract,
        BigInt(params.topic0),
        BigInt(params.destinationChainId),
        params.destinationContract,
        params.conditionOp,
        params.threshold,
        params.dataOffset,
        params.actionType,
        params.callbackSelector,
        params.maxExecutions,
      ],
      value: parseEther("0.1"), // Fund the reactive contract
      chainId: REACTIVE_LASNA_CHAIN_ID,
    });
  }

  // Extract deployed address from receipt logs (FlowCreated event, topic[2] = reactiveContract)
  let deployedAddress: `0x${string}` | undefined;
  if (receipt?.logs) {
    // Find the FlowCreated event log - it has 3 indexed topics (event sig, owner, reactiveContract)
    for (const log of receipt.logs) {
      if (log.topics.length >= 3 && log.address.toLowerCase() === FLOW_REGISTRY_ADDRESS.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: FLOW_REGISTRY_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "FlowCreated") {
            deployedAddress = (decoded.args as { reactiveContract: `0x${string}` }).reactiveContract;
            break;
          }
        } catch {
          // Not the event we're looking for, skip
        }
      }
    }
  }

  return {
    deployFlow,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    deployedAddress,
    receipt,
    error,
    reset,
  };
}
