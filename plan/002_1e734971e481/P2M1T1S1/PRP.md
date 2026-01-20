# Product Requirement Prompt (PRP): Test New Session Creation

**PRP ID**: P2.M1.T1.S1
**Generated**: 2026-01-15
**Story Points**: 2

---

## Goal

**Feature Goal**: Create comprehensive integration tests for SessionManager.initialize() to validate new session creation with real filesystem operations, ensuring proper directory structure, file creation, and hash-based session detection.

**Deliverable**: New integration test file at `tests/integration/core/session-manager.test.ts` with full coverage of new session creation scenarios using real filesystem operations in temp directories.

**Success Definition**:
- Session directory created with correct format `plan/{sequence}_{hash}/` (zero-padded sequence, 12-char hash)
- `tasks.json` created with empty backlog structure `{ backlog: [] }`
- `prd_snapshot.md` copied with identical content to original PRD
- PRD hash changes trigger new session creation (unique hash detection)
- Sequential session numbering works correctly (001, 002, etc.)
- All integration tests use real filesystem operations (not mocked)
- Tests pass with 100% coverage of new session creation code paths

---

## User Persona

**Target User**: Developer working on SessionManager validation who needs assurance that new session creation works correctly with real filesystem operations.

**Use Case**: Validating that SessionManager.initialize() creates proper session structures on disk for new PRDs, which is foundational for the entire PRP pipeline.

**User Journey**:
1. Developer creates new PRD file
2. SessionManager.initialize() is called with PRD path
3. SHA-256 hash is computed from PRD content
4. plan/ directory is scanned for matching hash (not found)
5. New session directory created: `plan/{sequence}_{hash}/`
6. PRD snapshot copied to `prd_snapshot.md`
7. Empty tasks.json created
8. SessionState returned with metadata
9. Integration tests verify all steps completed correctly

**Pain Points Addressed**:
- **Unit test coverage gaps**: Existing unit tests mock filesystem, hiding real-world integration issues
- **Directory structure bugs**: Session directories may not be created correctly in real filesystems
- **Hash computation issues**: PRD hashing may fail with real file encodings
- **File permission problems**: Mocked tests don't catch permission/mode issues
- **Path resolution errors**: Relative vs absolute path issues only appear with real filesystems

---

## Why

- **Foundation Validation**: Session initialization is the entry point for the entire PRP pipeline. If this fails, everything fails.
- **Real-World Confidence**: Unit tests with mocks can't catch filesystem-specific bugs (encoding, permissions, path resolution).
- **Integration vs Unit Distinction**: Existing unit tests (2613 lines) use mocks. Integration tests validate actual behavior with real filesystems.
- **Hash-Based Session Detection**: Core feature that prevents duplicate sessions for identical PRDs. Must work correctly.
- **Directory Structure Contract**: Session directory format `plan/{sequence}_{hash}/` is a contract used by entire pipeline. Must be enforced.
- **Atomic Operations**: File writes must be atomic to prevent corruption. Integration tests verify this.
- **Regression Prevention**: Changes to SessionManager won't break session creation if integration tests catch issues.
- **Problems Solved**:
  - "Does SessionManager correctly create session directories on real filesystems?"
  - "Does PRD hashing produce consistent results across different encodings?"
  - "Are session files created with correct permissions and content?"
  - "Does sequential numbering work when multiple sessions exist?"

---

## What

Create a new integration test file at `tests/integration/core/session-manager.test.ts` to validate new session creation with real filesystem operations.

### Current State Analysis

**SessionManager.initialize() Method** (from `/src/core/session-manager.ts` lines 210-336):
```typescript
async initialize(): Promise<SessionState> {
  // 1. Hash PRD
  const fullHash = await hashPRD(this.prdPath);
  const sessionHash = fullHash.slice(0, 12);

  // 2. Validate PRD via PRDValidator
  const validator = new PRDValidator();
  const validationResult = await validator.validate(this.prdPath);
  if (!validationResult.valid) {
    throw new ValidationError(...);
  }

  // 3. Search for existing session
  const existingSession = await this.#findSessionByHash(sessionHash);

  // 4. If found, load existing
  if (existingSession) {
    return await this.loadSession(existingSession);
  }

  // 5. If not found, create new session
  const sequence = await this.#getNextSequence();
  const sessionPath = await createSessionDirectory(
    this.prdPath,
    sequence,
    this.planDir
  );

  // 6. Write PRD snapshot
  const prdContent = await readFile(this.prdPath, 'utf-8');
  await writeFile(resolve(sessionPath, 'prd_snapshot.md'), prdContent, {
    mode: 0o644,
  });

  // 7. Create SessionState with empty backlog
  this.#currentSession = {
    metadata: { /* ... */ },
    prdSnapshot: prdContent,
    taskRegistry: { backlog: [] },
    currentItemId: null,
  };

  return this.#currentSession;
}
```

**Existing Unit Tests** (from `/tests/unit/core/session-manager.test.ts`):
- Use `vi.mock()` for all filesystem operations
- Test hashPRD calling, readdir searching, new session creation
- Test PRD snapshot writing, SessionState return value
- Test existing session loading
- **MISSING**: Real filesystem validation
- **MISSING**: Actual directory structure verification
- **MISSING**: Real file content verification
- **MISSING**: Permission/mode validation
- **MISSING**: Sequential numbering with real directories

**hashPRD Implementation** (from `/src/core/session-utils.ts` lines 160-167):
```typescript
export async function hashPRD(prdPath: string): Promise<string> {
  const content = await readFile(prdPath, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}
```

