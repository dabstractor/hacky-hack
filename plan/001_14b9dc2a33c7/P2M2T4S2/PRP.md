---

## Goal

**Feature Goal**: Create a type-safe prompt generator function `createBugHuntPrompt()` that produces Groundswell `Prompt<TestResults>` objects for adversarial QA testing of implementations against PRD requirements.

**Deliverable**: A new file `src/agents/prompts/bug-hunt-prompt.ts` that exports `createBugHuntPrompt(prd: string, completedTasks: Task[]): Prompt<TestResults>`.

**Success Definition**:
- The function generates a properly structured Groundswell Prompt with BUG_HUNT_PROMPT as the system prompt
- User prompt includes PRD content and completed tasks context
- Response format validates LLM output against TestResultsSchema
- enableReflection is enabled for thorough bug analysis
- Function follows the established pattern from architect-prompt.ts, prp-blueprint-prompt.ts, and delta-analysis-prompt.ts
- Comprehensive unit tests validate prompt structure and content generation
- Function is exported from src/agents/prompts/index.ts

## User Persona

**Target User**: AI Agent Developers working on the PRP Pipeline who need to invoke QA agents for adversarial testing.

**Use Case**: During the PRP execution workflow, after implementation completion, a QA agent needs to be invoked with structured context (PRD + completed tasks) to perform comprehensive bug hunting.

**User Journey**:
1. Developer creates PRD and backlog
2. PRP executor runs implementation tasks
3. QA agent is invoked with `createBugHuntPrompt(prdContent, completedTasks)`
4. Agent performs adversarial testing and returns structured TestResults
5. If hasBugs=true, bug fix sub-pipeline is triggered

**Pain Points Addressed**:
- Eliminates manual prompt construction for QA workflows
- Ensures type-safe bug report generation via Zod schema validation
- Standardizes adversarial testing approach across all PRD implementations

## Why

- **Integration with QA Pipeline**: The bug hunt prompt generator is a critical component of the QA and Bug Hunt System (P4.M3), enabling automated adversarial testing after implementation
- **Type Safety**: Using TestResultsSchema ensures bug reports have consistent structure with all required fields (id, severity, title, description, reproduction, location)
- **Agent Reusability**: Standardized prompt generation allows QA agents to be invoked consistently across different PRDs and implementations
- **Workflow Automation**: The hasBugs boolean in TestResults drives the bug fix sub-pipeline - if true, TEST_RESULTS.md becomes a mini-PRD for fixes; if false, absence signals success
- **Completes Milestone P2.M2.T4**: This is the second and final subtask of "Create QA Bug Hunt Prompts", working alongside P2.M2.T4.S1 (Bug report Zod schema - already complete)

## What

Create a function that generates Groundswell Prompts configured for adversarial QA bug hunting:

```typescript
export function createBugHuntPrompt(
  prd: string,
  completedTasks: Task[]
): Prompt<TestResults>
```

The function constructs a user prompt with:
1. PRD content as the requirements baseline
2. Completed tasks list showing what was implemented
3. BUG_HUNT_PROMPT appended as system instructions

The returned Prompt includes:
- user: Constructed prompt with PRD + tasks + BUG_HUNT_PROMPT
- system: BUG_HUNT_PROMPT (QA Engineer persona)
- responseFormat: TestResultsSchema (structured bug report)
- enableReflection: true (for comprehensive analysis)

### Success Criteria

