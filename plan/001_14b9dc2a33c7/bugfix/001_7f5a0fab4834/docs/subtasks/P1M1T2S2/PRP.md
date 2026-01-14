# Product Requirement Prompt (PRP) - P1.M1.T2.S2: Analyze any remaining TypeScript errors

---

## Goal

**Feature Goal**: Implement `analyzeTypeScriptErrors()` function that consumes `TypecheckResult` from S1, categorizes errors by type (module-not-found, type-mismatch, other), groups by file, extracts file paths and line numbers, and returns structured analysis for consumption by S3 (module-not-found verification).

**Deliverable**:

- A new function `analyzeTypeScriptErrors()` in a TypeScript utility module
- Returns `ErrorAnalysisResult` interface with `{ categories: Record<string, number>, files: string[], errorsByFile: Record<string, ParsedTscError[]>, summary: ErrorSummary }`
- Unit tests with comprehensive coverage (Vitest framework)
- Integration with existing typecheck-runner output

**Success Definition**:

- Function consumes TypecheckResult from S1 correctly
- Errors are categorized by type: module-not-found (TS2307, TS2304, TS2305, TS2306, TS6053), type-mismatch (TS2322, TS2345, TS2741), other (all remaining codes)
- Errors are grouped by file with counts
- File paths and line numbers are extracted for each error
- Returns empty analysis when TypecheckResult.success is true (skip to S3)
- All tests pass (unit + integration)

## User Persona (if applicable)

**Target User**: Build system / Automated pipeline / Developer

**Use Case**: After running TypeScript typecheck (S1), analyze remaining errors to determine if Groundswell link was successful and identify other issues.

**User Journey**:

1. Pipeline executes P1.M1.T2.S1 (runTypecheck) which returns TypecheckResult
2. If success is false, pipeline calls `analyzeTypeScriptErrors()` with the result
3. Function categorizes errors and returns structured analysis
4. Pipeline uses analysis to determine next action:
   - If only module-not-found errors for groundswell: Revisit linking
   - If no module-not-found errors: Proceed to S3 (verification)
   - If other errors: Report to developer for investigation

**Pain Points Addressed**:

- Manual error analysis after TypeScript compilation
- No automated categorization of TypeScript error types
- Difficult to identify which files are affected by errors
- No programmatic way to determine if errors are module-related vs type-related

## Why

- **Integration with P1.M1.T2.S1**: Consumes TypecheckResult output and adds categorization layer
- **Foundation for S3**: Output determines whether module-not-found verification is needed
- **Build verification**: Enables automated assessment of TypeScript compilation health
- **Debugging assistance**: Structured error grouping guides developers to affected files

## What

Implement `analyzeTypeScriptErrors()` function that:

1. Accepts `TypecheckResult` from S1 as input
2. Returns early with empty analysis if `success` is true (no errors to analyze)
3. Categorizes each error by type using error code ranges:
   - `module-not-found`: TS2307, TS2304, TS2305, TS2306, TS2688, TS6053
   - `type-mismatch`: TS2322, TS2345, TS2741
   - `other`: All remaining error codes
4. Groups errors by file path
5. Extracts and counts file paths, line numbers, error codes
6. Returns structured result with categories count, files list, errors by file, and summary

### Success Criteria

- [ ] Function accepts TypecheckResult from S1 correctly
- [ ] Returns early with empty analysis when TypecheckResult.success is true
- [ ] Categorizes TS2307 errors as "module-not-found"
- [ ] Categorizes TS2322, TS2345, TS2741 as "type-mismatch"
- [ ] Categorizes all other codes as "other"
- [ ] Groups errors by file path with correct counts
- [ ] Extracts file paths and line numbers for each error
- [ ] Returns ErrorAnalysisResult with correct structure
- [ ] All unit tests pass with mocked data
- [ ] Follows existing patterns from typecheck-runner.ts

---

## All Needed Context

### Context Completeness Check

**Before implementing, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

✓ **Yes** - This PRP provides:

- Exact input contract from S1 (TypecheckResult interface)
- Complete error categorization logic with code ranges
- Test patterns from existing test files
- Grouping and aggregation patterns from existing code
- All necessary imports and exports

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/utils/typecheck-runner.ts
  why: Primary reference for TypecheckResult interface, ParsedTscError structure, error parsing patterns
  pattern: Lines 50-110 (TypecheckResult, ParsedTscError interfaces)
  gotcha: ParsedTscError has optional `module` field for TS2307 errors

- file: tests/unit/utils/groundswell-linker.test.ts
  why: Test patterns for utility functions, assertion patterns for complex return types
  pattern: Lines 130-150 (happy path test structure), lines 71-106 (createMockChild helper)
  gotcha: Use vi.clearAllMocks() in beforeEach, vi.useFakeTimers() for async operations

- file: src/utils/errors.ts
  why: Error hierarchy patterns, categorization approach, structured error handling
  pattern: Lines 20-200 (PipelineError hierarchy, type guards)
  gotcha: Type guard functions use instanceof checks, error codes use PIPELINE_ prefix

- file: src/utils/retry.ts
  why: Error categorization patterns using code/message matching
  pattern: Lines 30-80 (isTransientError, isPermanentError with pattern arrays)
  gotcha: Uses sets of error codes and message pattern arrays for categorization

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/subtasks/P1M1T1S6/typescript-compiler-output-research.md
  why: Complete TypeScript error code categorization reference, regex patterns, best practices
  section: Lines 125-134 (error code categories), Lines 545-554 (getErrorCategory function)
  gotcha: Error ranges: TS2000-TS2999 (module), TS2300-TS2499 (type)

- url: https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
  why: Complete list of all TypeScript error codes for reference
  critical: Error codes follow TSXXXX format with semantic ranges

- url: https://typescript.tv/errors/
  why: Human-readable explanations of common TypeScript error codes
  critical: TS2307 (Cannot find module), TS2322 (Type not assignable), TS2741 (Missing property)

- file: src/core/prd-differ.ts
  why: Reference for grouping and aggregation patterns
  pattern: Lines 150-250 (grouping logic, statistics generation)
  gotcha: Uses reduce() for grouping, creates Record<string, T[]> structures
```

### Current Codebase tree

```bash
src/
├── utils/
│   ├── typecheck-runner.ts       # INPUT: TypecheckResult, ParsedTscError interfaces
│   ├── groundswell-linker.ts     # REFERENCE: Utility function patterns
│   ├── groundswell-verifier.ts   # REFERENCE: Verification result structure
│   ├── errors.ts                 # REFERENCE: Error hierarchy patterns
│   └── retry.ts                  # REFERENCE: Error categorization by code
tests/
├── unit/
│   └── utils/
│       ├── groundswell-linker.test.ts  # REFERENCE: Test patterns
│       └── errors.test.ts              # REFERENCE: Error categorization tests
```

### Desired Codebase tree with files to be added

```bash
src/
├── utils/
│   ├── typecheck-runner.ts       # EXISTING - provides input TypecheckResult
│   ├── groundswell-linker.ts     # EXISTING
│   ├── groundswell-verifier.ts   # EXISTING
│   ├── errors.ts                 # EXISTING
│   ├── retry.ts                  # EXISTING
│   └── typescript-error-analyzer.ts  # NEW: analyzeTypeScriptErrors() function
tests/
├── unit/
│   └── utils/
│       ├── groundswell-linker.test.ts  # EXISTING
│       ├── errors.test.ts              # EXISTING
│       └── typescript-error-analyzer.test.ts  # NEW: Unit tests
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: TypecheckResult.success === true means no errors
// When success is true, skip analysis and return empty result (proceed to S3)

// CRITICAL: ParsedTscError.module field is optional
// Only present for TS2307 errors, undefined for other codes

// CRITICAL: TypeScript error codes follow TSXXXX format
// Use parseInt(code.replace('TS', ''), 10) to extract numeric value for range checks

// CRITICAL: Module resolution errors span multiple codes:
// TS2307: Cannot find module
// TS2304: Cannot find name
// TS2305: Module has no exported member
// TS2306: File is not a module
// TS2688: Cannot find type definition file
// TS6053: File not found

// CRITICAL: Type mismatch errors include:
// TS2322: Type not assignable
// TS2345: Argument not assignable
// TS2741: Missing required properties

// GOTCHA: File paths may be relative or absolute
// Group by exact file path string, don't normalize

