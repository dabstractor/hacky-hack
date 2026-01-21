# Product Requirement Prompt (PRP): P1.M1.T3.S2 - Verify Researcher Agent and PRP generation

---

## Goal

**Feature Goal**: Verify Researcher Agent is correctly integrated with proper configuration, PRP_CREATE_PROMPT structure compliance, and cache system behavior through comprehensive integration tests.

**Deliverable**: Integration test file `tests/integration/researcher-agent.test.ts` with test cases covering:

- Researcher Agent configuration verification (model, tokens, MCP tools, cache)
- PRP_CREATE_PROMPT structure validation (Research Process, PRP Generation Process, Template)
- PRP template structure compliance (Goal, Why, What, Context, Blueprint, Validation, Anti-Patterns)
- Cache system behavior verification (SHA-256 hash computation, 24-hour TTL, metadata storage)
- Mock subagent spawning and file operations for deterministic testing

**Success Definition**: All tests pass, verifying:

- Researcher Agent created with correct config (GLM-4.7, 4096 tokens, MCP tools: BASH, FILESYSTEM, GIT)
- PRP_CREATE_PROMPT contains all required sections (Research Process, PRP Generation Process, Template)
- PRP template contains all required sections (Goal, User Persona, Why, What, All Needed Context, Implementation Blueprint, Validation Loop, Final Validation Checklist, Anti-Patterns)
- Cache uses SHA-256 hash with correct input fields (id, title, description/context_scope)
- Cache TTL is 24 hours with proper expiration behavior
- Cache metadata stored in prps/.cache/ directory
- Mock Groundswell agent returns test PRPDocument for deterministic testing

## Why

- Researcher Agent is responsible for generating PRPs that guide all downstream implementation work
- The PRP_CREATE_PROMPT is critical for ensuring comprehensive research and proper PRP structure
- Cache system prevents unnecessary LLM calls and speeds up pipeline execution
- PRP template compliance ensures generated PRPs have all sections needed for one-pass implementation
- Configuration errors (model, tokens, MCP tools) would cause PRP generation failures
- Prompt structure errors would cause incomplete or incorrect PRP generation
- Cache bugs could cause stale PRPs to be reused or unnecessary LLM calls
- No existing tests verify Researcher Agent integration setup or cache behavior

## What

Integration tests that verify Researcher Agent is correctly configured, generates proper prompts, and implements cache correctly.

### Success Criteria

- [ ] Researcher Agent configuration validated (model: GLM-4.7, maxTokens: 4096, MCP tools: BASH, FILESYSTEM, GIT)
- [ ] PRP_CREATE_PROMPT contains Research Process section with codebase analysis, internal research, external research instructions
- [ ] PRP_CREATE_PROMPT contains PRP Generation Process section with 5 steps
- [ ] PRP_CREATE_PROMPT contains PRP-README and PRP-TEMPLATE sections
- [ ] PRP template contains all 8 required sections (Goal, User Persona, Why, What, All Needed Context, Implementation Blueprint, Validation Loop, Final Validation Checklist, Anti-Patterns)
- [ ] Prompt mentions subagent spawning, TodoWrite tool, architecture/ directory
- [ ] Cache hash uses SHA-256 with correct input fields
- [ ] Cache TTL is 24 hours (CACHE_TTL_MS constant)
- [ ] Cache metadata stored in prps/.cache/ directory
- [ ] Mock Groundswell agent can return test PRPDocument data
- [ ] Test verifies file path generation (getCachePath, getCacheMetadataPath)
- [ ] Test verifies cache hit/miss behavior

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Exact file paths and patterns to follow from existing tests
- Researcher Agent configuration values from source code
- PRP_CREATE_PROMPT structure from PROMPTS.md
- PRP template structure from PROMPTS.md
- Cache implementation details from prp-generator.ts
- Mock setup patterns for Groundswell agents
- Research documents with detailed implementation guidance

### Documentation & References

