# SessionManager Serialization Research

## File Overview

**Primary File:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

- **Total Lines:** 1,036 lines
- **Class:** SessionManager (lines 93-1035)

**Supporting File:** `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`

- **Total Lines:** 531 lines
- **Key Functions:**
  - `atomicWrite()` (lines 93-111) - Core atomic write implementation
  - `writeTasksJSON()` (lines 266-290) - Public API for writing tasks.json
  - `readTasksJSON()` (lines 312-325) - Public API for reading tasks.json

## The flushUpdates() Method

**Location:** Lines 534-584 in `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

```typescript
async flushUpdates(): Promise<void> {
  // Phase 1: Early return check
  if (!this.#dirty) {
    this.#logger.debug('No pending updates to flush');
    return;
  }

  // Phase 2: Validation
  if (!this.#pendingUpdates) {
    this.#logger.warn('Dirty flag set but no pending updates - skipping flush');
    this.#dirty = false;
    return;
  }

  // Phase 3: Atomic persistence
  await this.saveBacklog(this.#pendingUpdates);

  // Phase 4: Statistics logging
  const itemsWritten = this.#updateCount;
  const writeOpsSaved = Math.max(0, itemsWritten - 1);

  // Phase 5: State reset
  this.#dirty = false;
  this.#pendingUpdates = null;
  this.#updateCount = 0;

  // Phase 6: Error handling - preserves dirty state on error
}
```

## Atomic Write Pattern Implementation

**Location:** Lines 93-111 in `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`

```typescript
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  // Step 1: Generate temp file path
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    // Step 2: Write to temp file
    await writeFile(tempPath, data, { mode: 0o644 });

    // Step 3: Atomic rename (POSIX guarantee)
    await rename(tempPath, targetPath);
  } catch (error) {
    // Step 4: Cleanup on error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}
```

### Temp File Naming Pattern

- **Format:** `.{basename}.{random-hex}.tmp`
- **Example:** `.tasks.json.abc123def456.tmp`
- **Location:** Same directory as target file
- **Randomness:** 8 bytes of crypto-random data (16 hex characters)

## writeTasksJSON() Function

**Location:** Lines 266-290 in `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`

```typescript
export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  try {
    // Step 1: Validate with Zod schema
    const validated = BacklogSchema.parse(backlog);

    // Step 2: Serialize to JSON with 2-space indentation
    const content = JSON.stringify(validated, null, 2);

    // Step 3: Write atomically
    const tasksPath = resolve(sessionPath, 'tasks.json');
    await atomicWrite(tasksPath, content);
  } catch (error) {
    // Error handling...
  }
}
```

## JSON Serialization Characteristics

```typescript
const content = JSON.stringify(validated, null, 2);
```

- **Pretty-printed:** Yes (2-space indentation)
- **Sorted keys:** No (uses default object key order)
- **Date handling:** Dates are serialized as ISO strings
- **Undefined values:** Removed during serialization

## Batching Architecture

### Private State Variables

```typescript
#dirty: boolean = false;           // Flag indicating pending changes
#pendingUpdates: Backlog | null = null;  // Accumulated backlog state
#updateCount: number = 0;          // Count of batched updates
```

### Batching Flow

1. Update call: `updateItemStatus()` is called
2. In-memory update: Status changed in `#pendingUpdates`
3. Flag set: `#dirty = true`, `#updateCount++`
4. No I/O: Changes accumulate in memory only
5. Flush: `flushUpdates()` called
6. Single write: All changes persisted in one atomic operation

## Existing Test Coverage

### Test Files

1. **SessionManager Unit Tests** - `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts` (2,613 lines)
2. **Session Utils Tests** - `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts` (1,392 lines)

### Atomic Write Pattern Tests (session-utils.test.ts lines 430-567)

- "should write tasks.json with atomic write pattern"
- "should clean up temp file on write failure"
- "should clean up temp file on rename failure"
- "should handle unlink cleanup failure gracefully"
