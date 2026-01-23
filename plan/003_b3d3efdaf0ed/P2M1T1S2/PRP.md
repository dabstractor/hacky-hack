# Product Requirement Prompt (PRP): P2.M1.T1.S2 - Create configuration reference

---

## Goal

**Feature Goal**: Create comprehensive configuration reference documentation (`docs/CONFIGURATION.md`) that serves as the single source of truth for all environment variables, CLI options, and configuration settings in the PRP Pipeline, enabling users to configure the system correctly without trial and error.

**Deliverable**: Documentation file `docs/CONFIGURATION.md` with complete configuration reference covering:

- All environment variables with descriptions, defaults, and security notes
- Configuration source priority (shell > .env > runtime)
- All CLI options with descriptions and examples
- Model selection configuration and guidance
- Example .env file with security best practices
- Cross-references between related configuration options

**Success Definition**: A user can:

1. Find any configuration option in the documentation
2. Understand the difference between required and optional settings
3. Know how to set environment variables correctly (security, priority)
4. Reference CLI options without trial and error
5. Understand model selection and which models to use for which agents
6. Avoid common configuration pitfalls documented in the gotchas section

## User Persona

**Target User**: Developers using the PRP Pipeline who need to configure environment variables, CLI options, and model settings for their development workflow

**Use Case**: A developer is setting up the pipeline for the first time, debugging configuration issues, or customizing model selection for their specific needs

**User Journey**:

1. User has completed installation (docs/INSTALLATION.md)
2. User needs to configure API authentication and model settings
3. User looks up configuration options in docs/CONFIGURATION.md
4. User sets environment variables or uses CLI flags appropriately
5. User successfully runs the pipeline with correct configuration

**Pain Points Addressed**:

- "Which environment variables do I need to set?"
- "What's the default value for this option?"
- "Why is my API key not working?" (AUTH_TOKEN vs API_KEY confusion)
- "Which model should I use for this agent?"
- "How do I configure the pipeline for bug hunt mode?"
- "What's the difference between setting a variable in .env vs passing it as a CLI flag?"

## Why

- **Single Source of Truth**: Configuration is currently scattered across .env.example, code comments, external_deps.md, and user-guide.md
- **Prevent Configuration Errors**: Many common issues stem from incorrect configuration (wrong API endpoint, AUTH_TOKEN vs API_KEY confusion, model selection errors)
- **Security Clarity**: API keys and authentication need clear security guidance
- **Model Selection Guidance**: Users need to understand when to use which model tier
- **CLI Discoverability**: All CLI options should be documented for easy reference
- **Onboarding Efficiency**: New developers can configure correctly without asking questions

## What

Create a comprehensive configuration reference document that consolidates all configuration information into a single, well-organized document.

### Success Criteria

- [ ] Document exists at `docs/CONFIGURATION.md`
- [ ] All environment variables documented with Required/Optional status
- [ ] All CLI options documented with descriptions and examples
- [ ] Configuration source priority clearly explained (shell > .env > runtime)
- [ ] Model selection section with guidance on which models to use
- [ ] Security section with API key best practices
- [ ] Example .env file with all variables
- [ ] Cross-references to related documentation (INSTALLATION.md, user-guide.md)
- [ ] Common gotchas section preventing configuration errors
- [ ] Follows documentation patterns from docs/user-guide.md (TOC, heading hierarchy, code blocks with syntax highlighting)

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Complete environment variable list from external_deps.md and codebase analysis
- All CLI options with types and defaults from src/cli/index.ts
- Configuration mapping logic from src/config/environment.ts
- Model selection constants from src/config/constants.ts
- Existing .env.example for reference patterns
- Documentation formatting patterns from docs/user-guide.md
- Research on industry best practices for configuration documentation

### Documentation & References

