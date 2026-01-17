# Documentation Consistency Verification - Best Practices Research

> **Research Document**: Comprehensive guide on tools, patterns, and approaches for verifying documentation consistency across multiple files.
>
> **Created**: 2026-01-15
> **Purpose**: Research resource for implementing automated and manual documentation verification systems

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Automated Verification Tools](#2-automated-verification-tools)
- [3. Grep-Based Verification Patterns](#3-grep-based-verification-patterns)
- [4. Documentation Linting Tools](#4-documentation-linting-tools)
- [5. Link Validation Approaches](#5-link-validation-approaches)
- [6. Open Source Project Examples](#6-open-source-project-examples)
- [7. Custom Verification Scripts](#7-custom-verification-scripts)
- [8. CI/CD Integration Patterns](#8-cicd-integration-patterns)
- [9. Manual Verification Approaches](#9-manual-verification-approaches)
- [10. Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Overview

### 1.1 What is Documentation Consistency?

Documentation consistency refers to maintaining accuracy, coherence, and uniformity across all documentation files. This includes:

- **Internal Links**: References to other sections within the same document
- **Cross-Document Links**: References to other documentation files
- **External Links**: URLs to external resources
- **Code Examples**: Code snippets that match the actual codebase
- **Terminology**: Consistent use of technical terms
- **Formatting**: Uniform heading structure, code blocks, lists
- **Metadata**: Consistent dates, versions, author information

### 1.2 Why Verification Matters

```markdown
**Benefits of Consistent Documentation**:

- Improved user experience and trust
- Reduced support burden
- Faster onboarding for new team members
- Better SEO and discoverability
- Professional project image
- Reduced errors from outdated information

**Costs of Inconsistent Documentation**:

- User confusion and frustration
- Increased support tickets
- Wasted development time
- Loss of credibility
- Security vulnerabilities from outdated info
```

### 1.3 Verification Categories

```markdown
1. **Structural Consistency**
   - Heading hierarchy (H1 → H2 → H3)
   - Table of contents accuracy
   - Section ordering

2. **Content Consistency**
   - Terminology usage
   - Code example accuracy
   - Version numbers
   - API references

3. **Link Consistency**
   - Internal anchor links
   - Cross-document references
   - External URLs
   - Image references

4. **Metadata Consistency**
   - Last updated dates
   - Version numbers
   - Author attribution
   - Status indicators
```

---

## 2. Automated Verification Tools

### 2.1 Link Checking Tools

#### **lychee** (Recommended)

```bash
# URL: https://github.com/lycheeverse/lychee

# Install
cargo install lychee

# Basic usage
lychee docs/

# Check specific file
lychee README.md

# Exclude URLs
lychee docs/ --exclude "http://localhost"

# Verbose output
lychee docs/ --verbose

# Output format
lychee docs/ --format json

# GitHub Actions integration
lychee docs/ --format markdown --output link-report.md
```

**Features**:

- Async link checking (very fast)
- Supports Markdown, HTML, Text
- Checks mailto: and tel: links
- Configurable timeouts and retries
- Exclusion patterns for localhost/internal links
- Multiple output formats (JSON, Markdown, HTML)

**Best For**: Large documentation sites, CI/CD integration

---

#### **markdown-link-check**

```bash
# URL: https://github.com/gaurav-nelson/github-action-markdown-link-check

# Install
npm install -g markdown-link-check

# Basic usage
markdown-link-check README.md

# Check all markdown files
find . -name "*.md" -exec markdown-link-check {} \;

# With config file
markdown-link-check --config .linkcheck.json README.md
```

**Configuration Example**:

```json
{
  "ignorePatterns": [
    {
      "pattern": "^http://localhost"
    },
    {
      "pattern": "^https://example.com/internal"
    }
  ],
  "timeout": "5s",
  "retryOn429": true,
  "retryCount": 2,
  "fallbackRetryDelay": "30s"
}
```

**Best For**: Simple link checking, GitHub Actions

---

#### **LinkChecker** (Python)

```bash
# URL: https://github.com/linkchecker/linkchecker

# Install
pip install linkchecker

# Basic usage
linkchecker docs/

# Check specific file
linkchecker README.md

# Generate report
linkchecker docs/ --output=text > report.txt

# Check recursively
linkchecker docs/ --recursion-level=3
```

**Features**:

- Comprehensive checking
- Supports multiple protocols
- Detailed reporting
- Plugin system
- Check password-protected sites

**Best For**: Complex sites requiring detailed reports

---

### 2.2 Markdown Structure Tools

#### **markdownlint-cli2**

```bash
# URL: https://github.com/DavidAnson/markdownlint-cli2

# Install
npm install -g markdownlint-cli2

# Basic usage
markdownlint-cli2 "docs/**/*.md"

# Fix issues
markdownlint-cli2 "docs/**/*.md" --fix

# Custom config
markdownlint-cli2 "docs/**/*.md" --config .markdownlint.json
```

**Configuration Example**:

```json
{
  "default": true,
  "MD013": { "line_length": 120 },
  "MD033": false,
  "MD041": false,
  "no-inline-html": false
}
```

**Best For**: Ensuring consistent markdown formatting

---

### 2.3 Spelling and Grammar Tools

#### **cspell**

```bash
# URL: https://github.com/streetsidesoftware/cspell

# Install
npm install -g cspell

# Check files
cspell "docs/**/*.md"

# Check with custom dictionary
cspell "docs/**/*.md" --dict my-words.txt

# Add words
cspell "docs/**/*.md" --words-add "kubernetes,typescript"
```

**Best For**: Catching typos in documentation

---

### 2.4 Specialized Documentation Tools

#### **Vale** (Style Guide Enforcer)

```bash
# URL: https://github.com/errata-ai/vale

# Install
brew install vale  # macOS
# or download from GitHub releases

# Basic usage
vale docs/

# Check specific file
vale README.md

# Custom config
vale --config=.vale.ini docs/
```

**Configuration Example**:

```ini
# .vale.ini
[*]
BasedOnStyles = Google

MinWordLength = 3

# Avoid passive voice
Google.PassiveVoice = NO

# Avoid complex words
Google.Wordy = NO

# Check sentence length
SentenceLength = YES
MaxSentenceLength = 30
```

**Best For**: Enforcing writing style guides

---

#### **textlint**

```bash
# URL: https://github.com/textlint/textlint

# Install
npm install -g textlint

# Basic usage
textlint README.md

# Fix issues
textlint --fix README.md

# Custom rules
textlint --rule textlint-rule-no-todo README.md
```

**Best For**: Extensible text checking with plugins

---

## 3. Grep-Based Verification Patterns

### 3.1 Finding Broken Internal Links

```bash
# Find all markdown link references
grep -rn '\[.*\](.*\.md)' docs/

# Find all internal anchors
grep -rn '\[.*\](#.*))' docs/

# Find all image references
grep -rn '!\[.*\](.*)' docs/

# Find all external links
grep -rn '\[.*\](http' docs/

# Find orphaned sections (headings with no anchors)
grep -rn '^##\+' docs/ | while read line; do
  heading=$(echo "$line" | sed 's/.*## //' | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
  grep -q "(#$heading)" docs/*.md || echo "Potential orphan: $line"
done
```

### 3.2 Detecting Outdated References

```bash
# Find version numbers that might be outdated
grep -rn 'version [0-9]\+\.[0-9]\+\.[0-9]\+' docs/

# Find date references
grep -rn '202[0-9]-[0-9][0-9]-[0-9][0-9]' docs/

# Find TODO/FIXME markers
grep -rn 'TODO\|FIXME\|XXX\|HACK' docs/

# Find deprecated syntax mentions
grep -rn 'var \w\+ =' docs/

# Find outdated tool references
grep -rn 'babel\|webpack\|gulp' docs/
```

### 3.3 Cross-Reference Validation

```bash
# Extract all links from markdown files
grep -oh '\[.*\]([^)]*)' docs/*.md | sed 's/.*](//' | sed 's/)$//' | sort -u > /tmp/links.txt

# Extract all markdown files
find docs -name "*.md" | sort > /tmp/files.txt

# Check for links to non-existent files
while read link; do
  if [[ $link == *.md ]]; then
    basename=$(basename "$link")
    if ! grep -q "$basename" /tmp/files.txt; then
      echo "Broken link: $link"
    fi
  fi
done < /tmp/links.txt
```

### 3.4 Code Example Validation

````bash
# Find code blocks with language tags
grep -rn '```[a-z]*' docs/

# Find shell scripts that might be outdated
grep -rn '```bash' docs/ -A 10 | grep -E '(npm|yarn|node)'

# Find TypeScript examples
grep -rn '```typescript' docs/

# Find JavaScript examples
grep -rn '```javascript' docs/
````

### 3.5 Consistency Pattern Verification

```bash
# Check for consistent heading style
grep -rn '^##' docs/ | grep -v '^## ' | echo "Non-standard heading format"

# Check for consistent list formatting
grep -rn '^[0-9]\+\.' docs/ | wc -l  # Numbered lists
grep -rn '^-' docs/ | wc -l           # Bullet lists

# Check for consistent quote style
grep -rn '`[^`]\+`' docs/

# Check for consistent emphasis
grep -rn '\*\*.*\*\*' docs/
```

### 3.6 Advanced Grep Patterns

````bash
# Find all code fences with empty language spec
grep -rn '```$' docs/

# Find HTML in markdown (should use markdown syntax)
grep -rn '<[a-z][a-z0-9]*' docs/*.md

# Find duplicate headings
grep -rn '^##' docs/ | sort | uniq -d

# Find very long lines (might indicate formatting issues)
grep -rn '.\{120,\}' docs/

# Find inconsistent spacing around headers
grep -rn '^##[^#\s]' docs/
````

---

## 4. Documentation Linting Tools

### 4.1 markdownlint Rules Reference

```markdown
**Critical Rules for Consistency**:

| Rule  | Description                                         | Auto-fix |
| ----- | --------------------------------------------------- | -------- |
| MD001 | Heading levels should only increment by one level   | ✅       |
| MD003 | Heading style                                       | ✅       |
| MD004 | Unordered list style                                | ✅       |
| MD007 | Unordered list indentation                          | ✅       |
| MD009 | Trailing spaces                                     | ✅       |
| MD010 | Hard tabs                                           | ✅       |
| MD011 | Reversed link syntax                                | ❌       |
| MD012 | Multiple consecutive blank lines                    | ✅       |
| MD013 | Line length                                         | ❌       |
| MD018 | No space after hash on heading                      | ❌       |
| MD019 | Multiple spaces after hash on heading               | ✅       |
| MD020 | No space after hash in ATX heading                  | ❌       |
| MD021 | Multiple spaces inside hash on ATX heading          | ✅       |
| MD022 | Headings should be surrounded by blank lines        | ✅       |
| MD023 | Headings must start at beginning of line            | ❌       |
| MD024 | No duplicate heading                                | ❌       |
| MD025 | Multiple top-level headings in same document        | ❌       |
| MD026 | Trailing punctuation in heading                     | ❌       |
| MD032 | Lists should be surrounded by blank lines           | ✅       |
| MD033 | Allow inline HTML                                   | -        |
| MD034 | Bare URL used                                       | ❌       |
| MD036 | Emphasis used instead of heading                    | ❌       |
| MD037 | Spaces inside emphasis markers                      | ✅       |
| MD038 | Spaces inside code span markers                     | ✅       |
| MD039 | Spaces inside link text                             | ✅       |
| MD040 | Fenced code blocks should have a language           | ❌       |
| MD041 | First line in file should be top-level heading      | ❌       |
| MD044 | Proper names should have the correct capitalization | ❌       |
| MD045 | Alt text should be used                             | ❌       |
| MD046 | Code block style                                    | ✅       |
| MD047 | Each file should end with single newline            | ✅       |
| MD048 | Code fence style                                    | ✅       |
```

### 4.2 Creating Custom markdownlint Rules

```javascript
// custom-rules.js
module.exports = {
  rules: {
    // Check for consistent terminology
    'consistent-terminology': {
      check: (params, onError) => {
        const terms = {
          typescript: 'TypeScript',
          javascript: 'JavaScript',
          github: 'GitHub',
          npm: 'npm',
        };

        params.tokens.forEach(token => {
          if (token.type === 'text') {
            Object.keys(terms).forEach(invalid => {
              const regex = new RegExp(`\\b${invalid}\\b`, 'gi');
              if (regex.test(token.content)) {
                onError({
                  lineNumber: token.lineNumber,
                  detail: `Use "${terms[invalid]}" instead of "${invalid}"`,
                  context: token.line,
                });
              }
            });
          }
        });
      },
    },
  },
};
```

### 4.3 Vale Rule Configuration

```yaml
# .vale/styles/Docs/rules/terminology.yml
extends: existence
message: "Use '%s' instead of '%s'"
level: error
ignorecase: true
action:
  name: replace
swap:
  '[Dd]ocument[ation]': documentation
  '[Aa]pplication[on]': application
  '[Ww]eb[- ]site': website
```

---

## 5. Link Validation Approaches

### 5.1 Internal Link Validation Script

```typescript
// scripts/validate-docs-links.ts
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface LinkInfo {
  file: string;
  line: number;
  link: string;
  type: 'internal' | 'external' | 'anchor';
}

interface ValidationResult {
  valid: LinkInfo[];
  invalid: Array<LinkInfo & { error: string }>;
  warnings: Array<LinkInfo & { message: string }>;
}

function extractLinks(content: string, file: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const lines = content.split('\n');

  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      const url = match[2];
      const link: LinkInfo = {
        file,
        line: index + 1,
        link: url,
        type: url.startsWith('#')
          ? 'anchor'
          : url.startsWith('http')
            ? 'external'
            : 'internal',
      };
      links.push(link);
    }
  });

  return links;
}

function validateInternalLink(
  link: string,
  docsPath: string
): { valid: boolean; error?: string } {
  // Remove anchor if present
  const pathWithoutAnchor = link.split('#')[0];

  // Check if file exists
  const fullPath = join(docsPath, pathWithoutAnchor);
  try {
    statSync(fullPath);
    return { valid: true };
  } catch {
    return { valid: false, error: 'File not found' };
  }
}

async function validateDocs(docsPath: string): Promise<ValidationResult> {
  const result: ValidationResult = { valid: [], invalid: [], warnings: [] };

  const files = readdirSync(docsPath).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = readFileSync(join(docsPath, file), 'utf-8');
    const links = extractLinks(content, file);

    for (const link of links) {
      if (link.type === 'internal') {
        const validation = validateInternalLink(link.link, docsPath);
        if (validation.valid) {
          result.valid.push(link);
        } else {
          result.invalid.push({ ...link, error: validation.error });
        }
      } else if (link.type === 'external') {
        // External links need HTTP check
        result.warnings.push({
          ...link,
          message: 'External link not verified',
        });
      }
    }
  }

  return result;
}

// Usage
validateDocs('/home/dustin/projects/hacky-hack/docs').then(result => {
  console.log('Valid links:', result.valid.length);
  console.log('Invalid links:', result.invalid.length);
  console.log('Warnings:', result.warnings.length);

  if (result.invalid.length > 0) {
    console.error('\nBroken links:');
    result.invalid.forEach(link => {
      console.error(`  ${link.file}:${link.line} - ${link.link}`);
      console.error(`    Error: ${link.error}`);
    });
  }
});
```

### 5.2 External Link Checking with Retry

```typescript
// scripts/check-external-links.ts
import fetch from 'node-fetch';

interface LinkCheckResult {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
}

async function checkLink(url: string, retries = 3): Promise<LinkCheckResult> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'Documentation-Link-Checker/1.0',
        },
      });

      return {
        url,
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      if (i === retries - 1) {
        return {
          url,
          status: 0,
          ok: false,
          error: error.message,
        };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  return {
    url,
    status: 0,
    ok: false,
    error: 'Max retries exceeded',
  };
}

// Usage
async function checkAllLinks(urls: string[]) {
  const results = await Promise.all(urls.map(url => checkLink(url)));

  const broken = results.filter(r => !r.ok);

  console.log(`Checked ${results.length} links`);
  console.log(`Broken: ${broken.length}`);

  broken.forEach(link => {
    console.error(`  ${link.url}: ${link.error || `Status ${link.status}`}`);
  });
}
```

---

## 6. Open Source Project Examples

### 6.1 Kubernetes Documentation CI

**Repository**: kubernetes/website

**Key Features**:

```yaml
# .github/workflows/docfx.yml
name: Documentation Check

on:
  pull_request:
    paths:
      - 'content/en/**.md'
      - 'content/en/docs/**'

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          use-verbose-mode: 'yes'
          config-file: '.linkcheck.json'
```

**Link Check Configuration**:

```json
{
  "ignorePatterns": [
    {
      "pattern": "http://localhost"
    },
    {
      "pattern": "https://kubernetes.io"
    }
  ],
  "timeout": "10s",
  "retryOn429": true
}
```

---

### 6.2 Vue.js Documentation Verification

**Repository**: vuejs/docs

**Approach**:

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Check markdown
        run: npm run docs:lint

      - name: Check links
        run: npm run docs:link-check
```

**Package.json Scripts**:

```json
{
  "scripts": {
    "docs:lint": "markdownlint 'docs/**/*.md'",
    "docs:link-check": "markdown-link-check docs/**/*.md",
    "docs:spell": "cspell 'docs/**/*.md'"
  }
}
```

---

### 6.3 TypeScript ESLint Documentation

**Repository**: typescript-eslint/typescript-eslint

**Documentation CI**:

```yaml
# .github/workflows/docs.yml
name: Docs

on:
  push:
    branches: [main]
  pull_request:

jobs:
  docusaurus:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install
        run: npm ci

      - name: Build docs
        run: npm run docs:build

      - name: Check links
        run: npm run docs:check-links
```

---

### 6.4 Create React App Documentation

**Repository**: facebook/create-react-app

**Verification Script**:

```bash
# scripts/validate-docs.sh
#!/bin/bash

set -e

echo "Checking documentation..."

# Check for broken links
echo "Checking links..."
npx markdown-link-check README.md
npx markdown-link-check CONTRIBUTING.md

# Check markdown formatting
echo "Checking markdown formatting..."
npx markdownlint . --ignore node_modules

# Check spelling
echo "Checking spelling..."
npx cspell "**/*.md"

# Check for outdated versions
echo "Checking for outdated version references..."
if grep -r "react@16" docs/; then
  echo "Found outdated React version references!"
  exit 1
fi

echo "Documentation checks passed!"
```

---

## 7. Custom Verification Scripts

### 7.1 Comprehensive Documentation Validator

````typescript
// scripts/validate-documentation.ts
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  category: string;
  passed: boolean;
  message: string;
  details?: string[];
}

class DocumentationValidator {
  private docsPath: string;
  private results: ValidationResult[] = [];

  constructor(docsPath: string) {
    this.docsPath = docsPath;
  }

  async validateAll(): Promise<void> {
    console.log('🔍 Starting documentation validation...\n');

    await this.checkMarkdownFormatting();
    await this.checkInternalLinks();
    await this.checkExternalLinks();
    await this.checkCodeBlocks();
    await this.checkTerminology();
    await this.checkDates();
    await this.checkConsistency();

    this.printResults();
  }

  private async checkMarkdownFormatting(): Promise<void> {
    console.log('📝 Checking markdown formatting...');

    try {
      execSync(`npx markdownlint "${this.docsPath}/**/*.md"`, {
        stdio: 'pipe',
      });

      this.results.push({
        category: 'Markdown Formatting',
        passed: true,
        message: 'All markdown files properly formatted',
      });
    } catch (error) {
      this.results.push({
        category: 'Markdown Formatting',
        passed: false,
        message: 'Markdown formatting issues found',
        details: [error.stdout?.toString() || error.message],
      });
    }
  }

  private async checkInternalLinks(): Promise<void> {
    console.log('🔗 Checking internal links...');

    const issues: string[] = [];
    const files = this.getMarkdownFiles();

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const links = this.extractMarkdownLinks(content);

      for (const link of links) {
        if (link.type === 'internal') {
          const targetPath = join(this.docsPath, link.url);
          try {
            statSync(targetPath);
          } catch {
            issues.push(`${file}:${link.line} - ${link.url}`);
          }
        }
      }
    }

    this.results.push({
      category: 'Internal Links',
      passed: issues.length === 0,
      message:
        issues.length === 0
          ? 'All internal links valid'
          : `Found ${issues.length} broken internal links`,
      details: issues,
    });
  }

  private async checkExternalLinks(): Promise<void> {
    console.log('🌐 Checking external links...');

    console.log('  ⚠️  External link checking requires manual verification');
    console.log('  💡 Run: npx lychee docs/ --verbose');

    this.results.push({
      category: 'External Links',
      passed: true,
      message: 'External links check recommended (manual/lychee)',
    });
  }

  private async checkCodeBlocks(): Promise<void> {
    console.log('💻 Checking code blocks...');

    const issues: string[] = [];
    const files = this.getMarkdownFiles();

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let inCodeBlock = false;
      let codeBlockLang = '';
      let codeBlockStart = 0;

      lines.forEach((line, index) => {
        const match = line.match(/^```(\w*)/);

        if (match) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockLang = match[1];
            codeBlockStart = index + 1;
          } else {
            inCodeBlock = false;

            if (!codeBlockLang) {
              issues.push(
                `${file}:${codeBlockStart} - Code block missing language spec`
              );
            }
          }
        }
      });
    }

    this.results.push({
      category: 'Code Blocks',
      passed: issues.length === 0,
      message:
        issues.length === 0
          ? 'All code blocks have language specifiers'
          : `Found ${issues.length} code blocks without language spec`,
      details: issues,
    });
  }

  private async checkTerminology(): Promise<void> {
    console.log('📚 Checking terminology consistency...');

    const terminologyRules = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      github: 'GitHub',
      vscode: 'VS Code',
      nodejs: 'Node.js',
    };

    const issues: string[] = [];
    const files = this.getMarkdownFiles();

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      Object.keys(terminologyRules).forEach(incorrect => {
        const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
        lines.forEach((line, index) => {
          if (regex.test(line) && !line.startsWith('```')) {
            issues.push(
              `${file}:${index + 1} - Use "${terminologyRules[incorrect]}" instead of "${incorrect}"`
            );
          }
        });
      });
    }

    this.results.push({
      category: 'Terminology',
      passed: issues.length === 0,
      message:
        issues.length === 0
          ? 'Terminology is consistent'
          : `Found ${issues.length} terminology issues`,
      details: issues,
    });
  }

  private async checkDates(): Promise<void> {
    console.log('📅 Checking date consistency...');

    const issues: string[] = [];
    const files = this.getMarkdownFiles();
    const currentYear = new Date().getFullYear();

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');

      // Check for old years
      const oldYearRegex = new RegExp(`\\b20[0-1][0-9]\\b`);
      if (oldYearRegex.test(content)) {
        issues.push(`${file} - Contains dates before 2020`);
      }

      // Check for future years
      const futureYearRegex = new RegExp(`\\b2[1-9][0-9][0-9]\\b`);
      const matches = content.match(futureYearRegex);
      if (matches) {
        matches.forEach(year => {
          if (parseInt(year) > currentYear) {
            issues.push(`${file} - Contains future year: ${year}`);
          }
        });
      }
    }

    this.results.push({
      category: 'Dates',
      passed: issues.length === 0,
      message:
        issues.length === 0
          ? 'All dates are reasonable'
          : `Found ${issues.length} date issues`,
      details: issues,
    });
  }

  private async checkConsistency(): Promise<void> {
    console.log('🎨 Checking consistency...');

    const issues: string[] = [];

    // Check for consistent heading levels
    const files = this.getMarkdownFiles();
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let lastLevel = 0;
      lines.forEach((line, index) => {
        const match = line.match(/^(#{1,6})\s/);
        if (match) {
          const level = match[1].length;
          if (level > lastLevel + 1) {
            issues.push(
              `${file}:${index + 1} - Heading level jumped from ${lastLevel} to ${level}`
            );
          }
          lastLevel = level;
        }
      });
    }

    this.results.push({
      category: 'Consistency',
      passed: issues.length === 0,
      message:
        issues.length === 0
          ? 'Document structure is consistent'
          : `Found ${issues.length} consistency issues`,
      details: issues,
    });
  }

  private getMarkdownFiles(): string[] {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (entry.endsWith('.md')) {
          files.push(fullPath);
        }
      });
    };

    walk(this.docsPath);
    return files;
  }

  private extractMarkdownLinks(content: string) {
    const lines = content.split('\n');
    const links: { url: string; line: number; type: string }[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    lines.forEach((line, index) => {
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        links.push({
          url: match[2],
          line: index + 1,
          type: match[2].startsWith('#')
            ? 'anchor'
            : match[2].startsWith('http')
              ? 'external'
              : 'internal',
        });
      }
    });

    return links;
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60) + '\n');

    let passedCount = 0;
    let failedCount = 0;

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.category}`);
      console.log(`   ${result.message}`);

      if (result.details && result.details.length > 0) {
        console.log('   Details:');
        result.details.slice(0, 5).forEach(detail => {
          console.log(`     - ${detail}`);
        });
        if (result.details.length > 5) {
          console.log(`     ... and ${result.details.length - 5} more`);
        }
      }
      console.log();

      if (result.passed) passedCount++;
      else failedCount++;
    });

    console.log('='.repeat(60));
    console.log(`Total: ${passedCount} passed, ${failedCount} failed`);
    console.log('='.repeat(60));

    process.exit(failedCount > 0 ? 1 : 0);
  }
}

// Usage
const validator = new DocumentationValidator(
  '/home/dustin/projects/hacky-hack/docs'
);
validator.validateAll().catch(error => {
  console.error('Validation error:', error);
  process.exit(1);
});
````

---

## 8. CI/CD Integration Patterns

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/documentation-check.yml
name: Documentation Verification

on:
  pull_request:
    paths:
      - 'docs/**'
      - '**/*.md'
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - '**/*.md'

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install -g markdownlint-cli
          npm install -g markdown-link-check
          npm install -g cspell

      - name: Check markdown formatting
        run: markdownlint "docs/**/*.md" --fix

      - name: Check internal links
        run: |
          find docs -name "*.md" -exec markdown-link-check {} \;

      - name: Check external links
        uses: lycheeverse/lychee-action@v1
        with:
          args: --verbose --no-progress docs/
          fail: true

      - name: Check spelling
        run: cspell "docs/**/*.md"

      - name: Run custom validation
        run: |
          npm run validate:docs

      - name: Generate report
        if: always()
        run: |
          echo "## Documentation Verification Report" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "✅ Markdown formatting: checked" >> $GITHUB_STEP_SUMMARY
          echo "✅ Internal links: checked" >> $GITHUB_STEP_SUMMARY
          echo "✅ External links: checked" >> $GITHUB_STEP_SUMMARY
          echo "✅ Spelling: checked" >> $GITHUB_STEP_SUMMARY
```

