# npm Scripts Research: ESLint and Prettier Integration

**Research Date:** 2026-01-12
**Project:** hacky-hack
**Purpose:** Research best practices for npm script naming, configuration, and integration patterns for ESLint and Prettier

---

## Table of Contents

1. [Recommended Script Names and Patterns](#recommended-script-names-and-patterns)
2. [Integration with Build Workflows](#integration-with-build-workflows)
3. [CI/CD Considerations](#cicd-considerations)
4. [Advanced Patterns and Tools](#advanced-patterns-and-tools)
5. [Project-Specific Recommendations](#project-specific-recommendations)

---

## Recommended Script Names and Patterns

### Core Script Naming Conventions

Based on industry best practices and community standards, the following script naming patterns are widely adopted:

#### Primary Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,scss,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,scss,md,yml,yaml}\""
  }
}
```

#### Combined/Convenience Scripts

```json
{
  "scripts": {
    "validate": "npm run lint && npm run format:check",
    "fix": "npm run lint:fix && npm run format",
    "check": "npm run lint && npm run format:check && npm run test",
    "precommit": "lint-staged"
  }
}
```

### Script Naming Best Practices

1. **Use colons for namespaces** (e.g., `lint:fix`, `format:check`)
2. **Keep script names short and descriptive**
3. **Follow the pattern: `<action>:<scope>`**
   - `lint` - Check code quality
   - `lint:fix` - Auto-fix linting issues
   - `format` - Apply formatting changes
   - `format:check` - Check formatting without modifying files
4. **Provide both check and fix variants** for better developer experience

### Target-Specific Scripts

For projects with multiple packages or specific targets:

```json
{
  "scripts": {
    "lint:src": "eslint src --ext .ts",
    "lint:test": "eslint test --ext .ts",
    "lint:all": "npm run lint:src && npm run lint:test",
    "format:src": "prettier --write \"src/**/*.ts\"",
    "format:test": "prettier --write \"test/**/*.ts\""
  }
}
```

### ESLint Configuration Options

Common ESLint script patterns:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:quiet": "eslint . --quiet",
    "lint:cache": "eslint . --cache",
    "lint:staged": "eslint --cache --fix"
  }
}
```

**Key ESLint flags:**

- `--fix` - Automatically fix problems
- `--quiet` - Report errors only (ignore warnings)
- `--cache` - Cache results for faster runs
- `--ext` - Specify file extensions
- `--max-warnings` - Set warning threshold (exit with non-zero if exceeded)

### Prettier Configuration Options

Common Prettier script patterns:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:debug": "prettier --write --debug-print-comments ."
  }
}
```

**Key Prettier flags:**

- `--write` - Overwrite files with formatted output
- `--check` - Check if files are formatted (useful for CI)
- `--list-different` - List unformatted files
- `--config` - Path to config file
- `--ignore-path` - Path to ignore file

---

## Integration with Build Workflows

### Pre-Build Integration

Pattern: Run linting and formatting checks before building

```json
{
  "scripts": {
    "prebuild": "npm run validate",
    "build": "tsc",
    "validate": "npm run lint && npm run format:check"
  }
}
```

**Pros:** Catches issues early, prevents broken builds
**Cons:** Slows down build process, may be disruptive during active development

### Development Workflow Integration

Pattern: Separate linting from hot-reload development

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "dev:watch": "concurrently \"npm run dev\" \"npm run lint:watch\"",
    "lint:watch": "esw --watch --color"
  }
}
```

**Tools for concurrent execution:**

- `concurrently` - Run multiple commands concurrently
- `npm-run-all` - Run npm scripts sequentially or in parallel
- `esw` (ESLint Watcher) - Watch files and run ESLint

### Test Workflow Integration

Pattern: Integrate linting with test execution

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ci": "npm run lint && npm run format:check && npm run test:run --coverage",
    "pretest": "npm run lint"
  }
}
```

### Git Hooks Integration (Husky + lint-staged)

**Installation:**

```bash
npm install --save-dev husky lint-staged
npx husky init
```

**package.json configuration:**

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

**Pre-commit hook (.husky/pre-commit):**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**Benefits:**

- Runs only on changed files (fast)
- Catches issues before commits
- Provides immediate feedback
- Reduces CI failures

### Pre-commit Script Pattern

Alternative to husky using npm scripts:

```json
{
  "scripts": {
    "precommit": "npm run lint:staged && npm run format:staged",
    "lint:staged": "eslint --cache --fix",
    "format:staged": "prettier --write"
  }
}
```

---

## CI/CD Considerations

### GitHub Actions Integration

**Basic workflow (.github/workflows/lint.yml):**

```yaml
name: Lint & Format

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check
```

### CI-Specific Scripts

Create scripts optimized for CI environments:

```json
{
  "scripts": {
    "lint:ci": "eslint . --max-warnings 0 --format junit --output-file eslint-report.xml",
    "format:ci": "prettier --check .",
    "validate:ci": "npm run lint:ci && npm run format:ci && npm run test:ci"
  }
}
```

**Key CI considerations:**

- Use `npm ci` instead of `npm install` for reproducible builds
- Set `--max-warnings 0` to treat warnings as errors in CI
- Generate reports for CI tools (JUnit, GitHub annotations)
- Cache dependencies to speed up builds

### Dependency Caching in CI

**GitHub Actions caching example:**

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### ESLint and Prettier Caching

**ESLint caching:**

```json
{
  "scripts": {
    "lint": "eslint . --cache",
    "lint:cache-clean": "rm -rf .eslintcache"
  }
}
```

**Benefits:**

- Significantly faster subsequent runs
- Only checks changed files
- Reduces CI time

### Parallel Execution in CI

**GitHub Actions matrix strategy:**

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        check: [eslint, prettier, types]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run ${{ matrix.check }}
```

