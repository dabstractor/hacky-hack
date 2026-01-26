# Product Requirement Prompt (PRP): Verify TaskOrchestrator SessionManager Usage

## Goal

**Feature Goal**: Verify that TaskOrchestrator correctly uses SessionManager with the proper 3-parameter constructor signature (prdPath, planDir, flushRetries) to prevent parameter misalignment bugs.

**Deliverable**: Verification report confirming TaskOrchestrator's SessionManager instantiation pattern matches the correct 3-parameter signature used in PRP Pipeline, with documented findings and any necessary updates.

**Success Definition**: TaskOrchestrator's SessionManager usage is verified to either: (a) correctly use the 3-parameter signature, or (b) be updated to match the PRP Pipeline pattern, ensuring consistent parameter ordering across the codebase.

## User Persona

**Target User**: Development team maintaining constructor signature consistency across the PRP Pipeline architecture.

**Use Case**: Verify SessionManager instantiation in TaskOrchestrator as part of Phase 1 Milestone 1.2 (SessionManager Constructor Signature Fixes) to prevent parameter misalignment bugs where flushRetries could be incorrectly passed to planDir.

**User Journey**:

1. Review TaskOrchestrator source code for SessionManager instantiation
2. Compare against PRP Pipeline's correct 3-parameter pattern
3. Verify parameter sources and propagation
4. Document findings or update if needed
5. Confirm consistency across codebase

**Pain Points Addressed**:

- **Parameter Misalignment Bug**: Old 2-parameter pattern `new SessionManager(prdPath, flushRetries)` incorrectly passes flushRetries to planDir parameter
- **Inconsistent Instantiation**: Different parts of codebase using different constructor signatures
- **Silent Failures**: Wrong parameter types may not throw immediate errors but cause subtle bugs

## Why

- **Architectural Consistency**: Ensures all SessionManager instantiations use the same 3-parameter signature (prdPath, planDir, flushRetries)
- **Bug Prevention**: Prevents flushRetries (number) from being assigned to planDir (string), which could cause plan directory resolution failures
- **Integration Alignment**: TaskOrchestrator is instantiated by PRPPipeline, so SessionManager usage should align with PRPPipeline's pattern
- **Contract Compliance**: Fulfills Research Objective 1 from architecture/001_codebase_audit.md regarding constructor signature standardization

## What

Verify TaskOrchestrator's SessionManager usage pattern to ensure it uses the correct 3-parameter constructor signature.

### Analysis Scope

1. **Locate SessionManager Instantiation**: Find where TaskOrchestrator creates or receives SessionManager
2. **Verify Parameter Count**: Confirm 3 parameters are passed (prdPath, planDir, flushRetries)
3. **Trace Parameter Sources**: Document where each parameter value originates
4. **Compare with Reference Pattern**: Match against PRPPipeline's correct pattern at src/workflows/prp-pipeline.ts:1768-1772
5. **Document or Update**: Create verification report or update instantiation if needed

### Success Criteria

- [ ] TaskOrchestrator's SessionManager instantiation pattern documented
- [ ] Parameter sources traced and verified
- [ ] Comparison with PRPPipeline pattern completed
- [ ] Consistency confirmed or updates applied
- [ ] Findings documented in work item research/ subdirectory

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to verify this successfully? ✓ YES

- This PRP provides exact file locations with line numbers
- Correct reference pattern from PRPPipeline included
- Constructor signature fully documented with parameter types
- Test patterns provided for validation approach
- Architecture audit context included

### Documentation & References

