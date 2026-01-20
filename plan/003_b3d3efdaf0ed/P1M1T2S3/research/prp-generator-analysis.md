# PRPGenerator Implementation Analysis

## Overview
**File**: `src/agents/prp-generator.ts`
**Purpose**: Generates PRP (Product Requirement Prompt) documents for tasks/subtasks

## Complete API

### Constructor
```typescript
constructor(sessionManager: SessionManager, noCache: boolean = false)
```
- Throws Error if no active session
- `noCache` flag bypasses cache for testing

### Public Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `generate` | `async generate(task: Task \| Subtask, backlog: Backlog): Promise<PRPDocument>` | Generate PRP for task |
| `getCachePath` | `getCachePath(taskId: string): string` | Get file path for cached PRP |
| `getCacheMetadataPath` | `getCacheMetadataPath(taskId: string): string` | Get cache metadata path |

## PRP Generation Flow

### Input/Output

**Input**:
- `task`: Task or Subtask from backlog
- `backlog`: Full task hierarchy for context
- Session state from SessionManager

**Output** (PRPDocument):
```typescript
{
  taskId: string;                    // e.g., "P1.M2.T2.S2"
  objective: string;                  // Feature goal
  context: string;                    // Full markdown context
  implementationSteps: string[];      // Ordered implementation steps
  validationGates: ValidationGate[];  // 4 validation levels
  successCriteria: SuccessCriterion[]; // Checkboxes
  references: string[];               // External/internal references
}
```

### Processing Steps (Lines 433-456)

1. **Cache Check** (Lines 407-416): Verify hash and TTL
2. **Prompt Building** (Line 434): Construct prompt with task context
3. **Agent Execution** (Lines 438-441): Researcher Agent with retry
4. **Schema Validation** (Line 444): Validate PRPDocument structure
5. **File Persistence** (Line 447): Write PRP markdown
6. **Cache Metadata Save** (Lines 450-453): Store metadata

## Async Behavior & Timing

### Retry Configuration
- **Max retries**: 3 attempts
- **Base delay**: 1000ms (1 second)
- **Max delay**: 30000ms (30 seconds)
- **Backoff factor**: 2 (exponential)
- **Jitter**: 10% variance (prevents thundering herd)

### Cache TTL
- **Duration**: 24 hours (86400000 ms)
- **Location**: `{sessionPath}/prps/.cache/`

### Hash Computation (Lines 225-250)
Hash includes only fields affecting PRP output:
- Task title
- Task description/context
- Excludes: status, dependencies, story_points

## Error Handling

### Custom Error Types

1. **PRPGenerationError** (Lines 34-56)
   - Thrown when agent fails after all retries
   - Includes: taskId, attempt number, original error

2. **PRPFileError** (Lines 65-87)
   - Thrown when PRP file write fails
   - Includes: taskId, filePath, original error

### Error Recovery
- Transient errors: Retry with exponential backoff
- Permanent errors (validation): Fail immediately
- File errors: Preserve original error context

## Dependencies

```typescript
// External
import type { Agent } from 'groundswell';      // LLM agent interface
import { createHash } from 'node:crypto';       // SHA-256 hashing
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';  // File ops
import { join, dirname } from 'node:path';     // Path manipulation

// Internal
import { createResearcherAgent } from './agent-factory.js';
import { createPRPBlueprintPrompt } from './prompts/prp-blueprint-prompt.js';
import { retryAgentPrompt } from '../utils/retry.js';
import { PRPDocumentSchema } from '../core/models.js';
import type { SessionManager } from '../core/session-manager.js';
```

## Cache Structure

```
session/
├── prps/
│   ├── {taskId}.md                    # PRP markdown file
│   └── .cache/
│       └── {taskId}.json             # Cache metadata
```

### Cache Metadata Interface
```typescript
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;           // SHA-256 of task inputs
  readonly createdAt: number;          // Timestamp
  readonly accessedAt: number;          // Updated on access
  readonly version: string;            // Schema version
  readonly prp: PRPDocument;           // Full PRP data
}
```

## Mocking for Testing

### Mockable Components

1. **SessionManager**
   ```typescript
   mockSessionManager = {
     currentSession: {
       metadata: { id: '001_14b9dc2a33c7', hash: '14b9dc2a33c7' },
       sessionPath: '/tmp/test-session',
       prdSnapshot: '# Test PRD',
       taskRegistry: mockBacklog,
       currentItemId: null
     },
     updateItemStatus: vi.fn(),
     flushUpdates: vi.fn()
   };
   ```

2. **createResearcherAgent()**
   - Mock agent return values
   - Test different response formats
   - Simulate agent failures

3. **File System Operations**
   - `mkdir`, `writeFile`, `readFile`, `stat`
   - Test cache hit/miss scenarios
   - Test file write failures

4. **createHash()**
   - Mock predictable hash values
   - Test hash change detection

## Gotchas for Testing

1. **Cache Hash Mismatches**: Task content changes but cached file exists
2. **File Permission Issues**: PRP file write may fail
3. **Agent Response Validation**: LLM may return invalid JSON
4. **Circular Task Dependencies**: Generator assumes valid hierarchy
5. **Large Task Hierarchies**: Prompt may hit token limits
6. **Session State Changes**: Could change during async operation
7. **Concurrent PRP Generation**: Multiple generators could interfere with cache

## Integration with ResearchQueue

ResearchQueue uses PRPGenerator for:
- Background PRP generation
- Cache checking (via PRPGenerator's hash-based cache)
- Error handling (propagates errors to queue)

The queue wraps PRPGenerator calls in fire-and-forget promises, handling errors at queue level while PRPGenerator handles its own retry logic.
