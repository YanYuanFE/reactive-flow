#!/bin/bash
set -euo pipefail

# ================================================================
# deploy-demo.sh
# Deploys the full demo flow:
#   1. FlowOrigin       → Sepolia
#   2. FlowDestination  → Sepolia
#   3. ReactiveFlowEngine → Lasna (Reactive Network)
#   4. Triggers a test transfer on Origin
#
# Prerequisites:
#   - forge CLI installed
#   - Environment variables set (or .env file in this directory)
#
# Required env vars:
#   SEPOLIA_RPC      - Sepolia RPC URL
#   REACTIVE_RPC     - Reactive Network (Lasna) RPC URL
#   PRIVATE_KEY      - Deployer private key (same for all chains)
#
# Optional env vars (defaults provided):
#   CALLBACK_PROXY   - Sepolia callback proxy (default: Sepolia proxy)
#   DEST_FUND_ETH    - ETH to send to FlowDestination (default: 0.01)
#   REACTIVE_FUND_ETH - ETH to send to ReactiveFlowEngine (default: 0.1)
#   TRIGGER_AMOUNT   - Demo transfer amount (default: 1000000)
#   TRIGGER_RECIPIENT - Demo recipient address (default: deployer)
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "Loading .env from $PROJECT_DIR/.env"
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

# Validate required env vars
for var in SEPOLIA_RPC REACTIVE_RPC PRIVATE_KEY; do
    if [ -z "${!var:-}" ]; then
        echo "ERROR: $var is not set"
        exit 1
    fi
done

# Defaults
CALLBACK_PROXY="${CALLBACK_PROXY:-0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA}"
DEST_FUND_ETH="${DEST_FUND_ETH:-10000000000000000}"       # 0.01 ether in wei
REACTIVE_FUND_ETH="${REACTIVE_FUND_ETH:-100000000000000000}" # 0.1 ether in wei
TRIGGER_AMOUNT="${TRIGGER_AMOUNT:-1000000000000000000}"     # 1 ether in wei

# Sepolia chain ID
SEPOLIA_CHAIN_ID=11155111

# LargeTransfer(address,address,uint256) event topic0
LARGE_TRANSFER_TOPIC0=$(cast keccak "LargeTransfer(address,address,uint256)")

echo ""
echo "============================================"
echo " Reactive Flow Engine - Demo Deployment"
echo "============================================"
echo ""
echo "Sepolia RPC:      $SEPOLIA_RPC"
echo "Reactive RPC:     $REACTIVE_RPC"
echo "Callback Proxy:   $CALLBACK_PROXY"
echo "Event Topic0:     $LARGE_TRANSFER_TOPIC0"
echo ""

# ----------------------------------------------------------------
# Step 1: Deploy FlowOrigin to Sepolia
# ----------------------------------------------------------------
echo ">> Step 1: Deploying FlowOrigin to Sepolia..."
ORIGIN_OUTPUT=$(forge script "$SCRIPT_DIR/DeployOrigin.s.sol" \
    --rpc-url "$SEPOLIA_RPC" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --skip-simulation \
    2>&1)

echo "$ORIGIN_OUTPUT"

ORIGIN_CONTRACT=$(echo "$ORIGIN_OUTPUT" | grep -oP 'FlowOrigin deployed at: \K0x[0-9a-fA-F]+' || true)

if [ -z "$ORIGIN_CONTRACT" ]; then
    echo "ERROR: Could not parse FlowOrigin address from deployment output."
    echo "Check the output above and set ORIGIN_CONTRACT manually."
    read -rp "Enter FlowOrigin address: " ORIGIN_CONTRACT
fi

echo ""
echo "FlowOrigin deployed at: $ORIGIN_CONTRACT"
echo ""

# ----------------------------------------------------------------
# Step 2: Deploy FlowDestination to Sepolia
# ----------------------------------------------------------------
echo ">> Step 2: Deploying FlowDestination to Sepolia..."
DEST_OUTPUT=$(CALLBACK_PROXY="$CALLBACK_PROXY" FUND_AMOUNT="$DEST_FUND_ETH" forge script "$SCRIPT_DIR/DeployDestination.s.sol" \
    --rpc-url "$SEPOLIA_RPC" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --skip-simulation \
    2>&1)

