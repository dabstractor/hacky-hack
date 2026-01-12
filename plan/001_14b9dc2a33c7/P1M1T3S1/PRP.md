# PRP: Configure ESLint and Prettier

**PRP ID**: P1M1T3S1
**Parent Task**: P1.M1.T3 - Set Up Build and Development Tooling
**Status**: Ready for Implementation
**Confidence Score**: 9/10

---

## Goal

**Feature Goal**: Establish automated code quality enforcement through ESLint (linting) and Prettier (formatting) for the hacky-hack TypeScript project.

**Deliverable**: Working linting and formatting configuration with `npm run lint` and `npm run format` commands that:

- Lint all TypeScript files with type-aware rules
- Format code consistently with project conventions
- Integrate with existing build/test workflow
- Provide clear, actionable error messages

**Success Definition**:

- `npm run lint` runs successfully with zero errors
- `npm run lint:fix` auto-fixes all fixable issues
- `npm run format` formats all files according to config
- `npm run format:check` validates formatting without changes
- Existing codebase passes linting after initial fixes
- Scripts are integrated with prebuild validation

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact versions to install
- Complete configuration file contents
- Specific npm scripts to add
- Current project patterns to follow
- Common pitfalls and their solutions
- Validation commands that work in this project

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://typescript-eslint.io/getting-started/
  why: Official TypeScript-ESLint setup guide with parser configuration
  critical: Use ES2022, NodeNext, strict mode - matches project tsconfig.json

- url: https://typescript-eslint.io/rules/
  why: Complete list of TypeScript-specific ESLint rules
  critical: no-floating-promises, no-misused-promises for async safety

- url: https://prettier.io/docs/en/options.html
  why: All Prettier configuration options explained
  critical: semi, trailingComma, singleQuote settings

- url: https://github.com/prettier/eslint-config-prettier
  why: Disables conflicting ESLint rules - prevents format/lint conflicts
  critical: MUST be last in extends array

- url: https://github.com/prettier/eslint-plugin-prettier
  why: Runs Prettier as ESLint rule for unified reporting
  critical: Enables 'prettier/prettier' error rule

- file: /home/dustin/projects/hacky-hack/package.json
  why: Current project dependencies and scripts - add new scripts here
  pattern: TypeScript 5.2.0, vitest for testing, "type": "module"
  gotcha: Project uses ESM - ensure sourceType: "module" in ESLint config

- file: /home/dustin/projects/hacky-hack/tsconfig.json
  why: TypeScript compiler configuration - ESLint must match
  pattern: ES2022 target, NodeNext modules, strict: true
  gotcha: parserOptions.project must point to this file

- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: Example of current code style - 2-space indent, single quotes, semicolons
  pattern: JSDoc comments, export function, consistent spacing
  gotcha: Import uses .js extension (NodeNext requirement)

- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Test file patterns - should have relaxed linting rules
  pattern: describe(), it(), vi.stubEnv(), beforeEach/afterEach
  gotcha: Tests use vitest globals - need env override

- file: /home/dustin/projects/hacky-hack/.gitignore
  why: Patterns to exclude from linting
  pattern: dist/, coverage/, node_modules/, *.min.js
  gotcha: Add .eslintcache to gitignore if using caching

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T3S1/research/eslint-research.md
  why: Complete ESLint configuration reference for this project
  section: Configuration Option A: Legacy .eslintrc.json (ESLint 8)

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T3S1/research/prettier-research.md
  why: Prettier configuration with ESLint integration
  section: Integration with ESLint - Option 2: With Prettier Plugin

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T3S1/research/npm-scripts-research.md
  why: Npm script patterns and CI/CD integration
  section: Project-Specific Recommendations - Recommended Scripts for hacky-hack
```

### Current Codebase Tree (relevant paths only)

```bash
hacky-hack/
├── package.json              # MODIFY: Add scripts and devDependencies
├── tsconfig.json             # REFERENCE: ES2022, NodeNext, strict mode
├── .gitignore                # REFERENCE: Patterns to exclude
├── src/
│   ├── config/
│   │   ├── constants.ts      # REFERENCE: Current code style
│   │   ├── environment.ts    # REFERENCE: Current code style
│   │   └── types.ts          # REFERENCE: Current code style
│   ├── agents/               # EMPTY: Future agent code
│   ├── core/                 # EMPTY: Future core code
│   ├── scripts/
│   │   └── validate-api.ts   # REFERENCE: Existing script pattern
│   └── utils/                # EMPTY: Future utilities
└── tests/
    ├── integration/
    │   └── *.test.ts         # REFERENCE: Test file patterns
    ├── unit/
    │   └── config/
    │       └── *.test.ts     # REFERENCE: Test file patterns
    └── validation/
        └── *.test.ts         # REFERENCE: Test file patterns
