# Product Requirement Prompt (PRP): Create Minimal Test PRD

**Work Item**: P4.M4.T3.S1 - Create minimal test PRD
**Status**: Research Complete -> Ready for Implementation

---

## Goal

**Feature Goal**: Create a minimal PRD fixture file at `tests/fixtures/simple-prd.md` that enables fast end-to-end pipeline testing with completion time under 5 minutes. The PRD must follow the exact structure from `system_context.md` but with minimal scope (single phase, single milestone, single task, 2-3 simple subtasks).

**Deliverable**: Minimal PRD markdown file `tests/fixtures/simple-prd.md` with:

- Project title: "Test Project"
- Single Phase: "P1: Test Phase"
- Single Milestone: "P1.M1: Test Milestone"
- Single Task: "P1.M1.T1: Create Hello World"
- 2-3 simple subtasks with basic implementations (write function, write test, run test)
- Minimal context_scope in each subtask
- Expected completion time: <5 minutes when processed by PRPPipeline

**Success Definition**:

- PRD file exists at `tests/fixtures/simple-prd.md`
- PRD follows exact structure format from `plan/001_14b9dc2a33c7/architecture/system_context.md`
- PRD is parsable by ArchitectAgent and generates valid backlog JSON
- PRD contains exactly 1 Phase, 1 Milestone, 1 Task, 2-3 Subtasks
- When processed by PRPPipeline, completes in under 5 minutes
- PRD is simple enough for fast E2E testing but complex enough to validate pipeline functionality

## User Persona (if applicable)

**Target User**: PRPPipeline E2E test validation system (automated QA)

**Use Case**: The minimal test PRD enables:

1. Fast validation of PRPPipeline initialization and backlog generation
2. Quick testing of task iteration from start to finish
3. Rapid validation of session management and state persistence
4. Speed testing of the full pipeline workflow without real complexity

**User Journey**:

1. E2E test reads `tests/fixtures/simple-prd.md`
2. PRPPipeline processes the PRD (hash check → architect agent → backlog generation)
3. Pipeline iterates through minimal hierarchy (Phase → Milestone → Task → Subtask)
4. Each subtask executes with minimal implementation (simple function, basic test)
5. All validation levels pass (syntax, unit, integration)
6. Session state persisted correctly
7. Test validates complete pipeline in <5 minutes

**Pain Points Addressed**:

- **No Fast E2E Test**: Existing PRDs are too complex for quick validation (<5 min)
- **Testing Bottleneck**: Full PRD processing takes too long for rapid iteration
- **CI/CD Speed**: Need fast feedback for pipeline changes
- **Simple Validation**: Need minimal but realistic PRD to test all pipeline components

## Why

- **Fast Feedback Loop**: E2E tests must complete quickly for effective development
- **Pipeline Validation**: Need to test entire pipeline workflow without complex requirements
- **CI/CD Integration**: Quick tests enable continuous integration without long waits
- **Minimal Viable PRD**: Smallest valid PRD that exercises all pipeline components
- **Test Isolation**: Simple PRD reduces external dependencies and failure points
- **Speed Optimization**: 5-minute target enables rapid iteration during development
- **Builds on Previous Work**: P4.M4.T2.S2 (MCP tools integration tests) provides test patterns to follow

## What

### Input

- PRD structure specification:
  - `plan/001_14b9dc2a33c7/architecture/system_context.md` (Task Hierarchy JSON Schema section)
  - `plan/001_14b9dc2a33c7/prd_snapshot.md` (Complete PRD example)
- Existing test fixture patterns:
  - `tests/fixtures/mock-delta-data.ts` (TypeScript fixture pattern with JSDoc comments)
  - Export pattern: `export const mockName = content;`
- Architect agent backlog schema:
  - `src/prompts/task-breakdown.ts` (Backlog Zod schema)
  - Four-level hierarchy: Phase > Milestone > Task > Subtask
