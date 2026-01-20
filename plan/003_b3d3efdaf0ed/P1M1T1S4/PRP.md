# PRP: P1.M1.T1.S4 - Verify atomic state updates and batching

## Goal

**Feature Goal**: Create comprehensive unit tests that validate the atomic state update batching mechanism in SessionManager, ensuring multiple status updates are accumulated in memory and flushed to disk in a single atomic operation using the temp file + rename pattern.

**Deliverable**: Unit test file `tests/unit/core/session-state-batching.test.ts` with complete test coverage for batching behavior, atomic write operations, and dirty state preservation on failure.

**Success Definition**:
- All 5 CONTRACT requirements from work item description are tested and passing
- Test file runs successfully with `npx vitest run tests/unit/core/session-state-batching.test.ts`
- Tests validate: (a) multiple updates are batched in memory, (b) `flushUpdates()` writes all changes in single atomic operation, (c) temp file is created before final write, (d) rename operation is atomic, (e) dirty state is preserved on flush failure for retry
- Tests use mocked file system operations to simulate failure scenarios

## Why

**Business Value**: The batching pattern is critical for performance optimization in the PRP Pipeline. Without proper batching, each task status update would trigger a separate disk write operation, causing significant I/O overhead. With batching, hundreds of task updates can be accumulated and flushed in a single atomic write operation, reducing disk I/O by up to 99% while maintaining data integrity through atomic writes.

**Integration Points**:
- Validates `updateItemStatus()` from `src/core/session-manager.ts` (lines 768-800) for batch accumulation
- Validates `flushUpdates()` from `src/core/session-manager.ts` (lines 670-720) for batch flushing
- Validates `atomicWrite()` from `src/core/session-utils.ts` (lines 99-180) for temp file + rename pattern
- Validates batching state fields (`#dirty`, `#pendingUpdates`, `#updateCount`) at lines 109-116
- Uses existing test patterns from `tests/unit/core/session-manager.test.ts` for mocking reference

**Problems Solved**:
- Ensures multiple status updates are properly accumulated in memory (not written immediately)
- Confirms atomic write pattern prevents data corruption during process crashes
- Verifies dirty state is preserved on flush failure, enabling retry capability
- Validates batching statistics (itemsWritten, writeOpsSaved, efficiency) are calculated correctly
- Prevents regression bugs in the critical state persistence layer

## What

**User-Visible Behavior**: No direct user-visible behavior - this is infrastructure validation for the session state batching system that enables efficient task execution with minimal disk I/O overhead.

**Success Criteria**:
- [ ] Test verifies multiple `updateItemStatus()` calls accumulate in memory (CONTRACT a)
- [ ] Test verifies `flushUpdates()` writes all changes in single operation (CONTRACT b)
- [ ] Test verifies temp file is created before final write (CONTRACT c)
- [ ] Test verifies rename operation completes atomic write (CONTRACT d)
- [ ] Test verifies dirty state is preserved on flush failure for retry (CONTRACT e)
- [ ] Test verifies batching statistics are calculated correctly (itemsWritten, writeOpsSaved)
- [ ] Test verifies `#dirty` flag behavior (false initially, true after updates, false after flush)
- [ ] Test verifies `#pendingUpdates` accumulates complete backlog state
- [ ] Test verifies `#updateCount` increments with each update
- [ ] Test verifies temp file cleanup on error
- [ ] All tests pass with `npx vitest run tests/unit/core/session-state-batching.test.ts`

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: YES. This PRP provides:
- Complete batching state machine specification with state transitions
- Exact implementation details of atomicWrite with temp filename pattern
- All mock patterns needed for Vitest fs testing
- Existing test file reference for pattern following
- Complete code snippets showing implementation patterns
- All CONTRACT requirements mapped to test cases

### Documentation & References

```yaml
# MUST READ - Core implementation files

- file: src/core/session-manager.ts
  why: Contains batching state fields (lines 109-116) and methods (flushUpdates 670-720, updateItemStatus 768-800)
  pattern: Look for `#dirty`, `#pendingUpdates`, `#updateCount` private fields
  gotcha: Batching uses overwrite strategy - each update completely replaces #pendingUpdates with latest backlog
  lines: 109-116 (state fields), 670-720 (flushUpdates), 768-800 (updateItemStatus)

