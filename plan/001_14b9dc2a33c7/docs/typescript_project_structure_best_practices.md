# TypeScript Project Directory Structure Best Practices for AI/Agent-Based Projects

**Research Date:** January 12, 2026
**Focus:** AI/Agent projects, TypeScript 5.2+, Node.js 20+, MCP/Groundswell patterns

---

## Table of Contents

1. [Core TypeScript Project Structure Patterns](#core-typescript-project-structure-patterns)
2. [AI/Agent-Specific Directory Patterns](#aiagent-specific-directory-patterns)
3. [Industry Examples & Reference Architectures](#industry-examples--reference-architectures)
4. [.gitignore Best Practices](#gitignore-best-practices)
5. [Groundswell/MCP-Specific Patterns](#groundswellmcp-specific-patterns)
6. [Recommended Structure for Agent Projects](#recommended-structure-for-agent-projects)
7. [Key Documentation URLs](#key-documentation-urls)

---

## Core TypeScript Project Structure Patterns

### Standard Modern TypeScript Structure (2024-2025)

Based on industry best practices and TypeScript 5.2+ recommendations:

```
project-root/
├── src/                      # Source code
│   ├── index.ts              # Entry point
│   ├── lib/                  # Core library code
│   ├── services/             # Business logic services
│   ├── utils/                # Utility functions
│   ├── types/                # TypeScript type definitions
│   ├── config/               # Configuration files
│   └── constants/            # Constants and enums
├── tests/                    # Test files (mirroring src/)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── dist/                     # Compiled output (gitignored)
├── build/                    # Build artifacts (gitignored)
├── docs/                     # Project documentation
├── scripts/                  # Build/utility scripts
├── tools/                    # Development tools
├── .vscode/                  # VS Code settings (if committed)
├── package.json              # Project metadata
├── tsconfig.json             # TypeScript configuration
├── tsconfig.build.json       # Build-specific config
├── tsconfig.test.json        # Test-specific config
├── .gitignore                # Git ignore patterns
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── README.md                 # Project documentation
└── LICENSE                   # License file
```

### Key Principles

1. **Separation of Concerns**
   - Keep source code separate from tests
   - Separate configuration from implementation
   - Distinguish between library code and application entry points

2. **Feature-Based vs Layer-Based Organization**
   - **Layer-Based**: Group by technical concern (services, controllers, models)
   - **Feature-Based**: Group by business feature (recommended for larger projects)
   - **Hybrid**: Start layer-based, migrate to feature-based as project grows

3. **Barrel Exports (index.ts)**
   - Use `index.ts` files to create clean public APIs
   - Simplify imports: `import { Foo } from './lib'` instead of `'./lib/foo'`
   - Enable better tree-shaking

4. **Test Mirroring**
   - Mirror `src/` structure in `tests/` for easier navigation
   - Keep test files close to source (co-located) or in separate `tests/` directory
   - Use `.test.ts` or `.spec.ts` suffixes

---

## AI/Agent-Specific Directory Patterns

### LangChain TypeScript Structure Pattern

Based on LangChain.js organization:

```
langchain-project/
├── src/
│   ├── agents/               # Custom agent implementations
│   │   ├── index.ts
│   │   ├── base.ts
│   │   └── types.ts
│   ├── chains/               # Chain definitions and compositions
│   │   ├── index.ts
│   │   └── types.ts
│   ├── prompts/              # Prompt templates and management
│   │   ├── index.ts
│   │   ├── templates/
│   │   └── types.ts
│   ├── tools/                # Custom tools/functions
│   │   ├── index.ts
│   │   └── types.ts
│   ├── memory/               # Memory implementations
│   │   ├── index.ts
│   │   └── types.ts
│   ├── models/               # Model configurations
│   │   ├── index.ts
│   │   └── types.ts
│   ├── embeddings/           # Embedding utilities
│   │   └── index.ts
│   ├── vectorstores/         # Vector database integrations
│   │   └── index.ts
│   ├── utils/                # Shared utilities
│   └── config.ts             # Central configuration
├── tests/                    # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── examples/                 # Usage examples
└── prompts/                  # Stored prompt templates (if external)
```

### Agent Workflow Pattern

For autonomous agent systems:

```
agent-project/
├── src/
│   ├── agents/               # Agent implementations
│   │   ├── base/
│   │   │   ├── Agent.ts      # Base agent class
│   │   │   └── types.ts
│   │   ├── architect/        # Architect agent
│   │   ├── researcher/       # Researcher agent
│   │   ├── coder/            # Coder agent
│   │   └── qa/               # QA agent
│   ├── workflows/            # Workflow definitions
│   │   ├── base/
│   │   │   ├── Workflow.ts
│   │   │   └── types.ts
│   │   ├── pipeline/
│   │   │   └── MainWorkflow.ts
│   │   └── tasks/
│   │       └── TaskWorkflow.ts
│   ├── tools/                # Agent tools
│   │   ├── bash/
│   │   ├── file/
│   │   ├── search/
│   │   └── web/
│   ├── prompts/              # Prompt templates
│   │   ├── system/
│   │   │   ├── architect.md
│   │   │   ├── researcher.md
│   │   │   └── coder.md
│   │   └── templates/
│   ├── state/                # State management
│   │   ├── Session.ts
│   │   ├── TaskRegistry.ts
│   │   └── types.ts
│   ├── services/             # Business logic
│   │   ├── TaskOrchestrator.ts
│   │   ├── SessionManager.ts
│   │   └── AgentRuntime.ts
│   ├── utils/                # Utilities
│   │   ├── logger.ts
│   │   ├── hash.ts
│   │   └── validation.ts
│   ├── config/               # Configuration
│   │   ├── index.ts
│   │   └── env.ts
│   ├── types/                # Shared types
│   │   ├── agents.ts
│   │   ├── tasks.ts
│   │   └── workflows.ts
│   └── index.ts              # Main entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── sessions/                 # Agent session data (gitignored)
│   └── .gitkeep
├── plan/                     # Plan/session directories
│   └── .gitkeep
└── docs/
    └── .gitkeep
```

### Key AI/Agent Patterns

1. **Agent Hierarchy**
   - Base agent class with shared functionality
   - Specialized agents for different personas (Architect, Coder, QA)
   - Clear separation between agent logic and tools

2. **Prompt Management**
   - System prompts in `prompts/system/`
   - Prompt templates in `prompts/templates/`
   - Separate prompt files for easier iteration

3. **Tool Organization**
   - Group tools by domain (bash, file, search, web)
   - Each tool has its own directory with types
   - Central tool registry

4. **State Management**
   - Dedicated `state/` directory for state objects
   - Clear separation between transient and persistent state
   - Type definitions co-located with state classes

5. **Workflow Orchestration**
   - Base workflow class
   - Separate workflows for different processes
   - Task workflows as sub-workflows

---

## Industry Examples & Reference Architectures

### Vercel AI SDK Pattern

```
ai-sdk-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   └── MessageList.tsx
│   └── lib/
│       └── utils.ts
├── public/
└── .env.local
```

**Key Takeaways:**

- API routes in `app/api/` (Next.js App Router pattern)
- Components separate from utilities
- Environment variables in `.env.local`

### TypeScript Project Best Practices (Microsoft)

Based on official TypeScript documentation:

1. **Root Directory Structure**
   - `src/` for all source code
   - `dist/` for compiled output
   - Separate configuration files at root

2. **Module Organization**
   - Use `package.json` `exports` field for entry points
   - Subpath exports for internal modules
   - Clear public API with `index.ts` barrel files

3. **Build Configuration**
   - Multiple `tsconfig` files for different contexts
   - `tsconfig.base.json` for shared options
   - `tsconfig.build.json` for production builds
   - `tsconfig.test.json` for test configuration

---

## .gitignore Best Practices

### Comprehensive .gitignore for TypeScript Node.js Projects

```gitignore
# ============================================
# Dependencies
# ============================================
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml
npm-shrinkwrap.json

# ============================================
# Build Outputs
# ============================================
dist/
build/
*.tsbuildinfo
*.d.ts.map
*.js.map
*.mjs.map
*.cjs.map

# ============================================
# Environment Files
# ============================================
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# ============================================
# Testing & Coverage
# ============================================
coverage/
.nyc_output/
*.lcov
test-results/
junit.xml

# ============================================
# IDE & Editor Files
# ============================================
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db
*.sublime-project
*.sublime-workspace

# ============================================
# Logs
# ============================================
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# ============================================
# Runtime Data
# ============================================
pids/
*.pid
*.seed
*.pid.lock

# ============================================
# Optional npm Cache
# ============================================
.npm
.eslintcache

# ============================================
# TypeScript Specific
# ============================================
# Type definition files that are generated
*.d.ts
!src/**/*.d.ts

# ============================================
# AI/Agent Specific
# ============================================
# Agent session data
sessions/
*.session.json
*.session.cache

# LLM API cache
.cache/
.llm_cache/

# Temporary agent artifacts
.temp/
tmp/

# ============================================
# OS Files
# ============================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# ============================================
# Build Tools
# ============================================
# Webpack
.webpack/

# Vite
.vite/

# Parcel
.cache/
.parcel-cache/

# ============================================
# Misc
# ============================================
*.tgz
*.tar.gz
vendor/
venv/
__pycache__/
*.pyc

# ============================================
# Project-Specific (Keep)
# ============================================
# But keep plan/ directory structure
!plan/
!plan/**/

# Keep documentation
!docs/
!docs/**/

# Keep PRD
!PRD.md
!PROMPTS.md
```

### .gitignore Best Practices

1. **Dependencies**
   - Always ignore `node_modules/`
   - Ignore lock files only if project requires clean installs (rare)
   - Keep lock files for reproducible builds

2. **Build Artifacts**
   - Ignore all build output directories (`dist/`, `build/`)
   - Ignore TypeScript build info files (`*.tsbuildinfo`)
   - Ignore source maps

3. **Environment Files**
   - Never commit `.env` files
   - Ignore all `.env.*.local` files
   - Provide `.env.example` as template

4. **Test Coverage**
   - Ignore coverage directories
   - Ignore test result files

5. **IDE Files**
   - Ignore all editor-specific files
   - Exception: Commit `.vscode/` settings for team consistency

6. **AI/Agent Specific**
   - Ignore session directories
   - Ignore LLM cache
   - Ignore temporary agent artifacts
   - Keep plan/ directory structure for audit trail

7. **Documentation**
   - Keep documentation files
   - Use `.gitignore` to exclude only generated docs

---

## Groundswell/MCP-Specific Patterns

### Groundswell Project Structure

Based on Groundswell framework patterns and MCP (Model Context Protocol):

```
groundswell-agent-project/
├── src/
│   ├── workflows/            # Groundswell workflow definitions
│   │   ├── base/
│   │   │   ├── Workflow.ts   # Base workflow class
│   │   │   └── types.ts
│   │   ├── MainWorkflow.ts   # Main pipeline workflow
│   │   └── tasks/
│   │       └── TaskWorkflow.ts
│   ├── agents/               # Agent implementations
│   │   ├── base/
│   │   │   ├── Agent.ts
│   │   │   └── types.ts
│   │   ├── architect/
│   │   │   ├── ArchitectAgent.ts
│   │   │   └── prompts.ts
│   │   ├── researcher/
│   │   ├── coder/
│   │   └── qa/
│   ├── tools/                # MCP tools
│   │   ├── mcp/
│   │   │   ├── MCPHandler.ts
│   │   │   └── types.ts
│   │   ├── bash/
│   │   │   ├── BashTool.ts
│   │   │   └── schema.ts
│   │   ├── file/
│   │   │   ├── FileTool.ts
│   │   │   └── schema.ts
│   │   ├── search/
│   │   │   ├── GrepTool.ts
│   │   │   ├── GlobTool.ts
│   │   │   └── schema.ts
│   │   └── web/
│   │       ├── WebSearchTool.ts
│   │       └── schema.ts
│   ├── state/                # Observed state
│   │   ├── Session.ts
│   │   ├── TaskRegistry.ts
│   │   └── types.ts
│   ├── services/             # Business logic services
│   │   ├── SessionManager.ts
│   │   ├── TaskOrchestrator.ts
│   │   ├── AgentRuntime.ts
│   │   └── ConfigService.ts
│   ├── prompts/              # Prompt templates
│   │   ├── system/
│   │   │   ├── task_breakdown.md
│   │   │   ├── prp_creation.md
│   │   │   ├── prp_execution.md
│   │   │   ├── delta_prd.md
│   │   │   └── bug_hunting.md
│   │   └── templates/
│   ├── utils/                # Utilities
│   │   ├── logger.ts
│   │   ├── hash.ts
│   │   ├── file.ts
│   │   └── validation.ts
│   ├── config/               # Configuration
│   │   ├── index.ts
│   │   ├── env.ts
│   │   └── groundswell.ts
│   ├── types/                # Shared types
│   │   ├── agents.ts
│   │   ├── tasks.ts
│   │   ├── workflows.ts
│   │   └── mcp.ts
│   └── index.ts              # Entry point
├── tests/
│   ├── unit/
│   │   ├── agents/
│   │   ├── workflows/
│   │   └── utils/
│   ├── integration/
│   │   ├── tools/
│   │   └── agents/
│   └── fixtures/
│       ├── prompts/
│       └── tasks.json
├── sessions/                 # Agent session data
│   └── .gitignore            # Ignore contents
├── plan/                     # Plan directories (tracked)
│   └── .gitkeep
├── docs/                     # Generated documentation
│   └── .gitkeep
├── scripts/                  # Utility scripts
│   ├── setup.sh
│   └── dev.sh
├── .vscode/                  # VS Code settings
│   ├── settings.json
│   ├── launch.json
│   └── tasks.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsconfig.test.json
├── .gitignore
├── .env.example
├── README.md
├── PRD.md
└── PROMPTS.md
```

### Groundswell-Specific Patterns

1. **Workflow Organization**
   - Base workflow class in `workflows/base/`
   - Main workflow at root of `workflows/`
   - Task workflows in `workflows/tasks/`

2. **State Management with @ObservedState**
   - State classes in `state/` directory
   - Each state file exports types
   - Use Groundswell decorators for persistence

3. **MCP Tool Integration**
   - MCP handler in `tools/mcp/`
   - Each tool has its own directory with schema
   - Tool schemas define Zod validation

4. **Prompt Management**
   - System prompts in `prompts/system/`
   - Load prompts at runtime
   - Maintain separation between code and prompts

5. **Decorator Usage**
   - Workflows use `@Step()` and `@Task()` decorators
   - State fields use `@ObservedState()` decorator
   - Configure `tsconfig.json` with `experimentalDecorators: true`

---

## Recommended Structure for Agent Projects

### Minimal Viable Structure

```
agent-project/
├── src/
│   ├── index.ts
│   ├── config/
│   ├── agents/
│   ├── tools/
│   ├── workflows/
│   └── types/
├── tests/
├── sessions/
├── plan/
├── package.json
├── tsconfig.json
└── .gitignore
```

### Full-Featured Structure

```
agent-project/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/               # Configuration
│   │   ├── index.ts
│   │   ├── env.ts
│   │   └── constants.ts
│   ├── agents/               # Agent implementations
│   │   ├── base/
│   │   │   ├── Agent.ts
│   │   │   └── types.ts
│   │   ├── architect/
│   │   ├── researcher/
│   │   ├── coder/
│   │   └── qa/
│   ├── workflows/            # Workflow definitions
│   │   ├── base/
│   │   │   ├── Workflow.ts
│   │   │   └── types.ts
│   │   ├── MainWorkflow.ts
│   │   └── tasks/
│   ├── tools/                # MCP/tools
│   │   ├── mcp/
│   │   ├── bash/
│   │   ├── file/
│   │   ├── search/
│   │   └── web/
│   ├── state/                # State management
│   │   ├── Session.ts
│   │   ├── TaskRegistry.ts
│   │   └── types.ts
│   ├── services/             # Business logic
│   │   ├── SessionManager.ts
│   │   ├── TaskOrchestrator.ts
│   │   ├── AgentRuntime.ts
│   │   └── ConfigService.ts
│   ├── prompts/              # Prompt templates
│   │   ├── system/
│   │   └── templates/
│   ├── utils/                # Utilities
│   │   ├── logger.ts
│   │   ├── hash.ts
│   │   ├── file.ts
│   │   └── validation.ts
│   └── types/                # Shared types
│       ├── agents.ts
│       ├── tasks.ts
│       └── workflows.ts
├── tests/
│   ├── unit/
│   │   ├── agents/
│   │   ├── workflows/
│   │   ├── tools/
│   │   └── utils/
│   ├── integration/
│   │   ├── tools/
│   │   └── agents/
│   └── fixtures/
│       ├── prompts/
│       └── tasks.json
├── sessions/                 # Session data (gitignored)
│   └── .gitignore
├── plan/                     # Plan directories (tracked)
│   └── .gitkeep
├── docs/                     # Documentation
│   └── .gitkeep
├── scripts/                  # Utility scripts
│   ├── setup.sh
│   ├── dev.sh
│   └── build.sh
├── .vscode/                  # VS Code settings (optional)
│   ├── settings.json
│   ├── launch.json
│   └── tasks.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsconfig.test.json
├── .gitignore
├── .env.example
├── README.md
├── PRD.md
└── PROMPTS.md
```

### Structure Justification

1. **src/config/**
   - Centralized configuration
   - Environment variable handling
   - Constants and enums

2. **src/agents/**
   - Base agent class with shared functionality
   - Specialized agents for different personas
   - Clear agent hierarchy

3. **src/workflows/**
   - Base workflow class
   - Main pipeline workflow
   - Task-specific workflows

4. **src/tools/**
   - MCP tool implementations
   - Tool schemas and validation
   - Organized by domain

5. **src/state/**
   - Session state management
   - Task registry
   - Observed state with Groundswell

6. **src/services/**
   - Business logic services
   - Orchestrators and managers
   - Separation from agents

7. **src/prompts/**
   - System prompts
   - Prompt templates
   - Easy prompt iteration

8. **src/utils/**
   - Utility functions
   - Shared helpers
   - Validation functions

9. **src/types/**
   - Shared type definitions
   - Cross-cutting types
   - Prevent circular dependencies

10. **tests/**
    - Unit tests mirroring src/
    - Integration tests
    - Test fixtures

11. **sessions/**
    - Agent session data
    - Gitignored (runtime data)
    - Preserves audit trail

12. **plan/**
    - Plan directories
    - Tracked in git
    - Session history

13. **docs/**
    - Generated documentation
    - Architecture docs
    - API documentation

---

## Key Documentation URLs

### Official TypeScript Documentation

- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook/intro.html
- **TypeScript Project Structure:** https://www.typescriptlang.org/docs/handbook/project-references.html
- **TypeScript Compiler Options:** https://www.typescriptlang.org/tsconfig
- **TypeScript Modules:** https://www.typescriptlang.org/docs/handbook/modules/reference.html
- **TypeScript 5.6 Release Notes:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html

### Node.js & ESM Documentation

- **Node.js ESM:** https://nodejs.org/api/esm.html
- **Node.js Packages:** https://nodejs.org/api/packages.html
- **Node.js 20 Release Notes:** https://nodejs.org/en/blog/release/v20.0.0
- **Conditional Exports:** https://nodejs.org/api/packages.html#conditional-exports

### AI/Agent Framework Documentation

- **LangChain.js:** https://js.langchain.com/
- **LangChain.js GitHub:** https://github.com/langchain-ai/langchainjs
- **Vercel AI SDK:** https://sdk.vercel.ai/docs
- **Vercel AI SDK GitHub:** https://github.com/vercel/ai-sdk
- **Vercel AI SDK Examples:** https://github.com/vercel/ai-sdk-examples

### MCP (Model Context Protocol)

- **MCP Specification:** https://modelcontextprotocol.io/
- **MCP TypeScript SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **MCP Servers:** https://github.com/modelcontextprotocol/servers

### Groundswell

- **Groundswell (Local):** ~/projects/groundswell
- **Groundswell API:** (Refer to local documentation)

### Community Best Practices

- **TypeScript Deep Dive:** https://basarat.gitbook.io/typescript/
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices
- **TypeScript ESLint:** https://typescript-eslint.io/
- **Awesome TypeScript:** https://github.com/dzharii/awesome-typescript

### Package.json Documentation

- **npm package.json:** https://docs.npmjs.com/cli/v10/configuring-npm/package-json
- **npm Exports Field:** https://docs.npmjs.com/cli/v10/configuring-npm/package-json#exports
- **npm Semantic Versioning:** https://docs.npmjs.com/cli/v10/about-semantic-versioning

### Build Tools

- **tsx (TypeScript Execute):** https://www.npmjs.com/package/tsx
- **esbuild:** https://esbuild.github.io/
- **TypeScript Compiler:** https://www.typescriptlang.org/docs/handbook/compiler-options.html

---

## Common Patterns Observed in Successful TypeScript Projects

### 1. Barrel Exports Pattern

```typescript
// src/utils/index.ts
export * from './hash';
export * from './file';
export * from './validation';

// Usage elsewhere
import { hash, readFile } from '@/utils';
```

### 2. Type Co-location

```typescript
// src/services/SessionManager.ts
export interface SessionState {
  id: string;
  status: 'active' | 'completed' | 'failed';
}

export class SessionManager {
  // ...
}
```

### 3. Configuration Separation

```typescript
// src/config/index.ts
export const config = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },
  agents: {
    maxRetries: 3,
    timeout: 30000,
  },
} as const;
```

### 4. Tool Schema Definition

```typescript
// src/tools/bash/schema.ts
import { z } from 'zod';

export const BashToolSchema = z.object({
  command: z.string(),
  timeout: z.number().optional(),
  cwd: z.string().optional(),
});

export type BashToolInput = z.infer<typeof BashToolSchema>;
```

### 5. Error Handling Pattern

```typescript
// src/utils/errors.ts
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: unknown
  ) {
    super(message);
    this.name = 'AgentError';
  }
}
```

### 6. Logging Pattern

```typescript
// src/utils/logger.ts
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: unknown) {
    console.log(`[${this.context}] INFO: ${message}`, data || '');
  }

  error(message: string, error?: Error) {
    console.error(`[${this.context}] ERROR: ${message}`, error || '');
  }
}
```

### 7. Validation Pattern

```typescript
// src/utils/validation.ts
import { z } from 'zod';

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.message}`);
  }
  return result.data;
}
```

---

## Summary of Recommendations

### For AI/Agent TypeScript Projects:

1. **Use src/ for all source code**
   - Separate source from tests and build artifacts
   - Clear project boundaries

2. **Organize by concern initially, migrate to feature-based as needed**
   - Start with layer-based organization (agents, workflows, tools)
   - Migrate to feature-based as project grows

3. **Use barrel exports (index.ts)**
   - Create clean public APIs
   - Simplify imports
   - Better tree-shaking

4. **Mirror src/ structure in tests/**
   - Easier navigation
   - Clear test organization

5. **Separate configuration from implementation**
   - Central config in src/config/
   - Environment-specific handling

6. **Use dedicated directories for AI-specific concerns**
   - prompts/ for prompt templates
   - tools/ for MCP tools
   - agents/ for agent implementations
   - workflows/ for workflow definitions

7. **Implement proper .gitignore**
   - Ignore dependencies, build artifacts, session data
   - Keep documentation and plan directories

8. **Use TypeScript project references for large projects**
   - Separate tsconfig files for different contexts
   - Better build performance

9. **Leverage Groundswell patterns**
   - @ObservedState for state management
   - @Step and @Task decorators
   - Workflow inheritance

10. **Maintain clear separation of concerns**
    - Agents (personas)
    - Workflows (orchestration)
    - Tools (capabilities)
    - Services (business logic)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-12
**Maintained By:** Research Agent
