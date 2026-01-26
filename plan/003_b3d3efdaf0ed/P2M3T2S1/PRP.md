# Product Requirement Prompt (PRP): Pipeline State Inspector Tool

---

## Goal

**Feature Goal**: Create a `prd inspect` CLI command that provides comprehensive debugging and inspection capabilities for the PRD pipeline state, including session information, task hierarchy with status, current executing task, recent artifacts and their locations, and error summaries.

**Deliverable**: A new `prd inspect` command handler in `src/cli/commands/inspect.ts` with multiple output formats (table, tree, JSON) and task-specific detail view via `--task <id>` flag.

**Success Definition**:

- Users can run `prd inspect` to see a comprehensive overview of pipeline state including session metadata, task hierarchy, current task, artifacts, and errors
- Users can run `prd inspect --task <id>` to see detailed information about a specific task
- Output is formatted as tables by default with optional JSON/YAML/tree formats
- Integration tests verify all inspector functionality works correctly
- Command follows existing CLI patterns and integrates cleanly with the current architecture

## User Persona

**Target User**: Developers and project managers using the PRD pipeline who need to debug issues, track progress, and understand the current state of pipeline execution.

**Use Case**: During pipeline execution, users need to inspect:

- What session is currently active and its relationship to parent sessions
- Which tasks have completed, which are in progress, and which are pending
- What artifacts have been generated and where they are stored
- Any errors that have occurred and their context
- Detailed information about specific tasks including PRP content, validation results, and dependencies

**User Journey**:

1. User runs `prd inspect` to get an overview of pipeline state
2. User reviews the session information, task hierarchy, and artifact locations
3. User identifies a task of interest and runs `prd inspect --task P2.M3.T2.S1` for detailed information
4. User uses the detailed view to understand task context, dependencies, and any issues

**Pain Points Addressed**:

- Currently, `prd task` only shows basic task listing without detailed state information
- No way to inspect session metadata, artifact locations, or error summaries
- No task-specific detail view for debugging
- No visibility into PRP content or validation results for individual tasks

## Why

- **Debugging Capability**: Users need detailed visibility into pipeline state to diagnose issues, understand why tasks are blocked, and track progress
- **Operational Visibility**: Project managers need to see session history, task status, and artifact locations without digging through file systems
- **Error Analysis**: When failures occur, users need quick access to error summaries and their context
- **Complement to Existing Tools**: The existing `prd task` command provides basic listing; `prd inspect` fills the gap for detailed state inspection

## What

**User-Visible Behavior**:

### Command: `prd inspect` (Default Overview)

Displays a comprehensive overview of pipeline state including:

1. **Session Information**:
   - Session hash and parent session reference (if delta session)
   - Session sequence number and creation status
   - PRD file path and whether PRD has changed (delta status)

2. **Task Hierarchy with Status**:
   - Tree-formatted display of Phase → Milestone → Task → Subtask hierarchy
   - Status indicators (✓ Complete, ◐ In Progress, ○ Planned, ✗ Failed, ⚠ Warning)
   - Task counts by status (Planned, Researching, Implementing, Complete, Failed, Obsolete)

3. **Current Executing Task**:
   - Task ID and title of currently executing item
   - Current status and phase of execution
   - How long the task has been running (if available)

4. **Recent Artifacts and Locations**:
   - List of recently generated PRPs with file paths
   - Validation result locations
   - Artifact directories with contents

5. **Error Summaries**:
   - Count of failed tasks
   - List of recent errors with task IDs and error messages
   - Suggestions for next steps

### Command: `prd inspect --task <id>` (Task-Specific Details)

Displays detailed information for a specific task:

1. **Task Metadata**:
   - Full task ID, title, and description
   - Current status and status history
   - Story points (for subtasks)

2. **Dependencies**:
   - List of dependency task IDs
   - Status of each dependency
   - Whether dependencies are satisfied

3. **Context Scope**:
   - Full CONTRACT DEFINITION content
   - Input/output specifications
   - Mocking instructions

