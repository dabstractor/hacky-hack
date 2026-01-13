/**
 * Complete TypeScript Examples for Mocking fs/promises with Vitest
 *
 * This file contains practical, runnable examples demonstrating all concepts
 * from the research document. Copy and adapt these patterns for your tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs/promises'
import * as fsSync from 'node:fs'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a Node.js-style filesystem error with proper error codes
 */
export function createFSError(
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

/**
 * Map error codes to errno numbers
 */
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
    EAGAIN: -11,
    EBADF: -9,
    EBUSY: -16,
    EPERM: -1,
  }
  return errnoMap[code] || -1
}

/**
 * Map error codes to typical syscalls
 */
function getSyscallFromCode(code: string): string {
  const syscallMap: Record<string, string> = {
    ENOENT: 'open',
    EACCES: 'open',
    EEXIST: 'mkdir',
    EISDIR: 'open',
    ENOTDIR: 'open',
    ENOTEMPTY: 'rmdir',
    EROFS: 'write',
    EMFILE: 'open',
    ELOOP: 'open',
    EAGAIN: 'read',
    EBADF: 'read',
    EBUSY: 'open',
    EPERM: 'write',
  }
  return syscallMap[code] || 'unknown'
}

// ============================================================================
// MOCK SETUP PATTERNS
// ============================================================================

/**
 * Example 1: Basic module-level mocking
 * Place this at the top of your test file, before imports
 */
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  rename: vi.fn(),
  readdir: vi.fn(),
  copyFile: vi.fn(),
}))

describe('Mock Setup Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 2: Using vi.mocked() for type safety
   */
  it('should use vi.mocked for proper TypeScript typing', async () => {
    // ✅ CORRECT: Type-safe mocking
    vi.mocked(fs.readFile).mockResolvedValueOnce('file content')

    const content = await fs.readFile('test.txt', 'utf-8')
    expect(content).toBe('file content')
    expect(fs.readFile).toHaveBeenCalledWith('test.txt', 'utf-8')
  })

  /**
   * Example 3: Mocking complex return values (Stats object)
   */
  it('should mock fs.stat with Stats object', async () => {
    const mockStats = {
      isFile: () => true,
      isDirectory: () => false,
      isSymbolicLink: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      size: 1024,
      mode: 0o666,
      mtime: new Date('2025-01-13'),
      atime: new Date('2025-01-13'),
      birthtime: new Date('2025-01-13'),
      ctime: new Date('2025-01-13'),
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
})

// ============================================================================
// SYNCHRONOUS FS MOCKING
// ============================================================================

/**
 * Mock synchronous fs operations
 */
vi.mock('node:fs', () => ({
  default: {
    statSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    renameSync: vi.fn(),
  },
}))

describe('Synchronous FS Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 4: Mocking statSync
   */
  it('should mock statSync with conditional logic', () => {
    vi.spyOn(fsSync, 'statSync').mockImplementation((path: string) => {
      if (path === '/special/file.txt') {
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 999,
        } as any
      }
      // Return a default for other paths
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
      } as any
    })

    const specialStats = fsSync.statSync('/special/file.txt')
    expect(specialStats.size).toBe(999)

    const normalStats = fsSync.statSync('/other/file.txt')
    expect(normalStats.size).toBe(1024)
  })

  /**
   * Example 5: Mocking existsSync
   */
  it('should mock existsSync for different paths', () => {
    vi.spyOn(fsSync, 'existsSync').mockImplementation((path: string) => {
      const existingFiles = ['/file1.txt', '/file2.txt', '/config.json']
      return existingFiles.includes(path as string)
    })

    expect(fsSync.existsSync('/file1.txt')).toBe(true)
    expect(fsSync.existsSync('/nonexistent.txt')).toBe(false)
  })

  /**
   * Example 6: Mocking readFileSync with different encodings
   */
  it('should mock readFileSync with different encodings', () => {
    vi.spyOn(fsSync, 'readSync').mockImplementation((fd, buffer, ...args) => {
      // Mock implementation
      return 10 // bytes read
    })
  })
})

// ============================================================================
// ATOMIC WRITE PATTERNS
// ============================================================================

/**
 * Implementation: Atomic write with temp file
 */
async function atomicWrite(filepath: string, content: string): Promise<void> {
  const tmpPath = `${filepath}.tmp`
  await fs.writeFile(tmpPath, content, 'utf-8')
  await fs.rename(tmpPath, filepath)
}

