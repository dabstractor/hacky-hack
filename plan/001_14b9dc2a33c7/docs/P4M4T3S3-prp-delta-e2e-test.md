# Product Requirement Prompt (PRP): Create Delta Session E2E Test

**Work Item**: P4.M4.T3.S3 - Create delta session E2E test
**Status**: Research Complete -> Ready for Implementation

---

## Goal

**Feature Goal**: Create an end-to-end test file at `tests/e2e/delta.test.ts` that validates the delta session workflow (Initial session → PRD modification → Delta session → Patched backlog) using mocked LLM responses, MCP tools, and temporary test directories. The test must complete in under 30 seconds with comprehensive assertions for parent session references and task preservation.

**Deliverable**: E2E test file `tests/e2e/delta.test.ts` with:

- Two-phase workflow: Initial PRPPipeline run with PRD v1, then modified PRD v2 run
- Modified PRD fixture (mockSimplePRDv2) with new requirements
- Mocked DeltaAnalysisWorkflow returning predefined delta changes
- Mocked Architect, Researcher, Coder, and QA agents returning predefined success responses
- Mocked MCP tools (BashMCP, FilesystemMCP, GitMCP) returning success
- Temporary test session directories for both initial and delta sessions
- Assertions for delta session creation, parent session reference, patched backlog, new task addition, and original task preservation
- Execution time measurement (<30 seconds target)

**Success Definition**:

- E2E test file exists at `tests/e2e/delta.test.ts`
- Test validates delta session workflow: Initial run → PRD modification → Delta run
- Initial session created with PRD v1 and tasks completed
- PRD v2 modification triggers delta detection
- Delta session created with parent_session.txt referencing initial session
- Backlog patched with new task for new requirement
- Original completed tasks preserved in backlog
- All agent calls (Architect, Researcher, Coder, QA) are mocked
- All MCP tools are mocked to return success
- Test artifacts are cleaned up after execution
- Execution time is measured and completes in <30 seconds
- Test passes when run: `npm run test:run -- tests/e2e/delta.test.ts`

## User Persona (if applicable)

**Target User**: PRPPipeline developers and CI/CD system (automated validation)

**Use Case**: The delta session E2E test enables:

1. Full workflow validation of delta session creation and handling
2. Regression detection for delta analysis and task patching logic
3. Fast feedback during development with mocked dependencies
4. CI/CD integration for automated delta session validation

**User Journey**:

1. Developer makes changes to delta session handling or task patching logic
2. E2E test runs in CI/CD or locally
3. Test creates initial session with PRD v1 and mocks all dependencies
4. PRPPipeline processes PRD v1 through complete workflow
5. Test validates initial session creation and task completion
6. Test modifies PRD to PRD v2 with new requirement
7. Test runs PRPPipeline again with modified PRD
8. Test validates delta session creation, parent reference, and patched backlog
9. Test cleans up temporary files
10. Developer gets fast feedback (<30 seconds) on delta session health

**Pain Points Addressed**:

- **No Delta Session E2E Test**: Existing tests don't validate complete delta workflow end-to-end
- **Slow Feedback**: Real LLM calls make delta testing slow and expensive
- **Flaky Tests**: Session state persistence can cause test pollution between runs
- **No Regression Detection**: Delta analysis changes can break workflows without detection

## Why

- **Regression Prevention**: E2E test catches breaking changes in delta session workflow
- **Fast Development Cycle**: Mocked dependencies enable rapid iteration without LLM costs
- **CI/CD Integration**: Automated validation on every commit
- **Complete Coverage**: Tests all delta phases with realistic mock data
- **Builds on Previous Work**: P4.M4.T3.S1 provides `mockSimplePRD` fixture, P4.M4.T3.S2 provides E2E test patterns

## What

### Input

- **Test PRD Fixture v1** (from P4.M4.T3.S1):
  - `tests/fixtures/simple-prd.ts` with `mockSimplePRD` export
  - Minimal valid PRD with 1 Phase, 1 Milestone, 1 Task, 3 Subtasks

- **Test PRD Fixture v2** (to be created):
  - `tests/fixtures/simple-prd-v2.ts` with `mockSimplePRDv2` export
  - Modified PRD with 1 new Task (P1.M1.T2) and 1 modified subtask (P1.M1.T1.S1 story_points changed from 1 to 2)
  - Expected to trigger delta detection

- **Existing Test Patterns**:
  - `tests/e2e/pipeline.test.ts` (from P4.M4.T3.S2 - E2E test patterns)
  - `tests/integration/prp-pipeline-integration.test.ts` (pipeline test patterns)
  - `tests/integration/agents.test.ts` (Groundswell agent mocking)
  - `tests/integration/tools.test.ts` (MCP tool mocking)
  - `tests/unit/session-manager.test.ts` (delta session creation patterns)

- **Test Framework**:
  - Vitest with `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`
  - Configuration at `vitest.config.ts` with 100% coverage requirements

### State Changes

- **Create** `tests/fixtures/simple-prd-v2.ts` with modified PRD fixture
- **Create** `tests/e2e/delta.test.ts` with two-phase delta workflow test
- **Mock** all agent factory functions (`createArchitectAgent`, `createResearcherAgent`, `createCoderAgent`, `createQAAgent`)
- **Mock** DeltaAnalysisWorkflow to return predefined DeltaAnalysis
- **Mock** all MCP tools (`execute_bash`, `file_read`, `file_write`, `git_status`, `git_commit`)
- **Use** `mkdtempSync()` and `rmSync()` for temporary directory management
- **Import** `mockSimplePRD` from `tests/fixtures/simple-prd.ts`
- **Import** `mockSimplePRDv2` from `tests/fixtures/simple-prd-v2.ts`

### Output

- **Modified PRD Fixture**: `tests/fixtures/simple-prd-v2.ts`
- **E2E Test File**: `tests/e2e/delta.test.ts`
- **Test Coverage**: Full delta session workflow validation
- **Execution Time**: <30 seconds with mocked dependencies
- **Assertions**: Initial session, delta session, parent reference, patched backlog, new tasks, preserved tasks

### Success Criteria

