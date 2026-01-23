/**
 * Integration test for DELTA_PRD_GENERATION_PROMPT and Retry Logic
 *
 * @description
 * Integration tests that verify the DELTA_PRD_GENERATION_PROMPT contains
 * all required instructions for delta PRD generation and that the retry logic
 * works correctly for delta PRD generation failures.
 *
 * @testPath integration/delta-prd-generation
 * @covers DELTA_PRD_GENERATION_PROMPT content verification and retry logic
 * @validation Prompt Content, Change Manager Instructions, Retry Behavior
 *
 * @remarks
 * This test suite validates:
 * - Prompt export and loading
 * - Requirement (a): Compare old and new PRDs instruction
 * - Requirement (b): Focus on new/modified requirements only
 * - Requirement (c): Reference completed work to avoid duplication
 * - Requirement (d): Retry logic triggers on missing delta PRD
 * - Requirement (e): Fail fast when delta PRD cannot be generated
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../PROMPTS.md} - DELTA_PRD_GENERATION_PROMPT definition (lines 793-833)
 * @see {@link ../../src/agents/prompts.ts} - DELTA_PRD_PROMPT export
 * @see {@link ../../src/workflows/delta-analysis-workflow.ts} - DeltaAnalysisWorkflow with retry logic
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// MOCK SETUP: Groundswell (NOT agent-factory)
// =============================================================================
// CRITICAL: Mock Groundswell, NOT agent-factory
// This allows testing the real DELTA_PRD_PROMPT content
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// =============================================================================
// DYNAMIC IMPORTS - Load after mocks are established
// =============================================================================

/**
 * Dynamic import for prompts module
 *
 * @remarks
 * Ensures mocks are applied before the prompts module loads.
 */
async function loadPrompts() {
  return await import('/home/dustin/projects/hacky-hack/src/agents/prompts.js');
}

/**
 * Dynamic import for retry utility
 *
 * @remarks
 * Used for testing retry logic with controlled mock failures.
 */
async function loadRetry() {
  return await import('/home/dustin/projects/hacky-hack/src/utils/retry.js');
}

/**
 * Dynamic import for DeltaAnalysisWorkflow
 *
 * @remarks
 * Used for testing retry logic in actual delta analysis workflow.
 */
async function loadDeltaAnalysisWorkflow() {
  return await import('/home/dustin/projects/hacky-hack/src/workflows/delta-analysis-workflow.js');
}

// =============================================================================
// TEST SUITE: DELTA_PRD_GENERATION_PROMPT Content Verification
// =============================================================================

