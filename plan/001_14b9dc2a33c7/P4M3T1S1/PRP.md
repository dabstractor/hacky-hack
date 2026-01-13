# PRP for P4.M3.T1.S1: Create Bug Hunt Workflow

---

## Goal

**Feature Goal**: Create `BugHuntWorkflow` class that orchestrates a three-phase QA testing process (Scope Analysis, Creative E2E Testing, Adversarial Testing) to detect bugs in implemented features against the original PRD requirements.

**Deliverable**: `src/workflows/bug-hunt-workflow.ts` containing:

- `BugHuntWorkflow` class extending `Workflow` from Groundswell
- `@ObservedState` decorated properties for PRD content, completed tasks, test results
- `@Step` decorated methods for each QA phase (`analyzeScope`, `creativeE2ETesting`, `adversarialTesting`, `generateReport`)
- `run()` method that orchestrates all phases and returns `TestResults`
- Integration with `createBugHuntPrompt()` and `createQAAgent()`

**Success Definition**:

- `BugHuntWorkflow` class exists and extends `Workflow`
- Constructor accepts `prdContent: string` and `completedTasks: Task[]`
- All four `@Step` methods are implemented and callable
- `run()` method executes all phases sequentially and returns `TestResults`
- Workflow uses `createBugHuntPrompt()` and `createQAAgent()` for QA operations
- `@ObservedState` properties are properly decorated for observability
- All tests pass (unit and integration)
- No regressions in existing workflow tests

## User Persona (if applicable)

**Target User**: PRPPipeline (internal orchestration layer)

**Use Case**: After all tasks in a PRD have been implemented, the pipeline needs to run comprehensive QA to detect bugs before marking the PRD complete. The bug hunt workflow provides systematic three-phase testing with structured bug reporting.

**User Journey**:

1. PRPPipeline completes all task execution
2. PRPPipeline creates `BugHuntWorkflow` with PRD content and completed tasks
3. BugHuntWorkflow executes three QA phases sequentially:
   - **Phase 1 (Scope)**: Analyze PRD requirements and expected behaviors
   - **Phase 2 (Creative E2E)**: Test happy paths, edge cases, integrations, error handling
   - **Phase 3 (Adversarial)**: Test unexpected inputs, missing features, UX issues
4. BugHuntWorkflow generates structured `TestResults` via QA agent
5. If critical/major bugs found, `TEST_RESULTS.md` is written to trigger fix cycle
6. `TestResults` returned to pipeline for decision-making (proceed to fix cycle or complete)

**Pain Points Addressed**:

- **Manual QA Bottleneck**: Automated three-phase QA reduces manual testing burden
- **Incomplete Testing**: Adversarial phase finds bugs beyond standard validation
- **Unstructured Bug Reports**: Structured `TestResults` schema enables automated fix cycle
- **PRD Compliance**: Tests implementations against original requirements, not just code correctness

## Why

- **Quality Assurance**: Comprehensive three-phase QA ensures implementations meet PRD requirements
- **Automated Bug Detection**: AI-powered adversarial testing finds bugs humans might miss
- **Structured Reporting**: `TestResults` schema enables automated bug fix pipeline (P4.M3.T1.S2)
- **PRD Validation**: Tests against original requirements, not just code quality
- **Integration with Existing Patterns**: Uses existing `createBugHuntPrompt()` and `createQAAgent()` from P2.M2.T4
- **Groundswell Consistency**: Follows workflow patterns from `DeltaAnalysisWorkflow` and `PRPPipeline`

## What

### System Behavior

The `BugHuntWorkflow`:

1. **Constructor**: Accepts `prdContent: string` and `completedTasks: Task[]`, validates inputs, initializes state
2. **@ObservedState Properties**:
   - `prdContent: string` - Original PRD for requirement validation
   - `completedTasks: Task[]` - List of completed tasks to test
   - `testResults: TestResults | null` - Generated test results (null until report phase)
3. **@Step Methods**:
   - `analyzeScope()`: Read PRD, understand requirements, identify user journeys
   - `creativeE2ETesting()`: Generate test scenarios, execute happy path and edge cases
   - `adversarialTesting()`: Test edge cases, unexpected inputs, missing features
   - `generateReport()`: Use QA agent with `createBugHuntPrompt()` to produce `TestResults`
