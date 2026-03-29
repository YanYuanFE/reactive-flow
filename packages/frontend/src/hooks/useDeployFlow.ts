import { useState, useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { parseEther, encodeDeployData } from "viem";
import {
  FLOW_REGISTRY_ADDRESS,
  FLOW_REGISTRY_ABI,
  REACTIVE_LASNA_CHAIN_ID,
} from "@/config/contracts";
import {
  REACTIVE_FLOW_ENGINE_BYTECODE,
  REACTIVE_FLOW_ENGINE_DEPLOY_ABI,
} from "@/config/bytecode";

// ─── Enums ─────────────────────────────────────────────────────────────────

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

export { REACTIVE_LASNA_CHAIN_ID };

export const DEFAULT_DEPLOY_VALUE = BigInt("100000000000000000"); // 0.1 lREACT

// ─── Deploy params ─────────────────────────────────────────────────────────

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

export type DeployStep =
  | "idle"
  | "deploying"
  | "deploy_confirming"
  | "registering"
  | "register_confirming"
  | "done";

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useDeployFlow() {
  const { data: walletClient } = useWalletClient({ chainId: REACTIVE_LASNA_CHAIN_ID });
  const publicClient = usePublicClient({ chainId: REACTIVE_LASNA_CHAIN_ID });

  const [step, setStep] = useState<DeployStep>("idle");
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const [registerTxHash, setRegisterTxHash] = useState<`0x${string}`>();
  const [deployedAddress, setDeployedAddress] = useState<`0x${string}`>();
  const [error, setError] = useState<Error>();

  const reset = useCallback(() => {
    setStep("idle");
    setTxHash(undefined);
    setRegisterTxHash(undefined);
    setDeployedAddress(undefined);
    setError(undefined);
  }, []);

  const deployFlow = useCallback(
    async (params: DeployFlowParams) => {
      if (!walletClient || !publicClient) {
        setError(new Error("Wallet not connected to Reactive Lasna"));
        return;
      }

      try {
        setError(undefined);

        // Step 1: Deploy ReactiveFlowEngine directly from user's wallet (EOA)
        setStep("deploying");
        const deployData = encodeDeployData({
          abi: REACTIVE_FLOW_ENGINE_DEPLOY_ABI,
          bytecode: REACTIVE_FLOW_ENGINE_BYTECODE,
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
        });

        const wc = walletClient!;
        const deployHash = await (wc as any).sendTransaction({
          data: deployData,
          value: parseEther("0.1"),
          chain: wc.chain,
        });
        setTxHash(deployHash);
        setStep("deploy_confirming");

        const deployReceipt = await publicClient.waitForTransactionReceipt({
          hash: deployHash,
        });

        if (!deployReceipt.contractAddress) {
          throw new Error("Deploy failed: no contract address in receipt");
        }

        const contractAddr = deployReceipt.contractAddress;
        setDeployedAddress(contractAddr);

        // Step 2: Register in FlowRegistry
        setStep("registering");
        const regHash = await (wc as any).writeContract({
          address: FLOW_REGISTRY_ADDRESS,
          abi: FLOW_REGISTRY_ABI,
          functionName: "registerFlow",
          args: [
            contractAddr,
            params.name,
            BigInt(params.originChainId),
            params.originContract,
            BigInt(params.destinationChainId),
            params.destinationContract,
            params.conditionOp,
            params.threshold,
            params.actionType,
          ],
          chain: wc.chain,
        });
        setRegisterTxHash(regHash);
        setStep("register_confirming");

        await publicClient.waitForTransactionReceipt({ hash: regHash });
        setStep("done");
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStep("idle");
      }
    },
    [walletClient, publicClient],
  );

  return {
    deployFlow,
    step,
    txHash,
    registerTxHash,
    deployedAddress,
    error,
    reset,
    // Backward-compatible flags
    isPending: step === "deploying" || step === "registering",
    isConfirming: step === "deploy_confirming" || step === "register_confirming",
    isConfirmed: step === "done",
  };
}