```yaml
MUST_READ:
  # CRITICAL: TaskOrchestrator does NOT instantiate SessionManager directly
  # It receives SessionManager as a constructor parameter from PRPPipeline
  # This is a VERIFICATION task, not a modification task

  # Source: TaskOrchestrator constructor and SessionManager usage
  - file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
    why: TaskOrchestrator receives SessionManager as constructor parameter, lines 132-183
    pattern: Constructor receives SessionManager instance, does not create it
    critical: 'TaskOrchestrator.sessionManager is assigned from constructor parameter at line 142'
    gotcha: 'TaskOrchestrator NEVER instantiates SessionManager - PRPPipeline does'

  # Source: PRPPipeline SessionManager instantiation (CORRECT PATTERN)
  - file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
    why: Reference implementation showing correct 3-parameter SessionManager instantiation, lines 1768-1772
    pattern: 'new SessionManagerClass(this.#prdPath, this.#planDir, this.#flushRetries)'
    critical: 'This is the correct pattern that all instantiations should follow'
    gotcha: 'SessionManagerClass is dynamically imported, verify the import alias at line 1768'

  # Source: SessionManager constructor signature
  - file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
    why: Complete constructor signature with parameter types and defaults, lines 190-194
    pattern: "constructor(prdPath: string, planDir: string = resolve('plan'), flushRetries: number = 3)"
    critical: 'planDir parameter was added in constructor signature update, tests must pass all 3 params'
    gotcha: "planDir defaults to resolve('plan') but should be explicitly passed for consistency"

  # Source: Architecture audit context
  - file: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/tasks.json
    why: Research Objective 1 context on SessionManager constructor signature requirements
    section: Lines 71-72, 104-105 (TaskOrchestrator verification requirements)
    critical: 'Explains why 3-parameter signature is required and consequences of 2-parameter bug'
    gotcha: 'Old pattern new SessionManager(prdPath, flushRetries) passes flushRetries to planDir!'

  # Source: Test patterns for verification
  - file: /home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts
    why: Unit test patterns showing how TaskOrchestrator is tested with SessionManager
    pattern: Mock SessionManager passed to TaskOrchestrator constructor
    critical: 'Tests verify TaskOrchestrator behavior with mocked SessionManager'
    gotcha: 'Unit tests mock SessionManager, integration tests use real instance'

  # Source: Integration test patterns
  - file: /home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.js
    why: Integration test showing real SessionManager usage with TaskOrchestrator
    pattern: Real SessionManager created with 3-parameter signature, passed to TaskOrchestrator
    critical: 'Integration tests demonstrate correct instantiation pattern'
    gotcha: 'Integration tests use temporary directories with setupTestEnvironment pattern'

  # Source: PRPPipeline parameter propagation
  - file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
    why: Shows how prdPath, planDir, flushRetries flow from CLI to SessionManager
    section: Lines 303-351 (constructor parameter assignment), Lines 1768-1772 (instantiation)
    pattern: 'CLI → PRPPipeline constructor → private fields → SessionManager constructor'
    critical: "planDir comes from CLI --plan-dir option, defaults to undefined which becomes resolve('plan')"
    gotcha: 'Parameter flow: CLI arg → constructor param → private field → SessionManager instantiation'
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── core/
│   ├── task-orchestrator.ts          # RECEIVES SessionManager as constructor parameter
│   ├── session-manager.ts             # Constructor: (prdPath, planDir, flushRetries)
│   └── research-queue.ts              # Also updated to 4-parameter signature
└── workflows/
    └── prp-pipeline.ts                # CREATES SessionManager with 3-parameter signature (line 1768-1772)

tests/
├── unit/
│   └── core/
│       └── task-orchestrator.test.ts  # Unit tests with mocked SessionManager
└── integration/
    └── core/
        └── task-orchestrator.test.js  # Integration tests with real SessionManager
```

### Desired Architecture After Verification

