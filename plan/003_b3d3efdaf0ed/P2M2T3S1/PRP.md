# Product Requirement Prompt (PRP): Create Testing Strategy Documentation

> **Status**: Draft
> **Last Updated**: 2026-01-23
> **Version**: 1.0.0
> **Work Item**: P2.M2.T3.S1 - Create testing strategy documentation

---

## Goal

**Feature Goal**: Create comprehensive testing strategy documentation (`docs/TESTING.md`) that explains the project's testing philosophy, structure, and guidelines to enable developers to write and maintain tests effectively.

**Deliverable**: Documentation file `docs/TESTING.md` with testing strategy, guidelines, and examples.

**Success Definition**:

- Documentation follows the established pattern of other docs/\*.md files (frontmatter, TOC, sections)
- Covers all required topics from the contract: testing philosophy, test structure, unit/integration/e2e tests, mocking strategies, running tests and coverage
- Includes code examples from the actual codebase
- Provides clear guidelines for writing new tests

---

## User Persona

**Target User**: Developers working on the hacky-hack PRP Pipeline codebase who need to understand, write, or maintain tests.

**Use Case**: A developer needs to add a new feature and wants to ensure they write tests that follow the project's conventions and meet the 100% coverage requirement.

**User Journey**:

1. Developer reads `docs/TESTING.md` to understand testing philosophy
2. Reviews test structure section to know where to place new tests
3. Studies mocking strategies to avoid external dependencies
4. Writes test following the provided templates
5. Runs tests and coverage to verify compliance

**Pain Points Addressed**:

- Uncertainty about where to place tests (unit vs integration vs e2e)
- Confusion about how to mock Groundswell agents, file system, and git operations
- Lack of clear examples showing actual project test patterns
- Not understanding the 100% coverage requirement and how to achieve it

---

## Why

- **Documentation Completeness**: The Developer Documentation milestone (P2.M2) requires comprehensive testing documentation
- **Onboarding Efficiency**: New developers need clear testing guidelines to contribute effectively
- **Consistency**: Ensures all tests follow the same patterns and conventions
- **Quality Maintenance**: Documents the 100% coverage requirement and validation strategies

---

## What

Create `docs/TESTING.md` with the following sections:

### Testing Philosophy

- 100% coverage requirement (statements, branches, functions, lines)
- Deterministic testing (no external dependencies during tests)
- Test isolation (proper setup/teardown and cleanup)
- Layered testing approach (unit, integration, e2e)

### Test Structure and Organization

- Directory structure: `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/fixtures/`
- File naming conventions: `*.test.ts`, `*.spec.ts`
- Test organization mirroring source code structure

### Unit vs Integration vs E2E Tests

- Unit tests: Single component testing in `tests/unit/`
- Integration tests: Multi-component testing in `tests/integration/`
- E2E tests: Full workflow testing in `tests/e2e/`

### Mocking Strategies

- Groundswell agent mocking pattern (preserve exports with `vi.importActual`)
- File system mocking (`node:fs`, `node:fs/promises`)
- Git mocking (`simple-git`)
- Environment variable stubbing (`vi.stubEnv`)

### Running Tests and Coverage Reports

- Test commands: `npm test`, `npm run test:coverage`, `npm run test:watch`
- Coverage thresholds and requirements
- Debugging tests

### Test Writing Guidelines

- AAA pattern (Arrange-Act-Assert)
- Test naming conventions
- Test file template
- Best practices

### Success Criteria

- [ ] Documentation file created at `docs/TESTING.md`
- [ ] Follows established documentation pattern (frontmatter with status, version, date)
- [ ] Includes comprehensive Table of Contents
- [ ] Contains code examples from actual test files
- [ ] Covers all required topics from contract
- [ ] Includes references to related documentation

---

## All Needed Context

### Context Completeness Check

**Before implementing**, validate: "If someone knew nothing about this codebase, would they have everything needed to write comprehensive testing documentation?"

### Documentation & References

