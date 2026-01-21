# TypeScript Integration Test Patterns for File System Operations

**Research Date**: 2026-01-20
**Work Item**: P1.M2.T1.S2 - Verify plan/ directory structure and artifacts

## 1. Existing Test Patterns Analysis

### Session Structure Tests Reference

**File**: `tests/integration/core/session-structure.test.ts`

#### Temp Directory Setup/Cleanup Pattern

```typescript
describe('Session Directory Structure', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-structure-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
```

#### File Structure Verification Pattern

```typescript
it('should create architecture, prps, and artifacts subdirectories', async () => {
  const requiredSubdirs = ['architecture', 'prps', 'artifacts'];
  for (const subdir of requiredSubdirs) {
    const subdirPath = join(sessionPath, subdir);
    expect(existsSync(subdirPath)).toBe(true);
    const stats = statSync(subdirPath);
    expect(stats.isDirectory()).toBe(true);
  }
});
```

#### File Permissions Verification Pattern

```typescript
it('should create directories with mode 0o755', async () => {
  const sessionStats = statSync(sessionPath);
  const sessionMode = sessionStats.mode & 0o777;
  expect(sessionMode).toBe(0o755);
});
```

### Real File System Usage

- Uses synchronous Node.js fs operations (`mkdtempSync`, `rmSync`, `writeFileSync`)
- Creates actual directories and files to verify real behavior
- Tests file permissions (`0o755` for directories, `0o644` for files)

## 2. Key Patterns Extracted

### Helper Functions for File Operations

```typescript
function createTestPRD(path: string, content: string): void {
  writeFileSync(path, content, { mode: 0o644 });
}

function verifyDirectoryStructure(basePath: string, expectedDirs: string[]) {
  for (const dir of expectedDirs) {
    const dirPath = join(basePath, dir);
    expect(existsSync(dirPath)).toBe(true);
    const stats = statSync(dirPath);
    expect(stats.isDirectory()).toBe(true);
    expect(stats.mode & 0o777).toBe(0o755);
  }
}

function verifyFileContent(filePath: string, expectedContent: string[]) {
  expect(existsSync(filePath)).toBe(true);
  const content = readFileSync(filePath, 'utf-8');
  for (const line of expectedContent) {
    expect(content).toContain(line);
  }
  const stats = statSync(filePath);
  expect(stats.mode & 0o777).toBe(0o644);
}
```

### Recursive Directory Check Pattern

```typescript
function verifyAllDirectoriesExist(
  basePath: string,
  expectedDirs: string[]
): void {
  const entries = readdirSync(basePath, { withFileTypes: true });

  for (const dir of expectedDirs) {
    const dirExists = entries.some(
      entry => entry.isDirectory() && entry.name === dir
    );
    expect(dirExists).toBe(true);
  }
}
```

## 3. External Documentation References

### Vitest Mocking Documentation

- [Vitest Guide - Mocking](https://vitest.dev/guide/mocking.html)
- [Vitest Guide - Testing Node.js Modules](https://vitest.dev/guide/testing-nodejs.html)
- [Vitest API Reference - vi.mock()](https://vitest.dev/api/vi.html#vi-mock)

### Node.js File System Testing Resources

- [Node.js fs Module Documentation](https://nodejs.org/api/fs.html)
- [Node.js Path Module Documentation](https://nodejs.org/api/path.html)

## 4. Common Pitfalls to Avoid

### 1. Insufficient Cleanup

```typescript
// BAD: Only cleans up if test passes
afterEach(() => {
  if (tempDir) rmSync(tempDir);
});

// GOOD: Always clean up with force option
afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
  vi.clearAllMocks();
});
```

### 2. Testing Implementation Details

```typescript
// BAD: Testing internal methods
expect(sessionManager.tempDirCreator()).toBe('some-path');

// GOOD: Test observable behavior
expect(existsSync(session.metadata.path)).toBe(true);
```

### 3. Race Conditions in Async Tests

```typescript
// BAD: No async handling
it('should handle signals', async () => {
  process.emit('SIGINT');
  expect(pipeline.shutdownRequested).toBe(true);
});

// GOOD: Allow async handlers to complete
it('should handle signals', async () => {
  process.emit('SIGINT');
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  expect(pipeline.shutdownRequested).toBe(true);
});
```

## 5. Best Practices Summary

1. **Choose the right testing level**: Use unit tests for logic with mocks, integration tests for real file system behavior
2. **Isolate tests**: Each test should be independent and not rely on file system state from other tests
3. **Be explicit**: Don't rely on default permissions or file system states
4. **Test boundaries**: Verify interfaces between your code and the file system
5. **Use tools appropriately**: Leverage `vi.mock()` for unit tests and real fs operations for integration tests
6. **Document patterns**: Create helper functions for common file system operations in tests
7. **Test edge cases**: Permission errors, disk full, network file systems, etc.
8. **Performance**: Avoid slow file operations in unit tests - use mocks instead