- [ ] Function exported from `src/agents/prompts/bug-hunt-prompt.ts`
- [ ] Function signature matches contract: `createBugHuntPrompt(prd: string, completedTasks: Task[]): Prompt<TestResults>`
- [ ] User prompt includes PRD content section
- [ ] User prompt includes completed tasks section
- [ ] User prompt appends BUG_HUNT_PROMPT content
- [ ] responseFormat set to TestResultsSchema
- [ ] enableReflection set to true
- [ ] Follows established patterns from existing prompt generators
- [ ] Exported from src/agents/prompts/index.ts
- [ ] Comprehensive unit tests in tests/unit/agents/prompts/bug-hunt-prompt.test.ts
- [ ] All tests pass with 100% coverage

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**YES** - The following context provides:
- Exact file patterns from three existing prompt generators to follow
- Complete BUG_HUNT_PROMPT content from src/agents/prompts.ts
- TestResultsSchema structure from src/core/models.ts
- Groundswell createPrompt usage patterns
- Vitest testing patterns from existing prompt generator tests
- Module export patterns from index.ts

### Documentation & References

```yaml
# MUST READ - Core implementation references
- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts/architect-prompt.ts
  why: Simplest prompt generator pattern - shows createPrompt usage with single parameter
  critical: Import pattern from groundswell, createPrompt call structure, enableReflection:true pattern
  pattern: Single string parameter, minimal context construction, direct createPrompt return

- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts/prp-blueprint-prompt.ts
  why: Most complex prompt generator - shows helper functions for context extraction
  critical: Helper function pattern for constructing user prompts, parent context extraction
  pattern: Internal helper functions for prompt construction, complex parameter handling

- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts/delta-analysis-prompt.ts
  why: Similar multi-parameter pattern - shows optional parameter handling
  critical: Conditional section inclusion in constructUserPrompt, multi-parameter function signature
  pattern: constructUserPrompt helper with conditional content based on optional parameters

- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts.ts#L868-L979
  why: Contains the BUG_HUNT_PROMPT system prompt content
  critical: The complete BUG_HUNT_PROMPT must be included in the generated prompt
  section: Lines 868-979 contain the full bug hunt prompt with 4 testing phases

- url: file:///home/dustin/projects/hacky-hack/src/core/models.ts#L1541-L1785
  why: TestResultsSchema and BugSchema definitions for responseFormat
  critical: TestResultsSchema structure: hasBugs (boolean), bugs (Bug[]), summary (string), recommendations (string[])
  pattern: Zod schema validation with nested BugSchema array

- url: file:///home/dustin/projects/hacky-hack/tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  why: Comprehensive test pattern for prompt generators
  critical: Test structure: SETUP/EXECUTE/VERIFY pattern, mock Backlog fixture, property assertions
  pattern: describe() blocks grouping related tests, it() for individual test cases

- url: file:///home/dustin/projects/hacky-hack/src/agents/prompts/index.ts
  why: Export pattern - must add export for createBugHuntPrompt
  critical: Follow exact export format: `export { createBugHuntPrompt } from './bug-hunt-prompt.js';`
  pattern: ESM-style exports with .js extensions

- url: file:///home/dustin/projects/hacky-hack/src/core/models.ts#L155-L160
  why: Task interface definition for completedTasks parameter type
  critical: Task type has: id, title, status, description, subtasks
  pattern: Use `import type { Task }` for type-only imports
```

### Current Codebase tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── agents/
│   │   ├── prompts/
│   │   │   ├── architect-prompt.ts       # Simple pattern - single prdContent param
│   │   │   ├── prp-blueprint-prompt.ts   # Complex pattern - helper functions
│   │   │   ├── delta-analysis-prompt.ts  # Multi-param pattern - optional params
│   │   │   └── index.ts                  # Exports all prompt generators
│   │   ├── agent-factory.ts              # Agent creation (not modified)
│   │   └── prompts.ts                    # System prompts including BUG_HUNT_PROMPT
│   ├── core/
│   │   └── models.ts                     # TestResultsSchema, BugSchema, Task type
│   └── utils/
│       └── task-utils.ts                 # Task utilities (not needed for this PRP)
└── tests/
    └── unit/
        └── agents/
            └── prompts/
                ├── architect-prompt.test.ts      # Reference test pattern
                ├── prp-blueprint-prompt.test.ts  # Comprehensive test pattern
                └── delta-analysis-prompt.test.ts # Multi-param test pattern
