# Codebase Test Patterns Analysis

## Overview

This document analyzes the existing integration and unit test patterns in the codebase to understand how constructor parameter updates are handled, test constant patterns, factory function structures, mock assertion patterns, and test file organization.

**Analysis Date:** 2026-01-26
**Scope:** Integration and unit tests across the codebase
**Focus:** Patterns for handling constructor signature changes and parameter validation

---

## 1. Integration Test Files with Similar Patterns

### Core Component Integration Tests

| File | Component | Pattern Focus |
|------|-----------|---------------|
| `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` | ResearchQueue | Multi-parameter constructor, factory functions, mock assertions |
| `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.ts` | TaskOrchestrator | Constructor testing with SessionManager |
| `/home/dustin/projects/hacky-hack/tests/integration/prp-generator-integration.test.ts` | PRPGenerator | Constructor validation, SessionManager integration |

### Agent Integration Tests

| File | Component | Pattern Focus |
|------|-----------|---------------|
| `/home/dustin/projects/hacky-hack/tests/integration/agents.test.ts` | Agent Factory | Mock assertions for `createAgent`, `createPrompt` |
| `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts` | MCP Tools | Mock factory functions, ChildProcess mocking |
| `/home/dustin/projects/hacky-hack/tests/integration/forbidden-operations.test.ts` | Operations Enforcement | Test constants, mock factories |

### Other Notable Integration Tests

- `/home/dustin/projects/hacky-hack/tests/integration/artifacts-command.test.ts` - TEST_ARTIFACTS constant pattern
- `/home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts` - Mock assertions for file operations
- `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-e2e.test.ts` - End-to-end testing

---

## 2. Test Constant Patterns

### Pattern 1: DEFAULT_ Constants (Unit Tests)

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` (lines 101-104)

```typescript
// Test constants for ResearchQueue constructor parameters
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
```

**Usage Pattern:**
```typescript
const queue = new ResearchQueue(
  mockManager,
  DEFAULT_MAX_SIZE,
  DEFAULT_NO_CACHE,
  DEFAULT_CACHE_TTL_MS
);
```

**Purpose:**
- Centralizes default parameter values for consistency
- Makes tests self-documenting by showing expected defaults
- Simplifies test updates when defaults change
- Enables testing of non-default values by overriding specific constants

### Pattern 2: TEST_ Constants (Integration Tests)

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/artifacts-command.test.ts` (lines 29-59)

```typescript
const TEST_ARTIFACTS = {
  'validation-results.json': JSON.stringify([...]),
  'execution-summary.md': `# Execution Summary\n...`,
  'artifacts-list.json': JSON.stringify([...]),
};

const TEST_ARTIFACTS_2 = {
  'validation-results.json': JSON.stringify([...]),
  // ... different test data
};
```

**Purpose:**
- Provides reusable test data fixtures
- Separates test data from test logic
- Enables easy data variations (TEST_ARTIFACTS, TEST_ARTIFACTS_2)

### Pattern 3: PROTECTED_ Constants (Domain-Specific)

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/forbidden-operations.test.ts` (lines 115-149)

```typescript
const PROTECTED_FILES = [
  'tasks.json',
  'PRD.md',
  'prd_snapshot.md',
  // ...
] as const;

const FORBIDDEN_GITIGNORE_PATTERNS = [
  'plan/',
  'PRD.md',
  'tasks.json',
  '*tasks*.json',
] as const;

const FORBIDDEN_PIPELINE_COMMANDS = [
  'prd/run-prd.sh',
  'prd/run-prd.ts',
  './tsk',
  // ...
] as const;
```

**Purpose:**
- Domain-specific constants for test scenarios
- Uses `as const` for type safety
- Groups related constants together

### Pattern 4: TEMP_DIR_TEMPLATE (Environment Setup)

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.ts` (line 39)

```typescript
const TEMP_DIR_TEMPLATE = join(tmpdir(), 'orchestrator-test-XXXXXX');
```

**Usage:**
```typescript
function setupTestEnvironment(): {
  tempDir: string;
  prdPath: string;
  sessionManager: SessionManager;
} {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  // ...
}
```

---

## 3. Constructor Testing Patterns

### Pattern 1: Multi-Parameter Constructor Testing

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` (lines 111-280)

