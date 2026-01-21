# Test Patterns Documentation for Groundswell Import Tests

## Overview

This document documents the testing patterns used in the hacky-hack codebase to guide the creation of new import tests for Groundswell. The codebase uses Vitest as the testing framework with comprehensive mocking and coverage requirements.

## Test Framework Configuration

### Vitest Version

- **Version**: 1.6.1
- **Environment**: Node.js
- **Coverage Provider**: v8
- **Coverage Threshold**: 100% for all source files (statements, branches, functions, lines)

### Test Scripts Available

```json
{
  "test": "vitest", // Run tests with watch mode
  "test:run": "vitest run", // Run tests once
  "test:watch": "vitest watch", // Run tests in watch mode
  "test:coverage": "vitest run --coverage", // Run with coverage report
  "test:bail": "vitest run --bail=1" // Stop after first failure
}
```

### Test File Patterns

- Location: `tests/unit/`
- Pattern: `*.test.ts`
- Include: `['tests/**/*.{test,spec}.ts']`
- Exclude: `['**/dist/**', '**/node_modules/**']`
- Setup File: `./tests/setup.ts`

## Test Structure Patterns

### File Header Documentation

Every test file includes comprehensive header documentation:

```typescript
/**
 * Unit tests for [Module Name]
 *
 * @remarks
 * Tests validate [functionality description] including:
 * 1. [Specific feature 1]
 * 2. [Specific feature 2]
 * 3. [Specific feature 3]
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */
```

### Describe/It Block Structure

Tests are organized in nested describe blocks for logical grouping:

```typescript
describe('moduleName', () => {
  const mockData = {
    /* shared test data */
  };

  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('specific functionality', () => {
    it('should do something correctly', () => {
      // Test implementation
    });
  });
});
```

### Mock Setup Patterns

#### Mocking Node.js Modules

```typescript
// Mock node modules at the top of the file
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  lstat: vi.fn(),
  readlink: vi.fn(),
  access: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));
```

#### Mocking Local Modules

```typescript
// Mock local modules
vi.mock('../../../src/utils/groundswell-verifier.js', () => ({
  verifyGroundswellExists: vi.fn(),
}));
```

#### Mock Implementation Patterns

```typescript
// Before each test
beforeEach(() => {
  vi.mocked(module.function).mockImplementation((...args) => {
    // Custom mock implementation
  });
});

// Specific test case
it('should handle specific case', () => {
  vi.mocked(dependency).mockReturnValue({
    property: 'value',
  });

  // Test execution
  const result = functionUnderTest();

  // Assertions
  expect(result).toEqual(expected);
});
```

## Import Patterns

### Test File Imports

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProcess } from 'node:child_process';

// Import mocked modules
import { spawn } from 'node:child_process';
import { access, lstat, readFile } from 'node:fs/promises';

// Import function under test
import { functionName } from '../../../src/module/file.js';
```

### Type Imports

Tests import and verify TypeScript types:

```typescript
import {
  FunctionResultType,
  InputOptionsType,
  ErrorType,
} from '../../../src/module/file.js';
```

## Assertion Patterns

### Basic Value Assertions

```typescript
expect(result.success).toBe(true);
expect(result.exitCode).toBe(0);
expect(result.message).toContain('Expected text');
expect(result.path).toBe('/expected/path');
expect(Array.isArray(result.items)).toBe(true);
```

### Object Structure Assertions

```typescript
// Check all expected properties
expect(result).toHaveProperty('success');
expect(result).toHaveProperty('message');
expect(result).toHaveProperty('data');

// Type checking
expect(typeof result.success).toBe('boolean');
expect(typeof result.message).toBe('string');

// Optional properties
expect(result.exitCode === null || typeof result.exitCode === 'number').toBe(
  true
);
```

### Error Handling Assertions

```typescript
// Async error expectations
await expect(functionThatThrows()).rejects.toThrow('Error message');

// Specific error types
await expect(functionThatThrows()).rejects.toThrow(CustomErrorType);

// Error details
try {
  functionThatThrows();
} catch (e) {
  expect(e).toBeInstanceOf(CustomErrorType);
  if (e instanceof CustomErrorType) {
    expect(e.details).toEqual(expectedDetails);
  }
}
```

### Mock Call Verification

```typescript
// Verify function calls
expect(dependencyFunction).toHaveBeenCalledTimes(1);
expect(dependencyFunction).toHaveBeenCalledWith(arg1, arg2);

