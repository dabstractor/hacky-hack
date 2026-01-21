# Product Requirement Prompt (PRP) - P1.M1.T2.S3: Verify no module-not-found errors remain

---

## Goal

**Feature Goal**: Implement `verifyNoModuleErrors()` function that consumes `ErrorAnalysisResult` from P1.M1.T2.S2, checks for remaining module-not-found errors, and performs file sampling verification to confirm TypeScript module resolution is working correctly for Groundswell imports.

**Deliverable**:

- A new function `verifyNoModuleErrors()` in a TypeScript utility module
- Returns `ModuleErrorVerifyResult` interface with `{ resolved: boolean, remainingCount: number, verifiedFiles: string[], message: string }`
- Unit tests with comprehensive coverage (Vitest framework)
- Integration with existing TypeScript error analyzer output

**Success Definition**:

- Function consumes ErrorAnalysisResult from S2 correctly
- Returns early with `resolved: true` when TypecheckResult from S1 had `success: true`
- Checks `categories['module-not-found']` count - returns `resolved: false` if > 0
- When module-not-found count is 0, performs file sampling verification using Read tool
- Samples critical files (src/workflows/prp-pipeline.ts, src/agents/agent-factory.ts, entry points)
- Returns structured result indicating verification status
- All tests pass (unit + integration)

## User Persona (if applicable)

**Target User**: Build system / Automated pipeline / Developer

**Use Case**: After TypeScript error analysis (S2), verify that no module-not-found errors remain and that Groundswell imports are actually working through spot-checking critical files.

**User Journey**:

1. Pipeline executes P1.M1.T2.S1 (runTypecheck) which returns TypecheckResult
2. If success is false, pipeline calls P1.M1.T2.S2 (analyzeTypeScriptErrors) with the result
3. Pipeline then calls `verifyNoModuleErrors()` with ErrorAnalysisResult
4. Function checks for remaining module-not-found errors
5. If none found, function samples critical files to verify imports work
6. Function returns verification result indicating if milestone is complete

**Pain Points Addressed**:

- No automated way to verify module resolution is actually working after linking
- Manual file-by-file import checking is tedious
- False positives from typecheck not catching actual runtime import issues
- No programmatic milestone completion flag for module resolution

## Why

- **Integration with P1.M1.T2.S2**: Consumes ErrorAnalysisResult output and adds verification layer
- **Foundation for P1.M1.T2.S4**: Output determines if compilation success documentation is needed
- **Build verification**: Enables automated assessment of module resolution health
- **Milestone gate**: Provides boolean `resolved` flag for P1.M1.T2 completion

## What

Implement `verifyNoModuleErrors()` function that:

1. Accepts `ErrorAnalysisResult` from S2 as input
2. Returns early with `resolved: true` if `hasErrors` is false (S1 had success: true)
3. Checks `categories['module-not-found']` count
   - If > 0: returns `resolved: false` with `remainingCount` set to the count
4. If `module-not-found` count is 0, performs file sampling verification:
   - Defines critical files to check (entry points, high-impact files)
   - Uses Read tool to inspect actual import statements in sampled files
   - Verifies Groundswell imports are present and syntactically correct
5. Returns structured result with verification status

### Success Criteria

- [ ] Function accepts ErrorAnalysisResult from S2 correctly
- [ ] Returns early with `resolved: true` when ErrorAnalysisResult.hasErrors is false
- [ ] Returns `resolved: false` when `categories['module-not-found']` > 0
- [ ] Returns `remainingCount` equal to module-not-found error count
- [ ] Performs file sampling when module-not-found count is 0
- [ ] Samples at least 3 critical files (src/workflows/prp-pipeline.ts, src/agents/agent-factory.ts, src/index.ts)
- [ ] Uses Read tool to verify import statements in sampled files
- [ ] Returns `ModuleErrorVerifyResult` with correct structure
- [ ] All unit tests pass with mocked data
- [ ] Follows existing patterns from groundswell-verifier.ts

