# Persona-Specific Agent Creators PRP

## Goal

**Feature Goal**: Implement four persona-specific agent creator functions in `src/agents/agent-factory.ts` that return configured Groundswell Agent instances using distinct system prompts for each persona type.

**Deliverable**: Four exported functions (`createArchitectAgent`, `createResearcherAgent`, `createCoderAgent`, `createQAAgent`) that return configured Groundswell `Agent` instances.

**Success Definition**:

- All four agent creator functions are exported and type-safe
- Each function returns a properly configured Groundswell `Agent` instance
- Each agent uses the correct system prompt from `prompts.ts`
- Each agent uses the sonnet model (GLM-4.7) via `getModel('sonnet')`
- TypeScript compilation succeeds with no type errors
- ESLint validation passes with no errors

## User Persona (if applicable)

**Target User**: PRP Pipeline system - the agent creator functions will be used by downstream workflow orchestrators to instantiate agents for specific tasks.

**Use Case**: When the pipeline needs an architect agent for task breakdown, a researcher agent for PRP generation, a coder agent for implementation, or a QA agent for bug hunting.

**User Journey**: Pipeline code imports and calls the appropriate creator function, receives a configured Agent instance, and uses it to execute LLM prompts.

**Pain Points Addressed**: Eliminates manual agent configuration, ensures consistent persona setup across the pipeline, provides type-safe agent creation.

## Why

- **Modularity**: Separates agent creation logic into distinct, testable functions
- **Type Safety**: Ensures each agent has the correct configuration for its persona
- **Maintainability**: Centralizes agent creation patterns in the factory module
- **Integration**: Provides the foundation for P2.M1.T2 (MCP Tools Integration)
- **Problems this solves**: Prevents configuration drift, enables easy testing, simplifies downstream code

## What

Add four agent creator functions to `src/agents/agent-factory.ts`:

1. `createArchitectAgent(): Agent` - Uses `TASK_BREAKDOWN_PROMPT` for PRD analysis and task breakdown
2. `createResearcherAgent(): Agent` - Uses `PRP_BLUEPRINT_PROMPT` for PRP generation and research
3. `createCoderAgent(): Agent` - Uses `PRP_BUILDER_PROMPT` for code implementation from PRPs
4. `createQAAgent(): Agent` - Uses `BUG_HUNT_PROMPT` for QA validation and bug hunting

Each function should:

- Call `createBaseConfig(persona)` to get the base configuration
- Override the `system` property with the appropriate prompt from `prompts.ts`
- Call `createAgent(config)` from Groundswell with the merged configuration
- Return the resulting `Agent` instance

### Success Criteria

- [ ] Four exported functions: `createArchitectAgent`, `createResearcherAgent`, `createCoderAgent`, `createQAAgent`
- [ ] Each function returns type `Agent` (imported from 'groundswell')
- [ ] Each function uses the correct system prompt constant
- [ ] All functions use `getModel('sonnet')` for model selection
- [ ] TypeScript compilation passes: `npm run build`
- [ ] ESLint validation passes: `npm run lint`
- [ ] No runtime errors when importing the module

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test passed**: If someone knew nothing about this codebase, they would have everything needed to implement this successfully because:

- Groundswell API is fully documented with function signatures
- Existing code patterns in `agent-factory.ts` provide clear examples
- System prompts are already defined in `prompts.ts`
- Environment configuration is already handled

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API reference for Agent creation
  critical: createAgent function signature and AgentConfig interface
  section: Lines 119-144 show Agent Creation pattern with configuration options

- file: /home/dustin/projects/groundswell/src/types/agent.ts
  why: AgentConfig interface definition - exact properties and types
  critical: All properties are optional, use createBaseConfig pattern for required values
  section: Lines 8-48 define the AgentConfig interface

- file: /home/dustin/projects/groundswell/src/core/factory.ts
  why: createAgent factory function implementation
  pattern: Function takes AgentConfig, returns Agent instance
  section: Lines 42-62

- file: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
  why: Existing createBaseConfig pattern and module structure
  pattern: Follow import patterns, use getModel() for model resolution
  gotcha: configureEnvironment() already called at module load (line 26)

