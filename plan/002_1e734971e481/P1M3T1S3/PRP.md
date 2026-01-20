# Product Requirement Prompt (PRP): Test context_scope Contract Format

**PRP ID**: P1.M3.T1.S3
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Create comprehensive unit tests for the `context_scope` contract format to validate the 4-part CONTRACT DEFINITION structure that serves as the critical handoff document between PRP generation and execution.

**Deliverable**: Extended test file at `tests/unit/core/models.test.ts` with:
1. Test for valid context_scope following 4-part CONTRACT DEFINITION format
2. Test for missing context_scope failing validation
3. Test for malformed context_scope (missing sections) failing validation
4. Test verifying context_scope can reference dependency IDs and research findings
5. Optional: Zod schema for context_scope format validation

**Success Definition**:
- Valid context_scope with CONTRACT DEFINITION format passes validation
- Missing context_scope correctly rejected by SubtaskSchema
- Malformed context_scope (missing required sections) fails validation
- Section headers (RESEARCH NOTE, INPUT, LOGIC, OUTPUT) validated
- All tests pass with 100% coverage maintained for context_scope validation
- Tests follow existing patterns from models.test.ts (describe/it, safeParse, SETUP/EXECUTE/VERIFY)
- Optional Zod schema implemented if string parsing approach is insufficient

---

## User Persona

**Target User**: Developer working on the PRP Pipeline who needs to ensure that context_scope contracts are correctly formatted and validated before being passed to the PRPGenerator.

**Use Case**: Implementing features that depend on context_scope contracts and needing assurance that the contract format is enforced through validation.

**User Journey**:
1. Architect Agent generates subtasks with context_scope in CONTRACT DEFINITION format
2. Task Orchestrator validates subtask structure before passing to PRPGenerator
3. PRPGenerator consumes valid context_scope to create PRP documents
4. Coder Agent receives properly formatted contracts with clear INPUT/OUTPUT specifications

**Pain Points Addressed**:
- **Silent contract format errors**: Runtime tests catch malformed contracts early
- **Missing section validation**: Tests ensure all 4 required sections are present
- **Handoff clarity**: Validated contracts ensure clear communication between agents
- **Dependency reference tracking**: Tests verify dependency IDs can be referenced in context_scope

---

## Why

- **Contract Enforcement**: The context_scope field is the critical handoff document between PRP generation and execution. Tests ensure the CONTRACT DEFINITION format is enforced.
- **Type Safety Confidence**: While context_scope is currently just a string, tests ensure it follows the structured format required for agent handoffs.
- **Regression Prevention**: Changes to context_scope handling won't break the contract format if tests catch issues.
- **Executable Documentation**: Tests serve as living documentation of expected context_scope behavior.
- **Problems Solved**:
  - "What is the required format for context_scope?"
  - "How do I validate that a context_scope is well-formed?"
  - "What sections are required in the CONTRACT DEFINITION?"
  - "Can context_scope reference dependency IDs?"

---

## What

Extend the existing `tests/unit/core/models.test.ts` file to add comprehensive tests for context_scope contract format validation. The tests must verify the 4-part CONTRACT DEFINITION structure with RESEARCH NOTE, INPUT, LOGIC, and OUTPUT sections.

### Current State Analysis

**Existing Test File**: `tests/unit/core/models.test.ts` (2000+ lines)
- Contains basic SubtaskSchema tests (lines 129-277)
- Already tests context_scope as required field (line 267-276: empty context_scope fails)
- Missing: Format validation for CONTRACT DEFINITION structure
- Missing: Section header validation (RESEARCH NOTE, INPUT, LOGIC, OUTPUT)
- Missing: Dependency ID reference validation

**context_scope Type Definition** (from `src/core/models.ts` lines 195-210):
```typescript
readonly context_scope: string;
```

**context_scope Zod Schema** (from `src/core/models.ts` line 252):
```typescript
context_scope: z.string().min(1, 'Context scope is required'),
```

**Contract Format** (from PROMPTS.md line 158):
```
CONTRACT DEFINITION:
1. RESEARCH NOTE: [Finding from $SESSION_DIR/architecture/ regarding this feature].
2. INPUT: [Specific data structure/variable] from [Dependency ID].
3. LOGIC: Implement [PRD Section X] logic. Mock [Service Y] for isolation.
4. OUTPUT: Return [Result Object/Interface] for consumption by [Next Subtask ID].
```

