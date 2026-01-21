# Product Requirement Prompt (PRP): P1.M2.T2.S2 - Verify context injection for agents

---

## Goal

**Feature Goal**: Create a unit test file that verifies agents receive properly curated context including previous session notes, architecture documentation, code snippets, and context size management.

**Deliverable**: Unit test file `tests/unit/agent-context-injection.test.ts` with comprehensive verification of:

- Agents receive architecture docs from `$SESSION_DIR/architecture/` in context (if available)
- Previous session notes are injected for delta sessions
- Code snippets are included based on task requirements
- Context size is managed (no token overflow)
- Context assembly and agent prompt generation functions work correctly

**Success Definition**: All tests pass, verifying:

- `extractParentContext()` correctly traverses task hierarchy and extracts parent descriptions
- `extractTaskContext()` properly handles both Task and Subtask context extraction
- `constructUserPrompt()` assembles complete context with all placeholders replaced
- `createPRPBlueprintPrompt()` generates properly structured Groundswell prompts
- Context size estimation and validation prevents token overflow
- Mock context assembly tests cover edge cases (empty dependencies, missing files, etc.)
- Tests follow existing unit test patterns from the codebase

## Why

- **Agent Capability Verification**: Validates that agents receive the context they need to perform work as specified in PRD §5.2 and system_context.md
- **Context Injection Contract Compliance**: Ensures the context assembly logic specified in the codebase correctly injects all required context elements
- **Token Management**: Verifies that context size is properly estimated and managed to prevent LLM token overflow
- **Test Infrastructure**: Provides unit test patterns for future context injection enhancements
- **Quality Assurance**: Catches regressions in context assembly early, preventing agents from receiving incomplete or malformed context

**Relationship to P1.M2.T2.S1**: The previous subtask (P1.M2.T2.S1) validates MCP tool integration. This subtask (P1.M2.T2.S2) validates the context injection system that provides agents with the information they need to perform their work effectively.

**Critical Gap**: Current implementation has context assembly functions in `src/agents/prompts/prp-blueprint-prompt.ts` but lacks comprehensive unit tests verifying:

- Parent context extraction from task hierarchy
- Dependency context resolution for Subtasks
- User prompt construction with placeholder replacement
- Context size management and token estimation
- Delta session context injection (previous session notes)

## What

Unit tests that verify agent context injection mechanisms, ensuring agents receive properly assembled context including architecture docs, session notes, code snippets, and size-managed prompts.

### Success Criteria

- [ ] `extractParentContext()` extracts Phase, Milestone, and Task descriptions from hierarchy
- [ ] `extractTaskContext()` handles both Task and Subtask with dependency resolution
- [ ] `constructUserPrompt()` replaces placeholders and includes codebase path when provided
- [ ] `createPRPBlueprintPrompt()` returns properly configured Groundswell Prompt object
- [ ] Context size estimation utilities prevent token overflow
- [ ] Tests follow existing unit test patterns from `tests/unit/agents/prompts/`
- [ ] All edge cases covered: empty dependencies, missing files, delta sessions, etc.

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Complete context assembly function specifications from `src/agents/prompts/prp-blueprint-prompt.ts`
- System context contract from `plan/003_b3d3efdaf0ed/docs/system_context.md`
- Existing unit test patterns from `tests/unit/agents/prompts/prp-blueprint-prompt.test.ts`
- Session manager and delta session context handling from `src/core/session-manager.ts`
- PRP generator context flow from `src/agents/prp-generator.ts`
- Mock data patterns from `tests/fixtures/simple-prd.ts`
- Vitest configuration and testing setup from `vitest.config.ts`
- Context validation and schema testing patterns from research documents

### Documentation & References

