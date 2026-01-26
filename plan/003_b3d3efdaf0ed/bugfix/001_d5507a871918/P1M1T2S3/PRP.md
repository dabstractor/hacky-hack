# Product Requirement Prompt (PRP): Update session-state-batching test constructor calls

---

## Goal

**Feature Goal**: Update SessionManager constructor calls in `session-state-batching.test.ts` to use the correct 3-parameter signature, ensuring the test suite properly validates state batching and flush behavior with correctly configured SessionManager instances.

**Deliverable**: Updated test file at `tests/unit/core/session-state-batching.test.ts` where all SessionManager instantiations use the correct 3-parameter constructor signature `(prdPath, planDir, flushRetries)`.

**Success Definition**:

- All SessionManager constructor calls include the `planDir` parameter (second position)
- The `flushRetries` parameter is properly configured for test scenarios
- All existing test scenarios (batching, flush retries, state persistence) remain functional
- Tests pass with `npm run test:run tests/unit/core/session-state-batching.test.ts`
- No TypeScript type errors related to constructor signature

---

## User Persona

**Target User**: Developer implementing bug fixes for the PRP Pipeline test suite

**Use Case**: A developer needs to update test file constructor calls to match the corrected SessionManager signature as part of Milestone 1.1 (Constructor Signature Fixes)

**User Journey**:

1. Developer reads this PRP to understand required changes
2. Developer follows implementation tasks to update constructor calls
3. Developer runs validation commands to verify changes
4. Developer commits the updated test file

**Pain Points Addressed**:

- Constructor signature mismatches causing test failures
- Missing `planDir` parameter causing type errors
- Tests not properly validating flush retry behavior
- Inconsistent constructor patterns across test suite

---

## Why

- **Critical Bug Fix**: SessionManager constructor signature was updated to include `planDir` as the second parameter, but `session-state-batching.test.ts` still uses the old 2-parameter signature
- **Test Coverage**: This test file specifically validates SessionManager state management and batching behavior, so correct constructor configuration (especially `flushRetries`) is essential for proper testing
- **Consistency**: All other SessionManager test files have been updated (P1.M1.T2.S1, P1.M1.T2.S2); this file needs alignment
- **Dependency**: This task (P1.M1.T2.S3) blocks P1.M1.T2.S4 (Verify TaskOrchestrator SessionManager usage)

---

## What

Update the `tests/unit/core/session-state-batching.test.ts` file to use the correct SessionManager constructor signature with all 3 required parameters.

### Current State (Incorrect)

```typescript
const manager = new SessionManager('/test/PRD.md', '/test/plan');
```

### Required State (Correct)

```typescript
const manager = new SessionManager('/test/PRD.md', '/test/plan', 3);
```

### Success Criteria

- [ ] `createMockSessionManager()` factory function updated to accept `flushRetries` parameter
- [ ] Line 215 constructor call updated to include `flushRetries` parameter
- [ ] All test scenarios maintain existing test coverage
- [ ] Tests pass with `npm run test:run tests/unit/core/session-state-batching.test.ts`
- [ ] No TypeScript type errors

---

## All Needed Context

### Context Completeness Check

✅ **Passes "No Prior Knowledge" test**: A developer unfamiliar with the codebase can implement this successfully using only this PRP, as it includes:

- Exact file paths and line numbers
- Complete constructor signature with parameter types and defaults
- Specific code examples of correct patterns to follow
- Test validation commands
- Common gotchas and solutions

### Documentation & References

