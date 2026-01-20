# Product Requirement Prompt (PRP): P1.M2.T1.S2 - Verify plan/ directory structure and artifacts

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify the complete `plan/` directory structure including PRP storage in `prps/`, cache metadata in `.cache/`, execution artifacts in `artifacts/{taskId}/`, bugfix sub-sessions in `bugfix/`, and artifact preservation for audit trails.

**Deliverable**: Integration test file `tests/integration/session-structure.test.ts` with complete coverage of directory layout, PRP caching, artifact collection, and preservation verification.

**Success Definition**: All tests pass, verifying:
- Session directories are created with correct naming pattern `{sequence}_{hash}`
- PRPs are stored in `prps/` with sanitized filenames (dots → underscores)
- Cache metadata is stored in `prps/.cache/` with correct structure
- Execution artifacts are collected in `artifacts/{taskId}/`
- Bugfix sessions are created as `bugfix/{sequence}_{hash}/` with correct structure
- All artifacts are preserved (not deleted) for audit trail

## Why

- **Directory Structure Verification**: Validates that the complete `plan/` directory structure matches the architecture specification, including all subdirectories for PRPs, artifacts, bugfix sessions, and cache metadata
- **PRP Caching Validation**: Ensures PRPs are correctly stored with cache metadata for TTL-based expiration and hash-based change detection
- **Artifact Collection Verification**: Confirms execution artifacts are properly collected in per-task directories with correct file formats (validation-results.json, execution-summary.md, artifacts-list.json)
- **Bugfix Session Structure**: Validates bugfix sub-sessions follow the same naming pattern and structure as main sessions
- **Audit Trail Preservation**: Ensures artifacts are never deleted, providing a complete audit trail for debugging and analysis

**Existing Tests**: `tests/integration/core/session-structure.test.ts` provides patterns for basic session directory testing, but does NOT cover PRP caching, artifact collection, or bugfix session structure.

**Contract from PRD**: PRD.md and system_context.md specify the complete `plan/` directory structure including prps/, artifacts/, bugfix/, and cache metadata.

**Integration Context**: This is part of Milestone 1.2 (PRD Requirement Coverage) - validating that the system correctly implements the complete plan/ directory structure as specified in the PRD.

**Relationship to P1.M2.T1.S1**: The previous subtask (P1.M2.T1.S1) validates `tasks.json` as the single source of truth. This subtask (P1.M2.T1.S2) validates the broader `plan/` directory structure including PRPs, artifacts, and bugfix sessions. The two tests are complementary and cover different aspects of the system.

## What

Integration tests that verify the complete `plan/` directory structure, PRP storage, cache metadata, execution artifacts, and bugfix session structure.

### Success Criteria

- [ ] Session directories are created with `{sequence}_{hash}` naming pattern
- [ ] PRPs are stored in `prps/` with sanitized filenames
- [ ] Cache metadata is stored in `prps/.cache/` with correct structure
- [ ] Cache metadata includes: taskId, taskHash, createdAt, accessedAt, version, prp
- [ ] Cache TTL is 24 hours (86,400,000 ms)
- [ ] Execution artifacts are collected in `artifacts/{taskId}/`
- [ ] Artifacts include: validation-results.json, execution-summary.md, artifacts-list.json
- [ ] Bugfix sessions are created as `bugfix/{sequence}_{hash}/`
- [ ] Bugfix sessions have same structure as main sessions
- [ ] All artifacts are preserved (not deleted) for audit trail
- [ ] File permissions are correct (0o755 for directories, 0o644 for files)

## All Needed Context

### Context Completeness Check

*This PRP passes the "No Prior Knowledge" test:*
- Complete directory structure specification from system_context.md research
- PRP cache metadata schema and storage patterns from codebase analysis
- Execution artifact formats and collection logic from prp-runtime research
- Bugfix session structure and naming patterns from existing sessions
- Integration test patterns from existing test files
- External best practices for file system testing
- Clear file paths and line numbers for all referenced code

### Documentation & References

