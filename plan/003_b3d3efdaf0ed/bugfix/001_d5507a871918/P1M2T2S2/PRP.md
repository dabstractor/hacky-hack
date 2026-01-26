# Product Requirement Prompt (PRP): Add loadBugReport Method to FixCycleWorkflow

---

## Goal

**Feature Goal**: Add a private `loadBugReport()` method to FixCycleWorkflow that reads and validates TEST_RESULTS.md from disk

**Deliverable**: A private async method `loadBugReport(): Promise<TestResults>` in FixCycleWorkflow that:
- Constructs file path using `resolve(this.sessionPath, 'TEST_RESULTS.md')`
- Validates file existence using `fs.access()`
- Reads file content using `fs.readFile()`
- Parses JSON with error handling
- Validates parsed object against TestResults Zod schema
- Returns validated TestResults or throws descriptive errors

**Success Definition**:
- Method successfully reads TEST_RESULTS.md from sessionPath
- File existence is validated before reading
- JSON is parsed and validated against TestResultsSchema
- Descriptive errors are thrown for missing/invalid files
- Method follows existing FixCycleWorkflow patterns (private method with `#` prefix, JSDoc, proper error handling)
- Unit tests pass covering all scenarios (file not found, invalid JSON, schema validation failure, success)

---

## All Needed Context

### Context Completeness Check

✅ **Passes "No Prior Knowledge" test**: This PRP provides complete context including:
- Exact file location and current implementation
- All dependencies and imports needed
- Specific patterns to follow from codebase
- Zod schema for validation
- Error handling patterns
- Test patterns and framework details
- Official Node.js fs/promises documentation URLs

### Documentation & References

```yaml
# MUST READ - Critical files for implementation

- file: src/workflows/fix-cycle-workflow.ts
  why: Target file where loadBugReport method will be added. Contains existing patterns for private methods, error handling, and sessionPath usage.
  pattern: Private methods use `#` prefix (e.g., #extractCompletedTasks, #createFixSubtask), JSDoc with @private tag, async/await, Promise return types
  gotcha: Method must be private (use `#` prefix), not underscore-prefixed. Follow existing JSDoc style with blank line after description.

- file: src/core/models.ts (lines 1838-1907)
  why: Contains TestResults interface definition and TestResultsSchema Zod validator needed for runtime validation
  pattern: Zod schema validation pattern: TestResultsSchema.parse(parsedObject)
  gotcha: Must import both TestResults type and TestResultsSchema from '../core/models.js'

- file: src/workflows/bug-hunt-workflow.ts (lines 323-380)
  why: Contains writeBugReport method showing the inverse operation - how TEST_RESULTS.md is written
  pattern: Path construction with resolve(), Zod validation before processing, correlationLogger usage, structured error messages
  gotcha: Notice the Zod validation pattern and error handling style - mirror this for reading

- file: src/core/session-utils.ts
  why: Contains readTasksJSON() method showing exact pattern for reading JSON files with validation
  pattern: readFile() with 'utf-8' encoding, JSON.parse(), Zod validation with BacklogSchema.parse(), SessionFileError for errors
  critical: This is the canonical pattern for JSON file reading in the codebase - follow it exactly

- file: tests/unit/workflows/fix-cycle-workflow.test.ts
  why: Shows existing test structure, mocking patterns, and assertion patterns for FixCycleWorkflow
  pattern: Vitest framework, beforeEach hooks, factory functions for test data, vi.mock() for dependencies
  gotcha: Tests use _fixTasksForTesting getter to access private state - follow similar pattern for testing loadBugReport

- file: src/utils/errors.ts (lines 1-150)
  why: Contains SessionFileError class and PipelineError hierarchy for proper error handling
  pattern: Custom error classes with path, operation, code fields, descriptive error messages
  critical: Use SessionFileError for file operation errors to match codebase patterns

- url: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
  why: Official Node.js documentation for fs.promises.readFile() - understand encoding options and error handling
  critical: Use 'utf-8' encoding (not 'utf8') to match codebase convention

