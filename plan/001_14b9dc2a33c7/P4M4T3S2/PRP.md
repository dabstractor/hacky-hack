# Product Requirement Prompt (PRP): Create E2E Pipeline Test

**Work Item**: P4.M4.T3.S2 - Create E2E pipeline test
**Status**: Research Complete -> Ready for Implementation

---

## Goal

**Feature Goal**: Create an end-to-end test file at `tests/e2e/pipeline.test.ts` that validates the complete PRPPipeline workflow (Initialize → Decompose → Execute → Complete) using mocked LLM responses, MCP tools, and temporary test directories. The test must complete in under 30 seconds with comprehensive assertions.

**Deliverable**: E2E test file `tests/e2e/pipeline.test.ts` with:
- Full pipeline workflow validation using `mockSimplePRD` fixture (from P4.M4.T3.S1)
- Mocked Architect, Researcher, and Coder agents returning predefined success responses
- Mocked MCP tools (BashMCP, FilesystemMCP, GitMCP) returning success
- Temporary test session directory creation and cleanup
- Assertions for session directory, tasks.json validity, task completion status, git commits
- Execution time measurement (<30 seconds target)

**Success Definition**:
- E2E test file exists at `tests/e2e/pipeline.test.ts`
- Test validates complete PRPPipeline workflow: Initialize → Decompose → Execute → Complete
- All agent calls (Architect, Researcher, Coder) are mocked with predefined responses
- All MCP tools are mocked to return success
- Session directory is created and contains prd_snapshot.md and tasks.json
- All subtasks are marked Complete after execution
- Git commits are created during execution
- Test artifacts are cleaned up after execution
- Execution time is measured and completes in <30 seconds
- Test passes when run: `npm run test:run -- tests/e2e/pipeline.test.ts`

## User Persona (if applicable)

**Target User**: PRPPipeline developers and CI/CD system (automated validation)

**Use Case**: The E2E pipeline test enables:
1. Full workflow validation of PRPPipeline from start to finish
2. Regression detection for pipeline changes
3. Fast feedback during development with mocked dependencies
4. CI/CD integration for automated pipeline validation

**User Journey**:
1. Developer makes changes to PRPPipeline or related components
2. E2E test runs in CI/CD or locally
3. Test creates temporary directory, mocks all dependencies
4. PRPPipeline processes mockSimplePRD through complete workflow
5. Test validates all expected state changes and artifacts
6. Test cleans up temporary files
7. Developer gets fast feedback (<30 seconds) on pipeline health

**Pain Points Addressed**:
- **No Full Workflow Test**: Existing tests don't validate complete end-to-end pipeline
- **Slow Feedback**: Real LLM calls make testing slow and expensive
- **Flaky Tests**: File system and git operations can cause test pollution
- **No Regression Detection**: Pipeline changes can break workflows without detection

## Why

- **Regression Prevention**: E2E test catches breaking changes in pipeline workflow
- **Fast Development Cycle**: Mocked dependencies enable rapid iteration without LLM costs
- **CI/CD Integration**: Automated validation on every commit
- **Complete Coverage**: Tests all pipeline phases with realistic mock data
- **Builds on Previous Work**: P4.M4.T3.S1 provides `mockSimplePRD` fixture for test input

## What

### Input

- **Test PRD Fixture** (from P4.M4.T3.S1):
  - `tests/fixtures/simple-prd.ts` with `mockSimplePRD` export
  - Minimal valid PRD with 1 Phase, 1 Milestone, 1 Task, 3 Subtasks
  - Expected completion time <5 minutes when processed by PRPPipeline

- **Existing Test Patterns**:
  - `tests/integration/prp-pipeline-integration.test.ts` (pipeline test patterns)
  - `tests/integration/agents.test.ts` (Groundswell agent mocking)
  - `tests/integration/tools.test.ts` (MCP tool mocking)

- **Test Framework**:
  - Vitest with `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`
  - Configuration at `vitest.config.ts` with 100% coverage requirements

### State Changes

- **Create** `tests/e2e/` directory for E2E tests (new directory)
- **Create** `tests/e2e/pipeline.test.ts` with full workflow test
- **Mock** all agent factory functions (`createArchitectAgent`, `createResearcherAgent`, `createCoderAgent`)
- **Mock** all MCP tools (`execute_bash`, `file_read`, `file_write`, `git_status`, `git_commit`)
- **Use** `mkdtempSync()` and `rmSync()` for temporary directory management
- **Import** `mockSimplePRD` from `tests/fixtures/simple-prd.ts`

### Output

- **E2E Test File**: `tests/e2e/pipeline.test.ts`
- **Test Coverage**: Full PRPPipeline workflow validation
- **Execution Time**: <30 seconds with mocked dependencies
- **Assertions**: Session directory, tasks.json, task status, git commits, timing

### Success Criteria