### Success Criteria

- [ ] Test 1: Verify valid context_scope with CONTRACT DEFINITION format passes
- [ ] Test 2: Verify missing context_scope fails validation (already exists at lines 267-276)
- [ ] Test 3: Test malformed context_scope (missing CONTRACT DEFINITION prefix) fails
- [ ] Test 4: Test context_scope missing required section(s) fails validation
- [ ] Test 5: Verify context_scope can reference dependency IDs (e.g., "from S1")
- [ ] Test 6: Verify context_scope can reference research findings
- [ ] All tests follow existing patterns from models.test.ts
- [ ] 100% code coverage maintained for SubtaskSchema
- [ ] Optional: Zod schema created for context_scope format validation

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] context_scope type definition analyzed (string field on Subtask)
- [x] Contract format specification documented (4-part CONTRACT DEFINITION)
- [x] Real-world examples collected from tasks.json and test fixtures
- [x] Existing test patterns identified and extracted
- [x] Zod validation patterns researched (regex, refine, superRefine)
- [x] Codebase tree structure confirmed
- [x] Section header requirements documented (RESEARCH NOTE, INPUT, LOGIC, OUTPUT)

---

### Documentation & References

```yaml
# MUST READ - Contract format specification
- file: /home/dustin/projects/hacky-hack/PROMPTS.md
  why: Contains the CONTRACT DEFINITION format specification in TASK_BREAKDOWN_SYSTEM_PROMPT
  section: Lines 96-101 (context_scope definition), Line 158 (example format)
  critical: |
    - Format: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: [...]\n2. INPUT: [...]\n3. LOGIC: [...]\n4. OUTPUT: [...]''
    - Must have all 4 numbered sections
    - Section headers: RESEARCH NOTE, INPUT, LOGIC, OUTPUT
    - INPUT references dependency IDs (e.g., "from S1")
    - OUTPUT references consumption by next subtask

# MUST READ - context_scope type definition
- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains Subtask interface definition and Zod schema for context_scope
  section: Lines 195-210 (Subtask interface), Line 252 (Zod schema)
  critical: |
    - context_scope is readonly string field
    - Zod validation: z.string().min(1, 'Context scope is required')
    - No format validation currently implemented (only non-empty check)
    - Located in Subtask interface, not Task/Milestone/Phase

# MUST READ - Real-world context_scope examples
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/tasks.json
  why: Contains actual context_scope values from generated task hierarchy
  section: Lines 31, 42, 53, 73, 84, 95, 122, 133, 144, 164, 175, 186, 213, 224, 235
  pattern: |
    - All start with "CONTRACT DEFINITION:"
    - All have 4 numbered sections
    - RESEARCH NOTE references research docs (e.g., "groundswell_analysis.md Section 2")
    - INPUT references dependencies (e.g., "from S1", "from S2", or "None")
    - LOGIC contains implementation steps with file paths
    - OUTPUT specifies deliverables and consumption

# MUST READ - Existing SubtaskSchema tests
- file: /home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts
  why: Contains existing SubtaskSchema tests to extend with context_scope tests
  section: Lines 129-277 (SubtaskSchema describe block)
  pattern: |
    - Use describe() blocks for test grouping
    - Use it() for individual test cases
    - Use safeParse() for Zod validation
    - Comment structure: SETUP, EXECUTE, VERIFY
    - Test names: "should validate valid X" or "should reject invalid X"
    - Line 267-276: Empty context_scope test (already exists)

# RESEARCH DOCUMENTATION - Zod validation patterns
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T1S3/research/zod-validation-research.md
  why: Complete research on Zod string validation patterns
  section: Full file
  critical: |
    - .regex() for pattern-based validation
    - .refine() for custom validation logic
    - .superRefine() for advanced validation with multiple error messages
    - Pattern examples from codebase (ID validation with regex)
    - Multi-section string validation examples

# RESEARCH DOCUMENTATION - context_scope examples
- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M3T1S3/research/context_scope-examples.md
  why: Complete examples of context_scope values from codebase
  section: Full file
  critical: |
    - 5+ complete examples of context_scope values
    - Exact format specification
    - Section content patterns (what goes in each section)
    - Validation requirements
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   └── core/
│       ├── models.ts                    # SOURCE: Subtask interface (lines 149-211), SubtaskSchema (line 252)
│       └── index.ts                     # Export of Subtask type and SubtaskSchema
├── tests/
│   ├── unit/
│   │   └── core/
│   │       └── models.test.ts           # EXTEND: Add context_scope format tests
│   └── setup.ts                         # Global test setup
├── vitest.config.ts                     # Test configuration (100% coverage)
├── plan/
│   └── 002_1e734971e481/
│       ├── tasks.json                   # REFERENCE: Real context_scope examples
│       ├── P1M3T1S3/
│       │   └── research/                # RESEARCH: Zod patterns and context_scope examples
│       └── architecture/
│           └── system_context.md        # REFERENCE: Subtask documentation
└── package.json
```

