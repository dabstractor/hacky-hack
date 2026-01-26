# Vitest Testing Best Practices, Mocking Strategies, and Testing Patterns

**Research Date:** 2026-01-23
**Status:** Comprehensive guide based on Vitest best practices

---

## Table of Contents

1. [Vitest Documentation URLs](#vitest-documentation-urls)
2. [Test Structure and Organization](#test-structure-and-organization)
3. [Mocking Strategies](#mocking-strategies)
4. [Coverage Configuration and Thresholds](#coverage-configuration-and-thresholds)
5. [Setup Files and Global Configuration](#setup-files-and-global-configuration)
6. [Async Testing Patterns](#async-testing-patterns)
7. [Test Watchers and Running Tests](#test-watchers-and-running-tests)
8. [Best Practices](#best-practices)

---

## 1. Vitest Documentation URLs

### Core Documentation

- **Official Website:** https://vitest.dev
- **GitHub Repository:** https://github.com/vitest-dev/vitest
- **API Reference:** https://vitest.dev/api/

### Key Documentation Sections

#### Test Structure and Organization

- **Guide:** https://vitest.dev/guide/
- **Test Context API:** https://vitest.dev/api/context.html
- **Test Suite Configuration:** https://vitest.dev/guide/configure.html

#### Mocking Strategies

- **Mocking Guide:** https://vitest.dev/guide/mocking.html
- **Vi API Reference:** https://vitest.dev/api/vi.html
- **Module Mocking:** https://vitest.dev/guide/mocking.html#module-mocking

#### Coverage Configuration

- **Coverage Guide:** https://vitest.dev/guide/coverage.html
- **Coverage Options:** https://vitest.dev/guide/configure.html#coverage

#### Setup and Configuration

- **Configuration Guide:** https://vitest.dev/guide/configure.html
- **Setup Files:** https://vitest.dev/guide/configure.html#setupfiles
- **Global Configuration:** https://vitest.dev/guide/configure.html#globals

#### Advanced Testing Patterns

- **CLI Reference:** https://vitest.dev/guide/cli.html
- **UI Mode:** https://vitest.dev/guide/ui.html
- **Workspace Projects:** https://vitest.dev/guide/workspace.html
- **Snapshot Testing:** https://vitest.dev/guide/snapshot.html

---

## 2. Test Structure and Organization

### File Organization Patterns

#### Pattern 1: Collocated Tests (Recommended for Components)

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
      Button.types.ts
```

#### Pattern 2: Separate Test Directory (Recommended for Libraries)

```
src/
  lib/
    utils.ts
tests/
  unit/
    utils.test.ts
  integration/
    user-flow.test.ts
```

#### Pattern 3: Feature-Based Organization

```
src/
  features/
    auth/
      login.ts
      login.test.ts
    dashboard/
      dashboard.ts
      dashboard.test.ts
```

### Test File Naming Conventions

```typescript
// Recommended patterns
*.test.ts          // Standard test files
*.spec.ts          // Spec/test files
*.test.tsx         // React component tests
*.integration.test.ts  // Integration tests
*.e2e.test.ts      // End-to-end tests

// Examples
utils.test.ts
Button.spec.tsx
auth.integration.test.ts
checkout.e2e.test.ts
```

### Test Suite Structure

```typescript
// Basic test structure
import { describe, it, expect } from 'vitest';

describe('FeatureName', () => {
  describe('FunctionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = processData(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Test Organization Best Practices

1. **Group Related Tests with `describe` blocks**

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should authenticate valid credentials');
    it('should reject invalid credentials');
    it('should handle network errors');
  });

  describe('logout', () => {
    it('should clear session');
    it('should redirect to login');
  });
});
```

2. **Use Test Context for Shared Setup**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  it('should connect to database', async () => {
    await service.connect();
    expect(service.isConnected).toBe(true);
  });
});
```

3. **Organize Tests by Behavior, Not Implementation**

```typescript
// Good - behavior-based
describe('when user is authenticated', () => {
  it('should allow access to protected routes');
});

// Avoid - implementation-based
describe('when auth middleware returns true', () => {
  it('should call next()');
});
```

---

## 3. Mocking Strategies

### 3.1 Module Mocking with `vi.mock()`

#### Auto-Mocked Modules

```typescript
// Mock entire module automatically
import { vi } from 'vitest';
import { axios } from 'axios';

vi.mock('axios');

// Usage in tests
axios.get.mockResolvedValue({ data: 'mocked' });
```

#### Manual Module Mocks

```typescript
// Mock with custom implementation
vi.mock('./myModule', () => ({
  processData: vi.fn((input: string) => input.toUpperCase()),
  default: vi.fn(() => ({ id: 1, name: 'mocked' })),
}));
```

#### Partial Mocking

```typescript
// Mock specific exports while keeping others
vi.mock('./myModule', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    specificFunction: vi.fn(() => 'mocked'),
  };
});
```

#### Mocking Dependencies Deeply

```typescript
// Mock nested dependencies
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: 'mocked' })),
      post: vi.fn(() => Promise.resolve({ data: 'created' })),
    })),
  },
}));
```

### 3.2 Function Mocking with `vi.fn()`

#### Basic Function Mocks

```typescript
const mockFn = vi.fn();

// Track calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenLastCalledWith('arg3');
```

#### Return Values

```typescript
// Synchronous return value
const mockFn = vi.fn(() => 'default');
mockFn.mockReturnValue('value');

// Different return values on sequential calls
mockFn
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

// Async return value
mockFn.mockResolvedValue({ data: 'async' });
mockFn.mockRejectedValue(new Error('error'));
```

#### Custom Implementations

```typescript
// Complex implementation
mockFn.mockImplementation(arg => {
  if (arg === 'error') throw new Error('Invalid');
  return arg.toUpperCase();
});

// Async implementation
mockFn.mockImplementation(async id => {
  const data = await fetchData(id);
  return transformData(data);
});
```

#### Call History Inspection

```typescript
mockFn('a', 'b');
mockFn('c', 'd');

// Access call history
expect(mockFn.calls[0]).toEqual(['a', 'b']);
expect(mockFn.calls[1]).toEqual(['c', 'd']);

// Access results
expect(mockFn.results[0].value).toBe('result');
```

### 3.3 Environment Variable Mocking with `vi.stubEnv()`

#### Basic Environment Stubs

```typescript
import { vi } from 'vitest';

test('uses test environment', () => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('API_URL', 'https://api.test.com');
  vi.stubEnv('API_KEY', 'test-key-123');

  expect(process.env.NODE_ENV).toBe('test');

  // Clean up
  vi.unstubAllEnvs();
});
```

#### Scoped Environment Changes

```typescript
describe('with test environment', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should connect to test database', () => {
    // Test code
  });
});
```

### 3.4 Spying with `vi.spyOn()`

#### Spying on Methods

```typescript
import { vi } from 'vitest';
import { UserService } from './UserService';

const service = new UserService();

// Spy on method
const loginSpy = vi.spyOn(service, 'login');

// Track calls without affecting behavior
await service.login('user', 'pass');
expect(loginSpy).toHaveBeenCalledWith('user', 'pass');

// Mock implementation
loginSpy.mockResolvedValue({ success: true });

// Restore original
loginSpy.mockRestore();
```

#### Spying on Object Properties

```typescript
const obj = { method: () => 'original' };

const spy = vi.spyOn(obj, 'method');
spy.mockReturnValue('mocked');

expect(obj.method()).toBe('mocked');
```

#### Spying on Getters/Setters

```typescript
const obj = {
  get value() {
    return 'original';
  },
};

const getterSpy = vi.spyOn(obj, 'value', 'get');
getterSpy.mockReturnValue('mocked');

expect(obj.value).toBe('mocked');
```

### 3.5 Timer Mocking

#### Fake Timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

describe('with fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should advance time', () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });
});
```

#### Timer Control Methods

```typescript
// Run all pending timers
vi.runAllTimers();

// Run only current time frame
vi.runOnlyPendingTimers();

// Advance by specific duration
vi.advanceTimersByTime(1000);

// Advance to next timer
vi.advanceTimersToNextTimer();

// Set system time
vi.setSystemTime(new Date('2024-01-01'));
```

### 3.6 Mock File System Operations

```typescript
import { vi } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
}));

// Usage in tests
readFileSync.mockReturnValue('file content');

const content = readFileSync('/path/to/file');
expect(content).toBe('file content');
```

### 3.7 Mock External API Calls

#### Using vi.mock for HTTP Libraries

```typescript
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

// Setup mock responses
const mockAxios = axios as vi.Mocked<typeof axios>;

mockAxios.get.mockResolvedValue({
  data: { users: [{ id: 1, name: 'Test User' }] },
});

mockAxios.post.mockResolvedValue({
  data: { success: true, id: 123 },
});

// Test
test('fetches user data', async () => {
  const response = await axios.get('/api/users');
  expect(response.data.users).toHaveLength(1);
});
```

#### Using MSW (Mock Service Worker) Integration

```typescript
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json({ users: [] });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches users', async () => {
  const response = await fetch('/api/users');
  const data = await response.json();
  expect(data.users).toBeDefined();
});
```

---

## 4. Coverage Configuration and Thresholds

### 4.1 Basic Coverage Setup

#### Installation

```bash
npm install -D @vitest/coverage-v8
# or
npm install -D @vitest/coverage-istanbul
```

#### Configuration

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
});
```

