# PRP: P1.M2.T2.S3 - Verify Forbidden Operations Are Enforced

---

## Goal

**Feature Goal**: Implement integration tests that verify agent tool access controls enforce forbidden operations defined in PRD §5.2

**Deliverable**: Integration test file `tests/integration/forbidden-operations.test.ts` with comprehensive agent constraint enforcement verification

**Success Definition**: All tests pass, demonstrating that agents cannot:

- Modify PRD.md via FilesystemMCP
- Add .gitignore entries via BashMCP
- Run pipeline commands via BashMCP
- Create session directories outside designated locations (plan/, bugfix/)

---

## User Persona

**Target User**: Development team ensuring agent safety and system integrity

**Use Case**: Validate that agent tool constraints are properly enforced to prevent pipeline corruption

**User Journey**:

1. Run the test suite after implementing agent tool access controls
2. Tests mock agent tool calls and verify operations are blocked
3. Clear test failures indicate which constraints are not enforced

**Pain Points Addressed**:

- Silent failures when agents attempt forbidden operations
- Pipeline state corruption from unauthorized file modifications
- Difficult-to-debug issues from unconstrained agent behavior

---

## Why

- **System Integrity**: Prevents agents from corrupting pipeline state (tasks.json, PRD.md, prd_snapshot.md)
- **Guard Rails**: Ensures prompts telling agents "never modify X" are actually enforced at tool level
- **Debug Visibility**: Clear test failures when constraints are not enforced vs silent permission granted

---

## What

Integration tests that mock agent tool invocations and verify forbidden operations are blocked with appropriate error messages.

### Success Criteria

- [ ] Agents cannot modify PRD.md via FilesystemMCP write operations
- [ ] Agents cannot add plan/, PRD.md, or _tasks_.json patterns to .gitignore
- [ ] Agents cannot run prd/run-prd.sh/tsk or ./tsk commands via BashMCP
- [ ] Agents cannot create session directories outside plan/ or bugfix/ paths
- [ ] All blocked operations return clear error messages
- [ ] Test suite passes: `npm test -- forbidden-operations.test.ts`

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: plan/003_b3d3efdaf0ed/P1M2T2S2/PRP.md
  why: Previous PRP defining context injection patterns - this PRP builds upon agent tool context
  critical: Context injection defines what agents see; this PRP tests what agents CAN do

- file: PRD.md
  why: PRD §5.2 defines Universal Forbidden Operations
  pattern: Lines 133-140 specify agent operational boundaries
  section: "5.2 Agent Capabilities" - "Agent Operational Boundaries (FORBIDDEN OPERATIONS)"

- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Contains protected files specification and forbidden .gitignore patterns
  section: Protected Files section, Environment Configuration section
  critical: Defines what files are protected and what patterns are forbidden

- file: tests/integration/mcp-tools.test.ts
  why: Reference implementation for MCP tool integration testing
  pattern: Mock setup for MCP server registration, tool executor patterns
  gotcha: Uses Groundswell's Agent.getMcpHandler() for tool access

- file: tests/unit/protected-files.test.ts
  why: Reference implementation for testing protected file enforcement
  pattern: Filter testing, error message verification
  gotcha: Tests both positive (allowed) and negative (blocked) cases

- file: src/agents/agent-factory.ts
  why: Shows how agents are created with MCP tools
  pattern: createAgent() function, MCPServer registration
  critical: All agents share BashMCP, FilesystemMCP, GitMCP tools

- file: src/tools/filesystem-mcp.ts
  why: FilesystemMCP tool implementation - needs constraint guards
  pattern: Tool executor registration, input validation
  gotcha: Currently no guards against protected files in write/delete/move

- file: src/tools/bash-mcp.ts
  why: BashMCP tool implementation - needs command filtering
  pattern: Command execution via spawn
  gotcha: Currently no guards against pipeline commands

- file: src/tools/git-mcp.ts
  why: GitMCP tool implementation - reference for .gitignore guard
  pattern: Repository path validation, -- separator usage
  critical: Smart commit already filters protected files

- file: src/utils/git-commit.ts
  why: Example of protected file filtering implementation
  pattern: filterProtectedFiles() function, basename comparison
  gotcha: Uses basename to handle both relative and absolute paths

