# validateNestedExecution Function Research

## Function Location

**File:** `/home/dustin/projects/hacky-hack/src/utils/validation/execution-guard.ts`

## Function Signature

```typescript
export function validateNestedExecution(sessionPath: string): void
```

## Function Purpose

Prevents recursive PRP Pipeline execution while allowing legitimate bug fix session recursion.

## Parameters

- `sessionPath: string` - The session path to validate for bugfix recursion

## Return Value

- `void` - Returns normally if validation passes, throws `NestedExecutionError` if validation fails

## Implementation Logic

```typescript
export function validateNestedExecution(sessionPath: string): void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;

  // If no pipeline is running, allow execution
  if (!existingPid) {
    return;
  }

  // Check if this is legitimate bug fix recursion
  // CRITICAL: SKIP_BUG_FINDING must use EXACT string match (case-sensitive)
  // CRITICAL: Path check must be case-insensitive for 'bugfix'
  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' &&
    sessionPath.toLowerCase().includes('bugfix');

  if (isBugfixRecursion) {
    // Legitimate recursion - allow it
    return;
  }

  // Illegitimate nested execution - throw error
  throw new NestedExecutionError(
    `Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: ${existingPid}`,
    {
      existingPid,
      currentPid: process.pid.toString(),
      sessionPath,
    }
  );
}
```

## Validation Flow

1. Checks if `process.env.PRP_PIPELINE_RUNNING` is set
2. If not set: Returns normally (first execution allowed)
3. If set:
   - Checks if `process.env.SKIP_BUG_FINDING === 'true'` (exact string match, case-sensitive)
   - Checks if `sessionPath.toLowerCase().includes('bugfix')` (case-insensitive)
   - If both conditions are true: Returns normally (legitimate bug fix recursion allowed)
   - If either condition is false: Throws `NestedExecutionError` (illegitimate nested execution)

## Critical Gotchas

1. **SKIP_BUG_FINDING must be EXACT string match (case-sensitive)**
   ```typescript
   process.env.SKIP_BUG_FINDING = 'true';   // ✓ Correct
   process.env.SKIP_BUG_FINDING = 'True';   // ✗ Wrong (won't work)
   ```

2. **Path check for 'bugfix' is case-insensitive**
   ```typescript
   sessionPath.toLowerCase().includes('bugfix');  // ✓ Correct
   sessionPath.includes('bugfix');                // ✗ Wrong (case-sensitive)
   ```

## Import Statement

```typescript
import { validateNestedExecution } from '../utils/validation/execution-guard.js';
```

## Usage Example

```typescript
// First execution - no pipeline running
delete process.env.PRP_PIPELINE_RUNNING;
validateNestedExecution('plan/003_b3d3efdaf0ed/feature/001'); // OK

// Bug fix recursion - allowed
process.env.PRP_PIPELINE_RUNNING = '12345';
process.env.SKIP_BUG_FINDING = 'true';
validateNestedExecution('plan/003_b3d3efdaf0ed/bugfix/001'); // OK

// Illegitimate nested execution - throws
process.env.PRP_PIPELINE_RUNNING = '12345';
validateNestedExecution('plan/003_b3d3efdaf0ed/feature/001'); // Throws NestedExecutionError
```

## Error Handling

```typescript
try {
  validateNestedExecution(sessionPath);
} catch (error) {
  if (isNestedExecutionError(error)) {
    console.error(`Nested execution detected. Existing PID: ${error.existingPid}`);
    console.error(`Current PID: ${error.currentPid}`);
    console.error(`Session path: ${error.sessionPath}`);
  }
}
```

## Unit Tests

**File:** `/home/dustin/projects/hacky-hack/tests/unit/utils/validation/execution-guard.test.ts`

**Test Coverage:**
- First execution scenarios (PRP_PIPELINE_RUNNING not set)
- Legitimate bug fix recursion (SKIP_BUG_FINDING='true' + path contains 'bugfix')
- Illegitimate nested execution (throws NestedExecutionError)
- Error message format with existing PID
- Error context properties (existingPid, currentPid, sessionPath)
- Type guard function (`isNestedExecutionError`)
- Case variations in 'bugfix' substring
- Exact string matching for SKIP_BUG_FINDING
- Edge cases (long paths, special characters, unicode)

## References

- File: `src/utils/validation/execution-guard.ts` (lines 56-85)
- Tests: `tests/unit/utils/validation/execution-guard.test.ts`
- Import: Line 35 of prp-pipeline.ts
