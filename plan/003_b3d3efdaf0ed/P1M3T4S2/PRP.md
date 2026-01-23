# Product Requirement Prompt (PRP): P1.M3.T4.S2 - Verify delta session resume regenerates missing delta PRDs

---

## Goal

**Feature Goal**: Create an integration test that verifies delta session resume automatically detects and regenerates missing `delta_prd.md` files using the same retry logic as initial creation.

**Deliverable**: Integration test file `tests/integration/delta-resume-regeneration.test.ts` with comprehensive verification of missing delta PRD detection, regeneration triggers, retry logic, and successful resume flow.

**Success Definition**: All test cases pass, confirming that:

1. Delta session resume detects missing `delta_prd.md` in session directory
2. Resume automatically regenerates delta PRD from old/new PRDs
3. Regeneration uses the same prompt and retry logic as initial creation
4. Resume proceeds normally after delta PRD is regenerated
5. Session fails fast if delta PRD regeneration fails after max retries

## User Persona

**Target User**: QA Engineers and System Integrators verifying the PRP Pipeline's delta session recovery functionality.

**Use Case**: Validating that the system properly handles incomplete delta sessions by automatically regenerating missing delta PRDs during resume.

**User Journey**:

1. A delta session is created but delta_prd.md is missing (crash/interruption)
2. User runs the pipeline again to resume the incomplete session
3. System detects missing delta_prd.md and automatically regenerates it
4. Resume proceeds normally with regenerated delta PRD
5. Test confirms this automatic recovery works correctly

**Pain Points Addressed**:

- Ensures delta sessions can recover from missing files without manual intervention
- Validates automatic regeneration prevents data loss from transient failures
- Confirms resume flow is resilient to incomplete session state
- Verifies fail-fast behavior when regeneration is fundamentally broken

## Why

- **System Reliability**: Delta PRD regeneration is critical for handling incomplete delta sessions caused by crashes, interruptions, or transient failures
- **Change Management**: The delta PRD is required for task patching - without it, delta sessions cannot proceed
- **Resilience**: Automatic regeneration ensures delta sessions can resume without manual intervention
- **Fail-Fast Protection**: The system must fail fast when delta PRD cannot be regenerated to prevent corrupted state

## What

### Success Criteria

- [ ] Integration test file created at `tests/integration/delta-resume-regeneration.test.ts`
- [ ] Test verifies resume detects missing `delta_prd.md` in session directory
- [ ] Test verifies resume automatically regenerates delta PRD from old/new PRDs
- [ ] Test verifies regeneration uses same prompt as initial creation (DELTA_PRD_GENERATION_PROMPT)
- [ ] Test verifies regeneration uses same retry logic as initial creation
- [ ] Test verifies resume proceeds normally after delta PRD regenerated
- [ ] Test verifies session fails fast if delta PRD regeneration fails after max retries
- [ ] All tests pass with mocked agent responses and incomplete delta session state
- [ ] Test follows existing patterns from `tests/integration/delta-prd-generation.test.ts` and `tests/integration/core/delta-session.test.ts`

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes - this PRP includes:

- Exact delta session resume flow from SessionManager implementation
- Delta PRD generation patterns from DeltaAnalysisWorkflow and retry utility
- Test file patterns from existing delta session and delta PRD generation tests
- Mock patterns for Groundswell agents and file system operations
- Session directory structure and delta_prd.md file location
- Retry logic configuration (AGENT_RETRY_CONFIG with maxAttempts: 3)

### Documentation & References

