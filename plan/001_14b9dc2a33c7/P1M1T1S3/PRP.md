name: "P1.M1.T1.S3: Link Groundswell Library Locally"
description: |

---

## Goal

**Feature Goal**: Establish local development linkage to the Groundswell library at `~/projects/groundswell`, enabling TypeScript imports and compilation with full type support.

**Deliverable**:
1. Groundswell library linked via `npm link` with verifiable symlink in `node_modules/groundswell`
2. Groundswell added to `package.json` dependencies
3. TypeScript compilation succeeds with Groundswell imports
4. Test file (`src/test-groundswell-import.ts`) validates import functionality

**Success Definition**:
- `ls -la node_modules/groundswell` shows symlink pointing to `~/projects/groundswell`
- `npm list groundswell` shows groundswell@0.0.1 linked
- `npm run build` (TypeScript compilation) succeeds without errors
- Test import file compiles and executes successfully

## User Persona

**Target User**: Developer setting up the hacky-hack project for local development

**Use Case**: Developer needs to import and use Groundswell classes (Workflow, Agent, Prompt, MCPHandler) in the TypeScript codebase

**User Journey**:
1. Developer runs `npm link` commands
2. Developer verifies symlink exists in node_modules
3. Developer adds test import to validate TypeScript compilation
4. Developer runs build to confirm everything works

**Pain Points Addressed**:
- Resolves module not found errors for Groundswell imports
- Enables full TypeScript type checking for Groundswell APIs
- Allows local development with live Groundswell changes

## Why

- **Business value**: Enables the entire PRP Pipeline implementation which depends on Groundswell's workflow orchestration
- **Technical foundation**: All subsequent tasks (P1.M2, P2, P3) require working Groundswell imports
- **Problems solved**: Without this link, any `import { Workflow } from 'groundswell'` will fail with "Module not found"

## What

Link the local Groundswell library at `~/projects/groundswell` to the hacky-hack project using npm link, enabling TypeScript ESM imports with full type support.

### Success Criteria

- [ ] Symlink exists at `node_modules/groundswell` pointing to `~/projects/groundswell`
- [ ] `npm list groundswell` confirms linked package
- [ ] TypeScript compiles successfully with `import { Workflow } from 'groundswell'`
- [ ] Test file `src/test-groundswell-import.ts` compiles and can be executed

## All Needed Context

### Context Completeness Check

_Passes "No Prior Knowledge" test: An implementer with no knowledge of this codebase has everything needed to link the Groundswell library locally._

### Documentation & References

```yaml
# MUST READ - Groundswell Library API
- file: ~/projects/groundswell/package.json
  why: Contains package name (groundswell), version, exports field, and main entry point
  pattern: ES module configuration with "type": "module" and exports field

- file: ~/projects/groundswell/src/index.ts
  why: Contains all exported classes (Workflow, Agent, Prompt, MCPHandler) and factory functions
  pattern: Named exports for TypeScript imports

- file: /home/dustin/projects/hacky-hack/package.json
  why: Existing project configuration with "type": "module" and dependencies section
  pattern: Where to add groundswell dependency

- file: /home/dustin/projects/hacky-hack/tsconfig.json
  why: TypeScript configuration using NodeNext module resolution
  pattern: moduleResolution: "NodeNext" requires proper package.json exports

- docfile: plan/001_14b9dc2a33c7/P1M1T1S3/research/npm_link_research.md
  why: Complete npm link workflow, verification methods, and best practices
  section: Complete step-by-step workflow

- docfile: plan/001_14b9dc2a33c7/P1M1T1S3/research/typescript_esm_research.md
  why: TypeScript ESM import patterns, moduleResolution: NodeNext behavior
  section: ESM Imports and Build Considerations

- docfile: plan/001_14b9dc2a33c7/P1M1T1S3/research/npm_link_troubleshooting.md
  why: Common issues and solutions for npm link with TypeScript
  section: Type Resolution Issues and Module Resolution Errors

- docfile: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Complete Groundswell API reference with import examples
  section: Core Exports and import patterns

- url: https://docs.npmjs.com/cli/v10/commands/npm-link
  why: Official npm link documentation
  critical: Two-step process: link globally in source, then link locally in target

- url: https://www.typescriptlang.org/docs/handbook/module-resolution.html
  why: TypeScript module resolution with NodeNext
  critical: NodeNext requires "type": "module" in package.json

- url: https://nodejs.org/api/esm.html
  why: Node.js ESM import behavior
  critical: Package imports don't require file extensions
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── node_modules/
│   └── (existing dependencies: zod, typescript, tsx, etc.)
├── package.json          # "type": "module", dependencies: { zod }
├── tsconfig.json         # moduleResolution: "NodeNext"
├── PRD.md
├── PROMPTS.md
└── plan/
    └── 001_14b9dc2a33c7/
        └── architecture/
            └── groundswell_api.md
```

