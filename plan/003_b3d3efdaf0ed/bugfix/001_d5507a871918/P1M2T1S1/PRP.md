# PRP: Add writeBugReport Method to BugHuntWorkflow

## Goal

**Feature Goal**: Add a `writeBugReport` method to `BugHuntWorkflow` that persists `TEST_RESULTS.md` to disk when critical or major bugs are found during the bug hunt workflow.

**Deliverable**: A public async method `writeBugReport(sessionPath: string, testResults: TestResults): Promise<void>` in the `BugHuntWorkflow` class that:

- Checks if `testResults` contains critical or major bugs (severity 'critical' or 'major')
- Constructs file path as `resolve(sessionPath, 'TEST_RESULTS.md')`
- Writes file using atomic write-then-rename pattern from existing `atomicWrite` utility
- Validates `testResults` before writing using Zod schema
- Throws descriptive error if write fails

**Success Definition**:

- Method is callable after `generateReport()` completes
- `TEST_RESULTS.md` is written to the session directory when `hasBugs` is `true`
- File contains properly formatted JSON of the `TestResults` object
- Atomic write pattern ensures no partial/corrupt files on process crash
- All unit tests pass with 100% coverage of the new method

## Why

- **Bug Fix Pipeline Integration**: PRD §4.4 requires `TEST_RESULTS.md` to be written when bugs are found to trigger the bug fix sub-pipeline. Currently, `BugHuntWorkflow` returns `TestResults` object but does not persist it, breaking the expected workflow.
- **Data Persistence**: Writing bug reports to disk enables the `FixCycleWorkflow` to read and process bugs for fixing (subtask P1.M2.T2).
- **Session Auditing**: Persisted `TEST_RESULTS.md` provides an immutable audit trail of QA findings for each session.
- **Atomic Safety**: Using atomic write pattern prevents data corruption if process crashes during write, ensuring `TEST_RESULTS.md` is never in a partial state.

## What

### User-Visible Behavior

When the bug hunt workflow completes and finds critical or major bugs:

1. The workflow calls `writeBugReport(sessionPath, testResults)` after `generateReport()`
2. A `TEST_RESULTS.md` file is created in the session directory containing the bug report
3. The file contains structured JSON data with all bug details, severity, and recommendations
4. The file is written atomically to prevent corruption

### Success Criteria

- [ ] `writeBugReport` method exists on `BugHuntWorkflow` class
- [ ] Method accepts `sessionPath: string` and `testResults: TestResults` parameters
- [ ] Method validates `testResults` using Zod `TestResultsSchema` before writing
- [ ] Method checks for critical or major bugs before writing (severity 'critical' or 'major')
- [ ] File is written to `resolve(sessionPath, 'TEST_RESULTS.md')`
- [ ] Atomic write pattern is used (temp file + rename via `atomicWrite` utility)
- [ ] Method throws descriptive error if write fails
- [ ] All unit tests pass (including new tests for `writeBugReport`)
- [ ] 100% code coverage maintained for `BugHuntWorkflow`

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES. This PRP provides:

- Complete existing class structure with all imports and dependencies
- Exact file path and location to modify
- Existing code patterns to follow (atomicWrite, error handling, logging)
- Complete type definitions for `TestResults`, `Bug`, and `BugSeverity`
- Test patterns and framework setup (Vitest with mocks)
- Validation commands specific to this project

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/workflows/bug-hunt-workflow.ts
  why: Complete class structure, existing methods, logging patterns, error handling
  pattern: Input validation in constructor, correlation logging, @Step decorators
  gotcha: Constructor validates prdContent and completedTasks - follow this pattern for writeBugReport

- file: src/core/session-utils.ts
  why: Contains atomicWrite function that MUST be used for file operations
  pattern: Lines 98-182 show complete atomicWrite implementation
  gotcha: ALWAYS use atomicWrite() for file writes - never direct fs.writeFile
  critical: Import atomicWrite from '../core/session-utils.js'

- file: src/core/models.ts
  why: Contains TestResults, Bug, and BugSeverity type definitions
  pattern: Lines 1838-1879 for TestResults, lines 1710-1771 for Bug
  gotcha: TestResults has readonly fields - use as const assertion

- file: src/core/models.ts
  why: TestResultsSchema for Zod validation before writing
  pattern: Import and use TestResultsSchema.parse(testResults)
  gotcha: Validation throws ZodError on invalid data - catch and wrap in descriptive error