- [ ] E2E test file created at `tests/e2e/pipeline.test.ts`
- [ ] Test imports `mockSimplePRD` from fixtures
- [ ] Test mocks Architect, Researcher, and Coder agents
- [ ] Test mocks BashMCP, FilesystemMCP, and GitMCP tools
- [ ] Test creates temporary directory with `mkdtempSync()`
- [ ] Test cleans up artifacts with `rmSync()` in afterEach
- [ ] Test validates session directory creation
- [ ] Test validates prd_snapshot.md content
- [ ] Test validates tasks.json exists and is valid JSON
- [ ] Test validates all subtasks marked Complete
- [ ] Test validates git commits were created
- [ ] Test measures and logs execution time
- [ ] Test completes in <30 seconds
- [ ] Test passes: `npm run test:run -- tests/e2e/pipeline.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement the E2E pipeline test successfully?

**Answer**: **YES** - This PRP provides:
- Complete mock patterns from existing integration tests
- Exact file paths and import patterns
- PRPPipeline constructor parameters and method signatures
- Test fixture location and usage
- Temporary directory management patterns
- Assertion patterns and validation commands
- Known gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - Existing E2E Test Pattern
- file: /home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-integration.test.ts
  why: Complete PRPPipeline test patterns, temp directory management, assertions
  pattern: beforeEach creates temp dir, afterEach cleanup, mock agent factory
  critical: Lines 42-55 (temp dir setup), 73-110 (full workflow test pattern)
  gotcha: Use mkdtempSync() from 'node:fs', not 'fs'

# MUST READ - Agent Mocking Pattern
- file: /home/dustin/projects/hacky-hack/tests/integration/agents.test.ts
  why: Groundswell agent mocking with vi.mock(), createAgent, createPrompt
  pattern: Module-level vi.mock() with importActual, vi.mocked() for type safety
  critical: Lines 24-31 (mock pattern), 86-89 (mocked agent setup)
  gotcha: Must mock before imports due to hoisting

# MUST READ - MCP Tool Mocking Pattern
- file: /home/dustin/projects/hacky-hack/tests/integration/tools.test.ts
  why: Complete MCP tool mocking for Bash, Filesystem, Git operations
  pattern: Mock node:child_process, node:fs, fast-glob, simple-git
  critical: Lines 26-58 (module mocks), 98-133 (createMockChild factory)
  gotcha: Mock ChildProcess with async data emission (setTimeout)

# MUST READ - PRPPipeline Class
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: PRPPipeline constructor, run() method, PipelineResult interface
  pattern: Constructor takes (prdPath, scope?, mode?), returns PipelineResult
  critical: Lines 43-68 (PipelineResult interface), 172-196 (constructor), 956-1024 (run method)
  gotcha: SessionManager created in run(), not constructor (line 968)

# MUST READ - Test PRD Fixture
- file: /home/dustin/projects/hacky-hack/tests/fixtures/simple-prd.ts
  why: Minimal test PRD with known structure, exported as `mockSimplePRD`
  pattern: Template literal with markdown content, JSDoc documentation
  critical: Lines 22-83 (PRD content), 1 Phase, 1 Milestone, 1 Task, 3 Subtasks
  gotcha: Import as `import { mockSimplePRD } from '../fixtures/simple-prd.js'`

# REFERENCE - Vitest Configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test framework configuration, coverage thresholds, path aliases
  pattern: describe/it/expect/vi globals, 100% coverage required
  critical: Lines 7-14 (include patterns), 15-24 (coverage thresholds)
  gotcha: Use .js extension for imports (ESM build)

# REFERENCE - SessionManager
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Session directory structure, prd_snapshot.md, tasks.json persistence
  pattern: Session directories created under plan/001_14b9dc2a33c7/sessions/
  critical: initialize() creates session, saveBacklog() writes tasks.json
  gotcha: Session path includes hash derived from PRD content

# REFERENCE - TaskOrchestrator
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Task iteration logic, processNextItem() method, status tracking
  pattern: DFS traversal through Phase → Milestone → Task → Subtask
  critical: processNextItem() returns false when queue empty
  gotcha: Updates task status in SessionManager

# RESEARCH - Vitest E2E Testing
- url: https://vitest.dev/guide/mocking.html
  why: Official vi.mock(), vi.fn(), vi.mocked() documentation
  section: Module Mocking, vi.mocked() for type safety

- url: https://vitest.dev/api/
  why: Complete Vitest API reference (describe, it, expect, vi, beforeEach, afterEach)
  section: Test Context API

# RESEARCH - TypeScript Testing Patterns
- url: https://jestjs.io/docs/asynchronous
  why: Async/await test patterns (Vitest follows Jest patterns)
  section: Testing Async Code, Promises, Async/Await
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                             # Test scripts: test, test:run, test:coverage
├── vitest.config.ts                         # Test runner configuration
├── src/
│   ├── workflows/
│   │   └── prp-pipeline.ts                  # PRPPipeline class with run() method
│   ├── core/
│   │   ├── session-manager.ts               # SessionManager for directory/state management
│   │   ├── task-orchestrator.ts             # TaskOrchestrator for backlog execution
│   │   └── models.ts                        # Backlog, Phase, Milestone, Task, Subtask types
│   └── agents/
│       ├── agent-factory.ts                 # createArchitectAgent, createResearcherAgent, createCoderAgent
│       ├── prp-generator.ts                 # PRPGenerator (calls Researcher agent)
│       └── prp-executor.ts                  # PRPExecutor (calls Coder agent)
├── tests/
│   ├── fixtures/
│   │   └── simple-prd.ts                    # EXPORT: mockSimplePRD (minimal test PRD)
│   ├── integration/
│   │   ├── prp-pipeline-integration.test.ts # REFERENCE: Pipeline test patterns
│   │   ├── agents.test.ts                   # REFERENCE: Agent mocking patterns
│   │   └── tools.test.ts                    # REFERENCE: MCP tool mocking patterns
│   └── unit/
│       └── ...
└── plan/
    └── 001_14b9dc2a33c7/
        ├── architecture/
        │   └── system_context.md            # Task hierarchy specification
        └── P4M4T3S2/
            ├── PRP.md                        # THIS DOCUMENT
            └── research/                     # Research findings storage
```

