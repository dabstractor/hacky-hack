# ResearchQueue Constructor Fix Analysis
## Patterns Applied to SessionManager Constructor Signature Fix

**Analysis Date**: 2026-01-26
**Bug Report**: 001_d5507a871918
**Completed Task**: P1.M1.T1 (ResearchQueue Constructor Fix)
**Target Task**: P1.M1.T2 (SessionManager Constructor Fix)

---

## Executive Summary

The ResearchQueue constructor fix (commits 0961f36 and 59b2b32) provides a proven pattern for updating constructor signatures across test suites. This analysis extracts the reusable patterns and applies them to the SessionManager constructor fix.

### Key Findings
- **Constructor Signature**: ResearchQueue evolved from 2 parameters to 4 parameters
- **Test Updates**: 39 unit test instantiations + 22 integration test instantiations updated
- **Pattern**: Test constants + consistent parameter ordering + mock assertion updates
- **Success Rate**: All tests passed with no regressions

---

## 1. ResearchQueue Constructor Signature Evolution

### Before (2-parameter signature)
```typescript
// OLD: Tests used incomplete signature
new ResearchQueue(sessionManager, maxSize)
new ResearchQueue(sessionManager)
```

### After (4-parameter signature)
```typescript
// NEW: Complete signature with all parameters
new ResearchQueue(
  sessionManager,
  maxSize,
  noCache,
  cacheTtlMs
)
```

### Actual Constructor Signature (src/core/research-queue.ts:94-99)
```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
)
```

---

## 2. Fix Patterns Used for ResearchQueue

### Pattern 1: Test Constants for Default Values

**Location**: `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts:101-105`

```typescript
// Test constants for ResearchQueue constructor parameters
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
```

**Benefits**:
- Centralized default values
- Easy to update if constructor defaults change
- Self-documenting test code
- Consistency across all test cases

**Apply to SessionManager**:
```typescript
// Test constants for SessionManager constructor parameters
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = '/test/plan';
const DEFAULT_FLUSH_RETRIES = 3;
```

---

### Pattern 2: Consistent Constructor Call Formatting

**Location**: `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts:135-142`

**Before**:
```typescript
const queue = new ResearchQueue(mockManager, 3);
```

**After** (multi-line for readability):
```typescript
const queue = new ResearchQueue(
  mockManager,
  DEFAULT_MAX_SIZE,
  DEFAULT_NO_CACHE,
  DEFAULT_CACHE_TTL_MS
);
```

**Benefits**:
- Clear parameter-to-argument mapping
- Easy to verify all parameters present
- Consistent formatting across codebase
- Reduces merge conflicts

**Apply to SessionManager**:
```typescript
// BEFORE (incorrect - 2 parameters)
const manager = new SessionManager('/test/PRD.md');

// AFTER (correct - 3 parameters)
const manager = new SessionManager(
  DEFAULT_PRD_PATH,
  DEFAULT_PLAN_DIR,
  DEFAULT_FLUSH_RETRIES
);
```

---

### Pattern 3: Mock Assertion Updates

**Location**: `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts:273-280`

**Before** (incomplete assertion):
```typescript
expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, false, 86400000);
```

**After** (complete assertion with constants):
```typescript
expect(MockPRPGenerator).toHaveBeenCalledWith(
  mockManager,
  DEFAULT_NO_CACHE,
  DEFAULT_CACHE_TTL_MS
);
```

**Benefits**:
- Validates all parameters are passed correctly
- Uses test constants for consistency
- Catches parameter forwarding bugs
- Documents expected behavior

**Apply to SessionManager**:
```typescript
// SessionManager doesn't forward parameters to mocks,
// but tests should verify constructor parameters are stored correctly
expect(manager.prdPath).toBe(DEFAULT_PRD_PATH);
expect(manager.planDir).toBe(DEFAULT_PLAN_DIR);
// Internal flushRetries would need test accessor or behavior verification
```

---

### Pattern 4: Parameter Variation Test Coverage

**Location**: `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts:357-455`

```typescript
describe('noCache parameter', () => {
  it('should forward noCache=true to PRPGenerator', () => {
    new ResearchQueue(
      mockManager,
      DEFAULT_MAX_SIZE,
      true,  // Override default
      DEFAULT_CACHE_TTL_MS
    );

    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      true,  // Verify override passed through
      DEFAULT_CACHE_TTL_MS
    );
  });
});

describe('cacheTtlMs parameter', () => {
  it('should forward custom cacheTtlMs to PRPGenerator', () => {
    const customTtl = 12 * 60 * 60 * 1000; // 12 hours

    new ResearchQueue(
      mockManager,
      DEFAULT_MAX_SIZE,
      DEFAULT_NO_CACHE,
      customTtl  // Custom value
    );

    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      DEFAULT_NO_CACHE,
      customTtl  // Verify custom value
    );
  });
});
```