```bash
# No changes needed - TaskOrchestrator correctly receives SessionManager from PRPPipeline
# PRPPipeline already uses correct 3-parameter signature

Parameter Flow:
CLI Args
  ↓
PRPPipeline Constructor (lines 303-351)
  ↓
PRPPipeline Private Fields (#prdPath, #planDir, #flushRetries)
  ↓
SessionManager Instantiation (lines 1768-1772)
  new SessionManagerClass(this.#prdPath, this.#planDir, this.#flushRetries)
  ↓
TaskOrchestrator Constructor (line 132-140)
  receives SessionManager instance as parameter
  ↓
TaskOrchestrator Uses SessionManager (line 142, 162, etc.)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: TaskOrchestrator does NOT instantiate SessionManager
// Gotcha: The work item title says "Verify TaskOrchestrator SessionManager usage"
// Reality: TaskOrchestrator RECEIVES SessionManager as a constructor parameter
// Source: src/core/task-orchestrator.ts:132-183

// WRONG ASSUMPTION: TaskOrchestrator creates SessionManager like this:
// new SessionManager(prdPath, flushRetries)  // OLD 2-PARAM BUG PATTERN

// CORRECT REALITY: PRPPipeline creates SessionManager, TaskOrchestrator receives it:
// In PRPPipeline (src/workflows/prp-pipeline.ts:1768-1772):
this.sessionManager = new SessionManagerClass(
  this.#prdPath, // From CLI --prd argument or PRD.md
  this.#planDir, // From CLI --plan-dir argument or undefined
  this.#flushRetries // From CLI --flush-retries argument or undefined
);

// Then TaskOrchestrator receives the already-instantiated SessionManager:
// In PRPPipeline (src/workflows/prp-pipeline.ts:554-562):
this.taskOrchestrator = new TaskOrchestratorClass(
  this.sessionManager, // Already instantiated with correct 3 params
  this.#scope,
  this.#noCache,
  this.#researchQueueConcurrency,
  this.#cacheTtlMs,
  this.#prpCompression,
  this.#retryConfig
);

// CRITICAL: The bug being fixed is in TEST FILES, not production code
// Tests were using: new SessionManager(prdPath, flushRetries)
// Which passes flushRetries to planDir parameter!
// Correct: new SessionManager(prdPath, resolve('plan'), flushRetries)

// Gotcha: planDir parameter has default value in constructor
// But tests should explicitly pass it for consistency and clarity
// constructor(prdPath: string, planDir: string = resolve('plan'), flushRetries: number = 3)

// Gotcha: SessionManagerClass is dynamically imported in PRPPipeline
// Line 1768: const SessionManagerClass = (await import('./core/session-manager.js')).SessionManager;
// This is for ESM compatibility and conditional loading

// Gotcha: TaskOrchestrator stores SessionManager as readonly property
// Line 76: readonly sessionManager: SessionManager;
// This ensures the instance can't be reassigned after construction

// Gotcha: TaskOrchestrator validates SessionManager.currentSession in constructor
// Lines 149-152: Throws error if no active session exists
// This ensures SessionManager is properly initialized before TaskOrchestrator uses it
```

## Implementation Blueprint

### Data Models and Structure

This is a **verification task**, not a modification task. The data structures are already defined:

```typescript
// SessionManager Constructor (src/core/session-manager.ts:190-194)
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)

// TaskOrchestrator Constructor (src/core/task-orchestrator.ts:132-140)
constructor(
  sessionManager: SessionManager,  // Receives instantiated SessionManager
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard',
  retryConfig?: Partial<TaskRetryConfig>
)
```

### Implementation Tasks (Verification Workflow)

