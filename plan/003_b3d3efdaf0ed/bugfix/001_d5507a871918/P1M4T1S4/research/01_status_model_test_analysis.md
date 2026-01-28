# Status Model Unit Test Analysis

## Overview

This document analyzes the current state of `tests/unit/core/models.test.ts` and identifies the specific changes needed to update tests to reflect the correct StatusEnum implementation that includes the 'Retrying' status.

**Key Finding**: The bug report (Issue #3) is **inaccurate**. The StatusEnum implementation is **correct** and includes 'Retrying'. The problem is with **outdated test expectations**, not the implementation.

## Current Test State Analysis

### Test File: `tests/unit/core/models.test.ts`

#### Test 1: "should accept valid status values" (lines 48-67)

**Current Implementation:**
```typescript
it('should accept valid status values', () => {
  // SETUP: Valid status values
  const validStatuses = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',      // ← MISSING 'Retrying'
    'Failed',
    'Obsolete',
  ] as const;

  // EXECUTE & VERIFY: Each status should parse successfully
  validStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(status);
    }
  });
});
```

**Problem:**
- Array only includes 6 statuses
- Missing 'Retrying' status
- Test will still pass (doesn't validate count)

**Required Change:**
- Add 'Retrying' to the `validStatuses` array
- Position should be after 'Implementing' and before 'Complete'

#### Test 2: "should expose all enum values via options property" (lines 80-90)

**Current Implementation:**
```typescript
it('should expose all enum values via options property', () => {
  // EXECUTE & VERIFY: Check .options property
  expect(StatusEnum.options).toEqual([
    'Planned',
    'Researching',
    'Implementing',
    'Complete',      // ← MISSING 'Retrying'
    'Failed',
    'Obsolete',
  ]);
});
```

**Problem:**
- Expected array only includes 6 values
- Actual `StatusEnum.options` has 7 values (including 'Retrying')
- Test **will fail** with: "Expected [Planned, Researching, Implementing, Complete, Failed, Obsolete] but got [Planned, Researching, Implementing, Retrying, Complete, Failed, Obsolete]"

**Required Change:**
- Add 'Retrying' to expected array
- Position must match actual enum order

#### Test 3: "should document complete status lifecycle with all valid values" (lines 223-243)

**Current Implementation:**
```typescript
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

  // EXECUTE & VERIFY: All are valid via StatusEnum
  allValidStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
  });

  // VERIFY: Count matches implementation (6 values)
  expect(allValidStatuses.length).toBe(6);           // ← WRONG: Should be 7
  expect(StatusEnum.options.length).toBe(6);         // ← WRONG: Should be 7
```

**Problem:**
- Comment says "not 7 as in outdated docs" but this is **backwards**
- Implementation actually **has** 7 values
- Test expects 6 values but will get 7
- Test **will fail** on count assertions

**Required Change:**
- Add 'Retrying' to `allValidStatuses` array
- Update comment to reflect correct count
- Change count assertions from 6 to 7

## Correct StatusEnum Implementation

### File: `src/core/models.ts`

#### Status Union Type (lines 175-182)
```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying'      // ← PRESENT (4th of 7)
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

#### StatusEnum Zod Schema (lines 199-207)
```typescript
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Retrying',      // ← PRESENT (4th of 7)
  'Complete',
  'Failed',
  'Obsolete',
]);
```

**Verification:**
```typescript
StatusEnum.options.length === 7  // ✅ TRUE
StatusEnum.options.includes('Retrying')  // ✅ TRUE
```

## Required Test Updates

### Summary of Changes

**Test 1**: Add 'Retrying' to `validStatuses` array
- File: `tests/unit/core/models.test.ts`
- Lines: 50-57
- Action: Insert 'Retrying' after 'Implementing'

**Test 2**: Add 'Retrying' to expected `.options` array
- File: `tests/unit/core/models.test.ts`
- Lines: 82-89
- Action: Insert 'Retrying' after 'Implementing'

**Test 3**: Add 'Retrying' to `allValidStatuses` array and update counts
- File: `tests/unit/core/models.test.ts`
- Lines: 224-242
- Action:
  - Insert 'Retrying' after 'Implementing'
  - Update comment (line 224)
  - Change count assertions from 6 to 7 (lines 241-242)

## Verification After Updates

### Expected Test Behavior

**Before Updates:**
- Test 1: Passes (doesn't validate completeness)
- Test 2: **FAILS** (expected 6, got 7)
- Test 3: **FAILS** (expected 6, got 7)

**After Updates:**
- Test 1: Passes (validates all 7 statuses)
- Test 2: Passes (expected 7, got 7)
- Test 3: Passes (expected 7, got 7)

### Validation Commands

```bash
# Run the specific test suite
npm test -- tests/unit/core/models.test.ts

# Expected: All tests pass

# Run specific test describe block
npm test -- -t "StatusEnum"

# Expected: All StatusEnum tests pass

# Verify enum count
node -e "import('./src/core/models.js').then(m => console.log(m.StatusEnum.options.length))"

# Expected output: 7
```

## Integration with Previous Verification Tasks

### P1.M4.T1.S1: StatusEnum Definition Verification ✅

**Finding**: StatusEnum **includes** 'Retrying' (line 203 in models.ts)

**Impact on This Task**:
- Confirms implementation is correct
- Tests need updating to match implementation
- No implementation changes needed

### P1.M4.T1.S2: Status Color and Indicator Mappings ✅

**Finding**: Display infrastructure **fully supports** 'Retrying'

**Impact on This Task**:
- Confirms 'Retrying' is integrated across codebase
- Tests should reflect this integration
- Display components don't need changes

### P1.M4.T1.S3: TaskRetryManager Usage Verification ✅

**Finding**: TaskRetryManager **actively uses** 'Retrying' status

**Impact on This Task**:
- Confirms 'Retrying' is not just defined but **used**
- Tests should validate the complete status lifecycle
- Retry logic doesn't need changes

## Test Pattern Analysis

### Existing Test Patterns in the Codebase

From the analysis of test patterns:

1. **Enum Validation Pattern** (from BugSeverityEnum, ItemTypeEnum tests):
   ```typescript
   const validValues = [/* all enum values */] as const;
   validValues.forEach(value => {
     const result = EnumSchema.safeParse(value);
     expect(result.success).toBe(true);
   });
   ```

2. **Options Property Validation**:
   ```typescript
   expect(EnumSchema.options).toEqual([/* all enum values */]);
   ```

3. **Completeness Validation**:
   ```typescript
   expect(EnumSchema.options.length).toBe(expectedCount);
   ```

### Applying Patterns to StatusEnum Updates

**Pattern 1: Validate all 7 statuses**
```typescript
const allValidStatuses: Status[] = [
  'Planned',
  'Researching',
  'Implementing',
  'Retrying',      // ← ADD THIS
  'Complete',
  'Failed',
  'Obsolete',
];
```

**Pattern 2: Validate options array**
```typescript
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

**Pattern 3: Validate count**
```typescript
expect(StatusEnum.options.length).toBe(7);  // ← CHANGE FROM 6 TO 7
```

## Conclusion

The StatusEnum implementation is **correct and complete**. The 'Retrying' status is:
- ✅ Present in Status union type (line 179)
- ✅ Present in StatusEnum Zod schema (line 203)
- ✅ Has color mapping (chalk.yellow)
- ✅ Has indicator symbol ('↻')
- ✅ Actively used by TaskRetryManager

The test file is **outdated** and needs updates to reflect the correct implementation. Once updated, all tests will pass and the test suite will accurately validate the complete status lifecycle including the 'Retrying' status.