### 4.2 Coverage Thresholds

#### Global Thresholds

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

#### Per-File Thresholds

```typescript
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        perFile: true, // Apply thresholds to each file
      },
    },
  },
});
```

#### Custom Threshold Files

```typescript
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        autoUpdate: true,
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        files: [
          {
            all: true,
            lines: 80,
          },
          {
            // Match specific file patterns
            include: ['src/core/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/*.mock.ts'],
            lines: 90,
            functions: 90,
            branches: 85,
          },
        ],
      },
    },
  },
});
```

### 4.3 Coverage Reporters

```typescript
export default defineConfig({
  test: {
    coverage: {
      reporter: [
        'text', // Console output
        'text-summary', // Summary in console
        'html', // HTML report
        'json', // JSON output
        'json-summary', // JSON summary
        'lcov', // LCOV format
        'lcovonly', // Only LCOV
      ],
      // Custom reporter options
      reportsDirectory: './coverage',
      htmlReporter: {
        subdir: 'html-report',
      },
    },
  },
});
```

### 4.4 Coverage Collection Options

```typescript
export default defineConfig({
  test: {
    coverage: {
      // Include specific files
      include: ['src/**/*.{js,ts,jsx,tsx}'],

      // Exclude files from coverage
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/*.config.{js,ts}',
        '**/mocks/**',
        '**/types/**',
      ],

      // Extension-specific settings
      extension: ['.js', '.ts', '.jsx', '.tsx'],

      // Clean coverage directory before generating
      clean: true,

      // Clean on Rerun
      cleanOnRerun: true,

      // All files (include files not imported in tests)
      all: true,

      // Allow external files
      allowExternal: false,
    },
  },
});
```

