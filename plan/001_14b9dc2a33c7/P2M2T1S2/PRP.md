# PRP: P2.M2.T1.S2 - Test Architect Agent with PRD

---

## Goal

**Feature Goal**: Create the first integration test for the PRP Pipeline that validates the Architect Agent's ability to decompose a PRD into a structured, valid backlog JSON conforming to the `BacklogSchema`.

**Deliverable**: `tests/integration/architect-agent.test.ts` - an integration test file that:

- Reads the actual PRD.md from the project root
- Creates an Architect agent using the factory function
- Generates a prompt using `createArchitectPrompt(prdContent)`
- Executes the agent with the prompt
- Validates the returned backlog matches `BacklogSchema`
- Verifies the hierarchy structure (at least one phase)
- Validates story_points are integers in the valid range (1-21)
- Logs sample output for manual inspection

**Success Definition**:

- Integration test file created at `tests/integration/architect-agent.test.ts`
- Test can be executed with `npm run test -- architect-agent.test.ts`
- Test validates agent output against `BacklogSchema`
- Test verifies structural requirements (phases, milestones, tasks, subtasks)
- Test includes proper mocking for agent responses (or uses real LLM with timeout)
- Sample output is logged for inspection
- All existing unit tests still pass

## Why

- **Foundation for Agent Testing**: This is the first integration test in the codebase. It establishes the pattern for testing agent workflows that will be replicated for Researcher, Coder, and QA agents.

- **Validates End-to-End Architect Flow**: The unit tests validate schemas and configurations in isolation. This test validates the complete flow: PRD input → Architect agent → Structured backlog output.

- **Catches Schema-LLM Mismatches**: The test ensures that the LLM output from the real Architect agent actually conforms to the `BacklogSchema`. This catches issues the unit tests can't detect.

- **Documents Expected Behavior**: By logging sample output, this test serves as documentation of what the Architect Agent produces when processing the PRD.

- **Enables Confidence in Pipeline**: Before building the full pipeline, we need confidence that the Architect Agent can successfully decompose the PRD into valid JSON.

## What

Create `tests/integration/architect-agent.test.ts` with tests that:

1. **Read PRD.md from project root** - Use the actual PRD document as test input
2. **Create Architect agent** - Use `createArchitectAgent()` from agent factory
3. **Generate prompt** - Use `createArchitectPrompt(prdContent)` to create the structured prompt
4. **Execute agent** - Call `agent.prompt(prompt)` and await the result
5. **Validate with Zod** - Use `BacklogSchema.safeParse()` to validate the output structure
6. **Verify hierarchy** - Check that the backlog contains at least one phase with proper nesting
7. **Validate story_points** - Ensure all story_points are integers in range [1, 21]
8. **Log sample output** - Output a sample of the generated backlog for inspection

### Success Criteria

- [ ] Integration test file created at `tests/integration/architect-agent.test.ts`
- [ ] Test reads PRD.md from project root successfully
- [ ] Test creates Architect agent using factory function
- [ ] Test generates prompt using `createArchitectPrompt()`
- [ ] Test validates output against `BacklogSchema`
- [ ] Test verifies at least one phase exists in backlog
- [ ] Test validates story_points are integers 1-21 (not 0.5 - see Gotchas)
- [ ] Test logs sample output for inspection
- [ ] All existing unit tests still pass (`npm run test`)
- [ ] Integration test can run standalone (`npm run test -- architect-agent.test.ts`)

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Exact test file location and naming conventions
- Complete import patterns with specific file paths
- The full testing framework setup (Vitest configuration)
- Mocking patterns for agent responses
- Zod validation patterns from existing tests
- Agent factory and prompt generator API documentation
- BacklogSchema structure and validation rules
- Known gotchas (story_points discrepancy)
- Validation commands that are project-specific

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: tests/unit/agents/agent-factory.test.ts
  why: Excellent example of test patterns, mocking, and Vitest usage in this codebase
  pattern: describe/it structure, beforeEach/afterEach cleanup, vi.stubEnv() usage
  gotcha: Always call vi.unstubAllEnvs() in afterEach

