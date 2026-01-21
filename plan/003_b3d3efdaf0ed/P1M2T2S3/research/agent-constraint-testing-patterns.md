# Agent Constraint Enforcement and Forbidden Operations Testing Patterns

**Research Date:** 2026-01-21
**Purpose:** Comprehensive research on testing patterns for agent constraint enforcement, forbidden operations blocking, and MCP tool access control
**Focus Areas:** Agent constraint testing, MCP tool guards, mock agent tool invocation testing, forbidden operations enforcement

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Agent Constraint Testing Patterns](#agent-constraint-testing-patterns)
3. [MCP Tool Access Control Testing](#mcp-tool-access-control-testing)
4. [Mock Agent Tool Invocation Testing](#mock-agent-tool-invocation-testing)
5. [Forbidden Operations Enforcement Testing](#forbidden-operations-enforcement-testing)
6. [Best Practices and Common Patterns](#best-practices-and-common-patterns)
7. [Pitfalls to Avoid](#pitfalls-to-avoid)
8. [External Resources and References](#external-resources-and-references)

---

## Executive Summary

This research document compiles comprehensive testing patterns for enforcing constraints on AI agents, specifically focusing on:

1. **Preventing agents from performing forbidden operations** (modifying protected files, executing dangerous commands)
2. **Testing MCP tools with access guards and constraints**
3. **Mocking and verifying agent tool calls with constraint validation**
4. **Ensuring operations are blocked when they should be**

The patterns are drawn from:

- Existing implementation in `/home/dustin/projects/hacky-hack` (protected files, git commit filtering, nested execution guards)
- Industry best practices for testing AI agent constraints
- Common testing patterns for forbidden operations enforcement

**Key Finding:** Testing constraints requires a dual approach - testing that allowed operations succeed AND testing that forbidden operations are blocked with clear error messages.

---

## Agent Constraint Testing Patterns

### Pattern 1: Protected File Filtering Testing

**Concept:** Agents should be prevented from committing, modifying, or deleting protected files.

**Implementation Example:** `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts`

```typescript
describe('protected file enforcement', () => {
  // Define complete protected files specification
  const ALL_PROTECTED_FILES = [
    'tasks.json',
    'PRD.md',
    'prd_snapshot.md',
    'delta_prd.md',
    'delta_from.txt',
    'TEST_RESULTS.md',
  ] as const;

  describe('git commit protection', () => {
    it('should filter tasks.json from commits', () => {
      // SETUP
      const files = ['src/index.ts', 'tasks.json', 'src/utils.ts'];

      // EXECUTE
      const result = filterProtectedFiles(files);

      // VERIFY
      expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
      expect(result).not.toContain('tasks.json');
    });

    it('should filter all protected files from commits', async () => {
      // SETUP
      mockGitStatus.mockResolvedValue({
        success: true,
        modified: ['src/index.ts'],
        untracked: [
          'tasks.json',
          'PRD.md',
          'prd_snapshot.md',
          'delta_prd.md',
          'delta_from.txt',
          'TEST_RESULTS.md',
          'src/utils.ts',
        ],
      });

      // EXECUTE
      const result = await smartCommit('/project', 'Test commit');

      // VERIFY - only non-protected files should be staged
      expect(mockGitAdd).toHaveBeenCalledWith({
        path: '/project',
        files: ['src/index.ts', 'src/utils.ts'],
      });
    });
  });
});
```

**Best Practices:**

- Define protected files as a constant array for easy maintenance
- Test both positive (files are filtered) and negative (non-protected files pass) cases
- Use `.not.toContain()` for verification that items are excluded
- Test with file paths, not just basenames

---

### Pattern 2: Wildcard Pattern Matching for Protected Files

**Concept:** Some protected files use wildcard patterns (e.g., `*tasks*.json`).

```typescript
describe('wildcard pattern matching', () => {
  function isProtectedByWildcard(filePath: string): boolean {
    const fileName = basename(filePath);
    return /\btasks.*\.json$/.test(fileName);
  }

  it('should match tasks.json', () => {
    expect(isProtectedByWildcard('tasks.json')).toBe(true);
  });

  it('should match backup-tasks.json', () => {
    expect(isProtectedByWildcard('backup-tasks.json')).toBe(true);
  });

  it('should match tasks.backup.json', () => {
    expect(isProtectedByWildcard('tasks.backup.json')).toBe(true);
  });

  it('should not match task.json (singular)', () => {
    expect(isProtectedByWildcard('task.json')).toBe(false);
  });

  it('should not match mytasks.json (no word boundary)', () => {
    expect(isProtectedByWildcard('mytasks.json')).toBe(false);
  });
});
```

**Regex Pattern Explanation:**

- `/\btasks.*\.json$/`
- `\b` - word boundary (ensures "tasks" starts a word)
- `tasks` - literal match
- `.*` - any characters (zero or more)
- `\.json$` - ends with ".json"

---

### Pattern 3: Filesystem Operation Blocking

**Concept:** Prevent agents from deleting or moving protected files.

```typescript
describe('filesystem delete protection', () => {
  async function safeDelete(filePath: string): Promise<void> {
    const fileName = basename(filePath);
    if (ALL_PROTECTED_FILES.includes(fileName as any)) {
      throw new Error(`Cannot delete protected file: ${fileName}`);
    }
    return Promise.resolve();
  }

  it('should throw error when deleting tasks.json', async () => {
    await expect(safeDelete('tasks.json')).rejects.toThrow(
      'Cannot delete protected file: tasks.json'
    );
  });

  it('should allow deleting non-protected files', async () => {
    await expect(safeDelete('src/index.ts')).resolves.not.toThrow();
  });
});

describe('filesystem move protection', () => {
  async function safeMove(oldPath: string, _newPath: string): Promise<void> {
    const oldBasename = basename(oldPath);
    if (ALL_PROTECTED_FILES.includes(oldBasename as any)) {
      throw new Error(`Cannot move protected file: ${oldBasename}`);
    }
    return Promise.resolve();
  }

  it('should throw error when moving PRD.md', async () => {
    await expect(safeMove('PRD.md', 'docs/PRD.md')).rejects.toThrow(
      'Cannot move protected file: PRD.md'
    );
  });
});
```

---

### Pattern 4: Agent Write Protection

**Concept:** Prevent agents from writing to protected files.

```typescript
describe('agent write protection', () => {
  async function safeWrite(filePath: string, _content: string): Promise<void> {
    const fileName = basename(filePath);
    if (ALL_PROTECTED_FILES.includes(fileName as any)) {
      throw new Error(`Cannot modify protected file: ${fileName}`);
    }
    return Promise.resolve(undefined);
  }

  it('should prevent agents from writing to PRD.md', async () => {
    await expect(safeWrite('PRD.md', 'new content')).rejects.toThrow(
      'Cannot modify protected file: PRD.md'
    );
  });

  it('should prevent agents from writing to tasks.json', async () => {
    await expect(safeWrite('tasks.json', '{"tasks": []}')).rejects.toThrow(
      'Cannot modify protected file: tasks.json'
    );
  });

  it('should allow agents to write to non-protected files', async () => {
    await expect(safeWrite('src/index.ts', 'code here')).resolves.not.toThrow();
  });
});
```

---

### Pattern 5: Nested Execution Guard Testing

**Concept:** Prevent recursive agent execution while allowing legitimate bug fix recursion.

**Implementation Example:** `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts`

```typescript
describe('Nested Execution Guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL: Always restore environment
  });

  describe('Basic Guard Functionality', () => {
    it('should block execution when PRP_PIPELINE_RUNNING is already set', () => {
      // SETUP
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');

      // EXECUTE & VERIFY
      expect(() => validateNestedExecutionGuard({ logger })).toThrow(
        'Pipeline already running'
      );
    });

    it('should set PRP_PIPELINE_RUNNING to current PID on valid entry', () => {
      // SETUP
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE
      validateNestedExecutionGuard({ logger });

      // VERIFY
      expect(process.env.PRP_PIPELINE_RUNNING).toBe(process.pid.toString());
    });
  });

  describe('Bug Fix Recursion Exception', () => {
    it('should allow recursion when SKIP_BUG_FINDING=true AND path contains bugfix', () => {
      // SETUP
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE
      expect(() =>
        validateNestedExecutionGuard({
          logger,
          planDir: process.env.PLAN_DIR,
        })
      ).not.toThrow();
    });

    it('should block recursion when SKIP_BUG_FINDING=true BUT path does NOT contain bugfix', () => {
      // SETUP
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed');

      // EXECUTE & VERIFY
      expect(() =>
        validateNestedExecutionGuard({
          logger,
          planDir: process.env.PLAN_DIR,
        })
      ).toThrow('Pipeline already running');
    });
  });
});
```

**Key Testing Principles:**

- Always clean up environment variables with `vi.unstubAllEnvs()` in `afterEach`
- Test exact string matching (SKIP_BUG_FINDING must be exactly 'true', not 'TRUE' or '1')
- Test case-insensitive path matching for 'bugfix'
- Verify both blocking and allowing conditions

---

## MCP Tool Access Control Testing

### Pattern 6: Tool Schema Validation with Constraints

**Concept:** Test that tool schemas enforce required constraints.

```typescript
describe('MCP tool schema validation', () => {
  describe('gitTool schema', () => {
    it('should require path property in input schema', () => {
      expect(gitStatusTool.input_schema.required).toContain('path');
    });

    it('should have path property defined with constraints', () => {
      expect(gitStatusTool.input_schema.properties.path).toEqual({
        type: 'string',
        description:
          'Path to git repository (optional, defaults to current directory)',
      });
    });
  });

  describe('fileTool schema with security constraints', () => {
    it('should validate repository path exists before operations', async () => {
      // SETUP
      mockExistsSync.mockReturnValue(false);
      const input: GitStatusInput = { path: '/malicious/../etc/passwd' };

      // EXECUTE
      const result = await gitStatus(input);

      // VERIFY
      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository path not found');
    });

    it('should use -- separator when staging files (flag injection prevention)', async () => {
      // SETUP
      mockGitInstance.add.mockResolvedValue(undefined);
      const input: GitAddInput = { files: ['file.txt'] };

      // EXECUTE
      await gitAdd(input);

      // VERIFY - -- separator should always be used
      expect(mockGitInstance.add).toHaveBeenCalledWith(['--', 'file.txt']);
    });
  });
});
```

---

### Pattern 7: Tool Executor Registration with Guards

**Concept:** Test that tool executors enforce access control.

```typescript
describe('MCP tool access control', () => {
  it('should register tool executor with input validation', async () => {
    // SETUP
    const agent = gs.createAgent() as Agent;
    const handler = agent.getMcpHandler();

    handler.registerServer({
      name: 'restricted',
      transport: 'inprocess',
      tools: [createMockTool('restricted_op', 'Restricted operation')],
    });

    let receivedInput: unknown;
    const executor = (async (input: unknown) => {
      receivedInput = input;

      // Guard: Check for forbidden operations
      if ((input as any).operation === 'forbidden') {
        throw new Error('Forbidden operation');
      }

      return { success: true, result: input };
    }) as ToolExecutor;

    handler.registerToolExecutor('restricted', 'restricted_op', executor);

    // EXECUTE - Try forbidden operation
    const result = await handler.executeTool('restricted__restricted_op', {
      operation: 'forbidden',
    });

    // VERIFY
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('Forbidden operation');
  });
});
```

---

### Pattern 8: Multiple MCP Servers with Different Access Levels

```typescript
describe('multi-server access control', () => {
  it('should register tools from multiple servers with different constraints', async () => {
    // SETUP
    const publicServer: MCPServer = {
      name: 'public',
      transport: 'inprocess',
      tools: [createMockTool('read', 'Public read operation')],
    };

    const adminServer: MCPServer = {
      name: 'admin',
      transport: 'inprocess',
      tools: [createMockTool('delete', 'Admin delete operation')],
    };

    // EXECUTE
    const agent = gs.createAgent({
      mcps: [publicServer, adminServer],
    }) as Agent;

    // VERIFY
    const handler = agent.getMcpHandler();
    const tools = handler.getTools();
    expect(tools).toHaveLength(2);

    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('public__read');
    expect(toolNames).toContain('admin__delete');
  });
});
```

---

## Mock Agent Tool Invocation Testing

### Pattern 9: Mock Tool with Constraint Validation

**Concept:** Mock agent tools to test constraint enforcement.

```typescript
describe('mock agent tool with constraints', () => {
  let agent: Agent;

  beforeEach(() => {
    // SETUP
    agent = gs.createAgent() as Agent;

    // Mock tool with constraint checking
    agent.tool = vi.fn().mockImplementation(params => {
      // Guard: Check for protected files
      if (params.path === 'tasks.json') {
        return Promise.resolve({
          success: false,
          error: 'Cannot modify protected file: tasks.json',
        });
      }

      // Guard: Check for forbidden operations
      if (params.operation === 'delete_all') {
        return Promise.resolve({
          success: false,
          error: 'Forbidden operation: delete_all',
        });
      }

      // Allow normal operations
      return Promise.resolve({ success: true, result: 'executed' });
    });
  });

  it('should block access to protected files', async () => {
    // EXECUTE
    const result = await agent.tool({ path: 'tasks.json' });

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot modify protected file');
  });

  it('should block forbidden operations', async () => {
    // EXECUTE
    const result = await agent.tool({ operation: 'delete_all' });

    // VERIFY
    expect(result.success).toBe(false);
    expect(result.error).toContain('Forbidden operation');
  });

  it('should allow normal operations', async () => {
    // EXECUTE
    const result = await agent.tool({ path: 'src/index.ts' });

    // VERIFY
    expect(result.success).toBe(true);
    expect(result).toEqual({ success: true, result: 'executed' });
  });
});
```

---

### Pattern 10: Spy-based Tool Call Verification

**Concept:** Use spies to verify tool calls with constraints.

```typescript
describe('spy-based tool call verification', () => {
  it('should verify tool was called with constrained parameters', async () => {
    // SETUP
    const spy = vi.spyOn(agent, 'tool');
    spy.mockResolvedValue({ success: true });

    // EXECUTE
    await agent.tool({ path: 'allowed.txt' });

    // VERIFY
    expect(spy).toHaveBeenCalledWith({ path: 'allowed.txt' });
    expect(spy).not.toHaveBeenCalledWith({ path: 'tasks.json' });
  });

  it('should verify tool was not called with forbidden parameters', async () => {
    // SETUP
    const spy = vi.spyOn(agent, 'tool');
    spy.mockImplementation(params => {
      if (params.forbidden) {
        throw new Error('Forbidden');
      }
      return Promise.resolve({ success: true });
    });

    // EXECUTE & VERIFY
    await expect(agent.tool({ forbidden: true })).rejects.toThrow('Forbidden');

    expect(spy).toHaveBeenCalledWith({ forbidden: true });
  });
});
```

---

### Pattern 11: Mock Module with Constraint Implementation

```typescript
describe('mock module with constraints', () => {
  // Mock at module level
  vi.mock('./file-operations.js', () => ({
    writeFile: vi.fn((path: string) => {
      // Constraint: Protected files
      const PROTECTED = ['tasks.json', 'PRD.md'];
      if (PROTECTED.includes(basename(path))) {
        return Promise.reject(new Error(`Protected: ${path}`));
      }
      return Promise.resolve({ success: true });
    }),
  }));

  it('should enforce constraints in mocked module', async () => {
    // EXECUTE
    const result1 = await writeFile('src/index.ts', 'content');
    const result2 = writeFile('tasks.json', 'content');

    // VERIFY
    await expect(result1).resolves.toEqual({ success: true });
    await expect(result2).rejects.toThrow('Protected: tasks.json');
  });
});
```

---

## Forbidden Operations Enforcement Testing

### Pattern 12: Verify Operations Are NOT Called

**Concept:** Test that forbidden operations are never invoked.

```typescript
describe('verify operations NOT called', () => {
  it('should not call git add when only protected files changed', async () => {
    // SETUP
    mockGitStatus.mockResolvedValue({
      success: true,
      modified: ['tasks.json'],
      untracked: ['PRD.md'],
    });

    // EXECUTE
    const result = await smartCommit('/project', 'Test commit');

    // VERIFY
    expect(result).toBeNull();
    expect(mockGitAdd).not.toHaveBeenCalled();
    expect(mockGitCommit).not.toHaveBeenCalled();
  });

  it('should not call file operations when verification fails', async () => {
    // SETUP
    const failedVerification = {
      resolved: false,
      remainingCount: 5,
      message: 'Module resolution failed',
    };

    // EXECUTE
    const result = await documentBuildSuccess(failedVerification);

    // VERIFY - No file operations should have been attempted
    expect(result.logged).toBe(false);
    expect(mockAccess).not.toHaveBeenCalled();
    expect(mockReadFile).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
```

---

### Pattern 13: Gitignore Pattern Validation

**Concept:** Prevent agents from adding forbidden patterns to .gitignore.

```typescript
describe('.gitignore validation', () => {
  const FORBIDDEN_PATTERNS = ['plan/', 'PRD.md', 'tasks.json', '*tasks*.json'];

  function validateGitignore(content: string): {
    valid: boolean;
    error?: string;
  } {
    const lines = content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    for (const line of lines) {
      if (FORBIDDEN_PATTERNS.some(pattern => line.includes(pattern))) {
        return {
          valid: false,
          error: `Forbidden pattern in .gitignore: ${line}`,
        };
      }
    }

    return { valid: true };
  }

  it('should detect when plan/ is added to .gitignore', () => {
    // SETUP
    const gitignoreContent = 'node_modules/\nplan/\ndist/';

    // EXECUTE
    const result = validateGitignore(gitignoreContent);

    // VERIFY
    expect(result.valid).toBe(false);
    expect(result.error).toContain('plan/');
  });

  it('should detect when *tasks*.json pattern is added', () => {
    // SETUP
    const gitignoreContent = 'node_modules/\n*tasks*.json\n*.log';

    // EXECUTE
    const result = validateGitignore(gitignoreContent);

    // VERIFY
    expect(result.valid).toBe(false);
    expect(result.error).toContain('*tasks*.json');
  });

  it('should allow valid .gitignore entries', () => {
    // SETUP
    const gitignoreContent = 'node_modules/\ndist/\n*.log\n.env';

    // EXECUTE
    const result = validateGitignore(gitignoreContent);

    // VERIFY
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
```

---

### Pattern 14: Error Message Verification

**Concept:** Test that blocked operations return clear error messages.

```typescript
describe('error message verification', () => {
  it('should include file name in protected file error', async () => {
    // EXECUTE & VERIFY
    await expect(safeDelete('tasks.json')).rejects.toThrow(
      'Cannot delete protected file: tasks.json'
    );
  });

  it('should include operation type in error', async () => {
    // EXECUTE & VERIFY
    await expect(agent.tool({ operation: 'forbidden' })).rejects.toThrow(
      'Forbidden operation: forbidden'
    );
  });

  it('should include existing PID in nested execution error', () => {
    // SETUP
    vi.stubEnv('PRP_PIPELINE_RUNNING', '98765');

    // EXECUTE & VERIFY
    expect(() => validateNestedExecutionGuard({ logger })).toThrow(
      /PID: 98765/
    );
  });
});
```

---

## Best Practices and Common Patterns

### Practice 1: Dual Testing Approach

Test BOTH that allowed operations succeed AND forbidden operations fail.

```typescript
describe('comprehensive constraint testing', () => {
  describe('allowed operations', () => {
    it('should allow reading non-protected files');
    it('should allow writing to non-protected files');
    it('should allow committing non-protected changes');
  });

  describe('forbidden operations', () => {
    it('should block reading protected files');
    it('should block writing to protected files');
    it('should block committing protected files');
  });
});
```

---

### Practice 2: Use Descriptive Test Names

```typescript
// ✅ GOOD
it('should throw error when deleting tasks.json');
it('should filter tasks.json from git commits');
it('should prevent agents from writing to PRD.md');

// ❌ BAD
it('should block');
it('should filter');
it('should prevent');
```

---

### Practice 3: Test Path Normalization

```typescript
describe('path handling', () => {
  it('should use basename for path comparison', () => {
    expect(isProtectedFile('path/to/tasks.json')).toBe(true);
    expect(isProtectedFile('./PRD.md')).toBe(true);
    expect(isProtectedFile('/absolute/path/prd_snapshot.md')).toBe(true);
  });

  it('should handle Windows-style paths', () => {
    // Normalize backslashes to forward slashes
    expect(isProtectedFile('C:\\project\\tasks.json')).toBe(true);
    expect(isProtectedFile('C:/project/tasks.json')).toBe(true);
  });
});
```

---

### Practice 4: Test Edge Cases

```typescript
describe('edge cases', () => {
  it('should handle paths with special characters');
  it('should handle case-sensitive matching');
  it('should handle empty string in basename');
  it('should handle paths with trailing slashes');
  it('should handle concurrent validation calls');
});
```

---

### Practice 5: Mock Cleanup

```typescript
describe('mock cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.info.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL for environment tests
    vi.clearAllMocks();
  });
});
```

---

### Practice 6: Test Helper Functions

Create reusable test helpers for common constraint checks.

```typescript
// Helper functions
function isProtectedFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = basename(normalizedPath);
  return (
    ALL_PROTECTED_FILES.includes(fileName as any) ||
    isProtectedByWildcard(normalizedPath)
  );
}

async function expectProtectedFileError(
  operation: () => Promise<void>,
  fileName: string
): Promise<void> {
  await expect(operation).rejects.toThrow(
    `Cannot modify protected file: ${fileName}`
  );
}

// Usage
it('should block writing to PRD.md', async () => {
  await expectProtectedFileError(
    () => safeWrite('PRD.md', 'content'),
    'PRD.md'
  );
});
```

---

## Pitfalls to Avoid

### Pitfall 1: Only Testing Success Paths

**Bad:**

```typescript
// ❌ Only tests that operations succeed
it('should write file', async () => {
  const result = await writeFile('src/index.ts', 'content');
  expect(result.success).toBe(true);
});
```

**Good:**

```typescript
// ✅ Tests both success and failure
describe('writeFile', () => {
  it('should succeed for non-protected files', async () => {
    const result = await writeFile('src/index.ts', 'content');
    expect(result.success).toBe(true);
  });

  it('should fail for protected files', async () => {
    const result = await writeFile('tasks.json', 'content');
    expect(result.success).toBe(false);
    expect(result.error).toContain('protected file');
  });
});
```

---

### Pitfall 2: Not Verifying Operations Were NOT Called

**Bad:**

```typescript
// ❌ Doesn't verify operation was blocked
it('should not commit protected files', async () => {
  const result = await smartCommit('/project', 'Test');
  expect(result).toBeNull();
});
```

**Good:**

```typescript
// ✅ Verifies operations were not called
it('should not commit protected files', async () => {
  mockGitStatus.mockResolvedValue({
    success: true,
    modified: ['tasks.json'],
  });

  const result = await smartCommit('/project', 'Test');

  expect(result).toBeNull();
  expect(mockGitAdd).not.toHaveBeenCalled(); // Critical verification
  expect(mockGitCommit).not.toHaveBeenCalled();
});
```

---

### Pitfall 3: Forgetting Environment Cleanup

**Bad:**

```typescript
// ❌ No cleanup - environment leaks between tests
describe('tests', () => {
  it('test 1', () => {
    vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  });

  it('test 2', () => {
    // This test has PRP_PIPELINE_RUNNING set from test 1!
  });
});
```

**Good:**

```typescript
// ✅ Proper cleanup
describe('tests', () => {
  afterEach(() => {
    vi.unstubAllEnvs(); // Always restore environment
  });

  it('test 1', () => {
    vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
  });

  it('test 2', () => {
    // Clean environment - no leaks
  });
});
```

---

### Pitfall 4: Testing Implementation Details

**Bad:**

```typescript
// ❌ Tests internal implementation
it('should call filterProtectedFiles with array', () => {
  expect(filterProtectedFiles).toHaveBeenCalledWith(['file.txt']);
});
```

**Good:**

```typescript
// ✅ Tests behavior
it('should remove protected files from commit', async () => {
  const result = await smartCommit('/project', 'Test');
  expect(mockGitAdd).toHaveBeenCalledWith({
    files: ['src/index.ts'], // No protected files
  });
});
```

---

### Pitfall 5: Not Testing Wildcard Patterns

**Bad:**

```typescript
// ❌ Only tests exact matches
it('should protect tasks.json', () => {
  expect(isProtected('tasks.json')).toBe(true);
});
```

**Good:**

```typescript
// ✅ Tests wildcard patterns
describe('wildcard protection', () => {
  it('should protect tasks.json');
  it('should protect backup-tasks.json');
  it('should protect tasks-v2.json');
  it('should not protect task.json (singular)');
  it('should not protect mytasks.json (no boundary)');
});
```

---

## External Resources and References

### GitHub Repositories

1. **Model Context Protocol (MCP)**
   - URL: https://github.com/modelcontextprotocol
   - TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
   - Official Servers: https://github.com/modelcontextprotocol/servers
   - **Relevant Sections:** Tool schema validation, access control patterns

2. **Groundswell AI Agent Framework**
   - URL: https://github.com/groundswell-ai/groundswell
   - **Relevant Sections:** Agent tool constraints, MCPHandler integration

3. **Vitest Testing Framework**
   - URL: https://github.com/vitest-dev/vitest
   - Documentation: https://vitest.dev/guide/
   - **Relevant Sections:** Mocking API, `vi.mock()`, `vi.hoisted()`

---

### Stack Overflow Discussion Topics

**Note:** Web search was unavailable due to rate limits. Key topics to search:

1. "Testing AI agent forbidden operations"
2. "Mock agent tool calls with constraints"
3. "Verify function not called Vitest"
4. "Test file access control TypeScript"
5. "MCP tool access control testing"

---

### Blog Posts and Documentation

1. **Anthropic Tool Use Documentation**
   - URL: https://docs.anthropic.com/claude/docs/tool-use
   - **Relevant Sections:** Tool constraint enforcement, error handling

2. **Model Context Protocol Specification**
   - URL: https://spec.modelcontextprotocol.io/specification/
   - Tools Guide: https://spec.modelcontextprotocol.io/specification/tools/
   - **Relevant Sections:** Tool input schema validation, required fields

3. **Testing Best Practices**
   - "Testing Forbidden Operations" - General patterns
   - "Mock Verification Patterns" - Spy and mock verification
   - "Access Control Testing" - Permission testing patterns

---

### Documentation from Existing Codebase

**Protected Files Specification:**

- File: `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/system_context.md`
- Sections: Protected files list, wildcard patterns, forbidden .gitignore entries

**Git Commit Implementation:**

- File: `/home/dustin/projects/hacky-hack/src/utils/git-commit.ts`
- Functions: `filterProtectedFiles()`, `smartCommit()`, `formatCommitMessage()`

**Test Files with Constraint Testing:**

- `/home/dustin/projects/hacky-hack/tests/unit/protected-files.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts`
- `/home/dustin/projects/hacky-hack/tests/integration/smart-commit.test.ts`
- `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts`

**MCP Testing Research:**

- `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P1M2T2S1/research/mcp-testing-best-practices.md`
- `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P1M2T2S1/research/agent-tool-testing-patterns.md`

**Mocking Patterns Research:**

- `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P1M2T1S4/research/mocking-patterns-research.md`

---

## Conclusion

Testing agent constraint enforcement and forbidden operations requires:

1. **Comprehensive Coverage:** Test both allowed and forbidden operations
2. **Clear Verification:** Use `.not.toHaveBeenCalled()` and `.not.toContain()` for negative assertions
3. **Mock Management:** Proper setup and teardown of mocks and environment variables
4. **Edge Case Testing:** Test path normalization, wildcards, and special cases
5. **Error Message Validation:** Verify blocked operations return clear error messages

**Key Takeaway:** The most reliable pattern is testing the **behavior** (operations are blocked) rather than **implementation** (how they are blocked). This ensures tests remain robust as implementation details change.

---

**End of Research Document**

**Last Updated:** 2026-01-21
**Researcher:** Claude Code Agent
**For:** P1M2T2S3 - Agent Constraint Enforcement and Forbidden Operations Testing
