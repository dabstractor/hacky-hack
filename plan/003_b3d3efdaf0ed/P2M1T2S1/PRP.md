# Product Requirement Prompt (PRP): Create CLI Command Reference

> Transform PRD into working code with complete context, clear objectives, and validation criteria

**Status**: Ready for Implementation
**Last Updated**: 2026-01-23
**Work Item**: P2.M1.T2.S1 - Create CLI command reference

---

## Goal

**Feature Goal**: Create a comprehensive CLI command reference documentation (`docs/CLI_REFERENCE.md`) that serves as the complete reference for all CLI commands, options, execution modes, exit codes, and usage examples

**Deliverable**: Documentation file `docs/CLI_REFERENCE.md` containing complete CLI command documentation with command hierarchy, option tables, usage examples, exit codes, and error handling

**Success Definition**:
- A developer can find any CLI command/option documentation instantly
- All 12 CLI options are documented with types, defaults, and descriptions
- All 3 execution modes (normal, bug-hunt, validate) are explained with examples
- All scope formats (Phase, Milestone, Task, Subtask, all) are documented
- Usage examples cover common workflows (basic, scoped, debugging, delta)
- Exit codes are documented with handling examples
- Documentation follows patterns from docs/INSTALLATION.md and docs/CONFIGURATION.md

## User Persona

**Target User**: Developer using the PRP Pipeline who needs to look up CLI commands, options, or troubleshoot CLI-related issues

**Use Case**: Developer needs to:
- Find the correct CLI option for a specific task
- Understand how to use scope execution
- Debug CLI-related errors
- Learn about execution modes and when to use each
- Understand exit codes for scripting/automation

**User Journey**:
1. User opens CLI_REFERENCE.md to find a specific command or option
2. User quickly locates the option in the Quick Reference table
3. User reads the option description and sees usage examples
4. User copies and adapts the example for their use case
5. If encountering an error, user checks Exit Codes or Error Handling sections

**Pain Points Addressed**:
- "What's the flag for verbose output again?" - Quick Reference table
- "How do I run just one task?" - Scoped Execution section
- "What does exit code 1 mean?" - Exit Codes section
- "How do I resume after interruption?" - Examples section

## Why

- **Developer Productivity**: Quick reference reduces time spent searching for commands
- **CLI Discoverability**: Comprehensive documentation reveals all capabilities
- **Self-Service Support**: Reduces "how do I..." questions
- **Automation Support**: Exit codes enable scripting and CI/CD integration
- **Onboarding**: New users learn CLI capabilities systematically

## What

Create docs/CLI_REFERENCE.md with complete CLI command documentation:

### Success Criteria

- [ ] File created at docs/CLI_REFERENCE.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents included with anchor links
- [ ] Quick Reference table with essential commands
- [ ] All 12 CLI options documented in tables
- [ ] Execution modes (normal, bug-hunt, validate) explained with examples
- [ ] Scope syntax documented (Phase, Milestone, Task, Subtask, all)
- [ ] Exit codes documented with handling examples
- [ ] Usage examples for common workflows
- [ ] Error handling section with common errors
- [ ] Cross-references to CONFIGURATION.md, INSTALLATION.md, user-guide.md
- [ ] All code blocks use proper syntax highlighting (bash)
- [ ] Tables match formatting patterns from existing docs

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:
- Exact CLI option specifications from src/cli/index.ts
- Complete documentation formatting patterns from existing docs
- External research on CLI documentation best practices
- Exit code definitions from src/index.ts
- Scope format patterns from src/core/scope-resolver.ts
- Command invocation patterns (npm run dev --)

### Documentation & References

