# PRPRuntime Execution Research

## Overview

PRPRuntime is the core orchestration class that executes subtasks through the complete inner loop workflow: **Research → Implementation → Validation**. This document details how PRPRuntime executes subtasks and how it could be used for executing fix tasks.

**File**: `/home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts`

---

## 1. Constructor Requirements

### Signature

```typescript
constructor(orchestrator: TaskOrchestrator)
```

### Dependencies

PRPRuntime **requires** a `TaskOrchestrator` instance for:

- **Status management**: Calling `orchestrator.setStatus()` to update subtask status
- **Session access**: Extracting session path via `orchestrator.sessionManager.currentSession`

### Internal Initialization

The constructor initializes three critical components:

```typescript
// 1. Task Orchestrator reference
readonly #orchestrator: TaskOrchestrator;

// 2. Session path extraction
readonly #sessionPath: string;  // From orchestrator.sessionManager.currentSession.metadata.path

// 3. PRP Generator (for research phase)
readonly #generator: PRPGenerator;  // new PRPGenerator(sessionManager)

// 4. PRP Executor (for implementation phase)
readonly #executor: PRPExecutor;  // new PRPExecutor(sessionPath)
```

### Constraints & Gotchas

⚠️ **Critical**: PRPRuntime **CANNOT be instantiated without**:

1. An active session (throws: `Cannot create PRPRuntime: no active session`)
2. A TaskOrchestrator instance

The TaskOrchestrator is responsible for creating PRPRuntime:

```typescript
// In TaskOrchestrator constructor (line 116)
this.#prpRuntime = new PRPRuntime(this);
```

---

## 2. executeSubtask() Method

### Signature

```typescript
async executeSubtask(
  subtask: Subtask,
  backlog: Backlog
): Promise<ExecutionResult>
```

### Parameters

#### `subtask: Subtask`

A valid Subtask object with the following structure:

```typescript
interface Subtask {
  readonly id: string; // Format: P{N}.M{N}.T{N}.S{N} (e.g., "P1.M2.T2.S2")
  readonly type: 'Subtask'; // Type discriminator
  readonly title: string; // Human-readable title
  readonly status: Status; // Planned | Researching | Implementing | Complete | Failed | Obsolete
  readonly story_points: number; // Fibonacci: 1, 2, 3, 5, 8, 13, 21
  readonly dependencies: string[]; // IDs of prerequisite subtasks
  readonly context_scope: string; // INPUT/OUTPUT/MOCKING instructions
}
```

#### `backlog: Backlog`

The full task hierarchy for context:

```typescript
interface Backlog {
  readonly backlog: Phase[]; // Array of phases containing complete hierarchy
}
```

The backlog provides the **PRPGenerator** with context about related tasks, dependencies, and overall project structure.

### Return Type: `ExecutionResult`

```typescript
interface ExecutionResult {
  readonly success: boolean; // true if all validation gates passed
  readonly validationResults: ValidationGateResult[]; // Results from each validation level
  readonly artifacts: string[]; // File paths created/modified
  readonly error?: string; // Error message if failed
  readonly fixAttempts: number; // Number of fix attempts made (0-2)
}
```

---

## 3. Execution Flow

### Phase 1: Research (PRP Generation)

```typescript
// Status: Planned → Researching
await this.#orchestrator.setStatus(
  subtask.id,
  'Researching',
  'Starting PRP generation'
);

// Generate PRP using PRPGenerator
const prp = await this.#generator.generate(subtask, backlog);
```

**What happens:**

- PRPGenerator uses the Researcher Agent to create a comprehensive PRP document
- PRP is written to disk: `{sessionPath}/prps/{sanitizedId}.md`
- Sanitization: dots in subtask ID replaced with underscores (e.g., `P1.M2.T2.S2` → `P1_M2_T2_S2.md`)

### Phase 2: Implementation (PRP Execution)

```typescript
// Status: Researching → Implementing
await this.#orchestrator.setStatus(
  subtask.id,
  'Implementing',
  'Starting PRP execution'
);

// Create artifacts directory
const artifactsDir = join(this.#sessionPath, 'artifacts', subtask.id);
await mkdir(artifactsDir, { recursive: true });

// Execute PRP using PRPExecutor
const result = await this.#executor.execute(prp, prpPath);
```

**What happens:**

- PRPExecutor uses the Coder Agent to implement the PRP
- Validation gates run sequentially (Level 1 → 2 → 3 → 4)
- Fix-and-retry logic triggers on validation failures (up to 2 attempts)
- Returns ExecutionResult with validation results and artifacts