- file: /home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: System prompt constants to use for each persona
  pattern: TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, BUG_HUNT_PROMPT
  section: Lines 23-856 contain all system prompt constants

- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: getModel() function for model tier resolution
  pattern: getModel('sonnet') returns 'GLM-4.7'
  section: Lines 67-99

- file: /home/dustin/projects/hacky-hack/package.json
  why: npm scripts for validation
  pattern: "build": "tsc", "lint": "eslint . --ext .ts"
  section: Lines 10-23
```

### Current Codebase tree

```bash
plan/001_14b9dc2a33c7/
├── PRD.md
├── architecture/
│   └── groundswell_api.md
├── tasks.json
└── P2M1T1S3/
    └── PRP.md

src/
├── agents/
│   ├── agent-factory.ts    # MODIFY: Add four agent creator functions
│   └── prompts.ts          # READ: System prompt constants
├── config/
│   ├── constants.ts        # READ: MODEL_NAMES, MODEL_ENV_VARS
│   ├── environment.ts      # READ: getModel(), configureEnvironment()
│   └── types.ts            # READ: ModelTier type
├── core/
│   ├── models.ts
│   └── session-utils.ts
├── scripts/
│   └── validate-api.ts
├── utils/
│   └── task-utils.ts
├── workflows/
│   └── hello-world.ts
└── index.ts

package.json                # READ: npm scripts
tsconfig.json
vitest.config.ts
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/agents/
├── agent-factory.ts    # MODIFY: Add four agent creator functions
│   # NEW EXPORTS:
│   # - createArchitectAgent(): Agent
│   # - createResearcherAgent(): Agent
│   # - createCoderAgent(): Agent
│   # - createQAAgent(): Agent
└── prompts.ts          # NO CHANGE: Already contains system prompts
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: configureEnvironment() MUST be called before accessing ANTHROPIC_API_KEY
// This is already done in agent-factory.ts at line 26 - DO NOT duplicate

// CRITICAL: Use getModel('sonnet') for model selection, NOT hardcoded model names
// The model tier maps to actual model name via environment configuration

// CRITICAL: Groundswell AgentConfig properties are all OPTIONAL
// But createBaseConfig provides required values: name, model, maxTokens, env

// CRITICAL: Import createAgent from 'groundswell', NOT a relative path
// Groundswell is locally linked via npm link

// GOTCHA: The Agent type is exported from 'groundswell' package
// Import it alongside createAgent

// PATTERN: createBaseConfig returns a Readonly AgentConfig with default system prompt
// You must override the system property with the persona-specific prompt

