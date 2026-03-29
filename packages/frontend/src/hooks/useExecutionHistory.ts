import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem, type PublicClient, toHex, pad } from "viem";

// ─── FlowDestination event ABIs ─────────────────────────────────────────────

const ALERT_RECEIVED_EVENT = parseAbiItem(
  "event AlertReceived(address indexed rvmId, uint256 indexed topic1, uint256 indexed topic2, bytes data, uint256 timestamp)",
);

const GENERIC_CALLBACK_EVENT = parseAbiItem(
  "event GenericCallbackExecuted(address indexed rvmId, bool success)",
);

// ─── Parsed event types ─────────────────────────────────────────────────────

export interface AlertEvent {
  type: "alert";
  rvmId: `0x${string}`;
  topic1: bigint;
  topic2: bigint;
  data: `0x${string}`;
  timestamp: bigint;
  blockNumber: bigint;
  txHash: `0x${string}`;
}

export interface GenericCallbackEvent {
  type: "callback";
  rvmId: `0x${string}`;
  success: boolean;
  blockNumber: bigint;
  txHash: `0x${string}`;
}

export type ExecutionEvent = AlertEvent | GenericCallbackEvent;

// ─── Batch getLogs helper (respects 10k block limit) ────────────────────────

const CHUNK_SIZE = 9900n;

async function batchGetLogs(
  client: PublicClient,
  params: { address: `0x${string}`; event: any; fromBlock: bigint; toBlock: bigint; args?: any },
) {
  const results: any[] = [];
  for (let from = params.fromBlock; from <= params.toBlock; from += CHUNK_SIZE + 1n) {
    const to = from + CHUNK_SIZE > params.toBlock ? params.toBlock : from + CHUNK_SIZE;
    const logs = await client.getLogs({ ...params, fromBlock: from, toBlock: to });
    results.push(...logs);
  }
  return results;
}

// ─── Estimate block number from timestamp ───────────────────────────────────

/** Sepolia ~12s/block, Base Sepolia ~2s/block */
function estimateBlocksFromTimestamp(
  headBlock: bigint,
  createdAtMs: number,
  chainId: number,
): bigint {
  const nowMs = Date.now();
  const ageSec = Math.max(0, (nowMs - createdAtMs) / 1000);
  const blockTime = chainId === 84532 ? 2 : 12; // Base Sepolia vs Sepolia
  const blocksAgo = BigInt(Math.ceil(ageSec / blockTime)) + 100n; // +100 buffer
  return headBlock > blocksAgo ? headBlock - blocksAgo : 0n;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Reads execution history from FlowDestination contract.
 * Filters AlertReceived events by topic1 == reactiveAddress (per-flow filtering).
 */
export function useExecutionHistory(
  destinationChainId?: number,
  destinationContract?: `0x${string}`,
  createdAt?: number,
  reactiveAddress?: `0x${string}`,
) {
  const client = usePublicClient({ chainId: destinationChainId });

  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["executionHistory", destinationChainId, destinationContract, createdAt, reactiveAddress],
    queryFn: async (): Promise<ExecutionEvent[]> => {
      if (!client || !destinationContract) return [];

      const headBlock = await client.getBlockNumber();

      const fromBlock = createdAt && destinationChainId
        ? estimateBlocksFromTimestamp(headBlock, createdAt, destinationChainId)
        : (headBlock > 10000n ? headBlock - 10000n : 0n);

      // Filter AlertReceived by topic1 = reactive contract address (uint256)
      const alertArgs = reactiveAddress
        ? { topic1: BigInt(reactiveAddress) }
        : undefined;

      const [alertLogs, callbackLogs] = await Promise.all([
        batchGetLogs(client, {
          address: destinationContract,
          event: ALERT_RECEIVED_EVENT,
          args: alertArgs,
          fromBlock,
          toBlock: headBlock,
        }),
        batchGetLogs(client, {
          address: destinationContract,
          event: GENERIC_CALLBACK_EVENT,
          fromBlock,
          toBlock: headBlock,
        }),
      ]);

      const alertEvents: AlertEvent[] = alertLogs.map((log: any) => ({
        type: "alert" as const,
        rvmId: log.args.rvmId!,
        topic1: log.args.topic1!,
        topic2: log.args.topic2!,
        data: log.args.data as `0x${string}`,
        timestamp: log.args.timestamp!,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
      }));

      const callbackEvents: GenericCallbackEvent[] = callbackLogs.map((log: any) => ({
        type: "callback" as const,
        rvmId: log.args.rvmId!,
        success: log.args.success!,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
      }));

      return [...alertEvents, ...callbackEvents].sort(
        (a, b) => Number(b.blockNumber - a.blockNumber),
      );
    },
    enabled: !!client && !!destinationContract && !!destinationChainId,
    refetchInterval: 30_000,
  });

  return { events, isLoading, error, refetch };
}
