# Product Requirement Prompt (PRP): Integrate MCP Tools with Agents

---

## Goal

**Feature Goal**: Enable all Groundswell agents created by the agent factory to have access to BashMCP, FilesystemMCP, and GitMCP tools for executing shell commands, file system operations, and version control operations.

**Deliverable**: Updated `src/agents/agent-factory.ts` where all persona-specific agent creators (createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent) receive MCP tool instances and pass them to `createAgent()` via the `mcps` configuration option.

**Success Definition**:

- All agent creators in agent-factory.ts instantiate or reference singleton BashMCP, FilesystemMCP, and GitMCP instances
- The `createAgent()` calls include the `mcps` array parameter with all three MCP instances
- Unit tests verify that agent configurations include the expected MCP tools
- Existing tests for agent-factory.ts continue to pass
- All validation levels (syntax, unit tests, integration) pass without errors

## Why

- **Agent Capabilities**: Agents need tool access to interact with the file system, execute commands, and perform Git operations as part of the PRP Pipeline workflow
- **Groundswell Integration**: Groundswell's `createAgent()` function accepts an `mcps` array parameter for MCP server instances, enabling tools to be available during agent execution
- **Separation of Concerns**: MCP tools are implemented separately (src/tools/) and need to be integrated with the agent factory without duplicating code
- **Testability**: The integration must maintain the existing test structure and coverage requirements

## What

### User-Visible Behavior

- Agents created via the factory will have access to bash, filesystem, and git tools
- When agents prompt the LLM, they can use these tools for:
  - **BashMCP**: Execute shell commands (npm, git status, tests, etc.)
  - **FilesystemMCP**: Read/write files, glob patterns, grep search
  - **GitMCP**: Git status, diff, add, commit operations

### Technical Requirements

1. Import BashMCP, FilesystemMCP, GitMCP classes from '../tools'
2. Create singleton instances of each MCP class (module-level constants)
3. Update all agent creator functions to include `mcps` array in config
4. Maintain existing function signatures and behavior
5. Ensure type safety with Groundswell's AgentConfig type

### Success Criteria

- [ ] All four agent creators (Architect, Researcher, Coder, QA) include mcps array
- [ ] mcps array contains exactly three instances: BashMCP, FilesystemMCP, GitMCP
- [ ] Unit tests pass with 100% coverage for agent-factory.ts
- [ ] TypeScript compilation succeeds with no type errors
- [ ] Existing MCP tool tests continue to pass

---

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes - this PRP provides:

- Exact file paths and imports needed
- Complete code patterns to follow from existing code
- Specific Groundswell API usage with mcps parameter
- Testing patterns and validation commands
- Known gotchas and constraints

### Documentation & References

