# Product Requirement Prompt (PRP): Create File System Utilities for Session Management

**Work Item**: P1.M2.T2.S3 - Create file system utilities for session management
**Point Value**: 2 points
**Parent Task**: P1.M2.T2 - Define Session and PRP Models
**Parent Milestone**: P1.M2 - Milestone 1.2: Core Data Structures
**Parent Phase**: P1 - Phase 1: Foundation & Environment Setup

---

## Goal

**Feature Goal**: Create `src/core/session-utils.ts` with five core utility functions that provide type-safe, error-handled file system operations for session management, including PRD hashing, session directory creation, atomic tasks.json persistence, and PRP document writing.

**Deliverable**: A new utility module `src/core/session-utils.ts` with five exported async functions (`hashPRD`, `createSessionDirectory`, `writeTasksJSON`, `readTasksJSON`, `writePRP`), a custom `SessionFileError` class, and comprehensive TypeScript tests at `tests/unit/core/session-utils.test.ts`.

**Success Definition**: All five functions are implemented with proper TypeScript types, comprehensive error handling using the custom `SessionFileError` class, atomic file writes for critical data, Zod schema validation for read operations, and 100% test coverage. The Session Manager (P3.M1) can use these utilities to create sessions, persist state, and manage PRPs without any file system concerns.

---

## Why

- **Session Manager Foundation**: P3.M1.T1 (Create SessionManager class) requires these utilities to create session directories, persist tasks.json, and manage PRP files
- **PRD Delta Detection**: P3.M1.T2 (Implement PRD Snapshot and Diffing) needs `hashPRD()` to compute SHA-256 hashes for change detection
- **Type Safety**: Using the Backlog and PRPDocument interfaces from models.ts ensures all file operations are type-safe
- **Data Integrity**: Atomic writes prevent corruption if the process crashes during write operations
- **Validation**: Zod schema validation ensures persisted data matches expected structure before use
- **Error Isolation**: Custom `SessionFileError` class provides consistent error handling across session operations

---

## What

Create a new utility module `src/core/session-utils.ts` with the following functions:

### 1. hashPRD(prdPath: string): Promise<string>

Computes the SHA-256 hash of a PRD markdown file and returns the full 64-character hexadecimal hash string.

**Implementation Requirements**:

- Use `crypto.createHash('sha256')` from Node.js
- Read file content with `fs.promises.readFile`
- Return full 64-character hex string
- Throw `SessionFileError` on read failure

### 2. createSessionDirectory(prdPath: string, sequence: number): Promise<string>

Creates the complete session directory structure at `plan/{sequence}_{hash}/` where `{hash}` is the first 12 characters of the PRD's SHA-256 hash.

**Implementation Requirements**:

- Compute PRD hash using `hashPRD()`
- Extract first 12 characters as session hash
- Pad sequence number to 3 digits (e.g., '001', '002')
- Create session path: `plan/{sequence}_{hash}/`
- Create subdirectories: `architecture/`, `prps/`, `artifacts/`
- Use `fs.promises.mkdir` with `recursive: true`
- Handle `EEXIST` error gracefully (directory already exists)
- Return absolute path to created session directory

### 3. writeTasksJSON(sessionPath: string, backlog: Backlog): Promise<void>

Atomically writes the tasks.json file to the session directory using temp file + rename pattern.

**Implementation Requirements**:

- Validate backlog with `BacklogSchema.parse()` before writing
- Serialize to JSON with 2-space indentation
- Use atomic write pattern: write to temp file, then rename
- Temp file name: `.tasks.json.{random}.tmp` in session directory
- Use `fs.promises.writeFile` then `fs.promises.rename`
- Clean up temp file on error
- Throw `SessionFileError` on write failure

### 4. readTasksJSON(sessionPath: string): Promise<Backlog>

Reads and validates the tasks.json file from a session directory.

**Implementation Requirements**:

- Build path to `tasks.json` in session directory
- Read file with `fs.promises.readFile`
- Parse JSON content
- Validate with `BacklogSchema.parse()`
- Return validated `Backlog` object
- Throw `SessionFileError` on read or parse failure

### 5. writePRP(sessionPath: string, taskId: string, prp: PRPDocument): Promise<void>

Writes a PRP document to the `prps/` subdirectory as markdown.

**Implementation Requirements**:

