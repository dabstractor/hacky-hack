# E2E Pipeline Debug Analysis

## Executive Summary

- **Test Command**: `npm run test:run -- tests/e2e/pipeline.test.ts --no-coverage`
- **Execution Date**: 2025-01-16 02:44:51 UTC
- **Test Result**: FAIL - 4 out of 7 tests failing
- **Root Cause**: E2E test mock returns string instead of Buffer for `readFile`, causing `readUTF8FileStrict` to throw ERR_INVALID_ARG_TYPE error in PRDValidator, which is treated as non-fatal, allowing pipeline to continue without initializing session

## Test Execution Summary

- **Duration**: ~670ms per test execution
- **Tests Run**: 7 tests
- **Tests Passed**: 3 tests
- **Tests Failed**: 4 tests
- **First Failure**: "should complete full pipeline workflow successfully"

### Failed Tests

1. ❌ **should complete full pipeline workflow successfully**
   - Expected: `success: true`
   - Received: `success: false`
   - Final Phase: `qa_skipped`
   - Failed Tasks: 3

2. ❌ **should create valid prd_snapshot.md in session directory**
   - Error: `ENOENT: no such file or directory, open 'prd_snapshot.md'`
   - Root Cause: Session directory was never created

3. ❌ **should create valid tasks.json with complete subtask status**
   - Error: `ENOENT: no such file or directory, open 'tasks.json'`
   - Root Cause: Session directory was never created

4. ❌ **should complete execution in under 30 seconds**
   - Expected: `success: true`
   - Received: `success: false`

### Passed Tests

1. ✅ **should handle error when PRD file does not exist**
   - Correctly returns `success: false` when PRD doesn't exist

2. ✅ **should create git commits during execution**
   - Git mock was available (though no commits were made due to early failure)

3. ✅ **should clean up temp directory after test**
   - Temp directory cleanup works correctly

## Debug Log Capture

<details>
<summary>Full Test Output (click to expand)</summary>

```
 RUN  v1.6.1 /home/dustin/projects/hacky-hack

stdout | _log (/home/dustin/projects/hacky-hack/node_modules/dotenv/lib/main.js:142:11)
[dotenv@17.2.3] injecting env (0) from .env -- tip:  audit secrets and track compliance: https://dotenvx.com/ops

stdout | tests/setup.ts:28:15
.env file loaded successfully

 ❯ tests/e2e/pipeline.test.ts  (7 tests | 4 failed) 20ms
   ❯ tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should complete full pipeline workflow successfully
     → expected false to be true // Object.is equality
   ❯ tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should create valid prd_snapshot.md in session directory
     → ENOENT: no such file or directory, open 'prd_snapshot.md'
   ❯ tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should create valid tasks.json with complete subtask status
     → ENOENT: no such file or directory, open 'tasks.json'
   ❯ tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should complete execution in under 30 seconds
     → expected false to be true // Object.is equality

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should complete full pipeline workflow successfully
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ tests/e2e/pipeline.test.ts:294:28
    292|
    293|     // ASSERT: Verify result structure
    294|     expect(result.success).toBe(true);
       |                            ^
    295|     expect(result.sessionPath).toBeDefined();
    296|     expect(result.totalTasks).toBe(0); // Empty subtask array

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯

 FAIL  tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should create valid prd_snapshot.md in session directory
Error: ENOENT: no such file or directory, open 'prd_snapshot.md'
 ❯ Proxy.readFileSync node:fs:435:20
 ❯ tests/e2e/pipeline.test.ts:337:25
    335|     expect(existsSync(prdSnapshotPath)).toBe(true);
    336|
    337|     const prdSnapshot = readFileSync(prdSnapshotPath, 'utf-8');
       |                         ^
    338|     expect(prdSnapshot).toContain('# Test Project');
    339|     expect(prdSnapshot).Contain('## P1: Test Phase');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯��⎎[2/4]⎯

 FAIL  tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should create valid tasks.json with complete subtask status
Error: ENOENT: no such file or directory, open 'tasks.json'
 ❯ Proxy.readFileSync node:fs:435:20
 ❯ tests/e2e/pipeline.test.ts:361:34
    359|
    360|     // Read and parse tasks.json
    361|     const tasksJson = JSON.parse(readFileSync(tasksPath, 'utf-8'));
       |                          ^

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎎[3/4]⎯

 FAIL  tests/e2e/pipeline.test.ts > E2E Pipeline Tests > should complete execution in under 30 seconds
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ tests/e2e/pipeline.test.ts:439:28
    437|
    438|     // ASSERT: Should complete quickly with mocked dependencies
    439|     expect(result.success).toBe(true);
       |                          ^
    440|     expect(duration).toBeLessThan(30000);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎎[4/4]⎯

 Test Files  1 failed (1)
      Tests  4 failed | 3 passed (7)
   Start at  02:42:14
   Duration  654ms (transform 221ms, setup 21ms, collect 296ms, tests 18ms, environment 0ms, prepare 99ms)
```
</details>

