# PRP: Fix tasks.json Creation Failure - P2.M1.T2.S2

## Goal

**Feature Goal**: Fix the root cause of tasks.json creation failure in E2E tests by ensuring the atomic write pattern works correctly after the session initialization fix from P2.M1.T2.S1 is implemented.

**Deliverable**: Validated tasks.json creation through E2E test execution with file persistence, Zod schema validation passing, and atomic write pattern functioning correctly.

**Success Definition**:

- tasks.json file exists in session directory after E2E test run
- File contains valid Backlog structure (BacklogSchema validation passes)
- Atomic write pattern executes successfully (temp file → rename)
- No ENOENT errors when accessing tasks.json
- File content matches expected backlog structure
- Tests complete in under 30 seconds with mocks

## User Persona

**Target User**: Development team running E2E tests to validate complete PRP pipeline functionality including session state persistence

**Use Case**: Running `npm run test:run -- tests/e2e/pipeline.test.ts` to verify that tasks.json is created correctly during pipeline execution after session initialization is fixed

**User Journey**:

1. Developer completes P2.M1.T2.S1 (session initialization fix)
2. E2E tests now pass session initialization but fail on tasks.json validation
3. Root cause analysis reveals tasks.json is not being created properly
4. This fix is applied to resolve tasks.json creation issues
5. All E2E tests pass with full session state persistence validated

**Pain Points Addressed**:

- ENOENT errors when trying to read tasks.json in tests
- Unclear why atomic write fails after session initialization succeeds
- Need to validate file was actually written, not just mocked
- Tests passing for wrong reasons (mock interference)

## Why

- **Business Value**: tasks.json is the single source of truth for task hierarchy in a session - without it, session state cannot be persisted or resumed
- **Integration**: Depends on P2.M1.T2.S1 session initialization fix - once session directory exists, tasks.json must be written correctly
- **Problem Solved**: Fixes the second issue identified in P2.M1.T1.S3 debug analysis - tasks.json not created, causing ENOENT in tests

## What

Fix the tasks.json creation failure by ensuring the atomic write pattern in `writeTasksJSON()` works correctly after session initialization is fixed. The fix depends on the root cause identified during implementation:

### Potential Root Causes (to be determined during implementation)

1. **Zod Validation Failing**: BacklogSchema.parse() rejects the data structure
   - Fix: Either fix the test fixture data structure OR adjust validation logic
   - Depends on what the actual validation error is

2. **Atomic Write Failing**: writeFile() or rename() fails with permission/path errors
   - Fix: Add error handling and retry logic
   - Ensure directory exists before write

3. **Directory Permission Issue**: Session directory not writable
   - Fix: Ensure directory creation sets proper permissions (0o755)
   - Validate directory exists before write

4. **Mock Interference**: Test mocks prevent real file operations
   - Fix: Update E2E test mocks to allow real file writes
   - Ensure writeFile, rename, mkdir are not mocked

### Success Criteria

- [ ] tasks.json file exists in session directory after E2E test execution
- [ ] File content passes BacklogSchema validation
- [ ] Atomic write pattern executes (temp file created, renamed to tasks.json)
- [ ] No ENOENT errors when accessing tasks.json
- [ ] E2E test "should create valid tasks.json with complete subtask status" passes
- [ ] File contains valid Backlog structure with backlog array
- [ ] Session Manager's saveBacklog() method completes successfully

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

1. Exact file locations and line numbers for writeTasksJSON function
2. Complete understanding of atomic write pattern implementation
3. Dependency on P2.M1.T2.S1 session initialization fix (assumes it will be implemented)
4. Zod schema validation requirements and patterns
5. Test structure and mock configuration
6. External research on atomic write best practices
7. Clear decision tree for root cause determination

### Documentation & References