- file: tests/unit/workflows/bug-hunt-workflow.test.ts
  why: Test patterns, factory functions, mock setup for BugHuntWorkflow
  pattern: createTestResults, createTestBug factory functions
  gotcha: Mock fs operations for file write tests - no real I/O in tests

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T1S1/research/nodejs-fs-best-practices.md
  why: Node.js fs.promises API documentation for writeFile, rename, unlink
  section: Error Handling Patterns

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T1S1/research/atomic-write-patterns.md
  why: Atomic write pattern explanation and implementation
  section: The Standard Pattern

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T1S1/research/json-patterns.md
  why: JSON.stringify patterns for TestResults serialization
  section: JSON.stringify with null and 2-space indentation

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T1S1/research/path-resolution.md
  why: path.resolve() usage for constructing file paths
  section: path.resolve() vs path.join()
```

### Current Codebase Tree

```bash
src/
├── workflows/
│   ├── bug-hunt-workflow.ts       # TARGET FILE - Add writeBugReport method here
│   ├── fix-cycle-workflow.ts      # Will read TEST_RESULTS.md in future subtask
│   └── prp-pipeline.ts            # Orchestrates BugHuntWorkflow
├── core/
│   ├── session-utils.ts           # Contains atomicWrite utility function
│   └── models.ts                  # TestResults, Bug, BugSeverity, TestResultsSchema
├── agents/
│   ├── agent-factory.ts           # createQAAgent factory
│   └── prompts/
│       └── bug-hunt-prompt.ts     # Bug hunt prompt generator
└── utils/
    ├── logger.ts                  # getLogger for correlation logging
    └── retry.ts                   # retryAgentPrompt utility

tests/
├── unit/
│   └── workflows/
│       └── bug-hunt-workflow.test.ts  # Add tests for writeBugReport here
└── setup.ts                       # Global test setup
```

### Desired Codebase Tree

```bash
src/workflows/bug-hunt-workflow.ts
├── [EXISTING] Constructor, analyzeScope, creativeE2ETesting, adversarialTesting, generateReport, run
└── [NEW] writeBugReport(sessionPath: string, testResults: TestResults): Promise<void>
    ├── Validates sessionPath and testResults
    ├── Checks for critical or major bugs
    ├── Validates with TestResultsSchema
    ├── Serializes to JSON with JSON.stringify(testResults, null, 2)
    ├── Writes atomically using atomicWrite()
    ├── Logs success/failure
    └── Throws descriptive errors

tests/unit/workflows/bug-hunt-workflow.test.ts
├── [EXISTING] Constructor, phase methods, generateReport, run tests
└── [NEW] writeBugReport test suite
    ├── Constructor validation tests
    ├── No critical/major bugs test (should not write)
    ├── Critical/major bugs present test (should write)
    ├── File path construction test
    ├── Atomic write usage test
    ├── Error handling tests
    └── Mock fs operations
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Always use atomicWrite() from session-utils.ts
// NEVER use fs.writeFile directly - atomic pattern prevents data corruption
import { atomicWrite } from '../core/session-utils.js';

// CRITICAL: TestResults fields are readonly - use proper type assertion
const testResults: TestResults = {
  hasBugs: true,
  bugs: [...],
  summary: '...',
  recommendations: [...]
} as const;  // or ensure proper type construction

// CRITICAL: TestResultsSchema.parse() throws ZodError on invalid data
// Wrap in try-catch and provide descriptive error message
import { TestResultsSchema } from '../core/models.js';
try {
  const validated = TestResultsSchema.parse(testResults);
} catch (error) {
  throw new Error(`Invalid TestResults: ${error}`);
}

// GOTCHA: BugHuntWorkflow uses correlationLogger.child() for logging
// Access via (this as any).correlationLogger or create private property
this.correlationLogger.info('[BugHuntWorkflow] Writing bug report', { ... });

// GOTCHA: Use path.resolve() for absolute paths, not path.join()
// path.join() preserves relative paths, path.resolve() creates absolute paths
import { resolve } from 'node:path';
const resultsPath = resolve(sessionPath, 'TEST_RESULTS.md');

// GOTCHA: Severity check must filter for 'critical' OR 'major'
// TestResults.hasBugs already indicates this, but double-check for safety
const hasCriticalOrMajor = testResults.bugs.some(
  bug => bug.severity === 'critical' || bug.severity === 'major'
);

