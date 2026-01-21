# Architect Agent Integration Research

## Overview

This document captures research findings for P1.M1.T3.S1: "Verify Architect Agent integration and prompts".

## Architect Agent Configuration

### Location: `src/agents/agent-factory.ts`

The `createArchitectAgent()` function creates an Architect agent with the following configuration:

```typescript
export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,
    mcps: MCP_TOOLS,
  };
  return createAgent(config);
}
```

### Configuration Values

| Property           | Value                              | Source                                    |
| ------------------ | ---------------------------------- | ----------------------------------------- |
| `name`             | `'ArchitectAgent'`                 | Line 155 (derived from persona)           |
| `system`           | `TASK_BREAKDOWN_PROMPT`            | Line 199 (from PROMPTS.md)                |
| `model`            | `'GLM-4.7'`                        | Line 152 (getModel('sonnet'))             |
| `maxTokens`        | `8192`                             | Line 119 (PERSONA_TOKEN_LIMITS.architect) |
| `enableCache`      | `true`                             | Line 166                                  |
| `enableReflection` | `true`                             | Line 167                                  |
| `mcps`             | `[BashMCP, FilesystemMCP, GitMCP]` | Line 68                                   |

### Persona Token Limits

```typescript
const PERSONA_TOKEN_LIMITS = {
  architect: 8192, // Larger for complex decomposition
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;
```

## TASK_BREAKDOWN_PROMPT Structure

### Location: `PROMPTS.md` lines 54-169

### Required Sections

1. **Role Definition** (Lines 57-61)
   - Role: Lead Technical Architect and Project Management Synthesizer
   - Context: Consensus of senior panel
   - Goal: Validate PRD, document findings, decompose into hierarchy

2. **Hierarchy Definitions** (Lines 65-70)
   - PHASE: Project-scope goals (weeks to months)
   - MILESTONE: Key objectives (1-12 weeks)
   - TASK: Complete features (days to weeks)
   - SUBTASK: Atomic steps (0.5, 1, or 2 Story Points)

3. **Critical Constraints & Standard of Work** (Lines 74-102)
   - Research-Driven Architecture (NEW PRIORITY)
   - Coherence & Continuity
   - Implicit TDD & Quality
   - Context Scope Blinder

4. **Process** (Lines 107-115)
   - ANALYZE the PRD
   - RESEARCH (SPAWN & VALIDATE)
   - DETERMINE highest scope level
   - DECOMPOSE strictly downwards

5. **Output Format** (Lines 119-168)
   - Must write to `./$TASKS_FILE` in CWD
   - JSON structure with backlog array

### Critical Prompt Requirements

```markdown
# CONSTRAINTS TO VALIDATE

1. Research-Driven Architecture Section (Lines 76-81)
   - Must mention spawning subagents for research
   - Must mention storing findings in $SESSION_DIR/architecture/

2. Implicit TDD Section (Lines 89-93)
   - Must state "DO NOT create subtasks for 'Write Tests'"
   - Must imply test-driven workflow

3. Context Scope Blinder Section (Lines 95-102)
   - Must define INPUT, OUTPUT, MOCKING requirements

4. Output Instruction (Lines 121-123)
   - Must instruct to write to ./\$TASKS_FILE
   - Must not output JSON to conversation
```

## Backlog Zod Schema

### Location: `src/core/models.ts`

### Schema Hierarchy

```
Backlog
  └── backlog: Phase[]
      └── milestones: Milestone[]
          └── tasks: Task[]
              └── subtasks: Subtask[]
```

### Key Validation Rules

#### Phase Schema

```typescript
{
  id: string,        // Regex: /^P\d+$/
  type: 'Phase',
  title: string,     // min: 1, max: 200
  status: Status,
  description: string,  // min: 1
  milestones: Milestone[]
}
```

#### Subtask Schema