- [ ] Modified PRD fixture created at `tests/fixtures/simple-prd-v2.ts`
- [ ] E2E test file created at `tests/e2e/delta.test.ts`
- [ ] Test imports both PRD fixtures (v1 and v2)
- [ ] Test mocks all agents (Architect, Researcher, Coder, QA)
- [ ] Test mocks DeltaAnalysisWorkflow
- [ ] Test mocks BashMCP, FilesystemMCP, and GitMCP tools
- [ ] Test creates temporary directory with `mkdtempSync()`
- [ ] Test cleans up artifacts with `rmSync()` in afterEach
- [ ] Test validates initial session creation with PRD v1
- [ ] Test validates delta session creation with PRD v2
- [ ] Test validates parent_session.txt references initial session
- [ ] Test validates patched backlog has new task for new requirement
- [ ] Test validates original completed tasks preserved in backlog
- [ ] Test measures and logs execution time
- [ ] Test completes in <30 seconds
- [ ] Test passes: `npm run test:run -- tests/e2e/delta.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement the delta session E2E test successfully?

**Answer**: **YES** - This PRP provides:

- Complete delta session implementation details from SessionManager
- Exact file paths and import patterns
- PRPPipeline delta detection and handling workflow
- Test fixture locations and PRD v2 content specification
- DeltaAnalysis mock patterns and DeltaAnalysis interface
- Temporary directory management patterns
- Assertion patterns and validation commands
- Known gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - Delta Session Implementation
- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: Delta session creation, parent reference handling, session state management
  pattern: createDeltaSession() method, parent_session.txt file, DeltaSession interface
  critical: Lines 304-369 (createDeltaSession), 825-833 (hasSessionChanged)
  gotcha: Delta session ID increments sequence (001 -> 002), parent stored in metadata and file

# MUST READ - PRPPipeline Delta Handling
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: PRPPipeline delta detection and handling workflow
  pattern: handleDelta() method, delta session initialization
  critical: Lines 264-289 (initializeSession with delta check), 319-411 (handleDelta)
  gotcha: SessionManager created in run(), not constructor (line 968)

# MUST READ - Delta Analysis Interface
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: DeltaAnalysis, DeltaSession, RequirementChange interfaces
  pattern: Interface definitions for delta analysis results
  critical: Lines 200-250 (DeltaAnalysis, DeltaSession, RequirementChange)
  gotcha: DeltaAnalysis includes changes[], patchInstructions, taskIds[]

# MUST READ - Delta Analysis Workflow
- file: /home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts
  why: DeltaAnalysisWorkflow class for analyzing PRD differences
  pattern: analyzeDelta() method, QA agent usage
  critical: Lines 50-120 (analyzeDelta method), constructor signature
  gotcha: Takes oldPRD, newPRD, completedTaskIds as constructor params

# MUST READ - E2E Test Pattern (from P4.M4.T3.S2)
- file: /home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts
  why: Complete E2E test pattern to follow
  pattern: Module mocking, beforeEach/afterEach, temp directory management
  critical: All sections - this is the reference for delta.test.ts structure
  gotcha: Use .js extension for imports, vi.mock() must be at top level

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

# MUST READ - Test PRD Fixture v1
- file: /home/dustin/projects/hacky-hack/tests/fixtures/simple-prd.ts
  why: Base PRD structure for creating PRD v2
  pattern: Template literal with markdown content, JSDoc documentation
  critical: Lines 22-83 (PRD content), 1 Phase, 1 Milestone, 1 Task, 3 Subtasks
  gotcha: Import as `import { mockSimplePRD } from '../fixtures/simple-prd.js'`

# MUST READ - Delta Session Test Pattern
- file: /home/dustin/projects/hacky-hack/tests/unit/session-manager.test.ts
  why: Delta session creation test patterns
  pattern: createDeltaSession() testing, parent reference validation
  critical: Lines 300-400 (delta session tests)
  gotcha: Mock readFile for PRD content, validate parent_session.txt

# MUST READ - Task Patcher Implementation
- file: /home/dustin/projects/hacky-hack/src/core/task-patcher.ts
  why: patchBacklog() function for applying delta changes
  pattern: Change type handling (modified, removed, added)
  critical: Lines 20-80 (patchBacklog function)
  gotcha: Modified tasks reset to 'Planned', removed tasks set to 'Obsolete'

# REFERENCE - Vitest Configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test framework configuration, coverage thresholds, path aliases
  pattern: describe/it/expect/vi globals, 100% coverage required
  critical: Lines 7-14 (include patterns), 15-24 (coverage thresholds)
  gotcha: Use .js extension for imports (ESM build)

# REFERENCE - Delta Mock Data
- file: /home/dustin/projects/hacky-hack/tests/fixtures/mock-delta-data.ts
  why: Mock PRD pairs for delta analysis testing
  pattern: mockOldPRD, mockNewPRD, mockCompletedTaskIds
  critical: All exports - examples of PRD modifications
  gotcha: Use as reference for creating mockSimplePRDv2

# RESEARCH - Vitest E2E Testing
- url: https://vitest.dev/guide/mocking.html
  why: Official vi.mock(), vi.fn(), vi.mocked() documentation
  section: Module Mocking, vi.mocked() for type safety

- url: https://vitest.dev/api/
  why: Complete Vitest API reference (describe, it, expect, vi, beforeEach, afterEach)
  section: Test Context API

# RESEARCH - Multi-Run Workflow Testing
- stored: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P4M4T3S2/research/vitest-e2e-testing-research.md
  why: Research on testing stateful workflows with multiple runs
  section: Multi-Run Workflow Testing Patterns, State Persistence Verification
  critical: Patterns for sequential test phases with shared state
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                             # Test scripts: test, test:run, test:coverage
├── vitest.config.ts                         # Test runner configuration
├── src/
│   ├── workflows/
│   │   ├── prp-pipeline.ts                  # PRPPipeline class with delta handling
│   │   └── delta-analysis-workflow.ts       # DeltaAnalysisWorkflow for PRD diff analysis
│   ├── core/
│   │   ├── session-manager.ts               # SessionManager with createDeltaSession()
│   │   ├── task-orchestrator.ts             # TaskOrchestrator for backlog execution
│   │   ├── task-patcher.ts                  # patchBacklog() for applying delta changes
│   │   └── models.ts                        # Backlog, DeltaAnalysis, DeltaSession types
│   └── agents/
│       ├── agent-factory.ts                 # createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent
│       ├── prp-generator.ts                 # PRPGenerator (calls Researcher agent)
│       └── prp-executor.ts                  # PRPExecutor (calls Coder agent)
├── tests/
│   ├── fixtures/
│   │   ├── simple-prd.ts                    # EXPORT: mockSimplePRD (base PRD)
│   │   └── mock-delta-data.ts               # REFERENCE: Delta mock data patterns
│   ├── integration/
│   │   ├── prp-pipeline-integration.test.ts # REFERENCE: Pipeline test patterns
│   │   ├── agents.test.ts                   # REFERENCE: Agent mocking patterns
│   │   └── tools.test.ts                    # REFERENCE: MCP tool mocking patterns
│   ├── unit/
│   │   └── session-manager.test.ts          # REFERENCE: Delta session test patterns
│   └── e2e/
│       └── pipeline.test.ts                 # REFERENCE: E2E test pattern from P4.M4.T3.S2
└── plan/
    └── 001_14b9dc2a33c7/
        ├── architecture/
        │   └── system_context.md            # Task hierarchy specification
        ├── P4M4T3S2/
        │   ├── PRP.md                        # REFERENCE: E2E pipeline test PRP
        │   └── research/                     # Research on E2E testing patterns
        └── P4M4T3S3/
            └── PRP.md                        # THIS DOCUMENT
```

### Desired Codebase Tree (files to add)