// PATTERN: Use spread operator to merge base config with system prompt override
// const config = { ...baseConfig, system: TASK_BREAKDOWN_PROMPT }
```

## Implementation Blueprint

### Data models and structure

No new data models needed - this task only creates factory functions.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD Groundswell import to src/agents/agent-factory.ts
  - IMPORT: Add createAgent and Agent types from 'groundswell'
  - FOLLOW pattern: Existing import from '../config/environment.js'
  - PLACEMENT: At top of file after environment imports
  - NAMING: import { createAgent, type Agent } from 'groundswell'

Task 2: ADD prompts import to src/agents/agent-factory.ts
  - IMPORT: Add system prompt constants from './prompts.js'
  - FOLLOW pattern: Use .js extension for ES modules
  - PLACEMENT: After Groundswell import
  - NAMING: import { TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, BUG_HUNT_PROMPT } from './prompts.js'

Task 3: IMPLEMENT createArchitectAgent function
  - EXPORT: async function createArchitectAgent(): Agent
  - CALL: createBaseConfig('architect') to get base configuration
  - OVERRIDE: system property with TASK_BREAKDOWN_PROMPT
  - CREATE: Agent via createAgent({ ...baseConfig, system: TASK_BREAKDOWN_PROMPT })
  - RETURN: The Agent instance
  - PLACEMENT: After createBaseConfig function, before re-exports

Task 4: IMPLEMENT createResearcherAgent function
  - EXPORT: async function createResearcherAgent(): Agent
  - CALL: createBaseConfig('researcher') to get base configuration
  - OVERRIDE: system property with PRP_BLUEPRINT_PROMPT
  - CREATE: Agent via createAgent({ ...baseConfig, system: PRP_BLUEPRINT_PROMPT })
  - RETURN: The Agent instance
  - PLACEMENT: After createArchitectAgent

Task 5: IMPLEMENT createCoderAgent function
  - EXPORT: async function createCoderAgent(): Agent
  - CALL: createBaseConfig('coder') to get base configuration
  - OVERRIDE: system property with PRP_BUILDER_PROMPT
  - CREATE: Agent via createAgent({ ...baseConfig, system: PRP_BUILDER_PROMPT })
  - RETURN: The Agent instance
  - PLACEMENT: After createResearcherAgent

Task 6: IMPLEMENT createQAAgent function
  - EXPORT: async function createQAAgent(): Agent
  - CALL: createBaseConfig('qa') to get base configuration
  - OVERRIDE: system property with BUG_HUNT_PROMPT
  - CREATE: Agent via createAgent({ ...baseConfig, system: BUG_HUNT_PROMPT })
  - RETURN: The Agent instance
  - PLACEMENT: After createCoderAgent

Task 7: VERIFY TypeScript compilation
  - RUN: npm run build
  - EXPECT: Zero type errors, successful compilation
  - FIX: Any type errors that arise from imports or type mismatches

Task 8: VERIFY ESLint validation
  - RUN: npm run lint
  - EXPECT: Zero linting errors
  - FIX: Any linting issues related to import ordering or unused variables
```

### Implementation Patterns & Key Details

````typescript
// Import pattern - add to existing imports at top of agent-factory.ts
import { createAgent, type Agent } from 'groundswell';

// Prompts import - add after Groundswell import
import {
  TASK_BREAKDOWN_PROMPT,
  PRP_BLUEPRINT_PROMPT,
  PRP_BUILDER_PROMPT,
  BUG_HUNT_PROMPT,
} from './prompts.js';

// Agent creator function pattern - repeat for each persona
/**
 * Create an Architect agent for PRD analysis and task breakdown
 *
 * @remarks
 * Uses the TASK_BREAKDOWN_PROMPT system prompt for analyzing PRDs
 * and generating structured task hierarchies.
 *
 * @returns Configured Groundswell Agent instance
 *
 * @example
 * ```ts
 * import { createArchitectAgent } from './agents/agent-factory.js';
 *
 * const architect = createArchitectAgent();
 * const result = await architect.prompt(prdAnalysisPrompt);
 * ```
 */
export function createArchitectAgent(): Agent {
  // PATTERN: Get base configuration with persona-specific settings
  const baseConfig = createBaseConfig('architect');

  // PATTERN: Override system prompt with persona-specific prompt
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,
  };

  // PATTERN: Create and return Agent instance
  return createAgent(config);
}

// GOTCHA: The spread operator creates a new object, preserving immutability
// The baseConfig readonly properties are copied to the new object

// CRITICAL: No async keyword needed - createAgent is synchronous
// The Agent instance is created synchronously, prompt() method is async
````

### Integration Points

```yaml
IMPORTS:
  - add to: src/agents/agent-factory.ts
  - pattern: "import { createAgent, type Agent } from 'groundswell'"

IMPORTS:
  - add to: src/agents/agent-factory.ts
  - pattern: "import { TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, BUG_HUNT_PROMPT } from './prompts.js'"

EXPORTS:
  - add to: src/agents/agent-factory.ts
  - pattern: "export function createArchitectAgent(): Agent"
  - pattern: "export function createResearcherAgent(): Agent"
  - pattern: "export function createCoderAgent(): Agent"
  - pattern: "export function createQAAgent(): Agent"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npm run lint
# Expected: Zero errors. ESLint validates TypeScript syntax and style.

npm run build
# Expected: Zero type errors. tsc compiles TypeScript to JavaScript.

# Project-wide validation
npm run validate
# Expected: All validations pass (lint + format check)
```

### Level 2: Module Import Validation