```yaml
# MUST READ - Configuration sources from system documentation
- docfile: plan/003_b3d3efdaf0ed/docs/external_deps.md
  why: Contains complete environment variable list, model selection details, API endpoint safeguards
  section: "Environment Configuration" (lines 848-888)
  critical: Required variables, model mapping, z.ai API endpoint configuration

# MUST READ - Environment configuration code
- file: src/config/environment.ts
  why: Contains configureEnvironment(), getModel(), validateEnvironment() functions
  pattern: ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY mapping logic
  gotcha: AUTH_TOKEN takes precedence if both are set

# MUST READ - CLI option definitions
- file: src/cli/index.ts
  why: Contains all CLI options with types, defaults, and validation logic
  lines: 52-195 (CLIArgs interface, parseCLIArgs function)
  pattern: Commander.js option definitions with validation

# MUST READ - Model selection constants
- file: src/config/constants.ts
  why: Contains DEFAULT_BASE_URL, MODEL_NAMES, MODEL_ENV_VARS, REQUIRED_ENV_VARS
  pattern: Const assertions for literal types
  critical: Default model names for each tier (opus, sonnet, haiku)

# MUST READ - Existing .env.example
- file: .env.example
  why: Reference for documentation patterns and security warnings
  pattern: Section headers, inline comments, security warnings
  gotcha: Missing pipeline control and bug hunt variables (to add in CONFIGURATION.md)

# MUST READ - Documentation formatting patterns
- file: docs/user-guide.md
  why: Primary reference for documentation formatting, tone, and structure
  pattern: H1 title, TOC with auto-generated anchors, H2 for main sections, code blocks with syntax highlighting
  gotcha: Uses specific markdown link pattern with ../ for parent directory references

# MUST READ - Research on configuration documentation best practices
- docfile: plan/003_b3d3efdaf0ed/P2M1T1S2/research/config-documentation-best-practices.md
  why: Industry-standard patterns for configuration documentation
  section: "Included Templates" - ready-to-use templates for environment variables and CLI options
  critical: Tables for quick reference, explicit required/optional markers, security warnings

# MUST READ - Research on environment variable patterns
- docfile: plan/003_b3d3efdaf0ed/P2M1T1S2/research/environment-variable-patterns.md
  why: Modern Node.js/TypeScript env var documentation patterns from popular projects
  section: "Security Documentation Patterns" and "Configuration Loading Order"
  critical: Security warning templates, .env.example best practices, gotchas documentation

# MUST READ - Research on CLI documentation patterns
- docfile: plan/003_b3d3efdaf0ed/P2M1T1S2/research/cli-documentation-patterns.md
  why: CLI reference documentation standards and Commander.js specific patterns
  section: "CLI Reference Sections" and "Templates"
  critical: Standard synopsis/description/options/arguments structure, flag vs option documentation

# MUST READ - Codebase configuration analysis
- docfile: plan/003_b3d3efdaf0ed/P2M1T1S2/research/codebase-config-analysis.md
  why: Complete compiled list of all environment variables and CLI options from codebase
  section: "Environment Variables Complete List" and "CLI Options Complete List"
  critical: Every variable with type, default, and description

# REFERENCE - Previous work item (P2.M1.T1.S1) produces INSTALLATION.md
- docfile: plan/003_b3d3efdaf0ed/P2M1T1S1/PRP.md
  why: Understand what INSTALLATION.md will contain to avoid duplication
  section: "Goal" and "Success Criteria"
  gotcha: INSTALLATION.md covers basic setup, CONFIGURATION.md covers all options in depth
```

### Current Codebase Tree (relevant directories)

```bash
.
├── docs/
│   ├── user-guide.md              # Reference for documentation patterns
│   └── CONFIGURATION.md            # NEW: Configuration reference (this work item)
├── src/
│   ├── cli/
│   │   └── index.ts                # CLI option definitions
│   └── config/
│       ├── environment.ts          # Environment configuration functions
│       ├── constants.ts            # Model names and defaults
│       └── types.ts                # Type definitions
├── .env.example                    # Reference for .env file patterns
└── plan/003_b3d3efdaf0ed/P2M1T1S2/
    └── research/                   # Research documents for this work item
        ├── config-documentation-best-practices.md
        ├── environment-variable-patterns.md
        ├── cli-documentation-patterns.md
        └── codebase-config-analysis.md
```

