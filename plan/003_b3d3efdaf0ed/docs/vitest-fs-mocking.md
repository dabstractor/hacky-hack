# Vitest Mocking Patterns for Node.js fs Operations

## 1. Vitest vi.mock() patterns for node:fs/promises

### Basic Mock Setup

```typescript
import { vi } from 'vitest';
import { writeFile, rename, unlink, mkdir } from 'node:fs/promises';
import type { Stats } from 'node:fs';

// Mock the entire node:fs/promises module
vi.mock('node:fs/promises', () => {
  return {
    writeFile: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
    stat: vi.fn(),
  };
});

// Import after mock setup
import { writeFile as mockWriteFile, rename as mockRename, unlink as mockUnlink } from 'node:fs/promises';
```

### Type-safe Mock Access with vi.mocked()

```typescript
// Type-safe mock access with proper typing
const mockWriteFile = vi.mocked(writeFile);
const mockRename = vi.mocked(rename);
const mockUnlink = vi.mocked(unlink);

// Example usage in tests
mockWriteFile.mockResolvedValue();
mockWriteFile.mockRejectedValue(new Error('Write failed'));

// Type-safe assertion
expect(mockWriteFile).toHaveBeenCalledWith(
  expect.stringContaining('.tmp'),
  Buffer.from('test content')
);
```

### Mocking node:crypto for randomBytes

```typescript
vi.mock('node:crypto', () => ({
  randomBytes: vi.fn().mockReturnValue(Buffer.from('mock-random-bytes')),
}));

import { randomBytes } from 'node:crypto';
const mockRandomBytes = vi.mocked(randomBytes);
```

### Module Import Order Requirements

**Important**: Mocks must be set up BEFORE the module under test is imported:

```typescript
// ✅ Correct order
vi.mock('node:fs/promises');
vi.mock('node:crypto');

// Now import the module that uses these
import { atomicWrite } from './atomic-write';

// ❌ Incorrect - will not work
import { atomicWrite } from './atomic-write';
vi.mock('node:fs/promises');
```

## Project-Specific Mock Patterns

Based on the actual atomic write implementation in `/src/core/session-utils.ts`, here are the specific mocking patterns needed:

### Mocking the atomicWrite Function

```typescript
// setup.ts - Global test setup
import { vi } from 'vitest';
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

// Mock the modules used by atomicWrite
vi.mock('node:fs/promises');
vi.mock('node:crypto', () => ({
  randomBytes: vi.fn().mockReturnValue(Buffer.from('12345678')),
}));

// Now import the function under test
import { atomicWrite } from '../src/core/session-utils';
```

### Testing Specific atomicWrite Behavior

```typescript
test('should create temp file with exact pattern matching', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);
  const mockRandomBytes = vi.mocked(randomBytes);

  // Setup mock behavior
  mockWriteFile.mockResolvedValue();
  mockRename.mockResolvedValue();
  mockRandomBytes.mockReturnValue(Buffer.from('test1234'));

  const targetPath = '/path/to/tasks.json';
  const content = 'test content';

  await atomicWrite(targetPath, content);

  // Verify the exact temp file pattern used by the implementation
  expect(mockWriteFile).toHaveBeenCalledWith(
    '/path/to/.tasks.json.test1234.tmp',
    Buffer.from(content),
    { mode: 0o644 }
  );

  // Verify rename call
  expect(mockRename).toHaveBeenCalledWith(
    '/path/to/.tasks.json.test1234.tmp',
    '/path/to/tasks.json'
  );
});
```

## 2. Testing Atomic Write with Temp Files

### Verify Temp File Path Pattern

```typescript
test('should create temp file with correct pattern', async () => {
  const mockWriteFile = vi.mocked(writeFile);

  await atomicWrite('/path/to/file.txt', 'content');

  expect(mockWriteFile).toHaveBeenCalledWith(
    expect.stringMatching(/\/path\/to\/file\.tmp\.[a-f0-9]{8}/),
    Buffer.from('content')
  );
});

// Project-specific pattern matching for session-utils
test('should create temp file with session-utils pattern', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRandomBytes = vi.mocked(randomBytes);

  mockWriteFile.mockResolvedValue();
  mockRandomBytes.mockReturnValue(Buffer.from('abc12345'));

  await atomicWrite('/plan/001_hash/tasks.json', '{"backlog": []}');

  expect(mockWriteFile).toHaveBeenCalledWith(
    '/plan/001_hash/.tasks.json.abc12345.tmp',
    Buffer.from('{"backlog": []}'),
    { mode: 0o644 }
  );
});
```