- Validate PRP with `PRPDocumentSchema.parse()` before writing
- Build path to `prps/{taskId}.md` in session directory
- Convert PRPDocument to markdown format
- Use atomic write pattern
- Throw `SessionFileError` on write failure

### Success Criteria

- [ ] All five functions implemented in `src/core/session-utils.ts`
- [ ] `SessionFileError` custom error class defined
- [ ] All functions use `async/await` pattern
- [ ] Atomic write pattern used for `writeTasksJSON` and `writePRP`
- [ ] Zod schema validation on write (pre-flight) and read (post-flight)
- [ ] 100% test coverage in `tests/unit/core/session-utils.test.ts`
- [ ] All error paths throw `SessionFileError`
- [ ] ESM imports use `.js` extension
- [ ] JSDoc documentation with examples on all functions

---

## All Needed Context

### Context Completeness Check

_Before implementing, validate: "If someone knew nothing about this codebase, would they have everything needed to implement these session utilities successfully?"_

This PRP provides:

- Exact function signatures with TypeScript types
- Node.js API usage patterns with official documentation URLs
- Atomic write implementation pattern
- Zod schema validation patterns from existing codebase
- Custom error class pattern from existing code
- Test patterns to follow
- All naming conventions and file placement instructions

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Contains Backlog, PRPDocument, and related interfaces; shows Zod schemas to use
  pattern: Lines 587-599 (Backlog interface), Lines 1114-1187 (PRPDocument interface)
  gotcha: Import with `.js` extension for ESM: './models.js'

- file: /home/dustin/projects/hacky-hack/src/utils/task-utils.ts
  why: Shows utility function patterns to follow: pure functions, JSDoc with examples, error handling
  pattern: Async functions with clear inputs/outputs, comprehensive JSDoc
  gotcha: Follow the same structure and documentation style

- file: /home/dustin/projects/hacky-hack/src/config/types.ts
  why: Shows custom error class pattern (EnvironmentValidationError)
  pattern: Extend Error class, add readonly properties for context
  gotcha: Include `name` property set to class name

- file: /home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts
  why: Shows test patterns for utility functions
  pattern: AAA (Arrange-Act-Assert) with comments, factory functions, edge case coverage
  gotcha: Use `vi.mock()` for fs operations, not real file I/O in tests

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Defines session directory structure and Session Manager responsibilities
  pattern: Session directory: plan/{sequence}_{hash}/ with subdirs architecture/, prps/, artifacts/
  gotcha: Session ID format uses first 12 chars of SHA-256 hash

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M2T2S3/research/nodejs_crypto_file_operations.md
  why: Complete Node.js crypto API patterns for SHA-256 hashing
  pattern: crypto.createHash('sha256').update(content).digest('hex')
  gotcha: Returns 64-character hex string, slice for 12-char session hash

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M2T2S3/research/codebase_analysis.md
  why: Project structure, build config, test patterns, ESM import requirements
  pattern: Vitest testing with 100% coverage, ESM modules with .js imports
  gotcha: All imports must use `.js` extension even for TypeScript files

- url: https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options
  why: Official documentation for crypto.createHash() API
  critical: Use 'sha256' as algorithm argument, returns Hash object

- url: https://nodejs.org/api/fs.html#fspromises-api
  why: Official documentation for fs/promises async file operations
  critical: Use readFile, writeFile, mkdir, rename from 'node:fs/promises'

- url: https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
  why: Official documentation for atomic rename operation
  critical: rename() is atomic on same filesystem (required for atomic writes)

- url: https://nodejs.org/api/path.html
  why: Official documentation for path manipulation (resolve, join, dirname, basename)
  critical: Use resolve() for absolute paths, join() for path concatenation
```

### Current Codebase Tree (relevant portions)

```bash
src/
├── core/
│   ├── models.ts              # IMPORT: Backlog, PRPDocument, BacklogSchema, PRPDocumentSchema
│   └── session-utils.ts       # CREATE: New utility module
├── config/
│   ├── constants.ts           # REFERENCE: Environment constants pattern
│   ├── environment.ts         # REFERENCE: Environment validation pattern
│   └── types.ts               # REFERENCE: Error class pattern (EnvironmentValidationError)
├── utils/
│   └── task-utils.ts          # REFERENCE: Utility function patterns (JSDoc, structure)
└── index.ts                   # Main entry point

