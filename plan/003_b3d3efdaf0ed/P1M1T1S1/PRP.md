# PRP: P1.M1.T1.S1 - Verify session directory structure and naming conventions

## Goal

**Feature Goal**: Create an integration test that validates the session directory structure, naming conventions, and atomic write patterns used by the SessionManager for PRD-based session initialization.

**Deliverable**: Integration test file `tests/integration/core/session-structure.test.ts` with comprehensive coverage of session creation, directory layout, and atomic write validation.

**Success Definition**:

- All 4 validation requirements from CONTRACT DEFINITION are tested and passing
- Test file runs successfully with `npm test` and achieves 100% code coverage for tested paths
- Test uses real filesystem operations in temp directories (not mocks) for true integration validation
- Test validates session naming pattern matches `{sequence}_{hash}` format exactly

## Why

**Business Value**: Validates the foundational session management system that tracks all PRD pipeline state. Incorrect session structure would break task tracking, delta detection, and resume capabilities across the entire system.

**Integration Points**:

- Validates `SessionManager.initialize()` from `src/core/session-manager.ts` (lines 210-472)
- Validates `createSessionDirectory()` from `src/core/session-utils.ts` (lines 285-371)
- Validates `atomicWrite()` internal function from `src/core/session-utils.ts` (lines 99-180)
- Validates hash computation from `hashPRD()` in `src/core/session-utils.ts` (lines 229-255)

**Problems Solved**:

- Ensures session directories are created with correct `{sequence}_{hash}` naming pattern
- Verifies PRD hash computation uses SHA-256 with exactly 12-character slice
- Confirms all required subdirectories (architecture/, prps/, artifacts/) are created
- Validates atomic write pattern (temp file + rename) prevents data corruption

## What

**User-Visible Behavior**: Test validates session creation internals - no direct user-visible behavior, but ensures the pipeline correctly creates and manages session directories.

**Success Criteria**:

- [ ] Test verifies session directory name matches `/^(\d{3})_([a-f0-9]{12})$/` regex pattern
- [ ] Test verifies PRD hash is SHA-256 with first 12 characters used in session ID
- [ ] Test verifies all required subdirectories exist: `architecture/`, `prps/`, `artifacts/`
- [ ] Test verifies required root files exist: `tasks.json`, `prd_snapshot.md`
- [ ] Test verifies atomic write pattern uses temp file + rename for `tasks.json`
- [ ] Test uses temp directory cleanup with `mkdtempSync` and `rmSync`
- [ ] All tests pass with `vitest run tests/integration/core/session-structure.test.ts`

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Core implementation files

- file: src/core/session-manager.ts
  why: Main session management logic - contains SESSION_DIR_PATTERN regex (line 63), initialize() method (lines 210-472), and session creation flow
  pattern: Look for `SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/` and `async initialize()` method
  gotcha: The session ID is built as `${String(sequence).padStart(3, '0')}_${sessionHash}` where sessionHash is `fullHash.slice(0, 12)`

- file: src/core/session-utils.ts
  why: Low-level file system utilities - contains hashPRD(), createSessionDirectory(), atomicWrite(), writeTasksJSON()
  pattern: Look for `export async function hashPRD()`, `export async function createSessionDirectory()`, and `async function atomicWrite()`
  gotcha: The atomic write pattern creates a temp file with `randomBytes(8).toString('hex')` then uses `rename()` for atomicity

- file: src/core/models.ts
  why: Type definitions for SessionState, SessionMetadata, Backlog - needed to understand session structure
  pattern: Look for `interface SessionMetadata` and `interface SessionState`
  gotcha: SessionMetadata.hash is exactly 12 characters (first 12 of SHA-256)

- file: tests/integration/core/session-manager.test.ts
  why: Example integration test pattern using real filesystem in temp directories
  pattern: Uses `mkdtempSync()` for temp dir creation, `writeFileSync()` for PRD setup, `rmSync()` for cleanup
  gotcha: Test setup creates actual PRD file, then calls `sessionManager.initialize()` and validates real filesystem state

- file: tests/unit/core/session-utils.test.ts
  why: Reference for mock patterns and atomic write testing
  pattern: Look for atomic write test cases verifying temp file + rename sequence
  gotcha: Unit tests use mocks - integration tests should use real filesystem for validation

# CRITICAL PATTERNS - Session directory naming

- docfile: src/core/session-manager.ts
  section: Line 63 - SESSION_DIR_PATTERN
  why: Defines exact naming convention: `^(\d{3})_([a-f0-9]{12})$`
  pattern: sequence is 3-digit zero-padded, hash is 12-char lowercase hex

