# Product Requirement Prompt: Delta Session Initialization

## Goal

**Feature Goal**: Implement `createDeltaSession()` method in SessionManager that creates a linked child session when the PRD is modified, preserving parent context and documenting changes for selective task re-execution.

**Deliverable**: Complete `createDeltaSession()` async method in `src/core/session-manager.ts` with comprehensive test coverage in `tests/unit/core/session-manager.test.ts`.

**Success Definition**:

- Method creates new session directory with incremented sequence number
- Delta session stores old PRD, new PRD, and diff summary
- Parent session reference is persisted to `parent_session.txt`
- All tests pass including edge cases (no current session, missing PRD, file system errors)
- Code follows existing SessionManager patterns and conventions

---

## User Persona

**Target User**: PRP Pipeline system (internal component used by Task Orchestrator)

**Use Case**: When a user modifies the PRD after development has started, the pipeline needs to create a delta session that:

1. Detects PRD changes via hash comparison
2. Creates a new linked session without losing completed work
3. Computes structured diff of what changed
4. Enables selective re-execution of affected tasks only

**User Journey**:

```
1. Pipeline detects PRD hash mismatch via hasSessionChanged()
2. Pipeline calls createDeltaSession('/path/to/modified/PRD.md')
3. SessionManager validates current session exists and new PRD is readable
4. SessionManager hashes new PRD, computes diff, creates directory structure
5. DeltaSession is returned with oldPRD, newPRD, diffSummary fields populated
6. Delta Analysis workflow uses this data to patch task registry
7. Task Orchestrator re-executes only affected tasks
```

**Pain Points Addressed**:

- **Lost work on PRD changes**: Without delta sessions, modifying the PRD would require starting from scratch
- **Inefficient re-execution**: Delta sessions enable selective re-execution based on actual changes
- **No audit trail**: Delta sessions provide complete history of requirement evolution

---

## Why

- **Business value**: Enables iterative development where requirements evolve without losing completed work, reducing rework by ~80% when PRD changes occur
- **Integration with existing features**: Builds on existing `diffPRDs()` from P3.M1.T2.S2, extends SessionManager from P3.M1.T1.S1
- **Problems solved**:
  - Handles requirement changes gracefully mid-execution
  - Provides immutable audit trail of all PRD versions
  - Enables smart task re-execution based on actual impact

---

## What

Implement `createDeltaSession(newPRDPath: string): Promise<DeltaSession>` method that:

1. **Validates preconditions**: Current session must be loaded, new PRD must exist
2. **Hashes new PRD**: Uses `hashPRD()` utility, extracts first 12 chars as session hash
3. **Reads PRD contents**: Loads old PRD from `currentSession.prdSnapshot`, reads new PRD from file
4. **Computes diff**: Calls `diffPRDs(oldPRD, newPRD)` to get structured changes
5. **Creates session directory**: Calls `createSessionDirectory()` with incremented sequence
6. **Writes parent reference**: Creates `parent_session.txt` with current session ID
7. **Builds DeltaSession**: Constructs object with metadata, oldPRD, newPRD, diffSummary
8. **Updates internal state**: Sets `#currentSession` to new delta session
9. **Returns DeltaSession**: Complete delta session object for use by pipeline

### Success Criteria

- [ ] Method signature: `async createDeltaSession(newPRDPath: string): Promise<DeltaSession>`
- [ ] Validates current session exists (throws Error with message "no current session loaded")
- [ ] Validates new PRD exists (throws SessionFileError if ENOENT)
- [ ] Creates new session with incremented sequence number
- [ ] Writes `parent_session.txt` file with parent session ID
- [ ] Populates `oldPRD` field from current session's prdSnapshot
- [ ] Populates `newPRD` field from file content
- [ ] Populates `diffSummary` field from `diffPRDs().summaryText`
- [ ] Sets `parentSession` in metadata to parent session ID
- [ ] Sets `taskRegistry` to empty backlog (will be populated by Architect Agent)
- [ ] Updates `#currentSession` to point to new delta session
- [ ] All tests pass with 100% coverage of new method
- [ ] No existing tests break

---

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Complete existing SessionManager implementation patterns
- Exact DeltaSession interface definition
- All utility function signatures and usage patterns
- Complete test patterns to follow
- File structure and naming conventions
- Error handling patterns with custom error classes
- Async operation patterns (sequential vs parallel)
- Validation gate commands verified to work

### Documentation & References