```yaml
# MUST READ - CLI implementation details
- file: src/cli/index.ts
  why: Source of truth for all CLI options, types, defaults, and descriptions
  pattern: Commander.js configuration, option definitions, validation logic
  gotcha: Command is invoked via `npm run dev -- [options]` (double dash required)

- file: src/index.ts
  why: Main entry point with execution modes, exit codes, and error handling
  pattern: Mode selection (normal, bug-hunt, validate), process.exit() codes
  gotcha: Exit code 130 for SIGINT (Ctrl+C), 1 for errors, 0 for success

- file: src/core/scope-resolver.ts
  why: Scope format validation and parsing logic
  pattern: Scope format P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, all (case-sensitive)
  gotcha: Scope is case-sensitive - must be uppercase P, M, T, S

- file: docs/INSTALLATION.md
  why: Follow header format, table patterns, troubleshooting section pattern
  pattern: Document header (Status, Last Updated, Version), numbered sections, tables
  gotcha: Uses ** for bold emphasis on important variables/commands

- file: docs/CONFIGURATION.md
  why: Follow table formatting, quick reference section pattern
  pattern: Quick Reference table at top, detailed sections with tables
  gotcha: Environment variable names use ALL_CAPS with backticks

- file: docs/QUICKSTART.md
  why: Reference for CLI command examples to avoid duplication
  pattern: Code blocks with `npm run dev -- --prd ./PRD.md` format
  gotcha: Double dash separator is critical

- file: README.md
  why: Existing CLI usage examples to reference and extend
  pattern: Basic command invocation examples
  gotcha: Don't repeat - expand with comprehensive reference

- docfile: plan/003_b3d3efdaf0ed/P2M1T2S1/research/cli_documentation_research.md
  why: External research on CLI documentation best practices
  section: Complete research findings with templates and examples
  gotcha: Contains markdown templates for CLI reference structure

- url: https://cli.dev
  why: Modern CLI documentation examples and patterns
  critical: Section ordering, table formatting, example progression

- url: https://kubernetes.io/docs/reference/kubectl/
  why: Example of comprehensive CLI reference documentation
  critical: Command categorization, examples organization

- url: https://docs.docker.com/engine/reference/commandline/cli/
  why: Example of well-structured CLI option tables
  critical: Option table format (Option, Type, Default, Description)
```

### Current Codebase Tree (relevant subset)

```bash
hacky-hack/
├── PRD.md                          # Main product requirements
├── README.md                       # Project overview
├── package.json                    # npm scripts (npm run dev)
├── docs/
│   ├── INSTALLATION.md             # Installation guide (P2.M1.T1.S1 output)
│   ├── CONFIGURATION.md            # Configuration reference (P2.M1.T1.S2 output)
│   ├── QUICKSTART.md               # Quick start tutorial (P2.M1.T1.S3 output)
│   ├── user-guide.md               # User guide with advanced usage
│   └── CLI_REFERENCE.md            # TARGET FILE - TO BE CREATED
├── src/
│   ├── cli/
│   │   └── index.ts                # CLI command entry point with all options
│   ├── core/
│   │   └── scope-resolver.ts       # Scope format validation
│   └── index.ts                    # Main entry point with execution modes
└── tests/
    └── fixtures/
        └── simple-prd.ts           # Example PRD for examples
```

### Desired Codebase Tree with Files to be Added

```bash
hacky-hack/
├── docs/
│   ├── INSTALLATION.md             # (existing - P2.M1.T1.S1 output)
│   ├── CONFIGURATION.md            # (existing - P2.M1.T1.S2 output)
│   ├── QUICKSTART.md               # (existing - P2.M1.T1.S3 output)
│   └── CLI_REFERENCE.md            # NEW FILE - CLI command reference
│       ├── Quick Reference (essential commands table)
│       ├── Commands (pipeline execution, scoped execution, special modes)
│       ├── Options (required, execution control, boolean flags, limits)
│       ├── Exit Codes (with handling examples)
│       ├── Examples (basic, advanced, common patterns)
│       └── Error Handling (common errors, troubleshooting)
```

### Known Gotchas of Our Codebase & Library Quirks

```bash
# CRITICAL: CLI command requires double dash for argument passing
# Correct: npm run dev -- --prd ./PRD.md --verbose
# Incorrect: npm run dev --prd ./PRD.md (will fail - npm will consume the flag)

# CRITICAL: Scope format is case-sensitive
# Correct: --scope P1.M1.T1.S1 (uppercase)
# Incorrect: --scope p1.m1.t1.s1 (lowercase - will fail validation)

# CRITICAL: Command name is 'prp-pipeline' but invoked via npm run dev
# Direct: prp-pipeline --prd ./PRD.md (after npm link)
# npm script: npm run dev -- --prd ./PRD.md (double dash separator)

# CRITICAL: --prd option default is './PRD.md' not 'PRD.md'
# Use explicit path for clarity: --prd ./PRD.md or --prd /full/path/to/PRD.md

# CRITICAL: Exit codes: 0=success, 1=error, 130=SIGINT (Ctrl+C)
# Script writers should check for these specific codes

# CRITICAL: --no-cache is a negated flag (Commander.js pattern)
# Means: bypass cache (not "no cache" as two words)

# CRITICAL: --mode has three choices: normal, bug-hunt, validate
# There is NO 'delta' mode - delta is automatic based on PRD hash changes

# CRITICAL: The docs/INSTALLATION.md and docs/CONFIGURATION.md are the style guide
# Match header format, table formatting, section organization exactly

# CRITICAL: Don't duplicate QUICKSTART.md examples
# Reference them but provide more comprehensive reference content

# CRITICAL: All table columns must align
# Use markdown table formatting with consistent spacing

# CRITICAL: Cross-reference links use relative paths
# Use [Configuration Reference](./CONFIGURATION.md) format
```

