# Implementation Analysis: validateNestedExecution

## Location

**File:** `/home/dustin/projects/hacky-hack/src/utils/validation/execution-guard.ts`
**Function:** `validateNestedExecution(sessionPath: string): void`
**Lines:** 56-85

## Function Signature

```typescript
export function validateNestedExecution(sessionPath: string): void;
```

**Parameters:**

- `sessionPath`: The session path to validate for bugfix recursion
  - Type: `string`
  - Example: `'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918'`
  - Example: `'plan/003_b3d3efdaf0ed/feature/001_test'`

**Returns:**

- `void` (no return value)

**Throws:**

- `NestedExecutionError` when illegitimate nested execution is detected

## Implementation Logic

### Step 1: Check if Pipeline is Already Running

```typescript
const existingPid = process.env.PRP_PIPELINE_RUNNING;

// If no pipeline is running, allow execution
if (!existingPid) {
  return;
}
```

**Logic:**

- Reads `PRP_PIPELINE_RUNNING` environment variable
- If not set (undefined, null, or empty string), allows execution
- This is the "first execution" case - always allowed

**Environment Variable:**

- Name: `PRP_PIPELINE_RUNNING`
- Expected Value: Process ID as string (e.g., `'12345'`)
- Set by: P1.M3.T2.S4 (Set PRP_PIPELINE_RUNNING environment variable)
- Cleared by: Pipeline cleanup in finally block

### Step 2: Check for Legitimate Bug Fix Recursion

```typescript
const isBugfixRecursion =
  process.env.SKIP_BUG_FINDING === 'true' &&
  sessionPath.toLowerCase().includes('bugfix');

if (isBugfixRecursion) {
  // Legitimate recursion - allow it
  return;
}
```

**Logic:**

- Checks TWO conditions (both must be true):
  1. `SKIP_BUG_FINDING === 'true'` (EXACT string match, case-sensitive)
  2. `sessionPath.toLowerCase().includes('bugfix')` (case-insensitive substring check)
- If both conditions are true, allows execution (bugfix recursion)

**Environment Variable:**

- Name: `SKIP_BUG_FINDING`
- Expected Value: Exactly `'true'` (lowercase, case-sensitive)
- Values that DO NOT work: `'TRUE'`, `'True'`, `'1'`, `'yes'`, `'True'`
- Set by: PRP Pipeline when entering bugfix mode

**Path Matching:**

- Uses `sessionPath.toLowerCase().includes('bugfix')`
- Case-insensitive: Matches 'bugfix', 'BUGFIX', 'BugFix', 'bugFiX', etc.
- Substring match: Matches anywhere in path
- Examples that match:
  - `'plan/003_b3d3efdaf0ed/bugfix/001_test'`
  - `'bugfix/001_test'`
  - `'plan/003_b3d3efdaf0ed/bugfix'`
  - `'plan/003_b3d3efdaf0ed/BugFix/001_test'`
  - `'plan/003_b3d3efdaf0ed/BUGFIX/001_test'`

### Step 3: Throw Error for Illegitimate Nested Execution

```typescript
throw new NestedExecutionError(
  `Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: ${existingPid}`,
  {
    existingPid,
    currentPid: process.pid.toString(),
    sessionPath,
  }
);
```

**Logic:**

- Throws `NestedExecutionError` if:
  - Pipeline IS running (PRP_PIPELINE_RUNNING is set)
  - AND NOT legitimate bugfix recursion (conditions from Step 2 not met)

**Error Message Format:**

```
Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {existingPid}
```

**Error Context:**

- `existingPid`: The PID of the already-running pipeline (from PRP_PIPELINE_RUNNING)
- `currentPid`: The PID of the current process (from process.pid)
- `sessionPath`: The session path that was being validated

## Decision Matrix

| PRP_PIPELINE_RUNNING | SKIP_BUG_FINDING | Path contains 'bugfix' | Result                                  |
| -------------------- | ---------------- | ---------------------- | --------------------------------------- |
| not set              | any              | any                    | ✅ Allow (first execution)              |
| set                  | 'true'           | yes (case-insensitive) | ✅ Allow (bugfix recursion)             |
| set                  | 'true'           | no                     | ❌ Throw (feature/enhancement/refactor) |
| set                  | not 'true'       | yes                    | ❌ Throw (bugfix without flag)          |
| set                  | not 'true'       | no                     | ❌ Throw (nested execution)             |

