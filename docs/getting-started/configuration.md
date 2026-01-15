# Configuration

FlowPay offers extensive configuration options for different use cases.

## SDK Configuration

```typescript
import { FlowPaySDK } from './sdk/src/FlowPaySDK';

const sdk = new FlowPaySDK({
  // Required
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://evm-t3.cronos.org',
  contractAddress: 'TBD_YOUR_FLOWPAYSTREAM_ADDRESS',
  mneeAddress: 'TBD_YOUR_MNEE_ADDRESS',
  
  // Optional
  agentId: 'my-agent-001',
  defaultStreamDuration: 3600, // 1 hour
  autoApproveTokens: true,
  maxRetries: 3,
  retryDelay: 1000
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `privateKey` | string | required | Wallet private key |
| `rpcUrl` | string | required | Ethereum RPC endpoint |
| `contractAddress` | string | required | FlowPayStream contract address |
| `mneeAddress` | string | required | MNEE token address |
| `agentId` | string | auto | Unique agent identifier |
| `defaultStreamDuration` | number | 3600 | Default stream duration (seconds) |
| `autoApproveTokens` | boolean | true | Auto-approve token allowance |
| `maxRetries` | number | 3 | Max retry attempts for failed requests |
| `retryDelay` | number | 1000 | Delay between retries (ms) |

## Spending Monitor Configuration

```typescript
import { SpendingMonitor } from './sdk/src/SpendingMonitor';

const monitor = new SpendingMonitor({
  dailyLimit: '100',      // 100 MNEE per day
  perRequestLimit: '1',   // 1 MNEE max per request
  emergencyStopThreshold: '500', // Stop if total exceeds 500 MNEE
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
  mneeAddress: 'TBD_YOUR_MNEE_ADDRESS',
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
VITE_MNEE_TOKEN_ADDRESS=TBD_YOUR_MNEE_ADDRESS

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
