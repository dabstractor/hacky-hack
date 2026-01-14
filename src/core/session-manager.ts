/**
 * Session Manager for PRP Pipeline state management
 *
 * @module core/session-manager
 *
 * @remarks
 * Provides centralized session state management, PRD hash-based initialization,
 * session discovery/loading, and delta session creation capabilities.
 *
 * Wraps existing session-utils.ts functions into a cohesive API.
 * Uses readonly properties for immutability and prevents state corruption.
 *
 * @example
 * ```typescript
 * import { SessionManager } from './core/session-manager.js';
 *
 * const manager = new SessionManager('./PRD.md');
 * const session = await manager.initialize();
 * console.log(session.metadata.id); // "001_14b9dc2a33c7"
 * ```
 */

import { statSync } from 'node:fs';
import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';
import type {
  SessionState,
  SessionMetadata,
  DeltaSession,
  Backlog,
  Status,
} from './models.js';
import type { HierarchyItem } from '../utils/task-utils.js';
import {
  hashPRD,
  createSessionDirectory,
  readTasksJSON,
  writeTasksJSON,
  SessionFileError,
} from './session-utils.js';
import { diffPRDs } from './prd-differ.js';
import {
  updateItemStatus as updateItemStatusUtil,
  findItem,
} from '../utils/task-utils.js';

/**
 * Compiled regex for session directory matching
 *
 * @remarks
 * Matches directory names in the format {sequence}_{hash} where:
 * - sequence: 3-digit zero-padded number (e.g., 001, 002)
 * - hash: 12-character lowercase hexadecimal string (first 12 chars of SHA-256)
 *
 * Example matches: "001_14b9dc2a33c7", "999_abcdef123456"
 * Example non-matches: "1_abc", "001_abcdef", "001_14b9dc2a33c7_extra"
 */
const SESSION_DIR_PATTERN = /^(\d{3})_([a-f0-9]{12})$/;

/**
 * Parsed session directory information
 *
 * @remarks
 * Internal type used to represent a parsed session directory with
 * its name, path, sequence number, and hash.
 */
interface SessionDirInfo {
  /** Directory name (e.g., '001_14b9dc2a33c7') */
  name: string;
  /** Absolute path to directory */
  path: string;
  /** Parsed sequence number (e.g., 1) */
  sequence: number;
  /** Parsed hash (e.g., '14b9dc2a33c7') */
  hash: string;
}

/**
 * Session Manager for PRP Pipeline state management
 *
 * @remarks
 * Provides centralized session state management with PRD hash-based initialization,
 * session discovery/loading, and delta session creation capabilities.
 *
 * Wraps existing session-utils.ts functions into a cohesive API.
 * Uses readonly properties for immutability and prevents state corruption.
 */
export class SessionManager {
  /** Logger instance for structured logging */
  readonly #logger: Logger;

  /** Path to PRD markdown file */
  readonly prdPath: string;

  /** Path to plan directory */
  readonly planDir: string;

  /** Current loaded session state (null until initialize/loadSession called) */
  #currentSession: SessionState | null = null;

  /** Cached PRD hash for change detection (null until initialize called) */
  #prdHash: string | null = null;

  /** Batching state: flag indicating pending changes */
  #dirty: boolean = false;

  /** Batching state: latest accumulated backlog state */
  #pendingUpdates: Backlog | null = null;

  /** Batching state: count of accumulated updates (for stats) */
  #updateCount: number = 0;

  /**
   * Creates a new SessionManager instance
   *
   * @param prdPath - Path to PRD markdown file (must exist)
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @throws {SessionFileError} If PRD file does not exist
   */
  constructor(prdPath: string, planDir: string = resolve('plan')) {
    this.#logger = getLogger('SessionManager');
    // Validate PRD exists synchronously
    const absPath = resolve(prdPath);

    try {
      const stats = statSync(absPath);
      if (!stats.isFile()) {
        throw new SessionFileError(absPath, 'validate PRD path');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new SessionFileError(
          absPath,
          'validate PRD exists',
          error as Error
        );
      }
      throw error;
    }

    this.prdPath = absPath;
    this.planDir = resolve(planDir);
    this.#currentSession = null;
  }

  /**
   * Gets the current session state
   *
   * @returns Current loaded session state or null
   */
  get currentSession(): SessionState | null {
    return this.#currentSession;
  }

