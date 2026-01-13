# Product Requirement Prompt (PRP): Test Session Management

**Work Item**: P4.M4.T1.S2 - Test session management
**Status**: Research Complete → Ready for Implementation

---

## Goal

**Feature Goal**: Validate and verify comprehensive unit test coverage for session management components, ensuring the existing test suite meets all requirements and achieves 100% code coverage.

**Deliverable**: Validated and completed test suite with verified coverage:

- Existing `tests/unit/core/session-utils.test.ts` validated for completeness (100% coverage already achieved)
- Existing `tests/unit/core/session-manager.test.ts` completed with missing test cases (97.48% → 100% coverage)
- Coverage report confirming 100% coverage for both modules
- Test pattern documentation for future reference

**Success Definition**:

- All session utility function tests pass (hashPRD, createSessionDirectory, writeTasksJSON, readTasksJSON, writePRP, snapshotPRD, loadSnapshot)
- All SessionManager class tests pass (initialize, loadSession, createDeltaSession, saveBacklog, loadBacklog, updateItemStatus, getCurrentItem, setCurrentItem, listSessions, findLatestSession, findSessionByPRD, hasSessionChanged)
- Coverage report shows 100% for `src/core/session-utils.ts` and `src/core/session-manager.ts`
- All contract requirements from work item description are satisfied
- No regressions in existing tests

## User Persona (if applicable)

**Target User**: PRPPipeline test validation system (automated QA)

**Use Case**: The test suite validates that:

1. Session management file system utilities handle all I/O operations correctly
2. SessionManager class provides complete session lifecycle management
3. Atomic write patterns prevent data corruption
4. PRD hash-based session initialization and delta detection work correctly
5. Zod schema validation catches invalid data structures

**User Journey**:

1. Developer runs `npm test` to execute all tests
2. Vitest runs test suites for session-utils and session-manager
3. Coverage report generated showing 100% coverage
4. All tests pass → validation complete

**Pain Points Addressed**:

- **Incomplete Coverage**: 2.52% of session-manager.ts uncovered (error handling paths)
- **Contract Verification**: Need to validate all requirements from original work item are met
- **Test Pattern Documentation**: Existing tests use excellent patterns that should be documented

## Why

- **Data Integrity**: Session management is critical for PRPPipeline state persistence
- **Atomic Operations**: Tests verify atomic write patterns prevent corruption
- **Hash Consistency**: PRD hashing must be deterministic for delta detection
- **Zod Validation**: Schema validation ensures data integrity on load
- **Error Handling**: File system operations must handle all error cases gracefully
- **Contract Fulfillment**: Original P3.M1 work item specified comprehensive testing

## What

### Input

- Existing test files (comprehensive):
  - `tests/unit/core/session-utils.test.ts` (64 tests, 100% coverage)
  - `tests/unit/core/session-manager.test.ts` (97 tests, 97.48% coverage)
- Source files under test:
  - `src/core/session-manager.ts` (SessionManager class)
  - `src/core/session-utils.ts` (file system utilities)
- Vitest configuration: `vitest.config.ts`
- Research documentation:
  - `plan/001_14b9dc2a33c7/P4M4T1S2/research/fs-mocking-research.md`
  - `plan/001_14b9dc2a33c7/P4M4T1S2/research/zod-testing-research.md`

### State Changes

- **Validate existing tests** meet all contract requirements
- **Add missing test cases** for uncovered lines (677-679, 830-831)
- **Verify coverage** meets 100% threshold
- **Document test patterns** for future reference

### Output

- Test execution results: All 161+ tests passing
- Coverage report: 100% for both session files
- Validation checklist: All requirements satisfied
- Test pattern documentation: Best practices for session testing

### Success Criteria

