# Codebase Structure Analysis for TaskRetryManager Implementation

## 1. Current Codebase Tree Structure

```
hacky-hack/
├── src/
│   ├── agents/                  # LLM agent implementations
│   │   ├── agent-factory.ts
│   │   ├── prompts/
│   │   ├── prp-executor.ts
│   │   ├── prp-generator.ts
│   │   └── prp-runtime.ts
│   ├── cli/                     # Command-line interface
│   │   ├── commands/
│   │   └── index.ts
│   ├── config/                  # Configuration and constants
│   │   ├── constants.ts
│   │   ├── environment.ts
│   │   └── types.ts
│   ├── core/                    # Core processing engine
│   │   ├── concurrent-executor.ts
│   │   ├── dependency-validator.ts
│   │   ├── models.ts
│   │   ├── prd-differ.ts
│   │   ├── research-queue.ts
│   │   ├── scope-resolver.ts
│   │   ├── session-manager.ts
│   │   ├── session-utils.ts
│   │   ├── task-orchestrator.ts
│   │   └── task-patcher.ts
│   ├── scripts/                 # Utility scripts
│   ├── tools/                   # MCP tool integrations
│   ├── utils/                   # Utility modules
│   │   ├── artifact-differ.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   ├── retry.ts
│   │   └── task-utils.ts
│   └── workflows/               # High-level workflows
│       ├── bug-hunt-workflow.ts
│       ├── delta-analysis-workflow.ts
│       ├── fix-cycle-workflow.ts
│       ├── hello-world.ts
│       ├── index.ts
│       └── prp-pipeline.ts
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   │   ├── concurrent-executor.test.ts
│   │   │   ├── session-manager.test.ts
│   │   │   ├── task-orchestrator.test.ts
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── dist/                        # Compiled output
```

## 2. Files to Modify (Integration Points)

### 2.1 Primary Integration Files

#### src/core/task-orchestrator.ts

**Reason**: Main integration point for retry functionality

- **Changes needed**:
  - Import TaskRetryManager
  - Wrap subtask execution in retry logic
  - Handle retry state and failures gracefully
  - Integrate with existing status management system
- **Key sections to modify**:
  - `executeSubtask()` method (lines 611-777)
  - Error handling in catch block (lines 751-776)
  - Status progression logic

#### src/core/session-manager.ts

**Reason**: Persist retry state across sessions

- **Changes needed**:
  - Add retry metadata to session state
  - Store retry configuration and history
  - Support for resuming interrupted retries
- **Key sections to modify**:
  - `SessionState` interface (add retry-related fields)
  - `updateItemStatus()` method (lines 768-800)
  - Session serialization/deserialization

#### src/utils/retry.ts

**Reason**: Leverage existing retry infrastructure

- **Changes needed**:
  - May need specialized retry configurations for task execution
  - Integration with error classification system
  - Support for task-specific retry strategies
- **Key sections to leverage**:
  - `isTransientError()` function (lines 323-361)
  - `retry()` function (lines 475-529)
  - Error code hierarchy

#### src/utils/errors.ts

**Reason**: Extend error classification for retry scenarios

- **Changes needed**:
  - Add new error codes for retry-specific scenarios
  - Enhance error context with retry metadata
  - Support for retryable vs non-retryable error types
- **Key sections to modify**:
  - `ErrorCodes` enum (add retry-related codes)
  - `PipelineErrorContext` interface (add retry fields)

#### src/cli/index.ts

**Reason**: Add CLI options for retry configuration

- **Changes needed**:
  - Add retry-related CLI options (--max-retries, --retry-delay, etc.)
  - Validation of retry parameters
  - Integration with existing CLI validation system
- **Key sections to modify**:
  - `CLIArgs` interface (add retry options)
  - Validation logic for retry parameters

#### src/workflows/prp-pipeline.ts

**Reason**: Integrate retry at workflow level

- **Changes needed**:
  - Pass retry configuration to TaskOrchestrator
  - Handle retry failures at workflow level
  - Support for pipeline-wide retry policies
- **Key sections to modify**:
  - `PRPPipeline` constructor (add retry parameters)
  - `executeBacklog()` method (lines 751-963)
  - Error handling and reporting

## 3. New Files to Create

### 3.1 Core Implementation Files

#### src/core/task-retry-manager.ts (NEW)

**Purpose**: Central retry management system

- **Features**:
  - Retry configuration management
  - Retry state persistence
  - Exponential backoff with jitter
  - Circuit breaker patterns
  - Integration with existing task orchestration
- **Key classes/interfaces**:
  - `TaskRetryManager` class
  - `RetryConfig` interface
  - `RetryState` interface
  - `RetryResult` interface

#### tests/unit/task-retry-manager.test.ts (NEW)

