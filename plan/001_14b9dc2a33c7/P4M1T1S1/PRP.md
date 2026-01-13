# PRP for P4.M1.T1.S1: Create delta analysis workflow

---

## Goal

**Feature Goal**: Create a Groundswell-based workflow class that orchestrates the delta analysis process, comparing old and new PRD versions to detect changes and generate structured patch instructions for task re-execution.

**Deliverable**:

- `src/workflows/delta-analysis-workflow.ts` - DeltaAnalysisWorkflow class extending Groundswell Workflow
- Integration with createDeltaAnalysisPrompt() from P2.M2.T3.S2
- Unit tests in `tests/unit/workflows/delta-analysis-workflow.test.ts`

**Success Definition**:

- DeltaAnalysisWorkflow extends Workflow and uses @ObservedState decorators
- analyzeDelta() step uses QA agent with createDeltaAnalysisPrompt() and returns typed DeltaAnalysis
- run() method orchestrates the analysis flow end-to-end
- All tests pass with 100% coverage (per vitest.config.ts requirements)

## User Persona

**Target User**: PRP Pipeline system - specifically the PRPPipeline when delta session is triggered

**Use Case**: When PRD hash mismatch is detected during session initialization, the delta analysis workflow is invoked to compare PRD versions and determine what needs to change in the task backlog

**User Journey**:

1. PRPPipeline detects hash mismatch (from SessionManager)
2. DeltaAnalysisWorkflow is instantiated with oldPRD, newPRD, completedTasks
3. analyzeDelta() step runs QA agent with delta analysis prompt
4. Returns DeltaAnalysis with changes, patchInstructions, and taskIds to re-execute
5. Task patching logic (P4.M1.T1.S2) consumes the analysis

**Pain Points Addressed**:

- Automates PRD comparison instead of manual analysis
- Preserves completed work unless critically affected
- Provides structured output for deterministic task patching
- Uses Groundswell observability for tracking delta analysis lifecycle

## Why

- **Delta Session Foundation**: First step in P4.M1 (Delta Session Implementation) - enables intelligent PRD change handling
- **Automated Change Detection**: Replaces manual PRD comparison with LLM-powered semantic analysis
- **Work Preservation**: Respects completedTaskIds to avoid re-executing unaffected work
- **Integration Point**: Connects P2.M2.T3 (createDeltaAnalysisPrompt) with P4.M1.T1.S2 (task patching logic)

## What

### System Behavior

Create a workflow class that:

1. **Accepts Input**: Constructor takes oldPRD (string), newPRD (string), completedTasks (string[])
2. **Exposes State**: @ObservedState() decorators for oldPRD, newPRD, completedTasks, deltaAnalysis
3. **Runs Analysis**: @Step() async analyzeDelta() uses QA agent with createDeltaAnalysisPrompt()
4. **Returns Result**: run() returns DeltaAnalysis with changes array, patchInstructions, taskIds

### Success Criteria

- [ ] DeltaAnalysisWorkflow class extends Groundswell Workflow
- [ ] Constructor accepts oldPRD, newPRD, completedTasks parameters
- [ ] @ObservedState() decorators on oldPRD, newPRD, completedTasks, deltaAnalysis fields
- [ ] @Step() decorated analyzeDelta() method returning Promise<DeltaAnalysis>
- [ ] run() method orchestrates analysis and returns DeltaAnalysis
- [ ] Uses createQAAgent() from agent-factory
- [ ] Uses createDeltaAnalysisPrompt() from prompts/delta-analysis-prompt
- [ ] Unit tests cover constructor, analyzeDelta(), run(), error cases
- [ ] 100% test coverage achieved

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Complete Groundswell Workflow class pattern from PRPPipeline
- @ObservedState and @Step decorator usage examples
- createDeltaAnalysisPrompt() function signature and usage
- DeltaAnalysis interface and schema definition
- createQAAgent() factory function reference
- Test patterns from existing workflow tests
- Import patterns with .js extension requirements

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- docfile: plan/001_14b9dc2a33c7/P3M4.T2S3/PRP.md
  why: Previous PRP that produces CLI entry point - shows npm scripts structure
  critical: Lines 56-83 show workflow JSDoc pattern with @remarks and @example
  note: DeltaAnalysisWorkflow will be integrated by future pipeline tasks

