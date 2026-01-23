# PayStream Documentation

Welcome to PayStream - **The Streaming Extension for x402**.

PayStream is a hybrid payment protocol that solves the N+1 Signature Problem for AI agent payments using native TCRO token streams on Cronos.

## What is PayStream?

PayStream enables AI agents to pay for API services using continuous payment streams instead of individual transactions. This dramatically reduces gas costs and improves efficiency.

### Key Innovation

**2 on-chain transactions** (Open + Close) regardless of request volume.

| Traditional Approach | PayStream Approach |
|---------------------|------------------|
| 100 requests = 100 signatures | 100 requests = 2 signatures |
| High gas costs | 95% gas savings |
| Slow, blocking | Fast, non-blocking |

## Quick Links

- [Getting Started](getting-started/README.md)
- [Architecture](architecture/README.md)
- [Smart Contracts](contracts/README.md)
- [SDK Reference](sdk/README.md)
- [API Reference](api/README.md)
- [Deployment Guide](deployment/README.md)

## Current Deployment (Cronos Testnet)

| Contract | Address |
|----------|---------|
| PayStreamStream | `TBD - Deploy yourself` |

## Features

- ✅ **x402 Protocol Support** - Standard HTTP payment negotiation
- ✅ **TCRO Token Streams** - Continuous payment flows using native TCRO
- ✅ **AI-Powered Decisions** - Gemini AI chooses optimal payment mode
- ✅ **Multi-Agent Support** - Mesh network for agent collaboration
- ✅ **Safety Controls** - Spending limits and emergency stops
- ✅ **Real-time Dashboard** - Monitor streams and analytics

## Community

- [GitHub Repository](https://github.com/your-org/paystream)
- [Discord Community](https://discord.gg/paystream)
- [Twitter](https://twitter.com/paystream)
