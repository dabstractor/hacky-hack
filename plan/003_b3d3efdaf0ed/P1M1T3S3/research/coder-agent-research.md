# Coder Agent Implementation and Integration Research

**Date**: 2026-01-19
**Researcher**: Claude Code Agent
**Task**: P1.M1.T3.S3 - Coder Agent Integration Testing

---

## Executive Summary

This document provides comprehensive research on the Coder Agent implementation, configuration, prompts, validation system, and existing test coverage. The Coder Agent (also known as the Builder or PRP Executor) is responsible for implementing features from PRP (Product Requirement Prompt) specifications.

---

## 1. Coder Agent Configuration

### 1.1 Factory Function: `createCoderAgent()`

**Location**: `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` (lines 254-263)

**Implementation**:

```typescript
export function createCoderAgent(): Agent {
  const baseConfig = createBaseConfig('coder');
  const config = {
    ...baseConfig,
    system: PRP_BUILDER_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug({ persona: 'coder', model: config.model }, 'Creating agent');
  return createAgent(config);
}
```

### 1.2 Exact Configuration Values

| Property                   | Value                            | Source                                |
| -------------------------- | -------------------------------- | ------------------------------------- |
| **name**                   | `CoderAgent`                     | Derived from persona                  |
| **model**                  | `GLM-4.7`                        | `getModel('sonnet')` → resolved model |
| **system**                 | `PRP_BUILDER_PROMPT`             | From prompts.ts (line 614-685)        |
| **enableCache**            | `true`                           | Default for all personas              |
| **enableReflection**       | `true`                           | Default for all personas              |
| **maxTokens**              | `4096`                           | PERSONA_TOKEN_LIMITS.coder            |
| **env.ANTHROPIC_API_KEY**  | `process.env.ANTHROPIC_API_KEY`  | Environment variable                  |
| **env.ANTHROPIC_BASE_URL** | `process.env.ANTHROPIC_BASE_URL` | Environment variable                  |

### 1.3 MCP Tools Integration

The Coder Agent receives **all 3 MCP tools** via the `MCP_TOOLS` constant:

1. **BashMCP** (`name: 'bash'`)
   - Purpose: Execute shell commands for validation gates
   - Tool: `execute_bash`

2. **FilesystemMCP** (`name: 'filesystem'`)
   - Purpose: Read/write files during implementation
   - Tools: `read_file`, `write_file`, `edit_file`

3. **GitMCP** (`name: 'git'`)
   - Purpose: Git operations for version control
   - Tools: Git status, diff, commit operations

**Code Reference** (agent-factory.ts:56-68):

```typescript
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();

const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP];
```

---

## 2. PRP_BUILDER_PROMPT (The Builder System Prompt)

**Location**: `/home/dustin/projects/hacky-hack/src/agents/prompts.ts` (lines 605-685)
**Source**: PROMPTS.md lines 641-714

### 2.1 Complete Prompt Structure

````markdown
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
   - **ACTION**: Use the `Read` tool to read the PRP file at the path provided in the instructions below.
   - You MUST read this file before doing anything else. It contains your instructions.
   - Absorb all context, patterns, requirements and gather codebase intelligence
   - Use the provided documentation references and file patterns, consume the right documentation before the appropriate todo/task
   - Trust the PRP's context and guidance - it's designed for one-pass success
   - If needed do additional codebase exploration and research as needed

2. **ULTRATHINK & Plan**
   - Create comprehensive implementation plan following the PRP's task order
   - Break down into clear todos using TodoWrite tool
   - Use subagents for parallel work when beneficial (always create prp inspired prompts for subagents when used)
   - Follow the patterns referenced in the PRP
   - Use specific file paths, class names, and method signatures from PRP context
   - Never guess - always verify the codebase patterns and examples referenced in the PRP yourself