```yaml
# CRITICAL: Previous PRP - Must be completed first
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T2S1/PRP.md
  why: Defines the session initialization fix that enables this work
  critical: After P2.M1.T2.S1, session directory exists and is writable
  contract: Session initialization completes successfully, sessionPath is non-empty

# CRITICAL: Root cause analysis - MUST READ
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md
  why: Complete timeline showing tasks.json creation failure
  critical: Lines 107-117 show ENOENT error when accessing tasks.json
  section: "Failed Tests" - "should create valid tasks.json with complete subtask status"

# CRITICAL: Production code to analyze
- file: src/core/session-utils.ts
  why: Contains writeTasksJSON() function that must work correctly
  pattern: Lines 395-468 show complete writeTasksJSON implementation
  gotcha: Uses atomicWrite() helper with temp file + rename pattern
  gotcha: Zod validation on line 410 - BacklogSchema.parse(backlog) must pass

# CRITICAL: Atomic write implementation
- file: src/core/session-utils.ts
  why: Contains atomicWrite() helper used by writeTasksJSON
  pattern: Lines 99-180 show atomic write pattern with error handling
  gotcha: Creates temp file with random suffix, writes content, then renames
  gotcha: Cleanup on error - unlink temp file if write/rename fails

# CRITICAL: Zod schema definition
- file: src/core/models.ts
  why: Defines BacklogSchema that validates tasks.json content
  pattern: Lines 708-710 show BacklogSchema = z.object({ backlog: z.array(PhaseSchema) })
  pattern: Lines 618-627 show PhaseSchema with regex validation for ID format
  gotcha: Phase ID must match /^P\d+$/ pattern (e.g., "P1", "P2")
  gotcha: All nested schemas must validate for parse() to succeed

# CRITICAL: Test file structure
- file: tests/e2e/pipeline.test.ts
  why: Shows how tasks.json creation is tested and what mocks are in place
  pattern: Lines 312-379 show test assertions for tasks.json
  gotcha: Test uses existsSync and readFileSync to validate file
  gotcha: Mock readFile may interfere with actual file content reading

# CRITICAL: Test fixture data
- file: tests/e2e/pipeline.test.ts
  why: Contains createMockBacklog() function that generates test data
  pattern: Lines 176-208 show complete mock backlog structure
  gotcha: Mock has 0 subtasks for fast E2E testing
  gotcha: All statuses are 'Complete' for test simplicity

# CRITICAL: Session Manager usage
- file: src/core/session-manager.ts
  why: Shows how writeTasksJSON is called during session save
  pattern: Lines 641+ show saveBacklog() calling writeTasksJSON
  gotcha: Expects session directory to already exist

# RESEARCH: Atomic write best practices
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/docs/nodejs-atomic-write-research.md
  why: Complete research on Node.js atomic write patterns
  section: "Best Practices" and "Common Pitfalls"
  critical: Renames are atomic only on same filesystem
  critical: Temp file cleanup must happen on error

# RESEARCH: Codebase file write patterns
- agent_id: a3a81b4
  why: Comprehensive analysis of all file write operations in codebase
  critical: Shows atomic write is reserved for critical data only
  critical: Error handling patterns and cleanup strategies

# RESEARCH: E2E test structure analysis
- agent_id: a8e85b8
  why: Detailed analysis of test mocks and potential issues
  critical: Mock readFile may interfere with actual file reading
  critical: Test fixture data must match Zod schema requirements

# RESEARCH: Zod validation patterns
- agent_id: a8bbe2d
  why: Zod schema usage patterns and error handling
  critical: BacklogSchema.parse() throws ZodError on validation failure
  critical: No dedicated schema tests - validation happens at runtime

# EXTERNAL: Node.js fs.promises documentation
- url: https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
  why: Official docs on rename() atomicity guarantees
  critical: Atomic only on same filesystem, throws if cross-device

# EXTERNAL: Node.js error codes reference
- url: https://nodejs.org/api/fs.html#fs-error-codes
  why: Complete list of error codes (ENOENT, EACCES, EXDEV, etc.)
  critical: ENOENT = file not found, EACCES = permission denied
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts       # SessionManager.saveBacklog() calls writeTasksJSON
│   │   ├── session-utils.ts         # writeTasksJSON() and atomicWrite() functions
│   │   └── models.ts                # BacklogSchema, PhaseSchema, etc. Zod schemas
│   └── workflows/
│       └── prp-pipeline.ts          # PRPPipeline.run() → decomposePRD() → saveBacklog()
├── tests/
│   ├── e2e/
│   │   └── pipeline.test.ts         # E2E tests that validate tasks.json creation
│   └── fixtures/
│       └── simple-prd.ts            # Mock PRD content used in tests
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        ├── P2M1T2S1/
        │   └── PRP.md               # Session initialization fix (DEPENDENCY)
        ├── P2M1T2S2/
        │   └── PRP.md               # This document
        ├── architecture/
        │   └── e2e-debug-analysis.md # Root cause analysis
        └── docs/
            ├── nodejs-atomic-write-research.md # External research
            └── vitest-fs-mocking-research.md # Mocking patterns
```

