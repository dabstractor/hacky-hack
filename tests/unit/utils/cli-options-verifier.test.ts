/**
 * Unit tests for CLI Options Verifier
 *
 * @remarks
 * Tests validate CLI options verification functionality including:
 * 1. Early return when errorResult.hasErrors is true (startup errors)
 * 2. All options present detection (happy path)
 * 3. Partial options present detection
 * 4. No options present detection
 * 5. Individual option flag detection (--prd, --verbose, --scope, --validate-prd)
 * 6. Description text validation
 * 7. Result structure validation
 * 8. Message generation
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  })),
}));

// Import module under test
import { verifyCliOptions, type CliOptionsResult } from '../../../src/utils/cli-options-verifier.js';
import type { StartupErrorResult } from '../../../src/utils/startup-error-verifier.js';

// =============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock StartupErrorResult for testing
 *
 * @param options - Options for configuring the mock
 * @returns Mock StartupErrorResult object
 */
function createMockStartupErrorResult(
  options: {
    hasErrors?: boolean;
    errorTypes?: string[];
    rawErrors?: string[];
    message?: string;
  } = {}
): StartupErrorResult {
  const {
    hasErrors = false,
    errorTypes = [],
    rawErrors = [],
    message = 'Clean startup',
  } = options;

  return {
    hasErrors,
    errorTypes,
    rawErrors,
    message,
  };
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('cli-options-verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests - All options present
  // ========================================================================

  describe('All expected CLI options present', () => {
    const allOptionsHelp = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  --prd <path>              Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>           Scope identifier (e.g., "P3.M4", "P3.M4.T2")
  --verbose                 Enable debug logging
  --validate-prd            Validate PRD and exit without running pipeline
  -h, --help                display help for command
`;

    it('should return allOptionsPresent: true when all 4 options are detected', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
        message: 'Clean startup',
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should return all 4 options in optionsPresent array', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.optionsPresent).toHaveLength(4);
      expect(result.optionsPresent).toContain('--prd');
      expect(result.optionsPresent).toContain('--verbose');
      expect(result.optionsPresent).toContain('--scope');
      expect(result.optionsPresent).toContain('--validate-prd');
    });

    it('should return empty missingOptions array', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.missingOptions).toHaveLength(0);
      expect(result.missingOptions).toEqual([]);
    });

    it('should return success message with all options listed', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.message).toContain('All expected CLI options detected');
      expect(result.message).toContain('--prd');
      expect(result.message).toContain('--verbose');
      expect(result.message).toContain('--scope');
      expect(result.message).toContain('--validate-prd');
    });
  });

  // ========================================================================
  // Early return tests - Startup errors
  // ========================================================================

  describe('Early return on startup errors', () => {
    it('should return allOptionsPresent: false when errorResult.hasErrors is true', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: true,
        errorTypes: ['MODULE_NOT_FOUND'],
        rawErrors: ['Cannot find module'],
        message: 'Startup errors detected',
      });

      const result = verifyCliOptions(mockResult, 'any help output');

      expect(result.allOptionsPresent).toBe(false);
    });

    it('should return empty optionsPresent array when hasErrors is true', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: true,
        errorTypes: ['MODULE_NOT_FOUND'],
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.optionsPresent).toHaveLength(0);
      expect(result.optionsPresent).toEqual([]);
    });

    it('should return all 4 options as missing when hasErrors is true', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: true,
        errorTypes: ['RUNTIME_ERROR'],
      });

      const result = verifyCliOptions(mockResult, 'any help output');

      expect(result.missingOptions).toHaveLength(4);
      expect(result.missingOptions).toContain('--prd');
      expect(result.missingOptions).toContain('--verbose');
      expect(result.missingOptions).toContain('--scope');
      expect(result.missingOptions).toContain('--validate-prd');
    });

    it('should return skipped message when hasErrors is true', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: true,
        errorTypes: ['MODULE_NOT_FOUND', 'RUNTIME_ERROR'],
      });

      const result = verifyCliOptions(mockResult, 'any help output');

      expect(result.message).toContain('CLI options verification skipped');
      expect(result.message).toContain('startup errors detected');
    });

    it('should not parse help output when hasErrors is true', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: true,
        errorTypes: ['SPAWN_ERROR'],
      });

      // Even with valid help output, should not parse it
      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.optionsPresent).toHaveLength(0);
      expect(result.allOptionsPresent).toBe(false);
    });
  });

  // ========================================================================
  // Individual option detection tests
  // ========================================================================

  describe('Individual option flag detection', () => {
    it('should detect --prd option with description', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const prdHelp = `Options:
  --prd <path>    Path to PRD markdown file
  -h, --help      display help for command
`;

      const result = verifyCliOptions(mockResult, prdHelp);

      expect(result.optionsPresent).toContain('--prd');
    });

    it('should detect --verbose option with description', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const verboseHelp = `Options:
  --verbose       Enable debug logging
  -h, --help      display help for command
`;

      const result = verifyCliOptions(mockResult, verboseHelp);

      expect(result.optionsPresent).toContain('--verbose');
    });

    it('should detect --scope option with description', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const scopeHelp = `Options:
  --scope <scope>   Scope identifier (e.g., "P3.M4")
  -h, --help        display help for command
`;

      const result = verifyCliOptions(mockResult, scopeHelp);

      expect(result.optionsPresent).toContain('--scope');
    });

    it('should detect --validate-prd option with description', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const validateHelp = `Options:
  --validate-prd    Validate PRD and exit
  -h, --help        display help for command
`;

      const result = verifyCliOptions(mockResult, validateHelp);

      expect(result.optionsPresent).toContain('--validate-prd');
    });

    it('should not detect option without description text', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      // Option flag without description should not be detected
      const helpWithoutDesc = `Options:
  --prd
  -h, --help        display help for command
`;

      const result = verifyCliOptions(mockResult, helpWithoutDesc);

      expect(result.optionsPresent).not.toContain('--prd');
    });

    it('should require whitespace after option flag', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      // Option immediately followed by text (no space) should not match properly
      const malformedHelp = `Options:
  --prd<arg>        Path to PRD markdown file
  -h, --help        display help for command
`;

      const result = verifyCliOptions(mockResult, malformedHelp);

      // The pattern requires \s+ (whitespace) after the flag
      expect(result.optionsPresent).not.toContain('--prd');
    });
  });

  // ========================================================================
  // Partial options detection tests
  // ========================================================================

  describe('Partial CLI options detection', () => {
    it('should detect 2 of 4 options present', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const partialHelp = `Options:
  --prd <path>         Path to PRD markdown file
  --verbose            Enable debug logging
  -h, --help           display help for command
`;

      const result = verifyCliOptions(mockResult, partialHelp);

      expect(result.allOptionsPresent).toBe(false);
      expect(result.optionsPresent).toHaveLength(2);
      expect(result.optionsPresent).toContain('--prd');
      expect(result.optionsPresent).toContain('--verbose');
    });

    it('should report missing options in missingOptions array', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const partialHelp = `Options:
  --prd <path>         Path to PRD markdown file
  --verbose            Enable debug logging
  -h, --help           display help for command
`;

      const result = verifyCliOptions(mockResult, partialHelp);

      expect(result.missingOptions).toHaveLength(2);
      expect(result.missingOptions).toContain('--scope');
      expect(result.missingOptions).toContain('--validate-prd');
    });

    it('should include found and missing options in message', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const partialHelp = `Options:
  --prd <path>    Path to PRD markdown file
  -h, --help      display help for command
`;

      const result = verifyCliOptions(mockResult, partialHelp);

      expect(result.message).toContain('CLI options verification incomplete');
      expect(result.message).toContain('Found:');
      expect(result.message).toContain('--prd');
      expect(result.message).toContain('Missing:');
      expect(result.message).toContain('--scope');
    });

    it('should handle only 1 option present', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const singleOptionHelp = `Options:
  --verbose       Enable debug logging
  -h, --help      display help for command
`;

      const result = verifyCliOptions(mockResult, singleOptionHelp);

      expect(result.allOptionsPresent).toBe(false);
      expect(result.optionsPresent).toHaveLength(1);
      expect(result.missingOptions).toHaveLength(3);
    });
  });

  // ========================================================================
  // No options detection tests
  // ========================================================================

  describe('No CLI options detected', () => {
    it('should return allOptionsPresent: false when no options found', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const emptyHelp = `Usage: prp-pipeline [options]

Options:
  -h, --help      display help for command
  -V, --version   output the version number
`;

      const result = verifyCliOptions(mockResult, emptyHelp);

      expect(result.allOptionsPresent).toBe(false);
    });

    it('should return empty optionsPresent array when no options found', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const emptyHelp = `Options:
  -h, --help      display help for command
`;

      const result = verifyCliOptions(mockResult, emptyHelp);

      expect(result.optionsPresent).toHaveLength(0);
    });

    it('should return all 4 options in missingOptions array', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const emptyHelp = `Options:
  -h, --help      display help for command
`;

      const result = verifyCliOptions(mockResult, emptyHelp);

      expect(result.missingOptions).toHaveLength(4);
      expect(result.missingOptions).toContain('--prd');
      expect(result.missingOptions).toContain('--verbose');
      expect(result.missingOptions).toContain('--scope');
      expect(result.missingOptions).toContain('--validate-prd');
    });

    it('should report "No options found" in message when none detected', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const emptyHelp = `Options:
  -h, --help      display help for command
`;

      const result = verifyCliOptions(mockResult, emptyHelp);

      expect(result.message).toContain('No options found');
    });

    it('should handle empty help output', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, '');

      expect(result.allOptionsPresent).toBe(false);
      expect(result.optionsPresent).toHaveLength(0);
      expect(result.missingOptions).toHaveLength(4);
    });

    it('should handle undefined help output', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, undefined);

      expect(result.allOptionsPresent).toBe(false);
      expect(result.optionsPresent).toHaveLength(0);
      expect(result.missingOptions).toHaveLength(4);
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('Result structure validation', () => {
    it('should return readonly optionsPresent array', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.optionsPresent).toBeInstanceOf(Array);
    });

    it('should return readonly missingOptions array', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(result.missingOptions).toBeInstanceOf(Array);
    });

    it('should have message field of type string', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should have allOptionsPresent as boolean', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const result = verifyCliOptions(mockResult, allOptionsHelp);

      expect(typeof result.allOptionsPresent).toBe('boolean');
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle multiline descriptions for options', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const multilineHelp = `Options:
  --prd <path>              Path to PRD markdown file
                             (default: "./PRD.md")
  --verbose                 Enable debug logging
  -h, --help                display help for command
`;

      const result = verifyCliOptions(mockResult, multilineHelp);

      expect(result.optionsPresent).toContain('--prd');
      expect(result.optionsPresent).toContain('--verbose');
    });

    it('should be case-sensitive for option flags', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      // Uppercase flags should NOT match
      const uppercaseHelp = `Options:
  --PRD <path>         Path to PRD markdown file
  --VERBOSE            Enable debug logging
  -h, --help           display help for command
`;

      const result = verifyCliOptions(mockResult, uppercaseHelp);

      expect(result.optionsPresent).not.toContain('--prd');
      expect(result.optionsPresent).not.toContain('--verbose');
    });

    it('should handle options with different argument formats', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const variousArgsHelp = `Options:
  --prd <path>              Path to PRD markdown file
  --scope <scope>           Scope identifier
  --verbose                 Enable debug logging
  --validate-prd            Validate PRD and exit
  -h, --help                display help for command
`;

      const result = verifyCliOptions(mockResult, variousArgsHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should handle extra whitespace in help output', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const extraWhitespaceHelp = `Options:
    --prd <path>              Path to PRD markdown file
    --verbose                 Enable debug logging
    --scope <scope>           Scope identifier
    --validate-prd            Validate PRD and exit
    -h, --help                display help for command
`;

      const result = verifyCliOptions(mockResult, extraWhitespaceHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should handle tabs instead of spaces', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const tabbedHelp = `Options:
\t--prd <path>\t\tPath to PRD markdown file
\t--verbose\t\tEnable debug logging
\t--scope <scope>\t\tScope identifier
\t--validate-prd\t\tValidate PRD and exit
\t-h, --help\t\tdisplay help for command
`;

      const result = verifyCliOptions(mockResult, tabbedHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should not detect partial matches', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const partialMatchHelp = `Options:
  --prd-override <path>    Path to override PRD
  --verbose-level <level>  Set verbosity level
  -h, --help               display help for command
`;

      const result = verifyCliOptions(mockResult, partialMatchHelp);

      // Should not match partial option names
      expect(result.optionsPresent).not.toContain('--prd');
      expect(result.optionsPresent).not.toContain('--verbose');
    });

    it('should handle very long descriptions', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const longDesc = 'Path to PRD markdown file '.repeat(100);

      const longDescHelp = `Options:
  --prd <path>    ${longDesc}
  --verbose       Enable debug logging
  --scope <scope> Scope identifier
  --validate-prd  Validate PRD and exit
`;

      const result = verifyCliOptions(mockResult, longDescHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should handle special characters in descriptions', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const specialCharsHelp = `Options:
  --prd <path>           Path to PRD file (default: "./PRD.md")
  --verbose              Enable debug logging @#$%^&*()
  --scope <scope>        Scope identifier (e.g., "P3.M4", "P3.M4.T2")
  --validate-prd         Validate PRD and exit without running pipeline
  -h, --help             display help for command
`;

      const result = verifyCliOptions(mockResult, specialCharsHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should not detect options with different dash format', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const wrongDashHelp = `Options:
  -prd <path>            Path to PRD markdown file
  -verbose               Enable debug logging
  -scope <scope>         Scope identifier
  -validate-prd          Validate PRD and exit
  -h, --help             display help for command
`;

      const result = verifyCliOptions(mockResult, wrongDashHelp);

      // Single dash format should not match
      expect(result.allOptionsPresent).toBe(false);
    });

    it('should handle options with underscores and hyphens', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const mixedFormatHelp = `Options:
  --prd <path>              Path to PRD markdown file
  --scope <scope>           Scope identifier
  --validate-prd            Validate PRD and exit
  --verbose                 Enable debug logging
  -h, --help                display help for command
`;

      const result = verifyCliOptions(mockResult, mixedFormatHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should handle options appearing in any order', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const reversedHelp = `Options:
  --validate-prd            Validate PRD and exit
  --scope <scope>           Scope identifier
  --prd <path>              Path to PRD markdown file
  --verbose                 Enable debug logging
  -h, --help                display help for command
`;

      const result = verifyCliOptions(mockResult, reversedHelp);

      expect(result.allOptionsPresent).toBe(true);
      expect(result.optionsPresent).toHaveLength(4);
    });

    it('should handle very long help output without performance issues', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const longHelp = 'Usage: prp-pipeline\n'.repeat(10000) + `Options:
  --prd <path>              Path to PRD markdown file
  --verbose                 Enable debug logging
  --scope <scope>           Scope identifier
  --validate-prd            Validate PRD and exit
`;

      const result = verifyCliOptions(mockResult, longHelp);

      expect(result.allOptionsPresent).toBe(true);
    });
  });

  // ========================================================================
  // Input preservation tests
  // ========================================================================

  describe('Input preservation', () => {
    it('should not mutate input StartupErrorResult object', () => {
      const originalResult = createMockStartupErrorResult({
        hasErrors: false,
        message: 'Clean startup',
      });

      const originalResultCopy = { ...originalResult };
      verifyCliOptions(originalResult, allOptionsHelp);

      expect(originalResult.hasErrors).toBe(originalResultCopy.hasErrors);
      expect(originalResult.errorTypes).toEqual(originalResultCopy.errorTypes);
      expect(originalResult.rawErrors).toEqual(originalResultCopy.rawErrors);
      expect(originalResult.message).toBe(originalResultCopy.message);
    });

    it('should not modify help output string', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const originalHelp = allOptionsHelp;
      verifyCliOptions(mockResult, originalHelp);

      expect(allOptionsHelp).toBe(originalHelp);
    });
  });

  // ========================================================================
  // Real-world help output format tests
  // ========================================================================

  describe('Real-world Commander.js help output', () => {
    it('should handle actual Commander.js help format', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const commanderJsHelp = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  -V, --version                 output the version number
  --prd <path>                  Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>               Scope identifier (e.g., "P3.M4", "P3.M4.T2")
  --mode <mode>                 Execution mode (choices: "normal", "bug-hunt", "validate")
  --verbose                     Enable debug logging (default: false)
  --validate-prd                Validate PRD and exit without running pipeline
  -h, --help                    display help for command
`;

      const result = verifyCliOptions(mockResult, commanderJsHelp);

      expect(result.allOptionsPresent).toBe(true);
      expect(result.optionsPresent).toHaveLength(4);
    });

    it('should handle Commander.js format with defaults in parentheses', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const commanderHelp = `Options:
  --prd <path>                  Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>               Scope identifier (e.g., "P3.M4", "P3.M4.T2")
  --verbose                     Enable debug logging (default: false)
  --validate-prd                Validate PRD and exit (default: false)
`;

      const result = verifyCliOptions(mockResult, commanderHelp);

      expect(result.allOptionsPresent).toBe(true);
    });
  });

  // ========================================================================
  // Description text validation tests
  // ========================================================================

  describe('Description text detection', () => {
    it('should require non-empty description after option flag', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      // Option with only spaces after (no actual description)
      const noDescHelp = `Options:
  --prd
  --verbose
`;

      const result = verifyCliOptions(mockResult, noDescHelp);

      expect(result.optionsPresent).not.toContain('--prd');
      expect(result.optionsPresent).not.toContain('--verbose');
    });

    it('should match single word descriptions', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const singleWordHelp = `Options:
  --prd <path>         Path
  --verbose            Debug
  --scope <scope>      Scope
  --validate-prd       Exit
`;

      const result = verifyCliOptions(mockResult, singleWordHelp);

      expect(result.allOptionsPresent).toBe(true);
    });

    it('should match descriptions with special symbols', () => {
      const mockResult = createMockStartupErrorResult({
        hasErrors: false,
      });

      const symbolHelp = `Options:
  --prd <path>              Path to file @ ./PRD.md
  --verbose                 Debug: enable verbose output
  --scope <scope>           Scope (e.g., "P3.M4", "P3.M4.T2")
  --validate-prd            Exit after validation
`;

      const result = verifyCliOptions(mockResult, symbolHelp);

      expect(result.allOptionsPresent).toBe(true);
    });
  });
});

// Helper variable for valid help output used across tests
const allOptionsHelp = `Usage: prp-pipeline [options]

PRD to PRP Pipeline - Automated software development

Options:
  --prd <path>              Path to PRD markdown file (default: "./PRD.md")
  --scope <scope>           Scope identifier (e.g., "P3.M4", "P3.M4.T2")
  --verbose                 Enable debug logging
  --validate-prd            Validate PRD and exit without running pipeline
  -h, --help                display help for command
`;
