/**
 * PaymentAgent Class
 * 
 * The core agent that manages wallet, budget, and payment decisions.
 * Handles autonomous payment execution via x402 protocol and PayStream.
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4, 5.5
 */

import { ethers, Wallet, JsonRpcProvider, Contract } from 'ethers';
import { X402Requirement, parseX402Headers, isX402Response } from './x402Protocol';

/**
 * Configuration for the PaymentAgent
 */
export interface AgentConfig {
  name: string;
  privateKey: string;
  rpcUrl: string;
  dailyBudget: bigint;        // in wei (18 decimals)
  payStreamContract: string;
  geminiApiKey?: string;      // optional for AI decisions
  dryRun?: boolean;           // optional: simulate without real transactions (Requirements: 9.3, 9.7)
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
  tcroBalance: bigint;
  dailySpent: bigint;
  activeStreams: Map<string, StreamInfo>;  // host -> stream
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

// ERC20 ABI removed - using native TCRO instead

// PayStreamStream contract ABI - updated for native TCRO
const PAYSTREAM_ABI = [
  'function createStream(address recipient, uint256 duration, string memory metadata) external payable',
  'function cancelStream(uint256 streamId) external',
  'function isStreamActive(uint256 streamId) external view returns (bool)',
  'function getClaimableBalance(uint256 streamId) external view returns (uint256)',
  'function streams(uint256 streamId) external view returns (address sender, address recipient, uint256 totalAmount, uint256 flowRate, uint256 startTime, uint256 stopTime, uint256 amountWithdrawn, bool isActive, string memory metadata)',
  'event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount, uint256 startTime, uint256 stopTime, string metadata)',
  'event StreamCancelled(uint256 indexed streamId, address sender, address recipient, uint256 senderBalance, uint256 recipientBalance)',
];

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
export class PaymentAgent {
  private config: AgentConfig;
  private wallet: Wallet;
  private provider: JsonRpcProvider;
  private payStreamContract: Contract;
  
  // State tracking
  private _tcroBalance: bigint = 0n;
  private _dailySpent: bigint = 0n;
  private _activeStreams: Map<string, StreamInfo> = new Map();
  private _requestCount: number = 0;
  private _paymentCount: number = 0;
  private _lastDailyReset: number = Date.now();
  
  // Initialization flag
  private _initialized: boolean = false;
  
  // Dry-run mode tracking (Requirements: 9.3, 9.7)
  private _dryRun: boolean = false;
  private _mockStreamCounter: number = 0;
  private _mockTxCounter: number = 0;

  constructor(config: AgentConfig) {
    this.config = config;
    
    // Set dry-run mode (Requirements: 9.3, 9.7)
    this._dryRun = config.dryRun || false;
    
    // Initialize provider and wallet (Requirements: 1.1)
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.wallet = new Wallet(config.privateKey, this.provider);
    
    // Initialize PayStream contract
    this.payStreamContract = new Contract(config.payStreamContract, PAYSTREAM_ABI, this.wallet);
  }

  /**
   * Initialize the agent by fetching initial balances
   * Requirements: 1.1, 1.2, 9.3, 9.7
   * 
   * In dry-run mode, uses a mock balance instead of fetching from chain.
   */
  async initialize(): Promise<void> {
    if (this._dryRun) {
      // In dry-run mode, use a mock balance (100 TCRO)
      // This allows testing budget logic without real chain interaction
      this._tcroBalance = ethers.parseEther('100');
    } else {
      // Fetch initial TCRO balance from chain
      this._tcroBalance = await this.provider.getBalance(this.wallet.address);
    }
    this._initialized = true;
  }

  /**
   * Get the wallet address
   * Requirements: 1.1
   */
  get walletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get the agent name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get current TCRO balance
   * Requirements: 1.2
   */
  get tcroBalance(): bigint {
    return this._tcroBalance;
  }

  /**
   * Get daily spent amount
   * Requirements: 1.4
   */
  get dailySpent(): bigint {
    return this._dailySpent;
  }

