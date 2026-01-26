# Product Requirement Prompt (PRP): Add cache statistics and cleanup

**PRP ID**: P3.M3.T1.S2
**Work Item Title**: Add cache statistics and cleanup
**Generated**: 2025-01-25
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Add comprehensive cache statistics tracking and cleanup commands for the PRP cache system, including a new CacheManager class, CLI subcommands (`prd cache stats/clean/clear`), auto-prune on startup, and full test coverage.

**Deliverable**:

1. `CacheManager` class at `src/utils/cache-manager.ts` with statistics and cleanup methods
2. CLI cache commands at `src/cli/commands/cache.ts` (stats, clean, clear)
3. `--cache-prune` CLI option for automatic cleanup on startup
4. Tests at `tests/unit/cache-manager.test.ts`

**Success Definition**:

- `prd cache stats` displays comprehensive cache statistics (hits, misses, evictions, size, hit ratio)
- `prd cache clean` removes expired cache entries and reports results
- `prd cache clear` removes all cache entries with confirmation
- `--cache-prune` automatically cleans expired entries on pipeline startup
- All operations handle errors gracefully (continue on individual file failures)
- Tests cover all cache operations (stats, clean, clear, error handling)

---

## User Persona

**Target User**: Developer or operator using the PRD pipeline who needs visibility into cache performance and manual control over cache cleanup.

**Use Case**:

- **Cache visibility**: View cache statistics to understand hit/miss ratios and cache size
- **Cache maintenance**: Clean up expired entries to free disk space
- **Cache reset**: Clear all cache entries when needed (e.g., after significant code changes)
- **Auto-cleanup**: Automatically prune expired entries on startup

**User Journey**:

1. User runs `prd cache stats` to see cache performance and size
2. If cache is large or has many expired entries, user runs `prd cache clean`
3. For complete cache reset, user runs `prd cache clear` (with confirmation)
4. For automatic cleanup, user adds `--cache-prune` flag to pipeline startup

**Pain Points Addressed**:

- **No cache visibility**: From `system_context.md` - "Cache hit/miss tracking exists but no statistics reporting"
- **No cleanup mechanism**: "No cleanup command for stale cache entries"
- **Manual cleanup required**: No way to remove expired entries without manual file deletion
- **No auto-cleanup**: Expired entries accumulate over time

---

## Why

- **Cache visibility**: Developers need to see cache hit/miss ratios to tune TTL settings
- **Disk space management**: Expired cache entries consume disk space unnecessarily
- **Cache hygiene**: Regular cleanup maintains cache performance and relevance
- **Operational control**: Manual cleanup commands give operators control over cache state
- **Automation**: Auto-prune on startup reduces manual maintenance overhead

---

## What

Add cache statistics tracking, cleanup commands, and auto-prune functionality to the PRP cache system.

### Success Criteria

- [ ] `CacheManager` class created at `src/utils/cache-manager.ts`
- [ ] `getStats()` returns comprehensive cache statistics (hits, misses, evictions, size, hit ratio)
- [ ] `cleanExpired()` removes expired entries and returns cleanup results
- [ ] `clear()` removes all cache entries and returns cleanup results
- [ ] `prd cache stats` command displays statistics in table or JSON format
- [ ] `prd cache clean` command removes expired entries with results reporting
- [ ] `prd cache clear` command removes all entries with confirmation prompt
- [ ] `--cache-prune` CLI option triggers automatic cleanup on startup
- [ ] All operations handle errors gracefully (continue on individual failures)
- [ ] Tests at `tests/unit/cache-manager.test.ts` cover all operations
- [ ] Dry-run mode for clean and clear commands
- [ ] Force flag to bypass confirmation prompts

---

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:

- Complete analysis of PRPGenerator cache implementation with specific line numbers
- Previous PRP (P3.M3.T1.S1) contract defining the cacheTtlMs parameter
- Existing CLI command patterns from artifacts.ts and inspect.ts
- Test patterns from prp-generator.test.ts
- Complete research documentation in research/ subdirectory
- Specific file paths, code patterns, and integration points

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Previous PRP - CONTRACT for cacheTtlMs parameter
- file: plan/003_b3d3efdaf0ed/P3M3T1S1/PRP.md
  why: Defines cacheTtlMs parameter that will be available to CacheManager
  critical:
    - PRPGenerator constructor accepts cacheTtlMs parameter (line 353)
    - Cache is stored in prps/.cache/ directory (line 208)
    - PRPCacheMetadata interface (lines 96-103) with taskId, taskHash, createdAt, accessedAt
    - getCachePath() and getCacheMetadataPath() methods (lines 191-209)
  gotcha:
    - DO NOT duplicate TTL configuration - P3.M3.T1.S1 already made it configurable
    - Use same cache path structure as PRPGenerator for consistency