---

## All Needed Context

### Context Completeness Check

**Before implementing, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

✓ **Yes** - This PRP provides:

- Exact input contract from S2 (ErrorAnalysisResult interface)
- Complete file sampling strategy with specific file paths
- Verification patterns from existing verifier functions
- Test patterns from existing test files
- Import statement analysis approach
- All necessary imports and exports

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/utils/typescript-error-analyzer.ts
  why: Primary reference for ErrorAnalysisResult interface, error categorization structure
  pattern: Lines 217-282 (ErrorAnalysisResult, ErrorCategories, ErrorSummary interfaces)
  gotcha: hasErrors is false when TypecheckResult.success is true (no errors to analyze)

- file: src/utils/groundswell-verifier.ts
  why: Reference for verification result structure, file sampling patterns
  pattern: Lines 51-63 (GroundswellVerifyResult interface), Lines 128-172 (file verification pattern)
  gotcha: Uses exists: boolean for verification status, includes message field for human-readable output

- file: src/utils/typecheck-runner.ts
  why: Primary reference for TypecheckResult interface, ParsedTscError structure
  pattern: Lines 50-110 (TypecheckResult, ParsedTscError interfaces)
  gotcha: success: true means no errors - skip verification

- file: tests/unit/utils/groundswell-verifier.test.ts
  why: Test patterns for verification functions, assertion patterns for boolean results
  pattern: Lines 61-71 (boolean verification), Lines 193-208 (array length verification)
  gotcha: Use expect(result.exists).toBe(true/false) for boolean assertions

- file: tests/unit/utils/groundswell-linker.test.ts
  why: Test patterns for utility functions with complex return types
  pattern: Lines 71-106 (createMockChild helper), Lines 130-150 (happy path test structure)
  gotcha: Use vi.clearAllMocks() in afterEach, vi.useFakeTimers() for async operations

- file: tests/unit/utils/typecheck-runner.test.ts
  why: Test patterns for TypeScript-related utilities, mock data patterns
  pattern: Lines 150-200 (mock TypecheckResult creation), Lines 346-350 (error field verification)
  gotcha: Mock stderr output with proper format for parsing tests

- file: tests/unit/utils/typescript-error-analyzer.test.ts
  why: Test patterns for error analysis functions, categorization verification
  pattern: Mock ErrorAnalysisResult creation, category count assertions
  gotcha: Verify all error categories are counted correctly

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/subtasks/P1M1T1S6/typescript-compiler-output-research.md
  why: Complete TypeScript error code categorization reference, module resolution patterns
  section: Lines 125-134 (error code categories), Lines 545-554 (getErrorCategory function)
  gotcha: Module-not-found errors: TS2307, TS2304, TS2305, TS2306, TS2688, TS6053

- url: https://www.typescriptlang.org/docs/handbook/module-resolution.html
  why: TypeScript module resolution documentation for understanding how imports are resolved
  critical: Node.js module resolution strategy, package.json exports field, preserveSymlinks option

- url: https://docs.npmjs.com/cli/v10/commands/npm-link
  why: npm link documentation for understanding symlink behavior and verification
  critical: npm link creates symlink in node_modules, requires proper package.json configuration