  /**
   * Get daily budget
   */
  get dailyBudget(): bigint {
    return this.config.dailyBudget;
  }

  /**
   * Get remaining budget for today
   * Requirements: 1.4
   */
  getRemainingBudget(): bigint {
    this.resetDailyIfNeeded();
    const remaining = this.config.dailyBudget - this._dailySpent;
    return remaining > 0n ? remaining : 0n;
  }

  /**
   * Check if the agent can afford a payment
   * Requirements: 1.5
   */
  canAfford(amount: bigint): boolean {
    this.resetDailyIfNeeded();
    
    // Check against daily budget
    if (this._dailySpent + amount > this.config.dailyBudget) {
      return false;
    }
    
    // Check against actual balance
    if (amount > this._tcroBalance) {
      return false;
    }
    
    return true;
  }

  /**
   * Record a payment and update tracking
   * Requirements: 1.4
   * @param amount - Amount spent in wei
   */
  recordPayment(amount: bigint): void {
    this.resetDailyIfNeeded();
    this._dailySpent += amount;
    this._tcroBalance -= amount;
    this._paymentCount++;
  }

  /**
   * Check and enforce budget before payment
   * Requirements: 1.5, 3.4
   * @param amount - Amount to check
   * @throws Error if budget would be exceeded
   */
  checkBudget(amount: bigint): void {
    this.resetDailyIfNeeded();
    
    if (this._dailySpent + amount > this.config.dailyBudget) {
      const remaining = this.config.dailyBudget - this._dailySpent;
      throw new Error(
        `Budget exceeded: daily limit is ${ethers.formatEther(this.config.dailyBudget)} TCRO, ` +
        `already spent ${ethers.formatEther(this._dailySpent)} TCRO, ` +
        `remaining ${ethers.formatEther(remaining)} TCRO, ` +
        `requested ${ethers.formatEther(amount)} TCRO`
      );
    }
    
    // Also check balance (Requirements: 8.3)
    this.checkBalance(amount);
  }

  /**
   * Check TCRO balance before attempting payment
   * Requirements: 8.3 - Check TCRO balance before attempting payment, report shortfall if insufficient
   * 
   * @param amount - Amount to check
   * @throws Error if balance is insufficient, with shortfall details
   */
  checkBalance(amount: bigint): void {
    if (amount > this._tcroBalance) {
      const shortfall = amount - this._tcroBalance;
      throw new Error(
        `Insufficient TCRO balance: need ${ethers.formatEther(amount)} TCRO, ` +
        `have ${ethers.formatEther(this._tcroBalance)} TCRO, ` +
        `shortfall ${ethers.formatEther(shortfall)} TCRO`
      );
    }
  }

  /**
   * Get balance shortfall for a given amount
   * Requirements: 8.3 - Report shortfall if insufficient
   * 
   * @param amount - Amount to check
   * @returns Shortfall amount (0 if balance is sufficient)
   */
  getBalanceShortfall(amount: bigint): bigint {
    if (amount > this._tcroBalance) {
      return amount - this._tcroBalance;
    }
    return 0n;
  }

  /**
   * Check if agent has sufficient balance for a payment
   * Requirements: 8.3
   * 
   * @param amount - Amount to check
   * @returns true if balance is sufficient, false otherwise
   */
  hasSufficientBalance(amount: bigint): boolean {
    return amount <= this._tcroBalance;
  }

  /**
   * Reset daily spending if 24 hours have passed
   * Requirements: 1.4
   */
  private resetDailyIfNeeded(): void {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    if (now - this._lastDailyReset >= msPerDay) {
      this._dailySpent = 0n;
      this._lastDailyReset = now;
    }
  }

  /**
   * Get cached stream for a host
   * Requirements: 4.5
   * @param host - The host to look up
   * @returns StreamInfo if found and valid, undefined otherwise
   */
  getCachedStream(host: string): StreamInfo | undefined {
    const stream = this._activeStreams.get(host);
    
    if (!stream) {
      return undefined;
    }
    
    // Check if stream has expired
    const now = Math.floor(Date.now() / 1000);
    if (now >= stream.expiresAt) {
      // Clear expired stream from cache
      this._activeStreams.delete(host);
      return undefined;
    }
    
    return stream;
  }

