/**
 * Syntax highlighting utilities for CLI display
 *
 * @module utils/display/syntax-highlighter
 *
 * @remarks
 * Provides syntax highlighting for JSON, Markdown, and other code formats
 * using cli-highlight library. Respects NO_COLOR environment variable and
 * TTY detection for color output control.
 *
 * @example
 * ```typescript
 * import { SyntaxHighlighter } from './utils/display/syntax-highlighter.js';
 *
 * const highlighter = new SyntaxHighlighter();
 * const json = { foo: 'bar' };
 * console.log(highlighter.highlightJSON(json));
 * ```
 */

import { highlight } from 'cli-highlight';

/**
 * Color mode options for syntax highlighting
 */
export type ColorMode = 'auto' | 'always' | 'never';

/**
 * Syntax highlighter class with support for multiple content types
 *
 * @remarks
 * Provides syntax highlighting for JSON, Markdown, and general code.
 * Automatically detects TTY support and respects NO_COLOR environment
 * variable for color output control.
 *
 * Color mode behavior:
 * - 'auto': Use color if TTY and NO_COLOR not set (default)
 * - 'always': Always use color
 * - 'never': Never use color
 *
 * @example
 * ```typescript
 * const highlighter = new SyntaxHighlighter();
 *
 * // Auto color (respects TTY and NO_COLOR)
 * const jsonOutput = highlighter.highlightJSON({ foo: 'bar' });
 *
 * // Force color
 * const coloredJson = highlighter.highlightJSON({ foo: 'bar' }, 'always');
 *
 * // No color
 * const plainJson = highlighter.highlightJSON({ foo: 'bar' }, 'never');
 * ```
 */
export class SyntaxHighlighter {
  /**
   * Determines if color should be used based on mode and environment
   *
   * @param mode - Color mode to evaluate
   * @returns true if color should be used, false otherwise
   *
   * @remarks
   * Color is enabled when:
   * - mode is 'always'
   * - mode is 'auto' AND stdout is a TTY AND NO_COLOR is not set
   *
   * @example
   * ```typescript
   * const highlighter = new SyntaxHighlighter();
   *
   * highlighter.shouldUseColor('always'); // true
   * highlighter.shouldUseColor('never'); // false
   * highlighter.shouldUseColor('auto'); // depends on environment
   * ```
   */
  shouldUseColor(mode: ColorMode = 'auto'): boolean {
    if (mode === 'never') return false;
    if (mode === 'always') return true;
    // Auto mode: check TTY and NO_COLOR
    return process.stdout.isTTY !== false && !process.env.NO_COLOR;
  }

  /**
   * Highlights JSON data with syntax colors
   *
   * @param data - JSON data to highlight (any JSON-serializable value)
   * @param colorMode - Color mode (default: 'auto')
   * @returns Highlighted JSON string or plain JSON if color disabled
   *
   * @remarks
   * Converts data to JSON with 2-space indentation, then applies
   * syntax highlighting if color mode allows it.
   *
   * @example
   * ```typescript
   * const highlighter = new SyntaxHighlighter();
   * const data = { foo: 'bar', baz: 123 };
   *
   * // Returns highlighted JSON string
   * const output = highlighter.highlightJSON(data);
   * ```
   */
  highlightJSON(data: unknown, colorMode: ColorMode = 'auto'): string {
    const json = JSON.stringify(data, null, 2);
    if (!this.shouldUseColor(colorMode)) {
      return json;
    }

    return highlight(json, {
      language: 'json',
      theme: 'monokai',
    });
  }

  /**
   * Highlights Markdown content with syntax colors
   *
   * @param content - Markdown content to highlight
   * @param colorMode - Color mode (default: 'auto')
   * @returns Highlighted Markdown string or plain Markdown if color disabled
   *
   * @remarks
   * Uses cli-highlight with Markdown language support and GitHub theme
   * for familiar syntax coloring.
   *
   * @example
   * ```typescript
   * const highlighter = new SyntaxHighlighter();
   * const md = '# Header\n\nSome **bold** text.';
   *
   * const output = highlighter.highlightMarkdown(md);
   * ```
   */
  highlightMarkdown(content: string, colorMode: ColorMode = 'auto'): string {
    if (!this.shouldUseColor(colorMode)) {
      return content;
    }

    return highlight(content, {
      language: 'markdown',
      theme: 'github',
    });
  }

  /**
   * Highlights code with specific language
   *
   * @param content - Code content to highlight
   * @param language - Language identifier (e.g., 'typescript', 'python')
   * @param colorMode - Color mode (default: 'auto')
   * @returns Highlighted code string or plain code if color disabled
   *
   * @remarks
   * Supports any language recognized by cli-highlight (180+ languages).
   * Common languages: typescript, javascript, python, java, go, rust, etc.
   *
   * @example
   * ```typescript
   * const highlighter = new SyntaxHighlighter();
   * const code = 'const x: number = 42;';
   *
   * const output = highlighter.highlightCode(code, 'typescript');
   * ```
   */
  highlightCode(
    content: string,
    language: string,
    colorMode: ColorMode = 'auto'
  ): string {
    if (!this.shouldUseColor(colorMode)) {
      return content;
    }

    return highlight(content, {
      language,
      theme: 'monokai',
    });
  }
}
