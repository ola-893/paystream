# PayStream Agent Demo - Step-by-Step Tutorial

## Overview

This tutorial will guide you through running the PayStream agent demo, which showcases AI agents making autonomous payments using native TCRO tokens on Cronos Testnet. The demo demonstrates the complete x402 payment protocol with streaming payments.

## What You'll See

The demo runs 4 scenarios:
1. **Streaming Payment** - Agent creates a TCRO stream for recurring API access
2. **Per-Request Payment** - Agent reuses existing stream for different API
3. **Stream Reuse** - Agent efficiently reuses stream for subsequent requests
4. **Budget Management** - Agent handles expensive requests within budget limits

## Prerequisites

### 1. System Requirements
- Node.js (v16 or higher)
- npm or yarn package manager
- Terminal/Command line access
- Internet connection

### 2. Cronos Testnet Setup
You'll need:
- A wallet with Cronos Testnet TCRO tokens
- Private key for the wallet (for agent transactions)

## Step-by-Step Instructions

### Step 1: Get Cronos Testnet TCRO Tokens

1. **Get a Wallet**
   - Use MetaMask, Trust Wallet, or any Ethereum-compatible wallet
   - Add Cronos Testnet network:
     - Network Name: Cronos Testnet
     - RPC URL: `https://evm-t3.cronos.org`
     - Chain ID: `338`
     - Currency Symbol: `TCRO`
     - Block Explorer: `https://explorer.cronos.org/testnet`

2. **Get Test TCRO**
   - Visit the Cronos faucet: https://cronos.org/faucet
   - Connect your wallet and request testnet TCRO
   - You'll need at least 1-2 TCRO for the demo

3. **Export Private Key**
   - In MetaMask: Account menu → Account details → Export private key
   - **⚠️ SECURITY WARNING**: Only use testnet wallets, never mainnet keys!
   - Copy the private key (starts with 0x...)

### Step 2: Clone and Setup the Project

```bash
# Clone the repository
git clone <repository-url>
cd paystream

# Install dependencies for all components
npm run install:all
```

### Step 3: Configure Environment Variables

1. **Copy the environment template**
```bash
cp .env.example .env
```

2. **Edit the .env file**
```bash
nano .env  # or use your preferred editor
```

3. **Set these required variables:**
```env
# Your wallet private key (from Step 1)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Cronos Testnet RPC (already configured)
CRONOS_RPC_URL=https://evm-t3.cronos.org

# PayStream contract address (already deployed)
PAYSTREAM_CONTRACT=0x6aEe6d1564FA029821576055A5420cAac06cF4F3

# Agent configuration
DAILY_BUDGET=10
SERVER_URL=http://localhost:3001

# Optional: Gemini API key for AI features (demo works without it)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 4: Verify Your Setup

Run the setup check to ensure everything is configured correctly:

```bash
npm run demo:agent:check
```

You should see:
- ✅ Environment validated successfully
- ✅ Wallet connected: X.XXX TCRO
- ✅ PayStream contract accessible
- ❌ Server unreachable (expected - we'll start it next)

### Step 5: Start the Payment Server

Open a **new terminal window** and start the x402 payment server:

```bash
cd paystream
npm start --prefix server
```

You should see:
```
PayStream Test Server running on port 3001
Contract Address: 0x6aEe6d1564FA029821576055A5420cAac06cF4F3
Recipient Address: 0x1f973bc13Fe975570949b09C022dCCB46944F5ED
Currency: Native TCRO
```

**Keep this terminal open** - the server needs to run during the demo.

### Step 6: Run the Agent Demo

In your **original terminal**, run the agent demo:

```bash
npm run demo:agent
```

## What to Expect

### Demo Initialization
```
🤖 PayStream Agent Demo
   CLI-first demonstration of AI agents making autonomous payments

✅ Environment validated successfully
🤖 Initializing PaymentAgent...