3. **Execute Implementation**
   - Follow the PRP's Implementation Tasks sequence, add more detail as needed, especially when using subagents
   - Use the patterns and examples referenced in the PRP
   - Create files in locations specified by the desired codebase tree
   - Apply naming conventions from the task specifications and CLAUDE.md

4. **Progressive Validation**

   **Execute the level validation system from the PRP:**
   - **Level 1**: Run syntax & style validation commands from PRP
   - **Level 2**: Execute unit test validation from PRP
   - **Level 3**: Run integration testing commands from PRP
   - **Level 4**: Execute specified validation from PRP

   **Each level must pass before proceeding to the next.**

5. **Completion Verification**
   - Work through the Final Validation Checklist in the PRP
   - Verify all Success Criteria from the "What" section are met
   - Confirm all Anti-Patterns were avoided
   - Implementation is ready and working

**Failure Protocol**: When validation fails, use the patterns and gotchas from the PRP to fix issues, then re-run validation until passing.

If a fundamental issue with the plan is found, halt and produce a thorough explanation of the problem at a 10th grade level.

Strictly output your results in this JSON format:

```json
{
   "result": "success" | "error" | "issue",
   "message": "Detailed explanation of the issue"
}
```
````

<PRP-README>
$PRP_README
</PRP-README>
```

### 2.2 Key Prompt Characteristics

1. **Critical First Step**: Must read PRP file before any action
2. **Progressive Validation**: 4-level gate system with sequential execution
3. **Subagent Usage**: Explicitly allowed with PRP-inspired prompts
4. **Output Format**: Strict JSON with `result` and `message` fields
5. **Error Handling**: Halt on fundamental issues with 10th-grade explanation

---

## 3. Validation Gate System

### 3.1 PRPDocument Schema

**Location**: `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 1148-1305)

```typescript
export interface PRPDocument {
  readonly taskId: string;
  readonly objective: string;
  readonly context: string;
  readonly implementationSteps: string[];
  readonly validationGates: ValidationGate[];
  readonly successCriteria: SuccessCriterion[];
  readonly references: string[];
}
```

### 3.2 ValidationGate Structure

**Location**: `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 966-1073)

```typescript
export interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly command: string | null;
  readonly manual: boolean;
}
```

### 3.3 The Four Validation Levels

From the PRP Template (PROMPTS.md lines 465-594):

#### **Level 1: Syntax & Style (Immediate Feedback)**

- **Purpose**: Linting, formatting, type checking
- **Example Commands**:
  ```bash
  ruff check src/{new_files} --fix
  mypy src/{new_files}
  ruff format src/{new_files}
  ```
- **Expected**: Zero errors
- **When**: Run after each file creation

#### **Level 2: Unit Tests (Component Validation)**

- **Purpose**: Component-level testing
- **Example Commands**:
  ```bash
  uv run pytest src/services/tests/test_{domain}_service.py -v
  uv run pytest src/ --cov=src --cov-report=term-missing
  ```
- **Expected**: All tests pass
- **When**: After each component is created

#### **Level 3: Integration Testing (System Validation)**

- **Purpose**: End-to-end system validation
- **Example Commands**:
  ```bash
  uv run python main.py &
  curl -f http://localhost:8000/health
  curl -X POST http://localhost:8000/{endpoint} -H "Content-Type: application/json" -d '{"test": "data"}'
  ```
- **Expected**: All integrations working
- **When**: After all components complete

#### **Level 4: Creative & Domain-Specific Validation**

- **Purpose**: Manual/creative validation
- **Characteristics**:
  - Often `manual: true` (command is null)
  - Domain-specific testing
  - Performance, security, load testing
- **Examples**:
  - Playwright MCP for web interfaces
  - Docker MCP for containers
  - Manual E2E workflows
- **Expected**: All creative validations pass

### 3.4 ValidationGate Zod Schema

```typescript
export const ValidationGateSchema: z.ZodType<ValidationGate> = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  description: z.string().min(1, 'Description is required'),
  command: z.string().nullable(),
  manual: z.boolean(),
});
```

---

## 4. Retry and Backoff Logic

### 4.1 Fix-and-Retry Mechanism

**Location**: `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts`

The Coder Agent employs a **fix-and-retry strategy** for validation failures:

1. **Initial Attempt**: Execute implementation
2. **Validation**: Run all 4 validation gates sequentially
3. **On Failure**:
   - Extract validation error details (level, command, stdout, stderr)
   - Prompt agent again with failure context
   - Request fix based on error output
4. **Maximum Attempts**: **2 retries** (3 total attempts including initial)
5. **Exhaustion**: After 2 failed fix attempts, mark PRP as failed

### 4.2 Fix Attempt Prompt

When validation fails, the agent receives:

```json
{
  "result": "issue",
  "message": "Validation failed at Level {level}\nCommand: {command}\nStdout: {stdout}\nStderr: {stderr}\n\nFix the issue and try again."
}
```

### 4.3 Retry Flow Diagram

```
┌─────────────────┐
│ Initial Attempt │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run Validation  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  Pass      Fail
    │         │
    │    ┌────▼────┐
    │    │ Attempt │
    │    │   #1    │
    │    └────┬────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │  Pass      Fail
    │    │         │
    │    │    ┌────▼────┐
    │    │    │ Attempt │
    │    │    │   #2    │
    │    │    └────┬────┘
    │    │         │
    │    │    ┌────┴────┐
    │    │    │         │
    │    │  Pass      Fail
    │    │    │         │
    ▼    ▼    ▼         ▼
  Success        Failure (Exhausted)