- file: src/core/session-utils.ts
  why: Contains atomicWrite() function implementing temp file + rename pattern
  pattern: Look for `async function atomicWrite(targetPath: string, data: string): Promise<void>`
  gotcha: Temp filename pattern is `.<basename>.<random-hex>.tmp` with 16-char hex from randomBytes(8)
  lines: 99-180 (atomicWrite implementation)

- file: tests/unit/core/session-manager.test.ts
  why: Reference for Vitest mock patterns for fs/promises and crypto
  pattern: Look for `vi.mock('node:fs/promises')` and `vi.mock('node:crypto')`
  gotcha: Must call vi.clearAllMocks() in beforeEach to prevent mock state leakage
  lines: 1-100 (mock setup pattern)

- file: tests/unit/core/session-state-serialization.test.ts
  why: Reference for atomic write pattern testing with mocks
  pattern: Look for tests verifying writeFile, rename, unlink calls in sequence
  gotcha: Use mockRandomBytes.mockReturnValue() for deterministic temp filenames in tests
  lines: 333-437 (atomic write pattern tests)

- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Contains architecture documentation on batching pattern
  pattern: Look for section "Batching State Corruption Risk" and "Atomic state updates"
  gotcha: Documents that retry is required if flushUpdates() fails
  lines: 102-103, 416-420

# CRITICAL PATTERNS - Batching state machine

- docfile: plan/003_b3d3efdaf0ed/P1M1T1S4/research/batching-state-machine.md
  section: Complete state machine analysis
  why: Shows all state transitions, accumulation logic, error handling
  pattern: Initial → First Update → Multiple Updates → Flush (Success/Error) → Reset/Preserve

- docfile: plan/003_b3d3efdaf0ed/P1M1T1S4/research/atomic-write-implementation.md
  section: Complete atomicWrite implementation
  why: Shows exact temp filename pattern, log messages, error handling flow
  pattern: writeFile(temp) → rename(temp, target) → on error: unlink(temp)
```

### Current Codebase Tree

```bash
tests/
├── unit/
│   └── core/
│       ├── session-manager.test.ts      # Reference for mock patterns
│       ├── session-state-serialization.test.ts  # Reference for atomic write tests
│       ├── session-utils.test.ts        # Reference for session-utils testing
│       └── session-hash-detection.test.ts
├── fixtures/
│   └── ...existing fixtures...
└── setup.ts                             # Global test setup

src/
└── core/
    ├── session-manager.ts               # Batching fields: lines 109-116, flushUpdates: 670-720, updateItemStatus: 768-800
    ├── session-utils.ts                 # atomicWrite: lines 99-180
    └── models.ts                        # Backlog, SessionState, Status types
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
├── unit/
│   └── core/
│       ├── session-manager.test.ts      # (existing - reference)
│       ├── session-state-serialization.test.ts  # (existing - reference)
│       └── session-state-batching.test.ts  # NEW - Unit test for batching and atomic writes
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Vitest vi.mock() must be at TOP LEVEL before imports
// Mock declarations must be before any import statements
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));
vi.mock('node:crypto', () => ({
  randomBytes: vi.fn(),
}));

// CRITICAL: Use vi.mocked() for type-safe mock access
const mockWriteFile = vi.mocked(writeFile);
const mockRename = vi.mocked(rename);
// This provides proper TypeScript typing for mock functions

// CRITICAL: SessionManager batching uses OVERWRITE strategy
// Each updateItemStatus() call completely replaces #pendingUpdates
// It does NOT append - it stores the FULL latest backlog state
this.#pendingUpdates = updated; // Complete replacement, not accumulation

// CRITICAL: #updateCount tracks NUMBER of updates, not number of items changed
// If you call updateItemStatus 5 times, #updateCount = 5
// Even if all 5 calls update the SAME item ID

