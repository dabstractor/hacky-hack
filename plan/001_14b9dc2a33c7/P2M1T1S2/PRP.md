# Product Requirement Prompt: Import System Prompts from PROMPTS.md

---

## Goal

**Feature Goal**: Create a centralized prompts module that exports all system prompts from PROMPTS.md as TypeScript string constants, enabling type-safe access and integration with the agent factory.

**Deliverable**: `src/agents/prompts.ts` module with five exported string constants (TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, DELTA_PRD_PROMPT, BUG_HUNT_PROMPT) containing the exact content from PROMPTS.md.

**Success Definition**:

- All five prompts are exported as named constants from `src/agents/prompts.ts`
- Prompt content matches PROMPTS.md exactly (byte-for-byte)
- Prompts can be imported and used by `agent-factory.ts`
- TypeScript compilation succeeds with zero errors
- 100% test coverage for prompt exports and validation
- Existing agent factory tests continue to pass

## User Persona

**Target User**: PRP Pipeline system (internal developer-facing API)

**Use Case**: The agent factory needs to access system prompts for different agent personas and tasks. Currently, prompts are hardcoded placeholders in `agent-factory.ts`. This module provides the actual prompts from PROMPTS.md as importable constants.

**User Journey**:

1. Developer imports prompts from `src/agents/prompts.ts`
2. Agent factory uses `TASK_BREAKDOWN_PROMPT` for architect agent
3. PRP creation workflow uses `PRP_BLUEPRINT_PROMPT` and `PRP_BUILDER_PROMPT`
4. Delta analysis uses `DELTA_PRD_PROMPT`
5. QA bug hunting uses `BUG_HUNT_PROMPT`

**Pain Points Addressed**:

- Eliminates hardcoded placeholder prompts in agent-factory.ts
- Centralizes prompt management in a single module
- Provides type-safe access to all system prompts
- Ensures prompt content matches source of truth (PROMPTS.md)

## Why

- **Business value**: Enables the PRP Pipeline to use actual system prompts instead of placeholders, unlocking the full agent functionality
- **Integration**: Builds on existing `src/agents/agent-factory.ts` and provides the `system` prompt content for agent configurations
- **Problems solved**: Decouples prompt content from agent factory logic, provides single source of truth for prompts, enables future prompt versioning and updates

## What

Create a prompts module that exports the five key system prompts from PROMPTS.md as TypeScript string constants.

### Technical Requirements

1. Create `src/agents/prompts.ts` with five exported constants
2. Extract exact prompt content from PROMPTS.md sections:
   - `TASK_BREAKDOWN_PROMPT`: Lines 54-169 (LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER)
   - `PRP_BLUEPRINT_PROMPT`: Lines 189-638 (Create PRP for Work Item)
   - `PRP_BUILDER_PROMPT`: Lines 641-713 (Execute BASE PRP)
   - `DELTA_PRD_PROMPT`: Lines 793-833 (Generate Delta PRD from Changes)
   - `BUG_HUNT_PROMPT`: Lines 1059-1174 (Creative Bug Finding - End-to-End PRD Validation)
3. Preserve exact formatting including line breaks, backticks, markdown
4. Use template literals with `as const` assertion for type safety
5. Export named constants following UPPER_SNAKE_CASE convention
6. Add JSDoc documentation for each prompt constant

### Success Criteria

- [ ] `src/agents/prompts.ts` exists with all five exports
- [ ] `TASK_BREAKDOWN_PROMPT` contains exact content from PROMPTS.md lines 54-169
- [ ] `PRP_BLUEPRINT_PROMPT` contains exact content from PROMPTS.md lines 189-638
- [ ] `PRP_BUILDER_PROMPT` contains exact content from PROMPTS.md lines 641-713
- [ ] `DELTA_PRD_PROMPT` contains exact content from PROMPTS.md lines 793-833
- [ ] `BUG_HUNT_PROMPT` contains exact content from PROMPTS.md lines 1059-1174
- [ ] All constants use template literals with `as const`
- [ ] All exports have JSDoc documentation
- [ ] TypeScript compilation succeeds
- [ ] 100% test coverage achieved
- [ ] Existing agent factory tests pass

## All Needed Context

### Context Completeness Check

\_Pass the "No Prior Knowledge" test: This PRP provides everything needed including:

- Exact line numbers from PROMPTS.md for each prompt
- File structure and import patterns
- TypeScript patterns for string constants
- Testing patterns and validation commands
- Integration points with existing code\_

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- url: https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
  why: Understanding template literal types and const assertions
  critical: Use 'as const' on template literals to preserve exact string types

- url: https://www.typescriptlang.org/docs/handbook/2/literal-types.html#const-assertions
  why: Const assertions for maximum type safety on string constants
  critical: Without 'as const', string literals widen to 'string' type

- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
  why: Template literal syntax for multi-line strings
  critical: Backticks preserve newlines and embedded expressions