- Test directory structure:
  - `tests/fixtures/` for fixture files
  - TypeScript files with `.ts` extension
  - Exported constants for easy import

### State Changes

- **Create** `tests/fixtures/simple-prd.md` with minimal valid PRD content
- **Export** PRD content as TypeScript constant for easy test import
- **Follow** exact PRD structure from system_context.md (hierarchical markdown)
- **Include** all required fields: type, id, title, status, description, (milestones/tasks/subtasks arrays)
- **Add** JSDoc comments documenting purpose and usage

### Output

- Fixture file: `tests/fixtures/simple-prd.ts`
- Exported constant: `export const mockSimplePRD: string;`
- PRD content: Valid markdown with complete hierarchy
- Usage: Can be imported and used in E2E tests as `import { mockSimplePRD } from '../fixtures/simple-prd';`

### Success Criteria

- [ ] PRD file created at `tests/fixtures/simple-prd.ts`
- [ ] PRD content follows exact structure from system_context.md
- [ ] PRD has exactly 1 Phase (P1: Test Phase)
- [ ] Phase has exactly 1 Milestone (P1.M1: Test Milestone)
- [ ] Milestone has exactly 1 Task (P1.M1.T1: Create Hello World)
- [ ] Task has 2-3 Subtasks (Write function, Write test, Run test)
- [ ] All subtasks have minimal context_scope
- [ ] PRD is exported as TypeScript constant
- [ ] JSDoc comments explain purpose and usage
- [ ] PRD is parsable by ArchitectAgent (generates valid backlog JSON)
- [ ] Expected completion time <5 minutes

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to create the minimal test PRD fixture successfully?

**Answer**: **YES** - This PRP provides:

- Complete PRD structure specification from system_context.md
- Full task hierarchy JSON schema reference
- Existing fixture patterns to follow (mock-delta-data.ts)
- Exact content requirements and structure
- Known gotchas and anti-patterns to avoid
- Validation commands to verify correctness

### Documentation & References

```yaml
# MUST READ - PRD Structure Definition
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Complete PRD structure specification, Task Hierarchy JSON Schema
  section: Task Hierarchy (JSON Schema) - lines 115-155
  critical: Four-level hierarchy format, required fields for each level
  pattern: Phase > Milestone > Task > Subtask with type, id, title, status, description

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/prd_snapshot.md
  why: Complete real-world PRD example to follow for structure
  section: Overall structure and formatting
  pattern: Markdown headings with ## for task titles, descriptive content
  critical: Shows how phases, milestones, tasks, subtasks are formatted

# MUST READ - Existing Fixture Pattern
- file: /home/dustin/projects/hacky-hack/tests/fixtures/mock-delta-data.ts
  why: TypeScript fixture file pattern, export structure, JSDoc documentation
  pattern: Exported string constants with JSDoc comments explaining purpose
  critical: Lines 1-27 (file structure, JSDoc pattern, export format)
  gotcha: Use template literals (backticks) for multi-line markdown content

# MUST READ - Backlog Schema
- file: /home/dustin/projects/hacky-hack/src/core/task-hierarchy.ts
  why: TypeScript interfaces for task hierarchy, validates PRD structure
  pattern: Phase, Milestone, Task, Subtask interfaces
  critical: All required fields (type, id, title, status, description)
  gotcha: Subtask has additional fields: story_points, dependencies, context_scope

# MUST READ - Architect Agent
- file: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
  why: createArchitectAgent function, prompt structure
  pattern: Groundswell agent creation, Zod schema for structured output
  critical: Lines 1-100 (agent factory patterns)
  gotcha: Architect agent expects PRD markdown and returns structured backlog JSON

# REFERENCE - Test Directory Structure
- path: /home/dustin/projects/hacky-hack/tests/fixtures/
  why: Location where fixture files should be placed
  pattern: TypeScript files with .ts extension, exported constants

# REFERENCE - Import Pattern
- file: /home/dustin/projects/hacky-hack/tests/integration/architect-agent.test.ts
  why: Shows how fixtures are imported and used in tests
  pattern: `import { mockData } from '../fixtures/mock-data';`
  critical: Relative imports from test directories to fixtures

# RESEARCH - Context Scope Format
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Context scope format requirements for subtasks
  section: Critical Constraints > Context Scope - lines 209-216
  pattern: CONTRACT DEFINITION with RESEARCH NOTE, INPUT, LOGIC, OUTPUT
  gotcha: Every subtask must have context_scope field

# RESEARCH - Status Values
- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Valid status values for task hierarchy
  section: Status Values - must use exact values: Planned, Researching, Implementing, Complete, Failed
  gotcha: Status values are case-sensitive
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                             # Test scripts and dependencies
├── vitest.config.ts                         # Test runner configuration
├── src/
│   ├── core/
│   │   ├── task-hierarchy.ts                # Phase, Milestone, Task, Subtask interfaces
│   │   └── session-manager.ts               # Session state management
│   ├── agents/
│   │   └── agent-factory.ts                 # createArchitectAgent, createCoderAgent, etc.
│   └── prompts/
│       └── task-breakdown.ts                # Architect prompt with Zod schema
├── tests/
│   ├── fixtures/
│   │   └── mock-delta-data.ts               # Existing fixture pattern (EXPORTED STRING CONSTANTS)
│   ├── integration/
│   │   ├── architect-agent.test.ts          # Shows how to import and use fixtures
│   │   └── tools.test.ts                    # P4M4T2S2 output (integration test pattern)
│   └── unit/
│       └── ...
└── plan/
    └── 001_14b9dc2a33c7/
        ├── architecture/
        │   └── system_context.md            # PRD structure specification
        ├── prd_snapshot.md                  # Complete PRD example
        └── P4M4T2S2/
            └── PRP.md                        # Previous PRP (MCP tools integration tests)
```