// GOTCHA: Groundswell @Step decorator is optional for new methods
// Only add @Step decorator if you want timing tracking
// writeBugReport doesn't need @Step - it's a helper method

// GOTCHA: File write tests should mock fs operations
// Never write actual files in unit tests - use vi.mock()
vi.mock('node:fs/promises');
```

## Implementation Blueprint

### Data Models and Structure

The TestResults type is already defined in `src/core/models.ts`:

```typescript
export interface TestResults {
  readonly hasBugs: boolean; // Indicates if critical/major bugs found
  readonly bugs: Bug[]; // Array of all bugs found
  readonly summary: string; // High-level testing summary
  readonly recommendations: string[]; // Recommended fixes
}

export interface Bug {
  readonly id: string; // Unique identifier (e.g., 'BUG-001')
  readonly severity: BugSeverity; // 'critical' | 'major' | 'minor' | 'cosmetic'
  readonly title: string; // Brief title (max 200 chars)
  readonly description: string; // Detailed explanation
  readonly reproduction: string; // Step-by-step reproduction
  readonly location?: string; // Optional file/function location
}

export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: ADD import for atomicWrite and resolve
  - LOCATION: Top of src/workflows/bug-hunt-workflow.ts after existing imports
  - ADD: import { resolve } from 'node:path';
  - ADD: import { atomicWrite } from '../core/session-utils.js';
  - ADD: import { TestResultsSchema } from '../core/models.js';
  - PATTERN: Follow existing import structure (node imports first, then local imports)
  - GOTCHA: Use .js extension for all local imports (ESM module requirement)

Task 2: ADD writeBugReport method to BugHuntWorkflow class
  - LOCATION: After generateReport() method, before run() method
  - IMPLEMENT: public async writeBugReport(sessionPath: string, testResults: TestResults): Promise<void>
  - SIGNATURE:
    /**
     * Writes bug report to TEST_RESULTS.md in session directory
     *
     * @param sessionPath - Absolute path to session directory
     * @param testResults - Test results to persist
     * @throws {Error} If sessionPath is invalid or write fails
     * @remarks
     * Only writes if critical or major bugs are present. Uses atomic
     * write pattern to prevent corruption. Validates with Zod before writing.
     */
  - VALIDATION: Check sessionPath is non-empty string
  - VALIDATION: Check testResults contains critical or major bugs
  - VALIDATION: Use TestResultsSchema.parse(testResults) for Zod validation
  - SERIALIZATION: JSON.stringify(testResults, null, 2) for 2-space indentation
  - PATH: resolve(sessionPath, 'TEST_RESULTS.md') for absolute file path
  - WRITE: await atomicWrite(resultsPath, content) for atomic file write
  - LOGGING: Use this.correlationLogger for info/debug/error logging
  - ERROR HANDLING: Wrap atomicWrite in try-catch, throw descriptive error
  - PATTERN: Follow generateReport() error handling pattern (lines 297-307)

Task 3: UPDATE BugHuntWorkflow type definition
  - LOCATION: In BugHuntWorkflow class body (after run() method)
  - VERIFY: No type changes needed - method is public async
  - DOCUMENTATION: Add JSDoc comment to method (see Task 2)

Task 4: ADD unit tests for writeBugReport method
  - LOCATION: tests/unit/workflows/bug-hunt-workflow.test.ts
  - ADD: describe('writeBugReport', () => { ... }) after run() tests
  - MOCK: vi.mock('node:fs/promises') for writeFile, rename operations
  - MOCK: vi.mock('../../../src/core/session-utils.js') for atomicWrite
  - TEST CASES:
    1. Should throw if sessionPath is empty
    2. Should throw if testResults.hasBugs is false
    3. Should not write if no critical or major bugs (hasBugs false)
    4. Should validate testResults with TestResultsSchema
    5. Should construct correct file path with resolve()
    6. Should call atomicWrite with correct parameters
    7. Should log success message on successful write
    8. Should throw descriptive error on atomicWrite failure
    9. Should pass sessionPath and testResults correctly
  - PATTERN: Follow existing test structure (Setup/Execute/Verify)
  - FACTORY: Use existing createTestResults(), createTestBug() helpers