---

### Desired Codebase Tree (files to be modified)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── core/
            └── models.test.ts           # EXTEND: Add context_scope format tests
                                        # ADD: describe block for context_scope contract validation
                                        # MAINTAIN: All existing SubtaskSchema tests
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: context_scope is Currently Only Validated as Non-Empty String
// Current Zod schema: z.string().min(1, 'Context scope is required')
// No format validation exists yet - this task adds it

// CRITICAL: Contract Format Must Start with Exact Prefix
// "CONTRACT DEFINITION:" must be at the start (case-sensitive)
// Followed by newline, then numbered sections

// CRITICAL: Section Headers Must Match Exactly
// "1. RESEARCH NOTE:", "2. INPUT:", "3. LOGIC:", "4. OUTPUT:"
// Number must be followed by period and space
// Section names are case-sensitive

// CRITICAL: Section Order is Fixed
// RESEARCH NOTE must be section 1
// INPUT must be section 2
// LOGIC must be section 3
// OUTPUT must be section 4

// CRITICAL: Dependency ID References in INPUT Section
// Format: "from S1", "from S2", "from P1.M1.T1.S1"
// Or "None" for standalone tasks
// Tests should verify these patterns are allowed

// CRITICAL: Research Finding References in RESEARCH NOTE Section
// Format: "Refer to X.md Section Y"
// Example: "Refer to groundswell_analysis.md Section 2"
// Tests should verify documentation references are allowed

// GOTCHA: Line Endings in Multiline Strings
// context_scope uses \n for newlines (JSON escape sequence)
// When creating test data, use \n not actual newlines in string literals
// Or use template literals with actual newlines

// CRITICAL: 100% code coverage requirement
// All tests must achieve 100% coverage for SubtaskSchema
// Check coverage with: npm run test:coverage

// GOTCHA: Vitest globals are enabled
// No need to import describe, it, expect, test, etc.
// They are available globally in all test files

// CRITICAL: Test file naming convention
// Use .test.ts suffix (not .spec.ts)
// Follow existing pattern: models.test.ts

// GOTCHA: Zod safeParse() returns discriminated union
// Always check result.success before accessing result.data
// Always check !result.success before accessing result.error

// GOTCHA: String regex matching for multi-section validation
// Use ^ and $ anchors for full string matching
// Use \d+ for numbered sections
// Use .*? for non-greedy content matching
// Use [\s\S]*? for multi-line content matching

// OPTIONAL: Consider Creating Zod Schema for context_scope
// If string parsing in tests becomes complex
// Create ContextScopeSchema with .superRefine()
// Add to models.ts and export
// Use in SubtaskSchema instead of plain z.string()
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This task extends tests for existing Subtask type and SubtaskSchema. Optional: Create ContextScopeSchema if needed.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing models.test.ts SubtaskSchema tests
  - FILE: tests/unit/core/models.test.ts
  - READ: Lines 129-277 (SubtaskSchema describe block)
  - UNDERSTAND: Current test structure and patterns
  - IDENTIFY: Line 267-276 already tests empty context_scope
  - DEPENDENCIES: None

Task 2: READ context_scope examples from tasks.json
  - FILE: plan/002_1e734971e481/tasks.json
  - READ: Multiple context_scope values (lines 31, 42, 53, 73, 84, 95, etc.)
  - EXTRACT: Common patterns for valid context_scope
  - IDENTIFY: Section variations (e.g., "None" in INPUT, dependency references)
  - DEPENDENCIES: None

Task 3: DECIDE on validation approach
  - DECISION: Use string parsing in tests OR create Zod schema
  - CONSIDER: Complexity of format validation
  - CONSIDER: Reusability of Zod schema
  - CONSIDER: Test clarity and maintainability
  - DEPENDENCIES: Task 1, Task 2