```yaml
# MUST READ - Researcher Agent configuration
- file: src/agents/agent-factory.ts
  why: Contains createResearcherAgent() with exact configuration values
  lines: 223-235 (createResearcherAgent function)
  lines: 118-123 (PERSONA_TOKEN_LIMITS)
  lines: 150-176 (createBaseConfig function)
  pattern: Factory function that calls createAgent with config
  gotcha: Researcher uses maxTokens: 4096 (vs. 8192 for Architect)

# MUST READ - PRP_CREATE_PROMPT structure
- file: PROMPTS.md
  why: Contains the full PRP_CREATE_PROMPT (PRP_BLUEPRINT_PROMPT) that Researcher Agent uses
  lines: 189-637 (complete PRP_CREATE_PROMPT including template)
  lines: 215-244 (Research Process section)
  lines: 246-282 (PRP Generation Process section)
  lines: 315-317 (PRP-README)
  lines: 319-637 (PRP-TEMPLATE)
  pattern: Markdown prompt with numbered sections
  gotcha: References subagent spawning which is aspirational, not implemented

# MUST READ - PRPGenerator implementation
- file: src/agents/prp-generator.ts
  why: Contains cache implementation and PRP generation flow
  lines: 128-180 (constructor, sessionPath, cached agent)
  lines: 191-209 (getCachePath, getCacheMetadataPath)
  lines: 225-250 (computeTaskHash - SHA-256, input fields)
  lines: 263-272 (isCacheRecent - TTL, 24 hours)
  lines: 284-295 (loadCachedPRP - metadata loading)
  lines: 310-334 (saveCacheMetadata - directory creation, JSON structure)
  lines: 403-456 (generate method - full flow)
  pattern: Private methods with # prefix, error handling
  gotcha: Task and Subtask use different fields for hash (description vs context_scope)

# MUST READ - PRP blueprint prompt generator
- file: src/agents/prompts/prp-blueprint-prompt.ts
  why: Shows how createPRPBlueprintPrompt() integrates task context with PRP_CREATE_PROMPT
  lines: 250-271 (createPRPBlueprintPrompt function)
  lines: 70-85 (extractParentContext - hierarchy traversal)
  lines: 142-201 (constructUserPrompt - placeholder replacement)
  pattern: Uses createPrompt with responseFormat and enableReflection
  gotcha: enableReflection: true for complex PRP generation reliability

# MUST READ - PRPDocument schema
- file: src/core/models.ts
  why: Contains PRPDocumentSchema for validation
  lines: 527-552 (PRPDocument interface and PRPDocumentSchema)
  pattern: Zod schema with arrays, optional fields
  gotcha: validationGates.command can be null (manual validation)

# MUST READ - Existing PRPGenerator integration test (reference only, not to duplicate)
- file: tests/integration/prp-generator-integration.test.ts
  why: Shows existing test patterns and what NOT to duplicate
  lines: 33-48 (fs/promises mock with selective real implementation)
  lines: 77-91 (describe block with beforeEach/afterEach)
  lines: 95-130 (SETUP/EXECUTE/VERIFY pattern)
  pattern: Uses real PRPGenerator with mocked dependencies
  gotcha: This test validates PRPGenerator, NOT Researcher Agent integration

# MUST READ - Groundswell Agent/Prompt test patterns
- file: tests/integration/groundswell/agent-prompt.test.ts
  why: Shows patterns for mocking @anthropic-ai/sdk and testing Groundswell integration
  lines: 39-45 (mock pattern for Anthropic SDK)
  lines: 52-54 (dynamic import function)
  lines: 232-263 (validateResponse() test patterns)
  pattern: vi.mock at top level, dynamic import, SETUP/EXECUTE/VERIFY
  gotcha: Must use .js extensions for imports

# MUST READ - Test setup and global hooks
- file: tests/setup.ts
  why: Contains z.ai API safeguard and global cleanup patterns
  lines: 56-120 (z.ai API endpoint validation)
  lines: 162-180 (beforeEach hooks)
  lines: 189-229 (afterEach hooks with rejection tracking)
  pattern: Global test file with automatic API validation
  gotcha: Tests fail if ANTHROPIC_BASE_URL is api.anthropic.com

# MUST READ - Previous PRP for parallel context
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S1/PRP.md
  why: Previous work item (Architect Agent integration) provides test patterns to follow
  section: "Implementation Blueprint" (test structure, mock setup)

# MUST READ - Research documents (in research/ subdir)
- docfile: plan/003_b3d3efdaf0ed/P1M1T3S2/research/researcher-agent-research.md
  why: Complete Researcher Agent configuration, cache implementation, PRP generation flow
  section: "Researcher Agent Implementation" (exact config values)

- docfile: plan/003_b3d3efdaf0ed/P1M1T3S2/research/integration-test-patterns-research.md
  why: Integration test patterns, mock setup, validation approaches
  section: "Mock Setup Patterns" (vi.mock, dynamic import patterns)
```

### Current Codebase Tree (test directories)

```bash
tests/
├── integration/
│   ├── agents.test.ts                      # Groundswell Agent/Prompt tests
│   ├── architect-agent.test.ts             # Existing: Architect output validation
│   ├── prp-blueprint-agent.test.ts         # PRP Blueprint Prompt tests
│   ├── prp-generator-integration.test.ts   # PRPGenerator integration
│   ├── prp-executor-integration.test.ts    # PRPExecutor integration
│   ├── groundswell/
│   │   ├── agent-prompt.test.ts            # Groundswell Agent/Prompt tests
│   │   ├── workflow.test.ts                # Groundswell Workflow tests
│   │   └── mcp.test.ts                     # Groundswell MCP tests
│   └── core/
│       ├── session-manager.test.ts         # Session Manager tests
│       ├── task-orchestrator.test.ts       # Task Orchestrator tests
│       └── research-queue.test.ts          # ResearchQueue tests
├── setup.ts                                # Global test setup with API validation
└── unit/
    └── agents/
        └── agent-factory.test.ts           # Agent factory unit tests
```

