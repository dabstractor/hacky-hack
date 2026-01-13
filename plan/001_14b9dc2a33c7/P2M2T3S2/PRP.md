# PRP: Delta Analysis Prompt Generator (P2.M2.T3.S2)

---

## Goal

**Feature Goal**: Create a type-safe prompt generator function that produces structured delta analysis for PRD changes, enabling the task orchestrator to patch the backlog with changed requirements.

**Deliverable**: A new `src/agents/prompts/delta-analysis-prompt.ts` module exporting `createDeltaAnalysisPrompt()` function with `Prompt<DeltaAnalysis>` return type.

**Success Definition**: The function correctly constructs a Groundswell prompt with all necessary context (old PRD, new PRD, completed tasks), uses `DeltaAnalysisSchema` for structured output, and includes comprehensive tests that validate prompt structure and schema compatibility.

## Why

- **Integration with Delta Workflow (P4.M1.T1)**: This prompt generator enables the delta analysis workflow that compares PRD versions and generates patch instructions for task re-execution.
- **Task Patching Foundation**: The structured `DeltaAnalysis` output guides which tasks need re-execution, which can be preserved, and which are obsolete.
- **Avoids Re-work**: By providing completed task context, the delta analysis prevents unnecessary re-execution of unaffected work items.
- **Pattern Consistency**: Follows the established pattern from `architect-prompt.ts` and `prp-blueprint-prompt.ts` for maintainability.

## What

Create a prompt generator function that:

1. **Accepts Parameters**:
   - `oldPRD: string` - Previous PRD content
   - `newPRD: string` - Modified PRD content
   - `completedTaskIds: string[]` - List of completed task IDs to avoid re-work

2. **Constructs User Prompt**:
   - Structured markdown with old PRD, new PRD, and completed task sections
   - Clear instructions for delta analysis
   - Context about completed work to preserve

3. **Returns Groundswell Prompt**:
   - Uses `DELTA_ANALYSIS_PROMPT` as system prompt
   - Uses `DeltaAnalysisSchema` as `responseFormat`
   - Enables reflection for reliable structured output

### Success Criteria

- [ ] Function `createDeltaAnalysisPrompt()` exported from `src/agents/prompts/delta-analysis-prompt.ts`
- [ ] `DELTA_ANALYSIS_PROMPT` constant added to `src/agents/prompts.ts`
- [ ] Prompt includes all three inputs (old PRD, new PRD, completed tasks)
- [ ] Unit tests validate prompt structure and content
- [ ] Integration test verifies schema compatibility

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:

- Exact file paths and line numbers for all patterns to follow
- Complete schema definitions for `DeltaAnalysis` and `RequirementChange`
- Groundswell API usage patterns from existing implementations
- Test patterns matching existing test structure
- Delta analysis domain requirements from PRD

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: src/agents/prompts/architect-prompt.ts
  why: Pattern for createPrompt usage with responseFormat
  pattern: Import createPrompt from 'groundswell', use with schema, enableReflection
  gotcha: Must use .js extension for ES module imports (line 15-16)

- file: src/agents/prompts/prp-blueprint-prompt.ts
  why: Complex user prompt construction pattern with helper function
  pattern: constructUserPrompt() builds context from multiple inputs (lines 142-201)
  gotcha: Helper functions use module-level exports, not inline

- file: src/core/models.ts
  why: DeltaAnalysisSchema and RequirementChangeSchema definitions
  pattern: z.object() with min(1) validation for strings, z.enum() for types
  section: Lines 1361-1523 (RequirementChange and DeltaAnalysis schemas)
  gotcha: Schema uses z.ZodType<Interface> pattern for type safety

- file: src/agents/prompts.ts
  why: Pattern for system prompt constants and exports
  pattern: Export const PROMPT_NAME = `...` as const; then add to PROMPTS object
  section: Lines 687-734 (DELTA_PRD_PROMPT example)
  gotcha: Must update PROMPTS object and export type PromptKey

- file: tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  why: Test pattern for prompt generators
  pattern: describe('agents/prompts/name', () => { it('should return Prompt', ...) })
  gotcha: Uses mockBacklog fixture from tests/fixtures/

- file: PRD.md
  why: Delta workflow requirements and expected outputs
  section: Section 6.4 (Delta PRD Generation Prompt) and Section 4.3 (Delta Workflow)
  gotcha: Delta analysis outputs changes array, patchInstructions, and taskIds