### Desired Codebase Tree (files to add)

```bash
tests/
└── e2e/
    └── pipeline.test.ts                      # CREATE: E2E pipeline test
        # Import: mockSimplePRD from '../fixtures/simple-prd.js'
        # Mock: createArchitectAgent, createResearcherAgent, createCoderAgent
        # Mock: BashMCP, FilesystemMCP, GitMCP tools
        # Test: Full PRPPipeline.run() workflow
        # Assert: Session directory, tasks.json, task status, git commits, timing
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Module Mocking Must Be Hoisted
// vi.mock() calls are hoisted and must be at top level before imports
// Pattern: Declare mocks at top of file, then import
// Gotcha: Can't mock inside test functions, must use vi.spyOn() for that

// CRITICAL: Import .js Extensions for ESM
// Vitest uses ESM, imports must use .js extension even for .ts files
// Pattern: import { mockSimplePRD } from '../fixtures/simple-prd.js'
// Gotcha: Using .ts extension in imports causes module resolution errors

// CRITICAL: Mock Agent Factory Before PRPPipeline Import
// PRPPipeline internally imports from agent-factory, must mock before
// Pattern: vi.mock('../../src/agents/agent-factory.js') before importing PRPPipeline
// Gotcha: If imported before mocking, real agent factory will be used

// CRITICAL: Temporary Directory Management
// Use mkdtempSync() from 'node:fs' with unique prefix for each test
// Pattern: mkdtempSync(join(tmpdir(), 'e2e-test-')) in beforeEach
// Gotcha: Clean up in afterEach with rmSync(tempDir, { recursive: true, force: true })

// CRITICAL: Mock ChildProcess Async Behavior
// ChildProcess emits events asynchronously, must simulate with setTimeout
// Pattern: setTimeout(() => callback(Buffer.from(stdout)), 5) in mock
// Gotcha: If events are synchronous, test may complete before callbacks fire

// CRITICAL: Mock readFile for SessionManager
// SessionManager reads PRD file to compute hash, must mock readFile
// Pattern: (readFile as any).mockResolvedValue(mockSimplePRD)
// Gotcha: If not mocked, SessionManager will try to read non-existent file path

// CRITICAL: Mock architectAgent.prompt() for Backlog Generation
// PRPPipeline.decomposePRD() calls architectAgent.prompt()
// Pattern: mockAgent.prompt.mockResolvedValue({ backlog: mockBacklog })
// Gotcha: Must return { backlog: Backlog } structure matching expected format

// CRITICAL: Mock fs/promises for tasks.json Read/Write
// SessionManager saves/loads tasks.json via fs/promises
// Pattern: Mock readFile to return backlog JSON, mock writeFile to capture writes
// Gotcha: Use different mock returns for tasks.json vs PRD.md (check path includes)

// CRITICAL: PRPPipeline Creates SessionManager in run() Method
// SessionManager is NOT created in constructor, but in run() at line 968
// Pattern: Don't expect SessionManager to exist before calling pipeline.run()
// Gotcha: Accessing pipeline.sessionManager before run() will throw null error

// CRITICAL: Execution Time Measurement
// Use performance.now() for millisecond precision timing
// Pattern: const start = performance.now(); await pipeline.run(); const duration = performance.now() - start
// Gotcha: Log duration but don't assert exact time (tests can be flaky with timing)

// CRITICAL: Git Operations Must Be Mocked
// PRPExecutor calls smartCommit() which uses GitMCP tools
// Pattern: Mock simple-git with mockGitInstance having status(), diff(), add(), commit()
// Gotcha: GitMCP validates .git directory exists, mock existsSync to return true

// CRITICAL: MCP Tool executeTool() Returns ToolResult
// executeTool() returns { content: string, isError?: boolean }
// Pattern: Mock return value with JSON.stringify({ success: true, ... })
// Gotcha: ToolResult.content is always a string (JSON serialized)

// CRITICAL: Real Timers for Async Mock Behavior
// Mock ChildProcess uses setTimeout for async event emission
// Pattern: vi.useRealTimers() in test before running pipeline
// Gotcha: Restore fake timers with vi.useFakeTimers() in afterEach

// CRITICAL: Avoid Environment Variable Pollution
// Tests should stub env vars and restore after each test
// Pattern: beforeEach(() => vi.stubEnv('KEY', 'value')), afterEach(() => vi.unstubAllEnvs())
// Gotcha: Failing to restore env can affect other tests

// CRITICAL: Test Isolation
// Each test should have unique temp directory to avoid conflicts
// Pattern: Include random number in temp dir path: mkdtempSync(join(tmpdir(), `e2e-test-${Date.now()}-`))
// Gotcha: Parallel tests can conflict if using same temp directory name

// CRITICAL: Mock Researcher and Coder for PRPRuntime
// PRPRuntime calls PRPGenerator (Researcher) and PRPExecutor (Coder)
// Pattern: Mock both createResearcherAgent and createCoderAgent
// Gotcha: Forgetting to mock one will cause real LLM calls (slow/expensive)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing types:

```typescript
// PRPPipeline result structure
interface PipelineResult {
  success: boolean;
  sessionPath: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  finalPhase: string;
  duration: number;
  phases: PhaseSummary[];
  bugsFound: number;
  error?: string;
  shutdownInterrupted: boolean;
  shutdownReason?: 'SIGINT' | 'SIGTERM';
}

