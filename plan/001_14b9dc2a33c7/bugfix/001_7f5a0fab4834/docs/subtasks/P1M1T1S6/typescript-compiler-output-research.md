# TypeScript Compiler (tsc) Output Format Research

## Overview

This document provides comprehensive research on TypeScript compiler (tsc) output format when run with `--noEmit`, error formatting patterns, parsing strategies, and available npm utilities.

**Research Date:** 2026-01-14
**TypeScript Version Tested:** 5.9.3

---

## 1. TypeScript Compiler Output Format with --noEmit

### 1.1 Basic Command Behavior

When running `tsc --noEmit`, TypeScript performs type checking without emitting JavaScript files. All errors are written to **stderr** with the following characteristics:

- **Exit Code:** `2` when errors are present, `0` when successful
- **Output Stream:** All errors go to **stderr**, not stdout
- **Default Format:** Human-readable with file paths, line/column numbers, error codes, and messages

### 1.2 Standard Error Format

The canonical format for TypeScript errors is:

```
file_path(line,column): error TSXXXX: error_message
```

#### Example Output:

```
tsc-test-file.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
tsc-test-file.ts(14,35): error TS2307: Cannot find module 'fake-module-that-does-not-exist' or its corresponding type declarations.
tsc-test-file.ts(17,7): error TS2741: Property 'age' is missing in type '{ name: string; }' but required in type 'User'.
```

#### Format Breakdown:

1. **File Path:** Relative or absolute path to the source file
2. **Line Number:** In parentheses, indicates the line where the error occurs (1-indexed)
3. **Column Number:** After comma in parentheses, indicates the column position (1-indexed)
4. **Error Type:** Always "error" for errors (could be "warning" for warnings in some contexts)
5. **Error Code:** TS followed by a 4-digit number (e.g., TS2322)
6. **Error Message:** Human-readable description of the issue

### 1.3 Compiler Flags Affecting Output

| Flag                  | Effect                                      | Recommendation for Parsing                 |
| --------------------- | ------------------------------------------- | ------------------------------------------ |
| `--noEmit`            | Perform type checking only, no output files | **Use** - Essential for validation         |
| `--pretty false`      | Disable colors and extra formatting         | **Use** - Produces machine-parsable output |
| `--pretty` (default)  | Enable colors and context (default)         | Avoid - Contains ANSI escape codes         |
| `--listFiles`         | List all files in compilation               | Optional - For debugging                   |
| `--noErrorTruncation` | Disable truncating long error messages      | Optional - For complete messages           |
| `--diagnostics`       | Show diagnostic information                 | Optional - For debugging                   |

**Recommended command for parsing:**

```bash
tsc --noEmit --pretty false 2>&1
```

---

## 2. Common Error Patterns to Parse

### 2.1 "Cannot Find Module" Errors (TS2307)

**Pattern:**

```
file_path(line,column): error TS2307: Cannot find module 'module-name' or its corresponding type declarations.
```

**Variations:**

```
# External module
error TS2307: Cannot find module 'express'

# Relative path module
error TS2307: Cannot find module './utils/helper'

# With type declarations suggestion
error TS2307: Cannot find module 'lodash' or its corresponding type declarations.
```

**Regex Pattern:**

```javascript
/TS2307:\s+Cannot find module ['"]([^'"]+)['"]/;
```

### 2.2 Type Assignment Errors (TS2322)

**Pattern:**

```
file_path(line,column): error TS2322: Type 'source_type' is not assignable to type 'target_type'.
```

**Example:**

```
tsc-test-file.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
```

**Regex Pattern:**

```javascript
/TS2322:\s+Type '([^']+)' is not assignable to type '([^']+)'/;
```

### 2.3 Property Missing Errors (TS2741)

**Pattern:**

```
file_path(line,column): error TS2741: Property 'property_name' is missing in type 'source_type' but required in type 'target_type'.
```

**Example:**

```
tsc-test-file.ts(17,7): error TS2741: Property 'age' is missing in type '{ name: string; }' but required in type 'User'.
```

**Regex Pattern:**

