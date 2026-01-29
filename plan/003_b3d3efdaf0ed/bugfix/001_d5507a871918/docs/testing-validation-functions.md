# Testing Validation Functions

## Overview

This document covers best practices for testing validation functions in TypeScript using Jest and other testing frameworks, with a focus on testing error throwing, edge cases, and comprehensive coverage.

## Table of Contents

1. [Testing Error Throwing](#testing-error-throwing)
2. [Testing Validation Functions](#testing-validation-functions)
3. [Testing Edge Cases](#testing-edge-cases)
4. [Testing Type Guards](#testing-type-guards)
5. [Testing Async Validation](#testing-async-validation)
6. [Test Organization](#test-organization)
7. [Best Practices](#best-practices)
8. [Complete Examples](#complete-examples)

## Testing Error Throwing

### Pattern 1: Basic Error Testing

```typescript
import { ValidationError, validatePath } from './validator';

describe('validatePath', () => {
  it('should throw ValidationError for null bytes', () => {
    expect(() => validatePath('/path/\0with/null')).toThrow(ValidationError);
    expect(() => validatePath('/path/\0with/null')).toThrow('null bytes');
  });

  it('should throw ValidationError with specific error code', () => {
    try {
      validatePath('/path/\0file');
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe('NULL_BYTE_DETECTED');
    }
  });

  it('should throw with exact error message', () => {
    expect(() => validatePath('/path/\0file')).toThrow(
      'Path contains null bytes'
    );
  });
});
```

### Pattern 2: Multiple Error Assertions

```typescript
describe('validatePath error cases', () => {
  it.each([
    [
      'null byte',
      '/path/\0file',
      'NULL_BYTE_DETECTED',
      'Path contains null bytes',
    ],
    [
      'directory traversal',
      '../../../etc/passwd',
      'PATH_TRAVERSAL_DETECTED',
      'Path attempts to escape base directory',
    ],
    ['empty string', '', 'EMPTY_PATH', 'Path cannot be empty'],
  ])('should throw %s error', (_, input, expectedCode, expectedMessage) => {
    expect(() => validatePath(input)).toThrow(ValidationError);

    try {
      validatePath(input);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(expectedCode);
      expect((error as ValidationError).message).toContain(expectedMessage);
    }
  });
});
```

### Pattern 3: Testing Error Context

```typescript
describe('ValidationError with context', () => {
  it('should include context in error', () => {
    const invalidPath = '/invalid/path';

    try {
      validatePath(invalidPath, { mustExist: true });
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.context).toBeDefined();
      expect(validationError.context?.path).toBe(invalidPath);
      expect(validationError.context?.operation).toBe('validatePath');
    }
  });
});
```

## Testing Validation Functions

### Pattern 1: Success and Failure Cases

```typescript
describe('validatePath', () => {
  describe('success cases', () => {
    it('should validate valid absolute paths', () => {
      const result = validatePath('/src/index.ts');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe('/src/index.ts');
    });

    it('should validate valid relative paths', () => {
      const result = validatePath('./src/index.ts');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBeDefined();
    });

    it('should normalize paths', () => {
      const result = validatePath('./src/../src/index.ts');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe('src/index.ts');
    });
  });

  describe('failure cases', () => {
    it('should reject paths with null bytes', () => {
      const result = validatePath('/path/\0file');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null byte');
    });

    it('should reject empty paths', () => {
      const result = validatePath('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });
});
```

### Pattern 2: Testing Options

```typescript
describe('validatePath with options', () => {
  describe('mustExist option', () => {
    it('should pass when path exists and mustExist is true', () => {
      // Setup: Create a temporary file
      const tempFile = '/tmp/test-file.txt';
      fs.writeFileSync(tempFile, 'test');

      const result = validatePath(tempFile, { mustExist: true });
      expect(result.isValid).toBe(true);

      // Cleanup
      fs.unlinkSync(tempFile);
    });

    it('should fail when path does not exist and mustExist is true', () => {
      const result = validatePath('/nonexistent/path.txt', {
        mustExist: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not exist');
    });
  });

  describe('allowedExtensions option', () => {
    it('should accept allowed extensions', () => {
      const result = validatePath('/src/index.ts', {
        allowedExtensions: ['.ts', '.tsx'],
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject disallowed extensions', () => {
      const result = validatePath('/src/index.js', {
        allowedExtensions: ['.ts', '.tsx'],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Extension .js not allowed');
    });
  });
});
```

### Pattern 3: Table-Driven Tests

```typescript
describe('validatePath table-driven tests', () => {
  interface TestCase {
    description: string;
    input: string;
    options?: ValidationOptions;
    expected: {
      isValid: boolean;
      errorCode?: string;
      normalizedPath?: string;
    };
  }

  const testCases: TestCase[] = [
    {
      description: 'valid absolute path',
      input: '/src/index.ts',
      expected: { isValid: true, normalizedPath: '/src/index.ts' },
    },
    {
      description: 'path with null bytes',
      input: '/src/\0index.ts',
      expected: { isValid: false, errorCode: 'NULL_BYTE_DETECTED' },
    },
    {
      description: 'empty path',
      input: '',
      expected: { isValid: false, errorCode: 'EMPTY_PATH' },
    },
    {
      description: 'directory traversal attempt',
      input: '../../../etc/passwd',
      expected: { isValid: false, errorCode: 'PATH_TRAVERSAL_DETECTED' },
    },
  ];

  it.each(testCases)('$description', ({ input, options, expected }) => {
    const result = validatePath(input, options);

    expect(result.isValid).toBe(expected.isValid);

    if (expected.errorCode) {
      expect(result.errorCode).toBe(expected.errorCode);
    }

    if (expected.normalizedPath) {
      expect(result.normalizedPath).toBe(expected.normalizedPath);
    }
  });
});
```

## Testing Edge Cases

### Pattern 1: Boundary Values

```typescript
describe('validatePath edge cases', () => {
  it('should handle very long paths', () => {
    const longPath = '/a'.repeat(130); // 260 characters
    const result = validatePath(longPath);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('should handle maximum valid path length', () => {
    const maxPath = '/a'.repeat(129); // 259 characters (under MAX_PATH)
    const result = validatePath(maxPath);
    expect(result.isValid).toBe(true);
  });

  it('should handle paths with special characters', () => {
    const specialPaths = [
      '/path/with spaces/file.txt',
      '/path/with-dashes/file.txt',
      '/path/with_underscores/file.txt',
      '/path/with.dots/file.txt',
    ];

    specialPaths.forEach(path => {
      const result = validatePath(path);
      expect(result.isValid).toBe(true);
    });
  });

  it('should handle unicode characters in paths', () => {
    const unicodePath = '/path/with/unicodé/file.txt';
    const result = validatePath(unicodePath);
    expect(result.isValid).toBe(true);
  });
});
```

### Pattern 2: Security Edge Cases

```typescript
describe('validatePath security edge cases', () => {
  it('should prevent null byte injection', () => {
    const maliciousPaths = [
      '/etc/passwd\0.txt',
      '/safe/path\0../../../etc/passwd',
      '\0/etc/passwd',
    ];

    maliciousPaths.forEach(path => {
      expect(() => validatePath(path)).toThrow(ValidationError);
      expect(() => validatePath(path)).toThrow('NULL_BYTE_DETECTED');
    });
  });

  it('should prevent directory traversal', () => {
    const traversalPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '/etc/./passwd/../shadow',
      '....//....//....//etc/passwd',
    ];

    traversalPaths.forEach(path => {
      expect(() => validatePath(path)).toThrow(ValidationError);
      expect(() => validatePath(path)).toThrow('PATH_TRAVERSAL');
    });
  });

  it('should handle mixed path separators', () => {
    const mixedPath = 'path\\to/file';
    const result = validatePath(mixedPath);
    // Should normalize to platform-specific separator
    expect(result.normalizedPath).toBeDefined();
  });
});
```

### Pattern 3: Platform-Specific Tests

```typescript
describe('validatePath platform-specific', () => {
  const isWindows = process.platform === 'win32';

  it('should handle platform-specific separators', () => {
    const path = isWindows
      ? 'C:\\Users\\test\\file.txt'
      : '/home/user/test/file.txt';

    const result = validatePath(path);
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid characters for platform', () => {
    if (isWindows) {
      // Windows invalid characters: < > : " | ? *
      const invalidPaths = [
        '/path/<invalid>.txt',
        '/path/:invalid.txt',
        '/path/|invalid.txt',
        '/path/?invalid.txt',
        '/path/*invalid.txt',
      ];

      invalidPaths.forEach(path => {
        const result = validatePath(path);
        expect(result.isValid).toBe(false);
      });
    }
  });
});
```

## Testing Type Guards

### Pattern 1: Type Guard Testing

```typescript
describe('isValidPath type guard', () => {
  it('should return true for valid path strings', () => {
    const validPaths = ['/src/index.ts', './relative/path.txt', 'file.txt'];

    validPaths.forEach(path => {
      expect(isValidPath(path)).toBe(true);
    });
  });

  it('should return false for non-strings', () => {
    const invalidInputs = [null, undefined, 123, {}, [], true];

    invalidInputs.forEach(input => {
      expect(isValidPath(input)).toBe(false);
    });
  });

  it('should narrow type correctly', () => {
    const value: unknown = '/src/index.ts';

    if (isValidPath(value)) {
      // TypeScript should know value is string here
      expect(value.toUpperCase()).toBe('/SRC/INDEX.TS');
    }
  });

  it('should not narrow type for invalid values', () => {
    const value: unknown = 123;

    if (isValidPath(value)) {
      // This branch should never execute
      fail('Type guard should have rejected the value');
    } else {
      // TypeScript knows value is not string here
      expect(typeof value).not.toBe('string');
    }
  });
});
```

### Pattern 2: Assertion Function Testing

```typescript
describe('assertValidPath assertion function', () => {
  it('should not throw for valid paths', () => {
    const validPaths = ['/src/index.ts', './relative/path.txt'];

    validPaths.forEach(path => {
      expect(() => assertValidPath(path)).not.toThrow();
    });
  });

  it('should throw ValidationError for invalid paths', () => {
    const invalidPaths = ['', '/path/\0file', '../../../etc/passwd'];

    invalidPaths.forEach(path => {
      expect(() => assertValidPath(path)).toThrow(ValidationError);
    });
  });

  it('should narrow type after assertion', () => {
    const value: unknown = '/src/index.ts';

    assertValidPath(value);

    // TypeScript should know value is string here
    expect(value.length).toBeGreaterThan(0);
    expect(value.split('/')).toHaveLength(3);
  });
});
```

## Testing Async Validation

### Pattern 1: Async Error Testing

```typescript
describe('loadBugReport async validation', () => {
  it('should throw ValidationError for invalid session path', async () => {
    await expect(loadBugReport('invalid/path/format')).rejects.toThrow(
      ValidationError
    );

    await expect(loadBugReport('invalid/path/format')).rejects.toThrow(
      'INVALID_SESSION_PATH'
    );
  });

  it('should throw ValidationError with specific error code', async () => {
    try {
      await loadBugReport('invalid/path');
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe('INVALID_SESSION_PATH');
    }
  });

  it('should load valid bug report', async () => {
    // Setup: Create test data
    const sessionPath = createTestSession();
    const testResultsPath = path.join(sessionPath, 'TEST_RESULTS.md');
    fs.writeFileSync(
      testResultsPath,
      JSON.stringify({
        description: 'Test bug',
        steps: [],
      })
    );

    const report = await loadBugReport(sessionPath);
    expect(report.description).toBe('Test bug');

    // Cleanup
    fs.rmSync(sessionPath, { recursive: true, force: true });
  });
});
```

### Pattern 2: Async Validation with Options

```typescript
describe('async validation with retries', () => {
  it('should retry on transient errors', async () => {
    let attempts = 0;
    const mockValidator = jest.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Transient error');
      }
      return { isValid: true };
    });

    const result = await validateWithRetry(mockValidator, {
      maxRetries: 3,
      retryDelay: 100,
    });

    expect(result.isValid).toBe(true);
    expect(mockValidator).toHaveBeenCalledTimes(3);
  });

  it('should fail after max retries', async () => {
    const mockValidator = jest.fn(async () => {
      throw new Error('Persistent error');
    });

    await expect(
      validateWithRetry(mockValidator, { maxRetries: 2 })
    ).rejects.toThrow('Persistent error');

    expect(mockValidator).toHaveBeenCalledTimes(2);
  });
});
```

## Test Organization

### Pattern 1: Fixture-Based Tests

```typescript
describe('Path validation fixtures', () => {
  beforeAll(() => {
    // Create test fixtures
    createTestFixtures();
  });

  afterAll(() => {
    // Cleanup test fixtures
    removeTestFixtures();
  });

  describe('existing files', () => {
    it('should validate existing TypeScript file', () => {
      const result = validatePath('/fixtures/test.ts', {
        mustExist: true,
        mustBeFile: true,
      });
      expect(result.isValid).toBe(true);
    });

    it('should validate existing directory', () => {
      const result = validatePath('/fixtures/test-dir', {
        mustExist: true,
      });
      expect(result.isValid).toBe(true);
    });
  });
});
```

### Pattern 2: Test Helpers

```typescript
// test-helpers.ts
export function createMockBugReport(overrides?: Partial<BugReport>): BugReport {
  return {
    description: 'Test bug description',
    steps: ['Step 1', 'Step 2'],
    expectedBehavior: 'Should work',
    actualBehavior: 'Does not work',
    ...overrides,
  };
}

export function createTestSession(): string {
  const sessionPath = '/tmp/test-session';
  fs.mkdirSync(sessionPath, { recursive: true });
  return sessionPath;
}

export function expectValidationError(
  error: unknown,
  code: string
): asserts error is ValidationError {
  expect(error).toBeInstanceOf(ValidationError);
  expect((error as ValidationError).code).toBe(code);
}

// Usage in tests
describe('Bug report validation', () => {
  it('should validate bug report', () => {
    const report = createMockBugReport();
    expect(validateBugReport(report)).toBe(true);
  });

  it('should throw with correct error code', () => {
    try {
      validateBugReport(invalidData);
      fail('Should have thrown');
    } catch (error) {
      expectValidationError(error, 'MISSING_REQUIRED_FIELD');
    }
  });
});
```

## Best Practices

### 1. Use Test.each for Data-Driven Tests

```typescript
// ✅ GOOD: Table-driven tests
it.each([
  ['/valid/path', true],
  ['', false],
  ['/path/\0file', false],
])('validates %s correctly', (input, expected) => {
  expect(validatePath(input).isValid).toBe(expected);
});

// ❌ BAD: Repetitive tests
it('validates /valid/path', () => {
  expect(validatePath('/valid/path').isValid).toBe(true);
});

it('validates empty string', () => {
  expect(validatePath('').isValid).toBe(false);
});
```

### 2. Test Both Success and Failure Cases

```typescript
// ✅ GOOD: Test both outcomes
describe('validatePath', () => {
  it('should accept valid paths', () => {
    expect(validatePath('/src/index.ts').isValid).toBe(true);
  });

  it('should reject invalid paths', () => {
    expect(validatePath('').isValid).toBe(false);
  });
});

// ❌ BAD: Only test success
describe('validatePath', () => {
  it('should accept valid paths', () => {
    expect(validatePath('/src/index.ts').isValid).toBe(true);
  });
});
```

### 3. Use Specific Error Assertions

```typescript
// ✅ GOOD: Specific error type and code
it('should throw ValidationError with correct code', () => {
  expect(() => validatePath('')).toThrow(ValidationError);
  try {
    validatePath('');
    fail('Should have thrown');
  } catch (error) {
    expect((error as ValidationError).code).toBe('EMPTY_PATH');
  }
});

// ❌ BAD: Generic error check
it('should throw error', () => {
  expect(() => validatePath('')).toThrow();
});
```

### 4. Test Edge Cases Explicitly

```typescript
// ✅ GOOD: Explicit edge case tests
describe('Edge cases', () => {
  it('should handle maximum path length', () => {
    /* ... */
  });
  it('should handle null bytes', () => {
    /* ... */
  });
  it('should handle unicode characters', () => {
    /* ... */
  });
});

// ❌ BAD: No edge case coverage
describe('validatePath', () => {
  it('should validate normal paths', () => {
    /* ... */
  });
});
```

### 5. Use Setup and Cleanup Properly

```typescript
// ✅ GOOD: Proper setup/teardown
describe('File validation', () => {
  const tempFile = '/tmp/test-file.txt';

  beforeEach(() => {
    fs.writeFileSync(tempFile, 'test content');
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  it('should validate existing file', () => {
    const result = validatePath(tempFile, { mustExist: true });
    expect(result.isValid).toBe(true);
  });
});

// ❌ BAD: No cleanup
describe('File validation', () => {
  it('should validate existing file', () => {
    const tempFile = '/tmp/test-file.txt';
    fs.writeFileSync(tempFile, 'test');
    // File not cleaned up
  });
});
```

### 6. Test Async Functions Correctly

```typescript
// ✅ GOOD: Proper async testing
it('should load bug report', async () => {
  const report = await loadBugReport('valid/path');
  expect(report).toBeDefined();
});

it('should throw for invalid path', async () => {
  await expect(loadBugReport('invalid/path')).rejects.toThrow(ValidationError);
});

// ❌ BAD: Not awaiting promises
it('should load bug report', () => {
  loadBugReport('valid/path'); // Not awaited
  expect(true).toBe(true); // Passes regardless
});
```

## Complete Examples

### Example 1: Comprehensive Validation Test Suite

```typescript
import { validatePath, ValidationError, ValidationOptions } from './validator';
import * as fs from 'fs';
import * as path from 'path';

describe('PathValidator', () => {
  describe('basic validation', () => {
    it('should accept valid absolute paths', () => {
      const result = validatePath('/src/index.ts');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe('/src/index.ts');
    });

    it('should accept valid relative paths', () => {
      const result = validatePath('./src/index.ts');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBeDefined();
    });

    it('should normalize paths', () => {
      const result = validatePath('./src/../src/index.ts');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe('src/index.ts');
    });
  });

  describe('error cases', () => {
    it('should throw for null bytes', () => {
      expect(() => validatePath('/path/\0file')).toThrow(ValidationError);
      expect(() => validatePath('/path/\0file')).toThrow('NULL_BYTE_DETECTED');
    });

    it('should throw for directory traversal', () => {
      expect(() => validatePath('../../../etc/passwd')).toThrow(
        ValidationError
      );
      expect(() => validatePath('../../../etc/passwd')).toThrow(
        'PATH_TRAVERSAL'
      );
    });

    it('should throw for empty paths', () => {
      expect(() => validatePath('')).toThrow(ValidationError);
      expect(() => validatePath('')).toThrow('EMPTY_PATH');
    });
  });

  describe('with options', () => {
    let tempFile: string;

    beforeEach(() => {
      tempFile = `/tmp/test-${Date.now()}.txt`;
      fs.writeFileSync(tempFile, 'test');
    });

    afterEach(() => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });

    it('should validate existing file when mustExist is true', () => {
      const result = validatePath(tempFile, { mustExist: true });
      expect(result.isValid).toBe(true);
    });

    it('should fail when mustExist is true but file does not exist', () => {
      const result = validatePath('/nonexistent/file.txt', {
        mustExist: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PATH_NOT_FOUND');
    });

    it('should validate file extensions', () => {
      const result = validatePath('/src/index.js', {
        allowedExtensions: ['.ts', '.tsx'],
      });
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_EXTENSION');
    });
  });

  describe('edge cases', () => {
    it('should handle maximum path length', () => {
      const maxPath = '/a'.repeat(129); // Under MAX_PATH
      const result = validatePath(maxPath);
      expect(result.isValid).toBe(true);
    });

    it('should reject paths exceeding MAX_PATH', () => {
      const tooLongPath = '/a'.repeat(130); // Over MAX_PATH
      const result = validatePath(tooLongPath);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PATH_TOO_LONG');
    });

    it('should handle unicode characters', () => {
      const unicodePath = '/path/to/unicodé/fïle.txt';
      const result = validatePath(unicodePath);
      expect(result.isValid).toBe(true);
    });

    it('should handle multiple consecutive separators', () => {
      const result = validatePath('/path//to///file.txt');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).not.toContain('//');
    });
  });

  describe('security', () => {
    const maliciousPaths = [
      { path: '/etc/passwd\0.txt', description: 'null byte injection' },
      { path: '../../../etc/passwd', description: 'directory traversal' },
      { path: '....//....//etc/passwd', description: 'obfuscated traversal' },
    ];

    it.each(maliciousPaths)('should block $description', ({ path }) => {
      expect(() => validatePath(path)).toThrow(ValidationError);
    });
  });
});
```

### Example 2: Session Path Validation Tests

```typescript
import { validateSessionPath, ValidationError } from './session-validator';

describe('validateSessionPath', () => {
  describe('valid session paths', () => {
    const validPaths = [
      'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918',
      'plan/001_000000000000/bugfix/001_000000000000',
      'plan/999_ffffffffffff/bugfix/999_ffffffffffff',
    ];

    it.each(validPaths)('should accept %s', path => {
      expect(() => validateSessionPath(path)).not.toThrow();
    });
  });

  describe('invalid session paths', () => {
    describe('format errors', () => {
      const invalidPaths = [
        {
          path: 'invalid/format',
          reason: 'wrong structure',
        },
        {
          path: 'plan/003_b3d3efdaf0ed',
          reason: 'missing bugfix segment',
        },
        {
          path: 'plan/3_b3d3efdaf0ed/bugfix/1_d5507a871918',
          reason: 'number not 3 digits',
        },
        {
          path: 'plan/003_b3d3efdaf0e/bugfix/001_d5507a871918',
          reason: 'hash not 12 characters',
        },
        {
          path: 'plan/003_b3d3efdaf0edx/bugfix/001_d5507a871918',
          reason: 'hash contains non-hex character',
        },
      ];

      it.each(invalidPaths)('should reject $reason: $path', ({ path }) => {
        expect(() => validateSessionPath(path)).toThrow(ValidationError);
        expect(() => validateSessionPath(path)).toThrow('INVALID_SESSION_PATH');
      });
    });
  });

  describe('error details', () => {
    it('should include expected format in error message', () => {
      try {
        validateSessionPath('invalid/path');
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          'plan/XXX_<hash>/bugfix/XXX_<hash>'
        );
      }
    });

    it('should include error code', () => {
      try {
        validateSessionPath('invalid/path');
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect((error as ValidationError).code).toBe('INVALID_SESSION_PATH');
      }
    });
  });
});
```

### Example 3: Bug Report Loading Tests

```typescript
import { loadBugReport, ValidationError } from './bug-report-loader';
import * as fs from 'fs';
import * as path from 'path';

describe('loadBugReport', () => {
  let sessionPath: string;

  beforeEach(() => {
    sessionPath = `/tmp/test-session-${Date.now()}`;
    fs.mkdirSync(sessionPath, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  });

  describe('successful loading', () => {
    it('should load valid bug report', async () => {
      const bugReport = {
        description: 'Test bug',
        steps: ['Step 1', 'Step 2'],
        expectedBehavior: 'Expected',
        actualBehavior: 'Actual',
      };

      const testResultsPath = path.join(sessionPath, 'TEST_RESULTS.md');
      fs.writeFileSync(testResultsPath, JSON.stringify(bugReport));

      const result = await loadBugReport(sessionPath);

      expect(result.description).toBe(bugReport.description);
      expect(result.steps).toEqual(bugReport.steps);
    });

    it('should parse JSON correctly', async () => {
      const bugReport = {
        description: 'Test bug with "quotes"',
        steps: ['Step with "quotes"'],
        expectedBehavior: 'Expected',
        actualBehavior: 'Actual',
      };

      const testResultsPath = path.join(sessionPath, 'TEST_RESULTS.md');
      fs.writeFileSync(testResultsPath, JSON.stringify(bugReport));

      const result = await loadBugReport(sessionPath);

      expect(result.description).toContain('quotes');
    });
  });

  describe('validation errors', () => {
    it('should reject invalid session path', async () => {
      await expect(loadBugReport('invalid/path/format')).rejects.toThrow(
        ValidationError
      );

      await expect(loadBugReport('invalid/path/format')).rejects.toThrow(
        'INVALID_SESSION_PATH'
      );
    });

    it('should reject missing TEST_RESULTS.md', async () => {
      // Create valid session path without TEST_RESULTS.md
      const validSessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
      fs.mkdirSync(validSessionPath, { recursive: true });

      await expect(loadBugReport(validSessionPath)).rejects.toThrow(
        ValidationError
      );

      await expect(loadBugReport(validSessionPath)).rejects.toThrow(
        'PATH_NOT_FOUND'
      );
    });

    it('should reject invalid JSON', async () => {
      const testResultsPath = path.join(sessionPath, 'TEST_RESULTS.md');
      fs.writeFileSync(testResultsPath, 'invalid json{');

      await expect(loadBugReport(sessionPath)).rejects.toThrow(ValidationError);

      await expect(loadBugReport(sessionPath)).rejects.toThrow('INVALID_JSON');
    });

    it('should reject missing required fields', async () => {
      const incompleteReport = {
        description: 'Bug without steps',
        // Missing 'steps' field
      };

      const testResultsPath = path.join(sessionPath, 'TEST_RESULTS.md');
      fs.writeFileSync(testResultsPath, JSON.stringify(incompleteReport));

      await expect(loadBugReport(sessionPath)).rejects.toThrow(ValidationError);

      await expect(loadBugReport(sessionPath)).rejects.toThrow(
        'MISSING_REQUIRED_FIELD'
      );
    });
  });
});
```

## Key Takeaways

1. **Test both success and failure cases** comprehensively
2. **Use `it.each` for data-driven tests** to reduce duplication
3. **Test specific error types and codes** not just that errors are thrown
4. **Include edge cases**: boundary values, special characters, unicode, platform differences
5. **Test security concerns**: null bytes, path traversal, injection attacks
6. **Use proper async/await** when testing async functions
7. **Clean up test fixtures** in `afterEach` to avoid side effects
8. **Use test helpers** to reduce duplication and improve readability
9. **Test type guards** by verifying type narrowing behavior
10. **Document edge cases** in test descriptions for future maintainers

## Sources

While web search services are currently rate-limited, this research is based on:

- Jest Official Documentation: https://jestjs.io/docs/getting-started
- Jest Expect Documentation: https://jestjs.io/docs/expect
- TypeScript Testing Best Practices
- Testing Anti-Patterns by Kent C. Dodds
- "Test-Driven JavaScript Development" by Christian Johansen
- "Growing Object-Oriented Software, Guided by Tests" by Steve Freeman and Nat Pryce
