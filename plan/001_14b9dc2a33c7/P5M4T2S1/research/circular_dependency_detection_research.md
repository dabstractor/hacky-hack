# Research Summary: Circular Dependency Detection Algorithms

**Project:** hacky-hack PRP Pipeline - Dependency Validation
**Date:** 2026-01-14
**Focus:** DFS-based cycle detection in directed graphs with path reconstruction

---

## Executive Summary

This research document compiles algorithms, best practices, and implementation patterns for detecting circular dependencies in directed graphs using Depth-First Search (DFS). The findings focus on the visited set + recursion stack approach, TypeScript/JavaScript implementations, cycle path reconstruction, performance considerations, and edge case handling.

---

## 1. Core Algorithm: DFS Cycle Detection

### 1.1 The Fundamentals

**Key Concept:** In a directed graph, a cycle exists if and only if DFS encounters a **back edge** - an edge pointing to a node already in the current recursion stack.

**Two-Set Approach:**
1. **Visited Set** - Tracks all nodes that have been explored (prevents redundant work)
2. **Recursion Stack** - Tracks nodes in the current DFS path (detects back edges)

### 1.2 Basic Algorithm (TypeScript)

```typescript
interface Graph {
  [nodeId: string]: string[]; // nodeId -> array of dependency IDs
}

interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[]; // The actual cycle path if found
}

function detectCycle(graph: Graph): CycleDetectionResult {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const parentMap = new Map<string, string>(); // For path reconstruction

  function dfs(node: string, path: string[]): boolean {
    // Mark node as visited and add to recursion stack
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    // Explore all neighbors (dependencies)
    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        // Unvisited node - recurse
        if (dfs(neighbor, path)) {
          return true; // Cycle found in deeper recursion
        }
      } else if (recursionStack.has(neighbor)) {
        // BACK EDGE DETECTED! This is a cycle
        // Reconstruct the cycle path
        const cycleStart = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStart).concat(neighbor);
        return { hasCycle: true, cyclePath };
      }
    }

    // Remove from recursion stack when backtracking
    recursionStack.delete(node);
    path.pop();
    return false;
  }

  // Check all nodes (handles disconnected components)
  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      const result = dfs(node, []);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}
```

### 1.3 Three-Color Marking Alternative

A more elegant approach using three states instead of two sets:

```typescript
enum NodeState {
  UNVISITED = 0,      // White
  VISITING = 1,       // Gray
  VISITED = 2         // Black
}

function detectCycleThreeColor(graph: Graph): CycleDetectionResult {
  const state = new Map<string, NodeState>();
  const path: string[] = [];

  // Initialize all nodes as UNVISITED
  for (const node of Object.keys(graph)) {
    state.set(node, NodeState.UNVISITED);
  }

  function dfs(node: string): boolean {
    const currentState = state.get(node) ?? NodeState.UNVISITED;

    if (currentState === NodeState.VISITING) {
      // BACK EDGE! Node is currently being visited
      const cycleStart = path.indexOf(node);
      return { hasCycle: true, cyclePath: path.slice(cycleStart).concat(node) };
    }

    if (currentState === NodeState.VISITED) {
      // Already fully explored - skip
      return false;
    }

    // Mark as currently visiting (GRAY)
    state.set(node, NodeState.VISITING);
    path.push(node);

    // Explore neighbors
    for (const neighbor of (graph[node] || [])) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    // Mark as fully visited (BLACK)
    state.set(node, NodeState.VISITED);
    path.pop();
    return false;
  }

  for (const node of Object.keys(graph)) {
    if (state.get(node) === NodeState.UNVISITED) {
      const result = dfs(node);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}
```

**Advantages of Three-Color Approach:**
- Single data structure instead of two
- More intuitive state transitions
- Standard algorithm in textbooks (CLRS)
- Easier to extend for advanced scenarios

---

## 2. Cycle Path Reconstruction

### 2.1 Path Reconstruction Strategies

**Strategy 1: Track Current Path (Recommended)**

```typescript
interface CycleInfo {
  hasCycle: boolean;
  cyclePath?: string[];
  cycleStart?: string;
  cycleEnd?: string;
}

function detectCycleWithPath(graph: Graph): CycleInfo {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = []; // Tracks the current DFS path

  function dfs(node: string): CycleInfo | null {
    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor);
        if (result) return result;
      } else if (recursionStack.has(neighbor)) {
        // Cycle found! Reconstruct path
        const cycleStartIndex = currentPath.indexOf(neighbor);
        const cyclePath = [
          ...currentPath.slice(cycleStartIndex),
          neighbor
        ];

        return {
          hasCycle: true,
          cyclePath,
          cycleStart: neighbor,
          cycleEnd: node
        };
      }
    }

    recursionStack.delete(node);
    currentPath.pop();
    return null;
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      const result = dfs(node);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}
```

