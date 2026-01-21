# CLI Subcommand Testing Patterns Research

## Summary

Comprehensive research on CLI subcommand testing patterns for implementing `prd task` command integration tests. This research covers Vitest patterns for testing Commander.js commands with subcommands, file discovery logic, and task priority handling.

## Table of Contents

1. [Testing Framework](#testing-framework)
2. [Commander.js Subcommand Testing](#commanderjs-subcommand-testing)
3. [File Discovery and Priority Testing](#file-discovery-and-priority-testing)
4. [Mocking Patterns](#mocking-patterns)
5. [Status Display and Next Task Logic](#status-display-and-next-task-logic)
6. [Codebase References](#codebase-references)

---

## Testing Framework

### Vitest Configuration

The project uses **Vitest** as the primary testing framework:

```typescript
// vitest.config.ts
{
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.ts}'],
    coverage: {
      provider: 'v8',
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100
    }
  }
}
```

### Key Testing Utilities

- `describe`, `it`, `expect` - Core test functions
- `beforeEach`, `afterEach` - Setup/teardown hooks
- `vi.mock()` - Module mocking
- `vi.hoisted()` - Creating mock objects before imports
- `vi.fn()` - Creating mock functions
- `vi.clearAllMocks()` - Clearing mock state

---

## Commander.js Subcommand Testing

### Basic CLI Argument Parsing Test Pattern

```typescript
// From: tests/unit/cli/index.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCLIArgs } from '../../../src/cli/index.js';

// Mock process.argv
const originalArgv = process.argv;
const originalExit = process.exit;

// Mock the node:fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// Mock the logger with hoisted variables (Vitest pattern)
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

import { existsSync } from 'node:fs';
const mockExistsSync = existsSync as any;

describe('cli/index', () => {
  let mockExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockExistsSync.mockReturnValue(true);
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();

    // Mock process.exit to capture exit calls
    mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    vi.clearAllMocks();
  });

  // Helper to set process.argv for testing
  const setArgv = (args: string[] = []) => {
    process.argv = ['node', '/path/to/script.js', ...args];
  };

  describe('parseCLIArgs', () => {
    it('should parse custom PRD path', () => {
      setArgv(['--prd', './custom/PRD.md']);
      const args = parseCLIArgs();
      expect(args.prd).toBe('./custom/PRD.md');
    });
  });
});
```

### Testing Subcommands Pattern

```typescript
// For testing 'prd task' subcommands
describe('prd task subcommand', () => {
  it('should show tasks for current session', () => {
    setArgv(['task']);
    const result = executeTaskCommand();
    expect(result).toContain('Current session tasks:');
  });

  it('should get next executable task', () => {
    setArgv(['task', 'next']);
    const result = executeTaskCommand();
    expect(result).toMatch(/P\d+M\d+T\d+S\d+/);
  });

  it('should show task counts by status', () => {
    setArgv(['task', 'status']);
    const result = executeTaskCommand();
    expect(result).toContain('Planned: X');
    expect(result).toContain('Complete: Y');
  });
});
```

---

## File Discovery and Priority Testing

### File Priority Testing Pattern

```typescript
// From: tests/unit/protected-files.test.ts

import { basename } from 'node:path';

// Test file discovery and priority with patterns
describe('file discovery and priority logic', () => {
  /**
   * Checks if a file matches the wildcard pattern *tasks*.json
   */
  function isProtectedByWildcard(filePath: string): boolean {
    const fileName = basename(filePath);
    return /\btasks.*\.json$/.test(fileName);
  }

  describe('wildcard pattern matching', () => {
    it('should match tasks.json', () => {
      expect(isProtectedByWildcard('tasks.json')).toBe(true);
    });

    it('should match backup-tasks.json', () => {
      expect(isProtectedByWildcard('backup-tasks.json')).toBe(true);
    });
  });

  describe('priority order tests', () => {
    it('should use basename for path comparison', () => {
      expect(isProtectedFile('path/to/tasks.json')).toBe(true);
      expect(isProtectedFile('./PRD.md')).toBe(true);
    });
  });
});
```

### Session Directory Discovery Testing

```typescript
// Testing session discovery patterns
describe('session directory discovery', () => {
  const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

  it('should identify bugfix session directories', () => {
    const sessionDir = '001_14b9dc2a33c7';
    expect(sessionDir).toMatch(SESSION_DIR_PATTERN);
  });

  it('should prioritize bugfix sessions over main sessions', () => {
    const sessions = [
      '001_14b9dc2a33c7', // Main session
      '001_8d809cc989b9', // Bugfix session (same sequence)
    ];

    // Bugfix sessions should be discovered first
    const bugfixSessions = sessions.filter(s => s.includes('8d809cc'));
    expect(bugfixSessions.length).toBeGreaterThan(0);
  });
});
```

---

## Mocking Patterns

### Logger Mocking Pattern

```typescript
// Mock logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// In tests:
it('should display error message when PRD file not found', () => {
  mockExistsSync.mockReturnValue(false);
  setArgv(['--prd', './missing.md']);

  expect(() => parseCLIArgs()).toThrow('process.exit(1)');

  // VERIFY: Error message was logged
  expect(mockLogger.error).toHaveBeenCalledWith(
    expect.stringContaining('PRD file not found')
  );
});
```

### Process Exit Mocking Pattern

```typescript
describe('process.exit mocking', () => {
  let mockExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;
  });

  it('should exit with code 1 when PRD file does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    setArgv(['--prd', './nonexistent.md']);

    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
```

### File System Mocking Pattern

```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

import { writeFile, rename, unlink, readdir } from 'node:fs/promises';

const mockWriteFile = vi.mocked(writeFile);
const mockReaddir = vi.mocked(readdir);

describe('file system operations', () => {
  it('should read session directories', async () => {
    mockReaddir.mockResolvedValue([
      '001_14b9dc2a33c7',
      '002_1e734971e481',
    ] as any);

    const sessions = await discoverSessions('plan/');
    expect(sessions).toHaveLength(2);
    expect(mockReaddir).toHaveBeenCalledWith('plan/');
  });
});
```

---

## Status Display and Next Task Logic

### Task Traversal Testing Pattern

```typescript
// From: tests/unit/core/task-traversal.test.ts

import { TaskOrchestrator } from '../../../src/core/task-orchestrator.js';

describe('TaskOrchestrator - Next Task Logic', () => {
  describe('CONTRACT a: DFS pre-order traversal', () => {
    it('should traverse items in DFS pre-order: parent before children', async () => {
      const mockManager = createMockSessionManager(backlog);

      const orchestrator = new TaskOrchestrator(mockManager);
      const processedIds: string[] = [];

      let hasMore = true;
      while (hasMore) {
        hasMore = await orchestrator.processNextItem();
        if (orchestrator.currentItemId) {
          processedIds.push(orchestrator.currentItemId);
        }
      }

      // VERIFY: Parent indices are less than child indices
      const p1Index = processedIds.indexOf('P1');
      const m1Index = processedIds.indexOf('P1.M1');
      const t1Index = processedIds.indexOf('P1.M1.T1');

      expect(p1Index).toBeLessThan(m1Index);
      expect(m1Index).toBeLessThan(t1Index);
    });
  });

  describe('processNextItem return values', () => {
    it('should return true when items remain in queue', async () => {
      const orchestrator = new TaskOrchestrator(mockManager);
      const result = await orchestrator.processNextItem();
      expect(result).toBe(true);
    });

    it('should return false when queue is empty', async () => {
      const orchestrator = new TaskOrchestrator(mockManager);
      // Process all items
      while (await orchestrator.processNextItem()) {}
      const result = await orchestrator.processNextItem();
      expect(result).toBe(false);
    });
  });
});
```

### Status Counting Testing Pattern

```typescript
describe('task status counting', () => {
  it('should count tasks by status', () => {
    const backlog = createTestBacklog();

    const counts = countTasksByStatus(backlog);
    expect(counts.Planned).toBe(5);
    expect(counts.Researching).toBe(2);
    expect(counts.Implementing).toBe(1);
    expect(counts.Complete).toBe(10);
  });

  it('should handle empty backlog', () => {
    const counts = countTasksByStatus({ backlog: [] });
    expect(Object.values(counts).every(v => v === 0)).toBe(true);
  });
});
```

---

## Codebase References

### Key Test Files to Reference

| File | Purpose |
|------|---------|
| `tests/unit/cli/index.test.ts` | CLI argument parsing tests |
| `tests/integration/session-structure.test.ts` | Session structure tests |
| `tests/unit/core/task-traversal.test.ts` | Task traversal logic |
| `tests/integration/core/task-orchestrator-e2e.test.ts` | Task orchestrator tests |
| `tests/unit/protected-files.test.ts` | File discovery patterns |

### Key Implementation Files

| File | Purpose |
|------|---------|
| `src/cli/index.ts` | CLI entry point with Commander.js |
| `src/core/task-orchestrator.ts` | Task traversal and execution |
| `src/core/session-manager.ts` | Session discovery and loading |
| `src/utils/task-utils.ts` | Task utility functions |

---

## External Documentation

- **Vitest Documentation**: https://vitest.dev/guide/
- **Commander.js**: https://www.npmjs.com/package/commander
- **Commander.js GitHub**: https://github.com/tj/commander.js
