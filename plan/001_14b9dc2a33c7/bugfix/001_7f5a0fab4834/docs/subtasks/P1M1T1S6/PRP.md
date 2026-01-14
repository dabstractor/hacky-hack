# Product Requirement Prompt (PRP): P1.M1.T1.S6 - Document Groundswell link setup in README

---

## Goal

**Feature Goal**: Add Groundswell local development setup documentation to the project README.md, completing the S1-S6 workflow by documenting the npm link setup process for future contributors.

**Deliverable**: An updated `README.md` in the project root with a new "Local Development with Groundswell" section containing npm link commands, verification steps, troubleshooting guidance, and unlinking instructions. The documentation function should return `ReadmeUpdateResult` with updated status and file path.

**Success Definition**:
- README.md is updated with comprehensive Groundswell link setup documentation
- Documentation includes conditional language (when npm link is needed)
- Documentation includes two-step npm link process (global + local)
- Documentation includes verification commands with expected output
- Documentation includes troubleshooting table for common issues
- Documentation includes unlinking instructions
- Function returns `ReadmeUpdateResult` with `{ updated: boolean, path: string }`
- Documentation follows existing README.md patterns (H2 headers, markdown formatting, code blocks)

---

## User Persona

**Target User**: Developer/Contributor setting up hacky-hack for local development

**Use Case**: A developer wants to contribute to hacky-hack and may need to work on the Groundswell library simultaneously. They need clear instructions on how to link the local Groundswell package.

**User Journey**:
1. Developer clones hacky-hack repository
2. Developer runs `npm install` (standard setup)
3. If developing Groundswell locally, developer encounters "Cannot find module 'groundswell'" or needs local Groundswell changes
4. Developer consults README.md "Local Development with Groundswell" section
5. Developer follows two-step npm link process
6. Developer verifies setup with provided commands
7. If issues occur, developer consults troubleshooting table

**Pain Points Addressed**:
- No documentation for Groundswell npm link setup
- Contributors unaware of local Groundswell development workflow
- Time wasted debugging missing Groundswell module errors
- Unclear how to reverse npm link setup

---

## Why

- **Knowledge Transfer**: Documentation enables new contributors to set up Groundswell link without asking existing team members
- **Workflow Completion**: S6 is the final step in the S1-S6 Groundswell dependency resolution workflow - S1-S5 implement the infrastructure, S6 documents it
- **S5 Integration**: S6 consumes S5's `NpmListVerifyResult` (with `linked` and `version` fields) to conditionally document only when link is successful
- **Milestone Tracking**: Documentation complete flag enables P1.M1 milestone tracking
- **Onboarding Efficiency**: Reduces setup time for new contributors from hours to minutes

---

## What

### Success Criteria

- [ ] `documentGroundswellReadme()` function exists in `src/utils/groundswell-linker.ts`
- [ ] Function consumes S5's `NpmListVerifyResult` as first parameter
- [ ] Function accepts optional `ReadmeUpdateOptions` parameter
- [ ] Conditional execution: only documents when S5's `linked` is `true`
- [ ] Checks if README.md exists (creates if missing)
- [ ] Appends "## Local Development with Groundswell" section to README.md
- [ ] Documentation includes: linking steps, verification, troubleshooting, unlinking
- [ ] Returns `ReadmeUpdateResult` with `{ updated: boolean, path: string }`
- [ ] Follows existing README.md formatting patterns (H2 headers, code blocks, tables)
- [ ] Comprehensive test suite with 20+ tests

### User-Visible Behavior

```typescript
// Input: S5's result (npm list verification)
const s5Result: NpmListVerifyResult = {
  linked: true,
  version: '1.0.0',
  message: 'npm list confirms groundswell is linked',
  stdout: '{"dependencies":{"groundswell":{"version":"1.0.0"}}}',
  stderr: '',
  exitCode: 0,
};

// Call S6
const s6Result = await documentGroundswellReadme(s5Result);

// Output: S6's result
console.log(s6Result);
// {
//   updated: true,
//   path: '/home/dustin/projects/hacky-hack/README.md',
//   message: 'README.md updated with Groundswell setup documentation'
// }

// README.md now contains:
// ## Local Development with Groundswell
// [Complete npm link documentation]
```

**README.md Section to be Added**:

```markdown
## Local Development with Groundswell

**Note**: This section is only required if you're actively developing the Groundswell library at `~/projects/groundswell`. Most contributors can skip this section.

### Linking Groundswell

If you need to work on the Groundswell library and hacky-hack simultaneously, you can link the local Groundswell package:

1. **Link Groundswell globally** (from Groundswell directory):
   ```bash
   cd ~/projects/groundswell
   npm link
   ```

2. **Link into hacky-hack** (from hacky-hack directory):
   ```bash
   cd /home/dustin/projects/hacky-hack
   npm link groundswell
   ```

### Verification

Verify the symlink was created correctly:

```bash
# Check symlink exists (should show: groundswell -> <path>)
ls -la node_modules/groundswell

# Verify npm recognizes the link
npm list groundswell

