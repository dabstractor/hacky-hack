# Session Directory Structure and Artifacts System Analysis

**Research Date**: 2026-01-20
**Work Item**: P1.M2.T1.S2 - Verify plan/ directory structure and artifacts

## 1. Directory Structure

### Session Directory Pattern
The plan/ directory uses a sequence-based session structure with the following pattern:

```
plan/
├── 001_14b9dc2a33c7/          # Session {sequence}_{hash}
│   ├── architecture/           # Architectural research
│   ├── prps/                   # Generated PRP documents
│   │   ├── .cache/            # PRP cache metadata
│   │   │   └── {taskId}.json  # Cache metadata per task
│   │   └── {taskId}.md        # PRP markdown files
│   ├── artifacts/              # Temporary implementation artifacts
│   │   └── {taskId}/          # Per-task artifact directories
│   ├── docs/                   # Documentation
│   ├── bugfix/                 # Bugfix sub-sessions
│   │   └── {sequence}_{hash}/ # Nested bugfix sessions
│   ├── tasks.json              # Task hierarchy state
│   └── prd_snapshot.md         # Frozen PRD snapshot
├── 002_1e734971e481/          # Next session
└── 003_b3d3efdaf0ed/          # Latest session
```

### Session Directory Naming Convention
- **Format**: `{sequence}_{hash}`
- **Sequence**: Zero-padded 3-digit number (e.g., "001", "002")
- **Hash**: First 12 characters of SHA-256 hash of PRD content
- **Example**: `001_14b9dc2a33c7`

### Subdirectories Structure
1. **`architecture/`** - Stores architectural research findings
2. **`prps/`** - Contains generated PRP (Product Requirement Prompt) documents
3. **`artifacts/`** - Temporary implementation artifacts (per-task directories)
4. **`docs/`** - Documentation files
5. **`bugfix/`** - Bugfix sub-sessions with their own session structure

### Bugfix Sub-sessions
```
plan/001_14b9dc2a33c7/bugfix/
├── 001_7f5a0fab4834/
│   ├── docs/                   # Bugfix documentation
│   ├── research/               # Bugfix research
│   ├── P1M1T2S1/              # Task directories
│   ├── BUGFIX_SUMMARY.md       # Summary of fixes
│   ├── BUILD_LOG.md           # Build logs
│   ├── prd_snapshot.md        # PRD snapshot
│   ├── tasks.json             # Bugfix task hierarchy
│   └── TEST_RESULTS.md        # Test results
```

## 2. PRP Storage and Cache

### PRP File Naming Convention
- **Location**: `{sessionPath}/prps/{taskId}.md`
- **Filename Sanitization**: Task ID dots replaced with underscores
- **Example**: `P1.M2.T2.S2.md` → `P1_M2_T2_S2.md`

### PRP Cache Metadata System
Cache metadata is stored in `{sessionPath}/prps/.cache/{taskId}.json`:

```typescript
interface PRPCacheMetadata {
  readonly taskId: string;        // Task identifier
  readonly taskHash: string;      // SHA-256 hash of task inputs
  readonly createdAt: number;     // Creation timestamp
  readonly accessedAt: number;     // Last access timestamp
  readonly version: string;        // Cache version (currently "1.0")
  readonly prp: PRPDocument;      // Full PRPDocument for retrieval
}
```

### Cache TTL and Metadata Structure
- **Cache TTL**: 24 hours (86,400,000 ms)
- **Cache Validation**:
  - File existence check
  - TTL expiration check using modification time
  - Hash verification for task input changes
- **Cache Bypass**: CLI `--no-cache` flag to disable caching

### PRP Generation Process
1. Compute task hash from Task/Subtask inputs
2. Check cache for recent matching PRP
3. If cache hit and hash matches, return cached PRP
4. If cache miss, generate new PRP via Researcher Agent
5. Write PRP to markdown file
6. Save cache metadata with task hash and timestamps

## 3. Artifacts Collection

### Artifact Directory Structure
```
plan/{sessionId}/artifacts/{subtaskId}/
├── validation-results.json  # Validation gate results
├── execution-summary.md     # Human-readable summary
└── artifacts-list.json      # List of generated files
```

### Artifact File Formats

#### validation-results.json Schema
```typescript
interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;               // Validation level
  readonly description: string;                 // Description
  readonly success: boolean;                    // Whether passed
  readonly command: string | null;              // Command executed
  readonly stdout: string;                     // Standard output
  readonly stderr: string;                     // Standard error
  readonly exitCode: number | null;             // Exit code
  readonly skipped: boolean;                   // True if skipped
}
```

#### execution-summary.md Format
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
```

#### artifacts-list.json Format
```json
[
  "/path/to/created/file1.ts",
  "/path/to/created/file2.js",
  "/path/to/created/file3.md"
]
```

## 4. Key Source Files

| File | Key Functions | Lines |
|------|--------------|-------|
| `src/core/session-utils.ts` | createSessionDirectory, writePRP | 99-180 |
| `src/core/session-manager.ts` | initialize, saveBacklog | 125-250 |
| `src/agents/prp-generator.ts` | generate, #saveCacheMetadata | 191-272 |
| `src/agents/prp-runtime.ts` | #writeArtifacts | 245-285 |

## 5. Gotchas and Constraints

1. **Filename Sanitization**: Task IDs use dots replaced with underscores for filenames
2. **Cache TTL**: Hard-coded 24-hour expiration
3. **Permission Model**: Directories 0o755, files 0o644 - strictly enforced
4. **Hash Truncation**: Only first 12 characters of SHA-256 used for session ID
5. **Sequential Numbering**: Sessions increment sequentially
6. **UTF-8 Validation**: All file reads use strict UTF-8 validation
7. **Batching**: Status updates are batched and require explicit flush

## 6. Data Flow Summary

1. **Session Creation**: PRD → Hash → Session Directory → Subdirectories → Tasks.json
2. **PRP Generation**: Task → Hash Check → Cache → LLM → PRP File → Cache Metadata
3. **PRP Execution**: PRP → Coder Agent → Validation Gates → Fix/Retry → Artifacts
4. **State Persistence**: Updates → Batch → Atomic Write → Tasks.json
