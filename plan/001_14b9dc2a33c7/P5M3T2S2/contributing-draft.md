# Contributing to PRP Pipeline

Thank you for your interest in contributing to the PRP Pipeline! This guide will help you get started with contributing effectively, whether you're adding features, fixing bugs, or improving documentation.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Code Organization](#code-organization)
- [Testing Guide](#testing-guide)
- [Code Style](#code-style)
- [Adding New Agent Personas](#adding-new-agent-personas)
- [Adding New MCP Tools](#adding-new-mcp-tools)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Getting Help](#getting-help)

---

## Quick Start

Get up and running in 5 commands:

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/hacky-hack.git
cd hacky-hack

# 2. Install dependencies
npm install

# 3. Set up your API key
export ANTHROPIC_AUTH_TOKEN="your-api-key-here"

# 4. Run tests
npm test

# 5. Run validation
npm run validate
```

That's it! You're ready to start contributing. For more detailed setup instructions, see the [Development Setup](#development-setup) section below.

---

## Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Git**: Latest stable version

Verify your versions:

```bash
node --version  # Should be v20.0.0 or higher
npm --version   # Should be 10.0.0 or higher
git --version
```

### Installation

1. **Fork and Clone the Repository**

   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/hacky-hack.git
   cd hacky-hack
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**

   Create a `.env` file or export the required environment variable:

   ```bash
   export ANTHROPIC_AUTH_TOKEN="your-api-key-here"
   ```

   Optionally, set a custom base URL:

   ```bash
   export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
   ```

4. **Verify Your Setup**

   ```bash
   # Run tests to ensure everything works
   npm test

   # Run validation to check code quality
   npm run validate
   ```

### Troubleshooting

**Issue: `npm install` fails with Node.js version error**

```bash
# Solution: Ensure you're using Node.js >= 20.0.0
nvm install 20
nvm use 20
```

**Issue: Tests fail with `ANTHROPIC_AUTH_TOKEN` not found**

```bash
# Solution: Export the environment variable
export ANTHROPIC_AUTH_TOKEN="your-api-key-here"
```

**Issue: `tsc` compilation errors**

```bash
# Solution: Run typecheck to see specific errors
npm run typecheck
```

---

## Code Organization

Understanding the codebase structure is key to contributing effectively.

### Source Directory (`src/`)

```bash
src/
├── agents/                  # Agent implementations and factory
│   ├── prompts/             # Agent system prompts
│   ├── agent-factory.ts     # Agent creation (architect, researcher, coder, qa)
│   ├── prp-generator.ts     # PRP Generator agent
│   ├── prp-executor.ts      # PRP Executor agent
│   └── prp-runtime.ts       # PRP Runtime orchestrator
├── cli/
│   └── index.ts             # CLI entry point
├── config/
│   ├── constants.ts         # Project constants
│   ├── environment.ts       # Environment configuration
│   └── types.ts             # Type definitions
├── core/
│   ├── models.ts            # Task hierarchy types (StatusEnum, ItemTypeEnum)
│   ├── session-manager.ts   # Session state management with batch updates
│   ├── task-orchestrator.ts # Task execution orchestration
│   └── research-queue.ts    # Parallel PRP research queue
├── tools/
│   ├── bash-mcp.ts          # Bash command execution MCP tool
│   ├── filesystem-mcp.ts    # Filesystem operations MCP tool
│   └── git-mcp.ts           # Git operations MCP tool
├── utils/
│   ├── logger.ts            # Structured logging (pino)
│   ├── progress.ts          # Progress tracking
│   └── git-commit.ts        # Smart commit message generation
└── workflows/
    └── prp-pipeline.ts      # Main pipeline workflow
```

### Key Files and Responsibilities

| Directory/File                | Purpose                                          |
| ----------------------------- | ------------------------------------------------ |
| `src/agents/`                 | Agent personas and PRP generation/execution      |
| `src/core/models.ts`          | Core type definitions for tasks and sessions     |
| `src/core/session-manager.ts` | Session state persistence with atomic writes     |
| `src/tools/`                  | MCP tool implementations (bash, filesystem, git) |
| `tests/`                      | Test suite mirroring `src/` structure            |

### Tests Directory (`tests/`)

```bash
tests/
├── unit/                    # Unit tests (mirrors src/ structure)
│   ├── agents/              # Agent tests
│   ├── core/                # Core logic tests
│   ├── tools/               # MCP tool tests
│   └── utils/               # Utility function tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
├── manual/                  # Manual validation tests
└── fixtures/                # Test data fixtures
```

**For detailed architecture documentation**, see [docs/architecture.md](docs/architecture.md).

---

## Testing Guide

The PRP Pipeline uses **Vitest** as its testing framework with **100% code coverage** requirement.

### Test Types

1. **Unit Tests**: Test individual functions/classes in isolation
2. **Integration Tests**: Test interactions between components
3. **E2E Tests**: Test complete workflows end-to-end
4. **Manual Tests**: Validation requiring human intervention

### Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests and bail on first failure
npm run test:bail

# Run specific test file
npm test -- path/to/test.test.ts
```

### Writing Tests

Tests follow the **AAA pattern** (Arrange, Act, Assert) and use Vitest's mocking utilities.

**Example Unit Test** (from `tests/unit/agents/agent-factory.test.ts`):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBaseConfig } from '../../../src/agents/agent-factory.js';

describe('Agent Factory', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
  });

  it('should set maxTokens to 8192 for architect persona', () => {
    // Arrange & Act
    const config = createBaseConfig('architect');

    // Assert
    expect(config.maxTokens).toBe(8192);
  });
});
```

### Mocking Patterns

**Module-level mocking** (must be at top level):

```typescript
// WRONG - inside describe block
describe('test', () => {
  vi.mock('./foo.js'); // Too late!
});

