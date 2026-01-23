# Design Document: Cronos Network Migration

## Overview

This design outlines the comprehensive migration of PayStream from Ethereum Sepolia testnet to Cronos testnet. The migration affects every layer of the system: smart contracts, frontend application, backend services, agent demos, and documentation. The design ensures zero feature loss while gaining the benefits of Cronos's lower fees and faster finality.

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PayStream on Cronos Testnet                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Frontend Layer                         │   │
│  │  - React Dashboard (Chain ID: 338)                       │   │
│  │  - MetaMask Integration (Cronos Testnet)                 │   │
│  │  - Cronos Explorer Links                                 │   │
│  │  - In-App Docs (Cronos-specific)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Smart Contract Layer                     │   │
│  │  - PayStreamStream.sol (deployed on Cronos)                │   │
│  │  - MockMNEE.sol (deployed on Cronos)                     │   │
│  │  - Hardhat Config (cronos_testnet network)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Blockchain Layer                        │   │
│  │  - Cronos Testnet (Chain ID: 338)                        │   │
│  │  - RPC: https://evm-t3.cronos.org                        │   │
│  │  - Explorer: https://explorer.cronos.org/testnet         │   │
│  │  - Gas Token: TCRO                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Agent/Demo Layer                       │   │
│  │  - CLI Demo (CRONOS_RPC_URL)                             │   │
│  │  - Rust Agent (cronos_testnet network)                   │   │
│  │  - SDK Examples (Cronos configuration)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Network Configuration Module

**Purpose:** Centralize all network-specific constants and configuration

**Interface:**
```typescript
interface NetworkConfig {
  chainId: number;           // 338 for Cronos Testnet
  chainIdHex: string;        // '0x152'
  name: string;              // 'Cronos Testnet'
  rpcUrl: string;            // 'https://evm-t3.cronos.org'
  explorerUrl: string;       // 'https://explorer.cronos.org/testnet'
  nativeCurrency: {
    name: string;            // 'TCRO'
    symbol: string;          // 'TCRO'
    decimals: number;        // 18
  };
  faucetUrl: string;         // 'https://cronos.org/faucet'
}
```

**Implementation:**
- Create `src/config/networks.ts` with Cronos testnet configuration
- Export constants for use across frontend
- Provide helper functions for network detection and switching

### 2. Hardhat Configuration

**Purpose:** Define Cronos testnet network for contract deployment

**Configuration:**
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    cronos_testnet: {
      url: process.env.CRONOS_RPC_URL || "https://evm-t3.cronos.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 338,
      gasPrice: 5000000000000, // 5000 gwei (Cronos typical)
    },
  },
};
```

**Changes:**
- Replace `sepolia` network with `cronos_testnet`
- Update chain ID from 11155111 to 338
- Change RPC URL environment variable name
- Adjust gas price for Cronos network

### 3. Frontend Network Detection

**Purpose:** Automatically detect and switch to Cronos testnet

**Flow:**
```
User Connects Wallet
       │
       ▼
Check Current Chain ID
       │
       ├─── Is 338? ──────────────────────────────────────┐
       │                                                   │
       ▼                                                   ▼
   Wrong Network                                    Connected
       │                                                   │
       ▼                                                   │
Prompt to Switch                                          │
       │                                                   │
       ├─── User Approves ────────────────────────────────┤
       │                                                   │
       ├─── Network Not Added (4902) ──────────────────┐  │
       │                                                │  │
       ▼                                                ▼  │
Add Cronos Testnet                              Switch Network
       │                                                │  │
       └────────────────────────────────────────────────┴──┘
                                                          │
                                                          ▼
                                                   Update UI State
```

**Implementation:**
```javascript
const CRONOS_TESTNET = {
  chainId: '0x152',
  chainName: 'Cronos Testnet',
  nativeCurrency: { name: 'TCRO', symbol: 'TCRO', decimals: 18 },
  rpcUrls: ['https://evm-t3.cronos.org'],
  blockExplorerUrls: ['https://explorer.cronos.org/testnet']
};

async function ensureCronosTestnet(ethereum) {
  const currentChainId = await ethereum.request({ method: 'eth_chainId' });
  
  if (currentChainId !== '0x152') {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x152' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CRONOS_TESTNET],
        });
      }
    }
  }
}
```

### 4. Block Explorer Link Generator

**Purpose:** Generate Cronos Explorer links for transactions and addresses

**Interface:**
```typescript
interface ExplorerLinks {
  transaction(txHash: string): string;
  address(address: string): string;
  token(tokenAddress: string): string;
  block(blockNumber: number): string;
}
```

**Implementation:**
```typescript
const CronosExplorer: ExplorerLinks = {
  transaction: (txHash) => `https://explorer.cronos.org/testnet/tx/${txHash}`,
  address: (address) => `https://explorer.cronos.org/testnet/address/${address}`,
  token: (tokenAddress) => `https://explorer.cronos.org/testnet/token/${tokenAddress}`,
  block: (blockNumber) => `https://explorer.cronos.org/testnet/block/${blockNumber}`,
};
```

**Usage:**
- Replace all Etherscan link generation with Cronos Explorer
- Update CLI output to use Cronos Explorer links
- Update frontend transaction displays

### 5. Environment Configuration

**Purpose:** Standardize environment variable naming and validation

**Variables:**
```bash
# Required
PRIVATE_KEY=0x...
CRONOS_RPC_URL=https://evm-t3.cronos.org