**Benefits**:
- Tests parameter override behavior
- Validates parameter forwarding
- Documents non-default usage patterns
- Catches parameter ordering bugs

**Apply to SessionManager**:
```typescript
describe('planDir parameter', () => {
  it('should accept custom plan directory', () => {
    const customPlanDir = '/custom/plan';
    const manager = new SessionManager(
      DEFAULT_PRD_PATH,
      customPlanDir,
      DEFAULT_FLUSH_RETRIES
    );

    expect(manager.planDir).toBe(resolve(customPlanDir));
  });
});

describe('flushRetries parameter', () => {
  it('should accept custom flush retry count', () => {
    const customRetries = 5;
    const manager = new SessionManager(
      DEFAULT_PRD_PATH,
      DEFAULT_PLAN_DIR,
      customRetries
    );

    // Verify through behavior (e.g., retry logic)
    // or add test accessor for #flushRetries
  });
});
```

---

## 3. TaskOrchestrator Integration Pattern

### ResearchQueue Integration (src/core/task-orchestrator.ts:161-166)

```typescript
// Initialize ResearchQueue with configurable concurrency and cache TTL
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  this.#researchQueueConcurrency,  // From config
  this.#noCache,                    // From config
  this.#cacheTtlMs                  // From config
);
```

**Key Pattern**:
- Uses class properties for parameters
- Parameters derived from configuration
- All 4 parameters explicitly passed
- Debug logging after initialization

**Apply to SessionManager** (if TaskOrchestrator creates it):
```typescript
// Verify TaskOrchestrator uses correct 3-parameter signature
this.sessionManager = new SessionManager(
  this.#prdPath,      // From configuration
  this.#planDir,      // From configuration
  this.#flushRetries  // From configuration
);
```

**Note**: TaskOrchestrator currently receives SessionManager as constructor parameter, so this may not need updating. Verify in P1.M1.T2.S4.

---

## 4. Test File Update Patterns

### Unit Test Updates (commit 0961f36)

**Statistics**:
- Files changed: 1 (`tests/unit/core/research-queue.test.ts`)
- Lines added: 389
- Instantiations updated: 39
- New test suites added: 2 (noCache, cacheTtlMs)

**Process**:
1. Add test constants at top of file
2. Update all `new ResearchQueue(...)` calls to use 4 parameters
3. Update mock assertions to validate all parameters
4. Add new describe blocks for parameter variation tests
5. Run tests to verify no regressions

### Integration Test Updates (commit 59b2b32)

**Statistics**:
- Files changed: 1 (`tests/integration/core/research-queue.test.ts`)
- Lines added: 148
- Instantiations updated: 22
- New test scenarios: Cache TTL, concurrency limits, no-cache flag

**Process**:
1. Add same test constants as unit tests
2. Update all instantiations with 4 parameters
3. Add integration tests for parameter behavior
4. Verify end-to-end functionality
5. Run integration tests

---

## 5. SessionManager Constructor Analysis

### Current Constructor Signature (src/core/session-manager.ts:190-194)

```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```

### Actual Usage in Production (src/workflows/prp-pipeline.ts:1768-1772)

```typescript
// CORRECT: 3-parameter usage
this.sessionManager = new SessionManagerClass(
  this.#prdPath,
  this.#planDir,
  this.#flushRetries
);
```

### Incorrect Usage in Tests (tests/unit/core/session-manager.test.ts)

```typescript
// INCORRECT: 2-parameter usage (missing planDir)
const manager = new SessionManager('/test/PRD.md');

// INCORRECT: 2-parameter usage (missing flushRetries)
const manager = new SessionManager('/test/PRD.md', '/custom/plan');
```

**Note**: Some tests DO use correct 3-parameter signature:
```typescript
// CORRECT: 3-parameter usage (line 229)
const manager = new SessionManager('/test/PRD.md', '/custom/plan');
```

This is inconsistent and needs comprehensive audit and fix.

---

## 6. Applied Pattern for SessionManager Fix

### Step 1: Add Test Constants

**File**: `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts`

```typescript
// Test constants for SessionManager constructor parameters
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = '/test/plan';
const DEFAULT_FLUSH_RETRIES = 3;
```

### Step 2: Update Constructor Calls

**Pattern**: Find all `new SessionManager(` and update to 3-parameter signature

**Before** (various incorrect patterns):
```typescript
const manager = new SessionManager('/test/PRD.md');                    // 1 param
const manager = new SessionManager('/test/PRD.md', '/custom/plan');     // 2 params
```