Task 5: VERIFY existing tests still pass
  - RUN: npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts
  - VERIFY: All existing tests pass
  - VERIFY: New writeBugReport tests pass
  - COVERAGE: Ensure 100% coverage maintained
  - PATTERN: Run tests after implementation to catch regressions
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Method Signature with JSDoc
/**
 * Writes bug report to TEST_RESULTS.md in session directory
 *
 * @param sessionPath - Absolute path to session directory
 * @param testResults - Test results to persist
 * @throws {Error} If sessionPath is invalid or write fails
 * @remarks
 * Only writes if critical or major bugs are present. Uses atomic
 * write pattern to prevent corruption. Validates with Zod before writing.
 */
public async writeBugReport(sessionPath: string, testResults: TestResults): Promise<void>

// Pattern 2: Input Validation (follow constructor pattern)
if (typeof sessionPath !== 'string' || sessionPath.trim() === '') {
  throw new Error('sessionPath must be a non-empty string');
}

// Pattern 3: Severity Checking
const hasCriticalOrMajor = testResults.bugs.some(
  bug => bug.severity === 'critical' || bug.severity === 'major'
);
if (!hasCriticalOrMajor) {
  this.correlationLogger.info(
    '[BugHuntWorkflow] No critical or major bugs - skipping bug report write'
  );
  return;
}

// Pattern 4: Zod Validation
try {
  const validated = TestResultsSchema.parse(testResults);
} catch (error) {
  throw new Error(`Invalid TestResults provided to writeBugReport: ${error}`);
}

// Pattern 5: JSON Serialization with 2-space indentation
const content = JSON.stringify(testResults, null, 2);

// Pattern 6: Path Construction with resolve()
const resultsPath = resolve(sessionPath, 'TEST_RESULTS.md');

