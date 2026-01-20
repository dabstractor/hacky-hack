# TypeScript Integration Testing Best Practices with Vitest (2026)

**Research Document:** P1.M1.T1.S3
**Last Updated:** 2026-01-17
**Focus:** TypeScript integration testing patterns with Vitest for session management, state systems, and file system operations

---

## Table of Contents

1. [Official Documentation & Resources](#official-documentation--resources)
2. [Vitest Configuration Best Practices](#vitest-configuration-best-practices)
3. [TypeScript-Specific Testing Patterns](#typescript-specific-testing-patterns)
4. [Session Management Testing Patterns](#session-management-testing-patterns)
5. [State System Testing Patterns](#state-system-testing-patterns)
6. [Mock Object Creation Patterns](#mock-object-creation-patterns)
7. [File System Testing Patterns](#file-system-testing-patterns)
8. [Assertion & Verification Patterns](#assertion--verification-patterns)
9. [Multi-Step Verification Patterns](#multi-step-verification-patterns)
10. [Common Gotchas & Solutions](#common-gotchas--solutions)
11. [Testing Anti-Patterns to Avoid](#testing-anti-patterns-to-avoid)
12. [Performance Optimization Patterns](#performance-optimization-patterns)

---

## Official Documentation & Resources

### Primary Documentation

- **Vitest Official Documentation:** https://vitest.dev/guide/
- **Vitest API Reference:** https://vitest.dev/api/
- **Vitest Configuration Guide:** https://vitest.dev/config/
- **TypeScript Testing Guide:** https://vitest.dev/guide/why.html
- **Vitest Migration Guide (from Jest):** https://vitest.dev/guide/migration.html

### Testing Best Practices

- **Vitest Testing Best Practices:** https://vitest.dev/guide/test.html
- **Mocking Reference:** https://vitest.dev/api/mock.html
- **Coverage Configuration:** https://vitest.dev/guide/coverage.html
- **Snapshot Testing:** https://vitest.dev/guide/snapshot.html

### TypeScript-Specific Resources

- **TypeScript Jest/Vitest Types:** https://www.npmjs.com/package/@vitest/spy
- **TypeScript Testing Utilities:** https://www.npmjs.com/package/@types/node
- **ts-pattern for Advanced Matching:** https://github.com/gvergnaud/ts-pattern

### Related Testing Libraries

- **Vitest Coverage V8:** https://www.npmjs.com/package/@vitest/coverage-v8
- **memfs (In-Memory File System):** https://github.com/streamich/memfs
- **fake-file-system (Alternative):** https://github.com/patrick-steele-idem/memfs

### Community Resources

- **Vitest GitHub Discussions:** https://github.com/vitest-dev/vitest/discussions
- **Vitest Awesome List:** https://github.com/vitest-dev/vitest-awesome
- **Testing Best Practices Blog:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## Vitest Configuration Best Practices

### 1. Basic TypeScript Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Environment setup
    environment: 'node',  // or 'jsdom' for browser APIs
    globals: true,        // Use global describe, it, expect

    // Test file patterns
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Module resolution
    deps: {
      interopDefault: true,  // Better CommonJS/ESM interop
    },

    // File system access
    fs: {
      allow: ['.', '..'],  // Allow access to project files
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',  // Faster than istanbul
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
    extensions: ['.ts', '.js', '.tsx'],
  },
});
```

### 2. Parallel Test Execution Configuration

```typescript
export default defineConfig({
  test: {
    // Control parallel execution
    fileParallelism: true,  // Run test files in parallel
    maxThreads: 4,          // Limit worker threads
    minThreads: 1,

    // Test timeout configuration
    testTimeout: 10000,     // Default test timeout (ms)
    hookTimeout: 10000,     // Default hook timeout (ms)

    // Isolation settings
    isolate: true,          // Isolate tests from each other
  },
});
```

### 3. Workspace Configuration (Monorepos)

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Core library tests
  {
    test: {
      name: 'core',
      include: ['packages/core/**/*.test.ts'],
    },
  },
  // Integration tests
  {
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts'],
    },
  },
]);
```

---

## TypeScript-Specific Testing Patterns

### 1. Type-Safe Test Data Generation

```typescript
import type { Session, Backlog, Task } from '@/core/models';

// Type-safe factory functions
function createMockSession(overrides?: Partial<Session>): Session {
  return {
    id: 'test-session-id',
    path: '/tmp/test-session',
    prdPath: '/tmp/test-session/prd.md',
    prdHash: 'abc123def456',
    createdAt: Date.now(),
    ...overrides,
  };
}

function createMockBacklog(overrides?: Partial<Backlog>): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test description',
        milestones: [],
      },
    ],
    ...overrides,
  };
}
```

### 2. Generic Test Helpers

```typescript
/**
 * Generic helper to create test data with type inference
 */
function createTestData<T>(
  factory: (overrides?: Partial<T>) => T,
  overrides?: Partial<T>
): T {
  return factory(overrides);
}

// Usage with type inference
const session = createTestData(createMockSession, {
  id: 'custom-id',
});
```

### 3. Type-Safe Assertion Extensions

```typescript
import { expect } from 'vitest';

// Extend Vitest's expect with custom type-safe matchers
interface CustomMatchers<R = unknown> {
  toBeValidSession(): R;
  toHaveTask(taskId: string): R;
}

declare module 'vitest' {
  interface Assertion extends CustomMatchers {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toBeValidSession(received: unknown) {
    const pass = typeof received === 'object' && received !== null &&
      'id' in received && 'path' in received;

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid session`
        : `Expected ${received} to be a valid session`,
    };
  },
});
```

### 4. Enum and Union Type Testing

```typescript
import type { Status } from '@/core/models';

function testAllStatuses(
  testFn: (status: Status) => void | Promise<void>
) {
  const statuses: Status[] = ['Planned', 'InProgress', 'Complete', 'Blocked'];

  return Promise.all(
    statuses.map(status => testFn(status))
  );
}

describe('Status handling', () => {
  it('should handle all status types', async () => {
    await testAllStatuses(async (status) => {
      const result = processStatus(status);
      expect(result).toBeDefined();
    });
  });
});
```

---

## Session Management Testing Patterns

### 1. Session Lifecycle Testing

```typescript
describe('Session Lifecycle Management', () => {
  let tempDir: string;
  let sessionManager: SessionManager;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'session-test-'));
    sessionManager = new SessionManager(join(tempDir, 'plan'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create session with proper structure', async () => {
    const session = await sessionManager.createSession(prdPath);

    // Verify session object
    expect(session).toBeDefined();
    expect(session.id).toMatch(/^\d+_[a-f0-9]{12}$/);
    expect(session.path).toContain(tempDir);

    // Verify directory structure
    expect(existsSync(join(session.path, 'architecture'))).toBe(true);
    expect(existsSync(join(session.path, 'prps'))).toBe(true);
    expect(existsSync(join(session.path, 'artifacts'))).toBe(true);

    // Verify PRD snapshot
    expect(existsSync(join(session.path, 'prd_snapshot.md'))).toBe(true);
  });

  it('should load existing session', async () => {
    const created = await sessionManager.createSession(prdPath);
    const loaded = await sessionManager.loadSession(created.id);

    expect(loaded.id).toBe(created.id);
    expect(loaded.prdHash).toBe(created.prdHash);
  });

  it('should delete session and cleanup files', async () => {
    const session = await sessionManager.createSession(prdPath);
    await sessionManager.deleteSession(session.id);

    expect(existsSync(session.path)).toBe(false);
  });
});
```

### 2. Session State Transition Testing

```typescript
describe('Session State Transitions', () => {
  it('should track state changes correctly', async () => {
    const session = await sessionManager.createSession(prdPath);

    // Initial state
    expect(session.status).toBe('Planned');

    // State transition
    await sessionManager.updateSessionStatus(session.id, 'InProgress');
    const updated = await sessionManager.loadSession(session.id);

    expect(updated.status).toBe('InProgress');
    expect(updated.updatedAt).toBeGreaterThan(session.updatedAt);
  });

  it('should prevent invalid state transitions', async () => {
    const session = await sessionManager.createSession(prdPath);

    await expect(
      sessionManager.updateSessionStatus(session.id, 'Complete')
    ).rejects.toThrow('Cannot transition from Planned to Complete');
  });
});
```

### 3. Session Hash Validation Testing

```typescript
describe('Session PRD Hash Validation', () => {
  it('should generate consistent hash for same PRD', async () => {
    const session1 = await sessionManager.createSession(prdPath);
    const session2 = await sessionManager.createSession(prdPath);

    expect(session1.prdHash).toBe(session2.prdHash);
  });

  it('should generate different hash for different PRD', async () => {
    const session1 = await sessionManager.createSession(prdPath);

    // Modify PRD
    writeFileSync(prdPath, '# Modified PRD\n\nDifferent content');

    const session2 = await sessionManager.createSession(prdPath);

    expect(session1.prdHash).not.toBe(session2.prdHash);
  });

  it('should use exactly 12 characters of SHA-256 hash', async () => {
    const session = await sessionManager.createSession(prdPath);

    expect(session.prdHash).toHaveLength(12);
    expect(session.prdHash).toMatch(/^[a-f0-9]{12}$/);
  });
});
```

### 4. Session Concurrency Testing

```typescript
describe('Session Concurrency', () => {
  it('should handle concurrent session creation', async () => {
    const sessions = await Promise.all([
      sessionManager.createSession(prdPath),
      sessionManager.createSession(prdPath),
      sessionManager.createSession(prdPath),
    ]);

    // Verify unique session IDs
    const ids = new Set(sessions.map(s => s.id));
    expect(ids.size).toBe(3);

    // Verify sequential numbering
    const sequenceNumbers = sessions.map(s =>
      parseInt(s.id.split('_')[0], 10)
    ).sort((a, b) => a - b);

    expect(sequenceNumbers).toEqual([1, 2, 3]);
  });

  it('should handle concurrent session updates', async () => {
    const session = await sessionManager.createSession(prdPath);

    await Promise.all([
      sessionManager.updateSessionStatus(session.id, 'InProgress'),
      sessionManager.addArtifact(session.id, 'artifact1'),
      sessionManager.addArtifact(session.id, 'artifact2'),
    ]);

    const updated = await sessionManager.loadSession(session.id);
    expect(updated.status).toBe('InProgress');
    expect(updated.artifacts).toHaveLength(2);
  });
});
```

---

## State System Testing Patterns

### 1. State Initialization Testing

```typescript
describe('State System Initialization', () => {
  it('should initialize with default state', () => {
    const stateManager = new StateManager();

    expect(stateManager.getState()).toEqual({
      sessions: [],
      activeSession: null,
      lastActivity: null,
      version: 1,
    });
  });

  it('should initialize from persisted state', async () => {
    const persistedState = {
      sessions: [mockSession],
      activeSession: 'session-1',
      lastActivity: Date.now(),
      version: 1,
    };

    writeFileSync(statePath, JSON.stringify(persistedState));

    const stateManager = new StateManager(statePath);
    expect(stateManager.getState()).toEqual(persistedState);
  });
});
```

### 2. State Mutation Testing

```typescript
describe('State Mutations', () => {
  it('should update state immutably', () => {
    const stateManager = new StateManager();
    const originalState = stateManager.getState();

    stateManager.addSession(mockSession);
    const newState = stateManager.getState();

    // Verify state changed
    expect(newState.sessions).toHaveLength(1);

    // Verify original state unchanged
    expect(originalState.sessions).toHaveLength(0);

    // Verify immutability
    expect(originalState).not.toBe(newState);
  });

  it('should track state version', () => {
    const stateManager = new StateManager();

    expect(stateManager.getVersion()).toBe(1);

    stateManager.addSession(mockSession);
    expect(stateManager.getVersion()).toBe(2);

    stateManager.addSession(mockSession2);
    expect(stateManager.getVersion()).toBe(3);
  });
});
```

### 3. State Rollback Testing

```typescript
describe('State Rollback', () => {
  it('should rollback to previous version', () => {
    const stateManager = new StateManager();

    stateManager.addSession(mockSession);
    stateManager.addSession(mockSession2);

    expect(stateManager.getState().sessions).toHaveLength(2);

    stateManager.rollback(1);

    expect(stateManager.getState().sessions).toHaveLength(1);
    expect(stateManager.getVersion()).toBe(1);
  });

  it('should prevent invalid rollback', () => {
    const stateManager = new StateManager();

    expect(() => {
      stateManager.rollback(999);
    }).toThrow('Cannot rollback to version 999: current version is 1');
  });
});
```

### 4. State Persistence Testing

```typescript
describe('State Persistence', () => {
  it('should persist state to disk', async () => {
    const stateManager = new StateManager(statePath);
    stateManager.addSession(mockSession);

    const stateManager2 = new StateManager(statePath);
    expect(stateManager2.getState().sessions).toHaveLength(1);
  });

  it('should use atomic write pattern', async () => {
    const stateManager = new StateManager(statePath);

    // Spy on file operations
    const writeSpy = vi.spyOn(fs, 'writeFileSync');
    const renameSpy = vi.spyOn(fs, 'renameSync');

    stateManager.addSession(mockSession);

    // Verify temp file was used
    expect(writeSpy).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.any(String),
      expect.any(Object)
    );

    // Verify rename was called (atomic operation)
    expect(renameSpy).toHaveBeenCalled();
  });
});
```

---

## Mock Object Creation Patterns

### 1. Simple Function Mocks

```typescript
// Mock a simple function
const mockFunction = vi.fn();

// Set return value
mockFunction.mockReturnValue('result');

// Set return value based on arguments
mockFunction.mockImplementation((arg: string) => `Hello ${arg}`);

// Set async return value
mockFunction.mockResolvedValue({ data: 'result' });

// Set sequential return values
mockFunction
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

// Verify calls
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledTimes(3);
expect(mockFunction).toHaveBeenCalledWith('arg1');
```

### 2. Complex Object Mocks

```typescript
// Mock complex object with methods
const mockSessionManager = {
  createSession: vi.fn(),
  loadSession: vi.fn(),
  deleteSession: vi.fn(),
  listSessions: vi.fn(),

  // Add mock implementations
  createSession: vi.fn().mockResolvedValue({
    id: 'session-1',
    path: '/tmp/session-1',
    prdHash: 'abc123',
  }),
};

// Usage in tests
const session = await mockSessionManager.createSession('/path/to/prd.md');
expect(mockSessionManager.createSession).toHaveBeenCalledWith('/path/to/prd.md');
```

### 3. Module Mocking

```typescript
// Mock entire module
vi.mock('@/src/agents/agent-factory', () => ({
  createArchitectAgent: vi.fn().mockReturnValue({
    prompt: vi.fn().mockResolvedValue({
      backlog: { backlog: [] },
    }),
  }),
  createQAAgent: vi.fn().mockReturnValue({
    prompt: vi.fn().mockResolvedValue({
      answer: 'test answer',
    }),
  }),
}));

// Mock with partial implementation
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn((path: string) => {
      if (path.includes('special-file')) {
        return Promise.resolve('special content');
      }
      return actual.readFile(path, 'utf-8');
    }),
  };
});
```

### 4. Class Mocking

```typescript
// Mock class constructor
vi.mock('@/src/core/session-manager', () => ({
  SessionManager: vi.fn().mockImplementation(() => ({
    createSession: vi.fn().mockResolvedValue(mockSession),
    loadSession: vi.fn().mockResolvedValue(mockSession),
    deleteSession: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock with instance methods
const mockInstance = {
  createSession: vi.fn(),
  loadSession: vi.fn(),
};

vi.mock('@/src/core/session-manager', () => ({
  SessionManager: vi.fn().mockImplementation(() => mockInstance),
}));
```

### 5. Type-Safe Mock Factories

```typescript
import type { Session, Backlog } from '@/core/models';

// Type-safe mock factory
function createMockSessionManager() {
  const sessions = new Map<string, Session>();

  return {
    createSession: vi.fn((prdPath: string) => {
      const session: Session = {
        id: `session-${sessions.size + 1}`,
        path: `/tmp/session-${sessions.size + 1}`,
        prdPath,
        prdHash: 'mock-hash',
        createdAt: Date.now(),
      };
      sessions.set(session.id, session);
      return Promise.resolve(session);
    }),

    loadSession: vi.fn((id: string) => {
      return Promise.resolve(sessions.get(id));
    }),

    deleteSession: vi.fn((id: string) => {
      sessions.delete(id);
      return Promise.resolve(undefined);
    }),

    listSessions: vi.fn(() => {
      return Promise.resolve(Array.from(sessions.values()));
    }),
  };
}
```

### 6. Spy Mocks

```typescript
// Spy on real object methods
const sessionManager = new SessionManager(tempDir);
const createSpy = vi.spyOn(sessionManager, 'createSession');

// Call real method
await sessionManager.createSession(prdPath);

// Verify spy
expect(createSpy).toHaveBeenCalledWith(prdPath);
expect(createSpy).toHaveReturnedWith(expect.objectContaining({
  id: expect.any(String),
}));

// Restore original
createSpy.mockRestore();
```

---

## File System Testing Patterns

### 1. Temp Directory Pattern

```typescript
describe('File System Operations', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create unique temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create files in temp directory', () => {
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'content');

    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, 'utf-8')).toBe('content');
  });
});
```

### 2. In-Memory File System Pattern

```typescript
import { vol } from 'memfs';
import fs from 'fs';