- file: /home/dustin/projects/hacky-hack/PROMPTS.md
  why: Source file containing all five system prompts to extract
  section: Lines 54-169 (TASK_BREAKDOWN_PROMPT), 189-638 (PRP_BLUEPRINT_PROMPT), 641-713 (PRP_BUILDER_PROMPT), 793-833 (DELTA_PRD_PROMPT), 1059-1174 (BUG_HUNT_PROMPT)
  critical: Must preserve EXACT formatting including all whitespace, backticks, markdown syntax

- file: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
  why: Target file that will consume these prompts
  pattern: JSDoc documentation, ESM imports, readonly interface properties
  gotcha: Line 115-117 shows placeholder system prompt to replace

- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Reference pattern for constants with const assertions
  pattern: Objects with `as const` for literal type preservation
  gotcha: Always use `as const` for objects that should have literal types

- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Test patterns including describe blocks, beforeEach/afterEach
  pattern: Nested describe for logical grouping, descriptive test names
  gotcha: Always clean up in afterEach to prevent test pollution
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── coverage/                    # Test coverage reports
├── dist/                        # Compiled JavaScript output
├── package.json                 # Project config with npm scripts
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/        # Architecture documentation
│       ├── P2M1T1S1/            # Completed: Base agent configuration
│       ├── P2M1T1S2/            # THIS WORK ITEM
│       └── tasks.json           # Task hierarchy state
├── PRD.md                       # Product requirements document
├── PROMPTS.md                   # Source file containing system prompts (43,499 bytes)
├── src/
│   ├── agents/
│   │   └── agent-factory.ts     # Existing: AgentPersona type, AgentConfig interface, createBaseConfig()
│   ├── config/                  # Environment configuration
│   ├── core/                    # Domain models
│   └── ...
└── tests/
    └── unit/
        └── agents/
            └── agent-factory.test.ts  # Existing tests for agent factory
```

### Desired Codebase Tree (After Implementation)

```bash
src/
└── agents/
    ├── agent-factory.ts         # EXISTING - Will import from prompts.ts
    └── prompts.ts               # NEW - TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, DELTA_PRD_PROMPT, BUG_HUNT_PROMPT

tests/
└── unit/
    └── agents/
        ├── agent-factory.test.ts  # EXISTING - Agent factory tests
        └── prompts.test.ts         # NEW - Prompt constant tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Template literals preserve EXACT formatting
// Using backticks with multi-line content preserves all newlines
// Do NOT use string concatenation or array joining - it alters formatting

// CORRECT:
export const TASK_BREAKDOWN_PROMPT = `
# LEAD TECHNICAL ARCHITECT
> **ROLE**: Act as a Lead Technical Architect
` as const;

// INCORRECT - alters formatting:
export const TASK_BREAKDOWN_PROMPT =
  '# LEAD TECHNICAL ARCHITECT\n' +
  '> **ROLE**: Act as a Lead Technical Architect\n';

// CRITICAL: Use 'as const' for literal type preservation
// Without 'as const', the type widens to 'string'
// With 'as const', the type is the exact string literal

// CORRECT:
export const PRP_BLUEPRINT_PROMPT = `...long content...` as const;

// GOTCHA: Nested backticks in template literals must be escaped
// PROMPTS.md contains markdown code blocks with backticks
// When embedding in template literals, use backslash escape

// Example of escaping nested backticks:
const example = `
Here is a code block:

\`\`\`typescript
const x = 'value';
\`\`\`

And inline \`code\` here too.
` as const;

// GOTCHA: The prompts are VERY LONG (43KB total file)
// TASK_BREAKDOWN_PROMPT: ~115 lines
// PRP_BLUEPRINT_PROMPT: ~450 lines (largest)
// PRP_BUILDER_PROMPT: ~70 lines
// DELTA_PRD_PROMPT: ~40 lines
// BUG_HUNT_PROMPT: ~115 lines

// GOTCHA: ESM imports require .js extensions
// Even though source is .ts, imports use .js
import { TASK_BREAKDOWN_PROMPT } from './agents/prompts.js';

// GOTCHA: The PRP_BLUEPRINT_PROMPT contains embedded PRP-README and PRP-TEMPLATE sections
// These are denoted by <PRP-README>$PRP_README</PRP-README> tags
// Do NOT interpolate these - they are literal string placeholders
```

## Implementation Blueprint

### Data Models and Structure

This module exports string constants - no complex data models needed.

```typescript
// Each prompt is a readonly string constant with const assertion
export const TASK_BREAKDOWN_PROMPT: string = `...` as const;
export const PRP_BLUEPRINT_PROMPT: string = `...` as const;
export const PRP_BUILDER_PROMPT: string = `...` as const;
export const DELTA_PRD_PROMPT: string = `...` as const;
export const BUG_HUNT_PROMPT: string = `...` as const;

// Type for all available prompt keys
export type PromptKey =
  | 'TASK_BREAKDOWN'
  | 'PRP_BLUEPRINT'
  | 'PRP_BUILDER'
  | 'DELTA_PRD'
  | 'BUG_HUNT';

