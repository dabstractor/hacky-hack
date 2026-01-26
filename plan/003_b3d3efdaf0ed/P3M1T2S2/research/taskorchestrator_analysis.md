# TaskOrchestrator ResearchQueue Integration Analysis

## Research Report: TaskOrchestrator ResearchQueue Analysis

### Key Findings:

**1. ResearchQueue Instantiation Location:**
- File: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- Lines: 132-138
- Hardcoded concurrency limit of 3

```typescript
// Initialize ResearchQueue with concurrency limit of 3
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  3,
  this.#noCache
);
this.#logger.debug({ maxSize: 3 }, 'ResearchQueue initialized');
```

**2. TaskOrchestrator Constructor Signature:**
```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false
)
```

**3. ResearchQueue Constructor Signature:**
```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false
)
```

**4. Current Instantiation Pattern:**
- Hardcoded `maxSize: 3` in TaskOrchestrator constructor
- Constructor injection pattern with shared dependencies
- Uses same `sessionManager` and `noCache` flag

**5. Usage Patterns:**
- Enqueue subtasks during task execution (line 562-568)
- Check cache for existing PRPs (line 616)
- Trigger background processing (line 683)
- Get queue statistics (lines 571, 693)

### Recommended Modifications:

**Option 1: Add maxSize to TaskOrchestrator Constructor**
```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueMaxSize: number = 3
)
```

**Option 2: Factory Method Pattern**
```typescript
private createResearchQueue(): ResearchQueue {
  return new ResearchQueue(
    this.sessionManager,
    this.#getResearchQueueMaxSize(),
    this.#noCache
  );
}
```

**Option 3: Dependency Injection**
```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueue?: ResearchQueue
)
```

### Impact:
- **Files to modify**: Only `src/core/task-orchestrator.ts`
- **Breaking changes**: None if using default values
- **Migration path**: Add optional parameter with default, then gradually update usage

The analysis shows the current implementation tightly couples TaskOrchestrator to a fixed concurrency limit. Adding a configurable parameter would improve flexibility while maintaining backward compatibility.
