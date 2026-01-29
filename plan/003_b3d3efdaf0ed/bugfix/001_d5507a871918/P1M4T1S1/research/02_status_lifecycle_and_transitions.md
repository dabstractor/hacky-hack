# Status Lifecycle and Transitions Analysis

## Executive Summary

**'Retrying' Status Positioning**: CORRECT ✅

The 'Retrying' status is correctly positioned in the status lifecycle between 'Implementing' and the terminal states ('Complete', 'Failed'). This positioning makes logical sense for a retry workflow where tasks can only be retried during the implementation phase.

---

## 1. Status Lifecycle Overview

### Complete Status Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TASK STATUS LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  START                                                              │
│    │                                                                │
│    ▼                                                                │
│  ┌─────────────┐                                                    │
│  │  Planned    │ ← Initial state, not yet started                  │
│  └──────┬──────┘                                                    │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────┐                                                    │
│  │ Researching │ ← Discovery and planning phase                    │
│  └──────┬──────┘                                                    │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────┐                                                    │
│  │Implementing│ ← Active work in progress                          │
│  └──────┬──────┘                                                    │
│         │                                                            │
│         ├──► ┌─────────────┐                                        │
│         │    │  Retrying   │ ← Retry attempt after failure         │
│         │    └──────┬──────┘                                        │
│         │           │                                               │
│         │           ├──► Implementing (retry in progress)          │
│         │           │                                               │
│         │           └──► Terminal states (below)                   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────┐                   │
│  │              TERMINAL STATES                  │                   │
│  ├─────────────────────────────────────────────┤                   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │                   │
│  │  │ Complete │  │  Failed  │  │ Obsolete │  │                   │
│  │  │   ✓      │  │    ✗     │  │    ⊘     │  │                   │
│  │  └──────────┘  └──────────┘  └──────────┘  │                   │
│  │     Success      Permanent      Deprecated  │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Status Positioning Analysis

| Position | Status         | Type       | Description           |
| -------- | -------------- | ---------- | --------------------- |
| 1st      | `Planned`      | Initial    | Not yet started       |
| 2nd      | `Researching`  | Active     | Discovery phase       |
| 3rd      | `Implementing` | Active     | Work in progress      |
| **4th**  | **`Retrying`** | **Active** | **Retry attempt** ←   |
| 5th      | `Complete`     | Terminal   | Successfully finished |
| 6th      | `Failed`       | Terminal   | Permanently failed    |
| 7th      | `Obsolete`     | Terminal   | No longer relevant    |

---

## 2. 'Retrying' Status Positioning Analysis

### Current Position: 4th of 7

**Location**: Between `Implementing` and terminal states

**Rationale**:

1. **Logical Flow**: Retries only occur during implementation
2. **Precondition**: Task must be in 'Implementing' before it can be retried
3. **Transition Flexibility**: From 'Retrying', task can:
   - Return to 'Implementing' (retry in progress)
   - Move to 'Complete' (succeeded on retry)
   - Move to 'Failed' (exhausted retries)

### Why This Positioning is Correct

```typescript
// Retry workflow:
// 1. Task starts as 'Planned'
// 2. Task moves to 'Researching' for planning
// 3. Task moves to 'Implementing' for execution
// 4. Task fails during execution
// 5. Task moves to 'Retrying' (4th position) ←
// 6. Task either:
//    - Returns to 'Implementing' for another attempt
//    - Moves to 'Complete' if successful
//    - Moves to 'Failed' if retries exhausted
```

**Key Insight**: 'Retrying' is NOT a terminal state. It's a transitional state that only makes sense during the implementation phase.

---

## 3. Status Transition Matrix

### Valid Transitions