<details>
<summary>Debug Test Output (click to expand)</summary>

```
=== DEBUG TEST START ===
tempDir: /tmp/debug-e2e-EEXIAq
prdPath: /tmp/debug-e2e-EEXIAq/PRD.md
planDir: /tmp/debug-e2e-EEXIAq/plan
existsSync(prdPath): true
existsSync(planDir): true

=== Pipeline created ===

=== Pipeline Result ===
success: false
sessionPath:
sessionPath type: string
sessionPath length: 0
finalPhase: qa_skipped
totalTasks: 0
completedTasks: 0
failedTasks: 3

=== Pipeline Internal State ===
pipeline.sessionManager: SessionManager {
  prdPath: '/tmp/debug-e2e-EEXIAq/PRD.md',
  planDir: '/tmp/debug-e2e-EEXIAq/plan'
}
pipeline.sessionManager.currentSession: null
pipeline.currentPhase: shutdown_complete

=== Direct SessionManager.initialize() Call ===
Error during initialize(): SessionFileError: Failed to validate PRD at /tmp/debug-e2e-EEXIAq/PRD.md: The "list" argument must be an instance of SharedArrayBuffer, ArrayBuffer or ArrayBufferView.
    at Module.readUTF8FileStrict (/home/dustin/projects/hacky-hack/src/core/session-utils.ts:204:11)
    at PRDValidator.validate (/home/dustin/projects/hacky-hack/src/utils/prd-validator.ts:204:21)
    at SessionManager.initialize (/home/dustin/projects/hacky-hack/src/core/session-manager.ts:242:30)
    at /home/dustin/projects/hacky-hack/tests/e2e/pipeline-debug.test.ts:265:23
  path: '/tmp/debug-e2e-EEXIAq/PRD.md',
  operation: 'validate PRD',
  code: 'ERR_INVALID_ARG_TYPE'
}

=== File Checks ===
existsSync(result.sessionPath): true
=== DEBUG TEST END ===
```
</details>

## Timeline Analysis

