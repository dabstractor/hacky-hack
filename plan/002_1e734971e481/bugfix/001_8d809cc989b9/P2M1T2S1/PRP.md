# PRP: Fix Session Initialization Failure - P2.M1.T2.S1

## Goal

**Feature Goal**: Fix the root cause of E2E test session initialization failure by correcting the `readFile` mock to return Buffer objects instead of strings, enabling proper session directory creation and file persistence.

**Deliverable**: Updated E2E test mock implementation in `tests/e2e/pipeline.test.ts` that properly mocks `readFile` to return Buffer objects matching production code expectations.

**Success Definition**:

- All 7 E2E tests pass successfully
- `prd_snapshot.md` is created in session directory
- `tasks.json` is created with valid content
- Session initialization completes without errors
- No `ERR_INVALID_ARG_TYPE` errors from TextDecoder
- Tests complete in under 30 seconds with mocks

## User Persona

**Target User**: Development team running E2E tests to validate PRP pipeline functionality

**Use Case**: Running `npm run test:run -- tests/e2e/pipeline.test.ts` to verify complete pipeline workflow before deploying changes

**User Journey**:

1. Developer makes changes to pipeline code
2. Developer runs E2E test suite to validate changes
3. Tests pass indicating session initialization, file creation, and task persistence work correctly
4. Developer confidently proceeds with deployment

**Pain Points Addressed**:

- Tests failing with cryptic `ERR_INVALID_ARG_TYPE` errors
- Session directories not being created
- Missing `prd_snapshot.md` and `tasks.json` files
- Pipeline continuing without valid session state
- Difficult to debug due to mock masking real issues

## Why

- **Business Value**: E2E tests are critical validation gates before deployment - their failure blocks the entire development pipeline
- **Integration**: Session initialization is the foundation of all pipeline operations - without it, no tasks can be tracked or executed
- **Problem Solved**: Fixes the root cause identified in P2.M1.T1.S3 debug analysis - mock type mismatch causing cascading failures

## What

Fix the E2E test mock for `readFile` to return Buffer objects instead of strings, matching the production code behavior in `readUTF8FileStrict()` which expects `readFile` to return a Buffer for `TextDecoder.decode()`.

### Success Criteria

- [ ] All 7 E2E tests in `tests/e2e/pipeline.test.ts` pass
- [ ] `prd_snapshot.md` file exists in session directory after test execution
- [ ] `tasks.json` file exists with valid backlog structure
- [ ] No `ERR_INVALID_ARG_TYPE` errors in test output
- [ ] Session initialization phase completes successfully
- [ ] Tests complete in under 30 seconds
- [ ] Mock implementation matches production `readFile` signature

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

1. Exact file locations and line numbers to modify
2. Complete code examples of both broken and fixed implementations
3. Underlying technical explanation of the issue
4. Related patterns from the codebase to follow
5. External documentation references
6. Validation commands to verify the fix

### Documentation & References

