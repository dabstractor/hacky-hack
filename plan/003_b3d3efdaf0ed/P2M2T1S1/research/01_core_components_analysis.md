# Core Components Architecture Analysis

## Four Core Processing Engines

### 1. Session Manager (`src/core/session-manager.ts`)

**Responsibilities**:
- Session state management with immutable `SessionState`
- PRD hash-based initialization (SHA-256)
- Session discovery and creation
- Delta session creation for PRD changes
- Atomic persistence with batch writes

**Key Methods**:
- `initialize(): Promise<SessionState>` - Load or create session
- `createDeltaSession(newPRDPath): Promise<DeltaSession>` - Handle PRD changes
- `updateItemStatus(itemId, status): Promise<Backlog>` - Batched status updates
- `flushUpdates(): Promise<void>` - Atomic state persistence

**Session Directory Structure**:
```
plan/
├── 001_14b9dc2a33c7/
│   ├── prd_snapshot.md          # Original PRD content
│   ├── tasks.json               # Task backlog registry
│   └── parent_session.txt       # Parent reference (delta sessions)
```

### 2. Task Orchestrator (`src/core/task-orchestrator.ts`)

**Responsibilities**:
- DFS pre-order traversal (Phase → Milestone → Task → Subtask)
- Dependency resolution for subtasks
- Scope-based execution support
- Status lifecycle management
- Smart git commits

**Key Methods**:
- `processNextItem(): Promise<boolean>` - Process execution queue
- `canExecute(subtask): boolean` - Check dependencies satisfied
- `getBlockingDependencies(subtask): Subtask[]` - Get blocking deps
- `waitForDependencies(subtask, options): Promise<void>` - Wait for deps

**Task Hierarchy**:
```
Phase P1
├── Milestone P1.M1
│   ├── Task P1.M1.T1
│   │   ├── Subtask P1.M1.T1.S1 (depends on: P1.M1.T1.S2)
│   │   └── Subtask P1.M1.T1.S2
```

### 3. Agent Runtime (`src/agents/prp-runtime.ts`)

**Responsibilities**:
- Agent factory for all personas
- Tool registration (Bash, Filesystem, Git)
- Context injection for agents
- PRP execution orchestration
- 4-level validation gate management

**Agent Types**:
| Agent | Persona | Responsibility |
|-------|---------|----------------|
| Architect | System Designer | Generates task backlog from PRD |
| Researcher | Context Gatherer | Generates PRPs for subtasks |
| Coder | Implementation Expert | Executes PRPs to produce code |
| QA | Quality Assurance | Finds and fixes bugs |

### 4. Pipeline Controller (`src/workflows/prp-pipeline.ts`)

**Responsibilities**:
- Main workflow orchestration
- Error recovery and retry logic
- Graceful shutdown (SIGINT handling)
- Progress tracking
- Session resumption

**Execution Flow**:
```
Initializing → Running → Success/Interrupted/Failure
```

## Data Structures

### Task Hierarchy Types
```typescript
type HierarchyItem = Phase | Milestone | Task | Subtask;

interface Phase {
  readonly id: string;              // P1
  readonly type: 'Phase';
  readonly milestones: Milestone[];
  readonly status: Status;
}

interface Subtask {
  readonly id: string;              // P1.M1.T1.S1
  readonly type: 'Subtask';
  readonly dependencies: string[];  // ['P1.M1.T1.S1']
  readonly status: Status;
  readonly story_points: number;
  readonly context_scope: string;
}

type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed';
```

### Session Types
```typescript
interface SessionState {
  readonly metadata: SessionMetadata;
  readonly prdSnapshot: string;
  readonly taskRegistry: Backlog;
  currentItemId: string | null;
}

interface DeltaSession extends SessionState {
  readonly oldPRD: string;
  readonly newPRD: string;
  readonly diffSummary: string;
}
```

## Design Patterns

1. **Immutability**: Readonly properties throughout
2. **Batch Updates**: Accumulate changes, flush atomically
3. **Type Discrimination**: `type` field for polymorphic behavior
4. **Dependency Injection**: Components receive dependencies
5. **Null Object**: Empty arrays instead of null for collections
