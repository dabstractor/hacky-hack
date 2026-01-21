# PRP: Export EnvironmentError from Core Index

**Subtask**: P1.M1.T1.S4
**Work Item**: Export EnvironmentError from core index
**PRD Reference**: Phase 1, Milestone 1, Task 1, Subtask 4

---

## Goal

**Feature Goal**: Add `EnvironmentError` to the public API exports in `src/core/index.ts` so it can be imported alongside other error classes from the core module.

**Deliverable**: Modified `src/core/index.ts` with `EnvironmentError` and `isEnvironmentError` added to exports.

**Success Definition**:

- `EnvironmentError` class is exported from `src/core/index.ts`
- `isEnvironmentError` type guard function is exported from `src/core/index.ts`
- Export follows the existing pattern used for other error-related exports
- No existing exports are modified or broken
- TypeScript compilation succeeds with no errors
- Existing tests continue to pass

## User Persona

**Target User**: Developer working on the PRP Pipeline codebase

**Use Case**: A developer needs to import `EnvironmentError` from the core module for use in environment validation logic throughout the codebase, maintaining consistency with how other error classes are imported.

**User Journey**:

1. Developer adds environment validation logic
2. Developer imports error classes from `@core/index` (the established pattern)
3. Developer expects `EnvironmentError` to be available alongside `SessionFileError`
4. Developer uses `EnvironmentError` with consistent API patterns

**Pain Points Addressed**:

- Inconsistent API - `EnvironmentError` would be the only error class not exported from core index
- Developer confusion - needing to remember a special import path for just this one error class
- Breaking established patterns - all other utilities are exported through the core index

## Why

- **API Consistency**: `SessionFileError` is already exported from the core index. Exporting `EnvironmentError` maintains consistency in the public API.
- **Developer Experience**: Developers importing from `@core/index` expect all core functionality to be available through that single import point.
- **Completion of P1.M1.T1**: The EnvironmentError class was implemented in P1.M1.T1.S3; this subtask completes its integration into the public API.
- **Future-Proofing**: As the codebase grows, having a consistent export pattern prevents technical debt and confusion.

## What

Add `EnvironmentError` and `isEnvironmentError` to the exports in `src/core/index.ts` following the existing pattern for error-related exports.

### Success Criteria

- [ ] `EnvironmentError` is exported from `src/core/index.ts`
- [ ] `isEnvironmentError` type guard is exported from `src/core/index.ts`
- [ ] Export uses the same re-export pattern as existing exports
- [ ] TypeScript compilation: `npm run build` succeeds with no errors
- [ ] All existing tests pass: `npm test` succeeds
- [ ] No modifications to existing exports (additive change only)

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully? **YES** - This PRP provides:

- The exact file to modify with full current content
- The exact pattern to follow for exports
- The exact line numbers and placement
- Validation commands specific to this project
- Known gotchas and constraints

### Documentation & References

```yaml
# PRIMARY SOURCE - File to modify
- file: src/core/index.ts
  why: This is the central export file that defines the public API for the core module
  pattern: Error exports are grouped with related utilities (SessionFileError with session-utils exports)
  gotcha: File uses named re-exports, not direct exports. Must use "export { } from './path'" syntax

# REFERENCE - Export pattern to follow
- file: src/core/index.ts
  line: 16-25
  why: Shows the pattern for exporting error classes: they're grouped with related utilities
  pattern: "export { SessionFileError } from './session-utils.js';"
  critical: Errors are not in a separate section - they're part of functional groups

# REFERENCE - SessionFileError export example
- file: src/core/index.ts
  line: 24
  why: This is the precedent for exporting error classes from the core index
  pattern: Single named export in a grouped export statement
  note: SessionFileError is exported alongside session utility functions

# REFERENCE - EnvironmentError implementation
- file: src/utils/errors.ts
  line: 467-489
  why: Confirms EnvironmentError class and isEnvironmentError are defined in errors.ts
  pattern: Both class and type guard use standard exports

# REFERENCE - Existing test patterns
- file: tests/unit/utils/errors-environment.test.ts
  line: 21-28
  why: Shows the import pattern used in tests (direct import from errors.ts)
  note: Tests currently import directly, but public API imports should use core index

# AVOID - What NOT to do
- gotcha: DO NOT create a new "Error exports" section - errors belong with their functional groups
- gotcha: DO NOT use "export *" - use named exports for clarity
- gotcha: DO NOT modify existing exports - this is an additive change only
- gotcha: DO NOT export other error classes (SessionError, TaskError, etc.) - they are intentionally NOT in core index
```

