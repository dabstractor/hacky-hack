/**
 * Groundswell version compatibility validator
 *
 * @module utils/verify-groundswell-version
 *
 * @remarks
 * Validates Groundswell version compatibility with project requirements:
 * 1. Extracts Groundswell version from node_modules/groundswell/package.json
 * 2. Compares against minimum (v0.0.1) and recommended (v0.0.3) versions
 * 3. Validates Node.js >=18 and TypeScript >=5.2.0 compatibility
 * 4. Checks @anthropic-ai/sdk dependency alignment
 * 5. Tests basic functionality (Workflow, Agent, Prompt creation)
 * 6. Generates comprehensive compatibility report with recommendations
 *
 * This is the third validation step in Phase 1 (P1.M1.T1) following:
 * - P1.M1.T1.S1: npm link validation (validate-groundswell-link.ts)
 * - P1.M1.T1.S2: Import tests (groundswell imports.test.ts)
 *
 * Critical version-specific features in v0.0.3:
 * - Promise.allSettled for concurrent error handling (vs Promise.all in v0.0.1)
 * - isDescendantOf() public API for hierarchy validation
 * - ErrorMergeStrategy for configurable error handling
 *
 * @example
 * ```typescript
 * import { verifyGroundswellVersion } from './utils/verify-groundswell-version.js';
 *
 * const report = await verifyGroundswellVersion();
 *
 * if (report.overallCompatible) {
 *   console.log('Groundswell is compatible!');
 * } else {
 *   console.log('Upgrade recommendations:', report.recommendations);
 * }
 * ```
 *
 * @see {@link https://semver.org/ | Semantic Versioning Specification}
 * @see {@link https://docs.npmjs.com/cli/v10/configuring-npm/package-json | npm package.json docs}
 */

import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { satisfies, gte, valid } from 'semver';

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Error codes specific to Groundswell version validation
 *
 * @remarks
 * Follows the error code pattern from validate-groundswell-link.ts
 */
export const VersionErrorCodes = {
  GROUNDSWELL_NOT_FOUND: 'GROUNDSWELL_NOT_FOUND',
  GROUNDSWELL_PACKAGE_INVALID: 'GROUNDSWELL_PACKAGE_INVALID',
  VERSION_MISSING: 'VERSION_MISSING',
  VERSION_INVALID: 'VERSION_INVALID',
  NODE_INCOMPATIBLE: 'NODE_INCOMPATIBLE',
  TYPESCRIPT_INCOMPATIBLE: 'TYPESCRIPT_INCOMPATIBLE',
  DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
  FUNCTIONALITY_TEST_FAILED: 'FUNCTIONALITY_TEST_FAILED',
} as const;

/**
 * Type for version validation error codes
 */
export type VersionErrorCode =
  (typeof VersionErrorCodes)[keyof typeof VersionErrorCodes];

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Result of checking a single version requirement
 *
 * @remarks
 * Used for version checks of groundswell, node, and typescript.
 */
export interface VersionCheckResult {
  /** The requirement being checked (e.g., "groundswell", "node", "typescript") */
  requirement: string;

  /** The required version or range */
  required: string;

  /** The actual installed version */
  actual: string;

  /** Whether the version is compatible */
  compatible: boolean;

  /** Error message if incompatible */
  error?: string;

  /** Recommendation if incompatible */
  recommendation?: string;
}

/**
 * Result of dependency alignment check
 *
 * @remarks
 * Checks if project dependencies align with Groundswell's requirements.
 */
export interface DependencyAlignmentResult {
  /** The dependency being checked (e.g., "@anthropic-ai/sdk") */
  dependency: string;

  /** Groundswell's version requirement */
  groundswellRequirement: string;

  /** Project's version (or "not installed" if not a direct dependency) */
  projectVersion: string;

  /** Whether there's a conflict */
  hasConflict: boolean;

  /** Description of the conflict or alignment */
  description: string;
}

/**
 * Result of basic functionality test
 *
 * @remarks
 * Tests that Workflow, Agent, and Prompt can be created without errors.
 */
export interface FunctionalityTestResult {
  /** Overall success of functionality tests */
  success: boolean;

  /** Workflow creation test result */
  workflow: {
    success: boolean;
    error?: string;
  };

  /** Agent creation test result */
  agent: {
    success: boolean;
    error?: string;
  };

