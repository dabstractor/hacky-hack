# Terminal Styling Libraries Research

**Research Date:** 2025-01-23
**Purpose:** Research terminal color and styling libraries for TypeScript/Node.js CLI output

---

## Table of Contents

1. [Library Comparison](#library-comparison)
2. [chalk](#chalk)
3. [kleur](#kleur)
4. [ansi-colors](#ansi-colors)
5. [colors.js](#colorsjs)
6. [picocolors](#picocolors)
7. [Code Examples](#code-examples)
8. [Recommendation](#recommendation)

---

## Library Comparison

| Feature             | chalk   | kleur   | ansi-colors             | colors.js | picocolors           |
| ------------------- | ------- | ------- | ----------------------- | --------- | -------------------- |
| TypeScript Support  | ✓       | ✓       | ✓                       | ✓         | ✓                    |
| Chainable API       | ✓       | ✗       | ✗                       | ✓         | ✗                    |
| Named Colors (256)  | ✓       | ✓       | ✓                       | ✓         | Basic                |
| RGB/HEX Support     | ✓       | ✓       | ✓                       | ✓         | ✗                    |
| Background Colors   | ✓       | ✓       | ✓                       | ✓         | ✓                    |
| Styles (bold, etc.) | ✓       | ✓       | ✓                       | ✓         | ✓                    |
| Nested Styles       | ✓       | Limited | ✗                       | ✓         | ✗                    |
| Theme Support       | ✓       | ✗       | ✓                       | ✓         | ✗                    |
| Auto-Detection      | ✓       | ✓       | ✓                       | ✓         | ✓                    |
| No Dependencies     | 1 dep   | 0 deps  | 0 deps                  | 0 deps    | 0 deps               |
| Bundle Size         | 18KB    | 4KB     | 7KB                     | 8KB       | 2KB                  |
| Weekly Downloads    | 100M+   | 15M+    | 5M+                     | 3M+       | 50M+                 |
| Maintenance         | Active  | Stable  | Stable                  | Stable    | Active               |
| **Recommended**     | **Yes** | **Yes** | **Already in dep tree** | Maybe     | **For minimal size** |

---

## chalk

### Overview

**NPM:** https://www.npmjs.com/package/chalk
**GitHub:** https://github.com/chalk/chalk
**Version:** 5.3.0 (latest)
**License:** MIT
**TypeScript Support:** Native

**Status:** Most popular terminal styling library for Node.js

### Installation

```bash
npm install chalk
```

### TypeScript Types

```typescript
import chalk from 'chalk';

// Colors
chalk.black(text: string | number): string;
chalk.red(text: string | number): string;
chalk.green(text: string | number): string;
chalk.yellow(text: string | number): string;
chalk.blue(text: string | number): string;
chalk.magenta(text: string | number): string;
chalk.cyan(text: string | number): string;
chalk.white(text: string | number): string;
chalk.gray(text: string | number): string;
chalk.redBright(text: string | number): string;
chalk.greenBright(text: string | number): string;
chalk.yellowBright(text: string | number): string;
// ... etc

// Background colors
chalk.bgRed(text: string | number): string;
chalk.bgGreen(text: string | number): string;
// ... etc

// Modifiers
chalk.bold(text: string | number): string;
chalk.dim(text: string | number): string;
chalk.italic(text: string | number): string;
chalk.underline(text: string | number): string;
chalk.inverse(text: string | number): string;
chalk.hidden(text: string | number): string;
chalk.strikethrough(text: string | number): string;
chalk.overline(text: string | number): string;

// RGB/HEX
chalk.rgb(r, g, b)(text: string | number): string;
chalk.hex(hexCode)(text: string | number): string;

// Level control
chalk.level: 0 | 1 | 2 | 3;
chalk.level = 0; // Disable colors

// Tagged template literal
chalk.color = '#FF0000';
const text = chalk`{red This is red}`;
```

### Basic Usage

```typescript
import chalk from 'chalk';

// Simple colors
console.log(chalk.red('Error!'));
console.log(chalk.green('Success!'));
console.log(chalk.yellow('Warning!'));

// Chainable
console.log(chalk.red.bold('Error!'));
console.log(chalk.green.bold.underline('Success!'));

// Background
console.log(chalk.bgRed.white('Error!'));
console.log(chalk.bgGreen.black('Success!'));
```

### Advanced Usage

```typescript
// Custom colors
const errorColor = chalk.hex('#FF0000');
console.log(errorColor('Custom error color'));

// RGB
console.log(chalk.rgb(255, 0, 0)('Red text'));
console.log(chalk.bgRgb(0, 255, 0)('Green background'));

// Nested styles
console.log(
  chalk.red('Error: ') +
    chalk.bold('File not found') +
    chalk.gray(' (check your path)')
);

// Tagged template literals
const name = 'World';
console.log(chalk`
  {bold Hello} {cyan ${name}}!
  {green Success} message
  {red Error} message
`);

// Conditional styling
const isError = true;
console.log(isError ? chalk.red('Failed') : chalk.green('Passed'));

// Level checking
if (chalk.level > 0) {
  console.log(chalk.blue('Colors enabled'));
} else {
  console.log('Colors disabled');
}
```

### Themes

```typescript
import chalk from 'chalk';

const theme = chalk.createTheme({
  error: chalk.red.bold,
  warning: chalk.yellow,
  success: chalk.green.bold,
  info: chalk.blue,
  muted: chalk.gray,
});

console.log(theme.error('Error message'));
console.log(theme.success('Success message'));
```

### Pros

- Most popular and widely used
- Excellent TypeScript support
- Chainable API for intuitive styling
- Tagged template literals
- Custom RGB/HEX colors
- Theme support
- Active development
- Excellent documentation
- Smart color detection (TTY, CI/CD)
- Large community and examples

### Cons

- Larger bundle size (18KB)
- One dependency (supports-color@5)
- More features than needed for simple cases

---

## kleur

### Overview

**NPM:** https://www.npmjs.com/package/kleur
**GitHub:** https://github.com/lukeed/kleur
**Version:** 4.1.5 (latest)
**License:** MIT
**TypeScript Support:** Native

**Status:** Fastest, zero-dependency alternative to chalk

### Installation

```bash
npm install kleur
```

### Basic Usage

```typescript
import kleur from 'kleur';

// Simple colors
console.log(kleur.red('Error!'));
console.log(kleur.green('Success!'));

// Note: Not chainable, must nest
console.log(kleur.red(kleur.bold('Error!')));

// Background
console.log(kleur.bgWhite().red('Error!'));
```

### API

```typescript
// Colors
kleur.black(text);
kleur.red(text);
kleur.green(text);
kleur.yellow(text);
kleur.blue(text);
kleur.magenta(text);
kleur.cyan(text);
kleur.white(text);
kleur.gray(text);
kleur.brightRed(text);
// ... etc

// Modifiers
kleur.bold(text);
kleur.dim(text);
kleur.italic(text);
kleur.underline(text);
kleur.invert(text);
kleur.hidden(text);
kleur.strikethrough(text);

// Background
kleur.bgBlack(text);
kleur.bgRed(text);
// ... etc
```

### Pros

- Zero dependencies
- Smallest bundle size (4KB)
- Fastest performance
- Native TypeScript support
- Drop-in alternative to chalk

### Cons

- No chaining (must nest functions)
- No RGB/HEX support
- No theme support
- Less popular than chalk
- Fewer features

---

## ansi-colors

### Overview

**NPM:** https://www.npmjs.com/package/ansi-colors
**GitHub:** https://github.com/doowb/ansi-colors
**Version:** 4.1.3 (latest)
**License:** MIT
**TypeScript Support:** Native

**Status:** Zero-dependency, feature-rich alternative

**Note:** Already in project dependency tree (via cli-progress -> picocolors, but also available)

### Installation

```bash
npm install ansi-colors
```

### Basic Usage

```typescript
import colors from 'ansi-colors';

console.log(colors.red('Error!'));
console.log(colors.green('Success!'));

// Nested
console.log(colors.bold(colors.red('Error!')));

// Styles
console.log(colors.bold.underline.red('Error!')); // Some chaining support
```

### API

```typescript
// Basic colors
colors.black(text);
colors.red(text);
colors.green(text);
colors.yellow(text);
colors.blue(text);
colors.magenta(text);
colors.cyan(text);
colors.white(text);
colors.gray(text);
colors.grey(text);

// Bright colors
colors.redBright(text);
colors.greenBright(text);
// ... etc

// Background
colors.bgBlack(text);
colors.bgRed(text);
// ... etc

// Modifiers
colors.bold(text);
colors.dim(text);
colors.italic(text);
colors.underline(text);
colors.inverse(text);
colors.hidden(text);
colors.strikethrough(text);

// RGB
colors.rgb(r, g, b)(text);
```

### Pros

- Zero dependencies
- Good performance
- TypeScript support
- Some chaining support
- RGB support
- Style helpers

### Cons

- Less popular than chalk
- Limited chaining
- No theme support

---

## colors.js

### Overview

**NPM:** https://www.npmjs.com/package/colors
**GitHub:** https://github.com/Marak/colors.js
**Version:** 1.4.0 (latest safe version)
**License:** MIT/ISC
**TypeScript Support:** Via @types/colors

**Status:** Original Node.js color library, had security issues in v1.4.0 and earlier

**Security Note:** Use version 1.4.1 or later. Versions prior to 1.4.1 had a prototype pollution vulnerability.

### Installation

```bash
npm install colors
npm install @types/colors --save-dev
```

### Basic Usage

```typescript
import colors from 'colors';

console.log(colors.red('Error!'));
console.log(colors.green('Success!'));

// String prototype extension (optional)
colors.enable();
console.log('Error!'.red);
console.log('Success!'.green);

// Safe mode (no prototype extension)
import colors from 'colors/safe';
console.log(colors.red('Error!'));
```

### API

```typescript
// Basic colors
colors.black(text);
colors.red(text);
colors.green(text);
colors.yellow(text);
colors.blue(text);
colors.magenta(text);
colors.cyan(text);
colors.white(text);
colors.gray(text);

// Background
colors.bgBlack(text);
colors.bgRed(text);
// ... etc

// Modifiers
colors.bold(text);
colors.dim(text);
colors.italic(text);
colors.underline(text);
// ... etc

// Themes
colors.setTheme({
  error: colors.red.bold,
  warning: colors.yellow,
});
```

### Pros

- First popular color library
- Extensive feature set
- Can extend String prototype
- Theme support

### Cons

- Had security issues (use 1.4.1+)
- String prototype extension is controversial
- Not as actively maintained as alternatives
- Falling popularity due to competition

---

## picocolors

### Overview

**NPM:** https://www.npmjs.com/package/picocolors
**GitHub:** https://github.com/alexeyraspopov/picocolors
**Version:** 1.0.0 (latest)
**License:** ISC
**TypeScript Support:** Native

**Status:** Minimal, fastest color library (used by many popular tools like ESLint, PostCSS)

**Note:** Already in project dependency tree via cli-progress

### Installation

```bash
npm install picocolors
```

### Basic Usage

```typescript
import pc from 'picocolors';

console.log(pc.red('Error!'));
console.log(pc.green('Success!'));

// Modifiers
console.log(pc.bold(pc.red('Error!')));
```

### API

```typescript
// Basic colors
pc.black(text)
pc.red(text)
pc.green(text)
pc.yellow(text)
pc.blue(text)
pc.magenta(text)
pc.cyan(text)
pc.white(text)
pc.gray(text)
pc.brightBlack(text)
pc.brightRed(text)
pc.brightGreen(text)
pc.brightYellow(text)
pc.brightBlue(text)
pc.brightMagenta(text)
pc.brightCyan(text)
pc.brightWhite(text)

// Background
pc.bgBlack(text)
pc.bgRed(text)
pc.bgGreen(text)
// ... etc

// Modifiers
pc.reset(text)
pc.bold(text)
pc.dim(text)
pc.italic(text)
pc.underline(text)
pc.inverse(text)
pc.hidden(text)
pc.strikethrough(text)

// Utilities
pc.isColorSupported: boolean
```

### Pros

- Smallest bundle size (2KB)
- Zero dependencies
- Fastest performance
- Already in dependency tree
- Used by major tools (ESLint, PostCSS, Vite)
- Native TypeScript support
- Simple API

### Cons

- No chaining
- No RGB/HEX support
- No theme support
- Limited to basic colors
- No tagged template literals

---

## Code Examples

### Example 1: Status Indicators

**Using chalk:**

```typescript
import chalk from 'chalk';

interface Task {
  id: string;
  status: 'Planned' | 'In Progress' | 'Complete' | 'Blocked';
}

function formatStatus(status: Task['status']): string {
  switch (status) {
    case 'Complete':
      return chalk.green('✓ Complete');
    case 'In Progress':
      return chalk.blue('◐ In Progress');
    case 'Blocked':
      return chalk.red('✗ Blocked');
    case 'Planned':
      return chalk.gray('○ Planned');
    default:
      return status;
  }
}

const tasks: Task[] = [
  { id: 'P1M1T1', status: 'Complete' },
  { id: 'P1M1T2', status: 'In Progress' },
  { id: 'P1M1T3', status: 'Blocked' },
];

tasks.forEach(task => {
  console.log(`${task.id}: ${formatStatus(task.status)}`);
});
```

### Example 2: Error Messages

**Using chalk with themes:**

```typescript
import chalk from 'chalk';

const log = {
  error: (msg: string) => console.error(chalk.red.bold('✖'), msg),
  warn: (msg: string) => console.warn(chalk.yellow('⚠'), msg),
  info: (msg: string) => console.info(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✔'), msg),
  debug: (msg: string) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('DEBUG:'), msg);
    }
  },
};

// Usage
log.error('Failed to load task file');
log.warn('Using default configuration');
log.info('Processing tasks...');
log.success('All tasks completed');
log.debug('Variable state: ...');
```

### Example 3: Progress Indicators

**Using picocolors (lightweight):**

```typescript
import pc from 'picocolors';

function formatProgress(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;

  const bar = pc.green('█'.repeat(filled)) + pc.gray('░'.repeat(empty));
  const text = `${percentage}% (${current}/${total})`;

  return `${pc.bold('Progress:')} ${bar} ${text}`;
}

console.log(formatProgress(7, 10));
// Progress: ████████████████░░░ 70% (7/10)
```

### Example 4: Table Headers

**Using chalk:**

```typescript
import chalk from 'chalk';

function formatHeader(text: string): string {
  return chalk.cyan.bold.underline(text);
}

function formatSubHeader(text: string): string {
  return chalk.blue.bold(text);
}

console.log(formatHeader('Task Status Report'));
console.log(formatSubHeader('Active Tasks'));
console.log(chalk.gray('─'.repeat(50)));
```

### Example 5: Conditional Styling

```typescript
import chalk from 'chalk';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
}

function formatTestResult(result: TestResult): string {
  const status = result.passed ? chalk.green('PASS') : chalk.red('FAIL');

  const duration =
    result.duration > 1000
      ? chalk.red(`${result.duration}ms`)
      : chalk.gray(`${result.duration}ms`);

  return `${status} ${chalk.bold(result.name)} ${duration}`;
}

const results: TestResult[] = [
  { name: 'should pass', passed: true, duration: 50 },
  { name: 'should fail', passed: false, duration: 1200 },
  { name: 'slow test', passed: true, duration: 1500 },
];

results.forEach(r => console.log(formatTestResult(r)));
```

### Example 6: Color Detection

```typescript
import chalk from 'chalk';

function detectColorSupport(): string {
  if (chalk.level === 3) {
    return 'Full RGB color support';
  } else if (chalk.level === 2) {
    return '256 color support';
  } else if (chalk.level === 1) {
    return 'Basic ANSI color support';
  } else {
    return 'No color support';
  }
}

console.log(`Color support: ${detectColorSupport()}`);

// Force disable colors
chalk.level = 0;
```

### Example 7: Hierarchical Output

```typescript
import chalk from 'chalk';

function logHierarchy(
  items: Array<{ name: string; level: number; status?: string }>
) {
  items.forEach(item => {
    const indent = '  '.repeat(item.level);
    const prefix = level => {
      switch (level) {
        case 0:
          return chalk.bold('├─');
        case 1:
          return chalk.dim('├─');
        case 2:
          return chalk.dim('│ └─');
        default:
          return chalk.dim('│   └─');
      }
    };

    let line = indent + prefix(item.level) + ' ' + item.name;

    if (item.status) {
      line += ' ' + chalk.gray(`[${item.status}]`);
    }

    console.log(line);
  });
}

logHierarchy([
  { name: 'Phase 1', level: 0, status: 'In Progress' },
  { name: 'Task 1.1', level: 1, status: 'Complete' },
  { name: 'Task 1.2', level: 1, status: 'In Progress' },
  { name: 'Subtask 1.2.1', level: 2 },
  { name: 'Subtask 1.2.2', level: 2 },
]);
```

---

## Recommendation

### Primary Recommendation: chalk

**Reasons:**

1. **Most Popular**: 100M+ weekly downloads, industry standard
2. **Best Developer Experience**: Chainable API, intuitive
3. **Feature Complete**: RGB/HEX, themes, tagged templates
4. **TypeScript**: Native support
5. **Documentation**: Excellent docs and community
6. **Future-Proof**: Active development
7. **Compatibility**: Works everywhere (TTY, CI/CD, Windows)

### When to Use Alternatives

#### Use picocolors if:

- Bundle size is critical (2KB vs 18KB)
- Already in dependency tree (it is!)
- Only need basic colors
- Performance is paramount

#### Use kleur if:

- Want zero dependencies
- Need good performance
- Don't need RGB/HEX
- Don't need chaining

#### Use ansi-colors if:

- Want zero dependencies
- Need some advanced features
- Don't need the full chalk feature set

### Project-Specific Recommendation

For the PRD pipeline CLI:

**Use chalk** because:

1. **Developer Experience**: Chainable API makes code more readable
2. **Feature Requirements**: Need custom colors for status indicators
3. **Consistency**: Matches patterns in cli-progress (which uses picocolors internally, but we can use chalk at application level)
4. **Community**: Many examples and patterns available
5. **Future**: May need RGB/HEX for custom theming

**Bundle size consideration**: The CLI is already a Node application, so 18KB is negligible.

### Alternative: Use picocolors

Since **picocolors is already in the dependency tree** (via cli-progress), consider using it to minimize dependencies:

```typescript
// No additional install needed!
import pc from 'picocolors';
```

**Trade-off:** Less ergonomic API (no chaining), but smaller footprint.

### Implementation Templates

#### Using chalk (Recommended):

```typescript
// src/utils/colors.ts
import chalk from 'chalk';

export const colors = {
  // Status colors
  success: (msg: string) => chalk.green(msg),
  error: (msg: string) => chalk.red.bold(msg),
  warn: (msg: string) => chalk.yellow(msg),
  info: (msg: string) => chalk.blue(msg),
  muted: (msg: string) => chalk.gray(msg),

  // Task status
  taskComplete: (msg: string) => chalk.green('✓') + ' ' + msg,
  taskInProgress: (msg: string) => chalk.blue('◐') + ' ' + msg,
  taskPending: (msg: string) => chalk.gray('○') + ' ' + msg,
  taskBlocked: (msg: string) => chalk.red('✗') + ' ' + msg,

  // Headers
  header: (msg: string) => chalk.cyan.bold(msg),
  subheader: (msg: string) => chalk.blue.bold(msg),
  separator: () => chalk.gray('─'.repeat(50)),

  // Highlighting
  highlight: (msg: string) => chalk.bold.yellow(msg),
  dim: (msg: string) => chalk.dim(msg),

  // IDs and references
  id: (msg: string) => chalk.cyan(msg),
  path: (msg: string) => chalk.gray(msg),
};

// Conditional coloring
export const colorIf = (
  condition: boolean,
  colorFn: (msg: string) => string
) => {
  return (msg: string) => (condition ? colorFn(msg) : msg);
};

// Level detection
export const colorLevel = chalk.level;
```

#### Using picocolors (Zero additional deps):

```typescript
// src/utils/colors.ts
import pc from 'picocolors';

export const colors = {
  success: (msg: string) => pc.green(msg),
  error: (msg: string) => pc.bold(pc.red(msg)),
  warn: (msg: string) => pc.yellow(msg),
  info: (msg: string) => pc.blue(msg),
  muted: (msg: string) => pc.gray(msg),

  taskComplete: (msg: string) => pc.green('✓') + ' ' + msg,
  taskInProgress: (msg: string) => pc.blue('◐') + ' ' + msg,
  // ... etc
};
```

---

## URLs and Resources

### chalk

- **NPM:** https://www.npmjs.com/package/chalk
- **GitHub:** https://github.com/chalk/chalk
- **Documentation:** https://github.com/chalk/chalk#readme
- **Type Definitions:** Native (included in package)

### kleur

- **NPM:** https://www.npmjs.com/package/kleur
- **GitHub:** https://github.com/lukeed/kleur
- **Documentation:** https://github.com/lukeed/kleur#readme

### ansi-colors

- **NPM:** https://www.npmjs.com/package/ansi-colors
- **GitHub:** https://github.com/doowb/ansi-colors
- **Documentation:** https://github.com/doowb/ansi-colors

### colors.js

- **NPM:** https://www.npmjs.com/package/colors (use 1.4.1+)
- **GitHub:** https://github.com/Marak/colors.js
- **Security Advisory:** https://github.com/advisories/GHSA-7hxg-5wpq-qprq

### picocolors

- **NPM:** https://www.npmjs.com/package/picocolors
- **GitHub:** https://github.com/alexeyraspopov/picocolors
- **Documentation:** https://github.com/alexeyraspopov/picocolors#readme

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
**Recommendation:** chalk (primary), picocolors (if minimizing deps)