```yaml
# MUST READ - Core implementation files
- url: file:///home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Contains the SessionManager constructor definition showing exact parameter order and types
  critical: |
    Constructor signature: constructor(prdPath: string, planDir: string = resolve('plan'), flushRetries: number = 3)
    Lines 190-194 show the complete constructor definition
    The flushRetries parameter controls retry behavior in flushUpdates() method (lines 740-882)

# MUST READ - Target test file to update
- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-state-batching.test.ts
  why: This is the file being updated - contains createMockSessionManager() factory and constructor calls
  pattern: |
    Line 215: Current 2-parameter constructor call (needs update)
    Line 208: createMockSessionManager() factory function (needs flushRetries parameter)
    Lines 1-956: Complete test suite showing all test scenarios and mock setup

# MUST READ - Reference pattern already updated
- file: /home/dustin/projects/hacky-hack/tests/unit/core/flush-retry.test.ts
  why: Shows the correct pattern for updating constructor calls with flushRetries parameterization
  pattern: |
    Line 193-206: createMockSessionManager(flushRetries: number = 3) factory function pattern
    Line 202-206: Correct 3-parameter constructor instantiation:
      const manager = new SessionManager('/test/PRD.md', '/test/plan', flushRetries);
  gotcha: |
    The flushRetries parameter should be passed through from the factory function
    Default value of 3 should be used if not specified

# MUST READ - SessionManager source for understanding flush behavior
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Flush retry behavior tested in this file is controlled by flushRetries parameter
  section: Lines 740-882 (flushUpdates method)
  critical: |
    flushRetries = 0: Try once and fail immediately
    flushRetries = 3 (default): Retry up to 3 times on transient errors
    Retryable errors: EBUSY, EAGAIN, EIO, ENFILE
    Non-retryable errors: ENOSPC, ENOENT, EACCES

# REFERENCE - Updated unit test pattern
- file: /home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts
  why: Shows updated unit test pattern with correct constructor signature
  pattern: All SessionManager instantiations use 3-parameter signature

# REFERENCE - Updated integration test pattern
- file: /home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts
  why: Shows integration test pattern with explicit parameter values
  pattern: new SessionManager(prdPath, planDir, 3)

# DOCUMENTATION - Constructor update research
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/research/vitest-constructor-update-patterns.md
  why: Comprehensive guide on updating constructor calls in Vitest tests
  section: Complete document for constructor update patterns

# DOCUMENTATION - Atomic write testing patterns
- docfile: /home/dustin/projects/hacky-hack/docs/research/testing-patterns-atomic-batch-flush.md
  why: Testing patterns for atomic write operations and batch flushing
  section: Sections 1-6 for retry, batching, and state testing patterns

# REFERENCE - Test constants pattern
- file: /home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts
  why: Shows test constants pattern used in codebase
  pattern: |
    const DEFAULT_MAX_SIZE = 3;
    const DEFAULT_NO_CACHE = false;
    const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
```

### Current Codebase Tree (Relevant Files)

```bash
tests/unit/core/
├── session-state-batching.test.ts    # TARGET FILE - needs update
├── flush-retry.test.ts                # REFERENCE - already updated with 3-param constructor
├── session-manager.test.ts            # REFERENCE - already updated
└── research-queue.test.ts             # REFERENCE - shows test constants pattern

src/core/
└── session-manager.ts                 # DEFINITION - constructor signature

plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/
├── P1M1T2S1/PRP.md                    # S1 PRP - unit test constructor updates
├── P1M1T2S2/PRP.md                    # S2 PRP - integration test constructor updates
└── P1M1T2S3/                          # THIS SUBTASK
    ├── PRP.md                         # THIS FILE
    └── research/                     # Research findings
```

### Desired Codebase Tree (After Implementation)

```bash
tests/unit/core/
└── session-state-batching.test.ts    # UPDATED - all constructor calls use 3-parameter signature
```

### Known Gotchas & Library Quirks

