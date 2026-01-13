# Codebase Analysis for Session File System Utilities

## Overview

This document analyzes the existing codebase structure, patterns, and conventions that must be followed when implementing the session file system utilities (P1.M2.T2.S3).

## Project Structure

```
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   └── models.ts (1,337 lines) - Session and PRP type definitions
│   ├── config/
│   │   ├── constants.ts - Environment constants
│   │   ├── environment.ts - Environment configuration
│   │   └── types.ts - Error classes
│   ├── utils/
│   │   └── task-utils.ts (365 lines) - Task hierarchy utilities (pattern to follow)
│   └── index.ts - Main entry point
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   │   ├── models.test.ts
│   │   │   └── task-utils.test.ts
│   │   └── config/
│   │       └── environment.test.ts
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/ - Architecture documentation
│       ├── prps/ - PRP documents per task
│       ├── tasks.json - Task backlog
│       └── prd_snapshot.md - PRD state
└── package.json - ESM modules, Vitest testing
```

## Key Conventions to Follow

### 1. Module System (ESM)

```typescript
// Always use .js extension for imports (ESM requirement)
import { Backlog, BacklogSchema } from './models.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
```

### 2. File Placement

- **Utilities**: Place in `src/utils/` directory
- **Tests**: Place in `tests/unit/core/` for core utilities
- **Naming**: Use `*-utils.ts` pattern for utility modules

### 3. Error Handling Pattern (from config/types.ts)

```typescript
// Custom error class pattern
export class SessionFileError extends Error {
  readonly path: string;
  readonly operation: string;
  constructor(path: string, operation: string, cause?: Error) {
    super(
      `Failed to ${operation} at ${path}: ${cause?.message ?? 'unknown error'}`
    );
    this.name = 'SessionFileError';
    this.path = path;
    this.operation = operation;
  }
}
```

### 4. Utility Function Pattern (from task-utils.ts)

```typescript
// Pure functions with clear inputs/outputs
export async function findItem(
  backlog: Backlog,
  itemId: string
): Promise<Phase | Milestone | Task | Subtask | null> {
  // Implementation
  return result;
}

// Export types used by the functions
export type { Backlog, Phase, Milestone, Task, Subtask };
```

### 5. JSDoc Documentation Pattern

````typescript
/**
 * Computes SHA-256 hash of a file.
 *
 * @param prdPath - Absolute path to the PRD markdown file
 * @returns Promise resolving to hexadecimal hash string (full 64 characters)
 * @throws {SessionFileError} If file cannot be read
 *
 * @example
 * ```typescript
 * const hash = await hashPRD('/path/to/PRD.md');
 * // Returns: '14b9dc2a33c7a1234...'
 * ```
 */
export async function hashPRD(prdPath: string): Promise<string> {
  // Implementation
}
````

## Type Definitions to Use

### From src/core/models.ts

```typescript
// Session types
import type {
  SessionMetadata, // { id, hash, path, createdAt, parentSession }
  SessionState, // { metadata, prdSnapshot, taskRegistry, currentItemId }
  DeltaSession, // extends SessionState with oldPRD, newPRD, diffSummary
} from './models.js';

// Task hierarchy types
import type {
  Backlog, // { backlog: Phase[] }
  Phase, // { id, type, title, status, milestones: Milestone[] }
  Milestone, // { id, type, title, status, tasks: Task[] }
  Task, // { id, type, title, status, subtasks: Subtask[] }
  Subtask, // { id, type, title, status, storyPoints, dependencies, contextScope }
  Status, // 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
  ItemType, // 'Phase' | 'Milestone' | 'Task' | 'Subtask'
} from './models.js';

// PRP types
import type {
  PRPDocument, // { taskId, objective, context, implementationSteps, validationGates, successCriteria, references }
  PRPArtifact, // { taskId, prpPath, status, generatedAt }
  ValidationGate, // { level, description, command, manual }
  SuccessCriterion, // { description, satisfied }
} from './models.js';

// Zod schemas for validation
import {
  BacklogSchema, // Validates Backlog structure
  PRPDocumentSchema, // Validates PRPDocument structure
  PRPArtifactSchema, // Validates PRPArtifact structure
  StatusEnum, // Validates Status enum
} from 'zod';
```

