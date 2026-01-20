# QA Agent and Bug Hunting Workflow Research

## Overview

This document captures research findings about the QA Agent, BugHuntWorkflow, and FixCycleWorkflow to support creating integration tests for the QA agent bug hunting workflow.

## BugHuntWorkflow Implementation

### Location
`src/workflows/bug-hunt-workflow.ts` (369 lines)

### Architecture

The BugHuntWorkflow is a Groundswell-based workflow that orchestrates comprehensive QA testing across three phases:

1. **Scope Analysis** (`analyzeScope()`)
   - Analyzes PRD content to understand requirements
   - Builds context for testing
   - Logs completed tasks for reference

2. **Creative E2E Testing** (`creativeE2ETesting()`)
   - Defines test categories: Happy Path, Edge Cases, Workflows, Integration, Error Handling, State, Concurrency, Regression
   - Actual testing performed by QA agent in generateReport phase

3. **Adversarial Testing** (`adversarialTesting()`)
   - Defines adversarial test categories: Unexpected Inputs, Missing Features, Incomplete Features, Implicit Requirements, UX Issues, Security, Performance
   - Actual testing performed by QA agent in generateReport phase

4. **Generate Bug Report** (`generateReport()`)
   - **Creates QA agent** via `createQAAgent()`
   - **Creates bug hunt prompt** via `createBugHuntPrompt(prdContent, completedTasks)`
   - **Executes QA agent** with retry logic via `retryAgentPrompt()`
   - **Returns TestResults** with bugs, severity levels, summary, and recommendations

### Key Implementation Details

```typescript
// Phase 4 is the ONLY phase that makes actual LLM calls
@Step({ trackTiming: true })
async generateReport(): Promise<TestResults> {
  const qaAgent = createQAAgent(); // Creates QA agent
  const prompt = createBugHuntPrompt(this.prdContent, this.completedTasks);
  const results = await retryAgentPrompt(
    () => qaAgent.prompt(prompt) as Promise<TestResults>,
    { agentType: 'QA', operation: 'bugHunt' }
  );
  this.testResults = results;
  return results;
}
```

### Public State Fields
- `prdContent: string` - Original PRD content
- `completedTasks: Task[]` - List of completed tasks to test
- `testResults: TestResults | null` - Generated test results

### Constructor Validation
- Throws if `prdContent` is empty or not a string
- Throws if `completedTasks` is not an array

## FixCycleWorkflow Implementation

### Location
`src/workflows/fix-cycle-workflow.ts` (469 lines)

### Architecture

The FixCycleWorkflow orchestrates iterative bug fixing through a loop:

1. **Create Fix Tasks** (`createFixTasks()`)
   - Converts bugs to subtask-like fix tasks
   - Generates task IDs: `PFIX.M1.T{index}.S1` (zero-padded)
   - Maps severity to story points: critical=13, major=8, minor=3, cosmetic=1
   - Creates `context_scope` with bug details (BUG REFERENCE, DESCRIPTION, REPRODUCTION STEPS, TARGET LOCATION, FIX REQUIREMENTS, VALIDATION CRITERIA)

2. **Execute Fixes** (`executeFixes()`)
   - Executes fix tasks via `TaskOrchestrator.executeSubtask()`
   - Handles failures gracefully (logs error, continues with next fix)

3. **Re-test** (`retest()`)
   - Extracts completed tasks from session backlog
   - Runs BugHuntWorkflow to verify fixes
   - Returns new TestResults with remaining bugs

4. **Check Completion** (`checkComplete()`)
   - Returns `true` if no critical or major bugs remain
   - Minor and cosmetic bugs are acceptable

### Loop Termination
- Loops until: no critical/major bugs remain OR max iterations (3) reached
- Max iterations hardcoded: `maxIterations: number = 3`

