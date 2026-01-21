# Integration Test Patterns Research

## Overview

This document provides comprehensive patterns for writing integration tests in the Hacky-Hack codebase, with specific focus on delta session testing.

## Key Integration Test Files

### Primary Reference Files

- `/home/dustin/projects/hacky-hack/tests/integration/core/session-structure.test.ts` - Session directory structure validation
- `/home/dustin/projects/hacky-hack/tests/integration/core/session-manager.test.ts` - SessionManager E2E testing
- `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-e2e.test.ts` - Complete TaskOrchestrator workflow
- `/home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-integration.test.ts` - PRPPipeline end-to-end
- `/home/dustin/projects/hacky-hack/tests/integration/fix-cycle-workflow-integration.test.ts` - FixCycleWorkflow testing
- `/home/dustin/projects/hacky-hack/tests/integration/architect-agent.test.ts` - Agent integration pattern

### Test Fixture Files

- `/home/dustin/projects/hacky-hack/tests/fixtures/simple-prd.ts` - Minimal PRD for fast testing
- `/home/dustin/projects/hacky-hack/tests/fixtures/simple-prd-v2.ts` - Updated PRD version for delta testing
- `/home/dustin/projects/hacky-hack/tests/fixtures/mock-delta-data.ts` - Delta analysis test fixtures

## Test Fixture Patterns

### PRD Generation Pattern

```typescript
// From session-structure.test.ts (lines 49-81)
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
```

### Backlog Creation Pattern

```typescript
// From session-structure.test.ts (lines 86-128)
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
```

### Delta Test Data Pattern

```typescript
// From mock-delta-data.ts
export const mockOldPRD = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure.

## P1.M2.T1: Define Models
Create data models.
`;

export const mockNewPRD = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure with TypeScript.

## P1.M2.T1: Define Models
Create data models with Zod validation.
`;

export const mockCompletedTaskIds = ['P1.M1.T1', 'P1.M2.T1'];
```

## Temp Directory Management Patterns

### Standard Pattern with Setup/Cleanup

```typescript
// From session-structure.test.ts (lines 134-152)
describe('Session Directory Structure', () => {
  let tempDir: string;
  let planDir: string;

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
});
```

### Enhanced Pattern with Helper Function

```typescript
// From error-handling.test.ts (lines 47-50)
function setupTestDir(): string {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  return tempDir;
}

// Usage in tests
beforeEach(() => {
  tempDir = setupTestDir();
});

afterEach(() => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
  vi.clearAllMocks();
});
```

## Mocking Patterns for External Dependencies

### Agent Factory Mocking

```typescript
// From architect-agent.test.ts (lines 30-34)
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(() => ({
    prompt: vi.fn(),
  })),
}));

// Import after mocking
import { createArchitectAgent } from '../../src/agents/agent-factory.js';
```

### Groundswell MCP Mocking

```typescript
// From agents.test.ts (lines 24-31)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import mocked versions
import { createAgent, createPrompt } from 'groundswell';
```

### Complex File System Mocking

```typescript
// From prp-runtime-integration.test.ts (lines 28-58)
vi.mock('node:fs/promises', async () => {
  const actualFs = await vi.importActual('node:fs/promises');
  return {
    ...actualFs,
    mkdir: vi.fn((path: string, options: any) => {
      if (
        path &&
        (path.toString().includes('prps') ||
          path.toString().includes('artifacts'))
      ) {
        return Promise.resolve(undefined);
      }
      return actualFs.mkdir(path, options);
    }),
    writeFile: vi.fn((path: string, data: any, options: any) => {
      if (
        path &&
        (path.toString().includes('prps') ||
          path.toString().includes('artifacts'))
      ) {
        return Promise.resolve(undefined);
      }
      return actualFs.writeFile(path, data, options);
    }),
  };
});
```

## Assertion Patterns for Multi-Step Verification

### Session Structure Validation

```typescript
// From session-structure.test.ts
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
```

