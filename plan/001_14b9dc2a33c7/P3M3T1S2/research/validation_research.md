# Research Summary: Progressive Validation & PRP Execution

## 1. Previous PRP (P3.M3.T1.S1) Outputs

### PRPGenerator Class Contract
- **Location**: `src/agents/prp-generator.ts`
- **Method**: `async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument>`
- **Output File**: `{sessionPath}/prps/{taskId}.md`
- **Uses**: `createResearcherAgent()` and `createPRPBlueprintPrompt()`

### PRPDocument Structure (from src/core/models.ts)
```typescript
interface PRPDocument {
  readonly taskId: string;
  readonly objective: string;
  readonly context: string;
  readonly implementationSteps: string[];
  readonly validationGates: ValidationGate[];
  readonly successCriteria: SuccessCriterion[];
  readonly references: string[];
}

interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly command: string | null;
  readonly manual: boolean;
}
```

## 2. Coder Agent Implementation

### createCoderAgent() (from src/agents/agent-factory.ts)
- **System Prompt**: `PRP_BUILDER_PROMPT`
- **Model**: GLM-4.7 (sonnet tier)
- **Max Tokens**: 4096
- **MCP Tools**: BashMCP, FilesystemMCP, GitMCP

### PRP_BUILDER_PROMPT Key Instructions
1. Load PRP file first (CRITICAL FIRST STEP)
2. ULTRATHINK & Plan with TodoWrite tool
3. Execute Implementation following PRP tasks
4. Progressive Validation (4 levels from PRP)
5. Completion Verification
6. Output JSON: `{result: "success" | "error" | "issue", message: string}`

## 3. BashMCP Command Execution Pattern

### execute_bash Tool (from src/tools/bash-mcp.ts)
- **Tool Name**: `bash__execute_bash`
- **Parameters**:
  - `command`: string (shell command to execute)
  - `cwd`: string (working directory)
  - `timeout`: number (1-300000ms, default 30000ms)
- **Security**: Uses `spawn()` with `shell: false`
- **Return**: `BashToolResult` with success, stdout, stderr, exitCode, error

### Usage Pattern
```typescript
const result = await bashMCP.execute_bash({
  command: 'npm test',
  cwd: process.cwd(),
  timeout: 120000
});
// result.success === (exitCode === 0)
```

## 4. Existing Retry Logic Pattern

### From PRPGenerator (P3M3.T1.S1 PRP)
- **Max Retries**: 3
- **Base Delay**: 1000ms
- **Max Delay**: 30000ms
- **Backoff**: Exponential with jitter
- **Pattern**: `Math.min(baseDelay * Math.pow(2, attempt), maxDelay)`

## 5. External Research Findings

### Progressive Validation Best Practices
- **Fail Fast**: Run cheapest checks first (syntax → lint → type → tests)
- **Sequential Gates**: Each level must pass before proceeding
- **Fix and Retry**: On validation failure, provide error context and retry
- **Hierarchical Fix**: Start with simple tweaks, escalate if needed

### Fix-and-Retry Pattern References
- **SWE-Agent**: Autonomous coding with command execution and feedback
- **OpenDevin**: State management for multi-step execution
- **AWS Exponential Backoff**: Jitter to prevent thundering herd

### Key URLs
- https://eslint.org/docs/latest/use/node-api - ESLint Node.js API
- https://vitest.dev/guide/why.html - Vitest testing patterns
- https://github.com/princeton-nlp/SWE-agent - SWE-agent implementation
- https://docs.anthropic.com/claude/docs/tool-use - Claude tool use with feedback

## 6. Codebase Validation Patterns

### Test Framework
- **Framework**: Vitest (from vitest.config.ts)
- **Coverage**: 100% requirement
- **Pattern**: `describe/it/expect` syntax

### Type Checking
- **Tool**: TypeScript (tsc)
- **Config**: Strict mode enabled
- **Command**: `npm run check`

### Linting
- **Tool**: ESLint with TypeScript
- **Config**: `.eslintrc.json`
- **Command**: `npm run lint`

## 7. Key Constraints & Gotchas

1. **ES Module Imports**: Use `.js` extensions even for `.ts` files
2. **configureEnvironment()**: Already called at module load in agent-factory.ts
3. **Agent.prompt()**: Returns `z.infer<typeof Schema>`, not raw response
4. **BashMCP Security**: Always use argument arrays, never shell interpretation
5. **Session Path**: Check `currentSession` is not null before accessing
6. **PRP File Path**: Format `{sessionPath}/prps/{taskId}.md` with dots removed
