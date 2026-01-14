name: "P5.M2.T1.S2: Implement PRP Cache"
description: |

---

## Goal

**Feature Goal**: Implement disk-based caching for PRP (Product Requirement Prompt) generation to eliminate redundant LLM calls for identical tasks across sessions.

**Deliverable**:

1. Modified `PRPGenerator` class with cache check before generation
2. Cache metadata storage alongside PRP markdown files
3. Task input hashing for change detection
4. CLI `--no-cache` flag to bypass cache
5. Cache hit/miss logging with metrics tracking

**Success Definition**:

- PRPGenerator checks disk cache before calling LLM
- Cache hit returns cached PRPDocument instantly (<10ms)
- Cache miss generates new PRP and stores to disk
- Hash-based invalidation detects task changes
- 24-hour TTL with age-based expiration
- `--no-cache` flag bypasses all caching
- Cache metrics logged (hits, misses, hit ratio)
- Zero TypeScript errors, zero linting errors, all tests pass

## User Persona

**Target User**: Developers running the PRP pipeline repeatedly during development and testing.

**Use Case**: A developer iterates on a PRD and re-runs the pipeline multiple times. Tasks that haven't changed should use cached PRPs instead of re-generating via expensive LLM calls.

**User Journey**:

1. Developer runs pipeline: `npm run pipeline -- --prd ./PRD.md`
2. First execution generates all PRPs (cache misses)
3. Developer makes minor PRD changes and re-runs
4. Unchanged tasks use cached PRPs (cache hits)
5. Changed tasks regenerate PRPs (cache misses)
6. Console shows: `PRP cache HIT - P1.M1.T1.S1` or `PRP cache MISS - P1.M2.T1.S2`
7. Cache metrics logged: `PRP cache metrics: hits=45, misses=5, hitRatio=90.0%`

**Pain Points Addressed**:

- **Expensive re-generation**: LLM calls cost time (1-5s each) and API credits
- **No session persistence**: Running pipeline twice re-generates everything
- **No change detection**: Can't tell which tasks actually need re-generation
- **No observability**: Can't measure cache effectiveness

## Why

- **Cost Optimization**: LLM API calls are expensive; caching reduces repeat calls by ~80-90%
- **Performance Improvement**: Cached PRPs return instantly (<10ms) vs. 1-5s for LLM generation
- **Developer Experience**: Faster iteration when testing pipeline changes
- **Production Readiness**: Cache metrics enable monitoring and optimization
- **Dependency Chain**: Completes P5.M2.T1 (Optimize LLM Caching) alongside P5.M2.T1.S1 (Groundswell cache verification)

## What

Implement disk-based caching for PRP generation with hash-based change detection, time-based expiration, and CLI bypass support.

### Success Criteria

- [ ] PRPGenerator checks cache before `agent.prompt()` call
- [ ] Cache hit returns cached PRPDocument without LLM call
- [ ] Cache miss generates PRP and stores to disk
- [ ] Hash-based change detection invalidates cache on task modification
- [ ] 24-hour TTL with age check before using cache
- [ ] `--no-cache` CLI flag bypasses all caching
- [ ] Cache metrics logged (hits, misses, hit ratio)
- [ ] All existing tests pass
- [ ] Zero TypeScript errors

---

## All Needed Context

### Context Completeness Check

_The implementing agent has everything needed: complete PRPGenerator implementation, existing hash patterns from session-utils, cache testing patterns from research-queue.test.ts, CLI integration from cli/index.ts, logger patterns from utils/logger.ts, and external best practices for file-based caching._

### Documentation & References

