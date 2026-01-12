# Product Requirement Prompt (PRP): Create TypeScript Configuration (tsconfig.json)

**PRP ID**: P1.M1.T1.S2
**Work Item Title**: Create TypeScript configuration (tsconfig.json)
**Generated**: 2026-01-12
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create a production-ready `tsconfig.json` that enables TypeScript 5.2+ compilation with Node.js 20+ ESM support and Groundswell decorator compatibility.

**Deliverable**: A `tsconfig.json` file in the project root (`/home/dustin/projects/hacky-hack/tsconfig.json`) containing:
- ES2022 target with NodeNext module resolution
- Groundswell decorator support (experimentalDecorators, emitDecoratorMetadata)
- Strict mode enabled for maximum type safety
- Proper output and root directory configuration

**Success Definition**:
- `tsc --noEmit` runs without errors
- `tsc --showConfig` displays the expected configuration
- TypeScript can compile .ts files when src/ directory is created in next task

---

## User Persona

**Target User**: Development team setting up the TypeScript compiler configuration for the PRP Pipeline project.

**Use Case**: After package.json is created (P1.M1.T1.S1), the TypeScript compiler must be configured before any TypeScript code can be compiled or type-checked.

**User Journey**:
1. Developer completes P1.M1.T1.S1 (package.json with TypeScript 5.2+)
2. Developer creates tsconfig.json with proper configuration
3. Developer validates with `tsc --noEmit`
4. TypeScript compilation is ready for future source files

**Pain Points Addressed**:
- Enables type checking for all TypeScript code
- Configures Groundswell decorators for workflow classes
- Establishes ESM module resolution for Node.js 20+
- Prevents runtime errors from incorrect TypeScript settings

---

## Why

- **Foundation for Type Safety**: All TypeScript code requires this configuration for compilation and type checking
- **Groundswell Compatibility**: Decorators (`@Step`, `@Task`, `@ObservedState`) require specific compiler flags
- **ESM Support**: Node.js 20+ requires NodeNext module resolution for proper ESM handling
- **Build Process**: The `npm run build` script depends on this configuration
- **Developer Experience**: Proper IDE autocomplete and error detection depend on tsconfig.json

---

## What

Create a `tsconfig.json` file with the following configuration:

### Complete tsconfig.json Content

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Compiler Options Explained

| Option | Value | Purpose |
|--------|-------|---------|
| `target` | `"ES2022"` | JavaScript language target (class fields, private methods, top-level await) |
| `module` | `"NodeNext"` | ESM module format for Node.js 20+ |
| `moduleResolution` | `"NodeNext"` | Hybrid CJS/ESM resolution respecting package.json `"type"` |
| `lib` | `["ES2022"]` | Type definitions for ES2022 APIs |
| `strict` | `true` | Enable all strict type-checking options |
| `esModuleInterop` | `true` | Better CommonJS/ESM interoperability |
| `skipLibCheck` | `true` | Skip type checking of declaration files (faster builds) |
| `forceConsistentCasingInFileNames` | `true` | Prevent case-related import issues |
| `outDir` | `"./dist"` | Output directory for compiled JavaScript |
| `rootDir` | `"./src"` | Root directory of TypeScript source files |
| `resolveJsonModule` | `true` | Enable importing JSON files |
| `experimentalDecorators` | `true` | Required for Groundswell decorators |
| `emitDecoratorMetadata` | `true` | Required for Groundswell decorator metadata |

### Success Criteria

- [ ] `tsconfig.json` exists at project root
- [ ] `tsc --showConfig` displays valid configuration
- [ ] `tsc --noEmit` runs without errors (will show "no inputs" - expected)
- [ ] Configuration includes all required options for Groundswell

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact tsconfig.json content with all options
- Validation commands to verify success
- Research references for all decisions
- Known gotchas and pitfalls to avoid
- Integration with existing package.json from P1.M1.T1.S1

### Documentation & References

