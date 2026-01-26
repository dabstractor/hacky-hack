# Identifying Affected Tasks and Dependencies

**Research Date:** 2025-01-24
**Focus:** How to identify and display affected tasks, blocked operations, and dependency chains

## Table of Contents

1. [Dependency Graph Analysis](#dependency-graph-analysis)
2. [Task Impact Assessment](#task-impact-assessment)
3. [Visualizing Blocked Work](#visualizing-blocked-work)
4. [Cascade Effect Tracking](#cascade-effect-tracking)
5. [Implementation Examples](#implementation-examples)

---

## Dependency Graph Analysis

### Dependency Types

```
Direct Dependencies
  ├─ Parent Task
  ├─ Child Task (subtask)
  └─ Sibling Task (parallel)

Indirect Dependencies
  ├─ Upstream (prerequisites)
  ├─ Downstream (dependents)
  └─ Cross-branch dependencies

Soft Dependencies
  ├─ Logical ordering (should run after)
  ├─ Resource sharing (conflicts)
  └─ Best practices (conventions)
```

### Graph Representation

```typescript
interface TaskNode {
  id: string;
  title: string;
  status: Status;
  dependencies: {
    direct: string[]; // Task IDs this task directly depends on
    dependents: string[]; // Task IDs that depend on this task
    blocked: string[]; // Tasks blocked by this task's failure
  };
}

interface DependencyGraph {
  nodes: Map<string, TaskNode>;
  edges: Array<{
    from: string;
    to: string;
    type: 'hard' | 'soft';
  }>;
}
```

### Graph Traversal Algorithms

```typescript
class DependencyAnalyzer {
  // Find all downstream tasks (dependents)
  findDownstream(taskId: string, graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const downstream: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = graph.nodes.get(id);
      if (!node) return;

      for (const dependent of node.dependencies.dependents) {
        downstream.push(dependent);
        traverse(dependent);
      }
    };

    traverse(taskId);
    return downstream;
  }

  // Find all upstream tasks (prerequisites)
  findUpstream(taskId: string, graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const upstream: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = graph.nodes.get(id);
      if (!node) return;

      for (const dep of node.dependencies.direct) {
        upstream.push(dep);
        traverse(dep);
      }
    };

    traverse(taskId);
    return upstream;
  }

  // Find all tasks in the same branch
  findSiblings(taskId: string, graph: DependencyGraph): string[] {
    const node = graph.nodes.get(taskId);
    if (!node) return [];

    // Extract parent task ID from child ID
    const parts = taskId.split('.');
    parts.pop(); // Remove subtask part
    const parentId = parts.join('.');

    const siblings: string[] = [];
    for (const [id, otherNode] of graph.nodes) {
      if (id !== taskId && id.startsWith(parentId + '.')) {
        siblings.push(id);
      }
    }

    return siblings;
  }

  // Check if task is blocking others
  isBlocking(taskId: string, graph: DependencyGraph): boolean {
    const node = graph.nodes.get(taskId);
    return node ? node.dependencies.dependents.length > 0 : false;
  }

  // Find critical path (longest dependency chain)
  findCriticalPath(graph: DependencyGraph): string[] {
    const memo = new Map<string, number>();

    const longestPath = (id: string): number => {
      if (memo.has(id)) return memo.get(id)!;

      const node = graph.nodes.get(id);
      if (!node || node.dependencies.direct.length === 0) {
        memo.set(id, 0);
        return 0;
      }

      let maxDepth = 0;
      for (const dep of node.dependencies.direct) {
        maxDepth = Math.max(maxDepth, longestPath(dep));
      }

      memo.set(id, maxDepth + 1);
      return maxDepth + 1;
    };

    // Find node with maximum depth
    let maxDepth = 0;
    let criticalNode = '';

    for (const [id] of graph.nodes) {
      const depth = longestPath(id);
      if (depth > maxDepth) {
        maxDepth = depth;
        criticalNode = id;
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current = criticalNode;
    while (current) {
      path.unshift(current);
      const node = graph.nodes.get(current);
      if (!node || node.dependencies.direct.length === 0) break;

      // Find parent with maximum depth
      let maxParentDepth = -1;
      let parent = '';
      for (const dep of node.dependencies.direct) {
        const depth = longestPath(dep);
        if (depth > maxParentDepth) {
          maxParentDepth = depth;
          parent = dep;
        }
      }
      current = parent;
    }

    return path;
  }
}
```

---

## Task Impact Assessment

### Impact Levels

```typescript
enum ImpactLevel {
  CRITICAL = 'critical', // Blocks entire pipeline
  HIGH = 'high', // Blocks multiple phases
  MEDIUM = 'medium', // Blocks single phase
  LOW = 'low', // Blocks single task
  NONE = 'none', // No impact
}

interface TaskImpact {
  level: ImpactLevel;
  affectedTasks: string[];
  blockedPhases: string[];
  blockedMilestones: string[];
  blockedTasks: string[];
  canContinue: boolean;
  suggestedAction: 'pause' | 'retry' | 'skip' | 'continue';
}
```

### Impact Calculation

```typescript
class ImpactCalculator {
  calculate(failedTaskId: string, graph: DependencyGraph): TaskImpact {
    const downstream = this.findDownstream(failedTaskId, graph);

    // Group by hierarchy level
    const blockedPhases = new Set<string>();
    const blockedMilestones = new Set<string>();
    const blockedTasks = new Set<string>();

    for (const taskId of downstream) {
      const parts = taskId.split('.');

      // Phase level
      blockedPhases.add(parts[0]);

      // Milestone level
      if (parts.length >= 2) {
        blockedMilestones.add(`${parts[0]}.${parts[1]}`);
      }

      // Task level
      blockedTasks.add(taskId);
    }

    // Determine impact level
    const level = this.determineImpactLevel(
      blockedPhases.size,
      blockedMilestones.size,
      blockedTasks.size
    );

    // Determine if pipeline can continue
    const canContinue = this.canContinueWithFailure(failedTaskId, graph);

    // Suggest action based on impact
    const suggestedAction = this.suggestAction(level, canContinue);

    return {
      level,
      affectedTasks: downstream,
      blockedPhases: Array.from(blockedPhases),
      blockedMilestones: Array.from(blockedMilestones),
      blockedTasks: Array.from(blockedTasks),
      canContinue,
      suggestedAction,
    };
  }

  private determineImpactLevel(
    phases: number,
    milestones: number,
    tasks: number
  ): ImpactLevel {
    if (phases >= 2) return ImpactLevel.CRITICAL;
    if (phases === 1 || milestones >= 3) return ImpactLevel.HIGH;
    if (milestones >= 1 || tasks >= 5) return ImpactLevel.MEDIUM;
    if (tasks >= 1) return ImpactLevel.LOW;
    return ImpactLevel.NONE;
  }

  private canContinueWithFailure(
    failedTaskId: string,
    graph: DependencyGraph
  ): boolean {
    // Check if there are any tasks that don't depend on this one
    for (const [id, node] of graph.nodes) {
      if (id === failedTaskId) continue;

      // Check if this task or any of its dependencies are the failed task
      const upstream = this.findUpstream(id, graph);
      if (!upstream.includes(failedTaskId)) {
        return true;
      }
    }

    return false;
  }

  private suggestAction(
    level: ImpactLevel,
    canContinue: boolean
  ): 'pause' | 'retry' | 'skip' | 'continue' {
    if (level === ImpactLevel.CRITICAL) return 'pause';
    if (level === ImpactLevel.HIGH) return 'pause';
    if (canContinue) return 'continue';
    return 'retry';
  }

  private findDownstream(taskId: string, graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const downstream: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = graph.nodes.get(id);
      if (!node) return;

      for (const dependent of node.dependencies.dependents) {
        downstream.push(dependent);
        traverse(dependent);
      }
    };

    traverse(taskId);
    return downstream;
  }

  private findUpstream(taskId: string, graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const upstream: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = graph.nodes.get(id);
      if (!node) return;

      for (const dep of node.dependencies.direct) {
        upstream.push(dep);
        traverse(dep);
      }
    };

    traverse(taskId);
    return upstream;
  }
}
```

---

## Visualizing Blocked Work

### Visualization 1: Tree View

```
Error Impact Analysis
═══════════════════════════════════════════════════════════════════════════

Failed Task: P1.M1.T1.S2 (Type validation failed)
Impact Level: 🔴 CRITICAL

Blocked Work Tree:
───────────────────────────────────────────────────────────────────────────

Phase 1: Foundation
│
├─ Milestone 1: Setup
│  │
│  ├─ Task 1: Environment Setup
│  │  ├─ ✓ Subtask 1 (Complete)
│  │  └─ ✗ Subtask 2 (FAILED) ← ERROR HERE
│  │
│  └─ Task 2: Configuration
│     ├─ ⏸ Subtask 1 (Blocked by P1.M1.T1.S2)
│     └─ ⏸ Subtask 2 (Blocked by P1.M1.T1.S2)
│
└─ Milestone 2: Validation
   │
   ├─ Task 1: Type Checking
   │  ├─ ⏸ Subtask 1 (Blocked by P1.M1.T1.S2)
   │  └─ ⏸ Subtask 2 (Blocked by P1.M1.T1.S2)
   │
   └─ Task 2: Schema Validation
      ├─ ⏸ Subtask 1 (Blocked by P1.M1.T1.S2)
      └─ ⏸ Subtask 2 (Blocked by P1.M1.T1.S2)

Legend:
  ✓ Complete  ✗ Failed  ◐ In Progress  ⏸ Blocked  ○ Pending

═══════════════════════════════════════════════════════════════════════════
Total Affected: 6 subtasks across 2 milestones
Suggested Action: PAUSE and resolve before continuing
Resume Command: hack resume --task P1.M1.T1.S2
```

### Visualization 2: Dependency Graph

```
Error Impact: Dependency Graph View
═══════════════════════════════════════════════════════════════════════════

                            P1.M1.T1.S2
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
                  ▼              ▼              ▼
            P1.M1.T1.S3    P1.M1.T2.S1    P1.M2.T1.S1
                  │              │              │
                  ├──────┬───────┤              │
                  │      │       │              │
                  ▼      ▼       ▼              ▼
            P1.M1.T1.S4  P1.M1.T2.S2  P1.M2.T1.S2
                                               │
                                               ▼
                                         P1.M2.T2.S1

Failed Task: P1.M1.T1.S2 (✗)
Directly Blocked: P1.M1.T1.S3, P1.M1.T2.S1, P1.M2.T1.S1 (3 tasks)
Indirectly Blocked: P1.M1.T1.S4, P1.M1.T2.S2, P1.M2.T1.S2, P1.M2.T2.S1 (4 tasks)

Critical Path: P1.M1.T1.S2 → P1.M2.T1.S1 → P1.M2.T1.S2 → P1.M2.T2.S1

═══════════════════════════════════════════════════════════════════════════
Impact Summary:
  • 1/7 tasks complete (14%)
  • 7 tasks blocked by this failure
  • 2 milestones cannot start
  • Entire Phase 1 blocked
```

### Visualization 3: Cascade View

```
Error Cascade Analysis
═══════════════════════════════════════════════════════════════════════════

Initial Failure: P1.M1.T1.S2 at 10:15:23
Error: Type validation failed

Cascade Effects:
───────────────────────────────────────────────────────────────────────────

Tier 1 (Direct Impact - Immediate)
  ├─ P1.M1.T1.S3: Configuration loader
  │  Status: ⏸ Blocked (cannot start)
  │  Wait Time: 42 minutes
  │  Impact: Cannot load session configuration
  │
  ├─ P1.M1.T2.S1: Type definitions
  │  Status: ⏸ Blocked (missing dependencies)
  │  Wait Time: 42 minutes
  │  Impact: Cannot validate TypeScript types
  │
  └─ P1.M2.T1.S1: Schema validation
     Status: ⏸ Blocked (missing type system)
     Wait Time: 42 minutes
     Impact: Cannot validate PRD schemas

Tier 2 (Indirect Impact - Secondary)
  ├─ P1.M1.T1.S4: Environment validation
  │  Status: ⏸ Blocked (waiting for P1.M1.T1.S3)
  │  Wait Time: 35 minutes
  │
  ├─ P1.M1.T2.S2: Schema generator
  │  Status: ⏸ Blocked (waiting for P1.M1.T2.S1)
  │  Wait Time: 35 minutes
  │
  └─ P1.M2.T1.S2: PRD validator
     Status: ⏸ Blocked (waiting for P1.M2.T1.S1)
     Wait Time: 35 minutes

Tier 3 (Downstream Impact - Delayed)
  └─ P1.M2.T2.S1: Integration tests
     Status: ⏸ Blocked (waiting for P1.M2.T1.S2)
     Wait Time: 28 minutes

═══════════════════════════════════════════════════════════════════════════
Total Wasted Time: 42 minutes (continuing to accrue)
Estimated Delay to Completion: +2.5 hours
Suggested Action: Resolve P1.M1.T1.S2 immediately
```

---

## Cascade Effect Tracking

### Cascade Tracker

```typescript
interface CascadeNode {
  taskId: string;
  tier: number;
  waitTime: number; // in milliseconds
  blockedReason: string;
}

class CascadeTracker {
  private cascadeStart: Date;
  private cascadeNodes: Map<string, CascadeNode>;

  constructor(initialFailure: string) {
    this.cascadeStart = new Date();
    this.cascadeNodes = new Map();

    // Add initial failure as tier 0
    this.cascadeNodes.set(initialFailure, {
      taskId: initialFailure,
      tier: 0,
      waitTime: 0,
      blockedReason: 'Initial failure',
    });
  }

  trackBlockedTask(taskId: string, blocker: string): void {
    const blockerNode = this.cascadeNodes.get(blocker);
    if (!blockerNode) {
      throw new Error(`Blocker ${blocker} not found in cascade`);
    }

    const waitTime = Date.now() - this.cascadeStart.getTime();

    this.cascadeNodes.set(taskId, {
      taskId,
      tier: blockerNode.tier + 1,
      waitTime,
      blockedReason: `Blocked by ${blocker}`,
    });
  }

  getCascadeImpact(): {
    totalBlockedTasks: number;
    totalWaitTime: number;
    tiers: Map<number, string[]>;
    longestCascade: number;
  } {
    let totalWaitTime = 0;
    const tiers = new Map<number, string[]>();
    let longestCascade = 0;

    for (const node of this.cascadeNodes.values()) {
      if (node.tier > 0) {
        totalWaitTime += node.waitTime;
      }

      if (!tiers.has(node.tier)) {
        tiers.set(node.tier, []);
      }
      tiers.get(node.tier)!.push(node.taskId);

      longestCascade = Math.max(longestCascade, node.tier);
    }

    return {
      totalBlockedTasks: this.cascadeNodes.size - 1, // Exclude initial failure
      totalWaitTime,
      tiers,
      longestCascade,
    };
  }

  formatCascadeReport(): string {
    const impact = this.getCascadeImpact();
    const lines: string[] = [];

    lines.push('Cascade Effect Report');
    lines.push('═'.repeat(80));
    lines.push('');

    // Summary
    lines.push(
      `Initial Failure: ${Array.from(this.cascadeNodes.values()).find(n => n.tier === 0)?.taskId}`
    );
    lines.push(`Total Blocked Tasks: ${impact.totalBlockedTasks}`);
    lines.push(
      `Total Wasted Time: ${this.formatDuration(impact.totalWaitTime)}`
    );
    lines.push(`Cascade Depth: ${impact.longestCascade} tiers`);
    lines.push('');

    // Tier-by-tier breakdown
    for (let tier = 1; tier <= impact.longestCascade; tier++) {
      const tasks = impact.tiers.get(tier);
      if (!tasks || tasks.length === 0) continue;

      lines.push(`Tier ${tier} (${tasks.length} tasks):`);
      for (const task of tasks) {
        const node = this.cascadeNodes.get(task)!;
        lines.push(
          `  • ${task} (blocked for ${this.formatDuration(node.waitTime)})`
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
}
```

---

## Implementation Examples

### Complete Impact Display System

```typescript
import chalk from 'chalk';
import Table from 'cli-table3';

interface ImpactDisplayOptions {
  showCascade?: boolean;
  showGraph?: boolean;
  showTree?: boolean;
  verbose?: boolean;
}

class ImpactDisplayFormatter {
  private analyzer: DependencyAnalyzer;
  private calculator: ImpactCalculator;

  constructor() {
    this.analyzer = new DependencyAnalyzer();
    this.calculator = new ImpactCalculator();
  }

  formatImpact(
    failedTaskId: string,
    graph: DependencyGraph,
    options: ImpactDisplayOptions = {}
  ): string {
    const {
      showCascade = true,
      showGraph = false,
      showTree = true,
      verbose = false,
    } = options;

    const impact = this.calculator.calculate(failedTaskId, graph);
    const lines: string[] = [];

    // Header
    lines.push(this.formatHeader(failedTaskId, impact));

    // Tree view
    if (showTree) {
      lines.push('');
      lines.push(this.formatTreeImpact(failedTaskId, graph, impact));
    }

    // Cascade view
    if (showCascade) {
      lines.push('');
      lines.push(this.formatCascadeImpact(failedTaskId, graph, impact));
    }

    // Graph view
    if (showGraph) {
      lines.push('');
      lines.push(this.formatGraphImpact(failedTaskId, graph, impact));
    }

    // Summary
    lines.push('');
    lines.push(this.formatSummary(impact));

    return lines.join('\n');
  }

  private formatHeader(taskId: string, impact: TaskImpact): string {
    const levelColor = {
      critical: chalk.red.bold,
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.yellow,
      none: chalk.green,
    };

    const levelIcon = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      none: '🟢',
    };

    const lines = [
      chalk.bold('Error Impact Analysis'),
      chalk.gray('═'.repeat(80)),
      '',
      `${chalk.bold('Failed Task:')} ${chalk.red(taskId)}`,
      `${chalk.bold('Impact Level:')} ${levelIcon[impact.level]} ${levelColor[impact.level](impact.level.toUpperCase())}`,
    ];

    return lines.join('\n');
  }

  private formatTreeImpact(
    failedTaskId: string,
    graph: DependencyGraph,
    impact: TaskImpact
  ): string {
    const lines: string[] = [];

    lines.push(chalk.bold('Blocked Work Tree:'));
    lines.push(chalk.gray('─'.repeat(80)));
    lines.push('');

    // Get task hierarchy
    const failedTask = graph.nodes.get(failedTaskId);
    if (!failedTask) return '';

    // Build tree structure (simplified example)
    for (const phaseId of impact.blockedPhases) {
      lines.push(`Phase ${phaseId}:`);
      lines.push(`│`);

      for (const milestoneId of impact.blockedMilestones) {
        if (!milestoneId.startsWith(phaseId)) continue;

        lines.push(`├─ Milestone ${milestoneId.split('.')[1]}:`);
        lines.push(`│  │`);

        for (const taskId of impact.blockedTasks) {
          if (!taskId.startsWith(milestoneId)) continue;

          const status = chalk.yellow('⏸ Blocked');
          const reason = chalk.dim(`(Blocked by ${failedTaskId})`);
          lines.push(`│  ├─ Task ${taskId.split('.')[2]} ${status} ${reason}`);
        }
      }
    }

    return lines.join('\n');
  }

  private formatCascadeImpact(
    failedTaskId: string,
    graph: DependencyGraph,
    impact: TaskImpact
  ): string {
    const tracker = new CascadeTracker(failedTaskId);

    // Track all blocked tasks
    for (const taskId of impact.affectedTasks) {
      tracker.trackBlockedTask(taskId, failedTaskId);
    }

    return tracker.formatCascadeReport();
  }

  private formatGraphImpact(
    failedTaskId: string,
    graph: DependencyGraph,
    impact: TaskImpact
  ): string {
    const lines: string[] = [];

    lines.push(chalk.bold('Dependency Graph:'));
    lines.push(chalk.gray('─'.repeat(80)));
    lines.push('');
    lines.push(chalk.red.bold(failedTaskId));
    lines.push('     │');

    // Show direct dependents
    const failedTask = graph.nodes.get(failedTaskId);
    if (!failedTask) return '';

    const direct = failedTask.dependencies.dependents.slice(0, 3);
    for (let i = 0; i < direct.length; i++) {
      const isLast = i === direct.length - 1;
      const connector = isLast ? '└─' : '├─';
      lines.push(`     ${connector} ${chalk.yellow(direct[i])}`);
    }

    if (failedTask.dependencies.dependents.length > 3) {
      lines.push(
        `     └─ ${chalk.dim(`+${failedTask.dependencies.dependents.length - 3} more`)}`
      );
    }

    lines.push('');
    lines.push(
      `Directly Blocked: ${failedTask.dependencies.dependents.length} tasks`
    );
    lines.push(`Indirectly Blocked: ${impact.affectedTasks.length} tasks`);

    return lines.join('\n');
  }

  private formatSummary(impact: TaskImpact): string {
    const table = new Table({
      colWidths: [30, 50],
      chars: {
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
      },
    });

    table.push(
      [
        chalk.bold('Affected Phases'),
        impact.blockedPhases.join(', ') || 'None',
      ],
      [
        chalk.bold('Affected Milestones'),
        impact.blockedMilestones.length.toString(),
      ],
      [chalk.bold('Blocked Tasks'), impact.blockedTasks.length.toString()],
      [
        chalk.bold('Can Continue'),
        impact.canContinue ? chalk.green('Yes') : chalk.red('No'),
      ],
      [
        chalk.bold('Suggested Action'),
        chalk.yellow(impact.suggestedAction.toUpperCase()),
      ]
    );

    return table.toString();
  }
}
```

---

## Best Practices

### DO:

- Show the complete dependency chain
- Highlight critical path tasks
- Display wait times for blocked tasks
- Provide visual hierarchy (phases > milestones > tasks)
- Use color to indicate severity
- Show both direct and indirect impacts
- Include resume commands for unblocking
- Calculate wasted time/effort

### DON'T:

- Show only immediate dependencies
- Ignore soft dependencies
- Overwhelm with too much detail
- Use unclear visual indicators
- Forget to show alternative paths
- Hide the scope of impact
- Neglect to show actionable next steps
- Assume all dependencies are equal

---

## Related Libraries

- `graphlib` - Graph data structures and algorithms
- `dagre` - Directed graph layout
- `cli-tree` - Tree visualization for CLI
- `asciitree` - ASCII tree generator
- `chalk` - Terminal colors

---

## References

- **Dependency Management**: https://martinfowler.com/articles/break-monolith.html
- **Critical Path Method**: https://en.wikipedia.org/wiki/Critical_path_method
- **Graph Algorithms**: https://github.com/tgdwyer/WebGraphAlgorithms
- **Task Scheduling**: https://en.wikipedia.org/wiki/Task_parallelism
