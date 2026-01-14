# PRP: P1.M1.T1.S6 - Document Groundswell Link Setup in README

---

## Goal

**Feature Goal**: Add a `documentGroundswellReadme()` function that conditionally appends Groundswell npm link setup instructions to the project README.md, but only when S5's `npm list` verification reports `linked: true`.

**Deliverable**: A documented function in `src/utils/groundswell-linker.ts` that:
1. Consumes `NpmListVerifyResult` from S5 as input
2. Conditionally executes: only writes to README when `linked === true`
3. Creates/updates README.md with "## Local Development with Groundswell" section
4. Returns `ReadmeUpdateResult` with status information

**Success Definition**:
- Function exists and follows all S1-S5 patterns (conditional execution, structured result, error handling)
- README.md is created (if missing) or updated (if exists) with proper Groundswell setup documentation
- Documentation follows existing README.md formatting patterns (H2 headers, code blocks, tables)
- Unit tests pass with 100% coverage of all branches
- Function gracefully handles file system errors (permission denied, disk full, etc.)

## User Persona

**Target User**: Developers working on the hacky-hack codebase who need to set up their local development environment with the Groundswell dependency.

**Use Case**: A developer clones the hacky-hack repository and needs to understand how to link the local Groundswell package for development. The README should provide clear, executable instructions.

**User Journey**:
1. Developer clones repository
2. Reads README.md "Local Development with Groundswell" section
3. Follows commands to link Groundswell locally
4. Verifies setup with provided verification commands
5. Proceeds with development

**Pain Points Addressed**:
- Without documentation, developers must search codebase or ask teammates how to set up Groundswell
- Missing documentation leads to repeated setup questions and onboarding friction
- Inconsistent setup instructions across team members

## Why

- **Business Value**: Reduces onboarding time for new developers; prevents "module not found" errors from incorrect setup
- **Integration**: Completes P1.M1.T1 (Establish Groundswell npm link) by documenting the final step
- **Problems Solved**: Provides single source of truth for Groundswell setup; documents the workflow that S1-S5 just automated

## What

Add a `documentGroundswellReadme()` function to `src/utils/groundswell-linker.ts` that:

1. **Conditional Execution**: Only runs when `previousResult.linked === true`
2. **README Existence Check**: Tests if `README.md` exists at project root
3. **Create or Update**: Uses `Write` tool if README doesn't exist; uses `Edit` tool if it does
4. **Section Content**: Appends "## Local Development with Groundswell" section with:
   - Prerequisites (groundswell package location)
   - Step-by-step npm link commands
   - Verification commands
   - Troubleshooting table
5. **Structured Result**: Returns `ReadmeUpdateResult` with `updated`, `path`, `message`, `error` fields

### Success Criteria

- [ ] `documentGroundswellReadme()` function exists in `src/utils/groundswell-linker.ts`
- [ ] Function takes `NpmListVerifyResult` as first parameter
- [ ] Function returns `ReadmeUpdateResult` interface
- [ ] Conditional execution: skips when `linked === false`
- [ ] Creates README.md if it doesn't exist (using `Write` tool)
- [ ] Updates README.md if it exists (using `Edit` tool)
- [ ] Appends "## Local Development with Groundswell" section
- [ ] Documentation includes: prerequisites, link commands, verification, troubleshooting
- [ ] Unit tests cover: happy path, conditional skip, file system errors, README exists/not exists
- [ ] All tests pass with 100% coverage
- [ ] JSDoc documentation with examples

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:
- Exact file paths and line numbers for all patterns to follow
- Complete interface definitions for input (S5) and output (S6)
- README.md formatting patterns with specific header levels and code block styles
- File operation patterns from existing groundswell-linker.ts functions
- External documentation URLs for npm link best practices
- Troubleshooting content from architecture/external_deps.md

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://docs.npmjs.com/cli/v10/commands/npm-link
  why: Official npm link documentation for accurate command syntax
  critical: Always use `npm link` from package directory first, then `npm link <package>` in consumer

