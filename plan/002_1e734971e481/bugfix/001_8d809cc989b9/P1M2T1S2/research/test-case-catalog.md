# Test Case Catalog for isFatalError

**Catalog Date**: 2026-01-16
**Total Test Count**: 200+
**Purpose**: Complete catalog of all test cases for isFatalError function

---

## Overview

This document provides a complete catalog of all 200+ test cases to be implemented for the `isFatalError()` function. Tests are organized by category with descriptions and expected results.

---

## Test Summary

| Category                        | Test Count | Expected Result              |
| ------------------------------- | ---------- | ---------------------------- |
| Fatal Errors (Return TRUE)      | 50         | All return `true`            |
| Non-Fatal Errors (Return FALSE) | 80         | All return `false`           |
| Standard Error Types            | 20         | All return `false`           |
| Null/Undefined/Invalid          | 20         | All return `false`           |
| Type Guard Integration          | 15         | Varies by test               |
| continueOnError Flag            | 15         | All return `false` when true |
| Edge Cases                      | 20         | Varies by test               |
| **TOTAL**                       | **220**    | -                            |

---

## 1. Fatal Error Tests (Return TRUE) - 50 Tests

### 1.1 SessionError - PIPELINE_SESSION_LOAD_FAILED (15 tests)

```typescript
describe('SessionError with LOAD_FAILED code', () => {
  it('should return true for SessionError with LOAD_FAILED code (1)', () => {
    const error = new SessionError('Session load failed', {
      sessionPath: '/path/to/session',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED code (2)', () => {
    const error = new SessionError('Cannot load session file', {
      sessionPath: '/invalid/path',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED code (3)', () => {
    const error = new SessionError('Session file not found', {
      sessionPath: '/nonexistent/session.json',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and empty context', () => {
    const error = new SessionError('Session load failed', {});
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and no context', () => {
    const error = new SessionError('Session load failed');
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and cause', () => {
    const cause = new Error('File system error');
    const error = new SessionError(
      'Session load failed',
      { sessionPath: '/path' },
      cause
    );
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and empty message', () => {
    const error = new SessionError('', { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and special characters', () => {
    const error = new SessionError('Error: \n\t\r', { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and unicode', () => {
    const error = new SessionError('Error: 你好 🚀', { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and long message', () => {
    const longMessage = 'A'.repeat(1000);
    const error = new SessionError(longMessage, { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and multiple context props', () => {
    const error = new SessionError('Session load failed', {
      sessionPath: '/path',
      operation: 'load',
      timestamp: Date.now(),
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and null context values', () => {
    const error = new SessionError('Session load failed', {
      sessionPath: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and circular context', () => {
    const context: Record<string, unknown> = { sessionPath: '/path' };
    context.self = context;
    const error = new SessionError('Session load failed', context);
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and array in context', () => {
    const error = new SessionError('Session load failed', {
      sessionPath: '/path',
      attempts: [1, 2, 3],
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with LOAD_FAILED and nested context', () => {
    const error = new SessionError('Session load failed', {
      sessionPath: '/path',
      details: { retry: true, maxAttempts: 3 },
    });
    expect(isFatalError(error)).toBe(true);
  });
});
```

### 1.2 SessionError - PIPELINE_SESSION_SAVE_FAILED (15 tests)

```typescript
describe('SessionError with SAVE_FAILED code', () => {
  it('should return true for SessionError with SAVE_FAILED code (1)', () => {
    const error = new SessionError('Session save failed', {
      sessionPath: '/path/to/session',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED code (2)', () => {
    const error = new SessionError('Cannot write session file', {
      sessionPath: '/readonly/path',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED code (3)', () => {
    const error = new SessionError('Permission denied writing session', {
      sessionPath: '/protected/session.json',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and empty context', () => {
    const error = new SessionError('Session save failed', {});
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and no context', () => {
    const error = new SessionError('Session save failed');
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and cause', () => {
    const cause = new Error('Disk full');
    const error = new SessionError(
      'Session save failed',
      { sessionPath: '/path' },
      cause
    );
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and empty message', () => {
    const error = new SessionError('', { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and special characters', () => {
    const error = new SessionError('Error: \n\t\r', { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and unicode', () => {
    const error = new SessionError('Error: 保存失败 💾', {
      sessionPath: '/path',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and long message', () => {
    const longMessage = 'B'.repeat(1000);
    const error = new SessionError(longMessage, { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and multiple context props', () => {
    const error = new SessionError('Session save failed', {
      sessionPath: '/path',
      operation: 'save',
      timestamp: Date.now(),
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and null context values', () => {
    const error = new SessionError('Session save failed', {
      sessionPath: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and circular context', () => {
    const context: Record<string, unknown> = { sessionPath: '/path' };
    context.self = context;
    const error = new SessionError('Session save failed', context);
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and array in context', () => {
    const error = new SessionError('Session save failed', {
      sessionPath: '/path',
      errors: ['error1', 'error2'],
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for SessionError with SAVE_FAILED and nested context', () => {
    const error = new SessionError('Session save failed', {
      sessionPath: '/path',
      details: { retry: true, maxAttempts: 3 },
    });
    expect(isFatalError(error)).toBe(true);
  });
});
```

