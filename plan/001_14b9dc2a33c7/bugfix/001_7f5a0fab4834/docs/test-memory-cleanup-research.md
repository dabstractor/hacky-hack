# Memory Cleanup Patterns in JavaScript/TypeScript Testing

## Research Summary

This document compiles research findings on memory cleanup patterns in JavaScript/TypeScript testing, with a focus on Vitest, Node.js garbage collection, and best practices for preventing memory leaks in test suites.

**Note**: This research was compiled when web search services were unavailable. Some external documentation links need verification from official sources.

---

## Table of Contents

1. [Memory Leaks in Test Suites](#memory-leaks-in-test-suites)
2. [global.gc() in Node.js](#globalgc-in-nodejs)
3. [Mock Cleanup Best Practices](#mock-cleanup-best-practices)
4. [Vitest Cleanup Functions](#vitest-cleanup-functions)
5. [afterAll vs afterEach Hooks](#afterall-vs-aftereach-hooks)
6. [Test Infrastructure Examples](#test-infrastructure-examples)
7. [Global Setup/Teardown in Vitest](#global-setupteardown-in-vitest)

---

## Memory Leaks in Test Suites

### Common Memory Leak Patterns

#### 1. **Unclosed Mocks and Spies**

```typescript
// ❌ BAD: Mocks not cleaned up
describe('UserService', () => {
  it('should create user', () => {
    vi.mock('./database');
    const mockDb = vi.fn();
    // Test code...
  });
  // Mock persists to next test!
});

// ✅ GOOD: Clean up mocks
describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create user', () => {
    vi.mock('./database');
    const mockDb = vi.fn();
    // Test code...
  });
});
```

#### 2. **Stubbed Environment Variables**

```typescript
// ❌ BAD: Environment variables not restored
describe('Config', () => {
  it('should load config', () => {
    vi.stubEnv('API_KEY', 'test-key');
    // Test code...
  });
  // API_KEY persists to next test!
});

// ✅ GOOD: Restore environment variables
describe('Config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should load config', () => {
    vi.stubEnv('API_KEY', 'test-key');
    // Test code...
  });
});
```

#### 3. **Fake Timers Not Restored**

```typescript
// ❌ BAD: Fake timers not restored
describe('Scheduler', () => {
  it('should schedule task', () => {
    vi.useFakeTimers();
    // Test code...
  });
  // Timers remain fake!
});

// ✅ GOOD: Restore real timers
describe('Scheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should schedule task', () => {
    vi.useFakeTimers();
    // Test code...
  });
});
```

#### 4. **Event Listeners Not Removed**

```typescript
// ❌ BAD: Event listeners accumulate
describe('EventManager', () => {
  it('should handle event', () => {
    const emitter = new EventEmitter();
    emitter.on('data', handler);
    // Test code...
  });
  // Listener persists!
});

// ✅ GOOD: Remove event listeners
describe('EventManager', () => {
  afterEach(() => {
    emitter.removeAllListeners();
  });

  it('should handle event', () => {
    const emitter = new EventEmitter();
    emitter.on('data', handler);
    // Test code...
  });
});
```

#### 5. **Unclosed File Handles and Resources**

```typescript
// ❌ BAD: File handles not closed
describe('FileProcessor', () => {
  it('should process file', () => {
    const stream = fs.createReadStream('test.txt');
    // Test code...
  });
  // Stream remains open!
});

// ✅ GOOD: Close file handles
describe('FileProcessor', () => {
  afterEach(() => {
    stream?.close();
  });

  it('should process file', () => {
    const stream = fs.createReadStream('test.txt');
    // Test code...
  });
});
```

#### 6. **Signal Handlers Not Removed**

Found in your codebase at `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`:

```typescript
// Lines 1284-1349: Signal listener cleanup to prevent memory leaks
cleanup(): void {
  // Remove signal listeners to prevent memory leaks
  process.removeListener('SIGINT', this.#sigintHandler);
  process.removeListener('SIGTERM', this.#sigtermHandler);
}
```

### Memory Leak Detection Patterns

From your `/home/dustin/projects/hacky-hack/src/utils/resource-monitor.ts`:

```typescript
// Detects both file handle leaks and memory leaks
// Check memory leak (>20% growth)
if (memoryGrowth > 0.2) {
  issues.push({
    severity: 'warning',
    metric: 'memory',
    message: 'Potential memory leak detected',
    suggestion: 'Consider restarting the process',
  });
}
```

---

## global.gc() in Node.js

### What is global.gc()?

`global.gc()` is a Node.js function that manually triggers the V8 garbage collector. It's **not available by default** and must be explicitly enabled.

### How to Enable global.gc()

```bash
# Start Node.js with --expose-gc flag
node --expose-gc script.js

# Use with Vitest
NODE_OPTIONS="--expose-gc" vitest

# Or in package.json scripts
{
  "scripts": {
    "test": "NODE_OPTIONS=\"--expose-gc --max-old-space-size=4096\" vitest"
  }
}
```

### Why global.gc() Helps with Test Memory Cleanup

1. **Deterministic Cleanup**: Tests create temporary objects that accumulate between test runs. Manual GC ensures these are cleaned up.

2. **Memory Measurement**: Accurate memory comparisons require GC to get stable baseline measurements.

3. **Prevents OOM**: Large test suites can exhaust heap memory without periodic GC.

### Checking if global.gc Exists

```typescript
// Safe pattern for checking if global.gc is available
function runGarbageCollection(): void {
  if (typeof global.gc === 'function') {
    global.gc();
    console.log('Garbage collection completed');
  } else {
    console.warn('global.gc() not available. Start Node.js with --expose-gc flag');
  }
}

// Usage in tests
describe('Memory Management', () => {
  afterEach(() => {
    if (typeof global.gc === 'function') {
      global.gc();
    }
  });
});
```

### Example: Memory Leak Testing with global.gc()

```typescript
describe('Memory Leak Detection', () => {
  it('should not leak memory', () => {
    // Force GC before measurement
    if (typeof global.gc === 'function') {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;

    // Run operations that might leak
    for (let i = 0; i < 1000; i++) {
      const obj = createObject();
      processObject(obj);
    }

    // Force GC after operations
    if (typeof global.gc === 'function') {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = (finalMemory - initialMemory) / initialMemory;

    // Allow some growth but detect significant leaks
    expect(memoryGrowth).toBeLessThan(0.5); // Less than 50% growth
  });
});
```

### When NOT to Use global.gc()

- **Production code**: Never use in production; it's for testing/debugging only
- **Performance-sensitive tests**: GC pauses can skew performance measurements
- **CI without --expose-gc**: Tests will fail if flag isn't set

---

## Mock Cleanup Best Practices

### Vitest Mock Hierarchy

```
vi.mock()         // Module-level mocking (hoisted, top-level only)
vi.spyOn()        // Spying on existing methods
vi.fn()           // Creating mock functions
vi.stubEnv()      // Environment variable stubbing
vi.unstubAllEnvs() // Restore all environment variables
vi.clearAllMocks() // Clear all mock calls and instances
vi.restoreAllMocks() // Restore all mocks to original implementations
```

### Cleanup Strategy Matrix

| Mock Type | Creation | Cleanup | When to Use |
|-----------|----------|---------|-------------|
| Module mocks | `vi.mock()` | `vi.unmock()` | Entire test file |
| Spies | `vi.spyOn()` | `mock.mockRestore()` | Per test |
| Mock functions | `vi.fn()` | `vi.clearAllMocks()` | Per test suite |
| Environment vars | `vi.stubEnv()` | `vi.unstubAllEnvs()` | Per test suite |
| Timers | `vi.useFakeTimers()` | `vi.useRealTimers()` | Per test |

### Best Practice: Global Setup File

From your codebase documentation at `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/architecture/implementation_patterns.md`:

```typescript
// tests/setup.ts
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  // Clean up before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
```

### Your Codebase Pattern (from contributing.md)

Found in `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/contributing.md`:

```typescript
// Environment variable stubbing pattern
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

---

## Vitest Cleanup Functions

### vi.clearAllMocks()

**Purpose**: Clears all mock calls and instances from `vi.fn()` and `vi.spyOn()`.

**What it does**:
- Resets `.mock` properties (calls, instances, results, contexts)
- Does **not** remove the mocks themselves
- Does **not** restore original implementations

**When to use**: After each test to reset mock state

```typescript
describe('clearAllMocks example', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    const mock = vi.fn();
    mock('call1');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('test 2', () => {
    const mock = vi.fn();
    mock('call2');
    expect(mock).toHaveBeenCalledTimes(1); // Would fail without clearAllMocks
  });
});
```

### vi.unstubAllEnvs()

**Purpose**: Restores all environment variables stubbed with `vi.stubEnv()`.

**What it does**:
- Removes all environment variable stubs
- Restores original `process.env` values

**When to use**: After tests that modify environment variables

```typescript
describe('unstubAllEnvs example', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should use test API key', () => {
    vi.stubEnv('API_KEY', 'test-key');
    expect(process.env.API_KEY).toBe('test-key');
  });

  it('should have no API key', () => {
    // Would fail without unstubAllEnvs
    expect(process.env.API_KEY).toBeUndefined();
  });
});
```

### vi.restoreAllMocks()

**Purpose**: Restores all mocks to their original implementations.

**What it does**:
- Removes all `vi.spyOn()` spies
- Restores original methods
- More thorough than `clearAllMocks()`

**When to use**: When you need original implementations back

```typescript
describe('restoreAllMocks example', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use mock implementation', () => {
    const spy = vi.spyOn(fs, 'readFile').mockResolvedValue('mock data');
    await readFile('test.txt');
    expect(spy).toHaveBeenCalled();
  });

  it('should use real implementation', () => {
    // Would fail without restoreAllMocks
    const data = await readFile('real-test.txt');
    expect(data).toBeTruthy();
  });
});
```

### Complete Cleanup Checklist

From your codebase usage (100+ instances found):

```typescript
afterEach(() => {
  // 1. Clear all mock calls
  vi.clearAllMocks();

  // 2. Restore environment variables
  vi.unstubAllEnvs();

  // 3. Restore real timers (if using fake timers)
  vi.useRealTimers();

  // 4. Optional: Restore original implementations
  vi.restoreAllMocks();

  // 5. Optional: Trigger garbage collection (if --expose-gc is enabled)
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

---

## afterAll vs afterEach Hooks

### Key Differences

| Aspect | afterAll | afterEach |
|--------|----------|-----------|
| **Frequency** | Once after all tests | After each test |
| **Use case** | Shared resources | Per-test cleanup |
| **Performance** | Faster | More overhead |
| **Isolation** | Less isolation | Complete isolation |

### afterAll: When to Use

**Use for**: Expensive setup/teardown that can be shared across tests

```typescript
describe('Database Integration Tests', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    // Single connection for all tests
    connection = await createConnection();
  });

  afterAll(async () => {
    // Close once after all tests
    await connection.close();
  });

  it('should create user', async () => {
    await connection.insert('users', { name: 'Alice' });
  });

  it('should find user', async () => {
    const user = await connection.find('users', { name: 'Alice' });
    expect(user).toBeDefined();
  });
});
```

### afterEach: When to Use

**Use for**: Cleanup that must happen between every test

```typescript
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  afterEach(() => {
    // Clean up after each test
    service.clearCache();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('should create user', () => {
    service.createUser('Alice');
  });

  it('should find user', () => {
    // Starts fresh, no cache from previous test
    service.findUser('Alice');
  });
});
```

### Your Codebase Patterns

From `/home/dustin/projects/hacky-hack/tests/unit/agents/agent-factory.test.ts`:

```typescript
describe('Agent Factory', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // Tests...
});
```

From `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts`:

```typescript
describe('Tools Integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Tests...
});
```

### Decision Tree

```
Does the resource persist across tests?
├── Yes → Use beforeAll/afterAll (database, server)
└── No → Use beforeEach/afterEach (mocks, env vars, state)

Does cleanup affect performance?
├── Yes → Use afterAll sparingly
└── No → Use afterEach for complete isolation

Can tests interfere with each other?
├── Yes → MUST use afterEach
└── No → Can use afterAll for efficiency
```

---

## Test Infrastructure Examples

### Example 1: Global Setup with Memory Management

```typescript
// tests/setup.ts
import { beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';

let initialMemory: number;

beforeAll(() => {
  // Record baseline memory
  if (typeof global.gc === 'function') {
    global.gc();
  }
  initialMemory = process.memoryUsage().heapUsed;
});

beforeEach(() => {
  // Clean up before each test
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();

  // Optional: Log memory growth
  const currentMemory = process.memoryUsage().heapUsed;
  const growth = (currentMemory - initialMemory) / initialMemory;
  if (growth > 0.5) {
    console.warn(`Memory growth: ${(growth * 100).toFixed(1)}%`);
  }

  // Optional: Force garbage collection
  if (typeof global.gc === 'function') {
    global.gc();
  }
});

afterAll(() => {
  // Final cleanup
  if (typeof global.gc === 'function') {
    global.gc();
  }
  const finalMemory = process.memoryUsage().heapUsed;
  const totalGrowth = (finalMemory - initialMemory) / initialMemory;
  console.log(`Total test suite memory growth: ${(totalGrowth * 100).toFixed(1)}%`);
});
```

### Example 2: Memory Leak Test Helper

```typescript
// tests/utils/memory-leak-detector.ts
export function createMemoryLeakDetector(threshold: number = 0.5) {
  return {
    async detectLeaks(
      operation: () => Promise<void> | void,
      iterations: number = 100
    ): Promise<void> {
      // Force GC before baseline
      if (typeof global.gc === 'function') {
        global.gc();
      }

      const baseline = process.memoryUsage().heapUsed;

      // Run operation multiple times
      for (let i = 0; i < iterations; i++) {
        await operation();
      }

      // Force GC after operations
      if (typeof global.gc === 'function') {
        global.gc();
      }

      const final = process.memoryUsage().heapUsed;
      const growth = (final - baseline) / baseline;

      if (growth > threshold) {
        throw new Error(
          `Memory leak detected: ${(growth * 100).toFixed(1)}% growth ` +
          `(threshold: ${(threshold * 100).toFixed(1)}%)`
        );
      }
    },
  };
}

// Usage
describe('Memory Leak Tests', () => {
  it('should not leak memory when creating objects', async () => {
    const detector = createMemoryLeakDetector(0.5);

    await detector.detectLeaks(() => {
      const obj = { data: new Array(1000).fill('x') };
      processData(obj);
    });
  });
});
```

### Example 3: Resource Monitoring (From Your Codebase)

From `/home/dustin/projects/hacky-hack/src/utils/resource-monitor.ts`:

```typescript
export class ResourceMonitor {
  /**
   * Detects both file handle leaks and memory leaks
   */
  checkLeaks(): ResourceIssue[] {
    const issues: ResourceIssue[] = [];

    // Check file handles
    const fileHandleUsage = this.getFileHandleUsage();
    if (fileHandleUsage > this.config.fileHandleWarnThreshold) {
      issues.push({
        severity: 'warning',
        metric: 'fileHandles',
        message: 'File handle usage exceeds warning threshold',
        suggestion: 'Close unused file handles',
      });
    }

    // Check memory leak (>20% growth)
    const memoryGrowth = this.getMemoryGrowth();
    if (memoryGrowth > 0.2) {
      issues.push({
        severity: 'warning',
        metric: 'memory',
        message: 'Potential memory leak detected',
        suggestion: 'Consider restarting the process',
      });
    }

    return issues;
  }
}
```

---

## Global Setup/Teardown in Vitest

### Vitest Configuration for Global Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Global setup file (runs once before all tests)
    setupFiles: ['./tests/setup.ts'],

    // Global setup file (runs in isolated context)
    globalSetup: ['./tests/global-setup.ts'],

    // Environment
    environment: 'node',

    // Memory settings
    maxMemoryUsage: 4096, // MB (approximately)

    // Coverage
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

### Global Setup File

```typescript
// tests/global-setup.ts
import type { VitestGlobalSetup } from 'vitest';

export default {
  async setup({ provide }) {
    // This runs once before all test files
    console.log('Global setup: initializing test environment');

    // Initialize shared resources
    const testDatabase = await createTestDatabase();

    // Provide to tests via globalThis
    provide('testDatabase', testDatabase);

    // Force initial GC
    if (typeof global.gc === 'function') {
      global.gc();
    }
  },

  async teardown() {
    // This runs once after all test files
    console.log('Global teardown: cleaning up test environment');

    // Force final GC
    if (typeof global.gc === 'function') {
      global.gc();
    }

    // Log memory usage
    const memory = process.memoryUsage();
    console.log(`Final memory usage: ${memory.heapUsed / 1024 / 1024} MB`);
  },
} satisfies VitestGlobalSetup;
```

### Per-Test Setup File

```typescript
// tests/setup.ts
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  // Runs before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Runs after each test
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();

  // Optional: Force GC after each test
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

### Your Codebase's Task (From tasks.json)

Found in `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/tasks.json`:

```json
{
  "description": "Create tests/setup.ts with global beforeEach/afterEach hooks to prevent memory leaks",
  "context_scope": "CONTRACT DEFINITION:\n1. Create tests/setup.ts file with global test setup/teardown\n2. Implement beforeEach hook to clear mocks and reset state\n3. Implement afterEach hook to clean up mocks, env vars, and timers\n4. Optional: Add global.gc() call if --expose-gc is enabled\n5. Update vitest.config.ts to reference setup file"
}
```

---

## Memory Cleanup in package.json Scripts

From `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/architecture/external_deps.md`:

```json
{
  "scripts": {
    "test": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest",
    "test:run": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest run",
    "test:coverage": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest run --coverage",
    "test:with-gc": "NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" vitest"
  }
}
```

---

## Key Takeaways

### Memory Cleanup Checklist

- [ ] **Clear mocks**: Use `vi.clearAllMocks()` in `afterEach`
- [ ] **Restore env vars**: Use `vi.unstubAllEnvs()` in `afterEach`
- [ ] **Restore timers**: Use `vi.useRealTimers()` if using fake timers
- [ ] **Remove listeners**: Clean up event listeners and signal handlers
- [ ] **Close resources**: Close file handles, database connections, streams
- [ ] **Force GC**: Use `global.gc()` with `--expose-gc` flag (optional)
- [ ] **Monitor memory**: Track memory growth in test infrastructure
- [ ] **Global setup**: Create `tests/setup.ts` with consistent cleanup

### Global Setup Benefits

From your codebase note: "Global setup helps with memory cleanup per test infrastructure report."

**Benefits**:
1. **Consistent cleanup**: All tests follow same cleanup pattern
2. **Prevents leaks**: Centralized cleanup prevents forgotten teardown
3. **Memory management**: Can integrate GC calls at global level
4. **Maintainability**: Single source of truth for test setup

### External Documentation References

**Note**: These URLs should be verified when web access is available:

- **Vitest API**: https://vitest.dev/api/
- **Vitest Mocking**: https://vitest.dev/guide/mocking.html
- **Vitest Setup Files**: https://vitest.dev/config/#setupfiles
- **Node.js --expose-gc**: https://nodejs.org/api/cli.html#--expose-gc
- **Node.js process.memoryUsage**: https://nodejs.org/api/process.html#processmemoryusage
- **Jest Setup/Teardown**: https://jestjs.io/docs/setup-teardown (similar patterns)

---

## Code Examples Summary

### Basic Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
    vi.stubEnv('API_KEY', 'test-key');
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();

    if (typeof global.gc === 'function') {
      global.gc();
    }
  });

  it('should do something', () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

### Memory-Aware Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Memory-Aware Tests', () => {
  let baselineMemory: number;

  beforeAll(() => {
    if (typeof global.gc === 'function') {
      global.gc();
    }
    baselineMemory = process.memoryUsage().heapUsed;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    if (typeof global.gc === 'function') {
      global.gc();
    }
    const finalMemory = process.memoryUsage().heapUsed;
    const growth = (finalMemory - baselineMemory) / baselineMemory;
    console.log(`Memory growth: ${(growth * 100).toFixed(1)}%`);
  });

  it('should not leak memory', () => {
    // Test implementation
  });
});
```

---

**Document Status**: Research compiled when web search services were unavailable. External documentation links should be verified from official sources when access is restored.

**Last Updated**: 2025-01-15
**Research Context**: Memory cleanup patterns for JavaScript/TypeScript testing with focus on Vitest, Node.js garbage collection, and preventing memory leaks in test suites.