```yaml
# MUST READ - Official TypeScript documentation
- url: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
  why: TypeScript 5.2 release notes - decorators, using declarations
  critical: Groundswell decorators require "experimentalDecorators": true

- url: https://www.typescriptlang.org/docs/handbook/decorators.html
  why: TypeScript decorators documentation
  critical: @Step, @Task, @ObservedState decorators used by Groundswell

- url: https://www.typescriptlang.org/tsconfig
  why: Complete TypeScript compiler options reference
  critical: Understanding moduleResolution, target, and strict options

- url: https://www.typescriptlang.org/docs/handbook/modules/reference.html#nodenext
  why: NodeNext module resolution documentation
  critical: Required for Node.js 20+ ESM support

- url: https://nodejs.org/api/esm.html
  why: Node.js ESM documentation
  critical: ESM requires .js extensions in imports

# INTERNAL RESEARCH - Stored in plan/001_14b9dc2a33c7/
- file: plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: TypeScript 5.2+ requirements for Groundswell
  section: "TypeScript Configuration" (lines 164-183)
  pattern: Follow the recommended tsconfig.json structure

- file: plan/001_14b9dc2a33c7/docs/typescript_5.2_plus_research.md
  why: Comprehensive TypeScript 5.2+ features and best practices
  section: "Recommended tsconfig.json for Groundswell Project" (lines 572-597)
  gotcha: Requires "experimentalDecorators": true for Groundswell decorators

- file: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Groundswell library API reference
  section: "Decorators" (lines 20-107)
  pattern: @Step, @Task, @ObservedState decorator usage

- file: plan/001_14b9dc2a33c7/P1M1T1S1/PRP.md
  why: Previous task PRP - package.json configuration
  section: "Package Metadata" (lines 67-79)
  gotcha: package.json has "type": "module" which tsconfig must respect

- file: /home/dustin/projects/hacky-hack/package.json
  why: Current project package configuration
  pattern: Verify TypeScript 5.2+ is installed
  gotcha: Using tsx for runtime, so noEmit could be true but we need outDir for npm run build

# RESEARCH OUTPUTS - For this PRP
- docfile: plan/001_14b9dc2a33c7/P1M1T1S2/research/tsconfig_best_practices.md
  why: tsconfig best practices research summary
  section: "Required Options" (lines 8-26)

- docfile: plan/001_14b9dc2a33c7/P1M1T1S2/research/tsconfig_validation_research.md
  why: Validation commands and patterns
  section: "Validation Commands" (lines 5-20)
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── .git/
├── .gitignore
├── PRD.md                          # Master product requirements
├── PROMPTS.md                      # Critical agent prompts
├── package.json                   # Created in P1.M1.T1.S1
├── package-lock.json              # Created by npm install
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/
│       │   ├── environment_config.md
│       │   ├── groundswell_api.md
│       │   └── system_context.md
│       ├── docs/
│       │   ├── typescript_5.2_plus_research.md
│       │   └── nodejs_typescript_research.md
│       ├── P1M1T1S1/
│       │   └── PRP.md             # Previous task PRP
│       └── P1M1T1S2/
│           ├── research/          # Created during research phase
│           └── PRP.md             # This file
└── tsconfig.json                  # TO BE CREATED (this task)
```

### Desired Codebase Tree (After This Task)

```bash
/home/dustin/projects/hacky-hack
├── .git/
├── .gitignore
├── PRD.md
├── PROMPTS.md
├── package.json
├── package-lock.json
├── tsconfig.json                  # CREATED: TypeScript configuration
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── P1M1T1S2/
│       │   ├── research/
│       │   │   ├── tsconfig_best_practices.md
│       │   │   └── tsconfig_validation_research.md
│       │   └── PRP.md
│       └── ...
└── src/                           # CREATED IN P1.M1.T1.S4 (next after next task)
    └── (source files will go here)
```

### Known Gotchas & Library Quirks

```bash
# CRITICAL: Groundswell decorators require experimentalDecorators
# Without this, @Step, @Task, @ObservedState will cause compilation errors
# Source: https://www.typescriptlang.org/docs/handbook/decorators.html

# CRITICAL: emitDecoratorMetadata required for decorator type reflection
# Groundswell's ObservedState uses metadata for state snapshots
# Source: plan/001_14b9dc2a33c7/architecture/groundswell_api.md

# CRITICAL: NodeNext module resolution respects package.json "type": "module"
# Must use NodeNext (not "node" or "node16") for proper ESM support
# Source: https://www.typescriptlang.org/docs/handbook/modules/reference.html#nodenext

# CRITICAL: ESM requires .js extensions in import statements
# Even though source files are .ts, imports use .js because TypeScript compiles to .js
# Example: import { foo } from './bar.js' (not './bar.ts')
# Source: https://nodejs.org/api/esm.html

# CRITICAL: outDir and rootDir must match project structure
# outDir: "./dist" - where compiled JavaScript goes
# rootDir: "./src" - where TypeScript source files are
# Source: https://www.typescriptlang.org/tsconfig

# CRITICAL: strict mode enables all strict type checking
# This includes strictNullChecks, strictFunctionTypes, strictBindCallApply, etc.
# Groundswell requires type safety for proper workflow execution
# Source: plan/001_14b9dc2a33c7/docs/typescript_5.2_plus_research.md

# GOTCHA: reflect-metadata must be installed and imported at runtime
# Run: npm install reflect-metadata
# Import as first line: import 'reflect-metadata';
# Source: Groundswell decorator metadata reflection

# GOTCHA: skipLibCheck is important for build performance
# Without this, TypeScript checks all node_modules type definitions
# Can add significant time to builds
# Source: TypeScript compiler best practices

# GOTCHA: tsc --noEmit will show "no inputs" before src/ exists
# This is expected - src/ directory will be created in P1.M1.T1.S4
# Validation should pass with "no inputs" message, not errors
```