## Implementation Blueprint

### Document Structure

Create docs/CLI_REFERENCE.md following established documentation patterns:

```markdown
# CLI Reference

> Complete reference for the PRP Pipeline command-line interface...

**Status**: Published
**Last Updated**: [DATE]
**Version**: 1.0.0

## Table of Contents

## Quick Reference

## Commands
### Pipeline Execution
### Scoped Execution
### Special Modes

## Options
### Required Options
### Execution Control
### Boolean Flags
### Limit Options

## Exit Codes

## Examples
### Basic Usage
### Advanced Scenarios
### Common Patterns

## Error Handling
### Common Errors
### Troubleshooting

## See Also
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: PREPARE - Review existing documentation patterns
  - READ: docs/INSTALLATION.md for header format, table patterns, troubleshooting
  - READ: docs/CONFIGURATION.md for quick reference pattern, option tables
  - READ: docs/QUICKSTART.md for CLI examples to avoid duplication
  - EXTRACT: Document header template (Status, Last Updated, Version)
  - EXTRACT: Table formatting patterns (column alignment, spacing)
  - EXTRACT: Code block language tags (bash for commands)
  - EXTRACT: Cross-reference link patterns (./relative/path.md)

Task 2: CREATE - Document header and Quick Reference section
  - CREATE: File docs/CLI_REFERENCE.md
  - ADD: Document header (Status: Published, Last Updated, Version: 1.0.0)
  - ADD: Brief description "Complete reference for the PRP Pipeline CLI..."
  - ADD: Table of Contents with anchor links
  - ADD: Quick Reference table with essential commands:
    | Command | Description |
    | npm run dev -- --prd ./PRD.md | Run full pipeline |
    | npm run dev -- --prd ./PRD.md --scope P1 | Execute only Phase 1 |
    | npm run dev -- --prd ./PRD.md --continue | Resume from previous session |
    | npm run dev -- --prd ./PRD.md --dry-run | Show plan without executing |
  - FOLLOW: Pattern from docs/CONFIGURATION.md Quick Reference section

Task 3: WRITE - Commands section
  - ADD: Pipeline Execution subsection with basic commands
  - ADD: Scoped Execution subsection with scope format examples
  - ADD: Special Modes subsection (normal, bug-hunt, validate)
  - INCLUDE: Scope format explanation (P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, all)
  - INCLUDE: Case-sensitivity warning (must use uppercase)
  - FORMAT: Code blocks with bash syntax highlighting

Task 4: WRITE - Options section
  - ADD: Required Options table (--prd <path>)
  - ADD: Execution Control table (--mode <mode>, --scope <scope>)
  - ADD: Boolean Flags table (--continue, --dry-run, --verbose, --machine-readable, --no-cache, --continue-on-error, --validate-prd)
  - ADD: Limit Options table (--max-tasks, --max-duration)
  - FORMAT: Match table style from docs/CONFIGURATION.md
  - INCLUDE: Type, Default, Description columns

Task 5: WRITE - Exit Codes section
  - ADD: Exit codes table (Code | Name | Description)
  - INCLUDE: 0 = SUCCESS, 1 = GENERAL_ERROR, 2 = VALIDATION_ERROR, 130 = INTERRUPTED
  - ADD: Shell script handling examples
  - FORMAT: Code blocks showing exit code checking

Task 6: WRITE - Examples section
  - ADD: Basic Usage examples (full pipeline, verbose, dry-run)
  - ADD: Advanced Scenarios (phase-based development, debugging, QA)
  - ADD: Common Patterns (development workflow, delta iteration)
  - INCLUDE: Progressive complexity (simple → complex)
  - FORMAT: Code blocks with bash syntax highlighting

Task 7: WRITE - Error Handling section
  - ADD: Common Errors table with symptoms and solutions
  - INCLUDE: "PRD file not found", "Invalid scope format", "Session not found"
  - ADD: Troubleshooting section with debugging commands
  - FOLLOW: Pattern from docs/INSTALLATION.md Troubleshooting section

Task 8: WRITE - See Also section
  - ADD: Cross-references to related documentation
  - INCLUDE: INSTALLATION.md, CONFIGURATION.md, QUICKSTART.md, user-guide.md, README.md
  - FORMAT: Unordered list with descriptive links

Task 9: VALIDATE - Review against success criteria
  - CHECK: Document header follows pattern
  - CHECK: Table of Contents present with anchors
  - CHECK: All 12 CLI options documented
  - CHECK: All 3 execution modes explained
  - CHECK: Scope formats documented
  - CHECK: Exit codes documented
  - CHECK: Usage examples cover common workflows
  - CHECK: Error handling section present
  - CHECK: All code blocks have bash syntax highlighting
  - CHECK: All internal links use correct relative paths
```

