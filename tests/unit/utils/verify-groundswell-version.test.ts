/**
 * Unit tests for Groundswell version compatibility validator
 *
 * @remarks
 * Tests verify version compatibility functionality including:
 * 1. Package.json reading from node_modules/groundswell
 * 2. Version extraction and semver-based comparison
 * 3. Node.js and TypeScript compatibility validation
 * 4. Dependency alignment checks (@anthropic-ai/sdk)
 * 5. Basic functionality tests (Workflow, Agent, Prompt)
 * 6. Report generation with recommendations
 * 7. S2 import test results integration
 * 8. Console output formatting with emoji indicators
 * 9. JSON report export functionality
 * 10. Error handling for missing/invalid installations
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpyInstance } from 'vitest';
import {
  verifyGroundswellVersion,
  VersionErrorCodes,
  type GroundswellCompatibilityReport,
  type VerifyGroundswellVersionOptions,
  type GroundswellImportTestResults,
} from '../../../src/utils/verify-groundswell-version.js';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock node:fs
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

// Mock node:path
vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/')),
  };
});

// Mock semver
vi.mock('semver', () => ({
  satisfies: vi.fn(() => true),
  gte: vi.fn(() => true),
  valid: vi.fn((version: string) => /^\d+\.\d+\.\d+/.test(version)),
}));

// Mock groundswell import
vi.mock('groundswell', () => ({
  Workflow: class Workflow {},
  Agent: class Agent {},
  Prompt: class Prompt {},
}));

// Import mocked modules
import { readFileSync } from 'node:fs';
import { satisfies, gte, valid } from 'semver';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Creates a valid Groundswell package.json object
 */
function createValidPackageJson(version: string = '0.0.3') {
  return {
    name: 'groundswell',
    version,
    dependencies: {
      '@anthropic-ai/sdk': '^0.71.1',
      'lru-cache': '^10.4.3',
      zod: '^3.23.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      tsx: '^4.21.0',
      typescript: '^5.2.0',
      vitest: '^1.0.0',
    },
    engines: {
      node: '>=18',
    },
  };
}

/**
 * Creates mock S2 import test results
 */
function createMockImportTestResults(
  overallSuccess: boolean = true
): GroundswellImportTestResults {
  return {
    overallSuccess,
    categories: {
      classes: [
        { name: 'Workflow', success: true },
        { name: 'Agent', success: true },
      ],
      decorators: [
        { name: '@Step', success: true },
        { name: '@Task', success: true },
      ],
      factories: [],
      utilities: [],
      types: [],
    },
    failingImports: overallSuccess ? [] : ['SomeImport'],
    typescriptCompilationSuccess: overallSuccess,
    linkValidationSuccess: overallSuccess,
  };
}

// =============================================================================
// TEST SETUP
// =============================================================================

