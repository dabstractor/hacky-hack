# Product Requirement Prompt: Update PRP Pipeline to Pass Session Path to FixCycleWorkflow

---

## Goal

**Feature Goal**: Update the PRP Pipeline's `runQACycle()` method to pass `sessionPath` to BugHuntWorkflow and FixCycleWorkflow, enabling the new file-based TEST_RESULTS.md workflow architecture.

**Deliverable**: Modified `src/workflows/prp-pipeline.ts` with updated BugHuntWorkflow and FixCycleWorkflow instantiation, and removed duplicate TEST_RESULTS.md writing logic.

**Success Definition**:
- BugHuntWorkflow.run() is called with `sessionPath` parameter
- FixCycleWorkflow constructor receives `sessionPath` (string) not `testResults` (TestResults)
- TEST_RESULTS.md is written by BugHuntWorkflow (JSON format) not PRP Pipeline (Markdown)
- All unit and integration tests pass with 100% coverage
- No compilation errors

## Why

- **Workflow Alignment**: FixCycleWorkflow constructor was changed in commit `0f7fdce` to accept `sessionPath: string` instead of `testResults: TestResults`, but PRP Pipeline was not updated
- **File-Based Architecture**: BugHuntWorkflow now writes TEST_RESULTS.md automatically when sessionPath is provided (commit `8415df7`), but PRP Pipeline doesn't pass it
- **Format Consistency**: PRP Pipeline writes TEST_RESULTS.md in Markdown format, but FixCycleWorkflow expects JSON format (via `#loadBugReport()`)
- **Duplicate Logic**: PRP Pipeline has duplicate TEST_RESULTS.md writing code that should be handled by BugHuntWorkflow
- **Single Responsibility**: BugHuntWorkflow should handle bug report writing, not PRP Pipeline

## What

Update PRP Pipeline's `runQACycle()` method to:

1. Pass `sessionPath` to BugHuntWorkflow.run() to enable automatic TEST_RESULTS.md writing
2. Update FixCycleWorkflow constructor call to use `sessionPath` instead of `testResults`
3. Remove duplicate TEST_RESULTS.md writing code (Phase 4, lines 1214-1285)
4. Add sessionPath validation before BugHuntWorkflow.run()

### Success Criteria

- [ ] BugHuntWorkflow.run() called with `sessionPath` parameter at line 1146
- [ ] FixCycleWorkflow constructor receives `sessionPath` (string) at line 1166
- [ ] Phase 4 (TEST_RESULTS.md write) completely removed (lines 1214-1285)
- [ ] SessionPath validation added before BugHuntWorkflow.run()
- [ ] All unit tests pass: `npm run test:run tests/unit/workflows/prp-pipeline.test.ts`
- [ ] All integration tests pass: `npm run test:run tests/integration/prp-pipeline-integration.test.ts`
- [ ] No TypeScript compilation errors
- [ ] No linting errors: `npm run lint`

---

## All Needed Context

### Context Completeness Check

✅ **No Prior Knowledge Test**: If someone knew nothing about this codebase, they would have everything needed to implement this successfully using the context below.

### Documentation & References

