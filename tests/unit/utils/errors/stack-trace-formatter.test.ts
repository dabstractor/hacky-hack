/**
 * Unit tests for StackTraceFormatter
 *
 * @remarks
 * Tests validate the complete stack trace formatter functionality including:
 * 1. formatStackTrace() - parses error and returns FormattedStackTrace
 * 2. parseStackTrace() - correctly parses V8 stack traces
 * 3. filterUserFrames() - filters to user code only
 * 4. calculateRelevance() - scores frames correctly
 * 5. isUserCode() - identifies user code patterns
 * 6. getSourceContext() - reads file and extracts context (mock fs.readFile)
 * 7. Error handling when file doesn't exist
 * 8. Empty stack traces
 * 9. Stack traces with no user code
 * 10. Different file path patterns (src/, lib/, node_modules/)
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  StackFrame,
  SourceContext,
} from '../../../../src/utils/errors/types.js';

// Mock fs/promises before importing the module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { StackTraceFormatter } from '../../../../src/utils/errors/stack-trace-formatter.js';
import { readFile } from 'node:fs/promises';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('StackTraceFormatter', () => {
  let formatter: StackTraceFormatter;

  beforeEach(() => {
    formatter = new StackTraceFormatter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // formatStackTrace() tests
  // ========================================================================

  describe('formatStackTrace()', () => {
    it('should parse error and return FormattedStackTrace', async () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at FunctionName (/project/src/file.ts:10:5)
    at AnotherFunction (/project/lib/helper.ts:20:10)`;

      vi.mocked(readFile).mockResolvedValue(`Line 1
Line 2
Line 3
Line 4
Line 5
Line 6
Line 7
Line 8
Line 9
Line 10
Line 11
Line 12`);

      const result = await formatter.formatStackTrace(error);

      expect(result).toBeDefined();
      expect(result.message).toBe('Test error');
      expect(result.errorType).toBe('Error');
      expect(result.frames).toBeInstanceOf(Array);
      expect(result.sourceContext).toBeDefined();
    });

    it('should include source context for most relevant frame', async () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at userFunction (/project/src/index.ts:42:8)
    at internalFunction (/project/node_modules/lib/index.js:10:5)`;

      const mockFileContent =
        'Line 40\nLine 41\nLine 42\nLine 43\nLine 44\nLine 45';
      vi.mocked(readFile).mockResolvedValue(mockFileContent);

      const result = await formatter.formatStackTrace(error);

      expect(result.sourceContext).toBeDefined();
      expect(result.sourceContext?.file).toBe('/project/src/index.ts');
      expect(result.sourceContext?.line).toBe(42);
      expect(result.sourceContext?.column).toBe(8);
      expect(result.sourceContext?.codeLines).toBeDefined();
    });

    it('should handle errors with no stack trace', async () => {
      const error = new Error('Test error');
      delete (error as unknown as { stack?: string }).stack;

      const result = await formatter.formatStackTrace(error);

      expect(result.message).toBe('Test error');
      expect(result.errorType).toBe('Error');
      expect(result.frames).toEqual([]);
      expect(result.sourceContext).toBeUndefined();
    });

    it('should handle errors with empty stack trace', async () => {
      const error = new Error('Test error');
      error.stack = '';

      const result = await formatter.formatStackTrace(error);

      expect(result.frames).toEqual([]);
      expect(result.sourceContext).toBeUndefined();
    });

    it('should handle when no user code frames exist', async () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at internalFunction (/project/node_modules/lib/index.js:10:5)
    at anotherInternal (/internal/module.js:5:10)`;

      const result = await formatter.formatStackTrace(error);

      expect(result.frames).toEqual([]);
      expect(result.sourceContext).toBeUndefined();
    });

    it('should return undefined sourceContext when file read fails', async () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at userFunction (/project/src/index.ts:42:8)`;

      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

      const result = await formatter.formatStackTrace(error);

      expect(result.frames.length).toBeGreaterThan(0);
      expect(result.sourceContext).toBeUndefined();
    });
  });

  // ========================================================================
  // parseStackTrace() tests
  // ========================================================================

  describe('parseStackTrace()', () => {
    it('should correctly parse V8 stack traces with function names', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at myFunction (/project/src/file.ts:10:5)
    at anotherFunction (/project/lib/helper.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      expect(frames).toHaveLength(2);

      expect(frames[0].functionName).toBe('myFunction');
      expect(frames[0].filePath).toBe('/project/src/file.ts');
      expect(frames[0].line).toBe(10);
      expect(frames[0].column).toBe(5);

      expect(frames[1].functionName).toBe('anotherFunction');
      expect(frames[1].filePath).toBe('/project/lib/helper.ts');
      expect(frames[1].line).toBe(20);
      expect(frames[1].column).toBe(10);
    });

    it('should parse stack traces without function names', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at /project/src/file.ts:10:5
    at /project/lib/helper.ts:20:10`;

      const frames = formatter.parseStackTrace(error);

      expect(frames).toHaveLength(2);

      expect(frames[0].functionName).toBe('<anonymous>');
      expect(frames[0].filePath).toBe('/project/src/file.ts');
      expect(frames[0].line).toBe(10);

      expect(frames[1].functionName).toBe('<anonymous>');
      expect(frames[1].filePath).toBe('/project/lib/helper.ts');
      expect(frames[1].line).toBe(20);
    });

    it('should handle stack traces without column numbers', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at myFunction (/project/src/file.ts:10)
    at anotherFunction (/project/lib/helper.ts:20)`;

      const frames = formatter.parseStackTrace(error);

      expect(frames).toHaveLength(2);
      expect(frames[0].line).toBe(10);
      expect(frames[0].column).toBeUndefined();
      expect(frames[1].line).toBe(20);
      expect(frames[1].column).toBeUndefined();
    });

    it('should handle anonymous functions', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at /project/src/file.ts:10:5
    at anonymous (/project/lib/helper.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      expect(frames.length).toBeGreaterThan(0);
      // Anonymous functions are represented by their file path
    });

    it('should skip unparseable lines', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at myFunction (/project/src/file.ts:10:5)
    Some unparseable line
    at anotherFunction (/project/lib/helper.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      // Should only parse the valid lines
      expect(frames.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for error without stack', () => {
      const error = new Error('Test error');
      delete (error as unknown as { stack?: string }).stack;

      const frames = formatter.parseStackTrace(error);

      expect(frames).toEqual([]);
    });

    it('should sort frames by relevance score', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at libFunction (/project/lib/helper.ts:20:10)
    at srcFunction (/project/src/file.ts:10:5)
    at nodeFunction (/project/node_modules/pkg/index.js:5:5)`;

      const frames = formatter.parseStackTrace(error);

      // Should be sorted by relevance (highest first)
      expect(frames[0].filePath).toContain('/src/');
      expect(frames[0].relevanceScore).toBeGreaterThanOrEqual(
        frames[1].relevanceScore
      );
    });

    it('should handle Windows-style paths', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at myFunction (C:\\project\\src\\file.ts:10:5)`;

      const frames = formatter.parseStackTrace(error);

      expect(frames.length).toBeGreaterThan(0);
      expect(frames[0].filePath).toContain('file.ts');
    });
  });

  // ========================================================================
  // filterUserFrames() tests
  // ========================================================================

  describe('filterUserFrames()', () => {
    it('should filter to user code only', () => {
      const frames: StackFrame[] = [
        {
          functionName: 'srcFunction',
          filePath: '/project/src/file.ts',
          line: 10,
          column: 5,
          isUserCode: true,
          relevanceScore: 0.8,
        },
        {
          functionName: 'libFunction',
          filePath: '/project/lib/helper.ts',
          line: 20,
          column: 10,
          isUserCode: true,
          relevanceScore: 0.6,
        },
        {
          functionName: 'nodeFunction',
          filePath: '/project/node_modules/pkg/index.js',
          line: 5,
          column: 5,
          isUserCode: false,
          relevanceScore: 0.2,
        },
      ];

      const filtered = formatter.filterUserFrames(frames);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(f => f.isUserCode)).toBe(true);
      expect(filtered.every(f => f.relevanceScore > 0.3)).toBe(true);
    });

    it('should filter out low relevance frames', () => {
      const frames: StackFrame[] = [
        {
          functionName: 'lowRelevance',
          filePath: '/project/src/file.ts',
          line: 10,
          column: 5,
          isUserCode: true,
          relevanceScore: 0.2,
        },
        {
          functionName: 'highRelevance',
          filePath: '/project/src/file.ts',
          line: 20,
          column: 10,
          isUserCode: true,
          relevanceScore: 0.8,
        },
      ];

      const filtered = formatter.filterUserFrames(frames);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].functionName).toBe('highRelevance');
    });

    it('should handle empty array', () => {
      const filtered = formatter.filterUserFrames([]);
      expect(filtered).toEqual([]);
    });

    it('should return empty array when no user code frames', () => {
      const frames: StackFrame[] = [
        {
          functionName: 'internal',
          filePath: '/internal/module.js',
          line: 5,
          column: 5,
          isUserCode: false,
          relevanceScore: 0.1,
        },
        {
          functionName: 'nodeModule',
          filePath: '/project/node_modules/pkg/index.js',
          line: 10,
          column: 10,
          isUserCode: false,
          relevanceScore: 0.2,
        },
      ];

      const filtered = formatter.filterUserFrames(frames);

      expect(filtered).toEqual([]);
    });

    it('should filter out frames with relevance exactly 0.3', () => {
      const frames: StackFrame[] = [
        {
          functionName: 'borderline',
          filePath: '/project/src/file.ts',
          line: 10,
          column: 5,
          isUserCode: true,
          relevanceScore: 0.3,
        },
        {
          functionName: 'above',
          filePath: '/project/src/file.ts',
          line: 20,
          column: 10,
          isUserCode: true,
          relevanceScore: 0.31,
        },
      ];

      const filtered = formatter.filterUserFrames(frames);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].functionName).toBe('above');
    });
  });

  // ========================================================================
  // calculateRelevance() tests
  // ========================================================================

  describe('calculateRelevance()', () => {
    it('should score user code higher', () => {
      const userFrame: StackFrame = {
        functionName: 'userFunction',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0,
      };

      const libraryFrame: StackFrame = {
        functionName: 'libraryFunction',
        filePath: '/project/node_modules/pkg/index.js',
        line: 5,
        column: 5,
        isUserCode: false,
        relevanceScore: 0,
      };

      const userScore = formatter.calculateRelevance(userFrame);
      const libraryScore = formatter.calculateRelevance(libraryFrame);

      expect(userScore).toBeGreaterThan(libraryScore);
    });

    it('should give bonus to /src/ directory', () => {
      const srcFrame: StackFrame = {
        functionName: 'srcFunction',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0,
      };

      const libFrame: StackFrame = {
        functionName: 'libFunction',
        filePath: '/project/lib/helper.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0,
      };

      const srcScore = formatter.calculateRelevance(srcFrame);
      const libScore = formatter.calculateRelevance(libFrame);

      expect(srcScore).toBeGreaterThan(libScore);
    });

    it('should penalize library code', () => {
      const nodeModulesFrame: StackFrame = {
        functionName: 'depFunction',
        filePath: '/project/node_modules/pkg/index.js',
        line: 10,
        column: 5,
        isUserCode: false,
        relevanceScore: 0,
      };

      const score = formatter.calculateRelevance(nodeModulesFrame);

      // Base score (0.5) - library penalty (0.4) = 0.1
      expect(score).toBeLessThan(0.3);
    });

    it('should clamp scores to [0, 1]', () => {
      // Test that score never exceeds 1
      const highScoreFrame: StackFrame = {
        functionName: 'function',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0,
      };

      const score = formatter.calculateRelevance(highScoreFrame);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);

      // Test that score never goes below 0
      const lowScoreFrame: StackFrame = {
        functionName: 'function',
        filePath: '/project/node_modules/pkg/internal/index.js',
        line: 10,
        column: 5,
        isUserCode: false,
        relevanceScore: 0,
      };

      const lowScore = formatter.calculateRelevance(lowScoreFrame);
      expect(lowScore).toBeGreaterThanOrEqual(0);
      expect(lowScore).toBeLessThanOrEqual(1);
    });

    it('should calculate correct scores for different patterns', () => {
      const srcFrame: StackFrame = {
        functionName: 'function',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0,
      };

      const libFrame: StackFrame = {
        functionName: 'function',
        filePath: '/project/lib/helper.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0,
      };

      const nodeModulesFrame: StackFrame = {
        functionName: 'function',
        filePath: '/project/node_modules/pkg/index.js',
        line: 10,
        column: 5,
        isUserCode: false,
        relevanceScore: 0,
      };

      const srcScore = formatter.calculateRelevance(srcFrame);
      const libScore = formatter.calculateRelevance(libFrame);
      const nodeScore = formatter.calculateRelevance(nodeModulesFrame);

      expect(srcScore).toBeGreaterThanOrEqual(0.9); // 0.5 + 0.3 + 0.2 = 1.0
      expect(libScore).toBeGreaterThanOrEqual(0.7); // 0.5 + 0.3 = 0.8
      expect(nodeScore).toBeLessThan(0.3); // 0.5 - 0.4 = 0.1
    });

    it('should handle internal module pattern', () => {
      const internalFrame: StackFrame = {
        functionName: 'internalFunction',
        filePath: 'internal/module.js',
        line: 10,
        column: 5,
        isUserCode: false,
        relevanceScore: 0,
      };

      const score = formatter.calculateRelevance(internalFrame);
      expect(score).toBeLessThan(0.3);
    });
  });

  // ========================================================================
  // isUserCode() tests
  // ========================================================================

  describe('isUserCode()', () => {
    it('should identify /src/ as user code', () => {
      const result = formatter.isUserCode('/project/src/file.ts');
      expect(result).toBe(true);
    });

    it('should identify /lib/ as user code', () => {
      const result = formatter.isUserCode('/project/lib/helper.ts');
      expect(result).toBe(true);
    });

    it('should identify relative TypeScript imports as user code', () => {
      const result = formatter.isUserCode('./file.ts:10');
      expect(result).toBe(true);
    });

    it('should identify node_modules as library code', () => {
      const result = formatter.isUserCode('/project/node_modules/pkg/index.js');
      expect(result).toBe(false);
    });

    it('should identify internal modules as library code', () => {
      const result = formatter.isUserCode('internal/module.js');
      expect(result).toBe(false);
    });

    it('should identify yarn internals as library code', () => {
      const result = formatter.isUserCode('/project/.yarn/cache/pkg.js');
      expect(result).toBe(false);
    });

    it('should identify pnpm internals as library code', () => {
      const result = formatter.isUserCode('/project/.pnpm/pkg.js');
      expect(result).toBe(false);
    });

    it('should identify native code as library code', () => {
      const result = formatter.isUserCode('[native code]');
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = formatter.isUserCode('');
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = formatter.isUserCode(undefined as unknown as string);
      expect(result).toBe(false);
    });

    it('should handle various path patterns', () => {
      expect(formatter.isUserCode('/app/src/components/Button.tsx')).toBe(true);
      expect(formatter.isUserCode('/app/lib/utils/format.ts')).toBe(true);
      expect(
        formatter.isUserCode('/app/node_modules/@types/node/index.d.ts')
      ).toBe(false);
      expect(formatter.isUserCode('/app/dist/index.js')).toBe(false);
      expect(formatter.isUserCode('./test.ts:42')).toBe(true);
    });

    it('should prioritize library pattern over user pattern', () => {
      // If a path contains both user and library patterns, library wins
      const result = formatter.isUserCode(
        '/project/src/node_modules/pkg/index.js'
      );
      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // getSourceContext() tests
  // ========================================================================

  describe('getSourceContext()', () => {
    it('should read file and extract context', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = Array.from(
        { length: 20 },
        (_, i) => `Line ${i + 1}`
      ).join('\n');
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context).toBeDefined();
      expect(context?.file).toBe('/project/src/file.ts');
      expect(context?.line).toBe(10);
      expect(context?.column).toBe(5);
      expect(context?.codeLines).toBeDefined();
      expect(context?.codeLines).toHaveLength(6); // 4 before + error line + 1 after
      // startLine = max(0, 10-4) = 6, errorLineIndex = 10 - 6 - 1 = 3
      expect(context?.errorLineIndex).toBe(3);
      expect(context?.codeLines?.[context.errorLineIndex]).toBe('Line 10');
    });

    it('should handle context near start of file', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 2,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = Array.from(
        { length: 10 },
        (_, i) => `Line ${i + 1}`
      ).join('\n');
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context?.codeLines).toBeDefined();
      expect(context?.codeLines.length).toBeLessThanOrEqual(4); // Limited by file start
    });

    it('should handle context near end of file', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 9,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = Array.from(
        { length: 10 },
        (_, i) => `Line ${i + 1}`
      ).join('\n');
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      // startLine = max(0, 9-4) = 5, endLine = min(10, 9+2) = 10
      // codeLines = lines.slice(5, 10) = 5 lines
      expect(context?.codeLines).toBeDefined();
      expect(context?.codeLines.length).toBe(5);
    });

    it('should return undefined when file does not exist', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/nonexistent.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      vi.mocked(readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      const context = await formatter.getSourceContext(frame);

      expect(context).toBeUndefined();
    });

    it('should return undefined when read fails', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      vi.mocked(readFile).mockRejectedValue(new Error('Permission denied'));

      const context = await formatter.getSourceContext(frame);

      expect(context).toBeUndefined();
    });

    it('should handle file with no lines', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/empty.ts',
        line: 1,
        column: 1,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      vi.mocked(readFile).mockResolvedValue('');

      const context = await formatter.getSourceContext(frame);

      expect(context).toBeDefined();
      expect(context?.codeLines).toEqual(['']);
    });

    it('should handle file with single line', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/single.ts',
        line: 1,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      vi.mocked(readFile).mockResolvedValue('Only line');

      const context = await formatter.getSourceContext(frame);

      expect(context?.codeLines).toEqual(['Only line']);
    });

    it('should calculate correct errorLineIndex', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 15,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = Array.from(
        { length: 30 },
        (_, i) => `Line ${i + 1}`
      ).join('\n');
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      // Line 15, startLine = max(0, 15-4) = 11, endLine = min(30, 15+2) = 17
      // codeLines = lines.slice(11, 17) = lines 11-16 (6 lines)
      // errorLineIndex = 15 - 11 - 1 = 3
      expect(context?.errorLineIndex).toBe(3);
      expect(context?.codeLines?.[context.errorLineIndex]).toBe('Line 15');
    });

    it('should handle frames without column number', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 10,
        column: undefined,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = Array.from(
        { length: 20 },
        (_, i) => `Line ${i + 1}`
      ).join('\n');
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context?.column).toBeUndefined();
      expect(context?.codeLines).toBeDefined();
    });
  });

  // ========================================================================
  // Edge cases and integration tests
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle error with only library code', async () => {
      const error = new Error('Library error');
      error.stack = `Error: Library error
    at Module.load (internal/modules/cjs/loader.js:100:10)
    at Function.Module._load (internal/modules/cjs/loader.js:50:10)
    at Module.require (internal/modules/cjs/loader.js:200:10)`;

      const result = await formatter.formatStackTrace(error);

      expect(result.frames).toEqual([]);
      expect(result.sourceContext).toBeUndefined();
      expect(result.message).toBe('Library error');
    });

    it('should handle mixed user and library code', async () => {
      const error = new Error('Mixed error');
      error.stack = `Error: Mixed error
    at userFunction (/project/src/file.ts:10:5)
    at Module.load (internal/modules/cjs/loader.js:100:10)
    at anotherUser (/project/lib/helper.ts:20:10)
    at depFunction (/project/node_modules/pkg/index.js:50:5)`;

      const result = await formatter.formatStackTrace(error);

      expect(result.frames.length).toBe(2);
      expect(result.frames.every(f => f.isUserCode)).toBe(true);
    });

    it('should handle deeply nested stack traces', async () => {
      const error = new Error('Deep error');
      const stackLines = [`Error: Deep error`];
      for (let i = 0; i < 50; i++) {
        stackLines.push(`    at fn${i} (/project/src/file${i}.ts:${i * 10}:5)`);
      }
      error.stack = stackLines.join('\n');

      const frames = formatter.parseStackTrace(error);

      expect(frames.length).toBe(50);
      expect(frames[0].relevanceScore).toBeGreaterThanOrEqual(
        frames[frames.length - 1].relevanceScore
      );
    });

    it('should handle various V8 stack trace formats', () => {
      const error1 = new Error('Format 1');
      error1.stack = `Error: Format 1
    at TypeError (<anonymous>:3:9)
    at test (/project/src/test.ts:10:5)`;

      const frames1 = formatter.parseStackTrace(error1);
      expect(frames1.length).toBeGreaterThan(0);

      const error2 = new Error('Format 2');
      error2.stack = `Error: Format 2
    at /project/src/test.ts:10:5`;

      const frames2 = formatter.parseStackTrace(error2);
      expect(frames2.length).toBeGreaterThan(0);
    });

    it('should handle special characters in file paths', () => {
      const error = new Error('Special chars');
      error.stack = `Error: Special chars
    at fn (/project/src/[test]/file with spaces.ts:10:5)
    at fn2 (/project/src/file-with-dashes.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      expect(frames.length).toBeGreaterThan(0);
    });

    it('should handle very long file paths', () => {
      const longPath = '/very/long/path/' + 'a'.repeat(200) + '/file.ts';
      const error = new Error('Long path');
      error.stack = `Error: Long path
    at fn (${longPath}:10:5)`;

      const frames = formatter.parseStackTrace(error);

      expect(frames.length).toBeGreaterThan(0);
      expect(frames[0].filePath).toContain(longPath);
    });

    it('should handle async stack traces', () => {
      const error = new Error('Async error');
      error.stack = `Error: Async error
    at asyncFunction (/project/src/async.ts:10:5)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)
    at async anotherAsync (/project/src/another.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      // May not parse "async" prefix, but should still get some frames
      expect(frames.length).toBeGreaterThan(0);
    });

    it('should handle eval frames', () => {
      const error = new Error('Eval error');
      error.stack = `Error: Eval error
    at eval at test (/project/src/file.ts:10:5)
    at userFunction (/project/src/other.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      expect(frames.length).toBeGreaterThan(0);
    });

    it('should maintain sorting stability with equal scores', () => {
      const error = new Error('Equal scores');
      error.stack = `Error: Equal scores
    at fn1 (/project/src/file1.ts:10:5)
    at fn2 (/project/src/file2.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      // Both should have same relevance score
      expect(frames[0].relevanceScore).toBe(frames[1].relevanceScore);
      expect(frames).toHaveLength(2);
    });
  });

  // ========================================================================
  // Real-world scenario tests
  // ========================================================================

  describe('Real-world scenarios', () => {
    it('should handle typical Node.js application error', async () => {
      const error = new Error('Database connection failed');
      error.stack = `Error: Database connection failed
    at Database.connect (/project/src/database/connection.ts:42:12)
    at App.initialize (/project/src/app.ts:20:8)
    at Object.<anonymous> (/project/src/index.ts:5:10)
    at Module._compile (internal/modules/cjs/loader.js:125:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:200:10)
    at Module.load (internal/modules/cjs/loader.js:100:10)
    at Function.Module._load (internal/modules/cjs/loader.js:50:10)`;

      const result = await formatter.formatStackTrace(error);

      expect(result.frames.length).toBe(3);
      expect(result.frames[0].filePath).toContain('/src/');
      expect(result.sourceContext?.file).toContain('/src/');
    });

    it('should handle TypeScript compilation error', async () => {
      const error = new Error('Type error');
      error.stack = `Error: Type error
    at validate (/project/src/validators/schema.ts:15:20)
    at processInput (/project/src/process.ts:30:15)`;

      const mockContent = Array.from(
        { length: 40 },
        (_, i) => `const line${i} = ${i};`
      ).join('\n');
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const result = await formatter.formatStackTrace(error);

      expect(result.frames).toHaveLength(2);
      expect(result.sourceContext?.codeLines).toBeDefined();
      expect(result.sourceContext?.codeLines.length).toBeGreaterThan(0);
    });

    it('should handle error from dependency with user trigger', async () => {
      const error = new Error('Validation failed');
      error.stack = `Error: Validation failed
    at Schema.validate (/project/node_modules/joi/lib/index.js:100:15)
    at userFunction (/project/src/validator.ts:25:10)
    at handler (/project/src/routes.ts:40:8)`;

      const result = await formatter.formatStackTrace(error);

      // Should only show user code frames
      expect(result.frames.length).toBe(2);
      expect(result.frames.every(f => f.filePath.includes('/src/'))).toBe(true);
    });

    it('should prioritize /src/ over /lib/ in sorting', () => {
      const error = new Error('Priority test');
      error.stack = `Error: Priority test
    at libFunction (/project/lib/util.ts:10:5)
    at srcFunction (/project/src/main.ts:20:10)`;

      const frames = formatter.parseStackTrace(error);

      // src function should be first due to higher relevance
      expect(frames[0].filePath).toContain('/src/');
    });
  });

  // ========================================================================
  // File path pattern tests
  // ========================================================================

  describe('File path patterns', () => {
    it('should correctly identify src/ paths', () => {
      const paths = [
        '/project/src/file.ts',
        '/app/src/components/Button.tsx',
        './src/index.ts',
        '/absolute/path/to/src/lib.ts',
      ];

      paths.forEach(path => {
        expect(formatter.isUserCode(path)).toBe(true);
      });
    });

    it('should correctly identify lib/ paths', () => {
      const paths = [
        '/project/lib/file.ts',
        '/app/lib/utils.ts',
        './lib/helper.ts',
      ];

      paths.forEach(path => {
        expect(formatter.isUserCode(path)).toBe(true);
      });
    });

    it('should correctly identify node_modules paths', () => {
      const paths = [
        '/project/node_modules/pkg/index.js',
        '/app/node_modules/@scope/lib/dist/index.js',
        './node_modules/typescript/lib/index.d.ts',
      ];

      paths.forEach(path => {
        expect(formatter.isUserCode(path)).toBe(false);
      });
    });

    it('should correctly identify internal module paths', () => {
      const paths = [
        'internal/modules/cjs/loader.js',
        'internal/process/task_queues.js',
        'internal/v8/runtime.js',
      ];

      paths.forEach(path => {
        expect(formatter.isUserCode(path)).toBe(false);
      });
    });

    it('should correctly identify package manager internals', () => {
      const paths = [
        '/project/.yarn/cache/pkg.js',
        '/project/.pnpm/pkg.js',
        '/project/node_modules/.pnpm/pkg.js',
      ];

      paths.forEach(path => {
        expect(formatter.isUserCode(path)).toBe(false);
      });
    });

    it('should handle relative TypeScript imports', () => {
      const paths = [
        './file.ts:10:5',
        './src/component.tsx:20:10',
        '../lib/utils.ts:5:15',
      ];

      paths.forEach(path => {
        expect(formatter.isUserCode(path)).toBe(true);
      });
    });

    it('should reject non-matching paths', () => {
      const paths = [
        '/project/dist/index.js',
        '/project/build/app.js',
        '/tmp/script.js',
        '/etc/config/file',
      ];

      paths.forEach(path => {
        expect(formatter.isUserCode(path)).toBe(false);
      });
    });
  });

  // ========================================================================
  // Relevance scoring edge cases
  // ========================================================================

  describe('Relevance scoring edge cases', () => {
    it('should handle maximum score (1.0)', () => {
      const frame: StackFrame = {
        functionName: 'function',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0,
      };

      const score = formatter.calculateRelevance(frame);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle minimum score (0.0)', () => {
      const frame: StackFrame = {
        functionName: 'function',
        filePath: '/project/node_modules/pkg/internal/index.js',
        line: 10,
        column: 5,
        isUserCode: false,
        relevanceScore: 0,
      };

      const score = formatter.calculateRelevance(frame);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should score mixed scenarios correctly', () => {
      const scenarios = [
        {
          path: '/project/src/file.ts',
          isUser: true,
          minExpected: 0.9,
        },
        {
          path: '/project/lib/helper.ts',
          isUser: true,
          minExpected: 0.7,
        },
        {
          path: '/project/node_modules/pkg/index.js',
          isUser: false,
          maxExpected: 0.3,
        },
        {
          path: 'internal/module.js',
          isUser: false,
          maxExpected: 0.3,
        },
      ];

      scenarios.forEach(scenario => {
        const frame: StackFrame = {
          functionName: 'function',
          filePath: scenario.path,
          line: 10,
          column: 5,
          isUserCode: scenario.isUser,
          relevanceScore: 0,
        };

        const score = formatter.calculateRelevance(frame);

        if (scenario.minExpected) {
          expect(score).toBeGreaterThanOrEqual(scenario.minExpected);
        }
        if (scenario.maxExpected) {
          expect(score).toBeLessThanOrEqual(scenario.maxExpected);
        }
      });
    });
  });

  // ========================================================================
  // Source context edge cases
  // ========================================================================

  describe('Source context edge cases', () => {
    it('should handle file with CRLF line endings', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 5,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent =
        'Line 1\r\nLine 2\r\nLine 3\r\nLine 4\r\nLine 5\r\nLine 6\r\nLine 7';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context?.codeLines).toBeDefined();
      expect(context?.codeLines.length).toBeGreaterThan(0);
    });

    it('should handle file with mixed line endings', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 3,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = 'Line 1\nLine 2\r\nLine 3\rLine 4\nLine 5';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context?.codeLines).toBeDefined();
    });

    it('should handle file with very long lines', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 5,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const longLine = 'a'.repeat(10000);
      const mockContent = Array.from({ length: 10 }, () => longLine).join('\n');
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context?.codeLines).toBeDefined();
      expect(context?.codeLines?.[0].length).toBe(10000);
    });

    it('should handle file with unicode content', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 5,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = 'Line 1\n日本語の行\n🎉 emoji line\nLine 4\nLine 5';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context?.codeLines).toBeDefined();
      expect(context?.codeLines?.some(line => line.includes('日本語'))).toBe(
        true
      );
    });

    it('should handle file with tabs', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 3,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      const mockContent = 'Line 1\n\t\tTabbed line\nLine 3';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const context = await formatter.getSourceContext(frame);

      expect(context?.codeLines).toBeDefined();
      expect(context?.codeLines?.[1]).toContain('\t');
    });
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  describe('Error handling', () => {
    it('should handle readFile throwing non-Error', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      vi.mocked(readFile).mockImplementation(() => {
        throw 'String error';
      });

      const context = await formatter.getSourceContext(frame);

      expect(context).toBeUndefined();
    });

    it('should handle readFile throwing null', async () => {
      const frame: StackFrame = {
        functionName: 'testFunction',
        filePath: '/project/src/file.ts',
        line: 10,
        column: 5,
        isUserCode: true,
        relevanceScore: 0.8,
      };

      vi.mocked(readFile).mockImplementation(() => {
        throw null;
      });

      const context = await formatter.getSourceContext(frame);

      expect(context).toBeUndefined();
    });

    it('should handle error with undefined stack', async () => {
      const error = new Error('Test');
      (error as unknown as { stack: undefined }).stack = undefined;

      const result = await formatter.formatStackTrace(error);

      expect(result.frames).toEqual([]);
      expect(result.sourceContext).toBeUndefined();
    });

    it('should handle error with null stack', async () => {
      const error = new Error('Test');
      (error as unknown as { stack: null }).stack = null;

      const result = await formatter.formatStackTrace(error);

      expect(result.frames).toEqual([]);
      expect(result.sourceContext).toBeUndefined();
    });
  });
});