- url: https://nodejs.org/api/fs.html#fspromisesaccesspath-mode
  why: Official Node.js documentation for fs.promises.access() - file existence and permission checking
  critical: Use constants.F_OK for existence check

- url: https://nodejs.org/api/path.html#pathresolvepaths
  why: Official Node.js documentation for path.resolve() - cross-platform absolute path construction
  critical: Always use resolve() for path construction, never string concatenation

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/research/fs-promises-research.md
  why: Contains comprehensive research on fs/promises patterns with TypeScript examples and error handling best practices
  section: Complete Example: JSON Configuration Reader (lines 565-680) - shows production-ready pattern
```

### Current Codebase Tree (relevant sections)

```bash
src/
├── workflows/
│   ├── fix-cycle-workflow.ts          # TARGET FILE - Add loadBugReport method here
│   ├── bug-hunt-workflow.ts           # REFERENCE - Shows writeBugReport pattern
│   └── prp-pipeline.ts                # REFERENCE - Shows how FixCycleWorkflow is used
├── core/
│   ├── models.ts                      # TestResults interface and TestResultsSchema
│   └── session-utils.ts               # readTasksJSON() pattern for JSON reading
└── utils/
    ├── errors.ts                      # SessionFileError class
    └── logger.ts                      # Logger patterns

tests/
└── unit/
    └── workflows/
        └── fix-cycle-workflow.test.ts # Add tests for loadBugReport here
```

### Desired Codebase Tree (changes only)

```bash
# No new files - modify existing files:

src/workflows/fix-cycle-workflow.ts
  - ADD: Import { readFile, access, constants } from 'node:fs/promises'
  - ADD: Import { resolve } from 'node:path'
  - ADD: Import { TestResultsSchema } from '../core/models.js'
  - ADD: Private async method #loadBugReport(): Promise<TestResults>

tests/unit/workflows/fix-cycle-workflow.test.ts
  - ADD: Test suite for loadBugReport method
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: Private methods use # prefix, not _ prefix
// Example from fix-cycle-workflow.ts line 387
#extractCompletedTasks(): Task[] { }
// NOT: _extractCompletedTasks()

// CRITICAL: JSDoc style - blank line after description, then @param/@returns
/**
 * Extract completed tasks from session backlog
 *
 * @returns Array of completed Task objects
 * @private
 */

// CRITICAL: Use 'utf-8' encoding (not 'utf8') to match codebase convention
// From session-utils.ts line 57
const content = await readFile(tasksPath, 'utf-8');

// CRITICAL: Always use resolve() for path construction, never string concatenation
// From bug-hunt-workflow.ts line 357
const resultsPath = resolve(sessionPath, 'TEST_RESULTS.md');

// CRITICAL: Zod validation must use .parse() (throws on error) not .safeParse()
// From bug-hunt-workflow.ts line 346
TestResultsSchema.parse(testResults);

// CRITICAL: Import paths use .js extension even for .ts files (ESM)
import { TestResults } from '../core/models.js';  // NOT models.ts

// CRITICAL: Error handling pattern - use descriptive messages with context
// From bug-hunt-workflow.ts line 348
throw new Error(`Invalid TestResults provided to writeBugReport: ${error}`);

// CRITICAL: File existence check uses constants.F_OK
// From fs/promises research
await access(filePath, constants.F_OK);

// CRITICAL: SessionFileError constructor signature
// From session-utils.ts
new SessionFileError(path, operation, cause)

// CRITICAL: Logger usage - use correlationLogger for tracing
// From fix-cycle-workflow.ts line 120
this.correlationLogger.info('[FixCycleWorkflow] Message', { context });

// CRITICAL: Test framework is Vitest, not Jest or Mocha
// From vitest.config.ts and package.json

// CRITICAL: Mock pattern uses vi.mock() and vi.fn()
// From fix-cycle-workflow.test.ts

