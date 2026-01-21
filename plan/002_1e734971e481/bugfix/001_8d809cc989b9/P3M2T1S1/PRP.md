# PRP: Update Test Fixture with Valid context_scope - P3.M2.T1.S1

## Goal

**Feature Goal**: Fix the failing test 'should handle deep hierarchy in backlog' by updating the test fixture data to use the valid CONTRACT DEFINITION format for the `context_scope` field.

**Deliverable**: Modified test file at `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts` where the `createTestSubtask()` factory function returns subtasks with valid `context_scope` format matching the Zod schema requirements.

**Success Definition**:

- Test 'should handle deep hierarchy in backlog' passes
- `context_scope` field in test fixture matches the CONTRACT DEFINITION format
- Zod validation in `writeTasksJSON()` and `readTasksJSON()` succeeds
- No other tests are broken by this change

## User Persona

**Target User**: Developer implementing bug fixes for Phase P3 (Test Alignment) who needs to fix test fixture data to comply with Zod schema validation requirements.

**Use Case**: Test 'should handle deep hierarchy in backlog' fails because the `createTestSubtask()` factory function returns subtasks with `context_scope: 'Test scope'` which does not match the Zod schema validation format.

**User Journey**:

1. Developer runs tests and discovers 'should handle deep hierarchy in backlog' is failing
2. Developer investigates and finds Zod validation error for `context_scope` field
3. Developer consults this PRP to understand the required format
4. Developer updates the `createTestSubtask()` function with valid `context_scope`
5. Developer runs test to verify it passes
6. Developer commits changes with reference to this PRP

**Pain Points Addressed**:

- **Uncertainty about correct format**: PRP provides exact CONTRACT DEFINITION pattern to follow
- **Risk of breaking other tests**: PRP identifies all tests using `createTestSubtask()` for impact analysis
- **Need to understand Zod validation**: PRP provides complete schema requirements
- **Ensuring consistency across test fixtures**: PRP references other valid examples in codebase

## Why

- **Business Value**: One failing test blocks confidence in the session utils functionality. Fixing this test restores complete test coverage for session file operations.
- **Integration**: This fix resolves PRD Issue 5 - test fixture data validation. The Zod schema validation is working correctly; the test data needs to match the schema.
- **Problem Solved**: Aligns test fixture data with the CONTRACT DEFINITION format required by the `ContextScopeSchema`, ensuring Zod validation succeeds during `writeTasksJSON()` and `readTasksJSON()` operations.

## What

Update the `createTestSubtask()` factory function in the session-utils test file to return subtasks with a valid `context_scope` field that matches the Zod schema requirements (CONTRACT DEFINITION format).

### Success Criteria

- [ ] `createTestSubtask()` function returns `context_scope` with valid CONTRACT DEFINITION format
- [ ] Test 'should handle deep hierarchy in backlog' passes
- [ ] All other tests using `createTestSubtask()` still pass
- [ ] No new Zod validation errors in test output

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

1. Exact file location and line number to modify
2. Complete CONTRACT DEFINITION format specification
3. Zod schema validation requirements with exact regex patterns
4. Test file path and test name to verify fix
5. Factory function pattern to follow
6. Other valid examples from codebase for reference

### Documentation & References

