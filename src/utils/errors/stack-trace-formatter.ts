/**
 * Stack trace formatting and source context extraction
 *
 * @module utils/errors/stack-trace-formatter
 *
 * @remarks
 * Provides utilities for parsing, filtering, and formatting stack traces
 * with source code context. Collapses library frames and highlights user code.
 *
 * @example
 * ```typescript
 * import { StackTraceFormatter } from './stack-trace-formatter.js';
 *
 * const formatter = new StackTraceFormatter();
 * const formatted = await formatter.formatStackTrace(error);
 * console.log(formatted.frames);
 * console.log(formatted.sourceContext);
 * ```
 */

import { readFile } from 'node:fs/promises';
import type {
  StackFrame,
  FormattedStackTrace,
  SourceContext,
} from './types.js';

/**
 * Stack trace formatter with relevance scoring and source context
 *
 * @remarks
 * Parses error stack traces, identifies user vs library code, calculates
 * relevance scores, and extracts source context for the most relevant frame.
 */
export class StackTraceFormatter {
  /** Patterns for identifying user code vs library code */
  readonly #userCodePatterns = [
    /\/src\//, // Project source code
    /\/lib\//, // Project library code
    /^\.\/.*\.ts:/, // Relative TypeScript imports
  ];

  /** Patterns for identifying library code */
  readonly #libraryPatterns = [
    /\/node_modules\//, // Node.js dependencies
    /internal\//, // Node.js internals
    /\/\.yarn\//, // Yarn internals
    /\/\.pnpm\//, // pnpm internals
    /\[native code\]/, // Native code
  ];

  /**
   * Format an error's stack trace with context
   *
   * @param error - The error to format
   * @returns Formatted stack trace with source context
   *
   * @remarks
   * Parses the stack trace, filters for user code, sorts by relevance,
   * and extracts source context for the most relevant frame.
   */
  async formatStackTrace(error: Error): Promise<FormattedStackTrace> {
    const frames = this.parseStackTrace(error);
    const userFrames = this.filterUserFrames(frames);

    // Get source context for most relevant frame
    const mostRelevant = userFrames[0];
    let sourceContext: SourceContext | undefined;

    if (mostRelevant != null) {
      sourceContext = await this.getSourceContext(mostRelevant);
    }

    return {
      message: error.message,
      errorType: error.name,
      frames: userFrames,
      sourceContext,
    };
  }

  /**
   * Parse error stack into structured frames
   *
   * @param error - The error with a stack property
   * @returns Array of parsed stack frames sorted by relevance
   *
   * @remarks
   * Parses V8-style stack traces (Node.js default). Each frame includes
   * function name, file path, line/column numbers, and relevance score.
   */
  parseStackTrace(error: Error): StackFrame[] {
    if (!error.stack) return [];

    const lines = error.stack.split('\n').slice(1); // Skip error message
    const frames: StackFrame[] = [];

    for (const stackLine of lines) {
      // Match V8 stack trace format:
      // Pattern 1a: at FunctionName (file:line:col)
      // Pattern 1b: at file:line:col
      // Pattern 2a: at FunctionName (file:line)
      // Pattern 2b: at file:line
      const match =
        stackLine.match(
          /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)|at\s+(.+?):(\d+):(\d+)/
        ) || stackLine.match(/at\s+(.+?)\s+\((.+?):(\d+)\)|at\s+(.+?):(\d+)/);

      if (!match) continue;

      // Handle both regex patterns:
      // Pattern with column: groups at 1,2,3,4 or 5,6,7
      // Pattern without column: groups at 1,2,3 or 4,5
      const fnName = match[1] || '<anonymous>';
      const filePath = match[2] || match[5] || '';
      const line = match[3] || match[6] || '0';
      const col = match[4] || match[7];

      const frame: StackFrame = {
        functionName: fnName,
        filePath,
        line: parseInt(line, 10),
        column: col ? parseInt(col, 10) : undefined,
        isUserCode: this.isUserCode(filePath),
        relevanceScore: 0,
      };

      frame.relevanceScore = this.calculateRelevance(frame);
      frames.push(frame);
    }

    return frames.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Filter stack frames to user code only
   *
   * @param frames - All stack frames
   * @returns User code frames with relevance > 0.3
   *
   * @remarks
   * Returns only frames identified as user code with a minimum relevance
   * threshold to filter out noise.
   */
  filterUserFrames(frames: StackFrame[]): StackFrame[] {
    return frames.filter(f => f.isUserCode && f.relevanceScore > 0.3);
  }

  /**
   * Calculate relevance score for a stack frame
   *
   * @param frame - The frame to score
   * @returns Relevance score from 0 to 1
   *
   * @remarks
   * Scoring factors:
   * - Base score: 0.5
   * - User code bonus: +0.3
   * - Library code penalty: -0.4
   * - /src/ directory bonus: +0.2
   * - Final value clamped to [0, 1]
   */
  calculateRelevance(frame: StackFrame): number {
    let score = 0.5; // Base score

    // User code gets higher score
    if (frame.isUserCode) {
      score += 0.3;
    }

    // Library code gets lower score
    if (this.#libraryPatterns.some(p => p.test(frame.filePath))) {
      score -= 0.4;
    }

    // Files in /src/ get highest score
    if (/\/src\//.test(frame.filePath)) {
      score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine if a file path is user code
   *
   * @param filePath - File path to check
   * @returns True if user code, false otherwise
   *
   * @remarks
   * Checks if the file path matches any user code patterns and doesn't
   * match library patterns.
   */
  isUserCode(filePath: string): boolean {
    if (!filePath) return false;

    // Check if it's library code first
    if (this.#libraryPatterns.some(p => p.test(filePath))) {
      return false;
    }

    // Check if it matches user code patterns
    return this.#userCodePatterns.some(p => p.test(filePath));
  }

  /**
   * Extract source code context around a stack frame
   *
   * @param frame - The stack frame to get context for
   * @returns Source context with code lines, or undefined if file not readable
   *
   * @remarks
   * Reads the source file and extracts 3-5 lines of code around the error
   * line. Returns undefined if the file cannot be read.
   */
  async getSourceContext(
    frame: StackFrame
  ): Promise<SourceContext | undefined> {
    try {
      const content = await readFile(frame.filePath, 'utf-8');
      const lines = content.split('\n');

      const startLine = Math.max(0, frame.line - 4);
      const endLine = Math.min(lines.length, frame.line + 2);
      const codeLines = lines.slice(startLine, endLine);

      return {
        file: frame.filePath,
        line: frame.line,
        column: frame.column,
        codeLines,
        errorLineIndex: frame.line - startLine - 1,
      };
    } catch {
      // File not readable or doesn't exist
      return undefined;
    }
  }
}
