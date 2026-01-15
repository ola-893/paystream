/**
 * DemoRunner - Scenario Orchestration
 * 
 * Orchestrates multiple demo scenarios showcasing AI agents
 * autonomously triggering payments via x402 protocol and FlowPay.
 * 
 * Requirements: 6.1, 6.5, 6.7, 7.1, 7.2, 7.3
 */

import { ethers } from 'ethers';
import { PaymentAgent, FetchResult } from './PaymentAgent';
import { CLIOutput, DemoStats } from './CLIOutput';
import { ALL_SCENARIOS } from './scenarios';

/**
 * Demo scenario definition
 * Requirements: 7.1, 7.2
 */
export interface Scenario {
  name: string;
  description: string;
  endpoint: string;
  expectedMode: 'streaming' | 'per-request';
  expectedPrice: string;
  shouldSucceed: boolean;  // false for budget-exceeded scenarios
}

/**
 * Result of running a single scenario
 */
export interface ScenarioResult {
  scenario: Scenario;
  success: boolean;
  paymentMade: boolean;
  streamId?: string;
  txHash?: string;
  responseData?: any;
  error?: string;
  streamReused: boolean;
  duration: number;  // milliseconds
}

/**
 * Setup status for pre-flight checks
 */
export interface SetupStatus {
  walletConnected: boolean;
  walletBalance: bigint;
  contractAccessible: boolean;
  serverReachable: boolean;
  errors: string[];
}

/**
 * Default demo scenarios with different pricing
 * Requirements: 7.1, 7.2, 7.3, 7.5
 * 
 * These scenarios demonstrate:
 * - Streaming mode payments (Weather API)
 * - Per-request mode payments (Premium API)
 * - Stream reuse for same host
 * - Budget exceeded handling
 * 
 * Imported from scenarios.ts for modularity
 */
export const DEFAULT_SCENARIOS: Scenario[] = ALL_SCENARIOS;


/**
 * DemoRunner class for orchestrating demo scenarios
 * 
 * Manages the execution of multiple payment scenarios,
 * tracks statistics, and provides summary output.
 * 
 * Requirements: 6.1, 6.5, 6.7, 7.1, 7.2, 7.3
 */
export class DemoRunner {
  private agent: PaymentAgent;
  private cli: CLIOutput;
  private serverUrl: string;
  private scenarios: Scenario[];
  
  // Statistics tracking
  private stats: DemoStats = {
    scenariosRun: 0,
    scenariosPassed: 0,
    totalPayments: 0,
    totalSpent: 0n,
    streamsCreated: 0,
    streamsReused: 0,
    errors: [],
  };
  
  // Track which hosts have had streams created
  private hostsWithStreams: Set<string> = new Set();

  constructor(
    agent: PaymentAgent,
    cli: CLIOutput,
    serverUrl: string = 'http://localhost:3001',
    scenarios: Scenario[] = DEFAULT_SCENARIOS
  ) {
    this.agent = agent;
    this.cli = cli;
    this.serverUrl = serverUrl;
    this.scenarios = scenarios;
  }

  /**
   * Get the list of available scenarios
   */
  getScenarios(): Scenario[] {
    return [...this.scenarios];
  }

  /**
   * Get current statistics
   */
  getStats(): DemoStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics for a new run
   */
  resetStats(): void {
    this.stats = {
      scenariosRun: 0,
      scenariosPassed: 0,
      totalPayments: 0,
      totalSpent: 0n,
      streamsCreated: 0,
      streamsReused: 0,
      errors: [],
    };
    this.hostsWithStreams.clear();
  }

  /**
   * Filter scenarios by name pattern
   * Requirements: 9.4
   * 
   * @param filter - Scenario name or pattern to match
   * @returns Filtered list of scenarios
   */
  filterScenarios(filter: string): Scenario[] {
    const lowerFilter = filter.toLowerCase();
    return this.scenarios.filter(s => 
      s.name.toLowerCase().includes(lowerFilter) ||
      s.description.toLowerCase().includes(lowerFilter)
    );
  }