tests/
├── unit/
│   └── core/
│       ├── models.test.ts     # REFERENCE: Zod schema testing patterns
│       ├── task-utils.test.ts # REFERENCE: Utility function testing patterns
│       └── session-utils.test.ts  # CREATE: New test file
└── manual/
    └── session-types-test.ts  # REFERENCE: Type verification pattern

plan/
└── 001_14b9dc2a33c7/          # Example session directory structure
    ├── prd_snapshot.md        # PRD state at session start
    ├── tasks.json             # Single source of truth (immutable)
    ├── architecture/          # Architectural research
    ├── prps/                  # Generated PRPs
    │   ├── P1.M1.T1.S1.md
    │   └── ...
    └── artifacts/             # Implementation artifacts
```

### Desired Codebase Tree (files to be added)

```bash
src/
└── core/
    └── session-utils.ts       # CREATE: New utility module with 5 functions + SessionFileError

tests/
└── unit/
    └── core/
        └── session-utils.test.ts  # CREATE: Comprehensive test suite
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: All imports MUST use `.js` extension for ESM modules
// BAD: import { Backlog } from './models';
// GOOD: import { Backlog } from './models.js';

// CRITICAL: Use node: prefix for built-in modules (explicit dependency)
// GOOD: import { readFile } from 'node:fs/promises';
// GOOD: import { createHash } from 'node:crypto';
// AVOID: import { readFile } from 'fs/promises';

// CRITICAL: crypto.createHash() returns Hash object, must call digest('hex')
// const hash = createHash('sha256').update(content).digest('hex');
// NOT: const hash = createHash('sha256', content); // This is wrong

// CRITICAL: Session hash is first 12 characters, NOT full 64
// BAD: const sessionHash = fullHash;
// GOOD: const sessionHash = fullHash.slice(0, 12);

// CRITICAL: Sequence number must be zero-padded to 3 digits
// BAD: `plan/${sequence}_${hash}` // produces "plan/1_abc..."
// GOOD: `plan/${String(sequence).padStart(3, '0')}_${hash}` // produces "plan/001_abc..."

// CRITICAL: Use atomic write pattern for tasks.json and PRP files
// Write to temp file first, then rename (rename is atomic on same filesystem)
// If process crashes between write and rename, target file is untouched

// CRITICAL: Handle EEXIST error when creating directories
// mkdir() throws EEXIST if directory already exists - this is OK
// try { await mkdir(path, { recursive: true }); } catch (e) { if (e.code !== 'EEXIST') throw e; }

// CRITICAL: Use BacklogSchema.parse() and PRPDocumentSchema.parse() for validation
// This throws ZodError if data is invalid - catch and wrap in SessionFileError

// CRITICAL: 100% test coverage is enforced by vitest.config.ts
// All functions must have tests for success and error paths

// CRITICAL: Use vi.mock() for fs operations in tests
// Don't use real file I/O in unit tests - mock fs/promises module

// CRITICAL: JSDoc must include @example blocks showing actual usage
// Follow the pattern from task-utils.ts

// CRITICAL: Custom Error class must set this.name = 'ClassName'
// This ensures error instanceof checks work correctly
```

---

## Implementation Blueprint

### Data Models and Structure

Create five utility functions that operate on existing type definitions:

```typescript
// Types from src/core/models.ts (no new types needed)
import type {
  Backlog, // From models.ts - task hierarchy
  PRPDocument, // From models.ts - PRP structure
} from './models.js';

import {
  BacklogSchema, // Zod validation for tasks.json
  PRPDocumentSchema, // Zod validation for PRP documents
} from './models.js';

// New custom error class
export class SessionFileError extends Error {
  readonly path: string;
  readonly operation: string;
  readonly code?: string;