  /**
   * Cache a stream for a host
   * Requirements: 4.5
   * @param host - The host to cache for
   * @param stream - The stream info to cache
   */
  cacheStream(host: string, stream: StreamInfo): void {
    this._activeStreams.set(host, stream);
  }

  /**
   * Clear cached stream for a host
   * Requirements: 4.5
   * @param host - The host to clear
   */
  clearCachedStream(host: string): void {
    this._activeStreams.delete(host);
  }

  /**
   * Clear all expired streams from cache
   * Requirements: 4.5
   */
  clearExpiredStreams(): void {
    const now = Math.floor(Date.now() / 1000);
    
    for (const [host, stream] of this._activeStreams.entries()) {
      if (now >= stream.expiresAt) {
        this._activeStreams.delete(host);
      }
    }
  }

  /**
   * Get all active streams
   * Requirements: 4.5
   */
  getActiveStreams(): Map<string, StreamInfo> {
    // Clear expired streams first
    this.clearExpiredStreams();
    return new Map(this._activeStreams);
  }

  /**
   * Increment request count
   */
  incrementRequestCount(): void {
    this._requestCount++;
  }

  /**
   * Get current agent state
   */
  getState(): AgentState {
    this.resetDailyIfNeeded();
    this.clearExpiredStreams();
    
    return {
      walletAddress: this.wallet.address,
      tcroBalance: this._tcroBalance,
      dailySpent: this._dailySpent,
      activeStreams: new Map(this._activeStreams),
      requestCount: this._requestCount,
      paymentCount: this._paymentCount,
    };
  }

  /**
   * Refresh TCRO balance from chain
   * Requirements: 9.3, 9.7
   * 
   * In dry-run mode, returns the current mock balance without chain interaction.
   */
  async refreshBalance(): Promise<bigint> {
    if (this._dryRun) {
      // In dry-run mode, just return current balance (no chain interaction)
      return this._tcroBalance;
    }
    this._tcroBalance = await this.provider.getBalance(this.wallet.address);
    return this._tcroBalance;
  }

  /**
   * Check if agent is initialized
   */
  get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Check if agent is running in dry-run mode
   * Requirements: 9.3, 9.7
   */
  get isDryRun(): boolean {
    return this._dryRun;
  }

  /**
   * Generate a mock stream ID for dry-run mode
   * Requirements: 9.3
   * @returns Mock stream ID string
   */
  private generateMockStreamId(): string {
    this._mockStreamCounter++;
    return `mock-stream-${Date.now()}-${this._mockStreamCounter}`;
  }

  /**
   * Generate a mock transaction hash for dry-run mode
   * Requirements: 9.3
   * @returns Mock transaction hash (64 hex chars with 0x prefix)
   */
  private generateMockTxHash(): string {
    this._mockTxCounter++;
    // Generate a deterministic but realistic-looking tx hash
    const timestamp = Date.now().toString(16).padStart(12, '0');
    const counter = this._mockTxCounter.toString(16).padStart(4, '0');
    const padding = '0'.repeat(48 - timestamp.length - counter.length);
    return `0xdryrun${timestamp}${counter}${padding}`;
  }

  /**
   * Get the underlying wallet (for advanced operations)
   */
  getWallet(): Wallet {
    return this.wallet;
  }

  /**
   * Get the PayStream contract instance
   */
  getPayStreamContract(): Contract {
    return this.payStreamContract;
  }

