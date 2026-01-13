# PRP for P3.M4.T2.S3: Add npm scripts and documentation

---

## Goal

**Feature Goal**: Finalize package.json scripts with user-friendly commands and create comprehensive README.md documentation that enables users to quickly understand, install, and use the PRP Pipeline.

**Deliverable**:

- Updated `package.json` with organized, user-friendly npm scripts
- Complete `README.md` with quick start, usage examples, architecture overview, and development setup

**Success Definition**:

- All npm scripts work correctly with the CLI from P3.M4.T2.S2
- README.md provides clear path from installation to running the pipeline
- npm scripts follow established naming conventions
- README documents all CLI options and use cases
- Architecture section explains PRP concept and agent system
- Development section covers setup, testing, and contribution

## User Persona

**Target User**: Developer or DevOps engineer who wants to automate software development using AI agents

**Use Case**: User has a Product Requirement Document (PRD) and wants the PRP Pipeline to autonomously implement it through:

1. Task decomposition (Architect agent)
2. PRP generation (Researcher agent)
3. Code implementation (Coder agent)
4. QA validation (QA agent)

**User Journey**:

1. User clones repository and runs `npm install`
2. User reads README.md Quick Start section
3. User runs `npm run dev -- --prd ./PRD.md` to start pipeline
4. For development: User runs `npm run dev:watch` for hot reload
5. For scoped execution: User runs `npm run dev -- --prd ./PRD.md --scope P3.M4`
6. For testing: User runs `npm test` to verify code quality

**Pain Points Addressed**:

- Single command to run entire pipeline (no complex setup)
- Clear CLI options documentation (no guessing arguments)
- Development mode with hot reload (faster iteration)
- Scoped execution for targeted development
- Comprehensive testing and validation scripts

## Why

- **User Experience**: CLI from P3.M4.T2.S2 needs convenient npm scripts for common operations
- **Documentation**: No README exists - users need clear guidance to use the tool
- **Onboarding**: New users need quick start path and architecture overview
- **Development**: Devs need watch mode, test scripts, and validation commands
- **Quality Gates**: Scripts should integrate linting, formatting, and testing

## What

### System Behavior

**Part 1: Update package.json scripts**

The current package.json already has many scripts. This task will:

1. **Organize existing scripts** with comments for clarity
2. **Add missing scripts** based on best practices research
3. **Ensure scripts work with P3.M4.T2.S2 CLI** (passing arguments correctly)

