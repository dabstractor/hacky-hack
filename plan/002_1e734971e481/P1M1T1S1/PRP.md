# Product Requirement Prompt (PRP): Validate npm link configuration

**PRP ID**: P1.M1.T1.S1
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Create a validation script that checks if the Groundswell library is properly linked via npm link and can be resolved by TypeScript for import operations.

**Deliverable**: A TypeScript validation module (`src/utils/validate-groundswell-link.ts`) that:

1. Checks npm link status of groundswell package
2. Validates symlink integrity (if link exists)
3. Verifies TypeScript can resolve imports from groundswell
4. Returns structured result for downstream consumption by S2

**Success Definition**:

- Script executes without errors
- Returns boolean success status indicating whether npm link is properly configured
- If link is broken or missing, provides actionable error message
- Outputs linked path (absolute path to groundswell) for S2 consumption
- TypeScript compilation test passes to verify import resolution

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Initial validation step in Phase 1 (P1.M1.T1) to ensure Groundswell library integration is functional before proceeding with import tests (S2) and version compatibility checks (S3).

**User Journey**:

1. Pipeline starts Phase 1.Milestone 1.Task 1
2. Subtask S1 validation script runs automatically
3. Script checks npm link configuration
4. If valid: Returns success=true with linked path
5. If invalid: Returns success=false with actionable error
6. S2 uses the result to determine if import tests can proceed

**Pain Points Addressed**:

- Silent failures when npm link is broken (imports appear to work in tests but fail at runtime)
- Unclear error messages when groundswell module cannot be resolved
- Time wasted debugging import issues that stem from misconfigured npm link

---

## Why

- **Foundation for P1.M1**: This validation is the first step in Groundswell Integration & Validation milestone. Without proper npm link, all subsequent tests (S2: imports, S3: version compatibility) will fail or give misleading results.
- **Prevents Runtime Breakage**: Current codebase uses vitest path alias which works for tests but NOT for production builds. npm link ensures consistent behavior across test and runtime environments.
- **Addresses Contract Discrepancy**: The contract definition assumes npm link exists, but current setup uses path alias. This PRP validates and creates the link if needed.
- **Problems Solved**:
  - Detects missing or broken npm link before it causes downstream failures
  - Provides clear diagnostic information for troubleshooting
  - Enables reliable import resolution for both TypeScript compiler and Node.js runtime

---

## What

Create a validation module that checks and reports on npm link configuration for the groundswell package. The module should:

1. **Check package.json**: Determine if groundswell is listed as a dependency
2. **Check npm list**: Run `npm list groundswell` to verify link status
3. **Check symlink**: If link exists, verify symlink points to correct target
4. **Test TypeScript resolution**: Attempt to compile a test file importing from groundswell
5. **Return structured result**: Provide success status and diagnostic information

### Success Criteria

- [ ] Returns `success: true` when npm link is properly configured
- [ ] Returns `success: false` when npm link is missing or broken
- [ ] Provides absolute path to linked groundswell package when success=true
- [ ] Provides actionable error message when success=false
- [ ] TypeScript compilation test passes to verify import resolution
- [ ] Module handles edge cases (no node_modules, permission errors, etc.)
- [ ] Follows existing codebase patterns (error handling, logging, return types)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**

- ✅ File paths and module locations specified
- ✅ npm link commands and expected outputs documented
- ✅ TypeScript configuration details included
- ✅ Existing test patterns referenced
- ✅ Error handling patterns specified
- ⚠️ **CRITICAL**: Contract definition discrepancy noted (see "Known Gotchas")

---

### Documentation & References