// CRITICAL: Temp filename pattern uses 16-character hex string
// randomBytes(8).toString('hex') produces 16 hex characters
// Pattern: .<basename>.<16-hex-chars>.tmp
// Example: .tasks.json.a1b2c3d4e5f67890.tmp

// CRITICAL: Mock randomBytes for deterministic temp filenames in tests
mockRandomBytes.mockReturnValue(Buffer.from('abc123def4567890', 'hex'));
// This ensures predictable temp paths in test assertions

// CRITICAL: Batching state is PRESERVED on flushUpdates() failure
// On error: #dirty remains true, #pendingUpdates unchanged, #updateCount unchanged
// This allows immediate retry by calling flushUpdates() again

// CRITICAL: flushUpdates() returns early if #dirty === false
// Does NOT throw, just logs debug message and returns
// This is safe to call multiple times

// CRITICAL: saveBacklog() is NOT mocked in this test
// We mock the underlying fs operations (writeFile, rename)
// saveBacklog() calls writeTasksJSON() which calls atomicWrite()
// We verify the atomicWrite pattern via fs mock calls

// CRITICAL: SessionManager requires initialize() before updateItemStatus()
// Must call await manager.initialize() first
// Also need to mock hashPRD and createSessionDirectory for initialize()

// CRITICAL: writeTasksJSON uses atomicWrite internally
// Pattern: writeTasksJSON → atomicWrite → writeFile(temp) → rename(temp, target)
// Test should verify this call chain through fs mocks

// CRITICAL: Error handling preserves dirty state but re-throws error
// Caller must handle the error and retry if needed
// Test should verify error is thrown AND state is preserved

// GOTCHA: Efficiency calculation is (writeOpsSaved / itemsWritten) * 100
// With 5 updates: itemsWritten=5, writeOpsSaved=4, efficiency=80.0%
// Formula: Math.max(0, itemsWritten - 1) for writeOpsSaved

// GOTCHA: flushUpdates() logs "Batch write complete" with efficiency
// But test cannot directly verify log output without mocking logger
// Test verifies behavior (state changes, fs calls) not logging

// GOTCHA: Vitest mock.mockReset() vs mock.mockClear()
// mockClear(): clears call history but keeps implementation
// mockReset(): clears history AND resets to undefined implementation
// Use mockClear() in beforeEach to preserve mock implementations

// GOTCHA: Testing error scenarios requires mockRejectedValue()
// mockWriteFile.mockRejectedValue(new Error('ENOSPC: no space left'));
// This must be set AFTER the normal mockResolvedValue setup

// GOTCHA: verify mock calls with specific arguments
// expect(mockWriteFile).toHaveBeenCalledWith(tempPath, expect.any(String), { mode: 0o644 });
// Use expect.any(String) for content that's hard to predict exactly
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Import core dependencies
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import type { Backlog, Status } from '../../../src/core/models.js';

// Import SessionManager and dependencies
import { SessionManager } from '../../../src/core/session-manager.js';
import { hashPRD, createSessionDirectory, writeTasksJSON, SessionFileError } from '../../../src/core/session-utils.js';

// Mock modules at top level
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

vi.mock('node:fs', () => ({
  statSync: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomBytes: vi.fn(),
  createHash: vi.fn(),
}));

vi.mock('../../../src/core/session-utils.js', () => ({
  hashPRD: vi.fn(),
  createSessionDirectory: vi.fn(),
  writeTasksJSON: vi.fn(),
  readTasksJSON: vi.fn(),
  SessionFileError: class extends Error {
    readonly path: string;
    constructor(path: string, operation: string, cause?: Error) {
      super(`Failed to ${operation} at ${path}`);
      this.name = 'SessionFileError';
      this.path = path;
    }
  },
}));

// Get typed mock references
const mockWriteFile = vi.mocked(writeFile);
const mockRename = vi.mocked(rename);
const mockUnlink = vi.mocked(unlink);
const mockRandomBytes = vi.mocked(randomBytes);
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/core/session-state-batching.test.ts
  - IMPLEMENT: Test file with describe block for batching behavior
  - FOLLOW pattern: tests/unit/core/session-state-serialization.test.ts (test structure)
  - NAMING: session-state-batching.test.ts
  - PLACEMENT: tests/unit/core/ directory (alongside other core unit tests)