# PRPGenerator Cache Implementation (CONSUME)
- file: src/agents/prp-generator.ts
  why: Source of cache structure and existing metrics
  pattern:
    - Lines 96-103: PRPCacheMetadata interface (taskId, taskHash, createdAt, accessedAt, version, prp)
    - Lines 144-148: #cacheHits and #cacheMisses counters
    - Lines 191-209: getCachePath() and getCacheMetadataPath() methods
    - Lines 263-272: #isCacheRecent() method for expiration checking
    - Lines 363-375: #logCacheMetrics() method for logging
  gotcha:
    - After P3.M3.T1.S1, CACHE_TTL_MS becomes #cacheTtlMs instance property
    - Use same sanitized taskId format (replace dots with underscores)
    - Cache directory is prps/.cache/ relative to session path

# CLI Command Pattern (FOLLOW)
- file: src/cli/commands/artifacts.ts
  why: Reference for subcommand structure with action argument
  pattern:
    - Lines 152-179: Constructor with planDir and prdPath parameters
    - Lines 196-224: execute() method with switch statement for actions
    - Lines 408-421: List action implementation with output format handling
    - Lines 431-474: Table formatting using cli-table3
    - Lines 412-420: JSON vs table output branching
  gotcha:
    - Use action argument for subcommands (stats, clean, clear)
    - Support both table and JSON output formats
    - Use chalk for terminal colors
    - Use process.exit(0) for success, process.exit(1) for errors

# CLI Command Pattern 2 (FOLLOW)
- file: src/cli/commands/inspect.ts
  why: Reference for command class structure and session loading
  pattern:
    - Lines 132-151: Constructor with planDir and prdPath
    - Lines 165-177: execute() method with options
    - Lines 188-219: #loadSession() method for session discovery
    - Lines 341-424: Output formatting with multiple formats (table, json, yaml, tree)
  gotcha:
    - SessionManager integration for loading session state
    - Use SessionManager.findLatestSession() when no session specified
    - Return type includes subcommand and options

# CLI Registration Pattern (FOLLOW)
- file: src/cli/index.ts
  why: Reference for registering new subcommands
  pattern:
    - Lines 280-306: Inspect command registration with .command() and .action()
    - Lines 309-333: Artifacts command registration with argument
    - Lines 374-402: Subcommand detection logic
    - Lines 196-199: Return type includes subcommand unions
  gotcha:
    - Import command class at top of file
    - Add to return type of parseCLIArgs()
    - Add subcommand detection after program.parse()
    - Use process.exit() in action handler

# Test Patterns (FOLLOW)
- file: tests/unit/agents/prp-generator.test.ts
  why: Reference for cache testing patterns
  pattern:
    - Lines 1-20: Vitest imports and vi.mock() setup
    - Lines 467-635: Cache tests describe block
    - Lines 477-510: Cache hit/miss tests
    - Lines 572-594: Cache expiration tests with mocked stat.mtimeMs
    - Mock pattern: vi.mocked(stat) for type-safe mocks
  gotcha:
    - Mock node:fs/promises before imports
    - Use vi.mocked() for type-safe mocked functions
    - Mock stat.mtimeMs to control file age for expiration tests
    - Use factory functions for test data

# Research Documentation (REFERENCE)
- docfile: plan/003_b3d3efdaf0ed/P3M3T1S2/research/cli-command-patterns.md
  why: Complete CLI command patterns with code examples
- docfile: plan/003_b3d3efdaf0ed/P3M3T1S2/research/cache-testing-patterns.md
  why: Cache testing patterns with mock setups
- docfile: plan/003_b3d3efdaf0ed/P3M3T1S2/research/cache-statistics-research.md
  why: Best practices for cache statistics and cleanup
- docfile: plan/003_b3d3efdaf0ed/P3M3T1S2/research/architecture-context.md
  why: Architecture context and integration points

# System Context (SOURCE OF REQUIREMENT)
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Original requirement source
  section: "Limitations & Pain Points" -> "No cache statistics reporting" and "No cleanup command"