```

### Desired Codebase tree with files to be added

```bash
/home/dustin/projects/hacky-hack
├── src/
│   └── agents/
│       └── prompts/
│           ├── architect-prompt.ts       # Existing - reference pattern
│           ├── prp-blueprint-prompt.ts   # Existing - reference pattern
│           ├── delta-analysis-prompt.ts  # Existing - reference pattern
│           ├── bug-hunt-prompt.ts        # NEW - Main implementation file
│           └── index.ts                  # MODIFY - Add export
└── tests/
    └── unit/
        └── agents/
            └── prompts/
                ├── architect-prompt.test.ts      # Existing - reference pattern
                ├── prp-blueprint-prompt.test.ts  # Existing - reference pattern
                ├── delta-analysis-prompt.test.ts # Existing - reference pattern
                └── bug-hunt-prompt.test.ts       # NEW - Test file
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: ESM module imports require .js extensions (not .ts)
// WRONG: import { createPrompt } from 'groundswell';
// RIGHT:  import { createPrompt } from 'groundswell';
import { createPrompt, type Prompt } from 'groundswell';
import type { TestResults, Task } from '../../core/models.js';
import { TestResultsSchema } from '../../core/models.js';

// CRITICAL: System prompts are imported from ../prompts.js (sibling file)
import { BUG_HUNT_PROMPT } from '../prompts.js';

// CRITICAL: createPrompt returns Prompt object with these properties:
// - user: string (the constructed user prompt)
// - systemOverride: string (the system prompt - NOT 'system' key)
// - responseFormat: ZodSchema (for structured output validation)
// - enableReflection: boolean (always true for complex prompts)

// CRITICAL: TestResultsSchema structure:
interface TestResults {
  hasBugs: boolean;              // Drives bug fix pipeline
  bugs: Bug[];                   // Array can be empty
  summary: string;               // Required, min length 1
  recommendations: string[];     // Array, can be empty
}

// CRITICAL: BugSchema structure (nested in TestResults):
interface Bug {
  id: string;                    // Required, min length 1
  severity: BugSeverity;         // 'critical' | 'major' | 'minor' | 'cosmetic'
  title: string;                 // Required, 1-200 chars
  description: string;           // Required, min length 1
  reproduction: string;          // Required, min length 1
  location?: string;             // Optional
}

// GOTCHA: BUG_HUNT_PROMPT contains bash-style placeholders $(cat "$PRD_FILE")
// These are NOT replaced by our function - they're for the shell script version
// Our function adds PRD content directly to user prompt before appending BUG_HUNT_PROMPT

// GOTCHA: BUG_HUNT_PROMPT writes to ./TEST_RESULTS.md in Phase 4
// This is shell-specific behavior - our agent version returns TestResults object directly
// The structured output via responseFormat replaces file writing

// PATTERN: All prompt generators use enableReflection: true
// This provides multi-level error recovery for complex structured output