### Desired Codebase Tree (new file to add)

```bash
docs/
├── CONFIGURATION.md                # NEW: Comprehensive configuration reference
├── INSTALLATION.md                 # Existing (from P2.M1.T1.S1)
├── user-guide.md                   # Existing (keep)
└── api/                            # Existing (keep)
```

**New File**: `docs/CONFIGURATION.md`

- Single source of truth for all configuration options
- Covers environment variables, CLI options, model selection
- Security best practices and common gotchas
- Cross-references to related documentation

### Known Gotchas of Our Codebase & Library Quirks

```markdown
# CRITICAL: z.ai API endpoint (NOT api.anthropic.com)

# Tests enforce z.ai usage and will fail if wrong endpoint is used

# Default: https://api.z.ai/api/anthropic

# Do NOT use: https://api.anthropic.com

# CRITICAL: Environment variable mapping

# Shell: ANTHROPIC_AUTH_TOKEN

# SDK expects: ANTHROPIC_API_KEY

# System automatically maps AUTH_TOKEN → API_KEY at startup

# AUTH_TOKEN takes precedence if both are set

# CRITICAL: Model selection affects cost and performance

# GLM-4.7 (opus/sonnet): Higher quality, higher cost, slower

# GLM-4.5-Air (haiku): Faster, lower cost, simpler tasks

# Choose appropriately based on agent role

# GOTCHA: Scope format is case-sensitive

# Use: P1.M1.T1.S1 (uppercase P, M, T, S)

# Don't use: p1.m1.t1.s1 (will fail validation)

# GOTCHA: Nested execution guard

# PRP_PIPELINE_RUNNING contains parent PID

# Automatically set by pipeline controller

# Prevents recursive pipeline execution

# GOTCHA: .env file should never be committed

# Add .env to .gitignore (already done)

# Only commit .env.example as a template

# GOTCHA: Groundswell library is a LOCAL dependency

# Linked via npm link (not from npm registry)

# Path: ~/projects/groundswell

# Vitest path alias required for tests

# CRITICAL: Test coverage requirements

# 100% coverage required (statements, branches, functions, lines)

# Vitest with v8 provider

# Coverage thresholds enforced in vitest.config.ts
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is pure documentation. However, the document structure should follow:

```markdown
# Configuration Reference

> Brief description and purpose

**Status**: Published
**Last Updated**: [Date]
**Version**: 1.0.0

## Table of Contents

[Auto-generated]

## Quick Reference

Environment variables table (required only)

## Environment Variables

Detailed section with all variables

## CLI Options

Detailed section with all options

## Model Selection

Model tier explanations and guidance

## Configuration Priority

Explanation of shell > .env > runtime

## Security

API key security best practices

## Example Configuration

Complete .env file example

## Common Gotchas

Configuration pitfalls and solutions

## See Also