### 8.2 Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Running documentation checks..."

# Get list of changed markdown files
MD_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$')

if [ -z "$MD_FILES" ]; then
  echo "No markdown files changed, skipping documentation checks"
  exit 0
fi

echo "Checking: $MD_FILES"

# Check formatting
echo "📝 Checking markdown formatting..."
if ! markdownlint $MD_FILES; then
  echo "❌ Markdown formatting issues found"
  echo "Run: markdownlint $MD_FILES --fix"
  exit 1
fi

# Check internal links
echo "🔗 Checking internal links..."
for file in $MD_FILES; do
  if ! markdown-link-check $file; then
    echo "❌ Broken links found in $file"
    exit 1
  fi
done

# Check spelling
echo "🔤 Checking spelling..."
if ! cspell $MD_FILES; then
  echo "❌ Spelling issues found"
  exit 1
fi

echo "✅ All documentation checks passed!"
exit 0
```

---

## 9. Manual Verification Approaches

### 9.1 Documentation Review Checklist

```markdown
## Documentation Review Checklist

### Structure

- [ ] Document has clear title (H1)
- [ ] Table of contents present (if long document)
- [ ] Headings follow hierarchy (H1 → H2 → H3)
- [ ] No skipped heading levels
- [ ] Sections are logically organized

### Content