## Key Implementation Details

### Detail 1: Case Sensitivity

**SKIP_BUG_FINDING is CASE-SENSITIVE:**

```typescript
process.env.SKIP_BUG_FINDING === 'true'; // ✅ Works
process.env.SKIP_BUG_FINDING === 'TRUE'; // ❌ Does NOT work
process.env.SKIP_BUG_FINDING === 'True'; // ❌ Does NOT work
```

**Path check is CASE-INSENSITIVE:**

```typescript
sessionPath.toLowerCase().includes('bugfix'); // Matches all cases
('plan/003/bugfix/001'); // ✅ Matches
('plan/003/BUGFIX/001'); // ✅ Matches
('plan/003/BugFix/001'); // ✅ Matches
('plan/003/bugFiX/001'); // ✅ Matches
```

### Detail 2: Short-Circuit Evaluation

```typescript
const isBugfixRecursion =
  process.env.SKIP_BUG_FINDING === 'true' &&
  sessionPath.toLowerCase().includes('bugfix');
```

- Uses `&&` (logical AND)
- Short-circuits: If first condition is false, second is not evaluated
- Order matters: Check environment variable first (cheaper), then path check

### Detail 3: Type Coercion

```typescript
if (!existingPid) {
  return;
}
```

- Uses falsy check: `!existingPid`
- Returns true for: `undefined`, `null`, `''` (empty string), `0`, `NaN`
- Returns false for: Any non-empty string (including `'0'`, `'false'`)
- **Gotcha:** `PRP_PIPELINE_RUNNING='0'` would be treated as "set" (would block execution)

### Detail 4: Process PID

```typescript
currentPid: process.pid.toString();
```

- `process.pid` is a number
- Converted to string with `.toString()`
- Ensures consistent string type in error context

## Error Class: NestedExecutionError

**Location:** `/home/dustin/projects/hacky-hack/src/utils/errors.ts` (lines 522-538)

**Class Definition:**

```typescript
export class NestedExecutionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION;

  constructor(
    message: string,
    context?: PipelineErrorContext & {
      existingPid?: string;
      currentPid?: string;
      sessionPath?: string;
    },
    cause?: Error
  ) {
    super(message, context, cause);
    Object.setPrototypeOf(this, NestedExecutionError.prototype);
  }
}
```

**Properties:**

- `code`: `'PIPELINE_VALIDATION_NESTED_EXECUTION'` (error code for categorization)
- `existingPid`: The PID of the already-running pipeline
- `currentPid`: The PID of the current process
- `sessionPath`: The session path that triggered the error
- `message`: Human-readable error message
- `cause`: Optional underlying error (for error chaining)

**Inheritance:**

- Extends `PipelineError`
- `PipelineError` extends `Error`
- Full prototype chain: `NestedExecutionError` → `PipelineError` → `Error`

**Type Guard:**

```typescript
export function isNestedExecutionError(
  error: unknown
): error is NestedExecutionError {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NestedExecutionError).code ===
      ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION
  );
}
```

**Purpose:**

- Type narrowing for catch blocks
- Allows TypeScript to infer correct type
- More robust than `instanceof` for serialized/errors across boundaries

## Integration Points

### Point 1: PRP Pipeline (src/workflows/prp-pipeline.ts)

**Call Site:** Lines 1717-1720 (from P1.M3.T2.S3 PRP)

```typescript
// Validate nested execution before proceeding
await validateNestedExecution(sessionPath);
this.logger.debug(
  `[PRPPipeline] Checking for nested execution at ${sessionPath}`
);
```

**Context:**

- Called in `run()` method
- Called after SessionManager creation
- Called before PRP_PIPELINE_RUNNING is set (from P1.M3.T2.S4)
- Called before workflow execution begins

**Error Handling:**

```typescript
try {
  await validateNestedExecution(sessionPath);
  // ... continue execution
} catch (error) {
  if (isNestedExecutionError(error)) {
    this.logger.error(`Nested execution detected: ${error.message}`);
    throw error; // Re-throw to halt execution
  }
  throw error; // Re-throw other errors
}
```

### Point 2: Environment Variables

**PRP_PIPELINE_RUNNING:**

