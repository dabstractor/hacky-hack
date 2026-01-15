# Regex-Based Format Validation Research

**Research Date:** 2025-01-14
**Component:** P1.M2.T2.S2 - Validation Report Format Verification
**Purpose:** Research best practices for regex-based structured text parsing and validation in TypeScript/Node.js

---

## Executive Summary

This research document compiles best practices for regex-based validation in TypeScript/Node.js, with a focus on section-based text parsing similar to validation report format validation. Findings are drawn from established patterns in the codebase, TypeScript best practices, and common validation scenarios.

**Key Findings:**
1. Use pre-compiled regex patterns as constants for performance
2. Prefer specific character classes (`[ \t]`) over generic ones (`\s`) when precision matters
3. Always anchor validation patterns with `^` and `$` for full string validation
4. Use non-capturing groups `(?:...)` for better performance
5. Implement early return patterns for validation failures
6. Provide structured error messages with actionable feedback

---

## Table of Contents

1. [TypeScript Regex Patterns for Structured Text Parsing](#typescript-regex-patterns-for-structured-text-parsing)
2. [Best Practices for Regex Pattern Matching in Validation](#best-practices-for-regex-pattern-matching-in-validation)
3. [Section-Based Text Parsing Examples](#section-based-text-parsing-examples)
4. [Edge Cases and Common Pitfalls](#edge-cases-and-common-pitfalls)
5. [Code Examples from Codebase](#code-examples-from-codebase)
6. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
7. [Testing Strategies](#testing-strategies)
8. [References and Resources](#references-and-resources)

---

## TypeScript Regex Patterns for Structured Text Parsing

### 1. Pattern Declaration as Constants

**Best Practice:** Declare regex patterns as `const` with `as const` assertion for type safety.

```typescript
/**
 * Regex patterns for option flag detection
 *
 * @remarks
 * Compiled regex patterns for efficient option detection.
 * All patterns are case-sensitive for exact flag matching.
 */
const OPTION_PATTERNS = {
  /** Matches --prd option with description */
  PRD_OPTION: /--prd[ \t]+\S+/,

  /** Matches --verbose option with description */
  VERBOSE_OPTION: /--verbose[ \t]+\S+/,

  /** Matches --scope option with description */
  SCOPE_OPTION: /--scope[ \t]+\S+/,

  /** Matches --validate-prd option with description */
  VALIDATE_PRD_OPTION: /--validate-prd[ \t]+\S+/,
} as const;
```

**Benefits:**
- Pre-compiled at module load time (performance)
- Type-safe with `as const` assertion
- Self-documenting with JSDoc comments
- Immutable by default

### 2. Specific Character Classes

**Best Practice:** Use specific character classes instead of generic ones when precision matters.

```typescript
// GOOD: Specific whitespace (spaces and tabs only)
const OPTION_PATTERN = /--prd[ \t]+\S+/;

// AVOID: Generic whitespace (includes newlines)
const OPTION_PATTERN = /--prd\s+\S+/;
```

**Why:** Using `[ \t]+` instead of `\s+` prevents matching across newlines, which could cause false positives when detecting option flags.

### 3. Multiline Text Parsing

**Best Practice:** Use `[\s\S]*?` (non-greedy) instead of `.*` for multiline matching.

```typescript
/**
 * Extract the options section from help text
 */
export function extractOptionsSection(helpText: string): string | null {
  const optionsMatch = helpText.match(/Options:\s*\n([\s\S]*?)(?=\n\w+:|$)/);
  return optionsMatch ? optionsMatch[1].trim() : null;
}
```

**Benefits:**
- `[\s\S]` matches any character including newlines
- `*?` is non-greedy, stopping at first match
- lookahead `(?=\n\w+:|$)` prevents over-matching

---

## Best Practices for Regex Pattern Matching in Validation

### 1. Early Return Pattern

**Best Practice:** Return early on validation failures to provide clear error messages.

```typescript
export function verifyCliOptions(
  errorResult: StartupErrorResult,
  helpOutput?: string
): CliOptionsResult {
  // PATTERN: Early return when startup had errors
  if (errorResult.hasErrors) {
    logger.warn(
      `Skipping CLI options verification due to startup errors: ${errorResult.errorTypes.join(', ')}`
    );

    return {
      optionsPresent: [],
      allOptionsPresent: false,
      missingOptions: [...EXPECTED_CLI_OPTIONS],
      message: 'CLI options verification skipped: startup errors detected',
    };
  }

  // Continue with validation...
}
```

### 2. Anchored Validation

**Best Practice:** Always use `^` and `$` anchors for full string validation.

```typescript
// GOOD: Anchored pattern
const SHORT_FLAG_REGEX = /^-([a-zA-Z])$/;

// AVOID: Unanchored pattern (matches anywhere)
const SHORT_FLAG_REGEX = /-([a-zA-Z])/;
```

### 3. Non-Capturing Groups

**Best Practice:** Use non-capturing groups `(?:...)` when you don't need the captured value.

```typescript
// GOOD: Non-capturing group
const ALIAS_COMBO_REGEX = /^(-[a-zA-Z]),?\s+(?:--[\w-]+)$/;

// AVOID: Capturing group (unnecessary overhead)
const ALIAS_COMBO_REGEX = /^(-[a-zA-Z]),?\s+(--[\w-]+)$/;
```

### 4. Escaping User Input

**Best Practice:** Always escape user-supplied strings before using in regex.

```typescript
/**
 * Check if a specific flag exists in help text
 */
export function hasFlag(helpText: string, flag: string): boolean {
  // Escape special regex characters
  const escapedFlag = flag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|\\s)${escapedFlag}(?:\\s|$)`);
  return pattern.test(helpText);
}
```

---

## Section-Based Text Parsing Examples

### 1. Section Detection Pattern

**Pattern:** Detect section headers in structured text.

```typescript
/**
 * Help section detection patterns
 */
export const HELP_SECTIONS = {
  usage: /Usage:\s*\S+/i,
  options: /Options:/i,
  commands: /Commands:/i,
  arguments: /Arguments:/i,
  examples: /Examples?:/i,
  description: /Description:/i,
};
```

### 2. Section-Based Parsing Algorithm

**Pattern:** Parse text by tracking current section and processing accordingly.

```typescript
export function parseHelpOutput(helpText: string): ParsedHelp {
  const result: ParsedHelp = {
    options: [],
  };

  const lines = helpText.split('\n');
  let currentSection: 'usage' | 'description' | 'options' | 'commands' | 'examples' | null = null;
  let optionBuffer = ''; // For multi-line option descriptions

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect section headers
    if (/^Usage:/i.test(trimmed)) {
      currentSection = 'usage';
      result.usage = trimmed;
      continue;
    }

    if (/^Options:/i.test(trimmed)) {
      currentSection = 'options';
      continue;
    }

    // Parse options
    if (currentSection === 'options') {
      if (trimmed.startsWith('-')) {
        // New option line, parse previous buffer if any
        if (optionBuffer) {
          const option = parseOptionLine(optionBuffer);
          if (option) {
            result.options.push(option);
          }
        }
        optionBuffer = line;
      } else if (isContinuationLine(line) && optionBuffer) {
        // Continuation of previous option
        optionBuffer += '\n' + line;
      }
    }
  }

  return result;
}
```

### 3. Continuation Line Detection

**Pattern:** Detect multi-line continuations by indentation.

```typescript
/**
 * Check if a line is a continuation line (deep indentation)
 */
function isContinuationLine(line: string): boolean {
  return /^\s{20,}/.test(line);
}
```

### 4. Multi-Line Content Extraction

**Pattern:** Extract sections between headers using lookahead.

```typescript
/**
 * Extract the options section from help text
 */
export function extractOptionsSection(helpText: string): string | null {
  const optionsMatch = helpText.match(/Options:\s*\n([\s\S]*?)(?=\n\w+:|$)/);
  return optionsMatch ? optionsMatch[1].trim() : null;
}
```

---

## Edge Cases and Common Pitfalls

### 1. Catastrophic Backtracking (ReDoS)

**Pitfall:** Nested quantifiers can cause exponential time complexity.

```typescript
// DANGEROUS: Can cause catastrophic backtracking
const dangerousRegex = /^(a+)+$/;
// Input: 'aaaaaaaaaaaaaaaaaaaaab' -> Hangs!

// SAFE: Avoid nested quantifiers
const safeRegex = /^a+$/;
```

**Prevention:**
- Avoid nested quantifiers: `(a+)*`, `(a|a)+`
- Use possessive quantifiers when available: `a++` (not in JS)
- Use atomic groups when available: `(?>...)` (not in JS)
- Set timeout limits for complex regex operations

### 2. Unanchored Patterns

**Pitfall:** Patterns without anchors can match partial strings.

```typescript
// PROBLEM: Matches anywhere in string
const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
emailRegex.test('invalid@email@domain.com'); // true! (wrong)

// SOLUTION: Use anchors
const emailRegexSafe = /^[\w.-]+@[\w.-]+\.\w+$/;
emailRegexSafe.test('invalid@email@domain.com'); // false
```

### 3. Newline Handling

**Pitfall:** The `.` metacharacter doesn't match newlines by default.

```typescript
// PROBLEM: '.' doesn't match newlines
const data = "line1\nline2";
const matches = data.match(/line1.line2/); // null

// SOLUTION 1: Use 's' flag (dotAll mode) in ES2018+
const matches = data.match(/line1.line2/s); // matches!

// SOLUTION 2: Use [\s\S] for broader compatibility
const matches = data.match(/line1[\s\S]*?line2/); // matches!
```

### 4. Unicode Handling

**Pitfall:** Standard regex splits surrogate pairs.

```typescript
// PROBLEM: Doesn't match Unicode properly
const emojiRegex = /./;
emojiRegex.test('😀'); // true, but splits surrogate pairs

// SOLUTION: Use 'u' flag for proper Unicode
const unicodeRegex = /./u;
```

### 5. Case Sensitivity

**Pitfall:** Regex is case-sensitive by default.

```typescript
// PROBLEM: Case sensitive by default
const emailRegex = /test@example\.com/;

// SOLUTION: Use 'i' flag for case-insensitive matching
const emailRegex = /test@example\.com/i;
```

### 6. Null Character Handling

**Pitfall:** Null characters can break patterns.

```typescript
// PROBLEM: Null character in strings
const str = 'test\x00end';
console.log(/test.*end/.test(str)); // false

// SOLUTION: Handle null characters explicitly
const strClean = str.replace(/\0/g, '');
```

---

## Code Examples from Codebase

### 1. CLI Options Verifier Pattern

**File:** `/home/dustin/projects/hacky-hack/src/utils/cli-options-verifier.ts`

```typescript
/**
 * Expected CLI options to verify
 */
const EXPECTED_CLI_OPTIONS = [
  '--prd',
  '--verbose',
  '--scope',
  '--validate-prd',
] as const;

/**
 * Regex patterns for option flag detection
 */
const OPTION_PATTERNS = {
  PRD_OPTION: /--prd[ \t]+\S+/,
  VERBOSE_OPTION: /--verbose[ \t]+\S+/,
  SCOPE_OPTION: /--scope[ \t]+\S+/,
  VALIDATE_PRD_OPTION: /--validate-prd[ \t]+\S+/,
} as const;

function parseOptionFlags(output: string): ParsedOptions {
  const flagsFound: string[] = [];

  // Check for --prd option
  if (OPTION_PATTERNS.PRD_OPTION.test(output)) {
    flagsFound.push('--prd');
  }

  // Check for --verbose option
  if (OPTION_PATTERNS.VERBOSE_OPTION.test(output)) {
    flagsFound.push('--verbose');
  }

  // ... more checks

  return {
    flagsFound,
    flagsNotFound: EXPECTED_CLI_OPTIONS.filter(o => !flagsFound.includes(o)),
  };
}
```

**Key Patterns:**
- Pre-compiled regex constants
- Specific whitespace matching `[ \t]+`
- Non-greedy matching with `\S+` for descriptions
- Structured return type with found/not found arrays

### 2. CLI Help Parser Pattern

**File:** `/home/dustin/projects/hacky-hack/src/utils/cli-help-parser.ts`

```typescript
/**
 * Short flag pattern: Single dash followed by single character
 */
export const SHORT_FLAG_REGEX = /^-([a-zA-Z])$/;

/**
 * Long flag pattern: Double dash followed by word (may contain hyphens)
 */
export const LONG_FLAG_REGEX = /^--([a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9])$/;

/**
 * Flag with argument pattern: Flag followed by space or equals and value
 */
export const FLAG_WITH_ARG_REGEX = /^--?([a-zA-Z][a-zA-Z0-9-]*)[=\s](.+)$/;
```

**Key Patterns:**
- Anchored patterns with `^` and `$`
- Character classes for validation
- Multiple escape sequences in character classes

### 3. PRD Validator Pattern

**File:** `/home/dustin/projects/hacky-hack/src/utils/prd-validator.ts`

```typescript
/**
 * Default required PRD sections
 */
const DEFAULT_REQUIRED_SECTIONS = [
  '## Executive Summary',
  '## Functional Requirements',
  '## User Workflows',
] as const;

#validateRequiredSections(
  sections: PRDSection[],
  options: PRDValidationOptions
): ValidationIssue[] {
  const requiredSections = options.requiredSections ?? DEFAULT_REQUIRED_SECTIONS;
  const issues: ValidationIssue[] = [];

  // Extract section titles with ## prefix for exact matching
  const presentTitles = new Set(sections.map(s => `## ${s.title}`));

  // Check each required section
  for (const required of requiredSections) {
    if (!presentTitles.has(required)) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: `Missing required section: ${required}`,
        field: `sections.${required.replace(/^##\s+/, '')}`,
        suggestion: `Add a "${required}" section to your PRD`,
      });
    }
  }

  return issues;
}
```

**Key Patterns:**
- Set-based lookup for O(1) performance
- Exact string matching (no regex needed)
- Structured error messages with suggestions
- Default values with fallback

---

## Anti-Patterns to Avoid

### 1. Dynamic Regex Compilation in Loops

**ANTI-PATTERN:**

```typescript
// BAD: Compiles regex on every iteration
for (const flag of flags) {
  const pattern = new RegExp(`--${flag}`);
  if (pattern.test(text)) { /* ... */ }
}
```

**BETTER:**

```typescript
// GOOD: Pre-compile patterns
const FLAG_PATTERNS = {
  prd: /--prd/,
  verbose: /--verbose/,
  // ...
} as const;

