# Implementation Plan: Agent-First CLI Demo

## Overview

This implementation plan builds a CLI-first demo showcasing AI agents autonomously triggering payments via x402 protocol and FlowPay. The implementation leverages the existing FlowPaySDK and server middleware, extending them with a polished CLI demo runner.

## Tasks

- [x] 1. Set up demo project structure and dependencies
  - Create `demo/agent-demo/` directory structure
  - Add TypeScript configuration extending root tsconfig
  - Install CLI dependencies: chalk, ora, cli-table3, commander
  - Create entry point `demo/agent-demo/index.ts`
  - _Requirements: 9.1, 9.5_

- [x] 2. Implement environment configuration and validation
  - [x] 2.1 Create config loader from .env file
    - Load PRIVATE_KEY, SEPOLIA_RPC_URL, FLOWPAY_CONTRACT, MNEE_TOKEN
    - Support optional GEMINI_API_KEY, DAILY_BUDGET, SERVER_URL
    - _Requirements: 9.1_
  - [x] 2.2 Implement environment validation with clear error messages
    - Check all required variables on startup
    - Display missing variable names in error output
    - Exit with code 1 if validation fails
    - _Requirements: 9.2_
  - [ ]* 2.3 Write property test for environment validation
    - **Property 18: Environment Validation**
    - **Validates: Requirements 9.2**

- [x] 3. Implement CLI argument parsing and help
  - [x] 3.1 Set up commander.js for CLI argument parsing
    - Add --verbose flag for detailed output
    - Add --quiet flag for minimal output
    - Add --dry-run flag for simulation mode
    - Add --scenario flag for filtering scenarios
    - Add --help flag for usage information
    - _Requirements: 6.8, 9.3, 9.4, 9.5_
  - [ ]* 3.2 Write property test for scenario filtering
    - **Property 17: Scenario Filter Correctness**
    - **Validates: Requirements 9.4**

- [x] 4. Implement CLIOutput manager for rich terminal output
  - [x] 4.1 Create CLIOutput class with emoji indicators
    - Implement agent(), request(), payment(), success(), error(), warning() methods
    - Use chalk for colored output
    - Respect --quiet and --verbose flags
    - _Requirements: 6.1, 6.2, 6.8_
  - [x] 4.2 Implement progress spinner for blockchain transactions
    - Use ora for spinner animation
    - Show transaction status updates
    - _Requirements: 6.4_
  - [x] 4.3 Implement box and table formatting
    - Use cli-table3 for summary tables
    - Implement box() for scenario separation
    - _Requirements: 6.5, 6.7_
  - [x] 4.4 Implement Etherscan link formatting
    - Generate clickable URLs for transaction hashes
    - Format: https://sepolia.etherscan.io/tx/{hash}
    - _Requirements: 6.3_
  - [ ]* 4.5 Write property test for Etherscan URL format
    - **Property 14: Etherscan URL Format**
    - **Validates: Requirements 6.3**

- [x] 5. Implement PaymentAgent class
  - [x] 5.1 Create PaymentAgent with wallet initialization
    - Initialize ethers.Wallet from private key
    - Connect to Sepolia provider
    - Fetch initial MNEE balance
    - _Requirements: 1.1, 1.2_
  - [ ]* 5.2 Write property test for wallet address derivation
    - **Property 1: Wallet Address Derivation**
    - **Validates: Requirements 1.1**
  - [x] 5.3 Implement budget tracking and enforcement
    - Track dailySpent as payments are made
    - Check budget before each payment
    - Refuse payments that exceed budget
    - _Requirements: 1.4, 1.5_
  - [ ]* 5.4 Write property test for budget tracking consistency
    - **Property 2: Budget Tracking Consistency**
    - **Validates: Requirements 1.4**
  - [ ]* 5.5 Write property test for budget enforcement
    - **Property 3: Budget Enforcement**
    - **Validates: Requirements 1.5, 3.4**
  - [x] 5.6 Implement stream caching for reuse
    - Cache active streams by host
    - Reuse cached stream for same host
    - Clear cache when stream expires
    - _Requirements: 4.5_
  - [ ]* 5.7 Write property test for stream reuse
    - **Property 10: Stream Reuse for Same Host**
    - **Validates: Requirements 4.5, 7.3**

- [x] 6. Checkpoint - Verify agent initialization and budget tracking
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement x402 protocol handler
  - [x] 7.1 Create parseX402Headers function
    - Extract all x402 headers from response
    - Return X402Requirement object or null
    - Handle both streaming and per-request modes
    - _Requirements: 2.1, 2.2_
  - [ ]* 7.2 Write property test for 402 header completeness
    - **Property 5: 402 Header Completeness**
    - **Validates: Requirements 2.2**
  - [x] 7.3 Create buildPaymentHeaders function
    - Build headers for stream ID proof
    - Build headers for direct payment proof
    - _Requirements: 5.1, 5.2_
  - [ ]* 7.4 Write property test for retry includes stream ID
    - **Property 12: Retry Includes Stream ID**
    - **Validates: Requirements 5.1, 5.2**