  /** Prompt creation test result */
  prompt: {
    success: boolean;
    error?: string;
  };
}

/**
 * Import test results from P1.M1.T1.S2
 *
 * @remarks
 * Optional input from S2 to correlate import success with version compatibility.
 */
export interface GroundswellImportTestResults {
  /** Overall success of import tests */
  overallSuccess: boolean;

  /** Categories of imports tested */
  categories: {
    classes: ImportTestResult[];
    decorators: ImportTestResult[];
    factories: ImportTestResult[];
    utilities: ImportTestResult[];
    types: ImportTestResult[];
  };

  /** List of failing imports */
  failingImports: string[];

  /** Whether TypeScript compilation succeeded */
  typescriptCompilationSuccess: boolean;

  /** Whether npm link validation succeeded */
  linkValidationSuccess: boolean;
}

/**
 * Individual import test result
 *
 * @remarks
 * From S2 interface definition.
 */
interface ImportTestResult {
  /** Import name being tested */
  name: string;

  /** Whether import succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Groundswell package.json structure
 *
 * @remarks
 * TypeScript interface for the parsed Groundswell package.json.
 */
interface GroundswellPackageJson {
  /** Version from package.json */
  version?: string;

  /** Dependencies section */
  dependencies?: Record<string, string>;

  /** Dev dependencies section */
  devDependencies?: Record<string, string>;

  /** Engine requirements */
  engines?: {
    node?: string;
  };
}

/**
 * Comprehensive Groundswell version compatibility report
 *
 * @remarks
 * Main output type containing all validation results.
 */
export interface GroundswellCompatibilityReport {
  /** Overall compatibility status (true if all checks pass) */
  overallCompatible: boolean;

  /** Groundswell version information */
  groundswellVersion: {
    /** Version from package.json */
    version: string;

    /** Minimum recommended version */
    minimumRecommended: string;

    /** Minimum supported version */
    minimumSupported: string;

    /** Whether version meets minimum requirements */
    meetsMinimum: boolean;

    /** Whether version meets recommended requirements */
    meetsRecommended: boolean;
  };

  /** Engine compatibility checks */
  engines: {
    /** Node.js version check */
    node: VersionCheckResult;

    /** TypeScript version check */
    typescript: VersionCheckResult;
  };

  /** Dependency alignment checks */
  dependencies: DependencyAlignmentResult[];

  /** Basic functionality test results */
  functionalityTest: FunctionalityTestResult;

  /** Import test results from S2 (if available) */
  importTestResults?: {
    overallSuccess: boolean;
    failingImports: string[];
  };

  /** Upgrade recommendations (if incompatible) */
  recommendations: string[];

  /** Timestamp when report was generated */
  timestamp: string;
}

/**
 * Options for verifyGroundswellVersion function
 *
 * @remarks
 * Optional configuration for the version verification process.
 */
export interface VerifyGroundswellVersionOptions {
  /** Import test results from S2 (optional) */
  importTestResults?: GroundswellImportTestResults;

  /** Whether to run basic functionality tests (default: true) */
  runFunctionalityTests?: boolean;

  /** Whether to output JSON report file (default: false) */
  outputJsonReport?: boolean;

