# TypeScript Compiler Output Parsing - Research Summary

## Quick Reference

### Recommended tsc Command for Parsing

```bash
tsc --noEmit --pretty false 2>&1
```

### Error Format Pattern

```
file_path(line,column): error TSXXXX: error_message
```

### Key Characteristics

- **Output Stream:** All errors go to **stderr**
- **Exit Code:** `0` (success) or `2` (errors)
- **Format:** Consistent, machine-readable when using `--pretty false`

---

## Example Error Output

```
src/test.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
src/utils.ts(14,35): error TS2307: Cannot find module 'lodash' or its corresponding type declarations.
src/types.ts(17,7): error TS2741: Property 'age' is missing in type '{ name: string; }' but required in type 'User'.
```

---

## Common Error Patterns

### TS2307 - Cannot Find Module

```
error TS2307: Cannot find module 'module-name' or its corresponding type declarations.
```

**Regex:** `/TS2307:\s+Cannot find module ['"]([^'"]+)['"]/`

### TS2322 - Type Assignment Error

```
error TS2322: Type 'string' is not assignable to type 'number'.
```

**Regex:** `/TS2322:\s+Type '([^']+)' is not assignable to type '([^']+)'/`

### TS2741 - Missing Property

```
error TS2741: Property 'age' is missing in type 'source' but required in type 'target'.
```

**Regex:** `/TS2741:\s+Property '(\w+)' is missing in type '([^']+)'/`

---

## Recommended NPM Packages

### 1. @aivenio/tsc-output-parser (Recommended)

- **Version:** 2.1.1
- **License:** Apache 2.0
- **Dependencies:** None
- **Install:** `npm install @aivenio/tsc-output-parser`
- **CLI:** `tsc --noEmit --pretty false 2>&1 | tsc-output-parser`

### 2. ts-error-parser

- **Version:** 1.0.0
- **License:** MIT
- **Dependencies:** None
- **Install:** `npm install ts-error-parser`

### 3. fork-ts-checker-webpack-plugin

- **For webpack integration**
- **Reference for parsing patterns**
- **Install:** `npm install fork-ts-checker-webpack-plugin`

---

## Simple Parser Implementation

```javascript
function parseTscOutput(output) {
  const lines = output.trim().split('\n');
  const errors = [];
  const pattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

  for (const line of lines) {
    const match = line.match(pattern);
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
  };
}
```

---

## Error Code Categories

| Range         | Category      | Examples               |
| ------------- | ------------- | ---------------------- |
| TS1000-TS1999 | Compiler      | TS1005, TS1108         |
| TS2000-TS2999 | Module        | TS2307, TS6053         |
| TS2300-TS2499 | Type          | TS2322, TS2345, TS2741 |
| TS2500-TS2999 | Declaration   | TS2304, TS2339         |
| TS5000-TS9999 | Configuration | TS5009, TS5074         |

---

## Best Practices

1. **Use `--pretty false`** for machine-readable output
2. **Read from stderr**, not stdout
3. **Use `shell: false`** when spawning for security
4. **Implement timeout handling** (30s recommended)
5. **Parse line-by-line** with robust regex
6. **Validate error codes** for categorization

---

## Documentation URLs

### Official TypeScript

- [Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [tsconfig.json](https://www.typescriptlang.org/tsconfig)
- [Project Compilation](https://www.typescriptlang.org/docs/handbook/project-compilation.html)
- [GitHub Repository](https://github.com/microsoft/TypeScript)

### Error Codes

- [Diagnostic Messages](https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json)
- [Error Code Reference](https://typescript.tv/errors/)

### NPM Packages

- [@aivenio/tsc-output-parser](https://www.npmjs.com/package/@aivenio/tsc-output-parser)
- [ts-error-parser](https://www.npmjs.com/package/ts-error-parser)
- [@k88/typescript-compile-error-formatter](https://www.npmjs.com/package/@k88/typescript-compile-error-formatter)
- [fork-ts-checker-webpack-plugin](https://www.npmjs.com/package/fork-ts-checker-webpack-plugin)

---

## Files in This Directory

1. **typescript-compiler-output-research.md** - Comprehensive research document
2. **tsc-parser-example.cjs** - Working parser implementation with examples
3. **README.md** - This quick reference guide

---

## Testing

To test the parser example:

```bash
cd /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S6
node tsc-parser-example.cjs
```

To test with real TypeScript files:

```bash
cd /tmp
tsc --noEmit --pretty false your-file.ts 2>&1
```

---

**Research Date:** 2026-01-14
**TypeScript Version:** 5.9.3
**Document Version:** 1.0
