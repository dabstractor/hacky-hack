# Research Report: TypeScript TS2307 Module Resolution and Verification

## Executive Summary

This research documents TypeScript TS2307 "Cannot find module" errors, module resolution verification methods, and best practices for npm linked packages.

## 1. Common Causes of TS2307 Errors

### Primary Error Categories

**Module Resolution Failures (TS2307):**

- Missing `node_modules` dependencies
- Incorrect import paths (relative or absolute)
- Missing type declarations for third-party libraries
- npm linked packages not properly resolved
- Case sensitivity issues (especially on Linux)
- `package.json` `types`/`typings` field misconfiguration

**Related Error Codes:**

```
TS2307 - Cannot find module
TS2304 - Cannot find name
TS2305 - Module has no exported member
TS2306 - File is not a module
TS2688 - Cannot find type definition file
TS6053 - File not found
```

### Error Format Pattern

TypeScript compiler output follows a consistent format:

```
file_path(line,column): error TSXXXX: error_message
```

**Example:**

```
src/index.ts(10,35): error TS2307: Cannot find module 'express' or its corresponding type declarations.
```

**Regex Pattern:**

```javascript
/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
```

### Module Name Extraction

For TS2307 errors, extract module names using:

```javascript
/Cannot find module ['"]([^'"]+)['"]/;
```

**Examples extracted:**

- `'express'` → External package
- `'./utils/helper'` → Relative path
- `'@scope/package'` → Scoped package

## 2. Verification Methods

### TypeScript Compiler Verification

**Implementation:** `src/utils/typecheck-runner.ts`

```typescript
// Execute tsc --noEmit --pretty false
export async function runTypecheck(
  options?: TypecheckOptions
): Promise<TypecheckResult>;
```

**Key Features:**

- Uses `npx tsc --noEmit --pretty false` for machine-parsable output
- Captures stderr (all errors go to stderr, not stdout)
- Implements timeout handling with SIGTERM/SIGKILL escalation
- Parses errors using regex pattern matching
- Extracts module names from TS2307 errors specifically

### Error Analysis and Categorization

**Implementation:** `src/utils/typescript-error-analyzer.ts`

```typescript
export function analyzeTypeScriptErrors(
  result: TypecheckResult
): ErrorAnalysisResult;
```

**Categories:**

- `module-not-found`: TS2307, TS2304, TS2305, TS2306, TS2688, TS6053
- `type-mismatch`: TS2322, TS2345, TS2741
- `other`: All remaining error codes

## 3. npm Link Patterns and Best Practices

### Proper npm Link Workflow

```bash
# Step 1: Create global link in package directory
cd /path/to/linked-package
npm run build  # CRITICAL: Build before linking
npm link

# Step 2: Link to consuming project
cd /path/to/consuming-project
npm link <package-name>

# Step 3: Verify symlink created
ls -la node_modules/<package-name>
```

### TypeScript Configuration for Linked Packages

**Critical tsconfig.json settings:**

```json
{
  "compilerOptions": {
    "preserveSymlinks": true,
    "moduleResolution": "node16",
    "esModuleInterop": true
  }
}
```

**package.json exports field:**

```json
{
  "name": "my-linked-package",
  "types": "./dist/index.d.ts",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Common Pitfalls and Solutions

| Issue               | Symptom                      | Solution                               |
| ------------------- | ---------------------------- | -------------------------------------- |
| Module resolution   | `TS2307: Cannot find module` | Use `preserveSymlinks: true`           |
| Type declarations   | Types not found              | Ensure `types` field points to `.d.ts` |
| Build output        | Changes not reflected        | Build package before linking           |
| Dual package hazard | Type mismatches              | Align module types (ESM/CJS)           |
| IDE recognition     | VSCode red squiggles         | Restart TypeScript server              |

## 4. File Sampling Strategies

### Strategic File Selection

Group errors by file to identify high-impact areas:

```typescript
// Group by directory/module
const moduleGroups = errors.reduce((groups, error) => {
  const module = error.file.split('/')[1]; // e.g., 'src', 'utils', 'components'
  groups[module] = groups[module] || [];
  groups[module].push(error);
  return groups;
}, {});
```

### Sampling Approaches

**1. High-Impact File Sampling:**

- Focus on files with most errors
- Prioritize entry points (`index.ts`, `main.ts`, `app.ts`)
- Check shared utility modules

**2. Module-Based Sampling:**

- Group by directory/module
- Sample representative files from each module

**3. Path-Based Sampling:**

```typescript
const criticalPaths = [
  'src/index.ts',
  'src/app.ts',
  'src/main.ts',
  'api/',
  'controllers/',
  'services/',
];
```

## 5. Key Documentation URLs

### Official Documentation

**TypeScript:**

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [tsconfig.json Reference](https://www.typescriptlang.org/tsconfig)

**npm:**

- [npm link Documentation](https://docs.npmjs.com/cli/v10/commands/npm-link)
- [npm Package Configuration](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)

### Community Resources

**GitHub Issues:**

- [Symlink resolution issues](https://github.com/microsoft/TypeScript/issues/33079)
- [Project references with npm link](https://github.com/microsoft/TypeScript/issues/37378)
- [preserveSymlinks not working](https://github.com/microsoft/TypeScript/issues/32684)

## 6. Best Practices Summary

**DO:**

- Always use `--pretty false` for machine-parsable output
- Read from stderr, not stdout
- Build TypeScript packages before linking
- Use `preserveSymlinks: true` in tsconfig
- Use non-greedy regex for file paths with spaces
- Implement timeout handling with SIGTERM/SIGKILL
- Group errors by file for targeted verification
- Extract module names from TS2307 errors specifically

**DON'T:**

- Don't use ANSI color codes in parsing
- Don't skip building before linking
- Don't ignore case sensitivity on Linux
- Don't rely on npm link in production
- Don't use shell: true in spawn commands
- Don't check every file - sample strategically
