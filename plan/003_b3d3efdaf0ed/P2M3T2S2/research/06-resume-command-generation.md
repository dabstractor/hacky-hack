# Resume Command Generation Patterns

**Research Date:** 2025-01-24
**Focus:** How to generate resume commands, skip strategies, and next step guidance

## Table of Contents
1. [Resume Command Patterns](#resume-command-patterns)
2. [Skip and Continue Strategies](#skip-and-continue-strategies)
3. [Recovery Workflows](#recovery-workflows)
4. [Command Generation Examples](#command-generation-examples)
5. [Implementation Patterns](#implementation-patterns)

---

## Resume Command Patterns

### Pattern 1: Direct Resume

```bash
# Resume from failed task
$ hack resume --task P1.M1.T1.S2

# Resume from specific phase
$ hack resume --phase P1

# Resume from beginning of session
$ hack resume --from-start
```

### Pattern 2: Skip and Continue

```bash
# Skip failed task and continue
$ hack resume --skip P1.M1.T1.S2

# Skip entire milestone
$ hack resume --skip-milestone P1.M1

# Skip with force override
$ hack resume --skip P1.M1.T1.S2 --force
```

### Pattern 3: Retry with Options

```bash
# Retry failed task
$ hack retry --task P1.M1.T1.S2

# Retry with different parameters
$ hack retry --task P1.M1.T1.S2 --with-context "fix-applied"

# Retry all failed tasks in session
$ hack retry --all --session 003_b3d3efdaf0ed
```

### Pattern 4: Conditional Resume

```bash
# Resume if dependencies met
$ hack resume --if-resolved P1.M1.T1.S2

# Resume with automatic dependency resolution
$ hack resume --auto-resolve P1.M1.T1.S2

# Resume with manual confirmation for each task
$ hack resume --interactive
```

---

## Skip and Continue Strategies

### Decision Tree for Skip/Continue

```
Task Failed
    │
    ├─ Is this task critical for pipeline success?
    │   ├─ Yes → PAUSE (do not skip)
    │   └─ No → Continue
    │
    ├─ Are there dependent tasks waiting?
    │   ├─ Yes → Can they run without this task's output?
    │   │   ├─ Yes → OFFER SKIP
    │   │   └─ No → PAUSE
    │   └─ No → OFFER SKIP
    │
    ├─ Is this a validation task?
    │   ├─ Yes → Can validation be deferred?
    │   │   ├─ Yes → OFFER SKIP
    │   │   └─ No → PAUSE
    │   └─ No → Continue
    │
    └─ Can the task be fixed quickly?
        ├─ Yes → SUGGEST RETRY
        └─ No → OFFER SKIP or PAUSE
```

### Skip Strategy Implementation

```typescript
interface SkipStrategy {
  canSkip: boolean;
  reason: string;
  risks: string[];
  mitigation?: string;
  resumeCommand: string;
}

class SkipStrategyAnalyzer {
  analyze(failedTask: string, context: {
    taskType: string;
    hasDependents: boolean;
    isCritical: boolean;
    canDefer: boolean;
  }): SkipStrategy {
    // Critical tasks cannot be skipped
    if (context.isCritical) {
      return {
        canSkip: false,
        reason: 'This task is critical for pipeline success',
        risks: ['Pipeline may produce invalid results'],
        mitigation: 'Fix the error and retry',
        resumeCommand: `hack retry --task ${failedTask}`,
      };
    }

    // Tasks with dependents that require output
    if (context.hasDependents && !context.canDefer) {
      return {
        canSkip: false,
        reason: 'Dependent tasks require this task\'s output',
        risks: ['Dependent tasks will fail'],
        mitigation: 'Fix the error or skip dependent tasks',
        resumeCommand: `hack retry --task ${failedTask}`,
      };
    }

    // Validation tasks that can be deferred
    if (context.taskType === 'validation' && context.canDefer) {
      return {
        canSkip: true,
        reason: 'Validation can be run at the end of the pipeline',
        risks: [
          'Issues may not be caught until later',
          'Debugging may be more difficult',
        ],
        mitigation: 'Run validation after all implementation tasks complete',
        resumeCommand: `hack resume --skip ${failedTask}`,
      };
    }

    // Optional or enhancement tasks
    if (context.taskType === 'optional' || context.taskType === 'enhancement') {
      return {
        canSkip: true,
        reason: 'This task is optional or an enhancement',
        risks: ['Feature will not be implemented'],
        mitigation: 'Can be implemented in a future session',
        resumeCommand: `hack resume --skip ${failedTask}`,
      };
    }

    // Default: offer skip with warnings
    return {
      canSkip: true,
      reason: 'Task can be skipped but may impact pipeline',
      risks: ['Unknown impact on pipeline'],
      mitigation: 'Review dependent tasks before skipping',
      resumeCommand: `hack resume --skip ${failedTask} --force`,
    };
  }
}
```

---

## Recovery Workflows

### Workflow 1: Fix and Retry

```
Error detected in task P1.M1.T1.S2
↓
[User fixes the issue manually]
↓
$ hack retry --task P1.M1.T1.S2
↓
Task succeeds → Continue pipeline
```

### Workflow 2: Skip and Continue

```
Error detected in task P1.M1.T1.S2
↓
$ hack resume --skip P1.M1.T1.S2
↓
[CLI confirms skip is safe]
↓
Pipeline continues from P1.M1.T1.S3
↓
[Optional: Run skipped task later]
$ hack run --task P1.M1.T1.S2 --deferred
```

### Workflow 3: Branch and Fix

```
Error detected in task P1.M1.T1.S2
↓
$ hack session branch --from-error 003_b3d3efdaf0ed
↓
[New session 004_xxxxxxxxxxx created]
↓
[User fixes issue in new session]
↓
$ hack session merge --source 004_xxxxxxxxxxx --target 003_b3d3efdaf0ed
↓
$ hack resume --session 003_b3d3efdaf0ed
```

### Workflow 4: Rollback and Restart

```
Error detected in task P1.M1.T1.S2
↓
$ hack rollback --task P1.M1.T1.S1
↓
[All changes since P1.M1.T1.S1 are reverted]
↓
$ hack resume --task P1.M1.T1.S1
↓
[Pipeline restarts from P1.M1.T1.S1]
```

---

## Command Generation Examples

### Example 1: Simple Resume

```typescript
function generateResumeCommand(
  failedTask: string,
  sessionId: string
): string {
  return `hack resume --session ${sessionId} --task ${failedTask}`;
}

// Usage
const cmd = generateResumeCommand('P1.M1.T1.S2', '003_b3d3efdaf0ed');
// Output: hack resume --session 003_b3d3efdaf0ed --task P1.M1.T1.S2
```

### Example 2: Skip with Dependencies

```typescript
interface SkipOptions {
  taskId: string;
  skipDependents?: boolean;
  force?: boolean;
  sessionId: string;
}

function generateSkipCommand(options: SkipOptions): string {
  const parts = [
    'hack',
    'resume',
    `--session ${options.sessionId}`,
    `--skip ${options.taskId}`,
  ];

  if (options.skipDependents) {
    parts.push('--skip-dependents');
  }

  if (options.force) {
    parts.push('--force');
  }

  return parts.join(' ');
}

// Usage
const cmd = generateSkipCommand({
  taskId: 'P1.M1.T1.S2',
  skipDependents: true,
  force: false,
  sessionId: '003_b3d3efdaf0ed',
});
// Output: hack resume --session 003_b3d3efdaf0ed --skip P1.M1.T1.S2 --skip-dependents
```

### Example 3: Retry with Context

```typescript
interface RetryOptions {
  taskId: string;
  sessionId?: string;
  retryCount?: number;
  context?: string;
  withFlags?: string[];
}

function generateRetryCommand(options: RetryOptions): string {
  const parts = ['hack', 'retry'];

  if (options.sessionId) {
    parts.push(`--session ${options.sessionId}`);
  }

  parts.push(`--task ${options.taskId}`);

  if (options.retryCount && options.retryCount > 0) {
    parts.push(`--attempt ${options.retryCount + 1}`);
  }

  if (options.context) {
    parts.push(`--context "${options.context}"`);
  }

  if (options.withFlags && options.withFlags.length > 0) {
    parts.push(...options.withFlags);
  }

  return parts.join(' ');
}

// Usage
const cmd = generateRetryCommand({
  taskId: 'P1.M1.T1.S2',
  sessionId: '003_b3d3efdaf0ed',
  retryCount: 2,
  context: 'fix-applied',
  withFlags: ['--verbose', '--no-cache'],
});
// Output: hack retry --session 003_b3d3efdaf0ed --task P1.M1.T1.S2 --attempt 3 --context "fix-applied" --verbose --no-cache
```

### Example 4: Multi-Task Resume

```typescript
interface MultiTaskResumeOptions {
  sessionId: string;
  fromTask?: string;
  toTask?: string;
  includeFailed?: boolean;
  excludeCompleted?: boolean;
}

function generateMultiTaskResumeCommand(
  options: MultiTaskResumeOptions
): string {
  const parts = [
    'hack',
    'resume',
    `--session ${options.sessionId}`,
  ];

  if (options.fromTask) {
    parts.push(`--from ${options.fromTask}`);
  }

  if (options.toTask) {
    parts.push(`--to ${options.toTask}`);
  }

  if (options.includeFailed) {
    parts.push('--include-failed');
  }

  if (options.excludeCompleted) {
    parts.push('--exclude-completed');
  }

  return parts.join(' ');
}

// Usage
const cmd = generateMultiTaskResumeCommand({
  sessionId: '003_b3d3efdaf0ed',
  fromTask: 'P1.M1.T1',
  toTask: 'P1.M2',
  includeFailed: true,
  excludeCompleted: true,
});
// Output: hack resume --session 003_b3d3efdaf0ed --from P1.M1.T1 --to P1.M2 --include-failed --exclude-completed
```

---

## Implementation Patterns

### Pattern 1: Command Builder

```typescript
class ResumeCommandBuilder {
  private sessionId: string;
  private taskId?: string;
  private skipTask?: string;
  private force = false;
  private skipDependents = false;
  private retry = false;
  private context?: string;
  private flags: string[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  task(taskId: string): this {
    this.taskId = taskId;
    return this;
  }

  skip(taskId: string): this {
    this.skipTask = taskId;
    return this;
  }

  withForce(): this {
    this.force = true;
    return this;
  }

  skipDependents(value = true): this {
    this.skipDependents = value;
    return this;
  }

  withRetry(): this {
    this.retry = true;
    return this;
  }

  withContext(context: string): this {
    this.context = context;
    return this;
  }

  withFlag(flag: string): this {
    this.flags.push(flag);
    return this;
  }

  build(): string {
    const parts = ['hack'];

    if (this.retry) {
      parts.push('retry');
    } else {
      parts.push('resume');
    }

    parts.push(`--session ${this.sessionId}`);

    if (this.taskId) {
      parts.push(`--task ${this.taskId}`);
    }

    if (this.skipTask) {
      parts.push(`--skip ${this.skipTask}`);
    }

    if (this.force) {
      parts.push('--force');
    }

    if (this.skipDependents) {
      parts.push('--skip-dependents');
    }

    if (this.context) {
      parts.push(`--context "${this.context}"`);
    }

    if (this.flags.length > 0) {
      parts.push(...this.flags);
    }

    return parts.join(' ');
  }
}

// Usage
const cmd = new ResumeCommandBuilder('003_b3d3efdaf0ed')
  .task('P1.M1.T1.S2')
  .withRetry()
  .withContext('type-fixes-applied')
  .withFlag('--verbose')
  .build();

// Output: hack retry --session 003_b3d3efdaf0ed --task P1.M1.T1.S2 --context "type-fixes-applied" --verbose
```

### Pattern 2: Smart Command Generator

```typescript
interface ErrorContext {
  sessionId: string;
  failedTask: string;
  errorType: string;
  canContinue: boolean;
  hasDependents: boolean;
  isRetryable: boolean;
  suggestedFix?: string;
}

class SmartCommandGenerator {
  generateCommands(context: ErrorContext): {
    primary: string;
    alternatives: string[];
    explanation: string;
  } {
    const commands: {
      primary: string;
      alternatives: string[];
      explanation: string;
    } = {
      primary: '',
      alternatives: [],
      explanation: '',
    };

    // Primary command based on error type
    switch (context.errorType) {
      case 'validation':
        if (context.isRetryable) {
          commands.primary = new ResumeCommandBuilder(context.sessionId)
            .task(context.failedTask)
            .withRetry()
            .withContext('validation-fixes')
            .build();
          commands.explanation =
            'Retry the validation task after fixing the validation errors';
        } else {
          commands.primary = new ResumeCommandBuilder(context.sessionId)
            .skip(context.failedTask)
            .withForce()
            .build();
          commands.explanation =
            'Skip this validation task (validation will run at end of pipeline)';
        }
        break;

      case 'dependency':
        if (context.suggestedFix) {
          commands.primary = `npm install ${context.suggestedFix} && ` +
            new ResumeCommandBuilder(context.sessionId)
              .task(context.failedTask)
              .build();
          commands.explanation =
            'Install missing dependencies and retry the task';
        } else {
          commands.primary = new ResumeCommandBuilder(context.sessionId)
            .task(context.failedTask)
            .withRetry()
            .build();
          commands.explanation =
            'Retry the task after manually resolving dependency issues';
        }
        break;

      case 'network':
        commands.primary = new ResumeCommandBuilder(context.sessionId)
          .task(context.failedTask)
          .withRetry()
          .withContext('network-retry')
          .withFlag('--timeout 60000')
          .build();
        commands.explanation =
          'Retry the task with increased timeout for network operations';
        break;

      default:
        commands.primary = new ResumeCommandBuilder(context.sessionId)
          .task(context.failedTask)
          .withRetry()
          .build();
        commands.explanation =
          'Retry the task after resolving the error';
    }

    // Generate alternative commands
    commands.alternatives = this.generateAlternatives(context);

    return commands;
  }

  private generateAlternatives(context: ErrorContext): string[] {
    const alternatives: string[] = [];

    // Alternative 1: Skip if possible
    if (!context.hasDependents) {
      alternatives.push(
        new ResumeCommandBuilder(context.sessionId)
          .skip(context.failedTask)
          .build()
      );
    }

    // Alternative 2: Skip with dependents
    if (context.hasDependents) {
      alternatives.push(
        new ResumeCommandBuilder(context.sessionId)
          .skip(context.failedTask)
          .skipDependents()
          .withForce()
          .build()
      );
    }

    // Alternative 3: Retry from beginning of phase
    const phaseId = context.failedTask.split('.').slice(0, 1).join('.');
    alternatives.push(
      new ResumeCommandBuilder(context.sessionId)
        .task(phaseId)
        .build()
    );

    // Alternative 4: Interactive mode
    alternatives.push(
      `hack resume --session ${context.sessionId} --interactive`
    );

    return alternatives;
  }
}
```

### Pattern 3: Command Suggestion Display

```typescript
import chalk from 'chalk';

class CommandSuggestionDisplay {
  format(
    commands: {
      primary: string;
      alternatives: string[];
      explanation: string;
    }
  ): string {
    const lines: string[] = [];

    // Primary command
    lines.push(chalk.bold.yellow('\nRecommended Command:'));
    lines.push(chalk.gray('─'.repeat(80)));
    lines.push('');
    lines.push(chalk.cyan('  ' + commands.explanation));
    lines.push('');
    lines.push(chalk.bold.white('  $ ' + commands.primary));
    lines.push('');

    // Alternatives
    if (commands.alternatives.length > 0) {
      lines.push(chalk.bold.yellow('\nAlternative Commands:'));
      lines.push(chalk.gray('─'.repeat(80)));
      lines.push('');

      for (let i = 0; i < commands.alternatives.length; i++) {
        lines.push(
          chalk.cyan(`  ${i + 1}. `) +
          chalk.white(commands.alternatives[i])
        );
      }
      lines.push('');
    }

    // Quick action hint
    lines.push(chalk.dim('\nTip: Use --dry-run to preview what will happen\n'));

    return lines.join('\n');
  }

  formatInteractive(
    commands: {
      primary: string;
      alternatives: string[];
      explanation: string;
    }
  ): string {
    const lines: string[] = [];

    lines.push(chalk.bold.yellow('\nChoose an action:'));
    lines.push('');

    lines.push(
      chalk.green('  [0] ') +
      chalk.white('Run recommended command') +
      chalk.dim(` (${commands.primary})`)
    );

    for (let i = 0; i < commands.alternatives.length; i++) {
      lines.push(
        chalk.green(`  [${i + 1}] `) +
        chalk.white(commands.alternatives[i])
      );
    }

    lines.push(chalk.red('  [q] ') + chalk.white('Quit (pause pipeline)'));
    lines.push('');
    lines.push(chalk.dim('Press 0-q to select: '));

    return lines.join('\n');
  }
}
```

### Pattern 4: Complete Error Recovery Display

```typescript
class ErrorRecoveryDisplay {
  private commandGenerator: SmartCommandGenerator;
  private display: CommandSuggestionDisplay;

  constructor() {
    this.commandGenerator = new SmartCommandGenerator();
    this.display = new CommandSuggestionDisplay();
  }

  format(
    errorContext: ErrorContext,
    includeStackTrace = false
  ): string {
    const commands = this.commandGenerator.generateCommands(errorContext);
    const lines: string[] = [];

    // Error header
    lines.push(chalk.bold.red('\n╔═══════════════════════════════════════════════════════════════╗'));
    lines.push(chalk.bold.red('║ Pipeline Execution Paused                                          ║'));
    lines.push(chalk.bold.red('╚═══════════════════════════════════════════════════════════════╝'));

    // Error details
    lines.push('');
    lines.push(chalk.bold('Error Details:'));
    lines.push(chalk.gray('─'.repeat(80)));
    lines.push('');
    lines.push(`  Task: ${chalk.red(errorContext.failedTask)}`);
    lines.push(`  Type: ${chalk.yellow(errorContext.errorType)}`);
    lines.push(`  Session: ${chalk.dim(errorContext.sessionId)}`);
    lines.push('');

    // Commands
    lines.push(this.display.format(commands));

    // Impact information
    if (errorContext.hasDependents) {
      lines.push(chalk.bold.yellow('Warning:'));
      lines.push(
        chalk.yellow('  ⚠ This task has dependent tasks that will be blocked.')
      );
      lines.push('');
    }

    // Stack trace (if requested)
    if (includeStackTrace) {
      lines.push(chalk.bold.gray('\nStack Trace:'));
      lines.push(chalk.gray('─'.repeat(80)));
      lines.push(chalk.dim('  [Stack trace would appear here]'));
      lines.push('');
    }

    // Next steps
    lines.push(chalk.bold.cyan('\nNext Steps:'));
    lines.push(chalk.gray('─'.repeat(80)));
    lines.push('');
    lines.push(chalk.cyan('  1. Review the error details above'));
    lines.push(chalk.cyan('  2. Choose one of the suggested commands'));
    lines.push(chalk.cyan('  3. Or fix the issue manually and run:'));
    lines.push(chalk.white(`     $ ${commands.primary}`));
    lines.push('');

    return lines.join('\n');
  }
}
```

---

## Best Practices

### DO:
- Provide exact, copy-pasteable commands
- Show the primary recommendation first
- Include alternative approaches
- Explain what each command does
- Use flags for safety (--dry-run, --confirm)
- Support batch operations (--skip-dependents)
- Provide interactive mode for complex scenarios
- Include context in commands (what was fixed)

### DON'T:
- Generate commands without validation
- Skip warnings for destructive operations
- Overwhelm with too many alternatives
- Use ambiguous flags or options
- Forget about session context
- Omit help text for complex commands
- Hide the risks of skip operations
- Make assumptions about user intent

---

## Related Libraries

- `commander` - Command-line interface framework
- `yargs` - Alternative CLI parser
- `inquirer` - Interactive command-line prompts
- `chalk` - Terminal colors
- `ora` - Loading spinners

---

## References

- **CLI Design Patterns**: https://clig.dev/
- **Command-Line Interface Guidelines**: https://github.com/clibs/clig
- **GNU Coding Standards**: https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html
- **npm CLI Documentation**: https://docs.npmjs.com/cli/
- **Git Command Documentation**: https://git-scm.com/docs/git
