# Product Requirement Prompt: P5.M3.T2.S2 - Create Contributor Guide

---

## Goal

**Feature Goal**: Create a comprehensive contributor guide (`docs/contributing.md`) that enables new contributors to onboard effectively, understand the development workflow, and make high-quality contributions to the PRP Pipeline project.

**Deliverable**: A single `docs/contributing.md` file containing:

- Quick start setup (5 commands or less)
- Development environment setup with troubleshooting
- Code organization overview (src/ directory responsibilities)
- Testing guide (unit, integration, E2E patterns)
- Pull request process with branch strategy
- Code style guide (ESLint, Prettier, TypeScript)
- Adding new agent personas (step-by-step)
- Adding new MCP tools (step-by-step)
- Release process overview

**Success Definition**:

- New contributor can set up dev environment in <5 minutes
- Guide links to architecture.md for deep technical details
- All commands are copy-pasteable and tested
- Code examples are from actual codebase
- Guide follows documentation style of user-guide.md

---

## User Persona

**Target User**: Developers joining the PRP Pipeline project as contributors

**Use Case**: Onboarding to contribute features, fix bugs, or improve documentation

**User Journey**:

1. Developer discovers project on GitHub
2. Reads README.md for project overview
3. Visits docs/contributing.md to start contributing
4. Follows Quick Start to set up environment
5. Reads Code Organization to understand structure
6. References Testing Guide when writing tests
7. Follows PR Process when submitting changes
8. Successfully merges first contribution

**Pain Points Addressed**:

- Complex multi-agent system is difficult to navigate
- Testing setup (Vitest, 100% coverage) needs clear guidance
- Adding agent personas and MCP tools requires specific patterns
- Code style rules (ESLint, Prettier) need documentation
- PR process and branch conventions are unclear

---

## Why

- **Contributor Onboarding**: New contributors need clear guidance to start contributing effectively
- **Code Quality**: Comprehensive testing and style documentation ensures high-quality contributions
- **Scalability**: Clear patterns for adding agents and tools enable organic project growth
- **Community**: Well-documented contribution process fosters healthy open source community

---

## What

Create a comprehensive contributor guide at `docs/contributing.md` with the following structure:

### Document Structure

```markdown
# Contributing to PRP Pipeline

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Code Organization](#code-organization)
- [Testing Guide](#testing-guide)
- [Code Style](#code-style)
- [Adding New Agent Personas](#adding-new-agent-personas)
- [Adding New MCP Tools](#adding-new-mcp-tools)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Getting Help](#getting-help)

## Quick Start

5 commands to get contributing immediately

## Development Setup

Detailed setup with prerequisites and troubleshooting

## Code Organization

Overview of src/ directory structure and responsibilities

## Testing Guide

How to write and run tests (unit, integration, E2E)

## Code Style

ESLint, Prettier, TypeScript rules and commands

## Adding New Agent Personas

Step-by-step guide for adding agent personas

## Adding New MCP Tools

Step-by-step guide for adding MCP tools

## Pull Request Process

Branch naming, commit format, PR submission

## Release Process

How releases work (overview)

## Getting Help

Where to ask questions
```

### Success Criteria

- [ ] Quick Start section has 5 or fewer commands
- [ ] All commands are copy-pasteable and tested
- [ ] Code Organization section references src/ directories accurately
- [ ] Testing Guide includes unit, integration, and E2E examples
- [ ] Code Style section links to ESLint config
- [ ] Adding Agent Personas includes working code example
- [ ] Adding MCP Tools includes working code example
- [ ] PR Process includes branch naming conventions
- [ ] Guide links to architecture.md for technical details
- [ ] Guide linked from README.md Contributing section

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP includes:

- Complete research on testing patterns and setup
- Codebase structure analysis with directory responsibilities
- Existing documentation style references
- Contributing guide best practices from open source projects
- Code examples from actual codebase
- Validation commands for testing

---

### Documentation & References

