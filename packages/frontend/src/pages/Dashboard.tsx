import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import {
  Plus,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useUserFlows, type Flow } from "@/hooks/useUserFlows";
import { SUPPORTED_CHAINS } from "@/config/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/shared/Logo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Helpers ────────────────────────────────────────────────────────────────

function chainName(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  return chain?.name ?? `Chain ${chainId}`;
}

function chainShort(chainId: number): string {
  switch (chainId) {
    case 11155111:
      return "Sepolia";
    case 84532:
      return "Base Sepolia";
    default:
      return `#${chainId}`;
  }
}

function chainBadgeColor(chainId: number): string {
  switch (chainId) {
    case 11155111:
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case 84532:
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function explorerUrl(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  return chain?.explorerUrl ?? "#";
}

// ─── Flow Row Component ─────────────────────────────────────────────────────

function FlowRow({ flow }: { flow: Flow }) {
  const maxExec = Number(flow.maxExecutions);

  return (
    <Link
      to={`/flows/${flow.id}`}
      className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-2.5 shrink-0 rounded-full bg-emerald-500" />
        <div className="min-w-0">
          <p className="font-medium truncate">{flow.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              className={`text-[10px] ${chainBadgeColor(flow.originChainId)}`}
            >
              {chainShort(flow.originChainId)}
            </Badge>
            <ArrowRight className="size-3 text-muted-foreground" />
            <Badge
              className={`text-[10px] ${chainBadgeColor(flow.destinationChainId)}`}
            >
              {chainShort(flow.destinationChainId)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm tabular-nums text-muted-foreground">
          {maxExec > 0 ? `Max ${maxExec}` : "Unlimited"}
        </span>
        <Badge variant="success">Active</Badge>
      </div>
    </Link>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { flows, flowCount, isLoading } = useUserFlows();

  // ── Not connected ──

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-[#1e1b4b] mb-6">
          <LogoIcon size={44} />
        </div>
        <h1 className="text-4xl font-bold text-balance mb-4 text-foreground">
          ReactiveFlow
        </h1>
        <p className="text-pretty text-lg text-muted-foreground mb-8 max-w-md">
          Cross-chain IFTTT workflow orchestrator powered by Reactive Network.
          Create automated flows without writing Solidity.
        </p>
        <p className="text-muted-foreground">
          Connect your wallet to get started
        </p>
      </div>
    );
  }

  // ── Stats ──

  const activeFlows = flows.filter((f) => {
    const max = Number(f.maxExecutions);
    return max === 0; // unlimited = active
  }).length;

  // ── Connected ──

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-balance text-foreground">
            Dashboard
          </h1>
          <p className="text-pretty text-muted-foreground mt-1">
            Overview of your cross-chain reactive flows
          </p>
        </div>
        <Link to="/flows/create">
          <Button className="gap-2">
            <Plus className="size-4" />
            New Flow
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="size-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                Total Flows
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{flowCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Zap className="size-5 text-emerald-600" />
              </div>
              <span className="text-sm text-muted-foreground">
                Active Flows
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{activeFlows}</p>
          </CardContent>
        </Card>
      </div>

      {/* Flows List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Flows</CardTitle>
          {flows.length > 0 && (
            <Link
              to="/flows"
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              View all
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading flows...
              </div>
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5 mx-auto mb-4">
                <Zap className="size-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Create your first flow
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Set up a cross-chain reactive flow that monitors events on one
                chain and executes actions on another.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/flows/create">
                  <Button className="gap-2">
                    <Plus className="size-4" />
                    New Flow
                  </Button>
                </Link>
                <Link to="/templates">
                  <Button variant="outline">Browse Templates</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {flows.slice(0, 8).map((flow) => (
                <FlowRow key={flow.id} flow={flow} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
