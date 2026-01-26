# Product Requirement Prompt (PRP): Add Checkpoint Mechanism for Long-Running Tasks

**PRP ID**: P3.M2.T2.S1
**Work Item Title**: Add checkpoint mechanism for long-running tasks
**Generated**: 2026-01-24
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Implement a checkpoint mechanism that saves execution state at critical points during PRP execution, allowing resumption from the last saved state if the pipeline is interrupted (e.g., system crash, user cancellation, timeout).

**Deliverable**:
1. `src/core/checkpoint-manager.ts` - CheckpointManager class with save, restore, list, and cleanup capabilities
2. Integration in PRPExecutor to create checkpoints at key execution points
3. `tests/unit/core/checkpoint-manager.test.ts` - Unit tests for checkpoint functionality

**Success Definition**:
- CheckpointManager class exists with all required methods (saveCheckpoint, restoreCheckpoint, listCheckpoints, cleanup)
- Checkpoints are saved to `artifacts/{taskId}/checkpoints.json` using atomic write pattern
- PRPExecutor creates checkpoints: (a) before starting PRP, (b) after Coder Agent response, (c) after each validation gate
- On interruption, checkpoints can be restored to resume from last state
- All unit tests pass with vitest
- Checkpoint data structure is validated with Zod schema
- Existing atomic write pattern from session-utils.ts is reused

---

## User Persona

**Target User**: Backend developer implementing reliability improvements for the PRP Pipeline.

**Use Case**: When long-running agent calls (Architect, Researcher, Coder, QA) are interrupted due to system crashes, user cancellation, or timeouts, the system should be able to resume from the last checkpoint rather than starting from the beginning.

**User Journey**:
1. Pipeline executes a long-running subtask (e.g., large codebase analysis)
2. Checkpoint is saved before agent execution starts
3. System is interrupted (crash, SIGINT, timeout)
4. On restart, pipeline detects incomplete task and checks for checkpoints
5. Checkpoint is restored and execution resumes from last known state
6. Task completes successfully without losing previous progress

**Pain Points Addressed**:
- **Lost progress on interruption**: Long agent calls can take minutes; interruption loses all progress
- **No resume capability**: Must restart entire task from beginning after interruption
- **Poor observability**: No visibility into what state a task was in when interrupted
- **Wasted API credits**: Re-running completed agent calls wastes time and API quota

---

## Why

- **Current limitation**: From system_context.md - "Batching state updates exist but no checkpoint mechanism within a single task execution. Long agent calls could lose progress if interrupted."
- **Transient failures**: System crashes, network issues, user cancellations, and timeouts can interrupt long-running tasks
- **Cost efficiency**: Re-running agent calls wastes API credits and time
- **User experience**: Ability to resume from interruption reduces frustration and improves reliability
- **Observability**: Checkpoints provide visibility into task execution state at any point

---

## What

Implement a checkpoint mechanism with the following behavior:

### Success Criteria

- [ ] CheckpointManager class exists at `src/core/checkpoint-manager.ts`
- [ ] Checkpoints saved to `artifacts/{taskId}/checkpoints.json` using atomic write pattern
- [ ] PRPExecutor creates checkpoints at: (a) before PRP execution, (b) after Coder Agent, (c) after each validation gate
- [ ] CheckpointManager supports save, restore, list, and cleanup operations
- [ ] Checkpoint data validated with Zod schema
- [ ] On interruption, checkpoint allows resume from last state
- [ ] Unit tests cover: save, restore, list, cleanup, validation, error handling
- [ ] All tests pass with `vitest run`
- [ ] Existing atomic write pattern from session-utils.ts is reused

---

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:
- Complete analysis of existing SessionManager and state persistence patterns
- Complete PRPExecutor flow analysis with specific line numbers for integration points
- Existing atomic write pattern from session-utils.ts
- Existing test patterns (vitest) with specific file structure
- TaskRetryManager patterns (recently implemented in P3.M2.T1) for reference
- Checkpoint data structure design with Zod validation
- Industry best practices research for checkpoint mechanisms
- Specific file paths, class names, and method signatures

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Existing State Management (REUSE PATTERNS)
- file: src/core/session-manager.ts
  why: Batch update pattern, atomic write integration, state persistence
  pattern:
    - Batch updates with #pendingUpdates and flushUpdates() (lines 670-720)
    - updateItemStatus() for status changes (lines 768-800)
    - Immutable state updates with readonly properties
  gotcha:
    - Must call flushUpdates() to persist changes
    - Batch writes are atomic via temp file + rename pattern

