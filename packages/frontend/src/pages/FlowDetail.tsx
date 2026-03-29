import { useParams, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import { useUserFlows } from "@/hooks/useUserFlows";
import { useExecutionHistory } from "@/hooks/useExecutionHistory";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { SUPPORTED_CHAINS, ConditionOp } from "@/config/contracts";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";



const CONDITION_LABELS: Record<number, string> = {
  [ConditionOp.NONE]: "None",
  [ConditionOp.GT]: ">",
  [ConditionOp.LT]: "<",
  [ConditionOp.GTE]: ">=",
  [ConditionOp.LTE]: "<=",
  [ConditionOp.EQ]: "==",
  [ConditionOp.NEQ]: "!=",
};

function getChainName(chainId: number): string {
  return SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`;
}

function getChainExplorer(chainId: number): string | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === chainId)?.explorerUrl;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const REACTSCAN_URL = "https://lasna.reactscan.net";

export default function FlowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { flows } = useUserFlows();

  const flow = flows.find((f) => f.id === id);

  const { events, isLoading: eventsLoading } = useExecutionHistory(
    flow?.destinationChainId,
    flow?.destinationContract,
  );

  // Token info for human-readable threshold display
  const { symbol: tokenSymbol, decimals: tokenDecimals, isToken } = useTokenInfo(
    flow?.originContract,
    flow?.originChainId,
  );

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Connect your wallet to view flow details
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {id ? "Flow not found" : "Loading flow..."}
      </div>
    );
  }

  const originExplorer = getChainExplorer(flow.originChainId);
  const destExplorer = getChainExplorer(flow.destinationChainId);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6 gap-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-3 rounded-full bg-emerald-500" />
          <h1 className="text-2xl font-bold text-balance text-foreground">
            {flow.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${REACTSCAN_URL}/address/${flow.reactiveAddress}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <ExternalLink className="size-4" />
              Reactscan
            </Button>
          </a>
        </div>
      </div>

      {/* Cross-chain route */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Cross-Chain Route</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center">
              <Badge variant="outline" className="mb-1">
                {getChainName(flow.originChainId)}
              </Badge>
              <p className="text-xs text-muted-foreground">Origin</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            <div className="text-center">
              <Badge variant="default" className="mb-1">
                Reactive Lasna
              </Badge>
              <p className="text-xs text-muted-foreground">Processing</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            <div className="text-center">
              <Badge variant="outline" className="mb-1">
                {getChainName(flow.destinationChainId)}
              </Badge>
              <p className="text-xs text-muted-foreground">Destination</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-primary">
              Origin Contract
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm break-all">{flow.originContract}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Chain: {getChainName(flow.originChainId)}
            </p>
            {originExplorer && (
              <a
                href={`${originExplorer}/address/${flow.originContract}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline underline-offset-4 mt-1 inline-flex items-center gap-1"
              >
                View on Explorer <ExternalLink className="size-3" />
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-emerald-600">
              Destination Contract
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm break-all">{flow.destinationContract}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Chain: {getChainName(flow.destinationChainId)}
            </p>
            {destExplorer && (
              <a
                href={`${destExplorer}/address/${flow.destinationContract}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline underline-offset-4 mt-1 inline-flex items-center gap-1"
              >
                View on Explorer <ExternalLink className="size-3" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Condition */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-amber-600">
            Condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flow.conditionOp === ConditionOp.NONE ? (
            <p className="font-semibold">No condition (always execute)</p>
          ) : (
            <div>
              <p className="font-semibold">
                Event data {CONDITION_LABELS[flow.conditionOp] ?? "?"}{" "}
                {isToken && tokenDecimals !== undefined
                  ? `${formatUnits(BigInt(flow.threshold), tokenDecimals)} ${tokenSymbol}`
                  : flow.threshold}
              </p>
              {isToken && tokenDecimals !== undefined && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  raw: {flow.threshold} ({tokenDecimals} decimals)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Reactive Contract</p>
              <a
                href={`${REACTSCAN_URL}/address/${flow.reactiveAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold font-mono text-primary hover:underline underline-offset-4"
              >
                {truncateAddress(flow.reactiveAddress)}
              </a>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Executions</p>
              <p className="text-lg font-bold tabular-nums">
                {Number(flow.executionCount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Executions</p>
              <p className="text-lg font-bold tabular-nums">
                {Number(flow.maxExecutions) === 0
                  ? "Unlimited"
                  : Number(flow.maxExecutions)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm font-bold tabular-nums">
                {new Date(flow.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <p className="text-muted-foreground text-center py-8">
              Loading events...
            </p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No executions yet
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event, idx) => (
                <div
                  key={`${event.txHash}-${idx}`}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 size-2.5 shrink-0 rounded-full ${
                          event.type === "alert"
                            ? "bg-amber-500"
                            : event.type === "callback" && event.success
                              ? "bg-emerald-500"
                              : "bg-destructive"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {event.type === "alert"
                            ? "Alert Received"
                            : event.success
                              ? "Callback Executed"
                              : "Callback Failed"}
                        </p>
                        {event.type === "alert" && (
                          <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                            RVM: {truncateAddress(event.rvmId)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        event.type === "alert"
                          ? "warning"
                          : event.type === "callback" && event.success
                            ? "success"
                            : "destructive"
                      }
                    >
                      {event.type === "alert"
                        ? "Alert"
                        : event.success
                          ? "Success"
                          : "Failed"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      Block {event.blockNumber.toString()}
                    </span>
                    {event.type === "alert" && (
                      <span className="tabular-nums">
                        {new Date(Number(event.timestamp) * 1000).toLocaleString()}
                      </span>
                    )}
                    {destExplorer && (
                      <a
                        href={`${destExplorer}/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline underline-offset-4"
                      >
                        {event.txHash.slice(0, 10)}...{event.txHash.slice(-6)}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
