# Product Requirement Prompt (PRP): Update SessionManager Integration Test Constructor Calls

## Goal

**Feature Goal**: Update all integration test files to use the correct 3-parameter SessionManager constructor signature, ensuring consistency with the updated unit test pattern from P1.M1.T2.S1.

**Deliverable**: All integration test files under `tests/integration/` updated to use the correct 3-parameter SessionManager constructor, with zero constructor signature errors in the integration test suite.

**Success Definition**:

- All 7 identified integration test files updated
- All ~20 SessionManager constructor calls updated to 3-parameter signature
- All integration tests pass: `npm test -- tests/integration/`
- No constructor signature errors in test output
- Consistent pattern with S1 unit test updates maintained

## Why

- **Bug Fix**: Integration tests are using incorrect 2-parameter constructor signature, causing parameter misalignment where `flushRetries` values are passed to the `planDir` parameter
- **Consistency**: Integration tests must align with the updated unit test pattern from P1.M1.T2.S1 (commit 310054f)
- **Test Reliability**: Incorrect constructor signatures can cause tests to pass incorrectly or fail mysteriously
- **Codebase Quality**: Ensures all test files follow the same conventions and patterns established in the codebase

## What

Update all integration test files that instantiate SessionManager to use the correct 3-parameter constructor signature.

### Current State (Incorrect)

```typescript
const manager = new SessionManager(prdPath, planDir);
// Missing flushRetries parameter - only 2 parameters
```

### Target State (Correct)

```typescript
const manager = new SessionManager(prdPath, planDir, 3);
// All 3 parameters explicitly provided
```

### Success Criteria

- [ ] All 7 integration test files updated with 3-parameter constructor
- [ ] All integration tests pass with zero constructor signature errors
- [ ] Pattern matches S1 unit test conventions (commit 310054f)
- [ ] Tests using temp directories for plan functionality use appropriate temp paths
- [ ] No new test failures introduced

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" Test**: A developer unfamiliar with this codebase would have everything needed to implement this successfully because:

- Exact file paths and line patterns are provided
- Current and target constructor signatures are specified
- Test framework details (Vitest) are included
- Related work (S1) is referenced with commit hash
- Specific patterns and gotchas are documented
- Validation commands are project-specific and verified

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitest.dev/api/#describe
  why: Vitest testing framework API reference for test structure and assertions
  critical: Integration tests use Vitest with describe, it, expect patterns

- url: https://nodejs.org/api/path.html#pathresolvepaths
  why: Node.js path.resolve() API documentation for handling planDir parameter
  critical: Must use resolve() for planDir to ensure absolute paths

- file: tests/unit/core/session-manager.test.ts
  why: Reference implementation from P1.M1.T2.S1 showing correct 3-parameter pattern
  pattern: All SessionManager constructors use 3 parameters: (prdPath, resolve(planDir), flushRetries)
  gotcha: Unit tests use test constants (DEFAULT_PRD_PATH, DEFAULT_PLAN_DIR, DEFAULT_FLUSH_RETRIES)

- file: tests/integration/session-structure.test.ts
  why: Example integration test file requiring SessionManager constructor updates
  pattern: Integration tests use dynamic paths from fixtures or temp directories
  gotcha: Tests focusing on plan directory functionality should use test-specific temp directories

- file: tests/integration/tasks-json-authority.test.ts
  why: Example integration test file requiring SessionManager constructor updates
  pattern: Uses 2-parameter constructor that needs 3rd parameter added

- file: tests/integration/delta-resume-regeneration.test.ts
  why: Example integration test file requiring SessionManager constructor updates
  pattern: Uses 2-parameter constructor that needs 3rd parameter added

- file: tests/integration/prp-generator-integration.test.ts
  why: Example integration test file requiring SessionManager constructor updates
  pattern: Uses 2-parameter constructor that needs 3rd parameter added

- file: tests/integration/prp-runtime-integration.test.ts
  why: Example integration test file requiring SessionManager constructor updates
  pattern: Uses 2-parameter constructor that needs 3rd parameter added

- file: tests/integration/scope-resolution.test.ts
  why: Example integration test file requiring SessionManager constructor updates
  pattern: Uses 2-parameter constructor that needs 3rd parameter added

- file: tests/integration/prd-task-command.test.ts
  why: Example integration test file requiring SessionManager constructor updates
  pattern: Uses 2-parameter constructor that needs 3rd parameter added