**Session Directory Structure** (created by `createSessionDirectory`):
```
plan/
  └── {sequence}_{hash}/          # e.g., 001_14b9dc2a33c7/
      ├── architecture/           # Created by mkdir
      ├── prps/                   # Created by mkdir
      ├── artifacts/              # Created by mkdir
      ├── tasks.json              # Created later by saveBacklog()
      ├── prd_snapshot.md         # Created by initialize()
      └── parent_session.txt      # For delta sessions only
```

**Session Directory Format**:
- Pattern: `/^(\d{3})_([a-f0-9]{12})$/`
- Sequence: Zero-padded 3 digits (001, 002, ..., 999)
- Hash: First 12 characters of SHA-256 hash
- Example: `001_14b9dc2a33c7`

### Success Criteria

- [ ] Test 1: New session created with unique PRD hash
- [ ] Test 2: Session directory format validated (sequence_hash)
- [ ] Test 3: Zero-padded sequence number (3 digits)
- [ ] Test 4: Hash is first 12 characters of SHA-256
- [ ] Test 5: tasks.json created with empty backlog
- [ ] Test 6: prd_snapshot.md copied with identical content
- [ ] Test 7: PRD hash change creates new session (hash mismatch detection)
- [ ] Test 8: Sequential session numbering (001, 002, 003)
- [ ] Test 9: SessionState returned with correct metadata
- [ ] Test 10: Subdirectories created (architecture/, prps/, artifacts/)
- [ ] All tests use real filesystem (temp directories)
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] SessionManager.initialize() method fully analyzed (lines 210-336)
- [x] hashPRD implementation documented (session-utils.ts lines 160-167)
- [x] Session directory format specified (sequence_hash pattern)
- [x] File structure requirements documented (tasks.json, prd_snapshot.md, subdirs)
- [x] Existing unit tests reviewed (to avoid duplication)
- [x] Integration test patterns identified (temp dirs, real fs)
- [x] Vitest configuration documented (globals, environment)
- [x] Test file naming conventions confirmed
- [x] Codebase tree structure analyzed
- [x] Scope boundaries defined (integration vs unit tests)

---

### Documentation & References

