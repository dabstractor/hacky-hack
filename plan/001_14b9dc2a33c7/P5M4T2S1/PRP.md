---
name: 'PRD Validation - Handle Empty and Malformed PRDs with Helpful Errors'
description: |
---

## Goal

**Feature Goal**: Implement comprehensive PRD validation in SessionManager.initialize() that detects missing, empty, and malformed PRDs and provides actionable, helpful error messages to guide users toward fixes.

**Deliverable**: New `src/utils/prd-validator.ts` module with PRDValidator class, modified SessionManager to call validator, `--validate-prd` CLI flag for standalone validation, ValidationError usage from error hierarchy, and helpful error messages with suggestions.

**Success Definition**:

- Missing PRD files throw SessionError with clear message including the file path
- Empty PRDs (< 100 chars) throw ValidationError with content length and suggestion
- Malformed PRDs (missing required sections) throw ValidationError with missing sections list
- PRD validation results returned with specific issues categorized (critical, warning, info)
- `--validate-prd` flag validates PRD without running pipeline
- Error messages include actionable suggestions (template location, example references)
- Validation rules configurable and extensible

## User Persona

**Target User**: Developers and product managers using the PRP pipeline to process PRDs.

**Use Case**: When a user provides a PRD file path that doesn't exist, is empty, or lacks required sections, the system should fail fast with clear, actionable error messages rather than proceeding with an invalid PRD that will cause cryptic failures downstream.

**User Journey**:

1. User runs pipeline with `--prd path/to/PRD.md`
2. SessionManager.initialize() calls PRDValidator before processing
3. If PRD is missing/empty/malformed, validation error thrown immediately
4. Error message shows: what's wrong, why it matters, how to fix it
5. User can run `--validate-prd` flag to check PRD without running pipeline
6. User fixes PRD based on suggestions and re-runs pipeline

**Pain Points Addressed**:

- Cryptic errors when PRD is malformed (e.g., "No tasks generated" vs "Missing ## Functional Requirements section")
- No guidance on what's wrong with PRD or how to fix it
- Pipeline wastes time processing invalid PRDs only to fail later
- No way to validate PRD without running full pipeline

## Why

- **Business value**: Prevents wasted pipeline execution time on invalid PRDs, provides clear feedback for faster iteration
- **Integration**: Uses error hierarchy from P5.M4.T1.S1 (ValidationError), integrates with SessionManager initialization, works with error recovery from P5.M4.T1.S3
- **Problems solved**: Unclear PRD errors, no PRD validation capability, poor user experience for malformed PRDs

## What

Implement PRD validation in SessionManager.initialize():

