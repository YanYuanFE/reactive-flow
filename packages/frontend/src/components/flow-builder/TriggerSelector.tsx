import { useState } from "react";
import { AddressInput } from "@/components/shared/AddressInput";
import { TRANSFER_EVENT_SIG } from "@/config/contracts";
import { keccak256, toHex } from "viem";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Trigger types (generic, no Somnia-specific references) ─────────────────

const TRIGGER_TYPES = [
  {
    value: 0,
    label: "ERC-20 Transfer",
    description: "Triggered when a token Transfer event occurs",
  },
  {
    value: 1,
    label: "Custom Event",
    description: "Triggered by any custom contract event",
  },
];

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TriggerConfig {
  emitterContract: string;
  eventSignature: string;
  /** UI-only field to track which trigger preset is selected */
  triggerPreset: number;
}

interface Props {
  value: TriggerConfig;
  onChange: (value: TriggerConfig) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TriggerSelector({ value, onChange }: Props) {
  const [eventSigInput, setEventSigInput] = useState("");

  const updateField = <K extends keyof TriggerConfig>(
    field: K,
    val: TriggerConfig[K],
  ) => {
    onChange({ ...value, [field]: val });
  };

  const handlePresetChange = (preset: number) => {
    const update: Partial<TriggerConfig> = { triggerPreset: preset };

    if (preset === 0) {
      // ERC-20 Transfer
      update.eventSignature = TRANSFER_EVENT_SIG;
    }
    // For custom event, keep whatever they've entered

    onChange({ ...value, ...update });
  };

  return (
    <div className="space-y-6">
      {/* Trigger preset selector */}
      <div>
        <Label className="mb-3 block">Event Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {TRIGGER_TYPES.map((trigger) => (
            <button
              key={trigger.value}
              onClick={() => handlePresetChange(trigger.value)}
              className={cn(
                "p-4 rounded-xl border text-left transition-colors",
                value.triggerPreset === trigger.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-accent",
              )}
            >
              <p className="font-medium text-foreground">{trigger.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {trigger.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Emitter contract address (always shown) */}
      <AddressInput
        value={value.emitterContract}
        onChange={(addr) => updateField("emitterContract", addr)}
        label="Contract Address (on origin chain)"
        placeholder="0x... (the contract that emits the event)"
      />

      {/* ERC-20 Transfer preset: event signature is auto-set */}
      {value.triggerPreset === 0 && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Event Signature (auto)
          </p>
          <p className="text-xs font-mono text-foreground break-all">
            Transfer(address,address,uint256)
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1 break-all">
            {TRANSFER_EVENT_SIG}
          </p>
        </div>
      )}

      {/* Custom Event: let user type an event signature */}
      {value.triggerPreset === 1 && (
        <div>
          <Label htmlFor="event-sig" className="mb-2 block">
            Event Signature
          </Label>
          <Input
            id="event-sig"
            type="text"
            value={eventSigInput}
            onChange={(e) => {
              const input = e.target.value;
              setEventSigInput(input);
              // If it looks like a raw keccak256 hash, use directly
              if (input.startsWith("0x") && input.length === 66) {
                updateField("eventSignature", input);
              } else if (input.includes("(") && input.includes(")")) {
                // Compute keccak256 from human-readable signature
                updateField("eventSignature", keccak256(toHex(input)));
              }
            }}
            placeholder="Transfer(address,address,uint256)"
            className="font-mono"
          />
          {value.eventSignature.startsWith("0x") &&
            value.eventSignature.length === 66 && (
              <p className="text-xs text-emerald-600 mt-1 font-mono break-all">
                topic0: {value.eventSignature}
              </p>
            )}
          <p className="text-xs text-muted-foreground mt-1">
            Enter event signature like Transfer(address,address,uint256) — the
            keccak256 hash is computed automatically. Or paste a raw bytes32
            topic0.
          </p>
        </div>
      )}
    </div>
  );
}