  /**
   * Get the provider instance
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

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
  async createStream(
    requirement: X402Requirement,
    serviceUrl: string,
    purpose: string = 'API access'
  ): Promise<PaymentResult> {
    try {
      // Calculate stream amount based on mode
      let amount: bigint;
      let duration: number;
      
      if (requirement.mode === 'streaming') {
        // For streaming mode, use minDeposit or calculate from rate
        // Default to 1 hour of streaming if no minDeposit specified
        duration = 3600; // 1 hour in seconds
        const rate = ethers.parseEther(requirement.rate || '0.0001');
        amount = requirement.minDeposit 
          ? ethers.parseEther(requirement.minDeposit)
          : rate * BigInt(duration);
      } else {
        // For per-request mode, use the specified amount
        amount = ethers.parseEther(requirement.amount || '0.01');
        duration = 60; // 1 minute for per-request payments
      }

      // Check TCRO balance before attempting payment (Requirements: 8.3)
      // This provides early failure with clear shortfall reporting
      if (!this.hasSufficientBalance(amount)) {
        const shortfall = this.getBalanceShortfall(amount);
        return {
          success: false,
          error: `Insufficient TCRO balance: need ${ethers.formatEther(amount)} TCRO, ` +
                 `have ${ethers.formatEther(this._tcroBalance)} TCRO, ` +
                 `shortfall ${ethers.formatEther(shortfall)} TCRO`,
        };
      }

      // Check budget before proceeding (Requirements: 1.5, 3.4)
      this.checkBudget(amount);

      // DRY-RUN MODE: Skip actual blockchain transactions (Requirements: 9.3, 9.7)
      if (this._dryRun) {
        // Generate mock stream ID and tx hash
        const mockStreamId = this.generateMockStreamId();
        const mockTxHash = this.generateMockTxHash();
        
        // Record the payment (still track spending in dry-run for budget testing)
        this.recordPayment(amount);

        // Calculate stream expiration
        const startTime = Math.floor(Date.now() / 1000);
        const expiresAt = startTime + duration;

        // Cache the mock stream for reuse (Requirements: 4.5)
        const host = new URL(serviceUrl).host;
        const streamInfo: StreamInfo = {
          streamId: mockStreamId,
          recipient: requirement.recipient,
          amount,
          rate: requirement.rate ? ethers.parseEther(requirement.rate) : 0n,
          startTime,
          expiresAt,
        };
        this.cacheStream(host, streamInfo);

        return {
          success: true,
          txHash: mockTxHash,
          streamId: mockStreamId,
          amount,
        };
      }

      // REAL MODE: Execute actual blockchain transactions

      // Step 1: Build metadata (Requirements: 4.3)
      const metadata: StreamMetadata = {
        agentId: this.config.name,
        timestamp: Date.now(),
        serviceUrl: serviceUrl,
        purpose: purpose,
      };
      const metadataString = JSON.stringify(metadata);

      // Step 2: Create stream on PayStream contract with native TCRO (Requirements: 4.2)
      const createTx = await this.payStreamContract.createStream(
        requirement.recipient,
        duration,
        metadataString,
        { value: amount } // Send TCRO as msg.value
      );
      const receipt = await createTx.wait();

      // Step 4: Extract stream ID from StreamCreated event (Requirements: 4.4)
      const streamId = this.extractStreamIdFromReceipt(receipt);
      
      if (!streamId) {
        throw new Error('Failed to extract stream ID from transaction receipt');
      }

      // Record the payment
      this.recordPayment(amount);

      // Calculate stream expiration
      const startTime = Math.floor(Date.now() / 1000);
      const expiresAt = startTime + duration;

      // Cache the stream for reuse (Requirements: 4.5)
      const host = new URL(serviceUrl).host;
      const streamInfo: StreamInfo = {
        streamId,
        recipient: requirement.recipient,
        amount,
        rate: requirement.rate ? ethers.parseEther(requirement.rate) : 0n,
        startTime,
        expiresAt,
      };
      this.cacheStream(host, streamInfo);

      return {
        success: true,
        txHash: receipt.hash,
        streamId,
        amount,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error during stream creation',
      };
    }
  }

  /**
   * Extract stream ID from transaction receipt
   * Requirements: 4.4
   * 
   * @param receipt - Transaction receipt from createStream call
   * @returns Stream ID as string, or null if not found
   */
  private extractStreamIdFromReceipt(receipt: any): string | null {
    if (!receipt || !receipt.logs) {
      return null;
    }

    // Look for StreamCreated event in logs
    for (const log of receipt.logs) {
      try {
        const parsed = this.payStreamContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        
        if (parsed && parsed.name === 'StreamCreated') {
          // StreamCreated event: (streamId, sender, recipient, totalAmount, startTime, stopTime, metadata)
          // streamId is the first indexed argument (args[0])
          return parsed.args[0].toString();
        }
      } catch {
        // Not a StreamCreated event, continue
        continue;
      }
    }

    return null;
  }