// CRITICAL: Test-only accessors use _ prefix for public getters
// From fix-cycle-workflow.ts line 373
get _fixTasksForTesting(): Subtask[] { return this.#fixTasks; }

// CRITICAL: JSON.parse errors are SyntaxError instances
// From fs/promises research
if (error instanceof SyntaxError) { }
```

---

## Implementation Blueprint

### Data Models and Structure

**No new models needed** - using existing TestResults interface and TestResultsSchema from src/core/models.ts:

```typescript
// From src/core/models.ts lines 1838-1880
export interface TestResults {
  readonly hasBugs: boolean;
  readonly bugs: Bug[];
  readonly summary: string;
  readonly recommendations: string[];
}

// From src/core/models.ts lines 1902-1907
export const TestResultsSchema: z.ZodType<TestResults> = z.object({
  hasBugs: z.boolean(),
  bugs: z.array(BugSchema),
  summary: z.string().min(1, 'Summary is required'),
  recommendations: z.array(z.string()).min(0),
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: UPDATE src/workflows/fix-cycle-workflow.ts - Add imports
  - ADD import: { readFile, access, constants } from 'node:fs/promises'
  - ADD import: { resolve } from 'node:path'
  - ADD import: { TestResultsSchema } from '../core/models.js'
  - PLACEMENT: Top of file, after existing imports (around line 36)
  - PATTERN: Follow existing import style with blank line between node imports and local imports

Task 2: ADD private method #loadBugReport() to FixCycleWorkflow
  - IMPLEMENT: private async #loadBugReport(): Promise<TestResults>
  - LOCATION: After #extractCompletedTasks() method (after line 407)
  - METHOD SIGNATURE: private async #loadBugReport(): Promise<TestResults>

  METHOD IMPLEMENTATION:
  1. Construct file path: const resultsPath = resolve(this.sessionPath, 'TEST_RESULTS.md');
  2. Check file existence:
     try {
       await access(resultsPath, constants.F_OK);
     } catch (error) {
       if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
         throw new Error(`TEST_RESULTS.md not found at ${resultsPath}`);
       }
       throw new SessionFileError(resultsPath, 'access', error as Error);
     }
  3. Read file content:
     const content = await readFile(resultsPath, 'utf-8');
  4. Parse JSON:
     let parsed: unknown;
     try {
       parsed = JSON.parse(content);
     } catch (error) {
       throw new Error(`Failed to parse TEST_RESULTS.md at ${resultsPath}: ${error}`);
     }
  5. Validate with Zod:
     try {
       return TestResultsSchema.parse(parsed) as TestResults;
     } catch (error) {
       throw new Error(`Invalid TestResults in TEST_RESULTS.md at ${resultsPath}: ${error}`);
     }

  - JSDOC: Follow existing pattern with blank line after description
  - LOGGING: Use correlationLogger for info/debug, logger for errors
  - ERROR HANDLING: Specific errors for ENOENT, JSON parse failures, Zod validation failures
  - NAMING: Use #loadBugReport (private method convention)

  JSDoc Template:
  /**
   * Load bug report from TEST_RESULTS.md in session directory
   *
   * @returns Parsed and validated TestResults object
   * @throws {Error} If TEST_RESULTS.md not found or contains invalid data
   * @private
   */

Task 3: CREATE tests for #loadBugReport() method
  - FILE: tests/unit/workflows/fix-cycle-workflow.test.ts
  - ADD: describe block for loadBugReport method
  - TEST CASES:
    1. "should successfully load valid TEST_RESULTS.md"
       - Mock fs.promises.access to resolve
       - Mock fs.promises.readFile to return valid JSON
       - Expect TestResultsSchema.parse to be called
       - Expect returned TestResults object
    2. "should throw error if TEST_RESULTS.md not found"
       - Mock fs.promises.access to throw ENOENT error
       - Expect method to throw with "TEST_RESULTS.md not found" message
    3. "should throw error if JSON parsing fails"
       - Mock access to resolve
       - Mock readFile to return invalid JSON
       - Expect method to throw with "Failed to parse" message
    4. "should throw error if Zod validation fails"
       - Mock access to resolve
       - Mock readFile to return JSON with missing required fields
       - Mock TestResultsSchema.parse to throw ZodError
       - Expect method to throw with "Invalid TestResults" message

  - MOCKING: Use vi.mock() for 'node:fs/promises'
  - PATTERN: Follow existing test patterns in fix-cycle-workflow.test.ts
  - SETUP: Use beforeEach to clear mocks
  - ASSERTIONS: Use expect().toThrow() for error cases, expect().toHaveBeenCalledWith() for mock verification

  Test Pattern Template:
  describe('loadBugReport', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should successfully load valid TEST_RESULTS.md', async () => {
      // SETUP
      const mockTestResults = createMockTestResults();
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockTestResults));

      // EXECUTE
      const workflow = new FixCycleWorkflow(sessionPath, prdContent, orchestrator, sessionManager);
      const result = await workflow['_loadBugReport']();

      // VERIFY
      expect(access).toHaveBeenCalledWith(
        resolve(sessionPath, 'TEST_RESULTS.md'),
        constants.F_OK
      );
      expect(result).toEqual(mockTestResults);
    });
  });
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL IMPLEMENTATION PATTERNS - Follow these exactly
// ============================================================================

