# Code Snippets Reference for P1.M1.T1.S1

## Exact Code Locations

### ResearchQueue Constructor Signature

**File**: `src/core/research-queue.ts`
**Lines**: 94-106

```typescript
/**
 * Creates a new ResearchQueue
 *
 * @param sessionManager - Session state manager
 * @param maxSize - Max concurrent PRP generations (default 3)
 * @param noCache - Whether to bypass cache (default: false)
 * @param cacheTtlMs - Cache TTL in milliseconds (default: 24 hours)
 * @throws {Error} If no session is active in SessionManager
 */
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
) {
  this.#logger = getLogger('ResearchQueue');
  this.sessionManager = sessionManager;
  this.maxSize = maxSize;
  this.#noCache = noCache;
  this.#cacheTtlMs = cacheTtlMs;
  this.#prpGenerator = new PRPGenerator(sessionManager, noCache, cacheTtlMs);
}
```

### TaskOrchestrator ResearchQueue Instantiation

**File**: `src/core/task-orchestrator.ts`
**Lines**: 161-166

```typescript
// Initialize ResearchQueue with configurable concurrency and cache TTL
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  this.#researchQueueConcurrency,
  this.#noCache,
  this.#cacheTtlMs
);
```

**Status**: ✅ **CORRECT** - All 4 parameters are passed

### TaskOrchestrator Constructor

**File**: `src/core/task-orchestrator.ts`
**Lines**: 132-146

```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard',
  retryConfig?: Partial<TaskRetryConfig>
) {
  this.#logger = getLogger('TaskOrchestrator');
  this.sessionManager = sessionManager;
  this.#noCache = noCache;
  this.#researchQueueConcurrency = researchQueueConcurrency;
  this.#cacheTtlMs = cacheTtlMs;
  this.#prpCompression = prpCompression;
```

### TaskOrchestrator ResearchQueue Debug Logging

**File**: `src/core/task-orchestrator.ts`
**Lines**: 167-170

```typescript
this.#logger.debug(
  { maxSize: this.#researchQueueConcurrency, cacheTtlMs: this.#cacheTtlMs },
  'ResearchQueue initialized'
);
```

### PRPGenerator Constructor

**File**: `src/agents/prp-generator.ts`
**Lines**: 194-199

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

**Note**: ResearchQueue does NOT pass the 4th parameter (`prpCompression`), so PRPGenerator uses the default `'standard'` value.

## CLI Integration

### CLI Option Definitions

**File**: `src/cli/index.ts`

```typescript
.option('--research-concurrency <n>', 'Max concurrent research tasks (1-10, default: 3)')
.option('--no-cache', 'Bypass cache and regenerate all PRPs')
.option('--cache-ttl <duration>', 'PRP cache TTL (e.g., 24h, 1d, 12h, default: 24h)')
```

### Duration Parsing

The `--cache-ttl` option uses the `ms` package for parsing:

```typescript
import ms from 'ms';

// Examples:
ms('30s'); // 30000
ms('5m'); // 300000
ms('1h'); // 3600000
ms('12h'); // 43200000
ms('1d'); // 86400000
ms('24h'); // 86400000
ms('1w'); // 604800000
```

## Test Patterns

### ResearchQueue Test Pattern

**File**: `tests/unit/core/research-queue.test.ts`

