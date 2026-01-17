# Quick Reference Templates for ESLint Documentation

> **Purpose**: Ready-to-use templates for creating quick reference cards, cheat sheets, and one-page summaries.
>
> **Created**: 2026-01-15
> **Use Case**: PRP for creating ESLint warning fix documentation

---

## Template 1: One-Page Quick Reference

````markdown
# ESLint Quick Reference

> One-page reference for common ESLint rules and fixes

## Priority Levels

| Level | Symbol | Name     | Timeline    | Example Rules                   |
| ----- | ------ | -------- | ----------- | ------------------------------- |
| P0    | 🔴     | Critical | Immediate   | no-undef, no-constant-condition |
| P1    | 🟡     | High     | This Sprint | eqeqeq, no-var, prefer-const    |
| P2    | 🔵     | Medium   | Next Sprint | no-shadow, no-console           |
| P3    | ⚪     | Low      | Backlog     | quotes, semi, indent            |

## Common Rules

| Rule             | Category      | Auto-fix | Priority | Quick Fix            |
| ---------------- | ------------- | -------- | -------- | -------------------- |
| `no-unused-vars` | Variables     | Partial  | P1       | Remove unused vars   |
| `no-undef`       | Errors        | Manual   | P0       | Define variables     |
| `eqeqeq`         | Best Practice | Auto     | P1       | Use ===              |
| `no-var`         | ES6+          | Auto     | P1       | Use const/let        |
| `prefer-const`   | Best Practice | Partial  | P1       | Use const            |
| `no-console`     | Best Practice | Manual   | P2       | Remove or use logger |

## Quick Commands

```bash
# Fix all auto-fixable
npm run lint -- --fix

# Check specific rule
npm run lint -- --rule 'no-console: error'

# Generate report
npm run lint -- --format json > report.json

# Check specific file
npm run lint src/components/Button.tsx
```
````

## Fix Pattern

1. Run `eslint --fix`
2. Categorize remaining by priority
3. Fix P0 issues
4. Fix P1 issues
5. Fix P2 issues
6. Fix P3 issues gradually

## Common Fixes

### Remove Unused Variables

```javascript
// Before
const unused = 1;
const used = 2;

// After
const used = 2;
```

### Use const Instead of var

```javascript
// Before
var count = 0;

// After
const count = 0;
```

### Use === Instead of ==

```javascript
// Before
if (x == y) {
}

// After
if (x === y) {
}
```

## Resources

- [Full Documentation](./README.md)
- [Rule Categories](./categories.md)
- [Troubleshooting](./troubleshooting.md)

---

_Generated: YYYY-MM-DD | Version: X.Y.Z_

````

---

## Template 2: Category-Based Reference Card

```markdown
# ESLint Variables Reference

> Quick reference for variable-related ESLint rules

## Rule Overview

| Rule | Priority | Auto-fix | Impact | Effort |
|------|----------|----------|--------|--------|
| `no-unused-vars` | P1 | Partial | High | Moderate |
| `no-undef` | P0 | Manual | High | Quick |
| `no-var` | P1 | Auto | Medium | Moderate |
| `prefer-const` | P1 | Partial | Medium | Quick |
| `no-shadow` | P2 | Manual | Medium | Moderate |
| `no-use-before-define` | P1 | Manual | High | Moderate |

## Quick Fixes

### no-unused-vars (P1)

```javascript
// ❌ Before
const unused = 1;
const used = 2;

// ✅ After
const used = 2;

// Or prefix if intentionally unused
const _unused = 1;
````

**Command**: `eslint --fix`

---

### no-undef (P0)

```javascript
// ❌ Before
const x = y; // y is not defined

// ✅ After
const y = 1;
const x = y;
```

**Action**: Define the variable first

---

### no-var (P1)

```javascript
// ❌ Before
var count = 0;
var total = 0;

// ✅ After
const count = 0;
let total = 0;
```

**Command**: `eslint --fix`

---

### prefer-const (P1)

```javascript
// ❌ Before
let count = 0;
count = 1; // never reassigned

// ✅ After
const count = 0;
```

**Command**: `eslint --fix`

---