// PATTERN 1: Private method with # prefix (not underscore)
// Location: src/workflows/fix-cycle-workflow.ts after line 407
private async #loadBugReport(): Promise<TestResults> {
  // Implementation
}

// PATTERN 2: JSDoc style - blank line after description
/**
 * Load bug report from TEST_RESULTS.md in session directory
 *
 * @returns Parsed and validated TestResults object
 * @throws {Error} If TEST_RESULTS.md not found or contains invalid data
 * @private
 */
private async #loadBugReport(): Promise<TestResults> {
  // Implementation
}

// PATTERN 3: Path construction with resolve()
const resultsPath = resolve(this.sessionPath, 'TEST_RESULTS.md');

// PATTERN 4: File existence check with descriptive error
try {
  await access(resultsPath, constants.F_OK);
} catch (error) {
  const err = error as NodeJS.ErrnoException;
  if (err.code === 'ENOENT') {
    throw new Error(`TEST_RESULTS.md not found at ${resultsPath}`);
  }
  throw new SessionFileError(resultsPath, 'access', error as Error);
}

// PATTERN 5: Read file with 'utf-8' encoding
const content = await readFile(resultsPath, 'utf-8');

// PATTERN 6: JSON parsing with specific error handling
let parsed: unknown;
try {
  parsed = JSON.parse(content);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new Error(`Failed to parse TEST_RESULTS.md at ${resultsPath}: ${errorMessage}`);
}

// PATTERN 7: Zod validation with specific error handling
try {
  return TestResultsSchema.parse(parsed) as TestResults;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new Error(`Invalid TestResults in TEST_RESULTS.md at ${resultsPath}: ${errorMessage}`);
}

// PATTERN 8: Logging with correlation context
this.correlationLogger.info('[FixCycleWorkflow] Loading bug report', {
  resultsPath,
});

// PATTERN 9: Error logging with context
this.logger.error('[FixCycleWorkflow] Failed to load bug report', {
  resultsPath,
  error: errorMessage,
});

// PATTERN 10: Import organization
// Node imports first, then local imports
import { readFile, access, constants } from 'node:fs/promises';
import { resolve } from 'node:path';

import { TestResultsSchema } from '../core/models.js';
import { SessionFileError } from '../utils/errors.js';

// ============================================================================
// GOTCHAS - Avoid these common mistakes
// ============================================================================

// WRONG: Using underscore prefix for private method
// private async _loadBugReport(): Promise<TestResults> { }

// CORRECT: Using hash prefix for private method
// private async #loadBugReport(): Promise<TestResults> { }

// WRONG: String concatenation for paths
// const resultsPath = this.sessionPath + '/TEST_RESULTS.md';

// CORRECT: Using resolve() for paths
// const resultsPath = resolve(this.sessionPath, 'TEST_RESULTS.md');

// WRONG: Using 'utf8' encoding
// const content = await readFile(resultsPath, 'utf8');

// CORRECT: Using 'utf-8' encoding (matches codebase convention)
// const content = await readFile(resultsPath, 'utf-8');

