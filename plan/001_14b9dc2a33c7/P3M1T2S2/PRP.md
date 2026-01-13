name: "PRD Diffing Implementation for Delta Detection"
description: |

---

## Goal

**Feature Goal**: Implement structured PRD diffing that identifies requirement-level changes between old and new PRD versions, enabling delta session initialization with precise change detection.

**Deliverable**: `src/core/prd-differ.ts` module with `diffPRDs()` and `hasSignificantChanges()` functions that categorize changes as added/modified/removed sections.

**Success Definition**:

- `diffPRDs()` returns structured `DiffSummary` with categorized changes
- `hasSignificantChanges()` filters whitespace/minor edits (5% word change threshold)
- Integrated with `SessionManager.createDeltaSession()` to replace basic line counting
- 100% test coverage with mocked diff operations

## User Persona

**Target User**: Task Orchestrator (internal system component) and delta session initialization logic

**Use Case**: When a PRD is modified between sessions, the system needs to detect what specific requirements changed to determine which tasks need re-execution.

**User Journey**:

1. User runs pipeline with modified PRD
2. `SessionManager.createDeltaSession()` is invoked
3. `diffPRDs()` compares old PRD snapshot vs new PRD content
4. Structured `DiffSummary` identifies added/modified/removed sections
5. Task Orchestrator uses change data to patch task registry

**Pain Points Addressed**:

- Current `#generateDiffSummary()` only counts lines (no change categorization)
- No way to detect specific requirements that changed
- Delta sessions require manual analysis of what changed

## Why

- **Delta Session Efficiency**: Knowing exactly what changed enables selective task re-execution instead of full pipeline re-run
- **Requirement Traceability**: Structured change detection maintains audit trail of PRD evolution
- **Integration with Task Patching**: Feeds into P4.M1.T2 task patching logic with precise change data
- **Reduces AI Token Usage**: Targeted re-execution only for affected requirements

## What

### Module: `src/core/prd-differ.ts`

A diffing utility that compares two PRD markdown documents and returns structured change data.

**Core Functions**:

```typescript
export function diffPRDs(oldPRD: string, newPRD: string): DiffSummary;
export function hasSignificantChanges(diff: DiffSummary): boolean;
```

**Data Structures**:

```typescript
interface PRDSection {
  readonly level: number; // Header level (1-6)
  readonly title: string; // Section title (e.g., "Features")
  readonly content: string; // Full section content
  readonly lineNumber: number; // Starting line in PRD
}

interface SectionChange {
  readonly type: 'added' | 'modified' | 'removed';
  readonly sectionTitle: string;
  readonly lineNumber: number;
  readonly oldContent?: string;
  readonly newContent?: string;
  readonly impact: 'low' | 'medium' | 'high';
}

interface DiffSummary {
  readonly changes: SectionChange[];
  readonly summaryText: string;
  readonly stats: {
    readonly totalAdded: number;
    readonly totalModified: number;
    readonly totalRemoved: number;
    readonly sectionsAffected: readonly string[];
  };
}
```

### Success Criteria

- [ ] `diffPRDs()` parses PRDs into sections by markdown headers
- [ ] Changes categorized as added/modified/removed with section titles
- [ ] `hasSignificantChanges()` applies 5% word change threshold
- [ ] Whitespace-only changes filtered out
- [ ] 100% test coverage achieved
- [ ] Integrated with `SessionManager.createDeltaSession()`

---

## All Needed Context

### Context Completeness Check

_The implementing agent will have everything needed:_

- Exact file structure and import patterns
- Test patterns with specific assertion styles
- Integration points in SessionManager
- `fast-diff` library API (already installed)

### Documentation & References

