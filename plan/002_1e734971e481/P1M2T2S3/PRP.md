# Product Requirement Prompt (PRP): Document API configuration requirements

**PRP ID**: P1.M2.T2.S3
**Generated**: 2026-01-15
**Story Points**: 0.5

---

## Goal

**Feature Goal**: Update project documentation with comprehensive API configuration guidance, including required variables, default values, override mechanisms, safeguards, and clear warnings about z.ai API usage requirements.

**Deliverable**: Updated documentation at `/home/dustin/projects/hacky-hack/README.md` (extending existing Configuration section) with:

1. Complete environment variables table (required, optional, model overrides)
2. Default values and AUTH_TOKEN → API_KEY mapping explanation
3. Override mechanisms for testing
4. API safeguards documentation (test setup + validation script)
5. Clear warning about Anthropic API usage
6. Example .env configurations
7. Troubleshooting section for common issues

**Success Definition**:

- README.md Configuration section contains all required environment variables
- Documentation explains the AUTH_TOKEN → API_KEY mapping
- Safeguards are documented with their purpose
- z.ai setup examples are clear and actionable
- Developers can configure the API without trial and error

---

## User Persona

**Target User**: Developer setting up the PRP Pipeline for development or deployment

**Use Case**: Developer has cloned the repository and needs to configure API access to run the pipeline

**User Journey**:

1. Developer clones the repository
2. Runs `npm install`
3. Attempts to run pipeline but gets authentication error
4. Consults README.md Configuration section
5. Sets up environment variables correctly
6. Pipeline runs successfully

**Pain Points Addressed**:

- **Confusion about variable naming**: Why use ANTHROPIC_AUTH_TOKEN vs ANTHROPIC_API_KEY?
- **Unclear defaults**: What is the default BASE_URL? Can I skip setting it?
- **Missing safeguard context**: Why do tests fail with "Anthropic API detected"?
- **Testing configuration**: How do I override settings for local testing?
- **z.ai vs Anthropic**: What endpoint should I use and why?

---

## Why

- **Reduce Onboarding Friction**: New developers can configure the API correctly on first attempt
- **Prevent Costly Mistakes**: Clear warnings about Anthropic API usage prevent accidental production API calls
- **Explain Safeguards**: Developers understand why safeguards exist and how they work
- **Document Idiosyncrasies**: The AUTH_TOKEN → API_KEY mapping is non-obvious and needs explanation
- **Testing Guidance**: Developers need to know how to configure for different scenarios (local, CI, production)
- **Problems Solved**:
  - "Which environment variables do I need?"
  - "Why are tests failing with Anthropic API errors?"
  - "What's the difference between AUTH_TOKEN and API_KEY?"
  - "How do I configure for z.ai instead of Anthropic?"

---

## What

Update the Configuration section of README.md (lines 203-233) to include comprehensive API configuration documentation. The current section has basic environment variables but lacks:

- Explanation of the AUTH_TOKEN → API_KEY mapping
- Documentation of API safeguards
- z.ai-specific setup guidance
- Troubleshooting for common issues
- Example .env configurations

### Current State Analysis

**Current README.md Configuration Section** (lines 203-233):

````markdown
## Configuration

### Environment Variables

| Variable                         | Required | Default                          | Description                                                 |
| -------------------------------- | -------- | -------------------------------- | ----------------------------------------------------------- |
| `ANTHROPIC_API_KEY`              | Yes      | -                                | Your Anthropic API key (mapped from `ANTHROPIC_AUTH_TOKEN`) |
| `ANTHROPIC_BASE_URL`             | No       | `https://api.z.ai/api/anthropic` | API endpoint                                                |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | No       | `glm-4.7`                        | Model for Architect agent                                   |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | No       | `glm-4.7`                        | Model for Researcher/Coder agents                           |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | No       | `glm-4.5-air`                    | Model for simple operations                                 |

### Setup

