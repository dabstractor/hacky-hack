/**
 * CLI Help Parser - Robust regex patterns for parsing CLI help output
 *
 * @module utils/cli-help-parser
 *
 * @remarks
 * Provides comprehensive regex patterns and utilities for parsing CLI help output
 * to detect option flags. Research covers patterns from Commander.js, Yargs, Argparse,
 * and other popular CLI libraries.
 *
 * Features:
 * - Detect short flags (-h, -v, -f)
 * - Detect long flags (--help, --verbose, --dry-run)
 * - Detect flags with arguments (--file <path>, --scope <scope>)
 * - Detect negated flags (--no-cache, --no-color)
 * - Detect alias combinations (-h, --help)
 * - Extract descriptions, defaults, and choices
 * - Parse multiple CLI library formats
 *
 * @example
 * ```typescript
 * import { parseHelpOutput, extractAllFlags, hasFlag } from './cli-help-parser.js';
 *
 * const helpText = `
 * Options:
 *   -h, --help            display help for command
 *   --verbose             Enable debug logging
 *   --prd <path>          Path to PRD markdown file
 *   --no-cache            Bypass cache
 * `;
 *
 * const parsed = parseHelpOutput(helpText);
 * console.log(parsed.options);
 * // [{ short: '-h', long: '--help', description: 'display help for command' }, ...]
 *
 * const flags = extractAllFlags(helpText);
 * console.log(flags); // ['-h', '--help', '--verbose', '--prd', '--no-cache']
 *
 * console.log(hasFlag(helpText, '--verbose')); // true
 * ```
 */

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * Short flag pattern: Single dash followed by single character
 *
 * @example
 * ```typescript
 * SHORT_FLAG_REGEX.test('-h')  // true
 * SHORT_FLAG_REGEX.test('--help')  // false
 * ```
 *
 * @remarks
 * Matches: `-h`, `-v`, `-f`, `-V`
 * Does NOT match: `--help`, `-help`, `-`, `--`
 */
export const SHORT_FLAG_REGEX = /^-([a-zA-Z])$/;

/**
 * Long flag pattern: Double dash followed by word (may contain hyphens)
 *
 * @example
 * ```typescript
 * LONG_FLAG_REGEX.test('--help')  // true
 * LONG_FLAG_REGEX.test('--dry-run')  // true
 * LONG_FLAG_REGEX.test('-h')  // false
 * ```
 *
 * @remarks
 * Matches: `--help`, `--verbose`, `--dry-run`, `--max-duration`, `--no-cache`
 * Does NOT match: `-h`, `--`, `--1invalid`, `--no-`
 */
export const LONG_FLAG_REGEX = /^--([a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9])$/;

/**
 * Flag with argument pattern: Flag followed by space or equals and value
 *
 * @example
 * ```typescript
 * FLAG_WITH_ARG_REGEX.test('--file path.txt')  // true
 * FLAG_WITH_ARG_REGEX.test('--file=path.txt')  // true
 * FLAG_WITH_ARG_REGEX.test('--help')  // false
 * ```
 *
 * @remarks
 * Matches: `--file path.txt`, `--file=path.txt`, `-f path.txt`
 * Does NOT match: Boolean flags without arguments
 */
export const FLAG_WITH_ARG_REGEX = /^--?([a-zA-Z][a-zA-Z0-9-]*)[=\s](.+)$/;

/**
 * Boolean flag pattern: Flag without arguments
 *
 * @example
 * ```typescript
 * BOOLEAN_FLAG_REGEX.test('--verbose')  // true
 * BOOLEAN_FLAG_REGEX.test('--dry-run')  // true
 * BOOLEAN_FLAG_REGEX.test('--file path.txt')  // false
 * ```
 *
 * @remarks
 * Matches: `--verbose`, `--dry-run`, `--help`, `-v`
 * Does NOT match: Flags with arguments
 */
export const BOOLEAN_FLAG_REGEX = /^--?([a-zA-Z][a-zA-Z0-9-]*)$/;

/**
 * Negated flag pattern: Flags starting with --no-
 *
 * @example
 * ```typescript
 * NEGATED_FLAG_REGEX.test('--no-cache')  // true
 * NEGATED_FLAG_REGEX.test('--no-color')  // true
 * NEGATED_FLAG_REGEX.test('--cache')  // false
 * ```
 *
 * @remarks
 * Matches: `--no-cache`, `--no-color`, `--no-verify`
 * Does NOT match: Regular flags, short negated flags
 */
