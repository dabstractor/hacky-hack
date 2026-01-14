/**
 * Unit tests for Error hierarchy
 *
 * @remarks
 * Tests validate the complete error hierarchy functionality including:
 * 1. ErrorCodes constant export and type safety
 * 2. PipelineError base class with abstract code property
 * 3. Specialized error classes (SessionError, TaskError, AgentError, ValidationError)
 * 4. Prototype chain setup (instanceof checks)
 * 5. toJSON() serialization for structured logging
 * 6. Context sanitization (sensitive data redaction)
 * 7. Circular reference handling
 * 8. Type guard functions for type narrowing
 * 9. Timestamp tracking
 * 10. Error chaining with cause property
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ErrorCodes,
  ErrorCode,
  PipelineErrorContext,
  PipelineError,
  SessionError,
  TaskError,
  AgentError,
  ValidationError,
  isPipelineError,
  isSessionError,
  isTaskError,
  isAgentError,
  isValidationError,
} from '../../../src/utils/errors.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('Error hierarchy', () => {
  // Clear any caches or state before each test
  beforeEach(() => {
    // No state to clear for this module
  });

  afterEach(() => {
    // No cleanup needed
  });

  // ========================================================================
  // ErrorCodes constant tests
  // ========================================================================

  describe('ErrorCodes constant', () => {
    it('should export all error codes', () => {
      // Session errors
      expect(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED).toBe(
        'PIPELINE_SESSION_LOAD_FAILED'
      );
      expect(ErrorCodes.PIPELINE_SESSION_SAVE_FAILED).toBe(
        'PIPELINE_SESSION_SAVE_FAILED'
      );
      expect(ErrorCodes.PIPELINE_SESSION_NOT_FOUND).toBe(
        'PIPELINE_SESSION_NOT_FOUND'
      );

      // Task errors
      expect(ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED).toBe(
        'PIPELINE_TASK_EXECUTION_FAILED'
      );
      expect(ErrorCodes.PIPELINE_TASK_VALIDATION_FAILED).toBe(
        'PIPELINE_TASK_VALIDATION_FAILED'
      );
      expect(ErrorCodes.PIPELINE_TASK_NOT_FOUND).toBe(
        'PIPELINE_TASK_NOT_FOUND'
      );

      // Agent errors
      expect(ErrorCodes.PIPELINE_AGENT_LLM_FAILED).toBe(
        'PIPELINE_AGENT_LLM_FAILED'
      );
      expect(ErrorCodes.PIPELINE_AGENT_TIMEOUT).toBe('PIPELINE_AGENT_TIMEOUT');
      expect(ErrorCodes.PIPELINE_AGENT_PARSE_FAILED).toBe(
        'PIPELINE_AGENT_PARSE_FAILED'
      );

      // Validation errors
      expect(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT).toBe(
        'PIPELINE_VALIDATION_INVALID_INPUT'
      );
      expect(ErrorCodes.PIPELINE_VALIDATION_MISSING_FIELD).toBe(
        'PIPELINE_VALIDATION_MISSING_FIELD'
      );
      expect(ErrorCodes.PIPELINE_VALIDATION_SCHEMA_FAILED).toBe(
        'PIPELINE_VALIDATION_SCHEMA_FAILED'
      );
    });

    it('should have const assertion for type safety', () => {
      // Type safety is enforced at compile time
      // Runtime check: ensure values are immutable strings
      const code1 = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
      const code2 = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
      expect(code1).toBe(code2);
      expect(typeof code1).toBe('string');
    });

    it('should have correct ErrorCode type', () => {
      // Test that ErrorCode type works correctly
      const code: ErrorCode = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
      expect(code).toBe('PIPELINE_SESSION_LOAD_FAILED');
    });

    it('should have all codes follow naming pattern', () => {
      const allCodes = Object.values(ErrorCodes);
      const pattern = /^PIPELINE_[A-Z]+_[A-Z_]+$/;

      for (const code of allCodes) {
        expect(code).toMatch(pattern);
      }
    });
  });

  // ========================================================================
  // PipelineErrorContext interface tests
  // ========================================================================

  describe('PipelineErrorContext interface', () => {
    it('should accept common context properties', () => {
      const context: PipelineErrorContext = {
        sessionPath: '/path/to/session',
        taskId: 'P1.M1.T1',
        operation: 'loadSession',
        cause: 'File not found',
      };
      expect(context.sessionPath).toBe('/path/to/session');
      expect(context.taskId).toBe('P1.M1.T1');
      expect(context.operation).toBe('loadSession');
      expect(context.cause).toBe('File not found');
    });

    it('should accept additional arbitrary properties', () => {
      const context: PipelineErrorContext = {
        customField: 'custom value',
        attempt: 3,
        maxAttempts: 5,
        success: false,
      };
      expect(context.customField).toBe('custom value');
      expect(context.attempt).toBe(3);
      expect(context.maxAttempts).toBe(5);
      expect(context.success).toBe(false);
    });
  });

  // ========================================================================
  // PipelineError base class tests
  // ========================================================================

  describe('PipelineError abstract base class', () => {
    it('should create concrete subclasses correctly', () => {
      const error = new SessionError('Test error');
      expect(error instanceof SessionError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should have error message', () => {
      const error = new SessionError('Test error message');
      expect(error.message).toBe('Test error message');
    });

    it('should have timestamp', () => {
      const before = new Date();
      const error = new SessionError('Test error');
      const after = new Date();

      expect(error.timestamp).toBeDefined();
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have name property set to class name', () => {
      const sessionError = new SessionError('Test');
      const taskError = new TaskError('Test');
      const agentError = new AgentError('Test');
      const validationError = new ValidationError('Test');

      expect(sessionError.name).toBe('SessionError');
      expect(taskError.name).toBe('TaskError');
      expect(agentError.name).toBe('AgentError');
      expect(validationError.name).toBe('ValidationError');
    });

    it('should have stack trace', () => {
      const error = new SessionError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('SessionError');
    });

    it('should accept context object', () => {
      const context: PipelineErrorContext = {
        sessionPath: '/path/to/session',
        taskId: 'P1.M1.T1',
      };
      const error = new SessionError('Test error', context);
      expect(error.context).toEqual(context);
    });

    it('should handle undefined context', () => {
      const error = new SessionError('Test error');
      expect(error.context).toBeUndefined();
    });

    it('should accept cause error', () => {
      const cause = new Error('Underlying error');
      const error = new SessionError('Test error', {}, cause);

      // Check that cause is stored
      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBeDefined();
      expect(errorWithCause.cause).toBe(cause);
    });

    it('should handle undefined cause', () => {
      const error = new SessionError('Test error');

      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBeUndefined();
    });
  });

  // ========================================================================
  // toJSON() serialization tests
  // ========================================================================

  describe('toJSON() serialization', () => {
    it('should serialize error to plain object', () => {
      const error = new SessionError('Test error');
      const json = error.toJSON();

      expect(json).toBeDefined();
      expect(typeof json).toBe('object');
    });

    it('should include name in JSON', () => {
      const error = new SessionError('Test error');
      const json = error.toJSON();

      expect(json.name).toBe('SessionError');
    });

    it('should include code in JSON', () => {
      const error = new SessionError('Test error');
      const json = error.toJSON();

      expect(json.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
    });

    it('should include message in JSON', () => {
      const error = new SessionError('Test error message');
      const json = error.toJSON();

      expect(json.message).toBe('Test error message');
    });

    it('should include timestamp in ISO format', () => {
      const error = new SessionError('Test error');
      const json = error.toJSON();

      expect(json.timestamp).toBeDefined();
      expect(typeof json.timestamp).toBe('string');
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include stack trace in JSON', () => {
      const error = new SessionError('Test error');
      const json = error.toJSON();

      expect(json.stack).toBeDefined();
      expect(typeof json.stack).toBe('string');
    });

    it('should include context in JSON when provided', () => {
      const context: PipelineErrorContext = {
        sessionPath: '/path/to/session',
        taskId: 'P1.M1.T1',
      };
      const error = new SessionError('Test error', context);
      const json = error.toJSON();

      expect(json.context).toBeDefined();
      expect(json.context).toEqual(context);
    });

    it('should not include context in JSON when not provided', () => {
      const error = new SessionError('Test error');
      const json = error.toJSON();

      expect(json.context).toBeUndefined();
    });

    it('should be JSON.stringify compatible', () => {
      const error = new SessionError('Test error', { taskId: 'P1.M1.T1' });

      expect(() => JSON.stringify(error.toJSON())).not.toThrow();
      const jsonStr = JSON.stringify(error.toJSON());
      const parsed = JSON.parse(jsonStr);

      expect(parsed.name).toBe('SessionError');
      expect(parsed.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
    });
  });

  // ========================================================================
  // Context sanitization tests
  // ========================================================================

  describe('Context sanitization', () => {
    it('should redact apiKey field', () => {
      const error = new SessionError('Test error', {
        apiKey: 'sk-secret-key-12345',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.apiKey).toBe('[REDACTED]');
    });

    it('should redact token field', () => {
      const error = new SessionError('Test error', {
        token: 'secret-token-abc',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.token).toBe('[REDACTED]');
    });

    it('should redact password field', () => {
      const error = new SessionError('Test error', {
        password: 'secret-password',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.password).toBe('[REDACTED]');
    });

    it('should redact secret field', () => {
      const error = new SessionError('Test error', {
        secret: 'top-secret-value',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.secret).toBe('[REDACTED]');
    });

    it('should redact authorization field', () => {
      const error = new SessionError('Test error', {
        authorization: 'Bearer secret-token',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.authorization).toBe('[REDACTED]');
    });

    it('should redact email field', () => {
      const error = new SessionError('Test error', {
        email: 'user@example.com',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.email).toBe('[REDACTED]');
    });

    it('should redact case-insensitively', () => {
      const error = new SessionError('Test error', {
        APIKEY: 'sk-secret',
        ApiSecret: 'secret',
        PASSWORD: 'password',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.APIKEY).toBe('[REDACTED]');
      expect(context?.ApiSecret).toBe('[REDACTED]');
      expect(context?.PASSWORD).toBe('[REDACTED]');
    });

    it('should not redact non-sensitive fields', () => {
      const error = new SessionError('Test error', {
        taskId: 'P1.M1.T1',
        sessionPath: '/path/to/session',
        operation: 'loadSession',
        attempt: 3,
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.taskId).toBe('P1.M1.T1');
      expect(context?.sessionPath).toBe('/path/to/session');
      expect(context?.operation).toBe('loadSession');
      expect(context?.attempt).toBe(3);
    });

    it('should handle nested Error objects in context', () => {
      const cause = new Error('Original error');
      const error = new SessionError('Test error', {
        originalError: cause,
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.originalError).toEqual({
        name: 'Error',
        message: 'Original error',
      });
    });

    it('should handle circular references gracefully', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      const error = new SessionError('Test error', {
        data: circular,
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      // Should not throw and should have some value
      expect(context?.data).toBeDefined();
    });

    it('should handle non-serializable objects', () => {
      const fn = () => 'function';
      const error = new SessionError('Test error', {
        callback: fn,
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.callback).toBe('[non-serializable]');
    });

    it('should redact multiple sensitive fields in same context', () => {
      const error = new SessionError('Test error', {
        apiKey: 'sk-secret',
        token: 'secret-token',
        password: 'secret-password',
        safeField: 'public-value',
      });
      const json = error.toJSON();
      const context = json.context as Record<string, unknown> | undefined;

      expect(context?.apiKey).toBe('[REDACTED]');
      expect(context?.token).toBe('[REDACTED]');
      expect(context?.password).toBe('[REDACTED]');
      expect(context?.safeField).toBe('public-value');
    });
  });

  // ========================================================================
  // SessionError class tests
  // ========================================================================

  describe('SessionError class', () => {
    it('should create SessionError with message only', () => {
      const error = new SessionError('Session load failed');
      expect(error instanceof SessionError).toBe(true);
      expect(error.message).toBe('Session load failed');
    });

    it('should have correct error code', () => {
      const error = new SessionError('Test error');
      expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
    });

    it('should have correct name', () => {
      const error = new SessionError('Test error');
      expect(error.name).toBe('SessionError');
    });

    it('should accept context', () => {
      const context: PipelineErrorContext = {
        sessionPath: '/path/to/session',
        taskId: 'P1.M1.T1',
      };
      const error = new SessionError('Test error', context);
      expect(error.context).toEqual(context);
    });

    it('should accept cause', () => {
      const cause = new Error('File not found');
      const error = new SessionError('Test error', {}, cause);

      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBe(cause);
    });

    it('should work with instanceof', () => {
      const error = new SessionError('Test error');

      expect(error instanceof SessionError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should have isLoadError method', () => {
      const error = new SessionError('Test error');
      expect(typeof error.isLoadError).toBe('function');
    });

    it('should return true for isLoadError when code matches', () => {
      const error = new SessionError('Test error');
      expect(error.isLoadError()).toBe(true);
    });
  });

  // ========================================================================
  // TaskError class tests
  // ========================================================================

  describe('TaskError class', () => {
    it('should create TaskError with message only', () => {
      const error = new TaskError('Task execution failed');
      expect(error instanceof TaskError).toBe(true);
      expect(error.message).toBe('Task execution failed');
    });

    it('should have correct error code', () => {
      const error = new TaskError('Test error');
      expect(error.code).toBe(ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED);
    });

    it('should have correct name', () => {
      const error = new TaskError('Test error');
      expect(error.name).toBe('TaskError');
    });

    it('should accept context', () => {
      const context: PipelineErrorContext = {
        taskId: 'P1.M1.T1',
        attempt: 3,
        maxAttempts: 5,
      };
      const error = new TaskError('Test error', context);
      expect(error.context).toEqual(context);
    });

    it('should accept cause', () => {
      const cause = new Error('LLM timeout');
      const error = new TaskError('Test error', {}, cause);

      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBe(cause);
    });

    it('should work with instanceof', () => {
      const error = new TaskError('Test error');

      expect(error instanceof TaskError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  // ========================================================================
  // AgentError class tests
  // ========================================================================

  describe('AgentError class', () => {
    it('should create AgentError with message only', () => {
      const error = new AgentError('LLM call failed');
      expect(error instanceof AgentError).toBe(true);
      expect(error.message).toBe('LLM call failed');
    });

    it('should have correct error code', () => {
      const error = new AgentError('Test error');
      expect(error.code).toBe(ErrorCodes.PIPELINE_AGENT_LLM_FAILED);
    });

    it('should have correct name', () => {
      const error = new AgentError('Test error');
      expect(error.name).toBe('AgentError');
    });

    it('should accept context', () => {
      const context: PipelineErrorContext = {
        taskId: 'P1.M1.T1',
        operation: 'generatePRP',
        attempt: 2,
      };
      const error = new AgentError('Test error', context);
      expect(error.context).toEqual(context);
    });

    it('should accept cause', () => {
      const cause = new Error('Network timeout');
      const error = new AgentError('Test error', {}, cause);

      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBe(cause);
    });

    it('should work with instanceof', () => {
      const error = new AgentError('Test error');

      expect(error instanceof AgentError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  // ========================================================================
  // ValidationError class tests
  // ========================================================================

  describe('ValidationError class', () => {
    it('should create ValidationError with message only', () => {
      const error = new ValidationError('Invalid input');
      expect(error instanceof ValidationError).toBe(true);
      expect(error.message).toBe('Invalid input');
    });

    it('should have correct error code', () => {
      const error = new ValidationError('Test error');
      expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
    });

    it('should have correct name', () => {
      const error = new ValidationError('Test error');
      expect(error.name).toBe('ValidationError');
    });

    it('should accept context', () => {
      const context: PipelineErrorContext = {
        invalidInput: 'P1.X',
        expectedFormat: 'P1.M1',
      };
      const error = new ValidationError('Test error', context);
      expect(error.context).toEqual(context);
    });

    it('should accept cause', () => {
      const cause = new Error('Schema validation failed');
      const error = new ValidationError('Test error', {}, cause);

      const errorWithCause = error as unknown as { cause?: Error };
      expect(errorWithCause.cause).toBe(cause);
    });

    it('should work with instanceof', () => {
      const error = new ValidationError('Test error');

      expect(error instanceof ValidationError).toBe(true);
      expect(error instanceof PipelineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  // ========================================================================
  // Prototype chain tests
  // ========================================================================

  describe('Prototype chain setup', () => {
    it('should have correct prototype chain for SessionError', () => {
      const error = new SessionError('Test error');

      expect(Object.getPrototypeOf(error)).toBe(SessionError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
        PipelineError.prototype
      );
      expect(
        Object.getPrototypeOf(
          Object.getPrototypeOf(Object.getPrototypeOf(error))
        )
      ).toBe(Error.prototype);
    });

    it('should have correct prototype chain for TaskError', () => {
      const error = new TaskError('Test error');

      expect(Object.getPrototypeOf(error)).toBe(TaskError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
        PipelineError.prototype
      );
      expect(
        Object.getPrototypeOf(
          Object.getPrototypeOf(Object.getPrototypeOf(error))
        )
      ).toBe(Error.prototype);
    });

    it('should have correct prototype chain for AgentError', () => {
      const error = new AgentError('Test error');

      expect(Object.getPrototypeOf(error)).toBe(AgentError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
        PipelineError.prototype
      );
      expect(
        Object.getPrototypeOf(
          Object.getPrototypeOf(Object.getPrototypeOf(error))
        )
      ).toBe(Error.prototype);
    });

    it('should have correct prototype chain for ValidationError', () => {
      const error = new ValidationError('Test error');

      expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(
        PipelineError.prototype
      );
      expect(
        Object.getPrototypeOf(
          Object.getPrototypeOf(Object.getPrototypeOf(error))
        )
      ).toBe(Error.prototype);
    });

    it('should work with instanceof for all error types', () => {
      const sessionError = new SessionError('Test');
      const taskError = new TaskError('Test');
      const agentError = new AgentError('Test');
      const validationError = new ValidationError('Test');

      // SessionError
      expect(sessionError instanceof SessionError).toBe(true);
      expect(sessionError instanceof PipelineError).toBe(true);
      expect(sessionError instanceof Error).toBe(true);

      // TaskError
      expect(taskError instanceof TaskError).toBe(true);
      expect(taskError instanceof PipelineError).toBe(true);
      expect(taskError instanceof Error).toBe(true);

      // AgentError
      expect(agentError instanceof AgentError).toBe(true);
      expect(agentError instanceof PipelineError).toBe(true);
      expect(agentError instanceof Error).toBe(true);

      // ValidationError
      expect(validationError instanceof ValidationError).toBe(true);
      expect(validationError instanceof PipelineError).toBe(true);
      expect(validationError instanceof Error).toBe(true);
    });
  });

  // ========================================================================
  // Type guard tests
  // ========================================================================

  describe('Type guard functions', () => {
    describe('isPipelineError', () => {
      it('should return true for PipelineError instances', () => {
        const sessionError = new SessionError('Test');
        const taskError = new TaskError('Test');
        const agentError = new AgentError('Test');
        const validationError = new ValidationError('Test');

        expect(isPipelineError(sessionError)).toBe(true);
        expect(isPipelineError(taskError)).toBe(true);
        expect(isPipelineError(agentError)).toBe(true);
        expect(isPipelineError(validationError)).toBe(true);
      });

      it('should return true for plain Error', () => {
        const error = new Error('Test');
        expect(isPipelineError(error)).toBe(false);
      });

      it('should return false for non-errors', () => {
        expect(isPipelineError(null)).toBe(false);
        expect(isPipelineError(undefined)).toBe(false);
        expect(isPipelineError('string')).toBe(false);
        expect(isPipelineError(123)).toBe(false);
        expect(isPipelineError({})).toBe(false);
        expect(isPipelineError([])).toBe(false);
      });
    });

    describe('isSessionError', () => {
      it('should return true for SessionError instances', () => {
        const error = new SessionError('Test');
        expect(isSessionError(error)).toBe(true);
      });

      it('should return false for other error types', () => {
        const taskError = new TaskError('Test');
        const agentError = new AgentError('Test');
        const validationError = new ValidationError('Test');
        const plainError = new Error('Test');

        expect(isSessionError(taskError)).toBe(false);
        expect(isSessionError(agentError)).toBe(false);
        expect(isSessionError(validationError)).toBe(false);
        expect(isSessionError(plainError)).toBe(false);
      });

      it('should return false for non-errors', () => {
        expect(isSessionError(null)).toBe(false);
        expect(isSessionError(undefined)).toBe(false);
        expect(isSessionError('string')).toBe(false);
      });
    });

    describe('isTaskError', () => {
      it('should return true for TaskError instances', () => {
        const error = new TaskError('Test');
        expect(isTaskError(error)).toBe(true);
      });

      it('should return false for other error types', () => {
        const sessionError = new SessionError('Test');
        const agentError = new AgentError('Test');
        const validationError = new ValidationError('Test');
        const plainError = new Error('Test');

        expect(isTaskError(sessionError)).toBe(false);
        expect(isTaskError(agentError)).toBe(false);
        expect(isTaskError(validationError)).toBe(false);
        expect(isTaskError(plainError)).toBe(false);
      });

      it('should return false for non-errors', () => {
        expect(isTaskError(null)).toBe(false);
        expect(isTaskError(undefined)).toBe(false);
        expect(isTaskError('string')).toBe(false);
      });
    });

    describe('isAgentError', () => {
      it('should return true for AgentError instances', () => {
        const error = new AgentError('Test');
        expect(isAgentError(error)).toBe(true);
      });

      it('should return false for other error types', () => {
        const sessionError = new SessionError('Test');
        const taskError = new TaskError('Test');
        const validationError = new ValidationError('Test');
        const plainError = new Error('Test');

        expect(isAgentError(sessionError)).toBe(false);
        expect(isAgentError(taskError)).toBe(false);
        expect(isAgentError(validationError)).toBe(false);
        expect(isAgentError(plainError)).toBe(false);
      });

      it('should return false for non-errors', () => {
        expect(isAgentError(null)).toBe(false);
        expect(isAgentError(undefined)).toBe(false);
        expect(isAgentError('string')).toBe(false);
      });
    });

    describe('isValidationError', () => {
      it('should return true for ValidationError instances', () => {
        const error = new ValidationError('Test');
        expect(isValidationError(error)).toBe(true);
      });

      it('should return false for other error types', () => {
        const sessionError = new SessionError('Test');
        const taskError = new TaskError('Test');
        const agentError = new AgentError('Test');
        const plainError = new Error('Test');

        expect(isValidationError(sessionError)).toBe(false);
        expect(isValidationError(taskError)).toBe(false);
        expect(isValidationError(agentError)).toBe(false);
        expect(isValidationError(plainError)).toBe(false);
      });

      it('should return false for non-errors', () => {
        expect(isValidationError(null)).toBe(false);
        expect(isValidationError(undefined)).toBe(false);
        expect(isValidationError('string')).toBe(false);
      });
    });
  });

  // ========================================================================
  // Type narrowing tests
  // ========================================================================

  describe('Type narrowing with type guards', () => {
    it('should narrow type with isSessionError', () => {
      const error = new SessionError('Test error');

      if (isSessionError(error)) {
        // Type is narrowed to SessionError
        expect(error.code).toBe(ErrorCodes.PIPELINE_SESSION_LOAD_FAILED);
        expect(error.isLoadError()).toBe(true);
      }
    });

    it('should narrow type with isTaskError', () => {
      const error = new TaskError('Test error');

      if (isTaskError(error)) {
        // Type is narrowed to TaskError
        expect(error.code).toBe(ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED);
      }
    });

    it('should narrow type with isAgentError', () => {
      const error = new AgentError('Test error');

      if (isAgentError(error)) {
        // Type is narrowed to AgentError
        expect(error.code).toBe(ErrorCodes.PIPELINE_AGENT_LLM_FAILED);
      }
    });

    it('should narrow type with isValidationError', () => {
      const error = new ValidationError('Test error');

      if (isValidationError(error)) {
        // Type is narrowed to ValidationError
        expect(error.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
      }
    });

    it('should narrow type with isPipelineError', () => {
      const error = new SessionError('Test error');

      if (isPipelineError(error)) {
        // Type is narrowed to PipelineError
        expect(error.code).toBeDefined();
        expect(error.timestamp).toBeDefined();
        expect(error.toJSON).toBeDefined();
      }
    });

    it('should support switch-style error handling', () => {
      const errors: unknown[] = [
        new SessionError('Session error'),
        new TaskError('Task error'),
        new AgentError('Agent error'),
        new ValidationError('Validation error'),
        new Error('Plain error'),
      ];

      let sessionCount = 0;
      let taskCount = 0;
      let agentCount = 0;
      let validationCount = 0;

      for (const error of errors) {
        if (isSessionError(error)) {
          sessionCount++;
        } else if (isTaskError(error)) {
          taskCount++;
        } else if (isAgentError(error)) {
          agentCount++;
        } else if (isValidationError(error)) {
          validationCount++;
        }
      }

      expect(sessionCount).toBe(1);
      expect(taskCount).toBe(1);
      expect(agentCount).toBe(1);
      expect(validationCount).toBe(1);
    });

    it('should support error code checking', () => {
      // Create a TaskError to test non-timeout code
      const error = new TaskError('Test error', {
        operation: 'executeTask',
      });

      if (isTaskError(error)) {
        // Can safely access error code for retry logic
        if (error.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT) {
          // Would retry on timeout - but this is a TaskError with different code
          expect(true).toBe(false); // This should not execute
        } else {
          // Not a timeout error - this is the expected path
          expect(error.code).toBe(ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED);
        }
      }
    });
  });

  // ========================================================================
  // Integration scenario tests
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should support typical error throwing pattern', () => {
      expect(() => {
        throw new SessionError('Failed to load session', {
          sessionPath: '/path/to/session',
          taskId: 'P1.M1.T1',
        });
      }).toThrow(SessionError);
    });

    it('should support try-catch with type guard', () => {
      try {
        throw new TaskError('Task execution failed', {
          taskId: 'P1.M1.T1',
          attempt: 3,
        });
      } catch (error) {
        if (isTaskError(error)) {
          expect(error.message).toBe('Task execution failed');
          expect(error.context?.taskId).toBe('P1.M1.T1');
          expect(error.context?.attempt).toBe(3);
        } else {
          throw new Error('Expected TaskError');
        }
      }
    });

    it('should support error chaining with cause', () => {
      const originalError = new Error('Network timeout');
      const wrappedError = new AgentError(
        'Agent operation failed',
        { operation: 'generatePRP' },
        originalError
      );

      const wrappedWithCause = wrappedError as unknown as { cause?: Error };
      expect(wrappedWithCause.cause).toBe(originalError);
      expect(wrappedWithCause.cause?.message).toBe('Network timeout');
    });

    it('should support structured logging scenario', () => {
      const error = new ValidationError('Invalid input', {
        field: 'taskId',
        value: 'invalid',
      });

      const logData = error.toJSON();

      expect(logData.name).toBe('ValidationError');
      expect(logData.code).toBe(ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT);
      expect(logData.message).toBe('Invalid input');
      expect(logData.timestamp).toBeDefined();
      expect(logData.context).toEqual({ field: 'taskId', value: 'invalid' });
      expect(logData.stack).toBeDefined();
    });

    it('should support complex context objects', () => {
      const context: PipelineErrorContext = {
        sessionPath: '/path/to/session',
        taskId: 'P1.M1.T1',
        operation: 'loadSession',
        metadata: {
          timestamp: Date.now(),
          user: 'test-user',
        },
        tags: ['session', 'load', 'retry'],
      };

      const error = new SessionError('Complex error', context);
      expect(error.context).toEqual(context);
    });
  });
});
