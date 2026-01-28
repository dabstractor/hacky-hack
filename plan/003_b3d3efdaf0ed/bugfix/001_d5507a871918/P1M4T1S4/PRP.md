# Product Requirement Prompt (PRP): Update Status Model Unit Tests

---

## Goal

**Feature Goal**: Update the StatusEnum unit tests in `tests/unit/core/models.test.ts` to include the 'Retrying' status value, ensuring test expectations match the correct StatusEnum implementation that already includes 7 values (not 6).

**Deliverable**: Updated test file with 'Retrying' added to all relevant test arrays, count assertions updated from 6 to 7, and all tests passing.

**Success Definition**:
- Test file `tests/unit/core/models.test.ts` is modified with 'Retrying' added to test arrays
- Three specific tests are updated (lines 54, 85, 224, 227, 241, 242)
- Count assertions changed from 6 to 7
- All StatusEnum tests pass after updates
- Tests accurately validate all 7 status values
- Test expectations match actual StatusEnum implementation

## User Persona

**Target User**: Developers and QA engineers maintaining the test suite

**Use Case**: Bug report Issue #3 from TEST_RESULTS.md claimed StatusEnum was missing 'Retrying' status. Previous verification tasks (P1.M4.T1.S1, P1.M4.T1.S2, P1.M4.T1.S3) confirmed the implementation is correct and includes 'Retrying'. This task updates the outdated test expectations to match the correct implementation.

**User Journey**:
1. Developer learns from verification tasks that StatusEnum actually includes 'Retrying'
2. Developer identifies that tests are outdated, not implementation
3. Developer updates test file to include 'Retrying' in test arrays
4. Developer runs tests and verifies all pass
5. Test suite now accurately validates complete status lifecycle

**Pain Points Addressed**:
- Failing tests due to outdated expectations (expected 6, got 7)
- Tests not validating complete status lifecycle
- Confusion about whether implementation or tests are wrong
- Need to align test suite with correct implementation

## Why

- **Test Accuracy**: Align test expectations with correct StatusEnum implementation
- **Fix Failing Tests**: Two tests currently fail because they expect 6 values but implementation has 7
- **Complete Validation**: Ensure tests validate all 7 status values including 'Retrying'
- **Bug Report Resolution**: Address Issue #3 from TEST_RESULTS.md (root cause: outdated tests)
- **Regression Prevention**: Ensure test suite accurately reflects implementation to catch real regressions
- **Documentation**: Update tests to properly document the complete status lifecycle

## What

### User-Visible Behavior

**No direct user-visible changes** - this is a test update task.

**Observable behavior**:
- `tests/unit/core/models.test.ts` file is modified
- Three tests are updated to include 'Retrying' status
- Running `npm test -- tests/unit/core/models.test.ts` shows all tests passing
- Test suite now validates all 7 status values

### Success Criteria

- [ ] Test file `tests/unit/core/models.test.ts` is read and analyzed
- [ ] 'Retrying' is added to `validStatuses` array (line 54)
- [ ] 'Retrying' is added to expected `.options` array (line 85)
- [ ] 'Retrying' is added to `allValidStatuses` array (line 227)
- [ ] Count assertion updated from 6 to 7 (line 241)
- [ ] Count assertion updated from 6 to 7 (line 242)
- [ ] Comment updated to reflect correct count (line 224)
- [ ] All StatusEnum tests pass after updates
- [ ] Test expectations match StatusEnum implementation

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to update the status model tests successfully?

**Answer**: YES - This PRP provides:
- Exact file paths and line numbers for test updates
- Complete before/after code examples for each change
- Verification commands to confirm updates
- Integration context from previous verification tasks
- Clear understanding of why tests are outdated (not implementation)
- Expected test results after updates

### Documentation & References