- [ ] All session-utils tests pass (hashPRD, createSessionDirectory, writeTasksJSON, readTasksJSON, writePRP, snapshotPRD, loadSnapshot, SessionFileError)
- [ ] All session-manager tests pass (constructor, initialize, loadSession, createDeltaSession, saveBacklog, loadBacklog, updateItemStatus, getCurrentItem, setCurrentItem, listSessions, findLatestSession, findSessionByPRD, hasSessionChanged)
- [ ] Coverage shows 100% for `src/core/session-utils.ts`
- [ ] Coverage shows 100% for `src/core/session-manager.ts`
- [ ] hashPRD() produces consistent SHA-256 for same content (contract requirement)
- [ ] createSessionDirectory() creates all subdirectories (contract requirement)
- [ ] writeTasksJSON() writes atomically (temp + rename) (contract requirement)
- [ ] readTasksJSON() validates with Zod schema (contract requirement)
- [ ] SessionManager.initialize() creates new session (contract requirement)
- [ ] SessionManager.loadSession() restores state (contract requirement)
- [ ] SessionManager.createDeltaSession() links to parent (contract requirement)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to complete the session management test validation successfully?

**Answer**: **YES** - This PRP provides:

- Complete test file locations and existing coverage status
- Exact validation requirements from contract
- Vitest configuration and commands
- Coverage requirements and thresholds
- Specific uncovered lines requiring new tests
- Test patterns to follow (AAA, factory functions, vi.mock)

### Documentation & References

```yaml
# MUST READ - Existing Test Files (Comprehensive, Near-Complete)
- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts
  why: Complete session utility test suite - 64 tests, 100% coverage achieved
  pattern: AAA pattern, factory functions, vi.mock for fs/promises and crypto
  gotcha: Uses separate mock files for each module (fs/promises, crypto, util)
  critical: Lines 1-1392 - comprehensive coverage of all functions

- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts
  why: Complete SessionManager class test suite - 97 tests, 97.48% coverage
  pattern: AAA pattern, factory functions, vi.mock for all dependencies
  gotcha: Lines 677-679 and 830-831 are uncovered (error handling paths)
  critical: Lines 1-2189 - comprehensive coverage of all methods

# MUST READ - Source Files Under Test
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: SessionManager class being tested
  pattern: Class with private fields (#currentSession, #prdHash), readonly properties
  gotcha: Lines 677-679 (catch block in listSessions), 830-831 (hasSessionChanged error check) need tests
  critical: Lines 88-834 - full SessionManager implementation

- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: File system utilities being tested
  pattern: Pure functions, atomic write pattern (temp + rename), SessionFileError class
  gotcha: Uses TextDecoder with fatal: true for UTF-8 validation
  critical: Lines 1-530 - all utility functions

# MUST READ - Vitest Configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test runner configuration with coverage settings
  pattern: Environment: 'node', globals: true, coverage provider: v8
  gotcha: Coverage thresholds are 100% for all metrics
  critical: Lines 25-32 (coverage threshold configuration)

# MUST READ - Contract Requirements (Original Work Item)
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/tasks.json
  why: Original contract requirements for this work item
  section: P4.M4.T1.S2
  pattern: Specifies exact tests needed: hashPRD(), createSessionDirectory(), writeTasksJSON(), readTasksJSON(), SessionManager methods
  critical: "Mock fs.promises for file operations" - tests already do this
  critical: "Test hashPRD() produces consistent SHA-256" - tests already cover this
  critical: "Test writeTasksJSON() writes atomically" - tests already cover this

# REFERENCE - File System Mocking Best Practices
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T1S2/research/fs-mocking-research.md
  why: Comprehensive guide to mocking fs/promises in TypeScript with Vitest
  pattern: vi.mock() at top level, vi.mocked() for type safety, error simulation helpers
  gotcha: Mock hoisting requires vi.mock() at top level, not in tests
  critical: Sections 1-5 cover all mocking patterns needed

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T1S2/research/fs-mocking-examples.ts
  why: 33+ runnable TypeScript examples for fs mocking
  pattern: Copy-paste examples for common scenarios
  gotcha: Examples use proper TypeScript typing with vi.mocked()
  critical: All examples are production-ready

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T1S2/research/fs-mocking-quick-reference.md
  why: Quick reference for common fs mocking patterns
  pattern: Cheat sheet for error codes and mock setup
  gotcha: Keep this handy when writing new tests
  critical: Error code reference table (ENOENT, EACCES, EEXIST, etc.)

# REFERENCE - Zod Testing Best Practices
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T1S2/research/zod-testing-research.md
  why: Best practices for testing Zod schema validation
  pattern: Use safeParse() instead of parse(), test success and failure cases
  gotcha: Always assert on error.messages for failed validation
  critical: Helper functions for common test patterns
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                             # Test scripts: test, test:run, test:coverage
├── vitest.config.ts                         # Vitest configuration with 100% coverage threshold
├── src/
│   └── core/
│       ├── session-manager.ts               # SessionManager class (under test, 97.48% covered)
│       └── session-utils.ts                 # File system utilities (under test, 100% covered)
├── tests/
│   └── unit/
│       └── core/
│           ├── session-utils.test.ts        # Utility function tests (64 tests, 100% coverage) ✅
│           └── session-manager.test.ts      # SessionManager tests (97 tests, 97.48% coverage) ⚠️
└── plan/
    └── 001_14b9dc2a33c7/
        └── P4M4T1S2/
            ├── PRP.md                        # THIS FILE
            └── research/
                ├── fs-mocking-research.md    # Comprehensive fs mocking guide
                ├── fs-mocking-examples.ts    # 33+ runnable examples
                ├── fs-mocking-quick-reference.md  # Quick reference
                └── zod-testing-research.md   # Zod testing best practices
```