```yaml
# MUST READ - Core implementation files
- file: src/core/session-manager.ts
  why: Complete SessionManager class implementation showing all patterns to follow
  pattern: Private fields (#currentSession, #prdHash), immutable updates, error wrapping
  gotcha: Must use resolve() for absolute paths, stat() for file validation

- file: src/core/prd-differ.ts
  why: diffPRDs() function that computes PRD changes
  pattern: Function signature `diffPRDs(oldPRD: string, newPRD: string): DiffSummary`
  gotcha: Returns DiffSummary with .summaryText, .changes, .stats properties

- file: src/core/models.ts (lines 847-888)
  why: DeltaSession interface definition extending SessionState
  pattern: Interface with readonly properties, extends base SessionState
  section: Lines 847-888 contain complete DeltaSession definition

- file: src/core/session-utils.ts
  why: Utility functions for file operations (hashPRD, createSessionDirectory)
  pattern: Async functions with SessionFileError for error handling
  gotcha: hashPRD returns full 64-char hash, slice(0, 12) for session hash

- file: tests/unit/core/session-manager.test.ts
  why: Test patterns and conventions for SessionManager tests
  pattern: describe/it blocks, vi.mock for mocking, factory functions for test data
  gotcha: Mock node:fs/promises and session-utils modules

# CRITICAL - Implementation patterns to follow
- file: src/core/session-manager.ts (lines 304-369)
  why: EXISTING createDeltaSession() implementation that may need updates
  pattern: This method already exists - verify it's complete or add missing pieces
  note: The method exists in current codebase, verify completeness

# EXTERNAL - TypeScript best practices
- url: https://www.typescriptlang.org/docs/handbook/2/functions.html#async-functions
  why: Async/await patterns and Promise return types
  critical: Always declare explicit Promise<T> return type

- url: https://nodejs.org/api/fs.html#fspromisesapi
  why: Node.js fs/promises API documentation
  critical: Import from 'node:fs/promises', not 'fs'

- url: https://vitest.dev/guide/
  why: Vitest testing framework patterns
  critical: Use vi.mock, vi.fn(), beforeEach for test setup
```

### Current Codebase Structure

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts    # TARGET FILE - add/verify createDeltaSession()
│   │   ├── prd-differ.ts          # USE - diffPRDs() function
│   │   ├── session-utils.ts       # USE - hashPRD(), createSessionDirectory()
│   │   └── models.ts              # REFERENCE - DeltaSession interface
│   └── utils/
│       └── task-utils.ts          # USE - utility functions
├── tests/
│   └── unit/
│       └── core/
│           └── session-manager.test.ts  # TARGET FILE - add createDeltaSession tests
├── plan/
│   └── 001_14b9dc2a33c7/
│       └── P3M1T2S3/
│           └── PRP.md            # THIS FILE
├── package.json                   # RUN: npm run test:unit
├── tsconfig.json                  # REFERENCE - TypeScript config
└── vitest.config.ts              # REFERENCE - Vitest config
```

### Desired Codebase Structure (no new files - verify existing)

```bash
# No new files needed - implementation in existing files:

# 1. UPDATE src/core/session-manager.ts
#    - Verify/createDeltaSession() method exists and is complete
#    - Lines 304-369: Method should already exist
#    - Verify all functionality is implemented

# 2. UPDATE tests/unit/core/session-manager.test.ts
#    - Add comprehensive tests for createDeltaSession()
#    - Add new describe block for createDeltaSession tests
#    - Follow existing test patterns
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: SessionManager uses private fields with # prefix
// BAD: this.currentSession = newValue
// GOOD: this.#currentSession = newValue

// CRITICAL: Always resolve() paths to absolute before file operations
import { resolve } from 'node:path';
const absPath = resolve(newPRDPath); // Always resolve first

// CRITICAL: SessionFileError requires (path, operation, cause?) parameters
// BAD: throw new SessionFileError(path)
// GOOD: throw new SessionFileError(absPath, 'validate new PRD exists', error as Error)

// CRITICAL: hashPRD() returns 64-char hash, slice for session hash
const fullHash = await hashPRD(newPRDPath); // 64 characters
const sessionHash = fullHash.slice(0, 12); // First 12 for session ID