```yaml
# MUST READ - Groundswell API Documentation
- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  section: h2.2 (Agent System)
  why: Shows createAgent() accepts mcps array parameter
  critical: |
    const agent = createAgent({
      name: 'PRPAgent',
      system: 'System prompt',
      model: 'GLM-4.7',
      mcps: [customMCPServer],  # <-- This is the key parameter
      env: { ANTHROPIC_API_KEY: '...' }
    });

# MUST READ - MCP Integration Pattern
- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  section: h2.8 (Implementation Patterns for PRP Pipeline - Pattern 2)
  why: Shows the exact pattern for passing MCP instances to createAgent
  critical: |
    const coderAgent = createAgent({
      name: 'CoderAgent',
      system: CODER_SYSTEM_PROMPT,
      model: 'GLM-4.7',
      mcps: [new BashMCP(), new FilesystemMCP(), new GitMCP()],
    });

# MUST READ - Existing MCP Tool Implementation
- file: src/tools/bash-mcp.ts
  pattern: MCPHandler subclass pattern with constructor registration
  why: Shows how BashMCP extends MCPHandler and registers tools
  gotcha: All MCP classes must call super() in constructor

- file: src/tools/filesystem-mcp.ts
  pattern: Multiple tool registration pattern
  why: Shows how to register multiple tools (file_read, file_write, glob_files, grep_search)
  gotcha: Tool executors must be cast to ToolExecutor type

- file: src/tools/git-mcp.ts
  pattern: GitMCP implementation with 4 tools
  why: Shows complete MCP server implementation with security patterns
  gotcha: Uses validateRepositoryPath helper for security

# MUST READ - Current Agent Factory Implementation
- file: src/agents/agent-factory.ts
  why: Shows existing agent creator functions that need modification
  pattern: Persona-specific config with createBaseConfig() helper
  critical: Lines 160-244 contain createArchitectAgent, createResearcherAgent, createCoderAgent, createQAAgent
  gotcha: createAgent() is called WITHOUT mcps parameter currently

# MUST READ - Existing Test Pattern
- file: tests/unit/agents/agent-factory.test.ts
  why: Shows how to test agent factory with Vitest
  pattern: Uses vi.stubEnv for environment setup, vi.unstubAllEnvs for cleanup
  critical: Test structure must be followed for new integration tests
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts       # TARGET FILE - Modify to add MCP integration
│   └── prompts.ts             # System prompt constants (no changes needed)
├── tools/
│   ├── bash-mcp.ts            # BashMCP class - extends MCPHandler
│   ├── filesystem-mcp.ts      # FilesystemMCP class - extends MCPHandler
│   └── git-mcp.ts             # GitMCP class - extends MCPHandler
├── config/
│   ├── constants.ts
│   ├── environment.ts
│   └── types.ts
├── core/
│   ├── models.ts
│   └── session-utils.ts
└── index.ts

tests/
├── unit/
│   ├── agents/
│   │   ├── agent-factory.test.ts    # Update to verify MCP integration
│   │   └── prompts.test.ts
│   └── tools/
│       ├── bash-mcp.test.ts
│       ├── filesystem-mcp.test.ts
│       └── git-mcp.test.ts
```

### Desired Codebase Tree with MCP Integration