export const NEGATED_FLAG_REGEX = /^--no-([a-zA-Z][a-zA-Z0-9-]*)$/;

/**
 * Alias combination pattern: Short and long flag together
 *
 * @example
 * ```typescript
 * ALIAS_COMBO_REGEX.test('-h, --help')  // true
 * ALIAS_COMBO_REGEX.test('-v, --verbose')  // true
 * ALIAS_COMBO_REGEX.test('--help')  // false
 * ```
 *
 * @remarks
 * Matches: `-h, --help`, `-v, --verbose`, `-V, --version`, `-h --help`
 * Does NOT match: Single flags, mismatched aliases
 */
export const ALIAS_COMBO_REGEX = /^(-[a-zA-Z]),?\s+--([a-zA-Z][a-zA-Z0-9-]*)$/;

/**
 * Flag with angle bracket argument: --file <path>
 *
 * @example
 * ```typescript
 * FLAG_WITH_ANGLE_ARG_REGEX.test('--file <path>')  // true
 * FLAG_WITH_ANGLE_ARG_REGEX.test('--scope <scope>')  // true
 * ```
 */
export const FLAG_WITH_ANGLE_ARG_REGEX = /--[\w-]+\s+<[^>]+>/;

/**
 * Flag with square bracket argument: --file [path]
 *
 * @example
 * ```typescript
 * FLAG_WITH_SQUARE_ARG_REGEX.test('--file [path]')  // true
 * FLAG_WITH_SQUARE_ARG_REGEX.test('--output [file]')  // true
 * ```
 */
export const FLAG_WITH_SQUARE_ARG_REGEX = /--[\w-]+\s+\[[^\]]+\]/;

/**
 * Help section detection patterns
 *
 * @example
 * ```typescript
 * HELP_SECTIONS.usage.test('Usage: prp-pipeline [options]')  // true
 * HELP_SECTIONS.options.test('Options:')  // true
 * ```
 */
