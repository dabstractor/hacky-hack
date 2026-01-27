# Test Expectations vs Implementation Reality

## Research Date
2026-01-27

## Objective
Analyze the discrepancy between test expectations and actual StatusEnum implementation.

## The Discrepancy

### What Tests Expect
**File:** tests/unit/core/models.test.ts

```typescript
// Lines 50-57: Valid statuses array
const validStatuses = [
  'Planned',
  'Researching',
  'Implementing',
  'Complete',      // ← Missing 'Retrying'
  'Failed',
  'Obsolete',
];

// Lines 82-89: Expected .options property
expect(StatusEnum.options).toEqual([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',      // ← Missing 'Retrying'
  'Failed',
  'Obsolete',
]);
```

**Test Expectation:** 6 status values

### What Implementation Provides
**File:** src/core/models.ts

```typescript
// Lines 175-182: Status union type
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying'      // ← PRESENT
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// Lines 199-207: StatusEnum Zod schema
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Retrying',      // ← PRESENT
  'Complete',
  'Failed',
  'Obsolete',
]);
```

**Implementation Reality:** 7 status values

## Test Failure Analysis

### Test 1: "should accept valid status values"
**Lines 48-67**

```typescript
it('should accept valid status values', () => {
  const validStatuses = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',      // ← Missing 'Retrying'
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
```

**Status:** ⚠️ PASSES BUT INCOMPLETE
- Test passes because it validates what it checks
- Does NOT test 'Retrying' status
- Missing test coverage for 'Retrying'

**Issue:** False sense of security - test passes but doesn't validate all statuses

### Test 2: "should expose all enum values via options property"
**Lines 80-90**

```typescript
it('should expose all enum values via options property', () => {
  expect(StatusEnum.options).toEqual([
    'Planned',
    'Researching',
    'Implementing',
    'Complete',      // ← Missing 'Retrying'
    'Failed',
    'Obsolete',
  ]);
});
```

**Status:** ❌ FAILS
- Expects 6 values in .options array
- Actual StatusEnum.options has 7 values (including 'Retrying')
- Test failure reveals the discrepancy

**Error Message (Expected):**
```
Expected: ['Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete']
Received: ['Planned', 'Researching', 'Implementing', 'Retrying', 'Complete', 'Failed', 'Obsolete']
```

### Test 3: Status transition tests
**File:** tests/unit/task-status-transitions.test.ts

**Status:** ✅ LIKELY PASSES
- Uses Status type from models.ts
- Status type includes 'Retrying'
- Tests likely handle 'Retrying' correctly

## Root Cause Analysis

### Scenario 1: Implementation Was Updated, Tests Were Not

**Timeline:**
1. **Initial State:** StatusEnum had 6 values (no 'Retrying')
2. **Tests Written:** Tests validated 6 values
3. **Implementation Updated:** 'Retrying' added to StatusEnum (commit 3659e55)
4. **Tests Not Updated:** Still expect 6 values
5. **Result:** Test fails on .options check

**Evidence:**
- Commit 3659e55 added display support for 'Retrying'
- Display code assumes 'Retrying' exists in StatusEnum
- Tests were not part of this commit

### Scenario 2: Count Confusion in Bug Report

**Bug Report Claim:**
> "Tests expect 6 status values plus 'Retrying' (total 7)"

**Reality:**
- Tests expect **6 values total** (not 6 plus Retrying)
- Implementation has **7 values total** (includes Retrying)
- Bug report phrasing is confusing/misleading

**Correct Phrasing Should Be:**
> "Tests expect 6 status values, but StatusEnum defines 7 values (including 'Retrying')"

### Scenario 3: Stale Test Results in Bug Report

**Bug Report States:**
> "Run `npm test` to see failing tests in `tests/unit/core/models.test.ts`"

**Question:** Were tests actually run, or was this assumed?

**Analysis:**
- If tests were run, the failure would be obvious
- The bug report author may have seen 'Retrying' missing from test arrays
- Assumed implementation was wrong, not tests

## Impact Assessment

### Current Impact
1. **Test Suite:** ❌ Fails on "should expose all enum values via options property"
2. **Code Coverage:** ⚠️ Incomplete ('Retrying' not explicitly tested)
3. **CI/CD:** ❌ Would fail if this test is required
4. **Functionality:** ✅ Works correctly (implementation is right)

