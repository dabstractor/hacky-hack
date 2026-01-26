# CLI Error Reporting - Quick Implementation Reference

**Quick reference for implementing enhanced error reporting in hacky-hack**

## File Structure

```
plan/003_b3d3efdaf0ed/P2M3T2S2/research/
├── README.md                                    # Research summary
├── QUICK_REFERENCE.md                           # This file
├── 01-error-formatting-best-practices.md        # Error message structure
├── 02-error-timeline-visualization.md           # Timeline and chronology
├── 03-stack-trace-presentation.md               # Stack trace handling
├── 04-suggested-fixes-and-documentation.md      # Fix suggestions
├── 05-affected-tasks-and-dependencies.md        # Impact analysis
└── 06-resume-command-generation.md              # Resume commands
```

## Core Error Format Template

```
[ERROR_CODE] Error Category: Brief Summary

Context:
  What was being attempted

Problem:
  Specific technical details

Impact:
  What operations are affected

Suggested Fix:
  $ exact-command-to-run

Documentation:
  https://docs.hacky-hack.dev/errors/ERROR_CODE

Timeline:
  10:15 ✗ P1.M1.T1.S2 Failed
  10:22 ↳ Retry #1 failed
  10:30 ↳ Resolved (manual)

Affected Tasks:
  • P1.M1.T1.S3 (blocked)
  • P1.M1.T2.S1 (blocked)

Resume Command:
  $ hack resume --task P1.M1.T1.S2
```

## Essential Code Snippets

### Error Builder

```typescript
class ErrorBuilder {
  category(cat: string): this
  code(code: string): this
  message(msg: string): this
  context(ctx: Record<string, unknown>): this
  suggest(...suggestions: string[]): this
  docs(url: string): this
  build(): CliError
}
```

### Timeline Formatter

```typescript
interface TimelineEntry {
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'success';
  taskId: string;
  event: string;
  details?: string;
}
```

### Impact Calculator

```typescript
interface TaskImpact {
  level: 'critical' | 'high' | 'medium' | 'low' | 'none';
  affectedTasks: string[];
  blockedPhases: string[];
  blockedMilestones: string[];
  canContinue: boolean;
  suggestedAction: 'pause' | 'retry' | 'skip' | 'continue';
}
```

### Resume Command Builder

```typescript
new ResumeCommandBuilder(sessionId)
  .task(taskId)
  .withRetry()
  .withContext('fix-applied')
  .build()
// Output: hack retry --session 003_xxx --task P1.M1.T1.S2 --context "fix-applied"
```

## Color Palette

```typescript
const colors = {
  error: chalk.red,           // Errors, failures
  warning: chalk.yellow,      // Warnings, cautions
  success: chalk.green,       // Success, completions
  info: chalk.blue,           // Informational messages
  debug: chalk.gray,          // Debug details
  heading: chalk.bold.cyan,   // Section headers
  link: chalk.blue.underline, // URLs
};

const icons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  running: '◐',
  blocked: '⏸',
};
```

## Error Categories

```typescript
enum ErrorCategory {
  FILE_SYSTEM = 'FILE_SYSTEM',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  DEPENDENCY = 'DEPENDENCY',
  RUNTIME = 'RUNTIME',
}
```

## Impact Levels

```typescript
enum ImpactLevel {
  CRITICAL = 'critical',  // Blocks entire pipeline
  HIGH = 'high',          // Blocks multiple phases
  MEDIUM = 'medium',      // Blocks single phase
  LOW = 'low',            // Blocks single task
  NONE = 'none',          // No impact
}
```

## Common Resume Commands

```bash
# Direct resume
hack resume --session <ID> --task <TASK>

# Skip failed task
hack resume --session <ID> --skip <TASK>

# Retry with context
hack retry --session <ID> --task <TASK> --context "fix-applied"

# Skip with dependents
hack resume --session <ID> --skip <TASK> --skip-dependents --force

# Interactive mode
hack resume --session <ID> --interactive
```

## Key Implementation Classes

### 1. ErrorFormatter
**Location**: `src/utils/errors/error-formatter.ts`
**Purpose**: Format errors with consistent structure

### 2. TimelineTracker
**Location**: `src/utils/errors/timeline-tracker.ts`
**Purpose**: Track and display error chronology

### 3. ImpactAnalyzer
**Location**: `src/utils/errors/impact-analyzer.ts`
**Purpose**: Calculate error impact on tasks

