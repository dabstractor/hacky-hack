# Integration Test Patterns Research

## Testing Framework

### Framework: Vitest

- **Version**: 1.6.1
- **Config**: `vitest.config.ts`
- **Global Setup**: `tests/setup.ts`

### Assertion Patterns

```typescript
// Common assertions
expect(value).toBe(expected); // Strict equality
expect(value).toEqual(expected); // Deep equality
expect(value).toBeDefined(); // Check if defined
expect(value).toContain(substring); // String/array contains
expect(object).toHaveProperty(property); // Object has property
expect(array).toContainEqual(item); // Array contains item
expect(promise).resolves.toBe(value); // Async resolving
expect(promise).rejects.toThrow(error); // Async rejection
```

### Mock Patterns

```typescript
// Basic function mock
const mockFunction = vi.fn().mockReturnValue(value);

// Async mock
const mockAsync = vi.fn().mockResolvedValue(value);
const mockAsync = vi.fn().mockRejectedValue(error);

// Module mock with actual implementation
vi.mock('module', async () => {
  const actual = await vi.importActual('module');
  return { ...actual, mockedFunction: vi.fn() };
});

// Spy on existing methods
vi.spyOn(object, 'method').mockImplementation(async () => {
  // Custom behavior
});

// Clear mocks
vi.clearAllMocks();
vi.unstubAllEnvs();
```

## Test File Structure

### Common Structure

```typescript
describe('Test Suite Description', () => {
  let tempDir: string;
  let prdPath: string;
  let sessionManager: SessionManager;

  beforeEach(async () => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Specific Test Area', () => {
    it('should execute specific behavior', async () => {
      // SETUP
      // EXECUTE
      // VERIFY
    });
  });
});
```

### Test File Naming

- **Pattern**: `*.test.ts` files
- **Location**: `tests/` directory
- **Structure**:
  - `tests/unit/` - Unit tests
  - `tests/integration/` - Integration tests
  - `tests/e2e/` - End-to-end tests

## Existing Integration Test Files

### Pipeline Integration Tests

| File                                                       | Purpose                         |
| ---------------------------------------------------------- | ------------------------------- |
| `tests/integration/prp-pipeline-integration.test.ts`       | End-to-end pipeline testing     |
| `tests/integration/prp-pipeline-shutdown.test.ts`          | Graceful shutdown testing       |
| `tests/integration/core/task-orchestrator.test.ts`         | Orchestrator testing            |
| `tests/integration/core/task-orchestrator-runtime.test.ts` | Runtime orchestrator testing    |
| `tests/integration/core/task-orchestrator-e2e.test.ts`     | End-to-end orchestrator testing |

## Mock Setup Patterns

### Mock Agent Factory

```typescript
// Mock agent factory to avoid LLM calls
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));
```

### Mock PRPRuntime

```typescript
// Mock PRPRuntime for controlled execution
vi.mock('../../../src/agents/prp-runtime.js', () => ({
  PRPRuntime: vi.fn().mockImplementation(() => ({
    executeSubtask: vi.fn().mockResolvedValue({
      success: true,
      validationResults: [
        {
          level: 'Gate 1: Compilation',
          passed: true,
          details: 'Code compiles successfully',
        },
      ],
      artifacts: [],
      error: undefined,
      fixAttempts: 0,
    }),
  })),
}));
```

### Mock Git Operations

```typescript
// Mock git-commit module
vi.mock('../../../src/utils/git-commit.js', () => ({
  smartCommit: vi.fn().mockResolvedValue('abc123'),
  filterProtectedFiles: vi.fn((files: string[]) => files),
  formatCommitMessage: vi.fn((msg: string) => msg),
}));
```

### Mock File System

```typescript
// Mock fs/promises for file reading
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn((path: string) => {
      if (path.includes('tasks.json')) {
        return actual.readFile(path, 'utf-8');
      }
      return actual.readFile(path, 'utf-8');
    }),
  };
});
```

## Session State Mocking Patterns

### Create Mock Session State

```typescript
function createSessionState(backlog: Backlog, planDir: string) {
  const { createHash } = require('node:crypto');
  const hash = createHash('sha256')
    .update(JSON.stringify(backlog))
    .digest('hex');
  return {
    metadata: {
      id: `001_${hash.substring(0, 12)}`,
      hash: hash.substring(0, 12),
      path: join(planDir, `001_${hash.substring(0, 12)}`),
      createdAt: new Date(),
      parentSession: null,
    },
    prdSnapshot: mockSimplePRD,
    taskRegistry: backlog,
    currentItemId: null,
  };
}
```

### Environment Setup

