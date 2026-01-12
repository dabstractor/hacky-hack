# Product Requirement Prompt: P1.M1.T1.S4 - Set up project directory structure

---

## Goal

**Feature Goal**: Create the complete project directory structure that supports TypeScript 5.2+ development with Groundswell framework, enabling source code organization, testing, and documentation.

**Deliverable**: A complete directory structure with `src/`, `tests/`, `docs/` directories and their subdirectories, plus an updated `.gitignore` file.

**Success Definition**:
- All required directories exist with proper subdirectory structure
- `.gitignore` contains patterns for build artifacts, dependencies, and session artifacts
- `npm run build` succeeds (compiles empty directories successfully)
- `npm run dev` reports missing entry point but validates project structure
- Directory structure matches `tsconfig.json` expectations (`rootDir: "./src"`)

## User Persona (if applicable)

**Target User**: Developer/Implementer - The next subtask (P1.M1.T2.S1) will create source files in this structure.

**Use Case**: Creating the foundational directory structure that all subsequent implementation tasks depend on.

**User Journey**:
1. Create directory structure using `mkdir -p` commands
2. Update `.gitignore` with additional patterns
3. Verify structure with `tree` command
4. Validate TypeScript compilation works with empty directories

**Pain Points Addressed**:
- `tsconfig.json` already specifies `rootDir: "./src"` and `include: ["src/**/*"]` - creating matching structure prevents compilation errors
- Future subtasks depend on these directories existing (e.g., P1.M1.T2.S1 creates `src/config/environment.ts`)
- Proper `.gitignore` prevents committing build artifacts and session data

## Why

- **Foundation for Development**: All source code will live in `src/` subdirectories organized by domain (core, agents, workflows, utils, config)
- **TypeScript Configuration Alignment**: The `tsconfig.json` already expects `src/` as root directory - creating it now prevents build errors
- **Testing Infrastructure**: Unit and integration test directories enable TDD workflow required by PRD
- **Documentation Organization**: Separate `docs/` directory (distinct from `plan/docs/`) for user-facing documentation
- **Git Hygiene**: Updated `.gitignore` prevents committing build artifacts, dependencies, and session artifacts

## What

Create the following directory structure and update `.gitignore`:

**Directory Structure:**
```
src/
  core/       # Core system components (SessionManager, TaskRegistry, etc.)
  agents/     # Agent implementations (Architect, Researcher, Coder, QA)
  workflows/  # Groundswell workflow implementations
  utils/      # Utility functions and helpers
  config/     # Configuration modules
tests/
  unit/       # Unit tests for individual modules
  integration/ # Integration tests for workflows
docs/         # User-facing documentation (API.md, architecture.md, etc.)
```

**Additional `.gitignore` Patterns:**
- `plan//**/artifacts/` - Temporary implementation artifacts
- TypeScript build artifacts (`*.tsbuildinfo`)
- Session-specific patterns if needed

### Success Criteria

- [ ] All directories `src/{core,agents,workflows,utils,config}` exist
- [ ] All directories `tests/{unit,integration}` exist
- [ ] Directory `docs/` exists
- [ ] `.gitignore` includes `plan//**/artifacts/` pattern
- [ ] `.gitignore` includes `*.tsbuildinfo` pattern
- [ ] `npm run build` succeeds (TypeScript compiles empty structure)
- [ ] `tree -I node_modules` shows correct structure

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Yes** - This PRP includes:
- Exact directory structure with specific paths
- Existing `.gitignore` content to preserve
- Specific patterns to add (not generic advice)
- `tsconfig.json` settings that must align
- `package.json` scripts that must work
- Expected tree output for validation
- Dependencies on previous subtasks (P1.M1.T1.S1, P1.M1.T1.S2, P1.M1.T1.S3)

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/system_context.md
  why: Defines the complete directory structure requirements for the PRP Pipeline system
  critical: Specifies that session directories (plan/001_hash/) are created dynamically, artifacts should be gitignored
  section: "Session Directory Structure" and "Key Data Structures"

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Contains patterns for organizing Groundswell-based TypeScript projects
  critical: Shows how src/ subdirectories should be organized (agents, workflows, tools, prompts)
  gotcha: Requires `experimentalDecorators: true` in tsconfig.json (already configured)