```bash
# Set your API key
export ANTHROPIC_API_KEY="your-api-key-here"

# Or use ANTHROPIC_AUTH_TOKEN (will be mapped to API_KEY)
export ANTHROPIC_AUTH_TOKEN="your-api-key-here"

# Or use .env file
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
```
````

````

**Missing Content**:
1. ❌ No explanation of WHY AUTH_TOKEN maps to API_KEY
2. ❌ No documentation of API safeguards (test setup, validation script)
3. ❌ No warning about Anthropic API usage
4. ❌ No z.ai-specific configuration examples
5. ❌ No troubleshooting section
6. ❌ No model tier explanation
7. ❌ No .env.example reference

### Required Changes

**Change 1: Expand Environment Variables Section**
- Add "How It Works" subsection explaining AUTH_TOKEN → API_KEY mapping
- Add table rows showing the mapping behavior
- Document idempotency (calling configureEnvironment multiple times)

**Change 2: Add API Safeguards Section**
- Document test setup safeguard (tests/setup.ts)
- Document validation script safeguard (src/scripts/validate-api.ts)
- Explain what patterns are blocked and why
- Show warning behavior for non-z.ai endpoints

**Change 3: Add z.ai Configuration Section**
- Explain z.ai vs Anthropic API difference
- Show correct .env configuration for z.ai
- Document default BASE_URL behavior
- Add model tier explanation

**Change 4: Add Troubleshooting Section**
- "Tests fail with Anthropic API error"
- "API_KEY not found error"
- "Wrong endpoint configured"
- "Model not found errors"

**Change 5: Add Code Examples**
- Complete .env file example
- Shell export example
- Override for local testing

### Success Criteria

- [ ] Configuration section expanded with all required information
- [ ] AUTH_TOKEN → API_KEY mapping explained clearly
- [ ] API safeguards documented with purpose
- [ ] z.ai setup examples are complete
- [ ] Troubleshooting section covers common issues
- [ ] .env.example file exists (optional but recommended)
- [ ] Documentation follows existing README patterns

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] Existing README structure and patterns analyzed
- [x] Environment configuration implementation understood (environment.ts)
- [x] API safeguards implementation documented (tests/setup.ts, validate-api.ts)
- [x] Documentation patterns identified from existing docs
- [x] External best practices research completed
- [x] Codebase tree structure confirmed

---

### Documentation & References

```yaml
# MUST READ - Target file to modify
- file: /home/dustin/projects/hacky-hack/README.md
  why: Main documentation file with existing Configuration section
  section: Lines 203-233 (Configuration section)
  critical: |
    Preserve existing markdown structure
    Follow existing table format
    Maintain H2 > H3 hierarchy
    Keep code blocks consistent

# MUST READ - Environment configuration implementation
- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Contains the AUTH_TOKEN → API_KEY mapping logic
  section: Lines 55-65 (configureEnvironment function)
  critical: |
    configureEnvironment() maps ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY
    Only maps if API_KEY is not already set (idempotent)
    Sets DEFAULT_BASE_URL if not provided
    Must be called before validateEnvironment()

# MUST READ - Constants definition
- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Contains default values and constant definitions
  section: Lines 22-82 (DEFAULT_BASE_URL, MODEL_NAMES, MODEL_ENV_VARS)
  critical: |
    DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic'
    MODEL_NAMES: opus='GLM-4.7', sonnet='GLM-4.7', haiku='GLM-4.5-Air'
    MODEL_ENV_VARS for override mechanism

# MUST READ - Test setup safeguard
- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Implements API endpoint safeguard for tests
  section: Lines 37-142 (z.ai API safeguard and validation)
  critical: |
    Blocks: api.anthropic.com (all variants)
    Allows: localhost, 127.0.0.1, mock, test endpoints
    Warns: Non-z.ai endpoints
    Runs on test load and beforeEach

# MUST READ - Existing environment documentation
- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Contains detailed environment setup documentation
  section: Full file
  critical: |
    Auth token mapping explanation
    Model selection configuration
    Validation checklist
    Troubleshooting section

# MUST READ - Validation script (from P1.M2.T2.S2 PRP)
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T2S2/PRP.md
  why: Previous work item that adds validation script safeguards
  section: Lines 9-27 (Goal and Deliverable)
  critical: |
    Validation script at /src/scripts/validate-api.ts
    Checks BASE_URL before API calls
    Exits with code 1 if Anthropic API detected
    Tests z.ai endpoint with /v1/messages
    Validates response structure (id, type, role, content)

# DOCUMENTATION PATTERNS - README.md style
- file: /home/dustin/projects/hacky-hack/README.md
  why: Understand existing documentation patterns to follow
  section: Lines 1-500 (overall structure and style)
  pattern: |
    H2 ## for major sections
    H3 ### for subsections
    Tables with | separators
    ```bash code blocks with syntax highlighting
    Inline code for variables and commands
    Bold for emphasis
    No emojis in README (unlike user-guide.md)