```yaml
# MUST READ - PRPGenerator Implementation
- file: src/agents/prp-generator.ts
  why: Primary class to modify for caching
  pattern: generate() method calls agent.prompt(), #writePRPToFile() persists to disk
  section: Lines 175-233 (generate method), Lines 249-271 (#writePRPToFile method)
  gotcha: PRP files stored at {sessionPath}/prps/{taskId-sanitized}.md (dots replaced with underscores)

# MUST READ - Hash-based Change Detection Pattern
- file: src/core/session-utils.ts
  why: Reference implementation for SHA-256 hashing of file content
  pattern: hashPRD() uses createHash('sha256').update(content).digest('hex')
  section: Lines 161-168 (hashPRD function)
  gotcha: Use JSON.stringify with null, 0 for deterministic serialization (no whitespace)

# MUST READ - File Modification Time Checking
- file: src/core/session-manager.ts
  why: Pattern for checking file age using stat().mtimeMs
  pattern: stats.mtimeMs for modification time in milliseconds
  section: Lines 283-284 (stats.mtime usage)

# MUST READ - Session Directory Structure
- file: src/core/session-utils.ts
  why: Understanding prps/ directory creation and session layout
  pattern: createSessionDirectory() creates prps/ subdirectory
  section: Lines 197-241 (createSessionDirectory function)
  gotcha: Session format: plan/{sequence}_{hash}/, PRPs in prps/ subdirectory

# MUST READ - Cache Testing Patterns
- file: tests/unit/core/research-queue.test.ts
  why: Reference pattern for testing cache hit/miss with timing assertions
  pattern: expect(duration).toBeLessThan(10) for instant cache response
  section: Lines 1-100 (mock patterns and cache verification tests)

# MUST READ - PRPGenerator Test Structure
- file: tests/unit/agents/prp-generator.test.ts
  why: Follow existing test structure when adding cache tests
  pattern: vi.mock('groundswell') with hoisting, factory functions for test data
  section: Lines 1-50 (test setup and mock patterns)

# MUST READ - Structured Logger (from P5.M1.T1.S1)
- file: src/utils/logger.ts
  why: Use for logging cache hits/misses with structured data
  pattern: getLogger('PRPGenerator') factory, info/debug levels
  section: Lines 1-200 (Logger interface and factory function)
  gotcha: Use .js extension in imports: "import { getLogger } from './logger.js';"

# MUST READ - CLI Integration Point
- file: src/cli/index.ts
  why: Add --no-cache flag to CLI arguments
  pattern: program.option('--no-cache', 'description', false)
  section: Lines 1-100 (CLIArgs interface and parseCLIArgs function)

# MUST READ - Cache Metrics Pattern
- file: src/core/task-orchestrator.ts
  why: Reference implementation for cache hit/miss tracking and logging
  pattern: #cacheHits, #cacheMisses fields, #logCacheMetrics() method
  section: Lines 85-86 (cache metrics fields), Lines 583-598 (logCacheMetrics implementation)
  gotcha: Log with structured data: { hits, misses, hitRatio }, 'Cache metrics'

# MUST READ - PRPDocument Schema
- file: src/core/models.ts
  why: Understanding the PRPDocument interface for cache storage
  pattern: PRPDocument interface with taskId, objective, context, etc.
  section: Lines 1-200 (PRPDocument definition)

# MUST READ - Previous PRP (Parallel Work Context)
- file: plan/001_14b9dc2a33c7/P5M2T1S1/PRP.md
  why: Understanding Groundswell cache verification (parallel work)
  section: Full document - defines cache testing patterns and metrics logging
  gotcha: P5.M2.T1.S1 verifies Groundswell LLM cache, P5.M2.T1.S2 adds PRP-level cache

# MUST READ - Codebase Analysis Research
- docfile: plan/001_14b9dc2a33c7/P5M2T1S2/research/codebase-analysis-research.md
  why: Complete analysis of PRPGenerator, hashing patterns, cache implementation requirements
  critical: Contains code patterns for getCachePath, computeTaskHash, cache metadata structure
  section: "11. Key Implementation Requirements" - ready-to-use code snippets

# MUST READ - External Best Practices Research
- docfile: /home/dustin/projects/hacky-hack/llm-caching-research-findings.md
  why: Production-validated patterns from flat-cache, file-entry-cache, ESLint
  critical: Atomic write pattern, TTL implementation, --no-cache flag patterns
  section: "2. File-Based Cache Invalidation Strategies", "3. Time-Based Cache Expiration (TTL)"
```

### Current Codebase Tree

