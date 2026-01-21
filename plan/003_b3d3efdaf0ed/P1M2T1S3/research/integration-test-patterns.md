# Integration Test Patterns Research

This document researches integration test patterns in the Hacky-Hack codebase to understand how to write integration tests for git operations, specifically smart commit functionality.

## Overview

The Hacky-Hack project uses Vitest for testing with a comprehensive integration test suite located in `tests/integration/`. The integration tests follow consistent patterns for mocking, temporary directory management, and test structure.

## Test Organization

### Directory Structure

```
tests/
├── integration/          # Integration tests
│   ├── core/             # Core system integration tests
│   │   ├── task-orchestrator-runtime.test.ts
│   │   ├── task-orchestrator-e2e.test.ts
│   │   ├── session-manager.test.ts
│   │   └── ...
│   ├── tools/            # MCP tool integration tests
│   │   └── tools.test.ts
│   ├── agents/           # Agent integration tests
│   │   ├── prp-*.test.ts
│   │   └── ...
│   └── groundswell/      # Groundswell integration tests
├── unit/                 # Unit tests
└── fixtures/             # Test fixtures
    ├── simple-prd.js
    ├── simple-prd-v2.js
    └── ...
```

### Test File Structure Pattern

Integration tests follow a consistent structure:

```typescript
/**
 * Integration tests for [Component Name] - [Purpose]
 *
 * @remarks
 * Description of test scope and coverage
 *
 * Tests cover:
 * - Feature 1
 * - Feature 2
 * - Edge case handling
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/component-path.ts | Component Implementation}
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Node.js fs utilities } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ComponentClass } from '../../../src/component-path.js';
import type { ModelType } from '../../../src/models-path.js';
import { fixture } from '../../fixtures/fixture-name.js';
```

## Key Patterns

### 1. Mock Setup

#### Module-Level Mocking

All mocks are set up at the top level before imports due to hoisting:

```typescript
// Mock the external dependencies
vi.mock('external-package', () => ({
  FunctionName: vi.fn().mockImplementation(() => mockImplementation),
}));

// Mock internal modules
vi.mock('../../../src/internal-module.js', () => ({
  ExportName: vi.fn(),
}));

// Import after mocking
import { mockedExport } from '../../../src/internal-module.js';
const mockExport = vi.mocked(mockedExport);
```

#### Mock Instance Pattern

Complex mock objects are created as factories:

```typescript
// Factory function for mock instances
function createMockInstance(options: { behavior: 'success' | 'failure' }) {
  return {
    method: vi.fn().mockResolvedValue({
      success: options.behavior === 'success',
      // ... other properties
    }),
  };
}
```

### 2. Temporary Directory Management

#### Pattern for Isolated Test Environments

Each test suite manages its own temporary directory:

```typescript
// Constants
const TEMP_DIR_TEMPLATE = join(tmpdir(), 'test-suite-name-XXXXXX');

// Setup/Teardown lifecycle
let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  // Create test directory structure
  mkdirSync(join(tempDir, 'subdir'), { recursive: true });
});

afterEach(() => {
  vi.clearAllMocks();
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
```

#### Session Directory Setup

For SessionManager tests:

```typescript
function setupTestEnvironment(): {
  tempDir: string;
  prdPath: string;
  sessionManager: SessionManager;
} {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  const planDir = join(tempDir, 'plan');
  const prdPath = join(tempDir, 'PRD.md');

  // Write PRD file
  writeFileSync(prdPath, mockSimplePRD);

  // Create session directory structure
  const sessionState = createSessionState(backlog, planDir);
  const sessionDir = sessionState.metadata.path;

  for (const dir of [
    sessionDir,
    join(sessionDir, 'architecture'),
    join(sessionDir, 'prps'),
    join(sessionDir, 'artifacts'),
  ]) {
    mkdirSync(dir, { recursive: true });
  }

  // Write session files
  writeFileSync(
    join(sessionDir, 'tasks.json'),
    JSON.stringify({ backlog: backlog.backlog }, null, 2)
  );

  return {
    tempDir,
    prdPath,
    sessionManager: new SessionManager(prdPath, planDir),
  };
}
```

