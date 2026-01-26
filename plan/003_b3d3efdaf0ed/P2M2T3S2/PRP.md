name: "PRP for Test Examples Documentation (P2.M2.T3.S2)"
description: |

---

## Goal

**Feature Goal**: Create comprehensive test writing examples documentation (`docs/TEST_EXAMPLES.md`) that provides annotated, executable code examples demonstrating all testing patterns used in the PRP Pipeline codebase.

**Deliverable**: A single markdown file `docs/TEST_EXAMPLES.md` containing:

- Five (5) complete test examples with annotations
- Clear explanations of each pattern and when to use it
- Links to related documentation and resources

**Success Definition**:

- [ ] File `docs/TEST_EXAMPLES.md` exists and follows project documentation conventions
- [ ] Contains all 5 required test types: (a) unit test for utility function, (b) unit test for class with mocked dependencies, (c) integration test for agent with mocked LLM, (d) integration test for workflow with mocked components, (e) e2e test for full pipeline
- [ ] Each example includes complete, executable code with ARRANGE-ACT-ASSERT comments
- [ ] All examples use actual patterns from the existing codebase
- [ ] Documentation includes "See Also" section with cross-references

## User Persona

**Target User**: Developers contributing to the PRP Pipeline codebase who need to write tests following established patterns.

**Use Case**: A developer needs to write a new test and wants to reference concrete examples of how tests are structured in this project.

**User Journey**:

1. Developer opens `docs/TEST_EXAMPLES.md` to find test pattern examples
2. Developer locates the relevant test type (unit/integration/e2e)
3. Developer reviews the annotated code example
4. Developer copies the pattern and adapts it for their use case
5. Developer successfully writes a test that follows project conventions

**Pain Points Addressed**:

- "How do I mock Groundswell agents?" - Shows the critical `vi.importActual()` pattern
- "What's the difference between unit and integration tests?" - Clear examples with explanations
- "How do I test async operations?" - E2E example with proper async/await patterns
- "What naming conventions should I follow?" - Consistent examples throughout

## Why

- **Developer Onboarding**: New contributors need clear examples to understand testing patterns
- **Consistency**: Ensures all tests follow the same structure and conventions
- **Quality**: Well-tested codebase with comprehensive coverage (100% requirement)
- **Maintainability**: Easy to update tests when patterns are well-documented

## What

Create `docs/TEST_EXAMPLES.md` with comprehensive, annotated test examples covering:

### Test Types to Document

1. **Unit Test for Utility Function**
   - Pure function testing with no mocks
   - Multiple test cases (happy path, edge cases, error cases)
   - Parameterized tests using `it.each()`

2. **Unit Test for Class with Mocked Dependencies**
   - Dependency injection pattern
   - Mock setup and verification
   - Error handling testing

3. **Integration Test for Agent with Mocked LLM**
   - Groundswell mocking pattern (`vi.importActual()`)
   - Prompt content validation
   - Agent configuration testing

4. **Integration Test for Workflow with Mocked Components**
   - Multiple mocked dependencies
   - Component interaction testing
   - Error propagation testing

5. **E2E Test for Full Pipeline**
   - Complete workflow validation
   - File system validation
   - Multi-level assertions

### Documentation Requirements

Each example must include:

- Complete, executable code
- ARRANGE-ACT-ASSERT comments
- Explanation of when to use this pattern
- Key patterns and gotchas
- Cross-references to related files

### Success Criteria

- [ ] All 5 test types documented with complete examples
- [ ] Each example uses actual code patterns from `tests/` directory
- [ ] Examples include proper imports and setup
- [ ] Explanations cover "why" not just "how"
- [ ] "See Also" section links to TESTING.md and related docs

## All Needed Context

### Context Completeness Check

Before implementing, validate: "If someone knew nothing about this codebase, would they have everything needed to write TEST_EXAMPLES.md successfully?"

**Yes** - This PRP provides:

- Exact file paths for existing test examples to analyze
- Complete code patterns from the codebase
- Documentation structure to follow
- All import statements and mocking patterns
- Links to external resources

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitest.dev/guide/mocking.html
  why: Official Vitest mocking documentation - vi.mock, vi.fn, vi.stubEnv patterns
  critical: Always mock at top level before imports; use vi.importActual to preserve exports