  constructor(path: string, operation: string, cause?: Error) {
    super(
      `Failed to ${operation} at ${path}: ${cause?.message ?? 'unknown error'}`
    );
    this.name = 'SessionFileError';
    this.path = path;
    this.operation = operation;
    this.code = (cause as NodeJS.ErrnoException)?.code;
  }
}
```

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: CREATE src/core/session-utils.ts file structure
  - IMPLEMENT: File with proper imports and module structure
  - FOLLOW pattern: src/utils/task-utils.ts (imports, structure, documentation)
  - IMPORTS:
    * from 'node:fs/promises': readFile, writeFile, mkdir, rename
    * from 'node:crypto': createHash
    * from 'node:path': resolve, join, dirname, basename
    * from './models.js': Backlog, PRPDocument, BacklogSchema, PRPDocumentSchema
  - NAMING: session-utils.ts (matches task-utils.ts pattern)
  - PLACEMENT: src/core/session-utils.ts

Task 2: CREATE SessionFileError class
  - IMPLEMENT: Custom error class extending Error
  - FOLLOW pattern: src/config/types.ts (EnvironmentValidationError)
  - PROPERTIES (readonly):
    * path: string - File/path where error occurred
    * operation: string - Description of operation being performed
    * code?: string - Node.js errno code (ENOENT, EACCES, etc.)
  - CONSTRUCTOR: Accepts (path, operation, cause?) and builds message
  - SET: this.name = 'SessionFileError' for instanceof checks
  - PLACEMENT: Top of file, before utility functions

Task 3: IMPLEMENT hashPRD(prdPath: string): Promise<string>
  - IMPLEMENT: SHA-256 hash computation for PRD files
  - FOLLOW pattern: Section 1.2 of nodejs_crypto_file_operations.md research doc
  - STEPS:
    1. Read file content using fs.promises.readFile(prdPath, 'utf-8')
    2. Create hash: createHash('sha256').update(content).digest('hex')
    3. Return 64-character hex string
  - ERROR HANDLING: Wrap fs errors in SessionFileError with operation='read PRD'
  - JSDOC: Include @example showing hash computation
  - TYPE: async function returning Promise<string>

Task 4: IMPLEMENT createSessionDirectory(prdPath: string, sequence: number): Promise<string>
  - IMPLEMENT: Session directory creation with full structure
  - FOLLOW pattern: Section 3.1 of nodejs_crypto_file_operations.md research doc
  - STEPS:
    1. Call hashPRD(prdPath) to get full hash
    2. Extract sessionHash: fullHash.slice(0, 12)
    3. Pad sequence: String(sequence).padStart(3, '0')
    4. Build sessionId: `${sequencePadded}_${sessionHash}`
    5. Build sessionPath: resolve('plan', sessionId)
    6. Create directories: [sessionPath, 'architecture', 'prps', 'artifacts']
    7. Use mkdir with { recursive: true, mode: 0o755 }
    8. Handle EEXIST gracefully (directory exists)
  - ERROR HANDLING: Wrap fs errors in SessionFileError with operation='create session directory'
  - RETURN: Absolute path to session directory
  - JSDOC: Include @example showing directory creation
  - TYPE: async function returning Promise<string>

Task 5: IMPLEMENT writeTasksJSON(sessionPath: string, backlog: Backlog): Promise<void>
  - IMPLEMENT: Atomic write of tasks.json with Zod validation
  - FOLLOW pattern: Section 2.1 of nodejs_crypto_file_operations.md research doc
  - STEPS:
    1. Validate backlog: BacklogSchema.parse(backlog)
    2. Build tasksPath: resolve(sessionPath, 'tasks.json')
    3. Serialize: JSON.stringify(validated, null, 2)
    4. Generate temp path: .tasks.json.{randomBytes(8).hex}.tmp
    5. Write temp file: writeFile(tempPath, content, { mode: 0o644 })
    6. Atomic rename: rename(tempPath, tasksPath)
    7. On error: unlink(tempPath) in try/catch
  - ERROR HANDLING: Wrap fs/validation errors in SessionFileError with operation='write tasks.json'
  - JSDOC: Include @example showing atomic write
  - TYPE: async function returning Promise<void>
  - DEPENDENCIES: Import randomBytes from 'node:crypto'

Task 6: IMPLEMENT readTasksJSON(sessionPath: string): Promise<Backlog>
  - IMPLEMENT: Read and validate tasks.json from session
  - STEPS:
    1. Build tasksPath: resolve(sessionPath, 'tasks.json')
    2. Read file: readFile(tasksPath, 'utf-8')
    3. Parse JSON: JSON.parse(content)
    4. Validate: BacklogSchema.parse(parsed)
    5. Return validated Backlog
  - ERROR HANDLING: Wrap fs/parse/validation errors in SessionFileError with operation='read tasks.json'
  - JSDOC: Include @example showing read and validation
  - TYPE: async function returning Promise<Backlog>

Task 7: IMPLEMENT writePRP(sessionPath: string, taskId: string, prp: PRPDocument): Promise<void>
  - IMPLEMENT: Atomic write of PRP markdown file
  - FOLLOW pattern: writeTasksJSON (same atomic write approach)
  - STEPS:
    1. Validate PRP: PRPDocumentSchema.parse(prp)
    2. Build prpPath: resolve(sessionPath, 'prps', `${taskId}.md`)
    3. Convert to markdown: prpToMarkdown(validated)
    4. Use atomic write pattern (same as writeTasksJSON)
  - ERROR HANDLING: Wrap fs/validation errors in SessionFileError with operation='write PRP'
  - HELPER FUNCTION: Create prpToMarkdown(prp: PRPDocument): string
  - MARKDOWN FORMAT:
    ```markdown
    # {taskId}

    ## Objective
    {objective}

    ## Context
    {context}

    ## Implementation Steps
    {numbered list of steps}

    ## Validation Gates
    {level by level details}

    ## Success Criteria
    {checkbox list}

    ## References
    {list of references}
    ```
  - JSDOC: Include @example showing PRP write
  - TYPE: async function returning Promise<void>

Task 8: CREATE prpToMarkdown helper function
  - IMPLEMENT: Convert PRPDocument to markdown string
  - FOLLOW pattern: PRP template from PROMPTS.md
  - SECTIONS:
    * Header: # {taskId}
    * Objective: ## Objective\n\n{objective}
    * Context: ## Context\n\n{context}
    * Implementation Steps: ## Implementation Steps\n\n{numbered list}
    * Validation Gates: ## Validation Gates\n\n{level details}
    * Success Criteria: ## Success Criteria\n\n{checkbox list}
    * References: ## References\n\n{list}
  - RETURN: Complete markdown string
  - PRIVATE FUNCTION: Not exported, internal helper

Task 9: CREATE tests/unit/core/session-utils.test.ts
  - IMPLEMENT: Comprehensive test suite for all functions
  - FOLLOW pattern: tests/unit/core/task-utils.test.ts
  - MOCK: vi.mock('node:fs/promises') for all fs operations
  - MOCK: vi.mock('node:crypto') for hash operations
  - TEST CASES per function:
    * Success path (happy case)
    * File not found (ENOENT)
    * Permission denied (EACCES)
    * Invalid data (Zod validation errors)
    * Edge cases (empty content, existing directory)
  - FACTORY FUNCTIONS:
    * createTestBacklog(): Backlog
    * createTestPRPDocument(): PRPDocument
  - COVERAGE: Must achieve 100% (enforced by vitest.config.ts)
  - NAMING: tests/unit/core/session-utils.test.ts

Task 10: VERIFY ESM imports work correctly
  - TEST: Import with .js extension works
  - TEST: All functions are exported
  - TEST: SessionFileError is exported
  - TEST: Types are correctly inferred
  - COMMAND: node --input-type=module -e "import { hashPRD } from './src/core/session-utils.js';"
````

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// PATTERN 1: Custom Error Class (from src/config/types.ts)
// ============================================================================

/**
 * Custom error for session file operations.
 *
 * @remarks
 * Provides consistent error handling for all session file system operations.
 * Captures the path, operation, and underlying error code for debugging.
 *
 * @example
 * ```typescript
 * try {
 *   await readFile(path, 'utf-8');
 * } catch (error) {
 *   throw new SessionFileError(path, 'read PRD', error as Error);
 * }
 * ```
 */
export class SessionFileError extends Error {
  readonly path: string;
  readonly operation: string;
  readonly code?: string;

  constructor(path: string, operation: string, cause?: Error) {
    const err = cause as NodeJS.ErrnoException;
    super(`Failed to ${operation} at ${path}: ${err?.message ?? 'unknown error'}`);
    this.name = 'SessionFileError';
    this.path = path;
    this.operation = operation;
    this.code = err?.code;
  }
}

// ============================================================================
// PATTERN 2: Hash PRD with crypto (from research doc section 1.2)
// ============================================================================

/**
 * Computes SHA-256 hash of a PRD file.
 *
 * @param prdPath - Absolute path to the PRD markdown file
 * @returns Promise resolving to 64-character hexadecimal hash string
 * @throws {SessionFileError} If file cannot be read
 *
 * @example
 * ```typescript
 * const hash = await hashPRD('/path/to/PRD.md');
 * // Returns: '14b9dc2a33c7a1234567890abcdef...'
 * ```
 */
export async function hashPRD(prdPath: string): Promise<string> {
  try {
    const content = await readFile(prdPath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    throw new SessionFileError(prdPath, 'read PRD', error as Error);
  }
}

// ============================================================================
// PATTERN 3: Session Directory Creation (from research doc section 3.1)
// ============================================================================

/**
 * Creates session directory structure.
 *
 * @param prdPath - Path to PRD file for hash computation
 * @param sequence - Session sequence number (will be zero-padded to 3 digits)
 * @returns Promise resolving to absolute path of created session directory
 * @throws {SessionFileError} If directory creation fails
 *
 * @example
 * ```typescript
 * const sessionPath = await createSessionDirectory('/path/to/PRD.md', 1);
 * // Returns: '/absolute/path/to/plan/001_14b9dc2a33c7'
 * ```
 */
export async function createSessionDirectory(
  prdPath: string,
  sequence: number
): Promise<string> {
  try {
    // Compute PRD hash
    const fullHash = await hashPRD(prdPath);
    const sessionHash = fullHash.slice(0, 12);

    // Build session ID and path
    const sessionId = `${String(sequence).padStart(3, '0')}_${sessionHash}`;
    const sessionPath = resolve('plan', sessionId);

    // Create directory structure
    const directories = [
      sessionPath,
      join(sessionPath, 'architecture'),
      join(sessionPath, 'prps'),
      join(sessionPath, 'artifacts'),
    ];

    for (const dir of directories) {
      try {
        await mkdir(dir, { recursive: true, mode: 0o755 });
      } catch (error: any) {
        // EEXIST is OK (directory already exists)
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }

    return sessionPath;
  } catch (error) {
    if (error instanceof SessionFileError) {
      throw error;
    }
    throw new SessionFileError(prdPath, 'create session directory', error as Error);
  }
}

// ============================================================================
// PATTERN 4: Atomic Write (from research doc section 2.1)
// ============================================================================

/**
 * Atomically writes data to a file using temp file + rename.
 *
 * @param targetPath - Final destination path
 * @param data - Data to write
 * @returns Promise that resolves when write completes
 * @throws {SessionFileError} If write or rename fails
 */
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = resolve(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`
  );

  try {
    await writeFile(tempPath, data, { mode: 0o644 });
    await rename(tempPath, targetPath);
  } catch (error) {
    // Clean up temp file
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new SessionFileError(targetPath, 'atomic write', error as Error);
  }
}

