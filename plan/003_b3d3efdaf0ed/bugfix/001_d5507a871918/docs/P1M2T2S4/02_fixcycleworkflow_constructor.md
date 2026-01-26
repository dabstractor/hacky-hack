# Research Report: FixCycleWorkflow Constructor Changes

## Current Constructor Signature

**File**: `src/workflows/fix-cycle-workflow.ts` (lines 107-140)

```typescript
constructor(
  sessionPath: string,           // ✅ NEW: Path to session directory
  prdContent: string,
  taskOrchestrator: TaskOrchestrator,
  sessionManager: SessionManager
) {
  super('FixCycleWorkflow');

  // Validate inputs
  if (typeof sessionPath !== 'string' || sessionPath.trim() === '') {
    throw new Error('FixCycleWorkflow requires valid sessionPath');
  }

  this.sessionPath = sessionPath;
  this.prdContent = prdContent;
  this.taskOrchestrator = taskOrchestrator;
  this.sessionManager = sessionManager;

  // Create correlation logger
  const correlationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  this.correlationLogger = getLogger('FixCycleWorkflow').child({
    correlationId,
  });

  this.logger.info('[FixCycleWorkflow] Initialized', {
    sessionPath: sessionPath,
    maxIterations: this.maxIterations,
  });
}
```

## Change History

### Commit Sequence:

1. **0f7fdce** - "Update FixCycleWorkflow constructor to accept sessionPath instead of testResults object"
   - Changed constructor signature from testResults to sessionPath
   - Added sessionPath validation

2. **b83d897** - "Add loadBugReport method to FixCycleWorkflow with comprehensive JSON validation"
   - Added `#loadBugReport()` private method
   - Implemented file system operations
   - Added JSON parsing and Zod validation

3. **fc0bc6f** - "Update FixCycleWorkflow.run() to load bug report from TEST_RESULTS.md"
   - Updated `run()` to call `this.#loadBugReport()`
   - Removed dependency on constructor-passed testResults

## loadBugReport Method

**Location**: `src/workflows/fix-cycle-workflow.ts:447-522`

```typescript
async #loadBugReport(): Promise<TestResults> {
  const resultsPath = resolve(this.sessionPath, 'TEST_RESULTS.md');

  // Check file existence
  try {
    await access(resultsPath, constants.F_OK);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new Error(`TEST_RESULTS.md not found at ${resultsPath}`);
    }
    throw new Error(
      `Failed to access TEST_RESULTS.md at ${resultsPath}: ${err.message}`
    );
  }

  // Read file content
  let content: string;
  try {
    content = await readFile(resultsPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to read TEST_RESULTS.md at ${resultsPath}: ${errorMessage}`
    );
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to parse TEST_RESULTS.md at ${resultsPath}: ${error}`
    );
  }

  // Validate with Zod
  try {
    const validated = TestResultsSchema.parse(parsed) as TestResults;
    return validated;
  } catch (error) {
    throw new Error(
      `Invalid TestResults in TEST_RESULTS.md at ${resultsPath}: ${error}`
    );
  }
}
```

## How loadBugReport is Called in run()

**Location**: `src/workflows/fix-cycle-workflow.ts:305-318`

```typescript
async run(): Promise<TestResults> {
  this.setStatus('running');

  // Load bug report from TEST_RESULTS.md
  this.#testResults = await this.#loadBugReport();  // <-- LINE 313

  this.logger.info(
    `[FixCycleWorkflow] Initial bug count: ${this.#testResults.bugs.length}`
  );

  try {
    while (this.iteration < this.maxIterations) {
      // ... fix cycle loop
    }
  } catch (error) {
    // ...
  }
}
```

## Required Imports

```typescript
import { readFile, access, constants } from 'node:fs/promises';
import { resolve } from 'node:path';
import { TestResultsSchema } from '../core/models.js';
```

## TestResults Schema

```typescript
export interface TestResults {
  readonly hasBugs: boolean;
  readonly bugs: Bug[];
  readonly summary: string;
  readonly recommendations: string[];
}

export const TestResultsSchema: z.ZodType<TestResults> = z.object({
  hasBugs: z.boolean(),
  bugs: z.array(BugSchema),
  summary: z.string().min(1, 'Summary is required'),
  recommendations: z.array(z.string()).min(0),
});
```

## Key Implementation Details

1. **File Path Construction**: `resolve(this.sessionPath, 'TEST_RESULTS.md')`
2. **JSON Format**: Uses `JSON.parse()` not markdown parsing
3. **Zod Validation**: Runtime type validation with TestResultsSchema
4. **Comprehensive Error Handling**: ENOENT, read failures, parse errors, validation errors
5. **Called at Start**: First operation in `run()` method

## Session Path Requirements

- **Type**: string
- **Validation**: Non-empty string check in constructor
- **Format**: Relative or absolute path to session directory
- **Contents**: Must contain `TEST_RESULTS.md` with valid JSON
- **Example**: `'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918'`

## References

- Constructor: `src/workflows/fix-cycle-workflow.ts:107-140`
- loadBugReport: `src/workflows/fix-cycle-workflow.ts:447-522`
- run() method: `src/workflows/fix-cycle-workflow.ts:305-377`
- TestResults model: `src/core/models.ts:1838-1879`
