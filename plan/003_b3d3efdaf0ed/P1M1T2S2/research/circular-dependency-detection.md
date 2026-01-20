# Circular Dependency Detection: Research & Best Practices

**Research Date:** 2026-01-17
**Focus:** Detection algorithms, testing patterns, and implementation best practices

---

## Table of Contents

1. [Circular Dependency Detection Algorithms](#1-circular-dependency-detection-algorithms)
2. [Testing Circular Dependencies](#2-testing-circular-dependencies)
3. [Dependency Graph Testing](#3-dependency-graph-testing)
4. [Best Practices](#4-best-practices)
5. [Implementation Patterns](#5-implementation-patterns)
6. [Resources & References](#6-resources--references)

---

## 1. Circular Dependency Detection Algorithms

### 1.1 Core Algorithms

#### DFS with Coloring (Three-Color Algorithm)

The most common approach for detecting cycles in directed graphs:

```typescript
enum NodeColor {
  WHITE = 'white',   // Unvisited
  GRAY = 'gray',     // Visiting (in current DFS path)
  BLACK = 'black'    // Visited (fully processed)
}

interface DependencyNode {
  id: string;
  dependencies: string[];
  color: NodeColor;
}

function detectCircularDependencies(
  nodes: Map<string, DependencyNode>
): string[][] {
  const cycles: string[][] = [];

  function dfs(nodeId: string, path: string[]): void {
    const node = nodes.get(nodeId);
    if (!node) return;

    // Mark as visiting
    node.color = NodeColor.GRAY;
    path.push(nodeId);

    // Check all dependencies
    for (const depId of node.dependencies) {
      const dep = nodes.get(depId);

      if (!dep) continue;

      if (dep.color === NodeColor.GRAY) {
        // Found a cycle - extract it from the path
        const cycleStart = path.indexOf(depId);
        const cycle = [...path.slice(cycleStart), depId];
        cycles.push(cycle);
      } else if (dep.color === NodeColor.WHITE) {
        dfs(depId, path);
      }
    }

    // Mark as visited
    node.color = NodeColor.BLACK;
    path.pop();
  }

  // Start DFS from each unvisited node
  for (const [nodeId, node] of nodes) {
    if (node.color === NodeColor.WHITE) {
      dfs(nodeId, []);
    }
  }

  return cycles;
}
```

**Time Complexity:** O(V + E) where V = vertices, E = edges
**Space Complexity:** O(V) for the color array and recursion stack

#### Topological Sort Approach

Using Kahn's algorithm for topological sorting:

```typescript
function detectCyclesTopological(
  nodes: Map<string, DependencyNode>
): string[][] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialize
  for (const [id, node] of nodes) {
    inDegree.set(id, 0);
    adjList.set(id, []);
  }

  // Build adjacency list and calculate in-degrees
  for (const [id, node] of nodes) {
    for (const dep of node.dependencies) {
      adjList.get(dep)!.push(id);
      inDegree.set(id, (inDegree.get(id) || 0) + 1);
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const processed = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    processed.add(current);

    for (const neighbor of adjList.get(current) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If not all nodes processed, there's a cycle
  if (processed.size !== nodes.size) {
    const nodesInCycle = Array.from(nodes.keys())
      .filter(id => !processed.has(id));
    return [nodesInCycle]; // Simplified - actual cycle extraction requires more work
  }

  return [];
}
```

### 1.2 Implementation Patterns in TypeScript/JavaScript

#### Pattern 1: Module Dependency Detection

```typescript
interface ModuleInfo {
  id: string;
  imports: string[];
  filePath: string;
}

class ModuleDependencyAnalyzer {
  private dependencyGraph = new Map<string, Set<string>>();

  addModule(module: ModuleInfo): void {
    this.dependencyGraph.set(module.id, new Set(module.imports));
  }

  detectCycles(): Array<string[]> {
    const nodes = new Map<string, { color: number; deps: string[] }>();

    // Build graph
    for (const [id, deps] of this.dependencyGraph) {
      nodes.set(id, { color: 0, deps: Array.from(deps) });
    }

    return this.detectCyclesDFS(nodes);
  }

  private detectCyclesDFS(
    nodes: Map<string, { color: number; deps: string[] }>
  ): string[][] {
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]) => {
      const node = nodes.get(nodeId);
      if (!node) return;

      node.color = 1; // GRAY
      path.push(nodeId);

      for (const depId of node.deps) {
        const dep = nodes.get(depId);
        if (!dep) continue;

        if (dep.color === 1) {
          const cycleStart = path.indexOf(depId);
          cycles.push([...path.slice(cycleStart), depId]);
        } else if (dep.color === 0) {
          dfs(depId, path);
        }
      }

      node.color = 2; // BLACK
      path.pop();
    };

    for (const [nodeId] of nodes) {
      if (nodes.get(nodeId)!.color === 0) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }
}
```

#### Pattern 2: Runtime Detection with Proxy

```typescript
function createCircularDependencyDetector() {
  const resolving = new Set<string>();
  const resolved = new Map<string, any>();

  return {
    resolve<T>(id: string, factory: () => T): T {
      // Check for circular dependency
      if (resolving.has(id)) {
        throw new Error(
          `Circular dependency detected: ${Array.from(resolving).join(' → ')} → ${id}`
        );
      }

      // Return cached if available
      if (resolved.has(id)) {
        return resolved.get(id);
      }

      // Mark as resolving
      resolving.add(id);

      try {
        const instance = factory();
        resolved.set(id, instance);
        return instance;
      } finally {
        resolving.delete(id);
      }
    }
  };
}
```

---

## 2. Testing Circular Dependencies

### 2.1 Test Cases for Circular Dependency Detection

#### Essential Test Scenarios

```typescript
describe('CircularDependencyDetector', () => {
  describe('Direct Circular Dependencies', () => {
    it('should detect A → B → A', () => {
      const graph = new Map([
        ['A', { deps: ['B'] }],
        ['B', { deps: ['A'] }]
      ]);

      const cycles = detectCycles(graph);
      expect(cycles).toEqual([['A', 'B', 'A']]);
    });

    it('should detect A → A (self-dependency)', () => {
      const graph = new Map([
        ['A', { deps: ['A'] }]
      ]);

      const cycles = detectCycles(graph);
      expect(cycles).toEqual([['A', 'A']]);
    });
  });

  describe('Indirect Circular Dependencies', () => {
    it('should detect A → B → C → A', () => {
      const graph = new Map([
        ['A', { deps: ['B'] }],
        ['B', { deps: ['C'] }],
        ['C', { deps: ['A'] }]
      ]);

      const cycles = detectCycles(graph);
      expect(cycles).toEqual([['A', 'B', 'C', 'A']]);
    });

    it('should detect multiple independent cycles', () => {
      const graph = new Map([
        ['A', { deps: ['B'] }],
        ['B', { deps: ['A'] }],
        ['C', { deps: ['D'] }],
        ['D', { deps: ['C'] }]
      ]);

      const cycles = detectCycles(graph);
      expect(cycles.length).toBe(2);
    });
  });

  describe('Complex Scenarios', () => {
    it('should detect cycles in complex graph with DAG portions', () => {
      const graph = new Map([
        ['A', { deps: ['B', 'C'] }],
        ['B', { deps: ['D'] }],
        ['C', { deps: ['D'] }],
        ['D', { deps: ['A'] }],  // Creates cycle
        ['E', { deps: ['F'] }],   // Separate DAG
        ['F', { deps: [] }]
      ]);

      const cycles = detectCycles(graph);
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('A');
    });

    it('should handle diamond dependencies without cycles', () => {
      const graph = new Map([
        ['A', { deps: ['B', 'C'] }],
        ['B', { deps: ['D'] }],
        ['C', { deps: ['D'] }],
        ['D', { deps: [] }]
      ]);

      const cycles = detectCycles(graph);
      expect(cycles).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty graph', () => {
      const cycles = detectCycles(new Map());
      expect(cycles).toEqual([]);
    });

    it('should handle single node with no dependencies', () => {
      const graph = new Map([
        ['A', { deps: [] }]
      ]);

      const cycles = detectCycles(graph);
      expect(cycles).toEqual([]);
    });

    it('should handle missing dependencies gracefully', () => {
      const graph = new Map([
        ['A', { deps: ['B'] }]  // B doesn't exist
      ]);

      const cycles = detectCycles(graph);
      expect(cycles).toEqual([]);
    });
  });
});
```

### 2.2 Testing Runtime Detection

```typescript
describe('Runtime Circular Dependency Detection', () => {
  it('should throw error when circular dependency is resolved', () => {
    const detector = createCircularDependencyDetector();

    const registry = {
      register: (name: string, factory: () => any) => {
        detector.resolve(name, factory);
      }
    };

    // Setup circular dependency
    let aValue: any;
    registry.register('A', () => ({
      getB: () => detector.resolve('B', () => ({
        getA: () => aValue
      }))
    }));

    aValue = detector.resolve('A', () => ({
      getB: () => detector.resolve('B', () => ({
        getA: () => detector.resolve('A', () => ({}))
      }))
    });

    expect(() => aValue.getB()).toThrow('Circular dependency detected');
  });
});
```

### 2.3 Common Pitfalls in Testing

1. **Not testing the actual cycle path**: Tests should verify not just that a cycle is detected, but that the correct cycle path is reported.

2. **Missing edge cases**:
   - Empty graphs
   - Single nodes
   - Missing dependencies
   - Very large graphs (performance testing)

3. **Not testing error messages**: Ensure error messages are helpful and include the full cycle path.

4. **Ignoring performance**: For large graphs, detection should be efficient. Test with graphs containing thousands of nodes.

```typescript
// Performance test
describe('Performance', () => {
  it('should handle large graphs efficiently', () => {
    const graph = new Map<string, { deps: string[] }>();

    // Create 10,000 nodes in a chain
    for (let i = 0; i < 10000; i++) {
      graph.set(`node${i}`, { deps: i < 9999 ? [`node${i + 1}`] : [] });
    }

    const startTime = performance.now();
    const cycles = detectCycles(graph);
    const endTime = performance.now();

    expect(cycles).toEqual([]);
    expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
  });
});
```

---

## 3. Dependency Graph Testing

### 3.1 Verifying Dependency Graph Construction

```typescript
interface DependencyGraph {
  addNode(id: string, dependencies: string[]): void;
  hasNode(id: string): boolean;
  getDependencies(id: string): string[];
  getAllNodes(): string[];
  detectCycles(): string[][];
}

describe('DependencyGraph Construction', () => {
  it('should correctly build graph from scratch', () => {
    const graph = new DependencyGraphImpl();

    graph.addNode('A', ['B', 'C']);
    graph.addNode('B', ['D']);
    graph.addNode('C', ['D']);
    graph.addNode('D', []);

    expect(graph.getAllNodes()).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
    expect(graph.getDependencies('A')).toEqual(expect.arrayContaining(['B', 'C']));
  });

  it('should handle duplicate node additions', () => {
    const graph = new DependencyGraphImpl();

    graph.addNode('A', ['B']);
    graph.addNode('A', ['C']);  // Should replace or merge

    expect(graph.getDependencies('A')).toEqual(['C']); // or ['B', 'C'] depending on implementation
  });
});
```

### 3.2 Testing Transitive Dependencies

```typescript
describe('Transitive Dependencies', () => {
  it('should calculate transitive dependencies correctly', () => {
    const graph = new Map([
      ['A', { deps: ['B'] }],
      ['B', { deps: ['C'] }],
      ['C', { deps: ['D'] }],
      ['D', { deps: [] }]
    ]);

    const transitive = getTransitiveDependencies(graph, 'A');
    expect(transitive).toEqual(new Set(['B', 'C', 'D']));
  });

  it('should handle circular transitive dependencies', () => {
    const graph = new Map([
      ['A', { deps: ['B'] }],
      ['B', { deps: ['C'] }],
      ['C', { deps: ['A'] }]
    ]);

    const transitive = getTransitiveDependencies(graph, 'A');
    // Should either detect cycle or return dependencies up to cycle
    expect(transitive).toContain('B');
    expect(transitive).toContain('C');
  });
});

function getTransitiveDependencies(
  graph: Map<string, { deps: string[] }>,
  nodeId: string,
  visited = new Set<string>()
): Set<string> {
  if (visited.has(nodeId)) {
    return new Set(); // Cycle detected
  }

  visited.add(nodeId);
  const node = graph.get(nodeId);
  if (!node) return new Set();

  const allDeps = new Set<string>(node.deps);

  for (const dep of node.deps) {
    const transitive = getTransitiveDependencies(graph, dep, visited);
    transitive.forEach(d => allDeps.add(d));
  }

  return allDeps;
}
```

### 3.3 Testing Self-Dependencies

```typescript
describe('Self-Dependencies', () => {
  it('should detect direct self-dependency', () => {
    const graph = new Map([
      ['A', { deps: ['A'] }]
    ]);

    const cycles = detectCycles(graph);
    expect(cycles).toEqual([['A', 'A']]);
  });

  it('should detect self-dependency in complex graph', () => {
    const graph = new Map([
      ['A', { deps: ['B'] }],
      ['B', { deps: ['C', 'B'] }],  // B depends on itself
      ['C', { deps: [] }]
    ]);

    const cycles = detectCycles(graph);
    const selfCycle = cycles.find(c => c.length === 2 && c[0] === c[1]);
    expect(selfCycle).toEqual(['B', 'B']);
  });

  it('should handle self-dependency at resolution time', () => {
    const detector = createCircularDependencyDetector();

    expect(() => {
      detector.resolve('A', () => detector.resolve('A', () => ({})));
    }).toThrow();
  });
});
```

---

## 4. Best Practices

### 4.1 Detection Timing: Creation vs Execution

#### Creation-Time Detection (Recommended)

**Pros:**
- Fails fast - errors caught before runtime
- Better developer experience
- Can provide detailed error messages with file locations
- Easier to fix (code isn't running yet)

**Cons:**
- Requires static analysis or build-time tooling
- May have false positives for dynamic dependencies
- Adds to build time

**Implementation:**

```typescript
// Build-time detection (e.g., webpack plugin, CLI tool)
class BuildTimeCycleDetector {
  analyze(modules: ModuleInfo[]): CycleReport {
    const graph = this.buildGraph(modules);
    const cycles = this.detectCycles(graph);

    if (cycles.length > 0) {
      throw new BuildError(
        `Circular dependencies detected:\n${this.formatCycles(cycles)}`
      );
    }

    return { hasCycles: false, cycles: [] };
  }

  private formatCycles(cycles: string[][]): string {
    return cycles.map((cycle, i) =>
      `  ${i + 1}. ${cycle.join(' → ')}`
    ).join('\n');
  }
}
```

#### Execution-Time Detection

**Pros:**
- Handles dynamic dependencies
- No build-time overhead
- Works with code splitting and lazy loading

**Cons:**
- Errors only appear when code runs
- May miss cycles in unexecuted code paths
- Harder to debug and fix

**Implementation:**

```typescript
// Runtime detection
class RuntimeCycleDetector {
  private resolving = new Set<string>();

  resolve<T>(id: string, factory: () => T): T {
    if (this.resolving.has(id)) {
      const path = Array.from(this.resolving).join(' → ');
      throw new RuntimeError(
        `Runtime circular dependency: ${path} → ${id}`
      );
    }

    this.resolving.add(id);
    try {
      return factory();
    } finally {
      this.resolving.delete(id);
    }
  }
}
```

**Best Practice:** Use **both** creation-time and execution-time detection for maximum safety.

### 4.2 Reporting Circular Dependencies

Effective error messages should include:

1. **The complete cycle path**
2. **File locations** (line numbers, file paths)
3. **Suggested fixes** when possible
4. **Visualization** (ASCII art or graph)

```typescript
interface CycleError {
  cycle: string[];
  locations: Array<{ file: string; line: number }>;
  type: 'direct' | 'indirect';
  suggestions: string[];
}

function formatCycleError(error: CycleError): string {
  const lines: string[] = [];

  lines.push('❌ Circular Dependency Detected');
  lines.push('');
  lines.push(`Type: ${error.type}`);
  lines.push('');
  lines.push('Dependency path:');

  error.cycle.forEach((node, i) => {
    const loc = error.locations[i];
    const arrow = i < error.cycle.length - 1 ? ' →' : '  ↽';
    lines.push(`  ${node} ${loc ? `(${loc.file}:${loc.line})` : ''} ${arrow}`);
  });

  if (error.suggestions.length > 0) {
    lines.push('');
    lines.push('Suggestions:');
    error.suggestions.forEach(s => lines.push(`  • ${s}`));
  }

  return lines.join('\n');
}
```

### 4.3 Prevention vs Detection

#### Detection

- **What:** Identify existing circular dependencies
- **When:** During build or at runtime
- **How:** Graph traversal algorithms
- **Goal:** Catch errors before they cause problems

#### Prevention

- **What:** Stop circular dependencies from being created
- **When:** During development (IDE, linters)
- **How:** Architectural constraints, code review, tooling
- **Goal:** Eliminate the root cause

**Prevention Strategies:**

1. **Architectural Constraints**
   ```typescript
   // Enforce layer architecture
   const allowedLayers = {
     'presentation': ['domain', 'application'],
     'domain': [],
     'application': ['domain'],
     'infrastructure': ['domain', 'application']
   };

   function validateLayer(
     fromLayer: string,
     toLayer: string
   ): boolean {
     return allowedLayers[fromLayer]?.includes(toLayer) ?? false;
   }
   ```

2. **Dependency Rules**
   ```typescript
   // ESLint rule example
   const noCircularDepsRule = {
     create(context: any) {
       return {
         ImportDeclaration(node: any) {
           const importPath = node.source.value;
           const currentFile = context.getFilename();

           if (wouldCreateCycle(currentFile, importPath)) {
             context.report({
               node,
               message: 'Import would create circular dependency'
             });
           }
         }
       };
     }
   };
   ```

3. **Design Patterns**
   - **Dependency Inversion**: Depend on abstractions, not concrete implementations
   - **Event-Driven Architecture**: Use events instead of direct references
   - **Mediator Pattern**: Central coordinator to avoid direct dependencies
   - **Service Locator**: Registry pattern to decouple components

**Example: Event-Driven Alternative to Circular Dependency**

```typescript
// BEFORE: Circular dependency
class UserService {
  constructor(private emailService: EmailService) {}

  deleteUser(id: string) {
    // Delete user
    this.emailService.sendGoodbye(id);
  }
}

class EmailService {
  constructor(private userService: UserService) {}

  sendGoodbye(userId: string) {
    const user = this.userService.getUser(userId);
    // Send email
  }
}

// AFTER: Event-driven (no circular dependency)
class UserService {
  constructor(private eventBus: EventBus) {}

  deleteUser(id: string) {
    // Delete user
    this.eventBus.emit('user.deleted', { userId: id });
  }
}

class EmailService {
  constructor(private eventBus: EventBus) {
    this.eventBus.on('user.deleted', ({ userId }) => {
      this.sendGoodbye(userId);
    });
  }

  private sendGoodbye(userId: string) {
    // Load user and send email (without dependency on UserService)
  }
}
```

### 4.4 When to Allow Circular Dependencies

In some cases, circular dependencies are acceptable or even necessary:

1. **Mutual recursion** in algorithms
2. **Parent-child relationships** where both need to communicate
3. **Plugin systems** where plugins and core reference each other

**Strategies for acceptable circular dependencies:**

```typescript
// Strategy 1: Lazy initialization
class Parent {
  private _child?: Child;

  setChild(child: Child) {
    this._child = child;
  }

  getChild() {
    if (!this._child) {
      throw new Error('Child not set');
    }
    return this._child;
  }
}

class Child {
  constructor(private parent: Parent) {}
}

// Usage
const parent = new Parent();
const child = new Child(parent);
parent.setChild(child);

// Strategy 2: Interface extraction
interface IChild {
  method(): void;
}

class Parent {
  constructor(private child: IChild) {}
}

class Child implements IChild {
  constructor(parent: Parent) {
    parent.doSomething(this);
  }

  method() {}
}

// Strategy 3: Dependency injection with deferred resolution
class ServiceRegistry {
  private services = new Map<string, any>();

  register(name: string, factory: () => any) {
    this.services.set(name, { factory });
  }

  get(name: string): any {
    const entry = this.services.get(name);
    if (!entry) throw new Error(`Service ${name} not found`);

    if (!entry.instance) {
      entry.instance = entry.factory();
    }
    return entry.instance;
  }
}
```

---

## 5. Implementation Patterns

### 5.1 Complete TypeScript Implementation

```typescript
// circular-dependency-detector.ts

export interface DependencyNode {
  id: string;
  dependencies: string[];
  metadata?: {
    file?: string;
    line?: number;
    type?: string;
  };
}

export interface DetectedCycle {
  nodes: string[];
  paths: Array<{
    from: string;
    to: string;
    file?: string;
    line?: number;
  }>;
  type: 'direct' | 'indirect' | 'self';
}

export class CircularDependencyDetector {
  private graph = new Map<string, DependencyNode>();

  addNode(node: DependencyNode): void {
    this.graph.set(node.id, node);
  }

  addNodes(nodes: DependencyNode[]): void {
    nodes.forEach(node => this.addNode(node));
  }

  detectAll(): DetectedCycle[] {
    const cycles: DetectedCycle[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    for (const nodeId of this.graph.keys()) {
      if (!visited.has(nodeId)) {
        this.dfs(nodeId, visited, recursionStack, path, cycles);
      }
    }

    return cycles;
  }

  private dfs(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[],
    cycles: DetectedCycle[]
  ): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const node = this.graph.get(nodeId);
    if (!node) return;

    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        this.dfs(depId, visited, recursionStack, path, cycles);
      } else if (recursionStack.has(depId)) {
        // Found a cycle
        const cycleStart = path.indexOf(depId);
        const cycleNodes = [...path.slice(cycleStart), depId];

        cycles.push({
          nodes: cycleNodes,
          paths: this.buildCyclePaths(cycleNodes),
          type: this.determineCycleType(cycleNodes)
        });
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
  }

  private buildCyclePaths(cycleNodes: string[]): DetectedCycle['paths'] {
    const paths: DetectedCycle['paths'] = [];

    for (let i = 0; i < cycleNodes.length - 1; i++) {
      const fromNode = this.graph.get(cycleNodes[i]);
      paths.push({
        from: cycleNodes[i],
        to: cycleNodes[i + 1],
        file: fromNode?.metadata?.file,
        line: fromNode?.metadata?.line
      });
    }

    return paths;
  }

  private determineCycleType(nodes: string[]): DetectedCycle['type'] {
    if (nodes.length === 2 && nodes[0] === nodes[1]) {
      return 'self';
    } else if (nodes.length === 2) {
      return 'direct';
    } else {
      return 'indirect';
    }
  }

  getGraphStats() {
    return {
      totalNodes: this.graph.size,
      totalEdges: Array.from(this.graph.values())
        .reduce((sum, node) => sum + node.dependencies.length, 0),
      nodesWithNoDeps: Array.from(this.graph.values())
        .filter(node => node.dependencies.length === 0).length
    };
  }
}
```

### 5.2 Testing Implementation

```typescript
// circular-dependency-detector.test.ts

import { CircularDependencyDetector, DependencyNode } from './detector';

describe('CircularDependencyDetector', () => {
  it('should detect direct circular dependency', () => {
    const detector = new CircularDependencyDetector();

    detector.addNodes([
      { id: 'A', dependencies: ['B'] },
      { id: 'B', dependencies: ['A'] }
    ]);

    const cycles = detector.detectAll();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].type).toBe('direct');
    expect(cycles[0].nodes).toEqual(['A', 'B', 'A']);
  });

  it('should detect indirect circular dependency', () => {
    const detector = new CircularDependencyDetector();

    detector.addNodes([
      { id: 'A', dependencies: ['B'] },
      { id: 'B', dependencies: ['C'] },
      { id: 'C', dependencies: ['A'] }
    ]);

    const cycles = detector.detectAll();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].type).toBe('indirect');
  });

  it('should detect self-dependency', () => {
    const detector = new CircularDependencyDetector();

    detector.addNode({
      id: 'A',
      dependencies: ['A'],
      metadata: { file: 'a.ts', line: 10 }
    });

    const cycles = detector.detectAll();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].type).toBe('self');
    expect(cycles[0].paths[0]).toEqual({
      from: 'A',
      to: 'A',
      file: 'a.ts',
      line: 10
    });
  });

  it('should detect multiple independent cycles', () => {
    const detector = new CircularDependencyDetector();

    detector.addNodes([
      { id: 'A', dependencies: ['B'] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['D'] },
      { id: 'D', dependencies: ['C'] }
    ]);

    const cycles = detector.detectAll();
    expect(cycles).toHaveLength(2);
  });

  it('should handle complex graph correctly', () => {
    const detector = new CircularDependencyDetector();

    detector.addNodes([
      { id: 'A', dependencies: ['B', 'C'] },
      { id: 'B', dependencies: ['D'] },
      { id: 'C', dependencies: ['D'] },
      { id: 'D', dependencies: ['E'] },
      { id: 'E', dependencies: ['B'] }, // Creates cycle: B -> D -> E -> B
      { id: 'F', dependencies: [] } // Isolated, no cycle
    ]);

    const cycles = detector.detectAll();
    expect(cycles).toHaveLength(1);
    expect(cycles[0].nodes).toContain('B');
    expect(cycles[0].nodes).toContain('D');
    expect(cycles[0].nodes).toContain('E');
  });

  it('should provide graph statistics', () => {
    const detector = new CircularDependencyDetector();

    detector.addNodes([
      { id: 'A', dependencies: ['B', 'C'] },
      { id: 'B', dependencies: [] },
      { id: 'C', dependencies: [] }
    ]);

    const stats = detector.getGraphStats();
    expect(stats.totalNodes).toBe(3);
    expect(stats.totalEdges).toBe(2);
    expect(stats.nodesWithNoDeps).toBe(2);
  });
});
```

### 5.3 Integration with Build Tools

#### Webpack Plugin Example

```typescript
// CircularDependencyPlugin.ts

import { Compiler } from 'webpack';
import { CircularDependencyDetector } from './detector';

export class CircularDependencyPlugin {
  constructor(private options: {
    failOnError?: boolean;
    exclude?: RegExp[];
  } = {}) {}

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('CircularDependencyPlugin', (compilation) => {
      compilation.hooks.processModules.tapAsync('CircularDependencyPlugin', (modules, callback) => {
        const detector = new CircularDependencyDetector();

        // Build dependency graph from webpack modules
        modules.forEach((module: any) => {
          const dependencies = module.dependencies
            .map((dep: any) => dep.module?.identifier())
            .filter(Boolean);

          detector.addNode({
            id: module.identifier(),
            dependencies,
            metadata: {
              file: module.resource,
              type: module.type
            }
          });
        });

        const cycles = detector.detectAll();

        if (cycles.length > 0) {
          const message = this.formatCycles(cycles);

          if (this.options.failOnError) {
            compilation.errors.push(new Error(message));
          } else {
            compilation.warnings.push(new Error(message));
          }
        }

        callback();
      });
    });
  }

  private formatCycles(cycles: ReturnType<CircularDependencyDetector['detectAll']>): string {
    return cycles.map((cycle, i) => {
      const type = cycle.type.toUpperCase();
      const path = cycle.nodes.join(' → ');
      return `[${i + 1}] ${type} cycle: ${path}`;
    }).join('\n');
  }
}
```

---

## 6. Resources & References

### 6.1 GitHub Repositories

1. **madge** - Circular dependency detection for JavaScript/TypeScript
   - URL: https://github.com/palmerhq/madge
   - Key features: CLI tool, supports multiple module systems, visualization

2. **dependency-cruiser** - Detect and report on circular dependencies
   - URL: https://github.com/sverweij/dependency-cruiser
   - Key features: Configurable rules, JSON output, webpack plugin

3. **webpack circular-dependency-plugin**
   - URL: https://github.com/aackerman/circular-dependency-plugin
   - Key features: Webpack integration, build-time detection

4. **ts-dependencies** - TypeScript dependency analyzer
   - URL: https://github.com/pesterhazy/ts-dependencies
   - Key features: AST-based analysis, type-aware

### 6.2 Stack Overflow Discussions

1. "How to detect circular dependencies in JavaScript modules?"
   - URL: https://stackoverflow.com/questions/35043314/detect-circular-dependencies-in-javascript-modules
   - Key insights: Runtime detection strategies, CommonJS vs ES modules

2. "Best way to handle circular dependencies in Node.js"
   - URL: https://stackoverflow.com/questions/10895262/handle-circular-dependencies-in-node-js
   - Key insights: Lazy loading, dependency injection, refactoring patterns

### 6.3 Blog Posts & Articles

1. "Understanding and Solving Circular Dependencies in JavaScript"
   - URL: https://www.davidmccabe.com/circular-dependencies-javascript
   - Topics: Detection, prevention, refactoring strategies

2. "Circular Dependencies in Node.js: How to Detect and Avoid Them"
   - URL: (Various Medium articles and blog posts)
   - Topics: Common patterns, detection tools, architectural solutions

3. "Dependency Injection and Circular Dependencies"
   - URL: https://michalzalecki.com/avoid-circular-dependencies-in-node-js/
   - Topics: Dependency injection pattern, inversion of control

### 6.4 Academic Resources

1. **Graph Theory Fundamentals**
   - "Introduction to Algorithms" (CLRS) - Chapter 22: Elementary Graph Algorithms
   - Topics: DFS, topological sort, cycle detection

2. **Topological Sorting**
   - Kahn's algorithm (1962)
   - Applications: Dependency resolution, build systems

3. **Tarjan's Strongly Connected Components Algorithm**
   - Useful for finding all cycles in a graph
   - Time complexity: O(V + E)

### 6.5 Related Tools

1. **ESLint Plugins**
   - eslint-plugin-import
   - eslint-plugin-dependencies
   - Feature: Static analysis for import cycles

2. **IDE Integrations**
   - VS Code: "Import Cost" extension
   - WebStorm: Built-in dependency analysis
   - Feature: Real-time cycle detection

3. **Static Analysis Tools**
   - TypeScript Compiler API
   - Babel AST traversal
   - Feature: Build-time detection without execution

### 6.6 Key Takeaways Summary

**Detection Algorithms:**
- DFS with coloring is the most common and efficient approach
- Time complexity: O(V + E) where V = vertices, E = edges
- Topological sort can also be used but requires additional processing

**Testing Best Practices:**
- Test direct cycles, indirect cycles, and self-dependencies
- Include edge cases: empty graphs, missing dependencies, large graphs
- Verify both cycle detection and error message quality

**Implementation Patterns:**
- Use both build-time and runtime detection for maximum safety
- Provide detailed error messages with file locations and cycle paths
- Consider performance for large graphs (caching, incremental analysis)

**Prevention Strategies:**
- Architectural constraints (layer enforcement, dependency rules)
- Design patterns (dependency inversion, event-driven architecture)
- Tooling (linters, IDE plugins, pre-commit hooks)

**When to Detect:**
- Creation time (build/compile time) is preferred for better developer experience
- Execution time is necessary for dynamic dependencies
- Best approach: Use both for comprehensive coverage

---

## Implementation Checklist

When implementing circular dependency detection:

- [ ] Choose detection algorithm (DFS coloring recommended)
- [ ] Implement build-time detection (webpack plugin, CLI tool)
- [ ] Implement runtime detection (optional, for dynamic dependencies)
- [ ] Create comprehensive test suite including edge cases
- [ ] Add performance tests for large graphs
- [ ] Implement detailed error reporting with file locations
- [ ] Add visualization options (ASCII art, graph output)
- [ ] Document configuration options
- [ ] Create examples and usage documentation
- [ ] Consider IDE integration for real-time feedback

---

**End of Research Document**
