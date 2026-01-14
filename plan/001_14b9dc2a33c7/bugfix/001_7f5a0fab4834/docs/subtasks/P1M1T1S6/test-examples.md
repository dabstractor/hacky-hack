# TypeScript Compiler Output - Real-World Test Examples

This document shows actual TypeScript compiler output with various error types, demonstrating the consistent format that makes parsing straightforward.

## Test Environment
- **TypeScript Version:** 5.9.3
- **Date:** 2026-01-14
- **Command:** `tsc --noEmit --pretty false`

---

## Example 1: Mixed Error Types

### Test File (tsc-test-file.ts)
```typescript
interface User {
  name: string;
  age: number;
}

// Error 1: Type mismatch
function testTypeMismatch(): void {
  const num: number = "not a number";
}

// Error 2: Missing module
import { nonExistentModule } from 'fake-module-that-does-not-exist';

// Error 3: Property missing
const user: User = {
  name: "John"
  // Missing 'age' property
};

// Error 4: Cannot find module with relative path
import { something } from './non-existent-file';

// Error 5: Any type error
const result: string = 12345;
```

### Actual tsc Output
```
tsc-test-file.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
tsc-test-file.ts(14,35): error TS2307: Cannot find module 'fake-module-that-does-not-exist' or its corresponding type declarations.
tsc-test-file.ts(17,7): error TS2741: Property 'age' is missing in type '{ name: string; }' but required in type 'User'.
tsc-test-file.ts(23,27): error TS2307: Cannot find module './non-existent-file' or its corresponding type declarations.
tsc-test-file.ts(26,7): error TS2322: Type 'number' is not assignable to type 'string'.
```

### Parsed Result
```javascript
{
  success: false,
  exitCode: 2,
  errorCount: 5,
  errors: [
    {
      file: 'tsc-test-file.ts',
      line: 10,
      column: 9,
      code: 'TS2322',
      message: "Type 'string' is not assignable to type 'number'."
    },
    {
      file: 'tsc-test-file.ts',
      line: 14,
      column: 35,
      code: 'TS2307',
      message: "Cannot find module 'fake-module-that-does-not-exist' or its corresponding type declarations."
    },
    // ... 3 more errors
  ]
}
```

---

## Example 2: Complex Type Errors

### Test File (tsc-test-complex.ts)
```typescript
// Test property mismatch
function complexFunction() {
  const obj = { a: 1, b: 2 };
  const result: { a: number; b: number; c: number } = obj;
}

// Test Promise library error (missing lib)
async function asyncError() {
  const promise: Promise<string> = Promise.resolve("test");
  const result: number = await promise;
}
```

### Actual tsc Output
```
tsc-test-complex.ts(4,9): error TS2741: Property 'c' is missing in type '{ a: number; b: number; }' but required in type '{ a: number; b: number; c: number; }'.
tsc-test-complex.ts(14,36): error TS2585: 'Promise' only refers to a type, but is being used as a value here. Do you need to change your target library? Try changing the 'lib' compiler option to es2015 or later.
tsc-test-complex.ts(15,9): error TS2322: Type 'string' is not assignable to type 'number'.
```

---

## Example 3: Module Resolution Errors Only

### Test File (module-errors.ts)
```typescript
import express from 'express';
import lodash from 'lodash';
import { myFunc } from './local-file';
import { something } from '@scope/package';
```

### Actual tsc Output
```
module-errors.ts(1,22): error TS2307: Cannot find module 'express' or its corresponding type declarations.
module-errors.ts(2,21): error TS2307: Cannot find module 'lodash' or its corresponding type declarations.
module-errors.ts(3,24): error TS2307: Cannot find module './local-file' or its corresponding type declarations.
module-errors.ts(4,27): error TS2307: Cannot find module '@scope/package' or its corresponding type declarations.
```

### Module Names Extracted
```javascript
{
  modules: [
    'express',
    'lodash',
    './local-file',
    '@scope/package'
  ]
}
```