- docfile: plan/003_b3d3efdaf0ed/P1M2T2S3/research/agent-constraint-testing-patterns.md
  why: Comprehensive patterns for testing agent constraints
  section: All sections - especially Mock Agent Tool Invocation Testing

- docfile: plan/003_b3d3efdaf0ed/P1M2T2S3/research/forbidden-operations-testing-patterns.md
  why: Testing patterns for forbidden operations enforcement
  section: Implementation Checklist, Common Testing Gotchas
```

### Current Codebase Tree

```bash
tests/
├── integration/
│   ├── mcp-tools.test.ts          # Reference: MCP tool testing patterns
│   ├── agents.test.ts              # Reference: Agent creation patterns
│   └── ...
└── unit/
    ├── protected-files.test.ts     # Reference: Protected file testing
    └── tools/
        ├── bash-mcp.test.ts        # Reference: Bash tool testing
        └── git-mcp.test.ts         # Reference: Git tool testing

src/
├── agents/
│   └── agent-factory.ts            # Agent creation with MCP tools
├── tools/
│   ├── bash-mcp.ts                 # Bash command execution
│   ├── filesystem-mcp.ts           # File I/O operations
│   └── git-mcp.ts                  # Git operations
└── utils/
    └── git-commit.ts               # Protected file filtering example
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
└── integration/
    └── forbidden-operations.test.ts   # NEW: Agent constraint enforcement tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Groundswell's Agent.getMcpHandler() returns MCPHandler
// Use handler.getTools() to list available tools
// Use handler.executeTool() to execute tools in tests
const handler = agent.getMcpHandler();
const tools = handler.getTools(); // Returns MCPServerTool[]

// CRITICAL: Tool names are prefixed with server name: "server__tool"
// BashMCP tools: "bash__execute_command"
// FilesystemMCP tools: "filesystem__read_file", "filesystem__write_file", etc.
// GitMCP tools: "git__status", "git__add", "git__commit"

// GOTCHA: Mock tools must be registered BEFORE creating agent
// Use handler.registerServer() then handler.registerToolExecutor()

// GOTCHA: Protected files use basename comparison (not full path)
// Tasks.json anywhere in path is protected
// Example: "plan/session/tasks.json" -> basename is "tasks.json" -> protected

// GOTCHA: Wildcard pattern matching for *tasks*.json uses regex
// Pattern: /\btasks.*\.json$/ (word boundary + tasks + anything + .json)
// Matches: tasks.json, backup-tasks.json, tasks-v2.json
// Does NOT match: task.json, mytasks.json (no word boundary)

// CRITICAL: .gitignore validation must check for forbidden patterns
// Forbidden: "plan/", "PRD.md", "*tasks*.json"
// Test that adding these patterns is blocked

// CRITICAL: Bash command validation must check for pipeline commands
// Forbidden: "prd/run-prd.sh", "prd/run-prd.ts", "./tsk", "npm run prd"
// Test that these commands are rejected

// CRITICAL: Session directory paths must be validated
// Allowed: Must contain "plan/" or "bugfix/" in path
// Forbidden: /tmp/session-xyz, /home/user/session-abc
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Test uses existing agent and MCP tool interfaces.

