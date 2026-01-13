/**
 * Agent factory module for creating Groundswell agent configurations
 *
 * @module agents/agent-factory
 *
 * @remarks
 * Provides factory functions for creating type-safe agent configurations
 * tailored to specific personas (architect, researcher, coder, qa).
 * Each persona has optimized token limits and model selection.
 *
 * Environment configuration is performed at module load time to ensure
 * ANTHROPIC_AUTH_TOKEN is mapped to ANTHROPIC_API_KEY before any agents are created.
 *
 * @example
 * ```ts
 * import { createBaseConfig } from './agents/agent-factory.js';
 *
 * const architectConfig = createBaseConfig('architect');
 * // Returns AgentConfig with maxTokens: 8192, model: 'GLM-4.7'
 * ```
 */

import { configureEnvironment, getModel } from '../config/environment.js';
// PATTERN: Configure environment at module load time (intentional side effect)
// CRITICAL: This must execute before any agent creation
configureEnvironment();

/**
 * Agent persona identifier for selecting specialized configurations
 *
 * @remarks
 * Each persona corresponds to a specific role in the PRP Pipeline:
 * - 'architect': Analyzes PRDs and creates task breakdowns (needs larger token limit)
 * - 'researcher': Performs codebase and external research
 * - 'coder': Implements code based on PRP specifications
 * - 'qa': Validates implementations and hunts for bugs
 */
export type AgentPersona = 'architect' | 'researcher' | 'coder' | 'qa';

/**
 * Agent configuration interface matching Groundswell's createAgent() options
 *
 * @remarks
 * Extends the core Groundswell configuration with environment variable mapping.
 * All properties are readonly to ensure immutability after creation.
 *
 * @see {@link file:///home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md#L119} | Groundswell Agent Creation docs
 */
export interface AgentConfig {
  /** Agent identifier for logging and debugging */
  readonly name: string;
  /** System prompt for the agent */
  readonly system: string;
  /** Model identifier (e.g., 'GLM-4.7') */
  readonly model: string;
  /** Enable LLM response caching */
  readonly enableCache: boolean;
  /** Enable error recovery with reflection */
  readonly enableReflection: boolean;
  /** Maximum tokens in response */
  readonly maxTokens: number;
  /** Environment variable overrides for SDK configuration */
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly ANTHROPIC_BASE_URL: string;
  };
}

/**
 * Persona-specific token limits
 *
 * @remarks
 * Architect agents need more tokens for complex task breakdown analysis.
 * Other agents use standard token limits for their specific tasks.
 */
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;

/**
 * Create base agent configuration for a specific persona
 *
 * @remarks
 * Generates a Groundswell-compatible agent configuration optimized for
 * the specified persona. All personas use the sonnet model tier (GLM-4.7)
 * with caching and reflection enabled for optimal performance.
 *
 * Environment variables are mapped from shell conventions (ANTHROPIC_AUTH_TOKEN)
 * to SDK expectations (ANTHROPIC_API_KEY) via configureEnvironment().
 *
 * @param persona - The agent persona to create configuration for
 * @returns Groundswell-compatible agent configuration object
 *
 * @example
 * ```ts
 * import { createBaseConfig } from './agents/agent-factory.js';
 *
 * const architectConfig = createBaseConfig('architect');
 * // { name: 'ArchitectAgent', model: 'GLM-4.7', maxTokens: 8192, ... }
 *
 * const coderConfig = createBaseConfig('coder');
 * // { name: 'CoderAgent', model: 'GLM-4.7', maxTokens: 4096, ... }
 * ```
 */
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  // PATTERN: Use getModel() to resolve model tier to actual model name
  const model = getModel('sonnet'); // All personas use sonnet → GLM-4.7

  // PATTERN: Persona-specific naming (PascalCase with "Agent" suffix)
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;

  // GOTCHA: System prompt will be added in next subtask (P2.M1.T1.S2)
  // For now, use placeholder - this will be replaced with actual system prompts
  const system = `You are a ${persona} agent.`;

  // PATTERN: Readonly configuration object for immutability
  return {
    name,
    system,
    model,
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      // CRITICAL: Map environment variables for SDK compatibility
      // configureEnvironment() already mapped AUTH_TOKEN → API_KEY
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}

// PATTERN: Re-export types for convenience