// PATTERN: Helper functions for prompt construction are private (not exported)
// They live in the same file and are called by the exported main function
```

## Implementation Blueprint

### Data models and structure

No new data models needed - using existing TestResultsSchema and BugSchema from src/core/models.ts.

**Existing Models to Use**:
- `TestResults` interface (src/core/models.ts:1716-1757)
- `TestResultsSchema` Zod schema (src/core/models.ts:1780-1785)
- `Bug` interface (src/core/models.ts:1588-1649)
- `BugSchema` Zod schema (src/core/models.ts:1673-1680)
- `BugSeverity` enum (src/core/models.ts:1541)
- `Task` interface (src/core/models.ts:155-160)

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/agents/prompts/bug-hunt-prompt.ts
  - IMPLEMENT: createBugHuntPrompt(prd: string, completedTasks: Task[]): Prompt<TestResults>
  - FOLLOW pattern: src/agents/prompts/delta-analysis-prompt.ts (helper function pattern)
  - NAMING: camelCase function name, descriptive helper function constructUserPrompt
  - PLACEMENT: src/agents/prompts/ directory
  - IMPORTS:
    - createPrompt, type Prompt from 'groundswell'
    - type TestResults, type Task from '../../core/models.js'
    - TestResultsSchema from '../../core/models.js'
    - BUG_HUNT_PROMPT from '../prompts.js'

Task 2: IMPLEMENT constructUserPrompt helper function (internal, not exported)
  - IMPLEMENT: constructUserPrompt(prd: string, completedTasks: Task[]): string
  - PATTERN: Follow delta-analysis-prompt.ts helper function structure
  - CONSTRUCT: Markdown prompt with:
    1. "## Original PRD" section with prd content
    2. "## Completed Tasks" section with task list
    3. "---" separator
    4. BUG_HUNT_PROMPT content appended
  - GOTCHA: Handle empty completedTasks array gracefully (show empty list)

Task 3: IMPLEMENT createBugHuntPrompt exported function
  - IMPLEMENT: createBugHuntPrompt(prd: string, completedTasks: Task[]): Prompt<TestResults>
  - CALL: constructUserPrompt(prd, completedTasks) for user content
  - RETURN: createPrompt({ user, system, responseFormat, enableReflection })
  - PATTERN: Follow exact structure from delta-analysis-prompt.ts:123-143
  - CONFIGURATION:
    - user: result from constructUserPrompt()
    - system: BUG_HUNT_PROMPT (QA Engineer persona)
    - responseFormat: TestResultsSchema
    - enableReflection: true

Task 4: MODIFY src/agents/prompts/index.ts
  - ADD: export { createBugHuntPrompt } from './bug-hunt-prompt.js';
  - FOLLOW pattern: Existing exports use .js extension
  - PRESERVE: All existing exports (architect, prp-blueprint, delta-analysis)

Task 5: CREATE tests/unit/agents/prompts/bug-hunt-prompt.test.ts
  - IMPLEMENT: Comprehensive unit tests following prp-blueprint-prompt.test.ts pattern
  - FIXTURES: Create mock Task array for completedTasks parameter
  - TEST CASES:
    1. should return a Prompt object with correct structure
    2. should include PRD content in user prompt
    3. should include completed tasks section in user prompt
    4. should handle empty completedTasks array
    5. should include BUG_HUNT_PROMPT content in system prompt
    6. should have enableReflection set to true
    7. should include responseFormat (TestResultsSchema)
    8. should format completed tasks as markdown list
  - PATTERN: SETUP/EXECUTE/VERIFY test structure
  - COVERAGE: All public methods and branches

Task 6: RUN tests and validate implementation
  - EXECUTE: npm test -- tests/unit/agents/prompts/bug-hunt-prompt.test.ts
  - VERIFY: All tests pass
  - VERIFY: Coverage meets 100% requirement
  - DEBUG: Fix any failing tests before proceeding
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Helper function for user prompt construction (internal)
function constructUserPrompt(
  prd: string,
  completedTasks: Task[]
): string {
  // Build completed tasks list
  const tasksList = completedTasks.length > 0
    ? completedTasks.map(task => `- ${task.id}: ${task.title}`).join('\n')
    : 'No completed tasks yet';

  // Construct the complete user prompt
  return `
## Original PRD

${prd}

## Completed Tasks

${tasksList}

---

