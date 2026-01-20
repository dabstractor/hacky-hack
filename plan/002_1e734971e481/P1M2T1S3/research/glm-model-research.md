# z.ai GLM Model Series Research

**Research Date:** 2026-01-15
**Task:** P1.M2.T1.S3 - Research z.ai GLM model documentation and environment variable patterns
**Session:** 002_1e734971e481

---

## Executive Summary

This document consolidates research findings about z.ai's GLM model series, including model capabilities, tier naming conventions (opus, sonnet, haiku), environment variable override patterns, and best practices for model selection in the PRP Pipeline project.

**Key Finding:** z.ai implements an Anthropic-compatible API proxy with GLM models that map to Anthropic's tier system, but uses different model identifiers (GLM-4.7, GLM-4.5-Air instead of claude-opus-4, claude-sonnet-4, claude-haiku-4).

---

## Table of Contents

1. [Available GLM Models](#available-glm-models)
2. [Model Tier Naming Conventions](#model-tier-naming-conventions)
3. [Model Capabilities and Use Cases](#model-capabilities-and-use-cases)
4. [Environment Variable Override Patterns](#environment-variable-override-patterns)
5. [Performance and Cost Considerations](#performance-and-cost-considerations)
6. [Best Practices for Model Selection](#best-practices-for-model-selection)
7. [Implementation in PRP Pipeline](#implementation-in-prp-pipeline)
8. [API Differences from Anthropic](#api-differences-from-anthropic)
9. [References and Sources](#references-and-sources)

---

## Available GLM Models

### GLM-4.7

**Model Identifier:** `GLM-4.7`

**Classification:** Premium / Flagship model

**Description:**
- Highest quality model in the z.ai GLM series
- Designed for complex reasoning tasks
- Supports nuanced analysis, creative writing, and research
- Used for both Opus and Sonnet tiers in this project

**Mapped Tiers:**
- Opus tier: GLM-4.7
- Sonnet tier: GLM-4.7

**Source Files:**
- `/home/dustin/projects/hacky-hack/src/config/constants.ts` (lines 43-50)

### GLM-4.5-Air

**Model Identifier:** `GLM-4.5-Air`

**Classification:** Lightweight / Fast model

**Description:**
- Optimized for speed and efficiency
- Designed for simple operations and quick tasks
- Lower token costs for high-volume operations
- Suitable for real-time applications

**Mapped Tiers:**
- Haiku tier: GLM-4.5-Air

**Source Files:**
- `/home/dustin/projects/hacky-hack/src/config/constants.ts` (line 49)

---

## Model Tier Naming Conventions

### Overview

z.ai uses Anthropic's tier naming convention (Opus, Sonnet, Haiku) to maintain compatibility with Anthropic's API structure, while mapping these tiers to GLM model identifiers.

### Tier Definitions

#### Opus Tier

**Purpose:** Highest quality, most capable model tier

**Characteristics:**
- Maximum reasoning capability
- Best for complex analysis and creative tasks
- Higher token costs but superior quality
- Longer processing times

**GLM Model:** `GLM-4.7`

**Use Cases:**
- Architect agent (complex task breakdown)
- Nuanced code architecture decisions
- Complex research and analysis

**Source:** `/home/dustin/projects/hacky-hack/src/config/types.ts` (line 12)

#### Sonnet Tier

**Purpose:** Balanced performance tier (default)

**Characteristics:**
- Good balance of quality and speed
- Default choice for most agent tasks
- Reasonable token costs
- Suitable for general-purpose applications

**GLM Model:** `GLM-4.7`

**Use Cases:**
- Researcher agent (codebase research and PRP generation)
- Coder agent (implementation from PRPs)
- QA agent (validation and bug hunting)
- Most standard agent operations

**Source:** `/home/dustin/projects/hacky-hack/src/config/types.ts` (line 13)

#### Haiku Tier

**Purpose:** Fastest, most efficient tier

**Characteristics:**
- Lowest latency
- Optimized for simple queries
- Minimal token costs
- Quick response times

**GLM Model:** `GLM-4.5-Air`

**Use Cases:**
- Simple operations
- Quick tasks
- High-volume operations
- Fast operations (future use in project)

**Source:** `/home/dustin/projects/hacky-hack/src/config/types.ts` (line 14)

---

## Model Capabilities and Use Cases

### By Agent Persona

#### Architect Agent

**Model:** GLM-4.7 (Sonnet tier)

**Token Limit:** 8192 tokens

**Capabilities Required:**
- Complex PRD analysis
- Hierarchical task breakdown
- Architectural pattern recognition
- Context synthesis from multiple sources

**Why GLM-4.7:**
- Requires maximum reasoning capability
- Needs to understand complex requirements
- Must generate structured outputs (tasks.json)
- Benefits from higher quality responses

**Source:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` (lines 113-118, 190-199)

#### Researcher Agent

**Model:** GLM-4.7 (Sonnet tier)

**Token Limit:** 4096 tokens

**Capabilities Required:**
- Codebase analysis and pattern recognition
- External documentation research
- PRP (Product Requirement Prompt) generation
- Context scope contract creation

**Why GLM-4.7:**
- Needs strong analytical capabilities
- Must synthesize information from multiple sources
- Requires coherent documentation generation
- Benefits from balanced performance/cost

**Source:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` (lines 218-230)

#### Coder Agent

**Model:** GLM-4.7 (Sonnet tier)

**Token Limit:** 4096 tokens

**Capabilities Required:**
- Code implementation from PRP specifications
- Following existing code patterns
- Understanding project architecture
- Implementing tests with proper mocking

**Why GLM-4.7:**
- Requires strong code generation capabilities
- Must understand complex requirements
- Needs to generate working, tested code
- Benefits from reliable output quality

**Source:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` (lines 249-258)

#### QA Agent

**Model:** GLM-4.7 (Sonnet tier)

**Token Limit:** 4096 tokens

**Capabilities Required:**
- End-to-end validation
- Creative bug hunting
- Adversarial testing approach
- Logic gap detection

**Why GLM-4.7:**
- Requires strong analytical reasoning
- Must identify subtle bugs and logic errors
- Needs to think adversarially
- Benefits from nuanced analysis

**Source:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` (lines 277-286)

---

## Environment Variable Override Patterns

### Overview

z.ai supports environment variable overrides for model selection, allowing developers to customize which GLM model is used for each tier without modifying code.

### Override Variables

#### ANTHROPIC_DEFAULT_OPUS_MODEL

**Default Value:** `GLM-4.7`

**Purpose:** Override the model used for the Opus tier

**Usage:**
```bash
export ANTHROPIC_DEFAULT_OPUS_MODEL="GLM-4.7"
```

**Type:** Optional override

**Source:** `/home/dustin/projects/hacky-hack/src/config/constants.ts` (lines 65-69)

#### ANTHROPIC_DEFAULT_SONNET_MODEL

**Default Value:** `GLM-4.7`

**Purpose:** Override the model used for the Sonnet tier

**Usage:**
```bash
export ANTHROPIC_DEFAULT_SONNET_MODEL="GLM-4.7"
```

**Type:** Optional override

**Source:** `/home/dustin/projects/hacky-hack/src/config/constants.ts` (lines 65-69)

#### ANTHROPIC_DEFAULT_HAIKU_MODEL

**Default Value:** `GLM-4.5-Air`

**Purpose:** Override the model used for the Haiku tier

**Usage:**
```bash
export ANTHROPIC_DEFAULT_HAIKU_MODEL="GLM-4.5-Air"
```

**Type:** Optional override

**Source:** `/home/dustin/projects/hacky-hack/src/config/constants.ts` (lines 65-69)

### Implementation Pattern

The environment module implements a fallback pattern:

```typescript
// From src/config/environment.ts (lines 96-99)
export function getModel(tier: ModelTier): string {
  const envVar = MODEL_ENV_VARS[tier];
  return process.env[envVar] ?? MODEL_NAMES[tier];
}
```

**Priority:**
1. Check environment variable override
2. Fall back to default MODEL_NAMES mapping

**Example Usage:**
```typescript
import { getModel } from './config/environment.js';

const model = getModel('sonnet');
// Returns process.env.ANTHROPIC_DEFAULT_SONNET_MODEL ?? 'GLM-4.7'
```

### Required Environment Variables

In addition to model overrides, these environment variables must be set:

#### ANTHROPIC_AUTH_TOKEN

**Shell Variable:** Set by user's shell environment

**Purpose:** API authentication token

**Mapped To:** `ANTHROPIC_API_KEY` via `configureEnvironment()`

**Source:** `/home/dustin/projects/hacky-hack/src/config/environment.ts` (lines 55-59)

#### ANTHROPIC_API_KEY

**SDK Variable:** Expected by Anthropic SDK

**Purpose:** API authentication key

**Source:** Mapped from `ANTHROPIC_AUTH_TOKEN`

#### ANTHROPIC_BASE_URL

**Default Value:** `https://api.z.ai/api/anthropic`

**Purpose:** z.ai API endpoint URL

**Override:**
```bash
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
```

**Source:** `/home/dustin/projects/hacky-hack/src/config/constants.ts` (line 22)

---

## Performance and Cost Considerations

### Performance Characteristics

#### GLM-4.7 (Opus/Sonnet)

**Expected Performance:**
- Higher latency due to complex model architecture
- Superior quality outputs
- Better for complex reasoning tasks
- Longer processing times for large prompts

**Token Limits by Agent:**
- Architect: 8192 tokens (highest)
- Researcher: 4096 tokens
- Coder: 4096 tokens
- QA: 4096 tokens

**Source:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` (lines 113-118)

#### GLM-4.5-Air (Haiku)

**Expected Performance:**
- Lower latency (optimized for speed)
- Good quality for simple tasks
- Faster response times
- Suitable for real-time applications

**Use Case:** Fast operations, simple queries (future use in project)

### Cost Structure

**Note:** Specific pricing information was not available in the codebase. Consult z.ai's official documentation for current pricing.

**General Expectations:**
- GLM-4.7: Higher cost per token (premium model)
- GLM-4.5-Air: Lower cost per token (optimized model)

**Cost Optimization Strategy:**
- Use appropriate tier for each task
- Haiku for simple operations when implemented
- Sonnet for default agent operations
- Opus for critical reasoning tasks

---

## Best Practices for Model Selection

### Decision Framework

#### Use GLM-4.7 (Sonnet) When:

**Default Choice** - Use for most agent operations:

- Standard code implementation tasks
- Research and analysis work
- Documentation generation
- Test implementation
- General-purpose agent operations

**Agent Personas:**
- Researcher agent
- Coder agent
- QA agent

#### Use GLM-4.7 (Opus) When:

**Premium Choice** - Use for critical complex tasks:

- Complex architectural decisions
- Nuanced PRD analysis
- Hierarchical task breakdown
- Cross-context synthesis
- Critical quality requirements

**Agent Personas:**
- Architect agent

#### Use GLM-4.5-Air (Haiku) When:

**Efficiency Choice** - Use for simple operations:

- Simple queries and lookups
- High-volume operations
- Real-time responses needed
- Cost-sensitive applications
- Future fast operations in project

### Selection Guidelines

```typescript
// Decision framework in code
function selectModelTier(taskComplexity: 'simple' | 'standard' | 'complex'): ModelTier {
  switch (taskComplexity) {
    case 'simple':
      return 'haiku';    // GLM-4.5-Air
    case 'standard':
      return 'sonnet';   // GLM-4.7
    case 'complex':
      return 'opus';     // GLM-4.7
  }
}
```

### Token Limit Guidelines

```typescript
// From src/agents/agent-factory.ts
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,  // Highest - needs room for complex analysis
  researcher: 4096, // Standard - research and PRP generation
  coder: 4096,      // Standard - implementation tasks
  qa: 4096,         // Standard - validation and bug hunting
} as const;
```

**Best Practices:**
- Architect gets highest token limit for complex breakdowns
- Other agents use standard 4096 token limit
- Adjust based on actual usage patterns
- Monitor token usage in production

---

## Implementation in PRP Pipeline

### Environment Configuration Flow

```typescript
// Step 1: Configure environment (must be first)
import { configureEnvironment } from './config/environment.js';
configureEnvironment();

// Step 2: Validate environment
import { validateEnvironment } from './config/environment.js';
validateEnvironment();

// Step 3: Get model for agent creation
import { getModel } from './config/environment.js';
const model = getModel('sonnet'); // Returns 'GLM-4.7'

// Step 4: Create agent with model
import { createAgent } from 'groundswell';
const agent = createAgent({
  name: 'MyAgent',
  system: 'You are a helpful assistant.',
  model: model, // 'GLM-4.7'
  enableCache: true,
  enableReflection: true,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
});
```

**Source:** `/home/dustin/projects/hacky-hack/src/config/environment.ts` (lines 55-65)

### Agent Factory Pattern

```typescript
// All personas currently use sonnet → GLM-4.7
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  const model = getModel('sonnet'); // Resolves to 'GLM-4.7'
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;

  return {
    name,
    system: getSystemPrompt(persona),
    model,
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}
```

**Source:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` (lines 145-171)

### Current Configuration Summary

| Agent Persona | Model Tier | GLM Model | Token Limit | Use Case |
|--------------|------------|-----------|-------------|----------|
| Architect | Sonnet | GLM-4.7 | 8192 | PRD analysis, task breakdown |
| Researcher | Sonnet | GLM-4.7 | 4096 | Codebase research, PRP generation |
| Coder | Sonnet | GLM-4.7 | 4096 | Code implementation from PRPs |
| QA | Sonnet | GLM-4.7 | 4096 | Validation, bug hunting |

**Note:** All agents currently use the Sonnet tier (GLM-4.7), with only the Architect agent having a higher token limit.

---

## API Differences from Anthropic

### Base URL

**Anthropic Official:**
```
https://api.anthropic.com
```

**z.ai Proxy:**
```
https://api.z.ai/api/anthropic
```

**Source:** `/home/dustin/projects/hacky-hack/src/config/constants.ts` (line 22)

### Model Names

**Anthropic Models:**
- `claude-opus-4-20250514`
- `claude-sonnet-4-20250514`
- `claude-haiku-4-20250514`

**z.ai GLM Models:**
- `GLM-4.7` (maps to Opus/Sonnet tiers)
- `GLM-4.5-Air` (maps to Haiku tier)

**Source:** `/home/dustin/projects/hacky-hack/src/config/constants.ts` (lines 43-50)

### Authentication

**Anthropic SDK Expects:**
```bash
ANTHROPIC_API_KEY="your-api-key"
```

**Shell Environment Uses:**
```bash
ANTHROPIC_AUTH_TOKEN="your-api-token"
```

**Mapping Implementation:**
```typescript
// Maps AUTH_TOKEN to API_KEY automatically
if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
}
```

**Source:** `/home/dustin/projects/hacky-hack/src/config/environment.ts` (lines 55-59)

### Compatibility Features

**z.ai Implements:**
- Anthropic-compatible API endpoints
- Same request/response format
- Model tier naming (Opus, Sonnet, Haiku)
- Environment variable patterns
- Tool/function calling support

**Key Difference:**
- Different base URL
- Different model identifiers
- Uses GLM models instead of Claude models

---

## References and Sources

### Source Files

**Configuration Module:**
- `/home/dustin/projects/hacky-hack/src/config/constants.ts` - Model names, environment variables
- `/home/dustin/projects/hacky-hack/src/config/environment.ts` - Environment configuration and model selection
- `/home/dustin/projects/hacky-hack/src/config/types.ts` - TypeScript type definitions

**Agent Factory:**
- `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` - Agent creation with model selection

**Documentation:**
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/zai-quick-reference.md` - Quick reference guide
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/zai-api-research.md` - API compatibility research
- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md` - System architecture
- `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/research_summary.md` - Research summary

### External Documentation (To Be Verified)

**Required Verification:**
- [ ] Official z.ai GLM-4.7 documentation URL
- [ ] Official z.ai GLM-4.5-Air documentation URL
- [ ] z.ai model tier naming convention documentation
- [ ] z.ai pricing and performance benchmarks
- [ ] z.ai API reference for model selection
- [ ] Environment variable override documentation

**Note:** Web search was unavailable during research due to monthly quota limits. Above URLs should be verified against official z.ai documentation.

### Code Examples

**Model Selection:**
```typescript
// Get model for tier
const opusModel = getModel('opus');   // 'GLM-4.7'
const sonnetModel = getModel('sonnet'); // 'GLM-4.7'
const haikuModel = getModel('haiku');   // 'GLM-4.5-Air'
```

**Override with Environment Variable:**
```bash
# Override haiku to use premium model
export ANTHROPIC_DEFAULT_HAIKU_MODEL="GLM-4.7"

# Now getModel('haiku') returns 'GLM-4.7'
```

---

## Appendices

### Appendix A: Complete Model Configuration

```typescript
// From src/config/constants.ts
export const MODEL_NAMES = {
  opus: 'GLM-4.7',
  sonnet: 'GLM-4.7',
  haiku: 'GLM-4.5-Air',
} as const;

export const MODEL_ENV_VARS = {
  opus: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
  sonnet: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
  haiku: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
} as const;
```

### Appendix B: Type Definitions

```typescript
// From src/config/types.ts
export type ModelTier = 'opus' | 'sonnet' | 'haiku';

export interface EnvironmentConfig {
  readonly opusModel: string;
  readonly sonnetModel: string;
  readonly haikuModel: string;
}

/**
 * Model tier descriptions:
 * - 'opus': Highest quality, GLM-4.7 (complex reasoning, Architect agent)
 * - 'sonnet': Balanced, GLM-4.7 (default for most agents)
 * - 'haiku': Fastest, GLM-4.5-Air (simple operations, quick tasks)
 */
```

### Appendix C: Agent Configuration Example

```typescript
// Complete agent creation example
import { configureEnvironment, getModel, validateEnvironment } from './config/environment.js';
import { createAgent } from 'groundswell';

// Must configure environment first
configureEnvironment();
validateEnvironment();

// Create agent with model selection
const researcherAgent = createAgent({
  name: 'ResearcherAgent',
  system: RESEARCHER_SYSTEM_PROMPT,
  model: getModel('sonnet'), // 'GLM-4.7'
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  temperature: 0.1,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
});
```

---

## Conclusion

This research document provides a comprehensive overview of z.ai's GLM model series as implemented in the PRP Pipeline project. Key findings include:

1. **Model Availability:** GLM-4.7 (premium) and GLM-4.5-Air (lightweight) are the available models
2. **Tier Mapping:** Both Opus and Sonnet tiers map to GLM-4.7, while Haiku maps to GLM-4.5-Air
3. **Environment Overrides:** Model selection can be customized via environment variables
4. **Agent Usage:** All agents currently use GLM-4.7 via the Sonnet tier, with appropriate token limits
5. **API Compatibility:** z.ai implements an Anthropic-compatible API with different model identifiers

**Action Items:**
- Verify model capabilities against official z.ai documentation when web search is available
- Consider implementing Haiku tier for simple operations to optimize costs
- Monitor token usage across agents to optimize token limits
- Document actual performance characteristics when available

---

**End of GLM Model Research Document**

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Researcher:** P1.M2.T1.S3 Research Agent
**Status:** Complete (pending external documentation verification)