# Optional
GEMINI_API_KEY=...
DAILY_BUDGET=10
SERVER_URL=http://localhost:3001

# Contract Addresses (set after deployment)
PAYSTREAM_CONTRACT=0x...
MNEE_TOKEN=0x...
```

**Validation:**
```typescript
const REQUIRED_VARS = ['PRIVATE_KEY', 'CRONOS_RPC_URL'];

function validateEnvironment(): ValidationResult {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      errors: [`Missing: ${missing.join(', ')}`],
    };
  }
  
  return { valid: true };
}
```

### 6. Documentation Structure

**Purpose:** Organize Cronos-specific documentation

**Structure:**
```
docs/
├── deployment/
│   ├── README.md (Cronos overview)
│   ├── cronos-testnet.md (Testnet guide)
│   └── production.md (Mainnet preparation)
├── getting-started/
│   ├── README.md (Quick start with Cronos)
│   ├── configuration.md (Cronos config)
│   └── faucet.md (Getting TCRO)
└── architecture/
    ├── README.md (System overview)
    └── network.md (Cronos integration)
```

**Content Updates:**
- Replace all Sepolia references with Cronos
- Update chain IDs, RPC URLs, explorer links
- Add Cronos-specific troubleshooting
- Include Cronos faucet instructions

### 7. Frontend Docs Page

**Purpose:** Provide in-app documentation for Cronos testnet

**Sections to Update:**
```javascript
const docsContent = {
  'introduction': {
    // Update network references to Cronos
    // Update contract addresses to TBD
    // Update chain ID to 338
  },
  'quick-start': {
    // Update MetaMask setup for Cronos
    // Update faucet link to cronos.org/faucet
    // Update RPC URL to evm-t3.cronos.org
  },
  'installation': {
    // Update environment variables to CRONOS_RPC_URL
    // Update network configuration examples
  },
  'deployment': {
    // Update deployment commands to cronos_testnet
    // Update network configuration
    // Update explorer links
  },
  'mnee-token': {
    // Update mainnet migration to Cronos Mainnet (25)
    // Update network comparison table
  },
};
```

### 8. Agent Demo Configuration

**Purpose:** Configure agent demo for Cronos testnet

**Config Interface:**
```typescript
interface AgentConfig {
  name: string;
  privateKey: string;
  rpcUrl: string;              // From CRONOS_RPC_URL
  dailyBudget: bigint;
  payStreamContract: string;
  mneeToken: string;
  network: 'cronos_testnet';   // Network identifier
}
```

**CLI Output Updates:**
```typescript
class CLIOutput {
  // Update explorer link generation
  cronosExplorerLink(txHash: string): string {
    return `https://explorer.cronos.org/testnet/tx/${txHash}`;
  }
  
  // Update connection messages
  displayConnection(config: AgentConfig): void {
    this.info(`Connecting to Cronos Testnet...`);
    this.info(`RPC: ${config.rpcUrl}`);
    this.info(`Network: Cronos Testnet (Chain ID: 338)`);
  }
}
```

## Data Models

### Network Configuration Model

```typescript
interface Network {
  id: 'cronos_testnet' | 'cronos_mainnet';
  chainId: number;
  chainIdHex: string;
  name: string;
  shortName: string;
  rpc: {
    primary: string;
    fallbacks: string[];
  };
  explorer: {
    url: string;
    apiUrl?: string;
  };
  nativeCurrency: Currency;
  faucet?: string;
  testnet: boolean;
}

