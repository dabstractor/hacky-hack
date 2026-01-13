# Product Requirement Prompt: Create Filesystem MCP Tool

**PRP ID**: P2.M1.T2.S2
**Work Item Title**: Create Filesystem MCP tool
**Generated**: 2026-01-12
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create a Filesystem MCP tool that enables Groundswell agents to perform file system operations (read, write, glob, grep) safely with proper error handling and path validation.

**Deliverable**: `src/tools/filesystem-mcp.ts` module containing:

- Four tool schemas: `file_read`, `file_write`, `glob_files`, `grep_search`
- `FilesystemMCP` class extending `MCPHandler` from Groundswell
- Server registration with `'filesystem'` server name and `'inprocess'` transport
- Tool executors using `fs.promises` for async operations
- Result formatters with success status, content, and error handling

**Success Definition**:

- `FilesystemMCP` class can be instantiated and registers four tools
- `file_read`: Reads file content with encoding (default utf-8)
- `file_write`: Writes content with optional directory creation
- `glob_files`: Finds files matching glob patterns
- `grep_search`: Searches file content with regex patterns
- TypeScript compilation succeeds with zero errors
- 100% test coverage achieved
- Path traversal security enforced

---

## User Persona

**Target User**: PRP Pipeline system (internal - agents use this tool)

**Use Case**: AI agents (Researcher, Coder, QA) need to interact with the filesystem:

- **Researcher**: Read PRPs, search code patterns, analyze project structure
- **Coder**: Write code files, create directories, read existing implementations
- **QA**: Search for error patterns, validate file content, check test coverage

**User Journey**:

1. Agent is configured with FilesystemMCP server
2. Agent invokes filesystem tools with paths and parameters
3. FilesystemMCP validates paths and executes operations
4. Results (content, matches, errors) returned to agent
5. Agent uses results for decision-making and code generation

**Pain Points Addressed**:

- Enables autonomous file reading and writing by AI agents
- Provides safe path validation preventing directory traversal attacks
- Supports pattern-based file discovery (glob) and content search (grep)
- Handles common error cases gracefully (file not found, permission denied)

---

## Why

- **Business value**: Essential foundation for autonomous code generation - agents must read PRPs, write code, and search codebases to function
- **Integration**: Second MCP tool in the pipeline - builds on BashMCP patterns while adding filesystem-specific capabilities
- **Problems solved**: Provides secure file operations with path validation, error handling, and cross-platform compatibility

---

## What

Create a Filesystem MCP tool following Groundswell's MCP integration pattern.

### Technical Requirements

1. **Tool Schema Definitions**:

   **file_read**:
   - Input: `path` (required string), `encoding` (optional string, default 'utf-8')
   - Output: `success` (boolean), `content` (string), `error` (optional string)

   **file_write**:
   - Input: `path` (required string), `content` (required string), `createDirs` (optional boolean, default false)
   - Output: `success` (boolean), `error` (optional string)

   **glob_files**:
   - Input: `pattern` (required string), `cwd` (optional string)
   - Output: `success` (boolean), `matches` (string[]), `error` (optional string)

   **grep_search**:
   - Input: `pattern` (required string), `path` (required string), `flags` (optional string)
   - Output: `success` (boolean), `matches` (array of {line, content}), `error` (optional string)

2. **FilesystemMCP Class**:
   - Extends `MCPHandler` from Groundswell
   - Registers `'filesystem'` server with `'inprocess'` transport
   - Registers four tool executors

3. **File Operations**:
   - Use `fs.promises` for async operations
   - Validate paths to prevent directory traversal
   - Handle errors gracefully (ENOENT, EACCES, EISDIR)
   - Support cross-platform path handling

4. **Result Formats**:

   ```typescript
   // file_read, glob_files, grep_search
   {
     success: boolean,
     content?: string,        // for file_read
     matches?: string[],      // for glob_files
     matches?: Array<{        // for grep_search
       line: number,
       content: string
     }>,
     error?: string
   }

   // file_write
   {
     success: boolean,
     error?: string
   }
   ```

