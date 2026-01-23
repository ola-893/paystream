# Architecture Overview

PayStream is designed as a modular, extensible payment protocol for AI agents.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PayStream System                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Consumer   │───▶│   Provider   │───▶│  Blockchain  │          │
│  │   Agent      │    │   (x402)     │    │  (Cronos)    │          │
│  │   + SDK      │◀───│              │◀───│              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Gemini     │    │  Dashboard   │    │ PayStreamStream│          │
│  │   AI Brain   │    │   (React)    │    │  (Native)    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Consumer Agent (SDK)

The PayStreamSDK enables AI agents to:
- Detect x402 payment requirements
- Create and manage payment streams
- Make authenticated requests
- Handle payment negotiation automatically

### 2. Provider (Middleware)

The x402 middleware enables API providers to:
- Return 402 Payment Required responses
- Verify stream validity on-chain
- Grant access to paid resources
- Track usage and revenue

### 3. Smart Contracts

On-chain components:
- **PayStreamStream**: Payment streaming contract

### 4. AI Decision Engine

GeminiPaymentBrain provides:
- Intelligent payment mode selection
- Cost optimization
- Risk assessment

## Data Flow

### Request Flow (First Request)

```
1. Agent → Provider: GET /api/premium
2. Provider → Agent: 402 Payment Required + x402 headers
3. Agent → AI Brain: Should I stream or pay directly?
4. AI Brain → Agent: Stream (high volume predicted)
5. Agent → Blockchain: Create stream
6. Agent → Provider: GET /api/premium + X-PayStream-Stream-ID
7. Provider → Blockchain: Verify stream
8. Provider → Agent: 200 OK + data
```

### Request Flow (Subsequent Requests)

```
1. Agent → Provider: GET /api/premium + X-PayStream-Stream-ID
2. Provider → Cache: Check stream validity
3. Provider → Agent: 200 OK + data
```

## Key Design Decisions

### Why Streaming?

| Problem | Traditional | PayStream |
|---------|-------------|---------|
| 100 API calls | 100 signatures | 2 signatures |
| Gas cost | ~$50 | ~$1 |
| Latency | High (wait for tx) | Low (stream exists) |
| UX | Blocking | Non-blocking |

### Why x402?

The HTTP 402 status code was reserved for "Payment Required" but never standardized. PayStream implements a practical x402 protocol:

- Standard HTTP semantics
- Machine-readable payment requirements
- Backward compatible
- Extensible

### Why TCRO?

TCRO (Cronos native token) is used as the payment token:
- Native blockchain currency
- No contract dependencies
- Lower gas costs
- Instant settlement
- Production-ready

## Security Model

### Trust Assumptions

1. **Blockchain**: Trustless verification
2. **Provider**: Trusted to deliver service
3. **Consumer**: Trusted with own funds
4. **AI Brain**: Advisory only, human override available

### Safety Controls

- Spending limits (daily, per-request)
- Emergency stop mechanism
- Stream cancellation
- On-chain verification

## Scalability

### Current Limits

| Metric | Limit |
|--------|-------|
| Streams per agent | Unlimited |
| Requests per stream | Unlimited |
| Concurrent streams | Limited by gas |

### Future Improvements

- L2 deployment (lower gas)
- Batch stream creation
- Off-chain verification with ZK proofs

## Next Steps

- [x402 Protocol Details](x402-protocol.md)
- [Payment Streams](payment-streams.md)
- [AI Decision Engine](ai-decision-engine.md)
# x402 Protocol

PayStream implements the x402 protocol for HTTP-based payment negotiation.

## Overview

The x402 protocol uses HTTP 402 (Payment Required) status code to negotiate payments between consumers and providers.

## Protocol Flow

```
┌──────────┐                    ┌──────────┐
│ Consumer │                    │ Provider │
└────┬─────┘                    └────┬─────┘
     │                               │
     │  1. GET /api/resource         │
     │──────────────────────────────▶│
     │                               │
     │  2. 402 Payment Required      │
     │     + x402 Headers            │
     │◀──────────────────────────────│
     │                               │
     │  3. Process Payment           │
     │  (Create Stream)              │
     │                               │
     │  4. GET /api/resource         │
     │     + Payment Proof           │
     │──────────────────────────────▶│
     │                               │
     │  5. 200 OK + Data             │
     │◀──────────────────────────────│
     │                               │
```