// CORRECT - at top level
vi.mock('./foo.js');
describe('test', () => {
  // tests here
});
```

**Environment variable stubbing**:

```typescript
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

### Coverage Requirements

This project enforces **100% code coverage** for all metrics:

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

Run coverage before committing:

```bash
npm run test:coverage
```

See [vitest.config.ts](../vitest.config.ts) for the complete configuration.

---

## Code Style

The PRP Pipeline uses ESLint, Prettier, and TypeScript strict mode to maintain code quality.

### ESLint

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

**Key ESLint Rules** (from [`.eslintrc.json`](../.eslintrc.json)):

- `@typescript-eslint/no-floating-promises`: All async operations must be awaited or explicitly voided
- `@typescript-eslint/no-unused-vars`: No unused variables (prefix with `_` to ignore)
- `prettier/prettier`: Prettier formatting enforced

### Prettier

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

**Key Prettier Rules** (from [`.prettierrc`](../.prettierrc)):

- **Print width**: 80 characters (stricter than typical 100)
- **Single quotes**: `true`
- **Semicolons**: `true`
- **Trailing commas**: ES5

### TypeScript

```bash
# Type checking without emitting files
npm run typecheck

# Watch mode for type checking
npm run typecheck:watch
```

**TypeScript Strict Mode**: This project uses `"strict": true` in `tsconfig.json`. All types must be properly annotated—no implicit `any`, no unsafe `this`, no unsafe assignment.

### Combined Validation

Run all checks at once:

```bash
# Run linting, formatting check, and typecheck
npm run validate

# Fix linting and formatting issues
npm run fix
```

### ESM Modules with .js Extensions

This project uses `"type": "module"` in `package.json`. Import statements must use `.js` extensions (not `.ts`):

```typescript
// Correct
import { foo } from './bar.js';

// WRONG - will fail at runtime
import { foo } from './bar.ts';
```

---

## Adding New Agent Personas

Agent personas define the behavior and capabilities of different AI agents in the pipeline. This section shows you how to add a new persona.

### When to Add a New Persona

Add a new persona when you need an agent with:

- A distinct role not covered by existing personas (architect, researcher, coder, qa)
- Specialized system prompts for a specific task
- Unique token limits or model requirements