```bash
# Verify the module can be imported without errors
node -e "import('./src/agents/agent-factory.js').then(m => console.log('Exports:', Object.keys(m)))"
# Expected: Shows exports including the four new agent creator functions

# Verify specific exports
node -e "import('./src/agents/agent-factory.js').then(m => { console.log('createArchitectAgent:', typeof m.createArchitectAgent); console.log('createResearcherAgent:', typeof m.createResearcherAgent); console.log('createCoderAgent:', typeof m.createCoderAgent); console.log('createQAAgent:', typeof m.createQAAgent); })"
# Expected: All four are 'function'
```

### Level 3: Runtime Validation (Agent Creation)

```bash
# Create a simple test script to verify agent creation
cat > /tmp/test-agent-creation.ts << 'EOF'
import { createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent } from './src/agents/agent-factory.js';

console.log('Testing agent creator functions...');

const architect = createArchitectAgent();
console.log('✓ Architect agent created:', architect.constructor.name);

const researcher = createResearcherAgent();
console.log('✓ Researcher agent created:', researcher.constructor.name);

const coder = createCoderAgent();
console.log('✓ Coder agent created:', coder.constructor.name);

const qa = createQAAgent();
console.log('✓ QA agent created:', qa.constructor.name);

console.log('\nAll agent creator functions working!');
EOF

npx tsx /tmp/test-agent-creation.ts
# Expected: All four agents created successfully, no runtime errors
```

### Level 4: Type Safety Validation

```bash
# Verify TypeScript types are correctly exported
cat > /tmp/test-types.ts << 'EOF'
import type { Agent } from 'groundswell';
import { createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent } from './src/agents/agent-factory.js';

// Type check: Each function should return Agent
const architect: Agent = createArchitectAgent();
const researcher: Agent = createResearcherAgent();
const coder: Agent = createCoderAgent();
const qa: Agent = createQAAgent();

console.log('Type safety validated!');
EOF

npx tsx /tmp/test-types.ts
# Expected: No type errors, all assignments valid
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 completed: TypeScript compilation passes, ESLint validation passes
- [ ] Level 2 completed: Module imports successfully, all four functions are exported
- [ ] Level 3 completed: All four agents create without runtime errors
- [ ] Level 4 completed: Type annotations are correct (returns Agent)

### Feature Validation

- [ ] Four functions exported: createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent
- [ ] Each function uses the correct system prompt from prompts.ts
- [ ] Each function uses createBaseConfig(persona) with correct persona argument
- [ ] All functions use sonnet model tier via getModel('sonnet')

### Code Quality Validation

- [ ] Follows existing JSDoc comment pattern from createBaseConfig
- [ ] Uses .js extension for ES module imports
- [ ] Type annotations are explicit (return type: Agent)
- [ ] Spread operator pattern used for config merging
- [ ] No duplicate configureEnvironment() calls (already in module)

### Documentation & Deployment

- [ ] Each function has JSDoc comment with example usage
- [ ] No environment variables added (uses existing configuration)
- [ ] No changes to package.json or other config files

---

## Anti-Patterns to Avoid

- **Don't** hardcode model names like 'GLM-4.7' - use `getModel('sonnet')` via `createBaseConfig`
- **Don't** call `configureEnvironment()` again - already called at module load
- **Don't** make these functions async - `createAgent` is synchronous
- **Don't** duplicate code - use the same pattern for all four functions
- **Don't** use relative path imports for groundswell - it's an npm-linked package
- **Don't** forget to add JSDoc comments - follow the existing pattern
- **Don't** use var or let for config - use const for immutability
- **Don't** modify the baseConfig directly - use spread operator to create new object

---

## Confidence Score

**9/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- All necessary context is documented with specific file paths and line numbers
- Groundswell API is well-documented and understood
- Existing code patterns provide clear templates to follow
- Validation commands are project-specific and executable
- The task is straightforward with no complex logic or external dependencies

**Risk factors**:

- Groundswell npm link must be working (already validated in P1.M1.T3.S1)
- System prompts must be correctly imported (already exists in prompts.ts)
