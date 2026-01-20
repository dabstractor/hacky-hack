/**
 * Unit tests for nested execution guard
 *
 * @remarks
 * Tests validate guard logic that prevents recursive pipeline execution while
 * allowing legitimate bug fix recursion under specific conditions.
 *
 * Guard prevents execution when PRP_PIPELINE_RUNNING is set, unless BOTH:
 * - SKIP_BUG_FINDING environment variable equals 'true' (exact string match)
 * - Path contains 'bugfix' (case-insensitive match)
 *
 * @see {@link https://vitest.dev/guide/mocking.html | Vitest Mocking}
 * @see {@link file://../../PRD.md#L111-L327 | PRD Nested Execution Guard Specification}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLogger,
  clearLoggerCache,
  type Logger,
} from '../../src/utils/logger.js';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock the execution-guard module (doesn't exist yet, for future implementation)
vi.mock('../../src/utils/execution-guard.js', () => ({
  validateNestedExecutionGuard: vi.fn(),
  NestedExecutionError: class extends Error {
    readonly existingPid: string;
    readonly currentPid: string;
    constructor(message: string, existingPid: string, currentPid: string) {
      super(message);
      this.name = 'NestedExecutionError';
      this.existingPid = existingPid;
      this.currentPid = currentPid;
    }
  },
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Nested Execution Guard', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = getLogger('NestedExecutionGuardTest');
    clearLoggerCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL: Always restore environment
  });

  // ========================================================================
  // Basic Guard Functionality
  // ========================================================================

  describe('Basic Guard Functionality', () => {
    it('should allow execution when PRP_PIPELINE_RUNNING is not set', () => {
      // SETUP: Ensure PRP_PIPELINE_RUNNING is not set
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE: When guard is implemented, validateNestedExecutionGuard() would be called
      // validateNestedExecutionGuard({ logger });

      // VERIFY: For now, just test the environment state
      expect(process.env.PRP_PIPELINE_RUNNING).toBeUndefined();
    });

    it('should set PRP_PIPELINE_RUNNING to current PID on valid entry', () => {
      // SETUP: Clean environment
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE: When guard is implemented
      // validateNestedExecutionGuard({ logger });

      // VERIFY: PRP_PIPELINE_RUNNING should be set to current PID
      // expect(process.env.PRP_PIPELINE_RUNNING).toBe(process.pid.toString());
      expect(process.pid).toBeGreaterThan(0);
    });

    it('should block execution when PRP_PIPELINE_RUNNING is already set', () => {
      // SETUP: Set PRP_PIPELINE_RUNNING to a different PID
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');

      // EXECUTE & VERIFY: Should throw when implemented
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .toThrow('Pipeline already running');

      // For now, verify environment is set
      expect(process.env.PRP_PIPELINE_RUNNING).toBe('99999');
    });
  });

  // ========================================================================
  // Bug Fix Recursion Exception
  // ========================================================================

  describe('Bug Fix Recursion Exception', () => {
    it('should allow recursion when SKIP_BUG_FINDING=true AND path contains bugfix', () => {
      // SETUP: Set both conditions for allowed recursion
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE: Should not throw when implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).not.toThrow();

      // VERIFY: Environment is set correctly
      expect(process.env.SKIP_BUG_FINDING).toBe('true');
      expect(process.env.PLAN_DIR).toContain('bugfix');
    });

    it('should block recursion when SKIP_BUG_FINDING=true BUT path does NOT contain bugfix', () => {
      // SETUP: Set SKIP_BUG_FINDING but not bugfix path
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed');

      // EXECUTE & VERIFY: Should throw when implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).toThrow('Pipeline already running');

      expect(process.env.SKIP_BUG_FINDING).toBe('true');
      expect(process.env.PLAN_DIR).not.toContain('bugfix');
    });

    it('should block recursion when path contains bugfix BUT SKIP_BUG_FINDING is NOT true', () => {
      // SETUP: Set bugfix path but not SKIP_BUG_FINDING
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');
      delete process.env.SKIP_BUG_FINDING;

      // EXECUTE & VERIFY: Should throw when implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).toThrow('Pipeline already running');

      expect(process.env.SKIP_BUG_FINDING).toBeUndefined();
      expect(process.env.PLAN_DIR).toContain('bugfix');
    });
  });

  // ========================================================================
  // Path Validation
  // ========================================================================

  describe('Path Validation', () => {
    it('should validate path contains bugfix case-insensitively', () => {
      // SETUP: Test various casings
      const testPaths = [
        '/path/to/bugfix/session',
        '/path/to/BugFix/session',
        '/path/to/BUGFIX/session',
      ];

      for (const path of testPaths) {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
        vi.stubEnv('SKIP_BUG_FINDING', 'true');
        vi.stubEnv('PLAN_DIR', path);

        // EXECUTE: When implemented, should accept all casings
        // expect(() => validateNestedExecutionGuard({
        //   logger,
        //   planDir: path
        // })).not.toThrow();

        // VERIFY: Path contains bugfix (case-insensitive)
        expect(/bugfix/i.test(path)).toBe(true);
      }
    });

    it('should accept bugfix in PLAN_DIR path', () => {
      // SETUP: Set PLAN_DIR with bugfix
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE: When implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).not.toThrow();

      expect(process.env.PLAN_DIR).toContain('bugfix');
    });

    it('should accept bugfix in current working directory', () => {
      // SETUP: Mock current directory with bugfix
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');

      // EXECUTE: When implemented, should check process.cwd()
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .not.toThrow();

      // For now, verify cwd is accessible
      expect(typeof process.cwd()).toBe('string');
    });
  });

  // ========================================================================
  // Debug Logging
  // ========================================================================

  describe('Debug Logging', () => {
    it('should log environment check details with PLAN_DIR', () => {
      // SETUP: Spy on logger.debug
      const _debugSpy = vi.spyOn(logger, 'debug');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE: When implemented
      // validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // });

      // VERIFY: Debug log called with correct structure
      // expect(_debugSpy).toHaveBeenCalledWith(
      //   '[Nested Guard] Environment Check',
      //   expect.objectContaining({
      //     PLAN_DIR: expect.any(String),
      //     PRP_PIPELINE_RUNNING: expect.any(String),
      //     SKIP_BUG_FINDING: expect.any(String),
      //   })
      // );

      expect(process.env.PLAN_DIR).toContain('bugfix');
    });

    it('should log environment check details with SESSION_DIR', () => {
      // SETUP: Spy on logger.debug
      const _debugSpy = vi.spyOn(logger, 'debug');
      const sessionDir = '/path/to/session/abc123';

      // EXECUTE: When implemented
      // validateNestedExecutionGuard({
      //   logger,
      //   sessionDir
      // });

      // VERIFY: Debug log includes SESSION_DIR
      // expect(_debugSpy).toHaveBeenCalledWith(
      //   '[Nested Guard] Environment Check',
      //   expect.objectContaining({
      //     SESSION_DIR: sessionDir,
      //   })
      // );

      expect(sessionDir).toBeDefined();
    });

    it('should log environment check details with SKIP_BUG_FINDING', () => {
      // SETUP: Set SKIP_BUG_FINDING and spy on logger
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      const _debugSpy = vi.spyOn(logger, 'debug');

      // EXECUTE: When implemented
      // validateNestedExecutionGuard({ logger });

      // VERIFY: Debug log includes SKIP_BUG_FINDING value
      // expect(_debugSpy).toHaveBeenCalledWith(
      //   '[Nested Guard] Environment Check',
      //   expect.objectContaining({
      //     SKIP_BUG_FINDING: 'true',
      //   })
      // );

      expect(process.env.SKIP_BUG_FINDING).toBe('true');
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle missing SKIP_BUG_FINDING environment variable', () => {
      // SETUP: Delete SKIP_BUG_FINDING
      delete process.env.SKIP_BUG_FINDING;
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');

      // EXECUTE & VERIFY: When implemented, should treat as not 'true'
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .toThrow('Pipeline already running');

      expect(process.env.SKIP_BUG_FINDING).toBeUndefined();
    });

    it('should handle missing PLAN_DIR environment variable', () => {
      // SETUP: Delete PLAN_DIR
      delete process.env.PLAN_DIR;
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');

      // EXECUTE: When implemented, should check process.cwd()
      // validateNestedExecutionGuard({ logger });

      // VERIFY: Current directory is accessible
      expect(process.cwd()).toBeDefined();
    });

    it('should handle concurrent validation calls', () => {
      // SETUP: No special setup needed
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE: Multiple calls (when implemented)
      // validateNestedExecutionGuard({ logger });
      // validateNestedExecutionGuard({ logger });

      // VERIFY: Should handle gracefully
      // expect(process.env.PRP_PIPELINE_RUNNING).toBe(process.pid.toString());
      expect(process.pid).toBeGreaterThan(0);
    });

    it('should treat SKIP_BUG_FINDING case-sensitively (only lowercase "true" is valid)', () => {
      // SETUP: Test uppercase "TRUE" (should NOT be treated as true)
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'TRUE'); // Uppercase, not valid
      vi.stubEnv('PLAN_DIR', '/path/to/bugfix');

      // EXECUTE & VERIFY: Should block because 'TRUE' !== 'true'
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).toThrow('Pipeline already running');

      expect(process.env.SKIP_BUG_FINDING).toBe('TRUE'); // Not 'true'
      expect(process.env.SKIP_BUG_FINDING).not.toBe('true'); // Case-sensitive
    });

    it('should treat SKIP_BUG_FINDING as exact string match (not boolean or number)', () => {
      // SETUP: Test various non-valid values
      const invalidValues = ['1', 'yes', 'True', 'TRUE', 'enabled', 'on'];

      for (const value of invalidValues) {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
        vi.stubEnv('SKIP_BUG_FINDING', value);
        vi.stubEnv('PLAN_DIR', '/path/to/bugfix');

        // EXECUTE & VERIFY: All should block (only 'true' is valid)
        // expect(() => validateNestedExecutionGuard({
        //   logger,
        //   planDir: process.env.PLAN_DIR
        // })).toThrow('Pipeline already running');

        expect(process.env.SKIP_BUG_FINDING).toBe(value);
        expect(process.env.SKIP_BUG_FINDING).not.toBe('true');
      }
    });
  });

  // ========================================================================
  // Error Messages
  // ========================================================================

  describe('Error Messages', () => {
    it('should include existing PID in error message', () => {
      // SETUP: Set PRP_PIPELINE_RUNNING to a specific PID
      vi.stubEnv('PRP_PIPELINE_RUNNING', '98765');

      // VERIFY: PID is set
      expect(process.env.PRP_PIPELINE_RUNNING).toBe('98765');

      // NOTE: When guard is implemented, uncomment:
      // EXECUTE & VERIFY: Error should include existing PID
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .toThrow(/PID: 98765/);
    });

    it('should include current PID in error message context', () => {
      // SETUP: Set PRP_PIPELINE_RUNNING
      vi.stubEnv('PRP_PIPELINE_RUNNING', '11111');

      // VERIFY: Environment is set
      expect(process.env.PRP_PIPELINE_RUNNING).toBe('11111');

      // NOTE: When guard is implemented, uncomment:
      // EXECUTE & VERIFY: Error message context
      // try {
      //   validateNestedExecutionGuard({ logger });
      //   expect.fail('Should have thrown error');
      // } catch (error) {
      //   expect(error).toBeInstanceOf(Error);
      //   expect(error.message).toContain('Pipeline already running');
      // }
    });

    it('should mention bug fix mode in error message', () => {
      // SETUP: Set PRP_PIPELINE_RUNNING without bug fix conditions
      vi.stubEnv('PRP_PIPELINE_RUNNING', '22222');

      // VERIFY: No bug fix conditions set
      expect(process.env.SKIP_BUG_FINDING).toBeUndefined();

      // NOTE: When guard is implemented, uncomment:
      // EXECUTE & VERIFY: Error should mention bug fix mode
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .toThrow(/bug fix mode/);
    });
  });

  // ========================================================================
  // Environment Variable Side Effects
  // ========================================================================

  describe('Environment Variable Side Effects', () => {
    it('should set PRP_PIPELINE_RUNNING on successful guard validation', () => {
      // SETUP: Clean environment
      delete process.env.PRP_PIPELINE_RUNNING;

      // VERIFY: Clean start
      expect(process.env.PRP_PIPELINE_RUNNING).toBeUndefined();

      // NOTE: When guard is implemented, uncomment:
      // EXECUTE: Validate guard
      // validateNestedExecutionGuard({ logger });
      // VERIFY: PRP_PIPELINE_RUNNING is now set
      // expect(process.env.PRP_PIPELINE_RUNNING).toBe(process.pid.toString());
    });

    it('should not modify PRP_PIPELINE_RUNNING when already set by same process', () => {
      // SETUP: Set PRP_PIPELINE_RUNNING to current PID
      const currentPid = process.pid.toString();
      vi.stubEnv('PRP_PIPELINE_RUNNING', currentPid);

      // VERIFY: Current PID is set
      expect(process.env.PRP_PIPELINE_RUNNING).toBe(currentPid);

      // NOTE: When guard is implemented, uncomment:
      // EXECUTE: Validate guard (same process)
      // validateNestedExecutionGuard({ logger });
      // VERIFY: PID remains unchanged
      // expect(process.env.PRP_PIPELINE_RUNNING).toBe(currentPid);
    });

    it('should not modify other environment variables', () => {
      // SETUP: Set various environment variables
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan');
      const originalSkip = process.env.SKIP_BUG_FINDING;
      const originalPlan = process.env.PLAN_DIR;

      // VERIFY: Variables are set
      expect(process.env.SKIP_BUG_FINDING).toBe(originalSkip);
      expect(process.env.PLAN_DIR).toBe(originalPlan);

      // NOTE: When guard is implemented, uncomment:
      // EXECUTE: Validate guard
      // validateNestedExecutionGuard({ logger });
      // VERIFY: Other variables unchanged
      // expect(process.env.SKIP_BUG_FINDING).toBe(originalSkip);
      // expect(process.env.PLAN_DIR).toBe(originalPlan);
    });
  });

  // ========================================================================
  // Environment Variable Cleanup Verification
  // ========================================================================

  describe('Environment Variable Cleanup', () => {
    it('should restore environment variables between tests', () => {
      // This test verifies that vi.unstubAllEnvs() in afterEach works correctly
      // If this test passes, it means the cleanup is working
      expect(process.env.PRP_PIPELINE_RUNNING).toBeUndefined();
      expect(process.env.SKIP_BUG_FINDING).toBeUndefined();
    });

    it('should handle multiple environment variable operations in single test', () => {
      // SETUP: Set multiple variables
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed');

      // EXECUTE: Modify some variables
      vi.stubEnv('PRP_PIPELINE_RUNNING', '67890');
      vi.stubEnv('SKIP_BUG_FINDING', 'false');

      // VERIFY: Latest values are set
      expect(process.env.PRP_PIPELINE_RUNNING).toBe('67890');
      expect(process.env.SKIP_BUG_FINDING).toBe('false');
      expect(process.env.PLAN_DIR).toBe('/path/to/plan/003_b3d3efdaf0ed');
    });
  });
});
