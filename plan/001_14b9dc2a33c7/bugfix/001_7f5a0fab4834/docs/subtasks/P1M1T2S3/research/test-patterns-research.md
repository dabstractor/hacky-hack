# Research Report: Test Patterns for Verification and Validation Functions

## Executive Summary

This research documents test patterns used in the hacky-hack codebase for verification and validation functions to inform test implementation for `verifyNoModuleErrors()`.

## 1. Test File Structure

### Organized Test File Layout
**Test file path:** `tests/unit/utils/groundswell-verifier.test.ts`

```typescript
describe('verifyGroundswellExists', () => {
  const mockHomeDir = '/home/testuser';
  const expectedGroundswellPath = '/home/testuser/projects/groundswell';

  beforeEach(() => {
    // Reset mocks before each test
    vi.mocked(homedir).mockReturnValue(mockHomeDir);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Directory existence validation tests
  // ========================================================================
  describe('Directory existence validation', () => {
    // ... tests
  });
});
```

## 2. Mock Data Patterns

### Mock Setup with vi.mock()
**Test file path:** `tests/unit/utils/groundswell-verifier.test.ts` (lines 25-37)

```typescript
// Mock node:os module
vi.mock('node:os', () => ({
  homedir: vi.fn(),
}));

// Mock node:fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// Import mocked modules
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
```

### Helper Functions for Complex Mocks
**Test file path:** `tests/unit/utils/groundswell-linker.test.ts` (lines 71-106)

```typescript
function createMockChild(
  options: {
    exitCode?: number | null;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = 'linked groundswell', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number | null) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

## 3. Assertion Patterns

### Boolean Result Verification
**Test file path:** `groundswell-verifier.test.ts` (lines 61-71)

```typescript
it('should return exists: false when directory not found', () => {
  vi.mocked(existsSync).mockReturnValue(false);

  const result = verifyGroundswellExists();

  expect(result.exists).toBe(false);
  expect(result.path).toBe(expectedGroundswellPath);
  expect(result.missingFiles).toHaveLength(0);
  expect(result.message).toContain('not found');
  expect(result.message).toContain(expectedGroundswellPath);
});
```

### Count and Array Verification
**Test file path:** `groundswell-verifier.test.ts` (lines 193-208)

```typescript
it('should return missing both package.json and entry point when both missing', () => {
  vi.mocked(existsSync).mockImplementation(path => {
    if (path === expectedGroundswellPath) return true;
    return false;
  });

  const result = verifyGroundswellExists();

  expect(result.exists).toBe(true);
  expect(result.missingFiles).toContain('package.json');
  expect(result.missingFiles).toHaveLength(2);
});
```

### Object Structure Validation
**Test file path:** `groundswell-verifier.test.ts` (lines 258-274)

```typescript
it('should return complete GroundswellVerifyResult object', () => {
  vi.mocked(existsSync).mockReturnValue(false);

  const result: GroundswellVerifyResult = verifyGroundswellExists();

  expect(result).toHaveProperty('exists');
  expect(result).toHaveProperty('path');
  expect(result).toHaveProperty('missingFiles');
  expect(result).toHaveProperty('message');

  expect(typeof result.exists).toBe('boolean');
  expect(typeof result.path).toBe('string');
  expect(Array.isArray(result.missingFiles)).toBe(true);
  expect(typeof result.message).toBe('string');
});
```

## 4. Test Organization

### Nested Describe Blocks by Feature
```typescript
describe('verifyGroundswellExists', () => {
  beforeEach(() => {
    // Setup
  });

  // ========================================================================
  // Directory existence validation tests
  // ========================================================================
  describe('Directory existence validation', () => {
    // Directory-related tests
  });

  // ========================================================================
  // Required files validation tests
  // ========================================================================
  describe('Required files validation', () => {
    // File validation tests
  });
});
```

### Test Naming Convention
- "should return [result] when [condition]"
- "should handle [edge case] with [expected behavior]"
- "should [validate functionality] for [specific input]"

### Setup/Execute/Verify Pattern
```typescript
it('should build adjacency list from subtasks', () => {
  // SETUP
  const subtasks = [
    createTestSubtask('S1', 'Task 1', 'Planned', ['S2', 'S3']),
    createTestSubtask('S2', 'Task 2', 'Planned', []),
  ];

  // EXECUTE
  const graph = buildDependencyGraph(subtasks);

  // VERIFY
  expect(graph).toEqual({
    S1: ['S2', 'S3'],
    S2: [],
  });
});
```

## Best Practices Observed

1. **Comprehensive Mocking**: All external dependencies are mocked consistently
2. **Cleanup Functions**: Proper cleanup in `afterEach()` and `beforeEach()`
3. **Test Isolation**: Each test runs in isolation with fresh mocks
4. **Edge Case Coverage**: Tests cover happy paths, error conditions, and edge cases
5. **Type Safety**: Tests validate TypeScript interfaces and result structures
6. **Descriptive Naming**: Test names clearly describe what is being tested
7. **Error Message Validation**: Verifying error messages are helpful and actionable
8. **Async Testing**: Proper handling of async operations with `await` and timer mocking
9. **Code Organization**: Clear visual separation of test sections with comments