```

### Desired Codebase Tree with files to be added

```bash
hacky-hack/
├── package.json              # MODIFY: Add lint/format scripts
├── .eslintrc.json            # CREATE: ESLint configuration
├── .eslintignore             # CREATE: ESLint ignore patterns
├── .prettierrc               # CREATE: Prettier configuration
├── .prettierignore           # CREATE: Prettier ignore patterns
├── .eslintcache              # CREATE: Auto-generated by ESLint cache
└── (existing files unchanged)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: TypeScript 5.2 + NodeNext module resolution requires .js extensions
// Example: import { foo } from './bar.js' even though file is bar.ts
// ESLint parser MUST have sourceType: "module" and ecmaVersion: 2022

// CRITICAL: Project uses strict mode in tsconfig.json
// ESLint should use plugin:@typescript-eslint/recommended-requiring-type-checking
// This enables type-aware rules but requires parserOptions.project to be set

// CRITICAL: Vitest globals enabled in tsconfig.json (types: ["vitest/globals"])
// Test files need env override with "vitest/globals": true in ESLint config
// Without this, describe/it/test will be reported as undefined

// CRITICAL: Prettier MUST be integrated with eslint-config-prettier
// Place "prettier" or "plugin:prettier/recommended" LAST in extends array
// This disables conflicting ESLint formatting rules

// GOTCHA: Type-aware linting is SLOW (requires full TypeScript compilation)
// For initial setup, consider using only recommended rules
// Enable type-checked rules after basic configuration is working

// GOTCHA: .gitignore already excludes dist/, coverage/, node_modules/
// Mirror these patterns in .eslintignore and .prettierignore

// GOTCHA: Project uses "type": "module" in package.json
// ESLint parserOptions must have sourceType: "module"

// GOTCHA: TypeScript compile errors may prevent ESLint from running
// Run tsc --noEmit first to ensure code compiles before linting
```

---

## Implementation Blueprint

### Data models and structure

No new data models for this task. Configuration files use JSON format.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: INSTALL dev dependencies via npm
  - INSTALL: eslint, prettier, @typescript-eslint/parser, @typescript-eslint/eslint-plugin
  - INSTALL: eslint-config-prettier, eslint-plugin-prettier
  - USE version command: npm install --save-dev eslint@^8.57.0 prettier@^3.2.0 @typescript-eslint/parser@^7.0.0 @typescript-eslint/eslint-plugin@^7.0.0 eslint-config-prettier@^9.1.0 eslint-plugin-prettier@^5.1.0
  - VERIFY: Check package.json devDependencies section
  - DEPENDENCIES: None (first task)
  - WORKING_DIR: /home/dustin/projects/hacky-hack

Task 2: CREATE .eslintrc.json configuration file
  - IMPLEMENT: ESLint configuration with TypeScript parser and Prettier integration
  - FILE: /home/dustin/projects/hacky-hack/.eslintrc.json
  - CONTENT: See "Implementation Patterns & Key Details" section below
  - INCLUDE: parserOptions with project: "./tsconfig.json", tsconfigRootDir: "./"
  - INCLUDE: extends array ending with "plugin:prettier/recommended"
  - INCLUDE: overrides for test files with vitest/globals env
  - DEPENDENCIES: Task 1 (packages must be installed)
  - GOTCHA: plugin:prettier/recommended MUST be last in extends array

Task 3: CREATE .eslintignore file
  - IMPLEMENT: Ignore patterns for build artifacts and dependencies
  - FILE: /home/dustin/projects/hacky-hack/.eslintignore
  - CONTENT: node_modules/, dist/, coverage/, *.config.js, .eslintcache
  - PATTERN: One pattern per line, use trailing slashes for directories
  - DEPENDENCIES: None (can be done in parallel with Task 2)

Task 4: CREATE .prettierrc configuration file
  - IMPLEMENT: Prettier formatting rules matching current code style
  - FILE: /home/dustin/projects/hacky-hack/.prettierrc
  - CONTENT: See "Implementation Patterns & Key Details" section below
  - INCLUDE: semi: true, singleQuote: true, trailingComma: "es5", printWidth: 80
  - DEPENDENCIES: Task 1 (prettier must be installed)

Task 5: CREATE .prettierignore file
  - IMPLEMENT: Ignore patterns matching .eslintignore
  - FILE: /home/dustin/projects/hacky-hack/.prettierignore
  - CONTENT: node_modules/, dist/, coverage/, package-lock.json
  - DEPENDENCIES: None (can be done in parallel with Task 4)

Task 6: MODIFY package.json scripts section
  - ADD: "lint": "eslint . --ext .ts"
  - ADD: "lint:fix": "eslint . --ext .ts --fix"
  - ADD: "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\""
  - ADD: "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\""
  - ADD: "validate": "npm run lint && npm run format:check"
  - MODIFY: "prebuild": "npm run validate" (if exists) or add it
  - PRESERVE: All existing scripts (build, dev, watch, test, validate:api)
  - FILE: /home/dustin/projects/hacky-hack/package.json
  - DEPENDENCIES: Tasks 1-5 (configuration files must exist)

Task 7: VALIDATE configuration with test run
  - RUN: npm run lint (expect some errors from existing code)
  - RUN: npm run lint:fix (auto-fix what's possible)
  - RUN: npm run format (format all files)
  - RUN: npm run format:check (should pass after format)
  - VERIFY: ESLint runs without configuration errors
  - VERIFY: Prettier formats files without errors
  - DEPENDENCIES: Task 6 (scripts must be added)
```