  /**
   * Run a single demo scenario
   * Requirements: 6.1, 6.5, 8.1, 8.5
   * 
   * @param scenario - The scenario to run
   * @returns ScenarioResult with outcome details
   */
  async runScenario(scenario: Scenario): Promise<ScenarioResult> {
    const startTime = Date.now();
    
    let url: string;
    let host: string;
    let hadExistingStream = false;
    let existingStream: any;
    
    try {
      // Display scenario header with box formatting (Requirements: 6.5)
      this.cli.scenarioStart(scenario.name, scenario.description);
      
      // Build full URL
      url = `${this.serverUrl}${scenario.endpoint}`;
      host = new URL(url).host;
      
      // Check if we already have a stream for this host
      existingStream = this.agent.getCachedStream(host);
      hadExistingStream = !!existingStream;
      
      if (hadExistingStream) {
        this.cli.info(`Reusing existing stream: ${existingStream.streamId}`);
      }
      
      // Display request info (Requirements: 6.1)
      this.cli.request(`Making request to ${url}`);
      this.cli.info(`Expected mode: ${scenario.expectedMode}`);
      this.cli.info(`Expected price: ${scenario.expectedPrice} MNEE`);
    } catch (setupError: any) {
      // Handle errors during scenario setup (Requirements: 8.1, 8.5)
      this.cli.error(`Scenario setup failed: ${setupError.message}`);
      return {
        scenario,
        success: false,
        paymentMade: false,
        error: `Setup error: ${setupError.message}`,
        streamReused: false,
        duration: Date.now() - startTime,
      };
    }
    
    let result: ScenarioResult;
    
    try {
      // Execute the fetch with x402 handling
      this.cli.startSpinner('Executing request...');
      const fetchResult: FetchResult = await this.agent.fetch(url);
      
      // Determine if stream was reused
      const streamReused = hadExistingStream && 
        fetchResult.streamId === existingStream?.streamId;
      
      if (fetchResult.success) {
        this.cli.stopSpinner(true, 'Request successful');
        
        // Display success details
        this.cli.success(`Response received (HTTP ${fetchResult.status})`);
        
        if (fetchResult.paymentMade) {
          // Check if this is a dry-run payment (mock tx hash starts with 0xdryrun)
          const isDryRunPayment = fetchResult.txHash?.startsWith('0xdryrun');
          const paymentLabel = isDryRunPayment ? 'Simulated payment' : 'Payment made';
          
          this.cli.payment(`${paymentLabel}: ${fetchResult.streamId ? 'Stream created' : 'Direct payment'}`);
          
          if (fetchResult.txHash) {
            if (isDryRunPayment) {
              // For dry-run, show mock tx hash without Etherscan link
              this.cli.info(`   Mock Transaction: ${fetchResult.txHash}`);
            } else {
              this.cli.displayTxHash(fetchResult.txHash, 'Transaction');
            }
          }
          
          if (fetchResult.streamId) {
            const streamLabel = fetchResult.streamId.startsWith('mock-stream-') 
              ? 'Mock Stream ID' 
              : 'Stream ID';
            this.cli.info(`${streamLabel}: ${fetchResult.streamId}`);
          }
        } else if (streamReused) {
          this.cli.info('Used existing payment stream (no new payment needed)');
        }
        
        // Display response data preview
        if (fetchResult.data) {
          const dataPreview = typeof fetchResult.data === 'string' 
            ? fetchResult.data.slice(0, 100)
            : JSON.stringify(fetchResult.data).slice(0, 100);
          this.cli.info(`Response: ${dataPreview}${dataPreview.length >= 100 ? '...' : ''}`);
        }
        
        result = {
          scenario,
          success: true,
          paymentMade: fetchResult.paymentMade || false,
          streamId: fetchResult.streamId,
          txHash: fetchResult.txHash,
          responseData: fetchResult.data,
          streamReused,
          duration: Date.now() - startTime,
        };
        
      } else {
        // Request failed
        this.cli.stopSpinner(false, 'Request failed');
        
        // Check if this was expected (budget-exceeded scenario)
        const wasExpectedFailure = !scenario.shouldSucceed;
        
        if (wasExpectedFailure) {
          this.cli.warning(`Expected failure: ${fetchResult.error}`);
          result = {
            scenario,
            success: true,  // Expected failure counts as success
            paymentMade: false,
            error: fetchResult.error,
            streamReused: false,
            duration: Date.now() - startTime,
          };
        } else {
          this.cli.error(`Unexpected failure: ${fetchResult.error}`);
          result = {
            scenario,
            success: false,
            paymentMade: false,
            error: fetchResult.error,
            streamReused: false,
            duration: Date.now() - startTime,
          };
        }
      }
      
    } catch (error: any) {
      this.cli.stopSpinner(false, 'Scenario error');
      // Log error without crashing (Requirements: 8.1, 8.5)
      this.cli.error(`Error during scenario execution: ${error.message}`);
      
      result = {
        scenario,
        success: false,
        paymentMade: false,
        error: error.message || 'Unknown error during scenario execution',
        streamReused: false,
        duration: Date.now() - startTime,
      };
    }
    
    // Update statistics
    this.updateStats(result, hadExistingStream);
    
    // Display scenario end separator
    this.cli.scenarioEnd();
    
    return result;
  }

