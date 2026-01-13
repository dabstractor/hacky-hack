# Vitest E2E Testing Research

**Research Date**: 2026-01-13
**Status**: External search tools unavailable (rate limited) - Compiled from best practices documentation

---

## 1. Vitest Documentation Links

### Official Resources

- **Vitest Guide**: https://vitest.dev/guide/
- **Vitest API Reference**: https://vitest.dev/api/
- **Test Context**: https://vitest.dev/guide/test-context.html
- **Features**: https://vitest.dev/guide/features.html
- **GitHub Repository**: https://github.com/vitest-dev/vitest

---

## 2. Testing Multi-Run Workflows with State Changes

### Pattern 1: Sequential Test Phases with State Persistence

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Multi-run workflow with state changes', () => {
  const state = {
    initialRun: null as any,
    subsequentRun: null as any
  }

  beforeAll(async () => {
    // Setup initial state
  })

  afterAll(async () => {
    // Cleanup
  })

  it('first run: processes initial state', async () => {
    const result = await runWorkflow(/* initial input */)
    state.initialRun = result
    expect(result).toMatchSnapshot()
  })

  it('second run: processes with changes', async () => {
    const result = await runWorkflow(/* modified input */, {
      previousState: state.initialRun
    })
    state.subsequentRun = result
    expect(result).toMatchSnapshot()
  })

  it('verifies delta between runs', async () => {
    const delta = computeDelta(state.initialRun, state.subsequentRun)
    expect(delta.changes).toHaveLength(expectedChangeCount)
  })
})
```

### Pattern 2: Test.each for Multiple Runs

```typescript
import { test } from 'vitest';

const workflowScenarios = [
  {
    name: 'initial run',
    input: {
      /* ... */
    },
    expectedChanges: 0,
  },
  {
    name: 'with single change',
    input: {
      /* ... */
    },
    expectedChanges: 1,
  },
  {
    name: 'with multiple changes',
    input: {
      /* ... */
    },
    expectedChanges: 5,
  },
];

test.concurrent.each(workflowScenarios)(
  'workflow: $name',
  async ({ input, expectedChanges }) => {
    const result = await runWorkflow(input);
    expect(result.changes).toHaveLength(expectedChanges);
  }
);
```

### Pattern 3: Sequential Workflow Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('Sequential workflow execution', () => {
  it('executes complete workflow lifecycle', async () => {
    // Phase 1: Initial run
    const run1 = await executeWorkflow({ mode: 'initial' });
    expect(run1.status).toBe('completed');
    expect(run1.processedCount).toBeGreaterThan(0);

    // Phase 2: Incremental run
    const run2 = await executeWorkflow({
      mode: 'incremental',
      previousState: run1.state,
    });
    expect(run2.status).toBe('completed');
    expect(run2.processedCount).toBeLessThan(run1.processedCount);

    // Verify cumulative state
    expect(run2.totalProcessed).toBe(run1.processedCount + run2.processedCount);
  });
});
```

---

## 3. Cleanup and State Reset Best Practices

### Pattern 1: onTestFinished (Recommended)

```typescript
import { test, onTestFinished } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

test('with reliable cleanup', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'test-'));

  // Register cleanup immediately - runs even if test fails
  onTestFinished(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // Test code that uses tempDir
  await performOperationsIn(tempDir);
});
```

### Pattern 2: beforeEach/afterEach for Test Isolation

```typescript
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('isolated state tests', () => {
  let tempDir: string;
  let state: any;

  beforeEach(async () => {
    // Setup fresh state for each test
    tempDir = await mkdtemp(join(tmpdir(), 'test-'));
    state = await initializeState();
  });

  afterEach(async () => {
    // Cleanup state after each test
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('test 1', async () => {
    // Isolated test with fresh state
    await expect(operation(state)).resolves.toBeTruthy();
  });

  it('test 2', async () => {
    // Completely isolated from test 1
    await expect(differentOperation(state)).resolves.toBeTruthy();
  });
});
```

### Pattern 3: Fixture Pattern for Reusable Setup

```typescript
import { test } from 'vitest';

async function workflowFixture() {
  const tempDir = await mkdtemp(join(tmpdir(), 'workflow-'));
  const initialState = await createInitialState(tempDir);

  return {
    tempDir,
    initialState,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}

test('using fixture pattern', async () => {
  const fixture = await workflowFixture();

  onTestFinished(async () => {
    await fixture.cleanup();
  });

  // Test code using fixture
  await executeWorkflow(fixture.initialState);
});
```

