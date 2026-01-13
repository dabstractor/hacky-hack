# P3.M1.T1.S2: Implement session state persistence

## Goal

**Feature Goal**: Extend the SessionManager class with methods for persisting and loading task state atomically to/from tasks.json, enabling save/load functionality for the PRP Pipeline session state.

**Deliverable**: Five new methods in SessionManager class:

- `async saveBacklog(backlog: Backlog): Promise<void>`
- `async loadBacklog(): Promise<Backlog>`
- `async updateItemStatus(itemId: string, status: Status): Promise<Backlog>`
- `getCurrentItem(): HierarchyItem | null`
- `setCurrentItem(itemId: string): void`

**Success Definition**:

- All methods correctly delegate to session-utils.ts functions
- Atomic writes ensure tasks.json is never corrupted (temp file + rename pattern)
- updateItemStatus() uses immutable update pattern from task-utils
- getCurrentItem() resolves currentItemId from loaded backlog
- Tests pass: `npm run test:run tests/unit/core/session-manager.test.ts`
- No type errors: `npm run type-check`

## Why

**Integration with existing features**: The SessionManager class (P3.M1.T1.S1) provides session initialization and loading, but lacks methods to persist task state changes. The Task Orchestrator (P3.M2.T1) needs these methods to save progress as it executes tasks.

**Problems this solves**:

- Enables the pipeline to save task status changes atomically to tasks.json
- Provides resume capability after interruption by loading persisted backlog
- Maintains tasks.json as the single source of truth (PRD section 5.1)
- Prevents data corruption through atomic write pattern

**User impact**: Developers can interrupt and resume the PRP Pipeline without losing progress. Task state persists across sessions.

## What

Add five persistence methods to SessionManager class that delegate to existing session-utils.ts functions:

### Method Specifications

```typescript
/**
 * Atomically saves backlog to tasks.json
 * @param backlog - Backlog object to persist
 */
async saveBacklog(backlog: Backlog): Promise<void>

/**
 * Loads backlog from tasks.json
 * @returns Validated Backlog object
 */
async loadBacklog(): Promise<Backlog>

/**
 * Updates item status and persists changes atomically
 * @param itemId - Item ID to update (e.g., "P1.M1.T1.S1")
 * @param status - New status value
 * @returns Updated Backlog after save
 */
async updateItemStatus(itemId: string, status: Status): Promise<Backlog>

/**
 * Gets the current item from the backlog
 * @returns HierarchyItem or null if no current item set
 */
getCurrentItem(): HierarchyItem | null

/**
 * Sets the current item ID for tracking execution position
 * @param itemId - Item ID to set as current
 */
setCurrentItem(itemId: string): void
```

### Success Criteria

- [ ] saveBacklog() delegates to writeTasksJSON(currentSession.path, backlog)
- [ ] loadBacklog() delegates to readTasksJSON(currentSession.path)
- [ ] updateItemStatus() uses immutable updateItemStatus from task-utils.ts
- [ ] updateItemStatus() saves updated backlog via saveBacklog()
- [ ] getCurrentItem() resolves currentItemId using findItem() from task-utils.ts
- [ ] setCurrentItem() updates #currentSession.currentItemId (requires internal mutability)
- [ ] All methods throw SessionFileError when currentSession is null
- [ ] All tests pass with 100% coverage of new methods

## All Needed Context

### Context Completeness Check

Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**YES** - This PRP provides:

- Exact file paths and line numbers for all references
- Complete existing code for SessionManager class
- Complete code for session-utils.ts persistence functions
- Complete code for task-utils.ts hierarchy functions
- Existing test patterns with factory functions
- Zod schema validation patterns
- Atomic write implementation details

### Documentation & References