# Verify TypeScript resolution
npm run typecheck
```

**Expected Output**:
```
node_modules/groundswell -> ../../.config/nvm/versions/node/v20.0.0/lib/node_modules/groundswell
```

### Troubleshooting

| Symptom | Solution |
|---------|----------|
| `npm link` fails with EACCES | Run with `sudo` or fix npm permissions: `sudo chown -R $(whoami) ~/.npm` |
| `ls` shows regular file, not symlink | Run `npm unlink groundswell`, then retry both linking steps |
| TypeScript: "Cannot find module 'groundswell'" | Run `npm run typecheck`, restart IDE/TS server |
| `npm list` shows wrong version | Unlink both sides, restart terminal, retry linking |

### Unlinking

To return to using the published Groundswell package:

```bash
# From hacky-hack directory
npm unlink groundswell

# From Groundswell directory
npm unlink -g groundswell

# Reinstall production version
npm install
```
```

---

## All Needed Context

### Context Completeness Check

This PRP provides:
- Exact README.md file path and current structure
- S5's `NpmListVerifyResult` interface definition (consumed by S6)
- Complete documentation content to append (ready-to-use markdown)
- Existing README.md formatting patterns (H2 headers, tables, code blocks)
- Test file location and comprehensive test patterns
- File operation patterns (Write vs Edit tool usage)
- All gotchas and warnings from research

### Documentation & References

```yaml
# MUST READ - Implementation patterns and examples
- file: README.md
  why: Existing README structure to follow (H2 headers, formatting, code blocks)
  pattern: Use "##" for major section headers, code blocks with bash, tables for comparisons
  critical: "Maintain consistency with existing README structure"
  lines: H2 headers include: "## Quick Start", "## Features", "## Development", etc.

- file: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/docs/architecture/external_deps.md
  why: Architecture documentation specifying Groundswell installation strategy
  pattern: npm link commands and verification steps
  section: "Installation Strategy" (lines 61-93)
  critical: "Groundswell expected at ~/projects/groundswell"

- file: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S5/PRP.md
  why: S5's PRP defining NpmListVerifyResult contract that S6 consumes
  section: "Data Models and Structure" (lines 267-319)
  critical: "S6 consumes S5's NpmListVerifyResult - must match interface exactly"

- docfile: plan/001_14b9dc2a33c7/bugfix/001_7f5a0fab4834/P1M1T1S5/npm-link-readme-research.md
  why: Complete npm link README documentation research with best practices
  section: "Recommended README Section" (lines 440-575)
  critical: "Use comprehensive pattern with verification and troubleshooting"

- file: src/utils/groundswell-linker.ts
  why: Existing Groundswell utility patterns for function structure and error handling
  pattern: Async functions with result interfaces, conditional execution
  gotcha: "Follow naming convention: {Action}Result for result interfaces"

# EXTERNAL REFERENCES
- url: https://docs.npmjs.com/cli/v10/commands/npm-link
  why: Official npm link command documentation
  critical: "Two-step process: npm link (global) then npm link <package> (local)"
  section: "Description" and "See also"

- url: https://nodejs.org/api/fs.html#fswritefilefile-data-options
  why: Node.js fs.writeFile() documentation for creating README.md if it doesn't exist
  critical: "Use fs/promises for Promise-based file operations"
  section: "fs.promises.writeFile()"
```

### Current Codebase Tree

```bash
hacky-hack/
├── README.md                      # MODIFY - Add Groundswell documentation section
├── src/
│   └── utils/
│       ├── groundswell-verifier.ts      # S1: Verify Groundswell exists
│       └── groundswell-linker.ts        # MODIFY - Add S6 function
├── tests/
│   └── unit/
│       └── utils/
│           ├── groundswell-verifier.test.ts
│           └── groundswell-linker.test.ts  # MODIFY - Add S6 tests
└── plan/
    └── 001_14b9dc2a33c7/
        └── bugfix/
            └── 001_7f5a0fab4834/
                ├── docs/
                │   └── architecture/
                │       └── external_deps.md    # Reference for installation strategy
                ├── P1M1T1S5/
                │   └── PRP.md                    # S5 PRP (consumed by S6)
                └── P1M1T1S6/
                    └── PRP.md                    # This PRP
```

### Desired Codebase Tree with Files to be Modified

