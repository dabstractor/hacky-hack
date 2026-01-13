# PRP: P2.M2.T1.S1 - Create Zod Schema for Backlog Output (Architect Prompt Generator)

---

## Goal

**Feature Goal**: Create a Groundswell `createPrompt`-based prompt generator function that produces type-safe structured output conforming to the `BacklogSchema` when the Architect Agent processes a PRD.

**Deliverable**: `src/agents/prompts/architect-prompt.ts` module exporting `createArchitectPrompt()` function that returns a Groundswell `Prompt` object with `BacklogSchema` as the `responseFormat`.

**Success Definition**:

- Function `createArchitectPrompt(prdContent: string): Prompt` is exported
- The returned Prompt uses `BacklogSchema` for `responseFormat`
- The returned Prompt uses `TASK_BREAKDOWN_PROMPT` for the `system` prompt
- The returned Prompt has `enableReflection: true` for complex decomposition
- TypeScript compilation passes with no type errors
- The function can be imported and used by the Architect Agent

## Why

- **Foundation for Structured Architect Output**: The Architect Agent currently uses raw string prompts without structured output validation. This PRP enables type-safe, validated JSON output matching the `BacklogSchema`.
- **Enables One-Pass PRD to Backlog Conversion**: By using `createPrompt` with `responseFormat: BacklogSchema`, the LLM output is automatically validated and typed, eliminating manual JSON parsing and validation steps.
- **Establishes Pattern for Future Prompt Generators**: This pattern will be replicated for Researcher (PRP generation), QA (bug hunt), and Delta prompt generators.
- **Leverages Groundswell's Built-in Reflection**: Complex task decomposition benefits from reflection-based error recovery, reducing failures on malformed LLM output.

## What

Create a new module `src/agents/prompts/architect-prompt.ts` that exports a function `createArchitectPrompt(prdContent: string): Prompt` which:

1. Imports `createPrompt` and `Prompt` type from `groundswell`
2. Imports `z` from `zod`
3. Imports `BacklogSchema` from `../../core/models.js`
4. Imports `TASK_BREAKDOWN_PROMPT` from `../prompts.js`
5. Returns a `Prompt` object created via `createPrompt()` with:
   - `user`: The PRD content string
   - `system`: `TASK_BREAKDOWN_PROMPT` (the LEAD TECHNICAL ARCHITECT system prompt)
   - `responseFormat`: `BacklogSchema`
   - `enableReflection`: `true` (for complex decomposition reliability)

### Success Criteria

- [ ] `src/agents/prompts/architect-prompt.ts` file created with correct imports
- [ ] `createArchitectPrompt(prdContent: string): Prompt` function exported
- [ ] Function uses `createPrompt()` with correct configuration
- [ ] TypeScript compilation passes: `npm run build`
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Function can be imported: `import { createArchitectPrompt } from './agents/prompts/architect-prompt.js';`

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact file structure and location for the new module
- Complete import patterns with specific paths
- The full `createPrompt` API signature from Groundswell
- The exact `BacklogSchema` structure and its location
- The exact `TASK_BREAKDOWN_PROMPT` content and its location
- Naming conventions and code patterns from the existing codebase
- Validation commands that are specific to this project

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- url: https://github.com/groundswell-ai/groundswell/blob/main/docs/prompt.md
  why: Complete Groundswell createPrompt API documentation with all options
  critical: The responseFormat option accepts Zod schemas and enables structured output validation

- url: https://zod.dev/
  why: Zod documentation for understanding schema validation patterns
  critical: z.infer<typeof Schema> pattern is used for type inference

- file: src/core/models.ts
  why: Contains BacklogSchema definition (lines 627-629) and all related schemas
  pattern: Zod schema definitions using z.object(), z.array(), z.lazy() for recursion
  gotcha: BacklogSchema depends on PhaseSchema which uses z.lazy() for MilestoneSchema recursion