```typescript
describe('constructor', () => {
  it('should store sessionManager as readonly property', () => {
    // SETUP: Create mock session manager with active session
    const currentSession = { /* ... */ };
    const mockManager = createMockSessionManager(currentSession);
    const mockGenerate = vi.fn().mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));
    MockPRPGenerator.mockImplementation(() => ({
      generate: mockGenerate,
    }));

    // EXECUTE
    const queue = new ResearchQueue(
      mockManager,
      DEFAULT_MAX_SIZE,
      DEFAULT_NO_CACHE,
      DEFAULT_CACHE_TTL_MS
    );

    // VERIFY
    expect(queue.sessionManager).toBe(mockManager);
  });

  it('should set maxSize from constructor parameter', () => {
    // SETUP
    const currentSession = { /* ... */ };
    const mockManager = createMockSessionManager(currentSession);
    // ... mock setup

    // EXECUTE
    const queue = new ResearchQueue(
      mockManager,
      5,  // Custom value
      DEFAULT_NO_CACHE,
      DEFAULT_CACHE_TTL_MS
    );

    // VERIFY
    expect(queue.maxSize).toBe(5);
  });
});
```

**Key Elements:**
1. **Setup/Execute/Verify** pattern clearly marked with comments
2. Uses DEFAULT_ constants for parameters not being tested
3. Tests each parameter independently
4. Tests boundary values (min/max concurrency)

### Pattern 2: Constructor Error Handling

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/agents/prp-generator.test.ts` (lines 189-197)

```typescript
it('should throw error when no active session', () => {
  // SETUP: Session manager with null current session
  const emptySessionManager = { currentSession: null } as SessionManager;

  // EXECUTE & VERIFY: Constructor throws
  expect(() => new PRPGenerator(emptySessionManager)).toThrow(
    'Cannot create PRPGenerator: no active session'
  );
});
```

**Key Elements:**
- Tests error conditions in constructor
- Uses `expect(() => ...).toThrow()` pattern
- Validates exact error message

### Pattern 3: Constructor with Optional Parameters

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/agents/prp-generator.test.ts` (lines 171-187)

```typescript
describe('constructor', () => {
  it('should create PRPGenerator with session path', () => {
    // EXECUTE
    const generator = new PRPGenerator(mockSessionManager);

    // VERIFY: Session manager and path are set
    expect(generator.sessionManager).toBe(mockSessionManager);
    expect(generator.sessionPath).toBe(sessionPath);
  });

  it('should cache Researcher Agent in constructor', () => {
    // EXECUTE
    new PRPGenerator(mockSessionManager);

    // VERIFY: createResearcherAgent was called once
    expect(mockCreateResearcherAgent).toHaveBeenCalledTimes(1);
  });
});
```

**Key Elements:**
- Tests side effects of constructor (agent caching)
- Validates that constructor parameters are correctly stored
- Verifies initialization logic

---

## 4. Factory Function Patterns

### Pattern 1: Test Data Factory Functions

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` (lines 34-99)

```typescript
// Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope,
});

const createTestPRPDocument = (taskId: string): PRPDocument => ({
  taskId,
  objective: `Test objective for ${taskId}`,
  context: '## Context\n\nTest context content.',
  implementationSteps: [`Step 1 for ${taskId}`, `Step 2 for ${taskId}`],
  validationGates: [/* ... */],
  successCriteria: [/* ... */],
  references: [`src/test-${taskId}.ts`],
});

const createTestBacklog = (phases: any[]): Backlog => ({
  backlog: phases,
});

// Mock SessionManager
const createMockSessionManager = (currentSession: any): SessionManager => {
  const mockManager = {
    currentSession,
  } as unknown as SessionManager;
  return mockManager;
};
```

**Key Characteristics:**
- Named `createTest*` or `createMock*` for clarity
- Use default parameter values for optional fields
- Return typed objects for type safety
- Simple, focused functions (single responsibility)

### Pattern 2: Mock Factory Functions

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts` (lines 98-133)

```typescript
/**
 * Creates a realistic mock of Node.js ChildProcess that emits
 * data events and closes with the specified exit code.
 *
 * @param options - Options for configuring the mock behavior
 * @returns Mock ChildProcess object
 */
function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
): ChildProcess {
  const { exitCode = 0, stdout = 'test output', stderr = '' } = options;

  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

**Key Characteristics:**
- Options object pattern for configuration
- Destructuring with defaults
- JSDoc for documentation
- Realistic behavior (timing, callbacks)

### Pattern 3: Helper Functions (Non-Factory)

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts` (lines 138-152)

