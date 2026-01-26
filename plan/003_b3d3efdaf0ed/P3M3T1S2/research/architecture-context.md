# Architecture Context for Cache Statistics and Cleanup

## Executive Summary

This document captures the architecture context and constraints for implementing cache statistics and cleanup functionality in P3.M3.T1.S2.

## Current Cache Implementation

### Cache Directory Structure

```
plan/{session_id}/prps/
├── {taskId}.md                # PRP markdown files (e.g., P1_M1_T1_S1.md)
└── .cache/                    # Cache metadata directory
    └── {taskId}.json          # Cache metadata files (e.g., P1_M1_T1_S1.json)
```

### Cache Metadata Interface

**From `src/agents/prp-generator.ts` (lines 96-103):**

```typescript
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;
}
```

### Current Cache Metrics (PRPGenerator)

**From `src/agents/prp-generator.ts` (lines 144-148):**

```typescript
/** Cache hit counter for metrics */
#cacheHits: number = 0;

/** Cache miss counter for metrics */
#cacheMisses: number = 0;
```

### Current Cache Logging

**From `src/agents/prp-generator.ts` (lines 363-375):**

```typescript
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
```

## What P3.M3.T1.S1 Implemented (DO NOT DUPLICATE)

### Configurable TTL

**File**: `src/agents/prp-generator.ts`

- Changed `CACHE_TTL_MS` constant to `#cacheTtlMs` instance property
- Added `cacheTtlMs` parameter to PRPGenerator constructor
- Default value: `24 * 60 * 60 * 1000` (24 hours)

### CLI Option

**File**: `src/cli/index.ts`

- Added `--cache-ttl <duration>` option
- Environment variable: `HACKY_PRP_CACHE_TTL`
- Human-readable durations: "24h", "1d", "12h", "30m"
- Validation: 1 minute minimum, 30 days maximum

### Integration Points

**File**: `src/core/task-orchestrator.ts`

- Passes `cacheTtlMs` to PRPGenerator constructor

## What P3.M3.T1.S2 Should Implement

### 1. Cache Statistics Tracking

Extend PRPGenerator or create CacheManager with:

- **Additional metrics beyond basic hit/miss**:
  - Total cache size (bytes)
  - Number of cached PRPs
  - Eviction tracking (expired, manual, error)
  - Age distribution of cached items
  - Last accessed timestamps

- **New methods**:
  - `getCacheStats()` - Returns comprehensive statistics
  - `getCacheSize()` - Returns total bytes
  - `getCacheEntries()` - Returns list of cached entries

### 2. Cache Cleanup Functionality

- **Clean expired entries**:
  - Scan cache directory for expired files
  - Remove based on TTL from P3.M3.T1.S1
  - Report number of entries removed

- **Clear all cache**:
  - Remove all cache metadata files
  - Reset statistics
  - Optional confirmation

### 3. CLI Commands

**File**: `src/cli/commands/cache.ts` (NEW)

Create subcommands:

- `prd cache stats` - Display cache statistics
- `prd cache clean` - Remove expired entries
- `prd cache clear` - Remove all cache entries

### 4. Cache Manager Class

**File**: `src/utils/cache-manager.ts` (NEW)

Create a dedicated CacheManager class that:

- Works with PRPGenerator cache structure
- Provides statistics and cleanup methods
- Integrates with session management

## Integration Points

### PRPGenerator (src/agents/prp-generator.ts)

**Current cache paths** (lines 191-209):

```typescript
getCachePath(taskId: string): string {
  const sanitized = taskId.replace(/\./g, '_');
  return join(this.sessionPath, 'prps', `${sanitized}.md`);
}

getCacheMetadataPath(taskId: string): string {
  const sanitized = taskId.replace(/\./g, '_');
  return join(this.sessionPath, 'prps', '.cache', `${sanitized}.json`);
}
```

**These paths should be used by CacheManager for consistency.**

### Session Manager

**Session path is available via:**

```typescript
sessionManager.currentSession.metadata.path;
```

This is the base path for cache directories.

## Key Constraints

### File Permissions

Cache files are created with mode `0o644` (from line 332 of prp-generator.ts):

```typescript
await writeFile(metadataPath, JSON.stringify(metadata, null, 2), {
  mode: 0o644,
});
```

### Never Modify (Protected Files)

- `tasks.json` - Single source of truth for task state
- `prd_snapshot.md` - PRD snapshot for session
- `PRD.md` - Original product requirements document
- Any PRP files (`prps/*.md`) - Generated PRP content

### Cache-Only Operations

The CacheManager should ONLY operate on:

- `prps/.cache/*.json` - Cache metadata files

### Environment Variable Naming

Follow existing pattern:

- Use `HACKY_` prefix for application-specific configuration
- Example: `HACKY_CACHE_AUTO_CLEANUP` for auto-cleanup feature

## Cache Expiration Logic (Existing)

**From `src/agents/prp-generator.ts` (lines 263-272):**

```typescript
async #isCacheRecent(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < this.CACHE_TTL_MS;
  } catch {
    return false;
  }
}
```

**Note**: After P3.M3.T1.S1, this will use `this.#cacheTtlMs` instead of constant.

## System Context Requirements (from system_context.md)

### Current Limitations

1. **No cache statistics reporting** - Only basic hit/miss counters
2. **No cleanup command** - Expired entries remain on disk
3. **No cache size tracking** - No visibility into disk usage
4. **No auto-cleanup** - No mechanism to remove stale cache

### P3.M3.T1.S2 Deliverables

1. Cache statistics (hit/miss/eviction tracking)
2. `prd cache stats` command
3. `prd cache clean` command (remove expired)
4. `prd cache clear` command (remove all)
5. `--cache-prune` option (auto-clean on startup)
6. CacheManager class at `src/utils/cache-manager.ts`
7. Tests at `tests/unit/cache-manager.test.ts`

## Dependencies

### Existing Code to Follow

1. **CLI Commands Pattern**: `src/cli/commands/artifacts.ts`, `src/cli/commands/inspect.ts`
2. **Test Patterns**: `tests/unit/agents/prp-generator.test.ts`
3. **Cache Structure**: `src/agents/prp-generator.ts`
4. **Session Management**: `src/core/session-manager.ts`

### External Dependencies

- `node:fs/promises` - File operations (already imported)
- `chalk` - Terminal colors (already in use)
- `cli-table3` - Table formatting (already in use)
- `commander` - CLI framework (already in use)

## Summary

| Aspect            | P3.M3.T1.S1 (Previous)  | P3.M3.T1.S2 (This Task)       |
| ----------------- | ----------------------- | ----------------------------- |
| TTL Configuration | ✅ Configurable TTL     | ❌ Not in scope               |
| Statistics        | Basic hit/miss counters | Comprehensive stats           |
| CLI Commands      | `--cache-ttl` option    | `prd cache stats/clean/clear` |
| CacheManager      | ❌ None                 | ✅ Create new class           |
| Cleanup           | ❌ None                 | ✅ Clean/clear commands       |
| Auto-cleanup      | ❌ None                 | ✅ `--cache-prune` option     |
| Tests             | TTL configuration tests | CacheManager tests            |
