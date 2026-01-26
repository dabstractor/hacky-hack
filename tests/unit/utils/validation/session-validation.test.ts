/**
 * Unit tests for session validation utilities
 *
 * @remarks
 * Tests validate the session path validation functionality including:
 * 1. Valid bugfix session paths (containing 'bugfix' substring)
 * 2. Invalid session paths (not containing 'bugfix')
 * 3. Error message format with session path
 * 4. instanceof checks for BugfixSessionValidationError
 * 5. Edge cases: empty string, whitespace, case sensitivity
 * 6. Different positions of 'bugfix' in path
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  validateBugfixSession,
  BugfixSessionValidationError,
} from '../../../../src/utils/validation/session-validation.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('session-validation', () => {
  // Clear any caches or state before each test
  beforeEach(() => {
    // No state to clear for this module
  });

  afterEach(() => {
    // No cleanup needed
  });

  // ========================================================================
  // Valid path tests
  // ========================================================================

  describe('validateBugfixSession with valid paths', () => {
    it('should accept path with bugfix substring in middle', () => {
      const validPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should accept path with bugfix at start', () => {
      const validPath = 'bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should accept path with bugfix at end', () => {
      const validPath = 'plan/003_b3d3efdaf0ed/bugfix';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should accept absolute path with bugfix', () => {
      const validPath =
        '/absolute/path/to/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should accept path with bugfix as directory name only', () => {
      const validPath = 'bugfix';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should accept path with multiple bugfix occurrences', () => {
      const validPath = 'plan/bugfix/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should return undefined for valid path', () => {
      const validPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      const result = validateBugfixSession(validPath);
      expect(result).toBeUndefined();
    });
  });

  // ========================================================================
  // Invalid path tests
  // ========================================================================

  describe('validateBugfixSession with invalid paths', () => {
    it('should reject path without bugfix substring', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should reject path with different case (Bugfix)', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/Bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should reject path with different case (BUGFIX)', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/BUGFIX/001_d5507a871918';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should reject path with mixed case', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/BuGfIx/001_d5507a871918';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should accept path with bugfixes (contains bugfix substring)', () => {
      const validPath = 'plan/003_b3d3efdaf0ed/bugfixes/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should reject path with bug-fix (hyphenated)', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/bug-fix/001_d5507a871918';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should reject regular session path', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should reject feature session path', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should reject empty string', () => {
      const invalidPath = '';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });
  });

  // ========================================================================
  // Error message tests
  // ========================================================================

  describe('Error message format', () => {
    it('should include session path in error message', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(BugfixSessionValidationError);
        expect((error as Error).message).toContain(invalidPath);
      }
    });

    it('should include clear error description', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(BugfixSessionValidationError);
        expect((error as Error).message).toContain(
          'Bug fix tasks can only be executed within bugfix sessions'
        );
      }
    });

    it('should have correct error message format', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(BugfixSessionValidationError);
        expect((error as Error).message).toBe(
          `Bug fix tasks can only be executed within bugfix sessions. Invalid path: ${invalidPath}`
        );
      }
    });
  });

  // ========================================================================
  // instanceof and prototype chain tests
  // ========================================================================

  describe('BugfixSessionValidationError class', () => {
    it('should be instanceof BugfixSessionValidationError', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(BugfixSessionValidationError);
      }
    });

    it('should be instanceof Error', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should have correct name property', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect((error as BugfixSessionValidationError).name).toBe(
          'BugfixSessionValidationError'
        );
      }
    });

    it('should have correct error code', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect((error as BugfixSessionValidationError).code).toBe(
          'PIPELINE_SESSION_INVALID_BUGFIX_PATH'
        );
      }
    });

    it('should have correct prototype chain', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect(Object.getPrototypeOf(error)).toBe(
          BugfixSessionValidationError.prototype
        );
        // The prototype chain is: BugfixSessionValidationError -> PipelineError -> Error
        expect(
          Object.getPrototypeOf(Object.getPrototypeOf(error))
        ).toBeDefined();
      }
    });
  });

  // ========================================================================
  // Edge case tests
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle whitespace-only string', () => {
      const invalidPath = '   ';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should handle path with leading/trailing whitespace containing bugfix', () => {
      const validPath = '  plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918  ';
      // This should pass because includes('bugfix') will match
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should handle path with leading/trailing whitespace without bugfix', () => {
      const invalidPath = '  plan/003_b3d3efdaf0ed/feature/001_xyz  ';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should handle special characters in path', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/@#$%/001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should handle path with unicode characters', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/🐛/001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should handle very long path without bugfix', () => {
      const invalidPath = 'plan/' + 'a'.repeat(1000) + '/feature/001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should handle very long path with bugfix', () => {
      const validPath = 'plan/' + 'a'.repeat(1000) + '/bugfix/001_xyz';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should handle path with newlines containing bugfix', () => {
      const validPath = 'plan/003_b3d3efdaf0ed\n/bugfix\n/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should handle path with tabs containing bugfix', () => {
      const validPath = 'plan/003_b3d3efdaf0ed\t/bugfix\t/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });
  });

  // ========================================================================
  // Cross-platform path tests
  // ========================================================================

  describe('Cross-platform path validation', () => {
    it('should handle Unix-style paths with bugfix', () => {
      const validPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should handle Unix-style paths without bugfix', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should handle Windows-style paths with bugfix', () => {
      const validPath = 'plan\\003_b3d3efdaf0ed\\bugfix\\001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should handle Windows-style paths without bugfix', () => {
      const invalidPath = 'plan\\003_b3d3efdaf0ed\\feature\\001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });

    it('should handle mixed-style paths with bugfix', () => {
      const validPath = 'plan/003_b3d3efdaf0ed\\bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should handle absolute Windows paths with bugfix', () => {
      const validPath = 'C:\\plan\\003_b3d3efdaf0ed\\bugfix\\001_d5507a871918';
      expect(() => validateBugfixSession(validPath)).not.toThrow();
    });

    it('should handle absolute Windows paths without bugfix', () => {
      const invalidPath = 'C:\\plan\\003_b3d3efdaf0ed\\feature\\001_xyz';
      expect(() => validateBugfixSession(invalidPath)).toThrow(
        BugfixSessionValidationError
      );
    });
  });

  // ========================================================================
  // Integration scenario tests
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should support typical validation pattern with try-catch', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';

      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(BugfixSessionValidationError);
        expect((error as BugfixSessionValidationError).code).toBe(
          'PIPELINE_SESSION_INVALID_BUGFIX_PATH'
        );
        expect((error as Error).message).toContain(invalidPath);
      }
    });

    it('should support error code checking', () => {
      const invalidPath = 'plan/003_b3d3efdaf0ed/feature/001_xyz';

      try {
        validateBugfixSession(invalidPath);
        expect.fail('Should have thrown BugfixSessionValidationError');
      } catch (error) {
        if (error instanceof BugfixSessionValidationError) {
          expect(error.code).toBe('PIPELINE_SESSION_INVALID_BUGFIX_PATH');
        } else {
          expect.fail('Should be BugfixSessionValidationError');
        }
      }
    });

    it('should support early validation pattern in constructor', () => {
      // Simulate FixCycleWorkflow constructor validation
      class TestWorkflow {
        constructor(sessionPath: string) {
          validateBugfixSession(sessionPath);
          // Would continue with constructor logic...
        }
      }

      // Valid path should not throw
      expect(
        () => new TestWorkflow('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918')
      ).not.toThrow();

      // Invalid path should throw
      expect(
        () => new TestWorkflow('plan/003_b3d3efdaf0ed/feature/001_xyz')
      ).toThrow(BugfixSessionValidationError);
    });

    it('should work with actual bugfix session path from codebase', () => {
      const actualBugfixPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      expect(() => validateBugfixSession(actualBugfixPath)).not.toThrow();
    });

    it('should reject regular session path from codebase', () => {
      const regularSessionPath = 'plan/003_b3d3efdaf0ed';
      expect(() => validateBugfixSession(regularSessionPath)).toThrow(
        BugfixSessionValidationError
      );
    });
  });
});