```bash
hacky-hack/
├── README.md                          # MODIFY - Add "## Local Development with Groundswell" section
├── src/
│   └── utils/
│       ├── groundswell-verifier.ts           # EXISTING - S1
│       └── groundswell-linker.ts             # MODIFY - Add documentGroundswellReadme() function
└── tests/
    └── unit/
        └── utils/
            ├── groundswell-verifier.test.ts         # EXISTING
            └── groundswell-linker.test.ts           # MODIFY - Add S6 tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: S6 is conditional on S5's linked field
// Only document when S5's linked is true
if (!previousResult.linked) {
  return {
    updated: false,
    path: readmePath,
    message: 'Skipped: Groundswell not linked - cannot document',
  };
}

// CRITICAL: Use Edit tool when README.md exists, Write tool when it doesn't
// Check file existence with fs.access() before choosing tool
// Edit tool requires old_string for exact match
// Write tool overwrites entire file

// CRITICAL: The codebase uses fs/promises (Promise-based), NOT fs callback API
import { writeFile, readFile } from 'node:fs/promises'; // CORRECT
import { access } from 'node:fs/promises'; // CORRECT
// import { writeFile, readFile } from 'fs'; // DON'T USE - requires callbacks

// CRITICAL: README.md already exists in this project
// Path: /home/dustin/projects/hacky-hack/README.md
// Use Edit tool, not Write tool

// CRITICAL: When appending to README.md, find the right insertion point
// Options: (1) After "## Development" section, (2) Before "## Contributing" section
// Use Edit tool with old_string that includes the anchor section header

// CRITICAL: The documentation section header must be H2 (##) not H3 (###)
// Existing README uses H2 for major sections
// Use: "## Local Development with Groundswell"

// CRITICAL: Don't duplicate existing content
// README.md already has "## Development" section with standard setup
// Add new section AFTER "## Development", not inside it

// GOTCHA: Edit tool requires exact match for old_string
// Must include full section header and content to replace
// Must preserve exact whitespace and line endings

// GOTCHA: If README.md structure changes, Edit tool may fail
// Handle by catching Edit errors and providing clear error message
// Alternative: Append to end of file if anchor not found

// GOTCHA: The codebase uses specific patterns for file paths
// Use DEFAULT_PROJECT_PATH constant for base path
// Construct full path: join(DEFAULT_PROJECT_PATH, 'README.md')

// PATTERN: Conditional execution based on previous result (from S3, S4, S5)
if (!previousResult.linked) {
  return { updated: false, path: readmePath, /* ... */ };
}

// PATTERN: Result interface follows existing pattern (from S1-S5)
export interface ReadmeUpdateResult {
  updated: boolean;
  path: string;
  message: string;
  error?: string;
}
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Result of README.md update operation
 *
 * @remarks
 * Returned by documentGroundswellReadme() to indicate whether
 * the README.md was successfully updated with Groundswell
 * setup documentation.
 *
 * @example
 * ```typescript
 * const result = await documentGroundswellReadme(s5Result);
 * if (!result.updated) {
 *   console.error(`Failed to update README: ${result.error}`);
 * }
 * ```
 */
export interface ReadmeUpdateResult {
  /** Whether README.md was updated */
  updated: boolean;

  /** Absolute path to README.md */
  path: string;

  /** Human-readable status message */
  message: string;

  /** Error message if update failed */
  error?: string;
}

/**
 * Optional configuration for documentGroundswellReadme()
 *
 * @remarks
 * Optional configuration for the documentGroundswellReadme function.
 */
export interface ReadmeUpdateOptions {
  /** README.md file path (default: <projectRoot>/README.md) */
  readmePath?: string;

  /** Section title to use (default: "Local Development with Groundswell") */
  sectionTitle?: string;

  /** Whether to append if section not found (default: true) */
  appendIfMissing?: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD ReadmeUpdateResult and ReadmeUpdateOptions interfaces
  - LOCATION: src/utils/groundswell-linker.ts (after NpmListVerifyResult, line ~320)
  - IMPLEMENT: ReadmeUpdateResult interface
  - IMPLEMENT: ReadmeUpdateOptions interface
  - FOLLOW pattern: NpmListVerifyResult (lines 284-305)
  - FIELDS: updated, path, message, error?
  - NAMING: CamelCase interfaces, descriptive field names

Task 2: ADD DEFAULT_README_PATH constant
  - LOCATION: src/utils/groundswell-linker.ts (after constants section, line ~210)
  - IMPLEMENT: const DEFAULT_README_PATH = '/home/dustin/projects/hacky-hack/README.md';
  - FOLLOW pattern: DEFAULT_PROJECT_PATH constant (line ~202)
  - NAMING: UPPER_SNAKE_CASE for constants

Task 3: ADD GROUNDSWELL_README_SECTION constant
  - LOCATION: src/utils/groundswell-linker.ts (after DEFAULT_README_PATH)
  - IMPLEMENT: const GROUNDSWELL_README_SECTION = `## Local Development with Groundswell...` (full markdown)
  - IMPLEMENT: Complete markdown content with linking, verification, troubleshooting, unlinking
  - FOLLOW pattern: See "What > User-Visible Behavior" section for exact content
  - CONTENT: Use template literal with proper markdown formatting

Task 4: CREATE documentGroundswellReadme() function
  - LOCATION: src/utils/groundswell-linker.ts (after verifyGroundswellNpmList)
  - IMPLEMENT: async function documentGroundswellReadme()
  - SIGNATURE: (previousResult: NpmListVerifyResult, options?: ReadmeUpdateOptions) => Promise<ReadmeUpdateResult>
  - DEPENDENCIES: Import writeFile, readFile, access from 'node:fs/promises' (if not already imported)
  - DEPENDENCIES: Import join from 'node:path' (if not already imported)

Task 5: IMPLEMENT conditional execution logic
  - LOCATION: documentGroundswellReadme() function body
  - CHECK: if (!previousResult.linked) return early with updated: false
  - FOLLOW pattern: verifyGroundswellNpmList() conditional execution (from S5 PRP)
  - MESSAGE: Include previousResult.message in skip message for debugging

Task 6: IMPLEMENT README.md existence check
  - LOCATION: documentGroundswellReadme() function body (after conditional check)
  - USE: await access(readmePath, fs.constants.F_OK) to check existence
  - HANDLE: If README doesn't exist and options allow, create it
  - FOLLOW pattern: Use fs/promises for async operations

