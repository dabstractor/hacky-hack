# Product Requirement Prompt (PRP): Initialize package.json with Dependencies

**PRP ID**: P1.M1.T1.S1
**Work Item Title**: Initialize package.json with dependencies
**Generated**: 2026-01-12
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Create a complete, production-ready `package.json` file that establishes the Node.js 20+ / TypeScript 5.2+ foundation for the PRP Pipeline project.

**Deliverable**: A `package.json` file in the project root (`/home/dustin/projects/hacky-hack/package.json`) containing:
- All required dependencies (zod for schema validation)
- All development dependencies (TypeScript 5.2+, tsx, nodemon)
- Proper npm scripts for build, dev, and watch workflows
- Node.js 20+ engine specification
- ESM configuration (`"type": "module"`)

**Success Definition**:
- `npm install` completes successfully without errors
- All npm scripts execute without errors
- Node.js version is properly enforced (>=20.0.0)
- TypeScript 5.2+ is properly installed and accessible
- tsx and nodemon can execute TypeScript files

---

## User Persona

**Target User**: Development team setting up the PRP Pipeline project foundation.

**Use Case**: Initial project setup requires establishing the package management infrastructure before any TypeScript code can be written or executed.

**User Journey**:
1. Developer clones the repository
2. Runs `npm install` to install dependencies
3. Uses `npm run dev` to start development with hot-reload
4. Uses `npm run build` to compile TypeScript
5. Uses `npm run watch` for development with automatic recompilation

**Pain Points Addressed**:
- Eliminates manual dependency installation
- Provides consistent development environment across team members
- Enforces Node.js 20+ requirement to prevent compatibility issues
- Establishes ESM foundation for modern TypeScript development

---

## Why

- **Foundation for All Future Work**: This package.json enables all subsequent tasks (tsconfig.json creation, directory structure setup, TypeScript development)
- **Modern Tooling**: Establishes tsx for fast TypeScript execution (replaces slower ts-node)
- **Schema Validation**: zod is required for structured output validation from LLM agents (critical for Architect Agent JSON parsing)
- **Type Safety**: TypeScript 5.2+ with strict mode ensures compile-time error detection
- **Developer Experience**: Hot-reload with nodemon/tsx speeds up iteration during development

---

## What

Create a `package.json` file with the following configuration:

### Package Metadata

```json
{
  "name": "hacky-hack",
  "version": "0.1.0",
  "description": "Autonomous PRP Development Pipeline - Agentic software development system",
  "type": "module",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "author": "",
  "license": "MIT"
}
```

### Dependencies

```json
{
  "dependencies": {
    "zod": "^3.22.4"
  }
}
```

**Why zod?**
- Required for Zod schemas in Architect Agent prompt (line 226 of PRD.md)
- Validates structured LLM output (task hierarchy JSON)
- Runtime type validation for all agent communications

### Dev Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.2"
  }
}
```

**Version Justification:**
- `typescript@^5.2.0`: Minimum required per PRD.md (line 162). Allows 5.2.x and compatible minor updates.
- `@types/node@^20.10.0`: Matches Node.js 20+ requirement. Version 20.10.0+ includes latest type definitions.
- `tsx@^4.7.0`: Fastest TypeScript execution using esbuild (50ms startup vs 500ms for ts-node)
- `nodemon@^3.0.2`: File watching for development (can be replaced with `tsx watch` in future)

### NPM Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "watch": "nodemon --exec tsx src/index.ts"
  }
}
```

**Script Descriptions:**
- `build`: Compiles TypeScript to JavaScript (requires tsconfig.json from P1.M1.T1.S2)
- `dev`: Executes entry point directly with tsx (fast iteration)
- `watch`: Runs tsx with nodemon for automatic restart on file changes

### Success Criteria

- [ ] `npm install` completes successfully
- [ ] `npm run build -- --version` displays TypeScript version 5.2+
- [ ] `npx tsx --version` executes successfully
- [ ] `npx nodemon --version` executes successfully
- [ ] `node --version` reports 20.x or higher
- [ ] zod is importable in TypeScript (verify with `npx tsx -e "import { z } from 'zod'; console.log(z);"`)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact npm commands to run
- Specific version requirements with justification
- Complete package.json content
- Validation commands to verify success
- Research references for all decisions