```typescript
{
  id: string,        // Regex: /^P\d+\.M\d+\.T\d+\.S\d+$/
  type: 'Subtask',
  title: string,     // min: 1, max: 200
  status: Status,
  story_points: number,  // Integer, min: 1, max: 21 (Fibonacci)
  dependencies: string[],
  context_scope: string   // CONTRACT DEFINITION format
}
```

#### Context Scope Schema Validation

The `context_scope` field must follow this exact format:

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: [...]
2. INPUT: [...]
3. LOGIC: [...]
4. OUTPUT: [...]
```

Validation rules (from `ContextScopeSchema`):

- Must start with "CONTRACT DEFINITION:\n"
- Must have all 4 numbered sections in exact order
- Section headers must match exactly (case-sensitive)

#### Status Enum

```typescript
type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

## Architect Prompt Generator

### Location: `src/agents/prompts/architect-prompt.ts`

```typescript
export function createArchitectPrompt(prdContent: string): Prompt<Backlog> {
  return createPrompt({
    user: prdContent,
    system: TASK_BREAKDOWN_PROMPT,
    responseFormat: BacklogSchema,
    enableReflection: true,
  });
}
```

### Key Points

- Uses Groundswell's `createPrompt()` function
- `responseFormat: BacklogSchema` enables automatic JSON validation
- `enableReflection: true` provides error recovery for complex decomposition
- Returns a `Prompt<Backlog>` object that can be passed to `agent.prompt()`

## Existing Test Coverage

### Location: `tests/integration/architect-agent.test.ts`

### Current Tests

1. **should read PRD.md from project root**
   - Verifies PRD file exists and contains expected content

2. **should create architect agent using factory**
   - Verifies agent creation with mock

3. **should generate valid backlog matching BacklogSchema**
   - Validates output against Zod schema
   - Uses `USE_REAL_LLM` flag for real vs mocked

4. **should contain at least one phase with proper nesting**
   - Validates hierarchy structure

5. **should validate story_points are integers in range [1, 21]**
   - Validates Fibonacci story points

6. **should log sample output for inspection**
   - Logs output for manual review

### Mock Pattern Used

```typescript
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(() => ({
    prompt: vi.fn(),
  })),
}));
```

## Groundswell Integration

### Mock Pattern for Tests

From `tests/integration/groundswell/agent-prompt.test.ts`:

```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));
```

### Prompt Validation Methods

- `prompt.validateResponse(data)` - Throws on invalid data
- `prompt.safeValidateResponse(data)` - Returns `{ success: boolean, data?: T, error?: ZodError }`
- `prompt.getResponseFormat()` - Returns the Zod schema

## Test Environment Setup

### Location: `tests/setup.ts`

### Key Features

1. **z.ai API Safeguard**
   - Blocks Anthropic's official API endpoints
   - Warns on non-z.ai endpoints
   - Fails fast if wrong API configured

2. **Promise Rejection Tracking**
   - Captures unhandled rejections during tests
   - Fails test with details if rejections found

3. **Global Cleanup**
   - `vi.clearAllMocks()` before each test
   - `vi.unstubAllEnvs()` after each test
   - Forces GC if available

## Critical Gotchas

### Story Points Discrepancy

- **PROMPTS.md** mentions "0.5, 1, or 2 Story Points"
- **Schema** requires integers 1-21 (Fibonacci)
- **Test validates integers 1-21** (line 287 in existing test)

### Context Scope Format

The `context_scope` must have the numbered sections in exact order:

- "1. RESEARCH NOTE:"
- "2. INPUT:"
- "3. LOGIC:"
- "4. OUTPUT:"

The regex patterns require the number, period, and space.

### MCP Server Registration

MCP servers are singletons registered at module load time:

```typescript
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();
```

This prevents re-registration across tests, requiring mock approach.

### Environment Variables

- `ANTHROPIC_AUTH_TOKEN` (shell) → `ANTHROPIC_API_KEY` (SDK)
- `ANTHROPIC_BASE_URL` → `https://api.z.ai/api/anthropic`

The mapping happens in `configureEnvironment()` at module load time.
