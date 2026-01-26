# Integration Test Files Research - P1.M1.T2.S2

## Overview
This document identifies all integration test files that instantiate SessionManager and require constructor signature updates.

## Target Integration Test Files

Based on comprehensive codebase analysis, the following integration test files contain SessionManager constructor calls that need updating:

### 1. `tests/integration/session-structure.test.ts`
- **Constructor Calls**: ~5 instances
- **Current Pattern**: 2-parameter `new SessionManager(prdPath, planDir)`
- **Required Update**: Add third parameter or use explicit default

### 2. `tests/integration/tasks-json-authority.test.ts`
- **Constructor Calls**: ~5 instances
- **Current Pattern**: 2-parameter `new SessionManager(prdPath, planDir)`
- **Required Update**: Add third parameter or use explicit default

### 3. `tests/integration/delta-resume-regeneration.test.ts`
- **Constructor Calls**: ~5 instances
- **Current Pattern**: 2-parameter `new SessionManager(prdPath, planDir)`
- **Required Update**: Add third parameter or use explicit default

### 4. `tests/integration/prp-generator-integration.test.ts`
- **Constructor Calls**: ~2 instances
- **Current Pattern**: 2-parameter `new SessionManager(prdPath, planDir)`
- **Required Update**: Add third parameter or use explicit default

### 5. `tests/integration/prp-runtime-integration.test.ts`
- **Constructor Calls**: ~1 instance
- **Current Pattern**: 2-parameter `new SessionManager(prdPath, planDir)`
- **Required Update**: Add third parameter or use explicit default

### 6. `tests/integration/scope-resolution.test.ts`
- **Constructor Calls**: ~1 instance
- **Current Pattern**: 2-parameter `new SessionManager(prdPath, planDir)`
- **Required Update**: Add third parameter or use explicit default

### 7. `tests/integration/prd-task-command.test.ts`
- **Constructor Calls**: ~1 instance
- **Current Pattern**: 2-parameter `new SessionManager(prdPath, planDir)`
- **Required Update**: Add third parameter or use explicit default

## Summary

- **Total Files**: 7 integration test files
- **Total Constructor Calls**: ~20 instances
- **Pattern Used**: All use 2-parameter constructor
- **Required Pattern**: Update to 3-parameter constructor

## Constructor Signature

```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```

## Update Strategy

Per the work item description:
> Use consistent pattern: resolve('plan') for planDir, 3 for flushRetries. For integration tests that test plan directory functionality, use test-specific temp directories instead of 'plan'.

This means:
1. Most integration tests should use: `new SessionManager(prdPath, resolve('plan'), 3)`
2. Tests specifically testing plan directory functionality should use temp directories for the second parameter
