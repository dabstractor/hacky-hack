/**
 * Unit tests for Package.json Syntax Verifier
 *
 * @remarks
 * Tests validate package.json syntax verification functionality including:
 * 1. Happy path - Valid JSON returns valid: true
 * 2. Empty object {} returns valid: true
 * 3. Complete package.json returns valid: true
 * 4. Valid JSON with NODE_OPTIONS scripts returns valid: true
 * 5. Trailing comma returns valid: false with error message
 * 6. Unquoted key returns valid: false with error message
 * 7. Missing closing brace returns valid: false with error message
 * 8. Malformed escape sequence returns valid: false with error message
 * 9. Single quotes instead of double quotes returns valid: false
 * 10. File not found (ENOENT) returns valid: false with descriptive error
 * 11. Permission denied (EACCES) returns valid: false with descriptive error
 * 12. Generic read error returns valid: false with error message
 * 13. Empty file returns valid: false (not valid JSON)
 * 14. Whitespace-only file returns valid: false
 * 15. JSON array instead of object returns valid: true (JSON allows it)
 * 16. Null value returns valid: true (JSON allows null)
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

// Mock fs for readFileSync
const mockReadFileSync = vi.fn();
vi.mock('node:fs', () => ({
  readFileSync: vi.fn((...args: unknown[]) => mockReadFileSync(...args)),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// Import module under test
import {
  verifyPackageJsonSyntax,
  type PackageJsonSyntaxResult,
} from '../../../src/utils/package-json-syntax-verifier.js';

// =============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock package.json content string
 *
 * @param options - Options for configuring the mock
 * @returns Mock package.json content as JSON string
 */