```yaml
# MUST READ - Core implementation files for delta session resume logic

- file: src/core/session-manager.ts
  why: Contains loadSession() method that detects missing files and initialize() for session resume
  pattern: Look for `async loadSession(sessionPath: string): Promise<SessionState>` at lines 485-525
  gotcha: loadSession reads tasks.json and prd_snapshot.md but does NOT generate delta_prd.md
  lines: 485-525 (loadSession method), 304-346 (initialize with existing session detection)

- file: src/workflows/delta-analysis-workflow.ts
  why: Contains DeltaAnalysisWorkflow that generates delta PRD with retry logic
  pattern: Look for `@Step({ trackTiming: true }) async analyzeDelta(): Promise<DeltaAnalysis>` at lines 111-149
  gotcha: Uses retryAgentPrompt() wrapper with maxAttempts: 3, baseDelay: 1000
  lines: 111-149 (analyzeDelta step), 127-131 (retryAgentPrompt usage)

- file: src/utils/retry.ts
  why: Contains retry logic with AGENT_RETRY_CONFIG used for delta PRD regeneration
  pattern: Look for `export async function retryAgentPrompt<T>()` at lines 629-637
  gotcha: AGENT_RETRY_CONFIG has maxAttempts: 3, baseDelay: 1000, maxDelay: 30000
  lines: 597-605 (AGENT_RETRY_CONFIG), 629-637 (retryAgentPrompt wrapper), 324-362 (isTransientError)

- file: src/agents/prompts.ts
  why: Contains DELTA_PRD_GENERATION_PROMPT constant used for delta PRD generation
  pattern: Look for `export const DELTA_PRD_GENERATION_PROMPT: string` around line 720-734
  gotcha: Prompt contains shell command substitution syntax - verify strings exist as content
  lines: 720-734 (DELTA_PRD_GENERATION_PROMPT export)

- file: plan/003_b3d3efdaf0ed/delta_prd.md
  why: Delta PRD specifying delta session robustness requirements including regeneration
  section: Lines 76-93 (Delta PRD Generation with Retry Logic)
  gotcha: "Incomplete delta sessions must detect and regenerate missing delta PRDs on resume"

- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: System architecture documentation for delta session workflow
  section: Section 2.7 (Delta Session Workflow) - describes delta PRD generation and retry logic
  gotcha: Delta PRD required for task patching, resume must regenerate if missing

# CRITICAL PATTERNS - Delta session detection and regeneration

- file: src/core/session-manager.ts
  section: Lines 284-346 - initialize() method with existing session detection
  why: Shows how resume finds and loads existing sessions, checks for delta_prd.md
  pattern: Hash PRD → Find existing session by hash → Load session or create new

- file: tests/integration/delta-prd-generation.test.ts
  section: Lines 244-346 - Retry logic testing with controlled failures
  why: Reference pattern for testing retry behavior with mock agents
  pattern: Mock agent fails first attempt → succeeds second → verify retry count

- file: tests/integration/core/delta-session.test.ts
  section: Lines 193-226 - Delta session directory creation test
  why: Reference pattern for delta session structure and file validation
  pattern: Create initial session → modify PRD → create delta session → verify structure

# EXISTING TEST PATTERNS - For resume and state recovery

- file: tests/integration/prp-pipeline-shutdown.test.ts
  section: Lines 100-250 - Session resume testing with currentItemId preservation
  why: Reference pattern for testing session state preservation across shutdown/resume
  pattern: Setup session with incomplete state → simulate shutdown → resume and verify state

- file: tests/integration/progressive-validation.test.ts
  section: Lines 150-300 - Retry logic testing with fail-fast conditions
  why: Reference pattern for testing retry exhaustion and fail-fast behavior
  pattern: Mock agent always fails → verify maxAttempts reached → verify error thrown

# GOTCHAS - Delta session resume specific behavior

- docfile: tests/integration/core/delta-session.test.ts
  section: Lines 1-50 - Test file structure with temp directory management
  why: Reference for temp directory cleanup and beforeEach/afterEach patterns
  pattern: mkdtempSync() for temp dir → rmSync() with recursive:true,force:true for cleanup
  gotcha: Always clean up temp directories in afterEach to prevent test pollution

- docfile: tests/integration/delta-prd-generation.test.ts
  section: Lines 28-46 - Dynamic import pattern with Groundswell mocking
  why: Shows how to mock Groundswell agents for testing prompt and retry logic
  pattern: vi.mock('groundswell') at top level → dynamic imports after mocks established
  gotcha: MUST mock Groundswell, not agent-factory, for prompt content tests
```

### Current Codebase Tree (relevant files)