// Verify call order
expect(mock1).toHaveBeenCalledBefore(mock2);
```

## TypeScript Compilation Testing

The codebase does not directly test TypeScript compilation in unit tests, but:

1. **Type Checking**: TypeScript is configured with strict mode
2. **Build Process**: Uses TypeScript compiler with `tsc --noEmit` for type checking
3. **Import Resolution**: Tests verify that imports resolve correctly at runtime

## Naming Conventions

### Test File Names

- Pattern: `[feature].test.ts`
- Examples: `groundswell-linker.test.ts`, `environment.test.ts`

### Test Case Names

- Descriptive and specific
- Use should verb form: "should do something when condition"
- Include edge cases: "should handle missing file gracefully"

### Describe Block Names

- Match the module/function being tested
- Use present tense: "linkGroundswell" not "linkGroundswell should"
- Group related functionality: "Error handling", "Happy path", "Input validation"

## Groundswell-Specific Test Patterns

### Mock Child Process Creation

```typescript
function createMockChild(options: {
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
}) {
  const { exitCode = 0, stdout = 'default output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event, callback) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event, callback) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

### Groundswell Verification Testing

```typescript
describe('verifyGroundswellExists', () => {
  it('should return exists: false when directory not found', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = verifyGroundswellExists();

    expect(result.exists).toBe(false);
    expect(result.path).toBe(expectedPath);
    expect(result.missingFiles).toHaveLength(0);
    expect(result.message).toContain('not found');
  });
});
```

### Groundswell Link Testing

```typescript
describe('linkGroundswell', () => {
  it('should return success: true when npm link completes with exit code 0', async () => {
    // Setup mocks
    vi.mocked(verifyGroundswellExists).mockReturnValue({
      exists: true,
      path: mockPath,
      missingFiles: [],
      message: 'verified',
    });

    const mockChild = createMockChild({
      exitCode: 0,
      stdout: 'linked successfully',
    });
    vi.mocked(spawn).mockReturnValue(mockChild);

    // Execute
    const result = await linkGroundswell();

    // Verify
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.message).toContain('Successfully linked');
  });
});
```

## Global Test Setup

### Environment Variable Management

```typescript
// Global afterEach hook (in setup.ts)
afterEach(() => {
  vi.unstubAllEnvs(); // Restores all environment variables

  if (typeof global.gc === 'function') {
    global.gc(); // Force garbage collection
  }
});
```

### Mock Cleanup

```typescript
// Global beforeEach hook (in setup.ts)
beforeEach(() => {
  vi.clearAllMocks(); // Clear mock call histories
  validateApiEndpoint(); // Validate z.ai API usage
});
```

## Best Practices

### 1. Test Isolation

- Each test should run in isolation
- Use `vi.clearAllMocks()` and `vi.unstubAllEnvs()` in hooks
- Reset mock implementations between tests

### 2. Realistic Mock Data

- Create mock objects that match real-world scenarios
- Include edge cases and error conditions
- Test both success and failure paths

### 3. Async Testing

- Use `async/await` for async functions
- Use `vi.runAllTimersAsync()` for timer-based tests
- Handle promise rejections with `rejects.toThrow()`

### 4. Coverage Requirements

- Aim for 100% coverage
- Test all branches and error conditions
- Include integration tests that verify component interaction

### 5. Documentation

- Document test scope and objectives in file headers
- Include setup/teardown requirements in comments
- Reference related documentation or issues

### 6. Groundswell-Specific Considerations

- Always test npm link scenarios
- Verify symlink creation and verification
- Test timeout handling and process cleanup
- Include both global and local linking scenarios

## Example Test Template for Groundswell Import Tests

```typescript
/**
 * Unit tests for Groundswell Import Function
 *
 * @remarks
 * Tests validate Groundswell import functionality including:
 * 1. Package discovery and resolution
 * 2. Import statement generation
 * 3. TypeScript compilation verification
 * 4. Error handling for invalid packages
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImportResult } from '../../../src/utils/groundswell-importer.js';

// Mock dependencies
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('node:path', () => ({
  resolve: vi.fn(),
}));

// Import modules
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  importGroundswellPackage,
  type ImportResult,
} from '../../../src/utils/groundswell-importer.js';

describe('importGroundswellPackage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Successful import', () => {
    it('should import package successfully when package.json exists', async () => {
      // Setup
      vi.mocked(readFile)
        .mockResolvedValueOnce(Buffer.from('{"name": "test-package"}'))
        .mockResolvedValueOnce(Buffer.from('export default function() {}'));

      const mockPath = '/path/to/package';
      vi.mocked(resolve).mockReturnValue(mockPath);

      // Execute
      const result: ImportResult =
        await importGroundswellPackage('test-package');

      // Verify
      expect(result.success).toBe(true);
      expect(result.importStatements).toContain('import');
      expect(writeFile).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle missing package.json gracefully', async () => {
      // Setup
      vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));

      // Execute & Verify
      await expect(importGroundswellPackage('nonexistent')).rejects.toThrow();
    });
  });
});
```
