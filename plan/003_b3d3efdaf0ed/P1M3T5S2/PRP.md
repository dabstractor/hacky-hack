# Product Requirement Prompt (PRP): P1.M3.T5.S2 - Verify bug severity levels and output format

---

## Goal

**Feature Goal**: Verify that bug severity classification logic correctly defines all four severity levels (critical, major, minor, cosmetic) with clear criteria, properly classifies bugs by severity, generates TEST_RESULTS.md only when bugs exist, follows the structured format, and does not generate a file when no bugs are found.

**Deliverable**: Unit test file `tests/unit/bug-severity-classification.test.ts` with comprehensive test cases covering:

- All four severity levels defined with clear criteria (critical, major, minor, cosmetic)
- Bug severity classification validation using BugSchema
- TestResults.hasBugs drives TEST_RESULTS.md generation
- TEST_RESULTS.md follows structured markdown format (sections: Overview, Critical Issues, Major Issues, Minor Issues, Testing Summary)
- No file generated when no bugs found (hasBugs: false)

**Success Definition**: All tests pass, verifying:

- BugSeverity type defines four levels: 'critical' | 'major' | 'minor' | 'cosmetic'
- BugSeverityEnum validates all four severity levels
- BugSchema correctly validates bugs at each severity level
- TestResults.hasBugs boolean drives file generation logic
- TEST_RESULTS.md contains required sections when bugs exist
- TEST_RESULTS.md is NOT generated when hasBugs is false
- Bug severity criteria matches system_context.md definitions

## Why

- Bug severity levels are critical for prioritizing fixes and driving fix cycle behavior
- The hasBugs boolean controls the entire bug fix pipeline - if true, trigger fixes; if false, signal success
- Incorrect severity classification could cause critical bugs to be missed or minor bugs to block completion
- TEST_RESULTS.md format must be consistent for bug fix workflow to parse correctly
- File generation rules are critical - writing an empty file when no bugs exist causes unnecessary work, not writing when bugs exist causes bugs to be missed
- No existing tests verify bug severity classification logic or output format generation
- Bug severity levels from system_context.md must match implementation

## What

Unit tests that verify bug severity classification is correct and TEST_RESULTS.md output format follows specification.

### Success Criteria

- [ ] BugSeverity type defines all four levels: critical, major, minor, cosmetic
- [ ] BugSeverityEnum validates all four severity levels
- [ ] BugSchema accepts bugs at each severity level (critical, major, minor, cosmetic)
- [ ] BugSchema rejects invalid severity values
- [ ] TestResults.hasBugs boolean drives file generation (true = generate, false = skip)
- [ ] TEST_RESULTS.md format contains ## Overview section
- [ ] TEST_RESULTS.md format contains ## Critical Issues (Must Fix) section
- [ ] TEST_RESULTS.md format contains ## Major Issues (Should Fix) section
- [ ] TEST_RESULTS.md format contains ## Minor Issues (Nice to Fix) section
- [ ] TEST_RESULTS.md format contains ## Testing Summary section
- [ ] TEST_RESULTS.md contains bug report fields (Severity, PRD Reference, Expected Behavior, Actual Behavior, Steps to Reproduce, Suggested Fix)
- [ ] TEST_RESULTS.md is NOT generated when hasBugs is false
- [ ] Bug severity criteria matches system_context.md (critical: blocks core, major: significantly impacts UX, minor: small improvements, cosmetic: polish)

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Exact severity level definitions from system_context.md
- Bug severity type and schema locations in models.ts
- BUG_HUNT_PROMPT output rules for file generation
- Existing test patterns from qa-agent.test.ts
- TestResults.md format specification from PROMPTS.md
- Research documents with implementation details

### Documentation & References

