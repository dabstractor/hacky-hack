# Research Report: PRP Pipeline Testing Patterns

## Test Framework

**Framework**: Vitest
**Config**: `vitest.config.ts`
**Environment**: Node.js
**Coverage**: v8 with 100% coverage thresholds

### Test Scripts

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage report
npm run test:bail     # Bail on first failure
```

## Test Files

### Unit Tests

1. **`tests/unit/workflows/prp-pipeline.test.ts`** (1,184 lines)
   - Main unit tests for PRPPipeline class
   - Tests for all pipeline phases and error handling

2. **`tests/unit/workflows/prp-pipeline-progress.test.ts`** (803 lines)
   - Progress tracker integration tests
   - Task completion tracking verification

3. **`tests/unit/workflows/fix-cycle-workflow.test.ts`** (940 lines)
   - FixCycleWorkflow unit tests
   - Bug fix iteration logic tests

### Integration Tests

4. **`tests/integration/prp-pipeline-integration.test.ts`** (613 lines)
   - End-to-end PRPPipeline workflow tests
   - Real SessionManager and TaskOrchestrator (agents mocked)

5. **`tests/integration/fix-cycle-workflow-integration.test.ts`** (658 lines)
   - FixCycleWorkflow integration tests
   - Full workflow orchestration testing

## Mocking Patterns for FixCycleWorkflow

### Pattern 1: Vitest vi.mock() Constructor Mocking

```typescript
// Mock FixCycleWorkflow at module level
vi.mock('../../../src/workflows/fix-cycle-workflow.js', () => ({
  FixCycleWorkflow: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({
      hasBugs: false,
      bugs: [],
      summary: 'All bugs fixed',
      recommendations: [],
    }),
  })),
}));
```

### Pattern 2: Instance Method Mocking

```typescript
// Create mock instance with specific return values
const mockFixCycleWorkflow = {
  run: vi.fn().mockResolvedValue({
    hasBugs: true,
    bugs: [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Repro')],
    summary: 'Bugs found',
    recommendations: ['Fix the bug'],
  }),
};

MockFixCycleWorkflow.mockImplementation(() => mockFixCycleWorkflow);
```

### Pattern 3: Sequential Mock Returns

```typescript
const mockBugHuntInstance = {
  run: vi
    .fn()
    .mockResolvedValueOnce(
      createTestResults(true, [bug1, bug2], 'Found 2 bugs', [])
    )
    .mockResolvedValueOnce(createTestResults(false, [], 'All bugs fixed', [])),
};

mockBugHuntWorkflow.mockImplementation(() => mockBugHuntInstance);
```

## Session Path Test Patterns

### Pattern 1: Constructor Validation (Old Pattern)

```typescript
// OLD PATTERN: Constructor accepted TestResults object
const workflow = new FixCycleWorkflow(
  initialResults, // TestResults object
  '# Test PRD',
  mockOrchestrator,
  sessionManager
);
```

### Pattern 2: Session Path String (New Pattern)

```typescript
// NEW PATTERN: Constructor accepts sessionPath string
const workflow = new FixCycleWorkflow(
  'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918', // sessionPath
  '# Test PRD',
  mockOrchestrator,
  sessionManager
);
```

### Pattern 3: Session Path Mocking for File Operations

```typescript
// Mock file system operations for loadBugReport
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
  constants: { F_OK: 0 },
}));

const mockedAccess = access as ReturnType<typeof vi.fn>;
const mockedReadFile = readFile as ReturnType<typeof vi.fn>;

// Setup: Mock file exists
mockedAccess.mockResolvedValue(undefined);

// Setup: Mock file content
mockedReadFile.mockResolvedValue(JSON.stringify(testResults));

// Verify: File was accessed correctly
expect(mockedAccess).toHaveBeenCalledWith(
  resolve(sessionPath, 'TEST_RESULTS.md'),
  constants.F_OK
);
expect(mockedReadFile).toHaveBeenCalledWith(
  resolve(sessionPath, 'TEST_RESULTS.md'),
  'utf-8'
);
```

## Workflow Execution Order Verification

### Pattern 1: Spy on Step Methods

```typescript
// Spy on all workflow steps
const initSpy = vi.spyOn(pipeline, 'initializeSession');
const decomposeSpy = vi.spyOn(pipeline, 'decomposePRD');
const executeSpy = vi.spyOn(pipeline, 'executeBacklog');
const qaSpy = vi.spyOn(pipeline, 'runQACycle');

// Execute
await pipeline.run();

// Verify order
expect(initSpy).toHaveBeenCalled();
expect(decomposeSpy).toHaveBeenCalled();
expect(executeSpy).toHaveBeenCalled();
expect(qaSpy).toHaveBeenCalled();
```

### Pattern 2: Phase Transition Verification

```typescript
// Execute workflow
await pipeline.run();

// Verify final phase
expect(pipeline.currentPhase).toBe('shutdown_complete');