### Desired Codebase Tree (new test file to add)

```bash
tests/
├── integration/
│   ├── agents/
│   │   └── architect-agent-integration.test.ts   # NEW from P1.M1.T3.S1
│   ├── researcher-agent.test.ts                  # NEW: Researcher Agent integration tests
│   ├── agents.test.ts                            # Existing
│   ├── architect-agent.test.ts                   # Existing
│   └── [other existing test files...]
```

**New File**: `tests/integration/researcher-agent.test.ts`

- Tests Researcher Agent configuration from agent-factory
- Tests PRP_CREATE_PROMPT structure validation
- Tests PRP template structure compliance
- Tests cache system behavior (hash, TTL, metadata)
- Tests mock Groundswell agent integration
- Uses vi.mock for Groundswell, not agent-factory (to test real factory)

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Researcher Agent uses maxTokens: 4096 (vs. 8192 for Architect)
const PERSONA_TOKEN_LIMITS = {
  architect: 8192, // Larger for complex task decomposition
  researcher: 4096, // Standard for PRP generation
  coder: 4096,
  qa: 4096,
} as const;

// CRITICAL: PRP_CREATE_PROMPT references subagent spawning and batch tools
// These are ASPIRATIONAL features, not implemented in current codebase
// Tests should verify prompt CONTAINS these instructions, not that they work

// GOTCHA: MCP servers are singletons registered at module load time
// This prevents re-registration across tests
// Use vi.mock('groundswell') to avoid MCP registration issues

// CRITICAL: Tests MUST use .js extensions for imports (ES modules)
import { createResearcherAgent } from '../../src/agents/agent-factory.js';

// GOTCHA: Global test setup (tests/setup.ts) blocks Anthropic API
// Tests will fail if ANTHROPIC_BASE_URL is https://api.anthropic.com
// Must use https://api.z.ai/api/anthropic

// CRITICAL: Use vi.mock() at top level BEFORE imports (hoisting required)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});

// GOTCHA: When testing agent-factory, mock Groundswell NOT agent-factory
// We want to test the REAL createResearcherAgent() function
// So we mock createAgent() which it calls internally

// CRITICAL: Cache hash uses different fields for Task vs Subtask
// Task: id, title, description
// Subtask: id, title, context_scope
// Excludes: status, dependencies, story_points

// GOTCHA: Cache TTL is 24 hours (86400000 ms)
// Defined as CACHE_TTL_MS constant at line 151

// CRITICAL: Cache directory structure
// {sessionPath}/prps/ - PRP markdown files
// {sessionPath}/prps/.cache/ - Cache metadata JSON files

// GOTCHA: Task ID sanitization for filenames
// Dots replaced with underscores: P1.M1.T1.S1 -> P1_M1_T1_S1

// CRITICAL: PRPDocument has specific schema structure
// validationGates[].command can be null (manual validation)
// All fields are required except command can be null

// GOTCHA: PRP template has 8+ required sections
// Goal, User Persona, Why, What, All Needed Context, Implementation Blueprint, Validation Loop, Final Validation Checklist, Anti-Patterns
```

## Implementation Blueprint

### Data Models and Structure

Use existing types from `src/core/models.ts`:

```typescript
// Import existing types for use in tests
import type {
  Backlog,
  Task,
  Subtask,
  PRPDocument,
} from '../../src/core/models.js';
import { PRPDocumentSchema } from '../../src/core/models.js';

// Mock fixture for PRPDocument
const createMockPRPDocument = (taskId: string): PRPDocument => ({
  taskId,
  objective: 'Test objective',
  context: 'Test context',
  implementationSteps: ['Step 1', 'Step 2', 'Step 3'],
  validationGates: [
    { level: 'Level 1', command: 'npm test' },
    { level: 'Level 2', command: 'npm run lint' },
    { level: 'Level 3', command: null }, // Manual validation
    { level: 'Level 4', command: 'npm run build' },
  ],
  successCriteria: [
    { description: 'Test criterion 1' },
    { description: 'Test criterion 2' },
  ],
  references: ['Reference 1', 'Reference 2'],
});

// Mock fixture for Backlog with Task
const createMockBacklogWithTask = (): Backlog => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1: Test',
      status: 'Planned',
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1.1',
          status: 'Planned',
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1.1.1',
              status: 'Planned',
              description: 'Test task description',
              subtasks: [],
            },
          ],
        },
      ],
    },
  ],
});