// Backlog structure from models.ts
interface Backlog {
  backlog: Phase[];
}

// Phase, Milestone, Task, Subtask from models.ts
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/e2e/ directory structure
  - IMPLEMENT: New e2e test directory
  - PLACEMENT: tests/e2e/ (sibling to integration/, unit/)
  - VERIFY: Directory created with mkdir -p tests/e2e/

Task 2: CREATE tests/e2e/pipeline.test.ts with imports and mocks
  - IMPLEMENT: E2E test file with module-level mocks
  - MOCK patterns:
    - vi.mock('groundswell') for createAgent, createPrompt
    - vi.mock('node:fs/promises') for readFile, writeFile
    - vi.mock('node:fs') for existsSync, realpathSync
    - vi.mock('node:child_process') for spawn (BashMCP)
    - vi.mock('simple-git') for simpleGit (GitMCP)
    - vi.mock('../../src/agents/agent-factory.js') for createArchitectAgent, createResearcherAgent, createCoderAgent
  - IMPORT after mocking:
    - describe, it, expect, vi, beforeEach, afterEach from 'vitest'
    - PRPPipeline from '../../src/workflows/prp-pipeline.js'
    - mockSimplePRD from '../fixtures/simple-prd.js'
    - readFile, writeFile, mkdir from 'node:fs/promises'
    - mkdtempSync, rmSync, readFileSync, existsSync from 'node:fs'
    - join from 'node:path'
    - tmpdir from 'node:os'
    - createAgent, createPrompt from 'groundswell'
    - createArchitectAgent, createResearcherAgent, createCoderAgent from '../../src/agents/agent-factory.js'
  - PLACEMENT: tests/e2e/pipeline.test.ts

Task 3: IMPLEMENT mock fixture factory for Backlog
  - IMPLEMENT: createMockBacklog() helper returning minimal valid Backlog
  - STRUCTURE: 1 Phase (P1), 1 Milestone (P1.M1), 1 Task (P1.M1.T1), 3 Subtasks (P1.M1.T1.S1-S3)
  - STATUS: All subtasks start as 'Planned', will be updated to 'Complete' during execution
  - PATTERN: Follow exact structure from tests/fixtures/simple-prd.ts
  - GOTCHA: Subtask needs story_points, dependencies, context_scope fields

Task 4: IMPLEMENT mock agent fixtures
  - IMPLEMENT: Mock Agent object with prompt method
  - PROMPT method: vi.fn().mockResolvedValue()
  - ARCHITECT mock: Returns { backlog: createMockBacklog() }
  - RESEARCHER mock: Returns PRP document (for PRP generation)
  - CODER mock: Returns success (for PRP execution)
  - PLACEMENT: Top-level before describe block

Task 5: IMPLEMENT createMockChild helper for BashMCP
  - IMPLEMENT: ChildProcess mock factory (follow tools.test.ts pattern)
  - RETURNS: Mock ChildProcess with stdout.on(), stderr.on(), on() for 'close' event
  - BEHAVIOR: setTimeout for async data emission (5ms for data, 10ms for close)
  - PARAMETERS: { exitCode, stdout, stderr } with defaults
  - PLACEMENT: Helper function before describe block

Task 6: IMPLEMENT test suite structure with beforeEach/afterEach
  - IMPLEMENT: describe('E2E Pipeline Tests', () => { ... })
  - BEFOREEACH:
    - vi.clearAllMocks() to reset all mock calls
    - Create temp directory: mkdtempSync(join(tmpdir(), 'e2e-pipeline-test-'))
    - Create PRD file at temp dir: writeFileSync(join(tempDir, 'PRD.md'), mockSimplePRD)
    - Setup mocked agents to return success
    - Setup mock readFile to return mockSimplePRD for PRD, backlog JSON for tasks.json
    - Setup mock existsSync to return true for directory validation
    - Setup mock spawn (BashMCP) to return successful ChildProcess
    - Setup mock simpleGit (GitMCP) to return successful git operations
    - vi.useRealTimers() for async mock behavior
  - AFTEREACH:
    - Cleanup temp directory: rmSync(tempDir, { recursive: true, force: true })
    - vi.useFakeTimers() to restore fake timers
  - PLACEMENT: Inside describe block

