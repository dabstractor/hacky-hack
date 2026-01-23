# Codebase Configuration Analysis

## Environment Variables Complete List

### Required Variables

| Variable             | Type   | Default                          | Mapped From            | Description                                      |
| -------------------- | ------ | -------------------------------- | ---------------------- | ------------------------------------------------ |
| `ANTHROPIC_API_KEY`  | string | None                             | `ANTHROPIC_AUTH_TOKEN` | API authentication key for z.ai/Anthropic SDK    |
| `ANTHROPIC_BASE_URL` | string | `https://api.z.ai/api/anthropic` | -                      | z.ai API endpoint (NOT production Anthropic API) |

**Source:** `src/config/environment.ts`

### Optional Variables

#### Pipeline Control

| Variable               | Type         | Default | Description                                                    |
| ---------------------- | ------------ | ------- | -------------------------------------------------------------- |
| `PRP_PIPELINE_RUNNING` | string (PID) | None    | Nested execution guard (prevents recursive pipeline execution) |
| `SKIP_BUG_FINDING`     | boolean      | false   | Skip bug hunt / bug fix mode                                   |
| `SKIP_EXECUTION_LOOP`  | boolean      | false   | Skip execution, run validation only                            |

#### Model Selection

| Variable                         | Type   | Default       | Description                                                    |
| -------------------------------- | ------ | ------------- | -------------------------------------------------------------- |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | string | `GLM-4.7`     | Model for Architect agent (highest quality, complex reasoning) |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | string | `GLM-4.7`     | Model for Researcher/Coder/QA agents (balanced, default)       |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | string | `GLM-4.5-Air` | Model for simple operations (fastest)                          |

#### Bug Hunt Configuration

| Variable           | Type   | Default           | Description                        |
| ------------------ | ------ | ----------------- | ---------------------------------- |
| `BUG_FINDER_AGENT` | string | `glp`             | Agent type for bug finding         |
| `BUG_RESULTS_FILE` | string | `TEST_RESULTS.md` | Output file for bug hunt results   |
| `BUGFIX_SCOPE`     | string | `subtask`         | Scope level for bug fix operations |

#### Advanced Configuration

| Variable         | Type   | Default | Description                     |
| ---------------- | ------ | ------- | ------------------------------- |
| `API_TIMEOUT_MS` | number | `60000` | Request timeout in milliseconds |

**Sources:**

- `src/config/environment.ts`
- `src/config/constants.ts`
- `src/config/types.ts`
- `plan/003_b3d3efdaf0ed/docs/external_deps.md`

### Environment Variable Mapping Logic

```typescript
// From src/config/environment.ts
export function configureEnvironment(): void {
  // Map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if API_KEY is not already set
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL if not already provided
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
  }
}
```

### Configuration Loading Priority

1. **Shell Environment** - Inherited environment variables (highest priority)
2. **`.env` File** - Local project configuration (loaded by test setup)
3. **Runtime Overrides** - Explicit environment variable settings in code
4. **Default Values** - Hardcoded defaults in TypeScript code (lowest priority)

**Special Case:** `ANTHROPIC_AUTH_TOKEN` takes precedence over `ANTHROPIC_API_KEY` when both are set.

---

## CLI Options Complete List

**Source:** `src/cli/index.ts`

### Required Options

| Option         | Type   | Default    | Description               |
| -------------- | ------ | ---------- | ------------------------- |
| `--prd <path>` | string | `./PRD.md` | Path to PRD markdown file |

### Execution Mode

| Option            | Type   | Choices                          | Default  | Description                              |
| ----------------- | ------ | -------------------------------- | -------- | ---------------------------------------- |
| `--mode <mode>`   | string | `normal`, `bug-hunt`, `validate` | `normal` | Execution mode                           |
| `--scope <scope>` | string | -                                | -        | Scope identifier (e.g., P3.M4, P3.M4.T2) |

### Boolean Flags

| Option                | Type    | Default | Description                                    |
| --------------------- | ------- | ------- | ---------------------------------------------- |
| `--continue`          | boolean | `false` | Resume from previous session                   |
| `--dry-run`           | boolean | `false` | Show plan without executing                    |
| `--verbose`           | boolean | `false` | Enable debug logging                           |
| `--machine-readable`  | boolean | `false` | Enable machine-readable JSON output            |
| `--no-cache`          | boolean | `false` | Bypass cache and regenerate all PRPs           |
| `--continue-on-error` | boolean | `false` | Treat all errors as non-fatal                  |
| `--validate-prd`      | boolean | `false` | Validate PRD and exit without running pipeline |

### Limit Options

| Option                 | Type    | Default | Description                                |
| ---------------------- | ------- | ------- | ------------------------------------------ |
| `--max-tasks <number>` | integer | None    | Maximum number of tasks to execute         |
| `--max-duration <ms>`  | integer | None    | Maximum execution duration in milliseconds |

### Scope Format Validation

Supported scope formats:

