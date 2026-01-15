/**
 * CLIOutput Manager
 * 
 * Handles all terminal output with colors, spinners, and formatting.
 * Provides rich visual feedback for the agent demo.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import Table from 'cli-table3';

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
export class CLIOutput {
  private config: CLIConfig;
  private spinner: Ora | null = null;

  constructor(config: CLIConfig) {
    this.config = config;
  }


  // ============================================
  // Status Indicator Methods (Requirements: 6.1, 6.2)
  // ============================================

  /**
   * Display agent action message
   * Emoji: 🤖
   */
  agent(message: string): void {
    if (this.config.quiet) return;
    console.log(chalk.cyan(`🤖 ${message}`));
  }

  /**
   * Display HTTP request message
   * Emoji: 📡
   */
  request(message: string): void {
    if (this.config.quiet) return;
    console.log(chalk.blue(`📡 ${message}`));
  }

  /**
   * Display payment action message
   * Emoji: 💳
   */
  payment(message: string): void {
    if (this.config.quiet) return;
    console.log(chalk.magenta(`💳 ${message}`));
  }

  /**
   * Display success message
   * Emoji: ✅
   */
  success(message: string): void {
    if (this.config.quiet) return;
    console.log(chalk.green(`✅ ${message}`));
  }

  /**
   * Display error message
   * Emoji: ❌
   */
  error(message: string): void {
    // Errors are always shown, even in quiet mode
    console.log(chalk.red(`❌ ${message}`));
  }

  /**
   * Display warning message
   * Emoji: ⚠️
   */
  warning(message: string): void {
    if (this.config.quiet) return;
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  /**
   * Display verbose/debug message
   * Only shown when verbose mode is enabled
   */
  debug(message: string): void {
    if (!this.config.verbose) return;
    console.log(chalk.gray(`   [debug] ${message}`));
  }

  /**
   * Display info message (no emoji)
   */
  info(message: string): void {
    if (this.config.quiet) return;
    console.log(chalk.white(`   ${message}`));
  }


  // ============================================
  // Progress Spinner Methods (Requirements: 6.4)
  // ============================================

  /**
   * Start a progress spinner for long-running operations
   * @param message - The message to display with the spinner
   */
  startSpinner(message: string): void {
    if (this.config.quiet) return;
    
    // Stop any existing spinner first
    if (this.spinner) {
      this.spinner.stop();
    }
    
    this.spinner = ora({
      text: message,
      color: 'cyan',
      spinner: 'dots',
    }).start();
  }

  /**
   * Update the spinner text
   * @param message - New message to display
   */
  updateSpinner(message: string): void {
    if (this.spinner && this.spinner.isSpinning) {
      this.spinner.text = message;
    }
  }

  /**
   * Stop the spinner with success or failure indication
   * @param success - Whether the operation succeeded
   * @param message - Optional message to display
   */
  stopSpinner(success: boolean, message?: string): void {
    if (!this.spinner) return;
    
    if (success) {
      this.spinner.succeed(message ? chalk.green(message) : undefined);
    } else {
      this.spinner.fail(message ? chalk.red(message) : undefined);
    }
    
    this.spinner = null;
  }

  /**
   * Stop the spinner with a warning indication
   * @param message - Warning message to display
   */
  warnSpinner(message: string): void {
    if (!this.spinner) return;
    this.spinner.warn(chalk.yellow(message));
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
  box(title: string, content: string[]): void {
    if (this.config.quiet) return;
    
    const maxWidth = Math.max(
      title.length + 4,
      ...content.map(line => line.length + 4)
    );
    const width = Math.min(maxWidth, 80);
    
    const horizontalLine = '─'.repeat(width - 2);
    const topBorder = `┌${horizontalLine}┐`;
    const bottomBorder = `└${horizontalLine}┘`;
    
    console.log('');
    console.log(chalk.cyan(topBorder));
    console.log(chalk.cyan(`│ ${chalk.bold(title.padEnd(width - 4))} │`));
    console.log(chalk.cyan(`├${horizontalLine}┤`));
    
    for (const line of content) {
      const paddedLine = line.padEnd(width - 4);
      console.log(chalk.cyan(`│ ${chalk.white(paddedLine)} │`));
    }
    
    console.log(chalk.cyan(bottomBorder));
    console.log('');
  }

  /**
   * Display a formatted table
   * @param headers - Column headers
   * @param rows - Table rows (array of arrays)
   */
  table(headers: string[], rows: string[][]): void {
    if (this.config.quiet) return;
    
    const table = new Table({
      head: headers.map(h => chalk.cyan.bold(h)),
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
  etherscanLink(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  /**
   * Display a transaction hash with Etherscan link
   * @param txHash - The transaction hash
   * @param label - Optional label for the transaction
   */
  displayTxHash(txHash: string, label?: string): void {
    if (this.config.quiet) return;
    
    const url = this.etherscanLink(txHash);
    const prefix = label ? `${label}: ` : 'Transaction: ';
    
    console.log(chalk.gray(`   ${prefix}${chalk.underline.blue(url)}`));
  }

  // ============================================
  // Scenario Display Methods (Requirements: 6.5)
  // ============================================

  /**
   * Display scenario start header
   * @param name - Scenario name
   * @param description - Scenario description
   */
  scenarioStart(name: string, description: string): void {
    if (this.config.quiet) return;
    
    this.box(`Scenario: ${name}`, [description]);
  }

  /**
   * Display scenario end separator
   */
  scenarioEnd(): void {
    if (this.config.quiet) return;
    console.log(chalk.gray('─'.repeat(60)));
    console.log('');
  }


  // ============================================
  // Summary Display (Requirements: 6.7)
  // ============================================

  /**
   * Display demo summary with statistics
   * @param stats - Demo statistics
   */
  summary(stats: DemoStats): void {
    // Summary is always shown, even in quiet mode
    console.log('');
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold('                    DEMO SUMMARY'));
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log('');

    // Create summary table
    const table = new Table({
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

    table.push(
      [chalk.white('Scenarios Run'), chalk.cyan(stats.scenariosRun.toString())],
      [chalk.white('Scenarios Passed'), chalk.green(stats.scenariosPassed.toString())],
      [chalk.white('Pass Rate'), chalk.cyan(`${passRate}%`)],
      [chalk.white('Total Payments'), chalk.magenta(stats.totalPayments.toString())],
      [chalk.white('Total Spent'), chalk.magenta(`${totalSpentMNEE} MNEE`)],
      [chalk.white('Streams Created'), chalk.blue(stats.streamsCreated.toString())],
      [chalk.white('Streams Reused'), chalk.blue(stats.streamsReused.toString())],
    );

    console.log(table.toString());

    // Display errors if any
    if (stats.errors.length > 0) {
      console.log('');
      console.log(chalk.red.bold('Errors:'));
      for (const error of stats.errors) {
        console.log(chalk.red(`  ❌ ${error}`));
      }
    }

    console.log('');
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log('');
  }

  /**
   * Format a bigint value as MNEE (18 decimals)
   * @param value - Value in wei
   * @returns Formatted string
   */
  private formatMNEE(value: bigint): string {
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
