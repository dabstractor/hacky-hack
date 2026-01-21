# Environment Configuration System Analysis

## Summary

This document provides a comprehensive analysis of the environment configuration system in the PRP Pipeline codebase. The system is designed for z.ai API compatibility with type-safe access and validation.

## 1. Environment Configuration File

### Primary Configuration File: `/home/dustin/projects/hacky-hack/src/config/environment.ts`

The environment configuration is centralized in the `environment.ts` module, which provides:

- **Environment variable mapping**: Converts `ANTHROPIC_AUTH_TOKEN` to `ANTHROPIC_API_KEY` for SDK compatibility
- **Default values**: Sets default `ANTHROPIC_BASE_URL` if not provided
- **Model selection**: Tier-based model name resolution with environment overrides
- **Validation**: Ensures required variables are present before agent creation

#### Key Functions:

```typescript
// Maps environment variables and sets defaults
export function configureEnvironment(): void {
  // Maps ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if API_KEY is not already set
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL if not already provided
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
  }
}

// Get model name for a given tier with environment override support
export function getModel(tier: ModelTier): string {
  const envVar = MODEL_ENV_VARS[tier];
  return process.env[envVar] ?? MODEL_NAMES[tier];
}

// Validate required environment variables are set
export function validateEnvironment(): void {
  const missing: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (!process.env.ANTHROPIC_BASE_URL) {
    missing.push('ANTHROPIC_BASE_URL');
  }

  if (missing.length > 0) {
    throw new EnvironmentValidationError(missing);
  }
}
```

## 2. Environment Variable Access Patterns

### Access Methods:

1. **Direct access**: Uses `process.env.VARIABLE_NAME` pattern
2. **Centralized configuration**: All configuration happens through `environment.ts` module
3. **No global config object**: No centralized config object exists - direct process.env access is used

### Usage Patterns:

```typescript
// In environment.ts (configuration)
process.env.ANTHROPIC_API_KEY
process.env.ANTHROPIC_BASE_URL
process.env.ANTHROPIC_AUTH_TOKEN

// In agent-factory.ts (usage)
env: {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
}
```

## 3. Related Environment Variables

### Core API Variables:

- `ANTHROPIC_AUTH_TOKEN` (input): Shell environment variable for authentication
- `ANTHROPIC_API_KEY` (SDK): Expected by Anthropic/z.ai SDK (mapped from AUTH_TOKEN)
- `ANTHROPIC_BASE_URL`: API endpoint URL (defaults to `https://api.z.ai/api/anthropic`)

### Model Override Variables:

- `ANTHROPIC_DEFAULT_OPUS_MODEL`: Override default opus model name
- `ANTHROPIC_DEFAULT_SONNET_MODEL`: Override default sonnet model name
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`: Override default haiku model name

### Directory Variables (Session Context):

- `$SESSION_DIR`: Session directory path (used in prompts, not directly in code)
- `$PREV_SESSION_DIR`: Previous session directory (used in delta analysis prompts)

### NOT Found Variables:

- `PRP_PIPELINE_RUNNING`: Not found in the codebase
- `SKIP_BUG_FINDING`: Not found in the codebase
- `PLAN_DIR`: Not found in the codebase

## 4. Environment Variable Types/Interfaces

### TypeScript Interfaces:

```typescript
// From /home/dustin/projects/hacky-hack/src/config/types.ts

export type ModelTier = 'opus' | 'sonnet' | 'haiku';

export interface EnvironmentConfig {
  /** API authentication key (mapped from ANTHROPIC_AUTH_TOKEN) */
  readonly apiKey: string;
  /** Base URL for z.ai API endpoint */
  readonly baseURL: string;
  /** Model name for opus tier */
  readonly opusModel: string;
  /** Model name for sonnet tier */
  readonly sonnetModel: string;
  /** Model name for haiku tier */
  readonly haikuModel: string;
}

export class EnvironmentValidationError extends Error {
  readonly missing: string[];
  constructor(missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'EnvironmentValidationError';
    this.missing = missing;
  }
}
```

### Constants:

```typescript
// From /home/dustin/projects/hacky-hack/src/config/constants.ts