```bash
src/
├── agents/              # AI agent implementations
│   ├── agent-factory.ts        # Central factory with createResearcherAgent()
│   ├── prp-generator.ts        # MODIFY: Add cache checking to generate()
│   └── prp-executor.ts         # Uses PRPGenerator output
├── cli/                 # CLI argument parsing
│   └── index.ts                 # MODIFY: Add --no-cache flag
├── config/              # Configuration modules
├── core/                # Core business logic
│   ├── models.ts                # PRPDocument interface definition
│   ├── session-manager.ts       # Session state with sessionPath
│   ├── session-utils.ts         # hashPRD() pattern for hashing
│   ├── task-orchestrator.ts     # Cache metrics pattern (#logCacheMetrics)
│   └── research-queue.ts        # In-memory Map cache pattern
├── tools/               # MCP tools
├── utils/               # General utilities
│   └── logger.ts                # Structured logging (Pino-based) from P5.M1.T1.S1
└── workflows/           # Workflow orchestrations
    └── prp-pipeline.ts          # Uses PRPGenerator

tests/
├── unit/
│   ├── agents/
│   │   └── prp-generator.test.ts       # MODIFY: Add cache tests
│   └── core/
│       └── research-queue.test.ts      # Cache verification pattern reference

plan/001_14b9dc2a33c7/
├── architecture/
│   └── groundswell_api.md              # Groundswell cache documentation
└── P5M2T1S2/
    └── PRP.md                          # THIS DOCUMENT
```

### Desired Codebase Tree

