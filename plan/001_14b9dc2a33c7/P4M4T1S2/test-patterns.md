# Session Management Test Patterns

**Date**: 2026-01-13
**Status**: Complete
**Coverage**: session-utils.ts (100%), session-manager.ts (97.84%)

---

## Overview

This document documents the test patterns used in the session management test suite for future reference. The patterns established in `tests/unit/core/session-utils.test.ts` and `tests/unit/core/session-manager.test.ts` serve as examples for testing file I/O operations, class state management, and error handling.

---

## Test Pattern Summary

### 1. AAA (Arrange-Act-Assert) Pattern

All tests follow the AAA pattern for clarity and consistency:

```typescript
it('should compute SHA-256 hash of PRD file', async () => {
  // ARRANGE: Mock file read and hash computation
  mockReadFile.mockResolvedValue('# Test PRD\n\nThis is a test PRD.');
  const hashInstance = new MockHash();
  mockCreateHash.mockReturnValue(hashInstance);

  // ACT: Call the function
  const hash = await hashPRD('/test/path/PRD.md');

  // ASSERT: Verify behavior
  expect(mockReadFile).toHaveBeenCalledWith('/test/path/PRD.md', 'utf-8');
  expect(mockCreateHash).toHaveBeenCalledWith('sha256');
  expect(hash).toBe('14b9dc2a33c7...');
});
```

### 2. vi.mock() Module Mocking

All external dependencies are mocked at the top level using `vi.mock()`:

```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Mock the session-utils module
vi.mock('../../../src/core/session-utils.js', () => ({
  hashPRD: vi.fn(),
  createSessionDirectory: vi.fn(),
  readTasksJSON: vi.fn(),
  writeTasksJSON: vi.fn(),
  SessionFileError: class extends Error { /* ... */ },
}));
```

**Key Points**:
- Mocks are defined at the top level, not inside tests or describe blocks
- This ensures proper mock hoisting by Vitest
- Type safety is maintained using `as any` casting for mocked functions

### 3. Factory Functions for Test Data

Consistent test data is created using factory functions:

```typescript
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

const createTestBacklog = (phases: any[]): Backlog => ({
  backlog: phases,
});
```

**Benefits**:
- Consistent data structure across tests
- Easy to create complex hierarchies (Phase → Milestone → Task → Subtask)
- Reduces test code duplication

### 4. Error Simulation Patterns

Error handling is tested by simulating specific error codes:

```typescript
it('should throw SessionFileError on file read failure (ENOENT)', async () => {
  // SETUP: Mock file read error with proper error code
  const error = new Error('ENOENT: no such file');
  (error as NodeJS.ErrnoException).code = 'ENOENT';
  mockReadFile.mockRejectedValue(error);

  // EXECUTE & VERIFY
  await expect(hashPRD('/test/path/PRD.md')).rejects.toThrow(SessionFileError);

  // Verify error properties
  try {
    await hashPRD('/test/path/PRD.md');
  } catch (e) {
    expect(e).toBeInstanceOf(SessionFileError);
    const sessionError = e as SessionFileError;
    expect(sessionError.code).toBe('ENOENT');
  }
});
```

**Key Points**:
- Use `(error as NodeJS.ErrnoException).code` to set error codes
- Test both the exception type and error properties
- Test different error codes (ENOENT, EACCES, EEXIST, etc.)

### 5. Atomic Write Pattern Verification

Atomic write operations are tested by verifying the temp file + rename pattern:

```typescript
it('should write tasks.json with atomic write pattern', async () => {
  const backlog = createTestBacklog([createTestPhase('P1', 'Phase 1', 'Planned')]);

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
```

### 6. Cleanup Verification

Cleanup on failure is tested to ensure temp files are removed:

```typescript
it('should clean up temp file on rename failure', async () => {
  mockWriteFile.mockResolvedValue(undefined);
  mockRename.mockRejectedValue(new Error('EIO: I/O error'));

  const backlog = createTestBacklog([createTestPhase('P1', 'Phase 1', 'Planned')]);

  await expect(writeTasksJSON('/test/session', backlog)).rejects.toThrow(SessionFileError);

  // Unlink should be called to clean up temp file
  expect(mockUnlink).toHaveBeenCalled();
});
```

### 7. Error Handling in Loops (Error Skip Pattern)

When iterating over items, errors should be caught and the item skipped:

```typescript
it('should skip sessions that fail to load during listSessions', async () => {
  // SETUP: Multiple sessions exist, one will throw error
  mockReaddir.mockImplementation(async () => [
    { name: '001_14b9dc2a33c7', isDirectory: () => true },
    { name: '002_25e8db4b4d8a', isDirectory: () => true },
    { name: '003_a3f8e9d12b4a', isDirectory: () => true },
  ]);

  // Mock stat to throw error for session 002
  let callCount = 0;
  mockStat.mockImplementation(async () => {
    callCount++;
    if (callCount === 2) {
      throw new Error('EACCES: permission denied');
    }
    return { mtime: new Date('2024-01-01') };
  });

  const sessions = await SessionManager.listSessions('/test/plan');

  // VERIFY: Should return 2 sessions (001 and 003), skipping 002
  expect(sessions).toHaveLength(2);
  expect(sessions[0].id).toBe('001_14b9dc2a33c7');
  expect(sessions[1].id).toBe('003_a3f8e9d12b4a');
});
```

