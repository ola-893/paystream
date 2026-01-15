/**
 * DemoRunner - Scenario Orchestration
 *
 * Orchestrates multiple demo scenarios showcasing AI agents
 * autonomously triggering payments via x402 protocol and FlowPay.
 *
 * Requirements: 6.1, 6.5, 6.7, 7.1, 7.2, 7.3
 */
import { PaymentAgent } from './PaymentAgent';
import { CLIOutput, DemoStats } from './CLIOutput';
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
    shouldSucceed: boolean;
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
    duration: number;
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
export declare const DEFAULT_SCENARIOS: Scenario[];
/**
 * DemoRunner class for orchestrating demo scenarios
 *
 * Manages the execution of multiple payment scenarios,
 * tracks statistics, and provides summary output.
 *
 * Requirements: 6.1, 6.5, 6.7, 7.1, 7.2, 7.3
 */
export declare class DemoRunner {
    private agent;
    private cli;
    private serverUrl;
    private scenarios;
    private stats;
    private hostsWithStreams;
    constructor(agent: PaymentAgent, cli: CLIOutput, serverUrl?: string, scenarios?: Scenario[]);
    /**
     * Get the list of available scenarios
     */
    getScenarios(): Scenario[];
    /**
     * Get current statistics
     */
    getStats(): DemoStats;
    /**
     * Reset statistics for a new run
     */
    resetStats(): void;
    /**
     * Filter scenarios by name pattern
     * Requirements: 9.4
     *
     * @param filter - Scenario name or pattern to match
     * @returns Filtered list of scenarios
     */
    filterScenarios(filter: string): Scenario[];
    /**
     * Run a single demo scenario
     * Requirements: 6.1, 6.5, 8.1, 8.5
     *
     * @param scenario - The scenario to run
     * @returns ScenarioResult with outcome details
     */
    runScenario(scenario: Scenario): Promise<ScenarioResult>;
    /**
     * Update statistics based on scenario result
     * @param result - The scenario result
     * @param hadExistingStream - Whether there was an existing stream before this scenario
     */
    private updateStats;
    /**
     * Run all scenarios (or filtered by pattern)
     * Requirements: 6.7, 7.1, 8.1, 8.5
     *
     * @param filter - Optional filter to run specific scenarios
     * @returns DemoStats with summary of all scenarios
     */
    runAll(filter?: string): Promise<DemoStats>;
    /**
     * Display summary table of all scenario results
     * Requirements: 6.7
     *
     * @param results - Array of scenario results
     */
    private displaySummary;
    /**
     * Check setup prerequisites
     * Requirements: 9.6, 8.2
     *
     * @returns SetupStatus with check results
     */
    checkSetup(): Promise<SetupStatus>;
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
    /**
     * Update spinner text (wrapper for CLI)
     * @param message - New message to display
     */
    private updateSpinner;
    /**
     * Helper method to delay execution
     * @param ms - Milliseconds to delay
     */
    private delay;
}
//# sourceMappingURL=DemoRunner.d.ts.map