```bash
# Modified files:
src/agents/
└── prp-generator.ts                    # MODIFY: Add cache methods and logic

src/cli/
└── index.ts                            # MODIFY: Add noCache to CLIArgs

tests/unit/agents/
└── prp-generator.test.ts               # MODIFY: Add cache test suite

# New directory:
plan/001_14b9dc2a33c7/prps/
└── .cache/                             # CREATE: Cache metadata directory
    ├── P1M1T1S1.json                   # Cache metadata per task
    └── P1M1T1S2.json

# No other structural changes needed
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: PRP File Storage Location

// 1. PRP files use sanitized task IDs (dots replaced with underscores)
// File: prps/P1M1T1S1.md (not prps/P1.M1.T1.S1.md)
// Pattern: taskId.replace(/\./g, '_') + '.md'
// Gotcha: Must match existing #writePRPToFile() behavior

// 2. Cache metadata stored separately from markdown
// Markdown: prps/P1M1T1S1.md (human-readable)
// Metadata: prps/.cache/P1M1T1S1.json (machine-readable)
// Reason: Markdown may be manually edited; metadata is authoritative

// 3. Hash must include ALL task inputs affecting PRP output
// Include: id, title, description, acceptanceCriteria
// Exclude: status, dependencies, assignedTo (don't affect PRP content)
// Pattern: JSON.stringify(input, null, 0) for determinism

// 4. TTL is 24 hours (86400000 ms) from file mtime
// Check: Date.now() - stats.mtimeMs < 24 * 60 * 60 * 1000
// Reason: Models don't change frequently; 24h is standard for LLM caching

// 5. Cache bypass uses CLI flag, not environment variable
// Pattern: --no-cache flag in CLIArgs
// Reason: Explicit opt-out is better than implicit config

// 6. Cache metrics follow TaskOrchestrator pattern
// Fields: #cacheHits, #cacheMisses (private readonly number)
// Method: #logCacheMetrics() with hitRatio calculation
// Format: logger.info({ hits, misses, hitRatio }, 'PRP cache metrics')

// 7. Logging uses structured format with metadata
// Hit: logger.info({ taskId, cacheHit: true, latency }, 'PRP cache HIT')
// Miss: logger.debug({ taskId, cacheHit: false }, 'PRP cache MISS')
// Reason: Debug level for misses (common), info for hits (important event)

// 8. PRPDocument must be validated after loading from cache
// Pattern: PRPDocumentSchema.parse(cachedPRP)
// Reason: Defensive programming; corrupted cache should error clearly

// 9. getCachePath() must match #writePRPToFile() path format
// Both use: join(this.sessionPath, 'prps', sanitizedTaskId + '.md')
// Gotcha: Sanitize task ID consistently (replace dots, not remove)

// 10. File system operations use node:fs/promises, not fs
// Pattern: import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
// Reason: Async operations are more efficient and avoid blocking

// 11. Cache metadata directory must be created if missing
// Pattern: await mkdir(cacheDir, { recursive: true });
// Gotcha: EEXIST error is OK (directory already exists)

// 12. Parallel execution with P5.M2.T1.S1
// That PRP creates cache verification tests (independent work)
// This PRP creates PRP-level caching (independent work)
// Both use structured logging but integrate separately

// 13. ES Module imports: Use .js extension
// Pattern: import { getLogger } from '../utils/logger.js';
// Gotcha: TypeScript source uses .ts, runtime imports use .js

// 14. Error handling: Cache failures shouldn't block pipeline
// Pattern: try/catch around cache.load, fallback to generation on error
// Reason: Corrupted cache shouldn't stop execution; regenerate and continue

// 15. Cache validation: Check hash match AND file age
// Pattern: if (hashMatch && isRecent) { use cache }
// Reason: Hash ensures content match, age ensures freshness
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// Cache entry metadata (stored alongside PRP markdown)
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;       // SHA-256 of task inputs
  readonly createdAt: number;      // Timestamp when PRP was generated
  readonly accessedAt: number;     // Last cache access timestamp
  readonly version: string;        // Cache format version (for migrations)
}

// Cache metrics (tracked in memory, logged periodically)
interface PRPCacheMetrics {
  readonly hits: number;
  readonly misses: number;
  readonly hitRatio: number;       // Percentage (0-100)
}

// Task input for hashing (must include all fields affecting PRP output)
interface TaskInputForHash {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly acceptanceCriteria: string[];
}

// PRPGenerator cache fields (add to class)
export class PRPGenerator {
  readonly #logger: Logger;
  readonly sessionManager: SessionManager;
  readonly sessionPath: string;
  readonly #noCache: boolean;          // NEW: Cache bypass flag

  #researcherAgent: Agent;
  #cacheHits: number = 0;              // NEW: Cache hit counter
  #cacheMisses: number = 0;            // NEW: Cache miss counter
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/cli/index.ts
  - ADD noCache: boolean field to CLIArgs interface
  - ADD .option('--no-cache', 'Bypass cache and regenerate all PRPs', false)
  - VERIFY: parseCLIArgs() returns noCache field
  - FOLLOW: Existing option pattern (e.g., --verbose, --dry-run)
  - NAMING: noCache (camelCase) matches TypeScript conventions
  - PLACEMENT: CLIArgs interface after existing fields

Task 2: MODIFY src/agents/prp-generator.ts - Add cache fields
  - ADD readonly #noCache: boolean field to class
  - ADD #cacheHits: number = 0 field for metrics
  - ADD #cacheMisses: number = 0 field for metrics
  - MODIFY constructor to accept noCache parameter
  - PASS noCache from CLI through PRPPipeline to PRPGenerator
  - DEPENDENCIES: Requires Task 1 (CLIArgs.noCache exists)
  - PLACEMENT: Top of class after #logger field

Task 3: IMPLEMENT src/agents/prp-generator.ts - getCachePath()
  - ADD getCachePath(taskId: string): string method
  - SANITIZE: taskId.replace(/\./g, '_') + '.md'
  - RETURN: join(this.sessionPath, 'prps', sanitizedTaskId)
  - FOLLOW: Pattern from #writePRPToFile() (lines 249-271)
  - NAMING: getCachePath (camelCase, public for testing)
  - DEPENDENCIES: None (uses existing sessionPath)

Task 4: IMPLEMENT src/agents/prp-generator.ts - getCacheMetadataPath()
  - ADD getCacheMetadataPath(taskId: string): string method
  - SANITIZE: taskId.replace(/\./g, '_') + '.json'
  - RETURN: join(this.sessionPath, 'prps', '.cache', sanitizedTaskId)
  - CREATE: .cache subdirectory if it doesn't exist
  - NAMING: getCacheMetadataPath (camelCase, public for testing)
  - DEPENDENCIES: None

Task 5: IMPLEMENT src/agents/prp-generator.ts - #computeTaskHash()
  - ADD #computeTaskHash(task: Task | Subtask, backlog: Backlog): string method
  - EXTRACT: Task input fields (id, title, description, acceptanceCriteria)
  - HASH: createHash('sha256').update(JSON.stringify(input, null, 0)).digest('hex')
  - FOLLOW: Pattern from hashPRD() in session-utils.ts (lines 161-168)
  - NAMING: #computeTaskHash (camelCase, private)
  - DEPENDENCIES: None (uses Node.js crypto)

Task 6: IMPLEMENT src/agents/prp-generator.ts - #isCacheRecent()
  - ADD #isCacheRecent(filePath: string): Promise<boolean> method
  - CHECK: stat(filePath).mtimeMs against 24-hour TTL
  - RETURN: true if age < 24 hours, false otherwise
  - CONSTANT: CACHE_TTL_MS = 24 * 60 * 60 * 1000
  - CATCH: Return false if file doesn't exist (ENOENT)
  - NAMING: #isCacheRecent (camelCase, private)
  - DEPENDENCIES: None (uses node:fs/promises)

Task 7: IMPLEMENT src/agents/prp-generator.ts - #loadCachedPRP()
  - ADD #loadCachedPRP(taskId: string): Promise<PRPDocument | null> method
  - READ: Cache metadata from getCacheMetadataPath(taskId)
  - READ: PRP markdown from getCachePath(taskId)
  - PARSE: PRPDocument from markdown (or cache metadata if stored as JSON)
  - VALIDATE: PRPDocumentSchema.parse(cachedPRP)
  - RETURN: null if file missing or invalid
  - NAMING: #loadCachedPRP (camelCase, private)
  - DEPENDENCIES: Tasks 3, 4 (getCachePath, getCacheMetadataPath)

Task 8: IMPLEMENT src/agents/prp-generator.ts - #saveCacheMetadata()
  - ADD #saveCacheMetadata(taskId: string, taskHash: string): Promise<void> method
  - CREATE: PRPCacheMetadata object with timestamp
  - WRITE: to getCacheMetadataPath(taskId) as JSON
  - CREATE: .cache directory if missing (mkdir with recursive: true)
  - NAMING: #saveCacheMetadata (camelCase, private)
  - DEPENDENCIES: Task 4 (getCacheMetadataPath)

Task 9: IMPLEMENT src/agents/prp-generator.ts - #logCacheMetrics()
  - ADD #logCacheMetrics(): void method
  - CALCULATE: total = hits + misses, hitRatio = (hits / total) * 100
  - LOG: logger.info({ hits, misses, hitRatio }, 'PRP cache metrics')
  - FOLLOW: Pattern from TaskOrchestrator #logCacheMetrics (lines 583-598)
  - NAMING: #logCacheMetrics (camelCase, private)
  - DEPENDENCIES: Task 2 (cache fields exist)

Task 10: MODIFY src/agents/prp-generator.ts - generate()
  - ADD: Cache check at start of method (before createPRPBlueprintPrompt)
  - CHECK: if (this.#noCache) { skip cache, proceed to generation }
  - CHECK: if (cachedPRP && hashMatch && isRecent) { return cachedPRP }
  - INCREMENT: #cacheHits or #cacheMisses
  - LOG: Cache hit/miss with structured data
  - CALL: #saveCacheMetadata() after successful generation
  - CALL: #logCacheMetrics() before return
  - FOLLOW: Existing generate() structure (lines 175-233)
  - DEPENDENCIES: Tasks 5, 6, 7, 8, 9 (all cache methods)

Task 11: MODIFY src/workflows/prp-pipeline.ts
  - ACCEPT: noCache from CLIArgs
  - PASS: noCache to PRPGenerator constructor
  - ENSURE: Backward compatibility (default to false if not provided)
  - DEPENDENCIES: Task 2 (PRPGenerator constructor accepts noCache)

Task 12: CREATE tests/unit/agents/prp-generator-cache.test.ts
  - IMPLEMENT: Cache hit test (hash match, recent file)
  - IMPLEMENT: Cache miss test (hash mismatch)
  - IMPLEMENT: Cache miss test (expired file)
  - IMPLEMENT: Cache bypass test (--no-cache flag)
  - IMPLEMENT: Cache metrics logging test
  - IMPLEMENT: Cache metadata persistence test
  - FOLLOW: Pattern from research-queue.test.ts (timing assertions)
  - FOLLOW: Pattern from prp-generator.test.ts (mock setup)
  - MOCK: node:fs/promises (readFile, stat, mkdir, writeFile)
  - NAMING: describe('PRPGenerator Cache'), it('should use cached PRP when...')
  - PLACEMENT: tests/unit/agents/

Task 13: VERIFY test execution
  - RUN: npm test -- tests/unit/agents/prp-generator-cache.test.ts
  - RUN: npm run typecheck (zero errors)
  - RUN: npm run lint (zero errors)
  - RUN: npm test (all tests pass)

Task 14: MANUAL verification
  - RUN: npm run pipeline -- --prd ./PRD.md (first run - all misses)
  - RUN: npm run pipeline -- --prd ./PRD.md (second run - cache hits)
  - CHECK: Console logs show cache hits/misses
  - CHECK: Cache metrics logged at end
  - RUN: npm run pipeline -- --no-cache (bypass cache)
  - CHECK: All PRPs regenerated despite cache existing
```