```bash
tests/
├── fixtures/
│   └── simple-prd-v2.ts                     # CREATE: Modified PRD fixture with new task
│       # Export: mockSimplePRDv2
│       # Changes: Add P1.M1.T2 (new task), modify P1.M1.T1.S1 story_points (1 -> 2)
└── e2e/
    └── delta.test.ts                        # CREATE: Delta session E2E test
        # Import: mockSimplePRD from '../fixtures/simple-prd.js'
        # Import: mockSimplePRDv2 from '../fixtures/simple-prd-v2.js'
        # Mock: createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent
        # Mock: DeltaAnalysisWorkflow
        # Mock: BashMCP, FilesystemMCP, GitMCP tools
        # Test: Initial run with PRD v1, then delta run with PRD v2
        # Assert: Initial session, delta session, parent reference, patched backlog
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Delta Session Sequence Increment
// Delta sessions increment the sequence number (001 -> 002 -> 003)
// Pattern: SessionManager.getNextSequence() in createDeltaSession()
// Gotcha: Test must expect session ID to change between runs

// CRITICAL: Parent Session Reference Storage
// Parent session ID stored in TWO places: metadata and parent_session.txt file
// Pattern: session.metadata.parentSession + writeFileSync(parent_session.txt)
// Gotcha: Test must validate BOTH locations for complete verification

// CRITICAL: Hash-Based Delta Detection
// Delta detection uses SHA-256 hash of PRD content
// Pattern: hashPRD() in SessionManager, compared via hasSessionChanged()
// Gotcha: ANY content change in PRD triggers delta, even whitespace

// CRITICAL: PRPPipeline Creates SessionManager in run() Method
// SessionManager is NOT created in constructor, but in run() at line 968
// Pattern: Don't expect SessionManager to exist before calling pipeline.run()
// Gotcha: Accessing pipeline.sessionManager before run() will throw null error

// CRITICAL: DeltaAnalysisWorkflow Must Be Mocked
// Real DeltaAnalysisWorkflow calls QA agent (slow/expensive)
// Pattern: vi.mock('../../src/workflows/delta-analysis-workflow.js')
// Gotcha: Forgetting to mock this will cause real LLM calls

// CRITICAL: Mock readFile for Different PRD Content
// SessionManager reads PRD file for each run, must return different content
// Pattern: Mock readFile to check path and return PRD v1 or v2 accordingly
// Gotcha: Using same mock return for both runs will prevent delta detection

// CRITICAL: PRD v2 Must Have Meaningful Changes
// Changes like whitespace-only may not trigger task patching
// Pattern: Add new task (P1.M1.T2) or modify existing (story_points change)
// Gotcha: Minimal changes might not generate delta analysis results

// CRITICAL: Task Status After Patching
// Modified tasks reset to 'Planned', removed tasks set to 'Obsolete'
// Pattern: Check task status in patched backlog matches expected
// Gotcha: Don't expect all tasks to remain 'Complete' after delta

// CRITICAL: Completed Task Preservation
// Original completed tasks should be preserved in patched backlog
// Pattern: Verify unchanged tasks still have 'Complete' status
// Gotcha: Task patcher only modifies tasks in delta.taskIds

// CRITICAL: Two-Phase Test Execution
// Test must run PRPPipeline twice: initial run + delta run
// Pattern: Store initial result, modify PRD, run again, compare
// Gotcha: Don't clean up temp dir between runs (need same directory for delta)

// CRITICAL: DeltaAnalysis Mock Response Structure
// DeltaAnalysis includes changes[], patchInstructions, taskIds[]
// Pattern: Mock analyzeDelta() to return DeltaAnalysis interface
// Gotcha: Must include at least one change in taskIds for patching to occur

// CRITICAL: Temporary Directory Persistence Between Runs
// Delta run needs access to initial session directory
// Pattern: Create one temp dir, use for both runs, cleanup after both
// Gotcha: Creating new temp dir for delta run prevents parent reference

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

// CRITICAL: Mock ChildProcess Async Behavior
// ChildProcess emits events asynchronously, must simulate with setTimeout
// Pattern: setTimeout(() => callback(Buffer.from(stdout)), 5) in mock
// Gotcha: If events are synchronous, test may complete before callbacks fire

// CRITICAL: Mock DeltaAnalysisWorkflow with QA Agent
// DeltaAnalysisWorkflow uses QA agent for analysis
// Pattern: Mock both DeltaAnalysisWorkflow and createQAAgent
// Gotcha: Forgetting to mock QA agent will cause real LLM calls

// CRITICAL: Real Timers for Async Mock Behavior
// Mock ChildProcess uses setTimeout for async event emission
// Pattern: vi.useRealTimers() in test before running pipeline
// Gotcha: Restore fake timers with vi.useFakeTimers() in afterEach

// CRITICAL: Execution Time Measurement
// Use performance.now() for millisecond precision timing
// Pattern: const start = performance.now(); await pipeline.run(); const duration = performance.now() - start
// Gotcha: Log duration but don't assert exact time (tests can be flaky with timing)

// CRITICAL: Test Isolation
// Each test should have unique temp directory to avoid conflicts
// Pattern: Include random number in temp dir path: mkdtempSync(join(tmpdir(), `e2e-delta-${Date.now()}-`))
// Gotcha: Parallel tests can conflict if using same temp directory name

// CRITICAL: Avoid Environment Variable Pollution
// Tests should stub env vars and restore after each test
// Pattern: beforeEach(() => vi.stubEnv('KEY', 'value')), afterEach(() => vi.unstubAllEnvs())
// Gotcha: Failing to restore env can affect other tests
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// DeltaAnalysis interface (from src/core/models.ts)
interface DeltaAnalysis {
  readonly changes: RequirementChange[]; // Individual requirement changes
  readonly patchInstructions: string; // Re-execution guide for patched tasks
  readonly taskIds: string[]; // Task IDs affected by changes
}

// RequirementChange interface (from src/core/models.ts)
interface RequirementChange {
  readonly type: 'added' | 'modified' | 'removed';
  readonly itemId: string;
  readonly description: string;
  readonly impact: string;
}

// DeltaSession interface (from src/core/models.ts)
interface DeltaSession extends SessionState {
  readonly oldPRD: string; // Original PRD content
  readonly newPRD: string; // Modified PRD content
  readonly diffSummary: string; // Human-readable changes summary
}

// Backlog structure (from src/core/models.ts)
interface Backlog {
  backlog: Phase[];
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/fixtures/simple-prd-v2.ts
  - IMPLEMENT: Modified PRD fixture exported as mockSimplePRDv2
  - CONTENT: Start with mockSimplePRD, add P1.M1.T2 (new task), modify P1.M1.T1.S1 (story_points: 1 -> 2)
  - STRUCTURE: 1 Phase, 1 Milestone, 2 Tasks (P1.M1.T1 original + P1.M1.T2 new)
  - FOLLOW pattern: tests/fixtures/simple-prd.ts (format, JSDoc, export style)
  - NAMING: mockSimplePRDv2 export, clear JSDoc documenting changes
  - PLACEMENT: tests/fixtures/simple-prd-v2.ts

Task 2: CREATE tests/e2e/delta.test.ts with imports and mocks
  - IMPLEMENT: Delta E2E test file with module-level mocks
  - MOCK patterns:
    - vi.mock('groundswell') for createAgent, createPrompt
    - vi.mock('../../src/agents/agent-factory.js') for all agent creators
    - vi.mock('../../src/workflows/delta-analysis-workflow.js') for DeltaAnalysisWorkflow
    - vi.mock('node:fs/promises') for readFile, writeFile
    - vi.mock('node:fs') for existsSync, realpathSync
    - vi.mock('node:child_process') for spawn (BashMCP)
    - vi.mock('simple-git') for simpleGit (GitMCP)
  - IMPORT after mocking:
    - describe, it, expect, vi, beforeEach, afterEach from 'vitest'
    - PRPPipeline from '../../src/workflows/prp-pipeline.js'
    - mockSimplePRD from '../fixtures/simple-prd.js'
    - mockSimplePRDv2 from '../fixtures/simple-prd-v2.js'
    - readFile, writeFile, mkdir from 'node:fs/promises'
    - mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync from 'node:fs'
    - join from 'node:path'
    - tmpdir from 'node:os'
    - createAgent, createPrompt from 'groundswell'
    - All agent creators from '../../src/agents/agent-factory.js'
    - DeltaAnalysisWorkflow from '../../src/workflows/delta-analysis-workflow.js'
  - PLACEMENT: tests/e2e/delta.test.ts

Task 3: IMPLEMENT mock fixture factory for Backlog (v1 and v2)
  - IMPLEMENT: createMockBacklogV1() helper returning backlog for PRD v1 (3 subtasks)
  - IMPLEMENT: createMockBacklogV2() helper returning backlog for PRD v2 (4 subtasks + 1 modified)
  - STRUCTURE v1: 1 Phase (P1), 1 Milestone (P1.M1), 1 Task (P1.M1.T1), 3 Subtasks (P1.M1.T1.S1-S3)
  - STRUCTURE v2: 1 Phase (P1), 1 Milestone (P1.M1), 2 Tasks (P1.M1.T1, P1.M1.T2), 4 Subtasks total
  - STATUS v1: All subtasks 'Complete' after initial run
  - STATUS v2: Original subtasks 'Complete', new subtask 'Planned'
  - PATTERN: Follow exact structure from tests/fixtures/simple-prd.ts
  - GOTCHA: P1.M1.T1.S1 story_points changed from 1 to 2 in v2

Task 4: IMPLEMENT mock agent fixtures
  - IMPLEMENT: Mock Agent object with prompt method
  - PROMPT method: vi.fn().mockResolvedValue()
  - ARCHITECT mock: Returns { backlog: createMockBacklogV1() } for initial, { backlog: createMockBacklogV2() } for delta
  - RESEARCHER mock: Returns PRP document (for PRP generation)
  - CODER mock: Returns success (for PRP execution)
  - QA mock: Returns DeltaAnalysis (for delta analysis)
  - PLACEMENT: Top-level before describe block

Task 5: IMPLEMENT mock DeltaAnalysisWorkflow
  - IMPLEMENT: Mock DeltaAnalysisWorkflow class with analyzeDelta method
  - ANALYZEDELTA method: vi.fn().mockResolvedValue()
  - RETURN: DeltaAnalysis with one 'added' change (P1.M1.T2) and one 'modified' change (P1.M1.T1.S1)
  - MOCK: vi.mock('../../src/workflows/delta-analysis-workflow.js')
  - PLACEMENT: Module-level mock before imports

Task 6: IMPLEMENT createMockChild helper for BashMCP
  - IMPLEMENT: ChildProcess mock factory (follow tools.test.ts pattern)
  - RETURNS: Mock ChildProcess with stdout.on(), stderr.on(), on() for 'close' event
  - BEHAVIOR: setTimeout for async data emission (5ms for data, 10ms for close)
  - PARAMETERS: { exitCode, stdout, stderr } with defaults
  - PLACEMENT: Helper function before describe block

Task 7: IMPLEMENT test suite structure with beforeEach/afterEach
  - IMPLEMENT: describe('E2E Delta Session Tests', () => { ... })
  - BEFOREEACH:
    - vi.clearAllMocks() to reset all mock calls
    - Create temp directory: mkdtempSync(join(tmpdir(), 'e2e-delta-test-'))
    - Setup mocked agents to return success
    - Setup mock readFile to return PRD v1 or v2 based on path/content
    - Setup mock existsSync to return true for directory validation
    - Setup mock spawn (BashMCP) to return successful ChildProcess
    - Setup mock simpleGit (GitMCP) to return successful git operations
    - vi.useRealTimers() for async mock behavior
  - AFTEREACH:
    - Cleanup temp directory: rmSync(tempDir, { recursive: true, force: true })
    - vi.useFakeTimers() to restore fake timers
  - PLACEMENT: Inside describe block

Task 8: IMPLEMENT main E2E test: delta session workflow
  - TEST: it('should complete delta session workflow successfully', async () => { ... })
  - SETUP PHASE 1 (Initial Run):
    - Write PRD v1 to temp dir: writeFileSync(prdPath, mockSimplePRD)
    - Mock readFile to return mockSimplePRD
    - Mock architect agent to return createMockBacklogV1()
  - EXECUTE PHASE 1 (Initial Run):
    - Create pipeline: const pipeline1 = new PRPPipeline(prdPath)
    - Run pipeline: const result1 = await pipeline1.run()
  - ASSERT PHASE 1 (Initial Run):
    - expect(result1.success).toBe(true)
    - expect(result1.sessionPath).toBeDefined()
    - expect(existsSync(result1.sessionPath)).toBe(true)
    - Validate tasks.json has 3 subtasks, all 'Complete'
  - SETUP PHASE 2 (Delta Run):
    - Write PRD v2 to temp dir: writeFileSync(prdPath, mockSimplePRDv2)
    - Mock readFile to return mockSimplePRDv2
    - Mock architect agent to return createMockBacklogV2()
    - Mock DeltaAnalysisWorkflow.analyzeDelta to return DeltaAnalysis with changes
  - EXECUTE PHASE 2 (Delta Run):
    - Create pipeline: const pipeline2 = new PRPPipeline(prdPath)
    - Run pipeline: const result2 = await pipeline2.run()
  - ASSERT PHASE 2 (Delta Run):
    - expect(result2.success).toBe(true)
    - expect(result2.sessionPath).toBeDefined()
    - expect(result2.sessionPath).not.toBe(result1.sessionPath) (different session)
    - Validate parent_session.txt exists and contains initial session ID
    - Validate tasks.json has 4 subtasks (3 original + 1 new)
    - Validate original subtasks still 'Complete'
    - Validate new subtask 'Planned' or 'Complete' (depending on execution)
  - PLACEMENT: Main test in describe block

Task 9: IMPLEMENT test for parent session reference
  - TEST: it('should create parent_session.txt referencing initial session', async () => { ... })
  - EXECUTE: Run both phases (initial + delta)
  - ASSERTIONS:
    - Read parent_session.txt from delta session
    - expect(content).toBe(initialSessionId)
    - Validate session metadata includes parentSession field
  - PLACEMENT: Additional test in same describe block

Task 10: IMPLEMENT test for task preservation
  - TEST: it('should preserve original completed tasks in delta session', async () => { ... })
  - EXECUTE: Run both phases (initial + delta)
  - ASSERTIONS:
    - Compare initial backlog vs delta backlog
    - expect(originalTasks).toHaveLength(3)
    - expect(deltaTasks).toHaveLength(4) (3 original + 1 new)
    - Validate original task IDs exist in delta backlog
    - Validate original tasks still 'Complete'
  - PLACEMENT: Additional test in same describe block

Task 11: VERIFY test passes
  - EXECUTE: npm run test:run -- tests/e2e/delta.test.ts
  - VERIFY: All tests pass
  - VERIFY: Execution time <30 seconds
  - VERIFY: No test artifacts left in temp directories

Task 12: VERIFY test coverage
  - EXECUTE: npm run test:coverage -- tests/e2e/delta.test.ts
  - VERIFY: Coverage report shows expected line coverage
  - GOTCHA: E2E tests may not contribute much to coverage (mostly mocking)
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// MODIFIED PRD FIXTURE (tests/fixtures/simple-prd-v2.ts)
// =============================================================================

/**
 * Mock modified PRD for delta session E2E testing
 *
 * @remarks
 * Modified version of mockSimplePRD that adds new functionality to test
 * delta detection and session management.
 *
 * **Changes from v1**:
 * - Added P1.M1.T2: Add Calculator Functions (new task with 1 subtask)
 * - Modified P1.M1.T1.S1 story_points from 1 to 2
 *
 * **Usage**:
 * ```typescript
 * import { mockSimplePRDv2 } from '../fixtures/simple-prd-v2.js';
 *
 * // Write to file for delta testing
 * writeFileSync(prdPath, mockSimplePRDv2);
 * ```
 */
export const mockSimplePRDv2 = `
# Test Project

