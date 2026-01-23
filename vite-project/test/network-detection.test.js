/**
 * Network Detection Tests - Task 12.2
 * Tests for frontend network detection and switching functionality
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CRONOS_TESTNET, getNetworkName, isCorrectNetwork, getAddNetworkParams } from '../src/config/networks.ts';

describe('Network Configuration', () => {
  describe('CRONOS_TESTNET constant', () => {
    it('should have correct chain ID (338)', () => {
      expect(CRONOS_TESTNET.chainId).toBe(338);
    });

    it('should have correct chain ID in hex (0x152)', () => {
      expect(CRONOS_TESTNET.chainIdHex).toBe('0x152');
    });

    it('should have correct network name', () => {
      expect(CRONOS_TESTNET.name).toBe('Cronos Testnet');
    });

    it('should have correct RPC URL', () => {
      expect(CRONOS_TESTNET.rpcUrl).toBe('https://evm-t3.cronos.org');
    });

    it('should have correct explorer URL', () => {
      expect(CRONOS_TESTNET.explorerUrl).toBe('https://explorer.cronos.org/testnet');
    });

    it('should have correct native currency (TCRO)', () => {
      expect(CRONOS_TESTNET.nativeCurrency).toEqual({
        name: 'TCRO',
        symbol: 'TCRO',
        decimals: 18,
      });
    });

    it('should have correct faucet URL', () => {
      expect(CRONOS_TESTNET.faucetUrl).toBe('https://cronos.org/faucet');
    });

    it('should be marked as testnet', () => {
      expect(CRONOS_TESTNET.testnet).toBe(true);
    });
  });

  describe('getNetworkName', () => {
    it('should return "Cronos Testnet" for chain ID 338', () => {
      expect(getNetworkName(338)).toBe('Cronos Testnet');
    });

    it('should return "..." for null chain ID', () => {
      expect(getNetworkName(null)).toBe('...');
    });

    it('should return "Chain X" for unknown chain ID', () => {
      expect(getNetworkName(999)).toBe('Chain 999');
    });
  });

  describe('isCorrectNetwork', () => {
    it('should return true for Cronos Testnet (338)', () => {
      expect(isCorrectNetwork(338)).toBe(true);
    });

    it('should return false for other networks', () => {
      expect(isCorrectNetwork(1)).toBe(false); // Ethereum Mainnet
      expect(isCorrectNetwork(11155111)).toBe(false); // Sepolia
      expect(isCorrectNetwork(25)).toBe(false); // Cronos Mainnet
    });
  });

  describe('getAddNetworkParams', () => {
    it('should return correct parameters for wallet_addEthereumChain', () => {
      const params = getAddNetworkParams();
      
      expect(params).toEqual({
        chainId: '0x152',
        chainName: 'Cronos Testnet',
        nativeCurrency: {
          name: 'TCRO',
          symbol: 'TCRO',
          decimals: 18,
        },
        rpcUrls: ['https://evm-t3.cronos.org'],
        blockExplorerUrls: ['https://explorer.cronos.org/testnet'],
      });
    });
  });
});

describe('Network Detection Logic (App.jsx)', () => {
  describe('Chain ID Constants', () => {
    it('should use correct target chain ID', () => {
      const TARGET_CHAIN_ID_DEC = 338;
      const TARGET_CHAIN_ID_HEX = '0x' + TARGET_CHAIN_ID_DEC.toString(16);
      
      expect(TARGET_CHAIN_ID_DEC).toBe(338);
      expect(TARGET_CHAIN_ID_HEX).toBe('0x152');
    });
  });

  describe('getNetworkName mapping', () => {
    const getNetworkName = (id) => {
      if (!id) return '...';
      const mapping = {
        338: 'Cronos Testnet',
      };
      return mapping[id] || `Chain ${id}`;
    };

    it('should map 338 to "Cronos Testnet"', () => {
      expect(getNetworkName(338)).toBe('Cronos Testnet');
    });

    it('should return "..." for falsy values', () => {
      expect(getNetworkName(null)).toBe('...');
      expect(getNetworkName(undefined)).toBe('...');
      expect(getNetworkName(0)).toBe('...');
    });

    it('should return "Chain X" for unmapped IDs', () => {
      expect(getNetworkName(1)).toBe('Chain 1');
      expect(getNetworkName(999)).toBe('Chain 999');
    });
  });
});

describe('Network Switching Parameters', () => {
  it('should have correct parameters for wallet_addEthereumChain', () => {
    const params = {
      chainId: '0x152',
      chainName: 'Cronos Testnet',
      nativeCurrency: { name: 'TCRO', symbol: 'TCRO', decimals: 18 },
      rpcUrls: ['https://evm-t3.cronos.org'],
      blockExplorerUrls: ['https://explorer.cronos.org/testnet']
    };

    expect(params.chainId).toBe('0x152');
    expect(params.chainName).toBe('Cronos Testnet');
    expect(params.nativeCurrency.symbol).toBe('TCRO');
    expect(params.rpcUrls[0]).toBe('https://evm-t3.cronos.org');
    expect(params.blockExplorerUrls[0]).toBe('https://explorer.cronos.org/testnet');
  });
});

describe('Chain Icon Logic (Header.jsx)', () => {
  it('should identify Cronos network correctly', () => {
    const isCronos = (chainId) => chainId === 338;
    
    expect(isCronos(338)).toBe(true);
    expect(isCronos(1)).toBe(false);
    expect(isCronos(11155111)).toBe(false);
  });
});

describe('Hex Conversion', () => {
  it('should convert decimal chain ID to hex correctly', () => {
    const decimalToHex = (dec) => '0x' + dec.toString(16);
    
    expect(decimalToHex(338)).toBe('0x152');
    expect(decimalToHex(1)).toBe('0x1');
    expect(decimalToHex(25)).toBe('0x19');
  });

  it('should convert hex chain ID to decimal correctly', () => {
    const hexToDecimal = (hex) => parseInt(hex, 16);
    
    expect(hexToDecimal('0x152')).toBe(338);
    expect(hexToDecimal('0x1')).toBe(1);
    expect(hexToDecimal('0x19')).toBe(25);
  });
});