1. **PRD File Existence Check**: Validate PRD file path exists (already exists, enhance error message)
2. **PRD Content Length Check**: Validate PRD has minimum content (100 chars threshold)
3. **PRD Section Validation**: Validate required sections present (## Executive Summary, etc.)
4. **Validation Result Object**: Return structured result with issues, severity, suggestions
5. **CLI --validate-prd Flag**: Standalone validation mode that prints report and exits
6. **Helpful Error Messages**: Include suggestions, template references, examples

### Success Criteria

- [ ] PRDValidator class with validate() method returning ValidationResult
- [ ] File existence check with clear error message showing path
- [ ] Content length check (100 char minimum) with helpful message
- [ ] Required sections validation: Executive Summary, Functional Requirements, User Workflows
- [ ] ValidationResult includes: valid boolean, issues array (severity, message, suggestion)
- [ ] SessionManager.initialize() calls PRDValidator before processing
- [ ] --validate-prd CLI flag for standalone validation
- [ ] Error messages include actionable suggestions (template path, section examples)
- [ ] ValidationError thrown from error hierarchy with proper context
- [ ] 100% test coverage for validation scenarios

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with this codebase should be able to implement this PRP successfully using only this document and the referenced files.

### Documentation & References

```yaml
# MUST READ - Error hierarchy from P5.M4.T1.S1
- file: src/utils/errors.ts
  why: Provides ValidationError class and error codes for PRD validation failures
  pattern: Use ValidationError for PRD format/schema failures, include context
  critical: ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT, PIPELINE_VALIDATION_MISSING_FIELD
  usage: throw new ValidationError('PRD missing required section', { prdPath, section, suggestion })

# MUST READ - SessionManager for PRD handling
- file: src/core/session-manager.ts
  why: Current PRD loading happens here, validation should be integrated in initialize()
  pattern: Constructor uses statSync() for existence check (lines 127-141), initialize() reads PRD (lines 232-235)
  gotcha: PRD file existence already checked, but error messages can be improved
  critical: initialize() method is where validation should be called

# MUST READ - PRD differ for section parsing
- file: src/core/prd-differ.ts
  why: parsePRDSections() extracts markdown headers, can be reused for validation
  pattern: Uses regex /^#{1,6}\s+(.+)$/ to parse headers, returns PRDSection[] array
  critical: Lines 181-252 parsePRDSections() - reuse this logic to extract sections
  gotcha: Content before first header is "Introduction" (level 0)

# MUST READ - PRP Template for required sections
- file: PRD.md
  why: Master PRD template showing expected structure and required sections
  section: Lines 1-100 show required sections (Executive Summary, Core Philosophy, etc.)
  critical: Required sections: ## Executive Summary, ## Functional Requirements, ## User Workflows
  usage: Reference in error messages when sections are missing

# MUST READ - CLI argument parser
- file: src/cli/index.ts
  why: Need to add --validate-prd flag following existing boolean flag pattern
  pattern: Boolean flags use .option('--flag-name', 'description', false) (lines 122-126)
  gotcha: Add validatePrd: boolean to CLIArgs interface (lines 52-76)
  critical: parseCLIArgs() function validates PRD existence (lines 137-141) - can enhance

# MUST READ - Logger for validation output
- file: src/utils/logger.ts
  why: Structured logging for validation results and error messages
  pattern: logger.info(), logger.warn(), logger.error() with context objects
  critical: Use logger.info() for validation report output

# RESEARCH DOCUMENTATION - PRD validation best practices
- docfile: plan/001_14b9dc2a33c7/P5M4T2S1/research/prd-validation-practices.md
  why: Comprehensive research on PRD validation techniques, quality criteria, common malformations
  section: "Validation Pipeline Architecture", "Must-Have Blocking Rules"
  critical: Required sections, quality thresholds, error message patterns

# RESEARCH - SessionManager PRD handling analysis
- file: plan/001_14b9dc2a33c7/P5M4T2S1/research/sessionmanager-prd-handling.md
  why: Detailed analysis of how SessionManager currently handles PRDs
  section: "Current Validation Checks", "What Happens When PRD is Missing or Empty"
  critical: Lines 127-141 (constructor), 232-235 (initialize PRD read)
```

### Current Codebase Tree

```bash
src/
├── cli/
│   └── index.ts                 # ADD --validate-prd flag
├── core/
│   ├── models.ts                # Core interfaces and types
│   ├── session-manager.ts       # MODIFY - Call PRDValidator in initialize()
│   ├── prd-differ.ts            # REUSE - parsePRDSections() for validation
│   └── task-orchestrator.ts
├── utils/
│   ├── errors.ts                # USE - ValidationError from P5.M4.T1.S1
│   ├── logger.ts                # USE - Structured logging
│   ├── session-utils.ts         # USE - readUTF8FileStrict() for file reading
│   └── retry.ts                 # FROM P5.M4.T1.S2
└── index.ts                     # MODIFY - Handle --validate-prd mode

tests/
└── unit/
    ├── utils/
    │   └── prd-validator.test.ts  # CREATE - PRD validation tests
    └── core/
        └── session-manager.test.ts # UPDATE - Add validation test cases
```

### Desired Codebase Tree (After Implementation)

```bash
src/
├── cli/
│   └── index.ts                 # MODIFIED: Add validatePrd: boolean to CLIArgs
├── core/
│   └── session-manager.ts       # MODIFIED: Call PRDValidator in initialize()
├── utils/
│   ├── errors.ts                # EXISTING: Use ValidationError
│   └── prd-validator.ts         # NEW: PRDValidator class with validation logic
└── index.ts                     # MODIFIED: Handle --validate-prd mode

tests/
└── unit/
    ├── utils/
    │   └── prd-validator.test.ts  # NEW: Comprehensive PRD validation tests
    └── core/
        └── session-manager.test.ts # MODIFIED: Add validation tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: parsePRDSections() in prd-differ.ts already parses PRD headers
// REUSE this logic rather than re-implementing header parsing
// Import: import { parsePRDSections } from '../core/prd-differ.js'
// Returns: PRDSection[] with { id, level, title, content, startLine, endLine }

// CRITICAL: SessionManager constructor already checks PRD existence (lines 127-141)
// Don't duplicate this check - enhance error message instead
// Current error: "PRD file not found: ${path}"
// Enhanced: Include absolute path and check if path is a directory vs file

// CRITICAL: ValidationError from error hierarchy has specific structure
// Import: import { ValidationError, ErrorCodes } from '../utils/errors.js'
// Usage: throw new ValidationError('Message', { prdPath, field, expected, actual })
// Context object should include: prdPath, validationRule, suggestion

// CRITICAL: Content before first markdown header is "Introduction" section (level 0)
// When validating required sections, account for this implicit section
// parsePRDSections() handles this automatically

// CRITICAL: Required sections should be case-sensitive for exact matching
// PRD section titles: "## Executive Summary", "## Functional Requirements", etc.
// Use exact string matching, not case-insensitive

// CRITICAL: 100 character threshold for "empty PRD" detection
// This is from the contract definition: "Check if PRD is empty (< 100 chars)"
// Use .trim().length < 100 to check meaningful content

// CRITICAL: --validate-prd flag should exit early with validation report
// Don't create session, don't run pipeline, just validate and exit
// Exit code 0 for valid PRD, 1 for invalid PRD

// CRITICAL: Validation should happen in SessionManager.initialize()
// Constructor already checks file existence - keep that
// initialize() should call PRDValidator for content validation
// This allows validation to happen after file existence confirmed

// CRITICAL: PRD path resolution - use resolve() to get absolute path
// Import: import { resolve } from 'node:path'
// Use: const absolutePath = resolve(prdPath)
// Include absolute path in error messages for clarity

// CRITICAL: readUTF8FileStrict() from session-utils.ts validates UTF-8
// Import: import { readUTF8FileStrict } from '../utils/session-utils.js'
// Returns Promise<string> with validated UTF-8 content
// Throws SessionFileError if not valid UTF-8

// CRITICAL: Section validation should check title matching, not content
// Required sections must have exact title match
// Content can be empty - that's a different issue (quality vs structure)
// Focus on structure validation for this task

// CRITICAL: ValidationResult should be extensible for future validation rules
// Design with issue categories: critical, warning, info
// Allow easy addition of new validation checks
// Return structured result, not just boolean

// CRITICAL: Error messages must be actionable
// Don't just say "Missing section: X"
// Say "Missing section: X. Example: [show example]. Reference: PRD.md line Y"
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Validation issue severity levels
type ValidationSeverity = 'critical' | 'warning' | 'info';

// Single validation issue
interface ValidationIssue {
  /** Severity of the issue */
  severity: ValidationSeverity;

  /** Category of validation rule */
  category: 'existence' | 'structure' | 'content' | 'quality';

  /** Human-readable error message */
  message: string;

  /** Specific field or section that failed */
  field?: string;

  /** Expected value/format */
  expected?: string;

  /** Actual value found */
  actual?: string;

  /** Actionable suggestion for fixing */
  suggestion?: string;

  /** Reference to documentation or example */
  reference?: string;
}

// Validation result object
interface ValidationResult {
  /** Overall validity */
  valid: boolean;

  /** PRD file path (absolute) */
  prdPath: string;

  /** All validation issues found */
  issues: ValidationIssue[];

  /** Summary counts */
  summary: {
    critical: number;
    warning: number;
    info: number;
  };

  /** Timestamp of validation */
  validatedAt: Date;
}

// PRD validation options (for future extensibility)
interface PRDValidationOptions {
  /** Minimum content length in characters (default: 100) */
  minContentLength?: number;

  /** Required section titles (default: built-in list) */
  requiredSections?: string[];

  /** Whether to include quality checks (default: false for now) */
  includeQualityChecks?: boolean;

  /** Whether to include suggestions (default: true) */
  includeSuggestions?: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/prd-validator.ts
  - IMPLEMENT: PRDValidator class with validate() method
  - IMPORT: parsePRDSections from '../core/prd-differ.js'
  - IMPORT: ValidationError, ErrorCodes from './errors.js'
  - IMPORT: readUTF8FileStrict from './session-utils.js'
  - DEFINE: ValidationIssue, ValidationResult, PRDValidationOptions interfaces
  - DEFINE: DEFAULT_REQUIRED_SECTIONS constant with required section titles
  - PATTERN: Follow existing utility class pattern (see src/utils/logger.ts)
  - NAMING: PascalCase for class, camelCase for methods
  - DEPENDENCIES: None

Task 2: IMPLEMENT file existence validation
  - CREATE: validateFileExists(prdPath: string): Promise<ValidationIssue | null>
  - RESOLVE: Absolute path using resolve() from 'node:path'
  - CHECK: File exists using stat() from 'node:fs/promises'
  - RETURN: null if file exists, ValidationIssue if not
  - SUGGESTION: Include absolute path in error message
  - CONTEXT: Add distinction between "file not found" vs "path is directory"
  - DEPENDENCIES: Task 1

Task 3: IMPLEMENT content length validation
  - CREATE: validateContentLength(content: string, options: PRDValidationOptions): ValidationIssue | null
  - CHECK: content.trim().length < options.minContentLength (default 100)
  - RETURN: ValidationIssue with actual vs expected length
  - SUGGESTION: "PRD appears to be empty or very short. Expected at least {min} characters, found {actual}."
  - REFERENCE: Suggest checking PRD.md for template
  - DEPENDENCIES: Task 1

Task 4: IMPLEMENT required sections validation
  - CREATE: validateRequiredSections(sections: PRDSection[], options: PRDValidationOptions): ValidationIssue[]
  - EXTRACT: Section titles from parsed PRD
  - CHECK: Each required section present (case-sensitive exact match)
  - RETURN: Array of ValidationIssue for missing sections
  - SUGGESTION: For each missing section, provide example from PRD.md
  - REFERENCE: "See PRD.md line X for example"
  - DEPENDENCIES: Task 1

Task 5: IMPLEMENT validate() main method
  - CREATE: async validate(prdPath: string, options?: PRDValidationOptions): Promise<ValidationResult>
  - CALL: validateFileExists() - if critical, return early
  - READ: PRD content using readUTF8FileStrict()
  - CALL: validateContentLength() - if critical, return early
  - PARSE: PRD sections using parsePRDSections()
  - CALL: validateRequiredSections()
  - BUILD: ValidationResult with all issues and summary
  - RETURN: Complete validation result
  - DEPENDENCIES: Task 1, Task 2, Task 3, Task 4

Task 6: ADD --validate-prd flag to CLI
  - MODIFY: src/cli/index.ts
  - ADD: validatePrd: boolean to CLIArgs interface (line 52-76)
  - ADD: .option('--validate-prd', 'Validate PRD and exit without running pipeline', false) to program
  - PATTERN: Follow existing boolean flag pattern (line 122-126)
  - NAMING: camelCase for interface, kebab-case for CLI flag
  - DEPENDENCIES: Task 1

Task 7: INTEGRATE PRDValidator in SessionManager.initialize()
  - MODIFY: src/core/session-manager.ts initialize() method (lines 217-278)
  - IMPORT: PRDValidator from '../utils/prd-validator.js'
  - CALL: await new PRDValidator().validate(this.#prdPath)
  - CHECK: If !result.valid, throw ValidationError with first critical issue
  - LOG: Validation result summary using logger
  - PRESERVE: Existing PRD reading logic (lines 232-235) - validation happens before
  - DEPENDENCIES: Task 1, Task 5

Task 8: IMPLEMENT --validate-prd mode in main entry point
  - MODIFY: src/index.ts or main entry point
  - CHECK: if (args.validatePrd) before pipeline creation
  - CALL: new PRDValidator().validate(args.prd)
  - OUTPUT: Validation report formatted for human reading
  - EXIT: process.exit(result.valid ? 0 : 1)
  - SKIP: Pipeline execution entirely in validate mode
  - DEPENDENCIES: Task 1, Task 5, Task 6

Task 9: CREATE unit tests for PRDValidator
  - CREATE: tests/unit/utils/prd-validator.test.ts
  - TEST: validateFileExists() with existing file
  - TEST: validateFileExists() with non-existent file
  - TEST: validateFileExists() with directory path
  - TEST: validateContentLength() with empty PRD
  - TEST: validateContentLength() with valid PRD
  - TEST: validateRequiredSections() with all required sections present
  - TEST: validateRequiredSections() with missing sections
  - TEST: validate() with complete valid PRD
  - TEST: validate() with missing file
  - TEST: validate() with empty PRD
  - TEST: validate() with malformed PRD (missing sections)
  - TEST: Validation result structure and summary
  - PATTERN: Follow existing test structure in tests/unit/
  - COVERAGE: Target 100% for PRDValidator
  - DEPENDENCIES: All previous tasks complete

Task 10: UPDATE SessionManager tests for validation
  - MODIFY: tests/unit/core/session-manager.test.ts
  - ADD: Test case for valid PRD passing validation
  - ADD: Test case for empty PRD throwing ValidationError
  - ADD: Test case for malformed PRD throwing ValidationError
  - VERIFY: Error messages include suggestions
  - PATTERN: Follow existing SessionManager test patterns
  - DEPENDENCIES: Task 7, Task 9
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PRD VALIDATOR CLASS STRUCTURE (Task 1)
// ============================================================================
import { parsePRDSections, type PRDSection } from '../core/prd-differ.js';
import { ValidationError, ErrorCodes } from './errors.js';
import { readUTF8FileStrict } from './session-utils.js';
import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';

// Default required PRD sections
const DEFAULT_REQUIRED_SECTIONS = [
  '## Executive Summary',
  '## Functional Requirements',
  '## User Workflows',
] as const;

export class PRDValidator {
  /**
   * Validate a PRD file for existence, content, and structure
   * @param prdPath - Path to PRD file (relative or absolute)
   * @param options - Validation options
   * @returns Validation result with issues and summary
   */
  async validate(
    prdPath: string,
    options: PRDValidationOptions = {}
  ): Promise<ValidationResult> {
    const resolvedPath = resolve(prdPath);
    const issues: ValidationIssue[] = [];
    const startTime = Date.now();

    // 1. File existence validation (critical - early return)
    const fileIssue = await this.#validateFileExists(resolvedPath);
    if (fileIssue) {
      return this.#buildResult(resolvedPath, [fileIssue], startTime);
    }

    // 2. Read PRD content
    const content = await readUTF8FileStrict(resolvedPath);

    // 3. Content length validation (critical - early return)
    const lengthIssue = this.#validateContentLength(content, options);
    if (lengthIssue) {
      return this.#buildResult(resolvedPath, [lengthIssue], startTime);
    }

    // 4. Parse PRD sections
    const sections = parsePRDSections(content);

    // 5. Required sections validation (warning - continue for full report)
    const sectionIssues = this.#validateRequiredSections(sections, options);
    issues.push(...sectionIssues);

    return this.#buildResult(resolvedPath, issues, startTime);
  }

  // ... helper methods below ...
}

// ============================================================================
// FILE EXISTENCE VALIDATION (Task 2)
// ============================================================================
async #validateFileExists(prdPath: string): Promise<ValidationIssue | null> {
  try {
    const stats = await stat(prdPath);

    // Check if path is a directory
    if (stats.isDirectory()) {
      return {
        severity: 'critical',
        category: 'existence',
        message: `PRD path is a directory, not a file: ${prdPath}`,
        field: 'prdPath',
        expected: 'Path to a markdown file',
        actual: prdPath,
        suggestion: 'Provide the path to your PRD.md file, not a directory',
      };
    }

    return null; // File exists and is a file
  } catch (error) {
    // File doesn't exist
    const errorCode = (error as NodeJS.ErrnoException).code;
    const isNotFound = errorCode === 'ENOENT';

    return {
      severity: 'critical',
      category: 'existence',
      message: isNotFound
        ? `PRD file not found: ${prdPath}`
        : `Cannot access PRD file: ${prdPath}`,
      field: 'prdPath',
      expected: 'Existing PRD markdown file',
      actual: prdPath,
      suggestion: isNotFound
        ? `Check that the path is correct. Current directory: ${process.cwd()}`
        : `Check file permissions for: ${prdPath}`,
    };
  }
}

// ============================================================================
// CONTENT LENGTH VALIDATION (Task 3)
// ============================================================================
#validateContentLength(
  content: string,
  options: PRDValidationOptions
): ValidationIssue | null {
  const minLength = options.minContentLength ?? 100;
  const actualLength = content.trim().length;

  if (actualLength < minLength) {
    return {
      severity: 'critical',
      category: 'content',
      message: `PRD content is too short (${actualLength} chars). Minimum: ${minLength} chars`,
      field: 'content',
      expected: `At least ${minLength} characters`,
      actual: `${actualLength} characters`,
      suggestion: 'Add more content to your PRD. Include sections like Executive Summary, Functional Requirements, etc.',
      reference: 'See PRD.md in the project root for a template',
    };
  }

  return null;
}

// ============================================================================
// REQUIRED SECTIONS VALIDATION (Task 4)
// ============================================================================
#validateRequiredSections(
  sections: PRDSection[],
  options: PRDValidationOptions
): ValidationIssue[] {
  const requiredSections = options.requiredSections ?? [...DEFAULT_REQUIRED_SECTIONS];
  const issues: ValidationIssue[] = [];

  // Extract section titles (e.g., "## Executive Summary" -> "Executive Summary")
  const presentTitles = new Set(
    sections.map((s) => `## ${s.title}`) // Add ## prefix for exact matching
  );

  // Check each required section
  for (const required of requiredSections) {
    if (!presentTitles.has(required)) {
      // Extract section name without ## prefix for message
      const sectionName = required.replace(/^##\s+/, '');

      issues.push({
        severity: 'warning',
        category: 'structure',
        message: `Missing required section: ${required}`,
        field: `sections.${sectionName}`,
        expected: `Section with title "${required}"`,
        actual: 'Section not found',
        suggestion: `Add a "${required}" section to your PRD. This section should describe...`,
        reference: 'See PRD.md in the project root for an example',
      });
    }
  }

  return issues;
}

