# Product Requirement Prompt (PRP): Create PRP Generation Prompt

---

## Goal

**Feature Goal**: Create a TypeScript function `createPRPBlueprintPrompt()` that generates Groundswell prompts for PRP (Product Requirement Prompt) generation, taking a task/subtask from a Backlog and producing structured PRPDocument output.

**Deliverable**: A new file `src/agents/prompts/prp-blueprint-prompt.ts` with a `createPRPBlueprintPrompt()` function that extracts task context from a Backlog and generates a type-safe Groundswell prompt.

**Success Definition**:

- The function accepts a `Task | Subtask`, the parent `Backlog`, and the codebase path
- It extracts hierarchical context (dependencies, parent items, scope)
- It returns a `Prompt<PRPDocument>` using Groundswell's `createPrompt()`
- Unit tests validate the prompt generation and context extraction
- Integration test verifies the full Research Agent workflow

## User Persona

**Target User**: PRP Pipeline system developers who need to generate PRPs for work items.

**Use Case**: When the PRP Pipeline needs to create a detailed PRP for a specific task/subtask from the backlog, this prompt generator provides the structured prompt with all necessary context injected.

**User Journey**:

1. Task Orchestrator selects next pending work item from Backlog
2. System calls `createPRPBlueprintPrompt(task/subtask, backlog, codebasePath)`
3. Function extracts hierarchical context (dependencies, parent descriptions, scope)
4. Returns Groundswell prompt configured with PRP_BLUEPRINT_PROMPT system prompt
5. Research Agent uses prompt to generate comprehensive PRP document
6. PRP is stored and passed to Coder Agent for implementation

**Pain Points Addressed**:

- Manual PRP creation is error-prone and incomplete
- Context extraction from hierarchical backlog is complex
- Without proper context injection, PRPs fail the "one-pass implementation" goal
- Existing architect-prompt.ts pattern needs to be adapted for PRP generation

## Why

- **Business value**: Enables automated PRP generation at scale, reducing manual effort and ensuring consistency
- **Integration with existing features**: Builds on P2.M2.T2.S1 (PRPDocumentSchema) and follows the established architect-prompt.ts pattern
- **Problems this solves**:
  - Eliminates manual context extraction from Backlog hierarchy
  - Ensures all PRPs include necessary dependency and parent context
  - Provides type-safe prompt generation with Zod schema validation
  - Enables the Research Agent to generate comprehensive PRPs with full context

## What

Create a `createPRPBlueprintPrompt()` function that:

1. Accepts a `Task | Subtask` object from the Backlog hierarchy
2. Accepts the full `Backlog` object for context extraction
3. Accepts an optional `codebasePath` string for codebase analysis context
4. Extracts hierarchical context including:
   - Task/subtask title and description
   - Parent item descriptions (Task → Milestone → Phase)
   - Dependency context (for Subtasks)
   - `context_scope` contract definition (for Subtasks)
5. Constructs a data object with extracted context
6. Returns a `Prompt<PRPDocument>` using Groundswell's `createPrompt()` with:
   - `user`: Template string with task context injected
   - `system`: `PRP_BLUEPRINT_PROMPT` from `src/agents/prompts.ts`
   - `responseFormat`: `PRPDocumentSchema` for type-safe output
   - `enableReflection`: true for reliable complex generation

### Success Criteria

- [ ] `src/agents/prompts/prp-blueprint-prompt.ts` file created
- [ ] `createPRPBlueprintPrompt()` function exported with correct signature
- [ ] Context extraction handles both Task and Subtask types correctly
- [ ] Dependency resolution uses `getDependencies()` from `task-utils.ts`
- [ ] Unit tests verify prompt structure and context injection
- [ ] Integration test validates Research Agent workflow
- [ ] Follows architect-prompt.ts pattern for Groundswell integration
- [ ] All code passes linting and type checking

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**YES** - This PRP includes:

- Exact file paths and line numbers for all reference patterns
- Complete interface definitions for all data models
- Full source code of architect-prompt.ts as pattern to follow
- Groundswell library usage patterns from existing codebase
- Validation approach using existing test patterns

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/agents/prompts/architect-prompt.ts
  why: This is the EXACT pattern to follow for creating prompt generators
  pattern: createPrompt usage with responseFormat, enableReflection, system/user prompts
  gotcha: Uses .js extension for ES module imports (TypeScript requirement)

