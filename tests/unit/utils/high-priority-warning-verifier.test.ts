/**
 * Unit tests for High-Priority Warning Verifier
 *
 * @remarks
 * Tests validate high-priority warning verification functionality including:
 * 1. Total warning count extraction from byRule
 * 2. File-specific warning extraction for priority files
 * 3. High-priority fix status determination (all counts === 0)
 * 4. Priority warnings calculation (sum of strict-boolean in priority files)
 * 5. Null/undefined input handling
 * 6. Missing fullResults handling
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

// Import mocked modules
import { getLogger } from '../../../src/utils/logger.js';
import {
  verifyHighPriorityWarnings,
  type HighPriorityWarningStatus,
  type ESLintResultReport,
} from '../../../src/utils/high-priority-warning-verifier.js';

// =============================================================================
// TEST DATA
// ============================================================================

/**
 * Sample ESLint file result for src/index.ts with no warnings
 */
const createFileResult = (
  filePath: string,
  messages: Array<{ ruleId: string | null; line: number }>
): ESLintResultReport['fullResults'] => {
  return [
    {
      filePath,
      messages: messages.map(m => ({
        ruleId: m.ruleId,
        severity: 1,
        message: `Warning from ${m.ruleId}`,
        line: m.line,
        column: 1,
      })),
      errorCount: 0,
      warningCount: messages.length,
      fatalErrorCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: messages.length,
    },
  ];
};

/**
 * Sample ESLint result with all warnings fixed (best case)
 */
const ALL_FIXED_REPORT: ESLintResultReport = {
  errorCount: 0,
  warningCount: 0,
  byRule: {
    'no-console': 0,
    '@typescript-eslint/strict-boolean-expressions': 0,
  },
  topFiles: [],
  fullResults: [
    ...createFileResult('/path/to/src/index.ts', []),
    ...createFileResult('/path/to/src/agents/prp-runtime.ts', []),
    ...createFileResult('/path/to/src/cli/index.ts', []),
  ],
};

/**
 * Sample ESLint result with no-console warnings in src/index.ts (likely case)
 */
const NO_CONSOLE_WARNINGS_REPORT: ESLintResultReport = {
  errorCount: 0,
  warningCount: 130,
  byRule: {
    'no-console': 130,
    '@typescript-eslint/strict-boolean-expressions': 0,
  },
  topFiles: ['src/index.ts'],
  fullResults: createFileResult('/path/to/src/index.ts', Array.from({ length: 130 }, (_, i) => ({
    ruleId: 'no-console',
    line: i + 1,
  }))),
};

/**
 * Sample ESLint result with strict-boolean warnings in priority files
 */
const STRICT_BOOLEAN_WARNINGS_REPORT: ESLintResultReport = {
  errorCount: 0,
  warningCount: 5,
  byRule: {
    'no-console': 0,
    '@typescript-eslint/strict-boolean-expressions': 5,
  },
  topFiles: ['src/agents/prp-runtime.ts', 'src/cli/index.ts'],
  fullResults: [
    ...createFileResult('/path/to/src/agents/prp-runtime.ts', [
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 313 },
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 320 },
    ]),
    ...createFileResult('/path/to/src/cli/index.ts', [
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 160 },
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 165 },
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 170 },
    ]),
    ...createFileResult('/path/to/src/index.ts', []),
  ],
};

/**
 * Sample ESLint result with both types of warnings
 */
const BOTH_WARNINGS_REPORT: ESLintResultReport = {
  errorCount: 0,
  warningCount: 135,
  byRule: {
    'no-console': 130,
    '@typescript-eslint/strict-boolean-expressions': 5,
  },
  topFiles: ['src/index.ts', 'src/agents/prp-runtime.ts', 'src/cli/index.ts'],
  fullResults: [
    ...createFileResult('/path/to/src/index.ts', Array.from({ length: 130 }, (_, i) => ({
      ruleId: 'no-console',
      line: i + 1,
    }))),
    ...createFileResult('/path/to/src/agents/prp-runtime.ts', [
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 313 },
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 320 },
    ]),
    ...createFileResult('/path/to/src/cli/index.ts', [
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 160 },
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 165 },
      { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 170 },
    ]),
  ],
};

