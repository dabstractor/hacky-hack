/**
 * Architect prompt generator module
 *
 * @module agents/prompts/architect-prompt
 *
 * @remarks
 * Provides a type-safe prompt generator for the Architect Agent.
 * Uses Groundswell's createPrompt() with BacklogSchema for structured output.
 */

// PATTERN: Import Groundswell prompt creation utilities
import { createPrompt, type Prompt } from 'groundswell';

// CRITICAL: Use .js extension for ES module imports
import type { Backlog } from '../../core/models.js';
import { BacklogSchema } from '../../core/models.js';

// PATTERN: Import system prompt from sibling prompts file
import { TASK_BREAKDOWN_PROMPT } from '../prompts.js';

/**
 * Create an Architect Agent prompt with structured Backlog output
 *
 * @remarks
 * Returns a Groundswell Prompt configured with:
 * - user: The PRD content (provided as parameter)
 * - system: TASK_BREAKDOWN_PROMPT (LEAD TECHNICAL ARCHITECT persona)
 * - responseFormat: BacklogSchema (ensures type-safe JSON output)
 * - enableReflection: true (for complex decomposition reliability)
 *
 * The returned Prompt can be passed directly to agent.prompt():
 * ```typescript
 * const architect = createArchitectAgent();
 * const prompt = createArchitectPrompt(prdContent);
 * const result = await architect.prompt(prompt);
 * // result is typed as z.infer<typeof BacklogSchema> = Backlog
 * ```
 *
 * @param prdContent - The PRD markdown content to analyze
 * @returns Groundswell Prompt object configured for Architect Agent
 *
 * @example
 * ```typescript
 * import { createArchitectPrompt } from './agents/prompts/architect-prompt.js';
 *
 * const prd = '# My PRD\n...';
 * const prompt = createArchitectPrompt(prd);
 * const { backlog } = await agent.prompt(prompt);
 * ```
 */
export function createArchitectPrompt(prdContent: string): Prompt<Backlog> {
  // PATTERN: Use createPrompt with responseFormat for structured output
  return createPrompt({
    // The user prompt is the PRD content to analyze
    user: prdContent,

    // The system prompt is the LEAD TECHNICAL ARCHITECT persona
    system: TASK_BREAKDOWN_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against this schema
    responseFormat: BacklogSchema,

    // CRITICAL: Enable reflection for complex task decomposition
    // Reflection provides error recovery for multi-level JSON generation
    enableReflection: true,
  });
}
