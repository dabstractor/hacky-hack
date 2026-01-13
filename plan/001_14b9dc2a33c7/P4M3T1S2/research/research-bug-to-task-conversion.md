# Research: Converting Bug Objects to Subtask-like Fix Tasks

**Date:** 2026-01-13
**Task:** P4.M3.T1.S2 - Research Bug to Task Conversion
**Status:** Complete

---

## Executive Summary

This research document outlines how to convert `Bug` objects from `TestResults` into `Subtask`-like fix tasks for the bug fix sub-pipeline. The conversion requires mapping Bug fields to Subtask fields, generating unique IDs, and constructing appropriate `context_scope` for the Coder Agent.

---

## 1. Bug Structure (Source)

**Location:** `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 1588-1649)

```typescript
export interface Bug {
  readonly id: string; // Unique identifier (e.g., 'BUG-001', 'bug-1705123456')
  readonly severity: BugSeverity; // 'critical' | 'major' | 'minor' | 'cosmetic'
  readonly title: string; // Brief, searchable title (max 200 chars)
  readonly description: string; // Detailed explanation of the bug
  readonly reproduction: string; // Step-by-step reproduction instructions
  readonly location?: string; // Optional file/function location (e.g., 'src/services/auth.ts:45')
}

export type BugSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';
```

**Key Characteristics:**

- `id`: Format like `BUG-001` or timestamp-based `bug-1705123456`
- `severity`: Drives priority and execution order
- `title`: Must be 1-200 characters, searchable
- `description`: Explains expected vs actual behavior
- `reproduction`: Detailed steps for another developer to reproduce
- `location`: Optional code location for targeted fixes

---

## 2. Subtask Structure (Target)

**Location:** `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 149-211)

```typescript
export interface Subtask {
  readonly id: string; // Format: P{N}.M{N}.T{N}.S{N} (e.g., 'P1.M1.T1.S1')
  readonly type: 'Subtask'; // Type discriminator
  readonly title: string; // Human-readable title (max 200 chars)
  readonly status: Status; // 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
  readonly story_points: number; // Fibonacci: 1, 2, 3, 5, 8, 13, 21 (min 1, max 21)
  readonly dependencies: string[]; // IDs of subtasks that must complete first
  readonly context_scope: string; // Strict instructions for isolated development (INPUT/OUTPUT/MOCKING)
}

export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

**Validation Schema** (lines 236-253):

```typescript
export const SubtaskSchema: z.ZodType<Subtask> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/, 'Invalid subtask ID format'),
  type: z.literal('Subtask'),
  title: z.string().min(1).max(200),
  status: StatusEnum,
  story_points: z.number().int().min(1).max(21),
  dependencies: z.array(z.string()).min(0),
  context_scope: z.string().min(1),
});
```

---

## 3. Field Mapping: Bug → Subtask

| Bug Field  | Subtask Field   | Mapping Strategy                                                 |
| ---------- | --------------- | ---------------------------------------------------------------- |
| `id`       | `id`            | **Generate new ID** with special fix task format (see section 4) |
| `title`    | `title`         | **Direct mapping** - Bug title is already validated to 200 chars |
| N/A        | `type`          | **Hardcode** to `'Subtask'`                                      |
| N/A        | `status`        | **Hardcode** to `'Planned'` (initial state for fix tasks)        |
| `severity` | `story_points`  | **Map severity to points** (see section 5)                       |
| N/A        | `dependencies`  | **Empty array** `[]` (fix tasks are independent)                 |
| All fields | `context_scope` | **Construct from bug details** (see section 6)                   |

---

## 4. Generating Unique IDs for Fix Tasks

### Current ID Format for Subtasks

Standard subtasks use hierarchical notation: `P{phase}.M{milestone}.T{task}.S{subtask}`

**Example:** `P1.M2.T3.S4`

### Proposed ID Formats for Fix Tasks

#### Option A: Timestamp-Based (Recommended)

```typescript
// Format: FIX-{timestamp}-{index}
// Example: FIX-1705123456-001, FIX-1705123456-002

function generateFixTaskId(bug: Bug, index: number): string {
  const timestamp = Date.now();
  const paddedIndex = String(index + 1).padStart(3, '0');
  return `FIX-${timestamp}-${paddedIndex}`;
}
```

**Pros:**

- Globally unique across sessions
- Temporal ordering
- Easy to generate
- No collision with existing subtasks

**Cons:**

- Not hierarchical (doesn't fit P.M.T.S pattern)

#### Option B: Hierarchical with "Fix" Phase

```typescript
// Format: PFIX.M1.T{bug-index}.S1
// Example: PFIX.M1.T001.S1, PFIX.M1.T002.S1