${BUG_HUNT_PROMPT}
`;
}

// PATTERN 2: Exported main function using createPrompt
export function createBugHuntPrompt(
prd: string,
completedTasks: Task[]
): Prompt<TestResults> {
// PATTERN: Use createPrompt with responseFormat for structured output
return createPrompt({
// The user prompt contains PRD + completed tasks + BUG_HUNT_PROMPT
user: constructUserPrompt(prd, completedTasks),

    // The system prompt is the BUG_HUNT_PROMPT (QA Engineer persona)
    system: BUG_HUNT_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against TestResultsSchema
    responseFormat: TestResultsSchema,

    // CRITICAL: Enable reflection for complex bug analysis
    // Reflection provides error recovery for structured output
    enableReflection: true,

});
}

// PATTERN 3: File documentation with JSDoc
/\*\*

- Bug hunt prompt generator module
-
- @module agents/prompts/bug-hunt-prompt
-
- @remarks
- Provides a type-safe prompt generator for the QA Bug Hunt workflow.
- Generates adversarial testing prompts with PRD context and completion status.
  \*/

// PATTERN 4: Function documentation with usage example
/\*\*

- Create a Bug Hunt prompt with structured TestResults output
-
- @remarks
- Returns a Groundswell Prompt configured with:
- - user: PRD content + completed tasks list + BUG_HUNT_PROMPT
- - system: BUG_HUNT_PROMPT (QA Engineer persona)
- - responseFormat: TestResultsSchema (type-safe JSON output)
- - enableReflection: true (for thorough analysis reliability)
-
- @param prd - The PRD markdown content to test against
- @param completedTasks - Array of completed Task objects showing implementation progress
- @returns Groundswell Prompt object configured for QA Bug Hunt
-
- @example
- ```typescript

  ```

- import { createBugHuntPrompt } from './agents/prompts/bug-hunt-prompt.js';
-
- const prd = '# My PRD\n...';
- const completedTasks = [{ id: 'P1.M1.T1', title: 'Setup', status: 'Complete', ... }];
-
- const prompt = createBugHuntPrompt(prd, completedTasks);
- const results = await qaAgent.prompt(prompt);
- // results is typed as TestResults with hasBugs, bugs, summary, recommendations
- ```
  */
  ```

````

### Integration Points

```yaml
CODEBASE:
  - existing: TestResultsSchema in src/core/models.ts (lines 1780-1785)
  - existing: BUG_HUNT_PROMPT in src/agents/prompts.ts (lines 868-979)
  - existing: Task type in src/core/models.ts (lines 155-160)
  - dependency: groundswell library for createPrompt and Prompt type

EXPORTS:
  - modify: src/agents/prompts/index.ts
  - pattern: "export { createBugHuntPrompt } from './bug-hunt-prompt.js';"
  - ordering: Add after existing exports for consistency

TESTS:
  - create: tests/unit/agents/prompts/bug-hunt-prompt.test.ts
  - framework: Vitest (already configured)
  - coverage: 100% required for new files
  - pattern: Follow prp-blueprint-prompt.test.ts structure
````

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating bug-hunt-prompt.ts - fix before proceeding
npm run lint -- src/agents/prompts/bug-hunt-prompt.ts
npm run format -- src/agents/prompts/bug-hunt-prompt.ts

# Project-wide validation
npm run lint
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the bug-hunt-prompt module
npm test -- tests/unit/agents/prompts/bug-hunt-prompt.test.ts

# Test all prompt generators
npm test -- tests/unit/agents/prompts/

# Full unit test suite
npm test -- tests/unit/

# Coverage validation
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify imports work correctly
node -e "import('./src/agents/prompts/bug-hunt-prompt.js').then(m => console.log('Import OK:', typeof m.createBugHuntPrompt))"

# Verify index.ts export
node -e "import('./src/agents/prompts/index.js').then(m => console.log('Exports:', Object.keys(m)))"

# Verify TestResultsSchema validation
node -e "
import('./src/core/models.js').then(m => {
  const result = m.TestResultsSchema.safeParse({
    hasBugs: false,
    bugs: [],
    summary: 'Test',
    recommendations: []
  });
  console.log('Schema validation:', result.success);
});
"