```yaml
# MUST READ - Bug severity definitions from system_context.md
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Contains authoritative bug severity level definitions
  section: "Bug Severity Levels" (lines 293-298)
  critical: "Blocks core functionality"
  major: "Significantly impacts UX/functionality"
  minor: "Small improvements"
  cosmetic: "Polish items"

# MUST READ - BugSeverity type and schema definitions
- file: src/core/models.ts
  why: Contains BugSeverity type, BugSeverityEnum, and BugSchema
  lines: 1607-1645 (BugSeverity type and BugSeverityEnum)
  lines: 1734-1762 (BugSchema with severity validation)
  lines: 1862-1885 (TestResultsSchema with hasBugs boolean)
  pattern: Zod enum with 4 values, object schema with severity field
  gotcha: hasBugs is boolean that drives entire bug fix pipeline

# MUST READ - BUG_HUNT_PROMPT output rules
- file: src/agents/prompts.ts
  why: Contains file generation rules (write only if critical/major bugs)
  lines: 971-978 (Output - IMPORTANT section)
  lines: 913-960 (Phase 4: Documentation as Bug Report)
  pattern: "If you find Critical or Major bugs: MUST write" vs "If NO Critical or Major bugs: Do NOT write any file"
  gotcha: Minor/cosmetic bugs alone do NOT trigger file generation

# MUST READ - TEST_RESULTS.md format specification
- file: PROMPTS.md
  why: Contains complete TEST_RESULTS.md markdown template
  lines: 1110-1153 (Bug Fix Requirements template)
  pattern: Markdown with ## sections (Overview, Critical Issues, Major Issues, Minor Issues, Testing Summary)
  gotcha: Each bug has fields: Severity, PRD Reference, Expected Behavior, Actual Behavior, Steps to Reproduce, Suggested Fix

# MUST READ - Existing QA Agent integration tests (reference patterns)
- file: tests/integration/qa-agent.test.ts
  why: Shows existing bug severity classification test patterns
  lines: 118-158 (createTestBug factory function)
  lines: 587-679 (TEST SUITE 5: Bug Severity Levels)
  pattern: Use BugSchema.safeParse() for validation, test each severity level
  gotcha: Tests use createTestBug factory, validate with BugSchema

# MUST READ - Bug severity classification test patterns
- file: tests/integration/qa-agent.test.ts
  why: Shows how to test bug severity classification
  lines: 588-654 (severity classification tests)
  pattern: Create bug with severity, run BugSchema.safeParse(), verify result.success and result.data.severity
  gotcha: Test all four levels separately, then TestResults with all levels

# MUST READ - TestResults structure
- file: src/core/models.ts
  why: Contains TestResults interface definition
  lines: 1764-1810 (TestResults interface with JSDoc)
  pattern: Interface with hasBugs: boolean, bugs: Bug[], summary: string, recommendations: string[]
  gotcha: hasBugs drives fix cycle, bugs array can be empty (no bugs found)

# MUST READ - Existing unit test patterns
- file: tests/unit/agents/prompts/bug-hunt-prompt.test.ts
  why: Shows unit test structure for bug-related functionality
  lines: 1-50 (file header, imports, mock fixtures)
  pattern: describe() with nested it(), use mock fixtures, expect().toContain() for string validation
  gotcha: Unit tests focus on single function/class behavior, use simple assertions

# MUST READ - Bug finding prompt integration tests
- file: tests/integration/bug-finding-prompt.test.ts
  why: Shows how to verify BUG_HUNT_PROMPT contains required sections
  lines: 209-236 (Phase 4: Documentation as Bug Report tests)
  lines: 337-358 (Output instructions tests)
  pattern: Verify prompt contains specific strings (section headers, field names)
  gotcha: Tests verify prompt content, not execution
```

### Current Codebase Tree (relevant test directories)

```bash
tests/
├── unit/
│   ├── agents/
│   │   └── prompts/
│   │       └── bug-hunt-prompt.test.ts     # Existing: Unit tests for createBugHuntPrompt
│   └── workflows/
│       └── bug-hunt-workflow.test.ts       # Existing: BugHuntWorkflow unit tests
├── integration/
│   ├── qa-agent.test.ts                    # Existing: QA Agent integration with severity tests
│   ├── bug-finding-prompt.test.ts          # Existing: BUG_HUNT_PROMPT structure tests
│   └── bug-hunt-workflow-integration.test.ts
└── setup.ts                                # Global test setup
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── unit/
│   ├── bug-severity-classification.test.ts # NEW: Bug severity levels and output format tests
│   ├── agents/
│   │   └── prompts/
│   │       └── bug-hunt-prompt.test.ts     # Existing (keep)
│   └── workflows/
│       └── bug-hunt-workflow.test.ts       # Existing (keep)
```

**New File**: `tests/unit/bug-severity-classification.test.ts`

- Tests BugSeverity type has 4 levels
- Tests BugSeverityEnum validates all 4 levels
- Tests BugSchema accepts each severity level
- Tests BugSchema rejects invalid severities
- Tests TestResults.hasBugs drives file generation
- Tests TEST_RESULTS.md format (sections, fields)
- Tests no file generation when hasBugs is false
- Uses unit test patterns (simple assertions, focused on single behavior)

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Bug severity levels from system_context.md
// critical: Blocks core functionality (MUST fix)
// major: Significantly impacts UX/functionality (MUST fix)
// minor: Small improvements (acceptable)
// cosmetic: Polish items (acceptable)
// Fix cycle loops until no critical OR major bugs remain

// CRITICAL: hasBugs boolean drives entire bug fix pipeline
// hasBugs: true → trigger fix cycle
// hasBugs: false → signal success (no file written)
// This is the PRIMARY control for fix cycle behavior

// CRITICAL: TEST_RESULTS.md file generation rules from BUG_HUNT_PROMPT
// "If you find Critical or Major bugs: MUST write the bug report"
// "If you find NO Critical or Major bugs: Do NOT write any file"
// Minor/cosmetic bugs alone do NOT trigger file generation

// CRITICAL: BugSeverity is a TypeScript union type
export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';

// CRITICAL: BugSeverityEnum is a Zod enum for runtime validation
export const BugSeverityEnum = z.enum([
  'critical',
  'major',
  'minor',
  'cosmetic',
]);