### Public State Fields
- `testResults: TestResults` - Initial test results from BugHuntWorkflow
- `prdContent: string` - Original PRD content
- `taskOrchestrator: TaskOrchestrator` - For executing fix tasks
- `sessionManager: SessionManager` - For state persistence
- `iteration: number` - Current iteration counter (starts at 0)
- `maxIterations: number` - Maximum fix iterations (hardcoded to 3)
- `currentResults: TestResults | null` - Latest test results from retest

### Fix Task Structure

Fix tasks are created as Subtask objects:
```typescript
{
  id: `PFIX.M1.T${String(index + 1).padStart(3, '0')}.S1`,
  type: 'Subtask',
  title: `[BUG FIX] ${bug.title}`,
  status: 'Planned',
  story_points: severityToPoints[bug.severity],
  dependencies: [], // Fix tasks are independent
  context_scope: `# BUG REFERENCE\nBug ID: ${bug.id}\n...`
}
```

## QA Agent Configuration

### Location
`src/agents/agent-factory.ts` (lines 276-295)

### Configuration
```typescript
export function createQAAgent(): Agent {
  const baseConfig = createBaseConfig('qa');
  const config = {
    ...baseConfig,
    system: BUG_HUNT_PROMPT,
    mcps: MCP_TOOLS,
    // maxTokens: 4096 (from PERSONA_TOKEN_LIMITS)
  };
  return createAgent(config);
}
```

### Token Limit
```typescript
const PERSONA_TOKEN_LIMITS = {
  qa: 4096,
} as const;
```

### MCP Tools
- BASH_MCP
- FILESYSTEM_MCP
- GIT_MCP

## BUG_HUNT_PROMPT Structure

### Location
`src/agents/prompts.ts` (lines 868-994)

### Three Phases of Testing

#### Phase 1: PRD Scope Analysis
1. Read and deeply understand the original PRD requirements
2. Map each requirement to what should have been implemented
3. Identify the expected user journeys and workflows
4. Note any edge cases or corner cases implied by the requirements

#### Phase 2: Creative End-to-End Testing
1. **Happy Path Testing**: Does the primary use case work as specified?
2. **Edge Case Testing**: Boundaries, empty inputs, max values, unicode, special chars
3. **Workflow Testing**: Complete user journeys
4. **Integration Testing**: Component interactions
5. **Error Handling**: Graceful failures
6. **State Testing**: State transitions
7. **Concurrency Testing**: Parallel operations
8. **Regression Testing**: Did fixing break other things?

#### Phase 3: Adversarial Testing
1. **Unexpected Inputs**: Undefined scenarios, malformed data
2. **Missing Features**: PRD requirements not implemented
3. **Incomplete Features**: Partial implementations
4. **Implicit Requirements**: Obvious but unstated functionality
5. **User Experience Issues**: Usability, intuitiveness

#### Phase 4: Documentation as Bug Report
Writes structured bug report to `./$BUG_RESULTS_FILE`

### Bug Severity Levels
- **critical**: Blocks core functionality
- **major**: Significantly impacts user experience or functionality
- **minor**: Small improvements
- **cosmetic**: Polish items

## Bug Hunt Prompt Generator

### Location
`src/agents/prompts/bug-hunt-prompt.ts`

### Function Signature
```typescript
export function createBugHuntPrompt(
  prd: string,
  completedTasks: Task[]
): Prompt<TestResults>
```

### Implementation
- Constructs user prompt with PRD, completed tasks list, and BUG_HUNT_PROMPT
- Returns Groundswell Prompt with:
  - `user`: PRD content + completed tasks + BUG_HUNT_PROMPT
  - `system`: BUG_HUNT_PROMPT
  - `responseFormat`: TestResultsSchema (type-safe JSON output)
  - `enableReflection`: true (for thorough analysis reliability)

## Data Models

### TestResults Schema
Location: `src/core/models.ts` (lines 1862-1867)

```typescript
export const TestResultsSchema: z.ZodType<TestResults> = z.object({
  hasBugs: z.boolean(),
  bugs: z.array(BugSchema),
  summary: z.string().min(1, 'Summary is required'),
  recommendations: z.array(z.string()).min(0),
});
```

### Bug Schema
Location: `src/core/models.ts` (lines 1755-1762)

```typescript
export const BugSchema: z.ZodType<Bug> = z.object({
  id: z.string().min(1, 'Bug ID is required'),
  severity: BugSeverityEnum, // 'critical' | 'major' | 'minor' | 'cosmetic'
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  reproduction: z.string().min(1, 'Reproduction steps are required'),
  location: z.string().optional(),
});
```

## Existing Integration Test Patterns

### BugHuntWorkflow Integration Test
Location: `tests/integration/bug-hunt-workflow-integration.test.ts`

**Key patterns:**
- Mocks `createQAAgent` and `createBugHuntPrompt` via `vi.mock()`
- Factory functions for test data (`createTestTask`, `createTestBug`, `createTestResults`)
- Tests full workflow execution, error handling, and observability

### FixCycleWorkflow Integration Test
Location: `tests/integration/fix-cycle-workflow-integration.test.ts`

**Key patterns:**
- Mocks `BugHuntWorkflow` to avoid external dependencies
- Tests fix cycle loop behavior, task extraction, and completion logic
- Tests error handling and graceful failure scenarios

### Mock Setup Pattern
```typescript
// Mock at top level
vi.mock('../../src/agents/agent-factory.js', () => ({
  createQAAgent: vi.fn(),
}));