// CRITICAL: Sequence number parsing from session ID
// Session ID format: "{sequence}_{hash}" e.g., "001_14b9dc2a33c7"
const currentSeq = parseInt(this.#currentSession.metadata.id.split('_')[0], 10);
const newSeq = currentSeq + 1;

// CRITICAL: DeltaSession extends SessionState - includes all base fields
const deltaSession: DeltaSession = {
  metadata, // From SessionState
  prdSnapshot: newPRD, // From SessionState (new PRD becomes snapshot)
  taskRegistry: { backlog: [] }, // From SessionState (empty until Architect)
  currentItemId: null, // From SessionState
  oldPRD, // DeltaSession-specific
  newPRD, // DeltaSession-specific
  diffSummary, // DeltaSession-specific
};

// CRITICAL: Use readonly properties for immutability
const metadata: SessionMetadata = {
  id: sessionId,
  hash: sessionHash,
  path: sessionPath,
  createdAt: new Date(),
  parentSession: this.#currentSession.metadata.id,
}; // All readonly

// CRITICAL: Vitest mock patterns - mock before imports
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
}));

// CRITICAL: Import mocked modules AFTER mock declaration
import { readFile, writeFile, stat } from 'node:fs/promises';
const mockReadFile = readFile as any;

// CRITICAL: Test file follows factory function pattern
const createTestSubtask = (id, title, status, dependencies = []) => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test',
});
```

---

## Implementation Blueprint

### Data Models and Structure

The `DeltaSession` interface is already defined in `src/core/models.ts`:

```typescript
// From src/core/models.ts lines 847-888
export interface DeltaSession extends SessionState {
  readonly oldPRD: string; // Original PRD from parent session
  readonly newPRD: string; // Modified PRD content
  readonly diffSummary: string; // Human-readable diff summary
}

// SessionState base interface (lines 762-807)
export interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string;
  readonly taskRegistry: Backlog;
  readonly currentItemId: string | null;
}