# PRP Executor (PRIMARY INTEGRATION POINT)
- file: src/agents/prp-executor.ts
  why: Main execution flow where checkpoints will be created
  pattern:
    - execute() method (lines 238-322) - main execution flow
    - #runValidationGates() (lines 335-396) - sequential validation
    - #fixAndRetry() (lines 411-458) - fix attempt pattern
  gotcha:
    - Coder Agent execution is the long-running operation needing checkpoints
    - Validation gates run sequentially - checkpoint after each gate
    - Current fix-and-retry doesn't handle interruption during agent call

# Atomic Write Pattern (CRITICAL - MUST REUSE)
- file: src/core/session-utils.ts
  why: Atomic write implementation for checkpoint files
  pattern:
    - atomicWrite() function (lines 99-180)
    - Temp file + rename pattern for POSIX atomicity
    - Error handling with cleanup on failure
  gotcha:
    - Must use atomic writes for checkpoints to prevent corruption
    - Rename is atomic on POSIX, not on Windows (acceptable limitation)

# Models (TYPE DEFINITIONS)
- file: src/core/models.ts
  why: Existing data structures and Zod validation patterns
  pattern:
    - ValidationGateResult interface (lines 38-55)
    - ExecutionResult interface (lines 65-76)
    - PRPDocument interface
    - Zod schema validation patterns
  gotcha:
    - Use Zod for runtime validation of checkpoint data

# Task Retry Manager (REFERENCE - SIMILAR PATTERNS)
- file: src/core/task-retry-manager.ts
  why: Recently implemented with similar state management patterns
  pattern:
    - Configuration interface (TaskRetryConfig)
    - State tracking (RetryState)
    - Error classification approach
    - Logging patterns
  gotcha:
    - Retry state is in-memory only, checkpoints must be persisted

# PRP Runtime (SECONDARY INTEGRATION)
- file: src/agents/prp-runtime.ts
  why: Checkpoint opportunity between Research and Implementation phases
  pattern:
    - executeSubtask() method - main orchestration
    - Status progression: Researching → Implementing
  gotcha:
    - Checkpoint after PRP generation completes
    - Checkpoint before implementation starts

# Research Findings (FROM PARALLEL RESEARCH)
- docfile: plan/003_b3d3efdaf0ed/P3M2T2S1/research/codebase-analysis-summary.md
  why: Comprehensive codebase analysis with integration points
  section: Integration Points for Checkpoint Mechanism, Data Model Considerations

# External Research (URLs with section anchors)
- url: https://nodejs.org/api/fs.html
  why: Node.js File System API for file operations
  section: fs.promises (async file operations)

- url: https://github.com/temporalio/sdk-typescript
  why: Temporal workflow orchestration - durable execution patterns
  section: Workflow replay and state management

- url: https://www.npmjs.com/package/write-file-atomic
  why: Reference for atomic write patterns
  note: We implement our own using session-utils.ts pattern

- url: https://www.npmjs.com/package/node-persist
  why: Reference for state persistence patterns
  section: Key-value storage with TTL

# Test Patterns
- file: tests/unit/core/session-manager.test.ts
  why: Reference for testing core classes with vitest
  pattern:
    - Mock fs/promises with vi.mock()
    - beforeEach cleanup with vi.clearAllMocks()
    - Structured assertions with expect()
  gotcha:
    - Use vi.useFakeTimers() for time-related tests
    - Mock all external dependencies (fs, crypto, etc.)

- file: tests/unit/core/task-retry-manager.test.ts
  why: Reference for testing state management classes
  pattern:
    - Mock SessionManager for integration
    - Test error handling comprehensively
    - Use factory functions for test data