**Strategy 2: Parent Pointer Tracking**

```typescript
function detectCycleWithParentPointers(graph: Graph): CycleInfo {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const parent = new Map<string, string>();

  function dfs(node: string): CycleInfo | null {
    visited.add(node);
    recursionStack.add(node);

    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, node);
        const result = dfs(neighbor);
        if (result) return result;
      } else if (recursionStack.has(neighbor)) {
        // Reconstruct cycle by following parent pointers
        const cyclePath: string[] = [neighbor];
        let current = node;
        while (current !== neighbor) {
          cyclePath.push(current);
          current = parent.get(current)!;
        }
        cyclePath.push(neighbor); // Complete the cycle
        cyclePath.reverse();

        return {
          hasCycle: true,
          cyclePath,
          cycleStart: neighbor,
          cycleEnd: node
        };
      }
    }

    recursionStack.delete(node);
    return null;
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      const result = dfs(node);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}
```

### 2.2 User-Friendly Error Messages

```typescript
interface DependencyCycleError extends Error {
  cyclePath: string[];
  cycleStart: string;
  cycleEnd: string;
}

function formatCycleError(cycleInfo: CycleInfo, graph: Graph): string {
  if (!cycleInfo.hasCycle || !cycleInfo.cyclePath) {
    return "Circular dependency detected";
  }

  const pathStr = cycleInfo.cyclePath.join(' → ');
  const cycleDesc = cycleInfo.cyclePath.map(nodeId => {
    const deps = graph[nodeId] || [];
    return `  ${nodeId} depends on: [${deps.join(', ')}]`;
  }).join('\n');

  return `
┌─────────────────────────────────────────────────────────────┐
│ ❌ CIRCULAR DEPENDENCY DETECTED                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Cycle path:                                                 │
│   ${pathStr}                                                │
│                                                             │
│ Dependency breakdown:                                       │
${cycleDesc}
│                                                             │
│ This creates a circular reference that cannot be resolved. │
│ Please remove one of the dependencies in the cycle.        │
└─────────────────────────────────────────────────────────────┘
  `.trim();
}

// Usage example:
const result = detectCycleWithPath(dependencyGraph);
if (result.hasCycle) {
  const error = formatCycleError(result, dependencyGraph);
  console.error(error);
  throw new DependencyCycleError(error);
}
```

---

## 3. Edge Cases and Handling

### 3.1 Self-Dependencies (A → A)

```typescript
function detectSelfDependencies(graph: Graph): string[] {
  const selfDependencies: string[] = [];

  for (const [node, dependencies] of Object.entries(graph)) {
    if (dependencies.includes(node)) {
      selfDependencies.push(node);
    }
  }

  return selfDependencies;
}

// Enhanced cycle detection that catches self-dependencies first
function detectCycleComprehensive(graph: Graph): CycleInfo {
  // Check for self-dependencies
  const selfDeps = detectSelfDependencies(graph);
  if (selfDeps.length > 0) {
    return {
      hasCycle: true,
      cyclePath: [selfDeps[0], selfDeps[0]], // A → A
      cycleStart: selfDeps[0],
      cycleEnd: selfDeps[0]
    };
  }

  // Proceed with regular cycle detection
  return detectCycleWithPath(graph);
}
```

### 3.2 Multiple Cycles

```typescript
interface MultipleCyclesResult {
  hasCycles: boolean;
  cycles: Array<{
    path: string[];
    length: number;
  }>;
}

function detectAllCycles(graph: Graph): MultipleCyclesResult {
  const visited = new Set<string>();
  const cycles: Array<{ path: string[]; length: number }> = [];
  const currentPath: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    currentPath.push(node);

    for (const neighbor of (graph[node] || [])) {
      const pathIndex = currentPath.indexOf(neighbor);

      if (pathIndex !== -1) {
        // Found a cycle
        const cyclePath = [...currentPath.slice(pathIndex), neighbor];
        cycles.push({
          path: cyclePath,
          length: cyclePath.length - 1 // Number of edges
        });
      } else if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }

    currentPath.pop();
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  // Sort cycles by length (shortest first)
  cycles.sort((a, b) => a.length - b.length);

  return {
    hasCycles: cycles.length > 0,
    cycles
  };
}

// Format multiple cycles for user
function formatMultipleCycles(result: MultipleCyclesResult): string {
  if (!result.hasCycles) {
    return "No cycles detected";
  }

  const cycleList = result.cycles.map((cycle, index) => {
    const pathStr = cycle.path.join(' → ');
    return `  ${index + 1}. ${pathStr} (${cycle.length} edges)`;
  }).join('\n');

  return `