```yaml
# CRITICAL: Root cause analysis - MUST READ
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md
  why: Complete timeline analysis showing exactly how the mock type mismatch causes failure
  critical: The error occurs at line 203: TextDecoder.decode() expects Buffer but receives string from mock
  section: "Root Cause Diagnosis" (lines 237-266)

# CRITICAL: Production code that expects Buffer
- file: src/core/session-utils.ts
  why: Contains readUTF8FileStrict() function that calls TextDecoder.decode(buffer)
  pattern: Lines 195-206 show readFile() returns Buffer, not string
  gotcha: The 'utf-8' encoding parameter is NOT used in readFile call - Buffer is returned by default

# CRITICAL: Current broken mock implementation
- file: tests/e2e/pipeline.test.ts
  why: This is the file to fix - contains the incorrect mock returning strings
  pattern: Lines 240-249 show readFile mock returning Promise<string> instead of Promise<Buffer>
  gotcha: The mock implementation must return Buffer.from() to match production behavior

# REFERENCE: Correct mocking pattern from codebase
- file: tests/unit/core/session-utils.test.ts
  why: Shows proper Buffer mocking pattern already used in unit tests
  pattern: Lines 1164-1165 show mockReadFile.mockResolvedValue(Buffer.from(content))
  gotcha: This pattern works because it respects Node.js readFile return type

# REFERENCE: Test fixtures to use
- file: tests/fixtures/simple-prd.ts
  why: Contains mockSimplePRD template used in E2E tests
  pattern: String template that should be wrapped in Buffer.from() for mock

# REFERENCE: Mock factory patterns
- file: tests/e2e/delta.test.ts
  why: Shows E2E test patterns using real temp directories instead of extensive mocking
  pattern: Uses mkdtempSync() for temp files, real fs operations where possible
  gotcha: Hybrid approach - mock external services, use real file operations

# EXTERNAL: Buffer creation documentation
- url: https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding
  why: Official Node.js docs on Buffer.from() method used in fix
  critical: Buffer.from(string, 'utf-8') creates Buffer from string - use this in mock

# EXTERNAL: Vitest mocking documentation
- url: https://vitest.dev/guide/mocking.html
  why: Official Vitest docs on vi.mocked() helper for type-safe mocking
  section: "Type-safe mock getters with vi.mocked()"
  critical: Always use vi.mocked(readFile) for TypeScript type inference

# RESEARCH: Comprehensive mocking best practices
- file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/docs/vitest-fs-mocking-research.md
  why: Complete research report on Vitest file system mocking patterns
  section: "Buffer vs String Mocking" and "Complete Code Examples"
  critical: Contains multiple working examples and common pitfalls to avoid

# CONTEXT: Session initialization flow
- file: src/core/session-manager.ts
  why: Shows complete initialization sequence that must work for tests to pass
  pattern: Lines 210-472 show initialize() method calling PRD validation
  gotcha: PRD validation calls readUTF8FileStrict() which triggers the error

# CONTEXT: Error handling in pipeline
- file: src/workflows/prp-pipeline.ts
  why: Shows how SessionFileError is treated as non-fatal, allowing continuation
  pattern: Lines 470-491 show initializeSession() catch block continuing on error
  gotcha: This is why tests don't fail immediately - pipeline continues without session
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts       # SessionManager.initialize() calls PRD validation
│   │   └── session-utils.ts         # readUTF8FileStrict() expects Buffer from readFile
│   ├── utils/
│   │   ├── prd-validator.ts         # Calls readUTF8FileStrict() during validation
│   │   └── errors.ts                # isFatalError() determines SessionFileError is non-fatal
│   └── workflows/
│       └── prp-pipeline.ts          # PRPPipeline.initializeSession() handles errors
├── tests/
│   ├── e2e/
│   │   └── pipeline.test.ts         # ❌ TARGET FILE - Contains broken readFile mock
│   ├── fixtures/
│   │   └── simple-prd.ts            # Mock PRD content used in tests
│   └── unit/
│       └── core/
│           └── session-utils.test.ts # ✅ REFERENCE - Shows correct Buffer mocking
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        ├── architecture/
        │   └── e2e-debug-analysis.md # Root cause analysis
        ├── P2M1T2S1/
        │   └── PRP.md               # This document
        └── docs/
            └── vitest-fs-mocking-research.md # External research findings
```

### Desired Codebase Tree (No Changes)