  /**
   * Update statistics based on scenario result
   * @param result - The scenario result
   * @param hadExistingStream - Whether there was an existing stream before this scenario
   */
  private updateStats(result: ScenarioResult, hadExistingStream: boolean): void {
    this.stats.scenariosRun++;
    
    if (result.success) {
      this.stats.scenariosPassed++;
    } else {
      this.stats.errors.push(`${result.scenario.name}: ${result.error || 'Unknown error'}`);
    }
    
    if (result.paymentMade) {
      this.stats.totalPayments++;
      
      // Calculate amount spent based on scenario
      const amount = result.scenario.expectedMode === 'streaming'
        ? ethers.parseEther(result.scenario.expectedPrice) * 3600n  // 1 hour of streaming
        : ethers.parseEther(result.scenario.expectedPrice);
      this.stats.totalSpent += amount;
      
      // Track stream creation vs reuse
      if (result.streamId) {
        const host = new URL(`${this.serverUrl}${result.scenario.endpoint}`).host;
        if (!this.hostsWithStreams.has(host)) {
          this.stats.streamsCreated++;
          this.hostsWithStreams.add(host);
        }
      }
    }
    
    if (result.streamReused) {
      this.stats.streamsReused++;
    }
  }


  /**
   * Run all scenarios (or filtered by pattern)
   * Requirements: 6.7, 7.1, 8.1, 8.5
   * 
   * @param filter - Optional filter to run specific scenarios
   * @returns DemoStats with summary of all scenarios
   */
  async runAll(filter?: string): Promise<DemoStats> {
    // Reset stats for fresh run
    this.resetStats();
    
    // Get scenarios to run
    const scenariosToRun = filter 
      ? this.filterScenarios(filter)
      : this.scenarios;
    
    if (scenariosToRun.length === 0) {
      this.cli.warning(`No scenarios match filter: "${filter}"`);
      return this.stats;
    }
    
    // Display run header
    const headerLines = [
      `Scenarios to run: ${scenariosToRun.length}`,
      `Server URL: ${this.serverUrl}`,
      `Agent: ${this.agent.name}`,
      `Budget: ${ethers.formatEther(this.agent.dailyBudget)} MNEE`,
    ];
    
    // Add dry-run indicator if applicable (Requirements: 9.7)
    if (this.agent.isDryRun) {
      headerLines.push('');
      headerLines.push('⚠️  DRY-RUN MODE - No real transactions');
    }
    
    this.cli.box('Demo Run Starting', headerLines);
    
    // Store results for potential detailed output
    const results: ScenarioResult[] = [];
    
    // Run each scenario with error handling (Requirements: 8.1, 8.5)
    for (let i = 0; i < scenariosToRun.length; i++) {
      const scenario = scenariosToRun[i];
      
      this.cli.info(`\n[${i + 1}/${scenariosToRun.length}] Running scenario: ${scenario.name}`);
      
      try {
        const result = await this.runScenario(scenario);
        results.push(result);
      } catch (error: any) {
        // Log error and continue to next scenario (Requirements: 8.1, 8.5)
        this.cli.error(`Scenario "${scenario.name}" failed with error: ${error.message}`);
        
        // Create a failed result for this scenario
        const failedResult: ScenarioResult = {
          scenario,
          success: false,
          paymentMade: false,
          error: error.message || 'Unknown error',
          streamReused: false,
          duration: 0,
        };
        results.push(failedResult);
        
        // Update stats for the failed scenario
        this.stats.scenariosRun++;
        this.stats.errors.push(`${scenario.name}: ${error.message || 'Unknown error'}`);
        
        // Display scenario end separator
        this.cli.scenarioEnd();
      }
      
      // Small delay between scenarios for readability
      if (i < scenariosToRun.length - 1) {
        await this.delay(500);
      }
    }
    
    // Display summary table (Requirements: 6.7)
    this.displaySummary(results);
    
    // Cancel all active streams and get refunds
    await this.cancelAllActiveStreams();
    
    return this.stats;
  }

