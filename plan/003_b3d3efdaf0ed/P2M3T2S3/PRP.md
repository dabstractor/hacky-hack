# Product Requirement Prompt (PRP): Artifact Viewer Tool

---

## Goal

**Feature Goal**: Create a `prd artifacts` CLI command that provides convenient viewing, listing, and comparing of pipeline artifacts stored in session directories.

**Deliverable**: Complete artifact viewer CLI command with three subcommands:
- `prd artifacts list` - Lists all artifacts with metadata
- `prd artifacts view <task-id>` - Displays specific artifact content with syntax highlighting
- `prd artifacts diff <task1> <task2>` - Compares artifacts between tasks

**Success Definition**:
- `prd artifacts list` displays all artifacts in a formatted table with Task ID, artifact type, file path, and status
- `prd artifacts view <task-id>` shows validation-results.json, execution-summary.md, and artifacts-list.json with syntax highlighting for JSON/MD
- `prd artifacts diff <task1> <task2>` produces a unified diff with colored additions/deletions
- All commands support --output format option (table, json)
- Syntax highlighting respects NO_COLOR and TTY detection
- Tests cover all functionality with 100% coverage

## User Persona

**Target User**: Developers and project managers using the PRD pipeline who need to inspect, validate, and compare implementation artifacts generated during pipeline execution.

**Use Case**: When reviewing pipeline execution results, users need to:
- See what artifacts were generated and where they are located
- View the content of specific artifacts (validation results, execution summaries, file lists)
- Compare artifacts between different tasks to understand changes
- Quickly navigate to artifact files for deeper inspection

**User Journey**:
1. User runs `prd artifacts list` to see all available artifacts
2. User identifies a task of interest and runs `prd artifacts view <task-id>` to see its artifacts
3. User views validation results, execution summary, and created file list with syntax highlighting
4. User runs `prd artifacts diff <task1> <task2>` to compare artifacts between two tasks
5. User uses the information to debug issues, validate implementation, or understand changes

**Pain Points Addressed**:
- Current artifact storage exists but no convenient viewer (noted in system_context.md)
- Artifacts stored in session directory structure that's not easily discoverable
- No syntax highlighting for JSON/MD artifact content
- No easy way to compare artifacts between tasks
- Manual navigation to artifact files is cumbersome

## Why

- **Visibility**: Artifacts are the primary output of PRP execution - users need easy access to validate implementation
- **Debugging**: Validation results and execution summaries provide critical debugging information
- **Review**: Comparing artifacts between tasks helps understand incremental changes
- **Developer Experience**: Syntax highlighting and formatted output make artifact inspection pleasant
- **Completeness**: Completes the observability toolset started with `prd inspect` and error reporting (P2.M3.T2.S2)

## What

**User-Visible Behavior**:

### Command Structure

```bash
# List all artifacts
prd artifacts list [--session <id>] [--output <format>]

# View specific task artifacts
prd artifacts view <task-id> [--session <id>] [--output <format>]

# Compare artifacts between tasks
prd artifacts diff <task1> <task2> [--session <id>] [--output <format>]
```

### Output Examples

**`prd artifacts list` (table format)**:
```
┌────────────────────┬─────────────────┬────────────────────────────────────────┬──────────┐
│ Task ID            │ Artifact Type   │ Path                                   │ Status   │
├────────────────────┼─────────────────┼────────────────────────────────────────┼──────────┤
│ P1.M1.T1.S1        │ validation      │ plan/001_abc/artifacts/P1.M1.T1.S1/... │ ✓ Passed │
│ P1.M1.T1.S1        │ implementation  │ plan/001_abc/artifacts/P1.M1.T1.S1/... │ ✓        │
│ P1.M1.T1.S2        │ validation      │ plan/001_abc/artifacts/P1.M1.T1.S2/... │ ✗ Failed │
│ P1.M1.T1.S2        │ implementation  │ plan/001_abc/artifacts/P1.M1.T1.S2/... │          │
└────────────────────┴─────────────────┴────────────────────────────────────────┴──────────┘
```

**`prd artifacts view P1.M1.T1.S1`**:
```
Artifacts for P1.M1.T1.S1: Environment Setup

validation-results.json:
{
  "level": 1,
  "description": "Syntax & Style validation",
  "success": true,
  "command": "npm run lint",
  ...
}

execution-summary.md:
# Execution Summary

**Status**: Success

## Validation Results

✓ Level 1: Syntax & Style validation - PASSED
✓ Level 2: Unit Tests - PASSED
✓ Level 3: Integration Tests - PASSED

## Artifacts Created
- src/utils/session-helper.ts
- tests/unit/utils/session-helper.test.ts
```

**`prd artifacts diff P1.M1.T1.S1 P1.M1.T1.S2`**:
```
Comparing artifacts: P1.M1.T1.S1 → P1.M1.T1.S2

validation-results.json:
─────────────────────────────────────────────────────────────
  {
-   "success": true,
+   "success": false,
    "level": 1,
+   "error": "Type validation failed"
  }

Changes: +1 -0
```

### Success Criteria

- [ ] `prd artifacts list` displays all artifacts with metadata in table format
- [ ] `prd artifacts view <task-id>` shows all three artifact files with syntax highlighting
- [ ] `prd artifacts diff <task1> <task2>` produces colored unified diff
- [ ] All commands support --output json for machine-readable output
- [ ] Syntax highlighting works for JSON and Markdown content
- [ ] Output respects NO_COLOR environment variable
- [ ] Tests achieve 100% coverage
- [ ] Integration with existing CLI is seamless

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Validation**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file paths and patterns for all new files
- Complete command structure following existing patterns
- Artifact storage structure with exact file locations
- Syntax highlighting library recommendations with code examples
- Diff utility implementation with terminal-friendly output
- Testing patterns matching existing codebase
- Integration points with CLI and SessionManager
- All type definitions and interfaces needed

### Documentation & References