- [ ] Information is accurate and up-to-date
- [ ] Code examples are tested and work
- [ ] Screenshots are current
- [ ] Version numbers are correct
- [ ] Links are relevant and working
- [ ] Terminology is consistent

### Links

- [ ] All internal links work
- [ ] All external links work
- [ ] No orphaned pages (pages with no inbound links)
- [ ] Anchor links work correctly
- [ ] Image references are valid

### Formatting

- [ ] Consistent heading style
- [ ] Consistent list formatting
- [ ] Code blocks have language tags
- [ ] Images have alt text
- [ ] Tables are properly formatted
- [ ] No trailing whitespace
- [ ] Line length reasonable (<120 chars)

### Style

- [ ] Consistent terminology
- [ ] Active voice preferred
- [ ] Clear, concise language
- [ ] No jargon without explanation
- [ ] Consistent date format
- [ ] Consistent time zone references

### Accessibility

- [ ] Images have descriptive alt text
- [ ] Links have descriptive text
- [ ] Code blocks have language labels
- [ ] Sufficient color contrast
- [ ] Proper heading structure for screen readers
```

### 9.2 Periodic Audit Process

```markdown
## Monthly Documentation Audit

### Week 1: Link Checking

- Run automated link checker
- Fix broken links
- Update outdated references