```yaml
# MUST READ - Core type definitions
- file: src/core/models.ts
  lines: 1361-1430
  why: RequirementChange interface defines change categorization (added/modified/removed)
  pattern: Change type enum, impact field, readonly properties
  gotcha: itemId uses dot notation (P1.M2.T3.S1), not needed for section-level diffing

- file: src/core/models.ts
  lines: 1462-1523
  why: DeltaAnalysis interface for AI-powered delta analysis output format
  pattern: Structured output with changes array, patch instructions, task IDs
  gotcha: PRD differ produces SectionChange, not RequirementChange (different granularity)

- file: src/core/session-manager.ts
  lines: 188-192
  why: Current #generateDiffSummary() implementation to replace
  pattern: Private method, takes oldPRD and newPRD strings, returns string
  gotcha: Must replace this basic line counting with structured diffing

- file: src/core/session-manager.ts
  lines: 316-380
  why: createDeltaSession() method integration point for diffPRDs()
  pattern: Reads old/new PRD, generates diff summary at line 338
  gotcha: Line 338 calls #generateDiffSummary() - replace with diffPRDs() call

- file: src/core/session-utils.ts
  lines: 1-50
  why: Session utility patterns for error handling, file operations
  pattern: SessionFileError class, async functions, try-catch with specific error wrapping
  gotcha: All file operations throw SessionFileError, not generic Error

# EXISTING IMPLEMENTATION - Delta analysis prompt (future reference)
- file: src/agents/prompts/delta-analysis-prompt.ts
  why: AI-powered delta analysis that will eventually use diffPRDs() output
  pattern: createDeltaAnalysisPrompt(oldPRD, newPRD, completedTaskIds) -> Prompt<DeltaAnalysis>
  gotcha: This is AI semantic analysis; diffPRDs() is structural/textual diffing

# TESTING PATTERNS
- file: tests/unit/core/session-utils.test.ts
  lines: 1-100
  why: Exact test pattern: JSDoc header, vi.mock(), factory functions, Setup/Execute/Verify
  pattern: describe() -> it() with comment blocks (SETUP, EXECUTE, VERIFY)
  gotcha: All file operations mocked - never touch real filesystem in tests

- url: https://www.npmjs.com/package/fast-diff
  why: fast-diff library API (already installed in node_modules)
  critical: Type is [-1 | 0 | 1, string] where -1=DELETE, 0=EQUAL, 1=INSERT
  section: Usage section shows diff(text1, text2) -> Array<[number, string]>

- url: https://github.com/jhchen/fast-diff#readme
  why: Native TypeScript types, no @types package needed
  critical: Character-based diffs, requires manual line splitting for section-aware diffing

# RESEARCH FINDINGS
- docfile: plan/001_14b9dc2a33c7/P3M1T2S2/research/01-library-research.md
  why: Comparison of fast-diff vs diff-match-patch vs jsdiff libraries
  section: fast-diff (RECOMMENDED)

- docfile: plan/001_14b9dc2a33c7/P3M1T2S2/research/02-diffing-best-practices.md
  why: Section-aware diffing strategy, significance thresholds, normalization
  section: Section-Aware Diffing Strategy, Filtering Whitespace/Minor Edits

- docfile: plan/001_14b9dc2a33c7/P3M1T2S2/research/03-codebase-analysis.md
  why: Project structure, import patterns, file permissions convention
  section: SessionManager Integration Points, Import Patterns
```

### Current Codebase Tree

```bash
src/
├── core/
│   ├── models.ts           # RequirementChange, DeltaAnalysis interfaces
│   ├── session-manager.ts  # createDeltaSession() - integration point
│   ├── session-utils.ts    # hashPRD(), snapshotPRD(), loadSnapshot()
│   └── index.ts           # Barrel exports
├── utils/
│   └── task-utils.ts      # Existing utility patterns (not used here)
└── agents/
    └── prompts/
        └── delta-analysis-prompt.ts  # AI-powered analysis (future use)

tests/
├── unit/
│   └── core/
│       ├── session-utils.test.ts    # Test pattern reference
│       ├── session-manager.test.ts
│       └── models.test.ts           # Model validation tests
└── fixtures/
    └── mock-delta-data.ts           # Mock PRD pairs for testing
```

### Desired Codebase Tree

```bash
src/
├── core/
│   ├── models.ts
│   ├── session-manager.ts  # MODIFY: Import and use diffPRDs()
│   ├── session-utils.ts
│   ├── prd-differ.ts      # CREATE: Main diffing implementation
│   └── index.ts           # MODIFY: Export diffPRDs, hasSignificantChanges

tests/
├── unit/
│   └── core/
│       ├── prd-differ.test.ts  # CREATE: 100% coverage tests
│       ├── session-utils.test.ts
│       ├── session-manager.test.ts  # MODIFY: Add delta diffing tests
│       └── models.test.ts
```

### Known Gotchas & Library Quirks

````typescript
// CRITICAL: fast-diff is character-based, not line-based
// Must split by '\n' and re-join for line-level diffing
import diff from 'fast-diff';

