# ESLint Warning Categorization Framework

> **Purpose**: A systematic approach to categorizing and prioritizing ESLint warnings for documentation and fixing.
>
> **Created**: 2026-01-15
> **Use Case**: PRP for creating ESLint warning fix documentation

---

## Overview

This framework provides a structured approach to categorizing ESLint warnings by multiple dimensions, enabling effective prioritization and clear documentation.

---

## Dimension 1: By Rule Category

### Category A: Possible Errors (Critical)

**Priority**: P0 - Critical
**Fix Timeline**: Immediate

**Rules**:

- `no-undef` - Using undefined variables
- `no-unused-vars` - Variables defined but not used
- `no-constant-condition` - Constant conditions in loops/conditionals
- `no-dupe-keys` - Duplicate keys in object literals
- `no-duplicate-case` - Duplicate case labels
- `no-empty` - Empty blocks
- `no-extra-boolean-cast` - Unnecessary boolean casts
- `no-inner-declarations` - Function/variable declarations in nested blocks
- `no-irregular-whitespace` - Irregular whitespace
- `no-obj-calls` - Calling global object properties as functions
- `no-prototype-builtins` - Directly calling Object.prototype methods
- `no-regex-spaces` - Multiple spaces in regular expressions
- `no-sparse-arrays` - Sparse arrays
- `no-template-curly-in-string` - Template literal string syntax in regular strings
- `no-unreachable` - Unreachable code after return/throw/break/continue
- `no-unsafe-finally` - Control flow statements in finally blocks
- `no-unsafe-negation` - Negating the left operand of relational operators
- `use-isnan` - Use isNaN() to check for NaN
- `valid-typeof` - Valid typeof comparisons

**Impact**: Application crashes, runtime errors, broken functionality

---

### Category B: Best Practices (High Priority)

**Priority**: P1 - High
**Fix Timeline**: This Sprint

**Rules**:

- `eqeqeq` - Require === and !==
- `no-console` - Disallow console statements
- `no-eval` - Disallow eval()
- `no-multi-spaces` - Disallow multiple spaces
- `no-return-await` - Disallow unnecessary return await
- `no-useless-return` - Disallow redundant return statements
- `no-useless-concat` - Disallow unnecessary concatenation
- `no-void` - Disallow void operators
- `prefer-promise-reject-errors` - Prefer rejecting with Error objects
- `require-await` - Disallow async functions without await
- `no-return-assign` - Disallow return assignments
- `no-throw-literal` - Require throwing Error objects
- `prefer-const` - Use const when variable isn't reassigned
- `no-var` - Disallow var
- `object-shorthand` - Use object method shorthand
- `prefer-arrow-callback` - Prefer arrow functions for callbacks
- `prefer-template` - Prefer template literals
- `no-param-reassign` - Disallow reassigning function parameters
- `no-bitwise` - Disallow bitwise operators
- `no-new-object` - Disallow Object constructors

**Impact**: Code quality, maintainability, developer experience

---

### Category C: Variables (Medium Priority)

**Priority**: P1-P2
**Fix Timeline**: This Sprint / Next Sprint

**Rules**:

- `no-shadow` - Disallow variable shadowing
- `no-shadow-restricted-names` - Disallow shadowing restricted names
- `no-use-before-define` - Disallow use before definition
- `no-delete-var` - Disallow deleting variables
- `label-var` - Disallow labels that share names with variables
- `no-undef-init` - Disallow initializing to undefined
- `no-catch-shadow` - Disallow catch clause parameter shadowing
- `no-redeclare` - Disallow variable redeclaration

**Impact**: Scope confusion, potential bugs, readability

---

### Category D: Stylistic Issues (Low Priority)

**Priority**: P2-P3
**Fix Timeline**: Backlog

**Rules**:

- `quotes` - Enforce consistent quote style
- `semi` - Require or disallow semicolons
- `indent` - Enforce consistent indentation
- `comma-dangle` - Require or disallow trailing commas
- `brace-style` - Enforce consistent brace style
- `camelcase` - Enforce camelCase naming
- `comma-spacing` - Enforce spacing after commas
- `func-names` - Require or disallow named function expressions
- `key-spacing` - Enforce spacing in object literals
- `keyword-spacing` - Enforce spacing around keywords
- `linebreak-style` - Enforce consistent linebreak style
- `lines-between-class-members` - Require or disallow blank lines
- `max-len` - Enforce maximum line length
- `new-cap` - Require constructor capitalization
- `new-parens` - Require parentheses when invoking constructors
- `no-array-constructor` - Disallow Array constructors
- `no-lonely-if` - Disallow if as only statement in else
- `no-mixed-spaces-and-tabs` - Disallow mixed spaces and tabs
- `no-multiple-empty-lines` - Disallow multiple empty lines
- `no-tabs` - Disallow tabs
- `no-trailing-spaces` - Disallow trailing spaces
- `object-curly-spacing` - Enforce spacing in object literals
- `one-var` - Require or disallow combined variable declarations
- `operator-linebreak` - Enforce consistent linebreak style
- `padded-blocks` - Require or disallow padding in blocks
- `quote-props` - Require quotes around object property names
- `semi-spacing` - Enforce spacing after semicolons
- `space-before-blocks` - Enforce spacing before blocks
- `space-before-function-paren` - Enforce spacing before function parentheses
- `space-in-parens` - Enforce spacing inside parentheses
- `space-infix-ops` - Require spacing around infix operators
- `spaced-comment` - Require or disallow spacing after comments