4. **run() Method**: Orchestrate all phases, return `TestResults` with bug findings

### Success Criteria

- [ ] `BugHuntWorkflow` extends `Workflow` and calls `super('BugHuntWorkflow')`
- [ ] Constructor validates `prdContent` is non-empty string
- [ ] Constructor validates `completedTasks` is array (can be empty)
- [ ] `@ObservedState` properties: `prdContent`, `completedTasks`, `testResults`
- [ ] `@Step({ trackTiming: true })` on all four step methods
- [ ] `analyzeScope()` logs scope analysis findings
- [ ] `creativeE2ETesting()` logs E2E test scenarios
- [ ] `adversarialTesting()` logs adversarial test scenarios
- [ ] `generateReport()` uses `createQAAgent()` and `createBugHuntPrompt()`
- [ ] `run()` executes phases in order: Scope → Creative E2E → Adversarial → Report
- [ ] `run()` returns `TestResults` object
- [ ] All unit tests pass
- [ ] Integration test validates full workflow execution

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact file paths for all dependencies
- Complete workflow class patterns from existing codebase
- Groundswell decorator patterns with all options
- QA agent and prompt integration patterns
- TestResults and Bug schema definitions
- Test patterns matching existing codebase
- Import patterns with `.js` extensions for ESM

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- file: src/workflows/delta-analysis-workflow.ts
  why: Workflow class pattern - reference for @Step, @ObservedState, constructor, run()
  pattern: Lines 1-80 for class structure, @Step decorator usage, @ObservedState usage
  critical: super('WorkflowName') in constructor, setStatus() calls, error handling
  gotcha: Use .js extensions for imports even though source files are .ts

- file: src/workflows/prp-pipeline.ts
  why: Complex workflow with multiple @Step methods - orchestration pattern
  pattern: Lines 1-100 for workflow structure, @ObservedState fields, @Step methods
  critical: How to sequence multiple @Step methods in run()
  gotcha: Error handling with try/catch and setStatus('failed')

- file: src/agents/agent-factory.ts
  why: createQAAgent() function - QA agent creation pattern
  pattern: Lines 266-274 for createQAAgent() implementation
  critical: Returns Agent with 'qa' persona, BUG_HUNT_PROMPT system prompt
  gotcha: Agent is configured with MCP tools (Bash, Filesystem, Git)

- file: src/agents/prompts/bug-hunt-prompt.ts
  why: createBugHuntPrompt() function - prompt creation for bug hunt
  pattern: Complete file for prompt structure, TestResultsSchema usage
  critical: Takes prd: string and completedTasks: Task[], returns Prompt<TestResults>
  gotcha: enableReflection: true for complex bug analysis

- file: src/core/models.ts
  why: TestResults and Bug type definitions
  pattern: Lines 1683-1785 for TestResults and Bug interfaces
  critical: TestResults.hasBugs drives bug fix pipeline, Bug.severity classification
  gotcha: Bug.title max 200 chars, reproduction is required field

- file: tests/unit/workflows/delta-analysis-workflow.test.ts
  why: Test patterns for workflow classes
  pattern: Mock createQAAgent, test @Step methods, test run() orchestration
  critical: vi.mock() patterns for agent factory, beforeEach cleanup
  gotcha: Use vi.clearAllMocks() in beforeEach to prevent test interference

- file: PROMPTS.md
  why: BUG_HUNT_PROMPT system prompt - QA engineer persona definition
  pattern: Lines 1059-1174 for complete QA prompt with three phases
  critical: Defines Scope, Creative E2E, Adversarial testing phases
  gotcha: Prompt includes structured bug report format

- url: https://www.npmjs.com/package/groundswell
  why: Groundswell library documentation for Workflow, Step, ObservedState
  section: API reference for decorators and base class methods