interface Currency {
  name: string;
  symbol: string;
  decimals: number;
}
```

### Migration Mapping Model

```typescript
interface MigrationMapping {
  old: {
    network: 'sepolia';
    chainId: 11155111;
    rpcVar: 'SEPOLIA_RPC_URL';
    explorer: 'https://sepolia.etherscan.io';
  };
  new: {
    network: 'cronos_testnet';
    chainId: 338;
    rpcVar: 'CRONOS_RPC_URL';
    explorer: 'https://explorer.cronos.org/testnet';
  };
  affectedFiles: string[];
}
```

## Error Handling

### Network Mismatch Errors

```typescript
class NetworkError extends Error {
  constructor(
    public expected: number,
    public actual: number,
    public networkName: string
  ) {
    super(
      `Wrong network. Expected ${networkName} (${expected}), ` +
      `but connected to chain ${actual}. ` +
      `Please switch to Cronos Testnet in MetaMask.`
    );
  }
}
```

### Configuration Errors

```typescript
class ConfigurationError extends Error {
  constructor(public missingVars: string[]) {
    super(
      `Missing required environment variables: ${missingVars.join(', ')}.\n` +
      `Please set CRONOS_RPC_URL and other required variables in your .env file.\n` +
      `See .env.example for reference.`
    );
  }
}
```

### Deployment Errors

```typescript
class DeploymentError extends Error {
  constructor(public network: string, public reason: string) {
    super(
      `Failed to deploy to ${network}: ${reason}.\n` +
      `Ensure you have TCRO for gas fees. Get TCRO from: https://cronos.org/faucet`
    );
  }
}
```

## Testing Strategy

### Unit Tests

1. **Network Configuration Tests**
   - Verify chain ID constants are correct (338)
   - Test RPC URL formatting
   - Validate explorer link generation

2. **Environment Validation Tests**
   - Test missing CRONOS_RPC_URL detection
   - Verify default values are applied
   - Test error message formatting

3. **Frontend Network Detection Tests**
   - Mock MetaMask responses for chain ID 338
   - Test network switching flow
   - Verify error handling for rejected switches

### Integration Tests

1. **Contract Deployment Tests**
   - Deploy to Cronos testnet fork
   - Verify contract addresses are returned
   - Test event emission on Cronos

2. **Frontend E2E Tests**
   - Connect to Cronos testnet
   - Create payment stream
   - Verify transaction on Cronos Explorer

3. **Agent Demo Tests**
   - Run demo with Cronos RPC
   - Verify transaction submission
   - Check explorer link generation

### Manual Testing Checklist

- [ ] Deploy contracts to Cronos testnet
- [ ] Connect MetaMask to Cronos testnet
- [ ] Mint MNEE tokens
- [ ] Create payment stream
- [ ] Withdraw from stream
- [ ] Cancel stream
- [ ] Verify all transactions on Cronos Explorer
- [ ] Run agent demo end-to-end
- [ ] Check all documentation links work
- [ ] Verify faucet link provides TCRO

## Migration Strategy

### Phase 1: Configuration Updates
1. Update hardhat.config.js
2. Update .env.example
3. Update all config loaders
4. Update environment variable names

### Phase 2: Frontend Updates
1. Update chain ID constants
2. Update network detection logic
3. Update explorer link generation
4. Update UI text and error messages
5. Update in-app documentation

### Phase 3: Backend/Demo Updates
1. Update agent demo configuration
2. Update CLI output formatting
3. Update Rust agent network references
4. Update SDK examples

### Phase 4: Documentation Updates
1. Update README.md
2. Update DEPLOYMENT.md
3. Update all docs/ files
4. Create cronos-testnet.md deployment guide
5. Update spec files

### Phase 5: Testing & Validation
1. Deploy contracts to Cronos testnet
2. Run full test suite
3. Perform manual E2E testing
4. Validate all documentation
5. Create migration guide

## Deployment Considerations

### Gas Costs on Cronos
- Typical gas price: 5000 gwei
- Stream creation: ~150,000 gas (~0.75 TCRO)
- Withdrawal: ~80,000 gas (~0.4 TCRO)
- Much cheaper than Ethereum L1

### RPC Reliability
- Primary: https://evm-t3.cronos.org (public, rate-limited)
- Consider dedicated RPC for production
- Implement retry logic for RPC failures

### Block Time
- Cronos: ~5-6 seconds
- Faster than Ethereum (~12 seconds)
- Update UI polling intervals if needed

## Security Considerations

1. **Private Key Management**
   - Never commit PRIVATE_KEY to git
   - Use .env for local development
   - Use secure vaults for production

2. **RPC Endpoint Security**
   - Validate RPC responses
   - Implement timeout handling
   - Use HTTPS only

3. **Contract Verification**
   - Verify contracts on Cronos Explorer
   - Publish source code
   - Document contract addresses

## Performance Optimizations

1. **RPC Caching**
   - Cache network configuration
   - Reuse provider instances
   - Implement connection pooling

2. **Frontend Optimization**
   - Lazy load documentation content
   - Cache explorer links
   - Minimize RPC calls

3. **Agent Demo Optimization**
   - Batch RPC requests where possible
   - Cache stream state
   - Optimize transaction submission

## Rollback Plan

If issues arise with Cronos:

1. **Immediate Rollback**
   - Revert hardhat.config.js to Sepolia
   - Revert frontend chain ID constants
   - Revert environment variable names

2. **Partial Rollback**
   - Support both networks simultaneously
   - Add network selector in UI
   - Maintain dual documentation

3. **Data Migration**
   - No on-chain data to migrate (testnet)
   - Update contract addresses in config
   - Clear local storage if needed
