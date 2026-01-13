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
import type { SessionState, SessionMetadata, DeltaSession } from './models.js';
import {
  hashPRD,
  createSessionDirectory,
  readTasksJSON,
  SessionFileError,
} from './session-utils.js';

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
  /** Path to PRD markdown file */
  readonly prdPath: string;

  /** Path to plan directory */
  readonly planDir: string;

  /** Current loaded session state (null until initialize/loadSession called) */
  #currentSession: SessionState | null = null;

  /**
   * Creates a new SessionManager instance
   *
   * @param prdPath - Path to PRD markdown file (must exist)
   * @param planDir - Path to plan directory (default: resolve('plan'))
   * @throws {SessionFileError} If PRD file does not exist
   */
  constructor(prdPath: string, planDir: string = resolve('plan')) {
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
    try {
      const entries = await readdir(this.planDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.endsWith(`_${hash}`)) {
          return resolve(this.planDir, entry.name);
        }
      }
      return null;
    } catch (error) {
      // If plan/ directory doesn't exist yet, that's OK
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Gets next sequence number for new session
   *
   * @returns Next sequence number (highest existing + 1)
   */
  async #getNextSequence(): Promise<number> {
    try {
      const entries = await readdir(this.planDir, { withFileTypes: true });
      let maxSeq = 0;
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const match = entry.name.match(/^(\d+)_/);
          if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      }
      return maxSeq + 1;
    } catch (error) {
      // If plan/ directory doesn't exist yet, start from 1
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return 1;
      }
      throw error;
    }
  }

  /**
   * Generates diff summary between old and new PRD content
   *
   * @param oldPRD - Original PRD content
   * @param newPRD - Modified PRD content
   * @returns Human-readable diff summary
   */
  #generateDiffSummary(oldPRD: string, newPRD: string): string {
    const oldLines = oldPRD.split('\n').length;
    const newLines = newPRD.split('\n').length;
    return `PRD modified: ${oldLines} lines → ${newLines} lines. Full delta analysis required.`;
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

    // 2. Search for existing session with matching hash
    const existingSession = await this.#findSessionByHash(sessionHash);

    if (existingSession) {
      // 3. Load existing session
      this.#currentSession = await this.loadSession(existingSession);
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

    // 4. Generate diff summary
    const diffSummary = this.#generateDiffSummary(oldPRD, newPRD);

    // 5. Create new session directory
    const currentSeq = parseInt(this.#currentSession.metadata.id.split('_')[0], 10);
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

    return deltaSession;
  }
}
