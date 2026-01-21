# Commander.js Subcommand Patterns Research

**Research Date:** 2025-01-21
**Purpose:** Research Commander.js patterns for implementing CLI task commands like `prd task`, `prd task next`, `prd task status`, and `prd task -f <file>`

---

## Table of Contents

1. [Commander.js Subcommand API](#commanderjs-subcommand-api)
2. [Implementation Patterns](#implementation-patterns)
3. [File Override Flags](#file-override-flags)
4. [Task Discovery in CLI Tools](#task-discovery-in-cli-tools)
5. [Best Practices](#best-practices)
6. [Code Examples](#code-examples)
7. [References](#references)

---

## Commander.js Subcommand API

### Current Version Information

**Package:** `commander`
**Version Installed:** `^14.0.2` (from `/home/dustin/projects/hacky-hack/package.json`)
**Repository:** https://github.com/tj/commander.js
**Documentation:** https://github.com/tj/commander.js/blob/master/Readme.md
**TypeScript Support:** Native (built-in TypeScript since v9)

### Core Subcommand Methods

Based on the Commander.js source code at `/home/dustin/projects/hacky-hack/node_modules/commander/lib/command.js`:

#### 1. `.command(nameAndArgs, actionOptsOrExecDesc, execOpts)`

Creates a new subcommand. Two styles:

**Style 1: Action Handler (description separate)**
```javascript
program
  .command('clone <source> [destination]')
  .description('clone a repository into a newly created directory')
  .action((source, destination) => {
    console.log('clone command called');
  });
```

**Style 2: Separate Executable File (description is second parameter)**
```javascript
program
  .command('start <service>', 'start named service')
  .command('stop [service]', 'stop named service, or all if no name supplied');
```

**Parameters:**
- `nameAndArgs`: Command name and arguments
  - Args use `<required>` or `[optional]` syntax
  - Last arg can be variadic with `...`
- `actionOptsOrExecDesc`: Configuration options (for action) or description (for executable)
- `execOpts`: Configuration options (for executable)

**Returns:** New Command for action handler, or `this` for executable command

#### 2. `.addCommand(cmd, opts)`

Adds a prepared subcommand (for more control):

```javascript
const subcommand = new Command('task');
program.addCommand(subcommand);
```

**Parameters:**
- `cmd`: Command instance (must have a name)
- `opts`: Configuration options
  - `isDefault`: Set as default command
  - `noHelp`/`hidden`: Hide from help output

#### 3. `.createCommand(name)`

Factory method to create unattached commands (can override for customization):

```javascript
const cmd = program.createCommand('my-command');
```

#### 4. `.arguments(names)`

Define argument syntax for command:

```javascript
program.arguments('<cmd> [env]');
```

---

## Implementation Patterns

### Pattern 1: Git-Style Subcommands

**Best for:** Commands with many subcommands (like `git status`, `git add`, etc.)

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('prd')
  .description('PRD Task Management CLI')
  .version('1.0.0');

// 'task' command with subcommands
const taskCommand = program
  .command('task')
  .description('Manage tasks');

// Subcommand: task next
taskCommand
  .command('next')
  .description('Show next task to work on')
  .action(() => {
    console.log('Next task...');
  });

// Subcommand: task status
taskCommand
  .command('status')
  .description('Show task status')
  .action(() => {
    console.log('Task status...');
  });

// Subcommand: task list
taskCommand
  .command('list')
  .description('List all tasks')
  .option('--filter <status>', 'Filter by status')
  .action((options) => {
    console.log('Listing tasks...', options);
  });

program.parse();
```

**Usage:**
```bash
prd task next
prd task status
prd task list --filter Complete
```

### Pattern 2: Command with Arguments

**Best for:** Commands that operate on specific items (like `prd task <id>`)

```typescript
const taskCommand = program
  .command('task [taskId]')
  .description('Manage tasks')
  .option('-f, --file <path>', 'Override default task file')
  .action((taskId, options) => {
    if (options.file) {
      console.log(`Using custom file: ${options.file}`);
    }
    if (taskId) {
      console.log(`Operating on task: ${taskId}`);
    } else {
      // Show all tasks or help
      console.log('Showing all tasks...');
    }
  });
```

**Usage:**
```bash
prd task                    # Show all tasks
prd task P1M2T3             # Operate on specific task
prd task -f custom.json     # Use custom file
prd task P1M2T3 -f tasks.json  # Both options
```

### Pattern 3: Mixed Commands and Subcommands

**Best for:** Complex CLIs with both standalone commands and nested commands

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('prd')
  .version('1.0.0');

// Global options (available to all commands)
program
  .option('-f, --file <path>', 'Override default task file')
  .option('-v, --verbose', 'Enable verbose output');

// Main command: prd task
const taskCmd = program
  .command('task')
  .description('Task management commands');

// Subcommand: prd task next
taskCmd
  .command('next')
  .description('Get next task')
  .action(() => {
    const options = program.opts();
    if (options.file) {
      console.log(`Using file: ${options.file}`);
    }
    console.log('Next task:');
  });

// Subcommand: prd task status
taskCmd
  .command('status [taskId]')
  .description('Show task status')
  .action((taskId) => {
    const options = program.opts();
    console.log(`Status for ${taskId || 'all'} tasks`);
    if (options.verbose) {
      console.log('Verbose output enabled');
    }
  });

// Standalone command: prd init
program
  .command('init')
  .description('Initialize PRD project')
  .action(() => {
    console.log('Initializing...');
  });

program.parse();
```

**Usage:**
```bash
prd init                          # Standalone command
prd task next                     # Subcommand
prd task next -f tasks.json       # Global flag with subcommand
prd task status P1M2T3 -v         # Subcommand with arg and global flag
```

---

## File Override Flags

### Pattern 1: Short and Long Flags

```typescript
program
  .command('task [taskId]')
  .option('-f, --file <path>', 'Override default task file path')
  .action((taskId, options) => {
    const taskFile = options.file || './tasks.json';
    console.log(`Using task file: ${taskFile}`);
  });
```

**Usage:**
```bash
prd task -f custom-tasks.json    # Short form
prd task --file custom-tasks.json # Long form
```

### Pattern 2: File Validation

```typescript
import { existsSync } from 'node:fs';

program
  .command('task [taskId]')
  .option('-f, --file <path>', 'Override default task file path', './tasks.json')
  .action((taskId, options) => {
    if (!existsSync(options.file)) {
      console.error(`Task file not found: ${options.file}`);
      process.exit(1);
    }
    console.log(`Using task file: ${options.file}`);
  });
```

### Pattern 3: Multiple File Options

```typescript
program
  .command('task [taskId]')
  .option('-t, --tasks <path>', 'Tasks file path', './tasks.json')
  .option('-c, --config <path>', 'Config file path', './config.json')
  .option('-o, --output <path>', 'Output file path')
  .action((taskId, options) => {
    console.log('Tasks:', options.tasks);
    console.log('Config:', options.config);
    if (options.output) {
      console.log('Output:', options.output);
    }
  });
```

**Usage:**
```bash
prd task -t custom-tasks.json -c my-config.json
```

### Pattern 4: File Type Validation

```typescript
program
  .command('task [taskId]')
  .option('-f, --file <path>', 'Task file (JSON or YAML)')
  .action((taskId, options) => {
    if (options.file) {
      const ext = options.file.split('.').pop();
      if (!['json', 'yaml', 'yml'].includes(ext)) {
        console.error('File must be JSON or YAML');
        process.exit(1);
      }
    }
  });
```

---

## Task Discovery in CLI Tools

### Pattern 1: Auto-Discovery from Files

```typescript
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function discoverTaskFiles(dir: string): string[] {
  const files = readdirSync(dir);
  return files.filter(f => f.endsWith('.task.json'));
}

program
  .command('list')
  .description('List discovered tasks')
  .option('--dir <path>', 'Tasks directory', './tasks')
  .action((options) => {
    const tasks = discoverTaskFiles(options.dir);
    console.log('Discovered tasks:');
    tasks.forEach(task => console.log(`  - ${task}`));
  });
```

### Pattern 2: Dynamic Subcommand Generation

```typescript
function createTaskCommands(program: Command, tasksDir: string) {
  const taskFiles = discoverTaskFiles(tasksDir);

  taskFiles.forEach(file => {
    const taskName = file.replace('.task.json', '');

    program
      .command(taskName)
      .description(`Execute ${taskName} task`)
      .action(() => {
        console.log(`Executing task from ${file}`);
      });
  });
}

const program = new Command();
program.name('prd');
createTaskCommands(program, './tasks');
```

### Pattern 3: Task Registry Pattern

```typescript
interface TaskDefinition {
  name: string;
  description: string;
  handler: () => void | Promise<void>;
}

const taskRegistry: TaskDefinition[] = [
  {
    name: 'next',
    description: 'Get next task',
    handler: () => console.log('Next task: P1M2T3'),
  },
  {
    name: 'status',
    description: 'Show task status',
    handler: () => console.log('Status: All systems operational'),
  },
  {
    name: 'list',
    description: 'List all tasks',
    handler: () => console.log('Tasks: P1M1T1, P1M2T3'),
  },
];

function registerTasks(program: Command) {
  const taskCmd = program.command('task').description('Manage tasks');

  taskRegistry.forEach(task => {
    taskCmd.command(task.name).description(task.description).action(task.handler);
  });
}

const program = new Command();
program.name('prd');
registerTasks(program);
```

### Pattern 4: Default Subcommand

```typescript
const taskCmd = program
  .command('task [command]')
  .description('Manage tasks (default: list)')
  .action((command) => {
    // If no subcommand specified, default to 'list'
    if (!command) {
      console.log('Listing all tasks (default)...');
    } else {
      console.error(`Unknown task command: ${command}`);
      process.exit(1);
    }
  });

// Add explicit subcommands
taskCmd.command('list').description('List tasks').action(() => {
  console.log('Listing tasks...');
});
```

---

## Best Practices

### 1. Command Organization

**DO:** Group related commands under a parent command
```typescript
// Good
program
  .command('task')
  .command('next')
  .command('status')
  .command('list');
```

**DON'T:** Flat structure for many commands
```typescript
// Avoid for complex CLIs
program
  .command('task-next')
  .command('task-status')
  .command('task-list');
```

### 2. Option Naming Conventions

| Purpose | Pattern | Example |
|---------|---------|---------|
| File override | `-f, --file <path>` | `prd task -f custom.json` |
| Verbose output | `-v, --verbose` | `prd task -v` |
| Help | `-h, --help` | `prd task -h` |
| Version | `-V, --version` | `prd -V` |
| Force/Override | `--force` | `prd task --force` |
| Config | `-c, --config <path>` | `prd -c config.json` |

### 3. Type Safety with TypeScript

```typescript
interface TaskOptions {
  file?: string;
  verbose: boolean;
  filter?: string;
}

const taskCmd = program
  .command('task')
  .option('-f, --file <path>', 'Task file path')
  .option('-v, --verbose', 'Verbose output')
  .option('--filter <status>', 'Filter by status')
  .action((options) => {
    const opts = options as TaskOptions;
    // Fully typed!
    console.log(opts.file);
    console.log(opts.verbose);
  });
```

### 4. Help Text Quality

```typescript
program
  .command('task [taskId]')
  .description('Manage PRD tasks')
  .addHelpText('after', `
Examples:
  prd task                    List all tasks
  prd task P1M2T3             Show specific task
  prd task next               Get next task to work on
  prd task -f tasks.json      Use custom task file
  `);
```

### 5. Error Handling

```typescript
program
  .command('task [taskId]')
  .option('-f, --file <path>', 'Task file path')
  .action((taskId, options) => {
    try {
      // Validate file exists
      if (options.file && !existsSync(options.file)) {
        throw new Error(`File not found: ${options.file}`);
      }

      // Validate task ID format
      if (taskId && !/^P\d+M\d+T\d+$/.test(taskId)) {
        throw new Error(`Invalid task ID format: ${taskId}`);
      }

      // Execute task logic
      executeTask(taskId, options.file);

    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });
```

### 6. Global vs Local Options

**Global Options** (appear before subcommand):
```bash
prd -v task next              # Verbose applies to all commands
prd -f custom.json task next  # File applies to task command
```

**Local Options** (appear after subcommand):
```bash
prd task next --format json   # Format only for 'next' subcommand
```

**Implementation:**
```typescript
// Global options
program
  .option('-f, --file <path>', 'Task file path')
  .option('-v, --verbose', 'Verbose output');

// Local options
taskCmd
  .command('next')
  .option('--format <type>', 'Output format (json, text)', 'text')
  .action((options) => {
    const globalOpts = program.opts();
    const localOpts = options;

    console.log('Global file:', globalOpts.file);
    console.log('Local format:', localOpts.format);
  });
```

### 7. Command Aliases

```typescript
program
  .command('status')
  .alias('st')
  .description('Show task status')
  .action(() => {
    console.log('Status...');
  });

// Usage: prd task status OR prd task st
```

---

## Code Examples

### Example 1: Complete Task CLI

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';

interface Task {
  id: string;
  title: string;
  status: 'Planned' | 'Researching' | 'Implementing' | 'Complete';
}

interface TaskOptions {
  file?: string;
  verbose: boolean;
}

const program = new Command();

program
  .name('prd')
  .description('PRD Task Management CLI')
  .version('1.0.0')
  .option('-f, --file <path>', 'Task file path', './tasks.json')
  .option('-v, --verbose', 'Enable verbose output', false);

function loadTasks(filePath: string): Task[] {
  if (!existsSync(filePath)) {
    console.error(`Task file not found: ${filePath}`);
    process.exit(1);
  }
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Task command group
const taskCmd = program
  .command('task')
  .description('Task management commands');

// Subcommand: task next
taskCmd
  .command('next')
  .description('Get next task to work on')
  .action(() => {
    const opts = program.opts<TaskOptions>();
    const tasks = loadTasks(opts.file);

    const nextTask = tasks.find(t => t.status !== 'Complete');
    if (nextTask) {
      console.log(`Next task: ${nextTask.id} - ${nextTask.title}`);
      if (opts.verbose) {
        console.log(`Status: ${nextTask.status}`);
      }
    } else {
      console.log('No pending tasks!');
    }
  });

// Subcommand: task status
taskCmd
  .command('status [taskId]')
  .description('Show task status')
  .action((taskId) => {
    const opts = program.opts<TaskOptions>();
    const tasks = loadTasks(opts.file);

    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        console.log(`Task ${task.id}: ${task.status}`);
        if (opts.verbose) {
          console.log(`Title: ${task.title}`);
        }
      } else {
        console.error(`Task not found: ${taskId}`);
        process.exit(1);
      }
    } else {
      console.log('Task status summary:');
      tasks.forEach(t => console.log(`  ${t.id}: ${t.status}`));
    }
  });

// Subcommand: task list
taskCmd
  .command('list')
  .description('List all tasks')
  .option('--filter <status>', 'Filter by status')
  .action((options) => {
    const opts = program.opts<TaskOptions>();
    const tasks = loadTasks(opts.file);

    let filteredTasks = tasks;
    if (options.filter) {
      filteredTasks = tasks.filter(t => t.status === options.filter);
    }

    console.log('Tasks:');
    filteredTasks.forEach(t => {
      console.log(`  ${t.id}: ${t.title} [${t.status}]`);
    });
  });

program.parse();
```

**Usage:**
```bash
prd task next                    # Get next task
prd task status                  # Show all task statuses
prd task status P1M2T3          # Show specific task
prd task list                   # List all tasks
prd task list --filter Complete # List completed tasks
prd task -f custom.json next    # Use custom file
prd -v task next                # Verbose output
```

### Example 2: Executable Subcommands

For better organization, use separate files:

**File structure:**
```
src/cli/
├── index.ts         # Main CLI entry
└── commands/
    ├── task.ts
    ├── init.ts
    └── status.ts
```

**index.ts:**
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { taskCommand } from './commands/task.js';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('prd')
  .description('PRD Task Management CLI')
  .version('1.0.0');

program.addCommand(taskCommand);
program.addCommand(initCommand);

program.parse();
```

**commands/task.ts:**
```typescript
import { Command } from 'commander';

export const taskCommand = new Command('task');

taskCommand.description('Task management commands');

taskCommand
  .command('next')
  .description('Get next task')
  .action(() => {
    console.log('Next task...');
  });

taskCommand
  .command('status [taskId]')
  .description('Show task status')
  .action((taskId) => {
    console.log(`Status for ${taskId || 'all'}`);
  });
```

### Example 3: Action Handler with Arguments

```typescript
program
  .command('task <taskId> [action]')
  .description('Perform action on a task')
  .option('-f, --file <path>', 'Task file')
  .action((taskId, action, options) => {
    console.log(`Task: ${taskId}`);
    console.log(`Action: ${action || 'info'}`);  // Default action
    console.log(`File: ${options.file || 'default'}`);

    switch(action) {
      case 'start':
        console.log('Starting task...');
        break;
      case 'complete':
        console.log('Completing task...');
        break;
      case 'info':
      default:
        console.log('Showing task info...');
    }
  });
```

**Usage:**
```bash
prd task P1M2T3              # Show info (default)
prd task P1M2T3 start        # Start task
prd task P1M2T3 complete     # Complete task
prd task P1M2T3 -f custom.json start  # With custom file
```

---

## References

### Official Documentation

- **Commander.js GitHub Repository**
  URL: https://github.com/tj/commander.js
  - Source code reference at `/home/dustin/projects/hacky-hack/node_modules/commander/lib/command.js`
  - TypeScript definitions at `/home/dustin/projects/hacky-hack/node_modules/commander/typings/index.d.ts`

- **Commander.js README**
  URL: https://github.com/tj/commander.js/blob/master/Readme.md

- **NPM Package**
  URL: https://www.npmjs.com/package/commander

### Existing Project Documentation

- **CLI Libraries Research** (from this codebase)
  Path: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P3M4T2S1/research/cli-libraries.md`
  - Comprehensive comparison of Commander.js vs Yargs
  - Implementation patterns for the PRP pipeline

- **Current CLI Implementation** (from this codebase)
  Path: `/home/dustin/projects/hacky-hack/src/cli/index.ts`
  - Existing Commander.js usage patterns
  - Type-safe CLI argument parsing

- **CLI Help Parser** (from this codebase)
  Path: `/home/dustin/projects/hacky-hack/src/utils/cli-help-parser.ts`
  - Regex patterns for parsing CLI help output
  - Flag detection utilities

### Related Research

- **CLI Argument Patterns Research**
  Path: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P3M2T2S1/research/parsing_patterns_research.md`

- **External Dependencies Documentation**
  Path: `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/external_deps.md`

### Open Source Examples

While web search is currently rate-limited, these GitHub repositories are known to use Commander.js extensively:

- **npm CLI**: https://github.com/npm/cli
- **ESLint**: https://github.com/eslint/eslint
- **Prettier**: https://github.com/prettier/prettier
- **Expo CLI**: https://github.com/expo/expo-cli
- **Serverless Framework**: https://github.com/serverless/serverless

Search GitHub for examples:
```bash
# Find Commander.js usage
language:typescript commander

# Find CLI patterns
filename:cli.ts commander

# Find task commands
language:typescript "task" "commander"
```

---

## Summary

### Key Takeaways

1. **Commander.js provides two main patterns for subcommands:**
   - Action handlers (inline logic)
   - Separate executable files (for modular CLIs)

2. **File override flags follow standard patterns:**
   - Use `-f, --file <path>` for file overrides
   - Provide default values
   - Validate file existence and type

3. **Task discovery can be:**
   - Static (defined in code)
   - Dynamic (discovered from files)
   - Registry-based (configured at runtime)

4. **Best practices:**
   - Group related commands under parent commands
   - Use consistent option naming conventions
   - Provide TypeScript types for all options
   - Include comprehensive help text
   - Handle errors gracefully

5. **Implementation patterns:**
   - Git-style: `prd task next`, `prd task status`
   - Argument-based: `prd task <id> <action>`
   - Mixed: Standalone commands + nested subcommands

### Recommended Pattern for `prd` CLI

Based on the research, the recommended pattern for the PRD CLI is:

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('prd')
  .description('PRD Task Management CLI')
  .version('1.0.0')
  .option('-f, --file <path>', 'Task file path', './tasks.json');

// Main task command
const taskCmd = program.command('task').description('Manage tasks');

// Subcommands
taskCmd
  .command('next')
  .description('Get next task to work on')
  .action(handleNextTask);

taskCmd
  .command('status [taskId]')
  .description('Show task status')
  .action(handleTaskStatus);

taskCmd
  .command('list')
  .description('List all tasks')
  .option('--filter <status>', 'Filter by status')
  .action(handleTaskList);

program.parse();
```

This provides:
- Clean, intuitive CLI (`prd task next`, `prd task status`)
- Global file override flag
- Type-safe implementation
- Extensible structure for future commands

---

**Document Version:** 1.0
**Last Updated:** 2025-01-21
**Commander.js Version:** 14.0.2