- file: /home/dustin/projects/hacky-hack/package.json
  why: Must understand existing scripts and ensure they work with new structure
  pattern: "dev": "tsx src/index.ts" - expects src/index.ts to exist (will fail until P1.M3.T2.S2 creates it)
  gotcha: The dev script will fail initially because src/index.ts doesn't exist yet - this is expected

- file: /home/dustin/projects/hacky-hack/tsconfig.json
  why: TypeScript compiler already expects src/ directory structure
  pattern: "rootDir": "./src", "include": ["src/**/*"], "outDir": "./dist"
  gotcha: If src/ doesn't exist, tsc will fail - creating it now enables successful compilation

- file: /home/dustin/projects/hacky-hack/.gitignore
  why: Must preserve existing patterns and add new ones
  pattern: Currently has node_modules/, dist/, .env, plan/*/ comment
  gotcha: Keep existing patterns, only add new ones - don't remove existing entries

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/tasks.json
  why: See dependency chain - P1.M1.T2.S1 depends on P1.M1.T1.S4 completion
  section: Lines 57-64 show P1.M1.T1.S4, lines 82 show P1.M1.T2.S1 depends on it

- docfile: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P1M1T1S3/PRP.md
  why: Previous subtask that linked Groundswell locally
  gotcha: Groundswell is now available via npm link - directory structure should support Groundswell patterns

- url: https://www.typescriptlang.org/docs/handbook/project-modules.html
  why: TypeScript best practices for organizing Node.js projects with ESM
  critical: This project uses "type": "module" in package.json - structure must support ESM

- url: https://js.langchain.com/docs/get_started/introduction
  why: Reference for how AI/agent projects structure their src/ directories
  pattern: Look for agents/, chains/, tools/, prompts/, memory/ organization
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── dist/
│   └── test-groundswell-import.js
├── .git/
├── .gitignore                    # EXISTS - needs updates
├── package.json                  # EXISTS - has "type": "module"
├── package-lock.json
├── tsconfig.json                 # EXISTS - expects src/
├── PRD.md
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/
│       │   ├── system_context.md
│       │   ├── groundswell_api.md
│       │   └── environment_config.md
│       ├── docs/
│       │   └── [research docs]
│       ├── P1M1T1S1/
│       │   └── PRP.md
│       ├── P1M1T1S2/
│       │   └── PRP.md
│       ├── P1M1T1S3/
│       │   ├── PRP.md
│       │   └── research/
│       ├── P1M1T1S4/
│       │   └── research/        # YOU ARE HERE
│       ├── prd_snapshot.md
│       └── tasks.json

# MISSING - Need to create:
├── src/                          # DOES NOT EXIST YET
│   ├── core/
│   ├── agents/
│   ├── workflows/
│   ├── utils/
│   └── config/
├── tests/                        # DOES NOT EXIST YET
│   ├── unit/
│   └── integration/
└── docs/                         # DOES NOT EXIST YET (distinct from plan/docs/)
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack/
├── dist/                         # (existing - compiled output)
├── .gitignore                    # UPDATE - add new patterns
├── package.json                  # (existing - unchanged)
├── tsconfig.json                 # (existing - unchanged)
├── PRD.md                        # (existing - unchanged)
├── src/                          # CREATE - root source directory
│   ├── core/                     # CREATE - SessionManager, TaskRegistry, PipelineController, TaskOrchestrator
│   ├── agents/                   # CREATE - ArchitectAgent, ResearcherAgent, CoderAgent, QAAgent
│   ├── workflows/                # CREATE - PRPPipeline, PhaseWorkflow, TaskWorkflow, DeltaWorkflow
│   ├── utils/                    # CREATE - fileUtils, gitUtils, validationUtils, promptUtils
│   └── config/                   # CREATE - environment.ts, models.ts
├── tests/                        # CREATE - root test directory
│   ├── unit/                     # CREATE - unit tests mirror src/ structure
│   └── integration/              # CREATE - end-to-end workflow tests
├── docs/                         # CREATE - user-facing documentation (NOT plan/docs/)
│   ├── API.md                    # FUTURE - API documentation
│   ├── architecture.md           # FUTURE - architecture overview
│   └── deployment.md             # FUTURE - deployment guide
└── plan/                         # (existing - unchanged, contains plan/ and research docs)
    └── 001_14b9dc2a33c7/
        └── ...
```

**Responsibility of Files:**
- `src/core/` - Core system components (SessionManager, TaskRegistry, PipelineController, TaskOrchestrator)
- `src/agents/` - Agent implementations (ArchitectAgent, ResearcherAgent, CoderAgent, QAAgent)
- `src/workflows/` - Groundswell workflow implementations (PRPPipeline, PhaseWorkflow, TaskWorkflow, DeltaWorkflow)
- `src/utils/` - Utility functions and helpers (fileUtils, gitUtils, validationUtils, promptUtils)
- `src/config/` - Configuration modules (environment.ts, models.ts)
- `tests/unit/` - Unit tests for individual modules (mirrors src/ structure)
- `tests/integration/` - Integration tests for workflows
- `docs/` - User-facing documentation (API.md, architecture.md, deployment.md) - distinct from `plan/docs/` which contains research

### Known Gotchas of our codebase & Library Quirks

```bash
# CRITICAL: tsconfig.json specifies "rootDir": "./src" and "include": ["src/**/*"]
# If src/ doesn't exist, running `npm run build` (which runs `tsc`) will fail
# This subtask MUST create the src/ directory structure before build can succeed