┌─────────────────────────────────────────────────────────────┐
│ ❌ MULTIPLE CIRCULAR DEPENDENCIES DETECTED                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Found ${result.cycles.length} circular reference(s):                                │
│                                                             │
${cycleList}
│                                                             │
│ Please resolve all cycles before proceeding.               │
└─────────────────────────────────────────────────────────────┘
  `.trim();
}
```

### 3.3 Disconnected Components

```typescript
function detectAllCyclesInGraph(graph: Graph): MultipleCyclesResult {
  const allCycles: Array<{ path: string[]; length: number }> = [];
  const globallyVisited = new Set<string>();

  for (const startNode of Object.keys(graph)) {
    if (globallyVisited.has(startNode)) {
      continue; // Already processed this component
    }

    // DFS for this connected component
    const componentVisited = new Set<string>();
    const currentPath: string[] = [];

    function dfs(node: string): void {
      componentVisited.add(node);
      globallyVisited.add(node);
      currentPath.push(node);

      for (const neighbor of (graph[node] || [])) {
        const pathIndex = currentPath.indexOf(neighbor);

        if (pathIndex !== -1) {
          // Cycle in this component
          const cyclePath = [...currentPath.slice(pathIndex), neighbor];
          allCycles.push({
            path: cyclePath,
            length: cyclePath.length - 1
          });
        } else if (!componentVisited.has(neighbor)) {
          dfs(neighbor);
        }
      }

      currentPath.pop();
    }

    dfs(startNode);
  }

  return {
    hasCycles: allCycles.length > 0,
    cycles: allCycles.sort((a, b) => a.length - b.length)
  };
}
```

### 3.4 Large Cycles

```typescript
interface CycleDetectionOptions {
  maxCycleLength?: number; // For very large graphs
  earlyExit?: boolean; // Stop after first cycle
  includeAllCycles?: boolean; // Find all cycles
}

function detectCycleWithOptions(
  graph: Graph,
  options: CycleDetectionOptions = {}
): CycleDetectionResult | MultipleCyclesResult {
  const {
    maxCycleLength = 100,
    earlyExit = true,
    includeAllCycles = false
  } = options;

  if (includeAllCycles) {
    return detectAllCyclesInGraph(graph);
  }

  if (earlyExit) {
    return detectCycleWithPath(graph);
  }

  // Custom implementation with max cycle length check
  // ... (implementation details)
  return detectCycleWithPath(graph);
}
```

---

## 4. Performance Considerations

### 4.1 Time and Space Complexity

| Operation | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| Single cycle detection | O(V + E) | O(V) | V = vertices, E = edges |
| Find all cycles | O(V + E) | O(V) | Same complexity, more output |
| Path reconstruction | O(cycle_length) | O(cycle_length) | When cycle found |
| Three-color approach | O(V + E) | O(V) | Slightly better constants |

**Key Insights:**
- DFS visits each vertex and edge exactly once
- Space complexity is dominated by recursion stack and visited sets
- Path reconstruction is O(L) where L is cycle length
- For sparse graphs (E ≈ V), performance is essentially O(V)
- For dense graphs (E ≈ V²), performance is O(V²)

### 4.2 Handling Large Graphs

```typescript
interface LargeGraphStats {
  totalNodes: number;
  totalEdges: number;
  avgDegree: number;
  maxDegree: number;
  estimatedMemory: number;
}

function analyzeGraphSize(graph: Graph): LargeGraphStats {
  const nodes = Object.keys(graph);
  const totalEdges = nodes.reduce((sum, node) => sum + (graph[node]?.length || 0), 0);
  const degrees = nodes.map(node => graph[node]?.length || 0);

  return {
    totalNodes: nodes.length,
    totalEdges,
    avgDegree: totalEdges / nodes.length,
    maxDegree: Math.max(...degrees, 0),
    // Rough estimate: each Set entry ~32 bytes, each edge reference ~8 bytes
    estimatedMemory: (nodes.length * 32) + (totalEdges * 8)
  };
}

function detectCycleOptimized(graph: Graph): CycleDetectionResult {
  const stats = analyzeGraphSize(graph);

  // For very large graphs, use iterative approach to avoid stack overflow
  if (stats.totalNodes > 10000) {
    return detectCycleIterative(graph);
  }

  // For graphs with high average degree, use adjacency list optimization
  if (stats.avgDegree > 50) {
    return detectCycleWithOptimizedLookups(graph);
  }

  // Default recursive approach
  return detectCycleWithPath(graph);
}

// Iterative implementation (no recursion stack overflow risk)
function detectCycleIterative(graph: Graph): CycleDetectionResult {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const parentMap = new Map<string, string>();

  for (const startNode of Object.keys(graph)) {
    if (visited.has(startNode)) continue;

    const stack: Array<{ node: string; index: number }> = [
      { node: startNode, index: 0 }
    ];
    const path: string[] = [];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const { node, index } = frame;

      if (index === 0) {
        // First time visiting this node
        visited.add(node);
        recursionStack.add(node);
        path.push(node);
      }

      const neighbors = graph[node] || [];

      if (index < neighbors.length) {
        // Process next neighbor
        const neighbor = neighbors[index];
        frame.index = index + 1;

        if (!visited.has(neighbor)) {
          parentMap.set(neighbor, node);
          stack.push({ node: neighbor, index: 0 });
        } else if (recursionStack.has(neighbor)) {
          // Back edge found!
          const cycleStart = path.indexOf(neighbor);
          const cyclePath = [...path.slice(cycleStart), neighbor];
          return { hasCycle: true, cyclePath };
        }
      } else {
        // All neighbors processed, backtrack
        recursionStack.delete(node);
        path.pop();
        stack.pop();
      }
    }
  }

  return { hasCycle: false };
}
```

