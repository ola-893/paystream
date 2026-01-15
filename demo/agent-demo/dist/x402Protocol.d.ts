/**
 * x402 Protocol Handler
 *
 * Parses x402 headers from HTTP responses and constructs payment proof headers.
 * Handles both streaming and per-request payment modes.
 *
 * Requirements: 2.1, 2.2, 5.1, 5.2
 */
/**
 * x402 payment requirement extracted from HTTP headers
 */
export interface X402Requirement {
    recipient: string;
    mode: 'streaming' | 'per-request';
    rate?: string;
    amount?: string;
    minDeposit?: string;
    contract: string;
    token: string;
    description?: string;
}
/**
 * Payment proof to include in retry requests
 */
export interface PaymentProof {
    type: 'stream' | 'direct';
    streamId?: string;
    txHash?: string;
}
/**
 * x402 header names as constants
 */
export declare const X402_HEADERS: {
    readonly PAYMENT_REQUIRED: "x-payment-required";
    readonly MODE: "x-flowpay-mode";
    readonly RATE: "x-flowpay-rate";
    readonly RECIPIENT: "x-flowpay-recipient";
    readonly CONTRACT: "x-flowpay-contract";
    readonly MIN_DEPOSIT: "x-flowpay-mindeposit";
    readonly AMOUNT: "x-flowpay-amount";
    readonly TOKEN: "x-flowpay-token";
    readonly DESCRIPTION: "x-flowpay-description";
    readonly STREAM_ID: "x-flowpay-stream-id";
    readonly TX_HASH: "x-flowpay-tx-hash";
};
/**
 * Parse x402 headers from an HTTP response
 *
 * Extracts all x402 headers and returns an X402Requirement object.
 * Returns null if required headers are missing or invalid.
 *
 * Requirements: 2.1, 2.2
 *
 * @param headers - HTTP response headers (Headers object or plain object)
 * @returns X402Requirement object or null if headers are invalid/missing
 */
export declare function parseX402Headers(headers: Headers | Record<string, string>): X402Requirement | null;
/**
 * Build payment proof headers for retry requests
 *
 * Creates headers to include in retry requests after payment.
 * Supports both stream ID proof and direct payment (tx hash) proof.
 *
 * Requirements: 5.1, 5.2
 *
 * @param proof - Payment proof containing stream ID or transaction hash
 * @returns Record of header name-value pairs to include in request
 */
export declare function buildPaymentHeaders(proof: PaymentProof): Record<string, string>;
/**
 * Check if a response is a 402 Payment Required response
 *
 * @param status - HTTP status code
 * @param headers - HTTP response headers
 * @returns true if this is a valid x402 response
 */
export declare function isX402Response(status: number, headers: Headers | Record<string, string>): boolean;
/**
 * Validate that all required x402 headers are present
 *
 * @param headers - HTTP response headers
 * @returns Array of missing header names, empty if all present
 */
export declare function getMissingX402Headers(headers: Headers | Record<string, string>): string[];
/**
 * Format X402Requirement for display
 *
 * @param requirement - The x402 requirement to format
 * @returns Human-readable string representation
 */
export declare function formatX402Requirement(requirement: X402Requirement): string;
//# sourceMappingURL=x402Protocol.d.ts.map