export const HELP_SECTIONS = {
  usage: /Usage:\s*\S+/i,
  options: /Options:/i,
  commands: /Commands:/i,
  arguments: /Arguments:/i,
  examples: /Examples?:/i,
  description: /Description:/i,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Parsed option from CLI help output
 */
export interface ParsedOption {
  /** Short flag (e.g., '-h') */
  short?: string;
  /** Long flag (e.g., '--help') */
  long?: string;
  /** Option description */
  description: string;
  /** Argument type if flag takes argument */
  argType?: 'string' | 'number' | 'boolean';
  /** Default value if specified */
  default?: string;
  /** Allowed choices if specified */
  choices?: string[];
  /** Whether this is a negated flag (e.g., --no-cache) */
  isNegated?: boolean;
  /** Argument name if specified (e.g., 'path' in --prd <path>) */
  argName?: string;
}

/**
 * Parsed help sections
 */
export interface ParsedHelp {
  /** Usage line */
  usage?: string;
  /** Program description */
  description?: string;
  /** Parsed options */
  options: ParsedOption[];
  /** Commands section (if present) */
  commands?: Array<{ name: string; description: string }>;
  /** Examples section (if present) */
  examples?: string[];
}

/**
 * Validation result for help output
 */
export interface ValidationResult {
  /** Whether help output is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: string[];
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse CLI help output into structured data
 *
 * @param helpText - Raw help output text
 * @returns Parsed help structure with options, commands, etc.
 *
 * @example
 * ```typescript
 * const helpText = `
 * Usage: prp-pipeline [options]
 *
 * Options:
 *   -h, --help            display help for command
 *   --verbose             Enable debug logging
 * `;
 *
 * const parsed = parseHelpOutput(helpText);
 * console.log(parsed.options);
 * // [{ short: '-h', long: '--help', description: 'display help for command' }, ...]
 * ```
 */
export function parseHelpOutput(helpText: string): ParsedHelp {
  const result: ParsedHelp = {
    options: [],
  };

  const lines = helpText.split('\n');
  let currentSection:
    | 'usage'
    | 'description'
    | 'options'
    | 'commands'
    | 'examples'
    | null = null;
  let optionBuffer = ''; // For multi-line option descriptions

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect section headers
    if (/^Usage:/i.test(trimmed)) {
      currentSection = 'usage';
      result.usage = trimmed;
      continue;
    }

    if (/^Options:/i.test(trimmed)) {
      currentSection = 'options';
      continue;
    }

    if (/^Commands:/i.test(trimmed)) {
      currentSection = 'commands';
      continue;
    }

    if (/^Examples?:/i.test(trimmed)) {
      currentSection = 'examples';
      continue;
    }

    // Parse options
    if (currentSection === 'options') {
      if (trimmed.startsWith('-')) {
        // New option line, parse previous buffer if any
        if (optionBuffer) {
          const option = parseOptionLine(optionBuffer);
          if (option) {
            result.options.push(option);
          }
        }
        optionBuffer = line;
      } else if (isContinuationLine(line) && optionBuffer) {
        // Continuation of previous option
        optionBuffer += '\n' + line;
      } else if (optionBuffer) {
        // End of options, parse last option
        const option = parseOptionLine(optionBuffer);
        if (option) {
          result.options.push(option);
        }
        optionBuffer = '';
      }
    }

    // Parse commands
    if (
      currentSection === 'commands' &&
      trimmed &&
      !trimmed.startsWith('Commands')
    ) {
      const command = parseCommandLine(line);
      if (command) {
        result.commands = result.commands || [];
        result.commands.push(command);
      }
    }

    // Parse examples
    if (
      currentSection === 'examples' &&
      trimmed &&
      !trimmed.startsWith('Example')
    ) {
      result.examples = result.examples || [];
      result.examples.push(trimmed);
    }

    // Description (between usage and options)
    if (currentSection === 'usage' && trimmed && !trimmed.startsWith('Usage')) {
      currentSection = 'description';
      result.description = trimmed;
    }
  }

  // Parse last option if buffer not empty
  if (optionBuffer) {
    const option = parseOptionLine(optionBuffer);
    if (option) {
      result.options.push(option);
    }
  }

  return result;
}

/**
 * Parse a single option line (may include continuation lines)
 *
 * @param line - Option line(s) to parse
 * @returns Parsed option or null if invalid
 */
function parseOptionLine(line: string): ParsedOption | null {
  // Remove continuation formatting and combine lines
  const combinedLine = line.replace(/\n\s{20,}/g, ' ').trim();

  // Match: -h, --help            description
  const match = combinedLine.match(/^(-[a-zA-Z])(,\s+)?(--[\w-]+)?\s+(.+)$/);

  if (!match) {
    // Try long-only flag: --verbose    description
    const longMatch = combinedLine.match(/^(--[\w-]+)\s+(.+)$/);
    if (longMatch) {
      return {
        long: longMatch[1],
        description: longMatch[2].trim(),
        isNegated: /^--no-/.test(longMatch[1]),
        argType: extractArgType(longMatch[2]),
        default: extractDefault(longMatch[2]),
        choices: extractChoices(longMatch[2]),
        argName: extractArgName(combinedLine),
      };
    }
    return null;
  }

  const option: ParsedOption = {
    short: match[1],
    long: match[3],
    description: match[4].trim(),
    isNegated: match[3] ? /^--no-/.test(match[3]) : false,
    argName: extractArgName(combinedLine),
  };

  // Extract metadata from combined description (includes continuation lines)
  const fullDescription = combinedLine
    .substring(combinedLine.indexOf(match[4]))
    .trim();
  option.argType = extractArgType(fullDescription);
  option.default = extractDefault(fullDescription);
  option.choices = extractChoices(fullDescription);

  return option;
}

/**
 * Check if a line is a continuation line (deep indentation)
 *
 * @param line - Line to check
 * @returns True if continuation line
 */
function isContinuationLine(line: string): boolean {
  return /^\s{20,}/.test(line);
}

/**
 * Extract argument name from option line (e.g., 'path' from --prd <path>)
 *
 * @param line - Option line
 * @returns Argument name or undefined
 */
function extractArgName(line: string): string | undefined {
  const angleMatch = line.match(/<([^>]+)>/);
  if (angleMatch) return angleMatch[1];

  const squareMatch = line.match(/\[([^\]]+)\]/);
  if (squareMatch) return squareMatch[1];

  return undefined;
}

/**
 * Extract argument type from description
 *
 * @param description - Option description
 * @returns Argument type or undefined
 */