- file: src/agents/prompts.ts
  why: Contains TASK_BREAKDOWN_PROMPT constant (lines 33-146) used for system prompt
  pattern: Template string with `as const` assertion for type inference
  gotcha: Prompt is a large markdown string that must be used as-is

- file: src/agents/agent-factory.ts
  why: Shows existing agent creation patterns and Groundswell imports
  pattern: createAgent() usage with system prompt as string constant
  gotcha: Current pattern uses string prompts directly - this PRP introduces createPrompt pattern

- file: plan/001_14b9dc2a33c7/P2M2T1S1/research/backlog_schema_analysis.md
  why: Detailed analysis of BacklogSchema structure and dependencies
  section: Complete schema structure and validation rules

- file: plan/001_14b9dc2a33c7/P2M2T1S1/research/groundswell_createprompt_api.md
  why: Groundswell createPrompt API reference with examples
  section: API Signature and Key Features

- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API documentation including reflection feature
  section: Lines 385-393 for reflection mechanism, createPrompt examples throughout

- docfile: plan/001_14b9dc2a33c7/P2M2T1S1/research/codebase_patterns.md
  why: Existing codebase patterns for prompts and agent factory
  section: Migration Pattern for createPrompt Usage
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts      # Agent creation functions using createAgent()
│   └── prompts.ts            # System prompt constants (TASK_BREAKDOWN_PROMPT, etc.)
├── config/
│   ├── constants.ts
│   ├── environment.ts
│   └── types.ts
├── core/
│   ├── models.ts             # BacklogSchema, PhaseSchema, StatusEnum, etc.
│   └── session-utils.ts
├── tools/
│   ├── bash-mcp.ts
│   ├── filesystem-mcp.ts
│   └── git-mcp.ts
├── utils/
│   └── task-utils.ts
├── workflows/
│   └── hello-world.ts
└── index.ts
```

### Desired Codebase Tree with New File

```bash
src/
├── agents/
│   ├── agent-factory.ts      # Agent creation functions
│   ├── prompts.ts            # System prompt constants
│   └── prompts/              # NEW: Prompt generator functions directory
│       └── architect-prompt.ts   # NEW: createArchitectPrompt() function
├── config/
├── core/
│   ├── models.ts             # BacklogSchema imported by architect-prompt.ts
│   └── session-utils.ts
├── tools/
├── utils/
├── workflows/
└── index.ts
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Groundswell's createPrompt returns immutable Prompt instances
// The responseFormat option accepts Zod schemas directly, not parsed schemas

// CRITICAL: BacklogSchema uses z.lazy() for recursive definitions
// PhaseSchema -> MilestoneSchema -> TaskSchema -> SubtaskSchema
// Do NOT try to inline or flatten these schemas

// CRITICAL: Import paths must use .js extension for ES modules
// Even though source files are .ts, imports use .js extension
// Example: import { BacklogSchema } from '../../core/models.js';

// GOTCHA: TASK_BREAKDOWN_PROMPT is a template string with `as const`
// It preserves exact formatting including markdown syntax

// GOTCHA: TypeScript's type inference works best with `as const` on strings
// This is why all prompt constants use `as const` assertion