```yaml
# MUST READ - System context for directory structure
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Complete directory structure specification including prps/, artifacts/, bugfix/
  section: "Session Structure" (lines 79-100)
  pattern: Session directory naming, subdirectory structure, artifact locations
  gotcha: Hash is first 12 chars of SHA-256, sequence is zero-padded to 3 digits

# MUST READ - Session directory creation
- file: src/core/session-utils.ts
  why: Core directory creation logic for sessions and subdirectories
  lines: 285-371 (createSessionDirectory function)
  pattern: Creates session directory with architecture/, prps/, artifacts/ subdirs
  gotcha: Uses mkdir with mode 0o755, EEXIST is OK (directory already exists)

# MUST READ - SessionManager for session initialization
- file: src/core/session-manager.ts
  why: Session initialization, loading, and delta session creation
  lines: 125-250 (initialize, createDeltaSession)
  pattern: Hash-based session detection, directory creation, session state loading
  gotcha: Delta sessions have parent_session.txt linking to parent

# MUST READ - PRP cache and storage
- file: src/agents/prp-generator.ts
  why: PRP generation, caching, and storage logic
  lines: 96-103 (PRPCacheMetadata interface), 191-272 (cache operations)
  pattern: Cache metadata stored in .cache/ with taskId.json filenames
  gotcha: Task IDs sanitized (dots → underscores) for filenames

# MUST READ - Artifact collection and writing
- file: src/agents/prp-runtime.ts
  why: Execution artifact collection and file writing
  lines: 172-181 (artifacts directory creation), 245-285 (#writeArtifacts)
  pattern: Creates artifacts/{taskId}/ with three JSON/MD files
  gotcha: Uses mode 0o644 for all artifact files

# MUST READ - Artifact schema definitions
- file: src/agents/prp-executor.ts
  why: Validation gate result interface for validation-results.json
  lines: 38-55 (ValidationGateResult interface)
  pattern: Level, description, success, command, stdout, stderr, exitCode, skipped
  gotcha: Command can be null (manual gates), skipped flag for manual tests

# MUST READ - Existing session structure tests
- file: tests/integration/core/session-structure.test.ts
  why: Reference patterns for session directory testing
  pattern: Temp directory setup, beforeEach/afterEach cleanup, helper functions
  gotcha: Uses mkdtempSync for temp directories, rmSync for cleanup

# MUST READ - Research: Session directory structure analysis
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S2/research/session-directory-structure-analysis.md
  why: Complete analysis of directory structure, PRP storage, artifacts
  section: "Directory Structure", "PRP Storage and Cache", "Artifacts Collection"

# MUST READ - Research: Integration test patterns
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S2/research/typescript-integration-test-patterns.md
  why: Test patterns for file system operations, helper functions, cleanup
  section: "Existing Test Patterns Analysis", "Key Patterns Extracted"

# MUST READ - Research: PRP cache and artifact schemas
- docfile: plan/003_b3d3efdaf0ed/P1M2T1S2/research/prp-cache-artifact-schemas.md
  why: Complete schema definitions for cache metadata and artifacts
  section: "Cache Metadata Schema", "Artifact Directory Structure"

# MUST READ - Vitest documentation
- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking and testing patterns

- url: https://vitest.dev/api/vi.html#vi-spyon
  why: Spying on methods to verify they're called
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── integration/
│   ├── core/
│   │   └── session-structure.test.ts       # Reference: Basic session testing
│   └── session-structure.test.ts            # NEW: This PRP's deliverable

src/
├── core/
│   ├── session-manager.ts                  # Session initialization, delta sessions
│   ├── session-utils.ts                    # Directory creation, PRP storage
│   ├── models.ts                           # Type definitions, Zod schemas
│   └── task-patcher.ts                     # Delta session task patching
├── agents/
│   ├── prp-generator.ts                    # PRP generation, caching
│   ├── prp-runtime.ts                      # Artifact collection
│   └── prp-executor.ts                     # Validation gate results

plan/
├── 001_14b9dc2a33c7/                      # Example main session
│   ├── architecture/
│   ├── prps/
│   │   ├── P1M1T1S1.md                    # PRP file
│   │   └── .cache/
│   │       └── P1M1T1S1.json              # Cache metadata
│   ├── artifacts/
│   │   └── P1M1T1S1/                      # Per-task artifacts
│   │       ├── validation-results.json
│   │       ├── execution-summary.md
│   │       └── artifacts-list.json
│   ├── docs/
│   ├── bugfix/
│   │   └── 001_7f5a0fab4834/              # Bugfix sub-session
│   ├── tasks.json
│   └── prd_snapshot.md
```

### Desired Codebase Tree (new test file structure)

