# Product Requirement Prompt: P3.M1.T2.S1 - Create PRD Snapshot Utility

---

## Goal

**Feature Goal**: Add `snapshotPRD()` and `loadSnapshot()` utility functions to `src/core/session-utils.ts` for reading PRD files and writing/reading snapshot files with graceful encoding error handling.

**Deliverable**: Two new exported functions in `src/core/session-utils.ts` with corresponding unit tests in `tests/unit/core/session-utils.test.ts`.

**Success Definition**:

- `snapshotPRD(sessionPath, prdPath)` reads PRD content and writes `prd_snapshot.md` to session directory
- `loadSnapshot(sessionPath)` reads and returns `prd_snapshot.md` content as string
- Both functions handle UTF-8 encoding errors gracefully using strict validation
- SessionFileError is thrown for all file operations with descriptive error messages
- Unit tests achieve 100% coverage with comprehensive edge case handling

## Why

- **Delta Detection Foundation**: PRD snapshots enable delta detection when PRD files are modified, supporting the delta session workflow (see P3.M1.T2.S2 and P3.M1.T2.S3)
- **Context Preservation**: Each session needs a frozen copy of the PRD for reference during implementation, ensuring consistency if the source PRD changes
- **Code Reusability**: Extract snapshot operations from SessionManager (lines 220-228, 265-267) into reusable utilities for cleaner code
- **Encoding Safety**: Graceful encoding error handling prevents silent data corruption from invalid UTF-8 sequences

## What

### Functional Requirements

**Function: `async snapshotPRD(sessionPath: string, prdPath: string): Promise<void>`**

1. Resolve absolute paths for both `sessionPath` and `prdPath`
2. Read PRD file content from `prdPath` with strict UTF-8 validation
3. Write content to `{sessionPath}/prd_snapshot.md` with mode 0o644
4. Throw `SessionFileError` for read/write failures with descriptive operation name

**Function: `loadSnapshot(sessionPath: string): Promise<string>`**

1. Resolve absolute path for `sessionPath`
2. Read `{sessionPath}/prd_snapshot.md` content with strict UTF-8 validation
3. Return content as string
4. Throw `SessionFileError` for read failures with descriptive operation name

**Encoding Error Handling**:

- Use `TextDecoder` with `fatal: true` option for strict UTF-8 validation
- Throw `SessionFileError` with operation "validate UTF-8" when encoding errors detected
- Provide clear error message indicating which file contains invalid UTF-8

### Non-Functional Requirements

- **Async/Await Pattern**: Use async/await for both functions (consistent with existing session-utils)
- **Path Resolution**: Use `resolve()` from 'node:path' for absolute paths
- **Error Consistency**: All errors must be `SessionFileError` with path, operation, and optional code
- **File Permissions**: Snapshot files must be created with mode 0o644
- **Import Compatibility**: Functions must be exportable and importable by SessionManager

### Success Criteria

- [ ] `snapshotPRD()` successfully writes PRD content to `prd_snapshot.md`
- [ ] `loadSnapshot()` successfully reads and returns snapshot content
- [ ] Invalid UTF-8 in PRD throws SessionFileError with "validate UTF-8" operation
- [ ] Invalid UTF-8 in snapshot throws SessionFileError with "validate UTF-8" operation
- [ ] Missing PRD file throws SessionFileError with ENOENT code
- [ ] Missing snapshot file throws SessionFileError with ENOENT code
- [ ] All unit tests pass with 100% coverage
- [ ] No existing tests are broken

## All Needed Context

### Context Completeness Check

**Validation**: An implementer unfamiliar with this codebase has everything needed to successfully implement these utilities using only this PRP and codebase access.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/core/session-utils.ts
  why: Core file to modify - contains existing utilities (hashPRD, writeTasksJSON, etc.) and SessionFileError class
  pattern: Follow existing async function patterns, SessionFileError usage, file I/O patterns
  gotcha: Must import TextDecoder from 'node:util' for encoding validation

- file: src/core/session-manager.ts
  why: Contains existing PRD snapshot operations that will be replaced by new utilities (lines 220-228, 265-267)
  pattern: Current snapshot operations to extract into utilities
  gotcha: After implementation, SessionManager should call these utilities instead of inline operations

- file: tests/unit/core/session-utils.test.ts
  why: Existing test patterns for session-utils functions - use as template for new tests
  pattern: Setup/Execute/Verify test structure, factory functions, mock patterns
  gotcha: Must mock TextDecoder for encoding validation tests