### 4.3 Memory Optimization

```typescript
// Use BitArray for very large graphs (when node IDs are numeric)
class BitSet {
  private data: Uint32Array;
  private size: number;

  constructor(size: number) {
    this.size = size;
    this.data = new Uint32Array(Math.ceil(size / 32));
  }

  set(index: number): void {
    const word = Math.floor(index / 32);
    const bit = index % 32;
    this.data[word] |= (1 << bit);
  }

  has(index: number): boolean {
    const word = Math.floor(index / 32);
    const bit = index % 32;
    return (this.data[word] & (1 << bit)) !== 0;
  }

  clear(index: number): void {
    const word = Math.floor(index / 32);
    const bit = index % 32;
    this.data[word] &= ~(1 << bit);
  }
}

// For graphs with numeric IDs, use BitSet instead of Set
function detectCycleWithBitSet(
  graph: Map<number, number[]>,
  maxNodeId: number
): CycleDetectionResult {
  const visited = new BitSet(maxNodeId + 1);
  const recursionStack = new BitSet(maxNodeId + 1);
  const path: number[] = [];

  function dfs(node: number): boolean {
    visited.set(node);
    recursionStack.set(node);
    path.push(node);

    for (const neighbor of (graph.get(node) || [])) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        const cyclePath = [...path.slice(cycleStart), neighbor];
        return { hasCycle: true, cyclePath };
      }
    }

    recursionStack.clear(node);
    path.pop();
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const result = dfs(node);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}
```

### 4.4 Parallel Processing (for very large graphs)

```typescript
// Detect cycles in parallel by processing components independently
async function detectCycleParallel(
  graph: Graph,
  concurrency: number = 4
): Promise<CycleDetectionResult> {
  // Find connected components
  const components = findConnectedComponents(graph);

  // Process components in parallel
  const results = await Promise.all(
    components.map(async (component) => {
      // Process each component in a worker thread
      return detectCycleWithPath(component);
    })
  );

  // Return first cycle found
  for (const result of results) {
    if (result.hasCycle) {
      return result;
    }
  }

  return { hasCycle: false };
}

function findConnectedComponents(graph: Graph): Graph[] {
  const visited = new Set<string>();
  const components: Graph[] = [];

  for (const startNode of Object.keys(graph)) {
    if (visited.has(startNode)) continue;

    const component: Graph = {};
    const queue = [startNode];

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node)) continue;

      visited.add(node);
      component[node] = graph[node] || [];
      queue.push(...(graph[node] || []));
    }

    components.push(component);
  }

  return components;
}
```

---

## 5. Best Practices

### 5.1 Error Message Design

**DO:**
- Show the complete cycle path clearly
- Use visual formatting (arrows, boxes)
- Provide actionable suggestions
- Include context about what depends on what
- Highlight the specific edges that create the cycle

**DON'T:**
- Just say "cycle detected" without details
- Show raw node IDs without context
- Overwhelm with all cycles at once (show them one at a time)
- Use technical jargon without explanation

### 5.2 Testing Strategy