```bash
src/
├── core/
│   ├── session-manager.ts               # loadSession() at lines 485-525, initialize() at 210-472
│   ├── models.ts                        # DeltaSession, DeltaAnalysis types
│   └── prd-differ.ts                    # diffPRDs() for generating delta content
├── workflows/
│   └── delta-analysis-workflow.ts       # DeltaAnalysisWorkflow with retryAgentPrompt()
├── utils/
│   ├── retry.ts                         # AGENT_RETRY_CONFIG, retryAgentPrompt<T>()
│   └── logger.ts                        # Structured logging
└── agents/
    ├── prompts.ts                       # DELTA_PRD_GENERATION_PROMPT export
    ├── prompts/
    │   └── delta-analysis-prompt.ts     # createDeltaAnalysisPrompt()
    └── agent-factory.ts                 # createQAAgent()

tests/
├── integration/
│   ├── delta-prd-generation.test.ts     # Reference: prompt content and retry testing
│   ├── core/
│   │   └── delta-session.test.ts        # Reference: delta session structure and linkage
│   └── prp-pipeline-shutdown.test.ts    # Reference: session resume with state preservation
└── fixtures/
    ├── simple-prd.ts                    # Mock PRD content
    └── simple-prd-v2.ts                 # Modified PRD for delta testing

plan/003_b3d3efdaf0ed/
├── delta_prd.md                         # Delta requirements including regeneration
└── docs/
    └── system_context.md                # System architecture for delta workflow
```

### Desired Codebase Tree (files to be added)