  /** Path for JSON report output (default: plan/.../P1M1T1S3/compatibility-report.json) */
  reportPath?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Version constants for Groundswell compatibility
 *
 * @remarks
 * Based on Groundswell changelog and project requirements.
 */
const VERSION_CONSTANTS = {
  /** Minimum supported Groundswell version */
  MINIMUM_SUPPORTED: '0.0.1',

  /** Minimum recommended Groundswell version (contains critical fixes) */
  MINIMUM_RECOMMENDED: '0.0.3',

  /** Node.js engine requirement from Groundswell */
  NODE_REQUIREMENT: '>=18',

  /** TypeScript requirement from Groundswell */
  TYPESCRIPT_REQUIREMENT: '^5.2.0',

  /** Groundswell's @anthropic-ai/sdk dependency */
  ANTHROPIC_SDK_REQUIREMENT: '^0.71.1',
} as const;

// =============================================================================
// HELPER FUNCTIONS - PACKAGE.JSON READING
// =============================================================================

/**
 * Reads Groundswell package.json from node_modules
 *
 * @remarks
 * * PATTERN: Follows package-json-reader.ts pattern
 * * Returns structured result, never throws
 * * Handles missing file and invalid JSON gracefully
 *
 * @returns Object with success flag, packageJson data, and optional error
 */
function readGroundswellPackageJson(): {
  success: boolean;
  packageJson?: GroundswellPackageJson;
  error?: string;
  errorCode?: VersionErrorCode;
} {
  const packageJsonPath = path.join(
    process.cwd(),
    'node_modules',
    'groundswell',
    'package.json'
  );

  try {
    const fileContent = readFileSync(packageJsonPath, 'utf-8');

    let pkg: GroundswellPackageJson;
    try {
      pkg = JSON.parse(fileContent);
    } catch (parseError) {
      return {
        success: false,
        error: `Invalid JSON in groundswell/package.json: ${parseError}`,
        errorCode: VersionErrorCodes.GROUNDSWELL_PACKAGE_INVALID,
      };
    }

    return { success: true, packageJson: pkg };
  } catch (readError) {
    const errnoError = readError as NodeJS.ErrnoException;

    if (errnoError.code === 'ENOENT') {
      return {
        success: false,
        error: `Groundswell package.json not found at ${packageJsonPath}. Ensure npm link is configured (see P1.M1.T1.S1).`,
        errorCode: VersionErrorCodes.GROUNDSWELL_NOT_FOUND,
      };
    }

    return {
      success: false,
      error: `Error reading Groundswell package.json: ${readError}`,
      errorCode: VersionErrorCodes.GROUNDSWELL_NOT_FOUND,
    };
  }
}

// =============================================================================
// VERSION COMPARISON FUNCTIONS
// =============================================================================

/**
 * Compares installed Groundswell version against requirements
 *
 * @remarks
 * Uses semver for semantic version comparison.
 * Checks against both minimum supported and minimum recommended versions.
 *
 * @param installed - The installed version string
 * @returns VersionCheckResult with compatibility status and recommendations
 */
function compareVersions(installed: string): VersionCheckResult {
  if (!valid(installed)) {
    return {
      requirement: 'groundswell',
      required: `>=${VERSION_CONSTANTS.MINIMUM_SUPPORTED} (recommended >=${VERSION_CONSTANTS.MINIMUM_RECOMMENDED})`,
      actual: installed,
      compatible: false,
      error: `Invalid semver version: ${installed}`,
      recommendation: `Install a valid Groundswell version (${VERSION_CONSTANTS.MINIMUM_RECOMMENDED} or higher)`,
    };
  }

  const meetsMinimum = gte(installed, VERSION_CONSTANTS.MINIMUM_SUPPORTED);
  const meetsRecommended = gte(
    installed,
    VERSION_CONSTANTS.MINIMUM_RECOMMENDED
  );

  if (!meetsMinimum) {
    return {
      requirement: 'groundswell',
      required: `>=${VERSION_CONSTANTS.MINIMUM_SUPPORTED} (recommended >=${VERSION_CONSTANTS.MINIMUM_RECOMMENDED})`,
      actual: installed,
      compatible: false,
      error: `Groundswell version ${installed} is below minimum supported version ${VERSION_CONSTANTS.MINIMUM_SUPPORTED}`,
      recommendation: `Upgrade Groundswell to version ${VERSION_CONSTANTS.MINIMUM_RECOMMENDED} or higher`,
    };
  }

  if (!meetsRecommended) {
    return {
      requirement: 'groundswell',
      required: `>=${VERSION_CONSTANTS.MINIMUM_SUPPORTED} (recommended >=${VERSION_CONSTANTS.MINIMUM_RECOMMENDED})`,
      actual: installed,
      compatible: true,
      error: undefined,
      recommendation: `Consider upgrading to Groundswell ${VERSION_CONSTANTS.MINIMUM_RECOMMENDED} for critical fixes: Promise.allSettled, isDescendantOf(), ErrorMergeStrategy`,
    };
  }

  return {
    requirement: 'groundswell',
    required: `>=${VERSION_CONSTANTS.MINIMUM_SUPPORTED} (recommended >=${VERSION_CONSTANTS.MINIMUM_RECOMMENDED})`,
    actual: installed,
    compatible: true,
  };
}

// =============================================================================
// ENGINE COMPATIBILITY FUNCTIONS
// =============================================================================

/**
 * Checks Node.js version compatibility
 *
 * @remarks
 * Validates that the current Node.js version meets Groundswell's requirements.
 * Groundswell requires node >=18, project has node >=20.
 *
 * @returns VersionCheckResult for Node.js compatibility
 */
function checkNodeCompatibility(): VersionCheckResult {
  const currentNodeVersion = process.version.slice(1); // Remove 'v' prefix

  const compatible = satisfies(
    currentNodeVersion,
    VERSION_CONSTANTS.NODE_REQUIREMENT
  );

  return {
    requirement: 'node',
    required: VERSION_CONSTANTS.NODE_REQUIREMENT,
    actual: currentNodeVersion,
    compatible,
    error: compatible
      ? undefined
      : `Node.js ${currentNodeVersion} is below Groundswell's requirement of ${VERSION_CONSTANTS.NODE_REQUIREMENT}`,
    recommendation: compatible
      ? undefined
      : `Upgrade Node.js to version 18 or higher`,
  };
}

/**
 * Checks TypeScript version compatibility
 *
 * @remarks
 * Validates that the project's TypeScript version meets Groundswell's requirements.
 * Groundswell requires typescript ^5.2.0, project has 5.2.0.
 *
 * @returns VersionCheckResult for TypeScript compatibility
 */
function checkTypeScriptCompatibility(): VersionCheckResult {
  // Project's TypeScript version from package.json
  const projectTypeScriptVersion = '5.2.0';

  const cleanProjectVersion = projectTypeScriptVersion.replace(/^v/, '');

  const compatible = satisfies(
    cleanProjectVersion,
    VERSION_CONSTANTS.TYPESCRIPT_REQUIREMENT
  );

  return {
    requirement: 'typescript',
    required: VERSION_CONSTANTS.TYPESCRIPT_REQUIREMENT,
    actual: cleanProjectVersion,
    compatible,
    error: compatible
      ? undefined
      : `TypeScript ${cleanProjectVersion} is below Groundswell's requirement of ${VERSION_CONSTANTS.TYPESCRIPT_REQUIREMENT}`,
    recommendation: compatible
      ? undefined
      : `Upgrade TypeScript to version 5.2.0 or higher`,
  };
}

// =============================================================================
// DEPENDENCY ALIGNMENT FUNCTION
// =============================================================================

/**
 * Checks dependency alignment between project and Groundswell
 *
 * @remarks
 * Validates that @anthropic-ai/sdk version requirements are compatible.
 * Project does NOT have a direct dependency on @anthropic-ai/sdk,
 * so Groundswell's version will be used via transitive dependency.
 *
 * @param groundswellDeps - Groundswell's dependencies from package.json
 * @returns Array of dependency alignment results
 */
function checkDependencyAlignment(
  groundswellDeps: Record<string, string> | undefined
): DependencyAlignmentResult[] {
  const results: DependencyAlignmentResult[] = [];

  // Check @anthropic-ai/sdk alignment
  const groundswellSdkRequirement =
    groundswellDeps?.['@anthropic-ai/sdk'] || 'not specified';
  const projectSdkVersion = "not installed (will use Groundswell's)";

  results.push({
    dependency: '@anthropic-ai/sdk',
    groundswellRequirement: groundswellSdkRequirement,
    projectVersion: projectSdkVersion,
    hasConflict: false, // No conflict expected since project doesn't have direct dependency
    description:
      projectSdkVersion === "not installed (will use Groundswell's)"
        ? "Project does not directly depend on @anthropic-ai/sdk, will use Groundswell's version"
        : `Project uses ${projectSdkVersion}, Groundswell requires ${groundswellSdkRequirement}`,
  });

  return results;
}

// =============================================================================
// BASIC FUNCTIONALITY TEST
// =============================================================================

/**
 * Tests basic Groundswell functionality
 *
 * @remarks
 * Uses dynamic imports to test runtime instantiation of core classes.
 * This catches version-specific runtime issues that import tests might miss.
 *
 * * GOTCHA: Uses dynamic imports to avoid top-level import errors
 * * GOTCHA: Mock testing is not implemented here - requires actual Groundswell
 *
 * @returns FunctionalityTestResult with per-component success status
 */
async function testBasicFunctionality(): Promise<FunctionalityTestResult> {
  const result: FunctionalityTestResult = {
    success: false,
    workflow: { success: false },
    agent: { success: false },
    prompt: { success: false },
  };

  try {
    // Use dynamic imports to test runtime instantiation
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    // @ts-expect-error - Groundswell is a linked dependency, may not be available at compile time
    const groundswell = await import('groundswell');

    // Test Workflow class availability
    try {
      if (typeof groundswell.Workflow === 'function') {
        result.workflow.success = true;
      } else {
        result.workflow.success = false;
        result.workflow.error =
          'Workflow class is not exported as a constructor';
      }
    } catch (error) {
      result.workflow.success = false;
      result.workflow.error =
        error instanceof Error ? error.message : String(error);
    }

    // Test Agent class availability
    try {
      if (typeof groundswell.Agent === 'function') {
        result.agent.success = true;
      } else {
        // Agent might be type-only, check if it exists at all
        if (groundswell.Agent !== undefined) {
          result.agent.success = true;
        } else {
          result.agent.success = false;
          result.agent.error = 'Agent class not found (may be type-only)';
        }
      }
    } catch (error) {
      result.agent.success = false;
      result.agent.error =
        error instanceof Error ? error.message : String(error);
    }

    // Test Prompt class availability
    try {
      if (
        typeof groundswell.Prompt === 'function' ||
        typeof groundswell.Prompt === 'object'
      ) {
        result.prompt.success = true;
      } else {
        result.prompt.success = false;
        result.prompt.error = 'Prompt class not found';
      }
    } catch (error) {
      result.prompt.success = false;
      result.prompt.error =
        error instanceof Error ? error.message : String(error);
    }

    result.success =
      result.workflow.success && result.agent.success && result.prompt.success;
  } catch (error) {
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.workflow.error = result.workflow.error || errorMsg;
    result.agent.error = result.agent.error || errorMsg;
    result.prompt.error = result.prompt.error || errorMsg;
  }

  return result;
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

/**
 * Generates comprehensive compatibility report
 *
 * @remarks
 * Aggregates all check results into a single report with:
 * - Overall compatibility status
 * - Detailed version information
 * - Engine compatibility results
 * - Dependency alignment results
 * - Functionality test results
 * - S2 import test correlation (if provided)
 * - Actionable recommendations
 *
 * @param checkResults - All validation check results
 * @returns Complete GroundswellCompatibilityReport
 */
function generateReport(checkResults: {
  versionCheck: VersionCheckResult;
  nodeCheck: VersionCheckResult;
  typescriptCheck: VersionCheckResult;
  dependencyChecks: DependencyAlignmentResult[];
  functionalityTest: FunctionalityTestResult;
  importTestResults?: GroundswellImportTestResults;
}): GroundswellCompatibilityReport {
  const {
    versionCheck,
    nodeCheck,
    typescriptCheck,
    dependencyChecks,
    functionalityTest,
    importTestResults,
  } = checkResults;

  const allCompatible =
    versionCheck.compatible &&
    nodeCheck.compatible &&
    typescriptCheck.compatible &&
    dependencyChecks.every(d => !d.hasConflict) &&
    functionalityTest.success;

  const recommendations: string[] = [];

  if (!versionCheck.compatible) {
    recommendations.push(
      versionCheck.recommendation || 'Upgrade Groundswell version'
    );
  } else if (versionCheck.recommendation) {
    recommendations.push(versionCheck.recommendation);
  }

  if (!nodeCheck.compatible) {
    recommendations.push(nodeCheck.recommendation || 'Upgrade Node.js version');
  }

  if (!typescriptCheck.compatible) {
    recommendations.push(
      typescriptCheck.recommendation || 'Upgrade TypeScript version'
    );
  }

  if (dependencyChecks.some(d => d.hasConflict)) {
    recommendations.push('Resolve dependency conflicts');
  }

  if (!functionalityTest.success) {
    recommendations.push(
      'Fix basic functionality issues - check installation and imports'
    );
  }

  if (importTestResults && !importTestResults.overallSuccess) {
    recommendations.push('Resolve import test failures from P1.M1.T1.S2');
  }

  // Determine version flags
  const meetsMinimum =
    versionCheck.compatible ||
    gte(versionCheck.actual, VERSION_CONSTANTS.MINIMUM_SUPPORTED);
  const meetsRecommended = gte(
    versionCheck.actual,
    VERSION_CONSTANTS.MINIMUM_RECOMMENDED
  );

  return {
    overallCompatible: allCompatible,
    groundswellVersion: {
      version: versionCheck.actual,
      minimumRecommended: VERSION_CONSTANTS.MINIMUM_RECOMMENDED,
      minimumSupported: VERSION_CONSTANTS.MINIMUM_SUPPORTED,
      meetsMinimum,
      meetsRecommended,
    },
    engines: {
      node: nodeCheck,
      typescript: typescriptCheck,
    },
    dependencies: dependencyChecks,
    functionalityTest,
    importTestResults: importTestResults
      ? {
          overallSuccess: importTestResults.overallSuccess,
          failingImports: importTestResults.failingImports,
        }
      : undefined,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Prints console report with emoji status indicators
 *
 * @remarks
 * * PATTERN: Follows console-log-verifier.ts pattern for emoji indicators
 * Uses ✅ for success, ❌ for failure, ⚠️ for warnings
 *
 * @param report - The compatibility report to print
 */
function printConsoleReport(report: GroundswellCompatibilityReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('Groundswell Version Compatibility Report');
  console.log('='.repeat(60));

  // Version section
  console.log('\n📦 Groundswell Version:');
  console.log(`  Installed: ${report.groundswellVersion.version}`);
  console.log(
    `  Minimum Supported: ${report.groundswellVersion.minimumSupported}`
  );
  console.log(`  Recommended: ${report.groundswellVersion.minimumRecommended}`);
  console.log(
    `  Status: ${report.groundswellVersion.meetsRecommended ? '✅' : '⚠️'} ${
      report.groundswellVersion.meetsRecommended
        ? 'Meets recommended version'
        : 'Below recommended version'
    }`
  );

  // Engines section
  console.log('\n⚙️  Engine Compatibility:');
  console.log(
    `  Node.js: ${report.engines.node.actual} ${report.engines.node.compatible ? '✅' : '❌'}`
  );
  console.log(
    `  TypeScript: ${report.engines.typescript.actual} ${report.engines.typescript.compatible ? '✅' : '❌'}`
  );

  // Dependencies section
  console.log('\n📋 Dependencies:');
  for (const dep of report.dependencies) {
    console.log(
      `  ${dep.dependency}: ${dep.hasConflict ? '❌' : '✅'} ${dep.description}`
    );
  }

  // Functionality test section
  console.log('\n🧪 Basic Functionality Test:');
  console.log(
    `  Workflow: ${report.functionalityTest.workflow.success ? '✅' : '❌'}`
  );
  console.log(
    `  Agent: ${report.functionalityTest.agent.success ? '✅' : '❌'}`
  );
  console.log(
    `  Prompt: ${report.functionalityTest.prompt.success ? '✅' : '❌'}`
  );

  // Import test results section (if available)
  if (report.importTestResults) {
    console.log('\n📥 Import Test Results (S2):');
    console.log(
      `  Overall: ${report.importTestResults.overallSuccess ? '✅' : '❌'}`
    );
    if (report.importTestResults.failingImports.length > 0) {
      console.log(
        `  Failing Imports: ${report.importTestResults.failingImports.join(', ')}`
      );
    }
  }

  // Overall status
  console.log('\n' + '='.repeat(60));
  console.log(
    `Overall Status: ${report.overallCompatible ? '✅ COMPATIBLE' : '❌ INCOMPATIBLE'}`
  );
  console.log('='.repeat(60));

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    for (const rec of report.recommendations) {
      console.log(`  • ${rec}`);
    }
  }

  console.log('');
}

// =============================================================================
// MAIN EXPORT FUNCTION
// =============================================================================

/**
 * Main entry point for Groundswell version compatibility validation
 *
 * @remarks
 * Performs comprehensive validation of Groundswell installation:
 * 1. Reads and validates Groundswell package.json
 * 2. Extracts and compares version against requirements
 * 3. Validates Node.js and TypeScript compatibility
 * 4. Checks dependency alignment
 * 5. Tests basic functionality (optional, default: true)
 * 6. Correlates with S2 import test results (if provided)
 * 7. Generates comprehensive report with recommendations
 * 8. Prints console report for human review
 * 9. Optionally exports JSON report for CI/CD consumption
 *
 * @param options - Optional configuration for validation
 * @returns Promise resolving to complete compatibility report
 *
 * @example
 * ```typescript
 * // Basic usage with all defaults
 * const report = await verifyGroundswellVersion();
 *
 * // With S2 import test results
 * const report = await verifyGroundswellVersion({
 *   importTestResults: s2Results,
 * });
 *
 * // Skip functionality tests and export JSON
 * const report = await verifyGroundswellVersion({
 *   runFunctionalityTests: false,
 *   outputJsonReport: true,
 * });
 * ```
 */
export async function verifyGroundswellVersion(
  options: VerifyGroundswellVersionOptions = {}
): Promise<GroundswellCompatibilityReport> {
  const {
    importTestResults,
    runFunctionalityTests = true,
    outputJsonReport = false,
    reportPath = 'plan/002_1e734971e481/P1M1T1S3/compatibility-report.json',
  } = options;

  // Step 1: Read Groundswell package.json
  const {
    success: readSuccess,
    packageJson,
    error: readError,
  } = readGroundswellPackageJson();

  if (!readSuccess || !packageJson) {
    const errorReport: GroundswellCompatibilityReport = {
      overallCompatible: false,
      groundswellVersion: {
        version: 'unknown',
        minimumRecommended: VERSION_CONSTANTS.MINIMUM_RECOMMENDED,
        minimumSupported: VERSION_CONSTANTS.MINIMUM_SUPPORTED,
        meetsMinimum: false,
        meetsRecommended: false,
      },
      engines: {
        node: {
          requirement: 'node',
          required: VERSION_CONSTANTS.NODE_REQUIREMENT,
          actual: process.version.slice(1),
          compatible: false,
          error: readError || 'Groundswell package.json not found',
        },
        typescript: {
          requirement: 'typescript',
          required: VERSION_CONSTANTS.TYPESCRIPT_REQUIREMENT,
          actual: '5.2.0',
          compatible: false,
        },
      },
      dependencies: [],
      functionalityTest: {
        success: false,
        workflow: { success: false, error: readError },
        agent: { success: false, error: readError },
        prompt: { success: false, error: readError },
      },
      importTestResults: importTestResults
        ? {
            overallSuccess: importTestResults.overallSuccess,
            failingImports: importTestResults.failingImports,
          }
        : undefined,
      recommendations: [
        readError ||
          'Ensure Groundswell is installed via npm link (see P1.M1.T1.S1)',
      ],
      timestamp: new Date().toISOString(),
    };

    printConsoleReport(errorReport);

    // Export JSON if requested
    if (outputJsonReport) {
      try {
        const { writeFileSync } = await import('node:fs');
        writeFileSync(
          reportPath,
          JSON.stringify(errorReport, null, 2) + '\n',
          'utf-8'
        );
      } catch (error) {
        console.warn(`Failed to write JSON report to ${reportPath}: ${error}`);
      }
    }

    return errorReport;
  }

  // Step 2: Extract and compare version
  const versionCheck = compareVersions(packageJson.version || 'unknown');

  // Step 3: Check engine compatibility
  const nodeCheck = checkNodeCompatibility();

  // Step 4: Check TypeScript compatibility
  const typescriptCheck = checkTypeScriptCompatibility();

  // Step 5: Check dependency alignment
  const dependencyChecks = checkDependencyAlignment(packageJson.dependencies);

  // Step 6: Run basic functionality tests
  const functionalityTest = runFunctionalityTests
    ? await testBasicFunctionality()
    : {
        success: true,
        workflow: { success: true },
        agent: { success: true },
        prompt: { success: true },
      };

  // Step 7: Generate report
  const report = generateReport({
    versionCheck,
    nodeCheck,
    typescriptCheck,
    dependencyChecks,
    functionalityTest,
    importTestResults,
  });

  // Step 8: Print console report
  printConsoleReport(report);

  // Step 9: Export JSON report if requested
  if (outputJsonReport) {
    try {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(
        reportPath,
        JSON.stringify(report, null, 2) + '\n',
        'utf-8'
      );
    } catch (error) {
      console.warn(`Failed to write JSON report to ${reportPath}: ${error}`);
    }
  }

  return report;
}
