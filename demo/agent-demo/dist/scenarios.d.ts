/**
 * Demo Scenarios Definition
 *
 * This file defines all demo scenarios for the agent-first CLI demo.
 * Each scenario demonstrates a specific aspect of the x402 payment flow.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */
import { Scenario } from './DemoRunner';
/**
 * Scenario 15.1: Streaming Mode (Weather API)
 *
 * Demonstrates streaming payment mode where the agent creates a payment
 * stream that flows tokens over time at a specified rate.
 *
 * - Endpoint: /api/weather
 * - Price: 0.0001 MNEE/second
 * - Expected: Stream creation and reuse
 *
 * Requirements: 7.1, 7.2
 */
export declare const STREAMING_SCENARIO: Scenario;
/**
 * Scenario 15.2: Per-Request Mode (Premium API)
 *
 * Demonstrates per-request payment mode where the agent makes a
 * direct payment for each API request.
 *
 * - Endpoint: /api/premium
 * - Price: 0.01 MNEE per request
 * - Expected: Direct payment
 *
 * Requirements: 7.1, 7.2
 */
export declare const PER_REQUEST_SCENARIO: Scenario;
/**
 * Scenario 15.3: Stream Reuse
 *
 * Demonstrates that the agent reuses an existing stream when making
 * multiple requests to the same endpoint, avoiding unnecessary
 * stream creation overhead.
 *
 * - Multiple requests to same endpoint
 * - Expected: Single stream, multiple accesses
 *
 * Requirements: 7.3
 */
export declare const STREAM_REUSE_SCENARIO: Scenario;
/**
 * Scenario 15.4: Budget Exceeded
 *
 * Demonstrates the agent's budget enforcement by attempting to access
 * an expensive API that exceeds the agent's daily budget limit.
 *
 * - Set low budget, attempt expensive payment
 * - Expected: Payment declined
 *
 * Requirements: 7.5
 */
export declare const BUDGET_EXCEEDED_SCENARIO: Scenario;
/**
 * All default scenarios in execution order
 *
 * The order is important:
 * 1. streaming - Creates initial stream for Weather API
 * 2. per-request - Shows different payment mode
 * 3. stream-reuse - Demonstrates reusing the stream from step 1
 * 4. budget-exceeded - Shows budget enforcement
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */
export declare const ALL_SCENARIOS: Scenario[];
/**
 * Get scenarios by category
 */
export declare function getStreamingScenarios(): Scenario[];
export declare function getPerRequestScenarios(): Scenario[];
export declare function getSuccessScenarios(): Scenario[];
export declare function getFailureScenarios(): Scenario[];
/**
 * Create a custom scenario for testing specific behaviors
 *
 * @param overrides - Partial scenario properties to override defaults
 * @returns A new Scenario object
 */
export declare function createCustomScenario(overrides: Partial<Scenario>): Scenario;
//# sourceMappingURL=scenarios.d.ts.map