// Verify intermediate phases
expect(pipeline.currentPhase).toBe('session_initialized');
await pipeline.decomposePRD();
expect(pipeline.currentPhase).toBe('prd_decomposed');
```

## Test Patterns for runQACycle Method

### Mode-Based Decision Testing

```typescript
describe('runQACycle', () => {
  it('should skip QA in validate mode', async () => {
    const pipeline = new PRPPipeline('./test.md');
    pipeline.mode = 'validate';

    await pipeline.runQACycle();

    expect(pipeline.currentPhase).toBe('qa_skipped');
  });

  it('should run QA in bug-hunt mode regardless of task status', async () => {
    const pipeline = new PRPPipeline('./test.md');
    pipeline.mode = 'bug-hunt';
    pipeline.totalTasks = 0;

    await pipeline.runQACycle();

    expect(pipeline.currentPhase).toBe('qa_complete');
  });
});
```

### Bug Hunt and Fix Cycle Integration

```typescript
it('should run FixCycleWorkflow when bugs are found', async () => {
  // SETUP
  const backlog = createTestBacklog([...]);
  const mockSession = createTestSession(backlog);
  const mockManager = createMockSessionManager(mockSession);

  // Mock BugHuntWorkflow to return bugs
  const mockBugHuntWorkflow = {
    run: vi.fn().mockResolvedValue({
      hasBugs: true,
      bugs: [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Repro')],
      summary: 'Found bugs',
      recommendations: [],
    }),
  };

  // Mock FixCycleWorkflow
  const mockFixCycleWorkflow = {
    run: vi.fn().mockResolvedValue({
      hasBugs: false,
      bugs: [],
      summary: 'All bugs fixed',
      recommendations: [],
    }),
  };

  const pipeline = new PRPPipeline('./test.md');
  (pipeline as any).sessionManager = mockManager;

  // EXECUTE
  await pipeline.runQACycle();

  // VERIFY - FixCycleWorkflow should be called
  expect(MockFixCycleWorkflow).toHaveBeenCalledWith(
    expect.any(Object), // testResults (OLD)
    expect.any(String), // prdContent
    pipeline.taskOrchestrator,
    mockSession
  );
});
```

## Test Fixture Patterns

### Factory Functions

```typescript
const createTestBug = (
  id: string,
  severity: 'critical' | 'major' | 'minor' | 'cosmetic',
  title: string,
  description: string,
  reproduction: string,
  location?: string
): Bug => ({
  id,
  severity,
  title,
  description,
  reproduction,
  location,
});

const createTestResults = (
  hasBugs: boolean,
  bugs: Bug[],
  summary: string,
  recommendations: string[]
): TestResults => ({
  hasBugs,
  bugs,
  summary,
  recommendations,
});

const createMockTaskOrchestrator = (): TaskOrchestrator =>
  ({
    executeSubtask: vi.fn().mockResolvedValue(undefined),
  }) as any;

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
      currentItemId: null,
    },
    updateItemStatus: vi.fn().mockResolvedValue(undefined),
  }) as any;
```

### Setup/Execute/Verify Pattern

```typescript
describe('FixCycleWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something specific', async () => {
    // SETUP: Create test data
    const testResults = createTestResults(true, [bug1, bug2], 'Found bugs', []);

    // EXECUTE: Run method under test
    const workflow = new FixCycleWorkflow(
      sessionPath,
      prdContent,
      orchestrator,
      sessionManager
    );
    await workflow.run();

    // VERIFY: Check expectations
    expect(workflow.iteration).toBe(1);
    expect(orchestrator.executeSubtask).toHaveBeenCalledTimes(2);
  });
});
```

## Key Testing Insights

1. **100% Coverage Requirement**: All tests must achieve 100% code coverage
2. **Mock Strategy**:
   - Unit tests mock ALL dependencies
   - Integration tests use real SessionManager/TaskOrchestrator but mock agents
3. **Test Organization**:
   - `describe` blocks group related tests
   - `beforeEach` for clean test state
   - Clear SETUP/EXECUTE/VERIFY comments
4. **Error Handling Tests**:
   - Test fatal vs non-fatal errors
   - Test individual task failures vs pipeline failures
5. **State Verification**:
   - Check `currentPhase` transitions
   - Verify task counts
   - Check workflow status
6. **File I/O Testing**:
   - Mock `node:fs/promises` for file operations
   - Test error conditions (file not found, invalid JSON, validation failures)

## Test-Only Getters

```typescript
// FixCycleWorkflow exposes test-only getters
class FixCycleWorkflow {
  get _fixTasksForTesting(): Subtask[] {
    return this.#fixTasks;
  }

  get _loadBugReportForTesting(): () => Promise<TestResults> {
    const loadAndStore = async (): Promise<TestResults> => {
      const results = await this.#loadBugReport();
      this.#testResults = results;
      return results;
    };
    return loadAndStore.bind(this);
  }
}

// Use in test
await workflow._loadBugReportForTesting();
const fixTasks = workflow._fixTasksForTesting;
expect(fixTasks).toHaveLength(2);
```

## References

- Test Config: `vitest.config.ts`
- PRP Pipeline Tests: `tests/unit/workflows/prp-pipeline.test.ts`
- FixCycleWorkflow Tests: `tests/unit/workflows/fix-cycle-workflow.test.ts`
- Integration Tests: `tests/integration/prp-pipeline-integration.test.ts`
