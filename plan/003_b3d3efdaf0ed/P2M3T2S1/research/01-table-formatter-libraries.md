# CLI Table Formatter Libraries Research

**Research Date:** 2025-01-23
**Purpose:** Research and compare table formatter libraries for TypeScript/Node.js CLI output

---

## Table of Contents

1. [Library Comparison](#library-comparison)
2. [cli-table3](#cli-table3)
3. [table](#table)
4. [tty-table](#tty-table)
5. [Other Alternatives](#other-alternatives)
6. [Code Examples](#code-examples)
7. [Recommendation](#recommendation)

---

## Library Comparison

| Feature            | cli-table3     | table    | tty-table | console.table    |
| ------------------ | -------------- | -------- | --------- | ---------------- |
| TypeScript Support | ✓ (via @types) | ✓        | ✓         | ✓ (native)       |
| Custom Borders     | ✓              | ✓        | ✓         | ✗                |
| Word Wrap          | ✓              | ✓        | ✓         | ✗                |
| Colors             | Via chalk      | Built-in | Built-in  | ✗                |
| Column Alignment   | ✓              | ✓        | ✓         | ✗                |
| Auto-sizing        | Limited        | ✓        | ✓         | Limited          |
| Truncation         | Manual         | ✓        | ✓         | Manual           |
| Merge Cells        | ✓              | ✓        | ✓         | ✗                |
| Stream Output      | ✗              | ✗        | ✓         | ✓                |
| Bundle Size        | Small          | Medium   | Large     | Zero (built-in)  |
| Maintenance        | Stable         | Active   | Active    | Native           |
| Weekly Downloads   | 1.2M           | 500K     | 100K      | N/A              |
| **Recommended**    | **Yes**        | **Yes**  | Maybe     | For simple cases |

---

## cli-table3

### Overview

**NPM:** https://www.npmjs.com/package/cli-table3
**GitHub:** https://github.com/cli-table/cli-table3
**Version:** 3.2.0 (latest)
**License:** MIT
**Type Definitions:** https://www.npmjs.com/package/@types/cli-table3

### Installation

```bash
npm install cli-table3
npm install @types/cli-table3 --save-dev
```

### TypeScript Types

```typescript
// Table options
interface TableOptions {
  chars?: CharName;
  truncate?: string;
  colWidths?: number[];
  colAligns?: ('left' | 'center' | 'right')[];
  style?: {
    'padding-left'?: number;
    'padding-right'?: number;
    head?: string[];
    border?: string[];
    compact?: boolean;
  };
  head?: string[];
  wordWrap?: boolean;
}

// Horizontal/Vertical characters
interface CharName {
  top: string;
  'top-mid': string;
  'top-left': string;
  'top-right': string;
  bottom: string;
  'bottom-mid': string;
  'bottom-left': string;
  'bottom-right': string;
  left: string;
  'left-mid': string;
  mid: string;
  'mid-mid': string;
  right: string;
  'right-mid': string;
  middle: string;
}

// Table interface
interface Table {
  push(row: any[]): void;
  toString(): string;
  width: number;
}
```

### Basic Usage

```typescript
import Table from 'cli-table3';

// Simple table
const table = new Table({
  head: ['ID', 'Name', 'Status'],
  colWidths: [20, 30, 15],
});

table.push(['P1M1T1', 'Task 1', 'Complete']);
table.push(['P1M1T2', 'Task 2', 'In Progress']);

console.log(table.toString());
```

**Output:**

```
┌────────────────────┬───────────────────────────────┬─────────────────┐
│ ID                 │ Name                          │ Status          │
├────────────────────┼───────────────────────────────┼─────────────────┤
│ P1M1T1             │ Task 1                        │ Complete        │
├────────────────────┼───────────────────────────────┼─────────────────┤
│ P1M1T2             │ Task 2                        │ In Progress     │
└────────────────────┴───────────────────────────────┴─────────────────┘
```

### Custom Borders

```typescript
// Minimal border style
const minimalTable = new Table({
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
  head: ['ID', 'Name', 'Status'],
});

minimalTable.push(['P1M1T1', 'Task 1', 'Complete']);

console.log(minimalTable.toString());
```

**Output:**

```
ID      Name     Status
P1M1T1  Task 1   Complete
```

### With Colors (using chalk)

```typescript
import Table from 'cli-table3';
import chalk from 'chalk';

const table = new Table({
  head: [chalk.cyan('ID'), chalk.cyan('Name'), chalk.cyan('Status')],
  colAligns: ['left', 'left', 'center'],
});

table.push(['P1M1T1', 'Task 1', chalk.green('Complete')]);
table.push(['P1M1T2', 'Task 2', chalk.yellow('In Progress')]);

console.log(table.toString());
```

### Column Alignment

```typescript
const table = new Table({
  head: ['Left', 'Center', 'Right'],
  colAligns: ['left', 'center', 'right'],
  colWidths: [20, 20, 20],
});

table.push(['text', 'text', 'text']);
console.log(table.toString());
```

### Dynamic Data

```typescript
interface Task {
  id: string;
  title: string;
  status: string;
}

const tasks: Task[] = [
  { id: 'P1M1T1', title: 'Task 1', status: 'Complete' },
  { id: 'P1M1T2', title: 'Task 2', status: 'In Progress' },
];

const table = new Table({
  head: ['ID', 'Title', 'Status'],
});

tasks.forEach(task => {
  table.push([task.id, task.title, task.status]);
});

console.log(table.toString());
```

### Pros

- Simple, intuitive API
- Highly customizable borders
- Good TypeScript support via @types
- Stable and mature
- Wide adoption
- Works well with chalk
- Column alignment control
- Word wrap support

### Cons

- Manual column width management
- No auto-sizing by default
- Limited built-in styling (requires chalk)
- No built-in truncation
- Older API design

---

## table

### Overview

**NPM:** https://www.npmjs.com/package/table
**GitHub:** https://github.com/gajus/table
**Version:** 6.8.0 (latest)
**License:** BSD-3-Clause
**TypeScript Support:** Native

### Installation

```bash
npm install table
```

### TypeScript Types

```typescript
import { table, getBorderCharacters } from 'table';

interface TableConfig {
  columns?: {
    alignment?: 'left' | 'center' | 'right';
    width?: number;
    wrapWord?: boolean;
    truncate?: number;
    paddingLeft?: number;
    paddingRight?: number;
  }[];
  border?: {
    topBody?: string;
    topJoin?: string;
    topLeft?: string;
    topRight?: string;
    bottomBody?: string;
    bottomJoin?: string;
    bottomLeft?: string;
    bottomRight?: string;
    bodyLeft?: string;
    bodyRight?: string;
    bodyJoin?: string;
    joinBody?: string;
    joinLeft?: string;
    joinRight?: string;
    joinJoin?: string;
  };
  drawHorizontalLine?: (index: number, size: number) => boolean;
  singleLine?: boolean;
}

interface Table {
  toString(): string;
}
```

### Basic Usage

```typescript
import { table } from 'table';

const data = [
  ['ID', 'Name', 'Status'],
  ['P1M1T1', 'Task 1', 'Complete'],
  ['P1M1T2', 'Task 2', 'In Progress'],
];

const output = table(data);
console.log(output);
```

### Auto-Sizing

```typescript
import { table } from 'table';

const data = [
  ['ID', 'Name', 'Status'],
  ['P1M1T1', 'Very Long Task Name That Should Wrap', 'Complete'],
  ['P1M1T2', 'Task 2', 'In Progress'],
];

const config = {
  columns: {
    1: {
      width: 30,
      wrapWord: true,
    },
  },
};

const output = table(data, config);
console.log(output);
```

### Custom Borders

```typescript
import { table, getBorderCharacters } from 'table';

const data = [
  ['ID', 'Name', 'Status'],
  ['P1M1T1', 'Task 1', 'Complete'],
];

const config = {
  border: getBorderCharacters('ramac'), // or 'honeywell', 'norc', 'braille'
};

const output = table(data, config);
```

### Column Alignment

```typescript
const data = [
  ['Left', 'Center', 'Right'],
  ['text', 'text', 'text'],
];

const config = {
  columns: {
    0: { alignment: 'left' },
    1: { alignment: 'center' },
    2: { alignment: 'right' },
  },
};

const output = table(data, config);
console.log(output);
```

### Truncation

```typescript
const data = [
  ['ID', 'Description', 'Status'],
  [
    'P1M1T1',
    'This is a very long description that should be truncated',
    'Active',
  ],
];

const config = {
  columns: {
    1: {
      width: 30,
      truncate: 27, // leaves room for '...'
    },
  },
};

const output = table(data, config);
console.log(output);
```

### Pros

- Native TypeScript support
- Auto-sizing columns
- Word wrapping built-in
- Truncation support
- Multiple border styles
- Smart line drawing
- Active maintenance
- Good documentation

### Cons

- Larger bundle size
- More complex API
- Steeper learning curve
- Less widely adopted than cli-table3

---

## tty-table

### Overview

**NPM:** https://www.npmjs.com/package/tty-table
**GitHub:** https://github.com/teclas-concept/tty-table
**Version:** 4.2.1 (latest)
**License:** MIT
**TypeScript Support:** Native

### Installation

```bash
npm install tty-table
```

### TypeScript Types

```typescript
import { Table } from 'tty-table';

interface ColumnOptions {
  name: string;
  key: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  formatter?: (value: any) => string;
}

interface TableOptions {
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'none';
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  truncate?: string;
  width?: string | number;
}

class Table {
  constructor(columns: ColumnOptions[], rows: any[], options?: TableOptions);
  render(): string;
}
```

### Basic Usage

```typescript
import { Table } from 'tty-table';

const columns = [
  { name: 'ID', key: 'id' },
  { name: 'Name', key: 'name' },
  { name: 'Status', key: 'status' },
];

const rows = [
  { id: 'P1M1T1', name: 'Task 1', status: 'Complete' },
  { id: 'P1M1T2', name: 'Task 2', status: 'In Progress' },
];

const t1 = Table(columns, rows);
console.log(t1.render());
```

### With Custom Formatting

```typescript
const columns = [
  { name: 'ID', key: 'id', width: '10%', color: 'cyan' },
  { name: 'Name', key: 'name', width: '60%', align: 'left' },
  {
    name: 'Status',
    key: 'status',
    width: '30%',
    formatter: (value: string) => {
      if (value === 'Complete') return '\x1b[32m' + value + '\x1b[0m';
      if (value === 'In Progress') return '\x1b[33m' + value + '\x1b[0m';
      return value;
    },
  },
];
```

### With Colors

```typescript
import { Table } from 'tty-table';

const columns = [
  { name: 'ID', key: 'id', color: 'cyan' },
  { name: 'Name', key: 'name', color: 'white' },
  { name: 'Status', key: 'status', color: 'yellow' },
];

const rows = [{ id: 'P1M1T1', name: 'Task 1', status: 'Complete' }];

const options = {
  borderColor: 'blue',
  borderStyle: 'solid',
};

const t1 = Table(columns, rows, options);
console.log(t1.render());
```

### Pros

- Native TypeScript support
- Built-in color support
- Percentage-based column widths
- Custom formatters per column
- Clean, modern API
- Smart column sizing
- Good for interactive CLIs

### Cons

- Larger bundle size
- Less popular than cli-table3
- More specialized (TTY-focused)
- May not work well for non-TTY output

---

## Other Alternatives

### console.table (Node.js Built-in)

**No installation required**

```typescript
const tasks = [
  { id: 'P1M1T1', name: 'Task 1', status: 'Complete' },
  { id: 'P1M1T2', name: 'Task 2', status: 'In Progress' },
];

console.table(tasks);
```

**Pros:**

- Zero dependencies
- Built into Node.js
- Simple to use

**Cons:**

- No customization
- No borders
- No control over output
- Inconsistent across environments
- Not suitable for production CLI

### cli-table2 (Deprecated)

**Note:** Superseded by cli-table3

### easy-table

**NPM:** https://www.npmjs.com/package/easy-table

Lightweight alternative with simpler API

### columnify

**NPM:** https://www.npmjs.com/package/columnify

Very simple column alignment, no borders

---

## Code Examples

### Example 1: Task Status Display

**Using cli-table3:**

```typescript
import Table from 'cli-table3';
import chalk from 'chalk';

interface Task {
  id: string;
  title: string;
  status: 'Planned' | 'In Progress' | 'Complete';
}

function getStatusColor(status: Task['status']): string {
  switch (status) {
    case 'Complete':
      return chalk.green(status);
    case 'In Progress':
      return chalk.yellow(status);
    case 'Planned':
      return chalk.gray(status);
    default:
      return status;
  }
}

function displayTasks(tasks: Task[]): void {
  const table = new Table({
    head: [chalk.cyan('ID'), chalk.cyan('Title'), chalk.cyan('Status')],
    colWidths: [15, 50, 15],
    style: {
      head: [],
      border: ['gray'],
    },
  });

  tasks.forEach(task => {
    table.push([task.id, task.title, getStatusColor(task.status)]);
  });

  console.log(table.toString());
}

// Usage
const tasks: Task[] = [
  { id: 'P1M1T1', title: 'Implement feature', status: 'Complete' },
  { id: 'P1M1T2', title: 'Write tests', status: 'In Progress' },
  { id: 'P1M1T3', title: 'Documentation', status: 'Planned' },
];

displayTasks(tasks);
```

### Example 2: Wide Format

**Using table library:**

```typescript
import { table } from 'table';

interface Pod {
  name: string;
  ready: string;
  status: string;
  restarts: number;
  age: string;
  ip: string;
  node: string;
}

function displayPodsWide(pods: Pod[]): void {
  const data = [
    ['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE', 'IP', 'NODE'],
    ...pods.map(pod => [
      pod.name,
      pod.ready,
      pod.status,
      pod.restarts.toString(),
      pod.age,
      pod.ip,
      pod.node,
    ]),
  ];

  const config = {
    columns: {
      0: { width: 30, alignment: 'left' },
      1: { width: 8, alignment: 'center' },
      2: { width: 15, alignment: 'left' },
      3: { width: 8, alignment: 'right' },
      4: { width: 8, alignment: 'right' },
      5: { width: 15, alignment: 'left' },
      6: { width: 20, alignment: 'left' },
    },
  };

  console.log(table(data, config));
}
```

### Example 3: Filtered and Sorted

**Using cli-table3:**

```typescript
import Table from 'cli-table3';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
}

function displayFilteredTasks(
  tasks: Task[],
  filterStatus?: string,
  sortBy: 'id' | 'priority' = 'priority'
): void {
  let filtered = tasks;

  if (filterStatus) {
    filtered = tasks.filter(t => t.status === filterStatus);
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      return b.priority - a.priority; // Descending
    }
    return a.id.localeCompare(b.id);
  });

  const table = new Table({
    head: ['ID', 'Priority', 'Title', 'Status'],
    colWidths: [10, 10, 50, 15],
  });

  sorted.forEach(task => {
    table.push([task.id, task.priority.toString(), task.title, task.status]);
  });

  console.log(table.toString());
}
```

### Example 4: Multi-Section Display

```typescript
import Table from 'cli-table3';
import chalk from 'chalk';

interface Section {
  title: string;
  data: any[][];
}

function displayMultiSection(sections: Section[]): void {
  sections.forEach((section, index) => {
    if (index > 0) {
      console.log('');
    }

    console.log(chalk.bold(section.title));
    console.log(chalk.gray('='.repeat(section.title.length)));

    const table = new Table({
      head: section.data[0],
      colWidths: section.data[0].map(() => 20),
    });

    section.data.slice(1).forEach(row => {
      table.push(row);
    });

    console.log(table.toString());
  });
}

// Usage
displayMultiSection([
  {
    title: 'Active Tasks',
    data: [
      ['ID', 'Name', 'Status'],
      ['P1M1T1', 'Task 1', 'Active'],
      ['P1M1T2', 'Task 2', 'Active'],
    ],
  },
  {
    title: 'Completed Tasks',
    data: [
      ['ID', 'Name', 'Status'],
      ['P1M2T1', 'Task 3', 'Complete'],
      ['P1M2T2', 'Task 4', 'Complete'],
    ],
  },
]);
```

---

## Recommendation

### Primary Recommendation: cli-table3

**Reasons:**

1. **Proven Track Record**: Most widely used, battle-tested
2. **Simple API**: Easy to learn and use
3. **Great TypeScript Support**: Via @types/cli-table3
4. **Flexibility**: Highly customizable borders and styles
5. **Integration**: Works excellently with chalk for colors
6. **Bundle Size**: Small footprint
7. **Familiarity**: Similar patterns to other popular CLIs

### When to Use table Library Instead

- Need automatic column sizing
- Require word wrapping
- Want truncation built-in
- Need multiple border styles
- Prefer native TypeScript support

### When to Use tty-table

- Building interactive TTY applications
- Want percentage-based column widths
- Need built-in color support
- Want per-column formatters

### Implementation Recommendation

For the PRD pipeline CLI, use **cli-table3** because:

1. **Project already uses similar patterns** (cli-progress, commander)
2. **Need custom borders** (can match existing output style)
3. **Simple table requirements** (task lists, status displays)
4. **Works well with chalk** (can use existing color patterns)
5. **Widely adopted** (good community support and examples)

### Installation

```bash
npm install cli-table3
npm install @types/cli-table3 --save-dev
```

### Basic Implementation Template

```typescript
// src/utils/table-display.ts
import Table from 'cli-table3';
import chalk from 'chalk';

export interface TableColumn<T> {
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => string;
}

export function createTable<T>(columns: TableColumn<T>[], data: T[]): string {
  const table = new Table({
    head: columns.map(c => chalk.cyan(c.header)),
    colWidths: columns.map(c => c.width),
    colAligns: columns.map(c => c.align),
  });

  data.forEach(row => {
    table.push(
      columns.map(col =>
        col.format
          ? col.format((row as any)[col.header.toLowerCase()], row)
          : (row as any)[col.header.toLowerCase()]
      )
    );
  });

  return table.toString();
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
**Recommendation:** cli-table3
