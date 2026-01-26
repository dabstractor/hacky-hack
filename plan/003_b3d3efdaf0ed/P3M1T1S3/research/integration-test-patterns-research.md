# Integration Test Patterns Research

## Existing Integration Test Structure

**Directory:** `/home/dustin/projects/hacky-hack/tests/integration/`

**Key Files:**

- `inspect-command.test.ts` - Tests for `inspect` subcommand
- `artifacts-command.test.ts` - Tests for `artifacts` subcommand
- `prd-task-command.test.ts` - Tests for `prd task` command

## Test Setup Pattern

```typescript
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

// Mock logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Mock node:fs module
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    mkdtempSync: vi.fn(() => '/tmp/test-XXXXXX'),
  };
});
```

## Test Structure Pattern

```typescript
describe('Feature Name Integration Tests', () => {
  let tempDir: string;
  let sessionManager: SessionManager;
  let originalArgv: string[];
  let originalExit: any;

  beforeEach(() => {
    // Setup temp directory
    tempDir = mkdtempSync('/tmp/test-XXXXXX');

    // Setup original process.argv and process.exit
    originalArgv = process.argv;
    originalExit = process.exit;

    // Mock process.exit to capture exit calls
    const mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;
  });

  afterEach(() => {
    // Restore original process.argv and process.exit
    process.argv = originalArgv;
    process.exit = originalExit;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('specific feature', () => {
    it('should do something specific', async () => {
      // SETUP: Arrange test data
      // EXECUTE: Run the code being tested
      // VERIFY: Assert expected outcomes
    });
  });
});
```

## Fixture Helper Functions Pattern

```typescript
const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  story_points: number = 1
): Subtask => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points,
  dependencies: [],
  context_scope: 'Test scope',
});

const createTestTask = (
  id: string,
  title: string,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task' as const,
  title,
  status: 'Planned',
  description: 'Test task description',
  subtasks,
});

const createTestBacklog = (): Backlog => {
  const s1 = createTestSubtask('P1.M1.T1.S1', 'Complete Task', 'Complete', 1);
  const s2 = createTestSubtask('P1.M1.T1.S2', 'Planned Task', 'Planned', 2);
  const t1 = createTestTask('P1.M1.T1', 'Task 1', [s1, s2]);
  const m1 = createTestMilestone('P1.M1', 'Milestone 1', [t1]);
  const p1 = createTestPhase('P1', 'Phase 1', [m1]);
  return { backlog: [p1] };
};
```

## Test Patterns for CLI Options

### 1. Default Value Testing

```typescript
it('should use default parallelism of 2 when not specified', async () => {
  // SETUP: Parse CLI args without --parallelism
  process.argv = ['node', 'script.js', '--prd', 'PRD.md'];

  // EXECUTE
  const args = parseCLIArgs();

  // VERIFY
  expect(args.parallelism).toBe(2);
});
```

### 2. Custom Value Testing

```typescript
it('should accept custom parallelism value', async () => {
  // SETUP
  process.argv = ['node', 'script.js', '--prd', 'PRD.md', '--parallelism', '5'];

  // EXECUTE
  const args = parseCLIArgs();

  // VERIFY
  expect(args.parallelism).toBe(5);
});
```

### 3. Range Validation Testing

```typescript
it('should reject parallelism < 1', async () => {
  // SETUP
  process.argv = ['node', 'script.js', '--prd', 'PRD.md', '--parallelism', '0'];
  const mockExit = vi.fn((code: number) => {
    throw new Error(`process.exit(${code})`);
  });
  process.exit = mockExit as any;

  // EXECUTE & VERIFY
  expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  expect(mockLogger.error).toHaveBeenCalledWith(
    expect.stringContaining('must be between 1 and 10')
  );
});

it('should reject parallelism > 10', async () => {
  // SETUP
  process.argv = [
    'node',
    'script.js',
    '--prd',
    'PRD.md',
    '--parallelism',
    '11',
  ];
  const mockExit = vi.fn((code: number) => {
    throw new Error(`process.exit(${code})`);
  });
  process.exit = mockExit as any;

  // EXECUTE & VERIFY
  expect(() => parseCLIArgs()).toThrow('process.exit(1)');
});
```

### 4. Non-Integer Validation Testing

```typescript
it('should reject non-integer parallelism', async () => {
  // SETUP
  process.argv = [
    'node',
    'script.js',
    '--prd',
    'PRD.md',
    '--parallelism',
    'abc',
  ];
  const mockExit = vi.fn((code: number) => {
    throw new Error(`process.exit(${code})`);
  });
  process.exit = mockExit as any;

  // EXECUTE & VERIFY
  expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  expect(mockLogger.error).toHaveBeenCalledWith(
    expect.stringContaining('must be a valid integer')
  );
});
```

### 5. Resource Warning Testing

```typescript
it('should warn when parallelism exceeds CPU cores', async () => {
  // SETUP: Mock os.cpus() to return 4 cores
  vi.mock('node:os', () => ({
    cpus: vi.fn(() => Array(4).fill({})),
  }));

  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  process.argv = ['node', 'script.js', '--prd', 'PRD.md', '--parallelism', '8'];

  // EXECUTE
  parseCLIArgs();

  // VERIFY
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    expect.stringContaining('exceeds CPU cores')
  );

  consoleWarnSpy.mockRestore();
});
```

## File Location

**New test file:** `tests/integration/parallelism-option.test.ts`

**Import paths:**

- `import { parseCLIArgs, type CLIArgs } from '../../src/cli/index.js';`
- `import type { ParallelismConfig } from '../../src/core/concurrent-executor.js';`

## Key Test Requirements

1. **Mock node:os** for CPU detection tests
2. **Mock process.exit** to capture exit calls
3. **Mock console.warn** to verify warnings
4. **Restore originals** in afterEach
5. **Clear mocks** between tests
6. **Test edge cases**: 0, 1, 10, 11, negative, non-numeric
