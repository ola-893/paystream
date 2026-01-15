"use strict";
/**
 * Demo Scenarios Definition
 *
 * This file defines all demo scenarios for the agent-first CLI demo.
 * Each scenario demonstrates a specific aspect of the x402 payment flow.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_SCENARIOS = exports.BUDGET_EXCEEDED_SCENARIO = exports.STREAM_REUSE_SCENARIO = exports.PER_REQUEST_SCENARIO = exports.STREAMING_SCENARIO = void 0;
exports.getStreamingScenarios = getStreamingScenarios;
exports.getPerRequestScenarios = getPerRequestScenarios;
exports.getSuccessScenarios = getSuccessScenarios;
exports.getFailureScenarios = getFailureScenarios;
exports.createCustomScenario = createCustomScenario;
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
exports.STREAMING_SCENARIO = {
    name: 'streaming',
    description: 'Weather API with streaming payments (0.0001 MNEE/second)',
    endpoint: '/api/weather',
    expectedMode: 'streaming',
    expectedPrice: '0.0001',
    shouldSucceed: true,
};
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
exports.PER_REQUEST_SCENARIO = {
    name: 'per-request',
    description: 'Premium API with per-request payment (0.01 MNEE)',
    endpoint: '/api/premium',
    expectedMode: 'per-request',
    expectedPrice: '0.01',
    shouldSucceed: true,
};
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
exports.STREAM_REUSE_SCENARIO = {
    name: 'stream-reuse',
    description: 'Second request to Weather API (should reuse existing stream)',
    endpoint: '/api/weather',
    expectedMode: 'streaming',
    expectedPrice: '0.0001',
    shouldSucceed: true,
};
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
exports.BUDGET_EXCEEDED_SCENARIO = {
    name: 'budget-exceeded',
    description: 'Expensive API that exceeds budget (should be declined)',
    endpoint: '/api/expensive',
    expectedMode: 'per-request',
    expectedPrice: '1000',
    shouldSucceed: false,
};
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
exports.ALL_SCENARIOS = [
    exports.STREAMING_SCENARIO,
    exports.PER_REQUEST_SCENARIO,
    exports.STREAM_REUSE_SCENARIO,
    exports.BUDGET_EXCEEDED_SCENARIO,
];
/**
 * Get scenarios by category
 */
function getStreamingScenarios() {
    return exports.ALL_SCENARIOS.filter(s => s.expectedMode === 'streaming');
}
function getPerRequestScenarios() {
    return exports.ALL_SCENARIOS.filter(s => s.expectedMode === 'per-request');
}
function getSuccessScenarios() {
    return exports.ALL_SCENARIOS.filter(s => s.shouldSucceed);
}
function getFailureScenarios() {
    return exports.ALL_SCENARIOS.filter(s => !s.shouldSucceed);
}
/**
 * Create a custom scenario for testing specific behaviors
 *
 * @param overrides - Partial scenario properties to override defaults
 * @returns A new Scenario object
 */
function createCustomScenario(overrides) {
    return {
        name: 'custom',
        description: 'Custom test scenario',
        endpoint: '/api/weather',
        expectedMode: 'streaming',
        expectedPrice: '0.0001',
        shouldSucceed: true,
        ...overrides,
    };
}
//# sourceMappingURL=scenarios.js.map