// Mock fixture for Backlog with Subtask
const createMockBacklogWithSubtask = (): Backlog => ({
  backlog: [
    {
      id: 'P1',
      type: 'Phase',
      title: 'Phase 1: Test',
      status: 'Planned',
      description: 'Test phase',
      milestones: [
        {
          id: 'P1.M1',
          type: 'Milestone',
          title: 'Milestone 1.1',
          status: 'Planned',
          description: 'Test milestone',
          tasks: [
            {
              id: 'P1.M1.T1',
              type: 'Task',
              title: 'Task 1.1.1',
              status: 'Planned',
              description: 'Test task description',
              subtasks: [
                {
                  id: 'P1.M1.T1.S1',
                  type: 'Subtask',
                  title: 'Subtask 1.1.1.1',
                  status: 'Planned',
                  story_points: 2,
                  dependencies: [],
                  context_scope: `CONTRACT DEFINITION:
1. RESEARCH NOTE: Test research findings.
2. INPUT: None.
3. LOGIC: Test logic implementation.
4. OUTPUT: Test output for next subtask.`,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/researcher-agent.test.ts
  - IMPLEMENT: File header with JSDoc comments describing test purpose
  - IMPLEMENT: Import statements for Vitest, types, mocks
  - IMPLEMENT: Top-level vi.mock() for Groundswell (NOT agent-factory)
  - FOLLOW pattern: tests/integration/groundswell/agent-prompt.test.ts (mock setup)
  - NAMING: researcher-agent.test.ts (distinguished from prp-generator-integration.test.ts)
  - PLACEMENT: tests/integration/ directory

Task 2: IMPLEMENT mock setup with dynamic imports
  - IMPLEMENT: vi.mock('groundswell') with createAgent mock
  - IMPLEMENT: Dynamic import function for Groundswell
  - IMPLEMENT: Mock createAgent to return object with prompt() method
  - DEPENDENCIES: Task 1 (file created)

Task 3: IMPLEMENT main describe block and hooks
  - IMPLEMENT: Main describe block 'integration/researcher-agent'
  - IMPLEMENT: beforeAll to load Groundswell dynamically
  - IMPLEMENT: beforeEach to clear mocks
  - IMPLEMENT: afterEach to unstub environments
  - FOLLOW pattern: tests/integration/groundswell/agent-prompt.test.ts (test structure)
  - DEPENDENCIES: Task 2 (mock setup complete)

Task 4: IMPLEMENT researcher agent configuration tests
  - CREATE: describe block 'createResearcherAgent configuration'
  - IMPLEMENT: test 'should create researcher agent with GLM-4.7 model'
    - SETUP: Import PRP_BLUEPRINT_PROMPT from prompts.js
    - EXECUTE: Call createResearcherAgent()
    - VERIFY: createAgent called with model: 'GLM-4.7'
  - IMPLEMENT: test 'should create researcher agent with 4096 max tokens'
    - VERIFY: createAgent called with maxTokens: 4096
  - IMPLEMENT: test 'should create researcher agent with cache enabled'
    - VERIFY: createAgent called with enableCache: true
  - IMPLEMENT: test 'should create researcher agent with MCP tools'
    - VERIFY: createAgent called with mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP]
  - DEPENDENCIES: Task 3 (test structure complete)

Task 5: IMPLEMENT PRP_CREATE_PROMPT structure validation tests
  - CREATE: describe block 'PRP_CREATE_PROMPT structure validation'
  - IMPLEMENT: test 'should contain Research Process section'
    - VERIFY: Prompt contains 'Research Process'
    - VERIFY: Prompt contains 'Codebase Analysis in depth'
    - VERIFY: Prompt contains 'Internal Research at scale'
    - VERIFY: Prompt contains 'External Research at scale'
    - VERIFY: Prompt contains 'User Clarification'
  - IMPLEMENT: test 'should contain PRP Generation Process section'
    - VERIFY: Prompt contains 'PRP Generation Process'
    - VERIFY: Prompt contains 'Step 1: Review Template'
    - VERIFY: Prompt contains 'Step 2: Context Completeness Validation'
    - VERIFY: Prompt contains 'Step 3: Research Integration'
    - VERIFY: Prompt contains 'Step 4: Information Density Standards'
    - VERIFY: Prompt contains 'Step 5: ULTRATHINK Before Writing'
  - IMPLEMENT: test 'should instruct to spawn subagents'
    - VERIFY: Prompt contains 'spawn subagents'
    - VERIFY: Prompt contains 'batch tools'
  - IMPLEMENT: test 'should instruct to use TodoWrite tool'
    - VERIFY: Prompt contains 'TodoWrite'
    - VERIFY: Prompt contains 'create comprehensive PRP writing plan'
  - IMPLEMENT: test 'should mention architecture/ directory'
    - VERIFY: Prompt contains '$SESSION_DIR/architecture/'
    - VERIFY: Prompt contains 'store architectural findings'
  - DEPENDENCIES: Task 4 (configuration tests validate agent setup)

Task 6: IMPLEMENT PRP template structure validation tests
  - CREATE: describe block 'PRP template structure validation'
  - IMPLEMENT: test 'should contain Goal section'
    - VERIFY: Template contains '## Goal'
    - VERIFY: Template contains 'Feature Goal'
    - VERIFY: Template contains 'Deliverable'
    - VERIFY: Template contains 'Success Definition'
  - IMPLEMENT: test 'should contain User Persona section'
    - VERIFY: Template contains '## User Persona'
  - IMPLEMENT: test 'should contain Why section'
    - VERIFY: Template contains '## Why'
  - IMPLEMENT: test 'should contain What section'
    - VERIFY: Template contains '## What'
    - VERIFY: Template contains '### Success Criteria'
  - IMPLEMENT: test 'should contain All Needed Context section'
    - VERIFY: Template contains '## All Needed Context'
    - VERIFY: Template contains '### Context Completeness Check'
    - VERIFY: Template contains '### Documentation & References'
    - VERIFY: Template contains '### Current Codebase tree'
    - VERIFY: Template contains '### Desired Codebase tree'
    - VERIFY: Template contains '### Known Gotchas'
  - IMPLEMENT: test 'should contain Implementation Blueprint section'
    - VERIFY: Template contains '## Implementation Blueprint'
    - VERIFY: Template contains '### Data models and structure'
    - VERIFY: Template contains '### Implementation Tasks'
    - VERIFY: Template contains '### Implementation Patterns & Key Details'
    - VERIFY: Template contains '### Integration Points'
  - IMPLEMENT: test 'should contain Validation Loop section'
    - VERIFY: Template contains '## Validation Loop'
    - VERIFY: Template contains '### Level 1: Syntax & Style'
    - VERIFY: Template contains '### Level 2: Unit Tests'
    - VERIFY: Template contains '### Level 3: Integration Testing'
    - VERIFY: Template contains '### Level 4: Creative & Domain-Specific'
  - IMPLEMENT: test 'should contain Final Validation Checklist section'
    - VERIFY: Template contains '## Final Validation Checklist'
    - VERIFY: Template contains '### Technical Validation'
    - VERIFY: Template contains '### Feature Validation'
    - VERIFY: Template contains '### Code Quality Validation'
    - VERIFY: Template contains '### Documentation & Deployment'
  - IMPLEMENT: test 'should contain Anti-Patterns section'
    - VERIFY: Template contains '## Anti-Patterns to Avoid'
  - DEPENDENCIES: Task 5 (prompt structure tests)

Task 7: IMPLEMENT cache hash computation tests
  - CREATE: describe block 'cache hash computation'
  - IMPLEMENT: test 'should use SHA-256 for hashing'
    - This is verified by inspecting prp-generator.ts implementation
    - Document that #computeTaskHash uses createHash('sha256')
  - IMPLEMENT: test 'should hash Task with id, title, description'
    - VERIFY: Task hash includes id, title, description
    - VERIFY: Task hash excludes status, dependencies, story_points
  - IMPLEMENT: test 'should hash Subtask with id, title, context_scope'
    - VERIFY: Subtask hash includes id, title, context_scope
    - VERIFY: Subtask hash excludes status, dependencies, story_points
  - IMPLEMENT: test 'should use deterministic JSON serialization'
    - This is verified by inspecting prp-generator.ts line 246
    - Document that JSON.stringify uses null, 0 (no whitespace)
  - DEPENDENCIES: Task 6 (template tests complete)

Task 8: IMPLEMENT cache TTL and behavior tests
  - CREATE: describe block 'cache TTL and behavior'
  - IMPLEMENT: test 'should have 24-hour TTL'
    - VERIFY: CACHE_TTL_MS constant equals 86400000
  - IMPLEMENT: test 'should check file mtime for cache age'
    - This is verified by inspecting prp-generator.ts lines 263-272
    - Document that #isCacheRecent uses stat().mtimeMs
  - IMPLEMENT: test 'should return false for non-existent cache file'
    - This is verified by inspecting prp-generator.ts line 268-270
    - Document that #isCacheRecent returns false on ENOENT
  - DEPENDENCIES: Task 7 (hash tests complete)

Task 9: IMPLEMENT cache directory and path tests
  - CREATE: describe block 'cache directory and path generation'
  - IMPLEMENT: test 'should generate correct cache path for PRP markdown'
    - SETUP: Create PRPGenerator instance
    - EXECUTE: Call getCachePath('P1.M1.T1.S1')
    - VERIFY: Returns path ending with 'prps/P1_M1_T1_S1.md'
  - IMPLEMENT: test 'should generate correct cache metadata path'
    - EXECUTE: Call getCacheMetadataPath('P1.M1.T1.S1')
    - VERIFY: Returns path ending with 'prps/.cache/P1_M1_T1_S1.json'
  - IMPLEMENT: test 'should sanitize task ID for filename'
    - VERIFY: Dots replaced with underscores
  - DEPENDENCIES: Task 8 (TTL tests complete)

Task 10: IMPLEMENT cache metadata structure tests
  - CREATE: describe block 'cache metadata structure'
  - IMPLEMENT: test 'should store correct metadata fields'
    - This is verified by inspecting PRPCacheMetadata interface (lines 96-103)
    - VERIFY: Contains taskId, taskHash, createdAt, accessedAt, version, prp
  - IMPLEMENT: test 'should use version 1.0'
    - This is verified by inspecting prp-generator.ts line 327
  - IMPLEMENT: test 'should store full PRPDocument in metadata'
    - This is verified by inspecting prp-generator.ts line 328
  - DEPENDENCIES: Task 9 (path tests complete)

Task 11: IMPLEMENT mock Groundswell agent integration tests
  - CREATE: describe block 'mock Groundswell agent integration'
  - IMPLEMENT: test 'should return mock PRPDocument data'
    - SETUP: Mock createAgent to return controlled response
    - EXECUTE: Call createResearcherAgent() then agent.prompt()
    - VERIFY: Returns expected PRPDocument structure
  - IMPLEMENT: test 'should allow deterministic testing with mocks'
    - SETUP: Set up specific mock return values
    - EXECUTE: Run test multiple times
    - VERIFY: Consistent output (no random LLM variation)
  - IMPLEMENT: test 'should validate output against PRPDocumentSchema'
    - SETUP: Mock agent to return PRPDocument
    - EXECUTE: Call PRPDocumentSchema.safeParse(result)
    - VERIFY: Validation succeeds
  - DEPENDENCIES: Task 10 (metadata tests complete)

Task 12: VERIFY all tests follow project patterns
  - VERIFY: Test file uses vi.mock for Groundswell (NOT agent-factory)
  - VERIFY: Each test has SETUP/EXECUTE/VERIFY comments
  - VERIFY: Mock variables use proper hoisting patterns
  - VERIFY: Test file location matches conventions (tests/integration/)
  - VERIFY: afterEach cleanup includes vi.unstubAllEnvs()
  - VERIFY: Tests validate actual createResearcherAgent() (not mocked)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Top-level Groundswell mock (tests real agent-factory)
import { afterEach, describe, expect, it, vi, beforeAll } from 'vitest';

// CRITICAL: Mock Groundswell, NOT agent-factory
// This allows testing the real createResearcherAgent() function
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});

// Dynamic import ensures mocks are applied
async function loadGroundswell() {
  return await import('groundswell');
}

// PATTERN: Test structure with beforeAll for dynamic imports
describe('integration/researcher-agent', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // ... tests
});

// PATTERN: Configuration verification test
it('should create researcher agent with GLM-4.7 model', () => {
  // SETUP: Import real agent-factory after mocks
  const {
    createResearcherAgent,
  } = require('../../src/agents/agent-factory.js');
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  // EXECUTE: Create researcher agent
  createResearcherAgent();

  // VERIFY: createAgent called with correct config
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'ResearcherAgent',
      model: 'GLM-4.7',
      system: PRP_BLUEPRINT_PROMPT,
      maxTokens: 4096,
      enableCache: true,
    })
  );
});

// PATTERN: MCP tools verification
it('should create researcher agent with MCP tools', () => {
  const {
    createResearcherAgent,
  } = require('../../src/agents/agent-factory.js');
  const {
    BASH_MCP,
    FILESYSTEM_MCP,
    GIT_MCP,
  } = require('../../src/tools/index.js');

  // EXECUTE
  createResearcherAgent();

  // VERIFY: MCP tools passed to config
  expect(gs.createAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP],
    })
  );
});