// GOTCHA: Line numbers are 1-indexed in ParsedTscError
// Preserve as-is, don't convert to 0-indexed

// GOTCHA: Empty errors array should still return structured result
// Return empty categories, empty files, empty errorsByFile, zero summary

// PATTERN: Use reduce() for grouping operations (see prd-differ.ts)
// PATTERN: Use Set for unique file paths, then Array.from() for conversion
```

---

## Implementation Blueprint

### Data models and structure

```typescript
// Result interface returned by analyzeTypeScriptErrors
interface ErrorAnalysisResult {
  /** Whether analysis found any errors to categorize */
  hasErrors: boolean;

  /** Count of errors in each category */
  categories: ErrorCategories;

  /** Unique list of file paths with errors */
  files: string[];

  /** Errors grouped by file path */
  errorsByFile: ErrorsByFile;

  /** Summary statistics */
  summary: ErrorSummary;
}

/** Category counts */
interface ErrorCategories {
  /** Module-not-found errors (TS2307, TS2304, TS2305, TS2306, TS2688, TS6053) */
  'module-not-found': number;

  /** Type mismatch errors (TS2322, TS2345, TS2741) */
  'type-mismatch': number;

  /** All other error codes */
  other: number;
}

/** Errors grouped by file path */
type ErrorsByFile = Record<string, ParsedTscError[]>;

/** Summary statistics */
interface ErrorSummary {
  /** Total number of errors analyzed */
  total: number;

  /** Number of unique files with errors */
  fileCount: number;

  /** Most common error code */
  mostCommonCode: string | null;

  /** File with the most errors */
  fileWithMostErrors: string | null;
}

// Input from S1 (already defined in typecheck-runner.ts)
// interface TypecheckResult {
//   success: boolean;
//   errorCount: number;
//   errors: ParsedTscError[];
//   ...
// }

// ParsedTscError (already defined in typecheck-runner.ts)
// interface ParsedTscError {
//   file: string;
//   line: number;
//   column: number;
//   code: string;
//   message: string;
//   module?: string;  // Only for TS2307
// }
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/typescript-error-analyzer.ts
  - IMPLEMENT: ErrorAnalysisResult, ErrorCategories, ErrorsByFile, ErrorSummary interfaces
  - IMPLEMENT: analyzeTypeScriptErrors(result: TypecheckResult) main function
  - IMPLEMENT: categorizeError(error: ParsedTscError) helper function
  - IMPLEMENT: groupErrorsByFile(errors: ParsedTscError[]) helper function
  - IMPLEMENT: generateSummary(errors: ParsedTscError[], errorsByFile: ErrorsByFile) helper
  - FOLLOW pattern: src/utils/typecheck-runner.ts (interface structure, JSDoc style)
  - NAMING: analyzeTypeScriptErrors (function), ErrorAnalysisResult (interface)
  - PLACEMENT: src/utils/typescript-error-analyzer.ts (new file)
  - EXPORT: analyzeTypeScriptErrors function and all interfaces
  - IMPORT: TypecheckResult, ParsedTscError from './typecheck-runner.js'

Task 2: MODIFY src/utils/typecheck-runner.ts (optional re-export)
  - INTEGRATE: Import and re-export analyzeTypeScriptErrors for convenience
  - FIND pattern: Existing exports in typecheck-runner.ts
  - ADD: export { analyzeTypeScriptErrors, type ErrorAnalysisResult } from './typescript-error-analyzer.js'
  - PRESERVE: All existing exports and functionality

Task 3: CREATE tests/unit/utils/typescript-error-analyzer.test.ts
  - IMPLEMENT: Unit tests for analyzeTypeScriptErrors() function
  - IMPLEMENT: Tests for categorizeError() helper
  - IMPLEMENT: Tests for groupErrorsByFile() helper
  - IMPLEMENT: Tests for generateSummary() helper
  - FOLLOW pattern: tests/unit/utils/groundswell-linker.test.ts
  - MOCK: Create mock TypecheckResult objects directly (no external dependencies)
  - COVERAGE: Happy path, empty input, single error, multiple errors, mixed categories
  - PLACEMENT: tests/unit/utils/typescript-error-analyzer.test.ts
  - NAMING: describe('typescript-error-analyzer', () => { ... })

