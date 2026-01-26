# Constructor Update Quick Reference for P1.M1.T2

**Bugfix ID:** 001_d5507a871918
**Task:** P1.M1.T2 - Fix SessionManager Constructor Signature
**Date:** 2025-01-26

## Objective

Update 23 test files to use the correct SessionManager constructor signature:
```typescript
// OLD (incorrect)
new SessionManager(prdPath, flushRetries)

// NEW (correct)
new SessionManager(prdPath, planDir, flushRetries)
```

## Quick Start Pattern

### 1. Add Test Constants (Top of File)

```typescript
// Test constants for SessionManager constructor
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = 'plan'; // Will be resolved to absolute path
const DEFAULT_FLUSH_RETRIES = 3;
```

### 2. Import resolve from node:path

```typescript
import { resolve } from 'node:path';
```

### 3. Update beforeEach to Mock statSync

```typescript
describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatSync.mockReturnValue({ isFile: () => true });
  });

  // tests...
});
```

### 4. Update Constructor Calls

```typescript
// BEFORE
const manager = new SessionManager('/test/PRD.md', 3);

// AFTER
const manager = new SessionManager(DEFAULT_PRD_PATH, resolve(DEFAULT_PLAN_DIR), DEFAULT_FLUSH_RETRIES);
```

## Common Update Patterns

### Pattern A: Basic Constructor Update

```typescript
// Find this pattern
it('should do something', () => {
  const manager = new SessionManager('/test/PRD.md', 3);
  // ...test logic
});

// Replace with
it('should do something', () => {
  const manager = new SessionManager(DEFAULT_PRD_PATH, resolve(DEFAULT_PLAN_DIR), DEFAULT_FLUSH_RETRIES);
  // ...test logic
});
```

### Pattern B: Variable Parameters

```typescript
// Find this pattern
it('should accept custom flushRetries', () => {
  const manager = new SessionManager('/test/PRD.md', 5);
  expect(manager.flushRetries).toBe(5);
});

// Replace with
it('should accept custom flushRetries', () => {
  const manager = new SessionManager(DEFAULT_PRD_PATH, resolve(DEFAULT_PLAN_DIR), 5);
  expect(manager.flushRetries).toBe(5);
});
```

### Pattern C: Custom PRD Path

```typescript
// Find this pattern
it('should handle custom PRD path', () => {
  const customPath = '/custom/PRD.md';
  const manager = new SessionManager(customPath, 3);
  expect(manager.prdPath).toBe(customPath);
});

// Replace with
it('should handle custom PRD path', () => {
  const customPath = '/custom/PRD.md';
  const manager = new SessionManager(customPath, resolve(DEFAULT_PLAN_DIR), DEFAULT_FLUSH_RETRIES);
  expect(manager.prdPath).toBe(customPath);
});
```

### Pattern D: All Custom Parameters

```typescript
it('should accept all custom parameters', () => {
  const customPath = '/custom/PRD.md';
  const customPlanDir = '/custom/plan';
  const customRetries = 5;

  const manager = new SessionManager(customPath, resolve(customPlanDir), customRetries);

  expect(manager.prdPath).toBe(customPath);
  expect(manager.planDir).toContain(customPlanDir);
  expect(manager.flushRetries).toBe(customRetries);
});
```

## Factory Function Pattern (Optional)

For files with many SessionManager instantiations:

```typescript
// Add factory function after test constants
const createTestSessionManager = (
  prdPath: string = DEFAULT_PRD_PATH,
  planDir: string = DEFAULT_PLAN_DIR,
  flushRetries: number = DEFAULT_FLUSH_RETRIES
): SessionManager => {
  return new SessionManager(prdPath, resolve(planDir), flushRetries);
};

// Use in tests
it('should work with defaults', () => {
  const manager = createTestSessionManager();
  expect(manager).toBeDefined();
});

it('should work with custom flushRetries', () => {
  const manager = createTestSessionManager(undefined, undefined, 5);
  expect(manager.flushRetries).toBe(5);
});
```

## File-by-File Update Checklist

Based on tasks.json, these files need updating:

### Unit Tests
- [ ] `tests/unit/core/session-manager.test.ts` (P1.M1.T2.S1) - PRIMARY FILE
- [ ] `tests/unit/core/session-state-batching.test.ts` (P1.M1.T2.S3)
- [ ] `tests/unit/core/checkpoint-manager.test.ts`
- [ ] `tests/unit/core/task-orchestrator.test.ts` (P1.M1.T2.S4)
- [ ] `tests/unit/agents/prp-generator.test.ts`
- [ ] `tests/unit/agents/prp-runtime.test.ts`
- [ ] `tests/unit/workflows/prp-pipeline.test.ts`
- [ ] `tests/unit/workflows/fix-cycle-workflow.test.ts`

