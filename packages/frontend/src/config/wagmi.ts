import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { type Chain } from "viem";

// ─── Sepolia Chain Definition (custom RPC) ─────────────────────────────────
export const sepolia: Chain = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://api.zan.top/eth-sepolia"],
    },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
};

// ─── Base Sepolia Chain Definition ──────────────────────────────────────────
export const baseSepolia: Chain = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan Sepolia",
      url: "https://sepolia.basescan.org",
    },
  },
  testnet: true,
};

// ─── Reactive Lasna Chain Definition ────────────────────────────────────────
export const reactiveLasna: Chain = {
  id: 5318007,
  name: "Reactive Lasna",
  nativeCurrency: {
    name: "Reactive Token",
    symbol: "RCT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://lasna-rpc.rnk.dev/"],
    },
  },
  testnet: true,
};

// ─── wagmi + RainbowKit Config ──────────────────────────────────────────────
export const config = getDefaultConfig({
  appName: "ReactiveFlow",
  projectId: 'b1daffdd6f590ce1fe948af2022b4ec1',
  chains: [sepolia, baseSepolia, reactiveLasna],
  ssr: false,
});