```yaml
# MUST READ - Research Documents

- file: plan/001_14b9dc2a33c7/P5M3T2S2/research/testing-research.md
  why: Complete testing setup research with Vitest configuration, patterns, and scripts
  critical: Test commands, directory structure, coverage requirements, mocking patterns

- file: plan/001_14b9dc2a33c7/P5M3T2S2/research/contributing-guide-patterns.md
  why: Best practices from TypeScript/Node.js open source projects
  critical: Universal sections, structural best practices, recommended sections

- file: plan/001_14b9dc2a33c7/P5M3T2S1/PRP.md
  why: Previous PRP for architecture documentation - link to it for technical details
  critical: Architecture docs will be at docs/architecture.md when PRP is implemented

- url: https://vitest.dev/guide/
  why: Official Vitest documentation for testing patterns
  section: /guide/ (Testing concepts, CLI, coverage)

- url: https://typescript-eslint.io/rules/
  why: TypeScript ESLint rules reference for code style section
  section: /rules/ (Specific rule explanations)

# EXISTING DOCUMENTATION (Style Reference)

- file: docs/user-guide.md
  why: Style and structure reference for documentation
  pattern: Table of contents, mermaid diagrams, code blocks, section organization
  gotcha: This guide is for USERS, contributing.md is for CONTRIBUTORS

- file: README.md
  why: Existing project documentation - update Contributing section to link to new guide
  section: Contributing section (lines 473-524)
  gotcha: Replace minimal Contributing section with link to docs/contributing.md

# SOURCE CODE (File References and Patterns)

- file: package.json
  why: All npm scripts, dependencies, and engine requirements
  pattern: Scripts section (lines 10-50)
  critical: Exact command names for testing, linting, formatting

- file: vitest.config.ts
  why: Test configuration and coverage requirements
  pattern: Coverage thresholds (100%), include/exclude patterns
  critical: 100% coverage requirement must be documented

- file: .eslintrc.json
  why: ESLint configuration for code style section
  pattern: TypeScript ESLint rules, Prettier integration
  critical: Specific rules to mention in guide

- file: .prettierrc
  why: Prettier configuration for formatting rules
  pattern: Print width, tab width, single quotes
  critical: Specific formatting rules to document

- file: src/agents/agent-factory.ts
  why: Reference for "Adding Agent Personas" section
  pattern: createArchitectAgent(), createResearcherAgent(), createCoderAgent(), createQAAgent()
  critical: Show pattern for adding new persona

- file: src/tools/bash-mcp.ts
  why: Reference for "Adding MCP Tools" section
  pattern: MCPHandler extension, registerServer(), registerToolExecutor()
  critical: Show pattern for adding new MCP tool

- file: src/core/models.ts
  why: Type definitions reference for understanding codebase
  pattern: StatusEnum, ItemTypeEnum, task hierarchy types
  gotcha: 855 JSDoc tags - complex type system

- file: src/core/session-manager.ts
  why: Session management pattern reference
  pattern: Class structure, async methods, state management
  gotcha: Batching state updates for performance

- file: tests/unit/agents/agent-factory.test.ts
  why: Test pattern reference for Testing Guide
  pattern: describe/it blocks, vi.mock(), vi.stubEnv(), AAA pattern
  critical: Show real test example from codebase

- file: tests/integration/prp-runtime-integration.test.ts
  why: Integration test pattern reference
  pattern: Setup/teardown, mock factories, async testing
  critical: Show integration test example
```

---

### Current Codebase Tree (Relevant Sections)

```bash
hacky-hack/
├── docs/
│   ├── user-guide.md           # Reference for documentation style
│   └── contributing.md          # OUTPUT: Contributor guide (CREATE)
├── src/
│   ├── agents/                  # Agent implementations
│   │   ├── prompts/             # Agent prompt templates
│   │   ├── agent-factory.ts     # Agent creation (4 personas)
│   │   ├── prp-generator.ts     # PRP Generator
│   │   ├── prp-executor.ts      # PRP Executor
│   │   └── prp-runtime.ts       # PRP Runtime orchestrator
│   ├── cli/
│   │   └── index.ts             # CLI entry point
│   ├── config/
│   │   ├── constants.ts         # Constants
│   │   ├── environment.ts       # Environment setup
│   │   └── types.ts             # Type definitions
│   ├── core/
│   │   ├── models.ts            # Task hierarchy types
│   │   ├── session-manager.ts   # Session state management
│   │   ├── task-orchestrator.ts # Task execution
│   │   └── research-queue.ts    # Parallel research
│   ├── tools/
│   │   ├── bash-mcp.ts          # Bash MCP tool
│   │   ├── filesystem-mcp.ts    # Filesystem MCP tool
│   │   └── git-mcp.ts           # Git MCP tool
│   ├── utils/
│   │   ├── logger.ts            # Structured logging
│   │   ├── progress.ts          # Progress tracking
│   │   └── git-commit.ts        # Smart commit
│   └── workflows/
│       └── prp-pipeline.ts      # Main pipeline workflow
├── tests/
│   ├── unit/                    # Unit tests (mirrors src/)
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   ├── manual/                  # Manual validation tests
│   └── fixtures/                # Test data
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── vitest.config.ts             # Test configuration
├── package.json                 # npm scripts and dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # UPDATE: Link to contributing.md
```