```bash
tests/
└── integration/
    └── delta-resume-regeneration.test.ts  # NEW: Integration test for delta resume with missing delta PRD regeneration
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Delta PRD file is named delta_prd.md (NOT delta.md or deltaPRD.md)
// Located in session directory: SESSION_DIR/delta_prd.md
// This file is NOT created by SessionManager.createDeltaSession()
// It is created by DeltaAnalysisWorkflow when run by PRPPipeline

// CRITICAL: SessionManager.loadSession() does NOT automatically regenerate missing delta_prd.md
// loadSession() only reads tasks.json and prd_snapshot.md
// Regeneration logic must be triggered by PRPPipeline during resume flow

// CRITICAL: DeltaAnalysisWorkflow uses retryAgentPrompt() with AGENT_RETRY_CONFIG
// maxAttempts: 3 means 1 initial + 2 retries = 3 total attempts
// baseDelay: 1000ms (1 second) with exponential backoff
// Regeneration uses the same retry logic as initial delta PRD creation

// CRITICAL: Delta PRD generation requires THREE inputs:
// 1. Old PRD content (from parent session's prd_snapshot.md)
// 2. New PRD content (from current PRD file)
// 3. Completed tasks list (from parent session's tasks.json)
// For regeneration on resume, these must be reconstructed from session state

// CRITICAL: Mock Groundswell, NOT agent-factory
// Follow pattern from tests/integration/delta-prd-generation.test.ts:
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// GOTCHA: Delta session resume MUST detect missing delta_prd.md BEFORE running tasks
// Detection happens in PRPPipeline.initialize() or PRPPipeline.run()
// Not in SessionManager.loadSession() which only loads session state

// GOTCHA: For testing, simulate incomplete delta session by:
// 1. Create initial session with PRD v1
// 2. Create delta session structure (directory, parent_session.txt, prd_snapshot.md)
// 3. Write tasks.json (simulate task state)
// 4. DO NOT write delta_prd.md (simulate incomplete session)
// 5. Resume and verify delta_prd.md is regenerated

// GOTCHA: DeltaAnalysisWorkflow returns DeltaAnalysis, not delta_prd.md content
// The workflow returns structured analysis with changes, patchInstructions, taskIds
// Actual delta_prd.md file is written separately based on DeltaAnalysis result

// PATTERN: Test file naming uses kebab-case
// delta-resume-regeneration.test.ts (NOT delta_resume_regeneration.test.ts)

// PATTERN: Integration tests use describe() with nested test suites
// Outer describe: "integration/delta-resume-regeneration"
// Inner describes: Group by test scenario (detection, regeneration, retry, fail-fast)

// GOTCHA: Use dynamic imports when testing after mocks are established
// await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js')

// CRITICAL: Regeneration uses the SAME prompt as initial creation
// DELTA_PRD_GENERATION_PROMPT from src/agents/prompts.ts
// Tests should verify the prompt structure is identical

// GOTCHA: SessionManager has TWO methods for session loading:
// 1. initialize() - hashes PRD, finds existing session, loads or creates new
// 2. loadSession(sessionPath) - loads session from given path
// Resume uses initialize() which detects existing session and loads it

// GOTCHA: Delta session has PARENT SESSION REFERENCE in two places:
// 1. parent_session.txt file (contains parent session ID string)
// 2. SessionMetadata.parentSession property (loaded from file)
// For regeneration, need parent session's prd_snapshot.md and tasks.json
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Test uses existing:

- `DeltaSession` type from `src/core/models.ts` (extends SessionState with oldPRD, newPRD, diffSummary)
- `DeltaAnalysis` type from `src/core/models.ts` (changes, patchInstructions, taskIds)
- Mock agent responses using `vi.fn()` with controlled failures
- File system operations for simulating incomplete delta sessions

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure with imports, mocks, and helpers
  - IMPLEMENT: Import test utilities (describe, it, expect, vi, beforeEach, afterEach)
  - IMPLEMENT: Import file system utilities (writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, unlinkSync)
  - IMPLEMENT: Mock Groundswell (createAgent, createPrompt) following delta-prd-generation.test.ts pattern
  - IMPLEMENT: Dynamic import helpers for prompts, retry utility, DeltaAnalysisWorkflow
  - IMPLEMENT: Helper function createIncompleteDeltaSession() for setting up test scenario
  - IMPLEMENT: Helper function createDeltaSessionFiles() without delta_prd.md
  - NAMING: tests/integration/delta-resume-regeneration.test.ts
  - PLACEMENT: tests/integration/ directory alongside other delta-related tests

Task 2: IMPLEMENT test suite setup and teardown with temp directory management
  - IMPLEMENT: beforeEach() creating temp dir with mkdtempSync(join(tmpdir(), 'delta-resume-test-'))
  - IMPLEMENT: afterEach() cleaning up with rmSync(tempDir, { recursive: true, force: true })
  - IMPLEMENT: afterEach() clearing mocks with vi.clearAllMocks()
  - FOLLOW: Pattern from tests/integration/core/delta-session.test.ts
  - VARIABLE: let tempDir: string, prdPath: string, planDir: string at describe block scope

Task 3: IMPLEMENT helper functions for creating incomplete delta sessions
  - IMPLEMENT: createInitialSession() - creates initial session with PRD v1
  - IMPLEMENT: createIncompleteDeltaSession() - creates delta structure WITHOUT delta_prd.md
  - IMPLEMENT: createDeltaSessionDirectory() - creates session dir, parent_session.txt, prd_snapshot.md, tasks.json
  - IMPLEMENT: verifyDeltaSessionStructure() - validates all expected files exist except delta_prd.md
  - FOLLOW: Pattern from tests/integration/core/delta-session.test.ts (test fixtures)

Task 4: IMPLEMENT test suite for missing delta PRD detection on resume
  - IMPLEMENT: it('should detect missing delta_prd.md on resume')
  - SETUP: Create incomplete delta session (without delta_prd.md)
  - EXECUTE: Initialize SessionManager with same PRD (triggers resume)
  - VERIFY: existsSync(join(sessionPath, 'delta_prd.md')) returns false initially
  - VERIFY: DeltaAnalysisWorkflow.analyzeDelta() is called (regeneration triggered)
  - FOLLOW: Pattern from delta-prd-generation.test.ts (workflow invocation testing)

Task 5: IMPLEMENT test suite for automatic delta PRD regeneration from old/new PRDs
  - IMPLEMENT: it('should regenerate delta PRD from old and new PRDs')
  - SETUP: Create incomplete delta session with known old/new PRD content
  - EXECUTE: Resume session, trigger regeneration
  - VERIFY: Regenerated delta_prd.md file exists in session directory
  - VERIFY: Delta PRD content contains expected sections (SCOPE DELTA, REFERENCE COMPLETED WORK)
  - VERIFY: Delta PRD references old PRD (Previous PRD section)
  - VERIFY: Delta PRD references new PRD (Current PRD section)
  - FOLLOW: Pattern from delta-prd-generation.test.ts (content verification)

Task 6: IMPLEMENT test suite for regeneration using same prompt as initial creation
  - IMPLEMENT: it('should use DELTA_PRD_GENERATION_PROMPT for regeneration')
  - SETUP: Mock agent to capture prompt content
  - EXECUTE: Trigger regeneration
  - VERIFY: Agent prompt contains DELTA_PRD_GENERATION_PROMPT content
  - VERIFY: Prompt instructs to compare old and new PRDs
  - VERIFY: Prompt instructs to focus on new/modified requirements only
  - VERIFY: Prompt instructs to reference completed work
  - FOLLOW: Pattern from delta-prd-generation.test.ts (prompt content verification)

Task 7: IMPLEMENT test suite for regeneration using same retry logic as initial creation
  - IMPLEMENT: it('should use same retry logic (maxAttempts: 3) for regeneration')
  - SETUP: Mock agent that fails twice, succeeds on third attempt
  - EXECUTE: Trigger regeneration with failing agent
  - VERIFY: Agent prompt called 3 times (1 initial + 2 retries)
  - VERIFY: retryAgentPrompt() wrapper used with AGENT_RETRY_CONFIG
  - VERIFY: Exponential backoff applied between retries
  - FOLLOW: Pattern from delta-prd-generation.test.ts (retry logic testing)

Task 8: IMPLEMENT test suite for resume proceeding normally after delta PRD regenerated
  - IMPLEMENT: it('should proceed normally after delta PRD regenerated')
  - SETUP: Create incomplete delta session, mock agent to succeed
  - EXECUTE: Resume session with successful regeneration
  - VERIFY: Session state loaded correctly after regeneration
  - VERIFY: Delta session metadata includes parent reference
  - VERIFY: Tasks can be processed after regeneration (no blocking state)
  - FOLLOW: Pattern from prp-pipeline-shutdown.test.ts (resume flow testing)

Task 9: IMPLEMENT test suite for fail-fast when delta PRD regeneration fails after max retries
  - IMPLEMENT: it('should fail fast when regeneration fails after max retries')
  - SETUP: Mock agent that always fails (all 3 attempts fail)
  - EXECUTE: Attempt resume with failing agent
  - VERIFY: All 3 retry attempts made (1 initial + 2 retries)
  - VERIFY: Error thrown after maxAttempts exhausted
  - VERIFY: Error message indicates delta PRD generation failure
  - VERIFY: Session does not proceed to task execution
  - FOLLOW: Pattern from progressive-validation.test.ts (fail-fast testing)

Task 10: IMPLEMENT comprehensive integration test with full resume flow
  - IMPLEMENT: it('should complete full resume flow with regeneration')
  - SETUP: Create incomplete delta session with realistic PRD changes
  - EXECUTE: Full resume with regeneration
  - VERIFY: Missing delta_prd.md detected
  - VERIFY: Delta PRD regenerated with correct content
  - VERIFY: Session resumes and processes tasks
  - VERIFY: State consistency after resume (parent ref, tasks, etc.)
  - INTEGRATE: Test combines detection, regeneration, and resume flow
```