// WRONG: Using .safeParse() for Zod validation
// const result = TestResultsSchema.safeParse(parsed);
// if (!result.success) { throw new Error(...); }

// CORRECT: Using .parse() for Zod validation (throws on error)
// return TestResultsSchema.parse(parsed) as TestResults;

// WRONG: Importing from .ts files
// import { TestResults } from '../core/models.ts';

// CORRECT: Importing from .js files (ESM requirement)
// import { TestResults } from '../core/models.js';

// WRONG: Generic error throwing
// throw new Error('File not found');

// CORRECT: Descriptive error with context
// throw new Error(`TEST_RESULTS.md not found at ${resultsPath}`);

// WRONG: Not using SessionFileError for file operation errors
// throw new Error('Failed to access file');

// CORRECT: Using SessionFileError for file operation errors
// throw new SessionFileError(resultsPath, 'access', error as Error);
```

### Integration Points

```yaml
# No integration points for this task - this is a standalone private method
# that will be called by FixCycleWorkflow.run() in a subsequent task (P1.M2.T2.S3)

# However, note the following context:

CONSTRUCTOR:
  - sessionPath is already available as this.sessionPath (from constructor)
  - No constructor changes needed for this task

DEPENDENCIES:
  - node:fs/promises (readFile, access, constants)
  - node:path (resolve)
  - src/core/models.js (TestResultsSchema)
  - src/utils/errors.js (SessionFileError) - optional but recommended

TESTING:
  - Vitest framework (already configured)
  - Mock node:fs/promises module
  - Follow existing test patterns in fix-cycle-workflow.test.ts
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after completing Task 1 and Task 2 (file modifications)

# Format the modified file
npx ruff format src/workflows/fix-cycle-workflow.ts

# Lint the modified file
npx ruff check src/workflows/fix-cycle-workflow.ts --fix

# Type check
npx tsc --noEmit src/workflows/fix-cycle-workflow.ts

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common issues:
# - Missing imports
# - Incorrect private method syntax (# vs _)
# - Type errors with TestResults
# - Missing SessionFileError import
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run after completing Task 3 (test implementation)

# Run only FixCycleWorkflow tests
npx vitest run tests/unit/workflows/fix-cycle-workflow.test.ts

# Run with coverage
npx vitest run tests/unit/workflows/fix-cycle-workflow.test.ts --coverage

# Expected: All tests pass, including new loadBugReport tests
# Coverage: Should maintain 100% coverage threshold

# If tests fail:
# 1. Check mock setup - are vi.mocked() and vi.fn() used correctly?
# 2. Check error assertions - are error messages exact matches?
# 3. Check async/await - are all async operations properly awaited?
# 4. Check imports - are all necessary modules mocked?
```

### Level 3: Integration Testing (System Validation)

```bash
# This task is a private method without external integration points
# Skip integration testing for this specific task

# However, verify the method can be instantiated:
npx ts-node -e "
import { FixCycleWorkflow } from './src/workflows/fix-cycle-workflow.js';
console.log('FixCycleWorkflow class loads successfully');
console.log('loadBugReport method will be tested in unit tests');
"

# Expected: No import errors or type errors
```

### Level 4: Manual Validation

```bash
# Verify code follows existing patterns by comparing to similar methods:

# Compare #loadBugReport to #extractCompletedTasks
grep -A 20 "#extractCompletedTasks" src/workflows/fix-cycle-workflow.ts

# Compare to readTasksJSON pattern
grep -A 30 "async function readTasksJSON" src/core/session-utils.ts

# Verify private method uses # prefix
grep "#loadBugReport" src/workflows/fix-cycle-workflow.ts

# Verify imports are correct
head -40 src/workflows/fix-cycle-workflow.ts | grep -E "(fs/promises|path|TestResultsSchema)"

