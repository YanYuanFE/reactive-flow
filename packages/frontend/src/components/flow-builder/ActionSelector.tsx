import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionType } from "@/config/contracts";

// ─── Action type options ────────────────────────────────────────────────────

const ACTION_TYPES = [
  {
    value: ActionType.ALERT,
    label: "Alert",
    description:
      "Log an alert on the destination chain via the FlowDestination contract",
  },
  {
    value: ActionType.GENERIC_CALLBACK,
    label: "Generic Callback",
    description:
      "Call a custom function on the destination contract with event data",
  },
];

// ─── Alert callback selector (bytes4) ───────────────────────────────────────

/** callback(address) — simple callback matching Basic Demo pattern */
const ALERT_CALLBACK_SELECTOR = "0x73027f6d" as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActionConfig {
  actionType: number; // ActionType enum (0 = ALERT, 1 = GENERIC_CALLBACK)
  callbackSelector: string; // bytes4 function selector on the destination
  destinationContract: string; // destination contract address
  destinationChainId: number;
}

interface Props {
  value: ActionConfig;
  onChange: (value: ActionConfig) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ActionSelector({ value, onChange }: Props) {
  const updateField = <K extends keyof ActionConfig>(
    field: K,
    val: ActionConfig[K],
  ) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-6">
      {/* Action type selector */}
      <div>
        <Label className="mb-3 block">Action Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {ACTION_TYPES.map((action) => (
            <button
              key={action.value}
              onClick={() => updateField("actionType", action.value)}
              className={cn(
                "p-4 rounded-xl border text-left transition-colors",
                value.actionType === action.value
                  ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                  : "hover:bg-accent",
              )}
            >
              <p className="font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ALERT action */}
      {value.actionType === ActionType.ALERT && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
            Alert Callback
          </p>
          <p className="text-xs text-muted-foreground">
            The ReactVM will call{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
              alertCallback(address, uint256, uint256, bytes)
            </code>{" "}
            on the FlowDestination contract. The event topics and data are
            forwarded automatically.
          </p>
        </div>
      )}

      {/* GENERIC_CALLBACK action */}
      {value.actionType === ActionType.GENERIC_CALLBACK && (
        <div>
          <Label htmlFor="callback-selector" className="mb-2 block">
            Callback Function Selector (bytes4)
          </Label>
          <Input
            id="callback-selector"
            type="text"
            value={value.callbackSelector}
            onChange={(e) => updateField("callbackSelector", e.target.value)}
            placeholder="0x12345678"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            The 4-byte function selector to call on the destination contract.
            The ReactVM will call this with{" "}
            <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">
              (address rvmId, uint256 topic1, uint256 topic2, bytes data)
            </code>
            .
          </p>
        </div>
      )}
    </div>
  );
}