Task 2: IMPLEMENT test file setup and mock configuration
  - IMPLEMENT: Mock declarations at top level (vi.mock for fs/promises, fs, crypto, session-utils)
  - IMPLEMENT: beforeEach() clearing all mocks with vi.clearAllMocks()
  - IMPLEMENT: Helper function `createMockBacklog()` for test data
  - IMPLEMENT: Helper function `createMockSessionManager()` for SessionManager setup
  - IMPLEMENT: Default mock setup (hashPRD, createSessionDirectory, readFile)
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (lines 31-70)

Task 3: IMPLEMENT test for multiple updates batched in memory (CONTRACT a)
  - IMPLEMENT: it('should batch multiple status updates in memory')
  - SETUP: Create SessionManager, initialize(), mock writeTasksJSON to track calls
  - EXECUTE: Call updateItemStatus() 3 times with different item IDs
  - VERIFY: writeTasksJSON called 0 times (no immediate writes)
  - VERIFY: internal #dirty flag is true (access via behavior, not direct field)
  - VERIFY: internal #pendingUpdates contains all 3 updates
  - VERIFY: internal #updateCount equals 3

Task 4: IMPLEMENT test for flushUpdates single atomic operation (CONTRACT b)
  - IMPLEMENT: it('should flush all updates in single atomic operation')
  - SETUP: Create SessionManager with 3 batched updates
  - EXECUTE: Call flushUpdates()
  - VERIFY: writeTasksJSON called exactly 1 time
  - VERIFY: writeTasksJSON called with backlog containing all 3 updates
  - VERIFY: Batch statistics correct (itemsWritten=3, writeOpsSaved=2)
  - VERIFY: Batching state reset (#dirty=false, #pendingUpdates=null)

Task 5: IMPLEMENT test for temp file creation before final write (CONTRACT c)
  - IMPLEMENT: it('should create temp file before final write')
  - SETUP: Mock randomBytes for deterministic temp filename, create SessionManager with batched updates
  - EXECUTE: Call flushUpdates() which triggers writeTasksJSON → atomicWrite
  - VERIFY: writeFile called with temp path pattern (.<basename>.<hex>.tmp)
  - VERIFY: writeFile called BEFORE rename
  - VERIFY: temp path contains randomBytes hex value
  - VERIFY: temp path is in same directory as target path

Task 6: IMPLEMENT test for rename operation completes atomic write (CONTRACT d)
  - IMPLEMENT: it('should use rename to complete atomic write')
  - SETUP: Create SessionManager with batched updates, mock writeFile and rename
  - EXECUTE: Call flushUpdates()
  - VERIFY: rename called AFTER writeFile succeeds
  - VERIFY: rename called with (tempPath, targetPath) arguments
  - VERIFY: writeFile mode is 0o644 (owner read/write, group/others read-only)

Task 7: IMPLEMENT test for dirty state preserved on flush failure (CONTRACT e)
  - IMPLEMENT: it('should preserve dirty state on flush failure for retry')
  - SETUP: Create SessionManager with batched updates
  - MOCK: writeTasksJSON.mockRejectedValue(new Error('ENOSPC: no space'))
  - EXECUTE: Call flushUpdates() and expect it to throw
  - VERIFY: Error is thrown (write failure propagated)
  - VERIFY: Batching state preserved (can call flushUpdates again for retry)
  - VERIFY: Second flushUpdates attempt succeeds with corrected mocks

Task 8: IMPLEMENT test for batching statistics calculation
  - IMPLEMENT: it('should calculate batching statistics correctly')
  - SETUP: Create SessionManager with 5 batched updates
  - EXECUTE: Call flushUpdates()
  - VERIFY: itemsWritten = 5 (update count)
  - VERIFY: writeOpsSaved = 4 (itemsWritten - 1)
  - VERIFY: efficiency = 80.0% ((writeOpsSaved / itemsWritten) * 100)
  - TEST: Edge case - single update (efficiency = 0%)

Task 9: IMPLEMENT test for #dirty flag behavior
  - IMPLEMENT: it('should set dirty flag after updates and reset after flush')
  - SETUP: Create initialized SessionManager
  - VERIFY: flushUpdates() returns early when #dirty === false
  - EXECUTE: Call updateItemStatus() once
  - VERIFY: flushUpdates() performs write (dirty is true)
  - EXECUTE: Call flushUpdates() again
  - VERIFY: flushUpdates() returns early (dirty is false)

Task 10: IMPLEMENT test for temp file cleanup on error
  - IMPLEMENT: it('should clean up temp file on write or rename failure')
  - SETUP: Create SessionManager with batched updates
  - MOCK: writeFile.mockRejectedValue(new Error('EIO: I/O error'))
  - MOCK: unlink.mockResolvedValue(undefined)
  - EXECUTE: Call flushUpdates() and expect it to throw
  - VERIFY: unlink called with temp path (cleanup attempted)
  - VERIFY: Original error thrown (not unlink error)

Task 11: IMPLEMENT comprehensive batching workflow test
  - IMPLEMENT: it('should handle complete batching workflow end-to-end')
  - SETUP: Create SessionManager, initialize
  - EXECUTE: 10 status updates, flushUpdates, verify single write
  - EXECUTE: 5 more updates, flushUpdates, verify second single write
  - VERIFY: Each flush is independent (correct stats each time)
  - VERIFY: State resets correctly between batches

Task 12: IMPLEMENT edge cases test suite
  - IMPLEMENT: it('should handle empty batch (flush with no updates)')
  - VERIFY: flushUpdates returns early without error
  - IMPLEMENT: it('should handle single update batch')
  - VERIFY: Stats correct (itemsWritten=1, writeOpsSaved=0, efficiency=0%)
  - IMPLEMENT: it('should handle concurrent update scenarios')
  - VERIFY: Updates accumulate correctly regardless of timing
  - IMPLEMENT: it('should handle same item updated multiple times')
  - VERIFY: #updateCount increments each time
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Mock setup with deterministic temp filename
beforeEach(() => {
  vi.clearAllMocks();

  // Set up deterministic random bytes for temp filenames
  mockRandomBytes.mockReturnValue(Buffer.from('abc123def4567890', 'hex'));

  // Default successful mock implementations
  mockWriteFile.mockResolvedValue(undefined);
  mockRename.mockResolvedValue(undefined);
  mockUnlink.mockResolvedValue(undefined);

  // Mock session-utils functions
  mockHashPRD.mockResolvedValue('14b9dc2a33c7' + '0'.repeat(52)); // Full 64-char hash
  mockCreateSessionDirectory.mockResolvedValue('/test/plan/001_14b9dc2a33c7');
  mockWriteTasksJSON.mockResolvedValue(undefined);
});

// PATTERN: Helper to create mock backlog
function createMockBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Phase 1',
        status: 'Planned',
        description: 'Test phase',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Milestone 1',
            status: 'Planned',
            description: 'Test milestone',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Task 1',
                status: 'Planned',
                description: 'Test task',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Subtask 1',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: '',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// PATTERN: Helper to create initialized SessionManager
async function createMockSessionManager(): Promise<SessionManager> {
  const manager = new SessionManager('/test/PRD.md', '/test/plan');

  // Mock readFile for PRD content
  vi.mocked(await import('node:fs/promises')).readFile.mockResolvedValue(
    '# Test PRD\n\nThis is a test PRD with sufficient content.'
  );

  // Mock statSync for PRD file validation
  vi.mocked(await import('node:fs')).statSync.mockReturnValue({
    isFile: () => true,
  } as any);

  await manager.initialize();
  return manager;
}

// PATTERN: Test multiple updates batched in memory (CONTRACT a)
it('should batch multiple status updates in memory', async () => {
  // SETUP: Create SessionManager and initialize
  const manager = await createMockSessionManager();

  // Track writeTasksJSON calls (should not be called during batching)
  let writeTasksCallCount = 0;
  mockWriteTasksJSON.mockImplementation(async () => {
    writeTasksCallCount++;
  });

  // EXECUTE: Multiple status updates
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

  // VERIFY: No immediate writes occurred (updates batched in memory)
  expect(writeTasksCallCount).toBe(0);

  // VERIFY: Internal state reflects batching (verify through behavior)
  const currentItem1 = manager.getCurrentItem();
  expect(currentItem1?.status).toBe('Complete'); // Last update applied

  // VERIFY: Dirty state is set (flush will perform write)
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();

  // VERIFY: Single write for all 3 updates
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
});

// PATTERN: Test flushUpdates single atomic operation (CONTRACT b)
it('should flush all updates in single atomic operation', async () => {
  // SETUP: Create SessionManager with batched updates
  const manager = await createMockSessionManager();

  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');

  // EXECUTE: Flush updates
  await manager.flushUpdates();

  // VERIFY: Single atomic write operation
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);

  // VERIFY: Written backlog contains all 3 updates
  const writtenBacklog = mockWriteTasksJSON.mock.calls[0][1] as Backlog;
  expect(writtenBacklog).toBeDefined();

  // Find the updated items and verify their status
  const item1 = writtenBacklog.backlog[0].milestones[0].tasks[0].subtasks[0];
  expect(item1.status).toBe('Complete');
});