/**
 * Sample ESLint result with missing fullResults
 */
const NO_FULL_RESULTS_REPORT: ESLintResultReport = {
  errorCount: 0,
  warningCount: 105,
  byRule: {
    'no-console': 0,
    '@typescript-eslint/strict-boolean-expressions': 105,
  },
  topFiles: ['src/workflows/prp-pipeline.ts'],
  fullResults: undefined,
};

/**
 * Sample ESLint result with empty byRule (missing keys)
 */
const EMPTY_BYRULE_REPORT: ESLintResultReport = {
  errorCount: 0,
  warningCount: 0,
  byRule: {},
  topFiles: [],
  fullResults: [
    ...createFileResult('/path/to/src/index.ts', []),
    ...createFileResult('/path/to/src/agents/prp-runtime.ts', []),
    ...createFileResult('/path/to/src/cli/index.ts', []),
  ],
};

// =============================================================================
// TEST CASES
// ============================================================================

describe('High-Priority Warning Verifier', () => {
  let mockLoggerInstance: ReturnType<typeof getLogger>;

  beforeEach(() => {
    mockLoggerInstance = getLogger('HighPriorityWarningVerifier');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Test Group 1: All Warnings Fixed (Success Case)
  // ==========================================================================

  describe('when all high-priority warnings are fixed', () => {
    it('should return consoleWarnings = 0', () => {
      const result = verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(result.consoleWarnings).toBe(0);
    });

    it('should return priorityWarnings = 0', () => {
      const result = verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(result.priorityWarnings).toBe(0);
    });

    it('should return highPriorityFixed = true', () => {
      const result = verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(result.highPriorityFixed).toBe(true);
    });

    it('should return all file-specific counts as 0', () => {
      const result = verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(result.details.srcIndexNoConsole).toBe(0);
      expect(result.details.prpRuntimeStrictBoolean).toBe(0);
      expect(result.details.cliIndexStrictBoolean).toBe(0);
    });

    it('should log success message', () => {
      verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'All high-priority warnings fixed',
        expect.objectContaining({
          consoleWarnings: 0,
          priorityWarnings: 0,
        })
      );
    });
  });

  // ==========================================================================
  // Test Group 2: No-Console Warnings Present (Issue 5)
  // ==========================================================================

  describe('when no-console warnings are present in src/index.ts', () => {
    it('should return consoleWarnings = 130', () => {
      const result = verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(result.consoleWarnings).toBe(130);
    });

    it('should return priorityWarnings = 0', () => {
      const result = verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(result.priorityWarnings).toBe(0);
    });

    it('should return highPriorityFixed = false', () => {
      const result = verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(result.highPriorityFixed).toBe(false);
    });

    it('should return srcIndexNoConsole = 130', () => {
      const result = verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(result.details.srcIndexNoConsole).toBe(130);
    });

    it('should return other file counts as 0', () => {
      const result = verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(result.details.prpRuntimeStrictBoolean).toBe(0);
      expect(result.details.cliIndexStrictBoolean).toBe(0);
    });

    it('should log warning message', () => {
      verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'High-priority warnings remain',
        expect.objectContaining({
          consoleWarnings: 130,
          srcIndexNoConsole: 130,
        })
      );
    });
  });

  // ==========================================================================
  // Test Group 3: Strict-Boolean Warnings Present (Issue 4)
  // ==========================================================================

  describe('when strict-boolean warnings are present in priority files', () => {
    it('should return consoleWarnings = 0', () => {
      const result = verifyHighPriorityWarnings(STRICT_BOOLEAN_WARNINGS_REPORT);

      expect(result.consoleWarnings).toBe(0);
    });

    it('should return priorityWarnings = 5', () => {
      const result = verifyHighPriorityWarnings(STRICT_BOOLEAN_WARNINGS_REPORT);

      expect(result.priorityWarnings).toBe(5);
    });

    it('should return highPriorityFixed = false', () => {
      const result = verifyHighPriorityWarnings(STRICT_BOOLEAN_WARNINGS_REPORT);

      expect(result.highPriorityFixed).toBe(false);
    });

    it('should return prpRuntimeStrictBoolean = 2', () => {
      const result = verifyHighPriorityWarnings(STRICT_BOOLEAN_WARNINGS_REPORT);

      expect(result.details.prpRuntimeStrictBoolean).toBe(2);
    });

    it('should return cliIndexStrictBoolean = 3', () => {
      const result = verifyHighPriorityWarnings(STRICT_BOOLEAN_WARNINGS_REPORT);

      expect(result.details.cliIndexStrictBoolean).toBe(3);
    });

    it('should return srcIndexNoConsole = 0', () => {
      const result = verifyHighPriorityWarnings(STRICT_BOOLEAN_WARNINGS_REPORT);

      expect(result.details.srcIndexNoConsole).toBe(0);
    });
  });

  // ==========================================================================
  // Test Group 4: Both Types of Warnings Present
  // ==========================================================================

  describe('when both no-console and strict-boolean warnings are present', () => {
    it('should return consoleWarnings = 130', () => {
      const result = verifyHighPriorityWarnings(BOTH_WARNINGS_REPORT);

      expect(result.consoleWarnings).toBe(130);
    });

    it('should return priorityWarnings = 5', () => {
      const result = verifyHighPriorityWarnings(BOTH_WARNINGS_REPORT);

      expect(result.priorityWarnings).toBe(5);
    });

    it('should return highPriorityFixed = false', () => {
      const result = verifyHighPriorityWarnings(BOTH_WARNINGS_REPORT);

      expect(result.highPriorityFixed).toBe(false);
    });

    it('should return all file-specific counts correctly', () => {
      const result = verifyHighPriorityWarnings(BOTH_WARNINGS_REPORT);

      expect(result.details.srcIndexNoConsole).toBe(130);
      expect(result.details.prpRuntimeStrictBoolean).toBe(2);
      expect(result.details.cliIndexStrictBoolean).toBe(3);
    });
  });

  // ==========================================================================
  // Test Group 5: Missing fullResults
  // ==========================================================================

  describe('when fullResults is not available', () => {
    it('should return consoleWarnings = 0 (from byRule)', () => {
      const result = verifyHighPriorityWarnings(NO_FULL_RESULTS_REPORT);

      expect(result.consoleWarnings).toBe(0);
    });

    it('should return priorityWarnings = 0 (cannot calculate)', () => {
      const result = verifyHighPriorityWarnings(NO_FULL_RESULTS_REPORT);

      expect(result.priorityWarnings).toBe(0);
    });

    it('should return highPriorityFixed = false (conservative)', () => {
      const result = verifyHighPriorityWarnings(NO_FULL_RESULTS_REPORT);

      expect(result.highPriorityFixed).toBe(false);
    });

    it('should return all file-specific counts as 0', () => {
      const result = verifyHighPriorityWarnings(NO_FULL_RESULTS_REPORT);

      expect(result.details.srcIndexNoConsole).toBe(0);
      expect(result.details.prpRuntimeStrictBoolean).toBe(0);
      expect(result.details.cliIndexStrictBoolean).toBe(0);
    });

    it('should log warning about missing fullResults', () => {
      verifyHighPriorityWarnings(NO_FULL_RESULTS_REPORT);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'fullResults not available, cannot perform file-specific analysis'
      );
    });
  });

  // ==========================================================================
  // Test Group 6: Empty byRule (Missing Keys)
  // ==========================================================================

  describe('when byRule is empty (missing keys)', () => {
    it('should return consoleWarnings = 0 (default)', () => {
      const result = verifyHighPriorityWarnings(EMPTY_BYRULE_REPORT);

      expect(result.consoleWarnings).toBe(0);
    });

    it('should return priorityWarnings = 0', () => {
      const result = verifyHighPriorityWarnings(EMPTY_BYRULE_REPORT);

      expect(result.priorityWarnings).toBe(0);
    });

    it('should return highPriorityFixed = true (all zeros)', () => {
      const result = verifyHighPriorityWarnings(EMPTY_BYRULE_REPORT);

      expect(result.highPriorityFixed).toBe(true);
    });
  });

  // ==========================================================================
  // Test Group 7: Priority Warnings Calculation
  // ==========================================================================

  describe('priorityWarnings calculation', () => {
    it('should sum prpRuntime and cli strict-boolean warnings', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: [
          ...createFileResult('/path/to/src/agents/prp-runtime.ts', [
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 100 },
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 200 },
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 300 },
          ]),
          ...createFileResult('/path/to/src/cli/index.ts', [
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 100 },
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 200 },
          ]),
          ...createFileResult('/path/to/src/index.ts', []),
        ],
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.priorityWarnings).toBe(5); // 3 + 2
      expect(result.details.prpRuntimeStrictBoolean).toBe(3);
      expect(result.details.cliIndexStrictBoolean).toBe(2);
    });

    it('should not include src/index.ts strict-boolean warnings in priorityWarnings', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: [
          ...createFileResult('/path/to/src/index.ts', [
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 100 },
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 200 },
          ]),
          ...createFileResult('/path/to/src/agents/prp-runtime.ts', []),
          ...createFileResult('/path/to/src/cli/index.ts', []),
        ],
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.priorityWarnings).toBe(0);
      expect(result.details.prpRuntimeStrictBoolean).toBe(0);
      expect(result.details.cliIndexStrictBoolean).toBe(0);
      // Note: src/index.ts strict-boolean warnings are not tracked in priorityWarnings
    });
  });

  // ==========================================================================
  // Test Group 8: High-Priority Fixed Logic (AND Logic)
  // ==========================================================================

  describe('highPriorityFixed flag logic (AND logic)', () => {
    it('should be true when all file-specific counts are 0', () => {
      const result = verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(result.highPriorityFixed).toBe(true);
    });

    it('should be false when srcIndexNoConsole > 0', () => {
      const result = verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(result.highPriorityFixed).toBe(false);
    });

    it('should be false when prpRuntimeStrictBoolean > 0', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: [
          ...createFileResult('/path/to/src/index.ts', []),
          ...createFileResult('/path/to/src/agents/prp-runtime.ts', [
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 313 },
          ]),
          ...createFileResult('/path/to/src/cli/index.ts', []),
        ],
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.highPriorityFixed).toBe(false);
    });

    it('should be false when cliIndexStrictBoolean > 0', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: [
          ...createFileResult('/path/to/src/index.ts', []),
          ...createFileResult('/path/to/src/agents/prp-runtime.ts', []),
          ...createFileResult('/path/to/src/cli/index.ts', [
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 160 },
          ]),
        ],
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.highPriorityFixed).toBe(false);
    });

    it('should require ALL three conditions to be true for highPriorityFixed = true', () => {
      // All three must be 0
      const report: ESLintResultReport = {
        errorCount: 0,
        warningCount: 2,
        byRule: {
          'no-console': 1,
          '@typescript-eslint/strict-boolean-expressions': 1,
        },
        topFiles: ['src/index.ts', 'src/agents/prp-runtime.ts'],
        fullResults: [
          ...createFileResult('/path/to/src/index.ts', [
            { ruleId: 'no-console', line: 100 },
          ]),
          ...createFileResult('/path/to/src/agents/prp-runtime.ts', [
            { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 313 },
          ]),
          ...createFileResult('/path/to/src/cli/index.ts', []),
        ],
      };

      const result = verifyHighPriorityWarnings(report);

      // srcIndexNoConsole = 1, prpRuntimeStrictBoolean = 1, cliIndexStrictBoolean = 0
      expect(result.highPriorityFixed).toBe(false); // Not all are 0
    });
  });

  // ==========================================================================
  // Test Group 9: File Path Matching (endsWith pattern)
  // ==========================================================================

  describe('file path matching with .endsWith()', () => {
    it('should match files with absolute paths', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: createFileResult('/home/user/projects/hacky-hack/src/index.ts', [
          { ruleId: 'no-console', line: 100 },
        ]),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.details.srcIndexNoConsole).toBe(1);
    });

    it('should match files with relative paths', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: createFileResult('./src/index.ts', [
          { ruleId: 'no-console', line: 100 },
        ]),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.details.srcIndexNoConsole).toBe(1);
    });

    it('should match files with Windows-style paths', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: createFileResult('C:\\projects\\hacky-hack\\src\\index.ts', [
          { ruleId: 'no-console', line: 100 },
        ]),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.details.srcIndexNoConsole).toBe(1);
    });
  });

  // ==========================================================================
  // Test Group 10: Null/Undefined Input Handling
  // ==========================================================================

  describe('null/undefined input handling', () => {
    it('should handle null input gracefully', () => {
      const result = verifyHighPriorityWarnings(null);

      expect(result).toBeDefined();
      expect(result.consoleWarnings).toBe(0);
      expect(result.priorityWarnings).toBe(0);
      expect(result.highPriorityFixed).toBe(false);
    });

    it('should handle undefined input gracefully', () => {
      const result = verifyHighPriorityWarnings(undefined);

      expect(result).toBeDefined();
      expect(result.consoleWarnings).toBe(0);
      expect(result.priorityWarnings).toBe(0);
      expect(result.highPriorityFixed).toBe(false);
    });

    it('should return all file-specific counts as 0 for null input', () => {
      const result = verifyHighPriorityWarnings(null);

      expect(result.details.srcIndexNoConsole).toBe(0);
      expect(result.details.prpRuntimeStrictBoolean).toBe(0);
      expect(result.details.cliIndexStrictBoolean).toBe(0);
    });

    it('should log warning for null input', () => {
      verifyHighPriorityWarnings(null);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'verifyHighPriorityWarnings called with null/undefined input'
      );
    });
  });

  // ==========================================================================
  // Test Group 11: Pure Function (No External Execution)
  // ==========================================================================

  describe('pure function behavior', () => {
    it('should not throw any errors', () => {
      expect(() => {
        verifyHighPriorityWarnings(ALL_FIXED_REPORT);
      }).not.toThrow();
    });

    it('should return structured result for all inputs', () => {
      const result = verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(result).toHaveProperty('consoleWarnings');
      expect(result).toHaveProperty('priorityWarnings');
      expect(result).toHaveProperty('highPriorityFixed');
      expect(result).toHaveProperty('details');
      expect(result.details).toHaveProperty('srcIndexNoConsole');
      expect(result.details).toHaveProperty('prpRuntimeStrictBoolean');
      expect(result.details).toHaveProperty('cliIndexStrictBoolean');
    });

    it('should handle various inputs without external execution', () => {
      const inputs = [
        ALL_FIXED_REPORT,
        NO_CONSOLE_WARNINGS_REPORT,
        STRICT_BOOLEAN_WARNINGS_REPORT,
        BOTH_WARNINGS_REPORT,
        NO_FULL_RESULTS_REPORT,
        EMPTY_BYRULE_REPORT,
        null,
        undefined,
      ];

      for (const input of inputs) {
        expect(() => verifyHighPriorityWarnings(input as any)).not.toThrow();
      }
    });
  });

  // ==========================================================================
  // Test Group 12: Message Filtering by RuleId
  // ==========================================================================

  describe('message filtering by ruleId', () => {
    it('should filter only no-console messages for src/index.ts', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: createFileResult('/path/to/src/index.ts', [
          { ruleId: 'no-console', line: 100 },
          { ruleId: 'no-console', line: 200 },
          { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 300 },
          { ruleId: 'no-unused-vars', line: 400 },
        ]),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.details.srcIndexNoConsole).toBe(2); // Only no-console
    });

    it('should filter only strict-boolean messages for prp-runtime.ts', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: createFileResult('/path/to/src/agents/prp-runtime.ts', [
          { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 313 },
          { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 320 },
          { ruleId: 'no-console', line: 100 },
          { ruleId: 'no-unused-vars', line: 200 },
        ]),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.details.prpRuntimeStrictBoolean).toBe(2); // Only strict-boolean
    });

    it('should handle null ruleId gracefully', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: createFileResult('/path/to/src/index.ts', [
          { ruleId: null, line: 100 },
          { ruleId: 'no-console', line: 200 },
        ]),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.details.srcIndexNoConsole).toBe(1); // Only no-console
    });
  });

  // ==========================================================================
  // Test Group 13: Logging Behavior
  // ==========================================================================

  describe('logging behavior', () => {
    it('should log debug message with file-specific counts', () => {
      verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
        'File-specific warning counts extracted',
        expect.objectContaining({
          srcIndexNoConsole: 130,
          prpRuntimeStrictBoolean: 0,
          cliIndexStrictBoolean: 0,
        })
      );
    });

    it('should log info message when all fixed', () => {
      verifyHighPriorityWarnings(ALL_FIXED_REPORT);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'All high-priority warnings fixed',
        expect.objectContaining({
          consoleWarnings: 0,
          priorityWarnings: 0,
        })
      );
    });

    it('should log warning when warnings remain', () => {
      verifyHighPriorityWarnings(NO_CONSOLE_WARNINGS_REPORT);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        'High-priority warnings remain',
        expect.objectContaining({
          consoleWarnings: 130,
        })
      );
    });
  });

  // ==========================================================================
  // Test Group 14: Type Exports
  // ==========================================================================

  describe('type exports', () => {
    it('should export HighPriorityWarningStatus type', () => {
      const status: HighPriorityWarningStatus = {
        consoleWarnings: 0,
        priorityWarnings: 0,
        highPriorityFixed: true,
        details: {
          srcIndexNoConsole: 0,
          prpRuntimeStrictBoolean: 0,
          cliIndexStrictBoolean: 0,
        },
      };

      expect(status).toBeDefined();
    });

    it('should export ESLintResultReport type', () => {
      const report: ESLintResultReport = {
        errorCount: 0,
        warningCount: 0,
        byRule: {},
        topFiles: [],
      };

      expect(report).toBeDefined();
    });
  });

  // ==========================================================================
  // Test Group 15: Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty fullResults array', () => {
      const report: ESLintResultReport = {
        ...ALL_FIXED_REPORT,
        fullResults: [],
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.details.srcIndexNoConsole).toBe(0);
      expect(result.details.prpRuntimeStrictBoolean).toBe(0);
      expect(result.details.cliIndexStrictBoolean).toBe(0);
      expect(result.highPriorityFixed).toBe(true);
    });

    it('should handle byRule with only no-console key', () => {
      const report: ESLintResultReport = {
        errorCount: 0,
        warningCount: 50,
        byRule: {
          'no-console': 50,
        },
        topFiles: ['src/index.ts'],
        fullResults: createFileResult('/path/to/src/index.ts', Array.from({ length: 50 }, () => ({
          ruleId: 'no-console',
          line: 100,
        }))),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.consoleWarnings).toBe(50);
      expect(result.priorityWarnings).toBe(0);
    });

    it('should handle byRule with only strict-boolean key', () => {
      const report: ESLintResultReport = {
        errorCount: 0,
        warningCount: 3,
        byRule: {
          '@typescript-eslint/strict-boolean-expressions': 3,
        },
        topFiles: ['src/agents/prp-runtime.ts'],
        fullResults: createFileResult('/path/to/src/agents/prp-runtime.ts', [
          { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 313 },
          { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 320 },
          { ruleId: '@typescript-eslint/strict-boolean-expressions', line: 330 },
        ]),
      };

      const result = verifyHighPriorityWarnings(report);

      expect(result.consoleWarnings).toBe(0);
      expect(result.priorityWarnings).toBe(3);
    });
  });
});
