# SessionState Interface Research

## Interface Definition Location

**File:** `/home/dustin/projects/hacky-hack/src/core/models.ts`
**Lines:** 860-905

```typescript
export interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string;
  readonly taskRegistry: Backlog;
  readonly currentItemId: string | null;
}
```

## Complete Field Documentation

### Field 1: `metadata`
- **Type:** `SessionMetadata` (interface)
- **Location:** Lines 761-814 of `/home/dustin/projects/hacky-hack/src/core/models.ts`
- **Properties:**
  ```typescript
  interface SessionMetadata {
    readonly id: string;              // Format: {sequence}_{hash} (e.g., "001_14b9dc2a33c7")
    readonly hash: string;            // First 12 chars of SHA-256 PRD hash
    readonly path: string;            // Filesystem path to session directory
    readonly createdAt: Date;         // Timestamp when session was created
    readonly parentSession: string | null;  // Parent session ID for delta sessions
  }
  ```

### Field 2: `prdSnapshot`
- **Type:** `string`
- **Purpose:** Full PRD content at session initialization
- **Details:** Stores complete PRD markdown content as a string

### Field 3: `taskRegistry`
- **Type:** `Backlog` (interface)
- **Location:** Lines 685-697 of `/home/dustin/projects/hacky-hack/src/core/models.ts`
- **Structure:**
  ```typescript
  interface Backlog {
    readonly backlog: Phase[];  // Array of phases comprising complete project backlog
  }
  ```

### Field 4: `currentItemId`
- **Type:** `string | null`
- **Purpose:** Currently executing work item ID
- **Format:** `P{phase}.M{milestone}.T{task}.S{subtask}` or similar

## Zod Schemas

**Important Finding:** There are **NO Zod schemas** for SessionState in the codebase.

**Existing Zod schemas in the codebase:**
- `BacklogSchema` - validates task hierarchy
- `PhaseSchema`, `MilestoneSchema`, `TaskSchema`, `SubtaskSchema`
- `PRPDocumentSchema`, `PRPArtifactSchema`
- `ValidationGateSchema`, `SuccessCriterionSchema`

## Key Architecture Insights

1. **No Direct Serialization:** SessionState is never serialized as a complete object. Instead, its components are stored separately:
   - `taskRegistry` → `tasks.json` (validated with `BacklogSchema`)
   - `prdSnapshot` → `prd_snapshot.md` (raw markdown)
   - `metadata` → parsed from directory name and filesystem stats
   - `currentItemId` → managed in-memory by SessionManager

2. **Readonly Properties:** All fields use `readonly` modifier to ensure immutability

3. **Type Narrowing Support:** The codebase uses type narrowing to distinguish between SessionState and DeltaSession

4. **Atomic Writes:** The `taskRegistry` uses atomic write pattern (temp file + rename)

## Example SessionState Object

```typescript
const state: SessionState = {
  metadata: {
    id: '001_14b9dc2a33c7',
    hash: '14b9dc2a33c7',
    path: 'plan/001_14b9dc2a33c7',
    createdAt: new Date('2024-01-12T10:00:00Z'),
    parentSession: null,
  },
  prdSnapshot: '# PRD Content\n...',
  taskRegistry: {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        title: 'Phase 1',
        status: 'Planned',
        description: 'Foundation',
        milestones: []
      }
    ]
  },
  currentItemId: 'P1.M1.T1.S1'
};
```