// Type-safe prompt lookup object (optional convenience export)
export const PROMPTS = {
  TASK_BREAKDOWN: TASK_BREAKDOWN_PROMPT,
  PRP_BLUEPRINT: PRP_BLUEPRINT_PROMPT,
  PRP_BUILDER: PRP_BUILDER_PROMPT,
  DELTA_PRD: DELTA_PRD_PROMPT,
  BUG_HUNT: BUG_HUNT_PROMPT,
} as const;
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: READ PROMPTS.md to extract exact prompt content
  - READ: /home/dustin/projects/hacky-hack/PROMPTS.md
  - EXTRACT: Lines 54-169 for TASK_BREAKDOWN_PROMPT
  - EXTRACT: Lines 189-638 for PRP_BLUEPRINT_PROMPT
  - EXTRACT: Lines 641-713 for PRP_BUILDER_PROMPT
  - EXTRACT: Lines 793-833 for DELTA_PRD_PROMPT
  - EXTRACT: Lines 1059-1174 for BUG_HUNT_PROMPT
  - VERIFY: All formatting is preserved (newlines, backticks, markdown)
  - NOTE: The PRP_BLUEPRINT_PROMPT contains <PRP-README> and <PRP-TEMPLATE> tags - keep as-is

Task 2: CREATE src/agents/prompts.ts
  - IMPLEMENT: Five exported const declarations with template literals
  - USE: Template literals (backticks) for multi-line content
  - ADD: 'as const' assertion to each prompt for type safety
  - PRESERVE: Exact formatting from PROMPTS.md including all whitespace
  - ESCAPE: Any nested backticks in markdown code blocks
  - ADD: JSDoc comments for each export (follow pattern from agent-factory.ts)
  - NAMING: UPPER_SNAKE_CASE with _PROMPT suffix
  - PLACEMENT: New src/agents/prompts.ts file
  - FOLLOW: Module-level JSDoc with @module, @remarks tags

Task 3: UPDATE src/agents/agent-factory.ts (Preview integration, no changes yet)
  - NOTE: This task is for understanding only - actual integration is P2.M1.T1.S3
  - IDENTIFY: Line 115-117 where placeholder system prompt is used
  - PLAN: Future import will be: import { TASK_BREAKDOWN_PROMPT } from './prompts.js'
  - PLAN: Future usage will be: const system = TASK_BREAKDOWN_PROMPT;
  - DO NOT modify agent-factory.ts in this subtask

Task 4: CREATE tests/unit/agents/prompts.test.ts
  - IMPLEMENT: describe block for 'agents/prompts'
  - TEST: All five constants are exported and are strings
  - TEST: Each prompt starts with expected text (validation check)
  - TEST: TASK_BREAKDOWN_PROMPT contains "LEAD TECHNICAL ARCHITECT"
  - TEST: PRP_BLUEPRINT_PROMPT contains "Create PRP for Work Item"
  - TEST: PRP_BUILDER_PROMPT contains "Execute BASE PRP"
  - TEST: DELTA_PRD_PROMPT contains "Generate Delta PRD from Changes"
  - TEST: BUG_HUNT_PROMPT contains "Creative Bug Finding"
  - TEST: Prompts have expected minimum length (sanity check)
  - FOLLOW: AAA pattern from environment.test.ts
  - NAMING: test file uses *.test.ts suffix
  - COVERAGE: 100% code coverage (verify all exports tested)
  - PLACEMENT: tests/unit/agents/prompts.test.ts

Task 5: VALIDATE TypeScript compilation
  - RUN: npm run build
  - VERIFY: Zero compilation errors
  - VERIFY: All constants are properly typed as string literals

Task 6: VALIDATE Test execution
  - RUN: npm test -- tests/unit/agents/prompts.test.ts
  - VERIFY: All tests pass
  - RUN: npm run test:coverage
  - VERIFY: 100% coverage for src/agents/prompts.ts
  - VERIFY: Existing agent-factory tests still pass
