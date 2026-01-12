# Product Requirement Prompt (PRP): Environment Configuration Module

**PRP ID**: P1.M1.T2.S1
**Work Item**: Create environment configuration module
**Story Points**: 2
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create a type-safe environment configuration module that maps shell environment variables to SDK expectations and provides validated access to Anthropic/z.ai API configuration.

**Deliverable**: `src/config/environment.ts` with three exported functions: `configureEnvironment()`, `getModel()`, and `validateEnvironment()`, fully typed with TypeScript interfaces and JSDoc documentation.

**Success Definition**:

- All three functions are implemented and exported
- `ANTHROPIC_AUTH_TOKEN` is correctly mapped to `ANTHROPIC_API_KEY`
- Model tier selection returns correct model names (GLM-4.7, GLM-4.5-Air)
- Validation throws descriptive errors for missing required variables
- All exports have comprehensive JSDoc comments
- TypeScript compiles without errors
- Module can be imported using ESM syntax

---

## User Persona

**Target User**: Developer implementing the PRP pipeline and Groundswell agent integrations.

**Use Case**: Before creating any Groundswell agents, the developer needs to configure the environment to ensure proper API authentication and model selection for the z.ai API endpoint.

**User Journey**:

1. Developer imports `configureEnvironment` from `src/config/environment.js`
2. Calls `configureEnvironment()` at application startup
3. Optionally calls `validateEnvironment()` to verify required variables
4. Uses `getModel('opus' | 'sonnet' | 'haiku')` to get model names for agent creation

**Pain Points Addressed**:

- **Variable name mismatch**: Shell uses `ANTHROPIC_AUTH_TOKEN` but SDK expects `ANTHROPIC_API_KEY`
- **Scattered configuration**: Model names and API endpoint scattered across multiple locations
- **Missing validation**: No type-safe way to verify environment is properly configured
- **No single source of truth**: Configuration details duplicated in shell config and application code

---

## Why

- **Foundation for all LLM interactions**: Every Groundswell agent created in subsequent tasks (P2.M1.T1) depends on proper environment configuration
- **Enables z.ai API compatibility**: The project uses z.ai as the API provider (not Anthropic directly), requiring custom base URL configuration
- **Security**: Proper token handling prevents accidental exposure of credentials in logs and state snapshots
- **Developer experience**: Type-safe access to environment variables reduces runtime errors and improves IDE autocomplete
- **Maintainability**: Single module for all environment configuration makes updates easier as the project evolves

---

## What

Create a TypeScript module that:

1. **Maps environment variables**: Transforms `ANTHROPIC_AUTH_TOKEN` (shell) to `ANTHROPIC_API_KEY` (SDK)
2. **Provides model selection**: Returns correct model names based on tier (opus/sonnet/haiku)
3. **Validates configuration**: Checks that required variables exist and throws descriptive errors
4. **Sets defaults**: Provides default values for optional variables like `ANTHROPIC_BASE_URL`

### Success Criteria

- [ ] `configureEnvironment()` function maps `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY`
- [ ] `configureEnvironment()` sets `ANTHROPIC_BASE_URL` default to `https://api.z.ai/api/anthropic`
- [ ] `getModel(tier)` returns correct model: `'GLM-4.7'` for opus/sonnet, `'GLM-4.5-Air'` for haiku
- [ ] `validateEnvironment()` throws `Error` with descriptive message if required variables missing
- [ ] All functions have JSDoc comments with `@example` and `@throws` documentation
- [ ] TypeScript interfaces defined for all function parameters and return types
- [ ] Module uses ESM syntax (`export function`, `.js` extensions in imports)
- [ ] `tsc --noEmit` completes without errors

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes - this PRP provides:

- Exact file location and expected structure
- Complete function signatures with TypeScript types
- Specific environment variable mappings and values
- JSDoc patterns to follow
- Validation requirements with error message formats
- Test patterns for verification

### Documentation & References