// ============================================================================
// PATTERN 5: Write Tasks JSON with Zod Validation
// ============================================================================

/**
 * Atomically writes tasks.json to session directory.
 *
 * @param sessionPath - Absolute path to session directory
 * @param backlog - Backlog object to write
 * @throws {SessionFileError} If validation or write fails
 *
 * @example
 * ```typescript
 * const backlog: Backlog = { backlog: [/* ... */] };
 * await writeTasksJSON('/path/to/session', backlog);
 * ```
 */
export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  try {
    // Validate with Zod schema
    const validated = BacklogSchema.parse(backlog);

    // Serialize to JSON
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

// ============================================================================
// PATTERN 6: Read and Validate Tasks JSON
// ============================================================================

/**
 * Reads and validates tasks.json from session directory.
 *
 * @param sessionPath - Absolute path to session directory
 * @returns Promise resolving to validated Backlog object
 * @throws {SessionFileError} If file cannot be read or is invalid
 *
 * @example
 * ```typescript
 * const backlog = await readTasksJSON('/path/to/session');
 * console.log(backlog.backlog.length); // Number of phases
 * ```
 */
export async function readTasksJSON(sessionPath: string): Promise<Backlog> {
  try {
    const tasksPath = resolve(sessionPath, 'tasks.json');
    const content = await readFile(tasksPath, 'utf-8');
    const parsed = JSON.parse(content);
    return BacklogSchema.parse(parsed);
  } catch (error) {
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'read tasks.json',
      error as Error
    );
  }
}

// ============================================================================
// PATTERN 7: PRP to Markdown Conversion
// ============================================================================

/**
 * Converts PRPDocument to markdown format.
 *
 * @param prp - PRP document to convert
 * @returns Markdown string
 */
function prpToMarkdown(prp: PRPDocument): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${prp.taskId}`);
  sections.push('');

  // Objective
  sections.push('## Objective');
  sections.push('');
  sections.push(prp.objective);
  sections.push('');

  // Context
  sections.push('## Context');
  sections.push('');
  sections.push(prp.context);
  sections.push('');

  // Implementation Steps
  sections.push('## Implementation Steps');
  sections.push('');
  prp.implementationSteps.forEach((step, i) => {
    sections.push(`${i + 1}. ${step}`);
  });
  sections.push('');

  // Validation Gates
  sections.push('## Validation Gates');
  sections.push('');
  prp.validationGates.forEach((gate) => {
    sections.push(`### Level ${gate.level}`);
    sections.push('');
    sections.push(gate.description);
    if (gate.manual) {
      sections.push('');
      sections.push('*Manual validation required*');
    } else if (gate.command) {
      sections.push('');
      sections.push('```bash');
      sections.push(gate.command);
      sections.push('```');
    }
    sections.push('');
  });

  // Success Criteria
  sections.push('## Success Criteria');
  sections.push('');
  prp.successCriteria.forEach((criterion) => {
    const checkbox = criterion.satisfied ? '[x]' : '[ ]';
    sections.push(`- ${checkbox} ${criterion.description}`);
  });
  sections.push('');

  // References
  sections.push('## References');
  sections.push('');
  prp.references.forEach((ref) => {
    sections.push(`- ${ref}`);
  });

  return sections.join('\n');
}