A minimal project for fast E2E pipeline testing.

## P1: Test Phase

Validate pipeline functionality with minimal complexity.

### P1.M1: Test Milestone

Create a simple hello world implementation.

#### P1.M1.T1: Create Hello World

Implement a basic hello world function with tests.

##### P1.M1.T1.S1: Write Hello World Function

Create a simple hello world function with enhanced features.

**story_points**: 2
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Enhanced function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!" with type annotations
4. OUTPUT: src/hello.ts with exported hello function

##### P1.M1.T1.S2: Write Test for Hello World

Create a test for the hello world function.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S1"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic unit test
2. INPUT: hello function from P1.M1.T1.S1
3. LOGIC: Create tests/hello.test.ts that tests hello() returns "Hello, World!"
4. OUTPUT: tests/hello.test.ts with passing test

##### P1.M1.T1.S3: Run Test

Validate the implementation works.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S2"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Test execution validation
2. INPUT: hello function and test from previous subtasks
3. LOGIC: Run npm test to verify test passes
4. OUTPUT: Passing test result

#### P1.M1.T2: Add Calculator Functions

Implement basic calculator operations for additional functionality.

**story_points**: 3
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Calculator implementation
2. INPUT: None
3. LOGIC: Create src/calculator.ts with add(), subtract(), multiply(), divide() functions
4. OUTPUT: src/calculator.ts with exported calculator functions
`;

// =============================================================================
// DELTA E2E TEST FILE STRUCTURE
// =============================================================================

/**
 * End-to-end tests for delta session workflow
 *
 * @remarks
 * Tests validate complete delta session workflow:
 * 1. Initial PRPPipeline run with PRD v1
 * 2. PRD modification to PRD v2
 * 3. Delta PRPPipeline run with PRD v2
 * 4. Validation of delta session, parent reference, and patched backlog
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
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

// Mock agent factory (all agents including QA)
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createResearcherAgent: vi.fn(),
  createCoderAgent: vi.fn(),
  createQAAgent: vi.fn(),
}));

// Mock DeltaAnalysisWorkflow
vi.mock('../../src/workflows/delta-analysis-workflow.js', () => ({
  DeltaAnalysisWorkflow: vi.fn(),
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
  createQAAgent,
} from '../../src/agents/agent-factory.js';
import { PRPPipeline } from '../../src/workflows/prp-pipeline.js';
import { DeltaAnalysisWorkflow } from '../../src/workflows/delta-analysis-workflow.js';
import { mockSimplePRD } from '../fixtures/simple-prd.js';
import { mockSimplePRDv2 } from '../fixtures/simple-prd-v2.js';
import type { Backlog, Status, DeltaAnalysis } from '../../src/core/models.js';

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
// MOCK FACTORY: createMockBacklogV1 (3 subtasks, all Complete)
// =============================================================================

function createMockBacklogV1(): Backlog {
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
                description:
                  'Implement a basic hello world function with tests',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Write Hello World Function',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: [],
                    context_scope: '...',
                  },
                  {
                    id: 'P1.M1.T1.S2',
                    type: 'Subtask',
                    title: 'Write Test for Hello World',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope: '...',
                  },
                  {
                    id: 'P1.M1.T1.S3',
                    type: 'Subtask',
                    title: 'Run Test',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S2'],
                    context_scope: '...',
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
// MOCK FACTORY: createMockBacklogV2 (4 subtasks, 3 Complete + 1 Planned)
// =============================================================================

function createMockBacklogV2(): Backlog {
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
                description:
                  'Implement a basic hello world function with tests',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Write Hello World Function',
                    status: 'Complete' as Status,
                    story_points: 2, // CHANGED from 1
                    dependencies: [],
                    context_scope: '...',
                  },
                  {
                    id: 'P1.M1.T1.S2',
                    type: 'Subtask',
                    title: 'Write Test for Hello World',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope: '...',
                  },
                  {
                    id: 'P1.M1.T1.S3',
                    type: 'Subtask',
                    title: 'Run Test',
                    status: 'Complete' as Status,
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S2'],
                    context_scope: '...',
                  },
                ],
              },
              {
                id: 'P1.M1.T2',
                type: 'Task',
                title: 'Add Calculator Functions',
                status: 'Planned' as Status, // NEW task
                description: 'Implement basic calculator operations',
                subtasks: [
                  {
                    id: 'P1.M1.T2.S1',
                    type: 'Subtask',
                    title: 'Implement Calculator Functions',
                    status: 'Planned' as Status, // NEW subtask
                    story_points: 3,
                    dependencies: [],
                    context_scope: '...',
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
// MOCK FACTORY: createMockChild for ChildProcess
// =============================================================================

function createMockChild(
  options: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  } = {}
) {
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
// MOCK DELTA ANALYSIS RESULT
// =============================================================================

const mockDeltaAnalysis: DeltaAnalysis = {
  changes: [
    {
      type: 'added',
      itemId: 'P1.M1.T2',
      description: 'Add Calculator Functions',
      impact: 'New task requires implementation',
    },
    {
      type: 'modified',
      itemId: 'P1.M1.T1.S1',
      description: 'Write Hello World Function (enhanced)',
      impact: 'Story points changed from 1 to 2',
    },
  ],
  patchInstructions:
    'Re-execute P1.M1.T1.S1 with new story points. Implement new task P1.M1.T2.',
  taskIds: ['P1.M1.T1.S1', 'P1.M1.T2'],
};

// =============================================================================
// TEST SUITE: E2E Delta Session Tests
// =============================================================================

describe('E2E Delta Session Tests', () => {
  let tempDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'e2e-delta-test-'));
    prdPath = join(tempDir, 'PRD.md');

    // Setup agent mocks
    vi.mocked(createArchitectAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createResearcherAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createCoderAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createQAAgent).mockReturnValue(mockAgent as never);

    // Setup existsSync mock
    vi.mocked(existsSync).mockReturnValue(true);

    // Setup spawn mock for BashMCP
    const { spawn } = require('node:child_process');
    vi.mocked(spawn).mockReturnValue(
      createMockChild({ stdout: '', exitCode: 0 }) as never
    );

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
  // TEST: Full Delta Session Workflow
  // =============================================================================

  it('should complete delta session workflow successfully', async () => {
    // =======================================================================
    // PHASE 1: Initial Run with PRD v1
    // =======================================================================

    // ARRANGE: Write PRD v1 and setup mocks
    writeFileSync(prdPath, mockSimplePRD);
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklogV1() });
    vi.mocked(readFile).mockImplementation((path: string) => {
      if (typeof path === 'string' && path.includes('PRD.md')) {
        return Promise.resolve(mockSimplePRD);
      }
      if (typeof path === 'string' && path.includes('tasks.json')) {
        return Promise.resolve(JSON.stringify(createMockBacklogV1()));
      }
      return Promise.resolve('');
    });

    // ACT: Run initial pipeline
    const start1 = performance.now();
    const pipeline1 = new PRPPipeline(prdPath);
    const result1 = await pipeline1.run();
    const duration1 = performance.now() - start1;

    // ASSERT: Verify initial session
    expect(result1.success).toBe(true);
    expect(result1.sessionPath).toBeDefined();
    expect(existsSync(result1.sessionPath)).toBe(true);

    // ASSERT: Verify initial session has 3 subtasks, all Complete
    const tasksPath1 = join(result1.sessionPath, 'tasks.json');
    const tasksJson1 = JSON.parse(readFileSync(tasksPath1, 'utf-8'));
    const subtasks1 = tasksJson1.backlog[0].milestones[0].tasks[0].subtasks;
    expect(subtasks1).toHaveLength(3);
    expect(subtasks1.every((s: any) => s.status === 'Complete')).toBe(true);

    // =======================================================================
    // PHASE 2: Delta Run with PRD v2
    // =======================================================================

    // ARRANGE: Write PRD v2 and setup mocks
    writeFileSync(prdPath, mockSimplePRDv2);
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklogV2() });

    // Setup DeltaAnalysisWorkflow mock
    const mockDeltaWorkflow = {
      analyzeDelta: vi.fn().mockResolvedValue(mockDeltaAnalysis),
    };
    vi.mocked(DeltaAnalysisWorkflow).mockImplementation(
      () => mockDeltaWorkflow as never
    );

    // Setup readFile mock to return PRD v2
    vi.mocked(readFile).mockImplementation((path: string) => {
      if (typeof path === 'string' && path.includes('PRD.md')) {
        return Promise.resolve(mockSimplePRDv2);
      }
      if (typeof path === 'string' && path.includes('tasks.json')) {
        return Promise.resolve(JSON.stringify(createMockBacklogV2()));
      }
      return Promise.resolve('');
    });

    // ACT: Run delta pipeline
    const start2 = performance.now();
    const pipeline2 = new PRPPipeline(prdPath);
    const result2 = await pipeline2.run();
    const duration2 = performance.now() - start2;

    // ASSERT: Verify delta session created
    expect(result2.success).toBe(true);
    expect(result2.sessionPath).toBeDefined();
    expect(result2.sessionPath).not.toBe(result1.sessionPath); // Different session

    // ASSERT: Verify parent_session.txt exists and references initial session
    const parentSessionPath = join(result2.sessionPath, 'parent_session.txt');
    expect(existsSync(parentSessionPath)).toBe(true);
    const parentSessionId = readFileSync(parentSessionPath, 'utf-8').trim();
    expect(parentSessionId).toContain(
      result1.sessionPath.split('/').pop() as string
    );

    // ASSERT: Verify delta session has 4 subtasks (3 original + 1 new)
    const tasksPath2 = join(result2.sessionPath, 'tasks.json');
    const tasksJson2 = JSON.parse(readFileSync(tasksPath2, 'utf-8'));
    const allSubtasks2 = tasksJson2.backlog[0].milestones[0].tasks.flatMap(
      (t: any) => t.subtasks
    );
    expect(allSubtasks2).toHaveLength(4);

    // ASSERT: Verify original tasks preserved (still Complete)
    const originalSubtaskIds = ['P1.M1.T1.S1', 'P1.M1.T1.S2', 'P1.M1.T1.S3'];
    const preservedTasks = allSubtasks2.filter((s: any) =>
      originalSubtaskIds.includes(s.id)
    );
    expect(preservedTasks).toHaveLength(3);
    expect(preservedTasks.every((s: any) => s.status === 'Complete')).toBe(
      true
    );

    // ASSERT: Verify new task exists
    const newTask = allSubtasks2.find((s: any) => s.id === 'P1.M1.T2.S1');
    expect(newTask).toBeDefined();

    // LOG: Execution time
    const totalDuration = duration1 + duration2;
    expect(totalDuration).toBeLessThan(30000); // <30 seconds
    console.log(`Delta E2E test completed in ${totalDuration.toFixed(0)}ms`);
  });

  // =============================================================================
  // TEST: Parent Session Reference
  // =============================================================================

  it('should create parent_session.txt referencing initial session', async () => {
    // PHASE 1: Initial Run
    writeFileSync(prdPath, mockSimplePRD);
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklogV1() });
    vi.mocked(readFile).mockResolvedValue(mockSimplePRD);

    const pipeline1 = new PRPPipeline(prdPath);
    const result1 = await pipeline1.run();

    // PHASE 2: Delta Run
    writeFileSync(prdPath, mockSimplePRDv2);
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklogV2() });

    const mockDeltaWorkflow = {
      analyzeDelta: vi.fn().mockResolvedValue(mockDeltaAnalysis),
    };
    vi.mocked(DeltaAnalysisWorkflow).mockImplementation(
      () => mockDeltaWorkflow as never
    );

    vi.mocked(readFile).mockResolvedValue(mockSimplePRDv2);

    const pipeline2 = new PRPPipeline(prdPath);
    const result2 = await pipeline2.run();

    // ASSERT: Verify parent_session.txt
    const parentSessionPath = join(result2.sessionPath, 'parent_session.txt');
    expect(existsSync(parentSessionPath)).toBe(true);

    const parentSessionContent = readFileSync(parentSessionPath, 'utf-8');
    const initialSessionId = result1.sessionPath.split('/').pop() as string;
    expect(parentSessionContent).toContain(initialSessionId);
  });

  // =============================================================================
  // TEST: Task Preservation
  // =============================================================================

  it('should preserve original completed tasks in delta session', async () => {
    // PHASE 1: Initial Run
    writeFileSync(prdPath, mockSimplePRD);
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklogV1() });
    vi.mocked(readFile).mockImplementation((path: string) => {
      if (typeof path === 'string' && path.includes('PRD.md')) {
        return Promise.resolve(mockSimplePRD);
      }
      return Promise.resolve(JSON.stringify(createMockBacklogV1()));
    });

    const pipeline1 = new PRPPipeline(prdPath);
    const result1 = await pipeline1.run();

    const tasksPath1 = join(result1.sessionPath, 'tasks.json');
    const tasksJson1 = JSON.parse(readFileSync(tasksPath1, 'utf-8'));
    const initialSubtasks =
      tasksJson1.backlog[0].milestones[0].tasks[0].subtasks;

    // PHASE 2: Delta Run
    writeFileSync(prdPath, mockSimplePRDv2);
    mockAgent.prompt.mockResolvedValue({ backlog: createMockBacklogV2() });

    const mockDeltaWorkflow = {
      analyzeDelta: vi.fn().mockResolvedValue(mockDeltaAnalysis),
    };
    vi.mocked(DeltaAnalysisWorkflow).mockImplementation(
      () => mockDeltaWorkflow as never
    );

    vi.mocked(readFile).mockImplementation((path: string) => {
      if (typeof path === 'string' && path.includes('PRD.md')) {
        return Promise.resolve(mockSimplePRDv2);
      }
      return Promise.resolve(JSON.stringify(createMockBacklogV2()));
    });

    const pipeline2 = new PRPPipeline(prdPath);
    const result2 = await pipeline2.run();

    const tasksPath2 = join(result2.sessionPath, 'tasks.json');
    const tasksJson2 = JSON.parse(readFileSync(tasksPath2, 'utf-8'));
    const deltaSubtasks = tasksJson2.backlog[0].milestones[0].tasks.flatMap(
      (t: any) => t.subtasks
    );

    // ASSERT: Verify original task IDs preserved
    const originalIds = initialSubtasks.map((s: any) => s.id);
    const deltaIds = deltaSubtasks.map((s: any) => s.id);
    originalIds.forEach((id: string) => {
      expect(deltaIds).toContain(id);
    });

    // ASSERT: Verify original tasks still Complete
    const preservedTasks = deltaSubtasks.filter((s: any) =>
      originalIds.includes(s.id)
    );
    expect(preservedTasks.every((s: any) => s.status === 'Complete')).toBe(
      true
    );
  });
});

// =============================================================================
// KEY IMPLEMENTATION DETAILS
// =============================================================================

// 1. TWO-PHASE TEST EXECUTION
// Test runs PRPPipeline twice: initial run with PRD v1, delta run with PRD v2
// Same temp directory used for both runs (don't cleanup between phases)

// 2. PRD MODIFICATION BETWEEN RUNS
// writeFileSync(prdPath, mockSimplePRDv2) overwrites PRD v1 with PRD v2
// This triggers hash mismatch and delta detection in second run

// 3. DELTA ANALYSIS MOCK
// DeltaAnalysisWorkflow.analyzeDelta() mocked to return predefined DeltaAnalysis
// Includes 'added' change (P1.M1.T2) and 'modified' change (P1.M1.T1.S1)

// 4. PARENT SESSION REFERENCE
// parent_session.txt file created in delta session directory
// Contains initial session ID for verification

// 5. TASK PRESERVATION
// Original completed tasks (P1.M1.T1.S1-S3) preserved in delta backlog
// New task (P1.M1.T2.S1) added to delta backlog

// 6. MODULE MOCKING WITH HOISTING
// All vi.mock() calls at top level before imports
// vi.mock() for DeltaAnalysisWorkflow in addition to agent mocks

// 7. FILE SYSTEM MOCKS
// readFile checks path to return PRD v1 or v2 based on current phase
// existsSync returns true for all paths in test

// 8. EXECUTION TIME MEASUREMENT
// performance.now() for millisecond precision
// Total duration (phase 1 + phase 2) asserted <30 seconds
````

### Integration Points

```yaml
AGENT_FACTORY:
  - mock: vi.mock('../../src/agents/agent-factory.js')
  - functions: createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent
  - pattern: Return mockAgent with prompt method