Links to related documentation
```

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: READ and analyze documentation patterns
  - READ: docs/user-guide.md for formatting patterns
  - EXTRACT: Heading hierarchy (H1 → H2 → H3), TOC structure, code block formatting
  - NOTE: Table of Contents anchor pattern (#section-name)
  - NOTE: Code block language tags (```bash, ```typescript)
  - DEPENDENCIES: None

Task 2: COMPILE complete environment variable list
  - EXTRACT: From codebase-config-analysis.md "Environment Variables Complete List"
  - EXTRACT: From external_deps.md lines 848-888
  - VERIFY: All variables present (required, optional, model selection, pipeline control, bug hunt)
  - ORGANIZE: By category (API Authentication, Model Selection, Pipeline Control, etc.)
  - DEPENDENCIES: Task 1 (understand formatting)

Task 3: COMPILE complete CLI options list
  - EXTRACT: From codebase-config-analysis.md "CLI Options Complete List"
  - EXTRACT: From src/cli/index.ts lines 52-195
  - VERIFY: All options present (required, mode, boolean flags, limits)
  - ORGANIZE: By category (Required, Execution Mode, Boolean Flags, Limit Options)
  - DEPENDENCIES: Task 1 (understand formatting)

Task 4: EXTRACT model selection information
  - EXTRACT: From external_deps.md "Model Selection Strategy" section
  - EXTRACT: From src/config/constants.ts MODEL_NAMES and MODEL_ENV_VARS
  - DOCUMENT: Model tiers (opus, sonnet, haiku) with use cases
  - DOCUMENT: Which agents use which model tier
  - DEPENDENCIES: Task 2 (have variable list)

Task 5: CREATE docs/CONFIGURATION.md with document structure
  - CREATE: File header with title, description, status, version
  - IMPLEMENT: Table of Contents with anchor links
  - IMPLEMENT: Quick Reference section (table of required variables only)
  - FOLLOW pattern: docs/user-guide.md (heading structure, TOC format)
  - NAMING: CONFIGURATION.md (uppercase for visibility)
  - PLACEMENT: docs/ directory alongside user-guide.md and INSTALLATION.md
  - DEPENDENCIES: Tasks 1-4 (all research complete)

Task 6: IMPLEMENT Environment Variables section
  - CREATE: "Environment Variables" H2 section
  - ADD: "API Authentication" subsection with required variables
  - ADD: "Model Selection" subsection with model variables
  - ADD: "Pipeline Control" subsection with pipeline variables
  - ADD: "Bug Hunt Configuration" subsection with bug hunt variables
  - ADD: "Advanced Configuration" subsection with optional variables
  - CREATE: Tables with Variable, Required, Default, Description columns
  - ADD: Notes about ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY mapping
  - DEPENDENCIES: Task 5 (file created)

Task 7: IMPLEMENT CLI Options section
  - CREATE: "CLI Options" H2 section
  - ADD: "Required Options" subsection with --prd option
  - ADD: "Execution Mode" subsection with --mode and --scope options
  - ADD: "Boolean Flags" subsection with all boolean flags
  - ADD: "Limit Options" subsection with --max-tasks and --max-duration
  - CREATE: Tables with Option, Type, Default, Description columns
  - ADD: Scope format validation notes
  - DEPENDENCIES: Task 6 (env vars documented)

Task 8: IMPLEMENT Model Selection section
  - CREATE: "Model Selection" H2 section
  - ADD: "Model Tiers" subsection explaining opus, sonnet, haiku
  - ADD: "Agent Model Assignment" subsection (which agents use which tier)
  - ADD: "Model Override" subsection with environment variable examples
  - ADD: Performance and cost guidance
  - DEPENDENCIES: Task 7 (CLI options documented)

Task 9: IMPLEMENT Configuration Priority section
  - CREATE: "Configuration Priority" H2 section
  - ADD: Priority order explanation (shell > .env > runtime > defaults)
  - ADD: Visual diagram or table showing hierarchy
  - ADD: Examples of how priority works in practice
  - ADD: Notes about AUTH_TOKEN vs API_KEY precedence
  - DEPENDENCIES: Task 8 (model selection documented)

Task 10: IMPLEMENT Security section
  - CREATE: "Security" H2 section
  - ADD: "API Key Security" subsection with best practices
  - ADD: ".gitignore" pattern guidance
  - ADD: Warning about committing .env file
  - ADD: Warning about using production Anthropic API
  - DEPENDENCIES: Task 9 (priority documented)

Task 11: IMPLEMENT Example Configuration section
  - CREATE: "Example Configuration" H2 section
  - ADD: Complete .env file example with all variables
  - INCLUDE: Inline comments for each variable
  - INCLUDE: Security warnings
  - INCLUDE: All variables from codebase-config-analysis.md
  - DEPENDENCIES: Task 10 (security documented)

Task 12: IMPLEMENT Common Gotchas section
  - CREATE: "Common Gotchas" H2 section
  - ADD: "z.ai API vs Anthropic Production API" gotcha
  - ADD: "AUTH_TOKEN vs API_KEY" mapping gotcha
  - ADD: "Scope Format Case Sensitivity" gotcha
  - ADD: "Model Selection Gotchas" (cost, performance)
  - ADD: Solutions for each gotcha
  - DEPENDENCIES: Task 11 (example config documented)

Task 13: IMPLEMENT See Also section
  - CREATE: "See Also" H2 section
  - ADD: Link to docs/INSTALLATION.md (setup instructions)
  - ADD: Link to docs/user-guide.md (advanced usage)
  - ADD: Link to README.md (quick start)
  - ADD: Link to .env.example (reference template)
  - ADD: Link to src/config/ directory (source code)
  - DEPENDENCIES: Task 12 (gotchas documented)

Task 14: VERIFY document follows all patterns
  - VERIFY: Heading hierarchy (H1 → H2 → H3, no skipped levels)
  - VERIFY: Table of Contents links work
  - VERIFY: Code blocks use language tags (```bash, ```typescript)
  - VERIFY: Tables are properly formatted
  - VERIFY: Links use correct relative paths (../README.md, ./user-guide.md)
  - VERIFY: Tone matches user-guide.md (professional, clear, concise)
  - VERIFY: Quick Reference is visible and concise
  - DEPENDENCIES: Task 13 (document complete)
````

### Implementation Patterns & Key Details

````markdown
# PATTERN: Document header with metadata

# Configuration Reference

> Comprehensive guide for configuring the PRP Pipeline development environment.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

# PATTERN: Table of Contents with auto-generated anchors

## Table of Contents

- [Quick Reference](#quick-reference)
- [Environment Variables](#environment-variables)
  - [API Authentication](#api-authentication)
  - [Model Selection](#model-selection)
- [CLI Options](#cli-options)
- [Model Selection](#model-selection-1)
- [Configuration Priority](#configuration-priority)
- [Security](#security)
- [Example Configuration](#example-configuration)
- [Common Gotchas](#common-gotchas)
- [See Also](#see-also)

# PATTERN: Quick Reference (required variables only, above the detailed sections)

## Quick Reference

Required environment variables for basic operation:

| Variable               | Required | Default                          | Description                                                   |
| ---------------------- | -------- | -------------------------------- | ------------------------------------------------------------- |
| `ANTHROPIC_AUTH_TOKEN` | Yes      | None                             | z.ai API authentication token (mapped to `ANTHROPIC_API_KEY`) |
| `ANTHROPIC_BASE_URL`   | No       | `https://api.z.ai/api/anthropic` | z.ai API endpoint                                             |