  /**
   * Cancel all active streams at the end of the demo
   * 
   * This ensures:
   * 1. All streams are properly closed
   * 2. Unused funds are refunded to the agent
   * 3. Resources are cleaned up
   */
  private async cancelAllActiveStreams(): Promise<void> {
    const activeStreams = this.agent.getActiveStreams();
    
    if (activeStreams.size === 0) {
      return;
    }
    
    this.cli.info('\n');
    this.cli.box('Closing Payment Streams', [
      `Active streams to close: ${activeStreams.size}`,
      'Cancelling streams and refunding unused funds...',
    ]);
    
    let totalRefunded = 0n;
    let successCount = 0;
    let failCount = 0;
    
    for (const [host, streamInfo] of activeStreams) {
      this.cli.startSpinner(`Cancelling stream #${streamInfo.streamId} for ${host}...`);
      
      try {
        const result = await this.agent.cancelStream(streamInfo.streamId);
        
        if (result.success) {
          successCount++;
          const refundAmount = result.amount || 0n;
          totalRefunded += refundAmount;
          
          this.cli.stopSpinner(true, `Stream #${streamInfo.streamId} cancelled`);
          
          if (result.txHash) {
            // Check if dry-run
            if (result.txHash.startsWith('0xdryrun')) {
              this.cli.info(`   Mock cancellation TX: ${result.txHash}`);
            } else {
              this.cli.displayTxHash(result.txHash, '   Cancellation TX');
            }
          }
          
          if (refundAmount > 0n) {
            this.cli.success(`   Refunded: ${ethers.formatEther(refundAmount)} MNEE`);
          }
        } else {
          failCount++;
          this.cli.stopSpinner(false, `Failed to cancel stream #${streamInfo.streamId}`);
          this.cli.error(`   Error: ${result.error}`);
        }
      } catch (error: any) {
        failCount++;
        this.cli.stopSpinner(false, `Error cancelling stream #${streamInfo.streamId}`);
        this.cli.error(`   Error: ${error.message}`);
      }
    }
    
    // Display stream closure summary
    this.cli.info('');
    const closureSummary = [
      `Streams closed: ${successCount}/${activeStreams.size}`,
      `Total refunded: ${ethers.formatEther(totalRefunded)} MNEE`,
    ];
    
    if (failCount > 0) {
      closureSummary.push(`Failed to close: ${failCount}`);
    }
    
    this.cli.box('Stream Closure Summary', closureSummary);
    
    // Update stats with refund
    if (totalRefunded > 0n) {
      this.stats.totalSpent -= totalRefunded;
      if (this.stats.totalSpent < 0n) {
        this.stats.totalSpent = 0n;
      }
    }
  }