```yaml
# MUST READ - SessionManager.initialize() implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains initialize() method (lines 210-336) with new session creation logic
  section: Lines 210-336
  critical: |
    - Hashes PRD using hashPRD() utility
    - Validates PRD via PRDValidator
    - Searches for existing session by hash
    - Creates new session if not found
    - Writes prd_snapshot.md
    - Returns SessionState with empty backlog

# MUST READ - hashPRD implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Contains hashPRD() function (lines 160-167) that computes SHA-256 hash
  section: Lines 160-167
  pattern: |
    - Reads PRD as UTF-8
    - Uses crypto.createHash('sha256')
    - Returns 64-character hex string
    - Session uses first 12 characters
  gotcha: |
    - Hash is sensitive to file encoding (must be UTF-8)
    - Hash is sensitive to whitespace/line endings
    - Consistent hashing is critical for session detection

# MUST READ - createSessionDirectory implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Creates session directory structure (lines 197-242)
  section: Lines 197-242
  pattern: |
    - Computes PRD hash
    - Builds session ID: {sequence}_{hash}
    - Creates directory with subdirs
    - Uses recursive: true, mode: 0o755
  critical: |
    - Creates architecture/, prps/, artifacts/ subdirs
    - Uses EEXIST error handling (idempotent)
    - Returns session path

# MUST READ - Session directory format regex
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Defines session directory naming pattern (line 63)
  section: Line 63
  pattern: |
    - Regex: /^(\d{3})_([a-f0-9]{12})$/
    - Matches: 001_14b9dc2a33c7
    - Sequence: 3-digit zero-padded
    - Hash: 12-character hex string

# MUST READ - getSessionPath implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Shows zero-padding logic for sequence numbers (line 168)
  section: Line 168
  pattern: |
    - String(sequence).padStart(3, '0')
    - Ensures 001, 002, 003 format

# MUST READ - Existing integration test patterns
- file: /home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-integration.test.ts
  why: Reference for temp directory usage and real filesystem patterns
  section: Full file
  pattern: |
    - Uses mkdtempSync(join(tmpdir(), 'prp-pipeline-test-'))
    - Cleans up with rmSync(tempDir, { recursive: true, force: true })
    - Uses beforeEach/afterEach for setup/teardown
    - Validates API endpoint before each test
  critical: |
    - THIS is the pattern to follow for integration tests
    - Real filesystem operations (not mocked)
    - Temp directory isolation

# MUST READ - Integration test file for reference
- file: /home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts
  why: Another example of integration test with real filesystem
  section: Full file
  pattern: |
    - Uses randomBytes() for unique temp dir names
    - Uses async/await for file operations
    - Validates file existence and content
  gotcha: |
    - Uses onTestFinished() for cleanup (Vitest pattern)

# MUST READ - System context for SessionManager
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md
  why: Contains Section 6.3 (Session State) and Section 4 (Session Manager)
  section: Section 6.3, Section 4
  pattern: |
    - Session state structure
    - Session manager responsibilities
    - Hash-based session detection
    - Directory structure contract

# MUST READ - Existing unit tests (for context, not duplication)
- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts
  why: Understand what's already tested to avoid duplication
  section: Lines 400-500 (initialize tests)
  pattern: |
    - Uses vi.mock() for filesystem operations
    - Tests new session creation
    - Tests PRD snapshot writing
    - Tests SessionState return value
  gotcha: |
    - These are UNIT tests (mocked)
    - Our task is INTEGRATION tests (real filesystem)
    - Don't duplicate, complement with real filesystem tests

# MUST READ - Test setup configuration
- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test setup with API validation
  section: Full file
  pattern: |
    - Validates ANTHROPIC_BASE_URL is not Anthropic API
    - Runs before each test
  critical: |
    - All integration tests inherit this safeguard
    - No need to duplicate API validation

# MUST READ - Vitest configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Confirms test framework configuration
  section: Full file
  pattern: |
    - Environment: 'node'
    - Globals: true (describe, it, expect available globally)
    - Setup file: ./tests/setup.ts
    - Test files: tests/**/*.{test,spec}.ts
  gotcha: |
    - No need to import Vitest globals
    - .test.ts suffix required
    - ESM requires .js extensions on imports

# RESEARCH DOCUMENTATION - SessionManager implementation analysis
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S1/research/session-manager-implementation-analysis.md
  why: Complete analysis of SessionManager.initialize() with line numbers
  section: Full file
  critical: |
    - initialize() flow documented step-by-step
    - hashPRD implementation details
    - Session directory creation pattern
    - Error handling patterns

# RESEARCH DOCUMENTATION - Integration test patterns
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S1/research/integration-test-patterns-research.md
  why: Complete analysis of existing integration test patterns
  section: Full file
  critical: |
    - Temp directory patterns (mkdtempSync, randomBytes)
    - Real filesystem operations
    - Cleanup patterns (afterEach, onTestFinished)
    - Test file organization

# RESEARCH DOCUMENTATION - Vitest filesystem mocking
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P2M1T1S1/research/vitest-filesystem-mocking-research.md
  why: Complete patterns for filesystem testing (reference only)
  section: Full file
  note: |
    - This research is for REFERENCE only
    - Integration tests use REAL filesystem, not mocks
    - Useful for understanding test patterns
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts              # SOURCE: initialize() method (210-336)
│   │   │                                   # SOURCE: getSessionPath() (168)
│   │   │                                   # SOURCE: SESSION_DIR_PATTERN (63)
│   │   ├── session-utils.ts                # SOURCE: hashPRD() (160-167)
│   │   │                                   # SOURCE: createSessionDirectory() (197-242)
│   │   └── models.ts                       # REFERENCE: SessionState interface
│   ├── utils/
│   │   ├── prd-validator.ts                # REFERENCE: PRDValidator class
│   │   └── logger.ts                       # REFERENCE: Logger class
│   └── config/
│       └── environment.ts                  # REFERENCE: Environment config
├── tests/
│   ├── setup.ts                            # Global test setup with API validation
│   ├── unit/
│   │   └── core/
│   │       └── session-manager.test.ts     # EXISTING: Unit tests with mocks (2613 lines)
│   └── integration/
│       ├── prp-pipeline-integration.test.ts    # REFERENCE: Temp dir pattern
│       ├── prp-runtime-integration.test.ts     # REFERENCE: Real filesystem pattern
│       └── core/                            # NEW: Create session-manager.test.ts here
├── plan/
│   └── 002_1e734971e481/
│       ├── P1M3T2S3/
│       │   └── PRP.md                     # REFERENCE: Previous PRP for patterns
│       ├── P2M1T1S1/
│       │   ├── PRP.md                     # NEW: This PRP
│       │   └── research/                  # RESEARCH: Research documents
│       └── tasks.json                     # REFERENCE: Overall task hierarchy
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
            └── session-manager.test.ts    # NEW: Integration test file
                                                    # ADD: describe('SessionManager.initialize()', () => { ... })
                                                    # ADD: Tests for new session creation
                                                    # ADD: Real filesystem operations
                                                    # ADD: Temp directory setup/teardown
                                                    # ADD: Directory structure validation
                                                    # ADD: File content validation
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Integration Tests Use REAL Filesystem, Not Mocks
// Unit tests (tests/unit/core/session-manager.test.ts) use vi.mock()
// Integration tests (this task) use real filesystem with temp directories
// Pattern: mkdtempSync(join(tmpdir(), 'session-manager-test-'))
// Cleanup: rmSync(tempDir, { recursive: true, force: true })

// CRITICAL: Session Directory Format is Strict
// Pattern: /^(\d{3})_([a-f0-912})$/
// Valid: 001_14b9dc2a33c7, 002_a3f8e9d12b4
// Invalid: 1_14b9dc2a33c7 (not zero-padded)
// Invalid: 001_14b9dc (hash too short)
// Invalid: 001_14b9dc2a33c7g (invalid hex character)

// CRITICAL: Hash is First 12 Characters of SHA-256
// Full SHA-256 is 64 characters
// Session uses: fullHash.slice(0, 12)
// Example: '14b9dc2a33c74e2f...' becomes '14b9dc2a33c7'

// GOTCHA: Hash Sensitivity
// Hash is sensitive to:
// - File encoding (must be UTF-8)
// - Line endings (LF vs CRLF)
// - Trailing whitespace
// - BOM (Byte Order Mark)
// Tests must use consistent encoding

// CRITICAL: Sequence Numbering is Zero-Padded
// Uses: String(sequence).padStart(3, '0')
// First session: 001, Second: 002, ..., Tenth: 010
// Never: 1, 2, 3 (missing zero-padding)

// GOTCHA: Subdirectories Are Created Automatically
// createSessionDirectory() creates:
// - {sequence}_{hash}/ (main session dir)
// - {sequence}_{hash}/architecture/
// - {sequence}_{hash}/prps/
// - {sequence}_{hash}/artifacts/
// Tests should verify all subdirectories exist

// CRITICAL: tasks.json is NOT Created During initialize()
// initialize() only creates SessionState in memory with { backlog: [] }
// tasks.json is written later by saveBacklog() method
// Tests should verify SessionState has empty backlog, not tasks.json file
// Exception: Some implementations may write it, check actual behavior

// CRITICAL: prd_snapshot.md Must Be Identical to Original PRD
// Content must match exactly (same encoding, same content)
// File mode is 0o644 (rw-r--r--)
// Tests should verify: content equality, not just file existence

// GOTCHA: PRD Validation Occurs Before Session Creation
// PRDValidator.validate() is called in initialize()
// If validation fails, ValidationError is thrown
// No session directory is created if PRD is invalid
// Tests should handle validation errors

// CRITICAL: Temp Directory Cleanup Must Be Robust
// Use: rmSync(tempDir, { recursive: true, force: true })
// force: true ignores ENOENT (directory already gone)
// recursive: true removes all contents
// Place in afterEach() to run even if test fails

// GOTCHA: Vitest Globals Are Enabled
// No need to import describe, it, expect, test, beforeEach, afterEach
// They are available globally in all test files
// vitest.config.ts: globals: true

// CRITICAL: ESM Requires .js Extensions
// All imports must use .js extensions (not .ts)
// TypeScript emits .js files even for .ts sources
// Example: import { SessionManager } from '../../src/core/session-manager.js'

// GOTCHA: API Endpoint Validation in Global Setup
// tests/setup.ts validates ANTHROPIC_BASE_URL before each test
// No need to duplicate API validation in integration tests
// Tests will fail if Anthropic production API is configured

// CRITICAL: Integration Tests Complement Unit Tests
// Unit tests: Mock filesystem, test logic in isolation
// Integration tests: Real filesystem, test actual behavior
// Don't duplicate unit test scenarios
// Focus on filesystem-specific validation

// GOTCHA: SessionManager Constructor Validates PRD Exists
// Constructor throws SessionFileError if PRD doesn't exist
// Tests must create valid PRD file before creating SessionManager
// Use: writeFileSync(prdPath, '# Test PRD\n\nContent.')

// CRITICAL: Plan Directory May Not Exist Initially
// First session creation creates plan/ directory if missing
# mkdir() with recursive: true handles this
// Tests should verify plan/ directory is created if missing

// GOTCHA: Hash Consistency Across Calls
// Same PRD content should produce same hash
// Tests should verify hash is deterministic
// Different PRD content should produce different hash

// CRITICAL: Test Isolation Is Critical
// Each test should use unique temp directory
// Each test should create unique PRD content
// Tests should not share state
// Pattern: mkdtempSync() with unique prefix per test

// GOTCHA: File Mode May Vary by OS
// 0o644 on Unix, may be different on Windows
// Tests should verify content, not permissions (unless OS-specific)
// Or use mode: 0o644 on Unix only

// CRITICAL: Sequential Numbering with Real Directories
// #getNextSequence() scans plan/ directory for existing sessions
// Finds highest sequence number, returns max + 1
// Tests should verify sequential numbering with multiple sessions
// Tests should clean up temp dirs between tests
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task tests existing SessionState and SessionManager behavior.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/core/ directory
  - CREATE: Directory for core integration tests
  - VERIFY: Directory created successfully
  - DEPENDENCIES: None
  - PLACEMENT: tests/integration/core/

Task 2: READ SessionManager implementation
  - FILE: src/core/session-manager.ts
  - READ: Lines 210-336 (initialize method)
  - READ: Lines 160-167 (hashPRD in session-utils.ts)
  - READ: Lines 197-242 (createSessionDirectory in session-utils.ts)
  - UNDERSTAND: New session creation flow
  - UNDERSTAND: Session directory structure
  - DEPENDENCIES: None

Task 3: READ existing integration test patterns
  - FILE: tests/integration/prp-pipeline-integration.test.ts
  - FILE: tests/integration/prp-runtime-integration.test.ts
  - EXTRACT: Temp directory setup pattern
  - EXTRACT: beforeEach/afterEach pattern
  - EXTRACT: Real filesystem operation pattern
  - DEPENDENCIES: None

Task 4: CREATE test file structure with imports
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: Vitest imports (describe, it, expect, beforeEach, afterEach)
  - ADD: Node.js imports (mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync)
  - ADD: Path imports (join, resolve)
  - ADD: OS import (tmpdir)
  - ADD: Source imports (SessionManager, type SessionState, type Backlog)
  - PATTERN: Follow prp-pipeline-integration.test.ts import order
  - DEPENDENCIES: Task 2, Task 3

Task 5: IMPLEMENT test setup and teardown
  - FILE: tests/integration/core/session-manager.test.ts
  - ADD: describe('SessionManager.initialize()', () => { ... })
  - ADD: beforeEach() to create unique temp directory
  - ADD: afterEach() to cleanup temp directory
  - ADD: Helper function to create test PRD file
  - PATTERN: mkdtempSync(join(tmpdir(), 'session-manager-test-'))
  - PATTERN: rmSync(tempDir, { recursive: true, force: true })
  - DEPENDENCIES: Task 4

Task 6: IMPLEMENT Test 1 - New session created with unique PRD hash
  - CREATE: it('should create new session with unique PRD hash', async () => { ... })
  - SETUP: Create test PRD with unique content
  - EXECUTE: Call new SessionManager(prdPath).initialize()
  - VERIFY: Session directory exists in plan/
  - VERIFY: Session directory name matches pattern {sequence}_{hash}
  - VERIFY: SessionState returned with correct metadata
  - PATTERN: Use SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 5

Task 7: IMPLEMENT Test 2 - Session directory format validation
  - CREATE: it('should create session directory with correct format', async () => { ... })
  - SETUP: Create test PRD
  - EXECUTE: Initialize SessionManager
  - VERIFY: Directory name matches regex /^(\d{3})_([a-f0-9]{12})$/
  - VERIFY: Sequence is zero-padded (3 digits)
  - VERIFY: Hash is 12-character hex string
  - DEPENDENCIES: Task 6

Task 8: IMPLEMENT Test 3 - Hash is first 12 characters of SHA-256
  - CREATE: it('should use first 12 characters of SHA-256 hash', async () => { ... })
  - SETUP: Create test PRD with known content
  - EXECUTE: Initialize SessionManager
  - VERIFY: Compute expected hash using crypto.createHash('sha256')
  - VERIFY: Session directory hash matches first 12 chars
  - PATTERN: Use real crypto.createHash() for verification
  - DEPENDENCIES: Task 7

Task 9: IMPLEMENT Test 4 - tasks.json with empty backlog
  - CREATE: it('should create SessionState with empty backlog', async () => { ... })
  - SETUP: Create test PRD
  - EXECUTE: Initialize SessionManager
  - VERIFY: SessionState.taskRegistry.backlog is empty array []
  - VERIFY: SessionState.currentItemId is null
  - VERIFY: SessionState.metadata.hash is set
  - DEPENDENCIES: Task 8
  - NOTE: tasks.json file may not exist yet (written later by saveBacklog())

Task 10: IMPLEMENT Test 5 - prd_snapshot.md copied with identical content
  - CREATE: it('should copy PRD to prd_snapshot.md with identical content', async () => { ... })
  - SETUP: Create test PRD with specific content
  - EXECUTE: Initialize SessionManager
  - VERIFY: prd_snapshot.md exists in session directory
  - VERIFY: prd_snapshot.md content matches original PRD exactly
  - PATTERN: Use readFileSync() and compare strings
  - DEPENDENCIES: Task 9

Task 11: IMPLEMENT Test 6 - Subdirectories created
  - CREATE: it('should create required subdirectories', async () => { ... })
  - SETUP: Create test PRD
  - EXECUTE: Initialize SessionManager
  - VERIFY: architecture/ directory exists
  - VERIFY: prps/ directory exists
  - VERIFY: artifacts/ directory exists
  - PATTERN: Use existsSync() for each subdirectory
  - DEPENDENCIES: Task 10

Task 12: IMPLEMENT Test 7 - PRD hash change creates new session
  - CREATE: it('should create new session when PRD hash changes', async () => { ... })
  - SETUP: Create first session with PRD content A
  - EXECUTE: Modify PRD content to B, reinitialize
  - VERIFY: New session directory created (002_{newhash})
  - VERIFY: Both sessions exist in plan/
  - VERIFY: Hashes are different
  - PATTERN: Use writeFileSync() to modify PRD
  - DEPENDENCIES: Task 11

Task 13: IMPLEMENT Test 8 - Sequential session numbering
  - CREATE: it('should use sequential session numbering', async () => { ... })
  - SETUP: Create three sessions with different PRD content
  - EXECUTE: Initialize for each PRD
  - VERIFY: Sessions numbered 001, 002, 003
  - VERIFY: Sequence increments correctly
  - PATTERN: Loop to create multiple sessions
  - DEPENDENCIES: Task 12

Task 14: IMPLEMENT Test 9 - SessionState metadata validation
  - CREATE: it('should return SessionState with correct metadata', async () => { ... })
  - SETUP: Create test PRD
  - EXECUTE: Initialize SessionManager
  - VERIFY: metadata.id matches session directory name
  - VERIFY: metadata.hash is 12-character string
  - VERIFY: metadata.path is absolute path to session
  - VERIFY: metadata.parentSession is null (not delta session)
  - VERIFY: metadata.createdAt is Date instance
  - DEPENDENCIES: Task 13

Task 15: RUN tests and verify all pass
  - RUN: npm test -- tests/integration/core/session-manager.test.ts
  - VERIFY: All tests pass
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
// PATTERN: Integration Test File Structure
// =============================================================================

import { describe, expect, it, beforeEach, afterEach } from 'vitest';

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

import { SessionManager } from '../../../src/core/session-manager.js';
import type { SessionState } from '../../../src/core/models.js';

// =============================================================================
// PATTERN: Test Setup with Temp Directories
// =============================================================================

describe('SessionManager.initialize()', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Create initial PRD file
    writeFileSync(prdPath, '# Test PRD\n\nThis is a test PRD for session creation.');
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - New Session Created with Unique PRD Hash
  // =============================================================================

  it('should create new session with unique PRD hash', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE: Initialize session manager
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Session directory created
    expect(existsSync(planDir)).toBe(true);
    const sessionDirs = readdirSync(planDir).filter((d) =>
      /^\d{3}_[a-f0-9]{12}$/.test(d)
    );
    expect(sessionDirs).toHaveLength(1);

    // VERIFY: SessionState returned
    expect(session).toBeDefined();
    expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
    expect(session.taskRegistry.backlog).toEqual([]);
  });

  // =============================================================================
  // PATTERN: Test 2 - Session Directory Format Validation
  // =============================================================================

  it('should create session directory with correct format', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // VERIFY: Session directory format
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(1);

    const [sessionDirName] = sessionDirs;
    const match = sessionDirName.match(/^(\d{3})_([a-f0-9]{12})$/);
    expect(match).not.toBeNull();

    if (match) {
      const [, sequence, hash] = match;
      expect(sequence).toBe('001'); // Zero-padded to 3 digits
      expect(hash).toHaveLength(12); // 12-character hash
    }
  });

  // =============================================================================
  // PATTERN: Test 3 - Hash is First 12 Characters of SHA-256
  // =============================================================================

  it('should use first 12 characters of SHA-256 hash', async () => {
    // SETUP: Create PRD with known content
    const prdContent = '# Known PRD\n\nPredictable content for hash testing.';
    writeFileSync(prdPath, prdContent);

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Compute expected hash
    const expectedHash = createHash('sha256')
      .update(prdContent, 'utf-8')
      .digest('hex')
      .slice(0, 12);

    expect(session.metadata.hash).toBe(expectedHash);

    // VERIFY: Session directory name contains expected hash
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs[0]).toContain(expectedHash);
  });

  // =============================================================================
  // PATTERN: Test 4 - SessionState with Empty Backlog
  // =============================================================================

  it('should create SessionState with empty backlog', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: SessionState structure
    expect(session.taskRegistry.backlog).toEqual([]);
    expect(session.currentItemId).toBeNull();
    expect(session.metadata.hash).toBeDefined();
    expect(session.metadata.id).toBeDefined();
    expect(session.prdSnapshot).toContain('Test PRD');
  });

  // =============================================================================
  // PATTERN: Test 5 - prd_snapshot.md Copied with Identical Content
  // =============================================================================

  it('should copy PRD to prd_snapshot.md with identical content', async () => {
    // SETUP: Create PRD with specific content
    const prdContent = '# Test PRD\n\nSpecific content for snapshot verification.';
    writeFileSync(prdPath, prdContent);

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // VERIFY: prd_snapshot.md exists
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const snapshotPath = join(sessionPath, 'prd_snapshot.md');
    expect(existsSync(snapshotPath)).toBe(true);

    // VERIFY: Content matches exactly
    const snapshotContent = readFileSync(snapshotPath, 'utf-8');
    expect(snapshotContent).toBe(prdContent);
  });

  // =============================================================================
  // PATTERN: Test 6 - Subdirectories Created
  // =============================================================================

  it('should create required subdirectories', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // VERIFY: All subdirectories exist
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);

    expect(existsSync(join(sessionPath, 'architecture'))).toBe(true);
    expect(existsSync(join(sessionPath, 'prps'))).toBe(true);
    expect(existsSync(join(sessionPath, 'artifacts'))).toBe(true);
  });

  // =============================================================================
  // PATTERN: Test 7 - PRD Hash Change Creates New Session
  // =============================================================================

  it('should create new session when PRD hash changes', async () => {
    // SETUP: Create first session
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // EXECUTE: Modify PRD and create new session
    const newContent = '# Modified PRD\n\nThis content changed the hash.';
    writeFileSync(prdPath, newContent);

    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: New session created
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(2);

    // VERIFY: Hashes are different
    expect(session2.metadata.hash).not.toBe(session1.metadata.hash);

    // VERIFY: Both sessions exist in plan/
    const hash1 = session1.metadata.hash;
    const hash2 = session2.metadata.hash;
    expect(sessionDirs.some((d) => d.includes(hash1))).toBe(true);
    expect(sessionDirs.some((d) => d.includes(hash2))).toBe(true);
  });

  // =============================================================================
  // PATTERN: Test 8 - Sequential Session Numbering
  // =============================================================================

  it('should use sequential session numbering', async () => {
    // SETUP & EXECUTE: Create three sessions
    const sessions = [];
    for (let i = 0; i < 3; i++) {
      const content = `# PRD ${i}\n\nContent for session ${i}.`;
      writeFileSync(prdPath, content);

      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      sessions.push(session);
    }

    // VERIFY: Sessions numbered 001, 002, 003
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(3);

    const sequences = sessionDirs
      .map((d) => d.match(/^(\d{3})_/)?.[1])
      .sort();

    expect(sequences).toEqual(['001', '002', '003']);
  });

  // =============================================================================
  // PATTERN: Test 9 - SessionState Metadata Validation
  // =============================================================================

  it('should return SessionState with correct metadata', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Metadata fields
    const sessionDirs = readdirSync(planDir);
    const sessionDirName = sessionDirs[0];

    expect(session.metadata.id).toBe(sessionDirName);
    expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
    expect(session.metadata.path).toBe(resolve(planDir, sessionDirName));
    expect(session.metadata.parentSession).toBeNull(); // Not delta session
    expect(session.metadata.createdAt).toBeInstanceOf(Date);
  });
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING UNIT TESTS:
  - tests/unit/core/session-manager.test.ts has comprehensive mocked tests
  - Pattern: SETUP/EXECUTE/VERIFY comments
  - Pattern: describe/it block structure
  - Pattern: Factory functions for test data
  - This PRP: Complements with real filesystem integration tests