DELTA_ANALYSIS_WORKFLOW:
  - mock: vi.mock('../../src/workflows/delta-analysis-workflow.js')
  - class: DeltaAnalysisWorkflow
  - method: analyzeDelta() returns DeltaAnalysis

GROUNDSWELL:
  - mock: vi.mock('groundswell')
  - preserve: MCPHandler and other exports via vi.importActual()
  - functions: createAgent, createPrompt

FILE_SYSTEM:
  - mock: vi.mock('node:fs/promises')
  - mock: vi.mock('node:fs')
  - functions: readFile, writeFile, mkdir, existsSync, realpathSync
  - pattern: Check path to return PRD v1 or v2 content

BASH_MCP:
  - mock: vi.mock('node:child_process')
  - function: spawn
  - return: createMockChild({ exitCode: 0, stdout: '' })

GIT_MCP:
  - mock: vi.mock('simple-git')
  - function: simpleGit
  - return: mockGitInstance with status(), diff(), add(), commit()

FIXTURE_IMPORT_V1:
  - file: tests/fixtures/simple-prd.ts
  - export: mockSimplePRD
  - import: import { mockSimplePRD } from '../fixtures/simple-prd.js'

FIXTURE_IMPORT_V2:
  - file: tests/fixtures/simple-prd-v2.ts
  - export: mockSimplePRDv2
  - import: import { mockSimplePRDv2 } from '../fixtures/simple-prd-v2.js'

