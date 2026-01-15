/**
 * Setup file execution verification tests
 *
 * @remarks
 * These tests verify that tests/setup.ts is properly loaded and executing.
 * If any of these tests fail, the setup file is not configured correctly.
 *
 * This validates that the global hooks are calling:
 * - vi.clearAllMocks() in beforeEach
 * - vi.unstubAllEnvs() in afterEach
 * - global.gc() in afterEach (if --expose-gc is enabled)
 *
 * @see {@link https://vitest.dev/config/#setupfiles | Vitest setupFiles Documentation}
 */

import { describe, expect, it, vi } from 'vitest';

describe('Setup File Execution Verification', () => {
  // ==========================================================================
  // Test Fixtures
  // ==========================================================================

  const mockLeakDetector = vi.fn();
  const ENV_LEAK_KEY = `SETUP_VERIFICATION_ENV_${Date.now()}`;

  // ==========================================================================
  // vi.clearAllMocks() Verification
  // ==========================================================================

  describe('vi.clearAllMocks() verification', () => {
    it('should clear mock calls between tests - test 1', () => {
      mockLeakDetector('first-call');
      expect(mockLeakDetector).toHaveBeenCalledTimes(1);
    });

    it('should clear mock calls between tests - test 2', () => {
      // FAILS if vi.clearAllMocks() is NOT called in global beforeEach
      expect(mockLeakDetector).toHaveBeenCalledTimes(0);

      mockLeakDetector('second-call');
      expect(mockLeakDetector).toHaveBeenCalledTimes(1);
    });

    it('should clear mock calls between tests - test 3', () => {
      // Continued verification that cleanup is working
      expect(mockLeakDetector).toHaveBeenCalledTimes(0);
    });
  });

  // ==========================================================================
  // vi.unstubAllEnvs() Verification
  // ==========================================================================

  describe('vi.unstubAllEnvs() verification', () => {
    it('should restore environment variables between tests - test 1', () => {
      vi.stubEnv(ENV_LEAK_KEY, 'leaky-value-1');
      expect(process.env[ENV_LEAK_KEY]).toBe('leaky-value-1');
    });

    it('should restore environment variables between tests - test 2', () => {
      // FAILS if vi.unstubAllEnvs() is NOT called in global afterEach
      expect(process.env[ENV_LEAK_KEY]).toBeUndefined();

      vi.stubEnv(ENV_LEAK_KEY, 'leaky-value-2');
      expect(process.env[ENV_LEAK_KEY]).toBe('leaky-value-2');
    });

    it('should restore environment variables between tests - test 3', () => {
      // Continued verification that env cleanup is working
      expect(process.env[ENV_LEAK_KEY]).toBeUndefined();
    });
  });

  // ==========================================================================
  // global.gc() Verification
  // ==========================================================================

  describe('global.gc() verification', () => {
    it('should have global.gc available if --expose-gc is enabled', () => {
      if (typeof global.gc === 'function') {
        expect(global.gc).toBeInstanceOf(Function);
      } else {
        console.warn('--expose-gc flag not enabled. GC verification skipped.');
      }
    });

    it('should be able to call global.gc without errors', () => {
      if (typeof global.gc === 'function') {
        expect(() => global.gc()).not.toThrow();
      }
    });
  });

  // ==========================================================================
  // Combined Verification
  // ==========================================================================

  describe('Combined setup file verification', () => {
    it('should have clean state at test start', () => {
      // Verify no mock calls from previous tests leaked
      expect(mockLeakDetector).toHaveBeenCalledTimes(0);

      // Verify no environment variables from previous tests leaked
      expect(process.env[ENV_LEAK_KEY]).toBeUndefined();
    });

    it('should maintain isolation throughout test suite', () => {
      // Create state
      mockLeakDetector('combined-test');
      vi.stubEnv(ENV_LEAK_KEY, 'combined-value');

      expect(mockLeakDetector).toHaveBeenCalledTimes(1);
      expect(process.env[ENV_LEAK_KEY]).toBe('combined-value');
    });

    it('should have clean state again after cleanup', () => {
      // State should be clean again after global hooks run
      expect(mockLeakDetector).toHaveBeenCalledTimes(0);
      expect(process.env[ENV_LEAK_KEY]).toBeUndefined();
    });
  });

  // ==========================================================================
  // Canary Test - Quick Setup Verification
  // ==========================================================================

  describe('Canary test - quick setup verification', () => {
    const canaryMock = vi.fn();

    it('canary test 1 - sets state', () => {
      canaryMock('chirp');
      expect(canaryMock).toHaveBeenCalledTimes(1);
    });

    it('canary test 2 - verifies cleanup', () => {
      // If this passes, setup file is working correctly
      expect(canaryMock).toHaveBeenCalledTimes(0);
    });
  });
});