---

## Implementation Blueprint

### Data Models and Structure

**No data models required** - This task creates TypeScript configuration, not application code.

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: VERIFY TypeScript installation from P1.M1.T1.S1
  - RUN: npx tsc --version
  - EXPECT: Version 5.2.x or higher
  - IF FAILS: Error message directing to P1.M1.T1.S1
  - NO DEPENDENCIES

Task 2: VERIFY package.json exists
  - RUN: cat package.json | jq '.type'
  - EXPECT: "module" (confirms ESM configuration)
  - RUN: cat package.json | jq '.devDependencies.typescript'
  - EXPECT: "^5.2.0" or compatible version
  - NO DEPENDENCIES

Task 3: CREATE tsconfig.json in project root
  - LOCATION: /home/dustin/projects/hacky-hack/tsconfig.json
  - CONTENT: Complete tsconfig.json (see "Complete tsconfig.json Content" above)
  - METHOD: Direct file creation with JSON content
  - NAMING: tsconfig.json (exact name required by TypeScript)
  - DEPENDENCIES: Task 1 and Task 2 must pass

Task 4: VALIDATE JSON syntax
  - RUN: node -e "JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8'))"
  - EXPECT: No output (or "undefined" if successful)
  - IF FAILS: JSON syntax error message
  - DEPENDENCIES: Task 3 must complete

Task 5: VALIDATE TypeScript configuration
  - RUN: npx tsc --showConfig
  - EXPECT: JSON output showing effective configuration
  - VERIFY: Check that target is "ES2022", module is "NodeNext"
  - DEPENDENCIES: Task 3 must complete

Task 6: VALIDATE type checking (dry run)
  - RUN: npx tsc --noEmit
  - EXPECT: "error TS6012: No inputs" or similar (src/ doesn't exist yet)
  - IF FAILS: Configuration error (not "no inputs" error)
  - DEPENDENCIES: Task 3 must complete
```

### Complete tsconfig.json Content

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Implementation Patterns & Key Details

```bash
# Pattern: Verify existing configuration before creating tsconfig.json
# This ensures package.json from P1.M1.T1.S1 is in place
npx tsc --version
cat package.json | jq '.type'

# Pattern: Create tsconfig.json with all required options
# Do not start with minimal config - include all options upfront
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    ...
  }
}
EOF

# Pattern: Validate JSON syntax before TypeScript validation
# This catches syntax errors early with clear error messages
node -e "JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8'))"

# Pattern: Show effective configuration to verify options
# This confirms TypeScript is reading the config correctly
npx tsc --showConfig

# Pattern: Use --noEmit for type checking without compilation
# This is faster and doesn't require output directory
npx tsc --noEmit

# Pattern: Verify specific compiler options
npx tsc --showConfig | jq '.compilerOptions.experimentalDecorators'
# Expected: true
```

### Integration Points

```yaml
PACKAGE_JSON:
  - depends: P1.M1.T1.S1 package.json with "type": "module"
  - respects: package.json "type": "module" for ESM
  - uses: TypeScript 5.2+ from devDependencies

NPM_SCRIPTS:
  - enables: "build": "tsc" script from package.json
  - enables: "dev": "tsx src/index.ts" script from package.json
  - enables: "watch": "nodemon --exec tsx src/index.ts" script

GROUNDSWELL:
  - requires: "experimentalDecorators": true
  - requires: "emitDecoratorMetadata": true
  - enables: @Step, @Task, @ObservedState decorators

