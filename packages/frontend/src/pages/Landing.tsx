import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Shield,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/shared/WalletButton";
import { Logo } from "@/components/shared/Logo";
import { FlowAnimation } from "@/components/shared/FlowAnimation";

// ─── How-it-works steps ─────────────────────────────────────────────────────

const STEPS = [
  {
    label: "WHEN",
    color: "text-primary",
    borderColor: "border-primary",
    bgColor: "bg-primary/5",
    title: "An event fires on any supported chain",
    description:
      "Token transfers, price updates, or any custom event emitted on Ethereum Sepolia, Base Sepolia, or other supported chains.",
    example: "Transfer(from, to, 50000) on Sepolia",
  },
  {
    label: "IF",
    color: "text-amber-600",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-500/5",
    title: "Conditions are evaluated in ReactVM",
    description:
      "The Reactive Network's ReactVM evaluates your conditions against event data -- amount thresholds, address filters, or data-offset checks.",
    example: "amount >= 10,000",
  },
  {
    label: "THEN",
    color: "text-emerald-600",
    borderColor: "border-emerald-500",
    bgColor: "bg-emerald-500/5",
    title: "Cross-chain callback executes on destination",
    description:
      "A callback is sent to the destination chain via the Reactive Network's callback proxy -- triggering an alert, forwarding data, or executing custom logic.",
    example: "emit Callback(baseSepolia, dest, payload)",
  },
];

// ─── Feature cards ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Activity,
    title: "Cross-Chain Event Monitoring",
    description:
      "Monitor events on any supported origin chain -- ERC-20 transfers, custom contract emissions, price updates -- all routed through Reactive Network.",
  },
  {
    icon: Shield,
    title: "Conditional Logic",
    description:
      "Gate execution with amount-based conditions extracted from event data. Set thresholds, comparisons, and data-offset checks evaluated in ReactVM.",
  },
  {
    icon: Zap,
    title: "Automatic Execution",
    description:
      "Actions execute autonomously via Reactive Network's ReactVM. No servers, no keepers -- your reactive contract handles event processing and callback dispatch.",
  },
  {
    icon: Layers,
    title: "Cross-Chain Template Library",
    description:
      "Start from pre-built cross-chain templates -- whale alerts, transfer monitors, event bridges -- spanning Sepolia, Base Sepolia, and more.",
  },
];

// ─── Landing Page ───────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b px-6 py-4 lg:px-12">
        <Logo size="md" />

        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <WalletButton />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 lg:px-12 lg:py-32">
        <div className="relative mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            Powered by Reactive Network
          </Badge>

          <h1 className="font-heading text-4xl font-extrabold text-balance leading-[1.1] sm:text-5xl lg:text-6xl">
            Cross-Chain Automation,{" "}
            <span className="text-primary">Reactive by Design</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            Build IFTTT-style workflows that monitor events on one chain and
            execute actions on another. No servers. No cron jobs. Pure
            cross-chain reactivity powered by ReactVM.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Launch App
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" size="lg">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>

        {/* Flow pipeline animation */}
        <div className="mx-auto mt-16 max-w-4xl">
          <FlowAnimation />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Three simple steps to automate any cross-chain workflow
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.label} className="relative">
                {/* Connector arrow */}
                {i < STEPS.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <ChevronRight className="size-6 text-border" />
                  </div>
                )}

                <Card className={`h-full border-t-2 ${step.borderColor}`}>
                  <CardContent className="pt-6">
                    <span
                      className={`text-xs font-bold uppercase ${step.color}`}
                    >
                      {step.label}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-balance">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-pretty text-muted-foreground">
                      {step.description}
                    </p>
                    <div
                      className={`mt-4 rounded-md px-3 py-2 ${step.bgColor}`}
                    >
                      <code className="text-xs font-medium">
                        {step.example}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
              Built for the Reactive Network
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              ReactiveFlow leverages Reactive Network's ReactVM for truly
              autonomous cross-chain automation
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-balance">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm text-pretty text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="border-t bg-muted/30 px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
                Cross-Chain Logic, On-Chain
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground">
                Each flow is a reactive smart contract deployed on the Reactive
                Network. When the origin chain emits the event you subscribed
                to, ReactVM evaluates your conditions and dispatches a
                cross-chain callback to the destination chain -- all
                autonomously.
              </p>
              <div className="mt-8">
                <Link to="/flows/create">
                  <Button variant="outline" className="gap-2">
                    Create Your First Flow
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="bg-foreground text-background">
              <CardContent className="pt-6">
                <pre className="overflow-x-auto text-sm leading-relaxed">
                  <code>{`// ReactVM: cross-chain reactive contract
function react(
  uint256 chainId,
  address emitter,
  bytes32 topic0,
  bytes32 topic1,
  bytes calldata data
) external vmOnly {
  // Decode event data
  uint256 amount = abi.decode(data, (uint256));

  // Evaluate condition
  if (amount >= threshold) {
    // Cross-chain callback
    emit Callback(
      destChainId,
      destContract,
      CALLBACK_GAS_LIMIT,
      payload
    );
  }
}`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
            Start Building Cross-Chain Flows
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Connect your wallet, pick a cross-chain template or start from
            scratch, and deploy your first reactive workflow in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Launch App
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" size="lg">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 lg:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Logo size="sm" className="text-muted-foreground" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="size-1.5 rounded-full bg-emerald-500" />
            Reactive Network
          </div>
        </div>
      </footer>
    </div>
  );
}