```yaml
# PRIMARY SOURCE - SessionManager class to extend
- file: src/core/session-manager.ts
  why: Contains the SessionManager class skeleton with #currentSession private field
  pattern: Class with async methods, readonly properties, private fields
  gotcha: Uses #currentSession private field that can be mutated internally (line 52)
  key_lines:
    - Line 52: "#currentSession: SessionState | null = null"
    - Line 91-93: "get currentSession(): SessionState | null" getter
    - Line 222: "currentItemId: null" in SessionState initialization

# DEPENDENCY - writeTasksJSON function for atomic persistence
- file: src/core/session-utils.ts
  why: Provides atomic write pattern for tasks.json persistence
  pattern: Temp file + rename with cleanup on error
  function: writeTasksJSON(sessionPath: string, backlog: Backlog): Promise<void>
  key_lines:
    - Line 237-260: Complete writeTasksJSON() implementation
    - Line 92-110: atomicWrite() helper function with temp file pattern

# DEPENDENCY - readTasksJSON function for loading backlog
- file: src/core/session-utils.ts
  why: Provides validated reading of tasks.json with Zod schema
  function: readTasksJSON(sessionPath: string): Promise<Backlog>
  key_lines:
    - Line 283-296: Complete readTasksJSON() implementation
    - Uses BacklogSchema for validation (line 288)

# DEPENDENCY - updateItemStatus for immutable status updates
- file: src/utils/task-utils.ts
  why: Provides pure function for immutable status updates in hierarchy
  pattern: Deep copy with structural sharing, DFS traversal
  function: updateItemStatus(backlog: Backlog, id: string, newStatus: Status): Backlog
  key_lines:
    - Line 261-364: Complete updateItemStatus() implementation
    - Returns new Backlog object (immutable)

# DEPENDENCY - findItem for resolving currentItemId
- file: src/utils/task-utils.ts
  why: Provides DFS search for items by ID in the hierarchy
  function: findItem(backlog: Backlog, id: string): HierarchyItem | null
  key_lines:
    - Line 90-108: Complete findItem() implementation
    - Returns null if item not found

# TYPE DEFINITIONS - All interfaces needed
- file: src/core/models.ts
  why: Contains Backlog, Status, ItemType, HierarchyItem types
  types:
    - Backlog (line 587-599): Root container with backlog: Phase[]
    - Status (line 55-61): 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
    - SessionState (line 762-807): Contains currentItemId field
    - HierarchyItem (defined in task-utils.ts line 47): Phase | Milestone | Task | Subtask

# TEST PATTERNS - Follow existing test structure
- file: tests/unit/core/session-manager.test.ts
  why: Contains test patterns for SessionManager class
  pattern: Setup/Execute/Verify with vi.mock(), factory functions
  gotcha: Must mock session-utils functions to avoid real I/O
  key_lines:
    - Line 39-58: Mock pattern for session-utils
    - Line 76-135: Factory functions for test data (createTestSubtask, createTestBacklog, etc.)
    - Line 142-149: beforeEach/afterEach cleanup pattern

# ATOMIC WRITE PATTERN - Temp file + rename
- url: https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
  why: Official Node.js documentation on atomic rename operation
  critical: "If oldPath and newPath are on different filesystems, rename() will fail"
  implementation: src/core/session-utils.ts:92-110 (atomicWrite helper)
```

### Current Codebase Tree

```bash
src/
├── core/
│   ├── models.ts              # All type definitions (Backlog, Status, SessionState, etc.)
│   ├── session-manager.ts     # SessionManager class to extend
│   └── session-utils.ts       # writeTasksJSON(), readTasksJSON(), atomicWrite()
├── utils/
│   └── task-utils.ts          # updateItemStatus(), findItem(), HierarchyItem
└── core/
    └── index.ts               # Exports all from models, session-manager, session-utils

tests/
├── unit/
│   └── core/
│       └── session-manager.test.ts  # Test file to extend
└── fixtures/
    └── (no fixtures needed - use factory functions)

plan/
└── 001_14b9dc2a33c7/
    ├── tasks.json             # Single source of truth (written atomically)
    ├── prd_snapshot.md        # PRD content snapshot
    └── P3M1T1S2/
        └── PRP.md             # This file
```

### Desired Codebase Tree (files to be modified)