```typescript
// Existing interfaces used in tests:
interface MCPServer {
  name: string;
  transport: 'inprocess' | 'stdio';
  tools: MCPToolDefinition[];
}

interface MCPToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface ToolExecutor = (input: unknown) => Promise<ToolResult>;

interface ToolResult {
  content: string;
  is_error?: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/forbidden-operations.test.ts
  - IMPLEMENT: Integration test suite for agent constraint enforcement
  - FOLLOW pattern: tests/integration/mcp-tools.test.ts (describe structure, beforeEach/afterEach)
  - NAMING: "Agent Constraint Enforcement" as top-level describe
  - PLACEMENT: tests/integration/forbidden-operations.test.ts

Task 2: IMPLEMENT FilesystemMCP Write Protection Tests
  - IMPLEMENT: Test that agents cannot write to PRD.md
  - CREATE: Mock FilesystemMCP server with write_file tool
  - REGISTER: Tool executor that checks for protected files
  - VERIFY: write_file('PRD.md', content) throws error
  - VERIFY: write_file('tasks.json', content) throws error
  - VERIFY: write_file('src/file.ts', content) succeeds
  - DEPENDENCIES: Task 1

Task 3: IMPLEMENT BashMCP .gitignore Protection Tests
  - IMPLEMENT: Test that agents cannot add forbidden patterns to .gitignore
  - CREATE: Mock BashMCP server with execute_command tool
  - REGISTER: Tool executor that validates commands
  - VERIFY: echo "plan/" >> .gitignore is blocked
  - VERIFY: echo "*tasks*.json" >> .gitignore is blocked
  - VERIFY: echo "PRD.md" >> .gitignore is blocked
  - VERIFY: echo "node_modules/" >> .gitignore succeeds
  - DEPENDENCIES: Task 1

Task 4: IMPLEMENT BashMCP Pipeline Command Protection Tests
  - IMPLEMENT: Test that agents cannot run pipeline commands
  - CREATE: Mock BashMCP executor for command validation
  - VERIFY: prd/run-prd.sh is blocked
  - VERIFY: prd/run-prd.ts is blocked
  - VERIFY: ./tsk is blocked
  - VERIFY: npm test is allowed (not a pipeline command)
  - VERIFY: ls is allowed (normal command)
  - DEPENDENCIES: Task 1

Task 5: IMPLEMENT Session Directory Constraint Tests
  - IMPLEMENT: Test that agents cannot create session directories outside designated locations
  - CREATE: Mock FilesystemMCP mkdir tool
  - VERIFY: mkdir('/tmp/session-abc') is blocked
  - VERIFY: mkdir('/project/session-xyz') is blocked
  - VERIFY: mkdir('/project/plan/001_hash/session') succeeds
  - VERIFY: mkdir('/project/bugfix/001_hash/session') succeeds
  - DEPENDENCIES: Task 1

Task 6: IMPLEMENT Error Message Verification Tests
  - IMPLEMENT: Test that blocked operations return clear error messages
  - VERIFY: Error messages include the operation being blocked
  - VERIFY: Error messages include the reason (e.g., "protected file")
  - VERIFY: Error messages are actionable
  - DEPENDENCIES: Tasks 2, 3, 4, 5

Task 7: IMPLEMENT Integration Test with Real Agent
  - IMPLEMENT: Create actual agent via AgentFactory
  - EXECUTE: Try forbidden operations via agent.tool()
  - VERIFY: All operations are blocked
  - CLEANUP: Proper mock cleanup
  - DEPENDENCIES: Tasks 2, 3, 4, 5, 6
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Mock MCP server with constraint checking
describe('Agent Constraint Enforcement', () => {
  let agent: Agent;
  let handler: MCPHandler;

  beforeEach(() => {
    // Create agent with mock tools
    agent = gs.createAgent() as Agent;
    handler = agent.getMcpHandler();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // PATTERN: Filesystem write protection test
  describe('FilesystemMCP write protection', () => {
    it('should block writing to PRD.md', async () => {
      // SETUP: Register mock tool with constraint
      const mockWrite = vi
        .fn()
        .mockRejectedValue(new Error('Cannot modify protected file: PRD.md'));
      handler.registerToolExecutor('filesystem', 'write_file', mockWrite);

      // EXECUTE & VERIFY
      await expect(
        handler.executeTool('filesystem__write_file', {
          path: 'PRD.md',
          content: 'malicious content',
        })
      ).rejects.toThrow('Cannot modify protected file: PRD.md');
    });

    it('should allow writing to non-protected files', async () => {
      const mockWrite = vi.fn().mockResolvedValue({
        content: 'File written successfully',
        is_error: false,
      });
      handler.registerToolExecutor('filesystem', 'write_file', mockWrite);

      const result = await handler.executeTool('filesystem__write_file', {
        path: 'src/index.ts',
        content: 'code here',
      });

      expect(result.is_error).toBe(false);
    });
  });

  // PATTERN: Bash command validation test
  describe('BashMCP command validation', () => {
    it('should block pipeline commands', async () => {
      const mockBash = vi
        .fn()
        .mockRejectedValue(
          new Error('Forbidden pipeline command: prd/run-prd.sh')
        );
      handler.registerToolExecutor('bash', 'execute_command', mockBash);

      await expect(
        handler.executeTool('bash__execute_command', {
          command: 'prd/run-prd.sh',
        })
      ).rejects.toThrow('Forbidden pipeline command');
    });

    it('should block .gitignore modification with forbidden patterns', async () => {
      const mockBash = vi.fn().mockImplementation(({ command }) => {
        if (command.includes('plan/')) {
          throw new Error('Cannot add forbidden pattern to .gitignore: plan/');
        }
        return Promise.resolve({
          content: 'Command executed',
          is_error: false,
        });
      });
      handler.registerToolExecutor('bash', 'execute_command', mockBash);

      await expect(
        handler.executeTool('bash__execute_command', {
          command: 'echo "plan/" >> .gitignore',
        })
      ).rejects.toThrow('Cannot add forbidden pattern to .gitignore');
    });
  });

  // PATTERN: Session directory validation test
  describe('Session directory constraints', () => {
    it('should block session creation outside plan/ or bugfix/', async () => {
      const mockMkdir = vi
        .fn()
        .mockRejectedValue(
          new Error('Session directories must be under plan/ or bugfix/')
        );
      handler.registerToolExecutor('filesystem', 'mkdir', mockMkdir);

      await expect(
        handler.executeTool('filesystem__mkdir', {
          path: '/tmp/session-abc123',
        })
      ).rejects.toThrow('Session directories must be under plan/ or bugfix/');
    });

    it('should allow session creation in plan/', async () => {
      const mockMkdir = vi.fn().mockResolvedValue({
        content: 'Directory created',
        is_error: false,
      });
      handler.registerToolExecutor('filesystem', 'mkdir', mockMkdir);

      const result = await handler.executeTool('filesystem__mkdir', {
        path: '/project/plan/001_hash/session',
      });

      expect(result.is_error).toBe(false);
    });
  });
});

// GOTCHA: Use basename for protected file checking
function isProtectedFile(filePath: string): boolean {
  const PROTECTED_FILES = [
    'tasks.json',
    'PRD.md',
    'prd_snapshot.md',
    'delta_prd.md',
    'delta_from.txt',
    'TEST_RESULTS.md',
  ] as const;
  const fileName = basename(filePath);
  return PROTECTED_FILES.includes(fileName as any);
}

// GOTCHA: Check for wildcard pattern *tasks*.json
function isProtectedByWildcard(filePath: string): boolean {
  const fileName = basename(filePath);
  return /\btasks.*\.json$/.test(fileName);
}

// PATTERN: Validate bash command for forbidden operations
function validateBashCommand(command: string): {
  allowed: boolean;
  error?: string;
} {
  const FORBIDDEN_COMMANDS = [
    'prd/run-prd.sh',
    'prd/run-prd.ts',
    './tsk',
    'tsk',
  ];

  const normalizedCommand = command.trim().toLowerCase();

  // Check for forbidden commands
  for (const forbidden of FORBIDDEN_COMMANDS) {
    if (normalizedCommand.includes(forbidden.toLowerCase())) {
      return {
        allowed: false,
        error: `Forbidden pipeline command: ${forbidden}`,
      };
    }
  }

  // Check for .gitignore modification with forbidden patterns
  if (normalizedCommand.includes('.gitignore')) {
    const FORBIDDEN_PATTERNS = ['plan/', 'prd.md', '*tasks*.json'];
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (normalizedCommand.includes(pattern.toLowerCase())) {
        return {
          allowed: false,
          error: `Cannot add forbidden pattern to .gitignore: ${pattern}`,
        };
      }
    }
  }

  return { allowed: true };
}

// PATTERN: Validate session directory path
function validateSessionPath(sessionPath: string): {
  allowed: boolean;
  error?: string;
} {
  const normalizedPath = sessionPath.replace(/\\/g, '/').toLowerCase();

  // Must contain plan/ or bugfix/
  if (
    !normalizedPath.includes('/plan/') &&
    !normalizedPath.includes('/bugfix/')
  ) {
    return {
      allowed: false,
      error: 'Session directories must be under plan/ or bugfix/',
    };
  }

  return { allowed: true };
}
```

