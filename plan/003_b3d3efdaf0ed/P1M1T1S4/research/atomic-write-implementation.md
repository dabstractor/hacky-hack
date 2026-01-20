# Atomic Write Implementation Details

## Complete Implementation

```typescript
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  logger.debug(
    {
      targetPath,
      tempPath,
      size: data.length,
      operation: 'atomicWrite',
    },
    'Starting atomic write'
  );

  try {
    const writeStart = performance.now();
    await writeFile(tempPath, data, { mode: 0o644 });
    const writeDuration = performance.now() - writeStart;

    logger.debug(
      {
        tempPath,
        size: data.length,
        duration: writeDuration,
        operation: 'writeFile',
      },
      'Temp file written'
    );

    const renameStart = performance.now();
    await rename(tempPath, targetPath);
    const renameDuration = performance.now() - renameStart;

    logger.debug(
      {
        tempPath,
        targetPath,
        duration: renameDuration,
        operation: 'rename',
      },
      'Temp file renamed to target'
    );

    logger.debug(
      {
        targetPath,
        size: data.length,
        totalDuration: writeDuration + renameDuration,
      },
      'Atomic write completed successfully'
    );
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    logger.error(
      {
        targetPath,
        tempPath,
        errorCode: err?.code,
        errorMessage: err?.message,
        operation: 'atomicWrite',
      },
      'Atomic write failed'
    );

    // Clean up temp file on error
    try {
      await unlink(tempPath);
      logger.debug({ tempPath, operation: 'cleanup' }, 'Temp file cleaned up');
    } catch (cleanupError) {
      logger.warn(
        {
          tempPath,
          cleanupErrorCode: (cleanupError as NodeJS.ErrnoException)?.code,
        },
        'Failed to clean up temp file'
      );
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}
```

## 1. Temp File Generation

### Random Bytes Pattern
- Uses `randomBytes(8).toString('hex')` from Node.js crypto module
- Generates 8 random bytes = 16 hexadecimal characters
- Example hex output: `a1b2c3d4e5f67890`

