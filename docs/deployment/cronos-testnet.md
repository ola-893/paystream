# Cronos Testnet Deployment

Guide for deploying FlowPay to Cronos testnet.

## Current Deployment

| Contract | Address |
|----------|---------|
| MockMNEE | `TBD - Deploy yourself` |
| FlowPayStream | `TBD - Deploy yourself` |

**Network:** Cronos Testnet (Chain ID: 338)

## Prerequisites

1. **Node.js** v18+
2. **TCRO** for gas fees
3. **Private Key** with TCRO

### Getting TCRO

Free testnet TCRO from faucet:
- https://cronos.org/faucet

## Deployment Steps

### 1. Configure Environment

Create `.env` in project root:

```bash
PRIVATE_KEY=0x...your_private_key
CRONOS_RPC_URL=https://evm-t3.cronos.org
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Deploy

```bash
npx hardhat run scripts/deploy.js --network cronos_testnet
```

**Expected Output:**
```
Deploying contracts with the account: 0x...
Deploying MockMNEE...
MockMNEE deployed to: 0x...
Deploying FlowPayStream with MNEE address: 0x...
FlowPayStream deployed to: 0x...
```

### 5. Update Frontend

Update `vite-project/src/contactInfo.js`:

```javascript
export const contractAddress = "0x..."; // Your FlowPayStream address
export const mneeTokenAddress = "0x..."; // Your MockMNEE address
```

## Network Configuration

### Hardhat Config

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    cronos_testnet: {
      url: process.env.CRONOS_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 338
    }
  }
};
```

### MetaMask Setup

Add Cronos Testnet to MetaMask:
- Network Name: Cronos Testnet
- RPC URL: https://evm-t3.cronos.org
- Chain ID: 338
- Currency Symbol: TCRO
- Explorer: https://explorer.cronos.org/testnet

## Testing Deployment

### Run Contract Tests

```bash
npx hardhat test --network cronos_testnet
```

### Verify via Dashboard

1. Open FlowPay dashboard
2. Connect wallet (Cronos Testnet network)
3. Mint test MNEE tokens
4. Create a test stream
5. Verify on Cronos Explorer

## Troubleshooting

### "Insufficient funds"

Get more TCRO from the faucet: https://cronos.org/faucet

### "Nonce too low"

Reset MetaMask account or wait for pending transactions.

### "Network mismatch"

Switch MetaMask to Cronos Testnet network.

## RPC Endpoints

| Provider | URL |
|----------|-----|
| Public | https://evm-t3.cronos.org |

## Block Explorer

View transactions and contracts:
https://explorer.cronos.org/testnet