### Current Codebase Structure

```bash
src/
├── core/
│   ├── index.ts              # PUBLIC API ENTRY POINT - MODIFY THIS FILE
│   ├── dependency-validator.ts
│   ├── models.ts
│   ├── prd-differ.ts
│   ├── research-queue.ts
│   ├── scope-resolver.ts
│   ├── session-manager.ts
│   ├── session-utils.ts       # Exports SessionFileError
│   └── task-orchestrator.ts
├── utils/
│   ├── errors.ts              # Defines EnvironmentError (and isEnvironmentError)
│   └── ...
└── index.ts                   # Main entry point
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: TypeScript ES Module imports require .js extension
// Even though source files are .ts, imports use .js extension
// CORRECT: export { EnvironmentError } from '../utils/errors.js';
// WRONG:   export { EnvironmentError } from '../utils/errors.ts';

// CRITICAL: Only export EnvironmentError, NOT all error classes
// SessionError, TaskError, AgentError, ValidationError are intentionally NOT exported
// They remain internal to utils/errors.ts
// Only SessionFileError (from session-utils) and now EnvironmentError are in public API

// CRITICAL: Use named re-exports, not barrel exports
// CORRECT: export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';
// WRONG:   export * from '../utils/errors.js';

// CRITICAL: File uses consistent .js extensions for all imports
// This is a TypeScript ES Module project with "module": "NodeNext"
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is an export-only change. The `EnvironmentError` class and `isEnvironmentError` type guard are already implemented.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: LOCATE correct position in src/core/index.ts
  - FIND: The session management export section (lines 16-25)
  - IDENTIFY: Where SessionFileError is exported (line 24)
  - DECIDE: Position for EnvironmentError export (before or after SessionFileError)

Task 2: DETERMINE export placement strategy
  - OPTION A: Add to session-utils export line (functional grouping)
  - OPTION B: Add separate re-export line for errors.ts
  - RECOMMENDED: Option B - separate line with comment for clarity
  - PLACEMENT: Immediately after the session-utils export block

Task 3: MODIFY src/core/index.ts
  - ADD: New export line after session-utils exports
  - SYNTAX: "export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';"
  - COMMENT: Add "// Environment errors" comment above the export
  - PLACEMENT: Line 26 (after the session-utils export block ending at line 25)
  - PRESERVE: All existing exports unchanged

Task 4: VALIDATE TypeScript compilation
  - RUN: npm run build
  - CHECK: No type errors related to the new export
  - VERIFY: dist/core/index.js contains the exported symbols
  - EXPECTED: Clean build with no errors

Task 5: VALIDATE existing tests still pass
  - RUN: npm test
  - CHECK: No test failures related to exports
  - VERIFY: All existing imports still work
  - EXPECTED: All tests pass (this is an additive change)
```

### Implementation Patterns & Key Details