- docfile: src/core/session-utils.ts
  section: Lines 229-255 - hashPRD function
  why: Shows SHA-256 hash computation and 12-character slice pattern
  pattern: `const fullHash = createHash('sha256').update(content).digest('hex')` then `sessionHash = fullHash.slice(0, 12)`

- docfile: src/core/session-utils.ts
  section: Lines 285-371 - createSessionDirectory function
  why: Shows subdirectory creation pattern (architecture, prps, artifacts)
  pattern: Creates 4 directories: sessionPath, architecture/, prps/, artifacts/

- docfile: src/core/session-utils.ts
  section: Lines 99-180 - atomicWrite function
  why: Shows temp file + rename pattern for atomic writes
  pattern: Temp file format: `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
```

### Current Codebase Tree

```bash
tests/
├── integration/
│   └── core/
│       └── session-manager.test.ts    # Reference integration test pattern
├── unit/
│   └── core/
│       ├── session-utils.test.ts      # Reference for atomic write tests
│       └── session-manager.test.ts    # Reference for session manager unit tests
├── fixtures/
│   ├── simple-prd.ts                  # Mock PRD data
│   └── simple-prd-v2.ts               # Mock PRD v2 for delta tests
└── setup.ts                           # Global test setup

src/
└── core/
    ├── session-manager.ts             # Main session manager (1172 lines)
    ├── session-utils.ts               # File system utilities
    └── models.ts                      # Type definitions
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
├── integration/
│   └── core/
│       ├── session-manager.test.ts    # (existing - reference)
│       └── session-structure.test.ts  # NEW - Integration test for session structure
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Session ID format must match exactly: {sequence}_{hash}
// sequence: 3-digit zero-padded (001, 002, etc.)
// hash: 12-character lowercase hexadecimal (first 12 chars of SHA-256)
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

// CRITICAL: Hash computation uses SHA-256, then slice(0, 12)
const fullHash = createHash('sha256').update(content).digest('hex');
const sessionHash = fullHash.slice(0, 12); // First 12 chars ONLY

// CRITICAL: Integration tests use REAL filesystem, not mocks
// Use mkdtempSync() for temp directory creation
// Use rmSync(tempDir, { recursive: true, force: true }) for cleanup

// CRITICAL: Vitest requires specific import patterns for mocked modules
// All vi.mock() calls must be at TOP LEVEL before imports

// CRITICAL: Atomic write pattern verification
// Temp file created: .tasks.json.{random}.tmp
// Rename: temp -> tasks.json (atomic on same filesystem)

// CRITICAL: File permissions
// Directories: 0o755 (rwxr-xr-x)
// Files: 0o644 (rw-r--r--)

// GOTCHA: SessionManager.validatePRD() is called during initialize()
// The test PRD must be valid markdown or validation will fail

// GOTCHA: SessionManager constructor validates PRD exists synchronously
// Must use writeFileSync() to create PRD before instantiating SessionManager

// GOTCHA: Plan directory may not exist for first session
// SessionManager handles ENOENT gracefully in __scanSessionDirectories()
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Import types from existing models
import { SessionManager } from '../../../src/core/session-manager.js';
import { SessionFileError } from '../../../src/core/session-utils.js';
import type { SessionState, Backlog } from '../../../src/core/models.js';

// Test fixtures
import { mockSimplePRD } from '../../fixtures/simple-prd.js';

// File system utilities
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';

import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/core/session-structure.test.ts
  - IMPLEMENT: Integration test file with describe block for session structure validation
  - FOLLOW pattern: tests/integration/core/session-manager.test.ts (temp directory setup/teardown)
  - NAMING: session-structure.test.ts (integration test naming convention)
  - PLACEMENT: tests/integration/core/ directory (alongside other integration tests)

Task 2: IMPLEMENT temp directory setup and teardown
  - IMPLEMENT: beforeEach() creating temp dir with mkdtempSync(join(tmpdir(), 'session-structure-test-'))
  - IMPLEMENT: afterEach() cleaning up with rmSync(tempDir, { recursive: true, force: true })
  - FOLLOW pattern: tests/integration/core/session-manager.test.ts (lines 43-51)
  - VARIABLE: let tempDir: string at describe block scope

Task 3: IMPLEMENT session directory creation test
  - IMPLEMENT: it('should create session directory with correct naming pattern')
  - CREATE: Test PRD file with writeFileSync(join(tempDir, 'PRD.md'), '# Test PRD\n\nContent')
  - EXECUTE: const manager = new SessionManager(prdPath, planDir); const session = await manager.initialize()
  - VERIFY: Session directory name matches /^(\d{3})_([a-f0-9]{12})$/ regex
  - VERIFY: Sequence is zero-padded to 3 digits (String(seq).padStart(3, '0'))
  - VERIFY: Hash is exactly 12 lowercase hex characters

Task 4: IMPLEMENT PRD hash computation validation test
  - IMPLEMENT: it('should compute PRD hash using SHA-256 with 12-char slice')
  - CREATE: Test PRD with known content
  - COMPUTE: Expected hash using createHash('sha256').update(content).digest('hex').slice(0, 12)
  - VERIFY: session.metadata.hash equals expected hash (first 12 chars of SHA-256)
  - VERIFY: Hash length is exactly 12 characters
  - VERIFY: Hash contains only lowercase hexadecimal characters

Task 5: IMPLEMENT required subdirectories validation test
  - IMPLEMENT: it('should create all required subdirectories')
  - VERIFY: existsSync(join(sessionPath, 'architecture')) === true
  - VERIFY: existsSync(join(sessionPath, 'prps')) === true
  - VERIFY: existsSync(join(sessionPath, 'artifacts')) === true
  - VERIFY: readdirSync(sessionPath) contains these three subdirectories

Task 6: IMPLEMENT required files validation test
  - IMPLEMENT: it('should create required files in session root')
  - VERIFY: existsSync(join(sessionPath, 'tasks.json')) === true
  - VERIFY: existsSync(join(sessionPath, 'prd_snapshot.md')) === true
  - VERIFY: tasks.json contains valid Backlog JSON (parse and validate)

Task 7: IMPLEMENT atomic write pattern validation test
  - IMPLEMENT: it('should use atomic write pattern for tasks.json')
  - SETUP: Mock spy on writeFile and rename from node:fs/promises
  - EXECUTE: Trigger tasks.json write via session initialization
  - VERIFY: writeFile called with temp file path (*.tmp suffix)
  - VERIFY: rename called with (tempPath, tasksJsonPath)
  - VERIFY: rename happens AFTER writeFile completes

Task 8: IMPLEMENT file permissions validation test
  - IMPLEMENT: it('should create directories with mode 0o755')
  - VERIFY: statSync(directoryPath).mode & 0o777 equals 0o755
  - IMPLEMENT: it('should create files with mode 0o644')
  - VERIFY: statSync(filePath).mode & 0o777 equals 0o644

Task 9: IMPLEMENT sequential session numbering test
  - IMPLEMENT: it('should increment session sequence number correctly')
  - SETUP: Create first session, verify sequence is 001
  - SETUP: Create second session with different PRD (different hash), verify sequence is 002
  - VERIFY: SessionManager.__scanSessionDirectories() finds existing sessions
  - VERIFY: #getNextSequence() returns max(existing) + 1
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Temp directory setup and cleanup (from session-manager.test.ts)
describe('Session Directory Structure', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-structure-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

// PATTERN: Session naming validation
it('should create session directory with {sequence}_{hash} format', async () => {
  // SETUP: Create test PRD
  const prdPath = join(tempDir, 'PRD.md');
  const prdContent = '# Test PRD\n\nThis is a test PRD.';
  writeFileSync(prdPath, prdContent, { mode: 0o644 });

  // EXECUTE: Initialize session
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();

  // VERIFY: Session ID matches pattern
  const sessionPattern = /^(\d{3})_([a-f0-9]{12})$/;
  expect(session.metadata.id).toMatch(sessionPattern);

  // VERIFY: Extract components and validate
  const match = session.metadata.id.match(sessionPattern);
  expect(match).not.toBeNull();
  const [, sequence, hash] = match!;

  // VERIFY: Sequence is zero-padded to 3 digits
  expect(sequence).toHaveLength(3);
  expect(parseInt(sequence, 10)).toBeGreaterThanOrEqual(1);

  // VERIFY: Hash is exactly 12 lowercase hex characters
  expect(hash).toHaveLength(12);
  expect(hash).toMatch(/^[a-f0-9]{12}$/);
});

// PATTERN: PRD hash computation validation
it('should compute SHA-256 hash and use first 12 characters', async () => {
  // SETUP: Create PRD with known content
  const prdPath = join(tempDir, 'PRD.md');
  const prdContent = '# Test PRD\n\nConsistent content for hash testing.';
  writeFileSync(prdPath, prdContent);

  // COMPUTE: Expected hash
  const fullHash = createHash('sha256').update(prdContent).digest('hex');
  const expectedHash = fullHash.slice(0, 12);

  // EXECUTE: Initialize session
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();

  // VERIFY: Hash matches expected (first 12 chars of SHA-256)
  expect(session.metadata.hash).toBe(expectedHash);

  // VERIFY: Hash is deterministic (same PRD = same hash)
  const manager2 = new SessionManager(prdPath, planDir);
  const session2 = await manager2.initialize();
  expect(session2.metadata.hash).toBe(expectedHash);
});

// PATTERN: Required subdirectories validation
it('should create architecture, prps, and artifacts subdirectories', async () => {
  // SETUP: Create test PRD
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, '# Test PRD');

  // EXECUTE: Initialize session
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();
  const sessionPath = session.metadata.path;

  // VERIFY: All subdirectories exist
  const requiredSubdirs = ['architecture', 'prps', 'artifacts'];
  for (const subdir of requiredSubdirs) {
    const subdirPath = join(sessionPath, subdir);
    expect(existsSync(subdirPath)).toBe(true);

    // VERIFY: It's actually a directory
    const stats = statSync(subdirPath);
    expect(stats.isDirectory()).toBe(true);
  }

  // VERIFY: No unexpected subdirectories in root
  const entries = readdirSync(sessionPath, { withFileTypes: true });
  const directories = entries.filter(e => e.isDirectory()).map(e => e.name);
  expect(directories).toEqual(expect.arrayContaining(requiredSubdirs));
});

// PATTERN: Required files validation
it('should create tasks.json and prd_snapshot.md in session root', async () => {
  // SETUP & EXECUTE
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, '# Test PRD');
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();
  const sessionPath = session.metadata.path;

  // VERIFY: tasks.json exists and contains valid JSON
  const tasksPath = join(sessionPath, 'tasks.json');
  expect(existsSync(tasksPath)).toBe(true);
  const tasksContent = readFileSync(tasksPath, 'utf-8');
  const tasksData = JSON.parse(tasksContent);
  expect(tasksData).toHaveProperty('backlog');
  expect(Array.isArray(tasksData.backlog)).toBe(true);

  // VERIFY: prd_snapshot.md exists and contains PRD content
  const snapshotPath = join(sessionPath, 'prd_snapshot.md');
  expect(existsSync(snapshotPath)).toBe(true);
  const snapshotContent = readFileSync(snapshotPath, 'utf-8');
  expect(snapshotContent).toContain('# Test PRD');
});

// CRITICAL: Testing atomic write pattern requires spies, not full mocks
// Use vi.spyOn() to observe real filesystem operations
import { vi } from 'vitest';
import { promises as fs } from 'node:fs';

it('should use atomic write pattern (temp file + rename)', async () => {
  // SETUP: Create test PRD
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, '# Test PRD');

  // SPY on filesystem operations (don't mock - observe real behavior)
  const writeFileSpy = vi.spyOn(fs, 'writeFile');
  const renameSpy = vi.spyOn(fs, 'rename');

  try {
    // EXECUTE: Initialize session
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // VERIFY: writeFile was called (for tasks.json via atomicWrite)
    expect(writeFileSpy).toHaveBeenCalled();
    const writeFileCalls = writeFileSpy.mock.calls;

    // FIND: Temp file write call (contains .tmp suffix)
    const tempFileCall = writeFileCalls.find(
      call => call[0] && String(call[0]).includes('.tmp')
    );
    expect(tempFileCall).toBeDefined();

    // VERIFY: rename was called for atomic operation
    expect(renameSpy).toHaveBeenCalled();
    const renameCalls = renameSpy.mock.calls;

    // VERIFY: At least one rename from temp to target
    const atomicRename = renameCalls.find(
      call => call[0] && String(call[0]).includes('.tmp')
    );
    expect(atomicRename).toBeDefined();
  } finally {
    // CLEANUP: Always restore spies
    writeFileSpy.mockRestore();
    renameSpy.mockRestore();
  }
});

// GOTCHA: For atomic write verification, the temp file naming pattern is:
// .tasks.json.{random-hex}.tmp
// Example: .tasks.json.abc123def456.tmp
```