```bash
src/
└── core/
    └── session-manager.ts     # MODIFY: Add 5 new persistence methods

tests/
└── unit/
    └── core/
        └── session-manager.test.ts  # MODIFY: Add tests for new methods
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: SessionManager uses private #currentSession field
// The field itself can be mutated internally, but exposed as readonly via getter
// Line 52: #currentSession: SessionState | null = null
// Line 91-93: get currentSession() returns readonly reference

// CRITICAL: setCurrentItem() must modify #currentSession.currentItemId
// This is allowed because it's internal mutation, not external mutation
// Pattern: this.#currentSession.currentItemId = itemId

// CRITICAL: Always check currentSession is not null before accessing
// All new methods must throw Error if this.#currentSession is null
// Pattern: if (!this.#currentSession) { throw new Error('No session loaded'); }

// CRITICAL: tasks.json is the SINGLE SOURCE OF TRUTH (PRD section 5.1)
// Must use atomic writes to prevent corruption
// Use writeTasksJSON() which implements temp file + rename pattern

// CRITICAL: updateItemStatus() returns a NEW Backlog object (immutable)
// Do NOT mutate the original backlog
// Use: const updated = updateItemStatus(backlog, id, status);

// CRITICAL: SessionState interface uses readonly properties
// Line 762-807 in models.ts
// But #currentSession is a private field that CAN be mutated internally
// setCurrentItem() directly assigns to this.#currentSession.currentItemId

// GOTCHA: writeTasksJSON() and readTasksJSON() throw SessionFileError
// Let these errors propagate - do NOT catch and wrap them

// GOTCHA: findItem() returns null if item not found
// getCurrentItem() should return null in this case (not throw)

// GOTCHA: Status type is a string union, not an enum
// Import: { Status } from './models.js'
// Values: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'

// GOTCHA: Zod validation happens in readTasksJSON(), not in loadBacklog()
// loadBacklog() just delegates to readTasksJSON()
// Validation errors throw SessionFileError

// PATTERN: All async methods in SessionManager use async/await
// Do NOT return Promises directly - use async keyword

// PATTERN: Import from './models.js' with .js extension (ES modules)
// Even though source is .ts, imports use .js extension

// PATTERN: Test mocks use vi.mock() at top level
// See session-manager.test.ts line 39-58 for session-utils mock pattern
```

## Implementation Blueprint

### Data Models and Structure

No new data models - all types already exist in `src/core/models.ts`:

- `Backlog` (line 587): Root container for task hierarchy
- `Status` (line 55): Lifecycle status enum
- `SessionState` (line 762): Contains `currentItemId` field
- `HierarchyItem` (task-utils.ts line 47): Union of Phase | Milestone | Task | Subtask

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/core/session-manager.ts - Add imports for new dependencies
  - ADD: import { updateItemStatus, findItem } from '../utils/task-utils.js';
  - ADD: import { writeTasksJSON } from './session-utils.js';
  - ADD: import type { HierarchyItem } from '../utils/task-utils.js';
  - PLACE: At top of file, after existing imports (after line 32)
  - PATTERN: Existing imports use '../' for utils, './' for same directory