```yaml
# PRIMARY: Test file with the failing test and invalid fixture
- file: tests/unit/core/session-utils.test.ts
  why: Contains the createTestSubtask() factory function that needs updating
  pattern: Lines 63-77 - Factory function definition
  pattern: Line 75-76 - Invalid context_scope: 'Test scope' (BEFORE) / Valid format (AFTER fix)
  pattern: Lines 995-1017 - Failing test 'should handle deep hierarchy in backlog'
  gotcha: The fix was already applied in commit 178ee01 - this PRP documents the change
  code: |
    # BEFORE (invalid - causes Zod validation failure):
    const createTestSubtask = (
      id: string,
      title: string,
      status: Status,
      dependencies: string[] = []
    ) => ({
      id,
      type: 'Subtask' as const,
      title,
      status,
      story_points: 2,
      dependencies,
      context_scope: 'Test scope',  # INVALID - missing CONTRACT DEFINITION prefix
    });

    # AFTER (valid - passes Zod validation):
    const createTestSubtask = (
      id: string,
      title: string,
      status: Status,
      dependencies: string[] = []
    ) => ({
      id,
      type: 'Subtask' as const,
      title,
      status,
      story_points: 2,
      dependencies,
      context_scope:
        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test research findings.\n2. INPUT: Test input data.\n3. LOGIC: Test implementation logic.\n4. OUTPUT: Test output for consumption.',  # VALID
    });

# PRIMARY: Zod schema that validates context_scope
- file: src/core/models.ts
  why: Defines the exact validation rules for context_scope format
  pattern: Lines 68-111 - ContextScopeSchema definition
  pattern: Line 73 - Required prefix: 'CONTRACT DEFINITION:\n'
  pattern: Lines 86-91 - Required sections array with regex patterns
  pattern: Lines 95-110 - Validation loop checking all sections in order
  gotcha: Validation is case-sensitive and order-sensitive
  code: |
    # Zod Schema validation requirements (lines 68-111):
    export const ContextScopeSchema: z.ZodType<string> = z
      .string()
      .min(1, 'Context scope is required')
      .superRefine((value, ctx) => {
        // Check for CONTRACT DEFINITION prefix
        const prefix = 'CONTRACT DEFINITION:\n';
        if (!value.startsWith(prefix)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'context_scope must start with "CONTRACT DEFINITION:" followed by a newline',
          });
          return;
        }

        // Check for all 4 numbered sections in order
        const requiredSections = [
          { num: 1, name: 'RESEARCH NOTE', pattern: /1\.\s*RESEARCH\sNOTE:/m },
          { num: 2, name: 'INPUT', pattern: /2\.\s*INPUT:/m },
          { num: 3, name: 'LOGIC', pattern: /3\.\s*LOGIC:/m },
          { num: 4, name: 'OUTPUT', pattern: /4\.\s*OUTPUT:/m },
        ];
        # ... validation continues
      });

# REFERENCE: System context documentation
- docfile: plan/002_1e734971e481/architecture/system_context.md
  why: Explains the purpose and structure of context_scope field
  section: "Context Scope Validation Requirements"
  note: States "Validation is working correctly, test data is wrong"

# REFERENCE: Valid context_scope examples from other test files
- file: tests/integration/core/task-orchestrator.test.ts
  why: Shows working examples of context_scope format in integration tests
  pattern: Lines 81, 90, 99, 126, 162 - Valid context_scope usage

- file: tests/fixtures/simple-prd.ts
  why: Contains PRD fixture data with proper context_scope definitions
  pattern: Complete PRD with context_scope examples

# REFERENCE: Context scope usage in prompts
- file: src/agents/prompts.ts
  why: Explains the purpose of each section (RESEARCH NOTE, INPUT, LOGIC, OUTPUT)
  pattern: Architect Agent prompt section on context_scope requirements
  critical: Understanding what each section should contain

# INPUT: Work item definition from tasks.json
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json
  why: Contains the original work item description for P3.M2.T1.S1
  section: Lines 372-390 - P3.M2.T1 subtask with context_scope requirement

# EXTERNAL: Zod validation documentation
- url: https://zod.dev/?id=superrefine
  why: Understanding how superRefine works for custom validation
  section: "superRefine" - Custom validation logic with context

# EXTERNAL: TypeScript template literal types
- url: https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
  why: Understanding newline characters (\n) in template literals
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   └── core/
│       ├── models.ts                 # Zod schema definition (ContextScopeSchema at lines 68-111)
│       └── session-utils.ts          # Uses SubtaskSchema with context_scope validation
├── tests/
│   └── unit/
│       └── core/
│           └── session-utils.test.ts # TEST FILE: Update createTestSubtask() at lines 63-77
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        ├── P3M2T1S1/
        │   ├── PRP.md                 # This document
        │   └── research/              # Research notes for this PRP
        └── architecture/
            └── system_context.md      # Context scope validation documentation
```

### Desired Codebase Tree (After Implementation)

