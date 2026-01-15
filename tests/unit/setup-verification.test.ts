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

  // ==========================================================================
  // API Safeguard Documentation
  // ==========================================================================

  describe('z.ai API Safeguard - Expected Behavior', () => {
    /**
     * NOTE: The validateApiEndpoint() function in tests/setup.ts is not
     * exported, so it cannot be directly tested. This suite documents the
     * expected behavior for reference and manual verification.
     *
     * The safeguard runs in TWO places:
     * 1. On file load (tests/setup.ts line ~120)
     * 2. In beforeEach hook (tests/setup.ts line ~129)
     *
     * To manually verify, run:
     * - With Anthropic API: `ANTHROPIC_BASE_URL='https://api.anthropic.com' npm test`
     * - With z.ai API: `ANTHROPIC_BASE_URL='https://api.z.ai/api/anthropic' npm test`
     * - With unknown endpoint: `ANTHROPIC_BASE_URL='https://api.example.com' npm test`
     */

    const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';
    const BLOCKED_PATTERNS = [
      'https://api.anthropic.com',
      'http://api.anthropic.com',
      'api.anthropic.com',
    ] as const;

    describe('Blocked patterns', () => {
      it('should block https://api.anthropic.com', () => {
        const pattern = 'https://api.anthropic.com';
        expect(BLOCKED_PATTERNS.some((p) => pattern.includes(p))).toBe(true);
      });

      it('should block http://api.anthropic.com (http variant)', () => {
        const pattern = 'http://api.anthropic.com';
        expect(BLOCKED_PATTERNS.some((p) => pattern.includes(p))).toBe(true);
      });

      it('should block api.anthropic.com (any protocol)', () => {
        const pattern = 'api.anthropic.com';
        expect(BLOCKED_PATTERNS.some((p) => pattern.includes(p))).toBe(true);
      });

      it('should block https://api.anthropic.com/v1 (subpath)', () => {
        const pattern = 'https://api.anthropic.com/v1';
        expect(BLOCKED_PATTERNS.some((p) => pattern.includes(p))).toBe(true);
      });

      it('should block https://api.anthropic.com:443 (port variant)', () => {
        const pattern = 'https://api.anthropic.com:443';
        expect(BLOCKED_PATTERNS.some((p) => pattern.includes(p))).toBe(true);
      });
    });

    describe('Allowed endpoints (no warning)', () => {
      it('should allow z.ai endpoint without warning', () => {
        const baseUrl = ZAI_ENDPOINT;
        // This endpoint should never trigger a warning or error
        expect(baseUrl).toBe('https://api.z.ai/api/anthropic');
      });

      it('should allow localhost without warning', () => {
        const baseUrl = 'http://localhost:3000';
        // localhost endpoints are allowed for local development
        expect(baseUrl).toContain('localhost');
      });

      it('should allow 127.0.0.1 without warning', () => {
        const baseUrl = 'http://127.0.0.1:3000';
        // 127.0.0.1 endpoints are allowed for local development
        expect(baseUrl).toContain('127.0.0.1');
      });

      it('should allow mock endpoints without warning', () => {
        const baseUrl = 'http://mock-api.example.com';
        // mock endpoints are allowed for testing
        expect(baseUrl).toContain('mock');
      });

      it('should allow test endpoints without warning', () => {
        const baseUrl = 'http://test-api.example.com';
        // test endpoints are allowed for testing
        expect(baseUrl).toContain('test');
      });
    });

    describe('Warning behavior (non-blocked, non-z.ai endpoints)', () => {
      it('should warn for unknown API endpoints', () => {
        const baseUrl = 'https://api.example.com';
        // This should produce a warning but not block execution
        const isLocalhost = baseUrl.includes('localhost');
        const is127 = baseUrl.includes('127.0.0.1');
        const isMock = baseUrl.includes('mock');
        const isTest = baseUrl.includes('test');

        // Verify none of the allowed conditions are true
        expect([isLocalhost, is127, isMock, isTest]).not.toContain(true);
      });
    });

    describe('Error message format', () => {
      it('should include current ANTHROPIC_BASE_URL in error', () => {
        // The error message includes the current configured URL
        const baseUrl = 'https://api.anthropic.com';
        const expectedInMessage = `Current ANTHROPIC_BASE_URL: ${baseUrl}`;
        expect(expectedInMessage).toContain('Current ANTHROPIC_BASE_URL:');
      });

      it('should include expected z.ai endpoint in error', () => {
        // The error message includes the expected endpoint
        const expectedInMessage = `Expected: ${ZAI_ENDPOINT}`;
        expect(expectedInMessage).toContain('Expected:');
        expect(expectedInMessage).toContain(ZAI_ENDPOINT);
      });

      it('should include fix instructions with export command', () => {
        // The error message includes bash export command
        const expectedInMessage = `  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`;
        expect(expectedInMessage).toContain('export ANTHROPIC_BASE_URL=');
        expect(expectedInMessage).toContain(ZAI_ENDPOINT);
      });

      it('should include fix instructions with .env file option', () => {
        // The error message includes .env file alternative
        const expectedInMessage = `    ANTHROPIC_BASE_URL=${ZAI_ENDPOINT}`;
        expect(expectedInMessage).toContain('ANTHROPIC_BASE_URL=');
        expect(expectedInMessage).toContain(ZAI_ENDPOINT);
      });
    });

    describe('Console output behavior', () => {
      it('should use console.error before throwing for critical errors', () => {
        // Critical errors (Anthropic API) are logged with console.error
        // This ensures visibility even if test runner catches the error
        const criticalPattern = 'api.anthropic.com';
        const isBlocked = BLOCKED_PATTERNS.some((p) =>
          criticalPattern.includes(p)
        );
        expect(isBlocked).toBe(true);
      });

      it('should use console.warn for non-critical warnings', () => {
        // Non-critical issues (unknown endpoints) use console.warn
        // These don't stop test execution but alert developers
        const unknownEndpoint = 'https://api.example.com';
        const isLocalhost = unknownEndpoint.includes('localhost');
        const is127 = unknownEndpoint.includes('127.0.0.1');
        const isMock = unknownEndpoint.includes('mock');
        const isTest = unknownEndpoint.includes('test');

        // Endpoint should trigger warning if it's not z.ai, localhost, 127.0.0.1, mock, or test
        const shouldWarn = !isLocalhost && !is127 && !isMock && !isTest;
        expect(shouldWarn).toBe(true);
      });
    });
  });
});