describe('verifyGroundswellVersion', () => {
  let mockConsoleLog: SpyInstance;
  let mockConsoleWarn: SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers().setSystemTime(new Date('2026-01-15T00:00:00.000Z'));

    // Mock console.log to capture output
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Default mock for readFileSync - valid v0.0.3 package.json
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify(createValidPackageJson('0.0.3'))
    );

    // Default semver mocks
    vi.mocked(valid).mockReturnValue('0.0.3');
    vi.mocked(gte).mockReturnValue(true);
    vi.mocked(satisfies).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Successful version compatibility validation', () => {
    it('should return overallCompatible: true for v0.0.3', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );
      vi.mocked(gte).mockImplementation((version, range) => {
        if (range === '0.0.1') return true; // meets minimum
        if (range === '0.0.3') return true; // meets recommended
        return false;
      });

      const report = await verifyGroundswellVersion();

      expect(report.overallCompatible).toBe(true);
      expect(report.groundswellVersion.version).toBe('0.0.3');
      expect(report.groundswellVersion.meetsMinimum).toBe(true);
      expect(report.groundswellVersion.meetsRecommended).toBe(true);
    });

    it('should include all required fields in report', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report).toHaveProperty('overallCompatible');
      expect(report).toHaveProperty('groundswellVersion');
      expect(report).toHaveProperty('engines');
      expect(report).toHaveProperty('dependencies');
      expect(report).toHaveProperty('functionalityTest');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');
    });

    it('should pass Node.js compatibility check (>=18)', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.engines.node.compatible).toBe(true);
      expect(report.engines.node.actual).toBeDefined();
      expect(report.engines.node.required).toBe('>=18');
    });

    it('should pass TypeScript compatibility check (^5.2.0)', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.engines.typescript.compatible).toBe(true);
      expect(report.engines.typescript.actual).toBe('5.2.0');
      expect(report.engines.typescript.required).toBe('^5.2.0');
    });

    it('should pass dependency alignment check', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.dependencies).toHaveLength(1);
      expect(report.dependencies[0].dependency).toBe('@anthropic-ai/sdk');
      expect(report.dependencies[0].hasConflict).toBe(false);
      expect(report.dependencies[0].description).toContain(
        'does not directly depend'
      );
    });

    it('should pass basic functionality test', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.functionalityTest.success).toBe(true);
      expect(report.functionalityTest.workflow.success).toBe(true);
      expect(report.functionalityTest.agent.success).toBe(true);
      expect(report.functionalityTest.prompt.success).toBe(true);
    });

    it('should integrate S2 import test results when provided', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const importResults = createMockImportTestResults(true);
      const report = await verifyGroundswellVersion({
        importTestResults: importResults,
      });

      expect(report.importTestResults).toBeDefined();
      expect(report.importTestResults?.overallSuccess).toBe(true);
      expect(report.importTestResults?.failingImports).toEqual([]);
    });
  });

  // ========================================================================
  // Version comparison tests
  // ========================================================================

  describe('Version comparison logic', () => {
    it('should detect v0.0.3 as meeting recommended version', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );
      vi.mocked(gte).mockImplementation((version, range) => {
        return range === '0.0.1' || range === '0.0.3';
      });

      const report = await verifyGroundswellVersion();

      expect(report.groundswellVersion.meetsRecommended).toBe(true);
      expect(report.recommendations).toHaveLength(0);
    });

    it('should detect v0.0.1 as minimum but not recommended', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.1'))
      );
      vi.mocked(gte).mockImplementation((version, range) => {
        if (range === '0.0.1') return true; // meets minimum
        if (range === '0.0.3') return false; // below recommended
        return false;
      });

      const report = await verifyGroundswellVersion();

      expect(report.groundswellVersion.meetsMinimum).toBe(true);
      expect(report.groundswellVersion.meetsRecommended).toBe(false);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations[0]).toContain('0.0.3');
    });

    it('should detect v0.0.0 as below minimum', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.0'))
      );
      vi.mocked(gte).mockReturnValue(false); // Below all thresholds

      const report = await verifyGroundswellVersion();

      expect(report.groundswellVersion.meetsMinimum).toBe(false);
      expect(report.overallCompatible).toBe(false);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle invalid semver version', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('invalid'))
      );
      vi.mocked(valid).mockReturnValue(null);
      vi.mocked(gte).mockReturnValue(false); // gte will return false for invalid versions

      const report = await verifyGroundswellVersion();

      expect(report.groundswellVersion.version).toBe('invalid');
      expect(report.overallCompatible).toBe(false);
      expect(report.groundswellVersion.meetsMinimum).toBe(false);
      expect(report.groundswellVersion.meetsRecommended).toBe(false);
    });

    it('should handle missing version field', async () => {
      const packageJson = createValidPackageJson('0.0.3');
      // @ts-expect-error - Testing missing version field
      delete packageJson.version;
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(packageJson));
      vi.mocked(valid).mockReturnValue(null);

      const report = await verifyGroundswellVersion();

      expect(report.groundswellVersion.version).toBe('unknown');
      expect(report.overallCompatible).toBe(false);
    });
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  describe('Error handling', () => {
    it('should handle missing Groundswell package.json', async () => {
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      vi.mocked(readFileSync).mockImplementation(() => {
        throw enoentError;
      });

      const report = await verifyGroundswellVersion();

      expect(report.overallCompatible).toBe(false);
      expect(report.groundswellVersion.version).toBe('unknown');
      expect(report.engines.node.error).toContain('not found');
      expect(report.recommendations[0]).toContain('npm link');
    });

    it('should handle invalid JSON in package.json', async () => {
      vi.mocked(readFileSync).mockReturnValue('{ invalid json }');

      const report = await verifyGroundswellVersion();

      expect(report.overallCompatible).toBe(false);
      expect(report.engines.node.error).toContain('Invalid JSON');
    });

    it('should handle file read errors', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const report = await verifyGroundswellVersion();

      expect(report.overallCompatible).toBe(false);
      expect(report.engines.node.error).toBeDefined();
    });
  });

  // ========================================================================
  // Engine compatibility tests
  // ========================================================================

  describe('Engine compatibility validation', () => {
    it('should validate Node.js version correctly', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );
      vi.mocked(satisfies).mockImplementation((version, range) => {
        if (range === '>=18') return true; // Node.js check
        return true;
      });

      const report = await verifyGroundswellVersion();

      expect(report.engines.node.compatible).toBe(true);
      expect(report.engines.node.requirement).toBe('node');
    });

    it('should detect Node.js incompatibility', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );
      vi.mocked(satisfies).mockImplementation((version, range) => {
        if (range === '>=18') return false; // Node.js too old
        return true;
      });

      const report = await verifyGroundswellVersion();

      expect(report.engines.node.compatible).toBe(false);
      expect(report.engines.node.error).toBeDefined();
      expect(report.recommendations).toContain(
        'Upgrade Node.js to version 18 or higher'
      );
    });

    it('should validate TypeScript version correctly', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );
      vi.mocked(satisfies).mockImplementation((version, range) => {
        if (range === '^5.2.0') return true; // TypeScript check
        return true;
      });

      const report = await verifyGroundswellVersion();

      expect(report.engines.typescript.compatible).toBe(true);
      expect(report.engines.typescript.requirement).toBe('typescript');
    });

    it('should detect TypeScript incompatibility', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );
      vi.mocked(satisfies).mockImplementation((version, range) => {
        if (range === '^5.2.0') return false; // TypeScript too old
        return true;
      });

      const report = await verifyGroundswellVersion();

      expect(report.engines.typescript.compatible).toBe(false);
      expect(report.engines.typescript.error).toBeDefined();
      expect(report.recommendations).toContain(
        'Upgrade TypeScript to version 5.2.0 or higher'
      );
    });
  });

  // ========================================================================
  // Dependency alignment tests
  // ============================================================================

  describe('Dependency alignment validation', () => {
    it('should detect no conflict when project has no direct @anthropic-ai/sdk', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.dependencies).toHaveLength(1);
      expect(report.dependencies[0].dependency).toBe('@anthropic-ai/sdk');
      expect(report.dependencies[0].hasConflict).toBe(false);
      expect(report.dependencies[0].projectVersion).toContain('not installed');
    });

    it('should correctly report Groundswell SDK requirement', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.dependencies[0].groundswellRequirement).toBe('^0.71.1');
      expect(report.dependencies[0].description).toContain(
        "Groundswell's version"
      );
    });
  });

  // ========================================================================
  // Functionality test options
  // ========================================================================

  describe('Functionality test options', () => {
    it('should skip functionality tests when disabled', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion({
        runFunctionalityTests: false,
      });

      expect(report.functionalityTest.success).toBe(true);
      expect(report.functionalityTest.workflow.success).toBe(true);
      expect(report.functionalityTest.agent.success).toBe(true);
      expect(report.functionalityTest.prompt.success).toBe(true);
    });

    it('should run functionality tests by default', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      // Groundswell import is mocked, so functionality test should pass
      expect(report.functionalityTest.success).toBe(true);
    });
  });

  // ========================================================================
  // Console output tests
  // ========================================================================

  describe('Console output formatting', () => {
    it('should print console report with emoji indicators', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      await verifyGroundswellVersion();

      expect(mockConsoleLog).toHaveBeenCalled();
      const output = vi.mocked(console.log).mock.calls.join('\n');

      // Check for emoji indicators
      expect(output).toContain('✅');
      expect(output).toContain('📦');
      expect(output).toContain('⚙️');
      expect(output).toContain('📋');
      expect(output).toContain('🧪');
    });

    it('should include version information in console output', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      await verifyGroundswellVersion();

      const output = vi.mocked(console.log).mock.calls.join('\n');

      expect(output).toContain('0.0.3');
      expect(output).toContain('Minimum Supported');
      expect(output).toContain('Recommended');
    });

    it('should include overall status in console output', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      await verifyGroundswellVersion();

      const output = vi.mocked(console.log).mock.calls.join('\n');

      expect(output).toContain('Overall Status');
      expect(output).toContain('COMPATIBLE');
    });

    it('should include recommendations when incompatible', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.1'))
      );
      vi.mocked(gte).mockImplementation((version, range) => {
        if (range === '0.0.1') return true; // meets minimum
        if (range === '0.0.3') return false; // below recommended
        return false;
      });

      await verifyGroundswellVersion();

      const output = vi.mocked(console.log).mock.calls.join('\n');

      expect(output).toContain('💡');
      expect(output).toContain('Recommendations');
    });

    it('should show S2 import test results when provided', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const importResults = createMockImportTestResults(true);
      await verifyGroundswellVersion({ importTestResults: importResults });

      const output = vi.mocked(console.log).mock.calls.join('\n');

      expect(output).toContain('📥');
      expect(output).toContain('Import Test Results');
    });
  });

  // ========================================================================
  // JSON export tests
  // ========================================================================

  describe('JSON report export', () => {
    it('should export JSON report when enabled', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const reportPath = '/tmp/test-compatibility-report.json';
      const report = await verifyGroundswellVersion({
        outputJsonReport: true,
        reportPath,
      });

      // Mock writeFileSync happens via dynamic import in the function
      // We can't easily test the file write, but we can verify the report structure
      expect(report.overallCompatible).toBeDefined();
      expect(report.groundswellVersion).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });

    it('should handle write errors gracefully', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      // Mock the writeFileSync function from the dynamic import
      // We can't easily mock dynamic imports, so we just verify the function completes
      const report = await verifyGroundswellVersion({
        outputJsonReport: true,
      });

      // Should still complete successfully
      expect(report.overallCompatible).toBeDefined();
      // Note: We can't easily test the write error scenario due to dynamic imports
    });
  });

  // ========================================================================
  // S2 integration tests
  // ========================================================================

  describe('S2 import test results integration', () => {
    it('should include S2 results in report when provided', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const importResults = createMockImportTestResults(true);
      const report = await verifyGroundswellVersion({
        importTestResults: importResults,
      });

      expect(report.importTestResults).toBeDefined();
      expect(report.importTestResults?.overallSuccess).toBe(true);
      expect(report.importTestResults?.failingImports).toEqual([]);
    });

    it('should show failing imports from S2', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const importResults = createMockImportTestResults(false);
      importResults.failingImports = ['BrokenImport', 'AnotherBrokenImport'];

      const report = await verifyGroundswellVersion({
        importTestResults: importResults,
      });

      expect(report.importTestResults?.failingImports).toContain(
        'BrokenImport'
      );
      expect(report.importTestResults?.failingImports).toContain(
        'AnotherBrokenImport'
      );
    });

    it('should add recommendation when S2 fails', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const importResults = createMockImportTestResults(false);
      const report = await verifyGroundswellVersion({
        importTestResults: importResults,
      });

      expect(report.recommendations).toContain(
        'Resolve import test failures from P1.M1.T1.S2'
      );
    });

    it('should handle missing S2 results gracefully', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.importTestResults).toBeUndefined();
    });
  });

  // ========================================================================
  // Timestamp tests
  // ========================================================================

  describe('Timestamp handling', () => {
    it('should include ISO 8601 timestamp in report', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      expect(report.timestamp).toBeDefined();
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(report.timestamp).toContain('2026-01-15');
    });
  });

  // ========================================================================
  // Version error codes tests
  // ========================================================================

  describe('VersionErrorCodes', () => {
    it('should define all error codes', () => {
      expect(VersionErrorCodes.GROUNDSWELL_NOT_FOUND).toBe(
        'GROUNDSWELL_NOT_FOUND'
      );
      expect(VersionErrorCodes.GROUNDSWELL_PACKAGE_INVALID).toBe(
        'GROUNDSWELL_PACKAGE_INVALID'
      );
      expect(VersionErrorCodes.VERSION_MISSING).toBe('VERSION_MISSING');
      expect(VersionErrorCodes.VERSION_INVALID).toBe('VERSION_INVALID');
      expect(VersionErrorCodes.NODE_INCOMPATIBLE).toBe('NODE_INCOMPATIBLE');
      expect(VersionErrorCodes.TYPESCRIPT_INCOMPATIBLE).toBe(
        'TYPESCRIPT_INCOMPATIBLE'
      );
      expect(VersionErrorCodes.DEPENDENCY_CONFLICT).toBe('DEPENDENCY_CONFLICT');
      expect(VersionErrorCodes.FUNCTIONALITY_TEST_FAILED).toBe(
        'FUNCTIONALITY_TEST_FAILED'
      );
    });
  });

  // ========================================================================
  // Edge case tests
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle pre-release versions', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3-alpha.1'))
      );
      vi.mocked(valid).mockReturnValue('0.0.3-alpha.1');
      vi.mocked(gte).mockReturnValue(true);

      const report = await verifyGroundswellVersion();

      expect(report.groundswellVersion.version).toBe('0.0.3-alpha.1');
      expect(report.overallCompatible).toBe(true);
    });

    it('should handle build metadata in version', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3+build.123'))
      );
      vi.mocked(valid).mockReturnValue('0.0.3+build.123');
      vi.mocked(gte).mockReturnValue(true);

      const report = await verifyGroundswellVersion();

      expect(report.groundswellVersion.version).toBe('0.0.3+build.123');
      expect(report.overallCompatible).toBe(true);
    });

    it('should handle empty package.json dependencies', async () => {
      const packageJson = createValidPackageJson('0.0.3');
      packageJson.dependencies = {} as any;
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(packageJson));

      const report = await verifyGroundswellVersion();

      expect(report.dependencies).toHaveLength(1);
      expect(report.dependencies[0].groundswellRequirement).toBe(
        'not specified'
      );
    });
  });

  // ========================================================================
  // Report structure tests
  // ========================================================================

  describe('Report structure validation', () => {
    it('should have correct structure for successful report', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const report = await verifyGroundswellVersion();

      // Verify groundswellVersion structure
      expect(report.groundswellVersion).toMatchObject({
        version: expect.any(String),
        minimumRecommended: '0.0.3',
        minimumSupported: '0.0.1',
        meetsMinimum: expect.any(Boolean),
        meetsRecommended: expect.any(Boolean),
      });

      // Verify engines structure
      expect(report.engines).toMatchObject({
        node: {
          requirement: 'node',
          required: '>=18',
          actual: expect.any(String),
          compatible: expect.any(Boolean),
        },
        typescript: {
          requirement: 'typescript',
          required: '^5.2.0',
          actual: '5.2.0',
          compatible: expect.any(Boolean),
        },
      });

      // Verify functionalityTest structure
      expect(report.functionalityTest).toMatchObject({
        success: expect.any(Boolean),
        workflow: {
          success: expect.any(Boolean),
        },
        agent: {
          success: expect.any(Boolean),
        },
        prompt: {
          success: expect.any(Boolean),
        },
      });
    });

    it('should have correct structure for error report', async () => {
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      vi.mocked(readFileSync).mockImplementation(() => {
        throw enoentError;
      });

      const report = await verifyGroundswellVersion();

      expect(report.overallCompatible).toBe(false);
      expect(report.groundswellVersion.version).toBe('unknown');
      expect(report.engines.node.error).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Integration test
  // ========================================================================

  describe('Full integration test', () => {
    it('should complete full validation flow with all components', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify(createValidPackageJson('0.0.3'))
      );

      const importResults = createMockImportTestResults(true);
      const report = await verifyGroundswellVersion({
        importTestResults: importResults,
        runFunctionalityTests: true,
      });

      // Verify all components are present
      expect(report.overallCompatible).toBe(true);
      expect(report.groundswellVersion.meetsRecommended).toBe(true);
      expect(report.engines.node.compatible).toBe(true);
      expect(report.engines.typescript.compatible).toBe(true);
      expect(report.dependencies.every(d => !d.hasConflict)).toBe(true);
      expect(report.functionalityTest.success).toBe(true);
      expect(report.importTestResults?.overallSuccess).toBe(true);
      expect(report.recommendations).toHaveLength(0);

      // Verify console output
      expect(mockConsoleLog).toHaveBeenCalled();
      const output = vi.mocked(console.log).mock.calls.join('\n');
      expect(output).toContain('✅ COMPATIBLE');
    });
  });
});