- file: src/agents/prompts.ts
  why: Contains PRP_BLUEPRINT_PROMPT system prompt and all prompt constants
  section: Lines 148-603 (PRP_BLUEPRINT_PROMPT constant)
  gotcha: PRP_BLUEPRINT_PROMPT includes <item_title> and <item_description> placeholders that must be replaced

- file: src/core/models.ts
  why: Contains PRPDocument, Backlog, Task, Subtask interfaces and Zod schemas
  section: Lines 1114-1223 (PRPDocument interface and PRPDocumentSchema)
  pattern: Zod schema validation pattern with z.object() and z.array()

- file: src/utils/task-utils.ts
  why: Provides findItem() and getDependencies() for context extraction
  section: Lines 90-142 (findItem and getDependencies functions)
  pattern: DFS traversal for hierarchical search and dependency resolution

- file: src/core/models.ts
  why: ValidationGate and SuccessCriterion schemas for PRP validation structure
  section: Lines 950-1063 (ValidationGate and SuccessCriterion definitions)
  pattern: z.union() for literal types, z.boolean() for satisfied field
```

### Current Codebase tree

```bash
src/
├── agents/
│   ├── agent-factory.ts          # Agent creation with persona-specific configs
│   ├── prompts.ts                # System prompt constants (TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, etc.)
│   └── prompts/
│       └── architect-prompt.ts   # Pattern to follow: createArchitectPrompt() function
├── core/
│   ├── models.ts                 # All data models (Backlog, Task, Subtask, PRPDocument, schemas)
│   └── session-utils.ts          # Session management utilities
├── utils/
│   └── task-utils.ts             # findItem(), getDependencies() for context extraction
└── tools/
    ├── bash-mcp.ts
    ├── filesystem-mcp.ts
    └── git-mcp.ts

tests/
├── unit/
│   └── agents/
│       └── prompts.test.ts       # Pattern for unit testing prompt generators
└── integration/
    └── architect-agent.test.ts   # Pattern for integration testing agent workflows
```

### Desired Codebase tree

```bash
src/
├── agents/
│   ├── agent-factory.ts
│   ├── prompts.ts
│   └── prompts/
│       ├── architect-prompt.ts
│       └── prp-blueprint-prompt.ts   # NEW FILE: createPRPBlueprintPrompt() function
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: ES Module imports must use .js extension (TypeScript requirement)
// BAD: import { Backlog } from '../../core/models';
// GOOD: import { Backlog } from '../../core/models.js';

// CRITICAL: Groundswell's createPrompt requires specific structure
// - responseFormat must be a Zod schema (not TypeScript type)
// - enableReflection: true is recommended for complex structured output
// - system prompt provides persona/instructions
// - user prompt provides dynamic content

// CRITICAL: PRP_BLUEPRINT_PROMPT contains placeholder variables:
// <item_title> and <item_description> must be replaced with actual values

// CRITICAL: TypeScript discriminated unions for HierarchyItem
// Use item.type === 'Subtask' for type narrowing before accessing Subtask-specific fields

// CRITICAL: ValidationGate level is a literal union (1 | 2 | 3 | 4), not number
// Use z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])

// CRITICAL: Subtask.context_scope contains CONTRACT DEFINITION format
// This should be preserved in the generated prompt for context isolation