### Desired Codebase Tree (files to add)

```bash
tests/
└── fixtures/
    └── simple-prd.ts                        # CREATE: Minimal test PRD fixture
        # Export: export const mockSimplePRD: string
        # Content: Minimal valid PRD markdown
        # JSDoc: Documentation explaining purpose and usage
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Use TypeScript Template Literals
// PRD content is multi-line markdown, use backticks not single quotes
// Pattern: export const mockSimplePRD = `# Phase 1\n...`;
// Gotcha: Single quotes won't work for multi-line content

// CRITICAL: Export as String Constant
// Fixtures are imported as exported constants, not default exports
// Pattern: export const mockSimplePRD: string = `content`;
// Gotcha: Don't use default export, breaks import pattern

// CRITICAL: JSDoc Documentation
// All fixtures need JSDoc comments explaining purpose and usage
// Pattern: /**
//          * Mock minimal PRD for fast E2E testing
//          *
//          * @remarks
//          * Minimal valid PRD that completes in <5 minutes.
//          * Used for rapid pipeline validation.
//          */
// Gotcha: JSDoc should come before export statement

// CRITICAL: PRD Hierarchy Format
// Must follow exact markdown structure: ## Phase > ### Milestone > #### Task
// Pattern from system_context.md lines 115-155
// Gotcha: Don't invent new structure, follow existing PRD format exactly

// CRITICAL: Context Scope Format
// Every subtask must have context_scope with CONTRACT DEFINITION
// Pattern: CONTRACT DEFINITION:\n1. RESEARCH NOTE: ...\n2. INPUT: ...\n3. LOGIC: ...\n4. OUTPUT: ...
// Gotcha: Context scope is required field for subtasks only

// CRITICAL: ID Format Convention
// Phase: P1, P2 (P + number)
// Milestone: P1.M1, P1.M2 (Phase + .M + number)
// Task: P1.M1.T1, P1.M1.T2 (Milestone + .T + number)
// Subtask: P1.M1.T1.S1, P1.M1.T1.S2 (Task + .S + number)
// Gotcha: Always use double dots between levels

