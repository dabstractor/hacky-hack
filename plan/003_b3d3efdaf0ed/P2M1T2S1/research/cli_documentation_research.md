# CLI Command Reference Documentation Research

> Research findings on best practices for documenting CLI commands, options, and reference materials
>
> **Created:** 2026-01-23
> **Task:** P2M1T2S1 - CLI Reference Documentation Research

---

## Table of Contents

1. [Examples of Excellent CLI Documentation](#examples-of-excellent-cli-documentation)
2. [Best Practice Patterns](#best-practice-patterns)
3. [Command Reference Structure](#command-reference-structure)
4. [Table Formatting Examples](#table-formatting-examples)
5. [Exit Code Documentation](#exit-code-documentation)
6. [Subcommands Documentation](#subcommands-documentation)
7. [Markdown Templates](#markdown-templates)

---

## Examples of Excellent CLI Documentation

### Production CLI Tools with Excellent Documentation

#### 1. Docker CLI Reference
- **URL:** https://docs.docker.com/engine/reference/commandline/cli/
- **Key Features:**
  - Hierarchical command organization
  - Consistent option tables
  - Usage examples for each command
  - Clear distinction between options and arguments
  - Separate pages for each subcommand

#### 2. kubectl (Kubernetes)
- **URL:** https://kubernetes.io/docs/reference/kubectl/
- **Key Features:**
  - Comprehensive cheat sheet
  - Command overview tables
  - Operation examples grouped by task
  - Clear resource type documentation
  - Output format options well-documented

#### 3. GitHub CLI (gh)
- **URL:** https://cli.github.com/manual/
- **Key Features:**
  - Man page style documentation
  - Consistent command structure
  - Example-driven approach
  - Clear flag descriptions
  - Exit code documentation

#### 4. Git Reference
- **URL:** https://git-scm.com/docs
- **Key Features:**
  - Traditional man page format
  - Synopses with all options
  - Detailed description sections
  - Examples section
  - Discussion of edge cases

#### 5. npm CLI
- **URL:** https://docs.npmjs.com/cli/v10/commands
- **Key Features:**
  - Alphabetically organized commands
  - Workspaces and configuration documentation
  - Clear syntax examples
  - Deprecation notices
  - Version-specific docs

#### 6. AWS CLI
- **URL:** https://docs.aws.amazon.com/cli/latest/reference/
- **Key Features:**
  - Service-based organization
  - Parameter documentation
  - Output examples
  - Related commands links
  - Multiple output formats documented

---

## Best Practice Patterns

### 1. Consistent Command Structure

All CLI documentation should follow a predictable pattern:

```markdown
## command-name

Brief one-line description of what the command does.

### Synopsis
```bash
command-name [options] <required-argument> [optional-argument]
```

### Description
Detailed description of command behavior, use cases, and important notes.

### Options
[Table of options]

### Examples
[Real-world examples]

### See Also
[Related commands]
```

### 2. Documentation Hierarchy

```
CLI Root
├── Overview/Getting Started
├── Command Categories
│   ├── Category 1 Commands
│   │   ├── command-a
│   │   ├── command-b
│   │   └── command-c
│   └── Category 2 Commands
│       └── ...
├── Global Options
├── Configuration
├── Troubleshooting
└── Exit Codes
```

### 3. Essential Elements for Each Command

**Required:**
- Command name
- Brief description (one sentence)
- Usage/syntax line
- Options/flags table
- At least one example

**Recommended:**
- Detailed description
- Multiple examples (basic to advanced)
- Arguments documentation
- Output format description
- Exit codes specific to command
- Related commands links

**Optional (for complex commands):**
- Use cases section
- Performance considerations
- Troubleshooting tips
- Version notes
- Environment variables

### 4. Writing Guidelines

**Descriptions:**
- Start with verb (e.g., "Create", "List", "Update", "Delete")
- Be concise (aim for one sentence for brief description)
- Explain what, not how
- Mention key behavior or constraints

**Examples:**
- Show realistic commands
- Include comments explaining key parts
- Start simple, increase complexity
- Show common error patterns
- Demonstrate output when helpful

**Option Documentation:**
- Group related options
- Show default values
- Mark required options clearly
- Explain constraints/validations
- Note deprecated options

---

## Command Reference Structure

### Recommended Section Order

1. **Command Header**
   - Command name (as used in CLI)
   - Badge for status (stable/beta/experimental)

2. **Brief Description**
   - One-line summary
   - What it does, not how

3. **Synopsis/Usage**
   - Command syntax with placeholders
   - Show all variants
   - Use standard notation:
     - `[optional]` - square brackets
     - `<required>` - angle brackets
     - `...` - repeatable

4. **Description**
   - Detailed explanation
   - Use cases
   - Important notes
   - Behavior details

5. **Options**
   - Organized in table
   - Grouped by category
   - Alphabetical within groups

6. **Arguments**
   - For positional arguments
   - Describe each argument
   - Show constraints/validation

7. **Examples**
   - Progressive complexity
   - Annotated with comments
   - Show output when helpful

8. **Output**
   - Describe output format
   - Show example output
   - Note special formats (JSON, table, etc.)

9. **Exit Codes**
   - Command-specific codes
   - Link to general exit codes

10. **Environment Variables**
    - Command-specific env vars
    - Configuration overrides

11. **See Also**
    - Related commands
    - Related concepts
    - External references

### Standard Notation

**Synopsis Syntax:**
```bash
command-name [GLOBAL-OPTIONS] SUBCOMMAND [OPTIONS] <ARGUMENT>
```

**Placeholders:**
- `<FILE>` - Replace with actual filename
- `<DIRECTORY>` - Replace with directory path
- `<NAME>` - Replace with name/identifier
- `[PATTERN]` - Optional pattern argument

**Option Notation:**
- `--option` - Long form
- `-o` - Short form
- `--option=<VALUE>` - Option with value
- `--option[=<DEFAULT>]` - Optional value with default

---

## Table Formatting Examples

### Options Table

**Simple Options Table:**
```markdown
### Options

| Option | Description |
|--------|-------------|
| `--help`, `-h` | Show help message |
| `--verbose`, `-v` | Enable verbose output |
| `--quiet`, `-q` | Suppress non-error output |
| `--version` | Show version information |
```

**Detailed Options Table:**
```markdown
### Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--config` | `-c` | path | `~/.config/app/config.yaml` | Path to configuration file |
| `--output` | `-o` | format | `text` | Output format (text, json, yaml) |
| `--timeout` | `-t` | seconds | `30` | Request timeout in seconds |
| `--dry-run` | `-n` | flag | `false` | Show what would be done without making changes |
| `--force` | `-f` | flag | `false` | Force operation, skip confirmations |
```

**Grouped Options Table:**
```markdown
### Options

#### Output Options
| Option | Description |
|--------|-------------|
| `--output`, `-o` | Output format (text, json, yaml) |
| `--color` | Enable colored output (auto, always, never) |
| `--quiet`, `-q` | Suppress all output except errors |

#### Connection Options
| Option | Description |
|--------|-------------|
| `--timeout` | Connection timeout in seconds |
| `--retry` | Number of retry attempts |
| `--keep-alive` | Enable connection keep-alive |

#### Authentication Options
| Option | Description |
|--------|-------------|
| `--token` | Authentication token |
| `--api-key` | API key for authentication |
| `--config` | Path to credentials file |
```

### Arguments Table

```markdown
### Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<source>` | path | Yes | Source file or directory path |
| `<destination>` | path | Yes | Destination path |
| `[pattern]` | glob | No | File pattern to match (e.g., `*.txt`) |
```

### Subcommands Summary Table

```markdown
### Available Subcommands

| Subcommand | Description | Status |
|------------|-------------|--------|
| `list` | List all resources | Stable |
| `get` | Get details of a specific resource | Stable |
| `create` | Create a new resource | Stable |
| `update` | Update an existing resource | Stable |
| `delete` | Delete a resource | Stable |
| `import` | Import resources from file | Beta |
| `export` | Export resources to file | Beta |
```

### Environment Variables Table

```markdown
### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_CONFIG_DIR` | Directory for configuration files | `~/.config/app` |
| `APP_LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |
| `API_TIMEOUT` | Request timeout in seconds | `30` |
| `NO_COLOR` | Disable colored output when set | (empty) |
```

---

## Exit Code Documentation

### Standard Exit Codes

Most CLI tools follow these conventions:

```markdown
## Exit Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | SUCCESS | Command completed successfully |
| 1 | GENERAL_ERROR | A general error occurred |
| 2 | USAGE_ERROR | Invalid command usage or syntax |
| 126 | COMMAND_NOT_EXECUTABLE | Command found but not executable |
| 127 | COMMAND_NOT_FOUND | Command not found |
| 128 | INVALID_EXIT_CODE | Exit code out of range |
| 128+N | SIGNAL_EXIT | Process terminated by signal N |
| 130 | INTERRUPTED | Process interrupted (Ctrl+C) |
```

### Tool-Specific Exit Codes

```markdown
## Exit Codes

| Code | Description | Cause |
|------|-------------|-------|
| 0 | Success | Operation completed successfully |
| 1 | General Error | An unspecified error occurred |
| 2 | Usage Error | Invalid command syntax or options |
| 3 | File Not Found | Specified file or directory does not exist |
| 4 | Permission Denied | Insufficient permissions for operation |
| 5 | Network Error | Network connection failed or timeout |
| 6 | API Error | API request returned an error |
| 7 | Validation Error | Input validation failed |
| 8 | Conflict | Resource conflict or state mismatch |
| 9 | Rate Limited | API rate limit exceeded |
| 10 | Configuration Error | Invalid or missing configuration |
```

### Documenting Command-Specific Exits

```markdown
### Exit Codes

This command returns the following exit codes in addition to the [standard exit codes](#exit-codes):

| Code | Description | Example |
|------|-------------|---------|
| 20 | Resource Not Found | Resource `my-resource` does not exist |
| 21 | Resource Exists | Cannot create: resource `my-resource` already exists |
| 22 | Invalid State | Operation not valid in current resource state |
```

### Best Practices for Exit Code Documentation

1. **Be Specific:** Document what each code means
2. **Provide Examples:** Show when codes occur
3. **Link to Standards:** Reference standard exit codes
4. **Document Ranges:** Group related codes (e.g., 20-29 for resource errors)
5. **Show Recovery:** How users should handle errors
6. **Version Notes:** Note codes added in specific versions

---

## Subcommands Documentation

### Organizing Subcommands

#### Category-Based Organization
```markdown
# CLI Reference

## Container Commands
- [docker run](commands/run.md) - Run a container
- [docker start](commands/start.md) - Start one or more containers
- [docker stop](commands/stop.md) - Stop one or more containers
- [docker exec](commands/exec.md) - Execute a command in a running container

## Image Commands
- [docker build](commands/build.md) - Build an image from Dockerfile
- [docker pull](commands/pull.md) - Pull an image from registry
- [docker push](commands/push.md) - Push an image to registry
- [docker images](commands/images.md) - List images

## System Commands
- [docker info](commands/info.md) - Display system-wide information
- [docker version](commands/version.md) - Show version information
- [docker system prune](commands/system-prune.md) - Remove unused data
```

#### Hierarchy Documentation
```markdown
## command Category

### command-category subcommand1

Description of subcommand1...

### command-category subcommand2

Description of subcommand2...
```

### Subcommand Template

```markdown
## parent-command subcommand-name

Brief description of the subcommand.

### Usage
```bash
parent-command subcommand-name [options] <arguments>
```

### Description
Detailed description of what the subcommand does within the context of the parent command.

### Options
[Subcommand-specific options]

### Inherited Options
This subcommand inherits all [global options](../global-options.md) from `parent-command`.

### Examples
```bash
# Example 1: Basic usage
parent-command subcommand-name argument

# Example 2: With options
parent-command subcommand-name --option value argument

# Example 3: Advanced usage
parent-command subcommand-name --verbose --format json argument | jq .
```

### See Also
- [parent-command](./parent-command.md) - Parent command documentation
- [parent-command other-subcommand](./other-subcommand.md) - Related subcommand
```

### Grouped Subcommands

```markdown
## Configuration Commands

### config get
Retrieve a configuration value.

### config set
Set a configuration value.

### config list
List all configuration values.

### config unset
Remove a configuration value.

### config edit
Open configuration file in editor.

---

See [Configuration Guide](../guides/configuration.md) for more details on configuration management.
```

---

## Markdown Templates

### Full Command Template

```markdown
# command-name

Brief one-line description of what the command does.

## Contents
- [Synopsis](#synopsis)
- [Description](#description)
- [Options](#options)
- [Arguments](#arguments)
- [Examples](#examples)
- [Output](#output)
- [Exit Codes](#exit-codes)
- [Environment Variables](#environment-variables)
- [See Also](#see-also)

## Synopsis

```bash
command-name [options] <required-argument> [optional-argument]
```

## Description

Detailed description of the command. Explain:
- What the command does
- When to use it
- Important constraints or behaviors
- Related concepts

Include multiple paragraphs for complex commands.

## Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--option-name` | `-o` | type | default | Description of the option |
| `--another-option` | `-a` | flag | `false` | Description of flag option |
| `--config-file` | `-c` | path | `~/.config/app/config.yaml` | Path to config file |

### Option Details

**`--option-name`** / **`-o`**
- Additional details about the option
- Valid values: `value1`, `value2`, `value3`
- This option can be specified multiple times

**`--config-file`** / **`-c`**
- Configuration file path
- Supports environment variable expansion
- See [Configuration](../configuration.md) for file format

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<required-argument>` | string | Yes | Description of required argument |
| `[optional-argument]` | string | No | Description of optional argument (default: value) |

## Examples

### Basic Usage

```bash
command-name my-resource
```

Create or interact with `my-resource` using default settings.

### With Options

```bash
command-name --verbose --format json my-resource
```

Run with verbose output and JSON format.

### Advanced Usage

```bash
command-name \
  --config-file custom-config.yaml \
  --timeout 60 \
  --format json \
  my-resource | jq '.data'
```

Use custom configuration with increased timeout, process output with jq.

### Common Patterns

**Batch processing:**
```bash
command-name --batch file1.txt file2.txt file3.txt
```

**Pipe usage:**
```bash
echo "input" | command-name --stdin
```

**Output to file:**
```bash
command-name --output file.txt input.txt
```

## Output

### Default Output Format
```
Human-readable output format
Key: Value
Another Key: Another Value
```

### JSON Format (`--format json`)
```json
{
  "status": "success",
  "data": {
    "key": "value"
  }
}
```

### Table Format (`--format table`)
```
+------+-------+
| ID   | Name  |
+------+-------+
| 1    | First |
| 2    | Second|
+------+-------+
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid usage |
| 3 | File not found |

See [Exit Codes](../exit-codes.md) for standard exit codes.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_CONFIG_DIR` | Override default configuration directory |
| `APP_LOG_LEVEL` | Set logging level (debug, info, warn, error) |

## See Also

- [related-command](./related-command.md) - Description of related command
- [Configuration Guide](../guides/configuration.md) - Configuration documentation
- [Troubleshooting](../troubleshooting.md) - Common issues and solutions

---

**Version:** Added in v1.0.0
**Status:** Stable
```

### Quick Reference Template

```markdown
## Quick Reference: command-name

**Usage:** `command-name [options] <argument>`

**Common Options:**
- `-o, --option` - Description
- `-v, --verbose` - Verbose output
- `-h, --help` - Show help

**Examples:**
```bash
command-name value                    # Basic usage
command-name --option value           # With option
command-name -v --format json value   # Verbose JSON output
```

**See:** [Full Documentation](./command-name.md)
```

### Command Category Overview Template

```markdown
# Category Name Commands

Commands for managing [resources/concepts in this category].

## Commands

| Command | Description | Status |
|---------|-------------|--------|
| [cmd1](./cmd1.md) | Brief description | Stable |
| [cmd2](./cmd2.md) | Brief description | Stable |
| [cmd3](./cmd3.md) | Brief description | Beta |

## Common Options

All commands in this category support these common options:

| Option | Description |
|--------|-------------|
| `--format` | Output format (text, json, yaml) |
| `--output` | Write to file instead of stdout |
| `--verbose` | Show detailed output |

## See Also

- [Other Category](./other-category.md)
- [Global Options](../global-options.md)
```

### Global Options Reference Template

```markdown
# Global Options

These options are available for all commands.

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help for command | - |
| `--version` | `-V` | Show version information | - |
| `--verbose` | `-v` | Increase verbosity (can be repeated) | `info` |
| `--quiet` | `-q` | Decrease verbosity | `warn` |
| `--config` | `-c` | Path to config file | `~/.config/app/config.yaml` |
| `--no-color` | | Disable colored output | `false` |
| `--output` | `-o` | Output format (text, json, yaml) | `text` |

## Environment Variables

Global environment variables that affect all commands:

| Variable | Description |
|----------|-------------|
| `APP_CONFIG_DIR` | Configuration directory path |
| `APP_LOG_LEVEL` | Log level (debug, info, warn, error) |
| `APP_NO_COLOR` | Set to disable colored output |
| `APP_OUTPUT_FORMAT` | Default output format |
```

### Exit Codes Reference Template

```markdown
# Exit Codes

## Standard Exit Codes

The CLI uses standard exit codes:

| Code | Name | Description |
|------|------|-------------|
| 0 | Success | Command completed successfully |
| 1 | General Error | An unspecified error occurred |
| 2 | Usage Error | Invalid command syntax or options |

## Command-Specific Exit Codes

| Code | Category | Description |
|------|----------|-------------|
| 10-19 | File Errors | File system related errors |
| 20-29 | Network Errors | Network connectivity issues |
| 30-39 | API Errors | API request/response errors |
| 40-49 | Authentication Errors | Authentication and authorization failures |
| 50-59 | Configuration Errors | Invalid or missing configuration |
| 60-69 | Validation Errors | Input validation failures |

### Detailed Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 10 | File not found | Check file path and permissions |
| 11 | Permission denied | Run with appropriate permissions |
| 12 | Directory not found | Create directory or check path |
| 20 | Connection timeout | Check network connectivity |
| 21 | DNS resolution failed | Verify hostname and DNS settings |
| 22 | Connection refused | Service may be unavailable |
| 30 | API rate limit exceeded | Wait and retry |
| 31 | API authentication failed | Check credentials |
| 32 | API error response | Check request parameters |

## Handling Exit Codes

### In Shell Scripts

```bash
command-name
if [ $? -eq 0 ]; then
  echo "Success"
else
  echo "Failed with exit code $?"
fi
```

### With Error Messages

```bash
if ! command-name; then
  echo "Command failed"
  exit 1
fi
```

### With Specific Codes

```bash
command-name
case $? in
  0) echo "Success" ;;
  10) echo "File error" ;;
  20) echo "Network error" ;;
  *) echo "Unknown error" ;;
esac
```
```

---

## Additional Best Practices

### Documentation Generation

**Auto-Generate from Source:**
- Extract help text from command implementations
- Use tools like `click`, `cobra`, `argparse`, `clap`
- Keep docs and code in sync

**Version-Specific Documentation:**
- Maintain docs for each major version
- Clearly mark version-specific features
- Provide migration guides

**Interactive Elements:**
- Add "Copy" buttons to code blocks
- Include search functionality
- Provide navigation breadcrumbs

### Accessibility

- Use semantic HTML structure
- Provide alternative text for diagrams
- Ensure sufficient color contrast
- Support keyboard navigation
- Provide screen reader friendly markup

### Testing Documentation

- Validate all examples
- Test all commands documented
- Check all links work
- Verify table formatting
- Test across multiple devices

### Maintenance

- Review quarterly for accuracy
- Update with each release
- Tag deprecated features clearly
- Archive old versions
- Track documentation issues

---

## Resources and References

### Style Guides

- [Google Developer Documentation Style Guide](https://developers.google.com/tech-writing)
- [Microsoft Writing Style Guide](https://docs.microsoft.com/en-us/style-guide/)
- [Documenting CLI Tools](https://clig.dev/) - Command Line Interface Guidelines

### Tools

- [Sphinx](https://www.sphinx-doc.org/) - Documentation generator
- [Docusaurus](https://docusaurus.io/) - Modern documentation sites
- [MkDocs](https://www.mkdocs.org/) - Static site generator
- [Hugo](https://gohugo.io/) - Static site generator

### CLI Frameworks with Built-in Docs

- Python: [Click](https://click.palletsprojects.com/), [Typer](https://typer.tiangolo.com/)
- Go: [Cobra](https://github.com/spf13/cobra), [cli](https://github.com/urfave/cli)
- Node.js: [Commander.js](https://www.npmjs.com/package/commander), [yargs](https://www.npmjs.com/package/yargs)
- Rust: [Clap](https://github.com/clap-rs/clap)

---

## Summary of Key Recommendations

1. **Consistency is Key:** Use the same structure, formatting, and terminology throughout
2. **Examples Over Explanations:** Show, don't just tell
3. **Progressive Complexity:** Start simple, add detail gradually
4. **Cross-Reference:** Link between related commands and concepts
5. **Keep Current:** Update docs with each release
6. **Validate Everything:** Test all examples and commands
7. **User-Centered:** Organize by user tasks, not code structure
8. **Multiple Formats:** Support HTML, man pages, and PDF
9. **Searchable:** Use clear titles and descriptions
10. **Accessible:** Follow accessibility guidelines

---

**Document Version:** 1.0
**Last Updated:** 2026-01-23
**Next Review:** 2026-04-23
