# Research Summary: P1.M1.T1.S1 - Update TaskOrchestrator ResearchQueue Instantiation

## Overview

This research summary documents the comprehensive analysis conducted for creating the PRP (Product Requirement Prompt) for subtask P1.M1.T1.S1: "Update TaskOrchestrator ResearchQueue instantiation."

## Key Finding

**The TaskOrchestrator ResearchQueue instantiation at lines 161-166 is already correct.**

As of commit `6591868` (Add configurable PRP cache TTL with CLI support and validation), the TaskOrchestrator already passes all 4 required parameters to ResearchQueue:

```typescript
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  this.#researchQueueConcurrency,
  this.#noCache,
  this.#cacheTtlMs
);
```

This PRP serves as verification documentation and ensures tests are updated to match the correct implementation.

## Research Conducted

### 1. Codebase Analysis

#### ResearchQueue Constructor Signature
**File**: `src/core/research-queue.ts` (lines 94-106)

```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
)
```

**Parameters**:
- `sessionManager`: Session state manager for persistence
- `maxSize`: Max concurrent PRP generations (default: 3)
- `noCache`: Whether to bypass cache (default: false)
- `cacheTtlMs`: Cache TTL in milliseconds (default: 24 hours)

#### TaskOrchestrator Current Implementation
**File**: `src/core/task-orchestrator.ts` (lines 161-166)

**Current State**: ✅ CORRECT - All 4 parameters are passed

```typescript
this.researchQueue = new ResearchQueue(
  this.sessionManager,           // ✓ Parameter 1
  this.#researchQueueConcurrency, // ✓ Parameter 2
  this.#noCache,                 // ✓ Parameter 3
  this.#cacheTtlMs              // ✓ Parameter 4
);
```

#### TaskOrchestrator Constructor Parameters
**File**: `src/core/task-orchestrator.ts` (lines 132-146)

```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard',
  retryConfig?: Partial<TaskRetryConfig>
)
```

### 2. Architecture Documentation Review

#### Bug Report Analysis
**File**: `plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/prd_snapshot.md`

**Issue 1** (lines 11-33): ResearchQueue Constructor Signature Mismatch

**Original Bug Report States**:
> "Tests expect `new ResearchQueue(sessionManager, noCache)` but the actual constructor requires 4 parameters"

**Current Status**: ✅ FIXED
- The bug report was based on an older state of the codebase
- Commit `6591868` added the missing `cacheTtlMs` parameter
- Commit `dcc3b9b` added configurable research queue concurrency

### 3. Test Pattern Analysis

#### ResearchQueue Unit Tests
**File**: `tests/unit/core/research-queue.test.ts`

**Test Patterns**:
- Uses Vitest framework with `vi.mock()` for mocking
- Factory functions for test data (`createTestSubtask`, `createTestPRPDocument`)
- Mock SessionManager with minimal interface
- Test structure: SETUP, EXECUTE, VERIFY

**Issue Found**: Line 278 expects PRPGenerator to be called with 2 parameters:
```typescript
expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, false);
```

**Actual Call**: PRPGenerator is called with 3 parameters:
```typescript
new PRPGenerator(sessionManager, noCache, cacheTtlMs)
```

**Resolution**: Since PRPGenerator has default parameters for cacheTtlMs and prpCompression, the code works correctly at runtime. The test assertion could be updated to expect 3 parameters or use partial matching.

#### TaskOrchestrator Unit Tests
**File**: `tests/unit/core/task-orchestrator.test.ts`

**Test Patterns**:
- Constructor tests verify readonly properties are stored
- Tests check for proper error handling (null session)
- Mock SessionManager with active session state

### 4. CLI Integration Analysis

#### CLI Options
**File**: `src/cli/index.ts` (lines 50-80)

```typescript
--research-concurrency <n>    Max concurrent research tasks (1-10, default: 3)
--no-cache                    Bypass cache and regenerate all PRPs
--cache-ttl <duration>        PRP cache TTL (e.g., 24h, 1d, 12h, default: 24h)
```

**Duration Parsing**: Uses `ms` package
- Supports formats: `30s`, `5m`, `1h`, `12h`, `1d`, `24h`, `1w`
- Default: `24h` (86400000ms)
- Environment variable: `HACKY_PRP_CACHE_TTL`

### 5. Related Components

