# Existing Codebase Patterns for Prompt Creation

## Current State
The codebase does **not** currently use `createPrompt()`. It uses string constants directly.

## Existing Pattern (src/agents/prompts.ts)

```typescript
export const TASK_BREAKDOWN_PROMPT = `
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER
... (entire prompt as markdown string)
` as const;
```

## Existing Agent Factory Pattern (src/agents/agent-factory.ts)

```typescript
import { TASK_BREAKDOWN_PROMPT } from './prompts.js';

export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,  // Using string constant
    mcps: MCP_TOOLS,
  };
  return createAgent(config);
}
```

## Migration Pattern for createPrompt Usage

Based on Groundswell documentation, the pattern should be:

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';
import { TASK_BREAKDOWN_PROMPT } from './prompts.js';
import { BacklogSchema } from '../../core/models.js';

export function createArchitectPrompt(prdContent: string): Prompt {
  return createPrompt({
    user: prdContent,
    system: TASK_BREAKDOWN_PROMPT,
    responseFormat: BacklogSchema,
    enableReflection: true,  // Enable for complex decomposition
  });
}
```

## Directory Structure

```
src/agents/
├── agent-factory.ts    # Agent creation functions
├── prompts.ts          # System prompt constants
└── prompts/            # NEW: Prompt generator functions (to be created)
    └── architect-prompt.ts
```

## Naming Conventions
- File names: `kebab-case.ts` (e.g., `architect-prompt.ts`)
- Function names: `camelCase` (e.g., `createArchitectPrompt`)
- Export functions as named exports

## Import Patterns
- Groundswell: `import { createPrompt, type Prompt } from 'groundswell';`
- Zod: `import { z } from 'zod';`
- Models: `import { BacklogSchema } from '../../core/models.js';`
- Prompts: `import { TASK_BREAKDOWN_PROMPT } from '../prompts.js';`
