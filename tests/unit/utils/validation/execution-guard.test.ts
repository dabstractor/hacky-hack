/**
 * Unit tests for execution guard utilities
 *
 * @remarks
 * Tests validate the nested execution guard functionality including:
 * 1. First execution (PRP_PIPELINE_RUNNING not set)
 * 2. Legitimate bug fix recursion (SKIP_BUG_FINDING='true' + path contains 'bugfix')
 * 3. Illegitimate nested execution (throws NestedExecutionError)
 * 4. Error message format with existing PID
 * 5. Error context with existingPid, currentPid, sessionPath
 * 6. instanceof checks for NestedExecutionError
 * 7. Type guard function (isNestedExecutionError)
 * 8. Case variations in 'bugfix' substring
 * 9. SKIP_BUG_FINDING exact string matching
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  validateNestedExecution,
  NestedExecutionError,
  isNestedExecutionError,
} from '../../../../src/utils/validation/execution-guard.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('execution-guard', () => {
  // Clear any caches or state before each test
  beforeEach(() => {
    // Clear environment variables
    delete process.env.PRP_PIPELINE_RUNNING;
    delete process.env.SKIP_BUG_FINDING;
  });

  afterEach(() => {
    // CRITICAL: Always restore environment state
    vi.unstubAllEnvs();
  });

  // ========================================================================
  // First execution tests (PRP_PIPELINE_RUNNING not set)
  // ========================================================================

  describe('validateNestedExecution when PRP_PIPELINE_RUNNING is not set', () => {
    it('should allow execution for any path', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for feature path', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for empty path', () => {
      const sessionPath = '';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution when SKIP_BUG_FINDING is not set', () => {
      delete process.env.SKIP_BUG_FINDING;
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution when SKIP_BUG_FINDING is false', () => {
      process.env.SKIP_BUG_FINDING = 'false';
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });
  });

  // ========================================================================
  // Legitimate bug fix recursion tests
  // ========================================================================

  describe('validateNestedExecution when PRP_PIPELINE_RUNNING is set with bug fix recursion', () => {
    beforeEach(() => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
    });

    it('should allow execution for bugfix path', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for bugfix path at start', () => {
      const sessionPath = 'bugfix/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for bugfix path at end', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for BugFix with mixed case', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/BugFix/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for BUGFIX with uppercase', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/BUGFIX/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for bugFiX with random case', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/bugFiX/001_test';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });

    it('should allow execution for actual bugfix session from codebase', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      expect(() => validateNestedExecution(sessionPath)).not.toThrow();
    });
  });

  // ========================================================================
  // Illegitimate nested execution tests
  // ========================================================================

  describe('validateNestedExecution when PRP_PIPELINE_RUNNING is set without bug fix recursion', () => {
    beforeEach(() => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
    });

    describe('when SKIP_BUG_FINDING is not set', () => {
      beforeEach(() => {
        delete process.env.SKIP_BUG_FINDING;
      });

      it('should throw NestedExecutionError for bugfix path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });

      it('should throw NestedExecutionError for feature path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });

      it('should throw NestedExecutionError for empty path', () => {
        const sessionPath = '';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });
    });

    describe('when SKIP_BUG_FINDING is set to false', () => {
      beforeEach(() => {
        vi.stubEnv('SKIP_BUG_FINDING', 'false');
      });

      it('should throw NestedExecutionError for bugfix path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });
    });

    describe('when path does not contain bugfix', () => {
      beforeEach(() => {
        vi.stubEnv('SKIP_BUG_FINDING', 'true');
      });

      it('should throw NestedExecutionError for feature path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });

      it('should throw NestedExecutionError for enhancement path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/enhancement/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });

      it('should throw NestedExecutionError for refactor path', () => {
        const sessionPath = 'plan/003_b3d3efdaf0ed/refactor/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });
    });

    describe('when SKIP_BUG_FINDING has wrong case', () => {
      it('should throw NestedExecutionError for TRUE (uppercase)', () => {
        vi.stubEnv('SKIP_BUG_FINDING', 'TRUE');
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });

      it('should throw NestedExecutionError for True (capitalized)', () => {
        vi.stubEnv('SKIP_BUG_FINDING', 'True');
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });

      it('should throw NestedExecutionError for 1 (number string)', () => {
        vi.stubEnv('SKIP_BUG_FINDING', '1');
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });

      it('should throw NestedExecutionError for yes', () => {
        vi.stubEnv('SKIP_BUG_FINDING', 'yes');
        const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test';
        expect(() => validateNestedExecution(sessionPath)).toThrow(
          NestedExecutionError
        );
      });
    });
  });

  // ========================================================================
  // Error properties tests
  // ========================================================================

  describe('validateNestedExecution error properties', () => {
    beforeEach(() => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
    });

    it('should include existing PID in error message', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect((error as Error).message).toContain('99999');
        expect((error as Error).message).toContain(
          'Nested PRP Pipeline execution detected. Only bug fix sessions can recurse'
        );
      }
    });

    it('should include context with existingPid', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect((error as NestedExecutionError).existingPid).toBe('99999');
      }
    });

    it('should include context with currentPid', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect((error as NestedExecutionError).currentPid).toBeDefined();
        expect((error as NestedExecutionError).currentPid).toBe(
          process.pid.toString()
        );
      }
    });

    it('should include context with sessionPath', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect((error as NestedExecutionError).sessionPath).toBe(sessionPath);
      }
    });

    it('should have correct error code', () => {
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect((error as NestedExecutionError).code).toBe(
          'PIPELINE_VALIDATION_NESTED_EXECUTION'
        );
      }
    });
  });

  // ========================================================================
  // Type guard tests
  // ========================================================================

  describe('isNestedExecutionError type guard', () => {
    it('should identify NestedExecutionError correctly', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect(isNestedExecutionError(error)).toBe(true);
      }
    });

    it('should return false for generic Error', () => {
      const genericError = new Error('Some error');
      expect(isNestedExecutionError(genericError)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNestedExecutionError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNestedExecutionError(undefined)).toBe(false);
    });

    it('should return false for plain object', () => {
      const plainObject = {
        message: 'error',
        code: 'PIPELINE_VALIDATION_NESTED_EXECUTION',
      };
      expect(isNestedExecutionError(plainObject)).toBe(false);
    });

    it('should enable type narrowing in catch block', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
      } catch (error) {
        if (isNestedExecutionError(error)) {
          // Type should be narrowed to NestedExecutionError
          expect(error.existingPid).toBe('12345');
          expect(error.sessionPath).toBe(sessionPath);
        } else {
          expect.fail('Error should be NestedExecutionError');
        }
      }
    });
  });

  // ========================================================================
  // instanceof tests
  // ========================================================================

  describe('NestedExecutionError instanceof checks', () => {
    it('should be instanceof NestedExecutionError', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect(error instanceof NestedExecutionError).toBe(true);
      }
    });

    it('should be instanceof Error', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect(error instanceof Error).toBe(true);
      }
    });

    it('should have correct name property', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      const sessionPath = 'plan/003_b3d3efdaf0ed/feature/001_test';
      try {
        validateNestedExecution(sessionPath);
        expect.fail('Should have thrown NestedExecutionError');
      } catch (error) {
        expect((error as Error).name).toBe('NestedExecutionError');
      }
    });
  });

  // ========================================================================
  // Edge case tests
  // ========================================================================

  describe('validateNestedExecution edge cases', () => {
    it('should handle very long session paths', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      const longPath =
        'plan/003_b3d3efdaf0ed/' + 'bugfix/'.repeat(100) + '001_test';
      expect(() => validateNestedExecution(longPath)).not.toThrow();
    });

    it('should handle special characters in session path', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      const specialPath = 'plan/003_b3d3efdaf0ed/bugfix/001_test-123';
      expect(() => validateNestedExecution(specialPath)).not.toThrow();
    });

    it('should handle unicode characters in session path', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      const unicodePath = 'plan/003_b3d3efdaf0ed/bugfix/001_тест';
      expect(() => validateNestedExecution(unicodePath)).not.toThrow();
    });

    it('should handle whitespace in session path', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      const whitespacePath = 'plan/003_b3d3efdaf0ed/bugfix/ 001 test ';
      expect(() => validateNestedExecution(whitespacePath)).not.toThrow();
    });

    it('should handle multiple bugfix substrings in path', () => {
      vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      const multiBugfixPath = 'plan/003_b3d3efdaf0ed/bugfix/001_bugfix_test';
      expect(() => validateNestedExecution(multiBugfixPath)).not.toThrow();
    });
  });
});