Task 7: IMPLEMENT main E2E test: full pipeline workflow
  - TEST: it('should complete full pipeline workflow successfully', async () => { ... })
  - SETUP: All mocks configured in beforeEach
  - EXECUTE:
    - Measure start time: const start = performance.now()
    - Create pipeline: const pipeline = new PRPPipeline(prdPath)
    - Run pipeline: const result = await pipeline.run()
    - Measure duration: const duration = performance.now() - start
  - ASSERTIONS:
    - expect(result.success).toBe(true)
    - expect(result.sessionPath).toBeDefined()
    - expect(existsSync(result.sessionPath)).toBe(true)
    - expect(existsSync(join(result.sessionPath, 'prd_snapshot.md'))).toBe(true)
    - expect(existsSync(join(result.sessionPath, 'tasks.json'))).toBe(true)
    - expect(result.totalTasks).toBe(3) (3 subtasks in mockSimplePRD)
    - expect(result.completedTasks).toBe(3) (all subtasks complete)
    - expect(result.failedTasks).toBe(0)
    - expect(result.finalPhase).toBe('qa_complete')
    - expect(duration).toBeLessThan(30000) (30 seconds)
  - VALIDATE tasks.json:
    - Read file: const tasksJson = JSON.parse(readFileSync(join(result.sessionPath, 'tasks.json'), 'utf-8'))
    - expect(tasksJson.backlog).toBeDefined()
    - expect(tasksJson.backlog).toHaveLength(1) (1 phase)
    - expect(tasksJson.backlog[0].milestones).toHaveLength(1) (1 milestone)
    - expect(tasksJson.backlog[0].milestones[0].tasks).toHaveLength(1) (1 task)
    - expect(tasksJson.backlog[0].milestones[0].tasks[0].subtasks).toHaveLength(3) (3 subtasks)
    - expect(tasksJson.backlog[0].milestones[0].tasks[0].subtasks.every(s => s.status === 'Complete')).toBe(true)
  - VALIDATE git commits:
    - Verify simpleGit().commit() was called (at least once for subtask completion)
    - expect(mockGitInstance.commit).toHaveBeenCalled()
  - LOG timing:
    - console.log(`E2E test completed in ${duration.toFixed(0)}ms`)

Task 8: IMPLEMENT test for PRD snapshot validation
  - TEST: it('should create valid prd_snapshot.md in session directory', async () => { ... })
  - EXECUTE: Run pipeline
  - ASSERTIONS:
    - Read prd_snapshot.md
    - expect(content).toContain('# Test Project') (from mockSimplePRD)
    - expect(content).toContain('## P1: Test Phase')
  - PLACEMENT: Additional test in same describe block

Task 9: IMPLEMENT test for graceful shutdown (optional, if time permits)
  - TEST: it('should handle shutdown gracefully', async () => { ... })
  - MOCK: Simulate SIGINT during execution
  - ASSERTIONS:
    - expect(result.shutdownInterrupted).toBe(true)
    - expect(result.shutdownReason).toBe('SIGINT')
  - PLACEMENT: Optional additional test

Task 10: VERIFY test passes
  - EXECUTE: npm run test:run -- tests/e2e/pipeline.test.ts
  - VERIFY: All tests pass
  - VERIFY: Execution time <30 seconds
  - VERIFY: No test artifacts left in temp directories

Task 11: VERIFY test coverage
  - EXECUTE: npm run test:coverage -- tests/e2e/pipeline.test.ts
  - VERIFY: Coverage report shows expected line coverage
  - GOTCHA: E2E tests may not contribute much to coverage (mostly mocking)