```yaml
# MUST READ - Critical context for implementation

- file: src/workflows/prp-pipeline.ts
  why: Main file to modify - contains runQACycle() method with FixCycleWorkflow instantiation
  lines: 1078-1360 (runQACycle method)
  lines: 1145-1146 (BugHuntWorkflow.run() call - needs sessionPath)
  lines: 1165-1170 (FixCycleWorkflow constructor - needs sessionPath)
  lines: 1214-1285 (TEST_RESULTS.md write - needs removal)
  gotcha: Must preserve all error handling and phase transitions

- file: src/workflows/fix-cycle-workflow.ts
  why: Reference for new constructor signature and loadBugReport implementation
  lines: 107-140 (Constructor signature - sessionPath as first parameter)
  lines: 447-522 (loadBugReport method - reads TEST_RESULTS.md)
  lines: 305-318 (run() method - calls loadBugReport)
  pattern: Constructor validates sessionPath is non-empty string
  gotcha: Constructor throws Error if sessionPath is invalid

- file: src/workflows/bug-hunt-workflow.ts
  why: Reference for writeBugReport and automatic TEST_RESULTS.md writing
  lines: 323-385 (writeBugReport method - writes JSON format)
  lines: 411-456 (run() method - calls writeBugReport if sessionPath provided)
  lines: 340-345 (Severity filtering - only write if critical/major bugs)
  pattern: Uses atomicWrite() for safe file writes
  gotcha: Only writes if critical or major bugs present

- file: src/core/session-manager.ts
  why: SessionManager interface for accessing session path
  lines: 884-929 (SessionState and SessionMetadata interfaces)
  pattern: sessionManager.currentSession.metadata.path
  gotcha: currentSession can be null - must check before accessing

- file: src/core/models.ts
  why: TestResults and Bug type definitions
  lines: 1838-1879 (TestResults interface)
  lines: 1710-1771 (Bug interface)
  lines: 1902-1907 (TestResultsSchema for Zod validation)
  pattern: JSON structure with hasBugs, bugs[], summary, recommendations[]

- file: tests/unit/workflows/prp-pipeline.test.ts
  why: Existing unit tests for PRP Pipeline - must update after changes
  pattern: Vitest framework with vi.fn() mocking
  lines: 1-184 (test file structure and imports)
  gotcha: FixCycleWorkflow mock expects OLD signature (testResults) - needs update

- file: tests/integration/prp-pipeline-integration.test.ts
  why: Integration tests for PRP Pipeline - may need updates
  pattern: Real SessionManager/TaskOrchestrator with mocked agents
  gotcha: Tests might expect Phase 4 behavior - needs adjustment

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T2S4/research/01_prp_pipeline_current_state.md
  why: Detailed analysis of current PRP Pipeline implementation
  section: Current FixCycleWorkflow Instantiation

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T2S4/research/02_fixcycleworkflow_constructor.md
  why: Complete documentation of FixCycleWorkflow constructor changes
  section: Constructor Signature and Change History

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T2S4/research/03_bughuntworkflow_write.md
  why: Documentation of BugHuntWorkflow's automatic TEST_RESULTS.md writing
  section: writeBugReport Method and Automatic Write in run()

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T2S4/research/04_session_path_patterns.md
  why: Session path access patterns used throughout codebase
  section: Primary Access Pattern

- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T2S4/research/05_testing_patterns.md
  why: Testing patterns for PRP Pipeline and FixCycleWorkflow
  section: Mocking Patterns for FixCycleWorkflow
```

### Current Codebase Tree

