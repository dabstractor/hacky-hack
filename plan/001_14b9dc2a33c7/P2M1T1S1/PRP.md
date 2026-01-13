# Product Requirement Prompt: Base Agent Configuration

---

## Goal

**Feature Goal**: Create a type-safe agent factory module that generates Groundswell agent configurations for different agent personas (architect, researcher, coder, qa) with proper environment integration.

**Deliverable**: `src/agents/agent-factory.ts` module with `AgentPersona` type, `AgentConfig` interface, and `createBaseConfig()` factory function.

**Success Definition**:

- `createBaseConfig()` returns valid Groundswell agent configurations for all four personas
- Environment variables are properly mapped (`ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY`)
- Model tiers are correctly assigned per persona
- All configurations pass TypeScript type checking
- 100% test coverage of all exported functions

## User Persona

**Target User**: PRP Pipeline system (internal developer-facing API)

**Use Case**: The PRP Pipeline needs to create specialized AI agents for different phases of software development:

- **Architect**: Analyzes PRDs and creates task breakdowns (needs larger token limit)
- **Researcher**: Performs codebase research and external documentation searches
- **Coder**: Implements code based on PRP specifications
- **QA**: Validates implementations and hunts for bugs

**User Journey**:

1. Pipeline calls `configureEnvironment()` at startup
2. For each phase, pipeline calls `createBaseConfig(persona)` to get agent configuration
3. Configuration is passed to Groundswell's `createAgent()`
4. Agent executes with proper model, cache settings, and environment mapping

**Pain Points Addressed**:

- Eliminates repetitive agent configuration code across the pipeline
- Centralizes persona-to-model mapping for easy maintenance
- Ensures consistent environment variable mapping across all agents
- Provides type safety for agent configurations

## Why

- **Business value**: Enables the PRP Pipeline to create specialized agents automatically without manual configuration
- **Integration**: Builds on existing `configureEnvironment()` and `getModel()` from `src/config/environment.ts`
- **Problems solved**: Eliminates code duplication, provides single source of truth for agent settings, ensures environment variables are properly mapped for all agents

## What

Create a factory module that generates Groundswell agent configurations based on agent persona.

### Technical Requirements

1. Define `AgentPersona` type as union of four literal types: `'architect' | 'researcher' | 'coder' | 'qa'`
2. Define `AgentConfig` interface that extends Groundswell's agent configuration options
3. Export `createBaseConfig(persona: AgentPersona): AgentConfig` function
4. Call `configureEnvironment()` at module load time (top-level execution)
5. Map personas to model tiers (all use `sonnet` → `GLM-4.7` per PRD specification)
6. Set `enableCache: true` and `enableReflection: true` for all personas
7. Set `maxTokens: 8192` for architect, `4096` for others
8. Return config object with properly mapped environment variables

### Success Criteria

- [ ] `AgentPersona` type defined with four literal values
- [ ] `AgentConfig` interface extends Groundswell config type
- [ ] `createBaseConfig()` returns valid config for all four personas
- [ ] `configureEnvironment()` called at module load time
- [ ] All configs use `getModel('sonnet')` → `'GLM-4.7'`
- [ ] `enableCache` and `enableReflection` are `true` for all personas
- [ ] `maxTokens` is 8192 for architect, 4096 for others
- [ ] Environment variables properly mapped (`ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`)
- [ ] 100% test coverage achieved
- [ ] TypeScript compilation with zero errors

## All Needed Context

### Context Completeness Check

✅ **Passes "No Prior Knowledge" test**: This PRP provides complete context including:

- Exact file paths and patterns to follow
- Groundswell API specification with all config options
- Existing codebase patterns and conventions
- Test patterns with specific assertion styles
- Type definitions and import paths
- Common gotchas and constraints

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- url: https://www.typescriptlang.org/docs/handbook/2/generics.html#constraining-type-parameters
  why: Understanding TypeScript generics for factory function design
  critical: Factory functions often use generic type parameters with constraints

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  why: Type guards and discriminated unions for persona-based logic
  critical: Discriminated unions enable type-safe persona handling

