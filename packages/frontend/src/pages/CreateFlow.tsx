import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount, useSwitchChain } from "wagmi";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { TriggerSelector } from "@/components/flow-builder/TriggerSelector";
import type { TriggerConfig } from "@/components/flow-builder/TriggerSelector";
import { ConditionBuilder } from "@/components/flow-builder/ConditionBuilder";
import type { ConditionConfig } from "@/components/flow-builder/ConditionBuilder";
import { ActionSelector } from "@/components/flow-builder/ActionSelector";
import type { ActionConfig } from "@/components/flow-builder/ActionSelector";
import { ChainSelector } from "@/components/flow-builder/ChainSelector";
import { useDeployFlow } from "@/hooks/useDeployFlow";
import { useUserFlows } from "@/hooks/useUserFlows";
import { FLOW_TEMPLATES } from "@/config/templates";
import {
  SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  TRANSFER_EVENT_SIG,
  SUPPORTED_CHAINS,
  FLOW_DESTINATION_ADDRESSES,
  ActionType,
} from "@/config/contracts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Steps ──────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Trigger", description: "WHEN this happens..." },
  { label: "Condition", description: "ONLY IF..." },
  { label: "Action", description: "THEN do this..." },
  { label: "Review", description: "Review & Deploy" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getChainName(chainId: number): string {
  return (
    SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`
  );
}

function getExplorerUrl(chainId: number): string {
  return (
    SUPPORTED_CHAINS.find((c) => c.id === chainId)?.explorerUrl ?? ""
  );
}

function conditionOpLabel(op: number): string {
  return ["NONE", ">", "<", ">=", "<=", "==", "!="][op] ?? "?";
}

function actionTypeLabel(actionType: number): string {
  return actionType === ActionType.ALERT
    ? "Alert"
    : actionType === ActionType.GENERIC_CALLBACK
      ? "Generic Callback"
      : `Unknown (${actionType})`;
}

/** callback(address) selector — simple callback matching Basic Demo pattern */
const ALERT_CALLBACK_SELECTOR = "0x73027f6d" as `0x${string}`;
/** genericCallback(address,uint256,uint256,bytes) selector */
const GENERIC_CALLBACK_SELECTOR = "0x73027f6d" as `0x${string}`; // also uses simple callback for now

// ─── Component ──────────────────────────────────────────────────────────────

export default function CreateFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useAccount();

  const {
    deployFlow,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    deployedAddress,
    error,
  } = useDeployFlow();

  const { switchChainAsync } = useSwitchChain();
  const { refetch: refetchFlows } = useUserFlows();
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [maxExecutions, setMaxExecutions] = useState("0");
  const [copied, setCopied] = useState(false);

  // ── Origin chain (step 1 - shown alongside trigger) ─────────────────────
  const [originChainId, setOriginChainId] = useState(SEPOLIA_CHAIN_ID);

  // ── Trigger ─────────────────────────────────────────────────────────────
  const [trigger, setTrigger] = useState<TriggerConfig>({
    triggerPreset: 0,
    emitterContract: "",
    eventSignature: TRANSFER_EVENT_SIG,
  });

  // ── Condition ───────────────────────────────────────────────────────────
  const [condition, setCondition] = useState<ConditionConfig>({
    operator: 0,
    threshold: "",
    thresholdRaw: "",
    dataOffset: 0,
  });

  // ── Action + destination chain ──────────────────────────────────────────
  const [action, setAction] = useState<ActionConfig>({
    actionType: ActionType.ALERT,
    callbackSelector: ALERT_CALLBACK_SELECTOR,
    destinationContract:
      FLOW_DESTINATION_ADDRESSES[SEPOLIA_CHAIN_ID] ?? "",
    destinationChainId: SEPOLIA_CHAIN_ID,
  });

  // ── Apply template from navigation state ────────────────────────────────
  useEffect(() => {
    const templateId = location.state?.template;
    if (!templateId) return;

    const template = FLOW_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setName(template.name);
    setOriginChainId(template.originChainId);

    setTrigger((prev) => ({
      ...prev,
      triggerPreset: template.trigger.eventSignature === TRANSFER_EVENT_SIG ? 0 : 1,
      emitterContract:
        template.trigger.emitterContract || prev.emitterContract,
      eventSignature: template.trigger.eventSignature,
    }));

    const thresholdStr = template.condition.threshold?.toString() ?? "";
    setCondition({
      operator: template.condition.operator,
      threshold: thresholdStr,
      thresholdRaw: thresholdStr,
      dataOffset: template.condition.dataOffset ?? 0,
    });

    const destChainId = template.destinationChainId;
    setAction({
      actionType: template.action.actionType,
      callbackSelector:
        template.action.actionType === ActionType.ALERT
          ? ALERT_CALLBACK_SELECTOR
          : GENERIC_CALLBACK_SELECTOR,
      destinationContract:
        FLOW_DESTINATION_ADDRESSES[destChainId] ?? "",
      destinationChainId: destChainId,
    });
  }, [location.state]);

  // ── After successful deploy: toast, refetch registry, redirect ───────────
  useEffect(() => {
    if (isConfirmed && deployedAddress) {
      // Show success toast with deployed contract address
      toast.success("Flow deployed successfully!", {
        description: `Contract: ${deployedAddress}`,
        duration: 3000,
      });

      // Refetch flows from on-chain registry
      refetchFlows();

      // Auto-redirect to the flows list after 2 seconds
      const timer = setTimeout(() => {
        navigate("/flows");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, deployedAddress]);

  // ── Guard: wallet not connected ─────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Connect your wallet to create a flow
      </div>
    );
  }

  // ── Deploy handler ──────────────────────────────────────────────────────
  const handleDeploy = async () => {
    // Switch to Reactive Lasna chain before deploying
    try {
      setIsSwitchingChain(true);
      await switchChainAsync({ chainId: 5318007 });
    } catch (switchError) {
      setIsSwitchingChain(false);
      toast.error("Failed to switch chain", {
        description: "Please switch to Reactive Lasna manually and try again.",
      });
      return;
    }
    setIsSwitchingChain(false);

    // Resolve callback selector based on action type
    const callbackSelector: `0x${string}` =
      action.actionType === ActionType.ALERT
        ? ALERT_CALLBACK_SELECTOR
        : (action.callbackSelector as `0x${string}`);

    // Resolve destination contract: use configured FlowDestination if available
    const destinationContract =
      (action.destinationContract as `0x${string}`) ||
      (FLOW_DESTINATION_ADDRESSES[action.destinationChainId] as `0x${string}`) ||
      ("0x0000000000000000000000000000000000000000" as `0x${string}`);

    deployFlow({
      name: name || "Unnamed Flow",
      originChainId,
      originContract: trigger.emitterContract as `0x${string}`,
      topic0: trigger.eventSignature as `0x${string}`,
      destinationChainId: action.destinationChainId,
      destinationContract,
      conditionOp: condition.operator,
      threshold: condition.thresholdRaw ? BigInt(condition.thresholdRaw) : (condition.threshold ? BigInt(condition.threshold) : 0n),
      dataOffset: condition.dataOffset,
      actionType: action.actionType,
      callbackSelector,
      maxExecutions: BigInt(maxExecutions || "0"),
    });
  };

  // ── Copy address helper ─────────────────────────────────────────────────
  const copyAddress = () => {
    if (!deployedAddress) return;
    navigator.clipboard.writeText(deployedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && !isConfirmed && setStep(i)}
              className={cn(
                "flex items-center gap-2",
                i <= step ? "text-foreground" : "text-muted-foreground/50",
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </div>
              <span className="hidden sm:inline text-sm">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-12 sm:w-20 h-px mx-2",
                  i < step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{STEPS[step].description}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === 0 &&
              "Choose the origin chain and what event triggers your flow"}
            {step === 1 &&
              "Set optional conditions for when the flow should execute"}
            {step === 2 &&
              "Define what action to take and the destination chain"}
            {step === 3 && "Review your flow configuration before deploying"}
          </p>
        </CardHeader>
        <CardContent>
          {/* ── Step 0: Origin Chain + Trigger ──────────────────────────── */}
          {step === 0 && (
            <div className="space-y-8">
              <ChainSelector
                value={originChainId}
                onChange={setOriginChainId}
                label="Origin Chain (watch events on)"
                filterType={["origin", "destination"]}
              />
              <div className="border-t pt-6">
                <TriggerSelector value={trigger} onChange={setTrigger} />
              </div>
            </div>
          )}

          {/* ── Step 1: Condition ───────────────────────────────────────── */}
          {step === 1 && (
            <ConditionBuilder
              value={condition}
              onChange={setCondition}
              emitterContract={trigger.emitterContract}
              originChainId={originChainId}
              isErc20Transfer={trigger.triggerPreset === 0}
            />
          )}

          {/* ── Step 2: Action + Destination Chain ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-8">
              <ActionSelector value={action} onChange={setAction} />

              <div className="border-t pt-6">
                <ChainSelector
                  value={action.destinationChainId}
                  onChange={(chainId) =>
                    setAction((prev) => ({
                      ...prev,
                      destinationChainId: chainId,
                      destinationContract:
                        FLOW_DESTINATION_ADDRESSES[chainId] ??
                        prev.destinationContract,
                    }))
                  }
                  label="Destination Chain (execute action on)"
                  filterType={["origin", "destination"]}
                />
              </div>

              <div>
                <Label className="mb-2 block">Destination Contract</Label>
                <Input
                  type="text"
                  value={action.destinationContract}
                  onChange={(e) =>
                    setAction((prev) => ({
                      ...prev,
                      destinationContract: e.target.value,
                    }))
                  }
                  placeholder="0x... (FlowDestination contract on destination chain)"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The contract that will receive the callback on the destination
                  chain.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="flow-name">Flow Name</Label>
                <Input
                  id="flow-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Whale Alert"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="max-exec">
                  Max Executions (0 = unlimited)
                </Label>
                <Input
                  id="max-exec"
                  type="number"
                  value={maxExecutions}
                  onChange={(e) => setMaxExecutions(e.target.value)}
                  className="mt-2"
                  min={0}
                />
              </div>

              {/* Review Summary */}
              <div className="space-y-3 pt-4 border-t">
                {/* Origin chain + trigger */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">
                    WHEN (Trigger)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trigger.triggerPreset === 0
                      ? "ERC-20 Transfer"
                      : "Custom Event"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Origin:</span>{" "}
                    {getChainName(originChainId)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">
                    Contract: {trigger.emitterContract || "(not set)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">
                    topic0: {trigger.eventSignature}
                  </p>
                </div>

                {/* Condition */}
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-600 mb-1">
                    ONLY IF (Condition)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {condition.operator === 0
                      ? "No condition (always execute)"
                      : `data[${condition.dataOffset}] ${conditionOpLabel(condition.operator)} ${condition.threshold}`}
                  </p>
                </div>

                {/* Action + destination */}
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-600 mb-1">
                    THEN (Action)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {actionTypeLabel(action.actionType)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Destination:</span>{" "}
                    {getChainName(action.destinationChainId)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">
                    Contract: {action.destinationContract || "(not set)"}
                  </p>
                  {action.actionType === ActionType.GENERIC_CALLBACK && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      Selector: {action.callbackSelector}
                    </p>
                  )}
                </div>
              </div>

              {/* Deployed contract address (shown after success) */}
              {isConfirmed && deployedAddress && (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                    ReactiveFlowEngine Deployed
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-foreground break-all flex-1">
                      {deployedAddress}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="shrink-0 p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <a
                      href={`${getExplorerUrl(5318007)}/address/${deployedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </a>
                  </div>
                  {txHash && (
                    <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                      Tx: {txHash}
                    </p>
                  )}
                </div>
              )}

              {/* Chain indicator for deploy */}
              {!isConfirmed && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Will deploy to <span className="font-medium">Reactive Lasna</span> (chain 5318007). Your wallet will be switched automatically.
                  </p>
                </div>
              )}

              {/* Redirect notice after deploy */}
              {isConfirmed && deployedAddress && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Redirecting to flow details...
                  </p>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Deployment Failed
                  </p>
                  <p className="text-xs text-destructive/80 break-all">
                    {error.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0 || isConfirmed}
          className="gap-2"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} className="gap-2">
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : isConfirmed ? (
          <Button
            onClick={() => navigate("/flows")}
            className="gap-2"
          >
            View My Flows
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleDeploy}
            disabled={isSwitchingChain || isPending || isConfirming}
            className="gap-2"
          >
            {isSwitchingChain ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Switching Chain...
              </>
            ) : isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Confirm in Wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deploying...
              </>
            ) : (
              "Deploy Flow"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
