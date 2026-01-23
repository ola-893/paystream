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