```

### Current Codebase Tree

```bash
src/
├── workflows/
│   ├── index.ts                     # Barrel exports - ADD BugHuntWorkflow export
│   ├── hello-world.ts               # Simple workflow example
│   ├── delta-analysis-workflow.ts   # Medium complexity workflow - USE AS PATTERN
│   ├── prp-pipeline.ts              # Complex workflow - reference for orchestration
│   └── bug-hunt-workflow.ts         # NEW FILE - CREATE THIS
├── agents/
│   ├── agent-factory.ts             # createQAAgent() - USE THIS
│   ├── prompts/
│   │   ├── bug-hunt-prompt.ts       # createBugHuntPrompt() - USE THIS
│   │   └── index.ts                 # Prompt exports
│   └── prompts.ts                   # Fallback prompt definitions
├── core/
│   ├── models.ts                    # TestResults, Bug types - REFERENCE
│   └── index.ts                     # Core exports
└── utils/
    └── ...

tests/
├── unit/
│   └── workflows/
│       ├── delta-analysis-workflow.test.ts  # Test pattern - FOLLOW THIS
│       └── bug-hunt-workflow.test.ts        # NEW FILE - CREATE THIS
└── integration/
    └── bug-hunt-workflow-integration.test.ts  # NEW FILE - CREATE THIS
```

### Desired Codebase Tree with Files to be Added

```bash
src/
├── workflows/
│   ├── index.ts                     # MODIFY - Add: export { BugHuntWorkflow }
│   └── bug-hunt-workflow.ts         # CREATE - New workflow class

tests/
├── unit/
│   └── workflows/
│       └── bug-hunt-workflow.test.ts        # CREATE - Unit tests
└── integration/
    └── bug-hunt-workflow-integration.test.ts # CREATE - Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports must use .js extension
import { Workflow, Step, ObservedState } from 'groundswell';
import type { Task, TestResults, Bug } from '../core/models.js';
import { createQAAgent } from '../agents/agent-factory.js';
import { createBugHuntPrompt } from '../agents/prompts/bug-hunt-prompt.js';

// CRITICAL: Workflow base class requires name in super()
constructor(prdContent: string, completedTasks: Task[]) {
  super('BugHuntWorkflow');  // Must pass workflow name
  // ... rest of constructor
}

// CRITICAL: @Step decorator options for timing tracking
@Step({ trackTiming: true })
async analyzeScope(): Promise<void> {
  // Implementation
}

// CRITICAL: @ObservedState decorator for public state fields
@ObservedState()
prdContent: string;

@ObservedState()
completedTasks: Task[];

@ObservedState()
testResults: TestResults | null = null;

// CRITICAL: createQAAgent() returns Agent configured for QA
const qaAgent = createQAAgent();
// Agent has 'qa' persona, BUG_HUNT_PROMPT system prompt, MCP tools

// CRITICAL: createBugHuntPrompt() takes PRD and tasks, returns Prompt<TestResults>
const prompt = createBugHuntPrompt(this.prdContent, this.completedTasks);

// CRITICAL: Agent.prompt() returns Promise<any>, cast to TestResults
const results = await qaAgent.prompt(prompt) as TestResults;

// CRITICAL: TestResults.hasBugs is boolean that drives fix cycle
if (results.hasBugs) {
  // Write TEST_RESULTS.md file
}

// CRITICAL: Bug.severity values: 'critical' | 'major' | 'minor' | 'cosmetic'
// Critical and Major bugs trigger fix cycle

// PATTERN: setStatus() for workflow lifecycle
async run(): Promise<TestResults> {
  this.setStatus('running');
  try {
    // Execute steps
    this.setStatus('completed');
    return this.testResults!;
  } catch (error) {
    this.setStatus('failed');
    throw error;
  }
}

// PATTERN: this.logger for structured logging
this.logger.info('[BugHuntWorkflow] Starting scope analysis');
this.logger.error('[BugHuntWorkflow] Scope analysis failed', { error });

// GOTCHA: this.testResults is null until generateReport() completes
// Use null assertion (!) or null check when accessing after run()

// PATTERN: Three-phase QA from BUG_HUNT_PROMPT
// Phase 1: Scope Analysis - Understand PRD requirements
// Phase 2: Creative E2E - Happy paths, edge cases, integrations
// Phase 3: Adversarial - Unexpected inputs, missing features, UX issues

// GOTCHA: The @Step methods in BugHuntWorkflow are for tracking/observability
// Actual QA work is done by QA agent via createBugHuntPrompt()
// The @Step methods represent logical phases, not separate LLM calls

// CRITICAL: run() must return TestResults for pipeline integration
// Pipeline uses results to decide whether to proceed to fix cycle