#### PRPGenerator Constructor
**File**: `src/agents/prp-generator.ts` (lines 194-199)

```typescript
constructor(
  sessionManager: SessionManager,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard'
)
```

**Called by ResearchQueue** (line 105):
```typescript
this.#prpGenerator = new PRPGenerator(sessionManager, noCache, cacheTtlMs);
```

**Note**: ResearchQueue does NOT pass `prpCompression` parameter, so PRPGenerator uses the default `'standard'` value.

## External Research Summary

### TypeScript Constructor Best Practices

**Key Insights**:
1. **Default Parameters Enable Backwards Compatibility**: Adding optional parameters with defaults is a non-breaking change
2. **Parameter Order Matters**: Positional parameters must match the constructor signature exactly
3. **Required Parameters First**: Always put required parameters before optional parameters
4. **Sensible Defaults**: Default values should be production-safe

**Constructor Evolution**:
- ✅ **Safe**: Adding optional parameters with defaults
- ✅ **Safe**: Adding optional parameters without defaults
- ❌ **Breaking**: Making optional parameters required
- ❌ **Breaking**: Changing parameter order
- ❌ **Breaking**: Removing parameters

## Codebase Structure

```
src/
├── core/
│   ├── task-orchestrator.ts       # Lines 161-166: ResearchQueue instantiation
│   ├── research-queue.ts          # Lines 94-106: Constructor signature
│   ├── session-manager.ts         # Session state management
│   └── models.ts                  # Type definitions
├── agents/
│   └── prp-generator.ts           # Lines 194-199: PRPGenerator constructor
├── cli/
│   └── index.ts                   # CLI option definitions
└── utils/
    └── logger.ts                  # Logging utilities

tests/
├── unit/
│   └── core/
│       ├── task-orchestrator.test.ts   # TaskOrchestrator unit tests
│       └── research-queue.test.ts      # ResearchQueue unit tests
└── integration/
    └── core/
        └── task-orchestrator.test.ts   # Integration tests
```

## Validation Commands

### Level 1: Syntax & Style
```bash
npm run typecheck    # TypeScript compilation
npm run lint         # ESLint checking
npm run format:check # Prettier formatting
```

### Level 2: Unit Tests
```bash
npm test -- tests/unit/core/research-queue.test.ts
npm test -- tests/unit/core/task-orchestrator.test.ts
```

### Level 3: Integration Tests
```bash
npm test -- tests/integration/core/task-orchestrator.test.ts
npm test -- tests/integration/core/research-queue.test.ts
```

### Level 4: Full Test Suite
```bash
npm test            # All tests with coverage
```

## Known Gotchas

1. **Parameter Order is Strict**: ResearchQueue requires `(sessionManager, maxSize, noCache, cacheTtlMs)` - do not reorder
2. **Default Parameters Allow Backwards Compatibility**: Tests may call with fewer parameters
3. **PRPGenerator has 4th Parameter**: ResearchQueue doesn't pass `prpCompression`, so PRPGenerator uses default
4. **Private Fields Use # Syntax**: `this.#researchQueueConcurrency`, `this.#noCache`, `this.#cacheTtlMs`
5. **Duration Parsing Uses 'ms' Package**: CLI --cache-ttl accepts "30s", "5m", "1h", "12h", "1d", "24h", "1w"

## Success Criteria

- [ ] TaskOrchestrator lines 161-166 pass all 4 parameters to ResearchQueue
- [ ] Parameters are: `this.sessionManager`, `this.#researchQueueConcurrency`, `this.#noCache`, `this.#cacheTtlMs`
- [ ] TypeScript compilation succeeds with no errors
- [ ] Unit tests pass: `npm test -- tests/unit/core/research-queue.test.ts`
- [ ] Integration tests pass: `npm test -- tests/integration/core/task-orchestrator.test.ts`

## Conclusion

The TaskOrchestrator ResearchQueue instantiation is **already correct** as of commit `6591868`. This PRP serves as:
1. **Verification documentation** confirming the correct implementation
2. **Context preservation** for future maintainers
3. **Test guidance** for ensuring test assertions match the implementation

The comprehensive research conducted ensures that the PRP contains all necessary context for one-pass implementation success, including exact file paths, line numbers, constructor signatures, test patterns, validation commands, and known gotchas.

**Confidence Score**: 10/10 - The implementation is straightforward verification with clear success criteria.