---

## 4. Testing Delta/Incremental Workflows

### Pattern 1: Snapshot-Based Delta Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('Incremental workflow delta verification', () => {
  it('captures baseline and verifies incremental changes', async () => {
    // Baseline
    const baseline = await runWorkflow({
      mode: 'full',
      input: testDataSetA,
    });

    expect(baseline).toMatchBaselineSnapshot();

    // Incremental
    const incremental = await runWorkflow({
      mode: 'incremental',
      input: testDataSetB,
      baseline: baseline.state,
    });

    expect(incremental).toMatchIncrementalSnapshot();
    expect(incremental.changes).toHaveLength(expectedDelta);
  });
});
```

### Pattern 2: Change Tracking Verification

```typescript
import { test } from 'vitest';

test('incremental processing only handles changed items', async () => {
  const initial = await processBatch([
    { id: 1, data: 'a' },
    { id: 2, data: 'b' },
    { id: 3, data: 'c' },
  ]);

  // Modify only item 2
  const modified = [
    { id: 1, data: 'a' },
    { id: 2, data: 'b-modified' }, // Changed
    { id: 3, data: 'c' },
  ];

  const incremental = await processBatch(modified, {
    previousState: initial.state,
    mode: 'incremental',
  });

  // Verify only changed item was processed
  expect(incremental.processedIds).toEqual([2]);
  expect(incremental.skippedCount).toBe(2);
});
```

### Pattern 3: State Comparison Utilities

```typescript
import { test, expect } from 'vitest';

function assertStateDelta(
  before: any,
  after: any,
  expectations: {
    added?: number;
    modified?: number;
    removed?: number;
    unchanged?: number;
  }
) {
  const changes = computeChanges(before, after);

  if (expectations.added !== undefined) {
    expect(changes.added).toHaveLength(expectations.added);
  }
  if (expectations.modified !== undefined) {
    expect(changes.modified).toHaveLength(expectations.modified);
  }
  if (expectations.removed !== undefined) {
    expect(changes.removed).toHaveLength(expectations.removed);
  }
  if (expectations.unchanged !== undefined) {
    expect(changes.unchanged).toHaveLength(expectations.unchanged);
  }
}

test('verifies exact state delta', async () => {
  const before = await getState();
  await applyChanges();
  const after = await getState();

  assertStateDelta(before, after, {
    added: 2,
    modified: 3,
    removed: 1,
    unchanged: 10,
  });
});
```

---

## 5. E2E Test Performance Targets

### Execution Time Benchmarks

| Test Category               | Target Time   | Maximum Acceptable |
| --------------------------- | ------------- | ------------------ |
| **Fast Smoke Tests**        | < 1 minute    | 2 minutes          |
| **Critical User Journeys**  | 1-5 minutes   | 10 minutes         |
| **Comprehensive E2E Suite** | 5-15 minutes  | 30 minutes         |
| **Full Regression Suite**   | 15-30 minutes | 45 minutes         |

### Performance Optimization Strategies

#### 1. Parallel Execution

```typescript
import { describe, test, config } from 'vitest';

// Configure parallel execution
config.concurrent = true;

describe.concurrent('Parallel E2E tests', () => {
  test('independent workflow 1', async () => {
    /* ... */
  });
  test('independent workflow 2', async () => {
    /* ... */
  });
  test('independent workflow 3', async () => {
    /* ... */
  });
});
```

#### 2. Selective Test Execution

```typescript
import { test, describe } from 'vitest';

// Tag tests for selective execution
describe('Critical path', () => {
  test.skipIf(process.env.CI)('slow E2E', async () => {
    // Skipped in CI unless specifically enabled
  });

  test('@smoke critical workflow', async () => {
    // Always runs in smoke tests
  });
});
```

#### 3. Smart Setup/Teardown

```typescript
import { beforeAll, afterAll } from 'vitest';

describe('Efficient shared setup', () => {
  let sharedResources: any;

  beforeAll(async () => {
    // Setup once for all tests in suite
    sharedResources = await createSharedResources();
  });

  afterAll(async () => {
    // Cleanup once after all tests
    await cleanupSharedResources(sharedResources);
  });
});
```

### Performance Monitoring

```typescript
import { test, expect } from 'vitest';