```typescript
/**
 * Parses tool result from executeTool() response
 *
 * @param toolResult - Result from executeTool()
 * @returns Parsed result object
 */
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

**Key Characteristics:**
- Named with verb (parse, format, convert)
- Provide reusable test logic
- Handle edge cases gracefully

---

## 5. Mock Assertion Patterns

### Pattern 1: Constructor Call Assertions

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/agents.test.ts` (lines 235-244)

```typescript
it('should create architect agent with TASK_BREAKDOWN_PROMPT', () => {
  // SETUP: Stub environment variables
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-token');
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

  // EXECUTE
  const agent = createArchitectAgent();

  // VERIFY: createAgent was called with correct config
  expect(createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'ArchitectAgent',
      system: TASK_BREAKDOWN_PROMPT,
      maxTokens: 8192,
      model: 'GLM-4.7',
      enableCache: true,
      enableReflection: true,
    })
  );

  // VERIFY: Agent has prompt method
  expect(agent.prompt).toBeDefined();
});
```

**Key Elements:**
- Uses `expect.objectContaining()` for partial matching
- Verifies exact values for critical parameters
- Can verify all parameters or subset
- Tests both mock calls and return values

### Pattern 2: Parameter Forwarding Assertions

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` (lines 628-632)

```typescript
// VERIFY: task1 only generated once
expect(mockGenerate).toHaveBeenCalledWith(task1, backlog);
expect(mockGenerate).toHaveBeenCalledWith(task2, backlog);
expect(mockGenerate).toHaveBeenCalledTimes(2);
```

**Key Elements:**
- Verifies exact parameter values passed
- Uses `toHaveBeenCalledTimes()` for validation
- Tests parameter forwarding through multiple layers

### Pattern 3: File Operation Assertions

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/prp-generator-integration.test.ts` (lines 215-227)

```typescript
// VERIFY: File was written to correct location
const prpCall = mockWriteFile.mock.calls.find(
  (call: any[]) =>
    call[0] && call[0].toString().endsWith('P3_M3_T1_S1.md')
);
expect(prpCall).toBeDefined();
expect(prpCall![1]).toContain('# PRP for P3.M3.T1.S1');
expect(prpCall![2]).toEqual({ mode: 0o644 });

// VERIFY: Directory was created
expect(mockMkdir).toHaveBeenCalledWith(join(sessionPath, 'prps'), {
  recursive: true,
});
```

**Key Elements:**
- Uses `mock.calls.find()` to locate specific calls
- Validates multiple parameters (path, content, options)
- Tests file system integration without real I/O

---

## 6. Test File Structure and Organization

### Pattern 1: Section Headers with Visual Separators

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` (lines 33-59)

```typescript
// =============================================================================
// Factory Functions (reuse from unit tests)
// =============================================================================

/**
 * Creates a test Subtask with configurable properties
 */
function createTestSubtask(
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = [],
  context_scope: string = 'Test scope'
): Subtask {
  return {
    id,
    type: 'Subtask',
    title,
    status,
    story_points: 2,
    dependencies,
    context_scope,
  };
}
```

**Key Elements:**
- Uses `// ===...===` separators for major sections
- Clear section labels
- JSDoc for functions
- Groups related functions together

### Pattern 2: Mock Setup Pattern with Hoisting

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` (lines 37-55)

```typescript
// =============================================================================
// Mock Setup with vi.hoisted() - REQUIRED for Vitest integration tests
// =============================================================================