```

### 4.4 Backoff Strategy

**Current Implementation**: No explicit backoff (immediate retry)
**Consideration**: Could add exponential backoff for rate limiting

---

## 5. Existing Test Coverage

### 5.1 Unit Tests

#### **`tests/unit/agents/agent-factory.test.ts`**

- ✅ Tests `createCoderAgent()` function
- ✅ Verifies agent name: `CoderAgent`
- ✅ Validates no MCP registration conflicts
- ✅ Tests maxTokens: 4096
- ✅ Tests model: GLM-4.7
- ✅ Tests cache/reflection enabled
- ❌ **Gap**: Does not test PRP_BUILDER_PROMPT content
- ❌ **Gap**: Does not test agent.prompt() behavior

#### **`tests/unit/agents/prp-executor.test.ts`**

- ✅ Comprehensive PRPExecutor class testing
- ✅ Constructor validation
- ✅ Happy path execution
- ✅ Sequential validation gate execution
- ✅ Fix-and-retry mechanism (2 retries)
- ✅ Exhaustion after max attempts
- ✅ Manual gate skipping
- ✅ Error handling (JSON parsing, exceptions)
- ✅ ValidationGateResult interface
- ✅ ExecutionResult interface
- ✅ PRPExecutionError class
- ✅ ValidationError class
- ✅ Mock agent creation
- ✅ Mock BashMCP integration

### 5.2 Integration Tests

#### **`tests/integration/prp-executor-integration.test.ts`**

- Status: File exists (coverage not analyzed in this research)
- Likely tests real PRP execution end-to-end

#### **`tests/integration/agents.test.ts`**

- Status: File exists
- May include Coder Agent integration tests

#### **`tests/integration/architect-agent.test.ts`**

- ✅ Architect Agent integration tests exist
- ❌ **Gap**: No dedicated `coder-agent-integration.test.ts`

### 5.3 Test Gaps Identified

| Area                              | Status     | Gap Description                                          |
| --------------------------------- | ---------- | -------------------------------------------------------- |
| **Prompt Content Validation**     | ❌ Missing | No tests verify PRP_BUILDER_PROMPT has required sections |
| **Prompt Instructions**           | ❌ Missing | No tests validate 4-level validation mentioned in prompt |
| **Real Agent Execution**          | ⚠️ Partial | prp-executor.test.ts mocks the agent                     |
| **MCP Tool Integration**          | ⚠️ Partial | Tests mock BashMCP but don't test real commands          |
| **Validation Gate Execution**     | ✅ Covered | prp-executor.test.ts covers this well                    |
| **Fix-and-Retry Logic**           | ✅ Covered | Tested with 2 retry limit                                |
| **Error Message Format**          | ✅ Covered | Tests verify JSON parsing                                |
| **Manual Gate Skipping**          | ✅ Covered | Tests verify level 4 manual gates skipped                |
| **Subagent Usage**                | ❌ Missing | No tests for subagent spawning during implementation     |
| **PRP File Reading**              | ⚠️ Partial | Not explicitly tested in unit tests                      |
| **Success Criteria Verification** | ❌ Missing | No tests for Final Validation Checklist                  |
| **Anti-Patterns Avoidance**       | ❌ Missing | No tests verify anti-patterns from PRP                   |

### 5.4 E2E Test Coverage

#### **`tests/e2e/pipeline.test.ts`**

- Status: Exists
- May include full pipeline with Coder Agent

#### **`tests/e2e/delta.test.ts`**

- Status: Exists
- Tests delta workflow (may include coder)

---

## 6. Key Implementation Details

### 6.1 PRP Execution Flow

```
┌──────────────────┐
│ 1. Load PRP File │ ← Read PRP from disk
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Parse PRPDoc  │ ← Validate with PRPDocumentSchema
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. Inject PRP    │ ← Replace $PRP_FILE_PATH in prompt
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Call Agent    │ ← agent.prompt(PRP_BUILDER_PROMPT)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. Parse Result  │ ← Extract JSON result/message
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 6. Execute Gates │ ← Run levels 1-4 sequentially
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
  All Pass   Any Fail
    │         │
    │    ┌────▼────┐
    │    │ Trigger │
    │    │ Fix Loop│
    │    └────┬────┘
    │         │
    ▼         ▼
  Success    Failure