**Impact**: Style consistency, code readability

---

### Category E: ES6+ (Medium Priority)

**Priority**: P1-P2
**Fix Timeline**: This Sprint / Next Sprint

**Rules**:

- `no-var` - Disallow var
- `prefer-const` - Use const when variable isn't reassigned
- `prefer-arrow-callback` - Prefer arrow functions for callbacks
- `prefer-template` - Prefer template literals
- `prefer-destructuring` - Prefer destructuring
- `prefer-spread` - Prefer spread operator over apply
- `prefer-rest-params` - Prefer rest parameters over arguments
- `no-duplicate-imports` - Disallow duplicate imports
- `no-useless-constructor` - Disallow unnecessary constructors
- `object-shorthand` - Use object method shorthand
- `arrow-body-style` - Require or disallow arrow function bodies
- `arrow-parens` - Require parentheses around arrow function arguments
- `arrow-spacing` - Require spacing around arrow functions
- `no-confusing-arrow` - Disallow arrow functions where they could be confused
- `no-class-assign` - Disallow reassigning class declarations
- `no-const-assign` - Disallow reassigning const variables
- `no-dupe-class-members` - Disallow duplicate class members
- `no-new-symbol` - Disallow new Symbol operators
- `no-this-before-super` - Disallow use of this before super
- `prefer-numeric-literals` - Prefer numeric literals for parseInt
- `require-yield` - Require yield statements in generator functions

**Impact**: Modern practices, code clarity

---

### Category F: Node.js & CommonJS (Context-Dependent)

**Priority**: P2-P3
**Fix Timeline**: Backlog

**Rules**:

- `no-mixed-requires` - Disallow mixing CommonJS and ES modules
- `no-new-require` - Disallow new require
- `no-path-concat` - Disallow string concatenation with **dirname and **filename
- `no-process-env` - Disallow process.env
- `no-process-exit` - Disallow process.exit()
- `no-restricted-modules` - Disallow specified modules
- `no-restricted-properties` - Disallow specified object properties
- `no-sync` - Disallow synchronous methods

**Impact**: Node.js best practices

---

### Category G: TypeScript-Specific (if using TypeScript-ESLint)

**Priority**: P1-P2
**Fix Timeline**: This Sprint / Next Sprint

**Rules**:

- `@typescript-eslint/no-unused-vars` - Unused variables
- `@typescript-eslint/no-explicit-any` - Disallow any types
- `@typescript-eslint/explicit-function-return-type` - Require return types
- `@typescript-eslint/no-implicit-any` - Disallow implicit any
- `@typescript-eslint/prefer-nullish-coalescing` - Prefer ?? over ||
- `@typescript-eslint/prefer-optional-chain` - Prefer optional chaining
- `@typescript-eslint/strict-boolean-expressions` - Strict boolean expressions

**Impact**: Type safety, code quality

---

## Dimension 2: By Severity

### 🔴 Error Level

**Description**: Rules that produce ESLint errors (not warnings)

**Examples**:

- All `Possible Errors` category rules
- Most `Best Practices` category rules

**Action**: Must fix before committing

---

### 🟡 Warning Level

**Description**: Rules that produce ESLint warnings

**Examples**:

- Some `Stylistic Issues` category rules
- Certain `Best Practices` category rules
- `Node.js & CommonJS` category rules

**Action**: Should fix, can be temporarily disabled with justification

---

### 🔵 Informational Level

**Description**: Rules that provide information but don't block

**Examples**:

- Certain `Stylistic Issues` category rules
- Documentation rules

**Action**: Nice to have, address gradually

---

## Dimension 3: By Auto-Fixability

### ✅ Auto-Fixable

**Description**: ESLint can automatically fix these issues

**Examples**:

- `quotes` - Can auto-fix quote style
- `semi` - Can auto-add semicolons
- `no-var` - Can replace var with const/let
- `prefer-const` - Can replace let with const
- `object-shorthand` - Can convert to shorthand
- `prefer-template` - Can convert to template literals

**Action**: Run `eslint --fix` first

---

### ⚠️ Partially Auto-Fixable

**Description**: ESLint can fix some occurrences but not all

**Examples**:

- `no-unused-vars` - Can fix simple cases
- `eqeqeq` - Can fix simple cases

**Action**: Run `eslint --fix`, then manually fix remaining

---

### ❌ Manual Fix Required