// PATTERN: Prompt structure validation test
it('should contain Research Process section', () => {
  // SETUP: Import PRP_CREATE_PROMPT
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  // VERIFY: Contains key phrases from Research Process section
  expect(PRP_BLUEPRINT_PROMPT).toContain('Research Process');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Codebase Analysis in depth');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Internal Research at scale');
  expect(PRP_BLUEPRINT_PROMPT).toContain('External Research at scale');
  expect(PRP_BLUEPRINT_PROMPT).toContain('User Clarification');
});

// PATTERN: PRP Generation Process validation
it('should contain PRP Generation Process section', () => {
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  expect(PRP_BLUEPRINT_PROMPT).toContain('PRP Generation Process');
  expect(PRP_BLUEPRINT_PROMPT).toContain('Step 1: Review Template');
  expect(PRP_BLUEPRINT_PROMPT).toContain(
    'Step 2: Context Completeness Validation'
  );
  expect(PRP_BLUEPRINT_PROMPT).toContain('Step 3: Research Integration');
  expect(PRP_BLUEPRINT_PROMPT).toContain(
    'Step 4: Information Density Standards'
  );
  expect(PRP_BLUEPRINT_PROMPT).toContain('Step 5: ULTRATHINK Before Writing');
});

// PATTERN: Subagent spawning instruction validation
it('should instruct to spawn subagents', () => {
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  expect(PRP_BLUEPRINT_PROMPT).toContain('spawn subagents');
  expect(PRP_BLUEPRINT_PROMPT).toContain('batch tools');
});

