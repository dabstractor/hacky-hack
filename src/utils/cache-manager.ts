/**
 * Cache Manager for PRP cache statistics and cleanup
 *
 * @module utils/cache-manager
 *
 * @remarks
 * Provides comprehensive cache management including statistics tracking,
 * expired entry cleanup, and full cache clearing capabilities.
 * Uses atomic file operations for safe cleanup.
 *
 * @example
 * ```typescript
 * import { CacheManager } from './utils/cache-manager.js';
 *
 * const manager = new CacheManager(sessionPath, cacheTtlMs);
 * const stats = await manager.getStats();
 * console.log(`Cache entries: ${stats.totalEntries}`);
 * ```
 */

import { resolve } from 'node:path';
import { promises as fs } from 'node:fs';
import { getLogger } from './logger.js';
import type { Logger } from './logger.js';
import type { PRPCacheMetadata } from '../agents/prp-generator.js';

/**
 * Cache statistics information
 */
export interface CacheStatistics {
  /** Cache identifier (session path) */
  cacheId: string;

  /** Total cache hits (tracked by PRPGenerator, not available here) */
  hits: number;

  /** Total cache misses (tracked by PRPGenerator, not available here) */
  misses: number;

  /** Hit ratio as percentage (0-100) */
  hitRatio: number;

  /** Total number of cache entries */
  totalEntries: number;

  /** Total bytes used by cache */
  totalBytes: number;

  /** Number of expired entries */
  expiredEntries: number;

  /** Oldest entry timestamp */
  oldestEntry?: number;

  /** Newest entry timestamp */
  newestEntry?: number;

  /** Timestamp when stats were collected */
  collectedAt: number;
}

/**
 * Cache entry information
 */
export interface CacheEntryInfo {
  /** Task ID */
  taskId: string;

  /** Cache metadata file path */
  metadataPath: string;

  /** PRP file path */
  prpPath: string;

  /** Entry creation timestamp */
  createdAt: number;

  /** Entry last accessed timestamp */
  accessedAt: number;

  /** Entry size in bytes */
  size: number;

  /** Whether entry is expired */
  isExpired: boolean;

  /** Age in milliseconds */
  age: number;
}

/**
 * Cleanup result information
 */
export interface CleanupResult {
  /** Number of entries removed */
  removed: number;

  /** Number of entries that failed to remove */
  failed: number;

  /** Reason for cleanup ('expired', 'manual') */
  reason: string;

  /** List of removed entry IDs */
  removedEntries?: string[];

  /** List of failed entry IDs with errors */
  failedEntries?: Array<{ taskId: string; error: string }>;

  /** Duration of cleanup in milliseconds */
  duration: number;
}

/**
 * Cache Manager for PRP cache statistics and cleanup
 *
 * @remarks
 * Provides comprehensive cache management including statistics tracking,
 * expired entry cleanup, and full cache clearing capabilities.
 * Uses atomic file operations for safe cleanup.
 */
export class CacheManager {
  readonly #logger: Logger;
  readonly #sessionPath: string;
  readonly #cacheTtlMs: number;
  readonly #cacheDir: string;

  /**
   * Creates a new CacheManager instance
   *
   * @param sessionPath - Path to session directory
   * @param cacheTtlMs - Cache TTL in milliseconds (default: 24 hours)
   */
  constructor(sessionPath: string, cacheTtlMs: number = 24 * 60 * 60 * 1000) {
    this.#logger = getLogger('CacheManager');
    this.#sessionPath = sessionPath;
    this.#cacheTtlMs = cacheTtlMs;
    this.#cacheDir = resolve(sessionPath, 'prps', '.cache');
  }

  /**
   * Gets comprehensive cache statistics
   *
   * @returns Cache statistics
   */
  async getStats(): Promise<CacheStatistics> {
    const entries = await this.#scanEntries();
    const now = Date.now();

    let totalBytes = 0;
    let expiredCount = 0;
    let oldest: number | undefined;
    let newest: number | undefined;

    for (const entry of entries) {
      totalBytes += entry.size;

      if (entry.isExpired) {
        expiredCount++;
      }

      if (oldest === undefined || entry.accessedAt < oldest) {
        oldest = entry.accessedAt;
      }

      if (newest === undefined || entry.accessedAt > newest) {
        newest = entry.accessedAt;
      }
    }

    // Note: hits/misses tracked by PRPGenerator, not available here
    // We return 0 for those metrics as they're tracked separately
    return {
      cacheId: this.#sessionPath,
      hits: 0,
      misses: 0,
      hitRatio: 0,
      totalEntries: entries.length,
      totalBytes,
      expiredEntries: expiredCount,
      oldestEntry: oldest,
      newestEntry: newest,
      collectedAt: now,
    };
  }

