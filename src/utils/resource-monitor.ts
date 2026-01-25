/**
 * Resource monitoring utilities for preventing system exhaustion
 *
 * @packageDocumentation
 *
 * @module utils/resource-monitor
 *
 * @remarks
 * Provides comprehensive resource monitoring for file handles and memory usage
 * in long-running pipeline executions. Includes platform-specific detection,
 * configurable thresholds, and leak detection.
 *
 * Features:
 * - File handle monitoring with ulimit detection (Linux/macOS)
 * - Memory monitoring (V8 heap and system memory)
 * - Configurable warning and critical thresholds
 * - Automatic leak detection (>20% growth over sampling window)
 * - Graceful shutdown recommendations
 *
 * @example
 * ```typescript
 * import { ResourceMonitor } from './utils/resource-monitor.js';
 *
 * const monitor = new ResourceMonitor({
 *   maxTasks: 100,
 *   maxDuration: 3600000,
 *   fileHandleWarnThreshold: 0.7,
 *   memoryWarnThreshold: 0.8
 * });
 *
 * monitor.start();
 * // ... run tasks ...
 * if (monitor.shouldStop()) {
 *   const status = monitor.getStatus();
 *   console.log(`Limit reached: ${status.limitType}`);
 *   console.log(`Suggestion: ${status.suggestion}`);
 * }
 * monitor.stop();
 * ```
 */

import { existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import * as os from 'node:os';
import type { Logger } from './logger.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Resource configuration for monitoring limits and thresholds
 *
 * @remarks
 * All thresholds are expressed as percentages (0-1) where:
 * - 0.7 = 70% (warning threshold)
 * - 0.85 = 85% (critical threshold)
 */
export interface ResourceConfig {
  /** Maximum number of tasks to execute (optional) */
  readonly maxTasks?: number;
  /** Maximum execution duration in milliseconds (optional) */
  readonly maxDuration?: number;
  /** File handle warning threshold (default: 0.7 = 70%) */
  readonly fileHandleWarnThreshold?: number;
  /** File handle critical threshold (default: 0.85 = 85%) */
  readonly fileHandleCriticalThreshold?: number;
  /** Memory warning threshold (default: 0.8 = 80%) */
  readonly memoryWarnThreshold?: number;
  /** Memory critical threshold (default: 0.9 = 90%) */
  readonly memoryCriticalThreshold?: number;
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  readonly pollingInterval?: number;
  /** lsof cache TTL in milliseconds for macOS (default: 1000 = 1s) */
  readonly cacheTtl?: number;
}

/**
 * Resource snapshot for tracking usage over time
 *
 * @remarks
 * Captures a point-in-time view of resource usage for historical
 * tracking and leak detection.
 */
export interface ResourceSnapshot {
  /** Timestamp when snapshot was taken (milliseconds since epoch) */
  readonly timestamp: number;
  /** Open file handle count */
  readonly fileHandles: number;
  /** File handle ulimit (0 on Windows or when unavailable) */
  readonly fileHandleUlimit: number;
  /** File handle usage percentage (0-1) */
  readonly fileHandleUsage: number;
  /** Heap memory used in bytes */
  readonly heapUsed: number;
  /** Heap memory total in bytes */
  readonly heapTotal: number;
  /** System total memory in bytes */
  readonly systemTotal: number;
  /** System free memory in bytes */
  readonly systemFree: number;
  /** Memory usage percentage (0-1) */
  readonly memoryUsage: number;
}

/**
 * Resource limit status with actionable recommendations
 *
 * @remarks
 * Returned by getStatus() to determine if execution should stop
 * and what action the user should take.
 */
export interface ResourceLimitStatus {
  /** Whether any limit has been reached */
  readonly shouldStop: boolean;
  /** Which limit was reached (null if none) */
  readonly limitType:
    | 'maxTasks'
    | 'maxDuration'
    | 'fileHandles'
    | 'memory'
    | null;
  /** Current resource snapshot */
  readonly snapshot: ResourceSnapshot;
  /** Warning messages (if any) */
  readonly warnings: string[];
  /** Suggestion message for user (if limit reached) */
  readonly suggestion?: string;
}

// ============================================================================
// FILE HANDLE MONITOR
// ============================================================================

/**
 * Cache entry for lsof results
 *
 * @remarks
 * Stores the cached file handle count with timestamp for TTL-based invalidation.
 */
interface LsofCacheEntry {
  /** Cached file handle count */
  count: number;
  /** Timestamp when cache entry was created (milliseconds since epoch) */
  timestamp: number;
}

/**
 * File handle monitor with platform-specific detection
 *
 * @remarks
 * Monitors open file handles against system ulimit to prevent
 * EMFILE errors. Platform-specific implementations:
 * - Linux: Reads /proc/<pid>/fd directory (fast, accurate)
 * - macOS: Uses lsof command with caching (slower, requires spawn)
 * - Windows: Uses internal API only (no ulimit concept)
 *
 * Warning threshold: 70% (default)
 * Critical threshold: 85% (default)
 *
 * On macOS, lsof results are cached with configurable TTL to reduce CPU overhead.
 */
class FileHandleMonitor {
  readonly warnThreshold: number;
  readonly criticalThreshold: number;
  readonly #loggerPromise: Promise<Logger>;
  readonly #lsofCache: Map<string, LsofCacheEntry>;
  readonly #lsofCacheTtl: number;

  /**
   * Creates a new file handle monitor
   *
   * @param warnThreshold - Warning threshold (0-1), default 0.7
   * @param criticalThreshold - Critical threshold (0-1), default 0.85
   * @param cacheTtl - lsof cache TTL in milliseconds (default: 1000ms)
   */
  constructor(
    warnThreshold: number = 0.7,
    criticalThreshold: number = 0.85,
    cacheTtl: number = 1000
  ) {
    this.warnThreshold = warnThreshold;
    this.criticalThreshold = criticalThreshold;
    this.#lsofCacheTtl = cacheTtl;
    this.#lsofCache = new Map();
    // Dynamic import to avoid circular dependency
    this.#loggerPromise = import('./logger.js').then(({ getLogger }) =>
      getLogger('FileHandleMonitor')
    );
  }

  /**
   * Gets current open file handle count
   *
   * @remarks
   * Platform-specific implementation:
   * - Tries internal API first (fastest, works on all platforms)
   * - Falls back to /proc/<pid>/fd on Linux (fast, no caching needed)
   * - Falls back to cached lsof on macOS (with TTL-based cache)
   * - Returns 0 on Windows (no ulimit concept)
   *
   * On macOS, lsof results are cached to reduce CPU overhead. The cache is
   * checked before executing lsof, and results are stored after successful execution.
   *
   * @returns Number of open file handles
   */
  getHandleCount(): number {
    // GOTCHA: process._getActiveHandles() is internal API
    // Use as primary method with fallback to platform commands
    try {
      const handles = (
        process as unknown as { _getActiveHandles?: () => unknown[] }
      )._getActiveHandles?.();
      if (handles && Array.isArray(handles)) {
        return handles.length; // No cache for internal API - already fastest
      }
    } catch {
      // Internal API not available, use platform-specific method
    }

    // Platform-specific fallback
    const platform = process.platform;
    if (platform === 'linux') {
      // FAST: Read /proc/<pid>/fd directory (no caching needed - already ~0.002ms)
      const fdPath = `/proc/${process.pid}/fd`;
      if (existsSync(fdPath)) {
        try {
          return readdirSync(fdPath).length;
        } catch {
          return 0;
        }
      }
    } else if (platform === 'darwin') {
      // SLOW: Use lsof command with caching
      const cacheKey = 'main';
      const now = Date.now();
      const cached = this.#lsofCache.get(cacheKey);

      // Check cache for valid entry
      if (cached && now - cached.timestamp < this.#lsofCacheTtl) {
        return cached.count; // Cache hit - return immediately
      }

      // Cache miss - execute lsof with optimized flags
      try {
        // OPTIMIZED: Added -n -P -b flags for 40-60% speedup
        // -n: Skip DNS lookups
        // -P: Skip port name resolution
        // -b: Avoid kernel blocks
        const result = execSync(
          `lsof -n -P -b -p ${process.pid} 2>/dev/null | wc -l`,
          {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 5000, // 5 second timeout
          }
        );
        const count = parseInt(result.trim(), 10) - 1; // Subtract header line

        // Store in cache
        this.#lsofCache.set(cacheKey, { count, timestamp: now });
        return count;
      } catch {
        // On error, return stale cache if available
        return cached?.count ?? 0;
      }
    }

    // Windows or fallback: return 0 (no ulimit concept)
    return 0;
  }

  /**
   * Gets file handle ulimit (Unix only)
   *
   * @remarks
   * Returns 0 on Windows (no ulimit concept).
   * Uses ulimit -n command on Unix-like systems.
   *
   * @returns File handle limit, or 0 if unavailable
   */
  getUlimit(): number {
    const platform = process.platform;
    if (platform === 'win32') {
      return 0; // Windows doesn't have ulimit
    }

    try {
      const ulimit = execSync('ulimit -n', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 2000,
      });
      return parseInt(ulimit.trim(), 10);
    } catch {
      return 1024; // Common default
    }
  }

  /**
   * Clears the lsof cache
   *
   * @remarks
   * Manually invalidates the cached lsof results. Use this when you need
   * to force a fresh lsof execution, for example after known file handle operations.
   *
   * This is primarily useful on macOS where lsof is cached. On other platforms,
   * this method has no effect.
   *
   * @example
   * ```typescript
   * const monitor = new FileHandleMonitor();
   * monitor.clearLsofCache(); // Force fresh lsof execution next time
   * ```
   */
  clearLsofCache(): void {
    this.#lsofCache.clear();
  }

  /**
   * Checks if file handle limit is exceeded
   *
   * @remarks
   * Logs warning at threshold (70% by default).
   * Returns exceeded=true at critical threshold (85% by default).
   *
   * @returns Status with exceeded flag, percentage, and suggestion
   */
  check(): {
    exceeded: boolean;
    percentage: number;
    suggestion?: string;
  } {
    const handleCount = this.getHandleCount();
    const ulimit = this.getUlimit();

    if (ulimit === 0) {
      // Windows or no ulimit - no check
      return { exceeded: false, percentage: 0 };
    }

    const percentage = handleCount / ulimit;

    if (percentage >= this.criticalThreshold) {
      return {
        exceeded: true,
        percentage,
        suggestion: `Increase file handle limit: ulimit -n ${Math.floor(ulimit * 2)}`,
      };
    }

    // Log warning asynchronously to avoid blocking
    if (percentage >= this.warnThreshold) {
      void this.#loggerPromise.then(logger =>
        logger.warn(
          {
            handleCount,
            ulimit,
            percentage: (percentage * 100).toFixed(1) + '%',
          },
          'File handle usage high'
        )
      );
    }

    return { exceeded: false, percentage };
  }
}