# DOCUMENTATION PATTERNS - User guide style
- file: /home/dustin/projects/hacky-hack/docs/user-guide.md
  why: Reference for advanced documentation patterns
  section: H2 and H3 sections
  pattern: |
    Uses ✅ ❌ for before/after examples
    Has clear hierarchy
    Includes code examples with syntax highlighting
    Uses tables for configuration options

# EXTERNAL RESEARCH - Best practices from research
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M2T2S3/research/documentation-best-practices.md
  why: External research on API configuration documentation
  section: Full file (created from research agent findings)
  critical: |
    Security warnings at top of configuration section
    Clear tables with Variable | Required | Default | Description
    Code examples for .env files
    Troubleshooting with symptoms/solutions
    Visual indicators (⚠️ for warnings)
````

---

### Current Codebase Tree

```bash
hacky-hack/
├── README.md                      # TARGET: Lines 203-233 (Configuration section)
├── .env                           # Local environment (gitignored)
├── .env.example                   # TODO: Create this file
├── package.json                   # Scripts and dependencies
├── src/
│   ├── config/
│   │   ├── constants.ts           # DEFAULT_BASE_URL, MODEL_NAMES, MODEL_ENV_VARS
│   │   ├── environment.ts         # configureEnvironment(), getModel(), validateEnvironment()
│   │   └── types.ts               # ModelTier, EnvironmentConfig types
│   └── scripts/
│       └── validate-api.ts        # Validation script with API safeguards (from S2)
├── tests/
│   ├── setup.ts                   # Test setup with API endpoint safeguard
│   └── unit/config/
│       └── environment.test.ts    # Environment configuration tests
└── plan/
    └── 002_1e734971e481/
        ├── P1M2T2S2/
        │   └── PRP.md              # Previous work item (validation script)
        └── P1M2T2S3/
            ├── PRP.md              # This file
            └── research/
                └── documentation-best-practices.md  # External research findings
```

---

### Desired Codebase Tree (files to be modified)

```bash
hacky-hack/
├── README.md                      # MODIFY: Expand Configuration section
                                  # EXTEND: Lines 203-233 → 203-400+ (approx)
                                  # ADD: API safeguards section
                                  # ADD: z.ai configuration section
                                  # ADD: Troubleshooting section
└── .env.example                   # CREATE: Example .env file for reference
                                  # CONTENT: Template with all variables
```

---

### Known Gotchas & Library Quirks

