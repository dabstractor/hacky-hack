/**
 * Fix suggestion engine for common errors
 *
 * @module utils/errors/recommendation-engine
 *
 * @remarks
 * Analyzes errors and generates actionable fix suggestions with commands,
 * explanations, and documentation links.
 *
 * @example
 * ```typescript
 * import { RecommendationEngine } from './recommendation-engine.js';
 *
 * const engine = new RecommendationEngine();
 * const fixes = engine.generateFixes(error, { taskId: 'P1.M1.T1.S1' });
 * console.log(fixes[0].description);
 * console.log(fixes[0].command);
 * ```
 */

import type { SuggestedFix } from './types.js';
import type { PipelineErrorContext } from '../errors.js';

/**
 * Documentation URLs for common error patterns
 */
const DOCS_URLS = {
  typeValidation: 'https://hacky-hack.dev/docs/types/validation',
  sessionConfiguration: 'https://hacky-hack.dev/docs/sessions/config',
  apiKeys: 'https://hacky-hack.dev/docs/api-keys',
  dependencies: 'https://hacky-hack.dev/docs/dependencies',
  errors: 'https://hacky-hack.dev/docs/errors',
} as const;

/**
 * Fix generator function type
 */
type FixGenerator = (
  error: Error,
  context: PipelineErrorContext
) => SuggestedFix[];

/**
 * Recommendation engine for error fix suggestions
 *
 * @remarks
 * Maps error patterns to actionable fixes. Uses error codes, error types,
 * and message patterns to generate relevant suggestions.
 */
