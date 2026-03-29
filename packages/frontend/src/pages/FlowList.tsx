import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { Plus, Zap, ExternalLink, ArrowRight } from "lucide-react";
import { useUserFlows } from "@/hooks/useUserFlows";
import { SUPPORTED_CHAINS } from "@/config/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function getChainName(chainId: number): string {
  return SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const REACTSCAN_URL = "https://lasna.reactscan.net";

export default function FlowList() {
  const { isConnected } = useAccount();
  const { flows, flowCount, isLoading } = useUserFlows();

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Connect your wallet to view your flows
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-balance text-foreground">My Flows</h1>
          <p className="text-muted-foreground mt-1">
            {flowCount} {flowCount === 1 ? "flow" : "flows"} created
          </p>
        </div>
        <Link to="/flows/create">
          <Button className="gap-2">
            <Plus className="size-4" />
            New Flow
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">
          Loading flows...
        </div>
      ) : flows.length === 0 ? (
        <div className="text-center py-20">
          <Zap className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No flows yet</p>
          <Link
            to="/flows/create"
            className="text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Create your first flow
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {flows.map((flow) => (
            <Card key={flow.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <Link
                    to={`/flows/${flow.id}`}
                    className="flex-1 hover:opacity-80"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-lg font-semibold">{flow.name}</h3>
                    </div>

                    {/* Chain route badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">
                        {getChainName(flow.originChainId)}
                      </Badge>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <Badge variant="outline">
                        {getChainName(flow.destinationChainId)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        Reactive:{" "}
                        <span className="text-foreground font-mono">
                          {truncateAddress(flow.reactiveAddress)}
                        </span>
                      </span>
                      <span>
                        Executions:{" "}
                        <span className="text-foreground tabular-nums">
                          {Number(flow.executionCount)}
                          {flow.maxExecutions > 0n
                            ? ` / ${Number(flow.maxExecutions)}`
                            : ""}
                        </span>
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Reactscan link */}
                    <a
                      href={`${REACTSCAN_URL}/address/${flow.reactiveAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="View on Reactscan"
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