| Time | Component | Event | Details |
|------|-----------|-------|---------|
| 00:00.000 | Test Setup | Create temp directory | `mkdtempSync()` creates `/tmp/debug-e2e-EEXIAq` |
| 00:00.010 | Test Setup | Write PRD file | `writeFileSync()` writes mock PRD to temp directory |
| 00:00.020 | PRPPipeline | Constructor | Creates SessionManager with PRD path and plan directory |
| 00:00.030 | PRPPipeline | run() | Starts pipeline execution |
| 00:00.040 | PRPPipeline | initializeSession() | Calls `sessionManager.initialize()` |
| 00:00.050 | SessionManager | initialize() | Calls PRD validation |
| 00:00.060 | PRDValidator | validate() | Calls `readUTF8FileStrict()` to read PRD |
| 00:00.070 | SessionUtils | readUTF8FileStrict() | Calls mocked `readFile()` which returns **string** instead of **Buffer** |
| 00:00.080 | SessionUtils | TextDecoder.decode() | **THROWS**: `ERR_INVALID_ARG_TYPE` - expects Buffer, receives string |
| 00:00.090 | SessionUtils | Catch block | Wraps error in `SessionFileError` and re-throws |
| 00:00.100 | SessionManager | initialize() catch | Receives `SessionFileError`, determines it's **non-fatal** via `isFatalError()` |
| 00:00.110 | PRPPipeline | initializeSession() catch | Treats as non-fatal error, sets phase to `session_failed`, **continues without session** |
| 00:00.120 | PRPPipeline | decomposePRD() | Skipped (no session) |
| 00:00.130 | PRPPipeline | executeBacklog() | Skipped (no session) |
| 00:00.140 | PRPPipeline | runQACycle() | Skipped due to no completed tasks, phase set to `qa_skipped` |
| 00:00.150 | PRPPipeline | Return result | Returns `success: false`, `sessionPath: ''` (empty string) |
| 00:00.160 | Test | Assertions | **FAILS**: `success` is `false`, `sessionPath` is empty, files don't exist |

## Failure Point Identification

**Last Successful Log**: Test setup completed, PRPPipeline constructor succeeded

**First Error Log**:
```
SessionFileError: Failed to validate PRD at /tmp/debug-e2e-EEXIAq/PRD.md:
The "list" argument must be an instance of SharedArrayBuffer, ArrayBuffer or ArrayBufferView.
```

**Failure Location**: `src/core/session-utils.ts:204:11` in `readUTF8FileStrict()`

**Error Type**: `ERR_INVALID_ARG_TYPE` - Node.js system error

**Error Path**:
1. Test mocks `readFile()` to return string
2. `PRDValidator.validate()` calls `readUTF8FileStrict()`
3. `readUTF8FileStrict()` calls mocked `readFile()` which returns string
4. `TextDecoder.decode(buffer)` expects Buffer but receives string
5. Node.js throws `ERR_INVALID_ARG_TYPE`
6. Error wrapped in `SessionFileError` and re-thrown
7. `isFatalError()` determines `SessionFileError` is non-fatal
8. Pipeline continues without initializing session

## Root Cause Diagnosis

### Primary Issue

**Mock Mismatch**: The E2E test mocks `readFile` from `node:fs/promises` to return **strings**, but the production code in `readUTF8FileStrict()` expects `readFile` to return a **Buffer**.

### Contributing Factors

1. **Non-Fatal Error Handling**: `SessionFileError` is considered non-fatal by `isFatalError()` function, allowing the pipeline to continue without a valid session

2. **Missing Session Validation**: The pipeline doesn't validate that `currentSession` is non-null before proceeding with subsequent phases

3. **Mock Return Type Mismatch**: The test mock returns a string when the real `readFile` returns a `Buffer`:
   ```typescript
   // Test mock (WRONG)
   vi.mocked(readFile).mockImplementation((path: string | Buffer) => {
     return Promise.resolve('string content'); // ❌ Returns string
   });

   // Expected behavior (CORRECT)
   // readFile returns Promise<Buffer>
   ```

4. **TextDecoder Buffer Requirement**: `TextDecoder.decode()` requires a Buffer/ArrayBuffer view, not a string:
   ```typescript
   const buffer = await readFile(path); // Expects Buffer, receives string from mock
   const decoder = new TextDecoder('utf-8', { fatal: true });
   return decoder.decode(buffer); // ❌ THROWS: buffer is string, not Buffer
   ```

### Evidence

1. **Error Message**:
   ```
   The "list" argument must be an instance of SharedArrayBuffer, ArrayBuffer or ArrayBufferView.
   ```

2. **Error Code**: `ERR_INVALID_ARG_TYPE`