```yaml
# MUST READ - Critical architecture documentation

- file: plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Defines the exact environment variable mapping, model names, and base URL required
  critical: The shell uses ANTHROPIC_AUTH_TOKEN but SDK expects ANTHROPIC_API_KEY - this mapping is CRITICAL
  section: Lines 10-32 (Environment Variables tables)

- file: plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Provides reference implementation pattern for configureEnvironment() and getModel()
  pattern: Follow the code example in lines 61-79 exactly
  gotcha: The example in environment_config.md has a syntax error (missing colon and parameter type) - DO NOT copy directly

- file: plan/001_14b9dc2a33c7/tasks.json
  why: Shows this task's position in the overall plan and dependency on P1.M1.T1.S4 (src/config/ directory creation)
  context: P1.M1.T2.S1 is a foundation task that all subsequent agent creation depends on

- url: https://www.typescriptlang.org/docs/handbook/modules/reference.html#exporting-and-importing
  why: ESM export syntax for TypeScript modules (.js extensions in imports)
  critical: This project uses `"type": "module"` in package.json with NodeNext module resolution

- url: https://nodejs.org/docs/latest-v20.x/api/process.html#processenv
  why: Node.js 20+ process.env type definition and access patterns
  gotcha: process.env values are `string | undefined` - always validate before use

- url: https://jsdoc.app/index.html
  why: JSDoc comment syntax for TypeScript documentation
  pattern: Use `@param`, `@returns`, `@throws`, `@example` tags for complete documentation

- url: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
  why: TypeScript best practices for declaration comments and documentation
```

### Current Codebase Tree

```bash
.
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/
│       │   ├── environment_config.md     # Environment variable definitions and mappings
│       │   ├── groundswell_api.md        # Groundswell agent patterns
│       │   └── system_context.md         # Overall system architecture
│       └── tasks.json                    # Task hierarchy and status
├── src/
│   ├── agents/                           # (empty - will contain Groundswell agents)
│   ├── config/                           # (empty - TARGET DIRECTORY for this PRP)
│   ├── core/                             # (empty - will contain pipeline logic)
│   ├── utils/                            # (empty - will contain helper utilities)
│   └── workflows/                        # (empty - will contain workflow definitions)
├── tests/
│   ├── integration/                      # (empty - for P1.M1.T2.S2 tests)
│   └── unit/                             # (empty - for P1.M1.T2.S2 tests)
├── package.json                          # Node.js 20+, TypeScript 5.2+, ESM, Zod 3.22.4
├── tsconfig.json                         # TypeScript: ES2022 target, NodeNext resolution, strict mode
└── .gitignore                            # Security: excludes .env, .env.local, *.key
```

### Desired Codebase Tree with Files to be Added

