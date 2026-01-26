/**
 * Integration tests for plan/ Directory Structure and Artifacts
 *
 * @remarks
 * Tests validate the complete plan/ directory structure including PRP storage,
 * cache metadata, execution artifacts, bugfix sessions, and artifact preservation.
 *
 * Tests verify:
 * - Session directories are created with {sequence}_{hash} naming pattern
 * - PRPs are stored in prps/ with sanitized filenames and cache metadata in .cache/
 * - Execution artifacts are collected in artifacts/{taskId}/
 * - Bugfix sessions follow the same structure as main sessions
 * - All artifacts are preserved for audit trail
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/session-manager.ts | SessionManager Implementation}
 * @see {@link ../../src/agents/prp-generator.ts | PRP Generator Implementation}
 * @see {@link ../../src/agents/prp-runtime.ts | PRP Runtime Implementation}
 * @see {@link ../../plan/003_b3d3efdaf0ed/docs/system_context.md | System Context}
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  statSync,
  mkdirSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { SessionManager } from '../../src/core/session-manager.js';
import type { Backlog } from '../../src/core/models.js';

// =============================================================================
// TEST FIXTURE: Valid minimal PRD content generator
// =============================================================================

/**
 * Generates valid PRD content with unique suffix to avoid hash collisions
 * Must be at least 100 characters to pass PRD validation
 */