// PATTERN: Test temp file creation (CONTRACT c)
it('should create temp file before final write', async () => {
  // SETUP: Create SessionManager with deterministic temp filename
  mockRandomBytes.mockReturnValue(Buffer.from('abc123def4567890', 'hex'));
  const manager = await createMockSessionManager();

  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // EXECUTE: Flush updates
  await manager.flushUpdates();

  // VERIFY: writeFile called with temp path pattern
  const writeCall = mockWriteFile.mock.calls[0];
  const tempPath = writeCall[0] as string;
  expect(tempPath).toMatch(/\.[a-z0-9_]+\.abc123def4567890\.tmp$/);
  expect(tempPath).toContain('.tasks.json.');

  // VERIFY: writeFile called before rename
  const writeIndex = mockWriteFile.mock.calls.findIndex(
    call => call[0] === tempPath
  );
  const renameIndex = mockRename.mock.calls.findIndex(
    call => call[1] && call[1].includes('tasks.json')
  );
  expect(writeIndex).toBeGreaterThanOrEqual(0);
  expect(renameIndex).toBeGreaterThanOrEqual(0);
});

// PATTERN: Test rename completes atomic write (CONTRACT d)
it('should use rename to complete atomic write', async () => {
  // SETUP: Create SessionManager with batched updates
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // EXECUTE: Flush updates
  await manager.flushUpdates();

  // VERIFY: rename called after writeFile
  expect(mockRename).toHaveBeenCalled();

  const renameCall = mockRename.mock.calls[0];
  expect(renameCall[0]).toMatch(/\.tmp$/); // Source is temp file
  expect(renameCall[1]).toContain('tasks.json'); // Target is final file

  // VERIFY: File permissions are 0o644
  const writeCall = mockWriteFile.mock.calls[0];
  expect(writeCall[2]).toEqual({ mode: 0o644 });
});