// CRITICAL: Use as const assertions for prompt string constants
// This prevents TypeScript from widening string literal types
```

## Implementation Blueprint

### Data models and structure

The implementation uses existing data models:

- **Backlog**: Root interface with `backlog: Phase[]` array
- **Task | Subtask**: Union type for work items at different hierarchy levels
- **PRPDocument**: Output structure with taskId, objective, context, implementationSteps, validationGates, successCriteria, references
- **PRPDocumentSchema**: Zod schema for type-safe structured output

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/agents/prompts/prp-blueprint-prompt.ts
  - IMPLEMENT: createPRPBlueprintPrompt() function with proper TypeScript types
  - SIGNATURE: (task: Task | Subtask, backlog: Backlog, codebasePath?: string) => Prompt<PRPDocument>
  - FOLLOW pattern: src/agents/prompts/architect-prompt.ts (import structure, createPrompt usage)
  - NAMING: camelCase function name, descriptive parameter names
  - PLACEMENT: src/agents/prompts/ directory alongside architect-prompt.ts

Task 2: IMPLEMENT context extraction logic
  - IMPLEMENT: Extract title and description from task/subtask
  - IMPLEMENT: For Subtasks, extract dependencies using getDependencies() from task-utils.ts
  - IMPLEMENT: For Subtasks, include context_scope contract definition
  - IMPLEMENT: Build parent context string with ancestor descriptions
  - DEPENDENCIES: Import types from src/core/models.js, utilities from src/utils/task-utils.js
  - PATTERN: Use discriminated union (item.type === 'Subtask') for type narrowing

Task 3: IMPLEMENT prompt template construction
  - IMPLEMENT: Replace <item_title> and <item_description> placeholders in PRP_BLUEPRINT_PROMPT
  - IMPLEMENT: Inject extracted context into user prompt
  - IMPLEMENT: Include codebasePath in user prompt for codebase analysis instructions
  - PATTERN: Template literal string with ${variable} interpolation
  - GOTCHA: PRP_BLUEPRINT_PROMPT is a template string, use .replace() or template literal

Task 4: IMPLEMENT Groundswell createPrompt integration
  - IMPLEMENT: Call createPrompt() with system, user, responseFormat, enableReflection
  - SYSTEM: PRP_BLUEPRINT_PROMPT from ../prompts.js
  - USER: Constructed prompt with task context and placeholders replaced
  - RESPONSE_FORMAT: PRPDocumentSchema from ../../core/models.js
  - ENABLE_REFLECTION: true (for reliable complex PRP generation)
  - FOLLOW pattern: src/agents/prompts/architect-prompt.ts lines 51-67

Task 5: ADD comprehensive JSDoc documentation
  - IMPLEMENT: Module-level JSDoc explaining the prompt generator's purpose
  - IMPLEMENT: Function-level JSDoc with @param, @returns, @example tags
  - IMPLEMENT: @remarks explaining context extraction and Groundswell integration
  - PATTERN: Follow architect-prompt.ts documentation style (lines 1-49)

Task 6: CREATE tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  - IMPLEMENT: Unit test for prompt generation with valid Task input
  - IMPLEMENT: Unit test for prompt generation with valid Subtask input
  - IMPLEMENT: Unit test for dependency context extraction
  - IMPLEMENT: Unit test for context_scope inclusion in generated prompt
  - FOLLOW pattern: tests/unit/agents/prompts.test.ts (prompt content validation)
  - NAMING: test_{function}_{scenario} naming convention

Task 7: UPDATE src/agents/prompts.ts exports (if needed)
  - VERIFY: Check if createPRPBlueprintPrompt should be exported from prompts.ts
  - IMPLEMENT: Add export if needed following existing pattern
  - PRESERVE: All existing exports (TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, etc.)
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Import structure (FOLLOW EXACTLY)
import { createPrompt, type Prompt } from 'groundswell';
import type { Backlog, Task, Subtask, PRPDocument } from '../../core/models.js';
import { PRPDocumentSchema } from '../../core/models.js';
import { PRP_BLUEPRINT_PROMPT } from '../prompts.js';
import {
  findItem,
  getDependencies,
  isSubtask,
} from '../../utils/task-utils.js';

// Pattern 2: Type guard for discriminated union
function extractTaskContext(task: Task | Subtask, backlog: Backlog): string {
  // PATTERN: Use type guard before accessing Subtask-specific fields
  if (isSubtask(task)) {
    // Access task.dependencies, task.context_scope (Subtask-specific)
    const deps = getDependencies(task, backlog);
    return `Subtask: ${task.title}\nDependencies: ${deps.map(d => d.id).join(', ')}\nContext Scope: ${task.context_scope}`;
  } else {
    // Task-specific fields (description, subtasks array)
    return `Task: ${task.title}\nDescription: ${task.description}`;
  }
}

// Pattern 3: Parent context extraction
function extractParentContext(taskId: string, backlog: Backlog): string {
  // PATTERN: Parse ID to traverse hierarchy (e.g., "P2.M2.T2.S2")
  const parts = taskId.split('.');
  const contexts: string[] = [];

  // Extract context from each level (Phase, Milestone, Task)
  for (let i = parts.length - 1; i > 0; i--) {
    const parentId = parts.slice(0, i).join('.');
    const parent = findItem(backlog, parentId);
    if (parent) {
      contexts.push(`${parent.type}: ${parent.description}`);
    }
  }

  return contexts.join('\n');
}

// Pattern 4: Placeholder replacement in PRP_BLUEPRINT_PROMPT
// GOTCHA: PRP_BLUEPRINT_PROMPT contains <item_title> and <item_description> placeholders
// Option A: Use .replace() method
const userPrompt = PRP_BLUEPRINT_PROMPT.replace(
  '<item_title>',
  task.title
).replace('<item_description>', task.description || context_scope);

// Option B: Use template literal with extracted values
const userPrompt = `
# Create PRP for Work Item