┌────────────────────────────────────────────────────┐
│ Agent Information                                  │
├────────────────────────────────────────────────────┤
│ Name: PayStream Demo Agent                         │
│ Wallet: 0xYOUR_WALLET_ADDRESS                      │
│ TCRO Balance: X.XXX TCRO                           │
│ Daily Budget: 10.0 TCRO                            │
│ Remaining Budget: 10.0 TCRO                        │
└────────────────────────────────────────────────────┘
```

### Scenario Execution

**Scenario 1: Streaming Payment**
- Agent receives 402 Payment Required
- AI decides to create a payment stream
- Creates TCRO stream on Cronos Testnet
- Retries request successfully
- Shows transaction link to Cronos Explorer

**Scenario 2-4: Stream Reuse**
- Agent reuses existing stream
- No new blockchain transactions needed
- Demonstrates efficiency of streaming payments

### Final Results
```
┌─────────────────┬─────────┬─────────┬───────────┬──────────┐
│ Scenario        │ Status  │ Payment │ Stream    │ Duration │
├─────────────────┼─────────┼─────────┼───────────┼──────────┤
│ streaming       │ ✅ Pass │ 💳 Yes  │ 🆕 New    │ ~6000ms  │
│ per-request     │ ✅ Pass │ —       │ ♻️ Reused │ ~600ms   │
│ stream-reuse    │ ✅ Pass │ —       │ ♻️ Reused │ ~500ms   │
│ budget-exceeded │ ✅ Pass │ —       │ ♻️ Reused │ ~1400ms  │
└─────────────────┴─────────┴─────────┴───────────┴──────────┘

════════════════════════════════════════════════════════════
                    DEMO SUMMARY
════════════════════════════════════════════════════════════
│ Scenarios Run    │ 4         │
│ Scenarios Passed │ 4         │
│ Pass Rate        │ 100.0%    │
│ Total Payments   │ 1         │
│ Total Spent      │ 0.36 TCRO │
│ Streams Created  │ 1         │
│ Streams Reused   │ 3         │
```

### Stream Cleanup
The demo automatically cancels streams and refunds unused TCRO:
```
✔ Stream #X cancelled
   Cancellation TX: https://explorer.cronos.org/testnet/tx/0x...
✅ Refunded: ~0.359 TCRO
```

## Understanding the Demo

### Payment Flow
1. **API Request** → Server returns 402 Payment Required
2. **AI Analysis** → Agent decides on payment method (streaming vs direct)
3. **Stream Creation** → Agent creates TCRO payment stream on blockchain
4. **Request Retry** → Original API request succeeds with payment proof
5. **Stream Reuse** → Subsequent requests use existing stream
6. **Cleanup** → Unused funds automatically refunded

### Key Features Demonstrated
- **Native TCRO Payments** - No token approvals needed
- **AI Decision Making** - Smart payment mode selection
- **Stream Efficiency** - One payment enables multiple API calls
- **Automatic Refunds** - Unused TCRO returned to wallet
- **Real Blockchain** - Actual Cronos Testnet transactions

## Troubleshooting

### Common Issues

**"Missing required environment variables"**
- Check your `.env` file has all required variables
- Ensure `PRIVATE_KEY` starts with `0x`
- Verify `CRONOS_RPC_URL` and `PAYSTREAM_CONTRACT` are set

**"Insufficient TCRO balance"**
- Visit https://cronos.org/faucet to get more testnet TCRO
- Ensure you have at least 1 TCRO for the demo

**"Server unreachable"**
- Make sure the server is running: `npm start --prefix server`
- Check that port 3001 is not blocked by firewall
- Verify `SERVER_URL=http://localhost:3001` in `.env`

**"Transaction failed"**
- Check your wallet has enough TCRO for gas fees
- Verify you're connected to Cronos Testnet (Chain ID: 338)
- Try running the demo again (blockchain congestion)

### Getting Help

**Check Setup:**
```bash
npm run demo:agent:check
```

**View Logs:**
- Agent logs show in the demo terminal
- Server logs show in the server terminal
- Blockchain transactions visible on Cronos Explorer

**Test Individual Components:**
```bash
# Test contract deployment
npm run check:deployment

# Test SDK functionality
npm run test:sdk

# Test server middleware
npm test --prefix server
```

## Next Steps

After running the demo successfully:

1. **Explore the Code**
   - Check `demo/agent-demo/` for agent implementation
   - Review `server/` for x402 protocol server
   - Examine `contracts/` for smart contract code

2. **Try the Web Interface**
   - Visit: https://paystream-cro.netlify.app
   - Connect your Cronos Testnet wallet
   - Create streams through the web UI

3. **Build Your Own Agent**
   - Use the PayStream SDK in your applications
   - Implement custom payment logic
   - Deploy to Cronos mainnet for production

## Security Notes

- ⚠️ **Never use mainnet private keys for testing**
- ⚠️ **Only use testnet wallets and tokens**
- ⚠️ **Keep private keys secure and never share them**
- ✅ **All demo transactions are on Cronos Testnet only**

---

**Congratulations!** You've successfully run the PayStream agent demo and seen AI agents making autonomous blockchain payments with native TCRO tokens! 🎉