```

### 6.2 Error Handling

1. **JSON Parse Errors**: Caught and wrapped in error message
2. **Agent Exceptions**: Caught and returned as `result.error`
3. **Validation Failures**: Trigger fix-and-retry
4. **Exhausted Retries**: Return failure with validation details

### 6.3 Success Criteria

From PRPDocument:

```typescript
readonly successCriteria: SuccessCriterion[];  // Checked in Final Validation
```

Each criterion:

```typescript
interface SuccessCriterion {
  readonly description: string;
  readonly satisfied: boolean; // Updated during execution
}
```

---

## 7. Testing Recommendations

### 7.1 High Priority Gaps

1. **Prompt Validation Test**
   - Verify PRP_BUILDER_PROMPT contains all required sections
   - Test 4-level validation is documented
   - Validate JSON output format specification

2. **Integration Test for Real PRP**
   - Create minimal valid PRP file
   - Execute with real agent (not mocked)
   - Verify file system changes
   - Verify validation gate commands run

3. **Subagent Usage Test**
   - Mock scenario where agent spawns subagents
   - Verify PRP-inspired prompts are created
   - Test parallel execution coordination

### 7.2 Medium Priority

4. **Manual Gate Behavior**
   - Test Level 4 gates with `manual: true`
   - Verify no command execution
   - Verify gate marked as skipped but passed

5. **Success Criteria Tracking**
   - Test that success criteria are checked
   - Verify Final Validation Checklist execution

6. **Anti-Patterns Verification**
   - Create PRP with anti-patterns
   - Verify agent avoids them

### 7.3 Edge Cases

7. **Empty PRP Document**
8. **Malformed PRP (missing sections)**
9. **Validation Gate Command Timeout**
10. **Concurrent PRP Execution**

---

## 8. Dependencies and Integrations

### 8.1 Direct Dependencies

| Module                     | Purpose           | Usage                         |
| -------------------------- | ----------------- | ----------------------------- |
| `groundswell`              | Agent framework   | `createAgent()`, `Agent` type |
| `src/tools/bash-mcp`       | Command execution | Validation gates              |
| `src/tools/filesystem-mcp` | File operations   | Implementation                |
| `src/tools/git-mcp`        | Version control   | Git operations                |
| `src/core/models`          | Type definitions  | PRPDocument, ValidationGate   |

### 8.2 Data Flow

```
PRP File (Disk)
    ↓