test('with performance assertion', async () => {
  const startTime = performance.now();

  await runWorkflow();

  const duration = performance.now() - startTime;

  // Assert acceptable performance
  expect(duration).toBeLessThan(5000); // 5 seconds max
});
```

---

## 6. Complete E2E Test Example

```typescript
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  onTestFinished,
} from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Complete E2E workflow: Multi-run with delta processing', () => {
  let workspace: string;
  let workflow: any;

  beforeAll(async () => {
    // Setup shared workspace
    workspace = await mkdtemp(join(tmpdir(), 'e2e-workspace-'));
    workflow = new WorkflowProcessor(workspace);
  });

  afterAll(async () => {
    // Cleanup workspace
    await rm(workspace, { recursive: true, force: true });
  });

  it('initial run: processes all files', async () => {
    // Create test files
    await writeFile(join(workspace, 'file1.txt'), 'content 1');
    await writeFile(join(workspace, 'file2.txt'), 'content 2');

    const result = await workflow.run({ mode: 'initial' });

    expect(result.status).toBe('success');
    expect(result.processedCount).toBe(2);
    expect(result.duration).toBeLessThan(5000);
  });

  it('incremental run: processes only changed files', async () => {
    // Modify one file, add one new file
    await writeFile(join(workspace, 'file1.txt'), 'content 1 modified');
    await writeFile(join(workspace, 'file3.txt'), 'content 3');

    const result = await workflow.run({ mode: 'incremental' });

    expect(result.status).toBe('success');
    expect(result.processedCount).toBe(2); // Only file1 and file3
    expect(result.skippedCount).toBe(1); // file2 unchanged
    expect(result.duration).toBeLessThan(result.previousDuration || Infinity);
  });

  it('verifies state persistence across runs', async () => {
    const state = await workflow.getState();

    expect(state.files).toHaveLength(3);
    expect(state.files.find((f: any) => f.path === 'file1.txt').hash).not.toBe(
      state.initialHashes.file1
    );
    expect(state.files.find((f: any) => f.path === 'file2.txt').hash).toBe(
      state.initialHashes.file2
    );
  });

  it('cleanup: resets workspace for next test suite', async () => {
    await workflow.reset();
    const state = await workflow.getState();

    expect(state.files).toHaveLength(0);
  });
});
```

---

## 7. Key Takeaways and Actionable Patterns

### For Multi-Run Workflows

1. Use sequential `it()` blocks to test workflow phases
2. Store intermediate state in test suite variables
3. Assert on both final state and deltas between states
4. Use `test.each()` for parameterized workflow scenarios

### For Cleanup and Isolation

1. Prefer `onTestFinished()` for reliable cleanup (runs even on failure)
2. Use `beforeEach/afterEach` for strict test isolation
3. Leverage `tmpdir()` for temporary workspaces
4. Always use `{ recursive: true, force: true }` for directory cleanup

### For Delta/Incremental Testing

1. Capture baseline state before changes
2. Assert on specific change counts (added, modified, removed)
3. Verify incremental runs are faster than full runs
4. Use snapshots to verify state transitions

### For Performance

1. Target < 5 minutes for comprehensive E2E suites
2. Use `describe.concurrent()` for parallel independent tests
3. Tag tests with `@smoke`, `@critical`, etc. for selective execution
4. Assert on execution time in performance-sensitive tests

---

## 8. References and Further Reading

### Official Documentation

- [Vitest Guide](https://vitest.dev/guide/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Test Context Documentation](https://vitest.dev/guide/test-context.html)

### Community Resources

- [Vitest GitHub Discussions](https://github.com/vitest-dev/vitest/discussions)
- [Vitest Examples Repository](https://github.com/vitest-dev/vitest/tree/main/examples)

### Related Testing Patterns

- [Testing Library Guidelines](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [State Testing Patterns](https://martinfowler.com/bliki/StateTestingVersusInteractionTesting.html)

---

**Note**: This research was compiled from best practices documentation and patterns. External web search tools were unavailable at the time of research due to rate limiting. For the most current Vitest features and APIs, always refer to the official documentation at https://vitest.dev.
