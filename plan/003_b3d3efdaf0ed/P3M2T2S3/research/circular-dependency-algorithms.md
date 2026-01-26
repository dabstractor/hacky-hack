# Circular Dependency Detection Algorithms

## Research Date

2026-01-24

## Purpose

Document circular dependency detection algorithms for implementing `prd validate-state`.

---

## 1. Three-Color DFS Algorithm (Recommended)

### Concept

Mark nodes during DFS traversal:

- **WHITE** (0): Unvisited node
- **GRAY** (1): Currently visiting (in recursion stack)
- **BLACK** (2): Completely visited

**Cycle exists if we encounter a GRAY node during traversal.**

### TypeScript Implementation

```typescript
enum NodeColor {
  WHITE = 0, // Unvisited
  GRAY = 1, // In progress
  BLACK = 2, // Completed
}

interface DependencyGraph {
  [taskId: string]: string[]; // taskId -> dependencies
}

interface CycleDetectionResult {
  hasCycle: boolean;
  cycle?: string[];
}

function detectCircularDependencies(
  graph: DependencyGraph
): CycleDetectionResult {
  const color: { [key: string]: NodeColor } = {};
  const parent: { [key: string]: string | null } = {};

  // Initialize all nodes as WHITE
  for (const node in graph) {
    color[node] = NodeColor.WHITE;
    for (const neighbor of graph[node]) {
      if (!(neighbor in color)) {
        color[neighbor] = NodeColor.WHITE;
      }
    }
  }

  // Reconstruct cycle path
  const reconstructCycle = (start: string, end: string): string[] => {
    const cycle: string[] = [end];
    let current = start;
    while (current !== end) {
      cycle.push(current);
      const prev = parent[current];
      if (prev === null) break;
      current = prev;
    }
    cycle.push(end);
    return cycle.reverse();
  };

  // DFS function
  const dfs = (node: string): CycleDetectionResult => {
    color[node] = NodeColor.GRAY;

    for (const neighbor of graph[node] || []) {
      if (color[neighbor] === NodeColor.GRAY) {
        // Cycle detected
        return {
          hasCycle: true,
          cycle: reconstructCycle(node, neighbor),
        };
      }

      if (color[neighbor] === NodeColor.WHITE) {
        parent[neighbor] = node;
        const result = dfs(neighbor);
        if (result.hasCycle) {
          return result;
        }
      }
    }

    color[node] = NodeColor.BLACK;
    return { hasCycle: false };
  };

  // Check all nodes (handle disconnected graphs)
  for (const node in color) {
    if (color[node] === NodeColor.WHITE) {
      parent[node] = null;
      const result = dfs(node);
      if (result.hasCycle) {
        return result;
      }
    }
  }

  return { hasCycle: false };
}
```

### Complexity

- **Time**: O(V + E) - Each vertex and edge visited once
- **Space**: O(V) - For color array, parent tracking, recursion stack

### Edge Cases

1. **Disconnected graphs**: Must start DFS from all unvisited nodes
2. **Self-loops**: Node depending on itself (A -> A)
3. **Empty graph**: Return `{ hasCycle: false }`
4. **Single node**: Valid (no cycle unless self-loop)

---

## 2. Kahn's Algorithm (Topological Sort)

### Concept

Repeatedly remove nodes with zero in-degree. If all nodes removed → DAG. If nodes remain → cycles.

### TypeScript Implementation

```typescript
interface KahnResult {
  isDAG: boolean;
  topologicalOrder?: string[];
  cycleNodes?: string[];
}

function kahnCycleDetection(graph: DependencyGraph): KahnResult {
  // Calculate in-degree for all nodes
  const inDegree: { [key: string]: number } = {};
  const allNodes = new Set<string>();

  // Collect all nodes and initialize in-degrees
  for (const node in graph) {
    allNodes.add(node);
    inDegree[node] = inDegree[node] || 0;

    for (const neighbor of graph[node]) {
      allNodes.add(neighbor);
      inDegree[neighbor] = (inDegree[neighbor] || 0) + 1;
    }
  }

  // Initialize queue with zero in-degree nodes
  const queue: string[] = [];
  for (const node of allNodes) {
    if (inDegree[node] === 0) {
      queue.push(node);
    }
  }

  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    topologicalOrder.push(node);

    // Reduce in-degree for neighbors
    for (const neighbor of graph[node] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check for cycles
  if (topologicalOrder.length !== allNodes.size) {
    // Nodes remaining are in cycles
    const cycleNodes = allNodes
      .values()
      .filter(id => !topologicalOrder.includes(id));
    return {
      isDAG: false,
      cycleNodes: Array.from(cycleNodes),
    };
  }

  return {
    isDAG: true,
    topologicalOrder,
  };
}
```

### Complexity

- **Time**: O(V + E)
- **Space**: O(V)

### Advantages

- Non-recursive (no stack overflow)
- Produces topological order
- Good for large graphs

---

## 3. Orphaned Dependency Detection