function extractArgType(
  description: string
): 'string' | 'number' | 'boolean' | undefined {
  if (/\[boolean\]/i.test(description)) return 'boolean';
  if (/\[string\]/i.test(description)) return 'string';
  if (/\[number\]/i.test(description)) return 'number';

  // Commander.js style: (default: false)
  if (/\(default:\s*(false|true)\)/i.test(description)) return 'boolean';

  // Check for <type> pattern
  const angleMatch = description.match(/<(\w+)>/);
  if (angleMatch) {
    const type = angleMatch[1].toLowerCase();
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return type;
    }
  }

  return undefined;
}

/**
 * Extract default value from description
 *
 * @param description - Option description
 * @returns Default value or undefined
 */
function extractDefault(description: string): string | undefined {
  // Yargs style: [default: "value"]
  const yargsMatch = description.match(/\[default:\s*"([^"]+)"\]/);
  if (yargsMatch) return yargsMatch[1];

  // Commander.js style: (default: "value")
  const commanderMatch = description.match(/\(default:\s*"([^"]+)"\)/);
  if (commanderMatch) return commanderMatch[1];

  // Without quotes: (default: value)
  const noQuotesMatch = description.match(/\(default:\s*(\w+)\)/);
  if (noQuotesMatch) return noQuotesMatch[1];

  return undefined;
}

/**
 * Extract choices from description
 *
 * @param description - Option description (may contain newlines)
 * @returns Array of choices or undefined
 */