```yaml
# MUST READ - Existing Command Patterns
- file: src/cli/commands/inspect.ts
  why: Complete command handler pattern to follow (class structure, execute method, options handling)
  pattern: Class-based command with constructor, async execute(options), private helper methods
  critical: Use SessionManager for session loading, follow exact command registration pattern
  gotcha: Commands use optional planDir/prdPath constructor params with defaults

- file: src/cli/index.ts
  why: CLI entry point with command registration patterns (lines 80-120 for inspect command)
  pattern: program.command().description().argument().option().action()
  critical: Import command class and instantiate with planDir/prdPath before calling execute()
  gotcha: Action handler receives parsed options, pass directly to command.execute()

- file: src/core/session-manager.ts
  why: Session loading and discovery methods needed for artifact access
  pattern: loadSession(sessionPath), findLatestSession(planDir), listSessions(planDir)
  critical: loadSession() returns SessionState with metadata, taskRegistry, prdSnapshot
  gotcha: Session paths are absolute - use resolve() for joining

# MUST READ - Artifact Storage Structure
- file: plan/003_b3d3efdaf0ed/docs/system_context.md (lines 111-154)
  why: Documents session directory structure and artifact locations
  pattern: Artifacts stored at session/artifacts/{taskId}/ with three standard files
  critical: Artifact path = {sessionPath}/artifacts/{taskId}/{filename}
  gotcha: Task IDs use dots but directories use underscores (e.g., P1.M1.T1.S1 -> P1_M1_T1_S1)

- file: src/agents/prp-runtime.ts (lines 245-285: #writeArtifacts method)
  why: Shows artifact creation and file structure
  pattern: Creates artifacts directory, writes three files atomically
  critical: Files are validation-results.json, execution-summary.md, artifacts-list.json
  gotcha: Directory path uses join(sessionPath, 'artifacts', subtask.id) - subtask.id has dots

- file: src/agents/prp-executor.ts
  why: ValidationGateResult and ExecutionResult interface definitions
  pattern: Interfaces for validation results (level, success, command, stdout, stderr)
  critical: validation-results.json matches ValidationGateResult interface
  gotcha: Exit code is null when validation is skipped

# MUST READ - Display Utilities
- file: src/utils/display/table-formatter.ts
  why: Pre-built table formatting with cli-table3 and Unicode box-drawing
  pattern: formatSessionTable(), formatTaskHierarchyTable() with colored output
  critical: Use existing table styles for consistency
  gotcha: Table chars object defines Unicode box-drawing characters

- file: src/utils/display/status-colors.ts
  why: Status indicator functions matching existing UI patterns
  pattern: getStatusIndicator(status) returns colored Unicode symbol
  critical: Use exact color scheme (green/red/cyan/yellow/gray)
  gotcha: Status values are union of specific strings from models.ts

- file: src/utils/display/tree-renderer.ts
  why: ASCII tree rendering patterns (may be useful for artifact hierarchy)
  pattern: Indentation-based tree with Unicode branch characters
  critical: Consistent visual style with other CLI output
  gotcha: Tree supports filtering by status

# MUST READ - Testing Patterns
- file: tests/unit/cli/commands/inspect.test.ts
  why: Complete CLI command testing patterns to follow
  pattern: Mock SessionManager, test execute() with various options, validate output
  critical: Use vi.mock() for SessionManager, vi.spyOn() for console.log
  gotcha: Tests mock process.exit to catch early terminations

- file: tests/integration/inspect-command.test.ts
  why: Integration test patterns for commands with real file operations
  pattern: Create temp directories, write real files, test command execution
  critical: Cleanup temp dirs in afterEach, use real SessionManager for integration
  gotcha: Use mkdtempSync() for unique temp directories

# RESEARCH - CLI Command Patterns
- docfile: plan/003_b3d3efdaf0ed/P2M3T2S3/research/01-cli-command-patterns.md
  why: Command structure, SessionManager usage, display utility patterns
  recommendation: Follow InspectCommand class pattern exactly
  pattern: Constructor with optional params, async execute(options), private helpers

# RESEARCH - Artifact Storage
- docfile: plan/003_b3d3efdaf0ed/P2M3T2S3/research/02-artifact-storage.md
  why: Artifact file types, directory structure, access patterns
  recommendation: Use SessionManager.loadSession() to get session path
  pattern: Artifacts at session/artifacts/{taskId}/, three standard files per task

# RESEARCH - Syntax Highlighting
- docfile: plan/003_b3d3efdaf0ed/P2M3T2S3/research/03-syntax-highlighting.md
  why: Library recommendations and implementation patterns for terminal highlighting
  url: https://www.npmjs.com/package/cli-highlight
  url: https://www.npmjs.com/package/json-colorizer
  recommendation: Use cli-highlight for general syntax, json-colorizer for JSON
  pattern: Respect NO_COLOR env var, TTY detection, provide --color flag

# RESEARCH - Diff Utilities
- docfile: plan/003_b3d3efdaf0ed/P2M3T2S3/research/04-diff-utilities.md
  why: Library recommendations for generating diffs with terminal-friendly output
  url: https://github.com/kpdecker/jsdiff
  url: https://github.com/benjamine/jsondiffpatch
  recommendation: Use diff package for unified diffs, jsondiffpatch for JSON
  pattern: Color scheme matches existing (green additions, red deletions)

# QUICK REFERENCE
- docfile: plan/003_b3d3efdaf0ed/P2M3T2S3/research/QUICK_REFERENCE.md
  why: All key patterns and decisions in one place
  recommendation: Commands, file structure, dependencies, color scheme, paths
```

### Current Codebase Tree

