# Previous PRP Dependencies Analysis (P1.M3.T2.S1)

## Overview

This document analyzes the previous PRP (P1.M3.T2.S1 - Verify PRP Creation Prompt research process) to identify dependencies, patterns to follow, and things to avoid duplicating.

## Output File Paths from P1.M3.T2.S1

**Primary Output**:

- `tests/integration/prp-create-prompt.test.ts` - Integration test file that validates PRP_CREATE_PROMPT research process instructions

**Related Files Referenced**:

- `PROMPTS.md` - Source of PRP_CREATE_PROMPT (lines 189-639)
- `src/agents/prompts.ts` - Exports PRP_BLUEPRINT_PROMPT (lines 157-603)
- `tests/integration/researcher-agent.test.ts` - Reference implementation for prompt structure validation
- `tests/integration/architect-agent-integration.test.ts` - Mock agent patterns

## Test Patterns Established

### 1. Mock Groundswell Pattern

```typescript
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});
```

**Key Point**: Mock `groundswell`, NOT `agent-factory`

### 2. Dynamic Import After Mock Setup

```typescript
async function loadGroundswell() {
  return await import('groundswell');
}
```

**Key Point**: Always use dynamic imports after `vi.mock()` is applied

### 3. Cleanup in afterEach

```typescript
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

**Key Point**: Always cleanup to prevent cross-test pollution

### 4. Nested describe Blocks

```typescript
describe('integration/prp-create-prompt', () => {
  describe('PRP_CREATE_PROMPT research process verification', () => {
    it('should contain Research Process section', async () => {
      // test implementation
    });
  });
});
```

**Key Point**: Group tests logically with nested describe blocks

### 5. Prompt Content Verification

```typescript
const { PRP_BLUEPRINT_PROMPT } = await import('/path/to/prompts.js');
expect(PRP_BLUEPRINT_PROMPT).toContain('expected content');
```

**Key Point**: Verify prompt CONTAINS instructions, not that they work

## Dependencies to Leverage

### Test Infrastructure

- **Test Framework**: Vitest v1.6.1
- **Assertion Library**: `expect` from Vitest
- **Mocking**: `vi` utilities
- **Configuration**: `vitest.config.ts`

### Existing Test Patterns

- File naming: `tests/integration/{feature}.test.ts`
- Import style: `import { describe, expect, it } from 'vitest'`
- Test structure: BDD-style with describe/it blocks
- Setup/teardown: `beforeEach` and `afterEach` hooks

### Reference Files

- `tests/integration/researcher-agent.test.ts` - Lines 402-480 show prompt validation pattern
- `tests/integration/prp-create-prompt.test.ts` - The actual test file from P1.M3.T2.S1

## Things NOT to Duplicate

### 1. Don't Mock agent-factory

- ❌ Mock `agent-factory` module
- ✅ Mock `groundswell` module instead

### 2. Don't Test Aspirational Features

- ❌ Test that subagent spawning actually works
- ✅ Test that prompt CONTAINS subagent spawning instructions

### 3. Don't Use Static Imports Before Mocks

- ❌ `import { something } from 'groundswell'` at top of file
- ✅ Use dynamic imports inside tests

### 4. Don't Verify Wrong Path References

- ❌ Verify "$SESSION_DIR/architecture/"
- ✅ Verify "plan/architecture" (actual path in prompt)

### 5. Don't Skip Cleanup

- ❌ Forget cleanup in afterEach
- ✅ Always `vi.unstubAllEnvs()` and `vi.clearAllMocks()`

### 6. Don't Duplicate Existing Test Coverage

- ❌ Re-test PRP research process instructions (P1.M3.T2.S1 covers this)
- ✅ Test PRP template structure validation (new coverage for P1.M3.T2.S2)

## Key Gotchas

### Architecture Directory Path

The PRP_BLUEPRINT_PROMPT uses "plan/architecture" NOT "$SESSION_DIR/architecture/"

### Subagent Spawning is Aspirational

These features are documented in prompts but not implemented:

- Spawning subagents with batch tools
- External research with web search
- User clarification dialogs

Tests verify prompt CONTAINS these instructions, not that they work.

### Dynamic Import Timing

Always apply `vi.mock()` before any imports:

```typescript
// CORRECT:
vi.mock('groundswell', ...);
import { describe } from 'vitest';

// INCORRECT:
import { something } from 'other-module';
vi.mock('groundswell', ...);
```

## Integration Points

### Test Runner

- **Command**: `vitest run tests/integration/`
- **Watch mode**: `npx vitest`
- **Single file**: `vitest run tests/integration/prp-template-validation.test.ts`

### Prompt Export

- **Import path**: `src/agents/prompts.js`
- **Export name**: `PRP_BLUEPRINT_PROMPT`
- **Lines**: 157-603 in prompts.ts

### Existing Test Locations

- `tests/integration/researcher-agent.test.ts` - Agent configuration tests
- `tests/integration/prp-create-prompt.test.ts` - PRP_CREATE_PROMPT content tests
- `tests/integration/prp-generator-integration.test.ts` - PRPGenerator flow tests

## Summary

P1.M3.T2.S1 established patterns for testing prompt content without calling LLMs. P1.M3.T2.S2 should follow similar patterns but focus on:

1. **Different focus**: Template structure validation (not prompt content validation)
2. **Similar patterns**: Mock setup, dynamic imports, cleanup
3. **Different outputs**: Parser/validator functions (not just content verification)
4. **Complementary coverage**: Testing different aspects of the PRP system

The key is to leverage the testing infrastructure and patterns established in P1.M3.T2.S1 while testing different functionality (template structure vs. prompt content).