function generateFixTaskId(bug: Bug, index: number): string {
  const paddedIndex = String(index + 1).padStart(3, '0');
  return `PFIX.M1.T${paddedIndex}.S1`;
}
```

**Pros:**

- Fits existing hierarchy pattern
- Validates against SubtaskSchema regex
- Clear semantic meaning

**Cons:**

- Requires defining "Fix Phase" in backlog
- Potential ID conflicts if bugs are re-processed

#### Option C: Bug-Based Preservation

```typescript
// Preserve original Bug ID with prefix
// Example: FIX-BUG-001, FIX-BUG-002

function generateFixTaskId(bug: Bug): string {
  return `FIX-${bug.id}`;
}
```

**Pros:**

- Maintains traceability to original bug report
- Simple mapping

**Cons:**

- Doesn't validate against SubtaskSchema (requires regex update)
- May not be globally unique if bug IDs are session-specific

### Recommendation: Use Option B (Hierarchical)

This option integrates seamlessly with the existing PRP Pipeline infrastructure and validates correctly against `SubtaskSchema`.

**Implementation:**

```typescript
// In bug-fix-sub-pipeline.ts
function createFixSubtasks(testResults: TestResults): Subtask[] {
  return testResults.bugs.map((bug, index) => {
    const paddedIndex = String(index + 1).padStart(3, '0');
    const fixTaskId = `PFIX.M1.T${paddedIndex}.S1`;

    return {
      id: fixTaskId,
      type: 'Subtask',
      title: `[BUG FIX] ${bug.title}`,
      status: 'Planned',
      story_points: mapSeverityToStoryPoints(bug.severity),
      dependencies: [],
      context_scope: constructFixContextScope(bug),
    };
  });
}
```

---

## 5. Mapping Severity to Story Points

**Story Point System:** Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21 (min 1, max 21)

### Proposed Severity → Story Points Mapping

| Severity   | Story Points | Rationale                                                     |
| ---------- | ------------ | ------------------------------------------------------------- |
| `critical` | 13           | High urgency, complex fix, likely requires deep investigation |
| `major`    | 8            | Significant impact, moderate complexity                       |
| `minor`    | 3            | Low impact, straightforward fix                               |
| `cosmetic` | 1            | Trivial fix, no functional impact                             |

**Alternative: Time-Based Estimation**

```typescript
// More sophisticated: estimate based on bug description length and location
function estimateStoryPoints(bug: Bug): number {
  const basePoints = {
    critical: 13,
    major: 8,
    minor: 3,
    cosmetic: 1,
  };

  // Adjust if location is specified (easier to fix)
  if (bug.location) {
    return Math.max(1, basePoints[bug.severity] - 1);
  }

  return basePoints[bug.severity];
}
```

### Recommendation: Use Base Mapping

Start with simple severity-based mapping, adjust based on empirical data.

```typescript
function mapSeverityToStoryPoints(severity: BugSeverity): number {
  const mapping = {
    critical: 13,
    major: 8,
    minor: 3,
    cosmetic: 1,
  };
  return mapping[severity];
}
```

---

## 6. Constructing `context_scope` for Fix Tasks

The `context_scope` field is **critical** - it contains the instructions that the Coder Agent follows when implementing the fix.

### Existing `context_scope` Pattern

From `/home/dustin/projects/hacky-hack/src/agents/prompts.ts` (lines 74-92):

```
For every Subtask, the `context_scope` must be a **strict set of instructions**
for a developer who cannot see the rest of the project. It must define:

1. INPUT: What data structures, variables, or outputs from dependencies to use
2. OUTPUT: What specific artifacts, APIs, or changes to produce
3. MOCKING: What external services, APIs, or systems to fake for isolation
```

**Example from prompts.ts (line 135):**

```
"context_scope": "CONTRACT DEFINITION:\n1. RESEARCH NOTE: [Finding from $SESSION_DIR/architecture/ regarding this feature].\n2. INPUT: [Specific data structure/variable] from [Dependency ID].\n3. LOGIC: Implement [PRD Section X] logic. Mock [Service Y] for isolation.\n4. OUTPUT: Return [Result Object/Interface] for consumption by [Next Subtask ID]."
```

### Proposed `context_scope` Template for Bug Fixes

```typescript
function constructFixContextScope(bug: Bug): string {
  const sections = [
    'BUG FIX CONTRACT DEFINITION',
    '',
    '1. BUG REFERENCE',
    `   Bug ID: ${bug.id}`,
    `   Severity: ${bug.severity}`,
    `   Title: ${bug.title}`,
    '',
    '2. BUG DESCRIPTION',
    `   ${bug.description}`,
    '',
    '3. REPRODUCTION STEPS',
    bug.reproduction
      .split('\n')
      .map((step, i) => `   ${i + 1}. ${step}`)
      .join('\n'),
    '',
    bug.location ? `4. TARGET LOCATION\n   File: ${bug.location}\n` : '',
    '5. FIX REQUIREMENTS',
    '   INPUT: Examine the code at the target location (if specified) or search codebase for related functionality',
    '   LOGIC: Identify root cause, implement fix to address the bug while preserving existing functionality',
    '   OUTPUT: Modified code that resolves the bug without introducing regressions',
    '   MOCKING: Mock external dependencies during testing to isolate the fix',
    '',
    '6. VALIDATION',
    '   - Fix must resolve the reported bug',
    '   - Reproduction steps should no longer trigger the bug',
    '   - No regressions in related functionality',
    '   - Code should follow existing patterns in the codebase',
  ]
    .filter(Boolean)
    .join('\n');

  return sections;
}
```

### Example Output

For a bug with:

```typescript
{
  id: 'BUG-001',
  severity: 'critical',
  title: 'Login fails with empty password',
  description: 'Unhandled exception when password field is empty',
  reproduction: '1. Navigate to /login\n2. Leave password empty\n3. Click Submit',
  location: 'src/services/auth.ts:45'
}
```

Generated `context_scope`:

```
BUG FIX CONTRACT DEFINITION

1. BUG REFERENCE
   Bug ID: BUG-001
   Severity: critical
   Title: Login fails with empty password

2. BUG DESCRIPTION
   Unhandled exception when password field is empty

3. REPRODUCTION STEPS
   1. Navigate to /login
   2. Leave password empty
   3. Click Submit

4. TARGET LOCATION
   File: src/services/auth.ts:45

5. FIX REQUIREMENTS
   INPUT: Examine the code at the target location (if specified) or search codebase for related functionality
   LOGIC: Identify root cause, implement fix to address the bug while preserving existing functionality
   OUTPUT: Modified code that resolves the bug without introducing regressions
   MOCKING: Mock external dependencies during testing to isolate the fix

6. VALIDATION
   - Fix must resolve the reported bug
   - Reproduction steps should no longer trigger the bug
   - No regressions in related functionality
   - Code should follow existing patterns in the codebase
```

---

## 7. Complete Conversion Function

```typescript
/**
 * Converts Bug array from TestResults into Subtask array for bug fix pipeline
 *
 * @param testResults - Test results containing bugs to convert
 * @returns Array of Subtask objects for fix execution
 *
 * @example
 * const fixSubtasks = createFixSubtasks(testResults);
 * // Returns: [
 * //   { id: 'PFIX.M1.T001.S1', type: 'Subtask', title: '[BUG FIX] ...', ... },
 * //   { id: 'PFIX.M1.T002.S1', type: 'Subtask', title: '[BUG FIX] ...', ... }
 * // ]
 */
export function createFixSubtasks(testResults: TestResults): Subtask[] {
  return testResults.bugs.map((bug, index) => {
    const paddedIndex = String(index + 1).padStart(3, '0');
    const fixTaskId = `PFIX.M1.T${paddedIndex}.S1`;

    return {
      id: fixTaskId,
      type: 'Subtask',
      title: `[BUG FIX] ${bug.title}`,
      status: 'Planned',
      story_points: mapSeverityToStoryPoints(bug.severity),
      dependencies: [],
      context_scope: constructFixContextScope(bug),
    };
  });
}

/**
 * Maps bug severity to story points using Fibonacci sequence
 */
function mapSeverityToStoryPoints(severity: BugSeverity): number {
  const mapping: Record<BugSeverity, number> = {
    critical: 13,
    major: 8,
    minor: 3,
    cosmetic: 1,
  };
  return mapping[severity];
}

/**
 * Constructs detailed context_scope for bug fix subtask
 */