Task 4: UPDATE plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/tasks.json
  - UPDATE: Set P1.M1.T2.S2 status to "Complete"
  - FIND pattern: tasks.json structure for status updates
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// MAIN FUNCTION PATTERN
// =============================================================================

import type { TypecheckResult, ParsedTscError } from './typecheck-runner.js';

/**
 * Analyzes TypeScript errors from typecheck result
 *
 * @remarks
 * Consumes TypecheckResult from P1.M1.T2.S1 (runTypecheck) and categorizes
 * errors by type, groups by file, and generates summary statistics.
 *
 * Early returns when TypecheckResult.success is true (no errors to analyze),
 * allowing pipeline to skip to P1.M1.T2.S3 (module-not-found verification).
 *
 * @param result - TypecheckResult from runTypecheck()
 * @returns ErrorAnalysisResult with categorized and grouped errors
 *
 * @example
 * ```typescript
 * const typecheckResult = await runTypecheck();
 * const analysis = analyzeTypeScriptErrors(typecheckResult);
 *
 * if (!analysis.hasErrors) {
 *   console.log('No errors - proceed to S3');
 * } else {
 *   console.log(`Found ${analysis.categories['module-not-found']} module errors`);
 *   console.log(`Affected files: ${analysis.files.join(', ')}`);
 * }
 * ```
 */
export function analyzeTypeScriptErrors(
  result: TypecheckResult
): ErrorAnalysisResult {
  // PATTERN: Early return when success is true (skip to S3)
  if (result.success || result.errors.length === 0) {
    return {
      hasErrors: false,
      categories: {
        'module-not-found': 0,
        'type-mismatch': 0,
        other: 0,
      },
      files: [],
      errorsByFile: {},
      summary: {
        total: 0,
        fileCount: 0,
        mostCommonCode: null,
        fileWithMostErrors: null,
      },
    };
  }

  // Categorize all errors
  const categorized = result.errors.map(error => ({
    error,
    category: categorizeError(error),
  }));

  // Count by category
  const categories: ErrorCategories = {
    'module-not-found': 0,
    'type-mismatch': 0,
    other: 0,
  };

  for (const { category } of categorized) {
    categories[category]++;
  }

  // Group by file
  const errorsByFile = groupErrorsByFile(result.errors);
  const files = Object.keys(errorsByFile);

  // Generate summary
  const summary = generateSummary(result.errors, errorsByFile);

  return {
    hasErrors: true,
    categories,
    files,
    errorsByFile,
    summary,
  };
}

// =============================================================================
// ERROR CATEGORIZATION PATTERN
// =============================================================================

/**
 * Categorizes a TypeScript error by its error code
 *
 * @remarks
 * Uses error code ranges and specific code matching to determine category:
 * - module-not-found: TS2307, TS2304, TS2305, TS2306, TS2688, TS6053
 * - type-mismatch: TS2322, TS2345, TS2741
 * - other: All remaining error codes
 *
 * @param error - Parsed TypeScript error
 * @returns Error category key
 */
function categorizeError(error: ParsedTscError): keyof ErrorCategories {
  const { code } = error;

  // Module-not-found errors (specific codes)
  const MODULE_NOT_FOUND_CODES = new Set([
    'TS2307', // Cannot find module
    'TS2304', // Cannot find name
    'TS2305', // Module has no exported member
    'TS2306', // File is not a module
    'TS2688', // Cannot find type definition file
    'TS6053', // File not found
  ]);

  if (MODULE_NOT_FOUND_CODES.has(code)) {
    return 'module-not-found';
  }

  // Type mismatch errors (specific codes)
  const TYPE_MISMATCH_CODES = new Set([
    'TS2322', // Type not assignable
    'TS2345', // Argument not assignable
    'TS2741', // Missing required properties
  ]);

  if (TYPE_MISMATCH_CODES.has(code)) {
    return 'type-mismatch';
  }

  // All other errors
  return 'other';
}

// =============================================================================
// GROUPING PATTERN (from prd-differ.ts)
// =============================================================================

