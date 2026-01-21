# Product Requirement Prompt (PRP): P1.M1.T3.S4 - Verify QA Agent and bug hunting workflow

---

## Goal

**Feature Goal**: Verify QA Agent is correctly integrated with proper configuration, BUG_HUNT_PROMPT structure compliance (three testing phases), and bug hunting workflow (BugHuntWorkflow + FixCycleWorkflow) through comprehensive integration tests.

**Deliverable**: Integration test file `tests/integration/qa-agent.test.ts` with test cases covering:

- QA Agent configuration verification (model, tokens, MCP tools, cache, BUG_HUNT_PROMPT)
- BUG_HUNT_PROMPT structure validation (three phases: Scope Analysis, Creative E2E Testing, Adversarial Testing)
- Bug severity levels (critical, major, minor, cosmetic) and TestResults schema compliance
- BugHuntWorkflow three-phase execution (analyzeScope, creativeE2ETesting, adversarialTesting, generateReport)
- Bug report generation (TestResults with bugs array, summary, recommendations)
- FixCycleWorkflow self-contained bugfix sessions (PFIX task IDs, context_scope with bug details)
- Fix cycle loop behavior (until no critical/major bugs or max 3 iterations)
- Mock agent responses and test scenarios for deterministic testing

**Success Definition**: All tests pass, verifying:

- QA Agent created with correct config (GLM-4.7, 4096 tokens, MCP tools: BASH, FILESYSTEM, GIT, BUG_HUNT_PROMPT)
- BUG_HUNT_PROMPT contains all three testing phases (Scope Analysis, Creative E2E, Adversarial)
- BUG_HUNT_PROMPT specifies bug severity levels (critical, major, minor, cosmetic)
- BugHuntWorkflow executes all four phases sequentially (analyzeScope, creativeE2ETesting, adversarialTesting, generateReport)
- Bug report is written only if bugs exist (TestResults.hasBugs drives this)
- Bug severity levels are correctly assigned (critical, major, minor, cosmetic)
- FixCycleWorkflow creates self-contained bugfix sessions (PFIX.M1.T###.S1 task IDs)
- Fix cycle loops until no critical/major bugs found OR max 3 iterations reached
- Mock QA agent responses work for deterministic testing
- createBugHuntPrompt generates correct prompt structure (PRD + completed tasks + BUG_HUNT_PROMPT)

## Why

- QA Agent is responsible for comprehensive bug hunting beyond standard validation
- The BUG_HUNT_PROMPT is critical for ensuring proper three-phase testing workflow
- BugHuntWorkflow orchestrates the QA testing process through structured phases
- FixCycleWorkflow enables iterative bug fixing with self-contained sessions
- Bug severity levels drive fix prioritization and fix cycle termination
- Configuration errors would cause QA agent to fail or produce incorrect bug reports
- Prompt structure errors would cause incomplete or incorrect bug detection
- Workflow bugs could allow critical bugs to pass undetected
- No existing tests verify QA Agent integration setup or end-to-end bug hunting workflow

## What

Integration tests that verify QA Agent is correctly configured, bug hunting workflows execute properly, and the fix cycle iterates correctly.

### Success Criteria

- [ ] QA Agent configuration validated (model: GLM-4.7, maxTokens: 4096, MCP tools: BASH_MCP, FILESYSTEM_MCP, GIT_MCP)
- [ ] QA Agent uses BUG_HUNT_PROMPT as system prompt
- [ ] BUG_HUNT_PROMPT contains Phase 1: PRD Scope Analysis
- [ ] BUG_HUNT_PROMPT contains Phase 2: Creative End-to-End Testing (8 test categories)
- [ ] BUG_HUNT_PROMPT contains Phase 3: Adversarial Testing (5 test categories)
- [ ] BUG_HUNT_PROMPT contains Phase 4: Documentation as Bug Report
- [ ] BUG_HUNT_PROMPT specifies bug severity levels (critical, major, minor, cosmetic)
- [ ] BugHuntWorkflow executes four phases sequentially (analyzeScope → creativeE2ETesting → adversarialTesting → generateReport)
- [ ] BugHuntWorkflow calls createQAAgent() and createBugHuntPrompt() correctly
- [ ] BugHuntWorkflow returns TestResults with correct structure (hasBugs, bugs array, summary, recommendations)
- [ ] Bug severity levels are correctly assigned (critical, major, minor, cosmetic)
- [ ] FixCycleWorkflow creates fix tasks with PFIX.M1.T###.S1 IDs (zero-padded)
- [ ] FixCycleWorkflow creates context_scope with bug details (BUG REFERENCE, DESCRIPTION, REPRODUCTION STEPS, TARGET LOCATION, FIX REQUIREMENTS, VALIDATION CRITERIA)
- [ ] FixCycleWorkflow maps severity to story points (critical=13, major=8, minor=3, cosmetic=1)
- [ ] Fix cycle loops until no critical/major bugs OR max 3 iterations reached
- [ ] createBugHuntPrompt generates correct prompt structure (PRD + completed tasks + BUG_HUNT_PROMPT)
- [ ] createBugHuntPrompt returns Prompt with responseFormat: TestResultsSchema and enableReflection: true

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Exact file paths and patterns to follow from existing tests
- QA Agent configuration values from source code
- BUG_HUNT_PROMPT structure from prompts.ts
- BugHuntWorkflow and FixCycleWorkflow implementation details
- Mock setup patterns for agent factory and prompt functions
- Research documents with detailed implementation guidance

### Documentation & References

```yaml
# MUST READ - QA Agent configuration
- file: src/agents/agent-factory.ts
  why: Contains createQAAgent() with exact configuration values
  lines: 276-295 (createQAAgent function)
  lines: 118-123 (PERSONA_TOKEN_LIMITS)
  lines: 150-176 (createBaseConfig function)
  lines: 56-68 (MCP_TOOLS constant)
  pattern: Factory function that calls createAgent with config
  gotcha: QA uses maxTokens: 4096, all 3 MCP tools (BASH, FILESYSTEM, GIT)

# MUST READ - BUG_HUNT_PROMPT structure
- file: src/agents/prompts.ts
  why: Contains the full BUG_HUNT_PROMPT that QA Agent uses
  lines: 868-994 (complete BUG_HUNT_PROMPT)
  lines: 883-888 (Phase 1: PRD Scope Analysis)
  lines: 890-901 (Phase 2: Creative End-to-End Testing with 8 categories)
  lines: 903-912 (Phase 3: Adversarial Testing with 5 categories)
  lines: 913-960 (Phase 4: Documentation as Bug Report)
  pattern: Markdown prompt with numbered phases
  gotcha: Critical/Major bugs drive fix cycle; Minor/Cosmetic are acceptable

# MUST READ - BugHuntWorkflow implementation
- file: src/workflows/bug-hunt-workflow.ts
  why: Contains complete BugHuntWorkflow with four phases
  lines: 123-146 (analyzeScope - Phase 1)
  lines: 164-191 (creativeE2ETesting - Phase 2)
  lines: 207-233 (adversarialTesting - Phase 3)
  lines: 251-308 (generateReport - Phase 4, ONLY phase that makes LLM calls)
  lines: 259-270 (QA agent creation and execution)
  lines: 330-367 (run method - orchestrates all phases)
  pattern: Groundswell Workflow with @Step decorators
  gotcha: Only generateReport() makes actual LLM calls; other phases are for tracking/observability

# MUST READ - FixCycleWorkflow implementation
- file: src/workflows/fix-cycle-workflow.ts
  why: Contains complete FixCycleWorkflow with fix cycle loop
  lines: 145-162 (createFixTasks - converts bugs to subtasks)
  lines: 174-209 (executeFixes - executes via TaskOrchestrator)
  lines: 221-249 (retest - runs BugHuntWorkflow)
  lines: 261-279 (checkComplete - returns true if no critical/major bugs)
  lines: 294-361 (run method - fix cycle loop)
  lines: 417-467 (#createFixSubtask - fix task structure)
  pattern: Loop until complete OR max iterations (3)
  gotcha: maxIterations is hardcoded to 3; minor/cosmetic bugs are acceptable

# MUST READ - BugHuntWorkflow integration test (reference patterns)
- file: tests/integration/bug-hunt-workflow-integration.test.ts
  why: Shows existing test patterns for BugHuntWorkflow testing
  lines: 16-32 (mock setup for createQAAgent and createBugHuntPrompt)
  lines: 34-73 (test data factory functions)
  lines: 86-123 (full workflow execution test)
  lines: 179-207 (phase execution order test)
  pattern: Mock agent factory, test data factories, SETUP/EXECUTE/VERIFY
  gotcha: This test validates BugHuntWorkflow, NOT QA Agent configuration

# MUST READ - FixCycleWorkflow integration test (reference patterns)
- file: tests/integration/fix-cycle-workflow-integration.test.ts
  why: Shows existing test patterns for FixCycleWorkflow testing
  lines: 18-26 (mock setup for BugHuntWorkflow)
  lines: 124-183 (fix cycle success in one iteration test)
  lines: 185-240 (max iterations reached test)
  lines: 242-304 (stop when only minor/cosmetic bugs remain test)
  pattern: Mock BugHuntWorkflow, test fix cycle loop behavior
  gotcha: Tests verify iteration counting and completion logic

# MUST READ - TestResults and Bug schemas
- file: src/core/models.ts
  why: Contains TestResults and Bug interfaces for validation
  lines: 1755-1762 (BugSchema with id, severity, title, description, reproduction, location)
  lines: 1862-1867 (TestResultsSchema with hasBugs, bugs array, summary, recommendations)
  pattern: Zod schema with BugSeverityEnum ('critical' | 'major' | 'minor' | 'cosmetic')
  gotcha: hasBugs is boolean; bugs array can be empty (no bugs found)

# MUST READ - createBugHuntPrompt implementation
- file: src/agents/prompts/bug-hunt-prompt.ts
  why: Contains createBugHuntPrompt() function for QA prompt generation
  lines: 47-75 (constructUserPrompt - builds PRD + completed tasks + BUG_HUNT_PROMPT)
  lines: 123-143 (createBugHuntPrompt - returns Prompt with responseFormat)
  pattern: Groundswell createPrompt with responseFormat: TestResultsSchema
  gotcha: enableReflection: true for thorough analysis reliability

# MUST READ - Test setup and global hooks
- file: tests/setup.ts
  why: Contains z.ai API safeguard and global cleanup patterns
  lines: 56-120 (z.ai API endpoint validation)
  lines: 162-180 (beforeEach hooks)
  lines: 189-229 (afterEach hooks with rejection tracking)
  pattern: Global test file with automatic API validation
  gotcha: Tests fail if ANTHROPIC_BASE_URL is api.anthropic.com

# MUST READ - Previous PRP for parallel context
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S3/PRP.md
  why: Previous work item (Coder Agent integration) provides test patterns to follow
  section: "Implementation Blueprint" (test structure, mock setup)

# MUST READ - Research documents (in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S4/research/qa-agent-workflow-research.md
  why: Complete QA Agent, BugHuntWorkflow, FixCycleWorkflow implementation details
  section: "QA Agent Configuration" (exact config values, BUG_HUNT_PROMPT structure)

- docfile: plan/003_b3d3efdaf0ed/P1M1T3S4/research/integration-test-patterns-research.md
  why: Integration test patterns, mock setup, test data factories
  section: "Mock Setup Patterns" (vi.mock, factory functions, verification)
```

### Current Codebase Tree (test directories)

```bash
tests/
├── integration/
│   ├── agents.test.ts                      # Agent factory integration tests
│   ├── architect-agent.test.ts             # Architect Agent output tests
│   ├── bug-hunt-workflow-integration.test.ts # BugHuntWorkflow integration (exists)
│   ├── fix-cycle-workflow-integration.test.ts # FixCycleWorkflow integration (exists)
│   ├── prp-executor-integration.test.ts    # PRPExecutor integration
│   ├── prp-generator-integration.test.ts   # PRPGenerator integration
│   ├── tools.test.ts                       # MCP tools tests (BashMCP patterns)
│   ├── groundswell/
│   │   ├── agent-prompt.test.ts            # Groundswell Agent/Prompt tests
│   │   ├── workflow.test.ts                # Groundswell Workflow tests
│   │   └── mcp.test.ts                     # Groundswell MCP tests
│   └── core/
│       ├── session-manager.test.ts         # Session Manager tests
│       ├── task-orchestrator.test.ts       # Task Orchestrator tests
│       └── research-queue.test.ts          # ResearchQueue tests
├── setup.ts                                # Global test setup with API validation
└── unit/
    └── agents/
        └── prompts/
            └── bug-hunt-prompt.test.ts     # Unit tests for createBugHuntPrompt
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── integration/
│   ├── qa-agent.test.ts                    # NEW: QA Agent integration tests
│   ├── agents.test.ts                      # Existing
│   ├── bug-hunt-workflow-integration.test.ts # Existing (keep, different focus)
│   └── fix-cycle-workflow-integration.test.ts # Existing (keep, different focus)
```

**New File**: `tests/integration/qa-agent.test.ts`

- Tests QA Agent configuration from agent-factory
- Tests BUG_HUNT_PROMPT structure validation (three phases)
- Tests createBugHuntPrompt function
- Tests BugHuntWorkflow execution with mocked agent
- Tests FixCycleWorkflow integration with BugHuntWorkflow
- Tests fix cycle loop behavior
- Uses vi.mock for agent-factory and bug-hunt-prompt

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: QA Agent uses maxTokens: 4096 (same as Researcher, Coder)
const PERSONA_TOKEN_LIMITS = {
  architect: 8192, // Larger for complex task decomposition
  researcher: 4096, // Standard for PRP generation
  coder: 4096, // Standard for PRP execution
  qa: 4096, // Standard for bug hunting
} as const;

// CRITICAL: BUG_HUNT_PROMPT has three phases of testing
// Phase 1: PRD Scope Analysis (understand requirements, map to implementation)
// Phase 2: Creative End-to-End Testing (8 categories: Happy Path, Edge Cases, Workflows, Integration, Error Handling, State, Concurrency, Regression)
// Phase 3: Adversarial Testing (5 categories: Unexpected Inputs, Missing Features, Incomplete Features, Implicit Requirements, UX Issues)
// Phase 4: Documentation as Bug Report (write to TEST_RESULTS.md)

// CRITICAL: Bug severity levels drive fix cycle behavior
// critical: Blocks core functionality - MUST fix
// major: Significantly impacts UX/functionality - MUST fix
// minor: Small improvements - acceptable to have
// cosmetic: Polish items - acceptable to have
// Fix cycle loops until no critical OR major bugs remain

// CRITICAL: BugHuntWorkflow has 4 phases but only generateReport() makes LLM calls
// analyzeScope(): Logging only (no LLM call)
// creativeE2ETesting(): Logging only (no LLM call)
// adversarialTesting(): Logging only (no LLM call)
// generateReport(): Creates QA agent and executes prompt (ONLY LLM call)

// GOTCHA: MCP servers are singletons registered at module load time
// This prevents re-registration across tests
// Use vi.mock('groundswell') to avoid MCP registration issues

// CRITICAL: Tests MUST use .js extensions for imports (ES modules)
import { createQAAgent } from '../../src/agents/agent-factory.js';

// GOTCHA: Global test setup (tests/setup.ts) blocks Anthropic API
// Tests will fail if ANTHROPIC_BASE_URL is https://api.anthropic.com
// Must use https://api.z.ai/api/anthropic

// CRITICAL: Use vi.mock() at top level BEFORE imports (hoisting required)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});

// GOTCHA: When testing agent-factory, mock Groundswell NOT agent-factory
// We want to test the REAL createQAAgent() function
// So we mock createAgent() which it calls internally

// CRITICAL: FixCycleWorkflow max iterations is hardcoded to 3
// Cannot be configured via constructor
// Formula: while (this.iteration < this.maxIterations) { ... }

// CRITICAL: FixCycleWorkflow creates fix tasks with specific IDs
// Format: PFIX.M1.T{index}.S1 (zero-padded, e.g., PFIX.M1.T001.S1)
// Zero-padding: String(index + 1).padStart(3, '0')

// CRITICAL: Fix task context_scope includes specific sections
// # BUG REFERENCE (id, severity, title)
// # BUG DESCRIPTION (description)
// # REPRODUCTION STEPS (reproduction)
// # TARGET LOCATION (location or "Not specified")
// # FIX REQUIREMENTS (INPUT/OUTPUT/MOCKING)
// # VALIDATION CRITERIA (4 criteria)

// CRITICAL: Severity to story points mapping
// critical: 13 points
// major: 8 points
// minor: 3 points
// cosmetic: 1 point

// GOTCHA: FixCycleWorkflow.#createFixSubtask is a private method
// Cannot test directly, but can verify via _fixTasksForTesting getter (test-only helper)

// CRITICAL: FixCycleWorkflow extracts completed tasks from session backlog
// Only tasks with status === 'Complete' are included
// Empty backlog returns empty array (not error)

// GOTCHA: BugHuntWorkflow throws if prdContent is empty/not string
// Throws if completedTasks is not an array
// These are constructor validations

// CRITICAL: TestResults.hasBugs drives bug fix pipeline
// hasBugs: true → trigger fix cycle
// hasBugs: false → no fix cycle needed

// CRITICAL: TestResults.bugs array can have 0+ bugs
// Empty array means no bugs found
// Bugs can have any of 4 severity levels

// GOTCHA: createBugHuntPrompt returns Groundswell Prompt object
// responseFormat: TestResultsSchema (type-safe JSON output)
// enableReflection: true (for thorough analysis reliability)
// system: BUG_HUNT_PROMPT
// user: PRD + completed tasks + BUG_HUNT_PROMPT

// CRITICAL: retryAgentPrompt wraps QA agent execution
// Provides retry logic for LLM API failures
// Used in BugHuntWorkflow.generateReport()

// GOTCHA: FixCycleWorkflow continues on individual fix failures
// Logs error but continues with next fix
// Retest phase will catch remaining bugs

// CRITICAL: Fix cycle termination conditions
// 1. No critical OR major bugs remain (complete = true)
// 2. Max iterations (3) reached (complete = false)

// GOTCHA: Minor and cosmetic bugs do NOT prevent fix cycle completion
// Only critical and major bugs must be fixed
// checkComplete() returns true if only minor/cosmetic bugs remain
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from `src/core/models.ts`:

```typescript
// Import existing types for use in tests
import type { TestResults, Bug, Task } from '../../src/core/models.js';
import { TestResultsSchema, BugSchema } from '../../src/core/models.js';

// Mock fixture for TestResults
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

// Mock fixture for Bug
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

// Mock fixture for Task
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

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/qa-agent.test.ts
  - IMPLEMENT: File header with JSDoc comments describing test purpose
  - IMPLEMENT: Import statements for Vitest, types, mocks
  - IMPLEMENT: Top-level vi.mock() for Groundswell (NOT agent-factory)
  - FOLLOW pattern: tests/integration/bug-hunt-workflow-integration.test.ts (mock setup)
  - NAMING: qa-agent.test.ts (distinguished from bug-hunt-workflow-integration.test.ts)
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT mock setup with dynamic imports
  - IMPLEMENT: vi.mock('groundswell') with createAgent mock
  - IMPLEMENT: Dynamic import function for Groundswell
  - IMPLEMENT: Mock createAgent to return object with prompt() method
  - IMPLEMENT: Mock createPrompt to return Prompt object structure
  - DEPENDENCIES: Task 1 (file created)

Task 3: IMPLEMENT main describe block and hooks
  - IMPLEMENT: Main describe block 'integration/qa-agent'
  - IMPLEMENT: beforeAll to load Groundswell dynamically
  - IMPLEMENT: beforeEach to clear mocks
  - IMPLEMENT: afterEach to unstub environments
  - FOLLOW pattern: tests/integration/groundswell/agent-prompt.test.ts (test structure)
  - DEPENDENCIES: Task 2 (mock setup complete)

Task 4: IMPLEMENT QA agent configuration tests
  - CREATE: describe block 'createQAAgent configuration'
  - IMPLEMENT: test 'should create QA agent with GLM-4.7 model'
    - SETUP: Import BUG_HUNT_PROMPT from prompts.js
    - EXECUTE: Call createQAAgent()
    - VERIFY: createAgent called with model: 'GLM-4.7'
  - IMPLEMENT: test 'should create QA agent with 4096 max tokens'
    - VERIFY: createAgent called with maxTokens: 4096
  - IMPLEMENT: test 'should create QA agent with cache enabled'
    - VERIFY: createAgent called with enableCache: true
  - IMPLEMENT: test 'should create QA agent with reflection enabled'
    - VERIFY: createAgent called with enableReflection: true
  - IMPLEMENT: test 'should create QA agent with MCP tools'
    - VERIFY: createAgent called with mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP]
  - IMPLEMENT: test 'should use BUG_HUNT_PROMPT as system prompt'
    - VERIFY: createAgent called with system: BUG_HUNT_PROMPT
  - DEPENDENCIES: Task 3 (test structure complete)

Task 5: IMPLEMENT BUG_HUNT_PROMPT structure validation tests
  - CREATE: describe block 'BUG_HUNT_PROMPT structure validation'
  - IMPLEMENT: test 'should contain Phase 1: PRD Scope Analysis'
    - VERIFY: Prompt contains 'Phase 1: PRD Scope Analysis'
    - VERIFY: Prompt contains 'Read and deeply understand the original PRD requirements'
  - IMPLEMENT: test 'should contain Phase 2: Creative End-to-End Testing'
    - VERIFY: Prompt contains 'Phase 2: Creative End-to-End Testing'
    - VERIFY: Prompt contains 'Happy Path Testing', 'Edge Case Testing'
    - VERIFY: Prompt contains 'Workflow Testing', 'Integration Testing'
    - VERIFY: Prompt contains 'Error Handling', 'State Testing'
    - VERIFY: Prompt contains 'Concurrency Testing', 'Regression Testing'
  - IMPLEMENT: test 'should contain Phase 3: Adversarial Testing'
    - VERIFY: Prompt contains 'Phase 3: Adversarial Testing'
    - VERIFY: Prompt contains 'Unexpected Inputs', 'Missing Features'
    - VERIFY: Prompt contains 'Incomplete Features', 'Implicit Requirements'
    - VERIFY: Prompt contains 'User Experience Issues'
  - IMPLEMENT: test 'should contain Phase 4: Documentation as Bug Report'
    - VERIFY: Prompt contains 'Phase 4: Documentation as Bug Report'
    - VERIFY: Prompt contains 'Write a structured bug report'
  - IMPLEMENT: test 'should specify bug severity levels'
    - VERIFY: Prompt contains 'Critical Issues (Must Fix)'
    - VERIFY: Prompt contains 'Major Issues (Should Fix)'
    - VERIFY: Prompt contains 'Minor Issues (Nice to Fix)'
  - DEPENDENCIES: Task 4 (configuration tests validate agent setup)

Task 6: IMPLEMENT createBugHuntPrompt tests
  - CREATE: describe block 'createBugHuntPrompt function'
  - IMPLEMENT: test 'should generate prompt with PRD content'
    - SETUP: Import createBugHuntPrompt from bug-hunt-prompt.js
    - EXECUTE: Call createBugHuntPrompt(prd, completedTasks)
    - VERIFY: Prompt.user contains PRD content
  - IMPLEMENT: test 'should generate prompt with completed tasks list'
    - VERIFY: Prompt.user contains '## Completed Tasks'
    - VERIFY: Prompt.user contains task IDs and titles
  - IMPLEMENT: test 'should include BUG_HUNT_PROMPT in system prompt'
    - VERIFY: Prompt.system contains BUG_HUNT_PROMPT content
  - IMPLEMENT: test 'should have responseFormat set to TestResultsSchema'
    - VERIFY: Prompt.responseFormat is TestResultsSchema
  - IMPLEMENT: test 'should have enableReflection set to true'
    - VERIFY: Prompt.enableReflection is true
  - DEPENDENCIES: Task 5 (prompt structure tests complete)

Task 7: IMPLEMENT BugHuntWorkflow execution tests
  - CREATE: describe block 'BugHuntWorkflow integration'
  - IMPLEMENT: test 'should execute all four phases sequentially'
    - SETUP: Create BugHuntWorkflow with PRD and completed tasks
    - SETUP: Mock QA agent to return TestResults
    - EXECUTE: Run workflow.run()
    - VERIFY: All four phases complete in order
  - IMPLEMENT: test 'should call createQAAgent in generateReport phase'
    - VERIFY: createQAAgent called exactly once
  - IMPLEMENT: test 'should call createBugHuntPrompt with correct arguments'
    - VERIFY: createBugHuntPrompt called with PRD and completedTasks
  - IMPLEMENT: test 'should return TestResults with correct structure'
    - VERIFY: TestResults has hasBugs, bugs, summary, recommendations
  - DEPENDENCIES: Task 6 (createBugHuntPrompt tests complete)

Task 8: IMPLEMENT bug severity level tests
  - CREATE: describe block 'bug severity levels'
  - IMPLEMENT: test 'should correctly classify critical bugs'
    - SETUP: Create bug with severity: 'critical'
    - VERIFY: Bug passes BugSchema validation
  - IMPLEMENT: test 'should correctly classify major bugs'
    - SETUP: Create bug with severity: 'major'
    - VERIFY: Bug passes BugSchema validation
  - IMPLEMENT: test 'should correctly classify minor bugs'
    - SETUP: Create bug with severity: 'minor'
    - VERIFY: Bug passes BugSchema validation
  - IMPLEMENT: test 'should correctly classify cosmetic bugs'
    - SETUP: Create bug with severity: 'cosmetic'
    - VERIFY: Bug passes BugSchema validation
  - IMPLEMENT: test 'should validate TestResults with all severity levels'
    - SETUP: Create TestResults with bugs at all severity levels
    - VERIFY: TestResults passes TestResultsSchema validation
  - DEPENDENCIES: Task 7 (BugHuntWorkflow tests complete)

Task 9: IMPLEMENT FixCycleWorkflow integration tests
  - CREATE: describe block 'FixCycleWorkflow integration'
  - IMPLEMENT: test 'should create fix tasks with PFIX task IDs'
    - SETUP: Create FixCycleWorkflow with test results containing bugs
    - EXECUTE: Run createFixTasks phase
    - VERIFY: Fix task IDs match pattern PFIX.M1.T###.S1 (zero-padded)
  - IMPLEMENT: test 'should create context_scope with bug details'
    - VERIFY: context_scope contains BUG REFERENCE section
    - VERIFY: context_scope contains BUG DESCRIPTION section
    - VERIFY: context_scope contains REPRODUCTION STEPS section
    - VERIFY: context_scope contains TARGET LOCATION section
    - VERIFY: context_scope contains FIX REQUIREMENTS section
    - VERIFY: context_scope contains VALIDATION CRITERIA section
  - IMPLEMENT: test 'should map severity to story points correctly'
    - VERIFY: critical → 13 points
    - VERIFY: major → 8 points
    - VERIFY: minor → 3 points
    - VERIFY: cosmetic → 1 point
  - DEPENDENCIES: Task 8 (severity tests complete)

Task 10: IMPLEMENT fix cycle loop tests
  - CREATE: describe block 'fix cycle loop behavior'
  - IMPLEMENT: test 'should loop until no critical/major bugs remain'
    - SETUP: Create initial TestResults with critical bug
    - SETUP: Mock BugHuntWorkflow to return no bugs on second iteration
    - EXECUTE: Run FixCycleWorkflow
    - VERIFY: Loop terminates after 1 iteration (no critical/major bugs)
  - IMPLEMENT: test 'should reach max iterations when bugs persist'
    - SETUP: Create initial TestResults with critical bug
    - SETUP: Mock BugHuntWorkflow to always return critical bug
    - EXECUTE: Run FixCycleWorkflow with maxIterations=2
    - VERIFY: Loop terminates after 2 iterations (max reached)
  - IMPLEMENT: test 'should complete when only minor/cosmetic bugs remain'
    - SETUP: Create initial TestResults with critical bug
    - SETUP: Mock BugHuntWorkflow to return only minor bugs
    - EXECUTE: Run FixCycleWorkflow
    - VERIFY: Loop terminates (only minor/cosmetic bugs acceptable)
  - DEPENDENCIES: Task 9 (FixCycleWorkflow integration tests complete)

Task 11: IMPLEMENT mock agent response tests
  - CREATE: describe block 'mock agent responses'
  - IMPLEMENT: test 'should handle mock agent returning no bugs'
    - SETUP: Mock QA agent to return TestResults with hasBugs: false
    - EXECUTE: Run BugHuntWorkflow
    - VERIFY: Results indicate no bugs
  - IMPLEMENT: test 'should handle mock agent returning bugs'
    - SETUP: Mock QA agent to return TestResults with hasBugs: true
    - EXECUTE: Run BugHuntWorkflow
    - VERIFY: Results contain bugs array
  - IMPLEMENT: test 'should handle mock agent failure gracefully'
    - SETUP: Mock QA agent to throw error
    - EXECUTE: Run BugHuntWorkflow
    - VERIFY: Error is propagated correctly
  - DEPENDENCIES: Task 10 (fix cycle tests complete)

Task 12: VERIFY all tests follow project patterns
  - VERIFY: Test file uses vi.mock for Groundswell (NOT agent-factory)
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock variables use proper hoisting patterns
  - VERIFY: Test file location matches conventions (tests/integration/)
  - VERIFY: afterEach cleanup includes vi.unstubAllEnvs()
  - VERIFY: Tests validate real createQAAgent() (not mocked)
  - VERIFY: Tests validate real createBugHuntPrompt() (not mocked)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Top-level Groundswell mock (tests real agent-factory)
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  beforeAll,
} from 'vitest';

// CRITICAL: Mock Groundswell, NOT agent-factory
// This allows testing the real createQAAgent() function
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Dynamic import ensures mocks are applied
async function loadGroundswell() {
  return await import('groundswell');
}

// PATTERN: Test structure with beforeAll for dynamic imports
describe('integration/qa-agent', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // ... tests
});

// PATTERN: QA Agent configuration verification test
it('should create QA agent with GLM-4.7 model', () => {
  // SETUP: Import real agent-factory after mocks
  const { createQAAgent } = require('../../src/agents/agent-factory.js');
  const { BUG_HUNT_PROMPT } = require('../../src/agents/prompts.js');

  // EXECUTE: Create QA agent
  createQAAgent();

  // VERIFY: createAgent called with correct config
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'QAAgent',
      model: 'GLM-4.7',
      system: BUG_HUNT_PROMPT,
      maxTokens: 4096,
      enableCache: true,
      enableReflection: true,
    })
  );
});

// PATTERN: MCP tools verification
it('should create QA agent with MCP tools', () => {
  const { createQAAgent } = require('../../src/agents/agent-factory.js');
  const {
    BASH_MCP,
    FILESYSTEM_MCP,
    GIT_MCP,
  } = require('../../src/tools/index.js');

  // EXECUTE
  createQAAgent();

  // VERIFY: MCP tools passed to config
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP],
    })
  );
});

// PATTERN: BUG_HUNT_PROMPT structure validation test
it('should contain Phase 1: PRD Scope Analysis', () => {
  // SETUP: Import BUG_HUNT_PROMPT
  const { BUG_HUNT_PROMPT } = require('../../src/agents/prompts.js');

  // VERIFY: Contains key phrases from Phase 1
  expect(BUG_HUNT_PROMPT).toContain('Phase 1: PRD Scope Analysis');
  expect(BUG_HUNT_PROMPT).toContain(
    'Read and deeply understand the original PRD requirements'
  );
  expect(BUG_HUNT_PROMPT).toContain(
    'Map each requirement to what should have been implemented'
  );
});

// PATTERN: Phase 2 test categories verification
it('should contain Phase 2: Creative End-to-End Testing', () => {
  const { BUG_HUNT_PROMPT } = require('../../src/agents/prompts.js');

  expect(BUG_HUNT_PROMPT).toContain('Phase 2: Creative End-to-End Testing');
  expect(BUG_HUNT_PROMPT).toContain('Happy Path Testing');
  expect(BUG_HUNT_PROMPT).toContain('Edge Case Testing');
  expect(BUG_HUNT_PROMPT).toContain('Workflow Testing');
  expect(BUG_HUNT_PROMPT).toContain('Integration Testing');
  expect(BUG_HUNT_PROMPT).toContain('Error Handling');
  expect(BUG_HUNT_PROMPT).toContain('State Testing');
  expect(BUG_HUNT_PROMPT).toContain('Concurrency Testing');
  expect(BUG_HUNT_PROMPT).toContain('Regression Testing');
});

// PATTERN: Phase 3 adversarial testing verification
it('should contain Phase 3: Adversarial Testing', () => {
  const { BUG_HUNT_PROMPT } = require('../../src/agents/prompts.js');

  expect(BUG_HUNT_PROMPT).toContain('Phase 3: Adversarial Testing');
  expect(BUG_HUNT_PROMPT).toContain('Unexpected Inputs');
  expect(BUG_HUNT_PROMPT).toContain('Missing Features');
  expect(BUG_HUNT_PROMPT).toContain('Incomplete Features');
  expect(BUG_HUNT_PROMPT).toContain('Implicit Requirements');
  expect(BUG_HUNT_PROMPT).toContain('User Experience Issues');
});

// PATTERN: Bug severity levels verification
it('should specify bug severity levels', () => {
  const { BUG_HUNT_PROMPT } = require('../../src/agents/prompts.js');

  expect(BUG_HUNT_PROMPT).toContain('Critical Issues (Must Fix)');
  expect(BUG_HUNT_PROMPT).toContain('Major Issues (Should Fix)');
  expect(BUG_HUNT_PROMPT).toContain('Minor Issues (Nice to Fix)');
});

// PATTERN: createBugHuntPrompt function test
it('should generate prompt with PRD content', () => {
  // SETUP: Import createBugHuntPrompt
  const {
    createBugHuntPrompt,
  } = require('../../src/agents/prompts/bug-hunt-prompt.js');
  const prd = '# Test PRD\n\nBuild a feature.';
  const completedTasks = [createTestTask('P1.M1.T1', 'Task 1')];

  // EXECUTE
  const prompt = createBugHuntPrompt(prd, completedTasks);

  // VERIFY: PRD content is in user prompt
  expect(prompt.user).toContain('## Original PRD');
  expect(prompt.user).toContain(prd);
});

// PATTERN: createBugHuntPrompt responseFormat test
it('should have responseFormat set to TestResultsSchema', () => {
  const {
    createBugHuntPrompt,
  } = require('../../src/agents/prompts/bug-hunt-prompt.js');
  const { TestResultsSchema } = require('../../src/core/models.js');

  const prompt = createBugHuntPrompt('# PRD', []);

  // VERIFY: responseFormat is TestResultsSchema
  expect(prompt.responseFormat).toBe(TestResultsSchema);
  expect(prompt.enableReflection).toBe(true);
});

// PATTERN: BugHuntWorkflow sequential execution test
it('should execute all four phases sequentially', async () => {
  // SETUP
  const {
    BugHuntWorkflow,
  } = require('../../src/workflows/bug-hunt-workflow.js');
  const prdContent = '# Test PRD';
  const completedTasks = [createTestTask('P1.M1.T1', 'Task')];

  // Track phase execution order
  const phaseOrder: string[] = [];
  const originalMethods = {
    analyzeScope: BugHuntWorkflow.prototype.analyzeScope,
    creativeE2ETesting: BugHuntWorkflow.prototype.creativeE2ETesting,
    adversarialTesting: BugHuntWorkflow.prototype.adversarialTesting,
  };

  // Spy on phase methods
  vi.spyOn(BugHuntWorkflow.prototype, 'analyzeScope').mockImplementation(
    async function () {
      phaseOrder.push('analyzeScope');
      return originalMethods.analyzeScope.call(this);
    }
  );
  vi.spyOn(BugHuntWorkflow.prototype, 'creativeE2ETesting').mockImplementation(
    async function () {
      phaseOrder.push('creativeE2ETesting');
      return originalMethods.creativeE2ETesting.call(this);
    }
  );
  vi.spyOn(BugHuntWorkflow.prototype, 'adversarialTesting').mockImplementation(
    async function () {
      phaseOrder.push('adversarialTesting');
      return originalMethods.adversarialTesting.call(this);
    }
  );

  // Mock QA agent
  const mockAgent = {
    prompt: vi.fn().mockResolvedValue(createTestResults(false, [], 'OK', [])),
  };
  const { createQAAgent } = require('../../src/agents/agent-factory.js');
  vi.mocked(createQAAgent).mockReturnValue(mockAgent);

  // EXECUTE
  const workflow = new BugHuntWorkflow(prdContent, completedTasks);
  await workflow.run();

  // VERIFY: Phases executed in order
  expect(phaseOrder).toEqual([
    'analyzeScope',
    'creativeE2ETesting',
    'adversarialTesting',
  ]);
});

// PATTERN: FixCycleWorkflow fix task ID test
it('should create fix tasks with PFIX task IDs', async () => {
  // SETUP
  const {
    FixCycleWorkflow,
  } = require('../../src/workflows/fix-cycle-workflow.js');
  const bugs = [
    createTestBug('BUG-001', 'critical', 'Bug 1', 'Desc', 'Rep'),
    createTestBug('BUG-002', 'major', 'Bug 2', 'Desc', 'Rep'),
  ];
  const testResults = createTestResults(true, bugs, 'Found bugs', []);
  const mockOrchestrator = { executeSubtask: vi.fn() };
  const mockSessionManager = { currentSession: null };

  // EXECUTE
  const workflow = new FixCycleWorkflow(
    testResults,
    '# PRD',
    mockOrchestrator as any,
    mockSessionManager as any
  );
  await workflow.createFixTasks();

  // VERIFY: Fix task IDs match pattern PFIX.M1.T###.S1
  const fixTasks = (workflow as any)._fixTasksForTesting;
  expect(fixTasks[0].id).toMatch(/^PFIX\.M1\.T\d{3}\.S1$/);
  expect(fixTasks[0].id).toBe('PFIX.M1.T001.S1');
  expect(fixTasks[1].id).toBe('PFIX.M1.T002.S1');
});

// PATTERN: Fix cycle loop termination test
it('should loop until no critical/major bugs remain', async () => {
  // SETUP
  const {
    FixCycleWorkflow,
  } = require('../../src/workflows/fix-cycle-workflow.js');
  const initialBug = createTestBug(
    'BUG-001',
    'critical',
    'Critical Bug',
    'Desc',
    'Rep'
  );
  const initialResults = createTestResults(true, [initialBug], 'Found bug', []);

  // Mock BugHuntWorkflow to return no bugs on second call
  const mockBugHuntWorkflow = {
    run: vi
      .fn()
      .mockResolvedValueOnce(
        createTestResults(true, [initialBug], 'Still has bug', [])
      )
      .mockResolvedValueOnce(createTestResults(false, [], 'No bugs', [])),
  };
  vi.mock('../../src/workflows/bug-hunt-workflow.js', () => ({
    BugHuntWorkflow: vi.fn(() => mockBugHuntWorkflow),
  }));

  const mockOrchestrator = { executeSubtask: vi.fn() };
  const mockSessionManager = {
    currentSession: { taskRegistry: { backlog: [] } },
  };

  // EXECUTE
  const workflow = new FixCycleWorkflow(
    initialResults,
    '# PRD',
    mockOrchestrator as any,
    mockSessionManager as any
  );
  const finalResults = await workflow.run();

  // VERIFY: Loop terminated after bugs were fixed
  expect(workflow.iteration).toBe(1);
  expect(finalResults.hasBugs).toBe(false);
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN TESTS:
  - Tests use mocks for agent.prompt() calls
  - Tests use real agent-factory and prompt functions
  - Focus on QA Agent configuration and workflow behavior
  - Mock Groundswell agent.prompt() calls

MOCK INTEGRATIONS:
  - Mock: groundswell (createAgent, createPrompt) - control agent creation
  - Mock: agent.prompt() - control LLM responses (avoid real API calls)
  - Real: src/agents/agent-factory.js (test real factory)
  - Real: src/agents/prompts.js (test real BUG_HUNT_PROMPT)
  - Real: src/agents/prompts/bug-hunt-prompt.js (test real createBugHuntPrompt)
  - Real: src/workflows/bug-hunt-workflow.ts (test real workflow with mocked agent)
  - Real: src/workflows/fix-cycle-workflow.ts (test real workflow with mocked BugHuntWorkflow)

DEPENDENCY ON PREVIOUS WORK ITEMS:
  - P1.M1.T3.S1 provides Architect Agent integration test patterns
  - P1.M1.T3.S2 provides Researcher Agent integration test patterns
  - P1.M1.T3.S3 provides Coder Agent integration test patterns
  - Reference for mock setup and validation patterns

PARALLEL CONTEXT:
  - P1.M1.T3.S3 (Verify Coder Agent and PRP execution) - running in parallel
  - That PRP tests Coder Agent configuration
  - This PRP tests QA Agent configuration
  - No overlap or conflict in test coverage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/qa-agent.test.ts
# OR
npx eslint tests/integration/qa-agent.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- tests/integration/qa-agent.test.ts
# OR
npx vitest run tests/integration/qa-agent.test.ts

# Run with coverage
npm test -- --coverage tests/integration/qa-agent.test.ts

# Run all agent-related tests to ensure no breakage
npm test -- tests/unit/agents/agent-factory.test.ts
npm test -- tests/unit/agents/prompts/bug-hunt-prompt.test.ts
npm test -- tests/integration/bug-hunt-workflow-integration.test.ts
npm test -- tests/integration/fix-cycle-workflow-integration.test.ts

# Expected: All tests pass, good coverage for QA Agent configuration
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full integration test suite still passes
npm test -- tests/integration/
# OR
npx vitest run tests/integration/

# Check that existing tests still work
npx vitest run tests/integration/groundswell/
npx vitest run tests/integration/agents.test.ts

# Expected: All existing integration tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/qa-agent.test.ts

# Check test file follows project conventions
head -100 tests/integration/qa-agent.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/integration/qa-agent.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage for QA Agent configuration
npm test -- --coverage tests/integration/qa-agent.test.ts
# Should see coverage for createQAAgent, BUG_HUNT_PROMPT, createBugHuntPrompt

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npm test -- tests/integration/qa-agent.test.ts`
- [ ] No linting errors: `npm run lint tests/integration/qa-agent.test.ts`
- [ ] Coverage shows QA Agent configuration tested
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] QA Agent configuration verified (GLM-4.7, 4096, cache, reflection, MCP tools)
- [ ] BUG_HUNT_PROMPT contains Phase 1: PRD Scope Analysis
- [ ] BUG_HUNT_PROMPT contains Phase 2: Creative End-to-End Testing (8 categories)
- [ ] BUG_HUNT_PROMPT contains Phase 3: Adversarial Testing (5 categories)
- [ ] BUG_HUNT_PROMPT contains Phase 4: Documentation as Bug Report
- [ ] BUG_HUNT_PROMPT specifies bug severity levels (critical, major, minor, cosmetic)
- [ ] BugHuntWorkflow executes four phases sequentially
- [ ] BugHuntWorkflow calls createQAAgent and createBugHuntPrompt correctly
- [ ] TestResults structure validated (hasBugs, bugs array, summary, recommendations)
- [ ] Bug severity levels correctly classified
- [ ] FixCycleWorkflow creates PFIX task IDs (zero-padded)
- [ ] FixCycleWorkflow creates context_scope with all required sections
- [ ] FixCycleWorkflow maps severity to story points correctly
- [ ] Fix cycle loops until no critical/major bugs OR max 3 iterations
- [ ] createBugHuntPrompt returns correct structure (responseFormat, enableReflection)
- [ ] Mock agent responses work for deterministic testing