Current scripts (from package.json):

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "watch": "nodemon --exec tsx src/index.ts",
    "pipeline": "tsx src/index.ts",
    "pipeline:dev": "nodemon --exec tsx src/index.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "validate:api": "tsx src/scripts/validate-api.ts",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",
    "validate": "npm run lint && npm run format:check",
    "prebuild": "npm run validate"
  }
}
```

**Scripts to add/modify:**

1. **`start`**: Standard npm script for production (runs compiled JS)
2. **`start:dev`**: Explicit development mode script
3. **`typecheck`**: Separate type checking script (`tsc --noEmit`)
4. **`typecheck:watch`**: Watch mode for type checking
5. **`dev:watch`**: Alias for `watch` (more conventional name)
6. **`dev:debug`**: Debug mode with inspector
7. **`fix`**: Combine lint:fix and format for auto-fixing everything
8. **Organize with comments**: Group related scripts with section headers

**Part 2: Create README.md**

Create comprehensive README.md with these sections:

1. **Header** with project title, badges, and one-line description
2. **Quick Start** - Get running in under 2 minutes
3. **What is PRP Pipeline?** - Elevator pitch + architecture diagram
4. **Features** - 6-8 key capabilities with emojis
5. **Installation** - Prerequisites and setup steps
6. **Usage** - CLI options, examples, and common commands
7. **Architecture Overview** - High-level system architecture with diagrams
8. **AI Agent System** - Agent roles and interaction flow
9. **Pipeline Workflow** - 4-phase pipeline explanation
10. **Project Structure** - Directory tree with annotations
11. **Development** - Setup, testing, and contribution guide
12. **License** - MIT license information

### Success Criteria

- [ ] All npm scripts work correctly (no errors on execution)
- [ ] `npm run dev -- --prd ./PRD.md` runs pipeline with default PRD
- [ ] `npm run dev -- --prd ./PRD.md --scope P3.M4` runs scoped execution
- [ ] `npm run dev:watch` enables hot reload development
- [ ] `npm run typecheck` performs type checking without compilation
- [ ] `npm run lint` runs ESLint on TypeScript files
- [ ] `npm run format` formats code with Prettier
- [ ] `npm test` runs Vitest test suite
- [ ] README.md is under 400 lines and readable on GitHub
- [ ] README includes architecture diagrams (ASCII art or Mermaid)
- [ ] README documents all CLI options from P3.M4.T2.S1
- [ ] Quick start section gets user running in < 2 minutes
- [ ] Development section covers testing and contribution

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Complete current package.json scripts to organize/extend
- CLI argument interface from P3.M4.T2.S1
- Full codebase structure with file responsibilities
- ESLint/Prettier/Vitest configuration for command reference
- Research findings on npm scripts best practices
- Research findings on README documentation patterns
- Architecture documentation research with diagram examples
- PRP concept definition from PROMPTS.md
- Project tree structure for README section

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- docfile: plan/001_14b9dc2a33c7/P3M4T2S2/PRP.md
  why: Previous PRP that produces CLI entry point
  critical: Lines 7-28 show CLI will be src/index.ts with full PRPPipeline integration
  critical: Lines 560-570 show CLI usage examples (npm run dev -- --prd ./PRD.md)
  section: "Goal"
  note: This PRP's CLI output is consumed by npm scripts

- docfile: plan/001_14b9dc2a33c7/P3M4T2S1/PRP.md
  why: CLI argument parser definition
  critical: Lines 409-431 show CLIArgs interface with all options
  critical: parseCLIArgs() accepts: --prd, --scope, --mode, --continue, --dry-run, --verbose
  section: "Goal"

- file: package.json
  why: Current npm scripts to organize and extend
  critical: Lines 10-26 show existing scripts (dev, watch, pipeline, test, lint, format, validate)
  critical: Lines 6-9 show engines (Node 20+, npm 10+)
  pattern: Use `npm run script-name -- --arg value` to pass args to underlying command
  gotcha: Must use `--` to pass arguments through npm to the underlying command

- docfile: plan/001_14b9dc2a33c7/P3M4T2S3/research/npm-scripts-research.md
  why: NPM scripts best practices research
  critical: Lines 538-601 show complete recommended script configuration
  critical: Lines 130-176 show reserved script names (start, test, stop, restart)
  critical: Lines 278-346 show script ordering and lifecycle hooks
  section: "Complete Recommended Script Configuration"

- docfile: plan/001_14b9dc2a33c7/P3M4T2S3/research/readme-research.md
  why: README documentation patterns research
  critical: Lines 8-107 show standard README sections (badges, quick start, features, installation)
  critical: Lines 143-360 show command documentation templates
  critical: Lines 726-786 show excellent README examples to study
  section: "Standard README Sections for CLI Tools"

- docfile: plan/001_14b9dc2a33c7/P3M4T2S3/research/architecture-docs-research.md
  why: Architecture documentation research with diagram examples
  critical: Lines 28-98 show directory tree structure example
  critical: Lines 73-98 show ASCII architecture diagram examples
  critical: Lines 294-361 show pipeline workflow documentation
  critical: Lines 818-906 show recommended README structure
  section: "Recommended README Structure for PRP Pipeline"

- docfile: plan/001_14b9dc2a33c7/P3M4T2S3/research/config-analysis.md
  why: ESLint, Prettier, Vitest, TypeScript configuration analysis
  critical: Lines 8-40 show ESLint configuration (parser, rules, file patterns)
  critical: Lines 43-56 show Prettier configuration (80 char width, 2 spaces, single quotes)
  critical: Lines 58-88 show Vitest configuration (100% coverage threshold, v8 provider)
  critical: Lines 91-112 show TypeScript configuration (ES2022, NodeNext, strict mode)
  section: "ESLint Configuration"

- file: src/cli/index.ts
  why: CLI argument parser implementation
  critical: Lines 48-66 show CLIArgs interface definition
  critical: Lines 92-147 show parseCLIArgs() function
  pattern: All CLI options are documented in JSDoc comments
  gotcha: parseCLIArgs() calls process.exit(1) on validation failure

- file: src/workflows/prp-pipeline.ts
  why: Main PRPPipeline class
  critical: Lines 1-23 show module JSDoc with pipeline lifecycle description
  critical: Lines 37-62 show PipelineResult interface
  pattern: Workflow class with @ObservedState and @Step decorators

- file: PROMPTS.md
  why: PRP concept definition for README "What is PRP?" section
  critical: Lines 1-52 define Product Requirement Prompt concept
  critical: Lines 54-100 define Architect persona and hierarchy
  section: "PRP_README (Concept Definition)"

- file: tsconfig.json
  why: TypeScript compilation settings for build scripts
  critical: outDir: "./dist"
  critical: target: "ES2022", module: "NodeNext"
  pattern: Use `tsc` for build, `tsc --noEmit` for typecheck only

- file: vitest.config.ts
  why: Test configuration for test scripts
  critical: test.environment: "node"
  critical: coverage.provider: "v8"
  critical: coverage.thresholds.global: 100% (all metrics)
  pattern: Use `vitest` for watch mode, `vitest run` for CI

- file: .eslintrc.json
  why: Linting configuration for lint scripts
  critical: parser: "@typescript-eslint/parser"
  critical: extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"]
  pattern: Use `eslint . --ext .ts` for linting, add `--fix` for auto-fix

- file: .prettierrc
  why: Formatting configuration for format scripts
  critical: printWidth: 80, semi: true, singleQuote: true
  pattern: Use `prettier --write` for formatting, `--check` for CI validation
```