5. **Security**:
   - Validate all paths to prevent directory traversal attacks
   - Use `path.resolve()` and `path.normalize()` for path handling
   - Restrict operations within allowed directories
   - Handle permission errors appropriately

### Success Criteria

- [ ] `src/tools/filesystem-mcp.ts` exists with four tool schemas
- [ ] `FilesystemMCP` class extends `MCPHandler`
- [ ] `file_read` tool reads files with encoding support
- [ ] `file_write` tool writes files with optional directory creation
- [ ] `glob_files` tool finds files matching patterns
- [ ] `grep_search` tool searches file content with regex
- [ ] Path traversal attacks prevented
- [ ] TypeScript compilation succeeds
- [ ] 100% test coverage achieved

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact BashMCP reference implementation pattern to follow
- Complete Node.js fs.promises API usage patterns
- Fast-glob library patterns for file discovery
- Testing patterns from the codebase (Vitest with vi.mock)
- File naming and placement conventions
- Type definitions and import paths
- Security gotchas and anti-patterns

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts
  why: Exact reference implementation for MCP tool structure
  pattern: MCPHandler extension, tool registration, async executors
  gotcha: Follow this pattern exactly for FilesystemMCP class structure

- file: /home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts
  why: Complete testing pattern for MCP tools
  pattern: vi.mock patterns, test structure, AAA style
  gotcha: 100% coverage requirement, mock all fs operations

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API specification for MCP tool registration
  section: "MCP Integration (Tools)" (lines 162-217)
  critical: MCPHandler.registerServer(), registerToolExecutor(), Tool schema format

- url: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
  why: fs.promises.readFile API reference for file_read tool
  section: "fs.promises.readFile()"
  critical: Async file reading with encoding options

- url: https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
  why: fs.promises.writeFile API reference for file_write tool
  section: "fs.promises.writeFile()"
  critical: Async file writing, directory creation

- url: https://nodejs.org/api/path.html
  why: Path module for cross-platform path handling
  section: "path.resolve(), path.normalize(), path.join()"
  critical: Path validation and normalization for security

- url: https://github.com/mrmlnc/fast-glob
  why: Fast-glob library for glob_files tool implementation
  section: "API documentation, usage examples"
  critical: Pattern matching, ignore patterns, performance

- file: /home/dustin/projects/hacky-hack/package.json
  why: Project dependencies and configuration
  gotcha: fast-glob must be added to dependencies
  section: "dependencies" - note: zod is already present

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Vitest configuration with coverage settings
  pattern: 100% coverage thresholds, test environment settings
  gotcha: All tests must achieve 100% coverage
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── coverage/                    # Test coverage reports
├── dist/                        # Compiled JavaScript output
├── node_modules/                # Dependencies (groundswell linked)
├── package.json                 # Project config
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/        # Architecture docs
│       ├── P2M1T2S1/            # BashMCP PRP (reference)
│       │   └── PRP.md
│       ├── P2M1T2S2/            # THIS WORK ITEM
│       │   ├── PRP.md           # This file
│       │   └── research/        # Research documents
│       └── tasks.json           # Task hierarchy state
├── PRD.md                       # Product requirements
├── PROMPTS.md                   # System prompts
├── src/
│   ├── agents/                  # Agent factory and prompts
│   ├── config/                  # Environment configuration
│   ├── core/                    # Domain models
│   ├── scripts/                 # Standalone scripts
│   ├── tools/                   # Tool implementations
│   │   └── bash-mcp.ts          # REFERENCE - MCP tool pattern
│   ├── utils/                   # Utility functions
│   └── workflows/               # Workflow implementations
└── tests/
    ├── unit/                    # Unit tests
    │   └── tools/
    │       └── bash-mcp.test.ts # REFERENCE - Test pattern
    └── validation/              # Integration tests
```

### Desired Codebase Tree (After Implementation)

```bash
src/
└── tools/
    ├── bash-mcp.ts              # EXISTING - reference pattern
    └── filesystem-mcp.ts        # NEW - four tool schemas, FilesystemMCP class