### Desired Codebase Tree

```bash
# No structural changes expected - this is a bugfix
# Changes may be needed to:
# - src/core/session-utils.ts (if atomicWrite needs enhancement)
# - tests/e2e/pipeline.test.ts (if mocks need adjustment)
# - tests/fixtures/*.ts (if test fixtures don't match Zod schema)

# The exact file(s) to modify will be determined by root cause analysis
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Session initialization MUST be fixed first (P2.M1.T2.S1)
// writeTasksJSON depends on session directory existing and being writable
// If P2.M1.T2.S1 is not complete, this fix will fail

// CRITICAL: Atomic write pattern requires same filesystem
// rename() is atomic ONLY on same filesystem
// EXDEV error if trying to rename across filesystems

// CRITICAL: Zod validation is strict
// BacklogSchema.parse() throws ZodError if validation fails
// This will cause writeTasksJSON to throw SessionFileError
// Common validation failures:
// - Phase ID doesn't match /^P\d+$/ pattern
// - Missing required fields (title, description, status)
// - Invalid status enum value
// - Nested structures don't validate

// CRITICAL: Test mocks may interfere with real file operations
// tests/e2e/pipeline.test.ts mocks readFile but NOT writeFile
// This means writeFile calls go through to real fs
// But readFile calls return mock data, not actual file content
// This creates a mismatch - file written, but mock data returned on read

// CRITICAL: E2E test uses existsSync to check file existence
// existsSync is mocked to always return true
// This masks the fact that file doesn't exist
// Test may pass for wrong reasons

// CRITICAL: Temp file naming uses random bytes
// atomicWrite creates: .{filename}.{randomBytes}.tmp
// This ensures no collisions in concurrent scenarios
// But makes debugging harder - temp file name is unpredictable

// CRITICAL: Error handling wraps all errors in SessionFileError
// Original error code is preserved in SessionFileError.code
// Check this code to determine root cause:
// - ENOENT: File/directory not found
// - EACCES: Permission denied
// - ENOSPC: No space left on device
// - EXDEV: Cross-device link (rename across filesystems)

// CRITICAL: Session Manager calls writeTasksJSON
// The path comes from: sessionManager.currentSession.metadata.path
// If currentSession is null, this will throw
// P2.M1.T2.S1 fixes this by ensuring session initialization succeeds

// CRITICAL: Zod uses z.lazy() for recursive schemas
// PhaseSchema contains z.array(z.lazy(() => MilestoneSchema))
// MilestoneSchema contains z.array(z.lazy(() => TaskSchema))
// TaskSchema contains z.array(SubtaskSchema)
// This allows circular references but can be slow to validate

// CRITICAL: Test fixture has empty subtasks array
// createMockBacklog() returns structure with subtasks: []
// This is intentional for fast E2E testing
// But must still validate against Zod schema

// CRITICAL: File mode 0o644 for temp files
// writeFile uses { mode: 0o644 }
// This is owner read/write, group/others read-only
// Ensure parent directory allows write permissions
```

