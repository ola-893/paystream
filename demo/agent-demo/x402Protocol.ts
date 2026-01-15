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
  rate?: string;           // MNEE per second (streaming mode)
  amount?: string;         // MNEE per request (per-request mode)
  minDeposit?: string;     // minimum deposit (streaming mode)
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
export const X402_HEADERS = {
  PAYMENT_REQUIRED: 'x-payment-required',
  MODE: 'x-flowpay-mode',
  RATE: 'x-flowpay-rate',
  RECIPIENT: 'x-flowpay-recipient',
  CONTRACT: 'x-flowpay-contract',
  MIN_DEPOSIT: 'x-flowpay-mindeposit',
  AMOUNT: 'x-flowpay-amount',
  TOKEN: 'x-flowpay-token',
  DESCRIPTION: 'x-flowpay-description',
  // Payment proof headers
  STREAM_ID: 'x-flowpay-stream-id',
  TX_HASH: 'x-flowpay-tx-hash',
} as const;

/**
 * Required headers for a valid x402 response
 */
const REQUIRED_HEADERS = [
  X402_HEADERS.PAYMENT_REQUIRED,
  X402_HEADERS.MODE,
  X402_HEADERS.RECIPIENT,
  X402_HEADERS.CONTRACT,
] as const;

/**
 * Helper function to get header value case-insensitively
 * Works with both Headers object and plain object
 */
function getHeader(headers: Headers | Record<string, string>, name: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  
  // Handle plain object with case-insensitive lookup
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return null;
}

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
export function parseX402Headers(headers: Headers | Record<string, string>): X402Requirement | null {
  // Check if payment is required
  const paymentRequired = getHeader(headers, X402_HEADERS.PAYMENT_REQUIRED);
  if (!paymentRequired || paymentRequired.toLowerCase() !== 'true') {
    return null;
  }

  // Extract required headers
  const mode = getHeader(headers, X402_HEADERS.MODE);
  const recipient = getHeader(headers, X402_HEADERS.RECIPIENT);
  const contract = getHeader(headers, X402_HEADERS.CONTRACT);

  // Validate required headers are present
  if (!mode || !recipient || !contract) {
    return null;
  }

  // Validate mode is valid
  if (mode !== 'streaming' && mode !== 'per-request') {
    return null;
  }

  // Extract optional headers
  const rate = getHeader(headers, X402_HEADERS.RATE);
  const amount = getHeader(headers, X402_HEADERS.AMOUNT);
  const minDeposit = getHeader(headers, X402_HEADERS.MIN_DEPOSIT);
  const token = getHeader(headers, X402_HEADERS.TOKEN);
  const description = getHeader(headers, X402_HEADERS.DESCRIPTION);

  // For streaming mode, rate is required
  if (mode === 'streaming' && !rate) {
    return null;
  }

  // For per-request mode, amount is required
  if (mode === 'per-request' && !amount) {
    return null;
  }

  // Build the requirement object
  const requirement: X402Requirement = {
    recipient,
    mode,
    contract,
    token: token || '', // Token may be optional if contract implies it
  };

  // Add mode-specific fields
  if (mode === 'streaming') {
    requirement.rate = rate!;
    if (minDeposit) {
      requirement.minDeposit = minDeposit;
    }
  } else {
    requirement.amount = amount!;
  }

  // Add optional description
  if (description) {
    requirement.description = description;
  }

  return requirement;
}

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
export function buildPaymentHeaders(proof: PaymentProof): Record<string, string> {
  const headers: Record<string, string> = {};

  if (proof.type === 'stream' && proof.streamId) {
    // Stream ID proof for streaming payments
    headers[X402_HEADERS.STREAM_ID] = proof.streamId;
  } else if (proof.type === 'direct' && proof.txHash) {
    // Transaction hash proof for direct payments
    headers[X402_HEADERS.TX_HASH] = proof.txHash;
  }

  return headers;
}

/**
 * Check if a response is a 402 Payment Required response
 * 
 * @param status - HTTP status code
 * @param headers - HTTP response headers
 * @returns true if this is a valid x402 response
 */
export function isX402Response(status: number, headers: Headers | Record<string, string>): boolean {
  if (status !== 402) {
    return false;
  }

  const paymentRequired = getHeader(headers, X402_HEADERS.PAYMENT_REQUIRED);
  return paymentRequired?.toLowerCase() === 'true';
}

/**
 * Validate that all required x402 headers are present
 * 
 * @param headers - HTTP response headers
 * @returns Array of missing header names, empty if all present
 */
export function getMissingX402Headers(headers: Headers | Record<string, string>): string[] {
  const missing: string[] = [];

  for (const headerName of REQUIRED_HEADERS) {
    const value = getHeader(headers, headerName);
    if (!value) {
      missing.push(headerName);
    }
  }

  return missing;
}

/**
 * Format X402Requirement for display
 * 
 * @param requirement - The x402 requirement to format
 * @returns Human-readable string representation
 */
export function formatX402Requirement(requirement: X402Requirement): string {
  const lines: string[] = [
    `Mode: ${requirement.mode}`,
    `Recipient: ${requirement.recipient}`,
    `Contract: ${requirement.contract}`,
  ];

  if (requirement.mode === 'streaming') {
    lines.push(`Rate: ${requirement.rate} MNEE/second`);
    if (requirement.minDeposit) {
      lines.push(`Min Deposit: ${requirement.minDeposit} MNEE`);
    }
  } else {
    lines.push(`Amount: ${requirement.amount} MNEE`);
  }

  if (requirement.description) {
    lines.push(`Description: ${requirement.description}`);
  }

  return lines.join('\n');
}
