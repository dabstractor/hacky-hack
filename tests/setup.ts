/**
 * Vitest global setup file
 *
 * @remarks
 * Configures global test hooks for mock cleanup and memory management.
 * This file runs before all test files and provides automatic cleanup.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// GLOBAL TEST HOOKS
// =============================================================================

/**
 * Before each test - clear mock call histories
 *
 * @remarks
 * Clears all mock call histories while preserving mock implementations.
 * This ensures test isolation without requiring mock re-definition.
 */
beforeEach(() => {
  // CLEANUP: Clear all mock call histories before each test
  // This prevents mock calls from bleeding between tests
  vi.clearAllMocks();
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