- url: https://vitest.dev/guide/organizing-tests.html
  why: Test file organization and structure conventions
  critical: Mirror source structure in test directory; use describe/it nesting

- file: docs/TESTING.md
  why: Existing testing strategy documentation - source of truth for testing philosophy
  pattern: Documentation structure with status, version, table of contents
  gotcha: TEST_EXAMPLES.md should complement, not duplicate, TESTING.md

- file: docs/CLI_REFERENCE.md
  why: Example of documentation structure and formatting
  pattern: Header with status/version/date, table of contents with anchors, code blocks with language tags

- file: tests/unit/core/session-manager.test.ts
  why: Real unit test example showing mocking patterns and AAA structure
  pattern: vi.clearAllMocks() in beforeEach, vi.unstubAllEnvs() in afterEach, descriptive test names

- file: tests/integration/agents.test.ts
  why: Shows critical Groundswell mocking pattern with vi.importActual()
  pattern: Top-level vi.mock() before imports, preserving MCPHandler exports
  gotcha: MUST use vi.importActual() to preserve MCPHandler/MCPServer for MCP tools

- file: tests/e2e/full-pipeline.test.ts
  why: E2E test example showing complete workflow validation
  pattern: Multi-level validation (result structure, file system, content, behavior)
  gotcha: Uses real timers for async operations, not fake timers

- file: tests/fixtures/simple-prd.ts
  why: Test fixture pattern for reusable test data
  pattern: Factory functions returning objects with overrides parameter

- file: tests/setup.ts
  why: Global test configuration showing API endpoint enforcement
  pattern: vi.clearAllMocks() global, vi.unstubAllEnvs() global, z.ai endpoint validation
  critical: Tests MUST use z.ai endpoint, never Anthropic official API

- file: vitest.config.ts
  why: Coverage configuration (100% requirement), test file patterns
  pattern: coverage.provider: 'v8', thresholds.global: all 100%

- file: src/agents/agent-factory.ts
  why: Understanding what's being tested in agent tests
  pattern: createBaseConfig, createArchitectAgent, MCP_TOOLS array

- file: docs/research/llm-agent-testing-best-practices.md
  why: LLM-specific testing patterns documented in plan
  section: Complete reference for testing AI/agent systems
```

### Current Codebase Tree

```bash
.
├── docs/
│   ├── TESTING.md                          # Testing strategy (source of truth)
│   ├── CLI_REFERENCE.md                    # Documentation format example
│   ├── ARCHITECTURE.md                     # System architecture
│   ├── CUSTOM_AGENTS.md                    # Agent development guide
│   ├── CUSTOM_TOOLS.md                     # MCP tool development
│   └── CUSTOM_WORKFLOWS.md                 # Workflow development
├── tests/
│   ├── setup.ts                            # Global test configuration
│   ├── unit/                               # Unit tests (80 files)
│   │   ├── agents/
│   │   │   ├── agent-factory.test.ts       # Agent creation tests
│   │   │   └── prompts/
│   │   │       └── prp-blueprint-prompt.test.ts
│   │   ├── core/
│   │   │   ├── session-manager.test.ts     # Session management unit tests
│   │   │   ├── task-orchestrator.test.ts   # Task orchestration tests
│   │   │   └── models.test.ts              # Data model tests
│   │   ├── tools/
│   │   │   ├── bash-mcp.test.ts            # Bash MCP tool tests
│   │   │   ├── filesystem-mcp.test.ts      # File system MCP tests
│   │   │   └── git-mcp.test.ts             # Git MCP tests
│   │   └── utils/
│   │       └── string-utils.test.ts        # Example utility tests
│   ├── integration/                        # Integration tests (42 files)
│   │   ├── agents.test.ts                  # Groundswell agent integration
│   │   ├── architect-agent.test.ts         # Architect agent tests
│   │   └── prp-pipeline-integration.test.ts
│   ├── e2e/                                # End-to-end tests (2 files)
│   │   ├── full-pipeline.test.ts           # Complete pipeline workflow
│   │   └── delta-session.test.ts           # Delta session E2E
│   ├── fixtures/                           # Test data fixtures
│   │   ├── simple-prd.ts                   # Minimal PRD for testing
│   │   ├── mock-delta-data.ts              # Delta operation mock data
│   │   └── prp-samples.ts                  # Sample PRP documents
│   └── validation/
│       └── zai-api-test.ts                 # API endpoint validation
├── src/
│   ├── agents/
│   │   ├── agent-factory.ts                # Agent creation functions
│   │   └── prompts/                        # Prompt definitions
│   ├── core/
│   │   ├── session-manager.ts              # Session management
│   │   └── task-orchestrator.ts            # Task orchestration
│   └── tools/                              # MCP tool implementations
└── vitest.config.ts                        # Test configuration
```

### Desired Codebase Tree

```bash
.
├── docs/
│   ├── TESTING.md                          # Existing: Testing strategy
│   └── TEST_EXAMPLES.md                    # NEW: Test examples documentation
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Groundswell mocking MUST preserve MCPHandler and MCPServer exports
// If you completely mock groundswell, MCP tool registration will fail
// Pattern: vi.mock('groundswell', async () => {
//   const actual = await vi.importActual('groundswell');
//   return { ...actual, createAgent: vi.fn(), createPrompt: vi.fn() };
// });