# Related Work
- docfile: plan/003_b3d3efdaf0ed/P3M2T1S1/PRP.md
  why: Retry strategy design - similar state management approach
  section: Implementation Blueprint, Data Models and Structure

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/PRP.md
  why: TaskRetryManager implementation - reference for similar class structure
  section: Implementation Tasks, Implementation Patterns
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── agents/
│   │   ├── prp-executor.ts        # PRIMARY INTEGRATION POINT (lines 238-322)
│   │   ├── prp-runtime.ts         # SECONDARY INTEGRATION (executeSubtask)
│   │   ├── agent-factory.ts       # Agent creation patterns
│   │   └── ...
│   ├── cli/
│   │   └── index.ts               # CLI option patterns
│   ├── core/
│   │   ├── session-manager.ts     # State management patterns (batching, atomic writes)
│   │   ├── session-utils.ts       # atomicWrite() function (lines 99-180) - CRITICAL
│   │   ├── task-retry-manager.ts  # Reference for similar class structure
│   │   ├── models.ts              # Type definitions (ValidationGateResult, ExecutionResult)
│   │   └── ...
│   ├── utils/
│   │   ├── logger.ts              # Structured logging
│   │   ├── errors.ts              # Error hierarchy
│   │   └── ...
│   └── ...
├── tests/
│   └── unit/
│       ├── core/
│       │   ├── session-manager.test.ts    # Test patterns for core classes
│       │   └── ...
│       └── ...
└── plan/
    └── 003_b3d3efdaf0ed/
        └── P3M2T2S1/
            ├── PRP.md             # This file
            └── research/
                └── codebase-analysis-summary.md
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── core/
│   │   ├── checkpoint-manager.ts  # NEW: CheckpointManager class
│   │   │   # Responsibilities:
│   │   │   # - Save checkpoints at specific execution points
│   │   │   # - Restore checkpoints to resume execution
│   │   │   # - List available checkpoints for a task
│   │   │   # - Cleanup old checkpoints (retention policy)
│   │   │   # - Validate checkpoint data with Zod
│   │   │   └ - Use atomic writes for all checkpoint operations
│   │   └── ...
│   └── ...
├── tests/
│   └── unit/
│       └── core/
│           └── checkpoint-manager.test.ts  # NEW: Unit tests
│           # Responsibilities:
│           # - Test checkpoint creation and persistence
│           # - Test checkpoint restoration
│           # - Test checkpoint listing
│           # - Test checkpoint cleanup
│           # - Test Zod validation
│           # - Test error handling
│           # - Test atomic write behavior
│           └ - Test concurrent checkpoint operations
└── ...
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use atomic write pattern for all checkpoint operations
// File: src/core/session-utils.ts, atomicWrite() function (lines 99-180)
// Checkpoints MUST use atomic writes to prevent corruption on crash
// Pattern: Write to temp file → rename to target (atomic on POSIX)

// CRITICAL: SessionManager uses batch writes
// File: src/core/session-manager.ts, flushUpdates() (lines 670-720)
// CheckpointManager should follow similar pattern for consistency
// Must call flushUpdates() to persist changes immediately

// GOTCHA: Validation gates run sequentially, not in parallel
// File: src/agents/prp-executor.ts, #runValidationGates() (lines 335-396)
// Checkpoint after each gate completes, not during gate execution
// Stop sequential execution on first failure

// CRITICAL: PRPExecutor fix-and-retry is for validation failures only
// File: src/agents/prp-executor.ts, #fixAndRetry() (lines 411-458)
// Does NOT handle interruption during agent execution
// Checkpoint mechanism handles this gap

// GOTCHA: Coder Agent execution is the long-running operation
// File: src/agents/prp-executor.ts, execute() method (lines 250-256)
// retryAgentPrompt() wraps agent call but doesn't handle interruption
// Checkpoint before and after this call

// CRITICAL: Artifacts stored in {sessionPath}/artifacts/{taskId}/
// Follow this pattern for checkpoint storage
// Checkpoint file: {sessionPath}/artifacts/{taskId}/checkpoints.json

// GOTCHA: Use Zod for runtime validation
// File: src/core/models.ts, existing schema validation patterns
// Define CheckpointSchema and validate all checkpoint data

// CRITICAL: Checkpoint ID format
// Use format: {taskId}_{timestamp}_{stage}
// Example: P1.M1.T1.S1_1706102400000_pre-execution

// GOTCHA: Existing test patterns use vitest
// File: tests/unit/core/session-manager.test.ts
// Use vi.mock() for module mocking
// Use vi.useFakeTimers() for time-related tests

// CRITICAL: Atomic rename is only guaranteed on POSIX
// Windows may have different behavior
// This is an acceptable limitation (document it)

// GOTCHA: Checkpoints are task-specific, not global
// Each task/subtask has its own checkpoint file
// Don't create a global checkpoint registry

// CRITICAL: Checkpoint restoration must be idempotent
// Restoring the same checkpoint multiple times should be safe
// Validate checkpoint data before applying to state
```

---

## Implementation Blueprint

### Data Models and Structure

**1. Checkpoint Data Interface**

```typescript
// File: src/core/checkpoint-manager.ts

/**
 * Checkpoint execution state
 *
 * Captures the state of PRP execution at a specific point in time.
 * This allows resumption from interruption.
 */
interface CheckpointExecutionState {
  /** PRP file path being executed */
  prpPath: string;

  /** Current execution stage */
  stage: 'pre-execution' | 'coder-response' | 'validation-gate-1' | 'validation-gate-2' | 'validation-gate-3' | 'validation-gate-4' | 'complete' | 'failed';

  /** Coder Agent response (if stage is post-coder) */
  coderResponse?: string;

  /** Parsed coder result (if available) */
  coderResult?: {
    result: 'success' | 'error' | 'issue';
    message: string;
  };