### Phase 3: Artifact Collection

```typescript
await this.#writeArtifacts(artifactsDir, result);
```

**Three artifacts are written:**

1. `validation-results.json` - Full validation gate results
2. `execution-summary.md` - Human-readable summary
3. `artifacts-list.json` - List of created/modified files

### Phase 4: Status Update

```typescript
if (result.success) {
  await this.#orchestrator.setStatus(
    subtask.id,
    'Complete',
    'Implementation completed successfully'
  );
} else {
  await this.#orchestrator.setStatus(
    subtask.id,
    'Failed',
    result.error ?? 'Execution failed'
  );
}
```

---

## 4. Status Progression

PRPRuntime orchestrates the following status transitions:

```
Planned
  ↓ (setStatus: 'Researching')
Researching
  ↓ (setStatus: 'Implementing')
Implementing
  ↓
  ├─→ Complete (if result.success === true)
  └─→ Failed (if result.success === false OR exception thrown)
```

**Error Handling**: Any exception during execution sets status to `Failed` with error message and returns a failed ExecutionResult.

---

## 5. Creating Valid Subtasks

### Minimal Example

```typescript
const subtask: Subtask = {
  id: 'P1.M2.T2.S2',
  type: 'Subtask',
  title: 'Add PRP document interfaces to models.ts',
  status: 'Planned',
  story_points: 2,
  dependencies: [], // No dependencies for this example
  context_scope:
    'INPUT: TaskRegistry from dependency P1.M2.T1.S1\nOUTPUT: PRPDocument interface\nMOCKING: None',
};
```

### Subtask with Dependencies

```typescript
const subtaskWithDeps: Subtask = {
  id: 'P1.M2.T2.S2',
  type: 'Subtask',
  title: 'Implement PRP validation logic',
  status: 'Planned',
  story_points: 3,
  dependencies: ['P1.M2.T2.S1', 'P1.M2.T1.S3'], // Must complete first
  context_scope:
    'INPUT: ValidationGate interface from P1.M2.T1.S3\nOUTPUT: validatePRP() function\nMOCKING: File system operations',
};
```

### Validation Constraints

Subtasks must pass `SubtaskSchema` validation:

- **ID format**: Must match `/^P\d+\.M\d+\.T\d+\.S\d+$/` (e.g., `P1.M2.T2.S2`)
- **Story points**: Integer between 1-21 (Fibonacci sequence)
- **Title**: 1-200 characters
- **Dependencies**: Array of valid subtask IDs
- **Context scope**: Non-empty string

---

## 6. Execution Result Handling

### Success Scenario

```typescript
const result = await runtime.executeSubtask(subtask, backlog);

if (result.success) {
  console.log('All validation gates passed!');
  console.log(`Fix attempts: ${result.fixAttempts}`);

  // Check individual validation results
  for (const vr of result.validationResults) {
    console.log(`Level ${vr.level}: ${vr.success ? 'PASS' : 'FAIL'}`);
    if (!vr.success) {
      console.log(`  Command: ${vr.command}`);
      console.log(`  Error: ${vr.stderr}`);
    }
  }

  // List artifacts
  console.log('Artifacts:', result.artifacts);
}
```

### Failure Scenario

```typescript
const result = await runtime.executeSubtask(subtask, backlog);

if (!result.success) {
  console.error('Execution failed:', result.error);

  // Examine validation failures
  for (const vr of result.validationResults) {
    if (!vr.success && !vr.skipped) {
      console.error(`Level ${vr.level} failed:`);
      console.error(`  Command: ${vr.command}`);
      console.error(`  Exit Code: ${vr.exitCode}`);
      console.error(`  Stderr: ${vr.stderr}`);
    }
  }

  // Note: Status already set to 'Failed' by PRPRuntime
  // No manual status update needed
}
```

### Validation Gate Results

```typescript
interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4; // Validation level
  readonly description: string; // What this level validates
  readonly success: boolean; // Whether validation passed
  readonly command: string | null; // Command executed (null if manual)
  readonly stdout: string; // Standard output
  readonly stderr: string; // Standard error
  readonly exitCode: number | null; // Exit code (null if skipped)
  readonly skipped: boolean; // True if gate was skipped
}
```

---

## 7. Using PRPRuntime for Fix Tasks

### Conceptual Approach

