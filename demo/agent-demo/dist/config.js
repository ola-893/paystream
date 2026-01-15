"use strict";
/**
 * Environment Configuration Loader
 *
 * Loads and validates environment variables for the agent demo.
 * Required variables must be present; optional variables have defaults.
 *
 * Requirements: 9.1, 9.2
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnvFile = loadEnvFile;
exports.validateEnvironment = validateEnvironment;
exports.loadConfig = loadConfig;
exports.getConfigOrThrow = getConfigOrThrow;
exports.formatValidationError = formatValidationError;
exports.getConfigSummary = getConfigSummary;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
/**
 * Required environment variable names
 */
const REQUIRED_VARIABLES = [
    'PRIVATE_KEY',
    'SEPOLIA_RPC_URL',
    'FLOWPAY_CONTRACT',
    'MNEE_TOKEN',
];
/**
 * Default values for optional variables
 */
const DEFAULTS = {
    DAILY_BUDGET: '10', // 10 MNEE default daily budget
    SERVER_URL: 'http://localhost:3001',
};
/**
 * Load environment variables from .env file
 * Searches for .env in multiple locations for flexibility
 */
function loadEnvFile() {
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
function validateEnvironment() {
    const missingVariables = [];
    const errors = [];
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
    const config = {
        PRIVATE_KEY: process.env.PRIVATE_KEY,
        SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
        FLOWPAY_CONTRACT: process.env.FLOWPAY_CONTRACT,
        MNEE_TOKEN: process.env.MNEE_TOKEN,
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
function loadConfig() {
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
function getConfigOrThrow() {
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
function formatValidationError(result) {
    if (result.valid) {
        return '';
    }
    const lines = [
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
function getConfigSummary(config) {
    return {
        PRIVATE_KEY: maskPrivateKey(config.PRIVATE_KEY),
        SEPOLIA_RPC_URL: config.SEPOLIA_RPC_URL,
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
function maskPrivateKey(key) {
    if (key.length <= 10) {
        return '***masked***';
    }
    const prefix = key.startsWith('0x') ? key.slice(0, 6) : key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}...${suffix}`;
}
//# sourceMappingURL=config.js.map