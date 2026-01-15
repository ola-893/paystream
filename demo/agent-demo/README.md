# Agent-First CLI Demo

A CLI-first demonstration of AI agents autonomously triggering and streaming payments via the x402 protocol and FlowPay. This demo showcases real agents making real HTTP requests, receiving real 402 responses, and creating real on-chain payment streams on Cronos Testnet.

## Quick Start

```bash
# Navigate to the demo directory
cd demo/agent-demo

# Install dependencies
npm install

# Copy and configure environment variables
cp ../../.env.example .env
# Edit .env with your values (see Environment Setup below)

# Verify your setup
npm run check

# Run the demo
npm start
```

## Environment Setup

Create a `.env` file in the project root (or `demo/agent-demo/`) with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PRIVATE_KEY` | Your Ethereum wallet private key (with TCRO and MNEE) | `0xabc123...` |
| `CRONOS_RPC_URL` | Cronos Testnet RPC endpoint | `https://evm-t3.cronos.org` |
| `FLOWPAY_CONTRACT` | FlowPayStream contract address on Cronos Testnet | `0x155A00fBE3D290a8935ca4Bf5244283685Bb0035` |
| `MNEE_TOKEN` | MNEE token contract address on Cronos Testnet | `0x96B1FE54Ee89811f46ecE4a347950E0D682D3896` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI payment decisions | Not set |
| `DAILY_BUDGET` | Daily spending limit in MNEE | `10` |
| `SERVER_URL` | x402 service provider URL | `http://localhost:3001` |

### Example `.env` File

```env
# Required
PRIVATE_KEY=0xYourPrivateKeyHere
CRONOS_RPC_URL=https://evm-t3.cronos.org
FLOWPAY_CONTRACT=0x155A00fBE3D290a8935ca4Bf5244283685Bb0035
MNEE_TOKEN=0x96B1FE54Ee89811f46ecE4a347950E0D682D3896

# Optional
GEMINI_API_KEY=your_gemini_api_key
DAILY_BUDGET=10
SERVER_URL=http://localhost:3001
```

> ⚠️ **Security Warning**: Never commit your private key to version control!

## CLI Usage

### Basic Commands

```bash
# Run all demo scenarios
npm start

# Run with verbose output (detailed debug info)
npm start -- --verbose

# Run in quiet mode (minimal output)
npm start -- --quiet

# Dry-run mode (no real blockchain transactions)
npm start -- --dry-run

# Run specific scenario
npm start -- --scenario streaming
npm start -- --scenario per-request
npm start -- --scenario stream-reuse
npm start -- --scenario budget-exceeded

# Verify setup (wallet, contract, server)
npm run check
# or
npm start -- --check

# Show help
npm start -- --help
```

### CLI Options Reference

| Option | Short | Description |
|--------|-------|-------------|
| `--verbose` | `-v` | Show detailed debug output including agent state, config, and transaction details |
| `--quiet` | `-q` | Show minimal output (errors only) |
| `--dry-run` | `-d` | Simulate the flow without making real blockchain transactions |
| `--scenario <name>` | `-s` | Run only scenarios matching the filter |
| `--check` | `-c` | Verify setup: wallet balance, contract connectivity, server availability |
| `--help` | `-h` | Display help message with all available options |

### Combining Options

```bash
# Verbose dry-run of streaming scenario
npm start -- --verbose --dry-run --scenario streaming

# Quiet mode with specific scenario
npm start -- -q -s per-request
```

## Demo Scenarios

The demo includes four scenarios that demonstrate different aspects of the x402 payment flow:

### 1. Streaming Mode (`streaming`)
- **Endpoint**: `/api/weather`
- **Price**: 0.0001 MNEE/second
- **Behavior**: Creates a payment stream that flows tokens over time
- **Use Case**: Long-running API access, continuous data feeds

### 2. Per-Request Mode (`per-request`)
- **Endpoint**: `/api/premium`
- **Price**: 0.01 MNEE per request
- **Behavior**: Makes a direct payment for each API request
- **Use Case**: One-time API calls, premium content access

### 3. Stream Reuse (`stream-reuse`)
- **Endpoint**: `/api/weather` (same as streaming)
- **Behavior**: Demonstrates reusing an existing stream for subsequent requests
- **Use Case**: Efficient multi-request workflows to the same service

### 4. Budget Exceeded (`budget-exceeded`)
- **Endpoint**: `/api/expensive`
- **Price**: 1000 MNEE (exceeds typical budget)
- **Behavior**: Agent declines payment due to budget limits
- **Use Case**: Demonstrates autonomous budget enforcement

## Expected Output

### Successful Run

