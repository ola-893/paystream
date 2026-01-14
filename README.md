# PayStream x402 - Agent-Triggered Payments

AI agents with x402 payment capabilities for FlowPay streaming.

## What This Does

Demonstrates the x402 payment protocol flow:

1. **Agent makes HTTP request** to premium API
2. **Receives HTTP 402** with x402 headers (`X-FlowPay-Mode`, `X-FlowPay-Rate`, etc.)
3. **Parses payment requirements** from headers
4. **Triggers payment** (streaming or per-request via FlowPay)
5. **Retries request** with payment proof
6. **Access granted** ✅

## Quick Start

```bash
# Optional: Add Gemini API key
echo "GEMINI_API_KEY=your_key" > .env

# Run the demo
cargo run
```

## Demo Output

```
🚀 PayStream x402 Agent Demo
============================

🤖 Agent weather-bot-abc123 initialized
   ├─ Wallet: 0xABCD...5678
   └─ Budget: 50.00 MNEE

📡 Fetching: https://api.weather-service.com/forecast
⚠️  HTTP 402 Payment Required
   ├─ Recipient: 0x5678...9012
   ├─ Mode: Streaming
   ├─ Rate: 0.0001 MNEE/second
   └─ Min Deposit: 1.00 MNEE

💳 Creating payment stream...
   ├─ Deposit: 1.00 MNEE
   ├─ Rate: 0.0001/sec
   └─ Stream ID: #1000

🔄 Retrying request with payment proof...
✅ HTTP 200 - Service accessed after payment
   Response: {"temperature": 28, "condition": "Sunny", "city": "Lagos"}
```

## x402 Headers

| Header | Description |
|--------|-------------|
| `X-Payment-Required` | Signals 402 payment needed |
| `X-FlowPay-Mode` | `streaming` or `per-request` |
| `X-FlowPay-Rate` | Rate per second (streaming) |
| `X-FlowPay-Recipient` | Payment recipient address |
| `X-FlowPay-MinDeposit` | Minimum deposit (streaming) |
| `X-FlowPay-Amount` | Amount (per-request) |

## Integration with FlowPay

This connects to [FlowPay](https://github.com/ola-893/flowpay) for:
- MNEE stablecoin payments
- Payment streaming contracts
- HTTP 402 middleware

## Project Structure

```
src/
├── main.rs           # Demo scenarios
├── payment_agent.rs  # PaymentAgent - handles x402 flow
├── x402.rs           # x402 protocol parser
└── gemini.rs         # Gemini AI client
```

## License

MIT