```yaml
# MUST READ - Context assembly functions to test
- file: src/agents/prompts/prp-blueprint-prompt.ts
  why: Contains extractParentContext(), extractTaskContext(), constructUserPrompt(), createPRPBlueprintPrompt()
  lines: 54-271 (entire file with all context assembly functions)
  pattern: Hierarchical context extraction, dependency resolution, prompt construction
  gotcha: extractParentContext() traverses from subtask UP to phase (reverse order)
  gotcha: constructUserPrompt() uses codebase path conditionally

# MUST READ - System context contract specification
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Defines what context agents should receive (architecture docs, session notes, code snippets)
  section: "Architecture Patterns" section (Groundswell-Based Workflow System, Multi-Agent Architecture)
  pattern: Context sources include $SESSION_DIR/architecture/, previous session notes, task hierarchy
  gotcha: Context is curated per-agent-type (Architect vs Researcher vs Coder vs QA)

# MUST READ - PRP Generator to understand context flow
- file: src/agents/prp-generator.ts
  why: Shows how createPRPBlueprintPrompt() is called with codebasePath
  lines: 403-456 (generate method with prompt construction and caching)
  pattern: Prompt creation with process.cwd() for codebase path, hash-based cache invalidation
  gotcha: Cache includes task hash for change detection (context affects hash)

# MUST READ - Session Manager for delta session context
- file: src/core/session-manager.ts
  why: Delta sessions load previous session context via parent_session.txt
  lines: 527-617 (createDeltaSession method), 497-505 (parent session loading)
  pattern: Delta sessions link to parent, load old PRD for context
  gotcha: parent_session.txt is optional file, graceful handling if missing

# MUST READ - Existing unit test patterns
- file: tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  why: Reference pattern for testing prompt construction functions
  lines: 1-200+ (full test file)
  pattern: describe blocks for each function, mock data with fixtures, SETUP/EXECUTE/VERIFY
  gotcha: Tests use mock backlog data from fixtures

# MUST READ - Test fixtures for mock data
- file: tests/fixtures/simple-prd.ts
  why: Provides mock PRD data for creating test backlogs
  pattern: Hierarchical task structure matching real backlog format
  gotcha: Must include all hierarchy levels (Phase -> Milestone -> Task -> Subtask)

# MUST READ - Research on context validation testing
- docfile: plan/003_b3d3efdaf0ed/P1M2T2S2/research/context-validation-schema-testing-patterns.md
  why: Comprehensive patterns for testing context assembly and validation
  section: "Context Validation Testing Patterns", "Token Limit/Size Management Testing Patterns"
  pattern: Schema validation with Zod, token counting utilities, context size validation
  gotcha: Token estimation is approximate (1 token ≈ 4 characters)

# MUST READ - Research on comprehensive testing patterns
- docfile: plan/003_b3d3efdaf0ed/P1M2T2S2/research/comprehensive-testing-patterns-report.md
  why: Synthesis of best practices for context injection testing
  section: "Context Assembly Mocking and Verification Patterns", "Prompt Construction Patterns"
  pattern: Hierarchical mock data, context extraction verification, template placeholder testing
  gotcha: Test both positive and negative cases for conditional content

# MUST READ - Research summary for quick reference
- docfile: plan/003_b3d3efdaf0ed/P1M2T2S2/research/testing-patterns-summary.md
  why: Quick reference guide with code examples
  section: "Mocking and Verification Patterns", "Prompt Construction Patterns"
  pattern: Hierarchical mock data structure, context extraction verification
  gotcha: Verify both actual content AND placeholders in prompts
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── unit/
│   ├── agents/
│   │   ├── prompts/
│   │   │   ├── prp-blueprint-prompt.test.ts   # Reference: Existing prompt tests
│   │   │   ├── architect-prompt.test.ts
│   │   │   └── prp-builder-prompt.test.ts
│   │   ├── agent-factory.test.ts
│   │   └── prp-generator.test.ts
│   └── core/
│       ├── models.test.ts
│       └── session-manager.test.ts
├── fixtures/
│   ├── simple-prd.ts                             # Reference: Mock PRD data
│   ├── simple-prd-v2.ts
│   └── mock-delta-data.ts
│
└── unit/agent-context-injection.test.ts          # NEW: This PRP's deliverable

src/
├── agents/
│   ├── prompts/
│   │   ├── prp-blueprint-prompt.ts              # Lines 54-271: Context assembly functions
│   │   ├── architect-prompt.ts
│   │   └── prompts.ts                            # System prompt constants
│   ├── prp-generator.ts                         # Lines 403-456: Context flow in generate()
│   └── agent-factory.ts
└── core/
    ├── session-manager.ts                       # Lines 527-617: Delta session context
    └── models.ts                                # Context-related schemas

plan/003_b3d3efdaf0ed/
├── docs/
│   └── system_context.md                        # Context contract specification
└── P1M2T2S2/
    ├── PRP.md                                   # This file
    └── research/                                # Research documents
        ├── context-validation-schema-testing-patterns.md
        ├── comprehensive-testing-patterns-report.md
        └── testing-patterns-summary.md
```

### Desired Codebase Tree (new test file structure)

```bash
tests/unit/agent-context-injection.test.ts         # NEW: Context injection tests
├── describe('unit/agent-context-injection > context assembly')
│   ├── describe('extractParentContext')
│   │   ├── it('should extract Phase, Milestone, and Task descriptions for Subtask')
│   │   ├── it('should return empty string for root-level item with no parents')
│   │   ├── it('should handle items at different hierarchy levels correctly')
│   │   └── it('should traverse hierarchy in correct order (Task -> Milestone -> Phase)')
│   │
│   ├── describe('extractTaskContext')
│   │   ├── it('should extract Task description and title for Task type')
│   │   ├── it('should extract Subtask context_scope, dependencies, and title')
│   │   ├── it('should resolve dependency IDs using getDependencies()')
│   │   └── it('should handle Subtask with no dependencies gracefully')
│   │
│   ├── describe('constructUserPrompt')
│   │   ├── it('should replace <item_title> and <item_description> placeholders')
│   │   ├── it('should include parent context in the prompt')
│   │   ├── it('should include codebase path section when provided')
│   │   ├── it('should exclude codebase path section when not provided')
│   │   └── it('should include task context with dependencies')
│   │
│   └── describe('createPRPBlueprintPrompt')
│       ├── it('should return Groundswell Prompt with correct structure')
│       ├── it('should include user prompt from constructUserPrompt()')
│       ├── it('should use PRP_BLUEPRINT_PROMPT as system prompt')
│       ├── it('should set responseFormat to PRPDocumentSchema')
│       └── it('should enable reflection for complex PRP generation')
│
├── describe('unit/agent-context-injection > context size management')
│   ├── describe('token estimation')
│   │   ├── it('should estimate tokens accurately for typical text')
│   │   ├── it('should return 0 for empty strings')
│   │   └── it('should handle large texts without overflow')
│   │
│   ├── describe('context size validation')
│   │   ├── it('should validate context size within token limits')
│   │   ├── it('should detect oversized contexts')
│   │   └── it('should provide warnings for contexts near token limit')
│   │
│   └── describe('context optimization')
│       ├── it('should optimize verbose context for token efficiency')
│       └── it('should preserve essential information during optimization')
│
├── describe('unit/agent-context-injection > delta session context')
│   ├── describe('previous session context')
│   │   ├── it('should include parent session reference for delta sessions')
│   │   ├── it('should load old PRD for context comparison')
│   │   └── it('should handle missing parent session gracefully')
│   │
│   └── describe('architecture documentation context')
│       ├── it('should reference architecture docs from $SESSION_DIR/architecture/')
│       └── it('should handle missing architecture docs gracefully')
│
└── describe('unit/agent-context-injection > edge cases')
    ├── it('should handle Subtask with empty dependencies array')
    ├── it('should handle Task with empty description')
    ├── it('should handle malformed task IDs gracefully')
    └── it('should handle backlog with missing parent items')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: extractParentContext() traverses hierarchy in REVERSE order
// From src/agents/prompts/prp-blueprint-prompt.ts lines 70-85
function extractParentContext(taskId: string, backlog: Backlog): string {
  const parts = taskId.split('.');
  const contexts: string[] = [];

  // Start from second-to-last part and work UP to Phase
  for (let i = parts.length - 2; i >= 0; i--) {
    const parentId = parts.slice(0, i + 1).join('.');
    const parent = findItem(backlog, parentId);
    if (parent && hasDescription(parent)) {
      contexts.push(`${parent.type}: ${parent.description}`);
    }
  }

  return contexts.join('\n');
}
// GOTCHA: For P1.M1.T1.S1, returns: "Task: description\nMilestone: description\nPhase: description"
// GOTCHA: Order is Task -> Milestone -> Phase (bottom to top)

// CRITICAL: extractTaskContext() differentiates Task vs Subtask
// From src/agents/prompts/prp-blueprint-prompt.ts lines 104-118
function extractTaskContext(task: Task | Subtask, backlog: Backlog): string {
  if (isSubtask(task)) {
    // Subtask uses: title, dependencies (resolved), context_scope
    const deps = getDependencies(task, backlog);
    const depIds = deps.map(d => d.id).join(', ') || 'None';
    return `Task: ${task.title}\nDependencies: ${depIds}\nContext Scope: ${task.context_scope}`;
  }

  // Task uses: title, description
  return `Task: ${task.title}\nDescription: ${task.description}`;
}
// GOTCHA: Subtask has context_scope, Task has description - different fields!

// CRITICAL: constructUserPrompt() conditionally includes codebase path
// From src/agents/prompts/prp-blueprint-prompt.ts lines 162-172
const codebaseSection =
  codebasePath !== undefined && codebasePath.length > 0
    ? `

