/**
 * Type definitions for environment configuration module
 *
 * @module config/types
 */

/**
 * Model tier identifier for selecting GLM models
 *
 * @remarks
 * Each tier corresponds to a specific GLM model with different capabilities:
 * - 'opus': Highest quality, GLM-4.7 (complex reasoning, Architect agent)
 * - 'sonnet': Balanced, GLM-4.7 (default for most agents)
 * - 'haiku': Fastest, GLM-4.5-Air (simple operations, quick tasks)
 *
 * @example
 * ```ts
 * import type { ModelTier } from './config/types.js';
 *
 * const tier: ModelTier = 'sonnet';
 * ```
 */
export type ModelTier = 'opus' | 'sonnet' | 'haiku';

/**
 * Environment configuration interface
 *
 * @remarks
 * Defines the shape of validated environment variables.
 * All properties are required after configuration is complete.
 *
 * @example
 * ```ts
 * import type { EnvironmentConfig } from './config/types.js';
 *
 * const config: EnvironmentConfig = {
 *   apiKey: 'sk-ant-...',
 *   baseURL: 'https://api.z.ai/api/anthropic',
 *   opusModel: 'GLM-4.7',
 *   sonnetModel: 'GLM-4.7',
 *   haikuModel: 'GLM-4.5-Air',
 * };
 * ```
 */
export interface EnvironmentConfig {
  /** API authentication key (mapped from ANTHROPIC_AUTH_TOKEN) */
  readonly apiKey: string;
  /** Base URL for z.ai API endpoint */
  readonly baseURL: string;
  /** Model name for opus tier */
  readonly opusModel: string;
  /** Model name for sonnet tier */
  readonly sonnetModel: string;
  /** Model name for haiku tier */
  readonly haikuModel: string;
}

/**
 * Error thrown when required environment variables are missing
 *
 * @remarks
 * This error is thrown by {@link validateEnvironment} when one or more
 * required environment variables are not set. The error message includes
 * all missing variable names for easy debugging.
 *
 * @example
 * ```ts
 * import { EnvironmentValidationError } from './config/types.js';
 *
 * throw new EnvironmentValidationError(['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL']);
 * // Error: Missing required environment variables: ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL
 * ```
 */
export class EnvironmentValidationError extends Error {
  /** Array of missing environment variable names */
  readonly missing: string[];

  /**
   * Creates a new EnvironmentValidationError
   *
   * @param missing - Array of missing environment variable names
   */
  constructor(missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'EnvironmentValidationError';
    this.missing = missing;
  }
}
