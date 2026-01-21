# Product Requirement Prompt (PRP): Test Atomic Update Flushing

**PRP ID**: P2.M1.T2.S1
**Generated**: 2026-01-15
**Story Points**: 2

---

## Goal

**Feature Goal**: Create comprehensive integration tests for SessionManager's atomic batch update flushing mechanism, ensuring that multiple status updates are accumulated in memory, written atomically via temp file + rename pattern to prevent JSON corruption, and concurrent flush calls are properly serialized.

**Deliverable**: Extended integration test file at `tests/integration/core/session-manager.test.ts` with full coverage of atomic flush scenarios using real filesystem operations and mocked fs operations for failure simulation.

**Success Definition**:

- Multiple `updateItemStatus()` calls accumulate updates in memory (not written to disk)
- `flushUpdates()` writes all accumulated updates atomically in single operation
- Atomic write pattern (temp file + rename) prevents JSON file corruption
- Write failures leave original file intact (no corruption)
- Concurrent `flushUpdates()` calls are serialized (no race conditions)
- File integrity verified with JSON.parse() after successful flush
- Dirty state preserved on error for retry capability
- All integration tests pass with 100% coverage of flush code paths

---

## User Persona

**Target User**: Developer working on SessionManager validation who needs assurance that the batch update pattern correctly prevents JSON file corruption and handles concurrent flush operations safely.

**Use Case**: Validating that SessionManager's `flushUpdates()` method correctly writes accumulated status updates atomically, preventing corruption if the process crashes during write, and properly serializes concurrent flush calls.

**User Journey**:

1. Task Orchestrator calls `updateItemStatus('P1.M1.T1.S1', 'Complete')` - update queued in memory
2. Task Orchestrator calls `updateItemStatus('P1.M1.T1.S2', 'Complete')` - update queued in memory
3. Task Orchestrator calls `flushUpdates()` - all updates written atomically
4. Temp file created with new content, then renamed to `tasks.json`
5. If write fails, original `tasks.json` untouched
6. If multiple flush calls happen concurrently, they execute serially

**Pain Points Addressed**:

- **JSON corruption risk**: Without atomic writes, process crashes leave truncated JSON
- **Write amplification**: Without batching, each update triggers separate disk write
- **Race conditions**: Concurrent flush calls could corrupt data
- **Data loss**: Failed writes without retry capability lose updates
- **Testing gaps**: Need validation that atomic pattern prevents corruption

---

## Why

- **Data Integrity**: Batch updates with atomic writes prevent JSON file corruption from process crashes or disk failures
- **Performance**: Accumulating updates in memory reduces disk I/O from N writes to 1 write
- **Concurrency Safety**: Serializing flush calls prevents race conditions from concurrent writes
- **Recovery**: Preserving dirty state on error allows retry without losing updates
- **Production Confidence**: Integration tests with real filesystem and mocked failures catch bugs unit tests miss
- **Problems Solved**:
  - "Does flushUpdates() write all accumulated updates atomically?"
  - "Does the temp file + rename pattern prevent corruption?"
  - "Are concurrent flush calls properly serialized?"
  - "Does write failure preserve original file integrity?"
  - "Is dirty state preserved for retry on error?"

---

## What

Extend the integration test file at `tests/integration/core/session-manager.test.ts` to validate atomic batch update flushing with real filesystem operations and mocked fs operations for failure simulation.

### Current State Analysis

**SessionManager Batch Update State** (from `/src/core/session-manager.ts` lines 110-116):

```typescript
/** Batching state: flag indicating pending changes */
#dirty: boolean = false;

/** Batching state: latest accumulated backlog state */
#pendingUpdates: Backlog | null = null;

/** Batching state: count of accumulated updates (for stats) */
#updateCount: number = 0;
```

**SessionManager.updateItemStatus() Method** (from `/src/core/session-manager.ts` lines 632-664):

```typescript
async updateItemStatus(itemId: string, status: Status): Promise<Backlog> {
  // Get current backlog from session
  const currentBacklog = this.#currentSession.taskRegistry;

  // Immutable update using utility function
  const updated = updateItemStatusUtil(currentBacklog, itemId, status);

  // BATCHING: Accumulate in memory instead of immediate write
  this.#pendingUpdates = updated;      // Accumulate in memory
  this.#dirty = true;                  // Mark as dirty
  this.#updateCount++;                 // Track update count

  // Update internal session state
  this.#currentSession = {
    ...this.#currentSession,
    taskRegistry: updated,
  };

  // NOTE: No longer calling await this.saveBacklog(updated)
  // Caller must call flushUpdates() to persist changes

  return updated;
}
```

**SessionManager.flushUpdates() Method** (from `/src/core/session-manager.ts` lines 534-584):

```typescript
async flushUpdates(): Promise<void> {
  // Early return if no pending changes
  if (!this.#dirty) {
    this.#logger.debug('No pending updates to flush');
    return;
  }

  if (!this.#pendingUpdates) {
    this.#logger.warn('Dirty flag set but no pending updates - skipping flush');
    this.#dirty = false;
    return;
  }

  try {
    // Persist accumulated updates atomically
    await this.saveBacklog(this.#pendingUpdates);  // Delegates to writeTasksJSON()

    // Calculate stats for logging
    const itemsWritten = this.#updateCount;
    const writeOpsSaved = Math.max(0, itemsWritten - 1);

    // Log batch write completion
    this.#logger.info(
      { itemsWritten, writeOpsSaved, efficiency: '...' },
      'Batch write complete'
    );

    // Reset batching state
    this.#dirty = false;
    this.#pendingUpdates = null;
    this.#updateCount = 0;

    this.#logger.debug('Batching state reset');
  } catch (error) {
    // Preserve dirty state on error - allow retry
    this.#logger.error(
      { error, pendingCount: this.#updateCount },
      'Batch write failed - pending updates preserved for retry'
    );
    throw error; // Re-throw for caller to handle
  }
}
```

**Atomic Write Pattern** (from `/src/core/session-utils.ts` lines 93-111):

```typescript
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  // Step 1: Generate unique temp file name
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    // Step 2: Write to temp file (non-atomic, but isolated)
    await writeFile(tempPath, data, { mode: 0o644 });

    // Step 3: Atomic rename from temp to target
    await rename(tempPath, targetPath);
  } catch (error) {
    // Step 4: Clean up temp file on error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}
```