### Step-by-Step Process

**Step 1: Define the System Prompt**

Create a new prompt file in `src/agents/prompts/`:

```typescript
// src/agents/prompts.ts
export const NEW_PERSONA_PROMPT = `
You are a [persona description].

Your role is to [specific responsibilities].

[Additional instructions and constraints]
`;
```

**Step 2: Create the Factory Function**

Add a factory function in `src/agents/agent-factory.ts`:

```typescript
// src/agents/agent-factory.ts

import { NEW_PERSONA_PROMPT } from './prompts.js';

export function createNewPersonaAgent(): Agent {
  const baseConfig = createBaseConfig('new-persona');
  const config = {
    ...baseConfig,
    system: NEW_PERSONA_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug(
    { persona: 'new-persona', model: config.model },
    'Creating agent'
  );
  return createAgent(config);
}
```

**Step 3: Update the Agent Persona Type**

Add the new persona to the `AgentPersona` type:

```typescript
// src/agents/agent-factory.ts

export type AgentPersona =
  | 'architect'
  | 'researcher'
  | 'coder'
  | 'qa'
  | 'new-persona'; // Add new persona
```

**Step 4: Add Token Limit**

Define the token limit for the new persona:

```typescript
// src/agents/agent-factory.ts

const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
  'new-persona': 4096, // Add token limit
} as const;
```

**Complete Example** (from `src/agents/agent-factory.ts`):

```typescript
export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug({ persona: 'architect', model: config.model }, 'Creating agent');
  return createAgent(config);
}
```

### Testing the New Agent

Create a unit test in `tests/unit/agents/agent-factory.test.ts`:

```typescript
it('should create new persona agent', () => {
  const agent = createNewPersonaAgent();
  expect(agent).toBeDefined();
});
```

---

## Adding New MCP Tools

MCP (Model Context Protocol) tools extend agent capabilities with external functionality. This section shows you how to add a new MCP tool.

### When to Add a New Tool

Add a new tool when you need agents to:

- Execute system commands not covered by existing tools
- Interact with external APIs or services
- Perform specialized operations

### Step-by-Step Process

**Step 1: Create the Tool File**

Create a new file in `src/tools/`:

```bash
touch src/tools/my-tool-mcp.ts
```

**Step 2: Extend MCPHandler**

Create your tool class by extending `MCPHandler`:

```typescript
// src/tools/my-tool-mcp.ts

import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

interface MyToolInput {
  parameter: string;
}

interface MyToolResult {
  success: boolean;
  result: string;
}

const myTool: Tool = {
  name: 'my_tool',
  description: 'Description of what this tool does',
  input_schema: {
    type: 'object',
    properties: {
      parameter: {
        type: 'string',
        description: 'Description of the parameter',
      },
    },
    required: ['parameter'],
  },
};

async function executeMyTool(input: MyToolInput): Promise<MyToolResult> {
  // Implement your tool logic here
  return {
    success: true,
    result: `Processed: ${input.parameter}`,
  };
}

export class MyToolMCP extends MCPHandler {
  constructor() {
    super();

    // Register the server
    this.registerServer({
      name: 'my-tool',
      transport: 'inprocess',
      tools: [myTool],
    });

    // Register the tool executor
    this.registerToolExecutor(
      'my-tool',
      'my_tool',
      executeMyTool as ToolExecutor
    );
  }

  // Optional: Direct method for non-MCP usage
  async my_tool(input: MyToolInput): Promise<MyToolResult> {
    return executeMyTool(input);
  }
}

export type { MyToolInput, MyToolResult };
```

**Step 3: Register with Agent Factory**

Add your tool to the `MCP_TOOLS` array in `src/agents/agent-factory.ts`:

```typescript
// src/agents/agent-factory.ts

import { BashMCP } from '../tools/bash-mcp.js';
import { FilesystemMCP } from '../tools/filesystem-mcp.js';
import { GitMCP } from '../tools/git-mcp.js';
import { MyToolMCP } from '../tools/my-tool-mcp.js'; // Import new tool

const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();
const MY_TOOL_MCP = new MyToolMCP(); // Instantiate new tool

const MCP_TOOLS = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP, MY_TOOL_MCP] as const;
```

