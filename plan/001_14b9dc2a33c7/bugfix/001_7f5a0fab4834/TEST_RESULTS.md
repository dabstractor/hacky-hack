# Bug Fix Requirements

## Overview

Comprehensive end-to-end testing of the PRP Pipeline implementation against the original PRD requirements revealed **1 CRITICAL bug** that completely prevents the application from running, along with several MAJOR issues and multiple MINOR issues. The implementation shows substantial effort with many features working correctly, but core dependencies are misconfigured.

**Testing Summary:**
- Total test areas covered: 12
- Passing areas: 9
- Areas with issues: 3
- Overall assessment: **Application is non-functional due to missing core dependency**

---

## Critical Issues (Must Fix)

### Issue 1: Missing Groundswell Dependency - Application Cannot Run

**Severity**: Critical
**PRD Reference**: Section 9.1 - "Core Framework: Groundswell (local library at `~/projects/groundswell`)"
**Expected Behavior**: Application should import and use the Groundswell library as specified in PRD section 9.
**Actual Behavior**: The entire codebase imports from `groundswell` but the dependency is NOT in `package.json` and NOT linked in `node_modules`. The application fails at runtime with `ERR_MODULE_NOT_FOUND`.

**Steps to Reproduce**:
1. Attempt to run any command: `npm run dev -- --prd PRD.md --validate-prd`
2. Observe error: `Error: Cannot find package 'groundswell'`
3. Try TypeScript compilation: `npm run typecheck`
4. Observe 65+ TypeScript errors: "Cannot find module 'groundswell'"

**Root Cause**:
- `package.json` dependencies list does NOT include `groundswell`
- `npm link groundswell` was never executed (no symlink in node_modules)
- All source files import from `'groundswell'` but dependency doesn't exist

**Evidence**:
```bash
$ npm list groundswell
empty (not installed)

$ ls node_modules/ | grep groundswell
(no output)

$ npm run typecheck
src/agents/agent-factory.ts(25,41): error TS2307: Cannot find module 'groundswell'
[65+ similar errors]
```

**Affected Files** (65+ TypeScript files fail to compile):
- `src/workflows/prp-pipeline.ts:25` - `import { Workflow, Step } from 'groundswell'`
- `src/agents/agent-factory.ts:25`
- `src/agents/prp-generator.ts:17`
- `src/agents/prp-executor.ts:26`
- All workflow, agent, and tool files

**Suggested Fix**:
1. Add `groundswell` to `package.json` dependencies OR link via `npm link`:
   ```bash
   cd ~/projects/groundswell && npm link
   cd ~/projects/hacky-hack && npm link groundswell
   ```
2. Verify symlink exists: `ls -la node_modules/groundswell`
3. Update `package.json` to include `"groundswell": "file:../groundswell"` or similar
4. Run `npm install` to ensure dependency is resolved
5. Verify `npm run typecheck` passes with no errors

**Impact**: Application is **completely non-functional**. No commands can run.

---

## Major Issues (Should Fix)

### Issue 2: Test Suite Has Memory Issues

**Severity**: Major
**PRD Reference**: Section 9.4 - "Validation & QA: Wrap validation scripts in a ValidationWorkflow step"
**Expected Behavior**: Test suite should run cleanly without memory issues
**Actual Behavior**: Running `npm run test:run` causes worker memory exhaustion

**Steps to Reproduce**:
1. Run `npm run test:run`
2. Observe: `Error: Worker terminated due to reaching memory limit: JS heap out of memory`
3. Test results show: 58 failed | 1593 passed (1688)

**Evidence**:
```
Test Files  10 failed | 41 passed (52)
Tests       58 failed | 1593 passed (1688)
Errors      10 errors
```

**Suggested Fix**:
1. Increase Node.js memory limit in test scripts: `NODE_OPTIONS="--max-old-space-size=4096" vitest`
2. Investigate memory leaks in test setup/teardown
3. Review tests that cause worker termination

---

### Issue 3: Unhandled Promise Rejections in Tests

**Severity**: Major
**PRD Reference**: Section 7.5 - "Stronger retry logic and exception handling"
**Expected Behavior**: All promises should be properly handled
**Actual Behavior**: Multiple unhandled promise rejections during test execution