- file: src/workflows/prp-pipeline.ts
  why: Complete Groundswell Workflow class pattern to follow
  critical: Lines 25-26 import Workflow, Step from 'groundswell'
  critical: Lines 94-178 show class extends Workflow with constructor pattern
  critical: Lines 99-124 show @ObservedState() public field pattern
  critical: Lines 237-277 show @Step() async method pattern
  critical: Lines 568-636 show run() method orchestration pattern
  pattern: Use this.logger.info/warn/error for logging, this.setStatus() for lifecycle
  gotcha: Constructor MUST call super('WorkflowName') with descriptive name

- file: src/workflows/hello-world.ts
  why: Minimal workflow example showing basic pattern
  critical: Lines 19-20 import Workflow from 'groundswell'
  critical: Lines 28-44 show minimal run() implementation
  pattern: Extend Workflow, call this.setStatus('running'), this.setStatus('completed')

- file: src/agents/prompts/delta-analysis-prompt.ts
  why: Contains createDeltaAnalysisPrompt() function to use
  critical: Lines 123-144 show function signature: createDeltaAnalysisPrompt(oldPRD, newPRD, completedTaskIds?)
  critical: Lines 128-143 show Prompt<DeltaAnalysis> return type
  critical: Line 138 shows responseFormat: DeltaAnalysisSchema for type-safe output
  critical: Line 142 shows enableReflection: true for error recovery
  pattern: Call createDeltaAnalysisPrompt(oldPRD, newPRD, completedTasks) to get prompt

- file: src/core/models.ts
  why: DeltaAnalysis interface definition (lines 1462-1522)
  critical: Lines 1462-1496 show DeltaAnalysis interface with changes, patchInstructions, taskIds
  critical: Lines 1518-1522 show DeltaAnalysisSchema Zod validation
  critical: Lines 1361-1400 show RequirementChange interface (nested in changes array)
  pattern: DeltaAnalysis = { changes: RequirementChange[], patchInstructions: string, taskIds: string[] }

- file: src/core/models.ts
  why: RequirementChange interface for changes array
  critical: Lines 1361-1400 show RequirementChange with itemId, type, description, impact
  pattern: type is 'added' | 'modified' | 'removed'

- file: src/agents/agent-factory.ts
  why: Contains createQAAgent() factory function
  critical: Lines 266-274 show createQAAgent() implementation
  critical: Uses BUG_HUNT_PROMPT system prompt (but delta analysis uses DELTA_ANALYSIS_PROMPT)
  pattern: createQAAgent() returns Agent instance, call .prompt(prompt) on it
  gotcha: createQAAgent() uses BUG_HUNT_PROMPT - we override with custom prompt

- file: src/agents/prompts.ts
  why: DELTA_ANALYSIS_PROMPT system prompt definition
  critical: Lines 745-857 show complete DELTA_ANALYSIS_PROMPT constant
  critical: Lines 780-796 show expected JSON output format
  critical: Lines 805-854 show few-shot examples for delta analysis
  note: This is imported by createDeltaAnalysisPrompt(), not used directly

- file: tests/unit/workflows/prp-pipeline.test.ts
  why: Test pattern for workflow classes
  critical: Lines 1-100 show test structure with describe, expect, it, beforeEach
  critical: Lines 14-16 show import pattern for workflow and types
  critical: Lines 23-37 show mock pattern with vi.mock()
  critical: Lines 61-100 show factory functions for test data
  pattern: Use vi.mock() for external dependencies, vi.fn() for mocks
  pattern: Tests follow Setup/Execute/Verify structure

- file: vitest.config.ts
  why: Test configuration requirements
  critical: Lines 30-36 show 100% coverage threshold requirement
  critical: Lines 13-16 show test.environment: 'node'
  pattern: All branches, functions, lines, statements must be covered

- docfile: plan/001_14b9dc2a33c7/P2M2.T3S2/PRP.md
  why: PRP that produced createDeltaAnalysisPrompt() function
  critical: Shows the function is complete and ready to use
  note: Input to this workflow, not created by this workflow

- docfile: plan/001_14b9dc2a33c7/P2M2.T3S1/PRP.md
  why: PRP that produced DeltaAnalysisSchema
  critical: Shows schema validation is in place
  note: Schema is imported from core/models.js

# CRITICAL GOTCHAS - Groundswell Workflow Usage