for (const [key, pattern] of Object.entries(FLAG_PATTERNS)) {
  if (pattern.test(text)) { /* ... */ }
}
```

### 2. Overly Permissive Patterns

**ANTI-PATTERN:**

```typescript
// BAD: Matches too broadly
const optionPattern = /--\w+/;
// Matches: --prd, --verbose, --invalid, --1, ---
```

**BETTER:**

```typescript
// GOOD: Specific pattern
const optionPattern = /^--([a-zA-Z][a-zA-Z0-9-]*)$/;
// Matches: --prd, --verbose, --dry-run
// Rejects: --1, ---
```

### 3. Greedy Matching Without Bounds

**ANTI-PATTERN:**

```typescript
// BAD: Greedy match can consume entire document
const sectionMatch = text.match(/## (.*)/);
// Might match: "Section 1 ## Section 2 ## Section 3"
```

**BETTER:**

```typescript
// GOOD: Non-greedy with lookahead
const sectionMatch = text.match(/## (.*?)(?=\n##|\n*$)/);
// Stops at next ## or end of section
```

### 4. Using Regex for Simple String Operations

**ANTI-PATTERN:**

```typescript
// BAD: Using regex for simple prefix check
if (/^--help/.test(flag)) { /* ... */ }

// BAD: Using regex for simple includes check
if (/verbose/.test(text)) { /* ... */ }
```

**BETTER:**

```typescript
// GOOD: Use string methods for simple operations
if (flag.startsWith('--help')) { /* ... */ }
if (text.includes('verbose')) { /* ... */ }
```

---

## Testing Strategies

### 1. Unit Test Structure

**Pattern:** Test regex patterns with comprehensive edge cases.

```typescript
describe('CLI Options Verifier', () => {
  const EXPECTED_OPTIONS = ['--prd', '--verbose', '--scope', '--validate-prd'];

  describe('parseOptionFlags', () => {
    it('should detect all options when present', () => {
      const helpOutput = `
        Options:
          --prd <path>          Path to PRD markdown file
          --verbose             Enable debug logging
          --scope <scope>       Scope identifier
          --validate-prd        Validate PRD and exit
      `;

      const result = parseOptionFlags(helpOutput);

      expect(result.flagsFound).toEqual(EXPECTED_OPTIONS);
      expect(result.flagsNotFound).toEqual([]);
    });

    it('should handle partial options', () => {
      const helpOutput = `
        Options:
          --prd <path>          Path to PRD markdown file
          --verbose             Enable debug logging
      `;

      const result = parseOptionFlags(helpOutput);

      expect(result.flagsFound).toEqual(['--prd', '--verbose']);
      expect(result.flagsNotFound).toEqual(['--scope', '--validate-prd']);
    });

    it('should not match across newlines', () => {
      const helpOutput = `
        Options:
          --prd
        -h, --help
      `;

      const result = parseOptionFlags(helpOutput);

      expect(result.flagsFound).toContain('--prd');
      expect(result.flagsFound).not.toContain('-h');
      expect(result.flagsFound).not.toContain('--help');
    });

    it('should handle empty output', () => {
      const result = parseOptionFlags('');

      expect(result.flagsFound).toEqual([]);
      expect(result.flagsNotFound).toEqual(EXPECTED_OPTIONS);
    });
  });
});
```

### 2. Edge Case Testing

**Pattern:** Test boundary conditions and malformed input.

```typescript
describe('Edge Cases', () => {
  it('should handle null characters', () => {
    const input = 'test\x00data';
    const pattern = /test.*data/s;
    expect(pattern.test(input)).toBe(false);
  });

  it('should handle unicode characters', () => {
    const input = 'test 😀 data';
    const pattern = /test.*data/u;
    expect(pattern.test(input)).toBe(true);
  });

  it('should handle catastrophic backtracking prevention', () => {
    const dangerousInput = 'a'.repeat(100) + 'b';
    const safePattern = /^a+$/;

    const startTime = Date.now();
    const result = safePattern.test(dangerousInput);
    const duration = Date.now() - startTime;

    expect(result).toBe(false);
    expect(duration).toBeLessThan(100); // Should complete quickly
  });
});
```

### 3. Section Parsing Tests

**Pattern:** Test section-based parsing with various formats.

```typescript
describe('Section Parsing', () => {
  it('should extract options section correctly', () => {
    const helpText = `
Usage: app [options]

Options:
  --verbose    Enable logging
  --help       Show help

Commands:
  build    Build project
    `;

    const section = extractOptionsSection(helpText);

    expect(section).toContain('--verbose');
    expect(section).toContain('--help');
    expect(section).not.toContain('Commands:');
  });

  it('should handle multi-line option descriptions', () => {
    const helpText = `
Options:
  --verbose    Enable debug logging for
               troubleshooting and debugging
    `;

    const parsed = parseHelpOutput(helpText);

    expect(parsed.options[0].description).toContain('troubleshooting');
  });
});
```

---

## Validation Report Format Recommendations

Based on the research, here are recommended patterns for validation report format validation:

### 1. Section Detection Pattern

```typescript
/**
 * Validation report section patterns
 */
const VALIDATION_REPORT_SECTIONS = {
  /** Matches "## Validation Report" header */
  title: /^##\s+Validation Report\s*$/i,

  /** Matches "### Test Result" or similar */
  testResult: /^###\s+Test Result\s*$/i,

  /** Matches "### Test Steps" or similar */
  testSteps: /^###\s+Test Steps\s*$/i,

  /** Matches "### Evidence" or similar */
  evidence: /^###\s+Evidence\s*$/i,
} as const;
```

### 2. Content Validation Pattern

```typescript
/**
 * Validation result patterns
 */
const VALIDATION_PATTERNS = {
  /** Matches PASS/FAIL status */
  status: /\b(PASS|FAIL)\b/i,

  /** Matches test step numbering (1., 2., etc.) */
  stepNumber: /^\d+\.\s+/,

  /** Matches code block markers */
  codeBlock: /```[\s\S]*?```/,
} as const;
```

### 3. Structure Validation Function

```typescript
/**
 * Validates validation report format
 */
export function validateValidationReport(content: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = content.split('\n');

  // Check for required sections
  const hasTitle = VALIDATION_REPORT_SECTIONS.title.test(content);
  const hasTestResult = VALIDATION_REPORT_SECTIONS.testResult.test(content);
  const hasTestSteps = VALIDATION_REPORT_SECTIONS.testSteps.test(content);
  const hasEvidence = VALIDATION_REPORT_SECTIONS.evidence.test(content);

  if (!hasTitle) {
    issues.push({
      severity: 'critical',
      category: 'structure',
      message: 'Missing "## Validation Report" title section',
      suggestion: 'Add "## Validation Report" at the beginning of the report',
    });
  }

  if (!hasTestResult) {
    issues.push({
      severity: 'critical',
      category: 'structure',
      message: 'Missing "### Test Result" section',
      suggestion: 'Add "### Test Result" section with PASS or FAIL status',
    });
  }

  if (!hasTestSteps) {
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'Missing "### Test Steps" section',
      suggestion: 'Add "### Test Steps" section with numbered test steps',
    });
  }

  if (!hasEvidence) {
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'Missing "### Evidence" section',
      suggestion: 'Add "### Evidence" section with supporting evidence',
    });
  }

  // Check for PASS/FAIL status
  if (hasTestResult && !VALIDATION_PATTERNS.status.test(content)) {
    issues.push({
      severity: 'critical',
      category: 'content',
      message: 'Test Result section must contain PASS or FAIL status',
      suggestion: 'Include "PASS" or "FAIL" in the Test Result section',
    });
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    summary: {
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
    },
  };
}
```

---

## References and Resources

### External Documentation

**Note:** Web search APIs were unavailable during research. Findings are based on:
1. Established patterns within the codebase
2. TypeScript/Node.js best practices
3. Common regex validation scenarios

### Internal Codebase References

1. **CLI Options Verifier**
   - File: `/home/dustin/projects/hacky-hack/src/utils/cli-options-verifier.ts`
   - Patterns: Option flag detection, structured validation results

2. **CLI Help Parser**
   - File: `/home/dustin/projects/hacky-hack/src/utils/cli-help-parser.ts`
   - Patterns: Section-based parsing, continuation line handling

3. **PRD Validator**
   - File: `/home/dustin/projects/hacky-hack/src/utils/prd-validator.ts`
   - Patterns: Structured validation, early return pattern

### Key TypeScript Regex Features

1. **ES2018+ Features:**
   - `s` flag (dotAll mode): Makes `.` match newlines
   - `u` flag (Unicode mode): Proper Unicode handling
   - Lookbehind assertions: `(?<=...)` and `(?<!...)`

2. **Type Safety:**
   - Use `as const` for regex pattern constants
   - Define types for parsed results
   - Use readonly arrays for expected values

3. **Performance:**
   - Pre-compile regex patterns as constants
   - Use `test()` for boolean validation (faster than `match()`)
   - Use non-capturing groups for better performance

### Recommended Testing Approach

1. **Unit Testing:**
   - Test each regex pattern independently
   - Include edge cases (empty input, null characters, unicode)
   - Test boundary conditions (min/max lengths)

2. **Integration Testing:**
   - Test section-based parsing with real-world examples
   - Test multi-line content handling
   - Test continuation line detection

3. **Performance Testing:**
   - Benchmark regex patterns with large inputs
   - Test for catastrophic backtracking vulnerabilities
   - Measure validation execution time

---

## Conclusion

This research provides a comprehensive foundation for implementing regex-based validation report format verification. The key principles are:

1. **Specificity over Generality:** Use specific character classes and anchors
2. **Performance First:** Pre-compile patterns and use efficient algorithms
3. **Clear Error Messages:** Provide actionable feedback for validation failures
4. **Comprehensive Testing:** Test edge cases and malformed input
5. **Structured Results:** Return detailed validation results with severity levels

The existing codebase patterns in `cli-options-verifier.ts`, `cli-help-parser.ts`, and `prd-validator.ts` provide excellent examples to follow for implementing validation report format validation.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-14
**Researcher:** Claude (AI Assistant)
**Status:** Complete