### 3. Test Structure Patterns

#### Describe Block Organization

Tests are organized with descriptive describe blocks:

```typescript
describe('ComponentName Feature Tests', () => {
  let testVariable: TestType;

  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  // Feature-level describe blocks
  describe('Specific Feature', () => {
    it('should do something correctly', () => {
      // SETUP
      // EXECUTE
      // VERIFY
    });
  });

  // Edge case describe blocks
  describe('Error Handling', () => {
    it('should handle specific error', () => {
      // Test error scenarios
    });
  });
});
```

#### AAA (Arrange-Act-Assert) Pattern

Tests follow the AAA pattern with clear section comments:

```typescript
it('should do something correctly', () => {
  // SETUP
  const testObject = new TestClass();
  const inputData = createTestInput();

  // EXECUTE
  const result = testObject.method(inputData);

  // VERIFY
  expect(result.success).toBe(true);
  expect(result.property).toEqual(expectedValue);
});
```

### 4. Git Operation Testing Patterns

#### Smart Commit Testing

From `tests/unit/utils/git-commit.test.ts`:

```typescript
// Mock the GitMCP functions
vi.mock('../../../src/tools/git-mcp.js', () => ({
  gitStatus: vi.fn(),
  gitAdd: vi.fn(),
  gitCommit: vi.fn(),
}));

// Import and create typed mocks
import { gitStatus, gitAdd, gitCommit } from '../../../src/tools/git-mcp.js';
const mockGitStatus = vi.mocked(gitStatus);

// Test successful commit
it('should return commit hash on success', async () => {
  // SETUP
  mockGitStatus.mockResolvedValue({
    success: true,
    modified: ['src/index.ts'],
    untracked: ['src/utils.ts'],
  });
  mockGitAdd.mockResolvedValue({
    success: true,
    stagedCount: 2,
  });
  mockGitCommit.mockResolvedValue({
    success: true,
    commitHash: 'abc123def456',
  });

  // EXECUTE
  const result = await smartCommit('/project', 'Test commit');

  // VERIFY
  expect(result).toBe('abc123def456');
  expect(mockGitStatus).toHaveBeenCalledWith({ path: '/project' });
});
```

#### GitMCP Integration Testing

From `tests/integration/tools.test.ts`:

```typescript
describe('GitMCP.executeTool', () => {
  let gitMCP: GitMCP;

  beforeEach(() => {
    gitMCP = new GitMCP();
    // Set up mock git instance
    mockGitInstance.status.mockResolvedValue({
      current: 'main',
      files: [{ path: 'src/index.ts', index: 'M', working_dir: ' ' }],
      isClean: () => false,
    });
  });

  describe('git_commit tool', () => {
    it('should create commit with message via executeTool()', async () => {
      // EXECUTE
      const toolResult = await gitMCP.executeTool('git__git_commit', {
        path: './test-repo',
        message: 'Test commit',
      });
      const result = parseToolResult(toolResult);

      // VERIFY
      expect(result.success).toBe(true);
      expect(result.commitHash).toBe('abc123def456');
    });
  });
});
```

### 5. Import Patterns and .js Extensions

#### Import Pattern

Integration tests use explicit `.js` extensions for imports:

```typescript
// Import modules with .js extension
import { SessionManager } from '../../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../../src/core/task-orchestrator.js';
import type { Backlog } from '../../../src/core/models.js';

// Import fixtures
import { mockSimplePRD } from '../../fixtures/simple-prd.js';
```

#### Type Imports

Type-only imports are handled separately:

```typescript
import type { SessionState, Backlog } from '../../../src/core/models.js';
import type { Scope } from '../../../src/core/scope-resolver.js';
```

### 6. Helper Function Patterns

#### Fixture Factory Functions