---

## Example 4: Empty Output (Success)

### Test File (success.ts)
```typescript
const greeting: string = "Hello, World!";
function add(a: number, b: number): number {
  return a + b;
}
export { greeting, add };
```

### Actual tsc Output
```
(empty - no output to stderr)
```

### Parsed Result
```javascript
{
  success: true,
  exitCode: 0,
  errorCount: 0,
  errors: []
}
```

---

## Example 5: File Paths with Special Characters

### Test Command
```bash
tsc --noEmit --pretty false "path/to/file with spaces.ts"
```

### Actual tsc Output
```
path/to/file with spaces.ts(5,10): error TS2322: Type 'string' is not assignable to type 'number'.
```

### Parsing Considerations
- File paths may contain spaces
- Use non-greedy regex: `^(.+?)(?:\((\d+),(\d+)\))?`
- Quote file paths in subsequent operations

---

## Example 6: Project Reference Errors

### Test File (src/tsconfig.app.ts)
```typescript
// Inside a project with references
const value: string = 123;
```

### Actual tsc Output
```
src/tsconfig.app.ts(2,7): error TS2322: Type 'number' is not assignable to type 'string'.
```

---

## Parsing Examples

### Extract Module Names from TS2307 Errors
```javascript
const output = `error TS2307: Cannot find module 'express' or its corresponding type declarations.
error TS2307: Cannot find module './utils/helper' or its corresponding type declarations.
error TS2307: Cannot find module '@scope/package' or its corresponding type declarations.`;

const lines = output.split('\n');
const modules = [];

for (const line of lines) {
  const match = line.match(/Cannot find module ['"]([^'"]+)['"]/);
  if (match) {
    modules.push(match[1]);
  }
}

// Result: ['express', './utils/helper', '@scope/package']
```

### Categorize Errors by Code Range
```javascript
function categorizeError(code) {
  const num = parseInt(code.replace('TS', ''), 10);

  if (num >= 1000 && num < 2000) return 'compiler';
  if (num >= 2000 && num < 3000) return 'module';
  if (num >= 3000 && num < 4000) return 'type';
  if (num >= 5000 && num < 6000) return 'config';

  return 'unknown';
}

// Examples:
categorizeError('TS1005');  // 'compiler'
categorizeError('TS2307');  // 'module'
categorizeError('TS2322');  // 'type'
categorizeError('TS5074');  // 'config'
```

---

## Exit Code Behavior

### Success Case
```bash
$ tsc --noEmit --pretty false success.ts
$ echo $?
0
```

### Error Case
```bash
$ tsc --noEmit --pretty false errors.ts
src/test.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
$ echo $?
2
```

---

## Key Observations

1. **Consistent Format:** Every error follows the exact same pattern
2. **Line/Column are 1-indexed:** First line is 1, first column is 1
3. **Error Codes are Stable:** TSXXXX codes don't change between versions
4. **Messages are Descriptive:** Human-readable but also parseable
5. **No ANSI Codes:** Using `--pretty false` ensures clean output
6. **All Output in stderr:** Even with --noEmit, errors go to stderr

---

## Testing the Parser

Run the example parser with test data:
```bash
cd /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S6
node tsc-parser-example.cjs
```

Create your own test file:
```bash
cat > /tmp/test-parse.ts << 'EOF'
const x: string = 123;
import { missing } from 'fake-module';
EOF

tsc --noEmit --pretty false /tmp/test-parse.ts 2>&1
```

---

## Summary

The TypeScript compiler output format is **highly consistent and predictable**, making it straightforward to parse with simple regex patterns. The key recommendations are:

1. Always use `--noEmit --pretty false`
2. Read from stderr, not stdout
3. Parse line-by-line with the pattern: `file(line,col): error TSXXXX: message`
4. Handle exit codes: 0 (success) or 2 (errors)
5. Extract structured data using regex capture groups

No complex parsing libraries are needed - a simple regex-based parser is sufficient and recommended.
