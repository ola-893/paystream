# Cronos Testnet Migration Guide

This document provides a comprehensive guide for the PayStream migration from Ethereum Sepolia testnet to Cronos testnet. It includes all changed files, before/after comparisons, breaking changes, and step-by-step user actions.

## Table of Contents

- [Overview](#overview)
- [Network Details](#network-details)
- [Breaking Changes](#breaking-changes)
- [Files Changed](#files-changed)
- [Before/After Comparisons](#beforeafter-comparisons)
- [User Action Checklist](#user-action-checklist)
- [MetaMask Configuration](#metamask-configuration)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [Cronos Resources](#cronos-resources)

## Overview

PayStream has migrated from Ethereum Sepolia testnet to Cronos testnet to leverage:
- **Lower gas fees**: Transactions cost significantly less on Cronos
- **Faster block times**: ~5-6 seconds vs ~12 seconds on Ethereum
- **Better ecosystem alignment**: Cronos is optimized for DeFi and payment applications
- **EVM compatibility**: All existing smart contracts work without modification

This migration affects all system components: smart contracts, frontend, backend, documentation, and demos.

## Network Details

### Old Network (Sepolia)
- **Chain ID**: 11155111 (decimal) / 0xaa36a7 (hex)
- **RPC URL**: https://rpc.sepolia.org
- **Block Explorer**: https://sepolia.etherscan.io
- **Native Token**: ETH
- **Faucet**: Various Sepolia faucets

### New Network (Cronos Testnet)
- **Chain ID**: 338 (decimal) / 0x152 (hex)
- **RPC URL**: https://evm-t3.cronos.org
- **Block Explorer**: https://explorer.cronos.org/testnet
- **Native Token**: TCRO
- **Faucet**: https://cronos.org/faucet
- **Block Time**: ~5-6 seconds
- **Typical Gas Price**: 5000 gwei

## Breaking Changes

⚠️ **Important**: This migration introduces breaking changes that require user action.

### 1. Environment Variables Renamed
- `SEPOLIA_RPC_URL` → `CRONOS_RPC_URL`
- All `.env` files must be updated
- Old environment variables will cause connection failures

### 2. Contract Addresses Invalid
- All Sepolia contract deployments are no longer accessible
- Contracts must be redeployed to Cronos testnet
- Contract addresses in configuration files must be updated

### 3. Network Configuration Required
- Users must add Cronos testnet to MetaMask
- Existing Sepolia network configuration is incompatible
- Chain ID changed from 11155111 to 338

### 4. Gas Token Changed
- ETH → TCRO for gas payments
- Users need TCRO from Cronos faucet
- Sepolia ETH cannot be used

### 5. Block Explorer Links
- All Etherscan links now point to Cronos Explorer
- Bookmarked transaction links will not work
- Explorer API endpoints have changed

### 6. RPC Endpoints
- Sepolia RPC endpoints no longer used
- Applications must connect to Cronos RPC
- Rate limits may differ from Sepolia

## Files Changed

### Summary
- **Total Files Modified**: 40+
- **Configuration Files**: 5
- **Frontend Files**: 8
- **Backend/Demo Files**: 7
- **Documentation Files**: 15
- **Spec Files**: 5

### Configuration Files (5 files)

1. ✅ **`hardhat.config.js`**
   - Updated network configuration from `sepolia` to `cronos_testnet`
   - Changed chain ID to 338
   - Updated RPC URL environment variable
   - Adjusted gas price for Cronos

2. ✅ **`.env.example`**
   - Renamed `SEPOLIA_RPC_URL` to `CRONOS_RPC_URL`
   - Updated default RPC URL
   - Updated comments and faucet links
   - Changed contract address comments to "TBD - Deploy yourself"

3. ✅ **`package.json`**
   - Added `deploy:cronos` script
   - Updated deployment commands

4. ✅ **`scripts/deploy.js`**
   - Changed network detection from "sepolia" to "cronos_testnet"
   - Updated deployment output messages

5. ✅ **`demo/agent-demo/config.ts`**
   - Updated `EnvConfig` interface
   - Renamed environment variable references
   - Updated configuration validation

### Frontend Files (8 files)

1. ✅ **`vite-project/src/App.jsx`**
   - Changed `TARGET_CHAIN_ID_DEC` from 11155111 to 338
   - Updated `TARGET_CHAIN_ID_HEX` to '0x152'
   - Updated network switching logic
   - Changed error messages to reference Cronos

2. ✅ **`vite-project/src/components/Header.jsx`**
   - Updated chain icon logic for Cronos
   - Changed chain ID check from 11155111 to 338

3. ✅ **`vite-project/src/config/networks.ts`** (new file)
   - Created centralized network configuration
   - Exported `CRONOS_TESTNET` constant
   - Provided helper functions

4. ✅ **`vite-project/src/pages/Docs.jsx`**
   - Updated all network references to Cronos
   - Changed chain ID to 338
   - Updated RPC URLs and faucet links
   - Updated MetaMask setup instructions

5. ✅ **`vite-project/src/pages/Dashboard.jsx`**
   - Updated network-related UI text

6. ✅ **`vite-project/src/pages/Streams.jsx`**
   - Updated explorer link generation

7. ✅ **`vite-project/src/components/StreamCard.jsx`**
   - Updated transaction link formatting

8. ✅ **`vite-project/src/components/CreateStreamForm.jsx`**
   - Updated network validation messages

### Backend/Demo Files (7 files)

1. ✅ **`demo/agent-demo/index.ts`**
   - Changed `config.SEPOLIA_RPC_URL` to `config.CRONOS_RPC_URL`
   - Updated connection messages
   - Updated network-related logs

2. ✅ **`demo/agent-demo/CLIOutput.ts`**
   - Renamed `etherscanLink` to `cronosExplorerLink`
   - Updated URL format to Cronos Explorer
   - Updated method documentation

3. ✅ **`demo/agent-demo/DemoRunner.ts`**
   - Updated comments from "Etherscan" to "Cronos Explorer"
   - Verified transaction display uses new method

4. ✅ **`demo/agent-demo/README.md`**
   - Updated environment variable names
   - Updated network references
   - Updated faucet links

5. ✅ **`agent-triggered-payment/src/main.rs`**
   - Changed network field from "sepolia" to "cronos_testnet"
   - Updated comments

6. ✅ **`agent-triggered-payment/.env.example`**
   - Renamed `SEPOLIA_RPC_URL` to `CRONOS_RPC_URL`
   - Updated RPC URL default value

7. ✅ **`agent-triggered-payment/README.md`**
   - Updated network references
   - Updated configuration examples

### Documentation Files (15 files)

1. ✅ **`README.md`**
   - Updated Quick Start section
   - Changed network setup instructions
   - Updated faucet links
   - Updated deployed contracts section

2. ✅ **`DEPLOYMENT.md`**
   - Updated current deployment section
   - Updated network configuration table
   - Updated troubleshooting section

3. ✅ **`docs/deployment/README.md`**
   - Changed supported networks table
   - Updated deployment guides links
   - Updated quick deploy commands

4. ✅ **`docs/deployment/cronos-testnet.md`** (new file)
   - Created comprehensive Cronos deployment guide
   - Included prerequisites and setup
   - Added troubleshooting section

5. ❌ **`docs/deployment/sepolia.md`** (deleted)
   - Removed old Sepolia deployment guide

6. ✅ **`docs/getting-started/README.md`**
   - Updated quick start instructions

7. ✅ **`docs/getting-started/configuration.md`**
   - Updated environment variables section
   - Changed `VITE_CHAIN_ID` to 338
   - Updated supported networks table

8. ✅ **`docs/getting-started/installation.md`**
   - Updated network configuration examples

9. ✅ **`docs/getting-started/quick-start.md`**
   - Updated MetaMask setup instructions

10. ✅ **`docs/architecture/README.md`**
    - Updated blockchain layer description

11. ✅ **`docs/architecture/payment-streams.md`**
    - Updated network references

12. ✅ **`docs/architecture/x402-protocol.md`**
    - Updated protocol examples

13. ✅ **`docs/contracts/README.md`**
    - Updated deployment network references

14. ✅ **`docs/contracts/paystreamstream.md`**
    - Updated contract deployment info

15. ✅ **`docs/reference/faq.md`**
    - Updated FAQ with Cronos information

### Spec Files (5 files)

1. ✅ **`.kiro/specs/agent-first-demo/requirements.md`**
   - Updated PayStream_Contract glossary definition
   - Changed "Sepolia" to "Cronos Testnet"

2. ✅ **`.kiro/specs/agent-first-demo/design.md`**
   - Updated blockchain layer description
   - Updated architecture diagram
   - Updated EnvConfig interface

3. ✅ **`.kiro/specs/agent-first-demo/tasks.md`**
   - Updated task references to CRONOS_RPC_URL
   - Updated Cronos Explorer references

4. ✅ **`.kiro/specs/cronos-migration/requirements.md`** (new file)
   - Created migration requirements document

5. ✅ **`.kiro/specs/cronos-migration/design.md`** (new file)
   - Created migration design document

## Before/After Comparisons

### 1. Hardhat Configuration

**Before (Sepolia):**
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};
```

**After (Cronos):**
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    cronos_testnet: {
      url: process.env.CRONOS_RPC_URL || "https://evm-t3.cronos.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 338,
      gasPrice: 5000000000000, // 5000 gwei
    },
  },
};
```

### 2. Environment Variables

**Before (Sepolia):**
```bash
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
PAYSTREAM_CONTRACT=0x...
# Legacy token address removed - using native TCRO now
```

**After (Cronos):**
```bash
CRONOS_RPC_URL=https://evm-t3.cronos.org
PRIVATE_KEY=your_private_key_here
PAYSTREAM_CONTRACT=TBD - Deploy yourself
# Legacy token address removed - using native TCRO now
```

### 3. Frontend Chain ID

**Before (Sepolia):**
```javascript
const TARGET_CHAIN_ID_DEC = 11155111;
const TARGET_CHAIN_ID_HEX = '0xaa36a7';

function getNetworkName(chainId) {
  if (chainId === 11155111) return 'Sepolia';
  return 'Unknown Network';
}
```

**After (Cronos):**
```javascript
const TARGET_CHAIN_ID_DEC = 338;
const TARGET_CHAIN_ID_HEX = '0x152';

function getNetworkName(chainId) {
  if (chainId === 338) return 'Cronos Testnet';
  return 'Unknown Network';
}
```

### 4. Network Switching Logic

**Before (Sepolia):**
```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0xaa36a7',
    chainName: 'Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }]
});
```

**After (Cronos):**
```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x152',
    chainName: 'Cronos Testnet',
    nativeCurrency: { name: 'TCRO', symbol: 'TCRO', decimals: 18 },
    rpcUrls: ['https://evm-t3.cronos.org'],
    blockExplorerUrls: ['https://explorer.cronos.org/testnet']
  }]
});
```

### 5. Explorer Links

**Before (Sepolia):**
```typescript
etherscanLink(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}
```

**After (Cronos):**
```typescript
cronosExplorerLink(txHash: string): string {
  return `https://explorer.cronos.org/testnet/tx/${txHash}`;
}
```

### 6. Agent Demo Configuration

**Before (Sepolia):**
```typescript
interface EnvConfig {
  SEPOLIA_RPC_URL: string;
  PRIVATE_KEY: string;
  // ...
}

const config = {
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL!,
  // ...
};
```

**After (Cronos):**
```typescript
interface EnvConfig {
  CRONOS_RPC_URL: string;
  PRIVATE_KEY: string;
  // ...
}

const config = {
  CRONOS_RPC_URL: process.env.CRONOS_RPC_URL!,
  // ...
};
```

### 7. Deployment Command

**Before (Sepolia):**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**After (Cronos):**
```bash
npx hardhat run scripts/deploy.js --network cronos_testnet
# or
npm run deploy:cronos
```

### 8. Error Messages

**Before (Sepolia):**
```javascript
alert('Please switch to Sepolia testnet in MetaMask');
```

**After (Cronos):**
```javascript
alert('Please switch to Cronos Testnet in MetaMask');
```

## User Action Checklist

Follow these steps to complete your migration to Cronos testnet:

### Step 1: Update Environment Variables
- [ ] Open your `.env` file
- [ ] Rename `SEPOLIA_RPC_URL` to `CRONOS_RPC_URL`
- [ ] Update the RPC URL to `https://evm-t3.cronos.org`
- [ ] Set contract addresses to empty or TBD (will update after deployment)
- [ ] Save the file

**Example `.env` file:**
```bash
CRONOS_RPC_URL=https://evm-t3.cronos.org
PRIVATE_KEY=your_private_key_here
PAYSTREAM_CONTRACT=
# Legacy token address removed - using native TCRO now
GEMINI_API_KEY=your_gemini_api_key
DAILY_BUDGET=10
```

### Step 2: Configure MetaMask
- [ ] Open MetaMask
- [ ] Click on the network dropdown
- [ ] Click "Add Network" or "Add Network Manually"
- [ ] Enter the following details:
  - Network Name: `Cronos Testnet`
  - RPC URL: `https://evm-t3.cronos.org`
  - Chain ID: `338`
  - Currency Symbol: `TCRO`
  - Block Explorer: `https://explorer.cronos.org/testnet`
- [ ] Click "Save"
- [ ] Switch to Cronos Testnet

### Step 3: Get TCRO for Gas
- [ ] Visit https://cronos.org/faucet
- [ ] Connect your wallet
- [ ] Request testnet TCRO
- [ ] Wait for the transaction to complete
- [ ] Verify you have TCRO in your wallet

### Step 4: Deploy Contracts
- [ ] Ensure you have TCRO for gas fees
- [ ] Run the deployment command:
  ```bash
  npm run deploy:cronos
  ```
- [ ] Save the deployed contract addresses from the output
- [ ] Note the transaction hashes

**Expected output:**
```
Deploying to cronos_testnet...
PayStreamStream deployed to: 0x5678...
```

### Step 5: Update Contract Addresses
- [ ] Open `vite-project/src/contactInfo.js`
- [ ] Update `PAYSTREAM_CONTRACT` with the deployed PayStreamStream address
- [ ] Legacy token address removed - using native TCRO now
- [ ] Save the file
- [ ] Optionally update your `.env` file with the addresses

### Step 6: Update Agent Demo Configuration
- [ ] Open `demo/agent-demo/.env`
- [ ] Update `CRONOS_RPC_URL`
- [ ] Update contract addresses
- [ ] Save the file

### Step 7: Update Rust Agent Configuration (if using)
- [ ] Open `agent-triggered-payment/.env`
- [ ] Update `CRONOS_RPC_URL`
- [ ] Update contract addresses
- [ ] Save the file

### Step 8: Test the Application
- [ ] Start the frontend: `cd vite-project && npm run dev`
- [ ] Connect MetaMask (should auto-detect Cronos Testnet)
- [ ] Get TCRO tokens from Cronos faucet
- [ ] Create a test payment stream
- [ ] Verify the transaction on Cronos Explorer
- [ ] Test withdrawing from the stream
- [ ] Test canceling a stream

### Step 9: Test Agent Demo (optional)
- [ ] Navigate to `demo/agent-demo`
- [ ] Run `npm install` (if needed)
- [ ] Run `npm start`
- [ ] Verify connection to Cronos Testnet
- [ ] Test autonomous payment scenarios
- [ ] Check transaction links point to Cronos Explorer

### Step 10: Verify Documentation
- [ ] Review the updated README.md
- [ ] Check that all links work
- [ ] Verify faucet link provides TCRO
- [ ] Test deployment instructions
- [ ] Confirm code examples are correct

## MetaMask Configuration

### Manual Setup

1. **Open MetaMask** and click the network dropdown at the top
2. **Click "Add Network"** or "Add Network Manually"
3. **Enter the following details:**

| Field | Value |
|-------|-------|
| Network Name | Cronos Testnet |
| RPC URL | https://evm-t3.cronos.org |
| Chain ID | 338 |
| Currency Symbol | TCRO |
| Block Explorer URL | https://explorer.cronos.org/testnet |

4. **Click "Save"**
5. **Switch to Cronos Testnet** from the network dropdown

### Automatic Setup (via App)

The PayStream frontend will automatically prompt you to add Cronos Testnet when you connect your wallet. Simply:

1. Connect your wallet
2. Click "Switch Network" when prompted
3. Approve the network addition in MetaMask
4. Approve the network switch

### Verification

To verify you're on the correct network:
- Check that MetaMask shows "Cronos Testnet" at the top
- Verify the chain ID is 338
- Confirm your balance is shown in TCRO

## Deployment Guide

### Prerequisites

Before deploying contracts to Cronos testnet:

1. **TCRO for Gas**: Get testnet TCRO from https://cronos.org/faucet
2. **Private Key**: Have your wallet private key ready
3. **Environment Variables**: Update your `.env` file with `CRONOS_RPC_URL`

### Deployment Steps

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Compile Contracts**:
   ```bash
   npx hardhat compile
   ```

3. **Deploy to Cronos Testnet**:
   ```bash
   npm run deploy:cronos
   ```
   
   Or using Hardhat directly:
   ```bash
   npx hardhat run scripts/deploy.js --network cronos_testnet
   ```

4. **Save Contract Addresses**:
   The deployment script will output the deployed contract address:
   ```
   PayStreamStream deployed to: 0xabcdef1234567890...
   ```
   
   Save these addresses for the next step.

5. **Update Configuration**:
   Update `vite-project/src/contactInfo.js`:
   ```javascript
   export const PAYSTREAM_CONTRACT = '0xabcdef1234567890...';
   // Legacy token address removed - using native TCRO now
   ```

6. **Verify Contracts** (optional but recommended):
   Visit Cronos Explorer and search for your contract addresses to verify deployment.

### Deployment Costs

Typical gas costs on Cronos testnet:
- **PayStreamStream deployment**: ~2,000,000 gas (~10 TCRO)
- **Total**: ~10 TCRO (free from faucet)

### Troubleshooting Deployment

**Issue**: "Insufficient funds for gas"
- **Solution**: Get more TCRO from https://cronos.org/faucet

**Issue**: "Network not found"
- **Solution**: Check that `hardhat.config.js` has `cronos_testnet` network defined

**Issue**: "Invalid RPC URL"
- **Solution**: Verify `CRONOS_RPC_URL` in `.env` is set to `https://evm-t3.cronos.org`

**Issue**: "Transaction timeout"
- **Solution**: Cronos RPC might be slow. Wait and retry, or try a different RPC endpoint

## Troubleshooting

### Common Issues and Solutions

#### 1. "Wrong Network" Error in Frontend

**Symptoms**: App shows "Please switch to Cronos Testnet"

**Solutions**:
- Ensure MetaMask is connected to Cronos Testnet (Chain ID 338)
- Click the "Switch Network" button in the app
- Manually add Cronos Testnet to MetaMask (see [MetaMask Configuration](#metamask-configuration))
- Refresh the page after switching networks

#### 2. "Cannot Connect to RPC" Error

**Symptoms**: App fails to load, shows connection errors

**Solutions**:
- Verify `CRONOS_RPC_URL` is set correctly in `.env`
- Check that the RPC URL is `https://evm-t3.cronos.org`
- Try an alternative Cronos testnet RPC endpoint
- Check your internet connection
- Verify Cronos testnet is operational at https://status.cronos.org

#### 3. "Contract Not Deployed" Error

**Symptoms**: Transactions fail, contract interactions don't work

**Solutions**:
- Verify you've deployed contracts to Cronos testnet
- Check that contract addresses in `contactInfo.js` are correct
- Ensure contract addresses are for Cronos testnet, not Sepolia
- Verify contracts on Cronos Explorer

#### 4. "Insufficient Funds" Error

**Symptoms**: Transactions fail with insufficient funds message

**Solutions**:
- Get TCRO from https://cronos.org/faucet
- Ensure you have enough TCRO for gas fees
- Check your wallet balance in MetaMask
- Wait for faucet transaction to complete before retrying

#### 5. Agent Demo Connection Fails

**Symptoms**: Agent demo can't connect to Cronos

**Solutions**:
- Update `demo/agent-demo/.env` with `CRONOS_RPC_URL`
- Verify the RPC URL is correct
- Check that you have TCRO for gas
- Ensure contract addresses are updated
- Run `npm install` to update dependencies

#### 6. Explorer Links Don't Work

**Symptoms**: Clicking transaction links shows 404 or wrong network

**Solutions**:
- Verify links use `https://explorer.cronos.org/testnet/tx/...`
- Check that transaction hash is correct
- Ensure transaction was sent to Cronos testnet, not Sepolia
- Wait a few seconds for transaction to be indexed

#### 7. MetaMask Shows Wrong Chain ID

**Symptoms**: MetaMask shows chain ID other than 338

**Solutions**:
- Manually switch to Cronos Testnet in MetaMask
- Remove and re-add Cronos Testnet network
- Clear MetaMask cache (Settings → Advanced → Reset Account)
- Ensure you're not connected to Cronos Mainnet (Chain ID 25)

#### 8. Environment Variables Not Loading

**Symptoms**: App shows "Missing CRONOS_RPC_URL" error

**Solutions**:
- Verify `.env` file exists in the correct directory
- Check that variable name is `CRONOS_RPC_URL` (not `SEPOLIA_RPC_URL`)
- Restart the development server after updating `.env`
- For frontend, ensure variable starts with `VITE_` if needed
- Check file permissions on `.env`

#### 9. Deployment Script Fails

**Symptoms**: `npm run deploy:cronos` fails with errors

**Solutions**:
- Verify `hardhat.config.js` has `cronos_testnet` network
- Check that `PRIVATE_KEY` is set in `.env`
- Ensure you have TCRO for gas
- Verify RPC URL is accessible
- Try deploying with `--network cronos_testnet` flag explicitly

#### 10. Transactions Pending Forever

**Symptoms**: Transactions stuck in pending state

**Solutions**:
- Check Cronos testnet status at https://status.cronos.org
- Verify gas price is sufficient (5000 gwei recommended)
- Wait longer (Cronos blocks are ~5-6 seconds)
- Check transaction on Cronos Explorer for details
- Try increasing gas limit if transaction is complex

### Getting Help

If you encounter issues not covered here:

1. **Check Cronos Documentation**: https://docs.cronos.org
2. **Cronos Discord**: Join the Cronos community for support
3. **GitHub Issues**: Report bugs in the PayStream repository
4. **Cronos Explorer**: Use to debug transactions and contracts
5. **Cronos Status Page**: Check for network outages

## Cronos Resources

### Official Resources

- **Cronos Documentation**: https://docs.cronos.org
  - Comprehensive guides for developers
  - Network specifications and APIs
  - Smart contract development tutorials

- **Cronos Faucet**: https://cronos.org/faucet
  - Get free testnet TCRO for gas fees
  - No registration required
  - Instant distribution

- **Cronos Explorer**: https://explorer.cronos.org/testnet
  - View transactions and contracts
  - Verify contract source code
  - Monitor network activity
  - API for programmatic access

- **Cronos Status Page**: https://status.cronos.org
  - Real-time network status
  - Incident reports and updates
  - Scheduled maintenance notifications

### Network Information

- **Testnet RPC Endpoints**:
  - Primary: https://evm-t3.cronos.org
  - Alternative: https://cronos-testnet.crypto.org:8545

- **Mainnet RPC Endpoints** (for future reference):
  - Primary: https://evm.cronos.org
  - Chain ID: 25

### Developer Tools

- **Cronos Bridge**: https://cronos.org/bridge
  - Bridge assets between networks
  - Testnet and mainnet support

- **Cronos Scan API**: https://api-testnet.cronoscan.com
  - Programmatic access to explorer data
  - Transaction and contract queries

### Community

- **Cronos Discord**: https://discord.gg/cronos
  - Developer support channel
  - Community discussions
  - Announcements

- **Cronos Twitter**: https://twitter.com/cronos_chain
  - Latest news and updates
  - Network announcements

- **Cronos GitHub**: https://github.com/crypto-org-chain/cronos
  - Source code and issues
  - Contribution guidelines

### Learning Resources

- **Cronos Developer Portal**: https://cronos.org/developers
  - Getting started guides
  - Example projects
  - Best practices

- **EVM Compatibility**: https://docs.cronos.org/for-dapp-developers/evm-compatibility
  - Ethereum compatibility details
  - Supported opcodes
  - Gas differences

### Ecosystem

- **Cronos DeFi**: https://cronos.org/ecosystem
  - Explore DeFi projects on Cronos
  - Integration opportunities
  - Partnership information

---

## Summary

This migration guide covers all aspects of moving PayStream from Ethereum Sepolia to Cronos testnet. Key points:

- ✅ **40+ files updated** across the entire codebase
- ✅ **Zero feature loss** - all functionality preserved
- ✅ **Lower costs** - significantly reduced gas fees
- ✅ **Faster transactions** - ~5-6 second block times
- ✅ **Full EVM compatibility** - contracts work without changes

Follow the [User Action Checklist](#user-action-checklist) to complete your migration. If you encounter issues, refer to the [Troubleshooting](#troubleshooting) section or reach out via the [Cronos Resources](#cronos-resources).

**Questions?** Check the [Cronos Documentation](https://docs.cronos.org) or join the [Cronos Discord](https://discord.gg/cronos) for support.
