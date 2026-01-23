# Agent System Architecture Analysis

## Agent Personas

### 1. Architect Agent
**Role**: Lead Technical Architect & Project Synthesizer
**Token Limit**: 8192
**Prompt**: TASK_BREAKDOWN_PROMPT
**Responsibilities**:
- Validates PRD through research
- Decomposes into Phase > Milestone > Task > Subtask hierarchy
- Performs codebase feasibility validation
- Stores findings in `$SESSION_DIR/architecture/`

### 2. Researcher Agent (PRP Generator)
**Role**: Context Curation Specialist
**Token Limit**: 4096
**Prompt**: PRP_BLUEPRINT_PROMPT
**Responsibilities**:
- Multi-scale research (codebase, internal, external)
- "No Prior Knowledge" test validation
- Creates implementation-focused PRPs
- Ensures information density standards

### 3. Coder Agent (PRP Executor)
**Role**: Implementation Specialist
**Token Limit**: 4096
**Prompt**: PRP_BUILDER_PROMPT
**Responsibilities**:
- Executes PRP specifications
- Follows existing patterns
- Runs progressive validation gates
- Fix-and-retry logic

### 4. QA Agent
**Role**: Creative Bug Hunter
**Token Limit**: 4096
**Prompt**: BUG_HUNT_PROMPT
**Responsibilities**:
- E2E validation against PRD
- Creative bug finding
- Generates structured bug reports
- Controls bugfix pipeline

## Prompt Templates

All prompts imported from `PROMPTS.md`:
- `TASK_BREAKDOWN_PROMPT`: Architect persona
- `PRP_BLUEPRINT_PROMPT`: Researcher persona
- `PRP_BUILDER_PROMPT`: Coder persona
- `BUG_HUNT_PROMPT`: QA persona
- `DELTA_ANALYSIS_PROMPT`: Change management

## Tool System

### MCP Tools
1. **BashMCP**: Shell command execution
2. **FilesystemMCP**: File operations
3. **GitMCP**: Git operations

### Tool Registration Pattern
```typescript
const MCP_TOOLS: MCPServer[] = [
  new BashMCP(),
  new FilesystemMCP(),
  new GitMCP()
];

// All agents receive same tools
const config = {
  ...baseConfig,
  mcps: MCP_TOOLS,
};
```

## Validation Gates (4-Level)

### Level 1: Syntax & Style
```bash
ruff check src/{new_files} --fix
mypy src/{new_files}
ruff format src/{new_files}
```

### Level 2: Unit Tests
```bash
uv run pytest src/ -v
uv run pytest src/ --cov=src
```

### Level 3: Integration Testing
```bash
uv run python main.py
curl -f http://localhost:8000/health
```

### Level 4: Creative & Domain-Specific
```bash
playwright-mcp --url http://localhost:8000
bandit -r src/
```

## Agent Creation Pattern

```typescript
interface AgentConfig {
  readonly name: string;
  readonly system: string;
  readonly model: string;           // GLM-4.7 for all
  readonly enableCache: boolean;    // true
  readonly enableReflection: boolean; // true
  readonly maxTokens: number;       // Persona-specific
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly ANTHROPIC_BASE_URL: string;
  };
}
```