### Documentation & References

```yaml
# MUST READ - Critical for understanding Node.js 20+ / TypeScript requirements
- url: https://nodejs.org/en/blog/release/v20.0.0
  why: Node.js 20 release notes - ESM support, test runner, V8 11.3
  critical: Use "type": "module" for ESM; Node.js 20 LTS active until April 2026

- url: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
  why: TypeScript 5.2 decorators requirement for Groundswell
  critical: Groundswell uses @ObservedState(), @Step(), @Task() decorators requiring "experimentalDecorators": true

- url: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
  why: Official npm package.json documentation
  critical: "engines" field enforces Node.js 20+ requirement

- url: https://nodejs.org/api/esm.html#packages
  why: Node.js ESM "type" field documentation
  critical: Must set "type": "module" for ES modules support

- url: https://tsx.is/
  why: tsx documentation - fastest TypeScript execution
  critical: tsx uses esbuild for ~50ms startup (vs ~500ms for ts-node)

- url: https://www.npmjs.com/package/zod
  why: zod schema validation library
  critical: Required for LLM structured output validation (Architect Agent JSON parsing)

# INTERNAL RESEARCH - Stored in plan/001_14b9dc2a33c7/
- file: plan/001_14b9dc2a33c7/research/typescript_5.2_plus_research.md
  why: Comprehensive TypeScript 5.2+ features and best practices
  section: "Recommended tsconfig.json for Groundswell Project" (lines 572-597)
  gotcha: Requires "experimentalDecorators": true for Groundswell decorators

- file: plan/001_14b9dc2a33c7/architecture/nodejs_typescript_research.md
  why: Node.js 20+ specific considerations for TypeScript projects
  section: "Minimal package.json for Node.js 20 + TypeScript" (lines 759-798)
  gotcha: Use .js extensions in all import statements when using ESM

- file: /home/dustin/projects/hacky-hack/package-json-typescript-best-practices.md
  why: npm package.json best practices for 2024-2025
  section: "Complete Example" (lines 510-610)
  pattern: Follow the modern TypeScript library structure

- file: /home/dustin/projects/hacky-hack/PRD.md
  why: Master product requirements document
  section: "9.1 Technology Stack" (line 161)
  gotcha: Groundswell library will be linked locally in P1.M1.T1.S3 (not in this task)

# PROJECT STRUCTURE - Current state
- file: /home/dustin/projects/hacky-hack/.gitignore
  why: Understand existing git configuration
  pattern: Add node_modules/ to .gitignore after npm install
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── .git/
├── .gitignore
├── PRD.md                          # Master product requirements
├── PROMPTS.md                      # Critical agent prompts
├── plan/
│   └── 001_14b9dc2a33c7/
│       └── P1M1T1S1/
│           └── PRP.md             # This file
├── package.json                   # TO BE CREATED (this task)
└── node_modules/                  # CREATED BY npm install (after this task)
```

### Desired Codebase Tree (After This Task)

```bash
/home/dustin/projects/hacky-hack
├── .git/
├── .gitignore                     # Will need node_modules/ added
├── PRD.md
├── PROMPTS.md
├── plan/
│   └── 001_14b9dc2a33c7/
│       └── P1M1T1S1/
│           └── PRP.md
├── package.json                   # CREATED: Package configuration
├── package-lock.json              # CREATED: Dependency lock file
└── node_modules/                  # CREATED: Installed dependencies
    ├── .bin/
    │   ├── tsc -> ../typescript/bin/tsc
    │   ├── tsx -> ../tsx/bin/cli.js
    │   └── nodemon -> ../nodemon/bin/nodemon.js
    ├── zod/                       # Schema validation library
    ├── typescript/                # TypeScript compiler
    ├── @types/node/               # Node.js type definitions
    ├── tsx/                       # Fast TypeScript executor
    └── nodemon/                   # File watcher
```

### Known Gotchas & Library Quirks