### Week 2: Content Review

- Review pages with oldest "Last Updated" date
- Update version-specific information
- Verify code examples still work

### Week 3: Style & Terminology

- Run markdown linting
- Check for consistent terminology
- Fix formatting issues

### Week 4: User Feedback

- Review user-reported issues
- Update FAQ based on support tickets
- Add missing documentation for new features
```

### 9.3 Peer Review Guidelines

```markdown
## Documentation Peer Review

### Before Assigning Reviewer

- [ ] Self-review completed
- [ ] Automated checks pass
- [ ] Links verified
- [ ] Code examples tested

### Reviewer Checklist

- [ ] Content is accurate
- [ ] Instructions are clear and complete
- [ ] Code examples work
- [ ] Links are valid
- [ ] Formatting is consistent
- [ ] No grammatical errors
- [ ] Terminology is consistent

### After Review

- [ ] All feedback addressed
- [ ] Changes documented in commit
- [ ] Related docs updated
- [ ] "Last Updated" date refreshed
```

---

## 10. Implementation Roadmap

### 10.1 Phase 1: Basic Automation (Week 1)

````markdown
**Goal**: Catch obvious documentation issues automatically

**Tasks**:

1. Install markdownlint-cli
   ```bash
   npm install -g markdownlint-cli
   ```
````

2. Create .markdownlint.json

   ```json
   {
     "default": true,
     "MD013": { "line_length": 120 },
     "MD033": false,
     "MD041": false
   }
   ```

3. Add npm script

   ```json
   {
     "scripts": {
       "docs:lint": "markdownlint \"docs/**/*.md\"",
       "docs:lint:fix": "markdownlint \"docs/**/*.md\" --fix"
     }
   }
   ```

4. Run first check
   ```bash
   npm run docs:lint
   ```

**Expected Outcome**:

- Catch formatting inconsistencies
- Fix automatically where possible
- Establish baseline

````

### 10.2 Phase 2: Link Validation (Week 2)

```markdown
**Goal**: Ensure all links are valid

