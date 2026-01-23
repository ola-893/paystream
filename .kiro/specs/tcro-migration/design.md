# Design Document: TCRO Migration

## Overview

This design outlines the comprehensive migration from ERC-20 tokens to native TCRO (Cronos testnet tokens) across the entire FlowPay ecosystem. The migration involves updating smart contracts, payment agents, server configurations, documentation, and all supporting infrastructure to use Cronos native currency instead of custom tokens.

The key architectural change is moving from ERC-20 token transfers (which require approvals and token contract interactions) to native ETH-style transfers using Solidity's `payable` functions and `msg.value`.

## Architecture

### Current Architecture (ERC-20 Tokens)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Payment       │    │   ERC-20         │    │  FlowPayStream  │
│   Agent         │───▶│   Token          │───▶│   Contract      │
│                 │    │   Contract       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        │              approve() │              transferFrom()
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ 1. Check Balance│    │ 2. Approve Tokens│    │ 3. Transfer via │
│ 2. Approve      │    │ 3. Wait for TX   │    │    Contract     │
│ 3. Create Stream│    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### New Architecture (Native TCRO)
```
┌─────────────────┐                           ┌─────────────────┐
│   Payment       │                           │  FlowPayStream  │
│   Agent         │──────────────────────────▶│   Contract      │
│                 │        payable            │   (payable)     │
└─────────────────┘                           └─────────────────┘
        │                                             │
        │                msg.value                    │
        │                                             │
        ▼                                             ▼
┌─────────────────┐                           ┌─────────────────┐
│ 1. Check Balance│                           │ 1. Receive TCRO │
│ 2. Send TCRO    │                           │ 2. Create Stream│
│ 3. Create Stream│                           │ 3. Track Balance│
└─────────────────┘                           └─────────────────┘
```

## Components and Interfaces

### 1. Smart Contract Updates

#### FlowPayStream Contract Changes
```solidity
// OLD: ERC-20 based
function createStream(
    address recipient,
    uint256 amount,
    address tokenAddress
) external {
    IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
    // ... stream logic
}

// NEW: Native TCRO based
function createStream(
    address recipient,
    uint256 flowRate
) external payable {
    require(msg.value > 0, "Must send TCRO");
    // ... stream logic using msg.value
}
```

#### Key Contract Interface Changes
- Remove `tokenAddress` parameters from all functions
- Add `payable` modifier to stream creation functions
- Use `msg.value` instead of `transferFrom` calls
- Implement native ETH transfer patterns for refunds
- Update balance tracking to use contract's ETH balance

### 2. Payment Agent Updates

#### Balance Management
```typescript
// OLD: ERC-20 token balance
async getTokenBalance(): Promise<BigNumber> {
    const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, this.signer);
    return await tokenContract.balanceOf(this.address);
}

// NEW: Native TCRO balance
async getTCROBalance(): Promise<BigNumber> {
    return await this.provider.getBalance(this.address);
}
```

#### Stream Creation
```typescript
// OLD: Approve then transfer
async createStream(recipient: string, amount: BigNumber) {
    await this.approveTokens(amount);
    await this.flowPayContract.createStream(recipient, amount, TOKEN_ADDRESS);
}

// NEW: Direct payable call
async createStream(recipient: string, flowRate: BigNumber, deposit: BigNumber) {
    await this.flowPayContract.createStream(recipient, flowRate, {
        value: deposit
    });
}
```

### 3. Server Configuration Updates

#### x402 Header Changes
```javascript
// OLD: Specify token address
'x402-payment-required': JSON.stringify({
    type: 'stream',
    amount: '0.0001',
    token: '0x1234567890123456789012345678901234567890',
    recipient: recipientAddress
})

// NEW: Native TCRO (no token address)
'x402-payment-required': JSON.stringify({
    type: 'stream',
    amount: '0.0001',
    currency: 'TCRO',
    recipient: recipientAddress
})
```

### 4. Frontend Integration Updates

#### Web3 Integration
```typescript
// OLD: Token contract interactions
const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
const balance = await tokenContract.balanceOf(address);

// NEW: Native balance queries
const balance = await provider.getBalance(address);
```

## Data Models