4. **Associated Artifacts**:
   - PRP file location and preview (if exists)
   - Validation result locations
   - Implementation artifact directory

5. **Error Information** (if failed):
   - Error message and stack trace
   - Timestamp of failure
   - Retry attempts and history

### Optional Flags

- `-o, --output <format>`: Output format (table, json, yaml, tree) - default: table
- `-f, --file <path>`: Override tasks.json file path
- `--session <id>`: Inspect specific session by hash
- `-v, --verbose`: Show verbose output including full PRP content
- `--artifacts`: Show only artifact information
- `--errors`: Show only error information

### Success Criteria

- [ ] `prd inspect` displays session information, task hierarchy, current task, artifacts, and errors
- [ ] `prd inspect --task <id>` displays detailed task information including dependencies, context scope, and artifacts
- [ ] Output formats (table, json, yaml, tree) work correctly
- [ ] Integration tests verify all functionality
- [ ] Command integrates cleanly with existing CLI architecture
- [ ] Error handling provides helpful messages for invalid inputs

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Validation**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact file paths and line numbers for all relevant components
- Complete type definitions for all data structures
- Specific library recommendations with documentation URLs
- Exact implementation patterns to follow from existing code
- Complete testing patterns and validation commands
- All integration points and gotchas

### Documentation & References

```yaml
# MUST READ - Core Architecture and Components
- file: src/core/session-manager.ts
  why: SessionManager class provides all methods for loading sessions, querying state, and accessing artifacts
  pattern: Static discovery methods (listSessions, findLatestSession), session loading (loadSession), state querying (getCurrentItem)
  critical: Session directories follow {sequence}_{hash} naming; use atomic write pattern for any state modifications

- file: src/core/models.ts
  why: Type definitions for Phase, Milestone, Task, Subtask, Backlog, SessionState, DeltaSession
  pattern: All interfaces use readonly properties for immutability; Status type is union of specific strings
  gotcha: Status values are 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'

- file: src/utils/task-utils.ts
  why: Utility functions for finding items, filtering by status, getting dependencies
  pattern: findItem() for recursive search, filterByStatus() for status filtering, getDependencies() for dependency resolution
  critical: Hierarchy traversal is depth-first pre-order; dependencies are only defined at Subtask level

- file: src/cli/index.ts
  why: Current CLI structure using Commander.js; shows option parsing patterns and error handling
  pattern: Single command with options structure; uses program.option() for flags
  gotcha: Current CLI is NOT multi-command - new inspect command requires adding subcommand support

# MUST READ - Existing Command Patterns (Planned, Not Yet Implemented)
- file: plan/003_b3d3efdaf0ed/docs/prd-task-command-specs.md
  why: Specifications for planned `prd task` command showing intended command structure
  pattern: Git-style subcommands (prd task, prd task next, prd task status)
  critical: Inspect command should follow similar patterns for consistency

- file: plan/003_b3d3efdaf0ed/docs/commander-subcommand-patterns.md
  why: Comprehensive guide to implementing Commander.js subcommands
  pattern: Use program.command('inspect').description('...').action() for subcommand registration
  critical: Shows how to handle both default action and sub-subcommands like --task flag

# MUST READ - Testing Patterns
- file: tests/integration/prd-task-command.test.ts
  why: Integration test patterns for CLI commands (even though command not yet implemented, tests show expected patterns)
  pattern: Mock SessionManager with vi.mock(), mock file system operations, factory functions for test data
  critical: Tests mock process.exit to prevent actual exits during testing

- file: vitest.config.ts
  why: Test configuration showing 100% coverage requirement and setup files
  pattern: Uses v8 coverage provider, tests/**/*.{test,spec}.ts pattern
  critical: Global setup in tests/setup.ts validates ANTHROPIC_BASE_URL to prevent accidental API calls

# RESEARCH - CLI Libraries and Patterns (External)
- docfile: plan/003_b3d3efdaf0ed/P2M3T2S1/research/01-table-formatter-libraries.md
  why: Comparison of cli-table3, table, tty-table for table formatting
  recommendation: cli-table3 - well-established, good TypeScript support, flexible customization
  url: https://www.npmjs.com/package/cli-table3

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S1/research/02-terminal-styling-libraries.md
  why: Comparison of chalk, kleur, ansi-colors, picocolors for terminal styling
  recommendation: chalk - most popular, excellent documentation, chainable API
  url: https://www.npmjs.com/package/chalk

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S1/research/04-inspect-command-examples.md
  why: Examples from kubectl, docker, git, npm, AWS CLI showing inspect command patterns
  pattern: Multiple output formats (table, json, yaml, wide), filtering and sorting, detail levels
  critical: kubectl describe pattern is closest to what we need for --task flag

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S1/research/05-tree-visualization.md
  why: ASCII tree patterns and libraries for hierarchical display
  pattern: Use └── and ├── connectors for tree rendering; recursive approach for nested children
  gotcha: Tree rendering must handle 4-level hierarchy (Phase > Milestone > Task > Subtask)

# CRITICAL - Session Directory Structure
- file: plan/003_b3d3efdaf0ed/docs/system_context.md (lines 111-154)
  why: Documents the session directory structure and artifact locations
  pattern: Sessions stored as plan/{sequence}_{hash}/ with subdirectories for architecture/, prps/, artifacts/
  critical: Artifact locations: prps/{taskId}.md, artifacts/{taskId}/, bugfix/{sequence}_{hash}/
```

