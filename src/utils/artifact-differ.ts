/**
 * Artifact comparison utilities for CLI display
 *
 * @module utils/artifact-differ
 *
 * @remarks
 * Provides diff generation for comparing artifact content with terminal-friendly
 * colored output using the diff package. Supports both text and JSON comparison.
 *
 * @example
 * ```typescript
 * import { ArtifactDiffer } from './utils/artifact-differ.js';
 *
 * const differ = new ArtifactDiffer();
 * const result = differ.diffText(oldContent, newContent, { color: true });
 * console.log(result.unifiedDiff);
 * ```
 */

import * as diff from 'diff';
import chalk from 'chalk';

/**
 * Options for diff generation
 */
export interface DiffOptions {
  /** Whether to use colored output (default: true) */
  color?: boolean;
}

/**
 * Result from a diff operation
 *
 * @remarks
 * Contains the unified diff string, change statistics, and whether any
 * changes were detected.
 */
export interface DiffResult {
  /** Whether the diff detected any changes */
  hasChanges: boolean;
  /** Unified diff format string with colored output */
  unifiedDiff: string;
  /** Number of lines added */
  additions: number;
  /** Number of lines deleted */
  deletions: number;
}

/**
 * Artifact differ class for generating comparisons
 *
 * @remarks
 * Provides diff generation for text and JSON content with terminal-friendly
 * colored output. Uses unified diff format compatible with git workflows.
 *
 * Color scheme:
 * - Additions: Green (+ prefix)
 * - Deletions: Red (- prefix)
 * - Context: Default color (space prefix)
 *
 * @example
 * ```typescript
 * const differ = new ArtifactDiffer();
 *
 * // Text diff
 * const textResult = differ.diffText(oldText, newText, { color: true });
 * console.log(textResult.unifiedDiff);
 *
 * // JSON diff (formats as prettified JSON first)
 * const jsonResult = differ.diffJSON(oldObj, newObj);
 * console.log(jsonResult.unifiedDiff);
 * ```
 */
export class ArtifactDiffer {
  /**
   * Generate unified diff between two text strings
   *
   * @param oldContent - Original content
   * @param newContent - Modified content
   * @param options - Diff options (color)
   * @returns Diff result with unified diff and statistics
   *
   * @remarks
   * Generates a unified diff format string with colored additions (green)
   * and deletions (red). If no changes detected, returns a message indicating
   * no differences.
   *
   * @example
   * ```typescript
   * const differ = new ArtifactDiffer();
   * const result = differ.diffText(
   *   'line 1\nline 2',
   *   'line 1\nline 2\nline 3',
   *   { color: true }
   * );
   *
   * console.log(result.unifiedDiff);
   * // Output:
   * // Changes: +1 -0
   * //
   * //   line 1
   * //   line 2
   * // + line 3
   * ```
   */
  diffText(
    oldContent: string,
    newContent: string,
    options: DiffOptions = {}
  ): DiffResult {
    const { color = true } = options;

    // Check if identical
    if (oldContent === newContent) {
      return {
        hasChanges: false,
        unifiedDiff: chalk.gray('No changes detected.'),
        additions: 0,
        deletions: 0,
      };
    }

    // Generate diff
    const changes = diff.diffLines(oldContent, newContent);

    let additions = 0;
    let deletions = 0;
    const diffLines: string[] = [];

    for (const change of changes) {
      const lines = change.value.split('\n').filter(l => l !== '');

      if (change.added) {
        additions += lines.length;
        for (const line of lines) {
          diffLines.push(color ? chalk.green('+ ' + line) : '+ ' + line);
        }
      } else if (change.removed) {
        deletions += lines.length;
        for (const line of lines) {
          diffLines.push(color ? chalk.red('- ' + line) : '- ' + line);
        }
      } else {
        for (const line of lines) {
          diffLines.push('  ' + line);
        }
      }
    }

    const summary = color
      ? `Changes: ${chalk.green('+' + additions)} ${chalk.red('-' + deletions)}`
      : `Changes: +${additions} -${deletions}`;

    return {
      hasChanges: true,
      unifiedDiff: summary + '\n\n' + diffLines.join('\n'),
      additions,
      deletions,
    };
  }

  /**
   * Diff two JSON objects with semantic comparison
   *
   * @param oldJSON - Original JSON object
   * @param newJSON - Modified JSON object
   * @param options - Diff options (color only)
   * @returns Diff result with unified diff and statistics
   *
   * @remarks
   * Formats both JSON objects as prettified strings with 2-space indentation,
   * then performs line-by-line diff. This provides readable semantic comparison
   * suitable for most JSON diffing scenarios.
   *
   * @example
   * ```typescript
   * const differ = new ArtifactDiffer();
   * const oldObj = { foo: 'bar', baz: 123 };
   * const newObj = { foo: 'bar', baz: 456 };
   *
   * const result = differ.diffJSON(oldObj, newObj, { color: true });
   * console.log(result.unifiedDiff);
   * // Output:
   * // Changes: +1 -1
   * //
   * // {
   * // -   "baz": 123,
   * // +   "baz": 456,
   * //   "foo": "bar"
   * // }
   * ```
   */
  diffJSON(
    oldJSON: unknown,
    newJSON: unknown,
    options: Pick<DiffOptions, 'color'> = {}
  ): DiffResult {
    const { color = true } = options;

    // Format as prettified JSON for line-by-line diff
    const oldStr = JSON.stringify(oldJSON, null, 2) + '\n';
    const newStr = JSON.stringify(newJSON, null, 2) + '\n';

    return this.diffText(oldStr, newStr, { color });
  }
}