# Expected: All integrations working, imports resolve, schema validates correctly
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual validation: Test prompt generation with sample data
node -e "
import { createBugHuntPrompt } from './src/agents/prompts/bug-hunt-prompt.js';

const prd = '# Test PRD\n## Requirements\nBuild a feature.';
const tasks = [{
  id: 'P1.M1.T1',
  title: 'Initialize Project',
  status: 'Complete',
  description: 'Setup',
  subtasks: []
}];

const prompt = createBugHuntPrompt(prd, tasks);
console.log('User prompt contains PRD:', prompt.user.includes('# Test PRD'));
console.log('User prompt contains tasks:', prompt.user.includes('P1.M1.T1'));
console.log('Reflection enabled:', prompt.enableReflection);
console.log('Response format defined:', !!prompt.responseFormat);
"

# Expected: All validations pass, prompt structure is correct
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/agents/prompts/bug-hunt-prompt.test.ts`
- [ ] No linting errors: `npm run lint -- src/agents/prompts/bug-hunt-prompt.ts`
- [ ] No formatting issues: `npm run format`
- [ ] File follows established patterns from existing prompt generators

### Feature Validation

- [ ] Function signature matches contract: `createBugHuntPrompt(prd: string, completedTasks: Task[]): Prompt<TestResults>`
- [ ] User prompt includes PRD content section
- [ ] User prompt includes completed tasks section
- [ ] BUG_HUNT_PROMPT is included in generated prompt
- [ ] responseFormat is TestResultsSchema
- [ ] enableReflection is true
- [ ] Export added to src/agents/prompts/index.ts
- [ ] Imports use .js extensions for ESM compatibility

### Code Quality Validation

- [ ] Follows existing codebase patterns (matches delta-analysis-prompt.ts structure)
- [ ] File placement matches desired codebase tree structure
- [ ] JSDoc documentation includes module, function, and usage examples
- [ ] Helper function is private (not exported)
- [ ] TypeScript types are properly imported (type-only imports where applicable)
- [ ] No console.log or debug statements left in code

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] JSDoc comments explain purpose, parameters, return value
- [ ] Usage example in JSDoc demonstrates typical use case
- [ ] Module-level JSDoc explains purpose and integration points
- [ ] Tests serve as additional documentation of expected behavior

---

## Anti-Patterns to Avoid

- **Don't** create new patterns - follow delta-analysis-prompt.ts structure exactly
- **Don't** skip the helper function - use constructUserPrompt for clarity
- **Don't** use .ts extensions in imports - ESM requires .js
- **Don't** export the helper function - keep it private
- **Don't** set enableReflection to false - complex prompts need reflection
- **Don't** forget to update index.ts - must add export for module consistency
- **Don't** write tests without SETUP/EXECUTE/VERIFY comments - readability matters
- **Don't** use console.log in production code - remove any debug statements
- **Don't** hardcode BUG_HUNT_PROMPT content - import from ../prompts.js
- **Don't** skip type-only imports - use `import type { }` for types used only in annotations

---

## Confidence Score

**9/10** - One-pass implementation success likelihood is very high because:

1. **Three excellent reference implementations** - architect-prompt.ts, prp-blueprint-prompt.ts, and delta-analysis-prompt.ts provide clear patterns to follow
2. **All dependencies exist** - TestResultsSchema, BugSchema, Task type, and BUG_HUNT_PROMPT are already implemented
3. **Simple function signature** - Only two parameters, both well-understood types
4. **Clear test pattern** - prp-blueprint-prompt.test.ts provides comprehensive test structure to follow
5. **No external dependencies** - Only uses existing groundswell library and internal schemas
6. **No complex logic** - Prompt construction is straightforward string concatenation

**Why not 10/10**: Minor uncertainty around how BUG_HUNT_PROMPT's bash-style placeholders $(cat "$PRD_FILE") should be handled in the agent context, but the pattern from delta-analysis-prompt.ts shows these can be included as-is in the appended prompt content.