// ============================================================================
// PATTERN 8: Write PRP with Atomic Write
// ============================================================================

/**
 * Writes PRP document to prps/ subdirectory.
 *
 * @param sessionPath - Absolute path to session directory
 * @param taskId - Task ID for filename
 * @param prp - PRP document to write
 * @throws {SessionFileError} If validation or write fails
 *
 * @example
 * ```typescript
 * const prp: PRPDocument = { /* ... */ };
 * await writePRP('/path/to/session', 'P1.M2.T2.S3', prp);
 * // Creates: /path/to/session/prps/P1.M2.T2.S3.md
 * ```
 */
export async function writePRP(
  sessionPath: string,
  taskId: string,
  prp: PRPDocument
): Promise<void> {
  try {
    // Validate with Zod schema
    const validated = PRPDocumentSchema.parse(prp);

    // Convert to markdown
    const content = prpToMarkdown(validated);

    // Write atomically
    const prpPath = resolve(sessionPath, 'prps', `${taskId}.md`);
    await atomicWrite(prpPath, content);
  } catch (error) {
    if (error instanceof SessionFileError) {
      throw error;
    }
    throw new SessionFileError(
      resolve(sessionPath, 'prps', `${taskId}.md`),
      'write PRP',
      error as Error
    );
  }
}
````

### Integration Points

```yaml
MODELS_TS:
  - import_from: src/core/models.js
  - types: Backlog, PRPDocument
  - schemas: BacklogSchema, PRPDocumentSchema
  - gotcha: Use .js extension for ESM