## Implementation Blueprint

### Data Models and Structure

Existing data models used:

- **Backlog**: Root task hierarchy container from `src/core/models.ts`
- **BacklogSchema**: Zod schema for validation (lines 708-710 in models.ts)
- **SessionFileError**: Custom error class for file operation failures

```typescript
// Backlog structure (from models.ts)
interface Backlog {
  backlog: Phase[];
}

// Phase structure (from models.ts)
interface Phase {
  id: string; // Must match /^P\d+$/
  type: 'Phase';
  title: string;
  status: Status;
  description: string;
  milestones: Milestone[];
}

// Zod validation
const BacklogSchema: z.ZodType<Backlog> = z.object({
  backlog: z.array(PhaseSchema),
});
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: DETERMINE ROOT CAUSE of tasks.json creation failure
  - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
  - ANALYZE: Test output to find specific error
  - CHECK: Is it Zod validation error? Look for "ZodError" in output
  - CHECK: Is it file system error? Look for error codes (ENOENT, EACCES, etc.)
  - CHECK: Is it mock interference? Look for mock data being returned
  - DOCUMENT: Root cause in research notes

Task 2: IF ZOD VALIDATION FAILING
  - SUBTASK 2a: Check test fixture data structure
    - FILE: tests/e2e/pipeline.test.ts
    - FUNCTION: createMockBacklog() (lines 176-208)
    - VALIDATE: Does structure match BacklogSchema requirements?
    - CHECK: Phase IDs match /^P\d+$/ pattern
    - CHECK: All required fields present
    - CHECK: Status values are valid enum values

  - SUBTASK 2b: Fix test fixture OR validation logic
    - OPTION A: Update createMockBacklog() to match schema
    - OPTION B: Adjust schema if requirements are incorrect
    - PREFERRED: Fix test fixture to match schema (schema is source of truth)

  - SUBTASK 2c: Validate fix
    - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
    - EXPECT: Zod validation passes

Task 3: IF ATOMIC WRITE FAILING
  - SUBTASK 3a: Check file system permissions
    - VERIFY: Session directory exists (from P2.M1.T2.S1)
    - VERIFY: Directory is writable (mode 0o755)
    - CHECK: Sufficient disk space

  - SUBTASK 3b: Enhance error handling if needed
    - FILE: src/core/session-utils.ts
    - FUNCTION: atomicWrite() (lines 99-180)
    - ADD: Retry logic for transient errors (EPERM, EBUSY)
    - ADD: Better error messages for debugging

  - SUBTASK 3c: Validate fix
    - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
    - EXPECT: Atomic write completes successfully

Task 4: IF MOCK INTERFERENCE
  - SUBTASK 4a: Analyze E2E test mock configuration
    - FILE: tests/e2e/pipeline.test.ts
    - LINES: 46-64 (fs mock setup)
    - LINES: 240-249 (readFile mock)
    - IDENTIFY: Which functions are mocked that shouldn't be

  - SUBTASK 4b: Update mock configuration
    - ENSURE: writeFile is NOT mocked (or mock properly)
    - ENSURE: rename is NOT mocked (or mock properly)
    - ENSURE: mkdir is NOT mocked (or mock properly)
    - UPDATE: readFile mock to return actual file content for tasks.json

  - SUBTASK 4c: Validate fix
    - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
    - EXPECT: Real file operations work correctly

Task 5: RUN FULL E2E TEST SUITE to validate fix
  - COMMAND: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
  - EXPECT: All 7 tests pass
  - VALIDATE: tasks.json exists in session directory
  - VALIDATE: File content matches expected structure
  - VALIDATE: No ENOENT errors

Task 6: VERIFY SESSION STATE PERSISTENCE
  - CHECK: tasks.json file created in session directory
  - CHECK: File contains valid Backlog structure
  - CHECK: Zod validation passes on file content
  - CHECK: File is readable by subsequent operations

Task 7: DOCUMENT FIX in research notes
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T2S2/research/
  - CONTENT: Document root cause and fix applied
  - INCLUDE: Before/after comparison
  - INCLUDE: Lessons learned for future debugging
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: writeTasksJSON Implementation (Current)
// ============================================================================
// From src/core/session-utils.ts:395-468

export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  try {
    // LOG: Debug logging for operation start
    logger.debug(
      {
        sessionPath,
        itemCount: backlog.backlog.length,
        operation: 'writeTasksJSON',
      },
      'Writing tasks.json'
    );

    // VALIDATE: Zod schema validation (line 410)
    const validated = BacklogSchema.parse(backlog);
    // THROWS: ZodError if validation fails
    // CAUGHT: Wrapped in SessionFileError on line 462

    logger.debug(
      {
        sessionPath,
        validated: true,
        itemCount: validated.backlog.length,
      },
      'Backlog validated successfully'
    );

    // SERIALIZE: Convert to JSON with 2-space indentation
    const content = JSON.stringify(validated, null, 2);

    // RESOLVE: Absolute path for tasks.json
    const tasksPath = resolve(sessionPath, 'tasks.json');

    // WRITE: Use atomic write pattern
    await atomicWrite(tasksPath, content);

    logger.info(
      {
        tasksPath,
        size: content.length,
      },
      'tasks.json written successfully'
    );
  } catch (error) {
    // HANDLE: SessionFileError from atomicWrite - re-throw
    if (error instanceof SessionFileError) {
      throw error;
    }
    // WRAP: Zod validation errors or other errors
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'write tasks.json',
      error as Error
    );
  }
}

// ============================================================================
// PATTERN 2: atomicWrite Implementation (Current)
// ============================================================================
// From src/core/session-utils.ts:99-180

async function atomicWrite(targetPath: string, data: string): Promise<void> {
  // CREATE: Unique temp filename with random suffix
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );
  // Example: /path/to/session/.tasks.json.a1b2c3d4e5f6.tmp

  try {
    // WRITE: Create temp file with content
    await writeFile(tempPath, data, { mode: 0o644 });
    // THROWS: ENOENT if directory doesn't exist
    // THROWS: EACCES if no write permission
    // THROWS: ENOSPC if disk full

    // RENAME: Atomically move temp file to target
    await rename(tempPath, targetPath);
    // THROWS: EXDEV if cross-device link
    // ATOMIC: On POSIX systems, rename is atomic on same filesystem
  } catch (error) {
    // CLEANUP: Remove temp file on error
    try {
      await unlink(tempPath);
    } catch (cleanupError) {
      // IGNORE: Cleanup failure is not critical
      logger.warn({ tempPath }, 'Failed to clean up temp file');
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}

// ============================================================================
// PATTERN 3: Zod Validation Error Handling
// ============================================================================

// TRY: Zod validation
try {
  const validated = BacklogSchema.parse(backlog);
} catch (error) {
  // CHECK: Is this a ZodError?
  if (error instanceof ZodError) {
    // EXTRACT: Validation error details
    const issues = error.errors;
    // FORMAT: Error messages
    const messages = issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    );
    // LOG: Detailed validation failure
    logger.error({ issues, messages }, 'Zod validation failed');
  }
  // WRAP: In SessionFileError
  throw new SessionFileError(path, 'validate backlog', error);
}

// ============================================================================
// PATTERN 4: Common Zod Validation Failures
// ============================================================================

// FAILURE 1: Phase ID doesn't match pattern
// { id: 'Phase1' } // ❌ Doesn't match /^P\d+$/
// { id: 'P1' }     // ✅ Matches pattern

// FAILURE 2: Missing required field
// { id: 'P1', type: 'Phase' } // ❌ Missing title, description
// { id: 'P1', type: 'Phase', title: 'Test', description: 'Test' } // ✅ All fields

// FAILURE 3: Invalid status enum
// { status: 'InProgress' } // ❌ Not a valid enum value
// { status: 'in_progress' } // ✅ Valid enum value

// FAILURE 4: Nested structure invalid
// { milestones: 'invalid' } // ❌ Should be array
// { milestones: [] } // ✅ Empty array is valid

// ============================================================================
// PATTERN 5: Debugging tasks.json Creation Failure
// ============================================================================

// STEP 1: Add debug logging before write
logger.debug(
  {
    sessionPath,
    backlog: JSON.stringify(backlog, null, 2),
    operation: 'writeTasksJSON:pre',
  },
  'About to write tasks.json'
);

// STEP 2: Add validation debug
try {
  const validated = BacklogSchema.parse(backlog);
  logger.debug({ validated }, 'Zod validation passed');
} catch (error) {
  logger.error(
    {
      error: error instanceof ZodError ? error.errors : error,
      backlog,
    },
    'Zod validation failed'
  );
}

// STEP 3: Add atomic write debug
logger.debug(
  {
    targetPath,
    dataSize: data.length,
    operation: 'atomicWrite:start',
  },
  'Starting atomic write'
);

// ============================================================================
// PATTERN 6: Test Mock Interference Issues
// ============================================================================

// PROBLEM: readFile mock returns fake data
vi.mocked(readFile).mockImplementation(path => {
  if (String(path).includes('tasks.json')) {
    return Promise.resolve(JSON.stringify(createMockBacklog()));
  }
  // ❌ This returns fake data, not actual file content
});

// SOLUTION: Check if file exists first, then return real content
vi.mocked(readFile).mockImplementation(async path => {
  const pathStr = String(path);
  if (pathStr.includes('tasks.json')) {
    // ✅ Check if file was actually written
    if (existsSync(pathStr)) {
      return readFileSync(pathStr, 'utf-8');
    }
    // Return mock data only if file doesn't exist
    return Promise.resolve(JSON.stringify(createMockBacklog()));
  }
  // ... rest of mock logic
});

// ============================================================================
// PATTERN 7: Verifying File Creation in Tests
// ============================================================================

// AFTER: Pipeline execution completes
const result = await pipeline.run();

// VERIFY: Session path is non-empty
expect(result.sessionPath).toBeTruthy();
expect(result.sessionPath).not.toBe('');

// VERIFY: tasks.json exists
const tasksPath = join(result.sessionPath, 'tasks.json');
// ⚠️ existsSync may be mocked - use real fs
expect(existsSync(tasksPath)).toBe(true);

// VERIFY: File content is valid
const content = readFileSync(tasksPath, 'utf-8');
const parsed = JSON.parse(content);

// VERIFY: Zod validation passes
const validated = BacklogSchema.parse(parsed);
expect(validated.backlog).toBeDefined();
expect(validated.backlog.length).toBeGreaterThan(0);
```