  /** Validation results completed so far */
  validationResults: ValidationGateResult[];

  /** Current fix attempt number (if in fix-and-retry) */
  fixAttempt?: number;

  /** Timestamp when this state was captured */
  timestamp: Date;
}

/**
 * Checkpoint data structure
 *
 * Complete checkpoint information including metadata and execution state.
 */
interface CheckpointData {
  /** Unique checkpoint identifier */
  id: string;

  /** Task/subtask ID this checkpoint is for */
  taskId: string;

  /** Human-readable checkpoint label */
  label: string;

  /** Checkpoint execution state */
  state: CheckpointExecutionState;

  /** Timestamp when checkpoint was created */
  createdAt: Date;

  /** Error context (if checkpoint due to error) */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Checkpoint file structure
 *
 * Schema for the checkpoints.json file stored in artifacts/{taskId}/
 */
interface CheckpointFile {
  /** Version of checkpoint format (for migration) */
  version: '1.0';

  /** All checkpoints for this task */
  checkpoints: CheckpointData[];

  /** Last modified timestamp */
  lastModified: Date;
}
```

**2. Zod Validation Schemas**

```typescript
// File: src/core/checkpoint-manager.ts

import { z } from 'zod';

/**
 * Zod schema for checkpoint execution state validation
 */
const CheckpointExecutionStateSchema = z.object({
  prpPath: z.string(),
  stage: z.enum([
    'pre-execution',
    'coder-response',
    'validation-gate-1',
    'validation-gate-2',
    'validation-gate-3',
    'validation-gate-4',
    'complete',
    'failed',
  ]),
  coderResponse: z.string().optional(),
  coderResult: z.object({
    result: z.enum(['success', 'error', 'issue']),
    message: z.string(),
  }).optional(),
  validationResults: z.array(z.object({
    level: z.number().int().min(1).max(4),
    description: z.string(),
    success: z.boolean(),
    command: z.string().nullable(),
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number().nullable(),
    skipped: z.boolean(),
  })),
  fixAttempt: z.number().int().min(0).optional(),
  timestamp: z.date(),
});

/**
 * Zod schema for checkpoint data validation
 */
const CheckpointDataSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  label: z.string(),
  state: CheckpointExecutionStateSchema,
  createdAt: z.date(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    stack: z.string().optional(),
  }).optional(),
});

/**
 * Zod schema for checkpoint file validation
 */
const CheckpointFileSchema = z.object({
  version: z.literal('1.0'),
  checkpoints: z.array(CheckpointDataSchema),
  lastModified: z.date(),
});
```

**3. Configuration Interface**

```typescript
// File: src/core/checkpoint-manager.ts

/**
 * Checkpoint manager configuration
 */
interface CheckpointConfig {
  /** Maximum number of checkpoints to retain per task (default: 5) */
  maxCheckpoints: number;

  /** Enable/disable checkpoint creation (default: true) */
  enabled: boolean;

  /** Automatically cleanup old checkpoints (default: true) */
  autoCleanup: boolean;
}