```yaml
# MUST READ - Test file to modify
- file: tests/unit/core/models.test.ts
  why: Contains StatusEnum tests that need updating
  pattern: |
    - Lines 48-67: Test "should accept valid status values"
    - Lines 80-90: Test "should expose all enum values via options property"
    - Lines 223-243: Test "should document complete status lifecycle with all valid values"
  critical: |
    - Test arrays missing 'Retrying' status
    - Expected counts are 6 but should be 7
    - Two tests currently fail (options property, lifecycle count)
    - Implementation is correct, tests are outdated

# MUST READ - Previous PRP: P1.M4.T1.S1 StatusEnum Verification
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M4T1S1/PRP.md
  why: Confirms StatusEnum implementation includes 'Retrying'
  section: "Goal" and "Success Definition"
  critical: |
    - StatusEnum DOES include 'Retrying' (line 203 in models.ts)
    - Status type DOES include 'Retrying' (line 179 in models.ts)
    - Total enum values: 7 (not 6)
    - Bug report is INACCURATE - tests are wrong, not implementation
    - This task (P1.M4.T1.S4) updates tests to match correct implementation

# MUST READ - Previous PRP: P1.M4.T1.S2 Status Mappings Verification
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M4T1S2/PRP.md
  why: Confirms display infrastructure supports 'Retrying'
  section: "Success Metrics"
  critical: |
    - Color mapping: chalk.yellow ✅
    - Indicator mapping: '↻' ✅
    - All three mapping functions include 'Retrying'
    - Display infrastructure is complete and correct

# MUST READ - Previous PRP: P1.M4.T1.S3 TaskRetryManager Verification
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M4T1S3/PRP.md
  why: Confirms TaskRetryManager uses 'Retrying' status
  section: "Success Metrics"
  critical: |
    - TaskRetryManager sets status to 'Retrying' (lines 311-316)
    - Unit tests verify 'Retrying' status behavior
    - Retry logic is complete and correct
    - All status infrastructure is in place

# MUST READ - StatusEnum implementation (reference only, no changes)
- file: src/core/models.ts
  why: Defines the correct StatusEnum that tests should validate
  pattern: |
    - Lines 175-182: Status union type with 7 values
    - Lines 199-207: StatusEnum Zod schema with 7 values
    - Includes 'Retrying' as 4th value
  gotcha: |
    - DO NOT modify this file - implementation is correct
    - Only modify tests to match this implementation
    - Record<Status, T> pattern enforces completeness at compile time

# MUST READ - Bug report (for context only)
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/TEST_RESULTS.md
  why: Contains Issue #3 claiming StatusEnum is missing 'Retrying'
  section: "## Critical Issues (Must Fix)" > "### Issue 3: Missing "Retrying" Status in StatusEnum"
  critical: |
    - Bug report claims: "Tests expect 6 status values plus 'Retrying' (total 7), but the StatusEnum only defines 6 values"
    - REALITY: StatusEnum defines 7 values (including 'Retrying')
    - Bug report has it BACKWARDS - tests are wrong, not implementation
    - This task fixes the tests, which is the actual problem

# MUST READ - Research findings for this task
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M4T1S4/research/01_status_model_test_analysis.md
  why: Complete analysis of test file and required updates
  section: "Current Test State Analysis" and "Required Test Updates"
  critical: |
    - Identifies exact lines that need modification
    - Provides before/after code examples
    - Explains why tests are failing
    - Confirms implementation is correct

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M4T1S4/research/02_test_update_specifications.md
  why: Detailed specifications for each test update
  section: "Detailed Update Specifications"
  critical: |
    - Line-by-line update instructions
    - Complete before/after code snippets
    - Validation commands for each update
    - Summary of all changes

# MUST READ - Test patterns in the codebase
- file: tests/unit/core/models.test.ts
  why: Follow existing test patterns for consistency
  pattern: |
    - Describe blocks organize tests by schema type
    - Tests use SETUP, EXECUTE, VERIFY comments
    - forEach loops for validating multiple values
    - expect().toEqual() for array comparisons
    - expect().toBe() for count assertions
  critical: |
    - Follow existing code style and structure
    - Maintain consistency with other enum tests
    - Use Vitest assertion patterns (expect, toBe, toEqual)

# MUST READ - Vitest documentation
- url: https://vitest.dev/guide/
  why: Test framework used by the codebase
  section: "Assertions" and "Test Context"
  critical: |
    - expect().toBe() for strict equality
    - expect().toEqual() for deep equality
    - describe() for test grouping
    - it() for individual test cases
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── core/
│   └── models.ts                         # Status type (lines 175-182), StatusEnum (lines 199-207)
│                                          # DO NOT MODIFY - Implementation is correct

tests/
└── unit/
    └── core/
        └── models.test.ts                # MODIFY THIS FILE
            # Lines 48-67: Test 1 - Add 'Retrying' at line 54
            # Lines 80-90: Test 2 - Add 'Retrying' at line 85
            # Lines 223-243: Test 3 - Add 'Retrying' at line 227, update counts at 241-242

plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M4T1S4/
├── PRP.md                                # This file - implementation PRP
└── research/                             # Research documentation
    ├── 01_status_model_test_analysis.md
    └── 02_test_update_specifications.md
```

