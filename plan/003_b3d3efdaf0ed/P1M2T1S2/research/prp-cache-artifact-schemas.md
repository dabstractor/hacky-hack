# PRP Cache Metadata and Execution Artifact Schemas Research

**Research Date**: 2026-01-20
**Work Item**: P1.M2.T1.S2 - Verify plan/ directory structure and artifacts

## 1. PRP Cache Implementation

### Cache Directory Structure
```
plan/{session_id}/
├── prps/                    # Generated PRP files
│   ├── P1M1T1S1.md         # PRP markdown file (sanitized taskId)
│   └── .cache/             # Cache metadata directory
│       └── P1M1T1S1.json   # Cache metadata file
```

### Cache Metadata Schema (`PRPCacheMetadata`)
**File**: `src/agents/prp-generator.ts` (lines 96-103)

```typescript
interface PRPCacheMetadata {
  readonly taskId: string;              // Task identifier (e.g., "P1.M2.T2.S2")
  readonly taskHash: string;            // SHA-256 hash of task inputs for change detection
  readonly createdAt: number;            // Unix timestamp when cache entry was created
  readonly accessedAt: number;            // Unix timestamp when cache entry was last accessed
  readonly version: string;              // Cache version (currently "1.0")
  readonly prp: PRPDocument;            // Complete PRPDocument for quick retrieval
}
```

### Cache TTL Configuration
**File**: `src/agents/prp-generator.ts` (lines 150-151, 263-272)

```typescript
// Cache TTL configuration
readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours

// Cache age checking
async #isCacheRecent(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < this.CACHE_TTL_MS;
  } catch {
    return false;  // File doesn't exist or can't be read
  }
}
```

### Cache Path Generation
**File**: `src/agents/prp-generator.ts` (lines 191-194, 206-209)

```typescript
getCachePath(taskId: string): string {
  const sanitized = taskId.replace(/\./g, '_');
  return join(this.sessionPath, 'prps', `${sanitized}.md`);
}

getCacheMetadataPath(taskId: string): string {
  const sanitized = taskId.replace(/\./g, '_');
  return join(this.sessionPath, 'prps', '.cache', `${sanitized}.json`);
}
```

### Task Hash Computation
**File**: `src/agents/prp-generator.ts` (lines 225-250)

```typescript
#computeTaskHash(task: Task | Subtask, _backlog: Backlog): string {
  let input: Record<string, unknown>;

  if (task.type === 'Task') {
    input = {
      id: task.id,
      title: task.title,
      description: (task as Task).description,
    };
  } else {
    input = {
      id: task.id,
      title: task.title,
      context_scope: (task as Subtask).context_scope,
    };
  }

  // Deterministic JSON serialization (no whitespace)
  const jsonString = JSON.stringify(input, null, 0);

  // SHA-256 hash for collision resistance
  return createHash('sha256').update(jsonString).digest('hex');
}
```

## 2. Artifact Schema Definitions

### Artifact Directory Structure
```
plan/{session_id}/artifacts/{subtask_id}/
├── validation-results.json  # Validation execution results
├── execution-summary.md     # Human-readable summary
└── artifacts-list.json      # List of created artifacts
```

### validation-results.json Schema
**File**: `src/agents/prp-executor.ts` (lines 38-55)

```typescript
interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;               // Validation level (1-4)
  readonly description: string;                 // Description of what this level validates
  readonly success: boolean;                    // Whether the validation passed
  readonly command: string | null;              // Command that was executed (null if skipped)
  readonly stdout: string;                     // Standard output from command
  readonly stderr: string;                     // Standard error from command
  readonly exitCode: number | null;             // Exit code from process (null if skipped)
  readonly skipped: boolean;                   // True if this gate was skipped (manual or no command)
}
```

**Example JSON structure**:
```json
[
  {
    "level": 1,
    "description": "Syntax & Style validation",
    "success": true,
    "command": "ruff check src/ --fix && mypy src/",
    "stdout": "All checks passed",
    "stderr": "",
    "exitCode": 0,
    "skipped": false
  },
  {
    "level": 4,
    "description": "Manual end-to-end testing",
    "success": true,
    "command": null,
    "stdout": "",
    "stderr": "",
    "exitCode": null,
    "skipped": true
  }
]
```