// CORRECT: Line-based diffing
const lines1 = oldPRD.split('\n');
const lines2 = newPRD.split('\n');
// Compare lines, then re-join for context

// GOTCHA: fast-diff returns [-1 | 0 | 1, string] tuples
// -1 = DELETE (removed from text1 to get text2)
//  0 = EQUAL (same in both)
//  1 = INSERT (added to text1 to get text2)
const changes: Array<[-1 | 0 | 1, string]> = diff(oldPRD, newPRD);

// CRITICAL: Markdown headers use #, ##, ### pattern
// Must match /^#{1,6}\s+(.+)$/ regex to extract sections
// Preserve header level (1-6) for hierarchy

// GOTCHA: Section title matching must be exact for "modified" detection
// "User Authentication" != "User Auth" - treated as remove + add
// Case-sensitive comparison required

// CRITICAL: Whitespace normalization before diffing
// Replace \r\n with \n, trim trailing spaces, normalize multiple spaces
// Otherwise formatting changes appear as content changes

// CRITICAL: Code blocks preserve whitespace
// Don't normalize content inside ```...``` blocks
// Use regex to detect and preserve code block content

// GOTCHA: SessionManager uses ES modules with .js extension
// import { diffPRDs } from './prd-differ.js'; (NOT .ts)
// All imports must use .js extension

// CRITICAL: File operations use mode: 0o644
// Standard file permissions in this codebase

// CRITICAL: All file operations throw SessionFileError
// Wrap any errors in SessionFileError(path, operation, error)
````

---

## Implementation Blueprint

### Data Models and Structure

Create TypeScript interfaces for PRD diffing results. These are new types specific to this module.

```typescript
/**
 * Represents a parsed markdown section from PRD
 *
 * @remarks
 * Extracted by parsing markdown headers (#, ##, ###).
 * Used for section-aware diffing rather than plain text comparison.
 */
export interface PRDSection {
  readonly level: number; // Header level (1-6)
  readonly title: string; // Section title
  readonly content: string; // Full section content (excluding header)
  readonly lineNumber: number; // Starting line in PRD (1-indexed)
}

/**
 * Represents a detected change between PRD versions
 *
 * @remarks
 * Categorized at section level (not word/line level for noise reduction).
 * Impact level helps prioritize which changes require task re-execution.
 */
export interface SectionChange {
  readonly type: 'added' | 'modified' | 'removed';
  readonly sectionTitle: string;
  readonly lineNumber: number;
  readonly oldContent?: string; // Present for modified/removed
  readonly newContent?: string; // Present for added/modified
  readonly impact: 'low' | 'medium' | 'high';
}

/**
 * Complete diff result from PRD comparison
 *
 * @remarks
 * Contains all detected changes with statistics and human-readable summary.
 * Used by SessionManager to populate DeltaSession.diffSummary.
 */
export interface DiffSummary {
  readonly changes: SectionChange[];
  readonly summaryText: string;
  readonly stats: {
    readonly totalAdded: number;
    readonly totalModified: number;
    readonly totalRemoved: number;
    readonly sectionsAffected: readonly string[];
  };
}
```

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: CREATE src/core/prd-differ.ts
  - IMPLEMENT: PRDSection, SectionChange, DiffSummary interfaces
  - IMPLEMENT: parsePRDSections(prd: string): PRDSection[]
  - PATTERN: Follow interface patterns from src/core/models.ts (readonly properties)
  - NAMING: CamelCase interfaces, descriptive property names
  - PLACEMENT: Core module alongside session-manager.ts
  - DEPENDENCIES: None (pure TypeScript types)