# SessionManager Integration (USE)
- file: src/core/session-manager.ts
  why: For loading session state and finding latest session
  pattern:
    - SessionManager.listSessions() - List all sessions
    - SessionManager.findLatestSession() - Find most recent session
    - sessionManager.currentSession.metadata.path - Get session path
  gotcha:
    - Session may be null if no session exists
    - Handle case where no session is found gracefully
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── agents/
│   │   └── prp-generator.ts              # REFERENCE: Cache structure and paths
│   ├── cli/
│   │   ├── index.ts                       # MODIFY: Add cache subcommand
│   │   └── commands/
│   │       ├── artifacts.ts               # REFERENCE: Command pattern
│   │       ├── inspect.ts                 # REFERENCE: Command pattern
│   │       └── validate-state.ts          # REFERENCE: Command pattern
│   ├── core/
│   │   └── session-manager.ts             # USE: Load session state
│   └── utils/
│       ├── logger.ts                      # USE: Logging
│       └── cache-manager.ts               # NEW: Create CacheManager class
├── tests/
│   └── unit/
│       ├── agents/
│       │   └── prp-generator.test.ts      # REFERENCE: Cache test patterns
│       └── cache-manager.test.ts          # NEW: Create CacheManager tests
└── plan/
    └── 003_b3d3efdaf0ed/
        ├── P3M3T1S1/
        │   └── PRP.md                     # REFERENCE: Previous PRP contract
        └── P3M3T1S2/
            ├── PRP.md                     # THIS FILE
            └── research/
                ├── cli-command-patterns.md
                ├── cache-testing-patterns.md
                ├── cache-statistics-research.md
                └── architecture-context.md
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   ├── index.ts                       # MODIFIED: Added cache subcommand
│   │   └── commands/
│   │       └── cache.ts                   # NEW: Cache stats/clean/clear commands
│   └── utils/
│       └── cache-manager.ts               # NEW: CacheManager class
├── tests/
│   └── unit/
│       └── cache-manager.test.ts          # NEW: CacheManager tests
└── plan/
    └── 003_b3d3efdaf0ed/
        └── P3M3T1S2/
            └── PRP.md                     # THIS FILE
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use same cache path structure as PRPGenerator
// File: src/agents/prp-generator.ts (lines 191-209)
// Cache directory is: {sessionPath}/prps/.cache/
// Cache metadata files are: {sanitizedTaskId}.json
// Sanitization: taskId.replace(/\./g, '_')

// GOTCHA: After P3.M3.T1.S1, PRPGenerator uses instance property for TTL
// Before: readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// After: readonly #cacheTtlMs: number; (constructor parameter)
// CacheManager should receive cacheTtlMs as parameter

// CRITICAL: Do NOT modify PRPGenerator's existing cache methods
// PRPGenerator owns: #isCacheRecent(), #loadCachedPRP(), #saveCacheMetadata()
// CacheManager should read cache files, not call PRPGenerator methods

// GOTCHA: Cache metadata structure (from PRPCacheMetadata interface)
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;
}

// CRITICAL: File permissions for cache files
// Cache files are created with mode: 0o644 (from prp-generator.ts line 332)
// New files should use same permissions

// GOTCHA: SessionManager returns null if no session exists
// Always check: const session = await SessionManager.findLatestSession(planDir);
// if (!session) { throw new Error('No session found'); }

// CRITICAL: CLI subcommand action handlers must call process.exit()
// The action() handler should exit after command execution
// Pattern: process.exit(0) for success, process.exit(1) for errors

// GOTCHA: Use cli-table3 for table formatting
// Import: import Table from 'cli-table3';
// Pattern matches artifacts.ts lines 431-474

// CRITICAL: Atomic file deletion pattern (rename-then-unlink)
// Prevents race conditions during cleanup
// 1. fs.rename(filePath, tempPath) - atomic
// 2. fs.unlink(tempPath) - cleanup
// If step 2 fails, temp file remains but is harmless

// GOTCHA: Continue cleanup on individual file failures
// Do not throw error if single file deletion fails
// Log error and continue with remaining files
// Return results with both removed and failed counts

// CRITICAL: Mock node:fs/promises in tests BEFORE imports
// Pattern: vi.mock('node:fs/promises', () => ({ ... }));
// Then: import { stat, readdir, unlink } from 'node:fs/promises';

// GOTCHA: Use vi.mocked() for type-safe mocks
// const mockStat = vi.mocked(stat);
// This provides proper TypeScript types for mocked functions

// CRITICAL: chalk for terminal colors
// Import: import chalk from 'chalk';
// Use: chalk.red(), chalk.green(), chalk.yellow(), etc.

// GOTCHA: Commander.js argument pattern for subcommands
// .argument('[action]', 'Description', 'default')
// Action parameter comes BEFORE options in action handler