3. **Stack Trace**:
   ```
   at Module.readUTF8FileStrict (src/core/session-utils.ts:204:11)
   at PRDValidator.validate (src/utils/prd-validator.ts:204:21)
   at SessionManager.initialize (src/core/session-manager.ts:242:30)
   ```

4. **Debug Output**:
   ```
   pipeline.sessionManager.currentSession: null
   sessionPath:  (empty string)
   finalPhase: qa_skipped
   ```

5. **Missing Files**: `prd_snapshot.md` and `tasks.json` don't exist because session directory was never created

## Mock Behavior Analysis

### readFile Mock

**Called**: During PRD validation

**Returns**: String (INCORRECT - should return Buffer)

**Mock Implementation** (from `tests/e2e/pipeline.test.ts:240-249`):
```typescript
vi.mocked(readFile).mockImplementation((path: string | Buffer) => {
  const pathStr = String(path);
  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(JSON.stringify(createMockBacklog())); // ❌ String
  }
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(mockSimplePRD); // ❌ String
  }
  return Promise.resolve(''); // ❌ String
});
```

**Expected Behavior**:
```typescript
// Real readFile returns Promise<Buffer>
const buffer = await readFile(path); // Buffer<...>
```

**Actual Behavior in Test**:
```typescript
const buffer = await readFile(path); // string (from mock)
// Later: TextDecoder.decode(buffer) throws because buffer is not a Buffer
```

### existsSync Mock

**Behavior**: Always returns `true`

**Impact**: Masks actual file system issues - test passes file existence checks even when files weren't created

**Mock Implementation** (from `tests/e2e/pipeline.test.ts:252`):
```typescript
vi.mocked(existsSync).mockReturnValue(true);
```

**Example of Issue**:
```typescript
// Test checks: existsSync(join(result.sessionPath, 'prd_snapshot.md'))
// Mock returns: true
// Reality: File doesn't exist, sessionPath is empty string
// existsSync('') returns true in some systems or behaves unexpectedly
```

### createAgent Mock

**Called**: Never (pipeline fails before agent creation)

**Agent Types Created**: None

## Recommended Fix Approach

### For P2.M1.T2.S1 (Fix test mock to return Buffer)

**Action**: Update the `readFile` mock in E2E tests to return `Buffer` instead of `string`

**File**: `tests/e2e/pipeline.test.ts`

**Current Implementation** (lines 240-249):
```typescript
vi.mocked(readFile).mockImplementation((path: string | Buffer) => {
  const pathStr = String(path);
  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(JSON.stringify(createMockBacklog())); // ❌ String
  }
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(mockSimplePRD); // ❌ String
  }
  return Promise.resolve('');
});
```

**Fixed Implementation**:
```typescript
vi.mocked(readFile).mockImplementation((path: string | Buffer) => {
  const pathStr = String(path);
  if (pathStr.includes('tasks.json')) {
    return Promise.resolve(
      Buffer.from(JSON.stringify(createMockBacklog()), 'utf-8') // ✅ Buffer
    );
  }
  if (pathStr.includes('PRD.md')) {
    return Promise.resolve(Buffer.from(mockSimplePRD, 'utf-8')); // ✅ Buffer
  }
  return Promise.resolve(Buffer.from('', 'utf-8')); // ✅ Buffer
});
```

**Alternative Fix** (if using Node.js `Buffer.from`):
```typescript
import { Buffer } from 'node:buffer';

// In mock:
return Promise.resolve(Buffer.from(content, 'utf-8'));
```

### For P2.M1.T2.S2 (Add session validation)

**Action**: Add validation in PRPPipeline to ensure session was initialized before continuing

**File**: `src/workflows/prp-pipeline.ts`

**Location**: In `initializeSession()` method after catch block (around line 491)

