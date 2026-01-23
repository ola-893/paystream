# Design Document: Agent-First CLI Demo

## Overview

This design describes a CLI-first demonstration of AI agents autonomously triggering and streaming payments via the x402 protocol and PayStream. The demo is built in TypeScript/Node.js to leverage the existing PayStreamSDK and provide a polished developer experience with rich terminal output.

The architecture follows a clean separation between:
- **Agent Layer**: Autonomous payment decision-making and wallet management
- **Protocol Layer**: x402 header parsing and payment proof handling
- **Blockchain Layer**: Real Cronos Testnet transactions via ethers.js
- **CLI Layer**: Rich terminal output with colors, spinners, and formatted tables

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Demo Runner                          │
│  (demo/agent-demo.ts)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  PaymentAgent   │    │  x402 Parser    │    │  CLI Output │ │
│  │  - wallet       │    │  - headers      │    │  - colors   │ │
│  │  - budget       │    │  - requirements │    │  - spinners │ │
│  │  - decisions    │    │  - proof        │    │  - tables   │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                      │                     │        │
│           ▼                      ▼                     ▼        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    PayStreamSDK (existing)                    ││
│  │  - createStream()  - makeRequest()  - monitor spending      ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     External Services                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │ x402 Server    │  │ Cronos RPC     │  │ PayStreamStream      │ │
│  │ (localhost)    │  │ (Public Node)  │  │ Contract           │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PaymentAgent Class

The core agent that manages wallet, budget, and payment decisions.

```typescript
interface AgentConfig {
  name: string;
  privateKey: string;
  rpcUrl: string;
  dailyBudget: bigint;        // in wei
  payStreamContract: string;
  mneeToken: string;
  geminiApiKey?: string;      // optional for AI decisions
}

interface AgentState {
  walletAddress: string;
  mneeBalance: bigint;
  dailySpent: bigint;
  activeStreams: Map<string, StreamInfo>;  // host -> stream
  requestCount: number;
  paymentCount: number;
}

interface StreamInfo {
  streamId: string;
  recipient: string;
  amount: bigint;
  rate: bigint;
  startTime: number;
  expiresAt: number;
}

class PaymentAgent {
  constructor(config: AgentConfig);
  
  // Core methods
  async initialize(): Promise<void>;
  async fetch(url: string, options?: RequestOptions): Promise<FetchResult>;
  async evaluatePayment(requirement: X402Requirement): Promise<PaymentDecision>;
  async createStream(requirement: X402Requirement): Promise<StreamInfo>;
  async makeDirectPayment(requirement: X402Requirement): Promise<TxResult>;
  
  // State methods
  getState(): AgentState;
  getRemainingBudget(): bigint;
  canAfford(amount: bigint): boolean;
}
```

### 2. X402 Protocol Handler

Parses x402 headers and constructs payment proofs.

```typescript
interface X402Requirement {
  recipient: string;
  mode: 'streaming' | 'per-request';
  rate?: string;           // MNEE per second (streaming)
  amount?: string;         // MNEE per request (per-request)
  minDeposit?: string;     // minimum deposit (streaming)
  contract: string;
  token: string;
  description?: string;
}

interface PaymentProof {
  type: 'stream' | 'direct';
  streamId?: string;
  txHash?: string;
}

function parseX402Headers(headers: Headers): X402Requirement | null;
function buildPaymentHeaders(proof: PaymentProof): Record<string, string>;
```

### 3. CLI Output Manager

Handles all terminal output with colors, spinners, and formatting.

```typescript
interface CLIConfig {
  verbose: boolean;
  quiet: boolean;
  noColor: boolean;
}

class CLIOutput {
  constructor(config: CLIConfig);
  
  // Status indicators
  agent(message: string): void;      // 🤖
  request(message: string): void;    // 📡
  payment(message: string): void;    // 💳
  success(message: string): void;    // ✅
  error(message: string): void;      // ❌
  warning(message: string): void;    // ⚠️
  
  // Formatting
  box(title: string, content: string[]): void;
  table(headers: string[], rows: string[][]): void;
  etherscanLink(txHash: string): string;
  
  // Progress
  startSpinner(message: string): void;
  stopSpinner(success: boolean, message?: string): void;
  
  // Sections
  scenarioStart(name: string, description: string): void;
  scenarioEnd(): void;
  summary(stats: DemoStats): void;
}
```

### 4. Demo Scenario Runner

Orchestrates multiple demo scenarios.