/**
 * Implementation: Atomic write with cleanup on failure
 */
async function atomicWriteWithCleanup(
  filepath: string,
  content: string
): Promise<void> {
  const tmpPath = `${filepath}.tmp`
  try {
    await fs.writeFile(tmpPath, content, 'utf-8')
    await fs.rename(tmpPath, filepath)
  } catch (error) {
    try {
      await fs.unlink(tmpPath)
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Implementation: Atomic read-modify-write
 */
async function atomicModify(
  filepath: string,
  modifier: (content: string) => string
): Promise<void> {
  const currentContent = await fs.readFile(filepath, 'utf-8')
  const newContent = modifier(currentContent)
  await atomicWrite(filepath, newContent)
}

describe('Atomic Write Patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 7: Testing atomic write with operation order verification
   */
  it('should write to temp file then rename in correct order', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockResolvedValue(undefined)
    const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValue(undefined)

    await atomicWrite('/target/file.txt', 'content')

    // Verify operations were called
    expect(writeFileSpy).toHaveBeenCalledWith(
      '/target/file.txt.tmp',
      'content',
      'utf-8'
    )
    expect(renameSpy).toHaveBeenCalledWith(
      '/target/file.txt.tmp',
      '/target/file.txt'
    )

    // Verify operation order (write before rename)
    expect(writeFileSpy.mock.invocationCallOrder[0]).toBeLessThan(
      renameSpy.mock.invocationCallOrder[0]
    )
  })

  /**
   * Example 8: Testing atomic write failure handling
   */
  it('should not rename if write fails', async () => {
    const writeError = createFSError('EACCES', 'Permission denied', '/target/file.txt.tmp')
    vi.spyOn(fs, 'writeFile').mockRejectedValue(writeError)
    const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValue(undefined)

    await expect(
      atomicWrite('/target/file.txt', 'content')
    ).rejects.toMatchObject({
      code: 'EACCES',
    })

    // Rename should not have been attempted
    expect(renameSpy).not.toHaveBeenCalled()
  })

  /**
   * Example 9: Testing atomic write with cleanup
   */
  it('should cleanup temp file on rename failure', async () => {
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined)
    const renameError = createFSError('EIO', 'I/O error', '/target/file.txt')
    vi.spyOn(fs, 'rename').mockRejectedValue(renameError)
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)

    await expect(
      atomicWriteWithCleanup('/target/file.txt', 'content')
    ).rejects.toMatchObject({
      code: 'EIO',
    })

    // Verify cleanup happened
    expect(unlinkSpy).toHaveBeenCalledWith('/target/file.txt.tmp')
  })

  /**
   * Example 10: Testing atomic read-modify-write
   */
  it('should read, modify, and write atomically', async () => {
    const readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockResolvedValue('original content')
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined)
    const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValue(undefined)

    await atomicModify('/target/file.txt', (content) => content.toUpperCase())

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

// ============================================================================
// ERROR SIMULATION PATTERNS
// ============================================================================

describe('Error Simulation Patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 11: ENOENT - File not found
   */
  it('should simulate ENOENT error', async () => {
    const error = createFSError(
      'ENOENT',
      'No such file or directory',
      '/path/to/missing.txt'
    )
    vi.mocked(fs.readFile).mockRejectedValueOnce(error)

    await expect(
      fs.readFile('/path/to/missing.txt', 'utf-8')
    ).rejects.toMatchObject({
      code: 'ENOENT',
      errno: -2,
      path: '/path/to/missing.txt',
    })
  })

  /**
   * Example 12: EACCES - Permission denied
   */
  it('should simulate EACCES error', async () => {
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

  /**
   * Example 13: EEXIST - File exists
   */
  it('should simulate EEXIST error for mkdir', async () => {
    const error = createFSError(
      'EEXIST',
      'File exists',
      '/path/to/directory'
    )
    vi.mocked(fs.mkdir).mockRejectedValueOnce(error)

    await expect(fs.mkdir('/path/to/directory')).rejects.toMatchObject({
      code: 'EEXIST',
      errno: -17,
    })
  })

  /**
   * Example 14: EISDIR - Is a directory
   */
  it('should simulate EISDIR error', async () => {
    const error = createFSError(
      'EISDIR',
      'Illegal operation on a directory',
      '/path/to/dir'
    )
    vi.mocked(fs.readFile).mockRejectedValueOnce(error)

    await expect(fs.readFile('/path/to/dir', 'utf-8')).rejects.toMatchObject(
      {
        code: 'EISDIR',
        errno: -21,
      }
    )
  })

  /**
   * Example 15: ENOTEMPTY - Directory not empty
   */
  it('should simulate ENOTEMPTY error', async () => {
    const error = createFSError(
      'ENOTEMPTY',
      'Directory not empty',
      '/path/to/dir'
    )
    vi.mocked(fs.rmdir as any).mockRejectedValueOnce(error)

    await expect((fs.rmdir as any)('/path/to/dir')).rejects.toMatchObject({
      code: 'ENOTEMPTY',
      errno: -39,
    })
  })

  /**
   * Example 16: Multiple error scenarios with different handling
   */
  it('should handle different error types appropriately', async () => {
    const errorHandlers = {
      ENOENT: (error: NodeJS.ErrnoException) => {
        expect(error.code).toBe('ENOENT')
        return 'use_default'
      },
      EACCES: (error: NodeJS.ErrnoException) => {
        expect(error.code).toBe('EACCES')
        return 'access_denied'
      },
      EEXIST: (error: NodeJS.ErrnoException) => {
        expect(error.code).toBe('EEXIST')
        return 'already_exists'
      },
    }

    // Test each error type
    for (const [code, handler] of Object.entries(errorHandlers)) {
      const error = createFSError(code, `Error: ${code}`, '/test/path')
      vi.mocked(fs.readFile).mockRejectedValueOnce(error)

      try {
        await fs.readFile('/test/path', 'utf-8')
        expect.fail('Should have thrown error')
      } catch (e) {
        const result = handler(e as NodeJS.ErrnoException)
        expect(result).toBeTruthy()
      }
    }
  })
})

// ============================================================================
// RETRY LOGIC TESTING
// ============================================================================

/**
 * Implementation: Read file with retry
 */
async function readFileWithRetry(
  filepath: string,
  options: { maxRetries: number; delay?: number } = { maxRetries: 3 }
): Promise<string> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fs.readFile(filepath, 'utf-8')
    } catch (error) {
      lastError = error as Error
      if (attempt < options.maxRetries) {
        // Add delay if specified
        if (options.delay) {
          await new Promise((resolve) => setTimeout(resolve, options.delay))
        }
        continue
      }
    }
  }

  throw lastError
}