```

### Implementation Patterns & Key Details

````typescript
/**
 * Prompts module for system prompts used by PRP Pipeline agents
 *
 * @module agents/prompts
 *
 * @remarks
 * Exports all system prompts from PROMPTS.md as TypeScript string constants.
 * These prompts are used by the agent factory to configure different agent personas
 * and task-specific workflows.
 *
 * All prompts preserve exact formatting from the source PROMPTS.md file including
 * markdown syntax, code blocks, and placeholder variables.
 *
 * @example
 * ```ts
 * import { TASK_BREAKDOWN_PROMPT } from './agents/prompts.js';
 *
 * const systemPrompt = TASK_BREAKDOWN_PROMPT;
 * // Returns the full LEAD TECHNICAL ARCHITECT system prompt
 * ```
 */

// PATTERN: Template literal with const assertion for type safety
// CRITICAL: Use backticks to preserve exact formatting
// CRITICAL: Add 'as const' to prevent type widening to 'string'

/**
 * Task Breakdown System Prompt for Architect Agent
 *
 * @remarks
 * The LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER prompt used for
 * analyzing PRDs and creating task breakdowns. This is the system prompt
 * for the architect persona.
 *
 * Source: PROMPTS.md lines 54-169
 */
export const TASK_BREAKDOWN_PROMPT = `
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy: \`Phase\` > \`Milestone\` > \`Task\` > \`Subtask\`.

---

## HIERARCHY DEFINITIONS

- **PHASE:** Project-scope goals (e.g., MVP, V1.0). _Weeks to months._
- **MILESTONE:** Key objectives within a Phase. _1 to 12 weeks._
- **TASK:** Complete features within a Milestone. _Days to weeks._
- **SUBTASK:** Atomic implementation steps. **0.5, 1, or 2 Story Points (SP).** (Max 2 SP, do not break subtasks down further than 2 SP unless required).

---

## CRITICAL CONSTRAINTS & STANDARD OF WORK (SOW)

### 1. RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)

- **VALIDATE BEFORE BREAKING DOWN:** You cannot plan what you do not understand.
- **SPAWN SUBAGENTS:** Use your tools to spawn agents to research the codebase and external documentation _before_ defining the hierarchy.
- **REALITY CHECK:** Verify that the PRD's requests match the current codebase state (e.g., don't plan a React hook if the project is vanilla JS).
- **PERSISTENCE:** You must store architectural findings in \`$SESSION_DIR/architecture/\` so the downstream PRP (Product Requirement Prompt) agents have access to them.

[... continue with full content from PROMPTS.md lines 54-169 ...]

````

````

# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy: \`Phase\` > \`Milestone\` > \`Task\` > \`Subtask\`.

---

## HIERARCHY DEFINITIONS

- **PHASE:** Project-scope goals (e.g., MVP, V1.0). _Weeks to months._
- **MILESTONE:** Key objectives within a Phase. _1 to 12 weeks._
- **TASK:** Complete features within a Milestone. _Days to weeks._
- **SUBTASK:** Atomic implementation steps. **0.5, 1, or 2 Story Points (SP).** (Max 2 SP, do not break subtasks down further than 2 SP unless required).

---

## CRITICAL CONSTRAINTS & STANDARD OF WORK (SOW)

### 1. RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)

- **VALIDATE BEFORE BREAKING DOWN:** You cannot plan what you do not understand.
- **SPAWN SUBAGENTS:** Use your tools to spawn agents to research the codebase and external documentation _before_ defining the hierarchy.
- **REALITY CHECK:** Verify that the PRD's requests match the current codebase state (e.g., don't plan a React hook if the project is vanilla JS).
- **PERSISTENCE:** You must store architectural findings in \`$SESSION_DIR/architecture/\` so the downstream PRP (Product Requirement Prompt) agents have access to them.
```
````

` as const;

/\*\*

- PRP Creation Prompt (The Researcher)
-
- @remarks
- The "Create PRP for Work Item" prompt used for generating Product Requirement Prompts.
- This prompt guides the research and context curation process for PRP generation.
-
- Source: PROMPTS.md lines 189-638
  \*/
  export const PRP_BLUEPRINT_PROMPT = `

# Create PRP for Work Item

## Work Item Information

**ITEM TITLE**: <item_title>
**ITEM DESCRIPTION**: <item_description>

You are creating a PRP (Product Requirement Prompt) for this specific work item.

## PRP Creation Mission

Create a comprehensive PRP that enables **one-pass implementation success** through systematic research and context curation.

**Critical Understanding**:
You must start by reading and understanding the prp concepts in the attached readme
Be aware that the executing AI agent only receives:

- The PRP content you create
- Its training data knowledge
- Access to codebase files (but needs guidance on which ones)

**Therefore**: Your research and context curation directly determines implementation success. Incomplete context = implementation failure.

[... continue with full content from PROMPTS.md lines 189-638 ...]
` as const;

/\*\*

- PRP Execution Prompt (The Builder)
-
- @remarks
- The "Execute BASE PRP" prompt used for implementing code from PRP specifications.
- This prompt guides the agent through reading PRP, planning, implementing, and validating.
-
- Source: PROMPTS.md lines 641-713
  \*/
  export const PRP_BUILDER_PROMPT = `

# Execute BASE PRP

## PRP File: (path provided below)

## Mission: One-Pass Implementation Success

PRPs enable working code on the first attempt through:

- **Context Completeness**: Everything needed, nothing guessed
- **Progressive Validation**: 4-level gates catch errors early
- **Pattern Consistency**: Follow existing codebase approaches
- Read the attached README to understand PRP concepts

**Your Goal**: Transform the PRP into working code that passes all validation gates.

## Execution Process

