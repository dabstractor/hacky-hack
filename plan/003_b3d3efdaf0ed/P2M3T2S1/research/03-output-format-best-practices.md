# CLI Output Format Best Practices

**Research Date:** 2025-01-23
**Purpose:** Research best practices for CLI command output formatting

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Output Format Types](#output-format-types)
3. [Design Guidelines](#design-guidelines)
4. [Common Patterns](#common-patterns)
5. [Accessibility](#accessibility)
6. [Error Messages](#error-messages)
7. [Examples from Popular CLIs](#examples-from-popular-clis)

---

## Core Principles

### 1. Human-Readable by Default

Default output should be optimized for human reading:

```bash
# Good: Default table format
$ kubectl get pods
NAME          READY   STATUS    RESTARTS   AGE
my-app-1      1/1     Running   0          5d
my-app-2      1/1     Running   0          5d

# Not: Raw JSON by default (use -o json flag instead)
```

### 2. Machine-Readable When Requested

Provide structured output for scripting:

```bash
# Multiple format options
kubectl get pods -o json
kubectl get pods -o yaml
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
```

### 3. Progressive Disclosure

Show summary by default, details on request:

```bash
# Default: Summary
$ git status
On branch main
Your branch is up to date with 'origin/main'.
Changes not staged for commit:
  modified:   file.ts

# Detailed: --verbose
$ git status --verbose
# Shows diff of changes
```

### 4. Consistent Conventions

Use standard conventions across commands:

- **Table format**: Default for lists
- **YAML**: For configuration
- **JSON**: For API/machine parsing
- **Plain text**: For single values
- **Wide format**: Extended table (`-o wide`)

---

## Output Format Types

### 1. Table Format (Default)

**Best for:** Lists of items

**Characteristics:**

- Columnar layout
- Aligned headers
- Truncated long values (with `--no-trunc` option)
- Status indicators
- Consistent spacing

**Example pattern:**

```
NAME             STATUS    PHASE     MESSAGE
task-p1m1t1      Complete  Final     Task completed successfully
task-p1m1t2      Active    Running  In progress
```

### 2. Wide Format

**Best for:** Lists needing more columns

**Characteristics:**

- Extended table with additional columns
- Still human-readable
- May wrap on narrow terminals

**Example pattern:**

```bash
kubectl get pods -o wide
# Adds: IP, NODE, and other columns
```

### 3. JSON Format

**Best for:** Machine parsing, scripting, APIs

**Characteristics:**

- Structured data
- Full detail
- No truncation
- Parseable by jq, jq, etc.

**Example pattern:**

```json
{
  "items": [
    {
      "metadata": { "name": "task-p1m1t1" },
      "status": { "phase": "Complete" }
    }
  ]
}
```

### 4. YAML Format

**Best for:** Configuration, human-readable structured data

**Characteristics:**

- More readable than JSON
- Good for configuration
- Supports comments (in files)

**Example pattern:**

```yaml
items:
  - metadata:
      name: task-p1m1t1
    status:
      phase: Complete
```

### 5. Custom/Template Format

**Best for:** Extracting specific fields

**Characteristics:**

- User-defined format
- Specific field extraction
- Custom separators

**Example patterns:**

```bash
# kubectl jsonpath
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# docker Go template
docker ps --format "table {{.ID}}\t{{.Image}}"

# git custom format
git log --format="%h %an %s"
```

### 6. Tree/Hierarchy Format

**Best for:** Hierarchical data (dependencies, branches)

**Characteristics:**

- ASCII box-drawing characters
- Indentation levels
- Parent-child relationships

**Example pattern:**

```
project
├── package.json
├── src
│   ├── index.ts
│   └── utils
│       └── helper.ts
└── tests
    └── test.ts
```

---

## Design Guidelines

### 1. Column Design

**Maximum Width:** Keep columns narrow enough for 80-character terminals

**Alignment:**

- Left-align text (names, descriptions)
- Right-align numbers (counts, sizes, durations)
- Center-align short status indicators

**Example:**

```
NAME             STATUS    COUNT    SIZE
task-1           Running   5        1.2 GB
task-long-name   Stopped   10       500 MB
```

### 2. Status Indicators

**Use symbols:**

```
✓ Complete  (green)
◐ Active    (blue)
○ Pending   (gray)
✗ Failed    (red)
⚠ Warning   (yellow)
ℹ Info      (blue)
```

**Use color:**

- Green: Success, healthy, complete
- Red: Errors, failed, unhealthy
- Yellow: Warnings, pending
- Blue: Info, active, in progress
- Gray: Disabled, muted, pending

**Use text status:**

```
Running, Succeeded, Failed, Pending, Unknown
```

### 3. Truncation

**Truncate long values by default:**

```bash
CONTAINER ID   IMAGE     COMMAND
abcd1234...    nginx     "/docker-entr..."
```

**Provide --no-trunc option:**

```bash
docker ps --no-trunc
# Shows full IDs and commands
```

**Ellipsis:** Use "..." to indicate truncation

### 4. Filtering and Sorting

**Provide filtering options:**

```bash
kubectl get pods --field-selector=status.phase=Running
kubectl get pods -l app=nginx
git log --author="John"
```

**Provide sorting options:**

```bash
kubectl get pods --sort-by=.metadata.name
docker ps --sort=size
ls -lt  # sort by time
```

### 5. Pagination

**Paginate long output:**

- Use pager for interactive use (less, more)
- Disable with `--no-pager` flag
- Detect TTY automatically

**Example:**

```bash
git log  # Uses pager by default
git log --no-pager  # No pager
git --paginate=false log  # Global config
```

### 6. Progress Indicators

**For long operations:**

- Progress bars for known duration
- Spinners for indeterminate duration
- Periodic updates

**Examples:**

```bash
# Progress bar
npm install
# Shows progress bar for each package

# Spinner
kubectl rollout status deployment/app
# Shows waiting spinner

# Periodic updates
docker build
# Shows step-by-step progress
```

### 7. Verbose vs. Quiet

**Provide verbosity levels:**

- `--verbose` / `-v`: More detail
- `--quiet` / `-q`: Less output
- `--silent`: No output (except errors)
- `--debug`: Debug information

**Example:**

```bash
npm install            # Normal output
npm install --verbose  # Detailed output
npm install --quiet    # Minimal output
npm install --silent   # No output
```

---

## Common Patterns

### Pattern 1: List Command

```bash
# Usage
command list [options]

# Output (default table)
NAME      STATUS    CREATED
task-1    Complete  2 days ago
task-2    Active    1 day ago

# Options
--output json    # JSON format
--output yaml    # YAML format
--filter status=Active  # Filter
--sort created  # Sort by field
--watch          # Watch for changes
```

### Pattern 2: Get Command

```bash
# Usage
command get <name> [options]

# Output (default table)
NAME      STATUS    PHASE     MESSAGE
task-1    Complete  Final     Success

# Options
-o json    # JSON detail
-o yaml    # YAML detail
--watch    # Watch for changes
```

### Pattern 3: Describe/Inspect Command

```bash
# Usage
command describe <name>

# Output (multi-section)
Name:         task-1
Status:       Complete
Phase:        Final
Created:      2 days ago
Message:      Success

Events:
  - Type:     Created
    Time:     2 days ago
    Message:  Task created
  - Type:     Completed
    Time:     1 day ago
    Message:  Task completed

# Options
-o json    # JSON format
--events   # Show more events
```

### Pattern 4: Status Command

```bash
# Usage
command status

# Output (summary)
Overall Status:     In Progress
Active Tasks:       5
Complete Tasks:     10
Blocked Tasks:      1

Current Task:       P2M3T1
Current Phase:      Phase 2
```

### Pattern 5: Top Command

```bash
# Usage
command top

# Output (auto-refreshing)
NAME      CPU    MEMORY    STATUS
task-1    10%    512MB     Running
task-2    25%    1GB       Running
task-3    0%     256MB     Idle

# Auto-refreshes every 2 seconds
# Press 'q' to quit
```

---

## Accessibility

### 1. Color Detection

**Detect color support:**

```typescript
import chalk from 'chalk';

if (chalk.level === 0) {
  // No color support
  console.log('STATUS: Complete');
} else {
  // Use colors
  console.log(chalk.green('STATUS: Complete'));
}
```

**Force enable/disable:**

```bash
--color=always    # Force colors
--color=never     # Disable colors
--color=auto      # Auto-detect (default)
```

### 2. Screen Reader Compatibility

**Use semantic symbols:**

```
✓ Complete
✗ Failed
⚠ Warning
```

**Avoid color-only indicators:**

- Don't rely on color alone
- Use symbols + color
- Use text labels

### 3. Clear Contrast

**Good contrast:**

- Black on white (high contrast)
- White on dark blue (high contrast)
- Avoid light colors on light backgrounds

**Test contrast:**

- Use WebAIM Contrast Checker
- Test with terminal themes

### 4. Text Size

**Don't rely on font size:**

- Terminal controls font size
- Use clear text, not size

---

## Error Messages

### 1. Structure

**Good error message:**

```bash
error: failed to load task file 'tasks.json'
  cause: file not found
  suggestion: create a tasks.json file or specify --file <path>
```

**Components:**

- Error type/severity
- Clear description
- Cause (if helpful)
- Suggestion (how to fix)

### 2. Exit Codes

**Standard exit codes:**

- 0: Success
- 1: General error
- 2: Incorrect usage
- 127: Command not found

**Example:**

```typescript
process.exit(1); // Error
process.exit(0); // Success
```

### 3. Error Output

**Write errors to stderr:**

```typescript
console.error('Error: message');
```

**Keep output separate:**

- stdout: Regular output
- stderr: Errors and warnings

---

## Examples from Popular CLIs

### kubectl

**List command:**

```bash
kubectl get pods
# Default: Table format
kubectl get pods -o wide  # Wide format
kubectl get pods -o json  # JSON format
```

**Features:**

- Multiple output formats
- Wide format option
- Filtering with labels/selectors
- Watch mode (`-w`)
- Color-coded status
- Column selection (`-o custom-columns`)

### Docker

**List command:**

```bash
docker ps
# Default: Table format
docker ps --format "table {{.ID}}\t{{.Image}}"  # Custom format
docker ps --format json  # JSON format
docker ps --no-trunc  # Full IDs
```

**Features:**

- Go template formatting
- Custom columns
- JSON output
- No truncation option
- Filtering (`--filter`)

### Git

**Status command:**

```bash
git status
# Default: Porcelain format
git status --short  # Short format
git status --verbose  # Detailed format
git status --branch  # Show branch info
```

**Features:**

- Porcelain vs. Plumbing
- Multiple verbosity levels
- Branch visualization
- Color-coded diffs
- Custom format strings

### npm

**List command:**

```bash
npm list
# Default: Tree format
npm list --depth=0  # Top level only
npm list --json  # JSON format
npm list --long  # Detailed format
```

**Features:**

- Tree visualization
- Depth control
- Multiple formats
- Color-coded versions

---

## Implementation Checklist

When implementing CLI output formats, ensure:

- [ ] Default output is human-readable
- [ ] Multiple output formats available (table, json, yaml)
- [ ] Wide format option
- [ ] No truncation option
- [ ] Color support with detection
- [ ] Filtering options
- [ ] Sorting options
- [ ] Watch mode for applicable commands
- [ ] Progress indicators for long operations
- [ ] Clear error messages
- [ ] Proper exit codes
- [ ] Pager for long output
- [ ] Verbose/quiet options
- [ ] Help text with examples
- [ ] Consistent with similar commands

---

## Resources

### Best Practices

- **CLI Design Guidelines**: https://clig.dev/
- **Command Line Interface Guidelines**: https://github.com/clinteraction/cliguidelines
- **Google CLI Style Guide**: https://google.github.io/styleguide/shellguide.html

### Examples

- **kubectl**: https://kubernetes.io/docs/reference/kubectl/
- **Docker**: https://docs.docker.com/engine/reference/commandline/cli/
- **Git**: https://git-scm.com/docs
- **AWS CLI**: https://docs.aws.amazon.com/cli/

### Libraries

- **cli-table3**: https://www.npmjs.com/package/cli-table3
- **chalk**: https://www.npmjs.com/package/chalk
- **commander**: https://www.npmjs.com/package/commander

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