```javascript
/TS2741:\s+Property '(\w+)' is missing in type '([^']+)' but required in type '([^']+)'/;
```

### 2.4 Common Error Code Categories

| Code Range    | Category                | Examples               |
| ------------- | ----------------------- | ---------------------- |
| TS1000-TS1999 | General Compiler Errors | TS1005, TS1108         |
| TS2000-TS2999 | Module Resolution       | TS2307, TS6053         |
| TS2300-TS2499 | Type Checking           | TS2322, TS2345, TS2741 |
| TS2500-TS2999 | Declaration Errors      | TS2304, TS2339         |
| TS5000-TS9999 | Configuration           | TS5009, TS5074, TS6053 |

---

## 3. Parsing Strategies and Best Practices

### 3.1 Basic Line-by-Line Parsing

**Strategy:** Split output by newlines and parse each error individually.

```javascript
function parseTscOutput(output) {
  const lines = output.trim().split('\n');
  const errors = [];

  for (const line of lines) {
    const match = line.match(/^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],
        message: match[5],
      });
    }
  }

  return errors;
}
```

### 3.2 Robust Regex Pattern

**Comprehensive pattern that handles various edge cases:**

```javascript
const TSC_ERROR_PATTERN =
  /^(.+?)(?:\((\d+),(\d+)\))?:\s*(error|warning)\s+(TS\d+):\s*(.+)$/;

function parseTscError(line) {
  const match = line.match(TSC_ERROR_PATTERN);
  if (!match) return null;

  return {
    file: match[1],
    line: match[2] ? parseInt(match[2], 10) : null,
    column: match[3] ? parseInt(match[3], 10) : null,
    severity: match[4],
    code: match[5],
    message: match[6].trim(),
  };
}
```

### 3.3 Handling Edge Cases

#### Case 1: Multiline Error Messages

Some error messages span multiple lines (rare with `--pretty false`).

```javascript
// Solution: Process line by line, expecting format:
// file(line,col): error TSXXXX: message start
//   continued message (indented)
```

#### Case 2: File Paths with Spaces

File paths may contain spaces or special characters.

```javascript
// The regex must use non-greedy matching for the file path:
/^(.+?)(?:\((\d+),(\d+)\))?:/;
//     ^^^^ Non-greedy capture
```

#### Case 3: Project References

When using project references, errors may include the project name.

```
src/tsconfig.app.ts(10,9): error TS2322: ...
```

### 3.4 Spawn Command Pattern for Node.js

```javascript
import { spawn } from 'child_process';

function runTsc(cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const tsc = spawn('tsc', ['--noEmit', '--pretty false'], {
      cwd,
      shell: false, // Security: don't use shell
    });

    let stdout = '';
    let stderr = '';

    tsc.stdout.on('data', data => {
      stdout += data.toString();
    });

    tsc.stderr.on('data', data => {
      stderr += data.toString();
    });

    tsc.on('close', code => {
      // Errors are in stderr, not stdout
      const errors = parseTscOutput(stderr);

      resolve({
        success: code === 0,
        exitCode: code,
        stdout,
        stderr,
        errors,
      });
    });

    tsc.on('error', error => {
      reject(new Error(`Failed to spawn tsc: ${error.message}`));
    });
  });
}
```

### 3.5 Timeout Handling

```javascript
function runTscWithTimeout(cwd, timeoutMs = 30000) {
  return Promise.race([
    runTsc(cwd),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('tsc timeout')), timeoutMs)
    ),
  ]);
}
```

---

## 4. NPM Packages for Parsing tsc Output

### 4.1 @aivenio/tsc-output-parser

**Repository:** https://github.com/aivenio/tsc-output-parser (if available)
**Version:** 2.1.1
**License:** Apache 2.0
**Dependencies:** None

**Description:**
Parses errors from tsc output to a structured JSON format. Includes a CLI tool.

**Installation:**

```bash
npm install @aivenio/tsc-output-parser
```

**Usage:**

```bash
# CLI
tsc --noEmit --pretty false 2>&1 | tsc-output-parser

# Programmatic
const parser = require('@aivenio/tsc-output-parser');
const errors = parser.parse(tscOutputString);
```