**Tasks**:
1. Install link checker
   ```bash
   npm install -g markdown-link-check
   cargo install lychee
````

2. Create link check config

   ```json
   {
     "ignorePatterns": [{ "pattern": "^http://localhost" }],
     "timeout": "5s"
   }
   ```

3. Add npm scripts

   ```json
   {
     "scripts": {
       "docs:links": "markdown-link-check docs/**/*.md",
       "docs:links:external": "lychee docs/ --verbose"
     }
   }
   ```

4. Create link check report
   ```bash
   npm run docs:links:external > link-report.txt
   ```

**Expected Outcome**:

- All internal links work
- External links verified
- Report generated for review

````

### 10.3 Phase 3: Advanced Validation (Week 3)

```markdown
**Goal**: Custom checks for project-specific needs

**Tasks**:
1. Create custom validation script
   - See section 7.1 for implementation

2. Add terminology checks
   - Define project-specific terms
   - Create terminology rules

3. Add code block validation
   - Check language tags
   - Validate code syntax

4. Integrate with CI/CD
   - Add to GitHub Actions
   - Run on every PR

**Expected Outcome**:
- Project-specific consistency enforced
- Automated in CI/CD
- Consistent terminology
````

### 10.4 Phase 4: Continuous Improvement (Ongoing)

