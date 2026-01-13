# Filesystem MCP Tool Research Summary

**PRP ID**: P2.M1.T2.S2
**Research Date**: 2026-01-12

## Reference Implementation Analysis

### BashMCP Pattern (src/tools/bash-mcp.ts)

The BashMCP implementation provides the exact pattern to follow for FilesystemMCP:

1. **Module Structure**:
   - Module-level JSDoc with `@module`, `@remarks`, `@example` tags
   - Import from `groundswell` for `MCPHandler`, `Tool`, `ToolExecutor`
   - ESM imports with `node:` prefix for built-in modules
   - `.js` extensions in import statements (not `.ts`)

2. **Interface Definitions**:
   - Input interfaces with JSDoc comments
   - Result interfaces with `success: boolean` and optional `error?: string`
   - Union types for nullable fields (`number | null`)

3. **Tool Schema Pattern**:
   ```typescript
   const toolName: Tool = {
     name: 'tool_name',
     description: 'Clear description of what tool does',
     input_schema: {
       type: 'object',
       properties: { /* ... */ },
       required: ['property1', 'property2']
     }
   };
   ```

4. **Class Pattern**:
   ```typescript
   export class ToolNameMCP extends MCPHandler {
     constructor() {
       super();
       this.registerServer({
         name: 'server_name',
         transport: 'inprocess',
         tools: [tool1, tool2, ...]
       });
       this.registerToolExecutor('server_name', 'tool_name', executorFunction);
     }
   }
   ```

5. **Async Executor Pattern**:
   - Async function with typed input/output
   - Destructure input with defaults
   - Validate inputs synchronously (throw early)
   - Return Promise.resolve for errors (never throw from async)
   - Handle specific error codes

6. **Export Pattern**:
   ```typescript
   export class ToolNameMCP extends MCPHandler { }
   export type { InputInterface, ResultInterface };
   export { toolSchema, executorFunction };
   ```

## Node.js fs.promises API Research

### Key Functions for FilesystemMCP

**File Reading**:
```typescript
import { promises as fs } from 'node:fs';

// Read file with encoding
const content = await fs.readFile(filePath, { encoding: 'utf-8' });

// Read binary file
const buffer = await fs.readFile(filePath);
```

**File Writing**:
```typescript
// Write file with encoding
await fs.writeFile(filePath, content, { encoding: 'utf-8' });

// Create directories if needed
await fs.mkdir(dirPath, { recursive: true });
```

**Error Codes to Handle**:
- `ENOENT`: File or directory not found
- `EACCES`: Permission denied
- `EISDIR`: Path is a directory (not a file)
- `ENOTDIR`: Path is not a directory
- `EEXIST`: File already exists (for mkdir)

## Fast-Glob Library Research

### Installation
```bash
npm install fast-glob@^3.3.2
```

### Usage Pattern
```typescript
import fg from 'fast-glob';

// Basic usage
const files = await fg('**/*.ts', {
  cwd: process.cwd(),
  absolute: true,
  onlyFiles: true,
});

// Multiple patterns
const files = await fg(['**/*.ts', '**/*.js'], options);

// Ignore patterns
const files = await fg('**/*.ts', {
  ignore: ['**/node_modules/**', '**/dist/**']
});
```

### Key Options
- `cwd`: Working directory for search
- `absolute`: Return absolute paths
- `onlyFiles`: Only return files (not directories)
- `ignore`: Patterns to exclude

## Path Security Research

### Path Traversal Prevention

**Dangerous**:
```typescript
// Allows ../../../etc/passwd
await fs.readFile(userPath);
```

**Safe**:
```typescript
import { resolve, normalize, sep } from 'node:path';

const safePath = resolve(baseDir, userPath);
const normalizedBase = normalize(baseDir);

if (!safePath.startsWith(normalizedBase + sep) &&
    safePath !== normalizedBase) {
  throw new Error('Path traversal detected');
}
```

### Cross-Platform Path Handling

```typescript
import { join, normalize } from 'node:path';

// Always use path.join()
const configPath = join('src', 'tools', 'file.ts');

// Normalize for comparison
const normalized = normalize(userPath);
```

## Testing Patterns

### Vitest Mock Pattern

```typescript
// Mock at top level
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const mockReadFile = vi.mocked(readFile);
```

### Test Structure (AAA Pattern)

```typescript
it('should read file successfully', async () => {
  // SETUP
  mockReadFile.mockResolvedValue('file content');
  const input = { path: './test.txt' };

  // EXECUTE
  const result = await readFile(input);

  // VERIFY
  expect(result.success).toBe(true);
  expect(result.content).toBe('file content');
});
```

## Grep Implementation Pattern

```typescript
async function grepSearch(input: GrepSearchInput): Promise<GrepSearchResult> {
  const { pattern, path, flags = '' } = input;

  try {
    const content = await fs.readFile(path, { encoding: 'utf-8' });
    const lines = content.split('\n');
    const matches: Array<{ line: number; content: string }> = [];

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch (error) {
      return { success: false, error: `Invalid regex: ${pattern}` };
    }

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        matches.push({ line: i + 1, content: lines[i] });
      }
    }

    return { success: true, matches };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;
    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${path}` };
    }
    throw error;
  }
}
```

## Key Takeaways

1. **Follow BashMCP pattern exactly** - Don't deviate from the established structure
2. **Always use async operations** - Use `fs.promises`, never sync operations
3. **Validate all paths** - Prevent directory traversal attacks
4. **Handle error codes** - Return specific error messages for ENOENT, EACCES, etc.
5. **Use fast-glob** - Efficient, cross-platform glob implementation
6. **100% test coverage** - Test all branches, error handlers, edge cases
7. **ESM imports** - Use `.js` extensions, `node:` prefix for built-ins
8. **Comprehensive JSDoc** - Document all exports with examples

## External Resources

- Node.js fs.promises: https://nodejs.org/api/fs.html#fs_fspromises
- Node.js path module: https://nodejs.org/api/path.html
- fast-glob documentation: https://github.com/mrmlnc/fast-glob
- BashMCP reference: `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`
- BashMCP tests: `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts`