### 4.5 Running Coverage

```bash
# Run tests with coverage
vitest run --coverage

# Watch mode with coverage
vitest --coverage

# Coverage for specific files
vitest run --coverage src/utils

# Generate coverage report without running tests
vitest --coverage.reporter=html
```

---

## 5. Setup Files and Global Configuration

### 5.1 Setup Files

#### Basic Setup File

```typescript
// vitest.setup.ts
import { vi } from 'vitest'

// Global mocks
vi.mock('./src/lib/logger', () => ({
  log: vi.fn(),
  error: vi.fn()
}))

// Global test utilities
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
})

// Environment setup
process.env.NODE_ENV = 'test'
```

#### Configuration Reference

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    // Multiple setup files
    setupFiles: [
      './vitest.setup.ts',
      './vitest.database.setup.ts',
      './vitest.mocks.setup.ts',
    ],
  },
});
```

### 5.2 Global Configuration

#### Enable Global APIs

```typescript
export default defineConfig({
  test: {
    globals: true, // Use describe, it, expect globally
    environment: 'node', // or 'jsdom', 'happy-dom', 'edge-runtime'
  },
});
```

#### TypeScript Configuration for Globals

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### 5.3 Environment Configuration

```typescript
export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    // environmentOptions: {
    //   jsdom: {
    //     url: 'http://localhost:3000'
    //   }
    // },

    // Environment-specific setup
    environmentMatchGlobs: [
      ['**/*.browser.test.ts', 'jsdom'],
      ['**/*.node.test.ts', 'node'],
    ],
  },
});
```

### 5.4 Global Fixtures and Helpers

```typescript
// vitest.setup.ts
import { beforeEach, afterEach } from 'vitest';