### Integration Points

```yaml
DEPENDENCIES:
  - task: P2.M1.T2.S1 (session initialization fix)
    status: Implementing in parallel
    contract: Session directory exists and is writable when this task starts
    dependency_type: hard_dependency
    reason: writeTasksJSON requires valid sessionPath from initialized session

CONTRACTS_FROM_P2M1T2S1:
  - output: sessionPath (non-empty string)
  - output: SessionManager.currentSession (non-null)
  - output: Session directory exists with mode 0o755
  - output: prd_snapshot.md exists in session directory

FILES_THAT_MAY_NEED_MODIFICATION:
  - file: src/core/session-utils.ts
    reason: May need error handling enhancements if atomic write fails
    likelihood: low (current implementation is solid)
    changes: Add retry logic, better error messages

  - file: tests/e2e/pipeline.test.ts
    reason: May need mock adjustments to allow real file operations
    likelihood: medium (mock interference is common issue)
    changes: Update readFile mock to return real file content

  - file: tests/fixtures/*.ts (if any)
    reason: Test fixtures may not match Zod schema requirements
    likelihood: low (fixtures are usually valid)
    changes: Update fixture data to match schema

NO_CHANGES_TO:
  - src/core/models.ts (Zod schemas are source of truth)
  - src/core/session-manager.ts (only calls writeTasksJSON)
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
# Run session-utils unit tests
npm run test:run -- tests/unit/core/session-utils.test.ts --no-coverage

# Expected: All tests pass
# This validates that writeTasksJSON works correctly in isolation

# Run specific writeTasksJSON tests
npm run test:run -- tests/unit/core/session-utils.test.ts -t "writeTasksJSON" --no-coverage

# Expected: All writeTasksJSON tests pass
# This validates atomic write pattern and Zod validation

# Run Zod schema validation tests
npm run test:run -- tests/unit/core/models.test.ts --no-coverage

# Expected: All schema validation tests pass
# This validates BacklogSchema accepts correct data
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
# - No ENOENT errors for tasks.json
# - Session initialization completes
# - tasks.json created successfully
# - Zod validation passes
# - Execution time < 30 seconds

# Detailed validation commands:
# Check that session directory is created
ls -la /tmp/e2e-pipeline-test-*/plan/*_*/

# Check that tasks.json exists
cat /tmp/e2e-pipeline-test-*/plan/*_*/tasks.json

# Check that tasks.json is valid JSON
cat /tmp/e2e-pipeline-test-*/plan/*_*/tasks.json | jq .

# Expected: Valid JSON with backlog structure
# {
#   "backlog": [
#     {
#       "id": "P1",
#       "type": "Phase",
#       ...
#     }
#   ]
# }

# Validate against Zod schema
node -e "
const { BacklogSchema } = require('./dist/core/models.js');
const fs = require('fs');
const content = fs.readFileSync('/tmp/e2e-pipeline-test-*/plan/*_*/tasks.json', 'utf-8');
const parsed = JSON.parse(content);
const result = BacklogSchema.safeParse(parsed);
console.log('Valid:', result.success);
if (!result.success) {
  console.error('Errors:', result.error.errors);
}
"
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Run E2E tests with verbose debug output
DEBUG=* npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage

# Check for specific debug messages:
# [SessionManager] Starting session initialization
# [SessionManager] Session initialized successfully
# [SessionManager] Saving backlog
# [session-utils] Writing tasks.json
# [session-utils] Backlog validated successfully
# [session-utils] Starting atomic write
# [session-utils] Temp file written
# [session-utils] Temp file renamed to target
# [session-utils] tasks.json written successfully

# Verify no error messages about:
# - Zod validation failures
# - ENOENT errors
# - EACCES permission errors
# - EXDEV cross-device errors
# - Atomic write failures

# Performance validation:
# Run tests 10 times to ensure consistent performance
for i in {1..10}; do
  echo "Run $i:"
  time npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
done

# Expected: All runs complete in < 30 seconds, all tests pass

# Edge case testing:
# Test with different backlog sizes
# Test with empty backlog
# Test with large backlog (many phases/tasks)
# Test with special characters in descriptions

# Expected: All tests pass regardless of backlog content

# Concurrency testing:
# Run multiple pipeline instances in parallel
# Verify tasks.json files don't conflict
# Verify atomic writes prevent corruption

# Expected: No race conditions, no file corruption

# File system validation:
# Verify temp files are cleaned up
# Verify no orphaned .tmp files remain
# Verify file permissions are 0o644

# Commands:
find /tmp/e2e-pipeline-test-* -name "*.tmp" -type f
# Expected: No temp files found

stat -c '%a' /tmp/e2e-pipeline-test-*/plan/*_*/tasks.json
# Expected: 644 (rw-r--r--)

# Data integrity validation:
# Write tasks.json, read it back, compare
# Verify JSON serialization is lossless
# Verify no data corruption during write

# Expected: Byte-for-byte identical data after round-trip
```