  /**
   * Display summary table of all scenario results
   * Requirements: 6.7
   * 
   * @param results - Array of scenario results
   */
  private displaySummary(results: ScenarioResult[]): void {
    // Build results table
    const headers = ['Scenario', 'Status', 'Payment', 'Stream', 'Duration'];
    const rows: string[][] = results.map(r => [
      r.scenario.name,
      r.success ? '✅ Pass' : '❌ Fail',
      r.paymentMade ? '💳 Yes' : '—',
      r.streamReused ? '♻️ Reused' : (r.streamId ? '🆕 New' : '—'),
      `${r.duration}ms`,
    ]);
    
    this.cli.table(headers, rows);
    
    // Display overall summary
    this.cli.summary(this.stats);
  }

  /**
   * Check setup prerequisites
   * Requirements: 9.6, 8.2
   * 
   * @returns SetupStatus with check results
   */
  async checkSetup(): Promise<SetupStatus> {
    const status: SetupStatus = {
      walletConnected: false,
      walletBalance: 0n,
      contractAccessible: false,
      serverReachable: false,
      errors: [],
    };
    
    // Check wallet connection
    this.cli.startSpinner('Checking wallet connection...');
    try {
      const balance = await this.agent.refreshBalance();
      status.walletConnected = true;
      status.walletBalance = balance;
      this.cli.stopSpinner(true, `Wallet connected: ${ethers.formatEther(balance)} MNEE`);
    } catch (error: any) {
      status.errors.push(`Wallet: ${error.message}`);
      this.cli.stopSpinner(false, `Wallet connection failed: ${error.message}`);
    }
    
    // Check contract accessibility
    this.cli.startSpinner('Checking FlowPay contract...');
    try {
      const contract = this.agent.getFlowPayContract();
      // Try to call a view function to verify contract is accessible
      await contract.getAddress();
      status.contractAccessible = true;
      this.cli.stopSpinner(true, 'FlowPay contract accessible');
    } catch (error: any) {
      status.errors.push(`Contract: ${error.message}`);
      this.cli.stopSpinner(false, `Contract check failed: ${error.message}`);
    }
    
    // Check server reachability with exponential backoff (Requirements: 8.2)
    this.cli.startSpinner(`Checking server at ${this.serverUrl}...`);
    const maxAttempts = 3;
    let lastServerError: string | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.serverUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        status.serverReachable = response.ok || response.status === 404;
        this.cli.stopSpinner(true, `Server reachable (HTTP ${response.status})`);
        lastServerError = undefined;
        break;
      } catch (error: any) {
        lastServerError = error.message;
        
        if (attempt < maxAttempts) {
          // Apply exponential backoff before retry (Requirements: 8.2)
          const backoffDelay = this.calculateExponentialBackoff(attempt);
          this.cli.updateSpinner(`Server unreachable, retrying in ${backoffDelay / 1000}s (attempt ${attempt}/${maxAttempts})...`);
          await this.delay(backoffDelay);
        }
      }
    }
    
    if (lastServerError) {
      status.errors.push(`Server: ${lastServerError}`);
      this.cli.stopSpinner(false, `Server unreachable after ${maxAttempts} attempts: ${lastServerError}`);
    }
    
    // Display overall status
    const allGood = status.walletConnected && status.contractAccessible && status.serverReachable;
    
    if (allGood) {
      this.cli.success('\nAll setup checks passed! Ready to run demo.');
    } else {
      this.cli.error('\nSome setup checks failed. Please fix the issues above.');
    }
    
    return status;
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

  /**
   * Update spinner text (wrapper for CLI)
   * @param message - New message to display
   */
  private updateSpinner(message: string): void {
    this.cli.updateSpinner(message);
  }

  /**
   * Helper method to delay execution
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