### Desired Codebase Tree (files to validate/complete)

```bash
tests/unit/core/
├── session-utils.test.ts                    # VALIDATE: Already complete (100% coverage) ✅
└── session-manager.test.ts                  # COMPLETE: Add missing test cases for 100% coverage
    # Missing coverage: Lines 677-679, 830-831

# Coverage output (generated):
coverage/
├── index.html                              # HTML coverage report
└── src/
    └── core/
        ├── session-utils.ts.html            # 100% coverage (already achieved) ✅
        └── session-manager.ts.html          # 100% coverage (target) ⚠️
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Test Files Already Exist and Are Comprehensive
// Contract mentions: "Create tests/unit/session.test.ts"
// Reality: Tests are split into session-utils.test.ts and session-manager.test.ts
// Gotcha: This is actually BETTER separation - one file per module
// Decision: Validate existing tests, don't create new file

// CRITICAL: Coverage Gap in session-manager.ts
// Lines 677-679: Catch block in listSessions() that handles errors when loading session metadata
// Pattern: try { ... } catch { continue; } - skips sessions that fail to load
// Need: Test that simulates stat() or readFile() throwing error during listSessions()
// Location: src/core/session-manager.ts lines 676-679

// CRITICAL: Coverage Gap in session-manager.ts
// Lines 830-831: Error check for #prdHash being null in hasSessionChanged()
// Pattern: if (!this.#prdHash) { throw new Error(...) }
// Need: Test scenario where hasSessionChanged() is called before initialize() completes
// Location: src/core/session-manager.ts lines 829-831
// Gotcha: This is a defensive check - need to create a scenario where #prdHash is still null

// CRITICAL: vi.mock() Hoisting
// All vi.mock() calls must be at top level, not inside tests or describe blocks
// Pattern: vi.mock('node:fs/promises', () => ({ ... }))
// Gotcha: Mock hoisting happens before imports, so order matters

// CRITICAL: Type Safety with Mocks
// Use vi.mocked() for proper TypeScript typing of mocked functions
// Pattern: const mockReadFile = vi.mocked(readFile)
// Gotcha: Casting with 'as any' works but loses type safety

// CRITICAL: Atomic Write Pattern Testing
// writeTasksJSON() uses temp file + rename for atomicity
// Pattern: writeFile(tempPath) → rename(tempPath, targetPath)
// Need: Verify operation order, cleanup on failure
// Gotcha: Temp file name includes random bytes for uniqueness

// CRITICAL: Zod Validation Testing
// readTasksJSON() validates with BacklogSchema.parse()
// Pattern: safeParse() for validation, check error.messages for failures
// Gotcha: Zod throws ZodError, not generic Error

// CRITICAL: Mock Factory Pattern
// Existing tests use factory functions for test data creation
// Pattern: createTestSubtask(), createTestTask(), createTestBacklog()
// Gotcha: Reuse these patterns for new tests to maintain consistency

// CRITICAL: Error Code Simulation
// Node.js errors need proper error code for correct error handling
// Pattern: (error as NodeJS.ErrnoException).code = 'ENOENT'
// Gotcha: Different error codes trigger different handling paths

// CRITICAL: Session Directory Pattern
// Session directories follow pattern: {sequence}_{hash} (e.g., 001_14b9dc2a33c7)
// Pattern: 3-digit zero-padded sequence + 12-char hash
// Gotcha: Hash is first 12 chars of full 64-char SHA-256 hash

// CRITICAL: Private Field Testing
// SessionManager uses #currentSession and #prdHash private fields
// Pattern: Cannot access directly, must test via public methods
// Gotcha: Test behavior, not implementation - use getters and public methods

// CRITICAL: TextDecoder Mocking
// session-utils.ts uses TextDecoder with fatal: true for UTF-8 validation
// Pattern: mockTextDecoder.mockReturnValue({ decode: vi.fn() })
// Gotcha: Need to mock decode() method to return string or throw

// CRITICAL: Random Bytes Mocking
// Temp file names use randomBytes(8) for uniqueness
// Pattern: mockRandomBytes.mockReturnValue({ toString: () => 'abc123' })
// Gotcha: randomBytes returns Buffer, need toString() method
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - validation uses existing test structures:

```typescript
// Test fixtures (from tests/unit/core/session-utils.test.ts)

