/**
 * Network Configuration Module
 * Centralizes all network-specific constants and configuration for PayStream
 */

export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  faucetUrl: string;
  testnet: boolean;
}

/**
 * Cronos Testnet Configuration
 * Chain ID: 338
 * RPC: https://evm-t3.cronos.org
 * Explorer: https://explorer.cronos.org/testnet
 */
export const CRONOS_TESTNET: NetworkConfig = {
  chainId: 338,
  chainIdHex: '0x152',
  name: 'Cronos Testnet',
  shortName: 'Cronos',
  rpcUrl: 'https://evm-t3.cronos.org',
  explorerUrl: 'https://explorer.cronos.org/testnet',
  nativeCurrency: {
    name: 'TCRO',
    symbol: 'TCRO',
    decimals: 18,
  },
  faucetUrl: 'https://cronos.org/faucet',
  testnet: true,
};

/**
 * Default network for PayStream
 */
export const DEFAULT_NETWORK = CRONOS_TESTNET;

/**
 * Helper function to get network name by chain ID
 */
export function getNetworkName(chainId: number | null): string {
  if (!chainId) return '...';
  
  const networks: Record<number, string> = {
    338: 'Cronos Testnet',
  };
  
  return networks[chainId] || `Chain ${chainId}`;
}

/**
 * Helper function to check if connected to the correct network
 */
export function isCorrectNetwork(chainId: number): boolean {
  return chainId === DEFAULT_NETWORK.chainId;
}

/**
 * Helper function to format explorer transaction URL
 */
export function getExplorerTxUrl(txHash: string, network: NetworkConfig = DEFAULT_NETWORK): string {
  return `${network.explorerUrl}/tx/${txHash}`;
}

/**
 * Helper function to format explorer address URL
 */
export function getExplorerAddressUrl(address: string, network: NetworkConfig = DEFAULT_NETWORK): string {
  return `${network.explorerUrl}/address/${address}`;
}

/**
 * Helper function to format explorer token URL
 */
export function getExplorerTokenUrl(tokenAddress: string, network: NetworkConfig = DEFAULT_NETWORK): string {
  return `${network.explorerUrl}/token/${tokenAddress}`;
}

/**
 * Helper function to format explorer block URL
 */
export function getExplorerBlockUrl(blockNumber: number, network: NetworkConfig = DEFAULT_NETWORK): string {
  return `${network.explorerUrl}/block/${blockNumber}`;
}

/**
 * Network parameters for wallet_addEthereumChain RPC call
 */
export function getAddNetworkParams(network: NetworkConfig = DEFAULT_NETWORK) {
  return {
    chainId: network.chainIdHex,
    chainName: network.name,
    nativeCurrency: network.nativeCurrency,
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: [network.explorerUrl],
  };
}
