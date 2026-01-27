# Status Lifecycle and Transitions Analysis

## Research Date
2026-01-27

## Objective
Document the complete status lifecycle and verify 'Retrying' status positioning within the workflow.

## Status Lifecycle Overview

### Normal Flow (No Errors)
```
Planned → Researching → Implementing → Complete
```

### Retry Flow (With Transient Errors)
```
Planned → Researching → Implementing → Retrying → Implementing → Complete
                                              ↓
                                          (max retries)
                                              ↓
                                           Failed
```

### Failure Flow (Permanent Errors)
```
Planned → Researching → Implementing → Failed
```

### Obsolescence Flow (Delta Sessions)
```
Planned → Researching → Implementing → Obsolete
```

## Detailed Status Definitions

### 1. Planned
**Purpose**: Initial state for all work items
**Entry**: Creation of work item
**Exit**: TaskOrchestrator begins work
**Color**: Gray (○)
**Meaning**: Not yet started

### 2. Researching
**Purpose**: Discovery and planning phase
**Entry**: TaskOrchestrator starts PRP generation
**Exit**: PRP complete, ready for implementation
**Color**: Cyan (◐)
**Meaning**: Gathering requirements and context

### 3. Implementing
**Purpose**: Active execution phase
**Entry**: Agent begins implementation work
**Exit**: Implementation complete or error occurs
**Color**: Blue (◐)
**Meaning**: Actively writing code

### 4. Retrying
**Purpose**: Retry attempt in progress
**Entry**: TaskRetryManager initiates retry after transient error
**Exit**: Retry attempt complete (success or failure)
**Color**: Yellow (↻)
**Meaning**: Recovering from transient error

**Retry Logic:**
- Triggered by: TaskRetryManager.executeWithRetry()
- Errors: Network issues, timeouts, HTTP 5xx, HTTP 429
- Max attempts: 3 (configurable)
- Backoff: Exponential with jitter (1s → 2s → 4s → 8s, max 30s)

### 5. Complete
**Purpose**: Successful completion
**Entry**: TaskOrchestrator finishes all work
**Exit**: Final state (no transitions out)
**Color**: Green (✓)
**Meaning**: Successfully implemented

### 6. Failed
**Purpose**: Permanent failure after retries
**Entry**: Max retries exhausted or permanent error
**Exit**: Final state (no transitions out)
**Color**: Red (✗)
**Meaning**: Cannot complete

**Permanent Errors:**
- ValidationError (contract violations)
- HTTP 4xx (client errors, except 429)
- Parse failures
- Code injection attempts

### 7. Obsolete
**Purpose**: Deprecated in delta sessions
**Entry**: DeltaAnalysis marks item as removed
**Exit**: Final state (no transitions out)
**Color**: Dim (⊘)
**Meaning**: Replaced or removed in newer PRD version

## Status Transition Matrix

### Valid Transitions (Current Implementation)

| From → To       | Planned | Researching | Implementing | Retrying | Complete | Failed | Obsolete |
|-----------------|---------|-------------|--------------|----------|----------|--------|----------|
| **Planned**     | -       | ✅          | ❌           | ❌       | ❌        | ❌      | ❌        |
| **Researching** | ❌       | -           | ✅           | ❌       | ❌        | ❌      | ❌        |
| **Implementing**| ❌       | ❌          | -            | ✅       | ✅        | ✅      | ❌        |
| **Retrying**    | ❌       | ❌          | ✅           | -        | ✅        | ✅      | ❌        |
| **Complete**    | ❌       | ❌          | ❌           | ❌       | -         | ❌      | ❌        |
| **Failed**      | ❌       | ❌          | ❌           | ❌       | ❌        | -      | ❌        |
| **Obsolete**    | ❌       | ❌          | ❌           | ❌       | ❌        | ❌      | -        |

### Transition Rules

**Forward Progression (Normal):**
1. Planned → Researching (TaskOrchestrator starts)
2. Researching → Implementing (PRP complete, implementation begins)
3. Implementing → Complete (success)

**Retry Logic:**
1. Implementing → Retrying (transient error occurs)
2. Retrying → Implementing (retry attempt starting)
3. Retrying → Complete (retry succeeds)
4. Retrying → Failed (max retries exhausted)

**Failure Paths:**
1. Implementing → Failed (permanent error)
2. Retrying → Failed (max retries exhausted)

**Obsolescence:**
1. Any active state → Obsolete (delta analysis marks as removed)

## 'Retrying' Status Positioning Analysis

### Current Position: 4th of 7
```
1. Planned
2. Researching
3. Implementing
4. Retrying ← CORRECT POSITION
5. Complete
6. Failed
7. Obsolete
```

### Why This Position Is Correct