```bash
# No structural changes - only mock implementation fix in tests/e2e/pipeline.test.ts
# The file already exists, only the mock implementation needs updating
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Node.js readFile has TWO return types based on encoding parameter:
// readFile(path) → Returns Promise<Buffer>
// readFile(path, 'utf-8') → Returns Promise<string>
//
// Our codebase uses readFile(path) WITHOUT encoding parameter in readUTF8FileStrict(),
// so it ALWAYS returns Buffer, not string.
//
// GOTCHA: The test mock returns strings, but production code expects Buffers.
// This is why TextDecoder.decode(buffer) throws ERR_INVALID_ARG_TYPE.

// CRITICAL: TextDecoder.decode() requires Buffer/ArrayBuffer, not string
// From src/core/session-utils.ts:195-206:
export async function readUTF8FileStrict(
  path: string,
  operation: string
): Promise<string> {
  try {
    const buffer = await readFile(path); // Returns Buffer (not string!)
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer); // ❌ THROWS if buffer is actually a string
  } catch (error) {
    throw new SessionFileError(path, operation, error as Error);
  }
}

// CRITICAL: isFatalError() treats SessionFileError as non-fatal
// From src/utils/errors.ts:680-685:
if (isSessionError(error)) {
  return (
    error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
    error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
  );
}
// SessionFileError is NOT checked here, so it's considered non-fatal.
// This allows pipeline to continue without valid session, masking the real error.

// CRITICAL: Mock must use Buffer.from() to create Buffer from string
// WRONG: Promise.resolve('string content')
// RIGHT: Promise.resolve(Buffer.from('string content', 'utf-8'))

// CRITICAL: Always use vi.mocked() for TypeScript type safety
// WRONG: vi.mocked(readFile).mockReturnValue(Promise.resolve('...'))
// RIGHT: vi.mocked(readFile).mockResolvedValue(Buffer.from('...'))

// GOTCHA: existsSync mock returns true for all paths, masking file creation failures
// From tests/e2e/pipeline.test.ts:252:
vi.mocked(existsSync).mockReturnValue(true);
// This masks the fact that prd_snapshot.md and tasks.json were never created.

// PATTERN: Unit tests already use correct Buffer mocking
// From tests/unit/core/session-utils.test.ts:1164-1165:
const prdContent = Buffer.from('# Test PRD\n\nContent');
mockReadFile.mockResolvedValue(prdContent);
// Follow this pattern in E2E tests.
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is a test mock fix only. Existing models used:

- **Backlog**: Task hierarchy structure from `src/core/models.ts`
- **SessionState**: Session metadata and task registry from `src/core/models.ts`
- **Buffer**: Node.js Buffer type for file content

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: LOCATE and READ the broken mock implementation
  - FILE: tests/e2e/pipeline.test.ts
  - LINES: 240-249 (readFile mock implementation)
  - CURRENT: Returns Promise.resolve(string) for all cases
  - ISSUE: TextDecoder.decode() expects Buffer, not string

Task 2: UPDATE readFile mock to return Buffer objects
  - FILE: tests/e2e/pipeline.test.ts
  - LINES: 240-249
  - CHANGE: Wrap all string returns in Buffer.from(content, 'utf-8')
  - PATTERN: Follow session-utils.test.ts:1164-1165 example
  - BEFORE: Promise.resolve(JSON.stringify(createMockBacklog()))
  - AFTER: Promise.resolve(Buffer.from(JSON.stringify(createMockBacklog()), 'utf-8'))
  - BEFORE: Promise.resolve(mockSimplePRD)
  - AFTER: Promise.resolve(Buffer.from(mockSimplePRD, 'utf-8'))

Task 3: VERIFY mock type safety with vi.mocked()
  - FILE: tests/e2e/pipeline.test.ts
  - LINES: 240 (ensure vi.mocked() is used)
  - CHECK: vi.mocked(readFile).mockImplementation() is type-safe
  - ALTERNATIVE: Use mockResolvedValue() for simpler syntax

Task 4: RUN E2E tests to validate fix
  - COMMAND: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
  - EXPECTED: All 7 tests pass
  - VALIDATE: prd_snapshot.md exists in session directory
  - VALIDATE: tasks.json exists with valid content
  - VALIDATE: No ERR_INVALID_ARG_TYPE errors

Task 5: VERIFY test execution time
  - COMMAND: npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
  - EXPECTED: Tests complete in under 30 seconds
  - LOG: Check console output for execution time

Task 6: CREATE research documentation (optional)
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P2M1T2S1/research/
  - CONTENT: Document the fix and reasoning for future reference
  - INCLUDE: Before/after comparison of mock implementation
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Correct readFile Mocking with Buffers
// ============================================================================

// WRONG - Current implementation (returns strings):
vi.mocked(readFile).mockImplementation((path: string | Buffer) => {
  const pathStr = String(path);
  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(JSON.stringify(createMockBacklog())); // ❌ String
  }
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(mockSimplePRD); // ❌ String
  }
  return Promise.resolve(''); // ❌ String
});

// RIGHT - Fixed implementation (returns Buffers):
vi.mocked(readFile).mockImplementation((path: string | Buffer) => {
  const pathStr = String(path);
  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(
      Buffer.from(JSON.stringify(createMockBacklog()), 'utf-8') // ✅ Buffer
    );
  }
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(Buffer.from(mockSimplePRD, 'utf-8')); // ✅ Buffer
  }
  return Promise.resolve(Buffer.from('', 'utf-8')); // ✅ Buffer
});

// ============================================================================
// PATTERN 2: Alternative Using mockResolvedValue (Simpler)
// ============================================================================

// Can use mockResolvedValue() for simpler syntax when not conditional:
vi.mocked(readFile).mockResolvedValue(Buffer.from('default content', 'utf-8'));

// ============================================================================
// PATTERN 3: Buffer Creation Best Practices
// ============================================================================

// From string with encoding (RECOMMENDED):
Buffer.from('content', 'utf-8');

// From JSON object:
Buffer.from(JSON.stringify(obj), 'utf-8');

// Empty Buffer:
Buffer.from('', 'utf-8');

// ============================================================================
// GOTCHA: Understanding readFile Return Types
// ============================================================================

// Node.js readFile has OVERLOADED return types:
import { readFile } from 'node:fs/promises';

// Without encoding → Returns Promise<Buffer>
const buffer = await readFile('path.txt'); // Buffer type

// With encoding → Returns Promise<string>
const text = await readFile('path.txt', 'utf-8'); // string type

// Our codebase uses readFile(path) WITHOUT encoding,
// so it ALWAYS returns Buffer, not string.

// ============================================================================
// CRITICAL: Why This Causes Failure
// ============================================================================

// Call chain:
// 1. Test calls: await pipeline.run()
// 2. Pipeline calls: sessionManager.initialize()
// 3. SessionManager calls: validator.validate(prdPath)
// 4. Validator calls: readUTF8FileStrict(prdPath, 'read PRD')
// 5. readUTF8FileStrict calls: await readFile(path) → Returns Buffer from real fs
// 6. But in TEST: Mock returns string instead of Buffer
// 7. TextDecoder.decode(buffer) → THROWS ERR_INVALID_ARG_TYPE
// 8. Error wrapped in SessionFileError
// 9. isFatalError() returns false (SessionFileError is non-fatal)
// 10. Pipeline continues WITHOUT valid session
// 11. Tests fail because sessionPath is empty, files don't exist

// ============================================================================
// PATTERN 4: Type-Safe Mocking with vi.mocked()
// ============================================================================

// Always use vi.mocked() for TypeScript type inference:
import { readFile } from 'node:fs/promises';

// Mock setup:
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

// In test:
vi.mocked(readFile).mockResolvedValue(Buffer.from('content', 'utf-8'));

// This provides type safety and IDE autocomplete.

// ============================================================================
// PATTERN 5: Following Existing Codebase Patterns
// ============================================================================

// From tests/unit/core/session-utils.test.ts:1164-1165:
const prdContent = Buffer.from('# Test PRD\n\nContent');
mockReadFile.mockResolvedValue(prdContent);

// This pattern works correctly - follow it in E2E tests.
```