```typescript
// GOTCHA 1: Parameter order is (prdPath, planDir, flushRetries)
// WRONG: new SessionManager(prdPath, flushRetries, planDir)
// RIGHT: new SessionManager(prdPath, planDir, flushRetries)

// GOTCHA 2: planDir must be an absolute path
// The constructor uses resolve() internally, but tests should pass explicit paths
// Use: '/test/plan' or resolve('plan') for consistency

// GOTCHA 3: flushRetries controls retry behavior in flushUpdates()
// If testing retry scenarios, parameterize this value
// If not testing retries, use default value of 3

// GOTCHA 4: The createMockSessionManager() factory function MUST be updated
// It currently hardcodes the 2-parameter call on line 215
// Update to: async function createMockSessionManager(flushRetries: number = 3)

// GOTCHA 5: Test mock setup must remain intact
// The complex mock setup (lines 209-355) must not be disturbed
// Only update the constructor call itself

// GOTCHA 6: Vitest module mocking
// vi.mock() calls at top of file must remain unchanged
// Mock implementations are type-dependent on constructor signature

// CRITICAL: SessionManager validates PRD path SYNCHRONOUSLY in constructor
// statSync is called before any async initialization
// Test must mock statSync BEFORE creating SessionManager (line 211)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models are created in this task. The update involves modifying existing test code to use the correct SessionManager constructor signature.

**Existing Models Referenced**:

- `SessionManager` class from `src/core/session-manager.ts`
- `Backlog` type from `src/core/models.ts` (used in test data)
- Mock types from `vitest`

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: UPDATE createMockSessionManager() factory function signature
  - LOCATION: tests/unit/core/session-state-batching.test.ts, line 208
  - IMPLEMENT: Add flushRetries parameter with default value of 3
  - CURRENT: async function createMockSessionManager(): Promise<SessionManager>
  - UPDATED: async function createMockSessionManager(flushRetries: number = 3): Promise<SessionManager>
  - FOLLOW pattern: tests/unit/core/flush-retry.test.ts, line 193
  - REASON: Factory needs to accept flushRetries to pass to constructor

Task 2: UPDATE constructor call within createMockSessionManager()
  - LOCATION: tests/unit/core/session-state-batching.test.ts, line 215
  - CURRENT: const manager = new SessionManager('/test/PRD.md', '/test/plan');
  - UPDATED: const manager = new SessionManager('/test/PRD.md', '/test/plan', flushRetries);
  - FOLLOW pattern: tests/unit/core/flush-retry.test.ts, line 202-206
  - CRITICAL: Pass flushRetries parameter from factory function to constructor
  - MAINTAIN: All existing mock setup (lines 209-214) must remain unchanged

Task 3: VERIFY no other constructor calls in file need updating
  - SEARCH: "new SessionManager" throughout the file
  - EXPECT: Only one constructor call exists (line 215)
  - IF FOUND: Update any additional instances using same pattern
  - VALIDATE: Grep shows only the single instance in factory function

Task 4: RUN tests to validate changes
  - COMMAND: npm run test:run tests/unit/core/session-state-batching.test.ts
  - EXPECT: All tests pass with updated constructor signature
  - VERIFY: No TypeScript errors: npm run typecheck
  - VERIFY: No linting errors: npm run lint
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Factory Function with Parameterized flushRetries
// ============================================================================
// Location: tests/unit/core/session-state-batching.test.ts, line 208

// BEFORE (INCORRECT):
async function createMockSessionManager(): Promise<SessionManager> {
  mockStatSync.mockReturnValue({ isFile: () => true } as any);
  const manager = new SessionManager('/test/PRD.md', '/test/plan');
  // ... rest of setup
}

// AFTER (CORRECT):
async function createMockSessionManager(
  flushRetries: number = 3
): Promise<SessionManager> {
  mockStatSync.mockReturnValue({ isFile: () => true } as any);
  const manager = new SessionManager(
    '/test/PRD.md',
    '/test/plan',
    flushRetries
  );
  // ... rest of setup (UNCHANGED)
}

// ============================================================================
// PATTERN 2: Default Value for flushRetries
// ============================================================================
// Use default value of 3 to match production behavior
// This ensures tests that don't specify flushRetries use standard retry behavior

// ============================================================================
// PATTERN 3: Preserve All Mock Setup
// ============================================================================
// CRITICAL: Lines 209-355 contain complex mock setup that MUST remain intact
// - Mock statSync for PRD validation (lines 211-213)
// - Mock readFile for PRD content (lines 218-228)
// - Mock readdir for session discovery (lines 231-234)
// - Mock hashPRD, createSessionDirectory (lines 237-246)
// - Mock writeTasksJSON with atomic write simulation (lines 241-255)
// - Mock updateItemStatusUtil and findItem (lines 259-355)
// DO NOT modify any mock setup, only the constructor call

// ============================================================================
// GOTCHA: Vitest Mock Type Safety
// ============================================================================
// When updating constructor calls, vi.mocked() provides type safety
// The mock implementations (vi.mocked(writeFile), etc.) remain compatible
// No changes needed to mock casting or setup

// ============================================================================
// PATTERN: Test Constants (for future reference)
// ============================================================================
// Consider adding test constants at top of file for consistency:
// const DEFAULT_PRD_PATH = '/test/PRD.md';
// const DEFAULT_PLAN_DIR = '/test/plan';
// const DEFAULT_FLUSH_RETRIES = 3;
// This pattern is used in other test files (research-queue.test.ts)
```

### Integration Points

