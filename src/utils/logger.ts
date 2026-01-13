/**
 * Structured logging utility using pino for performance and observability
 *
 * @module utils/logger
 *
 * @remarks
 * Provides centralized, structured logging with sensitive data redaction,
 * context-aware loggers, and configurable output modes (pretty/JSON).
 *
 * Features:
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Sensitive data redaction (API keys, tokens, passwords)
 * - Context-aware loggers with consistent prefixes
 * - Pretty-printed output for development (colored, human-readable)
 * - Machine-readable JSON output for log aggregation
 * - Verbose mode for debug-level logging
 *
 * @example
 * ```typescript
 * import { getLogger, LogLevel } from './utils/logger.js';
 *
 * // Basic usage - get context-aware logger
 * const logger = getLogger('TaskOrchestrator');
 * logger.info('Task execution started');
 *
 * // With data object
 * logger.info({ taskId: 'P1.M1.T1', status: 'in_progress' }, 'Task status changed');
 *
 * // Child logger for additional context
 * const taskLogger = logger.child({ taskId: 'P1.M1.T1' });
 * taskLogger.info('Starting execution');
 *
 * // Sensitive data is auto-redacted
 * logger.info({ apiKey: 'sk-1234567890', userId: 'abc' }, 'API call');
 * // Output: {"apiKey":"[REDACTED]","userId":"abc",...}
 * ```
 */

// ===== TYPES =====

/**
 * Log levels enum matching pino standard levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger interface - consistent API across the application
 * Mirrors pino's Logger interface with type safety
 */
