/**
 * Bug hunt prompt generator module
 *
 * @module agents/prompts/bug-hunt-prompt
 *
 * @remarks
 * Provides a type-safe prompt generator for the QA Bug Hunt workflow.
 * Generates adversarial testing prompts with PRD context and completion status.
 */

// PATTERN: Import Groundswell prompt creation utilities
import { createPrompt, type Prompt } from 'groundswell';

// CRITICAL: Use .js extension for ES module imports
import type { TestResults, Task } from '../../core/models.js';
import { TestResultsSchema } from '../../core/models.js';

// PATTERN: Import system prompt from sibling prompts file
import { BUG_HUNT_PROMPT } from '../prompts.js';

/**
 * Construct the user prompt with PRD and completed tasks
 *
 * @param prd - The PRD markdown content
 * @param completedTasks - Array of completed Task objects
 * @returns Complete user prompt string with PRD context and BUG_HUNT_PROMPT
 *
 * @remarks
 * Builds a structured markdown prompt with:
 * - Original PRD section
 * - Completed Tasks section (with task listing)
 * - System prompt content (BUG_HUNT_PROMPT)
 *
 * The completed tasks section shows all work that has been completed,
 * allowing the QA agent to understand what was implemented and perform
 * targeted testing against those specific features.
 *
 * @example
 * ```typescript
 * const userPrompt = constructUserPrompt(
 *   '## My PRD\nBuild a feature.',
 *   [{ id: 'P1.M1.T1', title: 'Setup', status: 'Complete', description: '...', subtasks: [] }]
 * );
 * // Returns prompt with PRD and completed tasks list
 * ```
 */
function constructUserPrompt(prd: string, completedTasks: Task[]): string {
  // Build completed tasks list
  const tasksList =
    completedTasks.length > 0
      ? completedTasks
          .map(
            task =>
              `- ${task.id}: ${task.title}${
                task.description ? ` - ${task.description}` : ''
              }`
          )
          .join('\n')
      : 'No completed tasks yet';

  // Construct the complete user prompt
  return `
## Original PRD

${prd}

## Completed Tasks

${tasksList}

---

${BUG_HUNT_PROMPT}
`;
}

/**
 * Create a Bug Hunt prompt with structured TestResults output
 *
 * @remarks
 * Returns a Groundswell Prompt configured with:
 * - user: PRD content + completed tasks list + BUG_HUNT_PROMPT
 * - system: BUG_HUNT_PROMPT (QA Engineer persona)
 * - responseFormat: TestResultsSchema (type-safe JSON output)
 * - enableReflection: true (for thorough analysis reliability)
 *
 * The function accepts PRD content and an array of completed tasks.
 * The completed tasks list allows the QA agent to understand what
 * was implemented and perform targeted adversarial testing.
 *
 * The returned Prompt can be passed directly to agent.prompt():
 * ```typescript
 * const qaAgent = createQAAgent();
 * const prompt = createBugHuntPrompt(prd, completedTasks);
 * const result = await qaAgent.prompt(prompt);
 * // result is typed as z.infer<typeof TestResultsSchema> = TestResults
 * ```
 *
 * @param prd - The PRD markdown content to test against
 * @param completedTasks - Array of completed Task objects showing implementation progress
 * @returns Groundswell Prompt object configured for QA Bug Hunt
 *
 * @example
 * ```typescript
 * import { createBugHuntPrompt } from './agents/prompts/bug-hunt-prompt.js';
 *
 * const prd = '# My PRD\n## Requirements\nBuild a feature.';
 * const completedTasks = [
 *   {
 *     id: 'P1.M1.T1',
 *     title: 'Initialize Project',
 *     status: 'Complete',
 *     description: 'Setup project structure',
 *     subtasks: []
 *   }
 * ];
 *
 * const prompt = createBugHuntPrompt(prd, completedTasks);
 * const results = await qaAgent.prompt(prompt);
 * // results contains hasBugs, bugs, summary, recommendations
 * ```
 */
export function createBugHuntPrompt(
  prd: string,
  completedTasks: Task[]
): Prompt<TestResults> {
  // PATTERN: Use createPrompt with responseFormat for structured output
  return createPrompt({
    // The user prompt contains PRD + completed tasks + BUG_HUNT_PROMPT
    user: constructUserPrompt(prd, completedTasks),

    // The system prompt is the BUG_HUNT_PROMPT (QA Engineer persona)
    system: BUG_HUNT_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against TestResultsSchema
    responseFormat: TestResultsSchema,

    // CRITICAL: Enable reflection for complex bug analysis
    // Reflection provides error recovery for structured output
    enableReflection: true,
  });
}