```bash
# No new files - only modification to existing test file
# tests/unit/core/session-utils.test.ts will have updated createTestSubtask() function
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Zod schema validation is case-sensitive
// 'CONTRACT DEFINITION:' must be uppercase
// 'research note:' would FAIL validation

// CRITICAL: Newline character is required after prefix
// WRONG: 'CONTRACT DEFINITION:1. RESEARCH NOTE: ...'  (no newline)
// RIGHT: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: ...'  (has newline)

// CRITICAL: All 4 sections must be present in exact order
// WRONG: Skipping section 3
// RIGHT: 1. RESEARCH NOTE, 2. INPUT, 3. LOGIC, 4. OUTPUT

// CRITICAL: Section headers must match exactly (case-sensitive)
// WRONG: '1. research note:', '2. Input:', '3. logic:', '4. output:'
// RIGHT: '1. RESEARCH NOTE:', '2. INPUT:', '3. LOGIC:', '4. OUTPUT:'

// GOTCHA: Template literal strings in TypeScript use \n for newline
// In single-line strings: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: ...'
// In template literals: `CONTRACT DEFINITION:\n1. RESEARCH NOTE: ...`

// GOTCHA: The createTestSubtask() function is used by MULTIPLE tests
// Update affects ALL tests that call this factory function
// Tests using createTestSubtask(): should handle deep hierarchy, should handle large backlog, etc.

// CRITICAL: Session utils tests use Zod validation in writeTasksJSON() and readTasksJSON()
// Invalid context_scope causes these operations to throw SessionFileError
// Error message: "Missing or incorrect section: ..." or "context_scope must start with ..."

// GOTCHA: Fix was already applied in commit 178ee01
// This PRP documents the change for reference
// Current code already has the valid format

// CRITICAL: Don't modify the SubtaskSchema or ContextScopeSchema
// Schema validation is working correctly
// Only test fixture data needs updating
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is a test fixture data update. The existing schema defines the required format:

```typescript
// Required context_scope format (from src/core/models.ts lines 68-111):
const validContextScope =
  'CONTRACT DEFINITION:\n' +
  '1. RESEARCH NOTE: [Research findings from architecture/]\n' +
  '2. INPUT: [Data structures from dependencies]\n' +
  '3. LOGIC: [Implementation logic and approach]\n' +
  '4. OUTPUT: [Result interface for next subtask]';
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: LOCATE the invalid context_scope in test fixture
  - FILE: tests/unit/core/session-utils.test.ts
  - LINES: 63-77
  - FIND: createTestSubtask() factory function
  - IDENTIFY: Line 75 has context_scope: 'Test scope' (invalid format)
  - VERIFY: This is the only place context_scope is set in this factory
  - OUTPUT: Confirmed location of invalid data

Task 2: UNDERSTAND the Zod schema requirements
  - FILE: src/core/models.ts
  - LINES: 68-111
  - READ: ContextScopeSchema definition
  - NOTE: Required prefix is 'CONTRACT DEFINITION:\n' (line 73)
  - NOTE: Required sections are 1. RESEARCH NOTE, 2. INPUT, 3. LOGIC, 4. OUTPUT (lines 86-91)
  - NOTE: Sections must be in order (validation loop at lines 95-110)
  - OUTPUT: Understanding of validation requirements

Task 3: UPDATE createTestSubtask() with valid context_scope
  - FILE: tests/unit/core/session-utils.test.ts
  - LINES: 75-76
  - REPLACE: context_scope: 'Test scope'
  - WITH: context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test research findings.\n2. INPUT: Test input data.\n3. LOGIC: Test implementation logic.\n4. OUTPUT: Test output for consumption.'
  - FORMAT: Use template literal or concatenated string with \n for newlines
  - PRESERVE: All other factory function logic (id, type, title, status, story_points, dependencies)
  - OUTPUT: Updated factory function returning valid context_scope

Task 4: VERIFY the fix by running the failing test
  - COMMAND: npm run test:run -- tests/unit/core/session-utils.test.ts -t "should handle deep hierarchy in backlog"
  - EXPECTED: Test passes (green checkmark)
  - VERIFY: No Zod validation errors in output
  - VERIFY: Deep hierarchy is preserved (assertion at line 1014-1016)
  - OUTPUT: Test passing, confirming fix works

