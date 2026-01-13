# TASK_BREAKDOWN_PROMPT Analysis

## Source
- **File**: `src/agents/prompts.ts` (lines 33-146)
- **Source File**: `PROMPTS.md` (lines 54-169)

## Role Definition
**LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER**

The prompt acts as a unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA) with the goal of validating PRDs through research, documenting findings, and decomposing into a strict hierarchy.

## Hierarchy Definitions
- **PHASE**: Project-scope goals (weeks to months)
- **MILESTONE**: Key objectives within Phase (1-12 weeks)
- **TASK**: Complete features within Milestone (days to weeks)
- **SUBTASK**: Atomic implementation steps (0.5, 1, or 2 Story Points max)

## Critical Constraints

### 1. RESEARCH-DRIVEN ARCHITECTURE
- Validate before breaking down
- Spawn subagents to research codebase and external documentation
- Reality check against current codebase state
- Store findings in `$SESSION_DIR/architecture/`

### 2. COHERENCE & CONTINUITY
- No vacuums - subtasks must not exist in isolation
- Explicit handoffs between subtasks
- Strict references to specific file paths, variable names, API endpoints

### 3. IMPLICIT TDD & QUALITY
- DO NOT create subtasks for "Write Tests"
- Implied workflow: test -> implement -> pass
- Definition of done: code is not complete without tests

### 4. CONTEXT SCOPE BLINDER
Every Subtask's `context_scope` must define:
- **INPUT**: What specific data/interfaces are available
- **OUTPUT**: What exact interface does this subtask expose
- **MOCKING**: What external services must be mocked

## Process

```
ULTRATHINK & PLAN
1. ANALYZE the PRD
2. RESEARCH (SPAWN & VALIDATE)
3. DETERMINE scope level
4. DECOMPOSE to Subtask level
```

## Output Format

The prompt requires writing JSON to `./$TASKS_FILE` with the structure matching `BacklogSchema`.

## Import Pattern
```typescript
import { TASK_BREAKDOWN_PROMPT } from './agents/prompts.js';
```