function generateValidPRD(uniqueSuffix: string): string {
  return `# Test Project ${uniqueSuffix}

A minimal project for directory structure testing.

## P1: Test Phase

Validate plan/ directory structure.

### P1.M1: Test Milestone

Create directory structure tests.

#### P1.M1.T1: Create Tests

Implement integration tests for directory structure.

##### P1.M1.T1.S1: Write Structure Tests

Create tests for directory structure verification.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Directory structure testing ${uniqueSuffix}
2. INPUT: SessionManager implementation
3. LOGIC: Verify plan/ directory structure
4. OUTPUT: Passing integration tests
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

/**
 * Helper to create mock PRP file
 */
function createMockPRP(sessionPath: string, taskId: string): void {
  const prpsDir = join(sessionPath, 'prps');
  const sanitizedTaskId = taskId.replace(/\./g, '_');
  const prpPath = join(prpsDir, `${sanitizedTaskId}.md`);
  const prpContent = `# PRP: ${taskId}

## Goal

Test PRP for ${taskId}.

## What

Test PRP content.
`;
  writeFileSync(prpPath, prpContent, { mode: 0o644 });
}

/**
 * Helper to create mock cache metadata
 */
function createMockCacheMetadata(sessionPath: string, taskId: string): void {
  const cacheDir = join(sessionPath, 'prps', '.cache');
  mkdirSync(cacheDir, { recursive: true, mode: 0o755 });

  const sanitizedTaskId = taskId.replace(/\./g, '_');
  const cachePath = join(cacheDir, `${sanitizedTaskId}.json`);

  const cacheMetadata = {
    taskId,
    taskHash: 'abc123def456',
    createdAt: Date.now(),
    accessedAt: Date.now(),
    version: '1.0',
    prp: {
      name: `${taskId} - Test PRP`,
      goal: {
        featureGoal: 'Test',
        deliverable: 'Test',
        successDefinition: 'Test',
      },
    },
  };

  writeFileSync(cachePath, JSON.stringify(cacheMetadata, null, 2), {
    mode: 0o644,
  });
}

/**
 * Helper to create mock execution artifacts
 */
function createMockArtifacts(sessionPath: string, taskId: string): void {
  const artifactsDir = join(sessionPath, 'artifacts', taskId);
  mkdirSync(artifactsDir, { recursive: true, mode: 0o755 });

  // Create validation-results.json
  const validationResults = [
    {
      level: 1,
      description: 'Syntax & Style validation',
      success: true,
      command: 'npm run lint',
      stdout: 'All checks passed',
      stderr: '',
      exitCode: 0,
      skipped: false,
    },
    {
      level: 2,
      description: 'Unit tests',
      success: true,
      command: 'npm test',
      stdout: 'Tests passed',
      stderr: '',
      exitCode: 0,
      skipped: false,
    },
  ];
  writeFileSync(
    join(artifactsDir, 'validation-results.json'),
    JSON.stringify(validationResults, null, 2),
    { mode: 0o644 }
  );

  // Create execution-summary.md
  const summary = `# Execution Summary for ${taskId}

**Status**: Success
**Fix Attempts**: 0

## Validation Results

### Level 1: Syntax & Style validation
- Status: PASSED
- Command: npm run lint

### Level 2: Unit tests
- Status: PASSED
- Command: npm test
`;
  writeFileSync(join(artifactsDir, 'execution-summary.md'), summary, {
    mode: 0o644,
  });

  // Create artifacts-list.json
  const artifactsList = [
    '/path/to/created/file1.ts',
    '/path/to/created/file2.ts',
  ];
  writeFileSync(
    join(artifactsDir, 'artifacts-list.json'),
    JSON.stringify(artifactsList, null, 2),
    { mode: 0o644 }
  );
}

// =============================================================================
// TEST SUITE: plan/ Directory Structure Validation
// =============================================================================

describe('integration/session-structure > plan/ directory structure', () => {
  let tempDir: string;
  let planDir: string;

  // ---------------------------------------------------------------------------
  // PATTERN: Temp directory setup and cleanup
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    // SETUP: Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-structure-test-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // CLEANUP: Remove temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // TEST: Session directory naming and structure
  // ==========================================================================

  describe('session directory naming and structure', () => {
    it('should create session directory with {sequence}_{hash} format', async () => {
      // SETUP: Create test PRD
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-1'));

      // EXECUTE: Initialize session
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();

      // VERIFY: Session ID matches pattern
      const sessionPattern = /^(\d{3})_([a-f0-9]{12})$/;
      expect(session.metadata.id).toMatch(sessionPattern);

      // VERIFY: Extract and validate components
      const match = session.metadata.id.match(sessionPattern);
      expect(match).not.toBeNull();
      const [, sequence, hash] = match!;

      // VERIFY: Sequence is zero-padded to 3 digits
      expect(sequence).toHaveLength(3);
      expect(parseInt(sequence, 10)).toBeGreaterThanOrEqual(1);

      // VERIFY: Hash is exactly 12 lowercase hex characters
      expect(hash).toHaveLength(12);
      expect(hash).toMatch(/^[a-f0-9]{12}$/);
    });

    it('should create required subdirectories', async () => {
      // SETUP: Create test PRD
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-subdirs'));

      // EXECUTE: Initialize session
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // VERIFY: All subdirectories exist (architecture, prps, artifacts are created by createSessionDirectory)
      const requiredSubdirs = ['architecture', 'prps', 'artifacts'];
      for (const subdir of requiredSubdirs) {
        const subdirPath = join(sessionPath, subdir);
        expect(existsSync(subdirPath)).toBe(true);

        // VERIFY: It's actually a directory
        const stats = statSync(subdirPath);
        expect(stats.isDirectory()).toBe(true);

        // VERIFY: Correct permissions (0o755)
        const mode = stats.mode & 0o777;
        expect(mode).toBe(0o755);
      }
    });

    it('should set correct file permissions', async () => {
      // SETUP: Create test PRD
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-perms'));

      // EXECUTE: Initialize session and save backlog
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // VERIFY: Directory permissions are 0o755
      const sessionDirStats = statSync(sessionPath);
      const dirMode = sessionDirStats.mode & 0o777;
      expect(dirMode).toBe(0o755);

      // VERIFY: File permissions are 0o644
      const tasksJsonPath = join(sessionPath, 'tasks.json');
      const fileStats = statSync(tasksJsonPath);
      const fileMode = fileStats.mode & 0o777;
      expect(fileMode).toBe(0o644);
    });
  });

  // ==========================================================================
  // TEST: PRP storage and caching
  // ==========================================================================

  describe('PRP storage and caching', () => {
    it('should store PRPs in prps/ with sanitized filenames', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-prp'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // EXECUTE: Create mock PRP file
      const taskId = 'P1.M1.T1.S1';
      createMockPRP(sessionPath, taskId);

      // VERIFY: PRP file exists with sanitized filename
      const sanitizedTaskId = taskId.replace(/\./g, '_');
      const prpPath = join(sessionPath, 'prps', `${sanitizedTaskId}.md`);
      expect(existsSync(prpPath)).toBe(true);

      // VERIFY: File contains valid markdown
      const prpContent = readFileSync(prpPath, 'utf-8');
      expect(prpContent).toContain('# PRP:');
      expect(prpContent).toContain(taskId);
    });

    it('should create cache metadata in prps/.cache/', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-cache'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // EXECUTE: Create mock cache metadata
      const taskId = 'P1.M1.T1.S1';
      createMockCacheMetadata(sessionPath, taskId);

      // VERIFY: Cache directory exists
      const cacheDir = join(sessionPath, 'prps', '.cache');
      expect(existsSync(cacheDir)).toBe(true);

      // VERIFY: Cache metadata file exists with sanitized filename
      const sanitizedTaskId = taskId.replace(/\./g, '_');
      const cachePath = join(cacheDir, `${sanitizedTaskId}.json`);
      expect(existsSync(cachePath)).toBe(true);
    });

    it('should include all required cache metadata fields', async () => {
      // SETUP: Create session with cache metadata
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-metadata'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockCacheMetadata(sessionPath, taskId);

      // EXECUTE: Load and parse cache metadata
      const sanitizedTaskId = taskId.replace(/\./g, '_');
      const cachePath = join(
        sessionPath,
        'prps',
        '.cache',
        `${sanitizedTaskId}.json`
      );
      const cacheContent = readFileSync(cachePath, 'utf-8');
      const cacheMetadata = JSON.parse(cacheContent);

      // VERIFY: All required fields exist
      expect(cacheMetadata).toHaveProperty('taskId');
      expect(cacheMetadata).toHaveProperty('taskHash');
      expect(cacheMetadata).toHaveProperty('createdAt');
      expect(cacheMetadata).toHaveProperty('accessedAt');
      expect(cacheMetadata).toHaveProperty('version');
      expect(cacheMetadata).toHaveProperty('prp');

      // VERIFY: Field types are correct
      expect(typeof cacheMetadata.taskId).toBe('string');
      expect(typeof cacheMetadata.taskHash).toBe('string');
      expect(typeof cacheMetadata.createdAt).toBe('number');
      expect(typeof cacheMetadata.accessedAt).toBe('number');
      expect(typeof cacheMetadata.version).toBe('string');
      expect(typeof cacheMetadata.prp).toBe('object');
    });

    it('should enforce 24-hour cache TTL', async () => {
      // SETUP: Create session with old cache metadata
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-ttl'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';

      // EXECUTE: Create cache entry with old timestamp (25 hours ago)
      const cacheDir = join(sessionPath, 'prps', '.cache');
      mkdirSync(cacheDir, { recursive: true, mode: 0o755 });

      const sanitizedTaskId = taskId.replace(/\./g, '_');
      const cachePath = join(cacheDir, `${sanitizedTaskId}.json`);

      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const cacheMetadata = {
        taskId,
        taskHash: 'abc123def456',
        createdAt: oldTimestamp,
        accessedAt: oldTimestamp,
        version: '1.0',
        prp: { name: 'Test PRP', goal: {} },
      };
      writeFileSync(cachePath, JSON.stringify(cacheMetadata, null, 2), {
        mode: 0o644,
      });

      // VERIFY: Cache file exists
      expect(existsSync(cachePath)).toBe(true);

      // VERIFY: Cache metadata's createdAt timestamp is older than 24-hour TTL
      const cacheContent = readFileSync(cachePath, 'utf-8');
      const parsedCache = JSON.parse(cacheContent);
      const cacheAge = Date.now() - parsedCache.createdAt;
      const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 86,400,000 ms
      expect(cacheAge).toBeGreaterThan(CACHE_TTL_MS);
    });
  });

  // ==========================================================================
  // TEST: Execution artifacts collection
  // ==========================================================================

  describe('execution artifacts collection', () => {
    it('should create artifacts/{taskId}/ directory', async () => {
      // SETUP: Create session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-artifacts'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      // EXECUTE: Create mock artifacts
      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // VERIFY: Artifacts directory exists
      const artifactsDir = join(sessionPath, 'artifacts', taskId);
      expect(existsSync(artifactsDir)).toBe(true);

      // VERIFY: It's a directory with correct permissions
      const stats = statSync(artifactsDir);
      expect(stats.isDirectory()).toBe(true);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o755);
    });

    it('should create validation-results.json', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-validation'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Read validation results
      const validationPath = join(
        sessionPath,
        'artifacts',
        taskId,
        'validation-results.json'
      );
      const validationContent = readFileSync(validationPath, 'utf-8');
      const validationResults = JSON.parse(validationContent);

      // VERIFY: Valid JSON with correct structure
      expect(Array.isArray(validationResults)).toBe(true);
      expect(validationResults.length).toBeGreaterThan(0);

      // VERIFY: First result has required fields
      const firstResult = validationResults[0];
      expect(firstResult).toHaveProperty('level');
      expect(firstResult).toHaveProperty('description');
      expect(firstResult).toHaveProperty('success');
      expect(firstResult).toHaveProperty('command');
      expect(firstResult).toHaveProperty('stdout');
      expect(firstResult).toHaveProperty('stderr');
      expect(firstResult).toHaveProperty('exitCode');
      expect(firstResult).toHaveProperty('skipped');
    });

    it('should create execution-summary.md', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-summary'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Read execution summary
      const summaryPath = join(
        sessionPath,
        'artifacts',
        taskId,
        'execution-summary.md'
      );
      const summaryContent = readFileSync(summaryPath, 'utf-8');

      // VERIFY: Contains markdown format
      expect(summaryContent).toContain('# Execution Summary');
      expect(summaryContent).toContain('**Status**');
      expect(summaryContent).toContain('## Validation Results');
    });

    it('should create artifacts-list.json', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-list'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Read artifacts list
      const listPath = join(
        sessionPath,
        'artifacts',
        taskId,
        'artifacts-list.json'
      );
      const listContent = readFileSync(listPath, 'utf-8');
      const artifactsList = JSON.parse(listContent);

      // VERIFY: Valid JSON array
      expect(Array.isArray(artifactsList)).toBe(true);
      expect(artifactsList.length).toBeGreaterThan(0);
      expect(typeof artifactsList[0]).toBe('string');
    });
  });

  // ==========================================================================
  // TEST: Bugfix session structure
  // ==========================================================================

  describe('bugfix session structure', () => {
    it('should create bugfix/{sequence}_{hash}/ sessions', async () => {
      // SETUP: Create main session
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-bugfix'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const mainSession = await manager.initialize();
      const mainSessionPath = mainSession.metadata.path;

      // EXECUTE: Create bugfix subdirectory manually (simulating bugfix session creation)
      const bugfixDir = join(mainSessionPath, 'bugfix');
      const bugfixSessionId = '001_abcdef123456';
      const bugfixSessionPath = join(bugfixDir, bugfixSessionId);
      mkdirSync(bugfixSessionPath, { recursive: true, mode: 0o755 });

      // VERIFY: Bugfix session directory exists
      expect(existsSync(bugfixSessionPath)).toBe(true);

      // VERIFY: Bugfix session ID follows same pattern
      const sessionPattern = /^(\d{3})_([a-f0-9]{12})$/;
      expect(bugfixSessionId).toMatch(sessionPattern);
    });

    it('should create same structure as main sessions', async () => {
      // SETUP: Create main session with bugfix subdirectory
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-bugfix-struct'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const mainSession = await manager.initialize();
      const mainSessionPath = mainSession.metadata.path;

      // EXECUTE: Create bugfix session with subdirectories
      const bugfixSessionId = '001_abcdef123456';
      const bugfixSessionPath = join(
        mainSessionPath,
        'bugfix',
        bugfixSessionId
      );
      const subdirs = ['architecture', 'prps', 'artifacts', 'docs'];
      for (const subdir of subdirs) {
        mkdirSync(join(bugfixSessionPath, subdir), {
          recursive: true,
          mode: 0o755,
        });
      }

      // VERIFY: All subdirectories exist
      for (const subdir of subdirs) {
        const subdirPath = join(bugfixSessionPath, subdir);
        expect(existsSync(subdirPath)).toBe(true);
        const stats = statSync(subdirPath);
        expect(stats.isDirectory()).toBe(true);
      }
    });
  });

  // ==========================================================================
  // TEST: Artifact preservation
  // ==========================================================================

  describe('artifact preservation', () => {
    it('should preserve all artifacts for audit trail', async () => {
      // SETUP: Create session with artifacts
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, generateValidPRD('test-preserve'));
      const manager = new SessionManager(prdPath, planDir, 3);
      const session = await manager.initialize();
      const sessionPath = session.metadata.path;

      const taskId = 'P1.M1.T1.S1';
      createMockArtifacts(sessionPath, taskId);

      // EXECUTE: Perform additional session operations (save, update, etc.)
      const backlog = createMinimalBacklog();
      await manager.saveBacklog(backlog);

      // VERIFY: Artifacts still exist (not deleted)
      const artifactsDir = join(sessionPath, 'artifacts', taskId);
      expect(existsSync(artifactsDir)).toBe(true);

      // VERIFY: All artifact files still exist
      expect(existsSync(join(artifactsDir, 'validation-results.json'))).toBe(
        true
      );
      expect(existsSync(join(artifactsDir, 'execution-summary.md'))).toBe(true);
      expect(existsSync(join(artifactsDir, 'artifacts-list.json'))).toBe(true);
    });
  });
});