1. **Load PRP (CRITICAL FIRST STEP)**
   - **ACTION**: Use the \`Read\` tool to read the PRP file at the path provided in the instructions below.
   - You MUST read this file before doing anything else. It contains your instructions.
   - Absorb all context, patterns, requirements and gather codebase intelligence
   - Use the provided documentation references and file patterns, consume the right documentation before the appropriate todo/task
   - Trust the PRP's context and guidance - it's designed for one-pass success
   - If needed do additional codebase exploration and research as needed

[... continue with full content from PROMPTS.md lines 641-713 ...]

<PRP-README>
$PRP_README
</PRP-README>
```
` as const;

/\*\*

- Delta PRD Generation Prompt
-
- @remarks
- The "Generate Delta PRD from Changes" prompt used for analyzing PRD changes
- and creating focused delta PRDs for incremental updates.
-
- Source: PROMPTS.md lines 793-833
  \*/
  export const DELTA_PRD_PROMPT = `

# Generate Delta PRD from Changes

You are analyzing changes between two versions of a PRD to create a focused delta PRD.

## Previous PRD (Completed Session):

$(cat "$PREV_SESSION_DIR/prd_snapshot.md")

## Current PRD:

$(cat "$PRD_FILE")

## Previous Session's Completed Tasks:

$(cat "$PREV_SESSION_DIR/tasks.json")

## Previous Session's Architecture Research:

Check $PREV_SESSION_DIR/architecture/ for existing research that may still apply.

## Instructions:

1. **DIFF ANALYSIS**: Identify what changed between the two PRD versions
2. **SCOPE DELTA**: Create a new PRD focusing ONLY on:
   - New features/requirements added
   - Modified requirements (note what changed from original)
   - Removed requirements (note for awareness, but don't create tasks to implement)
3. **REFERENCE COMPLETED WORK**: The previous session implemented the original PRD.
   - Reference existing implementations rather than re-implementing
   - If a modification affects completed work, note which files/functions need updates
4. **LEVERAGE PRIOR RESEARCH**: Check $PREV_SESSION_DIR/architecture/ for research that applies
   - Don't duplicate research that's already been done
   - Reference it directly in your delta PRD
5. **OUTPUT**: Write the delta PRD to \`$SESSION_DIR/delta_prd.md\`

The delta PRD should be self-contained but reference the previous session's work.
It will be used as input to the task breakdown process for this delta session.
` as const;

/\*\*

- Bug Hunt Prompt (Adversarial QA)
-
- @remarks
- The "Creative Bug Finding" prompt used for comprehensive end-to-end validation
- of implementations against the original PRD scope.
-
- Source: PROMPTS.md lines 1059-1174
  \*/
  export const BUG_HUNT_PROMPT = `

# Creative Bug Finding - End-to-End PRD Validation

You are a creative QA engineer and bug hunter. Your mission is to rigorously test the implementation against the original PRD scope and find any issues that the standard validation might have missed.

## Inputs

**Original PRD:**
$(cat "$PRD_FILE")

**Completed Tasks:**
$(cat "$TASKS_FILE")

## Your Mission

### Phase 1: PRD Scope Analysis

1. Read and deeply understand the original PRD requirements
2. Map each requirement to what should have been implemented
3. Identify the expected user journeys and workflows
4. Note any edge cases or corner cases implied by the requirements

### Phase 2: Creative End-to-End Testing

Think like a user, then think like an adversary. Test the implementation:

1. **Happy Path Testing**: Does the primary use case work as specified?
2. **Edge Case Testing**: What happens at boundaries? (empty inputs, max values, unicode, special chars)
3. **Workflow Testing**: Can a user complete the full journey described in the PRD?
4. **Integration Testing**: Do all the pieces work together correctly?
5. **Error Handling**: What happens when things go wrong? Are errors graceful?
6. **State Testing**: Does the system handle state transitions correctly?
7. **Concurrency Testing** (if applicable): What if multiple operations happen at once?
8. **Regression Testing**: Did fixing one thing break another?

### Phase 3: Adversarial Testing

Think creatively about what could go wrong:

1. **Unexpected Inputs**: What inputs did the PRD not explicitly define?
2. **Missing Features**: What did the PRD ask for that might not be implemented?
3. **Incomplete Features**: What is partially implemented but not fully working?
4. **Implicit Requirements**: What should obviously work but wasn't explicitly stated?
5. **User Experience Issues**: Is the implementation usable and intuitive?

### Phase 4: Documentation as Bug Report

Write a structured bug report to \`./$BUG_RESULTS_FILE\` that can be used as a PRD for fixes:

\`\`\`markdown

# Bug Fix Requirements

## Overview

Brief summary of testing performed and overall quality assessment.

## Critical Issues (Must Fix)

Issues that prevent core functionality from working.

### Issue 1: [Title]

**Severity**: Critical
**PRD Reference**: [Which section/requirement]
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Steps to Reproduce**: How to see the bug
**Suggested Fix**: Brief guidance on resolution

## Major Issues (Should Fix)

Issues that significantly impact user experience or functionality.

### Issue N: [Title]

[Same format as above]

## Minor Issues (Nice to Fix)

Small improvements or polish items.

### Issue N: [Title]

[Same format as above]

## Testing Summary

- Total tests performed: X
- Passing: X
- Failing: X
- Areas with good coverage: [list]
- Areas needing more attention: [list]
  \`\`\`

## Important Guidelines

1. **Be Thorough**: Test everything you can think of
2. **Be Creative**: Think outside the box - what would a real user do?
3. **Be Specific**: Provide exact reproduction steps for every bug
4. **Be Constructive**: Frame issues as improvements, not criticisms
5. **Prioritize**: Focus on what matters most to users
6. **Document Everything**: Even if you're not sure it's a bug, note it

## Output - IMPORTANT

**It is IMPORTANT that you follow these rules exactly:**

- **If you find Critical or Major bugs**: You MUST write the bug report to \`./$BUG_RESULTS_FILE\`. It is imperative that actionable bugs are documented.
- **If you find NO Critical or Major bugs**: Do NOT write any file. Do NOT create \`./$BUG_RESULTS_FILE\`. Leave no trace. The absence of the file signals success.

This is imperative. The presence or absence of the bug report file controls the entire bugfix pipeline. Writing an empty or "no bugs found" file will cause unnecessary work. Not writing the file when there ARE bugs will cause bugs to be missed.
` as const;

// PATTERN: Convenience export for type-safe prompt lookup
/\*\*

- All available system prompts keyed by name
-
- @remarks
- Provides type-safe access to all prompts via a single object.
- Use this for dynamic prompt lookup by key.
  \*/
  export const PROMPTS = {
  TASK_BREAKDOWN: TASK_BREAKDOWN_PROMPT,
  PRP_BLUEPRINT: PRP_BLUEPRINT_PROMPT,
  PRP_BUILDER: PRP_BUILDER_PROMPT,
  DELTA_PRD: DELTA_PRD_PROMPT,
  BUG_HUNT: BUG_HUNT_PROMPT,
  } as const;

/\*\*

- Type of available prompt keys
  \*/
  export type PromptKey = keyof typeof PROMPTS;

````

### Test Implementation Pattern

```typescript
/**
 * Unit tests for prompts module
 *
 * @remarks
 * Tests validate that all prompt constants are properly exported
 * and contain expected content.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  TASK_BREAKDOWN_PROMPT,
  PRP_BLUEPRINT_PROMPT,
  PRP_BUILDER_PROMPT,
  DELTA_PRD_PROMPT,
  BUG_HUNT_PROMPT,
  PROMPTS,
  type PromptKey,
} from '../../../src/agents/prompts.js';

describe('agents/prompts', () => {
  describe('prompt exports', () => {
    it('should export TASK_BREAKDOWN_PROMPT as a string', () => {
      expect(typeof TASK_BREAKDOWN_PROMPT).toBe('string');
      expect(TASK_BREAKDOWN_PROMPT.length).toBeGreaterThan(100);
    });

    it('should export PRP_BLUEPRINT_PROMPT as a string', () => {
      expect(typeof PRP_BLUEPRINT_PROMPT).toBe('string');
      expect(PRP_BLUEPRINT_PROMPT.length).toBeGreaterThan(100);
    });

    it('should export PRP_BUILDER_PROMPT as a string', () => {
      expect(typeof PRP_BUILDER_PROMPT).toBe('string');
      expect(PRP_BUILDER_PROMPT.length).toBeGreaterThan(100);
    });

    it('should export DELTA_PRD_PROMPT as a string', () => {
      expect(typeof DELTA_PRD_PROMPT).toBe('string');
      expect(DELTA_PRD_PROMPT.length).toBeGreaterThan(100);
    });

    it('should export BUG_HUNT_PROMPT as a string', () => {
      expect(typeof BUG_HUNT_PROMPT).toBe('string');
      expect(BUG_HUNT_PROMPT.length).toBeGreaterThan(100);
    });
  });

  describe('prompt content validation', () => {
    it('TASK_BREAKDOWN_PROMPT should contain expected header', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('LEAD TECHNICAL ARCHITECT');
      expect(TASK_BREAKDOWN_PROMPT).toContain('PROJECT SYNTHESIZER');
    });

    it('PRP_BLUEPRINT_PROMPT should contain expected header', () => {
      expect(PRP_BLUEPRINT_PROMPT).toContain('Create PRP for Work Item');
      expect(PRP_BLUEPRINT_PROMPT).toContain('PRP Creation Mission');
    });

    it('PRP_BUILDER_PROMPT should contain expected header', () => {
      expect(PRP_BUILDER_PROMPT).toContain('Execute BASE PRP');
      expect(PRP_BUILDER_PROMPT).toContain('One-Pass Implementation Success');
    });

    it('DELTA_PRD_PROMPT should contain expected header', () => {
      expect(DELTA_PRD_PROMPT).toContain('Generate Delta PRD from Changes');
      expect(DELTA_PRD_PROMPT).toContain('delta PRD');
    });

    it('BUG_HUNT_PROMPT should contain expected header', () => {
      expect(BUG_HUNT_PROMPT).toContain('Creative Bug Finding');
      expect(BUG_HUNT_PROMPT).toContain('End-to-End PRD Validation');
    });
  });

  describe('PROMPTS lookup object', () => {
    it('should contain all five prompts', () => {
      const keys = Object.keys(PROMPTS) as PromptKey[];
      expect(keys).toHaveLength(5);
      expect(keys).toContain('TASK_BREAKDOWN');
      expect(keys).toContain('PRP_BLUEPRINT');
      expect(keys).toContain('PRP_BUILDER');
      expect(keys).toContain('DELTA_PRD');
      expect(keys).toContain('BUG_HUNT');
    });

    it('should provide type-safe access to prompts', () => {
      expect(PROMPTS.TASK_BREAKDOWN).toBe(TASK_BREAKDOWN_PROMPT);
      expect(PROMPTS.PRP_BLUEPRINT).toBe(PRP_BLUEPRINT_PROMPT);
      expect(PROMPTS.PRP_BUILDER).toBe(PRP_BUILDER_PROMPT);
      expect(PROMPTS.DELTA_PRD).toBe(DELTA_PRD_PROMPT);
      expect(PROMPTS.BUG_HUNT).toBe(BUG_HUNT_PROMPT);
    });

    it('should use const assertion for literal types', () => {
      // This verifies that 'as const' was applied correctly
      const key: PromptKey = 'TASK_BREAKDOWN'; // Should compile
      const prompt = PROMPTS[key];
      expect(typeof prompt).toBe('string');
    });
  });

  describe('formatting preservation', () => {
    it('TASK_BREAKDOWN_PROMPT should preserve markdown code blocks', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('```json');
      expect(TASK_BREAKDOWN_PROMPT).toContain('```');
    });

    it('PRP_BLUEPRINT_PROMPT should contain template placeholders', () => {
      expect(PRP_BLUEPRINT_PROMPT).toContain('<item_title>');
      expect(PRP_BLUEPRINT_PROMPT).toContain('<item_description>');
    });

    it('PRP_BUILDER_PROMPT should contain PRP-README placeholder', () => {
      expect(PRP_BUILDER_PROMPT).toContain('<PRP-README>');
      expect(PRP_BUILDER_PROMPT).toContain('</PRP-README>');
    });

    it('BUG_HUNT_PROMPT should contain bash command placeholder', () => {
      expect(BUG_HUNT_PROMPT).toContain('$(cat "$PRD_FILE")');
      expect(BUG_HUNT_PROMPT).toContain('$(cat "$TASKS_FILE")');
    });
  });
});
````