**Logical Flow:**
- 'Retrying' comes AFTER 'Implementing' (only occurs during implementation)
- 'Retrying' comes BEFORE terminal states (not a final state)
- 'Retrying' is parallel to 'Implementing' in the workflow (alternates during retries)

**Alternative Positions Considered:**

1. **Before 'Implementing'?** ❌
   - Bad: Cannot retry before starting implementation
   - Current: Correct placement after 'Implementing'

2. **After 'Complete'?** ❌
   - Bad: Cannot retry after completion
   - Current: Correct placement before 'Complete'

3. **As terminal state?** ❌
   - Bad: 'Retrying' is transient, not final
   - Current: Correct as intermediate state

**Conclusion:** Current positioning is **OPTIMAL** for the workflow.

## State Machine Implementation

### Entry Points

**Planned Entry:**
```typescript
// src/core/session-manager.ts
const newSubtask: Subtask = {
  id: subtaskId,
  type: 'Subtask',
  title: task.title,
  status: 'Planned',  // ← Initial state
  // ...
};
```

**Researching Entry:**
```typescript
// src/core/task-orchestrator.ts
await this.#sessionManager.updateItemStatus(subtask.id, 'Researching');
```

**Implementing Entry:**
```typescript
// src/core/task-orchestrator.ts
await this.#sessionManager.updateItemStatus(subtask.id, 'Implementing');
```

**Retrying Entry:**
```typescript
// src/core/task-retry-manager.ts:312-315
await this.#sessionManager.updateItemStatus(
  subtask.id,
  'Retrying' as Status  // ← Retry trigger
);
await this.#sessionManager.flushUpdates();
```

**Complete Entry:**
```typescript
// src/core/task-orchestrator.ts
await this.#sessionManager.updateItemStatus(subtask.id, 'Complete');
```

**Failed Entry:**
```typescript
// src/core/task-orchestrator.ts
await this.#sessionManager.updateItemStatus(subtask.id, 'Failed');
```

**Obsolete Entry:**
```typescript
// src/core/task-patcher.ts
patchedSubtask.status = 'Obsolete';  // ← Delta analysis
```

### Exit Conditions

**From 'Retrying':**
- **Success**: Transition to 'Implementing' (next retry attempt)
- **Success (final)**: Transition to 'Complete' (retry succeeds)
- **Failure**: Transition to 'Failed' (max retries exhausted)

### Duration Analysis

| Status        | Typical Duration | Trigger                           |
|---------------|------------------|-----------------------------------|
| Planned       | Seconds-minutes  | Until TaskOrchestrator starts     |
| Researching   | Minutes-hours    | PRP generation time               |
| Implementing  | Minutes-hours    | Agent implementation time         |
| Retrying      | Seconds          | Retry delay (1-30s)               |
| Complete      | Permanent        | N/A (final state)                 |
| Failed        | Permanent        | N/A (final state)                 |
| Obsolete      | Permanent        | N/A (final state, delta sessions) |

## Visualization

### ASCII Diagram
```
                    ┌─────────────┐
                    │   Planned   │ (Initial)
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Researching │ (Discovery)
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    Implementing        │ ◄──────┐
              └──────────┬─────────────┘        │
                         │                      │
            ┌────────────┼────────────┐         │
            │            │            │         │
            ▼            ▼            ▼         │
       ┌─────────┐  ┌─────────┐  ┌──────┐    │
       │Retrying │  │Complete │  │Failed│    │
       └────┬────┘  └─────────┘  └──────┘    │
            │                              │
            └──────────────────────────────┘
                     (retry loop)
```

## Status Invariants

### Immutable Properties
1. Once 'Complete', always 'Complete'
2. Once 'Failed', always 'Failed'
3. Once 'Obsolete', always 'Obsolete'
4. 'Retrying' can only transition to 'Implementing', 'Complete', or 'Failed'

### Mutable Properties
1. 'Planned' → 'Researching'
2. 'Researching' → 'Implementing'
3. 'Implementing' ↔ 'Retrying' (bidirectional during retries)
4. 'Implementing' → 'Failed' (permanent error)
5. 'Retrying' → 'Failed' (max retries)

### Delta Session Behavior
In delta sessions, items can transition from any active state to 'Obsolete':
- Planned → Obsolete
- Researching → Obsolete
- Implementing → Obsolete
- Retrying → Obsolete

## Conclusion

The 'Retrying' status is:
- ✅ **CORRECTLY INCLUDED** in StatusEnum
- ✅ **CORRECTLY POSITIONED** between 'Implementing' and terminal states
- ✅ **FULLY INTEGRATED** into retry workflow
- ✅ **PROPERLY VISUALIZED** with yellow color and ↻ indicator
- ✅ **ACTIVELY USED** by TaskRetryManager

No implementation changes needed. The status lifecycle is well-designed and properly implemented.