### Desired Codebase Tree (After Updates)

```bash
# Implementation files: NO CHANGES
src/
└── core/
    └── models.ts                         # UNCHANGED - StatusEnum already correct

# Test file: UPDATED
tests/
└── unit/
    └── core/
        └── models.test.ts                # UPDATED - Tests now include 'Retrying'
            # Line 54: 'Retrying' added to validStatuses array ✅
            # Line 85: 'Retrying' added to expected .options array ✅
            # Line 224: Comment updated to mention 7 values ✅
            # Line 227: 'Retrying' added to allValidStatuses array ✅
            # Line 241: Count changed from 6 to 7 ✅
            # Line 242: Count changed from 6 to 7 ✅
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Implementation is CORRECT, tests are OUTDATED
// DO NOT modify src/core/models.ts
// Only modify tests/unit/core/models.test.ts

// CRITICAL: Bug report has it BACKWARDS
// Bug report claims: "StatusEnum only defines 6 values"
// Reality: StatusEnum defines 7 values, tests expect 6
// Fix: Update tests to expect 7 values

// CRITICAL: StatusEnum uses Zod enum, not TypeScript enum
// This means runtime validation is available via safeParse()
const result = StatusEnum.safeParse('Retrying'); // success === true

// CRITICAL: StatusEnum.options contains all enum values
// Used in tests to verify complete enum definition
StatusEnum.options; // ['Planned', 'Researching', 'Implementing', 'Retrying', 'Complete', 'Failed', 'Obsolete']
StatusEnum.options.length; // 7

// GOTCHA: Test file uses .js extension in imports (ESM requirement)
import { StatusEnum } from '../../../src/core/models.js';

// GOTCHA: Test 1 doesn't validate count (currently passes)
// Adding 'Retrying' improves completeness but won't change pass/fail status

// GOTCHA: Test 2 validates exact array (currently FAILS)
// Expected: [6 values], Actual: [7 values with 'Retrying']
// Adding 'Retrying' will make test pass

// GOTCHA: Test 3 validates count (currently FAILS)
// Expected: 6, Actual: 7
// Changing count from 6 to 7 will make test pass

// CRITICAL: 'Retrying' position in enum
// Order: Planned → Researching → Implementing → Retrying → Complete → Failed → Obsolete
// Index: 0 → 1 → 2 → 3 → 4 → 5 → 6
// Tests must insert 'Retrying' at correct position (after 'Implementing')

// CRITICAL: Previous verification tasks confirmed implementation is correct
// P1.M4.T1.S1: StatusEnum includes 'Retrying' ✅
// P1.M4.T1.S2: Display mappings support 'Retrying' ✅
// P1.M4.T1.S3: TaskRetryManager uses 'Retrying' ✅
// This task: Update tests to match correct implementation ✅

// GOTCHA: Test patterns use forEach loops
// Maintain this pattern when adding 'Retrying'
validStatuses.forEach(status => {
  const result = StatusEnum.safeParse(status);
  expect(result.success).toBe(true);
});

// GOTCHA: Comment on line 224 is misleading
// Currently says: "not 7 as in outdated docs"
// Should say: "including Retrying status"
// Implementation actually HAS 7 values, comment is wrong
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This task updates tests to validate existing models:

**Status Type** (from `src/core/models.ts` lines 175-182):
```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying'      // ← Tests should validate this
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