const { mockLogger, mockGenerate } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  mockGenerate: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}));
```

**Key Elements:**
- Uses `vi.hoisted()` for mock references
- Explains WHY hoisting is required
- Groups related mocks together
- Mock setup before imports

### Pattern 3: Nested Describe Structure

**Location:** `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` (lines 185-920)

```typescript
describe('ResearchQueue Integration Tests', () => {
  let mockSessionManager: SessionManager;
  let ResearchQueue: any;

  beforeEach(async () => {
    // Clear all mocks and reset mock state
    vi.clearAllMocks();
    mockGenerate.mockReset();
    // ... more setup
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Concurrent Processing Tests
  // ===========================================================================

  describe('Concurrent Processing', () => {
    it('should process up to maxSize tasks concurrently', async () => {
      // ...
    });
  });

  // ===========================================================================
  // Fire-and-Forget Error Handling Tests
  // ===========================================================================

  describe('Fire-and-Forget Error Handling', () => {
    it('should log errors but continue processing queue', async () => {
      // ...
    });
  });
});
```

**Key Elements:**
- Top-level describe with component name
- `beforeEach`/`afterEach` for setup/teardown
- Nested describe for feature groupings
- Visual separators for major sections
- Clear test naming (should X when Y)

### Pattern 4: File Header Documentation

**Location:** Multiple files, e.g., `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` (lines 1-22)

```typescript
/**
 * Integration tests for ResearchQueue - Parallel PRP Generation
 *
 * @remarks
 * Tests validate ResearchQueue correctly manages concurrent PRP generation with:
 * - Concurrency limit of 3 (default maxSize)
 * - Fire-and-forget error handling (errors logged but don't block queue)
 * - Dependency ordering via TaskOrchestrator integration
 * - Cache deduplication (same task not generated twice)
 * - Queue statistics accuracy during concurrent operations
 * - Background cleanup in finally block (even on errors)
 *
 * These tests use mocked PRPGenerator for controlled timing and error simulation,
 * but test the real ResearchQueue queue logic (not mocked). This provides
 * integration-level validation of concurrent behavior while maintaining
 * deterministic test execution.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../../../src/core/research-queue.ts | ResearchQueue Implementation}
 * @see {@link ../../../../src/agents/prp-generator.ts | PRPGenerator Implementation}
 * @see {@link ../../../../src/core/task-orchestrator.ts | TaskOrchestrator Integration}
 */
```

**Key Elements:**
- JSDoc comment block at file start
- `@remarks` section explaining test approach
- Bullet points listing what's tested
- Explanation of mocking strategy
- `@see` references to implementation

---

## 7. How Constructor Changes Were Tested

### Example: ResearchQueue 4-Parameter Constructor

**Context:** ResearchQueue constructor was updated to accept 4 parameters:
```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
)
```

**Testing Approach:**

1. **Added Test Constants** (`/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts`):
```typescript
// Test constants for ResearchQueue constructor parameters
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
```

2. **Updated All Constructor Calls** - From:
```typescript
new ResearchQueue(mockSessionManager, 3)
```
To:
```typescript
new ResearchQueue(
  mockSessionManager,
  DEFAULT_MAX_SIZE,
  DEFAULT_NO_CACHE,
  DEFAULT_CACHE_TTL_MS
)
```

3. **Added Parameter-Specific Tests**:
```typescript
it('should set maxSize from constructor parameter', () => {
  const queue = new ResearchQueue(
    mockManager,
    5,
    DEFAULT_NO_CACHE,
    DEFAULT_CACHE_TTL_MS
  );
  expect(queue.maxSize).toBe(5);
});
```

### Example: PRPGenerator noCache/cacheTtlMs Parameters

**Context:** PRPGenerator constructor was updated to accept optional cache parameters:
```typescript
constructor(
  sessionManager: SessionManager,
  noCache: boolean = false,
  cacheTtlMs?: number
)
```

**Testing Approach:**

1. **Added tests in separate file** (`/home/dustin/projects/hacky-hack/tests/unit/prp-cache-ttl.test.ts`):
```typescript
describe('PRPGenerator cache TTL configuration', () => {
  it('should use default cache TTL when not specified', async () => {
    const generator = new PRPGenerator(mockSessionManager);
    // ...
  });

  it('should use custom cache TTL when provided', async () => {
    const customTtl = 60 * 60 * 1000; // 1 hour
    const generator = new PRPGenerator(mockSessionManager, false, customTtl);
    // ...
  });
});
```

2. **Updated existing tests** to pass default values:
```typescript
// Before
const generator = new PRPGenerator(mockSessionManager);

// After (explicit defaults for clarity)
const generator = new PRPGenerator(mockSessionManager, false);
```

---

## 8. Recommendations for Consistent Patterns

### For Testing Constructor Parameter Updates:

1. **Define DEFAULT_ Constants** at the top of test files:
   ```typescript
   const DEFAULT_PARAM_1 = value1;
   const DEFAULT_PARAM_2 = value2;
   const DEFAULT_PARAM_3 = value3;
   ```

2. **Update All Constructor Calls** to use the complete signature:
   ```typescript
   new ClassName(
     mockManager,
     DEFAULT_PARAM_1,
     DEFAULT_PARAM_2,
     DEFAULT_PARAM_3
   )
   ```

3. **Test Each Parameter Independently**:
   ```typescript
   it('should set param1 from constructor', () => {
     const instance = new ClassName(mockManager, CUSTOM_VALUE_1, DEFAULT_PARAM_2, DEFAULT_PARAM_3);
     expect(instance.param1).toBe(CUSTOM_VALUE_1);
   });
   ```

4. **Test Boundary Values**:
   ```typescript
   it('should handle minimum value', () => {
     const instance = new ClassName(mockManager, MIN_VALUE, DEFAULT_PARAM_2, DEFAULT_PARAM_3);
     expect(instance.param1).toBe(MIN_VALUE);
   });
   ```

### For Mock Assertions:

1. **Use expect.objectContaining() for partial matches**:
   ```typescript
   expect(mockConstructor).toHaveBeenCalledWith(
     expect.objectContaining({
       requiredParam: expectedValue,
     })
   );
   ```

2. **Verify exact parameters when critical**:
   ```typescript
   expect(mockConstructor).toHaveBeenCalledWith(
     sessionManager,
     maxSize,
     noCache,
     cacheTtlMs
   );
   ```

3. **Use mock.calls.find() for specific call identification**:
   ```typescript
   const call = mockFunction.mock.calls.find(
     (call) => call[0] === targetValue
   );
   expect(call).toBeDefined();
   ```

### For Factory Functions:

1. **Name factories clearly**: `createTest*` or `createMock*`
2. **Provide default parameters**: Simplifies common test cases
3. **Return typed objects**: Ensures type safety
4. **Document with JSDoc**: Explains purpose and parameters

### For Test Organization:

1. **Use visual separators**: `// ===...===` for major sections
2. **Group related tests**: Nested describe blocks
3. **Clear test naming**: `should X when Y`
4. **Setup/Execute/Verify**: Comment each phase
5. **Document file purpose**: JSDoc header with @remarks and @see

---

## 9. Specific Files for Reference

### For Constructor Testing:
- `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` - Multi-parameter constructor
- `/home/dustin/projects/hacky-hack/tests/unit/agents/prp-generator.test.ts` - Optional parameters
- `/home/dustin/projects/hacky-hack/tests/unit/prp-cache-ttl.test.ts` - Cache parameter testing

### For Mock Assertions:
- `/home/dustin/projects/hacky-hack/tests/integration/agents.test.ts` - Constructor call assertions
- `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` - Parameter forwarding
- `/home/dustin/projects/hacky-hack/tests/integration/prp-generator-integration.test.ts` - File operation assertions

### For Factory Functions:
- `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` - Test data factories
- `/home/dustin/projects/hacky-hack/tests/integration/tools.test.ts` - Mock factories
- `/home/dustin/projects/hacky-hack/tests/integration/forbidden-operations.test.ts` - Helper functions

### For Test Organization:
- `/home/dustin/projects/hacky-hack/tests/integration/core/research-queue.test.ts` - Section organization
- `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.ts` - File structure
- `/home/dustin/projects/hacky-hack/tests/integration/agents.test.ts` - Mock setup pattern

---

## 10. Summary

The codebase demonstrates consistent patterns for:

1. **Test Constants**: DEFAULT_, TEST_, and domain-specific constants with clear naming
2. **Constructor Testing**: Setup/Execute/Verify pattern with DEFAULT_ constants for parameter forwarding
3. **Factory Functions**: createTest*/createMock* naming with default parameters and typed returns
4. **Mock Assertions**: expect.objectContaining() for partial matches, exact matching for critical params
5. **Test Organization**: Visual separators, nested describe blocks, clear documentation

When implementing the PRPGenerator 4-parameter constructor updates, follow the ResearchQueue pattern:
- Define DEFAULT_NO_CACHE and DEFAULT_CACHE_TTL_MS constants
- Update all 39 constructor calls to use the complete signature
- Add tests for each new parameter independently
- Verify parameter forwarding to PRPGenerator mock
