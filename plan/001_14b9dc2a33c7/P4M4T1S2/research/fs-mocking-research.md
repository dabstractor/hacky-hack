# Best Practices for Mocking fs/promises in TypeScript using Vitest

## Table of Contents
1. [Mocking fs.promises Functions](#1-mocking-fspromises-functions)
2. [Mocking Synchronous fs Operations](#2-mocking-synchronous-fs-operations)
3. [Testing Atomic Write Patterns](#3-testing-atomic-write-patterns)
4. [Error Simulation Patterns](#4-error-simulation-patterns)
5. [Common Pitfalls](#5-common-pitfalls)
6. [Resources and References](#resources-and-references)

---

## 1. Mocking fs.promises Functions

### 1.1 Basic Mocking with vi.mock()

The most common approach for mocking `fs/promises` in Vitest:

```typescript
// fileUtils.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'node:fs/promises'
import { readAndProcessFile } from './fileUtils'

// Mock at the top level - must be before imports
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  rename: vi.fn(),
}))

describe('File operations with mocked fs.promises', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should read a file successfully', async () => {
    const mockContent = 'file content'
    vi.mocked(fs.readFile).mockResolvedValueOnce(mockContent)

    const result = await readAndProcessFile('test.txt')

    expect(fs.readFile).toHaveBeenCalledWith('test.txt', 'utf-8')
    expect(result).toBe(mockContent)
  })

  it('should write to a file', async () => {
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined)

    await writeToFile('output.txt', 'content')

    expect(fs.writeFile).toHaveBeenCalledWith(
      'output.txt',
      'content',
      'utf-8'
    )
  })
})
```

**Best Practices:**
- Always use `vi.mocked()` for proper TypeScript type inference
- Place `vi.mock()` calls at the top level, before imports
- Use `mockResolvedValueOnce()` for single-call scenarios
- Clean up mocks in `beforeEach()` with `vi.clearAllMocks()`

### 1.2 Using vi.spyOn() for Selective Mocking

When you only need to mock specific functions while keeping others real:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs/promises'

describe('Selective mocking with spyOn', () => {
  let readFileSpy: vi.SpyInstance

  beforeEach(() => {
    readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockResolvedValue('mocked content')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should use mocked readFile', async () => {
    const content = await fs.readFile('test.txt', 'utf-8')
    expect(content).toBe('mocked content')
    expect(readFileSpy).toHaveBeenCalled()
  })
})
```

### 1.3 Mocking Complex Return Values

For functions that return objects (like `stat`):

```typescript
it('should mock fs.stat with Stats object', async () => {
  const mockStats = {
    isFile: () => true,
    isDirectory: () => false,
    isSymbolicLink: () => false,
    size: 1024,
    mode: 0o666,
    mtime: new Date(),
    atime: new Date(),
    birthtime: new Date(),
    blksize: 4096,
    blocks: 8,
    dev: 16777220,
    gid: 20,
    ino: 12345678,
    nlink: 1,
    rdev: 0,
    uid: 501,
  }

  vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as any)

  const stats = await fs.stat('file.txt')
  expect(stats.isFile()).toBe(true)
  expect(stats.size).toBe(1024)
})
```

### 1.4 Directory Operations Mocking

```typescript
describe('Directory operations', () => {
  it('should mock mkdir', async () => {
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined)

    await createDirectory('/path/to/dir')

    expect(fs.mkdir).toHaveBeenCalledWith('/path/to/dir', {
      recursive: true,
    })
  })

  it('should mock readdir', async () => {
    const mockFiles = ['file1.txt', 'file2.txt', 'subdir']
    vi.mocked(fs.readdir).mockResolvedValueOnce(mockFiles as any)

    const files = await fs.readdir('/path/to/dir')

    expect(files).toEqual(mockFiles)
  })
})
```

---

## 2. Mocking Synchronous fs Operations

### 2.1 Mocking statSync

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'node:fs'

vi.mock('node:fs', () => ({
  default: {
    statSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}))

describe('Synchronous fs operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mock statSync', () => {
    const mockStats = {
      isFile: () => true,
      isDirectory: () => false,
      size: 2048,
      mode: 0o644,
      mtime: new Date(),
    }

    vi.mocked(fs.statSync).mockReturnValueOnce(mockStats as any)

    const stats = fs.statSync('file.txt')
    expect(stats.isFile()).toBe(true)
    expect(stats.size).toBe(2048)
  })

  it('should mock existsSync', () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true)

    const exists = fs.existsSync('file.txt')
    expect(exists).toBe(true)
  })

  it('should mock readFileSync', () => {
    const content = 'sync file content'
    vi.mocked(fs.readFileSync).mockReturnValueOnce(content as any)

    const fileContent = fs.readFileSync('file.txt', 'utf-8')
    expect(fileContent).toBe(content)
  })
})
```

### 2.2 Conditional Mocking Based on Path

```typescript
it('should conditionally mock based on path', () => {
  vi.spyOn(fs, 'statSync').mockImplementation((path: string) => {
    if (path === '/special/file.txt') {
      return {
        isFile: () => true,
        size: 999,
      } as any
    }
    // Fall back to real implementation for other paths
    return vi.getActualCurrent(fs.statSync)(path)
  })

  const specialStats = fs.statSync('/special/file.txt')
  expect(specialStats.size).toBe(999)
})
```

### 2.3 Mocking Multiple Synchronous Operations

```typescript
describe('Complex synchronous operations', () => {
  it('should handle multiple sync operations together', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.statSync).mockReturnValue({
      isFile: () => true,
      size: 1024,
    } as any)
    vi.mocked(fs.readFileSync).mockReturnValue('content' as any)

    const filePath = '/path/to/file.txt'

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(stats.isFile()).toBe(true)
      expect(content).toBe('content')
    }
  })
})
```

---

## 3. Testing Atomic Write Patterns

Atomic writes typically use a temporary file followed by a rename operation. Here's how to test this pattern:

### 3.1 Basic Atomic Write Mocking

```typescript
// Implementation to test
async function atomicWrite(
  filepath: string,
  content: string
): Promise<void> {
  const tmpPath = `${filepath}.tmp`
  await fs.writeFile(tmpPath, content, 'utf-8')
  await fs.rename(tmpPath, filepath)
}

// Test
describe('Atomic write pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should write to temp file then rename', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockResolvedValue(undefined)
    const renameSpy = vi
      .spyOn(fs, 'rename')
      .mockResolvedValue(undefined)

    await atomicWrite('/target/file.txt', 'content')

    // Verify temp file was written first
    expect(writeFileSpy).toHaveBeenCalledWith(
      '/target/file.txt.tmp',
      'content',
      'utf-8'
    )

    // Verify rename happened after write
    expect(renameSpy).toHaveBeenCalledWith(
      '/target/file.txt.tmp',
      '/target/file.txt'
    )

    // Verify operation order
    expect(writeFileSpy.mock.invocationCallOrder[0]).toBeLessThan(
      renameSpy.mock.invocationCallOrder[0]
    )
  })
})
```

### 3.2 Testing Atomic Write Failures

```typescript
describe('Atomic write failure scenarios', () => {
  it('should not rename if write fails', async () => {
    vi.spyOn(fs, 'writeFile').mockRejectedValue(
      new Error('Write failed')
    )
    const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValue(undefined)

    await expect(
      atomicWrite('/target/file.txt', 'content')
    ).rejects.toThrow('Write failed')

    // Rename should not have been attempted
    expect(renameSpy).not.toHaveBeenCalled()
  })

  it('should handle rename failure', async () => {
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined)
    vi.spyOn(fs, 'rename').mockRejectedValue(new Error('Rename failed'))

    await expect(
      atomicWrite('/target/file.txt', 'content')
    ).rejects.toThrow('Rename failed')
  })
})
```

### 3.3 Testing Cleanup on Failure

```typescript
// Implementation with cleanup
async function atomicWriteWithCleanup(
  filepath: string,
  content: string
): Promise<void> {
  const tmpPath = `${filepath}.tmp`
  try {
    await fs.writeFile(tmpPath, content, 'utf-8')
    await fs.rename(tmpPath, filepath)
  } catch (error) {
    // Cleanup temp file on failure
    try {
      await fs.unlink(tmpPath)
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

// Test
describe('Atomic write with cleanup', () => {
  it('should cleanup temp file on rename failure', async () => {
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined)
    vi.spyOn(fs, 'rename').mockRejectedValue(new Error('Rename failed'))
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)

    await expect(
      atomicWriteWithCleanup('/target/file.txt', 'content')
    ).rejects.toThrow('Rename failed')

    // Verify cleanup happened
    expect(unlinkSpy).toHaveBeenCalledWith('/target/file.txt.tmp')
  })
})
```

### 3.4 Testing Atomic Read-Modify-Write

```typescript
// Implementation
async function atomicModify(
  filepath: string,
  modifier: (content: string) => string
): Promise<void> {
  const currentContent = await fs.readFile(filepath, 'utf-8')
  const newContent = modifier(currentContent)
  await atomicWrite(filepath, newContent)
}

// Test
describe('Atomic read-modify-write', () => {
  it('should read, modify, and write atomically', async () => {
    const readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockResolvedValue('original content')
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined)
    const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValue(undefined)

    await atomicModify('/target/file.txt', (content) =>
      content.toUpperCase()
    )

    expect(readFileSpy).toHaveBeenCalledWith('/target/file.txt', 'utf-8')
    expect(writeFileSpy).toHaveBeenCalledWith(
      '/target/file.txt.tmp',
      'ORIGINAL CONTENT',
      'utf-8'
    )
    expect(renameSpy).toHaveBeenCalledWith(
      '/target/file.txt.tmp',
      '/target/file.txt'
    )
  })
})
```

---

## 4. Error Simulation Patterns

### 4.1 Creating File System Error Objects

```typescript
// Helper function to create Node.js-style errors
function createFSError(
  code: string,
  message: string,
  path?: string
): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException
  error.code = code
  error.errno = getErrnoFromCode(code)
  error.syscall = getSyscallFromCode(code)
  if (path) {
    error.path = path
  }
  return error
}

function getErrnoFromCode(code: string): number {
  const errnoMap: Record<string, number> = {
    ENOENT: -2,
    EACCES: -13,
    EEXIST: -17,
    EISDIR: -21,
    ENOTDIR: -20,
    ENOTEMPTY: -39,
    EROFS: -30,
    EMFILE: -24,
    ELOOP: -40,
  }
  return errnoMap[code] || -1
}

function getSyscallFromCode(code: string): string {
  const syscallMap: Record<string, string> = {
    ENOENT: 'open',
    EACCES: 'open',
    EEXIST: 'open',
    EISDIR: 'open',
    ENOTDIR: 'open',
    ENOTEMPTY: 'rmdir',
    EROFS: 'write',
    EMFILE: 'open',
    ELOOP: 'open',
  }
  return syscallMap[code] || 'unknown'
}
```

### 4.2 ENOENT (File Not Found)

```typescript
describe('ENOENT error handling', () => {
  it('should handle file not found error', async () => {
    const error = createFSError(
      'ENOENT',
      'No such file or directory',
      '/path/to/missing.txt'
    )

    vi.mocked(fs.readFile).mockRejectedValueOnce(error)

    await expect(
      fs.readFile('/path/to/missing.txt', 'utf-8')
    ).rejects.toThrow('No such file or directory')

    // Verify error properties
    await expect(
      fs.readFile('/path/to/missing.txt', 'utf-8')
    ).rejects.toMatchObject({
      code: 'ENOENT',
      errno: -2,
      path: '/path/to/missing.txt',
    })
  })

  it('should handle ENOENT in application code', async () => {
    const error = createFSError('ENOENT', 'File not found', 'config.json')
    vi.mocked(fs.readFile).mockRejectedValueOnce(error)

    const result = await loadConfigWithDefault('config.json')
    expect(result).toEqual({ default: true })
  })
})
```

### 4.3 EACCES (Permission Denied)

```typescript
describe('EACCES error handling', () => {
  it('should simulate permission denied', async () => {
    const error = createFSError(
      'EACCES',
      'Permission denied',
      '/protected/file.txt'
    )

    vi.mocked(fs.writeFile).mockRejectedValueOnce(error)

    await expect(
      fs.writeFile('/protected/file.txt', 'content')
    ).rejects.toMatchObject({
      code: 'EACCES',
      errno: -13,
    })
  })
})
```

### 4.4 EEXIST (File Already Exists)

```typescript
describe('EEXIST error handling', () => {
  it('should handle file exists error', async () => {
    const error = createFSError(
      'EEXIST',
      'File exists',
      '/path/to/file.txt'
    )

    vi.mocked(fs.mkdir).mockRejectedValueOnce(error)

    await expect(
      fs.mkdir('/path/to/file.txt')
    ).rejects.toMatchObject({
      code: 'EEXIST',
      errno: -17,
    })
  })

  it('should handle directory creation with existing check', async () => {
    // First call returns true (exists), second call throws
    vi.mocked(fs.stat)
      .mockResolvedValueOnce({ isDirectory: () => true } as any)
      .mockRejectedValueOnce(createFSError('EEXIST', 'File exists'))

    // Application should handle existing directory
    await createDirectoryIfNotExists('/existing/dir')
  })
})
```

### 4.5 Multiple Error Scenarios

```typescript
describe('Multiple error scenarios', () => {
  it('should handle different errors appropriately', async () => {
    const errorTests = [
      {
        code: 'ENOENT',
        shouldRetry: false,
        shouldUseDefault: true,
      },
      {
        code: 'EACCES',
        shouldRetry: false,
        shouldUseDefault: false,
      },
      {
        code: 'EISDIR',
        shouldRetry: false,
        shouldUseDefault: false,
      },
    ]

    for (const test of errorTests) {
      const error = createFSError(test.code, `Error: ${test.code}`)
      vi.mocked(fs.readFile).mockRejectedValueOnce(error)

      const result = await handleFileRead('/path/to/file')
      expect(result.useDefault).toBe(test.shouldUseDefault)
    }
  })
})
```

### 4.6 Error Recovery Testing

```typescript
describe('Error recovery patterns', () => {
  it('should retry on transient errors', async () => {
    // Fail twice, then succeed
    vi.mocked(fs.readFile)
      .mockRejectedValueOnce(createFSError('EAGAIN', 'Resource temporarily unavailable'))
      .mockRejectedValueOnce(createFSError('EAGAIN', 'Resource temporarily unavailable'))
      .mockResolvedValueOnce('success')

    const result = await readFileWithRetry('/path/to/file', { maxRetries: 3 })
    expect(result).toBe('success')
    expect(fs.readFile).toHaveBeenCalledTimes(3)
  })

  it('should fail after max retries', async () => {
    const error = createFSError('EAGAIN', 'Resource temporarily unavailable')
    vi.mocked(fs.readFile).mockRejectedValue(error)

    await expect(
      readFileWithRetry('/path/to/file', { maxRetries: 2 })
    ).rejects.toThrow('Resource temporarily unavailable')

    expect(fs.readFile).toHaveBeenCalledTimes(3) // initial + 2 retries
  })
})
```

---

## 5. Common Pitfalls

### 5.1 Mock Hoisting Issues

**Problem:** `vi.mock()` calls are hoisted to the top of the file, which can cause issues with dynamic imports or conditional mocking.

```typescript
// ❌ WRONG - Mock won't work due to hoisting
if (process.env.TEST_MODE === 'mocked') {
  vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(),
  }))
}

// ✅ CORRECT - Always mock at top level
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

// Use environment variables to control mock behavior
if (process.env.TEST_MODE !== 'mocked') {
  vi.doMock('node:fs/promises', () => require('node:fs/promises'))
}
```

### 5.2 Forgetting to Restore Mocks

**Problem:** Mocks persist across tests, causing unexpected behavior.

```typescript
// ❌ WRONG - No cleanup
describe('File operations', () => {
  it('test 1', () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue('data')
  })

  it('test 2', () => {
    // This test might use the mock from test 1!
    // Can lead to flaky tests
  })
})

// ✅ CORRECT - Always restore mocks
describe('File operations', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test 1', () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue('data')
  })

  it('test 2', () => {
    // Clean slate - mocks from test 1 are gone
  })
})
```

### 5.3 Type Safety Issues

**Problem:** Losing type safety when mocking.

```typescript
// ❌ WRONG - No type safety
vi.mocked(fs.readFile).mockResolvedValue('any value')

// ✅ CORRECT - Use proper typing
const mockContent: string = 'expected content'
vi.mocked(fs.readFile).mockResolvedValue(mockContent)

// Or use type assertions carefully
vi.mocked(fs.readFile).mockResolvedValue(
  'content' as unknown as Promise<Buffer>
)
```

### 5.4 Not Mocking All Used Functions

**Problem:** Partial mocking leads to mixed real/mock behavior.

```typescript
// ❌ WRONG - Only mocking some functions
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  // Forgot to mock writeFile, mkdir, etc.
}))

// ✅ CORRECT - Mock all used functions
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  rename: vi.fn(),
}))
```

### 5.5 Ignoring Async Error Handling

**Problem:** Not testing error cases properly.

```typescript
// ❌ WRONG - Only testing success case
it('should read file', async () => {
  vi.mocked(fs.readFile).mockResolvedValue('content')
  const result = await readFile('path')
  expect(result).toBe('content')
})

// ✅ CORRECT - Test both success and failure
it('should read file successfully', async () => {
  vi.mocked(fs.readFile).mockResolvedValue('content')
  const result = await readFile('path')
  expect(result).toBe('content')
})

it('should handle read errors', async () => {
  const error = createFSError('ENOENT', 'Not found', 'path')
  vi.mocked(fs.readFile).mockRejectedValue(error)
  await expect(readFile('path')).rejects.toMatchObject({
    code: 'ENOENT',
  })
})
```

### 5.6 Testing Implementation Details

**Problem:** Testing internal mock calls instead of behavior.

```typescript
// ❌ WRONG - Testing implementation
it('should call readFile', () => {
  vi.mocked(fs.readFile).mockResolvedValue('content')
  await processFile('path')
  expect(fs.readFile).toHaveBeenCalledWith('path', 'utf-8') // Too specific
})

// ✅ CORRECT - Testing behavior
it('should process file content', () => {
  vi.mocked(fs.readFile).mockResolvedValue('content')
  const result = await processFile('path')
  expect(result).toEqual({ processed: true, content: 'content' })
})
```

### 5.7 Not Cleaning Up Test Files

**Problem:** Leaving test artifacts behind.

```typescript
// ❌ WRONG - No cleanup
it('should create test file', async () => {
  // Creates real file!
  await fs.writeFile('/tmp/test.txt', 'content')
})

// ✅ CORRECT - Always cleanup or use mocks
it('should create test file with mock', async () => {
  vi.mocked(fs.writeFile).mockResolvedValue(undefined)
  await createFile('/tmp/test.txt', 'content')
  expect(fs.writeFile).toHaveBeenCalled()
})

// Or cleanup in afterEach
afterEach(async () => {
  try {
    await fs.unlink('/tmp/test.txt')
  } catch {
    // File might not exist
  }
})
```

### 5.8 Race Conditions in Async Tests

**Problem:** Tests pass/fail randomly due to timing issues.

```typescript
// ❌ WRONG - No proper await
it('should write files', async () => {
  writeFileConcurrent(['file1.txt', 'file2.txt'])
  // Not waiting for completion!
})

// ✅ CORRECT - Properly await async operations
it('should write files', async () => {
  await writeFileConcurrent(['file1.txt', 'file2.txt'])
  expect(fs.writeFile).toHaveBeenCalledTimes(2)
})
```

### 5.9 Not Testing Edge Cases

**Problem:** Only testing happy path.

```typescript
// ❌ WRONG - Only basic tests
it('should read file', async () => {
  vi.mocked(fs.readFile).mockResolvedValue('content')
  await expect(readFile('path')).resolves.toBe('content')
})

// ✅ CORRECT - Test edge cases
describe('readFile edge cases', () => {
  it('should handle empty file', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('')
    await expect(readFile('path')).resolves.toBe('')
  })

  it('should handle large file', async () => {
    const largeContent = 'x'.repeat(10_000_000)
    vi.mocked(fs.readFile).mockResolvedValue(largeContent)
    await expect(readFile('path')).resolves.toHaveLength(10_000_000)
  })

  it('should handle special characters', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('Hello\nWorld\t!')
    await expect(readFile('path')).resolves.toContain('\n')
  })

  it('should handle unicode', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('Hello 世界 🌍')
    await expect(readFile('path')).resolves.toContain('世界')
  })
})
```

### 5.10 Mock Ordering Issues

**Problem:** Mocks don't execute in expected order.

```typescript
// ❌ WRONG - Not checking order
it('should write then rename', async () => {
  vi.mocked(fs.writeFile).mockResolvedValue(undefined)
  vi.mocked(fs.rename).mockResolvedValue(undefined)
  await atomicWrite('file.txt', 'content')
  expect(fs.writeFile).toHaveBeenCalled()
  expect(fs.rename).toHaveBeenCalled()
  // Order not verified!
})

// ✅ CORRECT - Verify execution order
it('should write then rename in correct order', async () => {
  const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined)
  const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValue(undefined)

  await atomicWrite('file.txt', 'content')

  expect(writeFileSpy).toHaveBeenCalled()
  expect(renameSpy).toHaveBeenCalled()
  expect(writeFileSpy.mock.invocationCallOrder[0]).toBeLessThan(
    renameSpy.mock.invocationCallOrder[0]
  )
})
```

---

## 6. Best Practices Summary

### 6.1 Mock Setup

1. **Use `vi.mock()` at the top level** for module-wide mocking
2. **Use `vi.spyOn()`** for selective mocking within tests
3. **Always clean up mocks** in `afterEach()` or `beforeEach()`
4. **Use `vi.mocked()`** for proper TypeScript typing

### 6.2 Test Structure

1. **Arrange-Act-Assert pattern** for clear test structure
2. **Test both success and failure** scenarios
3. **Test edge cases** (empty files, large files, special characters)
4. **Verify execution order** for multi-step operations

### 6.3 Error Testing

1. **Create proper error objects** with correct error codes
2. **Test specific error handling** for different error types
3. **Verify error recovery** mechanisms work correctly
4. **Test retry logic** with failure scenarios

### 6.4 Atomic Operations

1. **Verify operation order** (write then rename)
2. **Test failure scenarios** at each step
3. **Verify cleanup** happens on failures
4. **Test for race conditions** in concurrent operations

### 6.5 Type Safety

1. **Maintain type safety** when mocking
2. **Use proper type assertions** sparingly
3. **Type mock return values** correctly
4. **Avoid `any`** when possible

---

## Resources and References

### Official Documentation

- **Vitest Mocking Guide** - https://vitest.dev/guide/mocking.html
  - Comprehensive guide on mocking in Vitest
  - Covers `vi.mock()`, `vi.spyOn()`, and mock utilities

- **Node.js File System Documentation** - https://nodejs.org/api/fs.html
  - Complete reference for fs and fs/promises APIs
  - Error codes and their meanings
  - Synchronous and asynchronous operations

### Vitest Examples

- **Vitest GitHub Examples** - https://github.com/vitest-dev/vitest/tree/main/examples
  - Official examples including mocking demonstrations
  - Real-world usage patterns

### Community Resources

- **Vitest Discord** - https://vitest.dev/discord
  - Active community for troubleshooting and tips

- **Stack Overflow - Vitest Tag** - https://stackoverflow.com/questions/tagged/vitest
  - Community Q&A for common issues

### Related Libraries

- **memfs** - https://github.com/streamich/memfs
  - In-memory file system for testing
  - Alternative to mocking for complex file system operations

- **mock-fs** - https://github.com/tschaub/mock-fs
  - Another in-memory file system mock library
  - Simpler API for basic mocking needs

### Testing Best Practices

- **JavaScript Testing Best Practices** - https://github.com/goldbergyoni/javascript-testing-best-practices
  - General testing principles applicable to file system testing

- **Node.js Error Handling** - https://nodejs.org/api/errors.html
  - Understanding Node.js error patterns
  - Common system error codes

### Code Examples

See the examples in this document for:
- Basic mocking patterns (Section 1)
- Synchronous operation mocking (Section 2)
- Atomic write testing (Section 3)
- Error simulation (Section 4)
- Common pitfalls and solutions (Section 5)

---

## Quick Reference

### Essential Mock Patterns

```typescript
// Module-level mock
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

// In-test mock with spy
const spy = vi.spyOn(fs, 'readFile').mockResolvedValue('content')

// Cleanup
afterEach(() => {
  vi.restoreAllMocks()
})

// Type-safe mock usage
vi.mocked(fs.readFile).mockResolvedValue('content')

// Error simulation
const error = new Error('Not found') as NodeJS.ErrnoException
error.code = 'ENOENT'
error.errno = -2
vi.mocked(fs.readFile).mockRejectedValue(error)
```

### Common Test Structure

```typescript
describe('Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should succeed', async () => {
    // Arrange
    vi.mocked(fs.readFile).mockResolvedValue('content')

    // Act
    const result = await readFile('path')

    // Assert
    expect(result).toBe('content')
  })

  it('should handle errors', async () => {
    // Arrange
    const error = createFSError('ENOENT', 'Not found')
    vi.mocked(fs.readFile).mockRejectedValue(error)

    // Act & Assert
    await expect(readFile('path')).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })
})
```

---

*Document Version: 1.0*
*Last Updated: 2025-01-13*
*Target Framework: Vitest 1.x+*
*Language: TypeScript 5.x+*