### Implementation Patterns & Key Details

```markdown
<!-- Header Pattern (from INSTALLATION.md) -->
# CLI Reference

> Complete reference for the PRP Pipeline command-line interface, including all available commands, options, execution modes, and usage examples.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

---

<!-- Quick Reference Table Pattern -->
## Quick Reference

Essential commands for daily use:

| Command                                     | Description                                        |
| ------------------------------------------- | -------------------------------------------------- |
| `npm run dev -- --prd ./PRD.md`             | Run full pipeline with default PRD                 |
| `npm run dev -- --prd ./PRD.md --scope P1`   | Execute only Phase 1                               |
| `npm run dev -- --prd ./PRD.md --continue`   | Resume from previous session                       |
| `npm run dev -- --prd ./PRD.md --dry-run`    | Show plan without executing                        |

---

<!-- Options Table Pattern (from CONFIGURATION.md) -->
### Required Options

| Option         | Type   | Default    | Description               |
| -------------- | ------ | ---------- | ------------------------- |
| `--prd <path>` | string | `./PRD.md` | Path to PRD markdown file |

### Execution Control

| Option            | Type   | Choices                          | Default  | Description                                                                 |
| ----------------- | ------ | -------------------------------- | -------- | --------------------------------------------------------------------------- |
| `--mode <mode>`   | string | `normal`, `bug-hunt`, `validate` | `normal` | Execution mode                                                              |
| `--scope <scope>` | string | -                                | -        | Scope identifier (e.g., `P3.M4`, `P3.M4.T2`)                                  |

### Boolean Flags

| Option                | Type    | Default | Description                                                   |
| --------------------- | ------- | ------- | ------------------------------------------------------------- |
| `--continue`          | boolean | false   | Resume from previous session                                  |
| `--dry-run`           | boolean | false   | Show plan without executing                                   |
| `--verbose`           | boolean | false   | Enable debug logging                                          |
| `--machine-readable`  | boolean | false   | Enable machine-readable JSON output                           |
| `--no-cache`          | boolean | false   | Bypass cache and regenerate all PRPs                          |
| `--continue-on-error` | boolean | false   | Treat all errors as non-fatal and continue pipeline execution |
| `--validate-prd`      | boolean | false   | Validate PRD and exit without running pipeline                |

### Limit Options

| Option                 | Type    | Default | Description                                |
| ---------------------- | ------- | ------- | ------------------------------------------ |
| `--max-tasks <number>` | integer | None    | Maximum number of tasks to execute         |
| `--max-duration <ms>`  | integer | None    | Maximum execution duration in milliseconds |

---

<!-- Scope Format Pattern -->
### Scope Format

The `--scope` option accepts the following formats (case-sensitive):

| Format    | Example      | Description                       |
| --------- | ------------ | --------------------------------- |
| Phase     | `P1`         | Execute all tasks in Phase 1      |
| Milestone | `P1.M1`      | Execute all tasks in Milestone 1.1 |
| Task      | `P1.M1.T1`   | Execute all subtasks in Task 1.1.1 |
| Subtask   | `P1.M1.T1.S1`| Execute only subtask 1.1.1.1       |
| All       | `all`        | Execute entire backlog (default)  |

**Important**: Scope format is case-sensitive. Use uppercase letters: `P1.M1`, not `p1.m1`.

---

<!-- Exit Codes Pattern -->
## Exit Codes

| Code | Name        | Description                          |
| ---- | ----------- | ------------------------------------ |
| 0    | SUCCESS     | Pipeline completed successfully       |
| 1    | ERROR       | General error occurred                |
| 2    | VALIDATION_ERROR | PRD or configuration validation failed |
| 130  | INTERRUPTED | Process interrupted by user (Ctrl+C)  |

**Shell Script Example**:

```bash
# Check exit code in shell script
npm run dev -- --prd ./PRD.md
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "Pipeline succeeded"
elif [ $EXIT_CODE -eq 130 ]; then
  echo "Pipeline was interrupted"