- url: https://nodejs.org/api/cli.html#--preserve-symlinks
  why: Node.js symlink preservation flag for TypeScript projects
  critical: TypeScript requires `preserveSymlinks: true` in tsconfig.json for symlink resolution

- file: /home/dustin/projects/hacky-hack/README.md
  why: Existing README structure and formatting patterns to follow
  pattern: H2 headers (##), fenced code blocks with language specifiers, tables for options
  gotcha: README uses "## Development" section at line 416 - append new section after this

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/architecture/external_deps.md
  why: Source of truth for Groundswell setup instructions and troubleshooting
  section: Lines 61-79 (npm link strategy), Lines 351-361 (troubleshooting)
  pattern: Use exact commands from this document in the README section

- file: /home/dustin/projects/hacky-hack/src/utils/groundswell-linker.ts
  why: Implementation patterns for all S1-S5 functions; S6 must follow these exactly
  pattern: Conditional execution pattern (lines ~750-760), structured result interfaces, error handling
  gotcha: All functions use `DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack'` constant

- file: /home/dustin/projects/hacky-hack/src/utils/groundswell-linker.ts
  why: NpmListVerifyResult interface definition (S5 output, S6 input)
  section: Lines 200-221
  pattern: Result interfaces have: boolean status field, message string, optional error, debug fields (stdout/stderr)
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── README.md                      # Target file for documentation (exists)
├── package.json
├── src/
│   └── utils/
│       └── groundswell-linker.ts  # Add documentGroundswellReadme() here
├── tests/
│   └── unit/
│       └── utils/
│           └── groundswell-linker.test.ts  # Add tests here
└── plan/
    └── 001_14b9dc2a33c7/
        └── bugfix/
            └── 001_7f5a0fab4834/
                └── P1M1T1S6/
                    └── PRP.md
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack/
├── README.md                      # EXISTING - Will be UPDATED with new section
├── src/
│   └── utils/
│       └── groundswell-linker.ts  # EXISTING - ADD: documentGroundswellReadme(), ReadmeUpdateResult
└── tests/
    └── unit/
        └── utils/
            └── groundswell-linker.test.ts  # EXISTING - ADD: test suite for documentGroundswellReadme()
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use Write tool when file doesn't exist, Edit tool when it does
// Pattern from README task description: "Use Write tool if file doesn't exist, Edit if it does"
import { Write, Edit } from 'claude-ai-tools';  // Hypothetical import pattern

// CRITICAL: All groundswell-linker functions use DEFAULT_PROJECT_PATH constant
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack';
const README_PATH = `${DEFAULT_PROJECT_PATH}/README.md`;

// CRITICAL: Conditional execution pattern - skip if previous step failed
// From verifyGroundswellNpmList() lines 750-760:
if (!previousResult.linked) {
  return {
    linked: false,  // For S6: updated: false
    message: 'Skipped: Groundswell not linked by npm list verification',
    // ... other fields
  };
}

// CRITICAL: README.md already exists with "## Development" section at line 416
// GOTCHA: Don't overwrite existing content - APPEND new section
// Pattern: Use Edit tool to append after existing content

// GOTCHA: TypeScript requires preserveSymlinks for symlink resolution
// Must document this in tsconfig.json section

// GOTCHA: npm link requires two-step process:
// 1. In groundswell dir: npm link (creates global symlink)
// 2. In hacky-hack dir: npm link groundswell (consumes global symlink)
// Document BOTH steps in README
```

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Result type for documentGroundswellReadme() function
 *
 * @remarks
 * Indicates whether README.md was created/updated with Groundswell setup docs.
 * Only writes when previousResult.linked === true.
 *
 * @example
 * // Success case - README updated
 * {
 *   updated: true,
 *   path: '/home/dustin/projects/hacky-hack/README.md',
 *   message: 'README.md updated with Groundswell setup documentation',
 *   error: undefined
 * }
 *
 * @example
 * // Skipped case - Groundswell not linked
 * {
 *   updated: false,
 *   path: '/home/dustin/projects/hacky-hack/README.md',
 *   message: 'Skipped: Groundswell not linked, not documenting setup',
 *   error: undefined
 * }
 */
export interface ReadmeUpdateResult {
  /** Whether README.md was created or updated */
  updated: boolean;

  /** Absolute path to README.md */
  path: string;

  /** Human-readable status message */
  message: string;

  /** Error message if update failed */
  error?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: DEFINE ReadmeUpdateResult interface in src/utils/groundswell-linker.ts
  - ADD: ReadmeUpdateResult interface after NpmListVerifyResult (around line 222)
  - FOLLOW pattern: NpmListVerifyResult structure (lines 200-221)
  - FIELDS: updated: boolean, path: string, message: string, error?: string
  - JSDOC: Include @remarks, @example for success/skipped/error cases
  - EXPORT: Export interface for use by tests and consumers

Task 2: DEFINE README content constant in src/utils/groundswell-linker.ts
  - ADD: GROUNDSWELL_README_SECTION constant with markdown content
  - LOCATION: After NpmListVerifyOptions interface (around line 240)
  - CONTENT: "## Local Development with Groundswell" section with:
    - Prerequisites subsection
    - Setup commands (from external_deps.md lines 63-72)
    - Verification commands (from external_deps.md lines 75-78)
    - Troubleshooting table (from external_deps.md lines 353-361)
  - FORMAT: Follow existing README patterns (H2, H3, code blocks, tables)

Task 3: IMPLEMENT documentGroundswellReadme() function
  - ADD: Function after verifyGroundswellNpmList() (around line 920)
  - SIGNATURE: async function documentGroundswellReadme(previousResult: NpmListVerifyResult, options?: ReadmeUpdateOptions): Promise<ReadmeUpdateResult>
  - LOCATION: src/utils/groundswell-linker.ts
  - DEPENDENCIES: Import fs.promises for file existence check
  - PATTERN: Follow conditional execution pattern from verifyGroundswellNpmList (lines 750-760)

Task 4: IMPLEMENT conditional execution logic
  - CHECK: if (!previousResult.linked) return { updated: false, ... }
  - MESSAGE: "Skipped: Groundswell not linked by npm list verification"
  - FOLLOW: Pattern from verifyGroundswellNpmList (lines 750-760)
  - RETURN: ReadmeUpdateResult with updated: false, explanatory message

Task 5: IMPLEMENT README existence check
  - USE: fs.promises.access(README_PATH, fs.constants.F_OK)
  - CATCH: ENOENT means file doesn't exist (use Write tool)
  - SUCCESS: File exists (use Edit tool)
  - ERROR: Handle EACCES (permission denied), other errors

Task 6: IMPLEMENT README creation with Write tool (when doesn't exist)
  - USE: Write tool for new file creation
  - CONTENT: Use GROUNDSWELL_README_SECTION constant as initial content
  - GOTCHA: New README should include basic headers + Groundswell section
  - RETURN: { updated: true, path: README_PATH, message: 'README.md created with Groundswell documentation' }

Task 7: IMPLEMENT README update with Edit tool (when exists)
  - USE: Edit tool to append GROUNDSWELL_README_SECTION
  - FIND: Last line of existing README (license end)
  - APPEND: Add "\n" + GROUNDSWELL_README_SECTION
  - GOTCHA: Don't duplicate if section already exists (check for "## Local Development with Groundswell")
  - RETURN: { updated: true, path: README_PATH, message: 'README.md updated with Groundswell documentation' }

Task 8: IMPLEMENT error handling
  - CATCH: fs.promises.access() errors (EACCES, ENOSPC, etc.)
  - RETURN: { updated: false, path: README_PATH, message: '...', error: error.message }
  - CODES: EACCES (permission denied), ENOSPC (disk full), EROFS (read-only filesystem)
  - FOLLOW: Pattern from verifyGroundswellSymlink() error handling

Task 9: ADD comprehensive JSDoc documentation
  - INCLUDE: @param description for previousResult and options
  - INCLUDE: @returns Promise<ReadmeUpdateResult> description
  - INCLUDE: @example showing happy path and skipped path
  - INCLUDE: @remarks explaining conditional execution and README creation/update logic

Task 10: CREATE test file tests/unit/utils/groundswell-linker-document-readme.test.ts
  - CREATE: New test file for documentGroundswellReadme function
  - FOLLOW: Pattern from existing groundswell-linker.test.ts (AAA, describe/it, vi.mock)
  - IMPORT: documentGroundswellReadme, ReadmeUpdateResult, vi, expect, describe, it, beforeEach
  - MOCK: fs.promises.access, fs.promises.readFile, Write tool, Edit tool

Task 11: IMPLEMENT happy path test (README exists, linked=true)
  - ARRANGE: Mock fs.promises.access() to resolve (file exists)
  - ARRANGE: Mock Edit tool to succeed
  - ACT: Call documentGroundswellReadme({ linked: true, ... })
  - ASSERT: Return { updated: true, path: '/home/dustin/projects/hacky-hack/README.md' }
  - ASSERT: Edit tool called with correct arguments

Task 12: IMPLEMENT skip test (linked=false)
  - ARRANGE: previousResult with linked: false
  - ACT: Call documentGroundswellReadme({ linked: false, ... })
  - ASSERT: Return { updated: false, ... } with skip message
  - ASSERT: fs.promises.access NOT called (early return)

Task 13: IMPLEMENT README not exists test (linked=true, no README)
  - ARRANGE: Mock fs.promises.access() to reject with ENOENT
  - ARRANGE: Mock Write tool to succeed
  - ACT: Call documentGroundswellReadme({ linked: true, ... })
  - ASSERT: Return { updated: true, ... } with created message
  - ASSERT: Write tool called, Edit tool NOT called

Task 14: IMPLEMENT error handling tests
  - TEST: EACCES (permission denied) - return updated: false with error
  - TEST: ENOSPC (disk full) - return updated: false with error
  - TEST: Generic fs error - return updated: false with error
  - ASSERT: Error messages are descriptive

Task 15: VERIFY all tests pass with 100% coverage
  - RUN: npm test -- tests/unit/utils/groundswell-linker-document-readme.test.ts
  - VERIFY: All tests pass
  - CHECK: Coverage is 100% for documentGroundswellReadme
```

### Implementation Patterns & Key Details

```typescript
// CRITICAL: Conditional execution pattern - skip if previous step failed
async function documentGroundswellReadme(
  previousResult: NpmListVerifyResult,
  options?: ReadmeUpdateOptions
): Promise<ReadmeUpdateResult> {
  // PATTERN: Early return on conditional check (from verifyGroundswellNpmList line 750-760)
  if (!previousResult.linked) {
    return {
      updated: false,
      path: README_PATH,
      message: 'Skipped: Groundswell not linked by npm list verification',
    };
  }

  // PATTERN: File existence check with fs.promises.access()
  // GOTCHA: Access check can throw - handle ENOENT vs other errors
  let readmeExists: boolean;
  try {
    await fs.promises.access(README_PATH, fs.constants.F_OK);
    readmeExists = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      readmeExists = false;
    } else {
      // Real error (permission denied, disk full, etc.)
      return {
        updated: false,
        path: README_PATH,
        message: `Failed to check README existence: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  }

  // PATTERN: Use Write tool for new file, Edit tool for existing
  if (!readmeExists) {
    // Create new README with Write tool
    await writeTool({
      file_path: README_PATH,
      content: generateFullReadmeContent(),  // Includes basic headers + Groundswell section
    });
    return {
      updated: true,
      path: README_PATH,
      message: 'README.md created with Groundswell setup documentation',
    };
  }

  // Update existing README with Edit tool
  // GOTCHA: Check if section already exists to avoid duplication
  const existingContent = await fs.promises.readFile(README_PATH, 'utf-8');
  if (existingContent.includes('## Local Development with Groundswell')) {
    return {
      updated: false,
      path: README_PATH,
      message: 'README.md already contains Groundswell documentation',
    };
  }

  await editTool({
    file_path: README_PATH,
    old_string: existingContent.slice(-100),  // Last 100 chars to append after
    new_string: existingContent.slice(-100) + '\n\n' + GROUNDSWELL_README_SECTION,
  });

  return {
    updated: true,
    path: README_PATH,
    message: 'README.md updated with Groundswell setup documentation',
  };
}