Fix tasks can be executed using PRPRuntime by creating **synthetic subtasks** that represent the fix work. This leverages the existing orchestration infrastructure without needing a separate fix execution system.

### Creating Fix Subtasks

```typescript
function createFixSubtask(
  bugId: string,
  originalSubtaskId: string,
  bugDescription: string
): Subtask {
  // Generate new subtask ID for fix
  const fixId = `${originalSubtaskId}-FIX-${bugId}`;

  return {
    id: fixId,
    type: 'Subtask',
    title: `Fix bug ${bugId}: ${bugDescription}`,
    status: 'Planned',
    story_points: 2, // Estimate based on bug severity
    dependencies: [originalSubtaskId], // Depends on original subtask
    context_scope: `
INPUT: Original implementation from ${originalSubtaskId}
OUTPUT: Fixed implementation addressing bug ${bugId}
MOCKING: None (real execution context)

Bug Details:
${bugDescription}

Fix Strategy:
1. Locate bug in implementation
2. Apply minimal fix
3. Run validation gates to verify fix
    `.trim(),
  };
}
```

### Executing Fix Tasks

```typescript
// Given a bug report
const bug: Bug = {
  id: 'BUG-001',
  severity: 'critical',
  title: 'Login fails with empty password',
  description: 'Unhandled exception when password field is empty',
  reproduction:
    '1. Navigate to /login\n2. Leave password empty\n3. Click Submit',
  location: 'src/services/auth.ts:45',
};

// Create fix subtask
const fixSubtask = createFixSubtask(
  bug.id,
  'P1.M2.T2.S2', // Original subtask that introduced the bug
  bug.description
);

// Execute fix using PRPRuntime
const result = await runtime.executeSubtask(fixSubtask, backlog);

// Handle result
if (result.success) {
  console.log(`Bug ${bug.id} fixed successfully!`);
  // Update bug status
} else {
  console.error(`Failed to fix bug ${bug.id}:`, result.error);
}
```

### Gotchas for Fix Tasks

1. **ID Format**: Fix subtask IDs must follow the format constraint. Using suffix like `-FIX-BUG001` may not validate. Consider:

   ```typescript
   // Option 1: Use phase-like format
   id: `P1.M2.T2.S2.FIX${bugId.replace('-', '')}`;

   // Option 2: Create fix subtasks under a dedicated phase
   id: `PF.M1.T1.S${fixNumber}`;
   ```

2. **Dependency Management**: Fix subtasks should depend on the original subtask to ensure it has been executed.

3. **Context Scope**: The `context_scope` should include:
   - Reference to original subtask
   - Bug description and reproduction steps
   - File/line location if available
   - Fix strategy

4. **Validation Gates**: Fix subtasks should have validation gates that specifically test the bug fix:

   ```typescript
   const fixSubtask = {
     // ...
     context_scope: '...',
     // In generated PRP, validation gates would include:
     // - Level 1: Syntax checks
     // - Level 2: Unit tests for the fix
     // - Level 3: Integration test covering bug scenario
     // - Level 4: Manual verification of bug fix
   };
   ```

5. **Status Tracking**: Fix subtask status should be tracked separately from original subtask:
   ```typescript
   // Original subtask: Complete (or Failed if bug found during execution)
   // Fix subtask: Planned → Researching → Implementing → Complete/Failed
   ```

---

## 8. Existing Usage Patterns

### In TaskOrchestrator (src/core/task-orchestrator.ts)

```typescript
// Line 116: PRPRuntime initialization
this.#prpRuntime = new PRPRuntime(this);

// Line 638-641: Subtask execution
const result = await this.#prpRuntime.executeSubtask(subtask, this.#backlog);

// Line 667-679: Status handling based on result
if (result.success) {
  await this.setStatus(
    subtask.id,
    'Complete',
    'Implementation completed successfully'
  );
} else {
  await this.setStatus(
    subtask.id,
    'Failed',
    result.error ?? 'Execution failed'
  );
}
```

### Key Integration Points

1. **Cache Integration**: TaskOrchestrator checks ResearchQueue cache before calling PRPRuntime:

   ```typescript
   const cachedPRP = this.researchQueue.getPRP(subtask.id);
   // Cache hit = PRP already generated
   // Cache miss = PRPRuntime will generate PRP
   ```

2. **Smart Commit**: After successful execution, TaskOrchestrator creates a git commit:

   ```typescript
   const commitHash = await smartCommit(
     sessionPath,
     `${subtask.id}: ${subtask.title}`
   );
   ```