Task 2: IMPLEMENT parsePRDSections() function
  - IMPLEMENT: Regex-based markdown header parsing
  - PATTERN: Use /^#{1,6}\s+(.+)$/ regex for header detection
  - LOGIC:
    1. Split PRD by lines
    2. Find all headers (#, ##, ###, ####, #####, ######)
    3. For each header, extract level (number of #), title, content until next header
    4. Return array of PRDSection with line numbers
  - GOTCHA: Content excludes the header line itself
  - GOTCHA: Content before first header goes to "Introduction" (level 0)
  - DEPENDENCIES: Task 1 (interfaces)

Task 3: IMPLEMENT normalizeMarkdown() helper
  - IMPLEMENT: Text normalization for comparison
  - LOGIC:
    1. Replace \r\n with \n
    2. Trim trailing spaces from each line
    3. Normalize multiple spaces to single space (outside code blocks)
    4. Normalize bullet points (-, *, +) to "-"
  - PATTERN: Pure function, chainable transformations
  - GOTCHA: Preserve whitespace inside ``` code blocks
  - DEPENDENCIES: None (utility function)

Task 4: IMPLEMENT diffPRDs(oldPRD: string, newPRD: string): DiffSummary
  - IMPORT: diff from 'fast-diff'
  - IMPLEMENT: Section-aware diffing algorithm
  - LOGIC:
    1. Parse both PRDs into sections using parsePRDSections()
    2. Match sections by title (exact match)
    3. For matched sections: use fast-diff to compare content
    4. For unmatched in new: categorize as "added"
    5. For unmatched in old: categorize as "removed"
    6. Generate summary text with statistics
    7. Return DiffSummary object
  - PATTERN: Follow functional approach (no side effects)
  - NAMING: diffPRDs (camelCase, describes operation)
  - DEPENDENCIES: Task 1 (interfaces), Task 2 (parsePRDSections), Task 3 (normalizeMarkdown)

Task 5: IMPLEMENT hasSignificantChanges(diff: DiffSummary): boolean
  - IMPLEMENT: Significance filtering to reduce noise
  - LOGIC:
    1. Filter out whitespace-only changes
    2. Calculate word change percentage
    3. Return true if > 5% of words changed OR >= 3 sections affected
  - THRESHOLD: 5% word change, minimum 3 sections
  - PATTERN: Pure function, boolean return
  - DEPENDENCIES: Task 1 (DiffSummary interface), Task 4 (diffPRDs output)

Task 6: MODIFY src/core/session-manager.ts
  - IMPORT: Add import { diffPRDs } from './prd-differ.js';
  - MODIFY: createDeltaSession() method at line 338
  - REPLACE: const diffSummary = this.#generateDiffSummary(oldPRD, newPRD);
  - WITH: const diffResult = diffPRDs(oldPRD, newPRD);
  - UPDATE: Store diffResult.summaryText in DeltaSession.diffSummary
  - PRESERVE: All existing createDeltaSession() logic
  - DEPENDENCIES: Task 4 (diffPRDs function)

Task 7: MODIFY src/core/index.ts
  - ADD: Export diffPRDs, hasSignificantChanges from prd-differ
  - FOLLOW: Existing barrel export pattern
  - PRESERVE: All existing exports
  - DEPENDENCIES: Task 4, Task 5

Task 8: CREATE tests/unit/core/prd-differ.test.ts
  - IMPLEMENT: Unit tests for all functions with 100% coverage
  - FOLLOW: Pattern from tests/unit/core/session-utils.test.ts
  - MOCK: No external dependencies (fast-diff is pure, no mocking needed)
  - TEST CASES:
    * parsePRDSections() with various PRD structures
    * normalizeMarkdown() with different inputs
    * diffPRDs() with added/modified/removed scenarios
    * hasSignificantChanges() with threshold edge cases
  - COVERAGE: All public functions, edge cases, error handling
  - NAMING: test_{function}_{scenario}
  - PLACEMENT: tests/unit/core/prd-differ.test.ts
  - DEPENDENCIES: Task 1-5 (implementation)

Task 9: MODIFY tests/unit/core/session-manager.test.ts
  - ADD: Tests for createDeltaSession() with diffPRDs integration
  - VERIFY: diffPRDs() is called with correct arguments
  - VERIFY: DiffSummary is used in DeltaSession creation
  - PRESERVE: All existing session manager tests
  - DEPENDENCIES: Task 6 (SessionManager modification), Task 8 (test patterns)
````

### Implementation Patterns & Key Details

````typescript
// ============================================================
// PATTERN 1: Header parsing for section extraction
// ============================================================
function parsePRDSections(prd: string): PRDSection[] {
  const lines = prd.split('\n');
  const sections: PRDSection[] = [];
  let currentSection: PRDSection | null = null;
  let contentBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const headerMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        currentSection = {
          ...currentSection,
          content: contentBuffer.join('\n'),
        };
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        level: headerMatch[1].length,
        title: headerMatch[2],
        content: '',
        lineNumber: i + 1, // 1-indexed
      };
      contentBuffer = [];
    } else if (currentSection) {
      contentBuffer.push(lines[i]);
    }
  }

  // Don't forget last section
  if (currentSection) {
    currentSection.content = contentBuffer.join('\n');
    sections.push(currentSection);
  }

  return sections;
}

// ============================================================
// PATTERN 2: fast-diff integration for content comparison
// ============================================================
import diff from 'fast-diff';

function compareSectionContent(
  oldContent: string,
  newContent: string
): {
  hasChanges: boolean;
  wordChangePercent: number;
} {
  const normalizedOld = normalizeMarkdown(oldContent);
  const normalizedNew = normalizeMarkdown(newContent);

  const changes = diff(normalizedOld, normalizedNew);
  const significantChanges = changes.filter(
    ([type, text]) => type !== 0 && text.trim().length > 0
  );

  if (significantChanges.length === 0) {
    return { hasChanges: false, wordChangePercent: 0 };
  }

  // Calculate word change percentage
  const totalWords = normalizedNew.split(/\s+/).length;
  const changedWords = significantChanges.reduce(
    (sum, [_, text]) => sum + text.split(/\s+/).length,
    0
  );

  return {
    hasChanges: true,
    wordChangePercent: totalWords > 0 ? (changedWords / totalWords) * 100 : 100,
  };
}

// ============================================================
// PATTERN 3: Section matching algorithm
// ============================================================
function diffPRDs(oldPRD: string, newPRD: string): DiffSummary {
  const oldSections = parsePRDSections(oldPRD);
  const newSections = parsePRDSections(newPRD);
  const changes: SectionChange[] = [];
  const sectionsAffected = new Set<string>();

  // Find added and modified sections
  for (const newSection of newSections) {
    const oldSection = oldSections.find(s => s.title === newSection.title);

    if (!oldSection) {
      // Section was added
      changes.push({
        type: 'added',
        sectionTitle: newSection.title,
        lineNumber: newSection.lineNumber,
        newContent: newSection.content,
        impact: assessImpact(newSection.content),
      });
      sectionsAffected.add(newSection.title);
    } else {
      // Check if content changed
      const comparison = compareSectionContent(
        oldSection.content,
        newSection.content
      );

      if (comparison.hasChanges && comparison.wordChangePercent > 5) {
        changes.push({
          type: 'modified',
          sectionTitle: newSection.title,
          lineNumber: newSection.lineNumber,
          oldContent: oldSection.content,
          newContent: newSection.content,
          impact: assessImpact(newSection.content),
        });
        sectionsAffected.add(newSection.title);
      }
    }
  }

  // Find removed sections
  for (const oldSection of oldSections) {
    const stillExists = newSections.some(s => s.title === oldSection.title);

    if (!stillExists) {
      changes.push({
        type: 'removed',
        sectionTitle: oldSection.title,
        lineNumber: oldSection.lineNumber,
        oldContent: oldSection.content,
        impact: assessImpact(oldSection.content),
      });
      sectionsAffected.add(oldSection.title);
    }
  }

  // Generate summary
  const summaryText = generateSummaryText(changes, sectionsAffected);

  return {
    changes,
    summaryText,
    stats: {
      totalAdded: changes.filter(c => c.type === 'added').length,
      totalModified: changes.filter(c => c.type === 'modified').length,
      totalRemoved: changes.filter(c => c.type === 'removed').length,
      sectionsAffected: Array.from(sectionsAffected),
    },
  };
}

// ============================================================
// PATTERN 4: Impact assessment helper
// ============================================================
function assessImpact(content: string): 'low' | 'medium' | 'high' {
  // Count key indicators
  const hasCodeBlocks = /```/.test(content);
  const hasTables = /\|.*\|/.test(content);
  const wordCount = content.split(/\s+/).length;

  if (hasCodeBlocks || hasTables || wordCount > 200) {
    return 'high';
  } else if (wordCount > 50) {
    return 'medium';
  }
  return 'low';
}

// ============================================================
// GOTCHA: normalizeMarkdown must preserve code blocks
// ============================================================
function normalizeMarkdown(text: string): string {
  const lines = text.split('\n');
  const normalized: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      normalized.push(line);
    } else if (inCodeBlock) {
      // Preserve whitespace in code blocks
      normalized.push(line);
    } else {
      // Normalize outside code blocks
      normalized.push(
        line
          .trimEnd() // Remove trailing spaces
          .replace(/  +/g, ' ') // Collapse multiple spaces
      );
    }
  }

  return normalized.join('\n').replace(/\r\n/g, '\n'); // Normalize line endings
}
````