### Path Construction
```typescript
const tempPath = resolve(
  dirname(targetPath),
  `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
);
```

### Actual Temp Filename Format
- Pattern: `.<original-filename>.<random-hex>.tmp`
- Example target: `/sessions/123/tasks.json`
- Example temp file: `/sessions/123/.tasks.json.a1b2c3d4e5f67890.tmp`

### Complete Example
```typescript
// Given targetPath: '/home/user/sessions/001/session.md'
// Generated tempPath: '/home/user/sessions/001/.session.md.a1b2c3d4e5f67890.tmp'
```

## 2. Write Step

### File Write Operation
- Uses `writeFile(tempPath, data, { mode: 0o644 })`
- File permissions set to 0o644 (owner read/write, group/others read-only)
- Synchronous write operation that creates file with specified content

### Timing Measurement
```typescript
const writeStart = performance.now();
await writeFile(tempPath, data, { mode: 0o644 });
const writeDuration = performance.now() - writeStart;
```

### Debug Log Fields Emitted
```typescript
{
  tempPath,        // Path to temporary file
  size: data.length,  // Size of data in bytes
  duration: writeDuration,  // Write duration in ms
  operation: 'writeFile',   // Operation identifier
}
```

## 3. Rename Step

### Atomic Rename Operation
- Uses `rename(tempPath, targetPath)` from Node.js fs/promises
- Performs atomic rename operation (filesystem-level move)
- If rename fails, original file remains intact

### Timing Measurement
```typescript
const renameStart = performance.now();
await rename(tempPath, targetPath);
const renameDuration = performance.now() - renameStart;
```

### Debug Log Fields Emitted
```typescript
{
  tempPath,         // Source temp file path
  targetPath,       // Final target path
  duration: renameDuration,  // Rename duration in ms
  operation: 'rename',      // Operation identifier
}
```

## 4. Error Handling

### Temp File Cleanup on Error
```typescript
// Clean up temp file on error
try {
  await unlink(tempPath);
  logger.debug({ tempPath, operation: 'cleanup' }, 'Temp file cleaned up');
} catch (cleanupError) {
  logger.warn(
    {
      tempPath,
      cleanupErrorCode: (cleanupError as NodeJS.ErrnoException)?.code,
    },
    'Failed to clean up temp file'
  );
}
```

### Try-Catch Pattern
- Nested try-catch structure:
  1. Outer try-catch for main write/rename operations
  2. Inner try-catch for cleanup operation
- Cleanup runs only if error occurs in main operation
- Cleanup errors are logged as warnings but don't re-throw

### Error Propagation
- Custom `SessionFileError` is thrown with:
  - File path: `targetPath`
  - Operation type: 'atomic write'
  - Original error object

## 5. Log Output Examples

### Starting atomic write
```typescript
logger.debug(
  {
    targetPath,
    tempPath,
    size: data.length,
    operation: 'atomicWrite',
  },
  'Starting atomic write'
);
```
**Example log:** `Starting atomic write { targetPath: '/sessions/123/tasks.json', tempPath: '/sessions/123/.tasks.json.a1b2c3d4e5f67890.tmp', size: 2048, operation: 'atomicWrite' }`

### Temp file written
```typescript
logger.debug(
  {
    tempPath,
    size: data.length,
    duration: writeDuration,
    operation: 'writeFile',
  },
  'Temp file written'
);
```
**Example log:** `Temp file written { tempPath: '/sessions/123/.tasks.json.a1b2c3d4e5f67890.tmp', size: 2048, duration: 1.234, operation: 'writeFile' }`

### Temp file renamed to target
```typescript
logger.debug(
  {
    tempPath,
    targetPath,
    duration: renameDuration,
    operation: 'rename',
  },
  'Temp file renamed to target'
);
```
**Example log:** `Temp file renamed to target { tempPath: '/sessions/123/.tasks.json.a1b2c3d4e5f67890.tmp', targetPath: '/sessions/123/tasks.json', duration: 0.567, operation: 'rename' }`

### Atomic write completed successfully
```typescript
logger.debug(
  {
    targetPath,
    size: data.length,
    totalDuration: writeDuration + renameDuration,
  },
  'Atomic write completed successfully'
);
```
**Example log:** `Atomic write completed successfully { targetPath: '/sessions/123/tasks.json', size: 2048, totalDuration: 1.801 }`

### Atomic write failed
```typescript
logger.error(
  {
    targetPath,
    tempPath,
    errorCode: err?.code,
    errorMessage: err?.message,
    operation: 'atomicWrite',
  },
  'Atomic write failed'
);
```
**Example log:** `Atomic write failed { targetPath: '/sessions/123/tasks.json', tempPath: '/sessions/123/.tasks.json.a1b2c3d4e5f67890.tmp', errorCode: 'EACCES', errorMessage: 'Permission denied', operation: 'atomicWrite' }`

### Temp file cleaned up
```typescript
logger.debug({ tempPath, operation: 'cleanup' }, 'Temp file cleaned up');
```
**Example log:** `Temp file cleaned up { tempPath: '/sessions/123/.tasks.json.a1b2c3d4e5f67890.tmp', operation: 'cleanup' }`

### Failed to clean up temp file
```typescript
logger.warn(
  {
    tempPath,
    cleanupErrorCode: (cleanupError as NodeJS.ErrnoException)?.code,
  },
  'Failed to clean up temp file'
);
```
**Example log:** `Failed to clean up temp file { tempPath: '/sessions/123/.tasks.json.a1b2c3d4e5f67890.tmp', cleanupErrorCode: 'ENOENT' }`

## Error Handling Flow Diagram

```mermaid
graph TD
    A[Start atomicWrite] --> B[Generate temp filename]
    B --> C[Log 'Starting atomic write']
    C --> D[Try block: Main operations]

    D --> E[Measure write start]
    E --> F[Write to temp file]
    F --> G[Measure write duration]
    G --> H[Log 'Temp file written']
    H --> I[Measure rename start]
    I --> J[Rename temp to target]
    J --> K[Measure rename duration]
    K --> L[Log 'Temp file renamed']
    L --> M[Log 'Atomic write completed']
    M --> N[End - Success]

    D --> O{Error?}
    O -->|Yes| P[Log 'Atomic write failed']
    O -->|No| N

    P --> Q[Temp file cleanup]
    Q --> R[Try: unlink(tempPath)]
    R --> S{Cleanup success?}
    S -->|Yes| T[Log 'Temp file cleaned up']
    S -->|No| U[Log 'Failed to clean up temp file']
    U --> V[Throw SessionFileError]
    T --> V
```

## Key Implementation Characteristics

1. **Atomicity**: Uses temp file + rename pattern for atomic writes
2. **Performance**: Measures and logs both write and rename durations
3. **Safety**: Guarantees temp file cleanup even if operation fails
4. **Transparency**: Comprehensive logging at all stages
5. **Security**: Files created with restrictive permissions (0o644)
6. **Error Resilience**: Cleanup failures don't mask original errors
7. **Deterministic Naming**: Predictable temp filename pattern with random suffix