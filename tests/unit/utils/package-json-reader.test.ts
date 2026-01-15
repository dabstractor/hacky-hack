/**
 * Unit tests for Package.json Reader
 *
 * @remarks
 * Tests validate package.json reading functionality including:
 * 1. Happy path - Valid package.json with scripts
 * 2. Test script detection - Scripts starting with "test"
 * 3. Non-test scripts exclusion - Scripts not matching pattern
 * 4. File not found errors
 * 5. Invalid JSON errors
 * 6. Missing scripts section
 * 7. Empty scripts section
 * 8. Edge cases
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
  readPackageJsonScripts,
  type PackageJsonScriptsResult,
} from '../../../src/utils/package-json-reader.js';

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
  } = {}
): string {
  const { scripts = {} } = options;

  const pkg = {
    name: 'test-package',
    version: '1.0.0',
    scripts: scripts || {},
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Creates a mock package.json object (parsed)
 *
 * @param options - Options for configuring the mock
 * @returns Mock package.json object
 */
function _createMockPackageJson(
  options: {
    scripts?: Record<string, string>;
  } = {}
): { scripts?: Record<string, string> } {
  const { scripts = {} } = options;

  return {
    scripts: scripts || {},
  };
}

/**
 * Creates a valid package.json with typical scripts
 *
 * @returns Package.json content with development, test, and build scripts
 */
