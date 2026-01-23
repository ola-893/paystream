# 💰 FlowPay: x402 + Streaming Payments for AI Agents

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TCRO](https://img.shields.io/badge/Powered%20by-TCRO%20Native-green.svg)
![x402](https://img.shields.io/badge/x402-Compatible-purple.svg)
![Cronos](https://img.shields.io/badge/Network-Cronos%20Testnet-blue.svg)

> **🔄 Network Migration Notice**  
> FlowPay has migrated from Ethereum Sepolia to Cronos Testnet for lower fees and faster transactions. If you're upgrading from a previous version, please see the [**Cronos Migration Guide**](CRONOS_MIGRATION.md) for detailed instructions on updating your environment, deploying contracts, and configuring MetaMask.

FlowPay combines **x402's HTTP-native service discovery** with **continuous payment streaming** for AI agents using native TCRO tokens. The best of both worlds: standardized discovery + efficient streaming.

**🏆 Built for the TCRO Migration: Native Token Payments for Agents, Commerce, and Automated Finance**

---

## 📺 Live Demo & Video

| Resource | Link |
|----------|------|
| **Live dApp** | https://flowpay-dashboard.netlify.app |
| **Demo Video** | [Watch on YouTube](https://youtu.be/d2uZi4Agi1o?si=MKlDp4BQpHHnh5d6) |
| **GitHub Repo** | https://github.com/ola-893/flowpay |
| **TCRO Contract (Mainnet)** | Native TCRO - No contract needed |

---

## 🏁 Quick Start (5 Minutes)

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension

### Step 1: Clone & Install

```bash
git clone https://github.com/ola-893/flowpay.git
cd flowpay
npm run install:all
```

### Step 2: Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Step 3: Connect & Test

1. **Add Cronos Testnet to MetaMask** (if not already added):
   - Network: Cronos Testnet
   - RPC: `https://evm-t3.cronos.org`
   - Chain ID: `338`

2. **Get TCRO** for gas fees:
   - [Cronos Faucet](https://cronos.org/faucet)

3. **Connect wallet** and get TCRO from the faucet for native token payments

4. **Create a stream** and watch payments flow in real-time!

That's it! The contracts are already deployed on Cronos Testnet - no deployment needed.

---

## 📋 Deployed Contracts (Cronos Testnet)

| Contract | Address |
| FlowPayStream | `TBD - Deploy yourself` |

---

## �  Advanced Setup

### Environment Variables (Optional)

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Only needed if deploying your own contracts
CRONOS_RPC_URL="https://evm-t3.cronos.org"
PRIVATE_KEY="YOUR_DEPLOYER_PRIVATE_KEY"

# AI Features (Optional)
GEMINI_API_KEY="your_gemini_api_key"
```

### Deploy Your Own Contracts

```bash
npm run deploy:cronos
```

This will deploy the FlowPayStream contract to Cronos Testnet for native TCRO payments.

### Run Tests

```bash
npm test                    # Run all tests
npm run test:contracts      # Smart contract tests only
npm run test:sdk           # SDK tests only
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build:web` | Build for production |
| `npm run test` | Run all tests |
| `npm run deploy:cronos` | Deploy contracts to Cronos Testnet |
| `npm run demo:provider` | Run provider demo |
| `npm run demo:consumer` | Run consumer demo |
| `npm run demo:agent` | Run AI agent demo |

---

## 🔄 The Hybrid Approach: x402 Discovery + TCRO Streaming

### Why Both?

| Approach | Best For | Limitation |
|----------|----------|------------|
| **x402 Per-Request** | Few API calls | Payment overhead per request |
| **Streaming** | High-volume usage | Requires upfront deposit |
| **FlowPay Hybrid** | **Any usage pattern** | **None - best of both!** |

### How It Works

```
1. Agent makes HTTP request to API
2. Server returns HTTP 402 with x402-compatible payment requirements
3. FlowPay SDK parses requirements, uses Gemini AI to decide:
   - Few requests expected? → Use x402 per-request mode
   - Many requests expected? → Create TCRO payment stream
4. Agent pays and accesses service
5. AI continuously optimizes payment mode based on actual usage
```

---

## 🤖 The AI Agent Payment Problem

**The Challenge:** AI agents need to make thousands of micropayments per second for:
- API calls ($0.0001 per call)
- Compute resources ($0.01/second)
- Data feeds ($0.001/second)
- Content consumption (per-token pricing)

**Traditional Solutions Fail:**
- ❌ Discrete transactions: Too expensive (gas fees exceed payment value)
- ❌ Batching: Creates settlement delays (30+ seconds)
- ❌ Off-chain solutions: Requires trusted intermediaries

**FlowPay Solution:**
- ✅ x402 discovery: Standard HTTP 402 for universal agent interoperability
- ✅ Streaming payments: Efficient for high-volume usage
- ✅ TCRO native: Sub-cent fees + instant settlement
- ✅ AI-powered: Gemini decides optimal payment mode

---

## 🚀 Key Features

### x402-Compatible Service Discovery
- **HTTP 402 responses** - Standard payment required responses
- **Universal interoperability** - Works with any x402-compatible agent
- **Payment requirements** - Clear pricing in response headers
- **Flexible modes** - Support both per-request and streaming

### Efficient TCRO Payment Streaming
- **Per-second value transfer** - Money flows continuously for high-volume usage
- **Instant withdrawals** - Recipients claim funds anytime
- **Live balance counters** - Watch payments stream in real-time
- **Micropayment support** - Rates as low as $0.0001/second

### x402 Express Middleware
```javascript
// Add payment requirements to any Express endpoint
app.use(flowPayMiddleware({
    endpoints: {
        "GET /api/weather": {
            price: "0.0001",
            mode: "streaming",  // or "per-request"
            minDeposit: "1.00",
            description: "Real-time weather data"
        }
    }
}));
```

### AI Agent SDK with x402 Support
- **Automatic 402 handling** - SDK parses payment requirements automatically
- **Smart mode selection** - Gemini AI chooses streaming vs per-request
- **Auto-discovery** - Agents find and connect to services via HTTP 402
- **Budget management** - Spending limits and safety controls

### Intelligent Decision Making (Gemini AI)
- **Payment mode optimization** - AI recommends streaming vs per-request
- **Spending analysis** - Analyzes usage and recommends adjustments
- **Service quality evaluation** - Automatically switch providers
- **Natural language queries** - Ask your agent about payment status

### Human Oversight Dashboard
- **Real-time monitoring** - See all active streams with live updates
- **x402 discovery logs** - Track payment requirement responses
- **Agent console** - Configure and test AI agents
- **Emergency controls** - Pause or cancel streams instantly

---

## 🎯 Use Cases

### 1. x402 Service Discovery + Streaming
```javascript
import { FlowPayAgent } from 'flowpay-sdk';

const agent = new FlowPayAgent({
  privateKey: process.env.AGENT_PRIVATE_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY
});

// SDK automatically handles x402 flow:
// 1. Makes request → receives HTTP 402
// 2. Parses payment requirements
// 3. AI decides: streaming (high volume) or per-request (low volume)
// 4. Creates TCRO stream if streaming mode
// 5. Retries request with payment proof
const weather = await agent.fetch('https://api.weather-agent.com/forecast');
console.log(await weather.json());
```

### 2. Provider with x402 Middleware
```javascript
import express from 'express';
import { flowPayMiddleware } from 'flowpay-sdk';

const app = express();

// One line to add payment requirements!
app.use(flowPayMiddleware({
    endpoints: {
        "GET /api/weather": {
            price: "0.0001",
            mode: "streaming",
            minDeposit: "1.00",
            description: "Weather data API"
        },
        "POST /api/translate": {
            price: "0.001",
            mode: "per-request",
            description: "Translation service"
        }
    },
    tcroAddress: process.env.TCRO_ADDRESS,
    flowPayContract: process.env.FLOWPAY_CONTRACT
}));

app.get('/api/weather', (req, res) => {
    // Only reached if payment verified!
    res.json({ temp: 28, city: 'Lagos' });
});
```

### 3. AI-Powered Payment Mode Selection
```javascript
// Gemini analyzes usage and recommends optimal mode
const agent = new FlowPayAgent({
  geminiApiKey: process.env.GEMINI_API_KEY,
  dailyBudget: '50.00'
});

// First request: AI analyzes expected usage
// "I expect to make 1000 API calls" → Streaming mode (more efficient)
// "I need just one translation" → Per-request mode (simpler)

const recommendation = await agent.recommendPaymentMode({
  service: 'weather-api',
  expectedCalls: 1000,
  duration: '1 hour'
});

console.log(recommendation);
// { mode: 'streaming', reason: 'High volume usage - streaming saves 90% on gas' }
```

### 4. GPU Compute with Streaming
```javascript
// Rent GPU resources with real-time payment
const computeStream = await agent.createStream({
  recipient: gpuProviderAddress,
  ratePerSecond: '0.01', // $36/hour
  deposit: '36.00',      // 1 hour prepaid
  metadata: { purpose: 'ML training' }
});

// Cancel early? Get unused funds back automatically
await computeStream.cancel(); // Refunds remaining deposit
```

---

## 💡 Why x402 + TCRO Streaming?

| Feature | x402 Only | Streaming Only | FlowPay Hybrid |
|---------|-----------|----------------|----------------|
| Discovery | ✅ Standard HTTP 402 | ❌ Custom | ✅ Standard HTTP 402 |
| Low-volume efficiency | ✅ Pay per request | ❌ Deposit overhead | ✅ Per-request mode |
| High-volume efficiency | ❌ Gas per request | ✅ One stream | ✅ Streaming mode |
| AI optimization | ❌ | ❌ | ✅ Gemini selects mode |
| Interoperability | ✅ x402 ecosystem | ❌ Custom | ✅ x402 compatible |
| TCRO native | ❌ Generic | ✅ | ✅ |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FlowPay Hybrid Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         HTTP Request          ┌────────────┐ │
│  │   Consumer   │ ─────────────────────────────▶│  Provider  │ │
│  │    Agent     │                               │    API     │ │
│  └──────┬───────┘                               └─────┬──────┘ │
│         │                                             │        │
│         │ ◀─────── HTTP 402 Payment Required ─────────┘        │
│         │          (x402 compatible headers)                    │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FlowPay SDK                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │ x402 Parser │  │ Gemini AI   │  │ Payment Manager │  │  │
│  │  │             │  │ Mode Select │  │ Stream/Request  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐              │
│         │                   │                   │              │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐       │
│  │   FlowPay   │    │    TCRO     │    │    Web      │       │
│  │  Contract   │◀──▶│   Native    │    │  Dashboard  │       │
│  │  (Streams)  │    │  (Native)   │    │ (Oversight) │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│                                                                  │
│                    Cronos Testnet                                │
└─────────────────────────────────────────────────────────────────┘
```

### x402 Payment Flow

```
Consumer Agent                Provider API                FlowPay Contract
      │                            │                            │
      │──── GET /api/weather ─────▶│                            │
      │                            │                            │
      │◀─── 402 Payment Required ──│                            │
      │     X-Payment-Required:    │                            │
      │     X-FlowPay-Mode: stream │                            │
      │     X-FlowPay-Rate: 0.0001 │                            │
      │                            │                            │
      │ [SDK parses, AI decides]   │                            │
      │                            │                            │
      │────────── createStream ────────────────────────────────▶│
      │◀───────── Stream #1234 ─────────────────────────────────│
      │                            │                            │
      │── GET /api/weather ───────▶│                            │
      │   X-FlowPay-Stream: 1234   │                            │
      │                            │── verify stream ──────────▶│
      │                            │◀─ balance OK ──────────────│
      │◀─── 200 OK + Data ─────────│                            │
      │                            │                            │
```

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Blockchain | Cronos Testnet |
| Token | TCRO Native Token |
| Discovery Protocol | x402 (HTTP 402 standard) |
| Smart Contracts | Solidity, Hardhat |
| Agent SDK | TypeScript |
| Server Middleware | Express.js |
| AI Integration | Google Gemini API |
| Frontend | React (Vite), JavaScript |
| Blockchain Interaction | Ethers.js v6 |
| Styling | Tailwind CSS |

---

## 🔄 Mainnet Migration

When ready for production with real TCRO:

| Feature | Testnet (Cronos) | Mainnet |
|---------|-------------------|---------|
| Token | TCRO (testnet faucet) | Real TCRO |
| Network | Cronos Testnet (338) | Cronos Mainnet (25) |
| Gas | Free testnet TCRO | Real TCRO |

**TCRO Mainnet:** Native token - no contract address needed

Update `vite-project/src/contactInfo.js` with mainnet addresses and deploy FlowPayStream to mainnet.

---

## 🤖 Agent SDK Usage

### Basic Stream Creation

```javascript
import { FlowPayAgent } from 'flowpay-sdk';

const agent = new FlowPayAgent({
  privateKey: process.env.AGENT_PRIVATE_KEY,
  network: 'cronos_testnet'
});

// Create a payment stream
const stream = await agent.createStream({
  recipient: '0x1234...5678',
  ratePerSecond: '0.0001',
  deposit: '10.00',
  metadata: {
    agentId: 'weather_bot_01',
    purpose: 'API Metering'
  }
});

console.log(`Stream #${stream.id} created!`);
```

### AI-Powered Agent

```javascript
import { FlowPayAgent } from 'flowpay-sdk';

const agent = new FlowPayAgent({
  privateKey: process.env.AGENT_PRIVATE_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  dailyBudget: '50.00'
});

// Let AI optimize your spending
const decision = await agent.optimizeSpending();
console.log(`AI Decision: ${decision.action}`);
console.log(`Reasoning: ${decision.reasoning}`);

// Natural language queries
const response = await agent.ask("Should I subscribe to the translation API?");
console.log(response);
```

---

## 📊 Demo Scenario

**Watch two AI agents transact autonomously:**

1. **Agent Alice** (Consumer) needs weather data
2. **Agent Bob** (Provider) offers weather API at $0.0001/call
3. Alice opens a FlowPay stream to Bob
4. Alice makes 1,000 API calls over 10 minutes
5. Bob's balance increases in real-time: $0.00 → $0.10
6. Bob withdraws earnings anytime
7. Alice cancels stream when done, gets unused deposit back

**All payments happen automatically, no human intervention!**

---

## 🔒 Security Features

- **Spending Limits**: Daily and per-stream caps
- **Emergency Pause**: Instantly stop all agent activity
- **Auto-cancellation**: Streams cancel when services fail
- **Suspicious Activity Detection**: AI monitors for anomalies
- **Human Override**: Dashboard controls for manual intervention

---

## 📁 Project Structure

```
flowpay/
├── contracts/
│   ├── FlowPayStream.sol      # TCRO streaming contract
├── scripts/
│   └── deploy.js              # Deployment script
├── sdk/
│   └── src/
│       ├── FlowPaySDK.ts      # Agent SDK with x402 handling
│       ├── GeminiPaymentBrain.ts  # AI payment decisions
│       └── SpendingMonitor.ts # Budget management
├── server/
│   └── middleware/
│       └── flowPayMiddleware.js  # x402 Express middleware
├── demo/
│   ├── consumer.ts            # AI agent demo (consumer)
│   └── provider.ts            # API provider demo
├── vite-project/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Dashboard, Streams, Docs
│   │   ├── context/           # Wallet context
│   │   └── contactInfo.js     # Contract addresses
│   └── netlify.toml           # Deployment config
├── test/
│   └── FlowPayStream.test.js  # Contract tests
├── hardhat.config.js
├── package.json
├── LICENSE                    # MIT License
└── README.md
```

---

## 🏆 Hackathon Track

**AI & Agent Payments** - Agents or automated systems paying for services or data

### How TCRO is Used

FlowPay uses native TCRO tokens for all streaming payments:
- **Payment Streams**: TCRO tokens are sent directly to the FlowPayStream smart contract and streamed per-second to recipients
- **x402 Protocol**: AI agents pay for API access using TCRO via the x402 HTTP payment negotiation standard
- **Testnet**: Uses native TCRO on Cronos Testnet (get from faucet)
- **Mainnet Ready**: Designed to work with real TCRO on Cronos Mainnet

FlowPay demonstrates:
- ✅ x402-compatible service discovery (HTTP 402 standard)
- ✅ AI agents transacting autonomously with TCRO
- ✅ Hybrid payment modes (per-request + streaming)
- ✅ Intelligent decision-making with Gemini AI
- ✅ Multi-agent service coordination
- ✅ Human oversight and safety controls

### Why FlowPay Stands Out

1. **x402 Compatibility** - Works with the emerging agent payment ecosystem
2. **Streaming Efficiency** - 90% gas savings for high-volume usage
3. **AI-Powered** - Gemini automatically optimizes payment mode
4. **TCRO Native** - Built specifically for TCRO native tokens
5. **Production Ready** - Express middleware for easy integration

---

## 📋 Third-Party Disclosures

| Dependency | Purpose | License |
|------------|---------|---------|
| [Ethers.js](https://docs.ethers.org/) | Blockchain interaction | MIT |
| [React](https://react.dev/) | Frontend framework | MIT |
| [Vite](https://vitejs.dev/) | Build tool | MIT |
| [Tailwind CSS](https://tailwindcss.com/) | Styling | MIT |
| [Hardhat](https://hardhat.org/) | Smart contract development | MIT |
| [Google Gemini API](https://ai.google.dev/) | AI payment decisions | Google API Terms |
| [Axios](https://axios-http.com/) | HTTP client | MIT |

All third-party dependencies are used in accordance with their respective licenses.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [TCRO](https://cronos.org) - Native token powering this project
- [Google Gemini](https://ai.google.dev) - AI decision-making capabilities
- [Ethereum](https://ethereum.org) - Blockchain infrastructure

---

**Built with 💙 for the TCRO Migration**

*Enabling the autonomous economy, one stream at a time.*