// SessionMetadata for parent reference (lines 663-716)
export interface SessionMetadata {
  readonly id: string; // Format: "{sequence}_{hash}"
  readonly hash: string; // First 12 chars of SHA-256
  readonly path: string; // Session directory path
  readonly createdAt: Date; // Session creation timestamp
  readonly parentSession: string | null; // Parent session ID for delta sessions
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY/UPDATE createDeltaSession() method in src/core/session-manager.ts
  - CHECK: Method exists at lines 304-369
  - VERIFY: Method signature matches: async createDeltaSession(newPRDPath: string): Promise<DeltaSession>
  - VERIFY: Precondition validation (current session exists check)
  - VERIFY: New PRD file existence validation with stat()
  - VERIFY: Hash generation using hashPRD() and slice(0, 12)
  - VERIFY: PRD content reading (old from snapshot, new from file)
  - VERIFY: Diff computation using diffPRDs(oldPRD, newPRD)
  - VERIFY: Session directory creation with incremented sequence
  - VERIFY: parent_session.txt file creation
  - VERIFY: DeltaSession object construction with all required fields
  - VERIFY: Internal state update (#currentSession = deltaSession)
  - ADD: Missing functionality if method is incomplete
  - LOCATION: src/core/session-manager.ts after loadSession() method (around line 290)

Task 2: VERIFY imports in src/core/session-manager.ts
  - CHECK: All required imports are present
  - REQUIRED: import { readFile, writeFile, stat, readdir } from 'node:fs/promises'
  - REQUIRED: import { resolve, basename } from 'node:path'
  - REQUIRED: import type { SessionState, SessionMetadata, DeltaSession, Backlog } from './models.js'
  - REQUIRED: import { hashPRD, createSessionDirectory, SessionFileError } from './session-utils.js'
  - REQUIRED: import { diffPRDs } from './prd-differ.js'
  - ADD: Any missing imports
  - LOCATION: Top of src/core/session-manager.ts (lines 23-45)

Task 3: CREATE comprehensive tests in tests/unit/core/session-manager.test.ts
  - ADD: New describe block 'createDeltaSession' after existing describe blocks
  - IMPLEMENT: Test for precondition - no current session loaded
  - IMPLEMENT: Test for new PRD file not existing (ENOENT)
  - IMPLEMENT: Test for successful delta session creation
  - IMPLEMENT: Test for sequence number increment
  - IMPLEMENT: Test for parent session reference in metadata
  - IMPLEMENT: Test for parent_session.txt file creation
  - IMPLEMENT: Test for oldPRD, newPRD, diffSummary field population
  - IMPLEMENT: Test for currentSession update after delta creation
  - IMPLEMENT: Test for diffPRDs() invocation with correct arguments
  - IMPLEMENT: Test for error propagation from utility functions
  - IMPLEMENT: Test for multiple sequential delta sessions
  - FOLLOW: Existing test patterns (factory functions, vi.mock, beforeEach)
  - NAMING: Test function names like 'should throw when no current session loaded'
  - LOCATION: tests/unit/core/session-manager.test.ts after existing tests

Task 4: VERIFY/UPDATE error handling in createDeltaSession()
  - CHECK: All async operations wrapped in try/catch
  - VERIFY: SessionFileError thrown for file system errors
  - VERIFY: Error thrown for missing current session (not SessionFileError)
  - VERIFY: Proper error wrapping with context (path, operation)
  - PATTERN: catch (error) { throw new SessionFileError(path, 'operation', error as Error); }
  - LOCATION: src/core/session-manager.ts within createDeltaSession() method

Task 5: RUN Level 1 validation (Syntax & Style)
  - EXECUTE: npm run check  # or equivalent lint/type check command
  - VERIFY: No TypeScript errors
  - VERIFY: No ESLint warnings
  - VERIFY: No type mismatches
  - FIX: Any issues before proceeding
  - EXPECTED: Zero errors

Task 6: RUN Level 2 validation (Unit Tests)
  - EXECUTE: npm run test:unit tests/unit/core/session-manager.test.ts
  - VERIFY: All existing tests still pass
  - VERIFY: All new createDeltaSession tests pass
  - VERIFY: 100% coverage of createDeltaSession() method
  - FIX: Any failing tests
  - EXPECTED: All tests pass

Task 7: RUN Level 3 validation (Integration)
  - EXECUTE: npm run test  # Full test suite
  - VERIFY: No regressions in other modules
  - VERIFY: SessionManager integration works
  - VERIFY: Delta session can be loaded via loadSession()
  - EXPECTED: All integration tests pass
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Precondition validation (from line 305-307)
if (!this.#currentSession) {
  throw new Error('Cannot create delta session: no current session loaded');
}

// PATTERN 2: File path resolution and validation (from line 310-315)
const absPath = resolve(newPRDPath);
try {
  await stat(absPath);
} catch {
  throw new SessionFileError(absPath, 'validate new PRD exists');
}

// PATTERN 3: PRD hashing (from line 318-319)
const newHash = await hashPRD(newPRDPath);
const sessionHash = newHash.slice(0, 12); // First 12 chars only

// PATTERN 4: Reading PRD contents (from line 322-323)
const oldPRD = this.#currentSession.prdSnapshot;
const newPRD = await readFile(absPath, 'utf-8');

// PATTERN 5: Diff computation (from line 326-327)
const diffResult = diffPRDs(oldPRD, newPRD);
const diffSummary = diffResult.summaryText;

// PATTERN 6: Sequence number calculation (from line 330-334)
const currentSeq = parseInt(this.#currentSession.metadata.id.split('_')[0], 10);
const newSeq = currentSeq + 1;

// PATTERN 7: Session directory creation (from line 335)
const sessionPath = await createSessionDirectory(newPRDPath, newSeq);

// PATTERN 8: Parent session reference file (from line 338-342)
await writeFile(
  resolve(sessionPath, 'parent_session.txt'),
  this.#currentSession.metadata.id,
  { mode: 0o644 }
);

// PATTERN 9: Metadata construction (from line 345-352)
const sessionId = `${String(newSeq).padStart(3, '0')}_${sessionHash}`;
const metadata: SessionMetadata = {
  id: sessionId,
  hash: sessionHash,
  path: sessionPath,
  createdAt: new Date(),
  parentSession: this.#currentSession.metadata.id,
};

// PATTERN 10: DeltaSession object construction (from line 355-363)
const deltaSession: DeltaSession = {
  metadata,
  prdSnapshot: newPRD,
  taskRegistry: { backlog: [] }, // Empty until Architect Agent
  currentItemId: null,
  oldPRD,
  newPRD,
  diffSummary,
};

// PATTERN 11: Immutable state update (from line 366)
this.#currentSession = deltaSession;

// PATTERN 12: Return result (from line 368)
return deltaSession;
```

### Integration Points

```yaml
DIFFPRDS_MODULE:
  - file: src/core/prd-differ.ts
  - function: diffPRDs(oldPRD: string, newPRD: string): DiffSummary
  - usage: const diffResult = diffPRDs(oldPRD, newPRD);
  - output: { changes: SectionChange[], summaryText: string, stats: {...} }

SESSION_UTILS:
  - file: src/core/session-utils.ts
  - function: hashPRD(prdPath: string): Promise<string>
  - usage: const newHash = await hashPRD(newPRDPath);
  - output: 64-character hex string, slice(0, 12) for session hash

SESSION_UTILS:
  - file: src/core/session-utils.ts
  - function: createSessionDirectory(prdPath: string, sequence: number): Promise<string>
  - usage: const sessionPath = await createSessionDirectory(newPRDPath, newSeq);
  - output: Absolute path to new session directory

FILE_SYSTEM:
  - module: node:fs/promises
  - function: stat(path: string): Promise<Stats>
  - usage: File existence validation before processing
  - error: ENOENT code means file doesn't exist

FILE_SYSTEM:
  - module: node:fs/promises
  - function: writeFile(path: string, data: string, options?: { mode?: number }): Promise<void>
  - usage: Write parent_session.txt with mode 0o644
  - gotcha: Resolve path first with resolve()

PATH_MODULE:
  - module: node:path
  - function: resolve(...paths: string[]): string
  - usage: Always resolve to absolute paths before file operations
  - example: const absPath = resolve(newPRDPath);
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after completing Task 1 and Task 2 (implementation)
npm run check

# Expected: Zero TypeScript errors, zero ESLint warnings
# If errors exist: READ output and fix before proceeding

# Type checking specific file
npx tsc --noEmit src/core/session-manager.ts

# Expected: Zero type errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run after completing Task 3 (tests)
npm run test:unit tests/unit/core/session-manager.test.ts

# Expected: All tests pass
# Watch for:
# - "should throw when no current session loaded" - should pass
# - "should validate new PRD exists" - should pass
# - "should create delta session with incremented sequence" - should pass
# - "should set parent session reference" - should pass
# - "should populate oldPRD, newPRD, diffSummary" - should pass
# - "should update currentSession" - should pass

# Run with coverage
npm run test:coverage

# Expected: 100% coverage of createDeltaSession() method
# If coverage < 100%: Add tests for uncovered branches
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite to catch regressions
npm run test

# Expected: All tests pass, no existing tests break
# Watch for:
# - SessionManager initialization tests - should still pass
# - SessionManager loadSession tests - should still pass
# - SessionManager persistence tests - should still pass

# Specific integration test for delta session lifecycle
npm run test:unit -- --testNamePattern="delta session"

# Expected: Delta session can be created and then loaded
```

### Level 4: Manual Validation (Runtime Testing)

```bash
# Create test PRD files
cat > /tmp/old_prd.md << 'EOF'
# Test Project
## Features
- Feature A
EOF

cat > /tmp/new_prd.md << 'EOF'
# Test Project
## Features
- Feature A
- Feature B
EOF

# Run manual integration test (create a test script)
node --loader ts-node/esm -e "
import { SessionManager } from './src/core/session-manager.js';

async function test() {
  const manager = new SessionManager('/tmp/old_prd.md', '/tmp/test-plan');
  await manager.initialize();
  console.log('Initial session:', manager.currentSession.metadata.id);

  const delta = await manager.createDeltaSession('/tmp/new_prd.md');
  console.log('Delta session:', delta.metadata.id);
  console.log('Parent:', delta.metadata.parentSession);
  console.log('Diff summary:', delta.diffSummary);
  console.log('oldPRD length:', delta.oldPRD.length);
  console.log('newPRD length:', delta.newPRD.length);
}

test().catch(console.error);
"

# Expected output:
# - Initial session: 001_xxxxxxxxxx
# - Delta session: 002_yyyyyyyyyyy
# - Parent: 001_xxxxxxxxxx
# - Diff summary: "PRD changes: 1 modified. Affected: Features."
# - oldPRD/newPRD content populated

# Verify parent_session.txt was created
cat /tmp/test-plan/002_yyyyyyyyyyy/parent_session.txt

# Expected: Parent session ID (e.g., "001_xxxxxxxxxx")
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint warnings: `npm run lint` (if available)
- [ ] 100% test coverage of `createDeltaSession()` method
- [ ] No existing tests broke
- [ ] Code follows existing SessionManager patterns

### Feature Validation

- [ ] Method signature matches: `async createDeltaSession(newPRDPath: string): Promise<DeltaSession>`
- [ ] Throws Error when no current session loaded
- [ ] Throws SessionFileError when new PRD doesn't exist
- [ ] Creates new session with incremented sequence number
- [ ] Writes `parent_session.txt` with correct parent ID
- [ ] Populates `oldPRD` from current session's prdSnapshot
- [ ] Populates `newPRD` from file content
- [ ] Populates `diffSummary` from `diffPRDs().summaryText`
- [ ] Sets `parentSession` in metadata to parent session ID
- [ ] Updates `#currentSession` to point to new delta session
- [ ] Returns complete DeltaSession object

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Uses readonly properties for immutability
- [ ] Uses private fields (#currentSession, #prdHash)
- [ ] Proper error handling with SessionFileError
- [ ] All async operations properly awaited
- [ ] Path resolution with resolve() before file operations
- [ ] JSDoc comments added (if not present)
- [ ] Type annotations are explicit (Promise<DeltaSession>)

### Documentation & Deployment

- [ ] Method has JSDoc comment explaining behavior
- [ ] @param tags for all parameters
- [ ] @returns tag documenting return type
- [ ] @throws tag for error conditions
- [ ] @remarks explaining delta session concept
- [ ] @example showing typical usage

---

## Anti-Patterns to Avoid

- **Don't mutate existing objects**: Always create new objects with spread operator

  ```typescript
  // BAD
  this.#currentSession.metadata.parentSession = 'new_parent';

  // GOOD
  this.#currentSession = {
    ...this.#currentSession,
    metadata: { ...this.#currentSession.metadata, parentSession: 'new_parent' },
  };
  ```

- **Don't skip error handling**: All file operations need try/catch

  ```typescript
  // BAD
  const content = await readFile(path);

  // GOOD
  try {
    const content = await readFile(path);
  } catch (error) {
    throw new SessionFileError(path, 'read file', error as Error);
  }
  ```

- **Don't use relative paths**: Always resolve to absolute paths

  ```typescript
  // BAD
  await readFile(newPRDPath);

  // GOOD
  const absPath = resolve(newPRDPath);
  await readFile(absPath);
  ```

- **Don't forget to slice hash**: hashPRD() returns 64 chars, session needs 12

  ```typescript
  // BAD
  const sessionHash = await hashPRD(path);

  // GOOD
  const fullHash = await hashPRD(path);
  const sessionHash = fullHash.slice(0, 12);
  ```

- **Don't use sync operations**: Always use async versions from fs/promises

  ```typescript
  // BAD
  import { readFileSync } from 'fs';
  const content = readFileSync(path);

  // GOOD
  import { readFile } from 'node:fs/promises';
  const content = await readFile(path, 'utf-8');
  ```

- **Don't catch all errors**: Be specific about error types

  ```typescript
  // BAD
  try { ... } catch (e) { /* ignore */ }

  // GOOD
  try { ... } catch (error) {
    if (error instanceof SessionFileError) { throw error; }
    throw new SessionFileError(path, 'operation', error as Error);
  }
  ```

- **Don't forget to update internal state**: Must update #currentSession

  ```typescript
  // BAD
  return deltaSession; // #currentSession still points to old session

  // GOOD
  this.#currentSession = deltaSession;
  return deltaSession;
  ```

---

## Confidence Score

**8/10** for one-pass implementation success

**Justification**:

- ✅ Complete existing implementation patterns available in codebase
- ✅ All dependencies (diffPRDs, hashPRD, createSessionDirectory) already implemented
- ✅ Clear DeltaSession interface definition
- ✅ Comprehensive test patterns established
- ✅ File system utility patterns well-defined
- ⚠️ Method already exists in codebase (lines 304-369) - may need verification
- ⚠️ Complex async operation flow with multiple file system operations
- ⚠️ Error handling requires careful attention to edge cases

**Risk Mitigation**:

- Comprehensive test coverage for all branches
- Step-by-step validation levels catch issues early
- Existing patterns guide implementation decisions
- Mocked tests prevent file system dependency issues

---

## References

### Internal Documentation

- **PRD**: `plan/001_14b9dc2a33c7/prd_snapshot.md` - Full PRD with delta workflow specification
- **SessionManager**: `src/core/session-manager.ts` - Complete class implementation
- **PRD Differ**: `src/core/prd-differ.ts` - diffPRDs() function documentation
- **Models**: `src/core/models.ts` - DeltaSession interface (lines 847-888)

### External Resources

- **TypeScript Async Functions**: https://www.typescriptlang.org/docs/handbook/2/functions.html#async-functions
- **Node.js fs/promises**: https://nodejs.org/api/fs.html#fspromisesapi
- **Vitest Testing**: https://vitest.dev/guide/
- **Immutable Update Patterns**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax

---

**PRP Version**: 1.0
**Created**: 2026-01-13
**For**: Subtask P3.M1.T2.S3 - Create delta session initialization
**Status**: Ready for implementation