```

### Current Codebase tree

```bash
src/
├── utils/
│   ├── typecheck-runner.ts              # INPUT: TypecheckResult interface definition
│   ├── typescript-error-analyzer.ts     # INPUT: ErrorAnalysisResult from S2
│   ├── groundswell-verifier.ts          # REFERENCE: Verification result structure
│   ├── groundswell-linker.ts            # REFERENCE: Verification result patterns
│   ├── errors.ts                        # REFERENCE: Error handling patterns
│   └── retry.ts                         # REFERENCE: Error categorization patterns
tests/
├── unit/
│   └── utils/
│       ├── typecheck-runner.test.ts     # REFERENCE: Test patterns for TypeScript utilities
│       ├── typescript-error-analyzer.test.ts  # REFERENCE: Test patterns for error analysis
│       ├── groundswell-verifier.test.ts # REFERENCE: Test patterns for verification
│       └── groundswell-linker.test.ts   # REFERENCE: Test patterns for complex results
```

### Desired Codebase tree with files to be added

```bash
src/
├── utils/
│   ├── typecheck-runner.ts              # EXISTING - provides TypecheckResult interface
│   ├── typescript-error-analyzer.ts     # EXISTING - provides ErrorAnalysisResult input
│   ├── groundswell-verifier.ts          # EXISTING - reference for verification patterns
│   ├── groundswell-linker.ts            # EXISTING
│   ├── errors.ts                        # EXISTING
│   ├── retry.ts                         # EXISTING
│   └── module-resolution-verifier.ts    # NEW: verifyNoModuleErrors() function
tests/
├── unit/
│   └── utils/
│       ├── typecheck-runner.test.ts     # EXISTING
│       ├── typescript-error-analyzer.test.ts  # EXISTING
│       ├── groundswell-verifier.test.ts # EXISTING
│       ├── groundswell-linker.test.ts   # EXISTING
│       └── module-resolution-verifier.test.ts  # NEW: Unit tests
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: ErrorAnalysisResult.hasErrors === false means S1 had success: true
// When hasErrors is false, skip verification and return resolved: true immediately

// CRITICAL: categories['module-not-found'] count must be exactly 0 for verification
// Any count > 0 means module resolution is still failing

// CRITICAL: File sampling uses Read tool, not fs.readFile
// Use Read tool from toolkit to inspect file contents for import statements

// CRITICAL: Groundswell imports follow specific patterns:
// - import { PRPGenerator } from 'groundswell';
// - import type { PRD } from 'groundswell/types';
// - import * as groundswell from 'groundswell';

// CRITICAL: Verification must check actual import statements, not just file existence
// Use regex to find import statements containing 'groundswell'

// GOTCHA: Some files may use type-only imports (import type)
// These should still be counted as valid Groundswell imports

// GOTCHA: File paths may be relative or absolute in errorsByFile
// Use exact string matching when checking against critical files list

// PATTERN: Use structured result objects with boolean status field
// Follow GroundswellVerifyResult pattern: exists/resolved: boolean, message: string

// PATTERN: Include descriptive message field for human-readable status
// Example: "No module-not-found errors found. Verified 3/3 critical files have Groundswell imports."

// GOTCHA: Don't check every file - only sample critical ones
// Performance optimization: 3-5 files is sufficient for verification
```

---

## Implementation Blueprint

### Data models and structure

```typescript
// Result interface returned by verifyNoModuleErrors
interface ModuleErrorVerifyResult {
  /** Whether module resolution is verified working */
  resolved: boolean;

  /** Number of remaining module-not-found errors (0 if resolved) */
  remainingCount: number;

  /** List of files that were sampled for verification */
  verifiedFiles: readonly string[];

  /** Number of files that actually contain Groundswell imports */
  importCount: number;

  /** Human-readable verification message */
  message: string;
}

// Critical files to sample for verification
const CRITICAL_FILES_TO_SAMPLE = [
  'src/workflows/prp-pipeline.ts',
  'src/agents/agent-factory.ts',
  'src/index.ts',
  'src/agents/prp-runtime.ts',
  'src/core/prd-differ.ts',
] as const;