PRPExecutor
    ↓
createCoderAgent()
    ↓
Groundswell Agent
    ↓
PRP_BUILDER_PROMPT
    ↓
LLM (GLM-4.7)
    ↓
JSON Result
    ↓
BashMCP (validation)
    ↓
ExecutionResult
```

---

## 9. Configuration File References

| File                                      | Lines     | Purpose                    |
| ----------------------------------------- | --------- | -------------------------- |
| `src/agents/agent-factory.ts`             | 254-263   | `createCoderAgent()`       |
| `src/agents/prompts.ts`                   | 605-685   | `PRP_BUILDER_PROMPT`       |
| `src/core/models.ts`                      | 966-1073  | `ValidationGate` interface |
| `src/core/models.ts`                      | 1148-1305 | `PRPDocument` interface    |
| `PROMPTS.md`                              | 641-714   | PRP_EXECUTE_PROMPT source  |
| `tests/unit/agents/agent-factory.test.ts` | 211-215   | Coder agent creation test  |
| `tests/unit/agents/prp-executor.test.ts`  | 1-610     | PRPExecutor tests          |

---

## 10. Summary and Next Steps

### 10.1 What's Working

✅ Factory configuration is well-tested
✅ Validation gate execution is comprehensive
✅ Fix-and-retry mechanism is tested
✅ Error handling is robust
✅ MCP tool integration is validated

### 10.2 What Needs Testing

❌ **Prompt Content**: Validate PRP_BUILDER_PROMPT structure
❌ **Real Execution**: Test with actual agent (not mocked)
❌ **Subagent Coordination**: Test parallel work scenarios
❌ **Success Criteria**: Verify Final Validation Checklist
❌ **Anti-Patterns**: Test avoidance of common pitfalls

### 10.3 Recommended Test Implementation Priority

1. **P1**: Prompt validation test (quick win, high value)
2. **P1**: Real PRP execution integration test
3. **P2**: Subagent usage test
4. **P2**: Success criteria verification test
5. **P3**: Anti-patterns avoidance test

---

## Appendix A: Validation Gate Example

```typescript
const validationGates: ValidationGate[] = [
  {
    level: 1,
    description: 'Syntax & Style validation',
    command: 'npm run lint && npm run format:check',
    manual: false,
  },
  {
    level: 2,
    description: 'Unit Tests',
    command: 'npm test -- --coverage',
    manual: false,
  },
  {
    level: 3,
    description: 'Integration Testing',
    command: 'npm run test:integration',
    manual: false,
  },
  {
    level: 4,
    description: 'Manual E2E validation',
    command: null,
    manual: true,
  },
];
```

---

## Appendix B: PRPDocument Example

```typescript
const prp: PRPDocument = {
  taskId: 'P1.M2.T2.S2',
  objective: 'Add user authentication API endpoints',
  context: '## All Needed Context\n\n...',
  implementationSteps: [
    'Create AuthService class',
    'Implement login endpoint',
    'Implement logout endpoint',
    'Add JWT middleware',
  ],
  validationGates: [
    /* see Appendix A */
  ],
  successCriteria: [
    { description: 'Login endpoint returns valid JWT', satisfied: false },
    { description: 'Logout invalidates session', satisfied: false },
    { description: 'Unit tests cover all auth flows', satisfied: false },
  ],
  references: ['https://jwt.io/introduction', 'src/api/existing-endpoints.ts'],
};
```

---

**End of Research Document**
