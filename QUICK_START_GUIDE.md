# PayStream Agent Demo - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Get TCRO Tokens
- Visit: https://cronos.org/faucet
- Add Cronos Testnet to your wallet (Chain ID: 338)
- Request testnet TCRO tokens

### 2. Setup Environment
```bash
# Clone and install
git clone <repo-url> && cd paystream
npm run install:all

# Configure environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY
```

### 3. Run Demo
```bash
# Terminal 1: Start server
npm start --prefix server

# Terminal 2: Run agent demo
npm run demo:agent
```

## 📋 Required .env Variables

```env
PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
CRONOS_RPC_URL=https://evm-t3.cronos.org
PAYSTREAM_CONTRACT=0x6aEe6d1564FA029821576055A5420cAac06cF4F3
DAILY_BUDGET=10
SERVER_URL=http://localhost:3001
```

## ✅ Expected Results

- **4/4 scenarios pass** (100% success rate)
- **1 TCRO stream created** (~0.36 TCRO spent)
- **3 stream reuses** (efficient payment flow)
- **Automatic refund** (~0.359 TCRO returned)

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Missing env vars | Check `.env` file has all required variables |
| Insufficient TCRO | Get more from https://cronos.org/faucet |
| Server unreachable | Run `npm start --prefix server` |
| Transaction failed | Check TCRO balance and network connection |

## 🌐 Live Demo

**Web Interface:** https://paystream-cro.netlify.app  
**Explorer:** https://explorer.cronos.org/testnet  
**Faucet:** https://cronos.org/faucet

---

**Need help?** Check the full tutorial in `AGENT_DEMO_TUTORIAL.md`