```typescript
// CURRENT STATE (src/core/index.ts, lines 16-25):
// Session management
export { SessionManager } from './session-manager.js';
export { TaskOrchestrator } from './task-orchestrator.js';
export { ResearchQueue } from './research-queue.js';
export {
  hashPRD,
  createSessionDirectory,
  writeTasksJSON,
  readTasksJSON,
  writePRP,
  snapshotPRD,
  loadSnapshot,
  SessionFileError, // <-- Error export pattern precedent
} from './session-utils.js';

// NEW CODE TO ADD (insert after line 25):
// Environment errors
export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';

// COMPLETE RESULT will be:
// Session management
export { SessionManager } from './session-manager.js';
export { TaskOrchestrator } from './task-orchestrator.js';
export { ResearchQueue } from './research-queue.js';
export {
  hashPRD,
  createSessionDirectory,
  writeTasksJSON,
  readTasksJSON,
  writePRP,
  snapshotPRD,
  loadSnapshot,
  SessionFileError,
} from './session-utils.js';

// Environment errors
export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';

// PRD diffing utilities (existing, unchanged)
export {
  diffPRDs,
  hasSignificantChanges,
  parsePRDSections,
  normalizeMarkdown,
} from './prd-differ.js';

// ... rest of file unchanged
```

### Integration Points

```yaml
EXPORT_FILE:
  - modify: src/core/index.ts
  - add_after: "Session management" section (line 25)
  - add_section: "Environment errors" with comment
  - syntax: "export { EnvironmentError, isEnvironmentError } from '../utils/errors.js';"
  - path_note: Use '../utils/errors.js' (up one level from core/ to src/, then into utils/)

IMPORT PATHS:
  - after_change: Can import via "import { EnvironmentError } from './core/index.js';"
  - alternative: Can still import directly from "import { EnvironmentError } from './utils/errors.js';"
  - both_paths_valid: Both import paths work after this change

NO_CHANGES_TO:
  - src/utils/errors.ts (already exports EnvironmentError and isEnvironmentError)
  - src/core/session-utils.ts (already exports SessionFileError)
  - tests (can continue using direct imports or switch to core index imports)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying src/core/index.ts - fix before proceeding

# Check TypeScript compilation
npm run build
# Expected: Clean build with no errors
# If errors: READ output carefully - check for typos in export syntax, .js extension usage

# Type checking (if separate from build)
npx tsc --noEmit
# Expected: No type errors

# Linting (project uses ESLint)
npm run lint 2>/dev/null || npx eslint src/core/index.ts
# Expected: No linting errors
# Note: May have warnings from other files - focus only on src/core/index.ts

# Formatting check (project uses Prettier)
npm run format:check 2>/dev/null || npx prettier --check src/core/index.ts
# Expected: File is properly formatted
# If not: Run npm run format or npx prettier --write src/core/index.ts
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run all unit tests
npm test -- tests/unit
# Expected: All tests pass
# Focus: No test failures related to imports or exports

# Run specific test files that might be affected
npm test -- tests/unit/utils/errors.test.ts
npm test -- tests/unit/utils/errors-environment.test.ts
# Expected: All existing tests pass (they use direct imports, so should be unaffected)

# Verify the export is accessible
# Create temporary test file (optional, for verification):
cat > /tmp/test-export.ts << 'EOF'
import { EnvironmentError, isEnvironmentError } from './src/core/index.js';

const error = new EnvironmentError('test');
console.log('EnvironmentError exported:', error instanceof EnvironmentError);
console.log('isEnvironmentError exported:', isEnvironmentError(error));
EOF
npx tsx /tmp/test-export.ts
# Expected Output:
// EnvironmentError exported: true
// isEnvironmentError exported: true
# Cleanup: rm /tmp/test-export.ts
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full test suite
npm test
# Expected: All tests pass
# This validates that the export doesn't break existing imports

# Verify TypeScript can resolve the export
npx tsc --noEmit --traceResolution 2>&1 | grep "errors.js" | head -5
# Expected: TypeScript successfully resolves ../utils/errors.js from core/index.ts

# Check that the built dist files include the export
cat dist/core/index.js | grep -i "environment" | head -3
# Expected: Should see "EnvironmentError" and "isEnvironmentError" in the output

# Verify import paths work from different locations
# Test from core directory perspective:
cat > /tmp/test-import-location.ts << 'EOF'
// Simulating import from a file in src/core/
import { EnvironmentError } from '../utils/errors.js';
console.log('Direct import works');
EOF
npx tsx /tmp/test-import-location.ts
# Expected: "Direct import works"
# Cleanup: rm /tmp/test-import-location.ts
```