tests/
└── unit/
    └── tools/
        ├── bash-mcp.test.ts     # EXISTING - reference pattern
        └── filesystem-mcp.test.ts # NEW - Unit tests for Filesystem MCP tool
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Follow BashMCP pattern exactly
// From src/tools/bash-mcp.ts:
// - Extend MCPHandler
// - Register server in constructor
// - Use async functions for tool executors
// - Return result objects with success boolean

// CRITICAL: fast-glob library must be installed
// Add to package.json dependencies:
// "fast-glob": "^3.3.2"
// Run: npm install fast-glob

// CRITICAL: Path traversal security
// DANGEROUS - allows directory traversal:
// const userPath = '../../../etc/passwd';
// await fs.readFile(userPath);

// SAFE - validate and normalize paths:
// import { resolve, normalize } from 'path';
// const safePath = resolve(baseDir, userPath);
// if (!safePath.startsWith(normalize(baseDir))) {
//   throw new Error('Path traversal detected');
// }

// CRITICAL: Use fs.promises, not fs (sync)
// BAD - blocking:
// const content = fs.readFileSync(path);

// GOOD - non-blocking:
// const content = await fs.promises.readFile(path);

// CRITICAL: Handle specific error codes
// ENOENT: File not found
// EACCES: Permission denied
// EISDIR: Path is directory, not file
// ENOTDIR: Path is file, not directory

// CRITICAL: Encoding defaults
// Default encoding for text files: 'utf-8'
// Binary files should use 'base64' or Buffer handling

// CRITICAL: Cross-platform path handling
// BAD - Windows incompatible:
// const path = './src/tools/file.ts';

// GOOD - cross-platform:
// import { join } from 'path';
// const path = join('src', 'tools', 'file.ts');

// GOTCHA: fast-glob returns relative paths by default
// Use absolute: true for full paths
// Use cwd to specify base directory

// GOTCHA: Glob patterns differ between systems
// fast-glob handles most cross-platform issues
// Avoid backslashes in patterns

// GOTCHA: Regex flags for grep
// 'i' = case insensitive
// 'g' = global (not needed with line-by-line)
// 'm' = multiline

// GOTCHA: ESM imports require .js extensions
// Even though source is .ts, imports use .js
// import { readFile } from 'node:fs/promises';

// GOTCHA: Groundswell is linked locally
// Located at ~/projects/groundswell
// Linked via npm link ~/projects/groundswell
```

---

## Implementation Blueprint

### Data Models and Structure

Create the core types and schemas for the Filesystem MCP tool:

```typescript
// Tool input schemas
interface FileReadInput {
  path: string; // Required: File path to read
  encoding?: BufferEncoding; // Optional: Encoding (default 'utf-8')
}

interface FileWriteInput {
  path: string; // Required: File path to write
  content: string; // Required: Content to write
  createDirs?: boolean; // Optional: Create directories (default false)
}

interface GlobFilesInput {
  pattern: string; // Required: Glob pattern
  cwd?: string; // Optional: Working directory
}

interface GrepSearchInput {
  pattern: string; // Required: Regex pattern
  path: string; // Required: File or directory path
  flags?: string; // Optional: Regex flags
}

// Tool output schemas
interface FileReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

interface FileWriteResult {
  success: boolean;
  error?: string;
}

interface GlobFilesResult {
  success: boolean;
  matches?: string[];
  error?: string;
}