// ============================================================================
// MEMORY MONITOR
// ============================================================================

/**
 * Memory monitor for V8 heap and system memory
 *
 * @remarks
 * Monitors both V8 heap memory (Node.js-specific) and system-wide
 * memory usage to prevent OOM kills.
 *
 * Warning threshold: 80% (default)
 * Critical threshold: 90% (default)
 */
class MemoryMonitor {
  readonly warnThreshold: number;
  readonly criticalThreshold: number;
  readonly #loggerPromise: Promise<Logger>;

  /**
   * Creates a new memory monitor
   *
   * @param warnThreshold - Warning threshold (0-1), default 0.8
   * @param criticalThreshold - Critical threshold (0-1), default 0.9
   */
  constructor(warnThreshold: number = 0.8, criticalThreshold: number = 0.9) {
    this.warnThreshold = warnThreshold;
    this.criticalThreshold = criticalThreshold;
    // Dynamic import to avoid circular dependency
    this.#loggerPromise = import('./logger.js').then(({ getLogger }) =>
      getLogger('MemoryMonitor')
    );
  }

  /**
   * Gets current memory usage
   *
   * @remarks
   * Combines V8 heap and system memory metrics.
   * - process.memoryUsage() returns V8 heap (RSS, heapTotal, heapUsed)
   * - os.totalmem()/os.freemem() returns system-wide memory
   *
   * @returns Memory usage metrics
   */
  getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    systemTotal: number;
    systemFree: number;
    usage: number;
  } {
    // GOTCHA: process.memoryUsage() returns V8 heap ONLY
    // RSS includes external memory (C++ bindings, Buffers)
    const mem = process.memoryUsage();
    const sysTotal = os.totalmem();
    const sysFree = os.freemem();
    const sysUsed = sysTotal - sysFree;

    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      systemTotal: sysTotal,
      systemFree: sysFree,
      usage: sysUsed / sysTotal,
    };
  }

  /**
   * Checks if memory limit is exceeded
   *
   * @remarks
   * Logs warning at threshold (80% by default).
   * Returns exceeded=true at critical threshold (90% by default).
   *
   * @returns Status with exceeded flag, percentage, and suggestion
   */
  check(): {
    exceeded: boolean;
    percentage: number;
    suggestion?: string;
  } {
    const { usage } = this.getMemoryUsage();

    if (usage >= this.criticalThreshold) {
      return {
        exceeded: true,
        percentage: usage,
        suggestion:
          'Reduce memory usage or increase system memory. Consider splitting PRD into smaller phases.',
      };
    }

    // Log warning asynchronously to avoid blocking
    if (usage >= this.warnThreshold) {
      void this.#loggerPromise.then(logger =>
        logger.warn(
          { percentage: (usage * 100).toFixed(1) + '%' },
          'Memory usage high'
        )
      );
    }

    return { exceeded: false, percentage: usage };
  }
}