**Implementation**:
```typescript
async initializeSession(): Promise<void> {
  // ... existing try/catch ...

  } catch (error) {
    // ... existing error handling ...

    this.currentPhase = 'session_failed';
  }

  // NEW: Validate that session was initialized
  if (this.sessionManager.currentSession === null) {
    throw new SessionFileError(
      this.prdPath,
      'initialize session',
      new Error('Session initialization failed: currentSession is null')
    );
  }
}
```

**Note**: This depends on making `SessionFileError` fatal for session initialization, or using a different error type.

### For P2.M1.T2.S3 (Improve error handling)

**Action**: Make session initialization errors fatal to prevent pipeline continuation without valid session

**File**: `src/utils/errors.ts`

**Location**: In `isFatalError()` function (around line 680)

**Current Implementation** (lines 680-685):
```typescript
// FATAL: SessionError with LOAD_FAILED or SAVE_FAILED codes
if (isSessionError(error)) {
  return (
    error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
    error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
  );
}
```

**Issue**: `SessionFileError` is not checked here

**Option 1 - Make SessionFileError fatal**:
```typescript
// FATAL: All SessionError and SessionFileError instances
if (isSessionError(error) || error instanceof SessionFileError) {
  return true;
}
```

**Option 2 - Add specific error code for session initialization**:
```typescript
// In session-manager.ts when throwing SessionFileError:
throw new SessionFileError(
  prdPath,
  'initialize session',
  error as Error,
  'SESSION_INIT_FAILED' // New error code
);

// In errors.ts:
if (isSessionError(error)) {
  return (
    error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
    error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED ||
    error.code === 'SESSION_INIT_FAILED' // Add fatal check
  );
}
```

## Appendix: Additional Context

### Related Code Snippets

#### 1. readUTF8FileStrict (src/core/session-utils.ts:195-206)

```typescript
export async function readUTF8FileStrict(
  path: string,
  operation: string
): Promise<string> {
  try {
    const buffer = await readFile(path); // ❌ Expects Buffer
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer); // ❌ THROWS if buffer is not Buffer
  } catch (error) {
    throw new SessionFileError(path, operation, error as Error);
  }
}
```

#### 2. Mock Setup (tests/e2e/pipeline.test.ts:46-53)

```typescript
// Mock fs/promises for file operations - only mock readFile, let others work
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(), // ❌ Mock that returns strings
  };
});
```

#### 3. Pipeline Result (src/workflows/prp-pipeline.ts:1677-1678, 1726)

```typescript
// Success path:
const sessionPath = this.sessionManager.currentSession?.metadata.path ?? '';
// ❌ Returns '' if currentSession is null

// Error path:
sessionPath: this.sessionManager?.currentSession?.metadata.path ?? '',
// ❌ Returns '' if currentSession is null
```

### Similar Issues

1. **Buffer vs String in Tests**: This is a common issue when mocking Node.js file system operations. Many tests mock `readFile` to return strings for simplicity, but production code expects Buffers.

2. **Silent Failures**: The non-fatal error handling allows the pipeline to continue in an invalid state, making debugging difficult.

3. **Mock Masking Issues**: The `existsSync` mock returning `true` for all paths masks the fact that files weren't created, making it harder to detect the real issue.

### Testing Recommendations

1. **Use Real File System in Tests**: Consider using temporary directories with real file operations instead of mocking, or ensure mocks match production behavior exactly.

2. **Validate Mock Return Types**: Ensure mocked functions return the same types as the real functions (Buffer vs string).

3. **Add Session Validation**: Add assertions to verify that session was initialized successfully before proceeding with subsequent phases.

4. **Improve Error Messages**: When session initialization fails, provide clearer error messages that indicate the root cause rather than continuing silently.

5. **Make Session Init Fatal**: Consider making all session initialization errors fatal to prevent the pipeline from continuing in an invalid state.

---

**Analysis Completed**: 2025-01-16 02:45:00 UTC
**Analyzed By**: PRP Subtask P2.M1.T1.S3 Implementation Agent
**Next Steps**: Proceed to P2.M1.T2 to implement the recommended fixes