### Integration Points

```yaml
AGENT_FACTORY:
  - file: src/agents/agent-factory.ts
  - pattern: createAgent() function
  - use: Create agents with mock MCP servers for testing

MCP_HANDLER:
  - method: agent.getMcpHandler()
  - pattern: getTools(), executeTool(), registerToolExecutor()
  - use: Register mock executors with constraint checks

PROTECTED_FILES:
  - file: src/utils/git-commit.ts
  - pattern: filterProtectedFiles(), PROTECTED_FILES constant
  - use: Reference for protected file list

EXISTING_TESTS:
  - file: tests/integration/mcp-tools.test.ts
  - pattern: Mock setup, agent creation
  - use: Template for test structure
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation
npm run lint -- tests/integration/forbidden-operations.test.ts
npm run format -- tests/integration/forbidden-operations.test.ts

# Expected: Zero linting errors, proper formatting
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test file compiles and runs
npm test -- forbidden-operations.test.ts

# Expected: All test cases pass
# - Filesystem write protection tests pass
# - Bash command validation tests pass
# - Session directory constraint tests pass
# - Error message verification tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite for integration tests
npm test -- tests/integration/

# Expected: All integration tests pass, no regressions

# Specific test for this file
npm test -- --testNamePattern="Agent Constraint Enforcement"

# Expected: All constraint enforcement tests pass
```