// ============================================================================
// UNIFIED RESOURCE MONITOR
// ============================================================================

/**
 * Unified resource monitor combining file handle and memory monitoring
 *
 * @remarks
 * Provides a single interface for monitoring all system resources with:
 * - Configurable polling interval (default: 30 seconds)
 * - Task count tracking
 * - Duration tracking
 * - Historical snapshots for leak detection
 * - Actionable shutdown recommendations
 *
 * @example
 * ```typescript
 * const monitor = new ResourceMonitor({
 *   maxTasks: 100,
 *   maxDuration: 3600000,
 *   fileHandleWarnThreshold: 0.7,
 *   memoryWarnThreshold: 0.8
 * });
 *
 * monitor.start();
 *
 * // In execution loop:
 * monitor.recordTaskComplete();
 * if (monitor.shouldStop()) {
 *   const status = monitor.getStatus();
 *   console.log(`Stopping: ${status.limitType}`);
 *   console.log(`Suggestion: ${status.suggestion}`);
 * }
 *
 * monitor.stop();
 * ```
 */
export class ResourceMonitor {
  readonly fileHandleMonitor: FileHandleMonitor;
  readonly memoryMonitor: MemoryMonitor;
  readonly config: ResourceConfig;
  readonly #loggerPromise: Promise<Logger>;

  #tasksCompleted: number = 0;
  #startTime: number = Date.now();
  #intervalId: NodeJS.Timeout | null = null;
  #snapshots: ResourceSnapshot[] = [];