## Work Item Information

**ITEM TITLE**: ${task.title}
**ITEM DESCRIPTION**: ${isSubtask(task) ? task.context_scope : task.description}

${extractParentContext(task.id, backlog)}
`;

// Pattern 5: Groundswell createPrompt call (COPY FROM architect-prompt.ts)
export function createPRPBlueprintPrompt(
  task: Task | Subtask,
  backlog: Backlog,
  codebasePath?: string
): Prompt<PRPDocument> {
  // CRITICAL: responseFormat enables type-safe structured output
  return createPrompt({
    // The user prompt contains the task context with placeholders replaced
    user: constructUserPrompt(task, backlog, codebasePath),

    // The system prompt is the PRP_BLUEPRINT_PROMPT (Researcher persona)
    system: PRP_BLUEPRINT_PROMPT,

    // CRITICAL: responseFormat validates LLM output against PRPDocumentSchema
    responseFormat: PRPDocumentSchema,

    // CRITICAL: Enable reflection for complex PRP generation reliability
    enableReflection: true,
  });
}
```

### Integration Points

```yaml
PROMPTS_MODULE:
  - file: src/agents/prompts.ts
  - action: May need to export createPRPBlueprintPrompt for convenient imports
  - pattern: "export { createPRPBlueprintPrompt } from './prompts/prp-blueprint-prompt.js';"

AGENT_FACTORY:
  - file: src/agents/agent-factory.ts
  - action: Future enhancement - add createResearcherAgent() using this prompt
  - note: This PRP creates the prompt generator, not the agent itself

UTILITIES:
  - file: src/utils/task-utils.ts
  - functions: findItem() for parent context, getDependencies() for dependency resolution
  - pattern: "import { findItem, getDependencies, isSubtask } from '../../utils/task-utils.js';"

MODELS:
  - file: src/core/models.ts
  - types: Backlog, Task, Subtask, PRPDocument
  - schemas: PRPDocumentSchema, ValidationGateSchema, SuccessCriterionSchema
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating the file - fix before proceeding
npx eslint src/agents/prompts/prp-blueprint-prompt.ts --fix
npx tsc --noEmit src/agents/prompts/prp-blueprint-prompt.ts
npx prettier --write src/agents/prompts/prp-blueprint-prompt.ts

# Project-wide validation
npm run lint
npm run typecheck
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test prompt generation with different input types
npx vitest tests/unit/agents/prompts/prp-blueprint-prompt.test.ts -v

# Run all unit tests in agents/prompts
npx vitest tests/unit/agents/prompts/ -v

# Coverage validation
npx vitest tests/unit/agents/prompts/ --coverage

# Expected: All tests pass. Tests should verify:
# 1. Prompt structure matches expected format
# 2. Context extraction works for Task input
# 3. Context extraction works for Subtask input (including dependencies)
# 4. Placeholders (<item_title>, <item_description>) are replaced
# 5. Parent context is included in generated prompt
# 6. PRPDocumentSchema validates the responseFormat
```

### Level 3: Integration Testing (System Validation)

```bash
# Test the Research Agent workflow with the new prompt generator
npx vitest tests/integration/prp-blueprint-agent.test.ts -v

# Manual integration test (create a test script)
# 1. Load a sample Backlog from plan/001_14b9dc2a33c7/tasks.json
# 2. Select a sample Task/Subtask
# 3. Call createPRPBlueprintPrompt(task, backlog, '/home/dustin/projects/hacky-hack')
# 4. Verify the returned Prompt has correct structure
# 5. Verify the user prompt contains replaced placeholders
# 6. Verify parent context is included

# Expected: Prompt generation works end-to-end, context is properly injected
```

