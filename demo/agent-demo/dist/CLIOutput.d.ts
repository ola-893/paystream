/**
 * CLIOutput Manager
 *
 * Handles all terminal output with colors, spinners, and formatting.
 * Provides rich visual feedback for the agent demo.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8
 */
/**
 * Configuration for CLI output behavior
 */
export interface CLIConfig {
    verbose: boolean;
    quiet: boolean;
    noColor?: boolean;
}
/**
 * Demo statistics for summary display
 */
export interface DemoStats {
    scenariosRun: number;
    scenariosPassed: number;
    totalPayments: number;
    totalSpent: bigint;
    streamsCreated: number;
    streamsReused: number;
    errors: string[];
}
/**
 * CLIOutput class for rich terminal output
 *
 * Provides methods for displaying agent activity with emoji indicators,
 * progress spinners, formatted tables, and Etherscan links.
 */
export declare class CLIOutput {
    private config;
    private spinner;
    constructor(config: CLIConfig);
    /**
     * Display agent action message
     * Emoji: 🤖
     */
    agent(message: string): void;
    /**
     * Display HTTP request message
     * Emoji: 📡
     */
    request(message: string): void;
    /**
     * Display payment action message
     * Emoji: 💳
     */
    payment(message: string): void;
    /**
     * Display success message
     * Emoji: ✅
     */
    success(message: string): void;
    /**
     * Display error message
     * Emoji: ❌
     */
    error(message: string): void;
    /**
     * Display warning message
     * Emoji: ⚠️
     */
    warning(message: string): void;
    /**
     * Display verbose/debug message
     * Only shown when verbose mode is enabled
     */
    debug(message: string): void;
    /**
     * Display info message (no emoji)
     */
    info(message: string): void;
    /**
     * Start a progress spinner for long-running operations
     * @param message - The message to display with the spinner
     */
    startSpinner(message: string): void;
    /**
     * Update the spinner text
     * @param message - New message to display
     */
    updateSpinner(message: string): void;
    /**
     * Stop the spinner with success or failure indication
     * @param success - Whether the operation succeeded
     * @param message - Optional message to display
     */
    stopSpinner(success: boolean, message?: string): void;
    /**
     * Stop the spinner with a warning indication
     * @param message - Warning message to display
     */
    warnSpinner(message: string): void;
    /**
     * Display content in a box with title
     * Uses box-drawing characters for visual separation
     * @param title - Box title
     * @param content - Array of content lines
     */
    box(title: string, content: string[]): void;
    /**
     * Display a formatted table
     * @param headers - Column headers
     * @param rows - Table rows (array of arrays)
     */
    table(headers: string[], rows: string[][]): void;
    /**
     * Generate an Etherscan URL for a transaction hash
     * Format: https://sepolia.etherscan.io/tx/{hash}
     * @param txHash - The transaction hash
     * @returns Formatted Etherscan URL
     */
    etherscanLink(txHash: string): string;
    /**
     * Display a transaction hash with Etherscan link
     * @param txHash - The transaction hash
     * @param label - Optional label for the transaction
     */
    displayTxHash(txHash: string, label?: string): void;
    /**
     * Display scenario start header
     * @param name - Scenario name
     * @param description - Scenario description
     */
    scenarioStart(name: string, description: string): void;
    /**
     * Display scenario end separator
     */
    scenarioEnd(): void;
    /**
     * Display demo summary with statistics
     * @param stats - Demo statistics
     */
    summary(stats: DemoStats): void;
    /**
     * Format a bigint value as MNEE (18 decimals)
     * @param value - Value in wei
     * @returns Formatted string
     */
    private formatMNEE;
}
//# sourceMappingURL=CLIOutput.d.ts.map