vi.mock('fs');

describe('In-Memory File System Tests', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      '/test/prd.md': '# Test PRD',
      '/test/plan/tasks.json': JSON.stringify({ backlog: [] }),
    });
  });

  afterEach(() => {
    vol.reset();
  });

  it('should read from memory file system', () => {
    const content = fs.readFileSync('/test/prd.md', 'utf-8');
    expect(content).toBe('# Test PRD');
  });

  it('should verify file structure in memory', () => {
    expect(fs.existsSync('/test/prd.md')).toBe(true);
    expect(fs.existsSync('/test/plan/tasks.json')).toBe(true);

    const files = fs.readdirSync('/test/plan');
    expect(files).toContain('tasks.json');
  });
});
```

### 3. Atomic Write Pattern Testing

```typescript
describe('Atomic Write Operations', () => {
  it('should use temp file for atomic writes', async () => {
    const filePath = join(tempDir, 'data.json');
    const tempPath = `${filePath}.tmp`;

    const writeSpy = vi.spyOn(fs, 'writeFileSync');
    const renameSpy = vi.spyOn(fs, 'renameSync');

    await atomicWrite(filePath, { data: 'test' });

    // Verify temp file was used
    expect(writeSpy).toHaveBeenCalledWith(
      tempPath,
      expect.any(String),
      expect.any(Object)
    );

    // Verify atomic rename
    expect(renameSpy).toHaveBeenCalledWith(tempPath, filePath);

    // Verify final file exists
    expect(existsSync(filePath)).toBe(true);
    expect(existsSync(tempPath)).toBe(false); // Temp file cleaned up
  });
});
```

### 4. File Watcher Testing

```typescript
describe('File Watching', () => {
  it('should detect file changes', async () => {
    const filePath = join(tempDir, 'watched.txt');
    writeFileSync(filePath, 'initial');

    const onChange = vi.fn();
    const watcher = watchFile(filePath, onChange);

    // Trigger change
    writeFileSync(filePath, 'updated');

    // Wait for event
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(onChange).toHaveBeenCalled();

    // Cleanup
    watcher.close();
  });
});
```

### 5. Directory Structure Validation

```typescript
describe('Directory Structure Validation', () => {
  it('should validate session directory structure', async () => {
    const session = await sessionManager.createSession(prdPath);

    // Check required directories exist
    const requiredDirs = [
      'architecture',
      'prps',
      'artifacts',
    ];

    for (const dir of requiredDirs) {
      const dirPath = join(session.path, dir);
      expect(existsSync(dirPath)).toBe(true);

      // Verify directory permissions
      const stats = statSync(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    // Check required files exist
    expect(existsSync(join(session.path, 'prd_snapshot.md'))).toBe(true);
  });

  it('should validate file permissions', async () => {
    const session = await sessionManager.createSession(prdPath);

    // Check directory permissions (0o755)
    const dirStats = statSync(session.path);
    expect(dirStats.mode & 0o777).toBe(0o755);

    // Check file permissions (0o644)
    const filePath = join(session.path, 'prd_snapshot.md');
    const fileStats = statSync(filePath);
    expect(fileStats.mode & 0o777).toBe(0o644);
  });
});
```

### 6. Large File Testing

```typescript
describe('Large File Operations', () => {
  it('should handle large files efficiently', async () => {
    // Create large file (10MB)
    const largeContent = 'x'.repeat(10 * 1024 * 1024);
    const filePath = join(tempDir, 'large.txt');
    writeFileSync(filePath, largeContent);

    // Test streaming read
    const stream = fs.createReadStream(filePath);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    const content = Buffer.concat(chunks).toString();
    expect(content.length).toBe(10 * 1024 * 1024);
  });
});
```

---

## Assertion & Verification Patterns

### 1. Object Shape Assertions

```typescript
describe('Object Shape Assertions', () => {
  it('should match object shape', () => {
    const session = createMockSession();

    // Full object match
    expect(session).toEqual({
      id: expect.any(String),
      path: expect.any(String),
      prdPath: expect.any(String),
      prdHash: expect.stringMatching(/^[a-f0-9]{12}$/),
      createdAt: expect.any(Number),
    });

    // Partial match
    expect(session).toMatchObject({
      id: expect.any(String),
      prdHash: expect.stringMatching(/^[a-f0-9]{12}$/),
    });
  });

  it('should assert object properties', () => {
    const session = createMockSession();

    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('path', expect.stringContaining('/tmp/'));
    expect(session).toHaveProperty('prdHash', expect.stringMatching(/^[a-f0-9]{12}$/));

    // Nested properties
    expect(session).toHaveProperty['metadata.createdAt'];
  });
});
```

### 2. Array Assertions

```typescript
describe('Array Assertions', () => {
  it('should verify array contents', () => {
    const sessions = [createMockSession(), createMockSession()];

    expect(sessions).toHaveLength(2);
    expect(sessions).toContainEqual(expect.objectContaining({
      id: expect.any(String),
    }));

    // Array item properties
    expect(sessions[0]).toHaveProperty('id');
    expect(sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String) }),
      ])
    );
  });

  it('should verify sorted arrays', () => {
    const sessions = [
      createMockSession({ id: 'session-3' }),
      createMockSession({ id: 'session-1' }),
      createMockSession({ id: 'session-2' }),
    ];

    const sorted = sessions.sort((a, b) => a.id.localeCompare(b.id));

    expect(sorted[0].id).toBe('session-1');
    expect(sorted[1].id).toBe('session-2');
    expect(sorted[2].id).toBe('session-3');
  });
});
```

### 3. Async Assertions

```typescript
describe('Async Assertions', () => {
  it('should resolve with expected value', async () => {
    await expect(
      sessionManager.createSession(prdPath)
    ).resolves.toEqual(
      expect.objectContaining({
        id: expect.any(String),
        path: expect.stringContaining('/tmp/'),
      })
    );
  });

  it('should reject with error', async () => {
    await expect(
      sessionManager.loadSession('non-existent')
    ).rejects.toThrow('Session not found');

    await expect(
      sessionManager.loadSession('non-existent')
    ).rejects.toThrowError(/Session not found/);

    await expect(
      sessionManager.loadSession('non-existent')
    ).rejects.toThrowError(Error);
  });

  it('should handle timeout', async () => {
    await expect(
      Promise.race([
        sessionManager.longOperation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 1000)
        ),
      ])
    ).resolves.toBeDefined();
  }, 2000);
});
```

### 4. Error Assertions

```typescript
describe('Error Assertions', () => {
  it('should throw specific error', () => {
    expect(() => {
      sessionManager.validateSession('');
    }).toThrow('Session ID cannot be empty');

    expect(() => {
      sessionManager.validateSession('');
    }).toThrow(Error);

    expect(() => {
      sessionManager.validateSession('');
    }).toThrowError(/Session ID cannot be empty/);
  });

  it('should include error details', () => {
    try {
      sessionManager.loadSession('invalid');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty('message', expect.stringContaining('Session'));
      expect(error).toHaveProperty('stack', expect.any(String));
    }
  });
});
```

### 5. Number and Range Assertions

```typescript
describe('Numeric Assertions', () => {
  it('should verify numeric values', () => {
    expect(session.createdAt).toBeGreaterThanOrEqual(Date.now() - 1000);
    expect(session.createdAt).toBeLessThanOrEqual(Date.now());

    expect(session.version).toBe(1);
    expect(session.version).toBeGreaterThan(0);
    expect(session.version).toBeLessThan(10);

    expect(session.progress).toBeCloseTo(0.5, 1);
  });
});
```

### 6. String Assertions

```typescript
describe('String Assertions', () => {
  it('should verify string patterns', () => {
    expect(session.id).toMatch(/^session-\d+$/);
    expect(session.prdHash).toMatch(/^[a-f0-9]{12}$/);
    expect(session.path).toContain('/tmp/');
    expect(session.path).toStartWith('/tmp/');
    expect(session.path).toEndWith('/session-1');
  });
});
```

---

## Multi-Step Verification Patterns

### 1. Sequential Operation Testing

```typescript
describe('Sequential Operations', () => {
  it('should complete multi-step workflow', async () => {
    // Step 1: Create session
    const session = await sessionManager.createSession(prdPath);
    expect(session.id).toBeDefined();

    // Step 2: Update session status
    await sessionManager.updateSessionStatus(session.id, 'InProgress');
    let updated = await sessionManager.loadSession(session.id);
    expect(updated.status).toBe('InProgress');

    // Step 3: Add artifacts
    await sessionManager.addArtifact(session.id, 'artifact1');
    await sessionManager.addArtifact(session.id, 'artifact2');
    updated = await sessionManager.loadSession(session.id);
    expect(updated.artifacts).toHaveLength(2);

    // Step 4: Complete session
    await sessionManager.updateSessionStatus(session.id, 'Complete');
    updated = await sessionManager.loadSession(session.id);
    expect(updated.status).toBe('Complete');
  });
});
```

### 2. State Transition Verification

```typescript
describe('State Transitions', () => {
  it('should verify each state transition', async () => {
    const session = await sessionManager.createSession(prdPath);

    // Track state history
    const states: string[] = [];

    // Transition 1: Planned -> InProgress
    await sessionManager.updateSessionStatus(session.id, 'InProgress');
    states.push((await sessionManager.loadSession(session.id)).status);

    // Transition 2: InProgress -> Review
    await sessionManager.updateSessionStatus(session.id, 'Review');
    states.push((await sessionManager.loadSession(session.id)).status);

    // Transition 3: Review -> Complete
    await sessionManager.updateSessionStatus(session.id, 'Complete');
    states.push((await sessionManager.loadSession(session.id)).status);

    // Verify transitions
    expect(states).toEqual(['InProgress', 'Review', 'Complete']);
  });
});
```

### 3. Callback Verification

```typescript
describe('Callback Verification', () => {
  it('should call callbacks in correct order', async () => {
    const calls: string[] = [];

    const callback1 = vi.fn(() => calls.push('callback1'));
    const callback2 = vi.fn(() => calls.push('callback2'));
    const callback3 = vi.fn(() => calls.push('callback3'));

    await sessionManager.executeWithCallbacks([
      callback1,
      callback2,
      callback3,
    ]);

    expect(calls).toEqual(['callback1', 'callback2', 'callback3']);
    expect(callback1).toHaveBeenCalledBefore(callback2);
    expect(callback2).toHaveBeenCalledBefore(callback3);
  });
});
```

### 4. Event Emission Verification

```typescript
describe('Event Emission', () => {
  it('should emit events in sequence', async () => {
    const events: string[] = [];

    sessionManager.on('created', (session) => {
      events.push(`created:${session.id}`);
    });

    sessionManager.on('updated', (session) => {
      events.push(`updated:${session.id}`);
    });

    sessionManager.on('completed', (session) => {
      events.push(`completed:${session.id}`);
    });

    // Trigger events
    const session = await sessionManager.createSession(prdPath);
    await sessionManager.updateSessionStatus(session.id, 'Complete');

    // Verify event sequence
    expect(events).toEqual([
      `created:${session.id}`,
      `updated:${session.id}`,
    ]);
  });
});
```

### 5. Multi-Assertion Tests with describe.each

```typescript
describe.each([
  { status: 'Planned', nextStatus: 'InProgress' },
  { status: 'InProgress', nextStatus: 'Review' },
  { status: 'Review', nextStatus: 'Complete' },
])('Status transition from $status to $nextStatus', ({ status, nextStatus }) => {
  it('should allow valid transition', async () => {
    const session = await sessionManager.createSession(prdPath);
    await sessionManager.updateSessionStatus(session.id, status);

    await expect(
      sessionManager.updateSessionStatus(session.id, nextStatus)
    ).resolves.not.toThrow();
  });
});
```

---

## Common Gotchas & Solutions

### 1. Mock Call Bleed Between Tests

**Problem:** Mock calls from one test affect another test.

**Solution:**
```typescript
beforeEach(() => {
  vi.clearAllMocks();  // Clear call history
});

