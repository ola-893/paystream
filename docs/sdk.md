# SDK Reference

The PayStream SDK enables AI agents to make streaming payments.

## Installation

```bash
cd sdk
npm install
```

## Quick Start

```typescript
import { PayStreamSDK } from './PayStreamSDK';

const sdk = new PayStreamSDK({
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://evm-t3.cronos.org',
  contractAddress: '0x155A00fBE3D290a8935ca4Bf5244283685Bb0035'
});

// Make a request - SDK handles x402 automatically
const response = await sdk.request('https://api.provider.com/premium');
```

## Components

| Component | Description |
|-----------|-------------|
| [PayStreamSDK](paystream-sdk.md) | Main SDK class |
| [GeminiPaymentBrain](gemini-payment-brain.md) | AI decision engine |
| [SpendingMonitor](spending-monitor.md) | Safety controls |
| [PayStreamProxy](paystream-proxy.md) | Multi-agent support |

## Architecture

```
┌─────────────────────────────────────────┐
│              PayStreamSDK                  │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Request   │  │  Stream Manager │   │
│  │   Handler   │  │                 │   │
│  └─────────────┘  └─────────────────┘   │
│         │                 │             │
│         ▼                 ▼             │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   x402      │  │   Contract      │   │
│  │   Parser    │  │   Interface     │   │
│  └─────────────┘  └─────────────────┘   │
│         │                 │             │
│         ▼                 ▼             │
│  ┌─────────────────────────────────┐    │
│  │      GeminiPaymentBrain         │    │
│  │      (Decision Engine)          │    │
│  └─────────────────────────────────┘    │
│                   │                     │
│                   ▼                     │
│  ┌─────────────────────────────────┐    │
│  │       SpendingMonitor           │    │
│  │       (Safety Controls)         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Features

- ✅ Automatic x402 negotiation
- ✅ Stream creation and management
- ✅ AI-powered payment decisions
- ✅ Spending limits and safety controls
- ✅ Multi-agent mesh support
- ✅ TypeScript support

## Next Steps

- [PayStreamSDK Reference](paystream-sdk.md)
- [Building AI Agents](../guides/building-ai-agents.md)