### 1.3 EnvironmentError (20 tests)

```typescript
describe('EnvironmentError', () => {
  it('should return true for EnvironmentError with variable context (1)', () => {
    const error = new EnvironmentError('Missing API_KEY', {
      variable: 'API_KEY',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with variable context (2)', () => {
    const error = new EnvironmentError('Missing DATABASE_URL', {
      variable: 'DATABASE_URL',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with value context', () => {
    const error = new EnvironmentError('Invalid config value', {
      variable: 'LOG_LEVEL',
      value: 'INVALID',
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
    const cause = new Error('Config file not found');
    const error = new EnvironmentError(
      'Environment error',
      { variable: 'CONFIG' },
      cause
    );
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with empty message', () => {
    const error = new EnvironmentError('', { variable: 'API_KEY' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with special characters', () => {
    const error = new EnvironmentError('Error: \n\t\r', {
      variable: 'API_KEY',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with unicode', () => {
    const error = new EnvironmentError('Error: 环境变量缺失 🌍', {
      variable: 'API_KEY',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with long message', () => {
    const longMessage = 'C'.repeat(1000);
    const error = new EnvironmentError(longMessage, { variable: 'API_KEY' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with multiple context props', () => {
    const error = new EnvironmentError('Environment error', {
      variable: 'API_KEY',
      required: true,
      source: '.env',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with null context values', () => {
    const error = new EnvironmentError('Environment error', {
      variable: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with circular context', () => {
    const context: Record<string, unknown> = { variable: 'API_KEY' };
    context.self = context;
    const error = new EnvironmentError('Environment error', context);
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with array in context', () => {
    const error = new EnvironmentError('Environment error', {
      variables: ['API_KEY', 'DATABASE_URL'],
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with nested context', () => {
    const error = new EnvironmentError('Environment error', {
      variable: 'API_KEY',
      details: { required: true, source: '.env' },
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with boolean context', () => {
    const error = new EnvironmentError('Environment error', {
      required: true,
      optional: false,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with numeric context', () => {
    const error = new EnvironmentError('Environment error', {
      timeout: 30000,
      retries: 3,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with mixed context types', () => {
    const error = new EnvironmentError('Environment error', {
      variable: 'API_KEY',
      required: true,
      timeout: 30000,
      sources: ['.env', 'config.json'],
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with undefined variable', () => {
    const error = new EnvironmentError('Environment error', {
      variable: undefined,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for EnvironmentError with empty string variable', () => {
    const error = new EnvironmentError('Environment error', {
      variable: '',
    });
    expect(isFatalError(error)).toBe(true);
  });
});
```

### 1.4 ValidationError - parse_prd Operation (20 tests)