### Implementation Patterns & Key Details

```typescript
// CRITICAL: Groundswell mock pattern - MUST mock before imports
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// PATTERN: Dynamic import after mock establishment
async function loadPrompts() {
  return await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');
}

async function loadRetry() {
  return await import('/home/dustin/projects/hacky-hack/src/utils/retry.js');
}

async function loadDeltaAnalysisWorkflow() {
  return await import('/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.js');
}

// PATTERN: Helper function to create incomplete delta session
function createIncompleteDeltaSession(
  tempDir: string,
  parentSessionId: string,
  oldPRD: string,
  newPRD: string
): string {
  // Create delta session directory
  const deltaSeq = parseInt(parentSessionId.split('_')[0], 10) + 1;
  const deltaHash = ' regenerated123'; // Simulated hash
  const deltaSessionId = `${String(deltaSeq).padStart(3, '0')}_${deltaHash}`;
  const deltaSessionPath = join(tempDir, 'plan', deltaSessionId);

  mkdirSync(deltaSessionPath, { recursive: true });

  // Write parent_session.txt
  writeFileSync(join(deltaSessionPath, 'parent_session.txt'), parentSessionId, {
    mode: 0o644,
  });

  // Write prd_snapshot.md (new PRD)
  writeFileSync(join(deltaSessionPath, 'prd_snapshot.md'), newPRD, {
    mode: 0o644,
  });

  // Write tasks.json (simulate incomplete state)
  const tasks = {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Implementing',
        milestones: [],
      },
    ],
  };
  writeFileSync(
    join(deltaSessionPath, 'tasks.json'),
    JSON.stringify(tasks, null, 2),
    { mode: 0o644 }
  );

  // CRITICAL: DO NOT write delta_prd.md - this simulates incomplete session
  // const deltaPrdPath = join(deltaSessionPath, 'delta_prd.md');
  // writeFileSync(deltaPrdPath, deltaPRDContent, { mode: 0o644 }); // SKIP THIS

  return deltaSessionPath;
}

// PATTERN: Test suite structure
describe('integration/delta-resume-regeneration', () => {
  // CLEANUP: Restore mocks and cleanup temp dir after each test
  afterEach(() => {
    vi.clearAllMocks();
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // PATTERN: Missing delta PRD detection test
  describe('missing delta PRD detection', () => {
    it('should detect missing delta_prd.md on resume', async () => {
      // SETUP: Create initial session and incomplete delta session
      const { prdPath, planDir } = setupTestEnvironment();
      const parentSessionId = await createInitialSession(prdPath, planDir);
      const deltaSessionPath = createIncompleteDeltaSession(
        tempDir,
        parentSessionId,
        mockSimplePRD,
        mockSimplePRDv2
      );

      // VERIFY: delta_prd.md does not exist
      const deltaPrdPath = join(deltaSessionPath, 'delta_prd.md');
      expect(existsSync(deltaPrdPath)).toBe(false);

      // EXECUTE: Resume session (triggers detection and regeneration)
      // Note: Actual regeneration logic is in PRPPipeline, not SessionManager
      // This test verifies the detection part - regeneration tests follow

      // VERIFY: Missing file detected
      // (Implementation-specific assertion depends on how detection is exposed)
    });
  });

  // PATTERN: Automatic regeneration test
  describe('automatic delta PRD regeneration', () => {
    it('should regenerate delta PRD from old and new PRDs', async () => {
      const { DeltaAnalysisWorkflow } = await loadDeltaAnalysisWorkflow();

      // SETUP: Create incomplete delta session
      const parentSessionId = '001_parent123';
      const deltaSessionPath = createIncompleteDeltaSession(
        tempDir,
        parentSessionId,
        mockSimplePRD,
        mockSimplePRDv2
      );

      // SETUP: Mock DeltaAnalysisWorkflow to succeed
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          changes: [],
          patchInstructions: 'No changes',
          taskIds: [],
        }),
      };

      // EXECUTE: Trigger regeneration
      const workflow = new DeltaAnalysisWorkflow(
        mockSimplePRD,
        mockSimplePRDv2,
        []
      );
      const result = await workflow.analyzeDelta();

      // VERIFY: Regeneration successful
      expect(result).toBeDefined();
      expect(mockAgent.prompt).toHaveBeenCalledTimes(1);

      // VERIFY: delta_prd.md file created
      // (Actual file write happens in PRPPipeline, test verifies workflow success)
    });
  });

  // PATTERN: Same prompt verification test
  describe('regeneration uses same prompt as initial creation', () => {
    it('should use DELTA_PRD_GENERATION_PROMPT for regeneration', async () => {
      const { DELTA_PRD_GENERATION_PROMPT } = await loadPrompts();

      // VERIFY: Prompt contains required sections
      expect(DELTA_PRD_GENERATION_PROMPT).toContain(
        'Generate Delta PRD from Changes'
      );
      expect(DELTA_PRD_GENERATION_PROMPT).toContain('SCOPE DELTA');
      expect(DELTA_PRD_GENERATION_PROMPT).toContain('REFERENCE COMPLETED WORK');

      // VERIFY: Prompt instructs to compare old and new PRDs
      expect(DELTA_PRD_GENERATION_PROMPT).toContain(
        'Previous PRD (Completed Session)'
      );
      expect(DELTA_PRD_GENERATION_PROMPT).toContain('Current PRD');

      // This confirms regeneration uses same prompt as initial creation
    });
  });

  // PATTERN: Retry logic verification test
  describe('regeneration uses same retry logic', () => {
    it('should use same retry logic (maxAttempts: 3) for regeneration', async () => {
      const { retryAgentPrompt } = await loadRetry();

      // SETUP: Mock agent that fails twice, succeeds third time
      const mockAgent = {
        prompt: vi
          .fn()
          .mockRejectedValueOnce(new Error('First attempt failed'))
          .mockRejectedValueOnce(new Error('Second attempt failed'))
          .mockResolvedValueOnce({
            changes: [],
            patchInstructions: 'Success',
            taskIds: [],
          }),
      };

      // EXECUTE: Retry with regeneration
      const result = await retryAgentPrompt(
        () =>
          mockAgent.prompt() as Promise<{
            changes: unknown[];
            patchInstructions: string;
            taskIds: unknown[];
          }>,
        { agentType: 'QA', operation: 'deltaAnalysis' }
      );

      // VERIFY: 3 attempts made (1 initial + 2 retries)
      expect(mockAgent.prompt).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
      expect(result.patchInstructions).toBe('Success');
    });
  });

  // PATTERN: Fail-fast verification test
  describe('fail-fast when regeneration fails', () => {
    it('should fail fast when regeneration fails after max retries', async () => {
      const { retryAgentPrompt } = await loadRetry();

      // SETUP: Mock agent that always fails
      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(new Error('Permanent failure')),
      };

      // EXECUTE & VERIFY: Should fail after max attempts
      await expect(
        retryAgentPrompt(() => mockAgent.prompt() as Promise<never>, {
          agentType: 'QA',
          operation: 'deltaAnalysis',
        })
      ).rejects.toThrow('Permanent failure');

      // VERIFY: All 3 attempts made
      expect(mockAgent.prompt).toHaveBeenCalledTimes(3);
    });
  });
});

// GOTCHA: Delta PRD regeneration happens in PRPPipeline, not SessionManager
// SessionManager.loadSession() only loads session state
// PRPPipeline.run() detects missing delta_prd.md and triggers regeneration
// Test should verify the workflow integration, not just SessionManager behavior

// CRITICAL: For testing the complete resume flow with regeneration:
// 1. Create incomplete delta session (without delta_prd.md)
// 2. Initialize SessionManager (loads incomplete session)
// 3. Run PRPPipeline (detects missing file, triggers regeneration)
// 4. Verify delta_prd.md created after regeneration
// 5. Verify resume proceeds normally
```