NODE_JS:
  - target: ES2022 for Node.js 20+ compatibility
  - module: NodeNext for ESM support
  - resolution: NodeNext for proper import handling

FUTURE_TASKS:
  - P1.M1.T1.S3: Link Groundswell library (requires reflect-metadata)
  - P1.M1.T1.S4: Create src/ directory (rootDir points here)
  - P1.M1.T3.S2: Create entry point (will be type-checked with this config)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate JSON syntax
node -e "JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8'))"
# Expected: No output (successful parse)
# If errors exist, READ output and fix JSON syntax

# Validate file exists
test -f tsconfig.json && echo "tsconfig.json exists" || echo "ERROR: tsconfig.json not found"
# Expected: "tsconfig.json exists"

# Pretty-print JSON for readability (optional)
cat tsconfig.json | jq .
# Expected: Formatted JSON output

# Expected: Zero syntax errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test TypeScript version
npx tsc --version
# Expected: "Version 5.2.x" or higher

# Test configuration parsing
npx tsc --showConfig > /dev/null
# Expected: No errors (configuration is valid)

# Test specific compiler options
npx tsc --showConfig | jq -r '.compilerOptions.target'
# Expected: "ES2022"

npx tsc --showConfig | jq -r '.compilerOptions.module'
# Expected: "NodeNext"

npx tsc --showConfig | jq -r '.compilerOptions.moduleResolution'
# Expected: "NodeNext"

npx tsc --showConfig | jq -r '.compilerOptions.strict'
# Expected: "true"

npx tsc --showConfig | jq -r '.compilerOptions.experimentalDecorators'
# Expected: "true"

npx tsc --showConfig | jq -r '.compilerOptions.emitDecoratorMetadata'
# Expected: "true"

# Expected: All option values match expected output.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test: TypeScript type checking (dry run)
npx tsc --noEmit
# Expected: "error TS6012: No inputs" or similar (src/ doesn't exist yet)
# This is EXPECTED - src/ directory created in P1.M1.T1.S4
# If you get other errors (like config errors), fix them

# Test: Build script (will show "no inputs" - expected)
npm run build 2>&1 | head -5
# Expected: TypeScript compilation message or "no inputs" warning

# Test: Show effective configuration
npx tsc --showConfig
# Expected: JSON output showing all compiler options

# Verify: tsconfig.json is in project root
ls -la tsconfig.json
# Expected: tsconfig.json listed in root directory

# Verify: Configuration matches package.json ESM setting
grep -q '"type": "module"' package.json && \
grep -q '"module": "NodeNext"' tsconfig.json && \
echo "ESM configuration consistent" || echo "ERROR: ESM misconfigured"
# Expected: "ESM configuration consistent"

# Expected: All integrations working, configuration is valid.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# TypeScript Configuration Deep Validation

# 1. Verify Groundswell decorator compatibility
npx tsc --showConfig | jq -e '.compilerOptions.experimentalDecorators == true and .compilerOptions.emitDecoratorMetadata == true' > /dev/null && \
echo "✓ Groundswell decorators enabled" || \
echo "✗ ERROR: Decorator support missing"
# Expected: "✓ Groundswell decorators enabled"

# 2. Verify Node.js 20+ ESM compatibility
npx tsc --showConfig | jq -e '.compilerOptions.target == "ES2022" and .compilerOptions.module == "NodeNext"' > /dev/null && \
echo "✓ Node.js 20+ ESM configured" || \
echo "✗ ERROR: ESM misconfigured"
# Expected: "✓ Node.js 20+ ESM configured"

# 3. Verify strict mode enabled
npx tsc --showConfig | jq -e '.compilerOptions.strict == true' > /dev/null && \
echo "✓ Strict mode enabled" || \
echo "✗ ERROR: Strict mode disabled"
# Expected: "✓ Strict mode enabled"

# 4. Verify output directory configuration
npx tsc --showConfig | jq -e '.compilerOptions.outDir == "./dist" and .compilerOptions.rootDir == "./src"' > /dev/null && \
echo "✓ Output directories configured" || \
echo "✗ ERROR: Output directories misconfigured"
# Expected: "✓ Output directories configured"

# 5. Create minimal test file to verify compilation
mkdir -p src
cat > src/test-config.ts << 'EOF'
// Test ES2022 features
class TestClass {
  #privateField = 1;  // Private class fields (ES2022)
}