### Current Codebase Tree

```bash
src/
├── cli/
│   └── index.ts                    # Current CLI with single command pattern
├── core/
│   ├── session-manager.ts          # Session loading, state management
│   ├── models.ts                   # Type definitions
│   └── task-orchestrator.ts        # Task orchestration
├── utils/
│   ├── task-utils.ts               # Task utilities
│   └── logger.ts                   # Logging system
└── workflows/
    └── prp-pipeline.ts             # Main pipeline

tests/
├── setup.ts                        # Global test setup
├── unit/
│   └── cli/
│       └── index.test.ts           # CLI parser unit tests
└── integration/
    └── prd-task-command.test.ts    # CLI command integration tests
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── cli/
│   ├── index.ts                    # MODIFY: Add inspect subcommand
│   └── commands/                   # NEW: Commands directory
│       └── inspect.ts              # NEW: Inspect command handler
├── utils/
│   └── display/                    # NEW: Display utilities
│       ├── table-formatter.ts      # NEW: Table formatting with cli-table3
│       ├── tree-renderer.ts        # NEW: Tree visualization
│       └── status-colors.ts        # NEW: Status indicator colors

tests/
├── unit/
│   └── cli/
│       └── commands/
│           └── inspect.test.ts     # NEW: Inspect command unit tests
└── integration/
    └── inspect-command.test.ts     # NEW: Inspect command integration tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Commander.js is currently installed but NOT configured for subcommands
// The current CLI uses a single-command pattern with .option() for flags
// To add subcommands, we must use .command('inspect').action() pattern

// CRITICAL: SessionManager uses static methods for session discovery
// Use SessionManager.listSessions() not new SessionManager().listSessions()
// Use SessionManager.loadSession(path) to load a specific session

// CRITICAL: Task hierarchy is immutable - all properties are readonly
// Never modify task objects directly - use task-utils.ts updateItemStatus() for updates

// CRITICAL: Session directory naming convention: {sequence:03d}_{hash:12h}
// Example: 001_14b9dc2a33c7, 002_1e734971e481
// Always use SessionManager static methods for path resolution

// CRITICAL: Status values are specific strings, not enums
// type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete';

// CRITICAL: Bugfix sessions take priority over main sessions
// When discovering sessions, check plan/*/bugfix/*/tasks.json first

// CRITICAL: cli-table3 requires specific import syntax
// import Table from 'cli-table3';  // NOT import { Table } from 'cli-table3';

// CRITICAL: chalk ESM import requires async import or build step
// For simplicity, use import chalk from 'chalk'; in TypeScript

// CRITICAL: Tests mock process.exit to prevent actual exits
// Always mock process.exit before testing CLI commands
// const mockExit = vi.fn(); process.exit = mockExit as any;

// CRITICAL: tests/setup.ts validates ANTHROPIC_BASE_URL
// If using real API calls in tests, they will fail validation
// All API-dependent code must be mocked
```