- file: tests/unit/core/models.test.ts
  why: Comprehensive Zod schema validation patterns for BacklogSchema
  pattern: safeParse() usage, error validation, recursive structure testing
  gotcha: Tests both valid and invalid inputs for each schema

- file: src/agents/agent-factory.ts
  why: createArchitectAgent() factory function and Groundswell Agent type
  pattern: Agent creation with system prompt and MCP tools
  section: Lines 185-193 for createArchitectAgent() implementation

- file: src/agents/prompts/architect-prompt.ts
  why: createArchitectPrompt() function that generates structured prompts
  pattern: createPrompt() usage with responseFormat and enableReflection
  section: Lines 51-67 for function signature and implementation

- file: src/core/models.ts
  why: BacklogSchema definition and story_points validation rules
  pattern: Zod schema composition with recursive definitions
  gotcha: story_points validates integers 1-21, NOT 0.5 (see discrepancy below)
  section: Lines 246-250 for SubtaskSchema story_points validation

- file: vitest.config.ts
  why: Vitest configuration with coverage thresholds and test patterns
  pattern: Test location globs, coverage settings, path aliases
  section: Lines 14-37 for testMatch and coverage configuration

- file: plan/001_14b9dc2a33c7/P2M2T1S1/PRP.md
  why: Excellent example PRP format and structure for reference
  pattern: Context completeness check, implementation tasks, validation gates

- docfile: plan/001_14b9dc2a33c7/P2M2T1S1/research/zod_groundswell_best_practices.md
  why: Integration patterns for Zod schemas with Groundswell agents
  section: Mocking vs Real LLM Calls section

- url: https://vitest.dev/guide/
  why: Complete Vitest testing framework documentation
  critical: describe/it syntax, vi.mock() patterns, async testing

- url: https://zod.dev/
  why: Zod schema validation documentation
  critical: safeParse() API, error handling, type inference
```

### Current Codebase Tree (Relevant Sections)

```bash
tests/
├── unit/                      # Unit tests (100% coverage requirement)
│   ├── agents/
│   │   ├── agent-factory.test.ts    # Agent factory testing patterns
│   │   └── prompts.test.ts
│   ├── core/
│   │   ├── models.test.ts           # Zod schema validation patterns
│   │   ├── session-utils.test.ts
│   │   └── task-utils.test.ts
│   ├── config/
│   └── tools/
├── manual/                    # Manual validation scripts
├── validation/                # API validation tests
└── integration/               # NEW: Integration tests directory (to be created)
    └── architect-agent.test.ts     # NEW: This PRP's deliverable

src/
├── agents/
│   ├── agent-factory.ts       # createArchitectAgent() function
│   ├── prompts.ts             # TASK_BREAKDOWN_PROMPT constant
│   └── prompts/
│       └── architect-prompt.ts     # createArchitectPrompt() function
├── core/
│   └── models.ts              # BacklogSchema, PhaseSchema, SubtaskSchema
├── config/
│   └── environment.ts         # Environment configuration
└── tools/

PRD.md                        # Project PRD (test input)
plan/001_14b9dc2a33c7/
    ├── P2M2T1S1/              # Previous subtask with related research
    │   ├── PRP.md
    │   └── research/
    └── P2M2T1S2/              # This subtask
        └── PRP.md            # This file
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: story_points Validation Discrepancy
// The work item mentions "0.5, 1, or 2" story points
// BUT the actual schema in models.ts validates integers 1-21:
//
//   story_points: z.number().int().min(1).max(21)
//
// The PROMPTS.md documentation mentions 0.5 but the schema requires integers
// For this test, validate against the ACTUAL schema (integers 1-21)
// This discrepancy may need to be resolved in a future task

// CRITICAL: Import paths must use .js extension for ES modules
// Even though source files are .ts, imports use .js extension:
import { createArchitectAgent } from '../../src/agents/agent-factory.js';