- url: https://zod.dev/?id=basic-usage
  why: Runtime validation patterns used in this codebase
  critical: Project uses Zod schemas for validation alongside TypeScript types

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API specification for agent creation
  section: "Agent System > Agent Creation" (lines 119-144)
  critical: createAgent() accepts name, system, model, enableCache, enableReflection, maxTokens, mcps, tools, hooks, env

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Environment variable mapping requirements and model selection
  section: "Configuration Implementation" (lines 64-83)
  critical: ANTHROPIC_AUTH_TOKEN must map to ANTHROPIC_API_KEY

- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Exact patterns for environment configuration and model selection
  pattern: Function exports with JSDoc, configureEnvironment() call pattern
  gotcha: Must call configureEnvironment() before using getModel() or accessing process.env

- file: /home/dustin/projects/hacky-hack/src/config/types.ts
  why: Type definition patterns with JSDoc documentation
  pattern: Type definitions with readonly properties, custom Error classes
  gotcha: Use `readonly` for all interface properties

- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Constant definition pattern with const assertions
  pattern: Objects with `as const` for literal type preservation
  gotcha: Always use `as const` for object literals that should have literal types

- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Test patterns including AAA style, vi.stubEnv() usage, nested describe blocks
  pattern: afterEach cleanup, descriptive test names, comprehensive coverage
  gotcha: Always use vi.unstubAllEnvs() in afterEach to prevent test pollution

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/typescript_factory_patterns.md
  why: Factory pattern examples and best practices for TypeScript
  section: "Factory Function Patterns" and "Configuration Object Patterns"
  critical: Demonstrates type-safe factory design patterns
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── coverage/                    # Test coverage reports
├── package.json                 # Project config with npm scripts
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/        # Architecture documentation
│       ├── docs/                # Research documentation
│       ├── P2M1T1S1/            # THIS WORK ITEM
│       └── tasks.json           # Task hierarchy state
├── PRD.md                       # Product requirements document
├── PROMPTS.md                   # System prompts (architect, researcher, coder, qa)
├── src/
│   ├── agents/                  # (EMPTY - CREATE HERE)
│   ├── config/                  # Environment configuration
│   │   ├── constants.ts         # Model names, env var names, defaults
│   │   ├── environment.ts       # configureEnvironment(), getModel(), validateEnvironment()
│   │   └── types.ts             # ModelTier type, EnvironmentConfig interface
│   ├── core/                    # Domain models
│   │   ├── models.ts            # Task hierarchy types, Zod schemas
│   │   └── session-utils.ts     # File system utilities
│   ├── index.ts                 # Main entry point
│   ├── scripts/                 # Standalone scripts
│   ├── utils/                   # Utility functions
│   └── workflows/               # Workflow implementations
└── tests/
    ├── unit/                    # Unit tests
    │   ├── config/              # Config module tests
    │   └── (CREATE agents/ here)
    └── validation/              # Integration tests
```

### Desired Codebase Tree (After Implementation)

```bash
src/
└── agents/
    └── agent-factory.ts         # NEW - AgentPersona type, AgentConfig interface, createBaseConfig()

