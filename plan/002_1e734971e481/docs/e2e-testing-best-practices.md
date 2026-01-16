# E2E Testing Best Practices for Node.js/TypeScript Projects

**Research Document for Task P2.M2.T1.S1 - "Execute E2E pipeline tests"**

**Last Updated:** 2026-01-16

---

## Table of Contents

1. [Vitest E2E Test Patterns and Best Practices](#1-vitest-e2e-test-patterns-and-best-practices)
2. [Common Validation Strategies for E2E Tests](#2-common-validation-strategies-for-e2e-tests)
3. [File System Testing and Verification](#3-file-system-testing-and-verification)
4. [Performance Testing Patterns](#4-performance-testing-patterns)
5. [Test Isolation and Cleanup Patterns](#5-test-isolation-and-cleanup-patterns)
6. [External References and Resources](#6-external-references-and-resources)

---

## 1. Vitest E2E Test Patterns and Best Practices

### 1.1 Official Vitest Documentation

- **Main Documentation:** https://vitest.dev/guide/
- **E2E Testing Guide:** https://vitest.dev/guide/e2e.html
- **API Reference:** https://vitest.dev/api/

### 1.2 Core Vitest E2E Patterns

#### Pattern 1: Module-Level Mocking with Hoisting

```typescript
// Mock modules at the TOP LEVEL before imports
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import after mocking
import { createAgent } from 'groundswell';
```

**Best Practices:**
- Always place `vi.mock()` calls at the top level before imports
- Use `vi.importActual()` to preserve real exports when needed
- Use `vi.mocked()` for type-safe mock access

#### Pattern 2: Typed Mock References

```typescript
// Type-safe mock access
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
vi.mocked(createAgent).mockResolvedValue({ data: 'test' });
```

**Benefits:**
- Provides TypeScript autocomplete and type checking
- Catches type errors at compile time
- Improves IDE support

#### Pattern 3: Mock Factories for Complex Objects

```typescript
function createMockChild(options: {
  exitCode?: number;
  stdout?: string;
  stderr?: string;
} = {}) {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as import('node:child_process').ChildProcess;
}
```

**Benefits:**
- Reusable mock creation
- Consistent mock behavior
- Easy to customize with options

#### Pattern 4: Real Timers for Async Mocks

```typescript
beforeEach(() => {
  vi.useRealTimers(); // Allow setTimeout in mocks to work
});

afterEach(() => {
  vi.useFakeTimers(); // Restore fake timers after test
});
```

**When to Use:**
- When mocks use `setTimeout` for async behavior
- When testing timing-dependent code
- When fake timers interfere with mock execution

### 1.3 Test Organization Patterns

#### Suite Structure

```typescript
describe('E2E Pipeline Tests', () => {
  let tempDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should complete full pipeline workflow successfully', async () => {
    // Test
  });
});
```

**Best Practices:**
- Group related tests in `describe` blocks
- Use descriptive test names that explain what is being tested
- Follow AAA pattern (Arrange, Act, Assert)

---

## 2. Common Validation Strategies for E2E Tests

### 2.1 Multi-Level Validation Approach

#### Level 1: Result Structure Validation

```typescript
// Verify high-level result structure
expect(result.success).toBe(true);
expect(result.sessionPath).toBeDefined();
expect(result.totalTasks).toBe(0);
expect(result.completedTasks).toBe(0);
expect(result.failedTasks).toBe(0);
```

#### Level 2: File System Validation

```typescript
// Verify session directory exists
expect(existsSync(result.sessionPath)).toBe(true);

// Verify specific files exist
const prdSnapshotPath = join(result.sessionPath, 'prd_snapshot.md');
expect(existsSync(prdSnapshotPath)).toBe(true);

const tasksPath = join(result.sessionPath, 'tasks.json');
expect(existsSync(tasksPath)).toBe(true);
```

#### Level 3: Content Validation

```typescript
// Read and validate file content
const prdSnapshot = readFileSync(prdSnapshotPath, 'utf-8');
expect(prdSnapshot).toContain('# Test Project');
expect(prdSnapshot).toContain('## P1: Test Phase');

// Parse and validate JSON structure
const tasksJson = JSON.parse(readFileSync(tasksPath, 'utf-8'));
expect(tasksJson.backlog).toBeDefined();
expect(tasksJson.backlog).toHaveLength(1);
```

#### Level 4: Behavioral Validation

```typescript
// Verify operations were called
expect(mockGitInstance.status).toHaveBeenCalled();
expect(mockAgent.prompt).toHaveBeenCalled();

// Verify call counts and arguments
expect(mockAgent.prompt).toHaveBeenCalledTimes(3);
expect(mockAgent.prompt).toHaveBeenCalledWith(expect.objectContaining({
  user: expect.stringContaining('test')
}));
```

### 2.2 Schema Validation with Zod

```typescript
import { z } from 'zod';

const BacklogSchema = z.object({
  backlog: z.array(z.object({
    id: z.string(),
    type: z.enum(['Phase', 'Milestone', 'Task', 'Subtask']),
    title: z.string(),
    status: z.enum(['Planned', 'InProgress', 'Complete', 'Failed']),
  }))
});

// Validate in tests
const validationResult = BacklogSchema.safeParse(tasksJson);
expect(validationResult.success).toBe(true);
```

### 2.3 Error Case Validation

```typescript
it('should handle error when PRD file does not exist', async () => {
  const invalidPath = join(tempDir, 'nonexistent.md');
  const pipeline = new PRPPipeline(invalidPath);
  const result = await pipeline.run();

  // Verify graceful failure
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  expect(result.finalPhase).toBe('init');
});
```

---

## 3. File System Testing and Verification

### 3.1 Temporary Directory Management

#### Pattern: Unique Temp Directories per Test

```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('File System Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create unique temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'e2e-test-'));
  });

  afterEach(() => {
    // Cleanup recursively with force flag
    rmSync(tempDir, { recursive: true, force: true });
  });
});
```

**Benefits:**
- Each test gets isolated directory
- Automatic cleanup prevents disk space issues
- Concurrent test execution support

### 3.2 File Creation Verification

#### Method 1: existsSync Check

```typescript
// Simple existence check
expect(existsSync(filePath)).toBe(true);
```

#### Method 2: Content Validation

```typescript
// Read and validate content
const content = readFileSync(filePath, 'utf-8');
expect(content).toContain('expected text');
expect(content.length).toBeGreaterThan(0);
```

#### Method 3: Structure Validation

```typescript
// Validate JSON structure
const json = JSON.parse(readFileSync(filePath, 'utf-8'));
expect(json).toHaveProperty('requiredField');
expect(json.arrayField).toHaveLength(3);
```

#### Method 4: Metadata Validation

```typescript
import { statSync } from 'node:fs';

// Check file size
const stats = statSync(filePath);
expect(stats.size).toBeGreaterThan(0);
expect(stats.isFile()).toBe(true);
```

### 3.3 File System Mocking Strategies

#### Strategy 1: Mock readFile Only

```typescript
// Mock readFile, preserve other fs operations
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

// Use implementation based on path
vi.mocked(readFile).mockImplementation((path: string | Buffer) => {
  const pathStr = String(path);
  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(Buffer.from(JSON.stringify(mockData), 'utf-8'));
  }
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(Buffer.from(mockPRD, 'utf-8'));
  }
  return Promise.resolve(Buffer.from('', 'utf-8'));
});
```

**When to Use:**
- Need to control file read content
- Want real file system for writes
- Testing file creation workflows

#### Strategy 2: Mock existsSync

```typescript
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    realpathSync: vi.fn((path: unknown) => path as string),
  };
});
```

**When to Use:**
- Testing with non-existent files
- Conditional file logic
- Path resolution testing

#### Strategy 3: Full File System Mocking with memfs

```typescript
import { fs } from 'memfs';

// Use virtual file system
vi.mock('node:fs', () => fs);
vi.mock('node:fs/promises', () => fs.promises);

beforeEach(() => {
  // Setup virtual files
  fs.writeFileSync('/test/file.txt', 'content');
});

afterEach(() => {
  // Clean virtual filesystem
  fs.rmdirSync('/', { recursive: true });
});
```

**When to Use:**
- Complete isolation from real file system
- CI/CD environments with restricted file access
- Performance (memory is faster than disk)

### 3.4 Real File System Testing Pattern

```typescript
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

describe('Real File System Tests', () => {
  let tempDir: string;
  let filePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fs-test-'));
    filePath = join(tempDir, 'test.txt');
  });

  it('should create file with correct content', async () => {
    // Act: Create file using production code
    await createFile(filePath, 'test content');

    // Assert: Verify file exists
    expect(existsSync(filePath)).toBe(true);

    // Assert: Verify content
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toBe('test content');
  });

  it('should handle file overwrite', async () => {
    // Arrange: Create initial file
    writeFileSync(filePath, 'initial');

    // Act: Overwrite file
    await createFile(filePath, 'updated');

    // Assert: Verify updated content
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toBe('updated');
  });
});
```

---

## 4. Performance Testing Patterns

### 4.1 Execution Time Measurement

#### Pattern: Performance.now() for Millisecond Precision

```typescript
it('should complete execution in under 30 seconds', async () => {
  // ACT: Run pipeline with timing
  const start = performance.now();
  const result = await pipeline.run();
  const duration = performance.now() - start;

  // ASSERT: Should complete quickly
  expect(result.success).toBe(true);
  expect(duration).toBeLessThan(30000);

  // LOG timing for reference
  console.log(
    `Pipeline execution completed in ${duration.toFixed(0)}ms (< 30000ms target)`
  );
});
```

**Benefits:**
- High precision (sub-millisecond)
- No external dependencies
- Works in all modern Node.js versions

### 4.2 Hierarchical Timeout Assertions

```typescript
describe('Performance Tests', () => {
  it('should initialize in under 1 second', async () => {
    const start = performance.now();
    await pipeline.initialize();
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it('should execute backlog in under 20 seconds', async () => {
    const start = performance.now();
    await pipeline.executeBacklog();
    expect(performance.now() - start).toBeLessThan(20000);
  });

  it('should complete full pipeline in under 30 seconds', async () => {
    const start = performance.now();
    await pipeline.run();
    expect(performance.now() - start).toBeLessThan(30000);
  });
});
```

### 4.3 Performance Baseline Testing

```typescript
interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
}

const performanceHistory: PerformanceMetrics[] = [];

it('should track performance over time', async () => {
  const start = performance.now();
  await pipeline.run();
  const duration = performance.now() - start;

  // Record performance
  performanceHistory.push({
    name: 'full-pipeline',
    duration,
    timestamp: Date.now(),
  });

  // Assert performance requirement
  expect(duration).toBeLessThan(30000);

  // Log for analysis
  console.log(`Performance: ${duration.toFixed(0)}ms`);
});
```

### 4.4 Timeout Configuration

#### Vitest Config Timeouts

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // Default test timeout (30s)
    hookTimeout: 10000, // Hook timeout (10s)
    isolate: true, // Isolate test files
  },
});
```

#### Per-Test Timeout Override

```typescript
it('should complete long operation', async () => {
  // Test with custom timeout
}, 60000); // 60 second timeout for this test only
```

### 4.5 Common Performance Issues and Solutions

#### Issue 1: Slow Mock Setup

**Problem:**
```typescript
// Slow: Creating complex mocks in each test
beforeEach(() => {
  mockAgent = {
    prompt: vi.fn(),
    method1: vi.fn(),
    method2: vi.fn(),
    // ... many more methods
  };
});
```

**Solution:**
```typescript
// Fast: Create shared mock factory
function createMockAgent() {
  return {
    prompt: vi.fn(),
    method1: vi.fn(),
    method2: vi.fn(),
  };
}

const mockAgent = createMockAgent();
beforeEach(() => {
  vi.clearAllMocks(); // Just clear, don't recreate
});
```

#### Issue 2: Synchronous File Operations in Loops

**Problem:**
```typescript
// Slow: Sync operations in loop
for (const file of files) {
  readFileSync(file);
}
```

**Solution:**
```typescript
// Fast: Parallel async operations
const contents = await Promise.all(
  files.map(file => readFile(file, 'utf-8'))
);
```

---

## 5. Test Isolation and Cleanup Patterns

### 5.1 Global Setup Pattern

#### File: tests/setup.ts

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

/**
 * Before each test - clear mock call histories
 */
beforeEach(() => {
  // Clear all mock call histories
  vi.clearAllMocks();

  // Validate test environment
  validateApiEndpoint();
});

/**
 * After each test - clean up environment and memory
 */
afterEach(() => {
  // Restore all environment variable stubs
  vi.unstubAllEnvs();

  // Force garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

**Benefits:**
- Automatic cleanup across all tests
- Prevents test pollution
- Manages memory in long test runs

### 5.2 Suite-Level Isolation

#### Pattern: beforeEach/afterEach in describe

```typescript
describe('Isolated Test Suite', () => {
  let tempDir: string;
  let pipeline: PRPPipeline;

  beforeEach(() => {
    // Setup: Create fresh resources
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
    pipeline = new PRPPipeline(tempDir);
  });

  afterEach(() => {
    // Cleanup: Remove resources
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('test 1', async () => {
    // Each test gets fresh pipeline and tempDir
  });

  it('test 2', async () => {
    // Completely isolated from test 1
  });
});
```

### 5.3 Resource Cleanup Patterns

#### Pattern 1: Directory Cleanup

```typescript
afterEach(() => {
  // Recursive directory removal
  rmSync(tempDir, { recursive: true, force: true });
});
```

#### Pattern 2: Mock Cleanup

```typescript
afterEach(() => {
  // Clear mock call history
  vi.clearAllMocks();

  // Restore all mocks
  vi.restoreAllMocks();

  // Reset modules to initial state
  vi.resetModules();
});
```

#### Pattern 3: Environment Variable Cleanup

```typescript
afterEach(() => {
  // Unstub all environment variables
  vi.unstubAllEnvs();

  // Or restore specific variables
  process.env.API_KEY = originalApiKey;
});
```

#### Pattern 4: Timer Cleanup

```typescript
afterEach(() => {
  // Clear all pending timers
  vi.runAllTimers();
  vi.useRealTimers();

  // Restore fake timers for next test
  vi.useFakeTimers();
});
```

### 5.4 Memory Management

#### Pattern: Force Garbage Collection

```typescript
// In setup.ts
afterEach(() => {
  // Force garbage collection if available
  // Requires Node.js to be started with --expose-gc flag
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

**To enable:**
```bash
node --expose-gc ./node_modules/.bin/vitest
```

### 5.5 Test Parallelization Considerations

#### Pattern: Unique Resource Naming

```typescript
import { randomUUID } from 'node:crypto';

beforeEach(() => {
  // Use UUID for unique names in parallel tests
  tempDir = mkdtempSync(join(tmpdir(), `test-${randomUUID()}-`));
  databaseName = `test_db_${randomUUID()}`;
});
```

#### Pattern: File Locking for Shared Resources

```typescript
import { lockSync, unlockSync } from 'proper-lockfile';

beforeEach(async () => {
  // Acquire lock for shared resource
  lockSync('shared-resource.lock');
});

afterEach(() => {
  // Release lock
  unlockSync('shared-resource.lock');
});
```

### 5.6 Cleanup Verification

#### Pattern: Verify Cleanup in Tests

```typescript
it('should clean up temp directory after test', async () => {
  const tempDirBefore = tempDir;

  await pipeline.run();

  // Temp dir should still exist during test
  expect(existsSync(tempDirBefore)).toBe(true);

  // Note: afterEach will handle cleanup
  // We trust afterEach to run (verified by test suite passing)
});
```

---

## 6. External References and Resources

### 6.1 Official Documentation

#### Vitest
- **Main Guide:** https://vitest.dev/guide/
- **E2E Testing:** https://vitest.dev/guide/e2e.html
- **API Reference:** https://vitest.dev/api/
- **Configuration:** https://vitest.dev/config/

#### Node.js File System
- **File System (fs):** https://nodejs.org/api/fs.html
- **File System Promises:** https://nodejs.org/api/fs.html#fspromises-api
- **Path Module:** https://nodejs.org/api/path.html

### 6.2 Best Practices Articles

#### E2E Testing
- **Vitest Best Practices:** https://vitest.dev/guide/best-practices.html
- **Testing Library Principles:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

#### File System Testing
- **Node.js Testing Patterns:** https://nodejs.org/en/docs/guides/testing-patterns/
- **mock-fs Documentation:** https://github.com/tschaub/mock-fs
- **memfs Documentation:** https://github.com/streamich/memfs

### 6.3 Performance Testing

#### Articles
- **Performance Testing in Node.js:** https://nodejs.org/en/docs/guides/simple-profiling/
- **Vitest Performance:** https://vitest.dev/guide/improving-performance.html

#### Tools
- **clinic.js:** https://clinicjs.org/
- **0x:** https://npm.im/0x

### 6.4 Test Isolation

#### Patterns
- **Test Fixtures:** https://vitest.dev/guide/test-context.html
- **Mock Functions:** https://vitest.dev/api/mock.html
- **Module Mocking:** https://vitest.dev/api/vi.html#vi-mock

### 6.5 Related Testing Libraries

#### Validation
- **Zod:** https://zod.dev/
- **Joi:** https://joi.dev/
- **io-ts:** https://gcanti.github.io/io-ts/

#### Test Utilities
- **fake-timers:** https://npmjs.com/package/@sinonjs/fake-timers
- **sinon.js:** https://sinonjs.org/

---

## Summary of Key Best Practices

### 1. Vitest E2E Testing
- Use module-level mocking with `vi.mock()` before imports
- Use `vi.mocked()` for type-safe mock access
- Create mock factories for complex objects
- Use `vi.useRealTimers()` when mocks use async setTimeout

### 2. Validation Strategies
- Validate at multiple levels: structure, files, content, behavior
- Use schema validation (Zod) for complex data structures
- Always test error cases and edge cases
- Verify both success and failure paths

### 3. File System Testing
- Use unique temp directories per test with `mkdtempSync()`
- Always cleanup with `rmSync(dir, { recursive: true, force: true })`
- Mock readFile for controlled input, use real fs for writes
- Use `existsSync()` and content validation for verification

### 4. Performance Testing
- Use `performance.now()` for millisecond precision
- Set hierarchical timeouts (operation, suite, global)
- Track performance history to detect regressions
- Log actual durations for analysis

### 5. Test Isolation
- Use `beforeEach`/`afterEach` for setup/teardown
- Clear mocks with `vi.clearAllMocks()` in `beforeEach`
- Use `afterEach` for cleanup (dirs, env vars, timers)
- Force garbage collection with `global.gc()` if available

---

## Implementation Checklist for Task P2.M2.T1.S1

- [ ] Review existing E2E test patterns in `/home/dustin/projects/hacky-hack/tests/e2e/`
- [ ] Implement 30-second execution time validation
- [ ] Add file creation verification for all output files
- [ ] Ensure proper test isolation with beforeEach/afterEach
- [ ] Validate mock setup matches production behavior
- [ ] Add performance measurement and logging
- [ ] Implement cleanup verification
- [ ] Document any deviations from these best practices

---

**Document Status:** Ready for Review
**Task:** P2.M2.T1.S1 - Execute E2E pipeline tests
**Research Date:** 2026-01-16