```bash
src/
└── config/
    └── environment.ts                    # NEW: Environment configuration module (this PRP)
        # Exports:
        # - configureEnvironment(): void
        # - getModel(tier: ModelTier): string
        # - validateEnvironment(): void
        # - Types: ModelTier, EnvironmentConfig
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Shell environment uses ANTHROPIC_AUTH_TOKEN but Anthropic SDK expects ANTHROPIC_API_KEY
// If mapping is not done, agent creation will fail with "API key not found" error

// CRITICAL: This project uses "type": "module" in package.json (ESM)
// Import statements must use .js extension:
// import { configureEnvironment } from './config/environment.js';  // CORRECT
// import { configureEnvironment } from './config/environment';    // WRONG - will fail at runtime

// CRITICAL: TypeScript target is ES2022 with NodeNext module resolution
// process.env values are typed as string | undefined
// Always validate existence before use: process.env.VAR ?? 'default'

// GOTCHA: The example code in environment_config.md has syntax errors
// Line 73: "export function getModel tier()" is missing colon and parameter type
// Correct syntax: "export function getModel(tier: ModelTier): string"

// GOTCHA: TypeScript strict mode is enabled
// All implicit any types will cause compilation errors
// All function parameters must have explicit type annotations

// GOTCHA: JSDoc comments should use @example tag with executable code snippets
// IDEs will display these in autocomplete tooltips

// GOTCHA: z.ai API base URL differs from Anthropic's official endpoint
// Anthropic: https://api.anthropic.com
// z.ai:      https://api.z.ai/api/anthropic
// This is a custom proxy endpoint, not the official Anthropic API
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Model tier identifier for selecting GLM models
 *
 * @remarks
 * Each tier corresponds to a specific GLM model with different capabilities:
 * - 'opus': Highest quality, GLM-4.7 (complex reasoning, Architect agent)
 * - 'sonnet': Balanced, GLM-4.7 (default for most agents)
 * - 'haiku': Fastest, GLM-4.5-Air (simple operations, quick tasks)
 */
export type ModelTier = 'opus' | 'sonnet' | 'haiku';

/**
 * Environment configuration interface
 *
 * @remarks
 * Defines the shape of validated environment variables.
 * All properties are required after configuration is complete.
 */
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

/**
 * Error thrown when required environment variables are missing
 */
export class EnvironmentValidationError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'EnvironmentValidationError';
    this.missing = missing;
  }
}
```

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: CREATE src/config/types.ts
  - IMPLEMENT: ModelTier type alias, EnvironmentConfig interface, EnvironmentValidationError class
  - PATTERN: Use TypeScript 'readonly' modifier for immutable properties
  - NAMING: PascalCase for types and classes, camelCase for properties
  - PLACEMENT: src/config/types.ts (separate file for reusability)
  - DEPENDENCIES: None

Task 2: CREATE src/config/constants.ts
  - IMPLEMENT: Default values for BASE_URL, model names
  - PATTERN: Use const assertions for inferred literal types
  - NAMING: UPPER_SNAKE_CASE for constants
  - PLACEMENT: src/config/constants.ts
  - CONTENT:
    ```typescript
    export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;
    export const MODEL_NAMES = {
      opus: 'GLM-4.7',
      sonnet: 'GLM-4.7',
      haiku: 'GLM-4.5-Air',
    } as const;
    ```

Task 3: CREATE src/config/environment.ts
  - IMPLEMENT: configureEnvironment() function
  - LOGIC:
    1. Check if ANTHROPIC_AUTH_TOKEN exists and ANTHROPIC_API_KEY doesn't
    2. If so, set process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN
    3. Set process.env.ANTHROPIC_BASE_URL if not already set
  - PATTERN: Modify process.env in place (side effect pattern is intentional here)
  - JSDOC: Include @example showing usage
  - PLACEMENT: src/config/environment.ts
  - DEPENDENCIES: Task 2 (for DEFAULT_BASE_URL)

Task 4: IMPLEMENT getModel() in src/config/environment.ts
  - SIGNATURE: export function getModel(tier: ModelTier): string
  - LOGIC: Return model name from environment or default
  - IMPLEMENTATION:
    ```typescript
    const defaultModels = {
      opus: 'GLM-4.7',
      sonnet: 'GLM-4.7',
      haiku: 'GLM-4.5-Air',
    };
    const envVar = tier === 'opus' ? 'ANTHROPIC_DEFAULT_OPUS_MODEL'
                 : tier === 'sonnet' ? 'ANTHROPIC_DEFAULT_SONNET_MODEL'
                 : 'ANTHROPIC_DEFAULT_HAIKU_MODEL';
    return process.env[envVar] ?? defaultModels[tier];
    ```
  - JSDOC: Document each tier's model and use case
  - PLACEMENT: Add to src/config/environment.ts
  - DEPENDENCIES: Task 1 (for ModelTier type)