// PATTERN: TodoWrite tool instruction validation
it('should instruct to use TodoWrite tool', () => {
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  expect(PRP_BLUEPRINT_PROMPT).toContain('TodoWrite');
  expect(PRP_BLUEPRINT_PROMPT).toContain(
    'create comprehensive PRP writing plan'
  );
});

// PATTERN: Architecture directory instruction validation
it('should mention architecture/ directory', () => {
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  expect(PRP_BLUEPRINT_PROMPT).toContain('$SESSION_DIR/architecture/');
  expect(PRP_BLUEPRINT_PROMPT).toContain('store architectural findings');
});

// PATTERN: PRP template section validation
it('should contain Goal section in template', () => {
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  expect(PRP_BLUEPRINT_PROMPT).toContain('## Goal');
  expect(PRP_BLUEPRINT_PROMPT).toContain('**Feature Goal**:');
  expect(PRP_BLUEPRINT_PROMPT).toContain('**Deliverable**:');
  expect(PRP_BLUEPRINT_PROMPT).toContain('**Success Definition**:');
});

// PATTERN: Template validation for all sections
it('should contain all required PRP template sections', () => {
  const { PRP_BLUEPRINT_PROMPT } = require('../../src/agents/prompts.js');

  // Main sections
  expect(PRP_BLUEPRINT_PROMPT).toContain('## Goal');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## User Persona');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## Why');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## What');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## All Needed Context');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## Implementation Blueprint');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## Validation Loop');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## Final Validation Checklist');
  expect(PRP_BLUEPRINT_PROMPT).toContain('## Anti-Patterns to Avoid');
});