- file: tests/unit/core/session-manager.test.ts
  why: Contains existing tests that verify PRD snapshot operations (lines 341-358, 532-549)
  pattern: How snapshot operations are currently tested
  gotcha: After implementation, SessionManager tests may need updating to use new utilities

- docfile: plan/001_14b9dc2a33c7/P3M1T2S1/research/encoding_handling_research.md
  why: Research findings on Node.js UTF-8 encoding error handling with TextDecoder
  section: Implementation Recommendations for This Codebase
  critical: Use TextDecoder with fatal: true for strict validation - default 'utf-8' silently replaces invalid sequences

- docfile: plan/001_14b9dc2a33c7/P3M1T2S1/research/codebase_snapshot_patterns.md
  why: Analysis of existing snapshot patterns in SessionManager
  section: 1. PRD Snapshot Operations and 4. Error Handling Patterns
  critical: Follow exact patterns for file naming (prd_snapshot.md), path construction, and SessionFileError usage

- url: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
  why: Official documentation for fs.promises.readFile with encoding options
  critical: readFile with 'utf-8' does NOT throw on invalid UTF-8 - must use buffer + TextDecoder

- url: https://nodejs.org/api/util.html#utiltextdecoderencoding-options
  why: Official documentation for TextDecoder with fatal option
  section: new TextDecoder('utf-8', { fatal: true })
  critical: fatal: true causes TypeError on invalid UTF-8 sequences
```

### Current Codebase Tree

```bash
src/
├── core/
│   ├── index.ts           # Exports all core modules
│   ├── models.ts          # Zod schemas and TypeScript interfaces
│   ├── session-manager.ts # SessionManager class (uses inline snapshot ops)
│   └── session-utils.ts   # Target file - add snapshotPRD and loadSnapshot here
├── utils/
│   └── task-utils.ts      # Task hierarchy utilities
├── agents/
│   ├── agent-factory.ts
│   └── prompts/
├── tools/
│   ├── bash-mcp.ts
│   ├── filesystem-mcp.ts
│   └── git-mcp.ts
├── config/
│   ├── constants.ts
│   ├── environment.ts
│   └── types.ts
├── workflows/
│   └── hello-world.ts
└── index.ts               # Main entry point

tests/
├── unit/
│   └── core/
│       ├── session-utils.test.ts   # Target test file - add tests here
│       └── session-manager.test.ts # Tests for SessionManager class
```

### Desired Codebase Tree with Files to be Added

```bash
# No new files - modifying existing file:
src/core/session-utils.ts
  - ADD: export async function snapshotPRD(sessionPath: string, prdPath: string): Promise<void>
  - ADD: export async function loadSnapshot(sessionPath: string): Promise<string>

tests/unit/core/session-utils.test.ts
  - ADD: describe('snapshotPRD') with comprehensive test cases
  - ADD: describe('loadSnapshot') with comprehensive test cases
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: readFile with 'utf-8' does NOT throw on invalid UTF-8
// It silently replaces invalid sequences with U+FFFD (replacement character)
// BAD: const content = await readFile(path, 'utf-8'); // No encoding validation
// GOOD: Use TextDecoder with fatal: true for strict validation

import { readFile } from 'node:fs/promises';
import { TextDecoder } from 'node:util';

// Correct pattern for strict UTF-8 validation
async function readUTF8FileStrict(path: string): Promise<string> {
  const buffer = await readFile(path);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    return decoder.decode(buffer);
  } catch (error) {
    throw new SessionFileError(path, 'validate UTF-8', error as Error);
  }
}

// CRITICAL: SessionFileError must be thrown for ALL file operation failures
// Error pattern from session-utils.ts line 65-74
throw new SessionFileError(path, operation, cause?: Error);

// CRITICAL: Use resolve() for ALL path construction
// Pattern from session-utils.ts line 179, 249
import { resolve } from 'node:path';
const sessionPath = resolve(sessionPath); // Ensure absolute
const snapshotPath = resolve(sessionPath, 'prd_snapshot.md');

// CRITICAL: File permissions must be 0o644 for snapshot files
// Pattern from session-manager.ts line 226-228
await writeFile(snapshotPath, content, { mode: 0o644 });

// GOTCHA: TextDecoder must be imported from 'node:util' with node: prefix
import { TextDecoder } from 'node:util'; // Correct
// import { TextDecoder } from 'util';    // Wrong - may not work in all contexts

// GOTCHA: SessionFileError captures errno codes automatically
// No need to manually extract error.code - constructor handles it
// See session-utils.ts line 66-73