**StatusEnum Zod Schema** (from `src/core/models.ts` lines 199-207):
```typescript
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Retrying',      // ← Tests should validate this
  'Complete',
  'Failed',
  'Obsolete',
]);
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: READ tests/unit/core/models.test.ts to understand current test structure
  - LOCATE: Test "should accept valid status values" at lines 48-67
  - LOCATE: Test "should expose all enum values via options property" at lines 80-90
  - LOCATE: Test "should document complete status lifecycle with all valid values" at lines 223-243
  - UNDERSTAND: Current test expectations (6 values, missing 'Retrying')
  - CONFIRM: Which tests are failing (Test 2 and Test 3)
  - OUTPUT: Understanding of test structure to memory

Task 2: UPDATE Test 1 to include 'Retrying' in validStatuses array
  - FILE: tests/unit/core/models.test.ts
  - LOCATION: Line 54 (after 'Implementing',')
  - ACTION: Insert 'Retrying',
  - VERIFY: Array now has 7 values
  - POSITION: 4th in array (after 'Implementing', before 'Complete')
  - OUTPUT: Updated test file

Task 3: UPDATE Test 2 to include 'Retrying' in expected .options array
  - FILE: tests/unit/core/models.test.ts
  - LOCATION: Line 85 (after 'Implementing',')
  - ACTION: Insert 'Retrying',
  - VERIFY: Expected array now has 7 values
  - POSITION: 4th in array (after 'Implementing', before 'Complete')
  - OUTPUT: Updated test file

Task 4: UPDATE Test 3 comment to reflect correct count
  - FILE: tests/unit/core/models.test.ts
  - LOCATION: Line 224 (comment)
  - CURRENT: "All 6 valid status values (not 7 as in outdated docs)"
  - ACTION: Change to "All 7 valid status values including Retrying"
  - VERIFY: Comment now accurately describes implementation
  - OUTPUT: Updated test file

Task 5: UPDATE Test 3 to include 'Retrying' in allValidStatuses array
  - FILE: tests/unit/core/models.test.ts
  - LOCATION: Line 227 (after 'Implementing',')
  - ACTION: Insert 'Retrying',
  - VERIFY: Array now has 7 values
  - POSITION: 4th in array (after 'Implementing', before 'Complete')
  - OUTPUT: Updated test file

Task 6: UPDATE Test 3 count assertion for allValidStatuses
  - FILE: tests/unit/core/models.test.ts
  - LOCATION: Line 241
  - CURRENT: expect(allValidStatuses.length).toBe(6);
  - ACTION: Change to expect(allValidStatuses.length).toBe(7);
  - VERIFY: Assertion now expects 7 values
  - OUTPUT: Updated test file

Task 7: UPDATE Test 3 count assertion for StatusEnum.options
  - FILE: tests/unit/core/models.test.ts
  - LOCATION: Line 242
  - CURRENT: expect(StatusEnum.options.length).toBe(6);
  - ACTION: Change to expect(StatusEnum.options.length).toBe(7);
  - VERIFY: Assertion now expects 7 values
  - OUTPUT: Updated test file

Task 8: RUN tests to verify all updates are correct
  - COMMAND: npm test -- tests/unit/core/models.test.ts
  - VERIFY: All StatusEnum tests pass
  - VERIFY: No new test failures introduced
  - VERIFY: Count assertions pass (7 === 7)
  - VERIFY: Array comparisons pass (7-value arrays match)
  - OUTPUT: Test run results

Task 9: VERIFY implementation accuracy (sanity check)
  - COMMAND: node -e "import('./src/core/models.js').then(m => console.log(m.StatusEnum.options))"
  - VERIFY: StatusEnum.options has 7 values
  - VERIFY: 'Retrying' is present
  - VERIFY: Order matches test expectations
  - OUTPUT: Confirmation that implementation is correct

Task 10: DOCUMENT changes in commit message
  - SUMMARY: "Update StatusEnum tests to include 'Retrying' status"
  - DETAIL: "Tests expected 6 status values but StatusEnum has 7 (including 'Retrying'). Updated test arrays and count assertions to match correct implementation."
  - FILES: tests/unit/core/models.test.ts
  - OUTPUT: Clear commit message
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Reading current test structure
// Location: tests/unit/core/models.test.ts lines 48-67

// BEFORE (current state - missing 'Retrying'):
it('should accept valid status values', () => {
  const validStatuses = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',      // ← MISSING 'Retrying'
    'Failed',
    'Obsolete',
  ] as const;

  validStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(status);
    }
  });
});

// AFTER (target state - includes 'Retrying'):
it('should accept valid status values', () => {
  const validStatuses = [
    'Planned',
    'Researching',
    'Implementing',
    'Retrying',      // ← ADD THIS LINE
    'Complete',
    'Failed',
    'Obsolete',
  ] as const;

  validStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(status);
    }
  });
});

// CHANGE: Insert 'Retrying', at line 54 (after 'Implementing',)

// Pattern 2: Updating .options array test
// Location: tests/unit/core/models.test.ts lines 80-90

// BEFORE (currently FAILS - expected 6, got 7):
it('should expose all enum values via options property', () => {
  expect(StatusEnum.options).toEqual([
    'Planned',
    'Researching',
    'Implementing',
    'Complete',      // ← MISSING 'Retrying'
    'Failed',
    'Obsolete',
  ]);
});

// AFTER (will PASS - expected 7, got 7):
it('should expose all enum values via options property', () => {
  expect(StatusEnum.options).toEqual([
    'Planned',
    'Researching',
    'Implementing',
    'Retrying',      // ← ADD THIS LINE
    'Complete',
    'Failed',
    'Obsolete',
  ]);
});

// CHANGE: Insert 'Retrying', at line 85 (after 'Implementing',)
// RESULT: Test will pass (expected array matches actual StatusEnum.options)

// Pattern 3: Updating lifecycle test with count assertions
// Location: tests/unit/core/models.test.ts lines 223-243

// BEFORE (currently FAILS - expected 6, got 7):
it('should document complete status lifecycle with all valid values', () => {
  // SETUP: All 6 valid status values (not 7 as in outdated docs)
  const allValidStatuses: Status[] = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',      // ← MISSING 'Retrying'
    'Failed',
    'Obsolete',
  ];

  allValidStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
  });

  expect(allValidStatuses.length).toBe(6);           // ← WRONG
  expect(StatusEnum.options.length).toBe(6);         // ← WRONG
  expect(StatusEnum.options).not.toContain('Ready');
});

// AFTER (will PASS - expected 7, got 7):
it('should document complete status lifecycle with all valid values', () => {
  // SETUP: All 7 valid status values including Retrying
  const allValidStatuses: Status[] = [
    'Planned',
    'Researching',
    'Implementing',
    'Retrying',      // ← ADD THIS LINE
    'Complete',
    'Failed',
    'Obsolete',
  ];

  allValidStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
  });

  expect(allValidStatuses.length).toBe(7);           // ← CHANGED FROM 6 TO 7
  expect(StatusEnum.options.length).toBe(7);         // ← CHANGED FROM 6 TO 7
  expect(StatusEnum.options).not.toContain('Ready');
});

// CHANGES:
// 1. Line 224: Update comment
// 2. Line 227: Insert 'Retrying',
// 3. Line 241: Change toBe(6) to toBe(7)
// 4. Line 242: Change toBe(6) to toBe(7)
// RESULT: Test will pass (expected counts match actual counts)

// Pattern 4: Verifying implementation (sanity check)
// Command: node -e "import('./src/core/models.js').then(m => console.log(m.StatusEnum.options))"

// Expected output:
// [ 'Planned', 'Researching', 'Implementing', 'Retrying', 'Complete', 'Failed', 'Obsolete' ]

// VERIFICATION: Implementation has 7 values including 'Retrying'
// CONFIRMATION: Tests should expect 7 values including 'Retrying'

// CRITICAL: Do NOT modify src/core/models.ts
// Implementation is ALREADY CORRECT
// Only modify tests/unit/core/models.test.ts

// CRITICAL: Maintain exact order of status values
// Order must match: Planned → Researching → Implementing → Retrying → Complete → Failed → Obsolete
// Insert 'Retrying' at position 3 (after 'Implementing', before 'Complete')

// GOTCHA: Use Vitest assertion patterns
// expect().toBe() for primitive values (counts)
// expect().toEqual() for arrays and objects
// expect().toContain() for array inclusion

// GOTCHA: Test file uses .js extension in imports
// This is required for ESM modules
// Do not change to .ts

// CRITICAL: Previous verification tasks confirmed implementation is correct
// This task only updates test expectations
// No implementation changes needed
```