---

## Implementation Blueprint

### Data Models and Structure

The inspector uses existing models from `src/core/models.ts`:

```typescript
// Existing types - NO NEED TO REDEFINE
import type {
  SessionState,
  DeltaSession,
  Phase,
  Milestone,
  Task,
  Subtask,
  HierarchyItem,
  Status,
  Backlog,
  SessionMetadata,
} from '../core/models.js';

// New types for inspector output
interface InspectorOptions {
  output: 'table' | 'json' | 'yaml' | 'tree';
  file?: string;
  session?: string;
  verbose: boolean;
  artifactsOnly: boolean;
  errorsOnly: boolean;
}

interface TaskDetail {
  task: HierarchyItem;
  dependencies: HierarchyItem[];
  dependenciesSatisfied: boolean;
  prpPath?: string;
  artifactPath?: string;
  errorInfo?: ErrorSummary;
}

interface ErrorSummary {
  taskId: string;
  taskTitle: string;
  errorMessage: string;
  timestamp?: string;
  retryCount?: number;
}

interface InspectorOutput {
  session: SessionMetadata;
  taskHierarchy: Phase[];
  currentTask?: HierarchyItem;
  artifacts: ArtifactLocation[];
  errors: ErrorSummary[];
  statusCounts: Record<Status, number>;
}

interface ArtifactLocation {
  taskId: string;
  type: 'prp' | 'validation' | 'implementation';
  path: string;
  exists: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: INSTALL required dependencies
  - RUN: npm install cli-table3 chalk
  - RUN: npm install @types/cli-table3 --save-dev
  - VERIFY: package.json includes cli-table3 and chalk
  - NAMING: Use exact package names shown

Task 2: CREATE src/utils/display/status-colors.ts
  - IMPLEMENT: Status-to-color mapping function, status indicator symbols
  - PATTERN: Use chalk for colors (green=Complete, blue=In Progress, gray=Planned, red=Failed, yellow=Warning)
  - FUNCTIONS: getStatusColor(status: Status): string, getStatusIndicator(status: Status): string
  - SYMBOLS: Use ✓, ◐, ○, ✗, ⚠ for status indicators
  - PLACEMENT: Display utilities directory

Task 3: CREATE src/utils/display/table-formatter.ts
  - IMPLEMENT: Table formatting functions using cli-table3
  - PATTERN: Follow cli-table3 API (new Table({ head: [...] }), table.push([...]))
  - FUNCTIONS: formatSessionTable(session), formatTaskHierarchyTable(phases), formatArtifactTable(artifacts), formatErrorTable(errors)
  - HANDLE: Wide/narrow table detection based on terminal width
  - PLACEMENT: Display utilities directory

Task 4: CREATE src/utils/display/tree-renderer.ts
  - IMPLEMENT: Tree visualization for task hierarchy
  - PATTERN: Use ASCII connectors (└── , ├── , │) for tree structure
  - FUNCTION: renderTaskTree(phases: Phase[], currentId?: string): string
  - RECURSION: Handle 4-level nesting (Phase > Milestone > Task > Subtask)
  - HIGHLIGHT: Current task with different indicator
  - PLACEMENT: Display utilities directory

Task 5: CREATE src/cli/commands/inspect.ts
  - IMPLEMENT: InspectCommand class with execute(options) method
  - DEPENDENCIES: Import from Task 2, 3, 4 (status-colors, table-formatter, tree-renderer)
  - INTEGRATION: Use SessionManager for session discovery and loading
  - METHODS:
    - executeOverview(): Display default overview
    - executeTaskDetail(taskId): Display task-specific details
    - formatOutput(data, format): Format as table/json/yaml/tree
  - ERROR HANDLING: Graceful handling of missing sessions, invalid task IDs
  - PLACEMENT: CLI commands directory

Task 6: MODIFY src/cli/index.ts
  - ADD: Import for InspectCommand
  - INTEGRATE: Register inspect subcommand using .command('inspect').action()
  - PRESERVE: All existing CLI options and functionality
  - ADD: New flags: --output <format>, --task <id>, --session <id>, --artifacts, --errors, --verbose
  - PATTERN: Follow Commander.js subcommand pattern from plan/003_b3d3efdaf0ed/docs/commander-subcommand-patterns.md
  - GOTCHA: Do NOT break existing single-command structure - add subcommands alongside

Task 7: CREATE tests/unit/cli/commands/inspect.test.ts
  - IMPLEMENT: Unit tests for InspectCommand class methods
  - MOCK: SessionManager, file system operations, display utilities
  - TEST: executeOverview() with various session states
  - TEST: executeTaskDetail() with valid/invalid task IDs
  - TEST: formatOutput() with all format types
  - COVERAGE: 100% coverage required for all new code
  - PLACEMENT: Unit tests alongside command code

Task 8: CREATE tests/integration/inspect-command.test.ts
  - IMPLEMENT: End-to-end tests for inspect command
  - MOCK: Session directories with tasks.json files
  - MOCK: PRP files in prps/ directory
  - MOCK: Artifact directories
  - TEST: prd inspect displays all sections (session, tasks, artifacts, errors)
  - TEST: prd inspect --task <id> displays task details
  - TEST: prd inspect --output json outputs valid JSON
  - TEST: Error handling for missing sessions, invalid task IDs
  - PATTERN: Follow tests/integration/prd-task-command.test.ts patterns
  - PLACEMENT: Integration tests directory
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Commander.js Subcommand Registration (src/cli/index.ts)
import { Command } from 'commander';
import { InspectCommand } from './commands/inspect.js';

const program = new Command();

// Existing main command setup (DO NOT MODIFY)
program
  .name('prp-pipeline')
  .description('PRD to PRP Pipeline - Automated software development')
  // ... existing options ...

// NEW: Add inspect subcommand
const inspectCmd = program
  .command('inspect')
  .description('Inspect pipeline state and session details')
  .option('-o, --output <format>', 'Output format (table, json, yaml, tree)', 'table')
  .option('--task <id>', 'Show detailed information for specific task')
  .option('-f, --file <path>', 'Override tasks.json file path')
  .option('--session <id>', 'Inspect specific session by hash')
  .option('-v, --verbose', 'Show verbose output', false)
  .option('--artifacts', 'Show only artifact information', false)
  .option('--errors', 'Show only error information', false)
  .action(async (options) => {
    const inspectCommand = new InspectCommand();
    try {
      await inspectCommand.execute(options);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Pattern 2: Session Discovery and Loading (src/cli/commands/inspect.ts)
import { SessionManager } from '../core/session-manager.js';
import { findItem } from '../utils/task-utils.js';

class InspectCommand {
  async execute(options: InspectorOptions): Promise<void> {
    // Step 1: Discover session
    let sessionPath: string;
    if (options.session) {
      // Find session by hash
      const sessions = SessionManager.listSessions('./plan');
      const session = sessions.find(s => s.hash.startsWith(options.session!));
      if (!session) {
        throw new Error(`Session not found: ${options.session}`);
      }
      sessionPath = session.path;
    } else {
      // Find latest session
      const latest = SessionManager.findLatestSession('./plan');
      if (!latest) {
        throw new Error('No sessions found');
      }
      sessionPath = latest.path;
    }

    // Step 2: Load session
    const sessionManager = new SessionManager('./PRD.md', './plan');
    const sessionState = await sessionManager.loadSession(sessionPath);

    // Step 3: Execute appropriate command
    if (options.task) {
      await this.executeTaskDetail(sessionState, options.task, options);
    } else {
      await this.executeOverview(sessionState, options);
    }
  }
}

// Pattern 3: Status Color Mapping (src/utils/display/status-colors.ts)
import chalk from 'chalk';
import type { Status } from '../core/models.js';

export function getStatusColor(status: Status): string {
  const colorMap: Record<Status, (text: string) => string> = {
    'Complete': chalk.green,
    'Implementing': chalk.blue,
    'Researching': chalk.cyan,
    'Planned': chalk.gray,
    'Failed': chalk.red,
    'Obsolete': chalk.dim,
  };
  return colorMap[Status];
}

export function getStatusIndicator(status: Status): string {
  const indicatorMap: Record<Status, string> = {
    'Complete': '✓',
    'Implementing': '◐',
    'Researching': '◐',
    'Planned': '○',
    'Failed': '✗',
    'Obsolete': '⊘',
  };
  const indicator = indicatorMap[status];
  const color = getStatusColor(status);
  return color(indicator);
}

// Pattern 4: Table Formatting (src/utils/display/table-formatter.ts)
import Table from 'cli-table3';
import chalk from 'chalk';
import type { SessionMetadata, Phase, Status } from '../core/models.js';

export function formatSessionTable(session: SessionMetadata): string {
  const table = new Table({
    head: [chalk.cyan('Property'), chalk.cyan('Value')],
    colWidths: [20, 60],
  });

  table.push(
    ['Session ID', session.hash],
    ['Sequence', session.sequence.toString()],
    ['Parent', session.parentHash || 'None'],
    ['Path', session.path],
  );

  return table.toString();
}

export function formatTaskHierarchyTable(phases: Phase[]): string {
  const table = new Table({
    head: [chalk.cyan('ID'), chalk.cyan('Title'), chalk.cyan('Status'), chalk.cyan('Points')],
    wordWrap: true,
  });

  for (const phase of phases) {
    table.push([
      phase.id,
      phase.title,
      getStatusIndicator(phase.status) + ' ' + phase.status,
      '',
    ]);

    for (const milestone of phase.milestones) {
      table.push([
        '  ' + milestone.id,
        milestone.title,
        getStatusIndicator(milestone.status) + ' ' + milestone.status,
        '',
      ]);

      for (const task of milestone.tasks) {
        table.push([
          '    ' + task.id,
          task.title,
          getStatusIndicator(task.status) + ' ' + task.status,
          '',
        ]);

        for (const subtask of task.subtasks) {
          table.push([
            '      ' + subtask.id,
            subtask.title,
            getStatusIndicator(subtask.status) + ' ' + subtask.status,
            subtask.story_points.toString(),
          ]);
        }
      }
    }
  }

  return table.toString();
}

// Pattern 5: Tree Rendering (src/utils/display/tree-renderer.ts)
import chalk from 'chalk';
import type { Phase, Status } from '../core/models.js';
import { getStatusIndicator } from './status-colors.js';

interface TreeNode {
  id: string;
  title: string;
  status: Status;
  children: TreeNode[];
  isCurrent?: boolean;
}

function buildTree(phases: Phase[], currentId?: string): TreeNode[] {
  // Transform Phase[] into TreeNode[] for rendering
  // ... implementation ...
}

export function renderTaskTree(phases: Phase[], currentId?: string): string {
  const tree = buildTree(phases, currentId);

  function renderNode(node: TreeNode, prefix: string = '', isLast: boolean = true): string {
    const connector = isLast ? '└── ' : '├── ';
    const currentMarker = node.isCurrent ? chalk.bold.cyan('→ ') : '';
    const statusIndicator = getStatusIndicator(node.status);
    const line = prefix + connector + currentMarker + statusIndicator + ' ' + chalk.bold(node.id) + ': ' + node.title;

    let result = [line];

    if (node.children && node.children.length > 0) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      result = result.concat(
        node.children.map((child, i) =>
          renderNode(child, childPrefix, i === node.children!.length - 1)
        )
      );
    }

    return result.join('\n');
  }

  return tree.map((root, i) => renderNode(root, '', i === tree.length - 1)).join('\n\n');
}

// Pattern 6: Task Detail View (src/cli/commands/inspect.ts)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDependencies } from '../utils/task-utils.js';

async function executeTaskDetail(
  sessionState: SessionState,
  taskId: string,
  options: InspectorOptions
): Promise<void> {
  // Find task
  const task = findItem(sessionState.taskRegistry, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  // Get dependencies if subtask
  let dependencies: HierarchyItem[] = [];
  let dependenciesSatisfied = true;
  if (task.type === 'Subtask') {
    dependencies = getDependencies(task as Subtask, sessionState.taskRegistry);
    dependenciesSatisfied = dependencies.every(dep => dep.status === 'Complete');
  }

  // Find PRP file
  const prpPath = join(sessionState.metadata.path, 'prps', `${taskId}.md`);
  const prpExists = existsSync(prpPath);
  let prpContent: string | undefined;
  if (prpExists && options.verbose) {
    prpContent = readFileSync(prpPath, 'utf-8');
  }

  // Find artifacts
  const artifactPath = join(sessionState.metadata.path, 'artifacts', taskId);
  const artifactsExist = existsSync(artifactPath);

  // Format output
  const detail: TaskDetail = {
    task,
    dependencies,
    dependenciesSatisfied,
    prpPath: prpExists ? prpPath : undefined,
    artifactPath: artifactsExist ? artifactPath : undefined,
  };

  const output = this.formatOutput(detail, options.output);
  console.log(output);
}

// Pattern 7: Output Format Switching (src/cli/commands/inspect.ts)
private formatOutput(data: unknown, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
      // Use YAML.stringify if yaml library available, otherwise fallback
      return JSON.stringify(data, null, 2); // Fallback
    case 'tree':
      return this.formatAsTree(data);
    case 'table':
    default:
      return this.formatAsTable(data);
  }
}
```

