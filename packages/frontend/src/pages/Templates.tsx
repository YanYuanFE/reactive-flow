import { useNavigate } from "react-router-dom";
import {
  Zap,
  Radio,
  Link2,
  Bell,
  ArrowRight,
} from "lucide-react";
import {
  FLOW_TEMPLATES,
  ConditionOp,
  ActionType,
  type FlowTemplate,
} from "@/config/templates";
import { SUPPORTED_CHAINS } from "@/config/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ICONS: Record<string, any> = {
  "cross-chain-whale-alert": Zap,
  "large-transfer-monitor": Radio,
  "cross-chain-event-bridge": Link2,
  "unconditional-alert": Bell,
};

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

const CONDITION_LABELS: Record<number, string> = {
  [ConditionOp.NONE]: "No condition (fire always)",
  [ConditionOp.GT]: "Value > threshold",
  [ConditionOp.LT]: "Value < threshold",
  [ConditionOp.GTE]: "Value >= threshold",
  [ConditionOp.LTE]: "Value <= threshold",
  [ConditionOp.EQ]: "Value == threshold",
  [ConditionOp.NEQ]: "Value != threshold",
};

const ACTION_LABELS: Record<number, string> = {
  [ActionType.ALERT]: "Emit cross-chain alert",
  [ActionType.GENERIC_CALLBACK]: "Generic callback execution",
};

function triggerLabel(template: FlowTemplate): string {
  // Derive a readable label from the event signature
  if (
    template.trigger.eventSignature ===
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
  ) {
    return "ERC-20 Transfer event";
  }
  if (
    template.trigger.eventSignature ===
    "0x3f6891e1a2a9b15049cb996a65b5732644814d27e4a8e1f5a3b0d23432f53f4e"
  ) {
    return "LargeTransfer event";
  }
  return "Custom event";
}

function conditionLabel(template: FlowTemplate): string {
  const base = CONDITION_LABELS[template.condition.operator];
  if (
    template.condition.threshold !== undefined &&
    template.condition.operator !== ConditionOp.NONE
  ) {
    return `${base} (${template.condition.threshold.toLocaleString()})`;
  }
  return base;
}

// ─── Template Card ──────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: FlowTemplate }) {
  const navigate = useNavigate();
  const Icon = ICONS[template.id] || Zap;
  const isCrossChain =
    template.originChainId !== template.destinationChainId;

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="pt-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Icon className="size-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-balance">
              {template.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge variant="secondary" className="text-[10px] uppercase">
                {template.category}
              </Badge>
              {isCrossChain && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase text-purple-700 border-purple-200"
                >
                  Cross-Chain
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Chain route */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted/50">
          <Badge className={`text-[10px] ${chainBadgeColor(template.originChainId)}`}>
            {chainShort(template.originChainId)}
          </Badge>
          <ArrowRight className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Reactive Network
          </span>
          <ArrowRight className="size-3 text-muted-foreground" />
          <Badge
            className={`text-[10px] ${chainBadgeColor(template.destinationChainId)}`}
          >
            {chainShort(template.destinationChainId)}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-pretty text-sm text-muted-foreground mb-5">
          {template.description}
        </p>

        {/* WHEN / IF / THEN */}
        <div className="space-y-2 mb-6 text-sm flex-1">
          <div className="flex items-start gap-2">
            <span className="text-primary font-semibold w-14 shrink-0">
              WHEN
            </span>
            <span className="text-muted-foreground">
              {triggerLabel(template)}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-600 font-semibold w-14 shrink-0">
              IF
            </span>
            <span className="text-muted-foreground">
              {conditionLabel(template)}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-semibold w-14 shrink-0">
              THEN
            </span>
            <span className="text-muted-foreground">
              {ACTION_LABELS[template.action.actionType]}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="outline"
          className="w-full mt-auto"
          onClick={() =>
            navigate("/flows/create", {
              state: { template: template.id },
            })
          }
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Templates Page ─────────────────────────────────────────────────────────

export default function Templates() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-balance text-foreground">
          Flow Templates
        </h1>
        <p className="text-pretty text-muted-foreground mt-1">
          Pre-built cross-chain reactive flows. Pick one and customize to your
          needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FLOW_TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