// PATTERN: Test structure follows Setup/Execute/Verify
describe('BugHuntWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  it('should execute all phases and return TestResults', async () => {
    // SETUP
    const workflow = new BugHuntWorkflow(prd, tasks);
    // EXECUTE
    const results = await workflow.run();
    // VERIFY
    expect(results.hasBugs).toBe(true);
  });
});

// GOTCHA: Mock createQAAgent to avoid real LLM calls in tests
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));

// GOTCHA: Mock createBugHuntPrompt to control prompt content
vi.mock('../../../src/agents/prompts/bug-hunt-prompt.js', () => ({
  createBugHuntPrompt: vi.fn(),
}));
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from codebase:

```typescript
// Re-export from existing modules
import type {
  Task, // From src/core/models.js - has id, title, status
  TestResults, // From src/core/models.js - hasBugs, bugs, summary, recommendations
  Bug, // From src/core/models.js - id, severity, title, description, reproduction, location
} from '../core/models.js';

import { Workflow, Step, ObservedState } from 'groundswell';
import { createQAAgent } from '../agents/agent-factory.js';
import { createBugHuntPrompt } from '../agents/prompts/bug-hunt-prompt.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/workflows/bug-hunt-workflow.ts
  - IMPLEMENT: BugHuntWorkflow class extending Workflow
  - ADD: Imports for Workflow, Step, ObservedState from 'groundswell'
  - ADD: Imports for Task, TestResults, Bug from '../core/models.js'
  - ADD: Imports for createQAAgent, createBugHuntPrompt
  - PLACE: New file in src/workflows/
  - NAMING: BugHuntWorkflow class, file: bug-hunt-workflow.ts

Task 2: IMPLEMENT constructor with validation
  - IMPLEMENT: constructor(prdContent: string, completedTasks: Task[])
  - ADD: super('BugHuntWorkflow') call
  - ADD: Validate prdContent is non-empty string (throw Error if empty)
  - ADD: Validate completedTasks is array (throw Error if not array)
  - ADD: Initialize @ObservedState properties
  - PATTERN: Follow delta-analysis-workflow.ts constructor pattern (lines 19-34)
  - NAMING: camelCase parameters, PascalCase class

Task 3: ADD @ObservedState decorated properties
  - IMPLEMENT: @ObservedState() prdContent: string
  - IMPLEMENT: @ObservedState() completedTasks: Task[]
  - IMPLEMENT: @ObservedState() testResults: TestResults | null = null
  - PLACE: After constructor, before methods
  - PATTERN: Follow prp-pipeline.ts pattern for @ObservedState (lines 20-30)

Task 4: IMPLEMENT @Step analyzeScope() method
  - DECORATE: @Step({ trackTiming: true })
  - IMPLEMENT: async analyzeScope(): Promise<void>
  - ADD: Log scope analysis start
  - ADD: Analyze PRD content (log findings)
  - ADD: Log completed tasks for context
  - PLACE: After properties, before other @Step methods
  - NAMING: camelCase method name, descriptive log messages

Task 5: IMPLEMENT @Step creativeE2ETesting() method
  - DECORATE: @Step({ trackTiming: true })
  - IMPLEMENT: async creativeE2ETesting(): Promise<void>
  - ADD: Log E2E testing phase start
  - ADD: Log test scenarios (happy path, edge cases, integrations)
  - PLACE: After analyzeScope()
  - NAMING: camelCase method name

Task 6: IMPLEMENT @Step adversarialTesting() method
  - DECORATE: @Step({ trackTiming: true })
  - IMPLEMENT: async adversarialTesting(): Promise<void>
  - ADD: Log adversarial testing phase start
  - ADD: Log adversarial scenarios (unexpected inputs, missing features)
  - PLACE: After creativeE2ETesting()
  - NAMING: camelCase method name

Task 7: IMPLEMENT @Step generateReport() method
  - DECORATE: @Step({ trackTiming: true })
  - IMPLEMENT: async generateReport(): Promise<TestResults>
  - CALL: createQAAgent() to get QA agent
  - CALL: createBugHuntPrompt(this.prdContent, this.completedTasks)
  - CALL: await qaAgent.prompt(prompt) as TestResults
  - STORE: this.testResults = results
  - LOG: Report summary (bug count, severity breakdown)
  - RETURN: results
  - PLACE: After adversarialTesting()
  - NAMING: camelCase method name

Task 8: IMPLEMENT run() method
  - IMPLEMENT: async run(): Promise<TestResults>
  - CALL: this.setStatus('running') at start
  - CALL: await this.analyzeScope()
  - CALL: await this.creativeE2ETesting()
  - CALL: await this.adversarialTesting()
  - CALL: const results = await this.generateReport()
  - CALL: this.setStatus('completed') before return
  - ADD: try/catch block with setStatus('failed') on error
  - RETURN: results
  - PLACE: After all @Step methods
  - PATTERN: Follow delta-analysis-workflow.ts run() pattern (lines 62-72)

Task 9: MODIFY src/workflows/index.ts
  - ADD: export { BugHuntWorkflow } from './bug-hunt-workflow.js'
  - PLACE: At top of file with other exports (alphabetical order)
  - PRESERVE: All existing exports

Task 10: CREATE tests/unit/workflows/bug-hunt-workflow.test.ts
  - SETUP: Mock createQAAgent with mockAgent.prompt()
  - SETUP: Mock createBugHuntPrompt to return mock prompt
  - TEST: Constructor throws on empty prdContent
  - TEST: Constructor throws on non-array completedTasks
  - TEST: Constructor initializes @ObservedState properties
  - TEST: analyzeScope() @Step method executes
  - TEST: creativeE2ETesting() @Step method executes
  - TEST: adversarialTesting() @Step method executes
  - TEST: generateReport() calls createQAAgent and createBugHuntPrompt
  - TEST: generateReport() stores results in this.testResults
  - TEST: run() orchestrates all phases in order
  - TEST: run() returns TestResults
  - TEST: run() sets status to 'failed' on error
  - PATTERN: Follow delta-analysis-workflow.test.ts pattern

Task 11: CREATE tests/integration/bug-hunt-workflow-integration.test.ts
  - SETUP: Real BugHuntWorkflow with mocked LLM calls
  - MOCK: createQAAgent to return agent with mock prompt()
  - MOCK: createBugHuntPrompt to return test prompt
  - TEST: Full workflow execution with mock TestResults
  - TEST: Workflow returns TestResults with hasBugs=true scenario
  - TEST: Workflow returns TestResults with hasBugs=false scenario
  - SKIP: Mark as test.skip if running in CI without API credentials
  - PATTERN: Follow prp-pipeline-integration.test.ts pattern
```