For complete configuration, see [Environment Variables](#environment-variables) below.

# PATTERN: Environment variable table with Required column

### API Authentication

| Variable               | Required | Default                          | Description                                                                               |
| ---------------------- | -------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `ANTHROPIC_AUTH_TOKEN` | Yes      | None                             | Your API authentication token. Automatically mapped to `ANTHROPIC_API_KEY` at startup.    |
| `ANTHROPIC_API_KEY`    | Yes\*    | None                             | API key expected by Anthropic SDK. If `ANTHROPIC_AUTH_TOKEN` is set, it takes precedence. |
| `ANTHROPIC_BASE_URL`   | No       | `https://api.z.ai/api/anthropic` | z.ai API endpoint. **Do NOT use** `https://api.anthropic.com` (blocked by safeguards).    |

\*Required if `ANTHROPIC_AUTH_TOKEN` is not set.

# PATTERN: CLI option table with Type column

### Required Options

| Option         | Type   | Default    | Description               |
| -------------- | ------ | ---------- | ------------------------- |
| `--prd <path>` | string | `./PRD.md` | Path to PRD markdown file |

### Execution Mode

| Option            | Type   | Choices                          | Default  | Description                                                                                 |
| ----------------- | ------ | -------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `--mode <mode>`   | string | `normal`, `bug-hunt`, `validate` | `normal` | Execution mode                                                                              |
| `--scope <scope>` | string | -                                | -        | Scope identifier (e.g., `P3.M4`, `P3.M4.T2`). See [Scope Syntax](#scope-syntax) for format. |

# PATTERN: Model selection guidance with use cases

## Model Selection

The PRP Pipeline uses three model tiers, each optimized for different tasks:

| Model Tier | Default Model | Max Tokens | Use Case                                     | Agents                |
| ---------- | ------------- | ---------- | -------------------------------------------- | --------------------- |
| **Opus**   | GLM-4.7       | 8192       | Complex reasoning, architectural planning    | Architect             |
| **Sonnet** | GLM-4.7       | 4096       | Balanced performance, default for most tasks | Researcher, Coder, QA |
| **Haiku**  | GLM-4.5-Air   | 4096       | Fast, simple operations                      | Future: quick lookups |

**When to Use Each Tier:**

- **Opus (GLM-4.7)**: Use for the Architect Agent where complex reasoning is required. Higher cost, but higher quality output for breaking down PRDs.
- **Sonnet (GLM-4.7)**: Use for Researcher, Coder, and QA agents by default. Balanced cost and performance.
- **Haiku (GLM-4.5-Air)**: Use for simple operations where speed is more important than quality. Currently unused, reserved for future enhancements.

# PATTERN: Configuration priority with visual hierarchy

## Configuration Priority

Configuration is loaded from multiple sources in the following priority order (highest to lowest):

1. **Shell Environment** - Environment variables set in your shell or parent process
2. **`.env` File** - Local project configuration file
3. **Runtime Overrides** - Explicit environment variable settings in code
4. **Default Values** - Hardcoded defaults in TypeScript code

**Example:**

If `ANTHROPIC_BASE_URL` is set in multiple sources:

```bash
# In .env file
ANTHROPIC_BASE_URL=https://api.example.com

# In shell (higher priority)
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
```
````

The shell environment value (`https://api.z.ai/api/anthropic`) takes precedence.

# PATTERN: Security section with clear warnings

## Security

### API Key Security

**CRITICAL**: Never commit your `.env` file to version control.

The `.env` file contains sensitive authentication credentials that should never be shared.

```bash
# .gitignore (already configured)
.env
```

**Best Practices:**

1. Use `.env.example` as a template (contains placeholder values only)
2. Keep your `.env` file local (never commit, never share)
3. Rotate your API key if it's accidentally exposed
4. Use environment-specific tokens when possible (development vs production)

### API Endpoint Security

**WARNING**: Do NOT use the production Anthropic API endpoint.

The pipeline includes safeguards that will block execution if you attempt to use `https://api.anthropic.com`:

```typescript
// From test setup
if (process.env.ANTHROPIC_BASE_URL?.includes('api.anthropic.com')) {
  throw new Error('Tests must use z.ai API, not Anthropic production API');
}
```

Always use the z.ai proxy endpoint: `https://api.z.ai/api/anthropic`

# PATTERN: Example .env with inline comments

## Example Configuration

Create a `.env` file in your project root:

```bash
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
# PIPELINE CONTROL (OPTIONAL)
# =============================================================================

# Skip bug hunt / bug fix mode
# SKIP_BUG_FINDING=true

# Skip execution, run validation only
# SKIP_EXECUTION_LOOP=true

# =============================================================================
# BUG HUNT CONFIGURATION (OPTIONAL)
# =============================================================================

# Agent type for bug finding
# BUG_FINDER_AGENT=glp

# Output file for bug hunt results
# BUG_RESULTS_FILE=TEST_RESULTS.md

# Scope level for bug fix operations
# BUGFIX_SCOPE=subtask

# =============================================================================
# ADVANCED CONFIGURATION (OPTIONAL)
# =============================================================================

# Request timeout in milliseconds (default: 60000)
# API_TIMEOUT_MS=300000
```

# PATTERN: Common gotchas organized by symptom

## Common Gotchas

### "API key not working"

**What you see:**

```bash
Error: Missing required environment variables: ANTHROPIC_API_KEY
```

**Why it happens:**
You set `ANTHROPIC_AUTH_TOKEN` but the mapping hasn't occurred yet, or you're setting `ANTHROPIC_API_KEY` directly when `ANTHROPIC_AUTH_TOKEN` takes precedence.

**How to fix:**

```bash
# Use ANTHROPIC_AUTH_TOKEN (recommended)
export ANTHROPIC_AUTH_TOKEN=zk-xxxxx

# Or use ANTHROPIC_API_KEY (but don't set both)
export ANTHROPIC_API_KEY=zk-xxxxx
```

### "Tests fail with wrong API endpoint"

**What you see:**

```bash
Error: Tests must use z.ai API, not Anthropic production API
```

**Why it happens:**
You're using `https://api.anthropic.com` instead of the z.ai proxy endpoint.

**How to fix:**

```bash
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
```

### "Scope format rejected"

**What you see:**

```bash
Error: Invalid scope "p1.m1.t1.s1"
Expected format: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, or all
```

**Why it happens:**
Scope format is case-sensitive. You must use uppercase P, M, T, S.

**How to fix:**

```bash
# Correct (uppercase)
npm run dev -- --scope P1.M1.T1.S1

# Incorrect (lowercase)
npm run dev -- --scope p1.m1.t1.s1  # Will fail
```

# PATTERN: Cross-references to related documentation

## See Also

- **[INSTALLATION.md](./INSTALLATION.md)** - Setup instructions for the development environment
- **[User Guide](./user-guide.md)** - Comprehensive usage documentation
- **[README.md](../README.md)** - Project overview and quick start
- **[.env.example](../.env.example)** - Template for local configuration
- **[src/config/](../src/config/)** - Source code for environment configuration
- **[src/cli/](../src/cli/)** - Source code for CLI parsing

# CRITICAL: AUTH_TOKEN vs API_KEY precedence

# If both ANTHROPIC_AUTH_TOKEN and ANTHROPIC_API_KEY are set:

# - ANTHROPIC_AUTH_TOKEN takes precedence

# - API_KEY value is ignored

# - Mapping only occurs if API_KEY is NOT already set

# CRITICAL: z.ai API endpoint requirement

# Tests enforce z.ai usage

# Using api.anthropic.com will cause test failures

# Validation scripts block execution if wrong endpoint detected

# CRITICAL: Model selection affects cost

# GLM-4.7 (opus/sonnet): Higher quality, higher cost

# GLM-4.5-Air (haiku): Faster, lower cost

# Choose appropriately based on agent role and task complexity

# GOTCHA: Scope format is case-sensitive

# Use: P1.M1.T1.S1 (uppercase)

# Don't use: p1.m1.t1.s1 (lowercase - will fail)

# GOTCHA: .env file should never be committed

# Add .env to .gitignore (already done)

# Only commit .env.example as a template

````

### Integration Points

```yaml
NO CODE CHANGES:
  - This is documentation only
  - No source code modifications required
  - No configuration file changes

DOCUMENTATION INTEGRATION:
  - Link to docs/CONFIGURATION.md from docs/INSTALLATION.md (Configuration section)
  - Link from docs/user-guide.md (reference for advanced users)
  - Include in README.md (See Also section)
  - Reference from troubleshooting documentation

CROSS-REFERENCES:
  - Link to docs/INSTALLATION.md for setup instructions
  - Link to docs/user-guide.md for usage details
  - Link to README.md for project overview
  - Link to .env.example for quick template
  - Reference src/config/ for implementation details

PARALLEL CONTEXT:
  - P2.M1.T1.S1 (Create installation documentation) - currently implementing in parallel
  - No overlap or conflict - this document references INSTALLATION.md
  - INSTALLATION.md covers basic setup, CONFIGURATION.md covers all options in depth
````

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx markdownlint docs/CONFIGURATION.md
# OR
npm run docs:lint -- docs/CONFIGURATION.md  # if available

# Fix any linting issues
npm run docs:lint:fix -- docs/CONFIGURATION.md  # if available

# Expected: Zero markdown linting errors
```

### Level 2: Link Validation

```bash
# Verify all internal links work
# Manual verification:
# 1. Click each link in Table of Contents
# 2. Verify code blocks have language tags
# 3. Check relative paths are correct (../README.md, ./user-guide.md, ./INSTALLATION.md)
# 4. Verify all environment variables from codebase are documented
# 5. Verify all CLI options from src/cli/index.ts are documented

# Expected: All links resolve correctly, all variables/options present
```

### Level 3: Content Validation

```bash
# Manual review checklist:
# [ ] Quick Reference has only required variables
# [ ] All environment variables from codebase-config-analysis.md are documented
# [ ] All CLI options from src/cli/index.ts are documented
# [ ] Model selection section explains which agents use which tiers
# [ ] Configuration priority is clearly explained with examples
# [ ] Security section has API key and endpoint warnings
# [ ] Example .env includes all variables with inline comments
# [ ] Common gotchas cover the main configuration errors
# [ ] Tables are properly formatted
# [ ] Code blocks use proper syntax highlighting
# [ ] See Also section links to related documentation

# Expected: All content is accurate and complete
```

### Level 4: User Acceptance Testing

```bash
# Follow the documentation as a new user:
# 1. Read Quick Reference - find required variables
# 2. Set up environment using Example Configuration
# 3. Run pipeline with documented CLI options
# 4. Verify all configuration options work as documented
# 5. Try troubleshooting a configuration issue using Common Gotchas

# Expected: User can successfully configure and run the pipeline
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 validation passed (markdown linting)
- [ ] Level 2 validation passed (links work)
- [ ] Level 3 validation passed (content accuracy)
- [ ] File created at docs/CONFIGURATION.md
- [ ] File follows markdown best practices
- [ ] No broken links or invalid references

### Feature Validation

- [ ] Quick Reference section has required variables only
- [ ] All environment variables from codebase are documented
- [ ] All CLI options from src/cli/index.ts are documented
- [ ] Model selection section explains tiers and agent assignments
- [ ] Configuration priority is clearly explained
- [ ] Security section has API key and endpoint warnings
- [ ] Example .env includes all variables
- [ ] Common gotchas cover main configuration errors

### Documentation Quality Validation

- [ ] Heading hierarchy is correct (H1 → H2 → H3, no skipped levels)
- [ ] Table of Contents is included with working anchor links
- [ ] Code blocks use language tags (`bash, `typescript)
- [ ] Tables are properly formatted
- [ ] Tone matches existing documentation (professional, clear, concise)
- [ ] Follows formatting patterns from docs/user-guide.md
- [ ] Relative links use correct paths (../ for parent, ./ for sibling)

### Integration Validation

- [ ] Links to INSTALLATION.md work
- [ ] Links to user-guide.md work
- [ ] Links to README.md work
- [ ] Links to .env.example work
- [ ] Can be referenced from troubleshooting documentation
- [ ] No conflicts with existing documentation
- [ ] Complements INSTALLATION.md without duplicating content

---

## Anti-Patterns to Avoid

- Don't duplicate content from INSTALLATION.md - reference it instead
- Don't bury the Quick Reference - keep it near the top for quick access
- Don't skip the Common Gotchas section - configuration errors are common
- Don't forget to document the AUTH_TOKEN → API_KEY mapping - it's confusing
- Don't forget to warn about the z.ai API endpoint requirement
- Don't document all variables with equal weight - use Quick Reference for required ones
- Don't skip the Model Selection section - users need to understand which models to use
- Don't forget to document the Configuration Priority - users get confused about override order
- Don't use vague descriptions - be specific about what each option does
- Don't forget cross-references - link to related documentation
- Don't make the document too long - use progressive disclosure (quick → detailed)
- Don't forget to update the "Last Updated" date when making changes
- Don't skip security warnings - API keys and endpoints are critical
- Don't forget to document all CLI options - even the boolean flags
- Don't organize gotchas by cause - organize by symptom/error message

---

**PRP Version:** 1.0
**Work Item:** P2.M1.T1.S2
**Created:** 2026-01-23
**Status:** Ready for Implementation