**Complete Example** (from `src/tools/bash-mcp.ts`):

```typescript
export class BashMCP extends MCPHandler {
  constructor() {
    super();

    this.registerServer({
      name: 'bash',
      transport: 'inprocess',
      tools: [bashTool],
    });

    this.registerToolExecutor(
      'bash',
      'execute_bash',
      executeBashCommand as ToolExecutor
    );
  }

  async execute_bash(input: BashToolInput): Promise<BashToolResult> {
    return executeBashCommand(input);
  }
}
```

### Testing the New Tool

Create a unit test in `tests/unit/tools/my-tool-mcp.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MyToolMCP } from '../../../src/tools/my-tool-mcp.js';

describe('MyToolMCP', () => {
  it('should execute tool successfully', async () => {
    const tool = new MyToolMCP();
    const result = await tool.my_tool({ parameter: 'test' });
    expect(result.success).toBe(true);
  });
});
```

---

## Pull Request Process

Follow this process when submitting changes to the PRP Pipeline.

### Forking and Cloning

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/hacky-hack.git
   cd hacky-hack
   ```

3. **Add the upstream remote**:

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/hacky-hack.git
   ```

### Branch Naming

Use descriptive branch names with prefixes:

| Prefix      | Usage            | Example                    |
| ----------- | ---------------- | -------------------------- |
| `feature/`  | New features     | `feature/add-new-persona`  |
| `fix/`      | Bug fixes        | `fix/session-leak`         |
| `docs/`     | Documentation    | `docs/update-contributing` |
| `refactor/` | Code refactoring | `refactor/agent-factory`   |
| `test/`     | Test changes     | `test/add-coverage`        |

```bash
git checkout -b feature/your-feature-name
```

### Commit Format

Use conventional commit format:

```
type: description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```bash
git commit -m "feat: add reviewer agent persona"
git commit -m "fix: resolve session state leak"
git commit -m "docs: update contributing guide"
```

### Running Tests Before Pushing

Always run tests and validation before pushing:

```bash
# Run all tests
npm test

# Run validation
npm run validate

# Run coverage
npm run test:coverage
```

### Creating the Pull Request

1. **Push your branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a PR** on GitHub with:
   - Clear title summarizing changes
   - Description with:
     - What was changed and why
     - Links to related issues
     - Screenshots (if applicable)
     - Checklist of completed tasks

3. **Wait for CI/CD checks** to pass:
   - All tests must pass
   - Code coverage must be 100%
   - Linting must pass
   - Type checking must pass

4. **Address review feedback** and make necessary updates

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Test addition

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Coverage maintained at 100%

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

---

## Release Process

The PRP Pipeline follows semantic versioning for releases.

### Versioning Strategy

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### Release Steps

1. **Update version** in `package.json`:

   ```bash
   npm version patch  # or minor, or major
   ```

2. **Generate release notes** summarizing changes

3. **Create a git tag**:

   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

4. **Create GitHub release** with:
   - Version number and tag
   - Release notes
   - Upgrade instructions

### Release Notes

Release notes should include:

- Summary of changes
- New features
- Bug fixes
- Breaking changes (if any)
- Migration guide (if breaking changes)

---

## Getting Help

We want to help you contribute successfully!

### Resources

- **[README.md](../README.md)**: Project overview and quick start
- **[docs/user-guide.md](docs/user-guide.md)**: User-facing documentation
- **[docs/architecture.md](docs/architecture.md)**: Technical architecture details
- **[PRD.md](../PRD.md)**: Master requirements document

### Asking Questions

- **GitHub Issues**: Use for bug reports and feature requests
- **GitHub Discussions**: Use for questions and community discussions
- **Pull Requests**: Use for code changes and improvements

### Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

---

**Happy contributing!** Thank you for helping improve the PRP Pipeline.