// CRITICAL: Environment variables must be set for agent creation
// The agent-factory.ts calls configureEnvironment() at module load time
// Ensure ANTHROPIC_API_KEY is set in test environment

// GOTCHA: Integration tests should use longer timeouts for LLM calls
// Use { timeout: 30000 } or higher for tests that call real LLMs
it('should decompose PRD', async () => { ... }, { timeout: 30000 });

// GOTCHA: Mock vs Real LLM Decision
// Option 1: Mock agent.prompt() for fast, deterministic tests
// Option 2: Use real LLM for true integration testing (slower, costs API credits)
// This PRP should support BOTH modes with a conditional flag

// GOTCHA: Vitest cleanup patterns
// Always call vi.unstubAllEnvs() in afterEach to prevent test pollution
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// GOTCHA: The tests/integration/ directory doesn't exist yet
// It must be created as part of this PRP
```

## Implementation Blueprint

### Data Models and Structure

No new data models. This test uses existing models:

- `BacklogSchema` from `src/core/models.ts`
- `Agent` type from `groundswell`
- `Prompt` type from `groundswell`

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE tests/integration directory
  - IMPLEMENT: Create new integration test directory
  - NAMING: tests/integration/ (kebab-case directory name)
  - PLACEMENT: Under tests/ alongside unit/, manual/, validation/
  - DEPENDENCIES: None

Task 2: CREATE tests/integration/architect-agent.test.ts
  - IMPLEMENT: Integration test file with proper imports and test structure
  - FOLLOW pattern: tests/unit/agents/agent-factory.test.ts for test structure
  - NAMING: architect-agent.test.ts (kebab-case with .test.ts suffix)
  - PLACEMENT: tests/integration/architect-agent.test.ts
  - DEPENDENCIES: Task 1 (directory must exist)

Task 3: IMPLEMENT describe block and test setup
  - IMPLEMENT: Main describe block with proper naming and cleanup
  - FOLLOW pattern: tests/unit/agents/agent-factory.test.ts lines 16-21
  - NAMING: describe('integration/architect-agent', () => { ... })
  - DEPENDENCIES: Task 2 (file must exist)

Task 4: IMPLEMENT test: read PRD and create agent
  - IMPLEMENT: Test that reads PRD.md and creates architect agent
  - PATTERN: Use fs/promises for file reading, createArchitectAgent() for agent
  - VALIDATION: Assert PRD content is non-empty string, agent is defined
  - DEPENDENCIES: Task 3 (describe block must exist)

Task 5: IMPLEMENT test: validate architect output structure
  - IMPLEMENT: Test that validates agent output against BacklogSchema
  - PATTERN: Use BacklogSchema.safeParse(), check result.success
  - VALIDATION: Verify backlog array exists with at least one phase
  - DEPENDENCIES: Task 4 (agent creation test must pass)

Task 6: IMPLEMENT test: validate story_points and hierarchy
  - IMPLEMENT: Test that validates story_points range and hierarchy depth
  - PATTERN: Recursive traversal through phases -> milestones -> tasks -> subtasks
  - VALIDATION: All story_points are integers in [1, 21], at least 4 levels deep
  - DEPENDENCIES: Task 5 (structure validation must pass)

Task 7: IMPLEMENT sample output logging
  - IMPLEMENT: Log a sample of the generated backlog for manual inspection
  - PATTERN: Use console.log with JSON.stringify for pretty output
  - CONTENT: First phase with first milestone/task/subtask for size limits
  - DEPENDENCIES: Task 6 (validation tests must pass)

Task 8: VERIFY all tests pass
  - IMPLEMENT: Run integration test and verify it passes
  - COMMAND: npm run test -- architect-agent.test.ts
  - EXPECTED: All tests pass, sample output logged
  - DEPENDENCIES: Task 7 (all tests implemented)
```

### Implementation Patterns & Key Details

