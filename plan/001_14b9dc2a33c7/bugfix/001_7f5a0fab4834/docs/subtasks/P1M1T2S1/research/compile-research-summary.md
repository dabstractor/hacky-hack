# Research Summary: P1.M1.T2.S1 - Run TypeScript Typecheck Command

## Context from Previous Work (P1.M1.T1.S6)

The previous PRP (P1.M1.T1.S6) produces `ReadmeUpdateResult` with:
- `updated: boolean` - Whether README was updated
- `path: string` - Path to README.md
- `message: string` - Human-readable status
- `error?: string` - Error details if failed

**Note:** P1.M1.T2.S1 does NOT directly consume S6's output. It assumes P1.M1.T1 (Groundswell link) is complete as a whole.

---

## 1. Spawn Execution Pattern from groundswell-linker.ts

**File:** `/home/dustin/projects/hacky-hack/src/utils/groundswell-linker.ts`

### Spawn Call Pattern (Lines 766-770)
```typescript
child = spawn('npm', ['list', 'groundswell', '--json', '--depth=0'], {
  cwd: projectPath,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false, // CRITICAL: prevents shell injection
});
```

### Timeout Escalation Pattern (Lines 789-798)
```typescript
const timeoutId = setTimeout(() => {
  killed = true;
  child.kill('SIGTERM');

  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 2000); // 2-second grace period
}, timeout);
```

### Stdout/Stderr Capture Pattern (Lines 801-814)
```typescript
let stdout = '';
let stderr = '';

if (child.stdout) {
  child.stdout.on('data', (data: Buffer) => {
    if (killed) return;
    stdout += data.toString();
  });
}

if (child.stderr) {
  child.stderr.on('data', (data: Buffer) => {
    if (killed) return;
    stderr += data.toString();
  });
}
```

---

## 2. Result Interface Pattern

### NpmListVerifyResult (Lines 200-221)
```typescript
export interface NpmListVerifyResult {
  linked: boolean;
  version?: string;
  message: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}
```

**Pattern to follow for TypeScriptCheckResult:**
- Boolean status flag (e.g., `success` or `hasErrors`)
- Optional fields for additional data
- Human-readable `message`
- Raw `stdout` and `stderr` as strings
- `exitCode` as `number | null`
- Optional `error` field

---

## 3. TypeScript Compiler Output Format

### Command
```bash
npm run typecheck  # Runs: tsc --noEmit
```

### Output Format
```
file_path(line,column): error TSXXXX: error_message
```

### Key Characteristics
- All errors go to **stderr** (not stdout)
- Exit code: `0` (success) or `2` (errors)
- Format is consistent and machine-readable
- Use `--pretty false` for clean output (but npm script doesn't include this)

### Example Output
```
src/test.ts(10,9): error TS2322: Type 'string' is not assignable to type 'number'.
src/utils.ts(14,35): error TS2307: Cannot find module 'lodash' or its corresponding type declarations.
```

### Common Error Codes
| Code | Pattern | For This PRP |
|------|---------|--------------|
| TS2307 | Cannot find module | **Critical** - Parse for this |
| TS2322 | Type assignment error | Count as general error |
| TS2345 | Type mismatch | Count as general error |
| TS2741 | Missing property | Count as general error |

---

## 4. Error Parsing Strategy

### Regex Pattern
```javascript
const ERROR_PATTERN = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
```

### Parse Logic
```typescript
function parseTypeScriptErrors(stderr: string): TypeScriptError[] {
  const lines = stderr.trim().split('\n');
  const errors: TypeScriptError[] = [];
  const pattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4], // e.g., "TS2307"
        message: match[5]
      });
    }
  }

  return errors;
}
```

### Detect Module-Not-Found Errors
```typescript
function hasModuleNotFoundError(errors: TypeScriptError[]): boolean {
  return errors.some(e => e.code === 'TS2307' && e.message.includes('Cannot find module'));
}
```

---

## 5. Testing Patterns

### Mock Setup
```typescript
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));
```

### Mock ChildProcess
```typescript
function createMockChild(options: {
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
} = {}) {
  return {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && options.stdout) {
          setTimeout(() => callback(Buffer.from(options.stdout)), 5);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data' && options.stderr) {
          setTimeout(() => callback(Buffer.from(options.stderr)), 5);
        }
      }),
    },
    on: vi.fn((event: string, callback: (code: number | null) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(options.exitCode ?? 0), 10);
      }
    }),
    killed: false,
    kill: vi.fn(),
  } as unknown as ChildProcess;
}
```

### Test Cases Needed
1. Happy path: No TypeScript errors
2. With errors: Multiple TypeScript errors, count correctly
3. Module not found: Detect TS2307 errors
4. Timeout: Command hangs
5. Spawn failure: ENOENT (tsc not found)

---

## 6. File Placement

### Option A: Add to groundswell-linker.ts
- Pros: Follows established patterns
- Cons: Mixed concerns (Groundswell linking + TypeScript checking)

### Option B: Create new file src/utils/typescript-checker.ts
- Pros: Clear separation of concerns
- Cons: New file

**Recommendation:** Create new file `src/utils/typescript-checker.ts` for clear separation of concerns.

---

## 7. Constants and Configuration

```typescript
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack';
const DEFAULT_TYPECHECK_TIMEOUT = 30000; // 30 seconds (tsc can be slow)
const TYPECHECK_COMMAND = 'npm';
const TYPECHECK_ARGS = ['run', 'typecheck'];
```

---

## 8. Documentation URLs

**TypeScript Compiler:**
- https://www.typescriptlang.org/docs/handbook/compiler-options.html
- https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json

**Error Codes:**
- https://typescript.tv/errors/

---

## 9. Integration Notes

- Function should be callable after P1.M1.T1 completes
- No direct dependency on S6's ReadmeUpdateResult
- Output should be consumed by P1.M1.T2.S2 (Analyze remaining TypeScript errors)

---

## 10. Key Gotchas

1. **npm runs tsc, not directly calling tsc** - Use `npm run typecheck`
2. **TypeScript errors go to stderr** - Capture stderr, not stdout
3. **Exit code 2 = errors** - Not just non-zero, specifically 2
4. **TS2307 is the module-not-found error** - Parse specifically for this
5. **Don't use --pretty false** - npm script doesn't include it, output may have ANSI codes
6. **Mock npm for testing** - Mock the npm command, not tsc directly