```typescript
interface Scenario {
  name: string;
  description: string;
  endpoint: string;
  expectedMode: 'streaming' | 'per-request';
  expectedPrice: string;
  shouldSucceed: boolean;  // false for budget-exceeded scenarios
}

interface DemoStats {
  scenariosRun: number;
  scenariosPassed: number;
  totalPayments: number;
  totalSpent: bigint;
  streamsCreated: number;
  streamsReused: number;
  errors: string[];
}

class DemoRunner {
  constructor(agent: PaymentAgent, cli: CLIOutput);
  
  async runScenario(scenario: Scenario): Promise<ScenarioResult>;
  async runAll(scenarios: Scenario[]): Promise<DemoStats>;
  async checkSetup(): Promise<SetupStatus>;
}
```

## Data Models

### Environment Configuration

```typescript
// Required environment variables
interface EnvConfig {
  PRIVATE_KEY: string;           // Agent wallet private key
  CRONOS_RPC_URL: string;        // Cronos Testnet RPC endpoint
  PAYSTREAM_CONTRACT: string;      // PayStreamStream contract address
  MNEE_TOKEN: string;            // MNEE token address
  
  // Optional
  GEMINI_API_KEY?: string;       // For AI payment decisions
  DAILY_BUDGET?: string;         // Default: "10" MNEE
  SERVER_URL?: string;           // Default: "http://localhost:3001"
}
```

### Payment Transaction Record

```typescript
interface PaymentRecord {
  timestamp: Date;
  scenario: string;
  type: 'stream' | 'direct';
  amount: bigint;
  recipient: string;
  txHash: string;
  streamId?: string;
  gasUsed: bigint;
  success: boolean;
  error?: string;
}
```

### x402 Response Structure

```typescript
interface X402Response {
  status: 402;
  headers: {
    'X-Payment-Required': 'true';
    'X-PayStream-Mode': 'streaming' | 'per-request';
    'X-PayStream-Rate': string;
    'X-PayStream-Recipient': string;
    'X-PayStream-Contract': string;
    'X-PayStream-MinDeposit'?: string;
    'X-PayStream-Amount'?: string;
  };
  body: {
    message: string;
    requirements: X402Requirement;
  };
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Wallet Address Derivation

*For any* valid private key, the Payment_Agent SHALL initialize with the correct Ethereum wallet address derived from that key using standard secp256k1 derivation.

**Validates: Requirements 1.1**

### Property 2: Budget Tracking Consistency

*For any* sequence of payments made by the Payment_Agent, the tracked `dailySpent` value SHALL equal the sum of all payment amounts in that sequence.

**Validates: Requirements 1.4**

### Property 3: Budget Enforcement

*For any* Payment_Agent with budget B and current spending S where S >= B, all subsequent payment attempts SHALL be refused.

**Validates: Requirements 1.5, 3.4**

### Property 4: 402 Response Without Payment Proof

*For any* HTTP request to a protected endpoint that does not include payment proof headers (X-PayStream-Stream-ID or X-PayStream-Tx-Hash), the Service_Provider SHALL return HTTP 402.

**Validates: Requirements 2.1**

### Property 5: 402 Header Completeness

*For any* HTTP 402 response from the Service_Provider, the response SHALL include all required x402 headers: X-Payment-Required, X-PayStream-Mode, X-PayStream-Rate, X-PayStream-Recipient, X-PayStream-Contract.

**Validates: Requirements 2.2**

### Property 6: Active Stream Grants Access

*For any* HTTP request with a valid X-PayStream-Stream-ID header where the stream is active on-chain, the Service_Provider SHALL return HTTP 200.

**Validates: Requirements 2.4**

### Property 7: Inactive Stream Requires New Payment

*For any* HTTP request with an X-PayStream-Stream-ID header where the stream is inactive or depleted, the Service_Provider SHALL return HTTP 402.

**Validates: Requirements 2.5**

### Property 8: Stream Metadata Completeness

*For any* stream created by the Payment_Agent, the metadata JSON SHALL contain: agentId, timestamp, serviceUrl, and purpose fields.

**Validates: Requirements 4.3**

### Property 9: Stream ID Extraction from Event

*For any* successful createStream transaction, the Payment_Agent SHALL correctly extract the stream ID from the StreamCreated event in the transaction receipt.

**Validates: Requirements 4.4**

### Property 10: Stream Reuse for Same Host

*For any* sequence of requests to the same host, the Payment_Agent SHALL reuse the same stream ID for all requests after the first stream is created (until the stream expires or is depleted).

**Validates: Requirements 4.5, 7.3**

### Property 11: Stream Isolation Between Hosts

*For any* requests to different hosts, the Payment_Agent SHALL create separate streams for each host.

**Validates: Requirements 7.4**

### Property 12: Retry Includes Stream ID

*For any* retry request after stream creation, the request SHALL include the X-PayStream-Stream-ID header with the stream ID from the createStream transaction.

**Validates: Requirements 5.1, 5.2**

### Property 13: Retry Limit Enforcement

*For any* request that fails repeatedly, the Payment_Agent SHALL stop retrying after exactly 3 attempts.

**Validates: Requirements 5.5**

### Property 14: Cronos Explorer URL Format

*For any* transaction hash displayed by the CLI_Demo, the output SHALL contain a valid Cronos Explorer URL in the format `https://explorer.cronos.org/testnet/tx/{txHash}`.