```yaml
Task 1: READ TaskOrchestrator Source Code
  - FILE: src/core/task-orchestrator.ts
  - FOCUS: Lines 132-183 (constructor and SessionManager assignment)
  - VERIFY: How does TaskOrchestrator receive SessionManager?
  - DOCUMENT: Is SessionManager instantiated or passed as parameter?
  - OUTPUT: "TaskOrchestrator receives SessionManager as constructor parameter at line 132"

Task 2: READ PRPPipeline SessionManager Instantiation
  - FILE: src/workflows/prp-pipeline.ts
  - FOCUS: Lines 1768-1772 (SessionManager instantiation)
  - VERIFY: Does PRPPipeline use 3-parameter signature?
  - DOCUMENT: Exact instantiation code with all 3 parameters
  - OUTPUT: "PRPPipeline uses: new SessionManagerClass(this.#prdPath, this.#planDir, this.#flushRetries)"

Task 3: TRACE Parameter Sources in PRPPipeline
  - FILE: src/workflows/prp-pipeline.ts
  - FOCUS: Lines 303-351 (constructor parameter assignment)
  - VERIFY: Where do #prdPath, #planDir, #flushRetries come from?
  - DOCUMENT: CLI argument → constructor param → private field → SessionManager
  - OUTPUT: Parameter flow diagram showing propagation from CLI to SessionManager

Task 4: VERIFY SessionManager Constructor Signature
  - FILE: src/core/session-manager.ts
  - FOCUS: Lines 190-194 (constructor signature)
  - VERIFY: Parameter order is (prdPath, planDir, flushRetries)
  - DOCUMENT: Parameter types, defaults, and what each controls
  - OUTPUT: Constructor signature documentation

Task 5: CHECK Test Files for TaskOrchestrator
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - FOCUS: How is SessionManager mocked/pass to TaskOrchestrator?
  - VERIFY: Do tests use correct pattern?
  - DOCUMENT: Test patterns for TaskOrchestrator + SessionManager
  - OUTPUT: Test pattern analysis

Task 6: COMPARE With Reference Pattern
  - REFERENCE: PRPPipeline instantiation at lines 1768-1772
  - VERIFY: Does TaskOrchestrator's usage match?
  - DOCUMENT: Any discrepancies or alignment
  - OUTPUT: Comparison report

Task 7: CREATE Verification Report
  - FILE: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S4/research/verification-report.md
  - CONTENT:
    * TaskOrchestrator SessionManager usage pattern
    * PRPPipeline reference pattern
    * Parameter flow diagram
    * Comparison findings
    * Conclusion: Verified or Updates Needed
  - OUTPUT: Complete verification documentation

Task 8: VALIDATE No Production Code Changes Needed
  - VERIFY: TaskOrchestrator already receives SessionManager correctly
  - CONFIRM: PRPPipeline already uses 3-parameter signature
  - DOCUMENT: This is a verification-only task
  - OUTPUT: "No changes needed - TaskOrchestrator pattern is correct"
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: TaskOrchestrator Receives SessionManager (DOES NOT CREATE)
// Source: src/core/task-orchestrator.ts:132-183

// Step 1: TaskOrchestrator constructor receives SessionManager as parameter
constructor(
  sessionManager: SessionManager,  // Line 133 - RECEIVED, not created
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard',
  retryConfig?: Partial<TaskRetryConfig>
) {
  // Step 2: Store received SessionManager as readonly property
  this.sessionManager = sessionManager;  // Line 142 - Assignment only

  // Step 3: Validate SessionManager has active session
  const currentSession = sessionManager.currentSession;  // Line 149
  if (!currentSession) {
    throw new Error('Cannot create TaskOrchestrator: no active session');  // Line 151
  }

  // Step 4: Use SessionManager throughout TaskOrchestrator
  this.researchQueue = new ResearchQueue(  // Line 161-166
    this.sessionManager,
    this.#researchQueueConcurrency,
    this.#noCache,
    this.#cacheTtlMs
  );
  // ... more usage of sessionManager throughout the class
}

// PATTERN: PRPPipeline Creates SessionManager With 3 Parameters
// Source: src/workflows/prp-pipeline.ts:1768-1772

// Step 1: PRPPipeline constructor receives parameters (lines 303-351)
constructor(
  prdPath: string,              // Line 303 - Required
  planDir?: string,             // Line 313 - Optional, defaults to undefined
  flushRetries?: number,        // Line 320 - Optional, defaults to undefined
  // ... other parameters
) {
  // Step 2: Store parameters as private fields
  this.#prdPath = prdPath;      // Line 334
  this.#planDir = planDir;      // Line 344
  this.#flushRetries = flushRetries;  // Line 351
}

// Step 3: In run() method, create SessionManager with all 3 parameters
const SessionManagerClass = (await import('./core/session-manager.js')).SessionManager;
this.sessionManager = new SessionManagerClass(  // Lines 1768-1772
  this.#prdPath,      // Parameter 1: string (required)
  this.#planDir,      // Parameter 2: string | undefined (optional, defaults to resolve('plan'))
  this.#flushRetries  // Parameter 3: number | undefined (optional, defaults to 3)
);

// Step 4: Pass SessionManager to TaskOrchestrator
this.taskOrchestrator = new TaskOrchestratorClass(  // Lines 554-562
  this.sessionManager,  // Already instantiated with correct 3 parameters
  this.#scope,
  this.#noCache,
  this.#researchQueueConcurrency,
  this.#cacheTtlMs,
  this.#prpCompression,
  this.#retryConfig
);

// GOTCHA: The Bug Is In Test Files, Not Production Code
// WRONG (old test pattern):
const sessionManager = new SessionManager(prdPath, flushRetries);
// Bug: flushRetries (number) is passed to planDir (string) parameter!

// CORRECT (new test pattern):
const sessionManager = new SessionManager(prdPath, resolve('plan'), flushRetries);
// Fix: Explicitly pass planDir so flushRetries goes to correct parameter

// PATTERN: Test Files Use Real SessionManager In Integration Tests
// Source: tests/integration/core/task-orchestrator.test.js

// Setup function creates real SessionManager with temporary directories
function setupTestEnvironment() {
  const tempDir = mkdtempSync(TEMP_DIR_TEMPLATE);
  const planDir = join(tempDir, 'plan');
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, mockSimplePRD);

  // Create SessionManager with 3-parameter signature
  const sessionManager = new SessionManager(prdPath, planDir);

  return { tempDir, prdPath, sessionManager };
}

// Test uses SessionManager to create TaskOrchestrator
beforeEach(() => {
  const env = setupTestEnvironment();
  sessionManager = env.sessionManager;
});

it('should process tasks', async () => {
  await sessionManager.loadSession(sessionDir);
  const orchestrator = new TaskOrchestrator(sessionManager);  // Receives SessionManager
  // ... test implementation
});
```