**Pros:**

- Zero dependencies
- Dedicated parser for tsc output
- CLI tool included
- Apache 2.0 license

**Cons:**

- Last updated over a year ago
- May not support latest TypeScript features

### 4.2 ts-error-parser

**Repository:** https://github.com/yuichkun/ts-error-parser
**Version:** 1.0.0
**License:** MIT
**Dependencies:** None

**Description:**
A parser for TypeScript error logs.

**Installation:**

```bash
npm install ts-error-parser
```

**Pros:**

- Lightweight, no dependencies
- MIT license
- Simple implementation

**Cons:**

- Minimal documentation
- Single version release (may be unmaintained)

### 4.3 @k88/typescript-compile-error-formatter

**Repository:** https://github.com/ktalebian/typescript-compile-error-formatter
**Version:** 2.1.0
**License:** ISC
**Dependencies:** 4 (@babel/code-frame, chalk, fs, os)

**Description:**
Formats TypeScript error messages from Fork TS Checker Webpack Plugin. Uses Babel code frame for syntax highlighting.

**Installation:**

```bash
npm install @k88/typescript-compile-error-formatter
```

**Pros:**

- Actively maintained
- Syntax highlighting with code frames
- Designed for webpack integration

**Cons:**

- More dependencies
- Focused on formatting, not parsing
- Designed for webpack ecosystem

### 4.4 @becklyn/typescript-error-formatter

**Repository:** https://github.com/Becklyn/typescript-error-formatter
**Version:** 1.0.4
**License:** BSD-3-Clause
**Dependencies:** None

**Description:**
Error formatter for TypeScript errors.

**Pros:**

- Zero dependencies
- BSD-3-Clause license

**Cons:**

- Last updated 2019
- Primarily for formatting, not parsing

### 4.5 ts-error-formatter

**Repository:** https://github.com/jleider/ts-error-formatter
**Version:** 0.2.1
**License:** MIT
**Dependencies:** None

**Description:**
Syntax highlighter for TypeScript error messages.

**Pros:**

- Zero dependencies
- MIT license

**Cons:**

- Focused on highlighting, not parsing
- Older package

### 4.6 fork-ts-checker-webpack-plugin

**Repository:** https://github.com/TypeStrong/fork-ts-checker-webpack-plugin
**Version:** 9.1.0
**License:** MIT

**Description:**
Runs TypeScript type checker and linter on separate process. Includes error parsing and formatting capabilities.

**Relevance:**
While primarily a webpack plugin, it contains robust TypeScript error parsing logic that can be referenced for implementation patterns.

---

## 5. Recommended Implementation Approach

### 5.1 Build Your Own Parser

Given the straightforward format of tsc output, building a custom parser is often better than using existing packages:

**Advantages:**

- Full control over parsing logic
- Zero dependencies
- Can tailor to specific needs
- No maintenance concerns from third-party packages

**Recommended Pattern:**