```bash
src/
├── workflows/
│   ├── prp-pipeline.ts          # MODIFICATION TARGET (2,025 lines)
│   ├── bug-hunt-workflow.ts     # REFERENCE (456 lines)
│   └── fix-cycle-workflow.ts    # REFERENCE (584 lines)
├── core/
│   ├── session-manager.ts       # REFERENCE (for session path access)
│   ├── models.ts                # REFERENCE (for TestResults type)
│   └── session-utils.ts         # REFERENCE (for atomicWrite utility)
└── agents/
    ├── prp-runtime.ts           # REFERENCE (session path pattern)
    └── prp-generator.ts         # REFERENCE (session path pattern)

tests/
├── unit/workflows/
│   ├── prp-pipeline.test.ts             # MAY NEED UPDATES
│   ├── prp-pipeline-progress.test.ts    # REFERENCE
│   ├── bug-hunt-workflow.test.ts        # REFERENCE
│   └── fix-cycle-workflow.test.ts       # REFERENCE (sessionPath constructor)
└── integration/
    ├── prp-pipeline-integration.test.ts # MAY NEED UPDATES
    └── fix-cycle-workflow-integration.test.ts # REFERENCE

plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M2T2S4/
├── PRP.md                           # THIS FILE
└── research/                        # Research documentation
    ├── 01_prp_pipeline_current_state.md
    ├── 02_fixcycleworkflow_constructor.md
    ├── 03_bughuntworkflow_write.md
    ├── 04_session_path_patterns.md
    └── 05_testing_patterns.md
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: FixCycleWorkflow constructor signature changed in commit 0f7fdce
// OLD: FixCycleWorkflow(testResults: TestResults, prdContent, orchestrator, sessionManager)
// NEW: FixCycleWorkflow(sessionPath: string, prdContent, orchestrator, sessionManager)
// If you use OLD signature, TypeScript compilation will FAIL

// CRITICAL: sessionManager.currentSession can be null
// Always check before accessing metadata.path
const sessionPath = this.sessionManager.currentSession?.metadata.path;
if (!sessionPath) {
  throw new Error('[PRPPipeline] Session path not available');
}

// CRITICAL: BugHuntWorkflow.run() accepts optional sessionPath parameter
// If provided, it automatically calls writeBugReport() to write TEST_RESULTS.md
// If NOT provided, it skips TEST_RESULTS.md writing (current bug)
const testResults = await bugHuntWorkflow.run(sessionPath); // ✅ Correct
const testResults = await bugHuntWorkflow.run(); // ❌ Wrong - no write

// CRITICAL: TEST_RESULTS.md file format mismatch
// BugHuntWorkflow writes: JSON.stringify(testResults, null, 2)
// PRP Pipeline currently writes: Markdown with emoji tables
// FixCycleWorkflow.loadBugReport() expects: JSON (uses JSON.parse())
// Therefore: PRP Pipeline write must be removed

// CRITICAL: BugHuntWorkflow severity filtering
// writeBugReport() only writes if critical or major bugs present
// Minor and cosmetic bugs don't trigger file write
// This is intentional - prevents unnecessary writes

// CRITICAL: atomicWrite utility usage
// Always use atomicWrite() from src/core/session-utils.ts
// Never use writeFile() directly for session files
// Prevents corruption if process crashes mid-write

// CRITICAL: TestResultsSchema validation
// FixCycleWorkflow uses Zod's TestResultsSchema.parse()
// Expects strict JSON structure matching interface
// Invalid JSON throws Error with descriptive message

// CRITICAL: Phase numbering in runQACycle()
// Currently 5 phases - after removing Phase 4, must renumber
// Phase 3: Update state (lines 1203-1208)
// Phase 4: Write TEST_RESULTS.md (lines 1214-1285) ← REMOVE
// Phase 5: Console summary (lines 1287-1333) ← becomes Phase 4

// CRITICAL: Error handling in runQACycle()
// Fix cycle failures are non-fatal (logged but continue)
// Must preserve try-catch around FixCycleWorkflow.run()
// Must preserve "using original results" fallback logic

// CRITICAL: FixCycleWorkflow.loadBugReport() dependencies
// Uses node:fs/promises (access, readFile)
// Uses node:path (resolve)
// All imports already in prp-pipeline.ts (dynamic import at line 1220)
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Existing models are referenced:

```typescript
// From src/core/models.ts
interface TestResults {
  readonly hasBugs: boolean;
  readonly bugs: Bug[];
  readonly summary: string;
  readonly recommendations: string[];
}