// PATTERN: Cache path generation test
it('should generate correct cache path for PRP markdown', () => {
  // SETUP: Create PRPGenerator with mock SessionManager
  const { PRPGenerator } = require('../../src/agents/prp-generator.js');
  const mockSessionManager = {
    currentSession: {
      metadata: { path: '/test/session' },
    },
  };
  const generator = new PRPGenerator(mockSessionManager, false);

  // EXECUTE
  const cachePath = generator.getCachePath('P1.M1.T1.S1');

  // VERIFY: Correct path format
  expect(cachePath).toBe('/test/session/prps/P1_M1_T1_S1.md');
});

// PATTERN: Cache metadata path test
it('should generate correct cache metadata path', () => {
  const { PRPGenerator } = require('../../src/agents/prp-generator.js');
  const mockSessionManager = {
    currentSession: {
      metadata: { path: '/test/session' },
    },
  };
  const generator = new PRPGenerator(mockSessionManager, false);

  // EXECUTE
  const metadataPath = generator.getCacheMetadataPath('P1.M1.T1.S1');

  // VERIFY: Correct path format
  expect(metadataPath).toBe('/test/session/prps/.cache/P1_M1_T1_S1.json');
});

// PATTERN: Mock agent integration test
it('should return mock PRPDocument data', async () => {
  // SETUP: Mock agent with controlled response
  const mockPRP = createMockPRPDocument('P1.M1.T1.S1');
  gs.createAgent.mockReturnValue({
    prompt: vi.fn().mockResolvedValue(mockPRP),
  });

  // EXECUTE: Call researcher agent
  const {
    createResearcherAgent,
  } = require('../../src/agents/agent-factory.js');
  const researcher = createResearcherAgent();
  const result = await researcher.prompt({ user: 'test', system: 'test' });

  // VERIFY: Returns expected structure
  expect(result).toEqual(mockPRP);
});