const DEFAULT_CHECKPOINT_CONFIG: CheckpointConfig = {
  maxCheckpoints: 5,
  enabled: true,
  autoCleanup: true,
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/core/checkpoint-manager.ts - CheckpointManager Class
  IMPLEMENT: CheckpointManager class with checkpoint operations
  DEPENDENCIES: None (first task)
  METHODS:
    - constructor(sessionPath: string, config?: Partial<CheckpointConfig>)
    - async saveCheckpoint(taskId: string, label: string, state: CheckpointExecutionState, error?: Error): Promise<string>
    - async restoreCheckpoint(checkpointId: string): Promise<CheckpointData>
    - async getLatestCheckpoint(taskId: string): Promise<CheckpointData | null>
    - async listCheckpoints(taskId: string): Promise<CheckpointData[]>
    - async cleanup(taskId: string, retain?: number): Promise<void>
    - async deleteCheckpoint(checkpointId: string): Promise<void>
    - async hasCheckpoint(taskId: string): Promise<boolean>
  IMPORTS:
    - atomicWrite from '../core/session-utils.js'
    - getLogger from '../utils/logger.js'
    - z for schema validation
  NAMING: PascalCase for class, camelCase for methods
  PLACEMENT: src/core/checkpoint-manager.ts

Task 2: MODIFY src/agents/prp-executor.ts - Integrate CheckpointManager
  IMPLEMENT: Add checkpoint creation at key execution points
  DEPENDENCIES: Task 1 (CheckpointManager must exist)
  MODIFICATIONS:
    - Add #checkpointManager private property
    - Add CheckpointManager to constructor (create from sessionPath)
    - Add checkpoints at: pre-execution, post-coder, post-validation-gate
    - Add error checkpoint on catch
  INTEGRATION POINTS:
    - Line ~250: Before Coder Agent execution (pre-execution checkpoint)
    - Line ~258: After parsing Coder result (coder-response checkpoint)
    - Line ~375: After each validation gate (validation-gate-N checkpoint)
    - Line ~314: In catch block (error checkpoint)
  PRESERVE: All existing behavior, just add checkpoint saves
  PLACEMENT: src/agents/prp-executor.ts

Task 3: ADD helper methods to CheckpointManager
  IMPLEMENT: Utility methods for checkpoint management
  DEPENDENCIES: Task 1 (CheckpointManager base class exists)
  METHODS:
    - generateCheckpointId(taskId: string, stage: string): string
    - getCheckpointPath(taskId: string): string
    - loadCheckpointFile(taskId: string): Promise<CheckpointFile>
    - saveCheckpointFile(taskId: string, data: CheckpointFile): Promise<void>
  NAMING: Private methods (prefixed with #)
  PLACEMENT: src/core/checkpoint-manager.ts

Task 4: CREATE tests/unit/core/checkpoint-manager.test.ts - Unit Tests
  IMPLEMENT: Comprehensive unit tests using vitest
  DEPENDENCIES: Task 1 (CheckpointManager exists)
  TEST CASES:
    - should create checkpoint with valid data
    - should save checkpoint to correct file path
    - should use atomic write pattern
    - should validate checkpoint data with Zod
    - should restore checkpoint by ID
    - should get latest checkpoint for task
    - should list all checkpoints for task
    - should cleanup old checkpoints (respect maxCheckpoints)
    - should delete specific checkpoint
    - should check if checkpoint exists
    - should handle invalid checkpoint data (Zod validation)
    - should handle file not found errors
    - should generate unique checkpoint IDs
  MOCKING:
    - vi.mock('node:fs/promises') for file operations
    - Mock atomicWrite from session-utils.ts
    - Mock logger calls
  FOLLOW pattern: tests/unit/core/session-manager.test.ts
  PLACEMENT: tests/unit/core/checkpoint-manager.test.ts

Task 5: INTEGRATION TEST - PRPExecutor with Checkpoints (Optional)
  IMPLEMENT: Integration test for checkpoint flow
  DEPENDENCIES: Task 2 (PRPExecutor integration complete)
  TEST CASES:
    - Full execution with checkpoints at all stages
    - Interruption simulation and resume
    - Error checkpoint creation
  PLACEMENT: tests/integration/checkpoint-integration.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ================================================================
// PATTERN 1: CheckpointManager Class Structure
// ================================================================
// File: src/core/checkpoint-manager.ts

import { atomicWrite } from './session-utils.js';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';
import type { ValidationGateResult } from './models.js';

// Zod Schemas (defined above)
const CheckpointExecutionStateSchema = z.object({ /* ... */ });
const CheckpointDataSchema = z.object({ /* ... */ });
const CheckpointFileSchema = z.object({ /* ... */ });

/**
 * Checkpoint Manager for long-running task state persistence
 *
 * Manages checkpoint creation, restoration, and cleanup for PRP execution.
 * Uses atomic writes to ensure checkpoint data integrity.
 */
export class CheckpointManager {
  readonly #logger: Logger;
  readonly sessionPath: string;
  readonly #config: CheckpointConfig;

  constructor(sessionPath: string, config: Partial<CheckpointConfig> = {}) {
    this.#logger = getLogger('CheckpointManager');
    this.sessionPath = sessionPath;
    this.#config = { ...DEFAULT_CHECKPOINT_CONFIG, ...config };
  }

  /**
   * Save a checkpoint at the current execution state
   *
   * @param taskId - Task/subtask ID
   * @param label - Human-readable checkpoint label
   * @param state - Current execution state
   * @param error - Optional error context
   * @returns Checkpoint ID
   */
  async saveCheckpoint(
    taskId: string,
    label: string,
    state: CheckpointExecutionState,
    error?: Error
  ): Promise<string> {
    if (!this.#config.enabled) {
      this.#logger.debug('Checkpoint creation disabled');
      return '';
    }

    const checkpointId = this.#generateCheckpointId(taskId, state.stage);
    const timestamp = new Date();

    const checkpointData: CheckpointData = {
      id: checkpointId,
      taskId,
      label,
      state,
      createdAt: timestamp,
      error: error ? {
        message: error.message,
        code: (error as { code?: string }).code,
        stack: error.stack,
      } : undefined,
    };

    // Validate checkpoint data
    const validated = CheckpointDataSchema.parse(checkpointData);

    // Load existing checkpoint file or create new
    const checkpointPath = this.#getCheckpointPath(taskId);
    let checkpointFile: CheckpointFile;

    if (existsSync(checkpointPath)) {
      const content = await readFile(checkpointPath, 'utf-8');
      checkpointFile = CheckpointFileSchema.parse(JSON.parse(content));
    } else {
      // Ensure directory exists
      const dir = dirname(checkpointPath);
      await mkdir(dir, { recursive: true });
      checkpointFile = {
        version: '1.0',
        checkpoints: [],
        lastModified: timestamp,
      };
    }

    // Add new checkpoint
    checkpointFile.checkpoints.push(validated);
    checkpointFile.lastModified = timestamp;

    // Auto-cleanup if enabled
    if (this.#config.autoCleanup) {
      while (checkpointFile.checkpoints.length > this.#config.maxCheckpoints) {
        checkpointFile.checkpoints.shift();
      }
    }

    // Save using atomic write
    await atomicWrite(checkpointPath, JSON.stringify(checkpointFile, null, 2));

    this.#logger.info({
      taskId,
      checkpointId,
      stage: state.stage,
      label,
    }, `Checkpoint saved: ${label}`);

    return checkpointId;
  }

  /**
   * Restore a checkpoint by ID
   *
   * @param checkpointId - Checkpoint ID to restore
   * @returns Checkpoint data
   * @throws Error if checkpoint not found
   */
  async restoreCheckpoint(checkpointId: string): Promise<CheckpointData> {
    // Extract taskId from checkpointId
    const match = checkpointId.match(/^([A-Z0-9.]+)_/);
    if (!match) {
      throw new Error(`Invalid checkpoint ID: ${checkpointId}`);
    }
    const taskId = match[1];

    const checkpointFile = await this.#loadCheckpointFile(taskId);
    const checkpoint = checkpointFile.checkpoints.find(c => c.id === checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    this.#logger.info({
      checkpointId,
      taskId,
      stage: checkpoint.state.stage,
    }, `Checkpoint restored: ${checkpoint.label}`);

    return checkpoint;
  }

  /**
   * Get the latest checkpoint for a task
   *
   * @param taskId - Task ID
   * @returns Latest checkpoint or null if none exist
   */
  async getLatestCheckpoint(taskId: string): Promise<CheckpointData | null> {
    try {
      const checkpointFile = await this.#loadCheckpointFile(taskId);
      if (checkpointFile.checkpoints.length === 0) {
        return null;
      }
      return checkpointFile.checkpoints[checkpointFile.checkpoints.length - 1];
    } catch {
      return null;
    }
  }

  /**
   * List all checkpoints for a task
   *
   * @param taskId - Task ID
   * @returns Array of checkpoints sorted by creation time
   */
  async listCheckpoints(taskId: string): Promise<CheckpointData[]> {
    try {
      const checkpointFile = await this.#loadCheckpointFile(taskId);
      return [...checkpointFile.checkpoints].sort((a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * Cleanup old checkpoints for a task
   *
   * @param taskId - Task ID
   * @param retain - Number of checkpoints to retain (default: config.maxCheckpoints)
   */
  async cleanup(taskId: string, retain?: number): Promise<void> {
    const retainCount = retain ?? this.#config.maxCheckpoints;
    const checkpointPath = this.#getCheckpointPath(taskId);

    if (!existsSync(checkpointPath)) {
      return;
    }

    const checkpointFile = await this.#loadCheckpointFile(taskId);

    if (checkpointFile.checkpoints.length <= retainCount) {
      return;
    }

    // Remove oldest checkpoints
    checkpointFile.checkpoints = checkpointFile.checkpoints.slice(-retainCount);
    checkpointFile.lastModified = new Date();

    await atomicWrite(checkpointPath, JSON.stringify(checkpointFile, null, 2));

    this.#logger.info({
      taskId,
      removedCount: checkpointFile.checkpoints.length - retainCount,
      retained: retainCount,
    }, 'Checkpoints cleaned up');
  }

  /**
   * Delete a specific checkpoint
   *
   * @param checkpointId - Checkpoint ID to delete
   */
  async deleteCheckpoint(checkpointId: string): Promise<void> {
    const match = checkpointId.match(/^([A-Z0-9.]+)_/);
    if (!match) {
      throw new Error(`Invalid checkpoint ID: ${checkpointId}`);
    }
    const taskId = match[1];

    const checkpointFile = await this.#loadCheckpointFile(taskId);
    const index = checkpointFile.checkpoints.findIndex(c => c.id === checkpointId);

    if (index === -1) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    checkpointFile.checkpoints.splice(index, 1);
    checkpointFile.lastModified = new Date();

    const checkpointPath = this.#getCheckpointPath(taskId);
    await atomicWrite(checkpointPath, JSON.stringify(checkpointFile, null, 2));

    this.#logger.info({ checkpointId }, 'Checkpoint deleted');
  }

  /**
   * Check if a task has any checkpoints
   *
   * @param taskId - Task ID
   * @returns True if checkpoints exist
   */
  async hasCheckpoint(taskId: string): Promise<boolean> {
    const latest = await this.getLatestCheckpoint(taskId);
    return latest !== null;
  }

  /**
   * Generate a unique checkpoint ID
   *
   * @param taskId - Task ID
   * @param stage - Execution stage
   * @returns Checkpoint ID
   */
  #generateCheckpointId(taskId: string, stage: string): string {
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    return `${taskId}_${timestamp}_${stage}_${random}`;
  }

  /**
   * Get the checkpoint file path for a task
   *
   * @param taskId - Task ID
   * @returns Absolute path to checkpoints.json
   */
  #getCheckpointPath(taskId: string): string {
    return resolve(this.sessionPath, 'artifacts', taskId, 'checkpoints.json');
  }

  /**
   * Load and validate checkpoint file
   *
   * @param taskId - Task ID
   * @returns Validated checkpoint file
   * @throws Error if file not found or invalid
   */
  async #loadCheckpointFile(taskId: string): Promise<CheckpointFile> {
    const checkpointPath = this.#getCheckpointPath(taskId);
    const content = await readFile(checkpointPath, 'utf-8');
    return CheckpointFileSchema.parse(JSON.parse(content));
  }
}