**Purpose**: Comprehensive test coverage for retry functionality

- **Test areas**:
  - Retry configuration validation
  - Exponential backoff calculations
  - Error classification and retry decisions
  - State persistence and recovery
  - Integration with TaskOrchestrator
  - Edge cases and failure scenarios
- **Test patterns**:
  - Mock external dependencies
  - Verify retry state transitions
  - Test circuit breaker behavior
  - Validate error classification

## 4. Integration Points Details

### 4.1 TaskOrchestrator Integration

```typescript
// In executeSubtask method:
async executeSubtask(subtask: Subtask): Promise<void> {
  // ... existing code ...

  try {
    // NEW: Wrap execution with retry manager
    const retryResult = await this.retryManager.executeWithRetry(
      async () => this.#prpRuntime.executeSubtask(subtask, this.#backlog),
      { taskId: subtask.id, maxAttempts: 3 }
    );

    if (retryResult.success) {
      await this.setStatus(subtask.id, 'Complete', 'Implementation completed with retries');
    } else {
      await this.setStatus(
        subtask.id,
        'Failed',
        `Execution failed after ${retryResult.attemptCount} attempts: ${retryResult.error}`
      );
    }
  } catch (error) {
    // Enhanced error handling with retry context
    // ...
  }
}
```

### 4.2 SessionManager Integration

```typescript
// Enhanced SessionState interface
interface SessionState {
  // ... existing fields ...
  retryMetadata?: {
    [taskId: string]: {
      attemptCount: number;
      lastAttempt: Date;
      retryDelay: number;
      failureReason: string;
    };
  };
  retryConfig?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
}
```

### 4.3 CLI Integration

```typescript
// Enhanced CLIArgs interface
interface CLIArgs {
  // ... existing fields ...
  maxRetries?: number; // Max retry attempts (default: 3)
  retryDelay?: number; // Base delay in ms (default: 1000)
  maxRetryDelay?: number; // Max delay cap in ms (default: 30000)
  retryBackoff?: number; // Exponential factor (default: 2)
  enableRetry?: boolean; // Enable/disable retry (default: true)
}
```

## 5. Visual Comparison

### Before Structure

```
src/
├── core/
│   ├── task-orchestrator.ts         # Direct task execution
│   └── session-manager.ts            # Session state management
└── utils/
    ├── retry.ts                      # Generic retry utilities
    └── errors.ts                     # Error classification

tests/unit/
└── core/
    └── task-orchestrator.test.ts     # Direct execution tests
```

### After Structure

```
src/
├── core/
│   ├── task-retry-manager.ts         # NEW: Central retry management
│   ├── task-orchestrator.ts         # Enhanced with retry integration
│   └── session-manager.ts            # Enhanced with retry state
└── utils/
    ├── retry.ts                      # Extended with task-specific logic
    └── errors.ts                     # Extended with retry codes

tests/unit/
├── core/
│   ├── task-retry-manager.test.ts   # NEW: Comprehensive retry tests
│   ├── task-orchestrator.test.ts     # Enhanced with retry scenarios
│   └── session-manager.test.ts       # Enhanced with retry state tests
```

## 6. Key Considerations

### 6.1 Backward Compatibility

- Existing API should remain unchanged
- Retry functionality should be opt-in via CLI flags
- Default retry behavior should be conservative

### 6.2 Performance Impact

- Retry state adds memory overhead
- Exponential backoff should prevent system overload
- Circuit breaker needed for cascading failures

### 6.3 Error Handling

- Clear distinction between transient and permanent failures
- Detailed logging of retry attempts
- Graceful degradation when retry is disabled

### 6.4 Testing Strategy

- Unit tests for retry logic in isolation
- Integration tests with TaskOrchestrator
- End-to-end tests with real failure scenarios
- Performance tests under retry conditions

## 7. Implementation Phases

### Phase 1: Core Retry Manager

1. Create TaskRetryManager with basic retry logic
2. Add configuration management
3. Implement exponential backoff with jitter
4. Create comprehensive unit tests

### Phase 2: TaskOrchestrator Integration

1. Integrate retry manager into executeSubtask
2. Add retry state tracking
3. Enhanced error handling with retry context
4. Update task-orchestrator tests

### Phase 3: Session Persistence

1. Add retry metadata to session state
2. Implement retry state serialization
3. Add recovery logic for interrupted retries
4. Update session-manager tests

### Phase 4: CLI and Workflow Integration

1. Add retry CLI options
2. Validate and document retry parameters
3. Integrate with PRPPipeline workflow
4. End-to-end testing

This analysis provides a comprehensive overview of the codebase structure and identifies all necessary changes for implementing the TaskRetryManager while maintaining backward compatibility and following existing patterns.