### Integration Points

```yaml
SESSION_MANAGER:
  - class: SessionManager from src/core/session-manager.ts
  - method: async initialize(): Promise<SessionState>
  - method: constructor(prdPath: string, planDir?: string)

SESSION_UTILS:
  - function: hashPRD(prdPath: string): Promise<string> (returns 64-char hex)
  - function: createSessionDirectory(prdPath, sequence, planDir): Promise<string>
  - function: writeTasksJSON(sessionPath, backlog): Promise<void>
  - internal: atomicWrite(targetPath, data): Promise<void>

MODELS:
  - interface: SessionMetadata { id, hash, path, createdAt, parentSession }
  - interface: SessionState { metadata, prdSnapshot, taskRegistry, currentItemId }
  - interface: Backlog { backlog: Phase[] }

TEST_FRAMEWORK:
  - runner: Vitest (configured in vitest.config.ts)
  - environment: node (from vitest.config.ts)
  - coverage: v8 provider with 100% threshold
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit tests/integration/core/session-structure.test.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run ESLint to check code style
npx eslint tests/integration/core/session-structure.test.ts --fix

# Expected: Zero linting errors. Auto-fix should handle formatting issues.

# Run Prettier for consistent formatting
npx prettier --write tests/integration/core/session-structure.test.ts

# Expected: File formatted successfully.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the new integration test file
npx vitest run tests/integration/core/session-structure.test.ts

# Expected: All tests pass. Check output for any failures.

# Run all integration tests to ensure no regressions
npx vitest run tests/integration/

# Expected: All integration tests pass.

# Run with coverage report
npx vitest run tests/integration/core/session-structure.test.ts --coverage

# Expected: Coverage shows tested code paths (SessionManager.initialize, createSessionDirectory, etc.)
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite execution
npm test

# Expected: All tests pass (unit + integration).

# Verify no regressions in existing tests
npx vitest run tests/integration/core/session-manager.test.ts

# Expected: Existing session-manager integration tests still pass.

# Test project-wide validation
npm run validate

# Expected: All validation checks pass (linting, typecheck, formatting).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual verification: Run test and inspect temp directory creation
# Add temporary logging or breakpoint to see actual temp directory path

# Domain-specific: Verify session naming matches production pattern
# Compare test output with actual session in plan/003_b3d3efdaf0ed/

# Test edge cases:
# - Empty PRD (should fail validation)
# - Very long PRD (should hash correctly)
# - Non-ASCII characters in PRD (should handle UTF-8)
# - Concurrent session creation (if applicable)
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npx vitest run tests/integration/core/session-structure.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/integration/core/session-structure.test.ts`
- [ ] No linting errors: `npx eslint tests/integration/core/session-structure.test.ts`
- [ ] No formatting issues: `npx prettier --check tests/integration/core/session-structure.test.ts`