```bash
# CRITICAL: Node.js 20+ requires "type": "module" for ESM support
# Without this, import statements will fail with "SyntaxError: Cannot use import statement"
# Source: https://nodejs.org/api/esm.html#packages

# CRITICAL: TypeScript 5.2+ decorators require "experimentalDecorators": true in tsconfig.json
# This is for Groundswell's @ObservedState(), @Step(), @Task() decorators
# Source: https://www.typescriptlang.org/docs/handbook/decorators.html

# CRITICAL: tsx is much faster than ts-node (50ms vs 500ms startup)
# Uses esbuild for on-the-fly compilation
# Source: https://tsx.is/

# CRITICAL: When using ESM with TypeScript, import paths must use .js extensions
# Even though source files are .ts, imports use .js because TypeScript compiles to .js
# Example: import { foo } from './bar.js' (not './bar.ts')
# Source: https://www.typescriptlang.org/docs/handbook/modules/reference.html#nodenext

# CRITICAL: Groundswell library linking happens in P1.M1.T1.S3
# Do NOT add groundswell to dependencies in this task
# Groundswell is at ~/projects/groundswell (local library)
# Source: PRD.md line 163

# CRITICAL: zod version must be ^3.22.4 or higher for TypeScript 5.2+ compatibility
# Earlier versions have type inference issues with strict mode
# Source: https://www.npmjs.com/package/zod

# GOTCHA: npm version must be >=10.0.0 for best package.json v3 support
# Node.js 20+ ships with npm 10+, but verify with `npm --version`
# Source: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#engines
```

---

## Implementation Blueprint

### Data Models and Structure

**No data models required** - This task creates infrastructure (package.json), not application code.

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: VERIFY Node.js and npm versions
  - RUN: node --version
  - EXPECT: v20.x.x or higher (e.g., v20.11.1)
  - RUN: npm --version
  - EXPECT: 10.x.x or higher (e.g., 10.2.4)
  - IF FAILS: Error message directing user to install Node.js 20 LTS
  - NO DEPENDENCIES

Task 2: CREATE package.json in project root
  - LOCATION: /home/dustin/projects/hacky-hack/package.json
  - CONTENT: Full package.json with all fields (see "Complete package.json Content" below)
  - METHOD: npm init -y (then edit) OR direct file creation
  - NAMING: Standard npm package.json format
  - DEPENDENCIES: Task 1 must pass

Task 3: INSTALL dependencies
  - RUN: npm install
  - EXPECT: node_modules/ created with all packages
  - EXPECT: package-lock.json created
  - VERIFY: Check zod, typescript, tsx, nodemon in node_modules/
  - DEPENDENCIES: Task 2 must complete

Task 4: UPDATE .gitignore
  - ADD: node_modules/ to .gitignore
  - ADD: package-lock.json to .gitignore (optional, depends on team preference)
  - VERIFY: .gitignore exists and contains node_modules/
  - DEPENDENCIES: Task 3 must complete

Task 5: VERIFY npm scripts
  - RUN: npm run build -- --version
  - EXPECT: TypeScript version 5.2.x displayed
  - RUN: npx tsx --version
  - EXPECT: tsx version displayed
  - RUN: npx nodemon --version
  - EXPECT: nodemon version displayed
  - DEPENDENCIES: Task 3 must complete

Task 6: VERIFY zod import
  - RUN: npx tsx -e "import { z } from 'zod'; console.log('Zod version:', z.ZodString.name);"
  - EXPECT: No errors, "Zod version: ZodString" output
  - DEPENDENCIES: Task 3 must complete
```

### Complete package.json Content

```json
{
  "name": "hacky-hack",
  "version": "0.1.0",
  "description": "Autonomous PRP Development Pipeline - Agentic software development system",
  "type": "module",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "watch": "nodemon --exec tsx src/index.ts"
  },
  "keywords": [
    "typescript",
    "agent",
    "pipeline",
    "autonomous"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "nodemon": "^3.0.2",
    "tsx": "^4.7.0",
    "typescript": "^5.2.0"
  }
}
```

### Implementation Patterns & Key Details

```bash
# Pattern: Use npm init -y for quick scaffolding
npm init -y
# This creates a basic package.json with:
# - name (from directory name)
# - version "1.0.0"
# - description ""
# - main "index.js"
# - scripts: { "test": "echo \"Error: no test specified\" && exit 1" }
# - keywords []
# - author ""
# - license "ISC"