---

### Desired Codebase Tree (After Implementation)

```bash
hacky-hack/
├── docs/
│   ├── user-guide.md           # User documentation (unchanged)
│   ├── architecture.md         # Architecture docs (from P5.M3.T2.S1)
│   └── contributing.md         # NEW: Contributor guide
├── README.md                    # MODIFIED: Link to docs/contributing.md
└── [rest unchanged]
```

---

### Known Gotchas & Library Quirks

```markdown
# CRITICAL: Vitest 100% Coverage Requirement

# Vitest is configured with 100% coverage thresholds for ALL metrics:

# - statements: 100%

# - branches: 100%

# - functions: 100%

# - lines: 100%

#

# New contributions MUST maintain 100% coverage.

# Run `npm run test:coverage` before committing.

# CRITICAL: ESM Modules with .js Extensions

# This project uses "type": "module" in package.json

# Import statements must use .js extensions (not .ts):

# import { foo } from './bar.js'; // Correct

# import { foo } from './bar.ts'; // WRONG - will fail at runtime

# CRITICAL: Vitest Mock Hoisting

# vi.mock() must be called at TOP LEVEL (before describe blocks)

# Wrong:

# describe('test', () => {

# vi.mock('./foo.js'); // Too late!

# })

#

# Correct:

# vi.mock('./foo.js'); // At top level

# describe('test', () => {

# // tests here

# })

# CRITICAL: ESLint Strict Mode

# @typescript-eslint/no-floating-promises is set to "error"

# ALL async operations must be awaited or explicitly voided:

# await asyncOperation(); // Correct

# asyncOperation(); // WRONG - linting error

# void asyncOperation(); // Correct (intentionally unawaited)

# CRITICAL: Prettier Print Width

# Print width is 80 characters (stricter than typical 100)

# Long lines must be broken:

# const longString = 'this is too long and will trigger prettier formatting'; // WRONG

# const longString =

# 'this line is within the 80 character limit'; // Correct

# CRITICAL: TypeScript Strict Mode

# tsconfig.json has "strict": true

# All types must be properly annotated

# No implicit any, no unsafe this, no unsafe assignment
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models required. This task creates documentation only.

Key concepts to document:

- **Development Workflow**: Fork → Clone → Branch → Develop → Test → PR → Merge
- **Testing Pyramid**: Unit (fastest) → Integration → E2E (slowest)
- **Code Style**: ESLint + Prettier + TypeScript strict mode
- **Extension Points**: Agent personas (agent-factory.ts), MCP tools (tools/)

---

### Implementation Tasks (Ordered by Dependencies)

````yaml
Task 1: CREATE plan/001_14b9dc2a33c7/P5M3T2S2/contributing-draft.md
  - IMPLEMENT: First draft of contributing guide
  - FOLLOW structure: Defined in "What" section above
  - REFERENCE: docs/user-guide.md for style and tone
  - REFERENCE: research/contributing-guide-patterns.md for section structure
  - LENGTH: Target 800-1200 lines (comprehensive but scannable)
  - SECTIONS:
    ### Quick Start (5 commands max)
      - git clone → npm install → npm test → npm run validate → ready

    ### Development Setup
      - Prerequisites: Node.js >= 20.0.0, npm >= 10.0.0
      - Installation steps with troubleshooting
      - Environment variables (ANTHROPIC_API_KEY)
      - Verify setup commands

    ### Code Organization
      - src/ directory overview with responsibilities
      - Link to docs/architecture.md for deep technical details
      - tests/ directory structure
      - Key files and their purposes

    ### Testing Guide
      - Test types: Unit, Integration, E2E, Manual
      - Running tests: npm test, npm run test:run, npm run test:coverage
      - Writing tests (with example from tests/unit/agents/agent-factory.test.ts)
      - 100% coverage requirement
      - Mocking patterns (vi.mock, vi.stubEnv)
      - Test structure (AAA pattern)

    ### Code Style
      - ESLint: npm run lint, npm run lint:fix
      - Prettier: npm run format, npm run format:check
      - TypeScript: npm run typecheck
      - Combined validation: npm run validate, npm run fix
      - Link to .eslintrc.json and .prettierrc
      - Key rules: 80 char line limit, no floating promises, strict mode

    ### Adding New Agent Personas
      - When to add a new persona
      - Step-by-step process:
        1. Define prompt in src/agents/prompts/
        2. Create factory function in src/agents/agent-factory.ts
        3. Export from index
      - Code example (from existing agent-factory.ts pattern)
      - Testing the new agent

    ### Adding New MCP Tools
      - When to add a new tool
      - Step-by-step process:
        1. Create tool file in src/tools/
        2. Extend MCPHandler
        3. Register server and tool executor
      - Code example (from bash-mcp.ts pattern)
      - Testing the new tool

    ### Pull Request Process
      - Forking and cloning
      - Branch naming: feature/, fix/, docs/
      - Commit format: type: description
      - Running tests before pushing
      - Creating PR with template
      - CI/CD checks

    ### Release Process
      - Versioning strategy
      - Release notes
      - Tagging

    ### Getting Help
      - GitHub Issues
      - GitHub Discussions (if available)
      - Code of Conduct reference

  - CODE EXAMPLES:
    - Use actual code from codebase (not pseudocode)
    - Include file path references above each example
    - Keep examples concise (10-30 lines)
    - Use TypeScript syntax highlighting

  - DIAGRAMS:
    - Use simple ASCII art or mermaid diagrams where helpful
    - Keep diagrams focused (one concept per diagram)
    - Reference docs/architecture.md for complex diagrams

  - LINKS:
    - Link to docs/architecture.md for technical architecture
    - Link to docs/user-guide.md for user-facing features
    - Link to vitest.config.ts for test configuration
    - Link to .eslintrc.json for linting rules

Task 2: MOVE and RENAME to docs/contributing.md
  - IMPLEMENT: Move draft to final location
  - FROM: plan/001_14b9dc2a33c7/P5M3T2S2/contributing-draft.md
  - TO: docs/contributing.md
  - VERIFY: All internal links still work

Task 3: UPDATE README.md Contributing section
  - IMPLEMENT: Replace minimal Contributing section with link to docs/contributing.md
  - FIND pattern: "## Contributing" section (lines 473-524)
  - REPLACE with:
    ```markdown
    ## Contributing

    We welcome contributions! See [docs/contributing.md](docs/contributing.md) for complete contributor guidelines.
    ```
  - PRESERVE: License section and all other content

Task 4: VALIDATE documentation completeness
  - IMPLEMENT: Review docs/contributing.md for completeness
  - CHECK: Quick Start has 5 or fewer commands
  - CHECK: All commands are copy-pasteable
  - CHECK: All file references are accurate
  - CHECK: All code examples are syntactically correct TypeScript
  - CHECK: Links to docs/architecture.md work (when created)
  - CHECK: Links to docs/user-guide.md work
  - CHECK: README.md link works
  - CHECK: Code style rules match ESLint/Prettier configs
  - CHECK: Test commands match package.json scripts

Task 5: TEST documentation instructions
  - IMPLEMENT: Follow Quick Start instructions in clean environment
  - VERIFY: Each command works as documented
  - VERIFY: Setup completes successfully
  - CHECK: Test commands run successfully
  - CHECK: Validation commands pass
  - FIX: Any errors or missing steps

Task 6: FORMAT and VALIDATE
  - IMPLEMENT: Run Prettier on contributing.md
  - COMMAND: npm run format
  - VERIFY: No formatting issues
  - CHECK: Markdown renders correctly in GitHub
````

---

### Implementation Patterns & Key Details

````markdown
# Documentation Style Guide (from user-guide.md)

## Section Structure

- Use ## for main sections, ### for subsections
- Include Table of Contents at the top
- Use mermaid diagrams for visual concepts
- Use code blocks for all commands and examples

## Code Block Format

\`\`\`bash

# Commands (with comments explaining what they do)

npm install
\`\`\`

\`\`\`typescript
// TypeScript code (with explanatory comments)
const example: string = "value";
\`\`\`

## Code Examples from Codebase

### Agent Factory Pattern (src/agents/agent-factory.ts)

```typescript
import { createAgent } from 'groundswell';
import { architectPrompt } from './prompts.js';