```typescript
// Complex object factory
function createTestBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase',
        milestones: [
          // ... complex nested structure
        ],
      },
    ],
  };
}

// Session state factory
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

#### Tool Result Parser

For MCP tool testing:

```typescript
function parseToolResult(toolResult: any) {
  const content = toolResult.content as string;
  try {
    return JSON.parse(content);
  } catch {
    return {
      success: false,
      error: content,
    };
  }
}
```

### 7. Vitest Integration Patterns

#### Test Configuration

Integration tests use Vitest with specific patterns:

```typescript
// Import Vitest utilities
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

// Async test patterns
it('should handle async operation', async () => {
  await expect(asyncOperation()).resolves.toBeDefined();
});

// Timeout for long-running tests
it(
  'should complete within timeout',
  async () => {
    // Test code
  },
  { timeout: 10000 }
);
```

#### Mock Management

```typescript
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

// Spy pattern for tracking
const spy = vi.spyOn(object, 'method');
spy.mockImplementation(() => mockValue);
```

## Git-Specific Patterns for Smart Commit Integration Tests

### 1. Mocking Git Operations

```typescript
// Mock the git-commit module
vi.mock('../../../src/utils/git-commit.js', () => ({
  smartCommit: vi.fn().mockResolvedValue('abc123'),
  filterProtectedFiles: vi.fn((files: string[]) => files),
  formatCommitMessage: vi.fn((msg: string) => msg),
}));

// Test verification
const { smartCommit } = await import('../../../src/utils/git-commit.js');
const mockSmartCommit = smartCommit as any;
expect(mockSmartCommit).toHaveBeenCalled();
```

### 2. Testing Smart Commit in Context

From the task orchestrator tests:

```typescript
it('should trigger smart commit after successful execution', async () => {
  // SETUP
  const orchestrator = new TaskOrchestrator(sessionManager);
  const subtask = getTestSubtask();

  // EXECUTE
  await orchestrator.executeSubtask(subtask);

  // VERIFY: Smart commit should have been called
  expect(mockSmartCommit).toHaveBeenCalled();
});
```

### 3. File Filtering Integration

```typescript
it('should filter protected files before committing', async () => {
  // SETUP: Mock git status to return protected files
  mockGitStatus.mockResolvedValue({
    success: true,
    modified: ['src/index.ts'],
    untracked: ['tasks.json', 'PRD.md'],
  });

  // EXECUTE
  const result = await smartCommit('/project', 'Test commit');

  // VERIFY: Protected files should not be staged
  expect(mockGitAdd).toHaveBeenCalledWith({
    path: '/project',
    files: ['src/index.ts'], // No tasks.json or PRD.md
  });
});
```

## Best Practices Observed

1. **Isolation**: Each test suite manages its own temporary directory
2. **Mock Cleanup**: Always clear mocks with `vi.clearAllMocks()` in `afterEach`
3. **Descriptive Names**: Test names clearly describe what is being tested
4. **Section Comments**: Use // SETUP, // EXECUTE, // VERIFY comments
5. **Type Safety**: Use typed mocks (`vi.mocked()`) for better type checking
6. **Error Scenarios**: Test both success and failure cases
7. **Edge Cases**: Include tests for edge cases and boundary conditions
8. **Real Dependencies**: Use real implementations where safe (fs operations)
9. **Controlled Mocks**: Mock external APIs and dependencies
10. **Consistent Patterns**: Follow the same patterns across all integration tests

## Recommendations for Smart Commit Integration Tests

Based on these patterns, here's how to structure a smart commit integration test:

1. **Use temporary directories** to isolate git repositories
2. **Mock the git-commit module** but test the integration point
3. **Create a realistic test environment** with actual git operations if needed
4. **Follow the AAA pattern** with clear setup/execute/verify sections
5. **Test both success and failure scenarios** for smart commit
6. **Verify the integration point** where smart commit is called
7. **Include file filtering tests** to ensure protected files are excluded
8. **Test the commit message formatting** integration
9. **Verify error handling** when git operations fail
10. **Test edge cases** like empty repositories or no changes

These patterns provide a solid foundation for writing robust integration tests for smart commit functionality.