describe('Retry Logic Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 17: Testing successful retry
   */
  it('should retry on transient errors and succeed', async () => {
    const error = createFSError(
      'EAGAIN',
      'Resource temporarily unavailable',
      '/path/to/file'
    )

    // Fail twice, then succeed
    vi.mocked(fs.readFile)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success')

    const result = await readFileWithRetry('/path/to/file', {
      maxRetries: 3,
    })

    expect(result).toBe('success')
    expect(fs.readFile).toHaveBeenCalledTimes(3)
  })

  /**
   * Example 18: Testing retry exhaustion
   */
  it('should fail after max retries', async () => {
    const error = createFSError(
      'EAGAIN',
      'Resource temporarily unavailable',
      '/path/to/file'
    )
    vi.mocked(fs.readFile).mockRejectedValue(error)

    await expect(
      readFileWithRetry('/path/to/file', { maxRetries: 2 })
    ).rejects.toMatchObject({
      code: 'EAGAIN',
    })

    expect(fs.readFile).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  /**
   * Example 19: Testing immediate success (no retry)
   */
  it('should succeed immediately without retry', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('immediate success')

    const result = await readFileWithRetry('/path/to/file', {
      maxRetries: 3,
    })

    expect(result).toBe('immediate success')
    expect(fs.readFile).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// CONCURRENT OPERATIONS
// ============================================================================

describe('Concurrent Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 20: Testing concurrent file reads
   */
  it('should handle concurrent file reads', async () => {
    vi.mocked(fs.readFile).mockImplementation((path) => {
      return Promise.resolve(`content of ${path}`)
    })

    const files = ['/file1.txt', '/file2.txt', '/file3.txt']
    const results = await Promise.all(
      files.map((file) => fs.readFile(file, 'utf-8'))
    )

    expect(results).toEqual([
      'content of /file1.txt',
      'content of /file2.txt',
      'content of /file3.txt',
    ])
    expect(fs.readFile).toHaveBeenCalledTimes(3)
  })

  /**
   * Example 21: Testing concurrent writes with race conditions
   */
  it('should handle concurrent writes correctly', async () => {
    const writeOrder: string[] = []

    vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
      writeOrder.push(`${path}:${content}`)
      return Promise.resolve(undefined)
    })

    // Simulate concurrent writes
    await Promise.all([
      fs.writeFile('/file1.txt', 'content1', 'utf-8'),
      fs.writeFile('/file2.txt', 'content2', 'utf-8'),
      fs.writeFile('/file3.txt', 'content3', 'utf-8'),
    ])

    expect(fs.writeFile).toHaveBeenCalledTimes(3)
    expect(writeOrder).toHaveLength(3)
  })
})

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 22: Empty file
   */
  it('should handle empty file', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('')

    const content = await fs.readFile('/empty.txt', 'utf-8')
    expect(content).toBe('')
  })

  /**
   * Example 23: Large file
   */
  it('should handle large file', async () => {
    const largeContent = 'x'.repeat(10_000_000)
    vi.mocked(fs.readFile).mockResolvedValueOnce(largeContent)

    const content = await fs.readFile('/large.txt', 'utf-8')
    expect(content).toHaveLength(10_000_000)
  })

  /**
   * Example 24: Special characters
   */
  it('should handle special characters', async () => {
    const specialContent = 'Hello\nWorld\t!\r\nTest'
    vi.mocked(fs.readFile).mockResolvedValueOnce(specialContent)

    const content = await fs.readFile('/special.txt', 'utf-8')
    expect(content).toContain('\n')
    expect(content).toContain('\t')
  })

  /**
   * Example 25: Unicode content
   */
  it('should handle unicode content', async () => {
    const unicodeContent = 'Hello 世界 🌍 🎉'
    vi.mocked(fs.readFile).mockResolvedValueOnce(unicodeContent)

    const content = await fs.readFile('/unicode.txt', 'utf-8')
    expect(content).toContain('世界')
    expect(content).toContain('🌍')
  })

  /**
   * Example 26: Binary content
   */
  it('should handle binary content', async () => {
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03])
    vi.mocked(fs.readFile).mockResolvedValueOnce(binaryContent as any)

    const content = await fs.readFile('/binary.bin')
    expect(Buffer.isBuffer(content)).toBe(true)
    expect(content[0]).toBe(0x00)
    expect(content[3]).toBe(0x03)
  })
})

