# Research Summary: Testing Strategy Documentation

## Overview
This research document summarizes findings for creating the TESTING.md guide as part of work item P2.M2.T3.S1.

## Key Findings from Codebase Analysis

### 1. Test Structure (from Explore Agent)
- Total test files: 137 test files
- Unit tests: 58 files in `tests/unit/`
- Integration tests: 65 files in `tests/integration/`
- E2E tests: 2 files in `tests/e2e/`
- Manual tests: 6 files in `tests/manual/`
- Validation tests: 1 file
- Test fixtures: 5 files

### 2. Vitest Configuration (from Explore Agent)
- **Framework**: Vitest with TypeScript
- **Configuration**: `/home/dustin/projects/hacky-hack/vitest.config.ts`
- **Setup file**: `/home/dustin/projects/hacky-hack/tests/setup.ts`
- **Coverage provider**: V8 with 100% threshold requirements
- **Environment**: Node.js
- **100% coverage required** for: statements, branches, functions, lines

### 3. Testing Patterns (from Explore Agent - Test Examples)

#### Unit Test Pattern
**File**: `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`
- Environment variable mocking with `vi.stubEnv()`
- Validation testing with try/catch for expected errors
- Cleanup pattern with `afterEach()`

#### Integration Test Pattern
**File**: `/home/dustin/projects/hacky-hack/tests/integration/architect-agent.test.ts`
- Full agent workflow testing
- Agent factory mocking
- Schema validation with Zod
- Mock vs real LLM switching with `USE_REAL_LLM` flag

#### E2E Test Pattern
**File**: `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts`
- Complete pipeline workflow testing
- Module-level mocking with hoisting
- Temporary directory management
- ChildProcess mocking with async behavior

### 4. Mocking Strategies (from Explore Agent)

#### Module-level Mocking (hoisting pattern)
```typescript
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});
```

#### Environment Variable Mocking
```typescript
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
});
```

#### External Service Mocking
- **Git Operations**: Mock `simple-git` with mock instance
- **File System**: Mock `fs/promises` and `node:fs`
- **Child Process**: Mock `spawn` for Bash operations
- **LLM Agents**: Mock Groundswell `createAgent` and `createPrompt`

### 5. Documentation Style (from Read)

**Header Pattern** (from docs/ARCHITECTURE.md, docs/CUSTOM_AGENTS.md):
```markdown
# Document Title

> Brief description

**Status**: Published
**Last Updated**: YYYY-MM-DD
**Version**: 1.0.0

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
...
```

**See Also Section Pattern**:
```markdown
## See Also

### Project Documentation
- **[LINK](path)** - Description

### Source Code
- **[path/to/file](path/to/file)** - Description

### External Resources
- [Resource Name](URL) - Description
```

### 6. Test Setup File (from System Context)
**File**: `/home/dustin/projects/hacky-hack/tests/setup.ts`
- Environment variable loading (dotenv)
- z.ai API endpoint validation (blocks Anthropic API)
- Promise rejection tracking
- Mock cleanup between tests
- Memory management with garbage collection

### 7. Test Scripts (from Package.json)
- `npm test`: `vitest` - Run tests in watch mode
- `npm run test:run`: `vitest run` - Run tests once
- `npm run test:coverage`: `vitest run --coverage` - Run with coverage
- `npm run test:bail`: `vitest run --bail=1` - Stop on first failure

## Documentation Requirements

Based on the contract definition in the work item:
1. Testing philosophy (100% coverage, TDD)
2. Test structure and organization
3. Unit vs integration vs e2e tests
4. Mocking strategies (agents, file system, git)
5. Running tests and coverage reports
6. Test writing guidelines and examples

## File Paths to Reference

### Configuration
- `/home/dustin/projects/hacky-hack/vitest.config.ts` - Vitest configuration
- `/home/dustin/projects/hacky-hack/tests/setup.ts` - Global test setup

### Test Examples
- `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts` - Unit test example
- `/home/dustin/projects/hacky-hack/tests/integration/architect-agent.test.ts` - Integration test example
- `/home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts` - E2E test example

### Mocking Examples
- `/home/dustin/projects/hacky-hack/tests/unit/tools/bash-mcp.test.ts` - Bash MCP mocking
- `/home/dustin/projects/hacky-hack/tests/unit/tools/git-mcp.test.ts` - Git MCP mocking
- `/home/dustin/projects/hacky-hack/tests/unit/tools/filesystem-mcp.test.ts` - Filesystem mocking

### Fixtures
- `/home/dustin/projects/hacky-hack/tests/fixtures/simple-prd.ts` - Test fixture example

### Documentation Style References
- `/home/dustin/projects/hacky-hack/docs/ARCHITECTURE.md` - Documentation structure
- `/home/dustin/projects/hacky-hack/docs/CUSTOM_AGENTS.md` - Documentation style

## Parallel Work Considerations

From P2.M2.T2.S3 (Create Custom Workflow Development Guide):
- CUSTOM_WORKFLOWS.md is being created in parallel
- Focus TESTING.md on testing patterns, not workflow development
- Reference CUSTOM_AGENTS.md for agent testing patterns

## External Resources (to be verified)

The research agents noted that web search tools have reached monthly limits and will reset February 1, 2026. URLs should be verified after that date.

Expected resources:
- Vitest Documentation: https://vitest.dev
- TDD Best Practices: Martin Fowler, Kent Beck resources
- Testing Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
