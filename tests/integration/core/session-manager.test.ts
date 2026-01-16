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
import type { SessionState } from '../../../src/core/models.js';

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