export interface Logger {
  /** Log at debug level - only shown when --verbose is enabled */
  debug(msg: string, ...args: unknown[]): void;
  debug(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Log at info level - default production level */
  info(msg: string, ...args: unknown[]): void;
  info(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Log at warn level - for non-critical issues */
  warn(msg: string, ...args: unknown[]): void;
  warn(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Log at error level - for failures and exceptions */
  error(msg: string, ...args: unknown[]): void;
  error(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Create a child logger with additional context */
  child(bindings: Record<string, unknown>): Logger;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Minimum log level (default: 'info') */
  level?: LogLevel;
  /** Enable machine-readable JSON output */
  machineReadable?: boolean;
  /** Enable debug-level logging (alias for level: 'debug') */
  verbose?: boolean;
}

// ===== CONSTANTS =====

/**
 * Sensitive data redaction paths
 *
 * @remarks
 * Uses dot-notation for nested object paths.
 * Pino redaction uses exact path matching.
 *
 * Critical: 'apiKey' redacts obj.apiKey but NOT obj.credentials.apiKey
 * Use wildcards: ['apiKey', 'credentials.*'] for nested redaction
 */
const REDACT_PATHS: readonly string[] = [
  // Common API key patterns
  'apiKey',
  'apiSecret',
  'api_key',
  'api_secret',
  'apiKeySecret',
  // Token patterns
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'bearerToken',
  'idToken',
  'sessionToken',
  // Credential patterns
  'password',
  'passwd',
  'secret',
  'privateKey',
  'private',
  // GDPR sensitive data
  'email',
  'emailAddress',
  'phoneNumber',
  'ssn',
  // Authorization headers
  'authorization',
  'Authorization',
  'headers.authorization',
  'headers.Authorization',
  'request.headers.authorization',
  'response.headers["set-cookie"]',
  // Groundswell-specific (from PRP context)
  'config.apiKey',
  'environment.ANTHROPIC_AUTH_TOKEN',
  'environment.ANTHROPIC_API_KEY',
] as const;

/**
 * Redaction censor value
 */
const REDACT_CENSOR = '[REDACTED]';

// ===== PRIVATE STATE =====

/**
 * Logger instance cache by context
 *
 * @remarks
 * Uses Map for caching logger instances.
 * Key is combination of context string and options object.
 */
const loggerCache = new Map<string, Logger>();

/**
 * Global logger configuration
 *
 * @remarks
 * Stores the last configuration to detect when to invalidate cache.
 */
let globalConfig: LoggerConfig = {};

/**
 * Synchronous pino reference (initialized on first call)
 *
 * @remarks
 * Using createRequire for synchronous loading to work with ES modules.
 * Top-level await is used to initialize pino at module load time.
 *
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncPino: any = null;

/**
 * Synchronous stdTimeFunctions reference
 *
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncStdTime: any = null;

/**
 * Initialize pino at module load time
 *
 * @remarks
 * Uses top-level await with createRequire to load pino synchronously
 * in ES module context. This ensures pino is available when getLogger()
 * is called.
 */
{
  // Use createRequire for synchronous loading in ES modules
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const pinoRequire = require('pino');
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  syncPino = pinoRequire.default ?? pinoRequire;
  syncStdTime = pinoRequire.stdTimeFunctions;
}

// ===== HELPER FUNCTIONS =====

/**
 * Generates cache key from context and options
 */
function getCacheKey(context: string, options?: LoggerConfig): string {
  const opts = options ?? {};
  return `${context}|${opts.level ?? 'info'}|${opts.machineReadable ?? false}|${opts.verbose ?? false}`;
}

/**
 * Creates pino logger configuration
 *
 * @param options - Logger configuration options
 * @returns Pino LoggerOptions object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createLoggerConfig(options: LoggerConfig = {}): any {
  const {
    level = LogLevel.INFO,
    machineReadable = false,
    verbose = false,
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseConfig: any = {
    // Set log level based on verbose flag or explicit level
    level: verbose ? LogLevel.DEBUG : level,
    // Configure redaction
    redact: {
      paths: [...REDACT_PATHS],
      censor: REDACT_CENSOR,
      remove: false, // Keep the key with censored value
    },
    // Timestamp in ISO format for log aggregation
    timestamp: syncStdTime?.isoTime ?? (() => new Date().toISOString()),
    // Custom formatters
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
  };

  // Add pretty print transport for development mode (not machine-readable)
  if (!machineReadable) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '[{context}] {msg}', // Add context prefix
          singleLine: false,
        },
      },
    };
  }

  return baseConfig;
}

/**
 * Wraps a pino logger with our Logger interface
 *
 * @param pinoLogger - The underlying pino logger instance
 * @returns Logger interface wrapper
 *
 * @remarks
 * Pino's logger interface supports multiple call signatures:
 * - log(msg: string): void
 * - log(obj: unknown, msg?: string): void
 *
 * This wrapper provides a consistent interface that matches our Logger type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapPinoLogger(pinoLogger: any): Logger {
  return {
    debug: (msgOrObj: unknown, msg?: string, ...args: unknown[]) => {
      if (typeof msgOrObj === 'string') {
        pinoLogger.debug(msgOrObj, ...args);
      } else {
        pinoLogger.debug(msgOrObj, msg, ...args);
      }
    },
    info: (msgOrObj: unknown, msg?: string, ...args: unknown[]) => {
      if (typeof msgOrObj === 'string') {
        pinoLogger.info(msgOrObj, ...args);
      } else {
        pinoLogger.info(msgOrObj, msg, ...args);
      }
    },
    warn: (msgOrObj: unknown, msg?: string, ...args: unknown[]) => {
      if (typeof msgOrObj === 'string') {
        pinoLogger.warn(msgOrObj, ...args);
      } else {
        pinoLogger.warn(msgOrObj, msg, ...args);
      }
    },
    error: (msgOrObj: unknown, msg?: string, ...args: unknown[]) => {
      if (typeof msgOrObj === 'string') {
        pinoLogger.error(msgOrObj, ...args);
      } else {
        pinoLogger.error(msgOrObj, msg, ...args);
      }
    },
    child: (bindings: Record<string, unknown>) => {
      const childPino = pinoLogger.child(bindings);
      return wrapPinoLogger(childPino);
    },
  };
}

// ===== PUBLIC API =====

/**
 * Logger factory function
 *
 * @param context - Context string for log identification (e.g., 'TaskOrchestrator')
 * @param options - Optional logger configuration
 * @returns Logger instance with context-aware logging
 *
 * @remarks
 * Creates or retrieves a cached logger instance for the given context.
 * Loggers are cached by context and options combination.
 *
 * The context is included in all log entries for filtering and tracing.
 *
 * @example
 * ```typescript
 * // Default configuration (INFO level, pretty print)
 * const logger = getLogger('MyComponent');
 *
 * // Verbose mode (DEBUG level)
 * const debugLogger = getLogger('MyComponent', { verbose: true });
 *
 * // Machine-readable JSON output
 * const jsonLogger = getLogger('MyComponent', { machineReadable: true });
 * ```
 */
export function getLogger(context: string, options?: LoggerConfig): Logger {
  // Check cache first
  const cacheKey = getCacheKey(context, options);
  const cached = loggerCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Create new logger
  const config = createLoggerConfig(options);
  const pinoLogger = syncPino({
    ...config,
    // Add context as default field
    base: {
      context,
    },
  });

  // Wrap with our Logger interface
  const logger = wrapPinoLogger(pinoLogger);

  // Cache the logger
  loggerCache.set(cacheKey, logger);
  globalConfig = options ?? {};

  return logger;
}

/**
 * Clears the logger cache
 *
 * @remarks
 * Invalidates all cached logger instances. Subsequent calls to getLogger()
 * will create new logger instances with fresh configuration.
 *
 * This is primarily useful for testing or when logger configuration
 * needs to be changed at runtime.
 */
export function clearLoggerCache(): void {
  loggerCache.clear();
  globalConfig = {};
}

/**
 * Gets the current global logger configuration
 *
 * @returns Current global logger configuration
 */
export function getGlobalConfig(): Readonly<LoggerConfig> {
  return { ...globalConfig };
}
