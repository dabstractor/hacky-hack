# Product Requirement Prompt: P3.M1.T1.S1 - Create SessionManager Class

## Goal

**Feature Goal**: Implement a `SessionManager` class that provides centralized session state management, PRD hash-based initialization, session discovery/loading, and delta session creation capabilities.

**Deliverable**: TypeScript class `SessionManager` at `src/core/session-manager.ts` with properties for PRD path, plan directory, and current session state; methods for initialization, loading existing sessions, and creating delta sessions.

**Success Definition**:

- `SessionManager` class successfully validates PRD existence and reads content on construction
- `initialize()` method creates or loads session state based on PRD hash
- `loadSession()` method restores complete session state from existing session directory
- `createDeltaSession()` method creates linked delta session with PRD diff detection
- All methods use existing `session-utils.ts` functions for file operations
- Full test coverage using Vitest with mocked file system operations

## User Persona

**Target User**: PRP Pipeline developers integrating session management into the Task Orchestrator (P3.M2) and Pipeline Controller (P3.M4).

**Use Case**: The Task Orchestrator needs a centralized session manager to:

1. Initialize new sessions from PRD files
2. Resume existing sessions after interruption
3. Detect PRD changes and create delta sessions
4. Provide immutable access to session state

**User Journey**:

```
Developer Instantiation
    ↓
Constructor validates PRD path
    ↓
Call initialize() → Hash PRD → Check existing sessions
    ↓
    ├─ New PRD hash → Create session directory → Return new SessionState
    ├─ Existing hash found → Load tasks.json → Return SessionState
    └─ PRD modified → createDeltaSession() → Return DeltaSessionState
    ↓
Session Manager provides readonly access to session state
```

**Pain Points Addressed**:

- **No centralized session state**: Current `session-utils.ts` has scattered functions but no cohesive state manager
- **Manual session discovery**: Developers must manually search `plan/` directories for existing sessions
- **No delta detection**: No mechanism to detect PRD changes and create delta sessions
- **State mutation risk**: Session state is mutable, risking corruption during concurrent operations

## Why

- **Architectural Foundation**: Session Manager is one of the Four Core Processing Engines (system_context.md:46-50). It provides the state persistence layer that all other engines depend on.
- **Enables Resume Capability**: Without SessionManager, the pipeline cannot resume from interruption—a critical requirement for long-running development sessions.
- **Delta Session Support**: PRD modification detection enables the Delta Workflow (system_context.md:86-89), preventing unnecessary re-execution of unchanged tasks.
- **Type Safety**: Centralized session management with `readonly` properties prevents accidental state mutation during pipeline execution.

## What

Implement a `SessionManager` class that wraps existing `session-utils.ts` functions into a cohesive state management API:

### Class Properties (Constructor-Initialized)

| Property         | Type                   | Description                                                             |
| ---------------- | ---------------------- | ----------------------------------------------------------------------- |
| `prdPath`        | `string`               | Absolute or relative path to PRD file (validated in constructor)        |
| `planDir`        | `string`               | Path to `plan/` directory (default: `resolve('plan')`)                  |
| `currentSession` | `SessionState \| null` | Current loaded session state (null until initialize/loadSession called) |

### Public Methods

| Method               | Signature                                          | Description                                                        |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `constructor`        | `(prdPath: string, planDir?: string)`              | Validates PRD exists, stores paths                                 |
| `initialize`         | `(): Promise<SessionState>`                        | Hash PRD, check for existing sessions, create new or load existing |
| `loadSession`        | `(sessionPath: string): Promise<SessionState>`     | Load specific session from path                                    |
| `createDeltaSession` | `(newPRDPath: string): Promise<DeltaSessionState>` | Create delta session from PRD changes                              |
| `getSessionPath`     | `(sequence: number, hash: string): string`         | Build session directory path                                       |

### Success Criteria