```markdown
# CRITICAL: The AUTH_TOKEN → API_KEY mapping is non-obvious

# Shell environment uses ANTHROPIC_AUTH_TOKEN (convention)

# Anthropic SDK expects ANTHROPIC_API_KEY (requirement)

# The mapping happens in configureEnvironment() from environment.ts

# GOTCHA: The mapping is idempotent

# If ANTHROPIC_API_KEY is already set, AUTH_TOKEN won't override it

# This allows explicit API_KEY setting to take precedence

# CRITICAL: z.ai vs Anthropic API distinction

# Anthropic: https://api.anthropic.com (BLOCKED - causes massive usage spikes)

# z.ai: https://api.z.ai/api/anthropic (REQUIRED - compatible proxy)

# GOTCHA: Default BASE_URL is set to z.ai

# If ANTHROPIC_BASE_URL is not set, configureEnvironment() sets it to z.ai endpoint

# This is intentional - z.ai is the default for this project

# CRITICAL: API safeguards prevent Anthropic API usage

# Two safeguards exist:

# 1. Test setup safeguard (tests/setup.ts) - Runs on test load and beforeEach

# 2. Validation script safeguard (src/scripts/validate-api.ts) - From P1.M2.T2.S2

# Both block api.anthropic.com and warn for non-z.ai endpoints

# GOTCHA: Model tier naming is different from model names

# Tiers: opus, sonnet, haiku (abstractions)

# Models: GLM-4.7, GLM-4.5-Air (actual model identifiers)

# Default tier→model mapping is in MODEL_NAMES constant

# CRITICAL: The .env file should be gitignored

# API keys must never be committed to version control

# Create .env.example as a template instead

# GOTCHA: README.md doesn't use emojis (unlike user-guide.md)

# User guide uses ✅ ❌ for visual indicators

# README uses plain markdown with tables and code blocks

# Follow the README style when updating

# CRITICAL: ConfigureEnvironment must be called before accessing API_KEY

# Import order matters: configureEnvironment() first, then use API_KEY

# This is why the safeguard runs at the top of test setup

# GOTCHA: Validation script exits with code 1 on Anthropic API detection

# This is intentional for CI/CD integration

# Exit code 0 = success, 1 = failure (Anthropic API detected)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task updates existing documentation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing README.md Configuration section
  - FILE: README.md
  - READ: Lines 203-233 (current Configuration section)
  - UNDERSTAND: Existing table format, structure, style
  - DEPENDENCIES: None

Task 2: CREATE .env.example file
  - FILE: .env.example (new file)
  - ADD: Template with all environment variables
  - INCLUDE: Comments explaining each variable
  - PATTERN: Follow existing README table format
  - DEPENDENCIES: Task 1

Task 3: EXPAND Environment Variables table
  - FILE: README.md
  - MODIFY: Lines 207-214 (existing table)
  - ADD: ANTHROPIC_AUTH_TOKEN row (required, maps to API_KEY)
  - ADD: API_TIMEOUT_MS row (optional, for long-running requests)
  - UPDATE: Description column to explain mapping behavior
  - DEPENDENCIES: Task 1

Task 4: ADD "How It Works" subsection
  - FILE: README.md
  - ADD: After line 233 (after Setup section)
  - CONTENT: Explain AUTH_TOKEN → API_KEY mapping
  - CONTENT: Explain configureEnvironment() behavior
  - CONTENT: Document idempotency and precedence
  - DEPENDENCIES: Task 3

Task 5: ADD "API Safeguards" section
  - FILE: README.md
  - ADD: After "How It Works" section
  - CONTENT: Test setup safeguard explanation (tests/setup.ts)
  - CONTENT: Validation script safeguard explanation (validate-api.ts)
  - CONTENT: Blocked patterns (api.anthropic.com)
  - CONTENT: Allowed exceptions (localhost, mock, test)
  - CONTENT: Warning behavior for non-z.ai endpoints
  - DEPENDENCIES: Task 4

Task 6: ADD "z.ai Configuration" section
  - FILE: README.md
  - ADD: After "API Safeguards" section
  - CONTENT: z.ai vs Anthropic API explanation
  - CONTENT: Why z.ai is required (compatible proxy, cost control)
  - CONTENT: Model tier explanation (Opus, Sonnet, Haiku)
  - CONTENT: Complete .env example for z.ai
  - DEPENDENCIES: Task 5

Task 7: ADD "Troubleshooting" section
  - FILE: README.md
  - ADD: After "z.ai Configuration" section
  - CONTENT: "Tests fail with Anthropic API error"
  - CONTENT: "API_KEY not found error"
  - CONTENT: "Wrong endpoint configured"
  - CONTENT: "Model not found errors"
  - FORMAT: Problem → Solution pattern
  - DEPENDENCIES: Task 6

Task 8: VERIFY documentation completeness
  - READ: Updated README.md Configuration section
  - VERIFY: All variables documented
  - VERIFY: Mapping explained clearly
  - VERIFY: Safeguards documented
  - VERIFY: Examples are correct
  - DEPENDENCIES: Task 7

Task 9: LINK to .env.example in Setup section
  - FILE: README.md
  - MODIFY: Lines 218-226 (Setup section)
  - ADD: Reference to .env.example file
  - ADD: "cp .env.example .env" command
  - DEPENDENCIES: Task 2
```