# CRITICAL: package.json has "dev": "tsx src/index.ts"
# This will fail because src/index.ts doesn't exist yet - THIS IS EXPECTED
# The index.ts file will be created in P1.M3.T2.S2 - don't try to create it here

# CRITICAL: plan/docs/ already exists for research documentation
# The new docs/ directory is for USER-FACING documentation only
# These are separate: plan/docs/ (research) vs docs/ (user docs)

# CRITICAL: Groundswell requires "experimentalDecorators": true in tsconfig.json
# This is already configured - don't modify tsconfig.json

# CRITICAL: This project uses ESM ("type": "module" in package.json)
# File extensions matter - use .js in imports when importing TypeScript files
# Example: import { Workflow } from 'groundswell.js' not 'groundswell'

# CRITICAL: Session directories (plan/001_hash/) are created dynamically
# The .gitignore should ignore plan//**/artifacts/ for temporary files
# But keep the main session structure (prd_snapshot.md, tasks.json, etc.)
```

## Implementation Blueprint

### Data models and structure

No data models needed for this subtask - purely directory structure creation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: UPDATE .gitignore with additional patterns
  - PRESERVE: All existing patterns (node_modules/, dist/, .env, IDE files, OS files)
  - ADD: TypeScript build artifact pattern (*.tsbuildinfo)
  - ADD: Session artifacts pattern (plan//**/artifacts/)
  - ADD: Test coverage pattern if desired (coverage/, test-results/)
  - LOCATION: /home/dustin/projects/hacky-hack/.gitignore
  - NAMING: Use comment sections to organize (Dependencies, Build, Environment, Session, etc.)

Task 2: CREATE src/ directory structure
  - CREATE: src/ (root source directory)
  - CREATE: src/core/ (for SessionManager, TaskRegistry, PipelineController, TaskOrchestrator)
  - CREATE: src/agents/ (for ArchitectAgent, ResearcherAgent, CoderAgent, QAAgent)
  - CREATE: src/workflows/ (for PRPPipeline, PhaseWorkflow, TaskWorkflow, DeltaWorkflow)
  - CREATE: src/utils/ (for fileUtils, gitUtils, validationUtils, promptUtils)
  - CREATE: src/config/ (for environment.ts, models.ts)
  - COMMAND: mkdir -p src/{core,agents,workflows,utils,config}
  - DEPENDENCIES: None (can run in parallel with Task 3, 4)

Task 3: CREATE tests/ directory structure
  - CREATE: tests/ (root test directory)
  - CREATE: tests/unit/ (for unit tests mirroring src/ structure)
  - CREATE: tests/integration/ (for end-to-end workflow tests)
  - COMMAND: mkdir -p tests/{unit,integration}
  - DEPENDENCIES: None

Task 4: CREATE docs/ directory
  - CREATE: docs/ (for user-facing documentation)
  - NOTE: This is DISTINCT from plan/docs/ which contains research documentation
  - COMMAND: mkdir -p docs
  - DEPENDENCIES: None

Task 5: VALIDATE directory structure with tree command
  - RUN: tree -a -I node_modules to verify all directories exist
  - VERIFY: src/{core,agents,workflows,utils,config} all present
  - VERIFY: tests/{unit,integration} present
  - VERIFY: docs/ present
  - COMPARE: Output matches "Desired Codebase Tree" above
  - DEPENDENCIES: Task 2, 3, 4 must complete first

Task 6: VALIDATE TypeScript compilation
  - RUN: npm run build (runs tsc)
  - EXPECT: Success (empty directories compile without errors)
  - IF FAILURE: Check tsconfig.json paths, ensure src/ exists
  - DEPENDENCIES: Task 2 must complete first

Task 7: VERIFY .gitignore patterns
  - RUN: cat .gitignore to verify new patterns present
  - CHECK: *.tsbuildinfo pattern exists
  - CHECK: plan//**/artifacts/ pattern exists
  - DEPENDENCIES: Task 1 must complete first
```

