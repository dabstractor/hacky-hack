/**
 * Promise Handling Validator
 *
 * @module utils/promise-handling-validator
 *
 * @remarks
 * Validates that all promise rejection handlers in a given file have proper
 * error handling (logging, no empty catches). Returns structured analysis
 * of all catch blocks for automated validation and documentation.
 *
 * @example
 * ```typescript
 * import { verifyPromiseHandling } from './utils/promise-handling-validator.js';
 *
 * const result = await verifyPromiseHandling();
 * if (!result.allHandled) {
 *   console.error('Found unhandled promise rejections:', result.warnings);
 * }
 * ```
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

// ===== TYPES =====

/**
 * Analysis result for a single catch block
 */
export interface CatchBlockAnalysis {
  /** Line number where .catch( appears */
  readonly lineNumber: number;
  /** Whether this catch has proper error handling */
  readonly isValid: boolean;
  /** Whether catch body calls logger (error/warn/info) */
  readonly hasLogging: boolean;
  /** Whether catch body re-throws error */
  readonly hasErrorPropagation: boolean;
  /** Whether catch body is empty (no actual code) */
  readonly isEmpty: boolean;
  /** Human-readable description of catch context */
  readonly context: string;
  /** The actual catch block code (for debugging) */
  readonly code: string;
}

/**
 * Complete validation result for all catch blocks
 */
export interface PromiseHandlingResult {
  /** true if ALL catch blocks are valid */
  readonly allHandled: boolean;
  /** Total number of catch blocks found */
  readonly catchBlocks: number;
  /** Per-catch analysis */
  readonly analysis: readonly CatchBlockAnalysis[];
  /** Optional warning messages */
  readonly warnings: readonly string[];
}

/**
 * Input from P2.M2.T1.S2
 */
export interface PromiseHandlingInput {
  /** Whether S2 modified the code */
  readonly updated: boolean;
  /** The new code that S2 wrote */
  readonly newCode: string;
}

// ===== HELPER FUNCTIONS =====

/**
 * Location of a catch block found by grep
 */
interface CatchBlockLocation {
  readonly lineNumber: number;
  readonly content: string;
}

/**
 * Finds all catch blocks in a given file using regex pattern matching
 *
 * @param filePath - Path to the file to search
 * @returns Array of catch block locations with line numbers
 */
async function findCatchBlocks(
  filePath: string
): Promise<CatchBlockLocation[]> {
  // Check if file exists
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read file content
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const results: CatchBlockLocation[] = [];
  const catchPattern = /\.catch\(/;

  // Find all lines with .catch(
  for (let i = 0; i < lines.length; i++) {
    if (catchPattern.test(lines[i])) {
      results.push({
        lineNumber: i + 1, // Line numbers are 1-indexed
        content: lines[i],
      });
    }
  }

  return results;
}

/**
 * Extracts the full catch block body starting from a given line
 *
 * @param lines - All lines of the file
 * @param startLine - Line number where .catch( appears (1-indexed)
 * @returns The full catch block code as a string
 */
function extractCatchBlock(lines: string[], startLine: number): string {
  const startIndex = startLine - 1; // Convert to 0-indexed
  let braceCount = 0;
  let foundOpeningBrace = false;
  let endIndex = startIndex;

  // Start from the line with .catch(
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    // Count braces to find the end of the catch block
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        foundOpeningBrace = true;
      } else if (char === '}') {
        braceCount--;
        if (foundOpeningBrace && braceCount === 0) {
          // Found the closing brace of the catch block
          endIndex = i;
          // Extract the full catch block
          return lines.slice(startIndex, endIndex + 1).join('\n');
        }
      }
    }

    // Safety: if we've gone too far without finding the end, limit to 100 lines
    if (i - startIndex > 100) {
      // Return what we have so far
      return lines.slice(startIndex, i + 1).join('\n');
    }
  }

  // If we couldn't find the end, return up to the current line
  return lines.slice(startIndex, endIndex + 1).join('\n');
}

/**
 * Parses a catch block to extract validation criteria
 *
 * @param content - The catch block code
 * @param lineNumber - Line number where catch block starts
 * @returns Analysis of the catch block
 */