export function createArchitectAgent(config: AgentConfig) {
  return createAgent({
    modelName: config.model,
    systemPrompt: architectPrompt,
    outputSchema: BacklogSchema,
  });
}
```
````

### Test Pattern (tests/unit/agents/agent-factory.test.ts)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createArchitectAgent } from '../../../src/agents/agent-factory.js';

describe('Agent Factory', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
  });

  it('should create architect agent', () => {
    const agent = createArchitectAgent({ model: 'test-model' });
    expect(agent).toBeDefined();
  });
});
```

### MCP Tool Pattern (src/tools/bash-mcp.ts)

```typescript
import { MCPHandler } from 'groundswell';

export class BashMCP extends MCPHandler {
  constructor() {
    super();
    this.registerServer('bash', async () => {
      // Bash server setup
    });
    this.registerToolExecutor('bash', 'exec', async args => {
      // Tool execution
    });
  }
}
```

## Link Patterns

# To architecture docs:

For detailed architecture, see [docs/architecture.md](docs/architecture.md).

# To user guide:

For user-facing features, see [docs/user-guide.md](docs/user-guide.md).

# To source files:

See `src/agents/agent-factory.ts` for implementation details.

# To config files:

See [vitest.config.ts](../vitest.config.ts) for test configuration.

````