// CRITICAL: Tests MUST use z.ai endpoint (https://api.z.ai/api/anthropic)
// Never use Anthropic's official API in tests
// Enforced globally in tests/setup.ts

// CRITICAL: vi.mock() calls must be at TOP LEVEL before imports
// This is a hoisting requirement - cannot be done inside describe blocks

// CRITICAL: Always clean up mocks between tests
// Use beforeEach(() => { vi.clearAllMocks(); })
// Use afterEach(() => { vi.unstubAllEnvs(); })

// CRITICAL: 100% coverage requirement enforced in vitest.config.ts
// All metrics (statements, branches, functions, lines) must be 100%

// PATTERN: AAA (Arrange-Act-Assert) structure for all tests
// Arrange: Set up test data and mocks
// Act: Execute the function under test
// Assert: Verify results

// PATTERN: Descriptive test names using "should" format
// Example: "should create session with correct hash"

// PATTERN: Test file structure mirrors source structure
// src/core/session-manager.ts → tests/unit/core/session-manager.test.ts

// GOTCHA: Async tests need proper timeout handling for E2E
// Use vi.useRealTimers() for tests with actual async operations

// GOTCHA: Parameterized tests use it.each(), not describe.each
// it.each(['architect', 'researcher', 'coder', 'qa'])('%s persona', (persona) => { ... })

// PATTERN: Fixture functions for reusable test data
// createMockUser(overrides = {}) returns { ...defaults, ...overrides }
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is documentation only. The output is a markdown file with code examples.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE existing test files for concrete examples
  - READ: tests/unit/core/session-manager.test.ts for unit test patterns
  - READ: tests/integration/agents.test.ts for Groundswell mocking pattern
  - READ: tests/e2e/full-pipeline.test.ts for E2E test structure
  - READ: docs/TESTING.md to understand what's already documented
  - EXTRACT: Code snippets showing each pattern with imports
  - IDENTIFY: Gaps that need to be filled with new examples

Task 2: CREATE documentation file following project conventions
  - CREATE: docs/TEST_EXAMPLES.md
  - FOLLOW pattern: docs/CLI_REFERENCE.md structure (header, status, version, TOC)
  - ADD: Status metadata line (**Status**: Published)
  - ADD: Version and date
  - ADD: Table of contents with anchor links

Task 3: WRITE section 1 - Unit Test for Utility Function
  - IMPLEMENT: Example showing pure function testing
  - INCLUDE: Multiple test cases (happy path, edge cases, errors)
  - INCLUDE: it.each() parameterized test example
  - PATTERN: tests/unit/utils/string-utils.test.ts (if exists) or create hypothetical example
  - EXPLAIN: When to use unit tests (pure functions, no dependencies)

Task 4: WRITE section 2 - Unit Test for Class with Mocked Dependencies
  - IMPLEMENT: Example showing dependency injection pattern
  - INCLUDE: Mock setup in beforeEach
  - INCLUDE: Mock verification with toHaveBeenCalledWith
  - PATTERN: tests/unit/core/session-manager.test.ts structure
  - EXPLAIN: Mock lifecycle (setup → execute → verify → cleanup)