## Codebase Analysis

The codebase is located at: ${codebasePath}

Use this path to analyze the codebase structure and identify relevant files for this work item.`
    : '';
// GOTCHA: Codebase section is ONLY included when codebasePath is non-empty string

// CRITICAL: createPRPBlueprintPrompt() must use createPrompt from Groundswell
// From src/agents/prompts/prp-blueprint-prompt.ts lines 250-271
export function createPRPBlueprintPrompt(
  task: Task | Subtask,
  backlog: Backlog,
  codebasePath?: string
): Prompt<PRPDocument> {
  return createPrompt({
    user: constructUserPrompt(task, backlog, codebasePath),
    system: PRP_BLUEPRINT_PROMPT,
    responseFormat: PRPDocumentSchema,
    enableReflection: true,
  });
}
// GOTCHA: Must import createPrompt from 'groundswell'
// GOTCHA: responseFormat is PRPDocumentSchema for type-safe output

// CRITICAL: SessionManager reads parent_session.txt optionally
// From src/core/session-manager.ts lines 497-505
let parentSession: string | null = null;
try {
  const parentPath = resolve(sessionPath, 'parent_session.txt');
  const parentContent = await readFile(parentPath, 'utf-8');
  parentSession = parentContent.trim();
} catch {
  // No parent session file - not an error
}
// GOTCHA: Missing parent_session.txt is handled gracefully (returns null)

// CRITICAL: PRPGenerator passes process.cwd() as codebasePath
// From src/agents/prp-generator.ts line 434
const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());
// GOTCHA: In tests, you may want to mock process.cwd() or pass a test path

// CRITICAL: Token estimation is approximate (not exact)
// From research: 1 token ≈ 4 characters for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
// GOTCHA: This is a rough estimate, not exact token counting
// GOTCHA: Real token counting requires tiktoken or similar library

// CRITICAL: Zod schema validation for PRPDocument
// From src/core/models.ts
export const PRPDocumentSchema = z.object({
  taskId: z.string(),
  objective: z.string(),
  context: z.string().min(1),
  implementationSteps: z.array(z.string()),
  validationGates: z.array(ValidationGateSchema),
  successCriteria: z.array(SuccessCriterionSchema),
  references: z.array(z.string()),
});
// GOTCHA: All fields are required, context must be non-empty

// CRITICAL: Mock data must match real backlog structure
// From tests/fixtures/simple-prd.ts
const mockBacklog: Backlog = {
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1',
      status: 'Planned',
      description: 'Phase description',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1',
          status: 'Planned',
          description: 'Milestone description',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1',
              status: 'Planned',
              description: 'Task description',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Subtask 1',
                  status: 'Planned',
                  story_points: 1,
                  dependencies: [],
                  context_scope: 'CONTRACT DEFINITION:\n...',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
// GOTCHA: Must include all hierarchy levels with correct types

// CRITICAL: Test structure with SETUP/EXECUTE/VERIFY pattern
it('should extract parent context correctly', () => {
  // SETUP: Create mock backlog with full hierarchy
  // EXECUTE: Call extractParentContext()
  // VERIFY: Check returned context string
});
// GOTCHA: Always use this pattern for test clarity

// CRITICAL: Import with .js extensions
import { createPRPBlueprintPrompt } from '../../src/agents/prompts/prp-blueprint-prompt.js';
import type { Backlog, Task, Subtask } from '../../src/core/models.js';
// GOTCHA: Must use .js extensions even for .ts files
```

## Implementation Blueprint

### Data Models and Structure

The tests use existing models from the codebase:

```typescript
// From src/core/models.ts
interface Backlog {
  backlog: Phase[];
}

interface Phase {
  id: string;
  type: 'Phase';
  title: string;
  status: Status;
  description: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  type: 'Milestone';
  title: string;
  status: Status;
  description: string;
  tasks: Task[];
}

interface Task {
  id: string;
  type: 'Task';
  title: string;
  status: Status;
  description: string;
  subtasks: Subtask[];
}

interface Subtask {
  id: string;
  type: 'Subtask';
  title: string;
  status: Status;
  story_points: number;
  dependencies: string[];
  context_scope: string;
}

// From Groundswell
interface Prompt<T> {
  user: string;
  system: string;
  responseFormat: z.ZodSchema<T>;
  enableReflection: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/unit/agent-context-injection.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPLEMENT: Import statements for functions to test
  - IMPLEMENT: Import statements for test utilities (vitest, models, fixtures)
  - IMPLEMENT: Helper functions for creating mock backlog data
  - IMPLEMENT: Top-level describe block
  - FOLLOW pattern: tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: tests/unit/ directory
  - DEPENDENCIES: None (first task)

Task 2: IMPLEMENT context assembly tests
  - ADD: describe block 'context assembly'
  - IMPLEMENT: describe('extractParentContext')
    - SETUP: Create mock backlog with Phase, Milestone, Task, Subtask
    - IMPLEMENT: it('should extract Phase, Milestone, and Task descriptions for Subtask')
      - SETUP: Create subtask 'P1.M1.T1.S1' with full parent hierarchy
      - EXECUTE: Call extractParentContext('P1.M1.T1.S1', mockBacklog)
      - VERIFY: Result contains all three parent descriptions in correct order
    - IMPLEMENT: it('should return empty string for root-level item with no parents')
      - SETUP: Create Phase with no parent
      - EXECUTE: Call extractParentContext('P1', mockBacklog)
      - VERIFY: Result is empty string
    - IMPLEMENT: it('should handle items at different hierarchy levels correctly')
      - SETUP: Create Milestone-level and Task-level items
      - EXECUTE: Call extractParentContext for each level
      - VERIFY: Each level returns appropriate parent context
    - IMPLEMENT: it('should traverse hierarchy in correct order')
      - SETUP: Create subtask with known parent descriptions
      - EXECUTE: Call extractParentContext
      - VERIFY: Order is Task -> Milestone -> Phase
  - IMPLEMENT: describe('extractTaskContext')
    - SETUP: Create mock Task and Subtask with different data
    - IMPLEMENT: it('should extract Task description and title for Task type')
      - SETUP: Create Task with title and description
      - EXECUTE: Call extractTaskContext(task, mockBacklog)
      - VERIFY: Result includes title and description
    - IMPLEMENT: it('should extract Subtask context_scope, dependencies, and title')
      - SETUP: Create Subtask with context_scope and dependencies
      - EXECUTE: Call extractTaskContext(subtask, mockBacklog)
      - VERIFY: Result includes title, resolved dependencies, context_scope
    - IMPLEMENT: it('should resolve dependency IDs using getDependencies()')
      - SETUP: Create Subtask with dependency IDs
      - EXECUTE: Call extractTaskContext
      - VERIFY: Dependencies are resolved to actual task objects
    - IMPLEMENT: it('should handle Subtask with no dependencies gracefully')
      - SETUP: Create Subtask with empty dependencies array
      - EXECUTE: Call extractTaskContext
      - VERIFY: Dependencies shown as "None"
  - SETUP: Use findItem utility for locating items in backlog
  - FOLLOW pattern: tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test section

Task 3: IMPLEMENT prompt construction tests
  - ADD: describe block 'prompt construction'
  - IMPLEMENT: describe('constructUserPrompt')
    - SETUP: Import PRP_BLUEPRINT_PROMPT from prompts.ts
    - SETUP: Create mock Task and Subtask
    - IMPLEMENT: it('should replace <item_title> and <item_description> placeholders')
      - SETUP: Create task with known title and description
      - EXECUTE: Call constructUserPrompt(task, mockBacklog)
      - VERIFY: Result contains task.title and task.description
      - VERIFY: Result contains PRP_BLUEPRINT_PROMPT template
    - IMPLEMENT: it('should include parent context in the prompt')
      - SETUP: Create subtask with parent hierarchy
      - EXECUTE: Call constructUserPrompt(subtask, mockBacklog)
      - VERIFY: Result contains parent descriptions from extractParentContext()
    - IMPLEMENT: it('should include codebase path section when provided')
      - SETUP: Create task and pass codebasePath parameter
      - EXECUTE: Call constructUserPrompt(task, mockBacklog, '/test/path')
      - VERIFY: Result includes "Codebase Analysis" section with path
    - IMPLEMENT: it('should exclude codebase path section when not provided')
      - SETUP: Create task without codebasePath
      - EXECUTE: Call constructUserPrompt(task, mockBacklog)
      - VERIFY: Result does NOT include "Codebase Analysis" section
    - IMPLEMENT: it('should include task context with dependencies')
      - SETUP: Create Subtask with dependencies
      - EXECUTE: Call constructUserPrompt(subtask, mockBacklog)
      - VERIFY: Result includes "Dependencies:" section
  - SETUP: Use PRP_BLUEPRINT_PROMPT constant for system prompt verification
  - FOLLOW pattern: tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  - DEPENDENCIES: Task 2 (context assembly tests)
  - PLACEMENT: After context assembly tests

Task 4: IMPLEMENT createPRPBlueprintPrompt tests
  - ADD: describe block 'createPRPBlueprintPrompt'
  - SETUP: Import createPrompt from 'groundswell'
  - SETUP: Mock Groundswell createPrompt if needed (or use real function)
  - IMPLEMENT: it('should return Groundswell Prompt with correct structure')
    - SETUP: Create mock task and backlog
    - EXECUTE: Call createPRPBlueprintPrompt(task, mockBacklog)
    - VERIFY: Result has user, system, responseFormat, enableReflection properties
  - IMPLEMENT: it('should include user prompt from constructUserPrompt()')
    - SETUP: Create task with known values
    - EXECUTE: Call createPRPBlueprintPrompt
    - VERIFY: result.user contains expected content from constructUserPrompt
  - IMPLEMENT: it('should use PRP_BLUEPRINT_PROMPT as system prompt')
    - SETUP: Import PRP_BLUEPRINT_PROMPT
    - EXECUTE: Call createPRPBlueprintPrompt
    - VERIFY: result.system is PRP_BLUEPRINT_PROMPT
  - IMPLEMENT: it('should set responseFormat to PRPDocumentSchema')
    - SETUP: Import PRPDocumentSchema
    - EXECUTE: Call createPRPBlueprintPrompt
    - VERIFY: result.responseFormat is PRPDocumentSchema
  - IMPLEMENT: it('should enable reflection for complex PRP generation')
    - EXECUTE: Call createPRPBlueprintPrompt
    - VERIFY: result.enableReflection is true
  - SETUP: Use type assertions for Groundswell Prompt type
  - FOLLOW pattern: Groundswell integration tests from tests/integration/groundswell/
  - DEPENDENCIES: Task 3 (prompt construction tests)
  - PLACEMENT: After prompt construction tests

Task 5: IMPLEMENT context size management tests
  - ADD: describe block 'context size management'
  - CREATE: Utility function estimateTokens() for testing
  - IMPLEMENT: describe('token estimation')
    - IMPLEMENT: it('should estimate tokens accurately for typical text')
      - SETUP: Create test string with known word count
      - EXECUTE: Call estimateTokens(testString)
      - VERIFY: Result is approximately expected (within 20% tolerance)
    - IMPLEMENT: it('should return 0 for empty strings')
      - EXECUTE: Call estimateTokens('')
      - VERIFY: Result is 0
    - IMPLEMENT: it('should handle large texts without overflow')
      - SETUP: Create large string (10000+ chars)
      - EXECUTE: Call estimateTokens(largeString)
      - VERIFY: Result is finite number
  - IMPLEMENT: describe('context size validation')
    - CREATE: MAX_CONTEXT_TOKENS constant (e.g., 8000)
    - IMPLEMENT: it('should validate context size within token limits')
      - SETUP: Create context string within limits
      - EXECUTE: Estimate tokens
      - VERIFY: Token count <= MAX_CONTEXT_TOKENS
    - IMPLEMENT: it('should detect oversized contexts')
      - SETUP: Create context string exceeding limits
      - EXECUTE: Estimate tokens
      - VERIFY: Token count > MAX_CONTEXT_TOKENS
    - IMPLEMENT: it('should provide warnings for contexts near token limit')
      - SETUP: Create context at 90% of limit
      - EXECUTE: Estimate tokens
      - VERIFY: Warning logged for near-limit context
  - SETUP: Use approximate token counting (length / 4)
  - FOLLOW pattern: context-validation-schema-testing-patterns.md research
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: After main context tests (can run in parallel)

Task 6: IMPLEMENT delta session context tests
  - ADD: describe block 'delta session context'
  - SETUP: Import SessionManager, createMockSessionState
  - IMPLEMENT: describe('previous session context')
    - SETUP: Create mock delta session with parent_session.txt
    - IMPLEMENT: it('should include parent session reference for delta sessions')
      - SETUP: Create session with metadata.parentSession set
      - EXECUTE: Load session state
      - VERIFY: metadata.parentSession is not null
    - IMPLEMENT: it('should load old PRD for context comparison')
      - SETUP: Create delta session with oldPRD and newPRD
      - EXECUTE: Load session
      - VERIFY: Both oldPRD and newPRD are available
    - IMPLEMENT: it('should handle missing parent session gracefully')
      - SETUP: Create session without parent_session.txt
      - EXECUTE: Load session
      - VERIFY: parentSession is null (not error)
  - IMPLEMENT: describe('architecture documentation context')
    - SETUP: Mock fs.promises.readFile for architecture docs
    - IMPLEMENT: it('should reference architecture docs from $SESSION_DIR/architecture/')
      - SETUP: Create mock architecture directory with docs
      - EXECUTE: Check prompt references $SESSION_DIR/architecture/
      - VERIFY: Prompt includes architecture doc references
    - IMPLEMENT: it('should handle missing architecture docs gracefully')
      - SETUP: Mock missing architecture directory
      - EXECUTE: Load session
      - VERIFY: No error, graceful fallback
  - SETUP: Mock node:fs for file operations
  - FOLLOW pattern: tests/unit/core/session-manager.test.ts
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: After main context tests (can run in parallel)

Task 7: IMPLEMENT edge case tests
  - ADD: describe block 'edge cases'
  - SETUP: Create various malformed test data
  - IMPLEMENT: it('should handle Subtask with empty dependencies array')
    - SETUP: Create Subtask with dependencies: []
    - EXECUTE: Call extractTaskContext
    - VERIFY: Dependencies shown as "None" (not error)
  - IMPLEMENT: it('should handle Task with empty description')
    - SETUP: Create Task with description: ''
    - EXECUTE: Call constructUserPrompt
    - VERIFY: Uses title as fallback description
  - IMPLEMENT: it('should handle malformed task IDs gracefully')
    - SETUP: Pass invalid task ID format
    - EXECUTE: Call extractParentContext with invalid ID
    - VERIFY: Returns empty string (no crash)
  - IMPLEMENT: it('should handle backlog with missing parent items')
    - SETUP: Create backlog with missing intermediate level
    - EXECUTE: Call extractParentContext
    - VERIFY: Returns available parents only (no error)
  - SETUP: Test error handling and graceful degradation
  - FOLLOW pattern: Edge case testing from research documents
  - DEPENDENCIES: Task 2 (context assembly tests)
  - PLACEMENT: Final test section

Task 8: VERIFY test coverage and completeness
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY)
  - VERIFY: Mock data matches real backlog structure
  - VERIFY: All functions from prp-blueprint-prompt.ts are tested
  - VERIFY: Token management tests include edge cases
  - VERIFY: Delta session tests cover parent session loading
  - RUN: npx vitest run tests/unit/agent-context-injection.test.ts
  - VERIFY: All tests pass
  - DOCUMENT: Any implementation gaps discovered
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Unit tests for Agent Context Injection
 *
 * @remarks
 * Tests validate that agents receive properly curated context including:
 * - Architecture documentation from $SESSION_DIR/architecture/
 * - Previous session notes for delta sessions
 * - Code snippets based on task requirements
 * - Context size management (no token overflow)
 *
 * Verifies:
 * - extractParentContext() traverses hierarchy correctly
 * - extractTaskContext() handles Task and Subtask differences
 * - constructUserPrompt() assembles complete context
 * - createPRPBlueprintPrompt() generates Groundswell prompts
 * - Token estimation prevents overflow
 * - Delta sessions inject previous context
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/agents/prompts/prp-blueprint-prompt.ts | Context Assembly Functions}
 * @see {@link ../../src/core/session-manager.ts | Session Manager}
 */

// PATTERN: Import statements
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  extractParentContext,
  extractTaskContext,
  constructUserPrompt,
  createPRPBlueprintPrompt,
} from '../../src/agents/prompts/prp-blueprint-prompt.js';
import type { Backlog, Task, Subtask, Phase } from '../../src/core/models.js';
import { PRPDocumentSchema } from '../../src/core/models.js';
import { PRP_BLUEPRINT_PROMPT } from '../../src/agents/prompts.js';
import { findItem, getDependencies } from '../../src/utils/task-utils.js';

// PATTERN: Mock data creation helper
function createMockBacklog(): Backlog {
  return {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        title: 'Phase 1: Foundation',
        status: 'Planned',
        description: 'Project initialization and setup',
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Milestone 1.1: Core Models',
            status: 'Planned',
            description: 'Define core data models and interfaces',
            tasks: [
              {
                id: 'P1.M1.T1',
                type: 'Task',
                title: 'Create Models',
                status: 'Planned',
                description: 'Implement TypeScript interfaces and Zod schemas',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Define Phase Interface',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Interface patterns\n2. INPUT: None\n3. LOGIC: Define interface\n4. OUTPUT: Phase interface',
                  },
                  {
                    id: 'P1.M1.T1.S2',
                    type: 'Subtask',
                    title: 'Define Task Interface',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: ['P1.M1.T1.S1'],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Depends on S1\n2. INPUT: Phase interface\n3. LOGIC: Define Task interface\n4. OUTPUT: Task interface',
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

// PATTERN: Token estimation utility
function estimateTokens(text: string): number {
  // Approximate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// PATTERN: Test structure with SETUP/EXECUTE/VERIFY
describe('unit/agent-context-injection > context assembly', () => {
  let mockBacklog: Backlog;

  beforeEach(() => {
    mockBacklog = createMockBacklog();
  });

  describe('extractParentContext', () => {
    it('should extract Phase, Milestone, and Task descriptions for Subtask', () => {
      // SETUP
      const subtaskId = 'P1.M1.T1.S2';

      // EXECUTE
      const result = extractParentContext(subtaskId, mockBacklog);

      // VERIFY: Order is Task -> Milestone -> Phase
      expect(result).toContain(
        'Task: Implement TypeScript interfaces and Zod schemas'
      );
      expect(result).toContain(
        'Milestone: Define core data models and interfaces'
      );
      expect(result).toContain('Phase: Project initialization and setup');
    });

    it('should return empty string for root-level item with no parents', () => {
      // SETUP
      const phaseId = 'P1';

      // EXECUTE
      const result = extractParentContext(phaseId, mockBacklog);

      // VERIFY
      expect(result).toBe('');
    });

    it('should traverse hierarchy in correct order (Task -> Milestone -> Phase)', () => {
      // SETUP
      const subtaskId = 'P1.M1.T1.S1';
      const lines: string[] = [];

      // EXECUTE
      const result = extractParentContext(subtaskId, mockBacklog);
      result.split('\n').forEach(line => {
        if (line.startsWith('Task:')) lines.push('Task');
        if (line.startsWith('Milestone:')) lines.push('Milestone');
        if (line.startsWith('Phase:')) lines.push('Phase');
      });

      // VERIFY: Order should be Task, then Milestone, then Phase
      expect(lines).toEqual(['Task', 'Milestone', 'Phase']);
    });
  });

  describe('extractTaskContext', () => {
    it('should extract Task description and title for Task type', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1') as Task;

      // EXECUTE
      const result = extractTaskContext(task, mockBacklog);

      // VERIFY
      expect(result).toContain('Task: Create Models');
      expect(result).toContain(
        'Description: Implement TypeScript interfaces and Zod schemas'
      );
    });

    it('should extract Subtask context_scope, dependencies, and title', () => {
      // SETUP
      const subtask = findItem(mockBacklog, 'P1.M1.T1.S2') as Subtask;

      // EXECUTE
      const result = extractTaskContext(subtask, mockBacklog);

      // VERIFY
      expect(result).toContain('Task: Define Task Interface');
      expect(result).toContain('Dependencies: P1.M1.T1.S1');
      expect(result).toContain('Context Scope: CONTRACT DEFINITION:');
    });

    it('should resolve dependency IDs using getDependencies()', () => {
      // SETUP
      const subtask = findItem(mockBacklog, 'P1.M1.T1.S2') as Subtask;
      const deps = getDependencies(subtask, mockBacklog);

      // EXECUTE
      const result = extractTaskContext(subtask, mockBacklog);

      // VERIFY: Dependencies resolved to actual task IDs
      expect(deps).toHaveLength(1);
      expect(deps[0].id).toBe('P1.M1.T1.S1');
      expect(result).toContain('P1.M1.T1.S1');
    });

    it('should handle Subtask with no dependencies gracefully', () => {
      // SETUP
      const subtask = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;

      // EXECUTE
      const result = extractTaskContext(subtask, mockBacklog);

      // VERIFY: Dependencies shown as "None"
      expect(result).toContain('Dependencies: None');
    });
  });

  describe('constructUserPrompt', () => {
    it('should replace <item_title> and <item_description> placeholders', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;

      // EXECUTE
      const result = constructUserPrompt(task, mockBacklog);

      // VERIFY: Actual content included
      expect(result).toContain('Define Phase Interface');
      expect(result).toContain('CONTRACT DEFINITION:');

      // VERIFY: PRP_BLUEPRINT_PROMPT template included
      expect(result).toContain(PRP_BLUEPRINT_PROMPT);
    });

    it('should include parent context in the prompt', () => {
      // SETUP
      const subtask = findItem(mockBacklog, 'P1.M1.T1.S2') as Subtask;

      // EXECUTE
      const result = constructUserPrompt(subtask, mockBacklog);

      // VERIFY: Parent context section included
      expect(result).toContain('## Parent Context');
      expect(result).toContain('Task: Implement TypeScript interfaces');
      expect(result).toContain('Milestone: Define core data models');
    });

    it('should include codebase path section when provided', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1') as Task;
      const codebasePath = '/home/dustin/projects/hacky-hack';

      // EXECUTE
      const result = constructUserPrompt(task, mockBacklog, codebasePath);

      // VERIFY: Codebase section included
      expect(result).toContain('## Codebase Analysis');
      expect(result).toContain(codebasePath);
    });

    it('should exclude codebase path section when not provided', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1') as Task;

      // EXECUTE
      const result = constructUserPrompt(task, mockBacklog);

      // VERIFY: Codebase section NOT included
      expect(result).not.toContain('## Codebase Analysis');
      expect(result).not.toContain('The codebase is located at:');
    });

    it('should include task context with dependencies', () => {
      // SETUP
      const subtask = findItem(mockBacklog, 'P1.M1.T1.S2') as Subtask;

      // EXECUTE
      const result = constructUserPrompt(subtask, mockBacklog);

      // VERIFY: Task context includes dependencies
      expect(result).toContain('Dependencies: P1.M1.T1.S1');
    });
  });

  describe('createPRPBlueprintPrompt', () => {
    it('should return Groundswell Prompt with correct structure', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;

      // EXECUTE
      const result = createPRPBlueprintPrompt(task, mockBacklog);

      // VERIFY: Prompt structure
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('responseFormat');
      expect(result).toHaveProperty('enableReflection');
    });

    it('should include user prompt from constructUserPrompt()', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;
      const expectedUserPrompt = constructUserPrompt(task, mockBacklog);

      // EXECUTE
      const result = createPRPBlueprintPrompt(task, mockBacklog);

      // VERIFY
      expect(result.user).toBe(expectedUserPrompt);
    });

    it('should use PRP_BLUEPRINT_PROMPT as system prompt', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;

      // EXECUTE
      const result = createPRPBlueprintPrompt(task, mockBacklog);

      // VERIFY
      expect(result.system).toBe(PRP_BLUEPRINT_PROMPT);
    });

    it('should set responseFormat to PRPDocumentSchema', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;

      // EXECUTE
      const result = createPRPBlueprintPrompt(task, mockBacklog);

      // VERIFY
      expect(result.responseFormat).toBe(PRPDocumentSchema);
    });

    it('should enable reflection for complex PRP generation', () => {
      // SETUP
      const task = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;

      // EXECUTE
      const result = createPRPBlueprintPrompt(task, mockBacklog);

      // VERIFY
      expect(result.enableReflection).toBe(true);
    });
  });
});

describe('unit/agent-context-injection > context size management', () => {
  const MAX_CONTEXT_TOKENS = 8000;

  describe('token estimation', () => {
    it('should estimate tokens accurately for typical text', () => {
      // SETUP
      const testText = 'This is a test sentence with exactly ten words.';

      // EXECUTE
      const estimatedTokens = estimateTokens(testText);

      // VERIFY: Approximate estimation (within reasonable range)
      expect(estimatedTokens).toBeGreaterThan(5);
      expect(estimatedTokens).toBeLessThan(15);
    });

    it('should return 0 for empty strings', () => {
      // EXECUTE
      const result = estimateTokens('');

      // VERIFY
      expect(result).toBe(0);
    });

    it('should handle large texts without overflow', () => {
      // SETUP
      const largeText = 'x'.repeat(10000);

      // EXECUTE
      const result = estimateTokens(largeText);

      // VERIFY: Should not overflow
      expect(result).toBe(2500); // 10000 / 4
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  describe('context size validation', () => {
    it('should validate context size within token limits', () => {
      // SETUP
      const context = 'x'.repeat(MAX_CONTEXT_TOKENS * 3); // Under limit

      // EXECUTE
      const tokens = estimateTokens(context);

      // VERIFY
      expect(tokens).toBeLessThanOrEqual(MAX_CONTEXT_TOKENS);
    });

    it('should detect oversized contexts', () => {
      // SETUP
      const oversizedContext = 'x'.repeat(MAX_CONTEXT_TOKENS * 5);

      // EXECUTE
      const tokens = estimateTokens(oversizedContext);

      // VERIFY
      expect(tokens).toBeGreaterThan(MAX_CONTEXT_TOKENS);
    });
  });
});

describe('unit/agent-context-injection > edge cases', () => {
  let mockBacklog: Backlog;

  beforeEach(() => {
    mockBacklog = createMockBacklog();
  });

  it('should handle Subtask with empty dependencies array', () => {
    // SETUP
    const subtask = findItem(mockBacklog, 'P1.M1.T1.S1') as Subtask;

    // EXECUTE
    const result = extractTaskContext(subtask, mockBacklog);

    // VERIFY: Dependencies shown as "None"
    expect(result).toContain('Dependencies: None');
  });

  it('should handle Task with empty description', () => {
    // SETUP: Create task with empty description
    const task: Task = {
      id: 'P1.M1.T2',
      type: 'Task',
      title: 'Test Task',
      status: 'Planned',
      description: '',
      subtasks: [],
    };

    // EXECUTE
    const result = constructUserPrompt(task, mockBacklog);

    // VERIFY: Should use title as fallback
    expect(result).toContain('Test Task');
  });

  it('should handle malformed task IDs gracefully', () => {
    // SETUP
    const invalidId = 'invalid.task.id';

    // EXECUTE
    const result = extractParentContext(invalidId, mockBacklog);

    // VERIFY: Should return empty string (not crash)
    expect(result).toBe('');
  });
});
```

