# Research Summary: Task Breakdown Prompt Verification

## Date: 2026-01-21
## Work Item: P1.M3.T1.S1 - Verify Task Breakdown Prompt structure and content

---

## Key Findings

### 1. Task Breakdown Prompt Location

**File**: `/home/dustin/projects/hacky-hack/src/agents/prompts.ts`
**Lines**: 33-146
**Export**: `TASK_BREAKDOWN_PROMPT` constant

The prompt is stored as a TypeScript string constant, not a separate markdown file as the contract definition suggested.

### 2. Prompt Requirements from Contract Definition

The contract definition specifies 5 requirements to verify:

**a) Architect Role and Responsibilities**
- "LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER"
- Must define ROLE, CONTEXT, and GOAL

**b) Research-Driven Architecture**
- "VALIDATE BEFORE BREAKING DOWN"
- "SPAWN SUBAGENTS" for codebase and external documentation research
- Store findings in `$SESSION_DIR/architecture/`

**c) Strict JSON Output Format**
- Write to `./$TASKS_FILE` (in current working directory)
- Do NOT output JSON to conversation
- Specific JSON schema with backlog array

**d) Implicit TDD Approach**
- "DO NOT create subtasks for 'Write Tests.'"
- "IMPLIED WORKFLOW: Write failing test -> Implement code -> Pass test"

**e) Context Scope Requirements**
- INPUT: What data/interfaces available from previous subtasks
- OUTPUT: What interface does this subtask expose
- MOCKING: What external services must be mocked

### 3. Test Framework: Vitest

**Config**: `/home/dustin/projects/hacky-hack/vitest.config.ts`
**Pattern**: `*.test.ts` in `tests/integration/`, `tests/unit/`, `tests/e2e/`
**Coverage**: 100% required

### 4. Existing Test Patterns

**Unit Test**: `tests/unit/agents/prompts.test.ts`
- Basic string validation
- Checks prompt exports and headers
- Simple `expect().toContain()` assertions

**Integration Test**: `tests/integration/prp-blueprint-agent.test.ts`
- Loads real data from plan directory
- Uses BacklogSchema validation
- describe/beforeEach/afterEach structure
- Tests prompt generation with real backlog data

### 5. Test File Structure Pattern

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TASK_BREAKDOWN_PROMPT } from '../../src/agents/prompts.js';

describe('integration/task-breakdown-prompt', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // Test suites here
});
```

---

## PRP Quality Gates Validation

### Context Completeness Check
- [x] Passes "No Prior Knowledge" test - all file paths, line numbers, and patterns specified
- [x] All YAML references are specific and accessible
- [x] Implementation tasks include exact naming and placement guidance
- [x] Validation commands are project-specific and verified working

### Template Structure Compliance
- [x] All required sections completed
- [x] Goal section has specific Feature Goal, Deliverable, Success Definition
- [x] Implementation Tasks follow dependency ordering
- [x] Final Validation Checklist is comprehensive

### Information Density Standards
- [x] No generic references - all are specific and actionable
- [x] File patterns point at specific examples to follow
- [x] URLs include section anchors for exact guidance
- [x] Task specifications use information-dense keywords from codebase

---

## Confidence Score

**8/10** for one-pass implementation success likelihood

**Rationale**:
- Comprehensive file references with exact line numbers
- Clear test patterns to follow from existing codebase
- Specific assertion patterns provided
- All 5 requirements clearly mapped to test cases
- Complete implementation blueprint with code examples

**Potential Risks**:
- String matching may need adjustment if prompt content has slight variations
- Test file path naming convention must match exactly
- Import path resolution (.js extension) must be correct

---

## Additional Resources Found

### Related Files
- `tests/setup.ts` - Global test configuration
- `package.json` - Test scripts: `test:run`, `test:coverage`
- `PROMPTS.md` - Lines 54-169 contain original specification

### Related Work Items
- P1.M3.T1.S2 - Verify Task Breakdown JSON output schema (follows this work)
- P1.M3.T2 - PRP Creation Prompt Verification (parallel milestone)