### Integration Points

```yaml
FILES_TO_MODIFY:
  - file: tests/e2e/pipeline.test.ts
    lines: 240-249
    change: Update readFile mock to return Buffer objects
    impact: All 7 E2E tests will pass after this change

FILES_TO_REFERENCE:
  - file: tests/unit/core/session-utils.test.ts
    lines: 1164-1165
    why: Shows correct Buffer mocking pattern
    pattern: mockReadFile.mockResolvedValue(Buffer.from(content))

  - file: src/core/session-utils.ts
    lines: 195-206
    why: Shows readUTF8FileStrict() expecting Buffer from readFile
    gotcha: readFile() is called WITHOUT encoding parameter

  - file: src/core/session-manager.ts
    lines: 210-472
    why: Shows complete initialization flow
    gotcha: PRD validation triggers the error path

NO_CHANGES_TO:
  - src/core/session-manager.ts (production code)
  - src/core/session-utils.ts (production code)
  - src/utils/prd-validator.ts (production code)
  - src/workflows/prp-pipeline.ts (production code)
  - tests/fixtures/simple-prd.ts (test fixture)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compilation check
npm run build

# Expected: No type errors

# If type errors occur, verify:
# 1. Buffer.from() is used correctly
# 2. vi.mocked() is used for type safety
# 3. All imports are correct

# Run linter
npm run lint

# Expected: No linting errors

# If linting errors occur, fix them before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run session-utils unit tests to ensure Buffer mocking still works
npm run test:run -- tests/unit/core/session-utils.test.ts --no-coverage

# Expected: All tests pass

# This validates that our understanding of Buffer mocking is correct
# and that the unit test pattern we're following is valid.
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
# - No ERR_INVALID_ARG_TYPE errors
# - Session initialization phase completes
# - prd_snapshot.md created successfully
# - tasks.json created with valid content
# - Execution time < 30 seconds

# Detailed validation commands:
# Check that session directory is created
ls -la /tmp/e2e-pipeline-test-*/plan/*_*/

# Check that prd_snapshot.md exists
cat /tmp/e2e-pipeline-test-*/plan/*_*/prd_snapshot.md

# Check that tasks.json exists and is valid JSON
cat /tmp/e2e-pipeline-test-*/plan/*_*/tasks.json | jq .

# Expected: Valid JSON with backlog structure
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Run E2E tests with verbose debug output
DEBUG=* npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage

# Check for specific debug messages:
# [SessionManager] Starting session initialization
# [SessionManager] PRD hash computed
# [SessionManager] PRD validation passed
# [SessionManager] Session directory created
# [SessionManager] PRD snapshot created
# [SessionManager] Session initialized successfully

# Verify no error messages about:
# - ERR_INVALID_ARG_TYPE
# - TextDecoder
# - SessionFileError
# - Session initialization failed

# Performance validation:
# Run tests 10 times to ensure consistent performance
for i in {1..10}; do
  echo "Run $i:"
  time npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage
done

# Expected: All runs complete in < 30 seconds, all tests pass

# Edge case testing:
# Test with different PRD content sizes
# Test with empty PRD
# Test with large PRD
# Test with special characters in PRD

# Expected: All tests pass regardless of PRD content
```

