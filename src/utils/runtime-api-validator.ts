/**
 * Runtime API Endpoint Validator
 *
 * @remarks
 * Provides runtime validation for API endpoint configuration to prevent
 * accidental usage of Anthropic's production API. This module should be
 * imported and called before any API operations.
 *
 * Usage:
 * ```typescript
 * import { validateApiEndpoint } from './utils/runtime-api-validator.js';
 *
 * // Before creating agent or making API calls
 * validateApiEndpoint();
 * ```
 *
 * @module utils/runtime-api-validator
 */

// Anthropic production API endpoints that must be blocked
const BLOCKED_ENDPOINTS = [
  'api.anthropic.com',
  'https://api.anthropic.com',
  'http://api.anthropic.com',
];

// Allowed local/test endpoints
const ALLOWED_TEST_ENDPOINTS = [
  'localhost',
  '127.0.0.1',
  'mock',
  'test',
  'z.ai',
  'api.z.ai',
  'https://api.z.ai',
  'http://api.z.ai',
  'https://api.z.ai/api/anthropic',
  'http://api.z.ai/api/anthropic',
];

/**
 * Error thrown when API endpoint validation fails
 */
export class ApiValidationError extends Error {
  constructor(
    public readonly configuredEndpoint: string,
    public readonly reason: string
  ) {
    super(
      `API endpoint validation failed: ${reason}\n` +
        `Configured endpoint: ${configuredEndpoint}\n` +
        `Expected: https://api.z.ai/api/anthropic or local/test endpoint`
    );
    this.name = 'ApiValidationError';
  }
}

/**
 * Validates the current API endpoint configuration
 *
 * @throws {ApiValidationError} If the endpoint is blocked or invalid
 *
 * @remarks
 * This function should be called before any API operations to ensure
 * we're not accidentally hitting Anthropic's production API.
 *
 * Validation rules:
 * 1. Blocks api.anthropic.com (all variants)
 * 2. Allows z.ai endpoints
 * 3. Allows localhost, 127.0.0.1, mock, test endpoints
 * 4. Warns for other non-standard endpoints
 */
export function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // Check for blocked endpoints
  for (const blocked of BLOCKED_ENDPOINTS) {
    if (baseUrl.includes(blocked)) {
      throw new ApiValidationError(
        baseUrl,
        'Anthropic production API detected. This could result in massive costs. Use z.ai endpoint instead.'
      );
    }
  }

  // Check if endpoint is allowed
  const isAllowed = ALLOWED_TEST_ENDPOINTS.some(allowed =>
    baseUrl.includes(allowed)
  );

  if (!isAllowed && baseUrl) {
    // Non-standard endpoint - log warning but don't block
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        `[Runtime API Validator] WARNING: Using non-standard API endpoint: ${baseUrl}\n` +
          `Recommended: https://api.z.ai/api/anthropic`
      );
    }
  }
}

/**
 * Wraps an async function with API endpoint validation
 *
 * @param fn - The async function to wrap
 * @returns A new function that validates the API endpoint before calling the original
 *
 * @example
 * ```typescript
 * import { withApiValidation } from './utils/runtime-api-validator.js';
 *
 * const makeApiCall = withApiValidation(async (url: string) => {
 *   const response = await fetch(url);
 *   return response.json();
 * });
 * ```
 */
export function withApiValidation<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    validateApiEndpoint();
    return fn(...args);
  }) as T;
}

/**
 * Validates API endpoint and returns detailed status
 *
 * @returns Object with validation status and details
 *
 * @remarks
 * This is a non-throwing version of validateApiEndpoint() that returns
 * detailed status information. Useful for logging and diagnostics.
 */
export function getApiEndpointStatus(): {
  valid: boolean;
  endpoint: string;
  isZai: boolean;
  isLocal: boolean;
  isTest: boolean;
  warning?: string;
} {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // Check for blocked endpoints
  for (const blocked of BLOCKED_ENDPOINTS) {
    if (baseUrl.includes(blocked)) {
      return {
        valid: false,
        endpoint: baseUrl,
        isZai: false,
        isLocal: false,
        isTest: false,
        warning: 'Anthropic production API detected',
      };
    }
  }

  const isZai = baseUrl.includes('z.ai');
  const isLocal =
    baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  const isTest = baseUrl.includes('mock') || baseUrl.includes('test');

  // Non-standard endpoint warning
  let warning: string | undefined;
  if (baseUrl && !isZai && !isLocal && !isTest) {
    warning = 'Non-standard API endpoint';
  }

  return {
    valid: true,
    endpoint: baseUrl,
    isZai,
    isLocal,
    isTest,
    warning,
  };
}