---

### Integration Points

```yaml
README.md:
  - modify: "## Contributing" section
  - pattern: |
    ## Contributing

    We welcome contributions! See [docs/contributing.md](docs/contributing.md) for complete contributor guidelines.

docs/architecture.md:
  - link from: Code Organization section
  - pattern: "For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md)."

docs/user-guide.md:
  - link from: Quick Start or Getting Help
  - pattern: "For user-facing features, see [docs/user-guide.md](docs/user-guide.md)."

package.json:
  - reference: All script names in Testing Guide and Code Style sections
  - scripts to document: test, test:run, test:coverage, lint, lint:fix, format, format:check, typecheck, validate, fix

.eslintrc.json:
  - link from: Code Style section
  - key rules to document: no-floating-promises, no-unused-vars, prettier/prettier

.prettierrc:
  - link from: Code Style section
  - key rules to document: printWidth (80), singleQuote (true), semi (true)

vitest.config.ts:
  - link from: Testing Guide section
  - key settings to document: 100% coverage, test environment (node)
````

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating contributing.md
# Check markdown syntax
npx markdownlint docs/contributing.md --fix
# Expected: Zero errors

# Check Prettier formatting
npm run format
# Expected: docs/contributing.md formatted correctly

# Check formatting
npm run format:check
# Expected: Zero formatting issues

# Project-wide validation
npm run validate
# Expected: All checks pass (lint, format, typecheck)
```

### Level 2: Documentation Validation

```bash
# Test internal links
# Open docs/contributing.md in editor/IDE
# Click on all internal links
# Expected: All links resolve correctly

# Test external links
npx markdown-link-check docs/contributing.md
# Expected: All external links are valid

# Verify code examples are syntactically correct
# Copy all TypeScript code blocks
# Paste into TypeScript playground or run tsc --noEmit
# Expected: No type errors

# Verify bash commands are correct
# Copy all bash commands
# Run each one in clean environment
# Expected: All commands execute successfully
```

### Level 3: Usability Validation