### Feature Validation

- [ ] Session directory name matches `/^(\d{3})_([a-f0-9]{12})$/` pattern
- [ ] PRD hash computed as SHA-256 with first 12 characters
- [ ] All required subdirectories created: architecture/, prps/, artifacts/
- [ ] All required files created: tasks.json, prd_snapshot.md
- [ ] Atomic write pattern verified: temp file + rename
- [ ] File permissions correct: directories 0o755, files 0o644
- [ ] Temp directory cleanup works: rmSync with recursive: true

### Code Quality Validation

- [ ] Follows existing test patterns from session-manager.test.ts
- [ ] Test isolation: beforeEach/afterEach properly implemented
- [ ] Descriptive test names following "should..." convention
- [ ] Proper assertions with clear failure messages
- [ ] No hardcoded paths (use join/resolve for cross-platform compatibility)

### Documentation & Deployment

- [ ] Test file has JSDoc comments explaining purpose
- [ ] Complex test logic has inline comments
- [ ] Test follows Setup/Execute/Verify pattern consistently

## Anti-Patterns to Avoid

- ❌ Don't use mocks for filesystem operations in integration tests (use real fs in temp directories)
- ❌ Don't skip temp directory cleanup (always use afterEach with rmSync)
- ❌ Don't hardcode temp directory paths (use mkdtempSync from node:os)
- ❌ Don't assume session sequence is always 001 (test with multiple sessions)
- ❌ Don't forget to verify hash is exactly 12 characters (not full 64-char SHA-256)
- ❌ Don't forget to verify hash is lowercase hexadecimal (mixed case would be wrong)
- ❌ Don't use sync file operations during async test execution (use writeFileSync only in setup)
- ❌ Don't forget to spy on node:fs/promises for atomic write verification (not full mock)
- ❌ Don't create test PRDs with invalid markdown (SessionManager validates PRD structure)
- ❌ Don't forget to restore vi.spyOn() spies in finally blocks (always use mockRestore)
- ❌ Don't assume file permissions on Windows (mode checks may behave differently)
- ❌ Don't use relative paths without resolve/resolve (always use absolute paths in tests)
