# External Dependencies: PRP Development Pipeline Bug Fixes

**Project**: PRP Development Pipeline
**Bug Fix Sequence**: `002_1e734971e481`
**Bug Session**: `001_8d809cc989b9`
**Date**: 2026-01-15
**Document Type**: External Dependencies Reference

---

## Overview

This document catalogs all external dependencies required for implementing the bug fixes identified in PRD `001_8d809cc989b9`. All dependencies are **already installed** in the project - this is reference material only.

---

## 1. Core Dependencies

### 1.1 TypeScript & Build Tools

| Package      | Version  | Purpose                              | Bug Fix Relevance                                    |
| ------------ | -------- | ------------------------------------ | ---------------------------------------------------- |
| `typescript` | `^5.7.x` | Type system, error class definitions | Required for `EnvironmentError` class implementation |
| `ts-node`    | `^10.x`  | TypeScript execution                 | Required for running tests                           |
| `tsx`        | `^4.x`   | TypeScript execution                 | Required for ESM support                             |

**Notes**:

- Error classes must use proper TypeScript inheritance patterns
- Must include `Object.setPrototypeOf()` calls for prototype chain correctness

---

### 1.2 Validation & Schema

| Package | Version | Purpose                                  | Bug Fix Relevance                                        |
| ------- | ------- | ---------------------------------------- | -------------------------------------------------------- |
| `zod`   | `^3.x`  | Schema validation, runtime type checking | Required for `context_scope` validation in test fixtures |

**Usage Pattern** (from codebase):

```typescript
import { z } from 'zod';

const SubtaskSchema = z.object({
  context_scope: z
    .string()
    .refine(val => val.startsWith('CONTRACT DEFINITION:\n'), {
      message:
        'context_scope must start with "CONTRACT DEFINITION:" followed by a newline',
    }),
});
```

**Relevance**:

- Test fixtures must comply with Zod schema validation
- `context_scope` field must start with "CONTRACT DEFINITION:\n"

---

### 1.3 Logging Infrastructure

| Package       | Version | Purpose            | Bug Fix Relevance                                 |
| ------------- | ------- | ------------------ | ------------------------------------------------- |
| `pino`        | `^9.x`  | Structured logging | Required for Task Orchestrator logging test fixes |
| `pino-pretty` | `^11.x` | Log formatting     | Development only                                  |

**Current Logger Pattern**:

```typescript
import { getLogger } from './logger-utils';

this.#logger = getLogger('TaskOrchestrator');
this.#logger.info({ taskId, status }, 'Task status changed');
```

**Issue**: Tests expect `console.log()` calls but implementation uses Pino
**Fix Options**:

1. Update test mocks to expect Pino calls (recommended)
2. Add console.log wrapper (not recommended - breaks structured logging)

**Pino API Reference**:

- `logger.info(obj, msg)` - Info level log
- `logger.debug(obj, msg)` - Debug level log
- `logger.error(obj, msg)` - Error level log
- `logger.child(options)` - Create child logger with bound context

---

### 1.4 Testing Framework

| Package               | Version | Purpose                          | Bug Fix Relevance                   |
| --------------------- | ------- | -------------------------------- | ----------------------------------- |
| `vitest`              | `^2.x`  | Test runner, mocking, assertions | Required for all bug fix validation |
| `@vitest/coverage-v8` | `^1.x`  | Code coverage                    | Quality assurance                   |

**Vitest API Reference**:

```typescript
// Mocking functions
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock a function
const mockFn = vi.fn();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);

// Mock a module
vi.mock('./module', () => ({
  func: vi.fn(),
}));
```

**Relevance**:

- Task Orchestrator tests use Vitest mocks for logger
- E2E tests use Vitest for comprehensive mocking (agents, MCP tools, filesystem)

---

## 2. Error Handling Dependencies

### 2.1 Error Code Constants

**Location**: `/home/dustin/projects/hacky-hack/src/utils/errors.ts` (ErrorCodes enum)

**Required Error Codes**:

```typescript
enum ErrorCodes {
  PIPELINE_VALIDATION_INVALID_INPUT = 'PIPELINE_VALIDATION_INVALID_INPUT',
  // ... other codes
}
```

**Usage in EnvironmentError**:

```typescript
export class EnvironmentError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
  // ...
}
```

**Notes**:

- `ErrorCodes` enum is already defined
- `EnvironmentError` should use `PIPELINE_VALIDATION_INVALID_INPUT` code

---

## 3. File System Dependencies

### 3.1 Node.js Built-in Modules

| Module        | Version  | Purpose                       | Bug Fix Relevance                             |
| ------------- | -------- | ----------------------------- | --------------------------------------------- |
| `fs/promises` | Built-in | Async file operations         | Required for session file creation debugging  |
| `path`        | Built-in | Path manipulation             | Required for session directory structure      |
| `crypto`      | Built-in | PRD hash generation (SHA-256) | Required for E2E session initialization debug |

**File System API Reference**:

```typescript
import { mkdir, writeFile, rename } from 'fs/promises';
import { join } from 'path';

// Atomic write pattern (used by session utils)
const tempPath = `${filePath}.tmp`;
await writeFile(tempPath, content, 'utf-8');
await rename(tempPath, filePath); // Atomic on POSIX
```

**Relevance**:

- E2E failures may be due to file system permission issues
- Session initialization uses atomic writes (temp + rename)
- PRD hash generation uses SHA-256 from crypto module

---

## 4. Configuration Dependencies

### 4.1 Environment Configuration

