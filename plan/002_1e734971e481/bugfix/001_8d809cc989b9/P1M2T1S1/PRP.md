# Product Requirement Prompt (PRP): Examine Existing #isFatalError Implementation

**PRP ID**: P1.M2.T1.S1
**Work Item Title**: Examine existing #isFatalError implementation
**Created**: 2026-01-16
**Status**: Research Complete

---

## Goal

**Feature Goal**: Document the existing `#isFatalError()` private method implementation in `PRPPipeline` to enable extraction to a public utility function.

**Deliverable**: Comprehensive architecture documentation stored at `plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md` containing:
- Complete source code analysis
- Logic flow decision tree
- Fatal/non-fatal error classification rules
- Dependencies and integration points
- Migration path for extraction

**Success Definition**:
- Architecture documentation is complete and accurate
- Implementation logic is fully documented with decision tree
- All dependencies are identified and catalogued
- Migration recommendations are clear and actionable
- Documentation enables one-pass implementation of extracted `isFatalError()` utility function

---

## User Persona

**Target User**: Development team implementing the `isFatalError()` extraction (P1.M2.T1.S2 and P1.M2.T1.S3)

**Use Case**: Developer needs to understand the existing `#isFatalError()` implementation to extract it as a public utility function from `src/utils/errors.ts`

**User Journey**:
1. Read architecture documentation to understand existing implementation
2. Review fatal vs non-fatal classification rules
3. Identify all dependencies and type guards used
4. Extract logic to pure function without class dependencies
5. Write unit tests for extracted function
6. Update PRPPipeline to use imported utility function

**Pain Points Addressed**:
- Private method is inaccessible outside PRPPipeline class
- Logic is coupled to `#continueOnError` instance flag and `this.logger`
- Integration tests expect `isFatalError` to be exported from errors.ts
- No public documentation of fatal/non-fatal error classification philosophy

---

## Why

**Business Value**:
- Enables consistent error classification across the entire codebase
- Supports integration testing of error handling behavior
- Provides reusable utility for future error handling features

**Integration with Existing Features**:
- Integrates with existing error hierarchy in `src/utils/errors.ts`
- Supports existing type guard functions (`isSessionError`, `isTaskError`, etc.)
- Aligns with `--continue-on-error` CLI flag behavior
- Enables error tracking and reporting in ERROR_REPORT.md

**Problems This Solves**:
- **Missing Export**: Integration tests fail with "isFatalError is not a function"
- **Code Duplication**: Fatal/non-fatal logic needed in multiple contexts
- **Documentation Gap**: No centralized definition of fatal vs non-fatal errors
- **Maintainability**: Private method cannot be tested or reused outside PRPPipeline

---

## What

### User-Visible Behavior

No user-visible behavior changes. This is a **research-only** subtask that produces documentation.

### Technical Requirements

1. **Read and analyze** `src/workflows/prp-pipeline.ts` lines 377-417
2. **Document** the `#isFatalError()` method implementation
3. **Identify** all dependencies (type guards, error codes, instance state)
4. **Map** fatal vs non-fatal classification rules
5. **Create** decision tree documentation
6. **Recommend** migration path for extraction to public utility

### Success Criteria

- [ ] Architecture documentation exists at specified path
- [ ] Documentation includes complete source code
- [ ] Decision tree visually maps logic flow
- [ ] All dependencies are identified and explained
- [ ] Fatal/non-fatal classification rules are clearly documented
- [ ] Migration recommendations are actionable
- [ ] Differences from PRD specification are noted
- [ ] Integration points are catalogued

---

## All Needed Context

### Context Completeness Check

**Question**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file path and line numbers
- Complete source code with comments
- Dependency locations and imports
- Error code constants referenced
- Decision tree visualization
- Migration path recommendations
- Integration point catalog

### Documentation & References