const DEFAULT_CHECKPOINT_CONFIG: CheckpointConfig = {
  maxCheckpoints: 5,
  enabled: true,
  autoCleanup: true,
};

// Export types
export type { CheckpointData, CheckpointExecutionState, CheckpointFile, CheckpointConfig };
```

### Integration Points

```yaml
PRP EXECUTOR INTEGRATION:
  - modify: src/agents/prp-executor.ts
  - add: #checkpointManager private property
  - modify: constructor to create CheckpointManager
  - add: CheckpointManager creation from sessionPath
  - add: Checkpoint saves at key points
  INTEGRATION POINTS:
    - Line ~250: Before Coder Agent (pre-execution)
    - Line ~258: After parseCoderResult (coder-response)
    - Line ~375: After each validation gate (validation-gate-N)
    - Line ~314: In catch block (error checkpoint)

ARTIFACT STORAGE:
  - location: {sessionPath}/artifacts/{taskId}/checkpoints.json
  - pattern: Follow existing artifact directory structure
  - atomic: Use atomicWrite from session-utils.ts

ZOD VALIDATION:
  - use: zod from 'zod'
  - schemas: CheckpointDataSchema, CheckpointExecutionStateSchema, CheckpointFileSchema
  - validate: Before saving and after loading checkpoints