NODEJS_MODULES:
  - fs/promises: readFile, writeFile, mkdir, rename, unlink
  - crypto: createHash, randomBytes
  - path: resolve, join, dirname, basename

SESSION_MANAGER (FUTURE):
  - uses: hashPRD for PRD change detection
  - uses: createSessionDirectory for session initialization
  - uses: writeTasksJSON for state persistence
  - uses: readTasksJSON for state loading
  - uses: writePRP for PRP generation

TEST_FRAMEWORK:
  - framework: Vitest (configured in vitest.config.ts)
  - coverage: 100% enforced
  - mocking: vi.mock() for fs and crypto modules
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after completing implementation - fix before proceeding
npm run lint              # ESLint check
npm run format           # Prettier format
npm run type-check       # TypeScript compiler check (tsc --noEmit)

# Or run all at once:
npm run validate         # Runs lint, format, and type-check

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the session utilities
npm test -- tests/unit/core/session-utils.test.ts

# Run with coverage to verify 100% coverage
npm run test:coverage

# Expected: All tests pass, 100% coverage maintained. If failing:
# 1. Read test output carefully
# 2. Check mock setup for fs/promises and crypto
# 3. Verify error handling paths
# 4. Re-run until all pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify ESM imports work
node --input-type=module << 'EOF'
import { hashPRD, createSessionDirectory, writeTasksJSON, readTasksJSON, writePRP } from './src/core/session-utils.js';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const testDir = join(tmpdir(), 'session-utils-test');
await mkdir(testDir, { recursive: true });