// CRITICAL: Status Values
// Must use exact values: Planned, Researching, Implementing, Complete, Failed
// Case-sensitive, must match enum in task-hierarchy.ts
// Gotcha: "planned" != "Planned", exact case required

// CRITICAL: Minimal Scope for Fast Testing
// Keep implementations simple: write function, write test, run test
// Avoid: complex logic, external dependencies, long operations
// Goal: Complete in <5 minutes when processed by pipeline
// Gotcha: Don't make subtasks too complex or test will be slow

// CRITICAL: Subtask Context Scope Minimization
// context_scope should be minimal but valid
// Pattern: CONTRACT DEFINITION:\n1. RESEARCH NOTE: Simple function\n2. INPUT: None\n3. LOGIC: Write function\n4. OUTPUT: function file
// Gotcha: Don't leave context_scope empty or undefined

// CRITICAL: Import Path Pattern
// Tests import fixtures using relative paths
// Pattern: import { mockSimplePRD } from '../fixtures/simple-prd';
// Gotcha: Path is relative to test file location, not project root

// CRITICAL: Architect Agent Compatibility
// PRD must be parsable by ArchitectAgent and generate valid backlog JSON
// The PRP (PRD) content will be passed to architect agent as markdown
// Gotcha: PRD structure must match what architect agent expects
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing types:

````typescript
/**
 * Minimal test PRD fixture for fast E2E pipeline testing
 *
 * @remarks
 * Provides a minimal but valid PRD that can be processed by the PRPPipeline
 * in under 5 minutes. Used for rapid validation of pipeline functionality
 * without the complexity of the full project PRD.
 *
 * **Structure**:
 * - Single Phase: P1 (Test Phase)
 * - Single Milestone: P1.M1 (Test Milestone)
 * - Single Task: P1.M1.T1 (Create Hello World)
 * - 2-3 Subtasks: Write function, Write test, Run test
 *
 * **Usage**:
 * ```typescript
 * import { mockSimplePRD } from '../fixtures/simple-prd';
 *
 * const pipeline = new PRPPipeline(mockSimplePRD);
 * const result = await pipeline.run();
 * ```
 */
export const mockSimplePRD = `
# Test Project

A minimal project for fast E2E pipeline testing.

## P1: Test Phase

Validate pipeline functionality with minimal complexity.

### P1.M1: Test Milestone

Create a simple hello world implementation.

#### P1.M1.T1: Create Hello World

Implement a basic hello world function with tests.

##### P1.M1.T1.S1: Write Hello World Function

Create a simple hello world function.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Simple function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!"
4. OUTPUT: src/hello.ts with exported hello function

##### P1.M1.T1.S2: Write Test for Hello World

Create a test for the hello world function.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S1"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic unit test
2. INPUT: hello function from P1.M1.T1.S1
3. LOGIC: Create tests/hello.test.ts that tests hello() returns "Hello, World!"
4. OUTPUT: tests/hello.test.ts with passing test

##### P1.M1.T1.S3: Run Test

Validate the implementation works.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S2"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Test execution validation
2. INPUT: hello function and test from previous subtasks
3. LOGIC: Run npm test to verify test passes
4. OUTPUT: Passing test result
`;
````

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/fixtures/simple-prd.ts
  - IMPLEMENT: TypeScript fixture file with minimal PRD content
  - FOLLOW pattern: tests/fixtures/mock-delta-data.ts (export structure, JSDoc)
  - NAMING: simple-prd.ts (matches fixture name)
  - PLACEMENT: tests/fixtures/ directory
  - EXPORT: export const mockSimplePRD: string