LOGGING:
  - use: getLogger('CheckpointManager')
  - levels: info (checkpoint saved/restored), debug (operations), warn (validation errors)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Type checking with TypeScript
npx tsc --noEmit src/core/checkpoint-manager.ts
npx tsc --noEmit src/agents/prp-executor.ts

# Linting with ESLint (if configured)
npx eslint src/core/checkpoint-manager.ts --fix
npx eslint tests/unit/core/checkpoint-manager.test.ts --fix

# Format with Prettier (if configured)
npx prettier --write src/core/checkpoint-manager.ts

# Expected: Zero type errors, zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test CheckpointManager in isolation
vitest run tests/unit/core/checkpoint-manager.test.ts

# Test with coverage
vitest run tests/unit/core/checkpoint-manager.test.ts --coverage

# Run all unit tests to ensure no regressions
vitest run tests/unit/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test checkpoint creation during PRP execution
cat > test_checkpoint_integration.ts << 'EOF'
import { CheckpointManager } from './src/core/checkpoint-manager.js';
import type { CheckpointExecutionState } from './src/core/checkpoint-manager.js';

const manager = new CheckpointManager('/tmp/test-session');

const state: CheckpointExecutionState = {
  prpPath: '/path/to/prp.md',
  stage: 'pre-execution',
  validationResults: [],
  timestamp: new Date(),
};

// Test save
const id = await manager.saveCheckpoint('P1.M1.T1.S1', 'Test checkpoint', state);
console.log('Saved checkpoint:', id);

// Test list
const checkpoints = await manager.listCheckpoints('P1.M1.T1.S1');
console.log('Checkpoints:', checkpoints.length);

// Test restore
const restored = await manager.restoreCheckpoint(id);
console.log('Restored:', restored.label);