function constructFixContextScope(bug: Bug): string {
  const sections = [
    'BUG FIX CONTRACT DEFINITION',
    '',
    '1. BUG REFERENCE',
    `   Bug ID: ${bug.id}`,
    `   Severity: ${bug.severity}`,
    `   Title: ${bug.title}`,
    '',
    '2. BUG DESCRIPTION',
    `   ${bug.description}`,
    '',
    '3. REPRODUCTION STEPS',
    ...bug.reproduction.split('\n').map((step, i) => `   ${i + 1}. ${step}`),
    '',
    bug.location ? `4. TARGET LOCATION\n   File: ${bug.location}\n` : '',
    '5. FIX REQUIREMENTS',
    '   INPUT: Examine the code at the target location (if specified) or search codebase for related functionality',
    '   LOGIC: Identify root cause, implement fix to address the bug while preserving existing functionality',
    '   OUTPUT: Modified code that resolves the bug without introducing regressions',
    '   MOCKING: Mock external dependencies during testing to isolate the fix',
    '',
    '6. VALIDATION',
    '   - Fix must resolve the reported bug',
    '   - Reproduction steps should no longer trigger the bug',
    '   - No regressions in related functionality',
    '   - Code should follow existing patterns in the codebase',
  ]
    .filter(Boolean)
    .join('\n');

  return sections;
}
```

---

## 8. Integration with PRP Pipeline

### Bug Fix Sub-Pipeline Flow

1. **QA Bug Hunt Completes** (`/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`)
   - Returns `TestResults` with `bugs` array
   - `hasBugs` boolean drives fix cycle

2. **Bug Fix Detection** (in `PRPPipeline.runQACycle()`)

   ```typescript
   async runQACycle(): Promise<void> {
     const testResults = await this.runBugHunt();

     if (testResults.hasBugs) {
       // Trigger bug fix sub-pipeline
       await this.runBugFixPipeline(testResults);
     }
   }
   ```

3. **Convert Bugs to Fix Subtasks**

   ```typescript
   async runBugFixPipeline(testResults: TestResults): Promise<void> {
     // Convert bugs to subtasks
     const fixSubtasks = createFixSubtasks(testResults);

     // Create "Fix Phase" in backlog
     const fixPhase = this.createFixPhase(fixSubtasks);

     // Execute via TaskOrchestrator
     const fixScope = { type: 'phase', id: fixPhase.id } as const;
     const fixOrchestrator = new TaskOrchestrator(this.sessionManager, fixScope);

     while (await fixOrchestrator.processNextItem()) {
       // Process fix tasks
     }
   }
   ```

4. **Task Orchestrator Processes Fix Subtasks**
   - Each fix subtask follows standard PRP flow: Researching → Implementing → Complete/Failed
   - PRP Runtime generates fix-specific PRP using `context_scope`
   - Coder Agent implements the fix

5. **Re-run QA After Fixes**
   - Validate all bugs are resolved
   - Repeat bug fix cycle if new bugs found

---

## 9. Existing Patterns in Codebase

### Dynamic Task Creation

**Location:** `/home/dustin/projects/hacky-hack/src/core/task-patcher.ts` (lines 60-105)

The `task-patcher.ts` module shows how to dynamically update backlogs:

```typescript
export function patchBacklog(backlog: Backlog, delta: DeltaAnalysis): Backlog {
  let patchedBacklog = backlog;

  for (const taskId of delta.taskIds) {
    const change = changeMap.get(taskId);

    switch (change.type) {
      case 'modified':
        patchedBacklog = updateItemStatus(patchedBacklog, taskId, 'Planned');
        break;
      case 'removed':
        patchedBacklog = updateItemStatus(patchedBacklog, taskId, 'Obsolete');
        break;
    }
  }

  return patchedBacklog;
}
```

**Pattern to follow:**

- Immutable updates using spread operators
- Use `updateItemStatus()` from `task-utils.ts`
- Return new backlog, don't mutate original

### Task Hierarchy Navigation

**Location:** `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`

Key utilities:

- `findItem(backlog, id)` - Find any item by ID
- `updateItemStatus(backlog, id, status)` - Immutable status update
- `filterByStatus(backlog, status)` - Get all items with status

### PRP Generation Context

**Location:** `/home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts` (lines 133-150)

PRP Runtime orchestrates: Researching → Implementing → Complete/Failed

---

## 10. Validation Schema Compatibility

### SubtaskSchema Validation

The generated fix tasks must validate against `SubtaskSchema`:

```typescript
// Validation check
import { SubtaskSchema } from './core/models.js';

const fixSubtask = createFixSubtasks(testResults)[0];
const result = SubtaskSchema.safeParse(fixSubtask);

if (!result.success) {
  console.error('Invalid fix subtask:', result.error);
}
```

**Critical validation points:**

- `id` must match regex `/^P\d+\.M\d+\.T\d+\.S\d+$/`
- `title` must be 1-200 characters
- `story_points` must be integer between 1-21
- `status` must be valid Status enum value
- `dependencies` must be string array (can be empty)
- `context_scope` must be non-empty string

---

## 11. Priority and Execution Order

### Bug Priority by Severity

```typescript
const severityOrder: Record<BugSeverity, number> = {
  critical: 0, // Execute first
  major: 1,
  minor: 2,
  cosmetic: 3, // Execute last
};