### Integration Points

```yaml
NO NEW INTEGRATIONS NEEDED

This task updates tests to match EXISTING implementation:

STATUS_ENUM_IMPLEMENTATION:
  - file: src/core/models.ts
  - lines: 175-182 (Status type), 199-207 (StatusEnum)
  - status: CORRECT - No changes needed
  - verified_in: P1.M4.T1.S1
  - includes: 'Retrying' as 4th of 7 values

STATUS_MAPPINGS:
  - file: src/utils/display/status-colors.ts
  - status: CORRECT - No changes needed
  - verified_in: P1.M4.T1.S2
  - includes: Color (chalk.yellow), Indicator ('↻')

RETRY_LOGIC:
  - file: src/core/task-retry-manager.ts
  - status: CORRECT - No changes needed
  - verified_in: P1.M4.T1.S3
  - includes: Sets status to 'Retrying' during retry

TEST_FILE_TO_UPDATE:
  - file: tests/unit/core/models.test.ts
  - status: OUTDATED - Needs updates
  - issue: Missing 'Retrying' in test arrays
  - tests_affected: 3 tests (lines 48-67, 80-90, 223-243)
  - current_state: 2 of 3 tests failing (expected 6, got 7)
  - target_state: 3 of 3 tests passing (expected 7, got 7)

OTHER_TEST_FILES:
  - file: tests/unit/task-status-transitions.test.ts
  - status: LIKELY CORRECT - Uses Status type from models.ts
  - action: NO CHANGES NEEDED

  - file: tests/unit/task-retry-manager.test.ts
  - status: CORRECT - Already includes 'Retrying' tests
  - verified_in: P1.M4.T1.S3
  - action: NO CHANGES NEEDED
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
# Check TypeScript compilation (test file imports source files)
npx tsc --noEmit tests/unit/core/models.test.ts

# Expected: No type errors

# Check code formatting (Prettier if configured)
npx prettier --check tests/unit/core/models.test.ts

# Expected: File is properly formatted

# Run linter (ESLint if configured)
npx eslint tests/unit/core/models.test.ts

# Expected: No linting errors

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific test suite
npm test -- tests/unit/core/models.test.ts

# Expected output:
# ✓ core/models Zod Schemas (7 describe blocks)
#   ✓ StatusEnum (3 tests)
#     ✓ should accept valid status values
#     ✓ should expose all enum values via options property
#     ✓ should document complete status lifecycle with all valid values
#   ✓ BugSeverityEnum
#   ✓ ItemTypeEnum
#   ... other describe blocks

# Test specific StatusEnum tests
npm test -- -t "StatusEnum"

# Expected: All 3 StatusEnum tests pass

# Verify test count
npm test -- tests/unit/core/models.test.ts --reporter=verbose | grep -c "✓"

# Expected: All tests pass (count depends on full test suite)

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify implementation accuracy
node -e "import('./src/core/models.js').then(m => {
  console.log('StatusEnum.options:', m.StatusEnum.options);
  console.log('StatusEnum.options.length:', m.StatusEnum.options.length);
  console.log('Includes Retrying:', m.StatusEnum.options.includes('Retrying'));
})"

# Expected output:
# StatusEnum.options: [ 'Planned', 'Researching', 'Implementing', 'Retrying', 'Complete', 'Failed', 'Obsolete' ]
# StatusEnum.options.length: 7
# Includes Retrying: true

# Run full test suite (optional)
npm test

# Expected: All tests pass, no regressions introduced

# Verify specific test expectations
npm test -- -t "should expose all enum values via options property"

# Expected: Test passes (expected array with 7 values matches actual)

# Verify count assertions
npm test -- -t "should document complete status lifecycle"

# Expected: Test passes (count assertions: 7 === 7)

# Expected: All integrations working, test expectations match implementation
```