```typescript
interface TscError {
  file: string;
  line: number;
  column: number;
  code: string; // e.g., "TS2307"
  message: string;
}

interface TscResult {
  success: boolean;
  exitCode: number;
  errors: TscError[];
  rawOutput: string;
}

/**
 * Parse TypeScript compiler output into structured errors
 */
export function parseTscOutput(output: string): TscResult {
  const lines = output.trim().split('\n');
  const errors: TscError[] = [];

  // Regex: file(line,col): error TSXXXX: message
  const errorPattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

  for (const line of lines) {
    const match = line.match(errorPattern);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],
        message: match[5],
      });
    }
  }

  return {
    success: errors.length === 0,
    exitCode: errors.length === 0 ? 0 : 2,
    errors,
    rawOutput: output,
  };
}

/**
 * Execute tsc and parse output
 */
export async function runTsc(
  projectPath: string,
  timeoutMs: number = 30000
): Promise<TscResult> {
  const { spawn } = require('child_process');

  return new Promise((resolve, reject) => {
    let stderr = '';
    let stdout = '';

    const tsc = spawn('tsc', ['--noEmit', '--pretty false'], {
      cwd: projectPath,
      shell: false,
    });

    // Set timeout
    const timeout = setTimeout(() => {
      tsc.kill('SIGTERM');
      reject(new Error(`tsc timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    tsc.stdout.on('data', data => {
      stdout += data.toString();
    });

    tsc.stderr.on('data', data => {
      stderr += data.toString();
    });

    tsc.on('close', code => {
      clearTimeout(timeout);
      resolve(parseTscOutput(stderr));
    });

    tsc.on('error', error => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn tsc: ${error.message}`));
    });
  });
}
```

### 5.2 Error Code Detection Patterns

```typescript
/**
 * Check if error is a "Cannot find module" error
 */
export function isModuleNotFoundError(error: TscError): boolean {
  return (
    error.code === 'TS2307' || error.message.includes('Cannot find module')
  );
}

/**
 * Extract module name from TS2307 error
 */
export function extractModuleName(error: TscError): string | null {
  if (error.code !== 'TS2307') return null;

  const match = error.message.match(/Cannot find module ['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

/**
 * Check if error is a type mismatch error
 */
export function isTypeError(error: TscError): boolean {
  return error.code === 'TS2322';
}

/**
 * Get error category from code
 */
export function getErrorCategory(code: string): string {
  const num = parseInt(code.replace('TS', ''), 10);

  if (num >= 1000 && num < 2000) return 'compiler';
  if (num >= 2000 && num < 3000) return 'module';
  if (num >= 3000 && num < 4000) return 'type';
  if (num >= 5000 && num < 6000) return 'config';

  return 'unknown';
}
```

---

## 6. Documentation URLs

### Official TypeScript Documentation

- **TypeScript Compiler Options:** https://www.typescriptlang.org/docs/handbook/compiler-options.html
- **tsconfig.json:** https://www.typescriptlang.org/tsconfig
- **Project Compilation:** https://www.typescriptlang.org/docs/handbook/project-compilation.html
- **TypeScript GitHub:** https://github.com/microsoft/TypeScript

### TypeScript Error Codes

- **Diagnostic Messages:** https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
- **Error Code Reference:** https://typescript.tv/errors/

### NPM Packages

- **@aivenio/tsc-output-parser:** https://www.npmjs.com/package/@aivenio/tsc-output-parser
- **ts-error-parser:** https://www.npmjs.com/package/ts-error-parser
- **@k88/typescript-compile-error-formatter:** https://www.npmjs.com/package/@k88/typescript-compile-error-formatter
- **@becklyn/typescript-error-formatter:** https://www.npmjs.com/package/@becklyn/typescript-error-formatter
- **ts-error-formatter:** https://www.npmjs.com/package/ts-error-formatter
- **fork-ts-checker-webpack-plugin:** https://www.npmjs.com/package/fork-ts-checker-webpack-plugin

---

## 7. Summary and Recommendations

### Key Findings:

1. **Output Format:** TypeScript uses a consistent, well-defined format: `file(line,col): error TSXXXX: message`
2. **Stream:** All errors go to **stderr**, not stdout
3. **Recommended Flags:** Use `--noEmit --pretty false` for machine-readable output
4. **Parsing Strategy:** Simple regex-based parsing is sufficient and recommended
5. **Exit Codes:** `0` for success, `2` for errors

### Common Error Patterns:

- **TS2307:** Cannot find module (use regex to extract module name)
- **TS2322:** Type assignment errors
- **TS2741:** Missing required properties
- **Error Code Format:** Always `TS` followed by 4 digits

### Best Practices:

1. **Always use `--pretty false`** when parsing programmatically
2. **Read from stderr**, not stdout
3. **Use `shell: false`** when spawning tsc for security
4. **Implement timeout handling** to prevent hanging
5. **Parse line-by-line** with a robust regex pattern
6. **Validate error codes** to categorize errors

### Recommendation:

**Build your own parser** rather than using existing npm packages because:

- The format is simple and stable
- Zero dependencies
- Full control over behavior
- No maintenance burden from third-party packages

Use the reference implementation provided in section 5.1 as a starting point.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**TypeScript Version:** 5.9.3
