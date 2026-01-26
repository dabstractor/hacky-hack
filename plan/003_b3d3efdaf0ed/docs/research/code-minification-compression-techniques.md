# Code Minification and Compression Techniques Research

A comprehensive guide to JavaScript/TypeScript code minification, compression, and normalization techniques for AI prompts and optimization.

---

## Table of Contents

1. [Minification Libraries](#1-minification-libraries)
2. [Comment and Blank Line Removal](#2-comment-and-blank-line-removal)
3. [Line-Based Code Extraction](#3-line-based-code-extraction)
4. [Code Compression Techniques](#4-code-compression-techniques)
5. [Code Snippet Size Reduction](#5-code-snippet-size-reduction)
6. [Code Normalization for AI Prompts](#6-code-normalization-for-ai-prompts)
7. [Integration Patterns](#7-integration-patterns)
8. [Code Examples](#8-code-examples)

---

## 1. Minification Libraries

### 1.1 Terser

**Description**: A JavaScript parser and minifier, successor to UglifyJS. Supports ES6+ syntax and provides advanced compression options.

**URL**: https://github.com/terser/terser

**NPM Package**: `terser`

**Key Features**:

- ES6+ syntax support
- Advanced compression options
- Source map generation
- Configurable mangling
- Tree-shaking support

**Installation**:

```bash
npm install terser
```

**Basic Usage**:

```typescript
import { minify } from 'terser';

const code = `
  function add(a, b) {
    // Add two numbers
    return a + b;
  }
`;

const result = await minify(code, {
  compress: true,
  mangle: true,
  format: {
    comments: false,
  },
});

console.log(result.code);
// Output: function add(l,o){return l+o}
```

**Advanced Options**:

```typescript
const result = await minify(code, {
  compress: {
    dead_code: true,
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log'],
    passes: 3,
  },
  mangle: {
    properties: false,
    keep_fnames: false,
    toplevel: false,
  },
  format: {
    ascii_only: false,
    beautify: false,
    comments: false,
    max_line_len: false,
  },
  sourceMap: true,
  ecma: 2020,
});
```

### 1.2 esbuild

**Description**: An extremely fast JavaScript bundler and minifier written in Go. Already in your project's devDependencies.

**URL**: https://esbuild.github.io/

**NPM Package**: `esbuild`

**Key Features**:

- Blazing fast performance (10-100x faster than alternatives)
- Built-in TypeScript support
- Tree-shaking
- Minification
- No configuration required

**Installation**:

```bash
npm install esbuild
```

**Basic Usage**:

```typescript
import * as esbuild from 'esbuild';

const code = `
  function add(a: number, b: number): number {
    // Add two numbers
    return a + b;
  }
`;

const result = await esbuild.transform(code, {
  minify: true,
  minifyWhitespace: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  treeShaking: true,
  format: 'esm',
});

console.log(result.code);
// Output: function add(n,t){return n+t}
```

**CLI Usage**:

```bash
esbuild src/index.ts --minify --bundle --outfile=dist/bundle.js
```

**Advanced Build Configuration**:

```typescript
await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/bundle.js',
  bundle: true,
  minify: true,
  minifyWhitespace: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  treeShaking: true,
  sourcemap: true,
  target: 'es2020',
  format: 'esm',
  platform: 'node',
  external: ['*'], // Don't bundle node_modules
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  drop: ['console', 'debugger'],
});
```

### 1.3 SWC (Speedy Web Compiler)

**Description**: Rust-based JavaScript/TypeScript compiler and minifier. Used by Next.js, Deno, and other modern frameworks.

**URL**: https://swc.rs/

**NPM Package**: `@swc/core`

**Key Features**:

- Super-fast performance (Rust-based)
- TypeScript support
- JSX support
- Minification
- Plugin system

**Installation**:

```bash
npm install @swc/core
```

**Basic Usage**:

```typescript
import { minify } from '@swc/core';

const code = `
  function add(a, b) {
    return a + b;
  }
`;

const result = await minify(code, {
  compress: true,
  mangle: true,
  ecma: 2020,
  keepClassNames: false,
  keepFnNames: false,
});

console.log(result.code);
```

### 1.4 UglifyJS

**Description**: Classic JavaScript parser, minifier, and compressor. Predecessor to Terser.

**URL**: https://github.com/mishoo/UglifyJS

**NPM Package**: `uglify-js`

**Note**: Considered legacy. Use Terser for ES6+ code.

### 1.5 @vercel/ncc

**Description**: Single-file bundler for Node.js applications by Vercel. Creates a single JavaScript file from Node.js apps.

**URL**: https://github.com/vercel/ncc

**NPM Package**: `@vercel/ncc`

**Key Features**:

- Single-file output
- Zero configuration
- TypeScript support
- Fast bundling
- Minimal overhead

**Installation**:

```bash
npm install @vercel/ncc -g
```

**CLI Usage**:

```bash
ncc build index.js -o dist
```

**Programmatic Usage**:

```typescript
import { ncc } from '@vercel/ncc';

const { code, map, assets } = await ncc('/path/to/entry.js', {
  minify: true,
  sourceMap: true,
  assetBuilds: false,
  external: [],
  quiet: true,
});
```

---

## 2. Comment and Blank Line Removal

### 2.1 strip-comments

**Description**: Lightweight utility to strip comments from code. Preserves strings that might contain comment-like patterns.

**URL**: https://github.com/jonschlinkert/strip-comments

**NPM Package**: `strip-comments`

**Installation**:

```bash
npm install strip-comments
```

**Basic Usage**:

```typescript
import strip from 'strip-comments';

const code = `
  // This is a single-line comment
  function add(a, b) {
    /* This is a
       multi-line comment */
    return a + b;
  }
`;

const result = strip(code, {
  line: true, // Remove // comments
  block: true, // Remove /* */ comments
  keepFirst: false,
  preserveNewlines: false,
});

console.log(result);
```

### 2.2 Custom Comment Removal (Regular Expressions)

```typescript
/**
 * Remove comments from JavaScript/TypeScript code
 */
export function removeComments(code: string): string {
  // Remove single-line comments (//)
  code = code.replace(/\/\/.*$/gm, '');

  // Remove multi-line comments (/* */)
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove HTML-style comments (<!-- -->)
  code = code.replace(/<!--[\s\S]*?-->/g, '');

  return code;
}

/**
 * Remove comments and blank lines
 */
export function removeCommentsAndBlankLines(code: string): string {
  code = removeComments(code);

  // Remove blank lines (lines with only whitespace)
  code = code.replace(/^\s*[\r\n]/gm, '');

  // Remove trailing whitespace from each line
  code = code.replace(/[ \t]+$/gm, '');

  return code;
}

/**
 * Remove blank lines only (preserve comments)
 */
export function removeBlankLines(code: string): string {
  return code.replace(/^\s*[\r\n]/gm, '');
}

/**
 * Compress code by removing extra whitespace
 */
export function compressWhitespace(code: string): string {
  return code
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around punctuation
    .trim();
}
```

### 2.3 AST-Based Comment Removal

Using `@babel/parser` for more accurate comment removal:

```typescript
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';

/**
 * Remove comments using AST parsing (more accurate than regex)
 */
export function removeCommentsAST(code: string): string {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  // Remove all comments
  traverse(ast, {
    enter(path) {
      // Comments are stored in leadingComments and trailingComments
      if (path.node.leadingComments) {
        path.node.leadingComments = [];
      }
      if (path.node.trailingComments) {
        path.node.trailingComments = [];
      }
    },
  });

  const output = generate(
    ast,
    {
      comments: false,
      compact: false,
    },
    code
  );

  return output.code;
}
```

---

## 3. Line-Based Code Extraction

### 3.1 Extract Specific Line Ranges

```typescript
/**
 * Extract specific lines from code (1-indexed)
 */
export function extractLines(
  code: string,
  startLine: number,
  endLine: number
): string {
  const lines = code.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}

/**
 * Extract lines around a specific line (with context)
 */
export function extractLinesWithContext(
  code: string,
  lineNumber: number,
  contextLines: number = 3
): string {
  const lines = code.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);
  return lines.slice(start, end).join('\n');
}

/**
 * Extract first N lines
 */
export function extractFirstLines(code: string, lineCount: number): string {
  const lines = code.split('\n');
  return lines.slice(0, lineCount).join('\n');
}

/**
 * Extract last N lines
 */
export function extractLastLines(code: string, lineCount: number): string {
  const lines = code.split('\n');
  return lines.slice(-lineCount).join('\n');
}
```

### 3.2 Extract Code Blocks by Pattern

```typescript
/**
 * Extract functions by name using regex
 */
export function extractFunctionByName(
  code: string,
  functionName: string
): string | null {
  // Match function declarations and expressions
  const patterns = [
    new RegExp(
      `function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`,
      'g'
    ),
    new RegExp(
      `const\\s+${functionName}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?\\n\\}`,
      'g'
    ),
    new RegExp(
      `const\\s+${functionName}\\s*=\\s*(?:async\\s+)?function\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`,
      'g'
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(code);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Extract class definition by name
 */
export function extractClassByName(
  code: string,
  className: string
): string | null {
  const pattern = new RegExp(
    `class\\s+${className}\\s*(?:extends\\s+\\w+)?\\s*\\{[\\s\\S]*?\\n\\}`,
    'g'
  );
  const match = pattern.exec(code);
  return match ? match[0] : null;
}

/**
 * Extract imports
 */
export function extractImports(code: string): string[] {
  const importPatterns = [
    /import\s+{[^}]+}\s+from\s+['"][^'"]+['"]/g,
    /import\s+\w+\s+from\s+['"][^'"]+['"]/g,
    /import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]/g,
    /import\s+['"][^'"]+['"]/g,
  ];

  const imports: string[] = [];

  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      imports.push(match[0]);
    }
  }

  return imports;
}
```

### 3.3 Smart Code Snippet Extraction

```typescript
interface CodeSnippet {
  code: string;
  startLine: number;
  endLine: number;
  language: string;
}

/**
 * Extract complete code blocks (functions, classes, etc.)
 */
export function extractCodeBlocks(code: string): CodeSnippet[] {
  const lines = code.split('\n');
  const snippets: CodeSnippet[] = [];

  let currentBlock: string[] = [];
  let blockStartLine = 0;
  let braceCount = 0;
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect function/class start
    if (
      /^\s*(function|class|const\s+\w+\s*=|(?:async\s+)?\w+\s*=\s*(?:async\s+)?\(.*\)\s*=>)/.test(
        line
      )
    ) {
      inBlock = true;
      blockStartLine = i + 1;
      currentBlock = [line];

      // Count opening braces
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount = openBraces - closeBraces;

      continue;
    }

    if (inBlock) {
      currentBlock.push(line);

      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount += openBraces - closeBraces;

      // Block complete
      if (braceCount === 0) {
        snippets.push({
          code: currentBlock.join('\n'),
          startLine: blockStartLine,
          endLine: i + 1,
          language: 'typescript',
        });

        inBlock = false;
        currentBlock = [];
      }
    }
  }

  return snippets;
}
```

---

## 4. Code Compression Techniques

### 4.1 Dead Code Elimination

```typescript
/**
 * Remove unused functions and variables
 * Note: This is a simplified version. Real DCE requires AST analysis
 */
export function removeDeadCode(code: string): string {
  // Remove unused imports (basic heuristic)
  code = code.replace(
    /^import\s+{[^}]+}\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm,
    match => {
      const imports = match.match(/\{([^}]+)\}/)?.[1];
      if (!imports) return match;

      const usedImports = imports.split(',').filter(imp => {
        const name = imp.trim().split(' as ')[0].trim();
        return code.includes(name);
      });

      if (usedImports.length === 0) return '';
      return match.replace(/\{[^}]+\}/, `{ ${usedImports.join(', ')} }`);
    }
  );

  // Remove unreachable code (after return/throw)
  // This is a simplified version
  return code;
}
```

### 4.2 Variable Name Shortening (Mangling)

```typescript
/**
 * Shorten variable names while preserving functionality
 */
export function mangleVariableNames(code: string): string {
  // This is a simplified version. Real mangling requires AST
  const varMap = new Map<string, string>();
  let nextId = 0;

  // Find variable declarations
  return code.replace(/(?:const|let|var)\s+(\w+)/g, (match, varName) => {
    if (!varMap.has(varName)) {
      const shortName = `_${nextId++}`;
      varMap.set(varName, shortName);
    }

    return match.replace(varName, varMap.get(varName)!);
  });
}
```

### 4.3 Statement Simplification

```typescript
/**
 * Simplify code statements
 */
export function simplifyStatements(code: string): string {
  // if (true) { ... } -> ...
  code = code.replace(/if\s*\(\s*true\s*\)\s*\{([^}]+)\}/g, '$1');

  // if (false) { ... } -> (remove)
  code = code.replace(/if\s*\(\s*false\s*\)\s*\{[^}]*\}/g, '');

  // Simplify ternary: condition ? true : false -> !!condition
  code = code.replace(/(\w+)\s*\?\s*true\s*:\s*false/g, '!!$1');

  // Simplify ternary: condition ? false : true -> !condition
  code = code.replace(/(\w+)\s*\?\s*false\s*:\s*true/g, '!$1');

  return code;
}
```

### 4.4 Complete Compression Pipeline

```typescript
import { minify } from 'terser';

/**
 * Complete code compression pipeline
 */
export async function compressCode(
  code: string,
  options: {
    removeComments?: boolean;
    removeBlankLines?: boolean;
    mangle?: boolean;
    compress?: boolean;
  } = {}
): Promise<string> {
  const {
    removeComments = true,
    removeBlankLines = true,
    mangle = true,
    compress = true,
  } = options;

  let result = code;

  // Step 1: Remove comments
  if (removeComments) {
    result = removeCommentsAndBlankLines(result);
  }

  // Step 2: Remove blank lines
  if (removeBlankLines) {
    result = removeBlankLines(result);
  }

  // Step 3: Use Terser for advanced compression
  if (compress || mangle) {
    const minified = await minify(result, {
      compress: compress,
      mangle: mangle,
      format: {
        comments: false,
      },
    });

    result = minified.code || result;
  }

  return result;
}

/**
 * Lightweight compression (no mangling)
 */
export async function lightweightCompress(code: string): Promise<string> {
  return compressCode(code, {
    removeComments: true,
    removeBlankLines: true,
    mangle: false,
    compress: false,
  });
}

/**
 * Aggressive compression (full minification)
 */
export async function aggressiveCompress(code: string): Promise<string> {
  return compressCode(code, {
    removeComments: true,
    removeBlankLines: true,
    mangle: true,
    compress: true,
  });
}
```

---

## 5. Code Snippet Size Reduction

### 5.1 Best Practices

1. **Remove Non-Essential Content**
   - Comments (unless critical for understanding)
   - Blank lines
   - Excessive whitespace
   - Debugging statements (console.log, debugger)

2. **Focus on Relevant Code**
   - Include only the function/class being discussed
   - Exclude unrelated imports
   - Remove helper functions if not essential
   - Omit boilerplate code

3. **Use Abbreviations**
   - Short but meaningful variable names
   - Concise function names
   - Simplified logic where possible

4. **Smart Truncation**
   - Keep function signatures
   - Include first 5-10 lines of implementation
   - Use `...` for omitted code
   - Preserve return statements

5. **Context Preservation**
   - Keep type annotations
   - Maintain imports for referenced types
   - Preserve interface definitions
   - Include necessary type exports

### 5.2 Smart Truncation Utility

```typescript
interface TruncateOptions {
  maxLines?: number;
  keepImports?: boolean;
  keepTypes?: boolean;
  keepSignatures?: boolean;
  truncateMiddle?: boolean;
  ellipsis?: string;
}

/**
 * Smart code truncation for snippets
 */
export function truncateCode(
  code: string,
  options: TruncateOptions = {}
): string {
  const {
    maxLines = 50,
    keepImports = true,
    keepTypes = true,
    keepSignatures = true,
    truncateMiddle = true,
    ellipsis = '\n// ... (truncated)\n',
  } = options;

  const lines = code.split('\n');

  if (lines.length <= maxLines) {
    return code;
  }

  if (!truncateMiddle) {
    // Just take first N lines
    return lines.slice(0, maxLines).join('\n') + ellipsis;
  }

  // Keep imports
  const imports: string[] = [];
  const types: string[] = [];
  const signatures: string[] = [];
  const body: string[] = [];

  for (const line of lines) {
    if (/^import\s+/.test(line)) {
      imports.push(line);
    } else if (/^(export\s+)?(interface|type|enum)\s+/.test(line)) {
      types.push(line);
    } else if (
      /^(?:async\s+)?(?:function|const\s+\w+\s*=)\s*\w+\s*\(/.test(line)
    ) {
      signatures.push(line);
    } else {
      body.push(line);
    }
  }

  // Rebuild with truncation
  const result: string[] = [];

  if (keepImports && imports.length > 0) {
    result.push(...imports);
    result.push('');
  }

  if (keepTypes && types.length > 0) {
    result.push(...types);
    result.push('');
  }

  // Add function signatures
  if (keepSignatures && signatures.length > 0) {
    result.push(...signatures);
  }

  // Add body with truncation
  const maxBodyLines = maxLines - result.length - 5;
  if (body.length > maxBodyLines) {
    const keepLines = Math.floor(maxBodyLines / 2);
    result.push(...body.slice(0, keepLines));
    result.push(ellipsis);
    result.push(...body.slice(-keepLines));
  } else {
    result.push(...body);
  }

  return result.join('\n');
}
```

### 5.3 Context-Aware Snippet Extraction

```typescript
/**
 * Extract minimal but complete code snippet
 */
export function extractMinimalSnippet(
  code: string,
  focusFunction: string
): string {
  const lines = code.split('\n');
  const snippet: string[] = [];

  // Find the function
  let functionStart = -1;
  let braceCount = 0;
  let foundStart = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find function start
    if (
      new RegExp(
        `(?:function|const\\s+${focusFunction}|${focusFunction}\\s*[:=])`
      ).test(line)
    ) {
      functionStart = i;
      foundStart = true;
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      continue;
    }

    if (foundStart) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount === 0) {
        // Found the end
        snippet.push(lines.slice(functionStart, i + 1).join('\n'));
        break;
      }
    }
  }

  // Extract necessary types and interfaces
  const typeNames = extractTypeNames(snippet.join('\n'));
  const types = extractTypeDefinitions(code, typeNames);

  // Extract necessary imports
  const importNames = extractImportNames(snippet.join('\n'));
  const imports = extractImportsByNames(code, importNames);

  // Build minimal snippet
  return [...imports, ...types, ...snippet].join('\n\n');
}

function extractTypeNames(code: string): string[] {
  const typePattern = /(?:interface|type|enum)\s+(\w+)/g;
  const types: string[] = [];
  let match;
  while ((match = typePattern.exec(code)) !== null) {
    types.push(match[1]);
  }
  return types;
}

function extractImportNames(code: string): string[] {
  const importPattern = /import\s+{([^}]+)}/g;
  const names: string[] = [];
  let match;
  while ((match = importPattern.exec(code)) !== null) {
    const imports = match[1]
      .split(',')
      .map(s => s.trim().split(' as ')[0].trim());
    names.push(...imports);
  }
  return names;
}

function extractTypeDefinitions(code: string, typeNames: string[]): string[] {
  const lines = code.split('\n');
  const types: string[] = [];

  for (const line of lines) {
    for (const typeName of typeNames) {
      if (
        new RegExp(
          `^(?:export\\s+)?(?:interface|type|enum)\\s+${typeName}`
        ).test(line)
      ) {
        types.push(line);
      }
    }
  }

  return types;
}

function extractImportsByNames(code: string, names: string[]): string[] {
  const lines = code.split('\n');
  const imports: string[] = [];

  for (const line of lines) {
    if (/^import\s+/.test(line)) {
      for (const name of names) {
        if (line.includes(name)) {
          imports.push(line);
          break;
        }
      }
    }
  }

  return imports;
}
```

---

## 6. Code Normalization for AI Prompts

### 6.1 Why Normalize Code for AI?

- **Reduce token usage**: Less code = fewer tokens = faster responses
- **Improve focus**: Remove noise (comments, blank lines) that distract the AI
- **Consistent formatting**: Standardized format helps AI understand patterns
- **Context management**: Fit more relevant code into context window

### 6.2 Normalization Techniques

```typescript
interface NormalizationOptions {
  removeComments?: boolean;
  removeBlankLines?: boolean;
  standardizeIndentation?: boolean;
  normalizeQuotes?: boolean;
  normalizeSemicolons?: boolean;
  sortImports?: boolean;
  preserveTypeAnnotations?: boolean;
  maxLength?: number;
}

/**
 * Normalize code for AI prompts
 */
export function normalizeCodeForAI(
  code: string,
  options: NormalizationOptions = {}
): string {
  const {
    removeComments = true,
    removeBlankLines = true,
    standardizeIndentation = true,
    normalizeQuotes = true,
    normalizeSemicolons = true,
    sortImports = true,
    preserveTypeAnnotations = true,
    maxLength = 10000,
  } = options;

  let result = code;

  // Remove comments
  if (removeComments) {
    result = removeComments(result);
  }

  // Remove blank lines
  if (removeBlankLines) {
    result = removeBlankLines(result);
  }

  // Standardize indentation (2 spaces)
  if (standardizeIndentation) {
    result = standardizeIndentationToSpaces(result, 2);
  }

  // Normalize quotes to single quotes
  if (normalizeQuotes) {
    result = result.replace(/"/g, "'");
  }

  // Ensure consistent semicolons
  if (normalizeSemicolons) {
    result = ensureSemicolons(result);
  }

  // Sort imports alphabetically
  if (sortImports) {
    result = sortImportsAlphabetically(result);
  }

  // Truncate if too long
  if (result.length > maxLength) {
    result = truncateToLength(result, maxLength);
  }

  return result;
}

function standardizeIndentationToSpaces(code: string, spaces: number): string {
  const lines = code.split('\n');
  const indentStr = ' '.repeat(spaces);

  return lines
    .map(line => {
      // Count leading spaces/tabs
      const match = line.match(/^(\s*)/);
      if (!match) return line;

      const leadingWhitespace = match[1];
      if (!leadingWhitespace) return line;

      // Count indentation level
      const tabs = (leadingWhitespace.match(/\t/g) || []).length;
      const spacesCount = leadingWhitespace.replace(/\t/g, '').length;
      const totalLevels = tabs + Math.floor(spacesCount / 2);

      return indentStr.repeat(totalLevels) + line.trim();
    })
    .join('\n');
}

function ensureSemicolons(code: string): string {
  return code.replace(/^(\s*\w+[^;{])$/gm, '$1;');
}

function sortImportsAlphabetically(code: string): string {
  const lines = code.split('\n');
  const imports: string[] = [];
  const nonImports: string[] = [];
  let inImportSection = true;

  for (const line of lines) {
    if (/^import\s+/.test(line)) {
      imports.push(line);
      inImportSection = true;
    } else if (inImportSection && line.trim() === '') {
      nonImports.push(line);
    } else {
      inImportSection = false;
      nonImports.push(line);
    }
  }

  imports.sort();

  return [...imports, ...nonImports].join('\n');
}

function truncateToLength(code: string, maxLength: number): string {
  if (code.length <= maxLength) return code;

  // Truncate in middle
  const keepLength = Math.floor((maxLength - 20) / 2);
  return (
    code.slice(0, keepLength) +
    '\n// ... (truncated) ...\n' +
    code.slice(-keepLength)
  );
}
```

### 6.3 AI-Optimized Code Snippet

```typescript
/**
 * Create AI-optimized code snippet with context
 */
export function createAISnippet(
  code: string,
  context: {
    description?: string;
    focus?: string;
    includeTypes?: boolean;
    includeImports?: boolean;
  } = {}
): string {
  const {
    description,
    focus,
    includeTypes = true,
    includeImports = true,
  } = context;

  let snippet = '';

  // Add description
  if (description) {
    snippet += `/*\n${description}\n*/\n\n`;
  }

  // Normalize code
  const normalized = normalizeCodeForAI(code, {
    removeComments: true,
    removeBlankLines: true,
    standardizeIndentation: true,
    preserveTypeAnnotations: includeTypes,
  });

  // If focus specified, extract relevant code
  if (focus) {
    const focused = extractMinimalSnippet(normalized, focus);
    snippet += focused;
  } else {
    snippet += normalized;
  }

  return snippet;
}
```

### 6.4 Token-Aware Chunking

```typescript
/**
 * Split code into chunks suitable for AI context
 */
export function chunkCodeForAI(
  code: string,
  maxTokens: number = 4000
): string[] {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  const chunks: string[] = [];

  // Split by code blocks
  const blocks = extractCodeBlocks(code);

  let currentChunk = '';
  let currentSize = 0;

  for (const block of blocks) {
    const blockSize = block.code.length;

    if (currentSize + blockSize > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
      currentSize = 0;
    }

    currentChunk += block.code + '\n\n';
    currentSize += blockSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
```

---

## 7. Integration Patterns

### 7.1 Building a Modular Minification Service

```typescript
// /src/services/minification.service.ts

import { minify } from 'terser';
import * as esbuild from 'esbuild';
import strip from 'strip-comments';

export interface MinificationOptions {
  method: 'terser' | 'esbuild' | 'strip-comments' | 'custom';
  removeComments: boolean;
  removeBlankLines: boolean;
  mangle: boolean;
  compress: boolean;
  preserveTypes?: boolean;
}

export class MinificationService {
  /**
   * Main minification method with strategy selection
   */
  async minify(code: string, options: MinificationOptions): Promise<string> {
    switch (options.method) {
      case 'terser':
        return this.terserMinify(code, options);
      case 'esbuild':
        return this.esbuildMinify(code, options);
      case 'strip-comments':
        return this.stripComments(code, options);
      case 'custom':
        return this.customMinify(code, options);
      default:
        throw new Error(`Unknown minification method: ${options.method}`);
    }
  }

  /**
   * Terser-based minification
   */
  private async terserMinify(
    code: string,
    options: MinificationOptions
  ): Promise<string> {
    const result = await minify(code, {
      compress: options.compress,
      mangle: options.mangle,
      format: {
        comments: !options.removeComments,
        ascii_only: false,
        beautify: !options.compress,
      },
      ecma: 2020,
      keep_classnames: options.preserveTypes,
      keep_fnames: options.preserveTypes,
    });

    if (result.error) {
      throw new Error(`Terser error: ${result.error.message}`);
    }

    return result.code || code;
  }

  /**
   * esbuild-based minification
   */
  private async esbuildMinify(
    code: string,
    options: MinificationOptions
  ): Promise<string> {
    const result = await esbuild.transform(code, {
      minify: options.compress,
      minifyWhitespace: options.compress,
      minifyIdentifiers: options.mangle,
      minifySyntax: options.compress,
      treeShaking: true,
      format: 'esm',
      target: 'es2020',
    });

    return result.code;
  }

  /**
   * Strip-comments based minification
   */
  private stripComments(code: string, options: MinificationOptions): string {
    let result = code;

    if (options.removeComments) {
      result = strip(result, {
        line: true,
        block: true,
        preserveNewlines: !options.removeBlankLines,
      });
    }

    if (options.removeBlankLines) {
      result = removeBlankLines(result);
    }

    return result;
  }

  /**
   * Custom minification pipeline
   */
  private customMinify(code: string, options: MinificationOptions): string {
    let result = code;

    if (options.removeComments) {
      result = removeComments(result);
    }

    if (options.removeBlankLines) {
      result = removeBlankLines(result);
    }

    if (options.compress) {
      result = compressWhitespace(result);
    }

    return result;
  }
}

// Helper functions
function removeComments(code: string): string {
  code = code.replace(/\/\/.*$/gm, '');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  return code;
}

function removeBlankLines(code: string): string {
  return code.replace(/^\s*[\r\n]/gm, '');
}

function compressWhitespace(code: string): string {
  return code
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim();
}
```

### 7.2 CLI Integration

```typescript
// /src/commands/minify.command.ts

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { MinificationService } from '../services/minification.service.js';

export const minifyCommand = new Command('minify')
  .description('Minify JavaScript/TypeScript code')
  .argument('<input>', 'Input file')
  .option('-o, --output <file>', 'Output file')
  .option('-m, --method <method>', 'Minification method', 'terser')
  .option('--no-comments', 'Remove comments')
  .option('--no-blank-lines', 'Remove blank lines')
  .option('--mangle', 'Mangle variable names')
  .option('--compress', 'Compress code')
  .option('--preserve-types', 'Preserve TypeScript types')
  .action(async (input, options) => {
    const service = new MinificationService();

    const code = readFileSync(input, 'utf-8');

    const result = await service.minify(code, {
      method: options.method,
      removeComments: options.comments === false,
      removeBlankLines: options.blankLines === false,
      mangle: options.mangle,
      compress: options.compress,
      preserveTypes: options.preserveTypes,
    });

    if (options.output) {
      writeFileSync(options.output, result, 'utf-8');
      console.log(`Minified code written to ${options.output}`);
    } else {
      console.log(result);
    }
  });
```

### 7.3 Integration with Existing Project

Given your project already uses esbuild, here's how to integrate minification:

```typescript
// /src/build/minify.ts

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Minify a TypeScript file using esbuild
 */
export async function minifyFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const code = readFileSync(inputPath, 'utf-8');

  const result = await esbuild.transform(code, {
    loader: 'ts',
    minify: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    treeShaking: true,
    format: 'esm',
  });

  writeFileSync(outputPath, result.code, 'utf-8');
}

/**
 * Minify code for AI prompts (preserves readability)
 */
export async function normalizeForAI(code: string): Promise<string> {
  const result = await esbuild.transform(code, {
    loader: 'ts',
    minifyWhitespace: true,
    minifyIdentifiers: false,
    minifySyntax: false,
    treeShaking: true,
    format: 'esm',
  });

  return result.code;
}
```

---

## 8. Code Examples

### 8.1 Complete Example: Code Processing Pipeline

```typescript
// /src/utils/code-processor.ts

import { minify } from 'terser';
import * as esbuild from 'esbuild';

export interface ProcessingOptions {
  // Minification options
  minify?: boolean;
  removeComments?: boolean;
  removeBlankLines?: boolean;
  mangle?: boolean;

  // Extraction options
  extractLines?: { start: number; end: number };
  extractFunction?: string;
  extractClass?: string;

  // AI optimization
  forAI?: boolean;
  maxTokens?: number;

  // Output format
  format?: 'minified' | 'readable' | 'compressed';
}

/**
 * Comprehensive code processing utility
 */
export class CodeProcessor {
  async process(
    code: string,
    options: ProcessingOptions = {}
  ): Promise<string> {
    let result = code;

    // Step 1: Extraction
    if (options.extractLines) {
      result = this.extractLineRange(result, options.extractLines);
    } else if (options.extractFunction) {
      result = this.extractFunction(result, options.extractFunction);
    } else if (options.extractClass) {
      result = this.extractClass(result, options.extractClass);
    }

    // Step 2: AI Optimization
    if (options.forAI) {
      result = await this.optimizeForAI(result, options.maxTokens);
    }

    // Step 3: Minification
    if (options.minify) {
      result = await this.minify(result, options);
    }

    // Step 4: Formatting
    if (options.format === 'readable') {
      result = this.makeReadable(result);
    }

    return result;
  }

  private extractLineRange(
    code: string,
    range: { start: number; end: number }
  ): string {
    const lines = code.split('\n');
    return lines.slice(range.start - 1, range.end).join('\n');
  }

  private extractFunction(code: string, functionName: string): string {
    const pattern = new RegExp(
      `(?:function\\s+${functionName}\\s*\\(|const\\s+${functionName}\\s*=|${functionName}\\s*[:=])[^{]*\\{[\\s\\S]*?\\n\\}`,
      'g'
    );
    const match = pattern.exec(code);
    return match ? match[0] : code;
  }

  private extractClass(code: string, className: string): string {
    const pattern = new RegExp(
      `class\\s+${className}\\s*(?:extends\\s+\\w+)?\\s*\\{[\\s\\S]*?\\n\\}`,
      'g'
    );
    const match = pattern.exec(code);
    return match ? match[0] : code;
  }

  private async optimizeForAI(
    code: string,
    maxTokens: number = 4000
  ): Promise<string> {
    // Remove comments
    let result = code.replace(/\/\/.*$/gm, '');
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove blank lines
    result = result.replace(/^\s*[\r\n]/gm, '');

    // Use esbuild for lightweight optimization (no mangling)
    const transformed = await esbuild.transform(result, {
      minifyWhitespace: true,
      minifyIdentifiers: false,
      minifySyntax: false,
    });

    result = transformed.code;

    // Truncate if too long
    const maxChars = maxTokens * 4;
    if (result.length > maxChars) {
      const keep = Math.floor((maxChars - 50) / 2);
      result =
        result.slice(0, keep) +
        '\n// ... (truncated) ...\n' +
        result.slice(-keep);
    }

    return result;
  }

  private async minify(
    code: string,
    options: ProcessingOptions
  ): Promise<string> {
    const result = await minify(code, {
      compress: true,
      mangle: options.mangle ?? false,
      format: {
        comments: false,
        beautify: false,
      },
    });

    return result.code || code;
  }

  private makeReadable(code: string): string {
    return code
      .replace(/;/g, ';\n')
      .replace(/\{/g, ' {\n')
      .replace(/\}/g, '\n}\n')
      .replace(/^\s+/gm, '  ');
  }
}

// Usage example
export async function exampleUsage() {
  const processor = new CodeProcessor();

  const code = `
    // Example function
    function add(a: number, b: number): number {
      // Add two numbers
      return a + b;
    }
  `;

  // For AI prompts
  const aiOptimized = await processor.process(code, {
    forAI: true,
    maxTokens: 1000,
    removeComments: true,
  });

  // Fully minified
  const minified = await processor.process(code, {
    minify: true,
    mangle: true,
  });

  // Extract specific function
  const extracted = await processor.process(code, {
    extractFunction: 'add',
    format: 'readable',
  });

  console.log('AI Optimized:', aiOptimized);
  console.log('Minified:', minified);
  console.log('Extracted:', extracted);
}
```

### 8.2 Quick Reference: Common Operations

```typescript
// Quick reference for common operations

// 1. Remove comments
const noComments = code
  .replace(/\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');

// 2. Remove blank lines
const noBlanks = code.replace(/^\s*[\r\n]/gm, '');

// 3. Compress whitespace
const compressed = code.replace(/\s+/g, ' ').trim();

// 4. Extract line range
const lines = code.split('\n');
const range = lines.slice(10, 20).join('\n');

// 5. Count lines
const lineCount = code.split('\n').length;

// 6. Count tokens (rough estimate)
const tokenCount = Math.ceil(code.length / 4);

// 7. Check if code is too long
const isTooLong = (code: string, maxTokens: number) => {
  return Math.ceil(code.length / 4) > maxTokens;
};

// 8. Truncate with ellipsis
const truncate = (code: string, maxChars: number) => {
  if (code.length <= maxChars) return code;
  const keep = Math.floor((maxChars - 20) / 2);
  return code.slice(0, keep) + '\n// ... \n' + code.slice(-keep);
};

// 9. Extract imports
const imports = code.match(/^import\s+.*$/gm) || [];

// 10. Extract function by name
const extractFn = (code: string, name: string) => {
  const regex = new RegExp(
    `function\\s+${name}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`,
    'g'
  );
  return regex.exec(code)?.[0];
};
```

---

## Summary of Libraries

| Library            | Use Case               | Speed   | Output Size | Type Safety |
| ------------------ | ---------------------- | ------- | ----------- | ----------- |
| **Terser**         | Advanced minification  | Medium  | Smallest    | Preserved   |
| **esbuild**        | Fast build + minify    | Fastest | Small       | Preserved   |
| **SWC**            | Ultra-fast compilation | Fastest | Small       | Preserved   |
| **strip-comments** | Comment removal only   | Fastest | N/A         | Preserved   |
| **@vercel/ncc**    | Single-file bundling   | Fast    | Medium      | Preserved   |

## Recommendations

1. **For Production Builds**: Use esbuild (already in your project) or Terser
2. **For AI Prompts**: Use lightweight compression (remove comments/blank lines only)
3. **For CLI Tools**: Use @vercel/ncc for single-file distribution
4. **For Development**: Use esbuild's transform API for fast iteration

## Next Steps for Your Project

1. Add terser for advanced minification: `npm install terser`
2. Create a code processing utility module in `/src/utils/code-processor.ts`
3. Add CLI command for code minification: `npm run build:minify`
4. Integrate with your existing groundswell workflow

---

**Sources:**

- [Terser GitHub Repository](https://github.com/terser/terser)
- [esbuild Documentation](https://esbuild.github.io/)
- [SWC Documentation](https://swc.rs/)
- [Vercel ncc GitHub Repository](https://github.com/vercel/ncc)
- [strip-comments GitHub Repository](https://github.com/jonschlinkert/strip-comments)
- [@babel/parser Documentation](https://babeljs.io/docs/en/babel-parser)
