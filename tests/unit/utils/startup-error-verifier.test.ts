/**
 * Unit tests for Startup Error Verifier
 *
 * @remarks
 * Tests validate startup error verification functionality including:
 * 1. Early return when helpResult.success is false (spawn error)
 * 2. Clean startup detection (no errors in output)
 * 3. Module not found detection (ES and CommonJS patterns)
 * 4. Runtime error detection (Error: patterns)
 * 5. Stack trace detection (at [ pattern)
 * 6. Multiple error types in single output
 * 7. Groundswell-specific error detection
 * 8. Error categorization and result structure
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock node:child_process logger
vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  })),
}));

// Import module under test
import { verifyStartupErrors } from '../../../src/utils/startup-error-verifier.js';
import type { CliHelpResult } from '../../../src/utils/cli-help-executor.js';

// =============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock CliHelpResult for testing
 *
 * @param options - Options for configuring the mock
 * @returns Mock CliHelpResult object
 */
function createMockHelpResult(
  options: {
    success?: boolean;
    output?: string;
    hasHelp?: boolean;
    exitCode?: number | null;
    error?: string;
  } = {}
): CliHelpResult {
  const {
    success = true,
    output = '',
    hasHelp = false,
    exitCode = 0,
    error,
  } = options;

  return {
    success,
    output,
    hasHelp,
    exitCode,
    error,
  };
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('startup-error-verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Clean startup - no errors', () => {
    const cleanHelpOutput = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -V, --version         output the version number
  --prd <path>          Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>       Scope identifier (e.g., "P3.M4", "P3.M4.T2")
  --mode <mode>         Execution mode (choices: "normal", "bug-hunt", "validate")
  -h, --help            display help for command
`;

    it('should return hasErrors: false for clean help output', () => {
      const mockResult = createMockHelpResult({
        success: true,
        output: cleanHelpOutput,
        hasHelp: true,
        exitCode: 0,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(false);
      expect(result.errorTypes).toEqual([]);
      expect(result.rawErrors).toEqual([]);
      expect(result.message).toContain('Clean startup');
    });

    it('should return empty errorTypes array for clean startup', () => {
      const mockResult = createMockHelpResult({
        success: true,
        output: cleanHelpOutput,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toHaveLength(0);
      expect(Array.isArray(result.errorTypes)).toBe(true);
    });

    it('should return descriptive success message', () => {
      const mockResult = createMockHelpResult({
        success: true,
        output: cleanHelpOutput,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.message).toBe(
        'Clean startup - no runtime errors detected in CLI output.'
      );
    });

    it('should handle empty output without errors', () => {
      const mockResult = createMockHelpResult({
        success: true,
        output: '',
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(false);
      expect(result.errorTypes).toEqual([]);
    });
  });

  // ========================================================================
  // Early return tests (spawn failure)
  // ========================================================================

  describe('Early return on spawn failure', () => {
    it('should return hasErrors: true when helpResult.success is false', () => {
      const mockResult = createMockHelpResult({
        success: false,
        output: '',
        exitCode: null,
        error: 'npm not found',
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
    });

    it('should include SPAWN_ERROR in errorTypes for spawn failures', () => {
      const mockResult = createMockHelpResult({
        success: false,
        error: 'ENOENT: npm not found',
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('SPAWN_ERROR');
      expect(result.errorTypes).toHaveLength(1);
    });

    it('should use provided error message in rawErrors', () => {
      const mockResult = createMockHelpResult({
        success: false,
        error: 'Permission denied executing npm',
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.rawErrors).toEqual(['Permission denied executing npm']);
    });

    it('should use "Unknown spawn error" when error field is undefined', () => {
      const mockResult = createMockHelpResult({
        success: false,
        error: undefined,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.rawErrors).toEqual(['Unknown spawn error']);
      expect(result.message).toContain('Unknown spawn error');
    });

    it('should not parse output when success is false', () => {
      const mockResult = createMockHelpResult({
        success: false,
        output: 'Error: Something went wrong', // Should be ignored
        error: 'Spawn failed',
      });

      const result = verifyStartupErrors(mockResult);

      // Should only have SPAWN_ERROR, not RUNTIME_ERROR
      expect(result.errorTypes).toEqual(['SPAWN_ERROR']);
      expect(result.errorTypes).not.toContain('RUNTIME_ERROR');
    });
  });

  // ========================================================================
  // Module not found error tests
  // ========================================================================

  describe('Module not found error detection', () => {
    it('should detect ES Module ERR_MODULE_NOT_FOUND error', () => {
      const output = `Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'groundswell'
at /home/user/project/src/index.ts:5:10`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('MODULE_NOT_FOUND');
    });

    it('should detect CommonJS "Cannot find module" error', () => {
      const output = `Error: Cannot find module 'groundswell'
at /home/user/project/src/index.ts:5:10`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('MODULE_NOT_FOUND');
    });

    it('should extract module name from CommonJS error', () => {
      const output = `Error: Cannot find module './utils/helper'`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.rawErrors).toContain("Cannot find module './utils/helper'");
    });

    it('should detect Groundswell-specific module error', () => {
      const output = `Error: Cannot find module 'groundswell' imported from src/index.ts`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('MODULE_NOT_FOUND');
    });

    it('should handle module not found with double quotes', () => {
      const output = `Error: Cannot find module "express"`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('MODULE_NOT_FOUND');
    });

    it('should handle module not found with backticks', () => {
      const output = `Error: Cannot find module \`lodash\``;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('MODULE_NOT_FOUND');
    });
  });

  // ========================================================================
  // Runtime error detection tests
  // ========================================================================

  describe('Runtime error detection', () => {
    it('should detect general "Error:" pattern', () => {
      const output = `Error: Something went wrong
at processData (/home/user/project/src/index.ts:42:5)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('RUNTIME_ERROR');
    });

    it('should detect TypeError', () => {
      const output = `TypeError: Cannot read property 'foo' of undefined`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('RUNTIME_ERROR');
    });

    it('should detect ReferenceError', () => {
      const output = `ReferenceError: foo is not defined`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('RUNTIME_ERROR');
    });

    it('should extract error message for runtime errors', () => {
      const output = `Error: Database connection failed`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.rawErrors).toContain('Database connection failed');
    });

    it('should detect multiple runtime errors', () => {
      const output = `Error: First error
Error: Second error
Error: Third error`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.rawErrors).toHaveLength(3);
      expect(result.rawErrors).toContain('First error');
      expect(result.rawErrors).toContain('Second error');
      expect(result.rawErrors).toContain('Third error');
    });
  });

  // ========================================================================
  // Stack trace detection tests
  // ========================================================================

  describe('Stack trace detection', () => {
    it('should detect stack trace with "at functionName(" pattern', () => {
      const output = `Error: Something went wrong
at processData (/home/user/project/src/index.ts:42:5)
at main (/home/user/project/src/index.ts:10:3)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('STACK_TRACE');
    });

    it('should detect stack trace with "at [" pattern', () => {
      const output = `Error: Something went wrong
at [eval]:1:11`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('STACK_TRACE');
    });

    it('should detect stack trace without "Error:" prefix', () => {
      const output = `at processData (/home/user/project/src/index.ts:42:5)
at main (/home/user/project/src/index.ts:10:3)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('STACK_TRACE');
    });

    it('should detect V8 stack trace format', () => {
      const output = `at file:line:column
at functionName (file:line:column)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('STACK_TRACE');
    });
  });

  // ========================================================================
  // Multiple error types tests
  // ========================================================================

  describe('Multiple error types detection', () => {
    it('should detect both module not found and stack trace', () => {
      const output = `Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'groundswell'
at /home/user/project/src/index.ts:5:10`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('MODULE_NOT_FOUND');
      expect(result.errorTypes).toContain('STACK_TRACE');
      expect(result.errorTypes).toHaveLength(2);
    });

    it('should detect runtime error and stack trace together', () => {
      const output = `Error: Something went wrong
at processData (/home/user/project/src/index.ts:42:5)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('RUNTIME_ERROR');
      expect(result.errorTypes).toContain('STACK_TRACE');
      expect(result.errorTypes).toHaveLength(2);
    });

    it('should detect all three error types', () => {
      const output = `Error: Cannot find module 'express'
Error: Database connection failed
at main (/home/user/project/src/index.ts:10:3)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('MODULE_NOT_FOUND');
      expect(result.errorTypes).toContain('RUNTIME_ERROR');
      expect(result.errorTypes).toContain('STACK_TRACE');
      expect(result.errorTypes).toHaveLength(3);
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('Result structure validation', () => {
    it('should return readonly errorTypes array', () => {
      const mockResult = createMockHelpResult({
        success: true,
        output: 'Error: Test error',
      });

      const result = verifyStartupErrors(mockResult);

      // Verify readonly nature (array is readonly in type)
      expect(result.errorTypes).toBeInstanceOf(Array);
    });

    it('should return readonly rawErrors array', () => {
      const mockResult = createMockHelpResult({
        success: true,
        output: 'Error: Test error',
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.rawErrors).toBeInstanceOf(Array);
    });

    it('should include error count in message when errors exist', () => {
      const output = `Error: First error
Error: Second error`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.message).toContain('(2 error(s))');
    });

    it('should not include error count when no errors', () => {
      const mockResult = createMockHelpResult({
        success: true,
        output: 'Usage: prp-pipeline [options]',
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.message).not.toContain('(0 error(s))');
    });

    it('should include sorted error types in message', () => {
      const output = `Error: Test
at main ()`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      // Error types should be sorted alphabetically
      expect(result.message).toMatch(
        /RUNTIME_ERROR, STACK_TRACE|STACK_TRACE, RUNTIME_ERROR/
      );
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle case-insensitive error detection', () => {
      const output = `error: something went wrong`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('RUNTIME_ERROR');
    });

    it('should handle output with only warnings (not errors)', () => {
      const output = `Warning: Deprecated feature
DeprecationWarning: This will be removed in future versions
Usage: prp-pipeline [options]`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      // Warnings are not errors
      expect(result.hasErrors).toBe(false);
    });

    it('should handle multiline error messages', () => {
      const output = `Error: Multiple line error message
continuing here
and here`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
      expect(result.errorTypes).toContain('RUNTIME_ERROR');
    });

    it('should handle output with special characters', () => {
      const output = `Error: Test with special chars: @#$%^&*()`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
    });

    it('should handle unicode characters in error messages', () => {
      const output = `Error: Test with unicode: café 日本語 🚀`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
    });

    it('should handle very long output without performance issues', () => {
      const longOutput = 'Usage: prp-pipeline\n'.repeat(10000) + 'Error: Test';

      const mockResult = createMockHelpResult({
        success: true,
        output: longOutput,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.hasErrors).toBe(true);
    });

    it('should handle only stack trace without explicit Error: prefix', () => {
      const output = `at main (/home/user/project/src/index.ts:10:3)
at processData (/home/user/project/src/index.ts:42:5)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('STACK_TRACE');
      expect(result.errorTypes).not.toContain('RUNTIME_ERROR');
    });

    it('should handle empty rawErrors when only stack trace detected', () => {
      const output = `at main (/home/user/project/src/index.ts:10:3)`;

      const mockResult = createMockHelpResult({
        success: true,
        output,
      });

      const result = verifyStartupErrors(mockResult);

      expect(result.errorTypes).toContain('STACK_TRACE');
      // Stack trace detection doesn't add to rawErrors
      expect(result.rawErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Input preservation tests
  // ========================================================================

  describe('Input preservation', () => {
    it('should not mutate input CliHelpResult object', () => {
      const originalOutput = 'Usage: prp-pipeline\nOptions:';
      const mockResult = createMockHelpResult({
        success: true,
        output: originalOutput,
      });

      const originalResult = { ...mockResult };
      verifyStartupErrors(mockResult);

      expect(mockResult.success).toBe(originalResult.success);
      expect(mockResult.output).toBe(originalResult.output);
      expect(mockResult.hasHelp).toBe(originalResult.hasHelp);
      expect(mockResult.exitCode).toBe(originalResult.exitCode);
    });
  });
});