### Integration Points

```yaml
CLI PARSER:
  - modify: src/cli/index.ts
  - add: .command('inspect') subcommand registration
  - pattern: "inspectCmd = program.command('inspect').action(options => {...})"
  - flags: --output <format>, --task <id>, --session <id>, --artifacts, --errors, --verbose

SESSION_MANAGER:
  - use: static discovery methods (listSessions, findLatestSession, findSessionByPRD)
  - use: loadSession(path) to load session state
  - use: getCurrentItem() to get current executing task

TASK_UTILS:
  - use: findItem(backlog, id) to locate specific tasks
  - use: getDependencies(task, backlog) to resolve dependencies
  - use: filterByStatus(backlog, status) for status filtering

FILE_SYSTEM:
  - read: plan/{sequence}_{hash}/tasks.json for task state
  - read: plan/{sequence}_{hash}/prps/{taskId}.md for PRP content
  - read: plan/{sequence}_{hash}/artifacts/{taskId}/ for artifacts
  - read: plan/{sequence}_{hash}/parent_session.txt for delta session reference
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint  # Runs ESLint with auto-fix
npm run check  # Runs TypeScript compiler check
npm run format  # Runs Prettier formatting

# Or use individual tools
npx eslint src/cli/commands/inspect.ts --fix
npx tsc --noEmit src/cli/commands/inspect.ts
npx prettier --write src/cli/commands/inspect.ts

# Project-wide validation
npm run lint
npm run check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm test -- src/utils/display/status-colors.test.ts
npm test -- src/utils/display/table-formatter.test.ts
npm test -- src/utils/display/tree-renderer.test.ts
npm test -- src/cli/commands/inspect.test.ts

# Full test suite for affected areas
npm test -- tests/unit/cli/
npm test -- tests/unit/utils/display/

# Coverage validation
npm run test:coverage

# Expected: All tests pass, 100% coverage for new code. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test command functionality
npm run build  # Build the project
node dist/cli/index.js inspect  # Test default overview
node dist/cli/index.js inspect --task P1.M1.T1.S1  # Test task detail
node dist/cli/index.js inspect --output json  # Test JSON output
node dist/cli/index.js inspect --output tree  # Test tree output

# Test error handling
node dist/cli/index.js inspect --task invalid-id  # Should error gracefully
node dist/cli/index.js inspect --session nonexistent  # Should error gracefully

# Test with mock session (create temporary test session)
mkdir -p /tmp/test-inspect-plan/001_testsession/prps
mkdir -p /tmp/test-inspect-plan/001_testsession/artifacts
# ... create minimal tasks.json ...
node dist/cli/index.js inspect --file /tmp/test-inspect-plan/001_testsession/tasks.json

# Expected: All commands execute successfully, proper output formatting, helpful error messages.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual Testing Scenarios

# Scenario 1: Inspect active session
node dist/cli/index.js inspect
# Verify: Session info displayed, task hierarchy shown, current task highlighted

# Scenario 2: Inspect specific task
node dist/cli/index.js inspect --task P2.M3.T2.S1 --verbose
# Verify: Task details shown, dependencies listed, PRP content displayed (if verbose)

# Scenario 3: Different output formats
node dist/cli/index.js inspect --output json | jq .  # Verify valid JSON
node dist/cli/index.js inspect --output tree  # Verify tree formatting

# Scenario 4: Filter outputs
node dist/cli/index.js inspect --artifacts  # Show only artifacts
node dist/cli/index.js inspect --errors  # Show only errors

# Scenario 5: Wide table format (if implemented)
node dist/cli/index.js inspect --output wide  # Show extended table

# Integration with existing pipeline
# Run a partial pipeline execution, then inspect state
node dist/cli/index.js --prd ./PRD.md --scope P2.M3.T2
node dist/cli/index.js inspect  # Verify state reflects execution

# Expected: All scenarios work correctly, output is readable and useful for debugging.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format` then `git diff` shows no unintended changes
- [ ] 100% test coverage for new code: `npm run test:coverage` shows 100% for src/cli/commands/ and src/utils/display/