Task 5: WRITE section 3 - Integration Test for Agent with Mocked LLM
  - IMPLEMENT: Groundswell mocking pattern (CRITICAL)
  - INCLUDE: vi.mock() with vi.importActual() to preserve exports
  - INCLUDE: Agent configuration verification
  - PATTERN: tests/integration/agents.test.ts exact pattern
  - WARN: Must preserve MCPHandler/MCPServer exports
  - EXPLAIN: Why partial mocking is necessary for Groundswell

Task 6: WRITE section 4 - Integration Test for Workflow with Mocked Components
  - IMPLEMENT: Multiple mocked dependencies example
  - INCLUDE: Component interaction testing
  - INCLUDE: Error propagation across components
  - PATTERN: tests/integration/prp-pipeline-integration.test.ts structure
  - EXPLAIN: Integration vs unit testing (real components, external deps mocked)

Task 7: WRITE section 5 - E2E Test for Full Pipeline
  - IMPLEMENT: Complete workflow validation example
  - INCLUDE: Multi-level assertions (structure, filesystem, content, behavior)
  - INCLUDE: Async/await patterns with real timers
  - PATTERN: tests/e2e/full-pipeline.test.ts structure
  - EXPLAIN: E2E testing philosophy (real implementations, minimal mocking)

Task 8: WRITE supporting sections
  - ADD: "Mocking Patterns" quick reference section
  - ADD: "Test File Organization" section showing directory structure
  - ADD: "Common Test Scenarios" with patterns (parameterization, error handling, async)
  - ADD: "See Also" section with cross-references

Task 9: VALIDATE against success criteria
  - CHECK: All 5 test types present
  - CHECK: Each example has complete executable code
  - CHECK: ARRANGE-ACT-ASSERT comments present
  - CHECK: Uses actual codebase patterns
  - CHECK: Cross-references to TESTING.md and related docs
```

### Implementation Patterns & Key Details

````typescript
// DOCUMENTATION STRUCTURE PATTERN
// Follow docs/CLI_REFERENCE.md format exactly:

# Test Examples

> Brief description of document purpose

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

## Table of Contents

- [Overview](#overview)
- [Unit Test Examples](#unit-test-examples)
  - [Utility Function Tests](#utility-function-tests)
  - [Class with Mocked Dependencies](#class-with-mocked-dependencies)
- [Integration Test Examples](#integration-test-examples)
  - [Agent with Mocked LLM](#agent-with-mocked-llm)
  - [Workflow with Mocked Components](#workflow-with-mocked-components)
- [E2E Test Examples](#e2e-test-examples)
- [Mocking Patterns Reference](#mocking-patterns-reference)
- [See Also](#see-also)

---

// CRITICAL: Code example formatting
// Use language tags: ```typescript for TypeScript code
// Include line comments for ARRANGE-ACT-ASSERT
// Add explanation paragraphs before and after code blocks

// SECTION TEMPLATE:
### Test Type Name

Brief description of when to use this test type and what it validates.

**When to use**: [Specific scenarios]

**Key patterns**: [Bullet list of important patterns]

```typescript
// Complete, executable code example
// With clear comments
````

**Explanation**: [What the example demonstrates]

// CROSS-REFERENCE PATTERN:
See [TESTING.md](./TESTING.md) for testing philosophy and [Mocking Strategies](./TESTING.md#mocking-strategies) for detailed mocking patterns.

````

### Integration Points

```yaml
DOCUMENTATION:
  - add to: docs/
  - file: TEST_EXAMPLES.md
  - pattern: Follow CLI_REFERENCE.md structure (header with status/version, TOC)

CROSS_REFERENCES:
  - link: TESTING.md (main testing strategy)
  - link: ARCHITECTURE.md (system architecture context)
  - link: CUSTOM_AGENTS.md (agent development patterns)
  - link: tests/ directory (actual test files)
````

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# No syntax validation needed for markdown documentation
# But verify the file exists and is readable

# Check file creation
ls -la docs/TEST_EXAMPLES.md

# Verify markdown syntax (optional - if project has markdown linter)
npx markdownlint docs/TEST_EXAMPLES.md