// Input from S2 (already defined in typescript-error-analyzer.ts)
// interface ErrorAnalysisResult {
//   hasErrors: boolean;
//   categories: ErrorCategories;
//   files: string[];
//   errorsByFile: Record<string, ParsedTscError[]>;
//   summary: ErrorSummary;
// }
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/module-resolution-verifier.ts
  - IMPLEMENT: ModuleErrorVerifyResult interface
  - IMPLEMENT: CRITICAL_FILES_TO_SAMPLE constant array
  - IMPLEMENT: verifyNoModuleErrors(analysis: ErrorAnalysisResult) main function
  - IMPLEMENT: sampleCriticalFiles() helper function (mocked in tests)
  - IMPLEMENT: verifyGroundswellImports(fileContent: string) helper function
  - IMPLEMENT: generateVerificationMessage() helper function
  - FOLLOW pattern: src/utils/groundswell-verifier.ts (result structure, verification pattern)
  - NAMING: verifyNoModuleErrors (function), ModuleErrorVerifyResult (interface)
  - PLACEMENT: src/utils/module-resolution-verifier.ts (new file)
  - EXPORT: verifyNoModuleErrors function and ModuleErrorVerifyResult interface
  - IMPORT: ErrorAnalysisResult from './typescript-error-analyzer.js'

Task 2: MODIFY src/utils/typescript-error-analyzer.ts (optional re-export)
  - INTEGRATE: Import and re-export verifyNoModuleErrors for convenience
  - FIND pattern: Existing exports in typescript-error-analyzer.ts
  - ADD: export { verifyNoModuleErrors, type ModuleErrorVerifyResult } from './module-resolution-verifier.js'
  - PRESERVE: All existing exports and functionality

Task 3: CREATE tests/unit/utils/module-resolution-verifier.test.ts
  - IMPLEMENT: Unit tests for verifyNoModuleErrors() function
  - IMPLEMENT: Tests for early return when hasErrors is false
  - IMPLEMENT: Tests for returning resolved: false when module-not-found > 0
  - IMPLEMENT: Tests for file sampling verification path
  - IMPLEMENT: Tests for verifyGroundswellImports() helper
  - IMPLEMENT: Tests for generateVerificationMessage() helper
  - FOLLOW pattern: tests/unit/utils/groundswell-verifier.test.ts
  - MOCK: Create mock ErrorAnalysisResult objects directly (no external dependencies)
  - MOCK: Read tool using vi.mock() for file content reading
  - COVERAGE: Happy path, early returns, module errors present, file sampling, edge cases
  - PLACEMENT: tests/unit/utils/module-resolution-verifier.test.ts
  - NAMING: describe('module-resolution-verifier', () => { ... })

Task 4: UPDATE plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/tasks.json
  - UPDATE: Set P1.M1.T2.S3 status to "Complete"
  - FIND pattern: tasks.json structure for status updates
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// MAIN FUNCTION PATTERN
// =============================================================================

import type { ErrorAnalysisResult } from './typescript-error-analyzer.js';

/**
 * Verifies no module-not-found errors remain after Groundswell link
 *
 * @remarks
 * Consumes ErrorAnalysisResult from P1.M1.T2.S2 (analyzeTypeScriptErrors) and
 * verifies that module resolution is working correctly for Groundswell imports.
 *
 * Early returns when ErrorAnalysisResult.hasErrors is false (S1 had success: true),
 * indicating no TypeScript errors exist and module resolution is working.
 *
 * Checks module-not-found error count - if > 0, returns resolved: false with
 * the count of remaining errors.
 *
 * When module-not-found count is 0, performs file sampling verification by
 * reading critical files and checking for Groundswell import statements.
 *
 * @param analysis - ErrorAnalysisResult from analyzeTypeScriptErrors()
 * @returns ModuleErrorVerifyResult with verification status
 *
 * @example
 * ```typescript
 * const typecheckResult = await runTypecheck();
 * const analysis = analyzeTypeScriptErrors(typecheckResult);
 * const verification = verifyNoModuleErrors(analysis);
 *
 * if (verification.resolved) {
 *   console.log('Module resolution verified - milestone complete');
 * } else {
 *   console.log(`Found ${verification.remainingCount} module errors - milestone incomplete`);
 * }
 * ```
 */