### Implementation Patterns & Key Details

```json
// ============================================
// FILE: .eslintrc.json (complete content)
// ============================================
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "tsconfigRootDir": "./"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "no-undef": "off",
    "no-unused-vars": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.spec.ts", "tests/**/*.ts"],
      "env": {
        "vitest/globals": true
      },
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    }
  ],
  "ignorePatterns": ["node_modules/", "dist/", "coverage/", "*.config.js"]
}
```

```json
// ============================================
// FILE: .prettierrc (complete content)
// ============================================
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

```bash
# ============================================
# FILE: .eslintignore (complete content)
# ============================================
node_modules/
dist/
coverage/
*.config.js
.eslintcache
```

```bash
# ============================================
# FILE: .prettierignore (complete content)
# ============================================
node_modules/
dist/
coverage/
package-lock.json
pnpm-lock.yaml
.eslintcache
```

```json
// ============================================
# ADD to package.json scripts section
# ============================================
{
  "scripts": {
    // EXISTING SCRIPTS - PRESERVE THESE
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "watch": "nodemon --exec tsx src/index.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "validate:api": "tsx src/scripts/validate-api.ts",

    // NEW SCRIPTS - ADD THESE
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",
    "validate": "npm run lint && npm run format:check",
    "prebuild": "npm run validate"
  }
}
```

### Integration Points

```yaml
PACKAGE.JSON:
  - add to: scripts section
  - preserve: All existing scripts (build, dev, watch, test, test:run, test:coverage, validate:api)
  - add: lint, lint:fix, format, format:check, validate, prebuild
  - pattern: Scripts are alphabetically ordered after adding

GITIGNORE:
  - add: .eslintcache (ESLint cache file)
  - reason: Speeds up subsequent lint runs by caching results

VITEST CONFIG:
  - reference: tests/ directory uses vitest/globals
  - integration: ESLint override for test files enables vitest/globals env

BUILD PIPELINE:
  - prebuild hook: Runs validate (lint + format:check) before build
  - ensures: Code quality checked before TypeScript compilation
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After Task 1: Verify packages installed
npm list eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier
# Expected: All packages listed with installed versions

# After Task 2: Verify ESLint config syntax
cat .eslintrc.json | python3 -m json.tool
# Expected: Valid JSON, no syntax errors

# After Task 4: Verify Prettier config syntax
cat .prettierrc | python3 -m json.tool
# Expected: Valid JSON, no syntax errors

# After Task 6: Verify package.json syntax
cat package.json | python3 -m json.tool
# Expected: Valid JSON, no syntax errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test ESLint configuration
npx eslint --print-config .eslintrc.json
# Expected: Full configuration printed, no errors

# Test Prettier configuration
npx prettier --check .prettierrc
# Expected: No errors (file is valid)

# Test lint script on existing code
npm run lint
# Expected: ESLint runs, reports existing issues (if any)
# If "Cannot find parser" error: packages not installed correctly
# If "file not found" error: check tsconfig.json path in parserOptions

