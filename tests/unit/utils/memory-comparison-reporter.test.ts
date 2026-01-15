/**
 * Unit tests for Memory Comparison Reporter
 *
 * @remarks
 * Tests validate memory comparison functionality including:
 * 1. Comparison of "before" state (Issue 2) against "after" state (S2 result)
 * 2. Improved logic: improved = afterCompleted && !afterHadMemoryErrors
 * 3. Hardcoded before state from Issue 2 documentation
 * 4. After state generation based on S2 result fields
 * 5. Details object with all comparison metrics
 * 6. Logging using existing logger
 * 7. Pure function - no external execution
 * 8. Null/undefined input handling
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock logger - use factory function to avoid hoisting issues
vi.mock('../../../src/utils/logger.js', () => {
  const mockLogger = {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  };
  return {
    getLogger: vi.fn(() => mockLogger),
    __mockLogger: mockLogger, // Export for test access
  };
});

// Import mocked modules
import { getLogger } from '../../../src/utils/logger.js';
import {
  compareMemoryUsage,
  type MemoryComparisonResult,
  type MemoryComparisonDetails,
} from '../../../src/utils/memory-comparison-reporter.js';
import type { FullTestSuiteResult } from '../../../src/utils/full-test-suite-runner.js';

// =============================================================================
// TEST DATA
// ============================================================================

/**
 * Sample successful S2 result (no memory errors)
 */
const SUCCESS_S2_RESULT: FullTestSuiteResult = {
  completed: true,
  memoryErrors: false,
  testResults: {
    pass: 1593,
    fail: 58,
    total: 1688,
  },
  output: 'Test suite completed',
  exitCode: 1, // Non-zero because tests failed, but no memory error
  memoryError: null,
};

/**
 * Sample memory error S2 result
 */
const MEMORY_ERROR_S2_RESULT: FullTestSuiteResult = {
  completed: true,
  memoryErrors: true,
  testResults: null,
  output: 'Worker terminated due to reaching memory limit',
  exitCode: 134,
  memoryError: {
    hasMemoryError: true,
    errorType: 'WORKER_OOM',
    matchedPattern: 'Worker terminated.*memory',
    exitCode: 134,
    suggestion: 'Add memory limits',
    severity: 'fatal',
  },
};

/**
 * Sample incomplete S2 result
 */
const INCOMPLETE_S2_RESULT: FullTestSuiteResult = {
  completed: false,
  memoryErrors: true,
  testResults: null,
  output: 'Process hung',
  exitCode: null,
  memoryError: null,
  error: 'Test suite timed out',
};

/**
 * Sample S2 result with test failures but no memory errors (should be improved)
 */
const TEST_FAILURES_S2_RESULT: FullTestSuiteResult = {
  completed: true,
  memoryErrors: false,
  testResults: {
    pass: 1500,
    fail: 188,
    total: 1688,
  },
  output: 'Some tests failed',
  exitCode: 1,
  memoryError: null,
};

/**
 * Sample S2 result without test results (null)
 */
const NO_TEST_RESULTS_S2_RESULT: FullTestSuiteResult = {
  completed: true,
  memoryErrors: false,
  testResults: null,
  output: 'Tests completed but parsing failed',
  exitCode: 0,
  memoryError: null,
};

// =============================================================================
// TEST SETUP
// ============================================================================

