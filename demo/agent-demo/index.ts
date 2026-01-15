#!/usr/bin/env node
/**
 * Agent-First CLI Demo
 * 
 * A CLI-first demonstration of AI agents autonomously triggering and streaming
 * payments via the x402 protocol and FlowPay.
 * 
 * Usage:
 *   npx ts-node index.ts [options]
 * 
 * Options:
 *   --verbose    Show detailed debug output
 *   --quiet      Show minimal output
 *   --dry-run    Simulate without real transactions
 *   --scenario   Run specific scenario (streaming, per-request, etc.)
 *   --check      Verify setup (wallet, contract, server)
 *   --help       Show help message
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  loadConfig,
  formatValidationError,
  getConfigSummary,
  EnvConfig,
  ValidationResult,
} from './config';
import { CLIOutput, CLIConfig } from './CLIOutput';
import { PaymentAgent, AgentConfig } from './PaymentAgent';

const program = new Command();

program
  .name('agent-demo')
  .description('CLI demo showcasing AI agents autonomously triggering payments via x402 protocol and FlowPay')
  .version('1.0.0')
  .option('-v, --verbose', 'Show detailed debug output')
  .option('-q, --quiet', 'Show minimal output')
  .option('-d, --dry-run', 'Simulate without real blockchain transactions')
  .option('-s, --scenario <name>', 'Run specific scenario (streaming, per-request, budget-exceeded)')
  .option('-c, --check', 'Verify setup: wallet balance, contract connectivity, server availability')
  .parse(process.argv);

const options = program.opts();

// Create CLI output manager based on options
const cliConfig: CLIConfig = {
  verbose: options.verbose || false,
  quiet: options.quiet || false,
};
const cli = new CLIOutput(cliConfig);

/**
 * Validate environment and exit with code 1 if validation fails
 * Requirements: 9.2
 */
function validateEnvironmentOrExit(): EnvConfig {
  const result: ValidationResult = loadConfig();
  
  if (!result.valid || !result.config) {
    console.error(chalk.red('\n❌ Environment Validation Failed\n'));
    console.error(chalk.red(formatValidationError(result)));
    
    // Display each missing variable clearly
    if (result.missingVariables.length > 0) {
      console.error(chalk.yellow('\nRequired variables:'));
      for (const varName of result.missingVariables) {
        console.error(chalk.yellow(`  ✗ ${varName}`));
      }
    }
    
    console.error(chalk.gray('\nSee .env.example for reference configuration.\n'));
    process.exit(1);
  }
  
  return result.config;
}

/**
 * Display configuration summary in verbose mode
 */
function displayConfigSummary(config: EnvConfig): void {
  const summary = getConfigSummary(config);
  console.log(chalk.gray('\nEnvironment Configuration:'));
  for (const [key, value] of Object.entries(summary)) {
    console.log(chalk.gray(`  ${key}: ${value}`));
  }
  console.log('');
}

