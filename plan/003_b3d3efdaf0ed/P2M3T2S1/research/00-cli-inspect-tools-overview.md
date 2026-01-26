# CLI Inspector/Debugging Tools Research - Overview

**Research Date:** 2025-01-23
**Purpose:** Comprehensive research on CLI tools, patterns, and libraries for implementing inspect/debugging commands

---

## Table of Contents

1. [Popular CLI Inspection Tools](#popular-cli-inspection-tools)
2. [Research Methodology](#research-methodology)
3. [Key Findings Summary](#key-findings-summary)
4. [Tool Categories](#tool-categories)
5. [Recommended Libraries](#recommended-libraries)

---

## Popular CLI Inspection Tools

### 1. kubectl (Kubernetes CLI)

**Repository:** https://github.com/kubernetes/kubectl
**Documentation:** https://kubernetes.io/docs/reference/kubectl/

**Key Inspect Commands:**
```bash
kubectl get pods                    # List resources
kubectl get pods -o wide            # Wide format with more info
kubectl describe pod <name>         # Detailed inspection
kubectl get pod <name> -o json      # JSON output
kubectl get pod <name> -o yaml      # YAML output
kubectl top pods                    # Resource usage
kubectl logs <pod>                  # Pod logs
```

**Output Format Patterns:**
- Default: Table format with aligned columns
- `-o wide`: Extended table format
- `-o json`: Machine-readable JSON
- `-o yaml`: Human-readable YAML
- `-o jsonpath=<template>`: Custom JSON path extraction
- Custom columns: `-o custom-columns=NAME:.metadata.name,STATUS:.status.phase`

**Key Features:**
- Hierarchical resource representation
- Color-coded status indicators
- Multiple output formats (table, wide, json, yaml, jsonpath)
- Namespace/context awareness
- Watch mode (`-w`) for real-time updates
- Label selectors for filtering
- Field selectors for precise filtering

### 2. Docker CLI

**Repository:** https://github.com/docker/cli
**Documentation:** https://docs.docker.com/engine/reference/commandline/cli/

**Key Inspect Commands:**
```bash
docker ps                          # List running containers
docker ps -a                       # List all containers
docker inspect <container>         # Detailed JSON inspection
docker images                      # List images
docker stats                       # Live resource usage
docker logs <container>            # Container logs
docker top <container>             # Container processes
```

**Output Format Patterns:**
- Default: Table with truncated IDs
- `--format "table {{.ID}}\t{{.Image}}"`: Custom Go template
- `--format json`: JSON output
- `--no-trunc`: Full IDs/names
- `--quiet`: Only IDs

**Key Features:**
- Go template formatting (`--format`)
- JSON inspection via `docker inspect`
- Live streaming stats
- Size information (`docker ps -s`)
- Filter flags (`--filter`)
- Pretty-printed JSON by default

### 3. Git CLI

**Repository:** https://github.com/git/git
**Documentation:** https://git-scm.com/docs

**Key Inspect Commands:**
```bash
git status                         # Working tree status
git log --oneline                  # Compact commit history
git log --graph --decorate         # Branch visualization
git branch -vv                     # Branches with tracking info
git remote -v                      # Remote repositories
git show                           # Show various objects
git reflog                         # Reference history
```

**Output Format Patterns:**
- `--format=<format>`: Custom format strings
- `--pretty=<format>`: Built-in formats (oneline, short, medium, full, fuller)
- `--color=<when>`: Color control (always, never, auto)
- Columnar output by default
- Hierarchical tree display with `--graph`

**Key Features:**
- Porcelain vs. Plumbing commands (high-level vs. low-level)
- Custom format strings with placeholders
- Color-coded output (diffs, branch names)
- Graph visualization for branches
- Pager integration (less)
- Configuration-based formatting

### 4. npm CLI

**Repository:** https://github.com/npm/cli
**Documentation:** https://docs.npmjs.com/cli/

**Key Inspect Commands:**
```bash
npm list                           # Dependency tree
npm list --depth=0                 # Top-level dependencies
npm outdated                       # Outdated packages
npm view <package>                 # Package metadata
npm config list                    # Configuration
npm team                           # Team management
npm access                         # Access control
```

**Output Format Patterns:**
- Tree-style dependency visualization
- JSON output with `--json` flag
- Long format with `--long`
- Parseable output with `--parseable`

**Key Features:**
- Hierarchical tree display
- Color-coded version differences
- JSON for machine parsing
- Depth control for trees
- Global vs. local context

### 5. AWS CLI

**Repository:** https://github.com/aws/aws-cli
**Documentation:** https://docs.aws.amazon.com/cli/

**Key Inspect Commands:**
```bash
aws ec2 describe-instances         # Detailed JSON
aws ec2 describe-instances --query "Reservations[].Instances[].{ID:InstanceId,Type:InstanceType}"
aws s3 ls                          # List buckets
aws s3 ls s3://bucket --recursive  # Recursive list
aws cloudformation describe-stacks
```

**Output Format Patterns:**
- `--output json`: JSON (default)
- `--output yaml`: YAML
- `--output yaml-stream`: YAML streaming
- `--output text`: Text-based
- `--output table`: Table format
- `--query`: JMESPath query language
- `--color on|off`: Color control

**Key Features:**
- JMESPath for JSON querying
- Multiple output formats
- Pagination support
- Filtering at the API level
- Rich formatting options

---

## Research Methodology

This research was conducted through:

1. **Analysis of Popular CLI Tools**: Studying the output patterns and command structures of widely-used CLI tools
2. **Existing Codebase Review**: Examining the current project's CLI implementation and dependencies
3. **Best Practices Synthesis**: Compiling common patterns across successful CLIs
4. **Library Evaluation**: Assessing available Node.js/TypeScript libraries for CLI formatting

**Note**: Due to rate limiting on web search APIs, this research primarily draws from:
- Known documentation from popular CLI tools
- Existing project dependencies and patterns
- Established CLI design patterns and best practices
- The project's existing CLI implementation in `/home/dustin/projects/hacky-hack/src/cli/`

---

## Key Findings Summary

### Common Patterns Across CLIs

1. **Multiple Output Formats**: Most CLIs support table, JSON, and YAML outputs
2. **Filtering**: Support for filtering output (labels, selectors, fields)
3. **Hierarchical Display**: Tree structures for nested data (git, npm, kubectl)
4. **Color Coding**: Semantic colors for status, errors, warnings
5. **Wide Format**: Extended table format with more columns
6. **Detail Levels**: Compact vs. detailed views
7. **Watch Mode**: Real-time updates for monitoring
8. **Custom Columns**: User-defined table columns

### Best Practices Identified

1. **Default Output**: Human-readable table format
2. **Machine-Readable**: JSON/YAML for scripting
3. **Consistent Naming**: `get`, `describe`, `show`, `list`, `inspect`
4. **Helpful Examples**: Usage examples in help text
5. **Paging**: Use pager for long output
6. **Error Messages**: Clear, actionable error messages
7. **Progress Indicators**: For long-running operations
8. **Truncation**: Smart truncation of long values with `--no-trunc` option

---

## Tool Categories

### Category 1: Status/List Commands

Display lists of resources in table format:

- `kubectl get pods`
- `docker ps`
- `git branch`
- `npm list`

**Characteristics:**
- Columnar layout
- Aligned headers
- Truncated long values
- Status indicators
- Color coding

### Category 2: Inspect/Describe Commands

Detailed view of single resource:

- `kubectl describe pod <name>`
- `docker inspect <container>`
- `git show <commit>`
- `npm view <package>`

**Characteristics:**
- Multi-section output
- Detailed metadata
- Related resources
- Events/history
- YAML or structured format

### Category 3: Tree/Hierarchy Commands

Hierarchical data display:

- `npm list` (dependency tree)
- `git log --graph` (commit graph)
- `kubectl get pods -o wide` (with hierarchy)
- `docker ps --format "tree"`

**Characteristics:**
- ASCII tree characters
- Indentation levels
- Parent-child relationships
- Collapsible sections

### Category 4: Watch/Monitor Commands

Real-time updates:

- `kubectl get pods -w`
- `docker stats`
- `top` command
- `htop`

**Characteristics:**
- Auto-refreshing display
- Rate limiting
- Cursor positioning
- Graceful exit handling

---

## Recommended Libraries

Based on the research and the project's existing dependencies, here are the recommended libraries:

### Table Formatting

1. **cli-table3** (Recommended)
   - NPM: https://www.npmjs.com/package/cli-table3
   - GitHub: https://github.com/cli-table/cli-table3
   - Pros: Feature-rich, customizable, TypeScript support
   - Used by: Many popular CLIs

2. **table** (Alternative)
   - NPM: https://www.npmjs.com/package/table
   - Pros: Modern, feature-complete
   - Good for: Complex table layouts

3. **tty-table** (Alternative)
   - NPM: https://www.npmjs.com/package/tty-table
   - Pros: Smart column sizing, colors
   - Good for: Interactive CLIs

### Tree Visualization

1. **treelib** (Python - for reference)
   - Pattern: ASCII characters for tree structure

2. **Custom Implementation** (Recommended)
   - Use ASCII box-drawing characters
   - Implement recursive rendering
   - Support for collapsible nodes

### Terminal Styling

**Already in project:** `cli-progress` provides some styling via `picocolors` dependency

**Recommendations:**

1. **chalk** (Recommended)
   - NPM: https://www.npmjs.com/package/chalk
   - Pros: Most popular, expressive API
   - Example: `chalk.red('Error')`

2. **kleur** (Lightweight alternative)
   - NPM: https://www.npmjs.com/package/kleur
   - Pros: Fast, no dependencies
   - Use if: Bundle size is critical

3. **ansi-colors** (Already a dependency via cli-progress)
   - NPM: https://www.npmjs.com/package/ansi-colors
   - Pros: Already in dependency tree
   - Use if: Want to avoid additional dependencies

### CLI Framework

**Already in project:** `commander@^14.0.2`

**Status:** Excellent choice, actively maintained, native TypeScript support

**Alternatives considered:**
- yargs (More features, more complex)
- oclif (Full framework, opinionated)
- cac (Lightweight)

**Recommendation:** Stick with Commander.js

---

## Next Steps

See the following research documents for detailed information:

1. **Table Libraries**: See `01-table-formatter-libraries.md`
2. **Terminal Styling**: See `02-terminal-styling-libraries.md`
3. **Commander.js Patterns**: See `../../docs/commander-subcommand-patterns.md`
4. **Output Format Best Practices**: See `03-output-format-best-practices.md`
5. **Inspect Command Examples**: See `04-inspect-command-examples.md`
6. **Tree Visualization**: See `05-tree-visualization.md`

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
**Research Status:** Complete (subject to web search availability)