- docfile: plan/001_14b9dc2a33c7/P2M2T3S1/PRP.md
  why: Schema implementation details for DeltaAnalysis and RequirementChange
  section: Complete schema definitions and validation rules
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── prompts.ts                    # System prompt constants (ADD DELTA_ANALYSIS_PROMPT here)
│   ├── prompts/
│   │   ├── architect-prompt.ts       # Reference: Simple prompt pattern
│   │   └── prp-blueprint-prompt.ts   # Reference: Complex prompt construction
│   └── agent-factory.ts              # Agent creation patterns
├── core/
│   └── models.ts                     # DeltaAnalysisSchema (lines 1518-1522)
├── utils/
│   └── task-utils.ts                 # Task hierarchy utilities (may need delta utils)
└── main.ts                           # Entry point

tests/
├── unit/
│   └── agents/
│       ├── prompts.test.ts           # Prompt export tests
│       └── prompts/
│           └── prp-blueprint-prompt.test.ts  # Test pattern
└── fixtures/
    └── mock-backlog.ts               # Test fixtures
```

### Desired Codebase Tree

```bash
src/
├── agents/
│   ├── prompts.ts                    # MODIFIED: Add DELTA_ANALYSIS_PROMPT constant
│   ├── prompts/
│   │   ├── architect-prompt.ts       # EXISTING
│   │   ├── prp-blueprint-prompt.ts   # EXISTING
│   │   └── delta-analysis-prompt.ts  # NEW: createDeltaAnalysisPrompt()
│   └── agent-factory.ts              # EXISTING
├── core/
│   └── models.ts                     # EXISTING: DeltaAnalysisSchema already here
├── utils/
│   └── task-utils.ts                 # EXISTING: May extend with delta utilities
└── main.ts                           # EXISTING

tests/
├── unit/
│   └── agents/
│       ├── prompts.test.ts           # MODIFIED: Add DELTA_ANALYSIS_PROMPT tests
│       └── prompts/
│           ├── prp-blueprint-prompt.test.ts  # EXISTING
│           └── delta-analysis-prompt.test.ts # NEW: Prompt generator tests
└── fixtures/
    ├── mock-backlog.ts               # EXISTING
    └── mock-delta-data.ts            # NEW: Delta analysis fixtures
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use .js extension for ES module imports
// Example (architect-prompt.ts lines 15-16):
import type { Backlog } from '../../core/models.js';
import { BacklogSchema } from '../../core/models.js';

// CRITICAL: Always use Zod schemas, not TypeScript types for responseFormat
// Correct:
responseFormat: DeltaAnalysisSchema;

// Incorrect (this is a type, not a runtime schema):
responseFormat: DeltaAnalysis;

// CRITICAL: Enable reflection for complex structured output
enableReflection: true;

// PATTERN: Use `as const` on prompt string constants
export const DELTA_ANALYSIS_PROMPT = `...` as const;

// GOTCHA: DeltaAnalysis.changes array can be empty (no changes)
// But patchInstructions must be non-empty (min(1) validation)

// GOTCHA: RequirementChange.type must be exact enum values
// Valid: 'added', 'modified', 'removed'
// Invalid: 'changed', 'updated', 'deleted'

// PATTERN: Test files use describe/it from vitest (global scope)
// No import needed for describe, expect, it

// GOTCHA: prompts.ts uses template literal with ${} placeholders
// These are bash-style variables, NOT JavaScript template literals
```

## Implementation Blueprint

### Data Models and Structure

The schemas already exist in `src/core/models.ts`:

```typescript
// RequirementChange Interface (lines 1361-1401)
interface RequirementChange {
  readonly itemId: string; // Task/milestone/subtask ID
  readonly type: 'added' | 'modified' | 'removed';
  readonly description: string; // What changed
  readonly impact: string; // Implementation impact
}