### Delta Session Validation Pattern

```typescript
it('should create delta session with parent linkage', async () => {
  // SETUP: Create initial PRD and session
  const oldPRDPath = join(tempDir, 'PRD.md');
  writeFileSync(oldPRDPath, mockOldPRD, { mode: 0o644 });

  const manager = new SessionManager(oldPRDPath, planDir);
  await manager.initialize();
  const parentSessionId = manager.currentSession.metadata.id;

  // MODIFY: Update PRD with new content
  writeFileSync(oldPRDPath, mockNewPRD, { mode: 0o644 });

  // EXECUTE: Create delta session
  const deltaSession = await manager.createDeltaSession(oldPRDPath);

  // VERIFY: Delta session created with new hash
  expect(deltaSession.metadata.id).not.toBe(parentSessionId);
  expect(deltaSession.metadata.parentSession).toBe(parentSessionId);

  // VERIFY: Parent session file exists
  const parentSessionPath = join(
    deltaSession.metadata.path,
    'parent_session.txt'
  );
  expect(existsSync(parentSessionPath)).toBe(true);

  // VERIFY: Parent session file contains correct ID
  const parentSessionContent = readFileSync(parentSessionPath, 'utf-8');
  expect(parentSessionContent.trim()).toBe(parentSessionId);

  // VERIFY: Delta session has old and new PRD
  expect(deltaSession.oldPRD).toBe(mockOldPRD);
  expect(deltaSession.newPRD).toBe(mockNewPRD);
});
```

## Setup/Execute/Verify Test Structure

### Basic Test Structure

```typescript
describe('Feature Integration Tests', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'feature-test-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('successful workflow', () => {
    it('should complete end-to-end successfully', async () => {
      // SETUP
      writeFileSync(prdPath, '# Test PRD\n\nTest content');

      // MOCK external dependencies
      vi.mocked(createAgent).mockReturnValue(mockAgent);

      // EXECUTE
      const result = await someWorkflow.run();

      // VERIFY
      expect(result.success).toBe(true);
      expect(existsSync(join(planDir, '001_abc123'))).toBe(true);
    });
  });
});
```

### Error Testing Pattern

```typescript
// From error-handling.test.ts
describe('Error Handling', () => {
  it('should handle invalid PRD gracefully', async () => {
    // SETUP: Create invalid PRD
    const invalidPRD = 'Not a valid PRD';
    writeFileSync(prdPath, invalidPRD);

    // EXECUTE & VERIFY: Should throw specific error
    await expect(() => manager.initialize()).rejects.toThrow(ValidationError);
  });
});
```

## Common Mock Patterns for Complex Objects

### Mock Agent Implementation

```typescript
// From prp-pipeline-integration.test.ts
const mockAgent = {
  prompt: vi.fn().mockResolvedValue({
    backlog: { backlog: [] },
    validationResults: [],
    artifacts: [],
    error: undefined,
    fixAttempts: 0,
  }),
};
```

### Mock Execution Result

```typescript
// From prp-runtime-integration.test.ts
const createMockExecutionResult = (success: boolean): ExecutionResult => ({
  success,
  validationResults: [
    {
      level: 1,
      description: 'Syntax check',
      success,
      command: 'npm run lint',
      stdout: 'All good',
      stderr: success ? '' : 'Lint errors found',
      exitCode: success ? 0 : 1,
      skipped: false,
    },
  ],
  artifacts: ['/src/agents/prp-runtime.ts'],
  error: success ? undefined : 'Validation failed',
  fixAttempts: 0,
});
```

### Mock Session Manager

```typescript
// From fix-cycle-workflow-integration.test.ts
const createMockSessionManager = (backlog?: Backlog): SessionManager =>
  ({
    currentSession: {
      metadata: {
        id: '001_test',
        hash: 'test123',
        path: 'plan/001_test',
        createdAt: new Date(),
        parentSession: null,
      },
      prdSnapshot: '# Test PRD',
      taskRegistry: backlog ?? { backlog: [] },
    },
  }) as any;
```