3. **Background Research**: After starting execution, triggers parallel PRP generation for next tasks:
   ```typescript
   this.researchQueue.processNext(this.#backlog).catch(error => {
     console.error('Background research error:', error);
   });
   ```

---

## 9. Constraints and Limitations

### Must Have

- ✅ Active session (sessionManager.currentSession must exist)
- ✅ TaskOrchestrator instance (for status management)
- ✅ Valid Subtask object (passes SubtaskSchema validation)
- ✅ Backlog with full context

### Must NOT

- ❌ Instantiate PRPRuntime without TaskOrchestrator
- ❌ Call executeSubtask() with invalid Subtask ID format
- ❌ Call executeSubtask() with Subtask that has unmet dependencies (handled by TaskOrchestrator)
- ❌ Modify Subtask object during execution (immutable)

### Filesystem Requirements

- PRP directory: `{sessionPath}/prps/` (auto-created by PRPGenerator)
- Artifacts directory: `{sessionPath}/artifacts/{subtaskId}/` (auto-created by PRPRuntime)

### Error Handling

- **PRPGenerationError**: Thrown when Researcher Agent fails to generate PRP
- **PRPExecutionError**: Thrown when Coder Agent fails to execute PRP
- **ValidationError**: Thrown when validation gates fail after all fix attempts
- **PRPRuntimeError**: Wrapper for runtime orchestration failures

All errors are caught and converted to failed ExecutionResult with status set to `Failed`.

---

## 10. Summary: Using PRPRuntime for Fix Execution

### Recommended Approach

1. **Create Fix Subtasks** with proper ID format and dependencies
2. **Generate Fix PRPs** using PRPGenerator (or manual PRP creation for bug-specific context)
3. **Execute via PRPRuntime** using the same flow as regular subtasks
4. **Track Fix Status** separately in bug tracking system
5. **Validate Fixes** with bug-specific validation gates

### Example Workflow

```typescript
// 1. QA Agent discovers bug
const bug: Bug = {
  /* ... */
};

// 2. Create fix subtask
const fixSubtask = createFixSubtask(bug, originalSubtaskId);

// 3. Add fix subtask to backlog (temporary or permanent)
backlog.backlog[0].milestones[0].tasks[0].subtasks.push(fixSubtask);

// 4. Execute fix via PRPRuntime (through TaskOrchestrator)
const result = await orchestrator.executeSubtask(fixSubtask);

// 5. Update bug status based on result
if (result.success) {
  bug.status = 'Fixed';
  bug.fixedBy = fixSubtask.id;
} else {
  bug.status = 'Fix Failed';
  bug.fixError = result.error;
}
```

### Advantages

- ✅ Reuses existing orchestration infrastructure
- ✅ Automatic status management and artifact collection
- ✅ Validation gates ensure fix quality
- ✅ Fix-and-retry logic for complex bugs
- ✅ Full audit trail in artifacts directory

### Disadvantages

- ⚠️ Requires ID format compliance (may need workaround for fix IDs)
- ⚠️ Fix subtasks clutter main backlog (consider separate "Fix Phase")
- ⚠️ PRP generation may be overkill for simple fixes (consider direct PRP creation)

---

## Appendix: Type Definitions

### Subtask Interface (from src/core/models.ts)

```typescript
interface Subtask {
  readonly id: string; // Format: P{N}.M{N}.T{N}.S{N}
  readonly type: 'Subtask';
  readonly title: string;
  readonly status: Status;
  readonly story_points: number;
  readonly dependencies: string[];
  readonly context_scope: string;
}
```

### Backlog Interface (from src/core/models.ts)

```typescript
interface Backlog {
  readonly backlog: Phase[];
}
```

### ExecutionResult Interface (from src/agents/prp-executor.ts)

```typescript
interface ExecutionResult {
  readonly success: boolean;
  readonly validationResults: ValidationGateResult[];
  readonly artifacts: string[];
  readonly error?: string;
  readonly fixAttempts: number;
}
```

### Bug Interface (from src/core/models.ts)

```typescript
interface Bug {
  readonly id: string;
  readonly severity: BugSeverity;
  readonly title: string;
  readonly description: string;
  readonly reproduction: string;
  readonly location?: string;
}
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Source Files**:

- `/home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts`
- `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts`
- `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- `/home/dustin/projects/hacky-hack/src/core/models.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/agents/prp-runtime.test.ts`
- `/home/dustin/projects/hacky-hack/tests/integration/prp-runtime-integration.test.ts`