### Integration Points

```yaml
AGENT_FACTORY:
  - future_import: "import { TASK_BREAKDOWN_PROMPT } from './prompts.js';"
  - future_usage: 'const system = TASK_BREAKDOWN_PROMPT;'
  - target_file: src/agents/agent-factory.ts
  - target_line: 115-117 (placeholder to replace)
  - integration_phase: P2.M1.T1.S3 (Implement persona-specific agent creators)

FUTURE_SUBTASKS:
  - P2.M1.T1.S3: Implement persona-specific agent creators (will use these prompts)
  - P2.M2.T1-S4: Task prompts will be integrated into various pipeline workflows
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler check
npm run build

# Expected: Zero compilation errors

# Run linter
npm run lint

# Expected: Zero linting errors

# Run formatter check
npm run format:check

# Expected: Zero formatting issues

# Fix any issues before proceeding
npm run lint:fix
npm run format
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the prompts module
npm test -- tests/unit/agents/prompts.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/agents/

# Verify coverage meets 100% threshold
# Expected: All tests pass, 100% coverage for src/agents/prompts.ts

# Verify existing tests still pass
npm test -- tests/unit/agents/agent-factory.test.ts

# Expected: All existing agent factory tests still pass
```

### Level 3: Content Validation (System Validation)

```bash
# Verify prompts can be imported and used
node -e "
import('./src/agents/prompts.js').then(m => {
  console.log('TASK_BREAKDOWN_PROMPT length:', m.TASK_BREAKDOWN_PROMPT.length);
  console.log('Contains header:', m.TASK_BREAKDOWN_PROMPT.includes('LEAD TECHNICAL ARCHITECT'));
  console.log('All exports present:', Object.keys(m.PROMPTS).length === 5);
});
"

# Expected output:
# TASK_BREAKDOWN_PROMPT length: [number > 1000]
# Contains header: true
# All exports present: true

# Verify string content integrity (byte-level check)
node -e "
import { readFileSync } from 'fs';
import('./src/agents/prompts.js').then(m => {
  const promptsContent = readFileSync('./PROMPTS.md', 'utf-8');
  const taskBreakdown = m.TASK_BREAKDOWN_PROMPT;

  // Verify key sections are present
  console.log('Has HIERARCHY DEFINITIONS:', taskBreakdown.includes('HIERARCHY DEFINITIONS'));
  console.log('Has CRITICAL CONSTRAINTS:', taskBreakdown.includes('CRITICAL CONSTRAINTS'));
  console.log('Has OUTPUT FORMAT:', taskBreakdown.includes('OUTPUT FORMAT'));
});
"

# Expected: All checks return true
```