- [x] 8. Implement payment execution flow
  - [x] 8.1 Implement createStream method in PaymentAgent
    - Approve MNEE tokens to FlowPay contract
    - Call createStream with metadata
    - Extract stream ID from StreamCreated event
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 8.2 Write property test for stream metadata completeness
    - **Property 8: Stream Metadata Completeness**
    - **Validates: Requirements 4.3**
  - [ ]* 8.3 Write property test for stream ID extraction
    - **Property 9: Stream ID Extraction from Event**
    - **Validates: Requirements 4.4**
  - [x] 8.4 Implement fetch method with x402 handling
    - Make initial request
    - Handle 402 response by triggering payment
    - Retry with payment proof
    - _Requirements: 5.1, 5.3, 5.4_
  - [x] 8.5 Implement retry logic with attempt limit
    - Track retry attempts
    - Fail gracefully after 3 attempts
    - _Requirements: 5.5_
  - [ ]* 8.6 Write property test for retry limit enforcement
    - **Property 13: Retry Limit Enforcement**
    - **Validates: Requirements 5.5**

- [x] 9. Checkpoint - Verify payment flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Enhance server middleware for demo
  - [x] 10.1 Add X-FlowPay-Recipient header to 402 responses
    - Update flowPayMiddleware to include recipient address
    - Ensure all required x402 headers are present
    - _Requirements: 2.2_
  - [x] 10.2 Add stream verification logging
    - Log stream ID verification attempts
    - Log verification results (active/inactive)
    - _Requirements: 2.3_
  - [ ]* 10.3 Write property test for active stream grants access
    - **Property 6: Active Stream Grants Access**
    - **Validates: Requirements 2.4**
  - [ ]* 10.4 Write property test for inactive stream requires payment
    - **Property 7: Inactive Stream Requires New Payment**
    - **Validates: Requirements 2.5**

- [x] 11. Implement DemoRunner for scenario orchestration
  - [x] 11.1 Create DemoRunner class
    - Accept PaymentAgent and CLIOutput instances
    - Define demo scenarios with different pricing
    - _Requirements: 7.1, 7.2_
  - [x] 11.2 Implement runScenario method
    - Display scenario header with box formatting
    - Execute fetch and display results
    - Track success/failure stats
    - _Requirements: 6.1, 6.5_
  - [x] 11.3 Implement runAll method with summary
    - Run all scenarios (or filtered by --scenario)
    - Display summary table at end
    - _Requirements: 6.7, 7.1_
  - [ ]* 11.4 Write property test for summary totals accuracy
    - **Property 15: Summary Totals Accuracy**
    - **Validates: Requirements 6.7**

- [x] 12. Implement dry-run mode
  - [x] 12.1 Add dry-run flag handling to PaymentAgent
    - Skip actual blockchain transactions in dry-run
    - Generate mock stream IDs and tx hashes
    - Display clear indication of simulation mode
    - _Requirements: 9.3, 9.7_
  - [ ]* 12.2 Write property test for dry-run no transactions
    - **Property 16: Dry-Run No Transactions**
    - **Validates: Requirements 9.3**

- [x] 13. Implement error handling and recovery
  - [x] 13.1 Add try-catch wrappers to scenario execution
    - Catch and log errors without crashing
    - Continue to next scenario on error
    - _Requirements: 8.1, 8.5_
  - [x] 13.2 Implement exponential backoff for retries
    - Base delay of 1 second
    - Double delay on each retry
    - Maximum 3 attempts
    - _Requirements: 8.2_
  - [ ]* 13.3 Write property test for error recovery continuity
    - **Property 19: Error Recovery Continuity**
    - **Validates: Requirements 8.1, 8.5**
  - [ ]* 13.4 Write property test for exponential backoff timing
    - **Property 20: Exponential Backoff Timing**
    - **Validates: Requirements 8.2**
  - [x] 13.5 Add balance check before payments
    - Check MNEE balance before attempting payment
    - Report shortfall if insufficient
    - _Requirements: 8.3_

- [x] 14. Implement setup check command
  - [x] 14.1 Create checkSetup method in DemoRunner
    - Verify wallet has MNEE balance
    - Verify FlowPay contract is accessible
    - Verify server is running and responding
    - _Requirements: 9.6_
  - [x] 14.2 Add --check flag to CLI
    - Run setup check and display results
    - Exit with appropriate code
    - _Requirements: 9.6_

- [x] 15. Create demo scenarios
  - [x] 15.1 Define streaming mode scenario (Weather API)
    - Endpoint: /api/weather
    - Price: 0.0001 MNEE/second
    - Expected: Stream creation and reuse
    - _Requirements: 7.1, 7.2_
  - [x] 15.2 Define per-request mode scenario (Premium API)
    - Endpoint: /api/premium
    - Price: 0.01 MNEE per request
    - Expected: Direct payment
    - _Requirements: 7.1, 7.2_
  - [x] 15.3 Define stream reuse scenario
    - Multiple requests to same endpoint
    - Expected: Single stream, multiple accesses
    - _Requirements: 7.3_
  - [x] 15.4 Define budget exceeded scenario
    - Set low budget, attempt expensive payment
    - Expected: Payment declined
    - _Requirements: 7.5_
  - [ ]* 15.5 Write property test for stream isolation between hosts
    - **Property 11: Stream Isolation Between Hosts**
    - **Validates: Requirements 7.4**

- [x] 16. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.

- [-] 17. Create demo documentation and README
  - [-] 17.1 Update demo/agent-demo/README.md
    - Quick start instructions
    - Environment setup guide
    - CLI usage examples
    - Expected output examples
    - _Requirements: 9.5_

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation builds on existing FlowPaySDK and server middleware