**Evidence**:
```
(node:471914) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously
```

**Suggested Fix**: Ensure all async operations have proper `.catch()` handlers

---

## Minor Issues (Nice to Fix)

### Issue 4: ESLint Warnings for Nullable Boolean Checks

**Severity**: Minor
**PRD Reference**: Code quality
**Expected Behavior**: Code should pass ESLint without warnings
**Actual Behavior**: 20+ ESLint warnings for `@typescript-eslint/strict-boolean-expressions`

**Evidence**:
```
src/agents/prp-runtime.ts:313:3  warning  Unexpected nullable string value
src/cli/index.ts:160:7          warning  Unexpected nullable string value
[20+ similar warnings]
```

**Suggested Fix**: Explicitly handle null/empty cases in conditionals

---

### Issue 5: Console Statements in Production Code

**Severity**: Minor
**PRD Reference**: Section 7.3 - "structured logging instead of print -P"
**Expected Behavior**: All output should use structured logger
**Actual Behavior**: `console.log` statements in `src/index.ts` (lines 138-169)

**Evidence**:
```
src/index.ts
138:5  warning  Unexpected console statement  no-console
139:5  warning  Unexpected console statement  no-console
[12 occurrences]
```

**Suggested Fix**: Replace `console.log` with `logger.info()` for consistency

---

### Issue 6: One Failing Unit Test

**Severity**: Minor
**PRD Reference**: Test coverage
**Expected Behavior**: All unit tests should pass
**Actual Behavior**: `tests/unit/core/research-queue.test.ts` has 1 failing test

**Evidence**:
```
❯ tests/unit/core/research-queue.test.ts (36 tests | 1 failed)
❌ should create PRPGenerator with sessionManager
Expected "spy" to be called with arguments:
[{ currentSession: { …(4) } }]
Received:
[{ currentSession: { …(4) } }, false]
```

**Suggested Fix**: Update test expectations to include the `false` parameter

---

## Testing Summary

### Areas with Good Coverage (Passing)

1. **PRD Validation** - PASSING
   - Empty file detection works
   - Malformed PRD detection works
   - Section validation works
   - Helpful error messages provided

2. **Circular Dependency Detection** - PASSING
   - Self-dependency detection (A→A) works
   - Cycle detection with DFS algorithm works
   - Long chain warnings work

3. **Resource Monitoring** - PASSING
   - File handle monitoring works
   - Memory monitoring works
   - Task counting and maxTasks limit works
   - Platform-specific detection (Linux/macOS/Windows) works

4. **CLI Argument Parsing** - PASSING
   - File existence validation works
   - Scope parsing works
   - Flag validation works

5. **Task Hierarchy Models** - PASSING (57 tests)
6. **Task Patcher** - PASSING (26 tests)
7. **Scope Resolver** - PASSING (85 tests)
8. **Error Utilities** - PASSING (94 tests)
9. **Retry Logic** - PASSING (98 tests)
10. **Models** - PASSING (114 tests)

### Areas Needing More Attention

1. **Groundswell Integration** - CRITICAL FAILURE
   - Dependency not installed/linked
   - Cannot run any application commands
   - TypeScript compilation fails

2. **Test Infrastructure** - MAJOR ISSUES
   - Memory exhaustion during test runs
   - Worker termination
   - Unhandled promise rejections

3. **Code Quality** - MINOR ISSUES
   - ESLint warnings (nullable booleans, console statements)
   - One failing unit test in research-queue

---

## Overall Assessment

The implementation demonstrates **substantial effort and many working features**:
- Core data structures and utilities are well-implemented
- PRD validation, dependency detection, and resource monitoring work correctly
- Test coverage is extensive (1688 tests total)

However, the **application is completely non-functional** due to the missing Groundswell dependency. This is a critical infrastructure issue that must be resolved before any feature can be used.

**Recommendation**: Fix Issue 1 (Groundswell dependency) immediately, then address test infrastructure issues (Issue 2-3), followed by code quality improvements (Issue 4-6).

---

## Test Environment

- Platform: Linux 6.17.8-arch1-1
- Node.js: v25.2.1
- npm: (not specified in test output)
- Test Framework: Vitest 1.6.1
- Date: 2026-01-14