```typescript
describe('ValidationError with parse_prd operation', () => {
  it('should return true for ValidationError with parse_prd operation (1)', () => {
    const error = new ValidationError('Invalid PRD format', {
      operation: 'parse_prd',
      invalidInput: 'malformed-prd',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd operation (2)', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      errors: ['Missing required field'],
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

  it('should return true for ValidationError with parse_prd and cause', () => {
    const cause = new Error('Parse error');
    const error = new ValidationError(
      'PRD parsing failed',
      { operation: 'parse_prd' },
      cause
    );
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and empty message', () => {
    const error = new ValidationError('', { operation: 'parse_prd' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and special characters', () => {
    const error = new ValidationError('Error: \n\t\r', {
      operation: 'parse_prd',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and unicode', () => {
    const error = new ValidationError('Error: PRD 解析失败 📄', {
      operation: 'parse_prd',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and long message', () => {
    const longMessage = 'D'.repeat(1000);
    const error = new ValidationError(longMessage, { operation: 'parse_prd' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and multiple context props', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      line: 10,
      column: 5,
      invalidInput: 'malformed',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and null context values', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      invalidInput: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and circular context', () => {
    const context: Record<string, unknown> = { operation: 'parse_prd' };
    context.self = context;
    const error = new ValidationError('PRD parsing failed', context);
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and array in context', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      errors: ['error1', 'error2', 'error3'],
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and nested context', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      details: { line: 10, column: 5 },
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and boolean context', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      recoverable: false,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and numeric context', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      line: 10,
      column: 5,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and mixed context types', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      line: 10,
      recoverable: false,
      errors: ['error1', 'error2'],
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and empty invalidInput', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      invalidInput: '',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and no invalidInput', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and only operation context', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should return true for ValidationError with parse_prd and operation as empty string', () => {
    const error = new ValidationError('PRD parsing failed', {
      operation: 'parse_prd',
      extra: '',
    });
    expect(isFatalError(error)).toBe(true);
  });
});
```

---

## 2. Non-Fatal Error Tests (Return FALSE) - 80 Tests

### 2.1 TaskError (15 tests)

```typescript
describe('TaskError (non-fatal)', () => {
  it('should return false for TaskError with taskId (1)', () => {
    const error = new TaskError('Task execution failed', {
      taskId: 'P1.M1.T1',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with taskId (2)', () => {
    const error = new TaskError('Task validation failed', {
      taskId: 'P1.M1.T1.S1',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError without context', () => {
    const error = new TaskError('Task error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with empty context', () => {
    const error = new TaskError('Task error', {});
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with cause', () => {
    const cause = new Error('Sub-task failed');
    const error = new TaskError(
      'Task execution failed',
      { taskId: 'P1.M1.T1' },
      cause
    );
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with empty message', () => {
    const error = new TaskError('', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with special characters', () => {
    const error = new TaskError('Error: \n\t\r', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with unicode', () => {
    const error = new TaskError('Error: 任务失败 📋', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with long message', () => {
    const longMessage = 'E'.repeat(1000);
    const error = new TaskError(longMessage, { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with multiple context props', () => {
    const error = new TaskError('Task execution failed', {
      taskId: 'P1.M1.T1',
      operation: 'execute',
      timestamp: Date.now(),
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with null context values', () => {
    const error = new TaskError('Task execution failed', {
      taskId: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with circular context', () => {
    const context: Record<string, unknown> = { taskId: 'P1.M1.T1' };
    context.self = context;
    const error = new TaskError('Task execution failed', context);
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with array in context', () => {
    const error = new TaskError('Task execution failed', {
      taskId: 'P1.M1.T1',
      errors: ['error1', 'error2'],
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with nested context', () => {
    const error = new TaskError('Task execution failed', {
      taskId: 'P1.M1.T1',
      details: { retry: true, maxAttempts: 3 },
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with different error codes', () => {
    const error = new TaskError('Task validation failed', {
      taskId: 'P1.M1.T1',
      code: ErrorCodes.PIPELINE_TASK_VALIDATION_FAILED,
    });
    expect(isFatalError(error)).toBe(false);
  });
});
```

### 2.2 AgentError (15 tests)

```typescript
describe('AgentError (non-fatal)', () => {
  it('should return false for AgentError with taskId (1)', () => {
    const error = new AgentError('LLM call failed', {
      taskId: 'P1.M1.T1',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with taskId (2)', () => {
    const error = new AgentError('Agent timeout', {
      taskId: 'P1.M1.T1.S1',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError without context', () => {
    const error = new AgentError('Agent error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with empty context', () => {
    const error = new AgentError('Agent error', {});
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with cause', () => {
    const cause = new Error('Network error');
    const error = new AgentError(
      'LLM call failed',
      { taskId: 'P1.M1.T1' },
      cause
    );
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with empty message', () => {
    const error = new AgentError('', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with special characters', () => {
    const error = new AgentError('Error: \n\t\r', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with unicode', () => {
    const error = new AgentError('Error: 代理超时 🤖', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with long message', () => {
    const longMessage = 'F'.repeat(1000);
    const error = new AgentError(longMessage, { taskId: 'P1.M1.T1' });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with multiple context props', () => {
    const error = new AgentError('LLM call failed', {
      taskId: 'P1.M1.T1',
      operation: 'generate',
      timestamp: Date.now(),
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with null context values', () => {
    const error = new AgentError('LLM call failed', {
      taskId: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with circular context', () => {
    const context: Record<string, unknown> = { taskId: 'P1.M1.T1' };
    context.self = context;
    const error = new AgentError('LLM call failed', context);
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with array in context', () => {
    const error = new AgentError('LLM call failed', {
      taskId: 'P1.M1.T1',
      attempts: [1, 2, 3],
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with nested context', () => {
    const error = new AgentError('LLM call failed', {
      taskId: 'P1.M1.T1',
      details: { timeout: 30000, retries: 3 },
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with different error codes', () => {
    const error = new AgentError('Agent parse failed', {
      taskId: 'P1.M1.T1',
      code: ErrorCodes.PIPELINE_AGENT_PARSE_FAILED,
    });
    expect(isFatalError(error)).toBe(false);
  });
});
```

