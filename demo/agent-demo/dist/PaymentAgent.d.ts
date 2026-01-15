/**
 * PaymentAgent Class
 *
 * The core agent that manages wallet, budget, and payment decisions.
 * Handles autonomous payment execution via x402 protocol and FlowPay.
 *
 * Requirements: 1.1, 1.2, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4, 5.5
 */
import { Wallet, JsonRpcProvider, Contract } from 'ethers';
import { X402Requirement } from './x402Protocol';
/**
 * Configuration for the PaymentAgent
 */
export interface AgentConfig {
    name: string;
    privateKey: string;
    rpcUrl: string;
    dailyBudget: bigint;
    flowPayContract: string;
    mneeToken: string;
    geminiApiKey?: string;
    dryRun?: boolean;
}
/**
 * Information about an active payment stream
 */
export interface StreamInfo {
    streamId: string;
    recipient: string;
    amount: bigint;
    rate: bigint;
    startTime: number;
    expiresAt: number;
}
/**
 * Current state of the PaymentAgent
 */
export interface AgentState {
    walletAddress: string;
    mneeBalance: bigint;
    dailySpent: bigint;
    activeStreams: Map<string, StreamInfo>;
    requestCount: number;
    paymentCount: number;
}
/**
 * Result of a payment operation
 */
export interface PaymentResult {
    success: boolean;
    txHash?: string;
    streamId?: string;
    amount?: bigint;
    error?: string;
}
/**
 * Options for fetch requests
 */
export interface FetchOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}
/**
 * Result of a fetch operation
 */
export interface FetchResult {
    success: boolean;
    status: number;
    data?: any;
    headers?: Record<string, string>;
    paymentMade?: boolean;
    streamId?: string;
    txHash?: string;
    error?: string;
    retryCount?: number;
}
/**
 * Stream creation metadata
 * Requirements: 4.3
 */
export interface StreamMetadata {
    agentId: string;
    timestamp: number;
    serviceUrl: string;
    purpose: string;
}
/**
 * PaymentAgent - Autonomous AI agent with wallet capabilities
 *
 * This agent can:
 * - Initialize with a real Ethereum wallet
 * - Track spending against a daily budget
 * - Cache and reuse payment streams
 * - Make autonomous payment decisions
 * - Run in dry-run mode for simulation (Requirements: 9.3, 9.7)
 */