```typescript
/**
 * Integration test for Architect Agent PRD decomposition
 *
 * @remarks
 * Tests the complete flow: PRD input → Architect agent → Structured backlog
 * This is the first integration test in the codebase and serves as a pattern
 * for future agent integration tests (Researcher, Coder, QA).
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createArchitectAgent } from '../../src/agents/agent-factory.js';
import { createArchitectPrompt } from '../../src/agents/prompts/architect-prompt.js';
import { BacklogSchema, type Backlog } from '../../src/core/models.js';

// PATTERN: Test-wide constants
const PRD_PATH = resolve(process.cwd(), 'PRD.md');
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true'; // Flag for real vs mocked

describe('integration/architect-agent', () => {
  // CLEANUP: Always restore mocks after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // PATTERN: Test 1 - Verify setup and agent creation
  describe('setup', () => {
    it('should read PRD.md from project root', async () => {
      // SETUP: Read PRD file
      const prdContent = await readFile(PRD_PATH, 'utf-8');

      // VERIFY: PRD content is non-empty string
      expect(prdContent).toBeTruthy();
      expect(prdContent.length).toBeGreaterThan(0);
      expect(prdContent).toContain('# Product Requirements Document');
    });

    it('should create architect agent using factory', () => {
      // SETUP: Ensure environment is configured
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

      // EXECUTE: Create agent
      const agent = createArchitectAgent();

      // VERIFY: Agent is defined and has expected properties
      expect(agent).toBeDefined();
      expect(typeof agent.prompt).toBe('function');
    });
  });

  // PATTERN: Test 2 - Validate architect output structure
  describe('architect output validation', () => {
    it(
      'should generate valid backlog matching BacklogSchema',
      async () => {
        // SETUP: Read PRD and create agent
        vi.stubEnv(
          'ANTHROPIC_AUTH_TOKEN',
          process.env.ANTHROPIC_API_KEY || 'test-key'
        );
        vi.stubEnv(
          'ANTHROPIC_BASE_URL',
          process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'
        );

        const prdContent = await readFile(PRD_PATH, 'utf-8');
        const architect = createArchitectAgent();
        const prompt = createArchitectPrompt(prdContent);

        // DECISION: Use mock or real LLM based on flag
        if (USE_REAL_LLM) {
          // EXECUTE: Real LLM call with timeout
          const result = await architect.prompt(prompt);

          // VERIFY: Validate against BacklogSchema
          const validation = BacklogSchema.safeParse(result);
          expect(validation.success).toBe(true);

          if (validation.success) {
            expect(validation.data.backlog).toBeInstanceOf(Array);
            expect(validation.data.backlog.length).toBeGreaterThan(0);
          }
        } else {
          // MOCK: Return fixture data for fast, deterministic testing
          const mockBacklog: Backlog = {
            backlog: [
              {
                id: 'P1',
                type: 'Phase',
                title: 'Phase 1: Foundation & Environment Setup',
                status: 'Planned',
                description: 'Project initialization',
                milestones: [
                  {
                    id: 'P1.M1',
                    type: 'Milestone',
                    title: 'Milestone 1.1: Project Initialization',
                    status: 'Planned',
                    description: 'Initialize TypeScript project',
                    tasks: [
                      {
                        id: 'P1.M1.T1',
                        type: 'Task',
                        title: 'Initialize TypeScript Project',
                        status: 'Planned',
                        description: 'Set up package.json',
                        subtasks: [
                          {
                            id: 'P1.M1.T1.S1',
                            type: 'Subtask',
                            title: 'Initialize package.json with dependencies',
                            status: 'Planned',
                            story_points: 1,
                            dependencies: [],
                            context_scope:
                              'CONTRACT DEFINITION: Create package.json',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          };

          // MOCK: Agent.prompt() returns fixture data
          vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);

          // EXECUTE: Call agent
          const result = await architect.prompt(prompt);

          // VERIFY: Validate against BacklogSchema
          const validation = BacklogSchema.safeParse(result);
          expect(validation.success).toBe(true);
          expect(validation.data).toEqual(mockBacklog);
        }
      },
      { timeout: 30000 }
    ); // Longer timeout for LLM calls

    // PATTERN: Test 3 - Validate hierarchy structure
    it(
      'should contain at least one phase with proper nesting',
      async () => {
        // SETUP: Similar to above test
        vi.stubEnv(
          'ANTHROPIC_AUTH_TOKEN',
          process.env.ANTHROPIC_API_KEY || 'test-key'
        );
        vi.stubEnv(
          'ANTHROPIC_BASE_URL',
          process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'
        );

        const prdContent = await readFile(PRD_PATH, 'utf-8');
        const architect = createArchitectAgent();
        const prompt = createArchitectPrompt(prdContent);

        if (USE_REAL_LLM) {
          const result = await architect.prompt(prompt);
          const validation = BacklogSchema.safeParse(result);

          expect(validation.success).toBe(true);
          if (validation.success) {
            // VERIFY: At least one phase exists
            expect(validation.data.backlog.length).toBeGreaterThan(0);

            // VERIFY: First phase has at least one milestone
            const firstPhase = validation.data.backlog[0];
            expect(firstPhase.milestones.length).toBeGreaterThan(0);

            // VERIFY: First milestone has at least one task
            const firstMilestone = firstPhase.milestones[0];
            expect(firstMilestone.tasks.length).toBeGreaterThan(0);

            // VERIFY: First task has at least one subtask
            const firstTask = firstMilestone.tasks[0];
            expect(firstTask.subtasks.length).toBeGreaterThan(0);
          }
        } else {
          // MOCK: Use fixture data
          const mockBacklog: Backlog = {
            backlog: [
              {
                id: 'P1',
                type: 'Phase',
                title: 'Test Phase',
                status: 'Planned',
                description: 'Test',
                milestones: [
                  {
                    id: 'P1.M1',
                    type: 'Milestone',
                    title: 'Test Milestone',
                    status: 'Planned',
                    description: 'Test',
                    tasks: [
                      {
                        id: 'P1.M1.T1',
                        type: 'Task',
                        title: 'Test Task',
                        status: 'Planned',
                        description: 'Test',
                        subtasks: [
                          {
                            id: 'P1.M1.T1.S1',
                            type: 'Subtask',
                            title: 'Test Subtask',
                            status: 'Planned',
                            story_points: 2,
                            dependencies: [],
                            context_scope: 'Test',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          };

          vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);
          const result = await architect.prompt(prompt);

          expect(
            result.backlog[0].milestones[0].tasks[0].subtasks[0]
          ).toBeDefined();
        }
      },
      { timeout: 30000 }
    );

    // PATTERN: Test 4 - Validate story_points
    it(
      'should validate story_points are integers in range [1, 21]',
      async () => {
        // SETUP: Similar to above
        vi.stubEnv(
          'ANTHROPIC_AUTH_TOKEN',
          process.env.ANTHROPIC_API_KEY || 'test-key'
        );
        vi.stubEnv(
          'ANTHROPIC_BASE_URL',
          process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'
        );

        const prdContent = await readFile(PRD_PATH, 'utf-8');
        const architect = createArchitectAgent();
        const prompt = createArchitectPrompt(prdContent);

        if (USE_REAL_LLM) {
          const result = await architect.prompt(prompt);
          const validation = BacklogSchema.safeParse(result);

          expect(validation.success).toBe(true);
          if (validation.success) {
            // VERIFY: Traverse all subtasks and validate story_points
            const validateStoryPoints = (backlog: Backlog) => {
              for (const phase of backlog.backlog) {
                for (const milestone of phase.milestones) {
                  for (const task of milestone.tasks) {
                    for (const subtask of task.subtasks) {
                      // CRITICAL: Validate against actual schema (integers 1-21)
                      expect(Number.isInteger(subtask.story_points)).toBe(true);
                      expect(subtask.story_points).toBeGreaterThanOrEqual(1);
                      expect(subtask.story_points).toBeLessThanOrEqual(21);

                      // GOTCHA: 0.5 is NOT valid per the schema
                      // Even though PROMPTS.md mentions 0.5, the schema requires integers
                    }
                  }
                }
              }
            };

            validateStoryPoints(validation.data);
          }
        } else {
          // MOCK: Test with valid integer story_points
          const mockBacklog: Backlog = {
            backlog: [
              {
                id: 'P1',
                type: 'Phase',
                title: 'Test Phase',
                status: 'Planned',
                description: 'Test',
                milestones: [
                  {
                    id: 'P1.M1',
                    type: 'Milestone',
                    title: 'Test Milestone',
                    status: 'Planned',
                    description: 'Test',
                    tasks: [
                      {
                        id: 'P1.M1.T1',
                        type: 'Task',
                        title: 'Test Task',
                        status: 'Planned',
                        description: 'Test',
                        subtasks: [
                          {
                            id: 'P1.M1.T1.S1',
                            type: 'Subtask',
                            title: 'S1',
                            status: 'Planned',
                            story_points: 1,
                            dependencies: [],
                            context_scope: 'Test',
                          },
                          {
                            id: 'P1.M1.T1.S2',
                            type: 'Subtask',
                            title: 'S2',
                            status: 'Planned',
                            story_points: 2,
                            dependencies: [],
                            context_scope: 'Test',
                          },
                          {
                            id: 'P1.M1.T1.S3',
                            type: 'Subtask',
                            title: 'S3',
                            status: 'Planned',
                            story_points: 3,
                            dependencies: [],
                            context_scope: 'Test',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          };

          vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);
          const result = await architect.prompt(prompt);

          // VERIFY: All story_points are valid
          result.backlog[0].milestones[0].tasks[0].subtasks.forEach(subtask => {
            expect(Number.isInteger(subtask.story_points)).toBe(true);
            expect(subtask.story_points).toBeGreaterThanOrEqual(1);
            expect(subtask.story_points).toBeLessThanOrEqual(21);
          });
        }
      },
      { timeout: 30000 }
    );

    // PATTERN: Test 5 - Log sample output
    it(
      'should log sample output for inspection',
      async () => {
        // SETUP: Similar to above
        vi.stubEnv(
          'ANTHROPIC_AUTH_TOKEN',
          process.env.ANTHROPIC_API_KEY || 'test-key'
        );
        vi.stubEnv(
          'ANTHROPIC_BASE_URL',
          process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'
        );

        const prdContent = await readFile(PRD_PATH, 'utf-8');
        const architect = createArchitectAgent();
        const prompt = createArchitectPrompt(prdContent);

        if (USE_REAL_LLM) {
          const result = await architect.prompt(prompt);

          // LOG: Sample output for manual inspection
          console.log('\n=== Architect Agent Sample Output ===');
          console.log('Total Phases:', result.backlog.length);

          if (result.backlog.length > 0) {
            const firstPhase = result.backlog[0];
            console.log('\nFirst Phase:', firstPhase.id, '-', firstPhase.title);

            if (firstPhase.milestones.length > 0) {
              const firstMilestone = firstPhase.milestones[0];
              console.log(
                '  First Milestone:',
                firstMilestone.id,
                '-',
                firstMilestone.title
              );

              if (firstMilestone.tasks.length > 0) {
                const firstTask = firstMilestone.tasks[0];
                console.log(
                  '    First Task:',
                  firstTask.id,
                  '-',
                  firstTask.title
                );

                if (firstTask.subtasks.length > 0) {
                  const firstSubtask = firstTask.subtasks[0];
                  console.log('      First Subtask:', firstSubtask.id);
                  console.log('        Title:', firstSubtask.title);
                  console.log(
                    '        Story Points:',
                    firstSubtask.story_points
                  );
                }
              }
            }
          }

          // LOG: Full JSON sample (truncated for size)
          console.log('\n=== Full Backlog JSON (first 500 chars) ===');
          console.log(JSON.stringify(result, null, 2).slice(0, 500) + '...');
        } else {
          // MOCK: Log fixture data
          const mockBacklog: Backlog = {
            backlog: [
              {
                id: 'P1',
                type: 'Phase',
                title: 'Sample Phase',
                status: 'Planned',
                description: 'Sample description',
                milestones: [
                  {
                    id: 'P1.M1',
                    type: 'Milestone',
                    title: 'Sample Milestone',
                    status: 'Planned',
                    description: 'Sample',
                    tasks: [
                      {
                        id: 'P1.M1.T1',
                        type: 'Task',
                        title: 'Sample Task',
                        status: 'Planned',
                        description: 'Sample',
                        subtasks: [
                          {
                            id: 'P1.M1.T1.S1',
                            type: 'Subtask',
                            title: 'Sample Subtask',
                            status: 'Planned',
                            story_points: 2,
                            dependencies: [],
                            context_scope: 'Sample context',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          };

          vi.spyOn(architect, 'prompt').mockResolvedValue(mockBacklog);
          const result = await architect.prompt(prompt);

          console.log('\n=== Mock Architect Agent Output ===');
          console.log(
            'Sample Subtask:',
            result.backlog[0].milestones[0].tasks[0].subtasks[0]
          );
        }
      },
      { timeout: 30000 }
    );
  });
});
```

