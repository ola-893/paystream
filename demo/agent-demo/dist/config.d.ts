/**
 * Environment Configuration Loader
 *
 * Loads and validates environment variables for the agent demo.
 * Required variables must be present; optional variables have defaults.
 *
 * Requirements: 9.1, 9.2
 */
/**
 * Environment configuration interface
 * Defines all required and optional environment variables
 */
export interface EnvConfig {
    PRIVATE_KEY: string;
    SEPOLIA_RPC_URL: string;
    FLOWPAY_CONTRACT: string;
    MNEE_TOKEN: string;
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
 * Load environment variables from .env file
 * Searches for .env in multiple locations for flexibility
 */
export declare function loadEnvFile(): void;
/**
 * Validate that all required environment variables are present
 * Returns a ValidationResult with details about any missing variables
 */
export declare function validateEnvironment(): ValidationResult;
/**
 * Load and validate environment configuration
 * Combines loading and validation into a single call
 *
 * @returns ValidationResult with config if valid
 */
export declare function loadConfig(): ValidationResult;
/**
 * Get validated configuration or throw an error
 * Use this when you need the config and want to fail fast
 *
 * @throws Error if validation fails
 * @returns EnvConfig with all required and optional values
 */
export declare function getConfigOrThrow(): EnvConfig;
/**
 * Format validation errors for display
 * Creates a user-friendly error message listing missing variables
 */
export declare function formatValidationError(result: ValidationResult): string;
/**
 * Display configuration summary (for verbose mode)
 * Masks sensitive values like private keys
 */
export declare function getConfigSummary(config: EnvConfig): Record<string, string>;
//# sourceMappingURL=config.d.ts.map