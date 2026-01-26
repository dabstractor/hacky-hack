# Stack Trace Presentation Patterns

**Research Date:** 2025-01-24
**Focus:** Stack trace formatting, frame filtering, context presentation

## Table of Contents
1. [Stack Trace Fundamentals](#stack-trace-fundamentals)
2. [Presentation Patterns](#presentation-patterns)
3. [Frame Filtering & Selection](#frame-filtering--selection)
4. [Context Enhancement](#context-enhancement)
5. [Error Source Highlighting](#error-source-highlighting)
6. [Implementation Examples](#implementation-examples)

---

## Stack Trace Fundamentals

### Why Stack Traces Matter in CLI Tools

Stack traces serve different purposes depending on the audience:

1. **End Users**: Need to know what went wrong and where
2. **Developers**: Need full context for debugging
3. **Support Teams**: Need actionable information for issues
4. **Automated Systems**: Need structured error data

### Core Stack Trace Components

```typescript
interface StackFrame {
  // Location
  file: string;
  line: number;
  column: number;

  // Function context
  function?: string;
  className?: string;
  methodName?: string;

  // Code context
  sourceLine?: string;
  surroundingLines?: {
    before: string[];
    after: string[];
  };

  // Module information
  module?: string;
  isNative?: boolean;
  isLibrary?: boolean;
  isUserCode?: boolean;
}

interface StackTrace {
  message: string;
  name: string;
  frames: StackFrame[];
  cause?: StackTrace; // For nested errors
}
```

---

## Presentation Patterns

### Pattern 1: Condensed View (Default)

```
Error: Type validation failed
    at validateSession (src/core/session.ts:45:12)
    at executePipeline (src/workflows/prp-pipeline.ts:123:8)
    at main (src/index.ts:42:5)
```

**Best for:**
- Default error output
- Non-technical users
- CI/CD logs
- Quick error scanning

### Pattern 2: Detailed View (Verbose)

```
Error: Type validation failed

Stack Trace:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  File: src/core/session.ts
  Line: 45, Column: 12
  Function: validateSession()

  Source:
  ┌─────────────────────────────────────────────────────────┐
  │ 43   export function validateSession(config: Config) {  │
  │ 44     if (!config.id) {                                │
→│ 45       throw new Error('Type validation failed');      │
  │ 46     }                                                │
  │ 47     return config;                                   │
  └─────────────────────────────────────────────────────────┘

  Called from:
    src/workflows/prp-pipeline.ts:123:8 (executePipeline)
    src/index.ts:42:5 (main)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Additional Context:
  Config ID: undefined
  Expected: string matching /^[0-9]{3}_[a-f0-9]{12}$/
```

**Best for:**
- Development mode
- Debug output
- Error reports
- Technical documentation

### Pattern 3: Grouped View (Library Detection)

```
Error: Type validation failed

Application Code:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ src/core/session.ts:45:12 validateSession()
  ✗ src/workflows/prp-pipeline.ts:123:8 executePipeline()
  ✗ src/index.ts:42:5 main()

Library Code (collapsed, use --verbose for details):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  + node_modules/zod/lib/index.js:892:15 parse
  + node_modules/@types/node/index.d.ts:1234:3 EventEmitter
  + internal/process/next_tick.js:67:5 processTicksAndRejections

Show full trace with: hack --verbose
```

**Best for:**
- Production environments
- Applications with many dependencies
- Error monitoring systems
- Focused debugging

### Pattern 4: Interactive View (TTY)

```
Error: Type validation failed

[1] src/core/session.ts:45:12 validateSession()
    │
    ├─► throw new Error('Type validation failed');
    │
    └─► View source [v] | Open editor [o] | Copy path [c]

[2] src/workflows/prp-pipeline.ts:123:8 executePipeline()
    │
    └─► const validated = validateSession(config);

Press [1-2] to view frame, [q] to quit
```

**Best for:**
- Interactive terminals
- Development environments
- CLI debugging tools
- Rich terminal emulators

---

## Frame Filtering & Selection

### Filtering Strategies

#### 1. Relevance-Based Filtering

```typescript
interface FrameFilter {
  // Keep user code
  includeUserCode: boolean;

  // Keep library code
  includeLibraries: boolean;

  // Keep node internals
  includeInternals: boolean;

  // Maximum frames to show
  maxFrames: number;

  // Patterns to include/exclude
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
}

const defaultFilter: FrameFilter = {
  includeUserCode: true,
  includeLibraries: false,
  includeInternals: false,
  maxFrames: 10,
  excludePatterns: [
    /node_modules/,
    /internal\//,
    /\.ts-build-info/,
  ],
};
```

#### 2. Heuristic-Based Selection

```typescript
class FrameSelector {
  selectRelevantFrames(
    frames: StackFrame[],
    filter: FrameFilter
  ): StackFrame[] {
    let relevantFrames = frames;

    // Apply inclusion filters
    if (filter.includePatterns) {
      relevantFrames = relevantFrames.filter(frame =>
        filter.includePatterns!.some(pattern =>
          pattern.test(frame.file)
        )
      );
    }

    // Apply exclusion filters
    if (filter.excludePatterns) {
      relevantFrames = relevantFrames.filter(frame =>
        !filter.excludePatterns!.some(pattern =>
          pattern.test(frame.file)
        )
      );
    }

    // Separate user and library code
    const userFrames = relevantFrames.filter(f => f.isUserCode);
    const libraryFrames = relevantFrames.filter(f => !f.isUserCode);

    // Combine with priority to user code
    let selectedFrames = filter.includeUserCode
      ? userFrames
      : [];

    if (filter.includeLibraries) {
      selectedFrames = selectedFrames.concat(libraryFrames);
    }

    // Apply max frames limit
    return selectedFrames.slice(0, filter.maxFrames);
  }

  classifyFrame(frame: StackFrame): 'user' | 'library' | 'internal' {
    if (frame.file.includes('node_modules')) {
      return 'library';
    }
    if (frame.file.startsWith('internal/')) {
      return 'internal';
    }
    return 'user';
  }
}
```

#### 3. Intelligent Frame Grouping

```typescript
interface FrameGroup {
  category: 'user' | 'library' | 'internal';
  frames: StackFrame[];
  collapsed: boolean;
}

class FrameGrouper {
  groupFrames(frames: StackFrame[]): FrameGroup[] {
    const groups: Map<string, StackFrame[]> = new Map();

    for (const frame of frames) {
      const category = this.classifyFrame(frame);
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(frame);
    }

    return [
      {
        category: 'user',
        frames: groups.get('user') || [],
        collapsed: false,
      },
      {
        category: 'library',
        frames: groups.get('library') || [],
        collapsed: true, // Collapse by default
      },
      {
        category: 'internal',
        frames: groups.get('internal') || [],
        collapsed: true,
      },
    ];
  }

  private classifyFrame(frame: StackFrame): 'user' | 'library' | 'internal' {
    if (frame.file.includes('node_modules')) {
      return 'library';
    }
    if (frame.file.startsWith('internal/') || frame.isNative) {
      return 'internal';
    }
    return 'user';
  }
}
```

---

## Context Enhancement

### Source Code Display

```typescript
class SourceCodeProvider {
  async getSourceContext(
    frame: StackFrame,
    contextLines: number = 3
  ): Promise<{
    sourceLine: string;
    before: string[];
    after: string[];
  }> {
    try {
      const content = await fs.readFile(frame.file, 'utf-8');
      const lines = content.split('\n');

      const sourceLine = lines[frame.line - 1];
      const before = lines.slice(
        Math.max(0, frame.line - 1 - contextLines),
        frame.line - 1
      );
      const after = lines.slice(
        frame.line,
        Math.min(lines.length, frame.line + contextLines)
      );

      return { sourceLine, before, after };
    } catch (error) {
      // File might not exist or be unreadable
      return {
        sourceLine: '<source unavailable>',
        before: [],
        after: [],
      };
    }
  }
}
```

### Enhanced Frame Display

```typescript
import chalk from 'chalk';

class EnhancedFrameFormatter {
  formatFrame(frame: StackFrame, showSource: boolean = false): string {
    const lines: string[] = [];

    // Header
    const header = this.formatFrameHeader(frame);
    lines.push(header);

    // Source code (if requested and available)
    if (showSource && frame.surroundingLines) {
      lines.push(this.formatSourceCode(frame));
    }

    // Additional context
    if (frame.module) {
      lines.push(chalk.dim(`    Module: ${frame.module}`));
    }

    return lines.join('\n');
  }

  private formatFrameHeader(frame: StackFrame): string {
    const icon = frame.isUserCode ? '✗' : '+';
    const iconColor = frame.isUserCode ? chalk.red : chalk.gray;

    const fileName = this.formatFileName(frame.file);
    const location = chalk.dim(
      `:${frame.line}:${frame.column}`
    );
    const functionStr = frame.function
      ? chalk.yellow(frame.function + '()')
      : chalk.dim('<anonymous>');

    return `  ${iconColor(icon)} ${fileName}${location} ${functionStr}`;
  }

  private formatFileName(file: string): string {
    // Convert absolute paths to relative when possible
    const cwd = process.cwd();
    if (file.startsWith(cwd)) {
      return '.' + file.slice(cwd.length);
    }
    return file;
  }

  private formatSourceCode(frame: StackFrame): string {
    if (!frame.surroundingLines) {
      return '';
    }

    const lines: string[] = [];
    lines.push('');
    lines.push('  ' + chalk.gray('┌─ Source:'));
    lines.push('  ' + chalk.gray('│'));

    const { before, sourceLine, after } = frame.surroundingLines;
    const lineNum = frame.line;
    const padding = lineNum.toString().length;

    // Before lines
    before.forEach((line, index) => {
      const num = lineNum - before.length + index;
      lines.push(
        '  ' + chalk.gray('│') + ' ' +
        chalk.dim(num.toString().padStart(padding)) + '  ' +
        chalk.dim(line)
      );
    });

    // Error line
    lines.push(
      '  ' + chalk.gray('│') + ' ' +
      chalk.red('→'.padStart(padding)) + '  ' +
      chalk.red(sourceLine)
    );

    // After lines
    after.forEach((line, index) => {
      const num = lineNum + 1 + index;
      lines.push(
        '  ' + chalk.gray('│') + ' ' +
        chalk.dim(num.toString().padStart(padding)) + '  ' +
        chalk.dim(line)
      );
    });

    lines.push('  ' + chalk.gray('│'));
    lines.push('  ' + chalk.gray('└────────────────────────────────────────'));

    return lines.join('\n');
  }
}
```

---

## Error Source Highlighting

### Syntax Highlighting for Error Lines

```typescript
class ErrorHighlighter {
  highlightErrorLine(
    sourceLine: string,
    errorColumn: number
  ): string {
    const before = sourceLine.slice(0, errorColumn);
    const errorChar = sourceLine[errorColumn];
    const after = sourceLine.slice(errorColumn + 1);

    return (
      chalk.dim(before) +
      chalk.bold.red(errorChar) +
      chalk.dim(after)
    );
  }

  highlightWithPointer(
    sourceLine: string,
    errorColumn: number
  ): string[] {
    const lines: string[] = [];

    // Source line with highlight
    lines.push(
      chalk.dim(sourceLine.slice(0, errorColumn)) +
      chalk.bold.red(sourceLine[errorColumn] || '^') +
      chalk.dim(sourceLine.slice(errorColumn + 1))
    );

    // Pointer line
    const pointer = ' '.repeat(errorColumn) + chalk.red('↑');
    lines.push(pointer);

    // Message
    const message = ' '.repeat(errorColumn) + chalk.red('Error occurred here');
    lines.push(message);

    return lines;
  }
}
```

### Visual Error Indicators

```
Error Example:

  42   export function validateSession(config: Config) {
  43     if (!config.id) {
→ 44       throw new Error('Type validation failed');
       ↑
       Error thrown here

  45     }
  46     return config;
```

---

## Implementation Examples

### Complete Stack Trace Formatter

```typescript
import chalk from 'chalk';
import fs from 'fs/promises';

interface FormatterOptions {
  verbose?: boolean;
  showSource?: boolean;
  contextLines?: number;
  maxFrames?: number;
  colorize?: boolean;
}

class StackTraceFormatter {
  private sourceProvider: SourceCodeProvider;
  private frameSelector: FrameSelector;
  private frameFormatter: EnhancedFrameFormatter;

  constructor() {
    this.sourceProvider = new SourceCodeProvider();
    this.frameSelector = new FrameSelector();
    this.frameFormatter = new EnhancedFrameFormatter();
  }

  async format(
    trace: StackTrace,
    options: FormatterOptions = {}
  ): Promise<string> {
    const {
      verbose = false,
      showSource = false,
      contextLines = 3,
      maxFrames = 10,
      colorize = true,
    } = options;

    const lines: string[] = [];

    // Error header
    lines.push(this.formatErrorHeader(trace));

    // Filter and select frames
    const filter: FrameFilter = {
      includeUserCode: true,
      includeLibraries: verbose,
      includeInternals: verbose,
      maxFrames,
    };

    const selectedFrames = this.frameSelector.selectRelevantFrames(
      trace.frames,
      filter
    );

    // Enhance frames with source context if requested
    let enhancedFrames = selectedFrames;
    if (showSource) {
      enhancedFrames = await Promise.all(
        selectedFrames.map(async frame => ({
          ...frame,
          surroundingLines: await this.sourceProvider.getSourceContext(
            frame,
            contextLines
          ),
        }))
      );
    }

    // Format frames
    lines.push(chalk.bold('\nStack Trace:'));
    lines.push(chalk.gray('─'.repeat(60)));

    for (const frame of enhancedFrames) {
      lines.push('');
      lines.push(this.frameFormatter.formatFrame(frame, showSource));
    }

    // Show collapsed frames if any were filtered
    const totalFrames = trace.frames.length;
    const shownFrames = enhancedFrames.length;
    if (totalFrames > shownFrames) {
      lines.push('');
      lines.push(
        chalk.dim(`\n... ${totalFrames - shownFrames} more frames hidden`)
      );
      lines.push(chalk.dim(`Use --verbose to show all frames`));
    }

    // Show cause if present
    if (trace.cause) {
      lines.push('');
      lines.push(chalk.bold.yellow('\nCaused by:'));
      lines.push(await this.format(trace.cause, options));
    }

    return lines.join('\n');
  }

  private formatErrorHeader(trace: StackTrace): string {
    const name = chalk.bold.red(trace.name);
    const message = chalk.red(trace.message);
    return `${name}: ${message}`;
  }
}

// Usage example
const formatter = new StackTraceFormatter();

const errorTrace: StackTrace = {
  name: 'ValidationError',
  message: 'Type validation failed',
  frames: [
    {
      file: '/home/user/project/src/core/session.ts',
      line: 45,
      column: 12,
      function: 'validateSession',
      isUserCode: true,
    },
    {
      file: '/home/user/project/node_modules/zod/lib/index.js',
      line: 892,
      column: 15,
      function: 'parse',
      isUserCode: false,
    },
  ],
};

console.log(await formatter.format(errorTrace, {
  showSource: true,
  verbose: false,
}));
```

---

## Best Practices

### DO:
- Show user code frames first
- Collapse library/internal frames by default
- Provide --verbose flag for full traces
- Include line and column numbers
- Show source code context when available
- Use color to highlight error location
- Provide frame navigation in interactive mode
- Support filtering by pattern

### DON'T:
- Show raw 100+ frame traces by default
- Include node internals unless debugging
- Use color as the only indicator
- Omit line/column information
- Mix error and warning levels in traces
- Hide the ability to see full traces
- Show minified code without source maps
- Forget to handle missing source files

---

## Advanced Features

### Source Map Support

```typescript
import { SourceMapConsumer } from 'source-map';

async function applySourceMaps(
  frame: StackFrame
): Promise<StackFrame> {
  // Load source map if available
  const mapPath = frame.file + '.map';
  const mapContent = await fs.readFile(mapPath, 'utf-8');
  const consumer = await new SourceMapConsumer(mapContent);

  // Map minified location to source location
  const original = consumer.originalPositionFor({
    line: frame.line,
    column: frame.column,
  });

  if (original.source) {
    return {
      ...frame,
      file: original.source,
      line: original.line,
      column: original.column,
      function: original.name || frame.function,
    };
  }

  return frame;
}
```

### Frame Annotations

```typescript
interface AnnotatedFrame extends StackFrame {
  annotations?: {
    type: 'note' | 'warning' | 'suggestion';
    message: string;
  }[];
}

// Usage
const annotatedFrame: AnnotatedFrame = {
  file: 'src/core/session.ts',
  line: 45,
  column: 12,
  function: 'validateSession',
  isUserCode: true,
  annotations: [
    {
      type: 'note',
      message: 'This function is called from multiple places',
    },
    {
      type: 'suggestion',
      message: 'Consider adding input validation earlier',
    },
  ],
};
```

---

## Related Libraries

- `source-map` - Source map parsing and resolution
- `stack-trace` - Cross-platform stack trace parsing
- `error-stack-parser` - Modern stack trace parsing
- `chalk` - Terminal colors
- `highlight.js` - Syntax highlighting (for web)

---

## References

- **V8 Stack Trace API**: https://v8.dev/docs/stack-trace-api
- **Node.js Error Handling**: https://nodejs.org/api/errors.html
- **Chrome DevTools Protocol**: https://chromedevtools.github.io/devtools-protocol/
- **Source Map Specification**: https://sourcemaps.info/spec.html