**writeTasksJSON() Using Atomic Write** (from `/src/core/session-utils.ts` lines 266-290):

```typescript
export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  try {
    // Validate with Zod schema
    const validated = BacklogSchema.parse(backlog);

    // Serialize to JSON with 2-space indentation
    const content = JSON.stringify(validated, null, 2);

    // Write atomically using temp file + rename pattern
    const tasksPath = resolve(sessionPath, 'tasks.json');
    await atomicWrite(tasksPath, content);
  } catch (error) {
    if (error instanceof SessionFileError) {
      throw error;
    }
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'write tasks.json',
      error as Error
    );
  }
}
```

### Success Criteria

- [ ] Test 1: Multiple updateItemStatus() calls accumulate updates in memory
- [ ] Test 2: Updates not written to disk until flushUpdates() is called
- [ ] Test 3: flushUpdates() writes all accumulated updates atomically
- [ ] Test 4: Atomic write uses temp file + rename pattern
- [ ] Test 5: Write failure (mocked) leaves original file intact
- [ ] Test 6: Concurrent flushUpdates() calls are serialized
- [ ] Test 7: Dirty state preserved on error for retry
- [ ] Test 8: File integrity verified with JSON.parse() after flush
- [ ] Test 9: Batch statistics logged correctly (items written, write ops saved)
- [ ] Test 10: Multiple sequential flush cycles work correctly
- [ ] All tests use real filesystem (temp directories)
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- [x] SessionManager batch update state documented (#dirty, #pendingUpdates, #updateCount)
- [x] updateItemStatus() implementation analyzed (lines 632-664)
- [x] flushUpdates() implementation analyzed (lines 534-584)
- [x] Atomic write pattern documented (session-utils.ts lines 93-111)
- [x] writeTasksJSON() using atomic write documented (lines 266-290)
- [x] Existing integration test patterns analyzed
- [x] Vitest vi.mock patterns for fs operations researched
- [x] Concurrent testing patterns for serialization researched
- [x] Atomic file write patterns researched
- [x] Scope boundaries defined (extend existing integration tests)

---

### Documentation & References

```yaml
# MUST READ - SessionManager.flushUpdates() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains flushUpdates() method (lines 534-584) with atomic flush logic
  section: Lines 534-584
  critical: |
    - Early return if !#dirty (no pending changes)
    - Calls saveBacklog(#pendingUpdates) which delegates to writeTasksJSON()
    - Resets batching state (#dirty, #pendingUpdates, #updateCount) on success
    - Preserves dirty state on error for retry
    - Logs batch statistics (itemsWritten, writeOpsSaved, efficiency)

# MUST READ - SessionManager.updateItemStatus() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains updateItemStatus() method (lines 632-664) that accumulates updates
  section: Lines 632-664
  pattern: |
    - Uses updateItemStatusUtil() for immutable update
    - Accumulates in #pendingUpdates (memory only)
    - Sets #dirty = true and increments #updateCount
    - Does NOT call saveBacklog() - caller must call flushUpdates()
  critical: |
    - Updates are queued in memory, not written to disk
    - Multiple calls accumulate without triggering writes
    - flushUpdates() must be called to persist changes

# MUST READ - Atomic write pattern implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Contains atomicWrite() function (lines 93-111) with temp file + rename pattern
  section: Lines 93-111
  pattern: |
    - Generate unique temp filename: .target.json.{random}.tmp
    - Write to temp file with mode 0o644
    - Rename temp to target (atomic operation)
    - Cleanup temp file on error
  gotcha: |
    - Temp file and target must be on same filesystem
    - rename() is atomic on POSIX (Linux/macOS)
    - Windows behavior differs (not always atomic)
    - Cleanup unlink() failures are ignored (temp file orphaned)

# MUST READ - writeTasksJSON() using atomic write
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Contains writeTasksJSON() function (lines 266-290) that calls atomicWrite()
  section: Lines 266-290
  pattern: |
    - Validate backlog with Zod schema (BacklogSchema.parse)
    - Serialize to JSON with 2-space indentation
    - Call atomicWrite(tasksPath, content) for persistence
  gotcha: |
    - Zod validation happens before atomic write
    - JSON.stringify with null, 2 for pretty formatting
    - atomicWrite() handles the temp file + rename

# MUST READ - Existing integration test file
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: This is the file to EXTEND with atomic flush tests
  section: Full file (708 lines)
  pattern: |
    - describe('SessionManager.initialize()' for new sessions (lines 95-390)
    - describe('SessionManager.loadSession()' for existing sessions (lines 396-707)
    - ADD: describe('SessionManager Atomic Update Flushing' for flush tests
    - Use same temp directory setup/teardown pattern
  gotcha: |
    - File already has new session and existing session tests
    - We EXTEND it with new describe() block for atomic flush
    - Don't modify existing tests
    - Temp directory pattern: mkdtempSync(join(tmpdir(), 'session-manager-test-'))

# MUST READ - Previous PRP for delta session detection
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S3/PRP.md
  why: Contains integration test patterns for delta detection (complementary)
  section: Implementation Patterns & Key Details
  pattern: |
    - SETUP/EXECUTE/VERIFY comment structure
    - Temp directory isolation with unique names
    - afterEach() cleanup with rmSync(recursive: true, force: true)
  critical: |
    - THIS is the pattern to follow for integration tests
    - Real filesystem operations (not mocked) for flush tests
    - Use vi.mock() only for failure simulation tests

# MUST READ - Research: Vitest vi.mock patterns for fs
- docfile: plan/002_1e734971e481/P2M1T2S1/research/vitest-fs-mock.md
  why: Comprehensive patterns for mocking fs operations in Vitest
  section: Full document
  pattern: |
    - Mock node:fs/promises at module level (before imports)
    - Mock writeFileSync, rename, unlink for atomic write testing
    - Simulate failures (ENOSPC, EACCES, EROFS) with error codes
    - Type casting mocks with "as any" for Vitest
  gotcha: |
    - Module-level mocks must be before imports (hoisting)
    - Use vi.clearAllMocks() in beforeEach() for test isolation
    - Partial mocks with vi.importActual() for real fs + specific mocks

# MUST READ - Research: Atomic file write patterns
- docfile: plan/002_1e734971e481/P2M1T2S1/research/atomic-write-patterns.md
  why: Deep understanding of atomic write guarantees and failure scenarios
  section: Full document
  pattern: |
    - Temp file + rename pattern for atomicity
    - rename() is atomic on POSIX systems
    - Failure scenarios: process crash, disk full, power loss
  critical: |
    - Standard fs.writeFile() is NOT atomic
    - Atomicity comes from rename(), not writeFile()
    - Same filesystem requirement for rename()
    - Windows has different behavior (not always atomic)

# MUST READ - Research: Concurrent testing patterns
- docfile: plan/002_1e734971e481/P2M1T2S1/research/concurrent-testing.md
  why: Testing patterns for serializing concurrent async operations
  section: Full document
  pattern: |
    - Promise.all() for concurrent execution
    - Execution order tracking with arrays
    - Serial queue implementation for testing
    - Lock-based serialization verification
  gotcha: |
    - Track execution order, not timing (non-deterministic)
    - Use delays to make races more likely
    - Verify no overlapping execution with state flags

# MUST READ - Minimal tasks.json fixture helper
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: Contains createMinimalTasksJson() helper function (lines 47-89)
  section: Lines 47-89
  pattern: |
    - Returns Backlog with 1 Phase, 1 Milestone, 1 Task, 1 Subtask
    - Use this for creating initial tasks.json
    - Modify status values for testing update scenarios
  gotcha: |
    - All items start with status: 'Planned'
    - Subtask has context_scope with CONTRACT DEFINITION
    - Zod schema validates this structure

# MUST READ - Task Orchestrator flush usage
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Shows real-world usage of flushUpdates() in production
  section: Lines 723, 745
  pattern: |
    - Called after subtask completes (success or failure)
    - Still flushes on error to preserve failure state
    - Part of try/catch block for error handling
  critical: |
    - Production code flushes after each item completion
    - Tests should verify this pattern works correctly
    - Error preservation is important for retry logic
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts              # SOURCE: flushUpdates() (534-584)
│   │   │                                   # SOURCE: updateItemStatus() (632-664)
│   │   │                                   # SOURCE: #dirty, #pendingUpdates, #updateCount (110-116)
│   │   ├── session-utils.ts                # SOURCE: atomicWrite() (93-111)
│   │   │                                   # SOURCE: writeTasksJSON() (266-290)
│   │   └── models.ts                       # REFERENCE: Backlog, Status types
│   ├── utils/
│   │   ├── task-utils.ts                   # REFERENCE: updateItemStatusUtil()
│   │   └── logger.ts                       # REFERENCE: Logger for batch stats
│   └── core/
│       └── task-orchestrator.ts            # REFERENCE: Production flush usage (723, 745)
├── tests/
│   ├── setup.ts                            # Global test setup
│   ├── unit/
│   │   └── core/
│   │       ├── session-manager.test.ts     # EXISTING: Unit tests with mocks
│   │       └── session-utils.test.ts       # EXISTING: Atomic write unit tests
│   ├── fixtures/
│   │   └── (various PRD fixtures)          # REFERENCE: For test data
│   └── integration/
│       └── core/
│           └── session-manager.test.ts    # EXTEND: Add atomic flush tests here
├── plan/
│   └── 002_1e734971e481/
│       ├── P2M1T1S1/
│       │   └── PRP.md                     # REFERENCE: New session creation tests
│       ├── P2M1T1S2/
│       │   └── PRP.md                     # REFERENCE: Existing session loading tests
│       ├── P2M1T1S3/
│       │   └── PRP.md                     # REFERENCE: Delta session detection tests
│       ├── P2M1T2S1/
│       │   ├── PRP.md                     # NEW: This PRP
│       │   └── research/                  # NEW: Research documentation
│       │       ├── vitest-fs-mock.md
│       │       ├── atomic-write-patterns.md
│       │       └── concurrent-testing.md
│       └── tasks.json                     # REFERENCE: Sample tasks.json
├── vitest.config.ts                       # Vitest configuration
└── package.json                            # Test scripts
```

---

### Desired Codebase Tree (modifications to existing files)

```bash
hacky-hack/
└── tests/
    └── integration/
        └── core/
            └── session-manager.test.ts    # EXTEND: Add new describe() block
                                                    # ADD: describe('SessionManager Atomic Update Flushing', () => { ... })
                                                    # ADD: Tests for batch accumulation
                                                    # ADD: Tests for atomic flush
                                                    # ADD: Tests for write failure handling
                                                    # ADD: Tests for concurrent flush serialization
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Batch Updates Use In-Memory Accumulation
// updateItemStatus() does NOT write to disk immediately
// Updates are accumulated in #pendingUpdates (Backlog object)
// Must call flushUpdates() to persist changes
// Pattern: updateItemStatus() x N -> flushUpdates() -> 1 disk write

// CRITICAL: Atomic Write Uses Temp File + Rename Pattern
// atomicWrite() creates .{filename}.{random}.tmp file first
// Writes content to temp file (can fail safely)
// Renames temp to target (atomic operation on POSIX)
// If rename fails, temp file cleaned up with unlink()

// GOTCHA: rename() Atomicity Depends on Filesystem
// POSIX (Linux/macOS): rename() is atomic on same filesystem
// Windows: NOT atomic when overwriting (delete+rename workaround)
// Network filesystems (NFS/SMB): NOT guaranteed
// Cross-device rename: Fails with EXDEV error

// CRITICAL: Dirty State Preserved on Error
// If saveBacklog() throws, #dirty remains true
// #pendingUpdates remains intact (not nullified)
// #updateCount preserved for retry
// Caller can call flushUpdates() again after fixing error

// GOTCHA: Multiple Concurrent flushUpdates() Calls
// Current implementation has no explicit serialization
// Multiple concurrent calls could cause race conditions
// Tests should verify serial execution (or detect races)
// Consider using mutex/queue if serialization needed

// CRITICAL: flushUpdates() Returns Early if Not Dirty
// If #dirty === false, returns immediately (no-op)
// If #dirty === true but #pendingUpdates === null, warns and returns
// Early return behavior must be tested
// Batch statistics only logged when actual write occurs

// GOTCHA: Integration Tests Use Real Filesystem (Not Mocks)
// Most tests use real temp directories with real fs operations
 vi.mock() only used for failure simulation tests
// Don't mock fs for normal operation tests
// Use mkdtempSync() for unique temp directories
// Cleanup with rmSync(recursive: true, force: true)

// CRITICAL: File Integrity Verification with JSON.parse()
// After successful flush, verify tasks.json is valid JSON
// Read file and parse to ensure no corruption
// This confirms atomic write worked correctly
// Critical for production data integrity

// GOTCHA: Zod Validation Happens Before Atomic Write
// writeTasksJSON() validates with BacklogSchema.parse()
// Invalid backlog throws before write attempt
// Temp file only created for valid JSON
// Validation errors don't corrupt existing file

// CRITICAL: Batch Statistics Logged Only on Success
// itemsWritten: number of items in batch
// writeOpsSaved: max(0, itemsWritten - 1)
// efficiency: percentage of write ops saved
// Statistics logged after successful write
// Not logged if error occurs (dirty state preserved)

// GOTCHA: Temp File Naming Pattern
// Format: .{basename}.{random-16-hex-chars}.tmp
// Example: .tasks.json.a1b2c3d4e5f6g7h8.tmp
// Random bytes prevent filename collisions
// Temp file in same directory as target (same filesystem)
// Leading dot makes temp file hidden on Unix

// CRITICAL: Cleanup on Error Ignores Unlink Failures
// If unlink(tempPath) fails in catch block, error ignored
// Orphaned .tmp files possible (harmless but clutter)
// Try/catch around unlink prevents masking original error
// Temp file cleanup is best-effort, not guaranteed

// GOTCHA: SessionManager Must Be Initialized Before Updates
// updateItemStatus() throws if #currentSession === null
// Must call initialize() or loadSession() first
// Tests must create session before testing updates
// Session must have valid taskRegistry

// CRITICAL: Multiple Sequential Flush Cycles
// Can update -> flush -> update -> flush repeatedly
// Each cycle resets batching state (#dirty, #pendingUpdates, #updateCount)
#dirty = false after successful flush
// Next update starts new batch cycle

// GOTCHA: Task Orchestrator Calls flushUpdates() After Each Item
// Production usage flushes after each subtask completion
// Flushes on both success and failure (preserves state)
// Tests should verify this real-world pattern
// Batch accumulation typically happens during item execution
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing batch update behavior with real filesystem operations and mocked fs operations for failure simulation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY tests/integration/core/session-manager.test.ts exists
  - CHECK: File exists (created by P2.M1.T1.S1 and extended by P2.M1.T1.S2, P2.M1.T1.S3)
  - READ: Existing test file to understand structure
  - IDENTIFY: Where to add new describe() block (after loadSession tests)
  - DEPENDENCIES: P2.M1.T1.S1, P2.M1.T1.S2, P2.M1.T1.S3 completion
  - PLACEMENT: tests/integration/core/session-manager.test.ts

Task 2: READ SessionManager batch update implementation
  - FILE: src/core/session-manager.ts
  - READ: Lines 110-116 (#dirty, #pendingUpdates, #updateCount)
  - READ: Lines 534-584 (flushUpdates method)
  - READ: Lines 632-664 (updateItemStatus method)
  - FILE: src/core/session-utils.ts
  - READ: Lines 93-111 (atomicWrite function)
  - READ: Lines 266-290 (writeTasksJSON function)
  - UNDERSTAND: Batch accumulation and flush flow
  - UNDERSTAND: Atomic write pattern (temp file + rename)
  - DEPENDENCIES: None

Task 3: CREATE describe() block for atomic flush tests
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: describe('SessionManager Atomic Update Flushing', () => { ... })
  - ADD: beforeEach() to create unique temp directory
  - ADD: afterEach() to cleanup temp directory
  - PATTERN: Follow existing describe() block structure
  - DEPENDENCIES: Task 2

Task 4: IMPLEMENT Test 1 - Multiple updates accumulated in memory
  - CREATE: it('should accumulate multiple updates in memory', async () => { ... })
  - SETUP: Create session with initial tasks.json
  - EXECUTE: Call updateItemStatus() 3 times on different items
  - VERIFY: tasks.json not modified (still original content)
  - VERIFY: Session state updated (in-memory only)
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 3

Task 5: IMPLEMENT Test 2 - Updates not written until flush
  - CREATE: it('should not write updates until flush is called', async () => { ... })
  - SETUP: Create session with initial tasks.json
  - EXECUTE: Call updateItemStatus() without flush
  - VERIFY: Read tasks.json from disk, verify unchanged
  - VERIFY: Session state shows new status (in-memory)
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 3 - flush writes all updates atomically
  - CREATE: it('should write all accumulated updates on flush', async () => { ... })
  - SETUP: Create session, call updateItemStatus() 3 times
  - EXECUTE: Call flushUpdates()
  - VERIFY: Read tasks.json, all 3 updates persisted
  - VERIFY: File is valid JSON (JSON.parse())
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 4 - Atomic write uses temp file + rename
  - CREATE: it('should use temp file + rename for atomic write', async () => { ... })
  - SETUP: Mock fs.promises.writeFile and fs.promises.rename
  - EXECUTE: Call updateItemStatus() then flushUpdates()
  - VERIFY: writeFile called with temp path pattern (.*.tmp)
  - VERIFY: rename called with (tempPath, tasks.json)
  - VERIFY: rename called after writeFile (correct order)
  - GOTCHA: Use vi.mock() at module level for this test
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 5 - Write failure leaves original file intact
  - CREATE: it('should leave original file intact on write failure', async () => { ... })
  - SETUP: Mock writeFile to throw ENOSPC error
  - SETUP: Create session with existing tasks.json
  - EXECUTE: Call updateItemStatus() then flushUpdates()
  - VERIFY: flushUpdates() throws error
  - VERIFY: Original tasks.json unchanged (read file content)
  - VERIFY: Dirty state preserved (can retry)
  - GOTCHA: Mock rejection, not throw
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 6 - Concurrent flush calls are serialized
  - CREATE: it('should serialize concurrent flush calls', async () => { ... })
  - SETUP: Create session with tasks.json
  - SETUP: Track execution order with array
  - EXECUTE: Launch 20 concurrent flushUpdates() calls with Promise.all()
  - VERIFY: No overlapping execution (use state flag)
  - VERIFY: All flushes complete successfully
  - VERIFY: File integrity maintained (JSON.parse())
  - PATTERN: Use execution order tracking, not timing
  - DEPENDENCIES: Task 8

Task 10: IMPLEMENT Test 7 - Dirty state preserved on error
  - CREATE: it('should preserve dirty state on flush error', async () => { ... })
  - SETUP: Mock writeTasksJSON to throw error
  - SETUP: Call updateItemStatus() to set dirty flag
  - EXECUTE: Call flushUpdates() (throws error)
  - VERIFY: Error caught and re-thrown
  - VERIFY: Can call flushUpdates() again (dirty still true)
  - GOTCHA: Test retry capability
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 8 - File integrity verified after flush
  - CREATE: it('should maintain file integrity after flush', async () => { ... })
  - SETUP: Create session, accumulate updates
  - EXECUTE: Call flushUpdates()
  - VERIFY: Read tasks.json from disk
  - VERIFY: JSON.parse() succeeds (no SyntaxError)
  - VERIFY: All items have correct status values
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 9 - Batch statistics logged correctly
  - CREATE: it('should log batch statistics correctly', async () => { ... })
  - SETUP: Create session, mock logger
  - EXECUTE: Call updateItemStatus() 5 times, then flushUpdates()
  - VERIFY: Logger called with itemsWritten: 5
  - VERIFY: Logger called with writeOpsSaved: 4
  - VERIFY: Efficiency calculated correctly (80%)
  - GOTCHA: Spy on logger, don't mock fs
  - DEPENDENCIES: Task 11

Task 13: IMPLEMENT Test 10 - Multiple sequential flush cycles
  - CREATE: it('should handle multiple sequential flush cycles', async () => { ... })
  - SETUP: Create session
  - EXECUTE: Cycle 1: update -> flush -> verify
  - EXECUTE: Cycle 2: update -> flush -> verify
  - EXECUTE: Cycle 3: update -> flush -> verify
  - VERIFY: Each cycle independently successful
  - VERIFY: Batching state reset between cycles
  - DEPENDENCIES: Task 12

Task 14: IMPLEMENT vi.mock() setup for fs operations
  - FILE: tests/integration/core/session-manager.test.ts (before imports)
  - ADD: vi.mock('node:fs/promises') for failure simulation tests
  - ADD: Mock implementations for writeFile, rename, unlink
  - ADD: vi.clearAllMocks() in beforeEach for test isolation
  - PATTERN: Module-level mock before imports (hoisting)
  - DEPENDENCIES: Task 13

Task 15: RUN tests and verify all pass
  - RUN: npm test -- tests/integration/core/session-manager.test.ts
  - VERIFY: All atomic flush tests pass
  - VERIFY: No side effects on actual plan/ directory
  - VERIFY: Temp directories cleaned up
  - FIX: Any failing tests
  - DEPENDENCIES: Task 14

Task 16: RUN typecheck and verify compilation
  - RUN: npm run typecheck
  - VERIFY: No TypeScript compilation errors
  - DEPENDENCIES: Task 15
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Batch Update Accumulation Testing
// =============================================================================

describe('SessionManager Atomic Update Flushing', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-flush-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Create PRD file with valid content
    const prdContent = `# Test PRD

## Executive Summary

Comprehensive test PRD for atomic flush testing.

## Functional Requirements

The system shall correctly batch and flush updates atomically.
`;
    writeFileSync(prdPath, prdContent, 'utf-8');
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - Multiple Updates Accumulated in Memory
  // =============================================================================

  it('should accumulate multiple updates in memory', async () => {
    // SETUP: Create session with initial tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMinimalTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // Get original file content
    const originalContent = readFileSync(tasksPath, 'utf-8');

    // EXECUTE: Call updateItemStatus() 3 times (no flush yet)
    await manager.updateItemStatus('P1.M1.T1.S1', 'InProgress');
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    await manager.updateItemStatus('P1.M1.T1.S1', 'Failed');

    // VERIFY: File not modified (still original content)
    const currentContent = readFileSync(tasksPath, 'utf-8');
    expect(currentContent).toBe(originalContent);

    // VERIFY: In-memory state changed
    const session = manager.currentSession!;
    const subtask =
      session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0];
    expect(subtask.status).toBe('Failed');
  });

  // =============================================================================
  // PATTERN: Test 2 - Updates Not Written Until Flush
  // =============================================================================

  it('should not write updates until flush is called', async () => {
    // SETUP: Create session with tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMinimalTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // EXECUTE: Update status without flushing
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

    // VERIFY: File on disk unchanged
    const fileContent = readFileSync(tasksPath, 'utf-8');
    const fileData = JSON.parse(fileContent) as Backlog;
    const fileStatus =
      fileData.backlog[0].milestones[0].tasks[0].subtasks[0].status;
    expect(fileStatus).toBe('Planned'); // Original status

    // VERIFY: In-memory state updated
    const session = manager.currentSession!;
    const memStatus =
      session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0].status;
    expect(memStatus).toBe('Complete');
  });

  // =============================================================================
  // PATTERN: Test 3 - Flush Writes All Updates Atomically
  // =============================================================================

  it('should write all accumulated updates on flush', async () => {
    // SETUP: Create session and accumulate updates
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMinimalTasksJson();

    // Add more subtasks for multi-update testing
    initialTasks.backlog[0].milestones[0].tasks[0].subtasks.push(
      {
        type: 'Subtask',
        id: 'P1.M1.T1.S2',
        title: 'Test Subtask 2',
        status: 'Planned',
        story_points: 1,
        dependencies: [],
        context_scope: 'CONTRACT DEFINITION:\n1. Test',
      },
      {
        type: 'Subtask',
        id: 'P1.M1.T1.S3',
        title: 'Test Subtask 3',
        status: 'Planned',
        story_points: 1,
        dependencies: [],
        context_scope: 'CONTRACT DEFINITION:\n1. Test',
      }
    );
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // EXECUTE: Update 3 subtasks then flush
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
    await manager.updateItemStatus('P1.M1.T1.S3', 'Complete');
    await manager.flushUpdates();

    // VERIFY: All updates persisted to disk
    const fileContent = readFileSync(tasksPath, 'utf-8');
    const fileData = JSON.parse(fileContent) as Backlog;
    const subtasks = fileData.backlog[0].milestones[0].tasks[0].subtasks;

    expect(subtasks[0].status).toBe('Complete');
    expect(subtasks[1].status).toBe('Complete');
    expect(subtasks[2].status).toBe('Complete');

    // VERIFY: File is valid JSON
    expect(() => JSON.parse(fileContent)).not.toThrow();
  });

  // =============================================================================
  // PATTERN: Test 4 - Atomic Write Uses Temp File + Rename (with vi.mock)
  // =============================================================================

  // Module-level mock (must be before imports in actual file)
  vi.mock('node:fs/promises', () => ({
    writeFile: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
    readFile: vi.fn(),
  }));

  it('should use temp file + rename for atomic write', async () => {
    // SETUP: Configure mocks
    const mockWriteFile = writeFile as any;
    const mockRename = rename as any;
    const mockUnlink = unlink as any;

    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);

    // SETUP: Create session (use real filesystem for session setup)
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // EXECUTE: Update and flush
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
    await manager.flushUpdates();

    // VERIFY: writeFile called with temp path pattern
    expect(mockWriteFile).toHaveBeenCalled();
    const writeCall = mockWriteFile.mock.calls[0];
    const tempPath = writeCall[0];
    expect(tempPath).toMatch(/\.tasks\.json\.[a-f0-9]{16}\.tmp$/);

    // VERIFY: rename called with (tempPath, tasks.json)
    expect(mockRename).toHaveBeenCalled();
    const renameCall = mockRename.mock.calls[0];
    expect(renameCall[0]).toBe(tempPath);
    expect(renameCall[1]).toContain('tasks.json');

    // VERIFY: rename called after writeFile (correct order)
    const writeIndex = mockWriteFile.mock.invocationCallOrder[0];
    const renameIndex = mockRename.mock.invocationCallOrder[0];
    expect(renameIndex).toBeGreaterThan(writeIndex);
  });

  // =============================================================================
  // PATTERN: Test 5 - Write Failure Leaves Original File Intact
  // =============================================================================

  it('should leave original file intact on write failure', async () => {
    // SETUP: Mock writeFile to throw ENOSPC error
    const mockWriteFile = writeFile as any;
    const error = new Error(
      'ENOSPC: No space left on device'
    ) as NodeJS.ErrnoException;
    error.code = 'ENOSPC';
    mockWriteFile.mockRejectedValue(error);

    // SETUP: Create session with existing tasks.json
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMinimalTasksJson();
    const originalContent = JSON.stringify(initialTasks, null, 2);
    writeFileSync(tasksPath, originalContent, 'utf-8');

    // EXECUTE: Try to flush (should throw)
    await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

    await expect(async () => {
      await manager.flushUpdates();
    }).rejects.toThrow();

    // VERIFY: Original file unchanged
    const currentContent = readFileSync(tasksPath, 'utf-8');
    expect(currentContent).toBe(originalContent);
  });

  // =============================================================================
  // PATTERN: Test 6 - Concurrent Flush Calls Are Serialized
  // =============================================================================

  it('should serialize concurrent flush calls', async () => {
    // SETUP: Create session
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    const sessionPath = join(planDir, manager.currentSession!.metadata.id);
    const tasksPath = join(sessionPath, 'tasks.json');
    const initialTasks = createMinimalTasksJson();
    writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2), 'utf-8');

    // SETUP: Track execution order
    const executionOrder: string[] = [];
    let isInFlush = false;

    // Wrap flushUpdates to track execution
    const originalFlush = manager.flushUpdates.bind(manager);
    const trackedFlush = async () => {
      executionOrder.push('flush-start');
      expect(isInFlush).toBe(false); // No concurrent flush
      isInFlush = true;
      await originalFlush();
      isInFlush = false;
      executionOrder.push('flush-end');
    };

    // EXECUTE: Launch 20 concurrent flush calls
    const flushPromises = Array.from({ length: 20 }, () =>
      manager.updateItemStatus('P1.M1.T1.S1', 'Complete').then(trackedFlush)
    );

    await Promise.all(flushPromises);

    // VERIFY: No overlapping execution
    // Each 'start' must have matching 'end' before next 'start'
    let inFlush = false;
    for (const entry of executionOrder) {
      if (entry === 'flush-start') {
        expect(inFlush).toBe(false);
        inFlush = true;
      } else if (entry === 'flush-end') {
        expect(inFlush).toBe(true);
        inFlush = false;
      }
    }

    // VERIFY: File integrity maintained
    const fileContent = readFileSync(tasksPath, 'utf-8');
    expect(() => JSON.parse(fileContent)).not.toThrow();
  });

  // Additional tests follow similar patterns...
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING UNIT TESTS:
  - tests/unit/core/session-manager.test.ts has flush tests (mocked)
  - Pattern: Mock-based testing for isolation
  - This PRP: Complements with real filesystem integration tests

INPUT FROM P2.M1.T1.S1 (NEW SESSION CREATION):
  - tests/integration/core/session-manager.test.ts created
  - Pattern: Temp directory setup, describe/it structure
  - This PRP: EXTENDS with atomic flush tests

INPUT FROM P2.M1.T1.S2 (EXISTING SESSION LOADING):
  - tests/integration/core/session-manager.test.ts extended
  - Pattern: Real filesystem operations, SETUP/EXECUTE/VERIFY
  - This PRP: Uses same patterns for flush testing

INPUT FROM P2.M1.T1.S3 (DELTA SESSION DETECTION):
  - Delta session tests validate PRD hash changes
  - This PRP: Tests batch updates (independent feature)
  - Both use real temp directories and cleanup

INPUT FROM SESSIONMANAGER FLUSH IMPLEMENTATION:
  - src/core/session-manager.ts has flushUpdates() (534-584)
  - Pattern: In-memory accumulation, atomic write, error handling
  - This PRP: Tests validate actual behavior

INPUT FROM ATOMIC WRITE IMPLEMENTATION:
  - src/core/session-utils.ts has atomicWrite() (93-111)
  - Pattern: Temp file + rename for atomicity
  - This PRP: Tests verify atomic behavior

OUTPUT FOR SUBSEQUENT WORK:
  - Integration tests for atomic batch update flushing
  - Confidence that JSON corruption is prevented
  - Foundation for P2.M1.T2.S2 (task status update propagation)
  - Foundation for P2.M1.T2.S3 (session discovery methods)
  - Pattern for testing atomic operations

DIRECTORY STRUCTURE:
  - Extend: tests/integration/core/session-manager.test.ts
  - Add: New describe() block for atomic flush tests
  - Add: vi.mock() setup for fs operations (module level)
  - No modifications to existing tests
  - Tests can run independently

CLEANUP INTEGRATION:
  - Temp directories cleaned up in afterEach()
  - No side effects on actual plan/ directory
  - Mock state reset in beforeEach() for isolation
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After extending session-manager.test.ts
# Run tests to check for errors
npm test -- tests/integration/core/session-manager.test.ts

# Expected: Tests run without syntax errors
# Expected: New test descriptions appear in output

# TypeScript compilation check
npm run typecheck

# Expected: No TypeScript compilation errors
# Expected: New test code compiles correctly

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the extended integration test file
npm test -- tests/integration/core/session-manager.test.ts

# Expected: All tests pass (including new atomic flush tests)
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run all integration tests
npm test -- tests/integration/

# Expected: All integration tests pass
# Expected: No regressions in other integration test files

# Coverage validation
npm run test:coverage

# Expected: Coverage for SessionManager flush increases
# Expected: New flush code paths covered
# Expected: No uncovered lines in flushUpdates logic

# If tests fail, check:
# - vi.mock() setup at module level (before imports)
# - Temp directory cleanup works
# - Mock functions properly configured
# - File paths are correct (use resolve() for absolute paths)
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite run
npm test

# Expected: All tests pass across entire codebase
# Expected: No new test failures
# Expected: Unit tests still pass (no regressions)

# Verify no side effects on actual plan/ directory
ls -la plan/

# Expected: Only expected session directories exist
# Expected: No test artifacts in production plan/

# Verify temp directory cleanup
ls -la /tmp/ | grep session-manager-flush-test

# Expected: No leftover temp directories (all cleaned up)

# Manual verification: Read test output
npm test -- tests/integration/core/session-manager.test.ts --reporter=verbose

# Expected: Clear test names showing atomic flush scenarios
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/integration/core/session-manager.test.ts

# Expected: Tests complete in reasonable time (< 30 seconds)
```

### Level 4: Real-World Validation (Scenario Testing)

```bash
# Scenario 1: Batch update accumulation verification
cat > /tmp/test-batch.sh << 'EOF'
#!/bin/bash
set -e

TEMP_DIR=$(mktemp -d)
PRD_PATH="$TEMP_DIR/PRD.md"
PLAN_DIR="$TEMP_DIR/plan"

# Create PRD
cat > "$PRD_PATH" << 'PRD'
# Test Project

## P1: Test Phase

A minimal project for testing batch updates.

### P1.M1: Test Milestone

#### P1.M1.T1: Create Function

Create a test function.
PRD

# Initialize session
node -e "
import { SessionManager } from './src/core/session-manager.js';
const manager = new SessionManager('$PRD_PATH', '$PLAN_DIR');
await manager.initialize();
console.log('Session initialized');

// Create initial tasks.json
import { writeFileSync, join } from 'node:fs';
const sessionPath = join('$PLAN_DIR', manager.currentSession.metadata.id);
const tasksPath = join(sessionPath, 'tasks.json');
const tasks = {
  backlog: [{
    type: 'Phase',
    id: 'P1',
    title: 'Test',
    status: 'Planned',
    description: 'Test',
    milestones: [{
      type: 'Milestone',
      id: 'P1.M1',
      title: 'Test',
      status: 'Planned',
      description: 'Test',
      tasks: [{
        type: 'Task',
        id: 'P1.M1.T1',
        title: 'Test',
        status: 'Planned',
        description: 'Test',
        subtasks: [{
          type: 'Subtask',
          id: 'P1.M1.T1.S1',
          title: 'Test',
          status: 'Planned',
          story_points: 1,
          dependencies: [],
          context_scope: 'Test'
        }]
      }]
    }]
  }]
};
writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));

// Update 3 times without flush
await manager.updateItemStatus('P1.M1.T1.S1', 'InProgress');
await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
await manager.updateItemStatus('P1.M1.T1.S1', 'Failed');

// Read file before flush
import { readFileSync } from 'node:fs';
const beforeFlush = readFileSync(tasksPath, 'utf-8');
const beforeData = JSON.parse(beforeFlush);
console.log('Before flush - S1 status:', beforeData.backlog[0].milestones[0].tasks[0].subtasks[0].status);

// Now flush
await manager.flushUpdates();
console.log('Flushed');

// Read file after flush
const afterFlush = readFileSync(tasksPath, 'utf-8');
const afterData = JSON.parse(afterFlush);
console.log('After flush - S1 status:', afterData.backlog[0].milestones[0].tasks[0].subtasks[0].status);
"

# Cleanup
rm -rf "$TEMP_DIR"
EOF

chmod +x /tmp/test-batch.sh
/tmp/test-batch.sh

# Expected: Before flush shows 'Planned', After flush shows 'Failed'
# Expected: No errors thrown

# Scenario 2: Concurrent flush safety
node -e "
import { SessionManager } from './src/core/session-manager.js';
import { mkdtempSync, rmSync, writeFileSync, join } from 'node:fs';
import { tmpdir } from 'node:os';

const tempDir = mkdtempSync(join(tmpdir(), 'concurrent-test-'));
const planDir = join(tempDir, 'plan');
const prdPath = join(tempDir, 'PRD.md');

// Create minimal PRD
writeFileSync(prdPath, '# Test\\n\\n' + 'Test content. '.repeat(10));

const manager = new SessionManager(prdPath, planDir);
await manager.initialize();

// Create tasks.json
const sessionPath = join(planDir, manager.currentSession.metadata.id);
const tasksPath = join(sessionPath, 'tasks.json');
writeFileSync(tasksPath, JSON.stringify({ backlog: [] }), 'utf-8');

// Launch 50 concurrent updates + flush
const promises = Array.from({ length: 50 }, async (_, i) => {
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
  await manager.flushUpdates();
});

await Promise.all(promises);

// Verify file integrity
import { readFileSync } from 'node:fs';
const content = readFileSync(tasksPath, 'utf-8');
JSON.parse(content); // Should not throw
console.log('Concurrent flushes completed successfully');

// Cleanup
rmSync(tempDir, { recursive: true, force: true });
"

# Expected: All flushes complete without error
# Expected: File is valid JSON

# Scenario 3: Write failure recovery
# (Requires mock framework, use unit tests for this)
npm test -- --testNamePattern="write failure"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Multiple updates accumulated in memory
- [ ] Test 2: Updates not written until flush is called
- [ ] Test 3: flush writes all accumulated updates atomically
- [ ] Test 4: Atomic write uses temp file + rename pattern
- [ ] Test 5: Write failure leaves original file intact
- [ ] Test 6: Concurrent flush calls are serialized
- [ ] Test 7: Dirty state preserved on error for retry
- [ ] Test 8: File integrity verified with JSON.parse() after flush
- [ ] Test 9: Batch statistics logged correctly
- [ ] Test 10: Multiple sequential flush cycles work correctly
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No side effects on production plan/ directory
- [ ] Temp directories cleaned up after tests

### Feature Validation

- [ ] Batch updates accumulate in memory (#pendingUpdates, #dirty, #updateCount)
- [ ] Updates not written until flushUpdates() is called
- [ ] flushUpdates() writes all accumulated updates in single operation
- [ ] Atomic write pattern (temp file + rename) prevents corruption
- [ ] Write failures leave original tasks.json intact
- [ ] Concurrent flush calls execute serially (no race conditions)
- [ ] Dirty state preserved on error for retry capability
- [ ] File integrity maintained (JSON.parse() succeeds)
- [ ] Batch statistics logged (itemsWritten, writeOpsSaved, efficiency)
- [ ] Multiple flush cycles work independently

### Code Quality Validation

- [ ] Follows existing integration test patterns
- [ ] Uses SETUP/EXECUTE/VERIFY comment structure
- [ ] Uses describe/it block structure
- [ ] Tests are self-documenting with clear names
- [ ] Temp directories isolated per test
- [ ] Cleanup in afterEach() with force: true
- [ ] Error messages are clear and informative
- [ ] Tests are grouped in logical describe blocks
- [ ] Uses .js extensions for ESM imports
- [ ] No side effects on production code
- [ ] vi.mock() at module level for fs operations
- [ ] Mock state reset in beforeEach()

### Documentation & Deployment

- [ ] Tests serve as executable documentation of batch updates
- [ ] Atomic write pattern validated with real filesystem
- [ ] Concurrent flush safety demonstrated
- [ ] Error handling and recovery validated
- [ ] Integration with P2.M1.T1.S1, P2.M1.T1.S2, P2.M1.T1.S3 clear
- [ ] Foundation for P2.M1.T2.S2 (task status update propagation)
- [ ] Foundation for P2.M1.T2.S3 (session discovery methods)

---

## Anti-Patterns to Avoid

- **Don't mock fs for normal operation tests** - Use real filesystem for integration tests
- **Don't skip temp directory cleanup** - Must use afterEach() with rmSync()
- **Don't use global state** - Each test must use unique temp directory
- **Don't forget .js extensions** - ESM requires .js on all imports
- **Don't test new session creation** - That's P2.M1.T1.S1
- **Don't test existing session loading** - That's P2.M1.T1.S2
- **Don't test delta session detection** - That's P2.M1.T1.S3
- **Don't modify SessionManager code** - This is validation only, no implementation changes
- **Don't hardcode temp directory paths** - Use mkdtempSync() for uniqueness
- **Don't ignore error handling** - Test write failures and error recovery
- **Don't assume atomicity without verification** - Use vi.mock() to verify temp+rename
- **Don't test concurrent operations with timing** - Use execution order tracking
- **Don't skip JSON validation** - Always verify file integrity with JSON.parse()
- **Don't forget dirty state preservation** - Test error recovery and retry
- **Don't mock at function level** - Use module-level vi.mock() for fs operations
- **Don't create overly complex test data** - Use createMinimalTasksJson() helper

---

## Appendix: Decision Rationale

### Why test atomic flush with integration tests instead of unit tests?

Unit tests use mocks and test the logic in isolation. Integration tests:

1. Validate actual atomic write behavior with real filesystem
2. Test temp file creation and rename operations
3. Verify file integrity with JSON.parse()
4. Catch filesystem-specific bugs (permissions, encoding, path resolution)
5. Test the complete workflow from update to flush to persistence

### Why use both real filesystem and vi.mock()?

Different tests require different approaches:

- **Real filesystem**: Verify actual atomic behavior, file integrity, temp directory cleanup
- **vi.mock()**: Simulate write failures (ENOSPC), verify temp+rename pattern, test error handling

Both approaches are needed for comprehensive coverage.

### Why test concurrent flush serialization?

In production, multiple async operations might trigger flush concurrently:

1. Task Orchestrator flushes after each subtask
2. Multiple subtasks could complete simultaneously
3. Concurrent flushes could cause race conditions
4. Tests verify serialization or detect races

### What about the #dirty flag and early returns?

The flushUpdates() method has early return logic:

- Returns immediately if #dirty === false (no pending changes)
- Returns with warning if #dirty === true but #pendingUpdates === null

Tests should verify this behavior works correctly.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from parallel research (3 research tasks + code analysis)
- [x] SessionManager.flushUpdates() fully analyzed with line numbers
- [x] SessionManager.updateItemStatus() implementation documented
- [x] Atomic write pattern (temp file + rename) documented
- [x] writeTasksJSON() using atomic write documented
- [x] Existing integration test patterns analyzed
- [x] Vitest vi.mock patterns for fs operations researched
- [x] Concurrent testing patterns for serialization researched
- [x] Atomic file write patterns researched
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Integration vs unit test distinction clear

**Risk Mitigation**:

- Extending existing test file (low risk of breaking existing tests)
- Integration tests only (no production code changes)
- Temp directory isolation (no side effects on plan/)
- Complements existing unit tests (no duplication)
- Clear acceptance criteria
- Follows established integration test patterns

**Known Risks**:

- **vi.mock() setup complexity**: Module-level mocks require careful placement
  - Mitigation: Follow ESM mocking patterns from research
- **Concurrent execution non-determinism**: Race conditions are hard to reproduce
  - Mitigation: Use execution order tracking, not timing
- **Temp file cleanup**: Orphaned .tmp files possible
  - Mitigation: Use force: true in rmSync() for cleanup
- **Mock state isolation**: Tests might share mock state
  - Mitigation: Use vi.clearAllMocks() in beforeEach()

---

**END OF PRP**