### Feature Validation

- [ ] `prd inspect` displays all required sections (session, tasks, artifacts, errors)
- [ ] `prd inspect --task <id>` displays detailed task information
- [ ] Output formats work: table (default), json, yaml, tree
- [ ] Status indicators display correctly with colors
- [ ] Tree rendering shows proper hierarchy with connectors
- [ ] Error cases handled: missing sessions, invalid task IDs, missing artifacts
- [ ] Verbose mode shows additional detail (PRP content)
- [ ] Filter flags work: --artifacts, --errors

### Code Quality Validation

- [ ] Follows existing codebase patterns (mock patterns, factory functions, error handling)
- [ ] File placement matches desired codebase tree structure
- [ ] Commander.js subcommand pattern correctly implemented
- [ ] Session discovery and loading follows existing patterns
- [ ] Display utilities are modular and reusable
- [ ] Type safety maintained (no `any` types without justification)
- [ ] Error messages are helpful and actionable

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Complex logic has explanatory comments
- [ ] JSDoc comments for public APIs (InspectCommand class, display utility functions)
- [ ] README or docs updated with inspect command usage (if applicable)
- [ ] Package.json dependencies updated (cli-table3, chalk)

---

## Anti-Patterns to Avoid

- **Don't** break existing CLI functionality - inspect subcommand should be additive
- **Don't** use synchronous file operations in async context - use `fs.promises` or `readFileSync` only in initialization
- **Don't** hardcode session paths - use SessionManager static methods for discovery
- **Don't** modify task objects directly - they're immutable, use task-utils for updates
- **Don't** ignore errors from missing files - handle gracefully with helpful messages
- **Don't** create overly complex tree rendering - keep it simple with ASCII connectors
- **Don't** use `console.log` directly in command handlers - use the logger (except for final output)
- **Don't** skip testing edge cases - empty sessions, missing tasks, malformed task IDs
- **Don't** assume terminal width - handle narrow/wide terminals appropriately
- **Don't** mix concerns - keep display logic separate from business logic