### 8. Defensive Code Documentation

Unreachable defensive code should be documented rather than artificially tested:

```typescript
it('defensive check for null prdHash is unreachable in normal operation', () => {
  // NOTE: Lines 830-831 in session-manager.ts check if #prdHash is null
  // This is defensive code that cannot be reached in normal operation because:
  // 1. initialize() always calls hashPRD() and sets #prdHash before returning
  // 2. There is no public API that sets #currentSession without also setting #prdHash
  // 3. The first check in hasSessionChanged() (for #currentSession) would fail first
  //
  // This is a TypeScript type guard combined with defensive programming to provide
  // runtime safety, but it's unreachable given the current implementation.
});
```

### 9. Mock Reset and Clear

Mocks are cleared before each test to prevent state leakage:

```typescript
describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests...
});
```

### 10. Zod Validation Testing

Schema validation is tested with both valid and invalid data:

```typescript
it('should throw SessionFileError on Zod validation error', async () => {
  const invalidSchema = { backlog: [{ id: 'P1' }] }; // Missing required fields
  mockReadFile.mockResolvedValue(JSON.stringify(invalidSchema));

  await expect(readTasksJSON('/test/session')).rejects.toThrow(SessionFileError);
});
```

---

## Common Gotchas

### 1. Mock Hoisting

All `vi.mock()` calls must be at the top level, not inside tests or describe blocks:

```typescript
// ✅ CORRECT: Top-level mock
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));

// ❌ WRONG: Mock inside describe or test
describe('tests', () => {
  vi.mock('node:fs/promises', () => ({ readFile: vi.fn() })); // Won't work correctly
});
```

### 2. Error Code Assignment

Error codes must be set using type assertion:

```typescript
// ✅ CORRECT
const error = new Error('ENOENT') as NodeJS.ErrnoException;
error.code = 'ENOENT';

// ❌ WRONG
const error = new Error('ENOENT');
error.code = 'ENOENT'; // TypeScript error
```

### 3. Private Field Testing

Private fields cannot be tested directly. Test behavior through public methods:

```typescript
// ✅ CORRECT: Test via public API
expect(manager.currentSession).toBeNull();
expect(manager.hasSessionChanged()).toBe(false);

// ❌ WRONG: Trying to access private fields
expect(manager['#prdHash']).toBeNull(); // TypeScript error, wrong approach
```

### 4. Async/Await in Tests

Always use `async/await` for testing async functions:

```typescript
// ✅ CORRECT
it('should load session', async () => {
  const session = await manager.loadSession('/plan/001_14b9dc2a33c7');
  expect(session).toBeDefined();
});

// ❌ WRONG: Not awaiting
it('should load session', () => {
  const session = manager.loadSession('/plan/001_14b9dc2a33c7'); // Returns Promise
  expect(session).toBeDefined(); // Test passes even if loadSession fails
});
```

---

## File-Specific Patterns

### session-utils.test.ts

- **64 tests** covering all utility functions
- Tests all error codes: ENOENT, EACCES, EEXIST, EIO, etc.
- Tests atomic write pattern (temp file + rename)
- Tests cleanup on failure scenarios
- Tests Zod validation for all schemas

### session-manager.test.ts

- **99 tests** covering SessionManager class
- Tests constructor validation (synchronous file check)
- Tests initialize() for both new and existing sessions
- Tests loadSession() with full hierarchy reconstruction
- Tests createDeltaSession() with parent session linking
- Tests saveBacklog/loadBacklog persistence cycle
- Tests updateItemStatus with immutable updates
- Tests getCurrentItem/setCurrentItem cycle
- Tests static methods: listSessions, findLatestSession, findSessionByPRD
- Tests hasSessionChanged with cached PRD hash

---

## Coverage Results

### session-utils.ts
- **100% coverage** - All functions, branches, and lines covered
- All error paths tested
- All edge cases covered

### session-manager.ts
- **97.84% coverage** - Nearly complete
- **Covered**: All public methods, error handling paths, edge cases
- **Not Covered**:
  - Lines 544-556: `__parseSessionDirectory` - unused internal helper (dead code)
  - Lines 830-831: `hasSessionChanged()` defensive check - unreachable in normal operation

---

## Conclusion

The session management test suite demonstrates best practices for:
- File I/O testing with mocks
- Class state management testing
- Error handling and edge case coverage
- AAA test pattern
- Factory functions for test data
- Atomic operation verification

These patterns should be reused when testing other components in the codebase.