```bash
src/
├── cli/
│   ├── index.ts                         # CLI entry point - register artifacts command here
│   └── commands/
│       ├── inspect.ts                   # Existing command pattern to follow
│       └── artifacts.ts                 # NEW: Artifacts command handler
├── core/
│   ├── session-manager.ts               # Session loading and discovery
│   ├── models.ts                        # Type definitions
│   └── session-utils.ts                 # Session utilities
├── agents/
│   ├── prp-runtime.ts                   # Artifact creation (#writeArtifacts method)
│   └── prp-executor.ts                  # ValidationGateResult interface
├── utils/
│   ├── display/
│   │   ├── status-colors.ts             # Status indicators
│   │   ├── table-formatter.ts           # Table formatting
│   │   └── syntax-highlighter.ts        # NEW: Syntax highlighting wrapper
│   ├── logger.ts                        # Logging system
│   └── artifact-differ.ts               # NEW: Artifact comparison utilities
└── workflows/
    └── prp-pipeline.ts                  # Main pipeline

tests/
├── unit/
│   └── cli/
│       └── commands/
│           ├── inspect.test.ts          # Existing command test pattern
│           └── artifacts.test.ts        # NEW: Artifacts command tests
└── integration/
    ├── inspect-command.test.ts          # Existing integration test pattern
    └── artifacts-command.test.ts        # NEW: Artifacts integration tests
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── cli/
│   └── commands/
│       └── artifacts.ts                 # NEW: Main artifacts command handler
├── utils/
│   ├── display/
│   │   └── syntax-highlighter.ts        # NEW: Syntax highlighting wrapper
│   └── artifact-differ.ts               # NEW: Artifact diff utilities

tests/
├── unit/
│   └── cli/
│       └── commands/
│           └── artifacts.test.ts        # NEW: Unit tests for artifacts command
└── integration/
    └── artifacts-command.test.ts        # NEW: Integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Task ID directory naming
// Task IDs use dots (P1.M1.T1.S1) but directories use underscores (P1_M1_T1_S1)
// When constructing artifact paths: taskId.replace(/\./g, '_')
// Example: session/artifacts/P1_M1_T1_S1/validation-results.json

// CRITICAL: Session path resolution
// Use SessionManager.loadSession() to get session state with path
// Session path is in sessionState.metadata.path (absolute path)
// DO NOT construct session paths manually - use SessionManager methods

// CRITICAL: File system operations
// Use promises API from 'node:fs/promises' for async operations
// Use 'node:path' for path operations (resolve, join, basename)
// Always use resolve() for joining absolute paths

// CRITICAL: CLI command registration
// Commands are registered in src/cli/index.ts using program.command()
// Action handler receives options from commander parsing
// Import command class and instantiate with planDir/prdPath before execute()

// CRITICAL: Color output
// Respect NO_COLOR environment variable (check process.env.NO_COLOR)
// Check TTY with process.stdout.isTTY
// Provide --color flag (auto/always/never) for user control
// Use existing chalk instance from src/utils/display/status-colors.ts patterns

// CRITICAL: Table formatting
// Use cli-table3 with existing char styles from table-formatter.ts
// Consistent colWidths and alignment patterns
// Use chalk for colored cell content

// CRITICAL: Error handling in commands
// Use process.exit(1) for fatal errors (after logging)
// Use try-catch for async operations
// Log errors with appropriate severity (info/warn/error)

// CRITICAL: Test mocking
// Use vi.mock() for module-level mocking (SessionManager, fs)
// Use vi.hoisted() for mock function declarations before vi.mock()
// Use vi.spyOn() for spying on console.log and process.exit
// Mock process.exit to throw Error('process.exit(N)') to catch exits

// CRITICAL: Artifact file structure
// Three files per task: validation-results.json, execution-summary.md, artifacts-list.json
// Files may not exist if task hasn't executed yet - handle gracefully
// validation-results.json structure matches ValidationGateResult interface

// CRITICAL: Syntax highlighting libraries
// cli-highlight: supports 180+ languages, use 'json' and 'markdown' languages
// json-colorizer: simpler JSON-specific highlighting with customizable colors
// Both respect NO_COLOR but also check yourself for consistency

// CRITICAL: Diff output format
// Use + prefix for additions (green), - prefix for deletions (red)
// Use unified diff format for consistency with git
// Show summary statistics (additions, deletions) in header

// CRITICAL: Test coverage requirement
// vitest.config.ts enforces 100% coverage for all new code
// Run tests with npm test -- tests/unit/cli/commands/artifacts.test.ts
// Coverage with npm run test:coverage
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Artifact viewer types
 * File: src/cli/commands/artifacts.ts
 */

import type { SessionState } from '../../core/models.js';
import type { ValidationGateResult } from '../../agents/prp-executor.js';

/**
 * Artifact metadata for listing
 */
export interface ArtifactMetadata {
  /** Task ID */
  taskId: string;
  /** Task title */
  taskTitle: string;
  /** Artifact type: validation, implementation, summary, list */
  artifactType: 'validation' | 'implementation' | 'summary' | 'list';
  /** Relative path from session directory */
  path: string;
  /** Full absolute path */
  fullPath: string;
  /** File exists check */
  exists: boolean;
  /** File size in bytes */
  size: number;
  /** Task status */
  taskStatus: string;
}

/**
 * Artifact content for viewing
 */
export interface ArtifactContent {
  /** Task ID */
  taskId: string;
  /** Task title */
  taskTitle: string;
  /** Validation results (if exists) */
  validationResults?: ValidationGateResult;
  /** Execution summary content (if exists) */
  executionSummary?: string;
  /** Artifacts list (if exists) */
  artifactsList?: string[];
  /** Which files are present */
  presentFiles: Array<'validation-results.json' | 'execution-summary.md' | 'artifacts-list.json'>;
}

/**
 * Artifact diff result
 */
export interface ArtifactDiff {
  /** Task 1 ID */
  task1Id: string;
  /** Task 2 ID */
  task2Id: string;
  /** Has differences */
  hasChanges: boolean;
  /** Validation results diff */
  validationDiff?: string;
  /** Execution summary diff */
  summaryDiff?: string;
  /** Artifacts list diff */
  listDiff?: string;
  /** Statistics */
  stats: {
    additions: number;
    deletions: number;
  };
}

/**
 * Artifacts command options
 */
export interface ArtifactsListOptions {
  /** Session ID (optional, defaults to latest) */
  session?: string;
  /** Output format */
  output: 'table' | 'json';
  /** Use color */
  color?: boolean;
}

export interface ArtifactsViewOptions {
  /** Task ID to view */
  taskId: string;
  /** Session ID (optional) */
  session?: string;
  /** Output format */
  output: 'table' | 'json';
  /** Use color */
  color?: boolean;
}

export interface ArtifactsDiffOptions {
  /** First task ID */
  task1Id: string;
  /** Second task ID */
  task2Id: string;
  /** Session ID (optional) */
  session?: string;
  /** Output format */
  output: 'table' | 'json';
  /** Use color */
  color?: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/display/syntax-highlighter.ts
  - IMPLEMENT: SyntaxHighlighter class with highlightJSON(), highlightMarkdown(), highlightCode()
  - PATTERN: Wrapper around cli-highlight library with NO_COLOR and TTY detection
  - FUNCTIONS:
    - highlightJSON(data: unknown, color?: boolean): string
    - highlightMarkdown(content: string, color?: boolean): string
    - highlightCode(content: string, language: string, color?: boolean): string
    - shouldUseColor(mode: 'auto' | 'always' | 'never'): boolean
  - NAMING: SyntaxHighlighter class, camelCase methods
  - DEPENDENCIES: cli-highlight package (npm install cli-highlight)
  - PLACEMENT: Display utilities directory

Task 2: CREATE src/utils/artifact-differ.ts
  - IMPLEMENT: ArtifactDiffer class with diffJSON(), diffText(), formatUnifiedDiff()
  - PATTERN: Use diff package for unified diffs, jsondiffpatch for JSON-specific diffs
  - FUNCTIONS:
    - diffArtifacts(oldContent: string, newContent: string, options): string
    - diffJSON(oldJSON: unknown, newJSON: unknown, options): ArtifactDiffResult
    - formatUnifiedDiff(changes: DiffChange[], color: boolean): string
    - calculateStats(changes: DiffChange[]): { additions: number; deletions: number }
  - NAMING: ArtifactDiffer class, camelCase methods
  - DEPENDENCIES: diff package (npm install diff), jsondiffpatch (optional)
  - PLACEMENT: Utils directory

Task 3: CREATE src/cli/commands/artifacts.ts (Part 1: Core Class)
  - IMPLEMENT: ArtifactsCommand class with constructor, session loading, artifact scanning
  - PATTERN: Follow InspectCommand pattern exactly (class structure, constructor, private helpers)
  - FUNCTIONS:
    - constructor(planDir?: string, prdPath?: string)
    - #loadSession(sessionId?: string): Promise<SessionState>
    - #scanArtifacts(session: SessionState): Promise<ArtifactMetadata[]>
    - #getArtifactPath(session: SessionState, taskId: string, filename: string): string
    - #artifactExists(path: string): Promise<boolean>
  - NAMING: ArtifactsCommand class, private methods with # prefix
  - DEPENDENCIES: SessionManager, artifact types from Task 1 and 2
  - PLACEMENT: CLI commands directory

Task 4: CREATE src/cli/commands/artifacts.ts (Part 2: List Subcommand)
  - IMPLEMENT: #listArtifacts(options: ArtifactsListOptions): Promise<void>
  - PATTERN: Use table-formatter for table output, direct console.log for JSON
  - FUNCTIONS:
    - #listArtifacts(options): Format and display artifact list
    - #formatArtifactTable(artifacts: ArtifactMetadata[]): string
    - #formatArtifactJSON(artifacts: ArtifactMetadata[]): string
  - OUTPUT: Table with Task ID, Artifact Type, Path, Status columns
  - DEPENDENCIES: Task 3 (class structure, artifact scanning)
  - GOTCHA: Handle case where no artifacts found gracefully

Task 5: CREATE src/cli/commands/artifacts.ts (Part 3: View Subcommand)
  - IMPLEMENT: #viewArtifacts(options: ArtifactsViewOptions): Promise<void>
  - PATTERN: Read three artifact files, use SyntaxHighlighter for display
  - FUNCTIONS:
    - #viewArtifacts(options): Load and display artifact content
    - #loadArtifactContent(session: SessionState, taskId: string): Promise<ArtifactContent>
    - #formatArtifactContent(content: ArtifactContent, color: boolean): string
    - #formatArtifactJSON(content: ArtifactContent): string
  - OUTPUT: Formatted display of validation-results.json, execution-summary.md, artifacts-list.json
  - DEPENDENCIES: Task 1 (SyntaxHighlighter), Task 3 (class structure)
  - GOTCHA: Handle missing files gracefully (task may not have executed yet)

Task 6: CREATE src/cli/commands/artifacts.ts (Part 4: Diff Subcommand)
  - IMPLEMENT: #diffArtifacts(options: ArtifactsDiffOptions): Promise<void>
  - PATTERN: Load two artifacts, use ArtifactDiffer, format colored output
  - FUNCTIONS:
    - #diffArtifacts(options): Compare and display artifact diff
    - #loadArtifactForDiff(session: SessionState, taskId: string): Promise<ArtifactContent | null>
    - #formatArtifactDiff(diff: ArtifactDiff, color: boolean): string
    - #formatArtifactDiffJSON(diff: ArtifactDiff): string
  - OUTPUT: Unified diff with colored additions/deletions, statistics summary
  - DEPENDENCIES: Task 2 (ArtifactDiffer), Task 3 (class structure)
  - GOTCHA: Handle case where one or both artifacts don't exist

Task 7: CREATE src/cli/commands/artifacts.ts (Part 5: Execute Method)
  - IMPLEMENT: async execute(action: string, options: ArtifactsOptions): Promise<void>
  - PATTERN: Route to appropriate subcommand based on action parameter
  - FUNCTIONS:
    - execute(action, options): Main entry point, routes to list/view/diff
    - Parse options based on action (list has different options than view/diff)
  - INTEGRATION: Calls #listArtifacts(), #viewArtifacts(), or #diffArtifacts()
  - ERROR HANDLING: Try-catch with user-friendly error messages
  - DEPENDENCIES: Tasks 4, 5, 6 (subcommand implementations)

Task 8: MODIFY src/cli/index.ts
  - IMPORT: ArtifactsCommand from './commands/artifacts.js'
  - REGISTER: New command using program.command()
  - PATTERN: Follow inspect command registration exactly
  - ADD:
    ```typescript
    program
      .command('artifacts')
      .description('View and compare pipeline artifacts')
      .argument('[action]', 'Action: list, view, diff', 'list')
      .option('--session <id>', 'Session ID')
      .option('--task <id>', 'Task ID (for view/diff)')
      .option('--task1 <id>', 'First task ID (for diff)')
      .option('--task2 <id>', 'Second task ID (for diff)')
      .option('--output <format>', 'Output format: table, json', 'table')
      .option('--no-color', 'Disable colored output')
      .action(async (action, options) => {
        const command = new ArtifactsCommand(planDir, prdPath);
        await command.execute(action, options);
      });
    ```
  - PRESERVE: All existing command registrations
  - PLACEMENT: After inspect command registration (around line 120)

Task 9: CREATE tests/unit/cli/commands/artifacts.test.ts
  - IMPLEMENT: Unit tests for ArtifactsCommand class
  - MOCK: SessionManager, fs operations, SyntaxHighlighter, ArtifactDiffer
  - TEST: #listArtifacts(), #viewArtifacts(), #diffArtifacts() with various options
  - TEST: Error handling (no session, no artifacts, missing files)
  - TEST: Output format validation (table vs JSON)
  - COVERAGE: 100% coverage required
  - PATTERN: Follow tests/unit/cli/commands/inspect.test.ts structure
  - PLACEMENT: Unit tests directory

Task 10: CREATE tests/integration/artifacts-command.test.ts
  - IMPLEMENT: Integration tests with real file operations
  - SETUP: Create temp directory structure with session and artifacts
  - TEST: Full command execution with real SessionManager
  - TEST: Artifact discovery and loading from file system
  - TEST: Syntax highlighting output validation
  - TEST: Diff generation with real artifact files
  - CLEANUP: Remove temp directories in afterEach
  - PATTERN: Follow tests/integration/inspect-command.test.ts structure
  - PLACEMENT: Integration tests directory
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Syntax Highlighter (src/utils/display/syntax-highlighter.ts)

import { highlight } from 'cli-highlight';
import chalk from 'chalk';

export class SyntaxHighlighter {
  /**
   * Determine if color should be used based on mode and environment
   */
  shouldUseColor(mode: 'auto' | 'always' | 'never' = 'auto'): boolean {
    if (mode === 'never') return false;
    if (mode === 'always') return true;
    // Auto mode: check TTY and NO_COLOR
    return process.stdout.isTTY && !process.env.NO_COLOR;
  }

  /**
   * Highlight JSON data with syntax colors
   */
  highlightJSON(data: unknown, colorMode: 'auto' | 'always' | 'never' = 'auto'): string {
    const json = JSON.stringify(data, null, 2);
    if (!this.shouldUseColor(colorMode)) {
      return json;
    }

    return highlight(json, {
      language: 'json',
      theme: 'monokai',
    });
  }

  /**
   * Highlight markdown content
   */
  highlightMarkdown(content: string, colorMode: 'auto' | 'always' | 'never' = 'auto'): string {
    if (!this.shouldUseColor(colorMode)) {
      return content;
    }

    return highlight(content, {
      language: 'markdown',
      theme: 'github',
    });
  }

  /**
   * Highlight code with specific language
   */
  highlightCode(
    content: string,
    language: string,
    colorMode: 'auto' | 'always' | 'never' = 'auto'
  ): string {
    if (!this.shouldUseColor(colorMode)) {
      return content;
    }

    return highlight(content, {
      language,
      theme: 'monokai',
    });
  }
}

// Pattern 2: Artifact Differ (src/utils/artifact-differ.ts)

import * as diff from 'diff';
import chalk from 'chalk';

export interface DiffResult {
  hasChanges: boolean;
  unifiedDiff: string;
  additions: number;
  deletions: number;
}

export class ArtifactDiffer {
  /**
   * Generate unified diff between two strings
   */
  diffText(
    oldContent: string,
    newContent: string,
    options: { color?: boolean; context?: number } = {}
  ): DiffResult {
    const { color = true, context = 3 } = options;

    // Check if identical
    if (oldContent === newContent) {
      return {
        hasChanges: false,
        unifiedDiff: chalk.gray('No changes detected.'),
        additions: 0,
        deletions: 0,
      };
    }

    // Generate diff
    const changes = diff.diffLines(oldContent, newContent, { context });

    let additions = 0;
    let deletions = 0;
    const diffLines: string[] = [];

    for (const change of changes) {
      const lines = change.value.split('\n').filter((l) => l !== '');

      if (change.added) {
        additions += lines.length;
        for (const line of lines) {
          diffLines.push(color ? chalk.green('+ ' + line) : '+ ' + line);
        }
      } else if (change.removed) {
        deletions += lines.length;
        for (const line of lines) {
          diffLines.push(color ? chalk.red('- ' + line) : '- ' + line);
        }
      } else {
        for (const line of lines) {
          diffLines.push('  ' + line);
        }
      }
    }

    const summary = color
      ? `Changes: ${chalk.green('+' + additions)} ${chalk.red('-' + deletions)}`
      : `Changes: +${additions} -${deletions}`;

    return {
      hasChanges: true,
      unifiedDiff: summary + '\n\n' + diffLines.join('\n'),
      additions,
      deletions,
    };
  }

  /**
   * Diff two JSON objects with semantic comparison
   */
  diffJSON(
    oldJSON: unknown,
    newJSON: unknown,
    options: { color?: boolean } = {}
  ): DiffResult {
    const { color = true } = options;

    // Format as prettified JSON for line-by-line diff
    const oldStr = JSON.stringify(oldJSON, null, 2) + '\n';
    const newStr = JSON.stringify(newJSON, null, 2) + '\n';

    return this.diffText(oldStr, newStr, { color, context: 3 });
  }
}

// Pattern 3: Artifacts Command Structure (src/cli/commands/artifacts.ts)

import { SessionManager } from '../session-manager.js';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import type { ArtifactMetadata, ArtifactContent, ArtifactsListOptions } from './types.js';
import { SyntaxHighlighter } from '../../utils/display/syntax-highlighter.js';
import { ArtifactDiffer } from '../../utils/artifact-differ.js';
import Table from 'cli-table3';
import chalk from 'chalk';

export class ArtifactsCommand {
  #sessionManager: SessionManager;
  #planDir: string;
  #prdPath: string;
  #highlighter: SyntaxHighlighter;
  #differ: ArtifactDiffer;

  constructor(planDir?: string, prdPath?: string) {
    this.#planDir = planDir || getDefaultPlanDir();
    this.#prdPath = prdPath || getDefaultPrdPath();
    this.#sessionManager = new SessionManager();
    this.#highlighter = new SyntaxHighlighter();
    this.#differ = new ArtifactDiffer();
  }

  async execute(action: string, options: Record<string, unknown>): Promise<void> {
    try {
      switch (action) {
        case 'list':
          await this.#listArtifacts(options as ArtifactsListOptions);
          break;
        case 'view':
          await this.#viewArtifacts(options as ArtifactsViewOptions);
          break;
        case 'diff':
          await this.#diffArtifacts(options as ArtifactsDiffOptions);
          break;
        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.info('Valid actions: list, view, diff');
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  async #loadSession(sessionId?: string): Promise<SessionState> {
    if (sessionId) {
      const sessions = await this.#sessionManager.listSessions(this.#planDir);
      const session = sessions.find((s) => s.metadata.hash === sessionId || s.metadata.id === sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      return this.#sessionManager.loadSession(join(this.#planDir, session.metadata.id + '_' + session.metadata.hash));
    }

    // Find latest session
    const latestPath = await this.#sessionManager.findLatestSession(this.#planDir);
    if (!latestPath) {
      throw new Error('No sessions found');
    }
    return this.#sessionManager.loadSession(latestPath);
  }

  async #scanArtifacts(session: SessionState): Promise<ArtifactMetadata[]> {
    const artifacts: ArtifactMetadata[] = [];
    const sessionPath = session.metadata.path;
    const artifactsPath = join(sessionPath, 'artifacts');

    // Check if artifacts directory exists
    try {
      await fs.access(artifactsPath);
    } catch {
      return artifacts; // No artifacts directory
    }

    // Scan for task directories
    const taskDirs = await fs.readdir(artifactsPath);

    for (const taskDir of taskDirs) {
      const taskPath = join(artifactsPath, taskDir);
      const stat = await fs.stat(taskPath);

      if (!stat.isDirectory()) continue;

      // Convert directory name back to task ID (underscores to dots)
      const taskId = taskDir.replace(/_/g, '.');

      // Find task in backlog to get title and status
      const task = this.#findTaskInBacklog(session, taskId);
      const taskTitle = task?.title || 'Unknown';
      const taskStatus = task?.status || 'Unknown';

      // Check for each artifact file
      const filenames = ['validation-results.json', 'execution-summary.md', 'artifacts-list.json'];
      const types: Record<string, string> = {
        'validation-results.json': 'validation',
        'execution-summary.md': 'summary',
        'artifacts-list.json': 'list',
      };

      for (const filename of filenames) {
        const filePath = join(taskPath, filename);
        const exists = await this.#artifactExists(filePath);
        let size = 0;

        if (exists) {
          const fileStat = await fs.stat(filePath);
          size = fileStat.size;
        }

        artifacts.push({
          taskId,
          taskTitle,
          artifactType: types[filename] as any,
          path: join('artifacts', taskDir, filename),
          fullPath: filePath,
          exists,
          size,
          taskStatus,
        });
      }
    }

    return artifacts;
  }

  #findTaskInBacklog(session: SessionState, taskId: string): { title: string; status: string } | null {
    // Search through backlog for task
    for (const phase of session.taskRegistry.backlog.phases) {
      for (const milestone of phase.milestones) {
        for (const task of milestone.tasks) {
          if (task.id === taskId) {
            return { title: task.title, status: task.status };
          }
          for (const subtask of task.subtasks) {
            if (subtask.id === taskId) {
              return { title: subtask.title, status: subtask.status };
            }
          }
        }
      }
    }
    return null;
  }

  async #artifactExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  #getArtifactPath(session: SessionState, taskId: string, filename: string): string {
    const taskDir = taskId.replace(/\./g, '_');
    return join(session.metadata.path, 'artifacts', taskDir, filename);
  }

  async #listArtifacts(options: ArtifactsListOptions): Promise<void> {
    const session = await this.#loadSession(options.session);
    const artifacts = await this.#scanArtifacts(session);

    if (artifacts.length === 0) {
      console.log(chalk.gray('No artifacts found.'));
      return;
    }

    if (options.output === 'json') {
      console.log(JSON.stringify(artifacts, null, 2));
    } else {
      console.log(this.#formatArtifactTable(artifacts));
    }
  }

  #formatArtifactTable(artifacts: ArtifactMetadata[]): string {
    const table = new Table({
      head: [
        chalk.cyan('Task ID'),
        chalk.cyan('Type'),
        chalk.cyan('Path'),
        chalk.cyan('Status'),
      ],
      colWidths: [20, 15, 40, 15],
      chars: {
        top: '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        bottom: '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        left: '│',
        'left-mid': '├',
        mid: '─',
        'mid-mid': '┼',
        right: '│',
        'right-mid': '┤',
        middle: '│',
      },
    });

    for (const artifact of artifacts) {
      const statusIcon = this.#getStatusIcon(artifact.taskStatus);
      const existsIndicator = artifact.exists ? chalk.green('✓') : chalk.gray('○');

      table.push([
        artifact.taskId,
        artifact.artifactType,
        artifact.path,
        `${existsIndicator} ${statusIcon}`,
      ]);
    }

    return table.toString();
  }

  #getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      Complete: chalk.green('✓'),
      Failed: chalk.red('✗'),
      InProgress: chalk.yellow('◐'),
      Planned: chalk.gray('○'),
    };
    return icons[status] || status;
  }

  async #viewArtifacts(options: ArtifactsViewOptions): Promise<void> {
    const session = await this.#loadSession(options.session);
    const content = await this.#loadArtifactContent(session, options.taskId);

    if (!content) {
      console.log(chalk.gray(`No artifacts found for task: ${options.taskId}`));
      return;
    }

    if (options.output === 'json') {
      console.log(JSON.stringify(content, null, 2));
    } else {
      console.log(this.#formatArtifactContent(content, options.color !== false));
    }
  }

  async #loadArtifactContent(
    session: SessionState,
    taskId: string
  ): Promise<ArtifactContent | null> {
    const task = this.#findTaskInBacklog(session, taskId);
    if (!task) return null;

    const content: ArtifactContent = {
      taskId,
      taskTitle: task.title,
      presentFiles: [],
    };

    // Load validation-results.json
    const validationPath = this.#getArtifactPath(session, taskId, 'validation-results.json');
    if (await this.#artifactExists(validationPath)) {
      const validationContent = await fs.readFile(validationPath, 'utf-8');
      content.validationResults = JSON.parse(validationContent);
      content.presentFiles.push('validation-results.json');
    }

    // Load execution-summary.md
    const summaryPath = this.#getArtifactPath(session, taskId, 'execution-summary.md');
    if (await this.#artifactExists(summaryPath)) {
      content.executionSummary = await fs.readFile(summaryPath, 'utf-8');
      content.presentFiles.push('execution-summary.md');
    }

    // Load artifacts-list.json
    const listPath = this.#getArtifactPath(session, taskId, 'artifacts-list.json');
    if (await this.#artifactExists(listPath)) {
      const listContent = await fs.readFile(listPath, 'utf-8');
      content.artifactsList = JSON.parse(listContent);
      content.presentFiles.push('artifacts-list.json');
    }

    if (content.presentFiles.length === 0) return null;

    return content;
  }

  #formatArtifactContent(content: ArtifactContent, color: boolean): string {
    const lines: string[] = [];

    lines.push(chalk.bold(`\nArtifacts for ${content.taskId}: ${content.taskTitle}\n`));
    lines.push(chalk.gray('─'.repeat(80)));

    // Validation Results
    if (content.validationResults) {
      lines.push(chalk.bold('\nvalidation-results.json:'));
      lines.push(this.#highlighter.highlightJSON(content.validationResults, color ? 'always' : 'never'));
    }

    // Execution Summary
    if (content.executionSummary) {
      lines.push(chalk.bold('\nexecution-summary.md:'));
      lines.push(this.#highlighter.highlightMarkdown(content.executionSummary, color ? 'always' : 'never'));
    }

    // Artifacts List
    if (content.artifactsList) {
      lines.push(chalk.bold('\nartifacts-list.json:'));
      lines.push(this.#highlighter.highlightJSON(content.artifactsList, color ? 'always' : 'never'));
    }

    return lines.join('\n');
  }

  async #diffArtifacts(options: ArtifactsDiffOptions): Promise<void> {
    const session = await this.#loadSession(options.session);

    const content1 = await this.#loadArtifactForDiff(session, options.task1Id);
    const content2 = await this.#loadArtifactForDiff(session, options.task2Id);

    if (!content1) {
      console.log(chalk.yellow(`No artifacts found for task: ${options.task1Id}`));
      return;
    }
    if (!content2) {
      console.log(chalk.yellow(`No artifacts found for task: ${options.task2Id}`));
      return;
    }

    const diffResult: ArtifactDiff = {
      task1Id: options.task1Id,
      task2Id: options.task2Id,
      hasChanges: false,
      stats: { additions: 0, deletions: 0 },
    };

    // Diff validation results
    if (content1.validationResults && content2.validationResults) {
      const validationDiff = this.#differ.diffJSON(
        content1.validationResults,
        content2.validationResults,
        { color: options.color !== false }
      );
      diffResult.validationDiff = validationDiff.unifiedDiff;
      diffResult.stats.additions += validationDiff.additions;
      diffResult.stats.deletions += validationDiff.deletions;
      if (validationDiff.hasChanges) diffResult.hasChanges = true;
    }

    // Diff execution summaries
    if (content1.executionSummary && content2.executionSummary) {
      const summaryDiff = this.#differ.diffText(
        content1.executionSummary,
        content2.executionSummary,
        { color: options.color !== false }
      );
      diffResult.summaryDiff = summaryDiff.unifiedDiff;
      diffResult.stats.additions += summaryDiff.additions;
      diffResult.stats.deletions += summaryDiff.deletions;
      if (summaryDiff.hasChanges) diffResult.hasChanges = true;
    }

    // Diff artifacts lists
    if (content1.artifactsList && content2.artifactsList) {
      const listDiff = this.#differ.diffJSON(
        content1.artifactsList,
        content2.artifactsList,
        { color: options.color !== false }
      );
      diffResult.listDiff = listDiff.unifiedDiff;
      diffResult.stats.additions += listDiff.additions;
      diffResult.stats.deletions += listDiff.deletions;
      if (listDiff.hasChanges) diffResult.hasChanges = true;
    }

    if (options.output === 'json') {
      console.log(JSON.stringify(diffResult, null, 2));
    } else {
      console.log(this.#formatArtifactDiff(diffResult, options.color !== false));
    }
  }

  async #loadArtifactForDiff(
    session: SessionState,
    taskId: string
  ): Promise<ArtifactContent | null> {
    return this.#loadArtifactContent(session, taskId);
  }

  #formatArtifactDiff(diff: ArtifactDiff, color: boolean): string {
    const lines: string[] = [];

    lines.push(chalk.bold(`\nComparing artifacts: ${diff.task1Id} → ${diff.task2Id}\n`));

    if (!diff.hasChanges) {
      lines.push(chalk.gray('No differences detected.'));
      return lines.join('\n');
    }

    const summary = color
      ? `Changes: ${chalk.green('+' + diff.stats.additions)} ${chalk.red('-' + diff.stats.deletions)}`
      : `Changes: +${diff.stats.additions} -${diff.stats.deletions}`;

    lines.push(summary);
    lines.push('');

    if (diff.validationDiff) {
      lines.push(chalk.bold('validation-results.json:'));
      lines.push(diff.validationDiff);
    }

    if (diff.summaryDiff) {
      lines.push(chalk.bold('execution-summary.md:'));
      lines.push(diff.summaryDiff);
    }

    if (diff.listDiff) {
      lines.push(chalk.bold('artifacts-list.json:'));
      lines.push(diff.listDiff);
    }

    return lines.join('\n');
  }
}

// Helper functions (could be in a separate utils file)
function getDefaultPlanDir(): string {
  return process.env.PRD_PLAN_DIR || join(process.cwd(), 'plan');
}

function getDefaultPrdPath(): string {
  return process.env.PRD_FILE || join(process.cwd(), 'PRD.md');
}
```