### Implementation Patterns & Key Details

```typescript
// ===== TASK 3: getCachePath() =====
// File: src/agents/prp-generator.ts

getCachePath(taskId: string): string {
  // Sanitize taskId for filename (replace dots with underscores)
  const sanitized = taskId.replace(/\./g, '_');
  return join(this.sessionPath, 'prps', `${sanitized}.md`);
}

// ===== TASK 4: getCacheMetadataPath() =====
// File: src/agents/prp-generator.ts

getCacheMetadataPath(taskId: string): string {
  const sanitized = taskId.replace(/\./g, '_');
  return join(this.sessionPath, 'prps', '.cache', `${sanitized}.json`);
}

// ===== TASK 5: #computeTaskHash() =====
// File: src/agents/prp-generator.ts

#computeTaskHash(task: Task | Subtask, backlog: Backlog): string {
  // Extract only fields that affect PRP output
  const input: TaskInputForHash = {
    id: task.id,
    title: task.title,
    description: task.description,
    acceptanceCriteria: task.acceptanceCriteria,
  };

  // Deterministic JSON serialization (no whitespace)
  const jsonString = JSON.stringify(input, null, 0);

  // SHA-256 hash for collision resistance
  return createHash('sha256').update(jsonString).digest('hex');
}

// ===== TASK 6: #isCacheRecent() =====
// File: src/agents/prp-generator.ts

readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async #isCacheRecent(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < this.CACHE_TTL_MS;
  } catch {
    // File doesn't exist or can't be read
    return false;
  }
}

// ===== TASK 7: #loadCachedPRP() =====
// File: src/agents/prp-generator.ts

async #loadCachedPRP(taskId: string): Promise<PRPDocument | null> {
  try {
    const metadataPath = this.getCacheMetadataPath(taskId);

    // Read cache metadata
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata: PRPCacheMetadata = JSON.parse(metadataContent);

    return {
      taskId: metadata.taskId,
      // ... load PRPDocument fields from cache
      // Option 1: Parse from markdown (more complex)
      // Option 2: Store full PRPDocument in cache metadata (simpler)
    };
  } catch {
    return null;
  }
}

// ===== TASK 8: #saveCacheMetadata() =====
// File: src/agents/prp-generator.ts

async #saveCacheMetadata(
  taskId: string,
  taskHash: string,
  prp: PRPDocument
): Promise<void> {
  const metadataPath = this.getCacheMetadataPath(taskId);
  const cacheDir = dirname(metadataPath);

  // Create .cache directory if missing
  await mkdir(cacheDir, { recursive: true });

  const metadata: PRPCacheMetadata = {
    taskId,
    taskHash,
    createdAt: Date.now(),
    accessedAt: Date.now(),
    version: '1.0',
    prp, // Store full PRPDocument for easy retrieval
  };

  await writeFile(metadataPath, JSON.stringify(metadata, null, 2), {
    mode: 0o644,
  });
}

// ===== TASK 9: #logCacheMetrics() =====
// File: src/agents/prp-generator.ts

#logCacheMetrics(): void {
  const total = this.#cacheHits + this.#cacheMisses;
  const hitRatio = total > 0 ? (this.#cacheHits / total) * 100 : 0;

  this.#logger.info(
    {
      hits: this.#cacheHits,
      misses: this.#cacheMisses,
      hitRatio: hitRatio.toFixed(1),
    },
    'PRP cache metrics'
  );
}

// ===== TASK 10: Modified generate() =====
// File: src/agents/prp-generator.ts

async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
  // EARLY EXIT: Cache bypassed via --no-cache flag
  if (!this.#noCache) {
    const cachePath = this.getCachePath(task.id);
    const currentHash = this.#computeTaskHash(task, backlog);

    // Check if cached PRP exists and is recent
    if (await this.#isCacheRecent(cachePath)) {
      const cachedPRP = await this.#loadCachedPRP(task.id);

      // Verify hash matches (task hasn't changed)
      if (cachedPRP) {
        const cachedMetadata = await this.#loadCacheMetadata(task.id);
        if (cachedMetadata?.taskHash === currentHash) {
          // CACHE HIT
          this.#cacheHits++;
          this.#logger.info({ taskId: task.id }, 'PRP cache HIT');
          this.#logCacheMetrics();
          return cachedPRP;
        }
      }
    }

    // CACHE MISS (hash mismatch or file expired)
    this.#cacheMisses++;
    this.#logger.debug({ taskId: task.id }, 'PRP cache MISS');
  } else {
    this.#logger.debug('Cache bypassed via --no-cache flag');
  }

  // Generate PRP (existing logic)
  const maxRetries = 3;
  // ... existing retry loop ...

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());
      const result = await this.#researcherAgent.prompt(prompt);
      const validated = PRPDocumentSchema.parse(result);

      // Save to cache (including metadata)
      if (!this.#noCache) {
        const currentHash = this.#computeTaskHash(task, backlog);
        await this.#writePRPToFile(validated);
        await this.#saveCacheMetadata(task.id, currentHash, validated);
      }

      return validated;
    } catch (error) {
      // ... existing retry logic ...
    }
  }

  // ... existing error throw ...
}

// ===== CLI INTEGRATION (Task 1) =====
// File: src/cli/index.ts

export interface CLIArgs {
  // ... existing fields
  noCache: boolean; // NEW
}

export function parseCLIArgs(): CLIArgs {
  const program = new Command();

  program
    // ... existing options
    .option('--no-cache', 'Bypass cache and regenerate all PRPs', false)
    .parse(process.argv);

  return program.opts<CLIArgs>();
}

// ===== GOTCHA: PRP Storage Format =====
// Option 1: Parse markdown back to PRPDocument (complex)
// Option 2: Store PRPDocument in cache metadata (simpler, recommended)

// Recommended: Store full PRPDocument in cache metadata JSON
interface PRPCacheMetadata {
  taskId: string;
  taskHash: string;
  createdAt: number;
  accessedAt: number;
  version: string;
  prp: PRPDocument; // Full document for easy retrieval
}
```