- file: src/workflows/prp-pipeline.ts
  why: Shows how to properly use @ObservedState and @Step decorators
  critical: Lines 99-124 show public fields with @ObservedState() decorator (NO parameters)
  critical: Lines 237-277 show @Step({ trackTiming: true }) decorator pattern
  gotcha: @ObservedState() has empty parentheses, @Step() takes { trackTiming: true }
  gotcha: Fields must be public (no # prefix) for Groundswell to observe them
  gotcha: @Step methods are automatically tracked for timing and snapshots

# CRITICAL GOTCHAS - TypeScript/ES Module Configuration

- file: tsconfig.json
  why: TypeScript compilation settings
  critical: Lines 3-4 show "module": "NodeNext", "moduleResolution": "NodeNext"
  pattern: ALL imports must use .js extension (even for .ts files)
  gotcha: import from './core/models.js' NOT './core/models.ts'

- file: src/core/index.ts
  why: Central export point for core types
  critical: Lines 49 show DeltaAnalysis export
  critical: Lines 71 show DeltaAnalysisSchema export
  pattern: Import types from './core/models.js' or './core/index.js'
```

### Current Codebase Tree

```bash
src/
├── workflows/
│   ├── hello-world.ts           # Minimal workflow example
│   └── prp-pipeline.ts          # Full PRPPipeline with @ObservedState, @Step
├── agents/
│   ├── agent-factory.ts         # createQAAgent() function
│   ├── prompts/
│   │   ├── delta-analysis-prompt.ts  # createDeltaAnalysisPrompt()
│   │   ├── index.ts                    # Exports all prompt generators
│   │   └── ...
│   └── prompts.ts                # DELTA_ANALYSIS_PROMPT constant
├── core/
│   ├── index.ts                  # Exports DeltaAnalysis, DeltaAnalysisSchema
│   └── models.ts                 # DeltaAnalysis, RequirementChange interfaces
└── ...

tests/
├── unit/
│   └── workflows/
│       └── prp-pipeline.test.ts  # Test pattern reference
└── ...
```

### Desired Codebase Tree with Files Added

```bash
# NEW FILES:
src/workflows/
└── delta-analysis-workflow.ts    # CREATE: DeltaAnalysisWorkflow class

tests/unit/workflows/
└── delta-analysis-workflow.test.ts  # CREATE: Unit tests

# MODIFIED FILES:
src/workflows/index.ts            # MODIFY: Export DeltaAnalysisWorkflow

# All other files remain unchanged
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Groundswell Workflow class usage
// - Import: import { Workflow, Step } from 'groundswell';
// - Class MUST extend Workflow
// - Constructor MUST call super('DescriptiveWorkflowName')
// - @ObservedState() decorator with EMPTY parentheses on public fields
// - @Step({ trackTiming: true }) decorator on async methods
// - Use this.logger.info/warn/error for logging (not console.log)
// - Use this.setStatus('running' | 'completed' | 'failed') for lifecycle

// CRITICAL: TypeScript ES Module imports
// - ALL imports must use .js extension (even for .ts files)
// - Example: import { DeltaAnalysis } from './core/models.js';
// - This is due to "module": "NodeNext" in tsconfig.json

// CRITICAL: Agent.prompt() return type
// - agent.prompt() returns Promise<z.infer<typeof Schema>>
// - For createDeltaAnalysisPrompt(), this is Promise<DeltaAnalysis>
// - Type assertion may be needed: const result = await agent.prompt(prompt) as DeltaAnalysis;

// CRITICAL: Vitest 100% coverage requirement
// - All branches, functions, lines, statements must be covered
// - Missing coverage causes tests to fail
// - See vitest.config.ts lines 30-36

// GOTCHA: createQAAgent() uses BUG_HUNT_PROMPT by default
// - We override the prompt by passing custom Prompt to agent.prompt()
// - The system prompt is passed to createPrompt(), not createAgent()

// GOTCHA: @ObservedState fields must be PUBLIC
// - Cannot use # private fields
// - Cannot use private keyword
// - Groundswell needs direct access to observe state changes

// GOTCHA: DeltaAnalysis.taskIds can be empty array
// - Empty array means no tasks affected (rare but valid)
// - Don't assume taskIds always has elements

// GOTCHA: completedTasks can be undefined in createDeltaAnalysisPrompt()
// - Third parameter is optional: completedTaskIds?: string[]
// - Pass undefined instead of empty array for new sessions
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Uses existing DeltaAnalysis interface from `src/core/models.js`:

```typescript
// From src/core/models.ts lines 1462-1496
export interface DeltaAnalysis {
  readonly changes: RequirementChange[]; // Array of detected changes
  readonly patchInstructions: string; // Natural language patch guide
  readonly taskIds: string[]; // Tasks needing re-execution
}

export interface RequirementChange {
  readonly itemId: string; // P1.M2.T3.S1 format
  readonly type: 'added' | 'modified' | 'removed';
  readonly description: string; // What changed
  readonly impact: string; // Implementation impact
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/workflows/delta-analysis-workflow.ts
  - IMPORT: { Workflow, Step } from 'groundswell'
  - IMPORT: { DeltaAnalysis } from '../core/models.js'
  - IMPORT: { createQAAgent } from '../agents/agent-factory.js'
  - IMPORT: { createDeltaAnalysisPrompt } from '../agents/prompts/delta-analysis-prompt.js'
  - IMPLEMENT: DeltaAnalysisWorkflow class extends Workflow
  - FOLLOW pattern: src/workflows/prp-pipeline.ts (lines 94-178 for class structure)
  - NAMING: PascalCase class name, PascalCase file name with hyphens
  - PLACEMENT: src/workflows/delta-analysis-workflow.ts

Task 2: IMPLEMENT class fields with @ObservedState() decorators
  - ADD: @ObservedState() oldPRD: string (public field)
  - ADD: @ObservedState() newPRD: string (public field)
  - ADD: @ObservedState() completedTasks: string[] (public field)
  - ADD: @ObservedState() deltaAnalysis: DeltaAnalysis | null (public field)
  - ADD: Private readonly fields for constructor parameters
  - FOLLOW pattern: src/workflows/prp-pipeline.ts (lines 99-124)
  - GOTCHA: Use @ObservedState() with EMPTY parentheses
  - GOTCHA: Fields must be public (no # prefix)

Task 3: IMPLEMENT constructor
  - ACCEPT: oldPRD: string, newPRD: string, completedTasks: string[]
  - VALIDATE: oldPRD and newPRD are non-empty strings
  - CALL: super('DeltaAnalysisWorkflow') with descriptive name
  - ASSIGN: this.oldPRD = oldPRD, this.newPRD = newPRD, this.completedTasks = completedTasks
  - INITIALIZE: this.deltaAnalysis = null
  - FOLLOW pattern: src/workflows/prp-pipeline.ts (lines 162-181)
  - PLACEMENT: In DeltaAnalysisWorkflow class

Task 4: IMPLEMENT @Step() decorated analyzeDelta() method
  - ADD: @Step({ trackTiming: true }) decorator
  - SIGNATURE: async analyzeDelta(): Promise<DeltaAnalysis>
  - LOG: this.logger.info('[DeltaAnalysisWorkflow] Starting delta analysis')
  - CREATE: qaAgent = createQAAgent()
  - CREATE: prompt = createDeltaAnalysisPrompt(this.oldPRD, this.newPRD, this.completedTasks)
  - CALL: const result = await qaAgent.prompt(prompt) as DeltaAnalysis
  - ASSIGN: this.deltaAnalysis = result
  - LOG: this.logger.info('[DeltaAnalysisWorkflow] Analysis complete')
  - LOG: this.logger.info(`[DeltaAnalysisWorkflow] Found ${result.changes.length} changes`)
  - RETURN: result
  - FOLLOW pattern: src/workflows/prp-pipeline.ts (lines 237-277)
  - GOTCHA: Type assertion needed for agent.prompt() return
  - PLACEMENT: In DeltaAnalysisWorkflow class

Task 5: IMPLEMENT run() method
  - SIGNATURE: async run(): Promise<DeltaAnalysis>
  - CALL: this.setStatus('running')
  - LOG: this.logger.info('[DeltaAnalysisWorkflow] Starting workflow')
  - CALL: const analysis = await this.analyzeDelta()
  - CALL: this.setStatus('completed')
  - LOG: this.logger.info('[DeltaAnalysisWorkflow] Workflow completed')
  - RETURN: analysis
  - FOLLOW pattern: src/workflows/prp-pipeline.ts (lines 568-636)
  - FOLLOW pattern: src/workflows/hello-world.ts (lines 36-44)
  - PLACEMENT: In DeltaAnalysisWorkflow class

Task 6: MODIFY src/workflows/index.ts
  - ADD: export { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
  - PRESERVE: All existing exports (HelloWorldWorkflow, PRPPipeline)
  - PLACEMENT: After existing workflow exports

Task 7: CREATE tests/unit/workflows/delta-analysis-workflow.test.ts
  - IMPORT: describe, expect, it, vi, beforeEach from 'vitest'
  - IMPORT: DeltaAnalysisWorkflow from '../../../src/workflows/delta-analysis-workflow.js'
  - IMPORT: { DeltaAnalysis, RequirementChange } from '../../../src/core/models.js'
  - MOCK: vi.mock('../agents/agent-factory.js') for createQAAgent
  - MOCK: vi.mock('../agents/prompts/delta-analysis-prompt.js') for createDeltaAnalysisPrompt
  - IMPLEMENT: describe('DeltaAnalysisWorkflow') suite
  - IMPLEMENT: constructor validation tests (empty strings throw error)
  - IMPLEMENT: analyzeDelta() success test with mock agent
  - IMPLEMENT: analyzeDelta() error handling test
  - IMPLEMENT: run() orchestration test
  - FOLLOW pattern: tests/unit/workflows/prp-pipeline.test.ts (lines 1-100)
  - COVERAGE: 100% coverage (all branches, lines, statements)
  - PLACEMENT: tests/unit/workflows/delta-analysis-workflow.test.ts
```

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// CLASS STRUCTURE PATTERN (from prp-pipeline.ts lines 94-178)
// ============================================================================

import { Workflow, Step } from 'groundswell';
import type { DeltaAnalysis } from '../core/models.js';
import { createQAAgent } from '../agents/agent-factory.js';
import { createDeltaAnalysisPrompt } from '../agents/prompts/delta-analysis-prompt.js';

/**
 * Delta Analysis workflow for PRD comparison and task patching
 *
 * @module workflows/delta-analysis-workflow
 *
 * @remarks
 * Analyzes PRD version differences to detect changes and generate
 * structured patch instructions for delta session task re-execution.
 *
 * @example
 * ```typescript
 * import { DeltaAnalysisWorkflow } from './workflows/delta-analysis-workflow.js';
 *
 * const workflow = new DeltaAnalysisWorkflow(oldPRD, newPRD, ['P1.M1.T1']);
 * const analysis = await workflow.run();
 * console.log(`Found ${analysis.changes.length} changes`);
 * ```
 */
export class DeltaAnalysisWorkflow extends Workflow {
  // ========================================================================
  // Public Observed State Fields (tracked by Groundswell)
  // ========================================================================

  /** Previous PRD content for comparison */
  @ObservedState()
  oldPRD: string;

  /** Current PRD content for comparison */
  @ObservedState()
  newPRD: string;

  /** List of completed task IDs to preserve */
  @ObservedState()
  completedTasks: string[];

  /** Delta analysis result (null until analyzeDelta completes) */
  @ObservedState()
  deltaAnalysis: DeltaAnalysis | null = null;

  // ========================================================================
  // Private Fields
  // ========================================================================

  // No additional private fields needed for this simple workflow

  // ========================================================================
  // Constructor
  // ========================================================================

  /**
   * Creates a new DeltaAnalysisWorkflow instance
   *
   * @param oldPRD - Previous PRD markdown content
   * @param newPRD - Current PRD markdown content
   * @param completedTasks - List of completed task IDs to preserve
   * @throws {Error} If oldPRD or newPRD is empty
   */
  constructor(oldPRD: string, newPRD: string, completedTasks: string[]) {
    super('DeltaAnalysisWorkflow');

    if (!oldPRD || oldPRD.trim() === '') {
      throw new Error('oldPRD cannot be empty');
    }

    if (!newPRD || newPRD.trim() === '') {
      throw new Error('newPRD cannot be empty');
    }

    this.oldPRD = oldPRD;
    this.newPRD = newPRD;
    this.completedTasks = completedTasks;
  }

  // ========================================================================
  // Step Methods
  // ========================================================================

  /**
   * Analyze PRD delta and generate patch instructions
   *
   * @remarks
   * Uses QA agent with delta analysis prompt to compare PRD versions
   * and generate structured DeltaAnalysis output.
   *
   * @returns Delta analysis with changes, patch instructions, and affected task IDs
   */
  @Step({ trackTiming: true })
  async analyzeDelta(): Promise<DeltaAnalysis> {
    this.logger.info('[DeltaAnalysisWorkflow] Starting delta analysis');

    try {
      // Create QA agent
      const qaAgent = createQAAgent();

      // Create delta analysis prompt
      const prompt = createDeltaAnalysisPrompt(
        this.oldPRD,
        this.newPRD,
        this.completedTasks
      );

      // Execute analysis
      // PATTERN: Type assertion needed for agent.prompt() return
      const result = (await qaAgent.prompt(prompt)) as DeltaAnalysis;

      // Store result
      this.deltaAnalysis = result;

      this.logger.info('[DeltaAnalysisWorkflow] Analysis complete');
      this.logger.info(
        `[DeltaAnalysisWorkflow] Found ${result.changes.length} changes`
      );
      this.logger.info(
        `[DeltaAnalysisWorkflow] Affected tasks: ${result.taskIds.length}`
      );

      return result;
    } catch (error) {
      this.logger.error(`[DeltaAnalysisWorkflow] Analysis failed: ${error}`);
      throw error;
    }
  }

  // ========================================================================
  // Main Entry Point
  // ========================================================================

  /**
   * Run the delta analysis workflow
   *
   * @remarks
   * Orchestrates the complete delta analysis process:
   * 1. Set status to running
   * 2. Execute analyzeDelta() step
   * 3. Set status to completed
   * 4. Return DeltaAnalysis result
   *
   * @returns Delta analysis with changes, patch instructions, and affected task IDs
   */
  async run(): Promise<DeltaAnalysis> {
    this.setStatus('running');

    this.logger.info('[DeltaAnalysisWorkflow] Starting workflow');
    this.logger.info('[DeltaAnalysisWorkflow] Comparing PRD versions');
    this.logger.info(
      `[DeltaAnalysisWorkflow] Completed tasks to preserve: ${this.completedTasks.length}`
    );

    const analysis = await this.analyzeDelta();

    this.setStatus('completed');

    this.logger.info('[DeltaAnalysisWorkflow] Workflow completed');

    return analysis;
  }
}

// ============================================================================
// EXPORT PATTERN (src/workflows/index.ts)
// ============================================================================

// Add to existing exports in src/workflows/index.ts:
// export { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
````

### Integration Points

```yaml
DELTA_ANALYSIS_PROMPT:
  - file: src/agents/prompts.ts
  - import: DELTA_ANALYSIS_PROMPT constant
  - usage: Imported by createDeltaAnalysisPrompt(), not used directly
  - note: Prompt content lines 745-857 define Requirements Change Analyst persona

CREATE_DELTA_ANALYSIS_PROMPT:
  - file: src/agents/prompts/delta-analysis-prompt.ts
  - function: createDeltaAnalysisPrompt(oldPRD, newPRD, completedTaskIds?)
  - returns: Prompt<DeltaAnalysis> configured for delta analysis
  - usage: Call in analyzeDelta() to get prompt for QA agent

QA_AGENT:
  - file: src/agents/agent-factory.ts
  - function: createQAAgent() returns Agent instance
  - usage: Call in analyzeDelta() to get agent for prompt execution
  - note: Uses BUG_HUNT_PROMPT but we override with custom prompt

WORKFLOWS_INDEX:
  - file: src/workflows/index.ts
  - modify: Add export { DeltaAnalysisWorkflow } from './delta-analysis-workflow.js';
  - preserve: All existing exports
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating delta-analysis-workflow.ts
npm run lint -- src/workflows/delta-analysis-workflow.ts
npm run format -- src/workflows/delta-analysis-workflow.ts
npm run typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run tests for delta analysis workflow
npm test -- tests/unit/workflows/delta-analysis-workflow.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/workflows/delta-analysis-workflow.test.ts

# Full test suite
npm test

# Expected: All tests pass. 100% coverage achieved (vitest.config.ts requirement)
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify exports are accessible
node -e "
  const { DeltaAnalysisWorkflow } = require('./dist/workflows/delta-analysis-workflow.js');
  console.log('DeltaAnalysisWorkflow exported successfully');
"

# Verify imports resolve
npm run build
node -e "
  import { DeltaAnalysisWorkflow } from './dist/workflows/delta-analysis-workflow.js';
  console.log('DeltaAnalysisWorkflow imported successfully');
"

# Expected: All exports resolve correctly, no runtime errors
```

### Level 4: Manual Testing (Functional Validation)

```bash
# Create test script to verify workflow execution
cat > /tmp/test-delta-workflow.mjs << 'EOF'
import { DeltaAnalysisWorkflow } from './dist/workflows/delta-analysis-workflow.js';

const oldPRD = '# Old PRD\n## P1.M1.T1\nImplement login';
const newPRD = '# New PRD\n## P1.M1.T1\nImplement login with OAuth2';
const completedTasks = ['P1.M1.T1'];

const workflow = new DeltaAnalysisWorkflow(oldPRD, newPRD, completedTasks);
console.log('Workflow created successfully');
console.log('Old PRD length:', workflow.oldPRD.length);
console.log('New PRD length:', workflow.newPRD.length);
console.log('Completed tasks:', workflow.completedTasks.length);
EOF

# Run test script
node /tmp/test-delta-workflow.mjs

# Expected: Workflow instantiates correctly, fields are populated
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm test` passes with zero failures
- [ ] `npm run test:coverage` shows 100% coverage for delta-analysis-workflow.ts
- [ ] `npm run build` completes successfully

### Feature Validation

- [ ] DeltaAnalysisWorkflow extends Workflow
- [ ] Constructor accepts oldPRD, newPRD, completedTasks
- [ ] Constructor throws on empty oldPRD
- [ ] Constructor throws on empty newPRD
- [ ] @ObservedState() decorator on oldPRD field
- [ ] @ObservedState() decorator on newPRD field
- [ ] @ObservedState() decorator on completedTasks field
- [ ] @ObservedState() decorator on deltaAnalysis field
- [ ] @Step({ trackTiming: true }) decorator on analyzeDelta()
- [ ] analyzeDelta() calls createQAAgent()
- [ ] analyzeDelta() calls createDeltaAnalysisPrompt()
- [ ] analyzeDelta() calls agent.prompt() with prompt
- [ ] analyzeDelta() returns DeltaAnalysis
- [ ] run() calls this.setStatus('running')
- [ ] run() calls this.setStatus('completed')
- [ ] run() returns DeltaAnalysis

### Code Quality Validation

- [ ] Follows PRPPipeline class structure pattern
- [ ] File uses .js extension for all imports
- [ ] JSDoc comments on class and all public methods
- [ ] @remarks section in class JSDoc
- [ ] @example section in class JSDoc
- [ ] Logging uses this.logger.info/warn/error
- [ ] Error handling with try-catch in analyzeDelta()
- [ ] Type assertion used for agent.prompt() return
- [ ] Export added to src/workflows/index.ts

### Documentation & Deployment

- [ ] Class JSDoc explains delta analysis purpose
- [ ] Method JSDocs explain parameters and return values
- [ ] @remarks sections explain non-obvious behavior
- [ ] @example sections show usage pattern
- [ ] File module JSDoc at top of file
- [ ] Code is self-documenting with clear names

---

## Anti-Patterns to Avoid

- **Don't** use private (#) fields with @ObservedState - decorator requires public access
- **Don't** forget .js extension in imports - breaks ES module resolution
- **Don't** skip type assertion for agent.prompt() - return type is inferred
- **Don't** use console.log - use this.logger.info/warn/error
- **Don't** skip setStatus() calls - workflow lifecycle tracking
- **Don't** forget @ObservedState() decorator - state won't be tracked
- **Don't** forget @Step() decorator - method won't be tracked
- **Don't** skip validation in constructor - empty PRDs cause agent failures
- **Don't** hardcode BUG_HUNT_PROMPT - we use createDeltaAnalysisPrompt() instead
- **Don't** skip error handling - agent failures should propagate
- **Don't** assume taskIds is non-empty - empty array is valid for no-change scenarios
- **Don't** skip JSDoc comments - documentation is required for workflow classes
- **Don't** use sync methods in async context - all agent calls are async
- **Don't** skip tests - 100% coverage is required by vitest.config.ts