// GOTCHA: Vitest mocks for TextDecoder need special handling
// When testing encoding errors, mock TextDecoder to throw TypeError
const mockTextDecoder = vi.fn();
mockTextDecoder.mockReturnValue({
  decode: vi.fn().mockImplementation(() => { throw new TypeError('Invalid UTF-8'); })
});
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed - using existing SessionFileError class.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD TextDecoder import to session-utils.ts
  - IMPLEMENT: Add import { TextDecoder } from 'node:util';
  - LOCATION: Top of file with other imports (after line 28)
  - PATTERN: Use node: prefix for all Node.js built-in imports

Task 2: CREATE internal readUTF8FileStrict helper function
  - IMPLEMENT: async function readUTF8FileStrict(path: string, operation: string): Promise<string>
  - LOCATION: Before snapshotPRD function (after atomicWrite, around line 110)
  - PATTERN: Buffer read + TextDecoder with fatal: true + SessionFileError on failure
  - SIGNATURE:
    async function readUTF8FileStrict(path: string, operation: string): Promise<string> {
      const buffer = await readFile(path);
      const decoder = new TextDecoder('utf-8', { fatal: true });
      try {
        return decoder.decode(buffer);
      } catch (error) {
        throw new SessionFileError(path, operation, error as Error);
      }
    }

Task 3: IMPLEMENT snapshotPRD function
  - IMPLEMENT: export async function snapshotPRD(sessionPath: string, prdPath: string): Promise<void>
  - LOCATION: After writePRP function (around line 425)
  - PATTERN: Follow hashPRD pattern (lines 133-140) for structure and error handling
  - STEPS:
    1. Resolve absolute paths: const absSessionPath = resolve(sessionPath); const absPRDPath = resolve(prdPath);
    2. Read PRD with strict UTF-8: const content = await readUTF8FileStrict(absPRDPath, 'read PRD');
    3. Build snapshot path: const snapshotPath = resolve(absSessionPath, 'prd_snapshot.md');
    4. Write snapshot: await writeFile(snapshotPath, content, { mode: 0o644 });
    5. Wrap in try-catch with SessionFileError for write failures
  - DEPENDENCIES: Task 1 (TextDecoder import), Task 2 (readUTF8FileStrict)

Task 4: IMPLEMENT loadSnapshot function
  - IMPLEMENT: export async function loadSnapshot(sessionPath: string): Promise<string>
  - LOCATION: After snapshotPRD function
  - PATTERN: Follow readTasksJSON pattern (lines 283-296) for structure
  - STEPS:
    1. Resolve absolute path: const absSessionPath = resolve(sessionPath);
    2. Build snapshot path: const snapshotPath = resolve(absSessionPath, 'prd_snapshot.md');
    3. Read snapshot with strict UTF-8: return await readUTF8FileStrict(snapshotPath, 'read PRD snapshot');
  - DEPENDENCIES: Task 2 (readUTF8FileStrict)

Task 5: UPDATE src/core/index.ts exports
  - IMPLEMENT: Add snapshotPRD and loadSnapshot to core module exports
  - FIND pattern: Existing session-utils exports (line ~10-15)
  - ADD: export { snapshotPRD, loadSnapshot } from './session-utils.js';
  - PRESERVE: All existing exports

Task 6: CREATE unit tests for snapshotPRD
  - IMPLEMENT: describe('snapshotPRD') with comprehensive test cases
  - LOCATION: In tests/unit/core/session-utils.test.ts (after writePRP describe, around line 862)
  - FOLLOW pattern: Existing function test structure (Setup/Execute/Verify)
  - TEST CASES:
    1. should read PRD and write to prd_snapshot.md
    2. should use strict UTF-8 validation for PRD content
    3. should throw SessionFileError when PRD file not found (ENOENT)
    4. should throw SessionFileError when PRD has invalid UTF-8
    5. should throw SessionFileError when write fails (EACCES)
    6. should create file with mode 0o644
    7. should resolve relative paths to absolute paths
  - COVERAGE: All success paths and error paths
  - MOCK: readFile, writeFile, TextDecoder

Task 7: CREATE unit tests for loadSnapshot
  - IMPLEMENT: describe('loadSnapshot') with comprehensive test cases
  - LOCATION: After snapshotPRD tests
  - FOLLOW pattern: Existing read operations test structure
  - TEST CASES:
    1. should read and return prd_snapshot.md content
    2. should use strict UTF-8 validation for snapshot content
    3. should throw SessionFileError when snapshot file not found (ENOENT)
    4. should throw SessionFileError when snapshot has invalid UTF-8
    5. should read from correct path in session directory
  - COVERAGE: All success and error paths
  - MOCK: readFile, TextDecoder