// Global test database
let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb.close();
});

beforeEach(async () => {
  await testDb.migrate();
  await testDb.seed();
});

afterEach(async () => {
  await testDb.truncate();
});

// Make available globally
declare global {
  var testDb: TestDatabase;
}
```

### 5.5 Configuration File Options

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Include patterns
    include: ['**/*.{test,spec}.{js,ts}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.git'],

    // Test location
    includeSource: ['src/**/*.{js,ts}'],

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Isolation
    isolate: true,
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Reporting
    reporters: ['default'],
    outputFile: './test-results/results.xml',

    // Watch mode
    watch: true,

    // Bail on first failure
    bail: 1,

    // Retry failed tests
    retry: 2,

    // Diff configuration
    diff: 'u',
    diffMaxSize: 50000,
  },
});
```

---

## 6. Async Testing Patterns

### 6.1 Testing Promises

#### Basic Promise Tests

```typescript
import { test, expect } from 'vitest';

test('async function resolves', async () => {
  const result = await Promise.resolve(42);
  expect(result).toBe(42);
});

test('async function rejects', async () => {
  await expect(Promise.reject(new Error('Failed'))).rejects.toThrow('Failed');
});
```

#### Promise Resolution Patterns

```typescript
test('resolves with value', async () => {
  await expect(asyncFunction()).resolves.toMatchObject({ id: 1, name: 'Test' });
});

test('resolves with undefined', async () => {
  await expect(asyncFunction()).resolves.toBeUndefined();
});
```

### 6.2 Testing Async/Await

#### Sequential Async Operations

```typescript
test('handles sequential async operations', async () => {
  const user = await createUser({ name: 'John' });
  const post = await createPost({ userId: user.id, title: 'Hello' });

  expect(post.userId).toBe(user.id);
});
```

#### Parallel Async Operations

```typescript
test('handles parallel operations', async () => {
  const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

  expect(users).toBeDefined();
  expect(posts).toBeDefined();
});
```

### 6.3 Testing Callbacks and Events

#### Callback Testing

```typescript
test('calls callback with data', done => {
  fetchData(data => {
    expect(data).toBeDefined();
    done();
  });
});
```

#### Event Emitter Testing

```typescript
test('emits event with payload', async () => {
  const emitter = new EventEmitter();
  const eventPromise = new Promise(resolve => {
    emitter.once('data', resolve);
  });

  emitter.emit('data', { message: 'test' });
  await expect(eventPromise).resolves.toEqual({ message: 'test' });
});
```

### 6.4 Testing Time-Based Operations

#### setTimeout Testing

```typescript
import { vi, test, expect, beforeEach, afterEach } from 'vitest';

describe('setTimeout tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('executes after delay', () => {
    const callback = vi.fn();
    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });
});
```

#### setInterval Testing

```typescript
test('executes interval repeatedly', () => {
  const callback = vi.fn();
  setInterval(callback, 1000);

  vi.advanceTimersByTime(3000);
  expect(callback).toHaveBeenCalledTimes(3);
});
```

### 6.5 Testing Async Iterators

```typescript
test('async iterator yields values', async () => {
  const asyncGenerator = async function* () {
    yield 1;
    yield 2;
    yield 3;
  };

  const values = [];
  for await (const value of asyncGenerator()) {
    values.push(value);
  }

  expect(values).toEqual([1, 2, 3]);
});
```

### 6.6 Testing Streams

