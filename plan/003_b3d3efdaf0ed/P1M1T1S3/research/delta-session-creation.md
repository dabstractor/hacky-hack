# Delta Session Creation Research

## Overview

Delta sessions enable incremental development by tracking PRD changes and automatically regenerating affected tasks while preserving completed work across multiple sessions.

## Core Files and Locations

### 1. SessionManager Delta Methods

**File**: `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

#### createDeltaSession() Method
- **Lines**: 540-617
- **Signature**: `async createDeltaSession(newPRDPath: string): Promise<DeltaSession>`
- **Purpose**: Creates a linked delta session when PRD is modified

**Method Call Sequence**:
1. Validates current session is loaded (throws Error if not)
2. Validates new PRD file exists (throws SessionFileError if not)
3. Hashes the new PRD using `hashPRD()`
4. Reads current PRD snapshot from `#currentSession.prdSnapshot`
5. Reads new PRD content from file
6. Generates diff summary using `diffPRDs(oldPRD, newPRD)`
7. Creates new session directory with incremented sequence number
8. Writes parent session reference to `parent_session.txt`
9. Creates DeltaSessionState with parent reference
10. Updates `#currentSession` to point to the new delta session
11. Returns the deltaSession object

**Side Effects**:
- Updates `#currentSession` reference to point to new delta session
- Creates new session directory with `parent_session.txt` file
- Writes PRD snapshot to new session directory
- Increments session sequence number

**Error Handling**:
- Throws `Error` if no current session is loaded
- Throws `SessionFileError` if new PRD does not exist

### 2. Parent Session Linkage

#### __readParentSession() (Private Static Method)
- **Lines**: 950-961
- **Signature**: `static async __readParentSession(sessionPath: string): Promise<string | null>`
- **Purpose**: Reads parent session ID from `parent_session.txt`
- **Return**: Parent session ID string, or `null` if file doesn't exist
- **Error Handling**: Silent catch - returns null if file read fails

#### loadSession() Parent Reading
- **Lines**: 497-505
- **Functionality**:
  - Calls `readFile()` on `parent_session.txt` path
  - Trims and stores parent session ID in metadata
  - Silent catch - no parent session is treated as optional

#### parent_session.txt Writing
- **Lines**: 578-582 in createDeltaSession()
```typescript
await writeFile(
  resolve(sessionPath, 'parent_session.txt'),
  this.#currentSession.metadata.id,
  { mode: 0o644 }
);
```

**Parent Session File Format**:
- **File Name**: `parent_session.txt`
- **Content**: Single line containing parent session ID (e.g., "001_14b9dc2a33c7")
- **Location**: `{session_dir}/parent_session.txt`
- **Encoding**: UTF-8 with trim() applied
- **Permissions**: 0o644

### 3. Session Directory Structure

Delta sessions include all standard session files plus additional delta-specific data:

```
{session_path}/
├── prd_snapshot.md           # New PRD content
├── tasks.json                # Patched task backlog
├── parent_session.txt        # Parent session ID (delta only)
├── architecture/             # Directory for architecture artifacts
├── prps/                     # Directory for PRP files
└── artifacts/                # Directory for execution artifacts
```

**Session Naming Pattern**:
- Pattern: `^(\d{3})_([a-f0-9]{12})$`
- Sequence: Zero-padded to 3 digits (e.g., "001", "002")
- Hash: First 12 characters of SHA-256 hash
- Example: `001_14b9dc2a33c7`

### 4. DeltaAnalysisWorkflow

**File**: `/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.ts`

**Purpose**: Uses QA agent with specialized prompt for semantic PRD comparison

**Returns**: Structured `DeltaAnalysis` with:
- `changes`: Array of RequirementChange objects
- `patchInstructions`: Instructions for task patching

### 5. PRD Diff Computation

**File**: `/home/dustin/projects/hacky-hack/src/core/prd-differ.ts`

**Function**: `diffPRDs(oldPRD: string, newPRD: string): DiffSummary`