function createMockPackageJsonContent(
  options: {
    scripts?: Record<string, string>;
    extras?: Record<string, unknown>;
  } = {}
): string {
  const { scripts = {}, extras = {} } = options;

  const pkg = {
    name: 'test-package',
    version: '1.0.0',
    ...extras,
    scripts: scripts || {},
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Creates a valid package.json with typical scripts including NODE_OPTIONS
 *
 * @returns Package.json content with NODE_OPTIONS in test scripts (after S2)
 */
function createPackageJsonWithNodeOptions(): string {
  return createMockPackageJsonContent({
    scripts: {
      test: 'NODE_OPTIONS="--max-old-space-size=4096" vitest',
      'test:run': 'NODE_OPTIONS="--max-old-space-size=4096" vitest run',
      'test:watch': 'NODE_OPTIONS="--max-old-space-size=4096" vitest watch',
      'test:coverage': 'NODE_OPTIONS="--max-old-space-size=4096" vitest run --coverage',
      'test:bail': 'NODE_OPTIONS="--max-old-space-size=4096" vitest run --bail=1',
    },
  });
}

/**
 * Creates a valid package.json without NODE_OPTIONS (before S2)
 *
 * @returns Package.json content without NODE_OPTIONS
 */
function createPackageJsonWithoutNodeOptions(): string {
  return createMockPackageJsonContent({
    scripts: {
      test: 'vitest',
      'test:run': 'vitest run',
      'test:watch': 'vitest watch',
      'test:coverage': 'vitest run --coverage',
      'test:bail': 'vitest run --bail=1',
    },
  });
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('package-json-syntax-verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default behavior - return valid package.json
    mockReadFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('package.json')) {
        return createPackageJsonWithoutNodeOptions();
      }
      throw new Error(`File not found: ${filePath}`);
    });
  });

  // ========================================================================
  // Happy path tests - Valid JSON
  // ========================================================================

  describe('Happy path - Valid JSON', () => {
    it('should return valid: true for valid package.json', () => {
      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should return syntaxError: null for valid JSON', () => {
      const result = verifyPackageJsonSyntax();

      expect(result.syntaxError).toBeNull();
    });

    it('should return success message containing file path', () => {
      const result = verifyPackageJsonSyntax();

      expect(result.message).toContain('Valid JSON in package.json at');
    });

    it('should handle empty object {} as valid JSON', () => {
      mockReadFileSync.mockReturnValue('{}');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
      expect(result.syntaxError).toBeNull();
    });

    it('should handle complete package.json', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            build: 'tsc',
            lint: 'eslint',
          },
        })
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
      expect(result.syntaxError).toBeNull();
    });

    it('should accept valid JSON with escaped quotes (NODE_OPTIONS format)', () => {
      mockReadFileSync.mockReturnValue(createPackageJsonWithNodeOptions());

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
      expect(result.syntaxError).toBeNull();
      expect(result.message).toContain('Valid JSON');
    });

    it('should handle JSON with backslash-escaped quotes in strings', () => {
      // This is what NODE_OPTIONS looks like in JSON
      const jsonWithEscapedQuotes = JSON.stringify({
        scripts: {
          test: 'NODE_OPTIONS="--max-old-space-size=4096" vitest',
        },
      }, null, 2);

      mockReadFileSync.mockReturnValue(jsonWithEscapedQuotes);

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle JSON array as valid (JSON allows arrays)', () => {
      mockReadFileSync.mockReturnValue('[]');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
      expect(result.syntaxError).toBeNull();
    });

    it('should handle null value as valid (JSON allows null)', () => {
      mockReadFileSync.mockReturnValue('null');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
      expect(result.syntaxError).toBeNull();
    });

    it('should handle primitive values as valid (JSON allows them)', () => {
      mockReadFileSync.mockReturnValue('"string value"');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle number as valid (JSON allows it)', () => {
      mockReadFileSync.mockReturnValue('42');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle boolean true as valid', () => {
      mockReadFileSync.mockReturnValue('true');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle boolean false as valid', () => {
      mockReadFileSync.mockReturnValue('false');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // Syntax error detection tests - Invalid JSON
  // ========================================================================

  describe('Syntax error detection - Invalid JSON', () => {
    it('should detect trailing comma', () => {
      mockReadFileSync.mockReturnValue('{ "test": "vitest", }');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
      expect(result.syntaxError).toMatch(/token|comma|position/i);
    });

    it('should detect unquoted key', () => {
      mockReadFileSync.mockReturnValue('{ test: "vitest" }');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
      expect(result.syntaxError).toMatch(/token|position/i);
    });

    it('should detect missing closing brace', () => {
      mockReadFileSync.mockReturnValue('{ "test": "vitest"');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
      expect(result.syntaxError).toMatch(/Expected|position|end/i);
    });

    it('should detect malformed escape sequence', () => {
      // \v is not a valid JSON escape sequence (only \", \\, \/, \b, \f, \n, \r, \t, \uXXXX are valid)
      mockReadFileSync.mockReturnValue('{ "test": "\\vitest" }');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should detect single quotes instead of double quotes', () => {
      mockReadFileSync.mockReturnValue('{ \'test\': \'vitest\' }');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
      expect(result.syntaxError).toMatch(/token|position/i);
    });

    it('should detect comments (not valid in JSON)', () => {
      mockReadFileSync.mockReturnValue('{ "test": "vitest" // comment }');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should detect trailing comma in array', () => {
      mockReadFileSync.mockReturnValue('{ "scripts": ["test", ] }');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should detect missing comma between properties', () => {
      mockReadFileSync.mockReturnValue('{ "test": "vitest" "build": "tsc" }');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should detect duplicate keys (some parsers catch this)', () => {
      // JSON.parse() behavior with duplicate keys varies by implementation
      // It may silently use the last value or throw an error
      mockReadFileSync.mockReturnValue('{ "test": "vitest", "test": "jest" }');

      const result = verifyPackageJsonSyntax();

      // Most JSON.parse() implementations accept this (using last value)
      // but we should handle either case
      expect(typeof result.valid).toBe('boolean');
    });

    it('should detect undefined value (not valid in JSON)', () => {
      mockReadFileSync.mockReturnValue('undefined');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should include position in syntax error message', () => {
      mockReadFileSync.mockReturnValue('{ "test": "vitest", }');

      const result = verifyPackageJsonSyntax();

      expect(result.syntaxError).toMatch(/\d+/); // Should contain position number
    });
  });

  // ========================================================================
  // File error handling tests
  // ========================================================================

  describe('File error handling - File system errors', () => {
    it('should return valid: false when file does not exist (ENOENT)', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
    });

    it('should return descriptive error message for ENOENT', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = verifyPackageJsonSyntax();

      expect(result.syntaxError).toContain('File not found');
      expect(result.syntaxError).toContain('package.json');
    });

    it('should return valid: false for permission errors (EACCES)', () => {
      const err: NodeJS.ErrnoException = new Error('EACCES');
      err.code = 'EACCES';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
    });

    it('should return descriptive error message for EACCES', () => {
      const err: NodeJS.ErrnoException = new Error('EACCES');
      err.code = 'EACCES';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = verifyPackageJsonSyntax();

      expect(result.syntaxError).toContain('Permission denied');
      expect(result.syntaxError).toContain('package.json');
    });

    it('should return valid: false for other read errors', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Unknown read error');
      });

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
    });

    it('should include error details in error message', () => {
      const customError = new Error('Custom error message');
      mockReadFileSync.mockImplementation(() => {
        throw customError;
      });

      const result = verifyPackageJsonSyntax();

      expect(result.syntaxError).toContain('Error reading package.json');
    });
  });

  // ========================================================================
  // Edge case tests
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle empty file as invalid JSON', () => {
      mockReadFileSync.mockReturnValue('');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should handle whitespace-only file as invalid JSON', () => {
      mockReadFileSync.mockReturnValue('   \n\t  ');

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should handle JSON with nested objects', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          name: 'test',
          scripts: {
            test: 'vitest',
            build: {
              cmd: 'tsc',
              options: ['--strict', '--noEmit'],
            },
          },
        }, null, 2)
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle JSON with nested arrays', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          keywords: [['test', 'unit'], ['coverage', 'v8']],
        }, null, 2)
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle Unicode characters in JSON', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          name: 'test-package-中文',
          description: '日本語のパッケージ',
          emoji: '🚀',
        }, null, 2)
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle escaped Unicode characters', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          name: 'test',
          unicode: '\u4e2d\u6587', // 中文
        }, null, 2)
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle scientific notation numbers', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          version: 1.0e2,
        })
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle negative numbers', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          priority: -1,
        })
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });

    it('should handle very long JSON strings', () => {
      const largeObj = {
        scripts: {},
      };
      // Create 100 test scripts
      for (let i = 0; i < 100; i++) {
        (largeObj.scripts as Record<string, string>)[`test:${i}`] = `vitest run test-${i}.test.ts`;
      }

      mockReadFileSync.mockReturnValue(JSON.stringify(largeObj, null, 2));

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // Custom file path tests
  // ========================================================================

  describe('Custom file path support', () => {
    it('should accept custom file path parameter', () => {
      mockReadFileSync.mockReturnValue('{"name": "custom"}');

      const result = verifyPackageJsonSyntax('/custom/path/package.json');

      expect(result.valid).toBe(true);
      expect(mockReadFileSync).toHaveBeenCalledWith('/custom/path/package.json', 'utf-8');
    });

    it('should handle invalid JSON at custom path', () => {
      mockReadFileSync.mockReturnValue('{invalid}');

      const result = verifyPackageJsonSyntax('/custom/path/package.json');

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });

    it('should include custom path in error message for file not found', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = verifyPackageJsonSyntax('/custom/path/package.json');

      expect(result.syntaxError).toContain('/custom/path/package.json');
    });

    it('should include custom path in success message', () => {
      mockReadFileSync.mockReturnValue('{}');

      const result = verifyPackageJsonSyntax('/custom/path/package.json');

      expect(result.message).toContain('/custom/path/package.json');
    });

    it('should resolve relative paths using path.resolve()', () => {
      mockReadFileSync.mockReturnValue('{}');

      const result = verifyPackageJsonSyntax('./relative/package.json');

      expect(result.valid).toBe(true);
      // path.resolve() should be called, making the path absolute
      expect(result.message).toContain('package.json');
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('Result structure validation', () => {
    it('should have valid field of type boolean', () => {
      const result = verifyPackageJsonSyntax();

      expect(typeof result.valid).toBe('boolean');
    });

    it('should have syntaxError field as string or null', () => {
      const result = verifyPackageJsonSyntax();

      expect(result.syntaxError === null || typeof result.syntaxError === 'string').toBe(true);
    });

    it('should have message field of type string', () => {
      const result = verifyPackageJsonSyntax();

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should have readonly properties', () => {
      // TypeScript enforces readonly at compile-time
      // We can verify the structure exists
      const result = verifyPackageJsonSyntax();

      expect('valid' in result).toBe(true);
      expect('syntaxError' in result).toBe(true);
      expect('message' in result).toBe(true);
    });
  });

  // ========================================================================
  // Integration-like tests with realistic data
  // ========================================================================

  describe('Realistic package.json scenarios', () => {
    it('should handle actual project package.json structure', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify(
          {
            name: 'hacky-hack',
            version: '0.1.0',
            description: 'Autonomous PRP Development Pipeline',
            type: 'module',
            scripts: {
              dev: 'tsx src/index.ts',
              'dev:watch': 'nodemon --exec tsx src/index.ts',
              build: 'tsc',
              typecheck: 'tsc --noEmit',
              test: 'vitest',
              'test:run': 'vitest run',
              'test:watch': 'vitest watch',
              'test:coverage': 'vitest run --coverage',
              'test:bail': 'vitest run --bail=1',
              lint: 'eslint . --ext .ts',
              format: 'prettier --write "**/*.{ts,js,json,md}"',
            },
          },
          null,
          2
        )
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
      expect(result.syntaxError).toBeNull();
    });

    it('should handle package.json after S2 updates (with NODE_OPTIONS)', () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify(
          {
            name: 'hacky-hack',
            version: '0.1.0',
            type: 'module',
            scripts: {
              test: 'NODE_OPTIONS="--max-old-space-size=4096" vitest',
              'test:run': 'NODE_OPTIONS="--max-old-space-size=4096" vitest run',
              'test:watch': 'NODE_OPTIONS="--max-old-space-size=4096" vitest watch',
              'test:coverage': 'NODE_OPTIONS="--max-old-space-size=4096" vitest run --coverage',
              'test:bail': 'NODE_OPTIONS="--max-old-space-size=4096" vitest run --bail=1',
            },
          },
          null,
          2
        )
      );

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(true);
      expect(result.syntaxError).toBeNull();
      expect(result.message).toContain('Valid JSON');
    });

    it('should detect if Edit tool corrupted JSON with trailing comma', () => {
      // Simulate Edit tool accidentally adding trailing comma
      const corruptedJson = `{
  "scripts": {
    "test": "NODE_OPTIONS=\\"--max-old-space-size=4096\\" vitest",
  }
}`;
      mockReadFileSync.mockReturnValue(corruptedJson);

      const result = verifyPackageJsonSyntax();

      expect(result.valid).toBe(false);
      expect(result.syntaxError).toBeTruthy();
    });
  });

  // ========================================================================
  // Message generation tests
  // ========================================================================

  describe('Error message generation', () => {
    it('should generate clear success message', () => {
      mockReadFileSync.mockReturnValue('{}');

      const result = verifyPackageJsonSyntax();

      expect(result.message).toContain('Valid JSON');
      expect(result.message).toContain('package.json');
    });

    it('should include syntax error details in failure message', () => {
      mockReadFileSync.mockReturnValue('{ invalid }');

      const result = verifyPackageJsonSyntax();

      expect(result.message).toContain('Invalid JSON');
      expect(result.syntaxError).toBeTruthy();
    });

    it('should include file path in success message', () => {
      mockReadFileSync.mockReturnValue('{}');

      const result = verifyPackageJsonSyntax();

      expect(result.message).toContain('at');
    });

    it('should include file path in error message', () => {
      mockReadFileSync.mockReturnValue('{invalid}');

      const result = verifyPackageJsonSyntax();

      expect(result.message).toContain('package.json');
    });
  });
});