---

### Implementation Patterns & Key Details

````markdown
# =============================================================================

# PATTERN: README Configuration Section Structure

# =============================================================================

## Configuration

### Environment Variables

[Table of all variables with Required/Default/Description]

### Setup

[Quick start setup commands]

### How It Works

[Explanation of AUTH_TOKEN → API_KEY mapping]

### API Safeguards

[Documentation of safeguards and their purpose]

### z.ai Configuration

[z.ai-specific setup and model explanation]

### Troubleshooting

[Common issues and solutions]

# =============================================================================

# PATTERN: Environment Variables Table

# =============================================================================

| Variable                         | Required | Default                          | Description                                            |
| -------------------------------- | -------- | -------------------------------- | ------------------------------------------------------ |
| `ANTHROPIC_AUTH_TOKEN`           | Yes\*    | -                                | API authentication token (mapped to ANTHROPIC_API_KEY) |
| `ANTHROPIC_API_KEY`              | Yes\*    | -                                | API key (mapped from ANTHROPIC_AUTH_TOKEN if not set)  |
| `ANTHROPIC_BASE_URL`             | No       | `https://api.z.ai/api/anthropic` | API endpoint (z.ai required, not Anthropic)            |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | No       | `GLM-4.7`                        | Model for Architect agent (highest quality)            |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | No       | `GLM-4.7`                        | Model for Researcher/Coder agents (balanced)           |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | No       | `GLM-4.5-Air`                    | Model for simple operations (fastest)                  |

_Note: Either `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY` is required._

# =============================================================================

# PATTERN: How It Works Section

# =============================================================================

### How It Works

The PRP Pipeline uses **z.ai** as a compatible proxy for the Anthropic API. This
requires special environment variable configuration:

**Variable Mapping:**

- Shell environment convention: `ANTHROPIC_AUTH_TOKEN`
- SDK expectation: `ANTHROPIC_API_KEY`
- The pipeline automatically maps `AUTH_TOKEN` → `API_KEY` on startup

**Configuration Flow:**

```typescript
// 1. configureEnvironment() is called on startup
configureEnvironment();

// 2. If AUTH_TOKEN is set and API_KEY is not, map it
if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
}

// 3. Set default BASE_URL if not provided
if (!process.env.ANTHROPIC_BASE_URL) {
  process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/api/anthropic';
}
```
````

**Idempotency:**

- Multiple calls to `configureEnvironment()` are safe
- If `API_KEY` is already set, `AUTH_TOKEN` won't override it
- Explicit `API_KEY` values take precedence

# =============================================================================

# PATTERN: API Safeguards Section

# =============================================================================

### API Safeguards

The pipeline includes safeguards to prevent accidental usage of Anthropic's
official API, which could result in massive unexpected charges.

**Test Setup Safeguard** (`tests/setup.ts`):

- Blocks: `api.anthropic.com` (all variants)
- Allows: `localhost`, `127.0.0.1`, `mock`, `test` endpoints
- Warns: Non-z.ai endpoints with console warning
- Runs: On test file load and before each test

**Validation Script Safeguard** (`src/scripts/validate-api.ts`):