```yaml
# MUST READ - Project documentation patterns
- file: docs/ARCHITECTURE.md
  why: Documentation style, frontmatter format, TOC structure, section organization
  pattern: Status/version frontmatter, comprehensive TOC, mermaid diagrams, code examples
  gotcha: Uses specific header styling (H1 # for title, H2 ## for main sections)

- file: docs/INSTALLATION.md
  why: Another example of documentation format and structure
  pattern: Similar frontmatter and organization patterns

- file: docs/CLI_REFERENCE.md
  why: Documentation pattern reference for command-related sections
  pattern: Code examples with expected output, command usage tables

# MUST READ - Test configuration and setup
- file: vitest.config.ts
  why: Understanding coverage requirements (100% thresholds), test environment, path aliases
  section: coverage.thresholds.global (100% for all metrics)
  critical: Enforces 100% coverage - tests must cover ALL branches

- file: tests/setup.ts
  why: Global test hooks, API endpoint validation (z.ai enforcement), promise rejection tracking
  section: validateApiEndpoint() function (blocks Anthropic API, requires z.ai)
  critical: All tests MUST use z.ai endpoint, never Anthropic's official API

# MUST READ - Existing test patterns and examples
- file: tests/integration/agents.test.ts
  why: Comprehensive example of Groundswell mocking pattern, test file structure
  pattern: vi.mock with vi.importActual to preserve exports, mock fixtures, AAA pattern
  gotcha: Mock must be at top level before imports (hoisting required)

- file: tests/unit/agents/agent-factory.test.ts
  why: Unit test example with it.each() for parameterized tests, env stubbing
  pattern: afterEach cleanup with vi.unstubAllEnvs(), beforeEach setup
  gotcha: Always restore environment after tests to prevent leaks

- file: tests/unit/core/session-manager.test.ts
  why: Example of complex unit test with file system and crypto mocking
  pattern: Mock all external dependencies, comprehensive edge case coverage
  gotcha: Large test file - focus on structure patterns

# Research documentation - Testing best practices
- docfile: docs/research/llm-agent-testing-best-practices.md
  why: Comprehensive testing patterns and best practices specific to LLM agents
  section: Complete document - especially mocking strategies and coverage requirements
  critical: Groundswell mocking pattern, test organization principles, coverage thresholds

- docfile: docs/research/architect-agent-testing-implementation-guide.md
  why: Quick reference templates and testing patterns
  section: Test file structure template and quick start integration test template
  critical: Provides copy-paste templates for new test files

- docfile: plan/003_b3d3efdaf0ed/P2M2T3S1/research/vitest-research.md
  why: External Vitest documentation URLs and best practices
  section: All sections - especially mocking strategies, coverage configuration
  critical: Official Vitest patterns and API references

# External Vitest documentation URLs
- url: https://vitest.dev/guide/
  why: Main Vitest documentation for test structure and organization

- url: https://vitest.dev/guide/mocking.html
  why: Comprehensive mocking strategies (vi.mock, vi.fn, vi.stubEnv, vi.spyOn)

- url: https://vitest.dev/guide/coverage.html
  why: Coverage configuration and thresholds

- url: https://vitest.dev/config/
  why: Complete vitest.config.ts configuration reference
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── setup.ts                    # Global test configuration (API validation, cleanup)
├── unit/                       # Unit tests (80 files)
│   ├── agents/                 # Agent factory and prompts tests
│   ├── config/                 # Configuration tests
│   ├── core/                   # Session manager, task orchestrator tests
│   ├── groundswell/            # Groundswell framework tests
│   ├── tools/                  # MCP tool tests (bash, fs, git)
│   ├── utils/                  # Utility function tests
│   └── workflows/              # Workflow tests
├── integration/                # Integration tests (42 files)
│   ├── agents.test.ts          # Groundswell integration example
│   ├── architect-agent.test.ts
│   ├── coder-agent.test.ts
│   └── ...
├── e2e/                        # End-to-end tests (2 files)
│   ├── full-pipeline.test.ts
│   └── delta-session.test.ts
├── manual/                     # Manual/AI-assisted tests
├── fixtures/                   # Test data and mock fixtures
│   ├── mock-delta-data.ts
│   ├── prp-samples.ts
│   └── simple-prd.ts
└── validation/                 # Validation tests

docs/
├── INSTALLATION.md              # Example: Installation documentation
├── ARCHITECTURE.md              # Example: Architecture documentation
├── CLI_REFERENCE.md             # Example: CLI reference
├── CONFIGURATION.md             # Example: Configuration guide
├── CUSTOM_AGENTS.md             # Example: Custom agent guide
├── CUSTOM_TOOLS.md              # Example: Custom tool guide
├── CUSTOM_WORKFLOWS.md          # Example: Custom workflow guide
├── WORKFLOWS.md                 # Example: Workflow documentation
├── user-guide.md                # Example: User guide
├── api/                         # TypeDoc generated API docs
└── research/                    # Research documentation
    ├── llm-agent-testing-best-practices.md
    ├── architect-agent-testing-implementation-guide.md
    └── llm-agent-testing-resources.md
```

