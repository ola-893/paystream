# Agent-First CLI Demo

A CLI-first demonstration of AI agents autonomously triggering and streaming payments via the x402 protocol and FlowPay.

## Quick Start

```bash
# Install dependencies
npm install

# Run the demo
npm start

# Run with options
npm start -- --verbose --dry-run
```

## CLI Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed debug output |
| `-q, --quiet` | Show minimal output |
| `-d, --dry-run` | Simulate without real blockchain transactions |
| `-s, --scenario <name>` | Run specific scenario (streaming, per-request, budget-exceeded) |
| `-c, --check` | Verify setup: wallet balance, contract connectivity, server availability |
| `-h, --help` | Display help message |

## Environment Variables

Create a `.env` file in the project root with:

```env
# Required
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
FLOWPAY_CONTRACT=0x...
MNEE_TOKEN=0x...

# Optional
GEMINI_API_KEY=your_gemini_api_key
DAILY_BUDGET=10
SERVER_URL=http://localhost:3001
```

## Scenarios

The demo includes multiple scenarios:

1. **Streaming Mode** - Weather API with per-second pricing
2. **Per-Request Mode** - Premium API with per-request pricing
3. **Stream Reuse** - Multiple requests reusing the same stream
4. **Budget Exceeded** - Agent declining payment due to budget limits

## Architecture

```
demo/agent-demo/
├── index.ts          # CLI entry point
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
└── README.md         # This file
```

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev
```