### Implementation Patterns & Key Details

```bash
# Pattern 1: Directory creation with single command
# Use mkdir -p to create nested directories in one command
mkdir -p src/{core,agents,workflows,utils,config}
mkdir -p tests/{unit,integration}
mkdir -p docs

# Pattern 2: .gitignore organization
# Group patterns by category with comments for clarity

# Example .gitignore structure:
# Dependencies
node_modules/

# Build Outputs
dist/
build/
*.tsbuildinfo    # <-- ADD THIS

# Environment Files
.env
.env.local

# Session Artifacts (preserve session structure, ignore temp files)
plan//**/artifacts/    # <-- ADD THIS (note double slash for wildcard matching)

# IDE Files
.vscode/
.idea/

# OS Files
.DS_Store
Thumbs.db

# Pattern 3: Verification with tree command
# Use tree to verify structure matches expected output
tree -a -I node_modules
# Should show:
# .
# ├── dist/
# ├── docs/              # <-- NEW
# ├── src/               # <-- NEW
# │   ├── agents/        # <-- NEW
# │   ├── config/        # <-- NEW
# │   ├── core/          # <-- NEW
# │   ├── utils/         # <-- NEW
# │   └── workflows/     # <-- NEW
# ├── tests/             # <-- NEW
# │   ├── integration/   # <-- NEW
# │   └── unit/          # <-- NEW
# ├── plan/
# ├── package.json
# ├── tsconfig.json
# └── .gitignore
```

### Integration Points

```yaml
TYPESCRIPT_CONFIG:
  - file: tsconfig.json
  - setting: "rootDir": "./src", "include": ["src/**/*"]
  - impact: Creating src/ directory enables tsc to succeed

PACKAGE_SCRIPTS:
  - script: "build": "tsc"
  - impact: Will succeed once src/ exists (even if empty)
  - script: "dev": "tsx src/index.ts"
  - impact: Will fail until P1.M3.T2.S2 creates src/index.ts (EXPECTED BEHAVIOR)

GIT:
  - action: .gitignore update
  - pattern: Add *.tsbuildinfo and plan//**/artifacts/

FUTURE_SUBTASKS:
  - P1.M1.T2.S1: Creates src/config/environment.ts (needs src/config/ to exist)
  - P1.M2.T1.S1: Creates task hierarchy models in src/ (needs src/ to exist)
  - P1.M3.T2.S2: Creates src/index.ts entry point (will fix "dev" script)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after .gitignore update - verify format
cat /home/dustin/projects/hacky-hack/.gitignore | grep "tsbuildinfo"
cat /home/dustin/projects/hacky-hack/.gitignore | grep "artifacts"

# Expected: Patterns are present in .gitignore

# No linting/style checks needed for directory creation
# But we do verify TypeScript compilation works:
npm run build

# Expected: Success (TypeScript compiles empty directories)
# Output: No .ts files found or similar harmless message, NO ERRORS
```

### Level 2: Directory Structure Validation (Component Validation)

