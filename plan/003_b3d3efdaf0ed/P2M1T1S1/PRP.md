# Product Requirement Prompt (PRP): P2.M1.T1.S1 - Create installation documentation

---

## Goal

**Feature Goal**: Create comprehensive installation documentation (`docs/INSTALLATION.md`) that enables users to successfully set up the PRP Pipeline development environment from scratch, including all prerequisites, dependencies, environment configuration, and verification steps.

**Deliverable**: Documentation file `docs/INSTALLATION.md` with step-by-step installation instructions covering:
- Prerequisites (Node.js, npm, Git versions)
- Cloning the repository
- Installing dependencies
- Linking the Groundswell library
- Configuring environment variables
- Verifying installation with test commands
- Troubleshooting common issues

**Success Definition**: A new developer can follow the installation guide from a fresh machine and successfully:
1. Install all prerequisites
2. Set up the development environment
3. Run tests to verify the installation
4. Troubleshoot common issues without additional help

## User Persona

**Target User**: Developers joining the project who need to set up their local development environment

**Use Case**: A new developer clones the repository and needs to install all dependencies and configure their environment to start development

**User Journey**:
1. User clones the repository
2. Opens the project and looks for installation instructions
3. Follows the INSTALLATION.md guide step-by-step
4. Verifies installation by running tests
5. Encounters an issue and finds solution in troubleshooting section

**Pain Points Addressed**:
- "What do I need to install first?"
- "How do I link the Groundswell library?"
- "What environment variables do I need?"
- "How do I know if everything is working?"
- "I got an error, what do I do?"

## Why

- **Onboarding Efficiency**: New developers can get started quickly without asking questions
- **Reduced Support**: Fewer repetitive setup questions in issues/Slack
- **Documentation Completeness**: Project lacks dedicated installation guide (only has README Quick Start)
- **Complex Setup Requirements**: Project has non-trivial setup (Groundswell linking, z.ai API configuration)
- **Reference Material**: Single source of truth for installation steps and troubleshooting

## What

Create a comprehensive installation guide document following the project's documentation patterns.

### Success Criteria

- [ ] Document exists at `docs/INSTALLATION.md`
- [ ] Quick Start section is visible without scrolling (5 steps max)
- [ ] Prerequisites section lists Node.js >=20.0.0, npm >=10.0.0
- [ ] Groundswell linking instructions are clear and accurate
- [ ] Environment variables section includes all required variables with examples
- [ ] Verification section includes test commands to confirm setup
- [ ] Troubleshooting section covers common installation issues
- [ ] Documentation follows existing formatting patterns from `docs/user-guide.md`
- [ ] Code blocks use proper syntax highlighting
- [ ] Table of Contents is included for navigation
- [ ] Platform-specific variations are covered (Windows, macOS, Linux)

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Exact version requirements from package.json engines field
- Complete Groundswell linking workflow from external_deps.md
- All environment variables from environment.ts with defaults
- npm scripts for verification commands
- Existing documentation formatting patterns
- Research on industry-standard installation documentation patterns

### Documentation & References