Task 2: WRITE PRD content with correct hierarchy
  - IMPLEMENT: Multi-line markdown string with PRD content
  - FOLLOW structure: plan/001_14b9dc2a33c7/prd_snapshot.md (markdown format)
  - INCLUDE: Project title, single Phase, single Milestone, single Task, 2-3 Subtasks
  - FORMAT: ## for Phase, ### for Milestone, #### for Task, ##### for Subtask
  - GOTCHA: Use template literal (backticks) for multi-line content

Task 3: DEFINE Phase P1 (Test Phase)
  - IMPLEMENT: Single phase with minimal description
  - INCLUDE: id: "P1", title: "Test Phase", status: "Planned"
  - DESCRIPTION: "Validate pipeline functionality with minimal complexity"
  - GOTCHA: Phase level has no story_points or dependencies

Task 4: DEFINE Milestone P1.M1 (Test Milestone)
  - IMPLEMENT: Single milestone under P1
  - INCLUDE: id: "P1.M1", title: "Test Milestone", status: "Planned"
  - DESCRIPTION: "Create a simple hello world implementation"
  - GOTCHA: Milestone level has no story_points or dependencies

Task 5: DEFINE Task P1.M1.T1 (Create Hello World)
  - IMPLEMENT: Single task under P1.M1
  - INCLUDE: id: "P1.M1.T1", title: "Create Hello World", status: "Planned"
  - DESCRIPTION: "Implement a basic hello world function with tests"
  - GOTCHA: Task level has no story_points or dependencies

Task 6: DEFINE Subtask P1.M1.T1.S1 (Write Hello World Function)
  - IMPLEMENT: First subtask with minimal implementation
  - INCLUDE: id: "P1.M1.T1.S1", title: "Write Hello World Function", status: "Planned"
  - story_points: 1, dependencies: []
  - context_scope: CONTRACT DEFINITION with 4 sections
  - LOGIC: "Create src/hello.ts with function hello() that returns 'Hello, World!'"
  - OUTPUT: "src/hello.ts with exported hello function"

Task 7: DEFINE Subtask P1.M1.T1.S2 (Write Test for Hello World)
  - IMPLEMENT: Second subtask for testing
  - INCLUDE: id: "P1.M1.T1.S2", title: "Write Test for Hello World", status: "Planned"
  - story_points: 1, dependencies: ["P1.M1.T1.S1"]
  - context_scope: CONTRACT DEFINITION referencing hello function
  - LOGIC: "Create tests/hello.test.ts that tests hello() returns 'Hello, World!'"
  - OUTPUT: "tests/hello.test.ts with passing test"

Task 8: DEFINE Subtask P1.M1.T1.S3 (Run Test) - OPTIONAL
  - IMPLEMENT: Third subtask for validation
  - INCLUDE: id: "P1.M1.T1.S3", title: "Run Test", status: "Planned"
  - story_points: 1, dependencies: ["P1.M1.T1.S2"]
  - context_scope: CONTRACT DEFINITION for test execution
  - LOGIC: "Run npm test to verify test passes"
  - OUTPUT: "Passing test result"
  - GOTCHA: This subtask ensures full pipeline validation

Task 9: ADD JSDoc documentation
  - IMPLEMENT: Comprehensive JSDoc comment above export
  - FOLLOW pattern: tests/fixtures/mock-delta-data.ts (JSDoc structure)
  - INCLUDE: Purpose, remarks (structure, usage), @remarks tag
  - PLACEMENT: Immediately before export statement

Task 10: VERIFY Architect Agent Compatibility
  - TEST: PRD can be parsed by ArchitectAgent
  - EXECUTE: Import and pass to createArchitectAgent
  - VERIFY: Generates valid backlog JSON with correct structure
  - COMMAND: Write quick validation test if needed

Task 11: VALIDATE fixture export
  - EXECUTE: npx tsc --noEmit tests/fixtures/simple-prd.ts
  - VERIFY: No type errors
  - EXECUTE: Import in test file: import { mockSimplePRD } from '../fixtures/simple-prd'
  - VERIFY: Import works correctly