```bash
# Verify all directories exist
test -d /home/dustin/projects/hacky-hack/src && echo "src/ exists"
test -d /home/dustin/projects/hacky-hack/src/core && echo "src/core/ exists"
test -d /home/dustin/projects/hacky-hack/src/agents && echo "src/agents/ exists"
test -d /home/dustin/projects/hacky-hack/src/workflows && echo "src/workflows/ exists"
test -d /home/dustin/projects/hacky-hack/src/utils && echo "src/utils/ exists"
test -d /home/dustin/projects/hacky-hack/src/config && echo "src/config/ exists"
test -d /home/dustin/projects/hacky-hack/tests/unit && echo "tests/unit/ exists"
test -d /home/dustin/projects/hacky-hack/tests/integration && echo "tests/integration/ exists"
test -d /home/dustin/projects/hacky-hack/docs && echo "docs/ exists"

# Expected: All directories exist, all tests pass

# Visual verification with tree
tree -a -I node_modules /home/dustin/projects/hacky-hack

# Expected: Tree output matches "Desired Codebase Tree" structure
```

### Level 3: Integration Testing (System Validation)

```bash
# Test TypeScript compilation with new structure
cd /home/dustin/projects/hacky-hack
npm run build

# Expected: Success (empty src/ compiles without errors)
# If tsc complains about missing files, verify tsconfig.json paths

# Test that dist/ output is clean (or doesn't exist for empty src/)
ls -la dist/

# Expected: May have existing test-groundswell-import.js, but no new compilation errors

# Verify .gitignore prevents committing artifacts
git check-ignore -v dist/test.js
git check-ignore -v *.tsbuildinfo
git check-ignore -v plan/001_14b9dc2a33c7/artifacts/temp.json

# Expected: All patterns match (git says they would be ignored)
```

### Level 4: Creative & Domain-Specific Validation

```bash
# No creative validation needed for directory structure
# But we can verify the structure aligns with Groundswell expectations

# Verify Groundswell-linked library is accessible
npm list groundswell

# Expected: Shows groundswell@ linked from ~/projects/groundswell
# This confirms the Groundswell patterns in groundswell_api.md are relevant

# Verify future subtasks can create files in expected locations
# (dry run - don't actually create files)
echo "DRY RUN: Would create src/config/environment.ts"
echo "DRY RUN: Would create tests/unit/environment.test.ts"

# Expected: Directories exist, file creation would succeed
```

## Final Validation Checklist

### Technical Validation

- [ ] All 7 implementation tasks completed successfully
- [ ] All directories exist: `src/{core,agents,workflows,utils,config}`
- [ ] All directories exist: `tests/{unit,integration}`
- [ ] Directory exists: `docs/`
- [ ] `.gitignore` updated with `*.tsbuildinfo` pattern
- [ ] `.gitignore` updated with `plan//**/artifacts/` pattern
- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] Tree output matches expected structure

### Feature Validation

- [ ] Success criterion: All src/ subdirectories created
- [ ] Success criterion: All tests/ subdirectories created
- [ ] Success criterion: docs/ directory created
- [ ] Success criterion: .gitignore includes session artifacts pattern
- [ ] Success criterion: .gitignore includes TypeScript build artifacts
- [ ] No build errors from TypeScript compiler
- [ ] Existing patterns in .gitignore preserved (not deleted)

### Code Quality Validation

- [ ] Directory structure matches system_context.md specification
- [ ] Directory structure aligns with Groundswell project patterns
- [ ] .gitignore organized with clear sections/comments
- [ ] No unintended files or directories created
- [ ] No modification to existing files (package.json, tsconfig.json, PRD.md, etc.)

### Documentation & Deployment

- [ ] Next subtask (P1.M1.T2.S1) can create files in src/config/
- [ ] Future workflow files can be placed in src/workflows/
- [ ] Test files can be placed in tests/unit and tests/integration/
- [ ] Documentation can be placed in docs/ (separate from plan/docs/)

---

## Anti-Patterns to Avoid

- ❌ Don't create src/index.ts - that's for P1.M3.T2.S2
- ❌ Don't create placeholder files (index.ts, .gitkeep, etc.) - empty directories are fine
- ❌ Don't modify tsconfig.json - it's already configured correctly
- ❌ Don't modify package.json - scripts are already set up
- ❌ Don't remove existing .gitignore patterns - only add new ones
- ❌ Don't confuse docs/ (user-facing) with plan/docs/ (research documentation)
- ❌ Don't worry that `npm run dev` fails - src/index.ts doesn't exist yet (expected)
- ❌ Don't commit .gitignore changes without first creating directories