```

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// E2E TEST FILE STRUCTURE
// =============================================================================

/**
 * End-to-end tests for PRPPipeline workflow
 *
 * @remarks
 * Tests validate complete PRPPipeline workflow with all dependencies mocked:
 * - LLM agents (Architect, Researcher, Coder) return predefined responses
 * - MCP tools (Bash, Filesystem, Git) return success
 * - Temporary directories are created and cleaned up for each test
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// =============================================================================
// MOCK PATTERN: Module-level mocking with hoisting
// =============================================================================

// Mock groundswell for createAgent, createPrompt
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Mock agent factory
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createResearcherAgent: vi.fn(),
  createCoderAgent: vi.fn(),
}));

// Mock fs/promises for file operations
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  };
});

// Mock node:fs for existsSync, realpathSync
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  realpathSync: vi.fn((path: unknown) => path as string),
}));

// Mock child_process for BashMCP
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock simple-git for GitMCP
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGitInstance),
  GitError: class MockGitError extends Error {
    name = 'GitError';
    message: string;
    constructor(message: string) {
      super(message);
      this.message = message;
    }
  },
}));

// =============================================================================
// IMPORT MOCKED MODULES
// =============================================================================

import { createAgent, createPrompt } from 'groundswell';
import {
  createArchitectAgent,
  createResearcherAgent,
  createCoderAgent,
} from '../../src/agents/agent-factory.js';
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';
import { mockSimplePRD } from '../fixtures/simple-prd.js';
import type { Backlog, Status } from '../../src/core/models.js';

// =============================================================================
// MOCK FIXTURES
// =============================================================================

// Mock Agent with prompt method
const mockAgent = {
  prompt: vi.fn(),
};

// Mock Prompt object
const mockPrompt = {
  user: '',
  system: '',
  responseFormat: {},
  enableReflection: true,
};

// Setup createAgent to return mock agent
vi.mocked(createAgent).mockReturnValue(mockAgent as never);
vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);

// Mock git instance
const mockGitInstance = {
  status: vi.fn().mockResolvedValue({
    current: 'main',
    files: [],
    is_clean: () => true,
  }),
  diff: vi.fn().mockResolvedValue(''),
  add: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue({
    commit: 'abc123',
    branch: 'main',
  }),
};

// =============================================================================
// MOCK FACTORY: createMockChild for ChildProcess
// =============================================================================

function createMockChild(options: {
  exitCode?: number;
  stdout?: string;
  stderr?: string;
} = {}) {
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
  } as unknown as import('node:child_process').ChildProcess;
}

// =============================================================================
// MOCK FACTORY: createMockBacklog
// =============================================================================

function createMockBacklog(): Backlog {
  return {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        title: 'Test Phase',
        status: 'Complete' as Status,
        description: 'Validate pipeline functionality with minimal complexity',
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Test Milestone',
            status: 'Complete' as Status,
            description: 'Create a simple hello world implementation',
            tasks: [
              {
                id: 'P1.M1.T1',
                type: 'Task',
                title: 'Create Hello World',
                status: 'Complete' as Status,
                description: 'Implement a basic hello world function with tests',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Write Hello World Function',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Simple function implementation\n2. INPUT: None\n3. LOGIC: Create src/hello.ts\n4. OUTPUT: src/hello.ts',
                  },
                  {
                    id: 'P1.M1.T1.S2',
                    type: 'Subtask',
                    title: 'Write Test for Hello World',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Basic unit test\n2. INPUT: hello function\n3. LOGIC: Create tests/hello.test.ts\n4. OUTPUT: tests/hello.test.ts',
                  },
                  {
                    id: 'P1.M1.T1.S3',
                    type: 'Subtask',
                    title: 'Run Test',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S2'],
                    context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test execution\n2. INPUT: hello and test\n3. LOGIC: Run npm test\n4. OUTPUT: Passing test',
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

// =============================================================================
// TEST SUITE: E2E Pipeline Tests
// =============================================================================

describe('E2E Pipeline Tests', () => {
  let tempDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'e2e-pipeline-test-'));
    prdPath = join(tempDir, 'PRD.md');

    // Write PRD file
    writeFileSync(prdPath, mockSimplePRD);

    // Setup agent mocks
    vi.mocked(createArchitectAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createResearcherAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createCoderAgent).mockReturnValue(mockAgent as never);

    // Setup agent prompt to return backlog
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklog() });

    // Setup readFile mock
    vi.mocked(readFile).mockImplementation((path: string) => {
      if (typeof path === 'string' && path.includes('tasks.json')) {
        return Promise.resolve(JSON.stringify(createMockBacklog()));
      }
      if (typeof path === 'string' && path.includes('PRD.md')) {
        return Promise.resolve(mockSimplePRD);
      }
      return Promise.resolve('');
    });

    // Setup existsSync mock
    vi.mocked(existsSync).mockReturnValue(true);

    // Setup spawn mock for BashMCP
    const { spawn } = await import('node:child_process');
    vi.mocked(spawn).mockReturnValue(createMockChild({ stdout: '', exitCode: 0 }) as never);

    // Use real timers for async mock behavior
    vi.useRealTimers();
  });

  afterEach(() => {
    // Cleanup temp directory
    rmSync(tempDir, { recursive: true, force: true });

    // Restore fake timers
    vi.useFakeTimers();
  });

  // =============================================================================
  // TEST: Full Pipeline Workflow
  // =============================================================================

  it('should complete full pipeline workflow successfully', async () => {
    // ARRANGE: All mocks configured in beforeEach

    // ACT: Run pipeline
    const start = performance.now();
    const pipeline = new PRPPipeline(prdPath);
    const result = await pipeline.run();
    const duration = performance.now() - start;

    // ASSERT: Verify result structure
    expect(result.success).toBe(true);
    expect(result.sessionPath).toBeDefined();
    expect(result.totalTasks).toBe(3); // 3 subtasks in mockSimplePRD
    expect(result.completedTasks).toBe(3); // All complete
    expect(result.failedTasks).toBe(0);
    expect(result.finalPhase).toBe('qa_complete');
    expect(result.bugsFound).toBe(0);
    expect(duration).toBeLessThan(30000); // <30 seconds

    // ASSERT: Verify session directory exists
    expect(existsSync(result.sessionPath)).toBe(true);

    // ASSERT: Verify prd_snapshot.md exists
    const prdSnapshotPath = join(result.sessionPath, 'prd_snapshot.md');
    expect(existsSync(prdSnapshotPath)).toBe(true);
    const prdSnapshot = readFileSync(prdSnapshotPath, 'utf-8');
    expect(prdSnapshot).toContain('# Test Project');
    expect(prdSnapshot).toContain('## P1: Test Phase');

    // ASSERT: Verify tasks.json exists and is valid
    const tasksPath = join(result.sessionPath, 'tasks.json');
    expect(existsSync(tasksPath)).toBe(true);
    const tasksJson = JSON.parse(readFileSync(tasksPath, 'utf-8'));
    expect(tasksJson.backlog).toBeDefined();
    expect(tasksJson.backlog).toHaveLength(1);
    expect(tasksJson.backlog[0].id).toBe('P1');

    // ASSERT: Verify all subtasks are Complete
    const subtasks = tasksJson.backlog[0].milestones[0].tasks[0].subtasks;
    expect(subtasks).toHaveLength(3);
    expect(subtasks.every((s: any) => s.status === 'Complete')).toBe(true);

    // ASSERT: Verify git commits were created
    expect(mockGitInstance.commit).toHaveBeenCalled();

    // LOG: Execution time
    console.log(`E2E test completed in ${duration.toFixed(0)}ms`);
  });
});

// =============================================================================
// KEY IMPLEMENTATION DETAILS
// =============================================================================

// 1. MODULE MOCKING WITH HOISTING
// All vi.mock() calls are at top level before imports
// Use vi.importActual() to preserve real exports (MCPHandler from groundswell)

// 2. TYPED MOCK REFERENCES
// vi.mocked(createAgent) provides type-safe mock access
// Use .mockReturnValue(), .mockResolvedValue() for return values

// 3. CHILDPROCESS MOCK FACTORY
// createMockChild() returns realistic ChildProcess with async event emission
// Uses setTimeout to simulate async data emission (5ms data, 10ms close)

// 4. TEMPORARY DIRECTORY MANAGEMENT
// mkdtempSync() creates unique temp dir for each test
// rmSync() in afterEach cleans up recursively with force flag

// 5. REAL TIMERS FOR ASYNC MOCKS
// vi.useRealTimers() allows setTimeout in mocks to work
// vi.useFakeTimers() restores fake timers after test

// 6. FILE SYSTEM MOCKS
// readFile checks path to return different content (tasks.json vs PRD.md)
// existsSync returns true for all paths in this test

// 7. EXECUTION TIME MEASUREMENT
// performance.now() provides millisecond precision
// Assert <30 seconds but log actual duration
```