# Expected: All patterns match codebase conventions
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 3 tasks completed successfully
- [ ] Imports added correctly (node:fs/promises, node:path, TestResultsSchema)
- [ ] Private method uses `#` prefix (not `_`)
- [ ] JSDoc follows existing pattern (blank line after description)
- [ ] Path construction uses `resolve()` (not string concatenation)
- [ ] File encoding is `'utf-8'` (not `'utf8'`)
- [ ] Zod validation uses `.parse()` (not `.safeParse()`)
- [ ] Error messages are descriptive with context
- [ ] SessionFileError used for file operation errors
- [ ] All imports use `.js` extension (ESM requirement)
- [ ] Code follows existing patterns in fix-cycle-workflow.ts
- [ ] No linting errors: `npx ruff check src/workflows/fix-cycle-workflow.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] All tests pass: `npx vitest run tests/unit/workflows/fix-cycle-workflow.test.ts`

### Feature Validation

- [ ] Method successfully reads TEST_RESULTS.md from sessionPath
- [ ] File existence is validated with `fs.access()` before reading
- [ ] JSON is parsed with `JSON.parse()` and error handling
- [ ] Parsed object is validated against `TestResultsSchema`
- [ ] Descriptive error thrown for ENOENT (file not found)
- [ ] Descriptive error thrown for JSON parse failures
- [ ] Descriptive error thrown for Zod validation failures
- [ ] Returns valid `TestResults` object on success
- [ ] Method is private (uses `#` prefix)
- [ ] Method has proper JSDoc documentation

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Uses correlationLogger for tracing
- [ ] Error messages include file path context
- [ ] No anti-patterns from "Anti-Patterns to Avoid" section
- [ ] TypeScript types are correct (Promise<TestResults>)
- [ ] Async/await used consistently
- [ ] No console.log or console.error (use logger)
- [ ] Code is self-documenting with clear variable names

### Test Validation

- [ ] All test cases implemented (4 scenarios)
- [ ] Tests use vi.mock() for fs/promises
- [ ] Tests follow existing patterns in fix-cycle-workflow.test.ts
- [ ] beforeEach hook clears mocks
- [ ] Error assertions use exact error message matching
- [ ] Success assertions verify return value
- [ ] Mock call assertions verify correct parameters
- [ ] All tests pass with 100% coverage
- [ ] Test names are descriptive and follow pattern

---

## Anti-Patterns to Avoid

- ❌ Don't use underscore prefix `_loadBugReport` - use hash prefix `#loadBugReport`
- ❌ Don't use string concatenation for paths - use `resolve()`
- ❌ Don't use `'utf8'` encoding - use `'utf-8'` to match codebase
- ❌ Don't use `.safeParse()` for Zod - use `.parse()` which throws on error
- ❌ Don't import from `.ts` files - import from `.js` files (ESM)
- ❌ Don't throw generic errors - include file path and operation context
- ❌ Don't skip file existence check - validate with `fs.access()` first
- ❌ Don't forget SessionFileError for file operation errors
- ❌ Don't use console.log - use correlationLogger or logger
- ❌ Don't make method public - must be private with `#` prefix
- ❌ Don't skip JSDoc - follow existing pattern with @private tag
- ❌ Don't forget to import TestResultsSchema - needed for validation
- ❌ Don't use synchronous file operations - use async fs/promises
- ❌ Don't forget error type narrowing - use `as NodeJS.ErrnoException`
- ❌ Don't skip unit tests - must cover all 4 scenarios

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Validation**: This PRP provides:
- ✅ Exact file location and line numbers for all modifications
- ✅ Complete implementation blueprint with dependency-ordered tasks
- ✅ Specific code patterns to follow from existing codebase
- ✅ All necessary imports and their exact sources
- ✅ Zod schema location and usage pattern
- ✅ Error handling patterns with specific error types
- ✅ Test patterns with framework details
- ✅ Official Node.js documentation URLs for fs/promises
- ✅ Comprehensive gotchas section avoiding common mistakes
- ✅ Validation checklist covering all aspects
- ✅ Anti-patterns section with specific mistakes to avoid

**Context Completeness**: An AI agent unfamiliar with this codebase can implement this feature successfully using only this PRP content and codebase access. All necessary context, patterns, and validation requirements are provided.