// PATTERN: Schema validation test
it('should validate output against PRPDocumentSchema', () => {
  // SETUP: Create mock PRPDocument
  const mockPRP = createMockPRPDocument('P1.M1.T1.S1');
  const { PRPDocumentSchema } = require('../../src/core/models.js');

  // EXECUTE: Validate against schema
  const result = PRPDocumentSchema.safeParse(mockPRP);

  // VERIFY: Validation succeeds
  expect(result.success).toBe(true);
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN TESTS:
  - Tests use mocks for file operations (mkdir, writeFile, stat, readFile)
  - Focus on Researcher Agent configuration and cache logic
  - Mock Groundswell agent.prompt() calls

MOCK INTEGRATIONS:
  - Mock: groundswell (createAgent) - control agent creation
  - Real: src/agents/agent-factory.js (test real factory)
  - Real: src/agents/prompts.js (import real PRP_BLUEPRINT_PROMPT)
  - Real: src/agents/prp-generator.ts (test cache path methods)

DEPENDENCY ON PREVIOUS WORK ITEM:
  - P1.M1.T3.S1 provides Architect Agent integration test patterns
  - Reference for mock setup and validation patterns

PARALLEL CONTEXT:
  - P1.M1.T3.S1 (Verify Architect Agent integration and prompts)
  - That PRP tests Architect Agent configuration
  - This PRP tests Researcher Agent configuration
  - No overlap or conflict in test coverage
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- tests/integration/researcher-agent.test.ts
# OR
npx eslint tests/integration/researcher-agent.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- tests/integration/researcher-agent.test.ts
# OR
npx vitest run tests/integration/researcher-agent.test.ts

# Run with coverage
npm test -- --coverage tests/integration/researcher-agent.test.ts

# Run all agent-related tests to ensure no breakage
npm test -- tests/unit/agents/agent-factory.test.ts
npm test -- tests/integration/agents.test.ts
npm test -- tests/integration/prp-blueprint-agent.test.ts

# Expected: All tests pass, good coverage for Researcher Agent configuration
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify full integration test suite still passes
npm test -- tests/integration/
# OR
npx vitest run tests/integration/

# Check that existing tests still work
npx vitest run tests/integration/groundswell/
npx vitest run tests/integration/agents.test.ts

# Expected: All existing integration tests still pass, no regressions
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/integration/researcher-agent.test.ts

# Check test file follows project conventions
head -100 tests/integration/researcher-agent.test.ts
# Should see: describe blocks, SETUP/EXECUTE/VERIFY comments, proper imports

# Run tests in watch mode to verify stability
npx vitest watch tests/integration/researcher-agent.test.ts
# Run multiple times to ensure no flaky tests

# Verify test coverage for Researcher Agent configuration
npm test -- --coverage tests/integration/researcher-agent.test.ts
# Should see coverage for createResearcherAgent, PRPGenerator cache methods

# Expected: Test file is well-structured, tests pass consistently
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] All tests pass: `npm test -- tests/integration/researcher-agent.test.ts`
- [ ] No linting errors: `npm run lint tests/integration/researcher-agent.test.ts`
- [ ] Coverage shows Researcher Agent configuration tested
- [ ] No existing tests broken by changes

### Feature Validation

- [ ] Researcher Agent configuration verified (GLM-4.7, 4096, cache, MCP tools)
- [ ] PRP_CREATE_PROMPT contains Research Process section (4 subsections)
- [ ] PRP_CREATE_PROMPT contains PRP Generation Process section (5 steps)
- [ ] PRP_CREATE_PROMPT contains PRP-README and PRP-TEMPLATE
- [ ] PRP template contains all 8+ required sections
- [ ] Prompt mentions subagent spawning, TodoWrite, architecture/
- [ ] Cache hash uses SHA-256 with correct fields
- [ ] Cache TTL is 24 hours
- [ ] Cache paths generated correctly (prps/ and prps/.cache/)
- [ ] Mock Groundswell agent returns test PRPDocument

### Code Quality Validation

- [ ] Follows existing integration test patterns from agent-prompt.test.ts
- [ ] Uses SETUP/EXECUTE/VERIFY comments in each test
- [ ] Mock setup uses vi.mock for Groundswell (not agent-factory)
- [ ] Test file location matches conventions (tests/integration/)
- [ ] afterEach cleanup includes vi.unstubAllEnvs()
- [ ] Tests use dynamic import pattern for Groundswell

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Complex validations (prompt sections, cache) have explanatory comments
- [ ] Test names clearly describe what is being tested
- [ ] Documentation of aspirational features (subagent spawning)

---

## Anti-Patterns to Avoid

- ❌ Don't mock createResearcherAgent - test the real factory function
- ❌ Don't test aspirational features as implemented - verify prompt contains instructions
- ❌ Don't duplicate existing tests from prp-generator-integration.test.ts
- ❌ Don't test LLM output quality - focus on configuration and prompt structure
- ❌ Don't use real LLM calls - always use mocks for deterministic testing
- ❌ Don't skip vi.unstubAllEnvs() in afterEach
- ❌ Don't use setTimeout without proper waiting/awaiting
- ❌ Don't skip testing the required prompt sections
- ❌ Don't write tests without SETUP/EXECUTE/VERIFY comments
- ❌ Don't hardcode configuration values - use imports from source
- ❌ Don't test unit-level behavior - focus on integration scenarios
- ❌ Don't forget to validate both configuration AND prompt content
- ❌ Don't confuse Task hash fields vs Subtask hash fields
- ❌ Don't use sync functions in async context
- ❌ Don't catch all exceptions - be specific
- ❌ Don't create temp directories - this test doesn't need file I/O
- ❌ Don't mock the entire agent-factory - mock Groundswell instead

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T3.S2
**Created:** 2026-01-19
**Status:** Ready for Implementation