### Integration Points

```yaml
CLI_REGISTRATION:
  - modify: src/cli/index.ts
  - add: artifacts command registration after inspect command
  - pattern: program.command().description().argument().option().action()
  - instantiate: new ArtifactsCommand(planDir, prdPath) before execute()

SESSION_MANAGER:
  - use: SessionManager from src/core/session-manager.js
  - methods: loadSession(), listSessions(), findLatestSession()
  - pattern: Load session, access metadata.path for absolute path

DISPLAY_UTILITIES:
  - use: cli-table3 for table formatting (already installed)
  - use: chalk for colors (already installed)
  - pattern: Follow existing table-formatter.ts styles

FILE_OPERATIONS:
  - use: node:fs/promises for async file operations
  - use: node:path for path operations (resolve, join)
  - pattern: await fs.readFile(), await fs.access()

ARTIFACT_PATHS:
  - pattern: join(sessionPath, 'artifacts', taskId.replace(/\./g, '_'), filename)
  - files: validation-results.json, execution-summary.md, artifacts-list.json
  - gotcha: Directory names use underscores, task IDs use dots
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Install new dependencies
npm install cli-highlight diff jsondiffpatch

# Run after each file creation - fix before proceeding
npm run lint        # ESLint with auto-fix
npm run check       # TypeScript compiler check
npm run format      # Prettier formatting

# Or use individual tools
npx eslint src/cli/commands/artifacts.ts --fix
npx tsc --noEmit src/cli/commands/artifacts.ts
npx prettier --write src/cli/commands/artifacts.ts

# Project-wide validation
npm run lint
npm run check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test artifacts command
npm test -- tests/unit/cli/commands/artifacts.test.ts

# Test syntax highlighter
npm test -- tests/unit/utils/display/syntax-highlighter.test.ts

# Test artifact differ
npm test -- tests/unit/utils/artifact-differ.test.ts

# Full test suite for new code
npm test -- tests/unit/cli/commands/
npm test -- tests/unit/utils/

# Coverage validation
npm run test:coverage

# Expected: All tests pass, 100% coverage for new code. If failing, debug root cause.
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the project
npm run build

# Test with real session (create test session first)
mkdir -p /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S1

# Create test artifacts
echo '{"level":1,"success":true}' > /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S1/validation-results.json
echo "# Test Summary" > /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S1/execution-summary.md
echo '["file1.ts","file2.ts"]' > /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S1/artifacts-list.json

# Test list command
node dist/cli/index.js artifacts list --plan /tmp/test-artifacts/plan

# Test view command
node dist/cli/index.js artifacts view P1.M1.T1.S1 --plan /tmp/test-artifacts/plan

# Test diff command (create second task artifacts first)
mkdir -p /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S2
echo '{"level":1,"success":false}' > /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S2/validation-results.json
node dist/cli/index.js artifacts diff P1.M1.T1.S1 P1.M1.T1.S2 --plan /tmp/test-artifacts/plan

# Expected: All commands work, output is formatted correctly, syntax highlighting works.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual Testing Scenarios

# Scenario 1: List artifacts with no artifacts
node dist/cli/index.js artifacts list --plan /tmp/empty-plan
# Verify: Graceful message "No artifacts found."

# Scenario 2: View artifacts for non-existent task
node dist/cli/index.js artifacts view P1.M1.T9.S9 --plan /tmp/test-artifacts/plan
# Verify: Message "No artifacts found for task: P1.M1.T9.S9"

# Scenario 3: Diff with missing artifacts
node dist/cli/index.js artifacts diff P1.M1.T1.S1 P1.M1.T9.S9 --plan /tmp/test-artifacts/plan
# Verify: Warning about missing artifacts

# Scenario 4: JSON output format
node dist/cli/index.js artifacts list --output json --plan /tmp/test-artifacts/plan | jq .
# Verify: Valid JSON output

# Scenario 5: Syntax highlighting validation
node dist/cli/index.js artifacts view P1.M1.T1.S1 --plan /tmp/test-artifacts/plan | grep -c $'\x1b'
# Verify: ANSI color codes present (count > 0)

# Scenario 6: NO_COLOR environment variable
NO_COLOR=1 node dist/cli/index.js artifacts view P1.M1.T1.S1 --plan /tmp/test-artifacts/plan | grep -c $'\x1b'
# Verify: No ANSI color codes (count = 0)

# Scenario 7: Diff with identical artifacts
cp -r /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S1 /tmp/test-artifacts/plan/001_test/artifacts/P1_M1_T1_S3
node dist/cli/index.js artifacts diff P1.M1.T1.S1 P1.M1.T1.S3 --plan /tmp/test-artifacts/plan
# Verify: Message "No differences detected."

# Expected: All scenarios work correctly, error messages are user-friendly.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format` then `git diff` shows no unintended changes
- [ ] 100% test coverage for new code: `npm run test:coverage` shows 100% for new files

