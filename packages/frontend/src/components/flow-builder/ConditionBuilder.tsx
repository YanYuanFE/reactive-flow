import { formatUnits, parseUnits } from "viem";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Condition operators (mirrors ConditionOp enum in Solidity) ─────────────

const CONDITION_OPS = [
  { value: 0, label: "No Condition", description: "Always execute" },
  { value: 1, label: "Greater Than (>)", description: "Value must be greater than threshold" },
  { value: 2, label: "Less Than (<)", description: "Value must be less than threshold" },
  { value: 3, label: "Greater or Equal (>=)", description: "Value must be >= threshold" },
  { value: 4, label: "Less or Equal (<=)", description: "Value must be <= threshold" },
  { value: 5, label: "Equal (==)", description: "Value must equal threshold" },
  { value: 6, label: "Not Equal (!=)", description: "Value must not equal threshold" },
];

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConditionConfig {
  operator: number;
  threshold: string;    // human-readable value (e.g. "10000")
  thresholdRaw: string; // raw uint256 string for contract (auto-computed)
  dataOffset: number;
}

interface Props {
  value: ConditionConfig;
  onChange: (value: ConditionConfig) => void;
  /** Emitter contract address for on-chain token info lookup */
  emitterContract?: string;
  /** Origin chain ID for the read call */
  originChainId?: number;
  /** Whether the trigger is an ERC-20 Transfer (enables token lookup) */
  isErc20Transfer?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ConditionBuilder({
  value,
  onChange,
  emitterContract,
  originChainId,
  isErc20Transfer,
}: Props) {
  const validAddr =
    isErc20Transfer && emitterContract && emitterContract.startsWith("0x") && emitterContract.length === 42
      ? (emitterContract as `0x${string}`)
      : undefined;

  const { symbol: tokenSymbol, decimals: tokenDecimals, isToken: hasTokenInfo } = useTokenInfo(validAddr, originChainId);
  const decimals = tokenDecimals ?? 18;

  const updateField = <K extends keyof ConditionConfig>(field: K, val: ConditionConfig[K]) => {
    onChange({ ...value, [field]: val });
  };

  const handleThresholdChange = (input: string) => {
    if (hasTokenInfo) {
      // User enters human-readable value, auto-compute raw
      try {
        const raw = input ? parseUnits(input, decimals).toString() : "";
        onChange({ ...value, threshold: input, thresholdRaw: raw });
      } catch {
        onChange({ ...value, threshold: input, thresholdRaw: "" });
      }
    } else {
      // No token info: user enters raw uint256 directly
      onChange({ ...value, threshold: input, thresholdRaw: input });
    }
  };

  return (
    <div className="space-y-6">
      {/* Operator selection */}
      <div>
        <Label className="mb-3 block">Condition</Label>
        <div className="grid grid-cols-2 gap-2">
          {CONDITION_OPS.map((op) => (
            <button
              key={op.value}
              onClick={() => updateField("operator", op.value)}
              className={cn(
                "p-3 rounded-lg border text-left transition-colors text-sm",
                value.operator === op.value
                  ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                  : "hover:bg-accent",
              )}
            >
              <p className="font-medium text-foreground">{op.label}</p>
              <p className="text-xs text-muted-foreground">{op.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Condition details */}
      {value.operator !== 0 && (
        <>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              The ReactVM compares a uint256 value extracted from the event data
              at the specified byte offset against your threshold. This is ideal
              for filtering by transfer amounts, token IDs, or other numeric
              event fields.
            </p>
          </div>

          {/* Token info display */}
          {hasTokenInfo && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {tokenSymbol?.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium">{tokenSymbol}</p>
                <p className="text-xs text-muted-foreground">{decimals} decimals</p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="data-offset" className="mb-2 block">
              Data Offset (slot index)
            </Label>
            <Input
              id="data-offset"
              type="number"
              value={value.dataOffset}
              onChange={(e) => updateField("dataOffset", parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Slot index to extract a uint256 from the event log data. Use 0
              for the first data field (e.g. transfer amount in ERC-20
              Transfer).
            </p>
          </div>

          <div>
            <Label htmlFor="threshold" className="mb-2 block">
              {hasTokenInfo
                ? `Threshold (${tokenSymbol})`
                : "Threshold (raw uint256)"}
            </Label>
            <Input
              id="threshold"
              type="text"
              value={value.threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              placeholder={
                hasTokenInfo
                  ? `e.g. 10000 ${tokenSymbol}`
                  : "e.g. 1000000000000000000 for 1e18"
              }
            />
            {hasTokenInfo && value.thresholdRaw && (
              <p className="text-xs text-emerald-600 mt-1 font-mono">
                = {value.thresholdRaw} wei ({formatUnits(BigInt(value.thresholdRaw), decimals)} {tokenSymbol})
              </p>
            )}
            {!hasTokenInfo && (
              <p className="text-xs text-muted-foreground mt-1">
                Enter the raw uint256 value. For ERC-20 amounts, enter the contract
                address in Step 1 to auto-detect decimals.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