```yaml
NO_NEW_INTEGRATIONS:
  - This task modifies existing test code only
  - No new files created
  - No changes to production code (src/)
  - No changes to other test files
  - No configuration changes

EXISTING_INTEGRATIONS_PRESERVED:
  - Vitest test framework (vi.mock, vi.mocked, beforeEach, etc.)
  - SessionManager class (src/core/session-manager.ts)
  - Mock modules (node:fs/promises, node:fs, node:crypto)
  - Test data factories (_createMockBacklog, etc.)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after making changes to catch syntax errors immediately
npm run typecheck                    # TypeScript type checking
npm run lint                        # ESLint for code style
npm run format:check                # Prettier formatting check

# Expected Output: Zero errors
# If errors exist, READ the error message and fix before proceeding

# Common Errors and Fixes:
# Error: "Expected 3 arguments, but got 2"
# Fix: Add flushRetries parameter to constructor call
#
# Error: "Cannot find name 'flushRetries'"
# Fix: Add flushRetries parameter to createMockSessionManager() function signature
#
# Error: "Type 'number' is not assignable to type 'undefined'"
# Fix: Ensure parameter order is (prdPath, planDir, flushRetries)
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific file being updated
npm run test:run tests/unit/core/session-state-batching.test.ts

# Expected Output: All tests pass (50+ test cases)
# Test file runs successfully with updated constructor signature

# Key Test Scenarios Validated:
# - "should batch multiple status updates in memory"
# - "should flush all updates in single atomic operation"
# - "should create temp file before final write"
# - "should use rename to complete atomic write"
# - "should preserve dirty state on flush failure for retry"
# - "should handle retry with different flushRetries values"
# - All edge cases and batching workflow tests

# If Tests Fail:
# 1. Check that flushRetries parameter is correctly passed
# 2. Verify mock setup is unchanged
# 3. Ensure constructor parameter order is correct
# 4. Check for typos in parameter names

# Coverage Validation (optional but recommended)
npm run test:coverage tests/unit/core/session-state-batching.test.ts
# Expected: 100% coverage for tested scenarios (maintain existing coverage)
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full unit test suite to ensure no regressions
npm run test:run tests/unit/

# Expected Output: All unit tests pass
# No test failures in other SessionManager-related tests

# Run integration tests to verify SessionManager integration
npm run test:run tests/integration/core/session-manager.test.ts

# Expected Output: Integration tests pass
# SessionManager constructor signature consistent across tests

# Specific Integration Validation:
# Tests should validate that:
# - SessionManager initializes correctly with 3 parameters
# - Flush retry behavior works as expected
# - State batching and flushing operate correctly
```

### Level 4: Creative & Domain-Specific Validation

```bash
# ============================================================================
// DOMAIN SPECIFIC: Flush Retry Behavior Validation
// ============================================================================
// The session-state-batching.test.ts file specifically tests flush behavior
// With the flushRetries parameter now configurable, validate:

// 1. Test default flushRetries behavior (value = 3)
// Create manager with default: await createMockSessionManager()
// Verify: Retry logic attempts up to 3 times on transient errors

// 2. Test custom flushRetries behavior (e.g., value = 0, 5, 10)
// Create manager with custom: await createMockSessionManager(0)
// Verify: Custom retry count is respected

// 3. Test retry delay exponential backoff
// With flushRetries = 5, verify delays: ~100ms, ~200ms, ~400ms, ~800ms, ~1600ms (capped)

// 4. Test retryable vs non-retryable errors
// Retryable: EBUSY, EAGAIN, EIO, ENFILE (should retry)
// Non-retryable: ENOSPC, ENOENT, EACCES (should fail fast)

// ============================================================================
// MANUAL VALIDATION: Code Review Checklist
// ============================================================================
# Review the updated file for:
□ Line 208: createMockSessionManager() has flushRetries parameter with default = 3
□ Line 215: Constructor call passes flushRetries as third parameter
□ All mock setup (lines 209-355) remains unchanged
□ No other "new SessionManager" calls in file need updating
□ Test scenarios still cover batching, flush retries, and state persistence
□ Code follows existing patterns (matches flush-retry.test.ts)

# ============================================================================
// GIT VALIDATION: Verify Changes
// ============================================================================
git diff tests/unit/core/session-state-batching.test.ts

# Expected changes:
# - Line 208: Function signature updated to include flushRetries parameter
# - Line 215: Constructor call updated to pass flushRetries
# No other lines should be modified

# Verify diff shows only the two intended changes
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:run tests/unit/core/session-state-batching.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`
- [ ] Git diff shows only the two intended changes (function signature + constructor call)