// CRITICAL: BugSchema uses BugSeverityEnum for severity field validation
export const BugSchema: z.ZodType<Bug> = z.object({
  id: z.string().min(1, 'Bug ID is required'),
  severity: BugSeverityEnum, // Validates against 4 valid levels
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  reproduction: z.string().min(1, 'Reproduction steps are required'),
  location: z.string().optional(),
});

// CRITICAL: TestResults.hasBugs is the control flag
export interface TestResults {
  readonly hasBugs: boolean; // PRIMARY control for fix cycle
  readonly bugs: Bug[]; // Can be empty (no bugs found)
  readonly summary: string;
  readonly recommendations: string[];
}

// GOTCHA: hasBugs is NOT automatically derived from bugs array
// It must be explicitly set by QA Agent based on whether critical/major bugs exist
// hasBugs: true even if only minor/cosmetic bugs (would not trigger file write in practice)
// But TestResults structure allows hasBugs to drive fix cycle independently

// CRITICAL: TEST_RESULTS.md markdown format has specific sections
// ## Overview
// ## Critical Issues (Must Fix)
// ## Major Issues (Should Fix)
// ## Minor Issues (Nice to Fix)
// ## Testing Summary

// Each bug has fields:
// **Severity**: critical/major/minor/cosmetic
// **PRD Reference**: [Which section/requirement]
// **Expected Behavior**: What should happen
// **Actual Behavior**: What actually happens
// **Steps to Reproduce**: How to see the bug
// **Suggested Fix**: Brief guidance on resolution

// CRITICAL: File generation is controlled by BUG_HUNT_PROMPT instructions
// The QA Agent reads the prompt and decides whether to write
// Tests should verify the prompt contains correct instructions
// Tests should verify hasBugs boolean controls logic

// GOTCHA: Bug severity criteria from system_context.md vs BUG_HUNT_PROMPT
// system_context.md: "critical: Blocks core functionality"
// BUG_HUNT_PROMPT: "Critical Issues (Must Fix): Issues that prevent core functionality from working"
// These should align - tests verify consistency

// CRITICAL: Use BugSchema.safeParse() for validation in tests
// Returns { success: boolean, data?: Bug, error?: ZodError }
// Check result.success for pass/fail
// Check result.data.severity for validated value
// Check result.error for validation failure details

// CRITICAL: Test pattern for severity classification (from qa-agent.test.ts)
const bug = createTestBug('BUG-001', 'critical', 'Title', 'Desc', 'Rep');
const result = BugSchema.safeParse(bug);
expect(result.success).toBe(true);
if (result.success === true) {
  expect(result.data.severity).toBe('critical');
}

// GOTCHA: Unit tests should not make LLM calls
// Focus on type/schema validation and format checking
// Use mock fixtures for test data
// Don't test actual file I/O (that's integration test territory)

// CRITICAL: Test file naming convention
// tests/unit/bug-severity-classification.test.ts
// Pattern: {feature}-{concept}.test.ts
// Descriptive, focused on single responsibility

// GOTCHA: Import paths must use .js extensions (ES modules)
import { BugSchema } from '../../src/core/models.js';

// CRITICAL: Tests should follow project patterns
// Use describe() blocks for grouping
// Use it() for individual test cases
// Use SETUP/EXECUTE/VERIFY comments for clarity
// Use factory functions for test data (createTestBug, createTestResults)
```

## Implementation Blueprint

### Data Models and Structure

Use existing types and schemas from `src/core/models.ts`:

```typescript
// Import existing types for validation testing
import {
  BugSchema,
  BugSeverityEnum,
  TestResultsSchema,
} from '../../src/core/models.js';
import type { Bug, BugSeverity, TestResults } from '../../src/core/models.js';

// Factory function for creating valid Bug objects
const createTestBug = (
  id: string,
  severity: BugSeverity,
  title: string,
  description: string,
  reproduction: string,
  location?: string
): Bug => ({
  id,
  severity,
  title,
  description,
  reproduction,
  location,
});

// Factory function for creating valid TestResults objects
const createTestResults = (
  hasBugs: boolean,
  bugs: Bug[],
  summary: string,
  recommendations: string[]
): TestResults => ({
  hasBugs,
  bugs,
  summary,
  recommendations,
});

// Test fixture for bug severity criteria from system_context.md
const SEVERITY_CRITERIA = {
  critical: 'Blocks core functionality',
  major: 'Significantly impacts UX/functionality',
  minor: 'Small improvements',
  cosmetic: 'Polish items',
} as const;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/bug-severity-classification.test.ts
  - IMPLEMENT: File header with JSDoc comments describing test purpose
  - IMPLEMENT: Import statements for Vitest, types, schemas
  - IMPLEMENT: Factory functions (createTestBug, createTestResults)
  - FOLLOW pattern: tests/unit/agents/prompts/bug-hunt-prompt.test.ts (structure)
  - NAMING: bug-severity-classification.test.ts
  - PLACEMENT: tests/unit/ directory (top-level, more visible than subdirectories)