```bash
src/
├── agents/
│   ├── agent-factory.ts       # MODIFIED - Adds MCP imports, singletons, mcps array
│   └── prompts.ts             # (unchanged)
├── tools/
│   ├── bash-mcp.ts            # (unchanged - imported by agent-factory)
│   ├── filesystem-mcp.ts      # (unchanged - imported by agent-factory)
│   └── git-mcp.ts             # (unchanged - imported by agent-factory)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Groundswell createAgent() accepts mcps as an array of MCPHandler instances
// The mcps parameter is optional but must be an array when provided
// Gotcha: Don't pass MCP classes directly - must be instantiated instances

// CRITICAL: MCPHandler is the base class for all MCP tools
// Gotcha: BashMCP, FilesystemMCP, GitMCP all extend MCPHandler
// Gotcha: Each MCP class MUST call super() in constructor

// CRITICAL: Singleton pattern is preferred for MCP instances
// Gotcha: Creating new instances on every agent creation is wasteful
// Pattern: Export module-level constants for MCP instances

// CRITICAL: TypeScript type safety - AgentConfig from groundswell
// Gotcha: The mcps parameter expects MCP[] (array of MCP instances)
// Gotcha: Don't need to import MCP type - it's inferred from instances

// CRITICAL: Don't break existing agent creator signatures
// Gotcha: All agent creators take no parameters currently
// Gotcha: Adding parameters would be a breaking change
// Solution: Create MCP instances internally, not passed as parameters
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models required. Using existing types:

- `Agent` type from Groundswell (return type of createAgent)
- `MCPHandler` base class from Groundswell (parent of BashMCP, FilesystemMCP, GitMCP)
- `AgentPersona` union type (already defined in agent-factory.ts)

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD MCP imports to agent-factory.ts
  LOCATION: Top of src/agents/agent-factory.ts
  IMPLEMENT: Import BashMCP, FilesystemMCP, GitMCP from '../tools'
  PATTERN: Follow existing import pattern from line 23-30
  ADD_AFTER: Line 30 (after prompts.ts import)
  NAMING: Use named imports for MCP classes
  CODE:
    import { BashMCP } from '../tools/bash-mcp.js';
    import { FilesystemMCP } from '../tools/filesystem-mcp.js';
    import { GitMCP } from '../tools/git-mcp.js';

Task 2: CREATE singleton MCP instances
  LOCATION: After imports, before configureEnvironment() call (around line 31)
  IMPLEMENT: Create module-level constants for each MCP instance
  PATTERN: Singleton pattern - one instance per MCP class, reused by all agents
  NAMING: UPPER_SNAKE_CASE for singleton constants (e.g., BASH_MCP)
  CODE:
    /**
     * Singleton MCP server instances
     *
     * @remarks
     * One instance of each MCP server is shared across all agents.
     * This avoids redundant server registration and memory overhead.
     */
    const BASH_MCP = new BashMCP();
    const FILESYSTEM_MCP = new FilesystemMCP();
    const GIT_MCP = new GitMCP();

    /**
     * Combined array of all MCP tools for agent integration
     *
     * @remarks
     * This array is passed to createAgent() via the mcps parameter.
     * All agents (architect, researcher, coder, qa) receive the same tool set.
     */
    const MCP_TOOLS = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP] as const;

Task 3: MODIFY createArchitectAgent()
  LOCATION: src/agents/agent-factory.ts, line 160-167
  IMPLEMENT: Add mcps parameter to createAgent() config
  PATTERN: Follow existing spread pattern for baseConfig
  ADD: mcps: MCP_TOOLS after system property
  PRESERVE: All existing config properties
  CODE:
    export function createArchitectAgent(): Agent {
      const baseConfig = createBaseConfig('architect');
      const config = {
        ...baseConfig,
        system: TASK_BREAKDOWN_PROMPT,
        mcps: MCP_TOOLS,  // <-- ADD THIS LINE
      };
      return createAgent(config);
    }

Task 4: MODIFY createResearcherAgent()
  LOCATION: src/agents/agent-factory.ts, line 186-193
  IMPLEMENT: Add mcps parameter to createAgent() config
  PATTERN: Same as Task 3
  CODE:
    export function createResearcherAgent(): Agent {
      const baseConfig = createBaseConfig('researcher');
      const config = {
        ...baseConfig,
        system: PRP_BLUEPRINT_PROMPT,
        mcps: MCP_TOOLS,  // <-- ADD THIS LINE
      };
      return createAgent(config);
    }

Task 5: MODIFY createCoderAgent()
  LOCATION: src/agents/agent-factory.ts, line 212-219
  IMPLEMENT: Add mcps parameter to createAgent() config
  PATTERN: Same as Task 3
  CODE:
    export function createCoderAgent(): Agent {
      const baseConfig = createBaseConfig('coder');
      const config = {
        ...baseConfig,
        system: PRP_BUILDER_PROMPT,
        mcps: MCP_TOOLS,  // <-- ADD THIS LINE
      };
      return createAgent(config);
    }

Task 6: MODIFY createQAAgent()
  LOCATION: src/agents/agent-factory.ts, line 238-245
  IMPLEMENT: Add mcps parameter to createAgent() config
  PATTERN: Same as Task 3
  CODE:
    export function createQAAgent(): Agent {
      const baseConfig = createBaseConfig('qa');
      const config = {
        ...baseConfig,
        system: BUG_HUNT_PROMPT,
        mcps: MCP_TOOLS,  // <-- ADD THIS LINE
      };
      return createAgent(config);
    }

Task 7: UPDATE unit tests for MCP integration
  LOCATION: tests/unit/agents/agent-factory.test.ts
  IMPLEMENT: Add tests verifying mcps array in agent configs
  PATTERN: Follow existing test pattern with vi.mock for Groundswell
  ADD: New describe block for MCP integration tests
  CODE:
    describe('MCP integration', () => {
      beforeEach(() => {
        vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
        vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
      });

      it('should include MCP tools in architect agent config', () => {
        // SETUP: Mock createAgent to capture config
        const mockCreateAgent = vi.fn().mockReturnValue({} as Agent);
        vi.doMock('groundswell', () => ({
          createAgent: mockCreateAgent,
        }));

        // EXECUTE
        createArchitectAgent();

        // VERIFY: createAgent was called with mcps
        expect(mockCreateAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            mcps: expect.any(Array),
          })
        );
      });

      it('should include all three MCP tools in mcps array', () => {
        // Similar test for all agent creators
        // Verify mcps array has length 3
      });
    });

Task 8: EXPORT MCP_TOOLS for external use (optional)
  LOCATION: End of src/agents/agent-factory.ts
  IMPLEMENT: Export MCP_TOOLS constant for testing and external use
  ADD: export { MCP_TOOLS }; after existing exports
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Singleton MCP instances (module-level constants)
// CRITICAL: Create instances ONCE at module load time
// Gotcha: Don't create new instances inside each agent creator (wasteful)

const BASH_MCP = new BashMCP(); // Singleton - one instance
const FILESYSTEM_MCP = new FilesystemMCP(); // Singleton - one instance
const GIT_MCP = new GitMCP(); // Singleton - one instance

// Pattern 2: Combined MCP array for agent config
// CRITICAL: Use 'as const' for readonly array
// Gotcha: Array order doesn't matter for Groundswell

const MCP_TOOLS = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP] as const;

// Pattern 3: Agent config with mcps parameter
// CRITICAL: Spread baseConfig first, then add mcps
// Gotcha: Don't modify baseConfig directly (immutability)

export function createCoderAgent(): Agent {
  const baseConfig = createBaseConfig('coder');
  const config = {
    ...baseConfig, // Spread existing config
    system: PRP_BUILDER_PROMPT,
    mcps: MCP_TOOLS, // Add MCP tools
  };
  return createAgent(config);
}

// Pattern 4: JSDoc comments for MCP tools
// Gotcha: Document why singleton pattern is used

/**
 * Singleton MCP server instances
 *
 * @remarks
 * One instance of each MCP server is shared across all agents.
 * This avoids redundant server registration and memory overhead.
 * MCP servers register their tools in the constructor via MCPHandler.
 */
```