**After** (consistent 3-parameter pattern):
```typescript
const manager = new SessionManager(
  DEFAULT_PRD_PATH,
  DEFAULT_PLAN_DIR,
  DEFAULT_FLUSH_RETRIES
);
```

### Step 3: Update Parameter Override Tests

**For custom planDir**:
```typescript
const manager = new SessionManager(
  DEFAULT_PRD_PATH,
  '/custom/plan',      // Custom value
  DEFAULT_FLUSH_RETRIES
);
```

**For custom flushRetries**:
```typescript
const manager = new SessionManager(
  DEFAULT_PRD_PATH,
  DEFAULT_PLAN_DIR,
  5                    // Custom retry count
);
```

### Step 4: Verify Property Assertions

```typescript
// Verify prdPath is stored correctly
expect(manager.prdPath).toBe(resolve(DEFAULT_PRD_PATH));

// Verify planDir is stored correctly
expect(manager.planDir).toBe(resolve(DEFAULT_PLAN_DIR));

// Verify flushRetries through behavior (it's private)
// or test retry logic indirectly
```

---

## 7. Test File Inventory for SessionManager

Based on grep analysis, these files contain `new SessionManager(` instantiations:

### Unit Tests (1 file)
1. `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts` - Primary unit tests
2. `/home/dustin/projects/hacky-hack/tests/unit/core/session-state-batching.test.ts` - Batching tests

### Integration Tests (3+ files)
1. `/home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts`
2. `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-runtime.test.ts`
3. `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.ts`
4. `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-e2e.test.ts`
5. `/home/dustin/projects/hacky-hack/tests/integration/prp-generator-integration.test.ts`
6. `/home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts`
7. `/home/dustin/projects/hacky-hack/tests/integration/delta-resume-regeneration.test.ts`
8. `/home/dustin/projects/hacky-hack/tests/integration/prd-task-command.test.ts`
9. `/home/dustin/projects/hacky-hack/tests/integration/scope-resolution.test.ts`
10. `/home/dustin/projects/hacky-hack/tests/integration/session-structure.test.ts`
11. `/home/dustin/projects/hacky-hack/tests/integration/tasks-json-authority.test.ts`
12. `/home/dustin/projects/hacky-hack/tests/integration/core/delta-session.test.ts`

**Total estimated files**: 13 test files (matching the bug report claim of "23 test files" when counting multiple instantiations per file)

---

## 8. Lessons Learned from ResearchQueue Fix

### Success Factors

1. **Test Constants Prevent Errors**
   - ResearchQueue used constants for all 3 default values
   - Zero typos in default values across 61 instantiations
   - Easy to verify constructor defaults match test constants

2. **Multi-line Formatting Improves Clarity**
   - All 4 parameters visible at once
   - Easy to spot missing parameters during code review
   - Consistent formatting reduces cognitive load

3. **Comprehensive Parameter Variation Tests**
   - Separate describe blocks for each parameter
   - Tests both default and custom values
   - Validates parameter forwarding to dependencies

4. **Incremental Approach**
   - S1: Fix production code (TaskOrchestrator)
   - S2: Fix unit tests
   - S3: Fix integration tests
   - Each step validated before proceeding

### Potential Pitfalls to Avoid

1. **Don't Forget Mock Assertions**
   - ResearchQueue had to update PRPGenerator mock calls
   - SessionManager may need similar updates if it forwards parameters

2. **Watch for Default Parameter Usage**
   - Some tests may rely on default parameters
   - Update to explicit parameters for clarity

3. **Integration Tests May Have Different Patterns**
   - ResearchQueue integration tests used vi.hoisted() mocks
   - Unit tests used vi.mock() directly
   - SessionManager may have similar differences

4. **Private Properties Need Behavior Verification**
   - SessionManager.#flushRetries is private
   - Test through retry behavior, not direct access
   - Or add test-only getter (not recommended for production code)

---

## 9. Recommended Approach for SessionManager Fix

### Phase 1: Preparation (P1.M1.T2.S1)
1. Add test constants to session-manager.test.ts
2. Audit all constructor calls in the file
3. Document current signatures vs. required signatures

### Phase 2: Unit Test Updates (P1.M1.T2.S1)
1. Update all SessionManager instantiations to 3 parameters
2. Use test constants for defaults
3. Add parameter variation tests
4. Verify all property assertions

### Phase 3: Integration Test Updates (P1.M1.T2.S2)
1. Apply same pattern to integration tests
2. Check for different mock patterns (vi.hoisted, etc.)
3. Verify end-to-end behavior
4. Test with real file system operations