### Development Impact
1. **Developer Confusion:** ⚠️ Test failure suggests bug, but implementation is correct
2. **Debugging Time:** ⚠️ Time wasted investigating "missing" status
3. **Trust in Tests:** ⚠️ Reduces confidence in test suite

### Production Impact
1. **Runtime:** ✅ No issues (implementation correct)
2. **Retry Logic:** ✅ Works properly (TaskRetryManager uses 'Retrying')
3. **Display:** ✅ Shows 'Retrying' correctly (yellow, ↻)
4. **Data Integrity:** ✅ StatusEnum validates all 7 values

## Related Test Files

### 1. tests/unit/core/models.test.ts
**Status:** ❌ NEEDS UPDATE
**Issue:** Missing 'Retrying' in test arrays
**Action Required:** Add 'Retrying' to all status arrays

### 2. tests/unit/task-status-transitions.test.ts
**Status:** ⚠️ NEEDS VERIFICATION
**Issue:** May or may not test 'Retrying' transitions
**Action Required:** Verify 'Retrying' is covered

### 3. tests/unit/task-retry-manager.test.ts
**Status:** ✅ LIKELY CORRECT
**Issue:** Tests retry functionality which uses 'Retrying'
**Action Required:** Verify tests expect 'Retrying' status updates

## Test Update Requirements

### For tests/unit/core/models.test.ts

**Change 1: Add 'Retrying' to validStatuses**
```typescript
// BEFORE (Lines 50-57):
const validStatuses = [
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
] as const;

// AFTER:
const validStatuses = [
  'Planned',
  'Researching',
  'Implementing',
  'Retrying',      // ← ADD THIS
  'Complete',
  'Failed',
  'Obsolete',
] as const;
```

**Change 2: Add 'Retrying' to expected .options**
```typescript
// BEFORE (Lines 82-89):
expect(StatusEnum.options).toEqual([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);

// AFTER:
expect(StatusEnum.options).toEqual([
  'Planned',
  'Researching',
  'Implementing',
  'Retrying',      // ← ADD THIS
  'Complete',
  'Failed',
  'Obsolete',
]);
```

### For tests/unit/task-status-transitions.test.ts

**Verify Coverage:**
1. Check if 'Retrying' transitions are tested
2. Add tests for: Implementing → Retrying → Implementing
3. Add tests for: Retrying → Complete
4. Add tests for: Retrying → Failed

## Automated Test Validation

### Script to Verify StatusEnum Completeness
```bash
# Extract StatusEnum values from source
grep -A 10 "export const StatusEnum = z.enum" src/core/models.ts | \
  grep "'" | \
  wc -l

# Expected output: 7
```

### Script to Find Missing Test Coverage
```bash
# Check if 'Retrying' is in test file
grep -c "Retrying" tests/unit/core/models.test.ts

# Expected output: > 0 (currently 0)
```

## Verification Checklist

For this subtask (P1.M4.T1.S1):
- [x] Verify StatusEnum includes 'Retrying'
- [x] Verify Status union type includes 'Retrying'
- [x] Verify test expectations vs implementation
- [x] Document discrepancies
- [x] Identify root cause (tests not updated)

For subsequent subtasks:
- [ ] P1.M4.T1.S2: Verify status color mappings include 'Retrying'
- [ ] P1.M4.T1.S3: Verify TaskRetryManager uses 'Retrying' status
- [ ] P1.M4.T1.S4: **UPDATE TESTS** (this is where work is needed)

## Conclusion

### Summary
- **Implementation:** ✅ CORRECT - StatusEnum includes 'Retrying' with 7 values
- **Tests:** ❌ OUTDATED - Expect 6 values, missing 'Retrying'
- **Bug Report:** ❌ MISLEADING - Claims implementation is wrong, but tests are wrong

### Action Items
1. **This Task (P1.M4.T1.S1):** Verification only - document findings
2. **Task P1.M4.T1.S4:** Update tests to include 'Retrying'
3. **Future:** Add test coverage validation to CI/CD

### Confidence Score
**10/10** - Implementation is correct, tests need updating

### Files Requiring Changes
1. ✅ src/core/models.ts - NO CHANGE (already correct)
2. ❌ tests/unit/core/models.test.ts - NEEDS UPDATE
3. ⚠️ tests/unit/task-status-transitions.test.ts - VERIFY & UPDATE IF NEEDED
