# Integration Test Patterns in Hacky-Hack Codebase

## Test Directory Structure

```
tests/
├── unit/                           # Pure unit tests with mocks
│   └── core/
│       ├── task-orchestrator.test.ts
│       ├── task-utils.test.ts
│       └── task-traversal.test.ts
└── integration/                    # Real filesystem, multi-component tests
    ├── core/
    │   ├── delta-session.test.ts
    │   ├── session-manager.test.ts
    │   ├── task-orchestrator*.test.ts
    ├── workflows/
    │   ├── prp-pipeline*.test.ts
    │   ├── bug-hunt-workflow.test.ts
    │   └── fix-cycle-workflow.test.ts
    ├── agents/
    │   ├── agents.test.ts
    │   ├── architect-agent.test.ts
    │   └── prp-*.test.ts
    └── groundswell/               # Groundswell integration tests
```

## Key Differences: Unit vs Integration Tests

### Unit Tests

- **Location**: `tests/unit/`
- **Characteristics**:
  - Pure unit testing with extensive mocks
  - No filesystem operations
  - Fast execution
  - Single function/component tests
- **Example**: `tests/unit/core/task-patcher.test.ts`
  - Tests `patchBacklog` function in isolation
  - Uses `vi.mock()` extensively

### Integration Tests

- **Location**: `tests/integration/`
- **Characteristics**:
  - Real filesystem operations (temp directories)
  - Real component interactions
  - End-to-end workflows
  - Slower execution
- **Example**: `tests/integration/core/delta-session.test.ts`
  - Tests SessionManager with actual file operations
  - Multiple components working together

## Common Integration Test Patterns

### Setup Pattern with Temp Directories

```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import tmpdir from 'node:os';

describe('Integration Test', () => {
  let tempDir: string;
  let prdPath: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'test-name-'));
    prdPath = join(tempDir, 'PRD.md');
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });
});
```

### Test Structure Pattern

```typescript
describe('Component Integration Tests', () => {
  it('should complete workflow end-to-end', async () => {
    // SETUP: Create test environment and mock dependencies
    const orchestrator = new TaskOrchestrator(sessionManager);
    const task = createTestTask('P1.M1.T1', 'Test Task');

    // EXECUTE: Run the actual workflow
    await orchestrator.executeTask(task);

    // VERIFY: Check results using real assertions
    expect(task.status).toBe('Complete');
    expect(sessionManager.updateItemStatus).toHaveBeenCalled();
  });
});
```

## Concurrent/Async Operations Testing

### ResearchQueue Testing Pattern

**File**: `tests/integration/core/task-orchestrator-runtime.test.ts`

Tests ResearchQueue with:

- Concurrency limit of 3 (default)
- Background PRP generation
- Queue statistics tracking
- Cache hit/miss behavior

```typescript
describe('ResearchQueue Integration', () => {
  it('should handle concurrent research at limit', async () => {
    const orchestrator = new TaskOrchestrator(sessionManager);

    // Enqueue multiple tasks
    const tasks = [
      createTestTask('P1.M1.T1', 'Task 1'),
      createTestTask('P1.M1.T2', 'Task 2'),
      createTestTask('P1.M1.T3', 'Task 3'),
      createTestTask('P1.M1.T4', 'Task 4'),
    ];

    // Verify queue respects concurrency limit
    for (const task of tasks) {
      await orchestrator.researchQueue.enqueue(task, backlog);
    }

    const stats = orchestrator.researchQueue.getStats();
    expect(stats.researching).toBeLessThanOrEqual(3);
  });
});
```

### Mock Pattern for PRP Generator

```typescript
vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue(mockPRPDocument),
    getCachePath: vi.fn(),
    getCacheMetadataPath: vi.fn(),
  })),
}));
```

## Test Utilities and Helpers

### Test Fixtures (`tests/fixtures/`)

**`simple-prd.ts`**: Minimal PRD for fast E2E testing
**`simple-prd-v2.ts`**: Modified version for delta session tests
**`mock-delta-data.ts`**: Mock data for delta analysis

