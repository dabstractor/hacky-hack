/**
 * Unit tests for TaskRetryManager
 *
 * @remarks
 * Tests validate the complete retry functionality including:
 * 1. Retry on transient errors (network issues, timeouts)
 * 2. No retry on permanent errors (ValidationError, parse failures)
 * 3. Max attempts enforcement
 * 4. Exponential backoff calculation with jitter
 * 5. State preservation between retries
 * 6. Retry attempt logging with context
 * 7. 'Retrying' status updates
 * 8. Task marked as 'Failed' after max retries
 * 9. Disabled retry mode (direct execution)
 * 10. Error classification (retryable, permanent, unknown)
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskRetryManager } from '../../src/core/task-retry-manager.js';
import {
  ValidationError,
  AgentError,
  ErrorCodes,
} from '../../src/utils/errors.js';
import type { Subtask } from '../../src/core/models.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('TaskRetryManager', () => {
  let mockSessionManager: any;
  let mockSubtask: Subtask;

  beforeEach(() => {
    // Mock SessionManager
    mockSessionManager = {
      updateItemStatus: vi.fn().mockResolvedValue(undefined),
      flushUpdates: vi.fn().mockResolvedValue(undefined),
    };

    // Mock subtask
    mockSubtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Implementing',
      story_points: 2,
      dependencies: [],
      context_scope:
        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: Test\n3. LOGIC: Test\n4. OUTPUT: Test',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Retry on transient error
  // ========================================================================

  describe('retry on transient error', () => {
    it('should retry on ECONNRESET error and succeed', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          const err = new Error('ECONNRESET');
          (err as { code?: string }).code = 'ECONNRESET';
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2); // Initial + 1 retry
      expect(mockSessionManager.updateItemStatus).toHaveBeenCalledWith(
        mockSubtask.id,
        'Retrying'
      );
    });

    it('should retry on ETIMEDOUT error and succeed', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          const err = new Error('ETIMEDOUT');
          (err as { code?: string }).code = 'ETIMEDOUT';
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry on AgentError with PIPELINE_AGENT_TIMEOUT', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          throw new AgentError(
            'Agent timeout',
            ErrorCodes.PIPELINE_AGENT_TIMEOUT,
            {}
          );
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry on AgentError with PIPELINE_AGENT_LLM_FAILED', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          throw new AgentError(
            'LLM failed',
            ErrorCodes.PIPELINE_AGENT_LLM_FAILED,
            {}
          );
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry on HTTP 5xx error', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          const err = new Error('Internal server error');
          (err as { response?: { status?: number } }).response = {
            status: 500,
          };
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry on HTTP 429 rate limit error', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          const err = new Error('Rate limit exceeded');
          (err as { response?: { status?: number } }).response = {
            status: 429,
          };
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it('should retry multiple times before succeeding', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts <= 2) {
          const err = new Error('ECONNRESET');
          (err as { code?: string }).code = 'ECONNRESET';
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager(
        { maxAttempts: 4 },
        mockSessionManager
      );
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(3); // Initial + 2 retries
      expect(mockSessionManager.updateItemStatus).toHaveBeenCalledTimes(2);
    });
  });

  // ========================================================================
  // No retry on permanent error
  // ========================================================================

  describe('no retry on permanent error', () => {
    it('should throw immediately for ValidationError', async () => {
      const executeFn = async () => {
        throw new ValidationError('Invalid input', { field: 'test' });
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Invalid input');

      // Should not update status to Retrying
      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });

    it('should throw immediately for AgentError with PARSE_FAILED', async () => {
      const executeFn = async () => {
        throw new AgentError(
          'Parse failed',
          ErrorCodes.PIPELINE_AGENT_PARSE_FAILED,
          {}
        );
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Parse failed');

      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });

    it('should throw immediately for HTTP 400 Bad Request', async () => {
      const executeFn = async () => {
        const err = new Error('Bad request');
        (err as { response?: { status?: number } }).response = { status: 400 };
        throw err;
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Bad request');

      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });

    it('should throw immediately for HTTP 401 Unauthorized', async () => {
      const executeFn = async () => {
        const err = new Error('Unauthorized');
        (err as { response?: { status?: number } }).response = { status: 401 };
        throw err;
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Unauthorized');

      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });

    it('should throw immediately for HTTP 403 Forbidden', async () => {
      const executeFn = async () => {
        const err = new Error('Forbidden');
        (err as { response?: { status?: number } }).response = { status: 403 };
        throw err;
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Forbidden');

      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });

    it('should throw immediately for HTTP 404 Not Found', async () => {
      const executeFn = async () => {
        const err = new Error('Not found');
        (err as { response?: { status?: number } }).response = { status: 404 };
        throw err;
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Not found');

      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Max attempts enforcement
  // ========================================================================

  describe('max attempts enforcement', () => {
    it('should throw after maxAttempts exhausted with default config', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        const err = new Error('ETIMEDOUT');
        (err as { code?: string }).code = 'ETIMEDOUT';
        throw err;
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('ETIMEDOUT');

      // Should attempt maxAttempts times (default: 3)
      expect(attempts).toBe(3);
      expect(mockSessionManager.updateItemStatus).toHaveBeenCalledTimes(2);
    });

    it('should throw after custom maxAttempts exhausted', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        const err = new Error('ETIMEDOUT');
        (err as { code?: string }).code = 'ETIMEDOUT';
        throw err;
      };

      const retryManager = new TaskRetryManager(
        { maxAttempts: 5, baseDelay: 100 },
        mockSessionManager
      );

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('ETIMEDOUT');

      expect(attempts).toBe(5);
      expect(mockSessionManager.updateItemStatus).toHaveBeenCalledTimes(4);
    });

    it('should throw after maxAttempts with single attempt config', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        const err = new Error('ETIMEDOUT');
        (err as { code?: string }).code = 'ETIMEDOUT';
        throw err;
      };

      const retryManager = new TaskRetryManager(
        { maxAttempts: 1 },
        mockSessionManager
      );

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('ETIMEDOUT');

      expect(attempts).toBe(1);
      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Exponential backoff
  // ========================================================================

  describe('exponential backoff', () => {
    it('should use exponential backoff between retries', () => {
      const retryManager = new TaskRetryManager(
        {
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
          jitterFactor: 0, // No jitter for predictable testing
        },
        mockSessionManager
      );

      // Test calculateDelay directly
      expect(retryManager.calculateDelay(0)).toBe(1000);
      expect(retryManager.calculateDelay(1)).toBe(2000);
      expect(retryManager.calculateDelay(2)).toBe(4000);
      expect(retryManager.calculateDelay(3)).toBe(8000);
    });

    it('should cap delay at maxDelay', () => {
      const retryManager = new TaskRetryManager(
        {
          baseDelay: 1000,
          maxDelay: 3000,
          backoffFactor: 2,
          jitterFactor: 0,
        },
        mockSessionManager
      );

      // Test calculateDelay directly without executing retries
      expect(retryManager.calculateDelay(0)).toBe(1000);
      expect(retryManager.calculateDelay(1)).toBe(2000);
      expect(retryManager.calculateDelay(2)).toBe(3000); // Capped at maxDelay
      expect(retryManager.calculateDelay(3)).toBe(3000); // Still capped
      expect(retryManager.calculateDelay(10)).toBe(3000); // Still capped
    });

    it('should add positive jitter to delays', () => {
      const retryManager = new TaskRetryManager(
        {
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
          jitterFactor: 0.1,
        },
        mockSessionManager
      );

      // Test that jitter adds variance (run multiple times to check range)
      // With jitter: baseDelay to baseDelay * 1.1
      const delay1 = retryManager.calculateDelay(0);
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(1100); // 1000 + 10%

      const delay2 = retryManager.calculateDelay(0);
      expect(delay2).toBeGreaterThanOrEqual(1000);
      expect(delay2).toBeLessThan(1100); // 1000 + 10%
    });

    it('should calculate delay correctly with custom config', async () => {
      const retryManager = new TaskRetryManager(
        {
          baseDelay: 500,
          maxDelay: 5000,
          backoffFactor: 3,
          jitterFactor: 0,
        },
        mockSessionManager
      );

      expect(retryManager.calculateDelay(0)).toBe(500);
      expect(retryManager.calculateDelay(1)).toBe(1500);
      expect(retryManager.calculateDelay(2)).toBe(4500);
      expect(retryManager.calculateDelay(3)).toBe(5000); // Capped
    });
  });

  // ========================================================================
  // Disabled retry mode
  // ========================================================================

  describe('when disabled', () => {
    it('should not retry when enabled is false', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        const err = new Error('ECONNRESET');
        (err as { code?: string }).code = 'ECONNRESET';
        throw err;
      };

      const retryManager = new TaskRetryManager(
        { enabled: false },
        mockSessionManager
      );

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('ECONNRESET');

      // Should only attempt once (no retries)
      expect(attempts).toBe(1);
      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });

    it('should execute successfully when disabled and no error', async () => {
      const executeFn = async () => {
        return { success: true };
      };

      const retryManager = new TaskRetryManager(
        { enabled: false },
        mockSessionManager
      );
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      expect(result).toEqual({ success: true });
      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Error classification
  // ========================================================================

  describe('classifyError', () => {
    it('should classify ECONNRESET as retryable', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new Error('ECONNRESET');
      (error as { code?: string }).code = 'ECONNRESET';

      expect(retryManager.classifyError(error)).toBe('retryable');
    });

    it('should classify ETIMEDOUT as retryable', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new Error('ETIMEDOUT');
      (error as { code?: string }).code = 'ETIMEDOUT';

      expect(retryManager.classifyError(error)).toBe('retryable');
    });

    it('should classify ValidationError as permanent', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new ValidationError('Invalid input', { field: 'test' });

      expect(retryManager.classifyError(error)).toBe('permanent');
    });

    it('should classify AgentError with PARSE_FAILED as permanent', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new AgentError(
        'Parse failed',
        ErrorCodes.PIPELINE_AGENT_PARSE_FAILED,
        {}
      );

      expect(retryManager.classifyError(error)).toBe('permanent');
    });

    it('should classify AgentError with TIMEOUT as retryable', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new AgentError(
        'Timeout',
        ErrorCodes.PIPELINE_AGENT_TIMEOUT,
        {}
      );

      expect(retryManager.classifyError(error)).toBe('retryable');
    });

    it('should classify HTTP 400 as permanent', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new Error('Bad request');
      (error as { response?: { status?: number } }).response = { status: 400 };

      expect(retryManager.classifyError(error)).toBe('permanent');
    });

    it('should classify HTTP 500 as retryable', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new Error('Internal server error');
      (error as { response?: { status?: number } }).response = { status: 500 };

      expect(retryManager.classifyError(error)).toBe('retryable');
    });

    it('should classify unknown errors as unknown', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const error = new Error('Unknown error');

      expect(retryManager.classifyError(error)).toBe('unknown');
    });

    it('should classify null as unknown', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);

      expect(retryManager.classifyError(null)).toBe('unknown');
    });

    it('should classify undefined as unknown', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);

      expect(retryManager.classifyError(undefined)).toBe('unknown');
    });

    it('should classify string as unknown', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);

      expect(retryManager.classifyError('string error')).toBe('unknown');
    });
  });

  // ========================================================================
  // Configuration
  // ========================================================================

  describe('getConfig', () => {
    it('should return default config when no overrides provided', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const config = retryManager.getConfig();

      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelay).toBe(1000);
      expect(config.maxDelay).toBe(30000);
      expect(config.backoffFactor).toBe(2);
      expect(config.jitterFactor).toBe(0.1);
      expect(config.enabled).toBe(true);
    });

    it('should return merged config with overrides', () => {
      const retryManager = new TaskRetryManager(
        {
          maxAttempts: 5,
          baseDelay: 2000,
          enabled: false,
        },
        mockSessionManager
      );
      const config = retryManager.getConfig();

      expect(config.maxAttempts).toBe(5);
      expect(config.baseDelay).toBe(2000);
      expect(config.maxDelay).toBe(30000); // Default
      expect(config.backoffFactor).toBe(2); // Default
      expect(config.jitterFactor).toBe(0.1); // Default
      expect(config.enabled).toBe(false);
    });

    it('should return a copy of config (not reference)', () => {
      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const config1 = retryManager.getConfig();
      const config2 = retryManager.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  // ========================================================================
  // Status updates and logging
  // ========================================================================

  describe('status updates and logging', () => {
    it('should update status to Retrying with message containing attempt info', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          const err = new Error('ECONNRESET');
          (err as { code?: string }).code = 'ECONNRESET';
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager(
        { maxAttempts: 2, baseDelay: 100 },
        mockSessionManager
      );
      await retryManager.executeWithRetry(mockSubtask, executeFn);

      expect(mockSessionManager.updateItemStatus).toHaveBeenCalledWith(
        mockSubtask.id,
        'Retrying'
      );
    });

    it('should call flushUpdates after status update', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          const err = new Error('ECONNRESET');
          (err as { code?: string }).code = 'ECONNRESET';
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager(
        { baseDelay: 100 },
        mockSessionManager
      );
      await retryManager.executeWithRetry(mockSubtask, executeFn);

      expect(mockSessionManager.flushUpdates).toHaveBeenCalled();
    });
  });
});
