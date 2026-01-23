# PayStream Demo Script

**Title**: PayStream - Real-Time TCRO Payment Streaming for AI Agents
**Network**: Cronos Testnet (Real Blockchain Transactions)

---

## Prerequisites

1. **Environment Setup**: Ensure `.env` has:
   ```
   PRIVATE_KEY_1=your_private_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   cd sdk && npm install && cd ..
   ```

3. **Get Test TCRO Tokens**: Get TCRO from the Cronos testnet faucet at https://cronos.org/faucet

---

## Running the Demo

### Step 1: Start the Provider (Terminal 1)

```bash
npx ts-node demo/provider.ts
```

**Expected Output**:
```
🔧 Provider Configuration:
   PayStreamStream Contract: 0x62E0EC7483E779DA0fCa9B701872e4af8a0FEd87
   RPC URL: https://evm-t3.cronos.org

🚀 PayStream Demo Provider running on http://localhost:3005

📋 Available Endpoints:
   GET /health          - Health check (free)
   GET /api/info        - API info (free)
   GET /api/premium     - Premium content (0.0001 TCRO/sec)
   GET /api/ai-insight  - AI insights (0.001 TCRO/sec)
```

The provider is now a "gatekeeper" that requires TCRO payment streams for premium content.

---

### Step 2: Run the Consumer Agent (Terminal 2)

```bash
npx ts-node demo/consumer.ts
```

**What Happens (Real Blockchain)**:

1. **Wallet Connection**: Agent connects to Cronos Testnet with `PRIVATE_KEY_1`
2. **Balance Check**: Verifies TCRO balance
3. **x402 Flow**:
   - Agent requests `/api/premium`
   - Provider returns `402 Payment Required` with requirements
   - SDK reads payment headers (rate, contract address)
   - Gemini AI decides: stream vs direct payment
   - SDK creates payment stream on-chain with TCRO
   - SDK creates payment stream on-chain
   - SDK retries request with stream ID
   - Provider validates stream and returns content
4. **Stream Reuse**: Subsequent requests reuse the same stream (no new transactions!)

**Expected Output**:
```
🚀 Starting PayStream Demo Consumer (Real Blockchain Mode)...

📡 Connecting to Cronos testnet...
✅ Agent Wallet: 0x...

--- Checking TCRO Balance ---
💰 Current TCRO Balance: 100.0 TCRO

--- [Step 1] Making Request to http://localhost:3005/api/premium ---
[PayStreamSDK] 402 Payment Required intercepted. Negotiating...
[PayStreamSDK] 🤖 Gemini Analysis: High request volume expected, streaming is more efficient
[PayStreamSDK] Initiating Stream: 0.36 TCRO for 3600s
[PayStreamSDK] Creating stream with TCRO...
[PayStreamSDK] Stream #X created. Retrying request...
✅ REQUEST SUCCESS!
📦 Response: { "success": true, "data": "🌟 This is PREMIUM content..." }

--- [Step 2] Subsequent Requests (Stream Reuse) ---
✅ Request 1: Success (Stream reused - no new transaction!)
✅ Request 2: Success (Stream reused - no new transaction!)
✅ Request 3: Success (Stream reused - no new transaction!)

📊 Efficiency Report:
   Total Requests Made: 4
   Blockchain Transactions: 1
   ⚡ Transactions Saved: 3

💰 Final TCRO Balance: 99.64 TCRO
   Spent: 0.36 TCRO

🎉 Demo Complete!
```

---

## Key Concepts Demonstrated

### 1. x402 Protocol
The provider returns HTTP 402 with payment requirements in headers:
- `X-PayStream-Mode: streaming`
- `X-PayStream-Rate: 0.0001` (TCRO per second)
- `X-PayStream-Contract: 0x62E0EC7483E779DA0fCa9B701872e4af8a0FEd87`

### 2. AI-Powered Payment Decisions
The Gemini AI brain analyzes:
- Expected request volume
- Gas costs vs streaming costs
- Decides optimal payment mode (stream vs direct)

### 3. Stream Efficiency
- **Problem**: Per-request payments = N transactions for N requests
- **Solution**: One stream transaction serves unlimited requests
- **Result**: Massive gas savings for high-frequency API access

### 4. Real Blockchain Transactions
All transactions are real and verifiable on Cronos:
- View on Cronos Explorer: `https://explorer.cronos.org/testnet/address/YOUR_WALLET`
- Contract: `https://explorer.cronos.org/testnet/address/0x155A00fBE3D290a8935ca4Bf5244283685Bb0035`

---

## Contract Addresses (Cronos Testnet)

| Contract | Address |
|----------|---------|
| PayStreamStream | `0x62E0EC7483E779DA0fCa9B701872e4af8a0FEd87` |

---

## Troubleshooting

**"PRIVATE_KEY_1 not found"**: Add your private key to `.env`

**"Connection refused"**: Make sure provider is running first

**"Insufficient TCRO balance"**: Get TCRO from https://cronos.org/faucet

**"Transaction failed"**: Check you have TCRO for gas (get from https://cronos.org/faucet)

---

## Frontend Dashboard

For a visual experience, run the frontend:
```bash
cd vite-project && npm run dev
```

Then open `http://localhost:5173` to:
- View live stream balances
- Create/cancel streams manually
- Monitor AI agent activity