interface Bug {
  readonly id: string;
  readonly severity: 'critical' | 'major' | 'minor' | 'cosmetic';
  readonly title: string;
  readonly description: string;
  readonly reproduction: string;
  readonly location?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ and understand current runQACycle() implementation
  - READ: src/workflows/prp-pipeline.ts lines 1078-1360
  - IDENTIFY: All locations where BugHuntWorkflow and FixCycleWorkflow are used
  - UNDERSTAND: Phase structure and error handling patterns
  - NOTE: Current constructor signatures and parameters passed
  - NO CHANGES: This is research only

Task 2: UPDATE BugHuntWorkflow.run() call to pass sessionPath
  - LOCATE: Line 1145-1146 in src/workflows/prp-pipeline.ts
  - BEFORE: const testResults = await bugHuntWorkflow.run();
  - AFTER: Add sessionPath extraction and validation
  - EXTRACT: const sessionPath = this.sessionManager.currentSession?.metadata.path;
  - VALIDATE: if (!sessionPath) { throw new Error('[PRPPipeline] Session path not available'); }
  - PASS: const testResults = await bugHuntWorkflow.run(sessionPath);
  - PRESERVE: All existing error handling and logging
  - PLACEMENT: Phase 1: Bug Hunt section

Task 3: UPDATE FixCycleWorkflow constructor to use sessionPath
  - LOCATE: Lines 1165-1170 in src/workflows/prp-pipeline.ts
  - BEFORE: new FixCycleWorkflow(testResults, prdContent, ...)
  - AFTER: new FixCycleWorkflow(sessionPath, prdContent, ...)
  - REMOVE: testResults from constructor call
  - ADD: sessionPath as first parameter
  - PRESERVE: prdContent, taskOrchestrator, sessionManager parameters
  - PRESERVE: All try-catch error handling around fix cycle
  - PLACEMENT: Phase 2: Fix Cycle section

Task 4: REMOVE Phase 4 TEST_RESULTS.md writing logic
  - LOCATE: Lines 1214-1285 in src/workflows/prp-pipeline.ts
  - IDENTIFY: "Phase 4: Write TEST_RESULTS.md (if bugs found)" comment
  - DELETE: Entire Phase 4 section (including imports if only used here)
  - REMOVE: Dynamic imports of node:path and node:fs/promises (lines 1217-1218)
  - REMOVE: All Markdown content generation logic
  - REMOVE: writeFile() call
  - PRESERVE: Phase 5 (Console Summary) - will be renumbered

Task 5: UPDATE phase comments after Phase 4 removal
  - LOCATE: Lines 1203-1333 in src/workflows/prp-pipeline.ts
  - RENAME: "Phase 5: Print console summary" → "Phase 4: Print console summary"
  - VERIFY: All phase transitions still correct
  - VERIFY: currentPhase updates are accurate

Task 6: UPDATE unit tests for new constructor signature
  - LOCATE: tests/unit/workflows/prp-pipeline.test.ts
  - FIND: FixCycleWorkflow mock (likely vi.mock() at top of file)
  - UPDATE: Mock to expect sessionPath as first parameter
  - FIND: Tests that verify FixCycleWorkflow constructor calls
  - UPDATE: Expectation to match new signature
  - ENSURE: Mock returns valid TestResults with hasBugs property
  - RUN: npm run test:run tests/unit/workflows/prp-pipeline.test.ts

Task 7: VERIFY integration tests still pass
  - LOCATE: tests/integration/prp-pipeline-integration.test.ts
  - RUN: npm run test:run tests/integration/prp-pipeline-integration.test.ts
  - VERIFY: No test failures related to Phase 4 removal
  - VERIFY: FixCycleWorkflow instantiation works correctly
  - VERIFY: TEST_RESULTS.md is written by BugHuntWorkflow
  - CHECK: Test file cleanup (if Phase 4 tests exist)

Task 8: RUN TypeScript compilation check
  - RUN: npm run build (if exists) or npx tsc --noEmit
  - VERIFY: No compilation errors
  - CHECK: FixCycleWorkflow import resolution
  - CHECK: TestResults type resolution

Task 9: RUN linting and formatting
  - RUN: npm run lint
  - VERIFY: No linting errors
  - RUN: npm run format (if exists)
  - VERIFY: Code formatting consistent

Task 10: MANUAL VERIFICATION of TEST_RESULTS.md behavior
  - CREATE: Test session with bugs
  - RUN: PRP Pipeline with bug-hunt mode
  - VERIFY: TEST_RESULTS.md is written in JSON format (not Markdown)
  - VERIFY: JSON content matches TestResults interface
  - VERIFY: FixCycleWorkflow can load and parse the file
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Session path extraction with validation
// Location: src/workflows/prp-pipeline.ts (add after line 1143)
const sessionPath = this.sessionManager.currentSession?.metadata.path;
if (!sessionPath) {
  throw new Error('[PRPPipeline] Session path not available for QA cycle');
}

// GOTCHA: currentSession can be null - must check before accessing
// PATTERN: Use optional chaining (?.) for safe property access
// REFERENCE: Similar pattern at lines 1215, 1326, 1508, 1624

// PATTERN 2: BugHuntWorkflow.run() with sessionPath
// Location: src/workflows/prp-pipeline.ts (update line 1146)
// BEFORE:
const testResults = await bugHuntWorkflow.run();

// AFTER:
const testResults = await bugHuntWorkflow.run(sessionPath);

// BENEFIT: BugHuntWorkflow will automatically call writeBugReport()
// REFERENCE: src/workflows/bug-hunt-workflow.ts lines 425-431

// PATTERN 3: FixCycleWorkflow constructor with sessionPath
// Location: src/workflows/prp-pipeline.ts (update line 1166)
// BEFORE:
const fixCycleWorkflow = new FixCycleWorkflow(
  testResults,        // ❌ OLD: TestResults object
  prdContent,
  this.taskOrchestrator,
  this.sessionManager
);

// AFTER:
const fixCycleWorkflow = new FixCycleWorkflow(
  sessionPath,        // ✅ NEW: string path to session directory
  prdContent,
  this.taskOrchestrator,
  this.sessionManager
);

// CRITICAL: Parameter order matters - sessionPath must be first
// REFERENCE: src/workflows/fix-cycle-workflow.ts lines 107-140

// PATTERN 4: Error handling preservation
// Location: src/workflows/prp-pipeline.ts (preserve around lines 1171-1193)
// DO NOT MODIFY: Try-catch around FixCycleWorkflow.run()
// PRESERVE: "using original results" fallback logic
// PRESERVE: Warning log if fix cycle fails

try {
  const fixResults = await fixCycleWorkflow.run();

  const bugsRemaining = fixResults.bugs.length;
  const bugsFixed = testResults.bugs.length - bugsRemaining;

  this.logger.info('[PRPPipeline] Fix cycle complete', {
    bugsFixed,
    bugsRemaining,
    hasBugs: fixResults.hasBugs,
  });

  finalResults = fixResults;

  if (bugsRemaining > 0) {
    this.logger.warn(
      `[PRPPipeline] Fix cycle completed with ${bugsRemaining} bugs remaining`
    );
  }
} catch (fixError) {
  const errorMessage =
    fixError instanceof Error ? fixError.message : String(fixError);
  this.logger.warn(
    `[PRPPipeline] Fix cycle failed (continuing with original results): ${errorMessage}`
  );
  // Keep original testResults as finalResults
}

// PATTERN 5: Phase 4 removal - what to delete
// Location: src/workflows/prp-pipeline.ts lines 1214-1285
// DELETE ENTIRELY:

// Phase 4: Write TEST_RESULTS.md (if bugs found)
if (finalResults.bugs.length > 0) {
  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (sessionPath) {
    const { resolve } = await import('node:path');
    const { writeFile } = await import('node:fs/promises');

    const resultsPath = resolve(sessionPath, 'TEST_RESULTS.md');

    // ... all Markdown content generation ...
    // ... all severity counting ...
    // ... all writeFile() call ...

    await writeFile(resultsPath, content, 'utf-8');
    this.logger.info(
      `[PRPPipeline] TEST_RESULTS.md written to ${resultsPath}`
    );
  }
}

// PATTERN 6: Test mock update
// Location: tests/unit/workflows/prp-pipeline.test.ts
// BEFORE:
vi.mock('../../../src/workflows/fix-cycle-workflow.js', () => ({
  FixCycleWorkflow: vi.fn().mockImplementation((testResults, prdContent, orchestrator, sessionManager) => ({
    run: vi.fn().mockResolvedValue({ hasBugs: false, bugs: [], summary: 'All bugs fixed', recommendations: [] }),
  })),
}));

// AFTER:
vi.mock('../../../src/workflows/fix-cycle-workflow.js', () => ({
  FixCycleWorkflow: vi.fn().mockImplementation((sessionPath, prdContent, orchestrator, sessionManager) => ({
    run: vi.fn().mockResolvedValue({ hasBugs: false, bugs: [], summary: 'All bugs fixed', recommendations: [] }),
  })),
}));

// CRITICAL: First parameter changed from testResults to sessionPath
```

### Integration Points

```yaml
BUGHUNTWORKFLOW:
  - file: src/workflows/bug-hunt-workflow.ts
  - method: run(sessionPath?: string)
  - behavior: If sessionPath provided, calls writeBugReport() automatically
  - format: JSON with 2-space indentation
  - condition: Only writes if critical or major bugs present
  - utility: Uses atomicWrite() for safe file operations

FIXCYCLEWORKFLOW:
  - file: src/workflows/fix-cycle-workflow.ts
  - constructor: FixCycleWorkflow(sessionPath: string, ...)
  - method: run() calls #loadBugReport() internally
  - format: Expects JSON (uses JSON.parse())
  - validation: Uses Zod TestResultsSchema.parse()

SESSIONMANAGER:
  - file: src/core/session-manager.ts
  - property: currentSession.metadata.path
  - type: string | null
  - access: Must check for null before using

TEST_RESULTS.MD:
  - location: {sessionPath}/TEST_RESULTS.md
  - format: JSON (not Markdown, despite .md extension)
  - writer: BugHuntWorkflow.writeBugReport()
  - reader: FixCycleWorkflow.#loadBugReport()
  - validation: TestResultsSchema (Zod)

ERROR_HANDLING:
  - fix cycle failures: Non-fatal, log warning and continue
  - session path missing: Fatal, throw Error
  - file not found: Fatal in FixCycleWorkflow (throws)
  - invalid JSON: Fatal in FixCycleWorkflow (throws)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After completing implementation tasks

# TypeScript compilation check
npx tsc --noEmit

# Expected: Zero errors. Fix any type errors before proceeding.

# Linting check
npm run lint

# Expected: Zero warnings. Fix any linting issues.

# Formatting check
npm run format

# Expected: Code formatted consistently.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run PRP Pipeline unit tests
npm run test:run tests/unit/workflows/prp-pipeline.test.ts

# Expected: All tests pass. Fix any failures.

# Run BugHuntWorkflow unit tests (ensure no regressions)
npm run test:run tests/unit/workflows/bug-hunt-workflow.test.ts

# Expected: All tests pass.

# Run FixCycleWorkflow unit tests (ensure no regressions)
npm run test:run tests/unit/workflows/fix-cycle-workflow.test.ts

# Expected: All tests pass.

# Run all workflow unit tests
npm run test:run tests/unit/workflows/

# Expected: All tests pass with 100% coverage.

# Coverage report
npm run test:coverage

# Expected: 100% coverage maintained.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run PRP Pipeline integration tests
npm run test:run tests/integration/prp-pipeline-integration.test.ts

# Expected: All tests pass. Verify tests don't expect Phase 4 behavior.

# Run FixCycleWorkflow integration tests
npm run test:run tests/integration/fix-cycle-workflow-integration.test.ts

# Expected: All tests pass.

# Manual verification: Create test session and run QA
cd /home/dustin/projects/hacky-hack

# Build the project
npm run build

# Run PRP Pipeline in bug-hunt mode
node dist/index.js prd --mode bug-hunt --prd ./plan/003_b3d3efdaf0ed/delta_prd.md

# Expected: Pipeline completes successfully
# Expected: TEST_RESULTS.md written in JSON format
# Expected: No Markdown content in TEST_RESULTS.md

# Verify TEST_RESULTS.md format
cat plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/TEST_RESULTS.md

# Expected: Valid JSON with hasBugs, bugs, summary, recommendations
# Expected: Can be parsed with jq or JSON.parse()

# Verify JSON validity
jq . plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/TEST_RESULTS.md

# Expected: Pretty-printed JSON, no parse errors
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Workflow execution order verification
# Run test that verifies BugHuntWorkflow runs before FixCycleWorkflow
npm run test:run tests/unit/workflows/prp-pipeline.test.ts -t "should run FixCycleWorkflow when bugs are found"

# Expected: Test passes with new constructor signature

# Session path propagation verification
# Add test-specific logging to verify sessionPath reaches BugHuntWorkflow
# (temporary debugging - remove after verification)

# TEST_RESULTS.md format validation
# Verify file is valid JSON
node -e "const fs = require('fs'); const data = fs.readFileSync('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/TEST_RESULTS.md', 'utf8'); JSON.parse(data); console.log('✓ Valid JSON');"

# Expected: "✓ Valid JSON" output

# Verify FixCycleWorkflow can load the file
# (Simulate FixCycleWorkflow.loadBugReport behavior)
node -e "
const fs = require('fs');
const path = require('path');
const sessionPath = 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918';
const resultsPath = path.resolve(sessionPath, 'TEST_RESULTS.md');
const content = fs.readFileSync(resultsPath, 'utf8');
const parsed = JSON.parse(content);
console.log('✓ Has bugs:', parsed.hasBugs);
console.log('✓ Bug count:', parsed.bugs.length);
console.log('✓ Summary:', parsed.summary);
"

# Expected: Valid TestResults structure printed

# Severity filtering verification
# Run BugHuntWorkflow with only minor/cosmetic bugs
# Verify TEST_RESULTS.md is NOT written (BugHuntWorkflow skips write)

# Run BugHuntWorkflow with critical/major bugs
# Verify TEST_RESULTS.md IS written

# Error handling verification
# Run with no session path available
# Expected: Error thrown with message "Session path not available"

# Run with invalid TEST_RESULTS.md (if manually testing FixCycleWorkflow)
# Expected: Error thrown with descriptive message

# Performance validation (optional)
# Measure time for TEST_RESULTS.md write
# Should be < 100ms for typical bug reports
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npx tsc --noEmit`
- [ ] All unit tests pass: `npm run test:run tests/unit/workflows/prp-pipeline.test.ts`
- [ ] All integration tests pass: `npm run test:run tests/integration/prp-pipeline-integration.test.ts`
- [ ] No linting errors: `npm run lint`
- [ ] Code formatted consistently: `npm run format`
- [ ] 100% test coverage maintained: `npm run test:coverage`

### Feature Validation

- [ ] BugHuntWorkflow.run() called with `sessionPath` parameter (line 1146)
- [ ] FixCycleWorkflow constructor receives `sessionPath` not `testResults` (line 1166)
- [ ] Phase 4 (TEST_RESULTS.md write) completely removed (lines 1214-1285)
- [ ] SessionPath validation added before BugHuntWorkflow.run()
- [ ] Phase comments renumbered correctly (Phase 5 → Phase 4)
- [ ] Error handling preserved around FixCycleWorkflow
- [ ] TEST_RESULTS.md written in JSON format (by BugHuntWorkflow)
- [ ] FixCycleWorkflow can load and parse TEST_RESULTS.md

### Code Quality Validation

- [ ] Follows existing PRP Pipeline patterns and naming conventions
- [ ] No unnecessary changes beyond scope
- [ ] All error messages are descriptive and consistent
- [ ] Logging statements preserved and accurate
- [ ] No hardcoded values that should be dynamic
- [ ] Comments updated to reflect changes

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Phase transitions clearly marked with comments
- [ ] Error messages include context ([PRPPipeline] prefix)
- [ ] No debug logging left in production code
- [ ] All temporary test code removed

---

## Anti-Patterns to Avoid

- ❌ Don't modify FixCycleWorkflow or BugHuntWorkflow implementation
- ❌ Don't change TestResults or Bug data models
- ❌ Don't add new TEST_RESULTS.md writing logic
- ❌ Don't skip sessionPath validation (unsafe)
- ❌ Don't use synchronous file operations (use async)
- ❌ Don't preserve old FixCycleWorkflow constructor signature in tests
- ❌ Don't write Markdown to TEST_RESULTS.md (must be JSON)
- ❌ Don't remove error handling around FixCycleWorkflow
- ❌ Don't change phase numbering beyond what's necessary
- ❌ Don't add unnecessary imports (remove unused ones)
- ❌ Don't hardcode session paths (use SessionManager)
- ❌ Don't suppress TypeScript errors with `@ts-ignore`
- ❌ Don't skip unit test updates
- ❌ Don't modify SessionManager or TaskOrchestrator
- ❌ Don't change TestResultsSchema validation logic

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:
- Comprehensive research documentation provided
- All file locations and line numbers specified
- Complete before/after code examples
- All gotchas and patterns documented
- Test patterns and mock updates specified
- Validation commands are project-specific

**Risk Factors**:
- Test updates may require iteration if mocks are complex
- Integration tests might have hidden dependencies on Phase 4
- Session path availability timing edge cases

**Confidence Boosters**:
- Changes are localized to single method (runQACycle)
- Clear contract definition from prior subtasks
- Extensive test coverage to catch regressions
- Strong type safety with TypeScript

**Validation**: The completed PRP enables an AI agent unfamiliar with the codebase to implement the feature successfully using only the PRP content and codebase access.