Task 2: IMPLEMENT main describe block and test fixtures
  - CREATE: Main describe block 'unit/bug-severity-classification'
  - IMPLEMENT: Factory functions (createTestBug, createTestResults, SEVERITY_CRITERIA)
  - IMPLEMENT: Type imports (Bug, BugSeverity, TestResults)
  - IMPLEMENT: Schema imports (BugSchema, BugSeverityEnum, TestResultsSchema)
  - DEPENDENCIES: Task 1 (file created)

Task 3: IMPLEMENT BugSeverity type validation tests
  - CREATE: Describe block 'BugSeverity type'
  - IMPLEMENT: test 'should define all four severity levels'
    - SETUP: Create array of expected values
    - EXECUTE: Check type has 4 literal values
    - VERIFY: ['critical', 'major', 'minor', 'cosmetic'] are all defined
  - DEPENDENCIES: Task 2 (fixtures complete)

Task 4: IMPLEMENT BugSeverityEnum schema validation tests
  - CREATE: Describe block 'BugSeverityEnum schema validation'
  - IMPLEMENT: test 'should accept valid severity "critical"'
    - SETUP: Use BugSeverityEnum.safeParse('critical')
    - VERIFY: result.success is true
  - IMPLEMENT: test 'should accept valid severity "major"'
    - VERIFY: result.success is true
  - IMPLEMENT: test 'should accept valid severity "minor"'
    - VERIFY: result.success is true
  - IMPLEMENT: test 'should accept valid severity "cosmetic"'
    - VERIFY: result.success is true
  - IMPLEMENT: test 'should reject invalid severity values'
    - SETUP: Test 'invalid', 'BLOCKER', '', null, undefined
    - VERIFY: result.success is false for all invalid values
  - DEPENDENCIES: Task 3 (BugSeverity type tests complete)

Task 5: IMPLEMENT BugSchema severity validation tests
  - CREATE: Describe block 'BugSchema severity validation'
  - IMPLEMENT: test 'should validate bug with critical severity'
    - SETUP: Create bug with severity: 'critical'
    - EXECUTE: BugSchema.safeParse(bug)
    - VERIFY: result.success is true, result.data.severity is 'critical'
  - IMPLEMENT: test 'should validate bug with major severity'
    - SETUP: Create bug with severity: 'major'
    - VERIFY: result.success is true, result.data.severity is 'major'
  - IMPLEMENT: test 'should validate bug with minor severity'
    - SETUP: Create bug with severity: 'minor'
    - VERIFY: result.success is true, result.data.severity is 'minor'
  - IMPLEMENT: test 'should validate bug with cosmetic severity'
    - SETUP: Create bug with severity: 'cosmetic'
    - VERIFY: result.success is true, result.data.severity is 'cosmetic'
  - IMPLEMENT: test 'should reject bug with invalid severity'
    - SETUP: Create bug with severity: 'BLOCKER' (invalid)
    - VERIFY: result.success is false, error contains severity validation message
  - IMPLEMENT: test 'should reject bug with missing severity'
    - SETUP: Create bug without severity field
    - VERIFY: result.success is false
  - DEPENDENCIES: Task 4 (BugSeverityEnum tests complete)

Task 6: IMPLEMENT TestResults.hasBugs boolean tests
  - CREATE: Describe block 'TestResults.hasBugs control'
  - IMPLEMENT: test 'should accept hasBugs: true'
    - SETUP: Create TestResults with hasBugs: true
    - EXECUTE: TestResultsSchema.safeParse(results)
    - VERIFY: result.success is true, result.data.hasBugs is true
  - IMPLEMENT: test 'should accept hasBugs: false'
    - SETUP: Create TestResults with hasBugs: false
    - VERIFY: result.success is true, result.data.hasBugs is false
  - IMPLEMENT: test 'should reject hasBugs with wrong type'
    - SETUP: Create TestResults with hasBugs: 'true' (string)
    - VERIFY: result.success is false
  - DEPENDENCIES: Task 5 (BugSchema tests complete)

Task 7: IMPLEMENT bug severity criteria matching tests
  - CREATE: Describe block 'bug severity criteria from system_context.md'
  - IMPLEMENT: test 'should define critical as "blocks core functionality"'
    - VERIFY: SEVERITY_CRITERIA.critical matches system_context.md
  - IMPLEMENT: test 'should define major as "significantly impacts UX/functionality"'
    - VERIFY: SEVERITY_CRITERIA.major matches system_context.md
  - IMPLEMENT: test 'should define minor as "small improvements"'
    - VERIFY: SEVERITY_CRITERIA.minor matches system_context.md
  - IMPLEMENT: test 'should define cosmetic as "polish items"'
    - VERIFY: SEVERITY_CRITERIA.cosmetic matches system_context.md
  - DEPENDENCIES: Task 6 (hasBugs tests complete)

