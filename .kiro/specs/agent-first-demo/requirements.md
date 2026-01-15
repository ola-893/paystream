# Requirements Document

## Introduction

This feature creates a production-ready, CLI-first agent demo that showcases AI agents autonomously triggering and streaming payments via the x402 protocol and FlowPay. The demo eliminates mock/simulated components and demonstrates real agents making real HTTP requests, receiving real 402 responses, and creating real on-chain payment streams. The CLI approach mirrors a typical developer workflow and provides full transparency into every step of the payment flow.

## Glossary

- **Agent**: An autonomous AI entity that can make HTTP requests, evaluate payment requirements, and trigger blockchain payments
- **x402_Protocol**: HTTP-based payment protocol using 402 Payment Required status with FlowPay-specific headers
- **Payment_Stream**: A continuous flow of MNEE tokens from sender to recipient over time via the FlowPayStream contract
- **FlowPay_Contract**: The FlowPayStream smart contract that manages payment streams on Sepolia
- **MNEE**: The stablecoin token used for payments in the FlowPay ecosystem
- **Payment_Proof**: Evidence of payment (stream ID or transaction hash) included in retry requests
- **Service_Provider**: An HTTP server that requires payment via x402 headers before granting access
- **Payment_Agent**: An AI agent with wallet capabilities that can autonomously decide and execute payments
- **CLI_Demo**: A command-line interface demonstration with rich, colorful terminal output showing real-time agent activity

## Requirements

### Requirement 1: Real Agent with Wallet Integration

**User Story:** As a developer, I want to see an AI agent with a real wallet making actual blockchain payments, so that I can understand how autonomous agent payments work in production.

#### Acceptance Criteria

1. WHEN the demo starts, THE Payment_Agent SHALL initialize with a real Ethereum wallet (private key from environment)
2. WHEN the Payment_Agent is initialized, THE System SHALL display the agent's wallet address and MNEE balance
3. WHEN the Payment_Agent needs to make a payment, THE Payment_Agent SHALL sign and submit real transactions to Sepolia
4. THE Payment_Agent SHALL track its spending against a configurable daily budget
5. IF the Payment_Agent exceeds its daily budget, THEN THE Payment_Agent SHALL refuse further payments and log the reason

### Requirement 2: Real x402 Service Provider

**User Story:** As a developer, I want a real HTTP server that returns 402 Payment Required responses with proper x402 headers, so that I can see the complete payment negotiation flow.

#### Acceptance Criteria

1. WHEN a request arrives without payment proof, THE Service_Provider SHALL return HTTP 402 with x402 headers
2. THE Service_Provider SHALL include these headers in 402 responses: X-Payment-Required, X-FlowPay-Mode, X-FlowPay-Rate, X-FlowPay-Recipient, X-FlowPay-Contract, X-FlowPay-MinDeposit
3. WHEN a request includes a valid X-FlowPay-Stream-ID header, THE Service_Provider SHALL verify the stream is active on-chain
4. IF the stream is active and has sufficient balance, THEN THE Service_Provider SHALL return HTTP 200 with the requested data
5. IF the stream is inactive or depleted, THEN THE Service_Provider SHALL return HTTP 402 requesting new payment

### Requirement 3: Autonomous Payment Decision Making

**User Story:** As a developer, I want the agent to autonomously decide whether to pay for a service based on context and budget, so that I can see intelligent payment behavior.

#### Acceptance Criteria

1. WHEN the Payment_Agent receives a 402 response, THE Payment_Agent SHALL evaluate the payment requirement against its budget
2. WHEN evaluating a payment, THE Payment_Agent SHALL consider: current balance, daily spend, service description, and payment amount
3. IF the payment is within budget and deemed valuable, THEN THE Payment_Agent SHALL proceed with payment
4. IF the payment exceeds budget or is deemed not valuable, THEN THE Payment_Agent SHALL decline and log the reason
5. THE Payment_Agent SHALL use AI (Gemini) to make nuanced payment decisions when available

### Requirement 4: Real Payment Stream Creation

**User Story:** As a developer, I want to see actual payment streams created on the blockchain, so that I can verify the end-to-end payment flow works.

#### Acceptance Criteria

