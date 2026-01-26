# Tree Visualization for Hierarchical Data

**Research Date:** 2025-01-23
**Purpose:** Research tree visualization patterns and libraries for CLI hierarchical data display

---

## Table of Contents

1. [ASCII Tree Characters](#ascii-tree-characters)
2. [Common Patterns](#common-patterns)
3. [Node.js Libraries](#nodejs-libraries)
4. [Implementation Examples](#implementation-examples)
5. [Use Cases](#use-cases)

---

## ASCII Tree Characters

### Standard ASCII Characters

```
# Vertical and horizontal
│  (U+2502) Box Drawings Light Vertical
├─ (U+251C + U+2500) Box Drawings Light Vertical and Right
└─ (U+2514 + U+2500) Box Drawings Light Up and Right
── (U+2500) Box Drawings Light Horizontal

# Extended characters
┌── (U+250C + U+2500) Top-left corner
┐── (U+2510 + U+2500) Top-right corner
└── (U+2514 + U+2500) Bottom-left corner
┘── (U+2518 + U+2500) Bottom-right corner
```

### Basic ASCII (7-bit)

For maximum compatibility, use standard ASCII:

```
+-- node
|   +-- child
|   +-- child
+-- node
    +-- child
```

### Unicode Box-Drawing

For modern terminals, use Unicode characters:

```
├── node
│   ├── child
│   └── child
└── node
    └── child
```

### Alternative Styles

```bash
# Asterisk style
* node
  * child
  * child

# Hyphen style
|- node
|  |- child
|  `- child
`- node
   `- child

# Plus style
+- node
|  +- child
|  +- child
+- node
   +- child
```

---

## Common Patterns

### Pattern 1: File System Tree

```bash
$ tree
.
├── src
│   ├── index.ts
│   ├── cli
│   │   ├── index.ts
│   │   └── commands
│   │       ├── task.ts
│   │       └── status.ts
│   └── utils
│       └── helpers.ts
├── tests
│   └── test.ts
├── package.json
└── tsconfig.json
```

### Pattern 2: Dependency Tree

```bash
$ npm list
hacky-hack@0.1.0 /home/dustin/project
├─┬ cli-progress@3.12.0
│ └── supports-color@8.1.1
├─┬ commander@14.0.2
└─┬ pino@9.14.0
  ├─┬ pino-abstract-transport@1.0.0
  │ └── thread-stream@2.3.0
  └── sonic-boom@3.7.0
```

### Pattern 3: Git Branch Tree

```bash
$ git log --graph --oneline --all
* abc123 (HEAD -> main) Add feature
* def456 Fix bug
| * ghi789 (feature) Other work
|/
* jkl012 Initial commit
```

### Pattern 4: Process Tree

```bash
$ pstree -p
systemd(1)─┬─NetworkManager(684)
           ├─cron(789)
           ├─sshd(800)───sshd(1234)───bash(1245)───pstree(5678)
           └─node(900)───node(901)───node(902)
```

### Pattern 5: Task Hierarchy

```bash
$ hacky-hack task list --tree
Phase 1
├── Milestone 1
│   ├── Task 1.1 (Complete)
│   ├── Task 1.2 (In Progress)
│   │   ├── Subtask 1.2.1 (Complete)
│   │   └── Subtask 1.2.2 (Pending)
│   └── Task 1.3 (Pending)
└── Milestone 2
    └── Task 2.1 (Pending)
```

---

## Node.js Libraries

### 1. treelib (Python - Reference)

**Not available for Node.js**, but useful for pattern reference

**Pattern:**

```python
from treelib import Tree
tree = Tree()
tree.create_node("Root", "root")
tree.create_node("Child", "child", parent="root")
tree.show()
```

### 2. Custom Implementation (Recommended)

Implement custom tree renderer for maximum flexibility:

```typescript
interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  status?: string;
}

function renderTree(
  nodes: TreeNode[],
  options?: {
    prefix?: string;
    last?: boolean;
  }
): string {
  const { prefix = '', last = false } = options || {};

  return nodes
    .map((node, index) => {
      const isLast = index === nodes.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      let line = prefix + connector + node.name;

      if (node.status) {
        line += ' ' + chalk.gray(`[${node.status}]`);
      }

      let result = [line];

      if (node.children && node.children.length > 0) {
        const childLines = renderTree(node.children, {
          prefix: prefix + childPrefix,
          last: isLast,
        });
        result = result.concat(childLines);
      }

      return result.join('\n');
    })
    .join('\n');
}
```

### 3. cli-tree

**NPM:** https://www.npmjs.com/package/cli-tree

```typescript
const tree = require('cli-tree');

const data = {
  name: 'root',
  children: [{ name: 'child1' }, { name: 'child2' }],
};

console.log.tree(data);
```

**Note:** Small library, less popular

### 4. tree-cli

**NPM:** https://www.npmjs.com/package/tree-cli

Command-line tree generator, not a library for programmatic use

### 5. ascii-tree

**NPM:** https://www.npmjs.com/package/ascii-tree

Simple ASCII tree generator:

```typescript
const tree = require('ascii-tree');

const treeStr = tree.generate({
  root: {
    child1: null,
    child2: {
      grandchild: null,
    },
  },
});

console.log(treeStr);
```

---

## Implementation Examples

### Example 1: Basic Tree Renderer

```typescript
import chalk from 'chalk';

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

export function renderTree(
  node: TreeNode,
  prefix: string = '',
  isLast: boolean = true
): string {
  const connector = isLast ? '└── ' : '├── ';
  const line = prefix + connector + node.name;
  let result = [line];

  if (node.children && node.children.length > 0) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const lines = node.children.map((child, index) => {
      const isChildLast = index === node.children!.length - 1;
      return renderTree(child, childPrefix, isChildLast);
    });
    result = result.concat(lines);
  }

  return result.join('\n');
}

// Usage
const tree: TreeNode = {
  name: 'Project',
  children: [
    {
      name: 'src',
      children: [
        { name: 'index.ts' },
        { name: 'cli.ts' },
        {
          name: 'utils',
          children: [{ name: 'helpers.ts' }, { name: 'logger.ts' }],
        },
      ],
    },
    {
      name: 'tests',
      children: [{ name: 'test.ts' }],
    },
    { name: 'package.json' },
  ],
};

console.log(renderTree(tree));
```

**Output:**

```
└── Project
    ├── src
    │   ├── index.ts
    │   ├── cli.ts
    │   └── utils
    │       ├── helpers.ts
    │       └── logger.ts
    ├── tests
    │   └── test.ts
    └── package.json
```

### Example 2: Colored Status Tree

```typescript
interface TaskNode {
  id: string;
  title: string;
  status: 'Complete' | 'In Progress' | 'Pending' | 'Blocked';
  children?: TaskNode[];
}

function getStatusIcon(status: TaskNode['status']): string {
  switch (status) {
    case 'Complete':
      return chalk.green('✓');
    case 'In Progress':
      return chalk.blue('◐');
    case 'Blocked':
      return chalk.red('✗');
    case 'Pending':
    default:
      return chalk.gray('○');
  }
}

function renderTaskTree(
  node: TaskNode,
  prefix: string = '',
  isLast: boolean = true
): string {
  const connector = isLast ? '└── ' : '├── ';
  const icon = getStatusIcon(node.status);
  const line =
    prefix + connector + icon + ' ' + chalk.bold(node.id) + ' ' + node.title;

  let result = [line];

  if (node.children && node.children.length > 0) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const lines = node.children.map((child, index) => {
      const isChildLast = index === node.children!.length - 1;
      return renderTaskTree(child, childPrefix, isChildLast);
    });
    result = result.concat(lines);
  }

  return result.join('\n');
}

// Usage
const taskTree: TaskNode = {
  id: 'P1',
  title: 'Phase 1',
  status: 'In Progress',
  children: [
    {
      id: 'P1M1',
      title: 'Milestone 1',
      status: 'Complete',
      children: [
        { id: 'P1M1T1', title: 'Task 1', status: 'Complete' },
        { id: 'P1M1T2', title: 'Task 2', status: 'Complete' },
      ],
    },
    {
      id: 'P1M2',
      title: 'Milestone 2',
      status: 'In Progress',
      children: [
        { id: 'P1M2T1', title: 'Task 3', status: 'Complete' },
        { id: 'P1M2T2', title: 'Task 4', status: 'In Progress' },
      ],
    },
  ],
};

console.log(renderTaskTree(taskTree));
```

**Output:**

```
└── ◐ P1 Phase 1
    ├── ✓ P1M1 Milestone 1
    │   ├── ✓ P1M1T1 Task 1
    │   └── ✓ P1M1T2 Task 2
    └── ◐ P1M2 Milestone 2
        ├── ✓ P1M2T1 Task 3
        └── ◐ P1M2T2 Task 4
```

### Example 3: Git-Style Graph

```typescript
interface Commit {
  hash: string;
  message: string;
  branches: string[];
  parents: string[];
}

function renderGitLog(commits: Commit[]): string {
  const lines: string[] = [];

  commits.forEach((commit, index) => {
    const isFirst = index === commits.length - 1;
    const connector = isFirst ? '└─' : '├─';
    const branchInfo =
      commit.branches.length > 0 ? ` (${commit.branches.join(', ')})` : '';

    let line = connector + ' ' + chalk.yellow(commit.hash) + branchInfo;
    line += ' ' + commit.message;

    lines.push(line);

    // Add vertical line if not last
    if (!isFirst) {
      lines.push('│');
    }
  });

  return lines.join('\n');
}

// Usage
const commits: Commit[] = [
  {
    hash: 'abc123',
    message: 'Add new feature',
    branches: ['HEAD', 'main'],
    parents: ['def456'],
  },
  {
    hash: 'def456',
    message: 'Fix bug',
    branches: [],
    parents: ['ghi789'],
  },
  {
    hash: 'ghi789',
    message: 'Initial commit',
    branches: [],
    parents: [],
  },
];

console.log(renderGitLog(commits));
```

**Output:**

```
├─ abc123 (HEAD, main) Add new feature
│
├─ def456 Fix bug
│
└─ ghi789 Initial commit
```

### Example 4: Dependency Tree

```typescript
interface PackageNode {
  name: string;
  version: string;
  dependencies?: PackageNode[];
}

function renderDepTree(
  node: PackageNode,
  prefix: string = '',
  isLast: boolean = true
): string {
  const connector = isLast ? '└─┬' : '├─┬';
  const line =
    prefix + connector + ' ' + chalk.cyan(node.name) + '@' + node.version;

  let result = [line];

  if (node.dependencies && node.dependencies.length > 0) {
    const childPrefix = prefix + (isLast ? '  │' : '│ │');
    const lines = node.dependencies.map((dep, index) => {
      const isChildLast = index === node.dependencies!.length - 1;
      return renderDepTree(dep, childPrefix, isChildLast);
    });
    result = result.concat(lines);
  } else {
    const endConnector = isLast ? '  └──' : '│ └──';
    result.push(prefix + endConnector + ' (empty)');
  }

  return result.join('\n');
}

// Usage
const depTree: PackageNode = {
  name: 'hacky-hack',
  version: '0.1.0',
  dependencies: [
    {
      name: 'cli-progress',
      version: '3.12.0',
      dependencies: [{ name: 'supports-color', version: '8.1.1' }],
    },
    {
      name: 'commander',
      version: '14.0.2',
    },
  ],
};

console.log(renderDepTree(depTree));
```

**Output:**

```
└─┬ hacky-hack@0.1.0
  │
  ├─┬ cli-progress@3.12.0
  │ │
  │ └─┬ supports-color@8.1.1
  │     └── (empty)
  │
  └─┬ commander@14.0.2
      └── (empty)
```

### Example 5: Interactive Tree (Select/Collapse)

```typescript
import readline from 'readline';

interface CollapsibleNode {
  name: string;
  collapsed?: boolean;
  children?: CollapsibleNode[];
}

function renderCollapsibleTree(
  node: CollapsibleNode,
  prefix: string = '',
  isLast: boolean = true
): string {
  const hasChildren = node.children && node.children.length > 0;
  const connector = isLast ? '└── ' : '├── ';
  const icon = hasChildren ? (node.collapsed ? '+' : '-') : ' ';

  const line = prefix + connector + icon + ' ' + node.name;
  let result: string[] = [line];

  if (hasChildren && !node.collapsed) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const lines = node.children!.map((child, index) => {
      const isChildLast = index === node.children!.length - 1;
      return renderCollapsibleTree(child, childPrefix, isChildLast);
    });
    result = result.concat(lines);
  }

  return result.join('\n');
}

// Toggle node collapse
function toggleNode(root: CollapsibleNode, path: number[]): CollapsibleNode {
  // Implementation to toggle node at given path
  return root;
}
```

---

## Use Cases

### Use Case 1: Task Breakdown

Display task hierarchy with progress:

```bash
$ hacky-hack task breakdown P1
Phase 1
├── Milestone 1 (Complete)
│   ├── Task 1.1 ✓
│   └── Task 1.2 ✓
└── Milestone 2 (In Progress)
    ├── Task 2.1 ✓
    └── Task 2.2 ◐
```

### Use Case 2: File Structure

Display project structure:

```bash
$ hacky-hack structure
project/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   └── utils/
│   └── core/
├── tests/
└── docs/
```

### Use Case 3: Dependency Graph

Display dependency relationships:

```bash
$ hacky-hack deps
hacky-hack@0.1.0
├── cli-progress@3.12.0
│   └── supports-color@8.1.1
├── commander@14.0.2
└── pino@9.14.0
    ├── pino-abstract-transport@1.0.0
    └── sonic-boom@3.7.0
```

### Use Case 4: Command History

Display command execution history:

```bash
$ hacky-hack history --tree
prd create
├── P1: Initialize
├── P2: Setup
│   ├── P2M1: Configure
│   └── P2M2: Install
└── P3: Build
    ├── P3M1: Compile
    └── P3M2: Test
```

### Use Case 5: Pipeline Flow

Display pipeline stages:

```bash
$ hacky-hack pipeline visualize
Pipeline: PRD Development
├── Phase 1: Planning (Complete)
│   ├── Analyze Requirements
│   ├── Create PRD
│   └── Review PRD
├── Phase 2: Development (In Progress)
│   ├── Setup Environment ✓
│   ├── Implement Features ◐
│   └── Write Tests ○
└── Phase 3: Deployment (Pending)
    ├── Build ○
    ├── Test ○
    └── Deploy ○
```

---

## Best Practices

### 1. Character Selection

- Use Unicode box-drawing characters for modern terminals
- Provide ASCII fallback for compatibility
- Test with different terminal emulators

### 2. Color Coding

- Use colors to indicate status/state
- Don't rely on color alone (use symbols too)
- Respect NO_COLOR environment variable
- Detect color support automatically

### 3. Indentation

- Use consistent spacing (usually 4 spaces per level)
- Align connectors properly
- Handle long lines gracefully

### 4. Truncation

- Truncate long names
- Provide `--no-trunc` option
- Use ellipsis to indicate truncation

### 5. Performance

- For large trees, consider lazy rendering
- Implement pagination for very large trees
- Cache rendered output when possible

### 6. Accessibility

- Ensure tree is readable with color disabled
- Use clear symbols (✓, ✗, ○)
- Consider screen reader compatibility

### 7. Output Format

- Provide JSON output for programmatic access
- Support different depth levels (`--depth`)
- Allow filtering by status/label

---

## Implementation Template

```typescript
// src/utils/tree-renderer.ts
import chalk from 'chalk';

export interface TreeNode<T = any> {
  id: string;
  name: string;
  data?: T;
  children?: TreeNode<T>[];
  collapsed?: boolean;
}

export interface TreeRenderOptions {
  showStatus?: boolean;
  getStatus?: (node: TreeNode) => string;
  formatNode?: (node: TreeNode) => string;
  maxDepth?: number;
}

export function renderTree(
  root: TreeNode,
  options: TreeRenderOptions = {}
): string {
  const {
    showStatus = false,
    getStatus,
    formatNode,
    maxDepth = Infinity,
  } = options;

  function render(
    node: TreeNode,
    prefix: string = '',
    isLast: boolean = true,
    depth: number = 0
  ): string[] {
    if (depth > maxDepth) {
      return [];
    }

    const connector = isLast ? '└── ' : '├── ';
    const status =
      showStatus && getStatus ? ` ${chalk.gray(getStatus(node))}` : '';
    const name = formatNode ? formatNode(node) : node.name;

    let result: string[] = [prefix + connector + name + status];

    if (node.children && node.children.length > 0 && !node.collapsed) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const lines = node.children.flatMap((child, index) => {
        const isChildLast = index === node.children!.length - 1;
        return render(child, childPrefix, isChildLast, depth + 1);
      });
      result = result.concat(lines);
    }

    return result;
  }

  return render(root).join('\n');
}

// Convenience functions
export function renderFileTree(root: TreeNode): string {
  return renderTree(root);
}

export function renderDependencyTree(root: TreeNode): string {
  return renderTree(root, {
    formatNode: node => chalk.cyan(node.name),
  });
}

export function renderTaskTree(root: TreeNode): string {
  return renderTree(root, {
    showStatus: true,
    getStatus: node => node.data?.status || '',
    formatNode: node => chalk.bold(node.name),
  });
}
```

---

## URLs and Resources

### Libraries

- **ascii-tree**: https://www.npmjs.com/package/ascii-tree
- **cli-tree**: https://www.npmjs.com/package/cli-tree
- **tree-cli**: https://www.npmjs.com/package/tree-cli

### References

- **Unix tree command**: https://linux.die.net/man/1/tree
- **Box-drawing characters**: https://en.wikipedia.org/wiki/Box-drawing_character
- **npm list source**: https://github.com/npm/cli/blob/latest/lib/commands/list.js

### Examples

- **git log --graph**: https://git-scm.com/docs/git-log
- **npm list**: https://docs.npmjs.com/cli/v9/commands/npm-list
- **tree command**: https://github.com/OSSIA/tree-cli

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