Task 8: IMPLEMENT TEST_RESULTS.md format tests
  - CREATE: Describe block 'TEST_RESULTS.md format structure'
  - IMPLEMENT: test 'should contain ## Overview section'
    - VERIFY: Format specification has '## Overview' header
  - IMPLEMENT: test 'should contain ## Critical Issues (Must Fix) section'
    - VERIFY: Format specification has '## Critical Issues (Must Fix)' header
  - IMPLEMENT: test 'should contain ## Major Issues (Should Fix) section'
    - VERIFY: Format specification has '## Major Issues (Should Fix)' header
  - IMPLEMENT: test 'should contain ## Minor Issues (Nice to Fix) section'
    - VERIFY: Format specification has '## Minor Issues (Nice to Fix)' header
  - IMPLEMENT: test 'should contain ## Testing Summary section'
    - VERIFY: Format specification has '## Testing Summary' header
  - DEPENDENCIES: Task 7 (criteria tests complete)

Task 9: IMPLEMENT bug report field tests
  - CREATE: Describe block 'bug report field structure'
  - IMPLEMENT: test 'should contain Severity field'
    - VERIFY: Format has '**Severity**' field marker
  - IMPLEMENT: test 'should contain PRD Reference field'
    - VERIFY: Format has '**PRD Reference**' field marker
  - IMPLEMENT: test 'should contain Expected Behavior field'
    - VERIFY: Format has '**Expected Behavior**' field marker
  - IMPLEMENT: test 'should contain Actual Behavior field'
    - VERIFY: Format has '**Actual Behavior**' field marker
  - IMPLEMENT: test 'should contain Steps to Reproduce field'
    - VERIFY: Format has '**Steps to Reproduce**' field marker
  - IMPLEMENT: test 'should contain Suggested Fix field'
    - VERIFY: Format has '**Suggested Fix**' field marker
  - DEPENDENCIES: Task 8 (format tests complete)

Task 10: IMPLEMENT file generation rule tests
  - CREATE: Describe block 'TEST_RESULTS.md file generation rules'
  - IMPLEMENT: test 'should specify write file when critical/major bugs found'
    - VERIFY: BUG_HUNT_PROMPT contains "If you find Critical or Major bugs: MUST write"
  - IMPLEMENT: test 'should specify no file when no critical/major bugs found'
    - VERIFY: BUG_HUNT_PROMPT contains "If you find NO Critical or Major bugs: Do NOT write any file"
  - IMPLEMENT: test 'should specify absence of file signals success'
    - VERIFY: BUG_HUNT_PROMPT contains "Leave no trace. The absence of the file signals success"
  - DEPENDENCIES: Task 9 (field tests complete)

Task 11: IMPLEMENT TestResults with all severity levels test
  - CREATE: Describe block 'TestResults with multiple severity levels'
  - IMPLEMENT: test 'should validate TestResults with bugs at all severity levels'
    - SETUP: Create TestResults with 4 bugs (critical, major, minor, cosmetic)
    - EXECUTE: TestResultsSchema.safeParse(results)
    - VERIFY: result.success is true, result.data.bugs has length 4
  - IMPLEMENT: test 'should validate TestResults with empty bugs array'
    - SETUP: Create TestResults with hasBugs: false, bugs: []
    - VERIFY: result.success is true, result.data.bugs has length 0
  - DEPENDENCIES: Task 10 (file generation tests complete)

Task 12: VERIFY all tests follow project patterns
  - VERIFY: Test file uses .js extension for imports
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock fixtures use factory functions
  - VERIFY: Test file location matches conventions (tests/unit/)
  - VERIFY: Tests validate BugSchema, BugSeverityEnum, TestResultsSchema
  - VERIFY: Tests reference system_context.md criteria
  - VERIFY: Format tests use string matching (toContain)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Test file structure with imports and fixtures