### Integration Points

```yaml
NO CONFIG CHANGES:
  - No configuration files need modification
  - vitest.config.ts already includes tests/**/*.test.ts pattern

NEW DIRECTORY:
  - tests/integration/ directory will be created (doesn't exist yet)

NEW FILE:
  - tests/integration/architect-agent.test.ts (this PRP's deliverable)

ENVIRONMENT:
  - USE_REAL_LLM environment variable controls mock vs real LLM behavior
  - ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL inherited from shell

FUTURE INTEGRATION (Not part of this PRP):
  - Additional agent integration tests (researcher, coder, qa)
  - E2E pipeline tests that orchestrate multiple agents
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint
# Expected: Zero errors. ESLint verifies code style.

# Type checking with TypeScript
npm run type-check
# Expected: Zero type errors. Verify all imports are correct.

# Build compilation
npm run build
# Expected: Successful compilation to dist/ directory.

# If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the new integration test (mocked mode - fast)
npm run test -- architect-agent.test.ts
# Expected: All tests pass with mocked data.

# Run all existing unit tests to ensure no breakage
npm run test
# Expected: All existing tests still pass.

# Coverage validation
npm run test:coverage
# Expected: Coverage report includes new integration test
```

### Level 3: Integration Testing (System Validation)

```bash
# Test with real LLM (optional - requires API credits)
USE_REAL_LLM=true npm run test -- architect-agent.test.ts
# Expected: Tests pass with real LLM output (slower, costs API credits)

# Verify test can run standalone
npm run test -- --run architect-agent.test.ts
# Expected: Single test file runs successfully in isolation

# Verify test discovery works
npm run test -- --reporter=verbose architect-agent
# Expected: Test file is discovered and all tests are listed
```

