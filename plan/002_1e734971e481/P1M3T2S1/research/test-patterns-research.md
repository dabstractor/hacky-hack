# Test Patterns Research for Serialization Tests

## Test Framework: Vitest

**Configuration:** `/home/dustin/projects/hacky-hack/vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true, // Use global describe/it/expect
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          statements: 100, // 100% coverage required!
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
```

## Testing Methodology: SETUP/EXECUTE/VERIFY

Consistent pattern used throughout the codebase:

```typescript
describe('Feature being tested', () => {
  it('should do something specific', async () => {
    // SETUP: Prepare test data and mocks
    const backlog = createTestBacklog([
      /* ... */
    ]);
    mockWriteFile.mockResolvedValue(undefined);

    // EXECUTE: Call the function under test
    await writeTasksJSON('/test/session', backlog);

    // VERIFY: Assert expected behavior
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.any(String),
      { mode: 0o644 }
    );
  });
});
```

## Mocking Strategy

All file system operations are mocked using Vitest:

```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

import { readFile, writeFile, rename, unlink } from 'node:fs/promises';

const mockWriteFile = writeFile as any;
const mockRename = rename as any;
```

## Atomic Write Test Pattern

**From:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`

```typescript
describe('writeTasksJSON', () => {
  it('should write tasks.json with atomic write pattern', async () => {
    // SETUP: Create test backlog
    const backlog = createTestBacklog([
      createTestPhase('P1', 'Phase 1', 'Planned'),
    ]);

    // EXECUTE
    await writeTasksJSON('/test/session', backlog);

    // VERIFY: Atomic write pattern - write then rename
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockRename).toHaveBeenCalled();

    // Verify temp file was used
    const writeFileCall = mockWriteFile.mock.calls[0];
    const tempPath = writeFileCall[0];
    expect(tempPath).toContain('.tmp');

    // Verify rename from temp to target
    const renameCall = mockRename.mock.calls[0];
    expect(renameCall[0]).toBe(tempPath);
    expect(renameCall[1]).toContain('tasks.json');
  });

  it('should clean up temp file on write failure', async () => {
    // SETUP: Mock write failure
    const writeError = new Error('ENOSPC: no space left');
    mockWriteFile.mockRejectedValue(writeError);

    // EXECUTE & VERIFY
    await expect(writeTasksJSON('/test/session', backlog)).rejects.toThrow(
      SessionFileError
    );

    // Temp file cleanup should be attempted
    expect(mockUnlink).toHaveBeenCalled();
  });
});
```

## Factory Functions for Test Data

```typescript
// Test fixtures - Factory pattern
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

const createTestTask = (
  id: string,
  title: string,
  status: Status,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task',
  title,
  status,
  description: 'Test task description',
  subtasks,
});

const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});
```

## Error Handling Test Patterns

```typescript
describe('Error handling', () => {
  it('should throw SessionFileError on ENOENT', async () => {
    const error = new Error('ENOENT: no such file');
    (error as NodeJS.ErrnoException).code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    await expect(readTasksJSON('/test/session')).rejects.toThrow(
      SessionFileError
    );
  });

  it('should handle EACCES permission errors', async () => {
    const error = new Error('EACCES: permission denied');
    (error as NodeJS.ErrnoException).code = 'EACCES';
    mockReadFile.mockRejectedValue(error);

    await expect(readTasksJSON('/test/session')).rejects.toThrow(
      SessionFileError
    );
  });
});
```

## Existing Test Files

1. **SessionManager Unit Tests** - `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts` (2,613 lines)
2. **Session Utils Tests** - `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts` (1,392 lines)
3. **Models Tests** - `/home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts` (large file)

## Key Testing Patterns Summary

1. **SETUP/EXECUTE/VERIFY** - Consistent three-phase test structure
2. **Factory Functions** - `createTest*` functions for test data
3. **Mock Everything** - All file system operations are mocked
4. **Error Code Testing** - Cover ENOENT, EACCES, EEXIST, etc.
5. **Atomic Write Testing** - Verify temp file creation + rename
6. **JSON Serialization** - Test `JSON.stringify()` and `JSON.parse()`
7. **Zod Validation** - Test schema validation in file operations
8. **Cleanup Verification** - Test temp file cleanup on failure