  /**
   * Builds session directory path from sequence and hash
   *
   * @param sequence - Session sequence number
   * @param hash - Session hash (first 12 chars of SHA-256)
   * @returns Absolute path to session directory
   */
  #getSessionPath(sequence: number, hash: string): string {
    const paddedSeq = String(sequence).padStart(3, '0');
    return resolve(this.planDir, `${paddedSeq}_${hash}`);
  }

  /**
   * Searches plan/ directory for existing session with matching hash
   *
   * @param hash - Session hash to search for (first 12 chars)
   * @returns Absolute path to matching session directory, or null if not found
   */
  async #findSessionByHash(hash: string): Promise<string | null> {
    const sessions: SessionDirInfo[] =
      await SessionManager.__scanSessionDirectories(this.planDir);
    const match = sessions.find((s: SessionDirInfo) => s.hash === hash);
    return match?.path ?? null;
  }

  /**
   * Gets next sequence number for new session
   *
   * @returns Next sequence number (highest existing + 1)
   */
  async #getNextSequence(): Promise<number> {
    const sessions: SessionDirInfo[] =
      await SessionManager.__scanSessionDirectories(this.planDir);
    const maxSeq = sessions.reduce(
      (max: number, s: SessionDirInfo) => Math.max(max, s.sequence),
      0
    );
    return maxSeq + 1;
  }

  /**
   * Initializes session manager - creates new session or loads existing
   *
   * @remarks
   * Hashes PRD, searches for existing sessions with matching hash.
   * If found: loads existing session. If not: creates new session directory.
   *
   * @returns Initialized SessionState with metadata, prdSnapshot, taskRegistry
   * @throws {SessionFileError} If PRD cannot be read or session creation fails
   */
  async initialize(): Promise<SessionState> {
    // 1. Hash the PRD
    const fullHash = await hashPRD(this.prdPath);
    const sessionHash = fullHash.slice(0, 12);
    // Cache the PRD hash for later change detection
    this.#prdHash = sessionHash;

    // 2. Search for existing session with matching hash
    const existingSession = await this.#findSessionByHash(sessionHash);

    if (existingSession) {
      // 3. Load existing session
      this.#currentSession = await this.loadSession(existingSession);
      this.#logger.info(
        { sessionId: this.#currentSession.metadata.id, prdPath: this.prdPath },
        'Session loaded'
      );
      return this.#currentSession;
    }

    // 4. Create new session
    const sequence = await this.#getNextSequence();
    const sessionPath = await createSessionDirectory(this.prdPath, sequence);

    // 5. Write PRD snapshot
    const prdContent = await readFile(this.prdPath, 'utf-8');
    await writeFile(resolve(sessionPath, 'prd_snapshot.md'), prdContent, {
      mode: 0o644,
    });

    // 6. Create SessionState with empty task registry
    const sessionId = `${String(sequence).padStart(3, '0')}_${sessionHash}`;
    const metadata: SessionMetadata = {
      id: sessionId,
      hash: sessionHash,
      path: sessionPath,
      createdAt: new Date(),
      parentSession: null,
    };

    this.#currentSession = {
      metadata,
      prdSnapshot: prdContent,
      taskRegistry: { backlog: [] }, // Empty until Architect Agent generates
      currentItemId: null,
    };

    this.#logger.info({ sessionId, sessionPath }, 'Session created');
    return this.#currentSession;
  }

  /**
   * Loads session state from existing session directory
   *
   * @remarks
   * Reconstructs SessionState from tasks.json and prd_snapshot.md.
   * Parses metadata from directory name and checks for parent session.
   *
   * @param sessionPath - Absolute path to session directory
   * @returns Fully populated SessionState
   * @throws {SessionFileError} If tasks.json or prd_snapshot.md not found
   */
  async loadSession(sessionPath: string): Promise<SessionState> {
    // 1. Read tasks.json
    const taskRegistry = await readTasksJSON(sessionPath);

    // 2. Read PRD snapshot
    const prdSnapshotPath = resolve(sessionPath, 'prd_snapshot.md');
    const prdSnapshot = await readFile(prdSnapshotPath, 'utf-8');

    // 3. Parse metadata from directory name
    const dirName = basename(sessionPath);
    const [, hash] = dirName.split('_');

    // 4. Check for parent session (optional file: parent_session.txt)
    let parentSession: string | null = null;
    try {
      const parentPath = resolve(sessionPath, 'parent_session.txt');
      const parentContent = await readFile(parentPath, 'utf-8');
      parentSession = parentContent.trim();
    } catch {
      // No parent session file
    }

    // 5. Get directory creation time
    const stats = await stat(sessionPath);
    const createdAt = stats.mtime; // Use modification time as creation time

    const metadata: SessionMetadata = {
      id: dirName,
      hash,
      path: sessionPath,
      createdAt,
      parentSession,
    };

    return {
      metadata,
      prdSnapshot,
      taskRegistry,
      currentItemId: null, // Task Orchestrator will set this
    };
  }

  /**
   * Creates delta session for PRD changes
   *
   * @remarks
   * Creates linked session with parent reference when PRD is modified.
   * Computes hash of new PRD, generates diff summary, and creates
   * new session directory with parent_session.txt reference.
   *
   * @param newPRDPath - Path to modified PRD file
   * @returns DeltaSession with oldPRD, newPRD, diffSummary
   * @throws {SessionFileError} If new PRD does not exist or session creation fails
   * @throws {Error} If no current session is loaded
   */
  async createDeltaSession(newPRDPath: string): Promise<DeltaSession> {
    if (!this.#currentSession) {
      throw new Error('Cannot create delta session: no current session loaded');
    }

    // 1. Validate new PRD exists
    const absPath = resolve(newPRDPath);
    try {
      await stat(absPath);
    } catch {
      throw new SessionFileError(absPath, 'validate new PRD exists');
    }

    // 2. Hash new PRD
    const newHash = await hashPRD(newPRDPath);
    const sessionHash = newHash.slice(0, 12);

    // 3. Read PRD contents
    const oldPRD = this.#currentSession.prdSnapshot;
    const newPRD = await readFile(absPath, 'utf-8');

    // 4. Generate diff summary using structured PRD differ
    const diffResult = diffPRDs(oldPRD, newPRD);
    const diffSummary = diffResult.summaryText;

    // 5. Create new session directory
    const currentSeq = parseInt(
      this.#currentSession.metadata.id.split('_')[0],
      10
    );
    const newSeq = currentSeq + 1;
    const sessionPath = await createSessionDirectory(newPRDPath, newSeq);

    // 6. Write parent session reference
    await writeFile(
      resolve(sessionPath, 'parent_session.txt'),
      this.#currentSession.metadata.id,
      { mode: 0o644 }
    );

    // 7. Create DeltaSessionState
    const sessionId = `${String(newSeq).padStart(3, '0')}_${sessionHash}`;
    const metadata: SessionMetadata = {
      id: sessionId,
      hash: sessionHash,
      path: sessionPath,
      createdAt: new Date(),
      parentSession: this.#currentSession.metadata.id,
    };

    // 8. Create DeltaSession and update current session
    const deltaSession: DeltaSession = {
      metadata,
      prdSnapshot: newPRD,
      taskRegistry: { backlog: [] }, // Will be generated by Architect Agent
      currentItemId: null,
      oldPRD,
      newPRD,
      diffSummary,
    };

    // Update current session to point to the new delta session
    this.#currentSession = deltaSession;

    this.#logger.info(
      {
        deltaSessionId: sessionId,
        parentSessionId: this.#currentSession.metadata.parentSession,
        changesCount: diffResult.changes.length,
      },
      'Delta session created'
    );
    return deltaSession;
  }

  /**
   * Atomically saves backlog to tasks.json
   *
   * @remarks
   * Delegates to writeTasksJSON() which uses atomic write pattern
   * (temp file + rename) to prevent data corruption if process crashes.
   *
   * @param backlog - Backlog object to persist
   * @throws {Error} If no session is loaded
   * @throws {SessionFileError} If write fails
   *
   * @example
   * ```typescript
   * const backlog: Backlog = { backlog: [/* ... *\/] };
   * await manager.saveBacklog(backlog);
   * ```
   */
  async saveBacklog(backlog: Backlog): Promise<void> {
    if (!this.#currentSession) {
      throw new Error('Cannot save backlog: no session loaded');
    }

    await writeTasksJSON(this.#currentSession.metadata.path, backlog);
    this.#logger.debug(
      { backlogPath: this.#currentSession.metadata.path },
      'Backlog persisted'
    );
  }

  /**
   * Flushes accumulated batch updates to disk atomically
   *
   * @remarks
   * Persists all pending status updates in a single atomic write operation.
   * Logs batch statistics including items written and write operations saved.
   * Safe to call multiple times - no-op if no pending changes.
   *
   * Preserves dirty state on error to allow retry on next flush.
   *
   * @throws {Error} If no session is loaded
   * @throws {SessionFileError} If write fails (dirty state preserved)
   *
   * @example
   * ```typescript
   * await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
   * await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
   * // Both updates accumulated in memory
   * await manager.flushUpdates(); // Single write operation
   * // Log: "Batch write complete: 2 items in 1 operation (1 write ops saved)"
   * ```
   */
  async flushUpdates(): Promise<void> {
    // Early return if no pending changes
    if (!this.#dirty) {
      this.#logger.debug('No pending updates to flush');
      return;
    }

    if (!this.#pendingUpdates) {
      this.#logger.warn(
        'Dirty flag set but no pending updates - skipping flush'
      );
      this.#dirty = false;
      return;
    }

    try {
      // Persist accumulated updates atomically
      await this.saveBacklog(this.#pendingUpdates);

      // Calculate stats for logging
      const itemsWritten = this.#updateCount;
      const writeOpsSaved = Math.max(0, itemsWritten - 1);

      // Log batch write completion
      this.#logger.info(
        {
          itemsWritten,
          writeOpsSaved,
          efficiency:
            itemsWritten > 0
              ? `${((writeOpsSaved / itemsWritten) * 100).toFixed(1)}%`
              : '0%',
        },
        'Batch write complete'
      );

      // Reset batching state
      this.#dirty = false;
      this.#pendingUpdates = null;
      this.#updateCount = 0;

      this.#logger.debug('Batching state reset');
    } catch (error) {
      // Preserve dirty state on error - allow retry
      this.#logger.error(
        { error, pendingCount: this.#updateCount },
        'Batch write failed - pending updates preserved for retry'
      );
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Loads backlog from tasks.json
   *
   * @remarks
   * Delegates to readTasksJSON() which reads and validates the
   * backlog with Zod schema. Use this to refresh the in-memory
   * task registry from disk.
   *
   * @returns Validated Backlog object
   * @throws {Error} If no session is loaded
   * @throws {SessionFileError} If read or validation fails
   *
   * @example
   * ```typescript
   * const backlog = await manager.loadBacklog();
   * console.log(backlog.backlog.length); // Number of phases
   * ```
   */
  async loadBacklog(): Promise<Backlog> {
    if (!this.#currentSession) {
      throw new Error('Cannot load backlog: no session loaded');
    }

    return readTasksJSON(this.#currentSession.metadata.path);
  }

  /**
   * Updates item status and persists changes atomically
   *
   * @remarks
   * Uses immutable update pattern from task-utils.ts to create a new
   * backlog with updated status. Accumulates updates in memory for
   * batch flushing - caller must call flushUpdates() to persist changes.
   *
   * @param itemId - Item ID to update (e.g., "P1.M1.T1.S1")
   * @param status - New status value
   * @returns Updated Backlog (not yet persisted to disk)
   * @throws {Error} If no session is loaded
   *
   * @example
   * ```typescript
   * const updated = await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
   * // Status updated in memory but NOT persisted to disk
   * await manager.flushUpdates(); // Persist all pending updates
   * ```
   */
  async updateItemStatus(itemId: string, status: Status): Promise<Backlog> {
    if (!this.#currentSession) {
      throw new Error('Cannot update item status: no session loaded');
    }

    // Get current backlog from session
    const currentBacklog = this.#currentSession.taskRegistry;

    // Immutable update using utility function
    const updated = updateItemStatusUtil(currentBacklog, itemId, status);

    // BATCHING: Accumulate in memory instead of immediate write
    this.#pendingUpdates = updated;
    this.#dirty = true;
    this.#updateCount++;

    // Update internal session state
    this.#currentSession = {
      ...this.#currentSession,
      taskRegistry: updated,
    };

    // Log the batched update (debug level - high frequency)
    this.#logger.debug(
      { itemId, status, pendingCount: this.#updateCount },
      'Status update batched'
    );

    // NOTE: No longer calling await this.saveBacklog(updated)
    // Caller must call flushUpdates() to persist changes

    return updated;
  }

  /**
   * Gets the current item from the backlog
   *
   * @remarks
   * Resolves currentItemId from the loaded session by searching the
   * backlog hierarchy. Returns null if no session is loaded or if
   * currentItemId is null.
   *
   * @returns HierarchyItem or null if no current item set
   *
   * @example
   * ```typescript
   * const item = manager.getCurrentItem();
   * if (item) {
   *   console.log(`Currently working on: ${item.title}`);
   * }
   * ```
   */
  getCurrentItem(): HierarchyItem | null {
    // Return null if no session loaded (not throw)
    if (!this.#currentSession) {
      return null;
    }

    // Return null if no current item set
    if (!this.#currentSession.currentItemId) {
      return null;
    }

    // Delegate to findItem utility
    return findItem(
      this.#currentSession.taskRegistry,
      this.#currentSession.currentItemId
    );
  }

  /**
   * Sets the current item ID for tracking execution position
   *
   * @remarks
   * Updates the internal session state's currentItemId field.
   * This mutates the private #currentSession field internally,
   * which is allowed for private fields despite readonly interface.
   *
   * @param itemId - Item ID to set as current
   * @throws {Error} If no session is loaded
   *
   * @example
   * ```typescript
   * manager.setCurrentItem('P1.M1.T1.S1');
   * const current = manager.getCurrentItem();
   * console.log(current?.id); // 'P1.M1.T1.S1'
   * ```
   */
  setCurrentItem(itemId: string): void {
    if (!this.#currentSession) {
      throw new Error('Cannot set current item: no session loaded');
    }

    // Create new object with updated currentItemId (readonly properties)
    this.#currentSession = {
      ...this.#currentSession,
      currentItemId: itemId,
    };
  }

  /**
   * Parses session directory name into components
   *
   * @remarks
   * Internal static helper that extracts sequence and hash from a directory name.
   * Returns null if the directory name doesn't match the session pattern.
   *
   * @param name - Directory name (e.g., '001_14b9dc2a33c7')
   * @param planDir - Path to plan directory
   * @returns Parsed session info or null if invalid format
   * @internal
   */
  static __parseSessionDirectory(
    name: string,
    planDir: string
  ): SessionDirInfo | null {
    const match = name.match(SESSION_DIR_PATTERN);
    if (!match) return null;

    return {
      name,
      path: resolve(planDir, name),
      sequence: parseInt(match[1], 10),
      hash: match[2],
    };
  }

  /**
   * Scans plan directory for session subdirectories
   *
   * @remarks
   * Internal static helper that reads the plan directory and returns all
   * subdirectories matching the session pattern. Handles ENOENT gracefully
   * by returning an empty array.
   *
   * @param planDir - Path to plan directory
   * @returns Array of session directory info
   * @throws {Error} For non-ENOENT errors during directory scanning
   * @internal
   */
  static async __scanSessionDirectories(
    planDir: string
  ): Promise<SessionDirInfo[]> {
    try {
      const entries = await readdir(planDir, { withFileTypes: true });
      const sessions: SessionDirInfo[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const match = entry.name.match(SESSION_DIR_PATTERN);
          if (match) {
            sessions.push({
              name: entry.name,
              path: resolve(planDir, entry.name),
              sequence: parseInt(match[1], 10),
              hash: match[2],
            });
          }
        }
      }

      return sessions;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return []; // Plan directory doesn't exist yet
      }
      throw error;
    }
  }

  /**
   * Reads parent session ID from parent_session.txt
   *
   * @remarks
   * Internal static helper that reads the parent session reference file.
   * Returns null if the file doesn't exist (not an error).
   *
   * @param sessionPath - Path to session directory
   * @returns Parent session ID or null
   * @internal
   */
  static async __readParentSession(
    sessionPath: string
  ): Promise<string | null> {
    try {
      const parentPath = resolve(sessionPath, 'parent_session.txt');
      const parentContent = await readFile(parentPath, 'utf-8');
      return parentContent.trim();
    } catch {
      // No parent session file
      return null;
    }
  }

  /**
   * Lists all sessions in the plan directory
   *
   * @remarks
   * Scans the plan directory for session subdirectories matching the
   * pattern {sequence}_{hash}. Returns an array of SessionMetadata objects
   * sorted by sequence number in ascending order.
   *
   * Returns an empty array if the plan directory doesn't exist or contains
   * no sessions.
   *
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @returns Array of SessionMetadata sorted by sequence ascending
   *
   * @example
   * ```typescript
   * const sessions = await SessionManager.listSessions();
   * console.log(`Found ${sessions.length} sessions`);
   * for (const session of sessions) {
   *   console.log(`${session.id}: ${session.hash}`);
   * }
   * ```
   */
  static async listSessions(
    planDir: string = resolve('plan')
  ): Promise<SessionMetadata[]> {
    // Scan for session directories
    const sessions: SessionDirInfo[] =
      await SessionManager.__scanSessionDirectories(planDir);

    // Build SessionMetadata for each session
    const metadata: SessionMetadata[] = [];

    for (const session of sessions) {
      try {
        // Get directory stats for createdAt
        const stats = await stat(session.path);

        // Check for parent session
        const parentSession = await SessionManager.__readParentSession(
          session.path
        );

        metadata.push({
          id: session.name,
          hash: session.hash,
          path: session.path,
          createdAt: stats.mtime,
          parentSession,
        });
      } catch {
        // Skip sessions that fail to load (e.g., permission denied, I/O error)
        continue;
      }
    }

    // Sort by sequence ascending
    metadata.sort((a, b) => {
      const seqA = parseInt(a.id.split('_')[0], 10);
      const seqB = parseInt(b.id.split('_')[0], 10);
      return seqA - seqB;
    });

    return metadata;
  }

  /**
   * Finds the latest session (highest sequence number)
   *
   * @remarks
   * Calls listSessions() and returns the session with the highest sequence
   * number. Returns null if no sessions exist.
   *
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @returns Latest SessionMetadata or null if no sessions exist
   *
   * @example
   * ```typescript
   * const latest = await SessionManager.findLatestSession();
   * if (latest) {
   *   console.log(`Latest session: ${latest.id}`);
   * } else {
   *   console.log('No sessions found');
   * }
   * ```
   */
  static async findLatestSession(
    planDir: string = resolve('plan')
  ): Promise<SessionMetadata | null> {
    const sessions = await SessionManager.listSessions(planDir);

    if (sessions.length === 0) {
      return null;
    }

    // listSessions() sorts ascending, so last element is highest
    return sessions[sessions.length - 1];
  }

  /**
   * Finds session matching the given PRD file
   *
   * @remarks
   * Computes the SHA-256 hash of the PRD file and searches for a session
   * directory with a matching hash (first 12 characters). Returns the full
   * SessionMetadata if found, null otherwise.
   *
   * Validates that the PRD file exists before computing the hash.
   *
   * @param prdPath - Path to PRD markdown file
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @returns Matching SessionMetadata or null if not found
   * @throws {SessionFileError} If PRD file does not exist
   *
   * @example
   * ```typescript
   * const session = await SessionManager.findSessionByPRD('./PRD.md');
   * if (session) {
   *   console.log(`Found existing session: ${session.id}`);
   * } else {
   *   console.log('No matching session found');
   * }
   * ```
   */
  static async findSessionByPRD(
    prdPath: string,
    planDir: string = resolve('plan')
  ): Promise<SessionMetadata | null> {
    // Validate PRD exists synchronously
    const absPath = resolve(prdPath);
    try {
      const stats = statSync(absPath);
      if (!stats.isFile()) {
        throw new SessionFileError(absPath, 'validate PRD path');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new SessionFileError(
          absPath,
          'validate PRD exists',
          error as Error
        );
      }
      throw error;
    }

    // Compute PRD hash
    const fullHash = await hashPRD(absPath);
    const sessionHash = fullHash.slice(0, 12);

    // Scan for sessions
    const sessions: SessionDirInfo[] =
      await SessionManager.__scanSessionDirectories(planDir);

    // Find matching session
    const match = sessions.find((s: SessionDirInfo) => s.hash === sessionHash);
    if (!match) {
      return null;
    }

    // Build full SessionMetadata
    const stats = await stat(match.path);
    const parentSession = await SessionManager.__readParentSession(match.path);

    return {
      id: match.name,
      hash: match.hash,
      path: match.path,
      createdAt: stats.mtime,
      parentSession,
    };
  }

  /**
   * Checks if the current PRD has changed since session load
   *
   * @remarks
   * Compares the cached PRD hash (computed during initialize()) with the
   * loaded session's hash. Returns true if the hashes differ (PRD was modified),
   * false otherwise.
   *
   * This is a synchronous check that uses the cached PRD hash from initialize().
   *
   * @returns true if PRD hash differs from session hash, false otherwise
   * @throws {Error} If no session is currently loaded
   *
   * @example
   * ```typescript
   * const manager = new SessionManager('./PRD.md');
   * await manager.initialize();
   *
   * // User modifies PRD file...
   *
   * if (manager.hasSessionChanged()) {
   *   console.log('PRD has changed, delta session needed');
   *   await manager.createDeltaSession('./PRD.md');
   * }
   * ```
   */
  hasSessionChanged(): boolean {
    if (!this.#currentSession) {
      throw new Error('Cannot check session change: no session loaded');
    }
    if (!this.#prdHash) {
      throw new Error('Cannot check session change: PRD hash not computed');
    }
    return this.#prdHash !== this.#currentSession.metadata.hash;
  }
}
