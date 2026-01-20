# PRP: Fix prd_snapshot.md Creation Failure - P2.M1.T2.S3

## Goal

**Feature Goal**: Fix the root cause of prd_snapshot.md creation failure in E2E tests by ensuring the file is created with exact PRD content after session initialization succeeds.

**Deliverable**: Validated prd_snapshot.md creation through E2E test execution with file existence, correct PRD content, and no ENOENT errors.

**Success Definition**:
- prd_snapshot.md file exists in session directory after E2E test run
- File contains exact PRD content from the original PRD.md file
- No ENOENT errors when accessing prd_snapshot.md
- File is readable and contains expected PRD sections
- Tests complete successfully with proper session initialization

## User Persona

**Target User**: Development team running E2E tests to validate complete PRP pipeline functionality including PRD snapshot persistence

**Use Case**: Running `npm run test:run -- tests/e2e/pipeline.test.ts` to verify that prd_snapshot.md is created correctly during session initialization

**User Journey**:
1. Developer completes P2.M1.T2.S1 (session initialization fix)
2. E2E tests now pass session initialization and create session directory
3. prd_snapshot.md validation may still fail due to PRD content/write issues
4. This fix ensures prd_snapshot.md is created with correct content
5. All E2E tests pass with full PRD snapshot validated

**Pain Points Addressed**:
- ENOENT errors when trying to read prd_snapshot.md in tests
- Unclear why PRD snapshot write fails after session initialization succeeds
- Need to validate file contains exact PRD content, not corrupted or partial data
- Tests may pass for wrong reasons (mock interference)

## Why

- **Business Value**: prd_snapshot.md preserves the PRD state at session creation time for reference during implementation - without it, implementation context is lost
- **Integration**: Depends on P2.M1.T2.S1 session initialization fix - once session directory exists, prd_snapshot.md must be written correctly
- **Problem Solved**: Fixes the third issue identified in P2.M1.T1.S3 debug analysis - prd_snapshot.md not created, causing ENOENT in tests

## What

Fix the prd_snapshot.md creation failure by ensuring the PRD snapshot write operation works correctly after session initialization is fixed. The fix depends on the root cause identified during implementation:

### Potential Root Causes (to be determined during implementation)

1. **Mock Return Type Mismatch** (Primary suspect from P2.M1.T1.S3):
   - E2E test mocks `readFile` to return string instead of Buffer
   - PRDValidator's `readUTF8FileStrict()` expects Buffer for TextDecoder
   - Error: `ERR_INVALID_ARG_TYPE` thrown during PRD validation
   - Fix: Update E2E test mock to return Buffer instead of string

2. **PRD Content Issue**:
   - PRD content may be invalid or missing required sections
   - Fix: Ensure test fixture PRD has valid content with required sections
   - Validate: PRD content should be at least 100 characters with proper structure

3. **Write Operation Failure**:
   - File write may fail with permission/path errors
   - Fix: Add error handling and retry logic
   - Ensure session directory exists before write

4. **Session Initialization Timing**:
   - Write may happen before session directory is fully initialized
   - Fix: Ensure write completes after session directory creation
   - Add proper await/sequencing

### Success Criteria