// CRITICAL: Return type update for parseCLIArgs()
// Add: | { subcommand: 'cache'; options: CacheOptions }
// To the return type union

// GOTCHA: Environment variable naming
// Use HACKY_ prefix for application-specific configuration
// Example: HACKY_CACHE_PRUNE for auto-prune feature

// CRITICAL: Dry-run mode for clean/clear commands
// Should show what would be done without actually doing it
// Format: chalk.yellow('Dry run - would remove:'))

// GOTCHA: Confirmation prompt for clear command
// Use readline for user input
// Only prompt if --force flag is NOT set
// Default to 'N' (no) for safety
```

---

## Implementation Blueprint

### Data Models and Structure

**1. Cache Statistics Interface**

```typescript
// File: src/utils/cache-manager.ts

export interface CacheStatistics {
  /** Cache identifier (session hash or path) */
  cacheId: string;

  /** Total cache hits */
  hits: number;

  /** Total cache misses */
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
```

**2. Cache Entry Information Interface**

```typescript
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
```

**3. Cleanup Result Interface**

```typescript
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
```

**4. CLI Options Interface**

```typescript
// File: src/cli/commands/cache.ts

export interface CacheOptions {
  /** Output format (table or json) */
  output: 'table' | 'json';

  /** Force action without confirmation */
  force: boolean;

  /** Show what would be done without executing */
  dryRun: boolean;

  /** Session ID (optional, defaults to latest) */
  session?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/cache-manager.ts - Core CacheManager class
  DEPENDENCIES: None (foundation for other tasks)
  IMPLEMENT:
    - CacheManager class with constructor(sessionPath, cacheTtlMs)
    - getStats() method - returns CacheStatistics
    - cleanExpired() method - removes expired entries
    - clear() method - removes all cache entries
    - #scanEntries() private method - lists all cache entries
    - #isExpired() private method - checks if entry is expired
    - #removeEntry() private method - atomic file deletion
    - #calculateSize() private method - calculates entry size
  PATTERN:
    - Follow PRPGenerator cache path structure (lines 191-209)
    - Use atomic rename-then-unlink for deletion
    - Continue on individual file failures
    - Log all operations with getLogger('CacheManager')
  NAMING: CacheManager class, camelCase methods, # for private methods
  PLACEMENT: src/utils/cache-manager.ts

Task 2: CREATE src/cli/commands/cache.ts - CLI cache commands
  DEPENDENCIES: Task 1 (CacheManager must exist)
  IMPLEMENT:
    - CacheCommand class with constructor(planDir, prdPath)
    - execute(action, options) method - routes to stats/clean/clear
    - #showStats(options) private method - displays statistics
    - #cleanCache(options) private method - cleans expired entries
    - #clearCache(options) private method - clears all entries
    - #loadSession(options) private method - loads session state
    - #formatStatsTable(stats) private method - table output
    - #promptConfirmation() private method - user confirmation
  PATTERN: Follow artifacts.ts structure (lines 152-224, 408-474)
  NAMING: CacheCommand class, # for private methods
  GOTCHA:
    - Use process.exit(0) after successful execution
    - Use process.exit(1) after errors
    - Support both table and JSON output formats

Task 3: MODIFY src/cli/index.ts - Register cache subcommand
  DEPENDENCIES: Task 2 (CacheCommand must exist)
  MODIFY:
    - Import: import { CacheCommand, type CacheOptions } from './commands/cache.js';
    - Line ~197: Add | { subcommand: 'cache'; options: CacheOptions } to return type
    - Line ~333: Add .command('cache') registration after validate-state
    - Line ~402: Add subcommand detection for 'cache'
  IMPLEMENT:
    program
      .command('cache')
      .description('Cache management operations')
      .argument('[action]', 'Action: stats, clean, clear', 'stats')
      .option('--force', 'Force action without confirmation', false)
      .option('--dry-run', 'Show what would be done without executing', false)
      .option('-o, --output <format>', 'Output format: table, json', 'table')
      .option('--session <id>', 'Session ID')
      .action(async (action, options) => {
        try {
          const cacheCommand = new CacheCommand(planDir, prdPath);
          await cacheCommand.execute(action, options);
          process.exit(0);
        } catch (error) {
          logger.error(`Cache command failed: ${errorMessage}`);
          process.exit(1);
        }
      });
  PATTERN: Follow artifacts.ts registration (lines 309-333)
  GOTCHA:
    - action parameter comes before options
    - Use process.exit() in action handler

Task 4: ADD --cache-prune option to src/cli/index.ts
  DEPENDENCIES: Task 1 (CacheManager must exist)
  ADD:
    - Line ~84: cachePrune?: boolean; to CLIArgs interface
    - Line ~267: .option('--cache-prune', 'Auto-clean expired cache on startup', false)
    - Line ~577: options.cachePrune = options.cachePrune || false;
  INTEGRATE:
    - In main execution flow, if cachePrune is true:
      - Load latest session
      - Create CacheManager
      - Call cleanExpired()
      - Log results
  PATTERN: Follow existing CLI option pattern (lines 230-260)
  GOTCHA:
    - Boolean flag, use --cache-prune to enable, --no-cache-prune to disable

Task 5: CREATE tests/unit/cache-manager.test.ts - Comprehensive tests
  DEPENDENCIES: Task 1 (CacheManager implementation complete)
  IMPLEMENT:
    - describe('CacheManager') - main test suite
    - describe('getStats()') - statistics tests
    - describe('cleanExpired()') - cleanup tests
    - describe('clear()') - clear all tests
    - describe('error handling') - error scenarios
  MOCK:
    - vi.mock('node:fs/promises') for file operations
    - Mock stat, readdir, unlink, readFile
    - Use factory functions for test data
  FOLLOW pattern: tests/unit/agents/prp-generator.test.ts
  PLACEMENT: tests/unit/cache-manager.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ================================================================
// PATTERN 1: CacheManager Class Structure
// ================================================================
// File: src/utils/cache-manager.ts

import { join, resolve } from 'node:path';
import { promises as fs } from 'node:fs';
import { getLogger } from './logger.js';
import type { Logger } from './logger.js';
import type { PRPCacheMetadata } from '../agents/prp-generator.js';

export interface CacheStatistics {
  cacheId: string;
  hits: number;
  misses: number;
  hitRatio: number;
  totalEntries: number;
  totalBytes: number;
  expiredEntries: number;
  oldestEntry?: number;
  newestEntry?: number;
  collectedAt: number;
}

export interface CleanupResult {
  removed: number;
  failed: number;
  reason: string;
  removedEntries?: string[];
  failedEntries?: Array<{ taskId: string; error: string }>;
  duration: number;
}

export class CacheManager {
  readonly #logger: Logger;
  readonly #sessionPath: string;
  readonly #cacheTtlMs: number;
  readonly #cacheDir: string;

