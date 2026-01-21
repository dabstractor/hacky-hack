# Batching State Machine Analysis

## Overview

This document analyzes the batching state machine implemented in `src/core/session-manager.ts` (lines 109-116, 670-720, 768-800). The batching system accumulates multiple task status updates in memory and flushes them to disk in a single atomic operation for improved performance and data integrity.

## State Fields

### 1. `#dirty: boolean`

- **Location**: Line 110
- **Purpose**: Flag indicating pending changes that need to be flushed to disk
- **Default**: `false`
- **State**: Private class field

### 2. `#pendingUpdates: Backlog | null`

- **Location**: Line 113
- **Purpose**: Holds the latest accumulated backlog state containing all pending updates
- **Default**: `null`
- **State**: Private class field, stores complete Backlog object or null when no updates

### 3. `#updateCount: number`

- **Location**: Line 116
- **Purpose**: Tracks the number of accumulated updates (for statistics and monitoring)
- **Default**: `0`
- **State**: Private class field, incremented on each update

## State Transitions

### Initial State (No Pending Updates)

```
#dirty: false
#pendingUpdates: null
#updateCount: 0
```

- **Characteristics**: Clean state, no updates queued
- **Operations**: `updateItemStatus` can be called normally
- **Behavior**: `flushUpdates()` returns early without action

### After First `updateItemStatus` Call

```
#dirty: true
#pendingUpdates: Backlog (with single update)
#updateCount: 1
```

- **Characteristics**: First update queued, dirty flag set
- **Operations**: More updates can be added, flush enabled
- **Logging**: Debug log "Status update batched" with pendingCount=1

### After Multiple `updateItemStatus` Calls

```
#dirty: true
#pendingUpdates: Backlog (with all accumulated updates)
#updateCount: N (where N >= 2)
```

- **Characteristics**: Multiple updates batched together
- **Operations**: Updates accumulate in memory, single flush required
- **Behavior**: Each update increments `#updateCount` and overwrites `#pendingUpdates`

### After `flushUpdates` (Success)

```
#dirty: false
#pendingUpdates: null
#updateCount: 0
```

- **Characteristics**: All updates persisted, state reset
- **Operations**: System ready for new update cycle
- **Logging**:
  - "Batch write complete" with efficiency statistics
  - "Batching state reset" (debug)

### After `flushUpdates` (Failure)

```
#dirty: true (preserved)
#pendingUpdates: Backlog (preserved)
#updateCount: N (preserved)
```

- **Characteristics**: Error occurred, updates preserved for retry
- **Operations**: Can retry flush immediately or later
- **Logging**:
  - "Batch write failed - pending updates preserved for retry"
  - Error details with pendingCount

## Batch Accumulation Logic

### Update Accumulation

```typescript
// In updateItemStatus() (lines 779-782)
this.#pendingUpdates = updated; // Store complete updated backlog
this.#dirty = true; // Mark as needing flush
this.#updateCount++; // Increment update counter
```

### Key Characteristics:

1. **Overwrite Behavior**: Each `updateItemStatus` call completely overwrites `#pendingUpdates` with the latest full backlog state
2. **Immutable Update**: Uses `updateItemStatusUtil()` to create immutable updates
3. **Single Flush Point**: Only one `flushUpdates()` call needed regardless of update count
4. **State Synchronization**: Updates `#currentSession` immediately for internal consistency

### Internal Session Update:

```typescript
// Line 785-788: Update internal session state
this.#currentSession = {
  ...this.#currentSession,
  taskRegistry: updated,
};
```

## Error Handling

### Error Preservation Strategy

```typescript
// In flushUpdates() catch block (lines 712-719)
} catch (error) {
  // Preserve dirty state on error - allow retry
  this.#logger.error(
    { error, pendingCount: this.#updateCount },
    'Batch write failed - pending updates preserved for retry'
  );
  throw error; // Re-throw for caller to handle
}
```

### Error Handling Features:

1. **State Preservation**: On flush failure, all batching state is preserved
2. **Retry Enabled**: Caller can retry flush immediately or retry later
3. **Error Propagation**: Error is re-thrown for proper error handling upstream
4. **Logging Context**: Error includes pending update count for debugging