### Integration Points

```yaml
CLI_INTEGRATION:
  - modify: src/cli/index.ts
  - add_to: CLIArgs interface (noCache: boolean)
  - add_option: program.option('--no-cache', 'description', false)
  - pattern: "Follow existing option pattern (--verbose, --dry-run)"

PRP_GENERATOR_INTEGRATION:
  - modify: src/agents/prp-generator.ts
  - add_field: readonly #noCache: boolean
  - modify_constructor: Accept noCache parameter
  - add_methods: getCachePath(), getCacheMetadataPath(), #computeTaskHash(), etc.

PIPELINE_INTEGRATION:
  - modify: src/workflows/prp-pipeline.ts
  - pass_through: args.noCache to PRPGenerator constructor
  - ensure_backward_compat: Default to false if not provided

CACHE_STORAGE:
  - create: plan/001_14b9dc2a33c7/prps/.cache/
  - pattern: JSON files with cache metadata and full PRPDocument
  - naming: {sanitizedTaskId}.json

LOGGER_INTEGRATION:
  - use_existing: getLogger('PRPGenerator')
  - log_level: INFO for cache hits, DEBUG for misses
  - pattern: "logger.info({ taskId, cacheHit }, 'PRP cache HIT')"
  - metrics: "logger.info({ hits, misses, hitRatio }, 'PRP cache metrics')"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying each file
npx tsc --noEmit src/agents/prp-generator.ts
npx tsc --noEmit src/cli/index.ts

# Format and lint
npm run lint -- src/agents/prp-generator.ts
npm run format -- src/agents/prp-generator.ts

# Project-wide validation
npm run typecheck
npm run lint
npm run format

# Expected: Zero TypeScript errors, zero ESLint errors
# If errors exist:
#   - Fix import paths (use .js extensions)
#   - Fix type annotations (add explicit types where needed)
#   - Re-run validation
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run cache tests
npm test -- tests/unit/agents/prp-generator-cache.test.ts

# Run all PRPGenerator tests
npm test -- tests/unit/agents/prp-generator.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/agents/

# Expected: All tests pass, good coverage
# If failing:
#   - Check mock setup (vi.mock must be before imports)
#   - Verify cache path patterns match #writePRPToFile()
#   - Debug with console.log (temporarily)
#   - Fix and re-run
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all tests
npm test

# Build project
npm run build

# Expected: All tests pass, including existing tests
# If existing tests fail:
#   - Check for backward compatibility (noCache defaults to false)
#   - Verify no changes to public API
#   - Fix and re-run
```