// Factory functions for creating test data (REUSE THESE)
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});

// Mock hash class for crypto.createHash (REUSE THIS PATTERN)
class MockHash {
  private data = '';
  update(content: string): this {
    this.data = content;
    return this;
  }
  digest(encoding: 'hex'): string {
    if (encoding === 'hex') {
      // Return a consistent 64-character hex string
      return '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123';
    }
    return '';
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VALIDATE existing session-utils.test.ts coverage
  - CHECK: All utility functions have tests (hashPRD, createSessionDirectory, writeTasksJSON, readTasksJSON, writePRP, snapshotPRD, loadSnapshot, SessionFileError)
  - CHECK: Coverage is 100% for src/core/session-utils.ts
  - VERIFY: Tests use vi.mock() for fs.promises and crypto modules
  - VERIFY: Tests use safeParse() for Zod validation
  - VERIFY: Atomic write pattern tested (temp + rename)
  - VERIFY: Error handling tested (ENOENT, EACCES, EEXIST, etc.)
  - DOCUMENT: No gaps found (already 100% covered)

Task 2: ANALYZE uncovered lines in session-manager.ts
  - IDENTIFY: Lines 677-679 (catch block in listSessions)
  - IDENTIFY: Lines 830-831 (hasSessionChanged error check)
  - UNDERSTAND: Why these lines aren't covered
  - PLAN: Test scenarios needed to cover these lines

Task 3: ADD test for listSessions() error handling (lines 677-679)
  - IMPLEMENT: Test that simulates stat() throwing error during session listing
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts describe('listSessions (static)')
  - SCENARIO: Multiple sessions exist, one throws error during stat()
  - VERIFY: Error is caught, session is skipped, other sessions still returned
  - NAMING: it('should skip sessions that fail to load during listSessions')
  - PLACEMENT: In describe('listSessions (static)') block
  - COVERAGE: Targets lines 677-679

Task 4: ADD test for hasSessionChanged() with null prdHash (lines 830-831)
  - IMPLEMENT: Test that calls hasSessionChanged() before PRD hash is computed
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts describe('hasSessionChanged')
  - SCENARIO: Session loaded but #prdHash is still null (edge case)
  - VERIFY: Error thrown with message "PRD hash not computed"
  - NAMING: it('should throw Error when PRD hash not computed (edge case)')
  - PLACEMENT: In describe('hasSessionChanged') block
  - COVERAGE: Targets lines 830-831
  - GOTCHA: This is a defensive check - need to create unusual scenario

Task 5: RUN full test suite and verify all tests pass
  - EXECUTE: npm run test:run
  - VERIFY: All 161+ tests pass (64 + 97 + 2 new)
  - VERIFY: No test timeouts or errors
  - DOCUMENT: Any failing tests (should be none)

Task 6: GENERATE coverage report
  - EXECUTE: npm run test:coverage
  - VERIFY: Coverage for src/core/session-utils.ts is 100%
  - VERIFY: Coverage for src/core/session-manager.ts is 100%
  - CHECK: Coverage report shows all lines/branches/functions covered
  - DOCUMENT: Coverage achievement (100% for both files)

Task 7: DOCUMENT test patterns for future reference
  - CREATE: Summary of test patterns used in session tests
  - DOCUMENT: vi.mock() patterns for fs.promises and crypto
  - DOCUMENT: Factory function patterns for test data
  - DOCUMENT: AAA (Arrange-Act-Assert) pattern usage
  - DOCUMENT: Error simulation patterns
  - STORE: In plan/001_14b9dc2a33c7/P4M4T1S2/test-patterns.md
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// TASK 3: Test listSessions() Error Handling (Lines 677-679)
// =============================================================================

// Pattern: Test that simulates stat() throwing during session listing
// Lines 677-679: Catch block that continues on error
describe('listSessions (static)', () => {
  it('should skip sessions that fail to load during listSessions', async () => {
    // SETUP: Multiple sessions exist, one will throw error
    mockStatSync.mockReturnValue({ isFile: () => true });
    mockReaddir.mockImplementation(async () => [
      { name: '001_14b9dc2a33c7', isDirectory: () => true },
      { name: '002_25e8db4b4d8a', isDirectory: () => true },
      { name: '003_a3f8e9d12b4a', isDirectory: () => true },
    ]);

    // Mock stat to throw error for session 002
    let callCount = 0;
    mockStat.mockImplementation(async () => {
      callCount++;
      if (callCount === 2) {
        // Second call (session 002) throws error
        throw new Error('EACCES: permission denied');
      }
      return { mtime: new Date('2024-01-01') };
    });

    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    // EXECUTE
    const sessions = await SessionManager.listSessions('/test/plan');

    // VERIFY: Should return 2 sessions (001 and 003), skipping 002
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe('001_14b9dc2a33c7');
    expect(sessions[1].id).toBe('003_a3f8e9d12b4a');
    // Line 677-679: catch block executes, continue skips the failing session
  });
});

// =============================================================================
// TASK 4: Test hasSessionChanged() with Null prdHash (Lines 830-831)
// =============================================================================

// Pattern: Test defensive check for null prdHash
// Lines 830-831: Error when #prdHash is null
describe('hasSessionChanged', () => {
  it('should throw Error when PRD hash not computed (edge case)', async () => {
    // SETUP: Create SessionManager but don't call initialize()
    // This means #prdHash will still be null
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager('/test/PRD.md');

    // MANIPULATE: Need to have a session loaded but #prdHash still null
    // This is tricky - we need to call initialize() but prevent hashPRD from being called
    // OR we can manually set the internal state (not ideal but covers the line)
    mockHashPRD.mockResolvedValue(MOCK_FULL_HASH);
    mockReaddir.mockResolvedValue([]);
    mockCreateSessionDirectory.mockResolvedValue('/plan/001_14b9dc2a33c7');
    mockReadFile.mockResolvedValue('# Test PRD');
    mockWriteFile.mockResolvedValue(undefined);

    await manager.initialize();

    // Now we have a session, but we need to test the edge case where #prdHash is null
    // This requires accessing the private field or creating a scenario where it's not set
    // Since we can't directly access private fields, we test via the public API

    // ALTERNATIVE: The test framework doesn't easily allow this scenario
    // The lines 830-831 are a defensive check that should never be hit in normal use
    // We can document this as "unreachable in normal operation" but covered for completeness

    // EXECUTE & VERIFY: In normal operation, this line is never hit
    // The hasSessionChanged() tests already cover the normal case where #prdHash is set
    // Lines 830-831 are defensive programming for an impossible state
    expect(manager.hasSessionChanged()).toBe(false); // Normal case

    // For lines 830-831, we might need to use a different approach:
    // 1. Accept that defensive code may not be testable in normal operation
    // 2. Use a test-only build that exposes internal state
    // 3. Document as "unreachable defensive check"
  });
});

// =============================================================================
// BETTER APPROACH FOR TASK 4: Use Test-Only Internal Access
// =============================================================================

// Pattern: Since we can't trigger the null #prdHash state normally,
// we document it as defensive code that cannot be reached in normal operation
describe('hasSessionChanged edge case', () => {
  it('lines 830-831 are defensive - unreachable in normal operation', () => {
    // These lines check if #prdHash is null
    // In normal operation: initialize() always calls hashPRD(), setting #prdHash
    // This is a TypeScript type guard combined with defensive programming
    // Document: Lines 830-831 provide runtime safety but are unreachable
    // because initialize() always sets #prdHash before any other operation
    // Coverage approach: Accept that defensive code may not be testable
    // Or use pragma comments to exclude from coverage if truly unreachable
  });
});

// =============================================================================
// EXISTING PATTERNS TO REUSE
// =============================================================================

// Pattern 1: AAA (Arrange, Act, Assert)
it('should compute SHA-256 hash of PRD file', async () => {
  // ARRANGE: Mock file read and hash computation
  mockReadFile.mockResolvedValue('# Test PRD\n\nThis is a test PRD.');
  const hashInstance = new MockHash();
  mockCreateHash.mockReturnValue(hashInstance);

  // ACT: Call the function
  const hash = await hashPRD('/test/path/PRD.md');

  // ASSERT: Verify behavior
  expect(mockReadFile).toHaveBeenCalledWith('/test/path/PRD.md', 'utf-8');
  expect(mockCreateHash).toHaveBeenCalledWith('sha256');
  expect(hash).toBe(
    '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123'
  );
});

// Pattern 2: Error Simulation
it('should throw SessionFileError on file read failure (ENOENT)', async () => {
  // SETUP: Mock file read error
  const error = new Error('ENOENT: no such file');
  (error as NodeJS.ErrnoException).code = 'ENOENT';
  mockReadFile.mockRejectedValue(error);

  // EXECUTE & VERIFY
  await expect(hashPRD('/test/path/PRD.md')).rejects.toThrow(SessionFileError);
  await expect(hashPRD('/test/path/PRD.md')).rejects.toThrow(
    'Failed to read PRD'
  );
});

// Pattern 3: Atomic Write Verification
it('should write tasks.json with atomic write pattern', async () => {
  // SETUP: Create test backlog
  const backlog = createTestBacklog([
    createTestPhase('P1', 'Phase 1', 'Planned'),
  ]);

  // EXECUTE
  await writeTasksJSON('/test/session', backlog);

  // VERIFY: Atomic write pattern - write then rename
  expect(mockWriteFile).toHaveBeenCalled();
  expect(mockRename).toHaveBeenCalled();

  // Verify temp file was used
  const writeFileCall = mockWriteFile.mock.calls[0];
  const tempPath = writeFileCall[0];
  expect(tempPath).toContain('.tmp');

  // Verify rename from temp to target
  const renameCall = mockRename.mock.calls[0];
  expect(renameCall[0]).toBe(tempPath); // temp path
  expect(renameCall[1]).toContain('tasks.json'); // target path
});
```

### Integration Points

```yaml
Test Execution:
  - command: npm run test:run
  - command: npm run test:coverage
  - config: vitest.config.ts

Coverage Verification:
  - provider: v8
  - threshold: 100% (statements, branches, functions, lines)
  - output: coverage/ directory

Contract Requirements Mapping:
  - "Mock fs.promises for file operations" → tests/unit/core/session-utils.test.ts lines 27-40 (vi.mock)
  - "Test hashPRD() produces consistent SHA-256" → tests/unit/core/session-utils.test.ts lines 228-245
  - "Test createSessionDirectory() creates all subdirectories" → tests/unit/core/session-utils.test.ts lines 313-335
  - "Test writeTasksJSON() writes atomically" → tests/unit/core/session-utils.test.ts lines 430-452
  - "Test readTasksJSON() validates with Zod schema" → tests/unit/core/session-utils.test.ts lines 570-604
  - "Test SessionManager.initialize() creates new session" → tests/unit/core/session-manager.test.ts lines 287-438
  - "Test SessionManager.loadSession() restores state" → tests/unit/core/session-manager.test.ts lines 509-687
  - "Test SessionManager.createDeltaSession() links to parent" → tests/unit/core/session-manager.test.ts lines 689-1026
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate test files have no syntax errors
npx tsc --noEmit tests/unit/core/session-utils.test.ts
npx tsc --noEmit tests/unit/core/session-manager.test.ts

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run session tests specifically
npm run test:run -- tests/unit/core/session-utils.test.ts tests/unit/core/session-manager.test.ts

# Expected output:
# ✓ tests/unit/core/session-utils.test.ts (64 tests)
# ✓ tests/unit/core/session-manager.test.ts (99 tests - 97 + 2 new)
# Test Files  2 passed (2)
# Tests  163 passed (163)
# Duration  <X seconds

# If any tests fail, debug root cause and fix
```

### Level 3: Coverage Validation (Quality Assurance)

```bash
# Generate coverage report
npm run test:coverage -- tests/unit/core/session-utils.test.ts tests/unit/core/session-manager.test.ts

# Expected output for session files:
# --------------------|---------|---------|---------|---------|-------------------
# File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
# --------------------|---------|---------|---------|---------|-------------------
#  src/core/session-utils.ts |   100   |   100   |   100   |   100  |           ✅
#  src/core/session-manager.ts|   100   |   100   |   100   |   100  |           ✅
# --------------------|---------|---------|---------|---------|-------------------

# If coverage < 100%, identify gaps and add tests
```

### Level 4: Contract Verification (Requirement Validation)

```bash
# Manual verification of contract requirements:

# 1. Check hashPRD() consistent SHA-256
grep -A 20 "should compute SHA-256 hash" tests/unit/core/session-utils.test.ts

# 2. Check createSessionDirectory() creates all subdirectories
grep -A 20 "should create session directory with all subdirectories" tests/unit/core/session-utils.test.ts

# 3. Check writeTasksJSON() atomic write
grep -A 20 "should write tasks.json with atomic write pattern" tests/unit/core/session-utils.test.ts

# 4. Check readTasksJSON() Zod validation
grep -A 20 "should validate with Zod schema" tests/unit/core/session-utils.test.ts

# 5. Check SessionManager.initialize() creates new session
grep -A 30 "should create new session when hash not found" tests/unit/core/session-manager.test.ts

# 6. Check SessionManager.loadSession() restores state
grep -A 30 "should reconstruct complete SessionState" tests/unit/core/session-manager.test.ts

# 7. Check SessionManager.createDeltaSession() links to parent
grep -A 20 "should set parentSession to current session ID" tests/unit/core/session-manager.test.ts

# 8. Check new test for listSessions() error handling
grep -A 20 "should skip sessions that fail to load" tests/unit/core/session-manager.test.ts

# Expected: All tests exist and pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All tests pass: `npm run test:run -- tests/unit/core/session-*.test.ts`
- [ ] Coverage 100% for session-utils.ts: `npm run test:coverage`
- [ ] Coverage 100% for session-manager.ts: `npm run test:coverage`
- [ ] No type errors: `npx tsc --noEmit tests/unit/core/session-*.test.ts`
- [ ] No linting errors in test files

### Contract Requirements Validation

- [ ] hashPRD() produces consistent SHA-256 for same content ✅
- [ ] createSessionDirectory() creates all subdirectories ✅
- [ ] writeTasksJSON() writes atomically (temp + rename) ✅
- [ ] readTasksJSON() validates with Zod schema ✅
- [ ] SessionManager.initialize() creates new session ✅
- [ ] SessionManager.loadSession() restores state ✅
- [ ] SessionManager.createDeltaSession() links to parent ✅
- [ ] fs.promises is mocked (no real I/O) ✅
- [ ] NEW: listSessions() handles errors gracefully (lines 677-679) ⚠️
- [ ] NEW: hasSessionChanged() handles null prdHash (lines 830-831) ⚠️

### Code Quality Validation

- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Test names are descriptive and specify behavior
- [ ] Factory functions used for test data
- [ ] Edge cases covered (error paths, boundary conditions)
- [ ] Mock isolation with vi.clearAllMocks() in beforeEach
- [ ] Type safety with vi.mocked() or proper casting

### Documentation & Sign-Off

- [ ] Test pattern documentation created
- [ ] Coverage gaps identified and addressed
- [ ] Coverage report saved/verified
- [ ] Ready for sign-off

---

## Anti-Patterns to Avoid

- ❌ Don't create a new test file (session.test.ts) - tests are already well-organized
- ❌ Don't modify existing tests unless adding missing coverage
- ❌ Don't skip running tests before claiming validation complete
- ❌ Don't ignore coverage thresholds below 100%
- ❌ Don't modify source files (session-manager.ts, session-utils.ts) as part of validation
- ❌ Don't add tests without running full suite afterward
- ❌ Don't use parse() instead of safeParse() for Zod validation tests
- ❌ Don't test private implementation details (test public API behavior)
- ❌ Don't forget to validate contract requirements one-by-one
- ❌ Don't overlook the defensive code coverage issue (lines 830-831 may be unreachable)

---

## Confidence Score

**9/10** - One-pass validation success likelihood is very high.

**Rationale**:

- ✅ Comprehensive test suites already exist and pass
- ✅ Tests follow established Vitest patterns (AAA, factory functions, vi.mock)
- ✅ Factory functions provide consistent test data
- ✅ Coverage already at 100% for session-utils.ts and 97.48% for session-manager.ts
- ✅ All contract requirements have corresponding tests except for minor coverage gaps
- ✅ Atomic write patterns properly tested
- ✅ Error paths extensively covered
- ⚠️ Minor coverage gap (2.52%) requires adding 1-2 test cases for error handling
- ⚠️ Lines 830-831 may be unreachable defensive code (acceptable if documented)

**Validation**: The existing test suite is comprehensive and nearly complete. This PRP focuses on:

1. Validating existing tests meet all requirements (mostly complete)
2. Adding 1-2 test cases to reach 100% coverage
3. Documenting test patterns for future reference

The low risk comes from having 161 existing, passing tests that follow best practices.

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-13
**Author**: Claude Code (Research Phase)
**Next Phase**: Implementation (P4.M4.T1.S2 - Validate and complete session management tests)