### Integration Points

```yaml
GROUNDSWELL_CREATEAGENT:
  - parameter: mcps: MCP[]
  - type: Array of MCPHandler instances
  - location: createAgent(config) call in each agent creator
  - pattern: mcps: MCP_TOOLS

IMPORT_STATEMENTS:
  - add to: src/agents/agent-factory.ts (top of file)
  - pattern: "import { ClassName } from '../tools/class-name.js';"
  - files: bash-mcp.ts, filesystem-mcp.ts, git-mcp.ts

MODULE_STRUCTURE:
  - placement: After imports, before configureEnvironment()
  - pattern: Constants then initialization
  - order: 1) MCP imports, 2) MCP instances, 3) MCP_TOOLS array, 4) existing code

TEST_MOCKING:
  - file: tests/unit/agents/agent-factory.test.ts
  - pattern: vi.mock('groundswell') for createAgent
  - verification: expect.objectContaining({ mcps: expect.any(Array) })
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compilation check
cd /home/dustin/projects/hacky-hack
npx tsc --noEmit

# Expected: Zero type errors. If errors exist:
# - Check import paths are correct (use .js extension for ESM)
# - Verify MCP classes are properly imported
# - Ensure mcps parameter type matches Groundswell's expectation

# Run ESLint (if configured)
npm run lint 2>/dev/null || npx eslint src/agents/agent-factory.ts

# Expected: Zero linting errors

# Run formatting check
npm run format:check 2>/dev/null || npx prettier --check src/agents/agent-factory.ts

# Expected: Proper formatting consistent with existing code
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run agent factory unit tests
npm test -- tests/unit/agents/agent-factory.test.ts

# Expected: All tests pass (100% coverage maintained)

# Run all MCP tool tests (ensure nothing broke)
npm test -- tests/unit/tools/

# Expected: All MCP tool tests pass

# Run full test suite
npm test

# Expected: All tests pass, 100% coverage maintained

# Coverage verification
npm run test:coverage 2>/dev/null || npm test -- --coverage

# Expected: Coverage report shows 100% for src/agents/agent-factory.ts
```