export function verifyNoModuleErrors(
  analysis: ErrorAnalysisResult
): ModuleErrorVerifyResult {
  // PATTERN: Early return when hasErrors is false (S1 had success: true)
  if (!analysis.hasErrors) {
    return {
      resolved: true,
      remainingCount: 0,
      verifiedFiles: [],
      importCount: 0,
      message: 'No TypeScript errors found - module resolution verified.',
    };
  }

  // Check module-not-found error count
  const moduleErrorCount = analysis.categories['module-not-found'];

  // PATTERN: Return unresolved if any module-not-found errors exist
  if (moduleErrorCount > 0) {
    return {
      resolved: false,
      remainingCount: moduleErrorCount,
      verifiedFiles: [],
      importCount: 0,
      message: `Found ${moduleErrorCount} module-not-found error(s) - milestone incomplete.`,
    };
  }

  // No module-not-found errors - perform file sampling verification
  const sampledFiles = sampleCriticalFiles(analysis.files);
  const importCounts = sampledFiles.map(file => ({
    file,
    hasImports: verifyGroundswellImportsInFile(file),
  }));

  const filesWithImports = importCounts.filter(f => f.hasImports);
  const importCount = filesWithImports.length;

  // PATTERN: Consider resolved if at least one sampled file has Groundswell imports
  const resolved = importCount > 0;

  return {
    resolved,
    remainingCount: 0,
    verifiedFiles: sampledFiles,
    importCount,
    message: generateVerificationMessage(
      sampledFiles.length,
      importCount,
      resolved
    ),
  };
}

// =============================================================================
// FILE SAMPLING PATTERN
// =============================================================================

/**
 * Samples critical files from the list of files with errors
 *
 * @remarks
 * Prioritizes critical files (entry points, high-impact modules) from the
 * CRITICAL_FILES_TO_SAMPLE list. Returns up to 5 files for verification.
 *
 * In production, this would use the Read tool to inspect file contents.
 * In tests, this is mocked to return predefined file paths.
 *
 * @param files - List of file paths from ErrorAnalysisResult
 * @returns Array of critical file paths to sample
 */
function sampleCriticalFiles(files: readonly string[]): string[] {
  // Prioritize critical files that exist in the files list
  const criticalFound = CRITICAL_FILES_TO_SAMPLE.filter(file =>
    files.includes(file)
  );

  // If no critical files found in error list, sample first 3 files
  if (criticalFound.length === 0) {
    return files.slice(0, Math.min(3, files.length));
  }

  // Return up to 5 critical files
  return criticalFound.slice(0, 5);
}

// =============================================================================
// IMPORT VERIFICATION PATTERN
// =============================================================================

/**
 * Verifies Groundswell imports in a file
 *
 * @remarks
 * Uses the Read tool to inspect file contents and check for Groundswell
 * import statements using regex pattern matching.
 *
 * Supports both regular and type-only imports:
 * - import { ... } from 'groundswell'
 * - import type { ... } from 'groundswell/types'
 * - import * as groundswell from 'groundswell'
 *
 * @param filePath - Path to file to verify
 * @returns True if file contains Groundswell imports
 */
function verifyGroundswellImportsInFile(filePath: string): boolean {
  // PATTERN: Use Read tool to get file contents
  // NOTE: In production, this uses the actual Read tool
  // In tests, this is mocked to return predefined content

  try {
    // Simulated file content reading (would use Read tool in production)
    const fileContent = readFileSync(filePath, 'utf-8');
    return verifyGroundswellImports(fileContent);
  } catch {
    // File not readable - assume no imports
    return false;
  }
}

/**
 * Checks if content contains Groundswell import statements
 *
 * @remarks
 * Uses regex pattern to find import statements containing 'groundswell'.
 * Matches both regular and type-only imports.
 *
 * @param content - File content to check
 * @returns True if content contains Groundswell imports
 */