| Package  | Version | Purpose                      | Bug Fix Relevance                 |
| -------- | ------- | ---------------------------- | --------------------------------- |
| `dotenv` | `^16.x` | Environment variable loading | Related to `.env` verbosity issue |

**Current Usage**:

```typescript
import dotenv from 'dotenv';
dotenv.config(); // Loads .env file
```

**Issue**: Test output shows excessive `.env` loading messages (20+ occurrences)

**Fix Pattern**:

```typescript
dotenv.config({ quiet: true }); // Suppresses loading messages
```

**Relevance**:

- Minor issue (polish)
- Should be addressed after critical bugs fixed

---

## 5. No New Dependencies Required

**Critical Finding**: All bug fixes can be implemented using **existing dependencies only**.

- ✅ Error handling: Pure TypeScript (no dependencies)
- ✅ Retry logic: Pure TypeScript (no dependencies)
- ✅ Validation: `zod` (already installed)
- ✅ Logging: `pino` (already installed)
- ✅ Testing: `vitest` (already installed)
- ✅ File system: Node.js built-ins (no dependencies)

---

## 6. Dependency Lock File Status

**File**: `/home/dustin/projects/hacky-hack/package-lock.json`
**Status**: Current and consistent
**Action Required**: None

---

## 7. Type Safety Dependencies

### 7.1 TypeScript Configuration

**File**: `/home/dustin/projects/hacky-hack/tsconfig.json`

**Relevant Compiler Options**:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**Relevance**:

- Error classes must properly handle prototype chains
- Type guard functions must use proper type predicates
- Decorator metadata required for Groundswell integration

---

## 8. Development Dependencies

### 8.1 Linting & Formatting

| Package                            | Version | Purpose            | Bug Fix Relevance |
| ---------------------------------- | ------- | ------------------ | ----------------- |
| `eslint`                           | `^9.x`  | Linting            | Code quality      |
| `@typescript-eslint/eslint-plugin` | `^8.x`  | TypeScript linting | Code quality      |
| `prettier`                         | `^3.x`  | Code formatting    | Code consistency  |

**Notes**:

- Follow existing code style patterns
- Use Prettier for formatting
- Run linting before committing

---

## 9. Dependency Security

### 9.1 Known Vulnerabilities

**Status**: No known vulnerabilities in current dependencies
**Action Required**: None

---

## 10. Dependency Upgrade Considerations

### 10.1 Not Required for Bug Fixes

- ❌ Do NOT upgrade any dependencies for these bug fixes
- ❌ Do NOT add new dependencies
- ✅ Use only existing, stable dependencies

**Rationale**:

- Bug fixes should be minimal, targeted changes
- Dependency upgrades introduce risk of breaking changes
- Current dependency versions are stable and well-tested

---

## 11. Mock Dependencies for Testing

### 11.1 E2E Test Mocks

**Location**: `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`

**Mocked Components**:

1. **LLM Agents** (PRPGenerator, PRPExecutor, PRPRuntime)
2. **MCP Tools** (file operations, tool executions)
3. **File System** (session directory, file writes)
4. **Groundswell** (workflow tracking)

**Mock Pattern**:

```typescript
vi.mock('../src/agents/prp-generator', () => ({
  PRPGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      /* mock response */
    }),
  })),
}));
```

**Relevance**:

- E2E tests use comprehensive mocking strategy
- Mocks must return data structures that match expected schemas
- Session initialization failures may be due to mock misalignment

---

## 12. Dependency Version Matrix

| Dependency   | Version  | Type | Required For            |
| ------------ | -------- | ---- | ----------------------- |
| `typescript` | `^5.7.x` | dev  | Error class definitions |
| `vitest`     | `^2.x`   | dev  | Test validation         |
| `zod`        | `^3.x`   | prod | Schema validation       |
| `pino`       | `^9.x`   | prod | Logging infrastructure  |
| `dotenv`     | `^16.x`  | prod | Environment config      |

---

## 13. API Documentation References

### 13.1 Zod Schema Validation

**Official Docs**: https://zod.dev/
**Relevant Methods**:

- `z.string()` - String type
- `.refine(fn, message)` - Custom validation
- `z.object()` - Object type
- `.parse(data)` - Validate data

### 13.2 Pino Logging

**Official Docs**: https://getpino.io/
**Relevant Methods**:

- `getLogger(name)` - Get named logger
- `logger.info(obj, msg)` - Info log
- `logger.child(options)` - Child logger
- `pino(options)` - Create logger instance

### 13.3 Vitest Testing

**Official Docs**: https://vitest.dev/
**Relevant Methods**:

- `vi.fn()` - Mock function
- `vi.mock(path, factory)` - Mock module
- `expect().toHaveBeenCalledWith()` - Assertion
- `describe()` - Test suite
- `it()` - Test case

---

## 14. Conclusion

**Summary**: All external dependencies required for implementing the bug fixes are **already installed** and **properly configured**. No new dependencies need to be added. The bug fixes can proceed immediately using the existing dependency ecosystem.

**Next Steps**:

1. ✅ Use existing `zod` for schema validation
2. ✅ Use existing `pino` for logging
3. ✅ Use existing `vitest` for test validation
4. ✅ Implement `EnvironmentError` using pure TypeScript
5. ✅ Implement `isFatalError()` using pure TypeScript
6. ✅ Debug E2E using existing mock infrastructure

---

**Document Version**: 1.0
**Last Updated**: 2026-01-15
**Research Agent**: Task Synthesizer (Lead Technical Architect)