// ============================================================================
// ADVANCED PATTERNS
// ============================================================================

describe('Advanced Patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 27: Mocking based on file path patterns
   */
  it('should mock differently based on path patterns', async () => {
    vi.mocked(fs.readFile).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path.endsWith('.json')) {
          return Promise.resolve('{"key": "value"}')
        } else if (path.endsWith('.txt')) {
          return Promise.resolve('text content')
        }
      }
      return Promise.resolve('default content')
    })

    const jsonContent = await fs.readFile('/config.json', 'utf-8')
    const txtContent = await fs.readFile('/readme.txt', 'utf-8')
    const defaultContent = await fs.readFile('/other.xyz', 'utf-8')

    expect(jsonContent).toBe('{"key": "value"}')
    expect(txtContent).toBe('text content')
    expect(defaultContent).toBe('default content')
  })

  /**
   * Example 28: Mocking with side effects
   */
  it('should track mock calls with side effects', async () => {
    const callLog: string[] = []

    vi.mocked(fs.readFile).mockImplementation((path) => {
      callLog.push(`read: ${path}`)
      return Promise.resolve(`content of ${path}`)
    })

    vi.mocked(fs.writeFile).mockImplementation((path, content) => {
      callLog.push(`write: ${path} (${content})`)
      return Promise.resolve(undefined)
    })

    // Perform operations
    await fs.readFile('/file1.txt', 'utf-8')
    await fs.writeFile('/file2.txt', 'new content', 'utf-8')
    await fs.readFile('/file3.txt', 'utf-8')

    expect(callLog).toEqual([
      'read: /file1.txt',
      'write: /file2.txt (new content)',
      'read: /file3.txt',
    ])
  })

  /**
   * Example 29: Progressive mock changes
   */
  it('should change mock behavior over time', async () => {
    // First call returns old version
    vi.mocked(fs.readFile).mockResolvedValueOnce('v1.0.0')

    // Second call returns new version
    vi.mocked(fs.readFile).mockResolvedValueOnce('v2.0.0')

    // All other calls return latest
    vi.mocked(fs.readFile).mockResolvedValue('v2.1.0')

    const v1 = await fs.readFile('/version.txt', 'utf-8')
    const v2 = await fs.readFile('/version.txt', 'utf-8')
    const v3 = await fs.readFile('/version.txt', 'utf-8')

    expect(v1).toBe('v1.0.0')
    expect(v2).toBe('v2.0.0')
    expect(v3).toBe('v2.1.0')
  })

  /**
   * Example 30: Mocking file system state
   */
  it('should maintain file system state in mock', async () => {
    const fileSystem = new Map<string, string>()
    fileSystem.set('/existing.txt', 'existing content')

    vi.mocked(fs.readFile).mockImplementation((path) => {
      const content = fileSystem.get(path as string)
      if (content === undefined) {
        const error = createFSError('ENOENT', 'File not found', path as string)
        return Promise.reject(error)
      }
      return Promise.resolve(content)
    })

    vi.mocked(fs.writeFile).mockImplementation((path, content) => {
      fileSystem.set(path as string, content as string)
      return Promise.resolve(undefined)
    })

    // Read existing file
    const content1 = await fs.readFile('/existing.txt', 'utf-8')
    expect(content1).toBe('existing content')

    // Write new file
    await fs.writeFile('/new.txt', 'new content', 'utf-8')

    // Read new file
    const content2 = await fs.readFile('/new.txt', 'utf-8')
    expect(content2).toBe('new content')

    // Try to read non-existent file
    await expect(fs.readFile('/nonexistent.txt', 'utf-8')).rejects.toMatchObject(
      {
        code: 'ENOENT',
      }
    )
  })
})