// CRITICAL: README section content constant
const GROUNDSWELL_README_SECTION = `
## Local Development with Groundswell

This project depends on the \`groundswell\` library for AI agent orchestration, workflow management, and MCP tool integration. For local development, \`groundswell\` is linked via \`npm link\` rather than installed from the npm registry.

### Prerequisites

- Groundswell package located at \`~/projects/groundswell\`
- Groundswell must be built (\`npm run build\`) before linking

### Setup

\`\`\`bash
# From groundswell directory (creates global symlink)
cd ~/projects/groundswell
npm link

# From hacky-hack directory (consumes global symlink)
cd ~/projects/hacky-hack
npm link groundswell
\`\`\`

### Verification

\`\`\`bash
# Verify symlink exists in node_modules
ls -la node_modules/groundswell

# Verify npm recognizes the linked package
npm list groundswell --json

# Verify TypeScript compilation
npm run typecheck
\`\`\`

### Troubleshooting

| Problem | Solution |
| ------- | -------- |
| Cannot find module 'groundswell' | Run \`npm link\` from groundswell directory first |
| Changes not reflected | Rebuild groundswell with \`npm run build\` |
| TypeScript compilation fails | Ensure \`preserveSymlinks: true\` in tsconfig.json |
| Permission denied (EACCES) | Use nvm instead of system npm, or fix permissions |
`;
```

### Integration Points

```yaml
FILESYSTEM:
  - operation: "Check README.md existence with fs.promises.access()"
  - path: "/home/dustin/projects/hacky-hack/README.md"
  - error_codes: "ENOENT (not exists), EACCES (permission), ENOSPC (disk full)"