echo "$DEST_OUTPUT"

DEST_CONTRACT=$(echo "$DEST_OUTPUT" | grep -oP 'FlowDestination deployed at: \K0x[0-9a-fA-F]+' || true)

if [ -z "$DEST_CONTRACT" ]; then
    echo "ERROR: Could not parse FlowDestination address from deployment output."
    echo "Check the output above and set DEST_CONTRACT manually."
    read -rp "Enter FlowDestination address: " DEST_CONTRACT
fi

echo ""
echo "FlowDestination deployed at: $DEST_CONTRACT"
echo ""

# ----------------------------------------------------------------
# Step 3: Deploy ReactiveFlowEngine to Lasna
# ----------------------------------------------------------------
echo ">> Step 3: Deploying ReactiveFlowEngine to Reactive Network (Lasna)..."

# alertCallback(address,uint256,uint256,bytes) selector
ALERT_SELECTOR=$(cast sig "alertCallback(address,uint256,uint256,bytes)")
# Pad selector to uint256 for env var (left-padded)
CALLBACK_SELECTOR_UINT=$(cast to-uint256 "$ALERT_SELECTOR")

export FLOW_NAME="demo-large-transfer-alert"
export ORIGIN_CHAIN_ID="$SEPOLIA_CHAIN_ID"
export ORIGIN_CONTRACT="$ORIGIN_CONTRACT"
export EVENT_TOPIC0=$(cast to-uint256 "$LARGE_TRANSFER_TOPIC0")
export DEST_CHAIN_ID="$SEPOLIA_CHAIN_ID"
export DEST_CONTRACT="$DEST_CONTRACT"
export CONDITION_OP="1"          # GT
export THRESHOLD="0"             # any amount > 0
export DATA_OFFSET="0"           # first data word (amount)
export ACTION_TYPE="0"           # ALERT
export CALLBACK_SELECTOR="$CALLBACK_SELECTOR_UINT"
export MAX_EXECUTIONS="100"

export FUND_AMOUNT="$REACTIVE_FUND_ETH"

REACTIVE_OUTPUT=$(forge script "$SCRIPT_DIR/DeployReactive.s.sol" \
    --rpc-url "$REACTIVE_RPC" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --skip-simulation \
    2>&1)

echo "$REACTIVE_OUTPUT"

REACTIVE_CONTRACT=$(echo "$REACTIVE_OUTPUT" | grep -oP 'ReactiveFlowEngine deployed at: \K0x[0-9a-fA-F]+' || true)

if [ -z "$REACTIVE_CONTRACT" ]; then
    echo "WARNING: Could not parse ReactiveFlowEngine address from output."
    echo "Check the output above."
fi

echo ""
echo "ReactiveFlowEngine deployed at: $REACTIVE_CONTRACT"
echo ""

# ----------------------------------------------------------------
# Step 4: Trigger a test transfer
# ----------------------------------------------------------------
echo ">> Step 4: Triggering demo transfer on FlowOrigin..."

# Derive deployer address for recipient
DEPLOYER_ADDRESS=$(cast wallet address "$PRIVATE_KEY")
TRIGGER_RECIPIENT="${TRIGGER_RECIPIENT:-$DEPLOYER_ADDRESS}"

export ORIGIN_CONTRACT="$ORIGIN_CONTRACT"
export RECIPIENT="$TRIGGER_RECIPIENT"
export AMOUNT="$TRIGGER_AMOUNT"

forge script "$SCRIPT_DIR/TriggerDemo.s.sol" \
    --rpc-url "$SEPOLIA_RPC" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --skip-simulation

echo ""
echo "============================================"
echo " Deployment Complete!"
echo "============================================"
echo ""
echo " FlowOrigin (Sepolia):         $ORIGIN_CONTRACT"
echo " FlowDestination (Sepolia):    $DEST_CONTRACT"
echo " ReactiveFlowEngine (Lasna):   ${REACTIVE_CONTRACT:-unknown}"
echo ""
echo " A test LargeTransfer event has been emitted."
echo " The Reactive Network should pick it up and"
echo " call alertCallback on FlowDestination."
echo ""
echo " Check alerts:  cast call $DEST_CONTRACT 'getAlertCount()' --rpc-url $SEPOLIA_RPC"
echo "============================================"