INPUT FROM EXISTING INTEGRATION TESTS:
  - tests/integration/prp-pipeline-integration.test.ts has temp dir pattern
  - Pattern: mkdtempSync(join(tmpdir(), 'prefix-'))
  - Pattern: rmSync(tempDir, { recursive: true, force: true })
  - Pattern: beforeEach/afterEach for setup/teardown
  - Pattern: API endpoint validation (inherited from tests/setup.ts)

INPUT FROM SESSIONMANAGER IMPLEMENTATION:
  - src/core/session-manager.ts has initialize() method (210-336)
  - Pattern: Hash PRD, validate, search existing, create new
  - Pattern: Session directory format: {sequence}_{hash}
  - Pattern: Zero-padded sequence numbers (3 digits)
  - This PRP: Tests validate actual behavior with real filesystems

INPUT FROM SESSION-UTILS:
  - src/core/session-utils.ts has hashPRD() function (160-167)
  - Pattern: crypto.createHash('sha256') for hashing
  - Pattern: readFile() with UTF-8 encoding
  - src/core/session-utils.ts has createSessionDirectory() (197-242)
  - Pattern: Creates subdirs (architecture/, prps/, artifacts/)
  - Pattern: recursive: true, mode: 0o755 for mkdir

INPUT FROM GLOBAL TEST SETUP:
  - tests/setup.ts validates ANTHROPIC_BASE_URL
  - Pattern: Runs before each test
  - Pattern: Throws error if Anthropic production API detected
  - This PRP: Inherits safeguard, no need to duplicate

