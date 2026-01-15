/**
 * Environment Configuration Loader
 * 
 * Loads and validates environment variables for the agent demo.
 * Required variables must be present; optional variables have defaults.
 * 
 * Requirements: 9.1, 9.2
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Environment configuration interface
 * Defines all required and optional environment variables
 */
export interface EnvConfig {
  // Required variables
  PRIVATE_KEY: string;
  CRONOS_RPC_URL: string;
  FLOWPAY_CONTRACT: string;
  MNEE_TOKEN: string;
  
  // Optional variables with defaults
  GEMINI_API_KEY?: string;
  DAILY_BUDGET: string;
  SERVER_URL: string;
}

/**
 * Validation result for environment configuration
 */
export interface ValidationResult {
  valid: boolean;
  config?: EnvConfig;
  missingVariables: string[];
  errors: string[];
}

/**
 * Required environment variable names
 */
const REQUIRED_VARIABLES = [
  'PRIVATE_KEY',
  'CRONOS_RPC_URL',
  'FLOWPAY_CONTRACT',
  'MNEE_TOKEN',
] as const;

/**
 * Default values for optional variables
 */
const DEFAULTS = {
  DAILY_BUDGET: '10',           // 10 MNEE default daily budget
  SERVER_URL: 'http://localhost:3001',
} as const;

/**
 * Load environment variables from .env file
 * Searches for .env in multiple locations for flexibility
 */
export function loadEnvFile(): void {
  // Try loading from multiple possible locations
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const envPath of possiblePaths) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      break;
    }
  }
}

/**
 * Validate that all required environment variables are present
 * Returns a ValidationResult with details about any missing variables
 */
export function validateEnvironment(): ValidationResult {
  const missingVariables: string[] = [];
  const errors: string[] = [];

  // Check each required variable
  for (const varName of REQUIRED_VARIABLES) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVariables.push(varName);
    }
  }

  // If any required variables are missing, return invalid result
  if (missingVariables.length > 0) {
    errors.push(`Missing required environment variables: ${missingVariables.join(', ')}`);
    return {
      valid: false,
      missingVariables,
      errors,
    };
  }

  // Build the config object with validated values
  const config: EnvConfig = {
    PRIVATE_KEY: process.env.PRIVATE_KEY!,
    CRONOS_RPC_URL: process.env.CRONOS_RPC_URL!,
    FLOWPAY_CONTRACT: process.env.FLOWPAY_CONTRACT!,
    MNEE_TOKEN: process.env.MNEE_TOKEN!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    DAILY_BUDGET: process.env.DAILY_BUDGET || DEFAULTS.DAILY_BUDGET,
    SERVER_URL: process.env.SERVER_URL || DEFAULTS.SERVER_URL,
  };

  return {
    valid: true,
    config,
    missingVariables: [],
    errors: [],
  };
}

/**
 * Load and validate environment configuration
 * Combines loading and validation into a single call
 * 
 * @returns ValidationResult with config if valid
 */
export function loadConfig(): ValidationResult {
  loadEnvFile();
  return validateEnvironment();
}

/**
 * Get validated configuration or throw an error
 * Use this when you need the config and want to fail fast
 * 
 * @throws Error if validation fails
 * @returns EnvConfig with all required and optional values
 */
export function getConfigOrThrow(): EnvConfig {
  const result = loadConfig();
  
  if (!result.valid || !result.config) {
    const errorMessage = formatValidationError(result);
    throw new Error(errorMessage);
  }
  
  return result.config;
}

/**
 * Format validation errors for display
 * Creates a user-friendly error message listing missing variables
 */
export function formatValidationError(result: ValidationResult): string {
  if (result.valid) {
    return '';
  }

  const lines: string[] = [
    'Environment validation failed:',
    '',
  ];

  if (result.missingVariables.length > 0) {
    lines.push('Missing required environment variables:');
    for (const varName of result.missingVariables) {
      lines.push(`  - ${varName}`);
    }
    lines.push('');
    lines.push('Please set these variables in your .env file or environment.');
    lines.push('See .env.example for reference.');
  }

  if (result.errors.length > 0 && result.missingVariables.length === 0) {
    lines.push('Errors:');
    for (const error of result.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join('\n');
}

/**
 * Display configuration summary (for verbose mode)
 * Masks sensitive values like private keys
 */
export function getConfigSummary(config: EnvConfig): Record<string, string> {
  return {
    PRIVATE_KEY: maskPrivateKey(config.PRIVATE_KEY),
    CRONOS_RPC_URL: config.CRONOS_RPC_URL,
    FLOWPAY_CONTRACT: config.FLOWPAY_CONTRACT,
    MNEE_TOKEN: config.MNEE_TOKEN,
    GEMINI_API_KEY: config.GEMINI_API_KEY ? '***configured***' : 'not set',
    DAILY_BUDGET: `${config.DAILY_BUDGET} MNEE`,
    SERVER_URL: config.SERVER_URL,
  };
}

/**
 * Mask a private key for safe display
 * Shows first 6 and last 4 characters
 */
function maskPrivateKey(key: string): string {
  if (key.length <= 10) {
    return '***masked***';
  }
  const prefix = key.startsWith('0x') ? key.slice(0, 6) : key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}