Task 4: (OPTIONAL) CREATE ContextScopeSchema in models.ts
  - IF: Zod schema approach chosen
  - CREATE: ContextScopeSchema using .superRefine()
  - VALIDATE: CONTRACT DEFINITION prefix
  - VALIDATE: All 4 numbered sections present
  - VALIDATE: Section headers match exactly
  - PATTERN: Follow existing schema patterns in models.ts
  - DEPENDENCIES: Task 3

Task 5: (OPTIONAL) UPDATE SubtaskSchema to use ContextScopeSchema
  - IF: ContextScopeSchema created
  - MODIFY: SubtaskSchema context_scope field
  - CHANGE: From z.string().min(1) to ContextScopeSchema
  - VERIFY: Existing tests still pass
  - DEPENDENCIES: Task 4

Task 6: CREATE context_scope validation tests
  - FILE: tests/unit/core/models.test.ts (extend SubtaskSchema describe block)
  - ADD: New describe block 'context_scope contract format validation'
  - IMPLEMENT: Test 1 - Valid CONTRACT DEFINITION format passes
  - IMPLEMENT: Test 2 - Missing CONTRACT DEFINITION prefix fails
  - IMPLEMENT: Test 3 - Missing section(s) fails validation
  - IMPLEMENT: Test 4 - Dependency ID references allowed
  - IMPLEMENT: Test 5 - Research finding references allowed
  - IMPLEMENT: Test 6 - All required sections in correct order
  - PATTERN: Follow existing test pattern with SETUP/EXECUTE/VERIFY comments
  - DEPENDENCIES: Task 3 (and Task 5 if schema approach)

Task 7: RUN tests and verify coverage
  - RUN: npm test -- tests/unit/core/models.test.ts
  - VERIFY: All new tests pass
  - VERIFY: Coverage is 100% for SubtaskSchema
  - FIX: Any failing tests or coverage gaps
  - DEPENDENCIES: Task 6

Task 8: RUN typecheck and verify compilation
  - RUN: npm run typecheck
  - VERIFY: No TypeScript compilation errors
  - DEPENDENCIES: Task 7
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// PATTERN: Valid context_scope Contract Definition
// =============================================================================

const validContextScope: string =
  'CONTRACT DEFINITION:\n' +
  '1. RESEARCH NOTE: Groundswell library analysis confirms location at ~/projects/groundswell.\n' +
  '2. INPUT: Current package.json and node_modules/groundswell symlink status.\n' +
  '3. LOGIC: Run npm list groundswell to verify link.\n' +
  '4. OUTPUT: Boolean success status and linked path for consumption by S2.';

// Or use template literal:
const validContextScopeTemplate: string = `CONTRACT DEFINITION:
1. RESEARCH NOTE: Groundswell library analysis confirms location at ~/projects/groundswell.
2. INPUT: Current package.json and node_modules/groundswell symlink status.
3. LOGIC: Run npm list groundswell to verify link.
4. OUTPUT: Boolean success status and linked path for consumption by S2.`;

// =============================================================================
// PATTERN: Test 1 - Valid context_scope Format
// =============================================================================