export class RecommendationEngine {
  /** Error pattern to fix mapping */
  readonly #fixPatterns = new Map<string, FixGenerator>([
    // Type validation errors
    [
      'PIPELINE_TASK_VALIDATION_FAILED',
      (_error, _context) => [
        {
          priority: 1,
          description: 'Verify type definitions are correct',
          command: 'npm run check',
          explanation: 'Run TypeScript compiler to identify type errors',
          docsUrl: DOCS_URLS.typeValidation,
        },
        {
          priority: 2,
          description: 'Check type imports and exports',
          command: 'grep -r "import.*type" src/',
          explanation: 'Verify all type imports point to valid definitions',
        },
      ],
    ],
    // Session errors
    [
      'PIPELINE_SESSION_LOAD_FAILED',
      (_error, context) => [
        {
          priority: 1,
          description: 'Verify session configuration file exists',
          command: `ls -la ${context.sessionPath || '.'}/tasks.json`,
          explanation:
            'Check if the session tasks.json exists in the expected location',
          docsUrl: DOCS_URLS.sessionConfiguration,
        },
        {
          priority: 2,
          description: 'Validate configuration file format',
          command: `cat ${context.sessionPath || '.'}/tasks.json | jq .`,
          explanation: 'Ensure JSON is valid and matches expected schema',
        },
        {
          priority: 3,
          description: 'Check session directory permissions',
          command: 'ls -ld plan/*',
          explanation: 'Verify read/write access to session directories',
        },
      ],
    ],
    // Agent LLM errors
    [
      'PIPELINE_AGENT_LLM_FAILED',
      (_error, _context) => [
        {
          priority: 1,
          description: 'Check API key configuration',
          command: 'echo $ANTHROPIC_API_KEY | wc -c',
          explanation: 'Verify API key is set and not empty',
          docsUrl: DOCS_URLS.apiKeys,
        },
        {
          priority: 2,
          description: 'Test API connectivity',
          command: 'npm run test-api',
          explanation: 'Verify connection to API endpoint',
        },
        {
          priority: 3,
          description: 'Check API rate limits',
          command: 'npm run check-api-limits',
          explanation: 'Ensure you have not exceeded rate limits',
        },
      ],
    ],
    // Agent timeout errors
    [
      'PIPELINE_AGENT_TIMEOUT',
      (_error, context) => [
        {
          priority: 1,
          description: 'Increase timeout for this task',
          command: `# Edit PRP for ${context.taskId || 'task'} and increase timeout`,
          explanation:
            'The task took longer than the configured timeout allows',
        },
        {
          priority: 2,
          description: 'Check for infinite loops or long operations',
          command: 'grep -r "while.*true" src/',
          explanation: 'Look for code that may not terminate',
        },
      ],
    ],
    // Validation schema errors
    [
      'PIPELINE_VALIDATION_SCHEMA_FAILED',
      (_error, _context) => [
        {
          priority: 1,
          description: 'Validate PRD structure',
          command: 'npm run validate-prd',
          explanation: 'Check PRD against schema requirements',
        },
        {
          priority: 2,
          description: 'Check PRD template compliance',
          command: 'npm run check-prd-template -- --fix',
          explanation: 'Ensure PRD follows required template format',
        },
        {
          priority: 3,
          description: 'Review required fields',
          command: 'cat PRD.md | grep -A 5 "## Description"',
          explanation: 'Verify all required sections are present',
        },
      ],
    ],
    // Circular dependency errors
    [
      'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY',
      (_error, _context) => [
        {
          priority: 1,
          description: 'Visualize dependency graph',
          command: 'npm run show-dependencies',
          explanation: 'Display the dependency graph to identify cycles',
        },
        {
          priority: 2,
          description: 'Check task dependencies in tasks.json',
          command:
            'cat plan/*/tasks.json | jq ".backlog[].milestones[].tasks[].subtasks[] | select(.dependencies | length > 0)"',
          explanation: 'Review all tasks with dependencies',
        },
      ],
    ],
    // Task execution errors
    [
      'PIPELINE_TASK_EXECUTION_FAILED',
      (_error, context) => [
        {
          priority: 1,
          description: 'Review task implementation logs',
          command: `cat plan/*/artifacts/${context.taskId || 'TASK'}/*.log`,
          explanation: 'Check detailed logs for the root cause',
        },
        {
          priority: 2,
          description: 'Verify task dependencies are complete',
          command: `npm run prp -- --task ${context.taskId || 'TASK'} --check-deps`,
          explanation: 'Ensure all dependencies completed successfully',
        },
      ],
    ],
  ]);

  /**
   * Generate fix suggestions for an error
   *
   * @param error - The error to analyze
   * @param context - Pipeline error context
   * @returns Array of suggested fixes
   *
   * @remarks
   * Matches error codes to fix patterns, then falls back to message
   * pattern matching for generic errors.
   */
  generateFixes(error: Error, context: PipelineErrorContext): SuggestedFix[] {
    // Check for specific error code patterns
    if ('code' in error && typeof error.code === 'string') {
      const patternFixes = this.#fixPatterns.get(error.code);
      if (patternFixes) {
        return patternFixes(error, context);
      }
    }

    // Check error constructor name for fallback patterns
    const constructorName = error.constructor.name;
    const fallbackFixes = this.#getFallbackFixes(
      constructorName,
      error,
      context
    );
    if (fallbackFixes) {
      return fallbackFixes;
    }

    // Generic error handling based on error message patterns
    if (error.message.includes('Cannot find module')) {
      return [
        {
          priority: 1,
          description: 'Install missing dependency',
          command: 'npm install',
          explanation: 'Install all package dependencies',
          docsUrl: DOCS_URLS.dependencies,
        },
      ];
    }

    if (
      error.message.includes('EACCES') ||
      error.message.includes('permission denied')
    ) {
      return [
        {
          priority: 1,
          description: 'Check file permissions',
          command: 'ls -la',
          explanation: 'Verify you have permission to access the file',
        },
        {
          priority: 2,
          description: 'Run with appropriate permissions',
          command: 'sudo npm run prp -- --continue',
          explanation: 'Use sudo if administrative access is required',
        },
      ];
    }

    if (
      error.message.includes('ENOSPC') ||
      error.message.includes('No space left')
    ) {
      return [
        {
          priority: 1,
          description: 'Check disk space',
          command: 'df -h',
          explanation: 'Verify available disk space',
        },
        {
          priority: 2,
          description: 'Clean up node_modules and cache',
          command: 'rm -rf node_modules .cache && npm install',
          explanation: 'Free up space by cleaning dependencies and cache',
        },
      ];
    }

    // Default generic suggestions
    return [
      {
        priority: 1,
        description: 'Review error details above',
        explanation:
          'Check the error message and stack trace for specific issues',
      },
      {
        priority: 2,
        description: 'Check documentation',
        docsUrl: DOCS_URLS.errors,
      },
      {
        priority: 3,
        description: 'Review task PRP for context',
        command: `cat plan/*/prps/${context.taskId || 'TASK'}/PRP.md`,
        explanation: 'Check the PRP for implementation requirements',
      },
    ];
  }

  /**
   * Match error pattern to suggestion key
   *
   * @param _error - The error to analyze
   * @returns Pattern key or null
   *
   * @remarks
   * Analyzes error messages and types to identify common patterns.
   */
  matchErrorPattern(_error: Error): string | null {
    if ('code' in _error && typeof _error.code === 'string') {
      return _error.code;
    }

    if (_error.message.includes('type') || _error.message.includes('Type')) {
      return 'TYPE_ERROR';
    }

    if (
      _error.message.includes('module') ||
      _error.message.includes('import')
    ) {
      return 'MODULE_ERROR';
    }

    if (
      _error.message.includes('timeout') ||
      _error.message.includes('Timeout')
    ) {
      return 'TIMEOUT_ERROR';
    }

    return null;
  }

  /**
   * Build command from template with parameters
   *
   * @param template - Command template with {{placeholders}}
   * @param _params - Parameters to substitute
   * @returns Formatted command string
   *
   * @remarks
   * Replaces {{key}} placeholders with values from params.
   */
  buildCommand(template: string, _params: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => _params[key] || '');
  }

  /**
   * Get documentation link for error code
   *
   * @param _errorCode - Error code to look up
   * @returns Documentation URL or undefined
   */
  getDocsLink(_errorCode: string): string | undefined {
    const docsMap: Record<string, string> = {
      PIPELINE_TASK_VALIDATION_FAILED: DOCS_URLS.typeValidation,
      PIPELINE_SESSION_LOAD_FAILED: DOCS_URLS.sessionConfiguration,
      PIPELINE_AGENT_LLM_FAILED: DOCS_URLS.apiKeys,
    };

    return docsMap[_errorCode];
  }

  /**
   * Get fallback fixes by constructor name
   *
   * @param constructorName - Error constructor name
   * @param _error - The error instance
   * @param _context - Pipeline error context
   * @returns Fix suggestions or null
   */
  #getFallbackFixes(
    constructorName: string,
    _error: Error,
    _context: PipelineErrorContext
  ): SuggestedFix[] | null {
    switch (constructorName) {
      case 'TypeError':
        return [
          {
            priority: 1,
            description: 'Run type checking',
            command: 'npm run check',
            explanation: 'TypeScript will identify type mismatches',
            docsUrl: DOCS_URLS.typeValidation,
          },
        ];
      case 'ReferenceError':
        return [
          {
            priority: 1,
            description: 'Check for undefined variables',
            command: 'grep -r "console.log" src/ | grep -v "//"',
            explanation: 'Look for references to undefined variables',
          },
        ];
      case 'SyntaxError':
        return [
          {
            priority: 1,
            description: 'Validate syntax',
            command: 'npm run lint -- --fix',
            explanation: 'ESLint will identify syntax errors',
          },
        ];
      default:
        return null;
    }
  }
}