// GOTCHA: The src/agents/ directory structure uses nested prompts/ subdirectory
// This keeps prompt generators separate from the agent factory
```

## Implementation Blueprint

### Data Models and Structure

No new data models are required. This PRP uses existing models:

- `BacklogSchema` from `src/core/models.ts`
- `Prompt` type from `groundswell`

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/agents/prompts directory
  - IMPLEMENT: Create new subdirectory for prompt generator modules
  - NAMING: src/agents/prompts/ (kebab-case directory name)
  - PLACEMENT: Nested under src/agents/
  - DEPENDENCIES: None

Task 2: CREATE src/agents/prompts/architect-prompt.ts
  - IMPLEMENT: createArchitectPrompt function with createPattern usage
  - FOLLOW pattern: See "Implementation Patterns & Key Details" below
  - NAMING: File name kebab-case, function name camelCase
  - PLACEMENT: src/agents/prompts/architect-prompt.ts
  - DEPENDENCIES: Task 1 (directory must exist)

Task 3: VERIFY TypeScript compilation
  - IMPLEMENT: Run build and type-check commands
  - COMMAND: npm run build && npm run type-check
  - EXPECTED: Zero errors, successful compilation
  - DEPENDENCIES: Task 2 (file must exist)

Task 4: VERIFY linting passes
  - IMPLEMENT: Run ESLint to verify code style
  - COMMAND: npm run lint
  - EXPECTED: Zero errors
  - DEPENDENCIES: Task 2 (file must exist)

Task 5: VERIFY function can be imported
  - IMPLEMENT: Create minimal import test
  - COMMAND: node -e "import('{ createArchitectPrompt } from './src/agents/prompts/architect-prompt.js'); console.log('Import successful');"
  - EXPECTED: Import succeeds, function is callable
  - DEPENDENCIES: Task 3 (build must succeed)
```

### Implementation Patterns & Key Details

````typescript
/**
 * Architect prompt generator module
 *
 * @module agents/prompts/architect-prompt
 *
 * @remarks
 * Provides a type-safe prompt generator for the Architect Agent.
 * Uses Groundswell's createPrompt() with BacklogSchema for structured output.
 */

// PATTERN: Import Groundswell prompt creation utilities
import { createPrompt, type Prompt } from 'groundswell';

// PATTERN: Import Zod for schema usage (responseFormat)
import { z } from 'zod';

// CRITICAL: Use .js extension for ES module imports
import { BacklogSchema } from '../../core/models.js';

// PATTERN: Import system prompt from sibling prompts file
import { TASK_BREAKDOWN_PROMPT } from '../prompts.js';

/**
 * Create an Architect Agent prompt with structured Backlog output
 *
 * @remarks
 * Returns a Groundswell Prompt configured with:
 * - user: The PRD content (provided as parameter)
 * - system: TASK_BREAKDOWN_PROMPT (LEAD TECHNICAL ARCHITECT persona)
 * - responseFormat: BacklogSchema (ensures type-safe JSON output)
 * - enableReflection: true (for complex decomposition reliability)
 *
 * The returned Prompt can be passed directly to agent.prompt():
 * ```typescript
 * const architect = createArchitectAgent();
 * const prompt = createArchitectPrompt(prdContent);
 * const result = await architect.prompt(prompt);
 * // result is typed as z.infer<typeof BacklogSchema> = Backlog
 * ```
 *
 * @param prdContent - The PRD markdown content to analyze
 * @returns Groundswell Prompt object configured for Architect Agent
 *
 * @example
 * ```typescript
 * import { createArchitectPrompt } from './agents/prompts/architect-prompt.js';
 *
 * const prd = '# My PRD\n...';
 * const prompt = createArchitectPrompt(prd);
 * const { backlog } = await agent.prompt(prompt);
 * ```
 */
export function createArchitectPrompt(prdContent: string): Prompt {
  // PATTERN: Use createPrompt with responseFormat for structured output
  return createPrompt({
    // The user prompt is the PRD content to analyze
    user: prdContent,

    // The system prompt is the LEAD TECHNICAL ARCHITECT persona
    system: TASK_BREAKDOWN_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against this schema
    responseFormat: BacklogSchema,

    // CRITICAL: Enable reflection for complex task decomposition
    // Reflection provides error recovery for multi-level JSON generation
    enableReflection: true,
  });
}

// PATTERN: Export type for convenience (optional but helpful)
export type { Prompt } from 'groundswell';
````

### Integration Points