SESSION_MANAGER:
  - reads: PRD.md for hash computation (v1 then v2)
  - writes: prd_snapshot.md, tasks.json, parent_session.txt to session directory
  - location: plan/001_14b9dc2a33c7/sessions/
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check E2E test file
npx tsc --noEmit tests/e2e/delta.test.ts

# Type check modified PRD fixture
npx tsc --noEmit tests/fixtures/simple-prd-v2.ts

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding

# Check file structure
ls -la tests/e2e/delta.test.ts
ls -la tests/fixtures/simple-prd-v2.ts
# Expected: Both files exist
```

### Level 2: Linting and Formatting

```bash
# Run ESLint (if configured)
npm run lint -- tests/e2e/delta.test.ts
npm run lint -- tests/fixtures/simple-prd-v2.ts

# Expected: Zero linting errors

# Run Prettier check (if configured)
npm run format:check -- tests/e2e/delta.test.ts
npm run format:check -- tests/fixtures/simple-prd-v2.ts

# Expected: Zero formatting issues
```

### Level 3: Test Execution (Component Validation)

```bash
# Run delta E2E test in isolation
npm run test:run -- tests/e2e/delta.test.ts

# Expected output:
// ✓ tests/e2e/delta.test.ts (3 tests)
//   ✓ E2E Delta Session Tests
//     ✓ should complete delta session workflow successfully
//     ✓ should create parent_session.txt referencing initial session
//     ✓ should preserve original completed tasks in delta session
// Delta E2E test completed in XXXms
//
// Test Files  1 passed (1)
// Tests  3 passed (3)