| From             | To               | Valid? | Context                       |
| ---------------- | ---------------- | ------ | ----------------------------- |
| Planned          | Researching      | ✅     | Task ready for research       |
| Planned          | Obsolete         | ✅     | Task cancelled before start   |
| Researching      | Implementing     | ✅     | Research complete, start work |
| Researching      | Planned          | ✅     | Needs more planning           |
| Researching      | Obsolete         | ✅     | Task cancelled                |
| **Implementing** | **Retrying**     | ✅     | **Failed, retry initiated**   |
| **Implementing** | **Complete**     | ✅     | **Work finished**             |
| **Implementing** | **Failed**       | ✅     | **Permanently failed**        |
| **Implementing** | **Obsolete**     | ✅     | **Task cancelled**            |
| **Retrying**     | **Implementing** | ✅     | **Retry in progress**         |
| **Retrying**     | **Complete**     | ✅     | **Succeeded on retry**        |
| **Retrying**     | **Failed**       | ✅     | **Retries exhausted**         |
| **Retrying**     | **Obsolete**     | ✅     | **Cancelled during retry**    |
| Complete         | Obsolete         | ✅     | Superseded by new work        |
| Failed           | Obsolete         | ✅     | No longer relevant            |

### Transitions Involving 'Retrying'

```
                    ┌──────────────┐
                    │ Implementing │
                    └───────┬──────┘
                            │
                            │  (fails during execution)
                            │
                            ▼
                    ┌──────────────┐
                    │   Retrying   │ ← ENTRY POINT
                    └───────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Implementing │ │  Complete    │ │    Failed     │
   └──────────────┘ └──────────────┘ └──────────────┘
   (retry loop)    (success)        (exhausted)
```

---

## 4. 'Retrying' Status Semantics

### Definition

**'Retrying'** = A task that failed during execution and is now being attempted again.

### Characteristics

1. **Non-terminal**: Not an end state
2. **Transitional**: Intermediate state during retry workflow
3. **Implementation-phase only**: Only reachable from 'Implementing'
4. **Multi-path**: Can lead back to 'Implementing' or to terminal states

### Visual Indicators

```typescript
// Color: chalk.yellow (warning/caution)
getStatusColor('Retrying'); // → chalk.yellow

// Indicator: '↻' (refresh/redo symbol)
getStatusIndicator('Retrying'); // → '↻' (yellow)
getPlainStatusIndicator('Retrying'); // → '↻' (plain)
```

**Semantic Meaning**: The yellow color and ↻ symbol convey:

- Caution (previous attempt failed)
- Action in progress (retrying)
- Not yet terminal (outcome uncertain)

---

## 5. Status Lifecycle Code Examples

### Example 1: Normal Flow (No Retries)

```typescript
// Task progresses through lifecycle without issues
let status: Status = 'Planned';
status = 'Researching'; // Research complete
status = 'Implementing'; // Work started
status = 'Complete'; // Work finished
```

### Example 2: Retry Flow

```typescript
// Task fails and enters retry loop
let status: Status = 'Planned';
status = 'Researching';
status = 'Implementing';

// Task fails
status = 'Retrying'; // ← Entered retry state

// Retry attempt succeeds
status = 'Complete'; // ← Exited retry state to success
```

### Example 3: Exhausted Retries

```typescript
// Task fails multiple times
let status: Status = 'Implementing';

// First failure
status = 'Retrying';
status = 'Implementing'; // Retry 1

// Second failure
status = 'Retrying';
status = 'Implementing'; // Retry 2

// Third failure (exhausted)
status = 'Retrying';
status = 'Failed'; // ← Exited retry state to failure
```

---

## 6. TaskRetryManager Integration

### Location in Code

**File**: `src/core/task-retry-manager.ts`
**Lines**: 311-316

### Code

```typescript
// Update status to 'Retrying'
await this.#sessionManager.updateItemStatus(subtask.id, 'Retrying' as Status);
await this.#sessionManager.flushUpdates();
```

### Workflow

```typescript
// 1. Task is 'Implementing'
// 2. Task execution fails
// 3. TaskRetryManager catches failure
// 4. Status updated to 'Retrying' (lines 311-316)
// 5. Retry attempt initiated
// 6. Status either:
//    - Returns to 'Implementing' (retry in progress)
//    - Moves to 'Complete' (success)
//    - Moves to 'Failed' (exhausted)
```