// Create test PRD
const prdPath = join(testDir, 'PRD.md');
await writeFile(prdPath, '# Test PRD\n\nThis is a test PRD.');

// Test hashPRD
const hash = await hashPRD(prdPath);
console.log('Hash length:', hash.length); // Should be 64

// Test createSessionDirectory
const sessionPath = await createSessionDirectory(prdPath, 1);
console.log('Session path:', sessionPath);

// Clean up
await rm(testDir, { recursive: true, force: true });
console.log('Integration test: PASS');
EOF

# Expected: All functions execute without errors, outputs show correct values
```

### Level 4: Manual Verification (Creative & Domain-Specific)

```bash
# Verify the module can be imported by future SessionManager
node --input-type=module << 'EOF'
// Simulate SessionManager importing the utilities
import { SessionFileError } from './src/core/session-utils.js';

// Test error class
const error = new SessionFileError('/test/path', 'test operation', new Error('test cause'));
console.log('Error name:', error.name); // Should be 'SessionFileError'
console.log('Error path:', error.path); // Should be '/test/path'
console.log('Error operation:', error.operation); // Should be 'test operation'
console.log('Is SessionFileError:', error instanceof SessionFileError); // Should be true
console.log('Manual verification: PASS');
EOF

# Verify markdown format for PRP output
node --input-type=module << 'EOF'
import { prpToMarkdown } from './src/core/session-utils.js';
// Note: prpToMarkdown is not exported, so this tests the public API only
console.log('PRP format verification: Test with writePRP function');
EOF

# Expected: Error class works correctly, instanceof checks pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] `npm run validate` passes with zero errors
- [ ] `npm test -- tests/unit/core/session-utils.test.ts` passes all tests
- [ ] `npm run test:coverage` shows 100% coverage for session-utils.ts
- [ ] ESM import test succeeds with `.js` extension

### Feature Validation

- [ ] All five functions implemented: hashPRD, createSessionDirectory, writeTasksJSON, readTasksJSON, writePRP
- [ ] SessionFileError class with path, operation, code properties
- [ ] Atomic write pattern used for writeTasksJSON and writePRP
- [ ] Zod validation on write (pre-flight) and read (post-flight)
- [ ] Session hash is first 12 characters of SHA-256
- [ ] Sequence number zero-padded to 3 digits
- [ ] Directory structure includes architecture/, prps/, artifacts/

### Code Quality Validation

- [ ] All imports use `.js` extension for ESM
- [ ] Node.js built-ins use `node:` prefix
- [ ] JSDoc comments with @example on all exported functions
- [ ] Follows task-utils.ts patterns (structure, documentation style)
- [ ] Error paths throw SessionFileError with descriptive messages
- [ ] EEXIST errors handled gracefully in directory creation
- [ ] Temp files cleaned up on write failure

### Documentation & Deployment

- [ ] JSDoc cross-references research docs where applicable
- [ ] @example blocks show realistic usage
- [ ] File can be imported by future SessionManager module
- [ ] No console.log statements (use proper error handling)

---

## Anti-Patterns to Avoid

- ❌ Don't use optional properties (`prop?: type`) - use `prop: type | null` for nullable fields
- ❌ Don't skip the `.js` extension in imports - ESM requires it
- ❌ Don't use sync file operations - always use async `fs/promises`
- ❌ Don't write directly to target file - use atomic write pattern for critical data
- ❌ Don't forget to handle EEXIST when creating directories
- ❌ Don't skip Zod validation - always validate on read and write
- ❌ Don't use real file I/O in tests - mock fs/promises module
- ❌ Don't forget to clean up temp files on write failure
- ❌ Don't use the full 64-character hash - session ID uses first 12 only
- ❌ Don't forget to pad sequence number to 3 digits (use `padStart(3, '0')`)
- ❌ Don't skip error handling - all fs operations should be wrapped in try/catch
- ❌ Don't use console.log for errors - throw SessionFileError instead
- ❌ Don't forget to set `this.name = 'SessionFileError'` in error class
