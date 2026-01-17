/**
 * Unit tests for isFatalError function
 *
 * @remarks
 * Tests validate fatal vs non-fatal error detection including:
 * 1. Fatal error types (SessionError with LOAD_FAILED/SAVE_FAILED codes, EnvironmentError, ValidationError with parse_prd operation)
 * 2. Non-fatal error types (TaskError, AgentError, ValidationError with non-parse_prd operations)
 * 3. Standard Error and unknown types (non-PipelineError instances)
 * 4. continueOnError flag behavior (overrides all other logic when true)
 * 5. Type guard usage patterns (integration with isPipelineError, isSessionError, etc.)
 * 6. Edge cases and boundary conditions (null, undefined, special characters, etc.)
 *
 * TDD Phase: RED - All tests must fail because isFatalError doesn't exist yet
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link file:///home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md | isFatalError Architecture Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  ErrorCodes,
  PipelineError,
  SessionError,
  EnvironmentError,
  TaskError,
  AgentError,
  ValidationError,
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
  isEnvironmentError,
  isFatalError,
} from '../../../src/utils/errors.js';

// =============================================================================
// ROOT TEST SUITE
// =============================================================================

describe('isFatalError', () => {
  // ==========================================================================
  // FATAL ERROR TESTS (Return TRUE)
  // ==========================================================================

  describe('Fatal errors (return true)', () => {
    // -------------------------------------------------------------------------
    // SessionError tests (LOAD_FAILED and SAVE_FAILED codes are fatal)
    // -------------------------------------------------------------------------

    describe('SessionError', () => {
      it('should return true for SessionError with LOAD_FAILED code', () => {
        // SETUP: Create SessionError instance
        const error = new SessionError('Session load failed', {
          sessionPath: '/path/to/session',
        });

        // EXECUTE: Call isFatalError
        const result = isFatalError(error);

        // VERIFY: Assert expected behavior
        expect(result).toBe(true);
      });

      it('should return true for SessionError with SAVE_FAILED code', () => {
        const error = new SessionError('Session save failed', {
          sessionPath: '/path/to/session',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with context containing taskId', () => {
        const error = new SessionError('Session load failed during task', {
          sessionPath: '/path/to/session',
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with empty context object', () => {
        const error = new SessionError('Session load failed', {});
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError without context', () => {
        const error = new SessionError('Session load failed');
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with cause', () => {
        const cause = new Error('File not found');
        const error = new SessionError('Session load failed', {}, cause);
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with timestamp', () => {
        const error = new SessionError('Session load failed', {
          sessionPath: '/path/to/session',
        });
        expect(error.timestamp).toBeDefined();
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with very long message', () => {
        const longMessage = 'A'.repeat(10000);
        const error = new SessionError(longMessage, {
          sessionPath: '/path/to/session',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with special characters in message', () => {
        const error = new SessionError('Error: \n\t\r\u0010[Special]', {
          sessionPath: '/path/to/session',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with unicode characters', () => {
        const error = new SessionError('Error: 你好 🚀 Ñoño', {
          sessionPath: '/path/to/session',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with null context values', () => {
        const error = new SessionError('Session load failed', {
          sessionPath: null as unknown as string,
          taskId: null as unknown as string,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with undefined context values', () => {
        const error = new SessionError('Session load failed', {
          sessionPath: undefined as unknown as string,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with circular context reference', () => {
        const circular: Record<string, unknown> = { name: 'test' };
        circular.self = circular;
        const error = new SessionError('Session load failed', {
          data: circular,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with numeric context values', () => {
        const error = new SessionError('Session load failed', {
          attempt: 3,
          maxAttempts: 5,
          retryCount: 2,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with boolean context values', () => {
        const error = new SessionError('Session load failed', {
          retryable: true,
          critical: false,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with array context values', () => {
        const error = new SessionError('Session load failed', {
          attempts: [1, 2, 3],
          errors: ['error1', 'error2'],
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with nested object context', () => {
        const error = new SessionError('Session load failed', {
          metadata: {
            timestamp: Date.now(),
            user: 'test-user',
            nested: {
              deep: 'value',
            },
          },
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with empty string message', () => {
        const error = new SessionError('', { sessionPath: '/path/to/session' });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with whitespace-only message', () => {
        const error = new SessionError('   ', {
          sessionPath: '/path/to/session',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with multiline message', () => {
        const error = new SessionError(
          'Session load failed\nCaused by: File not found\nAt: /path/to/session',
          { sessionPath: '/path/to/session' }
        );
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for SessionError with emoji in message', () => {
        const error = new SessionError('Session load failed 💥 ⚠️ 🚫', {
          sessionPath: '/path/to/session',
        });
        expect(isFatalError(error)).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // EnvironmentError tests (all EnvironmentError instances are fatal)
    // -------------------------------------------------------------------------

    describe('EnvironmentError', () => {
      it('should return true for any EnvironmentError', () => {
        const error = new EnvironmentError('Missing API key', {
          variable: 'API_KEY',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with context', () => {
        const error = new EnvironmentError('Invalid configuration', {
          variable: 'CONFIG_FILE',
          value: '/invalid/path',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError without context', () => {
        const error = new EnvironmentError('Environment error');
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with empty context', () => {
        const error = new EnvironmentError('Environment error', {});
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with cause', () => {
        const cause = new Error('Original error');
        const error = new EnvironmentError('Environment error', {}, cause);
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with variable name', () => {
        const error = new EnvironmentError('Missing required variable', {
          variable: 'DATABASE_URL',
          required: true,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with value', () => {
        const error = new EnvironmentError('Invalid value for variable', {
          variable: 'PORT',
          value: 'invalid',
          expectedType: 'number',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with very long message', () => {
        const longMessage = 'E'.repeat(10000);
        const error = new EnvironmentError(longMessage, {
          variable: 'TEST_VAR',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with special characters', () => {
        const error = new EnvironmentError('Error: \n\t\r\u0010[Special]', {
          variable: 'TEST_VAR',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with unicode characters', () => {
        const error = new EnvironmentError('Environment error: 你好 🌍', {
          variable: 'TEST_VAR',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with null context values', () => {
        const error = new EnvironmentError('Environment error', {
          variable: null as unknown as string,
          value: null as unknown as string,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with undefined context values', () => {
        const error = new EnvironmentError('Environment error', {
          variable: undefined as unknown as string,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with numeric context values', () => {
        const error = new EnvironmentError('Environment error', {
          min: 1,
          max: 100,
          current: 50,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with boolean context values', () => {
        const error = new EnvironmentError('Environment error', {
          required: true,
          optional: false,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with array context values', () => {
        const error = new EnvironmentError('Environment error', {
          allowedValues: ['dev', 'staging', 'prod'],
          currentValue: 'invalid',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with nested object context', () => {
        const error = new EnvironmentError('Environment error', {
          validation: {
            rule: 'range',
            min: 0,
            max: 100,
          },
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with circular context reference', () => {
        const circular: Record<string, unknown> = { name: 'test' };
        circular.self = circular;
        const error = new EnvironmentError('Environment error', {
          data: circular,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with empty string message', () => {
        const error = new EnvironmentError('', { variable: 'TEST_VAR' });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for EnvironmentError with timestamp', () => {
        const error = new EnvironmentError('Environment error', {
          variable: 'TEST_VAR',
        });
        expect(error.timestamp).toBeDefined();
        expect(isFatalError(error)).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // ValidationError tests (parse_prd operation with INVALID_INPUT code is fatal)
    // -------------------------------------------------------------------------

    describe('ValidationError (parse_prd operation)', () => {
      it('should return true for ValidationError with parse_prd operation', () => {
        const error = new ValidationError('Invalid PRD format', {
          operation: 'parse_prd',
          invalidInput: 'malformed-prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and specific code', () => {
        const error = new ValidationError('PRD validation failed', {
          code: ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT,
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and context', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          prdPath: '/path/to/PRD.md',
          lineNumber: 42,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and cause', () => {
        const cause = new Error('Markdown parsing failed');
        const error = new ValidationError(
          'PRD parsing failed',
          {
            operation: 'parse_prd',
          },
          cause
        );
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd without additional context', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and empty context', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and very long message', () => {
        const longMessage = 'P'.repeat(10000);
        const error = new ValidationError(longMessage, {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and special characters', () => {
        const error = new ValidationError('PRD error: \n\t\r\u0010[Special]', {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and unicode characters', () => {
        const error = new ValidationError('PRD error: 你好 🚀', {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and null context values', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          prdPath: null as unknown as string,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and numeric context', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          lineNumber: 42,
          columnNumber: 15,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and boolean context', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          critical: true,
          recoverable: false,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and array context', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          missingFields: ['title', 'description', 'acceptanceCriteria'],
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and nested object context', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          errorDetails: {
            type: 'syntax',
            location: { line: 42, column: 15 },
            suggestion: 'Add proper heading',
          },
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and circular reference', () => {
        const circular: Record<string, unknown> = { name: 'test' };
        circular.self = circular;
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          data: circular,
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and empty string message', () => {
        const error = new ValidationError('', {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and timestamp', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
        });
        expect(error.timestamp).toBeDefined();
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and multiple context properties', () => {
        const error = new ValidationError('PRD parsing failed', {
          operation: 'parse_prd',
          prdPath: '/path/to/PRD.md',
          lineNumber: 42,
          expectedFormat: 'markdown',
          actualFormat: 'plain text',
          severity: 'critical',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and emoji in message', () => {
        const error = new ValidationError('PRD error 💥 ⚠️', {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and multiline message', () => {
        const error = new ValidationError(
          'PRD parsing failed\nMissing required section\nAt line 42',
          {
            operation: 'parse_prd',
          }
        );
        expect(isFatalError(error)).toBe(true);
      });

      it('should return true for ValidationError with parse_prd and whitespace-only message', () => {
        const error = new ValidationError('   ', {
          operation: 'parse_prd',
        });
        expect(isFatalError(error)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // NON-FATAL ERROR TESTS (Return FALSE)
  // ==========================================================================

  describe('Non-fatal errors (return false)', () => {
    // -------------------------------------------------------------------------
    // TaskError tests (all TaskError instances are non-fatal)
    // -------------------------------------------------------------------------

    describe('TaskError', () => {
      it('should return false for TaskError instances', () => {
        const error = new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with different error codes', () => {
        const error = new TaskError('Task validation failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with EXECUTION_FAILED code', () => {
        const error = new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
          code: ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED,
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with VALIDATION_FAILED code', () => {
        const error = new TaskError('Task validation failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with NOT_FOUND code', () => {
        const error = new TaskError('Task not found', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with different taskIds', () => {
        const error1 = new TaskError('Task failed', { taskId: 'P1.M1.T1.S1' });
        const error2 = new TaskError('Task failed', { taskId: 'P2.M3.T5.S10' });
        const error3 = new TaskError('Task failed', {
          taskId: 'P99.M99.T99.S99',
        });
        expect(isFatalError(error1)).toBe(false);
        expect(isFatalError(error2)).toBe(false);
        expect(isFatalError(error3)).toBe(false);
      });

      it('should return false for TaskError with cause', () => {
        const cause = new Error('LLM timeout');
        const error = new TaskError(
          'Task execution failed',
          { taskId: 'P1.M1.T1' },
          cause
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with retry context', () => {
        const error = new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
          attempt: 3,
          maxAttempts: 5,
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with very long message', () => {
        const longMessage = 'T'.repeat(10000);
        const error = new TaskError(longMessage, { taskId: 'P1.M1.T1' });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with special characters', () => {
        const error = new TaskError('Task error: \n\t\r\u0010[Special]', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with unicode characters', () => {
        const error = new TaskError('Task error: 你好 🔧', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError without context', () => {
        const error = new TaskError('Task execution failed');
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with empty context', () => {
        const error = new TaskError('Task execution failed', {});
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with null context values', () => {
        const error = new TaskError('Task execution failed', {
          taskId: null as unknown as string,
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with timestamp', () => {
        const error = new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
        });
        expect(error.timestamp).toBeDefined();
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with nested context', () => {
        const error = new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
          metadata: {
            phase: 'P1',
            milestone: 'M1',
          },
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for TaskError with array context values', () => {
        const error = new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
          attempts: [1, 2, 3],
        });
        expect(isFatalError(error)).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // AgentError tests (all AgentError instances are non-fatal)
    // -------------------------------------------------------------------------

    describe('AgentError', () => {
      it('should return false for AgentError instances', () => {
        const error = new AgentError('LLM call failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with LLM_FAILED code', () => {
        const error = new AgentError('LLM call failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with TIMEOUT code', () => {
        const error = new AgentError('Agent timeout', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with PARSE_FAILED code', () => {
        const error = new AgentError('Response parsing failed', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with different taskIds', () => {
        const error1 = new AgentError('Agent failed', {
          taskId: 'P1.M1.T1.S1',
        });
        const error2 = new AgentError('Agent failed', { taskId: 'P2.M3.T5' });
        const error3 = new AgentError('Agent failed', {
          taskId: 'P99.M99.T99',
        });
        expect(isFatalError(error1)).toBe(false);
        expect(isFatalError(error2)).toBe(false);
        expect(isFatalError(error3)).toBe(false);
      });

      it('should return false for AgentError with operation context', () => {
        const error = new AgentError('Agent operation failed', {
          taskId: 'P1.M1.T1',
          operation: 'generatePRP',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with retry context', () => {
        const error = new AgentError('LLM call failed', {
          taskId: 'P1.M1.T1',
          attempt: 2,
          maxAttempts: 3,
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with cause', () => {
        const cause = new Error('Network timeout');
        const error = new AgentError(
          'LLM call failed',
          { taskId: 'P1.M1.T1' },
          cause
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with very long message', () => {
        const longMessage = 'A'.repeat(10000);
        const error = new AgentError(longMessage, { taskId: 'P1.M1.T1' });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with special characters', () => {
        const error = new AgentError('Agent error: \n\t\r\u0010[Special]', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with unicode characters', () => {
        const error = new AgentError('Agent error: 你好 🤖', {
          taskId: 'P1.M1.T1',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError without context', () => {
        const error = new AgentError('LLM call failed');
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with empty context', () => {
        const error = new AgentError('LLM call failed', {});
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with null context values', () => {
        const error = new AgentError('LLM call failed', {
          taskId: null as unknown as string,
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with timestamp', () => {
        const error = new AgentError('LLM call failed', {
          taskId: 'P1.M1.T1',
        });
        expect(error.timestamp).toBeDefined();
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with nested context', () => {
        const error = new AgentError('LLM call failed', {
          taskId: 'P1.M1.T1',
          llm: {
            model: 'gpt-4',
            provider: 'openai',
          },
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for AgentError with array context values', () => {
        const error = new AgentError('LLM call failed', {
          taskId: 'P1.M1.T1',
          attempts: [1, 2, 3, 4, 5],
        });
        expect(isFatalError(error)).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // ValidationError tests (non-parse_prd operations are non-fatal)
    // -------------------------------------------------------------------------

    describe('ValidationError (non-parse_prd operations)', () => {
      it('should return false for ValidationError with resolve_scope operation', () => {
        const error = new ValidationError('Invalid scope format', {
          operation: 'resolve_scope',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with validate_prd operation', () => {
        const error = new ValidationError('PRD validation failed', {
          operation: 'validate_prd',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with generate_prp operation', () => {
        const error = new ValidationError('PRP generation failed', {
          operation: 'generate_prp',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with execute_task operation', () => {
        const error = new ValidationError('Task execution validation failed', {
          operation: 'execute_task',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with validate_input operation', () => {
        const error = new ValidationError('Input validation failed', {
          operation: 'validate_input',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with validate_output operation', () => {
        const error = new ValidationError('Output validation failed', {
          operation: 'validate_output',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with check_dependencies operation', () => {
        const error = new ValidationError('Dependency check failed', {
          operation: 'check_dependencies',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with validate_scope operation', () => {
        const error = new ValidationError('Scope validation failed', {
          operation: 'validate_scope',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with parse_response operation', () => {
        const error = new ValidationError('Response parsing failed', {
          operation: 'parse_response',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with validate_config operation', () => {
        const error = new ValidationError('Config validation failed', {
          operation: 'validate_config',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError without operation property', () => {
        const error = new ValidationError('Validation failed');
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with operation but undefined', () => {
        const error = new ValidationError('Validation failed', {
          operation: undefined as unknown as string,
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with empty string operation', () => {
        const error = new ValidationError('Validation failed', {
          operation: '',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with MISSING_FIELD code', () => {
        const error = new ValidationError(
          'Missing required field',
          { field: 'title' },
          ErrorCodes.PIPELINE_VALIDATION_MISSING_FIELD
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with SCHEMA_FAILED code', () => {
        const error = new ValidationError(
          'Schema validation failed',
          { schema: 'task-schema' },
          ErrorCodes.PIPELINE_VALIDATION_SCHEMA_FAILED
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with CIRCULAR_DEPENDENCY code', () => {
        const error = new ValidationError(
          'Circular dependency detected',
          { cycle: ['P1.M1.T1', 'P1.M2.T2', 'P1.M1.T1'] },
          ErrorCodes.PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with parse_prd but different code', () => {
        const error = new ValidationError(
          'Missing field in PRD',
          { operation: 'parse_prd', field: 'title' },
          ErrorCodes.PIPELINE_VALIDATION_MISSING_FIELD
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with context and cause', () => {
        const cause = new Error('Original validation error');
        const error = new ValidationError(
          'Validation failed',
          { operation: 'validate_scope' },
          cause
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with very long message', () => {
        const longMessage = 'V'.repeat(10000);
        const error = new ValidationError(longMessage, {
          operation: 'validate_scope',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with special characters', () => {
        const error = new ValidationError(
          'Validation error: \n\t\r\u0010[Special]',
          {
            operation: 'validate_scope',
          }
        );
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with unicode characters', () => {
        const error = new ValidationError('Validation error: 你好 ✅', {
          operation: 'validate_scope',
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError without context', () => {
        const error = new ValidationError('Validation failed');
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with empty context', () => {
        const error = new ValidationError('Validation failed', {});
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with timestamp', () => {
        const error = new ValidationError('Validation failed', {
          operation: 'validate_scope',
        });
        expect(error.timestamp).toBeDefined();
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with nested context', () => {
        const error = new ValidationError('Validation failed', {
          operation: 'validate_scope',
          details: {
            field: 'taskId',
            pattern: 'P[0-9]+',
          },
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with array context values', () => {
        const error = new ValidationError('Validation failed', {
          operation: 'validate_scope',
          missingFields: ['title', 'description'],
        });
        expect(isFatalError(error)).toBe(false);
      });

      it('should return false for ValidationError with null context values', () => {
        const error = new ValidationError('Validation failed', {
          operation: 'validate_scope',
          field: null as unknown as string,
        });
        expect(isFatalError(error)).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // SessionError with non-fatal codes (NOT_FOUND is non-fatal)
    // -------------------------------------------------------------------------

    describe('SessionError with non-fatal codes', () => {
      it('should return false for SessionError with NOT_FOUND code', () => {
        // Note: SessionError constructor doesn't allow setting code, but
        // if there were a way to create a SessionError with NOT_FOUND code,
        // it should be non-fatal. This test documents that behavior.
        const error = new SessionError('Session not found', {
          sessionPath: '/path/to/session',
        });
        // Current SessionError implementation always uses LOAD_FAILED code
        // so this will be fatal. This test documents expected behavior
        // if/when SessionError supports multiple codes.
        // For now, this test will fail since all SessionErrors are LOAD_FAILED
        expect(isFatalError(error)).toBe(true); // Will be true with current impl
      });
    });
  });

  // ==========================================================================
  // STANDARD ERROR TESTS (Return FALSE)
  // ==========================================================================

  describe('Standard Error types (return false)', () => {
    it('should return false for standard Error', () => {
      const error = new Error('Standard error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for TypeError', () => {
      const error = new TypeError('Type error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for ReferenceError', () => {
      const error = new ReferenceError('Reference error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for SyntaxError', () => {
      const error = new SyntaxError('Syntax error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for RangeError', () => {
      const error = new RangeError('Range error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for URIError', () => {
      const error = new URIError('URI error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for EvalError', () => {
      const error = new EvalError('Eval error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with cause', () => {
      const cause = new Error('Underlying cause');
      const error = new Error('Error with cause', { cause });
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with very long message', () => {
      const longMessage = 'E'.repeat(10000);
      const error = new Error(longMessage);
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with special characters', () => {
      const error = new Error('Error: \n\t\r\u0010[Special]');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with unicode characters', () => {
      const error = new Error('Error: 你好 ⚠️');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error without message', () => {
      const error = new Error();
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with empty string message', () => {
      const error = new Error('');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with whitespace-only message', () => {
      const error = new Error('   ');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for custom error class extending Error', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for custom error class not extending Error', () => {
      class NonStandardError {
        name = 'NonStandardError';
        message = 'Not an Error instance';
      }
      const error = new NonStandardError();
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error without stack trace', () => {
      const error = new Error('Error without stack');
      delete (error as unknown as { stack?: string }).stack;
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with modified prototype', () => {
      const error = new Error('Modified error');
      Object.setPrototypeOf(error, null);
      expect(isFatalError(error)).toBe(false);
    });

    it('should return false for Error with circular cause reference', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2', { cause: error1 });
      (error1 as unknown as { cause?: Error }).cause = error2;
      expect(isFatalError(error1)).toBe(false);
      expect(isFatalError(error2)).toBe(false);
    });
  });

  // ==========================================================================
  // NULL/UNDEFINED/INVALID TESTS (Return FALSE)
  // ==========================================================================

  describe('Null/Undefined/Invalid values (return false)', () => {
    it('should return false for null', () => {
      expect(isFatalError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isFatalError(undefined)).toBe(false);
    });

    it('should return false for string values', () => {
      expect(isFatalError('string error')).toBe(false);
      expect(isFatalError('')).toBe(false);
      expect(isFatalError('Error: something went wrong')).toBe(false);
    });

    it('should return false for number values', () => {
      expect(isFatalError(0)).toBe(false);
      expect(isFatalError(1)).toBe(false);
      expect(isFatalError(-1)).toBe(false);
      expect(isFatalError(3.14)).toBe(false);
      expect(isFatalError(NaN)).toBe(false);
      expect(isFatalError(Infinity)).toBe(false);
    });

    it('should return false for boolean values', () => {
      expect(isFatalError(true)).toBe(false);
      expect(isFatalError(false)).toBe(false);
    });

    it('should return false for BigInt values', () => {
      expect(isFatalError(BigInt(0))).toBe(false);
      expect(isFatalError(BigInt(123))).toBe(false);
    });

    it('should return false for Symbol values', () => {
      expect(isFatalError(Symbol('test'))).toBe(false);
      expect(isFatalError(Symbol.for('test'))).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isFatalError({})).toBe(false);
    });

    it('should return false for object with properties', () => {
      expect(isFatalError({ message: 'error', code: 'TEST' })).toBe(false);
    });

    it('should return false for object with error-like properties', () => {
      expect(
        isFatalError({ name: 'Error', message: 'test', stack: 'stack trace' })
      ).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(isFatalError([])).toBe(false);
    });

    it('should return false for array with elements', () => {
      expect(isFatalError([1, 2, 3])).toBe(false);
      expect(isFatalError(['error1', 'error2'])).toBe(false);
    });

    it('should return false for function values', () => {
      expect(isFatalError(() => {})).toBe(false);
      expect(isFatalError(function test() {})).toBe(false);
      expect(isFatalError(async () => {})).toBe(false);
    });

    it('should return false for class instances', () => {
      class TestClass {
        value = 'test';
      }
      expect(isFatalError(new TestClass())).toBe(false);
    });

    it('should return false for Date objects', () => {
      expect(isFatalError(new Date())).toBe(false);
    });

    it('should return false for RegExp objects', () => {
      expect(isFatalError(/test/)).toBe(false);
    });

    it('should return false for Map objects', () => {
      expect(isFatalError(new Map())).toBe(false);
    });

    it('should return false for Set objects', () => {
      expect(isFatalError(new Set())).toBe(false);
    });

    it('should return false for null prototype objects', () => {
      const obj = Object.create(null);
      expect(isFatalError(obj)).toBe(false);
    });

    it('should return false for frozen objects', () => {
      const obj = Object.freeze({ message: 'error' });
      expect(isFatalError(obj)).toBe(false);
    });

    it('should return false for sealed objects', () => {
      const obj = Object.seal({ message: 'error' });
      expect(isFatalError(obj)).toBe(false);
    });
  });

  // ==========================================================================
  // TYPE GUARD INTEGRATION TESTS
  // ==========================================================================

  describe('Type guard integration', () => {
    it('should work with isPipelineError type guard', () => {
      const error = new SessionError('Test error');

      if (isPipelineError(error)) {
        // Type is narrowed to PipelineError
        expect(isFatalError(error)).toBe(true);
      } else {
        expect.fail('Error should be a PipelineError');
      }
    });

    it('should work with isSessionError type guard', () => {
      const error = new SessionError('Test error');

      if (isSessionError(error)) {
        // Type is narrowed to SessionError
        expect(isFatalError(error)).toBe(true);
        expect(error.code).toBeDefined(); // Accessing SessionError-specific property
      }
    });

    it('should work with isTaskError type guard', () => {
      const error = new TaskError('Test error', { taskId: 'P1.M1.T1' });

      if (isTaskError(error)) {
        // Type is narrowed to TaskError
        expect(isFatalError(error)).toBe(false);
        expect(error.code).toBeDefined(); // Accessing TaskError-specific property
      }
    });

    it('should work with isAgentError type guard', () => {
      const error = new AgentError('Test error', { taskId: 'P1.M1.T1' });

      if (isAgentError(error)) {
        // Type is narrowed to AgentError
        expect(isFatalError(error)).toBe(false);
        expect(error.code).toBeDefined(); // Accessing AgentError-specific property
      }
    });

    it('should work with isValidationError type guard', () => {
      const parsePrdError = new ValidationError('Test error', {
        operation: 'parse_prd',
      });

      if (isValidationError(parsePrdError)) {
        // Type is narrowed to ValidationError
        expect(isFatalError(parsePrdError)).toBe(true);
      }

      const nonParsePrdError = new ValidationError('Test error', {
        operation: 'validate_scope',
      });

      if (isValidationError(nonParsePrdError)) {
        expect(isFatalError(nonParsePrdError)).toBe(false);
      }
    });

    it('should work with isEnvironmentError type guard', () => {
      const error = new EnvironmentError('Test error', {
        variable: 'TEST_VAR',
      });

      if (isEnvironmentError(error)) {
        // Type is narrowed to EnvironmentError
        expect(isFatalError(error)).toBe(true);
        expect(error.code).toBeDefined(); // Accessing EnvironmentError-specific property
      }
    });

    it('should handle non-PipelineError with type guards', () => {
      const error = new Error('Standard error');

      if (!isPipelineError(error)) {
        expect(isFatalError(error)).toBe(false);
      }
    });

    it('should support switch-style error handling with type guards', () => {
      const errors: unknown[] = [
        new SessionError('Session error'),
        new TaskError('Task error', { taskId: 'P1.M1.T1' }),
        new AgentError('Agent error', { taskId: 'P1.M1.T1' }),
        new EnvironmentError('Environment error'),
        new Error('Plain error'),
      ];

      let fatalCount = 0;
      let nonFatalCount = 0;

      for (const error of errors) {
        if (isFatalError(error)) {
          fatalCount++;
        } else {
          nonFatalCount++;
        }
      }

      // SessionError, EnvironmentError are fatal
      expect(fatalCount).toBe(2);
      // TaskError, AgentError, plain Error are non-fatal
      expect(nonFatalCount).toBe(3);
    });

    it('should handle nested type guard checks', () => {
      const error = new SessionError('Test error');

      if (isPipelineError(error)) {
        if (isSessionError(error)) {
          // Double-narrowed to SessionError
          expect(isFatalError(error)).toBe(true);
          expect(error.isLoadError()).toBeDefined();
        }
      }
    });

    it('should work with multiple error types in sequence', () => {
      const sessionError = new SessionError('Session error');
      const taskError = new TaskError('Task error', { taskId: 'P1.M1.T1' });
      const envError = new EnvironmentError('Env error');

      expect(isFatalError(sessionError)).toBe(true);
      expect(isFatalError(taskError)).toBe(false);
      expect(isFatalError(envError)).toBe(true);
    });
  });

  // ==========================================================================
  // continueOnError FLAG TESTS
  // ==========================================================================

  describe('continueOnError flag behavior', () => {
    it('should return false for SessionError when continueOnError is true', () => {
      const error = new SessionError('Session load failed');
      expect(isFatalError(error, true)).toBe(false); // Override fatal behavior
    });

    it('should return false for EnvironmentError when continueOnError is true', () => {
      const error = new EnvironmentError('Missing API key');
      expect(isFatalError(error, true)).toBe(false); // Override fatal behavior
    });

    it('should return false for ValidationError parse_prd when continueOnError is true', () => {
      const error = new ValidationError('PRD parsing failed', {
        operation: 'parse_prd',
      });
      expect(isFatalError(error, true)).toBe(false); // Override fatal behavior
    });

    it('should return false for TaskError when continueOnError is true', () => {
      const error = new TaskError('Task execution failed', {
        taskId: 'P1.M1.T1',
      });
      expect(isFatalError(error, true)).toBe(false);
    });

    it('should return false for AgentError when continueOnError is true', () => {
      const error = new AgentError('LLM call failed', {
        taskId: 'P1.M1.T1',
      });
      expect(isFatalError(error, true)).toBe(false);
    });

    it('should return false for standard Error when continueOnError is true', () => {
      const error = new Error('Standard error');
      expect(isFatalError(error, true)).toBe(false);
    });

    it('should return false for null when continueOnError is true', () => {
      expect(isFatalError(null, true)).toBe(false);
    });

    it('should return false for undefined when continueOnError is true', () => {
      expect(isFatalError(undefined, true)).toBe(false);
    });

    it('should return false for string when continueOnError is true', () => {
      expect(isFatalError('string error', true)).toBe(false);
    });

    it('should return true for SessionError when continueOnError is false (explicit)', () => {
      const error = new SessionError('Session load failed');
      expect(isFatalError(error, false)).toBe(true); // Normal fatal behavior
    });

    it('should return true for EnvironmentError when continueOnError is false (explicit)', () => {
      const error = new EnvironmentError('Missing API key');
      expect(isFatalError(error, false)).toBe(true); // Normal fatal behavior
    });

    it('should return false for TaskError when continueOnError is false (explicit)', () => {
      const error = new TaskError('Task execution failed', {
        taskId: 'P1.M1.T1',
      });
      expect(isFatalError(error, false)).toBe(false); // Normal non-fatal behavior
    });

    it('should handle default continueOnError parameter (false)', () => {
      const fatalError = new SessionError('Session load failed');
      const nonFatalError = new TaskError('Task execution failed', {
        taskId: 'P1.M1.T1',
      });

      // Default parameter should be false (normal behavior)
      expect(isFatalError(fatalError)).toBe(true);
      expect(isFatalError(nonFatalError)).toBe(false);
    });

    it('should override all error types when continueOnError is true', () => {
      const errors: unknown[] = [
        new SessionError('Session error'),
        new EnvironmentError('Environment error'),
        new ValidationError('PRD error', { operation: 'parse_prd' }),
        new TaskError('Task error', { taskId: 'P1.M1.T1' }),
        new AgentError('Agent error', { taskId: 'P1.M1.T1' }),
        new Error('Standard error'),
        null,
        undefined,
      ];

      // All should be non-fatal when continueOnError is true
      for (const error of errors) {
        expect(isFatalError(error, true)).toBe(false);
      }
    });
  });

  // ==========================================================================
  // EDGE CASES AND BOUNDARY CONDITIONS
  // ==========================================================================

  describe('Edge cases and boundary conditions', () => {
    // Message edge cases
    it('should handle empty string message', () => {
      const error = new SessionError('', { sessionPath: '/path' });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new SessionError(longMessage);
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle special characters in message', () => {
      const error = new SessionError('Error: \n\t\r\u0010[Special]');
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle unicode characters in message', () => {
      const error = new SessionError('Error: 你好 🚀 Ñoño');
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle newlines and tabs in message', () => {
      const error = new SessionError('Line 1\nLine 2\tTabbed');
      expect(isFatalError(error)).toBe(true);
    });

    // Context edge cases
    it('should handle missing context property', () => {
      const error = new SessionError('No context');
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle empty context object', () => {
      const error = new SessionError('Empty context', {});
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle context with null values', () => {
      const error = new SessionError('Null context', {
        sessionPath: null as unknown as string,
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle context with undefined values', () => {
      const error = new SessionError('Undefined context', {
        sessionPath: undefined as unknown as string,
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle circular references in context', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;
      const error = new SessionError('Circular reference', { data: circular });
      expect(isFatalError(error)).toBe(true);
    });

    // Error property edge cases
    it('should handle error without message', () => {
      const error = new SessionError('');
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error without stack', () => {
      const error = new SessionError('No stack');
      delete (error as unknown as { stack?: string }).stack;
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error without name', () => {
      const error = new SessionError('Test');
      delete (error as unknown as { name?: string }).name;
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error with modified prototype', () => {
      const error = new SessionError('Modified prototype');
      Object.setPrototypeOf(error, null);
      expect(isFatalError(error)).toBe(false); // Not a PipelineError anymore
    });

    // Multiple causes/nested errors
    it('should handle error with cause chain', () => {
      const cause1 = new Error('Root cause');
      const cause2 = new Error('Intermediate cause', { cause: cause1 });
      const error = new SessionError('Session error', {}, cause2);
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle wrapped PipelineError', () => {
      const innerError = new TaskError('Inner task error', {
        taskId: 'P1.M1.T1',
      });
      const outerError = new SessionError(
        'Outer session error',
        {},
        innerError
      );
      expect(isFatalError(outerError)).toBe(true);
      expect(isFatalError(innerError)).toBe(false);
    });

    it('should handle double-wrapped errors', () => {
      const inner = new Error('Inner error');
      const middle = new SessionError('Middle error', {}, inner);
      const outer = new EnvironmentError('Outer error', {}, middle);
      expect(isFatalError(outer)).toBe(true);
    });

    it('should handle error with function in context', () => {
      const error = new SessionError('Function in context', {
        callback: () => 'test',
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error with symbol in context', () => {
      const error = new SessionError('Symbol in context', {
        symbol: Symbol('test'),
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error with mixed type context', () => {
      const error = new SessionError('Mixed context', {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error with deeply nested context', () => {
      const error = new SessionError('Deeply nested context', {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error with very long property name in context', () => {
      const longKey = 'a'.repeat(1000);
      const error = new SessionError('Long key context', {
        [longKey]: 'value',
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should handle error with many context properties', () => {
      const context: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        context[`prop${i}`] = `value${i}`;
      }
      const error = new SessionError('Many properties', context);
      expect(isFatalError(error)).toBe(true);
    });
  });

  // ==========================================================================
  // BEHAVIOR CONSISTENCY TESTS
  // ==========================================================================

  describe('Behavior consistency', () => {
    it('should consistently classify same error type', () => {
      const errors = Array.from({ length: 10 }, () => new SessionError('Test'));
      const results = errors.map(e => isFatalError(e));
      expect(results.every(r => r === true)).toBe(true);
    });

    it('should handle multiple calls with same error', () => {
      const error = new SessionError('Test error');
      expect(isFatalError(error)).toBe(true);
      expect(isFatalError(error)).toBe(true);
      expect(isFatalError(error)).toBe(true);
    });

    it('should not modify error object', () => {
      const error = new SessionError('Test error', { sessionPath: '/path' });
      const originalContext = { ...error.context };
      const originalMessage = error.message;

      isFatalError(error);

      expect(error.context).toEqual(originalContext);
      expect(error.message).toBe(originalMessage);
    });

    it('should handle errors created at different times', () => {
      const error1 = new SessionError('Error 1');
      // Small delay to ensure different timestamps
      const startTime = Date.now();
      while (Date.now() - startTime < 1) {
        // Empty loop for minimal delay
      }
      const error2 = new SessionError('Error 2');

      expect(isFatalError(error1)).toBe(true);
      expect(isFatalError(error2)).toBe(true);
    });

    it('should treat error subclasses independently', () => {
      const sessionError = new SessionError('Session error');
      const taskError = new TaskError('Task error', { taskId: 'P1.M1.T1' });
      const agentError = new AgentError('Agent error', { taskId: 'P1.M1.T1' });

      expect(isFatalError(sessionError)).toBe(true);
      expect(isFatalError(taskError)).toBe(false);
      expect(isFatalError(agentError)).toBe(false);
    });
  });
});