### Desired Codebase Tree (new file to be added)

```bash
docs/
├── TESTING.md                   # NEW: Testing strategy and guidelines
└── ...
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Vitest mocking hoisting
// vi.mock() calls MUST be at the top level before any imports
// This is required for hoisting to work properly
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,  // PRESERVE non-mocked exports (MCPHandler, MCPServer)
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});
// Import AFTER mocking
import { createAgent } from 'groundswell';

// CRITICAL: API endpoint enforcement
// All tests MUST use z.ai endpoint, never Anthropic's official API
// tests/setup.ts validates this and will fail if api.anthropic.com is detected
vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

// CRITICAL: 100% coverage requirement
// vitest.config.ts enforces 100% coverage for all metrics
// If coverage drops below 100%, tests will fail
coverage: {
  thresholds: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
}

// CRITICAL: Environment variable cleanup
// Always restore environment variables in afterEach to prevent test pollution
afterEach(() => {
  vi.unstubAllEnvs();
});

// CRITICAL: Mock cleanup
// Clear mock call histories between tests to prevent isolation issues
afterEach(() => {
  vi.clearAllMocks();
});

// GOTCHA: File path resolution in tests
// Use relative paths from test file location: '../../../src/...'
// Not from project root

// GOTCHA: TypeScript ESM imports
// Use .js extensions in import statements even for .ts files
import { SessionManager } from '../../../src/core/session-manager.js';
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This is pure documentation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE docs/TESTING.md with frontmatter and TOC structure
  - IMPLEMENT: Frontmatter header (Status, Last Updated, Version)
  - FOLLOW pattern: docs/ARCHITECTURE.md (frontmatter format)
  - IMPLEMENT: Comprehensive Table of Contents with all required sections
  - NAMING: TESTING.md (matches pattern of other docs)
  - PLACEMENT: docs/ directory alongside other documentation

Task 2: WRITE Testing Philosophy section
  - IMPLEMENT: Explain 100% coverage requirement with vitest.config.ts reference
  - IMPLEMENT: Document deterministic testing approach (no external dependencies)
  - IMPLEMENT: Document test isolation principles
  - IMPLEMENT: Explain layered testing pyramid (unit, integration, e2e)
  - REFERENCE: tests/setup.ts for global hooks
  - REFERENCE: vitest.config.ts for coverage thresholds

Task 3: WRITE Test Structure and Organization section
  - IMPLEMENT: Directory structure explanation with tree diagram
  - IMPLEMENT: File naming conventions (*.test.ts, *.spec.ts)
  - IMPLEMENT: Test organization mirroring source structure
  - REFERENCE: tests/ directory structure
  - INCLUDE: Tree diagram showing tests/ layout

Task 4: WRITE Unit vs Integration vs E2E Tests section
  - IMPLEMENT: Unit test definition and examples from tests/unit/
  - IMPLEMENT: Integration test definition and examples from tests/integration/
  - IMPLEMENT: E2E test definition and examples from tests/e2e/
  - IMPLEMENT: When to use each type
  - INCLUDE: Code snippets from actual test files

Task 5: WRITE Mocking Strategies section
  - IMPLEMENT: Groundswell agent mocking pattern (vi.mock with vi.importActual)
  - IMPLEMENT: File system mocking (node:fs, node:fs/promises)
  - IMPLEMENT: Git mocking (simple-git)
  - IMPLEMENT: Environment variable stubbing (vi.stubEnv)
  - REFERENCE: tests/integration/agents.test.ts (Groundswell mocking)
  - REFERENCE: tests/unit/core/session-manager.test.ts (fs/crypto mocking)
  - INCLUDE: Complete code examples from actual tests

Task 6: WRITE Running Tests and Coverage Reports section
  - IMPLEMENT: Test commands (npm test, npm run test:coverage, npm run test:watch)
  - IMPLEMENT: Coverage threshold explanation (100% requirement)
  - IMPLEMENT: Debugging tips (node --inspect-brk, selective test running)
  - REFERENCE: package.json scripts section
  - REFERENCE: vitest.config.ts coverage section

Task 7: WRITE Test Writing Guidelines section
  - IMPLEMENT: AAA pattern explanation (Arrange-Act-Assert)
  - IMPLEMENT: Test naming conventions (descriptive, "should" pattern)
  - IMPLEMENT: Test file template (with comments explaining each section)
  - IMPLEMENT: Best practices (isolation, cleanup, edge cases)
  - REFERENCE: tests/integration/agents.test.ts for AAA pattern
  - INCLUDE: Copy-paste test file template

Task 8: ADD See Also section with references
  - IMPLEMENT: Links to related documentation (ARCHITECTURE.md, CUSTOM_AGENTS.md)
  - IMPLEMENT: Links to research documentation (llm-agent-testing-best-practices.md)
  - IMPLEMENT: Links to Vitest documentation
  - FOLLOW pattern: docs/ARCHITECTURE.md See Also section

Task 9: VALIDATE documentation completeness
  - VERIFY: All required sections from contract are present
  - VERIFY: Code examples are from actual test files
  - VERIFY: Follows documentation pattern (frontmatter, TOC, sections)
  - VERIFY: All references are accurate and paths are correct
```