  constructor(sessionPath: string, cacheTtlMs: number = 24 * 60 * 60 * 1000) {
    this.#logger = getLogger('CacheManager');
    this.#sessionPath = sessionPath;
    this.#cacheTtlMs = cacheTtlMs;
    this.#cacheDir = resolve(sessionPath, 'prps', '.cache');
  }

  /**
   * Gets comprehensive cache statistics
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
   */
  async #removeEntry(entry: CacheEntryInfo): Promise<void> {
    const tempPath = `${entry.metadataPath}.tmp`;

    // Atomic rename
    await fs.rename(entry.metadataPath, tempPath);

    // Unlink temp file
    await fs.unlink(tempPath);
  }
}

interface CacheEntryInfo {
  taskId: string;
  metadataPath: string;
  prpPath: string;
  createdAt: number;
  accessedAt: number;
  size: number;
  isExpired: boolean;
  age: number;
}

// ================================================================
// PATTERN 2: CacheCommand Class Structure
// ================================================================
// File: src/cli/commands/cache.ts

import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import chalk from 'chalk';
import Table from 'cli-table3';
import { SessionManager } from '../../core/session-manager.js';
import {
  CacheManager,
  type CacheStatistics,
  type CleanupResult,
} from '../../utils/cache-manager.js';
import { getLogger } from '../../utils/logger.js';

const logger = getLogger('CacheCommand');

export interface CacheOptions {
  output: 'table' | 'json';
  force: boolean;
  dryRun: boolean;
  session?: string;
}

export class CacheCommand {
  readonly #planDir: string;
  readonly #prdPath: string;

  constructor(
    planDir: string = resolve('plan'),
    prdPath: string = resolve('PRD.md')
  ) {
    this.#planDir = planDir;
    this.#prdPath = prdPath;
  }

  async execute(action: string, options: CacheOptions): Promise<void> {
    try {
      switch (action) {
        case 'stats':
          await this.#showStats(options);
          break;
        case 'clean':
          await this.#cleanCache(options);
          break;
        case 'clear':
          await this.#clearCache(options);
          break;
        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.info('Valid actions: stats, clean, clear');
          process.exit(1);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), errorMessage);
      logger.error({ error }, 'Cache command failed');
      process.exit(1);
    }
  }