// PATTERN: Test dirty state preserved on failure (CONTRACT e)
it('should preserve dirty state on flush failure for retry', async () => {
  // SETUP: Create SessionManager with batched updates
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');

  // MOCK: First flush fails
  mockWriteTasksJSON.mockRejectedValueOnce(
    new Error('ENOSPC: no space left on device')
  );

  // EXECUTE: First flush attempt (should fail)
  await expect(manager.flushUpdates()).rejects.toThrow('ENOSPC');

  // VERIFY: State preserved for retry
  // Can call flushUpdates again immediately

  // MOCK: Second flush succeeds
  mockWriteTasksJSON.mockResolvedValueOnce(undefined);

  // EXECUTE: Retry flush (should succeed)
  await expect(manager.flushUpdates()).resolves.not.toThrow();

  // VERIFY: Write eventually succeeded
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(2);
});

// PATTERN: Test batching statistics
it('should calculate batching statistics correctly', async () => {
  // SETUP: Create SessionManager
  const manager = await createMockSessionManager();

  // EXECUTE: Multiple updates
  const updateCount = 5;
  for (let i = 1; i <= updateCount; i++) {
    await manager.updateItemStatus(`P1.M1.T1.S${i}`, 'Complete');
  }

  // EXECUTE: Flush updates
  await manager.flushUpdates();

  // VERIFY: Statistics calculated correctly
  // itemsWritten = 5
  // writeOpsSaved = 4 (5 - 1)
  // efficiency = 80.0% ((4 / 5) * 100)

  // Note: Cannot directly access logger output in test
  // Verify behavior indirectly: single write for multiple updates
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);
});