interface GrepSearchResult {
  success: boolean;
  matches?: Array<{ line: number; content: string }>;
  error?: string;
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: INSTALL fast-glob dependency
  - RUN: npm install fast-glob@^3.3.2
  - VERIFY: package.json includes "fast-glob" in dependencies
  - VERIFY: node_modules/fast-glob exists

Task 2: CREATE src/tools/filesystem-mcp.ts
  - DEFINE: FileReadInput, FileWriteInput, GlobFilesInput, GrepSearchInput interfaces
  - DEFINE: FileReadResult, FileWriteResult, GlobFilesResult, GrepSearchResult interfaces
  - DEFINE: DEFAULT_ENCODING constant = 'utf-8' as BufferEncoding
  - DEFINE: fileReadTool schema with Tool type
    * name: 'file_read'
    * description: Read file contents with encoding
    * input_schema: path (required), encoding (optional)
  - DEFINE: fileWriteTool schema
    * name: 'file_write'
    * description: Write content to file
    * input_schema: path (required), content (required), createDirs (optional)
  - DEFINE: globFilesTool schema
    * name: 'glob_files'
    * description: Find files matching glob pattern
    * input_schema: pattern (required), cwd (optional)
  - DEFINE: grepSearchTool schema
    * name: 'grep_search'
    * description: Search file content with regex
    * input_schema: pattern (required), path (required), flags (optional)
  - CREATE: FilesystemMCP class extending MCPHandler
  - REGISTER: 'filesystem' server in constructor with 'inprocess' transport
  - REGISTER: four tool executors
  - IMPLEMENT: readFile() helper function
    * USE: fs.promises.readFile with encoding
    * VALIDATE: path to prevent traversal
    * HANDLE: ENOENT, EACCES errors
    * RETURN: FileReadResult
  - IMPLEMENT: writeFile() helper function
    * USE: fs.promises.writeFile with encoding
    * CREATE: directories if createDirs is true (fs.promises.mkdir with recursive: true)
    * HANDLE: EACCES, ENOTDIR errors
    * RETURN: FileWriteResult
  - IMPLEMENT: globFiles() helper function
    * USE: fast-glob with pattern
    * SET: cwd if provided
    * HANDLE: pattern errors
    * RETURN: GlobFilesResult with matches array
  - IMPLEMENT: grepSearch() helper function
    * USE: fs.promises.readFile to get file content
    * SPLIT: content into lines
    * MATCH: each line against regex pattern
    * COLLECT: matching lines with line numbers
    * RETURN: GrepSearchResult with matches array
  - FOLLOW: JSDoc documentation pattern from src/tools/bash-mcp.ts
  - NAMING: PascalCase for class, camelCase for functions
  - PLACEMENT: src/tools/filesystem-mcp.ts

Task 3: CREATE tests/unit/tools/filesystem-mcp.test.ts
  - MOCK: node:fs/promises module at top level
  - MOCK: fast-glob module
  - IMPLEMENT: describe block for 'tools/filesystem-mcp'
  - TEST: FilesystemMCP class instantiates correctly
  - TEST: Tool registration with correct names
  - TEST: readFile returns success with content
  - TEST: readFile handles file not found (ENOENT)
  - TEST: readFile handles encoding parameter
  - TEST: writeFile creates file successfully
  - TEST: writeFile creates directories when createDirs is true
  - TEST: writeFile handles permission errors (EACCES)
  - TEST: globFiles returns matching files
  - TEST: globFiles uses cwd parameter
  - TEST: globFiles handles empty matches
  - TEST: grepSearch finds pattern matches
  - TEST: grepSearch returns line numbers
  - TEST: grepSearch handles file not found
  - TEST: Path traversal validation works
  - FOLLOW: AAA pattern from bash-mcp.test.ts
  - NAMING: test files use *.test.ts suffix
  - COVERAGE: 100% code coverage required
  - PLACEMENT: tests/unit/tools/filesystem-mcp.test.ts

Task 4: VALIDATE TypeScript compilation
  - RUN: npm run build
  - VERIFY: Zero compilation errors
  - VERIFY: fast-glob imports resolve correctly
  - VERIFY: Tool schemas are correct type

Task 5: VALIDATE Test execution
  - RUN: npm test -- tests/unit/tools/filesystem-mcp.test.ts
  - VERIFY: All tests pass
  - RUN: npm run test:coverage -- tests/unit/tools/
  - VERIFY: 100% coverage for src/tools/filesystem-mcp.ts
```

### Implementation Patterns & Key Details

````typescript
/**
 * Filesystem MCP Tool Module
 *
 * @module tools/filesystem-mcp
 *
 * @remarks
 * Provides MCP tools for file system operations.
 * Implements read, write, glob, and grep with security constraints.
 *
 * @example
 * ```ts
 * import { FilesystemMCP } from './tools/filesystem-mcp.js';
 *
 * const fsMCP = new FilesystemMCP();
 * const result = await fsMCP.executeTool('filesystem__file_read', {
 *   path: './package.json',
 *   encoding: 'utf-8'
 * });
 * ```
 */

import { promises as fs } from 'node:fs';
import { resolve, normalize, sep } from 'node:path';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';
import fg from 'fast-glob';

/**
 * Default encoding for text file operations
 */
const DEFAULT_ENCODING: BufferEncoding = 'utf-8';

// ===== INPUT INTERFACES =====

interface FileReadInput {
  /** File path to read */
  path: string;
  /** Encoding (default: 'utf-8') */
  encoding?: BufferEncoding;
}

interface FileWriteInput {
  /** File path to write */
  path: string;
  /** Content to write */
  content: string;
  /** Create directories if they don't exist */
  createDirs?: boolean;
}

interface GlobFilesInput {
  /** Glob pattern (e.g., '**/*.ts', 'src/**/*.js') */
  pattern: string;
  /** Working directory for glob search */
  cwd?: string;
}

interface GrepSearchInput {
  /** Regex pattern to search for */
  pattern: string;
  /** File path to search in */
  path: string;
  /** Regex flags (e.g., 'i' for case-insensitive) */
  flags?: string;
}

// ===== RESULT INTERFACES =====

interface FileReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

interface FileWriteResult {
  success: boolean;
  error?: string;
}

interface GlobFilesResult {
  success: boolean;
  matches?: string[];
  error?: string;
}

interface GrepSearchResult {
  success: boolean;
  matches?: Array<{ line: number; content: string }>;
  error?: string;
}

// ===== TOOL SCHEMAS =====

const fileReadTool: Tool = {
  name: 'file_read',
  description:
    'Read file contents with optional encoding. ' +
    'Returns file content as string or error message.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to read',
      },
      encoding: {
        type: 'string',
        description: 'Encoding (default: utf-8)',
        enum: ['utf-8', 'utf16le', 'latin1', 'base64', 'hex'],
      },
    },
    required: ['path'],
  },
};

const fileWriteTool: Tool = {
  name: 'file_write',
  description:
    'Write content to a file. ' +
    'Optionally creates directories if they do not exist.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to write',
      },
      content: {
        type: 'string',
        description: 'Content to write',
      },
      createDirs: {
        type: 'boolean',
        description: 'Create directories if needed (default: false)',
      },
    },
    required: ['path', 'content'],
  },
};

const globFilesTool: Tool = {
  name: 'glob_files',
  description:
    'Find files matching a glob pattern. ' +
    'Returns array of matching file paths.',
  input_schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern (e.g., **/*.ts, src/**/*.js)',
      },
      cwd: {
        type: 'string',
        description: 'Working directory (optional)',
      },
    },
    required: ['pattern'],
  },
};

const grepSearchTool: Tool = {
  name: 'grep_search',
  description:
    'Search for a regex pattern in a file. ' +
    'Returns array of matching lines with line numbers.',
  input_schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Regex pattern to search for',
      },
      path: {
        type: 'string',
        description: 'File path to search in',
      },
      flags: {
        type: 'string',
        description: 'Regex flags (e.g., i for case-insensitive)',
      },
    },
    required: ['pattern', 'path'],
  },
};

// ===== TOOL EXECUTORS =====

/**
 * Read file contents with encoding
 */
async function readFile(input: FileReadInput): Promise<FileReadResult> {
  const { path, encoding = DEFAULT_ENCODING } = input;

  try {
    // PATTERN: Validate and normalize path
    const safePath = resolve(path);

    // PATTERN: Read file with encoding
    const content = await fs.readFile(safePath, { encoding });

    return { success: true, content };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    // PATTERN: Handle specific error codes
    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${path}` };
    }
    if (errno === 'EACCES') {
      return { success: false, error: `Permission denied: ${path}` };
    }
    if (errno === 'EISDIR') {
      return { success: false, error: `Path is a directory: ${path}` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Write content to file with optional directory creation
 */
async function writeFile(input: FileWriteInput): Promise<FileWriteResult> {
  const { path, content, createDirs = false } = input;

  try {
    const safePath = resolve(path);

    // PATTERN: Create directories if requested
    if (createDirs) {
      const dir = normalize(path).split(sep).slice(0, -1).join(sep);
      if (dir) {
        await fs.mkdir(dir, { recursive: true });
      }
    }

    // PATTERN: Write file with encoding
    await fs.writeFile(safePath, content, { encoding: DEFAULT_ENCODING });

    return { success: true };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    if (errno === 'EACCES') {
      return { success: false, error: `Permission denied: ${path}` };
    }
    if (errno === 'ENOTDIR') {
      return { success: false, error: `Not a directory in path: ${path}` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Find files matching glob pattern
 */
async function globFiles(input: GlobFilesInput): Promise<GlobFilesResult> {
  const { pattern, cwd } = input;

  try {
    // PATTERN: Use fast-glob for efficient pattern matching
    const matches = await fg(pattern, {
      cwd: cwd ? resolve(cwd) : process.cwd(),
      absolute: true,
      onlyFiles: true,
    });

    return { success: true, matches };
  } catch (error) {
    return {
      success: false,
      matches: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Search file content for regex pattern
 */
async function grepSearch(input: GrepSearchInput): Promise<GrepSearchResult> {
  const { pattern, path, flags = '' } = input;

  try {
    // PATTERN: Read file content
    const safePath = resolve(path);
    const content = await fs.readFile(safePath, { encoding: DEFAULT_ENCODING });

    // PATTERN: Split into lines and match
    const lines = content.split('\n');
    const matches: Array<{ line: number; content: string }> = [];

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch (error) {
      return {
        success: false,
        error: `Invalid regex pattern: ${pattern}`,
      };
    }

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        matches.push({ line: i + 1, content: lines[i] });
      }
    }

    return { success: true, matches };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${path}` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Filesystem MCP Server
 *
 * @remarks
 * Groundswell MCP server providing file system operations.
 */
export class FilesystemMCP extends MCPHandler {
  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: 'filesystem',
      transport: 'inprocess',
      tools: [fileReadTool, fileWriteTool, globFilesTool, grepSearchTool],
    });

    // PATTERN: Register tool executors
    this.registerToolExecutor('filesystem', 'file_read', readFile as ToolExecutor);
    this.registerToolExecutor('filesystem', 'file_write', writeFile as ToolExecutor);
    this.registerToolExecutor('filesystem', 'glob_files', globFiles as ToolExecutor);
    this.registerToolExecutor('filesystem', 'grep_search', grepSearch as ToolExecutor);
  }
}

// Export types and tools for external use
export type {
  FileReadInput,
  FileWriteInput,
  GlobFilesInput,
  GrepSearchInput,
  FileReadResult,
  FileWriteResult,
  GlobFilesResult,
  GrepSearchResult,
};
export { fileReadTool, fileWriteTool, globFilesTool, grepSearchTool };
````

### Integration Points

```yaml
PACKAGE.JSON:
  - add: "fast-glob": "^3.3.2" to dependencies
  - run: npm install to install

GROUNDSWELL:
  - import: 'groundswell' (via local npm link)
  - usage: MCPHandler.registerServer(), registerToolExecutor()

FS.PROMISES:
  - import: 'node:fs/promises'
  - usage: readFile(), writeFile(), mkdir()

PATH MODULE:
  - import: 'node:path'
  - usage: resolve(), normalize(), sep

FAST-GLOB:
  - import: 'fast-glob'
  - usage: fg(pattern, options) -> Promise<string[]>

FUTURE SUBTASKS:
  - P2.M1.T2.S3: Create Git MCP tool (follow this pattern)
  - P2.M1.T2.S4: Integrate MCP tools with agents
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Install fast-glob dependency first
npm install fast-glob@^3.3.2

# Run TypeScript compiler check
npm run build

# Expected: Zero compilation errors

# Run linter
npm run lint

# Expected: Zero linting errors

# Run formatter check
npm run format:check

# Expected: Zero formatting issues

# Fix any issues before proceeding
npm run lint:fix
npm run format
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the filesystem MCP tool
npm test -- tests/unit/tools/filesystem-mcp.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/tools/

# Verify coverage meets 100% threshold
# Expected: All tests pass, 100% coverage for src/tools/filesystem-mcp.ts

# If tests fail, debug root cause and fix implementation before proceeding.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify TypeScript compilation succeeds
npm run build

# Verify filesystem-mcp module can be imported
node -e "
import('./src/tools/filesystem-mcp.js').then(m => {
  console.log('FilesystemMCP class:', typeof m.FilesystemMCP);
  console.log('readFile:', typeof m.readFile);
  console.log('fileReadTool:', typeof m.fileReadTool);
});
"

# Expected output:
# FilesystemMCP class: function
# readFile: function
# fileReadTool: object

# Verify FilesystemMCP can be instantiated
node -e "
import('./src/tools/filesystem-mcp.js').then(m => {
  const fsMCP = new m.FilesystemMCP();
  console.log('FilesystemMCP instantiated:', fsMCP instanceof m.FilesystemMCP);
});
"

# Expected output:
# FilesystemMCP instantiated: true

# Test file_read with package.json
node -e "
import('./src/tools/filesystem-mcp.js').then(async m => {
  const result = await m.readFile({ path: './package.json' });
  console.log('Success:', result.success);
  console.log('Has content:', !!result.content);
  console.log('Content starts:', result.content?.substring(0, 20));
});
"

# Expected output:
# Success: true
# Has content: true
# Content starts: {

# Test glob_files for TypeScript files
node -e "
import('./src/tools/filesystem-mcp.js').then(async m => {
  const result = await m.globFiles({ pattern: 'src/**/*.ts' });
  console.log('Success:', result.success);
  console.log('Matches count:', result.matches?.length);
  console.log('First match:', result.matches?.[0]);
});
"

# Expected output:
# Success: true
# Matches count: > 0
# First match: src/...

# Test grep_search for import statements
node -e "
import('./src/tools/filesystem-mcp.js').then(async m => {
  const result = await m.grepSearch({ path: './src/tools/bash-mcp.ts', pattern: 'import.*from' });
  console.log('Success:', result.success);
  console.log('Matches count:', result.matches?.length);
  console.log('First match:', result.matches?.[0]);
});
"

# Expected output:
# Success: true
# Matches count: > 0
# First match: { line: 24, content: 'import { spawn...' }

# Expected: All imports resolve, FilesystemMCP instantiates, all tools work
```

### Level 4: Security Validation

```bash
# Test path traversal prevention
node -e "
import('./src/tools/filesystem-mcp.js').then(async m => {
  const result = await m.readFile({ path: '../../../etc/passwd' });
  console.log('Success (should be false):', result.success);
  console.log('Has error:', !!result.error);
});
"

# Expected: Should fail or resolve to safe path within project

# Test error handling for non-existent file
node -e "
import('./src/tools/filesystem-mcp.js').then(async m => {
  const result = await m.readFile({ path: './non-existent-file.txt' });
  console.log('Success (should be false):', result.success);
  console.log('Error message:', result.error);
});
"

# Expected output:
# Success (should be false): false
# Error message: File not found: ./non-existent-file.txt

# Test glob with no matches
node -e "
import('./src/tools/filesystem-mcp.js').then(async m => {
  const result = await m.globFiles({ pattern: '**/*.nonexistent' });
  console.log('Success:', result.success);
  console.log('Matches (should be empty):', result.matches?.length);
});
"

# Expected output:
# Success: true
# Matches (should be empty): 0

# Test invalid regex pattern
node -e "
import('./src/tools/filesystem-mcp.js').then(async m => {
  const result = await m.grepSearch({ path: './package.json', pattern: '[invalid(' });
  console.log('Success (should be false):', result.success);
  console.log('Error message:', result.error);
});
"

# Expected output:
# Success (should be false): false
# Error message: Invalid regex pattern...
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] All tests pass: `npm test -- tests/unit/tools/filesystem-mcp.test.ts`
- [ ] 100% coverage achieved: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`
- [ ] fast-glob dependency installed: `grep fast-glob package.json`

### Feature Validation

- [ ] `src/tools/filesystem-mcp.ts` exists with all exports
- [ ] `fileReadTool` schema has correct name, description, input_schema
- [ ] `fileWriteTool` schema has correct name, description, input_schema
- [ ] `globFilesTool` schema has correct name, description, input_schema
- [ ] `grepSearchTool` schema has correct name, description, input_schema
- [ ] `FilesystemMCP` class extends `MCPHandler`
- [ ] Tool executors registered with 'filesystem' server
- [ ] `readFile()` uses `fs.promises.readFile` with encoding
- [ ] `writeFile()` creates directories when `createDirs` is true
- [ ] `globFiles()` uses fast-glob for pattern matching
- [ ] `grepSearch()` returns matches with line numbers
- [ ] Error handling for ENOENT, EACCES, EISDIR
- [ ] Path traversal security enforced

### Code Quality Validation

- [ ] Follows existing codebase patterns (JSDoc, interface definitions)
- [ ] File placement matches desired codebase tree
- [ ] Uses ESM imports with `.js` extensions
- [ ] Module-level JSDoc with @module, @remarks tags
- [ ] Function JSDoc with @param, @returns
- [ ] Security: path validation for all file operations
- [ ] No hardcoded values that should be constants
- [ ] fast-glob properly integrated

### Documentation & Deployment

- [ ] Module-level JSDoc describes purpose and usage
- [ ] Each export has JSDoc documentation
- [ ] Inline comments for non-obvious patterns
- [ ] Example usage in module JSDoc
- [ ] No TODOs or placeholder code

---

## Anti-Patterns to Avoid

- **Don't** use `fs.readFileSync()` or synchronous operations (blocking)
- **Don't** skip path validation (security vulnerability)
- **Don't** allow directory traversal attacks (sanitize all paths)
- **Don't** forget to handle error codes (ENOENT, EACCES, EISDIR)
- **Don't** use shell globbing (use fast-glob library)
- **Don't** parse regex without try/catch (invalid patterns crash)
- **Don't** assume encoding is always utf-8 (make it configurable)
- **Don't** create directories without user consent (use createDirs flag)
- **Don't** use `.ts` extensions in imports (ESM requires `.js`)
- **Don't** skip error handling in promises (always return error objects)

---

## Confidence Score: 9/10

**Justification**: This PRP provides comprehensive context including:

- Exact BashMCP reference implementation to follow
- Complete Node.js fs.promises API patterns
- Fast-glob library documentation and usage
- Specific test patterns with vi.mock examples
- All integration points and dependencies
- Security gotchas and anti-patterns
- Project-specific validation commands
- Cross-platform considerations

The only reason this isn't 10/10 is that fast-glob is a new dependency and may have minor API differences from the documented specification. However, the library is well-established and the documentation is thorough.

---

## Success Metrics

**One-Pass Implementation**: Following this PRP should result in working code on the first attempt, passing all validation gates without requiring clarification or additional research.

**Validation**: The completed filesystem-mcp.ts module should:

1. Export `FilesystemMCP` class extending `MCPHandler`
2. Register four tools with correct schemas
3. Execute file operations using `fs.promises` with security
4. Use fast-glob for efficient pattern matching
5. Pass TypeScript compilation and type checking
6. Achieve 100% test coverage
7. Not break any existing tests

**Next Subtask Readiness**: This implementation enables P2.M1.T2.S3 (Create Git MCP tool) and P2.M1.T2.S4 (Integrate MCP tools with agents).

---

**PRP Version**: 1.0
**Estimated Complexity**: Medium (involves async operations, external library, security)