### 4. DependencyGraph
**Location**: `src/utils/errors/dependency-graph.ts`
**Purpose**: Build and traverse task dependencies

### 5. RecommendationEngine
**Location**: `src/utils/errors/recommendation-engine.ts`
**Purpose**: Generate fix suggestions

### 6. ResumeCommandBuilder
**Location**: `src/utils/errors/resume-command-builder.ts`
**Purpose**: Build resume/skip commands

## Integration Points

### ERROR_REPORT.md Generation
**File**: `src/workflows/prp-pipeline.ts`
**Integration Point**: After error detection, before pause

```typescript
// After error detection
const errorReport = await generateErrorReport({
  session: currentSession,
  errors: accumulatedErrors,
  timeline: errorTimeline,
  dependencies: dependencyGraph,
});

await writeFile('ERROR_REPORT.md', errorReport);
```

### CLI Output
**File**: `src/cli/commands/inspect.ts`
**Integration Point**: Error inspection command

```typescript
// Show enhanced error report
if (errors.length > 0) {
  const formatter = new ErrorDisplayFormatter();
  console.log(formatter.formatErrors(errors));
}
```

## Testing Checklist

- [ ] Error categories are applied correctly
- [ ] All timestamps are in consistent format
- [ ] Stack traces collapse library code
- [ ] Resume commands are valid
- [ ] Documentation links are correct
- [ ] Impact levels are accurate
- [ ] Colors render properly in TTY
- [ ] Plain text output works (non-TTY)
- [ ] Verbose flag shows full details
- [ ] Interactive mode prompts correctly

## Dependencies

Already installed in hacky-hack:
- `chalk` ^5.6.2 - Terminal colors
- `cli-table3` ^0.6.5 - Table formatting
- `cli-progress` ^3.12.0 - Progress bars

Consider adding:
- `figures` - Unicode symbols
- `date-fns` - Date formatting
- `ora` - Loading spinners
- `prompts` - Interactive prompts

## Common Patterns

### Error with Full Context
```typescript
const error = new ErrorBuilder()
  .category(ErrorCategory.VALIDATION)
  .code('TYPE_VALIDATION_FAILED')
  .message('Type validation failed for session config')
  .context({
    session: sessionId,
    file: 'src/types/session.ts',
    line: 45,
  })
  .suggest('Check type definitions in src/types/')
  .suggest('Run: hack typecheck --fix')
  .docs('https://docs.hacky-hack.dev/errors/type-validation')
  .build();
```

### Timeline Entry
```typescript
timeline.add({
  timestamp: new Date(),
  level: 'error',
  taskId: 'P1.M1.T1.S2',
  event: 'Type validation failed',
  details: 'Expected string, got undefined',
});
```

### Resume Command
```typescript
const resumeCmd = new ResumeCommandBuilder(sessionId)
  .task('P1.M1.T1.S2')
  .withRetry()
  .withContext('type-fixes-applied')
  .withFlag('--verbose')
  .build();
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install figures date-fns
   ```

2. **Create error utilities directory**
   ```bash
   mkdir -p src/utils/errors
   ```

3. **Copy base classes from research**
   - ErrorBuilder (from doc 01)
   - TimelineTracker (from doc 02)
   - StackTraceFormatter (from doc 03)
   - RecommendationEngine (from doc 04)
   - ImpactAnalyzer (from doc 05)
   - ResumeCommandBuilder (from doc 06)

4. **Integrate into pipeline**
   - Import classes in `prp-pipeline.ts`
   - Track errors as they occur
   - Generate ERROR_REPORT.md on failure

5. **Test with real error**
   ```bash
   hack session create test-error-scenario
   hack run --session test-error-scenario
   # Trigger an error
   cat ERROR_REPORT.md
   ```

## Troubleshooting

### Colors not showing
- Check TTY detection: `process.stdout.isTTY`
- Force colors: `FORCE_COLOR=1`

### Stack traces too long
- Implement frame filtering (see doc 03)
- Collapse library frames by default

### Resume commands invalid
- Validate task IDs before generating
- Test commands in dry-run mode

### Timeline out of order
- Sort entries by timestamp before display
- Use consistent time format (ISO 8601)

## References

See individual research documents for detailed information:
- **Doc 01**: Error formatting and structure
- **Doc 02**: Timeline visualization
- **Doc 03**: Stack trace handling
- **Doc 04**: Fix suggestions and docs
- **Doc 05**: Dependency impact analysis
- **Doc 06**: Resume command patterns

---

**Last Updated**: 2025-01-24
**Version**: 1.0