  /**
   * Removes expired cache entries
   *
   * @returns Cleanup result with removed/failed counts
   */
  async cleanExpired(): Promise<CleanupResult> {
    const startTime = performance.now();
    const entries = await this.#scanEntries();
    const expired = entries.filter(e => e.isExpired);

    const removed: string[] = [];
    const failed: Array<{ taskId: string; error: string }> = [];

    for (const entry of expired) {
      try {
        await this.#removeEntry(entry);
        removed.push(entry.taskId);
      } catch (error) {
        failed.push({
          taskId: entry.taskId,
          error: error instanceof Error ? error.message : String(error),
        });
        this.#logger.warn(
          { taskId: entry.taskId, error },
          'Failed to remove expired entry'
        );
      }
    }

    const duration = performance.now() - startTime;

    this.#logger.info(
      { removed: removed.length, failed: failed.length, duration },
      'Cache cleanup complete'
    );

    return {
      removed: removed.length,
      failed: failed.length,
      reason: 'expired',
      removedEntries: removed,
      failedEntries: failed,
      duration,
    };
  }

  /**
   * Removes all cache entries
   *
   * @returns Cleanup result with removed/failed counts
   */
  async clear(): Promise<CleanupResult> {
    const startTime = performance.now();
    const entries = await this.#scanEntries();

    const removed: string[] = [];
    const failed: Array<{ taskId: string; error: string }> = [];

    for (const entry of entries) {
      try {
        await this.#removeEntry(entry);
        removed.push(entry.taskId);
      } catch (error) {
        failed.push({
          taskId: entry.taskId,
          error: error instanceof Error ? error.message : String(error),
        });
        this.#logger.warn(
          { taskId: entry.taskId, error },
          'Failed to remove entry'
        );
      }
    }

    const duration = performance.now() - startTime;

    this.#logger.info(
      { removed: removed.length, failed: failed.length, duration },
      'Cache clear complete'
    );

    return {
      removed: removed.length,
      failed: failed.length,
      reason: 'manual',
      removedEntries: removed,
      failedEntries: failed,
      duration,
    };
  }

  /**
   * Scans all cache entries
   *
   * @returns Array of cache entry information
   */
  async #scanEntries(): Promise<CacheEntryInfo[]> {
    const entries: CacheEntryInfo[] = [];
    const now = Date.now();

    try {
      const files = await fs.readdir(this.#cacheDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const taskId = file.replace('.json', '').replace(/_/g, '.');
        const metadataPath = resolve(this.#cacheDir, file);

        try {
          const content = await fs.readFile(metadataPath, 'utf-8');
          const metadata: PRPCacheMetadata = JSON.parse(content);

          const stat = await fs.stat(metadataPath);
          const age = now - metadata.accessedAt;
          const isExpired = age > this.#cacheTtlMs;

          entries.push({
            taskId,
            metadataPath,
            prpPath: resolve(
              this.#sessionPath,
              'prps',
              file.replace('.json', '.md')
            ),
            createdAt: metadata.createdAt,
            accessedAt: metadata.accessedAt,
            size: stat.size,
            isExpired,
            age,
          });
        } catch (error) {
          this.#logger.warn({ file, error }, 'Failed to read cache metadata');
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.#logger.error({ error }, 'Failed to scan cache directory');
      }
    }

    return entries;
  }

  /**
   * Removes a cache entry using atomic rename-then-unlink pattern
   *
   * @param entry - Cache entry to remove
   */
  async #removeEntry(entry: CacheEntryInfo): Promise<void> {
    const tempPath = `${entry.metadataPath}.tmp`;

    // Atomic rename
    await fs.rename(entry.metadataPath, tempPath);

    // Unlink temp file
    await fs.unlink(tempPath);
  }
}