Task 12: DOCUMENT usage in PRP
  - UPDATE: This PRP's "What" section with actual file path
  - REFERENCE: Future E2E tests can import this fixture
  - STORE: Research findings in research/ directory
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// FIXTURE FILE STRUCTURE
// =============================================================================

/**
 * Mock minimal PRD for fast E2E testing
 *
 * @remarks
 * Minimal valid PRD that completes in <5 minutes when processed by PRPPipeline.
 * Used for rapid validation of pipeline functionality without complex requirements.
 *
 * **Structure**:
 * - 1 Phase: P1 (Test Phase)
 * - 1 Milestone: P1.M1 (Test Milestone)
 * - 1 Task: P1.M1.T1 (Create Hello World)
 * - 2-3 Subtasks: Write function, Write test, Run test
 *
 * **Usage**:
 * ```typescript
 * import { mockSimplePRD } from '../fixtures/simple-prd';
 *
 * const pipeline = new PRPPipeline(mockSimplePRD);
 * await pipeline.run();
 * ```
 */
export const mockSimplePRD = `
# Test Project

A minimal project for fast E2E pipeline testing.

## P1: Test Phase

Validate pipeline functionality with minimal complexity.

### P1.M1: Test Milestone

Create a simple hello world implementation.

#### P1.M1.T1: Create Hello World

Implement a basic hello world function with tests.

##### P1.M1.T1.S1: Write Hello World Function

Create a simple hello world function.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Simple function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!"
4. OUTPUT: src/hello.ts with exported hello function

##### P1.M1.T1.S2: Write Test for Hello World

Create a test for the hello world function.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S1"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic unit test
2. INPUT: hello function from P1.M1.T1.S1
3. LOGIC: Create tests/hello.test.ts that tests hello() returns "Hello, World!"
4. OUTPUT: tests/hello.test.ts with passing test

##### P1.M1.T1.S3: Run Test

Validate the implementation works.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S2"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Test execution validation
2. INPUT: hello function and test from previous subtasks
3. LOGIC: Run npm test to verify test passes
4. OUTPUT: Passing test result
`;

// =============================================================================
// KEY IMPLEMENTATION DETAILS
// =============================================================================

// 1. MARKDOWN HEADING HIERARCHY
// # = Project title (level 1)
// ## = Phase (level 2)
// ### = Milestone (level 3)
// #### = Task (level 4)
// ##### = Subtask (level 5)

// 2. SUBTASK FORMAT IN MARKDOWN
// Each subtask needs:
// - Title (##### heading)
// - Description (paragraph text)
// - **story_points**: number
// - **dependencies**: ["id1", "id2"] or []
// - **status**: Planned
// - **context_scope**: CONTRACT DEFINITION block

// 3. CONTEXT SCOPE FORMAT
// CONTRACT DEFINITION:
// 1. RESEARCH NOTE: [Research findings]
// 2. INPUT: [What this subtask receives]
// 3. LOGIC: [Step-by-step implementation]
// 4. OUTPUT: [What this subtask produces]

// 4. JSDOC PATTERN
// /**
//  * [One-line summary]
//  *
//  * @remarks
//  * [Detailed explanation]
//  *
//  * **Structure**:
//  * - [Bullet points]
//  *
//  * **Usage**:
//  * ```typescript
//  * [Code example]
//  * ```
//  */

// 5. TYPE ANNOTATION
// export const mockSimplePRD: string = `content`;
// TypeScript type annotation ensures type safety

// 6. TEMPLATE LITERAL
// Use backticks (\`) not single quotes (')
// Enables multi-line content without escape characters
````

### Integration Points