**Validates: Requirements 6.3**

### Property 15: Summary Totals Accuracy

*For any* demo run, the summary table SHALL display totals that exactly match the sum of individual payment records.

**Validates: Requirements 6.7**

### Property 16: Dry-Run No Transactions

*For any* demo run with --dry-run flag, zero blockchain transactions SHALL be submitted.

**Validates: Requirements 9.3**

### Property 17: Scenario Filter Correctness

*For any* demo run with --scenario flag, only scenarios matching the filter SHALL be executed.

**Validates: Requirements 9.4**

### Property 18: Environment Validation

*For any* missing required environment variable, the CLI_Demo SHALL display an error message naming the missing variable and exit before attempting any operations.

**Validates: Requirements 9.2**

### Property 19: Error Recovery Continuity

*For any* recoverable error during a scenario, the CLI_Demo SHALL log the error and continue to the next scenario without crashing.

**Validates: Requirements 8.1, 8.5**

### Property 20: Exponential Backoff Timing

*For any* sequence of retry attempts due to unreachable service, the delay between attempts SHALL follow exponential backoff (delay_n = base * 2^n) with a maximum of 3 attempts.

**Validates: Requirements 8.2**

## Error Handling

### Agent Errors

| Error Type | Handling Strategy | User Message |
|------------|-------------------|--------------|
| Insufficient MNEE balance | Skip payment, log shortfall | "❌ Insufficient balance: need {amount} MNEE, have {balance} MNEE" |
| Budget exceeded | Refuse payment, log reason | "⚠️ Budget exceeded: daily limit is {budget} MNEE, already spent {spent} MNEE" |
| Transaction failed | Log error, continue to next scenario | "❌ Transaction failed: {error}. Continuing..." |
| Stream creation failed | Log error, attempt direct payment fallback | "❌ Stream creation failed: {error}. Trying direct payment..." |

### Service Provider Errors

| Error Type | HTTP Status | Response |
|------------|-------------|----------|
| No payment proof | 402 | x402 headers + requirements JSON |
| Invalid stream ID | 402 | `{ "error": "Invalid stream ID", "detail": "..." }` |
| Inactive stream | 402 | `{ "error": "Stream inactive", "detail": "..." }` |
| Stream verification failed | 500 | `{ "error": "Verification failed", "detail": "..." }` |

### CLI Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Missing env vars | Display error, list missing vars, exit with code 1 |
| Invalid CLI flags | Display help message, exit with code 1 |
| Network unreachable | Retry with exponential backoff, then skip scenario |
| Unhandled exception | Log stack trace (if --verbose), continue if possible |

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **x402 Header Parsing**: Test parsing of various header combinations
2. **Budget Calculations**: Test budget tracking with specific payment sequences
3. **CLI Flag Parsing**: Test --verbose, --quiet, --dry-run, --scenario flags
4. **Etherscan URL Generation**: Test URL formatting for various tx hashes
5. **Environment Validation**: Test error messages for missing env vars

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs using **fast-check** library:

1. **Property 2 (Budget Tracking)**: Generate random payment sequences, verify sum equals tracked total
2. **Property 3 (Budget Enforcement)**: Generate random budgets and spending, verify enforcement
3. **Property 5 (Header Completeness)**: Generate 402 responses, verify all headers present
4. **Property 10 (Stream Reuse)**: Generate request sequences to same host, verify single stream
5. **Property 13 (Retry Limit)**: Generate failing requests, verify exactly 3 retries
6. **Property 15 (Summary Accuracy)**: Generate payment records, verify summary totals

### Integration Tests

Integration tests verify end-to-end flows with mock blockchain:

1. **Full x402 Flow**: Request → 402 → Payment → Retry → 200
2. **Stream Reuse Flow**: Multiple requests to same service
3. **Budget Exceeded Flow**: Payments until budget exhausted
4. **Error Recovery Flow**: Simulate failures, verify continuation

### Test Configuration

- Property tests: minimum 100 iterations per property
- Use fast-check for TypeScript property-based testing
- Mock ethers.js provider for unit tests
- Use actual local server for integration tests
- Tag format: `Feature: agent-first-demo, Property {N}: {description}`

