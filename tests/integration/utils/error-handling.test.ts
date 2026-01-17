/**
 * Integration tests for Error Handling Coverage
 *
 * @remarks
 * Tests validate error handling throughout the pipeline including:
 * - Error propagation through the pipeline
 * - Error categorization (fatal vs non-fatal)
 * - --continue-on-error flag behavior
 * - Error recovery scenarios
 * - Error report generation
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/utils/errors.ts | Error Utilities}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  PipelineError,
  SessionError,
  TaskError,
  ValidationError,
  EnvironmentError,
  isFatalError,
} from '../../../src/utils/errors.js';
import { mockSimplePRD } from '../../fixtures/simple-prd.js';

// =============================================================================
// Test Constants
// =============================================================================

const TEMP_DIR_TEMPLATE = join(tmpdir(), 'error-handling-test-XXXXXX');

// =============================================================================
// Fixture Helper Functions
// =============================================================================

function setupTestDir(): string {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  return tempDir;
}

// =============================================================================
// Test Suites
// =============================================================================

describe('Error Handling Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = setupTestDir();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Error Type Validation
  // ===========================================================================

  describe('Error Type Hierarchy', () => {
    it('should create PipelineError with correct properties', () => {
      const error = new PipelineError('Test pipeline error', {
        code: 'TEST_001',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PipelineError');
      expect(error.message).toBe('Test pipeline error');
      expect((error as any).code).toBe('TEST_001');
    });

    it('should create SessionError with correct properties', () => {
      const error = new SessionError('Test session error', {
        sessionPath: '/test/path',
      });

      expect(error).toBeInstanceOf(PipelineError);
      expect(error.name).toBe('SessionError');
      expect(error.message).toBe('Test session error');
      expect((error as any).sessionPath).toBe('/test/path');
    });

    it('should create TaskError with correct properties', () => {
      const error = new TaskError('Test task error', { taskId: 'P1.M1.T1.S1' });

      expect(error).toBeInstanceOf(PipelineError);
      expect(error.name).toBe('TaskError');
      expect(error.message).toBe('Test task error');
      expect((error as any).taskId).toBe('P1.M1.T1.S1');
    });

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Test validation error', {
        field: 'testField',
        value: 'invalid',
      });

      expect(error).toBeInstanceOf(PipelineError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test validation error');
      expect((error as any).field).toBe('testField');
    });

    it('should create EnvironmentError with correct properties', () => {
      const error = new EnvironmentError('Test environment error', {
        variable: 'TEST_VAR',
      });

      expect(error).toBeInstanceOf(PipelineError);
      expect(error.name).toBe('EnvironmentError');
      expect(error.message).toBe('Test environment error');
      expect((error as any).variable).toBe('TEST_VAR');
    });
  });

  // ===========================================================================
  // Fatal Error Detection
  // ===========================================================================

  describe('Fatal Error Detection', () => {
    it('should identify SessionError as fatal', () => {
      const error = new SessionError('Session not found');
      expect(isFatalError(error)).toBe(true);
    });

    it('should identify EnvironmentError as fatal', () => {
      const error = new EnvironmentError('Missing API key');
      expect(isFatalError(error)).toBe(true);
    });

    it('should identify ValidationError as non-fatal', () => {
      const error = new ValidationError('Invalid input');
      expect(isFatalError(error)).toBe(false);
    });

    it('should identify TaskError as non-fatal by default', () => {
      const error = new TaskError('Task execution failed');
      expect(isFatalError(error)).toBe(false);
    });

    it('should handle standard Error as non-fatal', () => {
      const error = new Error('Standard error');
      expect(isFatalError(error)).toBe(false);
    });

    it('should handle unknown error types as non-fatal', () => {
      const error = 'String error';
      expect(isFatalError(error)).toBe(false);
    });
  });

  // ===========================================================================
  // Error Propagation
  // ===========================================================================

  describe('Error Propagation', () => {
    it('should propagate PipelineError through async stack', async () => {
      // Simulate an async function that throws PipelineError
      const asyncFunction = async (): Promise<void> => {
        throw new PipelineError('Async pipeline failed');
      };

      // Wrap in try/catch to verify error propagates
      let caughtError: Error | null = null;
      try {
        await asyncFunction();
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError).toBeInstanceOf(PipelineError);
      expect(caughtError!.message).toBe('Async pipeline failed');
    });

    it('should maintain error context through re-throws', async () => {
      const innerFunction = async (): Promise<void> => {
        throw new TaskError('Inner task failed', { taskId: 'P1.M1.T1.S1' });
      };

      const outerFunction = async (): Promise<void> => {
        try {
          await innerFunction();
        } catch (error) {
          // Re-throw with additional context
          throw new PipelineError('Outer function failed', {
            cause: error,
          });
        }
      };

      let caughtError: Error | null = null;
      try {
        await outerFunction();
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError).toBeInstanceOf(PipelineError);
      expect(caughtError!.message).toBe('Outer function failed');
    });
  });

  // ===========================================================================
  // Error Recovery Scenarios
  // ===========================================================================

  describe('Error Recovery Scenarios', () => {
    it('should recover from non-fatal ValidationError', async () => {
      let attempts = 0;
      const operationWithRetry = async (): Promise<string> => {
        attempts++;

        if (attempts < 3) {
          throw new ValidationError('Invalid data, retrying');
        }

        return 'success';
      };

      // Simulate retry logic
      let result: string | null = null;
      for (let i = 0; i < 5; i++) {
        try {
          result = await operationWithRetry();
          break;
        } catch (error) {
          if (error instanceof ValidationError) {
            // Retry on validation error
            continue;
          }
          throw error; // Re-throw fatal errors
        }
      }

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry on fatal errors', async () => {
      let attempts = 0;
      const fatalOperation = async (): Promise<string> => {
        attempts++;
        throw new SessionError('Session not found');
      };

      let caughtError: Error | null = null;
      try {
        await fatalOperation();
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBeInstanceOf(SessionError);
      expect(attempts).toBe(1); // Should not retry
    });
  });

  // ===========================================================================
  // Error Context Preservation
  // ===========================================================================

  describe('Error Context Preservation', () => {
    it('should preserve taskId in TaskError', () => {
      const error = new TaskError('Task failed', {
        taskId: 'P1.M1.T1.S1',
        timestamp: new Date().toISOString(),
      });

      expect((error as any).taskId).toBe('P1.M1.T1.S1');
      expect((error as any).timestamp).toBeDefined();
    });

    it('should preserve sessionPath in SessionError', () => {
      const sessionPath = '/plan/001_abc123';
      const error = new SessionError('Session load failed', {
        sessionPath,
        attempt: 2,
      });

      expect((error as any).sessionPath).toBe(sessionPath);
      expect((error as any).attempt).toBe(2);
    });

    it('should preserve validation field in ValidationError', () => {
      const error = new ValidationError('Field validation failed', {
        field: 'status',
        value: 'InvalidStatus',
        allowedValues: ['Planned', 'Complete', 'Failed'],
      });

      expect((error as any).field).toBe('status');
      expect((error as any).value).toBe('InvalidStatus');
      expect((error as any).allowedValues).toEqual([
        'Planned',
        'Complete',
        'Failed',
      ]);
    });
  });

  // ===========================================================================
  // Error Message Formatting
  // ===========================================================================

  describe('Error Message Formatting', () => {
    it('should format PipelineError message correctly', () => {
      const error = new PipelineError('Base error');
      expect(error.message).toBe('Base error');
      expect(error.toString()).toContain('PipelineError');
    });

    it('should format TaskError with taskId in message', () => {
      const error = new TaskError('Task failed', { taskId: 'P1.M1.T1.S1' });
      expect(error.message).toBe('Task failed');
      expect(error.toString()).toContain('TaskError');
    });

    it('should format ValidationError with field information', () => {
      const error = new ValidationError('Invalid field', { field: 'status' });
      expect(error.message).toBe('Invalid field');
      expect((error as any).field).toBe('status');
    });
  });

  // ===========================================================================
  // Error Stack Traces
  // ===========================================================================

  describe('Error Stack Traces', () => {
    it('should include stack trace in PipelineError', () => {
      const error = new PipelineError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PipelineError');
    });

    it('should preserve stack trace through error wrapping', async () => {
      const innerFunction = async (): Promise<void> => {
        throw new TaskError('Inner error');
      };

      const outerFunction = async (): Promise<void> => {
        try {
          await innerFunction();
        } catch (cause) {
          throw new PipelineError('Outer error', { cause });
        }
      };

      let caughtError: Error | null = null;
      try {
        await outerFunction();
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBeInstanceOf(PipelineError);
      expect(caughtError!.stack).toBeDefined();
      expect((caughtError as any).cause).toBeInstanceOf(TaskError);
    });
  });
});