### Failure Handling Patterns

**1. Report errors but continue:**

```json
{
  "scripts": {
    "check:all": "npm run lint || true && npm run format:check || true && npm run test"
  }
}
```

**2. Fail fast on critical issues:**

```json
{
  "scripts": {
    "check:strict": "set -e; npm run lint && npm run format:check && npm run test"
  }
}
```

**3. Generate detailed reports:**

```json
{
  "scripts": {
    "lint:report": "eslint . --format json --output-file eslint-report.json",
    "format:report": "prettier --check . --log-level debug"
  }
}
```

### CI/CD Best Practices

1. **Separate lint and format jobs** - Better error isolation and faster feedback
2. **Run linting before tests** - Catch formatting issues early
3. **Use caching aggressively** - Dependency and lint caches reduce run time
4. **Fail builds on lint errors** - Enforce code quality standards
5. **Generate artifacts** - Save lint reports for review
6. **Add status badges** - Display build status in README
7. **Block merge on failures** - Use branch protection rules

---

## Advanced Patterns and Tools

### ESLint + Prettier Integration

**Install required packages:**

```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
```

**Configuration (.eslintrc.js):**

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Must be last to disable conflicting rules
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
```

### Tool-Specific Packages

**1. eslint-watch** - Watch mode for ESLint

```json
{
  "scripts": {
    "lint:watch": "esw --watch --color"
  }
}
```

**2. lint-staged** - Run linters on git staged files

```json
{
  "scripts": {
    "lint:staged": "lint-staged"
  }
}
```

**3. commitlint** - Lint commit messages

```json
{
  "scripts": {
    "commitmsg": "commitlint -e $GIT_PARAMS"
  }
}
```

### Multi-Package Monorepo Patterns

**Using workspace-aware scripts:**

```json
{
  "scripts": {
    "lint": "npm run lint --workspaces-if-present",
    "lint:fix": "npm run lint:fix --workspaces-if-present",
    "format": "npm run format --workspaces-if-present",
    "lint:packages": "npm run lint --ws"
  }
}
```

**Turbo or Nx integration:**

```json
{
  "scripts": {
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "turbo run format",
    "validate": "turbo run lint format"
  }
}
```

### Performance Optimization

**1. Parallel execution:**

```json
{
  "scripts": {
    "validate": "npm-run-all --parallel lint format:check test"
  }
}
```

**2. Selective linting:**

```json
{
  "scripts": {
    "lint:changed": "eslint $(git diff --name-only --diff-filter=ACM HEAD | grep -E '\\.(js|ts)$')"
  }
}
```

**3. Incremental linting:**

```json
{
  "scripts": {
    "lint": "eslint . --cache --cache-location .eslintcache"
  }
}
```

### Documentation Generation

**Generate linting documentation:**

```json
{
  "scripts": {
    "lint:docs": "eslint --print-config .eslintrc.js > eslint-config.md"
  }
}
```

### Automated Fixing in CI

**Optional auto-fix for specific branches:**

```yaml
- name: Auto-fix formatting
  if: github.ref == 'refs/heads/develop'
  run: |
    npm run lint:fix
    npm run format