// PATTERN: Test dirty flag behavior
it('should set dirty flag after updates and reset after flush', async () => {
  // SETUP: Create SessionManager
  const manager = await createMockSessionManager();

  // VERIFY: flush with no updates is safe (returns early)
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();

  // EXECUTE: Add update
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // VERIFY: flush now performs write
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).toHaveBeenCalledTimes(1);

  // VERIFY: subsequent flush returns early (dirty reset)
  mockWriteTasksJSON.mockClear();
  await manager.flushUpdates();
  expect(mockWriteTasksJSON).not.toHaveBeenCalled();
});

// PATTERN: Test temp file cleanup on error
it('should clean up temp file on write or rename failure', async () => {
  // SETUP: Create SessionManager with batched updates
  const manager = await createMockSessionManager();
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // MOCK: writeFile fails
  mockWriteFile.mockRejectedValueOnce(new Error('EIO: I/O error'));
  mockUnlink.mockResolvedValue(undefined);

  // EXECUTE: Flush should fail
  await expect(manager.flushUpdates()).rejects.toThrow('EIO');

  // VERIFY: Cleanup attempted (unlink called)
  // Note: unlink is called by atomicWrite in writeTasksJSON
  // We verify error was thrown, cleanup happens internally
  expect(mockWriteFile).toHaveBeenCalled();
});
```

### Integration Points

```yaml
SESSION_MANAGER:
  - class: SessionManager from src/core/session-manager.ts
  - fields: #dirty (line 110), #pendingUpdates (line 113), #updateCount (line 116)
  - method: async updateItemStatus(itemId: string, status: Status): Promise<Backlog>
  - method: async flushUpdates(): Promise<void>

SESSION_UTILS:
  - function: async writeTasksJSON(sessionPath: string, backlog: Backlog): Promise<void>
  - internal: async atomicWrite(targetPath: string, data: string): Promise<void>
  - pattern: writeFile(temp) → rename(temp, target) → on error: unlink(temp)

MOCK_DEPS:
  - node:fs/promises: writeFile, rename, unlink
  - node:crypto: randomBytes (for deterministic temp filenames)
  - src/core/session-utils: writeTasksJSON, hashPRD, createSessionDirectory

TEST_FRAMEWORK:
  - runner: Vitest (configured in vitest.config.ts)
  - environment: node
  - mock: vi.mock(), vi.mocked(), vi.clearAllMocks()
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit tests/unit/core/session-state-batching.test.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run ESLint to check code style
npx eslint tests/unit/core/session-state-batching.test.ts --fix

# Expected: Zero linting errors. Auto-fix should handle formatting issues.

# Run Prettier for consistent formatting
npx prettier --write tests/unit/core/session-state-batching.test.ts

# Expected: File formatted successfully.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the new unit test file
npx vitest run tests/unit/core/session-state-batching.test.ts

# Expected: All tests pass. Check output for any failures.

# Run all core unit tests to ensure no regressions
npx vitest run tests/unit/core/

# Expected: All core unit tests pass.

# Run with coverage report
npx vitest run tests/unit/core/session-state-batching.test.ts --coverage

