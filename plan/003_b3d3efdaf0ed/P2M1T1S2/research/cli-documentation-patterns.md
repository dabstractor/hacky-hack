# CLI Documentation Patterns Research

**Research Date:** 2026-01-23
**Purpose:** Research best practices for documenting CLI tools built with Commander.js and similar libraries
**Target:** PRP Pipeline CLI Documentation

## Table of Contents

1. [Commander.js Documentation Patterns](#commanderjs-documentation-patterns)
2. [CLI Reference Sections](#cli-reference-sections)
3. [Example Documentation from Popular Tools](#example-documentation-from-popular-tools)
4. [Cross-Reference Patterns](#cross-reference-patterns)
5. [Templates and Examples](#templates-and-examples)
6. [Best Practices Checklist](#best-practices-checklist)
7. [References](#references)

---

## Commander.js Documentation Patterns

### Auto-Generated Help vs Custom Documentation

Commander.js provides built-in help generation that displays:

- Command descriptions
- Options with flags, arguments, and descriptions
- Default values
- Version information
- Usage examples (if configured)

#### When to Use Auto-Generated Help

**Use auto-generated help when:**

- CLI has simple option structures
- Documentation is primarily for developers who can run `--help`
- Options are self-explanatory
- Quick reference is sufficient

**Example from Commander.js:**

```typescript
// Auto-generated help output
$ prp-pipeline --help

Usage: prp-pipeline [options]

Options:
  --prd <path>              Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>           Scope identifier (e.g., P3.M4, P3.M4.T2)
  --mode <mode>             Execution mode (choices: "normal", "bug-hunt", "validate")
  --continue                Resume from previous session
  --dry-run                 Show plan without executing
  --verbose                 Enable debug logging
  --machine-readable        Enable machine-readable JSON output
  --no-cache                Bypass cache and regenerate all PRPs
  --continue-on-error       Treat all errors as non-fatal
  --validate-prd            Validate PRD and exit without running pipeline
  -h, --help                display help for command
  -V, -V, --version         output the version number
```

#### When to Create Custom Documentation

**Create custom documentation when:**

- CLI has complex workflows or multiple commands
- Users need detailed explanations beyond option names
- Configuration precedence needs explanation
- Examples are crucial for understanding
- Environment variables and config files need documentation
- Migration guides or upgrade notes are needed

### Commander.js Documentation Structure

#### 1. Help Customization

Commander.js allows customization of help output:

```typescript
import { Command } from 'commander';

const program = new Command();

// Customize help section ordering
program.configureHelp({
  sortSubcommands: true,
  sortOptions: true,
});

// Add custom help sections
program.addHelpText(
  'beforeAll',
  `
PRP Pipeline - Automated Software Development
=============================================
`
);

program.addHelpText(
  'after',
  `
Examples:
  $ prp-pipeline --prd ./PRD.md
  $ prp-pipeline --scope P3.M4 --mode bug-hunt
  $ prp-pipeline --dry-run --verbose

Documentation: https://github.com/your-org/prp-pipeline
`
);

// Add option-specific help
program.addHelpText(
  'afterAll',
  `
For more information, visit:
  https://github.com/your-org/prp-pipeline#readme
`
);
```

#### 2. Descriptive Option Patterns

**Best practices for option descriptions:**

```typescript
// ✅ Good: Clear, actionable description
program.option('--prd <path>', 'Path to PRD markdown file', './PRD.md');

// ✅ Good: Shows choices and default
program
  .createOption('--mode <mode>', 'Execution mode for the pipeline')
  .choices(['normal', 'bug-hunt', 'validate'])
  .default('normal');

// ✅ Good: Explains boolean flag behavior
program.option('--dry-run', 'Show planned changes without executing them');

// ✅ Good: Indicates override behavior
program.option(
  '--no-cache',
  'Bypass cache and regenerate all PRPs (overrides cache settings)'
);
```

**Anti-patterns to avoid:**

```typescript
// ❌ Bad: Vague description
program.option('--prd <path>', 'PRD file');

// ❌ Bad: Missing context
program.option('--mode <mode>', 'Mode');

// ❌ Bad: Doesn't explain boolean behavior
program.option('--dry-run', 'Dry run');

// ❌ Bad: Doesn't show default
program.option('--max-tasks <number>', 'Max tasks');
```

---

## CLI Reference Sections

### Standard CLI Documentation Structure

A comprehensive CLI reference should include:

#### 1. Quick Start / Getting Started

Brief introduction to get users running immediately.

#### 2. Installation

How to install the CLI tool.

#### 3. Basic Usage

Simple command examples.

#### 4. Command Reference

Detailed documentation for each command.

#### 5. Options Reference

Comprehensive option documentation.

#### 6. Configuration

Environment variables, config files, and precedence.

#### 7. Examples

Real-world usage scenarios.

#### 8. Troubleshooting

Common issues and solutions.

### Flag vs Option Documentation

**Definitions:**

- **Flag**: Boolean option (presence/absence)
- **Option**: Takes a value (string, number, etc.)

**Documentation Pattern:**

```markdown
## Options

### Input Options

| Option            | Type   | Default      | Description                              |
| ----------------- | ------ | ------------ | ---------------------------------------- |
| `--prd <path>`    | string | `"./PRD.md"` | Path to PRD markdown file                |
| `--scope <scope>` | string | `undefined`  | Scope identifier (e.g., P3.M4, P3.M4.T2) |
| `--max-tasks <n>` | number | `undefined`  | Maximum number of tasks to execute       |

### Execution Mode Options

| Option          | Type   | Choices                    | Default    | Description    |
| --------------- | ------ | -------------------------- | ---------- | -------------- |
| `--mode <mode>` | string | normal, bug-hunt, validate | `"normal"` | Execution mode |

### Boolean Flags

| Flag                  | Default | Description                            |
| --------------------- | ------- | -------------------------------------- |
| `--continue`          | `false` | Resume from previous session           |
| `--dry-run`           | `false` | Show planned changes without executing |
| `--verbose`           | `false` | Enable debug logging                   |
| `--no-cache`          | `false` | Bypass cache and regenerate all PRPs   |
| `--continue-on-error` | `false` | Treat all errors as non-fatal          |
| `--validate-prd`      | `false` | Validate PRD and exit without running  |
| `--machine-readable`  | `false` | Output in JSON format                  |
```

### Global Flags vs Command-Specific Flags

**Global Flags:**
Available to all commands or the main program.

```markdown
## Global Options

These options can be used with any command:

| Option            | Description                         |
| ----------------- | ----------------------------------- |
| `--verbose, -v`   | Enable verbose output for debugging |
| `--quiet, -q`     | Suppress all output except errors   |
| `--no-color`      | Disable colored output              |
| `--config <path>` | Path to configuration file          |
| `-h, --help`      | Display help for the command        |
| `-V, --version`   | Output the version number           |
```

**Command-Specific Flags:**
Only available to specific commands.

````markdown
## Command: `run`

Execute the PRP pipeline.

### Usage

```bash
prp-pipeline run [options]
```
````

### Options

| Option            | Description                                 |
| ----------------- | ------------------------------------------- |
| `--scope <scope>` | Limit execution to specific scope           |
| `--mode <mode>`   | Execution mode (normal, bug-hunt, validate) |
| `--continue`      | Resume from previous session                |
| `--dry-run`       | Show plan without executing                 |

````

---

## Example Documentation from Popular Tools

### 1. Vite CLI Documentation Pattern

**Source:** https://vitejs.dev/guide/cli.html

**Key Patterns:**
- Clear command syntax at the top
- Options grouped by functionality
- Tables for easy scanning
- Examples mixed with options

**Template inspired by Vite:**

```markdown
# CLI Reference

## Usage

```bash
$ prp-pipeline <command> [options]
````

## Commands

| Command    | Description                        |
| ---------- | ---------------------------------- |
| `run`      | Execute the PRP pipeline (default) |
| `status`   | Show current pipeline status       |
| `validate` | Validate PRD without executing     |
| `clean`    | Clean pipeline cache and artifacts |

## Options

### `--prd <path>`

- **Type:** `string`
- **Default:** `"./PRD.md"`
- **Description:** Path to the PRD markdown file

**Example:**

```bash
$ prp-pipeline --prd ./docs/PRD.md
```

### `--mode <mode>`

- **Type:** `string`
- **Choices:** `"normal"` | `"bug-hunt"` | `"validate"`
- **Default:** `"normal"`
- **Description:** Execution mode for the pipeline

**Example:**

```bash
$ prp-pipeline --mode bug-hunt
```

## Examples

### Basic Usage

```bash
# Run with default PRD
$ prp-pipeline

# Run with custom PRD
$ prp-pipeline --prd ./my-project/PRD.md

# Dry run to see what will happen
$ prp-pipeline --dry-run

# Resume from previous session
$ prp-pipeline --continue
```

### Scoped Execution

```bash
# Run specific milestone
$ prp-pipeline --scope P3.M4

# Run specific task
$ prp-pipeline --scope P3.M4.T2

# Run specific subtask
$ prp-pipeline --scope P3.M4.T2.S1
```

### Debug Mode

```bash
# Enable verbose logging
$ prp-pipeline --verbose

# Combine with dry-run for debugging
$ prp-pipeline --dry-run --verbose
```

````

### 2. ESLint CLI Documentation Pattern

**Source:** https://eslint.org/docs/latest/use/command-line-interface

**Key Patterns:**
- Extensive examples section
- Clear grouping of options
- Exit codes documented
- Environment variable references

**Template inspired by ESLint:**

```markdown
# Command Line Interface Reference

## Syntax

```bash
prp-pipeline [options]
prp-pipeline <command> [options]
````

## Options

### Core Options

| Option            | Type    | Description                 |
| ----------------- | ------- | --------------------------- |
| `--prd <path>`    | string  | Path to PRD file            |
| `--scope <scope>` | string  | Scope identifier            |
| `--mode <mode>`   | string  | Execution mode              |
| `--continue`      | boolean | Resume from session         |
| `--dry-run`       | boolean | Show plan without executing |

### Output Options

| Option               | Type    | Description           |
| -------------------- | ------- | --------------------- |
| `--verbose`          | boolean | Enable debug logging  |
| `--machine-readable` | boolean | Output in JSON format |
| `--quiet`            | boolean | Only output errors    |

### Cache Options

| Option          | Type    | Description                |
| --------------- | ------- | -------------------------- |
| `--no-cache`    | boolean | Bypass cache               |
| `--clean-cache` | boolean | Clear cache before running |

### Error Handling Options

| Option                | Type    | Description               |
| --------------------- | ------- | ------------------------- |
| `--continue-on-error` | boolean | Treat errors as non-fatal |
| `--validate-prd`      | boolean | Validate PRD and exit     |

## Examples

### Basic Usage

```bash
# Run with default settings
$ prp-pipeline

# Specify PRD file
$ prp-pipeline --prd ./docs/PRD.md

# Run in bug-hunt mode
$ prp-pipeline --mode bug-hunt

# Dry run
$ prp-pipeline --dry-run
```

### Scoped Execution

```bash
# Run specific milestone
$ prp-pipeline --scope P3.M4

# Run specific task
$ prp-pipeline --scope P3.M4.T2

# Run specific subtask
$ prp-pipeline --scope P3.M4.T2.S1
```

### Debug Mode

```bash
# Enable verbose logging
$ prp-pipeline --verbose

# Continue on error with verbose output
$ prp-pipeline --continue-on-error --verbose
```

### Cache Control

```bash
# Bypass cache
$ prp-pipeline --no-cache

# Clear cache and run
$ prp-pipeline --clean-cache
```

## Exit Codes

| Code | Meaning               |
| ---- | --------------------- |
| `0`  | Success               |
| `1`  | General error         |
| `2`  | PRD validation failed |
| `3`  | Configuration error   |
| `4`  | Task execution failed |

## Environment Variables

| Variable        | Description                              |
| --------------- | ---------------------------------------- |
| `PRP_PRD_PATH`  | Default path to PRD file                 |
| `PRP_CACHE_DIR` | Cache directory location                 |
| `PRP_LOG_LEVEL` | Logging level (error, warn, info, debug) |
| `PRP_MAX_TASKS` | Maximum number of tasks to execute       |
| `PRP_NO_COLOR`  | Disable colored output if set            |

## Configuration Files

PRP Pipeline can be configured using:

1. **Command-line options** (highest priority)
2. **Environment variables**
3. **Configuration file** (`.prprc.json`, `prp.config.js`)
4. **Default values** (lowest priority)

````

### 3. TypeScript Compiler CLI Pattern

**Source:** https://www.typescriptlang.org/docs/handbook/compiler-options.html

**Key Patterns:**
- Alphabetical option listing
- Quick reference tables
- Detailed explanations
- Links to related options

**Template inspired by TypeScript:**

```markdown
# CLI Options Reference

## Quick Reference

### Input Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--prd <path>` | string | `"./PRD.md"` | Path to PRD file |
| `--scope <scope>` | string | - | Scope identifier |
| `--mode <mode>` | string | `"normal"` | Execution mode |

### Execution Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--dry-run` | boolean | `false` | Show plan without executing |
| `--continue` | boolean | `false` | Resume from session |
| `--no-cache` | boolean | `false` | Bypass cache |

### Output Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--verbose` | boolean | `false` | Enable debug logging |
| `--quiet` | boolean | `false` | Suppress non-error output |
| `--machine-readable` | boolean | `false` | JSON output format |

### Error Handling

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--continue-on-error` | boolean | `false` | Non-fatal errors |
| `--validate-prd` | boolean | `false` | Validate and exit |

## Detailed Options

### --prd <path>

Specifies the path to the PRD markdown file.

- **Type:** `string`
- **Default:** `"./PRD.md"`
- **Examples:**
  ```bash
  $ prp-pipeline --prd ./docs/PRD.md
  $ prp-pipeline --prd ~/project/PRD.md
````

### --scope <scope>

Limits execution to a specific scope.

- **Type:** `string`
- **Format:** `P<M>.<M>[.T<T>[.S<S>]]`
- **Examples:**
  - Milestone: `P3.M4`
  - Task: `P3.M4.T2`
  - Subtask: `P3.M4.T2.S1`

### --mode <mode>

Sets the execution mode.

- **Type:** `string`
- **Choices:**
  - `"normal"`: Standard execution
  - `"bug-hunt"`: Focus on finding bugs
  - `"validate"`: Validate without executing
- **Default:** `"normal"`

### --dry-run

Shows what would be executed without making changes.

- **Type:** `boolean`
- **Default:** `false`
- **Use case:** Preview changes before execution

### --verbose

Enables detailed debug logging.

- **Type:** `boolean`
- **Default:** `false`
- **Use case:** Debugging pipeline execution

````

---

## Cross-Reference Patterns

### Linking CLI Options to Environment Variables

**Pattern 1: Side-by-Side Documentation**

```markdown
## Configuration Options

PRP Pipeline can be configured via CLI options, environment variables, or config files.

### Input Configuration

| CLI Option | Environment Variable | Config File Key | Default | Description |
|------------|---------------------|-----------------|---------|-------------|
| `--prd <path>` | `PRP_PRD_PATH` | `prdPath` | `"./PRD.md"` | Path to PRD file |
| `--scope <scope>` | `PRP_SCOPE` | `scope` | `undefined` | Scope identifier |
| `--mode <mode>` | `PRP_MODE` | `mode` | `"normal"` | Execution mode |

### Execution Configuration

| CLI Option | Environment Variable | Config File Key | Default | Description |
|------------|---------------------|-----------------|---------|-------------|
| `--max-tasks <n>` | `PRP_MAX_TASKS` | `maxTasks` | `undefined` | Max tasks to execute |
| `--max-duration <ms>` | `PRP_MAX_DURATION` | `maxDuration` | `undefined` | Max execution time (ms) |
| `--continue` | `PRP_CONTINUE` | `continue` | `false` | Resume from session |

### Cache Configuration

| CLI Option | Environment Variable | Config File Key | Default | Description |
|------------|---------------------|-----------------|---------|-------------|
| `--no-cache` | `PRP_NO_CACHE` | `noCache` | `false` | Bypass cache |
| `--cache-dir <path>` | `PRP_CACHE_DIR` | `cacheDir` | `".prp-cache"` | Cache directory |
````

**Pattern 2: Precedence Documentation**

````markdown
## Configuration Precedence

PRP Pipeline loads configuration from multiple sources. When the same option is set in multiple places, the following precedence order applies (highest to lowest):

1. **Command-line options** - Highest priority
   ```bash
   $ prp-pipeline --prd ./custom/PRD.md
   ```
````

2. **Environment variables**

   ```bash
   $ export PRP_PRD_PATH=./custom/PRD.md
   $ prp-pipeline
   ```

3. **Configuration files** (`.prprc.json`, `prp.config.js`)

   ```json
   {
     "prdPath": "./custom/PRD.md"
   }
   ```

4. **Default values** - Lowest priority
   - PRD path: `"./PRD.md"`
   - Mode: `"normal"`

### Example: Precedence in Action

```bash
# Config file has prdPath: "./config/PRD.md"
# Environment has PRP_PRD_PATH="./env/PRD.md"
# CLI option is --prd ./cli/PRD.md

$ prp-pipeline --prd ./cli/PRD.md
# Uses: ./cli/PRD.md (CLI option wins)

$ prp-pipeline
# Uses: ./env/PRD.md (Environment variable wins)

$ unset PRP_PRD_PATH
$ prp-pipeline
# Uses: ./config/PRD.md (Config file wins)
```

### Boolean Flags and Negation

Some boolean flags support negation:

````markdown
## Cache Options

| CLI Option   | Environment Variable | Description            |
| ------------ | -------------------- | ---------------------- |
| `--no-cache` | `PRP_NO_CACHE=1`     | Disable cache          |
| `--cache`    | `PRP_NO_CACHE=0`     | Enable cache (default) |

**Note:** The `--no-cache` flag disables caching. To explicitly enable caching, use `--cache` or omit the flag.

### Examples

```bash
# Disable cache via CLI
$ prp-pipeline --no-cache

# Disable cache via environment
$ export PRP_NO_CACHE=1
$ prp-pipeline

# Enable cache explicitly (override environment)
$ PRP_NO_CACHE=1 prp-pipeline --cache
```
````

---

## Templates and Examples

### Template 1: README.md Quick Start

````markdown
# PRP Pipeline

Automated software development from PRD to code.

## Quick Start

```bash
# Install
npm install -g @your-org/prp-pipeline

# Run with default PRD
prp-pipeline

# Specify custom PRD
prp-pipeline --prd ./docs/PRD.md

# Dry run to see what will happen
prp-pipeline --dry-run
```
````

## Documentation

- [CLI Reference](./docs/cli.md) - Complete command-line interface documentation
- [Configuration](./docs/configuration.md) - Configuration files and environment variables
- [Examples](./docs/examples.md) - Usage examples and workflows

## Common Options

| Option            | Description                                |
| ----------------- | ------------------------------------------ |
| `--prd <path>`    | Path to PRD file (default: `./PRD.md`)     |
| `--scope <scope>` | Limit execution to specific scope          |
| `--mode <mode>`   | Execution mode: normal, bug-hunt, validate |
| `--dry-run`       | Show plan without executing                |
| `--verbose`       | Enable debug logging                       |

## Examples

See the [Examples documentation](./docs/examples.md) for more usage scenarios.

## Help

```bash
prp-pipeline --help
```

````

### Template 2: docs/cli.md Complete CLI Reference

```markdown
# CLI Reference

Complete reference for the PRP Pipeline command-line interface.

## Installation

```bash
npm install -g @your-org/prp-pipeline
````

## Basic Usage

```bash
prp-pipeline [options]
```

## Options

### Input Options

#### `--prd <path>`

Path to the PRD markdown file.

- **Type:** `string`
- **Default:** `"./PRD.md"`
- **Environment Variable:** `PRP_PRD_PATH`
- **Config Key:** `prdPath`

**Example:**

```bash
prp-pipeline --prd ./docs/PRD.md
```

#### `--scope <scope>`

Limit execution to a specific scope.

- **Type:** `string`
- **Format:** `P<M>.<M>[.T<T>[.S<S>]]`
- **Environment Variable:** `PRP_SCOPE`
- **Config Key:** `scope`

**Examples:**

```bash
# Milestone
prp-pipeline --scope P3.M4

# Task
prp-pipeline --scope P3.M4.T2

# Subtask
prp-pipeline --scope P3.M4.T2.S1
```

### Execution Mode

#### `--mode <mode>`

Execution mode for the pipeline.

- **Type:** `string`
- **Choices:** `"normal"` | `"bug-hunt"` | `"validate"`
- **Default:** `"normal"`
- **Environment Variable:** `PRP_MODE`
- **Config Key:** `mode`

**Modes:**

- `normal`: Standard execution (default)
- `bug-hunt`: Focus on finding and fixing bugs
- `validate`: Validate PRD without executing

**Example:**

```bash
prp-pipeline --mode bug-hunt
```

### Execution Control

#### `--dry-run`

Show planned changes without executing them.

- **Type:** `boolean`
- **Default:** `false`

**Example:**

```bash
prp-pipeline --dry-run
```

#### `--continue`

Resume execution from previous session.

- **Type:** `boolean`
- **Default:** `false`
- **Environment Variable:** `PRP_CONTINUE`
- **Config Key:** `continue`

**Example:**

```bash
prp-pipeline --continue
```

### Output Options

#### `--verbose`

Enable detailed debug logging.

- **Type:** `boolean`
- **Default:** `false`
- **Environment Variable:** `PRP_VERBOSE`
- **Config Key:** `verbose`

**Example:**

```bash
prp-pipeline --verbose
```

#### `--machine-readable`

Output in machine-readable JSON format.

- **Type:** `boolean`
- **Default:** `false`
- **Environment Variable:** `PRP_MACHINE_READABLE`
- **Config Key:** `machineReadable`

**Example:**

```bash
prp-pipeline --machine-readable | jq .
```

### Cache Options

#### `--no-cache`

Bypass cache and regenerate all PRPs.

- **Type:** `boolean`
- **Default:** `false`
- **Environment Variable:** `PRP_NO_CACHE`
- **Config Key:** `noCache`

**Example:**

```bash
prp-pipeline --no-cache
```

### Error Handling

#### `--continue-on-error`

Treat all errors as non-fatal.

- **Type:** `boolean`
- **Default:** `false`
- **Environment Variable:** `PRP_CONTINUE_ON_ERROR`
- **Config Key:** `continueOnError`

**Example:**

```bash
prp-pipeline --continue-on-error
```

#### `--validate-prd`

Validate PRD and exit without running pipeline.

- **Type:** `boolean`
- **Default:** `false`

**Example:**

```bash
prp-pipeline --validate-prd
```

## Configuration Precedence

Options are loaded in the following order (highest to lowest priority):

1. Command-line options
2. Environment variables
3. Configuration files
4. Default values

## Examples

### Basic Usage

```bash
# Run with default PRD
prp-pipeline

# Run with custom PRD
prp-pipeline --prd ./docs/PRD.md

# Dry run
prp-pipeline --dry-run
```

### Scoped Execution

```bash
# Run specific milestone
prp-pipeline --scope P3.M4

# Run specific task
prp-pipeline --scope P3.M4.T2
```

### Debug Mode

```bash
# Enable verbose logging
prp-pipeline --verbose

# Continue on error with verbose output
prp-pipeline --continue-on-error --verbose
```

### Cache Control

```bash
# Bypass cache
prp-pipeline --no-cache

# Clear cache before running
prp-pipeline --clean-cache
```

## Exit Codes

| Code | Meaning               |
| ---- | --------------------- |
| `0`  | Success               |
| `1`  | General error         |
| `2`  | PRD validation failed |
| `3`  | Configuration error   |
| `4`  | Task execution failed |

````

### Template 3: Option Table for Quick Reference

```markdown
## Quick Option Reference

| Option | Short | Type | Default | Env Var | Description |
|--------|-------|------|---------|---------|-------------|
| `--prd <path>` | - | string | `"./PRD.md"` | `PRP_PRD_PATH` | Path to PRD file |
| `--scope <scope>` | - | string | - | `PRP_SCOPE` | Scope identifier |
| `--mode <mode>` | - | string | `"normal"` | `PRP_MODE` | Execution mode |
| `--continue` | - | boolean | `false` | `PRP_CONTINUE` | Resume from session |
| `--dry-run` | - | boolean | `false` | - | Show plan without executing |
| `--verbose` | - | boolean | `false` | `PRP_VERBOSE` | Enable debug logging |
| `--machine-readable` | - | boolean | `false` | `PRP_MACHINE_READABLE` | JSON output |
| `--no-cache` | - | boolean | `false` | `PRP_NO_CACHE` | Bypass cache |
| `--continue-on-error` | - | boolean | `false` | `PRP_CONTINUE_ON_ERROR` | Non-fatal errors |
| `--validate-prd` | - | boolean | `false` | - | Validate PRD and exit |
| `--help` | `-h` | - | - | - | Show help |
| `--version` | `-V` | - | - | - | Show version |
````

---

## Best Practices Checklist

### Content Quality

- [ ] All options are documented
- [ ] Default values are shown
- [ ] Types are specified (string, number, boolean, choices)
- [ ] Choices are enumerated (when applicable)
- [ ] Environment variables are cross-referenced
- [ ] Examples are provided for complex options
- [ ] Deprecated options are marked
- [ ] Required options are clearly indicated

### Structure

- [ ] Quick start guide at the top
- [ ] Logical grouping of options
- [ ] Tables for easy scanning
- [ ] Code blocks are syntax highlighted
- [ ] Consistent formatting throughout
- [ ] Clear section hierarchy

### Usability

- [ ] Searchable (consider adding search for large docs)
- [ ] Linkable sections (use anchor links)
- [ ] Copy-pasteable examples
- [ ] Real-world use cases shown
- [ ] Troubleshooting section included
- [ ] Migration/upgrade notes (if applicable)

### Accessibility

- [ ] Proper heading hierarchy
- [ ] Alt text for images (if any)
- [ ] Color contrast sufficient
- [ ] Tables have proper headers
- [ ] Code blocks have language specified

### Commander.js Specific

- [ ] Auto-generated help is customized
- [ ] Option descriptions match help text
- [ ] Help text is clear and concise
- [ ] Version information is accurate
- [ ] Examples work with actual CLI

### Cross-Reference

- [ ] CLI options link to env vars
- [ ] Env vars link to config keys
- [ ] Precedence is documented
- [ ] Related options are cross-linked
- [ ] Config file format is documented

---

## References

### Excellent CLI Documentation Examples

1. **Vite CLI**
   - URL: https://vitejs.dev/guide/cli.html
   - Notable: Clean layout, good examples, clear option grouping

2. **ESLint CLI**
   - URL: https://eslint.org/docs/latest/use/command-line-interface
   - Notable: Extensive examples, exit codes, environment variables

3. **TypeScript Compiler**
   - URL: https://www.typescriptlang.org/docs/handbook/compiler-options.html
   - Notable: Alphabetical listing, detailed explanations, quick reference

4. **Webpack CLI**
   - URL: https://webpack.js.org/api/cli/
   - Notable: Command structure, flags vs options, precedence

5. **Docker CLI**
   - URL: https://docs.docker.com/engine/reference/commandline/cli/
   - Notable: Global commands, command-specific options, examples

6. **Git CLI**
   - URL: https://git-scm.com/docs/git
   - Notable: Comprehensive options, subcommands, examples

7. **npm CLI**
   - URL: https://docs.npmjs.com/cli/v9/commands
   - Notable: Command organization, help links, examples

### Commander.js Resources

- **Official Repository:** https://github.com/tj/commander.js
- **Documentation:** https://github.com/tj/commander.js/blob/master/Readme.md
- **Help Customization:** https://github.com/tj/commander.js#custom-help
- **TypeScript Examples:** https://github.com/tj/commander.js/tree/master/examples/typescript

### CLI Design Best Practices

- **clig.dev** - Command Line Interface Guidelines: https://clig.dev/
- **12-factor app CLI**: https://12factor.net/cli
- **POSIX conventions**: https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html

### Additional Resources

- **Writing Great Documentation**: https://www.writethedocs.org/
- **CLI Documentation Patterns**: https://diataxis.fr/ (Documentation framework)
- **Markdown Guide**: https://www.markdownguide.org/

---

## Appendix: Implementation Examples

### Commander.js Help Customization

```typescript
import { Command } from 'commander';

const program = new Command();

// Configure help
program.configureHelp({
  sortSubcommands: true,
  sortOptions: true,
  showGlobalOptions: true,
});

// Add custom help text
program.addHelpText(
  'beforeAll',
  `
PRP Pipeline v1.0.0
Automated software development from PRD to code
===============================================
`
);

program.addHelpText(
  'after',
  `
Documentation: https://github.com/your-org/prp-pipeline
Report issues: https://github.com/your-org/prp-pipeline/issues
`
);

// Configure options with detailed descriptions
program
  .name('prp-pipeline')
  .description('Automated software development from PRD to code')
  .version('1.0.0')
  .option('--prd <path>', 'Path to PRD markdown file', './PRD.md')
  .option('--scope <scope>', 'Scope identifier (e.g., P3.M4, P3.M4.T2)')
  .addOption(
    program
      .createOption('--mode <mode>', 'Execution mode')
      .choices(['normal', 'bug-hunt', 'validate'])
      .default('normal')
  )
  .option('--continue', 'Resume from previous session', false)
  .option('--dry-run', 'Show planned changes without executing', false)
  .option('--verbose', 'Enable detailed debug logging', false)
  .option('--machine-readable', 'Output in machine-readable JSON format', false)
  .option('--no-cache', 'Bypass cache and regenerate all PRPs', false)
  .option('--continue-on-error', 'Treat all errors as non-fatal', false)
  .option(
    '--validate-prd',
    'Validate PRD and exit without running pipeline',
    false
  );

program.parse();
```

### Environment Variable Integration

```typescript
// Load environment variables
function loadConfig(): Partial<CLIArgs> {
  return {
    prd: process.env.PRP_PRD_PATH,
    scope: process.env.PRP_SCOPE,
    mode: process.env.PRP_MODE as 'normal' | 'bug-hunt' | 'validate',
    continue: process.env.PRP_CONTINUE === '1',
    dryRun: false,
    verbose: process.env.PRP_VERBOSE === '1',
    machineReadable: process.env.PRP_MACHINE_READABLE === '1',
    noCache: process.env.PRP_NO_CACHE === '1',
    continueOnError: process.env.PRP_CONTINUE_ON_ERROR === '1',
    validatePrd: false,
  };
}

// Merge with CLI options
const envConfig = loadConfig();
const cliOptions = program.opts<CLIArgs>();
const finalConfig = { ...envConfig, ...cliOptions };
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-23
**Next Review:** Before documentation implementation phase
