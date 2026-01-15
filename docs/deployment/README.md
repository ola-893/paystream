# Deployment Overview

FlowPay can be deployed to various EVM-compatible networks.

## Supported Networks

| Network | Status | Chain ID |
|---------|--------|----------|
| Cronos Testnet | ✅ Active | 338 |
| Cronos Mainnet | 🔜 Coming | 25 |

## Current Deployment

**Cronos Testnet:**

| Contract | Address |
|----------|---------|
| MockMNEE | `TBD - Deploy yourself` |
| FlowPayStream | `TBD - Deploy yourself` |

## Deployment Guides

- [Cronos Testnet](cronos-testnet.md) - Development and testing
- [Production Checklist](production.md) - Mainnet preparation

## Quick Deploy

```bash
# Deploy to Cronos Testnet
npm run deploy:cronos

# Or manually
npx hardhat run scripts/deploy.js --network cronos_testnet
```

## Architecture

```
┌─────────────────────────────────────────┐
│           Deployment Stack              │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  MockMNEE   │  │  FlowPayStream  │   │
│  │  (ERC-20)   │──│  (Streaming)    │   │
│  └─────────────┘  └─────────────────┘   │
│         │                 │             │
│         └────────┬────────┘             │
│                  │                      │
│                  ▼                      │
│         ┌───────────────┐               │
│         │    Cronos     │               │
│         │   Network     │               │
│         └───────────────┘               │
│                                         │
└─────────────────────────────────────────┘
```

## Environment Variables

Required for deployment:

```bash
PRIVATE_KEY=0x...          # Deployer wallet
CRONOS_RPC_URL=https://...  # RPC endpoint (default: https://evm-t3.cronos.org)
```

## Post-Deployment

After deploying:

1. **Update frontend** with new addresses
2. **Update SDK** configuration
3. **Test** all functionality
4. **Document** deployment details
