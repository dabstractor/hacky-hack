# TypeScript Compiler Output Parsing - Research Index

**Research Date:** 2026-01-14
**TypeScript Version Tested:** 5.9.3
**Task:** P1.M1.T1.S6 - Research and document TypeScript compiler output format and parsing strategies

---

## Document Overview

This research provides comprehensive documentation on TypeScript compiler (tsc) output format when run with `--noEmit`, including error formatting patterns, parsing strategies, and available npm utilities.

---

## 📁 Files in This Directory

### 1. README.md (Quick Reference)
**Purpose:** Quick start guide with essential information
**Content:**
- Recommended tsc command for parsing
- Error format pattern
- Common error patterns (TS2307, TS2322, TS2741)
- Recommended npm packages
- Simple parser implementation
- Error code categories
- Best practices
- Documentation URLs

**When to use:** Getting started quickly or needing a quick reference

### 2. typescript-compiler-output-research.md (Comprehensive Research)
**Purpose:** Complete research documentation
**Content:**
- TypeScript compiler output format with --noEmit
- Compiler flags affecting output
- Common error patterns to parse (detailed)
- Parsing strategies and best practices
- Spawn command patterns for Node.js
- Timeout handling
- NPM packages for parsing tsc output (5 packages reviewed)
- Recommended implementation approach
- Error code detection patterns
- Full TypeScript implementation example

**When to use:** Deep dive into all aspects of tsc output parsing

### 3. tsc-parser-example.cjs (Working Implementation)
**Purpose:** Functional parser implementation with examples
**Content:**
- `parseTscLine()` - Parse single line
- `parseTscOutput()` - Parse complete output
- `isModuleNotFoundError()` - Check for TS2307
- `extractModuleName()` - Extract module name from error
- `getErrorCategory()` - Categorize errors by code
- `groupErrorsByCategory()` - Group errors
- Demo with test data

**When to use:** Reference implementation or starting point for your own parser

**How to run:**
```bash
cd /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S6
node tsc-parser-example.cjs
```

### 4. test-examples.md (Real-World Examples)
**Purpose:** Actual tsc output with various error types
**Content:**
- Example 1: Mixed error types
- Example 2: Complex type errors
- Example 3: Module resolution errors
- Example 4: Empty output (success)
- Example 5: File paths with special characters
- Example 6: Project reference errors
- Parsing examples with code
- Exit code behavior
- Key observations

**When to use:** Understanding real-world tsc output or testing parsers

### 5. INDEX.md (This File)
**Purpose:** Navigation and overview of all research documents

---

## 🎯 Key Findings Summary

### TypeScript Compiler Output Format

**Standard Format:**
```
file_path(line,column): error TSXXXX: error_message
```

**Example:**
```
src/test.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
```

**Key Characteristics:**
- All errors go to **stderr** (not stdout)
- Exit code `0` for success, `2` for errors
- Consistent, predictable format
- Machine-readable when using `--pretty false`

### Recommended Command
```bash
tsc --noEmit --pretty false 2>&1
```

### Common Error Patterns

| Error Code | Pattern | Regex |
|------------|---------|-------|
| TS2307 | Cannot find module | `/TS2307:\s+Cannot find module ['"]([^'"]+)['"]/` |
| TS2322 | Type assignment error | `/TS2322:\s+Type '([^']+)' is not assignable to type '([^']+)'/` |
| TS2741 | Missing property | `/TS2741:\s+Property '(\w+)' is missing/` |

### NPM Packages Reviewed

1. **@aivenio/tsc-output-parser** (Recommended)
   - Zero dependencies
   - Apache 2.0 license
   - CLI tool included

2. **ts-error-parser**
   - Lightweight, MIT license
   - Minimal documentation

3. **@k88/typescript-compile-error-formatter**
   - Actively maintained
   - For webpack ecosystem

4. **@becklyn/typescript-error-formatter**
   - Zero dependencies
   - Older package (2019)

5. **ts-error-formatter**
   - Syntax highlighting focus
   - MIT license

### Recommendation

