# PayStream

## Inspiration
While **Cronos** offers exceptionally low fees and fast finality, the "N+1 Transaction Problem" remains a fundamental bottleneck for autonomous AI agents. 

If an agent needs to make 10,000 API calls daily, the traditional model forces it to sign and broadcast 10,000 separate transactions. Even with cheap gas, this creates:
1.  **Latency**: Waiting 5-6 seconds for block confirmation on *every* single request paralyzes high-speed AI decision loops.
2.  **Ledger Bloat**: Spamming the chain with thousands of micro-transactions is inefficient and unscalable.
3.  **Variable Costs**: Fees fluctuate with network congestion, making operational costs unpredictable for high-volume agents.

PayStream solves this by combining Cronos's efficiency with payment streaming—enabling agents to transact at the speed of thought, not the speed of blocks.

## What it does
PayStream turns the payment model upside down. Instead of paying per-request, agents open a payment stream — a single on-chain transaction that authorizes continuous value transfer over time.

The efficiency gains on Cronos are massive at scale:
- **Traditional**: 1,000 API calls = 1,000 transactions = ~100+ TCRO in gas & hours of confirmation time.
- **PayStream**: 1,000 API calls = 2 transactions (open + close) = **~1 TCRO in gas** & instant settlement.

## How it works
1. **Agent hits a paywall** (HTTP 402 response)
2. **SDK automatically negotiates** and opens a **TCRO** payment stream on Cronos (1 transaction)
3. **Agent makes unlimited requests** against that stream (0 transactions, 0 latency)
4. **Stream closes when done**, unused funds refund automatically (1 transaction)

## Key Features
- **Cronos Native**: Optimized for Cronos EVM (Chain ID 338), using native **TCRO** for seamless value transfer.
- **Zero-Latency Payments**: Value streams continuously off-chain (cryptographically verified), removing block time waits for API consumption.
- **x402 Compliance**: Standard HTTP 402 "Payment Required" negotiation ensuring interoperability.
- **AI-Powered Optimization**: **Gemini 1.5 Flash** analyzes traffic patterns to recommend the optimal payment mode (Stream vs. Direct).
- **Human Oversight**: Dashboard with real-time spending visibility and emergency stop controls.

## Live Demo & Deployments
- 🌐 **Live Dashboard**: [flowpay-dashboard.netlify.app](https://flowpay-dashboard.netlify.app)
- 💻 **GitHub**: [github.com/ola-893/flowpay](https://github.com/ola-893/flowpay)

### Smart Contracts on Cronos Testnet

| Contract | Address | Explorer |
|----------|---------|----------|
| **PayStreamStream** | `0x62E0EC7483E779DA0fCa9B701872e4af8a0FEd87` | [View on Cronos Explorer](https://explorer.cronos.org/testnet/address/0x62E0EC7483E779DA0fCa9B701872e4af8a0FEd87) |
| **Native Token** | **TCRO** (Gas Token) | N/A |

## How we built it
### Smart Contracts (Solidity on Cronos)
- **PayStreamStream.sol**: The heart of the system. We optimized the streaming logic for the Cronos EVM to ensure minimal gas consumption even for stream lifecycle events.
- **Native Efficiency**: By using native TCRO instead of ERC-20 tokens, we removed the need for `approve()` transactions—simplifying the UX and further reducing gas costs.

### SDK (TypeScript)
- **PayStreamSDK**: Abstract complex blockchain interactions. A developer simply calls `agent.fetch(url)` and the SDK handles x402 negotiation, signing, and stream management.
- **GeminiPaymentBrain**: We integrated **Gemini 1.5 Flash** to give agents financial intelligence, allowing them to predict costs and choose the most efficient payment method dynamically.

### Server Middleware
- **x402-Express**: Middleware that sits in front of any API, protecting routes and validating incoming Cronos payment streams in real-time.

## Architecture
Agent → API Request → 402 Response → SDK Negotiates → 
Open Stream on Cronos (1 tx) → Unlimited Requests (0 tx, Instant) → 
Close Stream (1 tx) → Refund Unused

## Challenges we ran into
- **Cronos Migration**: Moving from Sepolia to Cronos involved architectural changes to support native TCRO value transfers (`msg.value`) versus the previous ERC-20 `transferFrom` pattern. This simplified the contract but required SDK rewrites.
- **Time Synchronization**: Calculating continuous payments requires precise time-sync between the blockchain (block.timestamp) and the off-chain application state to ensure every second is paid for accurately.
- **AI Latency**: We initially used larger models which slowed down the decision process. Switching to **Gemini 1.5 Flash** reduced decision latency to milliseconds, matching Cronos's speed.

## Accomplishments we're proud of
- **Cronos Native**: A fully functional payment streaming protocol live on Cronos Testnet.
- **>99% Gas & Latency Reduction**: Proving that streams are superior to direct payments for high-frequency agent commerce.
- **Frictionless UX**: By removing ERC-20 approvals and using native tokens, agents can start paying instantly.

## What's next for PayStream
- **Cronos Mainnet**: Deploying to production constraints.
- **Inter-Agent Economy**: Standardizing the x402 protocol so any agent on Cronos can sell services to any other agent permissionlessly.
- **Prediction Markets for Streams**: Using AI to trade streaming rights based on future service demand.


## Team
We are a team of developers, AI specialists, and full-stack engineers with proven experience building decentralized platforms and dApps. Our expertise spans smart contract development, AI-driven automation, DeFi protocols, and cross-chain integrations. Alongside our technical strength, we bring marketing and product strategy skills to scale PayStream into a global payment standard for the autonomous agent economy.

## Built With
- **Blockchain**: Cronos Testnet, Solidity, Hardhat
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, TailwindCSS
- **AI**: Google Gemini API (1.5 Flash)
- **Tokens**: TCRO (Native)
- **Protocol**: x402 (HTTP 402 Payment Required)

## Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Smart Contracts](docs/contracts.md)
- [SDK Reference](docs/sdk.md)
- [Deployment Guide](docs/deployment.md)