### execution-summary.md Format
**File**: `src/agents/prp-runtime.ts` (lines 294-323)

```markdown
# Execution Summary

**Status**: Success|Failed
**Fix Attempts**: 0-2
**Error**: [error message if failed]

## Validation Results

### Level 1: Syntax & Style validation

- Status: PASSED|FAILED
- Command: [command executed]
- Skipped: Yes|No
[if failed]
- Exit Code: [exit code]
- Error: [stderr content]
[endif]

## Artifacts

- [artifact path 1]
- [artifact path 2]
- [artifact path 3]
```

### artifacts-list.json Format
**Simple string array of artifact file paths** (from `ExecutionResult.artifacts`):

```json
[
  "/path/to/created/file1.ts",
  "/path/to/created/file2.js",
  "/path/to/created/file3.md"
]
```

## 3. Artifact Collection Logic

### Artifact Directory Creation
**File**: `src/agents/prp-runtime.ts` (lines 172-175)

```typescript
const artifactsDir = join(this.#sessionPath, 'artifacts', subtask.id);
await mkdir(artifactsDir, { recursive: true });
```

### Artifact Writing
**File**: `src/agents/prp-runtime.ts` (lines 245-285)

```typescript
async #writeArtifacts(artifactsDir: string, result: ExecutionResult): Promise<void> {
  // Write validation results as JSON
  const validationResultsPath = join(artifactsDir, 'validation-results.json');
  await writeFile(validationResultsPath, JSON.stringify(result.validationResults, null, 2), { mode: 0o644 });

  // Write execution summary as markdown
  const summaryPath = join(artifactsDir, 'execution-summary.md');
  const summary = this.#formatExecutionSummary(result);
  await writeFile(summaryPath, summary, { mode: 0o644 });

  // Write artifacts list as JSON
  const artifactsListPath = join(artifactsDir, 'artifacts-list.json');
  await writeFile(artifactsListPath, JSON.stringify(result.artifacts, null, 2), { mode: 0o644 });
}
```

## 4. Key Integration Points for Testing

### 1. Cache Verification Test Points
- Cache hit timing verification (<10ms for cached responses)
- SHA-256 cache key behavior validation
- Cache configuration verification (enableCache: true for all agents)
- Cache hit rate logging verification

### 2. PRP Runtime Test Points
- Artifact directory creation with correct paths
- Artifact file writing with correct content
- Execution summary formatting for both success and failure cases
- Error handling during artifact writing (should not fail execution)

### 3. Integration Test Points
- Tests the complete flow with real file system operations while mocking agent calls
- Verify cache metadata structure is correct
- Verify artifact files are created with correct permissions

## 5. File Locations Summary

| Component | File Path | Key Lines |
|-----------|-----------|-----------|
| PRP Cache Metadata Interface | `/src/agents/prp-generator.ts` | 96-103 |
| Cache TTL Logic | `/src/agents/prp-generator.ts` | 150-151, 263-272 |
| Cache Path Methods | `/src/agents/prp-generator.ts` | 191-194, 206-209 |
| Task Hash Computation | `/src/agents/prp-generator.ts` | 225-250 |
| Validation Result Interface | `/src/agents/prp-executor.ts` | 38-55 |
| Execution Result Interface | `/src/agents/prp-executor.ts` | 65-76 |
| Artifact Writing Logic | `/src/agents/prp-runtime.ts` | 245-285 |
| Artifact Formatting | `/src/agents/prp-runtime.ts` | 294-323 |
| PRPDocument Schema | `/src/core/models.ts` | 1295-1305 |

## 6. Key Constants and Configuration

| Constant | Value | Location |
|----------|-------|----------|
| CACHE_TTL_MS | 24 * 60 * 60 * 1000 (24 hours) | `/src/agents/prp-generator.ts:151` |
| File Permissions | 0o644 (read/write for owner, read for others) | Multiple locations |
| Cache Directory | `.cache` (hidden directory) | `/src/agents/prp-generator.ts:208` |