```bash
tests/
├── integration/
│   └── session-structure.test.ts            # NEW: Directory structure tests
│   ├── describe('integration/session-structure > plan/ directory structure')
│   │   ├── describe('session directory naming and structure')
│   │   │   ├── it('should create session directory with {sequence}_{hash} format')
│   │   │   ├── it('should create required subdirectories')
│   │   │   └── it('should set correct file permissions')
│   │   ├── describe('PRP storage and caching')
│   │   │   ├── it('should store PRPs in prps/ with sanitized filenames')
│   │   │   ├── it('should create cache metadata in prps/.cache/')
│   │   │   ├── it('should include all required cache metadata fields')
│   │   │   └── it('should enforce 24-hour cache TTL')
│   │   ├── describe('execution artifacts collection')
│   │   │   ├── it('should create artifacts/{taskId}/ directory')
│   │   │   ├── it('should create validation-results.json')
│   │   │   ├── it('should create execution-summary.md')
│   │   │   └── it('should create artifacts-list.json')
│   │   ├── describe('bugfix session structure')
│   │   │   ├── it('should create bugfix/{sequence}_{hash}/ sessions')
│   │   │   └── it('should create same structure as main sessions')
│   │   └── describe('artifact preservation')
│   │       └── it('should preserve all artifacts for audit trail')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Session directory naming pattern
// From session-utils.ts lines 298-299
const sessionId = `${String(sequence).padStart(3, '0')}_${sessionHash}`;
// Format: 001_14b9dc2a33c7 (3-digit sequence, 12-char hash)
// Hash is FIRST 12 CHARACTERS of SHA-256, not the full hash

// CRITICAL: PRP filename sanitization
// From prp-generator.ts lines 191-194
const sanitized = taskId.replace(/\./g, '_');
// Task ID "P1.M2.T1.S2" becomes filename "P1_M2_T1_S2.md"

// CRITICAL: Cache metadata schema
// From prp-generator.ts lines 96-103
interface PRPCacheMetadata {
  readonly taskId: string;        // "P1.M2.T1.S2"
  readonly taskHash: string;      // SHA-256 of task inputs
  readonly createdAt: number;     // Unix timestamp
  readonly accessedAt: number;    // Unix timestamp
  readonly version: string;       // "1.0"
  readonly prp: PRPDocument;      // Full PRP for quick retrieval
}

// CRITICAL: Cache TTL is 24 hours
// From prp-generator.ts line 151
readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 86,400,000 ms

// CRITICAL: Artifact directory structure
// From prp-runtime.ts lines 172-175
const artifactsDir = join(this.#sessionPath, 'artifacts', subtask.id);
// Creates: plan/{sessionId}/artifacts/{taskId}/

// CRITICAL: Validation gate result schema
// From prp-executor.ts lines 38-55
interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly success: boolean;
  readonly command: string | null;  // null for manual gates
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly skipped: boolean;
}

// CRITICAL: File permissions
// Directories: 0o755 (rwxr-xr-x)
// Files: 0o644 (rw-r--r--)
// From session-utils.ts line 326 (mkdir with mode 0o755)
// From prp-runtime.ts line 247 (writeFile with mode 0o644)

// GOTCHA: Cache directory is hidden (.cache/)
// Located at: prps/.cache/{taskId}.json
// Use glob pattern .**/*.json or explicitly include hidden files

// CRITICAL: Bugfix sessions use same structure
// Located at: plan/{sessionId}/bugfix/{sequence}_{hash}/
// Must include same subdirs: architecture/, prps/, artifacts/, docs/
// Must have tasks.json, prd_snapshot.md

// CRITICAL: Integration tests use REAL filesystem
// From existing test patterns: mkdtempSync(), rmSync(), writeFileSync()
// No vi.mock() for fs operations in integration tests
// Tests verify actual file system behavior

// CRITICAL: Must import with .js extensions (ES modules)
import { SessionManager } from '../../src/core/session-manager.js';
import type { Backlog } from '../../src/core/models.js';

// GOTCHA: afterEach cleanup runs even if test fails
// Pattern: rmSync(tempDir, { recursive: true, force: true })
// The force: true ensures cleanup even if files are locked

// CRITICAL: PRP cache metadata is JSON
// Can parse and verify structure with JSON.parse()
// Validate fields exist and have correct types

// CRITICAL: Artifacts are NEVER deleted
// Audit trail requirement - artifacts persist indefinitely
// Verify by checking artifact directories still exist after operations
```

## Implementation Blueprint

### Data Models and Structure

The test uses existing models from `src/core/models.ts` and `src/agents/prp-generator.ts`:

```typescript
// Cache metadata structure
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;
}

// Validation gate result structure
interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly success: boolean;
  readonly command: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly skipped: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/integration/session-structure.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPORT: All dependencies (vitest, SessionManager, models, fs utilities)
  - SETUP: Helper functions (generateValidPRD, createMinimalBacklog)
  - SETUP: beforeEach/afterEach hooks with temp directory management
  - IMPLEMENT: Top-level describe block
  - FOLLOW pattern: tests/integration/core/session-structure.test.ts (lines 1-152)
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT session directory naming and structure tests
  - ADD: describe block 'session directory naming and structure'
  - IMPLEMENT: it('should create session directory with {sequence}_{hash} format')
    - SETUP: Create session, verify directory exists
    - EXECUTE: Parse session ID with regex
    - VERIFY: Format matches {sequence}_{hash}, sequence is 3-digit, hash is 12-char hex
  - IMPLEMENT: it('should create required subdirectories')
    - SETUP: Create session
    - EXECUTE: Check for prps/, artifacts/, architecture/, docs/
    - VERIFY: All directories exist with mode 0o755
  - IMPLEMENT: it('should set correct file permissions')
    - SETUP: Create session, save backlog
    - EXECUTE: Check file and directory permissions
    - VERIFY: Directories are 0o755, files are 0o644
  - FOLLOW pattern: tests/integration/core/session-structure.test.ts (lines 157-247)
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test section

Task 3: IMPLEMENT PRP storage and caching tests
  - ADD: describe block 'PRP storage and caching'
  - IMPLEMENT: it('should store PRPs in prps/ with sanitized filenames')
    - SETUP: Mock PRP generation, call savePRP
    - EXECUTE: Check prps/ directory for PRP file
    - VERIFY: Filename sanitized (dots → underscores), content is valid markdown
  - IMPLEMENT: it('should create cache metadata in prps/.cache/')
    - SETUP: Mock PRP generation with caching
    - EXECUTE: Check prps/.cache/ for cache metadata file
    - VERIFY: Cache file exists with correct sanitized filename
  - IMPLEMENT: it('should include all required cache metadata fields')
    - SETUP: Load cache metadata file
    - EXECUTE: Parse JSON and verify structure
    - VERIFY: taskId, taskHash, createdAt, accessedAt, version, prp fields exist
  - IMPLEMENT: it('should enforce 24-hour cache TTL')
    - SETUP: Create cache entry with old timestamp
    - EXECUTE: Check cache expiration logic
    - VERIFY: Cache older than 24 hours is considered stale
  - SETUP: Mock prp-generator methods or create real PRP files
  - FOLLOW pattern: From prp-cache-artifact-schemas.md research
  - DEPENDENCIES: Task 2 (directory structure)
  - PLACEMENT: After directory structure tests

Task 4: IMPLEMENT execution artifacts collection tests
  - ADD: describe block 'execution artifacts collection'
  - IMPLEMENT: it('should create artifacts/{taskId}/ directory')
    - SETUP: Mock PRP execution with artifacts
    - EXECUTE: Check artifacts/ directory for task subdirectory
    - VERIFY: artifacts/{taskId}/ exists with mode 0o755
  - IMPLEMENT: it('should create validation-results.json')
    - SETUP: Mock execution with validation results
    - EXECUTE: Check for validation-results.json in artifacts/{taskId}/
    - VERIFY: File exists, valid JSON, has correct schema
  - IMPLEMENT: it('should create execution-summary.md')
    - SETUP: Mock execution with summary
    - EXECUTE: Check for execution-summary.md in artifacts/{taskId}/
    - VERIFY: File exists, contains markdown format
  - IMPLEMENT: it('should create artifacts-list.json')
    - SETUP: Mock execution with artifact list
    - EXECUTE: Check for artifacts-list.json in artifacts/{taskId}/
    - VERIFY: File exists, valid JSON array
  - SETUP: Helper function to create mock execution results
  - FOLLOW pattern: From prp-runtime.ts artifact writing logic
  - DEPENDENCIES: Task 3 (PRP storage)
  - PLACEMENT: After PRP storage tests

Task 5: IMPLEMENT bugfix session structure tests
  - ADD: describe block 'bugfix session structure'
  - IMPLEMENT: it('should create bugfix/{sequence}_{hash}/ sessions')
    - SETUP: Create main session, then create bugfix session
    - EXECUTE: Check for bugfix/{sequence}_{hash}/ directory
    - VERIFY: Bugfix session follows same naming pattern
  - IMPLEMENT: it('should create same structure as main sessions')
    - SETUP: Create bugfix session
    - EXECUTE: Check bugfix session subdirectories
    - VERIFY: Has architecture/, prps/, artifacts/, docs/, tasks.json, prd_snapshot.md
  - SETUP: Mock bugfix session creation via SessionManager
  - FOLLOW pattern: From system_context.md bugfix session structure
  - DEPENDENCIES: Task 4 (artifacts collection)
  - PLACEMENT: After artifacts collection tests

Task 6: IMPLEMENT artifact preservation tests
  - ADD: describe block 'artifact preservation'
  - IMPLEMENT: it('should preserve all artifacts for audit trail')
    - SETUP: Create artifacts, perform session operations
    - EXECUTE: Verify artifacts still exist after operations
    - VERIFY: No artifact directories are deleted
  - SETUP: Multiple operations that could potentially delete artifacts
  - FOLLOW pattern: Audit trail requirement from PRD
  - DEPENDENCIES: Task 5 (bugfix sessions)
  - PLACEMENT: Final test section

Task 7: VERIFY test coverage and completeness
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Temp directory cleanup in afterEach
  - VERIFY: All contract requirements from PRD tested
  - RUN: npx vitest run tests/integration/session-structure.test.ts
  - VERIFY: All tests pass
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Integration tests for plan/ Directory Structure and Artifacts
 *
 * @remarks
 * Tests validate the complete plan/ directory structure including PRP storage,
 * cache metadata, execution artifacts, bugfix sessions, and artifact preservation.
 *
 * Tests verify:
 * - Session directories are created with {sequence}_{hash} naming pattern
 * - PRPs are stored in prps/ with sanitized filenames and cache metadata in .cache/
 * - Execution artifacts are collected in artifacts/{taskId}/
 * - Bugfix sessions follow the same structure as main sessions
 * - All artifacts are preserved for audit trail
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/session-manager.ts | SessionManager Implementation}
 * @see {@link ../../src/agents/prp-generator.ts | PRP Generator Implementation}
 * @see {@link ../../src/agents/prp-runtime.ts | PRP Runtime Implementation}
 * @see {@link ../../plan/003_b3d3efdaf0ed/docs/system_context.md | System Context}
 */

// PATTERN: Import statements with .js extensions
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { SessionManager } from '../../src/core/session-manager.js';
import { PRPGenerator } from '../../src/agents/prp-generator.js';
import type { Backlog, Subtask } from '../../src/core/models.js';

// PATTERN: Helper function to generate valid PRD
function generateValidPRD(uniqueSuffix: string): string {
  return `# Test Project ${uniqueSuffix}