```yaml
FIXTURE_EXPORT:
  - file: tests/fixtures/simple-prd.ts
  - export: export const mockSimplePRD: string
  - import: import { mockSimplePRD } from '../fixtures/simple-prd'

FUTURE_E2E_TEST:
  - reference: P4.M4.T3.S2 (Create E2E pipeline test)
  - will use: This fixture as input to PRPPipeline
  - validates: Full pipeline workflow with minimal PRD

ARCHITECT_AGENT:
  - input: mockSimplePRD (markdown string)
  - output: Backlog JSON with valid task hierarchy
  - validates: PRD structure is correct

PRP_PIPELINE:
  - input: mockSimplePRD
  - process: Hash → Architect → Backlog → Execute
  - expected: Complete in <5 minutes
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check fixture file
npx tsc --noEmit tests/fixtures/simple-prd.ts

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding

# Check file can be imported
node -e "console.log('Import check passed')"
```

### Level 2: Architect Agent Compatibility (Component Validation)

```bash
# Create quick validation script
cat > /tmp/validate-prd.mjs << 'EOF'
import { mockSimplePRD } from './tests/fixtures/simple-prd.ts';

console.log('PRD length:', mockSimplePRD.length);
console.log('Contains Phase:', mockSimplePRD.includes('## P1:'));
console.log('Contains Milestone:', mockSimplePRD.includes('### P1.M1:'));
console.log('Contains Task:', mockSimplePRD.includes('#### P1.M1.T1:'));
console.log('Contains Subtask:', mockSimplePRD.includes('##### P1.M1.T1.S1:'));
console.log('Has context_scope:', mockSimplePRD.includes('CONTRACT DEFINITION:'));
console.log('Validation complete');
EOF

# Run validation
node /tmp/validate-prd.mjs

# Expected output:
// PRD length: <number>
// Contains Phase: true
// Contains Milestone: true
// Contains Task: true
// Contains Subtask: true
// Has context_scope: true
// Validation complete
```

### Level 3: Architect Agent Parsing (System Validation)

```bash
# Test that ArchitectAgent can parse the PRD
# (This requires the agent factory to be working)

# If architect agent tests exist:
npm run test:run -- tests/unit/agents/architect-agent.test.ts

# Expected: Architect agent should be able to parse this PRD
# and generate a valid backlog JSON structure

# Manual validation check:
# 1. PRD has correct heading hierarchy (## -> ### -> #### -> #####)
# 2. All IDs follow format: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1
# 3. All subtasks have context_scope with CONTRACT DEFINITION
# 4. Status values are valid (Planned, Researching, Implementing, Complete, Failed)
# 5. Dependencies reference valid subtask IDs
```

### Level 4: Import Pattern Validation (Usage Validation)

```bash
# Test import pattern from test directory
cat > /tmp/test-import.mjs << 'EOF'
// Simulate import from integration test directory
import { mockSimplePRD } from './tests/fixtures/simple-prd.ts';

console.log('✓ Import successful');
console.log('✓ Type:', typeof mockSimplePRD);
console.log('✓ Length:', mockSimplePRD.length, 'characters');
console.log('✓ Starts with #:', mockSimplePRD.trim().startsWith('#'));

// Validate structure
const lines = mockSimplePRD.split('\n');
const phaseCount = lines.filter(l => l.startsWith('## ')).length;
const milestoneCount = lines.filter(l => l.startsWith('### ')).length;
const taskCount = lines.filter(l => l.startsWith('#### ')).length;
const subtaskCount = lines.filter(l => l.startsWith('##### ')).length;

console.log('✓ Phases:', phaseCount, '(expected: 1)');
console.log('✓ Milestones:', milestoneCount, '(expected: 1)');
console.log('✓ Tasks:', taskCount, '(expected: 1)');
console.log('✓ Subtasks:', subtaskCount, '(expected: 2-3)');

if (phaseCount === 1 && milestoneCount === 1 && taskCount === 1 && subtaskCount >= 2 && subtaskCount <= 3) {
  console.log('\n✅ All validations passed!');
} else {
  console.log('\n❌ Validation failed');
  process.exit(1);
}
EOF

node /tmp/test-import.mjs

# Expected output:
// ✓ Import successful
// ✓ Type: string
// ✓ Length: XXXX characters
// ✓ Starts with #: true
// ✓ Phases: 1 (expected: 1)
// ✓ Milestones: 1 (expected: 1)
// ✓ Tasks: 1 (expected: 1)
// ✓ Subtasks: 3 (expected: 2-3)
//
// ✅ All validations passed!
```

