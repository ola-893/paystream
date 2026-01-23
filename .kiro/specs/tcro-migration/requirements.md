# Requirements Document

## Introduction

This specification outlines the migration from ERC-20 tokens to native TCRO (Cronos testnet token) for all payment operations in the FlowPay system. The goal is to eliminate all mock token dependencies and use the native Cronos testnet currency for a more authentic and production-ready demonstration.

## Glossary

- **TCRO**: Native token of the Cronos testnet blockchain
- **Legacy_Token**: Custom ERC-20 token contract used for testing (to be removed)
- **FlowPayStream**: Smart contract that handles payment streams
- **Payment_Agent**: Agent component that manages wallet and payment operations
- **x402_Server**: HTTP server that handles payment-required responses
- **Demo_System**: Complete demonstration system including CLI and web interfaces

## Requirements

### Requirement 1: Remove Legacy Token Dependencies

**User Story:** As a developer, I want to remove all legacy token dependencies from the system, so that the demo uses only native TCRO tokens.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL NOT reference any legacy token contracts
2. WHEN payment operations are performed THEN they SHALL use native TCRO tokens exclusively
3. WHEN documentation is reviewed THEN it SHALL contain no references to legacy tokens
4. WHEN environment variables are configured THEN they SHALL NOT include legacy token addresses
5. WHEN smart contracts are deployed THEN they SHALL handle native TCRO transfers

### Requirement 2: Update Smart Contract Architecture

**User Story:** As a blockchain developer, I want the FlowPayStream contract to handle native TCRO payments, so that no ERC-20 token approvals are needed.

#### Acceptance Criteria

1. WHEN creating payment streams THEN the contract SHALL accept native TCRO via payable functions
2. WHEN processing stream payments THEN the contract SHALL transfer TCRO directly without token contracts
3. WHEN cancelling streams THEN the contract SHALL refund unused TCRO to the sender
4. WHEN querying stream balances THEN the contract SHALL return TCRO amounts
5. WHEN streams expire THEN remaining TCRO SHALL be automatically refundable

### Requirement 3: Update Payment Agent Logic

**User Story:** As a system architect, I want the Payment Agent to manage TCRO balances and transactions, so that payment operations work with native tokens.

#### Acceptance Criteria

1. WHEN checking wallet balance THEN the agent SHALL query native TCRO balance
2. WHEN creating payment streams THEN the agent SHALL send TCRO value with transactions
3. WHEN calculating payment amounts THEN the agent SHALL use TCRO denominations
4. WHEN displaying balances THEN the agent SHALL show TCRO amounts with proper decimals
5. WHEN validating budgets THEN the agent SHALL compare against TCRO limits

### Requirement 4: Update Server Configuration

**User Story:** As a service operator, I want the x402 server to specify TCRO payment requirements, so that clients know to pay with native tokens.

#### Acceptance Criteria

1. WHEN returning 402 responses THEN the server SHALL specify TCRO as the payment token
2. WHEN validating payment proofs THEN the server SHALL verify TCRO stream transactions
3. WHEN configuring pricing THEN the server SHALL use TCRO denominations
4. WHEN logging payments THEN the server SHALL record TCRO amounts
5. WHEN handling multiple requests THEN the server SHALL consistently require TCRO

### Requirement 5: Update Documentation and Examples

**User Story:** As a developer using the system, I want all documentation to reflect TCRO usage, so that I can properly configure and use the system.

#### Acceptance Criteria

1. WHEN reading README files THEN they SHALL describe TCRO token requirements
2. WHEN following setup instructions THEN they SHALL explain TCRO testnet faucet usage
3. WHEN viewing code examples THEN they SHALL demonstrate TCRO payment flows
4. WHEN checking environment templates THEN they SHALL exclude MNEE token variables
5. WHEN reviewing troubleshooting guides THEN they SHALL address TCRO-specific issues

### Requirement 6: Update Frontend Integration

**User Story:** As a frontend developer, I want the web interface to display and handle TCRO payments, so that users see native token operations.

#### Acceptance Criteria

1. WHEN displaying wallet balances THEN the UI SHALL show TCRO amounts
2. WHEN creating payment streams THEN the UI SHALL prompt for TCRO amounts
3. WHEN showing transaction history THEN the UI SHALL display TCRO transfers
4. WHEN configuring network settings THEN the UI SHALL connect to Cronos testnet
5. WHEN handling payment confirmations THEN the UI SHALL show TCRO transaction details

### Requirement 7: Update Testing Infrastructure

**User Story:** As a QA engineer, I want all tests to use TCRO tokens, so that testing reflects the actual production environment.

#### Acceptance Criteria

1. WHEN running unit tests THEN they SHALL mock TCRO balance operations
2. WHEN executing integration tests THEN they SHALL use Cronos testnet with TCRO
3. WHEN performing property-based tests THEN they SHALL generate TCRO amounts
4. WHEN validating contract tests THEN they SHALL send TCRO to contract functions
5. WHEN checking test fixtures THEN they SHALL contain TCRO addresses and amounts

### Requirement 8: Update Deployment Scripts

**User Story:** As a DevOps engineer, I want deployment scripts to handle TCRO-based contracts, so that deployments work without token dependencies.

#### Acceptance Criteria

1. WHEN deploying contracts THEN scripts SHALL NOT deploy legacy token contracts
2. WHEN configuring environments THEN scripts SHALL set TCRO-specific variables
3. WHEN verifying deployments THEN scripts SHALL check TCRO functionality
4. WHEN updating configurations THEN scripts SHALL remove legacy token references
5. WHEN running health checks THEN scripts SHALL validate TCRO operations

### Requirement 9: Maintain Backward Compatibility

**User Story:** As a system maintainer, I want the migration to preserve existing functionality, so that all features continue to work with TCRO.

#### Acceptance Criteria

1. WHEN agents make payments THEN all existing payment flows SHALL work with TCRO
2. WHEN streams are created THEN they SHALL maintain the same lifecycle with TCRO
3. WHEN APIs are called THEN they SHALL continue to require payments in TCRO
4. WHEN demos are run THEN they SHALL show identical functionality using TCRO
5. WHEN integrations are tested THEN they SHALL work seamlessly with TCRO tokens