```typescript
import { Readable } from 'stream';

test('consumes stream data', async () => {
  const stream = Readable.from(['a', 'b', 'c']);
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  expect(chunks).toEqual(['a', 'b', 'c']);
});
```

### 6.7 Async Test Cleanup

```typescript
test('cleans up resources', async () => {
  const connection = await connectToDatabase();

  try {
    // Test code
  } finally {
    await connection.close();
  }
});

// Or using afterEach
let connection: Database;

beforeEach(async () => {
  connection = await connectToDatabase();
});

afterEach(async () => {
  await connection.close();
});
```

---

## 7. Test Watchers and Running Tests

### 7.1 CLI Commands

#### Basic Commands

```bash
# Run tests once
vitest run

# Watch mode (default)
vitest watch
vitest

# Run tests in UI mode
vitest --ui

# Run with coverage
vitest --coverage

# Run specific test file
vitest path/to/test.test.ts

# Run tests matching pattern
vitest --testNamePattern="should login"

# Run tests in specific file
vitest run src/auth.test.ts
```

#### Advanced Commands

```bash
# Run tests in specific directory
vitest run tests/unit

# Run tests with specific reporter
vitest --reporter=verbose

# Run tests and output to file
vitest --reporter=json --outputFile=test-results.json

# Run tests with specific config
vitest -c vitest.config.custom.ts

# Run tests for specific projects
vitest --project=frontend
```

### 7.2 Watch Mode

#### Watch Mode Features

```bash
# Start watch mode
vitest watch

# Watch mode options
vitest watch --coverage
vitest watch --ui
vitest watch --reporter=dot
```

#### Interactive Watch Commands

When in watch mode, you can use these keyboard shortcuts:

- **`r`** - Restart tests
- **`f`** - Run only failed tests
- **`u`** - Update snapshots
- **`p`** - Filter by filename
- **`t`** - Filter by test name pattern
- **`q`** - Quit
- **`h`** - Show help
- **`Enter`** - Trigger test run
- **`Space`** - Pause/resume watch mode

#### Watch Configuration

```typescript
export default defineConfig({
  test: {
    watch: true,
    // Ignore specific files/directories
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    // Include specific patterns
    watchInclude: ['src/**', 'tests/**'],
  },
});
```

### 7.3 Selective Test Running

#### Run Tests by Name Pattern

```bash
# Run tests matching pattern
vitest -t "should login"
vitest --testNamePattern="login"
```

#### Run Specific Test Suites

```typescript
// Use .only to run specific tests
describe.only('AuthService', () => {
  it.only('should login successfully', () => {
    // Only this test will run
  });

  it('should handle errors', () => {
    // Skipped
  });
});
```

#### Skip Tests

```typescript
// Skip entire suite
describe.skip('DatabaseTests', () => {
  // These tests will be skipped
});

// Skip specific test
it.skip('flaky test', () => {
  // This test will be skipped
});

// Conditional skip
it.runIf(process.env.CI === 'true')('CI only test', () => {
  // Runs only in CI
});

it.skipIf(process.env.NODE_ENV === 'production')('dev only test', () => {
  // Skipped in production
});
```

### 7.4 Parallel and Serial Execution

#### Configuration

```typescript
export default defineConfig({
  test: {
    // Run tests in parallel (default)
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Run tests sequentially
    isolate: true,

    // File-level parallelism
    fileParallelism: true,
  },
});
```

#### Serial Test Execution

```typescript
import { describe, test } from 'vitest';

describe.serial('Sequential tests', () => {
  test('runs first', async () => {
    // Runs before the next test
  });

  test('runs second', async () => {
    // Runs after first test completes
  });
});
```

### 7.5 Test Organization for Running

#### Tagging Tests

```typescript
// Using test context
import { test } from 'vitest';

test('fast test', async ({ task }) => {
  task.meta = { tags: ['@fast', '@unit'] };
});

test('slow test', async ({ task }) => {
  task.meta = { tags: ['@slow', '@integration'] };
});
```

#### Running Tagged Tests

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/@(integration|e2e)/**/*.test.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