async function main(): Promise<void> {
  cli.agent('FlowPay Agent Demo');
  cli.info('CLI-first demonstration of AI agents making autonomous payments\n');

  // Validate environment configuration first (Requirements: 9.1, 9.2)
  const config = validateEnvironmentOrExit();

  if (options.verbose) {
    cli.debug('Running in verbose mode');
    displayConfigSummary(config);
  }
  
  if (options.quiet) {
    // In quiet mode, skip non-essential output
  } else if (!options.verbose) {
    cli.success('Environment validated successfully');
  }
  
  if (options.dryRun) {
    cli.warning('Dry-run mode: No real transactions will be made\n');
  }

  if (options.check) {
    cli.request('Running setup check...\n');
    // Setup check will be implemented in task 14
    cli.info('Setup check not yet implemented');
    return;
  }

  if (options.scenario) {
    cli.info(`Running scenario: ${options.scenario}\n`);
  }

  // Display current CLI options
  if (options.verbose) {
    cli.debug('CLI Options:');
    cli.debug(`  Verbose: ${options.verbose || false}`);
    cli.debug(`  Quiet: ${options.quiet || false}`);
    cli.debug(`  Dry-run: ${options.dryRun || false}`);
    cli.debug(`  Scenario: ${options.scenario || 'all'}`);
  }
  
  // Initialize PaymentAgent (Requirements: 1.1, 1.2)
  cli.agent('Initializing PaymentAgent...\n');
  
  const agentConfig: AgentConfig = {
    name: 'FlowPay Demo Agent',
    privateKey: config.PRIVATE_KEY,
    rpcUrl: config.SEPOLIA_RPC_URL,
    dailyBudget: ethers.parseEther(config.DAILY_BUDGET),
    flowPayContract: config.FLOWPAY_CONTRACT,
    mneeToken: config.MNEE_TOKEN,
    geminiApiKey: config.GEMINI_API_KEY,
  };
  
  const agent = new PaymentAgent(agentConfig);
  
  // Initialize agent and fetch balance
  cli.startSpinner('Connecting to Sepolia and fetching MNEE balance...');
  
  try {
    await agent.initialize();
    cli.stopSpinner(true, 'Agent initialized successfully');
    
    // Display agent info (Requirements: 1.2)
    const state = agent.getState();
    cli.info('');
    cli.box('Agent Information', [
      `Name: ${agent.name}`,
      `Wallet: ${agent.walletAddress}`,
      `MNEE Balance: ${ethers.formatEther(state.mneeBalance)} MNEE`,
      `Daily Budget: ${ethers.formatEther(agent.dailyBudget)} MNEE`,
      `Remaining Budget: ${ethers.formatEther(agent.getRemainingBudget())} MNEE`,
    ]);
    
    if (options.verbose) {
      cli.debug('Agent State:');
      cli.debug(`  Wallet Address: ${state.walletAddress}`);
      cli.debug(`  MNEE Balance: ${ethers.formatEther(state.mneeBalance)} MNEE`);
      cli.debug(`  Daily Spent: ${ethers.formatEther(state.dailySpent)} MNEE`);
      cli.debug(`  Active Streams: ${state.activeStreams.size}`);
      cli.debug(`  Request Count: ${state.requestCount}`);
      cli.debug(`  Payment Count: ${state.paymentCount}`);
    }
    
    // Demo budget tracking (Requirements: 1.4, 1.5)
    if (options.verbose) {
      cli.info('');
      cli.info('Budget Tracking Demo:');
      
      const testAmount = ethers.parseEther('0.001');
      cli.debug(`  Can afford 0.001 MNEE: ${agent.canAfford(testAmount)}`);
      
      // Test budget check
      try {
        agent.checkBudget(testAmount);
        cli.debug('  Budget check passed for 0.001 MNEE');
      } catch (error: any) {
        cli.warning(`  Budget check failed: ${error.message}`);
      }
      
      // Test exceeding budget
      const hugeAmount = ethers.parseEther('1000000');
      cli.debug(`  Can afford 1,000,000 MNEE: ${agent.canAfford(hugeAmount)}`);
    }
    
    // Demo stream caching (Requirements: 4.5)
    if (options.verbose) {
      cli.info('');
      cli.info('Stream Caching Demo:');
      
      // Cache a test stream
      const testHost = 'api.example.com';
      const testStream = {
        streamId: '12345',
        recipient: '0x1234567890123456789012345678901234567890',
        amount: ethers.parseEther('1'),
        rate: ethers.parseEther('0.0001'),
        startTime: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      
      agent.cacheStream(testHost, testStream);
      cli.debug(`  Cached stream for ${testHost}`);
      
      const cached = agent.getCachedStream(testHost);
      cli.debug(`  Retrieved cached stream: ${cached ? `ID ${cached.streamId}` : 'none'}`);
      
      // Clear the test stream
      agent.clearCachedStream(testHost);
      cli.debug(`  Cleared cached stream for ${testHost}`);
      
      const afterClear = agent.getCachedStream(testHost);
      cli.debug(`  After clear: ${afterClear ? `ID ${afterClear.streamId}` : 'none'}`);
    }
    
    cli.success('\nPaymentAgent initialized and ready\n');
    cli.info('Next steps: Implement x402 protocol handler and DemoRunner');
    
  } catch (error: any) {
    cli.stopSpinner(false, 'Failed to initialize agent');
    cli.error(`Initialization error: ${error.message}`);
    
    if (options.verbose) {
      cli.debug(`Stack trace: ${error.stack}`);
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('❌ Fatal error:'), error.message);
  process.exit(1);
});