### Level 4: Cross-Reference Validation (Compliance Check)

```bash
# Cross-reference check 1: Compare test expectations vs implementation
echo "Test expects 7 values:"
grep -A 10 "should expose all enum values" tests/unit/core/models.test.ts | grep -c "'"

echo "Implementation has 7 values:"
grep -A 10 "export const StatusEnum" src/core/models.ts | grep -c "'"

# Expected output:
# Test expects 7 values: 7
# Implementation has 7 values: 7

# Cross-reference check 2: Verify 'Retrying' position
echo "Test 'Retrying' position:"
grep -A 10 "should accept valid status values" tests/unit/core/models.test.ts | grep -n "Retrying"

echo "Implementation 'Retrying' position:"
grep -A 10 "export const StatusEnum" src/core/models.ts | grep -n "Retrying"

# Expected: Both show 'Retrying' at 4th position

# Cross-reference check 3: Verify count assertions
echo "Count assertions:"
grep -n "toBe(7)" tests/unit/core/models.test.ts | grep -A 1 -B 1 "StatusEnum"

# Expected: Two matches (lines 241 and 242)

# Cross-reference check 4: Verify no 'Ready' status
echo "Verify 'Ready' is not in enum:"
node -e "import('./src/core/models.js').then(m => console.log(m.StatusEnum.options.includes('Ready')))"

# Expected: false

# Cross-reference check 5: Verify complete test suite passes
npm test -- --reporter=json | jq '.testResults[].assertionResults[] | select(.status == "failed") | .title'

# Expected: Empty array (no failed tests)

# Expected: All cross-references verified, tests accurately reflect implementation
```

