/**
 * Constants for environment configuration
 *
 * @module config/constants
 */

/**
 * Default base URL for the z.ai API endpoint
 *
 * @remarks
 * This is the custom proxy endpoint for z.ai, not the official Anthropic API.
 * Anthropic: https://api.anthropic.com
 * z.ai:      https://api.z.ai/api/anthropic
 *
 * @example
 * ```ts
 * import { DEFAULT_BASE_URL } from './config/constants.js';
 *
 * console.log(DEFAULT_BASE_URL); // 'https://api.z.ai/api/anthropic'
 * ```
 */
export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;

/**
 * Default model names for each tier
 *
 * @remarks
 * Maps each model tier to its corresponding GLM model name.
 * Uses const assertion to preserve literal types.
 *
 * - opus: GLM-4.7 (highest quality, complex reasoning)
 * - sonnet: GLM-4.7 (balanced, default for most agents)
 * - haiku: GLM-4.5-Air (fastest, simple operations)
 *
 * @example
 * ```ts
 * import { MODEL_NAMES } from './config/constants.js';
 *
 * const opusModel = MODEL_NAMES.opus; // 'GLM-4.7'
 * const haikuModel = MODEL_NAMES.haiku; // 'GLM-4.5-Air'
 * ```
 */
export const MODEL_NAMES = {
  /** Highest quality model for complex reasoning tasks */
  opus: 'GLM-4.7',
  /** Balanced model, default for most agents */
  sonnet: 'GLM-4.7',
  /** Fast model for simple operations */
  haiku: 'GLM-4.5-Air',
} as const;

/**
 * Environment variable names used for model overrides
 *
 * @remarks
 * These environment variables can be set to override the default model names.
 * If not set, the values from MODEL_NAMES will be used.
 *
 * @example
 * ```ts
 * // In shell:
 * export ANTHROPIC_DEFAULT_OPUS_MODEL="GLM-4.7"
 * ```
 */
export const MODEL_ENV_VARS = {
  opus: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
  sonnet: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
  haiku: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
} as const;

/**
 * Required environment variable names for SDK configuration
 *
 * @remarks
 * These variables must be set after configureEnvironment() is called.
 * ANTHROPIC_API_KEY is mapped from ANTHROPIC_AUTH_TOKEN if needed.
 */
export const REQUIRED_ENV_VARS = {
  apiKey: 'ANTHROPIC_API_KEY',
  baseURL: 'ANTHROPIC_BASE_URL',
} as const;