### Level 4: Integration Validation

```bash
# Verify TypeScript types are correct
npx tsc --noEmit

# Verify PromptKey type works as expected
node -e "
import('./src/agents/prompts.js').then(m => {
  // This should compile without errors
  const key: m.PromptKey = 'TASK_BREAKDOWN';
  const prompt = m.PROMPTS[key];
  console.log('Type-safe lookup works:', typeof prompt === 'string');

  // This should also work
  const allKeys: m.PromptKey[] = ['TASK_BREAKDOWN', 'PRP_BLUEPRINT', 'PRP_BUILDER', 'DELTA_PRD', 'BUG_HUNT'];
  console.log('All valid keys:', allKeys.length);
});
"

# Expected: All type assertions pass

# Verify prompts module integrates with agent factory
node -e "
import('./src/agents/agent-factory.js').then(factory => {
  import('./src/agents/prompts.js').then(prompts => {
    // Verify prompts can be used in agent config
    const config = factory.createBaseConfig('architect');
    config.system = prompts.TASK_BREAKDOWN_PROMPT;
    console.log('Integration works:', config.system.length > 100);
  });
});
"

# Expected: Integration successful, prompt assigned to config.system
```

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] All tests pass: `npm test -- tests/unit/agents/prompts.test.ts`
- [ ] 100% coverage achieved: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Existing agent factory tests still pass

### Feature Validation

- [ ] `TASK_BREAKDOWN_PROMPT` exported and contains correct content
- [ ] `PRP_BLUEPRINT_PROMPT` exported and contains correct content
- [ ] `PRP_BUILDER_PROMPT` exported and contains correct content
- [ ] `DELTA_PRD_PROMPT` exported and contains correct content
- [ ] `BUG_HUNT_PROMPT` exported and contains correct content
- [ ] `PROMPTS` lookup object exported with all five prompts
- [ ] `PromptKey` type exported as union of literal types
- [ ] All prompts preserve exact formatting from PROMPTS.md
- [ ] All prompts use template literals with `as const`

### Code Quality Validation

- [ ] Follows existing codebase patterns (JSDoc, const assertions)
- [ ] File placement matches desired codebase tree
- [ ] Module-level JSDoc with @module, @remarks tags
- [ ] Each export has JSDoc documentation
- [ ] Uses ESM imports with `.js` extensions
- [ ] Template literals preserve exact formatting
- [ ] `as const` applied to all prompt constants

### Documentation & Deployment

- [ ] Module-level JSDoc describes purpose and usage
- [ ] Each prompt has JSDoc with source reference
- [ ] Example usage in JSDoc
- [ ] No hardcoded values that should be constants
- [ ] Prompts are self-documenting (clear variable names)

---

## Anti-Patterns to Avoid

- ❌ Don't use string concatenation or array joining (alters formatting)
- ❌ Don't skip `as const` assertion (type safety is lost)
- ❌ Don't use `.ts` extensions in imports (ESM requires `.js`)
- ❌ Don't modify PROMPTS.md content (use exact source)
- ❌ Don't forget to escape nested backticks in code blocks
- ❌ Don't create prompts that aren't in the specification
- ❌ Don't split prompts across multiple files (keep in one module)
- ❌ Don't modify agent-factory.ts in this subtask (that's P2.M1.T1.S3)
- ❌ Don't use `as any` to bypass type checking
- ❌ Don't create unnecessary abstractions (keep exports simple)
- ❌ Don't normalize whitespace or line endings (preserve exact formatting)
- ❌ Don't interpolate the `$PRP_README` placeholder (keep as literal string)

## Confidence Score: 10/10

**Justification**: This PRP provides comprehensive context including:

- Exact line numbers from PROMPTS.md for each prompt
- Complete TypeScript patterns for string constants
- Specific test patterns with assertion examples
- All integration points and future dependencies
- Common gotchas and anti-patterns
- Project-specific validation commands

The "No Prior Knowledge" test is fully satisfied - an AI agent unfamiliar with this codebase can implement this feature successfully using only this PRP and the referenced files.

---

## Success Metrics

**One-Pass Implementation**: Following this PRP should result in working code on the first attempt, passing all validation gates without requiring clarification or additional research.

**Validation**: The completed prompts.ts module should:

1. Export all five prompts as named constants
2. Preserve exact formatting from PROMPTS.md
3. Pass TypeScript compilation and type checking
4. Achieve 100% test coverage
5. Not break any existing tests

**Next Subtask Readiness**: This implementation enables P2.M1.T1.S3 (Implement persona-specific agent creators) to import and use these prompts for actual agent configuration.