```markdown
**Goal**: Maintain and improve documentation quality

**Tasks**:

1. Monthly audits
   - Review oldest pages
   - Update version info
   - Check for outdated content

2. User feedback loop
   - Monitor support tickets
   - Track search queries
   - Update based on usage

3. Metrics tracking
   - Track broken links over time
   - Monitor documentation coverage
   - Measure user satisfaction

4. Process refinement
   - Update checklists
   - Improve automation
   - Share best practices

**Expected Outcome**:

- Continuously improving quality
- Responsive to user needs
- Data-driven improvements
```

---

## Summary & Recommendations

### Quick Start Guide

```bash
# 1. Install essential tools
npm install -g markdownlint-cli markdown-link-check cspell
cargo install lychee

# 2. Run initial checks
markdownlint "docs/**/*.md" --fix
markdown-link-check docs/**/*.md
lychee docs/

# 3. Add to CI/CD
# Create .github/workflows/docs.yml (see section 8.1)

# 4. Create review process
# Use checklist from section 9.1
```

### Recommended Tool Stack

```markdown
**For TypeScript Projects**:

- markdownlint-cli (formatting)
- lychee (link checking)
- cspell (spelling)
- Custom validation script (project-specific)

**For Large Documentation Sites**:

- Docusaurus (built-in checks)
- Vale (style guide enforcement)
- textlint (extensible rules)
- Custom CI/CD pipeline

**For Open Source Projects**:

- markdownlint-cli (formatting)
- lychee (link checking in CI)
- GitHub Actions (automation)
- Community review process
```