```typescript
function setupTestEnvironment(): {
  tempDir: string;
  prdPath: string;
  sessionManager: SessionManager;
} {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  const planDir = join(tempDir, 'plan');
  const prdPath = join(tempDir, 'PRD.md');

  // Create directories
  for (const dir of [
    sessionDir,
    join(sessionDir, 'architecture'),
    join(sessionDir, 'prps'),
    join(sessionDir, 'artifacts'),
  ]) {
    mkdirSync(dir, { recursive: true });
  }

  // Write files
  writeFileSync(prdPath, mockSimplePRD);
  writeFileSync(
    join(sessionPath, 'tasks.json'),
    JSON.stringify({ backlog: backlog.backlog }, null, 2)
  );
  writeFileSync(join(sessionPath, 'prd_snapshot.md'), mockSimplePRD);
  writeFileSync(join(sessionPath, 'delta_from.txt'), '');

  return { tempDir, prdPath, sessionManager };
}
```

## Progress Tracking Testing Patterns

### Task Count Verification

```typescript
// From prp-pipeline-integration.test.ts
expect(result.totalTasks).toBe(1);
expect(result.completedTasks).toBe(1);
expect(result.failedTasks).toBe(0);
```

### Status Progression Tracking

```typescript
// From task-orchestrator-runtime.test.ts
const statuses: string[] = [];
const originalUpdateStatus =
  sessionManager.updateItemStatus.bind(sessionManager);
vi.spyOn(sessionManager, 'updateItemStatus').mockImplementation(
  async (id, status) => {
    statuses.push(status);
    return originalUpdateStatus(id, status);
  }
);

// Verify status transitions
expect(statuses).toContain('Researching');
expect(statuses).toContain('Implementing');
expect(statuses).toContain('Complete');
```

### PipelineResult Verification

```typescript
// From prp-pipeline-integration.test.ts
expect(result.finalPhase).toBe('qa_complete');
expect(result.duration).toBeGreaterThan(0);
expect(result.bugsFound).toBe(0);
```

## Execution Loop Testing Patterns

### Main ProcessNextItem Loop

```typescript
// From task-orchestrator-e2e.test.ts
let hasMore = true;
while (hasMore) {
  hasMore = await orchestrator.processNextItem();
  if (orchestrator.currentItemId) {
    processedIds.push(orchestrator.currentItemId);
  }
}
```

### Current Item ID Tracking

```typescript
// From task-orchestrator-e2e.test.ts
expect(orchestrator.currentItemId).toBeNull();

const hasMore = await orchestrator.processNextItem();
expect(hasMore).toBe(true);
expect(orchestrator.currentItemId).not.toBeNull();
```

### Queue Management Testing

```typescript
// From task-orchestrator.test.ts
const orchestrator = new TaskOrchestrator(sessionManager);
const queue = orchestrator.executionQueue;
expect(queue.length).toBe(4);
expect(queue.every(item => item.type === 'Subtask')).toBe(true);
```

## Shutdown Testing Patterns

### Mocking processNextItem for Shutdown

```typescript
// From prp-pipeline-shutdown.test.ts
let callCount = 0;
const mockOrchestrator: any = {
  sessionManager: {},
  processNextItem: vi.fn().mockImplementation(async () => {
    callCount++;
    // After first task completes, set shutdown flag
    if (callCount === 1) {
      (pipeline as any).shutdownRequested = true;
      (pipeline as any).shutdownReason = 'SIGINT';
    }
    // Return false after second call to simulate queue empty
    return callCount <= 1;
  }),
};
(pipeline as any).taskOrchestrator = mockOrchestrator;
```

### Shutdown Result Verification

```typescript
// From prp-pipeline-shutdown.test.ts
expect(pipeline.shutdownRequested).toBe(true);
expect(pipeline.shutdownReason).toBe('SIGINT');
expect(pipeline.currentPhase).toBe('shutdown_interrupted');
expect(result.shutdownInterrupted).toBe(true);
expect(result.shutdownReason).toBe('SIGINT');
```

## Temporary Directory Management

```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'test-prefix-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});
```

## CLI Commands

```bash
# Run tests
npm test
vitest

# Run tests once
npm run test:run
vitest run

# Run with coverage
npm run test:coverage
vitest run --coverage

# Stop on first failure
npm run test:bail
vitest run --bail=1

# Run specific test file
npx vitest run tests/integration/pipeline-main-loop.test.ts
```

## Sources

- **Vitest Documentation**: https://vitest.dev/
- **Project vitest.config.ts**: `/home/dustin/projects/hacky-hack/vitest.config.ts`
- **Project tests/setup.ts**: `/home/dustin/projects/hacky-hack/tests/setup.ts`
- **Pipeline Integration Test**: `/home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-integration.test.ts`
- **Pipeline Shutdown Test**: `/home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-shutdown.test.ts`
- **Task Orchestrator Test**: `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.ts`
- **Task Orchestrator Runtime Test**: `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-runtime.test.ts`
- **Task Orchestrator E2E Test**: `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-e2e.test.ts`