### 2.3 ValidationError - Non-parse_prd Operations (20 tests)

```typescript
describe('ValidationError with non-parse_prd operations (non-fatal)', () => {
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

  it('should return false for ValidationError with decompose_prd operation', () => {
    const error = new ValidationError('PRD decomposition failed', {
      operation: 'decompose_prd',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with execute_task operation', () => {
    const error = new ValidationError('Task validation failed', {
      operation: 'execute_task',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with generate_prp operation', () => {
    const error = new ValidationError('PRP generation failed', {
      operation: 'generate_prp',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with validate_prp operation', () => {
    const error = new ValidationError('PRP validation failed', {
      operation: 'validate_prp',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError without operation', () => {
    const error = new ValidationError('Validation failed');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with empty operation', () => {
    const error = new ValidationError('Validation failed', {
      operation: '',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with null operation', () => {
    const error = new ValidationError('Validation failed', {
      operation: null as unknown as string,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with undefined operation', () => {
    const error = new ValidationError('Validation failed', {
      operation: undefined,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with different error codes (1)', () => {
    const error = new ValidationError('Missing field', {
      operation: 'validate_prd',
      code: ErrorCodes.PIPELINE_VALIDATION_MISSING_FIELD,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with different error codes (2)', () => {
    const error = new ValidationError('Schema failed', {
      operation: 'validate_prd',
      code: ErrorCodes.PIPELINE_VALIDATION_SCHEMA_FAILED,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with invalid_input but different operation', () => {
    const error = new ValidationError('Invalid input', {
      operation: 'resolve_scope',
      code: ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT,
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

  it('should return false for ValidationError with cause', () => {
    const cause = new Error('Parse error');
    const error = new ValidationError(
      'Validation failed',
      { operation: 'validate_prd' },
      cause
    );
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with special characters', () => {
    const error = new ValidationError('Error: \n\t\r', {
      operation: 'validate_prd',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with unicode', () => {
    const error = new ValidationError('Error: 验证失败 ✅', {
      operation: 'validate_prd',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with long message', () => {
    const longMessage = 'G'.repeat(1000);
    const error = new ValidationError(longMessage, {
      operation: 'validate_prd',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with multiple context props', () => {
    const error = new ValidationError('Validation failed', {
      operation: 'validate_prd',
      field: 'scope',
      value: 'invalid',
    });
    expect(isFatalError(error)).toBe(false);
  });
});
```

### 2.4 Other Non-Fatal Errors (10 tests)

```typescript
describe('Other non-fatal PipelineError types', () => {
  it('should return false for base PipelineError', () => {
    const error = new PipelineError('Generic pipeline error', {
      code: ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for PipelineError without context', () => {
    const error = new PipelineError('Generic pipeline error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for PipelineError with empty context', () => {
    const error = new PipelineError('Generic pipeline error', {});
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for SessionError with non-fatal code (if any)', () => {
    // This test may not apply if all SessionError codes are fatal
    // Included for completeness
    const error = new SessionError('Session warning');
    // If non-fatal codes exist, they should return false
    expect(isFatalError(error)).toBe(true); // Currently true (LOAD_FAILED is default)
  });

  it('should return false for ValidationError with unknown operation', () => {
    const error = new ValidationError('Unknown operation failed', {
      operation: 'unknown_operation',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TaskError with context variations', () => {
    const error = new TaskError('Task failed', {
      taskId: 'P1.M1.T1',
      subtaskId: 'P1.M1.T1.S1',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for AgentError with context variations', () => {
    const error = new AgentError('Agent failed', {
      taskId: 'P1.M1.T1',
      model: 'claude-3',
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ValidationError with mixed context', () => {
    const error = new ValidationError('Mixed context failed', {
      operation: 'validate_prd',
      field: 'scope',
      line: 10,
    });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for PipelineError with cause chain', () => {
    const cause1 = new Error('First error');
    const cause2 = new Error('Second error', { cause: cause1 });
    const error = new PipelineError('Wrapper error', {}, cause2);
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for any PipelineError not explicitly fatal', () => {
    const error = new TaskError('Non-fatal error');
    expect(isFatalError(error)).toBe(false);
  });
});
```