# Verify execution time is <30 seconds total
# Should see "Delta E2E test completed in XXXms" with XXX < 30000

# Run with verbose output for debugging
npm run test:run -- tests/e2e/delta.test.ts --reporter=verbose
```

### Level 4: Cleanup Verification (System Validation)

```bash
# Verify no test artifacts left behind
ls /tmp/e2e-delta-test*

# Expected: No files match pattern (all cleaned up)

# If temp files exist, check afterEach cleanup:
# - rmSync(tempDir, { recursive: true, force: true }) is called
# - No early returns in test that skip cleanup
```

### Level 5: Full Test Suite Validation

```bash
# Run all E2E tests to ensure no breaking changes
npm run test:run -- tests/e2e/

# Expected: All E2E tests pass (pipeline.test.ts and delta.test.ts)

# Run all tests to ensure no breaking changes
npm run test:run

# Expected: All existing tests still pass
# Delta E2E test should not break any existing tests

# Check coverage for new test
npm run test:coverage -- tests/e2e/delta.test.ts

# Expected: Coverage report shows E2E test coverage
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Modified PRD fixture created at `tests/fixtures/simple-prd-v2.ts`
- [ ] E2E test file created at `tests/e2e/delta.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/e2e/delta.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/fixtures/simple-prd-v2.ts`
- [ ] All module mocks properly hoisted (vi.mock() at top level)
- [ ] All imports use `.js` extension for ESM compatibility
- [ ] Temporary directory created in beforeEach
- [ ] Temporary directory cleaned up in afterEach
- [ ] Real timers enabled for async mock behavior

### Mock Validation