Task 7: IMPLEMENT README.md content reading
  - LOCATION: documentGroundswellReadme() function body (after existence check)
  - USE: await readFile(readmePath, 'utf-8') to get current content
  - STORE: In variable for parsing and editing

Task 8: IMPLEMENT duplicate section check
  - LOCATION: documentGroundswellReadme() function body (after reading)
  - CHECK: If section already exists, skip with updated: false
  - PATTERN: Check for section header: '## Local Development with Groundswell'
  - MESSAGE: "Section already exists in README.md"

Task 9: IMPLEMENT README.md update logic
  - LOCATION: documentGroundswellReadme() function body (after duplicate check)
  - FIND: Insertion point (after "## Development" section or end of file)
  - CONCATENATE: Existing content + '\n\n' + GROUNDSWELL_README_SECTION
  - USE: Edit tool pattern (old_string + new_string) OR writeFile for full overwrite

Task 10: IMPLEMENT file write operation
  - LOCATION: documentGroundswellReadme() function body (after content concatenation)
  - USE: await writeFile(readmePath, updatedContent, 'utf-8')
  - HANDLE: Write errors (permission denied, disk full, etc.)
  - RETURN: ReadmeUpdateResult with updated: true

Task 11: EXPORT documentGroundswellReadme function
  - LOCATION: src/utils/groundswell-linker.ts (add to existing exports)
  - EXPORT: export async function documentGroundswellReadme(...)
  - FOLLOW pattern: Existing exports (linkGroundswell, verifyGroundswellNpmList)

Task 12: CREATE comprehensive test suite
  - LOCATION: tests/unit/utils/groundswell-linker.test.ts
  - IMPLEMENT: describe('documentGroundswellReadme', () => { ... })
  - MOCK: vi.mock('node:fs/promises') for file operations
  - TESTS: 20+ tests covering all scenarios (see Test Patterns below)
```

### Implementation Patterns & Key Details

```typescript
/**
 * PATTERN: Conditional execution based on previous result
 * Location: Start of documentGroundswellReadme()
 */