### Feature Validation

- [ ] `createMockSessionManager()` factory accepts `flushRetries` parameter with default value of 3
- [ ] Constructor call on line 215 uses 3-parameter signature: `(prdPath, planDir, flushRetries)`
- [ ] All existing test scenarios remain functional (batching, flush, state persistence)
- [ ] Tests validate flush retry behavior with properly configured SessionManager
- [ ] No regressions in related test files (session-manager.test.ts, flush-retry.test.ts)

### Code Quality Validation

- [ ] Follows existing codebase patterns (matches flush-retry.test.ts pattern)
- [ ] Mock setup and implementation remains intact (lines 209-355 unchanged)
- [ ] No new dependencies or imports added
- [ ] Test coverage maintained (all existing test cases still pass)
- [ ] Code is self-documenting with clear parameter names

### Documentation & Deployment

- [ ] Changes are minimal and focused (only constructor signature update)
- [ ] No breaking changes to test interfaces (default parameter maintains backward compatibility)
- [ ] Git commit message clearly describes the change: "Update session-state-batching.test.ts to use 3-parameter SessionManager constructor"

---

## Anti-Patterns to Avoid

- ❌ **Don't modify mock setup**: The complex mock setup (lines 209-355) is critical for test isolation
- ❌ **Don't change parameter order**: Must be `(prdPath, planDir, flushRetries)` - not `(prdPath, flushRetries, planDir)`
- ❌ **Don't skip validation because "it's simple"**: Run all validation levels to catch issues early
- ❌ **Don't use hardcoded flushRetries value without default**: Use `flushRetries: number = 3` for flexibility
- ❌ **Don't modify other test files**: This task only updates session-state-batching.test.ts
- ❌ **Don't break existing test scenarios**: All 50+ test cases must continue to pass
- ❌ **Don't add unnecessary complexity**: Keep changes minimal - only update the constructor call
- ❌ **Don't forget to update function signature**: Both the factory function AND constructor call need updating

---

## Appendix: Related Work

### Completed Subtasks (Reference Patterns)

**P1.M1.T2.S1** - Update SessionManager unit test constructor calls (Complete)

- Updated `tests/unit/core/session-manager.test.ts`
- Pattern: Added test constants, updated all constructor calls to 3-parameter signature

**P1.M1.T2.S2** - Update SessionManager integration test constructor calls (Complete)

- Updated all integration test files under `tests/integration/core/`
- Pattern: Explicit parameter values: `new SessionManager(prdPath, planDir, 3)`

**P1.M1.T1.S2** - Update ResearchQueue unit tests for full constructor signature (Complete)

- Updated `tests/unit/core/research-queue.test.ts`
- Pattern: Added test constants (DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS)

### Upcoming Subtasks (Dependencies)

**P1.M1.T2.S4** - Verify TaskOrchestrator SessionManager usage (Pending)

- Depends on this subtask (P1.M1.T2.S3) completing first
- Will verify TaskOrchestrator uses correct 3-parameter signature

---

## Confidence Score

**One-Pass Implementation Success Likelihood**: **9/10**

**Rationale**:

- Clear file path and line number targets
- Complete code examples showing before/after states
- Reference implementations available in updated test files
- Comprehensive validation commands with expected outputs
- Detailed anti-patterns section prevents common mistakes
- Minimal, focused change reduces complexity

**Risk Mitigation**:

- Only two lines need modification (function signature + constructor call)
- Mock setup is isolated and must remain unchanged
- All test scenarios remain functional (no behavior changes)
- Default parameter maintains backward compatibility

---

## Additional Resources

### Research Documentation

- `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/research/vitest-constructor-update-patterns.md` - Comprehensive constructor update guide
- `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/research/constructor-update-quick-reference.md` - Quick reference for this task
- `docs/research/testing-patterns-atomic-batch-flush.md` - Atomic write and batch flush testing patterns

### External Documentation URLs

- Vitest Documentation: https://vitest.dev/guide/
- Vitest Mocking API: https://vitest.dev/api/#vi-mock
- Vitest Fake Timers: https://vitest.dev/api/#vi-usefaketimers
- Node.js fs/promises: https://nodejs.org/api/fs.html#fspromises