### Verify Temp File Content

```typescript
test('should write correct content to temp file', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const content = 'test content';

  await atomicWrite('/path/to/file.txt', content);

  expect(mockWriteFile).toHaveBeenCalledWith(
    expect.any(String),
    Buffer.from(content)
  );

  // Get the actual temp file path from mock calls
  const tempFilePath = mockWriteFile.mock.calls[0][0];
  expect(tempFilePath).toContain('.tmp');
});
```

### Verify Rename After Successful Write

```typescript
test('should rename temp file to final destination after successful write', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);

  mockWriteFile.mockResolvedValue();

  await atomicWrite('/path/to/file.txt', 'content');

  // Verify write was called with temp file
  const tempFileCall = mockWriteFile.mock.calls[0];
  expect(tempFileCall[0]).toContain('.tmp');

  // Verify rename was called
  expect(mockRename).toHaveBeenCalledTimes(1);
  expect(mockRename).toHaveBeenCalledWith(
    expect.stringContaining('.tmp'),
    '/path/to/file.txt'
  );
});
```

### Test Cleanup on Failure

```typescript
test('should clean up temp file on write failure', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockUnlink = vi.mocked(unlink);

  // Simulate write failure
  mockWriteFile.mockRejectedValue(new Error('Disk full'));

  await expect(atomicWrite('/path/to/file.txt', 'content'))
    .rejects.toThrow('Disk full');

  // Verify unlink was called to clean up temp file
  expect(mockUnlink).toHaveBeenCalledTimes(1);

  // Verify temp file path is correct
  const unlinkCall = mockUnlink.mock.calls[0];
  expect(unlinkCall[0]).toContain('.tmp');
});
```

## 3. Async Error Testing in Vitest

### Test Promise Rejection with Mocks

```typescript
test('should reject when rename fails', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);

  // Mock successful write but failed rename
  mockWriteFile.mockResolvedValue();
  mockRename.mockRejectedValue(new Error('Permission denied'));

  await expect(atomicWrite('/path/to/file.txt', 'content'))
    .rejects.toThrow('Permission denied');

  // Verify temp file was cleaned up
  const mockUnlink = vi.mocked(unlink);
  expect(mockUnlink).toHaveBeenCalledTimes(1);
});
```

### Verify Error Handling Preserves State

```typescript
test('should preserve error state when operations fail', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);
  const originalError = new Error('Network error');

  mockWriteFile.mockRejectedValueOnce(originalError);

  const error = await atomicWrite('/path/to/file.txt', 'content')
    .catch(e => e);

  expect(error).toBe(originalError);
  expect(error.message).toBe('Network error');
});
```

### Test Retry Logic

```typescript
test('should retry operation after failure', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);

  // Fail first attempt, succeed second
  mockWriteFile
    .mockRejectedValueOnce(new Error('Temporary failure'))
    .mockResolvedValue();

  mockRename
    .mockRejectedValueOnce(new Error('Temporary failure'))
    .mockResolvedValue();

  await atomicWrite('/path/to/file.txt', 'content');

  // Verify both operations were attempted twice
  expect(mockWriteFile).toHaveBeenCalledTimes(2);
  expect(mockRename).toHaveBeenCalledTimes(2);
});
```

### Assertion Patterns for Async Operations

```typescript
test('should handle async operations with proper timing', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);

  // Use async/await with proper timing
  const writePromise = atomicWrite('/path/to/file.txt', 'content');

  // Verify mocks are called before promise resolves
  expect(mockWriteFile).toHaveBeenCalled();

  await writePromise;

  // Verify rename was called after write succeeded
  expect(mockRename).toHaveBeenCalled();
});
```

## 4. Example Test Patterns

### Complete Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { writeFile, rename, unlink } from 'node:fs/promises';
import { atomicWrite } from './atomic-write';

// Mock setup before any imports
vi.mock('node:fs/promises');

