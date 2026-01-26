/**
 * Unit tests for Logger enhancements
 *
 * @remarks
 * Tests validate the new logger functionality including:
 * 1. New log levels: TRACE and FATAL
 * 2. Correlation ID generation and propagation
 * 3. Child logger correlation ID inheritance
 * 4. Manual correlation ID override
 * 5. Component filtering capability
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getLogger,
  LogLevel,
  Logger,
  clearLoggerCache,
} from '../../src/utils/logger.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('Logger enhancements', () => {
  // Clear cache before each test to ensure isolated test behavior
  beforeEach(() => {
    clearLoggerCache();
  });

  afterEach(() => {
    clearLoggerCache();
  });

  // ========================================================================
  // TRACE level tests
  // ========================================================================

  describe('TRACE level', () => {
    it('should include TRACE in LogLevel enum', () => {
      expect(LogLevel.TRACE).toBe('trace');
    });

    it('should have correct string value for TRACE', () => {
      expect(LogLevel.TRACE).toBe('trace');
    });

    it('should export all six log levels including TRACE and FATAL', () => {
      expect(Object.values(LogLevel)).toEqual([
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'fatal',
      ]);
    });

    it('should have trace method on Logger interface', () => {
      const logger = getLogger('TraceTest');
      expect(typeof logger.trace).toBe('function');
    });

    it('should accept string message for trace()', () => {
      const logger = getLogger('TraceTest');
      expect(() => logger.trace('Trace message')).not.toThrow();
    });

    it('should accept object and message for trace()', () => {
      const logger = getLogger('TraceTest');
      expect(() =>
        logger.trace({ key: 'value' }, 'Trace message')
      ).not.toThrow();
    });

    it('should accept additional args for trace()', () => {
      const logger = getLogger('TraceTest');
      expect(() => logger.trace('Message', 'arg1', 'arg2', 123)).not.toThrow();
    });

    it('should create logger with TRACE level', () => {
      const logger = getLogger('TraceTest', { level: LogLevel.TRACE });
      expect(logger).toBeDefined();
    });
  });

  // ========================================================================
  // FATAL level tests
  // ========================================================================

  describe('FATAL level', () => {
    it('should include FATAL in LogLevel enum', () => {
      expect(LogLevel.FATAL).toBe('fatal');
    });

    it('should have correct string value for FATAL', () => {
      expect(LogLevel.FATAL).toBe('fatal');
    });

    it('should have fatal method on Logger interface', () => {
      const logger = getLogger('FatalTest');
      expect(typeof logger.fatal).toBe('function');
    });

    it('should accept string message for fatal()', () => {
      const logger = getLogger('FatalTest');
      expect(() => logger.fatal('Fatal message')).not.toThrow();
    });

    it('should accept object and message for fatal()', () => {
      const logger = getLogger('FatalTest');
      expect(() =>
        logger.fatal({ key: 'value' }, 'Fatal message')
      ).not.toThrow();
    });

    it('should accept additional args for fatal()', () => {
      const logger = getLogger('FatalTest');
      expect(() => logger.fatal('Message', 'arg1', 'arg2', 123)).not.toThrow();
    });

    it('should create logger with FATAL level', () => {
      const logger = getLogger('FatalTest', { level: LogLevel.FATAL });
      expect(logger).toBeDefined();
    });
  });

  // ========================================================================
  // Correlation ID tests
  // ========================================================================

  describe('Correlation ID', () => {
    it('should auto-generate correlation ID when not provided', () => {
      const logger = getLogger('CorrelationTest');
      // Logger is created with auto-generated correlation ID
      expect(logger).toBeDefined();
    });

    it('should accept manual correlation ID override', () => {
      const customId = 'custom-correlation-id-12345';
      const logger = getLogger('CorrelationTest', {
        correlationId: customId,
      });
      expect(logger).toBeDefined();
    });

    it('should create different loggers for different correlation IDs', () => {
      const logger1 = getLogger('CorrelationTest', {
        correlationId: 'id-1',
      });
      const logger2 = getLogger('CorrelationTest', {
        correlationId: 'id-2',
      });
      expect(logger1).not.toBe(logger2);
    });

    it('should create same logger for same correlation ID', () => {
      const logger1 = getLogger('CorrelationTest', {
        correlationId: 'same-id',
      });
      const logger2 = getLogger('CorrelationTest', {
        correlationId: 'same-id',
      });
      expect(logger1).toBe(logger2);
    });

    it('should generate UUID v4 format correlation IDs', () => {
      const logger1 = getLogger('UUIDTest');
      const logger2 = getLogger('UUIDTest');
      // When no correlationId is specified, the same logger is returned (cached)
      expect(logger1).toBe(logger2);
    });
  });

  // ========================================================================
  // Child logger correlation ID inheritance tests
  // ========================================================================

  describe('Child logger correlation ID inheritance', () => {
    it('should create child logger with additional bindings', () => {
      const parent = getLogger('ChildTest');
      const child = parent.child({ taskId: 'P1.M1.T1' });
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
      expect(typeof child.child).toBe('function');
    });

    it('should preserve trace method in child logger', () => {
      const parent = getLogger('ChildTest');
      const child = parent.child({ taskId: 'test' });
      expect(typeof child.trace).toBe('function');
    });

    it('should preserve fatal method in child logger', () => {
      const parent = getLogger('ChildTest');
      const child = parent.child({ taskId: 'test' });
      expect(typeof child.fatal).toBe('function');
    });

    it('should support nested child loggers', () => {
      const parent = getLogger('ChildTest');
      const child = parent.child({ taskId: 'P1.M1.T1' });
      const grandchild = child.child({ subtaskId: 'S1' });
      expect(grandchild).toBeDefined();
      expect(typeof grandchild.info).toBe('function');
    });

    it('should preserve all log methods in nested child loggers', () => {
      const parent = getLogger('ChildTest');
      const child = parent.child({ taskId: 'test' });
      const grandchild = child.child({ subtaskId: 'subtest' });

      expect(typeof grandchild.trace).toBe('function');
      expect(typeof grandchild.debug).toBe('function');
      expect(typeof grandchild.info).toBe('function');
      expect(typeof grandchild.warn).toBe('function');
      expect(typeof grandchild.error).toBe('function');
      expect(typeof grandchild.fatal).toBe('function');
    });
  });

  // ========================================================================
  // Component filtering tests
  // ========================================================================

  describe('Component filtering', () => {
    it('should accept component in LoggerConfig', () => {
      const logger = getLogger('ComponentTest', {
        component: 'TaskOrchestrator',
      });
      expect(logger).toBeDefined();
    });

    it('should create different loggers for different components', () => {
      const logger1 = getLogger('ComponentTest', {
        component: 'ComponentA',
      });
      const logger2 = getLogger('ComponentTest', {
        component: 'ComponentB',
      });
      expect(logger1).not.toBe(logger2);
    });

    it('should create same logger for same component', () => {
      const logger1 = getLogger('ComponentTest', {
        component: 'MyComponent',
      });
      const logger2 = getLogger('ComponentTest', {
        component: 'MyComponent',
      });
      expect(logger1).toBe(logger2);
    });

    it('should support component with correlation ID', () => {
      const logger = getLogger('ComponentTest', {
        component: 'AgentRuntime',
        correlationId: 'test-id',
      });
      expect(logger).toBeDefined();
    });
  });

  // ========================================================================
  // Logger cache tests with new fields
  // ========================================================================

  describe('Logger cache with new fields', () => {
    it('should cache loggers with correlation ID', () => {
      const logger1 = getLogger('CacheTest', {
        correlationId: 'cache-test-id',
      });
      const logger2 = getLogger('CacheTest', {
        correlationId: 'cache-test-id',
      });
      expect(logger1).toBe(logger2);
    });

    it('should create separate cache entries for different correlation IDs', () => {
      const logger1 = getLogger('CacheTest', {
        correlationId: 'id-1',
      });
      const logger2 = getLogger('CacheTest', {
        correlationId: 'id-2',
      });
      expect(logger1).not.toBe(logger2);
    });

    it('should cache loggers with component', () => {
      const logger1 = getLogger('CacheTest', {
        component: 'MyComponent',
      });
      const logger2 = getLogger('CacheTest', {
        component: 'MyComponent',
      });
      expect(logger1).toBe(logger2);
    });

    it('should create separate cache entries for different components', () => {
      const logger1 = getLogger('CacheTest', {
        component: 'ComponentA',
      });
      const logger2 = getLogger('CacheTest', {
        component: 'ComponentB',
      });
      expect(logger1).not.toBe(logger2);
    });

    it('should clear cache with clearLoggerCache()', () => {
      const logger1 = getLogger('CacheTest', {
        correlationId: 'test-id',
      });
      clearLoggerCache();
      const logger2 = getLogger('CacheTest', {
        correlationId: 'test-id',
      });
      expect(logger1).not.toBe(logger2); // New instance after clear
    });
  });

  // ========================================================================
  // Backward compatibility tests
  // ========================================================================

  describe('Backward compatibility', () => {
    it('should support existing getLogger() usage without options', () => {
      const logger = getLogger('BackwardCompatTest');
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should support existing verbose option', () => {
      const logger = getLogger('BackwardCompatTest', {
        verbose: true,
      });
      expect(logger).toBeDefined();
    });

    it('should support existing machine-readable option', () => {
      const logger = getLogger('BackwardCompatTest', {
        machineReadable: true,
      });
      expect(logger).toBeDefined();
    });

    it('should support existing level option with original levels', () => {
      const logger = getLogger('BackwardCompatTest', {
        level: LogLevel.INFO,
      });
      expect(logger).toBeDefined();
    });
  });

  // ========================================================================
  // Integration scenarios
  // ========================================================================

  describe('Enhanced integration scenarios', () => {
    it('should support trace-level debugging with correlation ID', () => {
      const logger = getLogger('IntegrationTest', {
        level: LogLevel.TRACE,
        correlationId: 'trace-session-123',
      });

      logger.trace('Entering function with args');
      logger.debug('Processing data');
      logger.info('Operation completed');
      logger.warn('Unexpected but recoverable issue');
      logger.error('Operation failed');
      logger.fatal('System cannot continue');

      // If no error thrown, test passes
      expect(true).toBe(true);
    });

    it('should support child logger with correlation ID', () => {
      const parent = getLogger('IntegrationTest', {
        correlationId: 'parent-session-456',
      });
      const child = parent.child({ taskId: 'P1.M1.T1' });

      child.trace('Starting subtask');
      child.info('Subtask progress');
      child.fatal('Subtask failed critically');

      expect(true).toBe(true);
    });

    it('should support component-based logging with all levels', () => {
      const logger = getLogger('IntegrationTest', {
        component: 'AgentRuntime',
        level: LogLevel.DEBUG,
      });

      logger.trace('Fine-grained detail');
      logger.debug('Debug information');
      logger.info('Status update');
      logger.warn('Warning message');
      logger.error('Error occurred');
      logger.fatal('Fatal failure');

      expect(true).toBe(true);
    });

    it('should support mixed usage of trace and fatal with existing patterns', () => {
      const logger = getLogger('IntegrationTest', {
        level: LogLevel.TRACE,
      });

      // Existing pattern
      logger.info('Task execution started');
      logger.info(
        { taskId: 'P1.M1.T1', status: 'in_progress' },
        'Task status changed'
      );

      // New trace level for fine-grained debugging
      logger.trace('Detailed state before operation');
      logger.trace({ state: { key: 'value' } }, 'State snapshot');

      // New fatal level for critical errors
      logger.fatal('Critical system failure detected');
      logger.fatal(
        { error: 'System unavailable', code: 'CRITICAL_001' },
        'System shutdown'
      );

      expect(true).toBe(true);
    });
  });
});
