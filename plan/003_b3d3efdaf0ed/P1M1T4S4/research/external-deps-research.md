# External Dependencies & Nested Execution Guard Research

## Executive Summary

This document provides a comprehensive analysis of the external dependencies and the nested execution guard specification from project documentation including PRD, architecture documents, and system context.

---

## 1. External Dependencies Specification

### 1.1 z.ai API Integration

The project uses **z.ai** as the primary model provider with full compatibility to Anthropic's SDK:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL ?? 'https://api.z.ai/api/anthropic'
});
```

**Available Models:**
- **GLM-4.7**: High-quality reasoning for architect and other agents (8192/4096 max tokens)
- **GLM-4.5-Air**: Fast/lightweight tasks (4096 max tokens)

**Environment Variable Mapping:**
- Shell: `ANTHROPIC_AUTH_TOKEN=zk-xxxxx`
- Internal: `process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN`

---

## 2. PRP_PIPELINE_RUNNING Environment Variable Specification

### 2.1 Purpose

**Primary Function:** Prevent accidental nested execution of the pipeline that could corrupt state files.

**Problem Statement:** Agents could accidentally invoke `run-prd.sh` during implementation, causing recursive execution and corrupted pipeline state.

### 2.2 Variable Specification

**Name:** `PRP_PIPELINE_RUNNING`
**Type:** String containing process ID
**Set Value:** Current process ID (`process.pid.toString()`)
**Clear Value:** Not cleared during normal operation

### 2.3 Guard Logic Implementation

From `delta_prd.md` lines 194-206:

```typescript
// On pipeline start
if (process.env.PRP_PIPELINE_RUNNING) {
  if (!isValidNestedExecution()) {
    console.error('CRITICAL: Nested pipeline execution detected');
    process.exit(1);
  }
}
process.env.PRP_PIPELINE_RUNNING = process.pid.toString();

function isValidNestedExecution(): boolean {
  return process.env.SKIP_BUG_FINDING === 'true' &&
         process.env.PLAN_DIR?.includes('bugfix');
}
```

---

## 3. Nested Execution Guard Rules

### 3.1 Conditions Preventing Nested Execution

The guard prevents execution if **ANY** of these conditions are true:

1. **`PRP_PIPELINE_RUNNING` is set** AND
2. **NOT** in bug fix mode (`SKIP_BUG_FINDING !== 'true'`) OR
3. **NOT** in bug fix directory (path does not contain "bugfix")

### 3.2 Conditions Allowing Bug Fix Recursion

Nested execution is **allowed** ONLY if **BOTH** conditions are true:

1. **`SKIP_BUG_FINDING=true`** - Indicates legitimate bug fix recursion
2. **`PLAN_DIR` contains "bugfix"** - Validates bugfix context

### 3.3 SKIP_BUG_FINDING Variable Specification

**Name:** `SKIP_BUG_FINDING`

**Purpose:**
- Skip bug hunt stage
- Identify bug fix mode when `true`
- Enable legitimate nested execution for bug fixes

**Valid Values:**
- `"true"` - Skip bug hunt, enable bug fix mode
- `undefined` or any other value - Normal execution mode

---

## 4. Path Validation Requirements

### 4.1 Must Contain "bugfix" in the Path

**Context:** Validated against `PLAN_DIR` environment variable

**Session Structure:** Must follow `plan/{sequence}_{hash}/bugfix/{sequence}_{hash}/` pattern

### 4.2 Session Creation Guards

From `system_context.md` lines 393-396:

- In bug fix mode, prevent creating sessions in main `plan/` directory
- Bug fix session paths must contain "bugfix" in the path
- Debug logging shows `PLAN_DIR`, `SESSION_DIR`, `SKIP_BUG_FINDING` values

---

## 5. Architecture Context

### 5.1 Why the Guard Exists

The nested execution guard is a critical safety mechanism because:

1. **State Protection**: Prevents corruption of session files and task registries
2. **API Cost Control**: Avoids accidental recursive API calls that could incur massive costs
3. **Data Integrity**: Ensures session consistency and prevents race conditions
4. **Debug Safety**: Protects pipeline state during debugging activities

### 5.2 Integration Points

The guard is integrated at multiple levels:

1. **Pipeline Entry Point**: Checked before any processing begins
2. **Session Manager**: Validates execution context before session creation
3. **Task Orchestrator**: Enforces execution rules during backlog processing
4. **CLI Interface**: Provides user feedback when guard is triggered

---

## 6. Related Documentation References

### 6.1 Primary Sources

1. **PRD.md** (Lines 111, 284, 314-327)
   - Original requirement specification
   - Guard logic description

2. **plan/003_b3d3efdaf0ed/docs/external_deps.md** (Lines 812-814)
   - Environment variable specifications
   - Pipeline control flags

3. **plan/003_b3d3efdaf0ed/docs/system_context.md** (Lines 383-396)
   - Detailed guard logic implementation
   - Session creation rules

4. **plan/003_b3d3efdaf0ed/delta_prd.md** (Lines 178-206, 345-347, 401-404)
   - Technical implementation details
   - Validation function specification

---

## 7. Testing Framework Requirements

### 7.1 Vitest Configuration

**Framework:** Vitest v1.6.1

**Coverage Requirements:**
- 100% coverage requirements for all metrics
- ES Module support with .js extensions
- Environment-specific test setup

### 7.2 Test Structure

**Unit Tests:** Core business logic
**Integration Tests:** Workflows and tools
**End-to-End Tests:** Full pipeline validation

---

## 8. Implementation Verification Requirements

Based on the research, unit tests for the nested execution guard must verify:

### 8.1 Basic Guard Functionality
- Prevents execution when PRP_PIPELINE_RUNNING is set
- Allows execution when PRP_PIPELINE_RUNNING is not set
- Sets PRP_PIPELINE_RUNNING to current PID on valid entry

### 8.2 Bug Fix Recursion Conditions
- Allows execution when SKIP_BUG_FINDING=true AND path contains "bugfix"
- Prevents execution when SKIP_BUG_FINDING=true BUT path does not contain "bugfix"
- Prevents execution when SKIP_BUG_FINDING is not set

### 8.3 Environment Variable Validation
- Proper PID setting and string conversion
- Case-sensitive environment variable checks
- Proper cleanup and restoration in tests

### 8.4 Debug Logging
- Verifies PLAN_DIR is logged
- Verifies SESSION_DIR is logged
- Verifies SKIP_BUG_FINDING value is logged

### 8.5 Error Handling
- Clear error messages on guard failure
- Proper process exit codes
- Error includes existing PID information

---

## 9. Platform-Specific Considerations

**General:**
- Cross-platform PID handling
- Environment variable case sensitivity
- Path separator normalization (POSIX `/` vs Windows `\`)
- "bugfix" string matching should be case-insensitive for robustness

---

## 10. Summary

The nested execution guard is a critical safety mechanism that protects the PRP Pipeline from accidental recursive execution. It uses environment variables (`PRP_PIPELINE_RUNNING` and `SKIP_BUG_FINDING`) along with path validation to control execution flow.

**Key Points:**
1. Guard prevents nested execution by default
2. Bug fix recursion is the only allowed exception
3. Both SKIP_BUG_FINDING=true AND bugfix path required for exception
4. Debug logging provides clear context for troubleshooting
5. Guard must be tested with mocked environment variables

This specification forms the contract for what unit tests must verify to ensure the guard functions correctly across all execution scenarios.
