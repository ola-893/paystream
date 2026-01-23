# PayStream Deployment Guide

## Overview

PayStream is "The Streaming Extension for x402" - a hybrid payment protocol that solves the N+1 Signature Problem for AI agent payments. This guide covers deployment to Cronos testnet.

**Key Innovation**: 2 on-chain transactions (Open + Close) regardless of request volume.

## Prerequisites

- Node.js v18+
- npm or yarn
- MetaMask or compatible wallet
- Cronos testnet TCRO (for gas fees)
- Environment variables configured

## Environment Setup

Create a `.env` file in the project root:

```bash
# Required
PRIVATE_KEY=0x...                    # Deployer wallet private key
CRONOS_RPC_URL=https://evm-t3.cronos.org

# Optional
GEMINI_API_KEY=...                   # For AI features

# Frontend (vite-project/.env)
VITE_CONTRACT_ADDRESS=0x...          # PayStreamStream contract address (after deployment)
```

## Quick Start

### 1. Install Dependencies

```bash
# Root project
npm install

# SDK
cd sdk && npm install && cd ..

# Server
cd server && npm install && cd ..

# Frontend
cd vite-project && npm install && cd ..
```

### 2. Deploy Contracts to Cronos Testnet

```bash
# Using npm script (recommended)
npm run deploy:cronos

# Or using hardhat directly
npx hardhat run scripts/deploy.js --network cronos_testnet
```

**Expected Output:**
```
Deploying contracts with the account: 0x...
Network: cronos_testnet

📝 Deploying PayStreamStream to Cronos Testnet...
✅ PayStreamStream deployed to: 0x...
   View on Cronos Explorer: https://explorer.cronos.org/testnet/address/0x...

📝 Deploying PayStreamStream to Cronos Testnet...
   Using native TCRO for payments
✅ PayStreamStream deployed to: 0x...
   View on Cronos Explorer: https://explorer.cronos.org/testnet/address/0x...

🎉 Deployment complete!
```

**Current Cronos Testnet Deployment (January 2026):**
| Contract | Address |
|----------|---------|
| PayStreamStream | `TBD - Deploy yourself` |

**Save these addresses!** You'll need them for configuration.

### 3. Update Configuration

After deployment, update these files:

**`vite-project/.env`:**
```bash
VITE_CONTRACT_ADDRESS=0x5678...      # PayStreamStream address
```

**`server/index.js`** (if running standalone):
```javascript
const CONTRACT_ADDRESS = "0x5678...";
```

### 4. Verify Contracts (Optional)

Verify your contracts on Cronos Explorer:

```bash
npx hardhat verify --network cronos_testnet <CONTRACT_ADDRESS>
```

You can also view your contracts directly on Cronos Explorer:
- PayStreamStream: `https://explorer.cronos.org/testnet/address/<CONTRACT_ADDRESS>`

## Running the System

### Development Mode

**Terminal 1 - Provider Server (The Gatekeeper):**
```bash
cd server
npm start
```

**Terminal 2 - Frontend Dashboard:**
```bash
cd vite-project
npm run dev
```

**Terminal 3 - Demo Consumer Agent:**
```bash
npx ts-node demo/consumer.ts
```

### Production Mode

**Build Frontend:**
```bash
cd vite-project
npm run build
```

**Start Server:**
```bash
cd server
NODE_ENV=production npm start
```

## Running Tests

### All SDK Tests (41 tests)
```bash
cd sdk
npx mocha -r ts-node/register test/*.test.ts
```

### Smart Contract Tests (6 tests)
```bash
npx hardhat test test/PayStreamStream.test.js
```

### Integration Tests Only
```bash
cd sdk
npx mocha -r ts-node/register test/integration.test.ts
```

**Expected Results:**
- SDK Tests: 41 passing
- Contract Tests: 6 passing
- Integration Tests: 12 passing

## Demo Scenarios

### Scenario 1: Complete x402 Handshake

```bash
# Terminal 1: Start Provider
npx ts-node demo/provider.ts

# Terminal 2: Run Consumer
npx ts-node demo/consumer.ts
```

**Expected Flow:**
1. Consumer makes blind request to `/api/premium`
2. Provider returns HTTP 402 with x402 headers
3. SDK parses payment requirements
4. Gemini AI decides: streaming vs direct payment
5. SDK creates stream (1 signature)
6. SDK retries request with `X-PayStream-Stream-ID`
7. Provider verifies stream, returns 200 OK
8. Subsequent requests use same stream (0 signatures)

### Scenario 2: Efficiency Demonstration

```bash
cd sdk
npx mocha -r ts-node/register test/load.test.ts
```

**Validates:**
- 10+ requests with only 1 signature
- Stream reuse for concurrent requests
- N+1 problem is solved

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PayStream System                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Consumer  │───▶│  Provider   │───▶│   Cronos    │     │
│  │   Agent     │    │  (x402 MW)  │    │  Testnet    │     │
│  │   + SDK     │◀───│             │◀───│             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│        │                  │                  │              │
│        │                  │                  │              │
│        ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Gemini    │    │  Dashboard  │    │ PayStreamStream │     │
│  │   AI        │    │  (React)    │    │  (Native)     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Description | Location |
|-----------|-------------|----------|
| PayStreamStream | Smart contract for payment streams | `contracts/PayStreamStream.sol` |
| PayStreamSDK | Agent SDK for x402 negotiation | `sdk/src/PayStreamSDK.ts` |
| payStreamMiddleware | Express.js x402 middleware | `server/middleware/payStreamMiddleware.js` |
| GeminiPaymentBrain | AI decision engine | `sdk/src/GeminiPaymentBrain.ts` |
| SpendingMonitor | Safety & limits | `sdk/src/SpendingMonitor.ts` |
| PayStreamProxy | Multi-agent mesh support | `sdk/src/PayStreamProxy.ts` |

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Cronos Testnet | 338 | https://evm-t3.cronos.org |