Task 5: IMPLEMENT validateEnvironment() in src/config/environment.ts
  - SIGNATURE: export function validateEnvironment(): void
  - LOGIC:
    1. Check that ANTHROPIC_API_KEY exists (after mapping)
    2. Check that ANTHROPIC_BASE_URL exists
    3. Throw EnvironmentValidationError if any missing
    4. Include all missing variable names in error message
  - ERROR MESSAGE: "Missing required environment variables: ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL"
  - JSDOC: Use @throws tag to document EnvironmentValidationError
  - PLACEMENT: Add to src/config/environment.ts
  - DEPENDENCIES: Task 1 (for EnvironmentValidationError)

Task 6: VERIFY TypeScript compilation
  - RUN: npx tsc --noEmit
  - EXPECTED: No errors
  - IF ERRORS: Fix type annotations, add missing imports, check JSDoc syntax
  - VALIDATION: All types are correctly inferred and no implicit any

Task 7: CREATE manual verification script (optional)
  - CREATE: tests/manual/env-test.ts
  - PURPOSE: Verify environment mapping works correctly
  - CONTENT: Log before/after state of process.env variables
  - RUN: npx tsx tests/manual/env-test.ts
````

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// CRITICAL PATTERNS - Follow these for consistency
// ============================================================================

// PATTERN 1: Environment variable access with undefined check
// BAD: const apiKey = process.env.ANTHROPIC_API_KEY;  // Type is string | undefined
// GOOD: const apiKey = process.env.ANTHROPIC_API_KEY ?? '';  // Type is string

// PATTERN 2: Function signatures with explicit types
// BAD: export function getModel(tier) {  // Implicit any error in strict mode
// GOOD: export function getModel(tier: ModelTier): string {

// PATTERN 3: JSDoc comment structure (use for ALL exports)
/**
 * Configure environment variables for z.ai API compatibility
 *
 * @remarks
 * Maps ANTHROPIC_AUTH_TOKEN (shell) to ANTHROPIC_API_KEY (SDK expectation).
 * Sets default values for optional variables like ANTHROPIC_BASE_URL.
 *
 * @example
 * ```ts
 * import { configureEnvironment } from './config/environment.js';
 *
 * configureEnvironment();  // Must be called before creating agents
 * console.log(process.env.ANTHROPIC_API_KEY);  // Now available
 * ```
 */
export function configureEnvironment(): void {
  // Implementation...
}

// PATTERN 4: Error construction with helpful messages
// BAD: throw new Error('Missing env var');
// GOOD:
const missing: string[] = [];
if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
if (missing.length > 0) {
  throw new EnvironmentValidationError(missing);
}

// PATTERN 5: Read-only process.env access after configuration
// NOTE: process.env can be modified, but treat it as read-only after configureEnvironment()
// This prevents accidental overwrites of critical values

// GOTCHA: TypeScript's process.env typing
// process.env['NEW_VAR'] = 'value' works at runtime but TypeScript may complain
// Solution: Use process.env.NEW_VAR = 'value' or cast as any

// GOTCHA: ESM import syntax
// Imports MUST include .js extension (TypeScript adds this during build)
import { configureEnvironment } from './config/environment.js'; // CORRECT

// GOTCHA: Const assertions for literal types
// 'as const' preserves literal types instead of widening to string
const MODELS = { opus: 'GLM-4.7' } as const; // Type is { readonly opus: "GLM-4.7" }
const MODELS = { opus: 'GLM-4.7' }; // Type is { opus: string }
````

### Integration Points

```yaml
PROCESS_ENV:
  - modify: process.env.ANTHROPIC_API_KEY (mapped from ANTHROPIC_AUTH_TOKEN)
  - modify: process.env.ANTHROPIC_BASE_URL (set default if missing)
  - read: ANTHROPIC_DEFAULT_OPUS_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL, ANTHROPIC_DEFAULT_HAIKU_MODEL

FUTURE_INTEGRATION (not part of this PRP):
  - P2.M1.T1: Groundswell agent factory will use getModel() for agent model selection
  - P3.M4.T2: Main CLI entry point will call configureEnvironment() before pipeline execution
  - P1.M1.T2.S2: Environment validation tests will use validateEnvironment() in test cases

CONFIG_FILES:
  - reference: plan/001_14b9dc2a33c7/architecture/environment_config.md
  - shell_config: ~/.config/zsh/functions.zsh (contains _glm_config() and gle() function)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npx tsc --noEmit src/config/*.ts           # Type check new files
npx tsc --noEmit                           # Full project type check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common errors:
# - TS2307: Cannot find module -> Check import paths include .js extension
# - TS7006: Parameter implicitly has 'any' type -> Add explicit type annotation
# - TS2322: Type 'string | undefined' is not assignable to type 'string' -> Add null check

# Format check (if Prettier is configured in P1.M1.T3)
npx prettier --check src/config/*.ts
```