## Final Validation Checklist

### Technical Validation

- [ ] Test file `tests/unit/core/models.test.ts` is read and understood
- [ ] 'Retrying' added to `validStatuses` array (line 54)
- [ ] 'Retrying' added to expected `.options` array (line 85)
- [ ] Comment updated to reflect 7 values (line 224)
- [ ] 'Retrying' added to `allValidStatuses` array (line 227)
- [ ] Count assertion updated to 7 (line 241)
- [ ] Count assertion updated to 7 (line 242)
- [ ] All StatusEnum tests pass after updates
- [ ] No new test failures introduced
- [ ] No TypeScript compilation errors

### Feature Validation

- [ ] Test "should accept valid status values" passes ✅
- [ ] Test "should expose all enum values via options property" passes ✅
- [ ] Test "should document complete status lifecycle" passes ✅
- [ ] Test expectations match StatusEnum implementation ✅
- [ ] Count assertions match actual enum count (7) ✅
- [ ] Array comparisons match actual enum values ✅
- [ ] Tests validate all 7 status values ✅

### Code Quality Validation

- [ ] Follows existing test patterns and structure ✅
- [ ] Maintains consistent code style ✅
- [ ] Uses Vitest assertion patterns correctly ✅
- [ ] Test comments are accurate and helpful ✅
- [ ] No code smells or anti-patterns introduced ✅
- [ ] Changes are minimal and focused ✅