- Checks: `ANTHROPIC_BASE_URL` before any API calls
- Exits: With code 1 if Anthropic API detected
- Tests: z.ai endpoint with `/v1/messages`
- Validates: Response structure (id, type, role, content)

**What Gets Blocked:**

```
❌ https://api.anthropic.com
❌ http://api.anthropic.com
❌ api.anthropic.com (any variant)
```

**What's Allowed:**

```
✅ https://api.z.ai/api/anthropic (recommended)
✅ http://localhost:3000 (local testing)
✅ http://127.0.0.1:8080 (local testing)
✅ http://mock-api (mock testing)
```

# =============================================================================

# PATTERN: z.ai Configuration Section

# =============================================================================

### z.ai Configuration

The PRP Pipeline uses **z.ai** as the API endpoint, not Anthropic's official API.

**Why z.ai?**

- Compatible with Anthropic API v1 specification
- Cost control and usage monitoring
- Prevents unexpected production API charges

**Model Tiers:**

| Tier   | Model       | Use Case                            |
| ------ | ----------- | ----------------------------------- |
| Opus   | GLM-4.7     | Architect agent (complex reasoning) |
| Sonnet | GLM-4.7     | Researcher/Coder agents (default)   |
| Haiku  | GLM-4.5-Air | Simple operations (fastest)         |

**Example .env File:**

```bash
# .env - API Configuration for PRP Pipeline

# Required: API authentication
ANTHROPIC_AUTH_TOKEN=your-zai-api-token-here

# Optional: API endpoint (defaults to z.ai)
# ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic

# Optional: Model overrides
# ANTHROPIC_DEFAULT_OPUS_MODEL=GLM-4.7
# ANTHROPIC_DEFAULT_SONNET_MODEL=GLM-4.7
# ANTHROPIC_DEFAULT_HAIKU_MODEL=GLM-4.5-Air

# Optional: Request timeout (milliseconds)
# API_TIMEOUT_MS=300000
```

# =============================================================================

# PATTERN: Troubleshooting Section

# =============================================================================

### Troubleshooting

**"Tests fail with 'Anthropic API detected' error"**

The test setup safeguards prevent using Anthropic's official API.

```bash
# Fix: Set BASE_URL to z.ai endpoint
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"

# Or add to .env file
echo "ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic" >> .env
```

**"ANTHROPIC_API_KEY not found" error**

The environment configuration hasn't been run or variables aren't set.

```bash
# Fix: Set AUTH_TOKEN (will be mapped to API_KEY)
export ANTHROPIC_AUTH_TOKEN="your-api-key-here"

# Or set API_KEY directly
export ANTHROPIC_API_KEY="your-api-key-here"
```

**"Model not found: GLM-4.7" error**

The z.ai endpoint may not support the configured model.

```bash
# Fix: Verify model name or override with supported model
export ANTHROPIC_DEFAULT_SONNET_MODEL="supported-model-name"

# Check z.ai documentation for available models
```

**"Connection timeout" errors**

The API timeout may be too short for complex requests.

```bash
# Fix: Increase timeout (default is 60 seconds)
export API_TIMEOUT_MS=120000
```

# =============================================================================

# PATTERN: .env.example File

# =============================================================================

# .env.example - Template for PRP Pipeline configuration

# Copy this file to .env and fill in your values

#

# Usage:

# cp .env.example .env

# # Edit .env with your API credentials

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

````

# =============================================================================
# GOTCHA: README.md Style Conventions
# =============================================================================

# The README uses plain markdown without emojis (unlike user-guide.md)
# Use:
# - Bold for emphasis: **important**
# - Inline code for variables: `ANTHROPIC_API_KEY`
# - Code blocks with language specifier: ```bash
# - Tables with consistent alignment
# - H2 ## for major sections
# - H3 ### for subsections

# Avoid:
# - ❌ ✅ emojis (save for user guide)
# - Overly complex formatting
# - Excessive nesting
````

---

### Integration Points