```bash
# Follow Quick Start instructions in clean environment
# 1. Clone repository to new location
# 2. Follow Quick Start commands exactly
# Expected: Setup completes successfully

# Test Code Organization section
# Verify each mentioned directory exists
# ls src/agents/
# ls src/core/
# Expected: All directories exist

# Test Testing Guide instructions
# Run all documented test commands
npm test
npm run test:run
npm run test:coverage
# Expected: All commands work as documented

# Test Code Style instructions
# Run all documented style commands
npm run lint
npm run format
npm run typecheck
npm run validate
# Expected: All commands work as documented
```

### Level 4: Content Validation

```markdown
# Review Checklist

## Content Quality

- [ ] Quick Start has 5 or fewer commands
- [ ] All commands are copy-pasteable
- [ ] Code examples are from actual codebase
- [ ] File paths are accurate
- [ ] Links to architecture.md work (or will work when created)
- [ ] Links to user-guide.md work
- [ ] External links are valid

## Style Consistency

- [ ] Matches user-guide.md documentation style
- [ ] Section structure is consistent
- [ ] Code blocks use correct syntax highlighting
- [ ] Mermaid diagrams render correctly (if used)

## Completeness

- [ ] Quick Start section present
- [ ] Development Setup section present
- [ ] Code Organization section present
- [ ] Testing Guide section present
- [ ] Code Style section present
- [ ] Adding Agent Personas section present
- [ ] Adding MCP Tools section present
- [ ] PR Process section present
- [ ] Getting Help section present

## README Integration

- [ ] README.md Contributing section updated
- [ ] Link to docs/contributing.md works
- [ ] Link is prominent and easy to find
```

---

## Final Validation Checklist

### Technical Validation

- [ ] docs/contributing.md created at correct location
- [ ] Document follows markdown syntax correctly
- [ ] Prettier formatting applied
- [ ] All internal links resolve correctly
- [ ] All external links are valid
- [ ] Code examples are syntactically correct TypeScript
- [ ] Bash commands execute successfully
- [ ] README.md updated with link

### Feature Validation

- [ ] Quick Start has 5 or fewer commands
- [ ] Development Setup includes prerequisites and troubleshooting
- [ ] Code Organization covers all src/ directories
- [ ] Testing Guide includes unit, integration, and E2E patterns
- [ ] Code Style section covers ESLint, Prettier, TypeScript
- [ ] Adding Agent Personas has working code example
- [ ] Adding MCP Tools has working code example
- [ ] PR Process includes branch naming and commit format
- [ ] Release Process provides overview
- [ ] Getting Help section points to resources

### Documentation Quality

- [ ] Document follows user-guide.md style
- [ ] Table of Contents is present
- [ ] All sections from structure are present
- [ ] Code examples include file path references
- [ ] Commands are copy-pasteable
- [ ] Links to docs/architecture.md are present
- [ ] Links to docs/user-guide.md are present
- [ ] Document length is appropriate (800-1200 lines)

### Integration Validation

- [ ] README.md links to docs/contributing.md
- [ ] docs/contributing.md links to docs/architecture.md
- [ ] docs/contributing.md links to docs/user-guide.md
- [ ] All configuration files referenced (.eslintrc.json, .prettierrc, vitest.config.ts)
- [ ] All source code references are accurate
- [ ] All package.json scripts referenced correctly
- [ ] No broken links in documentation

---

## Anti-Patterns to Avoid

- ❌ Don't create Quick Start with more than 5 commands (keep it minimal)
- ❌ Don't use pseudocode in examples (use actual code from codebase)
- ❌ Don't skip testing the documented commands (verify they work)
- ❌ Don't forget to link to docs/architecture.md for technical details
- ❌ Don't use absolute file paths (use relative paths from project root)
- ❌ Don't create code examples longer than 30 lines (keep concise)
- ❌ Don't forget to mention 100% coverage requirement
- ❌ Don't skip the .js extension requirement for ESM imports
- ❌ Don't forget to update README.md with link to new guide
- ❌ Don't create sections that duplicate docs/architecture.md content (link instead)
- ❌ Don't use unclear branch naming examples (be specific: feature/, fix/, docs/)
- ❌ Don't forget to document the AAA pattern for tests
- ❌ Don't skip mentioning vi.mock() hoisting requirement
- ❌ Don't create external links without checking they're valid
- ❌ Don't forget to reference existing agent-factory.ts and bash-mcp.ts patterns