- name: Commit auto-fixes
  if: github.ref == 'refs/heads/develop'
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git commit -am "Auto-fix linting" || true
    git push
```

---

## Project-Specific Recommendations

### Current Project Analysis

**Project:** hacky-hack
**Type:** TypeScript CLI application
**Build Tool:** TypeScript Compiler (tsc)
**Test Runner:** Vitest
**Node Version:** >=20.0.0

### Recommended Scripts for hacky-hack

Based on the project structure and requirements:

```json
{
  "scripts": {
    // Existing scripts
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "watch": "nodemon --exec tsx src/index.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "validate:api": "tsx src/scripts/validate-api.ts",

    // Recommended additions
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "lint:cache": "eslint . --ext .ts --cache",
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",
    "validate": "npm run lint && npm run format:check",
    "validate:full": "npm run lint && npm run format:check && npm run test:run",
    "fix": "npm run lint:fix && npm run format",
    "precommit": "lint-staged",
    "prebuild": "npm run validate",
    "ci": "npm run validate:full"
  }
}
```

### Recommended File Structure

```
hacky-hack/
├── .eslintrc.js
├── .eslintignore
├── .prettierrc
├── .prettierignore
├── .husky/
│   └── pre-commit
├── .github/
│   └── workflows/
│       ├── lint.yml
│       └── ci.yml
└── package.json
```

### ESLint Configuration for TypeScript

**.eslintrc.js:**

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
};
```

**.eslintignore:**

```
node_modules/
dist/
coverage/
*.config.js
```

### Prettier Configuration

**.prettierrc:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

**.prettierignore:**

```
node_modules/
dist/
coverage/
package-lock.json
```

### Lint-Staged Configuration

**package.json:**

```json
{
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### GitHub Actions Workflow

**.github/workflows/lint.yml:**

```yaml
name: Lint & Format

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Run TypeScript check
        run: npm run build
```

### Recommended Dependencies

```bash
npm install --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier \
  husky \
  lint-staged
```

### Implementation Priority

1. **Phase 1 - Basic Setup** (Immediate)
   - Install ESLint and Prettier
   - Add `lint`, `lint:fix`, `format`, `format:check` scripts
   - Create basic configuration files

2. **Phase 2 - Workflow Integration** (Short-term)
   - Add `validate` and `prebuild` scripts
   - Configure .eslintignore and .prettierignore
   - Set up TypeScript-specific rules

3. **Phase 3 - Git Hooks** (Medium-term)
   - Install and configure husky
   - Set up lint-staged
   - Create pre-commit hook

4. **Phase 4 - CI/CD** (Long-term)
   - Create GitHub Actions workflow
   - Add CI-specific scripts
   - Configure caching and reporting

### Best Practices Summary

1. **Always run Prettier before ESLint** - Format code, then lint
2. **Use eslint-config-prettier** - Disable conflicting ESLint rules
3. **Separate check and fix commands** - Check for CI, fix for development
4. **Cache aggressively** - Speed up both local and CI runs
5. **Integrate with git hooks** - Catch issues before commit
6. **Fail CI on lint errors** - Enforce code quality
7. **Keep configurations simple** - Start with defaults, customize as needed
8. **Document your choices** - Comment on non-standard configurations

---

## References and Further Reading

### Official Documentation

- ESLint Documentation: https://eslint.org/docs/latest/
- Prettier Documentation: https://prettier.io/docs/en/
- Husky Documentation: https://typicode.github.io/husky/
- lint-staged Documentation: https://github.com/okonet/lint-staged

### Community Resources

- Awesome ESLint: https://github.com/dustinspecker/awesome-eslint
- Prettier Option Comparison: https://prettier.io/playground/
- TypeScript ESLint: https://typescript-eslint.io/

### Key Takeaways

- Script naming follows the pattern `<action>:<scope>`
- Always provide both check and fix variants
- Integrate with pre-commit hooks for immediate feedback
- Use caching to improve performance
- Configure CI to fail on lint/format errors
- Keep Prettier and ESLint configurations synchronized
- Start simple, then add complexity as needed

---

**Document Version:** 1.0
**Last Updated:** 2026-01-12
**Status:** Complete