```yaml
# MUST READ - Project documentation patterns and structure
- file: docs/user-guide.md
  why: Primary reference for documentation formatting, tone, and structure
  pattern: H1 title, TOC with auto-generated anchors, H2 for main sections, code blocks with syntax highlighting, tables for reference information
  gotcha: Uses specific markdown link pattern with ../ for parent directory references

# MUST READ - Installation requirements from system_context.md
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Contains Node.js >=20.0.0 and npm >=10.0.0 requirements, Groundswell setup instructions
  section: "Technology Stack" (lines 322-333) and "Groundswell Library" (lines 80-106)
  critical: Engines field in package.json specifies exact version requirements

# MUST READ - Groundswell linking instructions
- docfile: plan/003_b3d3efdaf0ed/docs/external_deps.md
  why: Contains step-by-step npm link workflow and Vitest path alias configuration
  section: "Installation & Linking" (lines 82-106)
  critical: Two-step process: link in groundswell project, then link in hacky-hack project

# MUST READ - Environment variable configuration
- file: src/config/environment.ts
  why: Contains all required and optional environment variables with defaults
  lines: 1-100 (configureEnvironment function, API key mapping)
  pattern: ANTHROPIC_AUTH_TOKEN mapped to ANTHROPIC_API_KEY internally
  gotcha: z.ai API endpoint (not api.anthropic.com) must be used

# MUST READ - npm scripts for verification commands
- file: package.json
  why: Contains all available test and validation commands
  lines: 13-59 (scripts section)
  pattern: Grouped scripts with === headers, uses npm run for all commands
  critical: `npm test` for tests, `npm run validate` for full validation

# MUST READ - Installation documentation best practices research
- docfile: plan/003_b3d3efdaf0ed/P2M1T1S1/research/installation-docs-research.md
  why: Industry-standard patterns for installation documentation
  section: "Complete Installation Documentation Template"
  critical: Quick Start (above the fold), Prerequisites, Installation Steps, Verification, Troubleshooting

# MUST READ - Technical documentation best practices
- file: docs/research/technical-documentation-best-practices.md
  why: Project-specific documentation standards and formatting guidelines
  section: "Documentation Structure and Formatting" (H1-H4 heading rules)
  pattern: H1 title only once, H2 for main sections, descriptive headings, code blocks with language tags

# REFERENCE - Project README for Quick Start pattern
- file: README.md
  why: Contains existing Quick Start section to reference/expand upon
  pattern: Install dependencies → link groundswell → configure environment → run tests
  gotcha: May be minimal - installation guide should be more comprehensive
```

### Current Codebase Tree (relevant directories)

```bash
.
├── docs/
│   ├── user-guide.md              # Reference for documentation patterns
│   ├── research/                  # Research documents directory
│   └── api/                       # Generated API documentation
├── src/
│   ├── config/
│   │   ├── environment.ts         # Environment variable definitions
│   │   └── constants.ts           # Model names and defaults
│   └── ...
├── package.json                    # Scripts and version requirements
├── tsconfig.json                   # TypeScript configuration
├── vitest.config.ts               # Vitest configuration with groundswell alias
└── README.md                       # Existing Quick Start
```

### Desired Codebase Tree (new file to add)

```bash
docs/
├── INSTALLATION.md                 # NEW: Comprehensive installation guide
├── user-guide.md                  # Existing (keep)
├── api/                           # Existing (keep)
└── research/                      # Existing (keep)
```

**New File**: `docs/INSTALLATION.md`

- Installation guide for PRP Pipeline development environment
- Covers prerequisites, installation, configuration, verification, troubleshooting
- Follows existing documentation patterns from user-guide.md
- Progressive disclosure: Quick Start → Detailed Steps → Troubleshooting

### Known Gotchas of Our Codebase & Library Quirks

