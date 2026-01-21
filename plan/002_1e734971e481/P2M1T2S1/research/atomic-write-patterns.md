# Atomic File Write Patterns in Node.js

**Research Date:** 2025-01-15
**Task:** P2.M1.T2.S1 - Atomic File Write Patterns for JSON File Integrity
**Focus:** Preventing JSON file corruption using temp file + rename pattern

---

## Executive Summary

Atomic file writes are critical for preventing JSON file corruption when Node.js processes crash, disk space runs out, or power is lost during write operations. The industry-standard pattern uses a temporary file followed by an atomic rename operation to ensure data integrity.

**Key Finding:** `fs.rename()` is atomic on POSIX systems (Linux, macOS) when both files are on the same filesystem, but has different behavior on Windows and network filesystems.

---

## 1. Why Atomic Writes Are Necessary

### 1.1 The Problem: Non-Atomic File Writes

Standard file write operations (`fs.writeFile`, `fs.writeFileSync`) are **not atomic**. When writing large JSON files, several failure scenarios can result in corruption:

#### Failure Scenario 1: Process Crash During Write

```javascript
// DANGEROUS: Non-atomic write
await fs.writeFile('data.json', JSON.stringify(largeObject, null, 2));
```

**What happens if process crashes mid-write:**

- File contains incomplete JSON (missing closing brace `}`)
- Subsequent reads fail with `SyntaxError: Unexpected end of JSON input`
- Application cannot recover - data is permanently lost

#### Failure Scenario 2: Disk Full

```javascript
// DANGEROUS: Disk space exhausted mid-write
{
  "users": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
    {"id": 3, "nam  // ← Write stops here, file is truncated
```

**Result:** File exists but contains truncated, invalid JSON. Application cannot determine if this is old data or corrupted new data.

#### Failure Scenario 3: Power Loss

- OS may not flush buffers to disk before power cutoff
- File metadata shows correct size but content is partially written
- Filesystem journaling may help, but doesn't guarantee JSON integrity

### 1.2 The Atomic Guarantee

**Atomic write means:** The operation either completes entirely or fails completely, with no intermediate state visible to other processes.

**Benefits:**

1. **No partial writes:** Target file is never seen in an invalid state
2. **Recoverable:** Either old file (valid) or new file (valid) exists
3. **Deterministic:** No ambiguity about whether write succeeded or failed
4. **Multi-process safe:** Other processes always read complete JSON

---

## 2. The Temp File + Rename Pattern

### 2.1 Implementation Pattern

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

/**
 * Atomically writes data to a file using temp file + rename pattern
 */
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  // Step 1: Generate unique temp file name
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );
  // Example: target.json → .target.json.a1b2c3d4e5f6g7h8.tmp

  try {
    // Step 2: Write to temp file (non-atomic, but isolated)
    await writeFile(tempPath, data, { mode: 0o644 });

    // Step 3: Atomic rename from temp to target
    await rename(tempPath, targetPath);
  } catch (error) {
    // Step 4: Clean up temp file on error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors - temp file will be orphaned
    }
    throw error;
  }
}
```

### 2.2 Why This Works

| Step | Operation            | Atomic? | Failure Handling                               |
| ---- | -------------------- | ------- | ---------------------------------------------- |
| 1    | Create temp filename | N/A     | Unique name prevents conflicts                 |
| 2    | Write to temp file   | **No**  | If crash here: target file untouched           |
| 3    | Rename temp → target | **Yes** | Either succeeds (new file) or fails (old file) |
| 4    | Cleanup temp         | N/A     | Best-effort, orphaned .tmp files are harmless  |

**Critical insight:** The atomicity comes from `rename()`, not `writeFile()`. The temp file acts as a staging area where we can safely fail without affecting the target.

### 2.3 Real-World Implementation

From `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`:

```typescript
/**
 * Atomically writes tasks.json to session directory
 *
 * @remarks
 * Validates the backlog with Zod schema before writing, then uses atomic
 * write pattern (temp file + rename) to prevent corruption if the process
 * crashes during write.
 */