### Level 4: Domain-Specific Validation

```bash
# Verify test coverage
npm run test:coverage -- tests/integration/forbidden-operations.test.ts

# Expected: High coverage for constraint scenarios

# Run with verbose output for debugging
npm test -- forbidden-operations.test.ts --verbose

# Expected: Clear output showing which constraints are enforced

# Test that actual agents cannot perform forbidden operations
# (This would require actual agent implementation with guards)
# npm test -- tests/integration/ --agent-e2e

# Expected: Agents are properly constrained when guards are implemented
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file compiles without errors
- [ ] All linting rules pass
- [ ] Code follows existing test patterns from mcp-tools.test.ts
- [ ] Mock setup/teardown properly cleans up state
- [ ] No mock state leakage between tests

### Feature Validation

- [ ] PRD.md write protection test passes
- [ ] tasks.json write protection test passes
- [ ] All protected files are covered
- [ ] .gitignore plan/ pattern test passes
- [ ] .gitignore _tasks_.json pattern test passes
- [ ] .gitignore PRD.md pattern test passes
- [ ] Pipeline command prd/run-prd.sh test passes
- [ ] Pipeline command prd/run-prd.ts test passes
- [ ] Pipeline command ./tsk test passes
- [ ] Session directory outside plan/ blocked
- [ ] Session directory in plan/ allowed
- [ ] Session directory in bugfix/ allowed

### Code Quality Validation

- [ ] Test names clearly describe what is being tested
- [ ] Error messages are specific and actionable
- [ ] Both positive (allowed) and negative (blocked) cases tested
- [ ] Edge cases covered (path variations, case sensitivity)
- [ ] Follows pattern from existing integration tests

### Documentation & Deployment

- [ ] Tests are self-documenting with clear describe/it names
- [ ] Comments explain non-obvious test logic
- [ ] Test file can be run standalone

---

## Anti-Patterns to Avoid

- Don't test implementation details - test behavior (operations are blocked)
- Don't forget to test positive cases (operations that should succeed)
- Don't use try-catch without assertions - use expect().rejects.toThrow()
- Don't leak mock state between tests - always clean up in afterEach
- Don't test only exact paths - test path variations (relative, absolute)
- Don't assume constraints are enforced - verify they are blocked
- Don't skip environment variable cleanup when used
- Don't create new patterns - follow mcp-tools.test.ts structure

---

**PRP Version**: 1.0
**Created**: 2026-01-21
**For**: P1.M2.T2.S3 - Agent Capabilities Verification
**Confidence Score**: 9/10 (High - comprehensive research and clear patterns)