# Pattern: Edit package.json to add required fields
# Use a JSON-aware editor or npm set commands
npm set type="module"
npm set engines.node=">=20.0.0"
npm set engines.npm=">=10.0.0"

# Pattern: Install dependencies with version ranges
npm install zod                    # Adds to dependencies
npm install --save-dev typescript@^5.2.0 @types/node tsx nodemon
# ^5.2.0 means: compatible with 5.2.x, will auto-update to 5.3.x, 5.4.x etc.

# Pattern: Verify installation
ls node_modules/                    # Should list: zod, typescript, @types, tsx, nodemon
cat package-lock.json | grep '"zod"'  # Should show exact version locked
```

### Integration Points

```yaml
NO DATABASE INTEGRATION:
  - This task has no database requirements
  - Data persistence handled in later phases (P3.M1.T1)

NO ROUTE INTEGRATION:
  - This task has no API routes
  - CLI entry point created in P5.M4.T2

FUTURE DEPENDENCY (P1.M1.T1.S3):
  - Groundswell library will be linked via `npm link ../groundswell`
  - Do NOT add groundswell to dependencies in this task
  - Location: ~/projects/groundswell

CONFIG INTEGRATION (P1.M1.T2):
  - Environment variables will be managed in future task
  - No config files required in this task
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate package.json syntax
cat package.json | node -e "console.log('Valid JSON');"
# Expected: "Valid JSON" (no parse errors)

# Validate npm can read package.json
npm pkg get name
# Expected: "hacky-hack"

# Validate package.json is valid npm format
npm install --dry-run
# Expected: Shows what would be installed, no errors

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test Node.js version requirement
node --version | grep -E "v20\."
# Expected: Version string starting with "v20."

# Test npm version requirement
npm --version | grep -E "^10\."
# Expected: Version string starting with "10."

# Test TypeScript installation
npx tsc --version
# Expected: "Version 5.2.x" or higher

# Test tsx installation
npx tsx --version
# Expected: "tsx CLI v4.7.x" or higher

# Test nodemon installation
npx nodemon --version
# Expected: "3.0.x" or higher

# Expected: All tests pass. If failing, check installation logs.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test: npm install completes successfully
npm install
# Expected: "added X packages" message, no errors

# Test: node_modules/ directory created
ls node_modules/ | grep -E "(zod|typescript|tsx|nodemon)"
# Expected: All four packages listed

# Test: package-lock.json created
test -f package-lock.json && echo "Lock file exists" || echo "ERROR: Lock file missing"
# Expected: "Lock file exists"

# Test: zod can be imported in TypeScript
npx tsx -e "import { z } from 'zod'; console.log('SUCCESS: Zod imported');"
# Expected: "SUCCESS: Zod imported"

# Test: TypeScript can compile (will fail without tsconfig.json, but should run)
npm run build 2>&1 | head -5
# Expected: Error about tsconfig.json (expected - will be created in P1.M1.T1.S2)

# Expected: All integrations working, proper package resolution
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Package.json Structure Validation
npm pkg get type
# Expected: "module" (confirms ESM enabled)

npm pkg get engines
# Expected: "{\"node\":\">=20.0.0\",\"npm\":\">=10.0.0\"}"

npm pkg get scripts
# Expected: Contains "build", "dev", "watch" keys

# Dependency Version Verification
npm pkg get dependencies.zod
# Expected: "^3.22.4" or compatible version

npm pkg get devDependencies.typescript
# Expected: "^5.2.0" or compatible 5.x version

# Groundswell NOT in dependencies (future task)
npm pkg get dependencies | grep -v groundswell
# Expected: No output (groundswell should not be present)