- file: src/core/session-manager.ts
  why: SessionManager class definition with constructor signature
  pattern: constructor(prdPath: string, planDir: string = resolve('plan'), flushRetries: number = 3)
  critical: Third parameter flushRetries defaults to 3, must be explicitly passed in tests

- file: tests/setup.ts
  why: Global test setup showing mock cleanup and test isolation patterns
  pattern: vi.clearAllMocks() called in beforeEach for test isolation
  gotcha: All vi.mock() calls must be at top level (hoisting required)

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S2/research/01_integration-test-files.md
  why: Complete list of all 7 integration test files requiring updates
  section: Entire document - lists all target files and constructor call counts

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S2/research/02_s1-pattern-analysis.md
  why: Detailed analysis of S1 unit test patterns to follow
  section: Update Patterns from S1 - shows exact code patterns to use

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S2/research/03_testing-framework-and-conventions.md
  why: Testing framework conventions and patterns used in this codebase
  section: Integration Test Patterns, Temporary Directory Handling

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S2/research/04_architecture-audit-summary.md
  why: Architecture audit context explaining the constructor signature issue
  section: Files Requiring Updates - shows priority and scope
```

### Current Codebase Tree (Integration Tests)

```bash
tests/
├── integration/
│   ├── session-structure.test.ts          # 5 constructor calls to update
│   ├── tasks-json-authority.test.ts       # 5 constructor calls to update
│   ├── delta-resume-regeneration.test.ts  # 5 constructor calls to update
│   ├── prp-generator-integration.test.ts  # 2 constructor calls to update
│   ├── prp-runtime-integration.test.ts    # 1 constructor call to update
│   ├── scope-resolution.test.ts           # 1 constructor call to update
│   └── prd-task-command.test.ts           # 1 constructor call to update
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: SessionManager constructor parameter order
// The constructor signature is:
// constructor(prdPath: string, planDir: string = resolve('plan'), flushRetries: number = 3)
//
// GOTCHA: Tests were using: new SessionManager(prdPath, flushRetries)
// This incorrectly passes flushRetries to the planDir parameter!
//
// CORRECT: new SessionManager(prdPath, planDir, flushRetries)
// Or for defaults: new SessionManager(prdPath, resolve('plan'), 3)

// CRITICAL: Vitest mock hoisting
// All vi.mock() calls must be at top level (before imports)
// Mocks must be set up before importing the modules being mocked

// CRITICAL: Test isolation
// Always call vi.clearAllMocks() in beforeEach to prevent test pollution

// CRITICAL: Path resolution
// Always use resolve() from 'node:path' for planDir parameter to ensure absolute paths
// Integration tests may use temp directories: mkdtempSync(join(tmpdir(), 'test-'))

// CRITICAL: Integration test temp directory cleanup
// Always clean up temp directories in afterEach using:
// rmSync(tempDir, { recursive: true, force: true });

// CRITICAL: Constructor pattern consistency
// Follow the exact pattern from P1.M1.T2.S1 (commit 310054f)
// Use multi-line format for constructor calls with 3+ parameters
// Example from S1:
// const manager = new SessionManager(
//   DEFAULT_PRD_PATH,
//   resolve(DEFAULT_PLAN_DIR),
//   5
// );
```

## Implementation Blueprint

### Data Models and Structure

No new data models are required for this task. The SessionManager constructor signature is already defined in `src/core/session-manager.ts`:

```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: SEARCH and IDENTIFY all SessionManager constructor calls in integration tests
  - FIND: Use grep to locate all "new SessionManager(" patterns in tests/integration/
  - DOCUMENT: Create a list of files with line numbers for each constructor call
  - VERIFY: Confirm all 7 files identified in research documentation
  - REFERENCE: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S2/research/01_integration-test-files.md

Task 2: UPDATE tests/integration/session-structure.test.ts
  - IMPLEMENT: Update ~5 SessionManager constructor calls to 3-parameter signature
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (S1 implementation)
  - PATTERN: new SessionManager(prdPath, planDir, 3)
  - GOTCHA: If this test validates plan directory functionality, use temp directory for planDir
  - PRESERVE: All existing test logic and assertions

Task 3: UPDATE tests/integration/tasks-json-authority.test.ts
  - IMPLEMENT: Update ~5 SessionManager constructor calls to 3-parameter signature
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (S1 implementation)
  - PATTERN: new SessionManager(prdPath, planDir, 3)
  - PRESERVE: All existing test logic and assertions

