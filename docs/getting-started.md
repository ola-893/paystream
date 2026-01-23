# Getting Started

Welcome to PayStream! This section will help you get up and running quickly.

## What You'll Learn

1. **Installation** - Set up PayStream in your project
2. **Quick Start** - Create your first payment stream
3. **Configuration** - Customize PayStream for your needs

## Prerequisites

Before you begin, ensure you have:

- Node.js v18 or higher
- npm or yarn package manager
- MetaMask or compatible Web3 wallet
- TCRO testnet tokens (for gas fees)
- Basic understanding of Ethereum and smart contracts

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | v18.0.0 | v20.0.0+ |
| RAM | 4GB | 8GB+ |
| Storage | 500MB | 1GB+ |

## Architecture Overview

PayStream consists of three main components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Consumer      │────▶│    Provider     │────▶│   Blockchain    │
│   (AI Agent)    │◀────│   (x402 API)    │◀────│   (Cronos)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   PayStreamSDK            Middleware              PayStreamStream
   GeminiAI              Verification            Native TCRO
```

## Next Steps

- [Installation Guide](installation.md)
- [Quick Start Tutorial](quick-start.md)
- [Configuration Options](configuration.md)
# Installation

This guide covers installing PayStream components for different use cases.

## For AI Agent Developers (SDK)

Install the PayStream SDK to enable your AI agents to make streaming payments:

```bash
cd sdk
npm install
```

### Dependencies

The SDK requires:
- `ethers` ^6.0.0 - Ethereum interactions
- `@google/generative-ai` - Gemini AI integration (optional)

## For API Providers (Middleware)

Install the server middleware to accept x402 payments:

```bash
cd server
npm install
```

### Express.js Integration

```javascript
const express = require('express');
const { payStreamMiddleware } = require('./middleware/payStreamMiddleware');

const app = express();

// Apply middleware to protected routes
app.use('/api/premium', flowPayMiddleware({
  pricePerRequest: '0.001', // TCRO per request
  recipientAddress: '0x...',
  contractAddress: '0x155A00fBE3D290a8935ca4Bf5244283685Bb0035'
}));
```

## For Frontend Development

Install the React dashboard:

```bash
cd vite-project
npm install
```

### Start Development Server

```bash
npm run dev
```

## Smart Contract Deployment

If you need to deploy your own contracts:

```bash
# Install Hardhat dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to Cronos Testnet
npx hardhat run scripts/deploy.js --network cronos_testnet
```

## Environment Variables

Create a `.env` file in the project root:

```bash
# Required for deployment
PRIVATE_KEY=0x...
CRONOS_RPC_URL=https://evm-t3.cronos.org

