/**
 * Unit tests for Package.json Updater
 *
 * @remarks
 * Tests validate package.json update functionality including:
 * 1. Happy path - Valid input with test scripts
 * 2. NODE_OPTIONS prepending - Correct prefix added to scripts
 * 3. Duplicate detection - Scripts with existing NODE_OPTIONS
 * 4. Error handling - Invalid input, write failures
 * 5. Edge cases - Empty test scripts, missing scripts, complex commands
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
const mockWriteFileSync = vi.fn();
vi.mock('node:fs', () => ({
  readFileSync: vi.fn((...args: unknown[]) => mockReadFileSync(...args)),
  writeFileSync: vi.fn((...args: unknown[]) => mockWriteFileSync(...args)),
  unlinkSync: vi.fn(),
}));

// Import module under test
import {
  updateTestScriptsWithMemoryLimit,
  type PackageJsonUpdateResult,
} from '../../../src/utils/package-json-updater.js';
import type {
  PackageJsonScriptsResult,
  PackageJsonScriptsReadResult,
} from '../../../src/utils/package-json-reader.js';

// =============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock PackageJsonScriptsResult input
 *
 * @param options - Options for configuring the mock
 * @returns Mock PackageJsonScriptsResult
 */
function createMockUpdateInput(options: {
  scripts?: Record<string, string>;
  testScripts?: string[];
}): PackageJsonScriptsResult {
  const { scripts = {}, testScripts = [] } = options;

  return {
    success: true,
    scripts,
    testScripts,
    message: 'Mock input',
  };
}

/**
 * Creates a typical package.json scripts object
 *
 * @returns Typical scripts with test and non-test scripts
 */
function createTypicalScripts(): Record<string, string> {
  return {
    // Non-test scripts
    dev: 'tsx src/index.ts',
    'dev:watch': 'nodemon --exec tsx src/index.ts',
    build: 'tsc',
    'build:watch': 'tsc --watch',
    typecheck: 'tsc --noEmit',
    lint: 'eslint . --ext .ts',
    'lint:fix': 'eslint . --ext .ts --fix',
    format: 'prettier --write "**/*.{ts,js,json,md}"',

    // Test scripts
    test: 'vitest',
    'test:run': 'vitest run',
    'test:watch': 'vitest watch',
    'test:coverage': 'vitest run --coverage',
    'test:bail': 'vitest run --bail=1',
  };
}

/**
 * Creates typical test scripts array
 *
 * @returns Array of test script names
 */
function createTypicalTestScripts(): string[] {
  return ['test', 'test:run', 'test:watch', 'test:coverage', 'test:bail'];
}

/**
 * Mock package.json content for readFileSync
 *
 * @param scripts - Scripts object to include in package.json
 * @returns JSON string of package.json
 */
function createMockPackageJsonContent(scripts: Record<string, string>): string {
  const pkg = {
    name: 'hacky-hack',
    version: '0.1.0',
    description: 'Test package',
    type: 'module',
    scripts,
  };
  return JSON.stringify(pkg, null, 2);
}

// =============================================================================
// TEST SETUP
// ============================================================================