### Documentation & Verification Validation

- [ ] Research files created in `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M4T1S4/research/`
- [ ] PRP created with complete update specifications
- [ ] All file paths and line numbers documented
- [ ] Before/after code examples provided
- [ ] Verification commands specified
- [ ] Integration with previous verification tasks documented
- [ ] Bug report inaccuracy explained
- [ ] Implementation correctness confirmed

## Anti-Patterns to Avoid

- ❌ Don't modify `src/core/models.ts` - implementation is correct
- ❌ Don't modify display mappings in `status-colors.ts` - already correct
- ❌ Don't modify `task-retry-manager.ts` - already correct
- ❌ Don't change the order of status values - must match enum
- ❌ Don't forget to update ALL three tests (lines 54, 85, 227)
- ❌ Don't forget to update count assertions (lines 241, 242)
- ❌ Don't skip running tests after making changes
- ❌ Don't assume bug report is accurate without verification
- ❌ Don't confuse test bugs with implementation bugs
- ❌ Don't make unnecessary changes beyond the specified updates

---

## Success Metrics

**Confidence Score**: 10/10 for implementation success likelihood

**Reasoning**:
- Simple test updates with clear specifications
- Exact file paths and line numbers provided
- Complete before/after code examples
- Only 5 lines need modification (3 insertions, 2 updates)
- No implementation complexity or dependencies
- Verification tasks confirm implementation is correct
- Clear expected outcomes (all tests pass)
- Straightforward edit-and-validate process

**Validation**: This PRP enables one-pass implementation of test updates. All necessary file locations, line numbers, code examples, and verification steps are provided. The research documentation clearly demonstrates that the implementation is correct and only the test expectations need updating. The three specified updates are minimal, focused, and guaranteed to make all tests pass.

## Summary

### Problem Statement

Bug report Issue #3 claimed that StatusEnum was missing the 'Retrying' status. Previous verification tasks (P1.M4.T1.S1, P1.M4.T1.S2, P1.M4.T1.S3) confirmed that the bug report is **inaccurate** - the implementation is correct and includes 'Retrying'. The problem is with **outdated test expectations**, not the implementation.

### Solution

Update `tests/unit/core/models.test.ts` to include 'Retrying' in all relevant test arrays and update count assertions from 6 to 7. This involves:
1. Adding 'Retrying' to `validStatuses` array (line 54)
2. Adding 'Retrying' to expected `.options` array (line 85)
3. Adding 'Retrying' to `allValidStatuses` array (line 227)
4. Updating comment to reflect 7 values (line 224)
5. Updating count assertions from 6 to 7 (lines 241, 242)

### Expected Outcome

After these updates:
- All 3 StatusEnum tests will pass (currently 2 of 3 fail)
- Test expectations will match the correct StatusEnum implementation
- Tests will validate all 7 status values including 'Retrying'
- Test suite will accurately document the complete status lifecycle

### Implementation Decision

**NO IMPLEMENTATION CHANGES NEEDED**

The StatusEnum implementation is **correct and complete**. Only the test file needs updating to reflect the correct implementation. The 'Retrying' status is already:
- Defined in Status type (line 179)
- Defined in StatusEnum Zod schema (line 203)
- Mapped to display color (chalk.yellow)
- Mapped to display indicator ('↻')
- Used by TaskRetryManager

**Action Required**: Update test expectations to match the correct implementation.
