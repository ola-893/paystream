# Implementation Plan: TCRO Migration

## Overview

This implementation plan completes the TCRO migration by updating the remaining components that still reference legacy tokens. Based on the current codebase analysis, the smart contracts, frontend, and deployment scripts are already fully migrated to native TCRO. The remaining work focuses on updating the payment agent, SDK tests, environment cleanup, and documentation.

## Tasks

- [x] 1. Update Smart Contracts for Native TCRO
- [x] 1.1 Modify PayStreamStream contract to use payable functions
  - ✅ Contract uses payable functions with msg.value
  - ✅ No ERC-20 token dependencies
  - ✅ Native TCRO refund mechanisms implemented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.2 Remove legacy token contract deployment
  - ✅ Legacy token contracts removed
  - ✅ Deployment scripts only deploy PayStreamStream
  - ✅ No token contract deployment
  - _Requirements: 8.1_

- [x] 1.3 Update contract tests for TCRO
  - ✅ All tests use native TCRO with { value: amount }
  - ✅ No ERC-20 token mocking
  - ✅ Tests pass for stream creation, withdrawal, cancellation
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 2. Update Payment Agent for TCRO Operations
- [x] 2.1 Replace ERC-20 token interactions with native TCRO balance
  - Remove tokenContract and ERC20_ABI references
  - Replace tokenContract.balanceOf() with provider.getBalance()
  - Update balance display formatting to show TCRO
  - Remove token approval logic completely
  - _Requirements: 3.1, 3.4_

- [x] 2.2 Update payment agent configuration interface
  - Remove tokenAddress field from AgentConfig
  - Update AgentState to use tcroBalance instead of tokenBalance
  - Update error messages to reference TCRO instead of legacy tokens
  - _Requirements: 3.1, 3.3_

- [x] 2.3 Modify stream creation to use payable contract calls
  - Remove token approval steps from createStream
  - Add value parameter to PayStreamStream contract calls
  - Update transaction construction for payable functions
  - _Requirements: 3.2_

- [ ]* 2.4 Write property test for TCRO balance consistency
  - **Property 1: TCRO Balance Consistency**
  - **Validates: Requirements 2.2, 3.1**

- [x] 3. Update SDK Tests for TCRO
- [x] 3.1 Replace legacy token headers with TCRO currency headers
  - Remove X-Token-Address headers from all test files
  - Update currency fields to use 'TCRO' instead of legacy token names
  - Update mock contract calls to reference TCRO amounts
  - _Requirements: 4.1, 4.2_

- [x] 3.2 Update test scenarios and descriptions
  - Change scenario descriptions from legacy tokens to "TCRO"
  - Update spending limit tests to reference TCRO
  - Update mock stream creation to use TCRO amounts
  - _Requirements: 4.3, 7.1_

- [x] 4. Update Frontend for TCRO Integration
- [x] 4.1 Frontend already uses native TCRO balance queries
  - ✅ Uses provider.getBalance() for wallet balance
  - ✅ No ERC-20 token contract interactions
  - ✅ Displays "TCRO Balance" correctly
  - _Requirements: 6.1, 6.4_

- [x] 4.2 UI components display TCRO correctly
  - ✅ Network configuration shows TCRO as native currency
  - ✅ Chain ID correctly set to 338 (Cronos Testnet)
  - ✅ Transaction signing works with TCRO transfers
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 4.3 Remove all MNEE references from StreamCard component
  - Replace "MNEE" text with "TCRO" in display labels
  - Update flow rate display to show "TCRO/sec"
  - Update claimable balance display to show "TCRO"
  - _Requirements: 6.1, 6.2_

- [x] 4.4 Update documentation content to use TCRO
  - Replace all MNEE token references with TCRO in Docs.jsx
  - Remove MockMNEE token documentation section
  - Update user flow descriptions to use native TCRO
  - Remove token minting instructions
  - Update x402 protocol examples to use TCRO currency
  - _Requirements: 5.1, 5.3, 6.1_