# Test format script
npm run format
# Expected: Prettier formats files, reports changes made
```

### Level 3: Integration Testing (System Validation)

```bash
# Full lint cycle with auto-fix
npm run lint:fix
# Expected: Auto-fixable issues resolved, some may remain manual

# Format all files
npm run format
# Expected: All files reformatted to match .prettierrc

# Validate formatting (should pass after format)
npm run format:check
# Expected: All files formatted correctly, exit code 0

# Validate both lint and format
npm run validate
# Expected: Both lint and format:check pass

# Verify prebuild integration
npm run build
# Expected: validate runs before build, then TypeScript compiles

# Verify TypeScript still compiles
npm run build
# Expected: dist/ directory populated with compiled JS

# Verify tests still run
npm run test:run
# Expected: All tests pass (test files should have relaxed rules)
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test with intentional code issues
cat > test-lint.ts << 'EOF'
const unused = 1
const obj = {a:1,b:2}
console.log('test')
EOF
npm run lint -- test-lint.ts
# Expected: Reports unused variable, formatting issues

# Clean up test file
rm test-lint.ts

# Check for ESLint cache creation
ls -la .eslintcache
# Expected: Cache file created after first lint run

# Test with vitest test files (should allow globals)
cat > test-vitest.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';

describe('test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
EOF
npm run lint -- test-vitest.test.ts
# Expected: No errors about describe/it being undefined

# Clean up test file
rm test-vitest.test.ts

# Verify formatting matches existing style
npm run format && git diff
# Expected: Minimal changes to existing files (project already follows similar style)

# Performance check (type-aware linting is slower)
time npm run lint
# Expected: Completes in reasonable time (< 30 seconds for this codebase)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All dev dependencies installed: `npm list | grep -E "(eslint|prettier)"`
- [ ] .eslintrc.json exists and is valid JSON
- [ ] .prettierrc exists and is valid JSON
- [ ] .eslintignore exists with node_modules/, dist/, coverage/
- [ ] .prettierignore exists with node_modules/, dist/, coverage/
- [ ] package.json has new scripts: lint, lint:fix, format, format:check, validate
- [ ] `npm run lint` executes without configuration errors
- [ ] `npm run lint:fix` auto-fixes issues
- [ ] `npm run format` formats files
- [ ] `npm run format:check` validates formatting
- [ ] `npm run validate` runs both lint and format:check
- [ ] `npm run build` triggers prebuild validation
- [ ] Existing tests still pass: `npm run test:run`

### Feature Validation

- [ ] ESLint parser uses @typescript-eslint/parser
- [ ] ESLint config extends plugin:@typescript-eslint/recommended
- [ ] ESLint config extends plugin:prettier/recommended (last in array)
- [ ] Parser options include project: "./tsconfig.json" and tsconfigRootDir: "./"
- [ ] Test files have vitest/globals env override
- [ ] Prettier config has semi: true, singleQuote: true, trailingComma: "es5"
- [ ] Current code style is preserved after formatting
- [ ] No ESLint/Prettier rule conflicts (eslint-config-prettier working)

### Code Quality Validation

- [ ] Configuration follows TypeScript-ESLint best practices
- [ ] ESLint rules match project strict mode settings
- [ ] Prettier settings match existing code style (2-space, single quotes, semicolons)
- [ ] Ignore patterns exclude build artifacts and dependencies
- [ ] Type-aware rules enabled for better error detection
- [ ] Test files have appropriately relaxed rules

### Documentation & Deployment

- [ ] Configuration files are self-documenting (clear structure)
- [ ] No hardcoded paths that would break in different environments
- [ ] ESLint cache configured for performance (.eslintcache ignored by git)

---

## Anti-Patterns to Avoid

- **Don't use ESLint 9 flat config yet** - Use legacy .eslintrc.json format for stability
- **Don't forget tsconfigRootDir** - Without this, type-aware linting fails in subdirectories
- **Don't place prettier config first** - Must be LAST in extends array to disable conflicting rules
- **Don't use --fix with Prettier** - Let Prettier handle formatting, ESLint handle linting
- **Don't ignore all warnings** - Use --max-warnings 0 in CI, but allow locally for development
- **Don't skip test file overrides** - Without vitest/globals env, test files will error on describe/it
- **Don't use trailingComma: "all"** - Use "es5" for better compatibility
- **Don't hardcode absolute paths** - Use "./" relative paths for portability
- **Don't enable type-aware rules initially if performance is poor** - Start with recommended, add type-checked after working
- **Don't forget to run tsc --noEmit** - TypeScript compile errors prevent ESLint from working properly