### Implementation Patterns & Key Details

```typescript
// File: src/workflows/bug-hunt-workflow.ts

// CRITICAL: Import with .js extensions for ESM
import { Workflow, Step, ObservedState } from 'groundswell';
import type { Task, TestResults, Bug } from '../core/models.js';
import { createQAAgent } from '../agents/agent-factory.js';
import { createBugHuntPrompt } from '../agents/prompts/bug-hunt-prompt.js';

/**
 * BugHuntWorkflow - Three-phase QA testing workflow
 *
 * Orchestrates comprehensive QA testing across three phases:
 * 1. Scope Analysis - Understand PRD requirements and expected behaviors
 * 2. Creative E2E Testing - Test happy paths, edge cases, integrations
 * 3. Adversarial Testing - Test unexpected inputs, missing features, UX issues
 *
 * @remarks
 * Uses AI-powered QA agent with adversarial mindset to find bugs beyond
 * standard validation. Generates structured TestResults for automated
 * bug fix pipeline integration.
 */
export class BugHuntWorkflow extends Workflow {
  // @ObservedState decorated properties for workflow observability
  @ObservedState()
  prdContent: string;

  @ObservedState()
  completedTasks: Task[];

  @ObservedState()
  testResults: TestResults | null = null;

  /**
   * Creates a new BugHuntWorkflow instance
   *
   * @param prdContent - The original PRD content for requirement validation
   * @param completedTasks - List of completed tasks to test against PRD
   * @throws {Error} If prdContent is empty or not a string
   * @throws {Error} If completedTasks is not an array
   */
  constructor(prdContent: string, completedTasks: Task[]) {
    super('BugHuntWorkflow');

    // PATTERN: Input validation in constructor
    if (typeof prdContent !== 'string' || prdContent.trim() === '') {
      throw new Error('prdContent must be a non-empty string');
    }

    if (!Array.isArray(completedTasks)) {
      throw new Error('completedTasks must be an array');
    }

    // Initialize @ObservedState properties
    this.prdContent = prdContent;
    this.completedTasks = completedTasks;

    this.logger.info('[BugHuntWorkflow] Initialized', {
      prdLength: prdContent.length,
      tasksCount: completedTasks.length,
    });
  }

  /**
   * Phase 1: Scope Analysis
   *
   * Analyzes PRD content to understand requirements, expected behaviors,
   * user journeys, and edge cases. This phase builds context for testing.
   *
   * @remarks
   * Logs scope analysis findings for observability. Actual analysis
   * is performed by QA agent in generateReport() phase.
   */
  @Step({ trackTiming: true })
  async analyzeScope(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 1: Scope Analysis');
    this.logger.info('[BugHuntWorkflow] Analyzing PRD requirements...', {
      prdLength: this.prdContent.length,
    });

    // Log completed tasks for context
    this.logger.info('[BugHuntWorkflow] Completed tasks for testing:', {
      count: this.completedTasks.length,
      tasks: this.completedTasks.map(t => `${t.id}: ${t.title}`),
    });

    // PATTERN: Log scope findings (QA agent will do actual analysis)
    this.logger.info(
      '[BugHuntWorkflow] Scope analysis complete - QA context established'
    );
  }

  /**
   * Phase 2: Creative End-to-End Testing
   *
   * Generates and executes comprehensive test scenarios covering:
   * - Happy path testing (primary use cases)
   * - Edge case testing (boundaries, empty inputs, unicode)
   * - Workflow testing (complete user journeys)
   * - Integration testing (component interactions)
   * - Error handling (graceful failures)
   * - State testing (transitions and persistence)
   * - Concurrency testing (parallel operations)
   *
   * @remarks
   * Logs test scenario categories. Actual testing is performed
   * by QA agent in generateReport() phase.
   */
  @Step({ trackTiming: true })
  async creativeE2ETesting(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 2: Creative E2E Testing');

    // PATTERN: Log test categories for observability
    const testCategories = [
      'Happy Path Testing',
      'Edge Case Testing',
      'Workflow Testing',
      'Integration Testing',
      'Error Handling',
      'State Testing',
      'Concurrency Testing',
      'Regression Testing',
    ];

    this.logger.info('[BugHuntWorkflow] E2E test categories:', testCategories);

    // QA agent will perform actual testing in generateReport()
    this.logger.info(
      '[BugHuntWorkflow] E2E testing scenarios defined - awaiting QA agent execution'
    );
  }

  /**
   * Phase 3: Adversarial Testing
   *
   * Performs adversarial testing to find bugs beyond standard validation:
   * - Unexpected inputs (undefined scenarios, malformed data)
   * - Missing features (PRD requirements not implemented)
   * - Incomplete features (partial implementations)
   * - Implicit requirements (obvious but unstated functionality)
   * - User experience issues (usability, intuitiveness)
   *
   * @remarks
   * Logs adversarial test categories. Actual testing is performed
   * by QA agent in generateReport() phase.
   */
  @Step({ trackTiming: true })
  async adversarialTesting(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 3: Adversarial Testing');

    // PATTERN: Log adversarial categories for observability
    const adversarialCategories = [
      'Unexpected Inputs',
      'Missing Features',
      'Incomplete Features',
      'Implicit Requirements',
      'User Experience Issues',
      'Security Concerns',
      'Performance Issues',
    ];

    this.logger.info(
      '[BugHuntWorkflow] Adversarial test categories:',
      adversarialCategories
    );

    // QA agent will perform actual adversarial testing in generateReport()
    this.logger.info(
      '[BugHuntWorkflow] Adversarial testing scenarios defined - awaiting QA agent execution'
    );
  }

  /**
   * Phase 4: Generate Bug Report
   *
   * Uses QA agent with createBugHuntPrompt() to generate structured
   * TestResults containing found bugs, severity classification, and
   * fix recommendations.
   *
   * @returns Promise<TestResults> - Structured test results with bug reports
   * @throws {Error} If QA agent fails to generate report
   *
   * @remarks
   * This is the only phase that makes actual LLM calls. The previous
   * phases (analyzeScope, creativeE2ETesting, adversarialTesting) are
   * logical phases for tracking and observability. The QA agent
   * performs all testing work based on PRD + completed tasks context.
   */
  @Step({ trackTiming: true })
  async generateReport(): Promise<TestResults> {
    this.logger.info('[BugHuntWorkflow] Phase 4: Generating Bug Report');

    try {
      // PATTERN: Create QA agent
      const qaAgent = createQAAgent();
      this.logger.info('[BugHuntWorkflow] QA agent created');

      // PATTERN: Create bug hunt prompt with PRD and completed tasks
      const prompt = createBugHuntPrompt(this.prdContent, this.completedTasks);
      this.logger.info('[BugHuntWorkflow] Bug hunt prompt created');

      // PATTERN: Execute QA agent and cast results to TestResults
      const results = (await qaAgent.prompt(prompt)) as TestResults;

      // Store results for observability
      this.testResults = results;

      // Log summary
      this.logger.info('[BugHuntWorkflow] Bug report generated', {
        hasBugs: results.hasBugs,
        bugCount: results.bugs.length,
        criticalCount: results.bugs.filter(b => b.severity === 'critical')
          .length,
        majorCount: results.bugs.filter(b => b.severity === 'major').length,
        minorCount: results.bugs.filter(b => b.severity === 'minor').length,
        cosmeticCount: results.bugs.filter(b => b.severity === 'cosmetic')
          .length,
      });

      // Log summary and recommendations
      this.logger.info(`[BugHuntWorkflow] Summary: ${results.summary}`);
      this.logger.info(
        `[BugHuntWorkflow] Recommendations:`,
        results.recommendations
      );

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('[BugHuntWorkflow] Failed to generate bug report', {
        error: errorMessage,
      });
      throw new Error(`Bug report generation failed: ${errorMessage}`);
    }
  }

  /**
   * Runs the complete bug hunt workflow
   *
   * Orchestrates all four phases sequentially:
   * 1. Scope Analysis - Understand PRD requirements
   * 2. Creative E2E Testing - Define test scenarios
   * 3. Adversarial Testing - Define adversarial scenarios
   * 4. Generate Report - Execute QA and produce TestResults
   *
   * @returns Promise<TestResults> - Structured test results with bug findings
   * @throws {Error} If any phase fails or QA agent fails
   *
   * @remarks
   * The workflow status transitions through: idle → running → completed/failed
   * TestResults.hasBugs drives the bug fix pipeline (true = trigger fix cycle)
   */
  async run(): Promise<TestResults> {
    this.setStatus('running');
    this.logger.info('[BugHuntWorkflow] Starting bug hunt workflow');

    try {
      // Execute phases sequentially
      await this.analyzeScope();
      await this.creativeE2ETesting();
      await this.adversarialTesting();

      // Generate and return bug report
      const results = await this.generateReport();

      this.setStatus('completed');
      this.logger.info(
        '[BugHuntWorkflow] Bug hunt workflow completed successfully',
        {
          hasBugs: results.hasBugs,
          bugCount: results.bugs.length,
        }
      );

      return results;
    } catch (error) {
      // PATTERN: Set status to failed on error
      this.setStatus('failed');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('[BugHuntWorkflow] Bug hunt workflow failed', {
        error: errorMessage,
      });
      throw error;
    }
  }
}
```

