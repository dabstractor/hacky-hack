/**
 * Unit tests for RecommendationEngine
 *
 * @remarks
 * Tests validate the recommendation engine functionality including:
 * 1. Constructor - creates engine with fix patterns
 * 2. generateFixes() - returns SuggestedFix[] for known error codes:
 *    - PIPELINE_TASK_VALIDATION_FAILED
 *    - PIPELINE_SESSION_LOAD_FAILED
 *    - PIPELINE_AGENT_LLM_FAILED
 *    - PIPELINE_AGENT_TIMEOUT
 *    - PIPELINE_VALIDATION_SCHEMA_FAILED
 *    - PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY
 *    - PIPELINE_TASK_EXECUTION_FAILED
 * 3. generateFixes() - handles generic error patterns:
 *    - Cannot find module errors
 *    - EACCES permission errors
 *    - ENOSPC disk space errors
 * 4. generateFixes() - returns default suggestions for unknown errors
 * 5. generateFixes() - includes proper priority ordering
 * 6. matchErrorPattern() - identifies error patterns
 * 7. buildCommand() - substitutes {{placeholders}} with params
 * 8. getDocsLink() - returns documentation URLs or undefined
 * 9. Error constructor name fallback (TypeError, ReferenceError, SyntaxError)
 * 10. Fix includes description, command, explanation, and docsUrl
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RecommendationEngine } from '../../../../src/utils/errors/recommendation-engine.js';
import type { SuggestedFix } from '../../../../src/utils/errors/types.js';
import type { PipelineErrorContext } from '../../../../src/utils/errors.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  afterEach(() => {
    // No cleanup needed
  });

  // ========================================================================
  // Constructor tests
  // ========================================================================

  describe('Constructor', () => {
    it('should create engine instance', () => {
      expect(engine).toBeDefined();
      expect(engine instanceof RecommendationEngine).toBe(true);
    });

    it('should initialize with fix patterns', () => {
      // Test that engine can generate fixes (evidence patterns are loaded)
      const error = new Error('Test error') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(Array.isArray(fixes)).toBe(true);
      expect(fixes.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // generateFixes() - Known error codes
  // ========================================================================

  describe('generateFixes() - PIPELINE_TASK_VALIDATION_FAILED', () => {
    it('should return fixes for task validation error', () => {
      const error = new Error('Task validation failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
    });

    it('should include type check command as priority 1', () => {
      const error = new Error('Task validation failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Verify type definitions are correct');
      expect(fixes[0].command).toBe('npm run check');
      expect(fixes[0].explanation).toBe(
        'Run TypeScript compiler to identify type errors'
      );
      expect(fixes[0].docsUrl).toBe(
        'https://hacky-hack.dev/docs/types/validation'
      );
    });

    it('should include type import check as priority 2', () => {
      const error = new Error('Task validation failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe('Check type imports and exports');
      expect(fixes[1].command).toBe('grep -r "import.*type" src/');
      expect(fixes[1].explanation).toBe(
        'Verify all type imports point to valid definitions'
      );
    });
  });

  describe('generateFixes() - PIPELINE_SESSION_LOAD_FAILED', () => {
    it('should return fixes for session load error', () => {
      const error = new Error('Session load failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';
      const context: PipelineErrorContext = { sessionPath: '/path/to/session' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(3);
    });

    it('should include session config verification as priority 1', () => {
      const error = new Error('Session load failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';
      const context: PipelineErrorContext = { sessionPath: '/path/to/session' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe(
        'Verify session configuration file exists'
      );
      expect(fixes[0].command).toContain('ls -la');
      expect(fixes[0].command).toContain('/path/to/session');
      expect(fixes[0].docsUrl).toBe(
        'https://hacky-hack.dev/docs/sessions/config'
      );
    });

    it('should include JSON validation as priority 2', () => {
      const error = new Error('Session load failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';
      const context: PipelineErrorContext = { sessionPath: '/path/to/session' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe('Validate configuration file format');
      expect(fixes[1].command).toContain('jq');
    });

    it('should include permission check as priority 3', () => {
      const error = new Error('Session load failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[2].priority).toBe(3);
      expect(fixes[2].description).toBe('Check session directory permissions');
      expect(fixes[2].command).toBe('ls -ld plan/*');
    });

    it('should use default session path when not provided', () => {
      const error = new Error('Session load failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].command).toContain('./tasks.json');
    });
  });

  describe('generateFixes() - PIPELINE_AGENT_LLM_FAILED', () => {
    it('should return fixes for agent LLM error', () => {
      const error = new Error('LLM failed') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_LLM_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(3);
    });

    it('should include API key check as priority 1', () => {
      const error = new Error('LLM failed') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_LLM_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Check API key configuration');
      expect(fixes[0].command).toBe('echo $ANTHROPIC_API_KEY | wc -c');
      expect(fixes[0].explanation).toBe('Verify API key is set and not empty');
      expect(fixes[0].docsUrl).toBe('https://hacky-hack.dev/docs/api-keys');
    });

    it('should include API connectivity test as priority 2', () => {
      const error = new Error('LLM failed') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_LLM_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe('Test API connectivity');
      expect(fixes[1].command).toBe('npm run test-api');
    });

    it('should include rate limit check as priority 3', () => {
      const error = new Error('LLM failed') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_LLM_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[2].priority).toBe(3);
      expect(fixes[2].description).toBe('Check API rate limits');
      expect(fixes[2].command).toBe('npm run check-api-limits');
    });
  });

  describe('generateFixes() - PIPELINE_AGENT_TIMEOUT', () => {
    it('should return fixes for agent timeout error', () => {
      const error = new Error('Agent timeout') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_TIMEOUT';
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1.S1' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
    });

    it('should include timeout increase as priority 1', () => {
      const error = new Error('Agent timeout') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_TIMEOUT';
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1.S1' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Increase timeout for this task');
      expect(fixes[0].command).toContain('P1.M1.T1.S1');
      expect(fixes[0].explanation).toBe(
        'The task took longer than the configured timeout allows'
      );
    });

    it('should include infinite loop check as priority 2', () => {
      const error = new Error('Agent timeout') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_TIMEOUT';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe(
        'Check for infinite loops or long operations'
      );
      expect(fixes[1].command).toBe('grep -r "while.*true" src/');
    });

    it('should use default task placeholder when not provided', () => {
      const error = new Error('Agent timeout') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_TIMEOUT';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].command).toContain('task');
    });
  });

  describe('generateFixes() - PIPELINE_VALIDATION_SCHEMA_FAILED', () => {
    it('should return fixes for schema validation error', () => {
      const error = new Error('Schema validation failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_VALIDATION_SCHEMA_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(3);
    });

    it('should include PRD validation as priority 1', () => {
      const error = new Error('Schema validation failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_VALIDATION_SCHEMA_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Validate PRD structure');
      expect(fixes[0].command).toBe('npm run validate-prd');
    });

    it('should include template compliance check as priority 2', () => {
      const error = new Error('Schema validation failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_VALIDATION_SCHEMA_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe('Check PRD template compliance');
      expect(fixes[1].command).toBe('npm run check-prd-template -- --fix');
    });

    it('should include required fields review as priority 3', () => {
      const error = new Error('Schema validation failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_VALIDATION_SCHEMA_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[2].priority).toBe(3);
      expect(fixes[2].description).toBe('Review required fields');
      expect(fixes[2].command).toBe('cat PRD.md | grep -A 5 "## Description"');
    });
  });

  describe('generateFixes() - PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY', () => {
    it('should return fixes for circular dependency error', () => {
      const error = new Error('Circular dependency detected') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
    });

    it('should include dependency graph visualization as priority 1', () => {
      const error = new Error('Circular dependency detected') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Visualize dependency graph');
      expect(fixes[0].command).toBe('npm run show-dependencies');
      expect(fixes[0].explanation).toBe(
        'Display the dependency graph to identify cycles'
      );
    });

    it('should include tasks.json dependency check as priority 2', () => {
      const error = new Error('Circular dependency detected') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe(
        'Check task dependencies in tasks.json'
      );
      expect(fixes[1].command).toContain('jq');
      expect(fixes[1].explanation).toBe('Review all tasks with dependencies');
    });
  });

  describe('generateFixes() - PIPELINE_TASK_EXECUTION_FAILED', () => {
    it('should return fixes for task execution error', () => {
      const error = new Error('Task execution failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_TASK_EXECUTION_FAILED';
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1.S1' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
    });

    it('should include log review as priority 1', () => {
      const error = new Error('Task execution failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_TASK_EXECUTION_FAILED';
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1.S1' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Review task implementation logs');
      expect(fixes[0].command).toContain('P1.M1.T1.S1');
      expect(fixes[0].explanation).toBe(
        'Check detailed logs for the root cause'
      );
    });

    it('should include dependency check as priority 2', () => {
      const error = new Error('Task execution failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_TASK_EXECUTION_FAILED';
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1.S1' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe(
        'Verify task dependencies are complete'
      );
      expect(fixes[1].command).toContain('P1.M1.T1.S1');
      expect(fixes[1].explanation).toBe(
        'Ensure all dependencies completed successfully'
      );
    });

    it('should use TASK placeholder when taskId not provided', () => {
      const error = new Error('Task execution failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_TASK_EXECUTION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].command).toContain('TASK');
      expect(fixes[1].command).toContain('TASK');
    });
  });

  // ========================================================================
  // generateFixes() - Generic error patterns
  // ========================================================================

  describe('generateFixes() - Generic error patterns', () => {
    it('should handle "Cannot find module" errors', () => {
      const error = new Error("Cannot find module '@foo/package'");
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Install missing dependency');
      expect(fixes[0].command).toBe('npm install');
      expect(fixes[0].explanation).toBe('Install all package dependencies');
      expect(fixes[0].docsUrl).toBe('https://hacky-hack.dev/docs/dependencies');
    });

    it('should handle EACCES permission errors', () => {
      const error = new Error('EACCES: permission denied');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Check file permissions');
      expect(fixes[0].command).toBe('ls -la');

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe('Run with appropriate permissions');
      expect(fixes[1].command).toBe('sudo npm run prp -- --continue');
    });

    it('should handle "permission denied" errors', () => {
      const error = new Error("permission denied, open '/file'");
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
      expect(fixes[0].description).toBe('Check file permissions');
    });

    it('should handle ENOSPC disk space errors', () => {
      const error = new Error('ENOSPC: no space left on device');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Check disk space');
      expect(fixes[0].command).toBe('df -h');

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe('Clean up node_modules and cache');
      expect(fixes[1].command).toBe(
        'rm -rf node_modules .cache && npm install'
      );
    });

    it('should handle "No space left" errors', () => {
      const error = new Error('Error: No space left on device');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(2);
      expect(fixes[0].description).toBe('Check disk space');
    });
  });

  // ========================================================================
  // generateFixes() - Default suggestions for unknown errors
  // ========================================================================

  describe('generateFixes() - Default suggestions for unknown errors', () => {
    it('should return default suggestions for unknown errors', () => {
      const error = new Error('Unknown error occurred');
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1.S1' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(3);
    });

    it('should include "Review error details" as priority 1', () => {
      const error = new Error('Unknown error occurred');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Review error details above');
      expect(fixes[0].explanation).toBe(
        'Check the error message and stack trace for specific issues'
      );
    });

    it('should include "Check documentation" as priority 2', () => {
      const error = new Error('Unknown error occurred');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[1].priority).toBe(2);
      expect(fixes[1].description).toBe('Check documentation');
      expect(fixes[1].docsUrl).toBe('https://hacky-hack.dev/docs/errors');
    });

    it('should include "Review task PRP" as priority 3', () => {
      const error = new Error('Unknown error occurred');
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1.S1' };

      const fixes = engine.generateFixes(error, context);

      expect(fixes[2].priority).toBe(3);
      expect(fixes[2].description).toBe('Review task PRP for context');
      expect(fixes[2].command).toContain('P1.M1.T1.S1');
      expect(fixes[2].explanation).toBe(
        'Check the PRP for implementation requirements'
      );
    });

    it('should use TASK placeholder when taskId not provided for default', () => {
      const error = new Error('Unknown error occurred');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[2].command).toContain('TASK');
    });
  });

  // ========================================================================
  // generateFixes() - Priority ordering
  // ========================================================================

  describe('generateFixes() - Priority ordering', () => {
    it('should return fixes sorted by priority', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      // Verify priorities are in ascending order
      for (let i = 1; i < fixes.length; i++) {
        expect(fixes[i].priority).toBeGreaterThan(fixes[i - 1].priority);
      }
    });

    it('should assign sequential priorities starting from 1', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].priority).toBe(1);
      expect(fixes[1].priority).toBe(2);
      expect(fixes[2].priority).toBe(3);
    });
  });

  // ========================================================================
  // generateFixes() - Fix structure validation
  // ========================================================================

  describe('generateFixes() - Fix structure', () => {
    it('should include all required fields in fix', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);
      const fix = fixes[0];

      expect(fix).toHaveProperty('priority');
      expect(fix).toHaveProperty('description');
      expect(fix.priority).toBeGreaterThan(0);
      expect(typeof fix.description).toBe('string');
      expect(fix.description.length).toBeGreaterThan(0);
    });

    it('should include optional command field when applicable', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      // First fix has command
      expect(fixes[0].command).toBeDefined();
      expect(typeof fixes[0].command).toBe('string');

      // Some fixes might not have command (check default suggestions)
      const unknownError = new Error('Unknown error');
      const defaultFixes = engine.generateFixes(unknownError, {});
      // Priority 1 default fix doesn't have command
      expect(defaultFixes[0].command).toBeUndefined();
    });

    it('should include optional explanation field when applicable', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].explanation).toBeDefined();
      expect(typeof fixes[0].explanation).toBe('string');
    });

    it('should include optional docsUrl field when applicable', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes[0].docsUrl).toBeDefined();
      expect(typeof fixes[0].docsUrl).toBe('string');
      expect(fixes[0].docsUrl).toMatch(/^https?:\/\//);
    });
  });

  // ========================================================================
  // matchErrorPattern() - Error pattern identification
  // ========================================================================

  describe('matchErrorPattern()', () => {
    it('should return error code when error has code property', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('PIPELINE_TASK_VALIDATION_FAILED');
    });

    it('should return TYPE_ERROR for type-related messages', () => {
      const error = new Error('Type mismatch detected');

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('TYPE_ERROR');
    });

    it('should return TYPE_ERROR for capital Type messages', () => {
      const error = new Error('Type error in function');

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('TYPE_ERROR');
    });

    it('should return MODULE_ERROR for module-related messages', () => {
      const error = new Error('Cannot find module');

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('MODULE_ERROR');
    });

    it('should return MODULE_ERROR for import-related messages', () => {
      const error = new Error('import failed for package');

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('MODULE_ERROR');
    });

    it('should return TIMEOUT_ERROR for timeout messages', () => {
      const error = new Error('Operation timeout exceeded');

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('TIMEOUT_ERROR');
    });

    it('should return TIMEOUT_ERROR for capital Timeout messages', () => {
      const error = new Error('Request Timeout');

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('TIMEOUT_ERROR');
    });

    it('should return null for unrecognized errors', () => {
      const error = new Error('Some unknown error');

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBeNull();
    });

    it('should prioritize code property over message patterns', () => {
      const error = new Error('Type error') as Error & { code: string };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';

      const pattern = engine.matchErrorPattern(error);

      expect(pattern).toBe('PIPELINE_SESSION_LOAD_FAILED');
    });
  });

  // ========================================================================
  // buildCommand() - Placeholder substitution
  // ========================================================================

  describe('buildCommand()', () => {
    it('should replace single placeholder', () => {
      const template = 'cat {{file}}';
      const params = { file: '/path/to/file.txt' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('cat /path/to/file.txt');
    });

    it('should replace multiple placeholders', () => {
      const template = 'cp {{src}} {{dest}}';
      const params = { src: 'source.txt', dest: 'dest.txt' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('cp source.txt dest.txt');
    });

    it('should handle placeholder at start of template', () => {
      const template = '{{command}} --arg';
      const params = { command: 'npm' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('npm --arg');
    });

    it('should handle placeholder at end of template', () => {
      const template = 'echo {{message}}';
      const params = { message: 'hello' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('echo hello');
    });

    it('should replace repeated placeholders', () => {
      const template = '{{cmd}} && {{cmd}}';
      const params = { cmd: 'ls' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('ls && ls');
    });

    it('should replace placeholder with empty string when param missing', () => {
      const template = 'cat {{file}}';
      const params = {};

      const result = engine.buildCommand(template, params);

      expect(result).toBe('cat ');
    });

    it('should handle mixed placeholder and literal braces', () => {
      const template = 'echo "{{value}}" and {{value}}';
      const params = { value: 'test' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('echo "test" and test');
    });

    it('should not replace non-placeholder double braces', () => {
      const template = 'echo { literal }';
      const params = { literal: 'ignored' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('echo { literal }');
    });

    it('should handle underscores in placeholder names', () => {
      const template = '{{my_param}}';
      const params = { my_param: 'value' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('value');
    });

    it('should handle numbers in placeholder names', () => {
      const template = '{{param1}}';
      const params = { param1: 'value1' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('value1');
    });

    it('should handle complex command template', () => {
      const template = 'cat plan/{{sessionId}}/tasks.json | jq .';
      const params = { sessionId: 'abc123' };

      const result = engine.buildCommand(template, params);

      expect(result).toBe('cat plan/abc123/tasks.json | jq .');
    });
  });

  // ========================================================================
  // getDocsLink() - Documentation URLs
  // ========================================================================

  describe('getDocsLink()', () => {
    it('should return URL for PIPELINE_TASK_VALIDATION_FAILED', () => {
      const url = engine.getDocsLink('PIPELINE_TASK_VALIDATION_FAILED');

      expect(url).toBe('https://hacky-hack.dev/docs/types/validation');
    });

    it('should return URL for PIPELINE_SESSION_LOAD_FAILED', () => {
      const url = engine.getDocsLink('PIPELINE_SESSION_LOAD_FAILED');

      expect(url).toBe('https://hacky-hack.dev/docs/sessions/config');
    });

    it('should return URL for PIPELINE_AGENT_LLM_FAILED', () => {
      const url = engine.getDocsLink('PIPELINE_AGENT_LLM_FAILED');

      expect(url).toBe('https://hacky-hack.dev/docs/api-keys');
    });

    it('should return undefined for unmapped error codes', () => {
      const url = engine.getDocsLink('PIPELINE_AGENT_TIMEOUT');

      expect(url).toBeUndefined();
    });

    it('should return undefined for unknown error codes', () => {
      const url = engine.getDocsLink('UNKNOWN_ERROR_CODE');

      expect(url).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const url = engine.getDocsLink('');

      expect(url).toBeUndefined();
    });
  });

  // ========================================================================
  // Error constructor name fallback
  // ========================================================================

  describe('generateFixes() - Constructor name fallback', () => {
    it('should handle TypeError constructor', () => {
      const error = new TypeError('Type error occurred');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Run type checking');
      expect(fixes[0].command).toBe('npm run check');
      expect(fixes[0].explanation).toBe(
        'TypeScript will identify type mismatches'
      );
      expect(fixes[0].docsUrl).toBe(
        'https://hacky-hack.dev/docs/types/validation'
      );
    });

    it('should handle ReferenceError constructor', () => {
      const error = new ReferenceError('x is not defined');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Check for undefined variables');
      expect(fixes[0].command).toBe(
        'grep -r "console.log" src/ | grep -v "//"'
      );
      expect(fixes[0].explanation).toBe(
        'Look for references to undefined variables'
      );
    });

    it('should handle SyntaxError constructor', () => {
      const error = new SyntaxError('Unexpected token');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].priority).toBe(1);
      expect(fixes[0].description).toBe('Validate syntax');
      expect(fixes[0].command).toBe('npm run lint -- --fix');
      expect(fixes[0].explanation).toBe('ESLint will identify syntax errors');
    });

    it('should handle plain Error constructor', () => {
      const error = new Error('Generic error');
      const context: PipelineErrorContext = { taskId: 'P1.M1.T1' };

      const fixes = engine.generateFixes(error, context);

      // Should return default suggestions
      expect(fixes.length).toBeGreaterThanOrEqual(1);
      expect(fixes[0].description).toBe('Review error details above');
    });

    it('should prioritize error code over constructor name', () => {
      const error = new TypeError('Type error') as Error & { code: string };
      error.code = 'PIPELINE_AGENT_LLM_FAILED';
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      // Should use error code pattern, not TypeError fallback
      expect(fixes[0].description).toBe('Check API key configuration');
      expect(fixes[0].description).not.toBe('Run type checking');
    });

    it('should prioritize constructor name fallback over message patterns', () => {
      const error = new TypeError("Cannot find module 'foo'");
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      // Should use TypeError fallback (checked before message patterns)
      expect(fixes[0].description).toBe('Run type checking');
      expect(fixes[0].description).not.toBe('Install missing dependency');
    });
  });

  // ========================================================================
  // Integration scenarios
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should handle typical error with code and context', () => {
      const error = new Error('Session load failed') as Error & {
        code: string;
      };
      error.code = 'PIPELINE_SESSION_LOAD_FAILED';
      const context: PipelineErrorContext = {
        sessionPath: '/home/user/project/plan/abc123',
        taskId: 'P1.M1.T1',
      };

      const fixes = engine.generateFixes(error, context);

      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].command).toContain('/home/user/project/plan/abc123');
    });

    it('should handle error without code property', () => {
      const error = new Error('Some generic error');
      const context: PipelineErrorContext = {};

      const fixes = engine.generateFixes(error, context);

      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].description).toBe('Review error details above');
    });

    it('should handle empty context', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';
      const context: PipelineErrorContext = {};

      expect(() => engine.generateFixes(error, context)).not.toThrow();
    });

    it('should handle undefined context', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_VALIDATION_FAILED';

      expect(() =>
        engine.generateFixes(error, {} as PipelineErrorContext)
      ).not.toThrow();
    });

    it('should handle context with extra properties', () => {
      const error = new Error('Test') as Error & { code: string };
      error.code = 'PIPELINE_TASK_EXECUTION_FAILED';
      const context: PipelineErrorContext = {
        taskId: 'P1.M1.T1',
        attempt: 3,
        maxAttempts: 5,
        operation: 'executeTask',
        timestamp: Date.now(),
      };

      const fixes = engine.generateFixes(error, context);

      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].command).toContain('P1.M1.T1');
    });
  });
});