1. WHEN the Payment_Agent decides to pay via streaming, THE Payment_Agent SHALL approve MNEE tokens to the FlowPay contract
2. WHEN tokens are approved, THE Payment_Agent SHALL call createStream on the FlowPayStream contract
3. THE Payment_Agent SHALL include metadata in the stream: agent ID, timestamp, service URL, and purpose
4. WHEN the stream is created, THE Payment_Agent SHALL extract the stream ID from the StreamCreated event
5. THE Payment_Agent SHALL cache active stream IDs to reuse for subsequent requests to the same service

### Requirement 5: Request Retry with Payment Proof

**User Story:** As a developer, I want to see the agent retry requests with payment proof after creating a stream, so that I can see the complete x402 flow.

#### Acceptance Criteria

1. WHEN a payment stream is created, THE Payment_Agent SHALL retry the original request with X-FlowPay-Stream-ID header
2. WHEN retrying, THE Payment_Agent SHALL include the stream ID from the successful createStream transaction
3. IF the retry succeeds (HTTP 200), THE Payment_Agent SHALL log success and return the response data
4. IF the retry fails (HTTP 402 again), THE Payment_Agent SHALL log the failure and report the issue
5. THE Payment_Agent SHALL track retry attempts and fail gracefully after 3 attempts

### Requirement 6: Rich CLI Output and Visualization

**User Story:** As a developer, I want a polished CLI demo with rich terminal output that clearly shows each step of the agent payment flow, so that I can understand, debug, and present the system.

#### Acceptance Criteria

1. WHEN the demo runs, THE CLI_Demo SHALL display clear step-by-step progress with timestamps and colored output
2. THE CLI_Demo SHALL use visual indicators: 🤖 for agent actions, 📡 for HTTP requests, ⚠️ for 402 responses, 💳 for payments, ✅ for success, ❌ for errors
3. THE CLI_Demo SHALL display real transaction hashes as clickable Etherscan links (or copy-pasteable URLs)
4. THE CLI_Demo SHALL show a live progress indicator during blockchain transactions (spinner or progress bar)
5. THE CLI_Demo SHALL use box-drawing characters to create clear visual separation between scenarios
6. THE CLI_Demo SHALL display the agent's wallet balance and remaining budget after each payment
7. WHEN the demo completes, THE CLI_Demo SHALL display a formatted summary table of all payments made and services accessed
8. THE CLI_Demo SHALL support a --verbose flag for detailed debug output and a --quiet flag for minimal output

### Requirement 7: Multiple Service Scenarios

**User Story:** As a developer, I want to see the agent interact with multiple different paid services, so that I can see how it handles various payment requirements.

#### Acceptance Criteria

1. THE Demo SHALL include at least 3 different service endpoints with different pricing
2. THE Demo SHALL demonstrate both streaming mode and per-request payment modes
3. THE Demo SHALL show the agent reusing an existing stream for multiple requests to the same service
4. THE Demo SHALL show the agent creating new streams when accessing different services
5. THE Demo SHALL demonstrate the agent declining a payment that exceeds its budget

### Requirement 8: Error Handling and Recovery

**User Story:** As a developer, I want to see how the agent handles errors gracefully, so that I can trust it in production scenarios.

#### Acceptance Criteria

1. IF a blockchain transaction fails, THEN THE Payment_Agent SHALL log the error with a clear message and continue to the next scenario
2. IF the service is unreachable, THEN THE Payment_Agent SHALL retry with exponential backoff (max 3 attempts)
3. IF the agent has insufficient MNEE balance, THEN THE Payment_Agent SHALL report the shortfall and skip the payment
4. IF stream verification fails, THEN THE Service_Provider SHALL return a clear error message
5. THE CLI_Demo SHALL never crash due to recoverable errors; it SHALL log and continue

### Requirement 9: CLI Configuration and Developer Experience

**User Story:** As a developer, I want to easily configure and run the demo with minimal setup, so that I can quickly see the agent payment flow in action.

#### Acceptance Criteria

1. THE CLI_Demo SHALL read configuration from environment variables (.env file)
2. THE CLI_Demo SHALL validate required environment variables on startup and display clear error messages for missing values
3. THE CLI_Demo SHALL support a --dry-run flag that simulates the flow without making real transactions
4. THE CLI_Demo SHALL support a --scenario flag to run specific scenarios (e.g., --scenario streaming, --scenario per-request)
5. THE CLI_Demo SHALL display a help message with all available options when run with --help
6. THE CLI_Demo SHALL provide a setup check command that verifies wallet balance, contract connectivity, and service availability
7. WHEN running in dry-run mode, THE CLI_Demo SHALL clearly indicate that no real transactions are being made