```markdown
# CRITICAL: Node.js and npm version requirements
# Node.js >= 20.0.0 (engines field in package.json)
# npm >= 10.0.0 (engines field in package.json)
# Older versions will fail due to ES modules and TypeScript 5.2+ features

# CRITICAL: Groundswell library is a LOCAL dependency
# Must be linked via npm link (not installed from npm registry)
# Path: ~/projects/groundswell
# Two-step process:
#   1. cd ~/projects/groundswell && npm link
#   2. cd ~/projects/hacky-hack && npm link groundswell

# CRITICAL: Vitest path alias required for tests to find groundswell
# Configured in vitest.config.ts:
# resolve: { alias: { groundswell: new URL('../groundswell/dist/index.js', import.meta.url).pathname } }

# CRITICAL: z.ai API configuration (NOT api.anthropic.com)
# ANTHROPIC_AUTH_TOKEN=zk-xxxxx (mapped to ANTHROPIC_API_KEY internally)
# ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
# Tests enforce z.ai usage and will fail if production API is used

# CRITICAL: Environment variable mapping
# Shell uses ANTHROPIC_AUTH_TOKEN
# SDK expects ANTHROPIC_API_KEY
# System automatically maps AUTH_TOKEN → API_KEY at startup

# CRITICAL: ES Module imports require .js extensions
# TypeScript files must import with .js extensions (not .ts)
# Example: import { Workflow } from 'groundswell';
# Example: import { SessionManager } from './core/session-manager.js';

# GOTCHA: Project uses "type": "module" in package.json
# Cannot use require() - must use import statements
# Affects how tests and scripts are written

# GOTCHA: Groundswell must be built before linking
# If groundswell dist/ directory doesn't exist, run: cd ~/projects/groundswell && npm run build

# GOTCHA: Windows path differences in npm link
# Windows may require different npm link syntax
# Troubleshooting should cover Windows, macOS, and Linux

# CRITICAL: Test command uses Vitest (not Jest or Mocha)
# npm test runs Vitest in watch mode
# npm run test:run runs tests once
# npm run test:coverage generates coverage report (100% required)
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is pure documentation. However, the document structure should follow:

```markdown
# Installation Guide

> Brief description and purpose

**Status**: Published
**Last Updated**: [Date]
**Version**: 1.0.0

## Table of Contents

[Auto-generated]

## Quick Start

5-step minimal installation (visible without scrolling)

## Prerequisites

Version requirements and check commands

## Installation

Detailed step-by-step instructions

## Configuration

Environment variables and setup

## Verification

Commands to confirm successful installation

## Troubleshooting

Common issues and solutions organized by error message

## Next Steps

