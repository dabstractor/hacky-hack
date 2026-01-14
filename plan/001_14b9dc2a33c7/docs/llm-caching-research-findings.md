# LLM Caching Best Practices & File-Based Caching Strategies

## Research Summary

This document consolidates research findings on LLM caching best practices, file-based caching strategies, and CLI cache bypass patterns. Sources include production Node.js libraries (flat-cache, file-entry-cache, eslint), industry-standard tools (npm, webpack), and existing implementations in the hacky-hack codebase.

**Research Date:** 2025-01-13
**Status:** Production-Ready Patterns

---

## Table of Contents

1. [Best Practices for Caching LLM-Generated Content](#1-best-practices-for-caching-llm-generated-content)
2. [File-Based Cache Invalidation Strategies](#2-file-based-cache-invalidation-strategies)
3. [Time-Based Cache Expiration (TTL)](#3-time-based-cache-expiration-ttl)
4. [Hash-Based Cache Key Generation](#4-hash-based-cache-key-generation)
5. [Cache Hit/Miss Logging for Observability](#5-cache-hitmiss-logging-for-observability)
6. [--no-cache Flag Patterns in CLI Tools](#6---no-cache-flag-patterns-in-cli-tools)
7. [Cache Metadata Storage Patterns](#7-cache-metadata-storage-patterns)
8. [Production Implementation Examples](#8-production-implementation-examples)

---

## 1. Best Practices for Caching LLM-Generated Content

### 1.1 Deterministic Prompt Design

**Pattern:** Cache keys must be deterministic based on input content.

**Implementation from Groundswell (hacky-hack):**

```typescript
// From: plan/001_14b9dc2a33c7/P5M2T1S1/research/groundswell-cache-research.md
// SHA-256 of (system + user + responseFormat) = cache key
const cacheKey = sha256(systemPrompt + userPrompt + responseFormat);
```

**Best Practice:**

- Include ALL parameters that affect output in cache key
- Use consistent serialization (sorted keys, normalized whitespace)
- Version cache keys when schema changes

### 1.2 Semantic vs Exact Match Caching

**Exact Match (Current Implementation):**

- Simple hash-based lookup
- Fast, deterministic
- Use case: Repeated identical queries

**Semantic Match (Advanced Pattern):**

- Use embeddings to find similar queries
- Trade-off: Higher complexity for better hit rates
- Use case: Variations of similar questions

### 1.3 Cache Freshness Indicators

**Pattern from ESLint (lint-result-cache.js):**

```javascript
// Track configuration changes to invalidate cache
const configHashCache = new WeakMap();
const nodeVersion = process && process.version;

function hashOfConfigFor(config) {
  if (!configHashCache.has(config)) {
    configHashCache.set(
      config,
      hash(`${pkg.version}_${nodeVersion}_${stringify(config)}`)
    );
  }
  return configHashCache.get(config);
}
```

**Key Insight:** Include environment and version info in cache metadata.

---

## 2. File-Based Cache Invalidation Strategies

### 2.1 Strategy Comparison

| Strategy         | Description                      | Use Case                    | Performance   |
| ---------------- | -------------------------------- | --------------------------- | ------------- |
| **Metadata**     | Compare file size + mtime        | Fast, good for most cases   | O(1) per file |
| **Content Hash** | Compare SHA-256/MD5 of content   | Slow, 100% accurate         | O(n) per file |
| **Hybrid**       | Metadata first, hash on mismatch | Balance of speed + accuracy | O(1) → O(n)   |

### 2.2 Metadata-Based Invalidation

**Implementation from file-entry-cache (lines 110-134):**

```javascript
_getFileDescriptorUsingMtimeAndSize: function (file, fstat) {
  var meta = cache.getKey(file);
  var cacheExists = !!meta;

  var cSize = fstat.size;
  var cTime = fstat.mtime.getTime();

  var isDifferentDate;
  var isDifferentSize;

  if (!meta) {
    meta = { size: cSize, mtime: cTime };
  } else {
    isDifferentDate = cTime !== meta.mtime;
    isDifferentSize = cSize !== meta.size;
  }

  var nEntry = (normalizedEntries[file] = {
    key: file,
    changed: !cacheExists || isDifferentDate || isDifferentSize,
    meta: meta,
  });

  return nEntry;
}
```

**Pros:**

- Extremely fast (no file read)
- Suitable for large file sets

**Cons:**

- Rare edge case: different content, same size + mtime
- Not suitable for files with identical size/time patterns

### 2.3 Content Hash Invalidation

**Implementation from file-entry-cache (lines 136-163):**

```javascript
_getFileDescriptorUsingChecksum: function (file) {
  var meta = cache.getKey(file);
  var cacheExists = !!meta;

  var contentBuffer = fs.readFileSync(file);
  var isDifferent = true;
  var hash = this.getHash(contentBuffer);

  if (!meta) {
    meta = { hash: hash };
  } else {
    isDifferent = hash !== meta.hash;
  }

  var nEntry = (normalizedEntries[file] = {
    key: file,
    changed: !cacheExists || isDifferent,
    meta: meta,
  });

  return nEntry;
}
```

**Pros:**

- 100% accurate (content-based)
- Catches all changes

**Cons:**

- Slow (must read entire file)
- High I/O for large files

### 2.4 LRU Eviction Pattern

**Implementation from flat-cache (lines 111-128):**

```javascript
// Remove keys that were not accessed/set since last prune
_prune: function () {
  var me = this;
  var obj = {};
  var keys = Object.keys(me._visited);

  if (keys.length === 0) {
    return;
  }

  keys.forEach(function (key) {
    obj[key] = me._visited[key];
  });

  me._visited = {};
  me._persisted = obj;
}
```

**Pattern:** Track accessed keys, prune unvisited entries on save.

---

## 3. Time-Based Cache Expiration (TTL)

### 3.1 TTL Implementation Pattern

**From simple-update-notifier (cache.ts):**

```typescript
export const getLastUpdate = (packageName: string) => {
  const configFile = getConfigFile(packageName);

  try {
    if (!fs.existsSync(configFile)) {
      return undefined;
    }
    const file = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    return file.lastUpdateCheck as number;
  } catch {
    return undefined;
  }
};

export const saveLastUpdate = (packageName: string) => {
  const configFile = getConfigFile(packageName);

  fs.writeFileSync(
    configFile,
    JSON.stringify({ lastUpdateCheck: new Date().getTime() })
  );
};
```

**Pattern:**

1. Store timestamp in cache metadata
2. Check timestamp before using cached value
3. Regenerate if expired

### 3.2 24-Hour TTL Example

**Recommended Implementation:**

```typescript
const TTL_24_HOURS = 24 * 60 * 60 * 1000; // 86400000ms

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

function getWithTTL<T>(entry: CacheEntry<T>): T | null {
  const now = Date.now();
  const ttl = entry.ttl || TTL_24_HOURS;
  const age = now - entry.timestamp;

  if (age > ttl) {
    return null; // Expired
  }

  return entry.data;
}
```

### 3.3 TTL Strategies by Use Case

| Use Case         | Recommended TTL   | Rationale                      |
| ---------------- | ----------------- | ------------------------------ |
| LLM Responses    | 24-48 hours       | Models don't change frequently |
| Static Assets    | 1 year            | Content-addressed (hash-based) |
| API Responses    | 5-60 minutes      | Dynamic data, shorter TTL      |
| File Metadata    | Until file change | Event-based invalidation       |
| User Preferences | Never             | Manual invalidation only       |

---

## 4. Hash-Based Cache Key Generation

### 4.1 SHA-256 Pattern (Production Standard)

**From hacky-hack session-utils.ts (lines 161-168):**

```typescript
export async function hashPRD(prdPath: string): Promise<string> {
  try {
    const content = await readFile(prdPath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    throw new SessionFileError(prdPath, 'read PRD', error as Error);
  }
}
```

**Benefits:**

- Collision-resistant (practically impossible)
- Consistent across platforms
- Built into Node.js crypto module

### 4.2 MD5 Pattern (Legacy Fast Hash)

**From file-entry-cache (lines 46-48):**

```javascript
getHash: function (buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}
```

**Use when:**

- Speed is critical
- Cryptographic security not required
- Legacy compatibility needed

### 4.3 Cache Key Construction Best Practices

**DO:**

```typescript
// Good: Deterministic serialization
const key = sha256(
  JSON.stringify(
    {
      system: prompt.system,
      user: prompt.user,
      model: 'gpt-4',
      version: 1,
    },
    null,
    0
  )
); // No whitespace

// Good: Include versioning
const versionedKey = `v2:${key}`;

// Good: Normalize inputs
const normalized = userPrompt.trim().toLowerCase();
```

**DON'T:**

```typescript
// Bad: Non-deterministic
const key = JSON.stringify({ prompt, options }); // Key order varies

// Bad: Missing context
const key = sha256(userPrompt); // Missing system prompt

// Bad: No versioning
const key = sha256(prompt); // Breaks when schema changes
```

### 4.4 Multi-Component Cache Keys

**Pattern from Groundswell:**

```typescript
// Combine multiple inputs into single hash
const cacheKey = sha256(
  [systemPrompt, userPrompt, JSON.stringify(responseFormat), modelVersion].join(
    '|||'
  )
);
```

**Alternative: Delimiter-separated keys:**

```typescript
// For hierarchical caches
const cacheKey = `model:${model}:prompt:${hash}:version:${version}`;
```

---

## 5. Cache Hit/Miss Logging for Observability

### 5.1 Production Logging Pattern

**From hacky-hack task-orchestrator.ts (lines 739-751):**

```typescript
#logCacheMetrics(): void {
  const total = this.#cacheHits + this.#cacheMisses;
  const hitRatio = total > 0 ? (this.#cacheHits / total) * 100 : 0;

  this.#logger.debug(
    {
      hits: this.#cacheHits,
      misses: this.#cacheMisses,
      hitRatio: hitRatio.toFixed(1),
    },
    'Cache metrics'
  );
}
```

**Key Metrics:**

- Total cache hits
- Total cache misses
- Hit ratio percentage (1 decimal precision)

### 5.2 Per-Request Logging

**From task-orchestrator.ts (lines 584-594):**

```typescript
const cachedPRP = this.researchQueue.getPRP(subtask.id);
if (cachedPRP) {
  this.#cacheHits++;
  this.#logger.debug({ subtaskId: subtask.id }, 'Cache HIT - using cached PRP');
} else {
  this.#cacheMisses++;
  this.#logger.debug(
    { subtaskId: subtask.id },
    'Cache MISS - PRP will be generated by PRPRuntime'
  );
}
```

### 5.3 Structured Logging Format

**Recommended Schema:**

```typescript
interface CacheLogEvent {
  level: 'debug' | 'info' | 'warn';
  event: 'cache_hit' | 'cache_miss' | 'cache_metrics';
  cacheKey: string;
  hitRatio?: number;
  latency?: number;
  timestamp: number;
}
```

**Example Usage:**

```typescript
logger.info(
  {
    event: 'cache_hit',
    cacheKey: 'abc123',
    latency: 5, // ms
    timestamp: Date.now(),
  },
  'Cache hit'
);
```

### 5.4 Hit Rate Benchmarks

**From groundswell-cache-research.md:**

- **Excellent:** >85% hit rate
- **Good:** >70% hit rate
- **Needs investigation:** <50% hit rate

### 5.5 Timing-Based Cache Detection

**From cache-verification.test.ts (lines 269-285):**

```typescript
// In production Groundswell cache behavior:
// 1. Cache hit: prompt() returns instantly without API call
// 2. Cache miss: prompt() makes API call (1-5s latency)
// 3. No direct way to measure cache hits - infer from timing only
//
// For comprehensive cache testing:
// - Use timing: <10ms = cache hit, >1000ms = cache miss
// - Monitor API call counts (cached calls don't increment)
// - Log before/after agent runs to measure duration
```

---

## 6. --no-cache Flag Patterns in CLI Tools

### 6.1 Commander.js Pattern

**From hacky-hack cli/index.ts:**

```typescript
export interface CLIArgs {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  dryRun: boolean;
  verbose: boolean;
  machineReadable: boolean;
}

export function parseCLIArgs(): CLIArgs {
  const program = new Command();

  program
    .name('prp-pipeline')
    .description('PRD to PRP Pipeline - Automated software development')
    .version('1.0.0')
    .option('--prd <path>', 'Path to PRD markdown file', './PRD.md')
    .option('--scope <scope>', 'Scope identifier (e.g., P3.M4, P3.M4.T2)')
    .addOption(
      program
        .createOption('--mode <mode>', 'Execution mode')
        .choices(['normal', 'bug-hunt', 'validate'])
        .default('normal')
    )
    .option('--continue', 'Resume from previous session', false)
    .option('--dry-run', 'Show plan without executing', false)
    .option('--verbose', 'Enable debug logging', false)
    .option('--machine-readable', 'Enable machine-readable JSON output', false)
    .parse(process.argv);

  return program.opts<CLIArgs>();
}
```

### 6.2 Adding --no-cache Flag

**Recommended Implementation:**

```typescript
export interface CLIArgs {
  // ... existing fields
  noCache: boolean; // NEW: Cache bypass flag
}

export function parseCLIArgs(): CLIArgs {
  const program = new Command();

  program
    // ... existing options
    .option('--no-cache', 'Bypass cache and regenerate all responses', false)
    .parse(process.argv);

  return program.opts<CLIArgs>();
}
```

### 6.3 Cache Bypass Implementation Pattern

**Recommended Logic:**

```typescript
class PRPPipeline {
  async executeSubtask(subtask: Subtask): Promise<Result> {
    const { noCache } = this.args;

    if (noCache) {
      this.logger.debug('Cache bypassed via --no-cache flag');
      return await this.generatePRP(subtask); // Always regenerate
    }

    // Normal caching logic
    const cached = this.cache.get(subtask.id);
    if (cached) {
      return cached;
    }

    return await this.generatePRP(subtask);
  }
}
```

### 6.4 Industry Examples

| Tool     | Flag               | Behavior                                 |
| -------- | ------------------ | ---------------------------------------- |
| npm      | `--cache-min`      | Force re-download if cache age > minutes |
| npm      | `--prefer-offline` | Use cache even if stale                  |
| webpack  | `--no-cache`       | Bypass webpack cache entirely            |
| eslint   | `--cache-file`     | Specify custom cache location            |
| prettier | `--no-cache`       | Disable cache (if implemented)           |

---

## 7. Cache Metadata Storage Patterns

### 7.1 JSON File Format

**From flat-cache:**

```javascript
// Cache file structure
{
  "cacheKey1": {
    "data": { /* cached content */ },
    "timestamp": 1704067200000,
    "meta": { /* optional metadata */ }
  },
  "cacheKey2": { /* ... */ }
}
```

### 7.2 Atomic Write Pattern

**From hacky-hack session-utils.ts (lines 93-111):**

```typescript
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}
```

**Benefits:**

- Prevents partial writes on crash
- Rename is atomic on same filesystem
- Always have valid cache file

### 7.3 Metadata Schema

**Recommended Structure:**

```typescript
interface CacheMetadata {
  // Content data
  data: unknown;

  // Timestamps
  createdAt: number;
  accessedAt: number;
  updatedAt: number;

  // Cache control
  ttl?: number;
  version: string;
  tags?: string[];

  // Validation
  checksum?: string;
  size?: number;
}

interface CacheEntry {
  key: string;
  metadata: CacheMetadata;
  value: string;
}
```

### 7.4 Directory Structure Pattern

**Flat File Structure:**

```
.cache/
├── cache.json           # Main cache storage
├── cache.lock           # File lock (optional)
└── metadata.json        # Cache metadata (optional)
```

**Hierarchical Structure:**

```
.cache/
├── prps/
│   ├── P1.M1.T1.S1.json
│   └── P1.M1.T1.S2.json
├── responses/
│   ├── abc123.json
│   └── def456.json
└── index.json           # Cache index
```

---

## 8. Production Implementation Examples

### 8.1 ESLint Lint Result Cache

**Source:** `/home/dustin/projects/hacky-hack/node_modules/eslint/lib/cli-engine/lint-result-cache.js`

**Key Features:**

- File-entry-cache wrapper with metadata tracking
- Config hash invalidation
- Source file lazy loading (read on cache hit)
- Persistent cache file on disk

**Code Example (lines 105-153):**

```javascript
getCachedLintResults(filePath, config) {
  const fileDescriptor = this.fileEntryCache.getFileDescriptor(filePath);
  const hashOfConfig = hashOfConfigFor(config);
  const changed =
    fileDescriptor.changed ||
    fileDescriptor.meta.hashOfConfig !== hashOfConfig;

  if (fileDescriptor.notFound) {
    debug(`File not found on the file system: ${filePath}`);
    return null;
  }

  if (changed) {
    debug(`Cache entry not found or no longer valid: ${filePath}`);
    return null;
  }

  const cachedResults = fileDescriptor.meta.results;

  // Shallow clone to prevent accidental mutation
  const results = { ...cachedResults };

  // Re-read source if needed
  if (results.source === null) {
    debug(`Rereading cached result source from filesystem: ${filePath}`);
    results.source = fs.readFileSync(filePath, "utf-8");
  }

  return results;
}
```

### 8.2 Flat-Cache Library

**Source:** `/home/dustin/projects/hacky-hack/node_modules/flat-cache/src/cache.js`

**Key Features:**

- In-memory + persistent storage
- Visited key tracking (prune unvisited)
- Simple JSON file storage
- Cache file location customization

**Usage Pattern:**

```javascript
const flatCache = require('flat-cache');
const cache = flatCache.load('myCache', './cache-dir');

// Set value
cache.setKey('key', { data: 'value' });

// Get value
const value = cache.getKey('key');

// Persist to disk
cache.save(); // or cache.save(true) to skip pruning

// Clear cache
cache.destroy();
```

### 8.3 File-Entry-Cache Library

**Source:** `/home/dustin/projects/hacky-hack/node_modules/file-entry-cache/cache.js`

**Key Features:**

- Metadata or content-based change detection
- File analysis (changed/unchanged/not found)
- Checksum validation
- Automatic removal of deleted files

**Usage Pattern:**

```javascript
const fileEntryCache = require('file-entry-cache');
const cache = fileEntryCache.create('cacheFile', './cache', true);

// Check if files changed
const changedFiles = cache.getUpdatedFiles(files);

// Reconcile and persist
cache.reconcile();
```

### 8.4 Hacky-Hack Cache Implementation

**Groundswell LLM Cache:**

- Location: Internal to Groundswell SDK
- Method: SHA-256 of (system + user + responseFormat)
- Invalidation: Automatic on prompt change
- Verification: Timing-based (<10ms = hit)

**PRP Cache (Research Queue):**

- Location: `src/core/research-queue.ts`
- Method: In-memory Map<taskId, PRPDocument>
- Metrics: Hit/miss tracking with ratio logging
- Verification: Debug logs + metrics

**File Hash Cache (Session Utils):**

- Location: `src/core/session-utils.ts`
- Method: SHA-256 of file content
- Usage: PRD delta detection
- Format: 64-char hex, truncated to 12 for session IDs

---

## Implementation Recommendations

### For LLM Response Caching

1. **Use SHA-256 for cache keys** (include all inputs)
2. **Enable caching by default** (Groundswell pattern)
3. **Add --no-cache flag** for debugging/force refresh
4. **Log hit/miss ratios** for observability
5. **Use timing detection** for verification

### For File-Based Caching

1. **Atomic writes** (temp file + rename)
2. **Metadata-based invalidation** (mtime + size)
3. **Content hash fallback** (when needed)
4. **Version your cache keys**
5. **Prune unvisited entries** (LRU pattern)

### For CLI Cache Bypass

1. **Add --no-cache flag** (standard pattern)
2. **Skip cache reads** when flag is set
3. **Log cache bypass** for observability
4. **Consider --cache-location** for customization
5. **Document cache behavior** in help text

---

## References & URLs

### Production Libraries

- **flat-cache** (npm)
  - Repository: https://github.com/royriojas/flat-cache
  - Used by: simple-update-notifier, various build tools
  - Pattern: Simple JSON file cache with pruning

- **file-entry-cache** (npm)
  - Repository: https://github.com/royriojas/file-entry-cache
  - Used by: ESLint
  - Pattern: Metadata or checksum-based file change detection

- **ESLint Lint Result Cache**
  - Source: `/home/dustin/projects/hacky-hack/node_modules/eslint/lib/cli-engine/lint-result-cache.js`
  - Features: Config hash invalidation, lazy source loading

### Industry Tools

- **npm cache**
  - Documentation: https://docs.npmjs.com/cli/v9/using-npm/cache
  - Flags: `--cache-min`, `--prefer-offline`, `--cache-location`

- **webpack cache**
  - Documentation: https://webpack.js.org/configuration/cache
  - Flags: `--no-cache` to bypass
  - Features: File system cache, content hashing

### Internal Documentation

- **Groundswell Cache Research**
  - Location: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P5M2T1S1/research/groundswell-cache-research.md`
  - Content: SHA-256 caching, hit rate benchmarks, verification methods

- **Cache Verification Tests**
  - Location: `/home/dustin/projects/hacky-hack/tests/unit/agents/cache-verification.test.ts`
  - Content: Test patterns for cache hit detection, timing verification

### Code Examples

- **CLI Argument Parsing**
  - Location: `/home/dustin/projects/hacky-hack/src/cli/index.ts`
  - Pattern: Commander.js with type-safe options

- **Cache Metrics Logging**
  - Location: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` (lines 85-86, 584-598, 739-751)
  - Pattern: Hit/miss tracking with ratio calculation

- **SHA-256 Hashing**
  - Location: `/home/dustin/projects/hacky-hack/src/core/session-utils.ts` (lines 161-168)
  - Pattern: Node.js crypto.createHash('sha256')

---

## Conclusion

This research identifies production-ready patterns from established Node.js libraries and industry-standard CLI tools. The following patterns are recommended for implementation:

1. **Hash-based keys** (SHA-256) with full input serialization
2. **Metadata-based invalidation** with content hash fallback
3. **Atomic writes** for cache file persistence
4. **Structured logging** with hit/miss metrics
5. **--no-cache flag** for CLI bypass functionality
6. **TTL support** for time-based expiration (24-hour default)

All patterns are backed by production implementations in flat-cache, file-entry-cache, ESLint, and the hacky-hack codebase itself.