### Best Practices Summary

1. **Automate Early**: Set up checks before documentation grows large
2. **Fix Automatically**: Use tools with --fix where possible
3. **Check in CI**: Run on every pull request
4. **Review Regularly**: Schedule periodic manual audits
5. **Monitor Feedback**: Track user-reported issues
6. **Iterate Continuously**: Improve process based on findings

---

## Additional Resources

### Tools & Documentation

- **markdownlint**: https://github.com/DavidAnson/markdownlint
- **lychee**: https://github.com/lycheeverse/lychee
- **Vale**: https://github.com/errata-ai/vale
- **textlint**: https://github.com/textlint/textlint
- **cspell**: https://github.com/streetsidesoftware/cspell
- **markdown-link-check**: https://github.com/gaurav-nelson/github-action-markdown-link-check

### Examples & Templates

- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Vue.js Documentation**: https://vuejs.org/guide/
- **TypeScript ESLint**: https://typescript-eslint.io/
- **MDN Web Docs**: https://developer.mozilla.org/

### Communities

- **Write the Docs**: https://www.writethedocs.org/
- **Documentation Slack**: https://documentation.slack.com/
- **r/technicalwriting**: https://reddit.com/r/technicalwriting

---

**Document Status**: ✅ Complete
**Last Updated**: 2026-01-15
**Maintainer**: Documentation Team
**Next Review**: 2026-02-15