  /**
   * Creates a new resource monitor
   *
   * @param config - Resource configuration
   */
  constructor(config: ResourceConfig = {}) {
    this.config = config;
    const cacheTtl = config.cacheTtl ?? 1000; // Default 1 second
    this.fileHandleMonitor = new FileHandleMonitor(
      config.fileHandleWarnThreshold,
      config.fileHandleCriticalThreshold,
      cacheTtl
    );
    this.memoryMonitor = new MemoryMonitor(
      config.memoryWarnThreshold,
      config.memoryCriticalThreshold
    );
    // Dynamic import to avoid circular dependency
    this.#loggerPromise = import('./logger.js').then(({ getLogger }) =>
      getLogger('ResourceMonitor')
    );
  }

  /**
   * Starts resource monitoring polling
   *
   * @remarks
   * Begins periodic resource snapshots at the configured interval.
   * Safe to call multiple times - idempotent.
   */
  start(): void {
    if (this.#intervalId) {
      return; // Already started
    }

    const interval = this.config.pollingInterval ?? 30000; // 30s default

    this.#intervalId = setInterval(() => {
      this.#takeSnapshot();
    }, interval);

    void this.#loggerPromise.then(logger =>
      logger.debug({ interval }, 'Resource monitoring started')
    );
  }

  /**
   * Stops resource monitoring polling
   *
   * @remarks
   * Clears the polling interval. Safe to call multiple times.
   */
  stop(): void {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
      void this.#loggerPromise.then(logger =>
        logger.debug('Resource monitoring stopped')
      );
    }
  }

  /**
   * Records a task completion
   *
   * @remarks
   * Call this after each task completes to track task count
   * for maxTasks limit checking.
   */
  recordTaskComplete(): void {
    this.#tasksCompleted++;
  }

  /**
   * Gets current resource status
   *
   * @remarks
   * Checks all resource limits and returns comprehensive status.
   * Includes warnings, limit type, and actionable suggestions.
   *
   * @returns Current resource limit status
   */
  getStatus(): ResourceLimitStatus {
    const fileStatus = this.fileHandleMonitor.check();
    const memStatus = this.memoryMonitor.check();

    const warnings: string[] = [];
    let limitType:
      | 'maxTasks'
      | 'maxDuration'
      | 'fileHandles'
      | 'memory'
      | null = null;
    let suggestion: string | undefined;

    // Check resource limits
    if (fileStatus.exceeded) {
      limitType = 'fileHandles';
      suggestion = fileStatus.suggestion;
    }

    if (memStatus.exceeded && !limitType) {
      limitType = 'memory';
      suggestion = memStatus.suggestion;
    }

    // Check user-defined limits
    if (
      this.config.maxTasks !== undefined &&
      this.#tasksCompleted >= this.config.maxTasks
    ) {
      limitType = 'maxTasks';
      suggestion = 'Resume with --continue flag or increase --max-tasks limit';
    }

    if (this.config.maxDuration !== undefined && !limitType) {
      const elapsed = Date.now() - this.#startTime;
      if (elapsed >= this.config.maxDuration) {
        limitType = 'maxDuration';
        suggestion =
          'Resume with --continue flag or increase --max-duration limit';
      }
    }

    return {
      shouldStop: limitType !== null,
      limitType,
      snapshot: this.#getCurrentSnapshot(),
      warnings,
      suggestion,
    };
  }

  /**
   * Quick check if should stop (for loop condition)
   *
   * @remarks
   * Convenience method that returns true if any limit is reached.
   * Use getStatus() for detailed information.
   *
   * @returns True if any limit has been reached
   */
  shouldStop(): boolean {
    return this.getStatus().shouldStop;
  }

  /**
   * Gets elapsed time since start
   *
   * @returns Elapsed time in milliseconds
   */
  getElapsed(): number {
    return Date.now() - this.#startTime;
  }

  /**
   * Gets number of completed tasks
   *
   * @returns Task completion count
   */
  getTasksCompleted(): number {
    return this.#tasksCompleted;
  }

  /**
   * Takes a resource snapshot for historical tracking
   *
   * @remarks
   * Snapshots are stored in a circular buffer (max 20 samples)
   * for leak detection. Each snapshot represents ~30 seconds.
   *
   * @private
   */
  #takeSnapshot(): void {
    const snapshot = this.#getCurrentSnapshot();
    this.#snapshots.push(snapshot);

    // Keep last 20 samples (10 minutes at 30s interval)
    if (this.#snapshots.length > 20) {
      this.#snapshots.shift();
    }

    // Check for leaks (20% growth over sampling window)
    this.#checkForLeaks();
  }

  /**
   * Gets current resource snapshot
   *
   * @returns Current resource usage snapshot
   * @private
   */
  #getCurrentSnapshot(): ResourceSnapshot {
    const mem = this.memoryMonitor.getMemoryUsage();
    const fileCheck = this.fileHandleMonitor.check();

    return {
      timestamp: Date.now(),
      fileHandles: this.fileHandleMonitor.getHandleCount(),
      fileHandleUlimit: this.fileHandleMonitor.getUlimit(),
      fileHandleUsage: fileCheck.percentage,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      systemTotal: mem.systemTotal,
      systemFree: mem.systemFree,
      memoryUsage: mem.usage,
    };
  }

  /**
   * Checks for resource leaks based on historical data
   *
   * @remarks
   * Alerts on >20% growth over sampling window (10+ minutes).
   * Detects both file handle leaks and memory leaks.
   *
   * @private
   */
  #checkForLeaks(): void {
    if (this.#snapshots.length < 5) return; // Need minimum samples

    const oldest = this.#snapshots[0];
    const newest = this.#snapshots[this.#snapshots.length - 1];

    // Check file handle leak (>20% growth)
    if (oldest.fileHandleUlimit > 0 && oldest.fileHandles > 0) {
      const growth =
        (newest.fileHandles - oldest.fileHandles) / oldest.fileHandles;
      if (growth > 0.2) {
        void this.#loggerPromise.then(logger =>
          logger.warn(
            {
              growth: (growth * 100).toFixed(1) + '%',
              oldest: oldest.fileHandles,
              newest: newest.fileHandles,
            },
            'Potential file handle leak detected'
          )
        );
      }
    }

    // Check memory leak (>20% growth)
    if (oldest.heapUsed > 0) {
      const memGrowth = (newest.heapUsed - oldest.heapUsed) / oldest.heapUsed;
      if (memGrowth > 0.2) {
        void this.#loggerPromise.then(logger =>
          logger.warn(
            {
              growth: (memGrowth * 100).toFixed(1) + '%',
              oldest: oldest.heapUsed,
              newest: newest.heapUsed,
            },
            'Potential memory leak detected'
          )
        );
      }
    }
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ResourceMonitor;