// Import after mock
import { createQAAgent } from '../../src/agents/agent-factory.js';

// Cast mocked functions
const mockCreateQAAgent = createQAAgent as any;
```

## Test Data Factories

### createTestTask
```typescript
const createTestTask = (
  id: string,
  title: string,
  description?: string
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Complete',
  description: description ?? `Description for ${title}`,
  subtasks: [],
});
```

### createTestBug
```typescript
const createTestBug = (
  id: string,
  severity: 'critical' | 'major' | 'minor' | 'cosmetic',
  title: string,
  description: string,
  reproduction: string,
  location?: string
): Bug => ({
  id,
  severity,
  title,
  description,
  reproduction,
  location,
});
```

### createTestResults
```typescript
const createTestResults = (
  hasBugs: boolean,
  bugs: Bug[],
  summary: string,
  recommendations: string[]
): TestResults => ({
  hasBugs,
  bugs,
  summary,
  recommendations,
});
```

## Work Item Contract Requirements

From the work item description:

1. **Three phases**: QA Agent uses BUG_FINDING_PROMPT with three phases: Scope Analysis, Creative E2E Testing, Adversarial Testing
2. **Bug severity**: critical, major, minor, cosmetic
3. **Bug report**: Written to TEST_RESULTS.md only if bugs exist
4. **FixCycleWorkflow**: Creates self-contained bugfix sessions
5. **Fix cycle loops**: Until no bugs found (max 3 iterations)
6. **Integration test**: `tests/integration/qa-agent.test.ts` with bug detection, reporting, and fix cycle verification

## Key References

- `src/workflows/bug-hunt-workflow.ts` - BugHuntWorkflow implementation
- `src/workflows/fix-cycle-workflow.ts` - FixCycleWorkflow implementation
- `src/agents/agent-factory.ts` - createQAAgent() function
- `src/agents/prompts.ts` - BUG_HUNT_PROMPT definition
- `src/agents/prompts/bug-hunt-prompt.ts` - createBugHuntPrompt() function
- `src/core/models.ts` - TestResults, Bug schemas
- `tests/integration/bug-hunt-workflow-integration.test.ts` - Existing workflow test patterns
- `tests/integration/fix-cycle-workflow-integration.test.ts` - Existing fix cycle test patterns
- `plan/003_b3d3efdaf0ed/docs/system_context.md` - System architecture documentation