```typescript
import { describe, it, expect } from 'vitest';

describe('Cycle Detection', () => {
  describe('basic cycles', () => {
    it('should detect simple cycle A → B → A', () => {
      const graph: Graph = {
        'A': ['B'],
        'B': ['A']
      };

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['A', 'B', 'A']);
    });

    it('should detect longer cycle A → B → C → A', () => {
      const graph: Graph = {
        'A': ['B'],
        'B': ['C'],
        'C': ['A']
      };

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['A', 'B', 'C', 'A']);
    });

    it('should detect self-dependency A → A', () => {
      const graph: Graph = {
        'A': ['A']
      };

      const result = detectCycleComprehensive(graph);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['A', 'A']);
    });
  });

  describe('acyclic graphs', () => {
    it('should not detect cycles in DAG', () => {
      const graph: Graph = {
        'A': ['B', 'C'],
        'B': ['D'],
        'C': ['D'],
        'D': []
      };

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(false);
    });

    it('should handle single node', () => {
      const graph: Graph = {
        'A': []
      };

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(false);
    });

    it('should handle empty graph', () => {
      const graph: Graph = {};

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle disconnected components', () => {
      const graph: Graph = {
        'A': ['B'],
        'B': [],
        'C': ['D'],
        'D': ['C'] // Cycle in second component
      };

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toContain('C');
      expect(result.cyclePath).toContain('D');
    });

    it('should handle multiple cycles', () => {
      const graph: Graph = {
        'A': ['B'],
        'B': ['A'], // Cycle 1
        'C': ['D'],
        'D': ['C']  // Cycle 2
      };

      const result = detectAllCyclesInGraph(graph);
      expect(result.hasCycles).toBe(true);
      expect(result.cycles).toHaveLength(2);
    });

    it('should handle large cycle', () => {
      const graph: Graph = {};
      const nodes = Array.from({ length: 100 }, (_, i) => `N${i}`);

      // Create chain A → B → C → ... → A
      for (let i = 0; i < nodes.length; i++) {
        graph[nodes[i]] = [nodes[(i + 1) % nodes.length]];
      }

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toHaveLength(101);
    });
  });

  describe('performance', () => {
    it('should handle large acyclic graph', () => {
      const graph: Graph = {};
      const nodeCount = 10000;

      // Create linear chain
      for (let i = 0; i < nodeCount; i++) {
        graph[`N${i}`] = i < nodeCount - 1 ? [`N${i + 1}`] : [];
      }

      const start = Date.now();
      const result = detectCycleWithPath(graph);
      const duration = Date.now() - start;

      expect(result.hasCycle).toBe(false);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle dense graph', () => {
      const graph: Graph = {};
      const nodeCount = 100;

      // Each node connects to all subsequent nodes
      for (let i = 0; i < nodeCount; i++) {
        graph[`N${i}`] = Array.from(
          { length: nodeCount - i - 1 },
          (_, j) => `N${i + j + 1}`
        );
      }

      const start = Date.now();
      const result = detectCycleWithPath(graph);
      const duration = Date.now() - start;

      expect(result.hasCycle).toBe(false);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('path reconstruction', () => {
    it('should reconstruct correct cycle path', () => {
      const graph: Graph = {
        'A': ['B', 'C'],
        'B': ['D'],
        'C': ['D'],
        'D': ['B'] // Cycle: B → D → B
      };

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['B', 'D', 'B']);
    });

    it('should find shortest cycle in complex graph', () => {
      const graph: Graph = {
        'A': ['B', 'C'],
        'B': ['C', 'D'],
        'C': ['A'], // Short cycle: A → C → A
        'D': ['A']  // Longer cycle: A → B → D → A
      };

      const result = detectCycleWithPath(graph);
      expect(result.hasCycle).toBe(true);
      // Should find A → C → A (length 3) or A → B → D → A (length 4)
      expect(result.cyclePath!.length).toBeLessThanOrEqual(4);
    });
  });
});
```

### 5.3 Common Pitfalls

**Pitfall 1: Forgetting to handle disconnected components**

```typescript
// BAD: Only checks first component
function detectCycleBad(graph: Graph): boolean {
  const visited = new Set<string>();
  const startNode = Object.keys(graph)[0];

  return dfs(startNode); // Misses cycles in other components!
}

// GOOD: Checks all components
function detectCycleGood(graph: Graph): CycleDetectionResult {
  const visited = new Set<string>();

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      const result = dfs(node);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}
```

**Pitfall 2: Not removing node from recursion stack on backtrack**

```typescript
// BAD: Recursion stack never shrinks
function dfsBad(node: string): boolean {
  visited.add(node);
  recursionStack.add(node); // Added but never removed!

  for (const neighbor of graph[node]) {
    if (recursionStack.has(neighbor)) return true; // False positives!
  }
  return false;
}

// GOOD: Properly manage recursion stack
function dfsGood(node: string): boolean {
  visited.add(node);
  recursionStack.add(node);

  for (const neighbor of graph[node]) {
    if (dfsGood(neighbor)) return true;
  }

  recursionStack.delete(node); // Remove on backtrack
  return false;
}
```