function parseCatchBlock(
  content: string,
  lineNumber: number
): CatchBlockAnalysis {
  // Check for logging: this.#logger.error/warn/info or this.logger.error/warn/info
  const hasLogging = /this\.#?logger\.(error|warn|info)/.test(content);

  // Check for error propagation: throw statement
  const hasErrorPropagation = /\bthrow\b/.test(content);

  // Check if empty by:
  // 1. Removing comments
  // 2. Checking if there's any code beyond the error parameter
  const normalizedContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*/g, '') // Remove line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // A catch is empty if, after removing comments and normalizing:
  // - It's just the .catch() signature with empty braces
  // - OR it has no meaningful code (no logging, no throw, no other statements)
  const catchSignaturePattern = /\.catch\(\s*\([^)]*\)\s*=>\s*\{\s*\}\s*;?/;
  const isEmptyCatchSignature = catchSignaturePattern.test(normalizedContent);

  // Check if there's any meaningful code by looking for:
  // - Logger calls
  // - Throw statements
  // - Variable declarations/assignments (const, let, var)
  // - Function calls, return statements, etc.
  const hasMeaningfulCode =
    hasLogging ||
    hasErrorPropagation ||
    /\b(const|let|var|return|if|for|while|switch|try|new)\b/.test(content) ||
    /[a-zA-Z_$][a-zA-Z0-9_$]*\s*\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(content); // Method calls like this.#logger.error()

  // Check if the only code is the error parameter (which doesn't count as handling)
  const onlyHasErrorParam =
    !hasMeaningfulCode &&
    normalizedContent.match(/\(error\s*:\s*unknown\)/) !== null;

  const isEmpty = isEmptyCatchSignature || onlyHasErrorParam;
  const isValidBlock = !isEmpty && (hasLogging || hasErrorPropagation);

  // Determine context based on content patterns
  let context = 'Unknown catch handler';

  if (
    content.includes('PRP generation failed') ||
    content.includes('PRP generation')
  ) {
    context = 'PRP generation failure handler';
  } else if (
    content.includes('Background task') ||
    content.includes('processNext')
  ) {
    context = 'Background task chaining handler';
  } else if (content.includes('finally')) {
    context = 'Finally block catch handler';
  } else if (hasLogging && hasErrorPropagation) {
    context = 'Error logging and propagation handler';
  } else if (hasLogging) {
    context = 'Error logging handler';
  } else if (hasErrorPropagation) {
    context = 'Error propagation handler';
  }

  return {
    lineNumber,
    isValid: isValidBlock,
    hasLogging,
    hasErrorPropagation,
    isEmpty,
    context,
    code: content,
  };
}

/**
 * Validates if a catch block has proper error handling
 *
 * @param analysis - The catch block analysis
 * @returns true if the catch block is valid
 */
function validateCatchBlock(analysis: CatchBlockAnalysis): boolean {
  return (
    !analysis.isEmpty && (analysis.hasLogging || analysis.hasErrorPropagation)
  );
}

// ===== MAIN API =====

/**
 * Verifies all promise rejection handlers in a file have proper error handling
 *
 * @param input - Optional input from P2.M2.T1.S2
 * @param filePath - Path to the file to validate (default: src/core/research-queue.ts)
 * @returns Structured analysis of all catch blocks
 *
 * @example
 * ```typescript
 * const result = await verifyPromiseHandling();
 * console.log(`Found ${result.catchBlocks} catch blocks`);
 * console.log(`All handled: ${result.allHandled}`);
 * ```
 */
export async function verifyPromiseHandling(
  input?: PromiseHandlingInput,
  filePath: string = 'src/core/research-queue.ts'
): Promise<PromiseHandlingResult> {
  // Find all catch blocks
  const catchLocations = await findCatchBlocks(filePath);

  // If no catch blocks found, return empty result
  if (catchLocations.length === 0) {
    return {
      allHandled: true,
      catchBlocks: 0,
      analysis: [],
      warnings: [],
    };
  }

  // Read the file once for efficient parsing
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Parse each catch block
  const analysis: CatchBlockAnalysis[] = [];
  for (const location of catchLocations) {
    const catchContent = extractCatchBlock(lines, location.lineNumber);
    const parsed = parseCatchBlock(catchContent, location.lineNumber);
    analysis.push(parsed);
  }

  // Validate all catches
  const allHandled = analysis.every(validateCatchBlock);

  // Generate warnings for invalid catches
  const warnings = analysis
    .filter(a => !a.isValid)
    .map(a => {
      if (a.isEmpty) {
        return `Line ${a.lineNumber}: ${a.context} - Empty catch block`;
      }
      return `Line ${a.lineNumber}: ${a.context} - No error handling (no logging or propagation)`;
    });

  // If input was provided from S2, verify the expected state
  if (input?.updated && input.newCode) {
    // Check that the new code contains proper logging
    const hasTaskIdLogging = /taskId:/.test(input.newCode);
    const hasStackLogging = /stack:/.test(input.newCode);

    if (!hasTaskIdLogging || !hasStackLogging) {
      warnings.push(
        'S2 input verification: Expected taskId and stack in error logging'
      );
    }
  }

  return {
    allHandled,
    catchBlocks: catchLocations.length,
    analysis,
    warnings,
  };
}