### Integration Points

```yaml
WORKFLOW_BASE:
  - extend: Workflow from 'groundswell'
  - constructor: super('BugHuntWorkflow')
  - decorators: @Step({ trackTiming: true }), @ObservedState()

QA_AGENT:
  - import: createQAAgent from '../agents/agent-factory.js'
  - usage: const qaAgent = createQAAgent()
  - returns: Agent with 'qa' persona, BUG_HUNT_PROMPT system prompt

QA_PROMPT:
  - import: createBugHuntPrompt from '../agents/prompts/bug-hunt-prompt.js'
  - usage: createBugHuntPrompt(prdContent, completedTasks)
  - returns: Prompt<TestResults> with enableReflection: true

MODELS:
  - import: Task, TestResults, Bug from '../core/models.js'
  - TestResults: hasBugs (boolean), bugs (Bug[]), summary, recommendations
  - Bug: id, severity ('critical'|'major'|'minor'|'cosmetic'), title, description, reproduction, location

EXPORTS:
  - add to: src/workflows/index.ts
  - pattern: export { BugHuntWorkflow } from './bug-hunt-workflow.js'
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- src/workflows/bug-hunt-workflow.ts     # ESLint with auto-fix
npm run format -- src/workflows/bug-hunt-workflow.ts   # Prettier formatting
npm run check -- src/workflows/bug-hunt-workflow.ts    # TypeScript type checking

# Project-wide validation
npm run lint    # Check all files
npm run format  # Format all files
npm run check   # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test BugHuntWorkflow specifically
npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts

# Run with coverage
npm test -- --coverage tests/unit/workflows/bug-hunt-workflow.test.ts

# Full test suite for workflows
npm test -- tests/unit/workflows/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests
npm test -- tests/integration/bug-hunt-workflow-integration.test.ts

# Test full workflow execution
npm test -- tests/integration/bug-hunt-workflow-integration.test.ts -t "full workflow"

# Expected: BugHuntWorkflow integrates with QA agent correctly, returns TestResults
```