### Desired Codebase Tree (after implementation)

```bash
/home/dustin/projects/hacky-hack
├── node_modules/
│   ├── groundswell -> ~/projects/groundswell  # SYMLINK (NEW)
│   └── (existing dependencies)
├── package.json          # Updated with "groundswell" dependency (MODIFIED)
├── tsconfig.json         # No changes needed
├── src/
│   └── test-groundswell-import.ts  # Test import file (NEW)
└── plan/
    └── 001_14b9dc2a33c7/
        └── architecture/
            └── groundswell_api.md
```

### Known Gotchas & Library Quirks

```bash
# CRITICAL: Groundswell must be built before linking
# Groundswell's dist/ directory must exist with compiled JS and .d.ts files
# Without build: imports will fail with "Cannot find module"

# CRITICAL: npm link is TWO commands in TWO directories
# First: cd ~/projects/groundswell && npm link  (creates global link)
# Second: cd /home/dustin/projects/hacky-hack && npm link groundswell

# CRITICAL: TypeScript uses package.json "exports" field for module resolution
# Groundswell exports: ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }
# Import must be: import { Workflow } from 'groundswell' (no extension, no subpath)

# CRITICAL: moduleResolution: "NodeNext" requires "type": "module" in BOTH packages
# Both packages already have "type": "module" - no action needed

# GOTCHA: On Windows, npm link requires administrator privileges or developer mode
# For Windows: Run terminal as Administrator or enable Developer Mode

# GOTCHA: TypeScript compilation requires declaration files (.d.ts)
# Groundswell generates these with "declaration": true in tsconfig.json
# Verify ~/projects/groundswell/dist/index.d.ts exists after build

# GOTCHA: npm link creates a symlink to the SOURCE directory, not dist/
# TypeScript resolves via package.json exports field to dist/index.js
# The symlink itself points to ~/projects/groundswell (the package root)

# GOTCHA: Changes in Groundswell require rebuild
# After modifying Groundswell source: cd ~/projects/groundswell && npm run build
# TypeScript will pick up changes in hacky-hack on next build
```

## Implementation Blueprint

### Data Models and Structure

No new data models required. This is a build/linking task.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: BUILD Groundswell library
  - EXECUTE: cd ~/projects/groundswell && npm run build
  - VERIFY: ls ~/projects/groundswell/dist/ contains index.js and index.d.ts
  - GOTCHA: Build MUST complete before linking; TypeScript needs compiled output
  - TIMEOUT: 30 seconds typical

Task 2: CREATE global npm link for Groundswell
  - EXECUTE: cd ~/projects/groundswell && npm link
  - VERIFY: npm list -g --depth=0 | grep groundswell shows global link
  - LOCATION: Creates symlink at {npm global prefix}/lib/node_modules/groundswell
  - GOTCHA: May require sudo if npm global prefix is system directory
  - PREFIX CHECK: npm config get prefix (shows global install location)

Task 3: LINK groundswell into hacky-hack project
  - EXECUTE: cd /home/dustin/projects/hacky-hack && npm link groundswell
  - VERIFY: ls -la node_modules/groundswell shows symlink to ~/projects/groundswell
  - PLACEMENT: Creates node_modules/groundswell symlink
  - GOTCHA: Must be run from hacky-hack directory

Task 4: VERIFY symlink integrity
  - EXECUTE: ls -la node_modules/groundswell
  - EXPECT: lrwxrwxrwx ... groundswell -> /home/dustin/projects/groundswell
  - EXECUTE: readlink -f node_modules/groundswell
  - EXPECT: /home/dustin/projects/groundswell
  - EXECUTE: npm list groundswell
  - EXPECT: groundswell@0.0.1 -> ~/projects/groundswell

Task 5: CREATE test import file
  - CREATE: src/test-groundswell-import.ts
  - CONTENT: |
      // Test all major Groundswell imports
      import { Workflow, Agent, Prompt, MCPHandler } from 'groundswell';
      import { createAgent, createPrompt, createWorkflow } from 'groundswell';
      import { Step, Task, ObservedState } from 'groundswell';
      import type { WorkflowStatus, AgentConfig } from 'groundswell';

      console.log('Groundswell imports successful!');
      console.log('Workflow:', typeof Workflow);
      console.log('Agent:', typeof Agent);
      console.log('All major exports verified.');
  - NAMING: test-groundswell-import.ts (descriptive, indicates purpose)