**Build your own parser** rather than using existing packages because:
- The format is simple and stable
- Zero dependencies
- Full control over behavior
- No maintenance burden

Use the reference implementation in `tsc-parser-example.cjs` as a starting point.

---

## 📚 Documentation URLs

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
- [@becklyn/typescript-error-formatter](https://www.npmjs.com/package/@becklyn/typescript-error-formatter)
- [ts-error-formatter](https://www.npmjs.com/package/ts-error-formatter)
- [fork-ts-checker-webpack-plugin](https://www.npmjs.com/package/fork-ts-checker-webpack-plugin)

---

## 🚀 Quick Start

### 1. Understand the Format
```bash
tsc --noEmit --pretty false your-file.ts 2>&1
```

Output:
```
your-file.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
```

### 2. Parse with Regex
```javascript
const pattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
const match = line.match(pattern);

// Result:
// {
//   file: match[1],
//   line: parseInt(match[2]),
//   column: parseInt(match[3]),
//   code: match[4],
//   message: match[5]
// }
```

### 3. Run Example Parser
```bash
cd /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S6
node tsc-parser-example.cjs
```

---

## 📋 Best Practices Checklist

- [ ] Use `--noEmit --pretty false` for machine-readable output
- [ ] Read from **stderr**, not stdout
- [ ] Use `shell: false` when spawning tsc for security
- [ ] Implement timeout handling (30s recommended)
- [ ] Parse line-by-line with robust regex
- [ ] Validate error codes for categorization
- [ ] Handle file paths with spaces
- [ ] Check exit codes: 0 (success) or 2 (errors)

---

## 🔬 Testing Examples

### Test with Real TypeScript Files
```bash
# Create test file
cat > /tmp/test.ts << 'EOF'
const x: string = 123;
import { missing } from 'fake-module';
EOF

# Run tsc
tsc --noEmit --pretty false /tmp/test.ts 2>&1

# Expected output:
# /tmp/test.ts(1,7): error TS2322: Type 'number' is not assignable to type 'string'.
# /tmp/test.ts(2,25): error TS2307: Cannot find module 'fake-module' or its corresponding type declarations.
```

### Test with Example Parser
```bash
cd /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S6
node tsc-parser-example.cjs
```

---

## 📊 Error Code Categories

| Range | Category | Description | Examples |
|-------|----------|-------------|----------|
| TS1000-TS1999 | Compiler | General compiler errors | TS1005, TS1108 |
| TS2000-TS2999 | Module | File and module resolution | TS2307, TS6053 |
| TS2300-TS2499 | Type | Type checking errors | TS2322, TS2345, TS2741 |
| TS2500-TS2999 | Declaration | Declaration errors | TS2304, TS2339 |
| TS5000-TS9999 | Configuration | Project configuration | TS5009, TS5074 |

---

## 💡 Implementation Tips

### 1. Basic Parser Pattern
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
        message: match[5]
      });
    }
  }

  return { success: errors.length === 0, errors };
}
```

### 2. Module Name Extraction
```javascript
function extractModuleName(error) {
  if (error.code !== 'TS2307') return null;

  const match = error.message.match(/Cannot find module ['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}
```

### 3. Error Categorization
```javascript
function getErrorCategory(code) {
  const num = parseInt(code.replace('TS', ''), 10);

  if (num >= 2000 && num < 3000) return 'module';
  if (num >= 3000 && num < 4000) return 'type';

  return 'unknown';
}
```

---

## 🎓 Learning Path

1. **Start with:** README.md - Quick overview and key patterns
2. **Then read:** test-examples.md - See real tsc output
3. **Then run:** tsc-parser-example.cjs - See parser in action
4. **Finally:** typescript-compiler-output-research.md - Deep dive into all details

---

## 📝 Notes

- **TypeScript 5.9.3** was used for all testing
- All examples use `--pretty false` for consistent output
- Error format is stable across TypeScript versions
- The parsing approach is version-agnostic

---

## 🔗 Related Files

- **PRP.md** - Problem Resolution Plan (26K)
- **research/** - Additional research files directory

---

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Complete