function createTypicalPackageJson(): string {
  return createMockPackageJsonContent({
    scripts: {
      // Development scripts
      dev: 'tsx src/index.ts',
      'dev:watch': 'nodemon --exec tsx src/index.ts',
      'dev:debug': 'node --inspect -r tsx src/index.ts',

      // Build scripts
      build: 'tsc',
      'build:watch': 'tsc --watch',
      typecheck: 'tsc --noEmit',

      // Test scripts
      test: 'vitest',
      'test:run': 'vitest run',
      'test:watch': 'vitest watch',
      'test:coverage': 'vitest run --coverage',
      'test:bail': 'vitest run --bail=1',

      // Lint scripts
      lint: 'eslint . --ext .ts',
      'lint:fix': 'eslint . --ext .ts --fix',

      // Format scripts
      format: 'prettier --write "**/*.{ts,js,json,md}"',
      'format:check': 'prettier --check "**/*.{ts,js,json,md}"',
    },
  });
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('package-json-reader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default behavior
    mockReadFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('package.json')) {
        return createTypicalPackageJson();
      }
      throw new Error(`File not found: ${filePath}`);
    });
  });

  // ========================================================================
  // Happy path tests - Valid package.json with scripts
  // ========================================================================

  describe('Happy path - Valid package.json with scripts', () => {
    it('should return success: true for valid package.json', () => {
      const result = readPackageJsonScripts();

      expect(result.success).toBe(true);
    });

    it('should return all scripts from package.json', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(Object.keys(result.scripts).length).toBeGreaterThan(0);
      expect(result.scripts).toHaveProperty('test');
      expect(result.scripts).toHaveProperty('test:run');
      expect(result.scripts).toHaveProperty('test:watch');
      expect(result.scripts).toHaveProperty('test:coverage');
      expect(result.scripts).toHaveProperty('test:bail');
    });

    it('should return correct script commands', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.scripts['test']).toBe('vitest');
      expect(result.scripts['test:run']).toBe('vitest run');
      expect(result.scripts['test:watch']).toBe('vitest watch');
      expect(result.scripts['test:coverage']).toBe('vitest run --coverage');
      expect(result.scripts['test:bail']).toBe('vitest run --bail=1');
    });

    it('should include non-test scripts in scripts object', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts).toHaveProperty('lint');
      expect(result.scripts).toHaveProperty('format');
    });

    it('should return testScripts array with only test-related scripts', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toHaveLength(5);
      expect(result.testScripts).toContain('test');
      expect(result.testScripts).toContain('test:run');
      expect(result.testScripts).toContain('test:watch');
      expect(result.testScripts).toContain('test:coverage');
      expect(result.testScripts).toContain('test:bail');
    });

    it('should not include non-test scripts in testScripts array', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).not.toContain('dev');
      expect(result.testScripts).not.toContain('build');
      expect(result.testScripts).not.toContain('lint');
      expect(result.testScripts).not.toContain('format');
    });

    it('should return success message with script counts', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.message).toContain('Successfully read');
      expect(result.message).toMatch(/\d+ script/);
      expect(result.message).toMatch(/\d+ test script/);
    });

    it('should return readonly scripts object', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      // readonly is a TypeScript compile-time property, not runtime
      // Verify structure is correct
      expect(result.scripts).toBeDefined();
      expect(typeof result.scripts).toBe('object');
      expect(Array.isArray(result.scripts)).toBe(false);
    });

    it('should return readonly testScripts array', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      // readonly is a TypeScript compile-time property, not runtime
      // Verify structure is correct
      expect(result.testScripts).toBeDefined();
      expect(Array.isArray(result.testScripts)).toBe(true);
      expect(typeof result.testScripts).toBe('object');
    });
  });

  // ========================================================================
  // Test script detection tests
  // ========================================================================

  describe('Test script detection', () => {
    it('should detect script named "test"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('test');
    });

    it('should detect script named "test:run"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            'test:run': 'vitest run',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('test:run');
    });

    it('should detect script named "test:watch"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            'test:watch': 'vitest watch',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('test:watch');
    });

    it('should detect script named "test:coverage"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            'test:coverage': 'vitest run --coverage',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('test:coverage');
    });

    it('should detect script named "test:bail"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            'test:bail': 'vitest run --bail=1',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('test:bail');
    });

    it('should NOT detect script named "unittest"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            unittest: 'vitest',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).not.toContain('unittest');
      expect(result.testScripts).toHaveLength(0);
    });

    it('should NOT detect script named "mytest"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            mytest: 'vitest',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).not.toContain('mytest');
      expect(result.testScripts).toHaveLength(0);
    });

    it('should detect script named "testing" (starts with "test")', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            testing: 'vitest',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('testing');
    });

    it('should NOT detect script named "my-test" (starts with "my")', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            'my-test': 'vitest',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).not.toContain('my-test');
    });

    it('should detect all test scripts in mixed scripts', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            build: 'tsc',
            'test:run': 'vitest run',
            lint: 'eslint',
            unittest: 'vitest', // Should NOT match
            'test:watch': 'vitest watch',
            format: 'prettier',
            mytest: 'jest', // Should NOT match
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toHaveLength(3);
      expect(result.testScripts).toContain('test');
      expect(result.testScripts).toContain('test:run');
      expect(result.testScripts).toContain('test:watch');
      expect(result.testScripts).not.toContain('unittest');
      expect(result.testScripts).not.toContain('mytest');
    });
  });

  // ========================================================================
  // Error handling tests - File not found
  // ========================================================================

  describe('Error handling - File not found', () => {
    it('should return success: false when file does not exist', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      expect(result.success).toBe(false);
    });

    it('should return empty scripts object when file not found', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      expect(Object.keys(result.scripts)).toHaveLength(0);
    });

    it('should return empty testScripts array when file not found', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      expect(result.testScripts).toEqual([]);
    });

    it('should return FILE_NOT_FOUND error code for ENOENT', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      if ('errorCode' in result) {
        expect(result.errorCode).toBe('FILE_NOT_FOUND');
      } else {
        throw new Error('Expected errorCode in error result');
      }
    });

    it('should include file path in error message', () => {
      const err: NodeJS.ErrnoException = new Error('ENOENT');
      err.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      expect(result.message).toContain('package.json');
      expect(result.message).toContain('Error reading');
    });
  });

  // ========================================================================
  // Error handling tests - Invalid JSON
  // ========================================================================

  describe('Error handling - Invalid JSON', () => {
    it('should return success: false for invalid JSON', () => {
      mockReadFileSync.mockReturnValue('{"invalid": json}');

      const result = readPackageJsonScripts();

      expect(result.success).toBe(false);
    });

    it('should return empty scripts object for invalid JSON', () => {
      mockReadFileSync.mockReturnValue('{not valid json}');

      const result = readPackageJsonScripts();

      expect(Object.keys(result.scripts)).toHaveLength(0);
    });

    it('should return empty testScripts array for invalid JSON', () => {
      mockReadFileSync.mockReturnValue('{"scripts": "not an object"}');

      const result = readPackageJsonScripts();

      expect(result.testScripts).toEqual([]);
    });

    it('should return SYNTAX_ERROR error code for invalid JSON', () => {
      mockReadFileSync.mockReturnValue('invalid json');

      const result = readPackageJsonScripts();

      if ('errorCode' in result) {
        expect(result.errorCode).toBe('SYNTAX_ERROR');
      } else {
        throw new Error('Expected errorCode in error result');
      }
    });

    it('should include "Invalid JSON" in error message', () => {
      mockReadFileSync.mockReturnValue('not valid json');

      const result = readPackageJsonScripts();

      expect(result.message).toContain('Invalid JSON');
      expect(result.message).toContain('package.json');
    });
  });

  // ========================================================================
  // Error handling tests - Other read errors
  // ========================================================================

  describe('Error handling - Other read errors', () => {
    it('should return success: false for permission errors', () => {
      const err: NodeJS.ErrnoException = new Error('EACCES');
      err.code = 'EACCES';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      expect(result.success).toBe(false);
    });

    it('should return READ_ERROR error code for non-ENOENT errors', () => {
      const err: NodeJS.ErrnoException = new Error('EACCES');
      err.code = 'EACCES';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      if ('errorCode' in result) {
        expect(result.errorCode).toBe('READ_ERROR');
      } else {
        throw new Error('Expected errorCode in error result');
      }
    });

    it('should include error details in message', () => {
      const err: NodeJS.ErrnoException = new Error('EACCES: Permission denied');
      err.code = 'EACCES';
      mockReadFileSync.mockImplementation(() => {
        throw err;
      });

      const result = readPackageJsonScripts();

      expect(result.message).toContain('Error reading');
      expect(result.message).toContain('package.json');
    });
  });

  // ========================================================================
  // Edge case tests - Empty scripts section
  // ========================================================================

  describe('Edge cases - Empty scripts section', () => {
    it('should handle empty scripts object', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {},
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.success).toBe(true);
      expect(Object.keys(result.scripts)).toHaveLength(0);
      expect(result.testScripts).toHaveLength(0);
    });

    it('should handle missing scripts section', () => {
      const pkg = {
        name: 'test-package',
        version: '1.0.0',
        // No scripts section
      };
      mockReadFileSync.mockReturnValue(JSON.stringify(pkg, null, 2));

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.success).toBe(true);
      expect(Object.keys(result.scripts)).toHaveLength(0);
      expect(result.testScripts).toHaveLength(0);
    });

    it('should handle null scripts section', () => {
      const pkg = {
        name: 'test-package',
        version: '1.0.0',
        scripts: null,
      };
      mockReadFileSync.mockReturnValue(JSON.stringify(pkg, null, 2));

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.success).toBe(true);
      expect(Object.keys(result.scripts)).toHaveLength(0);
      expect(result.testScripts).toHaveLength(0);
    });

    it('should handle only test scripts', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            'test:run': 'vitest run',
            'test:watch': 'vitest watch',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toHaveLength(3);
      expect(result.testScripts).toContain('test');
      expect(result.testScripts).toContain('test:run');
      expect(result.testScripts).toContain('test:watch');
      expect(Object.keys(result.scripts)).toHaveLength(3);
    });

    it('should handle only non-test scripts', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            build: 'tsc',
            lint: 'eslint',
            format: 'prettier',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toHaveLength(0);
      expect(Object.keys(result.scripts)).toHaveLength(3);
    });

    it('should handle package.json with only name and version', () => {
      const pkg = {
        name: 'minimal-package',
        version: '1.0.0',
      };
      mockReadFileSync.mockReturnValue(JSON.stringify(pkg, null, 2));

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.success).toBe(true);
      expect(Object.keys(result.scripts)).toHaveLength(0);
      expect(result.testScripts).toHaveLength(0);
      expect(result.message).toContain('0 script');
    });
  });

  // ========================================================================
  // Edge case tests - Special script names
  // ========================================================================

  describe('Edge cases - Special script names', () => {
    it('should handle test script with numeric suffix', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test1: 'vitest',
            test2: 'jest',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('test1');
      expect(result.testScripts).toContain('test2');
    });

    it('should handle test script with underscore', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test_all: 'vitest run --coverage',
            test_unit: 'vitest run unit',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('test_all');
      expect(result.testScripts).toContain('test_unit');
    });

    it('should handle script names in camelCase starting with "test"', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            testRunner: 'vitest',
            testCase: 'vitest run',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toContain('testRunner');
      expect(result.testScripts).toContain('testCase');
    });

    it('should NOT detect scripts with "test" in middle', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            my_test_script: 'vitest',
            unittest_integration: 'jest',
            runtest: 'vitest run',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toHaveLength(0);
    });

    it('should handle script with colon patterns', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            'test:unit': 'vitest run unit',
            'test:integration': 'vitest run integration',
            'test:e2e': 'vitest run e2e',
            'test:unit:watch': 'vitest watch unit',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.testScripts).toHaveLength(5);
      expect(result.testScripts).toContain('test');
      expect(result.testScripts).toContain('test:unit');
      expect(result.testScripts).toContain('test:integration');
      expect(result.testScripts).toContain('test:e2e');
      expect(result.testScripts).toContain('test:unit:watch');
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('Result structure validation', () => {
    it('should have success field of type boolean', () => {
      const result = readPackageJsonScripts();

      expect(typeof result.success).toBe('boolean');
    });

    it('should have scripts field of type object', () => {
      const result = readPackageJsonScripts();

      expect(typeof result.scripts).toBe('object');
      expect(Array.isArray(result.scripts)).toBe(false);
    });

    it('should have testScripts field of type array', () => {
      const result = readPackageJsonScripts();

      expect(Array.isArray(result.testScripts)).toBe(true);
    });

    it('should have message field of type string', () => {
      const result = readPackageJsonScripts();

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should have optional errorCode field on error results', () => {
      mockReadFileSync.mockReturnValue('invalid json');
      const result = readPackageJsonScripts();

      if (!result.success) {
        expect(result.errorCode).toBeDefined();
        expect(typeof result.errorCode).toBe('string');
      }
    });

    it('should have readonly properties on success result', () => {
      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      // TypeScript should enforce readonly, but we can check the structure
      expect(result.scripts).toBeDefined();
      expect(result.testScripts).toBeDefined();
    });
  });

  // ========================================================================
  // Script value tests
  // ========================================================================

  describe('Script command values', () => {
    it('should preserve exact command strings for scripts', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest --reporter=verbose',
            'test:run': 'NODE_OPTIONS="--max-old-space-size=4096" vitest run',
            'test:coverage': 'vitest run --coverage --reporter=json',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.scripts['test']).toBe('vitest --reporter=verbose');
      expect(result.scripts['test:run']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run'
      );
      expect(result.scripts['test:coverage']).toBe(
        'vitest run --coverage --reporter=json'
      );
    });

    it('should handle empty command strings', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: '',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.scripts['test']).toBe('');
      expect(result.testScripts).toContain('test');
    });

    it('should handle commands with special characters', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            'test:special':
              'NODE_OPTIONS="--max-old-space-size=4096" vitest run --coverage --reporter="html" > /dev/null 2>&1',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.scripts['test:special']).toContain('NODE_OPTIONS');
      expect(result.testScripts).toContain('test:special');
    });
  });

  // ========================================================================
  // Integration-like tests with realistic data
  // ========================================================================

  describe('Realistic package.json scenarios', () => {
    it('should handle actual project package.json structure', () => {
      // Simulate reading actual package.json with realistic structure
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
              validate:
                'npm run lint && npm run format:check && npm run typecheck',
            },
          },
          null,
          2
        )
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.success).toBe(true);
      expect(result.testScripts).toHaveLength(5);
      expect(result.testScripts).toEqual([
        'test',
        'test:run',
        'test:watch',
        'test:coverage',
        'test:bail',
      ]);
    });

    it('should handle package.json without NODE_OPTIONS (current state)', () => {
      // This is the actual state before P2.M1.T1.S2 adds NODE_OPTIONS
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            'test:run': 'vitest run',
            'test:watch': 'vitest watch',
            'test:coverage': 'vitest run --coverage',
            'test:bail': 'vitest run --bail=1',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      // Verify that test scripts DON'T have NODE_OPTIONS yet
      expect(result.scripts['test']).toBe('vitest');
      expect(result.scripts['test:run']).toBe('vitest run');
      expect(result.scripts['test']).not.toContain('NODE_OPTIONS');
    });
  });

  // ========================================================================
  // Message generation tests
  // ========================================================================

  describe('Success message generation', () => {
    it('should use singular "script" when only one script', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.message).toContain('1 script');
      expect(result.message).toContain('1 test script');
    });

    it('should use plural "scripts" when multiple scripts', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            build: 'tsc',
            lint: 'eslint',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.message).toContain('3 scripts');
    });

    it('should use singular "test script" when only one test script', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            build: 'tsc',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.message).toContain('1 test script');
    });

    it('should use plural "test scripts" when multiple test scripts', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {
            test: 'vitest',
            'test:run': 'vitest run',
            'test:watch': 'vitest watch',
          },
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.message).toContain('3 test scripts');
    });

    it('should handle zero scripts gracefully', () => {
      mockReadFileSync.mockReturnValue(
        createMockPackageJsonContent({
          scripts: {},
        })
      );

      const result = readPackageJsonScripts() as PackageJsonScriptsResult;

      expect(result.message).toContain('0 scripts');
      expect(result.message).toContain('0 test scripts');
    });
  });
});