export async function documentGroundswellReadme(
  previousResult: NpmListVerifyResult,
  options?: ReadmeUpdateOptions
): Promise<ReadmeUpdateResult> {
  const {
    readmePath = DEFAULT_README_PATH,
    sectionTitle = 'Local Development with Groundswell',
    appendIfMissing = true,
  } = options ?? {};

  // PATTERN: Skip if previous step failed (from verifyGroundswellNpmList)
  if (!previousResult.linked) {
    return {
      updated: false,
      path: readmePath,
      message: `Skipped: Groundswell not linked - ${previousResult.message}`,
      error: undefined,
    };
  }

  // PATTERN: Safe file operations with try/catch
  try {
    // Check if README exists
    await access(readmePath, fs.constants.F_OK);
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno?.code === 'ENOENT') {
      // README doesn't exist - create it or skip
      if (appendIfMissing) {
        await writeFile(readmePath, '# hacky-hack\n\n' + GROUNDSWELL_README_SECTION, 'utf-8');
        return {
          updated: true,
          path: readmePath,
          message: 'README.md created with Groundswell documentation',
        };
      }
      return {
        updated: false,
        path: readmePath,
        message: 'README.md not found and appendIfMissing is false',
        error: 'ENOENT',
      };
    }
    return {
      updated: false,
      path: readmePath,
      message: 'Failed to access README.md',
      error: errno?.message || String(error),
    };
  }

  // PATTERN: Read existing content
  let existingContent: string;
  try {
    existingContent = await readFile(readmePath, 'utf-8');
  } catch (error) {
    return {
      updated: false,
      path: readmePath,
      message: 'Failed to read README.md',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // PATTERN: Check for duplicate section
  if (existingContent.includes(`## ${sectionTitle}`)) {
    return {
      updated: false,
      path: readmePath,
      message: `Section "${sectionTitle}" already exists in README.md`,
    };
  }

  // PATTERN: Find insertion point (after "## Development" or at end)
  const developmentIndex = existingContent.indexOf('## Development');
  const contributingIndex = existingContent.indexOf('## Contributing');

  let insertIndex: number;
  if (contributingIndex !== -1) {
    // Insert before Contributing section
    insertIndex = contributingIndex;
  } else if (developmentIndex !== -1) {
    // Insert after Development section (find end of section)
    const nextH2Index = existingContent.indexOf('\n## ', developmentIndex + 2);
    insertIndex = nextH2Index !== -1 ? nextH2Index : existingContent.length;
  } else {
    // Append to end
    insertIndex = existingContent.length;
  }

  // PATTERN: Insert new section
  const updatedContent = [
    existingContent.slice(0, insertIndex).trimEnd(),
    '',
    GROUNDSWELL_README_SECTION,
    '',
    existingContent.slice(insertIndex).trimStart(),
  ].join('\n');

  // PATTERN: Write updated content
  try {
    await writeFile(readmePath, updatedContent, 'utf-8');
    return {
      updated: true,
      path: readmePath,
      message: `README.md updated with "${sectionTitle}" section`,
    };
  } catch (error) {
    return {
      updated: false,
      path: readmePath,
      message: 'Failed to write README.md',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * GROUNDSWELL_README_SECTION constant
 * Location: After DEFAULT_README_PATH constant
 */
const GROUNDSWELL_README_SECTION = `## Local Development with Groundswell

**Note**: This section is only required if you're actively developing the Groundswell library at \`~/projects/groundswell\`. Most contributors can skip this section.

### Linking Groundswell

If you need to work on the Groundswell library and hacky-hack simultaneously, you can link the local Groundswell package:

1. **Link Groundswell globally** (from Groundswell directory):
   \`\`\`bash
   cd ~/projects/groundswell
   npm link
   \`\`\`

2. **Link into hacky-hack** (from hacky-hack directory):
   \`\`\`bash
   cd /home/dustin/projects/hacky-hack
   npm link groundswell
   \`\`\`

### Verification

Verify the symlink was created correctly:

\`\`\`bash
# Check symlink exists (should show: groundswell -> <path>)
ls -la node_modules/groundswell

# Verify npm recognizes the link
npm list groundswell

# Verify TypeScript resolution
npm run typecheck
\`\`\`

**Expected Output**:
\`\`\`
node_modules/groundswell -> ../../.config/nvm/versions/node/v20.0.0/lib/node_modules/groundswell
\`\`\`

### Troubleshooting

| Symptom | Solution |
|---------|----------|
| \`npm link\` fails with EACCES | Run with \`sudo\` or fix npm permissions: \`sudo chown -R $(whoami) ~/.npm\` |
| \`ls\` shows regular file, not symlink | Run \`npm unlink groundswell\`, then retry both linking steps |
| TypeScript: "Cannot find module 'groundswell'" | Run \`npm run typecheck\`, restart IDE/TS server |
| \`npm list\` shows wrong version | Unlink both sides, restart terminal, retry linking |

### Unlinking

To return to using the published Groundswell package:

\`\`\`bash
# From hacky-hack directory
npm unlink groundswell

# From Groundswell directory
npm unlink -g groundswell

# Reinstall production version
npm install
\`\`\`
`;
```

### Integration Points

```yaml
FUNCTION_SIGNATURE:
  - name: documentGroundswellReadme
  - parameters: previousResult: NpmListVerifyResult, options?: ReadmeUpdateOptions
  - returns: Promise<ReadmeUpdateResult>
  - location: src/utils/groundswell-linker.ts

IMPORTS:
  - file: src/utils/groundswell-linker.ts
  - add: import { access, readFile, writeFile } from 'node:fs/promises';
  - add: import { constants } from 'node:fs'; // For fs.constants.F_OK
  - add: import { join } from 'node:path'; // For path construction

EXPORTS:
  - file: src/utils/groundswell-linker.ts
  - add: export { documentGroundswellReadme, type ReadmeUpdateResult, type ReadmeUpdateOptions }

WORKFLOW_CONSUMERS:
  - S6 is final step: No further consumers in S1-S6 workflow
  - Milestone tracking: Documentation complete flag for P1.M1

WORKFLOW_PRODUCERS:
  - S5: Provides NpmListVerifyResult
  - Consumes: linked, version, message fields
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit src/utils/groundswell-linker.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run ESLint (if configured)
npm run lint -- src/utils/groundswell-linker.ts

# Expected: Zero linting errors.

# Format check (if using Prettier)
npm run format:check -- src/utils/groundswell-linker.ts

# Expected: Code is properly formatted.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test README documentation function
npm test -- tests/unit/utils/groundswell-linker.test.ts -t "documentGroundswellReadme"

# Expected: All S6 tests pass (including existing S2-S5 tests)

# Run with coverage
npm run test:coverage -- tests/unit/utils/groundswell-linker.test.ts

# Expected: 100% coverage for documentGroundswellReadme function

# Run all utils tests
npm test -- tests/unit/utils/

# Expected: All tests pass, no regressions in existing code
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual verification: Check README.md was updated
grep "Local Development with Groundswell" /home/dustin/projects/hacky-hack/README.md

# Expected: Section exists in README.md

# Verify README.md formatting
cat /home/dustin/projects/hacky-hack/README.md | grep -A 50 "Local Development with Groundswell"

# Expected: Complete section with linking, verification, troubleshooting, unlinking

# Test the full S1-S6 workflow (requires actual Groundswell link)
# Note: This integration test requires Groundswell to be linked

# Manual verification: Run TypeScript compilation
npx tsc --noEmit

# Expected: Zero compilation errors across entire project

# Verify function is exported correctly
node -e "import('./src/utils/groundswell-linker.ts').then(m => console.log(Object.keys(m)))"

# Expected: documentGroundswellReadme appears in exported members
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Validate README.md markdown syntax
npx markdownlint /home/dustin/projects/hacky-hack/README.md

# Expected: Zero markdown linting errors

# Test README.md renders correctly in GitHub-flavored markdown viewer
# (Open README.md in IDE preview or GitHub)

# Expected: Section renders with proper formatting, code blocks, tables

# Verify documentation completeness
# Check for all required subsections
grep -E "(Linking Groundswell|Verification|Troubleshooting|Unlinking)" /home/dustin/projects/hacky-hack/README.md

# Expected: All 4 subsections present

# Verify code blocks are properly formatted
grep -c '```bash' /home/dustin/projects/hacky-hack/README.md

# Expected: At least 5 code blocks (linking x2, verification x3, unlinking)

# Verify troubleshooting table format
grep -A 5 "| Symptom | Solution |" /home/dustin/projects/hacky-hack/README.md

# Expected: Proper markdown table with header and separator rows
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/groundswell-linker.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Function is properly exported: `documentGroundswellReadme` appears in module exports

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Conditional execution works (skips when S5 linked is false)
- [ ] README.md is updated with "## Local Development with Groundswell" section
- [ ] Documentation includes all required subsections (linking, verification, troubleshooting, unlinking)
- [ ] Documentation follows existing README.md formatting patterns
- [ ] Result interface matches expected contract

### Code Quality Validation

- [ ] Follows existing codebase patterns (naming, structure, error handling)
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (check against Anti-Patterns section)
- [ ] Dependencies properly imported (fs/promises, path)
- [ ] Configuration changes properly integrated

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] JSDoc comments present and complete
- [ ] Error messages are informative and actionable
- [ ] Test documentation describes what each test validates
- [ ] README.md section is clear, concise, and actionable

---

## Anti-Patterns to Avoid

- ❌ **Don't use Write tool when README.md exists** - Use Edit tool or read-modify-write pattern
- ❌ **Don't skip conditional execution check** - Must verify `previousResult.linked` before proceeding
- ❌ **Don't duplicate existing sections** - Check if "Local Development with Groundswell" already exists
- ❌ **Don't use sync file operations** - Use `fs/promises` for Promise-based operations
- ❌ **Don't ignore file permissions** - Handle EACCES errors gracefully
- ❌ **Don't hardcode README path without options override** - Use DEFAULT_README_PATH with options
- ❌ **Don't skip duplicate section detection** - Always check before appending
- ❌ **Don't use incorrect header level** - Use H2 (`##`) not H3 (`###`) for section title
- ❌ **Don't insert in wrong location** - Insert after "## Development" or before "## Contributing"
- ❌ **Don't skip markdown validation** - Ensure proper formatting of tables, code blocks
- ❌ **Don't forget unlinking instructions** - Complete the development lifecycle
- ❌ **Don't omit troubleshooting table** - Essential for reducing support burden
- ❌ **Don't use vague language** - Be specific about when npm link is needed
- ❌ **Don't skip verification steps** - Include commands to confirm setup worked

---

## Test Patterns Reference

### Test Organization Structure

```typescript
describe('documentGroundswellReadme', () => {
  const mockReadmePath = '/home/dustin/projects/hacky-hack/README.md';
  const mockProjectPath = '/home/dustin/projects/hacky-hack';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Conditional execution tests
  // ========================================================================

  describe('Conditional execution based on S5 result', () => {
    it('should skip documentation when previousResult.linked is false', async () => {
      // SETUP: Create S5 result with linked: false
      const s5Result: NpmListVerifyResult = {
        linked: false,
        version: undefined,
        message: 'npm list: groundswell not found',
        stdout: '{}',
        stderr: '',
        exitCode: 1,
      };

      // EXECUTE: Call documentGroundswellReadme()
      const result = await documentGroundswellReadme(s5Result);

      // VERIFY: updated: false, no file operations
      expect(result.updated).toBe(false);
      expect(result.path).toBe(mockReadmePath);
      expect(result.message).toContain('Skipped');
      expect(readFile).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should include previousResult.message when skipping', async () => {
      const customMessage = 'Custom S5 error message';
      const s5Result: NpmListVerifyResult = {
        linked: false,
        version: undefined,
        message: customMessage,
        stdout: '',
        stderr: '',
        exitCode: 1,
      };

      const result = await documentGroundswellReadme(s5Result);

      expect(result.message).toContain(customMessage);
    });

    it('should proceed with documentation when previousResult.linked is true', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'npm list confirms groundswell is linked',
        stdout: '{"dependencies":{"groundswell":{"version":"1.0.0"}}}',
        stderr: '',
        exitCode: 0,
      };

      // Mock README exists and doesn't have section yet
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n\n## Development\n\n...');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(true);
      expect(writeFile).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Successful README.md update', () => {
    it('should return updated: true when README.md is successfully updated', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'npm list confirms groundswell is linked',
        stdout: '{"dependencies":{"groundswell":{"version":"1.0.0"}}}',
        stderr: '',
        exitCode: 0,
      };

      const existingReadme = '# hacky-hack\n\n## Quick Start\n\n...\n\n## Development\n\nSetup...\n\n## Contributing\n\n...';
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue(existingReadme);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(true);
      expect(result.path).toBe(mockReadmePath);
      expect(result.message).toContain('updated with');
    });

    it('should append section after "## Development" when Contributing exists', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      const existingReadme = '# hacky-hack\n\n## Development\n\nDevelopment content\n\n## Contributing\n\nContributing content';
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue(existingReadme);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      expect(writeFile).toHaveBeenCalledWith(
        mockReadmePath,
        expect.stringContaining('## Local Development with Groundswell'),
        'utf-8'
      );

      // Verify insertion order: Development -> Groundswell section -> Contributing
      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const updatedContent = writeCall[1] as string;
      const devIndex = updatedContent.indexOf('## Development');
      const groundswellIndex = updatedContent.indexOf('## Local Development with Groundswell');
      const contributingIndex = updatedContent.indexOf('## Contributing');

      expect(devIndex).toBeLessThan(groundswellIndex);
      expect(groundswellIndex).toBeLessThan(contributingIndex);
    });

    it('should append to end when no Contributing section exists', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      const existingReadme = '# hacky-hack\n\n## Development\n\nDevelopment content\n\n## License\n\nMIT';
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue(existingReadme);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      expect(writeFile).toHaveBeenCalled();
      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const updatedContent = writeCall[1] as string;

      // Section should be in updated content
      expect(updatedContent).toContain('## Local Development with Groundswell');
    });

    it('should use default README path when no options provided', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n\n## Development\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      expect(result.path).toBe(mockReadmePath);
      expect(readFile).toHaveBeenCalledWith(mockReadmePath, 'utf-8');
    });

    it('should accept custom README path option', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      const customPath = '/custom/path/README.md';
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result, { readmePath: customPath });

      expect(result.path).toBe(customPath);
      expect(readFile).toHaveBeenCalledWith(customPath, 'utf-8');
    });
  });

  // ========================================================================
  // README.md not found tests
  // ========================================================================

  describe('README.md not found scenarios', () => {
    it('should create README.md when it does not exist and appendIfMissing is true', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      // Mock ENOENT error (file not found)
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      enoentError.errno = -2;
      vi.mocked(access).mockRejectedValue(enoentError);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(true);
      expect(result.message).toContain('created with Groundswell documentation');
      expect(writeFile).toHaveBeenCalledWith(
        mockReadmePath,
        expect.stringContaining('## Local Development with Groundswell'),
        'utf-8'
      );
    });

    it('should skip creation when appendIfMissing is false', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      vi.mocked(access).mockRejectedValue(enoentError);

      const result = await documentGroundswellReadme(s5Result, { appendIfMissing: false });

      expect(result.updated).toBe(false);
      expect(result.error).toBe('ENOENT');
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should handle other access errors gracefully', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      const eaccesError = new Error('EACCES') as NodeJS.ErrnoException;
      eaccesError.code = 'EACCES';
      vi.mocked(access).mockRejectedValue(eaccesError);

      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(false);
      expect(result.error).toContain('EACCES');
    });
  });

  // ========================================================================
  // Duplicate section detection tests
  // ========================================================================

  describe('Duplicate section detection', () => {
    it('should skip when section already exists', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      const existingReadme = '# hacky-hack\n\n## Local Development with Groundswell\n\nExisting content...\n\n## Contributing\n';
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue(existingReadme);

      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(false);
      expect(result.message).toContain('already exists');
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should detect section with custom title', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      const customTitle = 'Custom Groundswell Setup';
      const existingReadme = `# hacky-hack\n\n## ${customTitle}\\nExisting content...\n`;
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue(existingReadme);

      const result = await documentGroundswellReadme(s5Result, { sectionTitle: customTitle });

      expect(result.updated).toBe(false);
      expect(result.message).toContain(customTitle);
    });
  });

  // ========================================================================
  // File read error tests
  // ========================================================================

  describe('File read error handling', () => {
    it('should handle readFile errors gracefully', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockRejectedValue(new Error('Permission denied'));

      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(false);
      expect(result.message).toContain('Failed to read');
      expect(result.error).toContain('Permission denied');
    });
  });

  // ========================================================================
  // File write error tests
  // ========================================================================

  describe('File write error handling', () => {
    it('should handle writeFile errors gracefully', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n\n## Development\n');
      vi.mocked(writeFile).mockRejectedValue(new Error('Disk full'));

      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(false);
      expect(result.message).toContain('Failed to write');
      expect(result.error).toContain('Disk full');
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('ReadmeUpdateResult structure', () => {
    it('should return complete ReadmeUpdateResult object', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      // Check result structure
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('message');

      // Check types
      expect(typeof result.updated).toBe('boolean');
      expect(typeof result.path).toBe('string');
      expect(typeof result.message).toBe('string');
    });

    it('should include optional error property when update fails', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockRejectedValue(new Error('Read error'));

      const result = await documentGroundswellReadme(s5Result);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Read error');
    });

    it('should not include error property on successful update', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await documentGroundswellReadme(s5Result);

      expect(result.error).toBeUndefined();
    });
  });

  // ========================================================================
  // Integration with S5 tests
  // ========================================================================

  describe('Integration with S5', () => {
    it('should support full workflow: S5 then S6', async () => {
      // S5 result - successful npm list verification
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'npm list confirms groundswell is linked',
        stdout: '{"dependencies":{"groundswell":{"version":"1.0.0"}}}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n\n## Development\n\nSetup...\n\n## Contributing\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      // S6 (README documentation) should proceed
      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(true);
      expect(writeFile).toHaveBeenCalledWith(
        mockReadmePath,
        expect.stringContaining('## Local Development with Groundswell'),
        'utf-8'
      );
    });

    it('should fail fast if S5 npm list verification failed', async () => {
      // S5 result - package not linked
      const s5Result: NpmListVerifyResult = {
        linked: false,
        version: undefined,
        message: 'npm list: groundswell not found',
        stdout: '{}',
        stderr: '',
        exitCode: 1,
      };

      // S6 should skip without file operations
      const result = await documentGroundswellReadme(s5Result);

      expect(result.updated).toBe(false);
      expect(result.message).toContain('Skipped');
      expect(readFile).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Markdown content validation tests
  // ========================================================================

  describe('Markdown content validation', () => {
    it('should include linking instructions with code blocks', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await documentGroundswellReadme(s5Result);

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const updatedContent = writeCall[1] as string;

      // Check for linking steps
      expect(updatedContent).toContain('### Linking Groundswell');
      expect(updatedContent).toContain('cd ~/projects/groundswell');
      expect(updatedContent).toContain('npm link');
      expect(updatedContent).toContain('cd /home/dustin/projects/hacky-hack');
      expect(updatedContent).toContain('npm link groundswell');
    });

    it('should include verification steps', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await documentGroundswellReadme(s5Result);

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const updatedContent = writeCall[1] as string;

      // Check for verification steps
      expect(updatedContent).toContain('### Verification');
      expect(updatedContent).toContain('ls -la node_modules/groundswell');
      expect(updatedContent).toContain('npm list groundswell');
      expect(updatedContent).toContain('npm run typecheck');
    });

    it('should include troubleshooting table', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await documentGroundswellReadme(s5Result);

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const updatedContent = writeCall[1] as string;

      // Check for troubleshooting table
      expect(updatedContent).toContain('### Troubleshooting');
      expect(updatedContent).toContain('| Symptom | Solution |');
      expect(updatedContent).toContain('EACCES');
      expect(updatedContent).toContain('Cannot find module');
    });

    it('should include unlinking instructions', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await documentGroundswellReadme(s5Result);

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const updatedContent = writeCall[1] as string;

      // Check for unlinking steps
      expect(updatedContent).toContain('### Unlinking');
      expect(updatedContent).toContain('npm unlink groundswell');
      expect(updatedContent).toContain('npm unlink -g groundswell');
      expect(updatedContent).toContain('npm install');
    });

    it('should include conditional note at the beginning', async () => {
      const s5Result: NpmListVerifyResult = {
        linked: true,
        version: '1.0.0',
        message: 'Linked',
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      };

      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue('# hacky-hack\n');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await documentGroundswellReadme(s5Result);

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const updatedContent = writeCall[1] as string;

      // Check for conditional note
      expect(updatedContent).toContain('**Note**');
      expect(updatedContent).toContain('only required if you\'re actively developing');
      expect(updatedContent).toContain('Most contributors can skip this section');
    });
  });
});
```

---

## Confidence Score

**Overall Confidence: 9/10**

**Reasoning:**
- Comprehensive research documented in P1M1T1S5/npm-link-readme-research.md (766 lines)
- Clear patterns established in existing README.md structure
- File operation patterns are proven in Node.js/TypeScript ecosystem
- Test patterns are consistent across the codebase (20+ tests pattern from groundswell-linker.test.ts)
- Conditional execution pattern is proven in S3-S5 implementations
- Markdown content is ready-to-use with proper formatting

**Risk Mitigation:**
- All code patterns verified against existing implementations
- Test patterns match existing groundswell-linker.test.ts structure
- Error handling follows established conventions (try/catch, NodeJS.ErrnoException)
- Type safety ensured through TypeScript
- Duplicate section detection prevents overwriting existing content

**Uncertainties:**
- Actual README.md structure may vary from expected (mitigated by duplicate detection)
- File insertion logic may need adjustment for different README structures (mitigated by flexible insertion logic)

---

## Appendix: Quick Reference

### Key File Locations

| File | Purpose | Key Content |
|------|---------|-------------|
| `README.md` | MODIFY - Add documentation | Add "## Local Development with Groundswell" section |
| `src/utils/groundswell-linker.ts` | Implementation | Add documentGroundswellReadme() function |
| `tests/unit/utils/groundswell-linker.test.ts` | Tests | Add S6 test suite |

### Import Statement

```typescript
import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
// Add to existing imports in groundswell-linker.ts
```

### Function Signature

```typescript
export async function documentGroundswellReadme(
  previousResult: NpmListVerifyResult,
  options?: ReadmeUpdateOptions
): Promise<ReadmeUpdateResult>
```

### Critical Constants

```typescript
const DEFAULT_README_PATH = '/home/dustin/projects/hacky-hack/README.md'; // Add to file
const DEFAULT_PROJECT_PATH = '/home/dustin/projects/hacky-hack'; // Already exists
const GROUNDSWELL_README_SECTION = `## Local Development with Groundswell...`; // Add to file
```

### README.md Insertion Point

```typescript
// Priority order for insertion:
// 1. Before "## Contributing" section (preferred)
// 2. After "## Development" section (next best)
// 3. At end of file (fallback)
```

### Expected README.md Section Structure

```markdown
## Local Development with Groundswell

**Note**: [Conditional language]

### Linking Groundswell
[Two-step npm link process]

### Verification
[ls -la, npm list, typecheck commands]

### Troubleshooting
[Table of common issues]

### Unlinking
[Cleanup instructions]
```

---

**End of PRP for P1.M1.T1.S6**
