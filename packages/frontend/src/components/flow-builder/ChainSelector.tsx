import { SUPPORTED_CHAINS, type ChainInfo } from "@/config/contracts";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ─── Chain type badge colors ────────────────────────────────────────────────

const CHAIN_TYPE_STYLES: Record<ChainInfo["type"], string> = {
  origin: "bg-blue-50 text-blue-700 border-blue-200",
  destination: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reactive: "bg-purple-50 text-purple-700 border-purple-200",
};

const CHAIN_TYPE_LABELS: Record<ChainInfo["type"], string> = {
  origin: "Origin",
  destination: "Destination",
  reactive: "Reactive",
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  /** Currently selected chain ID */
  value: number;
  /** Called when the user selects a chain */
  onChange: (chainId: number) => void;
  /** Optional label displayed above the selector */
  label?: string;
  /** Filter chains by type (e.g. only show origin chains) */
  filterType?: ChainInfo["type"] | ChainInfo["type"][];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChainSelector({
  value,
  onChange,
  label = "Chain",
  filterType,
}: Props) {
  const filterTypes = filterType
    ? Array.isArray(filterType)
      ? filterType
      : [filterType]
    : undefined;

  const chains = filterTypes
    ? SUPPORTED_CHAINS.filter((c) => filterTypes.includes(c.type))
    : SUPPORTED_CHAINS;

  return (
    <div className="space-y-3">
      <Label className="block">{label}</Label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {chains.map((chain) => (
          <button
            key={chain.id}
            onClick={() => onChange(chain.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
              value === chain.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-accent",
            )}
          >
            <ChainIcon chainId={chain.id} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {chain.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Chain ID: {chain.id}
              </p>
            </div>
            <Badge
              className={cn(
                "shrink-0 text-[10px] uppercase tracking-wide",
                CHAIN_TYPE_STYLES[chain.type],
              )}
            >
              {CHAIN_TYPE_LABELS[chain.type]}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Chain Icon ─────────────────────────────────────────────────────────────

function ChainIcon({ chainId }: { chainId: number }) {
  // Simple colored circle with chain initial
  const config = getChainIconConfig(chainId);
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
        config.bg,
      )}
    >
      {config.letter}
    </div>
  );
}

function getChainIconConfig(chainId: number): {
  bg: string;
  letter: string;
} {
  switch (chainId) {
    case 11155111:
      return { bg: "bg-indigo-500", letter: "E" };
    case 84532:
      return { bg: "bg-blue-500", letter: "B" };
    case 5318007:
      return { bg: "bg-purple-600", letter: "R" };
    default:
      return { bg: "bg-gray-500", letter: "?" };
  }
}