## Global Test Setup Patterns

### Environment Validation (from setup.ts)

```typescript
// API endpoint safeguard
const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';

function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // Block Anthropic's official API and all its variants
  if (BLOCKED_PATTERNS.some(pattern => baseUrl.includes(pattern))) {
    throw new Error('Tests are configured to use Anthropic API!');
  }
}

// Global hooks
beforeEach(() => {
  vi.clearAllMocks();
  validateApiEndpoint();
});

afterEach(() => {
  vi.unstubAllEnvs();
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

### Promise Rejection Tracking

```typescript
// From setup.ts
let unhandledRejections: unknown[] = [];

beforeEach(() => {
  unhandledRejections = [];
  unhandledRejectionHandler = (reason: unknown) => {
    unhandledRejections.push(reason);
  };
  process.on('unhandledRejection', unhandledRejectionHandler);
});

afterEach(() => {
  if (unhandledRejectionHandler) {
    process.removeListener('unhandledRejection', unhandledRejectionHandler);
  }

  if (unhandledRejections.length > 0) {
    throw new Error(
      `Test had ${unhandledRejections.length} unhandled promise rejection(s)`
    );
  }
});
```

## Test Organization Patterns

### Grouping by Concern

```typescript
describe('Session Directory Structure', () => {
  // Tests for naming pattern
  it('should create session directory with {sequence}_{hash} format', () => {
    /* ... */
  });

  // Tests for hash computation
  it('should compute SHA-256 hash and use first 12 characters', () => {
    /* ... */
  });

  // Tests for subdirectory creation
  it('should create architecture, prps, and artifacts subdirectories', () => {
    /* ... */
  });

  // Tests for file permissions
  it('should create directories with mode 0o755', () => {
    /* ... */
  });
});
```

### Nested Describe Blocks

```typescript
describe('PRPPipeline Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    /* setup */
  });
  afterEach(() => {
    /* cleanup */
  });

  describe('full run() workflow with new session', () => {
    it('should complete workflow successfully', () => {
      /* ... */
    });
  });

  describe('error handling scenarios', () => {
    it('should handle agent failure gracefully', () => {
      /* ... */
    });
    it('should handle file system errors', () => {
      /* ... */
    });
  });
});
```

## Common Gotchas in Integration Testing

### 1. Mock Cleanup Issues

```typescript
// PROBLEM: Mocks not cleared between tests
// SOLUTION: Always clear mocks in afterEach
afterEach(() => {
  vi.clearAllMocks(); // Clear all mock call histories
  vi.unstubAllEnvs(); // Restore environment variables
});
```

### 2. File Permission Issues

```typescript
// PROBLEM: Tests failing due to file permissions
// SOLUTION: Explicitly set file modes
writeFileSync(prdPath, content, { mode: 0o644 });
mkdirSync(dirPath, { mode: 0o755 });
```

### 3. Async Test Isolation

```typescript
// PROBLEM: Promise rejections not handled
// SOLUTION: Track and fail on unhandled rejections
let unhandledRejections: unknown[] = [];

beforeEach(() => {
  unhandledRejections = [];
  process.on('unhandledRejection', handler);
});

afterEach(() => {
  process.removeListener('unhandledRejection', handler);
  if (unhandledRejections.length > 0) {
    throw new Error('Unhandled promise rejections detected');
  }
});
```

### 4. Module Import Timing

```typescript
// PROBLEM: Mocks not applied due to import timing
// SOLUTION: Mock at module level before imports
vi.mock('some-module', () => ({
  someExport: vi.fn(),
}));

// Then import
import { someExport } from 'some-module';
```

### 5. Test Data Pollution

```typescript
// PROBLEM: Tests sharing state
// SOLUTION: Create fresh data for each test
it('should handle scenario A', () => {
  const testData = createFreshTestData(); // Not shared
});