## Final Validation Checklist

### Technical Validation

- [ ] All 7 E2E tests pass: `npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage`
- [ ] No ENOENT errors when accessing tasks.json
- [ ] No TypeScript compilation errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Tests complete in under 30 seconds
- [ ] tasks.json file created in session directory
- [ ] File content passes BacklogSchema validation
- [ ] Atomic write pattern executes successfully

### Feature Validation

- [ ] Root cause identified and documented
- [ ] Fix applied based on root cause
- [ ] Zod validation passes for test fixture data
- [ ] Atomic write completes without errors
- [ ] File is readable after creation
- [ ] File content matches expected structure
- [ ] No mock interference with real file operations
- [ ] Session state persistence works correctly

### Code Quality Validation

- [ ] Follows existing codebase patterns for file operations
- [ ] Error handling is comprehensive and specific
- [ ] Debug logging is informative but not verbose
- [ ] Changes are minimal and focused
- [ ] No regression in existing functionality
- [ ] Test fixtures match schema requirements

### Documentation & Deployment

- [ ] Root cause documented in research notes
- [ ] Fix approach documented with before/after comparison
- [ ] Lessons learned recorded for future debugging
- [ ] Related PRPs referenced correctly
- [ ] External documentation links verified
- [ ] Fix is reproducible and documented