**Description**: Requires human judgment to fix

**Examples**:

- `no-shadow` - May require renaming
- `no-use-before-define` - May require refactoring
- `complex` refactoring rules

**Action**: Manual review and fixes

---

## Dimension 4: By Impact

### 💥 High Impact

**Description**: Issues that directly affect functionality

**Characteristics**:

- Causes runtime errors
- Breaks application
- Security vulnerabilities
- Performance issues

**Examples**:

- `no-undef`
- `no-constant-condition`
- `no-eval`

**Action**: Fix immediately

---

### 📊 Medium Impact

**Description**: Issues that affect code quality

**Characteristics**:

- Reduces maintainability
- Creates confusion
- Makes debugging harder
- Developer experience issues

**Examples**:

- `no-shadow`
- `prefer-const`
- `no-var`

**Action**: Fix in current or next sprint

---

### 🎨 Low Impact

**Description**: Issues that affect style only

**Characteristics**:

- Style consistency
- Minor optimizations
- Personal preference

**Examples**:

- `quotes`
- `semi`
- `indent`

**Action**: Address gradually or use formatters

---

## Dimension 5: By Effort

### ⚡ Quick Wins (< 5 minutes)

**Description**: Simple, low-risk fixes

**Examples**:

- Single-line fixes
- Auto-fixable issues
- Simple replacements

**Rules**:

- `no-var` (simple cases)
- `eqeqeq`
- `quotes`
- `semi`

---

### 🔄 Moderate Effort (5-30 minutes)

**Description**: Requires some thought and testing

**Examples**:

- Multi-line changes
- Refactoring small sections
- Multiple occurrences

**Rules**:

- `no-shadow`
- `no-use-before-define`
- `prefer-destructuring`

---

### 🏗️ Significant Effort (> 30 minutes)

**Description**: Major refactoring required

**Examples**:

- Architectural changes
- Breaking changes
- Extensive testing needed

**Rules**:

- Complex `no-unused-vars` cases
- `no-duplicate-imports` with side effects
- Module restructuring

---

## Categorization Matrix

| Rule             | Category | Severity | Auto-Fix | Impact | Effort   | Priority |
| ---------------- | -------- | -------- | -------- | ------ | -------- | -------- |
| `no-undef`       | A        | Error    | Manual   | High   | Quick    | P0       |
| `no-unused-vars` | A        | Error    | Partial  | High   | Moderate | P1       |
| `eqeqeq`         | B        | Warning  | Auto     | Medium | Quick    | P1       |
| `no-console`     | B        | Warning  | Manual   | Medium | Quick    | P2       |
| `quotes`         | D        | Warning  | Auto     | Low    | Quick    | P3       |
| `semi`           | D        | Warning  | Auto     | Low    | Quick    | P3       |
| `no-var`         | E        | Error    | Auto     | Medium | Moderate | P1       |
| `prefer-const`   | B        | Warning  | Partial  | Medium | Quick    | P1       |

---

## Prioritization Framework

### ICE Score Calculation

```
ICE Score = Impact × Confidence × Ease

Impact (1-10):
- 10: Security, data loss, crash
- 8-9: Major functionality broken
- 6-7: Performance, confusing behavior
- 4-5: Code smell, maintainability
- 1-3: Style, minor optimization

Confidence (1-10):
- 10: Certain this is right
- 7-9: High confidence
- 5-6: Moderate confidence
- 3-4: Low confidence
- 1-2: Needs research

Ease (1-10):
- 10: Automated, no risk
- 8-9: Simple, low risk
- 6-7: Moderate, some testing
- 4-5: Complex, needs testing
- 1-3: Major refactor, high risk

Priority Levels:
- 70+: P0 (Critical)
- 50-69: P1 (High)
- 30-49: P2 (Medium)
- 10-29: P3 (Low)
- <10: Defer
```

---

## Documentation Template

````markdown
## [Rule Name]

**Category**: [A/B/C/D/E/F/G]
**Priority**: [P0/P1/P2/P3]
**Severity**: [Error/Warning/Info]
**Auto-Fixable**: [Yes/Partial/No]
**Impact**: [High/Medium/Low]
**Effort**: [Quick/Moderate/Significant]
**ICE Score**: [##]

### Description

[What the rule does]

### Rationale

[Why this matters]

### Examples

#### Before

```javascript
// ❌ [Issue]
```
````

#### After

```javascript
// ✅ [Fix]
```

### Fix Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Verification

```bash
[How to verify]
```

### Common Mistakes

- [Mistake 1]
- [Mistake 2]

### See Also

- [Related rule]
- [Documentation]

```

---

## Usage

1. **Categorize Warnings**: Use this framework to categorize each ESLint warning
2. **Calculate Priority**: Use ICE score to determine priority
3. **Document Fixes**: Use the template to document fixes
4. **Track Progress**: Use categories to track fixing progress

---

**Next Steps**: Apply this framework to categorize ESLint warnings in your codebase.
```