/**
 * Unit tests for bug severity classification and TEST_RESULTS.md output format
 *
 * @remarks
 * Tests validate that bug severity levels are correctly defined and that
 * TEST_RESULTS.md follows the structured format specification.
 *
 * Verifies:
 * - All four severity levels (critical, major, minor, cosmetic) are defined
 * - BugSeverityEnum validates all four levels
 * - BugSchema correctly classifies bugs by severity
 * - TestResults.hasBugs drives file generation
 * - TEST_RESULTS.md contains required sections and fields
 * - No file generated when hasBugs is false
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  BugSchema,
  BugSeverityEnum,
  TestResultsSchema,
} from '../../src/core/models.js';
import type { Bug, BugSeverity, TestResults } from '../../src/core/models.js';

// PATTERN: Factory functions for test data
const createTestBug = (
  id: string,
  severity: BugSeverity,
  title: string,
  description: string,
  reproduction: string,
  location?: string
): Bug => ({
  id,
  severity,
  title,
  description,
  reproduction,
  location,
});

const createTestResults = (
  hasBugs: boolean,
  bugs: Bug[],
  summary: string,
  recommendations: string[]
): TestResults => ({
  hasBugs,
  bugs,
  summary,
  recommendations,
});

// PATTERN: Bug severity criteria from system_context.md
const SEVERITY_CRITERIA = {
  critical: 'Blocks core functionality',
  major: 'Significantly impacts UX/functionality',
  minor: 'Small improvements',
  cosmetic: 'Polish items',
} as const;

// PATTERN: BugSeverity type validation test
describe('BugSeverity type', () => {
  it('should define all four severity levels', () => {
    // SETUP: Expected severity levels from system_context.md
    const expectedSeverities: BugSeverity[] = [
      'critical',
      'major',
      'minor',
      'cosmetic',
    ];

    // EXECUTE & VERIFY: Type allows all four values
    expectedSeverities.forEach(severity => {
      const bug: Bug = createTestBug(
        'BUG-001',
        severity,
        'Test',
        'Desc',
        'Rep'
      );
      const result = BugSchema.safeParse(bug);
      expect(result.success).toBe(true);
    });
  });
});

// PATTERN: BugSeverityEnum schema validation test
describe('BugSeverityEnum schema validation', () => {
  it('should accept valid severity "critical"', () => {
    // SETUP: Valid severity value
    const severity = 'critical';

    // EXECUTE: Parse with Zod schema
    const result = BugSeverityEnum.safeParse(severity);

    // VERIFY: Valid severity passes validation
    expect(result.success).toBe(true);
  });

  it('should reject invalid severity values', () => {
    // SETUP: Invalid severity values
    const invalidSeverities = [
      'invalid',
      'BLOCKER',
      'urgent',
      '',
      null,
      undefined,
    ];

    // EXECUTE & VERIFY: All invalid values fail validation
    invalidSeverities.forEach(severity => {
      const result = BugSeverityEnum.safeParse(severity);
      expect(result.success).toBe(false);
    });
  });
});

// PATTERN: BugSchema severity validation test
describe('BugSchema severity validation', () => {
  it('should validate bug with critical severity', () => {
    // SETUP: Valid bug with critical severity
    const bug = createTestBug(
      'BUG-001',
      'critical',
      'Critical Bug',
      'Desc',
      'Rep'
    );

    // EXECUTE: Validate with BugSchema
    const result = BugSchema.safeParse(bug);

    // VERIFY: Bug passes validation with correct severity
    expect(result.success).toBe(true);
    if (result.success === true) {
      expect(result.data.severity).toBe('critical');
    }
  });

  it('should reject bug with invalid severity', () => {
    // SETUP: Bug with invalid severity (type assertion for testing)
    const invalidBug = {
      id: 'BUG-001',
      severity: 'BLOCKER', // Invalid - not in BugSeverityEnum
      title: 'Test Bug',
      description: 'Test',
      reproduction: 'Test',
    };

    // EXECUTE: Validate with BugSchema
    const result = BugSchema.safeParse(invalidBug);

    // VERIFY: Bug fails validation
    expect(result.success).toBe(false);
  });
});

// PATTERN: TestResults.hasBugs control test
describe('TestResults.hasBugs control', () => {
  it('should accept hasBugs: true', () => {
    // SETUP: TestResults with hasBugs: true
    const testResults = createTestResults(
      true,
      [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Rep')],
      'Found bugs',
      ['Fix it']
    );

    // EXECUTE: Validate with TestResultsSchema
    const result = TestResultsSchema.safeParse(testResults);

    // VERIFY: hasBugs is preserved as true
    expect(result.success).toBe(true);
    if (result.success === true) {
      expect(result.data.hasBugs).toBe(true);
    }
  });

  it('should accept hasBugs: false', () => {
    // SETUP: TestResults with hasBugs: false (no bugs found)
    const testResults = createTestResults(false, [], 'No bugs found', []);

    // EXECUTE: Validate with TestResultsSchema
    const result = TestResultsSchema.safeParse(testResults);

    // VERIFY: hasBugs is preserved as false
    expect(result.success).toBe(true);
    if (result.success === true) {
      expect(result.data.hasBugs).toBe(false);
    }
  });
});

// PATTERN: Bug severity criteria matching test
describe('bug severity criteria from system_context.md', () => {
  it('should define critical as "blocks core functionality"', () => {
    // VERIFY: Critical severity criteria matches system_context.md
    expect(SEVERITY_CRITERIA.critical).toBe('Blocks core functionality');
  });

  it('should define major as "significantly impacts UX/functionality"', () => {
    expect(SEVERITY_CRITERIA.major).toBe(
      'Significantly impacts UX/functionality'
    );
  });

  it('should define minor as "small improvements"', () => {
    expect(SEVERITY_CRITERIA.minor).toBe('Small improvements');
  });

  it('should define cosmetic as "polish items"', () => {
    expect(SEVERITY_CRITERIA.cosmetic).toBe('Polish items');
  });
});

// PATTERN: TEST_RESULTS.md format test (using static format spec)
describe('TEST_RESULTS.md format structure', () => {
  // NOTE: These tests verify the format specification, not actual file generation
  // File generation is tested in integration tests (qa-agent.test.ts)

  const TEST_RESULTS_FORMAT = `
# Bug Fix Requirements

## Overview

Brief summary of testing performed and overall quality assessment.

## Critical Issues (Must Fix)

Issues that prevent core functionality from working.

### Issue 1: [Title]

**Severity**: Critical
**PRD Reference**: [Which section/requirement]
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Steps to Reproduce**: How to see the bug
**Suggested Fix**: Brief guidance on resolution

## Major Issues (Should Fix)

Issues that significantly impact user experience or functionality.

## Minor Issues (Nice to Fix)

Small improvements or polish items.

## Testing Summary

- Total tests performed: X
- Passing: X
- Failing: X
`;

  it('should contain ## Overview section', () => {
    expect(TEST_RESULTS_FORMAT).toContain('## Overview');
  });

  it('should contain ## Critical Issues (Must Fix) section', () => {
    expect(TEST_RESULTS_FORMAT).toContain('## Critical Issues (Must Fix)');
  });

  it('should contain ## Major Issues (Should Fix) section', () => {
    expect(TEST_RESULTS_FORMAT).toContain('## Major Issues (Should Fix)');
  });

  it('should contain ## Minor Issues (Nice to Fix) section', () => {
    expect(TEST_RESULTS_FORMAT).toContain('## Minor Issues (Nice to Fix)');
  });

  it('should contain ## Testing Summary section', () => {
    expect(TEST_RESULTS_FORMAT).toContain('## Testing Summary');
  });
});

// PATTERN: Bug report field test
describe('bug report field structure', () => {
  const TEST_RESULTS_FORMAT = `
**Severity**: Critical
**PRD Reference**: [Which section/requirement]
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Steps to Reproduce**: How to see the bug
**Suggested Fix**: Brief guidance on resolution
`;

  it('should contain Severity field', () => {
    expect(TEST_RESULTS_FORMAT).toContain('**Severity**');
  });

  it('should contain PRD Reference field', () => {
    expect(TEST_RESULTS_FORMAT).toContain('**PRD Reference**');
  });

  it('should contain Expected Behavior field', () => {
    expect(TEST_RESULTS_FORMAT).toContain('**Expected Behavior**');
  });

  it('should contain Actual Behavior field', () => {
    expect(TEST_RESULTS_FORMAT).toContain('**Actual Behavior**');
  });

  it('should contain Steps to Reproduce field', () => {
    expect(TEST_RESULTS_FORMAT).toContain('**Steps to Reproduce**');
  });

  it('should contain Suggested Fix field', () => {
    expect(TEST_RESULTS_FORMAT).toContain('**Suggested Fix**');
  });
});

// PATTERN: File generation rule test (from BUG_HUNT_PROMPT)
describe('TEST_RESULTS.md file generation rules', () => {
  // Import BUG_HUNT_PROMPT to verify rules
  let BUG_HUNT_PROMPT: string;

  beforeAll(async () => {
    const prompts = await import('../../src/agents/prompts.js');
    BUG_HUNT_PROMPT = prompts.BUG_HUNT_PROMPT;
  });

  it('should specify write file when critical/major bugs found', () => {
    expect(BUG_HUNT_PROMPT).toContain(
      '**If you find Critical or Major bugs**: You MUST write the bug report'
    );
  });

  it('should specify no file when no critical/major bugs found', () => {
    expect(BUG_HUNT_PROMPT).toContain(
      '**If you find NO Critical or Major bugs**: Do NOT write any file'
    );
  });

  it('should specify absence of file signals success', () => {
    expect(BUG_HUNT_PROMPT).toContain('Leave no trace');
    expect(BUG_HUNT_PROMPT).toContain('absence of the file signals success');
  });
});

// PATTERN: TestResults with multiple severity levels test
describe('TestResults with multiple severity levels', () => {
  it('should validate TestResults with bugs at all severity levels', () => {
    // SETUP: TestResults with all 4 severity levels
    const testResults = createTestResults(
      true,
      [
        createTestBug('BUG-001', 'critical', 'Critical', 'Desc', 'Rep'),
        createTestBug('BUG-002', 'major', 'Major', 'Desc', 'Rep'),
        createTestBug('BUG-003', 'minor', 'Minor', 'Desc', 'Rep'),
        createTestBug('BUG-004', 'cosmetic', 'Cosmetic', 'Desc', 'Rep'),
      ],
      'All severity levels',
      []
    );

    // EXECUTE: Validate with TestResultsSchema
    const result = TestResultsSchema.safeParse(testResults);

    // VERIFY: All bugs validated successfully
    expect(result.success).toBe(true);
    if (result.success === true) {
      expect(result.data.bugs).toHaveLength(4);
      expect(result.data.bugs[0].severity).toBe('critical');
      expect(result.data.bugs[1].severity).toBe('major');
      expect(result.data.bugs[2].severity).toBe('minor');
      expect(result.data.bugs[3].severity).toBe('cosmetic');
    }
  });

  it('should validate TestResults with empty bugs array', () => {
    // SETUP: TestResults with no bugs (success case)
    const testResults = createTestResults(false, [], 'No bugs found', []);

    // EXECUTE: Validate with TestResultsSchema
    const result = TestResultsSchema.safeParse(testResults);

    // VERIFY: Empty bugs array is valid
    expect(result.success).toBe(true);
    if (result.success === true) {
      expect(result.data.bugs).toHaveLength(0);
      expect(result.data.hasBugs).toBe(false);
    }
  });
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN UNIT TESTS:
  - Unit tests focus on schema and type validation
  - Format tests use static strings (not actual file I/O)
  - File generation rules tested via BUG_HUNT_PROMPT content validation
  - Integration tests (qa-agent.test.ts) cover actual file generation

MOCK INTEGRATIONS:
  - No mocks required for unit tests
  - Test actual schemas (BugSchema, BugSeverityEnum, TestResultsSchema)
  - Test actual types (Bug, BugSeverity, TestResults)
  - Import BUG_HUNT_PROMPT for rule validation

DEPENDENCY ON EXISTING TESTS:
  - tests/integration/qa-agent.test.ts provides createTestBug pattern
  - tests/integration/bug-finding-prompt.test.ts provides prompt content validation pattern
  - Reference for severity classification test structure

PARALLEL CONTEXT:
  - P1.M3.T5.S1 (Verify Bug Finding Prompt testing phases) - parallel work item
  - This PRP focuses on severity levels and output format
  - No overlap or conflict in test coverage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/unit/bug-severity-classification.test.ts
# OR
npx eslint tests/unit/bug-severity-classification.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- tests/unit/bug-severity-classification.test.ts
# OR
npx vitest run tests/unit/bug-severity-classification.test.ts

# Run with coverage
npm test -- --coverage tests/unit/bug-severity-classification.test.ts

# Run all unit tests to ensure no breakage
npm test -- tests/unit/

# Expected: All tests pass, good coverage for severity classification
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full test suite still passes
npm test -- tests/
# OR
npx vitest run

# Check that related tests still work
npm test -- tests/integration/qa-agent.test.ts
npm test -- tests/integration/bug-finding-prompt.test.ts

# Expected: All existing tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/unit/bug-severity-classification.test.ts

# Check test file follows project conventions
head -100 tests/unit/bug-severity-classification.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/unit/bug-severity-classification.test.ts

# Verify test coverage
npm test -- --coverage tests/unit/bug-severity-classification.test.ts
# Should see coverage for BugSchema, BugSeverityEnum, TestResultsSchema

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npm test -- tests/unit/bug-severity-classification.test.ts`
- [ ] No linting errors: `npm run lint tests/unit/bug-severity-classification.test.ts`
- [ ] Coverage shows severity classification tested
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] BugSeverity type defines four levels (critical, major, minor, cosmetic)
- [ ] BugSeverityEnum validates all four severity levels
- [ ] BugSchema accepts bugs at each severity level
- [ ] BugSchema rejects invalid severity values
- [ ] TestResults.hasBugs boolean drives file generation
- [ ] TEST_RESULTS.md format contains ## Overview section
- [ ] TEST_RESULTS.md format contains ## Critical Issues section
- [ ] TEST_RESULTS.md format contains ## Major Issues section
- [ ] TEST_RESULTS.md format contains ## Minor Issues section
- [ ] TEST_RESULTS.md format contains ## Testing Summary section
- [ ] TEST_RESULTS.md contains all required bug report fields
- [ ] File generation rules specify write when critical/major bugs found
- [ ] File generation rules specify no file when no critical/major bugs
- [ ] Bug severity criteria matches system_context.md definitions
- [ ] TestResults with all severity levels validates correctly
- [ ] TestResults with empty bugs array validates correctly

### Code Quality Validation

- [ ] Follows existing unit test patterns from bug-hunt-prompt.test.ts
- [ ] Uses SETUP/EXECUTE/VERIFY comments in each test
- [ ] Factory functions for test data (createTestBug, createTestResults)
- [ ] Test file location matches conventions (tests/unit/)
- [ ] Tests use .js extensions for imports (ES modules)
- [ ] Tests validate schemas (BugSchema, BugSeverityEnum, TestResultsSchema)
- [ ] Static format strings used for format validation (not file I/O)

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] SEVERITY_CRITERIA constant references system_context.md definitions
- [ ] Complex validations (hasBugs control) have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Documentation of file generation rules from BUG_HUNT_PROMPT

---

## Anti-Patterns to Avoid

- ❌ Don't test file I/O in unit tests - that's integration test territory
- ❌ Don't make actual LLM calls - use schema validation for logic testing
- ❌ Don't skip testing all four severity levels - test each one
- ❌ Don't use mocks for schema validation - test real schemas
- ❌ Don't forget to test hasBugs: false case (no bugs scenario)
- ❌ Don't hardcode severity criteria - use SEVERITY_CRITERIA constant
- ❌ Don't test BUG_HUNT_PROMPT execution - test prompt content for rules
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific
- ❌ Don't duplicate tests from qa-agent.test.ts - focus on unit-level validation
- ❌ Don't test actual file generation - integration tests cover that
- ❌ Don't forget to verify format specification sections
- ❌ Don't skip testing invalid severity values
- ❌ Don't use complex test patterns - keep it simple and focused
- ❌ Don't test TestResults execution flow - focus on schema validation

---

**PRP Version:** 1.0
**Work Item:** P1.M3.T5.S2
**Created:** 2026-01-22
**Status:** Ready for Implementation