## Anti-Patterns to Avoid

- ❌ **Don't modify Zod schemas** - Schemas are source of truth, fix test data instead
- ❌ **Don't skip Zod validation** - Validation is critical for data integrity
- ❌ **Don't use non-atomic writes** - Always use atomicWrite() for critical data
- ❌ **Don't ignore error codes** - Error codes (ENOENT, EACCES, etc.) provide root cause information
- ❌ **Don't catch all exceptions** - Be specific about which errors to handle
- ❌ **Don't skip temp file cleanup** - Always clean up on error
- ❌ **Don't assume session exists** - P2.M1.T2.S1 must be complete first
- ❌ **Don't mock file operations incorrectly** - Ensure mocks don't interfere with real operations
- ❌ **Don't ignore cross-device rename failures** - EXDEV errors need special handling
- ❌ **Don't write files without validation** - Always validate data before writing
- ❌ **Don't skip error logging** - Errors must be logged with context for debugging
- ❌ **Don't assume tests pass for right reasons** - Verify mock behavior is correct

---

## Confidence Score: 8/10

**One-Pass Implementation Success Likelihood**: HIGH

**Rationale**:

1. Clear dependency on P2.M1.T2.S1 (session initialization fix)
2. Comprehensive understanding of writeTasksJSON implementation
3. Multiple potential root causes identified with decision tree
4. Atomic write pattern is well-implemented and documented
5. Zod validation requirements are clearly understood
6. External research provides best practices guidance
7. Test structure analysis reveals potential mock issues
8. Debugging strategies are well-defined

**Potential Risks**:

- **Risk 1**: Root cause may be different than expected (Medium)
  - Mitigation: Comprehensive debugging approach with decision tree
- **Risk 2**: Test mocks may require significant changes (Low)
  - Mitigation: Mock analysis already completed, patterns understood
- **Risk 3**: Zod schema may be too strict for test data (Low)
  - Mitigation: Schema requirements are documented, test fixtures can be adjusted

**Validation**: The completed PRP provides everything needed for an AI agent unfamiliar with the codebase to implement this fix successfully using only the PRP content and codebase access. The systematic approach to root cause determination ensures the correct fix will be applied based on actual runtime behavior.