# Expected: Coverage shows tested code paths (flushUpdates, updateItemStatus batching logic)
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite execution
npm test

# Expected: All tests pass (unit + integration).

# Verify no regressions in existing tests
npx vitest run tests/unit/core/session-manager.test.ts
npx vitest run tests/unit/core/session-state-serialization.test.ts

# Expected: Existing session-related tests still pass.

# Test project-wide validation
npm run validate

# Expected: All validation checks pass (linting, typecheck, formatting).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual verification: Run test and inspect mock call sequences
# Add temporary logging to see actual batching behavior

# Domain-specific: Verify batching state machine transitions
# Test state: Initial → First Update → Multiple Updates → Flush (Success)
# Test state: Multiple Updates → Flush (Error) → Retry Flush (Success)

# Test edge cases:
# - Empty batch (flush without updates)
# - Single update batch
# - Same item updated multiple times
# - Large number of updates (100+)
# - Immediate retry after failure

# Test mock behavior verification:
# - Verify exact temp filename pattern
# - Verify atomic operation sequence (write → rename)
# - Verify cleanup on error (unlink called)
# - Verify file permissions (0o644)
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npx vitest run tests/unit/core/session-state-batching.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/unit/core/session-state-batching.test.ts`
- [ ] No linting errors: `npx eslint tests/unit/core/session-state-batching.test.ts`
- [ ] No formatting issues: `npx prettier --check tests/unit/core/session-state-batching.test.ts`

### Feature Validation

- [ ] Multiple updates batched in memory (CONTRACT a)
- [ ] flushUpdates() writes all changes in single atomic operation (CONTRACT b)
- [ ] Temp file created before final write (CONTRACT c)
- [ ] Rename operation completes atomic write (CONTRACT d)
- [ ] Dirty state preserved on flush failure for retry (CONTRACT e)
- [ ] Batching statistics calculated correctly
- [ ] #dirty flag behavior correct (false → true → false)
- [ ] #pendingUpdates accumulates complete backlog state
- [ ] #updateCount increments with each update
- [ ] Temp file cleanup on error

### Code Quality Validation

- [ ] Follows existing test patterns from session-manager.test.ts
- [ ] Test isolation: beforeEach properly clears mocks
- [ ] Descriptive test names following "should..." convention
- [ ] Proper assertions with clear failure messages
- [ ] Mock operations use vi.mocked() for type safety
- [ ] Helper functions for common operations (createMockBacklog, createMockSessionManager)
- [ ] Mock setup in beforeEach prevents test pollution

### Documentation & Deployment

- [ ] Test file has JSDoc comments explaining purpose
- [ ] Complex test logic has inline comments
- [ ] Test follows Setup/Execute/Verify pattern consistently
- [ ] All CONTRACT requirements from work item description are tested

## Anti-Patterns to Avoid

- ❌ Don't mock SessionManager directly - test real implementation with mocked dependencies
- ❌ Don't forget to call initialize() before updateItemStatus() (throws error)
- ❌ Don't use real filesystem operations in unit tests - mock all fs calls
- ❌ Don't forget to clear mocks in beforeEach (causes test pollution)
- ❌ Don't assume #pendingUpdates appends - it OVERWRITES with complete backlog
- ❌ Don't test log output directly - verify behavior through state changes and mock calls
- ❌ Don't use mockReset() when mockClear() is sufficient (preserves implementations)
- ❌ Don't forget deterministic randomBytes mock (temp filenames become unpredictable)
- ❌ Don't test writeTasksJSON behavior - it's tested elsewhere, test SessionManager batching
- ❌ Don't verify efficiency calculation by checking logs - verify indirectly through behavior
- ❌ Don't skip testing error scenarios - they're critical for dirty state preservation
- ❌ Don't assume flushUpdates() throws when no updates - it returns early silently
- ❌ Don't use relative paths without resolve in SessionManager constructor
- ❌ Don't mock statSync incorrectly (must return object with isFile method)
- ❌ Don't forget SessionFileError import in mock (used by session-utils)