- [ ] `SessionManager` class defined at `src/core/session-manager.ts` with JSDoc module documentation
- [ ] Constructor validates PRD file exists (throws `SessionFileError` if not found)
- [ ] Constructor stores `prdPath` and `planDir` as readonly properties
- [ ] `currentSession` initialized to `null`, becomes `SessionState` after initialize/loadSession
- [ ] `initialize()` hashes PRD using `hashPRD()`, searches `plan/` for matching hash
- [ ] `initialize()` creates new session via `createSessionDirectory()` if hash not found
- [ ] `initialize()` returns `SessionState` with metadata, prdSnapshot, taskRegistry, currentItemId
- [ ] `loadSession()` reads `tasks.json` via `readTasksJSON()` and `prd_snapshot.md`
- [ ] `loadSession()` reconstructs `SessionState` from disk
- [ ] `createDeltaSession()` computes hash of new PRD, compares with current session hash
- [ ] `createDeltaSession()` returns `DeltaSessionState` with oldPRD, newPRD, diffSummary
- [ ] `getSessionPath()` returns `plan/{sequence}_{hash}` format with zero-padded sequence
- [ ] All methods propagate `SessionFileError` from underlying utilities
- [ ] All methods use `readonly` properties for immutability
- [ ] Comprehensive test coverage with Vitest (100% line coverage)

## All Needed Context

### Context Completeness Check

✓ **"No Prior Knowledge" test**: A developer unfamiliar with this codebase can implement SessionManager using:

- Existing `session-utils.ts` functions (hashPRD, createSessionDirectory, read/writeTasksJSON)
- Existing models from `src/core/models.ts` (SessionState, SessionMetadata, DeltaSession)
- Class pattern from `src/tools/filesystem-mcp.ts` (constructor validation, async methods)
- Test patterns from `tests/unit/core/session-utils.test.ts` (mocking, factory functions)

### Documentation & References

```yaml
# CRITICAL: Must read before implementing
- file: src/core/session-utils.ts
  why: Contains all file system operations that SessionManager must use
  pattern: hashPRD() for PRD hashing, createSessionDirectory() for session creation, readTasksJSON/writeTasksJSON for state persistence
  gotcha: SessionFileError is thrown on all failures—catch and re-throw with context

- file: src/core/models.ts
  why: SessionState, SessionMetadata, DeltaSession interfaces that SessionManager must use
  pattern: Use readonly properties for immutability, Date objects for timestamps
  section: Lines 632-807 (SessionState interface definition)

- file: src/tools/filesystem-mcp.ts
  why: Class constructor pattern with validation and async methods
  pattern: Constructor validates inputs, stores readonly properties, async methods return promises
  section: Lines 487-520 (FilesystemMCP class constructor and method registration)

- file: tests/unit/core/session-utils.test.ts
  why: Test patterns for async file operations and error handling
  pattern: vi.mock() for fs/promises and crypto, factory functions for test data, expect().rejects.toThrow() for error tests
  section: Lines 220-294 (hashPRD test patterns), Lines 562-670 (readTasksJSON test patterns)

- docfile: plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Session Manager's role in the Four Core Processing Engines
  section: Lines 46-50 (Session Manager responsibilities), Lines 100-113 (Session Directory Structure)

# EXISTING CODEBASE CONVENTIONS
- file: src/config/types.ts
  why: Custom error class pattern (EnvironmentValidationError extends Error)
  pattern: Error class with readonly properties storing context (path, operation, code)
  gotcha: Always include error code (errno) for debugging

- file: src/agents/agent-factory.ts
  why: Async factory method pattern for class instantiation
  pattern: Static async methods that return new instances with initialized state

# TYPESCRIPT BEST PRACTICES (from codebase analysis)
- pattern: Use `readonly` for all class properties that should not be reassigned
- pattern: Use private properties (prefix with `#` or `private` keyword) for internal state
- pattern: Async methods should return `Promise<T>` with explicit type annotations
- pattern: Constructor should validate inputs but not perform async operations
- pattern: Use static factory methods for async initialization (initialize pattern)
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── package.json                     # Project dependencies (vitest, zod, typescript)
├── tsconfig.json                    # TypeScript compiler configuration
├── vitest.config.ts                 # Vitest test configuration
├── PRD.md                           # Product Requirements Document
├── plan/                            # Session directories (created by SessionManager)
│   └── 001_14b9dc2a33c7/            # Example session directory
│       ├── prd_snapshot.md          # PRD content at session initialization
│       ├── tasks.json               # Task hierarchy (Backlog)
│       ├── architecture/            # Architectural research
│       ├── prps/                    # Generated PRP documents
│       └── artifacts/               # Implementation artifacts
├── src/
│   ├── core/
│   │   ├── models.ts                # SessionState, SessionMetadata, DeltaSession interfaces
│   │   └── session-utils.ts         # hashPRD, createSessionDirectory, readTasksJSON, writeTasksJSON
│   ├── tools/
│   │   └── filesystem-mcp.ts        # Class pattern reference (constructor, async methods)
│   └── index.ts                     # Main entry point
└── tests/
    ├── unit/
    │   └── core/
    │       ├── session-utils.test.ts    # Test patterns for session utilities
    │       └── models.test.ts           # Test patterns for session models
    └── fixtures/
        └── mock-delta-data.ts           # Mock data for delta session tests