describe('atomicWrite', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should write atomically with temp file', async () => {
    const mockWriteFile = vi.mocked(writeFile);
    const mockRename = vi.mocked(rename);

    // Setup successful mocks
    mockWriteFile.mockResolvedValue();
    mockRename.mockResolvedValue();

    await atomicWrite('/test/file.txt', 'content');

    // Verify temp file pattern
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/file\.tmp\.[a-f0-9]{8}/),
      Buffer.from('content')
    );

    // Verify rename
    const tempPath = mockWriteFile.mock.calls[0][0];
    expect(mockRename).toHaveBeenCalledWith(tempPath, '/test/file.txt');
  });

  it('should clean up on failure', async () => {
    const mockWriteFile = vi.mocked(writeFile);
    const mockUnlink = vi.mocked(unlink);

    mockWriteFile.mockRejectedValue(new Error('Write failed'));

    await expect(atomicWrite('/test/file.txt', 'content'))
      .rejects.toThrow('Write failed');

    expect(mockUnlink).toHaveBeenCalled();
  });
});
```

### Common Mistakes and How to Avoid Them

#### 1. Mock Setup Order

**Mistake**:
```typescript
// ❌ Import before mocking
import { writeFile } from 'node:fs/promises';
vi.mock('node:fs/promises');
```

**Solution**:
```typescript
// ✅ Mock before importing
vi.mock('node:fs/promises');
import { writeFile } from 'node:fs/promises';
```

#### 2. Not Using vi.mocked()

**Mistake**:
```typescript
// ❌ No type safety
writeFile.mockResolvedValue();
```

**Solution**:
```typescript
// ✅ Type-safe
const mockWriteFile = vi.mocked(writeFile);
mockWriteFile.mockResolvedValue();
```

#### 3. Not Cleaning Up Mocks

**Mistake**:
```typescript
// ❌ Mocks persist between tests
test('test 1', () => {
  writeFile.mockResolvedValue();
});

test('test 2', () => {
  // writeFile still has previous mock!
});
```

**Solution**:
```typescript
// ✅ Clean up after each test
beforeEach(() => {
  vi.clearAllMocks();
});
```

#### 4. Incorrect Path Matching

**Mistake**:
```typescript
// ❌ Too specific path match
expect(writeFile).toHaveBeenCalledWith('/test/file.tmp.12345678', content);
```

**Solution**:
```typescript
// ✅ Use flexible pattern matching
expect(writeFile).toHaveBeenCalledWith(
  expect.stringMatching(/file\.tmp\.[a-f0-9]{8}/),
  content
);
```

### Best Practices

1. **Mock Setup**: Always mock before importing modules
2. **Type Safety**: Use `vi.mocked()` for type-safe access
3. **Cleanup**: Clear mocks in `beforeEach` to prevent test pollution
4. **Path Matching**: Use `expect.stringMatching()` for file paths
5. **Error Testing**: Always test both success and failure cases
6. **Async Patterns**: Use async/await properly with `expect().rejects`
7. **Isolation**: Each test should set up its own mock behavior

### Testing with External Dependencies

```typescript
// Mock multiple related modules
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomBytes: vi.fn().mockReturnValue(Buffer.from('test1234')),
}));

// Test complete flow
test('should handle full atomic write flow', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);
  const mockRandomBytes = vi.mocked(randomBytes);

  mockWriteFile.mockResolvedValue();
  mockRename.mockResolvedValue();

  const result = await atomicWrite('/test/file.txt', 'content');

  expect(mockRandomBytes).toHaveBeenCalled();
  expect(mockWriteFile).toHaveBeenCalled();
  expect(mockRename).toHaveBeenCalled();
  expect(result).toBeUndefined(); // or expected return value
});
```

### Testing Edge Cases

```typescript
test('should handle concurrent atomic writes to same file', async () => {
  const mockWriteFile = vi.mocked(writeFile);
  const mockRename = vi.mocked(rename);

  // Allow concurrent writes
  mockWriteFile.mockResolvedValue();
  mockRename.mockResolvedValue();

  const promises = [
    atomicWrite('/test/file.txt', 'content1'),
    atomicWrite('/test/file.txt', 'content2'),
  ];

  await Promise.all(promises);

  // Verify both operations completed
  expect(mockWriteFile).toHaveBeenCalledTimes(2);
  expect(mockRename).toHaveBeenCalledTimes(2);
});
```

## References

### Official Documentation

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Vitest API Reference](https://vitest.dev/api/)
- [Vitest TypeScript Support](https://vitest.dev/guide/typescript.html)

### Additional Resources

- [Vitest GitHub Repository](https://github.com/vitest-dev/vitest)
- [Node.js fs/promises Documentation](https://nodejs.org/api/fs.html#fs_fspromises)
- [TypeMock Examples](https://github.com/TypeMock/typemock-examples/tree/main/vitest)

### Community Examples

- [StackOverflow: Vitest mocking](https://stackoverflow.com/questions/tagged/vitest)
- [GitHub: Vitest test examples](https://github.com/topics/vitest-testing)
- [Vitest Discord Community](https://discord.gg/vitest)