---

## 7. Status Lifecycle Validation

### TypeScript Type System

```typescript
// Type system allows all transitions
type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying' // ← Properly included
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// Type narrowing with exhaustiveness checking
function handleStatus(status: Status): void {
  switch (status) {
    case 'Planned':
      // ...
      break;
    case 'Researching':
      // ...
      break;
    case 'Implementing':
      // ...
      break;
    case 'Retrying': // ← Properly handled
      // ...
      break;
    case 'Complete':
      // ...
      break;
    case 'Failed':
      // ...
      break;
    case 'Obsolete':
      // ...
      break;
  }
}
```

### Runtime Validation with Zod

```typescript
import { StatusEnum } from './models.js';

// Parse and validate status
const result = StatusEnum.safeParse('Retrying');

if (result.success) {
  console.log('Valid status:', result.data); // 'Retrying'
} else {
  console.log('Invalid status');
}

// Get all valid status values
StatusEnum.options; // ['Planned', 'Researching', 'Implementing', 'Retrying', 'Complete', 'Failed', 'Obsolete']
```

---

## 8. Comparison with Bug Report Claims

### Bug Report (Issue #3)

> **Claim**: "StatusEnum only defines 6 values"

**Reality**: StatusEnum defines **7 values** including 'Retrying'.

> **Claim**: "Tests expect 6 status values plus 'Retrying' (total 7)"

**Reality**: Tests expect **6 values** (missing 'Retrying'), implementation has **7 values**.

### Analysis

The bug report has the situation completely backwards:

| Aspect                   | Bug Report Claim   | Reality     |
| ------------------------ | ------------------ | ----------- |
| StatusEnum count         | 6 values           | 7 values ✅ |
| 'Retrying' in StatusEnum | Missing            | Present ✅  |
| Test expectations        | 7 values           | 6 values ❌ |
| Root cause               | Implementation bug | Test bug ❌ |

---

## 9. Conclusion

### 'Retrying' Status Positioning: VERIFIED CORRECT ✅

1. **Position**: 4th of 7 (between 'Implementing' and terminal states)
2. **Semantics**: Transitional state for retry attempts
3. **Transitions**: Properly connected to 'Implementing' and terminal states
4. **Visuals**: Yellow color and ↻ indicator convey "retry in progress"
5. **Usage**: Actively used by TaskRetryManager (lines 311-316)

### Status Lifecycle: COMPLETE AND LOGICAL ✅

The 7-status lifecycle provides a complete workflow:

1. **Initial states**: Planned, Researching, Implementing
2. **Retry state**: Retrying (during implementation only)
3. **Terminal states**: Complete, Failed, Obsolete

### Implementation Status: CORRECT ✅

No changes needed to the StatusEnum or status lifecycle. The implementation is correct and complete.

### Test Status: OUTDATED ❌

Tests need updating in P1.M4.T1.S4 to include 'Retrying' in expected status arrays.

---

## 10. ASCII Diagram Summary

```
                    TASK STATUS LIFECYCLE

    ┌──────────────────────────────────────────────────┐
    │                                                  │
    │  Planned ─► Researching ─► Implementing ─┐       │
    │                                          │       │
    │                                          ▼       │
    │                                    ┌─────────┐   │
    │                                    │Retrying │   │
    │                                    └────┬────┘   │
    │                                         │        │
    │                    ┌────────────────────┼────────────────────┐
    │                    │                    │                    │
    │                    ▼                    ▼                    ▼
    │              Implementing          Complete            Failed
    │              (retry loop)          (success)       (exhausted)
    │                                                              │
    └──────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
                        Obsolete
                     (any state can go here)
```

**Key Points**:

- 'Retrying' is positioned after 'Implementing' (execution failure)
- 'Retrying' can return to 'Implementing' (continue retry)
- 'Retrying' can go to terminal states (Complete/Failed)
- Any state can transition to 'Obsolete' (cancellation)
