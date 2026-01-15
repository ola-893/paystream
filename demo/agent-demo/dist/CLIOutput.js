"use strict";
/**
 * CLIOutput Manager
 *
 * Handles all terminal output with colors, spinners, and formatting.
 * Provides rich visual feedback for the agent demo.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIOutput = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
/**
 * CLIOutput class for rich terminal output
 *
 * Provides methods for displaying agent activity with emoji indicators,
 * progress spinners, formatted tables, and Etherscan links.
 */
class CLIOutput {
    constructor(config) {
        this.spinner = null;
        this.config = config;
    }
    // ============================================
    // Status Indicator Methods (Requirements: 6.1, 6.2)
    // ============================================
    /**
     * Display agent action message
     * Emoji: 🤖
     */
    agent(message) {
        if (this.config.quiet)
            return;
        console.log(chalk_1.default.cyan(`🤖 ${message}`));
    }
    /**
     * Display HTTP request message
     * Emoji: 📡
     */
    request(message) {
        if (this.config.quiet)
            return;
        console.log(chalk_1.default.blue(`📡 ${message}`));
    }
    /**
     * Display payment action message
     * Emoji: 💳
     */
    payment(message) {
        if (this.config.quiet)
            return;
        console.log(chalk_1.default.magenta(`💳 ${message}`));
    }
    /**
     * Display success message
     * Emoji: ✅
     */
    success(message) {
        if (this.config.quiet)
            return;
        console.log(chalk_1.default.green(`✅ ${message}`));
    }
    /**
     * Display error message
     * Emoji: ❌
     */
    error(message) {
        // Errors are always shown, even in quiet mode
        console.log(chalk_1.default.red(`❌ ${message}`));
    }
    /**
     * Display warning message
     * Emoji: ⚠️
     */
    warning(message) {
        if (this.config.quiet)
            return;
        console.log(chalk_1.default.yellow(`⚠️  ${message}`));
    }
    /**
     * Display verbose/debug message
     * Only shown when verbose mode is enabled
     */
    debug(message) {
        if (!this.config.verbose)
            return;
        console.log(chalk_1.default.gray(`   [debug] ${message}`));
    }
    /**
     * Display info message (no emoji)
     */
    info(message) {
        if (this.config.quiet)
            return;
        console.log(chalk_1.default.white(`   ${message}`));
    }
    // ============================================
    // Progress Spinner Methods (Requirements: 6.4)
    // ============================================
    /**
     * Start a progress spinner for long-running operations
     * @param message - The message to display with the spinner
     */
    startSpinner(message) {
        if (this.config.quiet)
            return;
        // Stop any existing spinner first
        if (this.spinner) {
            this.spinner.stop();
        }
        this.spinner = (0, ora_1.default)({
            text: message,
            color: 'cyan',
            spinner: 'dots',
        }).start();
    }
    /**
     * Update the spinner text
     * @param message - New message to display
     */
    updateSpinner(message) {
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.text = message;
        }
    }
    /**
     * Stop the spinner with success or failure indication
     * @param success - Whether the operation succeeded
     * @param message - Optional message to display
     */
    stopSpinner(success, message) {
        if (!this.spinner)
            return;
        if (success) {
            this.spinner.succeed(message ? chalk_1.default.green(message) : undefined);
        }
        else {
            this.spinner.fail(message ? chalk_1.default.red(message) : undefined);
        }
        this.spinner = null;
    }
    /**
     * Stop the spinner with a warning indication
     * @param message - Warning message to display
     */
    warnSpinner(message) {
        if (!this.spinner)
            return;
        this.spinner.warn(chalk_1.default.yellow(message));
        this.spinner = null;
    }
    // ============================================
    // Box and Table Formatting (Requirements: 6.5, 6.7)
    // ============================================
    /**
     * Display content in a box with title
     * Uses box-drawing characters for visual separation
     * @param title - Box title
     * @param content - Array of content lines
     */
    box(title, content) {
        if (this.config.quiet)
            return;
        const maxWidth = Math.max(title.length + 4, ...content.map(line => line.length + 4));
        const width = Math.min(maxWidth, 80);
        const horizontalLine = '─'.repeat(width - 2);
        const topBorder = `┌${horizontalLine}┐`;
        const bottomBorder = `└${horizontalLine}┘`;
        console.log('');
        console.log(chalk_1.default.cyan(topBorder));
        console.log(chalk_1.default.cyan(`│ ${chalk_1.default.bold(title.padEnd(width - 4))} │`));
        console.log(chalk_1.default.cyan(`├${horizontalLine}┤`));
        for (const line of content) {
            const paddedLine = line.padEnd(width - 4);
            console.log(chalk_1.default.cyan(`│ ${chalk_1.default.white(paddedLine)} │`));
        }
        console.log(chalk_1.default.cyan(bottomBorder));
        console.log('');
    }
    /**
     * Display a formatted table
     * @param headers - Column headers
     * @param rows - Table rows (array of arrays)
     */
    table(headers, rows) {
        if (this.config.quiet)
            return;
        const table = new cli_table3_1.default({
            head: headers.map(h => chalk_1.default.cyan.bold(h)),
            style: {
                head: [],
                border: ['gray'],
            },
            chars: {
                'top': '─',
                'top-mid': '┬',
                'top-left': '┌',
                'top-right': '┐',
                'bottom': '─',
                'bottom-mid': '┴',
                'bottom-left': '└',
                'bottom-right': '┘',
                'left': '│',
                'left-mid': '├',
                'mid': '─',
                'mid-mid': '┼',
                'right': '│',
                'right-mid': '┤',
                'middle': '│',
            },
        });
        for (const row of rows) {
            table.push(row);
        }
        console.log('');
        console.log(table.toString());
        console.log('');
    }
    // ============================================
    // Etherscan Link Formatting (Requirements: 6.3)
    // ============================================
    /**
     * Generate an Etherscan URL for a transaction hash
     * Format: https://sepolia.etherscan.io/tx/{hash}
     * @param txHash - The transaction hash
     * @returns Formatted Etherscan URL
     */
    etherscanLink(txHash) {
        return `https://sepolia.etherscan.io/tx/${txHash}`;
    }
    /**
     * Display a transaction hash with Etherscan link
     * @param txHash - The transaction hash
     * @param label - Optional label for the transaction
     */
    displayTxHash(txHash, label) {
        if (this.config.quiet)
            return;
        const url = this.etherscanLink(txHash);
        const prefix = label ? `${label}: ` : 'Transaction: ';
        console.log(chalk_1.default.gray(`   ${prefix}${chalk_1.default.underline.blue(url)}`));
    }
    // ============================================
    // Scenario Display Methods (Requirements: 6.5)
    // ============================================
    /**
     * Display scenario start header
     * @param name - Scenario name
     * @param description - Scenario description
     */
    scenarioStart(name, description) {
        if (this.config.quiet)
            return;
        this.box(`Scenario: ${name}`, [description]);
    }
    /**
     * Display scenario end separator
     */
    scenarioEnd() {
        if (this.config.quiet)
            return;
        console.log(chalk_1.default.gray('─'.repeat(60)));
        console.log('');
    }
    // ============================================
    // Summary Display (Requirements: 6.7)
    // ============================================
    /**
     * Display demo summary with statistics
     * @param stats - Demo statistics
     */
    summary(stats) {
        // Summary is always shown, even in quiet mode
        console.log('');
        console.log(chalk_1.default.cyan.bold('═'.repeat(60)));
        console.log(chalk_1.default.cyan.bold('                    DEMO SUMMARY'));
        console.log(chalk_1.default.cyan.bold('═'.repeat(60)));
        console.log('');
        // Create summary table
        const table = new cli_table3_1.default({
            style: {
                head: [],
                border: ['gray'],
            },
            chars: {
                'top': '─',
                'top-mid': '┬',
                'top-left': '┌',
                'top-right': '┐',
                'bottom': '─',
                'bottom-mid': '┴',
                'bottom-left': '└',
                'bottom-right': '┘',
                'left': '│',
                'left-mid': '├',
                'mid': '─',
                'mid-mid': '┼',
                'right': '│',
                'right-mid': '┤',
                'middle': '│',
            },
        });
        const passRate = stats.scenariosRun > 0
            ? ((stats.scenariosPassed / stats.scenariosRun) * 100).toFixed(1)
            : '0.0';
        // Format total spent (convert from wei to MNEE with 18 decimals)
        const totalSpentMNEE = this.formatMNEE(stats.totalSpent);
        table.push([chalk_1.default.white('Scenarios Run'), chalk_1.default.cyan(stats.scenariosRun.toString())], [chalk_1.default.white('Scenarios Passed'), chalk_1.default.green(stats.scenariosPassed.toString())], [chalk_1.default.white('Pass Rate'), chalk_1.default.cyan(`${passRate}%`)], [chalk_1.default.white('Total Payments'), chalk_1.default.magenta(stats.totalPayments.toString())], [chalk_1.default.white('Total Spent'), chalk_1.default.magenta(`${totalSpentMNEE} MNEE`)], [chalk_1.default.white('Streams Created'), chalk_1.default.blue(stats.streamsCreated.toString())], [chalk_1.default.white('Streams Reused'), chalk_1.default.blue(stats.streamsReused.toString())]);
        console.log(table.toString());
        // Display errors if any
        if (stats.errors.length > 0) {
            console.log('');
            console.log(chalk_1.default.red.bold('Errors:'));
            for (const error of stats.errors) {
                console.log(chalk_1.default.red(`  ❌ ${error}`));
            }
        }
        console.log('');
        console.log(chalk_1.default.cyan.bold('═'.repeat(60)));
        console.log('');
    }
    /**
     * Format a bigint value as MNEE (18 decimals)
     * @param value - Value in wei
     * @returns Formatted string
     */
    formatMNEE(value) {
        const decimals = 18n;
        const divisor = 10n ** decimals;
        const wholePart = value / divisor;
        const fractionalPart = value % divisor;
        // Format fractional part with leading zeros
        const fractionalStr = fractionalPart.toString().padStart(18, '0');
        // Trim trailing zeros but keep at least 4 decimal places
        const trimmedFractional = fractionalStr.slice(0, 6).replace(/0+$/, '') || '0';
        return `${wholePart}.${trimmedFractional}`;
    }
}
exports.CLIOutput = CLIOutput;
//# sourceMappingURL=CLIOutput.js.map