Task 5: VERIFY no other tests are broken
  - COMMAND: npm run test:run -- tests/unit/core/session-utils.test.ts
  - EXPECTED: All 64 tests pass
  - CHECK: Tests using createTestSubtask() still work correctly
  - VERIFY: No regression in session utils functionality
  - OUTPUT: Full test suite passing

Task 6: DOCUMENT the change
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M2T1S1/research/
  - ACTION: Save research notes on Zod schema and validation requirements
  - ACTION: Document any deviations from PRP (none expected)
  - OUTPUT: Complete research directory for reference
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Valid context_scope format
// ============================================================================

// The context_scope field must match this exact pattern:
const validContextScope =
  'CONTRACT DEFINITION:\n' +  // Line 1: Required prefix (case-sensitive, newline required)
  '1. RESEARCH NOTE: [Findings from architecture/ regarding this feature]\n' +
  '2. INPUT: [Specific data structure/variable] from [Dependency ID]\n' +
  '3. LOGIC: [Implementation approach: mock X, call Y, validate Z]\n' +
  '4. OUTPUT: [Result object/interface] for consumption by [Next Subtask ID]';

// ============================================================================
// BEFORE/COMPARISON: Invalid format causing test failure
// ============================================================================

// BEFORE (invalid - fails Zod validation):
context_scope: 'Test scope'

// Error message:
// "context_scope must start with 'CONTRACT DEFINITION:' followed by a newline"

// ============================================================================
// AFTER/SOLUTION: Valid format passing Zod validation
// ============================================================================

// AFTER (valid - passes Zod validation):
context_scope:
  'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test research findings.\n2. INPUT: Test input data.\n3. LOGIC: Test implementation logic.\n4. OUTPUT: Test output for consumption.'

// ============================================================================
// CRITICAL: Section format requirements
// ============================================================================

// Each section must follow this pattern:
// <number>. <SECTION_NAME>: <content>

// Section 1: RESEARCH NOTE
// - Purpose: Document research findings from architecture/ directory
// - Format: "1. RESEARCH NOTE: [Findings]"

// Section 2: INPUT
// - Purpose: Specify what data/interfaces are available from dependencies
// - Format: "2. INPUT: [Data structure] from [Dependency ID]"
// - Example: "2. INPUT: Output from S1" (when dependent on previous subtask)

// Section 3: LOGIC
// - Purpose: Describe implementation logic and mocking strategy
// - Format: "3. LOGIC: [Implementation approach]"
// - Example: "3. LOGIC: Implement feature X, mock service Y for isolation"

// Section 4: OUTPUT
// - Purpose: Define what this subtask produces for next subtask
// - Format: "4. OUTPUT: [Result] for consumption by [Next Subtask ID]"
// - Example: "4. OUTPUT: Return type T for consumption by S2"

// ============================================================================
// GOTCHA: String formatting variations
// ============================================================================

// Option 1: Single-line string with \n escape sequences
context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: Data\n3. LOGIC: Code\n4. OUTPUT: Result'

// Option 2: Template literal with actual newlines
context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test
2. INPUT: Data
3. LOGIC: Code
4. OUTPUT: Result`

// Option 3: Concatenated strings (for readability)
context_scope:
  'CONTRACT DEFINITION:\n' +
  '1. RESEARCH NOTE: Test\n' +
  '2. INPUT: Data\n' +
  '3. LOGIC: Code\n' +
  '4. OUTPUT: Result'

// All three options are VALID - choose based on readability

// ============================================================================
// CRITICAL: Factory function impact analysis
// ============================================================================

// The createTestSubtask() function is used by multiple tests:
// - should handle deep hierarchy in backlog (line 995-1017)
// - should handle large backlog with multiple phases (line 976-993)
// - should handle empty backlog (line 960-974)
// - Integration scenarios that create subtasks

// Updating the factory function affects ALL these tests
// This is CORRECT behavior - all tests should use valid data

// ============================================================================
// VALIDATION: How to verify the fix works
// ============================================================================

// Run specific test:
npm run test:run -- tests/unit/core/session-utils.test.ts -t "should handle deep hierarchy in backlog"

// Expected output:
// ✓ tests/unit/core/session-utils.test.ts (64 tests | 63 skipped) Xms
// Test Files  1 passed (1)
//      Tests  1 passed | 63 skipped

// Run full test suite:
npm run test:run -- tests/unit/core/session-utils.test.ts

// Expected: All 64 tests pass, no Zod validation errors

// ============================================================================
// REGRESSION CHECK: What could break
// ============================================================================

// Potential issues to watch for:
// 1. Tests that explicitly check for 'Test scope' value (unlikely)
// 2. Tests that parse context_scope content (should handle new format)
// 3. Serializing/deserializing through Zod schema (should work better now)

// If tests fail after this change:
// - Check if test explicitly expects 'Test scope' string
// - Check if test parses context_scope and assumes simple format
// - Update test logic to handle CONTRACT DEFINITION format
```