### Code Quality Validation

- [ ] Follows existing integration test patterns from bug-hunt-workflow-integration.test.ts
- [ ] Uses SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.mock for Groundswell (not agent-factory)
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes vi.unstubAllEnvs()
- [ ] Tests use dynamic import pattern for Groundswell
- [ ] State machines used for multi-call scenarios

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Complex validations (severity mapping, fix cycle loop) have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Documentation of three-phase QA testing workflow

---

## Anti-Patterns to Avoid

- ❌ Don't mock createQAAgent - test the real factory function
- ❌ Don't mock createBugHuntPrompt - test the real prompt generator
- ❌ Don't test unit-level behavior - focus on integration scenarios
- ❌ Don't use real LLM calls - always use mocks for deterministic testing
- ❌ Don't skip vi.unstubAllEnvs() in afterEach
- ❌ Don't use setTimeout without proper waiting/awaiting
- ❌ Don't forget to validate both configuration AND prompt content
- ❌ Don't test aspirational features as implemented - verify prompt contains instructions
- ❌ Don't duplicate existing tests from bug-hunt-workflow-integration.test.ts
- ❌ Don't test LLM output quality - focus on configuration and execution flow
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't hardcode configuration values - use imports from source
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific
- ❌ Don't forget to verify all three phases of BUG_HUNT_PROMPT
- ❌ Don't mock the entire agent-factory - mock Groundswell instead
- ❌ Don't skip testing the bug severity level classification
- ❌ Don't test state machines without proper call counting
- ❌ Don't use fake timers for timeout tests - use real timers
- ❌ Don't forget to test fix cycle termination conditions
- ❌ Don't test BugHuntWorkflow unit tests - focus on integration with QA agent
- ❌ Don't test FixCycleWorkflow unit tests - focus on integration with BugHuntWorkflow

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T3.S4
**Created:** 2026-01-19
**Status:** Ready for Implementation