TOOLS:
  - use: "Write tool for new README creation"
  - use: "Edit tool for existing README update"
  - note: "Both tools are hypothetical - actual implementation may use fs.promises.writeFile"

CONSTANTS:
  - add_to: "src/utils/groundswell-linker.ts"
  - pattern: "const README_PATH = \`\${DEFAULT_PROJECT_PATH}/README.md\`"
  - value: "Use existing DEFAULT_PROJECT_PATH constant"

S5_CONSUMPTION:
  - input: "NpmListVerifyResult from verifyGroundswellNpmList()"
  - field: "previousResult.linked determines conditional execution"
  - pattern: "All S1-S6 functions consume previous step's result"

TEST:
  - create: "tests/unit/utils/groundswell-linker-document-readme.test.ts"
  - pattern: "AAA (Arrange, Act, Assert), describe/it, vi.mock"
  - mock: "fs.promises.access, fs.promises.readFile, Write/Edit tools"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- src/utils/groundswell-linker.ts   # Lint the modified file
npm run typecheck                                 # Type check entire project
npm run format -- src/utils/groundswell-linker.ts # Format with Prettier

# Project-wide validation
npm run lint                                      # Lint all source files
npm run typecheck                                 # Type check entire project
npm run format                                    # Format all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common TypeScript errors:
# - TS2307: Cannot find module 'fs' -> import { promises as fs } from 'fs'
# - TS2304: Cannot find name 'Write' -> define tool wrapper or use fs.promises.writeFile
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new function specifically
npm test -- tests/unit/utils/groundswell-linker-document-readme.test.ts