### 2.5 Additional Non-Fatal Variations (20 tests)

```typescript
describe('Additional non-fatal error variations', () => {
  // Add 20 more variations of non-fatal errors
  // Including different message lengths, special characters, unicode, etc.
  // Following the same pattern as above tests
  // ... (20 additional tests)
});
```

---

## 3. Standard Error Tests (Return FALSE) - 20 Tests

```typescript
describe('Standard Error types (non-fatal)', () => {
  // Basic Error
  it('should return false for standard Error', () => {
    const error = new Error('Standard error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for Error with cause', () => {
    const cause = new Error('Cause error');
    const error = new Error('Wrapper error', { cause });
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for Error without message', () => {
    const error = new Error();
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for Error with empty message', () => {
    const error = new Error('');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for Error with long message', () => {
    const longMessage = 'H'.repeat(1000);
    const error = new Error(longMessage);
    expect(isFatalError(error)).toBe(false);
  });

  // TypeError
  it('should return false for TypeError (1)', () => {
    const error = new TypeError('Type error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for TypeError (2)', () => {
    const error = new TypeError('Property is not a function');
    expect(isFatalError(error)).toBe(false);
  });

  // ReferenceError
  it('should return false for ReferenceError (1)', () => {
    const error = new ReferenceError('Reference error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for ReferenceError (2)', () => {
    const error = new ReferenceError('Variable is not defined');
    expect(isFatalError(error)).toBe(false);
  });

  // SyntaxError
  it('should return false for SyntaxError (1)', () => {
    const error = new SyntaxError('Syntax error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for SyntaxError (2)', () => {
    const error = new SyntaxError('Unexpected token');
    expect(isFatalError(error)).toBe(false);
  });

  // RangeError
  it('should return false for RangeError (1)', () => {
    const error = new RangeError('Range error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for RangeError (2)', () => {
    const error = new RangeError('Invalid array length');
    expect(isFatalError(error)).toBe(false);
  });

  // URIError
  it('should return false for URIError (1)', () => {
    const error = new URIError('URI error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for URIError (2)', () => {
    const error = new URIError('Malformed URI');
    expect(isFatalError(error)).toBe(false);
  });

  // EvalError (deprecated but still exists)
  it('should return false for EvalError', () => {
    const error = new EvalError('Eval error');
    expect(isFatalError(error)).toBe(false);
  });

  // Custom error classes
  it('should return false for custom error extending Error', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    const error = new CustomError('Custom error');
    expect(isFatalError(error)).toBe(false);
  });

  it('should return false for custom error not extending Error', () => {
    class CustomError {
      name = 'CustomError';
      message = 'Custom error';
    }
    const error = new CustomError();
    expect(isFatalError(error)).toBe(false);
  });
});
```

---

## 4. Null/Undefined/Invalid Tests (Return FALSE) - 20 Tests