## Troubleshooting

### "Insufficient funds for gas"
- Get TCRO from faucet: https://cronos.org/faucet

### "TCRO transfer failed"
- Ensure wallet has sufficient TCRO balance
- Check that stream creation includes TCRO value

### "Stream is not active"
- Verify stream ID exists on-chain
- Check stream hasn't expired or been cancelled

### Tests failing
```bash
# Clean and rebuild
rm -rf sdk/dist
cd sdk && npm run build
```

## Production Checklist

- [ ] Configure production RPC URLs (Alchemy/Infura)
- [ ] Set up monitoring for Emergency Stop triggers
- [ ] Review spending limits for production agents
- [ ] Enable contract verification on Cronoscan
- [ ] Configure HTTPS for server endpoints
- [ ] Set up logging and alerting
- [ ] Review gas price strategies

## Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **API Keys**: Use environment variables for all secrets
3. **Spending Limits**: Configure appropriate limits for agents
4. **Emergency Stop**: Test emergency stop functionality
5. **Stream Verification**: Always verify streams on-chain before granting access

## Support

For issues or questions:
- Check existing tests for usage examples
- Review demo scripts in `demo/` directory
- Examine SDK source code for implementation details

## License

MIT License - See LICENSE file for details
# Deployment Overview

PayStream can be deployed to various EVM-compatible networks.

## Supported Networks

| Network | Status | Chain ID |
|---------|--------|----------|
| Cronos Testnet | ✅ Active | 338 |
| Cronos Mainnet | 🔜 Coming | 25 |

## Current Deployment

**Cronos Testnet:**

| Contract | Address |
|----------|---------|
| PayStreamStream | `TBD - Deploy yourself` |

## Deployment Guides

- [Cronos Testnet](cronos-testnet.md) - Development and testing
- [Production Checklist](production.md) - Mainnet preparation

## Quick Deploy

```bash
# Deploy to Cronos Testnet
npm run deploy:cronos

# Or manually
npx hardhat run scripts/deploy.js --network cronos_testnet
```

## Architecture

```
┌─────────────────────────────────────────┐
│           Deployment Stack              │
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────────────┐             │
│         │  PayStreamStream  │             │
│         │   (Streaming)   │             │
│         └─────────────────┘             │
│                  │                      │
│                  ▼                      │
│         ┌───────────────┐               │
│         │    Cronos     │               │
│         │   Network     │               │
│         │ (Native TCRO) │               │
│         └───────────────┘               │
│                                         │
└─────────────────────────────────────────┘
```

## Environment Variables

Required for deployment:

```bash
PRIVATE_KEY=0x...          # Deployer wallet
CRONOS_RPC_URL=https://...  # RPC endpoint (default: https://evm-t3.cronos.org)
```

## Post-Deployment

After deploying:

1. **Update frontend** with new addresses
2. **Update SDK** configuration
3. **Test** all functionality
4. **Document** deployment details
# Cronos Testnet Deployment

Guide for deploying PayStream to Cronos testnet.

## Current Deployment

| Contract | Address |
|----------|---------|
| FlowPayStream | `TBD - Deploy yourself` |

**Network:** Cronos Testnet (Chain ID: 338)

## Prerequisites

1. **Node.js** v18+
2. **TCRO** for gas fees
3. **Private Key** with TCRO

### Getting TCRO

Free testnet TCRO from faucet:
- https://cronos.org/faucet

## Deployment Steps

### 1. Configure Environment

Create `.env` in project root:

```bash
PRIVATE_KEY=0x...your_private_key
CRONOS_RPC_URL=https://evm-t3.cronos.org
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Deploy

```bash
npx hardhat run scripts/deploy.js --network cronos_testnet
```

**Expected Output:**
```
Deploying contracts with the account: 0x...
FlowPayStream deployed to: 0x...
```

### 5. Update Frontend

Update `vite-project/src/contactInfo.js`:

```javascript
export const contractAddress = "0x..."; // Your FlowPayStream address
```

## Network Configuration

### Hardhat Config

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    cronos_testnet: {
      url: process.env.CRONOS_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 338
    }
  }
};
```

### MetaMask Setup

Add Cronos Testnet to MetaMask:
- Network Name: Cronos Testnet
- RPC URL: https://evm-t3.cronos.org
- Chain ID: 338
- Currency Symbol: TCRO
- Explorer: https://explorer.cronos.org/testnet

## Testing Deployment

### Run Contract Tests

```bash
npx hardhat test --network cronos_testnet
```

### Verify via Dashboard

1. Open FlowPay dashboard
2. Connect wallet (Cronos Testnet network)
3. Create a test stream with TCRO
4. Verify on Cronos Explorer

## Troubleshooting

### "Insufficient funds"

Get more TCRO from the faucet: https://cronos.org/faucet

### "Nonce too low"

Reset MetaMask account or wait for pending transactions.

### "Network mismatch"

Switch MetaMask to Cronos Testnet network.

## RPC Endpoints

| Provider | URL |
|----------|-----|
| Public | https://evm-t3.cronos.org |

## Block Explorer

View transactions and contracts:
https://explorer.cronos.org/testnet