```
🤖 FlowPay Agent Demo
   CLI-first demonstration of AI agents making autonomous payments

✅ Environment validated successfully

┌──────────────────────────────────────────────────────────────┐
│ Agent Information                                            │
├──────────────────────────────────────────────────────────────┤
│ Name: FlowPay Demo Agent                                     │
│ Wallet: 0x1234...5678                                        │
│ MNEE Balance: 100.0 MNEE                                     │
│ Daily Budget: 10.0 MNEE                                      │
│ Remaining Budget: 10.0 MNEE                                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Scenario: streaming                                          │
├──────────────────────────────────────────────────────────────┤
│ Weather API with streaming payments (0.0001 MNEE/second)     │
└──────────────────────────────────────────────────────────────┘

📡 Making request to http://localhost:3001/api/weather
⚠️  Received 402 Payment Required
💳 Creating payment stream...
   Transaction: https://explorer.cronos.org/testnet/tx/0xabc...
✅ Stream created: ID 12345
📡 Retrying request with payment proof...
✅ Request successful!

────────────────────────────────────────────────────────────────

════════════════════════════════════════════════════════════════
                    DEMO SUMMARY
════════════════════════════════════════════════════════════════

┌─────────────────┬────────┐
│ Scenarios Run   │ 4      │
│ Scenarios Passed│ 3      │
│ Pass Rate       │ 75.0%  │
│ Total Payments  │ 2      │
│ Total Spent     │ 0.0101 │
│ Streams Created │ 1      │
│ Streams Reused  │ 1      │
└─────────────────┴────────┘

════════════════════════════════════════════════════════════════
```

### Dry-Run Mode Output

```
🤖 FlowPay Agent Demo
   CLI-first demonstration of AI agents making autonomous payments

⚠️  🔸 DRY-RUN MODE: No real blockchain transactions will be made
   Mock stream IDs and transaction hashes will be generated

┌──────────────────────────────────────────────────────────────┐
│ Agent Information                                            │
├──────────────────────────────────────────────────────────────┤
│ Name: FlowPay Demo Agent                                     │
│ Wallet: 0x1234...5678                                        │
│ MNEE Balance: 0.0 MNEE (dry-run)                             │
│ Daily Budget: 10.0 MNEE                                      │
│ Remaining Budget: 10.0 MNEE                                  │
│                                                              │
│ ⚠️  DRY-RUN MODE - No real transactions                      │
└──────────────────────────────────────────────────────────────┘
```

### Setup Check Output

```bash
$ npm run check

🤖 FlowPay Agent Demo
📡 Running setup check...

┌──────────────────────────────────────────────────────────────┐
│ Setup Check Results                                          │
├──────────────────────────────────────────────────────────────┤
│ ✅ Wallet Connected: 0x1234...5678                           │
│ ✅ MNEE Balance: 100.0 MNEE                                  │
│ ✅ FlowPay Contract: Accessible                              │
│ ✅ Server: Reachable at http://localhost:3001                │
└──────────────────────────────────────────────────────────────┘

✅ All checks passed! Ready to run demo.
```

## Visual Indicators

The CLI uses emoji indicators to clearly show each step of the payment flow:

| Emoji | Meaning |
|-------|---------|
| 🤖 | Agent action (initialization, decisions) |
| 📡 | HTTP request being made |
| ⚠️ | Warning or 402 Payment Required response |
| 💳 | Payment action (stream creation, direct payment) |
| ✅ | Success |
| ❌ | Error |

## Architecture

```
demo/agent-demo/
├── index.ts          # CLI entry point with commander.js
├── config.ts         # Environment configuration loader
├── PaymentAgent.ts   # Agent with wallet and budget management
├── CLIOutput.ts      # Rich terminal output formatting
├── DemoRunner.ts     # Scenario orchestration
├── x402Protocol.ts   # x402 header parsing and proof building
├── scenarios.ts      # Demo scenario definitions
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## Prerequisites

Before running the demo, ensure you have:

1. **Node.js** (v18 or later)
2. **TCRO** in your wallet (for gas fees on Cronos Testnet)
3. **MNEE tokens** on Cronos Testnet (for payments)
4. **x402 Server** running locally (see `server/` directory)

### Getting TCRO

Use the Cronos faucet:
- [Cronos Testnet Faucet](https://cronos.org/faucet)

### Getting MNEE Tokens

The MockMNEE contract on Cronos Testnet allows minting test tokens. Contact the FlowPay team or use the contract's mint function if available.

## Troubleshooting

### Missing Environment Variables

```
❌ Environment Validation Failed

Missing required environment variables:
  ✗ PRIVATE_KEY
  ✗ CRONOS_RPC_URL

See .env.example for reference configuration.
```

**Solution**: Create a `.env` file with all required variables.

### Insufficient Balance

```
❌ Insufficient balance: need 0.01 MNEE, have 0.0 MNEE
```

**Solution**: Ensure your wallet has MNEE tokens on Cronos Testnet.

### Server Unreachable

```
❌ Server unreachable at http://localhost:3001
```

**Solution**: Start the x402 server:
```bash
cd server
npm install
npm start
```

### Transaction Failed

```
❌ Transaction failed: insufficient funds for gas
```

**Solution**: Ensure your wallet has TCRO for gas fees on Cronos Testnet.

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode (with ts-node)
npm run dev

# Run with specific options
npm run dev -- --verbose --dry-run
```

## Related Documentation

- [FlowPay SDK Documentation](../../docs/sdk/README.md)
- [x402 Protocol Architecture](../../docs/architecture/x402-protocol.md)
- [FlowPayStream Contract](../../docs/contracts/flowpaystream.md)
- [Deployment Guide](../../docs/deployment/README.md)

## License

ISC