```yaml
INPUT FROM P1.M2.T2.S1 (Enhance test setup API validation):
  - Confidence: Test setup safeguard is working
  - Pattern: Use warning pattern from tests/setup.ts lines 82-104
  - This PRP: Documents the safeguard behavior

INPUT FROM P1.M2.T2.S2 (Add validation script API checks):
  - Contract: Validation script at /src/scripts/validate-api.ts with safeguards
  - Behavior: Exits code 1 if Anthropic API detected
  - Behavior: Tests z.ai endpoint with /v1/messages
  - This PRP: Documents the validation script safeguard

INPUT FROM EXISTING DOCUMENTATION:
  - File: README.md lines 203-233
  - Existing: Basic environment variables table
  - Existing: Setup commands
  - This PRP: Expands with safeguards, z.ai configuration, troubleshooting

  - File: plan/001_14b9dc2a33c7/architecture/environment_config.md
  - Content: Detailed environment setup documentation
  - This PRP: Summarizes key points in README

OUTPUT FOR SUBSEQUENT WORK:
  - Updated README.md with comprehensive API configuration
  - .env.example file for reference
  - Clear developer onboarding path
  - Reduced support burden

DIRECTORY STRUCTURE:
  - Modify: README.md (extend Configuration section)
  - Create: .env.example (new file)

CLEANUP INTEGRATION:
  - None required - documentation only
  - No side effects on code
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying README.md
# Check markdown syntax
npx markdownlint README.md 2>/dev/null || echo "markdownlint not installed, skipping"

# Verify file is readable
head -n 250 README.md | tail -n 50

# Expected: Configuration section is properly formatted
# Expected: Tables are aligned correctly
# Expected: Code blocks have proper syntax highlighting

# If .env.example was created
cat .env.example

# Expected: All variables documented with comments
# Expected: Security warning included
```

### Level 2: Content Validation (Documentation Review)

```bash
# Verify all required sections exist
grep -n "### Environment Variables" README.md
grep -n "### How It Works" README.md
grep -n "### API Safeguards" README.md
grep -n "### z.ai Configuration" README.md
grep -n "### Troubleshooting" README.md

# Expected: All sections are present

# Verify key information is documented
grep -n "ANTHROPIC_AUTH_TOKEN" README.md
grep -n "configureEnvironment" README.md
grep -n "api.anthropic.com" README.md
grep -n "z.ai" README.md

# Expected: All key terms mentioned in documentation

# Check that .env.example is created (if added)
ls -la .env.example 2>/dev/null && echo ".env.example exists" || echo ".env.example not created (optional)"
```

### Level 3: Usability Testing (Developer Experience)

```bash
# Test: Can a new developer follow the documentation?

# 1. Start with clean environment
unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL

# 2. Follow documentation setup
# (Simulate following README instructions)
export ANTHROPIC_AUTH_TOKEN="test-token"

# 3. Verify environment is correct
echo "API_KEY: ${ANTHROPIC_API_KEY:-not set}"
echo "BASE_URL: ${ANTHROPIC_BASE_URL:-not set}"

# Expected: After reading docs, developer can configure correctly

# 4. Test .env.example (if created)
if [ -f .env.example ]; then
  # Verify template structure
  grep -q "ANTHROPIC_AUTH_TOKEN" .env.example
  grep -q "your-api-token-here" .env.example
  echo ".env.example template is valid"
fi
```

### Level 4: Documentation Quality Validation

````bash
# Verify documentation follows existing patterns
# Check H2/H3 hierarchy
grep "^##" README.md | head -20

# Expected: Proper hierarchy maintained

# Check code blocks are properly formatted
grep -c '```' README.md

# Expected: Even number of code block delimiters

# Check table formatting
grep -c '^|' README.md

# Expected: Tables are properly formatted

# Verify links work (if any added)
grep -o '\[.*\](.*)' README.md | head -10

# Expected: Links are properly formatted

# Manual validation: Read the updated section
# Command: less +203 README.md
# Expected: Section flows logically, all questions answered
````

---

## Final Validation Checklist