else
  echo "Pipeline failed with exit code $EXIT_CODE"
fi
```

---

<!-- Example Patterns -->
### Basic Usage

```bash
# Run pipeline with default settings
npm run dev -- --prd ./PRD.md

# Run with verbose logging for debugging
npm run dev -- --prd ./PRD.md --verbose

# Check what would happen without executing
npm run dev -- --prd ./PRD.md --dry-run
```

### Advanced Scenarios

**Phase-based Development**:

```bash
# Work on Phase 1 first
npm run dev -- --prd ./PRD.md --scope P1

# Later work on Phase 2
npm run dev -- --prd ./PRD.md --scope P2
```

**Debugging Specific Issues**:

```bash
# Re-run a failed subtask with verbose output
npm run dev -- --prd ./PRD.md --scope P1.M1.T2.S1 --verbose --no-cache

# Validate PRD syntax
npm run dev -- --prd ./PRD.md --validate-prd
```

---

<!-- Error Handling Pattern (from INSTALLATION.md) -->
## Error Handling

### Common Errors

#### "PRD file not found"

**What you see**:
```bash
$ npm run dev -- --prd ./PRD.md
Error: PRD file not found: ./PRD.md
```

**Why it happens**:
The PRD file path is incorrect or the file doesn't exist.

**How to fix**:
```bash
# Use absolute or relative path
npm run dev -- --prd /full/path/to/PRD.md

# Or verify current directory
pwd
ls PRD.md
```

#### "Invalid scope format"

**What you see**:
```bash
$ npm run dev -- --prd ./PRD.md --scope p1.m1.t1.s1
Error: Invalid scope "p1.m1.t1.s1"
Expected format: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, or all
```

**Why it happens**:
Scope format is case-sensitive. You must use uppercase P, M, T, S.

**How to fix**:
```bash
# Correct (uppercase)
npm run dev -- --prd ./PRD.md --scope P1.M1.T1.S1

# Incorrect (lowercase)
npm run dev -- --prd ./PRD.md --scope p1.m1.t1.s1  # Will fail
```

---

<!-- See Also Pattern -->
## See Also

- **[README.md](../README.md)** - Project overview and quick start
- **[Installation Guide](./INSTALLATION.md)** - Setup instructions for the development environment
- **[Configuration Reference](./CONFIGURATION.md)** - Environment variables and configuration options
- **[Quick Start Tutorial](./QUICKSTART.md)** - Get started in under 5 minutes
- **[User Guide](./user-guide.md)** - Advanced usage patterns and workflows
```

### Integration Points

