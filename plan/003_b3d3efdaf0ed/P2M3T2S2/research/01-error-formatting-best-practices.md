# Error Formatting Best Practices for CLI Tools

**Research Date:** 2025-01-24
**Focus:** CLI error message formatting, structure, and presentation

## Table of Contents

1. [Core Principles](#core-principles)
2. [Error Message Structure](#error-message-structure)
3. [Real-World Examples](#real-world-examples)
4. [Terminal Color & Formatting](#terminal-color--formatting)
5. [Implementation Patterns](#implementation-patterns)

---

## Core Principles

### 1. **Actionability Over Technical Detail**

- **What went wrong** (clear, plain language)
- **Why it matters** (context)
- **How to fix it** (specific actions)
- **Where to learn more** (documentation links)

### 2. **Hierarchy of Information**

```
[ERROR CATEGORY] Brief one-line summary
├── Context: What was being attempted
├── Cause: What specifically failed
├── Impact: What this affects
└── Solution: Specific fix command or steps
```

### 3. **Consistent Formatting Patterns**

- Use prefixes for severity: `ERROR:`, `WARN:`, `INFO:`, `FATAL:`
- Structured sections with clear visual separators
- Code/command examples in distinct formatting
- Consistent ordering: Summary → Details → Fix → Docs

---

## Error Message Structure

### Standard Error Format Template

```
[ERROR_CODE] Error Category: Brief Summary

Context:
  What was being attempted when the error occurred

Problem:
  Specific technical details about what went wrong

Impact:
  What operations are affected by this error

Suggested Fix:
  Command or steps to resolve the issue

Documentation:
  URL to relevant docs
```

### Example: File Not Found Error

```
[FILE_NOT_FOUND] Resource Error: Configuration file not found

Context:
  Attempting to load PRP configuration for session 003_b3d3efdaf0ed

Problem:
  File not found: plan/003_b3d3efdaf0ed/config.json
  Expected location: /home/user/projects/hacky-hack/plan/003_b3d3efdaf0ed/

Impact:
  - Cannot load session configuration
  - Task dependencies cannot be resolved
  - Pipeline execution blocked

Suggested Fix:
  1. Verify the session directory exists:
     $ ls -la plan/003_b3d3efdaf0ed/

  2. Initialize the session if missing:
     $ hack session init 003_b3d3efdaf0ed

  3. Check parent session exists if this is a delta:
     $ hack session inspect --parent

Documentation:
  https://hacky-hack.dev/docs/sessions#configuration
```

---

## Real-World Examples

### kubectl Error Messages

```bash
# Simple, actionable error
$ kubectl get pods
error: You must provide one or more resources by argument or stdin.
See 'kubectl get --help' for more details.

# Error with context
$ kubectl apply -f missing.yaml
error: error parsing missing.yaml: error converting YAML to JSON:
yaml: line 2: found unexpected end of file

# Structured error with suggestions
$ kubectl delete pod nonexistent
Error from server (NotFound): pods "nonexistent" not found

# With verbose flag
$ kubectl get pods -v=6
# Shows full request/response cycle
```

**Key Patterns:**

- Error type in parentheses: `(NotFound)`
- Resource name in quotes: `"nonexistent"`
- Suggests `--help` flag
- Verbose mode available for debugging

### Docker Error Messages

```bash
# Permission error with context
$ docker ps
Got permission denied while trying to connect to the Docker daemon socket
at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json":
dial unix /var/run/docker.sock: connect: permission denied

# Suggestion included
$ docker run invalid/image
Unable to find image 'invalid/image' locally
docker: Error response from daemon: pull access denied for invalid/image,
repository does not exist or may require 'docker login': denied: requested access
to the resource is denied.

# See 'docker run --help' for more info
```

**Key Patterns:**

- Full error path (socket, HTTP endpoint)
- Clear action: "repository does not exist or may require 'docker login'"
- Always references help command
- Multiple possible causes listed

### npm Error Messages

```bash
# Missing dependency with install command
$ npm run build
npm ERR! missing script: build

npm ERR! A complete log of this debug run can be found in:
npm ERR!     /home/user/.npm/_logs/2024-01-15T10_30_00_123Z-debug.log

npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! package@1.0.0 build: `webpack`
npm ERR! Exit status 1

# Suggests solutions
npm ERR! This is probably not a problem with npm. There is likely additional
logging output above.
```

**Key Patterns:**

- Error codes for programmatic parsing: `ELIFECYCLE`
- Exit status codes
- Full command that failed
- Log file location always provided
- Helpful diagnosis ("probably not a problem with npm")

### Git Error Messages

```bash
# Clear action required
$ git push
fatal: The current branch feature-branch has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin feature-branch

# Multiple options presented
$ git pull
fatal: refusing to merge unrelated histories

To fix this, use:
  git pull --allow-unrelated-histories

# Hint system
$ git checkout
hint: you may want to use 'git switch' instead
hint: Switching branches is permanent.
```

**Key Patterns:**

- `fatal:` prefix for critical errors
- Exact command to run provided
- Alternative commands suggested via `hint:`
- Clear distinction between error and suggestion

### AWS CLI Error Messages

```bash
# Structured with error code
$ aws s3 ls invalid-bucket/
An error occurred (NoSuchBucket) when calling the ListObjectsV2 operation:
The specified bucket does not exist

# With --debug flag
$ aws ec2 run-instances --debug
# Shows full request/response with headers
# Shows retries and attempt count
# Shows timing information

# Credential errors with fix
$ aws s3 ls
Unable to locate credentials. You can configure credentials by running
"aws configure".
```

**Key Patterns:**

- Error code in parentheses: `(NoSuchBucket)`
- Operation name: `ListObjectsV2`
- Clear credential configuration instruction
- Debug mode shows full HTTP exchange

---

## Terminal Color & Formatting

### Color Palette Standards

```javascript
const colors = {
  // Severity
  error: chalk.red, // Errors, failures
  warning: chalk.yellow, // Warnings, cautions
  success: chalk.green, // Success, completions
  info: chalk.blue, // Informational messages
  debug: chalk.gray, // Debug details

  // UI Elements
  heading: chalk.bold.cyan, // Section headers
  code: chalk.gray.bgWhite, // Code blocks
  link: chalk.underline.blue, // URLs
  emphasis: chalk.bold, // Important text
  dim: chalk.dim, // Secondary info
};
```

### Icon System

```javascript
const icons = {
  // Status
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  pending: '○',
  running: '◐',

  // Severity
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',

  // Action
  fix: '🔧',
  docs: '📚',
  terminal: '⌨',
  link: '🔗',
};
```

### Text Formatting

```javascript
// Headers
console.log(chalk.bold.cyan('\n━┓ Error Summary\n'));

// Sections
console.log(chalk.yellow('┃\n┃ Context:\n'));

// Code blocks
console.log(chalk.gray.bgWhite('  $ command arg1 arg2  '));

// Emphasis
console.log(chalk.red.bold('ERROR: ') + chalk.red('File not found'));

// Links
console.log(chalk.blue.underline('https://docs.hacky-hack.dev'));
```

---

## Implementation Patterns

### Pattern 1: Error Categories

```typescript
enum ErrorCategory {
  FILE_SYSTEM = 'FILE_SYSTEM',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  DEPENDENCY = 'DEPENDENCY',
  RUNTIME = 'RUNTIME',
}

interface CliError {
  category: ErrorCategory;
  code: string;
  message: string;
  context?: Record<string, unknown>;
  suggestions?: string[];
  docs?: string;
}
```

### Pattern 2: Error Builder Class

```typescript
class ErrorBuilder {
  private error: Partial<CliError> = {};

  category(category: ErrorCategory) {
    this.error.category = category;
    return this;
  }

  code(code: string) {
    this.error.code = code;
    return this;
  }

  message(message: string) {
    this.error.message = message;
    return this;
  }

  context(context: Record<string, unknown>) {
    this.error.context = { ...this.error.context, ...context };
    return this;
  }

  suggest(...suggestions: string[]) {
    this.error.suggestions = [
      ...(this.error.suggestions || []),
      ...suggestions,
    ];
    return this;
  }

  docs(url: string) {
    this.error.docs = url;
    return this;
  }

  build(): CliError {
    return this.error as Required<CliError>;
  }
}

// Usage
const error = new ErrorBuilder()
  .category(ErrorCategory.FILE_SYSTEM)
  .code('FILE_NOT_FOUND')
  .message('Configuration file not found')
  .context({ path: '/path/to/config.json' })
  .suggest('Verify file exists', 'Check file permissions')
  .docs('https://docs.hacky-hack.dev/config')
  .build();
```

### Pattern 3: Error Formatter

```typescript
import chalk from 'chalk';
import Table from 'cli-table3';

export class ErrorFormatter {
  format(error: CliError): string {
    const lines: string[] = [];

    // Header with code
    lines.push(
      chalk.red.bold(`[${error.code}] `) +
        chalk.red(`${error.category}: ${error.message}`)
    );

    // Context section
    if (error.context) {
      lines.push(this.formatSection('Context', error.context));
    }

    // Suggestions section
    if (error.suggestions && error.suggestions.length > 0) {
      lines.push(this.formatSection('Suggested Fix', error.suggestions));
    }

    // Documentation link
    if (error.docs) {
      lines.push(
        chalk.yellow('Documentation:\n') +
          chalk.blue.underline(`  ${error.docs}`)
      );
    }

    return lines.join('\n\n');
  }

  private formatSection(title: string, content: unknown): string {
    const table = new Table({
      colWidths: [20, 60],
      chars: minimalChars,
    });

    if (typeof content === 'object') {
      for (const [key, value] of Object.entries(
        content as Record<string, unknown>
      )) {
        table.push([chalk.yellow(key), String(value)]);
      }
    } else if (Array.isArray(content)) {
      content.forEach((item, index) => {
        table.push([chalk.yellow(`${index + 1}.`), String(item)]);
      });
    }

    return chalk.yellow(title + ':') + '\n' + table.toString();
  }
}

const minimalChars = {
  top: '',
  'top-mid': '',
  'top-left': '',
  'top-right': '',
  bottom: '',
  'bottom-mid': '',
  'bottom-left': '',
  'bottom-right': '',
  left: '',
  'left-mid': '',
  mid: '',
  'mid-mid': '',
  right: '',
  'right-mid': '',
  middle: ' ',
};
```

### Pattern 4: Verbose Mode Support

```typescript
interface FormatOptions {
  verbose?: boolean;
  color?: boolean;
  maxWidth?: number;
}

class ErrorFormatter {
  format(error: CliError, options: FormatOptions = {}): string {
    const { verbose = false } = options;

    // Always show core error info
    let output = this.formatBasic(error);

    // Add context in verbose mode
    if (verbose && error.context) {
      output += '\n\n' + this.formatContext(error.context);
    }

    // Add stack trace in verbose mode
    if (verbose && error.stack) {
      output += '\n\n' + this.formatStack(error.stack);
    }

    return output;
  }

  private formatBasic(error: CliError): string {
    return (
      chalk.red.bold(`[${error.code}] `) +
      chalk.red(`${error.category}: ${error.message}`)
    );
  }

  private formatContext(context: Record<string, unknown>): string {
    return chalk.yellow('Context:') + '\n' + JSON.stringify(context, null, 2);
  }

  private formatStack(stack: string): string {
    return chalk.gray('Stack Trace:') + '\n' + chalk.dim(stack);
  }
}
```

---

## Best Practices Summary

### DO:

- Start with the most important information
- Use plain language first, technical details second
- Provide exact commands to fix issues
- Link to relevant documentation
- Use color consistently for semantic meaning
- Support verbose/debug modes
- Include error codes for programmatic parsing
- Show what was attempted, not just what failed

### DON'T:

- Bury the lead (error message should be first)
- Use jargon without explanation
- Show raw stack traces by default
- Make users guess how to fix issues
- Use color as the only indicator (accessibility)
- Overwhelm with information (use --verbose)
- Assume technical knowledge of user
- Send error output to stdout (use stderr)

---

## References & Further Reading

- **kubectl Error Handling**: https://github.com/kubernetes/kubectl
- **Docker CLI**: https://github.com/docker/cli
- **npm Error Messages**: https://github.com/npm/cli
- **Git Error System**: https://github.com/git/git
- **AWS CLI Guidelines**: https://github.com/aws/aws-cli

### Related Libraries

- `chalk` - Terminal string styling
- `cli-table3` - Unicode table formatting
- `ora` - Terminal spinners
- `figures` - Unicode symbols
- `boxen` - Box formatting for emphasis