// ============================================================================
// BUILD VALIDATION RESULT (Task 5)
  #buildResult(
    prdPath: string,
    issues: ValidationIssue[],
    startTime: number
  ): ValidationResult {
    // Count issues by severity
    const summary = {
      critical: issues.filter((i) => i.severity === 'critical').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    // Determine overall validity
    const valid = summary.critical === 0;

    return {
      valid,
      prdPath,
      issues,
      summary,
      validatedAt: new Date(startTime),
    };
  }
}

// ============================================================================
// SESSIONMANAGER INTEGRATION (Task 7)
// ============================================================================
// In src/core/session-manager.ts initialize() method
import { PRDValidator } from '../utils/prd-validator.js';
import { ValidationError, ErrorCodes } from '../utils/errors.js';

async initialize(): Promise<void> {
  // ... existing code ...

  // VALIDATE PRD before processing
  const validator = new PRDValidator();
  const validationResult = await validator.validate(this.#prdPath);

  if (!validationResult.valid) {
    // Find first critical issue for error message
    const criticalIssue = validationResult.issues.find((i) => i.severity === 'critical');

    throw new ValidationError(
      `PRD validation failed: ${criticalIssue?.message || 'Unknown error'}`,
      {
        prdPath: this.#prdPath,
        validationIssues: validationResult.issues,
        summary: validationResult.summary,
        suggestion: criticalIssue?.suggestion,
      },
      ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT
    );
  }

  // Log validation result if warnings
  if (validationResult.summary.warning > 0) {
    this.logger.warn(
      {
        warnings: validationResult.summary.warning,
        issues: validationResult.issues.filter((i) => i.severity === 'warning'),
      },
      '[SessionManager] PRD validated with warnings'
    );
  } else {
    this.logger.info('[SessionManager] PRD validation passed');
  }

  // ... continue with existing PRD reading logic ...
}

// ============================================================================
// CLI FLAG ADDITION (Task 6)
// ============================================================================
// In src/cli/index.ts
export interface CLIArgs {
  // ... existing properties ...

  /** Validate PRD syntax and structure without executing */
  validatePrd: boolean;
}

export function parseCLIArgs(args: string[]): CLIArgs {
  const program = new Command();

  program
    .name('prp-pipeline')
    // ... existing options ...
    .option('--validate-prd', 'Validate PRD and exit without running pipeline', false)
    // ... rest of program ...

  // ... rest of function ...
}

// ============================================================================
// MAIN ENTRY POINT VALIDATION MODE (Task 8)
// ============================================================================
// In src/index.ts
import { PRDValidator } from './utils/prd-validator.js';
import { getLogger } from './utils/logger.js';

const logger = getLogger('CLI');

async function main() {
  // ... parse CLI args ...

  // VALIDATE MODE: Early exit after validation
  if (args.validatePrd) {
    logger.info('🔍 Validating PRD...');

    const validator = new PRDValidator();
    const result = await validator.validate(args.prd);

    // Print validation report
    console.log('\n' + '='.repeat(60));
    console.log('PRD Validation Report');
    console.log('='.repeat(60));
    console.log(`File: ${result.prdPath}`);
    console.log(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`\nSummary:`);
    console.log(`  Critical: ${result.summary.critical}`);
    console.log(`  Warnings: ${result.summary.warning}`);
    console.log(`  Info: ${result.summary.info}`);

    if (result.issues.length > 0) {
      console.log(`\nIssues:`);
      for (const issue of result.issues) {
        const icon = issue.severity === 'critical' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`\n${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
        if (issue.suggestion) {
          console.log(`   Suggestion: ${issue.suggestion}`);
        }
        if (issue.reference) {
          console.log(`   Reference: ${issue.reference}`);
        }
      }
    }

    console.log('='.repeat(60) + '\n');

    // Exit with appropriate code
    process.exit(result.valid ? 0 : 1);
  }

  // ... continue with normal pipeline execution ...
}
```

### Integration Points

```yaml
SESSION_MANAGER:
  - modify: src/core/session-manager.ts
  - method: initialize()
  - import: "import { PRDValidator } from '../utils/prd-validator.js'"
  - call: "const result = await new PRDValidator().validate(this.#prdPath)"
  - throw: ValidationError if !result.valid

ERROR_HIERARCHY:
  - import from: src/utils/errors.ts
  - pattern: "throw new ValidationError('message', { prdPath, issues, summary }, ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT)"
  - use: Include all validation issues in error context for error reporting

PRD_DIFFER:
  - import from: src/core/prd-differ.ts
  - pattern: "import { parsePRDSections } from '../core/prd-differ.js'"
  - use: Extract PRD sections for validation

CLI:
  - modify: src/cli/index.ts
  - add interface: "validatePrd: boolean"
  - add option: ".option('--validate-prd', 'Validate PRD and exit without running pipeline', false)"

MAIN ENTRY:
  - modify: src/index.ts
  - check: "if (args.validatePrd)" before pipeline creation
  - output: Formatted validation report to console
  - exit: process.exit(result.valid ? 0 : 1)

SESSION_UTILS:
  - import from: src/utils/session-utils.ts
  - pattern: "import { readUTF8FileStrict } from './session-utils.js'"
  - use: Read PRD content with UTF-8 validation
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating prd-validator.ts
npm run lint -- src/utils/prd-validator.ts --fix
npm run type-check
npm run format

# Run after modifying session-manager.ts
npm run lint -- src/core/session-manager.ts --fix
npm run lint -- src/cli/index.ts --fix
npm run lint -- src/index.ts --fix

# Project-wide validation
npm run lint
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test PRDValidator
npm test -- tests/unit/utils/prd-validator.test.ts --run

# Test SessionManager integration
npm test -- tests/unit/core/session-manager.test.ts --run

# Full test suite for affected areas
npm test -- tests/unit/utils/ --run
npm test -- tests/unit/core/ --run

# Coverage validation
npm test -- tests/unit/ --run --coverage

# Expected: All tests pass, 100% coverage for PRDValidator
```

### Level 3: Integration Testing (System Validation)

```bash
# Build the project
npm run build

# Test --validate-prd flag with valid PRD
node dist/index.js --prd PRD.md --validate-prd
# Expected: Exit code 0, validation report showing valid

# Test --validate-prd flag with missing PRD
node dist/index.js --prd /nonexistent/PRD.md --validate-prd
# Expected: Exit code 1, error message showing file not found

# Test --validate-prd flag with empty PRD
# Create empty test PRD
echo "" > /tmp/test-empty-prd.md
node dist/index.js --prd /tmp/test-empty-prd.md --validate-prd
# Expected: Exit code 1, error message about content length

# Test --validate-prd flag with malformed PRD
# Create PRD without required sections
echo "# Test" > /tmp/test-malformed-prd.md
node dist/index.js --prd /tmp/test-malformed-prd.md --validate-prd
# Expected: Exit code 0 (warnings only), shows missing sections

# Test SessionManager rejects invalid PRD
node dist/index.js --prd /tmp/test-empty-prd.md
# Expected: ValidationError thrown before pipeline execution

# Test normal pipeline with valid PRD still works
node dist/index.js --prd PRD.md --dry-run
# Expected: Pipeline proceeds normally

# Expected: All integration tests pass, validation works as designed
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test validation error messages are actionable
node dist/index.js --prd /nonexistent/PRD.md --validate-prd 2>&1 | grep -i "check that the path"
# Expected: Suggestion included in error output

# Test validation report formatting
node dist/index.js --prd PRD.md --validate-prd | grep -E "(✅|❌|⚠️|Summary|Issues)"
# Expected: Formatted report with icons and sections

# Test validation with directory path (edge case)
mkdir -p /tmp/test-prd-dir
node dist/index.js --prd /tmp/test-prd-dir --validate-prd 2>&1 | grep -i "directory"
# Expected: Error message distinguishes directory from missing file

# Test validation with various PRD sizes
# Create PRDs with 0, 50, 100, 200 characters and verify threshold behavior
for size in 0 50 99 100 101; do
  python -c "print('# Test\n" + "x" * $size + "\n## Executive Summary\nContent")" > /tmp/test-$size.md
  node dist/index.js --prd /tmp/test-$size.md --validate-prd
done
# Expected: 0-99 char PRDs fail validation, 100+ pass

# Test section matching is case-sensitive
# Create PRD with "## executive summary" (lowercase)
echo -e "# Test\n\n## executive summary\nContent" > /tmp/test-lowercase.md
node dist/index.js --prd /tmp/test-lowercase.md --validate-prd
# Expected: Missing section warning (case mismatch)

# Test validation result structure is correct
node -e "
import { PRDValidator } from './dist/utils/prd-validator.js';
const validator = new PRDValidator();
const result = await validator.validate('PRD.md');
console.log('Valid:', typeof result.valid === 'boolean');
console.log('Issues:', Array.isArray(result.issues));
console.log('Summary:', typeof result.summary === 'object');
"
# Expected: All type checks pass

# Test validation with PRD that has only some required sections
# Create PRD with Executive Summary but missing Functional Requirements
echo -e "# Test\n\n## Executive Summary\nContent" > /tmp/test-partial.md
node dist/index.js --prd /tmp/test-partial.md --validate-prd
# Expected: Warning for missing section but exit code 0 (no critical issues)

# Expected: All creative validations pass, edge cases handled correctly
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/ --run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] PRDValidator.validate() returns proper ValidationResult structure
- [ ] File existence check throws for missing files with clear message
- [ ] Content length check validates minimum 100 characters
- [ ] Required sections validation detects missing sections
- [ ] --validate-prd CLI flag works and exits early
- [ ] Validation report is formatted and readable
- [ ] Error messages include actionable suggestions
- [ ] ValidationError thrown from error hierarchy with proper context
- [ ] SessionManager.initialize() calls PRDValidator
- [ ] Exit code 0 for valid PRD, 1 for invalid PRD

### Code Quality Validation

- [ ] Follows existing codebase patterns (error usage, logger, imports)
- [ ] File placement matches desired codebase tree
- [ ] Reuses parsePRDSections() from prd-differ.ts
- [ ] Uses ValidationError from error hierarchy
- [ ] Uses readUTF8FileStrict() for file reading
- [ ] Validation options are extensible
- [ ] Error messages distinguish between file not found vs directory
- [ ] Section matching is case-sensitive

### Documentation & Deployment

- [ ] Code is self-documenting with clear JSDoc comments
- [ ] Validation report format is user-friendly
- [ ] --validate-prd flag documented in --help output
- [ ] Error messages reference PRD.md template
- [ ] Suggestions are actionable and specific

---

## Anti-Patterns to Avoid

- ❌ Don't duplicate file existence check from SessionManager constructor - enhance error message instead
- ❌ Don't re-implement header parsing - reuse parsePRDSections() from prd-differ.ts
- ❌ Don't use generic Error - use ValidationError from error hierarchy
- ❌ Don't throw early for warnings - collect all issues for full report
- ❌ Don't make section matching case-insensitive - PRD section titles are case-sensitive
- ❌ Don't validate content quality in this task - focus on structure validation
- ❌ Don't create session in --validate-prd mode - exit early before SessionManager
- ❌ Don't use console.log for errors - use logger or formatted console output for validation mode
- ❌ Don't forget to resolve() PRD path for absolute path in error messages
- ❌ Don't hard-code required sections - use DEFAULT_REQUIRED_SECTIONS constant for extensibility