### Feature Validation

- [ ] `prd artifacts list` displays all artifacts in table format
- [ ] `prd artifacts view <task-id>` shows all three artifact files
- [ ] `prd artifacts diff <task1> <task2>` produces colored unified diff
- [ ] All commands support --output json for machine-readable output
- [ ] Syntax highlighting works for JSON and Markdown
- [ ] Output respects NO_COLOR environment variable
- [ ] TTY detection works correctly
- [ ] Error messages are user-friendly

### Code Quality Validation

- [ ] Follows existing InspectCommand pattern exactly
- [ ] File placement matches desired codebase tree structure
- [ ] Type safety maintained (no `any` types without justification)
- [ ] Error handling is comprehensive with try-catch blocks
- [ ] Code is self-documenting with clear names
- [ ] Public APIs have JSDoc comments

### Documentation & Deployment

- [ ] New dependencies added to package.json
- [ ] Research documents stored in plan/003_b3d3efdaf0ed/P2M3T2S3/research/
- [ ] CLI help text is clear and descriptive
- [ ] Integration points clearly documented
- [ ] Gotchas and library quirks documented in PRP

---

## Anti-Patterns to Avoid

- **Don't** break existing CLI commands - preserve all current functionality
- **Don't** hardcode session paths - use SessionManager methods
- **Don't** forget to convert task ID dots to underscores for directory names
- **Don't** use synchronous file operations - always use `fs.promises`
- **Don't** skip error handling - wrap async operations in try-catch
- **Don't** ignore missing artifacts - handle gracefully with user-friendly messages
- **Don't** create new color libraries - use existing chalk installation
- **Don't** skip tests - 100% coverage is required by vitest.config.ts
- **Don't** forget NO_COLOR support - check environment variable
- **Don't** use new display patterns - follow existing cli-table3 styles
- **Don't** create duplicate code - reuse existing utilities where possible
- **Don't** make the command too complex - keep each subcommand focused