```

### Desired Codebase Tree (After Implementation)

```bash
/home/dustin/projects/hacky-hack
├── src/
│   └── core/
│       ├── models.ts                    # Existing: SessionState, SessionMetadata, DeltaSession
│       ├── session-utils.ts             # Existing: hashPRD, createSessionDirectory, read/writeTasksJSON
│       └── session-manager.ts           # NEW: SessionManager class (this PRP)
└── tests/
    └── unit/
        └── core/
            ├── session-utils.test.ts    # Existing: session utilities tests
            ├── models.test.ts           # Existing: session models tests
            └── session-manager.test.ts  # NEW: SessionManager class tests (this PRP)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: TypeScript/Node.js Constraints

// 1. Async Constructor Anti-Pattern
// TypeScript does NOT support async constructors. Do NOT try this:
// class BadSessionManager {
//   constructor async (prdPath: string) { ... } // SYNTAX ERROR!
// }
// SOLUTION: Use static factory method or separate initialize() method (see implementation)

// 2. File Path Resolution
// Always use resolve() from 'node:path' for absolute paths
// Relative paths may break when working directory changes
import { resolve } from 'node:path';
const absPath = resolve(prdPath); // Do this in constructor

// 3. Zod Schema.parse() throws ZodError
// When validating with BacklogSchema or other schemas, catch ZodError specifically
import { ZodError } from 'zod';
try {
  BacklogSchema.parse(data);
} catch (error) {
  if (error instanceof ZodError) {
    // Handle validation error
  }
}

// 4. SessionFileError Wraps File System Errors
// All session-utils functions throw SessionFileError with path, operation, code properties
// Catch SessionFileError, not Error, when calling these functions

// 5. Directory Idempotency
// createSessionDirectory() handles EEXIST gracefully—no need to catch it
// Other directories (architecture/, prps/, artifacts/) are created automatically

// 6. Hash Format for Session IDs
// Session ID format: {sequence}_{hash} where sequence is zero-padded to 3 digits
// Hash is first 12 characters of full SHA-256 hash (64 characters)
// Example: "001_14b9dc2a33c7" (sequence=1, hash="14b9dc2a33c7")

// 7. PRD Snapshot Storage
// PRD snapshot is stored at {sessionPath}/prd_snapshot.md
// Must be read separately from tasks.json (not embedded in SessionState)

// 8. Date Serialization
// SessionState.createdAt is a Date object, but JSON serializes to ISO string
// When reading from JSON, reconstruct Date: new Date(isoString)
```

## Implementation Blueprint

### Data Models and Structure

The SessionManager class uses existing models from `src/core/models.ts`:

```typescript
// FROM src/core/models.ts - Use these interfaces directly:

interface SessionMetadata {
  readonly id: string; // Format: "001_14b9dc2a33c7"
  readonly hash: string; // First 12 chars of SHA-256
  readonly path: string; // Absolute path to session directory
  readonly createdAt: Date; // Session creation timestamp
  readonly parentSession: string | null; // Parent session ID (delta sessions)
}

interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string; // Full PRD content
  readonly taskRegistry: Backlog; // Task hierarchy from tasks.json
  readonly currentItemId: string | null; // Currently executing task
}

interface DeltaSession extends SessionState {
  readonly oldPRD: string; // Original PRD content
  readonly newPRD: string; // Modified PRD content
  readonly diffSummary: string; // Human-readable diff description
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/core/session-manager.ts
  - IMPLEMENT: SessionManager class with constructor and properties
  - FOLLOW pattern: src/tools/filesystem-mcp.ts (constructor validation, readonly properties)
  - NAMING: PascalCase class name, camelCase properties
  - PROPERTIES: readonly prdPath (string), readonly planDir (string), private currentSession (SessionState | null)
  - CONSTRUCTOR: Validate PRD exists using fs.promises.access(), throw SessionFileError if not found
  - CONSTRUCTOR: Resolve absolute paths using resolve() from 'node:path'
  - PLACEMENT: src/core/ directory alongside models.ts and session-utils.ts

Task 2: IMPLEMENT getSessionPath() helper method
  - IMPLEMENT: getSessionPath(sequence: number, hash: string): string
  - LOGIC: Zero-pad sequence to 3 digits (String(sequence).padStart(3, '0'))
  - LOGIC: Return resolve(this.planDir, `${sequence}_${hash}`)
  - DEPENDENCIES: Requires constructor to have planDir property
  - PLACEMENT: Private method in SessionManager class

Task 3: IMPLEMENT async initialize() method
  - IMPLEMENT: async initialize(): Promise<SessionState>
  - LOGIC: Hash PRD using hashPRD(this.prdPath)
  - LOGIC: Extract session hash (first 12 chars) from full hash
  - LOGIC: Search plan/ directory for existing session with matching hash
  - LOGIC: If found: load session via loadSession()
  - LOGIC: If not found: create new session via createSessionDirectory(), write PRD snapshot, create empty task registry
  - RETURN: SessionState with metadata, prdSnapshot, taskRegistry (empty backlog), currentItemId (null)
  - DEPENDENCIES: Requires getSessionPath() for path building
  - PLACEMENT: Public async method in SessionManager class

Task 4: IMPLEMENT async loadSession() method
  - IMPLEMENT: async loadSession(sessionPath: string): Promise<SessionState>
  - LOGIC: Read tasks.json using readTasksJSON(sessionPath)
  - LOGIC: Read prd_snapshot.md using readFile from fs/promises
  - LOGIC: Parse session metadata from directory name (extract sequence and hash)
  - LOGIC: Check for parent session link (look for parent_session.txt or similar)
  - LOGIC: Construct SessionState object with readonly properties
  - RETURN: Fully populated SessionState
  - ERROR HANDLING: Throw SessionFileError if tasks.json or prd_snapshot.md not found
  - DEPENDENCIES: Requires session-utils.ts readTasksJSON()
  - PLACEMENT: Public async method in SessionManager class

Task 5: IMPLEMENT async createDeltaSession() method
  - IMPLEMENT: async createDeltaSession(newPRDPath: string): Promise<DeltaSessionState>
  - LOGIC: Validate new PRD exists (throw SessionFileError if not)
  - LOGIC: Hash new PRD using hashPRD(newPRDPath)
  - LOGIC: Compare with current session hash (from this.currentSession.metadata.hash)
  - LOGIC: Read old PRD content from this.currentSession.prdSnapshot
  - LOGIC: Read new PRD content from file
  - LOGIC: Generate diffSummary (for now: simple string comparison or placeholder)
  - LOGIC: Get next sequence number (current sequence + 1)
  - LOGIC: Create new session directory via createSessionDirectory(newPRDPath, newSequence)
  - LOGIC: Create DeltaSession object extending SessionState
  - RETURN: DeltaSessionState with oldPRD, newPRD, diffSummary
  - DEPENDENCIES: Requires initialize() to have been called first (currentSession exists)
  - PLACEMENT: Public async method in SessionManager class

Task 6: CREATE tests/unit/core/session-manager.test.ts
  - IMPLEMENT: Comprehensive unit tests for all SessionManager methods
  - FOLLOW pattern: tests/unit/core/session-utils.test.ts (mocking, factory functions, async testing)
  - NAMING: test files end with .test.ts, test functions use describe/it pattern
  - MOCK: vi.mock('node:fs/promises') for all file system operations
  - MOCK: vi.mock('node:crypto') for hash operations
  - MOCK: vi.mock('../src/core/session-utils.js') for session-utils functions
  - COVERAGE: Constructor validation (PRD exists, path resolution)
  - COVERAGE: initialize() method (new session creation, existing session loading)
  - COVERAGE: loadSession() method (tasks.json reading, prd_snapshot reading, metadata parsing)
  - COVERAGE: createDeltaSession() method (PRD comparison, delta state creation)
  - COVERAGE: getSessionPath() method (sequence padding, path building)
  - COVERAGE: Error handling (SessionFileError propagation, file not found, invalid data)
  - PLACEMENT: tests/unit/core/ directory

Task 7: UPDATE src/core/index.ts (if it exists)
  - EXPORT: SessionManager class from core module
  - PATTERN: export { SessionManager } from './session-manager.js'
  - DEPENDENCIES: Requires Task 1 completion
  - PLACEMENT: Add export to src/core/index.ts or create index.ts if not exists
```

### Implementation Patterns & Key Details

````typescript
// ===== CLASS STRUCTURE PATTERN =====
// Follow src/tools/filesystem-mcp.ts pattern for class structure

/**
 * Session Manager for PRP Pipeline state management
 *
 * @module core/session-manager
 *
 * @remarks
 * Provides centralized session state management, PRD hash-based initialization,
 * session discovery/loading, and delta session creation capabilities.
 *
 * Wraps existing session-utils.ts functions into a cohesive API.
 * Uses readonly properties for immutability and prevents state corruption.
 *
 * @example
 * ```typescript
 * import { SessionManager } from './core/session-manager.js';
 *
 * const manager = new SessionManager('./PRD.md');
 * const session = await manager.initialize();
 * console.log(session.metadata.id); // "001_14b9dc2a33c7"
 * ```
 */
export class SessionManager {
  // PATTERN: readonly properties prevent reassignment after construction
  readonly prdPath: string;
  readonly planDir: string;

  // PATTERN: Private property for mutable internal state
  // Use #private syntax (ES2022) or private keyword
  #currentSession: SessionState | null = null;

  /**
   * Creates a new SessionManager instance
   *
   * @param prdPath - Path to PRD markdown file (must exist)
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @throws {SessionFileError} If PRD file does not exist
   */
  constructor(prdPath: string, planDir: string = resolve('plan')) {
    // PATTERN: Validate inputs in constructor (not async!)
    const absPath = resolve(prdPath);

    // GOTCHA: Constructor must check file exists synchronously
    // Use fs.statSync for synchronous validation
    try {
      const stats = statSync(absPath);
      if (!stats.isFile()) {
        throw new SessionFileError(absPath, 'validate PRD path');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new SessionFileError(absPath, 'validate PRD exists', error as Error);
      }
      throw error;
    }

    this.prdPath = absPath;
    this.planDir = resolve(planDir);
    this.#currentSession = null;
  }

  // PATTERN: Getter for read-only access to internal state
  get currentSession(): SessionState | null {
    return this.#currentSession;
  }
}

// ===== SESSION DISCOVERY PATTERN =====
// Search plan/ directory for existing sessions with matching PRD hash

async initialize(): Promise<SessionState> {
  // 1. Hash the PRD
  const fullHash = await hashPRD(this.prdPath);
  const sessionHash = fullHash.slice(0, 12);

  // 2. Search for existing session with matching hash
  const existingSession = await this.findSessionByHash(sessionHash);

  if (existingSession) {
    // 3. Load existing session
    this.#currentSession = await this.loadSession(existingSession);
    return this.#currentSession;
  }

  // 4. Create new session
  const sequence = await this.getNextSequence();
  const sessionPath = await createSessionDirectory(this.prdPath, sequence);

  // 5. Write PRD snapshot
  const prdContent = await readFile(this.prdPath, 'utf-8');
  await writeFile(
    resolve(sessionPath, 'prd_snapshot.md'),
    prdContent,
    { mode: 0o644 }
  );

  // 6. Create SessionState with empty task registry
  const sessionId = `${String(sequence).padStart(3, '0')}_${sessionHash}`;
  const metadata: SessionMetadata = {
    id: sessionId,
    hash: sessionHash,
    path: sessionPath,
    createdAt: new Date(),
    parentSession: null,
  };

  this.#currentSession = {
    metadata,
    prdSnapshot: prdContent,
    taskRegistry: { backlog: [] }, // Empty until Architect Agent generates
    currentItemId: null,
  };

  return this.#currentSession;
}

// ===== SESSION LOADING PATTERN =====
// Reconstruct SessionState from disk

async loadSession(sessionPath: string): Promise<SessionState> {
  // 1. Read tasks.json
  const taskRegistry = await readTasksJSON(sessionPath);

  // 2. Read PRD snapshot
  const prdSnapshotPath = resolve(sessionPath, 'prd_snapshot.md');
  const prdSnapshot = await readFile(prdSnapshotPath, 'utf-8');

  // 3. Parse metadata from directory name
  const dirName = basename(sessionPath);
  const [sequence, hash] = dirName.split('_');

  // 4. Check for parent session (optional file: parent_session.txt)
  let parentSession: string | null = null;
  try {
    const parentPath = resolve(sessionPath, 'parent_session.txt');
    const parentContent = await readFile(parentPath, 'utf-8');
    parentSession = parentContent.trim();
  } catch {
    // No parent session file
  }

  // 5. Get directory creation time
  const stats = await stat(sessionPath);
  const createdAt = stats.mtime; // Use modification time as creation time

  const metadata: SessionMetadata = {
    id: dirName,
    hash,
    path: sessionPath,
    createdAt,
    parentSession,
  };

  return {
    metadata,
    prdSnapshot,
    taskRegistry,
    currentItemId: null, // Task Orchestrator will set this
  };
}

// ===== DELTA SESSION PATTERN =====
// Create linked session for PRD changes

async createDeltaSession(newPRDPath: string): Promise<DeltaSession> {
  if (!this.#currentSession) {
    throw new Error('Cannot create delta session: no current session loaded');
  }

  // 1. Validate new PRD exists
  const absPath = resolve(newPRDPath);
  try {
    await stat(absPath);
  } catch {
    throw new SessionFileError(absPath, 'validate new PRD exists');
  }

  // 2. Hash new PRD
  const newHash = await hashPRD(newPRDPath);
  const sessionHash = newHash.slice(0, 12);

  // 3. Read PRD contents
  const oldPRD = this.#currentSession.prdSnapshot;
  const newPRD = await readFile(absPath, 'utf-8');

  // 4. Generate diff summary (placeholder for now—Delta Analysis workflow will enhance)
  const diffSummary = this.generateDiffSummary(oldPRD, newPRD);

  // 5. Create new session directory
  const currentSeq = parseInt(this.#currentSession.metadata.id.split('_')[0]);
  const newSeq = currentSeq + 1;
  const sessionPath = await createSessionDirectory(newPRDPath, newSeq);

  // 6. Write parent session reference
  await writeFile(
    resolve(sessionPath, 'parent_session.txt'),
    this.#currentSession.metadata.id,
    { mode: 0o644 }
  );

  // 7. Create DeltaSessionState
  const sessionId = `${String(newSeq).padStart(3, '0')}_${sessionHash}`;
  const metadata: SessionMetadata = {
    id: sessionId,
    hash: sessionHash,
    path: sessionPath,
    createdAt: new Date(),
    parentSession: this.#currentSession.metadata.id,
  };

  return {
    metadata,
    prdSnapshot: newPRD,
    taskRegistry: { backlog: [] }, // Will be generated by Architect Agent
    currentItemId: null,
    oldPRD,
    newPRD,
    diffSummary,
  };
}

// ===== HELPER METHODS =====

private getSessionPath(sequence: number, hash: string): string {
  const paddedSeq = String(sequence).padStart(3, '0');
  return resolve(this.planDir, `${paddedSeq}_${hash}`);
}

private async findSessionByHash(hash: string): Promise<string | null> {
  // Search plan/ directory for directory ending with _{hash}
  const entries = await readdir(this.planDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith(`_${hash}`)) {
      return resolve(this.planDir, entry.name);
    }
  }
  return null;
}

private async getNextSequence(): Promise<number> {
  // Find highest sequence number in plan/ directory
  const entries = await readdir(this.planDir, { withFileTypes: true });
  let maxSeq = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const match = entry.name.match(/^(\d+)_/);
      if (match) {
        const seq = parseInt(match[1]);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }
  return maxSeq + 1;
}

private generateDiffSummary(oldPRD: string, newPRD: string): string {
  // Placeholder implementation—Delta Analysis workflow (P4.M1.T1) will enhance this
  const oldLines = oldPRD.split('\n').length;
  const newLines = newPRD.split('\n').length;
  return `PRD modified: ${oldLines} lines → ${newLines} lines. Full delta analysis required.`;
}
````

### Integration Points

```yaml
FILESYSTEM:
  - read: PRD file content, tasks.json, prd_snapshot.md
  - write: prd_snapshot.md, parent_session.txt
  - stat: Check PRD exists, get directory timestamps

SESSION_UTILS:
  - import: hashPRD, createSessionDirectory, readTasksJSON from './session-utils.js'
  - error handling: Catch SessionFileError from all session-utils calls

MODELS:
  - import: SessionState, SessionMetadata, DeltaSession from './models.js'
  - usage: Use these interfaces for all return types and internal state

NODE_MODULES:
  - node:fs/promises: readFile, writeFile, stat, readdir
  - node:path: resolve, basename, dirname
  - node:crypto: (used indirectly via hashPRD)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint              # ESLint: Check code style and catch errors
npm run format            # Prettier: Format code consistently

# TypeScript compilation check
npx tsc --noEmit          # Type check without emitting files

# Project-wide validation
npm run lint
npx tsc --noEmit
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test SessionManager class
npm test -- tests/unit/core/session-manager.test.ts

# Run with coverage
npm test -- --coverage tests/unit/core/session-manager.test.ts

# Full core module test suite
npm test -- tests/unit/core/

# Coverage validation
npm test -- --coverage --reporter=term-missing

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Target: 100% line coverage for session-manager.ts
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test - create a real session
# Create test PRD
echo "# Test PRD

This is a test PRD for SessionManager integration testing.
" > /tmp/test-prd.md

# Run integration test script (create in tests/manual/session-manager-integration.test.ts)
node --import tsx/esm --test tests/manual/session-manager-integration.test.ts

# Verify session directory was created
ls -la plan/

# Verify tasks.json exists
cat plan/001_*/tasks.json | jq .

# Verify prd_snapshot.md exists
cat plan/001_*/prd_snapshot.md

# Test session loading
# (Add manual test code to load existing session and verify state)

# Expected: Session directory created with all required files.
# SessionState properly reconstructed from disk.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Domain-Specific: Session Manager Workflow Validation

# 1. Test initial session creation workflow
# Create SessionManager, call initialize(), verify new session created

# 2. Test session resume workflow
# Create SessionManager, call loadSession() on existing session, verify state restored

# 3. Test delta session detection workflow
# Modify PRD, call createDeltaSession(), verify parent/child relationship

# 4. Test concurrent session management
# Create multiple sessions, verify sequence numbering (001, 002, 003)

# 5. Test error recovery scenarios
# - Missing PRD file (should throw SessionFileError)
# - Corrupted tasks.json (should throw SessionFileError)
# - Missing prd_snapshot.md (should throw SessionFileError)

# Manual validation checklist:
echo "Session Manager Validation Checklist"
echo "==================================="
echo "[] Constructor validates PRD exists"
echo "[] initialize() creates new session for new PRD"
echo "[] initialize() loads existing session for matching hash"
echo "[] loadSession() reconstructs SessionState from disk"
echo "[] createDeltaSession() creates linked session with parent reference"
echo "[] getSessionPath() returns correctly formatted path"
echo "[] All errors throw SessionFileError with context"
echo "[] currentSession is readonly (external access)"
echo "[] Session discovery finds existing sessions by hash"
echo "[] Sequence numbering is contiguous (001, 002, 003...)"
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/session-manager.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npm run format`
- [ ] 100% line coverage achieved

### Feature Validation

- [ ] Constructor validates PRD file exists before creating instance
- [ ] Constructor throws SessionFileError with path and operation for missing PRD
- [ ] `prdPath` and `planDir` are readonly (cannot be reassigned)
- [ ] `currentSession` is accessible via getter but not settable externally
- [ ] `initialize()` creates new session directory via createSessionDirectory()
- [ ] `initialize()` returns SessionState with populated metadata and empty taskRegistry
- [ ] `initialize()` writes PRD snapshot to prd_snapshot.md
- [ ] `initialize()` loads existing session if matching hash found
- [ ] `loadSession()` reads tasks.json and prd_snapshot.md from session directory
- [ ] `loadSession()` reconstructs SessionState with all required fields
- [ ] `createDeltaSession()` validates new PRD path exists
- [ ] `createDeltaSession()` hashes new PRD and compares with current session
- [ ] `createDeltaSession()` writes parent_session.txt to new session directory
- [ ] `createDeltaSession()` returns DeltaSession with oldPRD, newPRD, diffSummary
- [ ] `getSessionPath()` returns correctly formatted path with zero-padded sequence
- [ ] All file system errors propagate as SessionFileError
- [ ] All properties are immutable (readonly) after creation
- [ ] Session discovery searches plan/ directory for matching hash

### Code Quality Validation

- [ ] Follows existing codebase patterns (FilesystemMCP, session-utils)
- [ ] File placement matches desired codebase tree (src/core/session-manager.ts)
- [ ] JSDoc comments present for class, constructor, and all public methods
- [ ] Error messages are descriptive and include context (path, operation)
- [ ] Uses existing session-utils functions (no duplicate file system code)
- [ ] Uses existing models from src/core/models.ts (no duplicate interfaces)
- [ ] Async methods return Promise<T> with explicit type annotations
- [ ] Constructor performs synchronous validation only (no async operations)

### Documentation & Deployment

- [ ] Module-level JSDoc explains SessionManager purpose and usage
- [ ] Method JSDoc includes @param, @returns, @throws tags
- [ ] Example code in JSDoc demonstrates typical usage
- [ ] Code is self-documenting with clear variable and method names
- [ ] Exported from src/core/index.ts (or appropriate index file)

---

## Anti-Patterns to Avoid

- ❌ **Don't create async constructor**: TypeScript doesn't support async constructors—use initialize() method instead
- ❌ **Don't duplicate file system code**: Use existing session-utils functions (hashPRD, createSessionDirectory, readTasksJSON)
- ❌ **Don't make properties mutable**: Use `readonly` for all properties that shouldn't change after construction
- ❌ **Don't skip PRD validation**: Constructor must verify PRD exists synchronously
- ❌ **Don't ignore existing sessions**: initialize() must search plan/ for matching hash before creating new session
- ❌ **Don't use relative paths**: Always resolve() to absolute paths to avoid breakage when working directory changes
- ❌ **Don't swallow SessionFileError**: Propagate errors with context, don't catch and re-throw generic Error
- ❌ **Don't create duplicate interfaces**: Use SessionState, SessionMetadata from models.ts
- ❌ **Don't write tests without mocking**: All file system operations must be mocked in tests
- ❌ **Don't forget to update currentSession**: All methods that load/create sessions must set #currentSession