### Level 4: Manual Verification (Export Validation)

```bash
# Verify the export signature is correct
node -e "
const core = require('./dist/core/index.js');
console.log('Exported EnvironmentError:', typeof core.EnvironmentError);
console.log('Exported isEnvironmentError:', typeof core.isEnvironmentError);
"
# Expected Output:
// Exported EnvironmentError: function
// Exported isEnvironmentError: function

# Check that no other error classes were accidentally exported
node -e "
const core = require('./dist/core/index.js');
console.log('Has SessionError:', 'SessionError' in core);
console.log('Has TaskError:', 'TaskError' in core);
console.log('Has AgentError:', 'AgentError' in core);
console.log('Has ValidationError:', 'ValidationError' in core);
"
# Expected Output (all should be false):
// Has SessionError: false
// Has TaskError: false
// Has AgentError: false
// Has ValidationError: false

# Verify existing exports are intact
node -e "
const core = require('./dist/core/index.js');
console.log('Has SessionManager:', 'SessionManager' in core);
console.log('Has TaskOrchestrator:', 'TaskOrchestrator' in core);
console.log('Has SessionFileError:', 'SessionFileError' in core);
"
# Expected Output (all should be true):
// Has SessionManager: true
// Has TaskOrchestrator: true
// Has SessionFileError: true
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 validation passed: `npm run build` succeeds with no errors
- [ ] Level 1 validation passed: No TypeScript errors
- [ ] Level 1 validation passed: No ESLint errors in src/core/index.ts
- [ ] Level 1 validation passed: File is properly formatted with Prettier
- [ ] Level 2 validation passed: All unit tests pass: `npm test -- tests/unit`
- [ ] Level 3 validation passed: Full test suite passes: `npm test`
- [ ] Level 3 validation passed: Built dist files contain the exports
- [ ] Level 4 validation passed: Manual verification confirms exports work correctly

### Feature Validation

- [ ] `EnvironmentError` is exported from src/core/index.ts
- [ ] `isEnvironmentError` is exported from src/core/index.ts
- [ ] Export uses correct syntax with .js extension
- [ ] Export includes both class and type guard
- [ ] Export is placed in logical position with comment
- [ ] No other error classes were accidentally exported
- [ ] All existing exports remain unchanged and functional

### Code Quality Validation

- [ ] Change follows existing codebase patterns
- [ ] Code is self-documenting with clear section comment
- [ ] No modifications to existing exports (additive only)
- [ ] Import path is correct (../utils/errors.js)
- [ ] File remains well-organized after change

### Documentation & Deployment

- [ ] JSDoc comment added to explain the new export section
- [ ] Change is minimal and focused (single file modification)
- [ ] No breaking changes to existing API

---

## Anti-Patterns to Avoid

- **Don't** create a new "Errors" section at the top of the file - errors are grouped with their functional domains
- **Don't** use `export * from '../utils/errors.js'` - this would export ALL error classes, not just EnvironmentError
- **Don't** export SessionError, TaskError, AgentError, or ValidationError - they are intentionally internal
- **Don't** modify the existing session-utils export block - add a new section instead
- **Don't** use .ts extension in imports - must use .js for ES modules
- **Don't** forget to include `isEnvironmentError` type guard in the export
- **Don't** place the export in an illogical position (e.g., at the very bottom or in the middle of another section)
- **Don't** skip validation because "it's a simple change" - verify the export actually works

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Rationale**:

- This is a simple, well-defined additive change
- The pattern to follow is clear (SessionFileError export)
- The exact line numbers and syntax are specified
- Validation commands are project-specific and verified
- All context is provided with no gaps
- No ambiguity or decision points during implementation

**Validation**: A developer unfamiliar with the codebase can implement this successfully using only this PRP because:

1. The exact file to modify is specified with full current content
2. The exact pattern to follow is shown with line numbers
3. The complete "before" and "after" states are documented
4. Project-specific validation commands are provided
5. Common pitfalls are documented with examples
6. The change scope is minimal (single file, ~3 lines added)
