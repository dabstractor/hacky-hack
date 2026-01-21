# Version Compatibility Testing Best Practices

**Research Date:** 2026-01-15
**Focus:** npm package version validation, Node.js/TypeScript compatibility, dependency conflict detection, and reporting patterns
**Research Scope:** Groundswell library integration (v0.0.3), @anthropic-ai/sdk compatibility, version validation tooling

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [npm Package Version Validation](#npm-package-version-validation)
3. [Node.js/TypeScript Compatibility](#nodejstypescript-compatibility)
4. [Dependency Version Conflicts](#dependency-version-conflicts)
5. [Reporting Patterns](#reporting-patterns)
6. [Implementation Examples](#implementation-examples)
7. [Tool Recommendations](#tool-recommendations)
8. [Quick Reference](#quick-reference)

---

## Executive Summary

This document compiles best practices for version compatibility testing in Node.js/TypeScript projects, specifically focusing on:

- **Programmatic version validation** using Node.js built-ins and npm APIs
- **Semver validation** patterns and best practices
- **Engine requirement checking** for Node.js and TypeScript
- **Transitive dependency analysis** for detecting conflicts
- **CLI reporting patterns** for validation results

### Key Findings

1. **Use Node.js built-ins first**: `require()` and `import` for package.json, `semver` npm package for validation
2. **Always check engines field**: Validate Node.js and npm versions before running
3. **Transitive dependencies matter**: Use `npm ls --all` to detect deep conflicts
4. **Structured reporting**: Use consistent formats (JSON, colored console, tables) for results
5. **Fail fast with clear messages**: Exit codes and error messages should guide users to fixes

---

## npm Package Version Validation

### 1. How to Programmatically Read package.json Versions

#### Method A: Using require() (CommonJS/Node.js)

```typescript
/**
 * Read package.json from project root
 * @param projectPath - Absolute path to project directory
 * @returns Parsed package.json object
 */
function readPackageJson(projectPath: string): any {
  const packageJsonPath = path.join(projectPath, 'package.json');

  try {
    // Using require for automatic JSON parsing
    const pkg = require(packageJsonPath);
    return pkg;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }
    throw new Error(`Failed to parse package.json: ${error}`);
  }
}
```

#### Method B: Using fs.readFileSync (TypeScript/ESM)

```typescript
import { readFileSync } from 'node:fs';
import path from 'node:path';

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: {
    node?: string;
    npm?: string;
  };
}

/**
 * Read and parse package.json with type safety
 * @param projectPath - Absolute path to project directory
 * @returns Parsed package.json with type information
 */
function readPackageJsonTyped(projectPath: string): PackageJson {
  const packageJsonPath = path.join(projectPath, 'package.json');

  try {
    const content = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content) as PackageJson;
    return pkg;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }
    if (errno instanceof SyntaxError) {
      throw new Error(`Invalid JSON in package.json: ${errno.message}`);
    }
    throw error;
  }
}
```

#### Method C: Reading from node_modules (Installed Version)

```typescript
/**
 * Read installed package version from node_modules
 * @param packageName - Name of the package (e.g., 'groundswell')
 * @param projectPath - Project root directory
 * @returns Installed version string
 */
function getInstalledVersion(packageName: string, projectPath: string): string {
  const packagePath = path.join(
    projectPath,
    'node_modules',
    packageName,
    'package.json'
  );

  try {
    const pkg = readPackageJsonTyped(path.dirname(packagePath));
    return pkg.version;
  } catch (error) {
    throw new Error(`Package ${packageName} not found in node_modules`);
  }
}
```

---

### 2. Best Practices for Semver Validation

#### What is Semver?

**Semantic Versioning** follows the format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

**Reference:** https://semver.org/

#### Using the `semver` Package (Recommended)

**Installation:**

```bash
npm install semver
```

**Basic Validation:**

```typescript
import semver from 'semver';

/**
 * Validate a version string follows semver format
 * @param version - Version string to validate
 * @returns True if valid semver string
 */
function isValidSemver(version: string): boolean {
  return semver.valid(version) !== null;
}

/**
 * Compare two version strings
 * @param version1 - First version
 * @param version2 - Second version
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(version1: string, version2: string): number {
  return semver.compare(version1, version2);
}

/**
 * Check if installed version satisfies minimum requirement
 * @param installed - Currently installed version
 * @param minimum - Minimum required version (e.g., '>=0.0.3')
 * @returns True if installed version satisfies requirement
 */
function satisfiesMinimum(installed: string, minimum: string): boolean {
  return semver.satisfies(installed, minimum);
}
```

#### Validation Patterns

```typescript
interface VersionValidationResult {
  valid: boolean;
  installed?: string;
  required?: string;
  message: string;
}

/**
 * Validate package meets minimum version requirement
 * @param packageName - Name of the package
 * @param installedVersion - Currently installed version
 * @param minimumVersion - Minimum required version
 * @returns Validation result with message
 */
function validateMinimumVersion(
  packageName: string,
  installedVersion: string,
  minimumVersion: string
): VersionValidationResult {
  // Validate both are valid semver
  if (!semver.valid(installedVersion)) {
    return {
      valid: false,
      message: `Invalid installed version format: ${installedVersion}`,
    };
  }

  if (!semver.valid(minimumVersion)) {
    return {
      valid: false,
      message: `Invalid required version format: ${minimumVersion}`,
    };
  }

  // Check if installed meets minimum
  if (semver.lt(installedVersion, minimumVersion)) {
    return {
      valid: false,
      installed: installedVersion,
      required: minimumVersion,
      message: `${packageName} version ${installedVersion} does not meet minimum requirement ${minimumVersion}`,
    };
  }

  return {
    valid: true,
    installed: installedVersion,
    required: minimumVersion,
    message: `${packageName} version ${installedVersion} meets requirement ${minimumVersion}`,
  };
}
```

---

### 3. How to Check if Installed Package Meets Minimum Version

#### Method A: Direct Version Check

```typescript
/**
 * Check Groundswell version compatibility
 * Groundswell v0.0.3 requires Node.js 18+, TypeScript 5.2+
 */
function checkGroundswellCompatibility(): VersionValidationResult {
  const MINIMUM_GROUNDSWELL = '0.0.3';
  const MINIMUM_NODE = '18.0.0';
  const MINIMUM_TYPESCRIPT = '5.2.0';

  try {
    // Check installed Groundswell version
    const installed = getInstalledVersion('groundswell', process.cwd());

    const result = validateMinimumVersion(
      'groundswell',
      installed,
      `>=${MINIMUM_GROUNDSWELL}`
    );

    if (!result.valid) {
      return result;
    }

    // Additional checks for Groundswell requirements
    const nodeVersion = process.version.replace('v', '');
    if (semver.lt(nodeVersion, MINIMUM_NODE)) {
      return {
        valid: false,
        message: `Node.js ${nodeVersion} does not meet Groundswell requirement ${MINIMUM_NODE}`,
      };
    }

    // TypeScript version check (from package.json devDependencies)
    const pkg = readPackageJsonTyped(process.cwd());
    const tsVersion = pkg.devDependencies?.typescript?.replace('^', '');

    if (tsVersion && semver.lt(tsVersion, MINIMUM_TYPESCRIPT)) {
      return {
        valid: false,
        message: `TypeScript ${tsVersion} does not meet Groundswell requirement ${MINIMUM_TYPESCRIPT}`,
      };
    }

    return {
      valid: true,
      installed,
      required: MINIMUM_GROUNDSWELL,
      message: `Groundswell ${installed} is compatible (requires Node.js >=${MINIMUM_NODE}, TypeScript >=${MINIMUM_TYPESCRIPT})`,
    };
  } catch (error) {
    return {
      valid: false,
      message: `Failed to check Groundswell: ${error}`,
    };
  }
}
```

#### Method B: Using npm Programmatically

```typescript
import { execSync } from 'node:child_process';

/**
 * Get package version using npm list
 * @param packageName - Name of the package
 * @returns Installed version string
 */
function getPackageVersionNpm(packageName: string): string {
  try {
    const output = execSync(`npm list ${packageName} --json`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    const data = JSON.parse(output);
    const version = data.dependencies?.[packageName]?.version;

    if (!version) {
      throw new Error(`Package ${packageName} not found`);
    }

    return version;
  } catch (error) {
    throw new Error(`Failed to get version for ${packageName}: ${error}`);
  }
}
```

---

## Node.js/TypeScript Compatibility

### 1. How to Validate Node.js Version Requirements

#### Method A: Check package.json `engines` Field

```typescript
/**
 * Validate Node.js version against package.json engines field
 * @param projectPath - Path to project directory
 * @returns Validation result
 */
function validateNodeVersion(projectPath: string): VersionValidationResult {
  const pkg = readPackageJsonTyped(projectPath);
  const requiredNodeVersion = pkg.engines?.node;

  if (!requiredNodeVersion) {
    return {
      valid: true,
      message: 'No Node.js version requirement specified in package.json',
    };
  }

  const currentNodeVersion = process.version.replace('v', '');

  // Use semver to check if current version satisfies requirement
  if (!semver.satisfies(currentNodeVersion, requiredNodeVersion)) {
    return {
      valid: false,
      installed: currentNodeVersion,
      required: requiredNodeVersion,
      message: `Node.js ${currentNodeVersion} does not satisfy requirement ${requiredNodeVersion}`,
    };
  }

  return {
    valid: true,
    installed: currentNodeVersion,
    required: requiredNodeVersion,
    message: `Node.js ${currentNodeVersion} satisfies requirement ${requiredNodeVersion}`,
  };
}
```

#### Method B: Command-Line Validation

```bash
# Check Node.js version
node --version

# Check if version satisfies requirement
node -e "console.log(require('semver').satisfies(process.version.replace('v', ''), '>=20.0.0'))"

# Check with npx (if semver not installed)
npx semver $(node --version) --range '>=20.0.0'
```

#### Method C: Using `check-node-version` Package

**Installation:**

```bash
npm install --save-dev check-node-version
```

**Usage in package.json:**

```json
{
  "scripts": {
    "prestart": "check-node-version --node '>=20.0.0'",
    "pretest": "check-node-version --node '>=20.0.0 --npm '>=10.0.0'"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

**Programmatic Usage:**

```typescript
import checkNodeVersion from 'check-node-version';

/**
 * Validate Node.js and npm versions
 */
async function validateEngines(): Promise<void> {
  const result = await checkNodeVersion({
    node: '>=20.0.0',
    npm: '>=10.0.0',
  });

  if (!result.versions.node?.isSatisfied) {
    console.error(
      `Node.js ${result.versions.node.version} does not satisfy >=20.0.0`
    );
    process.exit(1);
  }

  if (!result.versions.npm?.isSatisfied) {
    console.error(
      `npm ${result.versions.npm.version} does not satisfy >=10.0.0`
    );
    process.exit(1);
  }

  console.log('Engine requirements satisfied');
}
```

---

### 2. How to Check TypeScript Version Compatibility

#### Method A: Check package.json devDependencies

```typescript
/**
 * Get installed TypeScript version
 * @param projectPath - Path to project directory
 * @returns TypeScript version string
 */
function getTypeScriptVersion(projectPath: string): string {
  const pkg = readPackageJsonTyped(projectPath);
  const tsVersion = pkg.devDependencies?.typescript;

  if (!tsVersion) {
    throw new Error('TypeScript not found in devDependencies');
  }

  // Remove caret (^) or tilde (~) if present
  return tsVersion.replace(/^[\^~]/, '');
}

/**
 * Validate TypeScript version meets minimum requirement
 * @param projectPath - Path to project directory
 * @param minimumVersion - Minimum required version
 * @returns Validation result
 */
function validateTypeScriptVersion(
  projectPath: string,
  minimumVersion: string
): VersionValidationResult {
  try {
    const installed = getTypeScriptVersion(projectPath);

    if (!semver.satisfies(installed, minimumVersion)) {
      return {
        valid: false,
        installed,
        required: minimumVersion,
        message: `TypeScript ${installed} does not meet requirement ${minimumVersion}`,
      };
    }

    return {
      valid: true,
      installed,
      required: minimumVersion,
      message: `TypeScript ${installed} satisfies requirement ${minimumVersion}`,
    };
  } catch (error) {
    return {
      valid: false,
      message: `Failed to check TypeScript version: ${error}`,
    };
  }
}
```

#### Method B: Check Installed TypeScript CLI

```typescript
import { execSync } from 'node:child_process';

/**
 * Get TypeScript version from tsc CLI
 * @returns TypeScript version string
 */
function getTypeScriptCliVersion(): string {
  try {
    const output = execSync('npx tsc --version', {
      encoding: 'utf-8',
    });

    // Output format: "Version 5.2.0"
    const match = output.match(/Version\s+([\d.]+)/);
    if (!match) {
      throw new Error('Could not parse tsc version');
    }

    return match[1];
  } catch (error) {
    throw new Error(`Failed to get TypeScript CLI version: ${error}`);
  }
}
```

---

### 3. Tools for Checking Engine Requirements

#### Tool 1: `engines` Field in package.json

**Best Practice:**

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

**npm enforcement (optional):**

```bash
# Force npm to check engines
npm config set engine-strict true

# Or per project
npm install --engine-strict
```

#### Tool 2: `.nvmrc` File (Node Version Manager)

```bash
# .nvmrc
20.0.0
```

**Usage:**

```bash
# Automatically switch to required version
nvm use

# Install and use if not found
nvm install
```

#### Tool 3: `.node-version` File (nodenv)

```bash
# .node-version
20.0.0
```

#### Tool 4: `package.json` Pre-Hooks

```json
{
  "scripts": {
    "preinstall": "check-node-version --node '>=20.0.0' --npm '>=10.0.0'",
    "prestart": "check-node-version --node '>=20.0.0'",
    "pretest": "check-node-version --node '>=20.0.0'"
  }
}
```

---

## Dependency Version Conflicts

### 1. How to Detect Version Conflicts with @anthropic-ai/sdk

#### Method A: Check Direct Dependencies

```typescript
/**
 * Check for @anthropic-ai/sdk version conflicts
 * Groundswell uses ^0.71.1, check if project has different version
 */
function checkAnthropicSdkConflict(): {
  hasConflict: boolean;
  groundswellVersion?: string;
  projectVersion?: string;
  message: string;
} {
  const GROUNDSWELL_SDK = '^0.71.1';

  try {
    // Get Groundswell's Anthropic SDK version from node_modules
    const groundswellPkg = readPackageJsonTyped(
      path.join(process.cwd(), 'node_modules', 'groundswell')
    );
    const groundswellSdkVersion =
      groundswellPkg.dependencies?.['@anthropic-ai/sdk'];

    // Get project's Anthropic SDK version
    const projectPkg = readPackageJsonTyped(process.cwd());
    const projectSdkVersion =
      projectPkg.dependencies?.['@anthropic-ai/sdk'] ||
      projectPkg.devDependencies?.['@anthropic-ai/sdk'];

    // If project doesn't have it, no conflict
    if (!projectSdkVersion) {
      return {
        hasConflict: false,
        groundswellVersion: groundswellSdkVersion,
        message: 'No @anthropic-ai/sdk in project dependencies',
      };
    }

    // Check if versions are compatible
    const cleanedProjectVersion = projectSdkVersion.replace(/^[\^~]/, '');
    const cleanedGroundswellVersion = groundswellSdkVersion.replace(
      /^[\^~]/,
      ''
    );

    // If versions differ significantly, warn
    if (!semver.satisfies(cleanedProjectVersion, groundswellSdkVersion)) {
      return {
        hasConflict: true,
        groundswellVersion: groundswellSdkVersion,
        projectVersion: projectSdkVersion,
        message: `Version conflict: Groundswell requires ${groundswellSdkVersion}, project has ${projectSdkVersion}`,
      };
    }

    return {
      hasConflict: false,
      groundswellVersion: groundswellSdkVersion,
      projectVersion: projectSdkVersion,
      message: `@anthropic-ai/sdk versions compatible (${projectSdkVersion})`,
    };
  } catch (error) {
    return {
      hasConflict: false,
      message: `Could not check @anthropic-ai/sdk version: ${error}`,
    };
  }
}
```

#### Method B: Using `npm ls` to Detect Conflicts

```typescript
/**
 * Detect dependency conflicts using npm ls
 * @param packageName - Package to check (e.g., '@anthropic-ai/sdk')
 * @returns Conflict detection result
 */
function detectNpmConflict(packageName: string): {
  hasConflict: boolean;
  versions: string[];
  message: string;
} {
  try {
    const output = execSync(`npm ls ${packageName} --json --all`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    const data = JSON.parse(output);
    const versions: string[] = [];

    // Recursively find all versions of the package
    function findVersions(deps: Record<string, any>) {
      for (const [name, info] of Object.entries(deps)) {
        if (name === packageName && info.version) {
          versions.push(info.version);
        }
        if (info.dependencies) {
          findVersions(info.dependencies);
        }
      }
    }

    if (data.dependencies) {
      findVersions(data.dependencies);
    }

    // Deduplicate versions
    const uniqueVersions = [...new Set(versions)];

    if (uniqueVersions.length > 1) {
      return {
        hasConflict: true,
        versions: uniqueVersions,
        message: `Multiple versions of ${packageName} found: ${uniqueVersions.join(', ')}`,
      };
    }

    return {
      hasConflict: false,
      versions: uniqueVersions,
      message: `Single version of ${packageName}: ${uniqueVersions[0] || 'not found'}`,
    };
  } catch (error) {
    return {
      hasConflict: false,
      versions: [],
      message: `Failed to detect conflicts: ${error}`,
    };
  }
}
```

---

### 2. Best Practices for Validating Transitive Dependencies

#### Strategy 1: Use `npm ls --all`

```bash
# Show all dependencies including transitive
npm ls --all

# Show specific package dependency tree
npm ls @anthropic-ai/sdk --all

# JSON output for programmatic analysis
npm ls --json --all > dependency-tree.json
```

#### Strategy 2: Deduplicate Dependencies

```bash
# Deduplicate dependencies (safe operation)
npm dedupe

# Dry run first
npm dedupe --dry-run
```

#### Strategy 3: Lockfile Analysis

```typescript
/**
 * Analyze package-lock.json for duplicate versions
 */
function analyzeLockfileDuplicates(): {
  package: string;
  versions: string[];
  locations: string[];
}[] {
  const lockfile = JSON.parse(
    readFileSync(path.join(process.cwd(), 'package-lock.json'), 'utf-8')
  );

  const packageVersions = new Map<string, Set<string>>();

  // Iterate through lockfile packages
  for (const [key, info] of Object.entries(lockfile.packages || {})) {
    if (info.version && key.includes('node_modules/')) {
      const packageName = key.split('/').pop()!;

      if (!packageVersions.has(packageName)) {
        packageVersions.set(packageName, new Set());
      }

      packageVersions.get(packageName)!.add(info.version);
    }
  }

  // Find packages with multiple versions
  const duplicates: Array<{
    package: string;
    versions: string[];
    locations: string[];
  }> = [];

  for (const [pkg, versions] of packageVersions.entries()) {
    if (versions.size > 1) {
      duplicates.push({
        package: pkg,
        versions: Array.from(versions),
        locations: [], // Could add location tracking
      });
    }
  }

  return duplicates;
}
```

---

### 3. Tools for Dependency Tree Analysis

#### Tool 1: `npm ls` (Built-in)

```bash
# Basic tree
npm ls

# Full tree with all dependencies
npm ls --all

# JSON output
npm ls --json

# Check specific package
npm ls @anthropic-ai/sdk

# Find why a package is installed
npm explain @anthropic-ai/sdk
```

#### Tool 2: `npm-check` (Third-party)

**Installation:**

```bash
npm install -g npm-check
```

**Usage:**

```bash
# Check for outdated, incorrect, unused dependencies
npm-check

# Interactive update
npm-check -u

# Skip unused check
npm-check --skip-unused
```

#### Tool 3: `depcheck` (Third-party)

**Installation:**

```bash
npm install -g depcheck
```

**Usage:**

```bash
# Check for unused dependencies
depcheck

# JSON output
depcheck --json

# Ignore certain packages
depcheck --ignore=package1,package2
```

#### Tool 4: `madge` (Circular Dependency Detection)

**Installation:**

```bash
npm install -g madge
```

**Usage:**

```bash
# Find circular dependencies
madge --circular src/

# Visualize dependency tree
madge --image deps.svg src/
```

#### Tool 5: `npm-why` (Package Explanation)

**Installation:**

```bash
npm install -g npm-why
```

**Usage:**

```bash
# Explain why a package is installed
npm-why @anthropic-ai/sdk
```

#### Tool 6: `dependency-cruiser` (Advanced Analysis)

**Installation:**

```bash
npm install -g dependency-cruiser
```

**Usage:**

```bash
# Detect circular dependencies
depcruise --include-only '^src' src/

# Validate against rules
depcruise --validate .dependency-cruiser.js src/

# Visualize
depcruise --output-type dot src/ | dot -T svg > dependency-graph.svg
```

---

## Reporting Patterns

### 1. Best Practices for Version Compatibility Reports

#### Pattern 1: Structured Result Object

```typescript
interface CompatibilityReport {
  /** Overall compatibility status */
  status: 'pass' | 'warn' | 'fail';

  /** Report timestamp */
  timestamp: string;

  /** Environment information */
  environment: {
    nodeVersion: string;
    npmVersion: string;
    os: string;
  };

  /** Package compatibility checks */
  packages: Array<{
    name: string;
    installed: string;
    required: string;
    status: 'pass' | 'fail';
    message: string;
  }>;

  /** Engine compatibility checks */
  engines: {
    node: {
      installed: string;
      required: string;
      status: 'pass' | 'fail';
    };
    npm?: {
      installed: string;
      required: string;
      status: 'pass' | 'fail';
    };
  };

  /** Dependency conflicts detected */
  conflicts: Array<{
    package: string;
    versions: string[];
    severity: 'error' | 'warning';
  }>;

  /** Recommendations */
  recommendations: string[];
}
```

#### Pattern 2: Colorized Console Output

```typescript
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
} as const;

const symbols = {
  pass: `${colors.green}✓${colors.reset}`,
  fail: `${colors.red}✗${colors.reset}`,
  warn: `${colors.yellow}⚠${colors.reset}`,
  info: `${colors.blue}ℹ${colors.reset}`,
} as const;

/**
 * Print compatibility report to console
 * @param report - Compatibility report
 */
function printCompatibilityReport(report: CompatibilityReport): void {
  console.log(
    `\n${colors.bright}=== Version Compatibility Report ===${colors.reset}`
  );
  console.log(`Generated: ${report.timestamp}\n`);

  // Environment
  console.log(`${colors.bright}Environment:${colors.reset}`);
  console.log(`  Node.js: ${report.environment.nodeVersion}`);
  console.log(`  npm: ${report.environment.npmVersion}`);
  console.log(`  OS: ${report.environment.os}\n`);

  // Engine checks
  console.log(`${colors.bright}Engine Requirements:${colors.reset}`);
  const nodeStatus =
    report.engines.node.status === 'pass' ? symbols.pass : symbols.fail;
  console.log(
    `  ${nodeStatus} Node.js: ${report.engines.node.installed} (required: ${report.engines.node.required})`
  );

  if (report.engines.npm) {
    const npmStatus =
      report.engines.npm.status === 'pass' ? symbols.pass : symbols.fail;
    console.log(
      `  ${npmStatus} npm: ${report.engines.npm.installed} (required: ${report.engines.npm.required})`
    );
  }
  console.log();

  // Package checks
  console.log(`${colors.bright}Package Compatibility:${colors.reset}`);
  for (const pkg of report.packages) {
    const status = pkg.status === 'pass' ? symbols.pass : symbols.fail;
    console.log(
      `  ${status} ${pkg.name}: ${pkg.installed} (required: ${pkg.required})`
    );
    if (pkg.status === 'fail') {
      console.log(`      ${colors.red}${pkg.message}${colors.reset}`);
    }
  }
  console.log();

  // Conflicts
  if (report.conflicts.length > 0) {
    console.log(`${colors.bright}Dependency Conflicts:${colors.reset}`);
    for (const conflict of report.conflicts) {
      const severity =
        conflict.severity === 'error' ? symbols.fail : symbols.warn;
      console.log(
        `  ${severity} ${conflict.package}: ${conflict.versions.join(', ')}`
      );
    }
    console.log();
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log(`${colors.bright}Recommendations:${colors.reset}`);
    for (const rec of report.recommendations) {
      console.log(`  ${symbols.info} ${rec}`);
    }
    console.log();
  }

  // Overall status
  const statusSymbol =
    report.status === 'pass'
      ? symbols.pass
      : report.status === 'warn'
        ? symbols.warn
        : symbols.fail;
  const statusColor =
    report.status === 'pass'
      ? colors.green
      : report.status === 'warn'
        ? colors.yellow
        : colors.red;

  console.log(
    `${statusColor}${statusSymbol} Overall Status: ${report.status.toUpperCase()}${colors.reset}\n`
  );
}
```

#### Pattern 3: Table Format (using `cli-table3`)

**Installation:**

```bash
npm install cli-table3
```

**Usage:**

```typescript
import Table from 'cli-table3';

/**
 * Print package compatibility as table
 * @param packages - Package compatibility results
 */
function printPackageTable(packages: CompatibilityReport['packages']): void {
  const table = new Table({
    head: ['Package', 'Installed', 'Required', 'Status'],
    colWidths: [30, 15, 15, 10],
    style: {
      head: ['bright', 'underline'],
    },
  });

  for (const pkg of packages) {
    const status = pkg.status === 'pass' ? '✓' : '✗';
    const color = pkg.status === 'pass' ? 'green' : 'red';

    table.push([
      pkg.name,
      pkg.installed,
      pkg.required,
      {
        content: status,
        style: { color },
      },
    ]);
  }

  console.log(table.toString());
}
```

---

### 2. How to Format Version Mismatch Recommendations

#### Pattern 1: Actionable Messages

```typescript
/**
 * Generate actionable recommendation for version mismatch
 * @param packageName - Name of the package
 * @param installed - Currently installed version
 * @param required - Required version
 * @returns Recommendation message
 */
function generateMismatchRecommendation(
  packageName: string,
  installed: string,
  required: string
): string {
  const recommendations: string[] = [];

  // Recommendation 1: Update package
  recommendations.push(`Update ${packageName} to version ${required}:`);
  recommendations.push(`  npm install ${packageName}@${required}`);

  // Recommendation 2: Check package.json
  recommendations.push(`\nOr update package.json:`);
  recommendations.push(`  "dependencies": {`);
  recommendations.push(`    "${packageName}": "${required}"`);
  recommendations.push(`  }`);

  // Recommendation 3: Check if this is a peer dependency
  recommendations.push(
    `\nIf ${packageName} is a peer dependency, you may need to update the package that requires it.`
  );

  return recommendations.join('\n');
}
```

#### Pattern 2: Severity-Based Recommendations

```typescript
interface Recommendation {
  severity: 'error' | 'warning' | 'info';
  message: string;
  command?: string;
}

/**
 * Generate recommendations based on severity
 * @param report - Compatibility report
 * @returns Array of recommendations
 */
function generateRecommendations(
  report: CompatibilityReport
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Critical failures
  for (const pkg of report.packages.filter(p => p.status === 'fail')) {
    recommendations.push({
      severity: 'error',
      message: `${pkg.name} version mismatch (${pkg.installed} vs ${pkg.required})`,
      command: `npm install ${pkg.name}@${pkg.required}`,
    });
  }

  // Engine failures
  if (report.engines.node.status === 'fail') {
    recommendations.push({
      severity: 'error',
      message: `Node.js version too old (${report.engines.node.installed})`,
      command: `# Use nvm to install required version\nnvm install ${report.engines.node.required}\nnvm use`,
    });
  }

  // Conflicts
  for (const conflict of report.conflicts.filter(c => c.severity === 'error')) {
    recommendations.push({
      severity: 'error',
      message: `Multiple versions of ${conflict.package}: ${conflict.versions.join(', ')}`,
      command: 'npm dedupe',
    });
  }

  // Warnings
  for (const conflict of report.conflicts.filter(
    c => c.severity === 'warning'
  )) {
    recommendations.push({
      severity: 'warning',
      message: `Potential conflict: ${conflict.package} has ${conflict.versions.length} versions`,
    });
  }

  return recommendations;
}
```

---

### 3. CLI Output Patterns for Validation Results

#### Pattern 1: Exit Codes

```typescript
/**
 * Exit code constants for validation results
 */
const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  WARNING: 2,
} as const;

/**
 * Exit with appropriate code based on validation result
 * @param report - Compatibility report
 */
function exitWithStatus(report: CompatibilityReport): never {
  switch (report.status) {
    case 'pass':
      process.exit(EXIT_CODES.SUCCESS);
    case 'warn':
      process.exit(EXIT_CODES.WARNING);
    case 'fail':
      process.exit(EXIT_CODES.ERROR);
  }
}
```

#### Pattern 2: JSON Output (for CI/CD)

```typescript
/**
 * Print report as JSON (for programmatic consumption)
 * @param report - Compatibility report
 */
function printJsonReport(report: CompatibilityReport): void {
  console.log(JSON.stringify(report, null, 2));
}
```

**Usage:**

```bash
# Human-readable output
npm run validate

# JSON output for CI/CD
npm run validate -- --json

# In CI script
if ! npm run validate --json | jq '.status == "pass"'; then
  echo "Validation failed"
  exit 1
fi
```

#### Pattern 3: Verbose vs. Terse Output

```typescript
interface OutputOptions {
  verbose: boolean;
  json: boolean;
  color: boolean;
}

/**
 * Print report with configurable verbosity
 * @param report - Compatibility report
 * @param options - Output options
 */
function printReport(
  report: CompatibilityReport,
  options: OutputOptions
): void {
  if (options.json) {
    printJsonReport(report);
    return;
  }

  if (options.verbose) {
    printCompatibilityReport(report);
  } else {
    // Terse output
    console.log(`Status: ${report.status}`);

    const failures = report.packages.filter(p => p.status === 'fail');
    if (failures.length > 0) {
      console.log(`Failed packages: ${failures.map(p => p.name).join(', ')}`);
    }
  }
}
```

---

## Implementation Examples

### Example 1: Complete Validation Script

````typescript
#!/usr/bin/env tsx
/**
 * Version Compatibility Validation Script
 *
 * Validates package versions, engine requirements, and dependency conflicts
 *
 * @example
 * ```bash
 * npx tsx validate-compatibility.ts
 * npx tsx validate-compatibility.ts --json
 * npx tsx validate-compatibility.ts --verbose
 * ```
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import semver from 'semver';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  pass: boolean;
  warnings: string[];
  errors: string[];
}

interface CompatibilityCheck {
  name: string;
  check: () => ValidationResult;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Node.js version
 */
function validateNodeVersion(): ValidationResult {
  const pkg = JSON.parse(
    readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  );

  const required = pkg.engines?.node;
  if (!required) {
    return {
      pass: true,
      warnings: ['No Node.js version requirement specified'],
      errors: [],
    };
  }

  const current = process.version.replace('v', '');

  if (!semver.satisfies(current, required)) {
    return {
      pass: false,
      warnings: [],
      errors: [
        `Node.js ${current} does not satisfy requirement ${required}`,
        `Install required version: nvm install ${required}`,
      ],
    };
  }

  return {
    pass: true,
    warnings: [],
    errors: [],
  };
}

/**
 * Validate Groundswell version
 */
function validateGroundswellVersion(): ValidationResult {
  const MINIMUM = '0.0.3';

  try {
    const groundswellPkg = JSON.parse(
      readFileSync(
        path.join(process.cwd(), 'node_modules', 'groundswell', 'package.json'),
        'utf-8'
      )
    );

    const installed = groundswellPkg.version;

    if (semver.lt(installed, MINIMUM)) {
      return {
        pass: false,
        warnings: [],
        errors: [
          `Groundswell ${installed} does not meet minimum ${MINIMUM}`,
          `Update: npm install groundswell@latest`,
        ],
      };
    }

    return {
      pass: true,
      warnings: [],
      errors: [],
    };
  } catch (error) {
    return {
      pass: false,
      warnings: [],
      errors: [`Failed to check Groundswell: ${error}`],
    };
  }
}

/**
 * Validate TypeScript version
 */
function validateTypeScriptVersion(): ValidationResult {
  const MINIMUM = '5.2.0';

  try {
    const pkg = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    const installed = pkg.devDependencies?.typescript?.replace(/^[\^~]/, '');

    if (!installed) {
      return {
        pass: false,
        warnings: [],
        errors: ['TypeScript not found in devDependencies'],
      };
    }

    if (semver.lt(installed, MINIMUM)) {
      return {
        pass: false,
        warnings: [],
        errors: [
          `TypeScript ${installed} does not meet minimum ${MINIMUM}`,
          `Update: npm install typescript@${MINIMUM}`,
        ],
      };
    }

    return {
      pass: true,
      warnings: [],
      errors: [],
    };
  } catch (error) {
    return {
      pass: false,
      warnings: [],
      errors: [`Failed to check TypeScript: ${error}`],
    };
  }
}

/**
 * Check for @anthropic-ai/sdk conflicts
 */
function checkAnthropicSdkConflicts(): ValidationResult {
  try {
    const output = Bun.spawnSync({
      cmd: ['npm', 'ls', '@anthropic-ai/sdk', '--json'],
      cwd: process.cwd(),
    });

    const data = JSON.parse(output.stdout);
    const versions = new Set<string>();

    function extractVersions(deps: Record<string, any>) {
      for (const [name, info] of Object.entries(deps)) {
        if (name === '@anthropic-ai/sdk' && info.version) {
          versions.add(info.version);
        }
        if (info.dependencies) {
          extractVersions(info.dependencies);
        }
      }
    }

    if (data.dependencies) {
      extractVersions(data.dependencies);
    }

    if (versions.size > 1) {
      return {
        pass: true,
        warnings: [
          `Multiple @anthropic-ai/sdk versions: ${Array.from(versions).join(', ')}`,
          'Consider running: npm dedupe',
        ],
        errors: [],
      };
    }

    return {
      pass: true,
      warnings: [],
      errors: [],
    };
  } catch (error) {
    return {
      pass: true,
      warnings: [],
      errors: [`Failed to check @anthropic-ai/sdk: ${error}`],
    };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const checks: CompatibilityCheck[] = [
    { name: 'Node.js Version', check: validateNodeVersion },
    { name: 'Groundswell Version', check: validateGroundswellVersion },
    { name: 'TypeScript Version', check: validateTypeScriptVersion },
    { name: 'Anthropic SDK Conflicts', check: checkAnthropicSdkConflicts },
  ];

  console.log('=== Version Compatibility Check ===\n');

  let allPassed = true;

  for (const { name, check } of checks) {
    const result = check();

    const status = result.pass ? '✓' : '✗';
    const color = result.pass ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${status}${reset} ${name}`);

    for (const warning of result.warnings) {
      console.log(`  ⚠ ${warning}`);
    }

    for (const error of result.errors) {
      console.log(`  ✗ ${error}`);
    }

    if (!result.pass) {
      allPassed = false;
    }
  }

  console.log();

  if (allPassed) {
    console.log('✓ All compatibility checks passed');
    process.exit(0);
  } else {
    console.log('✗ Some compatibility checks failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`Error: ${error}`);
  process.exit(1);
});
````

---

### Example 2: Integration with Existing Code

Based on the existing codebase patterns (`/home/dustin/projects/hacky-hack/src/scripts/validate-api.ts`):

```typescript
/**
 * Version validation script following existing patterns
 * Uses colored output and structured validation results
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import semver from 'semver';

// ============================================================================
// COLORS (matching validate-api.ts pattern)
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
} as const;

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) =>
    console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg: string) =>
    console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Main validation function
 */
async function validateVersions(): Promise<void> {
  log.section('=== Version Compatibility Validation ===\n');

  const results: { name: string; passed: boolean; message: string }[] = [];

  // 1. Node.js version
  log.info('Checking Node.js version...');
  const nodeVersion = process.version.replace('v', '');
  const nodeRequired = '>=20.0.0';
  const nodeValid = semver.satisfies(nodeVersion, nodeRequired);

  results.push({
    name: 'Node.js',
    passed: nodeValid,
    message: `${nodeVersion} (required: ${nodeRequired})`,
  });

  if (nodeValid) {
    log.success(`Node.js ${nodeVersion} satisfies requirement\n`);
  } else {
    log.error(`Node.js ${nodeVersion} does not satisfy ${nodeRequired}\n`);
  }

  // 2. TypeScript version
  log.info('Checking TypeScript version...');
  const pkg = JSON.parse(
    readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  );
  const tsVersion = pkg.devDependencies?.typescript?.replace(/^[\^~]/, '');
  const tsRequired = '>=5.2.0';
  const tsValid = tsVersion && semver.satisfies(tsVersion, tsRequired);

  results.push({
    name: 'TypeScript',
    passed: !!tsValid,
    message: `${tsVersion || 'not found'} (required: ${tsRequired})`,
  });

  if (tsValid) {
    log.success(`TypeScript ${tsVersion} satisfies requirement\n`);
  } else {
    log.error(
      `TypeScript ${tsVersion || 'not found'} does not satisfy ${tsRequired}\n`
    );
  }

  // 3. Groundswell version
  log.info('Checking Groundswell version...');
  const groundswellRequired = '>=0.0.3';
  let groundswellValid = false;
  let groundswellVersion = 'not found';

  try {
    const groundswellPkg = JSON.parse(
      readFileSync(
        path.join(process.cwd(), 'node_modules', 'groundswell', 'package.json'),
        'utf-8'
      )
    );
    groundswellVersion = groundswellPkg.version;
    groundswellValid = semver.satisfies(
      groundswellVersion,
      groundswellRequired
    );
  } catch (error) {
    // Groundswell not found
  }

  results.push({
    name: 'Groundswell',
    passed: groundswellValid,
    message: `${groundswellVersion} (required: ${groundswellRequired})`,
  });

  if (groundswellValid) {
    log.success(`Groundswell ${groundswellVersion} satisfies requirement\n`);
  } else {
    log.error(
      `Groundswell ${groundswellVersion} does not satisfy ${groundswellRequired}\n`
    );
  }

  // Summary
  log.section('=== Summary ===');

  const allPassed = results.every(r => r.passed);

  for (const result of results) {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? colors.green : colors.red;
    console.log(
      `${color}${status}${colors.reset} ${result.name}: ${result.message}`
    );
  }

  console.log();

  if (allPassed) {
    log.success('All version compatibility checks passed!');
    process.exit(0);
  } else {
    log.error('Some version compatibility checks failed');
    process.exit(1);
  }
}

validateVersions().catch(error => {
  log.error(`Error: ${error}`);
  process.exit(1);
});
```

---

## Tool Recommendations

### Summary of Recommended Tools

| Tool                   | Purpose               | Installation                        | Use Case                              |
| ---------------------- | --------------------- | ----------------------------------- | ------------------------------------- |
| **semver**             | Version validation    | `npm install semver`                | Comparing versions, validating ranges |
| **check-node-version** | Engine validation     | `npm install -D check-node-version` | Checking Node.js/npm in scripts       |
| **npm ls**             | Dependency tree       | Built-in                            | Inspecting dependency structure       |
| **npm dedupe**         | Deduplication         | Built-in                            | Reducing duplicate packages           |
| **depcheck**           | Unused dependencies   | `npm install -g depcheck`           | Finding unused packages               |
| **madge**              | Circular dependencies | `npm install -g madge`              | Detecting circular imports            |
| **dependency-cruiser** | Advanced analysis     | `npm install -g dependency-cruiser` | Complex dependency rules              |
| **cli-table3**         | Table output          | `npm install cli-table3`            | Formatted console tables              |

---

## Quick Reference

### Common Version Validation Patterns

```typescript
// 1. Check if version satisfies requirement
semver.satisfies('1.2.3', '>=1.0.0'); // true
semver.satisfies('0.9.0', '>=1.0.0'); // false

// 2. Compare two versions
semver.compare('1.2.3', '1.2.4'); // -1 (first is lower)
semver.compare('1.2.3', '1.2.3'); // 0 (equal)
semver.compare('1.2.4', '1.2.3'); // 1 (first is higher)

// 3. Validate version string
semver.valid('1.2.3'); // '1.2.3'
semver.valid('invalid'); // null

// 4. Get Node.js version
process.version; // 'v20.0.0'
process.version.replace('v', ''); // '20.0.0'

// 5. Parse package.json
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
pkg.version; // '1.0.0'
pkg.engines?.node; // '>=20.0.0'
```

### Common CLI Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List dependency tree
npm ls
npm ls --all
npm ls @anthropic-ai/sdk

# Explain package
npm explain @anthropic-ai/sdk

# Deduplicate
npm dedupe

# Check engines
npx check-node-version --node '>=20.0.0' --npm '>=10.0.0'

# TypeScript version
npx tsc --version
```

---

## References

### Official Documentation

1. **Semantic Versioning**
   - URL: https://semver.org/
   - Coverage: Version format, comparison, ranges

2. **semver npm package**
   - URL: https://www.npmjs.com/package/semver
   - Coverage: JavaScript/TypeScript semver implementation

3. **npm package.json**
   - URL: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
   - Coverage: engines field, dependencies, devDependencies

4. **npm ls command**
   - URL: https://docs.npmjs.com/cli/v10/commands/npm-ls
   - Coverage: Dependency tree inspection

5. **Node.js process.versions**
   - URL: https://nodejs.org/api/process.html#processversions
   - Coverage: Getting Node.js version programmatically

6. **TypeScript compiler options**
   - URL: https://www.typescriptlang.org/docs/handbook/compiler-options.html
   - Coverage: TypeScript version requirements

### Related Project Documentation

7. **npm Link Best Practices** (Internal)
   - Path: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/docs/research-docs/npm-link-best-practices.md`
   - Coverage: npm link workflow, symlink verification

8. **TypeScript Module Resolution** (Internal)
   - Path: `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/docs/typescript-module-resolution-research.md`
   - Coverage: TypeScript paths, npm link integration

9. **External npm Link Research** (Internal)
   - Path: `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/npm-link-best-practices-external-research.md`
   - Coverage: Official docs, troubleshooting, alternatives

### Tools

10. **check-node-version**
    - URL: https://www.npmjs.com/package/check-node-version
    - Coverage: Engine validation

11. **depcheck**
    - URL: https://www.npmjs.com/package/depcheck
    - Coverage: Unused dependency detection

12. **madge**
    - URL: https://www.npmjs.com/package/madge
    - Coverage: Circular dependency detection

13. **dependency-cruiser**
    - URL: https://www.npmjs.com/package/dependency-cruiser
    - Coverage: Advanced dependency analysis

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Maintainer:** Development Team
**Status:** Complete

---

## Appendix: Groundswell-Specific Validation

### Groundswell v0.0.3 Requirements

Based on task context (P1.M1.T1.S3), Groundswell v0.0.3 requires:

- **Node.js**: >=18.0.0
- **TypeScript**: >=5.2.0
- **@anthropic-ai/sdk**: ^0.71.1

### Critical Features in v0.0.3

- Promise.allSettled() for concurrent errors
- isDescendantOf() public API

### Validation Checklist

- [ ] Groundswell version >= 0.0.3 installed
- [ ] Node.js >= 18.0.0
- [ ] TypeScript >= 5.2.0
- [ ] @anthropic-ai/sdk compatibility checked
- [ ] No duplicate @anthropic-ai/sdk versions
- [ ] Basic functionality tested (Workflow, Agent, Prompt creation)

### Example Validation Code

```typescript
/**
 * Validate Groundswell v0.0.3 compatibility
 */
function validateGroundswellV003(): ValidationResult {
  const MINIMUM = '0.0.3';
  const MIN_NODE = '18.0.0';
  const MIN_TS = '5.2.0';
  const ANTHROPIC_SDK = '^0.71.1';

  let errors: string[] = [];
  let warnings: string[] = [];

  // Check Groundswell version
  const groundswell = getInstalledVersion('groundswell', process.cwd());
  if (semver.lt(groundswell, MINIMUM)) {
    errors.push(`Groundswell ${groundswell} < ${MINIMUM}`);
  }

  // Check Node.js
  const node = process.version.replace('v', '');
  if (semver.lt(node, MIN_NODE)) {
    errors.push(`Node.js ${node} < ${MIN_NODE}`);
  }

  // Check TypeScript
  const pkg = readPackageJsonTyped(process.cwd());
  const ts = pkg.devDependencies?.typescript?.replace(/^[\^~]/, '');
  if (ts && semver.lt(ts, MIN_TS)) {
    errors.push(`TypeScript ${ts} < ${MIN_TS}`);
  }

  // Check @anthropic-ai/sdk
  const conflict = checkAnthropicSdkConflict();
  if (conflict.hasConflict) {
    warnings.push(
      `@anthropic-ai/sdk conflict: ${conflict.projectVersion} vs ${conflict.groundswellVersion}`
    );
  }

  return {
    pass: errors.length === 0,
    warnings,
    errors,
  };
}
```

---

_End of Document_