// Sort bugs by severity before converting to subtasks
function sortBugsByPriority(bugs: Bug[]): Bug[] {
  return [...bugs].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}
```

### Dependency Management

Fix tasks should be **independent** (empty `dependencies` array) because:

- Bugs are orthogonal issues
- Fixes can be applied in parallel
- No inherent dependency between bug fixes

However, if semantic dependencies exist (e.g., Bug B is caused by Bug A), they can be added:

```typescript
dependencies: bug.causedBy ? [bug.causedBy] : [];
```

---

## 12. File Structure for Fix Tasks

### Session Directory Layout

```
.sessions/
└── {session-id}/
    ├── metadata.json
    ├── prd_snapshot.md
    ├── tasks.json
    ├── test_results.md          # QA bug hunt results
    └── fixes/                   # Fix sub-pipeline artifacts
        ├── PFIX.M1.T001.S1/     # First bug fix
        │   ├── prp.md           # Generated PRP
        │   ├── implementation/  # Code changes
        │   └── validation.md    # Validation results
        └── PFIX.M1.T002.S1/     # Second bug fix
            ├── prp.md
            ├── implementation/
            └── validation.md
```

---

## 13. Testing Strategy

### Unit Tests

```typescript
describe('createFixSubtasks', () => {
  it('should convert bugs to valid subtasks', () => {
    const testResults: TestResults = {
      hasBugs: true,
      bugs: [
        {
          id: 'BUG-001',
          severity: 'critical',
          title: 'Test bug',
          description: 'Test description',
          reproduction: 'Test steps',
        },
      ],
      summary: 'Test summary',
      recommendations: [],
    };

    const fixSubtasks = createFixSubtasks(testResults);

    expect(fixSubtasks).toHaveLength(1);
    expect(SubtaskSchema.safeParse(fixSubtasks[0]).success).toBe(true);
  });

  it('should map severity to story points correctly', () => {
    expect(mapSeverityToStoryPoints('critical')).toBe(13);
    expect(mapSeverityToStoryPoints('major')).toBe(8);
    expect(mapSeverityToStoryPoints('minor')).toBe(3);
    expect(mapSeverityToStoryPoints('cosmetic')).toBe(1);
  });
});
```

---

## 14. Open Questions and Future Enhancements

### Questions

1. **Should fix tasks be added to existing backlog or separate "Fix Phase"?**
   - Recommendation: Separate Fix Phase for clearer separation of concerns

2. **How to handle bugs that cannot be auto-fixed?**
   - Recommendation: Add `requiresManualIntervention` flag to Bug schema

3. **Should fix tasks have dependencies on original tasks?**
   - Recommendation: No - fixes are independent post-delivery activities

4. **How to handle fix failures?**
   - Recommendation: Mark as Failed, create new bug with "fix failed" tag

### Future Enhancements

1. **Root cause analysis integration** - Auto-generate detailed context from code analysis
2. **Fix template library** - Common bug patterns with pre-written fixes
3. **Regression test generation** - Auto-create tests for fixed bugs
4. **Fix effectiveness tracking** - Metrics on bug recurrence rates

---

## 15. Key Takeaways

1. **Bug → Subtask mapping is straightforward** with clear field correspondences
2. **Use hierarchical ID format** (`PFIX.M1.T{N}.S1`) for compatibility
3. **Severity maps to story points** using Fibonacci sequence (critical=13, major=8, minor=3, cosmetic=1)
4. **`context_scope` is the most critical field** - must contain detailed bug report info
5. **Fix tasks are independent** (empty dependencies) but can be prioritized by severity
6. **Immutable updates** follow existing patterns in `task-patcher.ts`
7. **Validation against SubtaskSchema** ensures type safety and correctness

---

## 16. References

- **Bug Interface:** `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 1588-1649)
- **Subtask Interface:** `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 149-211)
- **SubtaskSchema:** `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 236-253)
- **Task Patcher:** `/home/dustin/projects/hacky-hack/src/core/task-patcher.ts`
- **Task Utils:** `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`
- **PRP Runtime:** `/home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts`
- **Bug Hunt Workflow:** `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`
- **PRP Pipeline:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`
- **Prompts (context_scope pattern):** `/home/dustin/projects/hacky-hack/src/agents/prompts.ts` (lines 74-135)

---

**End of Research Document**
