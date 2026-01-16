/**
 * Integration tests for SessionManager.initialize() - New Session Creation
 *
 * @remarks
 * Tests validate new session creation with real filesystem operations in temp directories.
 * These tests complement the unit tests in tests/unit/core/session-manager.test.ts by
 * using actual filesystem operations instead of mocks.
 *
 * Tests cover:
 * - Session directory creation with correct format (sequence_hash)
 * - PRD hash computation and session detection
 * - prd_snapshot.md creation with identical content
 * - SessionState structure with empty backlog
 * - Subdirectory creation (architecture/, prps/, artifacts/)
 * - Hash-based session detection (new session on PRD change)
 * - Sequential session numbering (001, 002, 003)
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/session-manager.ts | SessionManager Implementation}
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

import { SessionManager } from '../../../src/core/session-manager.js';
import { SessionFileError } from '../../../src/core/session-utils.js';
import type { SessionState, Backlog } from '../../../src/core/models.js';

// =============================================================================
// PATTERN: Fixture Helper Functions for Existing Session Loading
// =============================================================================

/**
 * Creates a minimal valid Backlog structure for testing
 * Contains: 1 Phase, 1 Milestone, 1 Task, 1 Subtask
 */
function createMinimalTasksJson(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase description',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// =============================================================================
// PATTERN: Test Setup with Temp Directories
// =============================================================================

describe('SessionManager.initialize()', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Create initial PRD file with sufficient content for validation
    const prdContent = `# Test PRD

## Executive Summary

This is a comprehensive test PRD for integration testing of SessionManager.initialize().
It contains enough content to pass PRD validation (minimum 100 characters).

## Functional Requirements

The system shall properly create session directories with the correct format.
The system shall compute SHA-256 hashes of PRD content for session detection.
`;
    writeFileSync(prdPath, prdContent);
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // PATTERN: Test 1 - New Session Created with Unique PRD Hash
  // =============================================================================

  it('should create new session with unique PRD hash', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE: Initialize session manager
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Session directory created
    expect(existsSync(planDir)).toBe(true);
    const sessionDirs = readdirSync(planDir).filter((d) =>
      /^\d{3}_[a-f0-9]{12}$/.test(d)
    );
    expect(sessionDirs).toHaveLength(1);

    // VERIFY: SessionState returned
    expect(session).toBeDefined();
    expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
    expect(session.taskRegistry.backlog).toEqual([]);
  });

  // =============================================================================
  // PATTERN: Test 2 - Session Directory Format Validation
  // =============================================================================

  it('should create session directory with correct format', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // VERIFY: Session directory format
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(1);

    const [sessionDirName] = sessionDirs;
    const match = sessionDirName.match(/^(\d{3})_([a-f0-9]{12})$/);
    expect(match).not.toBeNull();

    if (match) {
      const [, sequence, hash] = match;
      expect(sequence).toBe('001'); // Zero-padded to 3 digits
      expect(hash).toHaveLength(12); // 12-character hash
    }
  });

  // =============================================================================
  // PATTERN: Test 3 - Hash is First 12 Characters of SHA-256
  // =============================================================================

  it('should use first 12 characters of SHA-256 hash', async () => {
    // SETUP: Create PRD with known content
    const prdContent = `# Known PRD

## Executive Summary

This is a predictable PRD for hash testing. The content is designed to produce
a consistent SHA-256 hash that can be verified against the session metadata.

## Functional Requirements

The system shall compute the SHA-256 hash correctly and use the first 12 characters
as the session hash in the directory name.
`;
    writeFileSync(prdPath, prdContent);

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Compute expected hash
    const expectedHash = createHash('sha256')
      .update(prdContent, 'utf-8')
      .digest('hex')
      .slice(0, 12);

    expect(session.metadata.hash).toBe(expectedHash);

    // VERIFY: Session directory name contains expected hash
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs[0]).toContain(expectedHash);
  });

  // =============================================================================
  // PATTERN: Test 4 - SessionState with Empty Backlog
  // =============================================================================

  it('should create SessionState with empty backlog', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: SessionState structure
    expect(session.taskRegistry.backlog).toEqual([]);
    expect(session.currentItemId).toBeNull();
    expect(session.metadata.hash).toBeDefined();
    expect(session.metadata.id).toBeDefined();
    expect(session.prdSnapshot).toContain('Test PRD');
  });

  // =============================================================================
  // PATTERN: Test 5 - prd_snapshot.md Copied with Identical Content
  // =============================================================================

  it('should copy PRD to prd_snapshot.md with identical content', async () => {
    // SETUP: Create PRD with specific content
    const prdContent = `# Test PRD

## Executive Summary

This is a specific test PRD for snapshot verification. We need to ensure that
the content in prd_snapshot.md matches the original PRD exactly.

## Functional Requirements

The system shall copy the PRD content to prd_snapshot.md with identical content.
The file mode shall be 0o644 (rw-r--r--).
`;
    writeFileSync(prdPath, prdContent);

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // VERIFY: prd_snapshot.md exists
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const snapshotPath = join(sessionPath, 'prd_snapshot.md');
    expect(existsSync(snapshotPath)).toBe(true);

    // VERIFY: Content matches exactly
    const snapshotContent = readFileSync(snapshotPath, 'utf-8');
    expect(snapshotContent).toBe(prdContent);
  });

  // =============================================================================
  // PATTERN: Test 6 - Subdirectories Created
  // =============================================================================

  it('should create required subdirectories', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // VERIFY: All subdirectories exist
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);

    expect(existsSync(join(sessionPath, 'architecture'))).toBe(true);
    expect(existsSync(join(sessionPath, 'prps'))).toBe(true);
    expect(existsSync(join(sessionPath, 'artifacts'))).toBe(true);
  });

  // =============================================================================
  // PATTERN: Test 7 - PRD Hash Change Creates New Session
  // =============================================================================

  it('should create new session when PRD hash changes', async () => {
    // SETUP: Create first session
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // EXECUTE: Modify PRD and create new session
    const newContent = `# Modified PRD

## Executive Summary

This PRD content has been modified from the original. The hash should be different,
which will trigger the creation of a new session instead of loading the existing one.

## Functional Requirements

The system shall detect the PRD hash change and create a new session with a
different hash value.
`;
    writeFileSync(prdPath, newContent);

    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: New session created
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(2);

    // VERIFY: Hashes are different
    expect(session2.metadata.hash).not.toBe(session1.metadata.hash);

    // VERIFY: Both sessions exist in plan/
    const hash1 = session1.metadata.hash;
    const hash2 = session2.metadata.hash;
    expect(sessionDirs.some((d) => d.includes(hash1))).toBe(true);
    expect(sessionDirs.some((d) => d.includes(hash2))).toBe(true);
  });

  // =============================================================================
  // PATTERN: Test 8 - Sequential Session Numbering
  // =============================================================================

  it('should use sequential session numbering', async () => {
    // SETUP & EXECUTE: Create three sessions
    const sessions = [];
    for (let i = 0; i < 3; i++) {
      const content = `# PRD ${i}

## Executive Summary

This is PRD number ${i} for testing sequential session numbering.
Each PRD has different content to generate different hashes.

## Functional Requirements

The system shall create sessions with sequential numbering: 001, 002, 003.
This test verifies that the session sequence numbers increment correctly.
`;
      writeFileSync(prdPath, content);

      const manager = new SessionManager(prdPath, planDir);
      const session = await manager.initialize();
      sessions.push(session);
    }

    // VERIFY: Sessions numbered 001, 002, 003
    const sessionDirs = readdirSync(planDir);
    expect(sessionDirs).toHaveLength(3);

    const sequences = sessionDirs
      .map((d) => d.match(/^(\d{3})_/)?.[1])
      .sort();

    expect(sequences).toEqual(['001', '002', '003']);
  });

  // =============================================================================
  // PATTERN: Test 9 - SessionState Metadata Validation
  // =============================================================================

  it('should return SessionState with correct metadata', async () => {
    // SETUP: PRD created in beforeEach

    // EXECUTE
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Metadata fields
    const sessionDirs = readdirSync(planDir);
    const sessionDirName = sessionDirs[0];

    expect(session.metadata.id).toBe(sessionDirName);
    expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
    expect(session.metadata.path).toBe(resolve(planDir, sessionDirName));
    expect(session.metadata.parentSession).toBeNull(); // Not delta session
    expect(session.metadata.createdAt).toBeInstanceOf(Date);
  });
});