```yaml
# MUST READ - Groundswell library information
- file: ~/projects/groundswell/package.json
  why: Contains package name, version, main entry point, exports configuration
  pattern: Read "name", "version", "main", "exports" fields
  critical: ESM-only module, main entry is ./dist/index.js

- file: ~/projects/groundswell/dist/index.d.ts
  why: TypeScript type definitions for groundswell exports
  pattern: Verify this file exists for import resolution
  gotcha: If missing, TypeScript cannot resolve imports even if npm link exists

- file: /home/dustin/projects/hacky-hack/package.json
  why: Check if groundswell is listed as dependency
  pattern: Check "dependencies" and "devDependencies" for "groundswell" entry
  critical: Currently NOT listed - this is expected for local npm link setup

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Current path alias configuration that works for tests only
  pattern: Lines 51-56 show groundswell path alias
  gotcha: Path alias works in vitest but NOT in production runtime

- file: /home/dustin/projects/hacky-hack/tsconfig.json
  why: TypeScript module resolution configuration
  pattern: moduleResolution: "NodeNext", module: "NodeNext"
  critical: NodeNext mode requires ESM modules with proper package structure

# EXISTING IMPLEMENTATION PATTERNS
- file: /home/dustin/projects/hacky-hack/src/utils/errors.ts
  why: Error handling patterns to follow
  pattern: Use descriptive error codes, recoverable flag, details field
  gotcha: Always include error code for programmatic error handling

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/groundswell-linker.test.ts
  why: Existing test patterns for npm link operations
  pattern: Mock spawn(), lstat(), readlink() for testing
  gotcha: Tests use vi.mock() for Node.js child_process and fs modules

# DOCUMENTATION
- docfile: plan/002_1e734971e481/architecture/groundswell_analysis.md
  why: Complete Groundswell API surface and module structure
  section: Section 2 (Core API Surface), Section 11.3 (Integration Recommendations)

- docfile: plan/002_1e734971e481/architecture/system_context.md
  why: System architecture and Groundswell integration status
  section: Section 4 (Groundswell Integration), Section 2 (Technology Stack)

# EXTERNAL RESEARCH
- url: https://docs.npmjs.com/cli/v10/commands/npm-link
  why: Official npm link documentation for command syntax and behavior
  critical: npm link requires global link first, then local link

- url: https://www.typescriptlang.org/tsconfig#moduleResolution
  why: TypeScript module resolution documentation for NodeNext mode
  critical: NodeNext requires ESM packages with "type": "module" in package.json

- url: https://nodejs.org/api/esm.html#introduction
  why: Node.js ESM documentation for import resolution
  critical: Subpath exports (e.g., "./dist/index.js") must be defined in exports field
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json              # NO groundswell dependency (expected)
├── tsconfig.json             # NodeNext module resolution
├── vitest.config.ts          # Path alias for groundswell (test-only)
├── src/
│   ├── utils/
│   │   ├── errors.ts        # Error patterns to follow
│   │   └── ...              # Other utilities
│   └── ...
└── tests/
    ├── setup.ts             # Global test setup
    └── unit/
        └── utils/
            └── groundswell-linker.test.ts  # Existing link test patterns
```

---

### Desired Codebase Tree (files to be added)

```bash
hacky-hack/
├── src/
│   └── utils/
│       └── validate-groundswell-link.ts   # NEW: Validation module
└── tests/
    └── unit/
        └── utils/
            └── validate-groundswell-link.test.ts  # NEW: Test suite
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Contract definition discrepancy
// Contract states: "Existing package.json has dependency on 'groundswell'"
// Reality: groundswell is NOT in package.json
// Implication: This PRP validates/create the link, not assumes it exists

// CRITICAL: Path alias vs npm link difference
// vitest.config.ts has path alias that works for TESTS ONLY
// Path alias: groundswell -> '../groundswell/dist/index.js'
// npm link: creates symlink in node_modules/groundswell
// Production builds require npm link, path alias insufficient

// CRITICAL: Groundswell is ESM-only
// "type": "module" in package.json
// Cannot use require(), must use import statements
// NodeNext moduleResolution requires this

// CRITICAL: npm link two-step process
// Step 1 (in groundswell): npm link (creates global symlink)
// Step 2 (in hacky-hack): npm link groundswell (creates local symlink)
// Skipping step 1 causes "package not found" errors

// CRITICAL: Build before linking
// Groundswell must be built (dist/ directory must exist)
// Run `npm run build` in ~/projects/groundswell before linking

// GOTCHA: TypeScript can resolve via path alias even without npm link
// tsc may succeed when import would fail at runtime
// Must test actual Node.js resolution, not just TypeScript

// GOTCHA: npm list output format varies
// With link: "groundswell@0.0.3 -> ../projects/groundswell"
// Without link: "(empty)"
// Parse carefully, don't assume consistent format

// GOTCHA: Symlink verification differs by OS
// Linux/Mac: use readlink() or fs.readlink()
// Windows: different symlink handling
// Code should handle both or document OS requirement
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// Return type for validation result
interface NpmLinkValidationResult {
  /** Whether npm link is properly configured */
  success: boolean;

  /** Absolute path to linked groundswell package (if success) */
  linkedPath: string | null;

  /** Error message if validation failed */
  errorMessage?: string;

  /** Whether node_modules/groundswell is a symlink */
  isSymlink: boolean;

  /** Target of symlink if isSymlink is true */
  symlinkTarget?: string;

  /** Whether TypeScript can resolve imports from groundswell */
  typescriptResolves: boolean;

  /** Entry point from package.json if available */
  packageJsonEntry?: string;
}

// Error type for validation failures
class LinkValidationError extends Error {
  code: string;
  isRecoverable: boolean;

  constructor(message: string, code: string, isRecoverable: boolean = true) {
    super(message);
    this.name = 'LinkValidationError';
    this.code = code;
    this.isRecoverable = isRecoverable;
  }
}
```

