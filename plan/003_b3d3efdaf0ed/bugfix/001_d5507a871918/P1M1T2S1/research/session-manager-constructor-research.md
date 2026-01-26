# SessionManager Constructor Research Summary

**Work Item**: P1.M1.T2.S1 - Update SessionManager unit test constructor calls
**Research Date**: 2026-01-26
**Research Agent**: Claude (Research Mode)

---

## Executive Summary

This research document compiles all findings for updating SessionManager constructor calls in unit tests. The SessionManager constructor requires 3 parameters `(prdPath, planDir, flushRetries)` but tests currently pass only 2 parameters `(prdPath, flushRetries)`, missing the planDir parameter entirely.

---

## Table of Contents

1. [Constructor Signature Analysis](#1-constructor-signature-analysis)
2. [Current Test Patterns](#2-current-test-patterns)
3. [Files Requiring Updates](#3-files-requiring-updates)
4. [Test Fixtures and Patterns](#4-test-fixtures-and-patterns)
5. [ResearchQueue Fix Patterns](#5-researchqueue-fix-patterns)
6. [Implementation Strategy](#6-implementation-strategy)
7. [Validation Commands](#7-validation-commands)

---

## 1. Constructor Signature Analysis

### SessionManager Constructor

**File**: `src/core/session-manager.ts:190-219`

```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
) {
  // PRD file validation (synchronous)
  try {
    const stats = statSync(prdPath);
    if (!stats.isFile()) {
      throw new SessionFileError(prdPath, 'stat', new Error('Not a file'));
    }
  } catch (error) {
    // Handle ENOENT and other errors
  }

  // Store parameters
  this.prdPath = prdPath;
  this.planDir = planDir;
  this.flushRetries = flushRetries;
}
```

### Parameter Details

| Parameter | Type | Default | Purpose |
|-----------|------|---------|---------|
| `prdPath` | string | (required) | Path to PRD markdown file |
| `planDir` | string | `resolve('plan')` | Plan directory for sessions |
| `flushRetries` | number | `3` | Max retry attempts for I/O operations |

### Critical Issue

**Current Test Pattern** (INCORRECT):
```typescript
new SessionManager(prdPath, flushRetries)
// This passes flushRetries to planDir parameter!
```

**Correct Pattern**:
```typescript
new SessionManager(prdPath, resolve('plan'), flushRetries)
```

---

## 2. Current Test Patterns

### Primary Test File

**File**: `tests/unit/core/session-manager.test.ts`
- **Size**: ~1000+ lines
- **Constructor Calls**: ~200 instantiations
- **Test Structure**: Vitest with comprehensive mocking

### Current Mock Setup

```typescript
// Mock node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Mock node:fs module for synchronous operations
vi.mock('node:fs', () => ({
  statSync: vi.fn(),
  readdir: vi.fn(),
}));

// Mock session-utils module
vi.mock('../../../src/core/session-utils.js', () => ({
  hashPRD: vi.fn(),
  createSessionDirectory: vi.fn(),
  readTasksJSON: vi.fn(),
  writeTasksJSON: vi.fn(),
  SessionFileError: class extends Error { /* ... */ },
}));
```

### Current Test Patterns Found

```typescript
// Pattern 1: Single parameter (uses default planDir and flushRetries)
const manager = new SessionManager('/test/PRD.md');

// Pattern 2: Two parameters (INCORRECT - missing planDir)
const manager = new SessionManager(prdPath, flushRetries);

// Pattern 3: With variable assignments
const sessionManager = new SessionManager(prdPath, planDir);

// Pattern 4: In beforeeach/setup blocks
beforeEach(() => {
  manager = new SessionManager(prdPath, planDir);
});
```

---

## 3. Files Requiring Updates

### Unit Tests (Primary Focus for P1.M1.T2.S1)

| File | Constructor Calls | Priority |
|------|-------------------|----------|
| `tests/unit/core/session-manager.test.ts` | ~200 | **HIGH** (P1.M1.T2.S1) |
| `tests/unit/core/session-state-batching.test.ts` | 1 | **MEDIUM** (P1.M1.T2.S3) |

### Integration Tests (Future Subtasks)

| File | Constructor Calls | Priority |
|------|-------------------|----------|
| `tests/integration/session-structure.test.ts` | 5 | P1.M1.T2.S2 |
| `tests/integration/tasks-json-authority.test.ts` | 5 | P1.M1.T2.S2 |
| `tests/integration/delta-resume-regeneration.test.ts` | 5 | P1.M1.T2.S2 |
| `tests/integration/prp-generator-integration.test.ts` | 2 | P1.M1.T2.S2 |
| `tests/integration/prp-runtime-integration.test.ts` | 1 | P1.M1.T2.S2 |
| `tests/integration/scope-resolution.test.ts` | 1 | P1.M1.T2.S2 |
| `tests/integration/prd-task-command.test.ts` | 1 | P1.M1.T2.S2 |

### Summary

- **Total Test Files**: 9 files
- **Total Constructor Calls**: ~220+ instantiations
- **Primary Target**: `tests/unit/core/session-manager.test.ts` (~200 calls)

---

## 4. Test Fixtures and Patterns

### Mock PRD Content

**File**: `tests/fixtures/simple-prd.ts`

```typescript
export const mockSimplePRD = `
# Test Project
A minimal project for fast E2E pipeline testing.
## P1: Test Phase
Validate pipeline functionality with minimal complexity.
### P1.M1: Test Milestone
Create a simple hello world implementation.
#### P1.M1.T1: Create Hello World
Implement a basic hello world function with tests.
`;
```

### Path Mocking Pattern

```typescript
// PRD Path Pattern
const prdPath = join(tempDir, 'PRD.md');

// Plan Directory Pattern
const planDir = join(tempDir, 'plan');

// For unit tests (with mocks)
const prdPath = '/test/PRD.md';
const planDir = resolve('plan');
```

### Test Setup Pattern

```typescript
// Integration test setup
let tempDir: string;
let planDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'session-structure-test-'));
  planDir = join(tempDir, 'plan');
});

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
```

---

## 5. ResearchQueue Fix Patterns

### Lessons from P1.M1.T1 (ResearchQueue Constructor Fix)

**Reference**: `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S1/PRP.md`

#### Pattern 1: Test Constants

**From**: `tests/unit/core/research-queue.test.ts`

```typescript
// Test constants at top of file
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Usage in tests
const queue = new ResearchQueue(
  mockManager,
  DEFAULT_MAX_SIZE,
  DEFAULT_NO_CACHE,
  DEFAULT_CACHE_TTL_MS
);
```

**Apply to SessionManager**:

```typescript
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = 'plan';
const DEFAULT_FLUSH_RETRIES = 3;

// Usage
const manager = new SessionManager(
  DEFAULT_PRD_PATH,
  resolve(DEFAULT_PLAN_DIR),
  DEFAULT_FLUSH_RETRIES
);
```

#### Pattern 2: Multi-line Formatting

**Instead of**:
```typescript
new ResearchQueue(sessionManager, maxSize, noCache, cacheTtlMs)
```

**Use**:
```typescript
new ResearchQueue(
  sessionManager,
  maxSize,
  noCache,
  cacheTtlMs
)
```

**Benefits**:
- Easy to spot missing parameters
- Clear parameter separation
- Better code review experience

#### Pattern 3: Parameter Variation Tests

**From**: ResearchQueue fix

```typescript
describe('noCache parameter', () => {
  it('should use default noCache when not provided', () => {
    // Test default behavior
  });

  it('should accept custom noCache value', () => {
    // Test custom value
  });
});

describe('cacheTtlMs parameter', () => {
  it('should use default cacheTtlMs when not provided', () => {
    // Test default behavior
  });

  it('should accept custom cacheTtlMs value', () => {
    // Test custom value
  });
});
```

**Apply to SessionManager**:

```typescript
describe('planDir parameter', () => {
  it('should use resolve("plan") as default when not provided', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager('/test/PRD.md');
    expect(manager.planDir).toContain('plan');
  });

  it('should accept custom planDir', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const customPlanDir = '/custom/plan';
    const manager = new SessionManager('/test/PRD.md', customPlanDir);
    expect(manager.planDir).toBe(customPlanDir);
  });
});
```

---

## 6. Implementation Strategy

### Step-by-Step Approach

1. **Add Import Statement**
   ```typescript
   import { resolve } from 'node:path';
   ```

2. **Add Test Constants**
   ```typescript
   const DEFAULT_PRD_PATH = '/test/PRD.md';
   const DEFAULT_PLAN_DIR = 'plan';
   const DEFAULT_FLUSH_RETRIES = 3;
   ```

3. **Update Constructor Calls**
   - Find all `new SessionManager(...)` calls
   - Add `resolve('plan')` as second parameter
   - Use multi-line formatting for clarity

4. **Add Parameter Variation Tests**
   - Test default planDir behavior
   - Test custom planDir value
   - Test all three parameters together

5. **Validate**
   - Run TypeScript compilation
   - Run unit tests
   - Verify coverage remains at 100%

### Search and Replace Patterns

```bash
# Find all constructor calls
grep -n "new SessionManager(" tests/unit/core/session-manager.test.ts

# Find incorrect patterns (missing planDir)
grep -n "new SessionManager(prdPath, flushRetries)" tests/unit/core/session-manager.test.ts

# Verify resolve import
grep "import.*resolve.*from" tests/unit/core/session-manager.test.ts
```

---

## 7. Validation Commands

### Level 1: Syntax & Style

```bash
npm run typecheck    # TypeScript compilation
npm run lint         # ESLint checking
npm run format:check # Prettier formatting
```

### Level 2: Unit Tests

```bash
# Primary target
npm test -- tests/unit/core/session-manager.test.ts

# All core unit tests
npm test -- tests/unit/core/

# With coverage
npm test -- tests/unit/core/session-manager.test.ts --coverage
```

### Level 3: Integration Tests

```bash
# May fail until P1.M1.T2.S2 is complete
npm test -- tests/integration/session-structure.test.ts
npm test -- tests/integration/tasks-json-authority.test.ts
```

### Level 4: Manual Verification

```bash
# Verify constructor pattern
grep -n "new SessionManager(" tests/unit/core/session-manager.test.ts | head -20

# Verify no old patterns remain
grep -n "new SessionManager(prdPath, flushRetries)" tests/unit/core/session-manager.test.ts

# Verify test constants
grep "DEFAULT_PRD_PATH\|DEFAULT_PLAN_DIR\|DEFAULT_FLUSH_RETRIES" tests/unit/core/session-manager.test.ts
```

---

## Appendix: Code Examples

### Before (Incorrect)

```typescript
describe('constructor', () => {
  it('should validate PRD file exists synchronously', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager('/test/PRD.md');
    expect(mockStatSync).toHaveBeenCalledWith('/test/PRD.md');
    expect(manager.prdPath).toBe('/test/PRD.md');
    expect(manager.planDir).toContain('plan');
  });

  it('should throw SessionFileError when PRD does not exist', () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockStatSync.mockImplementation(() => { throw error; });
    expect(() => new SessionManager('/test/PRD.md')).toThrow(SessionFileError);
  });
});
```

### After (Correct)

```typescript
// Add import
import { resolve } from 'node:path';

// Add test constants
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = 'plan';
const DEFAULT_FLUSH_RETRIES = 3;

describe('constructor', () => {
  it('should validate PRD file exists synchronously', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager(
      DEFAULT_PRD_PATH,
      resolve(DEFAULT_PLAN_DIR)
    );
    expect(mockStatSync).toHaveBeenCalledWith(DEFAULT_PRD_PATH);
    expect(manager.prdPath).toBe(DEFAULT_PRD_PATH);
    expect(manager.planDir).toContain('plan');
  });

  it('should throw SessionFileError when PRD does not exist', () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockStatSync.mockImplementation(() => { throw error; });
    expect(() => new SessionManager(
      DEFAULT_PRD_PATH,
      resolve(DEFAULT_PLAN_DIR)
    )).toThrow(SessionFileError);
  });
});

// Add parameter variation tests
describe('planDir parameter', () => {
  it('should use resolve("plan") as default when not provided', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const manager = new SessionManager(DEFAULT_PRD_PATH);
    expect(manager.planDir).toContain('plan');
  });

  it('should accept custom planDir', () => {
    mockStatSync.mockReturnValue({ isFile: () => true });
    const customPlanDir = '/custom/plan';
    const manager = new SessionManager(
      DEFAULT_PRD_PATH,
      customPlanDir
    );
    expect(manager.planDir).toBe(customPlanDir);
  });

  it('should work with all three parameters', () => {
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

---

## References

- **Bug Report**: `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/prd_snapshot.md`
- **SessionManager Source**: `src/core/session-manager.ts:190-219`
- **ResearchQueue Fix PRP**: `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T1S1/PRP.md`
- **Vitest Documentation**: https://vitest.dev/guide/mocking.html
- **Node.js Path Module**: https://nodejs.org/api/path.html