### Level 4: End-to-End Validation

```bash
# Verify integration with existing components
npm test -- tests/unit/agents/agent-factory.test.ts       # Verify createQAAgent
npm test -- tests/integration/prp-pipeline-integration.test.ts  # Verify full pipeline

# Run full test suite
npm test

# Expected: All existing tests still pass, no regressions introduced
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] `BugHuntWorkflow` extends `Workflow` and calls `super('BugHuntWorkflow')`
- [ ] Constructor validates `prdContent` is non-empty string
- [ ] Constructor validates `completedTasks` is array
- [ ] `@ObservedState` properties: `prdContent`, `completedTasks`, `testResults`
- [ ] `@Step({ trackTiming: true })` on all four step methods
- [ ] `analyzeScope()` logs scope analysis findings
- [ ] `creativeE2ETesting()` logs E2E test scenarios
- [ ] `adversarialTesting()` logs adversarial test scenarios
- [ ] `generateReport()` uses `createQAAgent()` and `createBugHuntPrompt()`
- [ ] `run()` executes phases in order: Scope → Creative E2E → Adversarial → Report
- [ ] `run()` returns `TestResults` object
- [ ] `src/workflows/index.ts` exports `BugHuntWorkflow`

### Code Quality Validation

- [ ] Follows existing workflow patterns (delta-analysis-workflow.ts structure)
- [ ] Uses `.js` extensions for ES module imports
- [ ] `@ObservedState` decorator on all public state fields
- [ ] `@Step({ trackTiming: true })` on all step methods
- [ ] Console logging with `[BugHuntWorkflow]` prefix
- [ ] Proper error handling with try/catch and `setStatus('failed')`

### Documentation & Deployment

- [ ] Comprehensive JSDoc comments on class and methods
- [ ] Module-level JSDoc explains three-phase QA workflow
- [ ] Comments explain each phase's purpose
- [ ] Error handling for QA agent failures

---

## Anti-Patterns to Avoid

- ❌ Don't create separate LLM calls for each phase - QA agent does all work in generateReport()
- ❌ Don't skip @ObservedState decorator on public properties - breaks observability
- ❌ Don't forget to call super('BugHuntWorkflow') in constructor - breaks Workflow base class
- ❌ Don't use .ts extensions in imports - ES modules require .js
- ❌ Don't throw generic errors - use descriptive error messages
- ❌ Don't skip constructor validation - empty PRD should throw
- ❌ Don't forget to setStatus('failed') on error - breaks workflow state tracking
- ❌ Don't assume testResults is non-null - check or use ! assertion
- ❌ Don't create new QA agent patterns - use existing createQAAgent()
- ❌ Don't hardcode BUG_HUNT_PROMPT - use createBugHuntPrompt()
- ❌ Don't make real LLM calls in tests - mock createQAAgent and createBugHuntPrompt
- ❌ Don't skip error handling in generateReport() - wrap QA agent call in try/catch
- ❌ Don't forget to export BugHuntWorkflow from src/workflows/index.ts