- Set by: P1.M3.T2.S4 (after validation passes)
- Value: `currentPid` (string representation of `process.pid`)
- Cleared by: Finally block in PRP Pipeline run() method
- Purpose: Prevents nested execution

**SKIP_BUG_FINDING:**

- Set by: PRP Pipeline when entering bugfix mode
- Value: `'true'` (exact string)
- Purpose: Allows bugfix session recursion
- Scope: Bugfix sessions only

### Point 3: Bugfix Session Detection

**validateBugfixSession Function:**

- Location: `src/utils/validation/session-validator.ts` (from P1.M3.T1.S1)
- Purpose: Validates session path format
- Independent from `validateNestedExecution`
- Both used in PRP Pipeline validation sequence

**Relationship:**

- `validateBugfixSession`: Checks if path is valid bugfix session format
- `validateNestedExecution`: Checks if nested execution is allowed
- Both needed for complete bugfix session validation

## Testing Considerations

### Test Case 1: First Execution (PRP_PIPELINE_RUNNING not set)

**Setup:**

```typescript
delete process.env.PRP_PIPELINE_RUNNING;
delete process.env.SKIP_BUG_FINDING;
```

**Expected:**

```typescript
expect(() => validateNestedExecution(sessionPath)).not.toThrow();
```

**Paths to Test:**

- Bugfix path: `'plan/003_b3d3efdaf0ed/bugfix/001_test'`
- Feature path: `'plan/003_b3d3efdaf0ed/feature/001_test'`
- Empty path: `''`

### Test Case 2: Nested Execution Without Bugfix Session

**Setup:**

```typescript
vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
delete process.env.SKIP_BUG_FINDING;
```

**Expected:**

```typescript
expect(() => validateNestedExecution(sessionPath)).toThrow(
  NestedExecutionError
);
```

**Paths to Test:**

- Main session: `'plan/003_b3d3efdaf0ed/feature/001_test'`
- Bugfix path (without flag): `'plan/003_b3d3efdaf0ed/bugfix/001_test'`
- Empty path: `''`

### Test Case 3: Bugfix Session With SKIP_BUG_FINDING=true

**Setup:**

```typescript
vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
vi.stubEnv('SKIP_BUG_FINDING', 'true');
```

**Expected:**

```typescript
expect(() => validateNestedExecution(sessionPath)).not.toThrow();
```

**Paths to Test:**

- Bugfix path: `'plan/003_b3d3efdaf0ed/bugfix/001_test'`
- Mixed case: `'plan/003_b3d3efdaf0ed/BugFix/001_test'`
- Uppercase: `'plan/003_b3d3efdaf0ed/BUGFIX/001_test'`

### Test Case 4: SKIP_BUG_FINDING=true But Non-Bugfix Path

**Setup:**

```typescript
vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
vi.stubEnv('SKIP_BUG_FINDING', 'true');
```

**Expected:**

```typescript
expect(() => validateNestedExecution(sessionPath)).toThrow(
  NestedExecutionError
);
```

**Paths to Test:**

- Feature path: `'plan/003_b3d3efdaf0ed/feature/001_test'`
- Enhancement path: `'plan/003_b3d3efdaf0ed/enhancement/001_test'`
- Refactor path: `'plan/003_b3d3efdaf0ed/refactor/001_test'`

### Test Case 5: Error Message Includes PID

**Setup:**

```typescript
vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
```

**Expected:**

```typescript
try {
  validateNestedExecution(sessionPath);
  expect.fail('Should have thrown NestedExecutionError');
} catch (error) {
  expect((error as Error).message).toContain('99999');
}
```

**Verification:**

- Error message contains PID
- Error context includes `existingPid`
- Error context includes `currentPid`
- Error context includes `sessionPath`

## Summary

The `validateNestedExecution` function implements a simple but robust guard against nested PRP Pipeline execution:

1. **First execution always allowed**: Check if PRP_PIPELINE_RUNNING is not set
2. **Bugfix recursion allowed**: Check if both SKIP_BUG_FINDING='true' AND path contains 'bugfix'
3. **Otherwise block**: Throw NestedExecutionError with rich context

The implementation is straightforward but has important details:

- Case-sensitive environment variable check (SKIP_BUG_FINDING must be exactly 'true')
- Case-insensitive path check (bugfix matching)
- Rich error context for debugging
- Type guard for safe error handling

All test scenarios from the contract definition are already covered by existing tests.