OUTPUT FOR SUBSEQUENT WORK:
  - Integration tests for new session creation at session-manager.test.ts
  - Confidence that SessionManager creates sessions correctly
  - Foundation for P2.M1.T1.S2 (existing session loading tests)
  - Foundation for P2.M1.T1.S3 (delta session detection tests)
  - Pattern for testing real filesystem operations

DIRECTORY STRUCTURE:
  - Create: tests/integration/core/ (new directory)
  - Create: tests/integration/core/session-manager.test.ts (new file)
  - No modifications to existing files
  - Tests can run independently

CLEANUP INTEGRATION:
  - Temp directories cleaned up in afterEach()
  - No side effects on actual plan/ directory
  - No modifications to production code
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating session-manager.test.ts
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
# Test the new integration test file
npm test -- tests/integration/core/session-manager.test.ts

# Expected: All tests pass
# Expected: Output shows new test descriptions
# Expected: No failing tests

# Run all integration tests
npm test -- tests/integration/

# Expected: All integration tests pass
# Expected: No regressions in other integration test files

# Coverage validation
npm run test:coverage

# Expected: Coverage for SessionManager.initialize() increases
# Expected: New filesystem-related code paths covered
# Expected: No uncovered lines in new session creation logic

# If tests fail, check:
# - SessionManager imported correctly (with .js extension)
# - Temp directory cleanup works
# - PRD files created with correct content
# - Session directory structure validated
# - Hash computation matches expected SHA-256
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
ls -la /tmp/ | grep session-manager-test