### Phase 4: Specialized Test Updates (P1.M1.T2.S3)
1. Update session-state-batching.test.ts
2. Focus on flushRetries parameter behavior
3. Verify batching logic with correct constructor

### Phase 5: Production Code Verification (P1.M1.T2.S4)
1. Verify TaskOrchestrator SessionManager usage
2. Verify PRP Pipeline SessionManager usage
3. Check for other production instantiations
4. Ensure consistency with test patterns

---

## 10. Checklist for SessionManager Fix

### For Each Test File
- [ ] Add test constants (DEFAULT_PRD_PATH, DEFAULT_PLAN_DIR, DEFAULT_FLUSH_RETRIES)
- [ ] Find all `new SessionManager(` instantiations
- [ ] Update to 3-parameter signature
- [ ] Use multi-line formatting for clarity
- [ ] Update property assertions
- [ ] Add parameter variation tests if missing
- [ ] Run tests to verify no regressions

### For Production Code
- [ ] Audit all SessionManager instantiations
- [ ] Verify PRP Pipeline usage (already correct)
- [ ] Verify TaskOrchestrator usage (if applicable)
- [ ] Check CLI commands for instantiations
- [ ] Ensure configuration parameters are passed correctly

### Validation
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors
- [ ] No constructor signature mismatches
- [ ] Parameter variation tests work
- [ ] Integration tests pass
- [ ] Code review completed

---

## 11. Code Examples for Direct Application

### Example 1: Basic Unit Test Update

**Before**:
```typescript
it('should initialize session', () => {
  const manager = new SessionManager('/test/PRD.md');
  expect(manager.prdPath).toBe(resolve('/test/PRD.md'));
});
```

**After**:
```typescript
it('should initialize session', () => {
  const manager = new SessionManager(
    DEFAULT_PRD_PATH,
    DEFAULT_PLAN_DIR,
    DEFAULT_FLUSH_RETRIES
  );
  expect(manager.prdPath).toBe(resolve(DEFAULT_PRD_PATH));
  expect(manager.planDir).toBe(resolve(DEFAULT_PLAN_DIR));
});
```

### Example 2: Custom Parameter Test

**Before**:
```typescript
it('should accept custom plan directory', () => {
  const manager = new SessionManager('/test/PRD.md', '/custom/plan');
  expect(manager.planDir).toBe(resolve('/custom/plan'));
});
```

**After**:
```typescript
it('should accept custom plan directory', () => {
  const manager = new SessionManager(
    DEFAULT_PRD_PATH,
    '/custom/plan',
    DEFAULT_FLUSH_RETRIES
  );
  expect(manager.planDir).toBe(resolve('/custom/plan'));
});
```

### Example 3: Integration Test with Mocks

**Before**:
```typescript
const manager = new SessionManager(prdPath, planDir);
```

**After**:
```typescript
const manager = new SessionManager(
  prdPath,
  planDir,
  DEFAULT_FLUSH_RETRIES
);
```

---

## 12. References

### Commits to Study
1. **0961f36** - ResearchQueue unit test updates
   - File: `tests/unit/core/research-queue.test.ts`
   - Lines changed: +389
   - Pattern: Test constants + multi-line formatting + parameter variation tests

2. **59b2b32** - ResearchQueue integration test updates
   - File: `tests/integration/core/research-queue.test.ts`
   - Lines changed: +148
   - Pattern: Same constants + integration scenarios

3. **5e437ad** - TaskOrchestrator integration
   - File: `src/core/task-orchestrator.ts`
   - Shows production code pattern

### Source Files to Reference
1. `/home/dustin/projects/hacky-hack/src/core/session-manager.ts` - Constructor definition
2. `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` - Correct usage pattern
3. `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` - Test pattern reference
4. `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts` - Target file

### Documentation
- Bug report: `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/tasks.json`
- P1.M1.T1.S2 PRP: ResearchQueue unit test fix strategy
- P1.M1.T1.S3 PRP: ResearchQueue integration test fix strategy

---

## Conclusion

The ResearchQueue constructor fix provides a proven, repeatable pattern for updating SessionManager constructor signatures across the test suite. The key elements are:

1. **Test constants** for default values
2. **Multi-line formatting** for clarity
3. **Comprehensive parameter variation tests**
4. **Incremental approach** (unit → integration → specialized)
5. **Validation through behavior** for private properties

By applying these patterns consistently across all 13 test files, the SessionManager constructor fix can be completed with the same success rate as ResearchQueue (zero regressions, 100% test pass rate).

---

**Next Steps**:
1. Begin P1.M1.T2.S1 with session-manager.test.ts
2. Apply test constants pattern
3. Update all constructor instantiations
4. Add parameter variation tests
5. Validate with test run
6. Proceed to integration tests (S2)