describe('context_scope contract format validation', () => {
  it('should accept valid context_scope with CONTRACT DEFINITION format', () => {
    // SETUP: Valid context_scope with all 4 sections
    const validSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Planned',
      story_points: 1,
      dependencies: [],
      context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic research findings for this feature.
2. INPUT: Data from previous subtask S1.
3. LOGIC: Implement feature using existing patterns.
4. OUTPUT: Feature implementation for consumption by S2.`,
    };

    // EXECUTE
    const result = SubtaskSchema.safeParse(validSubtask);

    // VERIFY: Should pass validation
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.context_scope).toBe(validSubtask.context_scope);
    }
  });

  // =============================================================================
  // PATTERN: Test 2 - Missing CONTRACT DEFINITION Prefix
  // =============================================================================

  it('should reject context_scope without CONTRACT DEFINITION prefix', () => {
    // SETUP: Invalid context_scope missing required prefix
    const invalidSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Planned',
      story_points: 1,
      dependencies: [],
      context_scope: '1. RESEARCH NOTE: Missing CONTRACT DEFINITION prefix.\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test',
    };

    // EXECUTE
    const result = SubtaskSchema.safeParse(invalidSubtask);

    // VERIFY: Should fail validation
    expect(result.success).toBe(false);

    // VERIFY: Error mentions missing CONTRACT DEFINITION
    if (!result.success) {
      const contextError = result.error.issues.find(
        issue => issue.path.includes('context_scope')
      );
      expect(contextError).toBeDefined();
    }
  });

  // =============================================================================
  // PATTERN: Test 3 - Missing Required Sections
  // =============================================================================

  it('should reject context_scope missing required section', () => {
    // SETUP: Invalid context_scope missing section 3 (LOGIC)
    const invalidSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Planned',
      story_points: 1,
      dependencies: [],
      context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Research findings.
2. INPUT: None
4. OUTPUT: Test output`,
    };

    // EXECUTE
    const result = SubtaskSchema.safeParse(invalidSubtask);

    // VERIFY: Should fail validation
    expect(result.success).toBe(false);

    // VERIFY: Error mentions missing section
    if (!result.success) {
      const contextError = result.error.issues.find(
        issue => issue.path.includes('context_scope')
      );
      expect(contextError).toBeDefined();
      // Check error message mentions missing section
      expect(contextError?.message).toMatch(/section/i);
    }
  });

  // =============================================================================
  // PATTERN: Test 4 - Dependency ID References
  // =============================================================================

  it('should accept context_scope with dependency ID references', () => {
    // SETUP: Valid context_scope referencing dependency S1
    const validSubtask: Subtask = {
      id: 'P1.M1.T1.S2',
      type: 'Subtask',
      title: 'Dependent Subtask',
      status: 'Planned',
      story_points: 1,
      dependencies: ['P1.M1.T1.S1'],
      context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Build on previous work.
2. INPUT: Interface from S1.
3. LOGIC: Extend implementation from S1.
4. OUTPUT: Enhanced feature for consumption by S3.`,
    };

    // EXECUTE
    const result = SubtaskSchema.safeParse(validSubtask);

    // VERIFY: Should pass validation
    expect(result.success).toBe(true);
  });

  // =============================================================================
  // PATTERN: Test 5 - Research Finding References
  // =============================================================================

  it('should accept context_scope with research finding references', () => {
    // SETUP: Valid context_scope referencing research document
    const validSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Research-based Subtask',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Refer to groundswell_analysis.md Section 2 for API details.
2. INPUT: None
3. LOGIC: Implement using patterns from research.
4. OUTPUT: Implementation following research findings.`,
    };

    // EXECUTE
    const result = SubtaskSchema.safeParse(validSubtask);

    // VERIFY: Should pass validation
    expect(result.success).toBe(true);
  });

  // =============================================================================
  // PATTERN: Test 6 - Section Order Validation
  // =============================================================================

  it('should reject context_scope with incorrect section order', () => {
    // SETUP: Invalid context_scope with sections out of order
    const invalidSubtask: Subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Planned',
      story_points: 1,
      dependencies: [],
      context_scope: `CONTRACT DEFINITION:
2. INPUT: None
1. RESEARCH NOTE: Wrong order
3. LOGIC: Test
4. OUTPUT: Test`,
    };

    // EXECUTE
    const result = SubtaskSchema.safeParse(invalidSubtask);

    // VERIFY: Should fail validation
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// OPTIONAL PATTERN: ContextScopeSchema using .superRefine()
// =============================================================================

// If creating Zod schema in models.ts:

import { z } from 'zod';

export const ContextScopeSchema: z.ZodType<string> = z.string().min(1).superRefine((value, ctx) => {
  // Check for CONTRACT DEFINITION prefix
  if (!value.startsWith('CONTRACT DEFINITION:\n')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'context_scope must start with "CONTRACT DEFINITION:"',
    });
    return; // Exit early if prefix missing
  }

  // Extract sections after the prefix
  const content = value.slice('CONTRACT DEFINITION:\n'.length);

  // Check for all 4 numbered sections in order
  const requiredSections = [
    { num: 1, name: 'RESEARCH NOTE' },
    { num: 2, name: 'INPUT' },
    { num: 3, name: 'LOGIC' },
    { num: 4, name: 'OUTPUT' },
  ];

  let remainingContent = content;

  for (const section of requiredSections) {
    const sectionPattern = new RegExp(`^${section.num}\\.\\s*${section.name}:`, 'm');
    const match = remainingContent.match(sectionPattern);

    if (!match) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing or incorrect section: "${section.num}. ${section.name}:"`,
      });
      return;
    }

    // Move past this section
    const matchIndex = remainingContent.indexOf(match[0]);
    remainingContent = remainingContent.slice(matchIndex + match[0].length);
  }
});

// Then in SubtaskSchema:
export const SubtaskSchema: z.ZodType<Subtask> = z.object({
  // ... other fields
  context_scope: ContextScopeSchema, // Instead of z.string().min(1)
});
```

---

### Integration Points

```yaml
INPUT FROM EXISTING TESTS:
  - tests/unit/core/models.test.ts has SubtaskSchema tests (lines 129-277)
  - Pattern: Use describe/it blocks with SETUP/EXECUTE/VERIFY comments
  - Pattern: Use safeParse() for Zod validation
  - Pattern: Use result.success check before accessing result.data
  - Pattern: Use result.error.issues.find() to check specific field errors
  - This PRP: Extends with context_scope format validation tests

INPUT FROM PREVIOUS WORK:
  - P1.M3.T1.S2 validated status transitions
  - P1.M3.T1.S1 validated type definitions
  - Tests run on same models.test.ts file
  - Context: Understanding Subtask structure and Zod validation patterns

OUTPUT FOR SUBSEQUENT WORK:
  - Extended models.test.ts with context_scope validation
  - Confidence that context_scope contracts are well-formed
  - Foundation for P1.M3.T2 (Session state structures)
  - Optional: ContextScopeSchema for reuse in other validation contexts

DIRECTORY STRUCTURE:
  - Modify: tests/unit/core/models.test.ts (extend existing file)
  - Optional: Add ContextScopeSchema to src/core/models.ts
  - No new files needed (unless schema approach chosen)

CLEANUP INTEGRATION:
  - None required - tests only, no side effects
  - Tests can run independently
  - No database or filesystem modifications
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After adding new tests
# Run tests to check for errors
npm test -- tests/unit/core/models.test.ts

# Expected: Tests run without syntax errors
# Expected: New tests appear in test output

# TypeScript compilation check
npm run typecheck

# Expected: No TypeScript compilation errors
# Expected: New tests compile correctly

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the models.test.ts file specifically
npm test -- tests/unit/core/models.test.ts

# Expected: All tests pass (including new context_scope tests)
# Expected: No failing tests
# Expected: Output shows new test descriptions

# Run full test suite for affected area
npm test -- tests/unit/core/

# Expected: All core tests pass
# Expected: No regressions in other test files

# Coverage validation
npm run test:coverage

# Expected: 100% coverage for src/core/models.ts
# Expected: No uncovered lines

# If tests fail, check:
# - SubtaskSchema is imported correctly
# - safeParse() syntax is valid
# - Test data is valid
# - context_scope values are correctly formatted
```

### Level 3: Type System Validation (Compile-Time Verification)

```bash
# TypeScript compilation verification
npm run typecheck

# Expected: No compilation errors
# Expected: context_scope tests compile correctly

# Verify type inference works
cat > /tmp/context-scope-test.ts << 'EOF'
import { Subtask, SubtaskSchema } from './src/core/models.js';

const testSubtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test',
  status: 'Planned',
  story_points: 1,
  dependencies: [],
  context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: Test\n4. OUTPUT: Test'
};

const result = SubtaskSchema.safeParse(testSubtask);
EOF
npx tsc --noEmit /tmp/context-scope-test.ts

# Expected: No type errors (Subtask matches schema)

# If type errors exist, check:
# - All types are imported correctly
// - context_scope is string type
// - Optional schema type is correctly defined
```

### Level 4: Integration Testing (Full Pipeline Validation)

```bash
# Full test suite run
npm test

# Expected: All tests pass across entire codebase
# Expected: No new test failures

# Coverage report validation
npm run test:coverage

# Expected: 100% coverage maintained
# Expected: Coverage for src/core/models.ts is 100%

# Manual verification: Read test output
npm test -- tests/unit/core/models.test.ts --reporter=verbose

# Expected: Clear test names showing context_scope validation tests
# Expected: Tests grouped by describe blocks

# Performance check: Tests should run quickly
time npm test -- tests/unit/core/models.test.ts

# Expected: Tests complete in reasonable time
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test 1: Valid CONTRACT DEFINITION format passes validation
- [ ] Test 2: Missing CONTRACT DEFINITION prefix fails
- [ ] Test 3: Missing required section(s) fails validation
- [ ] Test 4: Dependency ID references allowed and validated
- [ ] Test 5: Research finding references allowed
- [ ] Test 6: Section order validated (if implemented)
- [ ] All tests pass: `npm test -- tests/unit/core/models.test.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] 100% coverage for models.ts: `npm run test:coverage`

### Feature Validation

- [ ] Tests validate CONTRACT DEFINITION format requirement
- [ ] Empty context_scope test still works (line 267-276)
- [ ] Section headers (RESEARCH NOTE, INPUT, LOGIC, OUTPUT) validated
- [ ] Dependency ID references (e.g., "from S1") allowed
- [ ] Research finding references (e.g., "Refer to X.md") allowed
- [ ] All tests follow existing patterns from models.test.ts
- [ ] Optional Zod schema created (if approach chosen)

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Uses describe/it block structure with clear test names
- [ ] Uses SETUP/EXECUTE/VERIFY comment pattern
- [ ] Uses safeParse() for all Zod validation
- [ ] Uses result.success check before accessing result.data
- [ ] No duplicate tests (extend existing, don't repeat)
- [ ] Error messages are clear and informative
- [ ] Tests are self-documenting with clear names

### Documentation & Deployment

- [ ] Tests serve as executable documentation of context_scope format
- [ ] Contract format requirements documented in test names/comments
- [ ] No external dependencies required (uses existing utilities)
- [ ] Tests can run independently without setup

---

## Anti-Patterns to Avoid

- **Don't validate section content** - Only validate structure, not implementation details
- **Don't use parse() in tests** - Always use safeParse() for Zod validation
- **Don't skip type narrowing** - Always check result.success before accessing result.data
- **Don't make validation too strict** - Allow flexibility in section content
- **Don't forget error path validation** - Error paths are arrays: ['context_scope']
- **Don't ignore TypeScript compilation** - Include typecheck verification
- **Don't duplicate existing tests** - Extend models.test.ts, don't rewrite existing tests
- **Don't use wrong test file name** - Use models.test.ts (already exists)
- **Don't miss line ending handling** - Use \n for newlines in string literals
- **Don't hardcode all test values** - Use fixtures for common valid context_scope values
- **Don't forget "None" in INPUT section** - Valid INPUT can be "None" for standalone tasks
- **Don't create overly complex regex** - Keep validation simple and maintainable
- **Don't validate implementation details** - Only validate structure, not logic correctness

---

## Appendix: Decision Rationale

### Why extend existing tests instead of creating new file?

The existing `models.test.ts` already contains all model-related tests in one place. Adding context_scope tests to the existing file keeps related tests together, making them easier to find and maintain.

### Why validate structure instead of content?

The CONTRACT DEFINITION format is about structure (sections, headers), not about the correctness of the implementation details within each section. Content validation would require understanding the specific domain and would make tests brittle.

### Why consider a Zod schema approach?

A dedicated ContextScopeSchema would:
1. Provide reusability across the codebase
2. Give more structured error messages
3. Separate validation logic from test code
4. Enable type-safe context_scope values

However, string parsing in tests is simpler and may be sufficient for this use case.

### Why are dependency ID references important?

The INPUT section often references previous subtasks by ID (e.g., "from S1"). This dependency tracking is critical for the Task Orchestrator to determine execution order. Tests should ensure these references are allowed in the format.

### What about "None" in INPUT section?

Standalone subtasks (no dependencies) use "INPUT: None" to indicate they don't consume output from previous work. This is a valid pattern that should be allowed.

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from research agents (3 parallel research tasks)
- [x] Existing test patterns analyzed and documented
- [x] Contract format fully documented with examples
- [x] Zod validation patterns researched
- [x] Implementation tasks ordered by dependencies
- [x] Validation commands specified for each level
- [x] Anti-patterns documented to avoid
- [x] Previous PRP context integrated

**Risk Mitigation**:
- Extending existing test file (low risk of breaking structure)
- Tests only (no production code changes, unless schema approach)
- Can be implemented independently
- Easy to verify and iterate
- Clear acceptance criteria

**Known Risks**:
- **Schema vs. test validation**: Decision point on whether to create ContextScopeSchema
  - Mitigation: PRP presents both options, implementation can choose
- **Regex complexity**: Contract format validation may require complex regex
  - Mitigation: Start simple, add complexity only if needed
- **Section content flexibility**: Need to balance strictness with flexibility
  - Mitigation: Validate structure only, not content details

---

**END OF PRP**