describe('package-json-updater', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mocks to default behavior
    mockReadFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('package.json')) {
        return createMockPackageJsonContent(createTypicalScripts());
      }
      throw new Error(`File not found: ${filePath}`);
    });

    mockWriteFileSync.mockImplementation(() => {
      // Default: write succeeds
      return undefined;
    });
  });

  // ==========================================================================
  // Happy path tests - Valid input with test scripts
  // ==========================================================================

  describe('Happy path - Valid input with test scripts', () => {
    it('should return success: true for valid input', () => {
      const input = createMockUpdateInput({
        scripts: createTypicalScripts(),
        testScripts: createTypicalTestScripts(),
      });

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(result.success).toBe(true);
    });

    it('should return updated array with all test script names', () => {
      const input = createMockUpdateInput({
        scripts: createTypicalScripts(),
        testScripts: createTypicalTestScripts(),
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(5);
      expect(result.updated).toContain('test');
      expect(result.updated).toContain('test:run');
      expect(result.updated).toContain('test:watch');
      expect(result.updated).toContain('test:coverage');
      expect(result.updated).toContain('test:bail');
    });

    it('should prepend NODE_OPTIONS to each test script', () => {
      const input = createMockUpdateInput({
        scripts: createTypicalScripts(),
        testScripts: createTypicalTestScripts(),
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest'
      );
      expect(result.updatedScripts['test:run']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run'
      );
      expect(result.updatedScripts['test:watch']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest watch'
      );
      expect(result.updatedScripts['test:coverage']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run --coverage'
      );
      expect(result.updatedScripts['test:bail']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run --bail=1'
      );
    });

    it('should preserve non-test scripts unchanged', () => {
      const input = createMockUpdateInput({
        scripts: createTypicalScripts(),
        testScripts: createTypicalTestScripts(),
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['dev']).toBe('tsx src/index.ts');
      expect(result.updatedScripts['build']).toBe('tsc');
      expect(result.updatedScripts['lint']).toBe('eslint . --ext .ts');
      expect(result.updatedScripts['format']).toBe(
        'prettier --write "**/*.{ts,js,json,md}"'
      );
    });

    it('should return success message with count of updated scripts', () => {
      const input = createMockUpdateInput({
        scripts: createTypicalScripts(),
        testScripts: createTypicalTestScripts(),
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.message).toContain('Successfully updated');
      expect(result.message).toContain('5 test script');
      expect(result.message).toContain('4096MB');
    });

    it('should handle single test script', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(1);
      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest'
      );
    });

    it('should return readonly updated array', () => {
      const input = createMockUpdateInput({
        scripts: createTypicalScripts(),
        testScripts: createTypicalTestScripts(),
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      // readonly is a TypeScript compile-time property, not runtime
      // Verify structure is correct
      expect(Array.isArray(result.updated)).toBe(true);
      expect(typeof result.updated).toBe('object');
    });

    it('should return readonly updatedScripts object', () => {
      const input = createMockUpdateInput({
        scripts: createTypicalScripts(),
        testScripts: createTypicalTestScripts(),
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      // readonly is a TypeScript compile-time property, not runtime
      // Verify structure is correct
      expect(result.updatedScripts).toBeDefined();
      expect(typeof result.updatedScripts).toBe('object');
      expect(Array.isArray(result.updatedScripts)).toBe(false);
    });
  });

  // ==========================================================================
  // NODE_OPTIONS prepending tests
  // ==========================================================================

  describe('NODE_OPTIONS prepending', () => {
    it('should prepend NODE_OPTIONS with correct format', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest run' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toMatch(
        /^NODE_OPTIONS="--max-old-space-size=4096"/
      );
    });

    it('should use 4096MB memory limit', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toContain('4096');
    });

    it('should preserve script arguments after NODE_OPTIONS', () => {
      const input = createMockUpdateInput({
        scripts: {
          'test:coverage': 'vitest run --coverage --reporter=json',
        },
        testScripts: ['test:coverage'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test:coverage']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run --coverage --reporter=json'
      );
    });

    it('should preserve whitespace in script commands', () => {
      const input = createMockUpdateInput({
        scripts: { test: '  vitest run  ' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      // Should trim original command and add single space after NODE_OPTIONS
      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run'
      );
    });

    it('should handle empty command string', () => {
      const input = createMockUpdateInput({
        scripts: { test: '' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" '
      );
    });

    it('should handle script with pipe operator', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest | tap-summary' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest | tap-summary'
      );
    });

    it('should handle script with redirect operators', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest run > output.txt 2>&1' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run > output.txt 2>&1'
      );
    });
  });

  // ==========================================================================
  // Duplicate detection tests
  // ==========================================================================

  describe('Duplicate detection - Scripts with existing NODE_OPTIONS', () => {
    it('should skip scripts with existing NODE_OPTIONS when onExistingOptions is "skip"', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'NODE_OPTIONS="--max-old-space-size=2048" vitest',
          'test:run': 'vitest run',
        },
        testScripts: ['test', 'test:run'],
      });

      const result = updateTestScriptsWithMemoryLimit(input, {
        onExistingOptions: 'skip',
      }) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(1);
      expect(result.updated).toContain('test:run');
      expect(result.updated).not.toContain('test');
      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=2048" vitest'
      ); // Unchanged
    });

    it('should return error when onExistingOptions is "error" and NODE_OPTIONS exists', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'NODE_OPTIONS="--max-old-space-size=2048" vitest',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input, {
        onExistingOptions: 'error',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect('errorCode' in result && result.errorCode).toBe(
          'DUPLICATE_OPTIONS'
        );
        expect(result.message).toContain('already has NODE_OPTIONS');
      }
    });

    it('should replace existing NODE_OPTIONS when onExistingOptions is "replace"', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'NODE_OPTIONS="--max-old-space-size=2048" vitest',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input, {
        onExistingOptions: 'replace',
      }) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(1);
      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest'
      );
    });

    it('should detect NODE_OPTIONS case-insensitively', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'node_options="--max-old-space-size=2048" vitest',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input, {
        onExistingOptions: 'skip',
      }) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(0);
    });

    it('should default to "skip" behavior when onExistingOptions is not specified', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'NODE_OPTIONS="--max-old-space-size=2048" vitest',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(0);
    });

    it('should handle mixed scripts (some with NODE_OPTIONS, some without)', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'NODE_OPTIONS="--max-old-space-size=2048" vitest',
          'test:run': 'vitest run',
          'test:watch': 'NODE_OPTIONS="--max-old-space-size=2048" vitest watch',
          'test:coverage': 'vitest run --coverage',
        },
        testScripts: ['test', 'test:run', 'test:watch', 'test:coverage'],
      });

      const result = updateTestScriptsWithMemoryLimit(input, {
        onExistingOptions: 'skip',
      }) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(2);
      expect(result.updated).toContain('test:run');
      expect(result.updated).toContain('test:coverage');
      expect(result.updated).not.toContain('test');
      expect(result.updated).not.toContain('test:watch');
    });
  });

  // ==========================================================================
  // Error handling tests
  // ==========================================================================

  describe('Error handling - Invalid input', () => {
    it('should return success: false when input.success is false', () => {
      const input = {
        success: false,
        scripts: {},
        testScripts: [],
        message: 'Invalid input',
      } as unknown as PackageJsonScriptsReadResult;

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(result.success).toBe(false);
    });

    it('should return INVALID_INPUT error code for invalid input', () => {
      const input = {
        success: false,
        scripts: {},
        testScripts: [],
        message: 'Invalid input',
      } as unknown as PackageJsonScriptsReadResult;

      const result = updateTestScriptsWithMemoryLimit(input);

      if (!result.success) {
        expect('errorCode' in result && result.errorCode).toBe('INVALID_INPUT');
      }
    });

    it('should return empty updated array on error', () => {
      const input = {
        success: false,
        scripts: {},
        testScripts: [],
        message: 'Invalid input',
      } as unknown as PackageJsonScriptsReadResult;

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(result.updated).toEqual([]);
    });

    it('should return empty updatedScripts object on error', () => {
      const input = {
        success: false,
        scripts: {},
        testScripts: [],
        message: 'Invalid input',
      } as unknown as PackageJsonScriptsReadResult;

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(Object.keys(result.updatedScripts)).toHaveLength(0);
    });

    it('should include error message on failure', () => {
      const input = {
        success: false,
        scripts: {},
        testScripts: [],
        message: 'Invalid input',
      } as unknown as PackageJsonScriptsReadResult;

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(result.message).toContain('input.success must be true');
    });
  });

  // ==========================================================================
  // Edge case tests
  // ==========================================================================

  describe('Edge cases - Empty or missing data', () => {
    it('should handle empty testScripts array', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: [],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(0);
      expect(result.success).toBe(true);
    });

    it('should handle empty scripts object', () => {
      const input = createMockUpdateInput({
        scripts: {},
        testScripts: [],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(0);
      expect(Object.keys(result.updatedScripts)).toHaveLength(0);
    });

    it('should skip script names not found in scripts object', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test', 'missing-script'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(1);
      expect(result.updated).toContain('test');
      expect(result.updated).not.toContain('missing-script');
    });

    it('should handle only non-test scripts in scripts object', () => {
      const input = createMockUpdateInput({
        scripts: {
          build: 'tsc',
          lint: 'eslint',
        },
        testScripts: [],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(0);
      expect(result.updatedScripts['build']).toBe('tsc');
      expect(result.updatedScripts['lint']).toBe('eslint');
    });

    it('should handle test script with undefined command value', () => {
      const scripts: Record<string, string> = {};
      scripts['test'] = undefined as unknown as string;

      const input = createMockUpdateInput({
        scripts,
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      // Should skip undefined script commands
      expect(result.updated).toHaveLength(0);
    });

    it('should handle test script with null command value', () => {
      const scripts: Record<string, string> = {};
      scripts['test'] = null as unknown as string;

      const input = createMockUpdateInput({
        scripts,
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      // Should skip null script commands
      expect(result.updated).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Edge case tests - Special script names and commands
  // ==========================================================================

  describe('Edge cases - Special script names', () => {
    it('should handle test script with numeric suffix', () => {
      const input = createMockUpdateInput({
        scripts: {
          test1: 'vitest',
          test2: 'jest',
        },
        testScripts: ['test1', 'test2'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(2);
      expect(result.updatedScripts['test1']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest'
      );
      expect(result.updatedScripts['test2']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" jest'
      );
    });

    it('should handle test script with underscore', () => {
      const input = createMockUpdateInput({
        scripts: {
          test_all: 'vitest run --coverage',
          test_unit: 'vitest run unit',
        },
        testScripts: ['test_all', 'test_unit'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(2);
      expect(result.updatedScripts['test_all']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test_unit']).toContain('NODE_OPTIONS');
    });

    it('should handle script names in camelCase starting with "test"', () => {
      const input = createMockUpdateInput({
        scripts: {
          testRunner: 'vitest',
          testCase: 'vitest run',
        },
        testScripts: ['testRunner', 'testCase'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(2);
      expect(result.updatedScripts['testRunner']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['testCase']).toContain('NODE_OPTIONS');
    });

    it('should handle script with colon patterns', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest',
          'test:unit': 'vitest run unit',
          'test:integration': 'vitest run integration',
          'test:e2e': 'vitest run e2e',
          'test:unit:watch': 'vitest watch unit',
        },
        testScripts: [
          'test',
          'test:unit',
          'test:integration',
          'test:e2e',
          'test:unit:watch',
        ],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updated).toHaveLength(5);
      Object.values(result.updatedScripts).forEach(command => {
        expect(command).toContain('NODE_OPTIONS');
      });
    });
  });

  // ==========================================================================
  // Edge case tests - Complex command strings
  // ==========================================================================

  describe('Edge cases - Complex command strings', () => {
    it('should handle command with environment variable', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'NODE_ENV=test vitest run',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV=test vitest run'
      );
    });

    it('should handle command with multiple flags', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest run --coverage --reporter=json --reporter=html',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run --coverage --reporter=json --reporter=html'
      );
    });

    it('should handle command with nested quotes', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest run --reporter=\'{"level":"error"}\'',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test']).toContain('--reporter');
    });

    it('should handle very long command string', () => {
      const longArgs = '--flag1 value1 --flag2 value2 '.repeat(20);
      const input = createMockUpdateInput({
        scripts: {
          test: `vitest run ${longArgs}`,
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test']).toContain(longArgs.trim());
    });

    it('should handle command with newlines', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest run \\\n  --coverage',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test']).toContain('--coverage');
    });

    it('should handle command with tabs', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest run\t--coverage',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.updatedScripts['test']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test']).toContain('--coverage');
    });
  });

  // ==========================================================================
  // Result structure tests
  // ==========================================================================

  describe('Result structure validation', () => {
    it('should have success field of type boolean', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(typeof result.success).toBe('boolean');
    });

    it('should have updated field of type array', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(Array.isArray(result.updated)).toBe(true);
    });

    it('should have updatedScripts field of type object', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(typeof result.updatedScripts).toBe('object');
      expect(Array.isArray(result.updatedScripts)).toBe(false);
    });

    it('should have message field of type string', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input);

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should have optional errorCode field on error results', () => {
      const input = {
        success: false,
        scripts: {},
        testScripts: [],
        message: 'Invalid',
      } as unknown as PackageJsonScriptsReadResult;

      const result = updateTestScriptsWithMemoryLimit(input);

      if (!result.success) {
        expect('errorCode' in result).toBe(true);
        if ('errorCode' in result) {
          expect(typeof result.errorCode).toBe('string');
        }
      }
    });
  });

  // ==========================================================================
  // Integration-like tests with realistic data
  // ==========================================================================

  describe('Realistic package.json scenarios', () => {
    it('should handle actual project test scripts', () => {
      const input = createMockUpdateInput({
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
        testScripts: [
          'test',
          'test:run',
          'test:watch',
          'test:coverage',
          'test:bail',
        ],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.success).toBe(true);
      expect(result.updated).toHaveLength(5);

      // Verify all test scripts have NODE_OPTIONS
      expect(result.updatedScripts['test']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test:run']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test:watch']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test:coverage']).toContain('NODE_OPTIONS');
      expect(result.updatedScripts['test:bail']).toContain('NODE_OPTIONS');

      // Verify non-test scripts are unchanged
      expect(result.updatedScripts['dev']).toBe('tsx src/index.ts');
      expect(result.updatedScripts['build']).toBe('tsc');
      expect(result.updatedScripts['lint']).toBe('eslint . --ext .ts');
    });

    it('should handle package.json without NODE_OPTIONS (current state)', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest',
          'test:run': 'vitest run',
          'test:watch': 'vitest watch',
          'test:coverage': 'vitest run --coverage',
          'test:bail': 'vitest run --bail=1',
        },
        testScripts: [
          'test',
          'test:run',
          'test:watch',
          'test:coverage',
          'test:bail',
        ],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      // Verify all scripts now have NODE_OPTIONS
      Object.entries(result.updatedScripts)
        .filter(([key]) => result.updated.includes(key))
        .forEach(([, command]) => {
          expect(command).toContain('NODE_OPTIONS="--max-old-space-size=4096"');
        });
    });

    it('should produce expected output format for downstream S3', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest',
          'test:run': 'vitest run',
        },
        testScripts: ['test', 'test:run'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      // Expected format from external_deps.md lines 171-174
      expect(result.updatedScripts['test']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest'
      );
      expect(result.updatedScripts['test:run']).toBe(
        'NODE_OPTIONS="--max-old-space-size=4096" vitest run'
      );

      // S3 expects these exact fields
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('updatedScripts');
      expect(result).toHaveProperty('message');
    });
  });

  // ==========================================================================
  // Message generation tests
  // ==========================================================================

  describe('Success message generation', () => {
    it('should use singular "script" when only one script updated', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.message).toContain('1 test script');
    });

    it('should use plural "scripts" when multiple scripts updated', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'vitest',
          'test:run': 'vitest run',
          'test:watch': 'vitest watch',
        },
        testScripts: ['test', 'test:run', 'test:watch'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.message).toContain('3 test script');
    });

    it('should include memory limit value in message', () => {
      const input = createMockUpdateInput({
        scripts: { test: 'vitest' },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(
        input
      ) as PackageJsonUpdateResult;

      expect(result.message).toContain('4096MB');
    });

    it('should handle zero scripts updated', () => {
      const input = createMockUpdateInput({
        scripts: {
          test: 'NODE_OPTIONS="--max-old-space-size=2048" vitest',
        },
        testScripts: ['test'],
      });

      const result = updateTestScriptsWithMemoryLimit(input, {
        onExistingOptions: 'skip',
      }) as PackageJsonUpdateResult;

      expect(result.message).toContain('0 test script');
    });
  });
});