# Optional
GEMINI_API_KEY=...
GEMINI_API_KEY=...
```

## Verify Installation

Run the test suite to verify everything is working:

```bash
# SDK tests
cd sdk && npx mocha -r ts-node/register test/*.test.ts

# Contract tests
npx hardhat test
```

Expected output:
- SDK Tests: 41 passing
- Contract Tests: 6 passing

## Next Steps

- [Quick Start Guide](quick-start.md)
- [Configuration Options](configuration.md)
# Configuration

PayStream offers extensive configuration options for different use cases.

## SDK Configuration

```typescript
import { FlowPaySDK } from './sdk/src/FlowPaySDK';

const sdk = new FlowPaySDK({
  // Required
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://evm-t3.cronos.org',
  contractAddress: 'TBD_YOUR_FLOWPAYSTREAM_ADDRESS',
  
  // Optional
  agentId: 'my-agent-001',
  defaultStreamDuration: 3600, // 1 hour
  maxRetries: 3,
  retryDelay: 1000
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `privateKey` | string | required | Wallet private key |
| `rpcUrl` | string | required | Cronos RPC endpoint |
| `contractAddress` | string | required | FlowPayStream contract address |
| `agentId` | string | auto | Unique agent identifier |
| `defaultStreamDuration` | number | 3600 | Default stream duration (seconds) |
| `maxRetries` | number | 3 | Max retry attempts for failed requests |
| `retryDelay` | number | 1000 | Delay between retries (ms) |

## Spending Monitor Configuration

```typescript
import { SpendingMonitor } from './sdk/src/SpendingMonitor';

const monitor = new SpendingMonitor({
  dailyLimit: '100',      // 100 TCRO per day
  perRequestLimit: '1',   // 1 TCRO max per request
  emergencyStopThreshold: '500', // Stop if total exceeds 500 TCRO
  alertCallback: (alert) => {
    console.log('Spending alert:', alert);
  }
});
```

## Gemini AI Configuration

```typescript
import { GeminiPaymentBrain } from './sdk/src/GeminiPaymentBrain';

const brain = new GeminiPaymentBrain({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro',
  decisionThreshold: 0.7,
  preferStreaming: true,
  costOptimization: 'aggressive' // 'conservative' | 'balanced' | 'aggressive'
});
```

## Middleware Configuration

```javascript
const { flowPayMiddleware } = require('./middleware/flowPayMiddleware');

app.use('/api/premium', flowPayMiddleware({
  // Pricing
  pricePerRequest: '0.001',
  pricingModel: 'per-request', // 'per-request' | 'per-byte' | 'per-second'
  
  // Contract
  contractAddress: 'TBD_YOUR_FLOWPAYSTREAM_ADDRESS',
  recipientAddress: '0x...',
  
  // Verification
  minStreamBalance: '0.01',
  verifyOnChain: true,
  cacheVerification: true,
  cacheTTL: 60000, // 1 minute
  
  // Headers
  customHeaders: {
    'X-Provider-Name': 'MyAPI'
  }
}));
```

## Frontend Configuration

Create `vite-project/.env`:

```bash
# Contract addresses
VITE_CONTRACT_ADDRESS=TBD_YOUR_FLOWPAYSTREAM_ADDRESS

# Network
VITE_CHAIN_ID=338
VITE_RPC_URL=https://evm-t3.cronos.org

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AI_CONSOLE=true
```

## Network Configuration

### Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Cronos Testnet | 338 | ✅ Active |
| Cronos Mainnet | 25 | 🔜 Coming Soon |

### Custom RPC Endpoints

```javascript
const RPC_URLS = {
  cronos_testnet: {
    primary: 'https://evm-t3.cronos.org',
    fallback: [
      'https://evm-t3.cronos.org'
    ]
  }
};
```

## Security Configuration

### Private Key Management

Never hardcode private keys. Use environment variables or secure vaults:

```bash
# .env (never commit this file!)
PRIVATE_KEY=0x...
```

### Rate Limiting

```javascript
const rateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  skipSuccessfulRequests: false
};
```

## Next Steps

- [Architecture Overview](../architecture/README.md)
- [SDK Reference](../sdk/README.md)
# Quick Start

Get PayStream running in under 5 minutes.

## Step 1: Connect Your Wallet

1. Open the PayStream dashboard
2. Click "Connect Wallet"
3. Select MetaMask and approve the connection
4. Ensure you're on Cronos testnet (Chain ID: 338)

## Step 2: Get Test Tokens

You need TCRO tokens to create streams:

1. Visit the Cronos testnet faucet at https://cronos.org/faucet
2. Enter your wallet address
3. Request TCRO tokens
4. Wait for confirmation

## Step 3: Create Your First Stream

```javascript
// Using the SDK
import { PayStreamSDK } from './sdk/src/PayStreamSDK';

const sdk = new PayStreamSDK({
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://evm-t3.cronos.org',
  contractAddress: '0x6aEe6d1564FA029821576055A5420cAac06cF4F3'
});

// Create a stream
const streamId = await sdk.createStream({
  recipient: '0x...provider_address',
  amount: '10', // 10 TCRO
  duration: 3600, // 1 hour
  metadata: JSON.stringify({ purpose: 'API access' })
});

console.log(`Stream created: #${streamId}`);
```

## Step 4: Make API Requests

Once your stream is active, make requests to x402-enabled APIs:

```javascript
// The SDK handles x402 negotiation automatically
const response = await sdk.request('https://api.provider.com/premium', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});

// First request: SDK detects 402, creates stream, retries
// Subsequent requests: Use existing stream (no new signatures!)
```

## Step 5: Monitor Your Stream

View your active streams in the dashboard:

1. Go to "Streams" tab
2. See "Outgoing Streams" section
3. Monitor flow rate and remaining balance
4. Cancel anytime to reclaim unused funds

## Using the Dashboard

### Create Stream via UI

1. Enter recipient address
2. Set amount (in TCRO)
3. Set duration (in seconds)
4. Click "Create Stream"
5. Confirm stream creation with TCRO payment

### Withdraw Funds

If you're receiving a stream:

1. Go to "Incoming Streams"
2. Click "Withdraw" on any active stream
3. Confirm the transaction
4. Funds are transferred to your wallet

## Example: Complete Flow

```javascript
// 1. Initialize SDK
const sdk = new PayStreamSDK(config);

// 2. Check if stream exists for provider
const existingStream = await sdk.getActiveStream(providerAddress);

if (!existingStream) {
  // 3. Create new stream
  await sdk.createStream({
    recipient: providerAddress,
    amount: '100',
    duration: 86400 // 24 hours
  });
}

// 4. Make requests (stream ID attached automatically)
for (let i = 0; i < 100; i++) {
  const data = await sdk.request(`${providerUrl}/api/data`);
  console.log(`Request ${i + 1}:`, data);
}

// 5. Close stream when done (optional - reclaim unused funds)
await sdk.cancelStream(streamId);
```

## What's Next?

- [Configuration Options](configuration.md)
- [Architecture Deep Dive](../architecture/README.md)
- [Building AI Agents](../guides/building-ai-agents.md)