### Stream Data Structure
```typescript
// OLD: Token-based stream
interface Stream {
    id: number;
    sender: string;
    recipient: string;
    tokenAddress: string;  // REMOVE
    tokenAmount: BigNumber; // CHANGE to tcroAmount
    flowRate: BigNumber;
    startTime: number;
    endTime: number;
    isActive: boolean;
}

// NEW: TCRO-based stream
interface Stream {
    id: number;
    sender: string;
    recipient: string;
    tcroAmount: BigNumber;  // Native TCRO amount
    flowRate: BigNumber;    // TCRO per second
    startTime: number;
    endTime: number;
    isActive: boolean;
}
```

### Payment Configuration
```typescript
// OLD: Token configuration
interface PaymentConfig {
    tokenAddress: string;  // REMOVE
    tokenSymbol: string;   // CHANGE to 'TCRO'
    tokenDecimals: number; // CHANGE to 18
    contractAddress: string;
    networkId: number;
}

// NEW: Native TCRO configuration
interface PaymentConfig {
    currency: 'TCRO';
    decimals: 18;
    contractAddress: string;
    networkId: number;
    rpcUrl: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: TCRO Balance Consistency
*For any* payment operation, the sum of all TCRO balances (wallet + contract + recipient) should remain constant before and after the transaction, accounting only for gas fees.
**Validates: Requirements 2.2, 3.1**

### Property 2: Native Payment Validation
*For any* stream creation, the contract should receive exactly the TCRO amount sent via msg.value, with no token contract interactions.
**Validates: Requirements 2.1, 2.2**

### Property 3: Stream Lifecycle Preservation
*For any* existing stream functionality (create, use, cancel, refund), the behavior should remain identical when using TCRO instead of ERC-20 tokens.
**Validates: Requirements 9.1, 9.2**

### Property 4: Documentation Consistency
*For any* documentation file or code comment, references to legacy tokens should be completely absent after migration.
**Validates: Requirements 1.3, 5.1**

### Property 5: Environment Configuration Completeness
*For any* environment configuration, legacy token addresses should be absent and TCRO-specific settings should be present and valid.
**Validates: Requirements 1.4, 8.2**

### Property 6: Payment Amount Accuracy
*For any* payment calculation, TCRO amounts should use 18 decimal precision and match the expected payment values from the original token system.
**Validates: Requirements 3.3, 4.3**

### Property 7: Contract Function Payability
*For any* contract function that previously required token transfers, it should now be marked as payable and accept TCRO via msg.value.
**Validates: Requirements 2.1, 2.5**

### Property 8: Frontend Display Consistency
*For any* user interface element displaying token information, it should show TCRO amounts and symbols instead of legacy token references.
**Validates: Requirements 6.1, 6.2**

### Property 9: Test Coverage Preservation
*For any* existing test case, equivalent functionality should be tested using TCRO instead of legacy tokens, maintaining the same test coverage.
**Validates: Requirements 7.1, 7.2**

### Property 10: Deployment Script Completeness
*For any* deployment or configuration script, legacy token contract deployments should be removed and TCRO-specific configurations should be added.
**Validates: Requirements 8.1, 8.2**

## Error Handling

### Native Token Specific Errors
- **Insufficient TCRO Balance**: Handle cases where wallet lacks TCRO for payments
- **Gas Estimation Failures**: Account for gas costs when calculating available TCRO
- **Payable Function Reverts**: Handle contract rejections of TCRO transfers
- **Network Connectivity**: Manage Cronos testnet RPC connection issues

### Migration-Specific Error Scenarios
- **Legacy Token References**: Detect and report any remaining legacy token usage
- **Configuration Mismatches**: Validate that all configs use TCRO settings
- **Contract ABI Mismatches**: Ensure contract interfaces match payable functions
- **Balance Calculation Errors**: Handle TCRO decimal precision correctly

## Testing Strategy

### Unit Testing
- Test TCRO balance queries and calculations
- Verify payable function calls with correct msg.value
- Validate error handling for insufficient TCRO scenarios
- Test configuration loading with TCRO-specific settings

### Property-Based Testing
- Generate random TCRO amounts and verify balance consistency
- Test stream creation with various TCRO deposit amounts
- Validate payment flows across different TCRO denominations
- Verify documentation contains no legacy token references

### Integration Testing
- End-to-end payment flows using Cronos testnet TCRO
- Agent-server-contract integration with native tokens
- Frontend wallet connection and TCRO transaction signing
- Cross-component compatibility after migration

### Migration Validation Testing
- Compare pre/post migration functionality
- Verify all legacy token references are removed
- Test deployment scripts create TCRO-compatible systems
- Validate documentation accuracy for TCRO usage