```typescript
describe('constructor', () => {
  it('should store sessionManager as readonly property', () => {
    // SETUP: Create mock session manager with active session
    const currentSession = {
      metadata: {
        id: '001_14b9dc2a33c7',
        hash: '14b9dc2a33c7',
        path: '/plan/001_14b9dc2a33c7',
        createdAt: new Date(),
        parentSession: null,
      },
      prdSnapshot: '# Test PRD',
      taskRegistry: createTestBacklog([]),
      currentItemId: null,
    };
    const mockManager = createMockSessionManager(currentSession);
    const mockGenerate = vi
      .fn()
      .mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));
    MockPRPGenerator.mockImplementation(() => ({
      generate: mockGenerate,
    }));

    // EXECUTE
    const queue = new ResearchQueue(mockManager, 3);

    // VERIFY
    expect(queue.sessionManager).toBe(mockManager);
  });

  it('should set maxSize from constructor parameter', () => {
    // SETUP (same as above)

    // EXECUTE
    const queue = new ResearchQueue(mockManager, 5);

    // VERIFY
    expect(queue.maxSize).toBe(5);
  });

  it('should use default maxSize when not provided', () => {
    // SETUP (same as above)

    // EXECUTE
    const queue = new ResearchQueue(mockManager);

    // VERIFY
    expect(queue.maxSize).toBe(3); // Default value
  });

  it('should create PRPGenerator with sessionManager', () => {
    // SETUP (same as above)

    // EXECUTE
    new ResearchQueue(mockManager, 3);

    // VERIFY
    // NOTE: PRPGenerator is called with 3 params: (sessionManager, noCache, cacheTtlMs)
    // The test assertion may need updating:
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      false, // noCache default
      24 * 60 * 60 * 1000 // cacheTtlMs default
    );
  });
});
```

### Mock SessionManager Factory

**File**: `tests/unit/core/research-queue.test.ts`

```typescript
const createMockSessionManager = (currentSession: any): SessionManager => {
  const mockManager = {
    currentSession,
  } as unknown as SessionManager;
  return mockManager;
};
```

### Mock PRPGenerator Setup

**File**: `tests/unit/core/research-queue.test.ts`

```typescript
// Mock the prp-generator module
vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn(),
}));

// Import PRPGenerator after mocking to access the mock
import { PRPGenerator } from '../../../src/agents/prp-generator.js';

// Cast mocked constructor
const MockPRPGenerator = PRPGenerator as any;

// Use in tests
const mockGenerate = vi
  .fn()
  .mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));
MockPRPGenerator.mockImplementation(() => ({
  generate: mockGenerate,
}));
```

## Validation Commands

### Quick Validation

```bash
# Type check only
npm run typecheck

# Lint only
npm run lint

# Format check only
npm run format:check

# Run specific test file
npm test -- tests/unit/core/research-queue.test.ts

# Run with coverage
npm run test:coverage
```

### Full Validation

```bash
# Complete validation (typecheck + lint + format + tests)
npm run validate

# All tests with coverage
npm test

# Integration tests only
npm test -- tests/integration/
```

## Expected Output

### Successful Type Check

```bash
$ npm run typecheck

> hacky-hack@1.0.0 typecheck
> tsc --noEmit

✓ Type checking complete (0 errors)
```

### Successful Test Run

```bash
$ npm test -- tests/unit/core/research-queue.test.ts

> hacky-hack@1.0.0 test
> vitest run tests/unit/core/research-queue.test.ts

 ✓ tests/unit/core/research-queue.test.ts (50)
   ✓ constructor (4)
     ✓ should store sessionManager as readonly property
     ✓ should set maxSize from constructor parameter
     ✓ should use default maxSize when not provided
     ✓ should create PRPGenerator with sessionManager

 Test Files  1 passed (1)
      Tests  50 passed (50)
   Start at  10:30:00
   Duration  2.5s
```

## Git History

### Relevant Commits

```bash
# Commit that added cacheTtlMs parameter support
6591868 Add configurable PRP cache TTL with CLI support and validation

# Commit that added researchQueueConcurrency parameter support
dcc3b9b Add configurable research queue concurrency with environment variable support and validation

# Commit that added initial ResearchQueue implementation
bb642bc feat: Implement PRP disk-based caching with CLI bypass and metrics tracking

# Commit that integrated ResearchQueue with TaskOrchestrator
5e437ad feat: Integrate ResearchQueue with TaskOrchestrator for parallel PRP generation and caching
```

## Configuration Values

### Default Values