### Integration Tests
- [ ] `tests/integration/core/session-manager.test.ts` (P1.M1.T2.S2)
- [ ] `tests/integration/core/delta-session.test.ts`
- [ ] `tests/integration/core/session-structure.test.ts`
- [ ] `tests/integration/prp-pipeline-integration.test.ts`
- [ ] `tests/integration/prp-runtime-integration.test.ts`
- [ ] `tests/integration/bug-hunt-workflow-integration.test.ts`
- [ ] `tests/integration/fix-cycle-workflow-integration.test.ts`
- [ ] `tests/integration/prp-generator-integration.test.ts`

## Validation Tests to Add

After updating, add these tests to verify the new parameter:

```typescript
describe('planDir parameter', () => {
  it('should accept planDir as second parameter', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const customPlanDir = '/custom/plan/path';

    const manager = new SessionManager(DEFAULT_PRD_PATH, customPlanDir, DEFAULT_FLUSH_RETRIES);

    expect(manager.planDir).toContain(customPlanDir);
  });

  it('should resolve relative planDir to absolute path', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });

    const manager = new SessionManager(DEFAULT_PRD_PATH, resolve('plan'), DEFAULT_FLUSH_RETRIES);

    expect(manager.planDir).toMatch(/^\/.*plan$/);
  });

  it('should use default plan directory when not specified', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });

    const manager = new SessionManager(DEFAULT_PRD_PATH, resolve(DEFAULT_PLAN_DIR), DEFAULT_FLUSH_RETRIES);

    expect(manager.planDir).toContain('plan');
  });
});

describe('constructor with all three parameters', () => {
  it('should accept all three parameters', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });

    const manager = new SessionManager(
      DEFAULT_PRD_PATH,
      resolve(DEFAULT_PLAN_DIR),
      5
    );

    expect(manager.prdPath).toBe(DEFAULT_PRD_PATH);
    expect(manager.planDir).toContain('plan');
    expect(manager.flushRetries).toBe(5);
  });
});
```

## Verification Commands

```bash
# Find all files that need updating
grep -r "new SessionManager(" tests/ --include="*.test.ts" | grep -v "node_modules"

# Run specific test file
npm test -- tests/unit/core/session-manager.test.ts

# Run all affected tests
npm test -- tests/unit/core/session-manager.test.ts tests/integration/core/session-manager.test.ts

# Check for any remaining 2-parameter calls
grep -r "new SessionManager(.*," tests/ --include="*.test.ts" | grep -v "node_modules" | grep -v "resolve"
```

## Common Errors and Fixes

### Error 1: "Expected 3 arguments, but got 2"

**Cause:** Still using old 2-parameter signature.

**Fix:**
```typescript
// BEFORE
new SessionManager(prdPath, flushRetries)

// AFTER
new SessionManager(prdPath, resolve(planDir), flushRetries)
```

### Error 2: "Cannot read property 'isFile' of undefined"

**Cause:** Missing `mockStatSync.mockReturnValue({ isFile: () => true })` in beforeEach.

**Fix:**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  mockStatSync.mockReturnValue({ isFile: () => true });
});
```

### Error 3: Tests failing with ENOENT errors

**Cause:** Not mocking file system operations correctly.

**Fix:** Ensure all fs operations are mocked:
```typescript
vi.mock('node:fs', () => ({
  statSync: vi.fn(),
}));

const mockStatSync = statSync as any;

beforeEach(() => {
  mockStatSync.mockReturnValue({ isFile: () => true });
});
```

## Success Criteria

A test file is successfully updated when:

1. [ ] All `new SessionManager()` calls use 3 parameters
2. [ ] `resolve()` is imported from 'node:path'
3. [ ] `DEFAULT_*` constants are defined at the top
4. [ ] `mockStatSync.mockReturnValue({ isFile: () => true })` in beforeEach
5. [ ] All tests pass with `npm test`
6. [ ] No TypeScript compilation errors
7. [ ] Coverage remains at 100%

## Related Documentation

- **Full Research:** `vitest-constructor-update-patterns.md`
- **Task Context:** `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/tasks.json`
- **Example Implementation:** `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` (lines 102-104, 135-140)

## Notes

- The planDir parameter must be the **second** parameter (between prdPath and flushRetries)
- Use `resolve()` to convert relative paths to absolute paths
- The order matters: `(prdPath, planDir, flushRetries)`
- Test constants should match production defaults where applicable
- Integration tests may use temp directories instead of 'plan'

---

**Version:** 1.0
**Status:** Ready for Implementation
**Next Step:** Start with P1.M1.T2.S1 (unit tests), then P1.M1.T2.S2 (integration tests)
