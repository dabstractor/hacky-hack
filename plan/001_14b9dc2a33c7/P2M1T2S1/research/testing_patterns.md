# Testing Patterns for MCP Tools

## Summary

This document covers the testing patterns used in this codebase for testing MCP tools.

## Key Findings

### 1. Testing Framework: Vitest

The project uses **Vitest** as the testing framework with:

- Configuration in `vitest.config.ts`
- Strict 100% coverage requirements
- ESM modules (project type is "module")
- Node.js test environment

### 2. Test Commands

```bash
npm test          # Run tests in watch mode
npm run test:run  # Run tests once
npm run test:coverage  # Run tests with coverage report
```

### 3. Test File Patterns

- **Location**: `/home/dustin/projects/hacky-hack/tests/`
- **Naming**: `*.test.ts` for unit tests
- **Directory structure**:
  - `tests/unit/` - Unit tests for core functionality
  - `tests/manual/` - Manual verification scripts (run with tsx)
  - `tests/validation/` - Integration/validation tests

### 4. Testing Patterns Observed

#### A. Test Structure

- Uses `describe`/`it` syntax from Vitest
- Tests are well-structured with SETUP, EXECUTE, VERIFY comments
- Heavy use of test data objects to avoid duplication

#### B. Mocking Patterns

1. **Environment Variable Stubs**:

```typescript
vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
```

2. **Module Mocks**:

```typescript
vi.mock('node:crypto', () => ({
  createHash: vi.fn(),
  randomBytes: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));
```

3. **Test Utilities**:

- Uses `vi.fn()` for function mocking
- `vi.unstubAllEnvs()` for cleanup
- `beforeEach` and `afterEach` hooks for setup/teardown

#### C. Assertion Patterns

- Uses `expect` from Vitest
- Extensive use of `.toHaveProperty()`, `.toBe()`, `.toEqual()`
- Pattern testing with `it.each()` for multiple test cases
- Validation of both success and failure cases

### 5. Key Testing Principles

1. **100% Coverage Required**: Enforces 100% coverage for statements, branches, functions, and lines
2. **Test Organization**: Tests mirror source directory structure
3. **Testing Strategy**:
   - Extensive schema validation testing (for Zod schemas)
   - Environment variable testing and mocking
   - Configuration object testing
   - Both positive and negative test cases
4. **Documentation**: Comprehensive JSDoc comments in test files

### 6. Dependencies for Testing

- `vitest` - Testing framework
- `@vitest/coverage-v8` - Coverage provider
- `tsx` - For running manual test scripts
- `vi` - Vitest's built-in mocking utilities

### 7. Example Test Pattern for MCP Tools

```typescript
/**
 * Unit tests for Bash MCP tool
 *
 * @remarks
 * Tests validate bash command execution with security constraints
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawn } from 'node:child_process';

// Mock child_process to avoid actual command execution
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('tools/bash-mcp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeBash tool', () => {
    it('should execute simple command successfully', async () => {
      // SETUP
      const mockSpawn = vi.mocked(spawn);
      const mockChild = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') callback(Buffer.from('output'));
          }),
        },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') callback(Buffer.from(''));
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockChild as any);

      // EXECUTE
      const result = await executeBash({ command: 'echo test' });

      // VERIFY
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('output');
      expect(mockSpawn).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.any(Object)
      );
    });

    it('should handle command failure with non-zero exit code', async () => {
      // SETUP
      const mockSpawn = vi.mocked(spawn);
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') callback(Buffer.from('error message'));
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(1);
        }),
      };
      mockSpawn.mockReturnValue(mockChild as any);

      // EXECUTE
      const result = await executeBash({ command: 'false' });

      // VERIFY
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error message');
    });

    it('should enforce timeout for long-running commands', async () => {
      // SETUP
      const mockSpawn = vi.mocked(spawn);
      let closeCallback: ((code: number) => void) | null = null;
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') closeCallback = callback;
        }),
        kill: vi.fn(),
      };
      mockSpawn.mockReturnValue(mockChild as any);

      // EXECUTE with short timeout
      const resultPromise = executeBash({ command: 'sleep 100', timeout: 100 });

      // VERIFY - timeout should trigger kill
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });
});
```

## Sources

- Vitest documentation: https://vitest.dev/
- Project vitest.config.ts
- Existing test files in tests/unit/