it('should handle scenario B', () => {
  const testData = createFreshTestData(); // Fresh instance
});
```

### 6. Real LLM Accidents

```typescript
// PROBLEM: Accidental real API calls
// SOLUTION: Environment validation in global setup
function validateApiEndpoint() {
  const blocked = ['api.anthropic.com', 'anthropic.com'];
  if (blocked.some(p => process.env.ANTHROPIC_BASE_URL?.includes(p))) {
    throw new Error('Production API endpoint detected in tests!');
  }
}
```

## Performance Considerations

### Fast Test Setup Patterns

Use simple PRDs for quick tests as shown in `/home/dustin/projects/hacky-hack/tests/fixtures/simple-prd.ts`.

### Minimal Mocking Strategy

Only mock what's necessary to avoid performance overhead.

### Memory Management

Force garbage collection between tests in global setup.

## Reference Implementation for Delta Session Testing

Based on these patterns, here's how to structure delta session integration tests:

```typescript
/**
 * Integration tests for Delta Session workflow
 *
 * @remarks
 * Tests validate complete delta analysis workflow:
 * - PRD difference detection
 * - Task delta analysis
 * - Session preservation
 * - Delta-based task generation
 *
 * Mocks:
 * - Agent calls to avoid LLM dependencies
 * - File operations for controlled testing
 *
 * @see {@link ../../src/workflows/delta-analysis-workflow.ts}
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SessionManager } from '../../src/core/session-manager.js';
import { patchBacklog } from '../../src/core/task-patcher.js';
import {
  mockOldPRD,
  mockNewPRD,
  mockCompletedTaskIds,
} from '../fixtures/mock-delta-data.js';

describe('Delta Session Integration', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'delta-session-test-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('delta session creation', () => {
    it('should create delta session with parent linkage', async () => {
      // SETUP: Create initial session
      writeFileSync(prdPath, mockOldPRD, { mode: 0o644 });
      const manager = new SessionManager(prdPath, planDir);
      await manager.initialize();
      const parentSessionId = manager.currentSession.metadata.id;

      // MODIFY: Update PRD
      writeFileSync(prdPath, mockNewPRD, { mode: 0o644 });

      // EXECUTE: Create delta session
      const deltaSession = await manager.createDeltaSession(prdPath);

      // VERIFY: Delta session properties
      expect(deltaSession.metadata.id).not.toBe(parentSessionId);
      expect(deltaSession.metadata.parentSession).toBe(parentSessionId);

      // VERIFY: Parent session file
      const parentSessionPath = join(
        deltaSession.metadata.path,
        'parent_session.txt'
      );
      expect(existsSync(parentSessionPath)).toBe(true);
      const parentContent = readFileSync(parentSessionPath, 'utf-8');
      expect(parentContent.trim()).toBe(parentSessionId);

      // VERIFY: PRD snapshots
      expect(deltaSession.oldPRD).toBe(mockOldPRD);
      expect(deltaSession.newPRD).toBe(mockNewPRD);
    });
  });

  describe('task patching', () => {
    it('should mark tasks as modified/obsolete correctly', async () => {
      // SETUP: Create session with completed tasks
      writeFileSync(prdPath, mockOldPRD, { mode: 0o644 });
      const manager = new SessionManager(prdPath, planDir);
      await manager.initialize();

      // Create delta analysis
      const deltaAnalysis = {
        hasDelta: true,
        changes: [
          {
            type: 'modified',
            section: 'P1.M1.T1',
            impact: 'high',
            affectedTaskIds: ['P1.M1.T1'],
          },
        ],
        patchInstructions: 'Update task',
        affectedTaskIds: new Set(['P1.M1.T1']),
      };

      // EXECUTE: Patch backlog
      const patchedBacklog = patchBacklog(
        manager.currentSession.taskRegistry,
        deltaAnalysis
      );

      // VERIFY: Task marked as modified
      const task = findItem(patchedBacklog, 'P1.M1.T1');
      expect(task.status).toBe('Planned');
    });
  });
});
```