### Integration Points

```yaml
TASK_ORCHESTRATOR:
  - location: 'src/core/task-orchestrator.ts:132-183'
  - pattern: 'Receives SessionManager as constructor parameter'
  - usage: 'Stores as readonly property, validates currentSession, uses throughout class'
  - integration: 'Created and injected by PRPPipeline'

PRP_PIPELINE:
  - location: 'src/workflows/prp-pipeline.ts:1768-1772'
  - pattern: 'Instantiates SessionManager with 3 parameters'
  - instantiation: 'new SessionManagerClass(this.#prdPath, this.#planDir, this.#flushRetries)'
  - injection: 'Passes SessionManager to TaskOrchestrator at lines 554-562'

SESSION_MANAGER:
  - location: 'src/core/session-manager.ts:190-194'
  - signature: "constructor(prdPath: string, planDir: string = resolve('plan'), flushRetries: number = 3)"
  - validation: "Throws SessionFileError if PRD file doesn't exist"
  - initialization: 'Synchronous validation, async session loading'

TEST_FILES:
  - unit: 'tests/unit/core/task-orchestrator.test.ts'
  - integration: 'tests/integration/core/task-orchestrator.test.js'
  - pattern: 'Integration tests use real SessionManager, unit tests mock it'
  - verification: 'This task should verify test patterns use correct instantiation'
```

## Validation Loop

### Level 1: Source Code Verification (Immediate Feedback)

```bash
# Verify TaskOrchestrator receives SessionManager as parameter
grep -n "constructor(" src/core/task-orchestrator.ts | head -1
# Expected: Line 132 shows constructor(sessionManager: SessionManager, ...)

# Verify TaskOrchestrator stores SessionManager
grep -n "this.sessionManager = sessionManager" src/core/task-orchestrator.ts
# Expected: Line 142

# Verify PRPPipeline creates SessionManager with 3 parameters
sed -n '1768,1772p' src/workflows/prp-pipeline.ts
# Expected:
# this.sessionManager = new SessionManagerClass(
#   this.#prdPath,
#   this.#planDir,
#   this.#flushRetries
# );

# Verify SessionManager constructor signature
sed -n '190,194p' src/core/session-manager.ts
# Expected: constructor(prdPath: string, planDir: string = resolve('plan'), flushRetries: number = 3)

# Verify PRPPipeline passes SessionManager to TaskOrchestrator
sed -n '554,562p' src/workflows/prp-pipeline.ts
# Expected: this.taskOrchestrator = new TaskOrchestratorClass(this.sessionManager, ...)

# Expected: All verifications pass, showing correct 3-parameter pattern
```

### Level 2: Test Pattern Verification (Component Validation)