- Phase: `P1`, `P2`, etc.
- Milestone: `P1.M1`, `P3.M4`, etc.
- Task: `P1.M1.T1`, `P3.M4.T2`, etc.
- Subtask: `P1.M1.T1.S1`, `P3.M4.T2.S3`, etc.
- All: `all` (execute entire backlog)

**Validation:** Scope strings are validated using `parseScope()` from `src/core/scope-resolver.js`.

---

## Existing .env.example Analysis

**Source:** `.env.example`

### Current Structure

```bash
# .env.example - Template for PRP Pipeline configuration
# Copy this file to .env and fill in your values
#
# Usage:
#   cp .env.example .env
#   # Edit .env with your API credentials

# =============================================================================
# API AUTHENTICATION
# =============================================================================

# Your API authentication token
# This will be automatically mapped to ANTHROPIC_API_KEY
ANTHROPIC_AUTH_TOKEN=your-api-token-here

# Or set ANTHROPIC_API_KEY directly (AUTH_TOKEN takes precedence if both set)
# ANTHROPIC_API_KEY=your-api-key-here

# =============================================================================
# API ENDPOINT
# =============================================================================

# API endpoint (defaults to z.ai proxy)
# WARNING: Do NOT use https://api.anthropic.com (blocked by safeguards)
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic

# =============================================================================
# MODEL CONFIGURATION
# =============================================================================

# Model for Architect agent (highest quality, complex reasoning)
# ANTHROPIC_DEFAULT_OPUS_MODEL=GLM-4.7

# Model for Researcher/Coder agents (balanced, default)
# ANTHROPIC_DEFAULT_SONNET_MODEL=GLM-4.7

# Model for simple operations (fastest)
# ANTHROPIC_DEFAULT_HAIKU_MODEL=GLM-4.5-Air

# =============================================================================
# ADVANCED CONFIGURATION
# =============================================================================

# Request timeout in milliseconds (default: 60000)
# API_TIMEOUT_MS=300000

# =============================================================================
# SECURITY NOTES
# =============================================================================

# NEVER commit this file to version control with actual API keys
# .env is listed in .gitignore
# Only commit .env.example as a template
```

### Strengths

- Clear section headers
- Security warnings present
- Default values documented
- Mapping logic explained (AUTH_TOKEN → API_KEY)
- Critical warning about not using production Anthropic API

### Gaps (to be addressed in CONFIGURATION.md)

- Missing pipeline control variables (PRP_PIPELINE_RUNNING, SKIP_BUG_FINDING, etc.)
- Missing bug hunt configuration variables
- No CLI options documented
- No configuration priority explanation
- No model selection guidance

---

## Documentation Files Reference

### Existing Documentation Patterns

**File:** `docs/user-guide.md`

**Strengths:**

- Comprehensive TOC with anchor links
- Progressive disclosure (quick info → detailed)
- Code blocks with syntax highlighting
- Tables for reference information
- Clear use cases for each feature

**Patterns to Follow:**

- H1 title only once
- H2 for main sections
- H3 for subsections
- Tables with descriptive headers
- Code blocks with language tags
- Links to related documentation

---

## Key Configuration Gotchas

### From external_deps.md

1. **z.ai API vs Anthropic Production API**
   - Tests enforce z.ai usage
   - Using `api.anthropic.com` will cause test failures
   - Validation scripts block execution if wrong endpoint detected

2. **Environment Variable Mapping**
   - Shell uses `ANTHROPIC_AUTH_TOKEN`
   - SDK expects `ANTHROPIC_API_KEY`
   - System automatically maps at startup
   - AUTH_TOKEN takes precedence if both set

3. **Model Selection**
   - Default: GLM-4.7 for opus/sonnet, GLM-4.5-Air for haiku
   - Can be overridden via environment variables
   - Architect agent uses opus tier (GLM-4.7)
   - Researcher/Coder/QA use sonnet tier (GLM-4.7)

4. **Nested Execution Guard**
   - `PRP_PIPELINE_RUNNING` contains parent PID
   - Prevents recursive pipeline execution
   - Automatically set by pipeline controller

### From codebase analysis

1. **Scope Format is Case-Sensitive**
   - Must use uppercase P, M, T, S
   - Format: `P1.M1.T1.S1` (not `p1.m1.t1.s1`)

2. **Session Directory Structure**
   - Sessions stored in `plan/{sequence}_{hash}/`
   - Hash-based on PRD content (SHA-256)
   - Delta sessions link via `parent_session.txt`

3. **Groundswell Library Requirements**
   - Local dependency (not from npm)
   - Must be linked via `npm link`
   - Vitest path alias required for tests

4. **ES Module Imports**
   - Must use `.js` extensions in imports
   - `import { X } from './file.js'` (not `./file.ts`)

5. **Test Coverage Requirements**
   - 100% coverage required
   - Vitest with v8 provider
   - Coverage thresholds enforced in vitest.config.ts