/**
 * Groups errors by file path
 *
 * @remarks
 * Uses reduce() to create a Record mapping file paths to arrays of errors.
 * Preserves original error objects for detailed inspection.
 *
 * @param errors - Array of parsed TypeScript errors
 * @returns Record mapping file paths to error arrays
 */
function groupErrorsByFile(errors: ParsedTscError[]): ErrorsByFile {
  return errors.reduce((groups, error) => {
    const { file } = error;

    if (!groups[file]) {
      groups[file] = [];
    }

    groups[file].push(error);
    return groups;
  }, {} as ErrorsByFile);
}

// =============================================================================
// SUMMARY GENERATION PATTERN
// =============================================================================

/**
 * Generates summary statistics from errors
 *
 * @remarks
 * Calculates total errors, unique file count, most common error code,
 * and file with the most errors for quick assessment.
 *
 * @param errors - Array of parsed TypeScript errors
 * @param errorsByFile - Errors grouped by file
 * @returns Summary statistics
 */
function generateSummary(
  errors: ParsedTscError[],
  errorsByFile: ErrorsByFile
): ErrorSummary {
  const total = errors.length;
  const fileCount = Object.keys(errorsByFile).length;

  // Find most common error code
  const codeCounts = new Map<string, number>();
  for (const error of errors) {
    codeCounts.set(error.code, (codeCounts.get(error.code) ?? 0) + 1);
  }

  let mostCommonCode: string | null = null;
  let maxCount = 0;
  for (const [code, count] of codeCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonCode = code;
    }
  }

  // Find file with most errors
  let fileWithMostErrors: string | null = null;
  let maxErrors = 0;
  for (const [file, fileErrors] of Object.entries(errorsByFile)) {
    if (fileErrors.length > maxErrors) {
      maxErrors = fileErrors.length;
      fileWithMostErrors = file;
    }
  }

  return {
    total,
    fileCount,
    mostCommonCode,
    fileWithMostErrors,
  };
}
````

### Integration Points