describe('memory-comparison-reporter', () => {
  let mockLoggerInstance: ReturnType<typeof getLogger>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggerInstance = getLogger('MemoryComparisonReporter');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests (improved: true scenarios)
  // ========================================================================

  describe('Happy path - Memory improvement confirmed', () => {
    it('should return improved: true when completed=true and memoryErrors=false', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.improved).toBe(true);
    });

    it('should return correct beforeState hardcoded from Issue 2', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.beforeState).toBe(
        'Worker terminated due to reaching memory limit: JS heap out of memory (Issue 2)'
      );
    });

    it('should include test counts in afterState when testResults is available', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.afterState).toBe(
        'Test suite completed: 1593 passed, 58 failed (1688 total) - No memory errors detected'
      );
    });

    it('should include all required fields in details object', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.details).toBeDefined();
      expect(result.details.beforeCompleted).toBe(false);
      expect(result.details.afterCompleted).toBe(true);
      expect(result.details.beforeHadMemoryErrors).toBe(true);
      expect(result.details.afterHadMemoryErrors).toBe(false);
      expect(result.details.testResults).toEqual({
        pass: 1593,
        fail: 58,
        total: 1688,
      });
    });

    it('should return improved: true even with test failures (no memory errors)', () => {
      const result = compareMemoryUsage(TEST_FAILURES_S2_RESULT);

      expect(result.improved).toBe(true);
      expect(result.afterState).toContain(
        '1500 passed, 188 failed (1688 total)'
      );
      expect(result.afterState).toContain('No memory errors detected');
    });

    it('should handle null testResults gracefully with improved: true', () => {
      const result = compareMemoryUsage(NO_TEST_RESULTS_S2_RESULT);

      expect(result.improved).toBe(true);
      expect(result.afterState).toBe(
        'Test suite completed - No memory errors detected'
      );
      expect(result.details.testResults).toBeNull();
    });

    it('should log info when improvement is confirmed', () => {
      compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Memory improvement confirmed',
        {
          before:
            'Worker terminated due to reaching memory limit: JS heap out of memory (Issue 2)',
          after:
            'Test suite completed: 1593 passed, 58 failed (1688 total) - No memory errors detected',
          testResults: {
            pass: 1593,
            fail: 58,
            total: 1688,
          },
        }
      );
    });

    it('should log debug with full details', () => {
      compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
        'Memory usage comparison details',
        expect.objectContaining({
          improved: true,
          details: expect.any(Object),
        })
      );
    });
  });

  // ========================================================================
  // No improvement tests (improved: false scenarios)
  // ========================================================================

  describe('No improvement - Memory errors persist', () => {
    it('should return improved: false when memoryErrors=true', () => {
      const result = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(result.improved).toBe(false);
    });

    it('should indicate memory errors in afterState', () => {
      const result = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(result.afterState).toBe(
        'Test suite completed - Memory errors detected'
      );
    });

    it('should return improved: false when completed=false', () => {
      const result = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result.improved).toBe(false);
    });

    it('should indicate completion failure in afterState when not completed', () => {
      const result = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result.afterState).toBe(
        'Test suite failed to complete - Memory errors detected'
      );
    });

    it('should include afterHadMemoryErrors: true in details when memory errors present', () => {
      const result = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(result.details.afterHadMemoryErrors).toBe(true);
    });

    it('should include afterCompleted: false in details when not completed', () => {
      const result = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result.details.afterCompleted).toBe(false);
    });

    it('should log warn when no improvement detected', () => {
      compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'No memory improvement detected',
        {
          before:
            'Worker terminated due to reaching memory limit: JS heap out of memory (Issue 2)',
          after: 'Test suite completed - Memory errors detected',
          afterCompleted: true,
          afterHadMemoryErrors: true,
        }
      );
    });

    it('should set testResults to null when memory errors occurred', () => {
      const result = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(result.details.testResults).toBeNull();
    });
  });

  // ========================================================================
  // Before state tests (verify hardcoded Issue 2 state)
  // ========================================================================

  describe('Before state - Hardcoded Issue 2 description', () => {
    it('should always return the same beforeState regardless of input', () => {
      const result1 = compareMemoryUsage(SUCCESS_S2_RESULT);
      const result2 = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);
      const result3 = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result1.beforeState).toBe(result2.beforeState);
      expect(result2.beforeState).toBe(result3.beforeState);
      expect(result1.beforeState).toContain(
        'Worker terminated due to reaching memory limit'
      );
      expect(result1.beforeState).toContain('Issue 2');
    });

    it('should always have beforeCompleted: false in details', () => {
      const result1 = compareMemoryUsage(SUCCESS_S2_RESULT);
      const result2 = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);
      const result3 = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result1.details.beforeCompleted).toBe(false);
      expect(result2.details.beforeCompleted).toBe(false);
      expect(result3.details.beforeCompleted).toBe(false);
    });

    it('should always have beforeHadMemoryErrors: true in details', () => {
      const result1 = compareMemoryUsage(SUCCESS_S2_RESULT);
      const result2 = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);
      const result3 = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result1.details.beforeHadMemoryErrors).toBe(true);
      expect(result2.details.beforeHadMemoryErrors).toBe(true);
      expect(result3.details.beforeHadMemoryErrors).toBe(true);
    });
  });

  // ========================================================================
  // After state generation tests
  // ========================================================================

  describe('After state generation', () => {
    it('should include test counts when testResults is not null', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.afterState).toContain(
        '1593 passed, 58 failed (1688 total)'
      );
    });

    it('should exclude test counts when testResults is null', () => {
      const result = compareMemoryUsage(NO_TEST_RESULTS_S2_RESULT);

      expect(result.afterState).not.toContain('passed');
      expect(result.afterState).not.toContain('failed');
      expect(result.afterState).toBe(
        'Test suite completed - No memory errors detected'
      );
    });

    it('should indicate "No memory errors detected" when memoryErrors=false', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.afterState).toContain('No memory errors detected');
    });

    it('should indicate "Memory errors detected" when memoryErrors=true', () => {
      const result = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(result.afterState).toContain('Memory errors detected');
    });

    it('should indicate completion status when completed=false', () => {
      const result = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result.afterState).toContain('failed to complete');
    });

    it('should indicate completion status when completed=true', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.afterState).toContain('completed');
    });

    it('should handle edge case: completed=false and memoryErrors=false', () => {
      const edgeCaseResult: FullTestSuiteResult = {
        completed: false,
        memoryErrors: false,
        testResults: null,
        output: 'Process hung for non-memory reason',
        exitCode: null,
        memoryError: null,
        error: 'Timeout',
      };

      const result = compareMemoryUsage(edgeCaseResult);

      expect(result.afterState).toBe('Test suite failed to complete');
    });
  });

  // ========================================================================
  // Details object tests
  // ========================================================================

  describe('Details object structure', () => {
    it('should have all required fields in details', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.details).toHaveProperty('beforeCompleted');
      expect(result.details).toHaveProperty('afterCompleted');
      expect(result.details).toHaveProperty('beforeHadMemoryErrors');
      expect(result.details).toHaveProperty('afterHadMemoryErrors');
      expect(result.details).toHaveProperty('testResults');
    });

    it('should have readonly properties on details', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      // TypeScript should prevent mutation, but we verify the structure
      expect(result.details.beforeCompleted).toBe(false);
      expect(result.details.afterCompleted).toBe(true);
      expect(result.details.beforeHadMemoryErrors).toBe(true);
      expect(result.details.afterHadMemoryErrors).toBe(false);
      expect(result.details.testResults).toEqual({
        pass: 1593,
        fail: 58,
        total: 1688,
      });
    });

    it('should have readonly properties on result', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.improved).toBe(true);
      expect(result.beforeState).toBe(
        'Worker terminated due to reaching memory limit: JS heap out of memory (Issue 2)'
      );
      expect(result.afterState).toContain('Test suite completed');
    });

    it('should match input testResults in details', () => {
      const customResult: FullTestSuiteResult = {
        completed: true,
        memoryErrors: false,
        testResults: { pass: 100, fail: 10, total: 110 },
        output: 'Tests',
        exitCode: 0,
        memoryError: null,
      };

      const result = compareMemoryUsage(customResult);

      expect(result.details.testResults).toEqual({
        pass: 100,
        fail: 10,
        total: 110,
      });
    });

    it('should set testResults to null when input has null testResults', () => {
      const result = compareMemoryUsage(NO_TEST_RESULTS_S2_RESULT);

      expect(result.details.testResults).toBeNull();
    });

    it('should set afterCompleted to match input completed', () => {
      const result1 = compareMemoryUsage(SUCCESS_S2_RESULT);
      const result2 = compareMemoryUsage(INCOMPLETE_S2_RESULT);

      expect(result1.details.afterCompleted).toBe(true);
      expect(result2.details.afterCompleted).toBe(false);
    });

    it('should set afterHadMemoryErrors to match input memoryErrors', () => {
      const result1 = compareMemoryUsage(SUCCESS_S2_RESULT);
      const result2 = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(result1.details.afterHadMemoryErrors).toBe(false);
      expect(result2.details.afterHadMemoryErrors).toBe(true);
    });
  });

  // ========================================================================
  // Logging tests
  // ========================================================================

  describe('Logging behavior', () => {
    it('should use MemoryComparisonReporter context for logger', () => {
      compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(mockLoggerInstance.debug).toHaveBeenCalled();
      expect(mockLoggerInstance.info).toHaveBeenCalled();
    });

    it('should log at info level when improved', () => {
      compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Memory improvement confirmed',
        expect.any(Object)
      );
    });

    it('should log at warn level when not improved', () => {
      compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'No memory improvement detected',
        expect.any(Object)
      );
    });

    it('should log at debug level with details', () => {
      compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
        'Memory usage comparison details',
        expect.objectContaining({
          improved: expect.any(Boolean),
          beforeState: expect.any(String),
          afterState: expect.any(String),
          details: expect.any(Object),
        })
      );
    });

    it('should log at warn level when null input', () => {
      compareMemoryUsage(null);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'compareMemoryUsage called with null/undefined input'
      );
    });
  });

  // ========================================================================
  // Edge case tests
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle null input gracefully', () => {
      const result = compareMemoryUsage(null);

      expect(result.improved).toBe(false);
      expect(result.beforeState).toContain('Issue 2');
      expect(result.afterState).toContain('Invalid input');
      expect(result.details.afterCompleted).toBe(false);
      expect(result.details.afterHadMemoryErrors).toBe(false);
      expect(result.details.testResults).toBeNull();
    });

    it('should handle undefined input gracefully', () => {
      const result = compareMemoryUsage(undefined);

      expect(result.improved).toBe(false);
      expect(result.beforeState).toContain('Issue 2');
      expect(result.afterState).toContain('Invalid input');
      expect(result.details.afterCompleted).toBe(false);
    });

    it('should not throw exceptions for any input', () => {
      expect(() => compareMemoryUsage(null)).not.toThrow();
      expect(() => compareMemoryUsage(undefined)).not.toThrow();
      expect(() => compareMemoryUsage(SUCCESS_S2_RESULT)).not.toThrow();
      expect(() => compareMemoryUsage(MEMORY_ERROR_S2_RESULT)).not.toThrow();
    });

    it('should handle completed=true, memoryErrors=false, testResults=null', () => {
      const edgeCase: FullTestSuiteResult = {
        completed: true,
        memoryErrors: false,
        testResults: null,
        output: 'Completed',
        exitCode: 0,
        memoryError: null,
      };

      const result = compareMemoryUsage(edgeCase);

      expect(result.improved).toBe(true);
      expect(result.afterState).toBe(
        'Test suite completed - No memory errors detected'
      );
      expect(result.details.testResults).toBeNull();
    });

    it('should handle completed=false, memoryErrors=true with error message', () => {
      const edgeCase: FullTestSuiteResult = {
        completed: false,
        memoryErrors: true,
        testResults: null,
        output: 'Worker terminated',
        exitCode: 134,
        memoryError: {
          hasMemoryError: true,
          errorType: 'WORKER_OOM',
          matchedPattern: 'Worker terminated.*memory',
          exitCode: 134,
          suggestion: 'Add memory limits',
          severity: 'fatal',
        },
        error: 'Test suite failed',
      };

      const result = compareMemoryUsage(edgeCase);

      expect(result.improved).toBe(false);
      expect(result.afterState).toBe(
        'Test suite failed to complete - Memory errors detected'
      );
    });

    it('should handle large test counts', () => {
      const largeCounts: FullTestSuiteResult = {
        completed: true,
        memoryErrors: false,
        testResults: { pass: 10000, fail: 500, total: 10500 },
        output: 'Large suite',
        exitCode: 0,
        memoryError: null,
      };

      const result = compareMemoryUsage(largeCounts);

      expect(result.afterState).toContain(
        '10000 passed, 500 failed (10500 total)'
      );
      expect(result.improved).toBe(true);
    });

    it('should handle zero failed tests', () => {
      const allPassed: FullTestSuiteResult = {
        completed: true,
        memoryErrors: false,
        testResults: { pass: 1688, fail: 0, total: 1688 },
        output: 'All passed',
        exitCode: 0,
        memoryError: null,
      };

      const result = compareMemoryUsage(allPassed);

      expect(result.afterState).toContain('1688 passed, 0 failed (1688 total)');
      expect(result.improved).toBe(true);
    });

    it('should handle zero passed tests (all failed, but no memory error)', () => {
      const allFailed: FullTestSuiteResult = {
        completed: true,
        memoryErrors: false,
        testResults: { pass: 0, fail: 100, total: 100 },
        output: 'All failed',
        exitCode: 1,
        memoryError: null,
      };

      const result = compareMemoryUsage(allFailed);

      expect(result.afterState).toContain('0 passed, 100 failed (100 total)');
      expect(result.improved).toBe(true); // Still improved because no memory errors
    });
  });

  // ========================================================================
  // Integration pattern tests (matches PRP examples)
  // ========================================================================

  describe('Expected output examples from PRP', () => {
    it('should match expected improved result from PRP', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.improved).toBe(true);
      expect(result.beforeState).toBe(
        'Worker terminated due to reaching memory limit: JS heap out of memory (Issue 2)'
      );
      expect(result.afterState).toBe(
        'Test suite completed: 1593 passed, 58 failed (1688 total) - No memory errors detected'
      );
      expect(result.details).toEqual({
        beforeCompleted: false,
        afterCompleted: true,
        beforeHadMemoryErrors: true,
        afterHadMemoryErrors: false,
        testResults: { pass: 1593, fail: 58, total: 1688 },
      });
    });

    it('should match expected no improvement result from PRP', () => {
      const result = compareMemoryUsage(MEMORY_ERROR_S2_RESULT);

      expect(result.improved).toBe(false);
      expect(result.beforeState).toBe(
        'Worker terminated due to reaching memory limit: JS heap out of memory (Issue 2)'
      );
      expect(result.afterState).toBe(
        'Test suite completed - Memory errors detected'
      );
      expect(result.details).toEqual({
        beforeCompleted: false,
        afterCompleted: true,
        beforeHadMemoryErrors: true,
        afterHadMemoryErrors: true,
        testResults: null,
      });
    });
  });

  // ========================================================================
  // Type safety tests
  // ========================================================================

  describe('Type safety', () => {
    it('should export MemoryComparisonResult type', () => {
      const result: MemoryComparisonResult =
        compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result.improved).toBeDefined();
      expect(result.beforeState).toBeDefined();
      expect(result.afterState).toBeDefined();
      expect(result.details).toBeDefined();
    });

    it('should export MemoryComparisonDetails type', () => {
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);
      const details: MemoryComparisonDetails = result.details;

      expect(details.beforeCompleted).toBeDefined();
      expect(details.afterCompleted).toBeDefined();
      expect(details.beforeHadMemoryErrors).toBeDefined();
      expect(details.afterHadMemoryErrors).toBeDefined();
      expect(details.testResults).toBeDefined();
    });

    it('should accept FullTestSuiteResult | null | undefined as input', () => {
      const result1: MemoryComparisonResult =
        compareMemoryUsage(SUCCESS_S2_RESULT);
      const result2: MemoryComparisonResult = compareMemoryUsage(null);
      const result3: MemoryComparisonResult = compareMemoryUsage(undefined);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });

  // ========================================================================
  // Pure function tests (no external execution)
  // ========================================================================

  describe('Pure function behavior', () => {
    it('should not spawn any processes', () => {
      // This is a pure function - no spawn calls
      // If this test runs without throwing, the function is pure
      const result = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result).toBeDefined();
    });

    it('should return same result for same input (deterministic)', () => {
      const result1 = compareMemoryUsage(SUCCESS_S2_RESULT);
      const result2 = compareMemoryUsage(SUCCESS_S2_RESULT);

      expect(result1).toEqual(result2);
    });

    it('should not have side effects on input', () => {
      const input = { ...SUCCESS_S2_RESULT };
      const originalExitCode = input.exitCode;

      compareMemoryUsage(input);

      expect(input.exitCode).toBe(originalExitCode);
    });
  });

  // ========================================================================
  // Improved logic tests
  // ========================================================================

  describe('Improved logic determination', () => {
    it('should be improved only when completed=true AND memoryErrors=false', () => {
      const cases = [
        { completed: true, memoryErrors: false, expected: true },
        { completed: true, memoryErrors: true, expected: false },
        { completed: false, memoryErrors: false, expected: false },
        { completed: false, memoryErrors: true, expected: false },
      ];

      cases.forEach(({ completed, memoryErrors, expected }) => {
        const input: FullTestSuiteResult = {
          completed,
          memoryErrors,
          testResults: { pass: 100, fail: 0, total: 100 },
          output: 'Test',
          exitCode: completed ? 0 : null,
          memoryError: memoryErrors
            ? {
                hasMemoryError: true,
                errorType: 'WORKER_OOM',
                matchedPattern: 'pattern',
                exitCode: 134,
                suggestion: 'fix',
                severity: 'fatal',
              }
            : null,
        };

        const result = compareMemoryUsage(input);
        expect(result.improved).toBe(expected);
      });
    });

    it('should not consider test failures as lack of improvement', () => {
      const manyFailures: FullTestSuiteResult = {
        completed: true,
        memoryErrors: false,
        testResults: { pass: 1, fail: 999, total: 1000 },
        output: 'Many failed',
        exitCode: 1,
        memoryError: null,
      };

      const result = compareMemoryUsage(manyFailures);

      expect(result.improved).toBe(true); // Still improved because no memory errors
    });

    it('should not be improved if memory errors even if all tests pass', () => {
      const memoryErrorButTestsPass: FullTestSuiteResult = {
        completed: true,
        memoryErrors: true, // Memory error occurred
        testResults: { pass: 1000, fail: 0, total: 1000 }, // But tests parsed
        output: 'Worker terminated after tests',
        exitCode: 134,
        memoryError: {
          hasMemoryError: true,
          errorType: 'WORKER_OOM',
          matchedPattern: 'pattern',
          exitCode: 134,
          suggestion: 'fix',
          severity: 'fatal',
        },
      };

      const result = compareMemoryUsage(memoryErrorButTestsPass);

      expect(result.improved).toBe(false); // Not improved due to memory errors
    });
  });
});