Task 8: VERIFY no existing tests broken
  - IMPLEMENT: Run full test suite and ensure all pass
  - COMMAND: npm test
  - VERIFY: No existing tests fail after new functions added
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: UTF-8 validation with TextDecoder (new pattern for codebase)
async function readUTF8FileStrict(
  path: string,
  operation: string
): Promise<string> {
  // PATTERN: Read as buffer first (not string)
  const buffer = await readFile(path);

  // PATTERN: TextDecoder with fatal: true for strict validation
  const decoder = new TextDecoder('utf-8', { fatal: true });

  try {
    // PATTERN: Decode with validation - throws TypeError on invalid UTF-8
    return decoder.decode(buffer);
  } catch (error) {
    // PATTERN: Wrap encoding errors in SessionFileError
    throw new SessionFileError(path, operation, error as Error);
  }
}

// PATTERN: snapshotPRD function structure
export async function snapshotPRD(
  sessionPath: string,
  prdPath: string
): Promise<void> {
  try {
    // PATTERN: Resolve absolute paths (follow session-utils.ts line 179)
    const absSessionPath = resolve(sessionPath);
    const absPRDPath = resolve(prdPath);

    // PATTERN: Read with strict UTF-8 validation
    const content = await readUTF8FileStrict(absPRDPath, 'read PRD');

    // PATTERN: Build snapshot path (follow session-manager.ts line 226)
    const snapshotPath = resolve(absSessionPath, 'prd_snapshot.md');

    // PATTERN: Write with mode 0o644 (follow session-manager.ts line 226-228)
    await writeFile(snapshotPath, content, { mode: 0o644 });
  } catch (error) {
    // PATTERN: Re-throw SessionFileError without wrapping
    if (error instanceof SessionFileError) {
      throw error;
    }
    // PATTERN: Wrap unexpected errors in SessionFileError
    throw new SessionFileError(
      resolve(sessionPath, 'prd_snapshot.md'),
      'write PRD snapshot',
      error as Error
    );
  }
}

// PATTERN: loadSnapshot function structure
export async function loadSnapshot(sessionPath: string): Promise<string> {
  // PATTERN: Simpler than snapshotPRD - just read and return
  // PATTERN: No try-catch needed - readUTF8FileStrict handles errors
  const absSessionPath = resolve(sessionPath);
  const snapshotPath = resolve(absSessionPath, 'prd_snapshot.md');
  return await readUTF8FileStrict(snapshotPath, 'read PRD snapshot');
}

// GOTCHA: TextDecoder must be mocked differently in tests
// In test file, mock the entire 'node:util' module:
vi.mock('node:util', () => ({
  TextDecoder: vi.fn(),
}));

// Then create mock instance with decode method:
const mockTextDecoder = {
  decode: vi.fn(),
};
(TextDecoder as any).mockReturnValue(mockTextDecoder);
```

### Integration Points

```yaml
SESSION_MANAGER:
  - future: SessionManager.initialize() will call snapshotPRD instead of inline code
  - future: SessionManager.loadSession() will call loadSnapshot instead of inline code
  - note: This task creates the utilities - SessionManager updates are separate tasks

CORE_INDEX:
  - add to: src/core/index.ts
  - pattern: export { snapshotPRD, loadSnapshot } from './session-utils.js';
  - location: With other session-utils exports
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npm run lint          # ESLint check
npm run format        # Prettier format
npm run type-check    # TypeScript compiler check

# Combined check (if available)
npm run validate      # Runs all checks in sequence

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test new functions specifically
npm test -- tests/unit/core/session-utils.test.ts

# Run with coverage for visibility
npm test -- --coverage tests/unit/core/session-utils.test.ts

# Full test suite for affected areas
npm test

# Coverage validation (if coverage tools configured)
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Target: 100% coverage for snapshotPRD and loadSnapshot functions
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test - create test files
mkdir -p /tmp/test-session
echo "# Test PRD" > /tmp/test-prd.md

# Test with Node.js REPL or test script
node -e "
  const { snapshotPRD, loadSnapshot } = require('./dist/core/session-utils.js');
  await snapshotPRD('/tmp/test-session', '/tmp/test-prd.md');
  const content = await loadSnapshot('/tmp/test-session');
  console.log('Snapshot loaded:', content === '# Test PRD');
