/**
 * Environment configuration module for z.ai API compatibility
 *
 * @module config/environment
 *
 * @remarks
 * This module provides type-safe access to Anthropic/z.ai API configuration.
 * It handles the critical mapping between shell environment variables and
 * SDK expectations, validates configuration, and provides model selection.
 *
 * @example
 * ```ts
 * import { configureEnvironment, getModel, validateEnvironment } from './config/environment.js';
 *
 * // Configure environment at application startup
 * configureEnvironment();
 *
 * // Validate required variables are set
 * validateEnvironment();
 *
 * // Get model name for agent creation
 * const model = getModel('sonnet'); // 'GLM-4.7'
 * ```
 */

import { DEFAULT_BASE_URL, MODEL_NAMES, MODEL_ENV_VARS } from './constants.js';
import type { ModelTier } from './types.js';
import { EnvironmentValidationError } from './types.js';

/**
 * Configure environment variables for z.ai API compatibility
 *
 * @remarks
 * Maps ANTHROPIC_AUTH_TOKEN (shell) to ANTHROPIC_API_KEY (SDK expectation).
 * Sets default values for optional variables like ANTHROPIC_BASE_URL.
 *
 * This function modifies `process.env` in place as an intentional side effect.
 * The mapping is critical because the shell environment uses ANTHROPIC_AUTH_TOKEN
 * but the Anthropic SDK expects ANTHROPIC_API_KEY.
 *
 * Only maps ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if ANTHROPIC_API_KEY is
 * not already set. This preserves existing API_KEY values.
 *
 * @example
 * ```ts
 * import { configureEnvironment } from './config/environment.js';
 *
 * // Must be called before creating agents
 * configureEnvironment();
 *
 * // After this call, process.env.ANTHROPIC_API_KEY is available
 * console.log(process.env.ANTHROPIC_BASE_URL); // 'https://api.z.ai/api/anthropic'
 * ```
 */
export function configureEnvironment(): void {
  // Map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if API_KEY is not already set
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL if not already provided
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
  }
}

/**
 * Get the model name for a given model tier
 *
 * @remarks
 * Returns the model name for the specified tier, checking environment variables
 * for overrides first, then falling back to default values.
 *
 * Model tier mappings:
 * - 'opus': GLM-4.7 (highest quality, complex reasoning, Architect agent)
 * - 'sonnet': GLM-4.7 (balanced, default for most agents)
 * - 'haiku': GLM-4.5-Air (fastest, simple operations, quick tasks)
 *
 * @param tier - The model tier identifier ('opus' | 'sonnet' | 'haiku')
 * @returns The model name to use for agent creation
 *
 * @example
 * ```ts
 * import { getModel } from './config/environment.js';
 * import type { ModelTier } from './config/types.js';
 *
 * const opusModel = getModel('opus'); // 'GLM-4.7'
 * const sonnetModel = getModel('sonnet'); // 'GLM-4.7'
 * const haikuModel = getModel('haiku'); // 'GLM-4.5-Air'
 *
 * // Can be overridden with environment variables
 * process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = 'GLM-4.7';
 * const customHaiku = getModel('haiku'); // 'GLM-4.7'
 * ```
 */
export function getModel(tier: ModelTier): string {
  const envVar = MODEL_ENV_VARS[tier];
  return process.env[envVar] ?? MODEL_NAMES[tier];
}

/**
 * Validate that all required environment variables are set
 *
 * @remarks
 * Checks that ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL exist after
 * configuration is complete. Throws a descriptive error if any are missing.
 *
 * Should be called after {@link configureEnvironment} to ensure the
 * environment is properly configured for agent creation.
 *
 * @throws {EnvironmentValidationError} When required environment variables are missing.
 * The error message includes all missing variable names for easy debugging.
 *
 * @example
 * ```ts
 * import { configureEnvironment, validateEnvironment } from './config/environment.js';
 *
 * configureEnvironment();
 *
 * // Validate before proceeding with agent creation
 * try {
 *   validateEnvironment();
 *   console.log('Environment is properly configured');
 * } catch (error) {
 *   if (error instanceof EnvironmentValidationError) {
 *     console.error('Missing variables:', error.missing);
 *   }
 * }
 * ```
 */
export function validateEnvironment(): void {
  const missing: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (!process.env.ANTHROPIC_BASE_URL) {
    missing.push('ANTHROPIC_BASE_URL');
  }

  if (missing.length > 0) {
    throw new EnvironmentValidationError(missing);
  }
}

// Re-export types for convenience
export type { ModelTier, EnvironmentConfig } from './types.js';
export { EnvironmentValidationError } from './types.js';