Task 2: MODIFY src/core/session-manager.ts - Add saveBacklog() method
  - IMPLEMENT: async saveBacklog(backlog: Backlog): Promise<void>
  - PLACE: After loadSession() method (after line 279)
  - LOGIC:
    1. Check if this.#currentSession exists, throw Error if null
    2. Delegate to writeTasksJSON(this.#currentSession.metadata.path, backlog)
    3. Return (writeTasksJSON returns Promise<void>)
  - NAMING: camelCase method name, async keyword
  - ERROR HANDLING: Let SessionFileError propagate from writeTasksJSON

Task 3: MODIFY src/core/session-manager.ts - Add loadBacklog() method
  - IMPLEMENT: async loadBacklog(): Promise<Backlog>
  - PLACE: After saveBacklog() method
  - LOGIC:
    1. Check if this.#currentSession exists, throw Error if null
    2. Delegate to readTasksJSON(this.#currentSession.metadata.path)
    3. Return the Backlog from readTasksJSON
  - NAMING: camelCase method name, async keyword
  - RETURN: Promise<Backlog> from readTasksJSON

Task 4: MODIFY src/core/session-manager.ts - Add updateItemStatus() method
  - IMPLEMENT: async updateItemStatus(itemId: string, status: Status): Promise<Backlog>
  - PLACE: After loadBacklog() method
  - LOGIC:
    1. Check if this.#currentSession exists, throw Error if null
    2. Call currentBacklog = this.#currentSession.taskRegistry
    3. Call updated = updateItemStatus(currentBacklog, itemId, status)
    4. Call this.saveBacklog(updated) to persist
    5. Update this.#currentSession.taskRegistry = updated (internal mutation)
    6. Return updated
  - NAMING: camelCase method name, async keyword
  - DEPENDENCIES: Uses updateItemStatus from task-utils.ts
  - GOTCHA: Must update #currentSession.taskRegistry after save

Task 5: MODIFY src/core/session-manager.ts - Add getCurrentItem() method
  - IMPLEMENT: getCurrentItem(): HierarchyItem | null
  - PLACE: After updateItemStatus() method
  - LOGIC:
    1. Check if this.#currentSession exists, return null if not loaded
    2. Check if this.#currentSession.currentItemId is null, return null
    3. Call findItem(this.#currentSession.taskRegistry, currentItemId)
    4. Return result (may be HierarchyItem or null)
  - NAMING: camelCase method name, no async keyword
  - RETURN: HierarchyItem | null (not Promise)

Task 6: MODIFY src/core/session-manager.ts - Add setCurrentItem() method
  - IMPLEMENT: setCurrentItem(itemId: string): void
  - PLACE: After getCurrentItem() method
  - LOGIC:
    1. Check if this.#currentSession exists, throw Error if null
    2. Assign this.#currentSession.currentItemId = itemId
  - NAMING: camelCase method name, no async keyword
  - GOTCHA: This mutates #currentSession internally (allowed for private field)
  - RETURN: void

Task 7: MODIFY tests/unit/core/session-manager.test.ts - Add mock for writeTasksJSON
  - IMPLEMENT: Add writeTasksJSON to the vi.mock() for session-utils
  - PLACE: In existing vi.mock() block (after line 43)
  - PATTERN: Add 'writeTasksJSON: vi.fn()' to the mock object
  - MUST ALSO: Import writeTasksJSON at top of file (after line 19)

Task 8: MODIFY tests/unit/core/session-manager.test.ts - Add tests for saveBacklog()
  - IMPLEMENT: describe('saveBacklog') block with it() tests
  - PLACE: After existing describe blocks (after initialize tests)
  - TESTS:
    1. "should call writeTasksJSON with session path and backlog" - happy path
    2. "should throw Error when no session loaded" - edge case
    3. "should propagate SessionFileError from writeTasksJSON" - error handling
  - PATTERN: Use Setup/Execute/Verify with createTestBacklog()

Task 9: MODIFY tests/unit/core/session-manager.test.ts - Add tests for loadBacklog()
  - IMPLEMENT: describe('loadBacklog') block with it() tests
  - PLACE: After saveBacklog() tests
  - TESTS:
    1. "should call readTasksJSON and return backlog" - happy path
    2. "should throw Error when no session loaded" - edge case
    3. "should propagate SessionFileError from readTasksJSON" - error handling
  - PATTERN: Mock readTasksJSON to return test backlog

Task 10: MODIFY tests/unit/core/session-manager.test.ts - Add tests for updateItemStatus()
  - IMPLEMENT: describe('updateItemStatus') block with it() tests
  - TESTS:
    1. "should update status, save, and return updated backlog" - happy path
    2. "should throw Error when no session loaded" - edge case
    3. "should update currentSession.taskRegistry after save" - state verification
  - GOTCHA: Must mock both updateItemStatus (from task-utils) and writeTasksJSON

Task 11: MODIFY tests/unit/core/session-manager.test.ts - Add tests for getCurrentItem()
  - IMPLEMENT: describe('getCurrentItem') block with it() tests
  - TESTS:
    1. "should return item when currentItemId is set" - happy path
    2. "should return null when no session loaded" - edge case
    3. "should return null when currentItemId is null" - edge case
    4. "should return null when item not found in backlog" - edge case
  - PATTERN: Setup mock currentSession with currentItemId

Task 12: MODIFY tests/unit/core/session-manager.test.ts - Add tests for setCurrentItem()
  - IMPLEMENT: describe('setCurrentItem') block with it() tests
  - TESTS:
    1. "should set currentItemId on currentSession" - happy path
    2. "should throw Error when no session loaded" - edge case
  - GOTCHA: Access private #currentSession via currentSession getter to verify
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Method skeleton with null check (scaffold for all 5 methods)
async saveBacklog(backlog: Backlog): Promise<void> {
  // NULL CHECK: All methods must validate session is loaded
  if (!this.#currentSession) {
    throw new Error('Cannot save backlog: no session loaded');
  }

  // DELEGATION: Delegate to session-utils function
  await writeTasksJSON(this.#currentSession.metadata.path, backlog);
}

// PATTERN: updateItemStatus with internal state mutation
async updateItemStatus(itemId: string, status: Status): Promise<Backlog> {
  if (!this.#currentSession) {
    throw new Error('Cannot update item status: no session loaded');
  }

  // GET CURRENT: Access taskRegistry from current session
  const currentBacklog = this.#currentSession.taskRegistry;

  // IMMUTABLE UPDATE: Use pure function from task-utils
  const updated = updateItemStatus(currentBacklog, itemId, status);

  // PERSIST: Save to disk atomically
  await this.saveBacklog(updated);

  // UPDATE STATE: Mutate private field internally
  this.#currentSession.taskRegistry = updated;

  return updated;
}

// PATTERN: getCurrentItem with null handling
getCurrentItem(): HierarchyItem | null {
  // NULL CHECK: Return null if no session (not throw)
  if (!this.#currentSession) {
    return null;
  }

  // NULL CHECK: Return null if no current item set
  if (!this.#currentSession.currentItemId) {
    return null;
  }

  // DELEGATION: Use findItem from task-utils
  return findItem(
    this.#currentSession.taskRegistry,
    this.#currentSession.currentItemId
  );
}

// PATTERN: setCurrentItem with internal mutation
setCurrentItem(itemId: string): void {
  if (!this.#currentSession) {
    throw new Error('Cannot set current item: no session loaded');
  }

  // MUTATE PRIVATE FIELD: Direct assignment (allowed for # fields)
  this.#currentSession.currentItemId = itemId;
}

// GOTCHA: Import HierarchyItem type from task-utils (not models)
import type { HierarchyItem } from '../utils/task-utils.js';

// GOTCHA: updateItemStatus function shadows method name
// Use fully qualified name or alias if needed:
import { updateItemStatus as updateItemStatusUtil } from '../utils/task-utils.js';
// Then call: updateItemStatusUtil(backlog, id, status)

// CRITICAL: TypeScript requires .js extensions in imports
// Even though source files are .ts, imports use .js
import { writeTasksJSON } from './session-utils.js';
import { updateItemStatus } from '../utils/task-utils.js';
```

### Integration Points

```yaml
SESSION_UTILS:
  - modify: src/core/session-utils.ts
  - pattern: "No modifications needed - use existing functions"
  - functions:
    - writeTasksJSON(sessionPath, backlog): Promise<void>
    - readTasksJSON(sessionPath): Promise<Backlog>

TASK_UTILS:
  - modify: src/utils/task-utils.ts
  - pattern: "No modifications needed - use existing functions"
  - functions:
    - updateItemStatus(backlog, id, status): Backlog
    - findItem(backlog, id): HierarchyItem | null

TESTS:
  - modify: tests/unit/core/session-manager.test.ts
  - pattern: "Add new describe() blocks after existing tests"
  - add_mock: "writeTasksJSON: vi.fn()" to session-utils mock
  - add_mock: "updateItemStatus: vi.fn()" and "findItem: vi.fn()" to task-utils mock
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npm run lint  # Runs ESLint on src/ directory
npm run format  # Runs Prettier formatting

# Check specific file
npx eslint src/core/session-manager.ts --fix

# Type checking
npm run type-check  # Runs tsc --noEmit

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test SessionManager specifically
npm run test:run tests/unit/core/session-manager.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/core/session-manager.test.ts

# Expected: All tests pass. Check coverage is 100% for new methods.

# If tests fail, debug root cause:
# 1. Check if mocks are configured correctly
# 2. Verify import statements use .js extensions
# 3. Ensure async methods use await properly
# 4. Check null check logic in all methods
```

### Level 3: Integration Testing (System Validation)

```bash
# Test core module imports work
node -e "import('./dist/core/session-manager.js').then(m => console.log('OK'))"

# Verify session-utils integration
node -e "
  import('./dist/core/session-utils.js').then(({ writeTasksJSON, readTasksJSON }) => {
    console.log('writeTasksJSON:', typeof writeTasksJSON);
    console.log('readTasksJSON:', typeof readTasksJSON);
  })
"

# Verify task-utils integration
node -e "
  import('./dist/utils/task-utils.js').then(({ updateItemStatus, findItem }) => {
    console.log('updateItemStatus:', typeof updateItemStatus);
    console.log('findItem:', typeof findItem);
  })
"

# Test with real session directory (optional)
mkdir -p /tmp/test-session
node -e "
  import('./dist/core/session-manager.js').then(({ SessionManager }) => {
    const mgr = new SessionManager('./PRD.md', '/tmp');
    console.log('SessionManager imported successfully');
  })
"

# Expected: All imports resolve, functions are callable, no runtime errors.
```

### Level 4: Manual Verification (Domain-Specific Validation)

```bash
# MANUAL TEST: Verify atomic write prevents corruption
# 1. Create a test session with initial backlog
# 2. Call saveBacklog() with modified backlog
# 3. Check that tasks.json is written atomically (no partial writes)
# 4. Verify file is valid JSON and passes BacklogSchema

# MANUAL TEST: Verify loadBacklog() reads correctly
# 1. Start with existing tasks.json
# 2. Call loadBacklog()
# 3. Verify returned backlog matches file content

# MANUAL TEST: Verify updateItemStatus() persistence
# 1. Load backlog, get initial status of an item
# 2. Call updateItemStatus() to change status
# 3. Load backlog again via loadBacklog()
# 4. Verify status change persisted

# MANUAL TEST: Verify getCurrentItem() resolution
# 1. Set currentItemId via setCurrentItem()
# 2. Call getCurrentItem()
# 3. Verify returned item matches currentItemId

# MANUAL TEST: Verify null handling
# 1. Create SessionManager but don't call initialize()
# 2. Call each method with no session loaded
# 3. Verify saveBacklog, loadBacklog, updateItemStatus, setCurrentItem throw
# 4. Verify getCurrentItem returns null (not throw)

# Expected: All manual tests pass, behavior matches specifications.
```

## Final Validation Checklist

### Technical Validation

- [ ] All 5 methods added to SessionManager class
- [ ] saveBacklog() delegates to writeTasksJSON()
- [ ] loadBacklog() delegates to readTasksJSON()
- [ ] updateItemStatus() uses updateItemStatus() from task-utils
- [ ] getCurrentItem() uses findItem() from task-utils
- [ ] setCurrentItem() mutates #currentSession.currentItemId
- [ ] All methods check for null #currentSession
- [ ] Imports use .js extensions (ES module pattern)
- [ ] HierarchyItem type imported from task-utils
- [ ] All tests pass: `npm run test:run tests/unit/core/session-manager.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`

### Feature Validation

- [ ] saveBacklog() writes to tasks.json atomically
- [ ] loadBacklog() returns validated Backlog object
- [ ] updateItemStatus() returns updated Backlog after save
- [ ] updateItemStatus() updates #currentSession.taskRegistry
- [ ] getCurrentItem() returns HierarchyItem or null
- [ ] getCurrentItem() returns null when no session loaded
- [ ] setCurrentItem() throws Error when no session loaded
- [ ] All methods throw Error when #currentSession is null
- [ ] Error cases handled gracefully with proper error messages

### Code Quality Validation

- [ ] Follows existing SessionManager method patterns
- [ ] Uses private #currentSession field correctly
- [ ] Async methods use async/await (not Promise returns)
- [ ] Sync methods (getCurrentItem, setCurrentItem) have no async keyword
- [ ] Delegates to existing utilities (no code duplication)
- [ ] JSDoc comments added to all new methods
- [ ] Test coverage 100% for all new methods
- [ ] Tests follow Setup/Execute/Verify pattern
- [ ] Mock functions configured correctly

### Documentation & Deployment

- [ ] JSDoc comments present for all 5 methods
- [ ] Method parameters documented with @param tags
- [ ] Return types documented with @returns tags
- [ ] Error conditions documented in JSDoc
- [ ] Test documentation describes what each test validates
- [ ] No breaking changes to existing API

---

## Anti-Patterns to Avoid

- **Don't mutate the backlog parameter** in saveBacklog() - treat it as readonly
- **Don't skip the null check** in any method - always verify session is loaded
- **Don't catch and wrap SessionFileError** - let it propagate naturally
- **Don't use synchronous file operations** - all methods must be async
- **Don't implement custom hierarchy traversal** - use findItem() from task-utils
- **Don't implement custom status update logic** - use updateItemStatus() from task-utils
- **Don't create new temp file pattern** - use existing writeTasksJSON() atomic pattern
- **Don't forget to import HierarchyItem** type from task-utils (not models)
- **Don't use .ts extensions in imports** - must use .js for ES modules
- **Don't return Promises directly** - use async keyword and await
- **Don't make getCurrentItem() async** - it's a simple getter, no I/O needed
- **Don't make setCurrentItem() async** - it just sets a field, no I/O needed
- **Don't update #currentSession.taskRegistry before save** - save first, then update