  async #showStats(options: CacheOptions): Promise<void> {
    const sessionState = await this.#loadSession(options.session);
    const manager = new CacheManager(sessionState.metadata.path);
    const stats = await manager.getStats();

    if (options.output === 'json') {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log(this.#formatStatsTable(stats));
    }
  }

  async #cleanCache(options: CacheOptions): Promise<void> {
    const sessionState = await this.#loadSession(options.session);
    const manager = new CacheManager(sessionState.metadata.path);

    // Show what would be cleaned
    const stats = await manager.getStats();
    console.log(chalk.yellow(`Found ${stats.expiredEntries} expired entries`));

    if (options.dryRun) {
      console.log(chalk.gray('\nDry run - no changes made'));
      return;
    }

    const result = await manager.cleanExpired();

    console.log(chalk.green(`\nRemoved: ${result.removed} entries`));
    if (result.failed > 0) {
      console.log(chalk.red(`Failed: ${result.failed} entries`));
    }
    console.log(chalk.gray(`Duration: ${result.duration.toFixed(2)}ms`));
  }

  async #clearCache(options: CacheOptions): Promise<void> {
    const sessionState = await this.#loadSession(options.session);
    const manager = new CacheManager(sessionState.metadata.path);
    const stats = await manager.getStats();

    console.log(
      chalk.yellow(`About to remove ${stats.totalEntries} cache entries`)
    );

    if (!options.force) {
      const answer = await this.#promptConfirmation('Continue? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.gray('Cancelled'));
        return;
      }
    }

    if (options.dryRun) {
      console.log(chalk.gray('\nDry run - no changes made'));
      return;
    }

    const result = await manager.clear();

    console.log(chalk.green(`\nRemoved: ${result.removed} entries`));
    if (result.failed > 0) {
      console.log(chalk.red(`Failed: ${result.failed} entries`));
    }
    console.log(chalk.gray(`Duration: ${result.duration.toFixed(2)}ms`));
  }

  async #loadSession(sessionId?: string) {
    if (sessionId) {
      const sessions = await SessionManager.listSessions(this.#planDir);
      const session = sessions.find(
        s => s.hash.startsWith(sessionId) || s.id === sessionId
      );
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      const manager = new SessionManager(this.#prdPath, this.#planDir);
      return await manager.loadSession(session.path);
    }

    const latest = await SessionManager.findLatestSession(this.#planDir);
    if (!latest) {
      throw new Error('No session found');
    }
    const manager = new SessionManager(this.#prdPath, this.#planDir);
    return await manager.loadSession(latest.path);
  }

  #formatStatsTable(stats: CacheStatistics): string {
    const table = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value')],
      colWidths: [30, 20],
      chars: {
        top: '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        bottom: '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        left: '│',
        'left-mid': '├',
        mid: '─',
        'mid-mid': '┼',
        right: '│',
        'right-mid': '┤',
        middle: '│',
      },
    });

    table.push(['Total Entries', stats.totalEntries.toString()]);
    table.push(['Total Size', this.#formatBytes(stats.totalBytes)]);
    table.push(['Expired Entries', stats.expiredEntries.toString()]);
    table.push([
      'Oldest Entry',
      stats.oldestEntry ? this.#formatAge(stats.oldestEntry) : 'N/A',
    ]);
    table.push([
      'Newest Entry',
      stats.newestEntry ? this.#formatAge(stats.newestEntry) : 'N/A',
    ]);

    return '\n' + table.toString();
  }

  #formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  #formatAge(timestamp: number): string {
    const age = Date.now() - timestamp;
    if (age < 60 * 1000) return `${Math.floor(age / 1000)}s ago`;
    if (age < 60 * 60 * 1000) return `${Math.floor(age / (60 * 1000))}m ago`;
    if (age < 24 * 60 * 60 * 1000)
      return `${Math.floor(age / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(age / (24 * 60 * 60 * 1000))}d ago`;
  }

  #promptConfirmation(prompt: string): Promise<string> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => {
      rl.question(prompt, answer => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}

// ================================================================
// PATTERN 3: CLI Subcommand Registration
// ================================================================
// File: src/cli/index.ts

// Add import at top of file
import { CacheCommand, type CacheOptions } from './commands/cache.js';

// Update return type (around line 197)
export function parseCLIArgs():
  | ValidatedCLIArgs
  | { subcommand: 'inspect'; options: InspectorOptions }
  | { subcommand: 'artifacts'; options: Record<string, unknown> }
  | { subcommand: 'validate-state'; options: Record<string, unknown> }
  | { subcommand: 'cache'; options: CacheOptions } {
  // ... existing code ...
}

// Add subcommand registration (after validate-state, around line 333)
program
  .command('cache')
  .description('Cache management operations')
  .argument('[action]', 'Action: stats, clean, clear', 'stats')
  .option('--force', 'Force action without confirmation', false)
  .option('--dry-run', 'Show what would be done without executing', false)
  .option('-o, --output <format>', 'Output format: table, json', 'table')
  .option('--session <id>', 'Session ID')
  .action(async (action, options) => {
    try {
      const cacheCommand = new CacheCommand(planDir, prdPath);
      await cacheCommand.execute(action, options);
      process.exit(0);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Cache command failed: ${errorMessage}`);
      process.exit(1);
    }
  });

// Add subcommand detection (after validate-state detection, around line 402)
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === 'cache') {
  return {
    subcommand: 'cache',
    options: {},
  };
}
```

### Integration Points

```yaml
CACHEMANAGER:
  - create: src/utils/cache-manager.ts
  - use: Same cache paths as PRPGenerator (getCachePath, getCacheMetadataPath)
  - integrate: Receives sessionPath and cacheTtlMs from PRPGenerator context
  - pattern: Atomic file operations, graceful error handling

CLI_COMMANDS:
  - create: src/cli/commands/cache.ts
  - pattern: Follow artifacts.ts and inspect.ts structure
  - integrate: Use SessionManager for loading session state
  - output: Support table and JSON formats

CLI_OPTIONS:
  - modify: src/cli/index.ts
  - add: .command('cache') registration
  - add: --cache-prune boolean option for auto-cleanup
  - pattern: Follow existing CLI option patterns

AUTO_PRUNE:
  - add: Main execution flow check for cachePrune option
  - flow: If true, load session, create CacheManager, call cleanExpired()
  - log: Results of auto-prune operation

TESTS:
  - create: tests/unit/cache-manager.test.ts
  - pattern: Follow prp-generator.test.ts cache test patterns
  - mock: node:fs/promises for file operations
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Type checking
npx tsc --noEmit src/utils/cache-manager.ts
npx tsc --noEmit src/cli/commands/cache.ts
npx tsc --noEmit src/cli/index.ts

# Format
npx prettier --write src/utils/cache-manager.ts
npx prettier --write src/cli/commands/cache.ts
npx prettier --write src/cli/index.ts

# Expected: Zero type errors, proper formatting
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test CacheManager
vitest run tests/unit/cache-manager.test.ts

# Test existing PRPGenerator (ensure no regression)
vitest run tests/unit/agents/prp-generator.test.ts

# Full unit test suite
vitest run tests/unit/

# Coverage
vitest run tests/unit/ --coverage

# Expected: All tests pass, good coverage on CacheManager
```

### Level 3: Integration Testing (System Validation)

```bash
# Test cache stats command
prd-pipeline cache stats

# Test cache stats with JSON output
prd-pipeline cache stats -o json

# Test cache clean command (dry run)
prd-pipeline cache clean --dry-run

# Test cache clean command (actual)
prd-pipeline cache clean

# Test cache clear command (with force to skip confirmation)
prd-pipeline cache clear --force

# Test cache clear command (dry run)
prd-pipeline cache clear --dry-run

# Expected: Commands execute, proper output shown
```

### Level 4: Manual Validation

```bash
# 1. Create cache entries by running pipeline
prd-pipeline --dry-run

# 2. View cache statistics
prd-pipeline cache stats

# 3. Clean expired entries
prd-pipeline cache clean

# 4. Clear all cache (use --force for automation)
prd-pipeline cache clear --force

# 5. Test auto-prune on startup
prd-pipeline --cache-prune --dry-run

# 6. Verify cache directory structure
ls -la plan/*/prps/.cache/

# Expected: Cache operations work as expected, stats are accurate
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `src/utils/cache-manager.ts` created with CacheManager class
- [ ] `getStats()` method returns comprehensive CacheStatistics
- [ ] `cleanExpired()` method removes expired entries and returns CleanupResult
- [ ] `clear()` method removes all entries and returns CleanupResult
- [ ] Atomic file deletion pattern (rename-then-unlink) implemented
- [ ] Error handling continues on individual file failures
- [ ] `src/cli/commands/cache.ts` created with CacheCommand class
- [ ] `prd cache stats` command displays statistics
- [ ] `prd cache clean` command removes expired entries
- [ ] `prd cache clear` command removes all entries with confirmation
- [ ] `--dry-run` flag works for clean and clear
- [ ] `--force` flag bypasses confirmation
- [ ] `-o json` flag outputs JSON format
- [ ] `src/cli/index.ts` modified with cache subcommand registration
- [ ] `--cache-prune` option added to main CLI
- [ ] Auto-prune executes on startup when flag is set
- [ ] All 4 validation levels completed successfully
- [ ] No type errors: `npx tsc --noEmit`

### Feature Validation

- [ ] `prd cache stats` shows total entries, size, expired count
- [ ] `prd cache stats -o json` outputs valid JSON
- [ ] `prd cache clean --dry-run` shows what would be removed
- [ ] `prd cache clean` actually removes expired entries
- [ ] `prd cache clear` prompts for confirmation (without --force)
- [ ] `prd cache clear --force` bypasses confirmation
- [ ] `prd cache clear` removes all cache entries
- [ ] `--cache-prune` auto-cleans on pipeline startup
- [ ] Operations handle non-existent cache directory gracefully
- [ ] Individual file failures don't stop entire operation

### Code Quality Validation

- [ ] Follows existing CLI command patterns (artifacts.ts, inspect.ts)
- [ ] Uses same cache path structure as PRPGenerator
- [ ] Atomic file operations for safety
- [ ] Comprehensive error handling with logging
- [ ] Private methods use `#` prefix
- [ ] JSDoc comments on public methods
- [ ] Table formatting uses cli-table3
- [ ] Terminal colors use chalk
- [ ] Anti-patterns avoided (see below)

### Documentation & Deployment

- [ ] Help text includes all cache commands
- [ ] Error messages are clear and actionable
- [ ] Dry-run mode clearly indicated
- [ ] Confirmation prompt is clear
- [ ] Statistics are human-readable (bytes formatted, age formatted)

---

## Anti-Patterns to Avoid

- **Don't** modify PRPGenerator's existing cache methods - CacheManager is separate
- **Don't** use synchronous file operations - always use async/promises
- **Don't** throw error on individual file failures - log and continue
- **Don't** forget atomic file deletion - use rename-then-unlink pattern
- **Don't** hardcode cache paths - use resolve() with sessionPath
- **Don't** forget to call process.exit() in CLI action handlers
- **Don't** use public properties - use `#` for private class members
- **Don't** forget to update CLI return type when adding subcommand
- **Don't** skip confirmation for clear command (unless --force is set)
- **Don't** forget dry-run mode for clean and clear commands
- **Don't** assume cache directory exists - handle ENOENT gracefully
- **Don't** duplicate TTL configuration - P3.M3.T1.S1 already did this
- **Don't** modify tasks.json, PRD.md, or prps/\*.md files - only touch .cache/
- **Don't** use table formatting for JSON output mode
- **Don't** forget to mock node:fs/promises in tests before imports
- **Don't** use non-mocked fs operations in tests

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:

- Complete analysis of existing cache implementation with specific line numbers
- Previous PRP (P3.M3.T1.S1) contract clearly understood and respected
- Clear CLI command patterns from artifacts.ts and inspect.ts
- Comprehensive test patterns from prp-generator.test.ts
- Four detailed research documents covering all aspects
- Specific file paths, interfaces, and code patterns provided
- Atomic file operation pattern for safety
- Graceful error handling patterns

**Risk Areas**:

- Must use same cache path structure as PRPGenerator for consistency
- Individual file failures must not stop entire cleanup operation
- Confirmation prompt needed for clear command (safety)
- Proper mock setup required for file system tests

**Mitigation**:

- Follow PRPGenerator's getCachePath/getCacheMetadataPath patterns exactly
- Use try/catch around each file deletion, log errors, continue
- Default to 'N' for confirmation prompt, require explicit 'y'
- Use vi.mocked() for type-safe mocked functions in tests

---

**Document Version**: 1.0
**Last Updated**: 2025-01-25
**Related Documents**:

- Previous PRP (P3.M3.T1.S1): `plan/003_b3d3efdaf0ed/P3M3T1S1/PRP.md`
- CLI Command Patterns: `plan/003_b3d3efdaf0ed/P3M3T1S2/research/cli-command-patterns.md`
- Cache Testing Patterns: `plan/003_b3d3efdaf0ed/P3M3T1S2/research/cache-testing-patterns.md`
- Cache Statistics Research: `plan/003_b3d3efdaf0ed/P3M3T1S2/research/cache-statistics-research.md`
- Architecture Context: `plan/003_b3d3efdaf0ed/P3M3T1S2/research/architecture-context.md`
- System Context: `plan/003_b3d3efdaf0ed/docs/system_context.md`