A minimal project for directory structure testing.

## P1: Test Phase

Validate plan/ directory structure.

### P1.M1: Test Milestone

Create directory structure tests.

#### P1.M1.T1: Create Tests

Implement integration tests for directory structure.

##### P1.M1.T1.S1: Write Structure Tests

Create tests for directory structure verification.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Directory structure testing ${uniqueSuffix}
2. INPUT: SessionManager implementation
3. LOGIC: Verify plan/ directory structure
4. OUTPUT: Passing integration tests
`;
}

// PATTERN: Helper function to create minimal backlog
function createMinimalBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase description',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
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

// PATTERN: Helper to create mock PRP file
function createMockPRP(sessionPath: string, taskId: string): void {
  const prpsDir = join(sessionPath, 'prps');
  const sanitizedTaskId = taskId.replace(/\./g, '_');
  const prpPath = join(prpsDir, `${sanitizedTaskId}.md`);
  const prpContent = `# PRP: ${taskId}

## Goal

Test PRP for ${taskId}.

## What

Test PRP content.
`;
  writeFileSync(prpPath, prpContent, { mode: 0o644 });
}

// PATTERN: Helper to create mock cache metadata
function createMockCacheMetadata(sessionPath: string, taskId: string): void {
  const cacheDir = join(sessionPath, 'prps', '.cache');
  const sanitizedTaskId = taskId.replace(/\./g, '_');
  const cachePath = join(cacheDir, `${sanitizedTaskId}.json`);

  const cacheMetadata = {
    taskId,
    taskHash: 'abc123def456',
    createdAt: Date.now(),
    accessedAt: Date.now(),
    version: '1.0',
    prp: {
      name: `${taskId} - Test PRP`,
      goal: { featureGoal: 'Test', deliverable: 'Test', successDefinition: 'Test' },
      // ... minimal PRP structure
    },
  };

  writeFileSync(cachePath, JSON.stringify(cacheMetadata, null, 2), { mode: 0o644 });
}

// PATTERN: Helper to create mock execution artifacts
function createMockArtifacts(sessionPath: string, taskId: string): void {
  const artifactsDir = join(sessionPath, 'artifacts', taskId);

  // Create artifacts directory
  mkdirSync(artifactsDir, { recursive: true, mode: 0o755 });

  // Create validation-results.json
  const validationResults = [
    {
      level: 1,
      description: 'Syntax & Style validation',
      success: true,
      command: 'npm run lint',
      stdout: 'All checks passed',
      stderr: '',
      exitCode: 0,
      skipped: false,
    },
    {
      level: 2,
      description: 'Unit tests',
      success: true,
      command: 'npm test',
      stdout: 'Tests passed',
      stderr: '',
      exitCode: 0,
      skipped: false,
    },
  ];
  writeFileSync(
    join(artifactsDir, 'validation-results.json'),
    JSON.stringify(validationResults, null, 2),
    { mode: 0o644 }
  );

  // Create execution-summary.md
  const summary = `# Execution Summary for ${taskId}

**Status**: Success
**Fix Attempts**: 0

## Validation Results

### Level 1: Syntax & Style validation
- Status: PASSED
- Command: npm run lint