| Parameter        | Default Value | Type    | Description                          |
| ---------------- | ------------- | ------- | ------------------------------------ |
| `maxSize`        | 3             | number  | Max concurrent PRP generations       |
| `noCache`        | false         | boolean | Whether to bypass cache              |
| `cacheTtlMs`     | 86400000      | number  | Cache TTL in milliseconds (24 hours) |
| `prpCompression` | 'standard'    | string  | PRP compression level                |

### Environment Variables

| Variable                     | Description                   | Default |
| ---------------------------- | ----------------------------- | ------- |
| `HACKY_PRP_CACHE_TTL`        | PRP cache TTL duration        | "24h"   |
| `HACKY_RESEARCH_CONCURRENCY` | Max concurrent research tasks | "3"     |

## Common Errors and Solutions

### Error: Missing Constructor Parameter

```typescript
// WRONG: Missing cacheTtlMs parameter
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  this.#researchQueueConcurrency,
  this.#noCache
  // Missing: this.#cacheTtlMs
);

// CORRECT: All 4 parameters
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  this.#researchQueueConcurrency,
  this.#noCache,
  this.#cacheTtlMs
);
```

### Error: Wrong Parameter Order

```typescript
// WRONG: Wrong parameter order
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  this.#cacheTtlMs, // Wrong: should be 2nd
  this.#researchQueueConcurrency, // Wrong: should be 4th
  this.#noCache
);

// CORRECT: Correct parameter order
this.researchQueue = new ResearchQueue(
  this.sessionManager, // 1st: sessionManager
  this.#researchQueueConcurrency, // 2nd: maxSize
  this.#noCache, // 3rd: noCache
  this.#cacheTtlMs // 4th: cacheTtlMs
);
```

### Error: Test Assertion Mismatch

```typescript
// WRONG: Test expects 2 parameters
expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, false);

// CORRECT: Test expects 3 parameters (or uses partial matching)
expect(MockPRPGenerator).toHaveBeenCalledWith(
  mockManager,
  false,
  24 * 60 * 60 * 1000
);

// ALTERNATIVE: Use partial matching
expect(MockPRPGenerator).toHaveBeenCalledWith(
  mockManager,
  false,
  expect.any(Number)
);
```

## Quick Reference

### Constructor Signatures

```typescript
// ResearchQueue
new ResearchQueue(sessionManager, maxSize?, noCache?, cacheTtlMs?)

// TaskOrchestrator
new TaskOrchestrator(sessionManager, scope?, noCache?, researchQueueConcurrency?, cacheTtlMs?, prpCompression?, retryConfig?)

// PRPGenerator
new PRPGenerator(sessionManager, noCache?, cacheTtlMs?, prpCompression?)
```

### Parameter Mapping

```typescript
TaskOrchestrator                    →  ResearchQueue
─────────────────────────────────────────────────────────────────────
this.sessionManager                 →  sessionManager
this.#researchQueueConcurrency      →  maxSize
this.#noCache                       →  noCache
this.#cacheTtlMs                    →  cacheTtlMs

ResearchQueue                       →  PRPGenerator
─────────────────────────────────────────────────────────────────────
sessionManager                      →  sessionManager
noCache                             →  noCache
cacheTtlMs                          →  cacheTtlMs
(NOT PASSED)                        →  prpCompression (uses default)
```

### File Locations

| File                                     | Lines   | Description                 |
| ---------------------------------------- | ------- | --------------------------- |
| `src/core/task-orchestrator.ts`          | 161-166 | ResearchQueue instantiation |
| `src/core/research-queue.ts`             | 94-106  | ResearchQueue constructor   |
| `src/agents/prp-generator.ts`            | 194-199 | PRPGenerator constructor    |
| `tests/unit/core/research-queue.test.ts` | 268-280 | PRPGenerator mock test      |
| `src/cli/index.ts`                       | 50-80   | CLI option definitions      |