### Current Codebase Tree

```bash
src/
├── index.ts                   # FROM P3.M4.T2.S2: CLI entry point with PRPPipeline
├── cli/
│   └── index.ts              # FROM P3.M4.T2.S1: parseCLIArgs(), CLIArgs interface
├── config/
│   ├── constants.ts          # DEFAULT_BASE_URL constant
│   ├── environment.ts        # configureEnvironment() function
│   └── types.ts              # Type definitions
├── core/
│   ├── index.ts              # Core module exports
│   ├── models.ts             # Task hierarchy type definitions
│   ├── prd-differ.ts         # PRD diffing utilities
│   ├── scope-resolver.ts     # parseScope(), Scope type
│   ├── session-manager.ts    # SessionManager class
│   ├── session-utils.ts      # Session utilities
│   └── task-orchestrator.ts  # TaskOrchestrator class
├── agents/
│   ├── agent-factory.ts      # Agent creation factory
│   ├── prompts/              # System prompt templates
│   ├── prp-executor.ts       # PRP Executor agent
│   ├── prp-generator.ts      # PRP Generator agent
│   └── prp-runtime.ts        # PRP Runtime orchestrator
├── tools/
│   ├── bash-mcp.ts           # Bash MCP tool
│   ├── filesystem-mcp.ts     # Filesystem MCP tool
│   └── git-mcp.ts            # Git MCP tool
├── utils/
│   ├── git-commit.ts         # Smart commit utility
│   └── task-utils.ts         # Task utilities
├── workflows/
│   ├── hello-world.ts        # Placeholder workflow
│   └── prp-pipeline.ts       # PRPPipeline class (main workflow)
└── scripts/
    └── validate-api.ts       # API validation script

package.json                  # npm scripts to update
tsconfig.json                 # TypeScript compilation config
vitest.config.ts              # Vitest test config
.eslintrc.json                # ESLint config
.prettierrc                   # Prettier config
PRD.md                        # Master product requirements
PROMPTS.md                    # System prompts
```

### Desired Codebase Tree with Files Modified

```bash
# MODIFIED FILES:
package.json                  # MODIFY: Add/organize npm scripts with comments
README.md                     # CREATE: Comprehensive documentation

# All other files remain unchanged
```

### Known Gotchas of Our Codebase & Library Quirks