// =============================================================================
// Integration Tests for SessionManager.loadSession() - Existing Session Loading
// =============================================================================

describe('SessionManager.loadSession()', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-load-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Create initial PRD file with sufficient content for validation
    const prdContent = `# Test PRD for Session Loading

## Executive Summary

This is a comprehensive test PRD for integration testing of SessionManager.loadSession().
It contains enough content to pass PRD validation (minimum 100 characters).

## Functional Requirements

The system shall properly load existing sessions from tasks.json with Zod validation.
The system shall reconstruct complete session state from disk.
`;
    writeFileSync(prdPath, prdContent);
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =============================================================================
  // Test 1: Existing Session Loaded from tasks.json with Zod Validation
  // =============================================================================

  it('should load existing session from tasks.json', async () => {
    // SETUP: Create initial session
    const manager1 = new SessionManager(prdPath, planDir);
    const session1 = await manager1.initialize();

    // Create tasks.json (required for loadSession to work)
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');
    writeFileSync(tasksPath, JSON.stringify({ backlog: [] }, null, 2), 'utf-8');

    // EXECUTE: Initialize again with same PRD (triggers loadSession)
    const manager2 = new SessionManager(prdPath, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: Session loaded (not recreated)
    expect(session2.metadata.id).toBe(session1.metadata.id);
    expect(session2.metadata.hash).toBe(session1.metadata.hash);

    // VERIFY: taskRegistry structure (empty backlog for new session)
    expect(session2.taskRegistry).toBeDefined();
    expect(session2.taskRegistry.backlog).toEqual([]);

    // VERIFY: Only one session directory exists
    const sessionDirsAfter = readdirSync(planDir);
    expect(sessionDirsAfter).toHaveLength(1);
  });

  // =============================================================================
  // Test 2: Complete Phase->Milestone->Task->Subtask Hierarchy Parsed
  // =============================================================================

  it('should parse complete Phase->Milestone->Task->Subtask hierarchy', async () => {
    // SETUP: Create session with minimal tasks.json
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // Get session directory and create custom tasks.json
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');

    const minimalTasks = createMinimalTasksJson();
    writeFileSync(tasksPath, JSON.stringify(minimalTasks, null, 2), 'utf-8');

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: Complete hierarchy parsed
    expect(session.taskRegistry.backlog).toHaveLength(1);

    const phase = session.taskRegistry.backlog[0];
    expect(phase.type).toBe('Phase');
    expect(phase.id).toBe('P1');
    expect(phase.milestones).toHaveLength(1);

    const milestone = phase.milestones[0];
    expect(milestone.type).toBe('Milestone');
    expect(milestone.id).toBe('P1.M1');
    expect(milestone.tasks).toHaveLength(1);

    const task = milestone.tasks[0];
    expect(task.type).toBe('Task');
    expect(task.id).toBe('P1.M1.T1');
    expect(task.subtasks).toHaveLength(1);

    const subtask = task.subtasks[0];
    expect(subtask.type).toBe('Subtask');
    expect(subtask.id).toBe('P1.M1.T1.S1');
  });

  // =============================================================================
  // Test 3: PRD Snapshot Loaded with Identical Content
  // =============================================================================

  it('should load PRD snapshot with identical content', async () => {
    // SETUP: Create PRD with specific content
    const prdContent = `# Test PRD for Snapshot Verification

## Executive Summary

This is a specific test PRD for snapshot verification. We need to ensure that
the content in prd_snapshot.md matches the original PRD exactly.

## Functional Requirements

The system shall copy the PRD content to prd_snapshot.md with identical content.
`;
    writeFileSync(prdPath, prdContent);

    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // Create tasks.json (required for loadSession to work)
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');
    writeFileSync(tasksPath, JSON.stringify({ backlog: [] }, null, 2), 'utf-8');

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: PRD snapshot matches original
    expect(session.prdSnapshot).toBe(prdContent);
  });

  // =============================================================================
  // Test 4: Session Metadata Reconstructed from Directory Name
  // =============================================================================

  it('should reconstruct session metadata from directory name', async () => {
    // SETUP: Create session
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // Create tasks.json (required for loadSession to work)
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');
    writeFileSync(tasksPath, JSON.stringify({ backlog: [] }, null, 2), 'utf-8');

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: Metadata reconstructed
    const sessionDirName = sessionDirs[0];

    expect(session.metadata.id).toBe(sessionDirName);
    expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
    expect(session.metadata.path).toBe(resolve(planDir, sessionDirName));
    expect(session.metadata.createdAt).toBeInstanceOf(Date);
    expect(session.metadata.parentSession).toBeNull(); // Not delta session
  });

  // =============================================================================
  // Test 5: Parent Session Link Loaded from parent_session.txt
  // =============================================================================

  it('should load parent session link from parent_session.txt', async () => {
    // SETUP: Create session with parent_session.txt
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const parentPath = join(sessionPath, 'parent_session.txt');
    const tasksPath = join(sessionPath, 'tasks.json');

    // Write parent session link and tasks.json
    writeFileSync(parentPath, '001_abc123def456', 'utf-8');
    writeFileSync(tasksPath, JSON.stringify({ backlog: [] }, null, 2), 'utf-8');

    // EXECUTE: Load session again
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: Parent session loaded
    expect(session.metadata.parentSession).toBe('001_abc123def456');
  });

  // =============================================================================
  // Test 6: Batch Updates are Not Affected by loadSession
  // =============================================================================

  it('should not affect batch updates when loading session', async () => {
    // SETUP: Create session
    const manager = new SessionManager(prdPath, planDir);
    await manager.initialize();

    // Create tasks.json (required for loadSession to work)
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');
    writeFileSync(tasksPath, JSON.stringify({ backlog: [] }, null, 2), 'utf-8');

    // EXECUTE: Load session again (same manager instance)
    const session = await manager.initialize();

    // VERIFY: Session loads correctly with fresh state
    expect(session.metadata.id).toBeDefined();
    expect(session.taskRegistry).toBeDefined();
    expect(session.currentItemId).toBeNull();
  });

  // =============================================================================
  // Test 7: Invalid JSON Throws SessionFileError
  // =============================================================================

  it('should throw SessionFileError for invalid JSON', async () => {
    // SETUP: Create session with invalid tasks.json
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');

    // Write invalid JSON
    writeFileSync(tasksPath, '{ invalid json }', 'utf-8');

    // EXECUTE & VERIFY: Should throw error
    const manager2 = new SessionManager(prdPath, planDir);
    await expect(manager2.initialize()).rejects.toThrow(SessionFileError);
  });

  // =============================================================================
  // Test 8: Missing tasks.json Throws SessionFileError
  // =============================================================================

  it('should throw SessionFileError for missing tasks.json', async () => {
    // SETUP: Create session directory without tasks.json
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');

    // Create tasks.json first, then remove it
    writeFileSync(tasksPath, JSON.stringify({ backlog: [] }, null, 2), 'utf-8');
    rmSync(tasksPath);

    // EXECUTE & VERIFY: Should throw error
    const manager2 = new SessionManager(prdPath, planDir);
    await expect(manager2.initialize()).rejects.toThrow(SessionFileError);
  });

  // =============================================================================
  // Test 9: Missing prd_snapshot.md Throws Error
  // =============================================================================

  it('should throw error for missing prd_snapshot.md', async () => {
    // SETUP: Create session without prd_snapshot.md
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const snapshotPath = join(sessionPath, 'prd_snapshot.md');

    // Remove prd_snapshot.md
    rmSync(snapshotPath);

    // EXECUTE & VERIFY: Should throw error
    const manager2 = new SessionManager(prdPath, planDir);
    await expect(manager2.initialize()).rejects.toThrow();
  });

  // =============================================================================
  // Test 10: Missing parent_session.txt is Handled Gracefully
  // =============================================================================

  it('should handle missing parent_session.txt gracefully', async () => {
    // SETUP: Create session without parent_session.txt (default behavior)
    const manager1 = new SessionManager(prdPath, planDir);
    await manager1.initialize();

    // Create tasks.json (required for loadSession to work)
    const sessionDirs = readdirSync(planDir);
    const sessionPath = join(planDir, sessionDirs[0]);
    const tasksPath = join(sessionPath, 'tasks.json');
    writeFileSync(tasksPath, JSON.stringify({ backlog: [] }, null, 2), 'utf-8');

    // EXECUTE: Load session again (no parent_session.txt exists)
    const manager2 = new SessionManager(prdPath, planDir);
    const session = await manager2.initialize();

    // VERIFY: parentSession is null, no error thrown
    expect(session.metadata.parentSession).toBeNull();
  });
});