function extractChoices(description: string): string[] | undefined {
  // Normalize newlines to spaces for regex matching
  const normalized = description.replace(/\s+/g, ' ');

  // Yargs style: [choices: "value1", "value2", "value3"]
  const yargsMatch = normalized.match(/\[choices:.*?((?:"[^"]+"(?:,\s*)?)+)\]/);
  if (yargsMatch) {
    const choices = yargsMatch[1].match(/"([^"]+)"/g);
    if (choices) {
      return choices.map(c => c.replace(/"/g, ''));
    }
  }

  // Commander.js style: (choices: "value1", "value2", "value3", default: "value")
  // The pattern: choices: "value1", "value2", "value3" (stops at next keyword)
  const commanderMatch = normalized.match(
    /choices:.*?((?:"[^"]+"(?:,\s*)?)+)(?:\s*,?\s*default:|$)/
  );
  if (commanderMatch) {
    const choices = commanderMatch[1].match(/"([^"]+)"/g);
    if (choices) {
      return choices.map(c => c.replace(/"/g, ''));
    }
  }

  return undefined;
}

/**
 * Parse a command line
 *
 * @param line - Command line to parse
 * @returns Parsed command or null
 */
function parseCommandLine(
  line: string
): { name: string; description: string } | null {
  // Match: command    description
  const match = line.match(/^(\s*)([\w-]+)(\s{2,})(.+)$/);
  if (!match) return null;

  return {
    name: match[2],
    description: match[4].trim(),
  };
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract all unique flags from help text
 *
 * @param helpText - Help output text
 * @returns Array of unique flags
 *
 * @example
 * ```typescript
 * const helpText = `
 * Options:
 *   -h, --help            display help for command
 *   --verbose             Enable debug logging
 * `;
 *
 * const flags = extractAllFlags(helpText);
 * console.log(flags); // ['-h', '--help', '--verbose']
 * ```
 */
export function extractAllFlags(helpText: string): string[] {
  const flags: string[] = [];

  // Match all flag patterns
  const patterns = [
    /(-[a-zA-Z]),?\s+(--[\w-]+)/g, // -h, --help
    /(--[\w-]+)/g, // --help
    /(-[a-zA-Z])(?!\w)/g, // -h
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(helpText)) !== null) {
      if (match[1]) flags.push(match[1]);
      if (match[2]) flags.push(match[2]);
    }
  }

  return Array.from(new Set(flags)); // Remove duplicates
}

/**
 * Check if a specific flag exists in help text
 *
 * @param helpText - Help output text
 * @param flag - Flag to search for
 * @returns True if flag exists
 *
 * @example
 * ```typescript
 * const helpText = 'Options: --verbose --help';
 *
 * console.log(hasFlag(helpText, '--verbose')); // true
 * console.log(hasFlag(helpText, '--debug')); // false
 * ```
 */
export function hasFlag(helpText: string, flag: string): boolean {
  // Escape special regex characters
  const escapedFlag = flag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|\\s)${escapedFlag}(?:\\s|$)`);
  return pattern.test(helpText);
}

/**
 * Extract the options section from help text
 *
 * @param helpText - Full help output text
 * @returns Options section text or null
 */
export function extractOptionsSection(helpText: string): string | null {
  const optionsMatch = helpText.match(/Options:\s*\n([\s\S]*?)(?=\n\w+:|$)/);
  return optionsMatch ? optionsMatch[1].trim() : null;
}

/**
 * Extract option description from option line
 *
 * @param optionLine - Single option line
 * @returns Object with flag and description or null
 */
export function extractOptionDescription(
  optionLine: string
): { flag: string; description: string } | null {
  // Match: --flag    description text
  const match = optionLine.match(/^(--?[\w-]+)\s+(.+)$/);
  if (!match) return null;

  return {
    flag: match[1],
    description: match[2].trim(),
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that help output contains expected sections
 *
 * @param helpText - Help output to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```typescript
 * const helpText = `
 * Usage: prp-pipeline [options]
 *
 * Options:
 *   -h, --help
 * `;
 *
 * const result = validateHelpOutput(helpText);
 * console.log(result.isValid); // true
 * console.log(result.errors); // []
 * ```
 */
export function validateHelpOutput(helpText: string): ValidationResult {
  const errors: string[] = [];

  // Check for Usage section
  if (!HELP_SECTIONS.usage.test(helpText)) {
    errors.push('Missing Usage section');
  }

  // Check for Options section
  if (!HELP_SECTIONS.options.test(helpText)) {
    errors.push('Missing Options section');
  }

  // Check for at least one option flag
  if (!/-{1,2}[\w-]+/.test(helpText)) {
    errors.push('No option flags found');
  }

  // Check for help flag
  if (!/--help/.test(helpText) && !/-h/.test(helpText)) {
    errors.push('Missing help flag');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if help output is from a specific CLI library
 *
 * @param helpText - Help output text
 * @param library - Library name ('commander' | 'yargs' | 'argparse')
 * @returns True if help output matches library format
 */
export function detectCLILibrary(
  helpText: string
): 'commander' | 'yargs' | 'argparse' | 'unknown' {
  // Commander.js: Uses (default: "value") format
  if (/\(default:\s*"/.test(helpText)) {
    return 'commander';
  }

  // Yargs: Uses [default: "value"] format with type brackets
  if (
    /\[default:\s*"/.test(helpText) &&
    /\[(?:string|number|boolean)\]/.test(helpText)
  ) {
    return 'yargs';
  }

  // Argparse: Uses different format (harder to detect specifically)
  if (
    /\[options\]/i.test(helpText) &&
    /positional arguments/i.test(helpText.toLowerCase())
  ) {
    return 'argparse';
  }

  return 'unknown';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deduplicate an array of flags
 *
 * @param flags - Array of flags
 * @returns Array of unique flags
 */
export function deduplicateFlags(flags: string[]): string[] {
  return Array.from(new Set(flags));
}

/**
 * Check if a flag is negated (starts with --no-)
 *
 * @param flag - Flag to check
 * @returns True if negated
 */
export function isNegatedFlag(flag: string): boolean {
  return NEGATED_FLAG_REGEX.test(flag);
}

/**
 * Check if a flag is a short flag (starts with single dash)
 *
 * @param flag - Flag to check
 * @returns True if short flag
 */
export function isShortFlag(flag: string): boolean {
  return SHORT_FLAG_REGEX.test(flag);
}

/**
 * Check if a flag is a long flag (starts with double dash)
 *
 * @param flag - Flag to check
 * @returns True if long flag
 */
export function isLongFlag(flag: string): boolean {
  return LONG_FLAG_REGEX.test(flag);
}

/**
 * Check if a flag is a boolean flag (no argument)
 *
 * @param flag - Flag to check
 * @returns True if boolean flag
 */
export function isBooleanFlag(flag: string): boolean {
  return BOOLEAN_FLAG_REGEX.test(flag);
}

/**
 * Check if a flag has an argument
 *
 * @param flag - Flag to check
 * @returns True if flag has argument
 */
export function isFlagWithArgument(flag: string): boolean {
  return FLAG_WITH_ARG_REGEX.test(flag);
}