### Global Setup (`tests/setup.ts`)

```typescript
import { beforeEach } from 'vitest';

beforeEach(() => {
  // Environment validation
  // Mock cleanup
  vi.clearAllMocks();

  // Promise rejection tracking
  process.on('unhandledRejection', reason => {
    console.error('Unhandled Rejection:', reason);
  });

  // Memory management
  if (global.gc) {
    global.gc();
  }
});
```

## Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          statements: 100, // Requires 100% coverage
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
```

## Multi-Component Integration Examples

### PRPPipeline Integration

**File**: `tests/integration/prp-pipeline-integration.test.ts`

```typescript
it('should complete workflow successfully for new session', async () => {
  // SETUP: Mock agents and file system
  const mockAgent = {
    prompt: vi.fn().mockResolvedValue({ backlog: { backlog: [] } }),
  };

  // EXECUTE: Run actual pipeline
  const pipeline = new PRPPipeline(
    prdPath,
    undefined,
    undefined,
    false,
    false,
    undefined,
    undefined,
    planDir
  );
  const result = await pipeline.run();

  // VERIFY: Check all aspects of the result
  expect(result.success).toBe(true);
  expect(result.sessionPath).toContain(planDir);
  expect(result.totalTasks).toBe(0);
  expect(result.completedTasks).toBe(0);
  expect(result.failedTasks).toBe(0);
  expect(result.finalPhase).toBe('qa_complete');
});
```

### Delta Session Integration

**File**: `tests/integration/core/delta-session.test.ts`

Tests:

- Complete delta session workflow
- Real file system operations
- Session linkage
- Task patching

```typescript
it('should create delta session with proper linkage', async () => {
  // Create parent session
  const parentSession = await SessionManager.create(prdPath, planDir);

  // Modify PRD
  fs.writeFileSync(prdPath, modifiedPRD);

  // Create delta session
  const deltaSession = await SessionManager.createDelta(parentSession);

  // Verify linkage
  expect(deltaSession.metadata.parentHash).toBe(parentSession.metadata.hash);
  expect(deltaSession.prdSnapshot).toBeDefined();
});
```

## Key Integration Testing Principles

1. **Use Real Filesystem Operations**: Temp directories for isolated testing
2. **Mock External Dependencies**: LLM calls, git operations, network
3. **Test End-to-End Workflows**: Multiple components working together
4. **Assert Real Outcomes**: Check actual file creation, status updates
5. **Isolate Tests**: Clean up after each test
6. **Use Test Contracts**: Document expected behavior with clear test names
7. **Track Coverage**: 100% coverage required

## Queue and Concurrent Operation Patterns

The codebase implements sophisticated queuing:

- **ResearchQueue**: Parallel PRP generation with concurrency limit (default: 3)
- **ExecutionQueue**: Task execution order with scope filtering
- **"Research Ahead"**: PRPs generated before needed, controlled concurrency

## For This Work Item

Based on existing patterns, the integration test for ResearchQueue should:

1. **Use temp directories** for session state
2. **Mock PRPGenerator** to control timing and simulate errors
3. **Test real queue behavior** (not mocked)
4. **Verify concurrency limit** is enforced
5. **Test error handling** (fire-and-forget pattern)
6. **Test cache behavior** (deduplication)
7. **Verify queue statistics** match expected state
8. **Test background processing** completes correctly

## Example Test Structure

```typescript
describe('ResearchQueue Integration Tests', () => {
  let tempDir: string;
  let sessionManager: SessionManager;
  let mockPRPGenerator: any;
  let queue: ResearchQueue;

  beforeEach(async () => {
    // Setup temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'research-queue-'));

    // Setup mocks
    mockPRPGenerator = {
      generate: vi.fn(),
    };

    // Create real session manager and queue
    sessionManager = await SessionManager.create(prdPath, tempDir);
    queue = new ResearchQueue(sessionManager, 3, false);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('should process tasks up to concurrency limit', async () => {
    // Test implementation
  });
});
```