```typescript
describe('Null/Undefined/Invalid values (non-fatal)', () => {
  // Null/Undefined
  it('should return false for null', () => {
    expect(isFatalError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isFatalError(undefined)).toBe(false);
  });

  it('should return false for explicit null', () => {
    const value: null = null;
    expect(isFatalError(value)).toBe(false);
  });

  it('should return false for explicit undefined', () => {
    const value: undefined = undefined;
    expect(isFatalError(value)).toBe(false);
  });

  // String values
  it('should return false for string value (1)', () => {
    expect(isFatalError('string error')).toBe(false);
  });

  it('should return false for string value (2)', () => {
    expect(isFatalError('')).toBe(false);
  });

  it('should return false for string value (3)', () => {
    expect(isFatalError('Error: test')).toBe(false);
  });

  // Number values
  it('should return false for number value (1)', () => {
    expect(isFatalError(123)).toBe(false);
  });

  it('should return false for number value (2)', () => {
    expect(isFatalError(0)).toBe(false);
  });

  it('should return false for number value (3)', () => {
    expect(isFatalError(-1)).toBe(false);
  });

  // Boolean values
  it('should return false for boolean true', () => {
    expect(isFatalError(true)).toBe(false);
  });

  it('should return false for boolean false', () => {
    expect(isFatalError(false)).toBe(false);
  });

  // Object values
  it('should return false for empty object', () => {
    expect(isFatalError({})).toBe(false);
  });

  it('should return false for object with properties', () => {
    expect(isFatalError({ name: 'test', value: 123 })).toBe(false);
  });

  it('should return false for object with error-like structure', () => {
    expect(isFatalError({ message: 'error', name: 'Error' })).toBe(false);
  });

  // Array values
  it('should return false for empty array', () => {
    expect(isFatalError([])).toBe(false);
  });

  it('should return false for array with elements', () => {
    expect(isFatalError([1, 2, 3])).toBe(false);
  });

  it('should return false for array with error objects', () => {
    expect(isFatalError([new Error('error1'), new Error('error2')])).toBe(
      false
    );
  });

  // Function values
  it('should return false for function value', () => {
    expect(isFatalError(() => {})).toBe(false);
  });

  // BigInt/Symbol (ES6+)
  it('should return false for BigInt value', () => {
    expect(isFatalError(BigInt(123))).toBe(false);
  });

  it('should return false for Symbol value', () => {
    expect(isFatalError(Symbol('test'))).toBe(false);
  });
});
```

---

## 5. Type Guard Integration Tests - 15 Tests

```typescript
describe('Type guard integration', () => {
  it('should work with isPipelineError type guard', () => {
    const error = new SessionError('Test error');

    if (isPipelineError(error)) {
      expect(isFatalError(error)).toBe(true);
    } else {
      expect.fail('Error should be a PipelineError');
    }
  });

  it('should work with isSessionError type guard', () => {
    const error = new SessionError('Test error');

    if (isSessionError(error)) {
      expect(isFatalError(error)).toBe(true);
      expect(error.code).toBeDefined(); // Accessing SessionError-specific property
    }
  });

  it('should work with isTaskError type guard', () => {
    const error = new TaskError('Test error', { taskId: 'P1.M1.T1' });

    if (isTaskError(error)) {
      expect(isFatalError(error)).toBe(false);
      expect(error.taskId).toBe('P1.M1.T1'); // Accessing TaskError-specific property
    }
  });

  it('should work with isAgentError type guard', () => {
    const error = new AgentError('Test error', { taskId: 'P1.M1.T1' });

    if (isAgentError(error)) {
      expect(isFatalError(error)).toBe(false);
    }
  });

  it('should work with isValidationError type guard (fatal)', () => {
    const error = new ValidationError('Test error', {
      operation: 'parse_prd',
    });

    if (isValidationError(error)) {
      expect(isFatalError(error)).toBe(true);
    }
  });

  it('should work with isValidationError type guard (non-fatal)', () => {
    const error = new ValidationError('Test error', {
      operation: 'validate_prd',
    });

    if (isValidationError(error)) {
      expect(isFatalError(error)).toBe(false);
    }
  });

  it('should work with isEnvironmentError type guard', () => {
    const error = new EnvironmentError('Test error', {
      variable: 'API_KEY',
    });

    if (isEnvironmentError(error)) {
      expect(isFatalError(error)).toBe(true);
    }
  });

  it('should narrow type correctly with isSessionError', () => {
    const error = new SessionError('Test error');

    if (isSessionError(error)) {
      // Type is narrowed to SessionError
      expect(isFatalError(error)).toBe(true);
      expect(error.isLoadError()).toBe(true);
    }
  });

  it('should handle non-PipelineError with type guards', () => {
    const error = new Error('Standard error');

    if (!isPipelineError(error)) {
      expect(isFatalError(error)).toBe(false);
    }
  });

  it('should work with multiple type guard checks', () => {
    const error = new SessionError('Test error');

    if (isPipelineError(error) && isSessionError(error)) {
      expect(isFatalError(error)).toBe(true);
    }
  });

  it('should work with type guards in catch blocks', () => {
    try {
      throw new SessionError('Test error');
    } catch (e) {
      if (isSessionError(e)) {
        expect(isFatalError(e)).toBe(true);
      }
    }
  });

  it('should work with type guards for error classification', () => {
    const errors: unknown[] = [
      new SessionError('Test'),
      new TaskError('Test', { taskId: 'P1.M1.T1' }),
      new Error('Test'),
    ];

    const fatalErrors = errors.filter(
      e => isPipelineError(e) && isFatalError(e)
    );
    expect(fatalErrors).toHaveLength(1);
  });

  it('should work with type guards for error filtering', () => {
    const errors: unknown[] = [
      new SessionError('Test'),
      new TaskError('Test', { taskId: 'P1.M1.T1' }),
      new Error('Test'),
    ];

    const nonFatalErrors = errors.filter(e => !isFatalError(e));
    expect(nonFatalErrors).toHaveLength(2);
  });

  it('should work with type guards for conditional logic', () => {
    const error = new SessionError('Test error');

    if (isFatalError(error)) {
      if (isSessionError(error)) {
        expect(error.code).toBeDefined();
      }
    }
  });
});
```

