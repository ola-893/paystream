/**
 * PaymentAgent Class
 * 
 * The core agent that manages wallet, budget, and payment decisions.
 * Handles autonomous payment execution via x402 protocol and FlowPay.
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
  flowPayContract: string;
  mneeToken: string;
  geminiApiKey?: string;      // optional for AI decisions
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

// ERC20 ABI for MNEE token interactions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// FlowPayStream contract ABI
const FLOWPAY_ABI = [
  'function createStream(address recipient, uint256 duration, uint256 amount, string metadata) external',
  'function isStreamActive(uint256 streamId) external view returns (bool)',
  'function streams(uint256 streamId) external view returns (address sender, address recipient, uint256 totalAmount, uint256 flowRate, uint256 startTime, uint256 stopTime, uint256 amountWithdrawn, bool isActive, string metadata)',
  'event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount, uint256 startTime, uint256 stopTime, string metadata)',
];

/**
 * PaymentAgent - Autonomous AI agent with wallet capabilities
 * 
 * This agent can:
 * - Initialize with a real Ethereum wallet
 * - Track spending against a daily budget
 * - Cache and reuse payment streams
 * - Make autonomous payment decisions
 */
export class PaymentAgent {
  private config: AgentConfig;
  private wallet: Wallet;
  private provider: JsonRpcProvider;
  private mneeContract: Contract;
  private flowPayContract: Contract;
  
  // State tracking
  private _mneeBalance: bigint = 0n;
  private _dailySpent: bigint = 0n;
  private _activeStreams: Map<string, StreamInfo> = new Map();
  private _requestCount: number = 0;
  private _paymentCount: number = 0;
  private _lastDailyReset: number = Date.now();
  
  // Initialization flag
  private _initialized: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
    
    // Initialize provider and wallet (Requirements: 1.1)
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.wallet = new Wallet(config.privateKey, this.provider);
    
    // Initialize contracts
    this.mneeContract = new Contract(config.mneeToken, ERC20_ABI, this.wallet);
    this.flowPayContract = new Contract(config.flowPayContract, FLOWPAY_ABI, this.wallet);
  }

  /**
   * Initialize the agent by fetching initial balances
   * Requirements: 1.1, 1.2
   */
  async initialize(): Promise<void> {
    // Fetch initial MNEE balance
    this._mneeBalance = await this.mneeContract.balanceOf(this.wallet.address);
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
   * Get current MNEE balance
   * Requirements: 1.2
   */
  get mneeBalance(): bigint {
    return this._mneeBalance;
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
    if (amount > this._mneeBalance) {
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
    this._mneeBalance -= amount;
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
        `Budget exceeded: daily limit is ${ethers.formatEther(this.config.dailyBudget)} MNEE, ` +
        `already spent ${ethers.formatEther(this._dailySpent)} MNEE, ` +
        `remaining ${ethers.formatEther(remaining)} MNEE, ` +
        `requested ${ethers.formatEther(amount)} MNEE`
      );
    }
    
    if (amount > this._mneeBalance) {
      throw new Error(
        `Insufficient balance: need ${ethers.formatEther(amount)} MNEE, ` +
        `have ${ethers.formatEther(this._mneeBalance)} MNEE`
      );
    }
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
      mneeBalance: this._mneeBalance,
      dailySpent: this._dailySpent,
      activeStreams: new Map(this._activeStreams),
      requestCount: this._requestCount,
      paymentCount: this._paymentCount,
    };
  }

  /**
   * Refresh MNEE balance from chain
   */
  async refreshBalance(): Promise<bigint> {
    this._mneeBalance = await this.mneeContract.balanceOf(this.wallet.address);
    return this._mneeBalance;
  }

  /**
   * Check if agent is initialized
   */
  get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Get the underlying wallet (for advanced operations)
   */
  getWallet(): Wallet {
    return this.wallet;
  }

  /**
   * Get the MNEE contract instance
   */
  getMneeContract(): Contract {
    return this.mneeContract;
  }

  /**
   * Get the FlowPay contract instance
   */
  getFlowPayContract(): Contract {
    return this.flowPayContract;
  }

  /**
   * Get the provider instance
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Create a payment stream to a recipient
   * Requirements: 4.1, 4.2, 4.3, 4.4
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

      // Check budget before proceeding (Requirements: 1.5, 3.4)
      this.checkBudget(amount);

      // Step 1: Approve MNEE tokens to FlowPay contract (Requirements: 4.1)
      const currentAllowance = await this.mneeContract.allowance(
        this.wallet.address,
        this.config.flowPayContract
      );

      if (currentAllowance < amount) {
        const approveTx = await this.mneeContract.approve(
          this.config.flowPayContract,
          amount
        );
        await approveTx.wait();
      }

      // Step 2: Build metadata (Requirements: 4.3)
      const metadata: StreamMetadata = {
        agentId: this.config.name,
        timestamp: Date.now(),
        serviceUrl: serviceUrl,
        purpose: purpose,
      };
      const metadataString = JSON.stringify(metadata);

      // Step 3: Create stream on FlowPay contract (Requirements: 4.2)
      const createTx = await this.flowPayContract.createStream(
        requirement.recipient,
        duration,
        amount,
        metadataString
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
        const parsed = this.flowPayContract.interface.parseLog({
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
          headers['x-flowpay-stream-id'] = cachedStream.streamId;
          streamId = cachedStream.streamId;
        }

        // Add stream ID from payment if we just made one (Requirements: 5.2)
        if (streamId && retryCount > 0) {
          headers['x-flowpay-stream-id'] = streamId;
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
        
        // If we haven't exhausted retries, continue
        if (retryCount < maxRetries) {
          // Exponential backoff
          await this.delay(1000 * Math.pow(2, retryCount - 1));
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
}
