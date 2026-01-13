# Quick Reference: Mocking fs/promises in TypeScript with Vitest

## Essential Mock Patterns

### 1. Module-Level Mock Setup

```typescript
// Place at top of test file, before imports
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  rename: vi.fn(),
}));

import * as fs from 'node:fs/promises';
```

### 2. Test Structure Template

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should succeed', async () => {
    // Arrange
    vi.mocked(fs.readFile).mockResolvedValue('content');

    // Act
    const result = await readFile('path');

    // Assert
    expect(result).toBe('content');
  });
});
```

### 3. Type-Safe Mocking

```typescript
// ✅ CORRECT
vi.mocked(fs.readFile)
  .mockResolvedValue('content')(
    // ❌ WRONG
    fs.readFile as any
  )
  .mockResolvedValue('content');
```

### 4. Error Simulation

```typescript
// Create error
const error = new Error('Not found') as NodeJS.ErrnoException;
error.code = 'ENOENT';
error.errno = -2;
error.path = '/path/to/file';

// Use in mock
vi.mocked(fs.readFile).mockRejectedValue(error);

// Test
await expect(readFile('path')).rejects.toMatchObject({
  code: 'ENOENT',
});
```

## Common Error Codes

| Code      | Name                 | errno | Typical Scenario                  |
| --------- | -------------------- | ----- | --------------------------------- |
| ENOENT    | File not found       | -2    | Reading non-existent file         |
| EACCES    | Permission denied    | -13   | Writing to protected location     |
| EEXIST    | File exists          | -17   | Creating existing directory       |
| EISDIR    | Is a directory       | -21   | Reading directory as file         |
| ENOTDIR   | Not a directory      | -20   | Traversing file as directory      |
| ENOTEMPTY | Not empty            | -39   | Removing non-empty directory      |
| EROFS     | Read-only filesystem | -30   | Writing to read-only mount        |
| EMFILE    | Too many open files  | -24   | Exceeding file descriptor limit   |
| EAGAIN    | Try again            | -11   | Temporary resource unavailability |
| EBUSY     | Device busy          | -16   | Resource temporarily locked       |

## Mock Patterns Reference

### Mock Return Values

```typescript
// Single call
vi.mocked(fs.readFile).mockResolvedValueOnce('content');

// Multiple calls
vi.mocked(fs.readFile)
  .mockResolvedValueOnce('first')
  .mockResolvedValueOnce('second')
  .mockResolvedValue('default');

// All calls
vi.mocked(fs.readFile).mockResolvedValue('content');
```

### Mock Conditional Behavior

```typescript
vi.mocked(fs.readFile).mockImplementation(path => {
  if (path === '/special.txt') {
    return Promise.resolve('special content');
  }
  return Promise.resolve('default content');
});
```

### Mock Synchronous Operations

```typescript
vi.mock('node:fs', () => ({
  default: {
    statSync: vi.fn(),
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  },
}));

// Use
vi.mocked(fsSync.existsSync).mockReturnValue(true);
```

## Atomic Write Testing

### Verify Operation Order

```typescript
const writeSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValue(undefined);

await atomicWrite('file.txt', 'content');

// Verify order
expect(writeSpy.mock.invocationCallOrder[0]).toBeLessThan(
  renameSpy.mock.invocationCallOrder[0]
);
```

### Test Failure Cleanup

```typescript
vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
vi.spyOn(fs, 'rename').mockRejectedValue(new Error('Failed'));
const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined);

await expect(atomicWriteWithCleanup('file.txt', 'content')).rejects.toThrow();

// Verify cleanup
expect(unlinkSpy).toHaveBeenCalledWith('file.txt.tmp');
```

## Common Pitfalls Solutions

### 1. Forgetting to Restore Mocks

```typescript
afterEach(() => {
  vi.restoreAllMocks();
});
```

### 2. Not Clearing Mocks Between Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. Losing Type Safety

```typescript
// Use vi.mocked() for type safety
vi.mocked(fs.readFile).mockResolvedValue('content');
```

### 4. Not Testing Error Cases

```typescript
// Always test both success and failure
it('should handle errors', async () => {
  const error = createFSError('ENOENT', 'Not found');
  vi.mocked(fs.readFile).mockRejectedValue(error);
  await expect(readFile('path')).rejects.toMatchObject({ code: 'ENOENT' });
});
```

## Assertion Patterns

### Verify Function Calls

```typescript
// Called
expect(fs.readFile).toHaveBeenCalled();

// Called with specific args
expect(fs.readFile).toHaveBeenCalledWith('path', 'utf-8');

// Called specific number of times
expect(fs.readFile).toHaveBeenCalledTimes(3);

// Called with specific args (last call)
expect(fs.readFile).toHaveBeenLastCalledWith('path', 'utf-8');
```

### Verify Call Order

```typescript
const spy1 = vi.spyOn(fs, 'readFile');
const spy2 = vi.spyOn(fs, 'writeFile');

await operation();

expect(spy1.mock.invocationCallOrder[0]).toBeLessThan(
  spy2.mock.invocationCallOrder[0]
);
```

### Async Assertions

```typescript
// Success
await expect(promise).resolves.toBe('value');

// Error
await expect(promise).rejects.toThrow();

// Error with object match
await expect(promise).rejects.toMatchObject({
  code: 'ENOENT',
});
```

## Testing Checklist

- [ ] Mock setup at top level
- [ ] Type-safe mocking with `vi.mocked()`
- [ ] Clean up in `afterEach()` or `beforeEach()`
- [ ] Test success scenarios
- [ ] Test failure scenarios
- [ ] Test edge cases (empty, large, special chars)
- [ ] Verify operation order for multi-step operations
- [ ] Test error recovery and cleanup
- [ ] Use proper error codes and errno values
- [ ] Test both async and sync operations

## Useful Helper Functions

```typescript
// Create FS error
function createFSError(
  code: string,
  message: string,
  path?: string
): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = code;
  error.errno = getErrno(code);
  error.syscall = getSyscall(code);
  if (path) error.path = path;
  return error;
}

// Error code mappings
const getErrno = (code: string): number =>
  ({
    ENOENT: -2,
    EACCES: -13,
    EEXIST: -17,
    EISDIR: -21,
    ENOTDIR: -20,
    ENOTEMPTY: -39,
    EROFS: -30,
    EMFILE: -24,
    EAGAIN: -11,
  })[code] || -1;
```

## Resources

- **Vitest Docs**: https://vitest.dev/guide/mocking.html
- **Node.js FS**: https://nodejs.org/api/fs.html
- **Full Examples**: See `fs-mocking-examples.ts`
- **Detailed Guide**: See `fs-mocking-research.md`