### no-shadow (P2)

```javascript
// ❌ Before
function foo(x) {
  const x = 1; // shadows parameter
}

// ✅ After
function foo(x) {
  const y = 1;
}
```

**Action**: Rename the variable

---

### no-use-before-define (P1)

```javascript
// ❌ Before
const x = y;
const y = 1;

// ✅ After
const y = 1;
const x = y;
```

**Action**: Reorder declarations

---

## Checklist

- [ ] Replace all `var` with `const` or `let`
- [ ] Use `const` when not reassigning
- [ ] Remove unused variables
- [ ] Avoid shadowing variables
- [ ] Define variables before use
- [ ] Use meaningful variable names

## Commands

```bash
# Fix all variable issues
eslint --fix --rule 'no-var: error' --rule 'prefer-const: warn'

# Check for undefined variables
eslint -- --rule 'no-undef: error'

# Generate report
eslint -- --format json > variables-report.json
```

## Resources

- [ESLint Variables Rules](https://eslint.org/docs/latest/rules/#variables)
- [Full Documentation](./README.md)

---

_Category: Variables | Priority: P0-P2_

````

---

## Template 3: Priority-Based Cheat Sheet

```markdown
# ESLint Fix Cheat Sheet by Priority

> Organized by priority for systematic fixing

## 🔴 P0: Critical (Fix Immediately)

### Security & Crashes

| Rule | Issue | Fix | Command |
|------|-------|-----|---------|
| `no-undef` | Using undefined variables | Define the variable | Manual |
| `no-constant-condition` | Constant conditions | Fix the condition | Manual |
| `no-dupe-keys` | Duplicate object keys | Remove duplicate | Manual |
| `no-duplicate-case` | Duplicate case labels | Remove duplicate | Manual |

**Timeline**: Fix today
**Impact**: Prevents crashes and errors

```javascript
// ❌ Example: no-undef
const x = undefinedVar;

// ✅ Fix
const undefinedVar = 1;
const x = undefinedVar;
````

---

## 🟡 P1: High Priority (Fix This Sprint)

### Code Quality

| Rule             | Issue                   | Fix                  | Command        |
| ---------------- | ----------------------- | -------------------- | -------------- |
| `no-unused-vars` | Unused variables        | Remove or use        | `eslint --fix` |
| `eqeqeq`         | Using == instead of === | Use ===              | `eslint --fix` |
| `no-var`         | Using var keyword       | Use const/let        | `eslint --fix` |
| `prefer-const`   | Using let for constants | Use const            | `eslint --fix` |
| `no-console`     | Console statements      | Remove or use logger | Manual         |

**Timeline**: This sprint
**Impact**: Improves code quality

```javascript
// ❌ Example: eqeqeq
if (x == y) {
}

// ✅ Fix
if (x === y) {
}
```

---

## 🔵 P2: Medium Priority (Fix Next Sprint)

### Maintainability

| Rule                    | Issue                  | Fix                   | Command        |
| ----------------------- | ---------------------- | --------------------- | -------------- |
| `no-shadow`             | Variable shadowing     | Rename variable       | Manual         |
| `no-console`            | Console in production  | Remove or use logger  | Manual         |
| `prefer-arrow-callback` | Function callbacks     | Use arrow functions   | `eslint --fix` |
| `prefer-template`       | String concatenation   | Use template literals | `eslint --fix` |
| `object-shorthand`      | Verbose object methods | Use shorthand         | `eslint --fix` |

**Timeline**: Next sprint
**Impact**: Better maintainability

```javascript
// ❌ Example: no-shadow
function foo(x) {
  const x = 1;
}

// ✅ Fix
function foo(x) {
  const y = 1;
}
```

---

## ⚪ P3: Low Priority (Backlog)

### Style Consistency

| Rule           | Issue                    | Fix                  | Command        |
| -------------- | ------------------------ | -------------------- | -------------- |
| `quotes`       | Inconsistent quotes      | Use consistent style | `eslint --fix` |
| `semi`         | Missing semicolons       | Add semicolons       | `eslint --fix` |
| `indent`       | Inconsistent indentation | Fix indentation      | `eslint --fix` |
| `comma-dangle` | Trailing commas          | Consistent style     | `eslint --fix` |

**Timeline**: Backlog (or use formatter)
**Impact**: Style consistency

```javascript
// ❌ Example: quotes
const x = 'hello';

// ✅ Fix (if using double quotes)
const x = 'hello';
```

---

## Quick Commands

```bash
# Fix all auto-fixable (run first)
npm run lint -- --fix

# Fix by priority
npm run lint -- --rule 'no-undef: error'
npm run lint -- --rule 'eqeqeq: error'

# Generate priority report
npm run lint -- --format json > report.json

# Count by rule
npm run lint -- --format compact | sort | uniq -c
```

---

## Fix Workflow

1. **Phase 1: Auto-fix**

   ```bash
   npm run lint -- --fix
   ```

2. **Phase 2: Fix P0**
   - Review all remaining P0 issues
   - Fix manually
   - Test thoroughly

3. **Phase 3: Fix P1**
   - Address all P1 issues
   - Run tests
   - Commit changes

4. **Phase 4: Fix P2**
   - Plan for next sprint
   - Fix systematically
   - Update docs

5. **Phase 5: Fix P3**
   - Address gradually
   - Or use formatter
   - Keep in backlog

---

## Resources

- [Full Documentation](./README.md)
- [Rule Categories](./categories.md)
- [Categorization Framework](./categorization.md)

---

_Organized by Priority | Version: X.Y.Z_

````

---

## Template 4: Command Reference Card

```markdown
# ESLint Command Reference

> Quick reference for common ESLint commands

## Basic Commands

### Run ESLint
```bash
# All files
eslint .

# Specific file
eslint src/components/Button.tsx

# Specific directory
eslint src/components/

# With config file
eslint -c .eslintrc.custom.js
````

### Auto-fix

```bash
# Fix all auto-fixable issues
eslint --fix .

# Fix specific file
eslint --fix src/components/Button.tsx

# Fix specific rule
eslint --fix --rule 'quotes: ["error", "single"]'
```

### Reporting

```bash
# JSON format
eslint --format json > report.json

# HTML format
eslint --format html > report.html

# Compact format
eslint --format compact

# Unix format
eslint --format unix

# Visual format (requires plugin)
eslint --format stylish
```

---

## Rule-Specific Commands

### Check Specific Rule

```bash
# Enable specific rule
eslint --rule 'no-console: error'

# Disable specific rule
eslint --rule 'no-console: off'

# Set rule options
eslint --rule 'quotes: ["error", "single", { "avoidEscape": true }]'
```

### Check Specific Pattern

```bash
# Check test files
eslint "**/*.test.ts"

# Check TypeScript files
eslint "**/*.ts"

# Check specific directory
eslint src/utils/
```

---

## Output Control

### Quiet Mode

```bash
# Only show errors (not warnings)
eslint --quiet .

# Max warnings (treat warnings as errors if exceeded)
eslint --max-warnings 0 .
```

### Verbose Mode

```bash
# Show detailed output
eslint --verbose .

# Debug mode
eslint --debug .
```

---

## Cache & Performance

### Use Cache

```bash
# Use cache (default: .eslintcache)
eslint --cache .

# Specify cache file
eslint --cache --cache-file .custom-cache .

# Cache location
eslint --cache-location /tmp/eslint-cache
```

### Performance

```bash
# Print timing
eslint --debug . | grep "Rule"

# Ignore files
eslint --ignore-pattern "*.test.js" .
```

---

## Configuration Commands

### Print Config

```bash
# Print effective config
eslint --print-config src/file.ts

# Print config for specific rule
eslint --print-config src/file.ts | grep no-console
```

### Validate Config

```bash
# Validate configuration
eslint --print-config .eslintrc.json
```

---

## Integration Commands

### With Git

```bash
# Lint staged files
git diff --name-only --cached | xargs eslint

# Lint changed files
git diff --name-only HEAD~1 | xargs eslint
```

### With Package Managers

```bash
# npm script
npm run lint

# npm with arguments
npm run lint -- --fix

# yarn
yarn lint
```

---

## CI/CD Commands

### Fail on Warnings

```bash
# Treat warnings as errors
eslint --max-warnings 0 .
```

### Generate Report

```bash
# JSON report for CI
eslint --format json --output-file eslint-report.json .

# JUnit format for CI
eslint --format junit --output-file eslint-junit.xml .
```

---

## Common Scenarios

### Scenario 1: Quick Fix

```bash
# Fix everything
eslint --fix .

# Fix and report
eslint --fix --format stylish .
```

### Scenario 2: Check Before Commit

```bash
# Check all files
eslint .

# Check staged files
git diff --name-only --cached | xargs eslint
```

### Scenario 3: Generate Report

```bash
# Full report
eslint --format json --output-file report.json .

# Summary
cat report.json | jq '[.[] | {filePath, messages: [.messages[] | {ruleId, severity}]}]'
```

### Scenario 4: Categorize Issues

```bash
# Count by rule
eslint --format json | jq '[.[] | .messages[] | .ruleId] | group_by(.) | map({rule: .[0], count: length})'

# Count by severity
eslint --format json | jq '[.[] | .messages[] | .severity] | group_by(.) | map({severity: .[0], count: length})'
```

---

## Tips & Tricks

### Combine Commands

```bash
# Fix and then check
eslint --fix . && eslint .

# Fix specific files
find src -name "*.ts" -exec eslint --fix {} \;
```

### Use with Other Tools

```bash
# Prettier + ESLint
prettier --write "src/**/*.ts" && eslint --fix "src/**/*.ts"

# TypeScript compiler + ESLint
tsc --noEmit && eslint .
```

---

## Cheat Sheet Summary

| Task          | Command                            |
| ------------- | ---------------------------------- |
| Run           | `eslint .`                         |
| Fix           | `eslint --fix`                     |
| Report        | `eslint --format json`             |
| Specific rule | `eslint --rule 'rule-name: error'` |
| Cache         | `eslint --cache`                   |
| Quiet         | `eslint --quiet`                   |
| Config        | `eslint --print-config`            |

---

**Next**: See [Full Documentation](./README.md) for detailed examples.

---

_Command Reference | Updated: YYYY-MM-DD_

````

---

## Template 5: Troubleshooting Reference

```markdown
# ESLint Troubleshooting Quick Reference

> Common issues and solutions

## Common Errors

### Error: "no-undef"

**Issue**: Variable is used but not defined

```javascript
// ❌ Error
const x = undefinedVar;
````

**Solution**: Define the variable first

```javascript
// ✅ Fixed
const undefinedVar = 1;
const x = undefinedVar;
```

---

### Error: "no-unused-vars"

**Issue**: Variable is defined but not used

```javascript
// ❌ Error
const unusedVar = 1;
const usedVar = 2;
console.log(usedVar);
```

**Solution**: Remove the variable or use it

```javascript
// ✅ Fixed - Option 1: Remove
const usedVar = 2;
console.log(usedVar);

// ✅ Fixed - Option 2: Prefix with underscore
const _unusedVar = 1;
const usedVar = 2;
console.log(usedVar);
```

---

### Error: "eqeqeq"

**Issue**: Using == instead of ===

```javascript
// ❌ Error
if (x == y) {
}
```

**Solution**: Use ===

```javascript
// ✅ Fixed
if (x === y) {
}
```

---

### Error: "no-var"

**Issue**: Using var keyword

```javascript
// ❌ Error
var count = 0;
```

**Solution**: Use const or let

```javascript
// ✅ Fixed
const count = 0; // if not reassigned
let total = 0; // if reassigned
```

---

### Error: "prefer-const"

**Issue**: Using let when const is appropriate

```javascript
// ❌ Error
let count = 0;
// count is never reassigned
```

**Solution**: Use const

```javascript
// ✅ Fixed
const count = 0;
```

---

## Common Warning Scenarios

### Warning: "no-console"

**Issue**: Console statements in production code

```javascript
// ⚠️ Warning
console.log('Debug info');
```

**Solution**: Remove or use a logger

```javascript
// ✅ Fixed - Option 1: Remove
// (Delete the console statement)

// ✅ Fixed - Option 2: Use logger
logger.info('Debug info');
```

---

### Warning: "no-shadow"

**Issue**: Variable shadowing

```javascript
// ⚠️ Warning
function foo(x) {
  const x = 1; // shadows parameter
}
```

**Solution**: Rename the variable

```javascript
// ✅ Fixed
function foo(x) {
  const y = 1;
}
```

---

## Auto-Fix Issues

### Auto-fix Won't Fix Everything

**Issue**: `eslint --fix` doesn't fix all issues

**Solution**:

1. Some rules can't be auto-fixed (manual review needed)
2. Some rules can only be partially auto-fixed
3. Run `eslint --fix` first, then manually fix remaining

```bash
# Step 1: Auto-fix
eslint --fix .

# Step 2: Review remaining
eslint .

# Step 3: Fix manually
```

---

## Configuration Issues

### Rule Not Working

**Issue**: Rule is configured but not triggering

**Check**:

1. Rule name is correct
2. Rule is enabled (not disabled in overrides)
3. File matches included patterns
4. File doesn't match excluded patterns

```bash
# Debug config
eslint --print-config src/file.ts

# Check rule is enabled
eslint --print-config src/file.ts | grep rule-name
```

---

### Conflicting Rules

**Issue**: Two rules conflict

**Example**: `quotes` and `@typescript-eslint/quotes`

**Solution**: Disable one rule

```json
{
  "rules": {
    "quotes": "off",
    "@typescript-eslint/quotes": ["error", "single"]
  }
}
```

---

## Performance Issues

### ESLint is Slow

**Solutions**:

1. Use cache
2. Lint only changed files
3. Parallelize linting

```bash
# Use cache
eslint --cache .

# Lint changed files
git diff --name-only HEAD~1 | xargs eslint

# Parallelize (requires npm-run-all or similar)
npm-run-all --parallel lint:src lint:test
```

---

## CI/CD Issues

### Failing in CI but Not Locally

**Check**:

1. Node versions match
2. Dependencies match (`npm ci` vs `npm install`)
3. Environment variables
4. File paths (relative vs absolute)

```bash
# Debug in CI
eslint --debug . > eslint-debug.log
```

---

## Quick Reference Table

| Error/Warn     | Cause              | Quick Fix     | Command        |
| -------------- | ------------------ | ------------- | -------------- |
| no-undef       | Undefined variable | Define it     | Manual         |
| no-unused-vars | Unused variable    | Remove it     | `eslint --fix` |
| eqeqeq         | Using ==           | Use ===       | `eslint --fix` |
| no-var         | Using var          | Use const/let | `eslint --fix` |
| prefer-const   | Using let          | Use const     | `eslint --fix` |
| no-console     | Console statement  | Remove it     | Manual         |
| no-shadow      | Shadowing          | Rename        | Manual         |

---

## Getting Help

### Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Rule Documentation](https://eslint.org/docs/latest/rules/)
- [GitHub Issues](https://github.com/eslint/eslint/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/eslint)

### Debugging Tips

1. Use `--debug` flag
2. Check `--print-config`
3. Review `.eslintrc` configuration
4. Check for conflicting plugins
5. Verify Node version compatibility

---

**Need More?** See [Full Documentation](./README.md)

---

_Troubleshooting Reference | Updated: YYYY-MM-DD_

```

---

## How to Use These Templates

1. **Copy the template** that best fits your needs
2. **Customize** for your specific ESLint configuration
3. **Update** with your actual rules and priorities
4. **Distribute** to team members
5. **Maintain** as rules and configurations change

---

## Template Selection Guide

| Use Case | Template |
|----------|----------|
| General overview | Template 1: One-Page Quick Reference |
| Category-specific | Template 2: Category-Based Reference Card |
| Prioritized fixing | Template 3: Priority-Based Cheat Sheet |
| Command reference | Template 4: Command Reference Card |
| Issue resolution | Template 5: Troubleshooting Reference |

---

**Next Steps**: Choose a template, customize it, and integrate it into your documentation workflow.

---

**Document Status**: ✅ Complete
**Version**: 1.0.0
**Created**: 2026-01-15
```