# Expected: No leftover temp directories (all cleaned up)

# Manual verification: Read test output
npm test -- tests/integration/core/session-manager.test.ts --reporter=verbose

# Expected: Clear test names showing session creation scenarios
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/integration/core/session-manager.test.ts

# Expected: Tests complete in reasonable time (< 10 seconds)
```

### Level 4: Real-World Validation (Scenario Testing)

```bash
# Scenario 1: Create session with real PRD file
cp /path/to/real/PRD.md /tmp/test-prd.md
cat > /tmp/test-session.js << 'EOF'
import { SessionManager } from './src/core/session-manager.js';
const manager = new SessionManager('/tmp/test-prd.md', '/tmp/test-plan');
await manager.initialize();
console.log('Session created:', manager.currentSession?.metadata.id);
EOF
node /tmp/test-session.js

# Expected: Session created successfully
# Expected: Session directory exists in /tmp/test-plan/

# Scenario 2: Verify hash consistency
cat > /tmp/test-hash.js << 'EOF'
import { SessionManager } from './src/core/session-manager.js';
import { readFileSync } from 'node:fs';
const prdPath = '/tmp/test-prd.md';
const content = readFileSync(prdPath, 'utf-8');
console.log('PRD content length:', content.length);
const manager = new SessionManager(prdPath, '/tmp/test-plan2');
const session = await manager.initialize();
console.log('Session hash:', session.metadata.hash);
EOF
node /tmp/test-hash.js