afterEach(() => {
  vi.restoreAllMocks();  // Restore original implementations
});
```

### 2. Async Test Timeouts

**Problem:** Tests timeout due to unresolved promises.

**Solution:**
```typescript
it('should handle async operations', async () => {
  // Always use async/await
  const result = await asyncOperation();
  expect(result).toBeDefined();

  // Set appropriate timeout
}, 10000);  // 10 second timeout
```

### 3. Temp Directory Cleanup

**Problem:** Temp directories not cleaned up on test failure.

**Solution:**
```typescript
let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'test-'));
});

afterEach(() => {
  // Always cleanup, even if test fails
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
```

### 4. Module Mocking Scope Issues

**Problem:** Module mocks not applied correctly.

**Solution:**
```typescript
// Mock at top level, before imports
vi.mock('@/src/module', () => ({
  function: vi.fn(),
}));

// Import after mock
import { function } from '@/src/module';

// Clear mock between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 5. Timer-Related Tests

**Problem:** Tests using setTimeout/setInterval are slow or flaky.

**Solution:**
```typescript
describe('Timer-based operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle timeout', () => {
    const callback = vi.fn();
    setTimeout(callback, 1000);

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalled();
  });
});
```

### 6. Promise Rejection Handling

**Problem:** Unhandled promise rejections cause test failures.

**Solution:**
```typescript
let unhandledRejections: unknown[] = [];

beforeEach(() => {
  unhandledRejections = [];

  const handler = (reason: unknown) => {
    unhandledRejections.push(reason);
  };

  process.on('unhandledRejection', handler);
});

afterEach(() => {
  if (unhandledRejections.length > 0) {
    throw new Error(
      `${unhandledRejections.length} unhandled rejections`
    );
  }
});
```

### 7. Environment Variable Leaks

**Problem:** Environment variables set in one test affect others.

**Solution:**
```typescript
afterEach(() => {
  vi.unstubAllEnvs();  // Restore all environment variables
});

it('should use test environment', () => {
  vi.stubEnv('API_KEY', 'test-key');

  expect(process.env.API_KEY).toBe('test-key');
});
```

### 8. Date/Time Dependencies

**Problem:** Tests fail due to time-dependent code.

**Solution:**
```typescript
describe('Time-dependent operations', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-01-17'));
  });

  afterEach(() => {
  vi.useRealSystemTime();
  });

  it('should use fixed time', () => {
    expect(Date.now()).toBe(new Date('2026-01-17').getTime());
  });
});
```

---

## Testing Anti-Patterns to Avoid

### 1. Testing Implementation Details

**❌ Bad:**
```typescript
it('should set internal property', () => {
  session['internalProperty'] = 'value';
  expect(session['internalProperty']).toBe('value');
});
```

**✅ Good:**
```typescript
it('should expose computed value', () => {
  const result = session.getComputedValue();
  expect(result).toBe('expected');
});
```

### 2. Over-Mocking

**❌ Bad:**
```typescript
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  // ... 20 more mocks
}));
```

**✅ Good:**
```typescript
// Only mock what you need to control
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

// Use real file system for the rest
```

### 3. Brittle Tests

**❌ Bad:**
```typescript
it('should have exactly 5 sessions', () => {
  expect(sessions.length).toBe(5);  // Will break when adding tests
});
```

**✅ Good:**
```typescript
it('should have at least one session', () => {
  expect(sessions.length).toBeGreaterThanOrEqual(1);
});
```

### 4. Testing Multiple Things

**❌ Bad:**
```typescript
it('should create session, update status, and add artifacts', async () => {
  const session = await createSession();
  await updateStatus(session.id);
  await addArtifact(session.id);
  // What are we actually testing?
});
```

**✅ Good:**
```typescript
it('should create session with valid structure', async () => {
  const session = await createSession();
  expect(session).toHaveProperty('id');
});

it('should update session status', async () => {
  const session = await createSession();
  await updateStatus(session.id);
  const updated = await loadSession(session.id);
  expect(updated.status).toBe('Updated');
});
```

### 5. Ignoring Async Errors

**❌ Bad:**
```typescript
it('should handle error', async () => {
  await sessionManager.loadSession('invalid');
  // Missing await/expect for error
});
```

**✅ Good:**
```typescript
it('should handle error', async () => {
  await expect(
    sessionManager.loadSession('invalid')
  ).rejects.toThrow('Session not found');
});
```

---

## Performance Optimization Patterns

### 1. Shared Test Fixtures

```typescript
// tests/fixtures/session-fixture.ts
export class SessionFixture {
  private static instances: Map<string, Session> = new Map();

  static create(id: string): Session {
    if (!this.instances.has(id)) {
      this.instances.set(id, createMockSession({ id }));
    }
    return this.instances.get(id)!;
  }

  static reset() {
    this.instances.clear();
  }
}

// In tests
afterEach(() => {
  SessionFixture.reset();
});
```

### 2. Parallel Test Execution

```typescript
describe('Parallel operations', () => {
  it('should handle concurrent requests', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      sessionManager.createSession(`prd-${i}`)
    );

    const results = await Promise.all(operations);

    expect(results).toHaveLength(10);
    expect(new Set(results.map(r => r.id)).size).toBe(10);
  });
});
```

### 3. Lazy Test Data Initialization

```typescript
// Use lazy initialization for expensive fixtures
let expensiveFixture: ExpensiveType;

beforeEach(() => {
  if (!expensiveFixture) {
    expensiveFixture = createExpensiveFixture();
  }
});
```

### 4. Selective Test Running

```typescript
// Skip slow tests in CI
describe.skipIf(process.env.CI === 'true')('Slow integration tests', () => {
  it('should run long operation', async () => {
    // Slow test only runs locally
  }, 30000);
});

// Only run specific test
it.only('should run this test exclusively', () => {
  // Only this test will run
});
```

### 5. Test Suite Organization

```typescript
// Separate unit and integration tests
// tests/unit/session-manager.test.ts
describe('SessionManager Unit Tests', () => {
  // Fast tests with mocks
});

// tests/integration/session-manager.test.ts
describe('SessionManager Integration Tests', () => {
  // Slower tests with real dependencies
});
```

---

## Summary Checklist

### Test Configuration
- [ ] Configure Vitest with TypeScript support
- [ ] Set up proper test environment (node/jsdom)
- [ ] Configure coverage thresholds
- [ ] Set up global test setup/teardown

### Test Structure
- [ ] Use describe/test blocks for organization
- [ ] Follow Arrange-Act-Assert pattern
- [ ] Keep tests focused and independent
- [ ] Use descriptive test names

### Mocking & Fixtures
- [ ] Use factories for test data
- [ ] Mock only what's necessary
- [ ] Clear mocks between tests
- [ ] Use type-safe mocks

### Assertions
- [ ] Use specific matchers
- [ ] Test behavior, not implementation
- [ ] Handle async operations properly
- [ ] Verify error conditions

### File System Tests
- [ ] Use temp directories
- [ ] Clean up after tests
- [ ] Test atomic operations
- [ ] Verify file permissions

### Best Practices
- [ ] Avoid test interdependence
- [ ] Don't ignore promises
- [ ] Test edge cases
- [ ] Keep tests maintainable

---

## Additional Resources

### Books
- "Test-Driven Development with TypeScript" by James Hickey
- "Testing JavaScript Applications" by Davis W. Frank

### Courses
- TestingJavaScript.com (Kent C. Dodds)
- Frontend Masters: Testing Practices

### Tools
- Vitest: https://vitest.dev/
- TypeScript: https://www.typescriptlang.org/
- memfs: https://github.com/streamich/memfs

### Blog Posts
- "Vitest vs Jest: A Comprehensive Comparison" (2025)
- "Advanced Testing Patterns for TypeScript" (2026)
- "Integration Testing Best Practices" (2026)

---

**Document Status:** Complete
**Next Review:** 2026-02-01
**Maintained By:** P1.M1.T1.S3 Research Team
