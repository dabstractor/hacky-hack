# Integration Test Patterns for CLI Options

## Summary

Documentation of existing integration test patterns for CLI options in the hacky-hack codebase, to be followed for retry option testing.

## Key Test Files

### 1. `tests/integration/parallelism-option.test.ts`

**Purpose**: Tests the `--parallelism` CLI option

**Test Structure**:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseCLIArgs } from '../../src/cli/index.js';

describe('CLI Parallelism Option', () => {
  let originalArgv: string[];
  const { mockLogger } = vi.hoisted(() => ({
    mockLogger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }));

  beforeEach(() => {
    originalArgv = process.argv;
    vi.mock('../../src/utils/logger.js', () => ({
      getLogger: () => mockLogger,
    }));
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  describe('validation', () => {
    it('should accept valid parallelism value', () => {
      process.argv = [
        'node',
        'cli.js',
        '--prd',
        'PRD.md',
        '--parallelism',
        '5',
      ];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.parallelism).toBe(5);
      }
    });

    it('should reject parallelism of 0 (below minimum)', () => {
      process.argv = [
        'node',
        'cli.js',
        '--prd',
        'PRD.md',
        '--parallelism',
        '0',
      ];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '--parallelism must be an integer between 1 and 10'
      );
    });

    it('should reject parallelism of 11 (above maximum)', () => {
      process.argv = [
        'node',
        'cli.js',
        '--prd',
        'PRD.md',
        '--parallelism',
        '11',
      ];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    });

    it('should reject non-numeric parallelism', () => {
      process.argv = [
        'node',
        'cli.js',
        '--prd',
        'PRD.md',
        '--parallelism',
        'abc',
      ];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    });
  });

  describe('defaults', () => {
    it('should use default value of 2 when not specified', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.parallelism).toBe(2);
      }
    });
  });

  describe('resource warnings', () => {
    it('should warn when parallelism exceeds CPU cores', () => {
      vi.mock('node:os', () => ({
        cpus: vi.fn(() => Array(4).fill({ model: 'Test CPU' })),
        freemem: vi.fn(() => 16 * 1024 * 1024 * 1024),
      }));

      process.argv = [
        'node',
        'cli.js',
        '--prd',
        'PRD.md',
        '--parallelism',
        '8',
      ];
      parseCLIArgs();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('exceeds CPU cores')
      );
    });
  });
});
```

### 2. `tests/integration/research-concurrency-option.test.ts`

Similar structure to parallelism tests, but for `--research-concurrency` option with environment variable support.

**Key Difference**: Tests environment variable fallback

```typescript
it('should use environment variable when CLI option not specified', () => {
  process.env.RESEARCH_QUEUE_CONCURRENCY = '5';
  process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];

  const args = parseCLIArgs();

  if (isCLIArgs(args)) {
    expect(args.researchConcurrency).toBe(5);
  }

  delete process.env.RESEARCH_QUEUE_CONCURRENCY;
});
```

## Mock Patterns

### Process.argv Manipulation

```typescript
let originalArgv: string[];

beforeEach(() => {
  originalArgv = process.argv;
});

afterEach(() => {
  process.argv = originalArgv;
});

it('should parse option', () => {
  process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--option', 'value'];
  // test...
});
```

### Process.exit Mocking

```typescript
const mockExit = vi.fn((code: number) => {
  throw new Error(`process.exit(${code})`);
});
process.exit = mockExit as any;

// Test usage
expect(() => parseCLIArgs()).toThrow('process.exit(1)');
```

### Logger Mocking

```typescript
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  getLogger: () => mockLogger,
}));

// Verify error messages
expect(mockLogger.error).toHaveBeenCalledWith('--option must be valid');
```

### File System Mocking

```typescript
vi.mock('node:fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(path => {
    if (path.includes('tasks.json')) {
      return JSON.stringify({ backlog: createTestBacklog().backlog });
    }
    return '{}';
  }),
}));
```

### OS Resource Mocking

```typescript
vi.mock('node:os', () => ({
  cpus: vi.fn(() => Array(8).fill({ model: 'Test CPU', speed: 1000 })),
  freemem: vi.fn(() => 16 * 1024 * 1024 * 1024),
}));
```

## Test Naming Conventions

**File naming**: `{option}-option.test.ts` or `{command}-command.test.ts`

**Test description patterns**:

- `"should accept valid {option} value"`
- `"should reject {option} of {value} ({reason})"`
- `"should use default value of {default} when not specified"`
- `"should use environment variable when CLI option not specified"`
- `"should warn when {condition}"`

## Test Structure Pattern

```typescript
describe('CLI {OptionName} Option', () => {
  describe('validation', () => {
    // Test valid inputs
    // Test boundary values (min, max)
    // Test invalid inputs (non-numeric, out of range)
  });

  describe('defaults', () => {
    // Test default value when not specified
  });

  describe('environment variables', () => {
    // Test env var override
    // Test CLI takes precedence over env var
  });

  describe('integration', () => {
    // Test interaction with other options
  });
});
```

## Coverage Checklist

For each CLI option, ensure tests cover:

- [ ] Valid value within range
- [ ] Minimum boundary value
- [ ] Maximum boundary value
- [ ] Below minimum (rejection)
- [ ] Above maximum (rejection)
- [ ] Non-numeric input (rejection)
- [ ] Default value when not specified
- [ ] Environment variable override (if applicable)
- [ ] CLI option takes precedence over environment variable
- [ ] Works correctly with other CLI options

## Recommendations for Retry Option Tests

Based on existing patterns, create `tests/integration/retry-options.test.ts`:

```typescript
describe('CLI Retry Options', () => {
  describe('--task-retry', () => {
    // Validation tests
    it('should accept valid task-retry value');
    it('should reject task-retry of -1 (below minimum)');
    it('should reject task-retry of 11 (above maximum)');
    it('should reject non-numeric task-retry');

    // Default tests
    it('should use default value of 3 when not specified');
    it('should accept 0 to disable retry');

    // Environment variable tests
    it(
      'should use HACKY_TASK_RETRY_MAX_ATTEMPTS when CLI option not specified'
    );
    it('should prefer CLI option over environment variable');
  });

  describe('--retry-backoff', () => {
    // Similar structure for backoff option
  });

  describe('--no-retry', () => {
    it('should disable retry when flag is set');
    it('should default to false when flag not set');
  });

  describe('integration', () => {
    it('should work correctly with other CLI options');
    it('should pass retry config through to PRPPipeline');
  });
});
```

## URLs and References

- Vitest documentation: https://vitest.dev/api/
- Commander.js documentation: https://commander.js.com/