// Pattern 7: Atomic Write with Error Handling
try {
  this.correlationLogger.info(
    '[BugHuntWorkflow] Writing bug report',
    { resultsPath, bugCount: testResults.bugs.length }
  );
  await atomicWrite(resultsPath, content);
  this.correlationLogger.info(
    '[BugHuntWorkflow] Bug report written successfully',
    { resultsPath }
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.correlationLogger.error(
    '[BugHuntWorkflow] Failed to write bug report',
    { error: errorMessage, resultsPath }
  );
  throw new Error(`Failed to write bug report to ${resultsPath}: ${errorMessage}`);
}

// Pattern 8: Correlation Logging (follow existing pattern)
this.correlationLogger.info('[BugHuntWorkflow] Writing bug report', {
  resultsPath,
  hasBugs: testResults.hasBugs,
  bugCount: testResults.bugs.length,
  criticalCount: testResults.bugs.filter(b => b.severity === 'critical').length,
  majorCount: testResults.bugs.filter(b => b.severity === 'major').length,
});

// Pattern 9: Test Mock Setup
vi.mock('../../../src/core/session-utils.js', () => ({
  atomicWrite: vi.fn(),
}));
import { atomicWrite } from '../../../src/core/session-utils.js';
const mockAtomicWrite = atomicWrite as any;

// Pattern 10: Test Factory Usage
const testResults = createTestResults(
  true,  // hasBugs
  [createTestBug('BUG-001', 'critical', 'Bug', 'Desc', 'Rep')],
  'Found bugs',
  ['Fix']
);
```

### Integration Points

```yaml
FILESYSTEM:
  - operation: Atomic write to sessionPath/TEST_RESULTS.md
  - utility: atomicWrite() from src/core/session-utils.ts
  - pattern: Temp file + rename (handled by atomicWrite)
  - permissions: 0o644 (read/write owner, read-only others)

LOGGING:
  - logger: this.correlationLogger (existing instance)
  - level: info for success, error for failures, debug for details
  - context: Include resultsPath, bugCount, severity counts

VALIDATION:
  - schema: TestResultsSchema from src/core/models.ts
  - library: Zod (already imported in models.ts)
  - action: Parse and validate before serialization

ERROR_HANDLING:
  - type: Error with descriptive message
  - context: Include file path and original error message
  - pattern: Follow generateReport() error handling

TESTING:
  - framework: Vitest (already configured)
  - location: tests/unit/workflows/bug-hunt-workflow.test.ts
  - mocking: vi.mock for atomicWrite and fs operations
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after completing implementation - fix before proceeding
npm run lint  # Runs ESLint on src/
npm run format  # Runs Prettier to format code

# Check specific file
npx eslint src/workflows/bug-hunt-workflow.ts
npx prettier --check src/workflows/bug-hunt-workflow.ts

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test BugHuntWorkflow with new writeBugReport method
npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/workflows/bug-hunt-workflow.test.ts

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Verify 100% coverage for writeBugReport method.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test the complete workflow integration
npm test -- tests/integration/bug-hunt-workflow.integration.test.ts

# Manual verification (if integration test exists):
# 1. Create test session directory
# 2. Instantiate BugHuntWorkflow with mock PRD and tasks
# 3. Mock QA agent to return TestResults with bugs
# 4. Run workflow.run()
# 5. Call workflow.writeBugReport(sessionPath, results)
# 6. Verify TEST_RESULTS.md exists in session directory
# 7. Verify file content is valid JSON
# 8. Verify atomic write worked (no .tmp files left)

# Expected: Integration passes, TEST_RESULTS.md created with correct content.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual smoke test for writeBugReport functionality
# Create a simple test script:

cat > test-writereport.mjs << 'EOF'
import { BugHuntWorkflow } from './src/workflows/bug-hunt-workflow.js';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const testSessionPath = resolve(tmpdir(), 'test-bughunt-session');
await mkdir(testSessionPath, { recursive: true });

const workflow = new BugHuntWorkflow('# Test PRD\nBuild feature.', []);
const mockResults = {
  hasBugs: true,
  bugs: [{
    id: 'BUG-001',
    severity: 'critical',
    title: 'Test bug',
    description: 'Test description',
    reproduction: 'Step 1, Step 2'
  }],
  summary: 'Found 1 critical bug',
  recommendations: ['Fix bug']
};

await workflow.writeBugReport(testSessionPath, mockResults);
console.log('TEST_RESULTS.md written to:', testSessionPath);
EOF

node test-writereport.mjs

# Verify file exists and contains valid JSON
cat $(mktemp -d)/test-bughunt-session/TEST_RESULTS.md | jq .

# Expected: File is created, contains valid JSON with bug details.
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/workflows/bug-hunt-workflow.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format`
- [ ] 100% code coverage maintained for BugHuntWorkflow
- [ ] writeBugReport method exists and is public
- [ ] Method signature matches specification

### Feature Validation

- [ ] Method validates sessionPath parameter
- [ ] Method checks for critical or major bugs before writing
- [ ] Method validates testResults with TestResultsSchema
- [ ] File written to correct path: resolve(sessionPath, 'TEST_RESULTS.md')
- [ ] Atomic write pattern used via atomicWrite()
- [ ] JSON serialization uses 2-space indentation
- [ ] Success logging includes file path and bug counts
- [ ] Error handling throws descriptive errors
- [ ] No file written when hasBugs is false

### Code Quality Validation

- [ ] Follows existing BugHuntWorkflow patterns
- [ ] Uses correlationLogger for all logging
- [ ] JSDoc comment present and complete
- [ ] Error messages are descriptive and actionable
- [ ] Imports follow ESM .js extension convention
- [ ] TypeScript types are correct and explicit
- [ ] No console.log statements (use logger)

### Documentation & Deployment

- [ ] JSDoc comment explains purpose, parameters, and behavior
- [ ] @remarks section explains atomic write pattern
- [ ] @throws documents error conditions
- [ ] Code is self-documenting with clear variable names
- [ ] No TODO comments or placeholder code

---

## Anti-Patterns to Avoid

- ❌ Don't use direct `fs.writeFile` - ALWAYS use `atomicWrite()` utility
- ❌ Don't skip Zod validation - ALWAYS validate with `TestResultsSchema`
- ❌ Don't write if `hasBugs` is false - check severity before writing
- ❌ Don't use `console.log` - use `this.correlationLogger`
- ❌ Don't use `path.join()` for file paths - use `path.resolve()` for absolute paths
- ❌ Don't throw generic errors - provide descriptive error messages with context
- ❌ Don't forget to log both success and failure cases
- ❌ Don't write files in unit tests - mock `atomicWrite` function
- ❌ Don't skip checking for critical/major bugs - use filter or some()
- ❌ Don't use `JSON.stringify(testResults)` - use `JSON.stringify(testResults, null, 2)`
- ❌ Don't add `@Step` decorator - this is a helper method, not a workflow step
- ❌ Don't mutate testResults parameter - treat as readonly
- ❌ Don't catch and suppress errors - propagate with descriptive messages
- ❌ Don't use relative paths - always resolve to absolute paths
- ❌ Don't forget to import new dependencies (atomicWrite, resolve, TestResultsSchema)