# Test all groundswell-linker functions
npm test -- tests/unit/utils/groundswell-linker.test.ts

# Full test suite for utils
npm test -- tests/unit/utils/

# Coverage validation (100% required)
npm run test:coverage -- tests/unit/utils/groundswell-linker-document-readme.test.ts

# Expected: All tests pass. Look for:
# - PASS src/utils/groundswell-linker.test.ts (existing tests)
# - PASS tests/unit/utils/groundswell-linker-document-readme.test.ts (new tests)
# - Coverage: 100% for documentGroundswellReadme function

# If failing, debug root cause:
# - Check mock setup (vi.mock, vi.fn)
# - Verify async/await handling (use async test functions)
# - Check error simulation (throw Error with .code property for errno)
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual test: Run the full S1-S6 workflow
# Create a test script that calls all functions in sequence

# 1. Verify Groundswell exists (S1)
node -e "const { verifyGroundswellExists } = require('./dist/utils/groundswell-linker.js'); verifyGroundswellExists().then(console.log);"

# 2-6. Run through S2-S6 (this tests S6 integration)
npm run dev -- --prd ./plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S6/PRP.md --scope P1.M1.T1

# Verify README.md was updated
cat README.md | grep -A 20 "## Local Development with Groundswell"

# Expected output: The Groundswell section should be present with all content