---

## 8. Best Practices

### 8.1 Unit vs Integration vs E2E Test Separation

#### Test Pyramid Strategy

```
        /\
       /  \      E2E Tests (10%)
      /____\
     /      \    Integration Tests (30%)
    /________\
   /          \  Unit Tests (60%)
  /____________\
```

#### Directory Structure

```
tests/
  unit/                    # Fast, isolated tests
    utils/
      string.test.ts
      date.test.ts
    services/
      authService.test.ts
    components/
      Button.test.tsx

  integration/             # Slower, multi-component tests
    api/
      users.integration.test.ts
    workflows/
      login.integration.test.ts

  e2e/                    # Slowest, full system tests
    user-flows/
      checkout.e2e.test.ts
    critical-paths/
      authentication.e2e.test.ts
```

#### Unit Test Characteristics

```typescript
// tests/unit/utils/string.test.ts
import { describe, it, expect } from 'vitest';
import { capitalize } from '@/utils/string';

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  // Characteristics:
  // - Fast execution (< 1ms)
  // - No external dependencies
  // - No network calls
  // - No file system access
  // - Pure function testing
});
```

#### Integration Test Characteristics

```typescript
// tests/integration/api/users.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabase } from '@/test/utils';
import { UserService } from '@/services/UserService';
import { UserRepository } from '@/repositories/UserRepository';

describe('UserService Integration', () => {
  let db: TestDatabase;
  let userService: UserService;
  let userRepo: UserRepository;

  beforeEach(async () => {
    db = new TestDatabase();
    await db.migrate();
    await db.seed();

    userRepo = new UserRepository(db.connection);
    userService = new UserService(userRepo);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it('should create and retrieve user', async () => {
    const created = await userService.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const retrieved = await userService.findById(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.email).toBe('john@example.com');
  });

  // Characteristics:
  // - Medium execution time (10-100ms)
  // - Tests multiple components together
  // - Uses test database
  // - May mock external APIs
  // - Tests component integration
});
```

#### E2E Test Characteristics

```typescript
// tests/e2e/user-flows/checkout.e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'playwright';

describe('Checkout Flow E2E', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await playwright.chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should complete checkout process', async () => {
    // Navigate to site
    await page.goto('https://shop.example.com');

    // Add item to cart
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-icon"]');

    // Checkout
    await page.click('[data-testid="checkout-button"]');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="address"]', '123 Test St');
    await page.click('[data-testid="place-order"]');

    // Verify success
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
  });

  // Characteristics:
  // - Slow execution (1-10s)
  // - Tests complete user flows
  // - Uses real browser
  // - Tests critical paths only
  // - Minimal mocking
});
```

### 8.2 Mock File System Operations

#### Mocking fs Module

```typescript
// tests/unit/services/fileService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileService } from '@/services/FileService';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { existsSync, readFileSync, writeFileSync } from 'fs';

describe('FileService', () => {
  let fileService: FileService;

  beforeEach(() => {
    vi.clearAllMocks();
    fileService = new FileService();
  });

  it('should read file content', () => {
    const mockContent = 'file content';
    vi.mocked(readFileSync).mockReturnValue(mockContent);

    const content = fileService.read('/path/to/file.txt');

    expect(content).toBe(mockContent);
    expect(readFileSync).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
  });

  it('should write file content', () => {
    const content = 'new content';

    fileService.write('/path/to/file.txt', content);

    expect(writeFileSync).toHaveBeenCalledWith(
      '/path/to/file.txt',
      content,
      'utf-8'
    );
  });

  it('should check if file exists', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    const exists = fileService.exists('/path/to/file.txt');

    expect(exists).toBe(true);
    expect(existsSync).toHaveBeenCalledWith('/path/to/file.txt');
  });
});
```

#### Using Memory File System

```typescript
// tests/integration/storage/storage.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { memfs } from 'memfs';

describe('Storage Integration', () => {
  beforeEach(() => {
    // Create in-memory file system
    const { vol } = memfs();
    vol.fromJSON(
      {
        '/config/app.json': '{"port": 3000}',
        '/data/users.json': '[]',
      },
      '/'
    );
  });

  it('should read configuration', () => {
    const config = JSON.parse(fs.readFileSync('/config/app.json', 'utf-8'));
    expect(config.port).toBe(3000);
  });
});
```