Links to other documentation (User Guide, README, etc.)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ and analyze existing documentation patterns
  - READ: docs/user-guide.md for formatting patterns
  - EXTRACT: Heading hierarchy (H1 → H2 → H3), TOC structure, code block formatting
  - NOTE: Table of Contents anchor pattern (#section-name)
  - NOTE: Code block language tags (```bash, ```typescript)
  - DEPENDENCIES: None

Task 2: EXTRACT installation requirements from package.json
  - EXTRACT: engines field (Node.js >=20.0.0, npm >=10.0.0)
  - EXTRACT: relevant dependencies versions
  - EXTRACT: npm scripts for verification (test, validate, build)
  - DOCUMENT: Version check commands (node --version, npm --version)
  - DEPENDENCIES: Task 1 (understand formatting)

Task 3: EXTRACT Groundswell linking instructions from external_deps.md
  - EXTRACT: Two-step npm link workflow
  - EXTRACT: Vitest path alias configuration
  - EXTRACT: Build requirement (dist/ directory)
  - DOCUMENT: Step-by-step linking instructions
  - DEPENDENCIES: Task 2 (have package info)

Task 4: EXTRACT environment variables from environment.ts
  - EXTRACT: Required variables (ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL)
  - EXTRACT: Optional variables (model overrides)
  - EXTRACT: Default values and mapping logic
  - DOCUMENT: Environment variable table with examples
  - DEPENDENCIES: Task 3 (have setup info)

Task 5: CREATE docs/INSTALLATION.md with document structure
  - CREATE: File header with title, description, status, version
  - IMPLEMENT: Table of Contents with anchor links
  - IMPLEMENT: Quick Start section (5 steps max, visible without scrolling)
  - FOLLOW pattern: docs/user-guide.md (heading structure, TOC format)
  - NAMING: INSTALLATION.md (uppercase for visibility)
  - PLACEMENT: docs/ directory alongside user-guide.md
  - DEPENDENCIES: Tasks 1-4 (all research complete)

Task 6: IMPLEMENT Prerequisites section
  - CREATE: "Prerequisites" H2 section
  - DOCUMENT: Node.js >=20.0.0 requirement with check command
  - DOCUMENT: npm >=10.0.0 requirement with check command
  - DOCUMENT: Git requirement (for cloning repository)
  - ADD: Version check commands (node --version, npm --version, git --version)
  - ADD: Links to Node.js and npm download pages
  - DEPENDENCIES: Task 5 (file created)

Task 7: IMPLEMENT Installation section
  - CREATE: "Installation" H2 section
  - ADD: "Clone the Repository" subsection with git clone command
  - ADD: "Install Dependencies" subsection with npm install command
  - ADD: "Link Groundswell" subsection with two-step npm link workflow
  - ADD: Note about running npm run build in groundswell first if needed
  - DEPENDENCIES: Task 6 (prerequisites documented)

Task 8: IMPLEMENT Configuration section
  - CREATE: "Configuration" H2 section
  - ADD: "Environment Variables" subsection
  - CREATE: Table with Variable, Required, Default, Description columns
  - DOCUMENT: ANTHROPIC_AUTH_TOKEN (required, mapped to API_KEY)
  - DOCUMENT: ANTHROPIC_BASE_URL (required, default: z.ai endpoint)
  - DOCUMENT: Optional model variables (SONNET, HAIKU, OPUS)
  - ADD: .env file example
  - ADD: Security note about never committing .env file
  - DEPENDENCIES: Task 7 (installation complete)

Task 9: IMPLEMENT Verification section
  - CREATE: "Verification" H2 section
  - ADD: "Run Tests" subsection with npm test command
  - ADD: "Run Validation" subsection with npm run validate command
  - ADD: "Build Check" subsection with npm run build command
  - ADD: Expected output examples for each command
  - DEPENDENCIES: Task 8 (configuration documented)

Task 10: IMPLEMENT Troubleshooting section
  - CREATE: "Troubleshooting" H2 section
  - ORGANIZE: By error message/symptom (not by internal cause)
  - ADD: "npm link fails" issue with solutions
  - ADD: "Cannot find module 'groundswell'" issue
  - ADD: "Wrong Node/npm version" issue with upgrade instructions
  - ADD: "Tests fail with API error" issue (check ANTHROPIC_BASE_URL)
  - ADD: "EACCES permission errors" issue with solutions
  - ADD: Platform-specific notes (Windows, macOS, Linux)
  - ADD: "Getting Help" subsection with links to issues, docs
  - DEPENDENCIES: Task 9 (verification documented)

Task 11: IMPLEMENT Next Steps section
  - CREATE: "Next Steps" H2 section
  - ADD: Link to README.md for project overview
  - ADD: Link to docs/user-guide.md for detailed usage
  - ADD: Link to PRD.md for understanding the project
  - DEPENDENCIES: Task 10 (troubleshooting complete)

Task 12: VERIFY document follows all patterns
  - VERIFY: Heading hierarchy (H1 → H2 → H3, no skipped levels)
  - VERIFY: Table of Contents links work
  - VERIFY: Code blocks use language tags (```bash, ```typescript)
  - VERIFY: Tables are properly formatted
  - VERIFY: Links use correct relative paths (../README.md, ./user-guide.md)
  - VERIFY: Tone matches user-guide.md (professional, clear, concise)
  - VERIFY: Quick Start is visible without scrolling
  - DEPENDENCIES: Task 11 (document complete)
```

### Implementation Patterns & Key Details

```markdown
# PATTERN: Document header with metadata
# Installation Guide

> Comprehensive guide for setting up the PRP Pipeline development environment.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

# PATTERN: Table of Contents with auto-generated anchors
## Table of Contents

* [Quick Start](#quick-start)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
  * [Clone the Repository](#clone-the-repository)
  * [Install Dependencies](#install-dependencies)
  * [Link Groundswell](#link-groundswell)

# PATTERN: Quick Start (5 steps max, above the fold)
## Quick Start

Get up and running in under 5 minutes:

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/hacky-hack.git
   cd hacky-hack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Link Groundswell library**
   ```bash
   cd ~/projects/groundswell && npm link
   cd ~/projects/hacky-hack && npm link groundswell
   ```

4. **Configure environment variables**
   ```bash
   export ANTHROPIC_AUTH_TOKEN=zk-xxxxx
   export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
   ```

5. **Verify installation**
   ```bash
   npm test
   ```

# PATTERN: Prerequisites with version check commands
## Prerequisites

Before installing, ensure you have the following:

### Node.js

- **Version**: >=20.0.0
- **Check your version**:
  ```bash
  node --version
  ```
- **Install or upgrade**: [nodejs.org](https://nodejs.org/)

### npm

- **Version**: >=10.0.0
- **Check your version**:
  ```bash
  npm --version
  ```
- **Install or upgrade**: [npm documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

# PATTERN: Code blocks with command and expected output
```bash
$ npm test
# Expected: Tests run in watch mode, all passing
```

# PATTERN: Environment variable table
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | Yes | None | z.ai API authentication token (mapped to `ANTHROPIC_API_KEY`) |
| `ANTHROPIC_BASE_URL` | Yes | `https://api.z.ai/api/anthropic` | z.ai API endpoint |

# PATTERN: Troubleshooting by error message
## Troubleshooting

### "npm link fails"

**What you see:**
```bash
$ npm link groundswell
npm ERR! code EEXIST
```

**Why it happens:**
The groundswell package isn't built or the symlink already exists.

**How to fix:**
1. Build groundswell first:
   ```bash
   cd ~/projects/groundswell
   npm run build
   npm link
   ```

2. In hacky-hack, unlink and try again:
   ```bash
   cd ~/projects/hacky-hack
   npm unlink groundswell
   npm link groundswell
   ```

# PATTERN: Platform-specific notes
<details>
<summary>Windows Users</summary>

On Windows, you may need to run commands as Administrator if you encounter EACCES errors:
```powershell
# Run PowerShell as Administrator
npm install
```

Windows paths use backslashes:
```powershell
cd projects\groundswell
npm link
```
</details>

# PATTERN: Link to related documentation
## Next Steps

Now that you have the environment set up:

- **[README.md](../README.md)** - Project overview and basic features
- **[User Guide](./user-guide.md)** - Comprehensive usage documentation
- **[PRD.md](../PRD.md)** - Product requirements document

# CRITICAL: Groundswell linking requires two steps
# Step 1: In the groundswell project directory
cd ~/projects/groundswell
npm link

# Step 2: In the hacky-hack project directory
cd ~/projects/hacky-hack
npm link groundswell

# GOTCHA: Order matters - must link from groundswell first
# GOTCHA: Groundswell must be built (npm run build) before linking

# CRITICAL: z.ai API configuration (NOT api.anthropic.com)
# Tests enforce z.ai usage and will fail if wrong endpoint
export ANTHROPIC_AUTH_TOKEN=zk-xxxxx
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic

# CRITICAL: Environment variable mapping
# Shell: ANTHROPIC_AUTH_TOKEN
# SDK: ANTHROPIC_API_KEY (mapped automatically)

# GOTCHA: .env file should never be committed
# Add .env to .gitignore if creating local env file
```

### Integration Points

```yaml
NO CODE CHANGES:
  - This is documentation only
  - No source code modifications required
  - No configuration file changes

DOCUMENTATION INTEGRATION:
  - Link to docs/INSTALLATION.md from README.md Quick Start section
  - Reference from onboarding documentation
  - Include in contributing guidelines (if exists)

CROSS-REFERENCES:
  - Link to README.md from "Next Steps" section
  - Link to docs/user-guide.md for detailed usage
  - Link to PRD.md for project understanding
  - Reference system_context.md for architecture details

PARALLEL CONTEXT:
  - P1.M3.T5.S2 (Verify bug severity levels) - parallel work item
  - No overlap or conflict - this is documentation only
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run docs:lint -- docs/INSTALLATION.md
# OR
npx markdownlint docs/INSTALLATION.md

# Fix any linting issues
npm run docs:lint:fix -- docs/INSTALLATION.md

# Expected: Zero markdown linting errors
```

### Level 2: Link Validation

```bash
# Verify all internal links work
npm run docs:links

# Manual verification:
# 1. Click each link in Table of Contents
# 2. Verify code blocks have language tags
# 3. Check relative paths are correct (../README.md, ./user-guide.md)

# Expected: All links resolve correctly
```

### Level 3: Content Validation

```bash
# Manual review checklist:
# [ ] Quick Start has exactly 5 steps
# [ ] Quick Start is visible without scrolling
# [ ] All version requirements match package.json engines field
# [ ] Groundswell linking instructions match external_deps.md
# [ ] Environment variables match environment.ts
# [ ] Verification commands match package.json scripts
# [ ] Troubleshooting covers common issues
# [ ] Tables are properly formatted
# [ ] Code blocks use proper syntax highlighting

# Expected: All content is accurate and complete
```

### Level 4: User Acceptance Testing

```bash
# Fresh installation test (optional but recommended):
# 1. Create a clean directory or VM
# 2. Follow the INSTALLATION.md guide step-by-step
# 3. Verify each command works as documented
# 4. Check that tests pass
# 5. Try troubleshooting steps if issues occur

# Expected: New developer can successfully set up environment
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 validation passed (markdown linting)
- [ ] Level 2 validation passed (links work)
- [ ] Level 3 validation passed (content accuracy)
- [ ] File created at docs/INSTALLATION.md
- [ ] File follows markdown best practices
- [ ] No broken links or invalid references

### Feature Validation

- [ ] Quick Start section has 5 steps or fewer
- [ ] Quick Start is visible without scrolling
- [ ] Prerequisites section lists Node.js >=20.0.0, npm >=10.0.0
- [ ] Installation section covers cloning, dependencies, groundswell linking
- [ ] Configuration section includes all required environment variables
- [ ] Verification section includes test commands
- [ ] Troubleshooting section covers at least 5 common issues
- [ ] Platform-specific variations are noted

### Documentation Quality Validation

- [ ] Heading hierarchy is correct (H1 → H2 → H3, no skipped levels)
- [ ] Table of Contents is included with working anchor links
- [ ] Code blocks use language tags (```bash, ```typescript)
- [ ] Tables are properly formatted
- [ ] Tone matches existing documentation (professional, clear, concise)
- [ ] Follows formatting patterns from docs/user-guide.md
- [ ] Relative links use correct paths (../ for parent, ./ for sibling)

### Integration Validation

- [ ] Links to README.md work
- [ ] Links to docs/user-guide.md work
- [ ] Links to PRD.md work
- [ ] Can be referenced from onboarding documentation
- [ ] No conflicts with existing documentation

---

## Anti-Patterns to Avoid

- Don't create overly detailed Quick Start - keep it to 5 steps max
- Don't bury the Quick Start below other content - keep it "above the fold"
- Don't skip troubleshooting - common issues will occur
- Don't organize troubleshooting by cause - organize by symptom/error message
- Don't forget platform-specific notes (Windows paths differ from Unix)
- Don't hardcode version numbers without explaining version check commands
- Don't forget to mention .env file security (never commit)
- Don't skip the Groundswell linking steps - it's a critical setup requirement
- Don't use vague error descriptions - be specific about what the user sees
- Don't assume the user knows npm link - explain the two-step process
- Don't forget to mention the z.ai API endpoint (not api.anthropic.com)
- Don't skip verification steps - user needs to know if setup succeeded
- Don't make the document too long - use progressive disclosure
- Don't use complex jargon without explanation
- Don't forget to update the "Last Updated" date when making changes

---

**PRP Version:** 1.0
**Work Item:** P2.M1.T1.S1
**Created:** 2026-01-23
**Status:** Ready for Implementation