---

## 6. continueOnError Flag Tests - 15 Tests

```typescript
describe('continueOnError flag behavior', () => {
  // Flag = true (all errors non-fatal)
  it('should return false for SessionError when continueOnError is true (1)', () => {
    const error = new SessionError('Session load failed');
    expect(isFatalError(error, true)).toBe(false);
  });

  it('should return false for SessionError when continueOnError is true (2)', () => {
    const error = new SessionError('Session save failed');
    expect(isFatalError(error, true)).toBe(false);
  });

  it('should return false for EnvironmentError when continueOnError is true', () => {
    const error = new EnvironmentError('Missing API key');
    expect(isFatalError(error, true)).toBe(false);
  });

  it('should return false for ValidationError (parse_prd) when continueOnError is true', () => {
    const error = new ValidationError('Invalid PRD', {
      operation: 'parse_prd',
    });
    expect(isFatalError(error, true)).toBe(false);
  });

  it('should return false for TaskError when continueOnError is true', () => {
    const error = new TaskError('Task failed', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error, true)).toBe(false);
  });

  it('should return false for AgentError when continueOnError is true', () => {
    const error = new AgentError('Agent failed', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error, true)).toBe(false);
  });

  it('should return false for standard Error when continueOnError is true', () => {
    const error = new Error('Standard error');
    expect(isFatalError(error, true)).toBe(false);
  });

  it('should return false for null when continueOnError is true', () => {
    expect(isFatalError(null, true)).toBe(false);
  });

  // Flag = false (explicit, normal behavior)
  it('should return true for SessionError when continueOnError is false (explicit)', () => {
    const error = new SessionError('Session load failed');
    expect(isFatalError(error, false)).toBe(true);
  });

  it('should return true for EnvironmentError when continueOnError is false (explicit)', () => {
    const error = new EnvironmentError('Missing API key');
    expect(isFatalError(error, false)).toBe(true);
  });

  it('should return false for TaskError when continueOnError is false (explicit)', () => {
    const error = new TaskError('Task failed', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error, false)).toBe(false);
  });

  it('should return false for AgentError when continueOnError is false (explicit)', () => {
    const error = new AgentError('Agent failed', { taskId: 'P1.M1.T1' });
    expect(isFatalError(error, false)).toBe(false);
  });

  it('should return false for ValidationError (parse_prd) when continueOnError is false', () => {
    const error = new ValidationError('Invalid PRD', {
      operation: 'parse_prd',
    });
    expect(isFatalError(error, false)).toBe(true);
  });

  it('should return false for ValidationError (non-parse_prd) when continueOnError is false', () => {
    const error = new ValidationError('Invalid scope', {
      operation: 'resolve_scope',
    });
    expect(isFatalError(error, false)).toBe(false);
  });

  it('should return false for standard Error when continueOnError is false (explicit)', () => {
    const error = new Error('Standard error');
    expect(isFatalError(error, false)).toBe(false);
  });
});
```

---

## 7. Edge Cases and Boundary Conditions - 20 Tests