---

## Final Validation Checklist

### Technical Validation

- [ ] File created at `tests/fixtures/simple-prd.ts`
- [ ] No type errors: `npx tsc --noEmit tests/fixtures/simple-prd.ts`
- [ ] File exports `mockSimplePRD` as string constant
- [ ] JSDoc documentation present and complete
- [ ] Template literal used for multi-line content

### Contract Requirements Validation

- [ ] PRD has exactly 1 Phase (P1: Test Phase) ✅
- [ ] Phase has exactly 1 Milestone (P1.M1: Test Milestone) ✅
- [ ] Milestone has exactly 1 Task (P1.M1.T1: Create Hello World) ✅
- [ ] Task has 2-3 Subtasks (Write function, Write test, Run test) ✅
- [ ] All IDs follow correct format (P1, P1.M1, P1.M1.T1, P1.M1.T1.S1) ✅
- [ ] All subtasks have context_scope with CONTRACT DEFINITION ✅
- [ ] All status values are valid (Planned) ✅
- [ ] Dependencies reference valid subtask IDs ✅

### Code Quality Validation

- [ ] Follows fixture pattern from `tests/fixtures/mock-delta-data.ts`
- [ ] JSDoc includes @remarks with structure and usage
- [ ] Markdown heading hierarchy is correct (# ## ### #### #####)
- [ ] PRD content is minimal but valid
- [ ] Expected completion time <5 minutes

### Documentation & Sign-Off

- [ ] Research stored in `plan/001_14b9dc2a33c7/P4M4T3S1/research/`
- [ ] Ready for P4.M4.T3.S2 (E2E pipeline test) to use this fixture
- [ ] PRP document complete

---

## Anti-Patterns to Avoid

- ❌ Don't create complex PRD with multiple phases/milestones (violates <5 min goal)
- ❌ Don't use single quotes for multi-line content (use template literals)
- ❌ Don't skip JSDoc documentation (fixtures need documentation)
- ❌ Don't use default export (breaks import pattern)
- ❌ Don't forget context_scope in subtasks (required field)
- ❌ Don't use wrong heading levels (## ### #### ##### must be correct)
- ❌ Don't invent new ID formats (follow P1, P1.M1, P1.M1.T1, P1.M1.T1.S1)
- ❌ Don't use wrong status values (must be exact: Planned, Researching, Implementing, Complete, Failed)
- ❌ Don't create subtasks that take >5 minutes total (violates fast testing goal)
- ❌ Don't forget dependencies array in subtasks (can be empty [])
- ❌ Don't use relative paths in context_scope (should be descriptive, not paths)

---

## Confidence Score

**10/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ PRD structure is well-documented in system_context.md
- ✅ Existing fixture pattern (mock-delta-data.ts) provides clear template
- ✅ Task is straightforward (create one file with known content)
- ✅ No external dependencies or complex logic
- ✅ All contract requirements are specific and measurable
- ✅ Validation commands are simple and direct
- ✅ No ambiguity about structure or format
- ✅ Previous PRP (P4M4T2S2) provides context on test patterns

**Validation**: This PRP provides:

1. Complete PRD structure specification with line references
2. Existing fixture pattern to follow
3. Exact content requirements and examples
4. Comprehensive validation commands
5. Gotchas and anti-patterns to avoid
6. Clear success criteria

The risk is minimal because:

1. Creating a markdown fixture file is a simple task
2. Structure is well-defined and documented
3. No complex logic or external dependencies
4. Existing patterns provide clear guidance
5. Validation is straightforward (type check, import test, structure check)