### Integration Points

```yaml
NO_CHANGES_TO:
  - src/core/models.ts (Zod schema is correct)
  - src/core/session-utils.ts (implementation is correct)
  - Any other test files

MODIFICATIONS_TO:
  - file: tests/unit/core/session-utils.test.ts
    action: Update createTestSubtask() factory function
    lines: 75-76
    change: Replace 'Test scope' with valid CONTRACT DEFINITION format

VALIDATION_POINTS:
  - test: tests/unit/core/session-utils.test.ts -t "should handle deep hierarchy in backlog"
    purpose: Verify fix resolves the failing test
    expected: Test passes with green checkmark

  - test: tests/unit/core/session-utils.test.ts
    purpose: Verify no regression in other tests
    expected: All 64 tests pass

DEPENDENCIES:
  - task: P3.M1 (Fix Task Orchestrator Logging Tests)
    status: Implementing in parallel
    contract: Different test file, no overlap
    evidence: P3.M1 modifies task-orchestrator.test.ts, this PRP modifies session-utils.test.ts

  - task: P3.M3 (Fix Retry Utility Jitter Calculation)
    status: Planned
    contract: Independent bug fix, different code area
    reason: No dependency on session utils tests

PRESERVE:
  - All factory function logic (id, type, title, status, story_points, dependencies)
  - All test structure and describe blocks
  - All test assertions and expectations
  - All mock setup and teardown code
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after updating the factory function - fix before proceeding
npm run test:run -- tests/unit/core/session-utils.test.ts -t "should handle deep hierarchy in backlog" 2>&1 | head -30

# Check for TypeScript errors
npx tsc --noEmit tests/unit/core/session-utils.test.ts

# Check for linting errors
npm run lint -- tests/unit/core/session-utils.test.ts

# Expected: Zero syntax errors. If errors exist, READ output and fix before proceeding.
# Most likely error: Missing quote, unterminated string, incorrect escape sequence
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific failing test
npm run test:run -- tests/unit/core/session-utils.test.ts -t "should handle deep hierarchy in backlog"

# Expected output:
# ✓ tests/unit/core/session-utils.test.ts (64 tests | 63 skipped) Xms
# Test Files  1 passed (1)
#      Tests  1 passed | 63 skipped

# Test all session-utils tests to ensure no regression
npm run test:run -- tests/unit/core/session-utils.test.ts

# Expected: All 64 tests pass
# If failing, debug root cause: check if new format breaks any test logic
```

### Level 3: Regression Testing (System Validation)

```bash
# Ensure no other tests broke
npm run test:run -- tests/unit/core/

# Ensure Zod validation works in other files
npm run test:run -- tests/unit/core/models.test.ts -t "context_scope"

# Full unit test suite
npm run test:run -- tests/unit/

# Expected: All tests pass. No new test failures introduced.
# If other tests fail, investigate if change affected shared test utilities.
```

### Level 4: Integration Validation (Full System)

```bash
# Run all tests to ensure complete system integrity
npm run test:run

# Expected: All tests pass, including E2E and integration tests.

# Verify specific test count
npm run test:run -- tests/unit/core/session-utils.test.ts 2>&1 | grep -E "Test Files|Tests"

# Expected output should show:
# - All 64 tests passing
# - Zero failing tests
# - Pass rate 100%

# Check for any Zod validation errors in output
npm run test:run 2>&1 | grep -i "zod\|context_scope\|validation"

# Expected: No errors related to context_scope validation
# If errors exist, check if other files have invalid context_scope values
```

