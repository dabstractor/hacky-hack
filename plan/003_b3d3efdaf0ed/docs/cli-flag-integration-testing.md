# CLI Flag Integration Testing Research

## Executive Summary

This document compiles comprehensive best practices for testing CLI flags and command-line argument parsing in TypeScript/Vitest projects, with specific focus on Commander.js applications. Research includes patterns from the hacky-hack codebase, industry best practices, and practical examples for testing scope flags, process.argv mocking, process.exit behavior, and end-to-end CLI testing.

**Last Updated:** 2026-01-21
**Research Scope:** Commander.js, Vitest, TypeScript CLI Testing

---

## Table of Contents

1. [Commander.js Testing Patterns](#1-commanderjs-testing-patterns)
2. [CLI Integration Testing with Vitest](#2-cli-integration-testing-with-vitest)
3. [Testing process.argv Mocking](#3-testing-processargv-mocking)
4. [Testing process.exit Behavior](#4-testing-processexit-behavior)
5. [End-to-End CLI Testing Pipeline](#5-end-to-end-cli-testing-pipeline)
6. [Testing Scope Flag Validation](#6-testing-scope-flag-validation)
7. [Code Examples and Patterns](#7-code-examples-and-patterns)
8. [Best Practices Summary](#8-best-practices-summary)
9. [References and URLs](#9-references-and-urls)

---

## 1. Commander.js Testing Patterns

### 1.1 Unit Testing Option Parsing

**Pattern from hacky-hack codebase:**

```typescript
// tests/unit/cli/index.test.ts

describe('parseCLIArgs', () => {
  describe('parsing options', () => {
    it('should parse custom PRD path', () => {
      // SETUP
      setArgv(['--prd', './custom/PRD.md']);

      // EXECUTE
      const args = parseCLIArgs();

      // VERIFY: Custom PRD path is used
      expect(args.prd).toBe('./custom/PRD.md');
    });

    it('should parse scope option', () => {
      // SETUP
      setArgv(['--scope', 'P3.M4']);

      // EXECUTE
      const args = parseCLIArgs();

      // VERIFY: Scope is parsed
      expect(args.scope).toBe('P3.M4');
    });

    it('should parse all options together', () => {
      // SETUP
      setArgv([
        '--prd', './custom/PRD.md',
        '--scope', 'P1.M2.T3',
        '--mode', 'bug-hunt',
        '--continue',
        '--dry-run',
        '--verbose',
      ]);

      // EXECUTE
      const args = parseCLIArgs();

      // VERIFY: All options are parsed correctly
      expect(args.prd).toBe('./custom/PRD.md');
      expect(args.scope).toBe('P1.M2.T3');
      expect(args.mode).toBe('bug-hunt');
      expect(args.continue).toBe(true);
      expect(args.dryRun).toBe(true);
      expect(args.verbose).toBe(true);
    });
  });
});
```

### 1.2 Testing Default Values

```typescript
describe('default values', () => {
  it('should use default PRD path when not provided', () => {
    setArgv([]);
    const args = parseCLIArgs();
    expect(args.prd).toBe('./PRD.md');
  });

  it('should use default mode when not provided', () => {
    setArgv([]);
    const args = parseCLIArgs();
    expect(args.mode).toBe('normal');
  });

  it('should default boolean flags to false', () => {
    setArgv([]);
    const args = parseCLIArgs();
    expect(args.continue).toBe(false);
    expect(args.dryRun).toBe(false);
    expect(args.verbose).toBe(false);
  });
});
```

### 1.3 Testing Validation and Error Handling

```typescript
describe('PRD file validation', () => {
  it('should exit with code 1 when PRD file does not exist', () => {
    // SETUP: File does not exist
    mockExistsSync.mockReturnValue(false);
    setArgv(['--prd', './nonexistent.md']);

    // EXECUTE & VERIFY: Should throw process.exit error
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should display error message when PRD file not found', () => {
    mockExistsSync.mockReturnValue(false);
    setArgv(['--prd', './missing.md']);

    expect(() => parseCLIArgs()).toThrow('process.exit(1)');

    // VERIFY: Error message was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('PRD file not found')
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('./missing.md')
    );
  });
});
```

### 1.4 Testing Mode Choice Validation

```typescript
describe('mode validation', () => {
  it('should accept "normal" mode', () => {
    setArgv(['--mode', 'normal']);
    const args = parseCLIArgs();
    expect(args.mode).toBe('normal');
  });

  it('should accept "bug-hunt" mode', () => {
    setArgv(['--mode', 'bug-hunt']);
    const args = parseCLIArgs();
    expect(args.mode).toBe('bug-hunt');
  });

  it('should reject invalid mode choice', () => {
    setArgv(['--mode', 'invalid-mode']);

    // Commander.js calls process.exit(1) for invalid choices
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
```

---

## 2. CLI Integration Testing with Vitest

### 2.1 Mock Setup Pattern for CLI Testing

**Pattern from hacky-hack codebase:**

```typescript
// tests/unit/cli/index.test.ts

// Mock process.argv
const originalArgv = process.argv;
const originalExit = process.exit;

// Mock the node:fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

import { existsSync } from 'node:fs';
const mockExistsSync = existsSync as any;

describe('cli/index', () => {
  let mockExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Default: file exists
    mockExistsSync.mockReturnValue(true);

    // Clear mock logger calls
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();

    // Mock process.exit to capture exit calls
    mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;
  });

  afterEach(() => {
    // Restore original process.argv
    process.argv = originalArgv;

    // Restore original process.exit
    process.exit = originalExit;

    // Clear all mocks
    vi.clearAllMocks();
  });
});
```

### 2.2 Helper Function for process.argv Manipulation

```typescript
/**
 * Helper to set process.argv for testing
 */
const setArgv = (args: string[] = []) => {
  process.argv = ['node', '/path/to/script.js', ...args];
};
```

### 2.3 Testing Child Process Execution

**Pattern from CLI Help Executor tests:**

```typescript
// tests/unit/utils/cli-help-executor.test.ts

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { spawn } from 'node:child_process';

function createMockChild(
  options: {
    exitCode?: number | null;
    stdout?: string;
    stderr?: string;
  } = {}
) {
  const { exitCode = 0, stdout = '', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number | null) => void) => {
      if (event === 'close') {
        if (exitCode !== null) {
          setTimeout(() => callback(exitCode), 10);
        }
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

describe('Successful CLI help execution', () => {
  it('should return success: true when CLI help executes with exit code 0', async () => {
    const mockChild = createMockChild({
      exitCode: 0,
      stdout: validHelpOutput,
    });
    vi.mocked(spawn).mockReturnValue(mockChild);

    const resultPromise = executeCliHelp();
    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.error).toBeUndefined();
  });
});
```

---

## 3. Testing process.argv Mocking

### 3.1 Safe process.argv Manipulation Pattern

**Best Practice:** Always save and restore original process.argv

```typescript
describe('process.argv mocking', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    // CRITICAL: Always restore original argv
    process.argv = originalArgv;
  });

  it('should test with custom argv', () => {
    // Save original before modifying
    const original = process.argv;

    try {
      // Modify for test
      process.argv = ['node', 'script.js', '--flag', 'value'];

      // Test logic here
      const args = parseCLIArgs();
      expect(args).toBeDefined();
    } finally {
      // Restore even if test fails
      process.argv = original;
    }
  });
});
```

### 3.2 Testing Multiple Argument Combinations

```typescript
describe('argument combination tests', () => {
  const testCases = [
    {
      name: 'single flag',
      argv: ['--verbose'],
      expected: { verbose: true, continue: false, dryRun: false }
    },
    {
      name: 'two flags',
      argv: ['--dry-run', '--verbose'],
      expected: { verbose: true, continue: false, dryRun: true }
    },
    {
      name: 'all boolean flags',
      argv: ['--continue', '--dry-run', '--verbose'],
      expected: { verbose: true, continue: true, dryRun: true }
    },
    {
      name: 'flag with value',
      argv: ['--scope', 'P3.M4'],
      expected: { scope: 'P3.M4' }
    }
  ];

  testCases.forEach(({ name, argv, expected }) => {
    it(`should handle ${name}`, () => {
      setArgv(argv);
      const args = parseCLIArgs();

      Object.entries(expected).forEach(([key, value]) => {
        expect(args[key]).toBe(value);
      });
    });
  });
});
```

### 3.3 Testing Special Characters and Escaping

```typescript
describe('special characters in arguments', () => {
  it('should handle quoted arguments with spaces', () => {
    setArgv(['--message', 'hello world']);
    const args = parseCLIArgs();
    expect(args.message).toBe('hello world');
  });

  it('should handle special characters', () => {
    setArgv(['--url', 'http://example.com:8080/path?query=value']);
    const args = parseCLIArgs();
    expect(args.url).toBe('http://example.com:8080/path?query=value');
  });

  it('should handle escaped characters', () => {
    setArgv(['--pattern', '\\d+\\s*\\w+']);
    const args = parseCLIArgs();
    expect(args.pattern).toBe('\\d+\\s*\\w+');
  });
});
```

---

## 4. Testing process.exit Behavior

### 4.1 Mocking process.exit Safely

**Pattern from hacky-hack codebase:**

```typescript
describe('process.exit testing', () => {
  const originalExit = process.exit;
  let mockExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock process.exit to capture exit calls and prevent actual exit
    // Make it throw to stop execution (simulating real process.exit behavior)
    mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;
  });

  afterEach(() => {
    // Restore original process.exit
    process.exit = originalExit;
  });

  it('should exit with code 1 on validation error', () => {
    mockExistsSync.mockReturnValue(false);
    setArgv(['--prd', './missing.md']);

    // Should throw due to our mock
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');

    // Verify exit code was correct
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should not exit when validation passes', () => {
    mockExistsSync.mockReturnValue(true);
    setArgv(['--prd', './existing.md']);

    const args = parseCLIArgs();

    // process.exit should NOT have been called
    expect(mockExit).not.toHaveBeenCalled();
    expect(args.prd).toBe('./existing.md');
  });
});
```

### 4.2 Testing Different Exit Codes

```typescript
describe('exit code testing', () => {
  it('should exit with code 0 for success', () => {
    const result = executeCommand();
    expect(result.exitCode).toBe(0);
  });

  it('should exit with code 1 for validation errors', () => {
    const result = executeCommandWithInvalidInput();
    expect(result.exitCode).toBe(1);
  });

  it('should exit with code 2 for runtime errors', () => {
    const result = executeCommandWithRuntimeError();
    expect(result.exitCode).toBe(2);
  });
});
```

### 4.3 Testing Error Messages Before Exit

```typescript
describe('error message testing', () => {
  it('should log error before exiting', () => {
    mockExistsSync.mockReturnValue(false);
    setArgv(['--prd', './missing.md']);

    expect(() => parseCLIArgs()).toThrow();

    // Verify error was logged BEFORE exit
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('PRD file not found')
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('./missing.md')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should show help text in error message', () => {
    mockExistsSync.mockReturnValue(false);
    setArgv(['--prd', './missing.md']);

    expect(() => parseCLIArgs()).toThrow();

    // Verify help text includes --prd usage
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('--prd')
    );
  });
});
```

### 4.4 Alternative: Non-Throwing process.exit Mock

```typescript
describe('non-throwing exit mock', () => {
  let exitCode: number | null = null;

  beforeEach(() => {
    // Store exit code instead of throwing
    exitCode = null;
    vi.spyOn(process, 'exit').mockImplementation((code: number) => {
      exitCode = code;
      return undefined as never;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should capture exit code without throwing', () => {
    mockExistsSync.mockReturnValue(false);
    setArgv(['--prd', './missing.md']);

    // Function completes normally (no throw)
    const args = parseCLIArgs();

    // But exit was called
    expect(exitCode).toBe(1);
  });
});
```

---

## 5. End-to-End CLI Testing Pipeline

### 5.1 Testing Complete CLI Execution Flow

**Pattern from hacky-hack E2E tests:**

```typescript
// tests/e2e/pipeline.test.ts

describe('End-to-end CLI execution', () => {
  describe('Complete workflow', () => {
    it('should execute full pipeline with valid arguments', async () => {
      // SETUP: Create temporary directory and PRD file
      const tempDir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, mockSimplePRD);

      try {
        // EXECUTE: Run pipeline with CLI args
        const pipeline = new PRPPipeline(prdPath);
        const result = await pipeline.run();

        // VERIFY: Pipeline completed successfully
        expect(result.success).toBe(true);
        expect(result.backlog).toBeDefined();
        expect(result.backlog.backlog.length).toBeGreaterThan(0);
      } finally {
        // CLEANUP: Remove temporary directory
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle --dry-run flag correctly', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
      const prdPath = join(tempDir, 'PRD.md');
      writeFileSync(prdPath, mockSimplePRD);

      try {
        setArgv(['--prd', prdPath, '--dry-run']);

        const pipeline = new PRPPipeline(prdPath);
        const result = await pipeline.run();

        // Should show plan without executing
        expect(result.success).toBe(true);
        expect(result.executed).toBe(false);
        expect(result.plan).toBeDefined();
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
```

### 5.2 Testing CLI to Execution Integration

```typescript
describe('CLI to execution pipeline', () => {
  it('should parse CLI args and execute pipeline', async () => {
    // SETUP: Parse CLI arguments
    setArgv([
      '--prd', './test.md',
      '--scope', 'P1.M1',
      '--mode', 'bug-hunt',
      '--verbose'
    ]);

    const args = parseCLIArgs();

    // EXECUTE: Create pipeline with parsed args
    const pipeline = new PRPPipeline(args.prd, {
      scope: args.scope,
      mode: args.mode,
      verbose: args.verbose
    });

    const result = await pipeline.run();

    // VERIFY: Pipeline used CLI arguments correctly
    expect(result.scope).toBe('P1.M1');
    expect(result.mode).toBe('bug-hunt');
    expect(result.verboseOutput).toBe(true);
  });

  it('should validate scope before execution', async () => {
    setArgv(['--prd', './test.md', '--scope', 'INVALID']);

    // Should fail at parse stage
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');

    // Pipeline should never be created
    expect(PRPPipeline).not.toHaveBeenCalled();
  });
});
```

### 5.3 Testing Output and Side Effects

```typescript
describe('CLI output testing', () => {
  it('should produce correct output format', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, mockSimplePRD);

    try {
      setArgv(['--prd', prdPath, '--machine-readable']);

      const pipeline = new PRPPipeline(prdPath);
      const result = await pipeline.run();

      // Verify JSON output format
      expect(() => JSON.parse(result.output)).not.toThrow();
      const parsed = JSON.parse(result.output);

      expect(parsed).toHaveProperty('success');
      expect(parsed).toHaveProperty('backlog');
      expect(parsed).toHaveProperty('timestamp');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create expected files', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
    const prdPath = join(tempDir, 'PRD.md');
    writeFileSync(prdPath, mockSimplePRD);

    try {
      setArgv(['--prd', prdPath]);

      const pipeline = new PRPPipeline(prdPath);
      await pipeline.run();

      // Verify files were created
      expect(existsSync(join(tempDir, 'backlog.json'))).toBe(true);
      expect(existsSync(join(tempDir, 'tasks.json'))).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
```

---

## 6. Testing Scope Flag Validation

### 6.1 Valid Scope Format Testing

**Pattern from hacky-hack codebase:**

```typescript
describe('scope validation', () => {
  it('should accept valid phase scope', () => {
    setArgv(['--scope', 'P1']);
    const args = parseCLIArgs();
    expect(args.scope).toBe('P1');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should accept valid milestone scope', () => {
    setArgv(['--scope', 'P1.M1']);
    const args = parseCLIArgs();
    expect(args.scope).toBe('P1.M1');
  });

  it('should accept valid task scope', () => {
    setArgv(['--scope', 'P1.M1.T1']);
    const args = parseCLIArgs();
    expect(args.scope).toBe('P1.M1.T1');
  });

  it('should accept valid subtask scope', () => {
    setArgv(['--scope', 'P1.M1.T1.S1']);
    const args = parseCLIArgs();
    expect(args.scope).toBe('P1.M1.T1.S1');
  });

  it('should accept "all" keyword', () => {
    setArgv(['--scope', 'all']);
    const args = parseCLIArgs();
    expect(args.scope).toBe('all');
  });
});
```

### 6.2 Invalid Scope Format Testing

```typescript
describe('invalid scope rejection', () => {
  it('should reject invalid scope and exit with code 1', () => {
    setArgv(['--scope', 'INVALID']);

    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should display error message for invalid scope', () => {
    setArgv(['--scope', 'P1.X1']);

    expect(() => parseCLIArgs()).toThrow('process.exit(1)');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid scope')
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('P1.X1')
    );
  });

  it('should show expected format in scope error message', () => {
    setArgv(['--scope', 'bad-scope']);

    expect(() => parseCLIArgs()).toThrow('process.exit(1)');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Expected format')
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, or all')
    );
  });

  it('should show details from ScopeParseError', () => {
    setArgv(['--scope', 'p1']); // lowercase p is invalid

    expect(() => parseCLIArgs()).toThrow('process.exit(1)');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Details:')
    );
  });

  it('should skip scope validation when scope not provided', () => {
    setArgv([]);
    const args = parseCLIArgs();

    expect(args.scope).toBeUndefined();
    expect(mockExit).not.toHaveBeenCalled();
  });
});
```

### 6.3 Testing Scope Parsing Logic

```typescript
describe('scope parsing logic', () => {
  const validScopes = [
    'P1',
    'P1.M1',
    'P1.M1.T1',
    'P1.M1.T1.S1',
    'P99',
    'P9.M9.T9.S9',
    'all'
  ];

  const invalidScopes = [
    'p1',           // lowercase
    'P1.M1.T1.S2',  // too many levels
    'P1.M1.T1.S1.X1', // too many levels
    'P1.X1',        // invalid component
    'M1',           // missing phase
    'T1',           // missing phase and milestone
    'INVALID',      // completely invalid
    'P1.M1.T1.S1.', // trailing dot
    '.P1.M1.T1.S1', // leading dot
    'P1..T1',       // double dot
  ];

  validScopes.forEach(scope => {
    it(`should accept valid scope: ${scope}`, () => {
      setArgv(['--scope', scope]);
      const args = parseCLIArgs();
      expect(args.scope).toBe(scope);
    });
  });

  invalidScopes.forEach(scope => {
    it(`should reject invalid scope: ${scope}`, () => {
      setArgv(['--scope', scope]);
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    });
  });
});
```

### 6.4 Testing Scope-based Filtering

```typescript
describe('scope-based filtering', () => {
  it('should filter backlog by phase scope', async () => {
    setArgv(['--prd', './test.md', '--scope', 'P1']);

    const pipeline = new PRPPipeline('./test.md');
    const result = await pipeline.run({ scope: 'P1' });

    // Should only include P1 items
    result.items.forEach(item => {
      expect(item.id).toMatch(/^P1\./);
    });
  });

  it('should filter backlog by milestone scope', async () => {
    setArgv(['--prd', './test.md', '--scope', 'P1.M1']);

    const pipeline = new PRPPipeline('./test.md');
    const result = await pipeline.run({ scope: 'P1.M1' });

    result.items.forEach(item => {
      expect(item.id).toMatch(/^P1\.M1\./);
    });
  });

  it('should include all items when scope is "all"', async () => {
    setArgv(['--prd', './test.md', '--scope', 'all']);

    const pipeline = new PRPPipeline('./test.md');
    const result = await pipeline.run({ scope: 'all' });

    expect(result.items.length).toBeGreaterThan(0);
  });
});
```

---

## 7. Code Examples and Patterns

### 7.1 Complete CLI Test Template

```typescript
/**
 * CLI Argument Parser Test Template
 *
 * @remarks
 * Complete template for testing Commander.js CLI argument parsing
 * with Vitest, including mocks, helpers, and comprehensive test cases.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCLIArgs } from '../src/cli/index.js';

// =============================================================================
// MOCK SETUP
// =============================================================================

const originalArgv = process.argv;
const originalExit = process.exit;

// Mock external dependencies
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

import { existsSync } from 'node:fs';
const mockExistsSync = existsSync as any;

// =============================================================================
// TEST SUITE
// =============================================================================

describe('CLI Argument Parser', () => {
  let mockExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Default mocks
    mockExistsSync.mockReturnValue(true);
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();

    // Mock process.exit
    mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    vi.clearAllMocks();
  });

  // Helper function
  const setArgv = (args: string[] = []) => {
    process.argv = ['node', '/path/to/script.js', ...args];
  };

  // Test cases here...
});
```

### 7.2 Testing Help Text Generation

```typescript
describe('help text generation', () => {
  it('should include all options in help text', () => {
    const helpText = generateHelpText();

    expect(helpText).toContain('--prd');
    expect(helpText).toContain('--scope');
    expect(helpText).toContain('--mode');
    expect(helpText).toContain('--verbose');
    expect(helpText).toContain('--dry-run');
    expect(helpText).toContain('--continue');
  });

  it('should show option descriptions', () => {
    const helpText = generateHelpText();

    expect(helpText).toContain('Path to PRD');
    expect(helpText).toContain('Scope identifier');
    expect(helpText).toContain('Execution mode');
  });

  it('should show default values', () => {
    const helpText = generateHelpText();

    expect(helpText).toContain('(default: "./PRD.md")');
    expect(helpText).toContain('(default: "normal")');
    expect(helpText).toContain('(default: false)');
  });

  it('should show choices for enum options', () => {
    const helpText = generateHelpText();

    expect(helpText).toContain('choices:');
    expect(helpText).toContain('"normal"');
    expect(helpText).toContain('"bug-hunt"');
    expect(helpText).toContain('"validate"');
  });
});
```

### 7.3 Testing Numeric Validation

```typescript
describe('numeric option validation', () => {
  it('should accept positive integers for --max-tasks', () => {
    setArgv(['--max-tasks', '10']);
    const args = parseCLIArgs();
    expect(args.maxTasks).toBe(10);
  });

  it('should reject zero for --max-tasks', () => {
    setArgv(['--max-tasks', '0']);
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('must be a positive integer')
    );
  });

  it('should reject negative numbers for --max-tasks', () => {
    setArgv(['--max-tasks', '-5']);
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  });

  it('should reject non-numeric values for --max-tasks', () => {
    setArgv(['--max-tasks', 'abc']);
    expect(() => parseCLIArgs()).toThrow();
  });

  it('should accept --max-duration in milliseconds', () => {
    setArgv(['--max-duration', '60000']);
    const args = parseCLIArgs();
    expect(args.maxDuration).toBe(60000);
  });

  it('should reject non-integer --max-duration', () => {
    setArgv(['--max-duration', '60000.5']);
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  });
});
```

---

## 8. Best Practices Summary

### 8.1 Commander.js Testing Best Practices

1. **Always mock external dependencies** (fs, logger, child_process)
2. **Save and restore process.argv** in beforeEach/afterEach
3. **Mock process.exit** to prevent test suite termination
4. **Test default values explicitly** - don't assume they work
5. **Test validation errors** - check exit codes AND error messages
6. **Use helper functions** for common test setup (setArgv, createMockChild)
7. **Test option combinations** - flags can interact in unexpected ways
8. **Test edge cases** - empty strings, special characters, unicode

### 8.2 Vitest-Specific Best Practices

1. **Use vi.hoisted()** for variables referenced in mock factories
2. **Use vi.mocked()** for type-safe mock assertions
3. **Clear mocks in beforeEach** to prevent test pollution
4. **Use vi.useFakeTimers()** for timeout/delay testing
5. **Group related tests** with describe blocks
6. **Use descriptive test names** that explain what is being tested
7. **Test setup/execute/verify pattern** for clarity

### 8.3 process.argv Mocking Best Practices

1. **Always save original argv** before modifying
2. **Restore in afterEach** even if test fails (use try/finally)
3. **Use helper function** for consistent argv manipulation
4. **Include node and script path** in mock argv for realism
5. **Test with empty argv** to verify default handling
6. **Test with multiple formats** (--flag=value, --flag value)

### 8.4 process.exit Testing Best Practices

1. **Mock process.exit** in all CLI tests
2. **Make mock throw error** to stop execution (realistic behavior)
3. **Verify exit code** with toHaveBeenCalledWith()
4. **Test error messages** before exit verification
5. **Test both success and failure** exit codes
6. **Consider non-throwing mock** for some test scenarios
7. **Always restore original** process.exit in afterEach

### 8.5 Scope Flag Testing Best Practices

1. **Test all valid formats** (P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, all)
2. **Test boundary cases** (P1, P99, P999)
3. **Test invalid formats** (lowercase, missing components, trailing dots)
4. **Test error messages** include expected format
5. **Test scope filtering** actually filters results
6. **Test "all" keyword** behavior
7. **Test undefined scope** (no --scope flag provided)

### 8.6 End-to-End CLI Testing Best Practices

1. **Use temporary directories** for file-based tests
2. **Clean up temp files** in afterEach (use try/finally)
3. **Test complete workflow** from CLI args to execution
4. **Test output formats** (text, JSON, machine-readable)
5. **Test side effects** (files created, processes spawned)
6. **Test error recovery** (invalid args, missing files)
7. **Test with real dependencies** mocked appropriately
8. **Test timeout handling** for long-running commands

### 8.7 Integration Testing Best Practices

1. **Test integration points** between CLI and execution layers
2. **Test argument passing** from CLI to business logic
3. **Test validation at boundaries** (CLI validation, execution validation)
4. **Test error propagation** from execution to CLI output
5. **Test logging levels** (verbose vs normal output)
6. **Test mode switching** (normal, bug-hunt, validate)
7. **Test flag interactions** (scope + mode + verbose)

---

## 9. References and URLs

### Official Documentation

**Commander.js:**
- GitHub Repository: https://github.com/tj/commander.js
- npm Package: https://www.npmjs.com/package/commander
- Documentation: https://commander.js/

**Vitest:**
- Official Website: https://vitest.dev/
- Documentation: https://vitest.dev/guide/
- GitHub Repository: https://github.com/vitest-dev/vitest
- CLI Testing Guide: https://vitest.dev/guide/cli.html

**TypeScript:**
- Handbook: https://www.typescriptlang.org/docs/handbook/
- Declaration Merging: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

### Testing Libraries

**Vitest Mocking:**
- vi.mock(): https://vitest.dev/api/vi.html#vi-mock
- vi.hoisted(): https://vitest.dev/api/vi.html#vi-hoisted
- vi.mocked(): https://vitest.dev/api/vi.html#vi-mocked

**Node.js Testing:**
- child_process.spawn(): https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
- process.argv: https://nodejs.org/api/process.html#processargv
- process.exit(): https://nodejs.org/api/process.html#processexitcode

### Industry Best Practices

**CLI Design Patterns:**
- CLI Design Patterns: https://clig.dev/
- Command Line Interface Guidelines: https://github.com/clijuggle/cli-guidelines

**Testing Best Practices:**
- Testing Best Practices: https://github.com/goldbergyoni/javascript-testing-best-practices
- Vitest Best Practices: https://vitest.dev/guide/why.html

### Code Examples from hacky-hack

**Test Files:**
- CLI Unit Tests: `/home/dustin/projects/hacky-hack/tests/unit/cli/index.test.ts`
- CLI Help Parser Tests: `/home/dustin/projects/hacky-hack/tests/unit/utils/cli-help-parser.test.ts`
- CLI Help Executor Tests: `/home/dustin/projects/hacky-hack/tests/unit/utils/cli-help-executor.test.ts`
- CLI Options Verifier Tests: `/home/dustin/projects/hacky-hack/tests/unit/utils/cli-options-verifier.test.ts`
- E2E Pipeline Tests: `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`

**Source Files:**
- CLI Implementation: `/home/dustin/projects/hacky-hack/src/cli/index.ts`
- CLI Help Parser: `/home/dustin/projects/hacky-hack/src/utils/cli-help-parser.ts`
- CLI Help Executor: `/home/dustin/projects/hacky-hack/src/utils/cli-help-executor.ts`
- CLI Options Verifier: `/home/dustin/projects/hacky-hack/src/utils/cli-options-verifier.ts`

### Related Research

**Scope Parsing Research:**
- External Research: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P3M2T2S1/research/external_research.md`
- Scope Patterns: Includes Nx, Lerna, npm/yarn workspace patterns

**Testing Patterns:**
- TypeScript Testing Patterns: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T1S3/research/typescript-testing-patterns.md`
- Test Patterns: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M1T1S2/research/test-patterns.md`

### Additional Resources

**Mock Child Process Pattern:**
```typescript
// From: tests/unit/utils/cli-help-executor.test.ts
function createMockChild(options: {
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
}): ChildProcess {
  // Implementation...
}
```

**process.argv Helper Pattern:**
```typescript
// From: tests/unit/cli/index.test.ts
const setArgv = (args: string[] = []) => {
  process.argv = ['node', '/path/to/script.js', ...args];
};
```

**process.exit Mock Pattern:**
```typescript
// From: tests/unit/cli/index.test.ts
const mockExit = vi.fn((code: number) => {
  throw new Error(`process.exit(${code})`);
});
process.exit = mockExit as any;
```

---

## Appendix: Quick Reference

### Test Structure Template

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks
  });

  afterEach(() => {
    // Cleanup
  });

  describe('happy path', () => {
    it('should do X when Y', () => {
      // Test
    });
  });

  describe('error cases', () => {
    it('should throw when Z', () => {
      // Test
    });
  });

  describe('edge cases', () => {
    it('should handle W', () => {
      // Test
    });
  });
});
```

### Common Assertions

```typescript
// Value assertions
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toMatch(regex);
expect(value).toContain(item);

// Function assertions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(n);

// Error assertions
expect(() => fn()).toThrow(error);
expect(() => fn()).toThrow('message');

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
```

### Mock Patterns

```typescript
// Function mock
const mockFn = vi.fn();
vi.mock('./module', () => ({ fn: vi.fn() }));

// Property mock
obj.property = 'value';

// Spy on method
vi.spyOn(obj, 'method');

// Clear mocks
mockFn.mockClear();
vi.clearAllMocks();
```

---

**Document Status:** Complete
**Version:** 1.0
**Author:** Research Agent
**Date:** 2026-01-21
