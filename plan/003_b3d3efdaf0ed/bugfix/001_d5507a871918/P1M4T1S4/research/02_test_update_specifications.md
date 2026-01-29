# Test Update Specifications for P1.M4.T1.S4

## Overview

This document provides the exact specifications for updating `tests/unit/core/models.test.ts` to include the 'Retrying' status in all relevant test cases.

**Context**: The StatusEnum implementation already includes 'Retrying' (verified in P1.M4.T1.S1). This document specifies the test updates needed to reflect the correct implementation.

## File to Modify

**Path**: `tests/unit/core/models.test.ts`

**Test Suite**: `core/models Zod Schemas` > `StatusEnum`

## Detailed Update Specifications

### Update 1: "should accept valid status values" test

**Location**: Lines 48-67

**Current Code:**

```typescript
it('should accept valid status values', () => {
  // SETUP: Valid status values
  const validStatuses = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',
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

**Required Changes:**

1. Line 54: Insert `'Retrying',` after `'Implementing',`
2. (Optional) Update comment on line 49 to mention "All 7 valid status values"

**Updated Code:**

```typescript
it('should accept valid status values', () => {
  // SETUP: Valid status values
  const validStatuses = [
    'Planned',
    'Researching',
    'Implementing',
    'Retrying', // ← ADD THIS LINE
    'Complete',
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

**Validation:**

- Array length: 7 (was 6)
- 'Retrying' position: 4th (after 'Implementing', before 'Complete')
- Test will pass (all 7 statuses parse successfully)

---

### Update 2: "should expose all enum values via options property" test

**Location**: Lines 80-90

**Current Code:**

```typescript
it('should expose all enum values via options property', () => {
  // EXECUTE & VERIFY: Check .options property
  expect(StatusEnum.options).toEqual([
    'Planned',
    'Researching',
    'Implementing',
    'Complete',
    'Failed',
    'Obsolete',
  ]);
});
```

**Required Changes:**

1. Line 85: Insert `'Retrying',` after `'Implementing',`

**Updated Code:**

```typescript
it('should expose all enum values via options property', () => {
  // EXECUTE & VERIFY: Check .options property
  expect(StatusEnum.options).toEqual([
    'Planned',
    'Researching',
    'Implementing',
    'Retrying', // ← ADD THIS LINE
    'Complete',
    'Failed',
    'Obsolete',
  ]);
});
```

**Validation:**

- Expected array length: 7 (was 6)
- 'Retrying' position: 4th (matches actual enum order)
- Test will pass (expected array matches actual `StatusEnum.options`)

---

### Update 3: "should document complete status lifecycle with all valid values" test

**Location**: Lines 223-243

**Current Code:**

```typescript
it('should document complete status lifecycle with all valid values', () => {
  // SETUP: All 6 valid status values (not 7 as in outdated docs)
  const allValidStatuses: Status[] = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',
    'Failed',
    'Obsolete',
  ];

  // EXECUTE & VERIFY: All are valid via StatusEnum
  allValidStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
  });

  // VERIFY: Count matches implementation (6 values)
  expect(allValidStatuses.length).toBe(6);
  expect(StatusEnum.options.length).toBe(6);

  // VERIFY: No 'Ready' status in implementation
  expect(StatusEnum.options).not.toContain('Ready');
```

**Required Changes:**

1. Line 224: Update comment from "not 7 as in outdated docs" to "includes Retrying status"
2. Line 227: Insert `'Retrying',` after `'Implementing',`
3. Line 241: Change assertion from `toBe(6)` to `toBe(7)`
4. Line 242: Change assertion from `toBe(6)` to `toBe(7)`

**Updated Code:**

```typescript
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

  // EXECUTE & VERIFY: All are valid via StatusEnum
  allValidStatuses.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
  });

  // VERIFY: Count matches implementation (7 values)
  expect(allValidStatuses.length).toBe(7);      // ← CHANGE FROM 6 TO 7
  expect(StatusEnum.options.length).toBe(7);    // ← CHANGE FROM 6 TO 7

  // VERIFY: No 'Ready' status in implementation
  expect(StatusEnum.options).not.toContain('Ready');
```

**Validation:**

- Comment accuracy: Now correct (implementation has 7 values)
- Array length: 7 (was 6)
- Count assertions: 7 (was 6)
- Test will pass (expected counts match actual counts)

---

## Additional Considerations

### Status Lifecycle Test (Optional Enhancement)

**Location**: Lines 149-222 (describe block: "Status transition workflow")

**Current State**: Tests document workflow but don't include 'Retrying' in lifecycle documentation

**Optional Enhancement**: Add test for retry workflow

```typescript
it('should validate retry workflow progression: Implementing → Retrying → Implementing', () => {
  // SETUP: Define retry workflow progression
  const retryProgression = [
    'Implementing', // Initial attempt
    'Retrying', // Retry in progress
    'Implementing', // Retry attempt
  ] as const;

  // EXECUTE & VERIFY: Each status in retry workflow is valid
  retryProgression.forEach(status => {
    const result = StatusEnum.safeParse(status);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(status);
    }
  });

  // VERIFY: All statuses in workflow are distinct
  const uniqueStatuses = new Set(retryProgression);
  expect(uniqueStatuses.size).toBe(retryProgression.length);
});
```

**Note**: This is **optional** and not required for the main task. The three mandatory updates above are sufficient.

---

## Validation Commands

### Before Updates (Current State)

```bash
# Run StatusEnum tests
npm test -- -t "StatusEnum"

# Expected Results:
# - "should accept valid status values": PASS (doesn't validate completeness)
# - "should expose all enum values via options property": FAIL (expected 6, got 7)
# - "should document complete status lifecycle with all valid values": FAIL (expected 6, got 7)
```

### After Updates (Target State)

```bash
# Run StatusEnum tests
npm test -- -t "StatusEnum"

# Expected Results:
# - "should accept valid status values": PASS
# - "should expose all enum values via options property": PASS
# - "should document complete status lifecycle with all valid values": PASS
```

### Verify Implementation Accuracy

```bash
# Check StatusEnum.options length
node -e "import('./src/core/models.js').then(m => console.log('StatusEnum.options.length:', m.StatusEnum.options.length))"

# Expected output: StatusEnum.options.length: 7

# Check StatusEnum.options values
node -e "import('./src/core/models.js').then(m => console.log('StatusEnum.options:', m.StatusEnum.options))"

# Expected output: StatusEnum.options: [ 'Planned', 'Researching', 'Implementing', 'Retrying', 'Complete', 'Failed', 'Obsolete' ]
```

---

## Summary of Changes

| Test Name                                                         | Lines              | Change Type | Description                                   |
| ----------------------------------------------------------------- | ------------------ | ----------- | --------------------------------------------- |
| "should accept valid status values"                               | 54                 | Insert      | Add 'Retrying' to validStatuses array         |
| "should expose all enum values via options property"              | 85                 | Insert      | Add 'Retrying' to expected array              |
| "should document complete status lifecycle with all valid values" | 224, 227, 241, 242 | Multiple    | Update comment, add 'Retrying', change counts |

**Total Lines Modified**: 5 lines
**Total Insertions**: 3 lines (adding 'Retrying')
**Total Updates**: 2 lines (count assertions)

---

## Test Coverage Impact

### Before Updates

- StatusEnum tests: 2 of 3 passing (66.7% pass rate)
- Missing validation for 'Retrying' status
- Tests contradict actual implementation

### After Updates

- StatusEnum tests: 3 of 3 passing (100% pass rate)
- Complete validation for all 7 statuses
- Tests accurately reflect implementation

---

## Integration with Other Status-Related Tests

### Tests in Other Files (No Changes Needed)

1. **tests/unit/task-status-transitions.test.ts**
   - May already include 'Retrying' transitions
   - No changes needed (uses Status type from models.ts)

2. **tests/unit/core/session-manager.test.ts**
   - Tests status updates via SessionManager
   - No changes needed (uses Status type from models.ts)

3. **tests/unit/task-retry-manager.test.ts**
   - Tests retry logic including 'Retrying' status
   - Already updated (verified in P1.M4.T1.S3)

**Note**: Only `tests/unit/core/models.test.ts` needs updates. Other test files that import the Status type from models.ts are already correct because the implementation is correct.

---

## Conclusion

These three targeted updates to `tests/unit/core/models.test.ts` will:

1. ✅ Fix failing tests (Update 2 and Update 3)
2. ✅ Improve test completeness (Update 1)
3. ✅ Align test expectations with correct implementation
4. ✅ Validate all 7 status values including 'Retrying'
5. ✅ Accurately document the complete status lifecycle

No implementation changes are needed. The StatusEnum already includes 'Retrying' and is correctly integrated across the codebase. Only the test expectations need updating.