### Recovery Pattern:

1. Error occurs during `saveBacklog()`
2. `#dirty` remains `true`
3. `#pendingUpdates` contains unsaved state
4. Caller can call `flushUpdates()` again to retry

## Logging and Observability

### Debug Logs (High Frequency)

```typescript
// updateItemStatus() - line 791-794
this.#logger.debug(
  { itemId, status, pendingCount: this.#updateCount },
  'Status update batched'
);

// flushUpdates() - line 673 (early return)
this.#logger.debug('No pending updates to flush');

// flushUpdates() - line 711 (success)
this.#logger.debug('Batching state reset');
```

### Info Logs (Batch Completion)

```typescript
// flushUpdates() - lines 694-704
this.#logger.info(
  {
    itemsWritten,
    writeOpsSaved,
    efficiency:
      itemsWritten > 0
        ? `${((writeOpsSaved / itemsWritten) * 100).toFixed(1)}%`
        : '0%',
  },
  'Batch write complete'
);
```

### Warning Logs

```typescript
// flushUpdates() - lines 678-680
this.#logger.warn('Dirty flag set but no pending updates - skipping flush');
```

### Error Logs

```typescript
// flushUpdates() - lines 714-717
this.#logger.error(
  { error, pendingCount: this.#updateCount },
  'Batch write failed - pending updates preserved for retry'
);
```

## Statistics Tracking

### Calculated Metrics

1. **itemsWritten**: Total number of updates in the batch (`#updateCount`)
2. **writeOpsSaved**: Number of individual writes avoided (`Math.max(0, itemsWritten - 1)`)
3. **efficiency**: Percentage of write operations saved
   ```typescript
   efficiency = itemsWritten > 0
     ? `${((writeOpsSaved / itemsWritten) * 100).toFixed(1)}%`
     : '0%'`
   ```

### Example Log Output:

```
Batch write complete
  itemsWritten: 5
  writeOpsSaved: 4
  efficiency: 80.0%
```

## State Diagram

```
    [Initial State]
       #dirty: false
       #pendingUpdates: null
       #updateCount: 0
           │
           ▼ updateItemStatus()
    [First Update State]
       #dirty: true
       #pendingUpdates: Backlog
       #updateCount: 1
           │
           ▼ updateItemStatus() (optional)
    [Multiple Updates State]
       #dirty: true
       #pendingUpdates: Backlog
       #updateCount: N
           │
           │───────────────┐
           ▼               ▼
    flushUpdates()   updateItemStatus()
           │               │
           ▼               ▼
    [Success]        [Continue Accumulating]
       #dirty: false
       #pendingUpdates: null
       #updateCount: 0
           │
           ▼ updateItemStatus()
           └───────────────────┐
                              ▼
                    [Multiple Updates State] (loop)
           │
           ▼ flushUpdates()
           │
           ▼
    [Error State - Preserved]
       #dirty: true (preserved)
       #pendingUpdates: Backlog (preserved)
       #updateCount: N (preserved)
           │
           ▼ flushUpdates() (retry)
           │
           └─────────┐
                     ▼
               [Success]
```

## Key Design Decisions

1. **Atomic Writes**: Uses `writeTasksJSON()` with atomic write pattern (temp file + rename)
2. **Memory Efficiency**: Only stores one complete backlog instance in memory
3. **Error Resilience**: Preserves state on failure for retry capability
4. **Performance**: Reduces disk I/O from N operations to 1 operation
5. **Immutability**: Maintains immutable update pattern throughout the system
6. **Observability**: Comprehensive logging for debugging and performance monitoring

## Usage Example

```typescript
const manager = new SessionManager('./PRD.md');
await manager.initialize();

// Multiple updates accumulate in memory
await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');
await manager.updateItemStatus('P1.M1.T1.S2', 'Complete');
await manager.updateItemStatus('P1.M1.T1.S3', 'In Progress');

// Single atomic write operation
await manager.flushUpdates();
// Output: "Batch write complete: 3 items in 1 operation (2 write ops saved)"
```