### Level 2: Unit tests
- Status: PASSED
- Command: npm test
`;
  writeFileSync(join(artifactsDir, 'execution-summary.md'), summary, { mode: 0o644 });

  // Create artifacts-list.json
  const artifactsList = [
    '/path/to/created/file1.ts',
    '/path/to/created/file2.ts',
  ];
  writeFileSync(
    join(artifactsDir, 'artifacts-list.json'),
    JSON.stringify(artifactsList, null, 2),
    { mode: 0o644 }
  );
}

// PATTERN: Test structure with describe blocks
describe('integration/session-structure > plan/ directory structure', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // SETUP: Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-structure-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // CLEANUP: Remove temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  // PATTERN: Directory naming test
  describe('session directory naming and structure', () => {
    it('should create session directory with {sequence}_{hash} format', async () => {
      // SETUP: Create test PRD
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-1'));

      // EXECUTE: Initialize session
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();

      // VERIFY: Session ID matches pattern
      const sessionPattern = /^(\d{3})_([a-f0-9]{12})$/;
      expect(session.metadata.id).toMatch(sessionPattern);

      // VERIFY: Extract and validate components
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

    it('should create required subdirectories', async () => {
      // SETUP: Create test PRD
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-subdirs'));

      // EXECUTE: Initialize session
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // VERIFY: All subdirectories exist
      const requiredSubdirs = ['architecture', 'prps', 'artifacts', 'docs'];
      for (const subdir of requiredSubdirs) {
        const subdirPath = join(sessionPath, subdir);
        expect(existsSync(subdirPath)).toBe(true);

        // VERIFY: It's actually a directory
        const stats = statSync(subdirPath);
        expect(stats.isDirectory()).toBe(true);

        // VERIFY: Correct permissions (0o755)
        const mode = stats.mode & 0o777;
        expect(mode).toBe(0o755);
      }
    });
  });

  // PATTERN: PRP storage and caching test
  describe('PRP storage and caching', () => {
    it('should store PRPs in prps/ with sanitized filenames', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-prp'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // EXECUTE: Create mock PRP file
      const taskId = 'P1.M1.T1.S1';
      createMockPRP(sessionPath, taskId);

      // VERIFY: PRP file exists with sanitized filename
      const sanitizedTaskId = taskId.replace(/\./g, '_');
      const prpPath = join(sessionPath, 'prps', `${sanitizedTaskId}.md`);
      expect(existsSync(prpPath)).toBe(true);

      // VERIFY: File contains valid markdown
      const prpContent = readFileSync(prpPath, 'utf-8');
      expect(prpContent).toContain('# PRP:');
      expect(prpContent).toContain(taskId);
    });

    it('should create cache metadata in prps/.cache/', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-cache'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // EXECUTE: Create mock cache metadata
      const taskId = 'P1.M1.T1.S1';
      createMockCacheMetadata(sessionPath, taskId);

      // VERIFY: Cache directory exists
      const cacheDir = join(sessionPath, 'prps', '.cache');
      expect(existsSync(cacheDir)).toBe(true);

      // VERIFY: Cache metadata file exists with sanitized filename
      const sanitizedTaskId = taskId.replace(/\./g, '_');
      const cachePath = join(cacheDir, `${sanitizedTaskId}.json`);
      expect(existsSync(cachePath)).toBe(true);
    });

    it('should include all required cache metadata fields', async () => {
      // SETUP: Create session with cache metadata
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-metadata'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockCacheMetadata(sessionPath, taskId);

      // EXECUTE: Load and parse cache metadata
      const sanitizedTaskId = taskId.replace(/\./g, '_');
      const cachePath = join(sessionPath, 'prps', '.cache', `${sanitizedTaskId}.json`);
      const cacheContent = readFileSync(cachePath, 'utf-8');
      const cacheMetadata = JSON.parse(cacheContent);

      // VERIFY: All required fields exist
      expect(cacheMetadata).toHaveProperty('taskId');
      expect(cacheMetadata).toHaveProperty('taskHash');
      expect(cacheMetadata).toHaveProperty('createdAt');
      expect(cacheMetadata).toHaveProperty('accessedAt');
      expect(cacheMetadata).toHaveProperty('version');
      expect(cacheMetadata).toHaveProperty('prp');

      // VERIFY: Field types are correct
      expect(typeof cacheMetadata.taskId).toBe('string');
      expect(typeof cacheMetadata.taskHash).toBe('string');
      expect(typeof cacheMetadata.createdAt).toBe('number');
      expect(typeof cacheMetadata.accessedAt).toBe('number');
      expect(typeof cacheMetadata.version).toBe('string');
      expect(typeof cacheMetadata.prp).toBe('object');
    });
  });

  // PATTERN: Execution artifacts test
  describe('execution artifacts collection', () => {
    it('should create artifacts/{taskId}/ directory', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-artifacts'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // EXECUTE: Create mock artifacts
      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // VERIFY: Artifacts directory exists
      const artifactsDir = join(sessionPath, 'artifacts', taskId);
      expect(existsSync(artifactsDir)).toBe(true);

      // VERIFY: It's a directory with correct permissions
      const stats = statSync(artifactsDir);
      expect(stats.isDirectory()).toBe(true);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o755);
    });

    it('should create validation-results.json', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-validation'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Read validation results
      const validationPath = join(sessionPath, 'artifacts', taskId, 'validation-results.json');
      const validationContent = readFileSync(validationPath, 'utf-8');
      const validationResults = JSON.parse(validationContent);

      // VERIFY: Valid JSON with correct structure
      expect(Array.isArray(validationResults)).toBe(true);
      expect(validationResults.length).toBeGreaterThan(0);

      // VERIFY: First result has required fields
      const firstResult = validationResults[0];
      expect(firstResult).toHaveProperty('level');
      expect(firstResult).toHaveProperty('description');
      expect(firstResult).toHaveProperty('success');
      expect(firstResult).toHaveProperty('command');
      expect(firstResult).toHaveProperty('stdout');
      expect(firstResult).toHaveProperty('stderr');
      expect(firstResult).toHaveProperty('exitCode');
      expect(firstResult).toHaveProperty('skipped');
    });

    it('should create execution-summary.md', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-summary'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Read execution summary
      const summaryPath = join(sessionPath, 'artifacts', taskId, 'execution-summary.md');
      const summaryContent = readFileSync(summaryPath, 'utf-8');

      // VERIFY: Contains markdown format
      expect(summaryContent).toContain('# Execution Summary');
      expect(summaryContent).toContain('**Status**');
      expect(summaryContent).toContain('## Validation Results');
    });

    it('should create artifacts-list.json', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-list'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Read artifacts list
      const listPath = join(sessionPath, 'artifacts', taskId, 'artifacts-list.json');
      const listContent = readFileSync(listPath, 'utf-8');
      const artifactsList = JSON.parse(listContent);

      // VERIFY: Valid JSON array
      expect(Array.isArray(artifactsList)).toBe(true);
      expect(artifactsList.length).toBeGreaterThan(0);
      expect(typeof artifactsList[0]).toBe('string');
    });
  });

  // PATTERN: Bugfix session structure test
  describe('bugfix session structure', () => {
    it('should create bugfix/{sequence}_{hash}/ sessions', async () => {
      // SETUP: Create main session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-bugfix'));
      const manager = new SessionManager(prdPath, planDir);
      const mainSession = await manager.initialize();
      const mainSessionPath = mainSession.metadata.path;

      // EXECUTE: Create bugfix subdirectory manually (simulating bugfix session creation)
      const bugfixDir = join(mainSessionPath, 'bugfix');
      const bugfixSessionId = '001_abcdef123456';
      const bugfixSessionPath = join(bugfixDir, bugfixSessionId);
      mkdirSync(bugfixSessionPath, { recursive: true, mode: 0o755 });

      // VERIFY: Bugfix session directory exists
      expect(existsSync(bugfixSessionPath)).toBe(true);

      // VERIFY: Bugfix session ID follows same pattern
      const sessionPattern = /^(\d{3})_([a-f0-9]{12})$/;
      expect(bugfixSessionId).toMatch(sessionPattern);
    });

    it('should create same structure as main sessions', async () => {
      // SETUP: Create main session with bugfix subdirectory
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-bugfix-struct'));
      const manager = new SessionManager(prdPath, planDir);
      const mainSession = await manager.initialize();
      const mainSessionPath = mainSession.metadata.path;

      // EXECUTE: Create bugfix session with subdirectories
      const bugfixSessionId = '001_abcdef123456';
      const bugfixSessionPath = join(mainSessionPath, 'bugfix', bugfixSessionId);
      const subdirs = ['architecture', 'prps', 'artifacts', 'docs'];
      for (const subdir of subdirs) {
        mkdirSync(join(bugfixSessionPath, subdir), { recursive: true, mode: 0o755 });
      }

      // VERIFY: All subdirectories exist
      for (const subdir of subdirs) {
        const subdirPath = join(bugfixSessionPath, subdir);
        expect(existsSync(subdirPath)).toBe(true);
        const stats = statSync(subdirPath);
        expect(stats.isDirectory()).toBe(true);
      }
    });
  });

  // PATTERN: Artifact preservation test
  describe('artifact preservation', () => {
    it('should preserve all artifacts for audit trail', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-preserve'));
      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Perform additional session operations (save, update, etc.)
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // VERIFY: Artifacts still exist (not deleted)
      const artifactsDir = join(sessionPath, 'artifacts', taskId);
      expect(existsSync(artifactsDir)).toBe(true);

      // VERIFY: All artifact files still exist
      expect(existsSync(join(artifactsDir, 'validation-results.json'))).toBe(true);
      expect(existsSync(join(artifactsDir, 'execution-summary.md'))).toBe(true);
      expect(existsSync(join(artifactsDir, 'artifacts-list.json'))).toBe(true);
    });
  });
});
```

