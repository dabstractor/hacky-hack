# Cache Statistics and Cleanup Best Practices

## Executive Summary

This document captures best practices for implementing cache statistics tracking and cleanup functionality in TypeScript/Node.js applications.

## Core Metrics to Track

### 1. Hit/Miss Metrics

```typescript
interface CacheHitMissMetrics {
  /** Total number of cache hits */
  hits: number;

  /** Total number of cache misses */
  misses: number;

  /** Hit ratio as percentage (0-100) */
  hitRatio: number;

  /** Miss rate as percentage (0-100) */
  missRate: number;
}
```

### 2. Eviction Metrics

```typescript
interface CacheEvictionMetrics {
  /** Total number of evictions */
  totalEvictions: number;

  /** Evictions due to TTL expiration */
  expiredEvictions: number;

  /** Evictions due to capacity limits */
  capacityEvictions: number;

  /** Manual evictions (user-initiated) */
  manualEvictions: number;

  /** Evictions due to errors (corrupted data, etc.) */
  errorEvictions: number;
}
```

### 3. Size Metrics

```typescript
interface CacheSizeMetrics {
  /** Total number of entries in cache */
  totalEntries: number;

  /** Total bytes used by cache */
  totalBytes: number;

  /** Maximum cache size in bytes (if applicable) */
  maxBytes?: number;

  /** Utilization percentage */
  utilizationPercentage: number;
}
```

## Complete Cache Statistics Interface

```typescript
interface CacheStatistics {
  /** Cache identifier */
  cacheId: string;

  /** Hit/miss metrics */
  hits: number;
  misses: number;
  hitRatio: number;

  /** Eviction metrics */
  evictions: {
    total: number;
    expired: number;
    capacity: number;
    manual: number;
    error: number;
  };

  /** Size metrics */
  totalEntries: number;
  totalBytes: number;
  maxBytes?: number;
  utilizationPercentage: number;

  /** Performance metrics */
  avgHitLatency: number;
  avgMissLatency: number;

  /** Health metrics */
  errorCount: number;
  lastCleanupTimestamp: number;
  createdAt: number;
  updatedAt: number;
}
```

## Cache Cleanup Strategies

### 1. TTL-Based Cleanup

Remove entries that have exceeded their time-to-live.

```typescript
async cleanExpired(): Promise<CleanupResult> {
  const entries = await this.scanCacheEntries();
  const now = Date.now();
  const expired: CacheEntryMetadata[] = [];

  for (const entry of entries) {
    const age = now - entry.accessedAt;
    if (age > entry.ttl) {
      expired.push(entry);
    }
  }

  let removed = 0;
  let failed = 0;

  for (const entry of expired) {
    try {
      await this.removeEntry(entry.taskId);
      removed++;
      this.#evictions.expired++;
    } catch (error) {
      failed++;
      this.#errorCount++;
    }
  }

  return { removed, failed, reason: 'expired' };
}
```

### 2. Manual Clear All

Complete cache reset with optional backup.

```typescript
async clearAll(options?: { backup?: boolean }): Promise<CleanupResult> {
  const entries = await this.scanCacheEntries();
  let removed = 0;
  let failed = 0;

  // Optional backup
  if (options?.backup) {
    await this.createBackup();
  }

  for (const entry of entries) {
    try {
      await this.removeEntry(entry.taskId);
      removed++;
      this.#evictions.manual++;
    } catch (error) {
      failed++;
      this.#errorCount++;
    }
  }

  // Reset statistics
  this.#resetStatistics();

  return { removed, failed, reason: 'manual' };
}
```

## File-Based Operations (Safe Patterns)

### Atomic Delete Pattern

```typescript
async removeEntry(taskId: string): Promise<void> {
  const filePath = this.getEntryPath(taskId);
  const tempPath = `${filePath}.tmp`;

  try {
    // Rename to temp (atomic operation)
    await fs.rename(filePath, tempPath);

    // Unlink temp file
    await fs.unlink(tempPath);

    this.#logger.debug({ taskId }, 'Entry removed');
  } catch (error) {
    this.#logger.error({ taskId, error }, 'Failed to remove entry');
    throw error;
  }
}
```

### Safe Read Pattern

```typescript
async loadEntry<T>(taskId: string): Promise<T | null> {
  const filePath = this.getEntryPath(taskId);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    this.#logger.error({ taskId, error }, 'Failed to load entry');
    return null;
  }
}
```

## Implementation Checklist

### Statistics Tracking
- [ ] Track cache hits and misses
- [ ] Calculate hit ratio percentage
- [ ] Track evictions by reason (expired, capacity, manual, error)
- [ ] Track total entries and bytes
- [ ] Calculate utilization percentage
- [ ] Track average hit/miss latency
- [ ] Track error count
- [ ] Track last cleanup timestamp

### Cleanup Functionality
- [ ] Implement TTL-based expiration check
- [ ] Implement atomic file delete pattern
- [ ] Handle errors gracefully during cleanup
- [ ] Implement clear all functionality
- [ ] Optional backup before clear
- [ ] Reset statistics after clear

### Safety and Reliability
- [ ] Use atomic rename-then-unlink pattern
- [ ] Continue cleanup on individual file failures
- [ ] Log all operations and errors
- [ ] Validate cache metadata before use
- [ ] Handle corrupted cache files gracefully

### Monitoring and Reporting
- [ ] Provide statistics interface
- [ ] Log cleanup operations
- [ ] Report cleanup results (removed, failed)
- [ ] Support dry-run mode
- [ ] Support force mode (skip confirmation)