### Level 2: Unit Tests (Component Validation)

```bash
# NOTE: These tests will be created in P1.M1.T2.S2 (next subtask)
# For now, perform manual verification:

# Create test script: tests/manual/env-test.ts
cat > tests/manual/env-test.ts << 'EOF'
import { configureEnvironment, getModel, validateEnvironment } from '../../src/config/environment.js';

console.log('=== Before configureEnvironment ===');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY);
console.log('ANTHROPIC_AUTH_TOKEN:', process.env.ANTHROPIC_AUTH_TOKEN?.slice(0, 10) + '...');

configureEnvironment();

console.log('\n=== After configureEnvironment ===');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY?.slice(0, 10) + '...');
console.log('ANTHROPIC_BASE_URL:', process.env.ANTHROPIC_BASE_URL);

console.log('\n=== Model Selection ===');
console.log('getModel("opus"):', getModel('opus'));
console.log('getModel("sonnet"):', getModel('sonnet'));
console.log('getModel("haiku"):', getModel('haiku'));

console.log('\n=== Validation ===');
try {
  validateEnvironment();
  console.log('Validation passed!');
} catch (error) {
  console.error('Validation failed:', error.message);
}
EOF

# Run manual test
npx tsx tests/manual/env-test.ts

# Expected output:
# - ANTHROPIC_API_KEY is set after configureEnvironment()
# - getModel() returns GLM-4.7 for opus/sonnet, GLM-4.5-Air for haiku
# - validateEnvironment() passes or throws descriptive error
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify module can be imported from other parts of the project
cat > tests/integration/env-import-test.ts << 'EOF'
// Test that the module can be imported with correct ESM syntax
import { configureEnvironment, getModel, validateEnvironment } from '../src/config/environment.js';

console.log('Import successful!');
console.log('Functions exported:', {
  configureEnvironment: typeof configureEnvironment,
  getModel: typeof getModel,
  validateEnvironment: typeof validateEnvironment,
});
EOF

npx tsx tests/integration/env-import-test.ts

# Expected: "Import successful!" with all functions showing "function"

# Verify TypeScript compilation from a consuming module
cat > tests/integration/consumer-test.ts << 'EOF'
import { getModel, type ModelTier } from '../src/config/environment.js';

const tier: ModelTier = 'sonnet';
const model = getModel(tier);
console.log(`Selected model for ${tier}: ${model}`);
EOF

npx tsc --noEmit tests/integration/consumer-test.ts

# Expected: No compilation errors
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Verify environment mapping with actual shell environment
# This tests the AUTH_TOKEN -> API_KEY mapping that is critical for z.ai compatibility

# Test 1: Verify mapping works when only AUTH_TOKEN is set
unset ANTHROPIC_API_KEY
export ANTHROPIC_AUTH_TOKEN="test-token-12345"
npx tsx -e "import('./src/config/environment.js').then(m => { m.configureEnvironment(); console.log('API_KEY set:', !!process.env.ANTHROPIC_API_KEY); })"
# Expected: "API_KEY set: true"

# Test 2: Verify existing API_KEY is not overwritten
export ANTHROPIC_API_KEY="original-key"
export ANTHROPIC_AUTH_TOKEN="different-key"
npx tsx -e "import('./src/config/environment.js').then(m => { m.configureEnvironment(); console.log('API_KEY:', process.env.ANTHROPIC_API_KEY); })"
# Expected: "API_KEY: original-key" (not overwritten)

# Test 3: Verify BASE_URL default is set
unset ANTHROPIC_BASE_URL
npx tsx -e "import('./src/config/environment.js').then(m => { m.configureEnvironment(); console.log('BASE_URL:', process.env.ANTHROPIC_BASE_URL); })"
# Expected: "BASE_URL: https://api.z.ai/api/anthropic"

# Test 4: Validate JSDoc comments are present and parseable
npx tsx -e "import('./src/config/environment.js').then(m => { console.log('Module loaded successfully'); })"
# If JSDoc has syntax errors, TypeScript will report them during compilation
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 3 functions implemented: `configureEnvironment()`, `getModel()`, `validateEnvironment()`
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] JSDoc comments present on all exports with `@example` and `@throws` tags
- [ ] File uses ESM syntax (no `export =`, no `require()`)
- [ ] Type annotations use `ModelTier` type alias for tier parameter
- [ ] `readonly` modifier used on interface properties
- [ ] Const assertions (`as const`) used for literal type values

### Feature Validation

- [ ] `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` mapping works correctly
- [ ] Existing `ANTHROPIC_API_KEY` is not overwritten by mapping
- [ ] `ANTHROPIC_BASE_URL` defaults to `https://api.z.ai/api/anthropic`
- [ ] `getModel('opus')` returns `'GLM-4.7'`
- [ ] `getModel('sonnet')` returns `'GLM-4.7'`
- [ ] `getModel('haiku')` returns `'GLM-4.5-Air'`
- [ ] `validateEnvironment()` throws when `ANTHROPIC_API_KEY` is missing
- [ ] Error messages include all missing variable names

