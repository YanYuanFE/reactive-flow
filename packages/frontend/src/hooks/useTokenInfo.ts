import { useReadContracts } from "wagmi";
import { erc20Abi } from "viem";

export interface TokenInfo {
  symbol: string | undefined;
  decimals: number | undefined;
  name: string | undefined;
  isLoading: boolean;
  isToken: boolean;
}

/**
 * Fetch ERC-20 token info (symbol, decimals, name) from any chain.
 * Returns undefined values if address is invalid or not an ERC-20.
 */
export function useTokenInfo(
  address?: `0x${string}`,
  chainId?: number,
): TokenInfo {
  const enabled = !!address && address.length === 42 && !!chainId;

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address, abi: erc20Abi, functionName: "symbol", chainId },
      { address, abi: erc20Abi, functionName: "decimals", chainId },
      { address, abi: erc20Abi, functionName: "name", chainId },
    ],
    query: { enabled },
  });

  const symbol = data?.[0]?.result as string | undefined;
  const decimals = data?.[1]?.result as number | undefined;
  const name = data?.[2]?.result as string | undefined;

  return {
    symbol,
    decimals,
    name,
    isLoading: enabled && isLoading,
    isToken: !!symbol && decimals !== undefined,
  };
}