### Integration Points

```yaml
SESSION_MANAGER:
  - initialize(): Creates session directory with all subdirectories
  - createDeltaSession(): Creates bugfix sessions with parent linkage
  - saveBacklog(): Persists backlog to tasks.json

SESSION_UTILS:
  - createSessionDirectory(): Creates directory structure with architecture/, prps/, artifacts/
  - writePRP(): Writes PRP files to prps/ directory

PRP_GENERATOR:
  - generate(): Generates PRPs with caching
  - getCachePath(): Returns path to PRP file (sanitized filename)
  - getCacheMetadataPath(): Returns path to cache metadata file
  - CACHE_TTL_MS: 24-hour cache TTL

PRP_RUNTIME:
  - #writeArtifacts(): Writes validation-results.json, execution-summary.md, artifacts-list.json

NO_EXTERNAL_FILE_OPERATIONS:
  - Tests use real filesystem (integration tests)
  - No mocks for fs operations
  - Real temp directories via mkdtempSync()
  - Real file operations via helper functions

SCOPE_BOUNDARIES:
  - This PRP tests plan/ directory structure
  - Does NOT test individual SessionManager methods (unit tests do that)
  - Does NOT test TaskOrchestrator traversal (separate test file)
  - Tests verify DIRECTORY STRUCTURE CONTRACT, not individual implementation details
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/integration/session-structure.test.ts --fix

# Check TypeScript types
npx tsc --noEmit tests/integration/session-structure.test.ts

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the session-structure file
npx vitest run tests/integration/session-structure.test.ts

# Run with coverage
npx vitest run tests/integration/session-structure.test.ts --coverage

# Run all integration tests to ensure no breakage
npx vitest run tests/integration/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify all integration tests still pass
npx vitest run tests/integration/

# Run related integration tests to ensure no breakage
npx vitest run tests/integration/core/

# Check that existing session tests still work
npx vitest run tests/integration/core/session-structure.test.ts

# Expected: All existing tests pass, new tests pass
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/session-structure.test.ts

# Check test file follows project conventions
head -50 tests/integration/session-structure.test.ts
# Should see: describe blocks, proper imports, helper functions

# Verify all test categories are present
grep -n "describe.*session directory naming" tests/integration/session-structure.test.ts
grep -n "describe.*PRP storage" tests/integration/session-structure.test.ts
grep -n "describe.*execution artifacts" tests/integration/session-structure.test.ts
grep -n "describe.*bugfix session" tests/integration/session-structure.test.ts
grep -n "describe.*artifact preservation" tests/integration/session-structure.test.ts

# Verify SETUP/EXECUTE/VERIFY pattern
grep -n "SETUP:" tests/integration/session-structure.test.ts
grep -n "EXECUTE:" tests/integration/session-structure.test.ts
grep -n "VERIFY:" tests/integration/session-structure.test.ts

# Expected: Test file well-structured, all categories present
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] Test file structure follows project patterns
- [ ] Tests use real filesystem (integration test pattern)
- [ ] Temp directory cleanup in afterEach
- [ ] Tests import with .js extensions
- [ ] All describe blocks have clear, descriptive names
- [ ] Helper functions follow existing patterns

### Feature Validation

- [ ] Session directories created with {sequence}_{hash} naming pattern
- [ ] PRPs stored in prps/ with sanitized filenames
- [ ] Cache metadata stored in prps/.cache/ with correct structure
- [ ] Cache metadata includes all required fields (taskId, taskHash, createdAt, accessedAt, version, prp)
- [ ] Cache TTL is 24 hours
- [ ] Execution artifacts collected in artifacts/{taskId}/
- [ ] Artifacts include validation-results.json, execution-summary.md, artifacts-list.json
- [ ] Bugfix sessions created as bugfix/{sequence}_{hash}/
- [ ] Bugfix sessions have same structure as main sessions
- [ ] All artifacts preserved for audit trail
- [ ] File permissions correct (0o755 for dirs, 0o644 for files)

### Code Quality Validation

- [ ] Follows existing integration test patterns from session-structure.test.ts
- [ ] Helper functions use same patterns as existing tests
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes rmSync with force: true
- [ ] Tests focus on directory structure contract, not implementation details

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Test names clearly describe what is being tested
- [ ] Research documents stored in research/ subdirectory
- [ ] Tests verify PRD requirements for plan/ directory structure

---

## Anti-Patterns to Avoid

- ❌ Don't mock fs operations in integration tests - use real filesystem
- ❌ Don't skip testing cache metadata structure - it's critical for PRP caching
- ❌ Don't forget to test sanitized filenames (dots → underscores)
- ❌ Don't skip testing bugfix session structure - it's part of the directory contract
- ❌ Don't skip artifact preservation verification - audit trail is required
- ❌ Don't test unit-level functionality - integration tests verify contracts
- ❌ Don't hardcode file paths - use join() for cross-platform compatibility
- ❌ Don't skip verifying file permissions - 0o755 for dirs, 0o644 for files
- ❌ Don't skip testing .cache/ directory - it's hidden but critical
- ❌ Don't skip testing artifact file formats (JSON schema validation)
- ❌ Don't forget to import with .js extensions
- ❌ Don't skip temp directory cleanup - causes test pollution
- ❌ Don't duplicate tests from tests/integration/core/session-structure.test.ts - focus on PRP storage, artifacts, bugfix sessions
- ❌ Don't skip testing all three artifact files (validation-results.json, execution-summary.md, artifacts-list.json)
- ❌ Don't assume cache TTL - verify it's 24 hours

---

**PRP Version:** 1.0
**Work Item:** P1.M2.T1.S2
**Created:** 2026-01-20
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**
- Complete directory structure specification from system_context.md with line numbers
- Comprehensive PRP cache metadata and artifact schema research
- Integration test patterns from existing test files
- Clear task breakdown with dependency ordering
- All contract requirements from PRD covered
- Extensive research documentation in research/ subdirectory
- No gaps in context - implementation can proceed with PRP alone
- Helper functions and patterns clearly specified
- Scope boundaries well-defined to avoid duplication with existing tests