# Engine Enforcement Test (create temporary package.json with wrong version)
# This verifies the "engines" field is properly set
npm pkg get engines.node
# Expected: ">=20.0.0" (will be enforced by npm/node in production)

# Expected: All creative validations pass, package.json follows best practices
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 validation passed: package.json is valid JSON
- [ ] Level 2 validation passed: Node.js 20+ and npm 10+ installed
- [ ] Level 2 validation passed: TypeScript 5.2+, tsx, nodemon all accessible
- [ ] Level 3 validation passed: npm install completed successfully
- [ ] Level 3 validation passed: node_modules/ contains all required packages
- [ ] Level 3 validation passed: zod can be imported via tsx
- [ ] Level 4 validation passed: "type": "module" set correctly
- [ ] Level 4 validation passed: engines field specifies Node.js 20+
- [ ] Level 4 validation passed: scripts contain build, dev, watch

### Feature Validation

- [ ] package.json exists at /home/dustin/projects/hacky-hack/package.json
- [ ] package-lock.json exists (for reproducible builds)
- [ ] zod dependency installed (for LLM output validation)
- [ ] TypeScript 5.2+ installed (for type checking)
- [ ] tsx installed (for fast TypeScript execution)
- [ ] nodemon installed (for file watching)
- [ ] npm run build -- --version shows TypeScript 5.2+
- [ ] npm run dev fails with "no such file" (expected - src/index.ts doesn't exist yet)
- [ ] .gitignore updated with node_modules/

### Code Quality Validation

- [ ] package.json follows npm best practices (proper fields, valid JSON)
- [ ] Version ranges use caret (^) for compatible updates
- [ ] No unnecessary dependencies (only what's specified in task)
- [ ] Engines field enforces Node.js 20+ requirement
- [ ] ESM enabled via "type": "module"

### Documentation & Deployment

- [ ] package.json name, description, license fields populated
- [ ] All npm scripts are functional
- [ ] No placeholder values in critical fields
- [ ] Ready for next task (P1.M1.T1.S2: Create TypeScript configuration)

---

## Anti-Patterns to Avoid

- **Don't** install ts-node (tsx is faster and recommended for Node.js 20+)
- **Don't** add groundswell to dependencies (will be linked locally in P1.M1.T1.S3)
- **Don't** use exact versions for dependencies (use ^ ranges except for TypeScript if stability preferred)
- **Don't** forget to set "type": "module" (required for ESM support in Node.js 20+)
- **Don't** skip the engines field (enforces Node.js 20+ requirement)
- **Don't** use legacy CommonJS patterns (this project uses ESM)
- **Don't** install testing frameworks yet (testing setup in P5.M3.T1)
- **Don't** add ESLint/Prettier yet (linting setup in P1.M3.T1)

---

## Next Steps (After This Task)

**P1.M1.T1.S2**: Create TypeScript configuration (tsconfig.json)
- Requires package.json from this task
- Will configure TypeScript 5.2+ for Node.js 20+ ESM
- Will enable experimental decorators for Groundswell

**P1.M1.T1.S3**: Link Groundswell library locally
- Requires package.json from this task
- Will use `npm link ~/projects/groundswell`
- Groundswell dependency NOT added in this task

**P1.M1.T1.S4**: Set up project directory structure
- Requires package.json and tsconfig.json from previous tasks
- Will create src/, tests/, plan/ directories
- Will establish module structure

---

## Additional Research References

**Stored Research Documents** (for further reading):
- `/home/dustin/projects/hacky-hack/package-json-typescript-best-practices.md` - Comprehensive npm package.json guide
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/research/typescript_5.2_plus_research.md` - TypeScript 5.2+ features
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/nodejs_typescript_research.md` - Node.js 20+ considerations

**Quick Reference URLs**:
- [npm package.json docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [TypeScript 5.2 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
- [Node.js 20 release notes](https://nodejs.org/en/blog/release/v20.0.0)
- [tsx documentation](https://tsx.is/)
- [zod documentation](https://zod.dev/)

---

**PRP Version**: 1.0
**Confidence Score**: 10/10 (One-pass implementation success likelihood)
**Estimated Complexity**: Low (straightforward npm project initialization)