### Integration Points

```yaml
AGENT_FACTORY:
  - mock: vi.mock('../../src/agents/agent-factory.js')
  - functions: createArchitectAgent, createResearcherAgent, createCoderAgent
  - pattern: Return mockAgent with prompt method

GROUNDSWELL:
  - mock: vi.mock('groundswell')
  - preserve: MCPHandler and other exports via vi.importActual()
  - functions: createAgent, createPrompt

FILE_SYSTEM:
  - mock: vi.mock('node:fs/promises')
  - mock: vi.mock('node:fs')
  - functions: readFile, writeFile, mkdir, existsSync, realpathSync
  - pattern: Check path to return different content

BASH_MCP:
  - mock: vi.mock('node:child_process')
  - function: spawn
  - return: createMockChild({ exitCode: 0, stdout: '' })

GIT_MCP:
  - mock: vi.mock('simple-git')
  - function: simpleGit
  - return: mockGitInstance with status(), diff(), add(), commit()

FIXTURE_IMPORT:
  - file: tests/fixtures/simple-prd.ts
  - export: mockSimplePRD
  - import: import { mockSimplePRD } from '../fixtures/simple-prd.js'

SESSION_MANAGER:
  - reads: PRD.md for hash computation
  - writes: prd_snapshot.md, tasks.json to session directory
  - location: plan/001_14b9dc2a33c7/sessions/
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check E2E test file
npx tsc --noEmit tests/e2e/pipeline.test.ts

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding

# Check file structure
ls -la tests/e2e/pipeline.test.ts
# Expected: File exists
```

### Level 2: Linting and Formatting

```bash
# Run ESLint (if configured)
npm run lint -- tests/e2e/pipeline.test.ts

# Expected: Zero linting errors

# Run Prettier check (if configured)
npm run format:check -- tests/e2e/pipeline.test.ts

# Expected: Zero formatting issues
```

### Level 3: Test Execution (Component Validation)

```bash
# Run E2E test in isolation
npm run test:run -- tests/e2e/pipeline.test.ts

# Expected output:
// ✓ tests/e2e/pipeline.test.ts (1 test)
//   ✓ E2E Pipeline Tests
//     ✓ should complete full pipeline workflow successfully
// E2E test completed in XXXms
//
// Test Files  1 passed (1)
// Tests  1 passed (1)

# Verify execution time is <30 seconds
# Should see "E2E test completed in XXXms" with XXX < 30000

# Run with verbose output for debugging
npm run test:run -- tests/e2e/pipeline.test.ts --reporter=verbose
```

### Level 4: Cleanup Verification (System Validation)

```bash
# Verify no test artifacts left behind
ls /tmp/e2e-pipeline-test*

# Expected: No files match pattern (all cleaned up)

# If temp files exist, check afterEach cleanup:
# - rmSync(tempDir, { recursive: true, force: true }) is called
# - No early returns in test that skip cleanup
```

### Level 5: Full Test Suite Validation

```bash
# Run all tests to ensure no breaking changes
npm run test:run

# Expected: All existing tests still pass
# E2E test should not break any existing tests

# Check coverage for new test
npm run test:coverage -- tests/e2e/pipeline.test.ts

# Expected: Coverage report shows E2E test coverage
```

---

## Final Validation Checklist

### Technical Validation

- [ ] File created at `tests/e2e/pipeline.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/e2e/pipeline.test.ts`
- [ ] All module mocks properly hoisted (vi.mock() at top level)
- [ ] All imports use `.js` extension for ESM compatibility
- [ ] Temporary directory created in beforeEach
- [ ] Temporary directory cleaned up in afterEach
- [ ] Real timers enabled for async mock behavior

### Mock Validation

- [ ] Groundswell mocked with `vi.importActual()` to preserve exports
- [ ] Agent factory mocked (createArchitectAgent, createResearcherAgent, createCoderAgent)
- [ ] fs/promises mocked (readFile, writeFile, mkdir)
- [ ] node:fs mocked (existsSync, realpathSync)
- [ ] node:child_process mocked (spawn)
- [ ] simple-git mocked (simpleGit, GitError)
- [ ] All mocks configured before test execution