Task 6: VERIFY TypeScript compilation
  - EXECUTE: npm run build (or npx tsc)
  - EXPECT: No errors, generates dist/test-groundswell-import.js
  - GOTCHA: Compilation errors indicate module resolution issues
  - COMMON ERROR: "Cannot find module 'groundswell'" means symlink not working

Task 7: VERIFY runtime execution
  - EXECUTE: npx tsx src/test-groundswell-import.ts
  - EXPECT: Output shows "Groundswell imports successful!"
  - GOTCHA: Runtime failures indicate different issues than compile-time
```

### Implementation Patterns & Key Details

```bash
# CRITICAL COMMAND SEQUENCE - Must be executed in order

# 1. Build Groundswell (generate dist/ with compiled output)
cd ~/projects/groundswell && npm run build

# 2. Create global symlink from Groundswell
cd ~/projects/groundswell && npm link
# Result: ~/.nvm/versions/node/v20.x.x/lib/node_modules/groundswell -> ~/projects/groundswell

# 3. Link groundswell into hacky-hack project
cd /home/dustin/projects/hacky-hack && npm link groundswell
# Result: node_modules/groundswell -> ~/.nvm/versions/node/v20.x.x/lib/node_modules/groundswell

# 4. Verify symlink chain
readlink -f node_modules/groundswell
# Expected: /home/dustin/projects/groundswell

# VERIFICATION COMMANDS

# Check npm link status
npm list groundswell
# Expected: groundswell@0.0.1 -> ~/projects/groundswell

# Check symlink
ls -la node_modules/groundswell
# Expected: lrwxrwxrwx ... groundswell -> /home/dustin/.nvm/versions/node/v20.x.x/lib/node_modules/groundswell

# Check Groundswell dist exists
ls ~/projects/groundswell/dist/
# Expected: index.js, index.d.ts, and other compiled files

# TypeScript compile check
npx tsc --noEmit
# Expected: No errors

# Full build
npm run build
# Expected: Compiles src/ to dist/ with no errors
```

### Integration Points

```yaml
PACKAGE_JSON:
  - location: package.json dependencies section
  - add: "groundswell": "file:../groundswell" OR linked via npm link (npm adds automatically)
  - note: npm link typically adds the dependency to package.json automatically

TSCONFIG:
  - no changes needed - already configured for NodeNext
  - existing: "module": "NodeNext", "moduleResolution": "NodeNext"

ENVIRONMENT:
  - no new environment variables required
  - Groundswell uses ANTHROPIC_API_KEY if running agents (not needed for linking)

NEXT_TASKS:
  - P1.M1.T1.S4 (directory structure) will use Groundswell imports
  - P2 (Core Agent System) depends on this task
```

## Validation Loop

### Level 1: Link Verification (Immediate Feedback)

```bash
# After Task 1: Verify Groundswell build
ls ~/projects/groundswell/dist/
# EXPECTED: index.js, index.d.ts present
# IF FAILS: Run npm run build in Groundswell directory

# After Task 2: Verify global link
npm list -g --depth=0 | grep groundswell
# EXPECTED: groundswell@0.0.1
# IF FAILS: npm link failed - check permissions, rerun with sudo if needed

# After Task 3: Verify local symlink
ls -la node_modules/groundswell
# EXPECTED: symlink (lrwxrwxrwx) pointing to global groundswell
# IF FAILS: Link not created - verify npm link groundswell was run in correct directory

# After Task 4: Verify symlink integrity
readlink -f node_modules/groundswell
# EXPECTED: /home/dustin/projects/groundswell
# IF FAILS: Broken symlink - unlink and retry npm link process

npm list groundswell
# EXPECTED: groundswell@0.0.1 -> ~/projects/groundswell
# IF FAILS: Package not properly linked
```

### Level 2: TypeScript Compilation (Component Validation)

```bash
# Test import syntax check
npx tsc --noEmit src/test-groundswell-import.ts
# EXPECTED: No errors
# COMMON ERRORS:
# - "Cannot find module 'groundswell'" -> Symlink not working, check node_modules
# - "Cannot find module './dist/index.js'" -> Groundswell not built, run npm run build in Groundswell
# - "Has no export named 'Workflow'" -> Wrong import, check Groundswell src/index.ts

# Full project build
npm run build
# EXPECTED: Clean build with no errors
# IF FAILS: Check tsconfig.json moduleResolution matches package.json type

# Verify declaration files are accessible
npx tsc --showConfig | grep moduleResolution
# EXPECTED: "moduleResolution": "node16" or "nodenext"
# IF WRONG: tsconfig.json misconfigured
```

### Level 3: Runtime Validation (System Validation)

```bash
# Execute test file
npx tsx src/test-groundswell-import.ts
# EXPECTED OUTPUT:
# Groundswell imports successful!
# Workflow: function
# Agent: function
# All major exports verified.
# IF FAILS: Runtime import error - different from compile error

