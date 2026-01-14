/**
 * Unit tests for CLI Help Parser
 *
 * @remarks
 * Tests validate CLI help parsing functionality including:
 * 1. Regex pattern matching for various flag types
 * 2. Option extraction from help text
 * 3. Description parsing with defaults and choices
 * 4. Help section detection
 * 5. Validation of help output structure
 * 6. Multi-library support (Commander.js, Yargs, Argparse)
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  // Regex patterns
  SHORT_FLAG_REGEX,
  LONG_FLAG_REGEX,
  FLAG_WITH_ARG_REGEX,
  BOOLEAN_FLAG_REGEX,
  NEGATED_FLAG_REGEX,
  ALIAS_COMBO_REGEX,
  FLAG_WITH_ANGLE_ARG_REGEX,
  FLAG_WITH_SQUARE_ARG_REGEX,
  HELP_SECTIONS,

  // Parsing functions
  parseHelpOutput,
  extractAllFlags,
  hasFlag,
  extractOptionsSection,
  extractOptionDescription,

  // Validation functions
  validateHelpOutput,
  detectCLILibrary,

  // Utility functions
  deduplicateFlags,
  isNegatedFlag,
  isShortFlag,
  isLongFlag,
  isBooleanFlag,
  isFlagWithArgument,

  // Types
  type ParsedOption,
  type ParsedHelp,
} from '../../../src/utils/cli-help-parser.js';

// =============================================================================
// REGEX PATTERN TESTS
// ============================================================================

describe('CLI Help Parser - Regex Patterns', () => {
  describe('SHORT_FLAG_REGEX', () => {
    it('should match single-letter flags', () => {
      expect(SHORT_FLAG_REGEX.test('-h')).toBe(true);
      expect(SHORT_FLAG_REGEX.test('-v')).toBe(true);
      expect(SHORT_FLAG_REGEX.test('-V')).toBe(true);
      expect(SHORT_FLAG_REGEX.test('-f')).toBe(true);
    });

    it('should not match long flags', () => {
      expect(SHORT_FLAG_REGEX.test('--help')).toBe(false);
      expect(SHORT_FLAG_REGEX.test('-help')).toBe(false);
      expect(SHORT_FLAG_REGEX.test('--verbose')).toBe(false);
    });

    it('should not match invalid patterns', () => {
      expect(SHORT_FLAG_REGEX.test('-')).toBe(false);
      expect(SHORT_FLAG_REGEX.test('--')).toBe(false);
      expect(SHORT_FLAG_REGEX.test('-1')).toBe(false);
      expect(SHORT_FLAG_REGEX.test('')).toBe(false);
    });
  });

  describe('LONG_FLAG_REGEX', () => {
    it('should match long form flags', () => {
      expect(LONG_FLAG_REGEX.test('--help')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--verbose')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--dry-run')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--max-duration')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--continue-on-error')).toBe(true);
    });

    it('should match negated flags', () => {
      expect(LONG_FLAG_REGEX.test('--no-cache')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--no-color')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--no-verify')).toBe(true);
    });

    it('should not match short flags', () => {
      expect(LONG_FLAG_REGEX.test('-h')).toBe(false);
      expect(LONG_FLAG_REGEX.test('-v')).toBe(false);
      expect(LONG_FLAG_REGEX.test('-help')).toBe(false);
    });

    it('should not match invalid patterns', () => {
      expect(LONG_FLAG_REGEX.test('--')).toBe(false);
      expect(LONG_FLAG_REGEX.test('--1invalid')).toBe(false);
      expect(LONG_FLAG_REGEX.test('--no-')).toBe(false);
      expect(LONG_FLAG_REGEX.test('')).toBe(false);
    });
  });

  describe('FLAG_WITH_ARG_REGEX', () => {
    it('should match flags with space-separated arguments', () => {
      expect(FLAG_WITH_ARG_REGEX.test('--file path.txt')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('--prd ./PRD.md')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('--scope P3.M4')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('-f path.txt')).toBe(true);
    });

    it('should match flags with equals-separated arguments', () => {
      expect(FLAG_WITH_ARG_REGEX.test('--file=path.txt')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('--prd=./PRD.md')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('--scope=P3.M4')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('-f=path.txt')).toBe(true);
    });

    it('should not match boolean flags', () => {
      expect(FLAG_WITH_ARG_REGEX.test('--help')).toBe(false);
      expect(FLAG_WITH_ARG_REGEX.test('--verbose')).toBe(false);
      expect(FLAG_WITH_ARG_REGEX.test('-h')).toBe(false);
    });
  });

  describe('BOOLEAN_FLAG_REGEX', () => {
    it('should match long boolean flags', () => {
      expect(BOOLEAN_FLAG_REGEX.test('--verbose')).toBe(true);
      expect(BOOLEAN_FLAG_REGEX.test('--dry-run')).toBe(true);
      expect(BOOLEAN_FLAG_REGEX.test('--help')).toBe(true);
      expect(BOOLEAN_FLAG_REGEX.test('--version')).toBe(true);
    });

    it('should match short boolean flags', () => {
      expect(BOOLEAN_FLAG_REGEX.test('-h')).toBe(true);
      expect(BOOLEAN_FLAG_REGEX.test('-v')).toBe(true);
      expect(BOOLEAN_FLAG_REGEX.test('-V')).toBe(true);
    });

    it('should not match flags with arguments', () => {
      expect(BOOLEAN_FLAG_REGEX.test('--file path.txt')).toBe(false);
      expect(BOOLEAN_FLAG_REGEX.test('--file=path.txt')).toBe(false);
      expect(BOOLEAN_FLAG_REGEX.test('-f path.txt')).toBe(false);
    });
  });

  describe('NEGATED_FLAG_REGEX', () => {
    it('should match negated flags', () => {
      expect(NEGATED_FLAG_REGEX.test('--no-cache')).toBe(true);
      expect(NEGATED_FLAG_REGEX.test('--no-color')).toBe(true);
      expect(NEGATED_FLAG_REGEX.test('--no-verify')).toBe(true);
      expect(NEGATED_FLAG_REGEX.test('--no-strict')).toBe(true);
    });

    it('should not match regular flags', () => {
      expect(NEGATED_FLAG_REGEX.test('--cache')).toBe(false);
      expect(NEGATED_FLAG_REGEX.test('--verbose')).toBe(false);
      expect(NEGATED_FLAG_REGEX.test('--help')).toBe(false);
    });

    it('should not match short negated flags', () => {
      expect(NEGATED_FLAG_REGEX.test('-no-cache')).toBe(false);
    });

    it('should not match incomplete negation', () => {
      expect(NEGATED_FLAG_REGEX.test('--no-')).toBe(false);
    });
  });

  describe('ALIAS_COMBO_REGEX', () => {
    it('should match alias combinations with comma', () => {
      expect(ALIAS_COMBO_REGEX.test('-h, --help')).toBe(true);
      expect(ALIAS_COMBO_REGEX.test('-v, --verbose')).toBe(true);
      expect(ALIAS_COMBO_REGEX.test('-V, --version')).toBe(true);
      expect(ALIAS_COMBO_REGEX.test('-p, --prd')).toBe(true);
    });

    it('should match alias combinations without comma', () => {
      expect(ALIAS_COMBO_REGEX.test('-h --help')).toBe(true);
      expect(ALIAS_COMBO_REGEX.test('-v --verbose')).toBe(true);
    });

    it('should not match single flags', () => {
      expect(ALIAS_COMBO_REGEX.test('--help')).toBe(false);
      expect(ALIAS_COMBO_REGEX.test('-h')).toBe(false);
    });

    it('should match alias combinations without comma', () => {
      expect(ALIAS_COMBO_REGEX.test('-h --help')).toBe(true);
      expect(ALIAS_COMBO_REGEX.test('-v --verbose')).toBe(true);
    });

    it('should match any short+long flag combination', () => {
      // Note: The regex validates the format, not semantic correctness
      // It doesn't check if the short flag is actually an alias for the long flag
      expect(ALIAS_COMBO_REGEX.test('-h --verbose')).toBe(true);
    });
  });

  describe('FLAG_WITH_ANGLE_ARG_REGEX', () => {
    it('should match flags with angle bracket arguments', () => {
      expect(FLAG_WITH_ANGLE_ARG_REGEX.test('--prd <path>')).toBe(true);
      expect(FLAG_WITH_ANGLE_ARG_REGEX.test('--scope <scope>')).toBe(true);
      expect(FLAG_WITH_ANGLE_ARG_REGEX.test('--mode <mode>')).toBe(true);
      expect(FLAG_WITH_ANGLE_ARG_REGEX.test('--output <file>')).toBe(true);
    });

    it('should not match flags without angle brackets', () => {
      expect(FLAG_WITH_ANGLE_ARG_REGEX.test('--help')).toBe(false);
      expect(FLAG_WITH_ANGLE_ARG_REGEX.test('--verbose')).toBe(false);
    });
  });

  describe('FLAG_WITH_SQUARE_ARG_REGEX', () => {
    it('should match flags with square bracket arguments', () => {
      expect(FLAG_WITH_SQUARE_ARG_REGEX.test('--file [path]')).toBe(true);
      expect(FLAG_WITH_SQUARE_ARG_REGEX.test('--output [file]')).toBe(true);
      expect(FLAG_WITH_SQUARE_ARG_REGEX.test('--dir [directory]')).toBe(true);
    });

    it('should not match flags without square brackets', () => {
      expect(FLAG_WITH_SQUARE_ARG_REGEX.test('--help')).toBe(false);
      expect(FLAG_WITH_SQUARE_ARG_REGEX.test('--verbose')).toBe(false);
    });
  });

  describe('HELP_SECTIONS', () => {
    const helpOutput = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -h, --help            display help for command
  --verbose             Enable debug logging

Commands:
  init                  Initialize project
`;

    it('should detect Usage section', () => {
      expect(HELP_SECTIONS.usage.test(helpOutput)).toBe(true);
    });

    it('should detect Options section', () => {
      expect(HELP_SECTIONS.options.test(helpOutput)).toBe(true);
    });

    it('should detect Commands section', () => {
      expect(HELP_SECTIONS.commands.test(helpOutput)).toBe(true);
    });

    it('should not detect Arguments section', () => {
      expect(HELP_SECTIONS.arguments.test(helpOutput)).toBe(false);
    });

    it('should not detect Examples section', () => {
      expect(HELP_SECTIONS.examples.test(helpOutput)).toBe(false);
    });
  });
});

// =============================================================================
// PARSING FUNCTION TESTS
// ============================================================================

describe('CLI Help Parser - Parsing Functions', () => {
  describe('parseHelpOutput', () => {
    const commanderHelp = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -V, --version         output the version number
  --prd <path>          Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>       Scope identifier (e.g., P3.M4, P3.M4.T2)
  --mode <mode>         Execution mode (choices: "normal", "bug-hunt",
                        "validate", default: "normal")
  --continue            Resume from previous session (default: false)
  --dry-run             Show plan without executing (default: false)
  --verbose             Enable debug logging (default: false)
  --no-cache            Bypass cache and regenerate all PRPs
  -h, --help            display help for command
`;

    it('should parse usage line', () => {
      const parsed = parseHelpOutput(commanderHelp);
      expect(parsed.usage).toBe('Usage: prp-pipeline [options]');
    });

    it('should parse description', () => {
      const parsed = parseHelpOutput(commanderHelp);
      expect(parsed.description).toBe('PRD to PRP Pipeline - Automated software development');
    });

    it('should parse all options', () => {
      const parsed = parseHelpOutput(commanderHelp);
      expect(parsed.options).toHaveLength(9);
    });

    it('should parse short and long flags', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const helpOption = parsed.options.find((o) => o.long === '--help');
      expect(helpOption?.short).toBe('-h');
      expect(helpOption?.long).toBe('--help');
    });

    it('should parse descriptions', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const verboseOption = parsed.options.find((o) => o.long === '--verbose');
      expect(verboseOption?.description).toBe('Enable debug logging (default: false)');
    });

    it('should parse default values', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const prdOption = parsed.options.find((o) => o.long === '--prd');
      expect(prdOption?.default).toBe('./PRD.md');
    });

    it('should parse choices', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const modeOption = parsed.options.find((o) => o.long === '--mode');
      expect(modeOption?.choices).toEqual(['normal', 'bug-hunt', 'validate']);
    });

    it('should detect negated flags', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const noCacheOption = parsed.options.find((o) => o.long === '--no-cache');
      expect(noCacheOption?.isNegated).toBe(true);
    });

    it('should parse argument names', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const prdOption = parsed.options.find((o) => o.long === '--prd');
      expect(prdOption?.argName).toBe('path');
    });

    it('should parse argument types', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const continueOption = parsed.options.find((o) => o.long === '--continue');
      expect(continueOption?.argType).toBe('boolean');
    });

    it('should handle multi-line descriptions', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const modeOption = parsed.options.find((o) => o.long === '--mode');
      expect(modeOption?.description).toContain('bug-hunt');
      expect(modeOption?.description).toContain('validate');
    });

    it('should parse long-only flags without short version', () => {
      const parsed = parseHelpOutput(commanderHelp);
      const verboseOption = parsed.options.find((o) => o.long === '--verbose');
      expect(verboseOption?.short).toBeUndefined();
      expect(verboseOption?.long).toBe('--verbose');
    });
  });

  describe('extractAllFlags', () => {
    const helpText = `
Options:
  -V, --version         output the version number
  --prd <path>          Path to PRD markdown file
  --scope <scope>       Scope identifier
  --verbose             Enable debug logging
  --no-cache            Bypass cache
  -h, --help            display help for command
`;

    it('should extract all unique flags', () => {
      const flags = extractAllFlags(helpText);
      expect(flags).toContain('-V');
      expect(flags).toContain('--version');
      expect(flags).toContain('--prd');
      expect(flags).toContain('--scope');
      expect(flags).toContain('--verbose');
      expect(flags).toContain('--no-cache');
      expect(flags).toContain('-h');
      expect(flags).toContain('--help');
    });

    it('should remove duplicates', () => {
      const helpTextWithDuplicates = `
Options:
  -h, --help            display help
  --help                another help
`;
      const flags = extractAllFlags(helpTextWithDuplicates);
      expect(flags.filter((f) => f === '--help')).toHaveLength(1);
    });

    it('should return empty array for empty text', () => {
      const flags = extractAllFlags('');
      expect(flags).toEqual([]);
    });

    it('should return empty array for text without flags', () => {
      const flags = extractAllFlags('Some random text without flags');
      expect(flags).toEqual([]);
    });
  });

  describe('hasFlag', () => {
    const helpText = `
Options:
  --verbose             Enable debug logging
  --prd <path>          Path to PRD markdown file
`;

    it('should return true for existing flag', () => {
      expect(hasFlag(helpText, '--verbose')).toBe(true);
      expect(hasFlag(helpText, '--prd')).toBe(true);
    });

    it('should return false for non-existing flag', () => {
      expect(hasFlag(helpText, '--help')).toBe(false);
      expect(hasFlag(helpText, '--debug')).toBe(false);
    });

    it('should handle flags with special regex characters', () => {
      const helpTextWithSpecial = 'Options: --max-duration --continue-on-error';
      expect(hasFlag(helpTextWithSpecial, '--max-duration')).toBe(true);
      expect(hasFlag(helpTextWithSpecial, '--continue-on-error')).toBe(true);
    });
  });

  describe('extractOptionsSection', () => {
    const helpText = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -h, --help            display help for command
  --verbose             Enable debug logging

Commands:
  init                  Initialize project
`;

    it('should extract options section', () => {
      const optionsSection = extractOptionsSection(helpText);
      expect(optionsSection).toContain('-h, --help');
      expect(optionsSection).toContain('--verbose');
    });

    it('should not include other sections', () => {
      const optionsSection = extractOptionsSection(helpText);
      expect(optionsSection).not.toContain('Commands:');
      expect(optionsSection).not.toContain('Usage:');
    });

    it('should return null for text without options section', () => {
      const noOptions = 'Usage: prp-pipeline [options]';
      expect(extractOptionsSection(noOptions)).toBeNull();
    });
  });

  describe('extractOptionDescription', () => {
    it('should extract flag and description', () => {
      const result = extractOptionDescription('--verbose             Enable debug logging');
      expect(result?.flag).toBe('--verbose');
      expect(result?.description).toBe('Enable debug logging');
    });

    it('should handle descriptions with angle brackets', () => {
      const result = extractOptionDescription('--prd <path>          Path to PRD markdown file');
      expect(result?.flag).toBe('--prd');
      expect(result?.description).toContain('<path>');
    });

    it('should return null for invalid format', () => {
      const result = extractOptionDescription('invalid line');
      expect(result).toBeNull();
    });
  });
});

// =============================================================================
// VALIDATION FUNCTION TESTS
// ============================================================================

describe('CLI Help Parser - Validation Functions', () => {
  describe('validateHelpOutput', () => {
    const validHelp = `Usage: prp-pipeline [options]

Options:
  -h, --help            display help for command
  --verbose             Enable debug logging
`;

    it('should validate correct help output', () => {
      const result = validateHelpOutput(validHelp);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing Usage section', () => {
      const noUsage = `Options: --help`;
      const result = validateHelpOutput(noUsage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing Usage section');
    });

    it('should detect missing Options section', () => {
      const noOptions = `Usage: prp-pipeline [options]`;
      const result = validateHelpOutput(noOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing Options section');
    });

    it('should detect missing flags', () => {
      const noFlags = `Usage: prp-pipeline [options]\n\nOptions:`;
      const result = validateHelpOutput(noFlags);
      expect(result.isValid).toBe(false);
      // When there are no flags, the help flag check fails first
      expect(result.errors).toContain('Missing help flag');
    });

    it('should detect missing help flag', () => {
      const noHelpFlag = `Usage: prp-pipeline [options]\n\nOptions:\n  --verbose    Enable logging`;
      const result = validateHelpOutput(noHelpFlag);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing help flag');
    });

    it('should detect multiple errors', () => {
      const badHelp = 'Random text';
      const result = validateHelpOutput(badHelp);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('detectCLILibrary', () => {
    it('should detect Commander.js format', () => {
      const commanderHelp = `Options:
  --verbose    Enable logging (default: false)
  --prd <path> Path to PRD (default: "./PRD.md")
`;
      expect(detectCLILibrary(commanderHelp)).toBe('commander');
    });

    it('should detect Yargs format', () => {
      const yargsHelp = `Options:
  --verbose    Enable logging    [boolean] [default: false]
  --prd        Path to PRD       [string] [default: "./PRD.md"]
`;
      expect(detectCLILibrary(yargsHelp)).toBe('yargs');
    });

    it('should detect Argparse format', () => {
      const argparseHelp = `usage: prog [-h] [options]

positional arguments:
  file              Input file

optional arguments:
  -h, --help        Show help
`;
      expect(detectCLILibrary(argparseHelp)).toBe('argparse');
    });

    it('should return unknown for unrecognized format', () => {
      const unknownHelp = `Help output in unknown format`;
      expect(detectCLILibrary(unknownHelp)).toBe('unknown');
    });
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('CLI Help Parser - Utility Functions', () => {
  describe('deduplicateFlags', () => {
    it('should remove duplicate flags', () => {
      const flags = ['-h', '--help', '-h', '--verbose', '--verbose', '-v'];
      const deduplicated = deduplicateFlags(flags);
      expect(deduplicated).toHaveLength(4);
      expect(deduplicated).toEqual(['-h', '--help', '--verbose', '-v']);
    });

    it('should handle empty array', () => {
      expect(deduplicateFlags([])).toEqual([]);
    });

    it('should handle array without duplicates', () => {
      const flags = ['-h', '--help', '-v'];
      expect(deduplicateFlags(flags)).toEqual(['-h', '--help', '-v']);
    });
  });

  describe('isNegatedFlag', () => {
    it('should return true for negated flags', () => {
      expect(isNegatedFlag('--no-cache')).toBe(true);
      expect(isNegatedFlag('--no-color')).toBe(true);
      expect(isNegatedFlag('--no-verify')).toBe(true);
    });

    it('should return false for regular flags', () => {
      expect(isNegatedFlag('--cache')).toBe(false);
      expect(isNegatedFlag('--verbose')).toBe(false);
      expect(isNegatedFlag('--help')).toBe(false);
    });

    it('should return false for short flags', () => {
      expect(isNegatedFlag('-h')).toBe(false);
      expect(isNegatedFlag('-v')).toBe(false);
    });
  });

  describe('isShortFlag', () => {
    it('should return true for short flags', () => {
      expect(isShortFlag('-h')).toBe(true);
      expect(isShortFlag('-v')).toBe(true);
      expect(isShortFlag('-V')).toBe(true);
    });

    it('should return false for long flags', () => {
      expect(isShortFlag('--help')).toBe(false);
      expect(isShortFlag('--verbose')).toBe(false);
    });
  });

  describe('isLongFlag', () => {
    it('should return true for long flags', () => {
      expect(isLongFlag('--help')).toBe(true);
      expect(isLongFlag('--verbose')).toBe(true);
      expect(isLongFlag('--dry-run')).toBe(true);
    });

    it('should return false for short flags', () => {
      expect(isLongFlag('-h')).toBe(false);
      expect(isLongFlag('-v')).toBe(false);
    });
  });

  describe('isBooleanFlag', () => {
    it('should return true for boolean flags', () => {
      expect(isBooleanFlag('--verbose')).toBe(true);
      expect(isBooleanFlag('--help')).toBe(true);
      expect(isBooleanFlag('-h')).toBe(true);
      expect(isBooleanFlag('-v')).toBe(true);
    });

    it('should return false for flags with arguments', () => {
      expect(isBooleanFlag('--file path.txt')).toBe(false);
      expect(isBooleanFlag('--file=path.txt')).toBe(false);
    });
  });

  describe('isFlagWithArgument', () => {
    it('should return true for flags with space-separated arguments', () => {
      expect(isFlagWithArgument('--file path.txt')).toBe(true);
      expect(isFlagWithArgument('--prd ./PRD.md')).toBe(true);
      expect(isFlagWithArgument('-f path.txt')).toBe(true);
    });

    it('should return true for flags with equals-separated arguments', () => {
      expect(isFlagWithArgument('--file=path.txt')).toBe(true);
      expect(isFlagWithArgument('--prd=./PRD.md')).toBe(true);
      expect(isFlagWithArgument('-f=path.txt')).toBe(true);
    });

    it('should return false for boolean flags', () => {
      expect(isFlagWithArgument('--help')).toBe(false);
      expect(isFlagWithArgument('--verbose')).toBe(false);
      expect(isFlagWithArgument('-h')).toBe(false);
    });
  });
});

// =============================================================================
// REAL-WORLD EXAMPLE TESTS
// ============================================================================

describe('CLI Help Parser - Real-World Examples', () => {
  describe('Commander.js Example', () => {
    const commanderHelp = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -V, --version         output the version number
  --prd <path>          Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>       Scope identifier (e.g., P3.M4, P3.M4.T2)
  --mode <mode>         Execution mode (choices: "normal", "bug-hunt",
                        "validate", default: "normal")
  --continue            Resume from previous session (default: false)
  --dry-run             Show plan without executing (default: false)
  --verbose             Enable debug logging (default: false)
  --machine-readable    Enable machine-readable JSON output (default: false)
  --no-cache            Bypass cache and regenerate all PRPs
  --continue-on-error   Treat all errors as non-fatal (default: false)
  --validate-prd        Validate PRD and exit without running pipeline
                        (default: false)
  -h, --help            display help for command
`;

    it('should parse Commander.js help output correctly', () => {
      const parsed = parseHelpOutput(commanderHelp);

      expect(parsed.usage).toBe('Usage: prp-pipeline [options]');
      expect(parsed.description).toBe('PRD to PRP Pipeline - Automated software development');
      expect(parsed.options.length).toBeGreaterThan(0);

      // Check specific options
      const helpOption = parsed.options.find((o) => o.long === '--help');
      expect(helpOption).toBeDefined();
      expect(helpOption?.short).toBe('-h');

      const noCacheOption = parsed.options.find((o) => o.long === '--no-cache');
      expect(noCacheOption).toBeDefined();
      expect(noCacheOption?.isNegated).toBe(true);

      const modeOption = parsed.options.find((o) => o.long === '--mode');
      expect(modeOption?.choices).toEqual(['normal', 'bug-hunt', 'validate']);
    });
  });

  describe('Git-style Help Output', () => {
    const gitHelp = `usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]
           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]
           <command> [<args>]

options:
   -C <path>          Run as if git was started in <path>
   -c <name>=<value>  Run as if git was started in <path>
   --exec-path[=<path>]   Path to git binaries
   --html-path        Print HTML path
   --man-path         Print man path
   --info-path        Print info path
   -p, --paginate     Paginate output
   -P, --no-pager     Disable pager
   --git-dir=<path>   Set git directory
   --work-tree=<path> Set work tree
   --bare             Use bare repository
`;

    it('should parse Git-style help output', () => {
      const parsed = parseHelpOutput(gitHelp);

      expect(parsed.options.length).toBeGreaterThan(0);

      // Check that various flag types are detected
      const flags = extractAllFlags(gitHelp);
      expect(flags).toContain('-C');
      expect(flags).toContain('-c');
      expect(flags).toContain('--exec-path');
      expect(flags).toContain('--paginate');
    });
  });

  describe('Yargs-style Help Output', () => {
    const yargsHelp = `prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  --version       Show version number                                  [boolean]
  --prd           Path to PRD markdown file               [string] [default: "./PRD.md"]
  --scope         Scope identifier                        [string]
  --mode          Execution mode          [choices: "normal", "bug-hunt", "validate"]
  --continue      Resume from previous session                          [boolean]
  --dry-run       Show plan without executing                            [boolean]
  --verbose       Enable debug logging                                   [boolean]
  --no-cache      Bypass cache and regenerate all PRPs                  [boolean]
  --help          Show help                                             [boolean]
`;

    it('should parse Yargs help output', () => {
      const parsed = parseHelpOutput(yargsHelp);

      expect(parsed.options.length).toBeGreaterThan(0);

      // Check that types are detected
      const versionOption = parsed.options.find((o) => o.long === '--version');
      expect(versionOption?.argType).toBe('boolean');

      const prdOption = parsed.options.find((o) => o.long === '--prd');
      expect(prdOption?.argType).toBe('string');
      expect(prdOption?.default).toBe('./PRD.md');
    });
  });
});

// =============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('CLI Help Parser - Edge Cases', () => {
  describe('Hyphenated Flags', () => {
    it('should handle flags with multiple hyphens', () => {
      expect(LONG_FLAG_REGEX.test('--dry-run')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--max-duration')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--continue-on-error')).toBe(true);
    });

    it('should reject flags ending with hyphen', () => {
      expect(LONG_FLAG_REGEX.test('--no-')).toBe(false);
      expect(LONG_FLAG_REGEX.test('--dry-')).toBe(false);
    });
  });

  describe('Flags with Numbers', () => {
    it('should handle flags containing numbers', () => {
      expect(LONG_FLAG_REGEX.test('--max-tasks')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--port-8080')).toBe(true);
      expect(LONG_FLAG_REGEX.test('--ipv6')).toBe(true);
    });

    it('should reject flags starting with numbers', () => {
      expect(LONG_FLAG_REGEX.test('--8080port')).toBe(false);
      expect(LONG_FLAG_REGEX.test('--123')).toBe(false);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle both lowercase and uppercase short flags', () => {
      expect(SHORT_FLAG_REGEX.test('-v')).toBe(true);
      expect(SHORT_FLAG_REGEX.test('-V')).toBe(true);
    });

    it('should treat case variations as different flags', () => {
      const helpText = 'Options: --verbose --Verbose';
      const flags = extractAllFlags(helpText);
      expect(flags).toContain('--verbose');
      expect(flags).toContain('--Verbose');
    });
  });

  describe('Special Characters in Arguments', () => {
    it('should handle quoted arguments with spaces', () => {
      expect(FLAG_WITH_ARG_REGEX.test('--file "path with spaces.txt"')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('--output="result file.txt"')).toBe(true);
    });

    it('should handle arguments with special characters', () => {
      expect(FLAG_WITH_ARG_REGEX.test('--url http://example.com')).toBe(true);
      expect(FLAG_WITH_ARG_REGEX.test('--email user@example.com')).toBe(true);
    });
  });

  describe('Empty and Whitespace', () => {
    it('should handle empty help text', () => {
      const parsed = parseHelpOutput('');
      expect(parsed.options).toEqual([]);
    });

    it('should handle help text with only whitespace', () => {
      const parsed = parseHelpOutput('   \n\n   \n');
      expect(parsed.options).toEqual([]);
    });

    it('should handle help text with missing sections', () => {
      const parsed = parseHelpOutput('Random text without sections');
      expect(parsed.options).toEqual([]);
    });
  });

  describe('Unicode and International Characters', () => {
    it('should handle Unicode in descriptions', () => {
      const helpText = `Options:
  --verbose    Enable debug logging (默认: false)
`;
      const parsed = parseHelpOutput(helpText);
      expect(parsed.options.length).toBe(1);
    });
  });
});
