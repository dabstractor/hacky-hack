# System Context & Architecture Analysis

## Project Overview

**Project Name**: hacky-hack
**Type**: PRP (Product Requirement Prompt) Pipeline Automation System
**Purpose**: Automated requirement analysis, task breakdown, and implementation orchestration

**Current Status**: Non-functional due to missing core dependency

---

## Critical Infrastructure Issues

### 1. Groundswell Dependency Crisis

**Current State**: Application completely non-functional
- **Root Cause**: Groundswell library not installed/linked
- **Impact**: 97 files cannot compile or run
- **TypeScript Errors**: 65+ compilation failures

**Groundswell Library Location**:
- Local development path: `~/projects/groundswell`
- Expected import: `import { Workflow, Step, Agent } from 'groundswell'`

**Dependencies Affected**:
```typescript
// Core Framework Imports
- Workflow, Step: src/workflows/*.ts (6 files)
- Agent, createAgent: src/agents/*.ts (3 files)
- Prompts: src/agents/prompts/*.ts (4 files)
- MCP Tools: src/tools/*.ts (3 files)
```

**Fix Strategy**: npm link from local development path

---

## Architecture Patterns

### 1. Workflow System

**Pattern**: Declarative workflow orchestration
```typescript
import { Workflow, Step } from 'groundswell';

// Workflows are defined as declarative steps
const workflow = new Workflow({
  name: 'prp-pipeline',
  steps: [/* ... */]
});
```

**Files Using Pattern**:
- `src/workflows/prp-pipeline.ts` - Main PRP generation pipeline
- `src/workflows/fix-cycle-workflow.ts` - Circular dependency fix
- `src/workflows/bug-hunt-workflow.ts` - Bug detection workflow
- `src/workflows/delta-analysis-workflow.ts` - Change analysis
- `src/workflows/hello-world.ts` - Demo workflow

### 2. Agent System

**Pattern**: Factory-based agent creation with prompts
```typescript
import { createAgent, type Agent } from 'groundswell';
import { createPrompt } from 'groundswell';

// Agents are created with specific roles and prompts
const agent = createAgent({
  role: 'architect',
  prompt: createPrompt('architect-prompt.ts')
});
```

**Agent Types**:
- PRP Generator - Creates task breakdowns
- PRP Executor - Executes tasks
- Specialized agents - Bug hunting, delta analysis, etc.

**Prompt Files**:
- `src/agents/prompts/architect-prompt.ts`
- `src/agents/prompts/prp-blueprint-prompt.ts`
- `src/agents/prompts/bug-hunt-prompt.ts`
- `src/agents/prompts/delta-analysis-prompt.ts`

### 3. MCP Tool Integration

**Pattern**: Model Context Protocol tool handlers
```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// Tools wrap external MCP services
const tool: Tool = {
  name: 'bash',
  executor: new MCPHandler(/* config */)
};
```

**MCP Tools**:
- `src/tools/bash-mcp.ts` - Bash command execution
- `src/tools/git-mcp.ts` - Git operations
- `src/tools/filesystem-mcp.ts` - File system operations

---

## Build System

### TypeScript Configuration

**Compiler Options**:
- Target: ES2022
- Module: ESNext
- Module Resolution: Node
- Strict mode: Enabled
- Path aliases: `@/`, `#/`, `groundswell`

**Vitest Configuration**:
- Test environment: Node
- Coverage threshold: 100%
- Alias for groundswell: Points to `../groundswell/dist/index.js`

### Package Scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "lint": "eslint src tests --ext .ts"
}
```

**Current Issue**: No memory limits configured for tests

---

## Logging Infrastructure

### Logger Pattern

**Library**: Pino (structured logging)
**Location**: `src/utils/logger.ts`

**Usage Pattern**:
```typescript
import { getLogger } from './utils/logger.js';

const logger = getLogger('ContextName', { verbose: true });

logger.info('Message');
logger.debug({ details }, 'Message with data');
logger.warn('Warning message');
logger.error({ error }, 'Error message');
```

**Features**:
- Context-aware loggers
- Sensitive data redaction
- Pretty-printed development mode
- JSON production mode
- Child loggers for scoped context

---

## Test Infrastructure

### Test Framework

**Primary**: Vitest 1.6.1
**Runner**: tsx (TypeScript execution)
**Coverage**: v8 (built-in)

**Test Structure**:
- Unit tests: `tests/unit/**/*.test.ts`
- Integration tests: `tests/integration/**/*.test.ts`
- E2E tests: `tests/e2e/**/*.test.ts`

### Test Statistics

**Total Test Suite**: 1688 tests
- Passing: 1593
- Failing: 58
- Error: 10

**Passing Areas** (9/12):
- PRD Validation
- Circular Dependency Detection
- Resource Monitoring
- CLI Argument Parsing
- Task Hierarchy Models
- Task Patcher
- Scope Resolver
- Error Utilities
- Retry Logic

**Failing Areas** (3/12):
- Groundswell Integration (CRITICAL - all tests fail)
- Test Infrastructure (memory exhaustion)
- One unit test in research-queue

### Memory Issues

**Symptoms**:
- Worker termination: "JS heap out of memory"
- 58 test failures
- No memory limits in Node.js options

**Root Causes**:
1. Large test data structures (PRP objects, task arrays)
2. No cleanup between tests
3. Repeated mock object creation
4. Timer mocking accumulation

**Memory-Intensive Patterns**:
- Research queue tests with 1374 lines
- E2E tests with large file processing
- Integration tests with 50+ task arrays

---

## Code Quality Standards

### ESLint Configuration

**Rules Enforced**:
- `@typescript-eslint/strict-boolean-expressions`: Warn
- `no-console`: Warn (only warn/error allowed)

**Current Violations**:
- 100+ nullable boolean check warnings
- 12 console.log statements in src/index.ts

### Code Patterns

**Nullable Boolean Pattern** (WARNING):
```typescript
// ❌ Violates strict-boolean-expressions
if (nullableString) { ... }