# Expected: Hash is 12 characters
# Expected: Hash is consistent with SHA-256 of PRD content

# Scenario 3: Multiple session creation
cat > /tmp/test-multiple.js << 'EOF'
import { SessionManager } from './src/core/session-manager.js';
import { writeFileSync } from 'node:fs';
const planDir = '/tmp/test-plan-multi';
for (let i = 0; i < 5; i++) {
  writeFileSync('/tmp/test-prd.md', `# PRD ${i}\n\nContent ${i}.`);
  const manager = new SessionManager('/tmp/test-prd.md', planDir);
  await manager.initialize();
}
EOF
node /tmp/test-multiple.js

# Expected: 5 sessions created
# Expected: Numbered 001, 002, 003, 004, 005
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: New session created with unique PRD hash
- [ ] Test 2: Session directory format validated (sequence_hash)
- [ ] Test 3: Zero-padded sequence number (3 digits)
- [ ] Test 4: Hash is first 12 characters of SHA-256
- [ ] Test 5: SessionState with empty backlog
- [ ] Test 6: prd_snapshot.md copied with identical content
- [ ] Test 7: Subdirectories created (architecture/, prps/, artifacts/)
- [ ] Test 8: PRD hash change creates new session
- [ ] Test 9: Sequential session numbering (001, 002, 003)
- [ ] Test 10: SessionState metadata validated
- [ ] All tests pass: `npm test -- tests/integration/core/session-manager.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No side effects on production plan/ directory
- [ ] Temp directories cleaned up after tests

### Feature Validation

- [ ] Session directory format matches /^(\d{3})_([a-f0-9]{12})$/
- [ ] Hash computation uses SHA-256 correctly
- [ ] Hash is first 12 characters (not full 64)
- [ ] Session numbering is sequential and zero-padded
- [ ] prd_snapshot.md content matches original PRD exactly
- [ ] SessionState has correct structure (metadata, prdSnapshot, taskRegistry, currentItemId)
- [ ] Subdirectories (architecture/, prps/, artifacts/) are created
- [ ] Different PRD content creates different sessions
- [ ] All tests use real filesystem (not mocked)
- [ ] Tests complement existing unit tests (no duplication)

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

### Documentation & Deployment

- [ ] Tests serve as executable documentation of session creation
- [ ] Session directory format documented in test names
- [ ] Hash computation verified in tests
- [ ] Real filesystem behavior validated
- [ ] Research documents stored in research/ subdirectory

---

## Anti-Patterns to Avoid

- **Don't mock filesystem operations** - This is integration testing, use real filesystem
- **Don't duplicate unit tests** - Existing unit tests already cover mocked scenarios
- **Don't skip temp directory cleanup** - Must use afterEach() with rmSync()
- **Don't use global state** - Each test must use unique temp directory
- **Don't forget .js extensions** - ESM requires .js on all imports
- **Don't test existing session loading** - That's P2.M1.T1.S2
- **Don't test delta session creation** - That's P2.M1.T1.S3
- **Don't test batch updates/flushing** - That's P2.M1.T2
- **Don't modify SessionManager code** - This is validation only, no implementation changes
- **Don't hardcode temp directory paths** - Use mkdtempSync() for uniqueness
- **Don't ignore encoding** - PRD must be UTF-8 for consistent hashing
- **Don't assume tasks.json exists** - initialize() only creates SessionState in memory
- **Don't skip subdirectory verification** - Must check architecture/, prps/, artifacts/
- **Don't forget zero-padding** - Sequence must be 3 digits (001, not 1)
- **Don't use full 64-char hash** - Session uses first 12 characters only

---

## Appendix: Decision Rationale

### Why integration tests instead of extending unit tests?

The existing unit test file (`tests/unit/core/session-manager.test.ts`) has 2613 lines of comprehensive tests using mocked filesystem operations. However, unit tests with mocks can't catch:
1. **Filesystem-specific bugs**: Encoding issues, permission problems, path resolution errors
2. **Real-world behavior**: Actual directory creation, file content verification
3. **Integration issues**: How SessionManager works with real filesystem APIs

Integration tests complement unit tests by validating actual behavior with real filesystems, providing confidence that session creation works in production.

### Why use real filesystem instead of mocks?

Real filesystem operations expose issues that mocks hide:
- **Encoding problems**: UTF-8 vs ASCII, BOM handling
- **Permissions**: File mode bits, access control
- **Path resolution**: Relative vs absolute paths, symlinks
- **Atomic operations**: Temp file + rename pattern verification
- **OS differences**: Windows vs Unix filesystem behavior

Mocked tests are valuable for unit testing but insufficient for integration validation.

### Why create tests/integration/core/ directory?

Existing integration tests are in `tests/integration/` but not organized by module. Creating `tests/integration/core/`:
1. Mirrors the `tests/unit/core/` structure
2. Groups core module integration tests together
3. Makes it easy to find SessionManager integration tests
4. Scales for future core module integration tests

### Why verify subdirectories (architecture/, prps/, artifacts/)?

The `createSessionDirectory()` function creates these subdirectories as part of the session structure. Tests must verify they exist because:
1. Other parts of the pipeline depend on these directories
2. Missing directories cause runtime errors
3. Directory structure is a documented contract

### Why test sequential numbering with multiple sessions?

The `#getNextSequence()` method scans the plan/ directory to find the highest sequence number. Testing with multiple sessions:
1. Validates the scanning logic works correctly
2. Confirms zero-padding works for sequences >= 10
3. Ensures no sequence number collisions
4. Verifies session directories accumulate correctly