```yaml
UTILITIES:
  - add to: src/utils/typescript-error-analyzer.ts (new file)
  - pattern: 'analyzeTypeScriptErrors(result: TypecheckResult): ErrorAnalysisResult'

EXPORTS:
  - from: src/utils/typescript-error-analyzer.ts
  - export: 'export { analyzeTypeScriptErrors, type ErrorAnalysisResult, type ErrorCategories, type ErrorsByFile, type ErrorSummary }'

IMPORTS:
  - from: src/utils/typecheck-runner.ts
  - import: "import type { TypecheckResult, ParsedTscError } from './typecheck-runner.js'"

TESTS:
  - add to: tests/unit/utils/typescript-error-analyzer.test.ts (new file)
  - pattern: "describe('typescript-error-analyzer', () => { ... })"
  - mock: 'No external mocking needed - use plain TypeScript objects'

CONSTANTS:
  - add to: src/utils/typescript-error-analyzer.ts
  - pattern: 'const MODULE_NOT_FOUND_CODES = new Set([...])'
  - pattern: 'const TYPE_MISMATCH_CODES = new Set([...])'
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit src/utils/typescript-error-analyzer.ts    # Type check new file
npm run lint src/utils/typescript-error-analyzer.ts        # ESLint check
npm run format src/utils/typescript-error-analyzer.ts      # Prettier format

# Project-wide validation
npm run typecheck          # Full project typecheck
npm run lint               # Full project lint
npm run format             # Full project format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test new module as it's created
npm run test tests/unit/utils/typescript-error-analyzer.test.ts

# Test all utils to ensure no regression
npm run test tests/unit/utils/

# Full test suite
npm run test

# Coverage validation
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Integration test with real typecheck result
cat > /tmp/test-analyzer.mjs << 'EOF'
import { runTypecheck } from './src/utils/typecheck-runner.js';
import { analyzeTypeScriptErrors } from './src/utils/typescript-error-analyzer.js';

const typecheckResult = await runTypecheck();
const analysis = analyzeTypeScriptErrors(typecheckResult);

console.log('Has errors:', analysis.hasErrors);
console.log('Categories:', analysis.categories);
console.log('Files:', analysis.files);
console.log('Summary:', analysis.summary);
EOF

npx tsx /tmp/test-analyzer.mjs

# Expected: Successful analysis showing error categorization
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Error Categorization Validation

# Test with mock data containing all error types
cat > /tmp/test-categories.mjs << 'EOF'
import { analyzeTypeScriptErrors } from './src/utils/typescript-error-analyzer.js';

const mockResult = {
  success: false,
  errorCount: 6,
  errors: [
    { file: 'src/a.ts', line: 1, column: 1, code: 'TS2307', message: "Cannot find module 'x'" },
    { file: 'src/b.ts', line: 2, column: 1, code: 'TS2322', message: 'Type not assignable' },
    { file: 'src/a.ts', line: 3, column: 1, code: 'TS2304', message: 'Cannot find name' },
    { file: 'src/c.ts', line: 4, column: 1, code: 'TS2345', message: 'Argument not assignable' },
    { file: 'src/b.ts', line: 5, column: 1, code: 'TS2741', message: 'Missing property' },
    { file: 'src/d.ts', line: 6, column: 1, code: 'TS9999', message: 'Unknown error' },
  ],
  stdout: '',
  stderr: '',
  exitCode: 2,
};

const analysis = analyzeTypeScriptErrors(mockResult);

console.log('Module-not-found:', analysis.categories['module-not-found']); // Should be 2
console.log('Type-mismatch:', analysis.categories['type-mismatch']);       // Should be 3
console.log('Other:', analysis.categories['other']);                       // Should be 1
console.log('Files:', analysis.files.length);                               // Should be 4
console.log('Most common code:', analysis.summary.mostCommonCode);
EOF

npx tsx /tmp/test-categories.mjs

# Edge Case Testing

# Test with empty errors (success case)
# Test with single error
# Test with all same error code
# Test with all errors in same file
# Test with special characters in file paths
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] Returns `ErrorAnalysisResult` with correct structure
- [ ] `hasErrors` is `false` when TypecheckResult.success is true
- [ ] `hasErrors` is `true` when errors are present
- [ ] TS2307, TS2304, TS2305, TS2306, TS2688, TS6053 categorized as "module-not-found"
- [ ] TS2322, TS2345, TS2741 categorized as "type-mismatch"
- [ ] All other codes categorized as "other"
- [ ] Errors grouped correctly by file path
- [ ] File paths extracted accurately
- [ ] Line numbers preserved
- [ ] Summary statistics calculated correctly

### Code Quality Validation

- [ ] Follows typecheck-runner.ts patterns for interface structure
- [ ] File placement matches desired codebase tree
- [ ] Test file follows existing test patterns
- [ ] All interfaces exported for module consumption
- [ ] JSDoc comments match typecheck-runner.ts style

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Error category logic is well-commented
- [ ] Constants use MODULE_NOT_FOUND_CODES naming convention

---

## Anti-Patterns to Avoid

- ❌ Don't use `any` types - use proper interfaces from typecheck-runner.ts
- ❌ Don't mutate input TypecheckResult - treat as read-only
- ❌ Don't use complex nested conditions for categorization - use Set lookups
- ❌ Don't forget early return when success is true - wastes computation
- ❌ Don't normalize file paths - group by exact string match
- ❌ Don't use switch statements for error codes - Set.has() is clearer
- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip edge cases (empty arrays, single file, all same error)
- ❌ Don't forget to export all interfaces for module consumption

---

## Confidence Score

**9/10** - One-pass implementation success likelihood

**Reasoning**:

- ✅ Clear input contract from S1 with existing TypecheckResult interface
- ✅ Comprehensive error categorization research available
- ✅ Simple logic (categorization, grouping, aggregation) - no external dependencies
- ✅ Test patterns well-established in codebase
- ✅ No complex async operations or I/O
- ✅ Pure function implementation - deterministic and testable
- ⚠️ Minimal: Error code categorization may need adjustment based on real-world usage

---

## Additional Research Notes (for reference)

- TypeScript error code reference: See `docs/subtasks/P1M1T1S6/typescript-compiler-output-research.md` lines 125-134
- Error category function pattern: See research document lines 545-554
- Grouping patterns: See `src/core/prd-differ.ts` for reduce() aggregation patterns
- Test patterns: See `tests/unit/utils/groundswell-linker.test.ts` for utility test structure
