#!/usr/bin/env node
/**
 * Groundswell Library Validation Script
 *
 * @remarks
 * Validates that the Groundswell library is properly linked and all required
 * exports are accessible. This script should be run before building or as
 * part of CI/CD to ensure the Groundswell integration is working correctly.
 *
 * Usage:
 *   npx tsx src/scripts/validate-groundswell.ts
 *
 * Exit codes:
 *   0: Validation passed
 *   1: Validation failed
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

/**
 * Logs a message with color
 */
function log(color: string, message: string): void {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Logs a section header
 */
function logSection(title: string): void {
  log(colors.blue, `\n${colors.bold}═══ ${title} ═══`);
}

/**
 * Logs a success message
 */
function logSuccess(message: string): void {
  log(colors.green, `✓ ${message}`);
}

/**
 * Logs a warning message
 */
function logWarning(message: string): void {
  log(colors.yellow, `⚠ ${message}`);
}

/**
 * Logs an error message
 */
function logError(message: string): void {
  log(colors.red, `✗ ${message}`);
}

/**
 * Validates Groundswell npm link
 */
function validateNpmLink(): boolean {
  logSection('Validating npm link');

  try {
    // Check if groundswell is linked
    const result = execSync('npm list groundswell', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // Check if it's a linked version (contains ->)
    const isLinked = result.includes(' -> ');

    if (isLinked) {
      // Extract the linked path
      const match = result.match(/-> (.+?)\n/);
      if (match && match[1]) {
        logSuccess(`Groundswell linked to: ${match[1]}`);

        // Verify it's pointing to ~/projects/groundswell
        const expectedPath = join(process.env.HOME || '', 'projects/groundswell');
        const normalizedLinked = match[1].trim();
        const normalizedExpected = expectedPath;

        if (normalizedLinked.includes('groundswell')) {
          logSuccess('Link points to groundswell directory');
          return true;
        }
        logWarning(`Link does not point to expected location: ${expectedPath}`);
        logWarning('Current link may work but is not in the standard location');
        return true; // Still pass if linked somewhere
      }
    }

    logError('Groundswell is not linked via npm link');
    logError('Run: npm link ~/projects/groundswell');
    return false;
  } catch (error) {
    logError(`Failed to check npm link: ${error}`);
    return false;
  }
}

/**
 * Validates Groundswell version compatibility
 */
function validateVersionCompatibility(): boolean {
  logSection('Validating version compatibility');

  try {
    // Get the package.json from node_modules/groundswell
    const packageJsonPath = join(process.cwd(), 'node_modules', 'groundswell', 'package.json');

    if (!existsSync(packageJsonPath)) {
      logError('groundswell package.json not found in node_modules');
      logError('Run: npm link ~/projects/groundswell');
      return false;
    }

    // Read package.json
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const groundswellPackage = require(packageJsonPath);
    const version = groundswellPackage.version;

    logSuccess(`Groundswell version: ${version}`);

    // Check version is at least 0.0.3
    const versionParts = version.split('.').map(Number);
    if (versionParts[0] > 0 || versionParts[1] > 0 || versionParts[2] >= 3) {
      logSuccess('Version is compatible (>= 0.0.3)');
      return true;
    }

    logWarning(`Version ${version} may be outdated (recommended: >= 0.0.3)`);
    return true; // Still pass, just warn
  } catch (error) {
    logError(`Failed to validate version: ${error}`);
    return false;
  }
}

/**
 * Validates Groundswell imports
 */
function validateImports(): boolean {
  logSection('Validating Groundswell imports');

  const requiredExports = [
    'Workflow',
    'Agent',
    'Prompt',
    'createAgent',
    'createWorkflow',
    'createPrompt',
  ];

  try {
    // Try to import each export
    for (const exp of requiredExports) {
      try {
        // Dynamic import to check if export exists
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const groundswell = require('groundswell');
        if (groundswell[exp] !== undefined) {
          logSuccess(`Export '${exp}' is accessible`);
        } else {
          logError(`Export '${exp}' is not accessible`);
          return false;
        }
      } catch (importError) {
        logError(`Failed to import '${exp}': ${importError}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logError(`Failed to validate imports: ${error}`);
    return false;
  }
}

/**
 * Validates Groundswell decorators
 */
function validateDecorators(): boolean {
  logSection('Validating Groundswell decorators');

  const decorators = ['@Step', '@Task', '@ObservedState'];

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const groundswell = require('groundswell');

    for (const decorator of decorators) {
      const decoratorName = decorator.substring(1); // Remove @
      if (groundswell[decoratorName] !== undefined) {
        logSuccess(`Decorator ${decorator} is accessible`);
      } else {
        logError(`Decorator ${decorator} is not accessible`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logError(`Failed to validate decorators: ${error}`);
    return false;
  }
}

/**
 * Validates Node.js version compatibility
 */
function validateNodeVersion(): boolean {
  logSection('Validating Node.js version compatibility');

  const nodeVersion = process.version;
  const majorVersion = Number(nodeVersion.substring(1).split('.')[0]);

  logSuccess(`Node.js version: ${nodeVersion}`);

  // Groundswell requires Node.js 18+
  if (majorVersion >= 18) {
    logSuccess('Node.js version is compatible (>= 18)');
    return true;
  }

  logError(`Node.js version ${nodeVersion} is not compatible (requires >= 18)`);
  return false;
}

/**
 * Main validation function
 */
function main(): void {
  log(colors.bold, '\n🔍 Groundswell Library Validation\n');

  const results = {
    npmLink: false,
    version: false,
    imports: false,
    decorators: false,
    nodeVersion: false,
  };

  // Run all validations
  results.nodeVersion = validateNodeVersion();
  results.npmLink = validateNpmLink();
  results.version = validateVersionCompatibility();
  results.imports = validateImports();
  results.decorators = validateDecorators();

  // Summary
  logSection('Summary');
  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    log(colors.green, '\n✓ All validations passed!\n');
    process.exit(0);
  } else {
    log(colors.red, '\n✗ Some validations failed\n');
    log(colors.yellow, 'Please fix the issues above before proceeding.\n');
    process.exit(1);
  }
}

// Run validation
main();