export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  try {
    // Validate with Zod schema
    const validated = BacklogSchema.parse(backlog);

    // Serialize to JSON with 2-space indentation
    const content = JSON.stringify(validated, null, 2);

    // Write atomically
    const tasksPath = resolve(sessionPath, 'tasks.json');
    await atomicWrite(tasksPath, content);
  } catch (error) {
    if (error instanceof SessionFileError) {
      throw error;
    }
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'write tasks.json',
      error as Error
    );
  }
}
```

---

## 3. How Rename Is Atomic on Different Filesystems

### 3.1 POSIX Guarantees (Linux, macOS, Unix)

**POSIX specification for `rename()`:**

> "The rename() function shall cause the file named by the old argument to be renamed to the path given by the new argument. [...] If the new argument names an existing file, that file shall be removed and the old argument shall be renamed to the new argument."

**Key guarantees:**

1. **Atomic operation:** Rename is performed as a single filesystem operation
2. **All-or-nothing:** Either complete success or complete failure
3. **No partial state:** Filesystem never shows intermediate state during rename
4. **Metadata update:** File size, permissions, timestamps update atomically

**Implementation in filesystems:**

- **ext4:** Uses journaling to ensure atomic metadata updates
- **APFS (macOS):** Uses copy-on-write for atomic operations
- **ZFS:** Always atomic due to copy-on-write architecture

### 3.2 Cross-Platform Considerations

#### Windows (NTFS, ReFS)

- `fs.rename()` is **NOT** atomic when overwriting existing files
- Windows requires deletion of target file first
- Workaround: Delete target, then rename (not atomic, but close)

```typescript
// Windows-specific workaround
if (process.platform === 'win32') {
  try {
    await fs.unlink(targetPath); // May fail if file doesn't exist
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}
await fs.rename(tempPath, targetPath);
```

#### Network Filesystems (NFS, SMB)

- Atomicity **not guaranteed** on network filesystems
- Network partitions can cause inconsistent states
- Recommendation: Avoid atomic writes on network mounts
- Alternative: Use application-level locking or transactional databases

#### Container/Mount Boundaries

- Atomic rename **only works** on same filesystem/mount point
- Cannot rename across filesystems (throws `EXDEV` error)
- Ensure temp file and target file are on same mount

```typescript
// Safe: Same directory
atomicWrite('/data/config/settings.json', data);

// Unsafe: Different filesystems (if /tmp and /data are different mounts)
// tempPath = '/tmp/settings.json.tmp' (wrong!)
// targetPath = '/data/settings.json' (different mount!)
```

### 3.3 Verification of Atomic Behavior

**From POSIX rename() specification:**

- If new exists, it's atomically replaced
- If new doesn't exist, old is atomically moved
- Operation is atomic from perspective of all processes
- No check-then-race condition possible

**Non-atomic alternatives to avoid:**

```javascript
// DANGEROUS: Check-then-race condition
if (fs.existsSync(targetPath)) {
  fs.unlinkSync(targetPath); // ← Process could crash here
}
fs.renameSync(tempPath, targetPath); // ← Or here

// SAFE: Single atomic operation
fs.renameSync(tempPath, targetPath); // Overwrites atomically
```

---

## 4. Common Failure Scenarios

### 4.1 Scenario Matrix

| Failure Point                          | State After Failure                         | Recovery             | Data Integrity |
| -------------------------------------- | ------------------------------------------- | -------------------- | -------------- |
| **Before writeFile()**                 | No temp file, old target intact             | N/A                  | ✅ Safe        |
| **During writeFile()**                 | Partial temp file, old target intact        | Delete orphaned .tmp | ✅ Safe        |
| **After writeFile(), before rename()** | Complete temp file, old target intact       | Delete orphaned .tmp | ✅ Safe        |
| **During rename()**                    | Either old target OR new target, never both | Check which exists   | ✅ Safe        |
| **After rename()**                     | New target in place, no temp file           | N/A                  | ✅ Safe        |
| **During cleanup (unlink)**            | New target in place, orphaned .tmp          | Manual cleanup       | ✅ Safe        |

### 4.2 Detailed Failure Scenarios

#### Scenario 1: Process Crash (SIGKILL, segfault)

```javascript
// Timeline:
// T0: atomicWrite() called
// T1: writeFile('.tmp') completes
// T2: Process crashes (SIGKILL) ← BEFORE rename
// T3: Target file: OLD DATA (intact)
//     Temp file: COMPLETE (orphaned)

// Recovery:
// - Target file is valid JSON (old version)
// - Orphaned .tmp file can be ignored or cleaned up
// - Application can retry write operation
```

**Result:** ✅ Data integrity maintained. Target file never corrupted.

#### Scenario 2: Disk Full During Write

```javascript
// Timeline:
// T0: atomicWrite() called for 100MB JSON
// T1: writeFile('.tmp') writes 50MB
// T2: writeFile('.tmp') fails with ENOSPC (No space left)
// T3: Error handler catches, cleanup runs
// T4: Target file: OLD DATA (untouched)
//     Temp file: PARTIAL (deleted during cleanup)

// Recovery:
// - Target file is valid JSON (old version)
// - Error thrown to caller with ENOSPC code
// - Application can alert user or free space
```

**Result:** ✅ Data integrity maintained. Old file preserved, partial write cleaned up.

#### Scenario 3: Disk Full After Write, Before Rename

```javascript
// Timeline:
// T0: atomicWrite() called for 10MB JSON
// T1: writeFile('.tmp') succeeds (10MB written)
// T2: rename() fails with ENOSPC (filesystem needs space for metadata)
// T3: Error handler catches, cleanup runs
// T4: Target file: OLD DATA (untouched)
//     Temp file: COMPLETE (deleted during cleanup)

// Recovery:
// - Target file is valid JSON (old version)
// - Complete temp file deleted during cleanup
// - Error thrown to caller with ENOSPC code
```

**Result:** ✅ Data integrity maintained. Space for metadata required for rename.

#### Scenario 4: Power Loss (System Crash)

**Subscenario 4a: Power loss during writeFile()**

```
State before power loss:
- Target file: OLD DATA (intact)
- Temp file: PARTIAL (or doesn't exist)

After power recovery:
- Target file: OLD DATA (valid JSON)
- Temp file: PARTIAL (orphaned, harmless)

Filesystem journaling ensures:
- If write didn't reach disk: temp file doesn't exist
- If write partially reached disk: temp file is partial
- Target file is NEVER touched during write
```

**Subscenario 4b: Power loss during rename()**

```
State before power loss:
- Target file: OLD DATA (still intact)
- Temp file: COMPLETE

After power recovery:
- Option A: Target file = OLD DATA, Temp file = COMPLETE (rename didn't happen)
- Option B: Target file = NEW DATA, Temp file = gone (rename completed)
- NEVER: Target file = CORRUPTED, Temp file = PARTIAL

Filesystem ensures atomicity:
- Metadata update is all-or-nothing
- Journal recovery completes or rolls back rename
- No intermediate state is visible
```

**Result:** ✅ Data integrity maintained. Filesystem journaling ensures atomic rename completes or rolls back.

#### Scenario 5: Permission Errors

```javascript
// Timeline:
// T0: atomicWrite() called to /protected/file.json
// T1: writeFile('.tmp') succeeds
// T2: rename() fails with EACCES (Permission denied)
// T3: Error handler catches, cleanup runs
// T4: Target file: OLD DATA (untouched, still owned by other user)
//     Temp file: DELETED (cleanup succeeded)

// Recovery:
// - Target file is valid JSON (old version)
// - Complete temp file deleted during cleanup
// - Error thrown to caller with EACCES code
```

**Result:** ✅ Data integrity maintained. Permission errors handled gracefully.

### 4.3 Orphaned Temp Files

**Cause:** Process crashes after writeFile() but before cleanup unlink().

**Characteristics:**

- Filename pattern: `.targetFilename.RANDOM_HEX.tmp`
- Content: Complete, valid JSON (ready to be committed)
- Location: Same directory as target file

**Cleanup strategies:**

```typescript
// Startup cleanup: Remove orphaned temp files
async function cleanupTempFiles(directory: string): Promise<void> {
  const files = await readdir(directory);
  const tempFiles = files.filter(f => f.endsWith('.tmp'));

  for (const tempFile of tempFiles) {
    try {
      await unlink(join(directory, tempFile));
    } catch (error) {
      // Log but continue - maybe another process is cleaning up
      console.warn(`Failed to clean up ${tempFile}:`, error);
    }
  }
}

// Recovery: Check if temp file is newer than target
async function recoverFromTempFile(targetPath: string): Promise<boolean> {
  const tempPath = targetPath + '.tmp'; // Simplified pattern

  try {
    const [targetStat, tempStat] = await Promise.all([
      stat(targetPath).catch(() => null),
      stat(tempPath).catch(() => null),
    ]);

    // If temp file exists and is newer, consider recovering it
    if (tempStat && (!targetStat || tempStat.mtime > targetStat.mtime)) {
      // Validate temp file content
      const content = await readFile(tempPath, 'utf-8');
      JSON.parse(content); // Will throw if invalid
      await rename(tempPath, targetPath); // Recover
      return true;
    }
  } catch {
    // Temp file is invalid, leave it for cleanup
  }
  return false;
}
```

---

## 5. How to Verify Atomic Behavior in Tests

### 5.1 Testing Strategy

Testing atomic writes requires simulating failures at different points in the write process. Since we can't actually crash the process or fill the disk in unit tests, we mock the filesystem operations.

### 5.2 Mock-Based Unit Tests

From `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`:

```typescript
describe('writeTasksJSON', () => {
  beforeEach(() => {
    // Setup atomic write mocks
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);
    mockRandomBytes.mockReturnValue({ toString: () => 'abc123def' });
  });

  it('should write tasks.json with atomic write pattern', async () => {
    // SETUP: Create test backlog
    const backlog = createTestBacklog([
      createTestPhase('P1', 'Phase 1', 'Planned'),
    ]);

    // EXECUTE
    await writeTasksJSON('/test/session', backlog);

    // VERIFY: Atomic write pattern used
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockRename).toHaveBeenCalled();

    // Verify temp file was used
    const writeFileCall = mockWriteFile.mock.calls[0];
    const tempPath = writeFileCall[0];
    expect(tempPath).toContain('.tmp');

    // Verify rename from temp to target
    const renameCall = mockRename.mock.calls[0];
    expect(renameCall[0]).toBe(tempPath); // temp path
    expect(renameCall[1]).toContain('tasks.json'); // target path
  });

  it('should clean up temp file when writeFile fails', async () => {
    // SETUP: writeFile throws error
    const writeError = new Error('Disk full');
    (writeError as NodeJS.ErrnoException).code = 'ENOSPC';
    mockWriteFile.mockRejectedValue(writeError);
    mockUnlink.mockResolvedValue(undefined);

    const backlog = createTestBacklog([
      createTestPhase('P1', 'Phase 1', 'Planned'),
    ]);

    // EXECUTE & VERIFY: Should throw from writeFile
    await expect(writeTasksJSON('/test/session', backlog)).rejects.toThrow(
      'Disk full'
    );

    // VERIFY: Cleanup was attempted
    expect(mockUnlink).toHaveBeenCalled();
    const tempPath = mockUnlink.mock.calls[0][0];
    expect(tempPath).toContain('.tmp');
  });

  it('should clean up temp file when rename fails', async () => {
    // SETUP: rename throws error
    const renameError = new Error('Permission denied');
    (renameError as NodeJS.ErrnoException).code = 'EACCES';
    mockWriteFile.mockResolvedValue(undefined);
    mockRename.mockRejectedValue(renameError);
    mockUnlink.mockResolvedValue(undefined);

    const backlog = createTestBacklog([
      createTestPhase('P1', 'Phase 1', 'Planned'),
    ]);

    // EXECUTE & VERIFY: Should throw from rename
    await expect(writeTasksJSON('/test/session', backlog)).rejects.toThrow(
      'Permission denied'
    );

    // VERIFY: Cleanup was attempted
    expect(mockUnlink).toHaveBeenCalled();
  });
});
```

### 5.3 Integration Tests with Real Filesystem

```typescript
describe('atomicWrite integration tests', () => {
  const tempDir = '/tmp/atomic-write-test';

  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should preserve old file if writeFile fails', async () => {
    // SETUP: Create initial file
    const targetPath = join(tempDir, 'data.json');
    await writeFile(targetPath, '{"old": true}', 'utf-8');

    // ATTEMPT: Simulate failure during writeFile
    // (In real test, we'd use a filesystem that allows injection)

    // VERIFY: Old file still intact
    const content = await readFile(targetPath, 'utf-8');
    expect(JSON.parse(content)).toEqual({ old: true });
  });

  it('should use unique temp file names', async () => {
    const targetPath = join(tempDir, 'data.json');

    // Execute multiple writes in parallel
    await Promise.all([
      atomicWrite(targetPath, '{"version": 1}'),
      atomicWrite(targetPath, '{"version": 2}'),
      atomicWrite(targetPath, '{"version": 3}'),
    ]);

    // Verify final file is valid JSON
    const content = await readFile(targetPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.version).toBeGreaterThanOrEqual(1);
    expect(parsed.version).toBeLessThanOrEqual(3);
  });
});
```

### 5.4 Concurrency Testing

```typescript
describe('atomicWrite concurrency', () => {
  it('should handle concurrent writes safely', async () => {
    const targetPath = '/tmp/concurrent-test.json';
    const writeCount = 100;
    const writes = Array.from({ length: writeCount }, (_, i) =>
      atomicWrite(targetPath, `{"counter": ${i}}`)
    );

    // Execute all writes concurrently
    await Promise.all(writes);

    // Verify: File should be valid JSON
    const content = await readFile(targetPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Should have exactly one counter value
    expect(typeof parsed.counter).toBe('number');
    expect(parsed.counter).toBeGreaterThanOrEqual(0);
    expect(parsed.counter).toBeLessThan(writeCount);
  });
});
```

### 5.5 Verification Checklist

✅ **Pattern Verification:**

- [ ] Uses unique temp filename (with random bytes or UUID)
- [ ] Writes to temp file first
- [ ] Uses `fs.rename()` for final commit
- [ ] Cleans up temp file on error

✅ **Failure Scenario Tests:**

- [ ] writeFile() failure → target untouched
- [ ] rename() failure → target untouched, temp cleaned up
- [ ] Process crash simulation → target intact
- [ ] Concurrent writes → no corruption

✅ **Edge Cases:**

- [ ] Empty file write
- [ ] Large file write (>1MB)
- [ ] Special characters in filename
- [ ] Read-only target directory (error handling)

✅ **Cross-Platform Tests:**

- [ ] Linux/macOS: Atomic rename verified
- [ ] Windows: Fallback to delete+rename
- [ ] Network mount: Warning logged

---

## 6. Best Practices

### 6.1 DO ✅

1. **Always use atomic writes for JSON files**

   ```typescript
   await atomicWrite(jsonPath, JSON.stringify(data, null, 2));
   ```

2. **Use unique temp filenames**

   ```typescript
   const tempPath = `${targetPath}.${randomBytes(8).toString('hex')}.tmp`;
   ```

3. **Validate data before writing**

   ```typescript
   const validated = MySchema.parse(data);
   await atomicWrite(path, JSON.stringify(validated));
   ```

4. **Clean up temp files on error**

   ```typescript
   try {
     await writeFile(tempPath, data);
     await rename(tempPath, targetPath);
   } catch {
     await unlink(tempPath).catch(() => {});
     throw error;
   }
   ```

5. **Set appropriate file permissions**

   ```typescript
   await writeFile(tempPath, data, { mode: 0o644 });
   ```

6. **Check for same filesystem**
   ```typescript
   // Ensure temp and target are on same mount
   const tempDir = dirname(targetPath);
   const tempPath = join(tempDir, `.tmp.${basename(targetPath)}`);
   ```

### 6.2 DON'T ❌

1. **Don't write directly to target file**

   ```typescript
   // WRONG: Not atomic
   await writeFile(targetPath, JSON.stringify(data));
   ```

2. **Don't use predictable temp names**

   ```typescript
   // WRONG: Race condition with multiple processes
   const tempPath = `${targetPath}.tmp`;
   ```

3. **Don't forget cleanup on error**

   ```typescript
   // WRONG: Orphaned temp files
   await writeFile(tempPath, data);
   await rename(tempPath, targetPath); // If this throws, .tmp remains
   ```

4. **Don't assume atomic rename across filesystems**

   ```typescript
   // WRONG: May fail with EXDEV
   const tempPath = `/tmp/${basename(targetPath)}.tmp`;
   await rename(tempPath, targetPath); // Different mount!
   ```

5. **Don't ignore errors during cleanup**
   ```typescript
   // WRONG: Swallows legitimate errors
   try {
     await writeFile(tempPath, data);
     await rename(tempPath, targetPath);
   } catch (error) {
     await unlink(tempPath); // May throw, hiding original error
   }
   ```

---

## 7. Alternative Approaches

### 7.1 File Locking ( flock )

```typescript
import { open, readFile, writeFile, close } from 'node:fs/promises';

async function writeWithLock(filePath: string, data: string): Promise<void> {
  const fd = await open(filePath, 'wx'); // Exclusive create
  try {
    await writeFile(fd, data);
  } finally {
    await close(fd);
  }
}
```

**Pros:**

- Prevents concurrent writes
- Can detect if another process is writing

**Cons:**

- Requires cleanup of stale locks
- Not atomic (process can crash during write)
- More complex error handling

### 7.2 Write-Ahead Logging (WAL)

```typescript
// Write to log first, then apply
await appendFile('wal.log', JSON.stringify({ op: 'update', data }));
await applyOperation(data);
await truncateLog();
```

**Pros:**

- Can recover from crashes
- Supports transactions

**Cons:**

- Much more complex
- Overkill for single file writes
- Requires log management

### 7.3 Database Solution

```typescript
// Use SQLite or similar for true ACID guarantees
import Database from 'better-sqlite3';
const db = new Database('state.db');
db.prepare('INSERT INTO state VALUES (?)').run(JSON.stringify(data));
```

**Pros:**

- True ACID guarantees
- Built-in crash recovery
- Supports complex queries

**Cons:**

- Additional dependency
- Overkill for simple JSON files
- Requires database management

---

## 8. References and Further Reading

### Node.js Documentation

- **fs.promises.rename()** - https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
- **fs.writeFile()** - https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
- **fs File System** - https://nodejs.org/api/fs.html

### POSIX Standards

- **POSIX rename() specification** - IEEE Std 1003.1-2017
- **Atomic operations** - https://pubs.opengroup.org/onlinepubs/9699919799/functions/rename.html

### Filesystem Documentation

- **ext4 journaling** - https://ext4.wiki.kernel.org/index.php/Ext4_Design#Journaling
- **APFS (Apple)** - https://developer.apple.com/support/downloads/APFS_Technical_Overview.pdf
- **ZFS atomic writes** - https://openzfs.github.io/openzfs-docs/

### Community Resources

- **Node.js best practices** - https://github.com/goldbergyoni/nodebestpractices
- **Atomic file writes** - https://manuel.bleichschmidt.de/blog/120706/atomic-file-writes-with-nodejs/
- **Write patterns** - https://www.ibm.com/developerworks/aix/library/au-endianc/

### Code Examples

- **Project implementation:** `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`
  - `atomicWrite()` function (lines 93-111)
  - `writeTasksJSON()` usage example (lines 266-290)
  - `writePRP()` usage example (lines 428-453)

- **Test coverage:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`
  - Atomic write pattern tests (lines 430-512)
  - Error handling tests (lines 1079-1112)

---

## 9. Summary

**Atomic file writes using the temp file + rename pattern provide:**

1. **Data Integrity:** Never leaves target file in corrupted state
2. **Crash Recovery:** Either old file or new file, never partial
3. **Error Handling:** Graceful cleanup on disk full, permissions, etc.
4. **Multi-process Safety:** Concurrent writes don't corrupt data
5. **Cross-platform:** Works on POSIX, with Windows workarounds

**Implementation requirements:**

- Unique temp filenames (random bytes or UUID)
- Write to temp file first
- Atomic rename for final commit
- Cleanup temp files on error
- Validate data before writing

**Testing requirements:**

- Mock-based unit tests for failure scenarios
- Integration tests for real filesystem behavior
- Concurrency tests for multi-process safety
- Cross-platform tests for Windows/POSIX differences

---

## Appendix: Quick Reference

### Atomic Write Implementation

```typescript
import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';

async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

### Usage Example

```typescript
import { atomicWrite } from './utils/fs.js';

// Write JSON atomically
const data = { users: [{ id: 1, name: 'Alice' }] };
await atomicWrite('./data/users.json', JSON.stringify(data, null, 2));
```

### Common Error Codes

| Code     | Meaning                  | Recovery            |
| -------- | ------------------------ | ------------------- |
| `ENOSPC` | Disk full                | Free space, retry   |
| `EACCES` | Permission denied        | Check permissions   |
| `ENOENT` | Parent directory missing | Create directory    |
| `EXDEV`  | Cross-device link        | Use same filesystem |
| `EISDIR` | Target is directory      | Check path          |

---

**End of Research Document**