### Integration Points

```yaml
SESSION_MANAGER:
  file: src/core/session-manager.ts
  line: 338
  modify: |
    // BEFORE:
    const diffSummary = this.#generateDiffSummary(oldPRD, newPRD);

    // AFTER:
    import { diffPRDs } from './prd-differ.js';
    const diffResult = diffPRDs(oldPRD, newPRD);
    const diffSummary = diffResult.summaryText;

CORE_EXPORTS:
  file: src/core/index.ts
  add: |
    export { diffPRDs, hasSignificantChanges, type DiffSummary, type SectionChange } from './prd-differ.js';
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- --fix src/core/prd-differ.ts
npm run lint -- --fix tests/unit/core/prd-differ.test.ts

# Type checking
npm run type-check  # or: npx tsc --noEmit

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new module
npm test -- tests/unit/core/prd-differ.test.ts

# Test SessionManager integration
npm test -- tests/unit/core/session-manager.test.ts

# Full test suite for core module
npm test -- tests/unit/core/

# Coverage validation (100% required)
npm run test:coverage -- tests/unit/core/prd-differ.test.ts

# Expected: All tests pass, 100% coverage. If failing, debug root cause.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test with actual PRD files
npm test -- run tests/manual/prd-diffing-integration.test.ts

# Verify SessionManager delta session creation
# (Would need manual test or integration test script)

# Expected: diffPRDs() correctly identifies section changes,
# SessionManager creates DeltaSession with proper diffSummary.
```