export declare class PaymentAgent {
    private config;
    private wallet;
    private provider;
    private mneeContract;
    private flowPayContract;
    private _mneeBalance;
    private _dailySpent;
    private _activeStreams;
    private _requestCount;
    private _paymentCount;
    private _lastDailyReset;
    private _initialized;
    private _dryRun;
    private _mockStreamCounter;
    private _mockTxCounter;
    constructor(config: AgentConfig);
    /**
     * Initialize the agent by fetching initial balances
     * Requirements: 1.1, 1.2, 9.3, 9.7
     *
     * In dry-run mode, uses a mock balance instead of fetching from chain.
     */
    initialize(): Promise<void>;
    /**
     * Get the wallet address
     * Requirements: 1.1
     */
    get walletAddress(): string;
    /**
     * Get the agent name
     */
    get name(): string;
    /**
     * Get current MNEE balance
     * Requirements: 1.2
     */
    get mneeBalance(): bigint;
    /**
     * Get daily spent amount
     * Requirements: 1.4
     */
    get dailySpent(): bigint;
    /**
     * Get daily budget
     */
    get dailyBudget(): bigint;
    /**
     * Get remaining budget for today
     * Requirements: 1.4
     */
    getRemainingBudget(): bigint;
    /**
     * Check if the agent can afford a payment
     * Requirements: 1.5
     */
    canAfford(amount: bigint): boolean;
    /**
     * Record a payment and update tracking
     * Requirements: 1.4
     * @param amount - Amount spent in wei
     */
    recordPayment(amount: bigint): void;
    /**
     * Check and enforce budget before payment
     * Requirements: 1.5, 3.4
     * @param amount - Amount to check
     * @throws Error if budget would be exceeded
     */
    checkBudget(amount: bigint): void;
    /**
     * Check MNEE balance before attempting payment
     * Requirements: 8.3 - Check MNEE balance before attempting payment, report shortfall if insufficient
     *
     * @param amount - Amount to check
     * @throws Error if balance is insufficient, with shortfall details
     */
    checkBalance(amount: bigint): void;
    /**
     * Get balance shortfall for a given amount
     * Requirements: 8.3 - Report shortfall if insufficient
     *
     * @param amount - Amount to check
     * @returns Shortfall amount (0 if balance is sufficient)
     */
    getBalanceShortfall(amount: bigint): bigint;
    /**
     * Check if agent has sufficient balance for a payment
     * Requirements: 8.3
     *
     * @param amount - Amount to check
     * @returns true if balance is sufficient, false otherwise
     */
    hasSufficientBalance(amount: bigint): boolean;
    /**
     * Reset daily spending if 24 hours have passed
     * Requirements: 1.4
     */
    private resetDailyIfNeeded;
    /**
     * Get cached stream for a host
     * Requirements: 4.5
     * @param host - The host to look up
     * @returns StreamInfo if found and valid, undefined otherwise
     */
    getCachedStream(host: string): StreamInfo | undefined;
    /**
     * Cache a stream for a host
     * Requirements: 4.5
     * @param host - The host to cache for
     * @param stream - The stream info to cache
     */
    cacheStream(host: string, stream: StreamInfo): void;
    /**
     * Clear cached stream for a host
     * Requirements: 4.5
     * @param host - The host to clear
     */
    clearCachedStream(host: string): void;
    /**
     * Clear all expired streams from cache
     * Requirements: 4.5
     */
    clearExpiredStreams(): void;
    /**
     * Get all active streams
     * Requirements: 4.5
     */
    getActiveStreams(): Map<string, StreamInfo>;
    /**
     * Increment request count
     */
    incrementRequestCount(): void;
    /**
     * Get current agent state
     */
    getState(): AgentState;
    /**
     * Refresh MNEE balance from chain
     * Requirements: 9.3, 9.7
     *
     * In dry-run mode, returns the current mock balance without chain interaction.
     */
    refreshBalance(): Promise<bigint>;
    /**
     * Check if agent is initialized
     */
    get isInitialized(): boolean;
    /**
     * Check if agent is running in dry-run mode
     * Requirements: 9.3, 9.7
     */
    get isDryRun(): boolean;
    /**
     * Generate a mock stream ID for dry-run mode
     * Requirements: 9.3
     * @returns Mock stream ID string
     */
    private generateMockStreamId;
    /**
     * Generate a mock transaction hash for dry-run mode
     * Requirements: 9.3
     * @returns Mock transaction hash (64 hex chars with 0x prefix)
     */
    private generateMockTxHash;
    /**
     * Get the underlying wallet (for advanced operations)
     */
    getWallet(): Wallet;
    /**
     * Get the MNEE contract instance
     */
    getMneeContract(): Contract;
    /**
     * Get the FlowPay contract instance
     */
    getFlowPayContract(): Contract;
    /**
     * Get the provider instance
     */
    getProvider(): JsonRpcProvider;
    /**
     * Create a payment stream to a recipient
     * Requirements: 4.1, 4.2, 4.3, 4.4, 8.3, 9.3, 9.7
     *
     * In dry-run mode, skips actual blockchain transactions and generates mock IDs.
     *
     * @param requirement - The x402 payment requirement
     * @param serviceUrl - The URL of the service being paid for
     * @param purpose - Description of why the payment is being made
     * @returns PaymentResult with stream ID and transaction hash
     */
    createStream(requirement: X402Requirement, serviceUrl: string, purpose?: string): Promise<PaymentResult>;
    /**
     * Extract stream ID from transaction receipt
     * Requirements: 4.4
     *
     * @param receipt - Transaction receipt from createStream call
     * @returns Stream ID as string, or null if not found
     */
    private extractStreamIdFromReceipt;
    /**
     * Make an HTTP request with automatic x402 payment handling
     * Requirements: 5.1, 5.3, 5.4, 5.5
     *
     * @param url - The URL to fetch
     * @param options - Optional fetch options (method, headers, body)
     * @returns FetchResult with response data or error
     */
    fetch(url: string, options?: FetchOptions): Promise<FetchResult>;
    /**
     * Helper method to delay execution
     * @param ms - Milliseconds to delay
     */
    private delay;
    /**
     * Calculate exponential backoff delay
     * Requirements: 8.2 - Base delay of 1 second, double delay on each retry
     *
     * Formula: delay_n = base * 2^(n-1)
     * - Attempt 1: 1000ms (1 second)
     * - Attempt 2: 2000ms (2 seconds)
     * - Attempt 3: 4000ms (4 seconds)
     *
     * @param attempt - Current retry attempt number (1-based)
     * @param baseDelayMs - Base delay in milliseconds (default: 1000)
     * @returns Delay in milliseconds
     */
    calculateExponentialBackoff(attempt: number, baseDelayMs?: number): number;
}
//# sourceMappingURL=PaymentAgent.d.ts.map