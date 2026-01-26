# Error Timeline Visualization Approaches

**Research Date:** 2025-01-24
**Focus:** Visualizing when errors occurred in time, chronological error displays

## Table of Contents
1. [Timeline Visualization Patterns](#timeline-visualization-patterns)
2. [Chronological Error Displays](#chronological-error-displays)
3. [Time-Based Error Grouping](#time-based-error-grouping)
4. [Progress Context Integration](#progress-context-integration)
5. [Implementation Examples](#implementation-examples)

---

## Timeline Visualization Patterns

### Pattern 1: Horizontal Timeline

```
Error Timeline (Session 003_b3d3efdaf0ed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10:00  ────────► 10:30  ────────► 11:00  ────────► 11:30
│                 │                 │                 │
├─ [10:05:23]    │                 │                 │
│  ✓ P1.M1 Setup complete         │                 │
│                                  │                 │
├─ [10:15:47]                      │                 │
│  ✗ P1.M1.T1.S2 Failed           │                 │
│  Error: Type validation failed   │                 │
│                                  │                 │
├──────────────────────────────────┤                 │
│  [10:22:15] Auto-retry #1        │                 │
│  ✗ Still failing                 │                 │
│                                  │                 │
├──────────────────────────────────────────────────┤
│  [11:02:33] Manual intervention                  │
│  → Fixed by: User                                │
│                                                  │
└──────────────────────────────────────────────────┘

Summary: 1 error over 1 hour timeline
```

**Advantages:**
- Shows temporal relationship clearly
- Easy to spot error clusters
- Visual gap for resolution time
- Natural left-to-right reading

### Pattern 2: Vertical Timeline

```
Error Timeline
═══════════════════════════════════════════════════════════
  2024-01-15
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  10:05:23  │  ✓  Phase 1.Milestone 1 completed
            │     Duration: 5m 23s

  10:15:47  │  ✗  Task P1.M1.T1.S2 failed
            │     Error: Type validation failed
            │     File: src/types/session.ts:45
            │
            │     ├─ 10:22:15  Retry #1 failed
            │     ├─ 10:28:42  Retry #2 failed
            │     └─ 10:35:18  Max retries exceeded
            │
            │     ⚠  Dependent tasks blocked:
            │        • P1.M1.T1.S3 (waiting 42m)
            │        • P1.M1.T2.S1 (waiting 42m)

  11:02:33  │  🔧  Manually resolved
            │     Fixed by: User intervention
            │     Resolution: Updated type definitions
            │
            │     → Continuing with P1.M1.T1.S3...

═══════════════════════════════════════════════════════════
Total Duration: 1 hour 2 minutes
Errors: 1 | Resolved: 1 | Pending: 0
```

**Advantages:**
- More space for details
- Easier to scroll on terminal
- Natural for log-style output
- Better for multiple related events

### Pattern 3: Compact Timeline

```
╔═══════════════════════════════════════════════════════════════╗
║ Error Timeline: Session 003_b3d3efdaf0ed                     ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║ 10:05 ✓  [P1.M1.T1.S1] Completed successfully                 ║
║ 10:15 ✗  [P1.M1.T1.S2] Type validation failed                 ║
║         ↳ 10:22 Retry #1 failed                              ║
║         ↳ 10:28 Retry #2 failed                              ║
║         ↳ 10:35 Max retries exceeded                         ║
║         ⚠  Blocking: P1.M1.T1.S3, P1.M1.T2.S1                ║
║ 11:02 ✓  [P1.M1.T1.S2] Resolved (manual intervention)        ║
║ 11:03 →  [P1.M1.T1.S3] Starting...                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Elapsed: 58m | Active: 1 task | Errors: 1 (1 resolved)
```

**Advantages:**
- Compact for CLI output
- Shows flow clearly
- Easy to parse visually
- Good for status overviews

---

## Chronological Error Displays

### Chronological Error Log Format

```typescript
interface TimelineEntry {
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'success';
  taskId: string;
  event: string;
  details?: string;
  relatedEvents?: TimelineEntry[];
}

interface ErrorTimeline {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  entries: TimelineEntry[];
}
```

### Display Implementation

```typescript
import chalk from 'chalk';
import { formatDistanceToNow } from 'date-fns';

class TimelineFormatter {
  format(timeline: ErrorTimeline): string {
    const lines: string[] = [];

    // Header
    lines.push(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════════╗'));
    lines.push(chalk.bold.cyan(`║ Error Timeline: Session ${timeline.sessionId.padEnd(35)} ║`));
    lines.push(chalk.bold.cyan('╠═══════════════════════════════════════════════════════════════╣'));
    lines.push(chalk.bold.cyan('║                                                               ║'));

    // Timeline entries
    for (const entry of timeline.entries) {
      lines.push(this.formatEntry(entry));
    }

    // Footer with summary
    lines.push(chalk.bold.cyan('║                                                               ║'));
    lines.push(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════════╝'));

    const summary = this.formatSummary(timeline);
    lines.push(`\nElapsed: ${summary.elapsed} | ${summary.stats}`);

    return lines.join('\n');
  }

  private formatEntry(entry: TimelineEntry): string {
    const time = chalk.gray(this.formatTime(entry.timestamp));
    const icon = this.getIcon(entry.level);
    const coloredIcon = this.colorIcon(icon, entry.level);
    const taskId = chalk.dim(`[${entry.taskId}]`);
    const event = this.colorText(entry.event, entry.level);

    let line = ` ${time} ${coloredIcon}  ${taskId} ${event}`;

    if (entry.details) {
      line += `\n        ${chalk.dim('↳')} ${entry.details}`;
    }

    if (entry.relatedEvents && entry.relatedEvents.length > 0) {
      for (const related of entry.relatedEvents) {
        const relTime = chalk.gray(this.formatTime(related.timestamp));
        const relIcon = this.colorIcon(this.getIcon(related.level), related.level);
        line += `\n        ${chalk.dim('├─')} ${relTime} ${relIcon} ${related.event}`;
      }
    }

    return `║ ${line.padEnd(62)} ║`;
  }

  private formatTime(timestamp: Date): string {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private getIcon(level: string): string {
    const icons = {
      error: '✗',
      warning: '⚠',
      info: 'ℹ',
      success: '✓',
    };
    return icons[level as keyof typeof icons] || '•';
  }

  private colorIcon(icon: string, level: string): string {
    const colors = {
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      success: chalk.green,
    };
    const colorFn = colors[level as keyof typeof colors] || chalk.white;
    return colorFn(icon);
  }

  private colorText(text: string, level: string): string {
    const colors = {
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      success: chalk.green,
    };
    const colorFn = colors[level as keyof typeof colors] || chalk.white;
    return colorFn(text);
  }

  private formatSummary(timeline: ErrorTimeline): {
    elapsed: string;
    stats: string;
  } {
    const endTime = timeline.endTime || new Date();
    const elapsed = formatDistanceToNow(timeline.startTime, { addSuffix: false });

    const errors = timeline.entries.filter(e => e.level === 'error').length;
    const resolved = timeline.entries.filter(e =>
      e.level === 'success' && e.event.includes('resolved')
    ).length;

    return {
      elapsed,
      stats: `Errors: ${errors} (${resolved} resolved)`,
    };
  }
}
```

---

## Time-Based Error Grouping

### Grouping Strategies

#### 1. By Phase

```
Error Timeline by Phase
═══════════════════════════════════════════════════════════

Phase 1: Foundation (10:00 - 11:15) ───────────────────────
  ✓ 10:05 [P1.M1.T1.S1] Environment setup complete
  ✗ 10:15 [P1.M1.T1.S2] Dependency conflict
     ↳ 10:22 Retry #1 failed
     ↳ 10:30 Resolved (updated package.json)
  ✓ 10:45 [P1.M1.T2.S1] Type definitions validated

Phase 2: Implementation (11:15 - 12:30) ───────────────────
  ✓ 11:20 [P2.M1.T1.S1] Core module initialized
  ✗ 11:45 [P2.M1.T2.S3] API integration timeout
     ⚠ Blocking: P2.M1.T3.S1, P2.M1.T3.S2
     → Resume command: hack resume --task P2.M1.T2.S3

Phase 3: Testing (12:30 - 13:45) ──────────────────────────
  (No errors)
```

#### 2. By Error Type

```
Error Timeline by Type
═══════════════════════════════════════════════════════════

Validation Errors (3) ─────────────────────────────────────
  10:15 [P1.M1.T1.S2] Type validation failed
  11:30 [P2.M1.T1.S2] Schema mismatch
  12:10 [P2.M2.T1.S1] PRD validation failed

Network Errors (2) ───────────────────────────────────────
  11:45 [P2.M1.T2.S3] API timeout (30s)
  12:25 [P2.M3.T1.S2] Connection refused

Dependency Errors (1) ─────────────────────────────────────
  10:15 [P1.M1.T1.S2] Package version conflict
```

#### 3. By Time Windows

```
Error Timeline (Hourly)
═══════════════════════════════════════════════════════════

10:00 - 11:00 (2 errors)
  10:15 ✗ Type validation failed
  10:30 ✗ Dependency conflict

11:00 - 12:00 (1 error)
  11:45 ✗ API timeout

12:00 - 13:00 (2 errors)
  12:10 ✗ Schema mismatch
  12:25 ✗ Connection refused
```

---

## Progress Context Integration

### Timeline with Progress Bars

```
Error Timeline with Progress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: Foundation ██████████████████████ 100% (4/4 tasks)
  ✓ [10:05] P1.M1.T1.S1 Environment setup (2m)
  ✗ [10:15] P1.M1.T1.S2 Type validation
     ↳ [10:22] Retry #1 failed
     ↳ [10:30] Resolved manually
  ✓ [10:35] P1.M1.T2.S1 Core types (5m)
  ✓ [10:45] P1.M1.T2.S2 Config loader (3m)

Phase 2: Implementation ██████████████░░░░ 60% (3/5 tasks)
  ✓ [11:00] P2.M1.T1.S1 Module init (3m)
  ✓ [11:10] P2.M1.T1.S2 Data layer (8m)
  ✗ [11:25] P2.M1.T2.S3 API integration
     ✗ Error: Request timeout after 30s
     ⚠ Blocking: P2.M1.T3.S1, P2.M1.T3.S2
     → Run: hack resume --task P2.M1.T2.S3 --force

Phase 3: Testing ░░░░░░░░░░░░░░░░░░░░░░░ 0% (0/3 tasks)
  (Blocked by Phase 2 error)
```

### Timeline with Execution Flow

```
Error Timeline with Execution Flow
═══════════════════════════════════════════════════════════

Session: 003_b3d3efdaf0ed
Started: 10:00:00 | Current: 11:25:32 | Elapsed: 1h 25m

Timeline:
═══════════════════════════════════════════════════════════

10:00  Starting pipeline
       ├─→ [10:00:15] Loading configuration ✓
       ├─→ [10:00:22] Validating environment ✓
       └─→ [10:00:35] Initializing tasks ✓

10:05  Phase 1: Foundation
       ├─→ [10:05:10] P1.M1: Setup ✓ (5m)
       │   ├─→ [10:05:15] T1.S1: Environment ✓ (2m)
       │   ├─→ [10:07:30] T1.S2: Types ✗ FAILED
       │   │   ├─→ [10:15:22] Retry #1 ✗
       │   │   ├─→ [10:22:45] Retry #2 ✗
       │   │   └─→ [10:30:00] Manual fix ✓
       │   └─→ [10:35:15] T2.S1: Config ✓ (5m)
       └─→ [10:45:30] P1.M2: Validation ✓ (10m)

11:00  Phase 2: Implementation
       ├─→ [11:00:10] P2.M1: Core Module (in progress)
       │   ├─→ [11:00:15] T1.S1: Init ✓ (3m)
       │   ├─→ [11:10:30] T1.S2: Data Layer ✓ (8m)
       │   └─→ [11:25:32] T2.S3: API Integration ✗ FAILED
       │       └─→ [11:25:32] Request timeout
       │           ⚠ Blocking: P2.M1.T3.S1, P2.M1.T3.S2
       │           → Resume: hack resume --task P2.M1.T2.S3
       └─→ [11:??] P2.M2: Testing (blocked)

═══════════════════════════════════════════════════════════
Status: PAUSED (error detected) | Errors: 2 | Resolved: 1
```

---

## Implementation Examples

### TypeScript Implementation

```typescript
import chalk from 'chalk';
import cliProgress from 'cli-progress';

interface TimelineError {
  timestamp: Date;
  taskId: string;
  error: string;
  retries?: Array<{
    timestamp: Date;
    attempt: number;
    result: 'failed' | 'success';
  }>;
  resolution?: {
    type: 'manual' | 'auto';
    timestamp: Date;
    details: string;
  };
  blockedTasks?: string[];
  resumeCommand?: string;
}

interface TimelinePhase {
  phaseId: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  errors: TimelineError[];
}

class ErrorTimelineFormatter {
  private multibar: cliProgress.MultiBar;

  constructor() {
    this.multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: '{phase} {bar} {percentage}% | {status}',
    }, cliProgress.Presets.shades_grey);
  }

  formatTimeline(phases: TimelinePhase[]): string {
    const lines: string[] = [];

    lines.push(chalk.bold.cyan('\nError Timeline'));
    lines.push(chalk.gray('═'.repeat(60)));

    for (const phase of phases) {
      lines.push(this.formatPhase(phase));
    }

    return lines.join('\n');
  }

  private formatPhase(phase: TimelinePhase): string {
    const lines: string[] = [];

    const duration = this.calculateDuration(phase.startTime, phase.endTime);
    const status = phase.endTime ? 'complete' : 'in progress';
    const statusColor = status === 'complete' ? chalk.green : chalk.yellow;

    lines.push(
      `\n${chalk.bold(phase.phaseId)}: ${phase.name} ` +
      statusColor(`(${duration})`)
    );

    for (const error of phase.errors) {
      lines.push(this.formatError(error, phase.phaseId));
    }

    return lines.join('\n');
  }

  private formatError(error: TimelineError, phaseId: string): string {
    const lines: string[] = [];

    const time = chalk.gray(this.formatTimestamp(error.timestamp));
    const icon = chalk.red('✗');
    const task = chalk.dim(`[${error.taskId}]`);

    lines.push(`  ${time} ${icon} ${task} ${error.error}`);

    // Show retries
    if (error.retries && error.retries.length > 0) {
      for (const retry of error.retries) {
        const retryTime = chalk.gray(this.formatTimestamp(retry.timestamp));
        const retryIcon = retry.result === 'failed'
          ? chalk.red('✗')
          : chalk.green('✓');
        lines.push(
          `       ${chalk.dim('↳')} ${retryTime} Retry #${retry.attempt} ${retryIcon}`
        );
      }
    }

    // Show resolution
    if (error.resolution) {
      const resTime = chalk.gray(this.formatTimestamp(error.resolution.timestamp));
      const resIcon = chalk.green('✓');
      const resType = error.resolution.type === 'manual'
        ? chalk.yellow('(manual)')
        : chalk.cyan('(auto)');
      lines.push(
        `       ${chalk.dim('↳')} ${resTime} Resolved ${resType}: ${error.resolution.details}`
      );
    }

    // Show blocked tasks
    if (error.blockedTasks && error.blockedTasks.length > 0) {
      lines.push(
        `       ${chalk.yellow('⚠')} Blocking: ${error.blockedTasks.join(', ')}`
      );
    }

    // Show resume command
    if (error.resumeCommand) {
      lines.push(
        `       ${chalk.dim('→')} ${chalk.cyan(error.resumeCommand)}`
      );
    }

    return lines.join('\n');
  }

  private formatTimestamp(timestamp: Date): string {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private calculateDuration(start: Date, end?: Date): string {
    const endTime = end || new Date();
    const diff = endTime.getTime() - start.getTime();

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}

// Usage
const formatter = new ErrorTimelineFormatter();

const timeline: TimelinePhase[] = [
  {
    phaseId: 'P1',
    name: 'Foundation',
    startTime: new Date('2024-01-15T10:00:00'),
    endTime: new Date('2024-01-15T10:45:00'),
    errors: [
      {
        timestamp: new Date('2024-01-15T10:15:00'),
        taskId: 'P1.M1.T1.S2',
        error: 'Type validation failed',
        retries: [
          {
            timestamp: new Date('2024-01-15T10:22:00'),
            attempt: 1,
            result: 'failed',
          },
          {
            timestamp: new Date('2024-01-15T10:30:00'),
            attempt: 2,
            result: 'failed',
          },
        ],
        resolution: {
          type: 'manual',
          timestamp: new Date('2024-01-15T10:30:00'),
          details: 'Updated type definitions',
        },
      },
    ],
  },
];

console.log(formatter.formatTimeline(timeline));
```

---

## Best Practices

### DO:
- Show relative times (e.g., "5 minutes ago")
- Use consistent time formatting
- Indicate retry attempts clearly
- Show resolution time for errors
- Link related events visually
- Provide context on blocking effects
- Include resume commands for unresolved errors

### DON'T:
- Use raw timestamps alone
- Clutter with successful operations
- Hide retry information
- Omit time duration for errors
- Forget timezone information
- Mix time formats in same display
- Show millisecond precision unless debugging

---

## Related Libraries

- `date-fns` - Date formatting and manipulation
- `cli-progress` - Progress bar visualization
- `chalk` - Terminal colors
- `ora` - Spinner animations
- `moment` - Alternative to date-fns (larger bundle)

---

## References

- **GitHub Actions Timeline UI**: https://github.com/features/actions
- **Jenkins Build Timeline**: https://www.jenkins.io/
- **GitLab Pipeline Visualization**: https://docs.gitlab.com/ee/ci/pipelines/
- **AWS CodeBuild Logs**: https://aws.amazon.com/codebuild/