### Test Validation

- [ ] Test passes: `npm run test:run -- tests/e2e/pipeline.test.ts`
- [ ] Execution time <30 seconds
- [ ] Session directory created
- [ ] prd_snapshot.md exists and contains correct content
- [ ] tasks.json exists and is valid JSON
- [ ] All subtasks marked Complete
- [ ] Git commits created (mockGitInstance.commit called)
- [ ] No test artifacts left after test completion

### Code Quality Validation

- [ ] Follows existing test patterns from prp-pipeline-integration.test.ts
- [ ] JSDoc comments explain test purpose
- [ ] Test is isolated (no dependencies on other tests)
- [ ] Test name describes what is being validated
- [ ] Console log includes execution time for performance tracking

### Documentation & Sign-Off

- [ ] Research stored in `plan/001_14b9dc2a33c7/P4M4T3S2/research/`
- [ ] PRP document complete
- [ ] Ready for P4.M4.T3.S3 (delta session E2E test) to follow this pattern

---

## Anti-Patterns to Avoid

- ❌ Don't use synchronous file operations in async tests (use await with fs/promises)
- ❌ Don't forget to use `.js` extension for imports (ESM requirement)
- ❌ Don't mock after imports (vi.mock() must be at top level before imports)
- ❌ Don't use fake timers when ChildProcess mocks use setTimeout
- ❌ Don't skip cleanup in afterEach (causes temp directory pollution)
- ❌ Don't use hard-coded temp directory paths (use mkdtempSync for uniqueness)
- ❌ Don't assert exact execution time (tests can be flaky, use < comparison)
- ❌ Don't forget to mock readFile for SessionManager (PRD hash computation)
- ❌ Don't mock SessionManager directly (let PRPPipeline create it)
- ❌ Don't forget to mock all agent types (Architect, Researcher, Coder)
- ❌ Don't use real LLM calls (all agents must be mocked for fast execution)
- ❌ Don't use real file system operations (all I/O must be mocked)
- ❌ Don't use real git operations (all git calls must be mocked)
- ❌ Don't skip validation of tasks.json structure (critical for state persistence)
- ❌ Don't forget to validate git commits (important for smart commit workflow)

---

## Confidence Score

**10/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ Existing integration tests provide complete mock patterns to follow
- ✅ PRPPipeline interface is well-documented with clear method signatures
- ✅ Test fixture (mockSimplePRD) provides known input structure
- ✅ Temp directory management pattern is established in existing tests
- ✅ All mock patterns are documented with working examples
- ✅ Task is straightforward (create one test file with known patterns)
- ✅ No external dependencies or complex logic required
- ✅ Validation commands are simple and direct
- ✅ Gotchas and anti-patterns are well-documented

**Validation**: This PRP provides:
1. Complete mock patterns from existing working tests
2. Exact file paths and import patterns
3. PRPPipeline constructor and method signatures
4. Temporary directory management with cleanup
5. Comprehensive assertion checklist
6. Known gotchas and anti-patterns to avoid
7. Clear success criteria with validation commands

The risk is minimal because:
1. Creating an E2E test is a straightforward task
2. All mock patterns are copied from existing working tests
3. Test fixture provides known input structure
4. No complex logic or external dependencies
5. Existing patterns provide clear guidance
6. Validation is simple (test passes or fails)

---

## Research Notes

### Stored Research

The following research findings have been stored in `plan/001_14b9dc2a33c7/P4M4T3S2/research/`:

1. **Vitest E2E Testing Patterns** (from research agent)
   - Test structure for complete workflows
   - Mocking LLM/API calls in E2E tests
   - Temporary directory management and cleanup
   - Test isolation patterns
   - Measuring execution time in tests

2. **TypeScript Mocking Patterns** (from research agent)
   - Mocking multiple agent types
   - Mocking file system operations
   - Mocking git operations
   - Mock validation and test execution
   - vi.mock() vs vi.spyOn() patterns

3. **Existing Test Patterns** (from codebase exploration)
   - `tests/integration/prp-pipeline-integration.test.ts`: Pipeline test patterns
   - `tests/integration/agents.test.ts`: Groundswell agent mocking
   - `tests/integration/tools.test.ts`: MCP tool mocking

4. **PRPPipeline Implementation** (from codebase exploration)
   - Constructor parameters and method signatures
   - SessionManager creation in run() method
   - PipelineResult interface structure
   - Workflow phases: Initialize → Decompose → Execute → Complete

### External Resources

Due to rate limiting on web search tools, comprehensive information has been compiled based on:
- Official Vitest documentation (https://vitest.dev/guide/mocking.html)
- Official Vitest API reference (https://vitest.dev/api/)
- Project-specific test patterns and conventions
- Groundswell library integration patterns

### Key Insights

1. **Module Mocking Must Be Hoisted**: All `vi.mock()` calls must be at top level before imports due to hoisting
2. **ESM Imports Need .js Extension**: Vitest uses ESM, imports must use .js extension even for .ts files
3. **ChildProcess Mocks Need Async Behavior**: Use `setTimeout` to simulate async event emission
4. **SessionManager Created in run()**: Not in constructor, must account for this in test setup
5. **Real Timers Required for Async Mocks**: Use `vi.useRealTimers()` when mocks use `setTimeout`