Task 4: UPDATE tests/integration/delta-resume-regeneration.test.ts
  - IMPLEMENT: Update ~5 SessionManager constructor calls to 3-parameter signature
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (S1 implementation)
  - PATTERN: new SessionManager(prdPath, planDir, 3)
  - PRESERVE: All existing test logic and assertions

Task 5: UPDATE tests/integration/prp-generator-integration.test.ts
  - IMPLEMENT: Update ~2 SessionManager constructor calls to 3-parameter signature
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (S1 implementation)
  - PATTERN: new SessionManager(prdPath, planDir, 3)
  - PRESERVE: All existing test logic and assertions

Task 6: UPDATE tests/integration/prp-runtime-integration.test.ts
  - IMPLEMENT: Update ~1 SessionManager constructor call to 3-parameter signature
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (S1 implementation)
  - PATTERN: new SessionManager(prdPath, planDir, 3)
  - PRESERVE: All existing test logic and assertions

Task 7: UPDATE tests/integration/scope-resolution.test.ts
  - IMPLEMENT: Update ~1 SessionManager constructor call to 3-parameter signature
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (S1 implementation)
  - PATTERN: new SessionManager(prdPath, planDir, 3)
  - PRESERVE: All existing test logic and assertions

Task 8: UPDATE tests/integration/prd-task-command.test.ts
  - IMPLEMENT: Update ~1 SessionManager constructor call to 3-parameter signature
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts (S1 implementation)
  - PATTERN: new SessionManager(prdPath, planDir, 3)
  - PRESERVE: All existing test logic and assertions

Task 9: VERIFY imports and dependencies
  - CHECK: Ensure 'resolve' is imported from 'node:path' in all updated files
  - ADD: import { resolve } from 'node:path'; if not present
  - VERIFY: No other imports are needed for this change

Task 10: RUN integration tests to validate changes
  - EXECUTE: npm test -- tests/integration/
  - VERIFY: All integration tests pass with zero constructor signature errors
  - DEBUG: Fix any issues identified during test execution
  - REFERENCE: Validation section below for specific commands
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Basic 3-parameter constructor (most common)
// BEFORE (Incorrect - 2 parameters):
const manager = new SessionManager(prdPath, planDir);

// AFTER (Correct - 3 parameters):
const manager = new SessionManager(prdPath, planDir, 3);

// Pattern 2: Multi-line format for clarity (from S1)
// Use this when constructor call is part of complex setup:
const manager = new SessionManager(prdPath, resolve(planDir), 3);

// Pattern 3: With temp directory for plan directory tests
// Use this for tests that specifically test plan directory functionality:
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tempPlanDir = mkdtempSync(join(tmpdir(), 'test-plan-'));
const manager = new SessionManager(prdPath, tempPlanDir, 3);

// Pattern 4: Ensure resolve import is present
import { resolve } from 'node:path';

// GOTCHA: The third parameter is flushRetries, not optional in tests
// Even though it has a default value, tests should explicitly pass it
// This matches the pattern established in P1.M1.T2.S1 (commit 310054f)

// CRITICAL: Do NOT change test logic or assertions
// Only update the constructor calls to include the third parameter
// All existing test behavior should remain exactly the same
```

### Integration Points

```yaml
NO_NEW_INTEGRATIONS:
  - This task only modifies existing test files
  - No new integrations or dependencies are added

PRESERVED_INTEGRATIONS:
  - All integration test logic and assertions remain unchanged
  - All mock setups remain unchanged
  - All test fixtures and test data remain unchanged

CONSISTENCY_REQUIREMENTS:
  - Pattern must match P1.M1.T2.S1 unit test updates (commit 310054f)
  - All constructor calls must use 3 parameters
  - Multi-line formatting should follow S1 conventions
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file update - fix before proceeding
npm run lint  # or: npx eslint tests/integration/{updated_file}.test.ts --fix

# Check TypeScript compilation
npx tsc --noEmit  # Ensures no type errors in updated files