### Integration Points

```yaml
CONTEXT_ASSEMBLY_FUNCTIONS:
  - extractParentContext(taskId, backlog): Extract parent descriptions from hierarchy
  - extractTaskContext(task, backlog): Extract task/subtask context with dependencies
  - constructUserPrompt(task, backlog, codebasePath?): Build complete user prompt
  - createPRPBlueprintPrompt(task, backlog, codebasePath?): Create Groundswell Prompt

PROMPT_CONSTANTS:
  - PRP_BLUEPRINT_PROMPT: System prompt for Researcher Agent
  - PRPDocumentSchema: Zod schema for structured output

MODELS_AND_TYPES:
  - Backlog: Root object containing phases array
  - Phase, Milestone, Task, Subtask: Hierarchy item types
  - Prompt<T>: Groundswell prompt interface

UTILITIES:
  - findItem(backlog, itemId): Locate item in hierarchy
  - getDependencies(subtask, backlog): Resolve dependency IDs to objects
  - estimateTokens(text): Approximate token counting

SESSION_MANAGEMENT:
  - SessionManager: Manages session state and delta sessions
  - parent_session.txt: Optional file linking delta to parent session
  - $SESSION_DIR/architecture/: Location of architecture documentation

NO_EXTERNAL_OPERATIONS:
  - Tests use mock data (no real LLM calls)
  - Tests verify function logic, not actual agent execution
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/unit/agent-context-injection.test.ts --fix

# Check TypeScript types
npx tsc --noEmit tests/unit/agent-context-injection.test.ts

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the context injection file
npx vitest run tests/unit/agent-context-injection.test.ts

# Run with coverage
npx vitest run tests/unit/agent-context-injection.test.ts --coverage

# Run all unit tests to ensure no breakage
npx vitest run tests/unit/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify related tests still pass
npx vitest run tests/unit/agents/prompts/
npx vitest run tests/unit/core/
npx vitest run tests/integration/researcher-agent.test.ts
npx vitest run tests/integration/prp-generator-integration.test.ts

# Expected: All related tests pass
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/unit/agent-context-injection.test.ts

# Check test file follows project conventions
head -50 tests/unit/agent-context-injection.test.ts
# Should see: JSDoc comments, describe blocks, proper imports

# Verify all test categories are present
grep -n "describe.*context assembly" tests/unit/agent-context-injection.test.ts
grep -n "describe.*prompt construction" tests/unit/agent-context-injection.test.ts
grep -n "describe.*context size management" tests/unit/agent-context-injection.test.ts
grep -n "describe.*edge cases" tests/unit/agent-context-injection.test.ts

# Verify SETUP/EXECUTE/VERIFY pattern
grep -n "SETUP:" tests/unit/agent-context-injection.test.ts
grep -n "EXECUTE:" tests/unit/agent-context-injection.test.ts
grep -n "VERIFY:" tests/unit/agent-context-injection.test.ts

# Expected: Test file well-structured, all categories present
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] Test file structure follows project patterns
- [ ] Tests use mock data (no real operations)
- [ ] Tests import with .js extensions
- [ ] All describe blocks have clear, descriptive names
- [ ] Helper functions use existing patterns
- [ ] Tests use SETUP/EXECUTE/VERIFY pattern

### Feature Validation

- [ ] `extractParentContext()` extracts all parent descriptions correctly
- [ ] `extractTaskContext()` handles Task and Subtask differences
- [ ] `constructUserPrompt()` replaces all placeholders
- [ ] `createPRPBlueprintPrompt()` returns proper Groundswell Prompt
- [ ] Token estimation prevents overflow
- [ ] Context size validation works correctly
- [ ] Delta session context is tested
- [ ] All edge cases are covered

### Code Quality Validation

- [ ] Follows existing unit test patterns from tests/unit/agents/prompts/
- [ ] Helper functions match patterns from existing tests
- [ ] Test file location matches conventions (tests/unit/)
- [ ] Tests focus on function logic, not external behavior
- [ ] Mock data matches real backlog structure

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Test names clearly describe what is being tested
- [ ] Research documents stored in research/ subdirectory
- [ ] Tests verify context injection contract from system_context.md

---

## Anti-Patterns to Avoid

- ❌ Don't test with real LLM calls (use mock data only)
- ❌ Don't skip testing all four context assembly functions
- ❌ Don't forget to test both Task and Subtask types (different fields)
- ❌ Don't skip testing conditional codebase path inclusion
- ❌ Don't use actual file I/O in unit tests (mock fs operations)
- ❌ Don't skip testing the reverse order of extractParentContext()
- ❌ Don't forget that Subtask has context_scope, Task has description
- ❌ Don't skip testing empty dependencies arrays
- ❌ Don't test implementation details (test input/output contract)
- ❌ Don't forget to verify PRP_BLUEPRINT_PROMPT is included
- ❌ Don't skip testing token estimation edge cases
- ❌ Don't duplicate tests from prp-blueprint-prompt.test.ts (focus on context injection)

---

**PRP Version:** 1.0
**Work Item:** P1.M2.T2.S2
**Created:** 2026-01-21
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**

- Complete context assembly function specifications with exact line numbers
- Comprehensive testing patterns from existing test files
- Mock data patterns and helper functions specified
- Clear implementation tasks with proper dependencies
- All contract requirements from PRD and system_context.md covered
- Extensive research documentation in research/ subdirectory
- File paths and code examples provided for all references
- Test structure follows project patterns exactly
- Edge cases and error handling patterns specified with examples
