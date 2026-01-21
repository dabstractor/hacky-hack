# External Best Practices Research

## Summary

External research on atomic file write patterns, Zod validation testing, integration testing, and single source of truth verification patterns to supplement codebase research.

## 1. Atomic Write Patterns

### Core Pattern: Temp File + Rename for Corruption Prevention

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath); // Atomic operation
  } catch (error) {
    await unlink(tempPath).catch(() => {}); // Cleanup
    throw error;
  }
}
```

### Best Practices

1. **Use unique temp filenames** with `randomBytes()` to avoid concurrent write conflicts
2. **Write temp file in same directory** as target to ensure atomic rename (same filesystem)
3. **Always cleanup temp files** on error to prevent orphaned `.tmp` files
4. **Set appropriate file permissions** (`0o644`) on temp file before rename
5. **Validate data before writing** to prevent corruption

### Common Pitfalls

- Writing temp file to different filesystem (causes `EXDEV` error)
- Using predictable temp names (race conditions)
- Not cleaning up temp files on error
- Not validating JSON before writing
- Cross-platform differences (Windows vs POSIX)

### External URLs

**Official Documentation:**

- Node.js fs.promises.rename(): https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
- Node.js fs.promises.writeFile(): https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
- Node.js Error Codes: https://nodejs.org/api/errors.html#common-system-errors
- POSIX rename() specification: https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html

**Community Resources:**

- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Atomic file writes blog: https://manuel.bleichschmidt.de/blog/120706/atomic-file-writes-with-nodejs/

**NPM Packages:**

- write-file-atomic: https://github.com/npm/write-file-atomic
- atomically: https://github.com/fabiospampinato/atomically
- write-json-file: https://github.com/sindresorhus/write-json-file
- steno: https://github.com/typicode/steno

## 2. Zod Testing Best Practices

### Primary Testing Method: Use `safeParse()` instead of `parse()`

```typescript
// ✅ Recommended: safeParse for tests
const result = MySchema.safeParse(data);
expect(result.success).toBe(true);
if (result.success) {
  expect(result.data.field).toBe(expected);
}

// ❌ Avoid: parse with try/catch
try {
  MySchema.parse(data);
  expect(true).toBe(true);
} catch (err) {
  expect(err).toBeInstanceOf(z.ZodError);
}
```

### Testing Patterns

#### 1. Test Each Validation Rule Individually

```typescript
test.each([1, 2, 3, 5, 8, 13, 21])('should accept %d story points', points => {
  const result = SubtaskSchema.safeParse({
    ...validSubtask,
    story_points: points,
  });
  expect(result.success).toBe(true);
});
```

#### 2. Test Error Messages and Paths

```typescript
if (!result.success) {
  expect(result.error.issues[0].path).toEqual(['fieldName']);
  expect(result.error.issues[0].message).toContain('expected message');
}
```

#### 3. Test Type Coercion

```typescript
it('should reject string numbers', () => {
  const result = schema.safeParse({ numberField: '123' as any });
  expect(result.success).toBe(false);
});
```

#### 4. Test Nested Validation

```typescript
it('should validate nested structure', () => {
  const result = NestedSchema.safeParse({
    id: 'P1',
    subtasks: [{ id: 'S1', title: '' }], // Invalid: empty title
  });
  expect(result.success).toBe(false);
});
```

### Best Practices

- Use `test.each()` for multiple test cases
- Assert on specific error properties (path, message, count)
- Test boundary values (min/max, edge cases)
- Test type safety and coercion
- Verify error messages are descriptive

### External URLs

**Official Documentation:**

- Zod API Documentation: https://zod.dev/api
- Zod GitHub Repository: https://github.com/colinhacks/zod

**Test Files in Zod:**

- `/node_modules/zod/src/v3/tests/object.test.ts`
- `/node_modules/zod/src/v3/tests/number.test.ts`
- `/node_modules/zod/src/v3/tests/string.test.ts`
- `/node_modules/zod/src/v3/tests/refinements.test.ts`
- `/node_modules/zod/src/v3/tests/error.test.ts`

## 3. Integration Test Best Practices

### Setup/Execute/Verify Pattern

```typescript
describe('File Operations Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // SETUP: Create unique temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
  });

  afterEach(() => {
    // CLEANUP: Remove temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should write and read files correctly', () => {
    // EXECUTE: Call the method
    const result = await myFunction(tempDir);

    // VERIFY: Check expectations
    expect(result).toBeDefined();
  });
});
```

### Mock vs Real File System

**Unit Tests (Mocked):**

```typescript
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
});