```json
// CRITICAL: npm scripts must use -- to pass arguments to underlying command
// Example: npm run dev -- --prd ./PRD.md --scope P3.M4
// Everything after -- goes to tsx, not to npm

// CRITICAL: parseCLIArgs() calls process.exit(1) on validation failure
// Don't wrap in try-catch - it exits directly

// CRITICAL: Vitest has 100% coverage threshold requirement
// Tests must cover all branches, functions, lines, statements
// See vitest.config.ts lines 30-36

// CRITICAL: TypeScript is configured for ESM (NodeNext module resolution)
// All imports must use .js extension (even for .ts files)
// See tsconfig.json lines 3-4

// CRITICAL: Prettier enforces 80 character line width
// README tables and code blocks must respect this
// See .prettierrc line 5

// CRITICAL: ESLint enforces no-console (only warn/error allowed)
// Use console.error for CLI output, not console.log for debugging
// See .eslintrc.json line 26

// CRITICAL: prebuild hook runs validate (lint + format:check)
// Build will fail if code doesn't pass linting and formatting
// See package.json line 25

// GOTCHA: package.json already has many scripts defined
// Don't duplicate - organize and add missing ones
// Current scripts: build, dev, watch, pipeline, test, lint, format, validate

// GOTCHA: "pipeline" and "dev" both run tsx src/index.ts
// Keep both for user preference, but document usage in README

// GOTCHA: "watch" uses nodemon for hot reload
// This is the primary development mode script

// GOTCHA: Node 20+ and npm 10+ are required
// Document this in README prerequisites
// See package.json lines 6-9
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This task modifies package.json and creates README.md.

**Scripts to Add/Modify in package.json:**

```json
{
  "scripts": {
    "=== Development ===": "",
    "dev": "tsx src/index.ts",
    "dev:watch": "nodemon --exec tsx src/index.ts",
    "dev:debug": "node --inspect -r tsx src/index.ts",
    "watch": "nodemon --exec tsx src/index.ts",

    "=== Start ===": "",
    "start": "node dist/index.js",
    "start:dev": "NODE_ENV=development tsx src/index.ts",

    "=== Build ===": "",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "prebuild": "npm run validate",

    "=== Pipeline ===": "",
    "pipeline": "tsx src/index.ts",
    "pipeline:dev": "nodemon --exec tsx src/index.ts",

    "=== Test ===": "",
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:bail": "vitest run --bail=1",

    "=== Lint ===": "",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",

    "=== Format ===": "",
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",

    "=== Validation ===": "",
    "validate": "npm run lint && npm run format:check && npm run typecheck",
    "fix": "npm run lint:fix && npm run format",

    "=== API ===": "",
    "validate:api": "tsx src/scripts/validate-api.ts"
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORGANIZE package.json scripts section
  - ADD: Comment section headers (=== Development ===, etc.)
  - PRESERVE: All existing scripts (build, dev, watch, pipeline, test, lint, format, validate)
  - GROUP: Related scripts together with section headers
  - MAINTAIN: JSON validity (comments must be as string values)

Task 2: ADD missing npm scripts to package.json
  - ADD: "start": "node dist/index.js" (production entry point)
  - ADD: "start:dev": "NODE_ENV=development tsx src/index.ts" (explicit dev mode)
  - ADD: "dev:debug": "node --inspect -r tsx src/index.ts" (debug mode with inspector)
  - ADD: "typecheck": "tsc --noEmit" (type checking without compilation)
  - ADD: "typecheck:watch": "tsc --noEmit --watch" (watch mode for type checking)
  - ADD: "build:watch": "tsc --watch" (incremental compilation)
  - ADD: "test:watch": "vitest watch" (alias for test in watch mode)
  - ADD: "test:bail": "vitest run --bail=1" (stop on first failure)
  - ADD: "fix": "npm run lint:fix && npm run format" (auto-fix everything)
  - DEPENDENCIES: None (independent task)

Task 3: CREATE README.md with header and badges
  - ADD: "# PRP Pipeline" title
  - ADD: Project description (one-line)
  - ADD: npm version badge (when published)
  - ADD: Node version badge (>=20.0.0)
  - ADD: License badge (MIT)
  - ADD: TypeScript badge (version 5.2+)
  - PATTERN: Follow badge syntax from readme-research.md lines 13-31
  - PLACEMENT: README.md root

Task 4: CREATE Quick Start section in README.md
  - ADD: "## Quick Start" section
  - ADD: 3-5 step quick start guide
  - ADD: Prerequisites (Node 20+, npm 10+)
  - ADD: Installation commands (npm install)
  - ADD: Run command (npm run dev -- --prd ./PRD.md)
  - PATTERN: Follow readme-research.md lines 116-142
  - PLACEMENT: README.md after badges

Task 5: CREATE "What is PRP Pipeline?" section in README.md
  - ADD: Brief elevator pitch (1 paragraph)
  - ADD: ASCII architecture diagram showing PRD -> PRP -> Code flow
  - ADD: Link to PROMPTS.md for PRP concept details
  - PATTERN: Follow architecture-docs-research.md lines 268-275
  - PLACEMENT: README.md after Quick Start

Task 6: CREATE Features section in README.md
  - ADD: "## Features" section with 6-8 key features
  - ADD: Emojis for visual appeal
  - FEATURES:
    - Autonomous PRD-to-code implementation
    - Multi-agent AI architecture (Architect, Researcher, Coder, QA)
    - Hierarchical task decomposition (Phase -> Milestone -> Task -> Subtask)
    - Resumable sessions with state persistence
    - Scoped execution (run specific phases/milestones/tasks)
    - 4-level validation gate system
    - Built-in QA bug hunting
    - Git integration with smart commits
  - PATTERN: Follow readme-research.md lines 56-74
  - PLACEMENT: README.md after "What is PRP Pipeline?"

Task 7: CREATE Installation section in README.md
  - ADD: "## Installation" section
  - ADD: Prerequisites (Node.js >=20, npm >=10)
  - ADD: Clone repository command
  - ADD: Install dependencies command
  - ADD: Verify installation command
  - PATTERN: Follow readme-research.md lines 75-114
  - PLACEMENT: README.md after Features

Task 8: CREATE Usage section in README.md
  - ADD: "## Usage" section
  - ADD: Basic command structure: `npm run dev -- [options]`
  - ADD: CLI options table (prd, scope, mode, continue, dry-run, verbose)
  - ADD: Common usage examples
  - ADD: Expected output examples
  - PATTERN: Follow readme-research.md lines 143-227
  - PLACEMENT: README.md after Installation

Task 9: CREATE Architecture Overview section in README.md
  - ADD: "## Architecture Overview" section
  - ADD: High-level ASCII diagram
  - ADD: Component descriptions
  - PATTERN: Follow architecture-docs-research.md lines 73-124
  - PLACEMENT: README.md after Usage

Task 10: CREATE AI Agent System section in README.md
  - ADD: "## AI Agent System" section
  - ADD: Agent roles table
  - ADD: Agent interaction flow diagram
  - ADD: Brief PRP concept explanation
  - PATTERN: Follow architecture-docs-research.md lines 364-464
  - PLACEMENT: README.md after Architecture Overview

Task 11: CREATE Pipeline Workflow section in README.md
  - ADD: "## Pipeline Workflow" section
  - ADD: Phase descriptions (1-4)
  - ADD: State progression diagram
  - PATTERN: Follow architecture-docs-research.md lines 314-361
  - PLACEMENT: README.md after AI Agent System

Task 12: CREATE Project Structure section in README.md
  - ADD: "## Project Structure" section
  - ADD: ASCII directory tree
  - ADD: Annotations for key directories
  - PATTERN: Follow architecture-docs-research.md lines 28-58
  - PLACEMENT: README.md after Pipeline Workflow

Task 13: CREATE Development section in README.md
  - ADD: "## Development" section
  - ADD: Prerequisites
  - ADD: Setup commands
  - ADD: Available scripts table
  - PATTERN: Follow readme-research.md lines 370-459
  - PLACEMENT: README.md after Project Structure

Task 14: CREATE License section in README.md
  - ADD: "## License" section
  - ADD: MIT license
  - PATTERN: Follow readme-research.md lines 490-497
  - PLACEMENT: README.md at end

Task 15: VALIDATE all npm scripts work correctly
  - RUN: npm run dev -- --prd ./PRD.md --dry-run
  - RUN: npm run typecheck
  - RUN: npm run lint
  - RUN: npm run format:check
  - RUN: npm test
  - VERIFY: All scripts exit with code 0 on success
```

### Implementation Patterns & Key Details

```markdown
# README.md Structure Template

# PRP Pipeline

[Badges: npm version, Node version, License, TypeScript]

## Quick Start

[3-5 steps to get running]

## What is PRP Pipeline?

[Elevator pitch + architecture diagram]

## Features

- Feature 1
- Feature 2
- ...

## Installation

[Prerequisites + setup commands]

## Usage

[CLI options table + examples]

## Architecture Overview

[ASCII diagram of system architecture]

## AI Agent System

[Agent roles table + interaction flow]

## Pipeline Workflow

[4-phase pipeline explanation]

## Project Structure

[ASCII directory tree]

## Development

[Available scripts table + testing commands]

## License

MIT
```

```json
// package.json scripts section template

{
  "scripts": {
    "=== Development ===": "",
    "dev": "tsx src/index.ts",
    "dev:watch": "nodemon --exec tsx src/index.ts",
    "dev:debug": "node --inspect -r tsx src/index.ts",
    "watch": "nodemon --exec tsx src/index.ts",
    "=== Start ===": "",
    "start": "node dist/index.js",
    "start:dev": "NODE_ENV=development tsx src/index.ts",
    "=== Build ===": "",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "prebuild": "npm run validate",
    "=== Pipeline ===": "",
    "pipeline": "tsx src/index.ts",
    "pipeline:dev": "nodemon --exec tsx src/index.ts",
    "=== Test ===": "",
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:bail": "vitest run --bail=1",
    "=== Lint ===": "",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "=== Format ===": "",
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",
    "=== Validation ===": "",
    "validate": "npm run lint && npm run format:check && npm run typecheck",
    "fix": "npm run lint:fix && npm run format",
    "=== API ===": "",
    "validate:api": "tsx src/scripts/validate-api.ts"
  }
}
```

```

# ASCII Architecture Diagram for README

┌─────────────────────────────────────────────────────────────────────┐
│                        PRP Pipeline Architecture                     │
└─────────────────────────────────────────────────────────────────────┘

   ┌──────────┐      ┌──────────────┐      ┌─────────────┐
   │    PRD   │─────▶│    Architect │─────▶│   Backlog   │
   │  (Input) │      │    Agent     │      │  (JSON)     │
   └──────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                    Task Orchestrator                         │
   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
   │  │  Phase   │─▶│Milestone │─▶│   Task   │─▶│ Subtask  │   │
   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
   └──────────────────────────────────────────────────────────────┘
                            │
                            ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │ PRP Generator│─────▶│ PRP Runtime  │─────▶│    Build     │
   │  (Research)  │      │  (Execute)   │      │  (Output)    │
   └──────────────┘      └──────────────┘      └──────────────┘
```

### Integration Points

```yaml
PACKAGE_JSON:
  - file: package.json
  - modify: "scripts" section
  - add: typecheck, typecheck:watch, dev:debug, start, start:dev
  - add: build:watch, test:watch, test:bail, fix
  - organize: Section headers (=== Development ===, etc.)
  - preserve: All existing scripts (build, dev, watch, pipeline, test, lint, format, validate)

README_MD:
  - file: README.md
  - create: New file with comprehensive documentation
  - sections: Quick Start, What is PRP?, Features, Installation, Usage, Architecture, Agents, Workflow, Structure, Development, License
  - diagrams: ASCII art for architecture and agent flow
  - length: Under 400 lines for readability

CLI_INTEGRATION:
  - import: Uses CLI from P3.M4.T2.S2 (src/index.ts)
  - scripts: All scripts run src/index.ts with appropriate arguments
  - pattern: npm run dev -- --prd ./PRD.md [options]
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying package.json
npm run lint -- package.json
npm run format -- package.json

# After creating README.md
npm run format -- README.md
npm run format:check -- README.md

# Expected: Zero errors. JSON is valid, README is properly formatted.
```

### Level 2: Script Validation (Component Testing)

```bash
# Test each npm script

# Test 1: Development scripts
npm run dev -- --prd ./PRD.md --dry-run
npm run dev:watch -- --prd ./PRD.md --dry-run
npm run dev:debug -- --prd ./PRD.md --dry-run

# Test 2: Start scripts
npm run start:dev -- --prd ./PRD.md --dry-run

# Test 3: Build scripts
npm run typecheck
npm run typecheck:watch
npm run build

# Test 4: Test scripts
npm test
npm run test:run
npm run test:coverage

# Test 5: Lint and format scripts
npm run lint
npm run format:check
npm run validate
npm run fix

# Expected: All scripts execute without errors
```

### Level 3: README Validation (Documentation Testing)

```bash
# Test 1: README exists and is readable
test -f README.md

# Test 2: README is properly formatted
npm run format -- README.md

# Test 3: README has all required sections
grep -q "## Quick Start" README.md
grep -q "## Features" README.md
grep -q "## Installation" README.md
grep -q "## Usage" README.md
grep -q "## Architecture" README.md
grep -q "## Development" README.md

# Test 4: README examples work
npm run dev -- --prd ./PRD.md --dry-run

# Test 5: README length check
wc -l README.md

# Expected: README is complete, formatted, and all examples work
```

### Level 4: Integration Testing (System Validation)

```bash
# Test 1: Full workflow with dry-run
npm run dev -- --prd ./PRD.md --dry-run --verbose

# Test 2: Scoped execution
npm run dev -- --prd ./PRD.md --scope P3.M4 --dry-run

# Test 3: All flags together
npm run dev -- --prd ./PRD.md --scope P3.M4 --mode normal --continue --dry-run --verbose

# Test 4: Watch mode development
npm run dev:watch -- --prd ./PRD.md --dry-run

# Test 5: Build and typecheck workflow
npm run build
npm run typecheck

# Test 6: Validation workflow
npm run validate

# Expected: All integration tests pass, scripts work together correctly
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] package.json is valid JSON (npm install works)
- [ ] All npm scripts execute without errors
- [ ] README.md is properly formatted (Prettier passes)
- [ ] README.md has all required sections
- [ ] README.md is under 400 lines
- [ ] ASCII diagrams render correctly (check line width <= 80 chars)

### Feature Validation

- [ ] `npm run dev -- --prd ./PRD.md` runs pipeline
- [ ] `npm run dev -- --prd ./PRD.md --scope P3.M4` runs scoped execution
- [ ] `npm run dev -- --prd ./PRD.md --dry-run` shows dry run output
- [ ] `npm run dev:watch` enables hot reload mode
- [ ] `npm run typecheck` performs type checking
- [ ] `npm run lint` runs ESLint
- [ ] `npm run format` formats code
- [ ] `npm test` runs tests
- [ ] README Quick Start gets user running in < 2 minutes
- [ ] README documents all CLI options from P3.M4.T2.S1
- [ ] README includes architecture diagrams
- [ ] README explains PRP concept
- [ ] README covers development setup

### Code Quality Validation

- [ ] package.json scripts are organized with section headers
- [ ] Script names follow naming conventions (hierarchical with colons)
- [ ] README follows markdown best practices
- [ ] ASCII diagrams are mobile-friendly (<= 80 chars wide)
- [ ] Documentation is consistent with codebase
- [ ] All examples in README are executable
- [ ] No broken links or references in README

### Documentation & Deployment

- [ ] README.md is committed to repository
- [ ] README.md renders correctly on GitHub
- [ ] All npm scripts are documented in README Development section
- [ ] CLI options are documented with examples
- [ ] Architecture is explained with diagrams
- [ ] PRP concept is clearly explained
- [ ] Setup instructions are complete and accurate

---

## Anti-Patterns to Avoid

- Don't remove existing scripts - preserve all current functionality
- Don't forget `--` in npm scripts - arguments won't pass through
- Don't make README over 400 lines - move detailed docs to separate files
- Don't use binary images for diagrams - can't version control
- Don't hardcode URLs in badges - use dynamic badge services
- Don't skip examples in README - show, don't just tell
- Don't use emojis inconsistently - pick a set and stick to it
- Don't make ASCII diagrams > 80 chars - breaks on mobile
- Don't forget to document existing scripts - even if they seem obvious
- Don't duplicate script functionality - choose one name per purpose
- Don't use complex bash in scripts - keep them simple and readable
- Don't skip the prerequisites section - users need to know requirements
- Don't forget the `--help` option mention - CLI supports it
- Don't make the Quick Start more than 5 steps - keep it quick
