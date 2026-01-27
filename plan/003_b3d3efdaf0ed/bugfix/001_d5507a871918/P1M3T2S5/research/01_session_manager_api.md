# SessionManager API Research

## Summary

Complete API documentation for accessing session metadata and plan directory from SessionManager.

## planDir Property

- **Exact Property Name**: `planDir` (readonly)
- **Type**: `string`
- **Access**: `sessionManager.planDir`
- **Description**: Absolute path to the plan directory (default: `resolve('plan')`)
- **Example**: `/home/dustin/projects/hacky-hack/plan`

## Session Metadata Access

- **Interface**: `SessionMetadata`
- **Available via**: `sessionManager.currentSession.metadata`
- **Properties**:
  - `id` - Session identifier (e.g., "001_14b9dc2a33c7")
  - `hash` - PRD hash (first 12 characters)
  - `path` - Session directory path (e.g., "/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7")
  - `createdAt` - Date object when session was created
  - `parentSession` - Parent session ID (null for initial sessions)

## Current Session Access

- **Property**: `currentSession` (getter)
- **Type**: `SessionState | null`
- **Access**: `sessionManager.currentSession`
- **Returns**: Complete session state or null if not initialized
- **SessionState contains**:
  - `metadata` - SessionMetadata object
  - `prdSnapshot` - PRD content as string
  - `taskRegistry` - Task hierarchy (Backlog)
  - `currentItemId` - Currently executing task ID (null if none)

## Code Examples

### Basic SessionManager initialization
```typescript
import { SessionManager } from '../core/session-manager.js';

const manager = new SessionManager('./PRD.md');
const session = await manager.initialize();
console.log(session.metadata.id); // "001_14b9dc2a33c7"
console.log(manager.planDir); // "/path/to/plan"
```

### Accessing session metadata
```typescript
// Check if session exists
if (manager.currentSession) {
  const metadata = manager.currentSession.metadata;
  console.log(`Session ID: ${metadata.id}`);
  console.log(`Session path: ${metadata.path}`);
  console.log(`Parent session: ${metadata.parentSession ?? 'none'}`);
  console.log(`Created: ${metadata.createdAt.toISOString()}`);
}
```

## Key Gotchas and Null Checks

### Important null checks
```typescript
// Always check if session exists before accessing properties
if (!manager.currentSession) {
  throw new Error('No session loaded - call initialize() first');
}

// Safe metadata access
const sessionPath = manager.currentSession?.metadata.path;
if (!sessionPath) {
  throw new Error('Session path not available');
}
```

### Property access patterns
```typescript
// Safe property access with null coalescing
const sessionId = manager.currentSession?.metadata.id ?? 'unknown';
const planDirectory = manager.planDir || 'plan';

// Always check session before accessing currentItemId
const currentItem = manager.currentSession?.currentItemId;
if (currentItem) {
  console.log(`Working on: ${currentItem}`);
} else {
  console.log('No item currently executing');
}
```

## Implementation Guidance for Guard Context Logging

For the guard context logging, use:

```typescript
// PLAN_DIR access
const planDir = this.sessionManager.planDir;

// SESSION_DIR access (with null check)
const sessionDir = this.sessionManager.currentSession?.metadata.path ?? 'not set';
```

**Critical gotcha**: `currentSession` may be null during early initialization, so use optional chaining and nullish coalescing.