### Code Quality Validation

- [ ] Follows existing codebase patterns (TypeScript strict mode, ESM imports)
- [ ] File placement matches desired structure: `src/config/environment.ts`
- [ ] No hardcoded values that should be constants (use `constants.ts`)
- [ ] Security: No logging of `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY` values
- [ ] Functions are pure (no side effects except `configureEnvironment` modifying process.env)
- [ ] Type exports (`ModelTier`, `EnvironmentConfig`) for consumer use

### Documentation & Deployment

- [ ] JSDoc comments include `@example` with executable code
- [ ] `@throws` documents `EnvironmentValidationError` for `validateEnvironment()`
- [ ] `@remarks` used for additional context where needed
- [ ] Module-level JSDoc explains purpose and usage

---

## Anti-Patterns to Avoid

- ❌ **Don't use `require()` syntax** - This is an ESM project, use `import` with `.js` extensions
- ❌ **Don't skip JSDoc comments** - They provide critical IDE autocomplete and documentation
- ❌ **Don't log sensitive values** - Never output `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY`
- ❌ **Don't overwrite existing `ANTHROPIC_API_KEY`** - Only map if `API_KEY` is not already set
- ❌ **Don't use implicit `any` types** - Strict mode will reject this, always type parameters
- ❌ **Don't put constants inline** - Extract to `constants.ts` for maintainability
- ❌ **Don't use `export default`** - Use named exports for better tree-shaking and clarity
- ❌ **Don't ignore undefined values** - Use nullish coalescing (`??`) for defaults

---

## Confidence Score

**8/10** - One-pass implementation success likelihood

**Confidence Rationale**:

- ✅ Complete environment variable mapping specified with exact values
- ✅ Function signatures fully specified with TypeScript types
- ✅ JSDoc patterns and examples provided
- ✅ Validation requirements clearly defined
- ✅ No ambiguity in implementation approach
- ⚠️ Minor deduction: Depends on `src/config/` directory existing from P1.M1.T1.S4 (should be verified before starting)

**Risk Mitigation**:

- Verify `src/config/` directory exists before starting implementation
- Run `npx tsc --noEmit` before making any changes to establish baseline
- Test environment mapping manually before writing production code