## Final Validation Checklist

### Technical Validation

- [ ] All 7 E2E tests pass: `npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage`
- [ ] No `ERR_INVALID_ARG_TYPE` errors in test output
- [ ] No TypeScript compilation errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Tests complete in under 30 seconds
- [ ] `prd_snapshot.md` file created in session directory
- [ ] `tasks.json` file created with valid backlog structure
- [ ] Session initialization phase completes successfully

### Feature Validation

- [ ] Mock returns Buffer objects, not strings
- [ ] Buffer.from() used with 'utf-8' encoding parameter
- [ ] Mock implementation follows pattern from session-utils.test.ts
- [ ] vi.mocked() used for type-safe mocking
- [ ] All test fixtures (mockSimplePRD) wrapped in Buffer.from()
- [ ] Conditional mock logic preserved for different file types
- [ ] Error handling tests still pass (non-existent PRD test)

### Code Quality Validation

- [ ] Follows existing codebase patterns for Buffer mocking
- [ ] No changes to production code (only test mocks)
- [ ] Type safety maintained with vi.mocked()
- [ ] Consistent with unit test patterns in codebase
- [ ] Mock implementation is clear and maintainable

### Documentation & Deployment

- [ ] Research documentation created in P2M1T2S1/research/
- [ ] Before/after comparison documented
- [ ] Root cause analysis referenced correctly
- [ ] External documentation links verified
- [ ] Fix is reproducible and documented for future developers

## Anti-Patterns to Avoid

- ❌ **Don't change production code** - This is a test mock fix only, not a production code issue
- ❌ **Don't return strings from readFile mock** - Always use Buffer.from() to create Buffer objects
- ❌ **Don't use mockReturnValue** - Use mockResolvedValue() or mockImplementation() for Promise-based mocks
- ❌ **Don't skip vi.mocked()** - Always use vi.mocked() for TypeScript type safety
- ❌ **Don't ignore encoding parameter** - Always specify 'utf-8' in Buffer.from(content, 'utf-8')
- ❌ **Don't make SessionFileError fatal** - The non-fatal handling is correct, only the mock needs fixing
- ❌ **Don't modify existsSync mock** - The current existsSync behavior is acceptable
- ❌ **Don't add new test files** - Fix the existing mock in the existing test file
- ❌ **Don't change the test assertions** - The existing assertions are correct, only the mock needs fixing
- ❌ **Don't skip this fix** - Without it, E2E tests will continue failing and block the development pipeline

---

## Confidence Score: 10/10

**One-Pass Implementation Success Likelihood**: VERY HIGH

**Rationale**:

1. Root cause is clearly identified and documented (debug analysis from P2.M1.T1.S3)
2. Fix is minimal and focused (only mock implementation change)
3. Correct pattern already exists in codebase (session-utils.test.ts)
4. No production code changes required (reduces risk)
5. Comprehensive validation steps provided
6. External research validates the approach
7. Clear before/after examples provided

**Potential Risks** (None identified):

- No production code changes = No deployment risk
- Only test mock modification = No runtime behavior changes
- Follows existing patterns = No new conventions introduced

**Validation**: The completed PRP provides everything needed for an AI agent unfamiliar with the codebase to implement this fix successfully using only the PRP content and codebase access.