  /**
   * Make an HTTP request with automatic x402 payment handling
   * Requirements: 5.1, 5.3, 5.4, 5.5
   * 
   * @param url - The URL to fetch
   * @param options - Optional fetch options (method, headers, body)
   * @returns FetchResult with response data or error
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: string | undefined;
    let paymentMade = false;
    let streamId: string | undefined;
    let txHash: string | undefined;

    this.incrementRequestCount();

    // Check for cached stream for this host
    const host = new URL(url).host;
    const cachedStream = this.getCachedStream(host);

    while (retryCount < maxRetries) {
      try {
        // Build request headers
        const headers: Record<string, string> = {
          ...options.headers,
        };

        // Add cached stream ID if available (Requirements: 5.1)
        if (cachedStream && retryCount === 0) {
          headers['x-paystream-stream-id'] = cachedStream.streamId;
          streamId = cachedStream.streamId;
        }

        // Add stream ID from payment if we just made one (Requirements: 5.2)
        if (streamId && retryCount > 0) {
          headers['x-paystream-stream-id'] = streamId;
        }

        // Make the request
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body: options.body,
        });

        // Get response headers as plain object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Check if this is a 402 Payment Required response
        if (isX402Response(response.status, responseHeaders)) {
          // Parse x402 requirements
          const requirement = parseX402Headers(responseHeaders);
          
          if (!requirement) {
            return {
              success: false,
              status: response.status,
              error: 'Invalid x402 response: missing required headers',
              retryCount,
            };
          }

          // Clear any cached stream that didn't work
          if (cachedStream) {
            this.clearCachedStream(host);
          }

          // Attempt to create a payment stream (Requirements: 5.3)
          const paymentResult = await this.createStream(requirement, url);
          
          if (!paymentResult.success) {
            return {
              success: false,
              status: 402,
              error: paymentResult.error || 'Payment failed',
              retryCount,
            };
          }

          // Payment successful, prepare for retry
          paymentMade = true;
          streamId = paymentResult.streamId;
          txHash = paymentResult.txHash;
          retryCount++;
          
          // Continue to retry with payment proof
          continue;
        }

        // Success! Return the response
        if (response.ok) {
          let data: any;
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          return {
            success: true,
            status: response.status,
            data,
            headers: responseHeaders,
            paymentMade,
            streamId,
            txHash,
            retryCount,
          };
        }

        // Non-402 error response
        return {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
          headers: responseHeaders,
          retryCount,
        };

      } catch (error: any) {
        lastError = error.message || 'Network error';
        retryCount++;
        
        // If we haven't exhausted retries, continue with exponential backoff
        // Requirements: 8.2 - Base delay of 1 second, double delay on each retry
        if (retryCount < maxRetries) {
          const backoffDelay = this.calculateExponentialBackoff(retryCount);
          await this.delay(backoffDelay);
          continue;
        }
      }
    }

    // Exhausted all retries (Requirements: 5.5)
    return {
      success: false,
      status: 0,
      error: lastError || `Failed after ${maxRetries} attempts`,
      paymentMade,
      streamId,
      txHash,
      retryCount,
    };
  }

  /**
   * Helper method to delay execution
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel a specific payment stream and get refund for unused funds
   * 
   * When cancelled:
   * - Recipient gets the amount already streamed (based on elapsed time)
   * - Sender (agent) gets refund for unused portion
   * 
   * @param streamId - The stream ID to cancel
   * @returns PaymentResult with cancellation details
   */
  async cancelStream(streamId: string): Promise<PaymentResult> {
    try {
      // DRY-RUN MODE: Skip actual blockchain transactions
      if (this._dryRun) {
        // Remove from cache
        for (const [host, stream] of this._activeStreams.entries()) {
          if (stream.streamId === streamId) {
            this._activeStreams.delete(host);
            break;
          }
        }
        
        return {
          success: true,
          txHash: this.generateMockTxHash(),
          streamId,
        };
      }

      // Check if stream is still active
      const streamIdBigInt = BigInt(streamId);
      const isActive = await this.payStreamContract.isStreamActive(streamIdBigInt);
      if (!isActive) {
        return {
          success: false,
          error: `Stream ${streamId} is not active (already cancelled or expired)`,
          streamId,
        };
      }

      // Cancel the stream on-chain
      // Manually encode and send to ensure data is properly included
      const cancelData = this.payStreamContract.interface.encodeFunctionData('cancelStream', [streamIdBigInt]);
      
      const cancelTx = await this.wallet.sendTransaction({
        to: this.config.payStreamContract,
        data: cancelData,
        gasLimit: 100000n, // Set explicit gas limit
      });
      
      const receipt = await cancelTx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      // Extract refund amount from StreamCancelled event
      let refundAmount = 0n;
      for (const log of receipt.logs) {
        try {
          const parsed = this.payStreamContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          
          if (parsed && parsed.name === 'StreamCancelled') {
            // StreamCancelled event: (streamId, sender, recipient, senderBalance, recipientBalance)
            refundAmount = parsed.args[3]; // senderBalance is the refund
            break;
          }
        } catch {
          continue;
        }
      }

      // Update balance with refund
      if (refundAmount > 0n) {
        this._tcroBalance += refundAmount;
        // Reduce daily spent by refund amount (since we got it back)
        if (this._dailySpent >= refundAmount) {
          this._dailySpent -= refundAmount;
        }
      }

      // Remove from cache
      for (const [host, stream] of this._activeStreams.entries()) {
        if (stream.streamId === streamId) {
          this._activeStreams.delete(host);
          break;
        }
      }

      return {
        success: true,
        txHash: receipt.hash,
        streamId,
        amount: refundAmount,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error during stream cancellation',
        streamId,
      };
    }
  }