// DeltaAnalysis Interface (lines 1462-1496)
interface DeltaAnalysis {
  readonly changes: RequirementChange[]; // All detected changes
  readonly patchInstructions: string; // Natural language instructions
  readonly taskIds: string[]; // Tasks needing re-execution
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD DELTA_ANALYSIS_PROMPT to src/agents/prompts.ts
  - IMPLEMENT: Export const DELTA_ANALYSIS_PROMPT after DELTA_PRD_PROMPT (after line 734)
  - FOLLOW pattern: DELTA_PRD_PROMPT (lines 696-734) for style and structure
  - NAMING: DELTA_ANALYSIS_PROMPT (uppercase snake_case, matches existing)
  - CONTENT: See "DELTA_ANALYSIS_PROMPT Content" section below
  - PLACEMENT: Before the PROMPTS object definition (line 865)

Task 2: UPDATE PROMPTS object in src/agents/prompts.ts
  - ADD: DELTA_ANALYSIS: DELTA_ANALYSIS_PROMPT to PROMPTS object (line 865)
  - PRESERVE: All existing PROMPTS entries
  - PATTERN: Follow existing key naming (UPPERCASE)

Task 3: CREATE src/agents/prompts/delta-analysis-prompt.ts
  - IMPLEMENT: createDeltaAnalysisPrompt() function
  - FOLLOW pattern: src/agents/prompts/architect-prompt.ts (simple structure)
  - OR FOLLOW: src/agents/prompts/prp-blueprint-prompt.ts (complex with helper)
  - NAMING: camelCase function name, kebab-case file name
  - IMPORTS: createPrompt, Prompt from 'groundswell'; DeltaAnalysis types from models.js
  - PLACEMENT: New file in src/agents/prompts/ directory

Task 4: IMPLEMENT constructUserPrompt helper function
  - IMPLEMENT: Build markdown with old PRD, new PRD, completed tasks sections
  - FOLLOW pattern: prp-blueprint-prompt.ts constructUserPrompt (lines 142-201)
  - NAMING: Helper function is private (not exported)
  - LOGIC: Conditionally include completed tasks section if array non-empty
  - PLACEMENT: Inside delta-analysis-prompt.ts before export

Task 5: CREATE test fixture at tests/fixtures/mock-delta-data.ts
  - IMPLEMENT: Export mockOldPRD, mockNewPRD, mockCompletedTaskIds
  - FOLLOW pattern: tests/fixtures/mock-backlog.ts structure
  - NAMING: camelCase exports with `mock` prefix
  - CONTENT: Realistic PRD snippets showing added/modified/removed requirements
  - PLACEMENT: New file in tests/fixtures/ directory

Task 6: CREATE tests/unit/agents/prompts.test.ts additions
  - IMPLEMENT: Test for DELTA_ANALYSIS_PROMPT export and content validation
  - FOLLOW pattern: Lines 1-24 (TASK_BREAKDOWN_PROMPT tests)
  - VERIFY: prompt is string, contains expected headers, has reasonable length
  - NAMING: describe('agents/prompts', () => { describe('prompt exports', ...) })
  - PLACEMENT: Add to existing tests/unit/agents/prompts.test.ts

Task 7: CREATE tests/unit/agents/prompts/delta-analysis-prompt.test.ts
  - IMPLEMENT: Unit tests for createDeltaAnalysisPrompt function
  - FOLLOW pattern: tests/unit/agents/prompts/prp-blueprint-prompt.test.ts
  - VERIFY: Prompt structure, content inclusion, enableReflection true, responseFormat set
  - MOCK: No external mocking needed (prompt construction is pure)
  - PLACEMENT: New file in tests/unit/agents/prompts/ directory
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: DELTA_ANALYSIS_PROMPT constant (Task 1)
// Location: src/agents/prompts.ts after line 734

/**
 * Delta Analysis Prompt
 *
 * @remarks
 * The "Analyze PRD Changes" prompt used for detecting differences between
 * PRD versions and generating structured delta analysis for task patching.
 *
 * Source: PRD.md section 6.4
 */
export const DELTA_ANALYSIS_PROMPT = `
# PRD Delta Analysis

You are a Requirements Change Analyst. Your mission is to compare two versions of a Product Requirements Document and generate a structured delta analysis.

## Inputs

You will receive:
1. **Previous PRD**: The original PRD content
2. **Current PRD**: The modified PRD content
3. **Completed Tasks**: List of task IDs already completed (to preserve work)

## Your Analysis Process

1. **Parse PRD Structure**: Identify all phases, milestones, tasks, and subtasks
2. **Detect Changes**: Compare each work item between versions
3. **Categorize Changes**: Mark as 'added', 'modified', or 'removed'
4. **Assess Impact**: Determine which tasks need re-execution
5. **Preserve Completed Work**: Do NOT flag completed tasks unless critically affected

## Change Categories

### Semantic Changes (Flag These)
- New requirements added
- Requirement scope expanded/contracted
- Validation constraints modified
- Dependencies changed

### Syntactic Changes (Ignore These)
- Spelling/grammar corrections
- Formatting changes
- Reordering within requirements
- Clarification text without semantic change

## Output Format

You MUST output valid JSON matching this schema:

\`\`\`typescript
{
  "changes": [
    {
      "itemId": "P1.M2.T3.S1",
      "type": "added" | "modified" | "removed",
      "description": "What changed (human-readable)",
      "impact": "Implementation impact explanation"
    }
  ],
  "patchInstructions": "Natural language guide for task patching",
  "taskIds": ["P1.M2.T3.S1", "P1.M2.T3.S2"]
}
\`\`\`

## Critical Rules

1. **Be Conservative**: When in doubt, flag as modified (better to re-execute than miss changes)
2. **Preserve Completed Work**: Only flag completed tasks for re-execution if truly necessary
3. **Cascade Changes**: If a milestone changes, all its descendant tasks are affected
4. **Clear Descriptions**: Explain WHAT changed and WHY it matters

## Few-Shot Examples

### Example 1: Added Requirement
**Old PRD:** \`## P1.M2.T3: User Authentication\nImplement login.\`
**New PRD:** \`## P1.M2.T3: User Authentication\nImplement login with OAuth2 support.\`

**Output:**
\`\`\`json
{
  "changes": [{
    "itemId": "P1.M2.T3",
    "type": "modified",
    "description": "Added OAuth2 authentication requirement",
    "impact": "Must expand authentication system to support OAuth2 providers"
  }],
  "patchInstructions": "Re-execute P1.M2.T3 and subtasks for OAuth2 integration",
  "taskIds": ["P1.M2.T3", "P1.M2.T3.S1", "P1.M2.T3.S2"]
}
\`\`\`

### Example 2: Cosmetic Change (Ignore)
**Old PRD:** \`## P1.M1.T1: Initialize project\`
**New PRD:** \`## P1.M1.T1: Initialize project.\`

**Output:**
\`\`\`json
{
  "changes": [],
  "patchInstructions": "No semantic changes detected. All completed work preserved.",
  "taskIds": []
}
\`\`\`

### Example 3: Removed Requirement
**Old PRD:** \`## P2.M3.T2: Email Notifications\nSend emails.\`
**New PRD:** (requirement removed)

**Output:**
\`\`\`json
{
  "changes": [{
    "itemId": "P2.M3.T2",
    "type": "removed",
    "description": "Email notification requirement removed",
    "impact": "Mark P2.M3.T2 and subtasks as Obsolete. No implementation needed."
  }],
  "patchInstructions": "Mark P2.M3.T2 as Obsolete. Do not execute.",
  "taskIds": ["P2.M3.T2"]
}
\`\`\`

Analyze the provided PRDs and output the delta analysis JSON.
` as const;

// Pattern 2: createDeltaAnalysisPrompt function (Task 3)
// Location: src/agents/prompts/delta-analysis-prompt.ts

import { createPrompt, type Prompt } from 'groundswell';
import type { DeltaAnalysis } from '../../core/models.js';
import { DeltaAnalysisSchema } from '../../core/models.js';
import { DELTA_ANALYSIS_PROMPT } from '../prompts.js';

/**
 * Construct the user prompt with PRD comparison data
 *
 * @param oldPRD - The previous PRD content
 * @param newPRD - The current PRD content
 * @param completedTaskIds - Optional list of completed task IDs
 * @returns Complete user prompt string with all comparison data
 */
function constructUserPrompt(
  oldPRD: string,
  newPRD: string,
  completedTaskIds?: string[]
): string {
  // Build completed tasks section
  const completedTasksSection =
    completedTaskIds !== undefined && completedTaskIds.length > 0
      ? `

## Completed Tasks

The following tasks have been completed and should be preserved unless critically affected:
${completedTaskIds.map(id => `- ${id}`).join('\n')}
`
      : '';

  // Construct the complete user prompt
  return `
## Previous PRD

${oldPRD}

## Current PRD

${newPRD}${completedTasksSection}

---

${DELTA_ANALYSIS_PROMPT}
`;
}

/**
 * Create a Delta Analysis prompt with structured DeltaAnalysis output
 *
 * @remarks
 * Returns a Groundswell Prompt configured with:
 * - user: PRD comparison context (old vs new)
 * - system: DELTA_ANALYSIS_PROMPT (Requirements Change Analyst)
 * - responseFormat: DeltaAnalysisSchema (type-safe JSON output)
 * - enableReflection: true (for complex delta analysis reliability)
 *
 * @param oldPRD - The previous PRD markdown content
 * @param newPRD - The current PRD markdown content
 * @param completedTaskIds - Optional list of completed task IDs to preserve
 * @returns Groundswell Prompt object configured for Delta Analysis
 */
export function createDeltaAnalysisPrompt(
  oldPRD: string,
  newPRD: string,
  completedTaskIds?: string[]
): Prompt<DeltaAnalysis> {
  return createPrompt({
    user: constructUserPrompt(oldPRD, newPRD, completedTaskIds),
    system: DELTA_ANALYSIS_PROMPT,
    responseFormat: DeltaAnalysisSchema,
    enableReflection: true,
  });
}

// Pattern 3: Test fixture (Task 5)
// Location: tests/fixtures/mock-delta-data.ts

export const mockOldPRD = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure.

## P1.M2.T1: Define Models
Create data models.
`;

export const mockNewPRD = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure with TypeScript.

## P1.M2.T1: Define Models
Create data models with Zod validation.

# Phase 2: Core System

## P2.M1.T1: Implement Agent System
Build the agent framework.
`;

export const mockCompletedTaskIds = ['P1.M1.T1', 'P1.M2.T1'];

// Pattern 4: Unit test (Task 7)
// Location: tests/unit/agents/prompts/delta-analysis-prompt.test.ts

import { describe, expect, it } from 'vitest';
import { createDeltaAnalysisPrompt } from '../../../../src/agents/prompts/delta-analysis-prompt.js';
import {
  mockOldPRD,
  mockNewPRD,
  mockCompletedTaskIds,
} from '../../../fixtures/mock-delta-data.js';

describe('agents/prompts/delta-analysis-prompt', () => {
  describe('createDeltaAnalysisPrompt', () => {
    it('should return a Prompt object with correct structure', () => {
      const prompt = createDeltaAnalysisPrompt(
        mockOldPRD,
        mockNewPRD,
        mockCompletedTaskIds
      );

      expect(prompt).toBeDefined();
      expect(typeof prompt.user).toBe('string');
      expect(prompt.systemOverride).toBeDefined();
      expect(prompt.enableReflection).toBe(true);
    });

    it('should include old PRD in user prompt', () => {
      const prompt = createDeltaAnalysisPrompt(mockOldPRD, mockNewPRD);
      expect(prompt.user).toContain('## Previous PRD');
      expect(prompt.user).toContain(mockOldPRD);
    });

    it('should include new PRD in user prompt', () => {
      const prompt = createDeltaAnalysisPrompt(mockOldPRD, mockNewPRD);
      expect(prompt.user).toContain('## Current PRD');
      expect(prompt.user).toContain(mockNewPRD);
    });

    it('should include completed tasks when provided', () => {
      const prompt = createDeltaAnalysisPrompt(
        mockOldPRD,
        mockNewPRD,
        mockCompletedTaskIds
      );
      expect(prompt.user).toContain('## Completed Tasks');
      expect(prompt.user).toContain('P1.M1.T1');
      expect(prompt.user).toContain('P1.M2.T1');
    });

    it('should omit completed tasks section when not provided', () => {
      const prompt = createDeltaAnalysisPrompt(mockOldPRD, mockNewPRD);
      expect(prompt.user).not.toContain('## Completed Tasks');
    });

    it('should include system prompt content', () => {
      const prompt = createDeltaAnalysisPrompt(mockOldPRD, mockNewPRD);
      expect(prompt.systemOverride).toContain('PRD Delta Analysis');
      expect(prompt.systemOverride).toContain('Requirements Change Analyst');
    });

    it('should have responseFormat configured', () => {
      const prompt = createDeltaAnalysisPrompt(mockOldPRD, mockNewPRD);
      expect(prompt.responseFormat).toBeDefined();
    });
  });
});
```

### Integration Points

```yaml
PROMPTS_TS:
  - add to: src/agents/prompts.ts
  - after: DELTA_PRD_PROMPT (line 734)
  - pattern: 'export const DELTA_ANALYSIS_PROMPT = `...` as const;'
  - then: 'Add to PROMPTS object: DELTA_ANALYSIS: DELTA_ANALYSIS_PROMPT'

MODELS_IMPORT:
  - from: src/core/models.js
  - imports: "import type { DeltaAnalysis } from '../../core/models.js';"
  - imports: "import { DeltaAnalysisSchema } from '../../core/models.js';"

PROMPTS_IMPORT:
  - from: src/agents/prompts.js
  - imports: "import { DELTA_ANALYSIS_PROMPT } from '../prompts.js';"

GROUNDWELL_IMPORT:
  - from: 'groundswell'
  - imports: "import { createPrompt, type Prompt } from 'groundswell';"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- src/agents/prompts/delta-analysis-prompt.ts
npm run lint -- src/agents/prompts.ts
npm run format -- src/agents/prompts/delta-analysis-prompt.ts
npm run format -- src/agents/prompts.ts

# Type checking
npm run check -- --noEmit

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test prompt exports in prompts.ts
npm test -- tests/unit/agents/prompts.test.ts

# Test delta analysis prompt generator
npm test -- tests/unit/agents/prompts/delta-analysis-prompt.test.ts

# Run all prompt tests
npm test -- tests/unit/agents/

# Coverage validation
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (Schema Validation)

```bash
# Manual schema validation test
node -e "
import { createDeltaAnalysisPrompt } from './src/agents/prompts/delta-analysis-prompt.js';
import { DeltaAnalysisSchema } from './src/core/models.js';

const prompt = createDeltaAnalysisPrompt('old', 'new', ['P1.M1.T1']);
console.log('Prompt structure:', JSON.stringify(prompt, null, 2));
console.log('Schema validation:', DeltaAnalysisSchema.safeParse(prompt.responseFormat).success);
"

# Expected: Prompt object has all required fields, schema is valid
```

### Level 4: Domain-Specific Validation

```bash
# Verify prompt content includes all expected sections
node -e "
import { createDeltaAnalysisPrompt } from './src/agents/prompts/delta-analysis-prompt.js';

const prompt = createDeltaAnalysisPrompt('# Old PRD', '# New PRD', ['P1.T1']);
const user = prompt.user;

const checks = {
  hasOldPRD: user.includes('## Previous PRD'),
  hasNewPRD: user.includes('## Current PRD'),
  hasCompletedTasks: user.includes('## Completed Tasks'),
  hasSystemPrompt: user.includes('PRD Delta Analysis'),
};

console.log('Content validation:', checks);
console.log('All checks passed:', Object.values(checks).every(v => v));
"

# Expected: All content checks pass
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] `DELTA_ANALYSIS_PROMPT` constant exported from `src/agents/prompts.ts`
- [ ] `createDeltaAnalysisPrompt()` function exported from `src/agents/prompts/delta-analysis-prompt.ts`
- [ ] Prompt includes old PRD section when oldPRD provided
- [ ] Prompt includes new PRD section when newPRD provided
- [ ] Prompt includes completed tasks section when completedTaskIds provided
- [ ] Prompt includes system prompt (DELTA_ANALYSIS_PROMPT)
- [ ] Prompt has `enableReflection: true`
- [ ] Prompt has `responseFormat` set to `DeltaAnalysisSchema`

### Code Quality Validation

- [ ] Follows existing prompt generator patterns (architect, prp-blueprint)
- [ ] File placement matches desired codebase tree
- [ ] Uses `.js` extension for ES module imports
- [ ] Uses `as const` on prompt string constant
- [ ] Helper function is private (not exported)
- [ ] JSDoc comments match existing style

### Documentation & Deployment

- [ ] JSDoc comments on all public exports
- [ ] Comments explain non-obvious logic (completed tasks conditional)
- [ ] Example usage in JSDoc

---

## Anti-Patterns to Avoid

- ❌ Don't create new patterns - follow architect-prompt.ts and prp-blueprint-prompt.ts
- ❌ Don't skip the `constructUserPrompt` helper function - keeps code organized
- ❌ Don't hardcode the system prompt content - use `DELTA_ANALYSIS_PROMPT` constant
- ❌ Don't forget `.js` extension on imports - will cause runtime errors
- ❌ Don't use `DeltaAnalysis` type as `responseFormat` - must use `DeltaAnalysisSchema`
- ❌ Don't set `enableReflection: false` - needed for reliable JSON output
- ❌ Don't include completed tasks section when array is empty - adds noise
- ❌ Don't modify existing prompts or tests - only add new code