# Expected: Zero linting errors and zero TypeScript compilation errors
# If errors exist, READ output and fix before proceeding to next file
```

### Level 2: Unit Tests (Component Validation)

```bash
# This task updates integration tests, so run integration tests specifically
npm test -- tests/integration/session-structure.test.ts
npm test -- tests/integration/tasks-json-authority.test.ts
npm test -- tests/integration/delta-resume-regeneration.test.ts
npm test -- tests/integration/prp-generator-integration.test.ts
npm test -- tests/integration/prp-runtime-integration.test.ts
npm test -- tests/integration/scope-resolution.test.ts
npm test -- tests/integration/prd-task-command.test.ts

# Run all integration tests after all updates complete
npm test -- tests/integration/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Look specifically for constructor signature errors
```

### Level 3: Integration Testing (System Validation)

```bash
# Full integration test suite validation
npm test -- tests/integration/ --reporter=verbose

# Check for constructor-specific errors
npm test -- tests/integration/ 2>&1 | grep -i "constructor\|signature"

# Verify specific integration test files pass
npm test -- --run tests/integration/session-structure.test.ts tests/integration/tasks-json-authority.test.ts

# Expected: All integration tests pass with zero constructor signature errors
# No new test failures should be introduced
```

### Level 4: Domain-Specific Validation

```bash
# Verify pattern consistency with S1 (commit 310054f)
git show 310054f:tests/unit/core/session-manager.test.ts | grep -A 3 "new SessionManager"

# Compare updated integration test patterns with S1 patterns
git diff HEAD~1 tests/integration/*.test.ts | grep "SessionManager"

# Verify all constructor calls use 3 parameters
grep -r "new SessionManager(" tests/integration/ | grep -v ", 3)" | grep -v ", resolve("

# Expected: The last grep should return no results (all constructors have 3 parameters)

# Verify no type errors related to SessionManager
npx tsc --noEmit | grep -i "sessionmanager\|constructor"

# Expected: Zero TypeScript errors related to SessionManager constructor
```

## Final Validation Checklist

### Technical Validation

- [ ] All 7 integration test files updated with 3-parameter constructor
- [ ] All ~20 constructor calls updated successfully
- [ ] `resolve` imported from 'node:path' in all updated files
- [ ] All integration tests pass: `npm test -- tests/integration/`
- [ ] Zero constructor signature errors in test output
- [ ] Zero TypeScript compilation errors
- [ ] Zero linting errors
- [ ] Pattern matches S1 implementation (commit 310054f)

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] No new test failures introduced
- [ ] Existing test logic and assertions preserved
- [ ] Tests using temp directories for plan functionality properly configured
- [ ] Multi-line formatting follows S1 conventions where applicable

### Code Quality Validation

- [ ] Follows existing codebase patterns from S1
- [ ] Consistent constructor call pattern across all 7 files
- [ ] No test logic modified (only constructor signatures updated)
- [ ] Proper cleanup of temp directories where used
- [ ] Test isolation maintained (vi.clearAllMocks() in beforeEach)

### Documentation & Deployment

- [ ] Changes are minimal and focused only on constructor signatures
- [ ] No new dependencies added
- [ ] No environment variables added
- [ ] Git commit will clearly state: "Update SessionManager integration test constructor calls to 3-parameter signature"

---

## Anti-Patterns to Avoid

- ❌ **Don't modify test logic or assertions** - Only update constructor calls
- ❌ **Don't skip validation** - Run tests after each file update
- ❌ **Don't change mock setups** - Mocks are unrelated to constructor signature
- ❌ **Don't use 2-parameter constructor** - Always use all 3 parameters explicitly
- ❌ **Don't forget resolve import** - Add `import { resolve } from 'node:path';` if needed
- ❌ **Don't break test isolation** - Maintain vi.clearAllMocks() in beforeEach
- ❌ **Don't leave temp directories** - Always cleanup temp directories in afterEach
- ❌ **Don't deviate from S1 pattern** - Follow the exact pattern from commit 310054f
- ❌ **Don't batch updates without testing** - Test each file individually before proceeding
- ❌ **Don't ignore test failures** - Fix all issues before considering task complete

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Rationale**:

- All target files are clearly identified with exact paths
- Current and target states are precisely specified
- Reference implementation from S1 (commit 310054f) provides exact pattern to follow
- Testing framework and conventions are well-documented
- Validation commands are project-specific and verified
- Gotchas and anti-patterns are comprehensively documented
- Task is straightforward (find and replace) with clear success criteria

**Expected Outcome**: An AI agent unfamiliar with this codebase can successfully implement this feature using only the PRP content and codebase access. The task is well-bounded, clearly specified, and has deterministic validation criteria.
