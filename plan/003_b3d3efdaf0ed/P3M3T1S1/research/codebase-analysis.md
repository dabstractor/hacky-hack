# Codebase Analysis for P3M3T1S1

**Task:** P3M3T1S1 - Make PRP cache TTL configurable
**Date:** 2025-01-25

---

## 1. Current PRP Cache Implementation

### 1.1 PRPGenerator Class

**File:** `src/agents/prp-generator.ts`

**Key Properties:**
```typescript
export class PRPGenerator {
  readonly #logger: Logger;
  readonly sessionManager: SessionManager;
  readonly sessionPath: string;
  #researcherAgent: Agent;
  readonly #noCache: boolean;
  #cacheHits: number = 0;
  #cacheMisses: number = 0;

  /** Cache TTL in milliseconds (24 hours) - LINE 151 */
  readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;
}
```

**Key Methods:**
- `getCachePath(taskId: string): string` (lines 191-194)
- `getCacheMetadataPath(taskId: string): string` (lines 206-209)
- `#isCacheRecent(filePath: string): Promise<boolean>` (lines 263-272)
- `#loadCachedPRP(taskId: string): Promise<PRPDocument | null>` (lines 284-295)
- `#saveCacheMetadata(taskId, taskHash, prp): Promise<void>` (lines 310-334)
- `generate(task, backlog): Promise<PRPDocument>` (lines 403-456)

### 1.2 Cache TTL Usage

**Line 267:** Cache age check
```typescript
const age = Date.now() - stats.mtimeMs;
return age < this.CACHE_TTL_MS;
```

---

## 2. Current CLI Configuration Pattern

### 2.1 CLI Options with Environment Variables

**File:** `src/cli/index.ts`

**Example: --research-concurrency (lines 230-234)**
```typescript
.option(
  '--research-concurrency <n>',
  'Max concurrent research tasks (1-10, default: 3, env: RESEARCH_QUEUE_CONCURRENCY)',
  process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3'
)
```

**Validation Pattern (lines 452-485)**
```typescript
const researchConcurrencyStr = typeof options.researchConcurrency === 'string'
  ? options.researchConcurrency
  : String(options.researchConcurrency);
const researchConcurrency = parseInt(researchConcurrencyStr, 10);

if (isNaN(researchConcurrency) || researchConcurrency < 1 || researchConcurrency > 10) {
  logger.error('--research-concurrency must be an integer between 1 and 10');
  process.exit(1);
}
options.researchConcurrency = researchConcurrency;
```

### 2.2 Type Definitions

**File:** `src/cli/index.ts` (lines 39-147)

```typescript
export interface CLIArgs {
  /** Max concurrent research tasks (1-10, default: 3) - may be string from commander */
  researchConcurrency: number | string;
  /** Max retry attempts (0-10, default: 3) - may be string from commander */
  taskRetry?: number | string;
  /** Max retries for batch write failures (0-10, default: 3) - may be string from commander */
  flushRetries?: number | string;
}

export interface ValidatedCLIArgs extends Omit<CLIArgs, 'researchConcurrency' | 'taskRetry' | 'retryBackoff' | 'flushRetries'> {
  researchConcurrency: number;
  taskRetry?: number;
  flushRetries?: number;
}
```

---

## 3. Test Patterns

### 3.1 PRPGenerator Test File

**File:** `tests/unit/agents/prp-generator.test.ts`

**Key Test Patterns:**

1. **Constructor tests** (lines 171-198)
```typescript
describe('constructor', () => {
  it('should create PRPGenerator with session path', () => {
    const generator = new PRPGenerator(mockSessionManager);
    expect(generator.sessionManager).toBe(mockSessionManager);
    expect(generator.sessionPath).toBe(sessionPath);
  });
});
```

2. **Cache tests** (lines 467-635)
```typescript
describe('cache', () => {
  it('should use cached PRP when hash matches and file is recent', async () => {
    // Setup mock cache metadata with matching hash
    const mockMetadata = {
      taskId: task.id,
      taskHash: 'abc123',
      createdAt: Date.now(),
      accessedAt: Date.now(),
      version: '1.0',
      prp: cachedPRP,
    };

    // Mock stat to return recent file
    mockStat.mockResolvedValue({
      mtimeMs: Date.now(), // Recent
      isFile: () => true,
    });

    const generator = new PRPGenerator(mockSessionManager, false);
    const result = await generator.generate(task, backlog);

    // VERIFY: Agent was NOT called (cache hit)
    expect(mockAgent.prompt).not.toHaveBeenCalled();
    expect(result).toEqual(cachedPRP);
  });
});
```

