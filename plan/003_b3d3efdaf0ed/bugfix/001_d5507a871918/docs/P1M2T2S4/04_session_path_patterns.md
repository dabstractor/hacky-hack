# Research Report: Session Path Access Patterns

## Primary Access Pattern

**Standard pattern throughout codebase:**

```typescript
sessionManager.currentSession.metadata.path;
```

## SessionManager Structure

**Location**: `src/core/session-manager.ts`

```typescript
export class SessionManager {
  readonly prdPath: string;
  readonly planDir: string;
  #currentSession: SessionState | null = null;

  get currentSession(): SessionState | null {
    return this.#currentSession;
  }
}
```

## SessionState Structure

**Location**: `src/core/models.ts:884-929`

```typescript
export interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string;
  readonly taskRegistry: Backlog;
  readonly currentItemId: string | null;
}

export interface SessionMetadata {
  readonly id: string; // Format: "001_14b9dc2a33c7"
  readonly hash: string; // First 12 chars of SHA-256
  readonly path: string; // Session directory path
  readonly createdAt: Date;
  readonly parentSession: string | null;
}
```

## Usage Examples by Component

### PRPGenerator

**Location**: `src/agents/prp-generator.ts:213`

```typescript
constructor(sessionManager: SessionManager, ...) {
  const currentSession = sessionManager.currentSession;
  if (!currentSession) {
    throw new Error('Cannot create PRPGenerator: no active session');
  }
  this.sessionPath = currentSession.metadata.path;
}
```

### PRPRuntime

**Location**: `src/agents/prp-runtime.ts:139`

```typescript
constructor(orchestrator: TaskOrchestrator, ...) {
  const sessionManager = orchestrator.sessionManager;
  const currentSession = sessionManager.currentSession;
  if (!currentSession) {
    throw new Error('Cannot create PRPRuntime: no active session');
  }
  this.#sessionPath = currentSession.metadata.path;
}
```

### PRPPipeline

**Location**: `src/workflows/prp-pipeline.ts`

```typescript
// Line 1215
const sessionPath = this.sessionManager.currentSession?.metadata.path;

// Line 1326
const sessionPath = this.sessionManager.currentSession?.metadata.path;

// Line 1508
const sessionPath = this.sessionManager.currentSession?.metadata.path;

// Line 1624
const sessionPath = this.sessionManager.currentSession?.metadata.path;
```

### TaskOrchestrator

**Location**: `src/core/task-orchestrator.ts:763`

```typescript
const sessionPath = this.sessionManager.currentSession?.metadata.path;
```

## Null Check Patterns

### Pattern 1: Throw if no session

```typescript
const currentSession = sessionManager.currentSession;
if (!currentSession) {
  throw new Error('Cannot create X: no active session');
}
const sessionPath = currentSession.metadata.path;
```

### Pattern 2: Optional chaining with default

```typescript
const sessionPath = this.sessionManager.currentSession?.metadata.path ?? '';
```

### Pattern 3: Optional chaining (unsafe)

```typescript
const sessionPath = this.sessionManager.currentSession?.metadata.path;
```

## Workflow Constructor Patterns

### FixCycleWorkflow Pattern

**Location**: `src/workflows/fix-cycle-workflow.ts`

```typescript
export class FixCycleWorkflow extends Workflow {
  sessionPath: string; // Public field

  constructor(
    sessionPath: string,
    prdContent: string,
    taskOrchestrator: TaskOrchestrator,
    sessionManager: SessionManager
  ) {
    super('FixCycleWorkflow');

    if (typeof sessionPath !== 'string' || sessionPath.trim() === '') {
      throw new Error('FixCycleWorkflow requires valid sessionPath');
    }

    this.sessionPath = sessionPath;
    // ...
  }
}
```

**Key observations:**

- Accepts `sessionPath` as separate constructor parameter
- Stores it as public field
- Does NOT extract from `sessionManager` internally
- Requires explicit extraction before instantiation

## Other Classes Using sessionPath as Constructor Parameter

### PRPExecutor

**Location**: `src/agents/prp-executor.ts`

```typescript
export class PRPExecutor {
  readonly sessionPath: string;

  constructor(sessionPath: string) {
    if (!sessionPath) {
      throw new Error('sessionPath is required for PRPExecutor');
    }
    this.sessionPath = sessionPath;
  }
}
```

### CheckpointManager

**Location**: `src/core/checkpoint-manager.ts`

```typescript
export class CheckpointManager {
  readonly sessionPath: string;

  constructor(sessionPath: string, config: Partial<CheckpointConfig> = {}) {
    this.sessionPath = sessionPath;
  }
}
```

### CacheManager

**Location**: `src/utils/cache-manager.ts`

```typescript
export class CacheManager {
  readonly #sessionPath: string;

  constructor(sessionPath: string, cacheTtlMs: number = 24 * 60 * 60 * 1000) {
    this.#sessionPath = sessionPath;
    this.#cacheDir = resolve(sessionPath, 'prps', '.cache');
  }
}
```

## Path Construction Patterns

### Session-relative paths

```typescript
// PRP path
const prpPath = join(this.#sessionPath, 'prps', `${sanitizedId}.md`);

// Artifacts directory
const artifactsDir = join(this.#sessionPath, 'artifacts', subtask.id);

// TEST_RESULTS.md
const resultsPath = resolve(this.sessionPath, 'TEST_RESULTS.md');
```

### Standard subdirectories

```
sessionPath/
├── prps/
│   └── .cache/
├── artifacts/
│   └── {taskId}/
├── checkpoints/
├── tasks.json
├── prd_snapshot.md
└── TEST_RESULTS.md
```

## Type Definitions

### SessionMetadata

```typescript
export interface SessionMetadata {
  readonly id: string;
  readonly hash: string;
  readonly path: string; // Filesystem path to session directory
  readonly createdAt: Date;
  readonly parentSession: string | null;
}
```

### PipelineResult

```typescript
export interface PipelineResult {
  success: boolean;
  hasFailures: boolean;
  sessionPath: string; // Path to session directory
  totalTasks: number;
  completedTasks: number;
}
```

## Best Practice Recommendation

**For internal use within PRPPipeline:**

- Extract `sessionPath` once in constructor
- Store as private readonly field
- Use consistent null checking pattern

**For passing to workflows:**

- Follow FixCycleWorkflow pattern: accept as separate parameter
- Allows flexibility for testing
- Makes dependency explicit

## Summary Statistics

- **Primary access pattern**: `sessionManager.currentSession.metadata.path`
- **Constructor parameter pattern**: 4 classes (PRPExecutor, CheckpointManager, CacheManager, FixCycleWorkflow)
- **Optional chaining usage**: 6 locations
- **Null-safe extraction**: 12 locations
- **PRPPipeline usage**: 6 occurrences

## References

- SessionManager: `src/core/session-manager.ts`
- SessionMetadata: `src/core/models.ts:884-929`
- FixCycleWorkflow: `src/workflows/fix-cycle-workflow.ts:107-140`
- PRPGenerator: `src/agents/prp-generator.ts:213`
- PRPRuntime: `src/agents/prp-runtime.ts:139`