function verifyGroundswellImports(content: string): boolean {
  // Pattern to match Groundswell import statements
  const patterns = [
    /import\s+.*?from\s+['"]groundswell['"]/g,
    /import\s+type\s+.*?from\s+['"]groundswell\/types['"]/g,
    /import\s+\*\s+as\s+\w+\s+from\s+['"]groundswell['"]/g,
  ];

  return patterns.some(pattern => pattern.test(content));
}

// =============================================================================
// MESSAGE GENERATION PATTERN
// =============================================================================

/**
 * Generates human-readable verification message
 *
 * @remarks
 * Creates a descriptive message explaining the verification result,
 * including how many files were sampled and how many had imports.
 *
 * @param sampledCount - Number of files sampled
 * @param importCount - Number of files with Groundswell imports
 * @param resolved - Whether verification passed
 * @returns Human-readable verification message
 */
function generateVerificationMessage(
  sampledCount: number,
  importCount: number,
  resolved: boolean
): string {
  if (resolved) {
    return `No module-not-found errors found. Verified ${importCount}/${sampledCount} critical files have Groundswell imports.`;
  }

  return `No module-not-found errors found, but could not verify Groundswell imports in sampled files (${sampledCount} files checked).`;
}
````

### Integration Points

```yaml
UTILITIES:
  - add to: src/utils/module-resolution-verifier.ts (new file)
  - pattern: 'verifyNoModuleErrors(analysis: ErrorAnalysisResult): ModuleErrorVerifyResult'

EXPORTS:
  - from: src/utils/module-resolution-verifier.ts
  - export: 'export { verifyNoModuleErrors, type ModuleErrorVerifyResult }'

IMPORTS:
  - from: src/utils/typescript-error-analyzer.ts
  - import: "import type { ErrorAnalysisResult } from './typescript-error-analyzer.js'"

TESTS:
  - add to: tests/unit/utils/module-resolution-verifier.test.ts (new file)
  - pattern: "describe('module-resolution-verifier', () => { ... })"
  - mock: 'Mock ErrorAnalysisResult, Mock Read tool for file content'

CONSTANTS:
  - add to: src/utils/module-resolution-verifier.ts
  - pattern: "const CRITICAL_FILES_TO_SAMPLE = ['src/...'] as const"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit src/utils/module-resolution-verifier.ts    # Type check new file
npm run lint src/utils/module-resolution-verifier.ts        # ESLint check
npm run format src/utils/module-resolution-verifier.ts      # Prettier format

# Project-wide validation
npm run typecheck          # Full project typecheck
npm run lint               # Full project lint
npm run format             # Full project format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test new module as it's created
npm run test tests/unit/utils/module-resolution-verifier.test.ts

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
# Integration test with real error analysis result
cat > /tmp/test-verifier.mjs << 'EOF'
import { runTypecheck } from './src/utils/typecheck-runner.js';
import { analyzeTypeScriptErrors } from './src/utils/typescript-error-analyzer.js';
import { verifyNoModuleErrors } from './src/utils/module-resolution-verifier.js';

const typecheckResult = await runTypecheck();
const analysis = analyzeTypeScriptErrors(typecheckResult);
const verification = verifyNoModuleErrors(analysis);

console.log('Resolved:', verification.resolved);
console.log('Remaining count:', verification.remainingCount);
console.log('Verified files:', verification.verifiedFiles);
console.log('Import count:', verification.importCount);
console.log('Message:', verification.message);
EOF

npx tsx /tmp/test-verifier.mjs

# Expected: Successful verification showing module resolution status
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Module Resolution Verification

# Test with mock data containing no module errors
cat > /tmp/test-no-errors.mjs << 'EOF'
import { verifyNoModuleErrors } from './src/utils/module-resolution-verifier.js';

const mockAnalysis = {
  hasErrors: false,
  categories: {
    'module-not-found': 0,
    'type-mismatch': 0,
    'other': 0,
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

const verification = verifyNoModuleErrors(mockAnalysis);

console.log('Resolved:', verification.resolved); // Should be true
console.log('Remaining count:', verification.remainingCount); // Should be 0
console.log('Message:', verification.message);
EOF

npx tsx /tmp/test-no-errors.mjs

# Test with mock data containing module errors
cat > /tmp/test-module-errors.mjs << 'EOF'
import { verifyNoModuleErrors } from './src/utils/module-resolution-verifier.js';

const mockAnalysis = {
  hasErrors: true,
  categories: {
    'module-not-found': 5,
    'type-mismatch': 2,
    'other': 1,
  },
  files: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
  errorsByFile: {},
  summary: {
    total: 8,
    fileCount: 3,
    mostCommonCode: 'TS2307',
    fileWithMostErrors: 'src/a.ts',
  },
};

const verification = verifyNoModuleErrors(mockAnalysis);

console.log('Resolved:', verification.resolved); // Should be false
console.log('Remaining count:', verification.remainingCount); // Should be 5
console.log('Message:', verification.message);
EOF

npx tsx /tmp/test-module-errors.mjs

# Edge Case Testing

# Test with empty files list
# Test with all critical files present
# Test with no critical files present
# Test with type-only imports
# Test with mixed import patterns
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

- [ ] Returns `ModuleErrorVerifyResult` with correct structure
- [ ] `resolved` is `true` when ErrorAnalysisResult.hasErrors is false
- [ ] `resolved` is `false` when `categories['module-not-found']` > 0
- [ ] `remainingCount` equals module-not-found error count when unresolved
- [ ] Performs file sampling when module-not-found count is 0
- [ ] Samples at least 3 critical files when available
- [ ] Uses regex pattern matching to detect Groundswell imports
- [ ] Returns descriptive message field
- [ ] Early returns optimize performance (no unnecessary work)

### Code Quality Validation

- [ ] Follows groundswell-verifier.ts patterns for result structure
- [ ] File placement matches desired codebase tree
- [ ] Test file follows existing test patterns
- [ ] All interfaces exported for module consumption
- [ ] JSDoc comments match groundswell-verifier.ts style
- [ ] Proper handling of edge cases (empty files, no imports, read errors)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Verification logic is well-commented
- [ ] CRITICAL_FILES_TO_SAMPLE constant uses `as const` for type safety
- [ ] Import patterns are well-documented in JSDoc

---

## Anti-Patterns to Avoid

- ❌ Don't use `any` types - use proper interfaces from typescript-error-analyzer.ts
- ❌ Don't mutate input ErrorAnalysisResult - treat as read-only
- ❌ Don't skip early returns - they optimize performance
- ❌ Don't check every file - sample strategically (3-5 files max)
- ❌ Don't use fs.readFile directly - use Read tool pattern
- ❌ Don't forget to handle read errors gracefully
- ❌ Don't hardcode file paths - use CRITICAL_FILES_TO_SAMPLE constant
- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip edge cases (empty files, no imports, read errors)
- ❌ Don't forget to export all interfaces for module consumption
- ❌ Don't use complex nested conditions - early returns are clearer
- ❌ Don't verify file existence - verify import statements only

---

## Confidence Score

**9/10** - One-pass implementation success likelihood

**Reasoning**:

- ✅ Clear input contract from S2 with existing ErrorAnalysisResult interface
- ✅ Comprehensive verification patterns available in codebase
- ✅ Simple logic (count check + file sampling) - no external dependencies
- ✅ Test patterns well-established in codebase
- ✅ No complex async operations or I/O (Read tool is simple)
- ✅ Pure function implementation - deterministic and testable
- ⚠️ Minimal: File sampling strategy may need adjustment based on actual file structure

---

## Additional Research Notes (for reference)

- Error categorization reference: See `docs/subtasks/P1M1T1S6/typescript-compiler-output-research.md` lines 125-134
- Verification result patterns: See `src/utils/groundswell-verifier.ts` lines 51-63
- Test patterns for verification: See `tests/unit/utils/groundswell-verifier.test.ts`
- Module resolution documentation: See TypeScript handbook on module resolution
- npm link verification: See npm link documentation for symlink behavior