3. **Mock patterns**
```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
}));

// Import mocked modules
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
const mockMkdir = mkdir as any;
const mockWriteFile = writeFile as any;
const mockReadFile = readFile as any;
const mockStat = stat as any;
```

---

## 4. SessionManager Integration

### 4.1 PRPGenerator Instantiation Pattern

**File:** `src/core/task-orchestrator.ts` (example usage)

```typescript
// Create PRPGenerator with SessionManager
const prpGenerator = new PRPGenerator(
  this.sessionManager,
  options.noCache // from CLI
);
```

### 4.2 Constructor Modification Required

Current constructor:
```typescript
constructor(sessionManager: SessionManager, noCache: boolean = false) {
  this.#logger = getLogger('PRPGenerator');
  this.sessionManager = sessionManager;
  this.#noCache = noCache;
  // ...
}
```

Needs to become:
```typescript
constructor(
  sessionManager: SessionManager,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
) {
  this.#logger = getLogger('PRPGenerator');
  this.sessionManager = sessionManager;
  this.#noCache = noCache;
  this.#cacheTtlMs = cacheTtlMs;
  // ...
}
```

---

## 5. ms Library Usage

### 5.1 Installation Status

**File:** `package.json`

The `ms` library is **already installed** as a dependency:
```json
{
  "dependencies": {
    "ms": "^2.1.3"
  }
}
```

### 5.2 Import Pattern

```typescript
// CommonJS style (current project uses ES modules)
import ms from 'ms';

// Usage
const milliseconds = ms('24h'); // 86400000
const milliseconds = ms('1d');  // 86400000
const milliseconds = ms('12h'); // 43200000
```

---

## 6. Dependencies and Integration Points

### 6.1 Files That Create PRPGenerator

| File | Location | Context |
|------|----------|---------|
| `src/core/task-orchestrator.ts` | ~ | Creates PRPGenerator for PRP generation |
| `tests/unit/agents/prp-generator.test.ts` | ~ | Test mocks |
| `src/workflows/prp-pipeline.ts` | ~ | Pipeline orchestration |

### 6.2 CLI Option Passing Flow

```
CLI Parse (src/cli/index.ts)
  ↓
ValidatedCLIArgs.cacheTtl
  ↓
PRPPipeline (src/workflows/prp-pipeline.ts)
  ↓
TaskOrchestrator (src/core/task-orchestrator.ts)
  ↓
PRPGenerator (src/agents/prp-generator.ts)
```

---

## 7. Implementation Changes Required

### 7.1 src/agents/prp-generator.ts

1. Change `CACHE_TTL_MS` from `readonly` constant to instance property
2. Add `cacheTtlMs` parameter to constructor
3. Use `this.#cacheTtlMs` instead of `this.CACHE_TTL_MS`

### 7.2 src/cli/index.ts

1. Add `--cache-ttl` option with `process.env.HACKY_PRP_CACHE_TTL` default
2. Add `cacheTtl` to `CLIArgs` interface
3. Add `cacheTtl` to `ValidatedCLIArgs` interface
4. Parse duration using `ms` library
5. Validate range (1 minute to 30 days)
6. Pass `cacheTtl` through the call chain

### 7.3 src/core/task-orchestrator.ts

1. Accept `cacheTtl` parameter
2. Pass to `PRPGenerator` constructor

### 7.4 src/workflows/prp-pipeline.ts

1. Accept `cacheTtl` parameter
2. Pass to `TaskOrchestrator`

### 7.5 tests/unit/agents/prp-generator.test.ts

1. Add tests for custom cache TTL
2. Test cache expiration with custom TTL
3. Test invalid TTL values

---

## 8. Summary of Changes

| File | Change Type | Lines Affected |
|------|-------------|----------------|
| `src/agents/prp-generator.ts` | Modify constructor, change constant to property | ~5 lines |
| `src/cli/index.ts` | Add CLI option, validation, type definitions | ~30 lines |
| `src/core/task-orchestrator.ts` | Add parameter passthrough | ~2 lines |
| `src/workflows/prp-pipeline.ts` | Add parameter passthrough | ~2 lines |
| `tests/unit/agents/prp-generator.test.ts` | Add TTL configuration tests | ~50 lines |

---

**Generated for:** P3M3T1S1 - Make PRP cache TTL configurable
**Status:** ✅ Analysis complete