## Final Validation Checklist

### Technical Validation

- [ ] `createTestSubtask()` function updated with valid CONTRACT DEFINITION format
- [ ] All 4 required sections present: RESEARCH NOTE, INPUT, LOGIC, OUTPUT
- [ ] Sections numbered correctly: 1., 2., 3., 4.
- [ ] Newline character after 'CONTRACT DEFINITION:' prefix
- [ ] Test 'should handle deep hierarchy in backlog' passes
- [ ] All 64 session-utils tests pass
- [ ] No new linting errors
- [ ] No new TypeScript errors

### Feature Validation

- [ ] Zod validation succeeds for context_scope field
- [ ] writeTasksJSON() completes without SessionFileError
- [ ] readTasksJSON() completes without SessionFileError
- [ ] Deep hierarchy structure preserved in test
- [ ] No other tests broken by factory function change
- [ ] Test fixture data matches schema requirements

### Code Quality Validation

- [ ] Follows existing codebase patterns from other test fixtures
- [ ] Factory function maintains consistent return structure
- [ ] Context scope format matches examples in task-orchestrator.test.ts
- [ ] String formatting uses appropriate escape sequences
- [ ] No hardcoded values that should be configurable
- [ ] Test data is self-documenting with clear section content

### Documentation & Handoff

- [ ] Research notes saved to `research/` subdirectory
- [ ] Git commit message references this PRP
- [ ] Change documented in tasks.json (status updated to Complete)
- [ ] Ready for P3.M3 (Retry Utility Jitter Calculation)

## Anti-Patterns to Avoid

- ❌ **Don't modify the Zod schema** - The schema validation is working correctly
- ❌ **Don't skip validation sections** - All 4 sections (RESEARCH NOTE, INPUT, LOGIC, OUTPUT) are required
- ❌ **Don't change section order** - Must be 1, 2, 3, 4 in sequence
- ❌ **Don't use lowercase headers** - Section names are case-sensitive (RESEARCH NOTE not research note)
- ❌ **Don't forget the newline** - 'CONTRACT DEFINITION:' must be followed by \n
- ❌ **Don't update other factory functions** - Only createTestSubtask() needs updating in this file
- ❌ **Don't modify test logic** - Only update the fixture data, not test assertions
- ❌ **Don't use invalid escape sequences** - Use \\n for literal backslash-n, \n for newline
- ❌ **Don't break the factory function** - Preserve all other fields and return structure
- ❌ **Don't assume one test is affected** - Factory function used by multiple tests
- ❌ **Don't skip validation tests** - Run full suite to ensure no regressions
- ❌ **Don't ignore Zod error messages** - They provide specific guidance on what's wrong

---

## Confidence Score: 10/10

**One-Pass Implementation Success Likelihood**: EXTREMELY HIGH

**Rationale**:

1. Clear task boundaries - update factory function return value only
2. Exact file location and line numbers provided (lines 75-76)
3. Complete format specification with CONTRACT DEFINITION template
4. Zod schema requirements fully documented with regex patterns
5. Validation commands are project-specific and executable
6. Multiple valid examples provided from codebase
7. Impact analysis shows all affected tests
8. Fix has already been applied (commit 178ee01) - this PRP documents the change
9. No architectural decisions needed
10. Straightforward string replacement with clear before/after

**Potential Risks**:

- **Risk 1**: Other tests might explicitly check for 'Test scope' value (Very Low - unlikely in unit tests)
- **Risk 2**: Some tests might parse context_scope expecting simple format (Low - Zod schema ensures structure)
- **Risk 3**: Multiple sections in single line might be harder to read (Very Low - can use template literals for readability)

**Validation**: The completed PRP provides everything needed to update the test fixture with valid context_scope format. The exact location is specified, the valid format is documented with examples, Zod schema requirements are fully explained, validation commands verify success, and the fix has already been proven to work (commit 178ee01). The implementation is a straightforward string replacement in a factory function.

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-16
**Status**: Ready for Implementation (Note: Fix already applied in commit 178ee01)
**Dependencies**: P3.M1 (Task Orchestrator Logging) - IN PARALLEL