### What about tasks.json file creation?

The `initialize()` method creates SessionState in memory with `{ backlog: [] }` but doesn't necessarily write `tasks.json` immediately. The file is written later by `saveBacklog()` method. Tests should verify SessionState has empty backlog, not that tasks.json file exists (unless implementation writes it during initialize()).

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from research agents (5 parallel research tasks)
- [x] SessionManager.initialize() fully analyzed with line numbers
- [x] Existing unit tests reviewed to avoid duplication
- [x] Integration test patterns identified and extracted
- [x] Real filesystem operation patterns documented
- [x] Temp directory cleanup patterns validated
- [x] Session directory format specified (regex pattern)
- [x] Hash computation implementation analyzed
- [x] Sequential numbering logic documented
- [x] Subdirectory creation requirements verified
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Integration vs unit test distinction clear

**Risk Mitigation**:
- New test file (low risk of breaking existing tests)
- Integration tests only (no production code changes)
- Temp directory isolation (no side effects on plan/)
- Complements existing unit tests (no duplication)
- Clear acceptance criteria
- Follows established integration test patterns

**Known Risks**:
- **Temp directory cleanup**: If rmSync() fails, temp files may accumulate
  - Mitigation: Use `force: true` option to ignore ENOENT
- **Hash consistency**: Different encodings produce different hashes
  - Mitigation: Always use UTF-8 encoding when reading/writing PRD
- **OS differences**: File permissions may vary by OS
  - Mitigation: Focus on content validation, not permissions (unless OS-specific)
- **Sequential numbering collisions**: Concurrent session creation may cause issues
  - Mitigation: Tests run sequentially (Vitest default), not concurrent

---

**END OF PRP**