```yaml
# MUST READ - Critical for understanding #isFatalError implementation

- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Contains the private #isFatalError() method to be documented
  pattern: Lines 377-417 (method definition), Lines 34-41 (type guard imports)
  gotcha: Method uses instance state (this.#continueOnError, this.logger) that must be removed for extraction
  critical: Method is private (# prefix), not accessible outside PRPPipeline class

- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Contains error class definitions and type guard functions used by #isFatalError
  pattern: All type guard exports (isPipelineError, isSessionError, isTaskError, isAgentError, isValidationError)
  gotcha: EnvironmentError was recently added and is not explicitly handled by #isFatalError
  section: ErrorCodes enum for error code constants

- file: /home/dustin/projects/hacky-hack/tests/integration/utils/error-handling.test.ts
  why: Integration tests expect isFatalError to be exported from errors.ts
  pattern: Test cases for fatal vs non-fatal error detection
  gotcha: Tests are currently failing because function is not exported

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md
  why: Output artifact containing complete implementation analysis
  pattern: Complete documentation of logic, dependencies, and migration path
  gotcha: This file is created by this subtask, not read from

- url: https://github.com/anthropics/claude-code/issues/[PRD-Issue-2]
  why: PRD Issue 2 defines fatal vs non-fatal error specification
  critical: PRD specifies: Fatal=SessionError,EnvironmentError; Non-Fatal=TaskError,AgentError,ValidationError
  gotcha: Actual implementation differs from PRD - see architecture doc for details

- commit: dba41a5c79b3b42e4c2154607e33e532b360fbbb
  why: Git commit that introduced #isFatalError() method
  date: 2026-01-14
  message: "feat: Add comprehensive error recovery with fatal/non-fatal detection and error reports"
  critical: Original implementation context and rationale
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── utils/
│   ├── errors.ts                    # Error classes, type guards, ErrorCodes (SOURCE OF TRUTH)
│   └── ...
├── workflows/
│   ├── prp-pipeline.ts              # PRPPipeline class with #isFatalError() method
│   └── ...
└── ...

tests/
├── integration/
│   └── utils/
│       └── error-handling.test.ts   # Tests expecting isFatalError export
└── ...

plan/
└── 002_1e734971e481/
    └── bugfix/
        └── 001_8d809cc989b9/
            ├── architecture/         # OUTPUT DIRECTORY FOR THIS SUBTASK
            │   └── isFatalError-existing-implementation.md
            └── P1M2T1S1/
                └── PRP.md            # THIS FILE
```

### Desired Codebase Tree (After Completion)

```bash
plan/
└── 002_1e734971e481/
    └── bugfix/
        └── 001_8d809cc989b9/
            ├── architecture/
            │   └── isFatalError-existing-implementation.md  # CREATED BY THIS SUBTASK
            └── P1M2T1S1/
                └── PRP.md                                    # THIS FILE
```

**Note**: This subtask does NOT modify any source code. It only creates documentation.

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: TypeScript Private Method Syntax
// The # prefix denotes a private class field/method (ECMAScript private fields)
// These are NOT accessible via standard prototype manipulation or reflection
#isFatalError(error: unknown): boolean { /* ... */ }

// CRITICAL: Type Guard Type Narrowing
// Always use type guards before accessing error-specific properties
if (isPipelineError(error)) {
  // error is narrowed to PipelineError
  console.log(error.code); // Safe access
}

// GOTCHA: Optional Chaining for Context Objects
// error.context might be undefined, always use optional chaining
error.context?.operation === 'parse_prd'

// GOTCHA: Error Code Constants vs String Literals
// Use ErrorCodes enum, not string literals
ErrorCodes.PIPELINE_SESSION_LOAD_FAILED  // CORRECT
'PIPELINE_SESSION_LOAD_FAILED'           // AVOID (no type safety)

// CRITICAL: Default Parameter for continueOnError
// When extracting, add default parameter to preserve existing behavior
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false
): boolean { /* ... */ }

// GOTCHA: Logger Dependency
// #isFatalError uses this.logger.warn() - extraction should NOT log
// Let caller handle logging based on return value