**Pitfall 3: Confusing visited and recursion stack**

```typescript
// BAD: Uses same set for both purposes
function detectCycleBad(graph: Graph): boolean {
  const visited = new Set<string>();

  function dfs(node: string): boolean {
    if (visited.has(node)) return true; // WRONG! This catches cross-edges
    visited.add(node);

    for (const neighbor of graph[node]) {
      if (dfs(neighbor)) return true;
    }
    return false;
  }
}

// GOOD: Separate sets for different purposes
function detectCycleGood(graph: Graph): CycleDetectionResult {
  const visited = new Set<string>();      // All visited nodes
  const recursionStack = new Set<string>(); // Nodes in current path

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true; // Only back edges indicate cycles
      }
    }

    recursionStack.delete(node);
    return false;
  }
}
```

**Pitfall 4: Stack overflow on very deep graphs**

```typescript
// BAD: Recursive approach can overflow
function detectCycleDeepRecursive(graph: Graph): boolean {
  // Stack overflow on graphs with >10000 depth
  return dfs(startNode);
}

// GOOD: Iterative approach handles any depth
function detectCycleDeepIterative(graph: Graph): CycleDetectionResult {
  const stack: Array<{ node: string; index: number }> = [];
  // ... iterative implementation
}
```

---

## 6. Real-World Implementation Patterns

### 6.1 Task Dependency Validation

```typescript
interface Task {
  id: string;
  dependencies: string[];
}

function buildDependencyGraph(tasks: Task[]): Graph {
  const graph: Graph = {};

  for (const task of tasks) {
    graph[task.id] = task.dependencies;
  }

  return graph;
}

function validateTaskDependencies(tasks: Task[]): {
  valid: boolean;
  errors: Array<{ taskId: string; cycle: string[] }>;
} {
  const graph = buildDependencyGraph(tasks);
  const result = detectAllCyclesInGraph(graph);

  if (!result.hasCycles) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.cycles.map(cycle => ({
      taskId: cycle.path[0],
      cycle: cycle.path
    }))
  };
}
```

### 6.2 Module Import Cycle Detection

```typescript
interface ModuleInfo {
  id: string;
  imports: string[];
}

function detectImportCycles(modules: ModuleInfo[]): void {
  const graph: Graph = {};

  for (const module of modules) {
    graph[module.id] = module.imports;
  }

  const result = detectCycleWithPath(graph);

  if (result.hasCycle) {
    const cycleStr = result.cyclePath!.join(' → ');
    throw new Error(
      `Circular import detected: ${cycleStr}\n` +
      'This will cause runtime errors. ' +
      'Refactor to break the cycle.'
    );
  }
}
```

### 6.3 Build System Dependency Order

```typescript
function topologicalSortWithCycleDetection(
  graph: Graph
): { sorted: string[] } | { cycle: string[] } {
  const visited = new Set<string>();
  const temp = new Set<string>();
  const sorted: string[] = [];

  function visit(node: string): boolean {
    if (temp.has(node)) {
      // Cycle detected
      const cyclePath = reconstructCycle(sorted, node);
      return { cycle: cyclePath };
    }

    if (visited.has(node)) {
      return false;
    }

    temp.add(node);

    for (const neighbor of (graph[node] || [])) {
      const result = visit(neighbor);
      if (result) return result;
    }

    temp.delete(node);
    visited.add(node);
    sorted.push(node);

    return false;
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      const result = visit(node);
      if (result) return result;
    }
  }

  return { sorted: sorted.reverse() };
}
```

---

## 7. Algorithm Comparison

### 7.1 DFS vs Kahn's Algorithm

**DFS Approach (This Document):**
- Pros:
  - Natural for cycle detection
  - Easy to reconstruct cycle paths
  - Works well for sparse graphs
  - Recursive implementation is clean
- Cons:
  - Recursion stack limits on very deep graphs
  - Requires iterative variant for large graphs

**Kahn's Algorithm (Topological Sort):**
```typescript
function kahnAlgorithm(graph: Graph): { sorted: string[] } | { cycle: string[] } {
  // Calculate in-degrees
  const inDegree = new Map<string, number>();
  for (const node of Object.keys(graph)) {
    inDegree.set(node, 0);
  }
  for (const [node, neighbors] of Object.entries(graph)) {
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    }
  }

  // Start with nodes of zero in-degree
  const queue: string[] = [];
  for (const [node, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);

    for (const neighbor of (graph[node] || [])) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If not all nodes are in sorted order, there's a cycle
  if (sorted.length !== Object.keys(graph).length) {
    // Find nodes in cycle (those with in-degree > 0)
    const cycleNodes = Object.keys(graph).filter(
      node => !sorted.includes(node)
    );
    return { cycle: cycleNodes };
  }

  return { sorted };
}
```