tests/
└── unit/
    └── agents/
        └── agent-factory.test.ts # NEW - Unit tests for agent factory
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Groundswell's createAgent() expects specific configuration shape
// From groundswell_api.md lines 119-144:
const agent = createAgent({
  name: 'AgentName', // string - required
  system: 'System prompt', // string - required
  model: 'GLM-4.7', // string - required
  enableCache: true, // boolean - optional, default true
  enableReflection: true, // boolean - optional, enables error recovery
  maxTokens: 4096, // number - optional, response token limit
  temperature: 0.1, // number - optional, sampling temp
  mcps: [], // MCP[] - optional, MCP servers
  tools: [], // Tool[] - optional, tool definitions
  hooks: {}, // object - optional, lifecycle hooks
  env: {
    // object - optional, env variable overrides
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
});

// CRITICAL: Environment variable mapping MUST happen before agent creation
// The shell uses ANTHROPIC_AUTH_TOKEN but Anthropic SDK expects ANTHROPIC_API_KEY
// configureEnvironment() MUST be called at module load time (top-level execution)
// This is an intentional side effect that modifies process.env in place

// GOTCHA: Model tiers all map to 'GLM-4.7' in z.ai API
// - opus: GLM-4.7 (complex reasoning)
// - sonnet: GLM-4.7 (balanced)
// - haiku: GLM-4.5-Air (fast)
// Per PRD spec, ALL personas use sonnet tier → GLM-4.7

// GOTCHA: Use readonly properties for immutability (codebase pattern)
// All interface properties should be marked readonly

// GOTCHA: Use as const for literal types
// Objects with string literals need 'as const' to preserve literal types

// GOTCHA: Test environment variable cleanup
// Always use vi.unstubAllEnvs() in afterEach to prevent test pollution

// GOTCHA: Import from groundswell is via local npm link
// Groundswell is at ~/projects/groundswell and linked via npm link
```

## Implementation Blueprint

### Data Models and Structure

Create core types for the agent factory system:

```typescript
// AgentPersona type - discriminated union for type-safe persona selection
export type AgentPersona = 'architect' | 'researcher' | 'coder' | 'qa';

// AgentConfig interface - extends Groundswell config with our additions
// Based on groundswell_api.md lines 119-144 (Agent Configuration Options table)
export interface AgentConfig {
  readonly name: string;
  readonly system: string;
  readonly model: string;
  readonly enableCache: boolean;
  readonly enableReflection: boolean;
  readonly maxTokens: number;
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly ANTHROPIC_BASE_URL: string;
  };
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/agents/agent-factory.ts
  - DEFINE: AgentPersona type as union of four literal types
  - DEFINE: AgentConfig interface matching Groundswell's createAgent() config
  - IMPLEMENT: createBaseConfig(persona: AgentPersona): AgentConfig
  - CALL: configureEnvironment() at module load time (top-level, outside function)
  - MAP: personas to 'sonnet' model tier using getModel('sonnet')
  - SET: enableCache: true, enableReflection: true for all personas
  - SET: maxTokens: 8192 for architect, 4096 for researcher/coder/qa
  - RETURN: config object with env vars properly mapped
  - FOLLOW: JSDoc documentation pattern from src/config/environment.ts
  - NAMING: camelCase for function, PascalCase for types
  - PLACEMENT: New src/agents/ directory

Task 2: CREATE tests/unit/agents/agent-factory.test.ts
  - IMPLEMENT: describe block for 'agents/agent-factory'
  - TEST: createBaseConfig returns valid config for each persona
  - TEST: Architect gets maxTokens 8192, others get 4096
  - TEST: All personas have enableCache and enableReflection true
  - TEST: All personas use 'GLM-4.7' model (sonnet tier)
  - TEST: Environment variables are properly mapped in config.env
  - TEST: configureEnvironment was called (verify process.env is configured)
  - FOLLOW: AAA pattern (Arrange, Act, Assert) from environment.test.ts
  - FOLLOW: afterEach cleanup with vi.unstubAllEnvs()
  - NAMING: test files use *.test.ts suffix
  - COVERAGE: 100% code coverage required
  - PLACEMENT: tests/unit/agents/ directory

Task 3: VALIDATE TypeScript compilation
  - RUN: npm run build (TypeScript compiler check)
  - VERIFY: Zero compilation errors
  - VERIFY: Type checking passes for AgentConfig interface
  - VERIFY: Groundswell imports resolve correctly

Task 4: VALIDATE Test execution
  - RUN: npm run test:run
  - VERIFY: All tests pass
  - RUN: npm run test:coverage
  - VERIFY: 100% coverage for src/agents/agent-factory.ts
```

### Implementation Patterns & Key Details

````typescript
/**
 * Agent factory module for creating Groundswell agent configurations
 *
 * @module agents/agent-factory
 *
 * @remarks
 * Provides factory functions for creating type-safe agent configurations
 * tailored to specific personas (architect, researcher, coder, qa).
 * Each persona has optimized token limits and model selection.
 *
 * Environment configuration is performed at module load time to ensure
 * ANTHROPIC_AUTH_TOKEN is mapped to ANTHROPIC_API_KEY before any agents are created.
 *
 * @example
 * ```ts
 * import { createBaseConfig } from './agents/agent-factory.js';
 *
 * const architectConfig = createBaseConfig('architect');
 * // Returns AgentConfig with maxTokens: 8192, model: 'GLM-4.7'
 * ```
 */

import { configureEnvironment, getModel } from '../config/environment.js';
// PATTERN: Configure environment at module load time (intentional side effect)
// CRITICAL: This must execute before any agent creation
configureEnvironment();

/**
 * Agent persona identifier for selecting specialized configurations
 *
 * @remarks
 * Each persona corresponds to a specific role in the PRP Pipeline:
 * - 'architect': Analyzes PRDs and creates task breakdowns (needs larger token limit)
 * - 'researcher': Performs codebase and external research
 * - 'coder': Implements code based on PRP specifications
 * - 'qa': Validates implementations and hunts for bugs
 */
export type AgentPersona = 'architect' | 'researcher' | 'coder' | 'qa';

/**
 * Agent configuration interface matching Groundswell's createAgent() options
 *
 * @remarks
 * Extends the core Groundswell configuration with environment variable mapping.
 * All properties are readonly to ensure immutability after creation.
 *
 * @see {@link file:///home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md#L119} | Groundswell Agent Creation docs
 */
export interface AgentConfig {
  /** Agent identifier for logging and debugging */
  readonly name: string;
  /** System prompt for the agent */
  readonly system: string;
  /** Model identifier (e.g., 'GLM-4.7') */
  readonly model: string;
  /** Enable LLM response caching */
  readonly enableCache: boolean;
  /** Enable error recovery with reflection */
  readonly enableReflection: boolean;
  /** Maximum tokens in response */
  readonly maxTokens: number;
  /** Environment variable overrides for SDK configuration */
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly ANTHROPIC_BASE_URL: string;
  };
}

/**
 * Persona-specific token limits
 *
 * @remarks
 * Architect agents need more tokens for complex task breakdown analysis.
 * Other agents use standard token limits for their specific tasks.
 */
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;

/**
 * Create base agent configuration for a specific persona
 *
 * @remarks
 * Generates a Groundswell-compatible agent configuration optimized for
 * the specified persona. All personas use the sonnet model tier (GLM-4.7)
 * with caching and reflection enabled for optimal performance.
 *
 * Environment variables are mapped from shell conventions (ANTHROPIC_AUTH_TOKEN)
 * to SDK expectations (ANTHROPIC_API_KEY) via configureEnvironment().
 *
 * @param persona - The agent persona to create configuration for
 * @returns Groundswell-compatible agent configuration object
 *
 * @example
 * ```ts
 * import { createBaseConfig } from './agents/agent-factory.js';
 *
 * const architectConfig = createBaseConfig('architect');
 * // { name: 'ArchitectAgent', model: 'GLM-4.7', maxTokens: 8192, ... }
 *
 * const coderConfig = createBaseConfig('coder');
 * // { name: 'CoderAgent', model: 'GLM-4.7', maxTokens: 4096, ... }
 * ```
 */
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  // PATTERN: Use getModel() to resolve model tier to actual model name
  const model = getModel('sonnet'); // All personas use sonnet → GLM-4.7

  // PATTERN: Persona-specific naming (PascalCase with "Agent" suffix)
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;

  // GOTCHA: System prompt will be added in next subtask (P2.M1.T1.S2)
  // For now, use placeholder - this will be replaced with actual system prompts
  const system = `You are a ${persona} agent.`;

  // PATTERN: Readonly configuration object for immutability
  return {
    name,
    system,
    model,
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      // CRITICAL: Map environment variables for SDK compatibility
      // configureEnvironment() already mapped AUTH_TOKEN → API_KEY
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}

// PATTERN: Re-export types for convenience
export type { AgentPersona, AgentConfig };
````

### Test Implementation Pattern

```typescript
/**
 * Unit tests for agent factory module
 *
 * @remarks
 * Tests validate persona-based configuration generation with 100% coverage
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createBaseConfig,
  type AgentPersona,
} from '../../../src/agents/agent-factory.js';

describe('agents/agent-factory', () => {
  // CLEANUP: Always restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('createBaseConfig', () => {
    // SETUP: Ensure environment is configured before tests
    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
    });

    const personas: AgentPersona[] = ['architect', 'researcher', 'coder', 'qa'];

    it.each(personas)('should return valid config for %s persona', persona => {
      // EXECUTE
      const config = createBaseConfig(persona);

      // VERIFY: Required properties exist
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('system');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('enableCache');
      expect(config).toHaveProperty('enableReflection');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('env');
    });

    it('should set maxTokens to 8192 for architect persona', () => {
      // EXECUTE
      const config = createBaseConfig('architect');

      // VERIFY: Architect gets larger token limit
      expect(config.maxTokens).toBe(8192);
    });

    it.each(['researcher', 'coder', 'qa'] as AgentPersona[])(
      'should set maxTokens to 4096 for %s persona',
      persona => {
        // EXECUTE
        const config = createBaseConfig(persona);

        // VERIFY: Standard token limit
        expect(config.maxTokens).toBe(4096);
      }
    );

    it('should enable cache and reflection for all personas', () => {
      // EXECUTE
      const configs = personas.map(p => createBaseConfig(p));

      // VERIFY: All configs have caching and reflection enabled
      configs.forEach(config => {
        expect(config.enableCache).toBe(true);
        expect(config.enableReflection).toBe(true);
      });
    });

    it('should use GLM-4.7 model for all personas', () => {
      // EXECUTE
      const configs = personas.map(p => createBaseConfig(p));

      // VERIFY: All personas use sonnet tier → GLM-4.7
      configs.forEach(config => {
        expect(config.model).toBe('GLM-4.7');
      });
    });

    it('should properly map environment variables', () => {
      // SETUP: Known environment values
      const expectedApiKey = 'test-token-123';
      const expectedBaseUrl = 'https://api.z.ai/api/anthropic';
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', expectedApiKey);
      vi.stubEnv('ANTHROPIC_BASE_URL', expectedBaseUrl);

      // EXECUTE
      const config = createBaseConfig('architect');

      // VERIFY: Environment is mapped in config.env
      expect(config.env.ANTHROPIC_API_KEY).toBeDefined();
      expect(config.env.ANTHROPIC_BASE_URL).toBe(expectedBaseUrl);
    });

    it('should generate agent name from persona', () => {
      // EXECUTE & VERIFY: Agent names follow Persona → PersonaAgent pattern
      expect(createBaseConfig('architect').name).toBe('ArchitectAgent');
      expect(createBaseConfig('researcher').name).toBe('ResearcherAgent');
      expect(createBaseConfig('coder').name).toBe('CoderAgent');
      expect(createBaseConfig('qa').name).toBe('QaAgent');
    });
  });
});
```

### Integration Points

```yaml
ENVIRONMENT:
  - uses: src/config/environment.ts (configureEnvironment, getModel)
  - call_at: Module load time (top-level execution)
  - maps: ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY

GROUNDSWELL:
  - import: 'groundswell' (via local npm link)
  - usage: createAgent(config) with returned AgentConfig
  - location: ~/projects/groundswell

FUTURE SUBTASKS:
  - P2.M1.T1.S2: Import system prompts from PROMPTS.md (system property)
  - P2.M1.T1.S3: Implement persona-specific agent creators (wrappers)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run build           # TypeScript compilation check
npm run lint            # ESLint check
npm run format:check    # Prettier format check

# Fix any issues before proceeding
npm run lint:fix        # Auto-fix linting issues
npm run format          # Auto-format code

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the agent factory module
npm run test -- tests/unit/agents/agent-factory.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/agents/

# Verify coverage meets 100% threshold
# Expected: All tests pass, 100% coverage for src/agents/agent-factory.ts

# If tests fail, debug root cause and fix implementation before proceeding.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify TypeScript compilation succeeds
npm run build

# Verify environment configuration works end-to-end
node -e "
import('./src/agents/agent-factory.js').then(m => {
  const config = m.createBaseConfig('architect');
  console.log('Config:', JSON.stringify(config, null, 2));
  console.log('Environment configured:', !!process.env.ANTHROPIC_API_KEY);
});
"

# Verify Groundswell import works (if Groundswell is linked)
node -e "
import('groundswell').then(g => {
  console.log('Groundswell loaded:', typeof g.createAgent);
}).catch(e => console.error('Groundswell not linked yet - OK for this subtask'));
"

# Expected: All imports resolve, configurations are valid, environment is mapped
```

### Level 4: Type Safety Validation

```bash
# Verify TypeScript types are correct
npx tsc --noEmit

# Verify AgentConfig interface matches expected shape
node -e "
import('./src/agents/agent-factory.js').then(m => {
  const config = m.createBaseConfig('architect');
  const test: { name: string; model: string; maxTokens: number } = config;
  console.log('Type assertion passed');
});
"

# Expected: Zero type errors, all assertions pass
```

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] All tests pass: `npm run test:run`
- [ ] 100% coverage achieved: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`
- [ ] Type checking passes: `npx tsc --noEmit`

### Feature Validation

- [ ] `AgentPersona` type defined with four literal values
- [ ] `AgentConfig` interface matches Groundswell config shape
- [ ] `createBaseConfig()` returns valid config for all personas
- [ ] Architect persona gets `maxTokens: 8192`
- [ ] Other personas get `maxTokens: 4096`
- [ ] All personas have `enableCache: true` and `enableReflection: true`
- [ ] All personas use `'GLM-4.7'` model
- [ ] `configureEnvironment()` called at module load time
- [ ] Environment variables properly mapped in `config.env`

### Code Quality Validation

- [ ] Follows existing codebase patterns (JSDoc, readonly, as const)
- [ ] File placement matches desired codebase tree
- [ ] Uses ES module imports with `.js` extensions
- [ ] Properly exports types and functions
- [ ] Test file follows AAA pattern with afterEach cleanup

### Documentation & Deployment

- [ ] Module-level JSDoc with @module, @remarks, @example
- [ ] Function JSDoc with @param, @returns, @example
- [ ] Type/interface JSDoc with @remarks
- [ ] Inline comments for non-obvious patterns
- [ ] No hardcoded values that should be constants

---

## Anti-Patterns to Avoid

- ❌ Don't skip `configureEnvironment()` call at module load time
- ❌ Don't use mutable properties (use `readonly` for all interface properties)
- ❌ Don't forget `.js` extensions in imports (ESM requirement)
- ❌ Don't use `as any` to bypass type checking
- ❌ Don't create separate functions for each persona (use factory pattern)
- ❌ Don't hardcode model names (use `getModel()` function)
- ❌ Don't skip afterEach cleanup in tests
- ❌ Don't use mutable let variables for configuration (use const with readonly objects)
- ❌ Don't create unnecessary abstractions (keep factory simple and focused)
- ❌ Don't implement system prompts in this subtask (that's P2.M1.T1.S2)

## Confidence Score: 9/10

**Justification**: This PRP provides comprehensive context including:

- Exact file paths and patterns from the existing codebase
- Complete Groundswell API specification
- Specific test patterns with code examples
- Type definitions and import paths
- Common gotchas and anti-patterns

The only reason this isn't 10/10 is that Groundswell is a locally-linked library that may have minor API differences from the documented specification. However, the architecture documentation is thorough and should account for any variations.

---

## Success Metrics

**Validation**: An AI agent unfamiliar with this codebase should be able to implement the base agent configuration successfully using only this PRP and the referenced files.

**One-Pass Implementation**: Following this PRP should result in working code on the first attempt, passing all validation gates without requiring clarification or additional research.