// PATTERN: Return Early for Clarity
// Method returns early for non-fatal conditions
if (this.#continueOnError) return false;
if (error == null) return false;
```

### Git History Context

**Commit**: `dba41a5c79b3b42e4c2154607e33e532b360fbbb`
**Date**: 2026-01-14
**Message**: "feat: Add comprehensive error recovery with fatal/non-fatal detection and error reports"
**Changes**:
- Added `#isFatalError()` private method to PRPPipeline
- Added `#trackFailure()` method for error tracking
- Added error report generation (ERROR_REPORT.md)
- Added fatal/non-fatal error handling to all pipeline phases
- Files modified: `src/workflows/prp-pipeline.ts` (+521 lines)

**Key Insight**: The `#isFatalError()` method was added as part of a comprehensive error recovery feature, but was never extracted as a public utility despite being needed by integration tests.

---

## Implementation Blueprint

### Research Tasks (Ordered by Dependencies)

```yaml
Task 1: READ src/workflows/prp-pipeline.ts
  - READ: Lines 377-417 (#isFatalError method definition)
  - READ: Lines 34-41 (type guard imports)
  - READ: Lines 539, 666, 764, 953, 1238 (method call sites)
  - EXTRACT: Complete method implementation with JSDoc comments
  - NOTE: All dependencies on instance state (this.#continueOnError, this.logger)

Task 2: READ src/utils/errors.ts
  - IDENTIFY: All type guard functions (isPipelineError, isSessionError, etc.)
  - IDENTIFY: ErrorCodes enum constants referenced in #isFatalError
  - NOTE: EnvironmentError class exists but not used in #isFatalError
  - NOTE: All type guards follow pattern: isXxxError(error: unknown): error is XxxError

Task 3: READ tests/integration/utils/error-handling.test.ts
  - IDENTIFY: Test cases expecting isFatalError export
  - NOTE: Fatal vs non-fatal error test scenarios
  - NOTE: Expected behavior for each error type

Task 4: READ PRD Issue 2 Specification
  - LOCATE: Bugfix documentation in plan/002_1e734971e481/bugfix/001_8d809cc989b9/
  - NOTE: PRD specification vs actual implementation differences
  - DOCUMENT: Discrepancies in architecture doc

Task 5: CREATE architecture/isFatalError-existing-implementation.md
  - IMPLEMENT: Complete documentation with sections:
    * Overview and metadata
    * Source location and git history
    * Complete implementation code
    * Logic flow decision tree
    * Fatal/non-fatal classification rules
    * Dependencies and type guards used
    * Usage locations in PRPPipeline
    * Design decisions and rationale
    - Differences from PRD specification
    * Testing considerations
    * Integration points
    * Migration path for extraction
  - FOLLOW: Markdown documentation format with code blocks
  - INCLUDE: Visual decision tree (ASCII art)
  - PLACE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/

Task 6: CREATE P1M2T1S1/PRP.md
  - IMPLEMENT: This PRP file using template structure
  - POPULATE: All context from research Tasks 1-5
  - VALIDATE: Context completeness check passes
  - PLACE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S1/
```

### Research Patterns & Key Details

```markdown
# Documentation Structure Template

1. **Header Section**
   - Title, date, analyzed-by, location metadata
   - Quick overview paragraph

2. **Implementation Details**
   - Source file path and line numbers
   - Git commit origin
   - Complete source code block
   - JSDoc comments

3. **Logic Flow Analysis**
   - ASCII art decision tree
   - Fatal condition requirements (AND logic)
   - Non-fatal condition requirements (OR logic)

4. **Dependencies**
   - Type guards imported
   - Error codes referenced
   - Instance state accessed

5. **Usage in PRPPipeline**
   - 5 call locations with line numbers
   - Error handling pattern examples

6. **Key Design Decisions**
   - Default to non-fatal rationale
   - Context-sensitive classification
   - Continue-on-error override
   - Specific error code matching

7. **PRD Specification Comparison**
   - PRD fatal errors vs actual
   - PRD non-fatal errors vs actual
   - Discrepancies table

8. **Testing Considerations**
   - Edge cases covered
   - Type narrowing examples
   - Integration test expectations

9. **Integration Points**
   - Error tracking via #trackFailure()
   - Error reporting in ERROR_REPORT.md
   - Structured logging

10. **Migration Path**
    - Proposed function signature
    - Parameter changes (remove instance state)
    - Export location (errors.ts)
    - Backward compatibility notes
```

### Integration Points

```yaml
ERROR_HIERARCHY:
  - location: src/utils/errors.ts
  - exports: isPipelineError, isSessionError, isTaskError, isAgentError, isValidationError, ErrorCodes
  - usage: #isFatalError uses all these type guards for error classification

PIPELINE_WORKFLOW:
  - location: src/workflows/prp-pipeline.ts
  - call_sites: initializeSession(), handleDelta(), decomposePRD(), executeBacklog(), runQACycle()
  - pattern: try-catch with fatal/non-fatal branching

TEST_INFRASTRUCTURE:
  - location: tests/integration/utils/error-handling.test.ts
  - expects: isFatalError export from errors.ts
  - status: Currently failing (function not exported)

CLI_OPTIONS:
  - flag: --continue-on-error (maps to #continueOnError)
  - effect: Overrides all fatal error detection when true
  - location: src/cli/index.ts, src/workflows/prp-pipeline.ts constructor

ERROR_REPORTING:
  - output: ERROR_REPORT.md in session directory
  - content: Failed tasks with error types and messages
  - trigger: Generated at pipeline shutdown if #failedTasks.size > 0
```

---

## Validation Loop

### Level 1: Documentation Completeness (Immediate Feedback)

```bash
# Verify architecture documentation exists
ls -la plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md

# Check documentation has all required sections
grep -E "^(##|###)" plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md

# Verify documentation contains implementation code
grep -A 5 "#isFatalError(error: unknown)" plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md

# Expected: Documentation exists with all sections
# If missing: Add missing sections to architecture doc
```

### Level 2: Context Validation (Content Verification)

```bash
# Verify documentation references correct file paths
grep "src/workflows/prp-pipeline.ts" plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md

# Verify documentation includes git commit hash
grep "dba41a5" plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md

# Verify documentation lists all dependencies
grep -E "(isPipelineError|isSessionError|isTaskError|isAgentError|isValidationError)" plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md

# Expected: All dependencies referenced with file paths
# If missing: Add missing references to documentation
```

### Level 3: PRP Completeness (Template Compliance)

```bash
# Verify PRP has all required template sections
grep -E "^(## Goal|## Why|## What|## All Needed Context|## Implementation Blueprint|## Validation Loop|## Final Validation)" plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S1/PRP.md

# Verify PRP context completeness check
grep -A 5 "Context Completeness Check" plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S1/PRP.md

# Expected: All template sections present
# If missing: Add missing template sections
```

### Level 4: Readability Validation (Human Review)

```bash
# Read architecture documentation for clarity
cat plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/isFatalError-existing-implementation.md

# Read PRP for completeness
cat plan/002_1e734971e481/bugfix/001_8d809cc989b9/P1M2T1S1/PRP.md

# Validation Questions:
# 1. Can someone unfamiliar with the codebase understand #isFatalError logic?
# 2. Are all dependencies clearly identified with file paths?
# 3. Is the decision tree easy to follow?
# 4. Are migration recommendations actionable?
# 5. Does the PRP pass the "No Prior Knowledge" test?
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Architecture documentation exists at specified path
- [ ] Documentation includes complete source code (lines 377-417)
- [ ] Decision tree visualizes logic flow clearly
- [ ] All dependencies are identified (type guards, error codes, instance state)
- [ ] Fatal vs non-fatal classification rules are documented
- [ ] PRD specification differences are noted
- [ ] Integration points are catalogued (5 call sites)
- [ ] Migration path recommendations are actionable

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Documentation is readable and well-structured
- [ ] Code examples are accurate and complete
- [ ] Gotchas and warnings are highlighted
- [ ] Git history context is preserved

### Code Quality Validation

- [ ] Documentation follows markdown best practices
- [ ] Code blocks use syntax highlighting
- [ ] ASCII art decision tree is properly formatted
- [ ] Section hierarchy is logical (H1, H2, H3)
- [ ] Links and references are accurate

### Documentation & Deployment

- [ ] File paths are absolute and correct
- [ ] Line numbers match current source code
- [ ] Git commit hash is accurate
- [ ] Metadata (date, author, location) is complete
- [ ] PRP passes "No Prior Knowledge" test

---

## Anti-Patterns to Avoid

- **Don't modify source code** - This is a research-only subtask
- **Don't create tests yet** - Tests come in P1.M2.T1.S2
- **Don't implement the extraction** - Implementation comes in P1.M2.T1.S3
- **Don't skip documentation** - The architecture doc IS the deliverable
- **Don't guess at logic** - Read the actual source code, don't assume
- **Don't ignore PRD differences** - Document discrepancies clearly
- **Don't forget instance state** - Note dependencies on `this.#continueOnError` and `this.logger`
- **Don't omit call sites** - Catalog all 5 locations where method is called
- **Don't skip git history** - Preserve context from commit dba41a5
- **Don't write vague documentation** - Be specific and actionable

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Rationale**:
- Source code is available and well-documented
- All dependencies are identified with file paths
- Decision tree provides clear logic visualization
- Migration recommendations are specific and actionable
- Architecture documentation enables immediate extraction implementation

**Validation**: The completed architecture documentation and PRP should enable a developer unfamiliar with the codebase to:
1. Understand the `#isFatalError()` implementation completely
2. Identify all dependencies and integration points
3. Extract the logic to a pure function without class dependencies
4. Implement unit tests for the extracted function
5. Update PRPPipeline to use the imported utility

**Next Steps**:
- P1.M2.T1.S2: Write failing tests for `isFatalError` function
- P1.M2.T1.S3: Implement `isFatalError` function in errors.ts
- P1.M2.T2.S1: Refactor PRPPipeline to import and use `isFatalError`
- P1.M2.T3.S1: Run fatal error detection integration tests

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-16
**Status**: Ready for Implementation (Research Phase Complete)