### Level 3: Integration Testing (System Validation)

```bash
# TypeScript build verification
npm run build 2>/dev/null || npx tsc

# Expected: Clean build with no compilation errors

# Import verification (verify module can be imported)
node -e "import('./src/agents/agent-factory.js').then(m => console.log('OK', Object.keys(m)))"

# Expected: No import errors, module exports visible

# MCP instance verification (manual test in Node REPL)
node --eval "
import { createCoderAgent } from './src/agents/agent-factory.js';
console.log('Agent factory loaded successfully');
"

# Expected: No runtime errors during import
```

### Level 4: Creative & Domain-Specific Validation

```bash
# MCP Tool Availability Test
# Create a test script to verify agents have access to MCP tools

cat > /tmp/test-mcp-integration.mjs << 'EOF'
import { createCoderAgent } from './src/agents/agent-factory.js';

// Note: We can't directly inspect the mcps from the returned Agent
// but we can verify the module imports correctly
console.log('✓ Agent factory imports successfully');
console.log('✓ MCP tools can be imported from tools/');
EOF

node /tmp/test-mcp-integration.mjs

# Expected: "✓ Agent factory imports successfully"

# Groundswell Configuration Verification
# Verify that mcps parameter is properly passed to createAgent

# This would require mocking Groundswell's createAgent to capture config
# See test implementation in Task 7 above
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] All tests pass: `npm test`
- [ ] Coverage maintained at 100% for agent-factory.ts
- [ ] No import errors for MCP classes
- [ ] MCP_TOOLS array contains exactly 3 instances

### Feature Validation

- [ ] All four agent creators include mcps: MCP_TOOLS
- [ ] Singleton pattern used (one instance per MCP class)
- [ ] Existing tests continue to pass
- [ ] New tests verify MCP integration
- [ ] Module exports include necessary items

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] JSDoc comments added for MCP constants
- [ ] No breaking changes to existing function signatures
- [ ] ESM import syntax with .js extensions
- [ ] Proper type inference from Groundswell types

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Comments explain singleton pattern rationale
- [ ] MCP_TOOLS constant exported for testing/external use
- [ ] No new environment variables required

---

## Anti-Patterns to Avoid

- ❌ Don't create new MCP instances inside each agent creator (wasteful)
- ❌ Don't pass MCP classes directly - must be instantiated instances
- ❌ Don't modify the existing AgentPersona type or function signatures
- ❌ Don't skip adding JSDoc comments for new constants
- ❌ Don't forget the .js extension in ESM import paths
- ❌ Don't use require() for imports - use ES6 import syntax
- ❌ Don't add parameters to agent creator functions (breaking change)
- ❌ Don't create separate MCP instances per agent (use singleton)
- ❌ Don't hardcode agent-specific MCP tools (all agents get same tools)
- ❌ Don't forget to update tests when adding new functionality

---

## Confidence Score

**Rating: 9/10** for one-pass implementation success likelihood

**Reasoning**:

- Clear, specific implementation tasks with exact line numbers
- Complete code examples for all modifications
- Comprehensive validation commands
- All dependencies and patterns documented
- Only minor risk: Groundswell's internal mcps handling is opaque (but documented)

**Validation**: The completed PRP provides sufficient context for an AI agent unfamiliar with the codebase to implement the MCP integration successfully.