```bash
# Run TaskOrchestrator unit tests
npm test -- tests/unit/core/task-orchestrator.test.ts

# Run TaskOrchestrator integration tests
npm test -- tests/integration/core/task-orchestrator.test.js

# Run all TaskOrchestrator-related tests
npm test -- --testNamePattern="TaskOrchestrator"

# Check test coverage for TaskOrchestrator
npm test -- --coverage --tests/integration/core/task-orchestrator.test.js

# Expected: All tests pass, demonstrating correct SessionManager usage pattern
# Expected: Integration tests show real SessionManager instantiation with 3 parameters
```

### Level 3: End-to-End Integration Validation (System Validation)

```bash
# Build the project
npm run build

# Run full test suite
npm test

# Run integration tests for core components
npm test -- tests/integration/core/

# Verify PRPPipeline can create SessionManager and TaskOrchestrator
node -e "
import('./dist/workflows/prp-pipeline.js').then(({ PRPPipeline }) => {
  console.log('PRPPipeline imported successfully');
  console.log('SessionManager and TaskOrchestrator integration verified');
});
"

# Expected: Build succeeds, all tests pass, integration verified
# Expected: No errors related to SessionManager constructor signature
```

### Level 4: Verification Report Validation (Documentation)

```bash
# Verify the verification report was created
test -f plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S4/research/verification-report.md
# Expected: File exists

# Check report contains required sections
grep -q "TaskOrchestrator SessionManager Usage" plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S4/research/verification-report.md
grep -q "PRPPipeline Reference Pattern" plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S4/research/verification-report.md
grep -q "Parameter Flow" plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S4/research/verification-report.md
grep -q "Conclusion" plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S4/research/verification-report.md
# Expected: All sections present

# Display verification report
cat plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M1T2S4/research/verification-report.md

# Expected: Comprehensive verification report documenting:
# 1. TaskOrchestrator receives SessionManager as parameter (does not create)
# 2. PRPPipeline creates SessionManager with correct 3-parameter signature
# 3. Parameter flow from CLI → PRPPipeline → SessionManager → TaskOrchestrator
# 4. Comparison showing alignment with reference pattern
# 5. Conclusion: TaskOrchestrator usage is correct, no changes needed
```

## Final Validation Checklist

### Technical Validation

- [ ] TaskOrchestrator source code reviewed (lines 132-183)
- [ ] PRPPipeline SessionManager instantiation verified (lines 1768-1772)
- [ ] SessionManager constructor signature confirmed (lines 190-194)
- [ ] Parameter flow traced from CLI to SessionManager
- [ ] Test patterns reviewed for consistency
- [ ] Verification report created with all required sections

### Feature Validation

- [ ] TaskOrchestrator's SessionManager usage pattern documented
- [ ] PRPPipeline reference pattern documented
- [ ] Parameter sources traced and verified
- [ ] Comparison with reference pattern completed
- [ ] Conclusion documented (Verified or Updates Needed)
- [ ] No production code changes confirmed (this is verification-only)

### Code Quality Validation

- [ ] Verification follows existing documentation patterns
- [ ] Research findings stored in work item's research/ subdirectory
- [ ] Line numbers and file paths are specific and accurate
- [ ] Code snippets are exact and copy-paste accurate
- [ ] Diagrams and flow charts clearly show parameter propagation

### Documentation & Deployment

- [ ] Verification report is comprehensive and self-documenting
- [ ] Report explains why TaskOrchestrator doesn't instantiate SessionManager
- [ ] Report clarifies this is a verification task, not a modification task
- [ ] Report provides clear conclusion and next steps (if any)
- [ ] All references include specific file paths and line numbers

---

## Anti-Patterns to Avoid

- ❌ **Don't modify TaskOrchestrator**: It correctly receives SessionManager from PRPPipeline
- ❌ **Don't modify PRPPipeline**: It already uses the correct 3-parameter signature
- ❌ **Don't confuse test fixes with production fixes**: The bug is in test files, not production code
- ❌ **Don't assume TaskOrchestrator creates SessionManager**: It receives it as a parameter
- ❌ **Don't skip verification**: Even though production code is correct, verification is required
- ❌ **Don't create incomplete reports**: Documentation must be comprehensive with specific line numbers
- ❌ **Don't ignore parameter flow**: Document how parameters propagate from CLI to SessionManager
- ❌ **Don't forget test patterns**: Verify test files also use correct instantiation pattern
