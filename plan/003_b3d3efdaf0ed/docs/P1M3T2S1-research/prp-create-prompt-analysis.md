# PRP_CREATE_PROMPT Research Analysis

## Executive Summary

This document captures key findings about the PRP_CREATE_PROMPT (lines 189-639 in PROMPTS.md) and how it should be verified through integration tests.

## PRP_CREATE_PROMPT Structure

From `src/agents/prompts.ts` lines 157-603, the prompt is exported as `PRP_BLUEPRINT_PROMPT`.

### Key Sections

1. **Work Item Information** (lines 160-167)
   - ITEM TITLE placeholder
   - ITEM DESCRIPTION placeholder

2. **PRP Creation Mission** (lines 169-180)
   - One-pass implementation success goal
   - Context completeness requirements

3. **Research Process** (lines 217-244) - CRITICAL FOR THIS TEST
   - Codebase Analysis in depth
   - Internal Research at scale
   - External Research at scale
   - User Clarification

4. **PRP Generation Process** (lines 246-282)
   - Step 1: Review Template
   - Step 2: Context Completeness Validation
   - Step 3: Research Integration
   - Step 4: Information Density Standards
   - Step 5: ULTRATHINK Before Writing

5. **PRP Template** (lines 285-602)
   - Goal, User Persona, Why, What sections
   - All Needed Context section
   - Implementation Blueprint
   - Validation Loop (4 levels)
   - Final Validation Checklist
   - Anti-Patterns to Avoid

## Research Process Requirements (From Contract Definition)

The contract definition for P1.M3.T2.S1 states:

```
1. RESEARCH NOTE: From PROMPTS.md lines 189-639 and system_context.md
   - Role: Product Owner/Researcher
   - Research: codebase analysis (spawn subagents), internal research (check architecture/),
     external research (spawn subagents for docs), user clarification

2. INPUT: PRP_CREATE_PROMPT from PROMPTS.md, research workflow in PRPGenerator

3. LOGIC: Write integration test that verifies:
   (a) prompt instructs agent to spawn subagents for codebase analysis
   (b) prompt checks $SESSION_DIR/architecture/ for prior research
   (c) prompt instructs external research for documentation
   (d) prompt asks user for clarification on ambiguous requirements
   Mock agent behavior and research subagent calls

4. OUTPUT: Integration test file tests/integration/prp-create-prompt.test.ts
```

## Key Test Patterns from Existing Tests

From `tests/integration/researcher-agent.test.ts`:

### Pattern 1: Verify Prompt Contains Research Process Instructions
```typescript
it('should contain Research Process section', async () => {
  const { PRP_BLUEPRINT_PROMPT } = await import('src/agents/prompts.js');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Research Process');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Codebase Analysis in depth');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Internal Research at scale');
  expect(PRP_BLUEPRINT_PROMPT).toContain('External Research at scale');
  expect(PRP_BLUEPRINT_PROMPT).toContain('User Clarification');
});
```

### Pattern 2: Verify Subagent Spawning Instructions
```typescript
it('should instruct to spawn subagents', async () => {
  const { PRP_BLUEPRINT_PROMPT } = await import('src/agents/prompts.js');
  expect(PRP_BLUEPRINT_PROMPT).toContain('spawn subagents');
  expect(PRP_BLUEPRINT_PROMPT).toContain('batch tools');
});
```

### Pattern 3: Verify TodoWrite Tool Instructions
```typescript
it('should instruct to use TodoWrite tool', async () => {
  const { PRP_BLUEPRINT_PROMPT } = await import('src/agents/prompts.js');
  expect(PRP_BLUEPRINT_PROMPT).toContain('TodoWrite');
  expect(PRP_BLUEPRINT_PROMPT).toContain('create comprehensive PRP writing plan');
});
```

### Pattern 4: Verify Architecture Directory Reference
```typescript
it('should mention architecture/ directory', async () => {
  const { PRP_BLUEPRINT_PROMPT } = await import('src/agents/prompts.js');
  expect(PRP_BLUEPRINT_PROMPT).toContain('plan/architecture');
});
```

## Important Gotchas

1. **Subagent Spawning is Aspirational**: The prompt instructs agents to spawn subagents, but this functionality is not currently implemented in the codebase. Tests verify the prompt CONTAINS these instructions, not that they work.

2. **Architecture Directory Reference**: The PRP_BLUEPRINT_PROMPT uses "plan/architecture" not "$SESSION_DIR/architecture/" - tests should verify the actual string used.

3. **Mock Groundswell, Not Factory**: Test pattern is to mock `groundswell` module's `createAgent`, NOT the agent-factory module.

4. **Dynamic Imports**: Use dynamic imports after vi.mock() to ensure mocks are applied.

## Test File Location

The test should be created at:
`tests/integration/prp-create-prompt.test.ts`

This follows the naming pattern from other integration tests:
- `tests/integration/researcher-agent.test.ts`
- `tests/integration/prp-generator-integration.test.ts`
- `tests/integration/architect-agent-integration.test.ts`

## References

- `PROMPTS.md` lines 189-639 - PRP_CREATE_PROMPT definition
- `src/agents/prompts.ts` lines 157-603 - PRP_BLUEPRINT_PROMPT export
- `tests/integration/researcher-agent.test.ts` - Existing test patterns for prompt validation
- `plan/003_b3d3efdaf0ed/docs/system_context.md` - System architecture documentation
