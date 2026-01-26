# SessionManager Parameter Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLI ENTRY POINT                                   │
│                        (src/cli/index.ts)                                   │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                │ CLI Arguments
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
           --prd <path>   --plan-dir <path>  --flush-retries <n>
           (PRD.md)       (plan/)             (3)
                │               │               │
                └───────────────┴───────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRPPIPELINE                                         │
│                    (src/workflows/prp-pipeline.ts)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Constructor (lines 303-351):                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ this.#prdPath = prdPath;              // Line 334                   │   │
│  │ this.#planDir = planDir;              // Line 344                   │   │
│  │ this.#flushRetries = flushRetries;    // Line 351                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Private Fields:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ readonly #prdPath: string;                  // Line 177               │   │
│  │ readonly #planDir?: string;                 // Line 204               │   │
│  │ readonly #flushRetries?: number;            // Line 258               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                │ Creates SessionManager
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SESSIONMANAGER                                         │
│                   (src/core/session-manager.ts)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Instantiation (lines 1768-1772):                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ const SessionManagerClass =                                         │   │
│  │   (await import('./core/session-manager.js')).SessionManager;       │   │
│  │                                                                      │   │
│  │ this.sessionManager = new SessionManagerClass(                      │   │
│  │   this.#prdPath,      // ← Parameter 1: string (required)           │   │
│  │   this.#planDir,      // ← Parameter 2: string (optional)           │   │
│  │   this.#flushRetries  // ← Parameter 3: number (optional)           │   │
│  │ );                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Constructor Signature (lines 190-194):                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ constructor(                                                         │   │
│  │   prdPath: string,                                                 │   │
│  │   planDir: string = resolve('plan'),                                │   │
│  │   flushRetries: number = 3                                         │   │
│  │ )                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Initialization:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Validates PRD file exists (synchronous)                            │   │
│  │ • Resolves paths to absolute                                        │   │
│  │ • Initializes internal state (#currentSession, #prdHash, etc.)     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                │ Passes instance
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TASKORCHESTRATOR                                        │
│                   (src/core/task-orchestrator.ts)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Instantiation (lines 554-562):                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ this.taskOrchestrator = new TaskOrchestratorClass(                  │   │
│  │   this.sessionManager,  // ← Already instantiated with 3 params     │   │
│  │   this.#scope,                                                     │   │
│  │   this.#noCache,                                                   │   │
│  │   this.#researchQueueConcurrency,                                  │   │
│  │   this.#cacheTtlMs,                                                │   │
│  │   this.#prpCompression,                                            │   │
│  │   this.#retryConfig                                                │   │
│  │ );                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Constructor Signature (lines 132-140):                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ constructor(                                                         │   │
│  │   sessionManager: SessionManager,  // ← RECEIVED as parameter        │   │
│  │   scope?: Scope,                                                   │   │
│  │   noCache: boolean = false,                                        │   │
│  │   researchQueueConcurrency: number = 3,                            │   │
│  │   cacheTtlMs: number = 24 * 60 * 60 * 1000,                       │   │
│  │   prpCompression: PRPCompressionLevel = 'standard',                │   │
│  │   retryConfig?: Partial<TaskRetryConfig>                           │   │
│  │ )                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  SessionManager Usage (line 142):                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ this.sessionManager = sessionManager;  // ← Stores reference        │   │
│  │                                                                      │   │
│  │ // Validation (lines 149-152):                                      │   │
│  │ const currentSession = sessionManager.currentSession;               │   │
│  │ if (!currentSession) {                                              │   │
│  │   throw new Error('Cannot create TaskOrchestrator: no session');    │   │
│  │ }                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Usage Throughout Class:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Line 162: ResearchQueue creation                                   │   │
│  │ • Line 181: TaskRetryManager initialization                          │   │
│  │ • Various: updateItemStatus(), flushUpdates(), etc.                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Points

1. **Dependency Injection Pattern**: TaskOrchestrator does NOT create SessionManager - it receives it from PRPPipeline
2. **Single Source of Truth**: PRPPipeline is the ONLY place that creates SessionManager in production code
3. **Parameter Propagation**: CLI args → PRPPipeline fields → SessionManager constructor → TaskOrchestrator
4. **No Circular Dependencies**: Clear one-way flow from CLI → PRPPipeline → SessionManager → TaskOrchestrator
5. **Validation Chain**: SessionManager validates PRD, TaskOrchestrator validates session

## Bug Location

The 2-parameter constructor bug exists in **test files only**:

```typescript
// WRONG (old test pattern):
new SessionManager(prdPath, flushRetries)
// Bug: flushRetries (number) is passed to planDir (string) parameter!

// CORRECT (new test pattern):
new SessionManager(prdPath, resolve('plan'), flushRetries)
// Fix: Explicitly pass planDir so flushRetries goes to correct parameter
```

Production code (PRPPipeline) already uses the correct 3-parameter pattern.