## Existing Patterns in task-utils.ts

The `src/utils/task-utils.ts` file demonstrates the patterns to follow:

1. **Pure Functions**: All functions take inputs and return outputs without side effects
2. **Recursive Operations**: For traversing nested hierarchies
3. **Type Guards**: For narrowing union types
4. **Immutable Operations**: Return new objects instead of modifying existing ones
5. **Error Handling**: Custom error messages for edge cases
6. **Comprehensive JSDoc**: Every function has documentation with examples

## Session Directory Structure

From system_context.md, the session directory structure is:

```
plan/{sequence}_{hash}/
├── prd_snapshot.md       # PRD content at session start
├── tasks.json            # Single source of truth (immutable until completion)
├── architecture/         # Architectural research findings
│   ├── system_context.md
│   ├── groundswell_api.md
│   └── environment_config.md
├── prps/                 # Generated PRPs per task
│   ├── P1.M1.T1.S1.md
│   └── ...
└── artifacts/            # Temporary implementation artifacts
```

**Session ID Format**: `{sequence}_{hash}` where:

- `sequence`: Zero-padded 3-digit number (e.g., '001', '002')
- `hash`: First 12 characters of SHA-256 hash of PRD content

## Build and Test Configuration

### package.json Scripts

```json
{
  "build": "tsc",
  "dev": "tsx src/index.ts",
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "validate": "npm run build && eslint . --fix && prettier . --check && npm run test:run"
}
```

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
```

**Note**: 100% code coverage is enforced by the test configuration.

## Testing Patterns (from existing tests)

### Test File: tests/unit/core/task-utils.test.ts

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { findItem, getNextPendingItem } from '../../../src/utils/task-utils.js';

// Factory functions for test data
const createTestBacklog = (): Backlog => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Test Phase',
      status: 'Planned',
      milestones: [
        /* ... */
      ],
    },
  ],
});

describe('utils/task-utils', () => {
  it('should find item by ID', () => {
    // SETUP: Create test backlog
    const backlog = createTestBacklog();

    // EXECUTE
    const result = findItem(backlog, 'P1.M1.T1.S1');

    // VERIFY: Check result
    expect(result?.id).toBe('P1.M1.T1.S1');
  });
});
```

### Key Testing Patterns

1. **AAA Pattern**: Arrange-Act-Assert with explicit comments
2. **Factory Functions**: Create test data with helper functions
3. **Descriptive Test Names**: `should {expected behavior} when {condition}`
4. **Edge Case Coverage**: Test both success and failure scenarios
5. **Type Safety**: TypeScript types verified at compile time

## Dependencies and Imports

### Required Node.js Modules

```typescript
// File system operations (ESM)
import {
  readFile,
  writeFile,
  mkdir,
  rename,
  stat,
  readdir,
} from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';

// Crypto for hashing
import { createHash } from 'node:crypto';

// Stream for large files
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
```

### Required Internal Modules

```typescript
// Type definitions
import type {
  SessionMetadata,
  SessionState,
  DeltaSession,
  Backlog,
  PRPDocument,
} from './models.js';

// Zod validation
import { BacklogSchema, PRPDocumentSchema } from './models.js';
```

## Key Constraints and Requirements

1. **ESM Modules**: All imports must use `.js` extension
2. **Type Safety**: All functions must have full TypeScript types
3. **Error Handling**: Custom `SessionFileError` for all file operations
4. **Atomic Writes**: Use temp file + rename for `tasks.json`
5. **Immutability**: Return new objects, don't modify inputs
6. **100% Coverage**: All code paths must be tested
7. **Documentation**: JSDoc with examples for all public functions
8. **Naming Conventions**: camelCase for functions, PascalCase for types

## References

- Existing utilities: `src/utils/task-utils.ts`
- Type definitions: `src/core/models.ts`
- Error handling: `src/config/types.ts`
- Test patterns: `tests/unit/core/task-utils.test.ts`
- Session structure: `plan/001_14b9dc2a33c7/architecture/system_context.md`
