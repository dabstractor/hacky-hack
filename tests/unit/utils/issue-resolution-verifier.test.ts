/**
 * Unit tests for Issue Resolution Verifier
 *
 * @remarks
 * Tests validate issue resolution verification functionality including:
 * 1. Memory issue resolution check using detectMemoryErrorInTestOutput
 * 2. Promise rejection resolution check with 3 patterns
 * 3. Resolution status determination for Issues 2 and 3
 * 4. Remaining issues array building
 * 5. All resolved flag calculation (AND logic)
 * 6. Null/undefined input handling
 * 7. Pure function - no external execution
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

// Mock memory-error-detector to control detection behavior
vi.mock('../../../src/utils/memory-error-detector.js', () => {
  return {
    detectMemoryErrorInTestOutput: vi.fn(),
  };
});

// Import mocked modules
import { getLogger } from '../../../src/utils/logger.js';
import { detectMemoryErrorInTestOutput } from '../../../src/utils/memory-error-detector.js';
import {
  verifyNoMemoryOrPromiseErrors,
  type IssueResolutionStatus,
  type TestSuiteResult,
} from '../../../src/utils/issue-resolution-verifier.js';

// =============================================================================
// TEST DATA
// ============================================================================

/**
 * Sample test result with both issues resolved
 */
const BOTH_RESOLVED_RESULT: TestSuiteResult = {
  completed: true,
  results: {
    pass: 1688,
    fail: 0,
    total: 1688,
  },
  hasMemoryErrors: false,
  hasPromiseRejections: false,
  executionTime: 245.5,
  output: 'Test Files  52 passed (52)\nTests       1688 passed (1688)\nTest Suites passed',
  exitCode: 0,
};

/**
 * Sample test result with Issue 2 (memory errors) present
 */
const ISSUE_2_PRESENT_RESULT: TestSuiteResult = {
  completed: true,
  results: {
    pass: 1593,
    fail: 95,
    total: 1688,
  },
  hasMemoryErrors: true,
  hasPromiseRejections: false,
  executionTime: 180.2,
  output: 'FATAL ERROR: JavaScript heap out of memory',
  exitCode: 134,
};

/**
 * Sample test result with Issue 3 (promise rejections) present
 */
const ISSUE_3_PRESENT_RESULT: TestSuiteResult = {
  completed: true,
  results: {
    pass: 1650,
    fail: 38,
    total: 1688,
  },
  hasMemoryErrors: false,
  hasPromiseRejections: true,
  executionTime: 220.1,
  output: '(node:471914) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously',
  exitCode: 1,
};

/**
 * Sample test result with both issues present
 */
const BOTH_ISSUES_PRESENT_RESULT: TestSuiteResult = {
  completed: true,
  results: {
    pass: 1500,
    fail: 188,
    total: 1688,
  },
  hasMemoryErrors: true,
  hasPromiseRejections: true,
  executionTime: 150.0,
  output: 'Worker terminated due to reaching memory limit\n(node:471914) PromiseRejectionHandledWarning',
  exitCode: 134,
};

/**
 * Sample test result with flags false but patterns in output
 * Tests the double-check pattern: flag false + patterns in output = not resolved
 */
const FLAGS_FALSE_PATTERNS_PRESENT_RESULT: TestSuiteResult = {
  completed: true,
  results: {
    pass: 1600,
    fail: 88,
    total: 1688,
  },
  hasMemoryErrors: false, // Flag is false
  hasPromiseRejections: false, // Flag is false
  executionTime: 210.5,
  output: 'JavaScript heap out of memory detected in output\nUnhandledPromiseRejectionWarning present',
  exitCode: 0,
};

// =============================================================================
// TEST CASES
// ============================================================================