# Verify TypeScript can resolve the module
node -e "console.log(require.resolve('groundswell'))"
# EXPECTED: /home/dustin/projects/hacky-hack/node_modules/groundswell/dist/index.js
# Note: May not work in ESM mode - use tsx instead

# Quick import test (one-liner)
npx tsx -e "import { Workflow } from 'groundswell'; console.log(typeof Workflow);"
# EXPECTED: function
# IF FAILS: Module resolution issue at runtime
```

### Level 4: Edge Case Validation

```bash
# Test that all major exports are accessible
npx tsx -e "
import { Workflow, Agent, Prompt, MCPHandler } from 'groundswell';
import { createAgent, createPrompt, createWorkflow } from 'groundswell';
import { Step, Task, ObservedState } from 'groundswell';
console.log('All exports:', typeof Workflow, typeof Agent, typeof createAgent);
"
# EXPECTED: All exports are 'function' or 'object'
# IF FAILS: Some exports missing from Groundswell build

# Verify type imports work
npx tsx -e "import type { WorkflowStatus } from 'groundswell'; console.log('Type import OK');"
# EXPECTED: Type import OK
# IF FAILS: Declaration files not being resolved

# Test subpath resolution (if Groundswell adds subpath exports later)
# Currently Groundswell only exports main entry point

# Verify symlink is not broken
test -L node_modules/groundswell && echo "Symlink OK" || echo "NOT A SYMLINK"
# EXPECTED: Symlink OK
# IF FAILS: node_modules/groundswell is not a symlink

# Verify symlink target exists
test -e ~/projects/groundswell/package.json && echo "Target exists" || echo "Target missing"
# EXPECTED: Target exists
# IF FAILS: Groundswell directory was moved/deleted

# Test that changes in Groundswell require rebuild
# 1. Modify ~/projects/groundswell/src/index.ts (add console.log)
# 2. cd ~/projects/groundswell && npm run build
# 3. cd /home/dustin/projects/hacky-hack && npx tsx src/test-groundswell-import.ts
# EXPECTED: Changes reflected after rebuild
# IF FAILS: Caching issue, may need to restart TypeScript server
```

## Final Validation Checklist

### Technical Validation

- [ ] Groundswell built successfully: `~/projects/groundswell/dist/` exists with `index.js` and `index.d.ts`
- [ ] Global npm link created: `npm list -g | grep groundswell` shows package
- [ ] Local symlink created: `ls -la node_modules/groundswell` shows symlink
- [ ] Symlink integrity: `readlink -f node_modules/groundswell` points to `~/projects/groundswell`
- [ ] npm list confirms: `npm list groundswell` shows `groundswell@0.0.1 -> ~/projects/groundswell`

### Feature Validation

- [ ] Test file created: `src/test-groundswell-import.ts` exists
- [ ] TypeScript compiles: `npm run build` succeeds with no errors
- [ ] All imports work: Workflow, Agent, Prompt, MCPHandler, createAgent, createPrompt, createWorkflow
- [ ] Runtime executes: `npx tsx src/test-groundswell-import.ts` runs successfully
- [ ] Type declarations resolve: TypeScript provides autocomplete for Groundswell exports

### Code Quality Validation

- [ ] Test file uses correct import syntax: `import { Workflow } from 'groundswell'` (no extension)
- [ ] No relative imports to Groundswell: All imports use package name
- [ ] node_modules is clean: Only groundswell symlink added, no duplicates

### Documentation & Deployment

- [ ] package.json updated: npm link may have added groundswell to dependencies
- [ ] No environment variables added: This task doesn't require new env vars
- [ ] git ignores node_modules: Symlink is properly ignored (no commit needed)

---

## Anti-Patterns to Avoid

- **Don't** use relative imports like `import { Workflow } from '../../groundswell/src'` - defeats npm link purpose
- **Don't** add file extensions to package imports: `import { Workflow } from 'groundswell/index.js'` is wrong
- **Don't** skip building Groundswell - TypeScript needs compiled output in dist/
- **Don't** skip global link step - `npm link groundswell` alone won't work without first linking globally from source
- **Don't** commit node_modules/groundswell - the symlink is local and should be gitignored
- **Don't** use `npm install ../groundswell` - this copies instead of linking, changes won't be reflected
- **Don't** forget to rebuild Groundswell after changes - the link points to source, but compiled output must be updated
- **Don't** run npm link from wrong directory - first command must be in ~/projects/groundswell, second in hacky-hack