**Features**:
- Section-aware diffing using markdown headers
- 5% word change threshold or 3+ sections affected for significance
- Impact levels:
  - **high**: Code blocks, tables, or >200 words changed
  - **medium**: 50-200 words changed
  - **low**: <50 words changed

**Diffing Process**:
1. Section Parsing (lines 179-253): Extracts markdown sections by headers
2. Content Comparison (lines 355-399): Uses fast-diff with markdown normalization
3. Change Detection (lines 468-538): Categorizes and filters changes

### 6. DeltaSession Type Definition

**File**: `/home/dustin/projects/hacky-hack/src/core/models.ts`

```typescript
export interface DeltaSession extends SessionState {
  readonly oldPRD: string;        // Original PRD content from parent session
  readonly newPRD: string;        // Modified PRD that triggered delta creation
}
```

### 7. hasSessionChanged() Method

**Lines**: 1162-1170
**Signature**: `hasSessionChanged(): boolean`

**Functionality**:
- Synchronously compares cached PRD hash (`#prdHash`) with current session hash
- Returns true if PRD has been modified since session load
- Used to detect when delta session creation is needed

**Hash Caching** (lines 224-233 in initialize()):
```typescript
const fullHash = await hashPRD(this.prdPath);
const sessionHash = fullHash.slice(0, 12);
this.#prdHash = sessionHash;
```

## Delta Session Creation Flow

1. **Trigger**: PRD modification detected via `hasSessionChanged()` or direct call
2. **Validation**: Check current session exists and new PRD is valid
3. **Diffing**: Compute differences between old and new PRD using `diffPRDs()`
4. **Directory Creation**: Create new session directory (sequence + 1)
5. **Parent Reference**: Write `parent_session.txt` with current session ID
6. **State Update**: Update `#currentSession` to reference new delta session
7. **Return**: Full DeltaSession object with diff information

## Key Implementation Details

### SHA-256 Hashing
- Full hash: 64-character hex string
- Session hash: First 12 characters only
- Algorithm: `createHash('sha256').update(content).digest('hex').slice(0, 12)`

### Sequence Number Management
- Starts at 1 for initial session
- Increments by 1 for each delta session
- Zero-padded to 3 digits
- Determined by scanning existing session directories

### Atomic Operations
- File writes use proper permissions (0o644 for files, 0o755 for directories)
- Directory creation uses `mkdirSync` with recursive option
- Parent session reference written before session state is updated

### Error Handling
- `Error('Cannot create delta session: no current session loaded')`
- `SessionFileError` for non-existent PRD files
- Graceful handling of file read/write failures

## Existing Tests

### E2E Tests
**File**: `/home/dustin/projects/hacky-hack/tests/e2e/delta.test.ts`
- Tests delta workflow with PRD v1 → v2 transitions
- Validates task patching and session preservation

### Unit Tests
- `DeltaAnalysisWorkflow` unit tests
- `SessionManager` delta method tests
- `diffPRDs` function tests

## Critical Gotchas

1. **Hash Caching**: `hasSessionChanged()` uses cached hash - must call `initialize()` to recompute after PRD modification
2. **Session Loading**: Parent session reference is optional and gracefully handled if missing
3. **Sequence Numbers**: Must scan existing sessions to determine next sequence number
4. **Immutable Updates**: Delta sessions create new state, don't modify existing sessions
5. **File Permissions**: Always use explicit modes (0o644 for files, 0o755 for directories)
6. **Parent Reference**: Must be written before session state is committed
7. **PRD Snapshot**: Delta sessions store both old and new PRD content in DeltaSession object

## Usage Example

```typescript
// 1. Initialize session manager
const manager = new SessionManager('./PRD.md', './plan');
await manager.initialize();

// 2. Check if PRD has changed
if (manager.hasSessionChanged()) {
  // 3. Create delta session
  const deltaSession = await manager.createDeltaSession('./PRD.md');

  console.log(`Delta session created: ${deltaSession.metadata.id}`);
  console.log(`Parent session: ${deltaSession.metadata.parentSession}`);
  console.log(`Changes: ${deltaSession.diffSummary}`);
}
```
