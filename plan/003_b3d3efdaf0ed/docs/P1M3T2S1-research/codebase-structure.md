# Codebase Structure Analysis

## Current Codebase Tree (Relevant Sections)

```
/home/dustin/projects/hacky-hack/
├── PROMPTS.md                           # System prompts (lines 189-639: PRP_CREATE_PROMPT)
├── plan/
│   └── 003_b3d3efdaf0ed/
│       ├── docs/
│       │   └── system_context.md        # System architecture documentation
│       ├── tasks.json                   # Task hierarchy (source of contract definition)
│       └── P1M3T2S1/                    # This work item directory
│           └── research/                # Research notes storage
├── src/
│   ├── agents/
│   │   ├── agent-factory.ts             # Agent creation factory
│   │   ├── prp-generator.ts             # PRPGenerator class
│   │   └── prompts.ts                   # PRP_BLUEPRINT_PROMPT export (lines 157-603)
│   ├── core/
│   │   ├── models.ts                    # PRPDocumentSchema, Backlog types
│   │   └── session-manager.ts           # Session state management
│   └── tools/
│       ├── bash-mcp.ts                  # Bash MCP tool
│       ├── filesystem-mcp.ts            # Filesystem MCP tool
│       └── git-mcp.ts                   # Git MCP tool
└── tests/
    ├── integration/
    │   ├── researcher-agent.test.ts     # Researcher Agent integration tests
    │   ├── prp-generator-integration.test.ts  # PRPGenerator tests
    │   ├── architect-agent-integration.test.ts # Architect Agent tests
    │   └── groundswell/
    │       └── agent-prompt.test.ts      # Groundswell API testing
    └── unit/
        └── agent-context-injection.test.ts # Context injection tests
```

## Key Files for This Implementation

| File | Purpose | Lines/Sections |
|------|---------|----------------|
| `PROMPTS.md` | Source PRP_CREATE_PROMPT | Lines 189-639 |
| `src/agents/prompts.ts` | PRP_BLUEPRINT_PROMPT export | Lines 157-603 |
| `tests/integration/researcher-agent.test.ts` | Test pattern reference | All |
| `plan/003_b3d3efdaf0ed/docs/system_context.md` | Architecture docs | All |
| `plan/003_b3d3efdaf0ed/tasks.json` | Contract definition source | P1.M3.T2.S1 entry |

## Test File Location

New test file to create:
```
tests/integration/prp-create-prompt.test.ts
```

This follows the existing naming convention:
- `[component]-integration.test.ts` for component tests
- `[agent]-agent.test.ts` for agent-specific tests
- `prp-[feature].test.ts` for PRP-related tests

## Dependencies to Import

```typescript
// Vitest testing framework
import { afterEach, describe, expect, it, vi, beforeAll } from 'vitest';

// Groundswell (mocked)
import type { Agent } from 'groundswell';

// Project imports (dynamic, after mock)
import { PRP_BLUEPRINT_PROMPT } from './src/agents/prompts.js';
```

## Naming Conventions

- Test files: `*.test.ts` suffix
- Describe blocks: `'integration/[component]'` or `'integration/[agent]'`
- Test names: `'should [expected behavior]'`
- Mock functions: `mock[AgentName]`, `mock[FunctionName]`