### Implementation Patterns & Key Details

```markdown
# Documentation Pattern (from docs/ARCHITECTURE.md)

## Frontmatter (required at top of file)

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

## Table of Contents (required after frontmatter)

- [Section 1](#section-1)
- [Section 2](#section-2)
  ...

## Section Headers

# Title (H1, once at top)

## Main Section (H2)

### Subsection (H3)

#### Detail (H4)

## Code Examples

\`\`\`typescript
// Code with syntax highlighting
\`\`\`

## Diagrams (use Mermaid.js)

\`\`\`mermaid
flowchart LR
A --> B
\`\`\`

## File References

Use relative paths: \`../src/core/session-manager.ts\`
Or absolute paths: \`tests/integration/agents.test.ts\`

## See Also Section (at end)

### Project Documentation

- **[Related Doc](./path/to/doc.md)** - Description

### External References

- [Vitest Documentation](https://vitest.dev/guide/)
```

### Integration Points

```yaml
DOCUMENTATION:
  - add to: docs/TESTING.md
  - pattern: Follow docs/ARCHITECTURE.md structure and style
  - cross_reference: Link to ARCHITECTURE.md for system context
  - cross_reference: Link to CUSTOM_AGENTS.md for agent testing

NO_CODE_CHANGES:
  - This task is pure documentation
  - No source code modifications needed
  - No test modifications needed
```

---

## Validation Loop

### Level 1: Documentation Validation (Immediate Feedback)

```bash
# Verify file exists and is readable
cat docs/TESTING.md

# Check for required frontmatter
grep -E "^\*\*Status\*\*|^\*\*Last Updated\*\*|^\*\*Version\*\*" docs/TESTING.md

# Check for required sections (modify as needed for section titles)
grep -E "^## Testing Philosophy|^## Test Structure|^## Unit vs Integration|^## Mocking|^## Running Tests|^## Test Writing" docs/TESTING.md

# Check for TOC presence
grep -E "^## Table of Contents" docs/TESTING.md

# Verify markdown formatting
npx markdownlint-cli2 docs/TESTING.md 2>&1 || echo "markdownlint not configured"

# Expected: File exists, has frontmatter, has all required sections
```

### Level 2: Content Validation (Quality Check)

````bash
# Verify code examples are from actual files
grep -q "tests/integration/agents.test.ts" docs/TESTING.md
grep -q "tests/unit/agents/agent-factory.test.ts" docs/TESTING.md