- [ ] Groundswell mocked with `vi.importActual()` to preserve exports
- [ ] Agent factory mocked (all 4 agents: Architect, Researcher, Coder, QA)
- [ ] DeltaAnalysisWorkflow mocked (DeltaAnalysisWorkflow class, analyzeDelta method)
- [ ] fs/promises mocked (readFile, writeFile, mkdir)
- [ ] node:fs mocked (existsSync, realpathSync)
- [ ] node:child_process mocked (spawn)
- [ ] simple-git mocked (simpleGit, GitError)
- [ ] All mocks configured before test execution

### Fixture Validation

- [ ] mockSimplePRDv2 exported from tests/fixtures/simple-prd-v2.ts
- [ ] PRD v2 has meaningful changes (P1.M1.T2 added, P1.M1.T1.S1 modified)
- [ ] PRD v2 changes will trigger delta detection
- [ ] Both fixtures importable with .js extension

### Test Validation

- [ ] Test passes: `npm run test:run -- tests/e2e/delta.test.ts`
- [ ] All 3 tests pass (full workflow, parent reference, task preservation)
- [ ] Execution time <30 seconds total
- [ ] Initial session created with PRD v1
- [ ] Delta session created with PRD v2
- [ ] parent_session.txt exists and references initial session
- [ ] Patched backlog has new task (P1.M1.T2)
- [ ] Original completed tasks preserved in backlog
- [ ] No test artifacts left after test completion

### Code Quality Validation

- [ ] Follows existing test patterns from tests/e2e/pipeline.test.ts
- [ ] JSDoc comments explain fixture and test purpose
- [ ] Test is isolated (no dependencies on other tests)
- [ ] Test names describe what is being validated
- [ ] Console log includes execution time for performance tracking

### Documentation & Sign-Off

- [ ] Research stored in `plan/001_14b9dc2a33c7/P4M4T3S3/research/`
- [ ] PRP document complete
- [ ] Ready for implementation

---

## Anti-Patterns to Avoid

- ❌ Don't create new temp directory between runs (use same directory for delta detection)
- ❌ Don't forget to mock DeltaAnalysisWorkflow (will cause real QA agent calls)
- ❌ Don't use synchronous file operations in async tests (use await with fs/promises)
- ❌ Don't forget to use `.js` extension for imports (ESM requirement)
- ❌ Don't mock after imports (vi.mock() must be at top level before imports)
- ❌ Don't use fake timers when ChildProcess mocks use setTimeout
- ❌ Don't skip cleanup in afterEach (causes temp directory pollution)
- ❌ Don't use hard-coded temp directory paths (use mkdtempSync for uniqueness)
- ❌ Don't assert exact execution time (tests can be flaky, use < comparison)
- ❌ Don't forget to mock readFile for SessionManager (PRD hash computation)
- ❌ Don't forget to update readFile mock between phases (must return different PRD content)
- ❌ Don't mock SessionManager directly (let PRPPipeline create it)
- ❌ Don't forget to mock all agent types including QA (delta analysis uses QA agent)
- ❌ Don't use real LLM calls (all agents must be mocked for fast execution)
- ❌ Don't use real file system operations (all I/O must be mocked)
- ❌ Don't use real git operations (all git calls must be mocked)
- ❌ Don't skip validation of parent_session.txt (critical for delta session verification)
- ❌ Don't skip validation of task preservation (key delta session feature)
- ❌ Don't create trivial PRD v2 changes (must have meaningful additions/modifications)

---

## Confidence Score

**10/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ Complete delta session implementation details documented
- ✅ Exact file paths and import patterns provided
- ✅ PRPPipeline delta detection and handling workflow understood
- ✅ Test fixture patterns established (P4.M4.T3.S1, P4.M4.T3.S2)
- ✅ All mock patterns documented with working examples
- ✅ Task is straightforward (create fixture + E2E test following established patterns)
- ✅ No external dependencies or complex logic required
- ✅ Validation commands are simple and direct
- ✅ Gotchas and anti-patterns well-documented
- ✅ Two-phase test pattern clearly defined

**Validation**: This PRP provides:

1. Complete delta session implementation details from SessionManager
2. Exact PRD v2 fixture content with meaningful changes
3. Two-phase test execution pattern (initial run + delta run)
4. All mock patterns including DeltaAnalysisWorkflow
5. Temporary directory management with single-directory approach
6. Comprehensive assertion checklist (initial session, delta session, parent reference, task preservation)
7. Known gotchas and anti-patterns to avoid
8. Clear success criteria with validation commands

The risk is minimal because:

1. Creating modified PRD fixture is straightforward (add task + modify existing)
2. E2E test follows established pattern from P4.M4.T3.S2
3. All mock patterns copied from existing working tests
4. Test fixtures provide known input structures
5. No complex logic or external dependencies
6. Existing patterns provide clear guidance
7. Validation is simple (test passes or fails)

---

## Research Notes

### Stored Research

The following research findings have been compiled for this PRP:

1. **Delta Session Implementation** (from codebase exploration)
   - SessionManager.createDeltaSession() method (lines 304-369)
   - Parent session reference storage (metadata + parent_session.txt file)
   - Delta session sequence increment (001 -> 002)
   - DeltaSession interface with oldPRD, newPRD, diffSummary fields

2. **PRPPipeline Delta Handling** (from codebase exploration)
   - PRPPipeline.handleDelta() method (lines 319-411)
   - SessionManager.hasSessionChanged() for delta detection (lines 825-833)
   - DeltaAnalysisWorkflow integration for PRD analysis
   - Task patching via patchBacklog() function

3. **E2E Test Patterns** (from P4.M4.T3.S2)
   - Complete module mocking pattern (vi.mock at top level)
   - Temporary directory management (mkdtempSync, rmSync)
   - Agent mocking patterns (createMockAgent, vi.mocked())
   - MCP tool mocking (createMockChild, spawn mock)

4. **Test Fixture Patterns** (from codebase exploration)
   - mockSimplePRD structure (1 Phase, 1 Milestone, 1 Task, 3 Subtasks)
   - mock-delta-data.ts examples (added, modified, removed changes)
   - Fixture export patterns (export const mockSimplePRD = `...`)

5. **External E2E Testing Research** (from research agent)
   - Multi-run workflow testing patterns
   - State persistence verification across runs
   - Cleanup and state reset best practices
   - Performance targets for E2E tests

### External Resources

Research findings are based on:

- Official Vitest documentation (https://vitest.dev/guide/mocking.html)
- Official Vitest API reference (https://vitest.dev/api/)
- Project-specific test patterns and conventions
- Groundswell library integration patterns
- Existing delta session implementation in codebase

### Key Insights

1. **Two-Phase Test Pattern**: Delta E2E test must run PRPPipeline twice (initial + delta) using same temp directory
2. **PRD Modification Between Runs**: writeFileSync() overwrites PRD v1 with PRD v2 to trigger delta detection
3. **Parent Session Reference**: Stored in both metadata and parent_session.txt file (both must be validated)
4. **Task Preservation Logic**: Original completed tasks preserved, new tasks added, modified tasks reset to 'Planned'
5. **DeltaAnalysisWorkflow Must Be Mocked**: Forgetting this mock causes real QA agent calls (slow/expensive)
6. **Hash-Based Detection**: ANY PRD content change triggers delta, even whitespace changes
7. **Module Mocking Hoisting**: All vi.mock() calls must be at top level before imports
8. **ESM Imports Need .js Extension**: Vitest uses ESM, imports must use .js extension even for .ts files