- [ ] prd_snapshot.md file exists in session directory after E2E test execution
- [ ] File content matches original PRD content exactly
- [ ] No ENOENT errors when accessing prd_snapshot.md
- [ ] E2E test "should create valid prd_snapshot.md in session directory" passes
- [ ] File contains expected PRD sections (# Test Project, ## P1: Test Phase, etc.)
- [ ] Session Manager's initialize() method completes snapshot write successfully
- [ ] No Buffer/string type mismatch errors in PRD validation

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
1. Exact file locations and line numbers for PRD snapshot creation
2. Complete understanding of Buffer vs string return type issue
3. Dependency on P2.M1.T2.S1 session initialization fix (assumes it will be implemented)
4. PRD content validation requirements and patterns
5. Test structure and mock configuration
6. Root cause analysis from P2.M1.T1.S3 debug analysis
7. Clear decision tree for root cause determination
8. External research on Buffer handling in Node.js file operations

### Documentation & References

```yaml
# CRITICAL: Previous PRPs - Must be completed first
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T2S1/PRP.md
  why: Defines the session initialization fix that enables this work
  critical: After P2.M1.T2.S1, session directory exists and is writable
  contract: Session initialization completes successfully, sessionPath is non-empty

- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T2S2/PRP.md
  why: Defines the tasks.json creation fix happening in parallel
  critical: Both fixes depend on session initialization from P2.M1.T2.S1
  contract: After P2.M1.T2.S1, session directory exists for both files to be written

# CRITICAL: Root cause analysis - MUST READ
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md
  why: Complete timeline showing prd_snapshot.md creation failure
  critical: Lines 107-117 show ENOENT error when accessing prd_snapshot.md
  critical: Lines 69-80 show mock return type mismatch (string vs Buffer)
  section: "Mock Return Type Issue" - identifies root cause
  section: "Failed Tests" - "should create valid prd_snapshot.md in session directory"

# CRITICAL: Production code - PRD snapshot creation
- file: src/core/session-manager.ts
  why: Contains PRD snapshot write logic in initialize() method
  pattern: Lines 384-410 show complete snapshot creation implementation
  gotcha: Uses readFile('utf-8') which returns string, not Buffer
  gotcha: Direct writeFile without atomic write pattern (unlike tasks.json)
  code: |
    const prdContent = await readFile(this.prdPath, 'utf-8');
    const snapshotPath = resolve(sessionPath, 'prd_snapshot.md');
    await writeFile(snapshotPath, prdContent, { mode: 0o644 });

# CRITICAL: Alternative implementation - snapshotPRD function
- file: src/core/session-utils.ts
  why: Contains snapshotPRD() function that uses readUTF8FileStrict
  pattern: Lines 682-767 show complete snapshotPRD implementation
  gotcha: Uses readUTF8FileStrict() which expects Buffer from readFile
  gotcha: This function is NOT currently used by SessionManager
  code: |
    const content = await readUTF8FileStrict(absPRDPath, 'read PRD');
    const snapshotPath = resolve(absSessionPath, 'prd_snapshot.md');
    await writeFile(snapshotPath, content, { mode: 0o644 });

# CRITICAL: PRD validation with Buffer expectation
- file: src/utils/prd-validator.ts
  why: Contains readUTF8FileStrict() that expects Buffer from readFile
  pattern: Line 204 shows TextDecoder usage with Buffer expectation
  gotcha: Throws ERR_INVALID_ARG_TYPE when receives string instead of Buffer
  code: |
    const buffer = await readFile(path);
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer);

# CRITICAL: E2E test mock configuration
- file: tests/e2e/pipeline.test.ts
  why: Shows how readFile is mocked and needs to be fixed
  pattern: Lines 240-249 show readFile mock implementation
  gotcha: Mock returns string, but production code expects Buffer
  gotcha: This causes ERR_INVALID_ARG_TYPE in TextDecoder.decode()
  code: |
    vi.mocked(readFile).mockImplementation((path) => {
      if (String(path).includes('PRD.md')) {
        return Promise.resolve(mockSimplePRD); // Returns string, not Buffer!
      }
      return Promise.resolve('');
    });

# CRITICAL: E2E test assertions for prd_snapshot.md
- file: tests/e2e/pipeline.test.ts
  why: Shows how prd_snapshot.md creation is validated
  pattern: Lines 320-332 show test assertions for prd_snapshot.md
  gotcha: Test uses existsSync and readFileSync to validate file
  code: |
    const prdSnapshotPath = join(result.sessionPath, 'prd_snapshot.md');
    expect(existsSync(prdSnapshotPath)).toBe(true);
    const prdSnapshot = readFileSync(prdSnapshotPath, 'utf-8');
    expect(prdSnapshot).toContain('# Test Project');

# CRITICAL: Test fixture PRD content
- file: tests/fixtures/simple-prd.ts
  why: Contains mock PRD content used in E2E tests
  pattern: Complete PRD structure with required sections
  gotcha: Must be at least 100 characters for PRDValidator
  gotcha: Should contain # Test Project and ## P1: Test Phase sections

# CRITICAL: Session Manager initialization flow
- file: src/core/session-manager.ts
  why: Shows when prd_snapshot.md is created during session initialization
  pattern: Lines 384-410 in initialize() method
  gotcha: Snapshot write happens AFTER session directory creation
  gotcha: Uses this.prdPath which is set in constructor

# CRITICAL: Retry utility for file operations
- file: src/utils/retry.ts
  why: Provides retry mechanism for transient file operation errors
  pattern: retry() function with exponential backoff
  gotcha: Can be used if write operations fail intermittently
  gotcha: isTransientError() checks for ECONNRESET, ETIMEDOUT, etc.

# CRITICAL: File system error handling
- file: src/utils/errors.ts
  why: Defines SessionFileError for file operation failures
  pattern: SessionFileError class with path, operation, code properties
  gotcha: Preserves original error code for root cause analysis
  gotcha: Used throughout session-utils for file operations

# RESEARCH: Node.js Buffer vs String in readFile
- url: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
  why: Official docs on readFile return type
  critical: readFile with encoding returns string, without encoding returns Buffer
  critical: TextDecoder.decode() requires Buffer or ArrayBufferView, not string
  section: "fsPromises.readFile(path[, options])"

# RESEARCH: Node.js TextDecoder documentation
- url: https://nodejs.org/api/util.html#util_class_textdecoder
  why: Official docs on TextDecoder requirements
  critical: TextDecoder.decode() first argument must be Buffer or ArrayBufferView
  critical: Passing string throws ERR_INVALID_ARG_TYPE
  section: "decoder.decode([input[, options]])"

# RESEARCH: E2E test mock patterns
- agent_id: a2acb23
  why: Comprehensive analysis of PRD snapshot creation in codebase
  critical: Identified two implementations (SessionManager vs session-utils)
  critical: Found mock return type mismatch issue

# RESEARCH: File system error handling patterns
- agent_id: aa7741c
  why: Complete analysis of error handling and retry patterns
  critical: Shows retry utility usage for transient errors
  critical: Documents SessionFileError usage patterns

# RESEARCH: Test patterns for PRD validation
- agent_id: aeb66d4
  why: Detailed analysis of PRD validation and snapshot testing patterns
  critical: Shows test fixture requirements (100+ characters, required sections)
  critical: Documents mock patterns for file system operations
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts       # SessionManager.initialize() creates prd_snapshot.md
│   │   ├── session-utils.ts         # snapshotPRD() alternative implementation
│   │   └── models.ts                # Session-related data models
│   ├── utils/
│   │   ├── prd-validator.ts         # readUTF8FileStrict() expects Buffer
│   │   ├── retry.ts                 # Retry utility for transient errors
│   │   └── errors.ts                # SessionFileError class
│   └── workflows/
│       └── prp-pipeline.ts          # PRPPipeline.run() → SessionManager.initialize()
├── tests/
│   ├── e2e/
│   │   └── pipeline.test.ts         # E2E tests with mock configuration
│   ├── fixtures/
│   │   └── simple-prd.ts            # Mock PRD content for tests
│   └── unit/
│       ├── core/
│       │   └── session-utils.test.ts # Unit tests for snapshotPRD()
│       └── utils/
│           └── prd-validator.test.ts  # Unit tests for PRD validation
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        ├── P2M1T2S1/
        │   └── PRP.md               # Session initialization fix (DEPENDENCY)
        ├── P2M1T2S2/
        │   └── PRP.md               # tasks.json creation fix (PARALLEL)
        ├── P2M1T2S3/
        │   └── PRP.md               # This document
        ├── architecture/
        │   └── e2e-debug-analysis.md # Root cause analysis
        └── P2M1T2S3/
            └── research/            # Research notes storage
```

### Desired Codebase Tree

```bash
# No structural changes expected - this is a bugfix
# Changes may be needed to:
# - tests/e2e/pipeline.test.ts (if mocks need to return Buffer)
# - src/core/session-manager.ts (if snapshot write logic needs enhancement)
# - tests/fixtures/simple-prd.ts (if PRD content needs validation)

# The exact file(s) to modify will be determined by root cause analysis
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Session initialization MUST be fixed first (P2.M1.T2.S1)
// PRD snapshot write depends on session directory existing and being writable
// If P2.M1.T2.S1 is not complete, this fix will fail

// CRITICAL: Mock return type mismatch is the PRIMARY suspect
// E2E test mocks readFile to return string
// Production code (readUTF8FileStrict) expects Buffer
// TextDecoder.decode() throws ERR_INVALID_ARG_TYPE when given string
// This error is wrapped in SessionFileError and treated as non-fatal
// Pipeline continues without session initialization

// CRITICAL: Two different implementations exist
// 1. SessionManager.initialize() uses readFile(path, 'utf-8') → returns string
// 2. session-utils.snapshotPRD() uses readUTF8FileStrict() → expects Buffer
// SessionManager.initialize() is the ACTUAL code path used in production
// snapshotPRD() is NOT currently called by SessionManager

// CRITICAL: readFile encoding parameter changes return type
// readFile(path) → returns Buffer
// readFile(path, 'utf-8') → returns string
// readFile(path, { encoding: 'utf-8' }) → returns string
// TextDecoder.decode() requires Buffer, not string

// CRITICAL: Test mocks interfere with production behavior
// tests/e2e/pipeline.test.ts mocks readFile globally
// Mock returns string for all files, including PRD.md
// This works for readFile(path, 'utf-8') in SessionManager
// But breaks readUTF8FileStrict() if it's called elsewhere

// CRITICAL: Error is treated as non-fatal
// isFatalError() determines SessionFileError is non-fatal
// Pipeline continues with currentSession: null
// Session directory never created
// prd_snapshot.md and tasks.json never written

// CRITICAL: No atomic write for prd_snapshot.md
// tasks.json uses atomic write pattern (temp file + rename)
// prd_snapshot.md uses direct writeFile
// This is intentional - PRD snapshot is not critical state
// But means partial writes could create corrupted files

// CRITICAL: PRD content validation requirements
// PRDValidator requires minimum 100 characters
// PRDValidator checks for required sections (Executive Summary, etc.)
// Test fixture must meet these requirements
// Otherwise PRD validation fails and session initialization fails

// CRITICAL: File mode 0o644 for PRD snapshot
// writeFile uses { mode: 0o644 }
// This is owner read/write, group/others read-only
// Ensure parent directory allows write permissions

// CRITICAL: Session path resolution
// SessionManager uses resolve(sessionPath, 'prd_snapshot.md')
// sessionPath comes from createSessionDirectory()
// If sessionPath is empty/undefined, resolve will fail

// CRITICAL: E2E test uses existsSync to check file existence
// existsSync may be mocked in tests
// Test may pass for wrong reasons if mock returns true
// Need to verify actual file exists on disk

// CRITICAL: Test fixture content validation
// simple-prd.ts must contain valid PRD structure
// Must have # Test Project header
// Must have ## P1: Test Phase section
// Must be at least 100 characters
```

## Implementation Blueprint

### Data Models and Structure

Existing data models used:

- **Session**: Contains session metadata and paths from `src/core/session-manager.ts`
- **SessionFileError**: Custom error class for file operation failures
- **PRDValidator**: Validates PRD content and structure

```typescript
// Session structure (from session-manager.ts)
interface Session {
  id: string;
  metadata: {
    path: string;        // Session directory path
    prdPath: string;     // Original PRD file path
    createdAt: Date;
    status: SessionStatus;
  };
}

// PRD snapshot creation (from session-manager.ts:384-410)
const prdContent = await readFile(this.prdPath, 'utf-8'); // Returns string
const snapshotPath = resolve(sessionPath, 'prd_snapshot.md');
await writeFile(snapshotPath, prdContent, { mode: 0o644 });

// Alternative implementation (from session-utils.ts:682-767)
export async function snapshotPRD(sessionPath: string, prdPath: string): Promise<void> {
  const content = await readUTF8FileStrict(absPRDPath, 'read PRD'); // Expects Buffer
  const snapshotPath = resolve(absSessionPath, 'prd_snapshot.md');
  await writeFile(snapshotPath, content, { mode: 0o644 });
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: DETERMINE ROOT CAUSE of prd_snapshot.md creation failure
  - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
  - ANALYZE: Test output to find specific error
  - CHECK: Is it Buffer/string type mismatch? Look for "ERR_INVALID_ARG_TYPE"
  - CHECK: Is it PRD validation error? Look for PRD validation failures
  - CHECK: Is it file system error? Look for error codes (ENOENT, EACCES, etc.)
  - CHECK: Is it timing issue? Look for session directory creation timing
  - DOCUMENT: Root cause in research notes

Task 2: IF BUFFER/STRING TYPE MISMATCH (Primary suspect)
  - SUBTASK 2a: Verify mock return type issue
    - FILE: tests/e2e/pipeline.test.ts
    - LINES: 240-249 (readFile mock implementation)
    - CHECK: Does mock return string for PRD.md?
    - CHECK: Does production code expect Buffer?
    - VERIFY: readUTF8FileStrict() calls readFile without encoding

  - SUBTASK 2b: Update E2E test mock to return Buffer
    - FILE: tests/e2e/pipeline.test.ts
    - FUNCTION: vi.mocked(readFile).mockImplementation()
    - CHANGE: Return Buffer instead of string for PRD.md
    - BEFORE: Promise.resolve(mockSimplePRD) // Returns string
    - AFTER: Promise.resolve(Buffer.from(mockSimplePRD)) // Returns Buffer
    - PRESERVE: Mock behavior for other files

  - SUBTASK 2c: Verify SessionManager.initialize() works with string
    - FILE: src/core/session-manager.ts
    - LINES: 384-410 (PRD snapshot creation)
    - VERIFY: Uses readFile(this.prdPath, 'utf-8') which returns string
    - VERIFY: This is correct - no change needed
    - UNDERSTAND: The issue is in PRDValidator, not SessionManager

  - SUBTASK 2d: Validate fix
    - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
    - EXPECT: No ERR_INVALID_ARG_TYPE errors
    - EXPECT: PRD validation passes
    - EXPECT: prd_snapshot.md created successfully

Task 3: IF PRD CONTENT INVALID
  - SUBTASK 3a: Check test fixture PRD content
    - FILE: tests/fixtures/simple-prd.ts
    - VALIDATE: Content is at least 100 characters
    - VALIDATE: Has required sections (# Test Project, ## P1: Test Phase)
    - CHECK: Structure matches PRDValidator requirements

  - SUBTASK 3b: Fix test fixture if needed
    - UPDATE: simple-prd.ts to have valid content
    - ENSURE: Minimum 100 characters
    - ENSURE: Proper markdown structure
    - ENSURE: Required sections present

  - SUBTASK 3c: Validate fix
    - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
    - EXPECT: PRD validation passes
    - EXPECT: prd_snapshot.md created successfully

Task 4: IF WRITE OPERATION FAILING
  - SUBTASK 4a: Check file system permissions
    - VERIFY: Session directory exists (from P2.M1.T2.S1)
    - VERIFY: Directory is writable (mode 0o755)
    - CHECK: Sufficient disk space

  - SUBTASK 4b: Add retry logic if needed
    - FILE: src/core/session-manager.ts
    - FUNCTION: initialize() method
    - IMPORT: retry utility from src/utils/retry.ts
    - WRAP: writeFile call in retry() for transient errors
    - PRESERVE: Existing error handling

  - SUBTASK 4c: Validate fix
    - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
    - EXPECT: Write operation completes successfully
    - EXPECT: prd_snapshot.md created in session directory

Task 5: IF TIMING ISSUE
  - SUBTASK 5a: Check session initialization sequence
    - FILE: src/core/session-manager.ts
    - VERIFY: Session directory created before snapshot write
    - VERIFY: Proper await/sequencing in initialize() method
    - CHECK: No race conditions between directory creation and file write

  - SUBTASK 5b: Add proper sequencing if needed
    - ENSURE: await on createSessionDirectory() completes
    - ENSURE: await on writeFile() completes
    - ADD: Error handling for partial initialization

  - SUBTASK 5c: Validate fix
    - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
    - EXPECT: Session directory exists before prd_snapshot.md write
    - EXPECT: No timing-related errors

Task 6: RUN FULL E2E TEST SUITE to validate fix
  - COMMAND: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
  - EXPECT: All 7 tests pass
  - VALIDATE: prd_snapshot.md exists in session directory
  - VALIDATE: File content matches original PRD content
  - VALIDATE: No ENOENT errors
  - VALIDATE: No ERR_INVALID_ARG_TYPE errors

Task 7: VERIFY PRD SNAPSHOT CONTENT
  - CHECK: prd_snapshot.md file created in session directory
  - CHECK: File contains exact PRD content from original PRD.md
  - CHECK: File is readable and valid markdown
  - CHECK: File contains expected sections (# Test Project, etc.)

Task 8: DOCUMENT FIX in research notes
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T2S3/research/
  - CONTENT: Document root cause and fix applied
  - INCLUDE: Before/after comparison
  - INCLUDE: Lessons learned for future debugging
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Current PRD Snapshot Creation (SessionManager)
// ============================================================================
// From src/core/session-manager.ts:384-410

// SessionManager.initialize() method:
export async function initialize(prdPath: string, sessionPath: string): Promise<Session> {
  // ... session directory creation ...

  // 6. Write PRD snapshot
  const prdContent = await readFile(this.prdPath, 'utf-8');
  // NOTE: readFile with 'utf-8' encoding returns string, not Buffer
  // This is CORRECT for SessionManager - it doesn't use TextDecoder

  const snapshotPath = resolve(sessionPath, 'prd_snapshot.md');
  await writeFile(snapshotPath, prdContent, { mode: 0o644 });
  // NOTE: Direct write, no atomic pattern
  // This is intentional - PRD snapshot is not critical state

  this.logger.info(
    {
      prdPath: this.prdPath,
      snapshotPath,
      size: prdContent.length,
    },
    'PRD snapshot created successfully'
  );

  return session;
}

// ============================================================================
// PATTERN 2: Alternative PRD Snapshot Creation (session-utils)
// ============================================================================
// From src/core/session-utils.ts:682-767

export async function snapshotPRD(sessionPath: string, prdPath: string): Promise<void> {
  try {
    const absSessionPath = resolve(sessionPath);
    const absPRDPath = resolve(prdPath);

    // VALIDATE: Session directory exists
    if (!existsSync(absSessionPath)) {
      throw new SessionFileError(absSessionPath, 'find session directory');
    }

    // VALIDATE: PRD file exists
    if (!existsSync(absPRDPath)) {
      throw new SessionFileError(absPRDPath, 'find PRD file');
    }

    // READ: PRD content with strict UTF-8 validation
    const content = await readUTF8FileStrict(absPRDPath, 'read PRD');
    // CRITICAL: readUTF8FileStrict expects Buffer from readFile
    // CRITICAL: Uses TextDecoder which requires Buffer or ArrayBufferView
    // CRITICAL: Passing string will throw ERR_INVALID_ARG_TYPE

    // WRITE: PRD snapshot
    const snapshotPath = resolve(absSessionPath, 'prd_snapshot.md');
    await writeFile(snapshotPath, content, { mode: 0o644 });

    logger.info(
      {
        prdPath: absPRDPath,
        snapshotPath,
        size: content.length,
      },
      'PRD snapshot created successfully'
    );
  } catch (error) {
    if (error instanceof SessionFileError) {
      throw error;
    }
    throw new SessionFileError(
      resolve(sessionPath, 'prd_snapshot.md'),
      'create PRD snapshot',
      error as Error
    );
  }
}

// ============================================================================
// PATTERN 3: readUTF8FileStrict Implementation (prd-validator)
// ============================================================================
// From src/utils/prd-validator.ts:204

export async function readUTF8FileStrict(path: string, operation: string): Promise<string> {
  try {
    // READ: File as Buffer (no encoding parameter)
    const buffer = await readFile(path);
    // CRITICAL: readFile() without encoding returns Buffer
    // CRITICAL: If encoding is specified, returns string instead

    // DECODE: UTF-8 with fatal mode
    const decoder = new TextDecoder('utf-8', { fatal: true });
    // CRITICAL: TextDecoder.decode() requires Buffer or ArrayBufferView
    // CRITICAL: Passing string throws ERR_INVALID_ARG_TYPE

    return decoder.decode(buffer);
  } catch (error) {
    throw new SessionFileError(path, operation, error as Error);
  }
}

// ============================================================================
// PATTERN 4: E2E Test Mock Issue (ROOT CAUSE)
// ============================================================================
// From tests/e2e/pipeline.test.ts:240-249

vi.mocked(readFile).mockImplementation((path) => {
  const pathStr = String(path);

  // PROBLEM: Returns string, but production code expects Buffer
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(mockSimplePRD);
    // ❌ Returns string - breaks readUTF8FileStrict()
  }

  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(JSON.stringify(createMockBacklog()));
    // ❌ Returns string - but tasks.json uses readFile with encoding
  }

  return Promise.resolve('');
});

// ============================================================================
// PATTERN 5: Fixed E2E Test Mock (SOLUTION)
// ============================================================================

vi.mocked(readFile).mockImplementation((path) => {
  const pathStr = String(path);

  // SOLUTION: Return Buffer to match production behavior
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(Buffer.from(mockSimplePRD));
    // ✅ Returns Buffer - works with readUTF8FileStrict()
  }

  // Preserve existing behavior for other files
  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(Buffer.from(JSON.stringify(createMockBacklog())));
    // ✅ Returns Buffer - more consistent with production
  }

  return Promise.resolve(Buffer.from(''));
});

// ============================================================================
// PATTERN 6: Verifying PRD Snapshot in Tests
// ============================================================================
// From tests/e2e/pipeline.test.ts:320-332

it('should create valid prd_snapshot.md in session directory', async () => {
  const result = await pipeline.run();

  // VERIFY: Session path is non-empty
  expect(result.sessionPath).toBeTruthy();
  expect(result.sessionPath).not.toBe('');

  // VERIFY: prd_snapshot.md exists
  const prdSnapshotPath = join(result.sessionPath, 'prd_snapshot.md');
  // ⚠️ existsSync may be mocked - verify actual file exists
  expect(existsSync(prdSnapshotPath)).toBe(true);

  // VERIFY: File content matches original PRD
  const prdSnapshot = readFileSync(prdSnapshotPath, 'utf-8');
  expect(prdSnapshot).toContain('# Test Project');
  expect(prdSnapshot).toContain('## P1: Test Phase');
  expect(prdSnapshot.length).toBeGreaterThan(100); // Minimum length validation
});

// ============================================================================
// PATTERN 7: Debugging PRD Snapshot Creation Failure
// ============================================================================

// STEP 1: Check if session directory exists
const sessionDir = resolve(sessionPath);
if (!existsSync(sessionDir)) {
  logger.error({ sessionPath }, 'Session directory does not exist');
  throw new SessionFileError(sessionPath, 'find session directory');
}

// STEP 2: Check if PRD file exists
const prdFile = resolve(prdPath);
if (!existsSync(prdFile)) {
  logger.error({ prdPath }, 'PRD file does not exist');
  throw new SessionFileError(prdPath, 'find PRD file');
}

// STEP 3: Verify mock return type
const mockResult = await readFile(prdPath);
logger.debug(
  {
    type: typeof mockResult,
    isBuffer: Buffer.isBuffer(mockResult),
    isString: typeof mockResult === 'string',
  },
  'Mock readFile return type'
);
// EXPECTED: { type: 'object', isBuffer: true, isString: false }

// STEP 4: Test TextDecoder with mock result
try {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const content = decoder.decode(mockResult);
  logger.debug({ success: true, length: content.length }, 'TextDecoder success');
} catch (error) {
  logger.error(
    {
      error: error.message,
      code: error.code,
    },
    'TextDecoder failed'
  );
  // IF error.code === 'ERR_INVALID_ARG_TYPE': Mock returns string, not Buffer
}

// ============================================================================
// PATTERN 8: Retry Logic for Transient Errors
// ============================================================================
// From src/utils/retry.ts

import { retry, isTransientError } from '../utils/retry.js';

// Wrap writeFile in retry for transient errors
await retry(
  async () => {
    await writeFile(snapshotPath, prdContent, { mode: 0o644 });
  },
  {
    maxAttempts: 3,
    baseDelay: 1000,
    isRetryable: (error) => {
      const code = (error as NodeJS.ErrnoException).code;
      // Retry on transient errors
      return code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'EBUSY';
    },
    onRetry: (attempt, error, delay) => {
      logger.warn(
        {
          attempt,
          error: error.message,
          delay,
        },
        'Retrying PRD snapshot write'
      );
    },
  }
);

// ============================================================================
// PATTERN 9: Error Handling with SessionFileError
// ============================================================================

try {
  const prdContent = await readFile(this.prdPath, 'utf-8');
  const snapshotPath = resolve(sessionPath, 'prd_snapshot.md');
  await writeFile(snapshotPath, prdContent, { mode: 0o644 });
} catch (error) {
  const err = error as NodeJS.ErrnoException;

  // CHECK: Specific error codes for better error messages
  if (err.code === 'ENOENT') {
    throw new SessionFileError(
      this.prdPath,
      'read PRD file (file not found)',
      error as Error
    );
  }

  if (err.code === 'EACCES') {
    throw new SessionFileError(
      snapshotPath,
      'write PRD snapshot (permission denied)',
      error as Error
    );
  }

  if (err.code === 'ENOSPC') {
    throw new SessionFileError(
      snapshotPath,
      'write PRD snapshot (no space left)',
      error as Error
    );
  }

  // WRAP: Generic error
  throw new SessionFileError(
    snapshotPath,
    'create PRD snapshot',
    error as Error
  );
}

// ============================================================================
// PATTERN 10: PRD Content Validation
// ============================================================================

// VALIDATE: Minimum length
if (prdContent.length < 100) {
  throw new SessionFileError(
    this.prdPath,
    'validate PRD content (too short)'
  );
}

// VALIDATE: Required sections
const requiredSections = ['# Test Project', '## P1: Test Phase'];
for (const section of requiredSections) {
  if (!prdContent.includes(section)) {
    throw new SessionFileError(
      this.prdPath,
      `validate PRD content (missing section: ${section})`
    );
  }
}

// VALIDATE: Markdown structure
if (!prdContent.startsWith('#')) {
  throw new SessionFileError(
    this.prdPath,
    'validate PRD content (invalid markdown structure)'
  );
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - task: P2.M1.T2.S1 (session initialization fix)
    status: Implementing in parallel
    contract: Session directory exists and is writable when this task starts
    dependency_type: hard_dependency
    reason: PRD snapshot write requires valid sessionPath from initialized session

  - task: P2.M1.T2.S2 (tasks.json creation fix)
    status: Implementing in parallel
    contract: Both tasks depend on session initialization from P2.M1.T2.S1
    dependency_type: soft_dependency
    reason: Both files are written during session initialization, but independent

CONTRACTS_FROM_P2M1T2S1:
  - output: sessionPath (non-empty string)
  - output: SessionManager.currentSession (non-null)
  - output: Session directory exists with mode 0o755
  - output: Session directory is writable

CONTRACTS_FROM_P2M1T2S2:
  - output: tasks.json creation logic is independent
  - output: Both files can be written in parallel
  - output: No conflicts between prd_snapshot.md and tasks.json

FILES_THAT_MAY_NEED_MODIFICATION:
  - file: tests/e2e/pipeline.test.ts
    reason: Mock returns string instead of Buffer for readFile
    likelihood: HIGH (this is the primary suspect from debug analysis)
    changes: Update readFile mock to return Buffer for PRD.md

  - file: src/core/session-manager.ts
    reason: May need error handling enhancements or retry logic
    likelihood: LOW (current implementation is correct for string-based readFile)
    changes: Add retry logic for transient errors, better error messages

  - file: tests/fixtures/simple-prd.ts
    reason: Test fixture may not meet PRD validation requirements
    likelihood: LOW (fixture is usually valid)
    changes: Ensure minimum 100 characters, required sections present

NO_CHANGES_TO:
  - src/core/session-utils.ts (snapshotPRD is not used by SessionManager)
  - src/utils/prd-validator.ts (readUTF8FileStrict is correct, expects Buffer)
  - src/core/models.ts (no schema changes needed)
  - src/workflows/prp-pipeline.ts (orchestration only)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compilation check
npm run build

# Expected: No type errors
# If errors occur, verify:
# - File paths are correct
# - Imports are proper
# - Type annotations match interfaces
# - Buffer vs string types are correct

# Run linter
npm run lint

# Expected: No linting errors
# If errors occur, fix them before proceeding

# Run formatter check
npm run format:check

# Expected: No formatting issues
# If issues exist, run: npm run format:fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run session-utils unit tests (includes snapshotPRD tests)
npm run test:run -- tests/unit/core/session-utils.test.ts --no-coverage

# Expected: All tests pass
# This validates that snapshotPRD works correctly in isolation

# Run PRD validator unit tests
npm run test:run -- tests/unit/utils/prd-validator.test.ts --no-coverage

# Expected: All tests pass
# This validates that readUTF8FileStrict works correctly

# Run Session Manager unit tests
npm run test:run -- tests/unit/core/session-manager.test.ts --no-coverage

# Expected: All tests pass
# This validates that session initialization works correctly
```

### Level 3: Integration Testing (System Validation)

```bash
# Run the E2E pipeline tests with the fix applied
npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage

# Expected: All 7 tests pass

# Verify specific tests:
# ✅ should complete full pipeline workflow successfully
# ✅ should create valid prd_snapshot.md in session directory
# ✅ should create valid tasks.json with complete subtask status
# ✅ should handle error when PRD file does not exist
# ✅ should create git commits during execution
# ✅ should complete execution in under 30 seconds
# ✅ should clean up temp directory after test

# Check test output for:
# - No ENOENT errors for prd_snapshot.md
# - No ERR_INVALID_ARG_TYPE errors
# - Session initialization completes
# - prd_snapshot.md created successfully
# - File content matches original PRD
# - Execution time < 30 seconds

# Detailed validation commands:
# Check that session directory is created
ls -la /tmp/e2e-pipeline-test-*/plan/*_*/

# Check that prd_snapshot.md exists
cat /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md

# Check that prd_snapshot.md contains expected content
grep -c "# Test Project" /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md
# Expected: 1

grep -c "## P1: Test Phase" /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md
# Expected: 1

# Check file size (should be > 100 characters)
wc -c /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md
# Expected: > 100

# Verify file is readable
cat /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md
# Expected: Valid markdown content
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Run E2E tests with verbose debug output
DEBUG=* npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage

# Check for specific debug messages:
# [SessionManager] Starting session initialization
# [SessionManager] Session directory created
# [SessionManager] Creating PRD snapshot
# [SessionManager] PRD snapshot created successfully
# [SessionManager] Session initialized successfully

# Verify no error messages about:
# - ERR_INVALID_ARG_TYPE (Buffer/string mismatch)
# - ENOENT errors (file not found)
# - EACCES permission errors
# - PRD validation failures

# Performance validation:
# Run tests 10 times to ensure consistent performance
for i in {1..10}; do
  echo "Run $i:"
  time npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
done

# Expected: All runs complete in < 30 seconds, all tests pass

# Edge case testing:
# Test with different PRD content sizes
# Test with PRD containing special characters
# Test with PRD containing unicode characters
# Test with very long PRD (many sections)

# Expected: All tests pass regardless of PRD content

# Mock behavior validation:
# Verify mock returns Buffer for PRD.md
# Verify mock returns Buffer for tasks.json
# Verify mock doesn't interfere with real file operations

# Add temporary debug logging to verify mock behavior:
vi.mocked(readFile).mockImplementation((path) => {
  const pathStr = String(path);
  if (pathStr.includes('PRD.md')) {
    const result = Buffer.from(mockSimplePRD);
    console.log('[MOCK] Returning Buffer for PRD.md:', result);
    return Promise.resolve(result);
  }
  return Promise.resolve(Buffer.from(''));
});

# File system validation:
# Verify prd_snapshot.md has correct permissions
stat -c '%a' /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md
# Expected: 644 (rw-r--r--)

# Verify file is not empty
wc -l /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md
# Expected: > 0 lines

# Verify file is valid markdown
# (Install markdownlint if needed)
npx markdownlint /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md
# Expected: No markdown errors (or only warnings)

# Data integrity validation:
# Write PRD snapshot, read it back, compare with original
# Verify no data corruption during write
# Verify encoding is preserved (UTF-8)

# Commands:
# Get original PRD content
ORIGINAL_PRD=$(cat tests/fixtures/simple-prd.ts)

# Get snapshot content
SNAPSHOT=$(cat /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md)

# Compare (should be identical after extracting from fixture)
diff <(echo "$ORIGINAL_PRD") <(echo "$SNAPSHOT")
# Expected: No differences (after fixture extraction)

# Concurrency testing:
# Run multiple pipeline instances in parallel
# Verify prd_snapshot.md files don't conflict
# Verify no race conditions in file creation

# Expected: No race conditions, no file corruption
```

## Final Validation Checklist

### Technical Validation

- [ ] All 7 E2E tests pass: `npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage`
- [ ] No ENOENT errors when accessing prd_snapshot.md
- [ ] No ERR_INVALID_ARG_TYPE errors (Buffer/string mismatch)
- [ ] No TypeScript compilation errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Tests complete in under 30 seconds
- [ ] prd_snapshot.md file created in session directory
- [ ] File content matches original PRD content exactly

### Feature Validation

- [ ] Root cause identified and documented
- [ ] Fix applied based on root cause
- [ ] Mock returns Buffer instead of string for readFile
- [ ] PRD validation passes with correct return type
- [ ] File is readable after creation
- [ ] File content matches expected structure
- [ ] No mock interference with real file operations
- [ ] Session initialization completes successfully

### Code Quality Validation

- [ ] Follows existing codebase patterns for file operations
- [ ] Error handling is comprehensive and specific
- [ ] Debug logging is informative but not verbose
- [ ] Changes are minimal and focused
- [ ] No regression in existing functionality
- [ ] Test fixtures match validation requirements

### Documentation & Deployment

- [ ] Root cause documented in research notes
- [ ] Fix approach documented with before/after comparison
- [ ] Lessons learned recorded for future debugging
- [ ] Related PRPs referenced correctly
- [ ] External documentation links verified
- [ ] Fix is reproducible and documented

## Anti-Patterns to Avoid

- ❌ **Don't modify readUTF8FileStrict** - It's correct to expect Buffer, fix the mock instead
- ❌ **Don't change SessionManager.readFile encoding** - Current implementation is correct
- ❌ **Don't use snapshotPRD from session-utils** - It's not currently used, stick with SessionManager implementation
- ❌ **Don't skip mock type validation** - Mock must match production behavior (Buffer vs string)
- ❌ **Don't ignore ERR_INVALID_ARG_TYPE** - This error indicates type mismatch, not a transient issue
- ❌ **Don't mock writeFile** - Let real file operations happen in E2E tests
- ❌ **Don't assume tests pass for right reasons** - Verify mock behavior is correct
- ❌ **Don't skip PRD content validation** - Ensure fixture meets minimum requirements
- ❌ **Don't add unnecessary retry logic** - Type mismatch errors are not retryable
- ❌ **Don't modify production code to match mock** - Fix the mock to match production
- ❌ **Don't skip error logging** - Errors must be logged with context for debugging
- ❌ **Don't assume session exists** - P2.M1.T2.S1 must be complete first

---

## Confidence Score: 9/10

**One-Pass Implementation Success Likelihood**: VERY HIGH

**Rationale**:
1. Clear root cause identified from P2.M1.T1.S3 debug analysis (Buffer/string type mismatch)
2. Comprehensive understanding of two different PRD snapshot implementations
3. Specific file location and line number references for all relevant code
4. Mock return type issue is clearly understood and fix is straightforward
5. External research on Node.js readFile behavior and TextDecoder requirements
6. Test structure analysis reveals exact changes needed
7. Decision tree for alternative root causes if primary suspect is wrong
8. Validation commands are project-specific and executable
9. Dependencies on previous PRPs are clearly documented

**Potential Risks**:
- **Risk 1**: Root cause may be different than expected (Very Low)
  - Mitigation: Debug analysis clearly shows Buffer/string mismatch issue
  - Mitigation: Decision tree provided for alternative root causes
- **Risk 2**: Mock changes may affect other tests (Low)
  - Mitigation: Changes are scoped to specific file paths (PRD.md, tasks.json)
  - Mitigation: Preserve existing mock behavior for other files
- **Risk 3**: PRD fixture content may need updates (Very Low)
  - Mitigation: Fixture requirements are clearly documented
  - Mitigation: Validation commands check for required sections

**Validation**: The completed PRP provides everything needed for an AI agent unfamiliar with the codebase to implement this fix successfully using only the PRP content and codebase access. The root cause is clearly identified, the fix is straightforward (update mock to return Buffer), and comprehensive validation strategies are provided.