### 8.3 Mock External API Calls

#### Strategy 1: Direct Mocking

```typescript
// tests/unit/services/apiService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ApiService } from '@/services/ApiService';

vi.mock('axios');
import axios from 'axios';

const mockedAxios = axios as vi.Mocked<typeof axios>;

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService('https://api.example.com');
  });

  it('should fetch user data', async () => {
    const mockUser = { id: 1, name: 'John' };
    mockedAxios.get.mockResolvedValue({ data: mockUser });

    const user = await apiService.getUser(1);

    expect(user).toEqual(mockUser);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.example.com/users/1'
    );
  });

  it('should handle API errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    await expect(apiService.getUser(1)).rejects.toThrow('Network Error');
  });
});
```

#### Strategy 2: Using MSW (Mock Service Worker)

```typescript
// tests/setup/msw.setup.ts
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  // User endpoints
  http.get('https://api.example.com/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: 'Test User',
      email: 'test@example.com',
    });
  }),

  http.post('https://api.example.com/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 1, ...body }, { status: 201 });
  }),

  // Error handling
  http.get('https://api.example.com/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  })
);
```

```typescript
// tests/integration/api/users.integration.test.ts
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../setup/msw.setup';
import { UserService } from '@/services/UserService';

describe('UserService Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should fetch user from API', async () => {
    const service = new UserService();
    const user = await service.getUser(1);

    expect(user).toEqual({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('should create user via API', async () => {
    const service = new UserService();
    const user = await service.createUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    expect(user.id).toBe(1);
    expect(user.name).toBe('Jane Doe');
  });
});
```

#### Strategy 3: Fetch Mocking

```typescript
// tests/unit/utils/http.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
global.fetch = vi.fn();

describe('HTTP Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch JSON data', async () => {
    const mockData = { result: 'success' };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const data = await fetchJson('https://api.example.com/data');

    expect(data).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/data');
  });
});
```

### 8.4 Test Naming Conventions

#### Descriptive Test Names

```typescript
// Good - descriptive and clear
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Clear what this test does
  });

  it('should throw error when email is already registered', async () => {
    // Clear about the expected error condition
  });

  it('should return null when user does not exist', async () => {
    // Clear about the expected return value
  });
});

// Avoid - vague names
describe('UserService', () => {
  it('should work', async () => {
    // What works?
  });

  it('test user', async () => {
    // Test what about user?
  });

  it('returns value', async () => {
    // What value? When?
  });
});
```

#### Given-When-Then Pattern

```typescript
describe('Shopping Cart', () => {
  describe('checkout', () => {
    it('should calculate total with tax when cart has items and user is in taxable region', async () => {
      // Given
      const cart = new ShoppingCart();
      cart.addItem({ price: 100, quantity: 2 });
      const region = 'taxable';

      // When
      const total = await cart.checkout(region);

      // Then
      expect(total).toBe(220); // 200 + 10% tax
    });
  });
});
```

#### Should Conventions

```typescript
// Use "should" for expected behaviors
describe('AuthService', () => {
  it('should authenticate valid credentials', async () => {
    // Test authentication
  });

  it('should reject invalid credentials', async () => {
    // Test rejection
  });

  it('should lock account after 5 failed attempts', async () => {
    // Test account locking
  });

  it('should return token on successful login', async () => {
    // Test token generation
  });
});
```

### 8.5 Test Organization Patterns

#### Pattern 1: Feature-Based Organization

```
tests/
  auth/
    login.test.ts
    logout.test.ts
    password-reset.test.ts
  users/
    profile.test.ts
    settings.test.ts
  products/
    catalog.test.ts
    search.test.ts
```

#### Pattern 2: Layer-Based Organization

```
tests/
  controllers/
    authController.test.ts
  services/
    authService.test.ts
  repositories/
    userRepository.test.ts
  models/
    user.test.ts
```