export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;

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

export const REQUIRED_ENV_VARS = {
  apiKey: 'ANTHROPIC_API_KEY',
  baseURL: 'ANTHROPIC_BASE_URL',
} as const;
```

## 5. Usage in PRPPipeline and CLI

### CLI Entry Point (`/home/dustin/projects/hacky-hack/src/index.ts`):

```typescript
// Environment configuration happens FIRST - critical for API operations
async function main(): Promise<number> {
  // Parse CLI arguments first
  const args: CLIArgs = parseCLIArgs();

  // Setup global error handlers
  setupGlobalHandlers(args.verbose);

  // CRITICAL: Configure environment before any API operations
  configureEnvironment();

  // Continue with pipeline creation and execution...
  const pipeline = new PRPPipeline(/* args... */);
  const result = await pipeline.run();
}
```

### PRPPipeline Class:

The PRPPipeline class does **not** directly access environment variables. Instead:

1. Environment is configured at application startup (`index.ts`)
2. Configuration is passed to agent factory through `env` object
3. Pipeline receives configuration via constructor parameters (CLI args)

```typescript
// PRPPipeline constructor (from CLI args)
constructor(
  prdPath: string,
  scope?: Scope,
  mode?: 'normal' | 'bug-hunt' | 'validate',
  noCache: boolean = false,
  continueOnError: boolean = false,
  maxTasks?: number,
  maxDuration?: number,
  planDir?: string
) {
  // No direct environment variable access
  // Configuration comes from CLI args
}
```

## 6. Initialization and Setup Patterns

### Initialization Sequence:

1. **Application Entry Point** (`src/index.ts`):
   - Parses CLI arguments
   - Calls `configureEnvironment()` first (critical!)
   - Initializes logging
   - Creates PRPPipeline instance
   - Runs pipeline

2. **Environment Configuration** (`src/config/environment.ts`):
   - Maps `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` (if API_KEY not set)
   - Sets default `ANTHROPIC_BASE_URL` if not provided
   - Must be called before any agent creation

3. **Agent Creation** (`src/agents/agent-factory.ts`):
   - Uses configured environment variables
   - Passes them to agent configuration

### Key Gotchas:

1. **Order Matters**: `configureEnvironment()` must be called before creating agents
2. **Idempotent**: Configuration can be called multiple times safely
3. **Validation**: `validateEnvironment()` should be called after configuration
4. **No Pipeline State**: PRPPipeline itself doesn't access environment variables directly
5. **Prompt Variables**: `$SESSION_DIR` is used in prompts but not as actual env vars

## 7. Special Behaviors

### Environment Variable Mapping:

- **One-way mapping**: `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` only if API_KEY not already set
- **Preservation**: Existing `ANTHROPIC_API_KEY` values are never overwritten
- **Default Fallback**: If `ANTHROPIC_BASE_URL` is not set, defaults to z.ai endpoint

### Model Selection:

- **Tier-based**: Three tiers: 'opus', 'sonnet', 'haiku'
- **Environment Overrides**: Can override default models via `ANTHROPIC_DEFAULT_*_MODEL` vars
- **Default Models**:
  - Opus: GLM-4.7 (highest quality)
  - Sonnet: GLM-4.7 (balanced, default)
  - Haiku: GLM-4.5-Air (fastest)

### Error Handling:

- **Validation Error**: `EnvironmentValidationError` includes array of missing variables
- **Early Exit**: Application exits with descriptive error if validation fails
- **Graceful Fallback**: Missing optional variables use sensible defaults

## 8. Testing

The environment configuration is thoroughly tested in `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts` with 100% coverage:

- Variable mapping scenarios
- Default value setting
- Environment override behavior
- Validation error cases
- Idempotency testing

## Conclusion

The environment configuration system is well-structured with clear separation of concerns:

1. **Configuration**: Centralized in `environment.ts` with mapping and validation
2. **Access**: Direct `process.env` access pattern (no global config object)
3. **Usage**: Primarily through agent factory for SDK compatibility
4. **Safety**: Critical early initialization with validation

The system successfully bridges shell environment expectations with SDK requirements while providing type safety and comprehensive error handling.