// Test hasCheckpoint
const hasCheck = await manager.hasCheckpoint('P1.M1.T1.S1');
console.log('Has checkpoint:', hasCheck);
EOF

node --loader tsx test_checkpoint_integration.ts

# Expected: All operations complete successfully
rm test_checkpoint_integration.ts
```

### Level 4: Manual Validation

```bash
# Test checkpoint creation during actual PRP execution
# 1. Run pipeline with a simple task
npm run dev -- --prd test-prd.md

# 2. Check for checkpoint files
find plan/*/artifacts/*/checkpoints.json

# 3. Inspect checkpoint content
cat plan/*/artifacts/P1.M1.T1.S1/checkpoints.json | jq .

# Expected: Valid JSON with checkpoint data
```

---

## Final Validation Checklist

### Technical Validation

- [ ] CheckpointManager class exists at `src/core/checkpoint-manager.ts`
- [ ] All required methods implemented
- [ ] PRPExecutor integration complete with checkpoints at key points
- [ ] All 4 validation levels completed successfully
- [ ] All unit tests pass: `vitest run tests/unit/core/checkpoint-manager.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Zod schemas validate checkpoint data
- [ ] Atomic write pattern used for all checkpoint saves

### Feature Validation

- [ ] Checkpoints saved to correct path: `{sessionPath}/artifacts/{taskId}/checkpoints.json`
- [ ] Checkpoints created at: pre-execution, post-coder, post-validation-gate
- [ ] Error checkpoints created on exceptions
- [ ] Checkpoint restoration works correctly
- [ ] List checkpoints returns all checkpoints for task
- [ ] Get latest checkpoint returns most recent
- [ ] Cleanup removes old checkpoints respecting maxCheckpoints
- [ ] hasCheckpoint correctly detects checkpoint existence

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Reuses atomicWrite from session-utils.ts
- [ ] File placement matches desired codebase tree structure
- [ ] JSDoc comments added for public methods
- [ ] Error handling is comprehensive
- [ ] Anti-patterns avoided (see below)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Logs are informative but not verbose
- [ ] Configuration is well-documented with default values

---

## Anti-Patterns to Avoid

- **Don't** create new atomic write implementation - reuse from session-utils.ts
- **Don't** skip Zod validation - always validate checkpoint data
- **Don't** use synchronous file operations - always use async/await
- **Don't** create global checkpoint registry - checkpoints are task-specific
- **Don't** forget to use atomic writes - prevents corruption on crash
- **Don't** create checkpoints for every small step - only at key execution points
- **Don't** make checkpoint restoration mutable - restore should return new state
- **Don't** ignore cleanup - old checkpoints should be removed
- **Don't** use hardcoded paths - always derive from sessionPath
- **Don't** create checkpoints when disabled - check config.enabled first
- **Don't** skip validation on restore - malicious data could be injected
- **Don't** use checkpoint ID as the only identifier - include taskId for safety

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:
- Complete analysis of existing patterns (SessionManager, PRPExecutor, TaskRetryManager)
- Atomic write pattern already available in session-utils.ts
- Clear integration points identified with specific line numbers
- Test patterns well-established in the codebase
- Zod validation provides runtime safety
- Comprehensive research on checkpoint mechanisms

**Risk Areas**:
- Integration with PRPExecutor requires careful modification of existing flow
- Checkpoint restoration logic needs to handle all execution stages
- Concurrent checkpoint operations (if parallel execution)

**Mitigation**:
- Clear task breakdown with dependency ordering
- Minimal modifications to existing PRPExecutor flow
- Checkpoint operations are independent per task
- Comprehensive unit tests for all scenarios

---

## Appendix: Checkpoint Stage Reference

| Stage | Description | When Created |
|-------|-------------|--------------|
| `pre-execution` | Before Coder Agent execution | Start of execute() method |
| `coder-response` | After Coder Agent completes | After parseCoderResult() |
| `validation-gate-1` | After Level 1 validation | After gate 1 passes |
| `validation-gate-2` | After Level 2 validation | After gate 2 passes |
| `validation-gate-3` | After Level 3 validation | After gate 3 passes |
| `validation-gate-4` | After Level 4 validation | After gate 4 passes |
| `complete` | Task completed successfully | Final checkpoint before return |
| `failed` | Task failed | In catch block |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Related Documents**:
- Codebase Analysis: `plan/003_b3d3efdaf0ed/P3M2T2S1/research/codebase-analysis-summary.md`
- Retry Strategy Design: `plan/003_b3d3efdaf0ed/docs/retry-strategy-design.md`
- TaskRetryManager PRP: `plan/003_b3d3efdaf0ed/P3M2T1S2/PRP.md`
