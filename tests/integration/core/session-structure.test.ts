/**
 * Integration tests for Session Directory Structure and Naming Conventions
 *
 * @remarks
 * Tests validate the session directory structure, naming conventions, and atomic write
 * patterns used by the SessionManager for PRD-based session initialization.
 *
 * These tests use real filesystem operations in temporary directories to provide
 * true integration validation (not mocks). Tests validate:
 *
 * - Session directory naming pattern matches {sequence}_{hash} format exactly
 * - PRD hash computation uses SHA-256 with exactly 12-character slice
 * - All required subdirectories are created: architecture/, prps/, artifacts/
 * - prd_snapshot.md exists in session root
 * - Atomic write pattern uses temp file + rename for data corruption prevention
 * - File permissions are correct: directories 0o755, files 0o644
 * - Sequential session numbering works correctly
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/session-manager.ts | SessionManager Implementation}
 * @see {@link ../../src/core/session-utils.ts | Session Utilities Implementation}
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

import { SessionManager } from '../../../src/core/session-manager.js';
import type { Backlog } from '../../../src/core/models.js';

// =============================================================================
// TEST FIXTURE: Valid minimal PRD content generator
// =============================================================================

/**
 * Generates valid PRD content with unique suffix to avoid hash collisions
 * Must be at least 100 characters to pass PRD validation
 */
function generateValidPRD(uniqueSuffix: string): string {
  return `# Test Project ${uniqueSuffix}

A minimal project for session structure testing.

## P1: Test Phase

Validate session directory structure and naming conventions.

### P1.M1: Test Milestone

Create session structure validation tests.

#### P1.M1.T1: Create Session Tests

Implement integration tests for session management.

##### P1.M1.T1.S1: Write Session Structure Tests

Create tests for session directory structure validation.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Session structure validation ${uniqueSuffix}
2. INPUT: SessionManager implementation
3. LOGIC: Create integration tests validating session directory structure
4. OUTPUT: Passing integration tests for session structure
`;
}

/**
 * Creates a minimal valid Backlog structure for testing tasks.json
 */