  /**
   * Cancel all active streams and get refunds
   * 
   * This should be called when the agent is done using APIs to:
   * 1. Close all open streams
   * 2. Get refunds for unused streaming time
   * 3. Clean up resources
   * 
   * @returns Array of PaymentResults for each cancellation
   */
  async cancelAllStreams(): Promise<PaymentResult[]> {
    const results: PaymentResult[] = [];
    
    // Get all active streams
    const streams = Array.from(this._activeStreams.entries());
    
    for (const [host, streamInfo] of streams) {
      const result = await this.cancelStream(streamInfo.streamId);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get the claimable balance for a stream (how much has been streamed so far)
   * 
   * @param streamId - The stream ID to check
   * @returns Claimable balance in wei, or null if error
   */
  async getStreamClaimableBalance(streamId: string): Promise<bigint | null> {
    try {
      if (this._dryRun) {
        // In dry-run mode, calculate based on elapsed time
        for (const stream of this._activeStreams.values()) {
          if (stream.streamId === streamId) {
            const elapsed = Math.floor(Date.now() / 1000) - stream.startTime;
            return stream.rate * BigInt(elapsed);
          }
        }
        return 0n;
      }
      
      return await this.payStreamContract.getClaimableBalance(streamId);
    } catch {
      return null;
    }
  }

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
  calculateExponentialBackoff(attempt: number, baseDelayMs: number = 1000): number {
    // Ensure attempt is at least 1
    const safeAttempt = Math.max(1, attempt);
    // Calculate delay: base * 2^(attempt-1)
    return baseDelayMs * Math.pow(2, safeAttempt - 1);
  }
}