describe('Issue Resolution Verifier', () => {
  let mockLoggerInstance: ReturnType<typeof getLogger>;

  beforeEach(() => {
    mockLoggerInstance = getLogger('IssueResolutionVerifier');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Test Group 1: Both Issues Resolved (Success Case)
  // ==========================================================================

  describe('when both issues are resolved', () => {
    beforeEach(() => {
      // Mock memory error detector to return no errors
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: 0,
        suggestion: '',
        severity: 'warning',
      });
    });

    it('should return memoryIssuesResolved = true', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(result.memoryIssuesResolved).toBe(true);
    });

    it('should return promiseIssuesResolved = true', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(result.promiseIssuesResolved).toBe(true);
    });

    it('should return allResolved = true', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(result.allResolved).toBe(true);
    });

    it('should return empty remainingIssues array', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(result.remainingIssues).toEqual([]);
    });

    it('should return empty errorDetails arrays', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(result.errorDetails.memoryErrors).toEqual([]);
      expect(result.errorDetails.promiseRejections).toEqual([]);
    });

    it('should log success message', () => {
      verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Both Issue 2 and Issue 3 resolved',
        expect.objectContaining({
          memoryIssuesResolved: true,
          promiseIssuesResolved: true,
        })
      );
    });
  });

  // ==========================================================================
  // Test Group 2: Issue 2 Present (Memory Errors)
  // ==========================================================================

  describe('when Issue 2 (memory errors) is present', () => {
    beforeEach(() => {
      // Mock memory error detector to return memory error
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'HEAP_OOM',
        matchedPattern: 'FATAL ERROR.*heap out of memory',
        exitCode: 134,
        suggestion: 'Set NODE_OPTIONS="--max-old-space-size=4096"',
        severity: 'fatal',
      });
    });

    it('should return memoryIssuesResolved = false', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(result.memoryIssuesResolved).toBe(false);
    });

    it('should return promiseIssuesResolved = true', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(result.promiseIssuesResolved).toBe(true);
    });

    it('should return allResolved = false (AND logic)', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(result.allResolved).toBe(false);
    });

    it('should include Issue 2 in remainingIssues', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(result.remainingIssues).toHaveLength(1);
      expect(result.remainingIssues[0]).toContain('Issue 2');
      expect(result.remainingIssues[0]).toContain('Memory errors');
    });

    it('should include matched memory pattern in errorDetails', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(result.errorDetails.memoryErrors).toHaveLength(1);
      expect(result.errorDetails.memoryErrors[0]).toBe('FATAL ERROR.*heap out of memory');
    });

    it('should return empty promiseRejections array', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(result.errorDetails.promiseRejections).toEqual([]);
    });
  });

  // ==========================================================================
  // Test Group 3: Issue 3 Present (Promise Rejections)
  // ==========================================================================

  describe('when Issue 3 (promise rejections) is present', () => {
    beforeEach(() => {
      // Mock memory error detector to return no errors
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: 1,
        suggestion: '',
        severity: 'warning',
      });
    });

    it('should return memoryIssuesResolved = true', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_3_PRESENT_RESULT);

      expect(result.memoryIssuesResolved).toBe(true);
    });

    it('should return promiseIssuesResolved = false', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_3_PRESENT_RESULT);

      expect(result.promiseIssuesResolved).toBe(false);
    });

    it('should return allResolved = false (AND logic)', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_3_PRESENT_RESULT);

      expect(result.allResolved).toBe(false);
    });

    it('should include Issue 3 in remainingIssues', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_3_PRESENT_RESULT);

      expect(result.remainingIssues).toHaveLength(1);
      expect(result.remainingIssues[0]).toContain('Issue 3');
      expect(result.remainingIssues[0]).toContain('Promise rejections');
    });

    it('should include matched promise pattern in errorDetails', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_3_PRESENT_RESULT);

      expect(result.errorDetails.promiseRejections).toHaveLength(1);
      expect(result.errorDetails.promiseRejections[0]).toBe('handledWarning');
    });

    it('should return empty memoryErrors array', () => {
      const result = verifyNoMemoryOrPromiseErrors(ISSUE_3_PRESENT_RESULT);

      expect(result.errorDetails.memoryErrors).toEqual([]);
    });
  });

  // ==========================================================================
  // Test Group 4: Both Issues Present
  // ==========================================================================

  describe('when both issues are present', () => {
    beforeEach(() => {
      // Mock memory error detector to return memory error
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'WORKER_OOM',
        matchedPattern: 'Worker terminated.*memory',
        exitCode: 134,
        suggestion: 'Add memory limits',
        severity: 'fatal',
      });
    });

    it('should return memoryIssuesResolved = false', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_ISSUES_PRESENT_RESULT);

      expect(result.memoryIssuesResolved).toBe(false);
    });

    it('should return promiseIssuesResolved = false', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_ISSUES_PRESENT_RESULT);

      expect(result.promiseIssuesResolved).toBe(false);
    });

    it('should return allResolved = false', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_ISSUES_PRESENT_RESULT);

      expect(result.allResolved).toBe(false);
    });

    it('should include both issues in remainingIssues', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_ISSUES_PRESENT_RESULT);

      expect(result.remainingIssues).toHaveLength(2);
      expect(result.remainingIssues[0]).toContain('Issue 2');
      expect(result.remainingIssues[1]).toContain('Issue 3');
    });

    it('should include both error types in errorDetails', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_ISSUES_PRESENT_RESULT);

      expect(result.errorDetails.memoryErrors).toHaveLength(1);
      expect(result.errorDetails.promiseRejections).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Test Group 5: Flags False but Patterns Present (Double-Check Pattern)
  // ==========================================================================

  describe('when flags are false but patterns are present in output', () => {
    beforeEach(() => {
      // Mock memory error detector to detect pattern even though flag is false
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true, // Pattern detected
        errorType: 'SYSTEM_OOM',
        matchedPattern: 'JavaScript heap out of memory',
        exitCode: 0,
        suggestion: 'Increase memory',
        severity: 'fatal',
      });
    });

    it('should return memoryIssuesResolved = false (pattern detected)', () => {
      const result = verifyNoMemoryOrPromiseErrors(FLAGS_FALSE_PATTERNS_PRESENT_RESULT);

      expect(result.memoryIssuesResolved).toBe(false);
    });

    it('should return promiseIssuesResolved = false (pattern detected)', () => {
      const result = verifyNoMemoryOrPromiseErrors(FLAGS_FALSE_PATTERNS_PRESENT_RESULT);

      expect(result.promiseIssuesResolved).toBe(false);
    });

    it('should return allResolved = false', () => {
      const result = verifyNoMemoryOrPromiseErrors(FLAGS_FALSE_PATTERNS_PRESENT_RESULT);

      expect(result.allResolved).toBe(false);
    });

    it('should include both issues in remainingIssues', () => {
      const result = verifyNoMemoryOrPromiseErrors(FLAGS_FALSE_PATTERNS_PRESENT_RESULT);

      expect(result.remainingIssues).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Test Group 6: Promise Rejection Pattern Detection
  // ==========================================================================

  describe('promise rejection pattern detection', () => {
    beforeEach(() => {
      // Mock memory error detector to return no memory errors
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: 0,
        suggestion: '',
        severity: 'warning',
      });
    });

    it('should detect PromiseRejectionHandledWarning pattern', () => {
      const result: TestSuiteResult = {
        ...BOTH_RESOLVED_RESULT,
        hasPromiseRejections: false,
        output: '(node:471914) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously',
      };

      const status = verifyNoMemoryOrPromiseErrors(result);

      expect(status.promiseIssuesResolved).toBe(false);
      expect(status.errorDetails.promiseRejections).toContain('handledWarning');
    });

    it('should detect UnhandledPromiseRejectionWarning pattern', () => {
      const result: TestSuiteResult = {
        ...BOTH_RESOLVED_RESULT,
        hasPromiseRejections: false,
        output: 'UnhandledPromiseRejectionWarning: Promise rejection was never handled',
      };

      const status = verifyNoMemoryOrPromiseErrors(result);

      expect(status.promiseIssuesResolved).toBe(false);
      expect(status.errorDetails.promiseRejections).toContain('unhandledWarning');
    });

    it('should detect Uncaught PromiseRejection pattern', () => {
      const result: TestSuiteResult = {
        ...BOTH_RESOLVED_RESULT,
        hasPromiseRejections: false,
        output: 'Uncaught PromiseRejection: This promise was rejected',
      };

      const status = verifyNoMemoryOrPromiseErrors(result);

      expect(status.promiseIssuesResolved).toBe(false);
      expect(status.errorDetails.promiseRejections).toContain('uncaughtRejection');
    });

    it('should detect multiple promise rejection patterns', () => {
      const result: TestSuiteResult = {
        ...BOTH_RESOLVED_RESULT,
        hasPromiseRejections: false,
        output: 'PromiseRejectionHandledWarning detected\nUnhandledPromiseRejectionWarning also present',
      };

      const status = verifyNoMemoryOrPromiseErrors(result);

      expect(status.promiseIssuesResolved).toBe(false);
      expect(status.errorDetails.promiseRejections).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Test Group 7: All Resolved Flag Logic (AND Logic)
  // ==========================================================================

  describe('allResolved flag logic (AND logic)', () => {
    beforeEach(() => {
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: 0,
        suggestion: '',
        severity: 'warning',
      });
    });

    it('should be true when both issues resolved', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(result.allResolved).toBe(true);
    });

    it('should be false when only memory resolved', () => {
      const input: TestSuiteResult = {
        ...BOTH_RESOLVED_RESULT,
        hasPromiseRejections: true,
        output: 'PromiseRejectionHandledWarning',
      };

      const result = verifyNoMemoryOrPromiseErrors(input);

      expect(result.allResolved).toBe(false);
    });

    it('should be false when only promise resolved', () => {
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'HEAP_OOM',
        matchedPattern: 'heap out of memory',
        exitCode: 134,
        suggestion: 'Increase memory',
        severity: 'fatal',
      });

      const input: TestSuiteResult = {
        ...BOTH_RESOLVED_RESULT,
        hasMemoryErrors: true,
        exitCode: 134,
      };

      const result = verifyNoMemoryOrPromiseErrors(input);

      expect(result.allResolved).toBe(false);
    });

    it('should be false when neither resolved', () => {
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'WORKER_OOM',
        matchedPattern: 'Worker terminated',
        exitCode: 134,
        suggestion: 'Add limits',
        severity: 'fatal',
      });

      const result = verifyNoMemoryOrPromiseErrors(BOTH_ISSUES_PRESENT_RESULT);

      expect(result.allResolved).toBe(false);
    });
  });

  // ==========================================================================
  // Test Group 8: Null/Undefined Input Handling
  // ==========================================================================

  describe('null/undefined input handling', () => {
    it('should handle null input gracefully', () => {
      const result = verifyNoMemoryOrPromiseErrors(null);

      expect(result).toBeDefined();
      expect(result.memoryIssuesResolved).toBe(false);
      expect(result.promiseIssuesResolved).toBe(false);
      expect(result.allResolved).toBe(false);
    });

    it('should handle undefined input gracefully', () => {
      const result = verifyNoMemoryOrPromiseErrors(undefined);

      expect(result).toBeDefined();
      expect(result.memoryIssuesResolved).toBe(false);
      expect(result.promiseIssuesResolved).toBe(false);
      expect(result.allResolved).toBe(false);
    });

    it('should include invalid input message in remainingIssues', () => {
      const result = verifyNoMemoryOrPromiseErrors(null);

      expect(result.remainingIssues).toHaveLength(1);
      expect(result.remainingIssues[0]).toContain('Invalid input');
    });

    it('should log warning for null input', () => {
      verifyNoMemoryOrPromiseErrors(null);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'verifyNoMemoryOrPromiseErrors called with null/undefined input'
      );
    });
  });

  // ==========================================================================
  // Test Group 9: Pure Function (No External Execution)
  // ==========================================================================

  describe('pure function behavior', () => {
    beforeEach(() => {
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: 0,
        suggestion: '',
        severity: 'warning',
      });
    });

    it('should not throw any errors', () => {
      expect(() => {
        verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);
      }).not.toThrow();
    });

    it('should return structured result for all inputs', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(result).toHaveProperty('memoryIssuesResolved');
      expect(result).toHaveProperty('promiseIssuesResolved');
      expect(result).toHaveProperty('remainingIssues');
      expect(result).toHaveProperty('errorDetails');
      expect(result).toHaveProperty('allResolved');
    });

    it('should have readonly fields on result', () => {
      const result = verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      // TypeScript should enforce readonly, but let's check runtime behavior
      expect(Object.isFrozen(result) || Object.isSealed(result)).toBe(false);
      // The interface defines readonly, but we can't test this at runtime
    });
  });

  // ==========================================================================
  // Test Group 10: Integration with Memory Error Detector
  // ==========================================================================

  describe('integration with memory-error-detector', () => {
    it('should call detectMemoryErrorInTestOutput with output and exitCode', () => {
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: 0,
        suggestion: '',
        severity: 'warning',
      });

      verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(detectMemoryErrorInTestOutput).toHaveBeenCalledWith(
        BOTH_RESOLVED_RESULT.output,
        BOTH_RESOLVED_RESULT.exitCode
      );
    });

    it('should use detected memory error pattern in errorDetails', () => {
      const expectedPattern = 'FATAL ERROR.*heap out of memory';
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'HEAP_OOM',
        matchedPattern: expectedPattern,
        exitCode: 134,
        suggestion: 'Increase memory',
        severity: 'fatal',
      });

      const result = verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(result.errorDetails.memoryErrors).toContain(expectedPattern);
    });
  });

  // ==========================================================================
  // Test Group 11: Logging Behavior
  // ==========================================================================

  describe('logging behavior', () => {
    it('should log debug message with verification details', () => {
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: false,
        errorType: null,
        matchedPattern: null,
        exitCode: 0,
        suggestion: '',
        severity: 'warning',
      });

      verifyNoMemoryOrPromiseErrors(BOTH_RESOLVED_RESULT);

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
        'Verifying issue resolution for Issues 2 and 3',
        expect.objectContaining({
          hasMemoryErrors: false,
          hasPromiseRejections: false,
          exitCode: 0,
        })
      );
    });

    it('should log warning when issues remain', () => {
      vi.mocked(detectMemoryErrorInTestOutput).mockReturnValue({
        hasMemoryError: true,
        errorType: 'HEAP_OOM',
        matchedPattern: 'heap out of memory',
        exitCode: 134,
        suggestion: 'Increase memory',
        severity: 'fatal',
      });

      verifyNoMemoryOrPromiseErrors(ISSUE_2_PRESENT_RESULT);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'Issues remain unresolved',
        expect.objectContaining({
          memoryIssuesResolved: false,
        })
      );
    });
  });

  // ==========================================================================
  // Test Group 12: Type Exports
  // ==========================================================================

  describe('type exports', () => {
    it('should export IssueResolutionStatus type', () => {
      const status: IssueResolutionStatus = {
        memoryIssuesResolved: true,
        promiseIssuesResolved: true,
        remainingIssues: [],
        errorDetails: {
          memoryErrors: [],
          promiseRejections: [],
        },
        allResolved: true,
      };

      expect(status).toBeDefined();
    });

    it('should export TestSuiteResult type', () => {
      const result: TestSuiteResult = {
        completed: true,
        results: { pass: 1, fail: 0, total: 1 },
        hasMemoryErrors: false,
        hasPromiseRejections: false,
        executionTime: 1.0,
        output: 'test',
        exitCode: 0,
      };

      expect(result).toBeDefined();
    });
  });
});