// ✅ Correct
if (nullableString && nullableString.trim()) { ... }
if (nullableString?.length) { ... }
```

**Console Logging Pattern** (VIOLATION):
```typescript
// ❌ Violates no-console rule
console.log('Message');

// ✅ Correct
logger.info('Message');
```

---

## Environment Configuration

### Development Environment

**Requirements**:
- Node.js: v20+ (tested on v25.2.1)
- TypeScript: 5.2+
- Platform: Linux/macOS/Windows

**Local Dependencies**:
- Groundswell: `~/projects/groundswell` (MUST be linked)

**Environment Variables**: None currently required

---

## Data Flow Architecture

### PRD Validation Flow

```
PRD.md
  → Validator (src/core/validators/)
  → ValidationReport
  → CLI Output (logger.info)
```

### Task Breakdown Flow

```
PRD.md
  → PRP Pipeline (src/workflows/prp-pipeline.ts)
  → Agent Factory (src/agents/agent-factory.ts)
  → PRP Generator (src/agents/prp-generator.ts)
  → Task Hierarchy (JSON backlog)
  → File System (plan/*/tasks.json)
```

### Research Queue Flow

```
Research Task
  → Research Queue (src/core/research-queue.ts)
  → Background Processing
  → PRP Generator Agents
  → Results Cache (Map)
```

---

## Key Files for Bug Fixes

### Critical Files (Groundswell Dependency)
1. `package.json` - Add groundswell dependency
2. `src/workflows/prp-pipeline.ts:25`
3. `src/agents/agent-factory.ts:25`
4. `src/agents/prp-generator.ts:17`
5. `src/agents/prp-executor.ts:26`
6. All workflow files (6 total)
7. All prompt files (4 total)
8. All tool files (3 total)

### High Priority Files (Test Infrastructure)
1. `package.json` - Add memory limits to test scripts
2. `vitest.config.ts` - Fix module resolution
3. `src/core/research-queue.ts:181-185` - Fix promise error handling
4. `tests/unit/core/research-queue.test.ts` - Fix failing test

### Medium Priority Files (Code Quality)
1. `src/index.ts:138-169` - Replace console.log with logger
2. Multiple files with nullable boolean warnings (100+ occurrences)

---

## Fix Priority Hierarchy

### Priority 1: CRITICAL (Application Non-Functional)
1. Link Groundswell dependency via npm link
2. Verify all imports resolve
3. Ensure TypeScript compilation passes

### Priority 2: MAJOR (Test Infrastructure Broken)
4. Add memory limits to test scripts
5. Fix module resolution in vitest.config.ts
6. Fix research-queue promise error handling
7. Fix failing research-queue test

### Priority 3: MODERATE (Code Quality)
8. Replace console.log with logger in src/index.ts
9. Fix nullable boolean check warnings (20+ high priority)

### Priority 4: LOW (Nice to Have)
10. Fix remaining nullable boolean warnings (80+ low priority)
11. Add test cleanup utilities
12. Improve test documentation

---

## Integration Points

### External Systems
- **File System**: PRD reading, task JSON writing
- **Git Repository**: Working directory operations
- **Node.js Runtime**: Process execution, memory management

### Internal Systems
- **Logger**: All components use structured logging
- **Error Handler**: Centralized error utilities
- **Resource Monitor**: File handle and memory tracking
- **Research Queue**: Background task processing

---

## Development Workflow

**Current State**: Blocked - Cannot run any commands

**Required Workflow**:
1. Fix Groundswell dependency
2. Verify TypeScript compilation: `npm run typecheck`
3. Run tests: `npm run test:run`
4. Validate linting: `npm run lint`
5. Development: `npm run dev -- --prd PRD.md --validate-prd`

**Success Criteria**:
- ✅ All TypeScript files compile without errors
- ✅ All 1688 tests pass (100%)
- ✅ No ESLint errors (warnings acceptable)
- ✅ Application can run PRD validation
- ✅ PRP pipeline generates task breakdowns

---

## Architecture Documentation References

**Design Documents**:
- `plan/001_14b9dc2a33c7/architecture/environment_config.md`
- `plan/001_14b9dc2a33c7/architecture/groundswell_integration.md`

**PRD Reference**: Section 9 - "Technical Stack & Dependencies"

**Test Coverage**: See individual test files for detailed test scenarios