# Expected: File exists at docs/TEST_EXAMPLES.md
```

### Level 2: Content Validation (Documentation Review)

````bash
# Verify all required sections exist
grep -E "^(##|###)" docs/TEST_EXAMPLES.md

# Should include:
# - ## Overview
# - ### Unit Test Examples
# - ### Utility Function Tests
# - ### Class with Mocked Dependencies
# - ### Integration Test Examples
# - ### Agent with Mocked LLM
# - ### E2E Test Examples
# - ## Mocking Patterns Reference
# - ## See Also

# Verify code blocks are present and tagged
grep -c '```typescript' docs/TEST_EXAMPLES.md

# Should have at least 5 code blocks (one per test type)

# Verify cross-references are present
grep -c '\[.*\](.*\.md)' docs/TEST_EXAMPLES.md

# Expected: All sections present, code blocks properly tagged
````

### Level 3: Completeness Check (Requirements Validation)

```bash
# Check for all 5 test types
grep -q "Utility Function Tests" docs/TEST_EXAMPLES.md
grep -q "Class with Mocked Dependencies" docs/TEST_EXAMPLES.md
grep -q "Agent with Mocked LLM" docs/TEST_EXAMPLES.md
grep -q "Workflow with Mocked Components" docs/TEST_EXAMPLES.md
grep -q "E2E Test Examples" docs/TEST_EXAMPLES.md

# Check for AAA pattern comments
grep -c "ARRANGE\|ACT\|ASSERT" docs/TEST_EXAMPLES.md

# Check for cross-references
grep -q "TESTING.md" docs/TEST_EXAMPLES.md

# Check for metadata header
grep -q "Status.*Published" docs/TEST_EXAMPLES.md
grep -q "Last Updated" docs/TEST_EXAMPLES.md
grep -q "Version" docs/TEST_EXAMPLES.md

# Expected: All 5 test types documented, AAA comments present, cross-references included
```

### Level 4: Manual Review (Quality Validation)

```bash
# Open file for manual review
cat docs/TEST_EXAMPLES.md

# Manual validation checklist:
# [ ] Code examples are complete and executable
# [ ] Import statements are correct
# [ ] ARRANGE-ACT-ASSERT comments are clear
# [ ] Explanations are helpful
# [ ] Cross-references work
# [ ] Formatting matches other docs (CLI_REFERENCE.md)
# [ ] Table of contents links work
# [ ] Code examples use actual patterns from codebase

# Test a few code examples by copying them to test files
# (Optional) Verify examples actually work

# Expected: Professional, comprehensive documentation following project conventions
```

## Final Validation Checklist

### Technical Validation

- [ ] File `docs/TEST_EXAMPLES.md` exists
- [ ] All required sections present (5 test types)
- [ ] Code examples have proper syntax highlighting (```typescript)
- [ ] Cross-references are valid markdown links
- [ ] Table of contents is complete

### Content Validation

- [ ] Unit test for utility function documented
- [ ] Unit test for class with mocked dependencies documented
- [ ] Integration test for agent with mocked LLM documented
- [ ] Integration test for workflow with mocked components documented
- [ ] E2E test for full pipeline documented
- [ ] Each example includes ARRANGE-ACT-ASSERT comments
- [ ] Explanations clarify when to use each pattern

### Quality Validation

- [ ] Follows documentation structure from CLI_REFERENCE.md
- [ ] Uses actual patterns from existing test files
- [ ] Groundswell mocking pattern is correctly documented
- [ ] API endpoint enforcement warning is included
- [ ] Cross-references to TESTING.md and related docs
- [ ] Professional tone and clear explanations

### Documentation & Deployment

- [ ] Header includes status, version, and date
- [ ] Table of contents with anchor links
- [ ] "See Also" section with related documentation
- [ ] Code examples are executable as-is

---

## Anti-Patterns to Avoid

- ❌ Don't duplicate content from TESTING.md - complement it with examples
- ❌ Don't use hypothetical examples - use actual patterns from the codebase
- ❌ Don't omit import statements - include complete code
- ❌ Don't forget the Groundswell mocking pattern - it's critical
- ❌ Don't use inconsistent formatting - follow CLI_REFERENCE.md structure
- ❌ Don't skip ARRANGE-ACT-ASSERT comments - they make examples clearer
- ❌ Don't create examples that don't compile - verify code snippets
- ❌ Don't omit cross-references - link to TESTING.md and related docs