## x402 Headers

### Response Headers (402)

When a provider requires payment, it returns:

```http
HTTP/1.1 402 Payment Required
X-Payment-Required: true
X-Payment-Types: stream,direct
X-Payment-Amount: 0.001
X-Payment-Currency: TCRO
X-Payment-Recipient: 0x1234...
X-Payment-Contract: 0x155A00fBE3D290a8935ca4Bf5244283685Bb0035
X-Payment-Network: cronos-testnet
X-Payment-Description: Premium API access
```

### Request Headers (With Payment)

When consumer has payment proof:

```http
GET /api/resource HTTP/1.1
X-PayStream-Stream-ID: 42
X-PayStream-Signature: 0xabc...
X-PayStream-Timestamp: 1704067200
```

## Header Reference

### Payment Requirement Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-Payment-Required` | Yes | Indicates payment is needed |
| `X-Payment-Types` | Yes | Accepted payment types |
| `X-Payment-Amount` | Yes | Price per request |
| `X-Payment-Currency` | Yes | Token symbol (TCRO) |
| `X-Payment-Recipient` | Yes | Provider's address |
| `X-Payment-Contract` | Yes | PayStreamStream contract |
| `X-Payment-Network` | Yes | Network name |
| `X-Payment-Description` | No | Human-readable description |
| `X-Payment-Min-Duration` | No | Minimum stream duration |
| `X-Payment-Expires` | No | Offer expiration time |

### Payment Proof Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-PayStream-Stream-ID` | Yes* | Active stream ID |
| `X-PayStream-Payment-Hash` | Yes* | Direct payment tx hash |
| `X-PayStream-Signature` | No | Request signature |
| `X-PayStream-Timestamp` | No | Request timestamp |

*One of Stream-ID or Payment-Hash required

## Payment Types

### Stream Payment

Continuous payment flow:

```javascript
// Consumer creates stream
const streamId = await contract.createStream(
  recipient,
  duration,
  amount,
  metadata
);

// Consumer includes stream ID in requests
headers['X-PayStream-Stream-ID'] = streamId;
```

### Direct Payment (Future)

One-time payment:

```javascript
// Consumer sends direct payment
const tx = await provider.sendTransaction({
  to: recipient,
  value: amount
});

// Consumer includes tx hash
headers['X-PayStream-Payment-Hash'] = tx.hash;
```

## Verification

### Provider Verification Flow

```javascript
async function verifyPayment(req) {
  const streamId = req.headers['x-paystream-stream-id'];
  
  if (streamId) {
    // Verify stream on-chain
    const stream = await contract.streams(streamId);
    
    // Check stream is active
    if (!stream.isActive) {
      return { valid: false, reason: 'Stream inactive' };
    }
    
    // Check recipient matches
    if (stream.recipient !== myAddress) {
      return { valid: false, reason: 'Wrong recipient' };
    }
    
    // Check sufficient balance
    const claimable = await contract.getClaimableBalance(streamId);
    if (claimable < pricePerRequest) {
      return { valid: false, reason: 'Insufficient balance' };
    }
    
    return { valid: true, streamId };
  }
  
  return { valid: false, reason: 'No payment proof' };
}
```

## Error Responses

### 402 Payment Required

```json
{
  "error": "Payment Required",
  "code": "PAYMENT_REQUIRED",
  "payment": {
    "types": ["stream", "direct"],
    "amount": "0.001",
    "currency": "TCRO",
    "recipient": "0x...",
    "contract": "0x..."
  }
}
```

### 403 Payment Invalid

```json
{
  "error": "Payment Invalid",
  "code": "INVALID_STREAM",
  "reason": "Stream has expired"
}
```

## Best Practices

### For Consumers

1. Cache stream IDs for reuse
2. Monitor stream balance
3. Create streams with buffer time
4. Handle 402 gracefully

### For Providers

1. Cache verification results
2. Set reasonable prices
3. Provide clear error messages
4. Support multiple payment types

## Next Steps