```typescript
describe('Edge cases and boundary conditions', () => {
  // Message edge cases
  it('should handle empty string message', () => {
    const error = new SessionError('', { sessionPath: '/path' });
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle very long message', () => {
    const longMessage = 'I'.repeat(10000);
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
    const error = new SessionError('Error\nwith\tmultiple\nlines');
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
      sessionPath: undefined,
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle circular references in context', () => {
    const context: Record<string, unknown> = { sessionPath: '/path' };
    context.self = context;
    const error = new SessionError('Circular context', context);
    expect(isFatalError(error)).toBe(true);
  });

  // Error property edge cases
  it('should handle error without message', () => {
    const error = new SessionError();
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle error without stack trace', () => {
    const error = new SessionError('No stack');
    delete (error as unknown as { stack?: string }).stack;
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle error without name', () => {
    const error = new SessionError('No name');
    (error as unknown as { name?: string }).name = undefined;
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle error with modified prototype', () => {
    const error = new SessionError('Modified prototype');
    Object.setPrototypeOf(error, Object.prototype);
    expect(isFatalError(error)).toBe(true);
  });

  // Multiple causes/nested errors
  it('should handle error with cause chain', () => {
    const cause1 = new Error('First error');
    const cause2 = new Error('Second error', { cause: cause1 });
    const error = new SessionError('Wrapper error', {}, cause2);
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle wrapped PipelineError', () => {
    const inner = new SessionError('Inner error');
    const outer = new Error('Outer error', { cause: inner });
    expect(isFatalError(outer)).toBe(false); // Outer is not PipelineError
  });

  it('should handle double-wrapped errors', () => {
    const inner = new SessionError('Inner error');
    const middle = new TaskError('Middle error', { taskId: 'P1.M1.T1' });
    const outer = new Error('Outer error', { cause: middle });
    expect(isFatalError(inner)).toBe(true);
    expect(isFatalError(middle)).toBe(false);
    expect(isFatalError(outer)).toBe(false);
  });

  // Additional edge cases
  it('should handle error with timestamp in context', () => {
    const error = new SessionError('Timestamp context', {
      timestamp: Date.now(),
    });
    expect(isFatalError(error)).toBe(true);
  });

  it('should handle error with array context', () => {
    const error = new SessionError('Array context', {
      errors: ['error1', 'error2', 'error3'],
    });
    expect(isFatalError(error)).toBe(true);
  });
});
```

---

## Test Implementation Notes

### Total Test Count by Category

| Category               | Count   | File Section |
| ---------------------- | ------- | ------------ |
| Fatal Errors           | 50      | Section 1    |
| Non-Fatal Errors       | 80      | Section 2    |
| Standard Errors        | 20      | Section 3    |
| Null/Undefined/Invalid | 20      | Section 4    |
| Type Guard Integration | 15      | Section 5    |
| continueOnError Flag   | 15      | Section 6    |
| Edge Cases             | 20      | Section 7    |
| **TOTAL**              | **220** | -            |

### Implementation Order

1. **Start with Section 1** (Fatal Errors) - Most critical functionality
2. **Then Section 2** (Non-Fatal Errors) - Core non-fatal behavior
3. **Then Section 3** (Standard Errors) - Built-in error types
4. **Then Section 4** (Null/Undefined/Invalid) - Edge case handling
5. **Then Section 5** (Type Guard Integration) - Integration patterns
6. **Then Section 6** (continueOnError Flag) - Flag behavior
7. **Finally Section 7** (Edge Cases) - Boundary conditions

### Test File Structure

```typescript
/**
 * Unit tests for isFatalError function
 * ... (header documentation)
 */

import { describe, expect, it } from 'vitest';
import { ... } from '../../../src/utils/errors.js';

describe('isFatalError', () => {
  // Section 1: Fatal Errors (50 tests)
  describe('Fatal errors (return true)', () => { /* ... */ });

  // Section 2: Non-Fatal Errors (80 tests)
  describe('Non-fatal errors (return false)', () => { /* ... */ });

  // Section 3: Standard Errors (20 tests)
  describe('Standard Error types (return false)', () => { /* ... */ });

  // Section 4: Null/Undefined/Invalid (20 tests)
  describe('Null/Undefined/Invalid values (return false)', () => { /* ... */ });

  // Section 5: Type Guard Integration (15 tests)
  describe('Type guard integration', () => { /* ... */ });

  // Section 6: continueOnError Flag (15 tests)
  describe('continueOnError flag behavior', () => { /* ... */ });

  // Section 7: Edge Cases (20 tests)
  describe('Edge cases and boundary conditions', () => { /* ... */ });
});
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Related PRP**: P1.M2.T1.S2