const mockReadFile = vi.mocked(readFile);
mockReadFile.mockResolvedValue(Buffer.from('content'));
```

**Integration Tests (Real FS):**

```typescript
it('should handle real file operations', async () => {
  const testFile = join(tempDir, 'test.txt');
  writeFileSync(testFile, 'content');

  const result = await myFunction(testFile);
  expect(result).toBeDefined();
});
```

### Test Isolation

- Use unique temp directories per test
- Clean up even on test failure
- Use `beforeEach`/`afterEach` hooks
- Clear mocks between tests

### External URLs

**Official Documentation:**

- Vitest Mocking Guide: https://vitest.dev/guide/mocking.html
- Vitest vi.mock API: https://vitest.dev/api/vi.html#vi-mock
- Vitest vi.mocked() Helper: https://vitest.dev/api/vi.html#vi-mocked
- Vitest Test Context: https://vitest.dev/api/context.html
- Node.js fs/promises API: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options

**Community Resources:**

- Vitest GitHub Examples: https://github.com/vitest-dev/vitest/tree/main/examples/mocking

**Alternative Libraries:**

- memfs: In-memory file system for Node.js
- tmp: Temporary file and directory creation
- fake-fs: File system mocking library

## 4. Single Source of Truth Verification

### Testing That File is Only Source of State

```typescript
describe('Single Source of Truth Verification', () => {
  it('should verify file is only source of state', async () => {
    // 1. Load initial state from file
    const state1 = await loadState('/path/to/state.json');

    // 2. Modify in-memory state
    state1.update('key', 'value1');

    // 3. Load again without saving
    const state2 = await loadState('/path/to/state.json');

    // 4. Verify file is source of truth (in-memory changes not persisted)
    expect(state2.data.key).not.toBe('value1');
  });

  it('should verify no state duplication', () => {
    const manager = new StateManager('/path/to/state.json');

    // Verify only one representation exists
    expect(manager['state']).toBeDefined();
    expect(manager['cache']).toBeUndefined();
    expect(manager['duplicate']).toBeUndefined();
  });

  it('should verify file reload clears in-memory state', async () => {
    const manager = new StateManager('/path/to/state.json');
    manager.update('key', 'value1');

    await manager.reload();

    // Verify in-memory changes cleared
    expect(manager.get('key')).not.toBe('value1');
  });
});
```

### Mocking Complex State Transitions

```typescript
it('should mock state transitions without file I/O', () => {
  const mockReadFile = vi.mocked(readFile);

  // Mock initial state
  mockReadFile.mockResolvedValueOnce(Buffer.from('{"version": 1, "data": {}}'));

  // Mock updated state
  mockReadFile.mockResolvedValueOnce(
    Buffer.from('{"version": 2, "data": {"key": "value"}}')
  );

  // Test transitions without real file writes
  const state1 = await loadState();
  state1.update('key', 'value');
  await state1.save();

  const state2 = await loadState();
  expect(state2.version).toBe(2);
});
```

### Best Practices

- Test that in-memory changes don't persist without explicit save
- Verify file reload clears cached state
- Mock file I/O to test state transitions independently
- Assert on single state representation
- Test concurrent access scenarios

## 5. Testing State Update Flow

### Verify All Updates Flow Through Single Point

```typescript
describe('State Update Flow Verification', () => {
  it('should verify all updates flow through SessionManager', async () => {
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // Spy on saveBacklog to track writes
    const saveSpy = vi.spyOn(manager, 'saveBacklog');

    // Perform update
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    await manager.flushUpdates();

    // Verify saveBacklog was called (write happened)
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should verify no direct file writes', async () => {
    // Ensure no code bypasses SessionManager
    // This is a code review + grep test
    const fsWritePattern = /writeFileSync\([^)]*tasks\.json/;
    const files = glob('src/**/*.ts');
    const violations = files.filter(file => {
      const content = readFileSync(file, 'utf-8');
      return fsWritePattern.test(content);
    });

    expect(violations).toHaveLength(0);
  });
});
```

## 6. Testing Temp File Cleanup

```typescript
describe('Temp File Cleanup Verification', () => {
  it('should clean up temp files after successful write', async () => {
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();
    const sessionPath = manager.currentSession!.metadata.path;

    // Save backlog
    await manager.saveBacklog(createMinimalBacklog());

    // Verify no .tmp files remain
    const files = readdirSync(sessionPath);
    const tempFiles = files.filter(f => f.endsWith('.tmp'));
    expect(tempFiles).toHaveLength(0);
  });

  it('should clean up temp files on error', async () => {
    // Force write error by making directory read-only
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();
    const sessionPath = manager.currentSession!.metadata.path;

    // Mock writeFile to fail
    vi.spyOn(fsPromises, 'writeFile').mockRejectedValueOnce(
      new Error('Write failed')
    );

    try {
      await manager.saveBacklog(createMinimalBacklog());
    } catch (error) {
      // Expected error
    }

    // Verify no .tmp files remain
    const files = readdirSync(sessionPath);
    const tempFiles = files.filter(f => f.endsWith('.tmp'));
    expect(tempFiles).toHaveLength(0);
  });
});
```

## Summary of External URLs

### Official Documentation

1. Node.js File System: https://nodejs.org/api/fs.html
2. Node.js Error Codes: https://nodejs.org/api/errors.html#common-system-errors
3. POSIX rename(): https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html
4. Zod API: https://zod.dev/api
5. Vitest Mocking: https://vitest.dev/guide/mocking.html
6. Vitest API: https://vitest.dev/api/vi.html#vi-mock

### Community Resources

1. Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
2. Atomic Writes Blog: https://manuel.bleichschmidt.de/blog/120706/atomic-file-writes-with-nodejs/
3. Vitest Examples: https://github.com/vitest-dev/vitest/tree/main/examples/mocking
4. Zod GitHub: https://github.com/colinhacks/zod

### NPM Packages

1. write-file-atomic: https://github.com/npm/write-file-atomic
2. atomically: https://github.com/fabiospampinato/atomically
3. memfs: In-memory file system for testing
4. tmp: Temporary file creation utilities