### Technical Validation

- [ ] README.md Configuration section updated
- [ ] All environment variables documented
- [ ] AUTH_TOKEN → API_KEY mapping explained
- [ ] API safeguards documented
- [ ] z.ai configuration section added
- [ ] Troubleshooting section added
- [ ] .env.example created (optional)
- [ ] Markdown syntax is valid
- [ ] Tables are properly formatted

### Content Validation

- [ ] Required variables clearly marked
- [ ] Default values specified
- [ ] Override mechanisms explained
- [ ] Blocked patterns documented (api.anthropic.com)
- [ ] Allowed exceptions documented (localhost, mock, test)
- [ ] Model tier explanation included
- [ ] Code examples are correct and runnable
- [ ] Security warning included

### Documentation Quality

- [ ] Follows existing README style (no emojis)
- [ ] Maintains H2 > H3 hierarchy
- [ ] Code blocks have language specifiers
- [ ] Tables are aligned
- [ ] Inline code used for variables
- [ ] Bold used for emphasis
- [ ] Section flows logically

### Developer Experience

- [ ] New developer can configure from documentation alone
- [ ] Common issues have solutions in troubleshooting
- [ ] z.ai vs Anthropic distinction is clear
- [ ] Warning about Anthropic API usage is prominent
- [ ] .env.example provides clear template

---

## Anti-Patterns to Avoid

- ❌ **Don't add emojis to README.md** - Save those for user-guide.md
- ❌ **Don't duplicate content** - Reference existing docs where appropriate
- ❌ **Don't oversimplify the mapping** - Explain WHY AUTH_TOKEN maps to API_KEY
- ❌ **Don't skip the safeguards section** - Critical for preventing costly mistakes
- ❌ **Don't forget troubleshooting** - Common issues need solutions
- ❌ **Don't use unclear examples** - All code examples should be runnable
- ❌ **Don't ignore model tiers** - Explain Opus/Sonnet/Haiku differences
- ❌ **Don't bury the warning** - Anthropic API warning should be prominent
- ❌ **Don't create overly long sections** - Keep each section focused
- ❌ **Don't break table formatting** - Maintain column alignment
- ❌ **Don't use inconsistent terminology** - Stick to AUTH_TOKEN/API_KEY convention
- ❌ **Don't forget the .env.example** - Provides a template for developers

---

## Appendix: Decision Rationale

### Why expand README.md instead of creating a new file?

README.md is the first file developers see. Having comprehensive configuration documentation there:

- Reduces friction (no need to navigate to docs/)
- Keeps documentation close to setup instructions
- Follows common open-source conventions
- Single source of truth for quick reference

### Why document safeguards explicitly?

Developers may encounter safeguard errors and need to understand:

- Why the error occurred
- What the safeguard protects against
- How to resolve the issue
- Whether the safeguard is a bug or feature

Explicit documentation prevents:

- "Why is Anthropic API blocked?"
- "Is this a bug?"
- "How do I bypass this safeguard?"

### Why create .env.example?

Even though it's optional, .env.example:

- Provides a ready-to-use template
- Documents all variables in one place
- Shows expected format and values
- Includes inline comments for context
- Follows common best practices

### Why include troubleshooting?

Documentation that doesn't anticipate common issues:

- Leaves developers stuck
- Increases support burden
- Creates negative developer experience

Troubleshooting section:

- Addresses common configuration errors
- Provides actionable solutions
- Reduces trial and error

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:

- [x] Complete context from existing documentation
- [x] Current README structure analyzed
- [x] Environment configuration implementation understood
- [x] API safeguards implementation documented
- [x] External best practices research completed
- [x] Codebase structure documented
- [x] Anti-patterns identified
- [x] Clear success criteria defined

**Risk Mitigation**:

- Documentation-only task (no code changes)
- Low risk of breaking existing functionality
- Easy to verify and iterate
- Can be reviewed independently

**Known Risks**:

- None - this is a documentation task with clear scope

---

**END OF PRP**