// Test decorators (requires experimentalDecorators)
function decorator(target: any) { }

@decorator
class DecoratedClass { }

// Test type checking
const value: string = "test";
console.log(value);
EOF

# 6. Test compile the test file
npx tsc --noEmit src/test-config.ts
# Expected: No errors (compilation successful)

# 7. Clean up test file
rm src/test-config.ts

# Expected: All creative validations pass.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 validation passed: tsconfig.json is valid JSON
- [ ] Level 2 validation passed: TypeScript 5.2+ installed
- [ ] Level 2 validation passed: All compiler options have correct values
- [ ] Level 3 validation passed: `tsc --noEmit` shows expected "no inputs" message
- [ ] Level 3 validation passed: `tsc --showConfig` displays valid configuration
- [ ] Level 4 validation passed: Groundswell decorator support verified
- [ ] Level 4 validation passed: Node.js 20+ ESM compatibility verified
- [ ] Level 4 validation passed: Strict mode enabled
- [ ] Level 4 validation passed: Output directories configured correctly

### Feature Validation

- [ ] tsconfig.json exists at /home/dustin/projects/hacky-hack/tsconfig.json
- [ ] `target` is set to "ES2022"
- [ ] `module` is set to "NodeNext"
- [ ] `moduleResolution` is set to "NodeNext"
- [ ] `strict` is set to true
- [ ] `experimentalDecorators` is set to true
- [ ] `emitDecoratorMetadata` is set to true
- [ ] `outDir` is set to "./dist"
- [ ] `rootDir` is set to "./src"
- [ ] `resolveJsonModule` is set to true
- [ ] `include` contains "src/**/*"
- [ ] `exclude` contains "node_modules" and "dist"

### Code Quality Validation

- [ ] tsconfig.json follows TypeScript best practices
- [ ] All required options for Groundswell are present
- [ ] Configuration is compatible with package.json "type": "module"
- [ ] Configuration enables npm run build script from package.json
- [ ] No unnecessary or conflicting options

### Documentation & Deployment

- [ ] Research files stored in plan/001_14b9dc2a33c7/P1M1T1S2/research/
- [ ] All references are specific with section anchors
- [ ] Known gotchas documented for future reference
- [ ] Ready for next task (P1.M1.T1.S3: Link Groundswell library)

---

## Anti-Patterns to Avoid

- **Don't** use `module: "CommonJS"` or `module: "ESNext"` (must be NodeNext for Node.js 20+)
- **Don't** skip `experimentalDecorators` and `emitDecoratorMetadata` (required for Groundswell)
- **Don't** set `noEmit: true` (we need outDir for npm run build)
- **Don't** use `moduleResolution: "node"` or `"node16"` (deprecated for ESM projects)
- **Don't** forget `"type": "module"` in package.json (tsconfig respects this)
- **Don't** skip strict mode (reduces type safety, causes runtime errors)
- **Don't** use .ts extensions in imports (use .js for ESM)
- **Don't** set `rootDir` to something other than ./src (will break build)

---

## Next Steps (After This Task)

**P1.M1.T1.S3**: Link Groundswell library locally
- Requires tsconfig.json from this task
- Will use `npm link ~/projects/groundswell`
- Will install reflect-metadata for decorator metadata

**P1.M1.T1.S4**: Set up project directory structure
- Requires tsconfig.json from this task
- Will create src/, tests/, and other directories
- rootDir in tsconfig points to ./src

**P1.M1.T3.S2**: Create entry point and hello-world workflow
- Requires tsconfig.json for type checking
- Will create src/index.ts (first TypeScript file)

---

## Additional Research References

**Stored Research Documents** (for further reading):
- `plan/001_14b9dc2a33c7/P1M1T1S2/research/tsconfig_best_practices.md` - tsconfig best practices summary
- `plan/001_14b9dc2a33c7/P1M1T1S2/research/tsconfig_validation_research.md` - Validation commands and patterns
- `plan/001_14b9dc2a33c7/docs/typescript_5.2_plus_research.md` - Comprehensive TypeScript 5.2+ features
- `plan/001_14b9dc2a33c7/architecture/groundswell_api.md` - Groundswell library API reference

**Quick Reference URLs**:
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [TypeScript 5.2 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [NodeNext Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#nodenext)

---

**PRP Version**: 1.0
**Confidence Score**: 10/10 (One-pass implementation success likelihood)
**Estimated Complexity**: Low (straightforward configuration file creation)