---

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/validate-groundswell-link.ts
  - IMPLEMENT: validateNpmLink() function returning NpmLinkValidationResult
  - IMPLEMENT: LinkValidationError class following /src/utils/errors.ts pattern
  - IMPLEMENT: Helper functions:
    * checkPackageJsonDependency() - checks if groundswell in dependencies
    * checkNpmList() - runs 'npm list groundswell' and parses output
    * checkSymlink() - verifies node_modules/groundswell is valid symlink
    * checkTypeScriptResolution() - tests TypeScript can resolve imports
  - NAMING: camelCase for functions, PascalCase for classes/types
  - PLACEMENT: src/utils/ directory
  - ERROR HANDLING: Use try-catch with specific error codes

Task 2: IMPLEMENT checkPackageJsonDependency()
  - READ: /home/dustin/projects/hacky-hack/package.json
  - PARSE: JSON to extract dependencies and devDependencies
  - CHECK: If 'groundswell' key exists in either object
  - RETURN: boolean indicating dependency exists
  - NOTE: Currently expected to be false (npm link doesn't require package.json entry)

Task 3: IMPLEMENT checkNpmList()
  - SPAWN: 'npm' process with args ['list', 'groundswell']
  - CAPTURE: stdout and stderr from npm command
  - CHECK: Exit code (0 = linked, non-zero or empty = not linked)
  - PARSE: stdout to extract version and target path if linked
  - RETURN: Object with { linked: boolean, version?: string, target?: string }
  - GOTCHA: npm list returns empty output when package not installed
  - PATTERN: Follow spawn pattern from groundswell-linker.test.ts

Task 4: IMPLEMENT checkSymlink()
  - IMPORT: 'node:fs/promises' for lstat() and readlink()
  - CHECK: if node_modules/groundswell exists using lstat()
  - VERIFY: isSymbolicLink property from lstat() result
  - READ: symlink target using readlink() if symlink exists
  - RESOLVE: to absolute path using path.resolve()
  - VALIDATE: target points to ~/projects/groundswell
  - RETURN: Object with { isSymlink: boolean, target?: string }
  - ERROR HANDLING: Return isSymlink: false if file doesn't exist

Task 5: IMPLEMENT checkTypeScriptResolution()
  - IMPORT: 'typescript' for programmatic compilation
  - CREATE: Temporary test file with import statement: "import { Workflow } from 'groundswell';"
  - COMPILE: Using tsc with --noEmit flag
  - CHECK: For compilation errors (diagnostics array)
  - RETURN: boolean (true if no errors, false otherwise)
  - GOTCHA: Use temp file cleanup with try-finally
  - REFERENCE: Use pattern from validate-api.ts if applicable

Task 6: IMPLEMENT main validateNpmLink() function
  - CALL: All helper functions in sequence
  - AGGREGATE: Results into NpmLinkValidationResult object
  - DETERMINE: Overall success based on:
    * Symlink exists AND points to correct target
    * TypeScript can resolve imports
  - RETURN: NpmLinkValidationResult with all fields populated
  - LOGGING: Use console.log for progress (consider Pino if available)

Task 7: CREATE tests/unit/utils/validate-groundswell-link.test.ts
  - IMPLEMENT: Test suite using Vitest
  - TEST: Each helper function independently
  - MOCK: spawn(), fs/promises, TypeScript compiler for isolation
  - FOLLOW: Pattern from tests/unit/utils/groundswell-linker.test.ts
  - COVERAGE: 100% coverage (project requirement)
  - FIXTURES: Create mock data for npm list output, symlink status

Task 8: UPDATE tests/setup.ts if needed
  - CHECK: If existing setup needs modification for new module
  - ADD: Any necessary mocks or configuration
  - PRESERVE: Existing test setup functionality
```

---

### Implementation Patterns & Key Details

```typescript
// ============================================
// PATTERN 1: Error Handling (from errors.ts)
// ============================================
class LinkValidationError extends Error {
  code: string;
  isRecoverable: boolean;

  constructor(message: string, code: string, isRecoverable: boolean = true) {
    super(message);
    this.name = 'LinkValidationError';
    this.code = code;
    this.isRecoverable = isRecoverable;
  }
}

// Error codes to use:
// 'GROUNDSWELL_NOT_LINKED' - npm link does not exist
// 'GROUNDSWELL_BAD_SYMLINK' - symlink exists but points wrong target
// 'GROUNDSWELL_BUILD_MISSING' - dist/ directory doesn't exist
// 'GROUNDSWELL_TYPESCRIPT_ERROR' - TypeScript cannot resolve imports
// 'GROUNDSWELL_PERMISSION_DENIED' - file system permission error

// ============================================
// PATTERN 2: Spawn Command Execution
// ============================================
import { spawn } from 'node:child_process';

async function checkNpmList(): Promise<{
  linked: boolean;
  version?: string;
  target?: string;
}> {
  return new Promise(resolve => {
    const npmProcess = spawn('npm', ['list', 'groundswell'], {
      cwd: '/home/dustin/projects/hacky-hack',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    npmProcess.stdout?.on('data', data => {
      stdout += data.toString();
    });

    npmProcess.stderr?.on('data', data => {
      stderr += data.toString();
    });

    npmProcess.on('close', code => {
      // Parse output to determine link status
      // Empty stdout = not linked
      // Contains "groundswell@x.x.x -> path" = linked
      if (stdout.trim() === '') {
        resolve({ linked: false });
      } else {
        // Parse version and target from output
        const match = stdout.match(/groundswell@([\d.]+)\s+->\s+(.+)/);
        if (match) {
          resolve({ linked: true, version: match[1], target: match[2] });
        } else {
          resolve({ linked: true }); // Linked but couldn't parse details
        }
      }
    });
  });
}

// ============================================
// PATTERN 3: Symlink Verification
// ============================================
import { lstat, readlink } from 'node:fs/promises';
import path from 'node:path';

async function checkSymlink(): Promise<{
  isSymlink: boolean;
  target?: string;
  isValid?: boolean;
}> {
  const linkPath = '/home/dustin/projects/hacky-hack/node_modules/groundswell';

  try {
    const stats = await lstat(linkPath);

    if (!stats.isSymbolicLink()) {
      return { isSymlink: false };
    }

    const target = await readlink(linkPath);
    const absoluteTarget = path.resolve(linkPath, target);
    const expectedTarget = path.resolve('~/projects/groundswell');

    return {
      isSymlink: true,
      target: absoluteTarget,
      isValid: absoluteTarget === expectedTarget,
    };
  } catch (error) {
    // File doesn't exist or permission error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { isSymlink: false };
    }
    throw new LinkValidationError(
      `Permission denied accessing node_modules/groundswell`,
      'GROUNDSWELL_PERMISSION_DENIED'
    );
  }
}

// ============================================
// PATTERN 4: TypeScript Resolution Check
// ============================================
import * as ts from 'typescript';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

async function checkTypeScriptResolution(): Promise<boolean> {
  const testFilePath = '/tmp/test-groundswell-import.ts';
  const testContent = "import { Workflow } from 'groundswell';";

  try {
    await writeFile(testFilePath, testContent, 'utf-8');

    const program = ts.createProgram([testFilePath], {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
      skipLibCheck: true,
    });

    const diagnostics = program.getSyntacticDiagnostics();
    return diagnostics.length === 0;
  } finally {
    try {
      await unlink(testFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================
// PATTERN 5: Main Validation Function
// ============================================
export async function validateNpmLink(): Promise<NpmLinkValidationResult> {
  const results: NpmLinkValidationResult = {
    success: false,
    linkedPath: null,
    isSymlink: false,
    typescriptResolves: false,
  };

  // Check package.json (informational, not required)
  const hasDependency = await checkPackageJsonDependency();

  // Check npm list
  const npmListResult = await checkNpmList();

  // Check symlink
  const symlinkResult = await checkSymlink();

  // Check TypeScript resolution
  const tsResolves = await checkTypeScriptResolution();

  // Populate results
  results.isSymlink = symlinkResult.isSymlink;
  results.symlinkTarget = symlinkResult.target;
  results.typescriptResolves = tsResolves;
  results.packageJsonEntry = hasDependency ? 'present' : 'absent';

  // Determine overall success
  if (symlinkResult.isSymlink && symlinkResult.isValid && tsResolves) {
    results.success = true;
    results.linkedPath = symlinkResult.target;
  } else {
    results.errorMessage = generateErrorMessage(
      npmListResult,
      symlinkResult,
      tsResolves
    );
  }

  return results;
}

function generateErrorMessage(
  npmList: { linked: boolean },
  symlink: { isSymlink: boolean; isValid?: boolean },
  tsResolves: boolean
): string {
  const issues: string[] = [];

  if (!symlink.isSymlink) {
    issues.push('npm link does not exist');
    issues.push(
      'Run: cd ~/projects/groundswell && npm link && cd - && npm link groundswell'
    );
  } else if (!symlink.isValid) {
    issues.push(`symlink points to wrong location: ${symlink.target}`);
    issues.push('Expected: ~/projects/groundswell');
  }

  if (!tsResolves) {
    issues.push('TypeScript cannot resolve imports from groundswell');
    issues.push('Ensure groundswell/dist/index.d.ts exists');
  }

  return issues.join('\n');
}
```

---

### Integration Points

```yaml
NO EXISTING FILE MODIFICATIONS REQUIRED:
  - This is a new module, no existing code changes
  - Does not modify package.json
  - Does not modify tsconfig.json
  - Does not modify vitest.config.ts

OUTPUT FOR DOWNSTREAM CONSUMPTION:
  - File: NpmLinkValidationResult interface
  - Used by: P1.M1.T1.S2 (Test Groundswell imports)
  - Critical fields: success (boolean), linkedPath (string | null)

CONSIDERATIONS FOR FUTURE:
  - May want to add this validation to CI/CD pipeline
  - Could integrate with scripts/validate-api.ts pattern
  - Consider adding to package.json "validate" script
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating src/utils/validate-groundswell-link.ts
npx tsc --noEmit src/utils/validate-groundswell-link.ts

# Expected: No type errors

# Format check
npx prettier --check "src/utils/validate-groundswell-link.ts"

# Expected: No formatting issues

# Linting
npx eslint src/utils/validate-groundswell-link.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the test file
npm test -- tests/unit/utils/validate-groundswell-link.test.ts

# Expected: All tests pass

# Run with coverage
npm run test:coverage -- tests/unit/utils/validate-groundswell-link.test.ts

# Expected: 100% coverage (project requirement)

# Test specific scenarios
npm test -- -t "validateNpmLink returns success when symlink valid"
npm test -- -t "validateNpmLink returns failure when symlink missing"
npm test -- -t "checkSymlink detects broken symlink"
npm test -- -t "checkTypeScriptResolution detects import errors"

# Expected: All scenario tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test the actual npm link status in current environment
node -e "import('./src/utils/validate-groundswell-link.js').then(m => m.validateNpmLink().then(console.log))"

# Expected output:
# If linked: { success: true, linkedPath: '/home/dustin/projects/groundswell', ... }
# If not linked: { success: false, errorMessage: '...', ... }

# Test TypeScript resolution manually
npx tsc --noEmit -e "import { Workflow } from 'groundswell'"

# Expected: No module resolution errors (if path alias working) OR error (if npm link needed)

# Verify npm list command
npm list groundswell

# Expected output:
# If linked: groundswell@0.0.3 -> ../projects/groundswell
# If not linked: (empty)

# Verify symlink
ls -la node_modules/groundswell 2>/dev/null || echo "No groundswell in node_modules"

# Expected output:
# If linked: groundswell -> ../projects/groundswell
# If not linked: No such file or directory

# Test against actual groundswell dist
test -f ~/projects/groundswell/dist/index.js && echo "Groundswell built" || echo "Groundswell needs build"

# Expected: "Groundswell built" (if dist exists)
```

### Level 4: Domain-Specific Validation

```bash
# Validate against project requirements
# Requirement: Works for both test and runtime environments

# Test 1: Check that vitest path alias still works
npm test -- tests/unit/utils/validate-groundswell-link.test.ts

# Expected: Tests pass (path alias works for vitest)

# Test 2: Check that runtime import works (requires npm link)
npm run build
node -e "import('./dist/utils/validate-groundswell-link.js').then(m => m.validateNpmLink().then(r => console.log('Runtime test:', r.success)))"

# Expected: If npm link exists, success=true. If not, success=false but no module resolution errors.

# Test 3: Verify error messages are actionable
node -e "import('./src/utils/validate-groundswell-link.js').then(async (m) => { const r = await m.validateNpmLink(); if (!r.success) console.log('Error message:\n', r.errorMessage); })"

# Expected: Clear error message with fix instructions

# Test 4: Edge case handling
# Create broken symlink scenario and test
cd node_modules && ln -s /tmp/broken groundswell-broken && cd ..
node -e "import('./src/utils/validate-groundswell-link.js').then(m => m.validateNpmLink().then(console.log))"

# Expected: Handles gracefully, returns success=false with appropriate error

# Cleanup
rm -f node_modules/groundswell-broken
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/validate-groundswell-link.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npx eslint src/utils/validate-groundswell-link.ts`
- [ ] No formatting issues: `npx prettier --check "src/utils/validate-groundswell-link.ts"`
- [ ] 100% code coverage achieved

### Feature Validation

- [ ] Returns `success: true` when npm link is properly configured
- [ ] Returns `success: false` when npm link is missing or broken
- [ ] Provides absolute path to groundswell when success=true
- [ ] Provides actionable error message when success=false
- [ ] TypeScript compilation test passes (verifies import resolution)
- [ ] Handles edge cases (no node_modules, permission errors, broken symlinks)
- [ ] Symlink verification detects incorrect targets
- [ ] npm list parsing handles various output formats

### Code Quality Validation

- [ ] Follows existing error handling patterns from `/src/utils/errors.ts`
- [ ] File placement matches desired codebase tree structure
- [ ] Uses descriptive function and variable names
- [ ] Includes JSDoc comments for public API
- [ ] Error codes are specific and actionable
- [ ] No hardcoded paths (uses constants or config)
- [ ] Async/await used consistently (no promise chains)

### Documentation & Deployment

- [ ] Code is self-documenting with clear names
- [ ] Error messages provide actionable guidance
- [ ] Module exports are clearly defined
- [ ] Return type interface is well-documented
- [ ] No environment variables required (uses defaults)
- [ ] Works across Linux/Mac (Windows support documented if needed)

---

## Anti-Patterns to Avoid

- ❌ **Don't assume npm link exists** - Validate and report status instead
- ❌ **Don't use hardcoded paths** - Use constants or environment detection
- ❌ **Don't ignore TypeScript resolution** - Path alias ≠ npm link
- ❌ **Don't swallow errors** - Always include error codes and messages
- ❌ **Don't use synchronous file operations** - Use async fs/promises
- ❌ **Don't modify package.json** - npm link works without dependency entry
- ❌ **Don't assume OS** - Document platform requirements (symlink handling differs)
- ❌ **Don't skip TypeScript test** - Import resolution is critical for downstream
- ❌ **Don't return empty results** - Always populate all fields in return type
- ❌ **Don't mix validation and creation** - This PRP validates only, doesn't create link
- ❌ **Don't ignore temp file cleanup** - Always clean up test files in finally block
- ❌ **Don't use console.error for results** - Return structured data, log separately

---

## Appendix: Decision Rationale

### Why NOT create npm link in this PRP?

This PRP is a **validation** step, not a setup step. The contract definition says "Validate npm link configuration" not "Create npm link configuration." Separating concerns:

- **S1** (this PRP): Validate and report
- **Decision**: If link is missing, S2 should fail with clear error, not auto-fix
- **Rationale**: Auto-creating links could mask configuration issues or create unexpected side effects

### Why check TypeScript resolution if vitest path alias exists?

The vitest path alias (`vitest.config.ts` line 54) works **only for tests**. Production builds (`npm run build`) use `tsconfig.json` which does NOT have the path alias. This means:

- Tests pass (via path alias)
- Runtime fails (no npm link)
  This PRP detects this discrepancy before it causes production issues.

### Why not add groundswell to package.json?

npm link creates a symlink in `node_modules/` without requiring a `package.json` entry. Adding it would:

1. Require `npm install` after linking (unnecessary step)
2. Cause confusion about whether to use npm link or npm install
3. Break the local development workflow

Current approach (no package.json entry + npm link) is correct for local package development.