```yaml
NO CONFIG CHANGES:
  - No configuration files need modification
  - No environment variables needed

NO ROUTE CHANGES:
  - This is a library module, not an API endpoint

FUTURE INTEGRATION (Not part of this PRP):
  - agent-factory.ts: Will import and use createArchitectPrompt in P2.M2.T1.S2
  - Architect Agent: Will use the returned Prompt for PRD analysis
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint
# Expected: Zero errors. ESLint verifies code style and potential issues.

# Type checking with TypeScript
npm run type-check
# Expected: Zero type errors. Verify BacklogSchema and Prompt types are compatible.

# Build compilation
npm run build
# Expected: Successful compilation to dist/ directory.

# If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# No unit tests required for this simple module
# The function is a pure wrapper around createPrompt()

# However, we can verify the function works:
npm run test -- src/agents/prompts/architect-prompt.test.ts
# (If test file is created - optional for this PRP)

# Full test suite for existing code
npm run test
# Expected: All existing tests still pass. New module doesn't break anything.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify the module can be imported
node -e "import('./dist/agents/prompts/architect-prompt.js').then(m => console.log('Exported functions:', Object.keys(m)));"
# Expected: Output includes 'createArchitectPrompt'

# Verify the function returns a Prompt object
node -e "
import('./dist/agents/prompts/architect-prompt.js').then(({ createArchitectPrompt }) => {
  const prompt = createArchitectPrompt('# Test PRD');
  console.log('Prompt type:', typeof prompt);
  console.log('Is Prompt object:', prompt !== null);
});
"
# Expected: Prompt is an object, not null

# Verify TypeScript types are exported correctly
npm run type-check -- --noEmit
# Expected: Type definitions include Prompt type and createArchitectPrompt function
```

### Level 4: Manual Verification

```bash
# Verify the function signature matches requirements
grep -A 5 "export function createArchitectPrompt" src/agents/prompts/architect-prompt.ts
# Expected: "export function createArchitectPrompt(prdContent: string): Prompt"

# Verify BacklogSchema is imported correctly
grep "import.*BacklogSchema" src/agents/prompts/architect-prompt.ts
# Expected: "import { BacklogSchema } from '../../core/models.js';"

# Verify TASK_BREAKDOWN_PROMPT is imported correctly
grep "import.*TASK_BREAKDOWN_PROMPT" src/agents/prompts/archipt-prompt.ts
# Expected: "import { TASK_BREAKDOWN_PROMPT } from '../prompts.js';"

# Verify enableReflection is true
grep "enableReflection" src/agents/prompts/architect-prompt.ts
# Expected: "enableReflection: true"

# Verify responseFormat uses BacklogSchema
grep "responseFormat" src/agents/prompts/architect-prompt.ts
# Expected: "responseFormat: BacklogSchema"
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] TypeScript compilation passes: `npm run build`
- [ ] No type errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Module can be imported: Import test succeeds

### Feature Validation

- [ ] Function signature matches: `createArchitectPrompt(prdContent: string): Prompt`
- [ ] Returns Groundswell Prompt object
- [ ] Uses `BacklogSchema` for `responseFormat`
- [ ] Uses `TASK_BREAKDOWN_PROMPT` for `system`
- [ ] Has `enableReflection: true`
- [ ] All imports use correct `.js` extensions

### Code Quality Validation

- [ ] Follows existing codebase patterns (JSDoc comments, naming conventions)
- [ ] File placement matches desired codebase tree structure
- [ ] Imports follow ES module conventions with `.js` extensions
- [ ] No anti-patterns (see below)

### Documentation & Deployment

- [ ] JSDoc comments explain the function's purpose and usage
- [ ] Code is self-documenting with clear variable names
- [ ] Example usage included in JSDoc

---

## Anti-Patterns to Avoid

- ❌ Don't use relative imports without `.js` extension (must use `../../core/models.js`)
- ❌ Don't try to modify `BacklogSchema` - use it as-is
- ❌ Don't create new prompt content in this file - use `TASK_BREAKDOWN_PROMPT`
- ❌ Don't set `enableReflection: false` - complex decomposition needs reflection
- ❌ Don't skip the JSDoc comments - they document the pattern for future prompt generators
- ❌ Don't inline the schema - import `BacklogSchema` from models
- ❌ Don't use `require()` - use ES module imports
- ❌ Don't create a class - this is a simple function factory