### Concept

Find dependencies that reference non-existent tasks.

### TypeScript Implementation

```typescript
interface OrphanDetectionResult {
  hasOrphans: boolean;
  orphans: { taskId: string; missingDep: string }[];
}

function detectOrphanedDependencies(
  graph: DependencyGraph,
  allTaskIds: Set<string>
): OrphanDetectionResult {
  const orphans: { taskId: string; missingDep: string }[] = [];

  for (const taskId in graph) {
    for (const depId of graph[taskId]) {
      if (!allTaskIds.has(depId)) {
        orphans.push({ taskId, missingDep: depId });
      }
    }
  }

  return {
    hasOrphans: orphans.length > 0,
    orphans,
  };
}
```

---

## 4. Status Consistency Validation

### Concept

Parent tasks should not be Complete if children are incomplete.

### TypeScript Implementation

```typescript
interface StatusConsistencyResult {
  isConsistent: boolean;
  inconsistencies: {
    itemId: string;
    issue: string;
  }[];
}

function validateStatusConsistency(backlog: Backlog): StatusConsistencyResult {
  const inconsistencies: { itemId: string; issue: string }[] = [];

  for (const phase of backlog.backlog) {
    // Check phase vs milestones
    if (phase.status === 'Complete') {
      for (const milestone of phase.milestones) {
        if (milestone.status !== 'Complete') {
          inconsistencies.push({
            itemId: phase.id,
            issue: `Phase is Complete but milestone ${milestone.id} is ${milestone.status}`,
          });
        }
      }
    }

    // Check milestone vs tasks
    for (const milestone of phase.milestones) {
      if (milestone.status === 'Complete') {
        for (const task of milestone.tasks) {
          if (task.status !== 'Complete') {
            inconsistencies.push({
              itemId: milestone.id,
              issue: `Milestone is Complete but task ${task.id} is ${task.status}`,
            });
          }
        }
      }
    }

    // Check task vs subtasks
    for (const milestone of phase.milestones) {
      for (const task of milestone.tasks) {
        if (task.status === 'Complete') {
          for (const subtask of task.subtasks) {
            if (subtask.status !== 'Complete') {
              inconsistencies.push({
                itemId: task.id,
                issue: `Task is Complete but subtask ${subtask.id} is ${subtask.status}`,
              });
            }
          }
        }
      }
    }
  }

  return {
    isConsistent: inconsistencies.length === 0,
    inconsistencies,
  };
}
```

---

## 5. Building Dependency Graph from Backlog

### Helper Function

```typescript
function buildDependencyGraph(backlog: Backlog): DependencyGraph {
  const graph: DependencyGraph = {};

  // Collect all items recursively
  const collectItems = (
    item: HierarchicalItem,
    collector: HierarchicalItem[]
  ) => {
    collector.push(item);
    if ('milestones' in item) {
      for (const m of item.milestones) {
        collectItems(m, collector);
      }
    }
    if ('tasks' in item) {
      for (const t of item.tasks) {
        collectItems(t, collector);
      }
    }
    if ('subtasks' in item) {
      for (const s of item.subtasks) {
        collectItems(s, collector);
      }
    }
  };

  const allItems: HierarchicalItem[] = [];
  for (const phase of backlog.backlog) {
    collectItems(phase, allItems);
  }

  // Build graph
  for (const item of allItems) {
    graph[item.id] = item.dependencies || [];
  }

  return graph;
}
```

---

## 6. Complete Validation Function

```typescript
interface StateValidationResult {
  isValid: boolean;
  circularDeps?: string[];
  orphanedDeps?: { taskId: string; missingDep: string }[];
  statusInconsistencies?: { itemId: string; issue: string }[];
}

function validateBacklogState(backlog: Backlog): StateValidationResult {
  // Build dependency graph
  const graph = buildDependencyGraph(backlog);
  const allTaskIds = new Set(Object.keys(graph));

  // Check circular dependencies
  const cycleResult = detectCircularDependencies(graph);

  // Check orphaned dependencies
  const orphanResult = detectOrphanedDependencies(graph, allTaskIds);

  // Check status consistency
  const statusResult = validateStatusConsistency(backlog);

  return {
    isValid:
      !cycleResult.hasCycle &&
      !orphanResult.hasOrphans &&
      statusResult.isConsistent,
    circularDeps: cycleResult.cycle,
    orphanedDeps: orphanResult.orphans,
    statusInconsistencies: statusResult.inconsistencies,
  };
}
```

---

## References

### External Resources

- **Wikipedia**: Topological sorting, Cycle detection
- **CLRS**: Chapter 22 - Graph algorithms
- **StackOverflow**: Questions 10825449, 14982352 (DFS cycle detection)

### GitHub Repos

- `palmerhq/madge` - JavaScript circular dependency detector
- `sverweij/dependency-cruiser` - Comprehensive dependency analysis
- `aackerman/circular-dependency-plugin` - Webpack plugin