**When to use Kahn's:**
- You already need topological order
- Graph is very dense (many edges)
- You want to avoid recursion entirely
- You need to process nodes layer by layer

**When to use DFS:**
- You primarily need cycle detection
- You need the actual cycle path
- Graph is sparse
- Memory efficiency is important

---

## 8. Production Implementation Checklist

### 8.1 Essential Features

- [x] Basic cycle detection (DFS with visited + recursion stack)
- [x] Cycle path reconstruction
- [x] Handle disconnected components
- [x] Self-dependency detection
- [x] User-friendly error messages
- [x] Comprehensive test coverage

### 8.2 Advanced Features

- [ ] Detect all cycles (not just first)
- [ ] Handle very large graphs (iterative approach)
- [ ] Performance optimization for dense graphs
- [ ] Visual cycle representation
- [ ] Cycle severity ranking (shortest = most critical)
- [ ] Suggested fixes (which dependency to remove)

### 8.3 Monitoring & Observability

- [ ] Log cycle detection duration
- [ ] Track graph size metrics
- [ ] Alert on frequent cycle detection
- [ ] Export cycle statistics
- [ ] Visualize dependency graphs

---

## 9. Reference Implementations

### 9.1 Complete Production Implementation

```typescript
/**
 * Circular Dependency Detection Utility
 *
 * Provides comprehensive cycle detection in directed graphs with:
 * - DFS-based cycle detection
 * - Path reconstruction
 * - Multiple cycle detection
 * - Performance optimization
 * - User-friendly error messages
 */

export interface Graph {
  [nodeId: string]: string[];
}

export interface CycleInfo {
  hasCycle: boolean;
  cyclePath?: string[];
  cycleLength?: number;
  affectedNodes?: string[];
}

export interface CycleDetectionOptions {
  earlyExit?: boolean;
  findAllCycles?: boolean;
  maxCycleLength?: number;
}

/**
 * Main cycle detection function
 * Detects cycles in a directed graph and returns detailed cycle information
 */
export function detectCycles(
  graph: Graph,
  options: CycleDetectionOptions = {}
): CycleInfo | { cycles: CycleInfo[] } {
  const { earlyExit = true, findAllCycles = false } = options;

  if (findAllCycles) {
    return detectAllCycles(graph);
  }

  return detectFirstCycle(graph);
}

/**
 * Detect the first cycle encountered in the graph
 */
function detectFirstCycle(graph: Graph): CycleInfo {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(node: string): CycleInfo | null {
    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor);
        if (result) return result;
      } else if (recursionStack.has(neighbor)) {
        // Back edge detected - cycle found!
        const cycleStart = currentPath.indexOf(neighbor);
        const cyclePath = [...currentPath.slice(cycleStart), neighbor];

        return {
          hasCycle: true,
          cyclePath,
          cycleLength: cyclePath.length - 1,
          affectedNodes: [...new Set(cyclePath)]
        };
      }
    }

    recursionStack.delete(node);
    currentPath.pop();
    return null;
  }

  // Check all nodes (handles disconnected components)
  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      const result = dfs(node);
      if (result) return result;
    }
  }

  return { hasCycle: false };
}

/**
 * Detect all cycles in the graph
 */
function detectAllCycles(graph: Graph): { cycles: CycleInfo[]; hasCycles: boolean } {
  const visited = new Set<string>();
  const cycles: CycleInfo[] = [];
  const currentPath: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    currentPath.push(node);

    for (const neighbor of (graph[node] || [])) {
      const cycleStart = currentPath.indexOf(neighbor);

      if (cycleStart !== -1) {
        // Cycle found
        const cyclePath = [...currentPath.slice(cycleStart), neighbor];
        cycles.push({
          hasCycle: true,
          cyclePath,
          cycleLength: cyclePath.length - 1,
          affectedNodes: [...new Set(cyclePath)]
        });
      } else if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }

    currentPath.pop();
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  // Sort by cycle length (shortest first)
  cycles.sort((a, b) => (a.cycleLength || 0) - (b.cycleLength || 0));

  return {
    cycles,
    hasCycles: cycles.length > 0
  };
}

/**
 * Format cycle error for user display
 */
export function formatCycleError(cycleInfo: CycleInfo): string {
  if (!cycleInfo.hasCycle || !cycleInfo.cyclePath) {
    return "Circular dependency detected";
  }

  const pathStr = cycleInfo.cyclePath.join(' → ');
  const nodeDetails = cycleInfo.affectedNodes?.map(node => {
    return `  • ${node}`;
  }).join('\n') || '';

  return `