### Level 4: Manual Validation & Documentation

```bash
# Manual verification of prompt generation
node -e "
import { createPRPBlueprintPrompt } from './src/agents/prompts/prp-blueprint-prompt.js';
import { BacklogSchema } from './src/core/models.js';
import fs from 'fs';

const backlog = JSON.parse(fs.readFileSync('plan/001_14b9dc2a33c7/tasks.json', 'utf8'));
const validation = BacklogSchema.safeParse(backlog);

if (validation.success) {
  const task = validation.data.backlog[0].milestones[0].tasks[0].subtasks[0];
  const prompt = createPRPBlueprintPrompt(task, validation.data, '/home/dustin/projects/hacky-hack');
  console.log('Prompt generated successfully');
  console.log('User prompt length:', prompt.user.length);
  console.log('System prompt:', prompt.system.substring(0, 100) + '...');
} else {
  console.error('Backlog validation failed:', validation.error);
}
"

# Verify documentation completeness
# - Check JSDoc comments are present and accurate
# - Verify @example code is executable
# - Confirm all imports use .js extension

# Expected: Manual testing passes, documentation is complete
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npx vitest tests/ -v`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format` then `npm run format:check`

### Feature Validation

- [ ] `createPRPBlueprintPrompt()` function accepts Task input correctly
- [ ] `createPRPBlueprintPrompt()` function accepts Subtask input correctly
- [ ] Context extraction includes parent descriptions (Phase, Milestone, Task)
- [ ] Dependency context is extracted for Subtasks using `getDependencies()`
- [ ] `context_scope` is included for Subtasks
- [ ] Placeholders `<item_title>` and `<item_description>` are replaced
- [ ] Returns `Prompt<PRPDocument>` type (verified by TypeScript)
- [ ] Integration with Groundswell `createPrompt()` follows architect-prompt.ts pattern

### Code Quality Validation

- [ ] Follows architect-prompt.ts import pattern (.js extensions)
- [ ] File placement in `src/agents/prompts/` directory
- [ ] JSDoc documentation matches architect-prompt.ts style
- [ ] Type guards used correctly for discriminated unions
- [ ] Zod schema PRPDocumentSchema used for responseFormat
- [ ] `enableReflection: true` set for reliable complex generation

### Documentation & Deployment

- [ ] JSDoc includes @param, @returns, @example tags
- [ ] Module-level documentation explains purpose and usage
- [ ] @remarks explain context extraction and Groundswell integration
- [ ] @example code is executable and demonstrates usage

---

## Anti-Patterns to Avoid

- ❌ Don't forget `.js` extension in ES module imports (TypeScript requirement)
- ❌ Don't use `import { PRP_BLUEPRINT_PROMPT } from '../prompts'` without `.js`
- ❌ Don't skip type guards - always use `isSubtask()` before accessing Subtask-specific fields
- ❌ Don't hardcode placeholder replacement - use dynamic replacement based on input type
- ❌ Don't omit `enableReflection: true` - PRP generation is complex and needs error recovery
- ❌ Don't forget to import `getDependencies()` from task-utils.ts for Subtask context
- ❌ Don't create a new pattern - follow architect-prompt.ts exactly for consistency
- ❌ Don't assume task has `context_scope` - only Subtasks have this field
- ❌ Don't ignore parent context - include Phase, Milestone, and Task descriptions
- ❌ Don't skip unit tests - verify both Task and Subtask input paths

## References Summary

| Reference               | Location                                    | Purpose                                      |
| ----------------------- | ------------------------------------------- | -------------------------------------------- |
| architect-prompt.ts     | src/agents/prompts/architect-prompt.ts:1-68 | Exact pattern to follow for prompt generator |
| PRP_BLUEPRINT_PROMPT    | src/agents/prompts.ts:157-603               | System prompt for PRP generation             |
| PRPDocumentSchema       | src/core/models.ts:1213-1223                | Zod schema for structured output             |
| task-utils.ts           | src/utils/task-utils.ts:90-142              | Context extraction utilities                 |
| prompts.test.ts         | tests/unit/agents/prompts.test.ts           | Unit test pattern for prompts                |
| architect-agent.test.ts | tests/integration/architect-agent.test.ts   | Integration test pattern for agents          |
