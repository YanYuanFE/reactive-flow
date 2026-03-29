import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import {
  FLOW_REGISTRY_ADDRESS,
  FLOW_REGISTRY_ABI,
  REACTIVE_FLOW_ENGINE_ABI,
  REACTIVE_LASNA_CHAIN_ID,
} from "@/config/contracts";

// ─── Flow shape (matches on-chain FlowInfo + execution stats) ───────────────

export interface Flow {
  id: string;
  reactiveAddress: `0x${string}`;
  name: string;
  originChainId: number;
  originContract: `0x${string}`;
  destinationChainId: number;
  destinationContract: `0x${string}`;
  conditionOp: number;
  threshold: string;
  actionType: number;
  createdAt: number;
  executionCount: bigint;
  maxExecutions: bigint;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useUserFlows() {
  const { address } = useAccount();

  // Read flows from FlowRegistry on Lasna
  const {
    data: flowsData,
    isLoading: isLoadingFlows,
    refetch,
  } = useReadContract({
    address: FLOW_REGISTRY_ADDRESS,
    abi: FLOW_REGISTRY_ABI,
    functionName: "getUserFlows",
    args: address ? [address] : undefined,
    chainId: REACTIVE_LASNA_CHAIN_ID,
    query: {
      enabled: !!address,
      refetchInterval: 30_000,
    },
  });

  // Map raw on-chain data to our local shape
  const storedFlows = useMemo(() => {
    if (!flowsData || !Array.isArray(flowsData)) return [];
    return (flowsData as readonly {
      reactiveContract: `0x${string}`;
      name: string;
      originChainId: bigint;
      originContract: `0x${string}`;
      destinationChainId: bigint;
      destinationContract: `0x${string}`;
      conditionOp: number;
      threshold: bigint;
      actionType: number;
      createdAt: bigint;
    }[]).map((f, i) => ({
      id: i.toString(),
      reactiveAddress: f.reactiveContract,
      name: f.name,
      originChainId: Number(f.originChainId),
      originContract: f.originContract,
      destinationChainId: Number(f.destinationChainId),
      destinationContract: f.destinationContract,
      conditionOp: Number(f.conditionOp),
      threshold: f.threshold.toString(),
      actionType: Number(f.actionType),
      createdAt: Number(f.createdAt) * 1000,
    }));
  }, [flowsData]);

  // Batch read alertCount from Destination contracts + maxExecutions from Reactive contracts
  const contractCalls = useMemo(
    () =>
      storedFlows.flatMap((f) => [
        {
          address: f.destinationContract,
          abi: [{ name: "alertCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] }] as const,
          functionName: "alertCount" as const,
          chainId: f.destinationChainId,
        },
        {
          address: f.reactiveAddress,
          abi: REACTIVE_FLOW_ENGINE_ABI,
          functionName: "maxExecutions" as const,
          chainId: REACTIVE_LASNA_CHAIN_ID,
        },
      ]),
    [storedFlows],
  );

  const { data: execData, isLoading: isLoadingExec } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: storedFlows.length > 0,
      refetchInterval: 30_000,
    },
  });

  // Merge execution data into flows
  const flows: Flow[] = useMemo(() => {
    return storedFlows.map((f, i) => {
      const alertResult = execData?.[i * 2];
      const maxResult = execData?.[i * 2 + 1];

      const executionCount =
        alertResult?.status === "success"
          ? (alertResult.result as bigint)
          : 0n;

      const maxExecutions =
        maxResult?.status === "success"
          ? (maxResult.result as bigint)
          : 0n;

      return {
        ...f,
        executionCount,
        maxExecutions,
      };
    });
  }, [storedFlows, execData]);

  const isLoading = isLoadingFlows || (storedFlows.length > 0 && isLoadingExec);

  return {
    flows,
    flowCount: flows.length,
    isLoading,
    refetch,
  };
}