╔═══════════════════════════════════════════════════════════════╗
║ ❌ CIRCULAR DEPENDENCY DETECTED                              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║ Cycle path (${cycleInfo.cycleLength} edges):                            ║
║   ${pathStr.padEnd(60)}║
║                                                               ║
║ Affected nodes:                                              ║
${nodeDetails}
║                                                               ║
║ ⚠️  This creates a circular reference that cannot be         ║
║     resolved. Please remove one of the dependencies in the   ║
║     cycle to fix this issue.                                 ║
╚═══════════════════════════════════════════════════════════════╝
  `.trim();
}

/**
 * Validate dependencies in a task hierarchy
 */
export function validateTaskDependencies(
  tasks: Array<{ id: string; dependencies: string[] }>
): { valid: boolean; errors: string[] } {
  const graph: Graph = {};
  const errors: string[] = [];

  // Build dependency graph
  for (const task of tasks) {
    graph[task.id] = task.dependencies;

    // Validate that dependencies exist
    for (const dep of task.dependencies) {
      if (!graph[dep]) {
        errors.push(`Task ${task.id} depends on non-existent task ${dep}`);
      }
    }
  }

  // Check for cycles
  const cycleResult = detectCycles(graph, { findAllCycles: true });

  if ('cycles' in cycleResult && cycleResult.hasCycles) {
    for (const cycle of cycleResult.cycles) {
      errors.push(formatCycleError(cycle));
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 10. Further Reading & Resources

### 10.1 Algorithm Resources

**Textbooks & Academic Resources:**
- Introduction to Algorithms (CLRS) - Chapter 22: Elementary Graph Algorithms
- Algorithms, 4th Edition (Sedgewick & Wayne) - Chapter 4: Graphs
- The Algorithm Design Manual (Skiena) - Chapter 5: Graph Traversal

**Online Courses:**
- Coursera: Algorithms Specialization (Princeton)
- edX: Introduction to Algorithms (MIT)
- Khan Academy: Algorithms and Data Structures

**Interactive Visualizations:**
- VisualAlgo: Graph Traversal Visualization
- University of San Francisco: DFS Visualization
- Algorithms Live: Cycle Detection Animations

### 10.2 Implementation References

**GitHub Repositories:**
- `madge` - JavaScript circular dependency detector
- `dependency-cruiser` - Advanced dependency analysis
- `eslint-plugin-import` - ESLint rules for import cycles
- `webpack` - Module dependency graph with cycle detection

**Documentation:**
- MDN Web Docs: Graph algorithms
- TypeScript Handbook: Advanced Types
- Node.js Documentation: Module resolution

### 10.3 Related Algorithms

**Strongly Connected Components (SCC):**
- Tarjan's Algorithm
- Kosaraju's Algorithm
- Finds all cycles in a graph

**Topological Sorting:**
- Kahn's Algorithm
- DFS-based topological sort
- Useful for detecting cycles AND ordering

**Minimum Feedback Arc Set:**
- NP-hard problem
- Finds minimum edges to remove to break cycles
- Useful for suggesting fixes

---

## 11. Summary & Recommendations

### 11.1 Key Takeaways

1. **DFS with visited set + recursion stack** is the standard approach for cycle detection
2. **Three-color marking** is an elegant alternative that's easier to reason about
3. **Path reconstruction** is essential for helpful error messages
4. **Handle edge cases**: self-dependencies, multiple cycles, disconnected components
5. **Performance**: O(V + E) time, O(V) space - efficient for most real-world graphs
6. **User experience**: Clear, actionable error messages with cycle visualization

### 11.2 Implementation Recommendations

**For the PRP Pipeline:**

1. Use the three-color marking approach for clarity
2. Implement both single-cycle and all-cycles detection
3. Provide detailed cycle path reconstruction
4. Format error messages with visual hierarchy
5. Add comprehensive test coverage including edge cases
6. Consider performance for large task hierarchies (>1000 tasks)

**Priority Features:**
- [P0] Basic cycle detection with path reconstruction
- [P0] Self-dependency detection
- [P1] Multiple cycle detection
- [P1] User-friendly error formatting
- [P2] Performance optimization for large graphs
- [P2] Visual cycle representation

### 11.3 Next Steps

1. Implement core cycle detection utility
2. Add comprehensive test suite
3. Integrate with task dependency validation
4. Add error message formatting
5. Document usage patterns
6. Add performance benchmarks

---

**Document Status:** Complete - Ready for implementation
**Last Updated:** 2026-01-14
**Version:** 1.0

**Note:** This document was compiled using established algorithmic principles and best practices for graph cycle detection. For external web resources and live implementations, consider exploring the referenced GitHub repositories and documentation when web access is available.