#### Pattern 3: Test Type Organization

```
tests/
  unit/
    services/
    utils/
    components/
  integration/
    api/
    workflows/
  e2e/
    scenarios/
```

#### Test Suite Organization

```typescript
// Organize by feature and scenario
describe('Authentication Feature', () => {
  describe('Login Scenario', () => {
    describe('with valid credentials', () => {
      it('should authenticate user');
      it('should redirect to dashboard');
      it('should set session cookie');
    });

    describe('with invalid credentials', () => {
      it('should show error message');
      it('should remain on login page');
      it('should not set session cookie');
    });

    describe('with locked account', () => {
      it('should show locked message');
      it('should offer password reset');
    });
  });
});
```

#### Context-Based Organization

```typescript
describe('PaymentProcessor', () => {
  describe('when payment succeeds', () => {
    beforeEach(() => {
      // Setup successful payment scenario
    });

    it('should update order status');
    it('should send confirmation email');
    it('should deduct inventory');
  });

  describe('when payment fails', () => {
    beforeEach(() => {
      // Setup failed payment scenario
    });

    it('should log error');
    it('should notify user');
    it('should allow retry');
  });
});
```

---

## Additional Best Practices

### Test Independence

```typescript
// Each test should be independent
describe('Independent Tests', () => {
  it('test 1 - does not depend on other tests', () => {
    // Complete setup in test
    const user = createTestUser();
    const result = processUser(user);
    expect(result).toBeDefined();
  });

  it('test 2 - does not depend on test 1', () => {
    // Fresh setup, no shared state
    const user = createTestUser();
    const result = deleteUser(user);
    expect(result).toBe(true);
  });
});
```

### Test Readability

```typescript
// Good - readable and maintainable
test('should apply discount to cart total', () => {
  const cart = new Cart();
  cart.addItem({ name: 'Item', price: 100 });

  cart.applyDiscount('SUMMER20');

  expect(cart.total).toBe(80);
});

// Avoid - hard to understand
test('total', () => {
  const c = new Cart();
  c.a({ n: 'Item', p: 100 });
  c.d('SUMMER20');
  expect(c.t).toBe(80);
});
```

### Test Maintenance

```typescript
// Use test fixtures for reusable setup
class UserFixture {
  static createUser(overrides = {}) {
    return {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      ...overrides,
    };
  }

  static createAdminUser() {
    return this.createUser({ role: 'admin' });
  }
}

test('should delete user', async () => {
  const user = UserFixture.createUser();
  await userService.delete(user.id);

  await expect(userService.find(user.id)).resolves.toBeNull();
});
```

### Error Testing

```typescript
describe('Error Handling', () => {
  it('should throw validation error for invalid input', async () => {
    await expect(userService.create({ email: 'invalid' })).rejects.toThrow(
      'Invalid email'
    );
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network Error'));

    const result = await apiService.getData();

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });
});
```

---

## Summary

This comprehensive guide covers:

1. **Vitest Documentation URLs** - Direct links to official documentation
2. **Test Structure and Organization** - File organization, naming, and structure patterns
3. **Mocking Strategies** - Comprehensive mocking techniques including vi.mock, vi.fn, vi.stubEnv, and spying
4. **Coverage Configuration** - Setup, thresholds, and reporting options
5. **Setup and Global Configuration** - Configuration files, environment setup, and global fixtures
6. **Async Testing Patterns** - Promises, async/await, timers, and streams
7. **Test Watchers and Running Tests** - CLI commands, watch mode, and selective execution
8. **Best Practices** - Test separation, mocking patterns, naming conventions, and organization

### Key Takeaways

- **Organize tests by type**: Unit (fast, isolated), Integration (multi-component), E2E (full system)
- **Mock appropriately**: Use vi.mock for modules, vi.fn for functions, vi.stubEnv for environment variables
- **Configure coverage**: Set meaningful thresholds and use multiple reporters
- **Write clear tests**: Use descriptive names, follow Given-When-Then pattern, ensure independence
- **Leverage Vitest features**: Use watch mode, UI mode, and selective test execution for productivity