- [Payment Streams](payment-streams.md)
- [Middleware Reference](../api/middleware.md)
# Payment Streams

Payment streams are the core innovation of PayStream.

## What is a Payment Stream?

A payment stream is a continuous flow of TCRO tokens from sender to recipient over time. Instead of discrete payments, funds "stream" at a constant rate.

## How Streams Work

```
Time ─────────────────────────────────────────▶

     Start                                  Stop
       │                                      │
       ▼                                      ▼
       ┌──────────────────────────────────────┐
       │████████████████████░░░░░░░░░░░░░░░░░░│
       │◀── Streamed ──▶│◀── Remaining ──▶│
       └──────────────────────────────────────┘
                        ▲
                      Now
```

## Stream Lifecycle

### 1. Creation

```javascript
await contract.createStream(
  recipient,    // Who receives funds
  duration,     // How long (seconds)
  amount,       // Total TCRO
  metadata      // JSON metadata
);
```

At creation:
- Tokens transferred from sender to contract
- Stream starts immediately
- Flow rate calculated: `amount / duration`

### 2. Active Streaming

While active:
- Funds accumulate for recipient
- Claimable balance increases per second
- Recipient can withdraw anytime
- Sender can cancel anytime

### 3. Withdrawal

```javascript
await contract.withdrawFromStream(streamId);
```

- Recipient claims accumulated funds
- Tokens transferred from contract to recipient
- Stream continues (if not expired)

### 4. Completion or Cancellation

**Natural Completion:**
- Stream reaches stop time
- All funds claimable by recipient
- Stream marked inactive

**Cancellation:**
- Either party can cancel
- Recipient gets streamed amount
- Sender gets remaining amount

## Flow Rate Calculation

```
flowRate = totalAmount / duration
```

**Example:**
- Amount: 3600 TCRO
- Duration: 3600 seconds (1 hour)
- Flow Rate: 1 TCRO/second

**Claimable at any time:**
```
elapsed = min(now, stopTime) - startTime
streamed = elapsed × flowRate
claimable = streamed - alreadyWithdrawn
```

## Stream States

| State | isActive | Description |
|-------|----------|-------------|
| Active | true | Funds streaming |
| Completed | false | Reached stop time |
| Cancelled | false | Manually cancelled |

## Benefits Over Direct Payments

| Aspect | Direct Payment | Stream Payment |
|--------|---------------|----------------|
| Signatures | 1 per request | 2 total |
| Gas cost | High (N × gas) | Low (2 × gas) |
| Latency | Wait for tx | Instant (after open) |
| Flexibility | None | Cancel anytime |
| Overpayment | Possible | Refundable |

## Use Cases

### API Access

```javascript
// Create stream for 24 hours of API access
await sdk.createStream({
  recipient: apiProvider,
  amount: '100', // 100 TCRO
  duration: 86400 // 24 hours
});

// Make unlimited requests
for (let i = 0; i < 1000; i++) {
  await sdk.request(apiUrl);
}
```

### Subscription Services

```javascript
// Monthly subscription stream
await sdk.createStream({
  recipient: serviceProvider,
  amount: '30', // 30 TCRO
  duration: 2592000 // 30 days
});
```

### Pay-per-Use

```javascript
// Short stream for specific task
await sdk.createStream({
  recipient: computeProvider,
  amount: '5',
  duration: 300 // 5 minutes
});
```

## Best Practices

### For Consumers

1. **Buffer Time**: Create streams slightly longer than needed
2. **Monitor Balance**: Watch for low balance warnings
3. **Reuse Streams**: Check for existing streams before creating new ones
4. **Cancel Unused**: Reclaim funds from unused streams

### For Providers

1. **Verify On-Chain**: Always verify stream validity
2. **Check Balance**: Ensure sufficient claimable balance
3. **Withdraw Regularly**: Don't let funds accumulate too long
4. **Handle Expiry**: Gracefully handle expired streams

## Security Considerations

1. **Locked Funds**: Tokens are locked in contract, not held by either party
2. **No Rug Pull**: Sender can't withdraw recipient's earned funds
3. **Guaranteed Payment**: Recipient always gets streamed amount
4. **Refund Guarantee**: Sender always gets unstreamed amount back