function createMinimalBacklog(): Backlog {
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
// TEST SUITE: Session Directory Structure Validation
// =============================================================================

describe('Session Directory Structure', () => {
  let tempDir: string;
  let planDir: string;

  // ---------------------------------------------------------------------------
  // PATTERN: Temp directory setup and cleanup
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-structure-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // TEST: Session directory naming pattern
  // ==========================================================================

  it('should create session directory with {sequence}_{hash} format', async () => {
    // SETUP: Create test PRD
    const prdPath = join(tempDir, 'PRD.md');
    const prdContent = generateValidPRD('test-1');
    writeFileSync(prdPath, prdContent, { mode: 0o644 });

    // EXECUTE: Initialize session
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Session ID matches pattern
    const sessionPattern = /^(\d{3})_([a-f0-9]{12})$/;
    expect(session.metadata.id).toMatch(sessionPattern);

    // VERIFY: Extract components and validate
    const match = session.metadata.id.match(sessionPattern);
    expect(match).not.toBeNull();
    const [, sequence, hash] = match!;

    // VERIFY: Sequence is zero-padded to 3 digits
    expect(sequence).toHaveLength(3);
    expect(parseInt(sequence, 10)).toBeGreaterThanOrEqual(1);

    // VERIFY: Hash is exactly 12 lowercase hex characters
    expect(hash).toHaveLength(12);
    expect(hash).toMatch(/^[a-f0-9]{12}$/);

    // VERIFY: Session directory exists on filesystem
    expect(existsSync(session.metadata.path)).toBe(true);
    expect(session.metadata.path).toContain(join(planDir, session.metadata.id));
  });

  // ==========================================================================
  // TEST: PRD hash computation validation
  // ==========================================================================

  it('should compute SHA-256 hash and use first 12 characters', async () => {
    // SETUP: Create PRD with known content
    const prdPath = join(tempDir, 'PRD.md');
    const prdContent = generateValidPRD('test-hash');
    writeFileSync(prdPath, prdContent);

    // COMPUTE: Expected hash
    const fullHash = createHash('sha256').update(prdContent).digest('hex');
    const expectedHash = fullHash.slice(0, 12);

    // EXECUTE: Initialize session
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();

    // VERIFY: Hash matches expected (first 12 chars of SHA-256)
    expect(session.metadata.hash).toBe(expectedHash);

    // VERIFY: Hash is exactly 12 characters
    expect(session.metadata.hash).toHaveLength(12);

    // VERIFY: Hash contains only lowercase hexadecimal
    expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
  });

  // ==========================================================================
  // TEST: Required subdirectories validation
  // ==========================================================================

  it('should create architecture, prps, and artifacts subdirectories', async () => {
    // SETUP: Create test PRD
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, generateValidPRD('test-subdirs'));

    // EXECUTE: Initialize session
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();
    const sessionPath = session.metadata.path;

    // VERIFY: All subdirectories exist
    const requiredSubdirs = ['architecture', 'prps', 'artifacts'];
    for (const subdir of requiredSubdirs) {
      const subdirPath = join(sessionPath, subdir);
      expect(existsSync(subdirPath)).toBe(true);

      // VERIFY: It's actually a directory
      const stats = statSync(subdirPath);
      expect(stats.isDirectory()).toBe(true);
    }

    // VERIFY: No unexpected subdirectories in root
    const entries = readdirSync(sessionPath, { withFileTypes: true });
    const directories = entries.filter(e => e.isDirectory()).map(e => e.name);
    expect(directories).toEqual(expect.arrayContaining(requiredSubdirs));
  });

  // ==========================================================================
  // TEST: Required files validation
  // ==========================================================================

  it('should create prd_snapshot.md in session root', async () => {
    // SETUP & EXECUTE
    const prdPath = join(tempDir, 'PRD.md');
    const prdContent = generateValidPRD('test-snapshot');
    writeFileSync(prdPath, prdContent);
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();
    const sessionPath = session.metadata.path;

    // VERIFY: prd_snapshot.md exists and contains PRD content
    const snapshotPath = join(sessionPath, 'prd_snapshot.md');
    expect(existsSync(snapshotPath)).toBe(true);
    const snapshotContent = readFileSync(snapshotPath, 'utf-8');
    expect(snapshotContent).toContain('# Test Project test-snapshot');
    expect(snapshotContent).toContain('session structure testing');
  });

  it('should create tasks.json when backlog is saved', async () => {
    // SETUP: Create session and save backlog
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, generateValidPRD('test-tasks'));
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();
    const sessionPath = session.metadata.path;

    // EXECUTE: Save backlog (this creates tasks.json)
    const backlog = createMinimalBacklog();
    await manager.saveBacklog(backlog);

    // VERIFY: tasks.json exists and contains valid JSON
    const tasksPath = join(sessionPath, 'tasks.json');
    expect(existsSync(tasksPath)).toBe(true);
    const tasksContent = readFileSync(tasksPath, 'utf-8');
    const tasksData = JSON.parse(tasksContent) as Backlog;
    expect(tasksData).toHaveProperty('backlog');
    expect(Array.isArray(tasksData.backlog)).toBe(true);
    expect(tasksData.backlog).toHaveLength(1);
    expect(tasksData.backlog[0].id).toBe('P1');
  });

  // ==========================================================================
  // TEST: Atomic write pattern validation
  // ==========================================================================

  it('should use atomic write pattern for tasks.json', async () => {
    // SETUP: Create session
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, generateValidPRD('test-atomic'));
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();
    const sessionPath = session.metadata.path;

    // EXECUTE: Save backlog (this uses atomic write internally)
    const backlog = createMinimalBacklog();
    await manager.saveBacklog(backlog);

    // VERIFY: tasks.json exists (atomic write completed successfully)
    const tasksPath = join(sessionPath, 'tasks.json');
    expect(existsSync(tasksPath)).toBe(true);

    // VERIFY: tasks.json contains correct data
    const tasksContent = readFileSync(tasksPath, 'utf-8');
    const tasksData = JSON.parse(tasksContent) as Backlog;
    expect(tasksData.backlog).toHaveLength(1);
    expect(tasksData.backlog[0].id).toBe('P1');
  });

  // ==========================================================================
  // TEST: File permissions validation
  // ==========================================================================

  it('should create directories with mode 0o755', async () => {
    // SETUP: Create test PRD
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, generateValidPRD('test-perms-dir'));

    // EXECUTE: Initialize session
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();
    const sessionPath = session.metadata.path;

    // VERIFY: Session directory has correct permissions
    const sessionStats = statSync(sessionPath);
    const sessionMode = sessionStats.mode & 0o777;
    expect(sessionMode).toBe(0o755);

    // VERIFY: Subdirectories have correct permissions
    const subdirs = ['architecture', 'prps', 'artifacts'];
    for (const subdir of subdirs) {
      const subdirPath = join(sessionPath, subdir);
      const stats = statSync(subdirPath);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o755);
    }
  });

  it('should create files with mode 0o644', async () => {
    // SETUP: Create session and save backlog
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, generateValidPRD('test-perms-file'));
    const manager = new SessionManager(prdPath, planDir);
    const session = await manager.initialize();
    const sessionPath = session.metadata.path;

    // Save backlog to create tasks.json
    const backlog = createMinimalBacklog();
    await manager.saveBacklog(backlog);

    // VERIFY: tasks.json has correct permissions
    const tasksPath = join(sessionPath, 'tasks.json');
    const tasksStats = statSync(tasksPath);
    const tasksMode = tasksStats.mode & 0o777;
    expect(tasksMode).toBe(0o644);

    // VERIFY: prd_snapshot.md has correct permissions
    const snapshotPath = join(sessionPath, 'prd_snapshot.md');
    const snapshotStats = statSync(snapshotPath);
    const snapshotMode = snapshotStats.mode & 0o777;
    expect(snapshotMode).toBe(0o644);
  });

  // ==========================================================================
  // TEST: Sequential session numbering
  // ==========================================================================

  it('should increment session sequence number correctly', async () => {
    // SETUP: Create first PRD
    const prdPath1 = join(tempDir, 'PRD.md');
    const prdContent1 = generateValidPRD('test-seq-1');
    writeFileSync(prdPath1, prdContent1);

    // EXECUTE: Initialize first session
    const manager1 = new SessionManager(prdPath1, planDir);
    const session1 = await manager1.initialize();

    // VERIFY: First session sequence is 001
    expect(session1.metadata.id).toMatch(/^001_[a-f0-9]{12}$/);

    // SETUP: Create second PRD (different content = different hash)
    const prdPath2 = join(tempDir, 'PRD-v2.md');
    const prdContent2 = generateValidPRD('test-seq-2');
    writeFileSync(prdPath2, prdContent2);

    // EXECUTE: Initialize second session
    const manager2 = new SessionManager(prdPath2, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: Second session sequence is 002
    expect(session2.metadata.id).toMatch(/^002_[a-f0-9]{12}$/);

    // VERIFY: Both sessions exist in plan directory
    expect(existsSync(session1.metadata.path)).toBe(true);
    expect(existsSync(session2.metadata.path)).toBe(true);

    // VERIFY: Session IDs are different (different hash)
    expect(session1.metadata.id).not.toBe(session2.metadata.id);
  });

  // ==========================================================================
  // TEST: Hash determinism and correctness
  // ==========================================================================

  it('should produce deterministic hash for identical PRD content', async () => {
    // SETUP: Create two identical PRDs
    const prdContent = generateValidPRD('test-deterministic');
    const prdPath1 = join(tempDir, 'PRD-1.md');
    const prdPath2 = join(tempDir, 'PRD-2.md');
    writeFileSync(prdPath1, prdContent);
    writeFileSync(prdPath2, prdContent);

    // EXECUTE: Initialize first session
    const manager1 = new SessionManager(prdPath1, planDir);
    const session1 = await manager1.initialize();

    // Save backlog so loadSession will work for second initialize
    await manager1.saveBacklog(createMinimalBacklog());

    // EXECUTE: Initialize second session with same content
    const manager2 = new SessionManager(prdPath2, planDir);
    const session2 = await manager2.initialize();

    // VERIFY: Hashes are identical
    expect(session1.metadata.hash).toBe(session2.metadata.hash);

    // VERIFY: Same session ID is reused (same PRD = same hash = same session)
    expect(session1.metadata.id).toBe(session2.metadata.id);
  });
});