### Level 4: Manual Verification & Output Inspection

```bash
# Run test and inspect console output
npm run test -- architect-agent.test.ts 2>&1 | grep -A 20 "=== Architect Agent Sample Output ==="
# Expected: Sample output is logged with proper structure

# Verify BacklogSchema validation
npm run test -- architect-agent.test.ts 2>&1 | grep "safeParse"
# Expected: All safeParse operations return success: true

# Run test with increased timeout if LLM calls are slow
npm run test -- architect-agent.test.ts --test-timeout=60000
# Expected: Tests complete within timeout
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] TypeScript compilation passes: `npm run build`
- [ ] No type errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Integration test can run standalone: `npm run test -- architect-agent.test.ts`
- [ ] Test with mocked data passes: `npm run test -- architect-agent.test.ts`
- [ ] All existing unit tests still pass: `npm run test`

### Feature Validation

- [ ] Integration test file created at `tests/integration/architect-agent.test.ts`
- [ ] Test reads PRD.md from project root successfully
- [ ] Test creates Architect agent using factory function
- [ ] Test generates prompt using `createArchitectPrompt()`
- [ ] Test validates output against `BacklogSchema`
- [ ] Test verifies at least one phase exists in backlog
- [ ] Test validates story_points are integers 1-21 (not 0.5)
- [ ] Test logs sample output for inspection
- [ ] Test supports both mock and real LLM modes via USE_REAL_LLM flag

### Code Quality Validation

- [ ] Follows existing test patterns from `tests/unit/agents/agent-factory.test.ts`
- [ ] File placement matches desired codebase tree structure
- [ ] All imports use correct `.js` extensions for ES modules
- [ ] Proper cleanup in `afterEach` hooks
- [ ] Tests use appropriate timeouts for LLM calls
- [ ] No anti-patterns (see below)

### Documentation & Deployment

- [ ] JSDoc comments explain the test's purpose
- [ ] Code is self-documenting with clear variable names
- [ ] Sample output is logged for manual inspection
- [ ] Test serves as documentation for expected agent behavior

---

## Anti-Patterns to Avoid

- ❌ Don't skip the `afterEach` cleanup - always call `vi.unstubAllEnvs()`
- ❌ Don't hardcode PRD path - use `resolve(process.cwd(), 'PRD.md')`
- ❌ Don't forget the `.js` extension in imports
- ❌ Don't set short timeouts - LLM calls need 30+ seconds
- ❌ Don't validate story_points as 0.5 - the schema requires integers 1-21
- ❌ Don't skip sample output logging - it's for inspection and documentation
- ❌ Don't ignore the USE_REAL_LLM flag - support both modes
- ❌ Don't modify existing test files - only add the new integration test
- ❌ Don't assume the LLM returns valid JSON - always validate with BacklogSchema
- ❌ Don't skip testing hierarchy depth - verify all 4 levels exist

---

## Additional Notes

### Story Points Discrepancy

The work item mentions validating story_points as "0.5, 1, or 2" but the actual `BacklogSchema` in `src/core/models.ts` validates integers in the range [1, 21]. This discrepancy exists in:

1. `PROMPTS.md` line 47: "**0.5, 1, or 2 Story Points (SP).**"
2. `src/agents/prompts.ts` line 47: Same text
3. `src/core/models.ts` lines 246-250: `z.number().int().min(1).max(21)`

**Decision**: This PRP validates against the ACTUAL schema (integers 1-21). Resolving this discrepancy between documentation and schema is outside the scope of this testing task.

### Test Execution Modes

The integration test supports two execution modes:

1. **Mock Mode (default)**: Fast, deterministic, no API costs
   - `npm run test -- architect-agent.test.ts`

2. **Real LLM Mode**: Slow, costs API credits, tests actual behavior
   - `USE_REAL_LLM=true npm run test -- architect-agent.test.ts`

This dual-mode approach enables:

- Fast CI/CD with mocked data
- Periodic validation with real LLM output
- Manual inspection of actual architect agent behavior

### Pattern for Future Agent Tests

This integration test establishes the pattern for:

- `tests/integration/researcher-agent.test.ts`
- `tests/integration/coder-agent.test.ts`
- `tests/integration/qa-agent.test.ts`

Each should follow the same structure:

1. Setup tests (agent creation, file reading)
2. Output validation (Zod schema)
3. Hierarchy verification (nested structure)
4. Domain-specific validation (story_points, PRP structure, etc.)
5. Sample output logging

---

## Confidence Score

**8/10** - One-pass implementation success likelihood

**Reasoning**:

- Comprehensive context provided with specific file paths and patterns
- Existing codebase has excellent test patterns to follow
- Mock vs real LLM decision is documented with clear implementation
- Story points discrepancy is noted and resolved
- All imports and patterns are specified with exact code examples

**Risks**:

- Real LLM mode may fail due to API issues or unexpected output format
- Test may timeout if LLM is slow
- Environment setup may differ between development and CI

**Mitigation**:

- Mock mode ensures tests pass even if LLM is unavailable
- Longer timeout configured for LLM calls
- Environment variables are documented
- Sample output logging aids debugging