### Level 4: Domain-Specific Validation

```bash
# Test with real PRD scenarios from fixtures
node -e "
  const { diffPRDs } = require('./dist/core/prd-differ.js');
  const oldPRD = require('fs').readFileSync('tests/fixtures/prd-old.md', 'utf-8');
  const newPRD = require('fs').readFileSync('tests/fixtures/prd-new.md', 'utf-8');
  const result = diffPRDs(oldPRD, newPRD);
  console.log('Changes:', result.changes.length);
  console.log('Summary:', result.summaryText);
"

# Verify edge cases:
# 1. Empty PRDs
# 2. PRDs with no headers
# 3. PRDs with only code blocks
# 4. Identical PRDs (should return empty changes)
# 5. Whitespace-only changes (should be filtered)

# Expected: All edge cases handled gracefully with meaningful output.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] 100% coverage achieved: `npm run test:coverage`

### Feature Validation

- [ ] `diffPRDs()` correctly parses markdown sections
- [ ] Changes categorized as added/modified/removed
- [ ] `hasSignificantChanges()` filters with 5% threshold
- [ ] Integrated with `SessionManager.createDeltaSession()`
- [ ] Empty/identical PRDs handled (returns empty changes)
- [ ] Code blocks preserve whitespace during diffing

### Code Quality Validation

- [ ] Follows existing codebase patterns (readonly interfaces, ES modules)
- [ ] File placement matches desired structure (src/core/prd-differ.ts)
- [ ] Import patterns use .js extension for ES modules
- [ ] JSDoc comments on all exported functions
- [ ] Error handling consistent (SessionFileError where applicable)

### Documentation & Deployment

- [ ] Research findings stored in plan/001_14b9dc2a33c7/P3M1T2S2/research/
- [ ] PRP.md created at plan/001_14b9dc2a33c7/P3M1T2S2/PRP.md
- [ ] Code is self-documenting with clear function names
- [ ] No environment variables or configuration changes needed

---

## Anti-Patterns to Avoid

- ❌ Don't use AI/LLM for diffing (use deterministic fast-diff algorithm)
- ❌ Don't create new test patterns (follow existing session-utils.test.ts pattern)
- ❌ Don't use .ts extension in imports (must use .js for ES modules)
- ❌ Don't skip normalizeMarkdown() (formatting changes will create false positives)
- ❌ Don't forget to handle content before first header (implicit "Introduction")
- ❌ Don't treat header level changes as content changes (separate concerns)
- ❌ Don't use line-based diffing alone (section-aware is critical for PRDs)
- ❌ Don't hardcode significance thresholds (make configurable if needed)
- ❌ Don't throw generic Error (use SessionFileError for file operations)
- ❌ Don't mutate input parameters (immutable pattern throughout codebase)