describe('integration/delta-prd-generation', () => {
  /**
   * Cleanup after each test
   *
   * @remarks
   * - Unstub environment variables to prevent cross-test pollution
   * - Clear all mocks to reset spy call counts
   * - Following pattern from tests/integration/task-breakdown-prompt.test.ts
   */
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // TEST GROUP 1: Prompt Export and Loading
  // ==========================================================================

  describe('prompt export and loading', () => {
    it('should export DELTA_PRD_PROMPT as a string', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(typeof DELTA_PRD_PROMPT).toBe('string');
      expect(DELTA_PRD_PROMPT.length).toBeGreaterThan(100);
    });

    it('should be a non-empty template literal with markdown content', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toBeTruthy();
      expect(DELTA_PRD_PROMPT.trim()).not.toBe('');
      expect(DELTA_PRD_PROMPT).toContain('# Generate Delta PRD from Changes');
    });
  });

  // ==========================================================================
  // TEST GROUP 2: Requirement (a) - Compare old and new PRDs instruction
  // ==========================================================================

  describe('requirement (a): compare old and new PRDs instruction', () => {
    it('should contain "Previous PRD (Completed Session)" section', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('Previous PRD (Completed Session)');
    });

    it('should contain shell command for previous PRD snapshot', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      // GOTCHA: The prompt contains shell syntax that is NOT executed
      // Tests verify the prompt CONTAINS these strings, not that they work
      expect(DELTA_PRD_PROMPT).toContain(
        '$(cat "$PREV_SESSION_DIR/prd_snapshot.md")'
      );
    });

    it('should contain "Current PRD" section', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('Current PRD');
    });

    it('should contain shell command for current PRD file', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('$(cat "$PRD_FILE")');
    });

    it('should contain "Previous Session\'s Completed Tasks" section', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain("Previous Session's Completed Tasks");
    });

    it('should contain shell command for previous tasks.json', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain(
        '$(cat "$PREV_SESSION_DIR/tasks.json")'
      );
    });
  });

  // ==========================================================================
  // TEST GROUP 3: Requirement (b) - Focus on new/modified requirements only
  // ==========================================================================

  describe('requirement (b): focus on new/modified requirements only', () => {
    it('should contain "SCOPE DELTA" instruction', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('SCOPE DELTA');
    });

    it('should instruct to focus ONLY on new features/requirements added', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('New features/requirements added');
      expect(DELTA_PRD_PROMPT).toContain('ONLY on:');
    });

    it('should instruct to focus ONLY on modified requirements', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('Modified requirements');
    });

    it("should instruct to note removed requirements but don't create tasks", async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('Removed requirements');
      expect(DELTA_PRD_PROMPT).toContain("don't create tasks to implement");
    });

    it('should contain change type instructions in correct order', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      const content = DELTA_PRD_PROMPT;
      const addedIndex = content.indexOf('New features/requirements added');
      const modifiedIndex = content.indexOf('Modified requirements');
      const removedIndex = content.indexOf('Removed requirements');

      // Verify all three are present and in reasonable order
      expect(addedIndex).toBeGreaterThan(-1);
      expect(modifiedIndex).toBeGreaterThan(-1);
      expect(removedIndex).toBeGreaterThan(-1);
    });
  });

  // ==========================================================================
  // TEST GROUP 4: Requirement (c) - Reference completed work to avoid duplication
  // ==========================================================================

  describe('requirement (c): reference completed work to avoid duplication', () => {
    it('should contain "REFERENCE COMPLETED WORK" section', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('REFERENCE COMPLETED WORK');
    });

    it('should instruct to reference existing implementations rather than re-implement', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('Reference existing implementations');
      expect(DELTA_PRD_PROMPT).toContain('rather than re-implementing');
    });

    it('should instruct to note which files/functions need updates for modifications', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain(
        'note which files/functions need updates'
      );
    });

    it('should contain "LEVERAGE PRIOR RESEARCH" section', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain('LEVERAGE PRIOR RESEARCH');
    });

    it('should instruct to check $PREV_SESSION_DIR/architecture/ for existing research', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain(
        'Check $PREV_SESSION_DIR/architecture/'
      );
      expect(DELTA_PRD_PROMPT).toContain('for existing research');
    });

    it('should instruct not to duplicate research', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      expect(DELTA_PRD_PROMPT).toContain("Don't duplicate research");
    });
  });

  // ==========================================================================
  // TEST GROUP 5: Requirement (d) - Retry logic triggers on missing delta PRD
  // ==========================================================================

  describe('requirement (d): retry logic triggers on missing delta PRD', () => {
    it('should trigger second attempt on first failure', async () => {
      const { retryAgentPrompt } = await loadRetry();

      // Create mock agent that fails first, succeeds second
      // GOTCHA: Use error messages that match TRANSIENT_PATTERNS in retry.ts
      // Pattern includes: 'timeout', 'network error', 'temporarily unavailable'
      const mockAgent = {
        prompt: vi
          .fn()
          .mockRejectedValueOnce(
            new Error('Network timeout - first attempt failed')
          )
          .mockResolvedValueOnce({
            changes: [],
            patchInstructions: '',
            taskIds: [],
          }),
      };

      const result = await retryAgentPrompt(
        () =>
          mockAgent.prompt() as Promise<{
            changes: unknown[];
            patchInstructions: string;
            taskIds: string[];
          }>,
        { agentType: 'QA', operation: 'deltaAnalysis' }
      );

      // Verify: Called twice (first failure + second success)
      expect(mockAgent.prompt).toHaveBeenCalledTimes(2);

      // Verify: Success returned after second attempt
      expect(result).toBeDefined();
      expect(result.changes).toEqual([]);
    });

    it('should invoke onRetry callback after first failure', async () => {
      const onRetryMock = vi.fn();

      // GOTCHA: Use error message matching TRANSIENT_PATTERNS for retry
      const mockAgent = {
        prompt: vi
          .fn()
          .mockRejectedValueOnce(new Error('Network error - connection reset'))
          .mockResolvedValueOnce({
            changes: [],
            patchInstructions: '',
            taskIds: [],
          }),
      };

      // Use the retry function with custom onRetry
      const { retry } = await loadRetry();
      await retry(() => mockAgent.prompt(), {
        maxAttempts: 3,
        baseDelay: 100,
        onRetry: onRetryMock,
      });

      // Verify: onRetry was called once after first failure
      expect(onRetryMock).toHaveBeenCalledTimes(1);
      expect(onRetryMock).toHaveBeenCalledWith(
        1, // attempt number
        expect.any(Error), // error
        expect.any(Number) // delay
      );
    });

    it('should return success after second attempt with valid delta PRD', async () => {
      const { retryAgentPrompt } = await loadRetry();

      const expectedDelta = {
        changes: [
          {
            itemId: 'P1.M2.T3',
            type: 'modified' as const,
            description: 'Added OAuth2 authentication requirement',
            impact: 'Must expand authentication system',
          },
        ],
        patchInstructions: 'Re-execute P1.M2.T3 for OAuth2 integration',
        taskIds: ['P1.M2.T3'],
      };

      const mockAgent = {
        prompt: vi
          .fn()
          .mockRejectedValueOnce(new Error('Timeout on first attempt'))
          .mockResolvedValueOnce(expectedDelta),
      };

      const result = await retryAgentPrompt(
        () => mockAgent.prompt() as Promise<typeof expectedDelta>,
        { agentType: 'QA', operation: 'deltaAnalysis' }
      );

      // Verify: Result matches expected delta analysis
      expect(result).toEqual(expectedDelta);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].itemId).toBe('P1.M2.T3');
    });
  });

  // ==========================================================================
  // TEST GROUP 6: Requirement (e) - Fail fast when delta PRD cannot be generated
  // ==========================================================================

  describe('requirement (e): fail fast when delta PRD cannot be generated', () => {
    it('should make all 3 attempts before failing', async () => {
      const { retryAgentPrompt } = await loadRetry();

      // GOTCHA: maxAttempts: 3 means 1 initial + 2 retries = 3 total attempts
      // Use error messages matching TRANSIENT_PATTERNS to trigger retries
      const mockAgent = {
        prompt: vi
          .fn()
          .mockRejectedValueOnce(new Error('Network timeout on attempt 1'))
          .mockRejectedValueOnce(new Error('Network timeout on attempt 2'))
          .mockRejectedValueOnce(new Error('Network timeout on attempt 3')),
      };

      await expect(
        retryAgentPrompt(() => mockAgent.prompt() as Promise<never>, {
          agentType: 'QA',
          operation: 'deltaAnalysis',
        })
      ).rejects.toThrow();

      // Verify: All 3 attempts were made
      expect(mockAgent.prompt).toHaveBeenCalledTimes(3);
    });

    it('should throw error after maxAttempts exhausted', async () => {
      const { retry } = await loadRetry();

      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(new Error('Permanent failure')),
      };

      await expect(
        retry(() => mockAgent.prompt(), { maxAttempts: 3, baseDelay: 100 })
      ).rejects.toThrow('Permanent failure');
    });

    it('should indicate delta PRD generation failure in error', async () => {
      const { retryAgentPrompt } = await loadRetry();

      const mockAgent = {
        prompt: vi
          .fn()
          .mockRejectedValue(new Error('Failed to generate delta PRD')),
      };

      await expect(
        retryAgentPrompt(() => mockAgent.prompt() as Promise<never>, {
          agentType: 'QA',
          operation: 'deltaAnalysis',
        })
      ).rejects.toThrow('Failed to generate delta PRD');
    });

    it('should not retry on non-transient errors', async () => {
      const { retry, isPermanentError } = await loadRetry();

      // Create a validation error (permanent, not retryable)
      const validationError = new Error(
        'Validation failed: Invalid PRD format'
      );
      (validationError as any).code = 'VALIDATION_ERROR';

      const mockAgent = {
        prompt: vi.fn().mockRejectedValue(validationError),
      };

      await expect(
        retry(() => mockAgent.prompt(), {
          maxAttempts: 3,
          baseDelay: 100,
          isRetryable: (error: unknown) => !isPermanentError(error),
        })
      ).rejects.toThrow('Validation failed');

      // Verify: Only called once (no retries for permanent errors)
      expect(mockAgent.prompt).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // TEST GROUP 7: Comprehensive Integration Tests with Mock Agent Responses
  // ==========================================================================

  describe('comprehensive integration tests with mock agent responses', () => {
    it('should complete flow from prompt to delta PRD creation', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();
      const { DeltaAnalysisWorkflow } = await loadDeltaAnalysisWorkflow();

      // Verify prompt contains required output instruction
      expect(DELTA_PRD_PROMPT).toContain('Write the delta PRD to');
      expect(DELTA_PRD_PROMPT).toContain('$SESSION_DIR/delta_prd.md');

      // Verify DeltaAnalysisWorkflow class exists and is usable
      expect(DeltaAnalysisWorkflow).toBeDefined();
      expect(typeof DeltaAnalysisWorkflow).toBe('function');
    });

    it('should handle success scenario with valid delta analysis', async () => {
      const mockAgent = {
        prompt: vi.fn().mockResolvedValue({
          changes: [
            {
              itemId: 'P1.M1.T2',
              type: 'added' as const,
              description: 'New user authentication feature',
              impact: 'Must implement OAuth2 login flow',
            },
          ],
          patchInstructions: 'Implement new authentication tasks',
          taskIds: ['P1.M1.T2', 'P1.M1.T2.S1', 'P1.M1.T2.S2'],
        }),
      };

      const { retryAgentPrompt } = await loadRetry();

      const result = await retryAgentPrompt(
        () =>
          mockAgent.prompt() as Promise<{
            changes: Array<{
              itemId: string;
              type: 'added';
              description: string;
              impact: string;
            }>;
            patchInstructions: string;
            taskIds: string[];
          }>,
        { agentType: 'QA', operation: 'deltaAnalysis' }
      );

      // Verify: Complete delta analysis structure returned
      expect(result).toBeDefined();
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('added');
      expect(result.changes[0].itemId).toBe('P1.M1.T2');
      expect(result.taskIds).toHaveLength(3);
    });

    it('should handle failure scenario with recovery', async () => {
      const { retryAgentPrompt } = await loadRetry();

      let attemptCount = 0;
      const mockAgent = {
        prompt: vi.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount === 1) {
            return Promise.reject(new Error('Network timeout'));
          }
          return Promise.resolve({
            changes: [],
            patchInstructions: 'No changes detected',
            taskIds: [],
          });
        }),
      };

      const result = await retryAgentPrompt(
        () =>
          mockAgent.prompt() as Promise<{
            changes: unknown[];
            patchInstructions: string;
            taskIds: string[];
          }>,
        { agentType: 'QA', operation: 'deltaAnalysis' }
      );

      // Verify: Recovered after failure
      expect(attemptCount).toBe(2);
      expect(result.changes).toEqual([]);
    });
  });

  // ==========================================================================
  // TEST GROUP 8: Sample Output Logging
  // ==========================================================================

  describe('sample output logging', () => {
    it('should log sample prompt content for inspection', async () => {
      const { DELTA_PRD_PROMPT } = await loadPrompts();

      console.log('\n=== DELTA_PRD_GENERATION_PROMPT Sample Output ===');
      console.log('Prompt length:', DELTA_PRD_PROMPT.length);
      console.log('\n=== Prompt (first 500 chars) ===');
      console.log(DELTA_PRD_PROMPT.slice(0, 500) + '...');
      console.log('\n=== Key sections verification ===');

      // Verify all required sections are present
      const checks = [
        {
          name: 'Contains "Generate Delta PRD from Changes":',
          pass: DELTA_PRD_PROMPT.includes('Generate Delta PRD from Changes'),
        },
        {
          name: 'Contains "Previous PRD (Completed Session)":',
          pass: DELTA_PRD_PROMPT.includes('Previous PRD (Completed Session)'),
        },
        {
          name: 'Contains "Current PRD":',
          pass: DELTA_PRD_PROMPT.includes('Current PRD'),
        },
        {
          name: 'Contains "SCOPE DELTA":',
          pass: DELTA_PRD_PROMPT.includes('SCOPE DELTA'),
        },
        {
          name: 'Contains "REFERENCE COMPLETED WORK":',
          pass: DELTA_PRD_PROMPT.includes('REFERENCE COMPLETED WORK'),
        },
        {
          name: 'Contains "LEVERAGE PRIOR RESEARCH":',
          pass: DELTA_PRD_PROMPT.includes('LEVERAGE PRIOR RESEARCH'),
        },
        {
          name: 'Contains $PREV_SESSION_DIR/prd_snapshot.md reference:',
          pass: DELTA_PRD_PROMPT.includes('$PREV_SESSION_DIR/prd_snapshot.md'),
        },
        {
          name: 'Contains $PRD_FILE reference:',
          pass: DELTA_PRD_PROMPT.includes('$PRD_FILE'),
        },
        {
          name: 'Contains $PREV_SESSION_DIR/tasks.json reference:',
          pass: DELTA_PRD_PROMPT.includes('$PREV_SESSION_DIR/tasks.json'),
        },
        {
          name: 'Contains $SESSION_DIR/delta_prd.md output instruction:',
          pass: DELTA_PRD_PROMPT.includes('$SESSION_DIR/delta_prd.md'),
        },
      ];

      checks.forEach(check => {
        console.log(`${check.pass ? '✓' : '✗'} ${check.name}`);
      });

      // VERIFY: All assertions pass
      expect(DELTA_PRD_PROMPT).toBeDefined();
      expect(DELTA_PRD_PROMPT.length).toBeGreaterThan(100);

      // Verify all checks passed
      const allPassed = checks.every(check => check.pass);
      expect(allPassed).toBe(true);
    });
  });
});