# Clean up for re-testing
git checkout README.md  # Reset to test again

# Expected: All integrations working, README.md contains new section
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Documentation Quality Validation:

# 1. Test README instructions manually (follow your own documentation)
cd ~/projects/groundswell && npm link && cd ~/projects/hacky-hack && npm link groundswell

# 2. Verify all commands in README section execute successfully
ls -la node_modules/groundswell           # Should show symlink ->
npm list groundswell --json              # Should show linked version
npm run typecheck                         # Should compile

# 3. Verify troubleshooting table is accurate
# Test each "Problem" scenario and verify "Solution" works

# 4. Check README formatting
# - Headers use correct level (## for main section, ### for subsections)
# - Code blocks have language specifiers (```bash, ```typescript)
# - Table formatting is correct (| headers |)
# - No trailing whitespace
# - Consistent indentation

# 5. Verify documentation completeness
# - All commands from external_deps.md are included
# - TypeScript tsconfig.json requirement is documented
# - Verification commands are provided
# - Troubleshooting covers common issues

# 6. Test with fresh clone (simulate new developer)
cd /tmp && git clone <repo> test-hacky-hack && cd test-hacky-hack
# Follow README instructions - should work without errors

# Expected: Documentation is accurate, complete, and follows project patterns
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/`
- [ ] No linting errors: `npm run lint -- src/utils/groundswell-linker.ts`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format -- src/utils/groundswell-linker.ts --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Conditional execution: Skips when `linked === false`
- [ ] Creates README.md when it doesn't exist
- [ ] Updates README.md when it exists
- [ ] Documentation includes: prerequisites, commands, verification, troubleshooting
- [ ] README.md follows existing formatting patterns
- [ ] Error cases handled: EACCES, ENOSPC, EROFS

### Code Quality Validation

- [ ] Follows existing S1-S5 patterns in groundswell-linker.ts
- [ ] Uses DEFAULT_PROJECT_PATH constant
- [ ] Returns ReadmeUpdateResult with all required fields
- [ ] JSDoc documentation with @param, @returns, @example, @remarks
- [ ] Unit tests cover: happy path, skip path, create, update, errors
- [ ] 100% test coverage achieved

### Documentation & Deployment

- [ ] README.md "## Local Development with Groundswell" section is present
- [ ] All npm link commands are accurate and tested
- [ ] Troubleshooting table covers common issues
- [ ] TypeScript `preserveSymlinks` requirement is documented
- [ ] Cross-reference to external_deps.md if appropriate

---

## Anti-Patterns to Avoid

- **Don't** use `fs.stat()` - use `fs.promises.access()` for existence checks (stat follows symlinks)
- **Don't** overwrite existing README content - only append new section
- **Don't** duplicate "## Local Development with Groundswell" section - check before adding
- **Don't** skip conditional execution - always check `previousResult.linked` first
- **Don't** throw errors - return structured error objects in result
- **Don't** hardcode paths - use `DEFAULT_PROJECT_PATH` constant
- **Don't** use sync file operations - use async `fs.promises` API
- **Don't** forget to check if section already exists before appending
- **Don't** ignore file system errors - handle EACCES, ENOSPC, EROFS explicitly
- **Don't** write incomplete documentation - include all steps (link, verify, troubleshoot)