- [x] 4.5 Clean up token-related UI components
  - Remove any remaining token approval UI elements
  - Update CreateStreamForm to reflect TCRO-only usage
  - Ensure all amount displays use TCRO labels
  - _Requirements: 6.1, 6.2_

- [x] 4.6 Clean up built frontend files
  - Remove MNEE references from vite-project/dist/ directory
  - Rebuild frontend after MNEE cleanup to ensure clean distribution
  - _Requirements: 6.1, 6.2_

- [x] 5. Environment Variable Cleanup
- [x] 5.1 Remove legacy token variables from .env file
  - Remove legacy token contract and token variables
  - Clean up old Sepolia network references
  - Ensure only CRONOS_RPC_URL and PAYSTREAM_CONTRACT remain
  - _Requirements: 1.4, 8.2_

- [x] 5.2 Update demo agent configuration
  - Remove tokenAddress requirement from config.ts
  - Update error messages in demo scripts
  - Remove legacy token references from CLI output formatting
  - _Requirements: 5.4, 1.4_

- [x] 6. Update Server Configuration (if server exists)
- [x] 6.1 Update server middleware for TCRO headers
  - Remove token address from x402 payment headers
  - Add currency field with 'TCRO' value
  - Update payment proof validation for native TCRO
  - _Requirements: 4.1, 4.2_

- [x]* 6.2 Write unit tests for server TCRO configuration
  - Test x402 headers contain TCRO currency
  - Test payment validation uses TCRO transactions
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Remove Legacy Test Scripts
- [x] 7.1 Delete or update test-stream-creation.js script
  - Remove legacy token contract interactions
  - Update script to work with native TCRO only
  - Remove token minting and approval steps
  - _Requirements: 8.1, 8.3_

- [x] 7.2 Clean up server test files
  - Remove legacy token references from middleware tests
  - Update mock configurations to exclude token addresses
  - _Requirements: 7.1, 7.4_

- [x] 8. Documentation Updates
- [x] 8.1 Update deployment script messages
  - ✅ Deploy script already shows TCRO usage message
  - Verify all console output references TCRO correctly
  - _Requirements: 5.1, 5.2_

- [x] 8.2 Scan and update remaining documentation
  - Search for any remaining legacy token references in README files
  - Update code comments to reference TCRO
  - Ensure setup instructions mention TCRO faucet
  - Remove any remaining MNEE references from project documentation
  - _Requirements: 5.1, 5.3, 5.5_

- [ ]* 8.3 Write property test for documentation consistency
  - **Property 4: Documentation Consistency**
  - **Validates: Requirements 1.3, 5.1**

- [x] 9. Final Integration Testing
- [x] 9.1 Test payment agent with native TCRO
  - Run agent demo scenarios using updated TCRO agent
  - Verify balance queries work with provider.getBalance()
  - Test stream creation without token approvals
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 9.2 Validate complete system integration
  - Test agent → contract flow with native TCRO
  - Verify frontend works with updated agent
  - Ensure no remaining ERC-20 dependencies
  - _Requirements: 9.4, 9.5_

- [ ]* 9.3 Write property test for functionality preservation
  - **Property 3: Stream Lifecycle Preservation**
  - **Validates: Requirements 9.1, 9.2**

- [x] 10. Final Migration Validation
- [x] 10.1 Comprehensive legacy token reference scan
  - Search entire codebase for remaining legacy token strings
  - Update any remaining references to use "TCRO"
  - Verify no legacy token contract addresses remain
  - _Requirements: 1.1, 1.3, 5.1_

- [x] 10.2 Test system initialization without token dependencies
  - Verify system starts without legacy token environment variables
  - Test that all components work with TCRO-only configuration
  - Validate deployment creates fully TCRO-compatible system
  - _Requirements: 1.1, 8.2, 9.5_

- [ ]* 10.3 Write property test for migration completeness
  - **Property 5: Environment Configuration Completeness**
  - **Validates: Requirements 1.1, 1.3, 1.4**

- [x] 11. Final checkpoint - Ensure all tests pass
- Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The migration maintains all existing functionality while using native TCRO
- All legacy token references will be completely removed from the system