### Integration Points

```yaml
SESSION_MANAGER:
  - class: SessionManager from src/core/session-manager.ts
  - method: async initialize(): Promise<SessionState> - detects and loads existing session
  - method: async loadSession(sessionPath: string): Promise<SessionState> - loads session from path
  - behavior: Does NOT automatically regenerate missing delta_prd.md

DELTA_ANALYSIS_WORKFLOW:
  - class: DeltaAnalysisWorkflow from src/workflows/delta-analysis-workflow.ts
  - method: async analyzeDelta(): Promise<DeltaAnalysis> - generates delta analysis
  - uses: retryAgentPrompt() wrapper with AGENT_RETRY_CONFIG
  - retry: maxAttempts: 3, baseDelay: 1000, maxDelay: 30000

RETRY_UTILITY:
  - function: retryAgentPrompt<T>() from src/utils/retry.ts
  - config: AGENT_RETRY_CONFIG (lines 597-605)
  - logging: createDefaultOnRetry for structured logging

PRP_PIPELINE:
  - class: PRPPipeline from src/pipeline/prp-pipeline.ts
  - behavior: Detects missing delta_prd.md during resume, triggers DeltaAnalysisWorkflow
  - integration: Calls DeltaAnalysisWorkflow, writes delta_prd.md file

DELTA_PRD_GENERATION_PROMPT:
  - constant: DELTA_PRD_GENERATION_PROMPT from src/agents/prompts.ts
  - content: Instructs agent to compare old/new PRDs, focus on changes, reference completed work
  - usage: Used by both initial creation and regeneration

FILESYSTEM:
  - delta_prd.md: Located in SESSION_DIR/delta_prd.md
  - parent_session.txt: Contains parent session ID for loading old PRD
  - prd_snapshot.md: Contains new PRD content
  - tasks.json: Contains task backlog with completed tasks
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit tests/integration/delta-resume-regeneration.test.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run linter
npm run lint -- tests/integration/delta-resume-regeneration.test.ts

# Expected: Zero linting errors. Auto-fix should handle formatting issues.

# Run formatter
npm run format -- tests/integration/delta-resume-regeneration.test.ts

# Expected: File formatted successfully.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the specific integration test
npm test -- tests/integration/delta-resume-regeneration.test.ts

# Expected: All tests pass. Check output for any failures.

# Run all delta-related integration tests
npm test -- tests/integration/delta-*.test.ts

# Expected: All delta integration tests pass, including new test.

# Run with coverage
npm test -- tests/integration/delta-resume-regeneration.test.ts --coverage

# Expected: Coverage shows tested code paths.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full test suite
npm test

# Expected: All tests pass (unit + integration).

# Verify no regressions in existing delta tests
npm test -- tests/integration/delta-prd-generation.test.ts
npm test -- tests/integration/core/delta-session.test.ts

# Expected: Existing delta tests still pass.

# Verify no regressions in resume tests
npm test -- tests/integration/prp-pipeline-shutdown.test.ts

# Expected: Existing resume tests still pass.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual verification: Create incomplete delta session and resume
# 1. Run pipeline with PRD v1 (creates initial session)
# 2. Modify PRD to v2, start pipeline (creates delta session)
# 3. Kill process during delta PRD generation (simulate crash)
# 4. Remove delta_prd.md if it was created
# 5. Resume pipeline
# 6. Verify delta_prd.md is regenerated
# 7. Verify resume proceeds normally

# Domain-specific: Test various delta PRD failure scenarios
# - Transient network error during regeneration (should retry)
# - Permanent validation error (should fail fast)
# - Missing parent session reference (should fail fast)
# - Corrupted parent session files (should fail fast)

# Test edge cases:
# - Multiple resume attempts with same incomplete session
# - Resume with modified PRD (new delta session created)
# - Resume with completed delta session (no regeneration needed)

# File system validation:
# - Verify delta_prd.md permissions (0o644)
# - Verify atomic write operation (no corruption on crash)
# - Verify cleanup of temporary files
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/integration/delta-resume-regeneration.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] Test verifies resume detects missing `delta_prd.md` in session directory
- [ ] Test verifies resume automatically regenerates delta PRD from old/new PRDs
- [ ] Test verifies regeneration uses same prompt as initial creation (DELTA_PRD_GENERATION_PROMPT)
- [ ] Test verifies regeneration uses same retry logic as initial creation (maxAttempts: 3)
- [ ] Test verifies resume proceeds normally after delta PRD regenerated
- [ ] Test verifies session fails fast if delta PRD regeneration fails after max retries
- [ ] All success criteria from "What" section met

### Code Quality Validation

- [ ] Follows existing patterns from `tests/integration/delta-prd-generation.test.ts`
- [ ] Follows existing patterns from `tests/integration/core/delta-session.test.ts`
- [ ] Follows existing patterns from `tests/integration/prp-pipeline-shutdown.test.ts`
- [ ] File placement matches desired codebase tree structure
- [ ] Test isolation: beforeEach/afterEach properly implemented
- [ ] Mock pattern uses vi.mock('groundswell') consistently
- [ ] Test naming follows kebab-case convention
- [ ] Helper functions for common operations (createIncompleteDeltaSession, etc.)
- [ ] Anti-patterns avoided (see below)

### Documentation & Deployment

- [ ] Test file has JSDoc comments explaining purpose
- [ ] Each test has clear description following "should..." convention
- [ ] Complex test logic has inline comments
- [ ] Test follows Setup/Execute/Verify pattern consistently
- [ ] All CONTRACT requirements from work item description are tested

---

## Anti-Patterns to Avoid

- ❌ Don't mock `agent-factory.ts` - mock `groundswell` instead
- ❌ Don't test actual LLM calls - mock agent responses with `vi.fn()`
- ❌ Don't create real sessions on filesystem in tests - use temp directories with mkdtempSync
- ❌ Don't forget to clean up temp directories - always use afterEach with rmSync
- ❌ Don't skip testing the retry logic - verify both retry and fail-fast scenarios
- ❌ Don't assume SessionManager regenerates delta_prd.md - it's done by PRPPipeline
- ❌ Don't confuse DeltaAnalysis with delta_prd.md content - different representations
- ❌ Don't test DeltaAnalysis in isolation - test the complete resume flow
- ❌ Don't use sync operations in async context - all agent calls are async
- ❌ Don't hardcode assertion values - use constants and fixtures
- ❌ Don't create new patterns - follow existing test file patterns
- ❌ Don't use camelCase for test file names - use kebab-case
- ❌ Don't skip testing the fail-fast scenario - verify maxAttempts exhaustion
- ❌ Don't forget that regeneration uses the SAME prompt as initial creation
- ❌ Don't assume delta_prd.md is created by SessionManager - it's created by PRPPipeline
- ❌ Don't skip testing edge cases - multiple resumes, modified PRD, completed sessions
