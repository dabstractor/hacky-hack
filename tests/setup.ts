/**
 * Vitest global setup file
 *
 * @remarks
 * Configures global test hooks for mock cleanup and memory management.
 * This file runs before all test files and provides automatic cleanup.
 *
 * CRITICAL: All tests MUST use z.ai API endpoint, never Anthropic's official API.
 * This is enforced at the global test setup level.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// LOAD .env FILE (if exists, otherwise use existing environment)
// =============================================================================

try {
  await import('dotenv').then(({ default: dotenv }) => {
    // Try to load .env file, but don't fail if it doesn't exist
    const result = dotenv.config({ quiet: true });
    if (result.error) {
      // .env file doesn't exist or can't be read - use existing environment
      console.debug('No .env file found, using existing environment variables');
    } else {
      console.debug('.env file loaded successfully');
    }
  });
} catch {
  // dotenv not installed - use existing environment variables
  console.debug('dotenv not available, using existing environment variables');
}

// =============================================================================
// z.ai API SAFEGUARD
// =============================================================================

/**
 * Validate that tests are configured to use z.ai, NOT Anthropic's API
 *
 * @remarks
 * This safeguard prevents accidental usage of Anthropic's official API
 * during testing. All tests must use the z.ai proxy endpoint.
 *
 * Allowed endpoints (z.ai):
 * - https://api.z.ai/api/anthropic
 *
 * Blocked endpoints (Anthropic):
 * - https://api.anthropic.com
 * - https://api.anthropic.com/v1
 * - http://api.anthropic.com (any protocol variant)
 * - api.anthropic.com (any domain match)
 */
const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';

// Patterns that MUST be blocked - prevents accidental production API usage
const BLOCKED_PATTERNS = [
  'https://api.anthropic.com',
  'http://api.anthropic.com',
  'api.anthropic.com',
] as const;

function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // Block Anthropic's official API and all its variants
  if (BLOCKED_PATTERNS.some((pattern) => baseUrl.includes(pattern))) {
    const errorMessage = [
      '\n========================================',
      'CRITICAL: Tests are configured to use Anthropic API!',
      '========================================',
      `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
      '',
      'All tests MUST use z.ai API endpoint, never Anthropic official API.',
      `Expected: ${ZAI_ENDPOINT}`,
      '',
      'Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:',
      '  Option 1 (command line):',
      `    export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`,
      '  Option 2 (.env file):',
      `    ANTHROPIC_BASE_URL=${ZAI_ENDPOINT}`,
      '========================================\n',
    ].join('\n');

    // Log to console.error for visibility before throwing
    console.error(errorMessage);

    // Throw to stop test execution
    throw new Error(errorMessage);
  }

  // Warn if using a non-z.ai endpoint (unless it's a mock/test endpoint)
  if (
    baseUrl &&
    baseUrl !== ZAI_ENDPOINT &&
    !baseUrl.includes('localhost') &&
    !baseUrl.includes('127.0.0.1') &&
    !baseUrl.includes('mock') &&
    !baseUrl.includes('test')
  ) {
    console.warn(
      [
        '\n========================================',
        'WARNING: Non-z.ai API endpoint detected',
        '========================================',
        `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
        '',
        `Recommended: ${ZAI_ENDPOINT}`,
        '',
        'Ensure this endpoint is intended for testing.',
        '========================================\n',
      ].join('\n')
    );
  }
}

// Run validation immediately when test setup loads
validateApiEndpoint();

// =============================================================================
// GLOBAL TEST HOOKS
// =============================================================================

/**
 * Before each test - clear mock call histories and validate API endpoint
 *
 * @remarks
 * Clears all mock call histories while preserving mock implementations.
 * This ensures test isolation without requiring mock re-definition.
 * Also validates that tests haven't been configured to use Anthropic API.
 */
beforeEach(() => {
  // CLEANUP: Clear all mock call histories before each test
  // This prevents mock calls from bleeding between tests
  vi.clearAllMocks();

  // SAFEGUARD: Validate API endpoint before each test
  // This catches any environment changes during test runs
  validateApiEndpoint();
});

/**
 * After each test - clean up environment and memory
 *
 * @remarks
 * Restores environment variables and forces garbage collection if available.
 * This prevents memory leaks and ensures clean state for next test.
 */
afterEach(() => {
  // CLEANUP: Restore all environment variable stubs
  // This prevents environment variable leaks between tests
  vi.unstubAllEnvs();

  // CLEANUP: Force garbage collection if available
  // Requires Node.js to be started with --expose-gc flag
  // This helps manage memory in long-running test suites
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