```yaml
INSTALLATION.md:
  - reference: "For installation instructions, see [Installation Guide](./INSTALLATION.md)"
  - assume: User has pipeline installed
  - link: Installation troubleshooting

CONFIGURATION.md:
  - reference: "For environment variables and configuration, see [Configuration Reference](./CONFIGURATION.md)"
  - assume: User knows environment variables
  - link: Model selection, API configuration

QUICKSTART.md:
  - reference: "For a hands-on tutorial, see [Quick Start](./QUICKSTART.md)"
  - assume: User may have completed quick start
  - link: Tutorial-style examples

user-guide.md:
  - reference: "For advanced workflows, see [User Guide](./user-guide.md)"
  - placement: See Also section
  - context: Beyond CLI reference to full workflow documentation

README.md:
  - reference: "For project overview, see [README](../README.md)"
  - placement: See Also section
  - context: Architecture, not CLI details
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Check markdown syntax
npm run check-docs 2>/dev/null || echo "Verify markdown links are valid"

# Manual validation checklist
- [ ] All markdown links resolve (./, ../ paths correct)
- [ ] All code blocks have language tags (```bash)
- [ ] Table formatting is aligned (columns line up)
- [ ] No broken internal references (#anchors exist)
- [ ] Document follows established formatting patterns

# Expected: Zero formatting errors, all links valid
```

### Level 2: Content Validation (Completeness)

```bash
# Manual content review checklist
- [ ] All 12 CLI options are documented
- [ ] All 3 execution modes are explained
- [ ] All 5 scope formats are documented (P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, all)
- [ ] Exit codes are documented with examples
- [ ] Usage examples cover common workflows
- [ ] Error handling covers common CLI errors
- [ ] Cross-references link to appropriate docs

# Verify option count
grep -c "\-\-[a-z-]" docs/CLI_REFERENCE.md  # Should count all option references

# Expected: All content validation checks pass
```

### Level 3: Link Validation (Connectivity)

```bash
# Verify all internal links resolve
grep -o '\[.*\](\./[^)]*)' docs/CLI_REFERENCE.md | while read link; do
  target=$(echo "$link" | sed 's/.*(\(.*\))/\1/');
  if [ ! -f "docs/$target" ] && [ ! -f "$target" ]; then
    echo "Broken link: $target";
  fi;
done

# Verify anchor links
grep -o '\[.*\](#[^)]*)' docs/CLI_REFERENCE.md | while read link; do
  anchor=$(echo "$link" | sed 's/.*(#\(.*\))/\1/');
  if ! grep -q "^##.*$anchor" docs/CLI_REFERENCE.md; then
    echo "Broken anchor: $anchor";
  fi;
done

# Expected: All links valid, all anchors resolve
```

### Level 4: Usability Validation (User Testing)

```bash
# Test document usability

# 1. Can user find --verbose option quickly?
grep -A2 "\-\-verbose" docs/CLI_REFERENCE.md

# 2. Can user find scope format examples?
grep -A5 "Scope Format" docs/CLI_REFERENCE.md | grep "P1.M1"

# 3. Can user find exit code 130 meaning?
grep -B2 -A2 "130" docs/CLI_REFERENCE.md | grep "INTERRUPTED"

# 4. Can user find debugging examples?
grep -A10 "Debugging" docs/CLI_REFERENCE.md | grep "\-\-verbose"

# Expected: All common lookups succeed quickly
```

## Final Validation Checklist

### Technical Validation

- [ ] File created at docs/CLI_REFERENCE.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents with all sections and anchors
- [ ] All code blocks have syntax highlighting (```bash)
- [ ] All internal links use correct relative paths (./, ../)
- [ ] All external links are valid URLs
- [ ] Markdown syntax is valid (tables, lists, code blocks)
- [ ] Table columns are properly aligned

### Content Validation

- [ ] All 12 CLI options documented (--prd, --scope, --mode, --continue, --dry-run, --verbose, --machine-readable, --no-cache, --continue-on-error, --validate-prd, --max-tasks, --max-duration)
- [ ] All 3 execution modes explained (normal, bug-hunt, validate)
- [ ] All 5 scope formats documented (P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, all)
- [ ] Case-sensitivity warning included for scope format
- [ ] Exit codes documented (0, 1, 2, 130) with handling examples
- [ ] Usage examples cover basic, advanced, and common patterns
- [ ] Error handling covers common CLI errors (PRD not found, invalid scope, session not found)

### Documentation Pattern Compliance

- [ ] Header matches INSTALLATION.md and CONFIGURATION.md format
- [ ] Table formatting follows established patterns
- [ ] Code block language tags match content type (bash)
- [ ] Section organization follows logical flow
- [ ] Cross-references use consistent link format
- [ ] Tone matches existing documentation (professional, approachable)
- [ ] Quick Reference table follows CONFIGURATION.md pattern

### Usability Validation

- [ ] User can find any CLI option in under 10 seconds
- [ ] Scope format examples are clear and comprehensive
- [ ] Exit code section includes shell script examples
- [ ] Error symptoms are recognizable from actual usage
- [ ] Examples show progressive complexity
- [ ] Troubleshooting section covers common CLI issues

---

## Anti-Patterns to Avoid

- [ ] Don't duplicate content from CONFIGURATION.md (reference it instead)
- [ ] Don't forget the double-dash in CLI command examples (`-- --prd`)
- [ ] Don't use lowercase for scope format examples (must be uppercase)
- [ ] Don't skip the machine-readable flag in documentation
- [ ] Don't confuse --validate-prd (flag) with --mode validate (mode)
- [ ] Don't document 'delta' as a mode (delta is automatic based on PRD hash)
- [ ] Don't skip exit code 130 (SIGINT is common)
- [ ] Don't forget to document --max-duration units (milliseconds)
- [ ] Don't make the Quick Reference table too long (keep it to essential commands)
- [ ] Don't use inconsistent table formatting across sections