"

# Test encoding error handling
echo -e '\xFF\xFE invalid' > /tmp/test-invalid-utf8.md
node -e "
  const { snapshotPRD } = require('./dist/core/session-utils.js');
  try {
    await snapshotPRD('/tmp/test-session', '/tmp/test-invalid-utf8.md');
  } catch (e) {
    console.log('Encoding error caught:', e.operation === 'validate UTF-8');
  }
"

# Expected: Valid files processed successfully, invalid files throw SessionFileError
```

### Level 4: Creative & Domain-Specific Validation

```bash
# UTF-8 Encoding Validation Tests
# Test various UTF-8 edge cases
echo -n '# Test with emoji: ' > /tmp/emoji-test.md
echo -ne '\xf0\x9f\x98\x80' >> /tmp/emoji-test.md  # U+1F600 (grinning face)
node -e "
  const { snapshotPRD, loadSnapshot } = require('./dist/core/session-utils.js');
  await snapshotPRD('/tmp/test-session', '/tmp/emoji-test.md');
  const content = await loadSnapshot('/tmp/test-session');
  console.log('Emoji preserved:', content.includes('\xf0\x9f\x98\x80'));
"

# Test BOM (Byte Order Mark) handling
echo -ne '\xef\xbb\xbf# PRD with BOM' > /tmp/bom-test.md
node -e "
  const { snapshotPRD, loadSnapshot } = require('./dist/core/session-utils.js');
  await snapshotPRD('/tmp/test-session', '/tmp/bom-test.md');
  const content = await loadSnapshot('/tmp/test-session');
  console.log('BOM handled:', content.startsWith('# PRD with BOM'));
"

# Test large file handling
dd if=/dev/urandom bs=1M count=10 2>/dev/null | iconv -f ASCII -t UTF-8 > /tmp/large-prd.md
node -e "
  const { snapshotPRD, loadSnapshot } = require('./dist/core/session-utils.js');
  const start = Date.now();
  await snapshotPRD('/tmp/test-session', '/tmp/large-prd.md');
  const elapsed = Date.now() - start;
  console.log('Large file time:', elapsed, 'ms (should be < 1000ms)');
"

# Expected: All creative validation tests pass, demonstrating robust UTF-8 handling
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] snapshotPRD writes PRD content to `{sessionPath}/prd_snapshot.md`
- [ ] loadSnapshot reads and returns `{sessionPath}/prd_snapshot.md` content
- [ ] Invalid UTF-8 in PRD throws SessionFileError with operation="validate UTF-8"
- [ ] Invalid UTF-8 in snapshot throws SessionFileError with operation="validate UTF-8"
- [ ] ENOENT errors captured in SessionFileError.code
- [ ] File mode 0o644 used for snapshot files
- [ ] Relative paths resolved to absolute paths
- [ ] All success criteria from "What" section met

### Code Quality Validation

- [ ] Follows existing session-utils.ts patterns (async/await, SessionFileError, resolve())
- [ ] Consistent with hashPRD and readTasksJSON function structure
- [ ] TextDecoder import uses node: prefix
- [ ] Internal helper function (readUTF8FileStrict) is private (not exported)
- [ ] Functions exported and added to src/core/index.ts
- [ ] JSDoc comments follow existing style (see session-utils.ts lines 112-140)

### Test Quality Validation

- [ ] Setup/Execute/Verify pattern used for all tests
- [ ] Factory functions used for test data (if applicable)
- [ ] All error paths tested (ENOENT, EACCES, encoding errors)
- [ ] TextDecoder mocked correctly in tests
- [ ] 100% coverage for new functions
- [ ] No existing tests broken

## Anti-Patterns to Avoid

- ❌ Don't use `readFile(path, 'utf-8')` - it silently corrupts invalid UTF-8
- ❌ Don't skip TextDecoder validation - encoding errors must be detected
- ❌ Don't use sync functions in async context - always await readFile
- ❌ Don't hardcode 'prd_snapshot.md' - build path dynamically with resolve()
- ❌ Don't catch all exceptions - be specific about SessionFileError re-throw
- ❌ Don't forget mode: 0o644 - security issue if files are world-writable
- ❌ Don't export readUTF8FileStrict - it's an internal helper
- ❌ Don't use relative paths in tests - resolve all test file paths
- ❌ Don't mock entire fs module - mock only readFile and writeFile
- ❌ Don't forget to import TextDecoder from 'node:util' (not 'util')