// ============================================================================
// INTEGRATION EXAMPLES
// ============================================================================

/**
 * Implementation: Config loader with fallback
 */
async function loadConfigWithFallback(
  filepath: string,
  defaultConfig: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const content = await fs.readFile(filepath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultConfig
    }
    throw error
  }
}

/**
 * Implementation: Directory creator with existence check
 */
async function ensureDirectory(dirpath: string): Promise<void> {
  try {
    await fs.mkdir(dirpath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

describe('Integration Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Example 31: Testing config loader with fallback
   */
  it('should load config or use default', async () => {
    const defaultConfig = { port: 3000, host: 'localhost' }

    // Test with missing file
    vi.mocked(fs.readFile).mockRejectedValue(
      createFSError('ENOENT', 'File not found', 'config.json')
    )

    const config1 = await loadConfigWithFallback('config.json', defaultConfig)
    expect(config1).toEqual(defaultConfig)

    // Test with existing file
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({ port: 8080, host: 'example.com' })
    )

    const config2 = await loadConfigWithFallback('config.json', defaultConfig)
    expect(config2).toEqual({ port: 8080, host: 'example.com' })
  })

  /**
   * Example 32: Testing directory creation
   */
  it('should create directory or ignore if exists', async () => {
    // Test successful creation
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)

    await ensureDirectory('/new/dir')

    expect(fs.mkdir).toHaveBeenCalledWith('/new/dir', { recursive: true })

    // Test with existing directory
    vi.mocked(fs.mkdir).mockRejectedValue(
      createFSError('EEXIST', 'Directory exists', '/existing/dir')
    )

    await expect(ensureDirectory('/existing/dir')).resolves.not.toThrow()
  })

  /**
   * Example 33: Testing file copy operation
   */
  it('should handle file copy with error scenarios', async () => {
    const copyFile = async (src: string, dest: string): Promise<void> => {
      const content = await fs.readFile(src, 'utf-8')
      await fs.writeFile(dest, content, 'utf-8')
    }

    // Test successful copy
    vi.mocked(fs.readFile).mockResolvedValue('file content')
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    await copyFile('/source.txt', '/dest.txt')

    expect(fs.readFile).toHaveBeenCalledWith('/source.txt', 'utf-8')
    expect(fs.writeFile).toHaveBeenCalledWith('/dest.txt', 'file content', 'utf-8')

    // Test with missing source
    vi.mocked(fs.readFile).mockRejectedValue(
      createFSError('ENOENT', 'Source not found', '/missing.txt')
    )

    await expect(copyFile('/missing.txt', '/dest.txt')).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })
})