# Verify references to configuration files
grep -q "vitest.config.ts" docs/TESTING.md
grep -q "tests/setup.ts" docs/TESTING.md

# Verify external documentation links
grep -q "vitest.dev" docs/TESTING.md

# Check for code block presence (should have many examples)
grep -c '```typescript' docs/TESTING.md

# Expected: All references are accurate, code examples are present
````

### Level 3: Documentation Consistency (Style Check)

```bash
# Compare structure with ARCHITECTURE.md
# 1. Check frontmatter format matches
# 2. Check TOC format matches
# 3. Check section header hierarchy matches
# 4. Check See Also section matches

# Verify documentation style consistency
head -20 docs/TESTING.md  # Check frontmatter
tail -50 docs/TESTING.md   # Check See Also section

# Expected: Follows same pattern as other docs/*.md files
```

### Level 4: Manual Review (Content Validation)

```bash
# Manual checklist:
# [ ] Frontmatter has Status, Last Updated, Version
# [ ] Table of Contents is comprehensive
# [ ] Testing Philosophy section covers 100% coverage requirement
# [ ] Test Structure section explains directory layout
# [ ] Unit vs Integration vs E2E section has examples
# [ ] Mocking Strategies section has Groundswell pattern
# [ ] Running Tests section has commands
# [ ] Test Writing Guidelines has templates
# [ ] See Also section has relevant links
# [ ] Code examples are from actual test files
# [ ] No broken internal links
# [ ] No broken external links
```

---

## Final Validation Checklist

### Technical Validation

- [ ] File created at `docs/TESTING.md`
- [ ] File is readable and valid markdown
- [ ] All required sections present from contract
- [ ] Code examples are syntactically valid TypeScript
- [ ] Internal file references are accurate paths

### Documentation Validation

- [ ] Frontmatter matches established pattern
- [ ] Table of Contents is comprehensive
- [ ] Section hierarchy follows H1 → H2 → H3 pattern
- [ ] Code examples use syntax highlighting
- [ ] See Also section references are accurate

### Content Validation

- [ ] Testing Philosophy explains 100% coverage requirement
- [ ] Test Structure shows directory layout with tree diagram
- [ ] Unit/Integration/E2E section has examples from actual tests
- [ ] Mocking Strategies includes Groundswell pattern from agents.test.ts
- [ ] Running Tests section has correct npm commands
- [ ] Test Writing Guidelines has usable template

### Style Validation

- [ ] Matches docs/ARCHITECTURE.md structure and style
- [ ] Uses consistent formatting (bolding, code blocks, headers)
- [ ] Diagrams use Mermaid.js syntax
- [ ] File references use backticks with paths

---

## Anti-Patterns to Avoid

- **Don't** create generic examples - use actual code from the test files
- **Don't** skip the 100% coverage requirement explanation
- **Don't** forget to mention the z.ai API endpoint enforcement
- **Don't** omit the Groundswell mocking pattern (it's critical)
- **Don't** use inconsistent formatting from other docs
- **Don't** include broken links or references
- **Don't** write the documentation as if it's for a different project
- **Don't** forget the See Also section with cross-references
- **Don't** make the TOC incomplete or misaligned with sections
- **Don't** use external examples when internal ones exist

---

## Context for Implementation

### Key Test File Examples to Reference

1. **tests/integration/agents.test.ts** - Best example of:
   - Groundswell mocking with `vi.importActual`
   - Comprehensive test file structure
   - Mock fixtures pattern
   - AAA pattern usage

2. **tests/unit/agents/agent-factory.test.ts** - Best example of:
   - Parameterized tests with `it.each()`
   - Environment variable stubbing
   - Clean afterEach patterns
   - Unit test isolation

3. **tests/unit/core/session-manager.test.ts** - Best example of:
   - File system mocking
   - Crypto mocking
   - Complex test scenarios

### Documentation Style Reference

Use **docs/ARCHITECTURE.md** as the primary style reference:

- Frontmatter format
- TOC structure
- Section organization
- Code example presentation
- See Also section format
- Mermaid diagram usage

### Coverage Requirement Reference

From **vitest.config.ts**:

```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
}
```

This MUST be clearly explained in the Testing Philosophy section.

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-23
**Maintainer**: PRP Pipeline Team