### Level 4: Manual & System Validation

```bash
# First run - generate all PRPs (cache misses)
npm run pipeline -- --prd ./PRD.md

# Check for cache files in prps/.cache/
ls -la plan/001_14b9dc2a33c7/prps/.cache/

# Second run - should use cache (cache hits)
npm run pipeline -- --prd ./PRD.md

# Expected output:
# "PRP cache HIT - P1.M1.T1.S1"
# "PRP cache HIT - P1.M1.T1.S2"
# "PRP cache metrics: hits=X, misses=Y, hitRatio=Z%"

# Test --no-cache flag (bypass cache)
npm run pipeline -- --prd ./PRD.md --no-cache

# Expected output:
# "Cache bypassed via --no-cache flag"
# All PRPs regenerated (no cache hits)

# Verify cache metadata format
cat plan/001_14b9dc2a33c7/prps/.cache/P1M1T1S1.json

# Expected JSON structure:
# {
#   "taskId": "P1.M1.T1.S1",
#   "taskHash": "abc123...",
#   "createdAt": 1705123456789,
#   "accessedAt": 1705123456789,
#   "version": "1.0",
#   "prp": { ... }
# }
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting correct: `npm run format`
- [ ] All unit tests pass: `npm test -- tests/unit/agents/prp-generator-cache.test.ts`
- [ ] All existing tests pass: `npm test`

### Feature Validation

- [ ] PRPGenerator checks cache before LLM call
- [ ] Cache hit returns cached PRPDocument (<10ms)
- [ ] Cache miss generates new PRP and stores to disk
- [ ] Hash-based invalidation detects task changes
- [ ] 24-hour TTL with age check
- [ ] `--no-cache` flag bypasses all caching
- [ ] Cache metrics logged (hits, misses, hit ratio)
- [ ] Cache metadata stored in prps/.cache/

### Code Quality Validation

- [ ] Follows existing cache patterns (TaskOrchestrator, ResearchQueue)
- [ ] getCachePath() matches #writePRPToFile() path format
- [ ] SHA-256 hash uses deterministic JSON serialization
- [ ] File system operations use node:fs/promises
- [ ] Structured logging with metadata
- [ ] ES module imports with .js extensions
- [ ] Private fields use # prefix convention

### Integration Validation

- [ ] CLI integration: --no-cache flag works
- [ ] PRPPipeline passes noCache to PRPGenerator
- [ ] Backward compatibility: default is cache enabled
- [ ] No interference with P5.M2.T1.S1 (Groundswell cache)
- [ ] Logger integration matches existing patterns
- [ ] Test structure matches existing test files

### Documentation Validation

- [ ] Code comments explain cache logic
- [ ] Cache behavior documented in logs
- [ ] --no-cache flag in help text
- [ ] Cache metrics observable in output

---

## Anti-Patterns to Avoid

- ❌ Don't parse markdown back to PRPDocument (store in cache metadata instead)
- ❌ Don't use sync file operations (use node:fs/promises)
- ❌ Don't forget to sanitize task IDs (replace dots, don't remove)
- ❌ Don't cache fields that don't affect PRP output (status, dependencies)
- ❌ Don't use whitespace in JSON.stringify for hashing (use null, 0)
- ❌ Don't skip hash validation on cache hit (task may have changed)
- ❌ Don't let cache errors block generation (fallback to LLM on error)
- ❌ Don't forget to create .cache directory (mkdir with recursive: true)
- ❌ Don't log every cache operation (log metrics, not per-event)
- ❌ Don't use console.log for metrics (use structured logger)
- ❌ Don't hardcode cache TTL (use named constant)
- ❌ Don't forget .js extension in imports
- ❌ Don't modify public API of PRPGenerator (add private methods only)
- ❌ Don't assume cache metadata exists (handle ENOENT gracefully)
- ❌ Don't store cache metadata in PRP markdown file (separate .json file)
- ❌ Don't use environment variable for cache bypass (use --no-cache flag)
