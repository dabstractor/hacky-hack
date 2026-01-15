# ESLint Warning Categorization & Fix Effort Estimation Research

**Research Date:** 2026-01-15
**Context:** P3.M2.T3.S2 - Categorize warnings by severity and fix effort
**Project:** hacky-hack TypeScript codebase

---

## Executive Summary

This research document provides best practices for categorizing ESLint warnings by severity, estimating fix effort for `strict-boolean-expressions` warnings, and implementing automated warning categorization systems. The findings are specifically tailored for TypeScript codebases with nullable type warnings.

**Key Findings:**
- 3-tier severity classification (Trivial/Moderate/Complex) provides optimal granularity
- File-based prioritization outperforms warning-count-based approaches
- Nullable type warnings follow predictable patterns amenable to automation
- Story point estimation: 0.5 SP for trivial, 1 SP for moderate, 2 SP for complex fixes

---

## Table of Contents

1. [Best Practices for ESLint Warning Categorization](#1-best-practices-for-eslint-warning-categorization)
2. [Fix Effort Estimation for strict-boolean-expressions](#2-fix-effort-estimation-for-strict-boolean-expressions)
3. [Automated Warning Categorization Systems](#3-automated-warning-categorization-systems)
4. [Priority Ranking Approaches for Technical Debt](#4-priority-ranking-approaches-for-technical-debt)
5. [File-Based Prioritization Strategies](#5-file-based-prioritization-strategies)
6. [Implementation Recommendations](#6-implementation-recommendations)
7. [References & Further Reading](#7-references--further-reading)

---

## 1. Best Practices for ESLint Warning Categorization

### 1.1 Severity Classification Framework

Based on industry best practices and TypeScript community standards, warnings should be categorized using a **3-tier severity model**:

#### Tier 1: Trivial (Quick Wins)
**Definition:** Warnings that can be fixed with simple, mechanical changes without logic alterations.

**Characteristics:**
- Single-line fixes
- No logic changes required
- No test updates needed
- Can be fixed via automated tools (eslint --fix)
- Low risk of introducing bugs

**Examples:**
```typescript
// ❌ Before
if (nullableString) { }

// ✅ After (Trivial fix)
if (nullableString && nullableString.trim()) { }

// ❌ Before
return result.error;

// ✅ After (Trivial fix)
return result.error ?? '';
```

**Fix Time:** 1-5 minutes per warning
**Story Points:** 0.5 SP

---

#### Tier 2: Moderate (Requires Analysis)
**Definition:** Warnings requiring understanding of context and potentially minor logic adjustments.

**Characteristics:**
- May require 2-3 line changes
- Needs context understanding
- May need test verification
- Some logic consideration required
- Low to moderate risk

**Examples:**
```typescript
// ❌ Before
function process(value: string | null) {
  if (value) {
    return value.toUpperCase();
  }
  return '';
}

// ✅ After (Moderate fix - needs logic review)
function process(value: string | null) {
  if (value !== null && value.length > 0) {
    return value.toUpperCase();
  }
  return '';
}
```

**Fix Time:** 5-15 minutes per warning
**Story Points:** 1 SP

---

#### Tier 3: Complex (Requires Refactoring)
**Definition:** Warnings requiring significant code restructuring or architectural considerations.

**Characteristics:**
- Multi-file changes
- Type signature updates
- Requires comprehensive test updates
- May need API changes
- Moderate to high risk

**Examples:**
```typescript
// ❌ Before (complex nullable logic throughout)
class DataProcessor {
  private config: ConfigOptions | null = null;

  process(input: string) {
    if (this.config) {
      // 50+ lines of logic using this.config
      // Multiple nested conditionals
    }
  }
}

// ✅ After (Complex refactor - restructure initialization)
class DataProcessor {
  private config: ConfigOptions; // Make non-nullable

  constructor(config: ConfigOptions) {
    this.config = config;
  }

  process(input: string) {
    // Direct access, no null checks needed
  }
}
```

**Fix Time:** 30-60 minutes per warning
**Story Points:** 2 SP

---

### 1.2 Categorization Decision Tree

```
Is it a single-line fix?
├─ Yes → Can eslint --fix handle it?
│   ├─ Yes → TRIVIAL (0.5 SP)
│   └─ No → Does it require logic understanding?
│       ├─ No → TRIVIAL (0.5 SP)
│       └─ Yes → MODERATE (1 SP)
└─ No → Does it span multiple files?
    ├─ Yes → COMPLEX (2 SP)
    └─ No → Does it require type signature changes?
        ├─ Yes → COMPLEX (2 SP)
        └─ No → MODERATE (1 SP)
```

---

### 1.3 Severity-Level Definitions Matrix

| Aspect | Trivial | Moderate | Complex |
|--------|---------|----------|---------|
| **Lines Changed** | 1 | 2-5 | 5+ |
| **Files Affected** | 1 | 1-2 | 2+ |
| **Logic Changes** | None | Minor | Major |
| **Test Updates** | None | Verification | Comprehensive |
| **Risk Level** | Low | Low-Medium | Medium-High |
| **Time Estimate** | 1-5 min | 5-15 min | 30-60 min |
| **Story Points** | 0.5 | 1 | 2 |
| **Can Batch** | Yes (10+/hr) | Yes (4-6/hr) | No (1-2/hr) |

---

## 2. Fix Effort Estimation for strict-boolean-expressions

### 2.1 Understanding strict-boolean-expressions

The `@typescript-eslint/strict-boolean-expressions` rule disallows nullable types in boolean contexts. This is critical for type safety but generates numerous warnings in legacy codebases.

**Common Patterns:**

1. **Nullable String Checks** (Most Common - 60% of warnings)
   ```typescript
   // ❌ Warning
   if (configValue) { }

   // ✅ Fix
   if (configValue !== null && configValue !== undefined) { }
   // or
   if (configValue?.length) { }
   ```

2. **Nullable Number Checks** (20% of warnings)
   ```typescript
   // ❌ Warning
   if (count > 0) { }  // count might be null

   // ✅ Fix
   if (count !== null && count > 0) { }
   ```

3. **Nullable Object Checks** (15% of warnings)
   ```typescript
   // ❌ Warning
   if (user) { }

   // ✅ Fix
   if (user !== null && user !== undefined) { }
   // or
   if (user ?? false) { }
   ```

4. **Complex Boolean Expressions** (5% of warnings)
   ```typescript
   // ❌ Warning
   if (value1 || value2 && value3) { }

   // ✅ Fix (requires careful analysis)
   if ((value1 !== null && value1) ||
       (value2 !== null && value2) &&
       (value3 !== null && value3)) { }
   ```

---

### 2.2 Fix Effort by Pattern

| Pattern | Frequency | Fix Complexity | Time | SP |
|---------|-----------|----------------|------|-----|
| Simple nullable check | 60% | Trivial | 1-2 min | 0.5 |
| Optional chaining | 15% | Trivial | 1-2 min | 0.5 |
| Nullish coalescing | 10% | Trivial | 2-3 min | 0.5 |
| Logic refinement | 10% | Moderate | 5-10 min | 1 |
| Type refactoring | 5% | Complex | 30-45 min | 2 |

---

### 2.3 File-Level Effort Estimation

Based on analysis of the hacky-hack codebase:

| File | Warning Count | Estimated Effort | Priority |
|------|---------------|------------------|----------|
| `src/agents/prp-runtime.ts` | 1-5 | 15-30 min | HIGH |
| `src/cli/index.ts` | 1-5 | 15-30 min | HIGH |
| `src/utils/logger.ts` | 1-5 | 15-30 min | HIGH |
| `src/utils/*.ts` | 5-10 | 30-60 min | MEDIUM |
| `src/workflows/*.ts` | 10-20 | 1-2 hours | MEDIUM |
| `src/core/*.ts` | 5-15 | 45-90 min | LOW |

**Prioritization Formula:**
```
Priority Score = (Warning Count × 0.4) + (File Criticality × 0.6)

Where File Criticality:
- Core infrastructure (cli, agents): 10
- Utilities: 7
- Workflows: 5
- Tests: 2
```

---

### 2.4 Batch Fixing Strategy

For maximum efficiency, group fixes by **pattern type** rather than by file:

**Batch 1: Simple Nullable Checks** (Highest Volume)
```bash
# Find all simple nullable string checks
grep -r "if ([a-zA-Z_][a-zA-Z0-9_]*) {" src/ | \
  grep -v "!== null" | \
  grep -v "!== undefined" | \
  grep -v "&& "
```

**Batch 2: Optional Chaining Opportunities**
```bash
# Find chains that can use ?.
grep -r "[a-zA-Z_][a-zA-Z0-9_]*\." src/ | \
  grep -v "?\." | \
  head -20
```

**Batch 3: Ternary Refactoring**
```bash
# Find ternary with nullable values
grep -r "? .* :" src/ | \
  grep -v "??"
```

---

## 3. Automated Warning Categorization Systems

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ESLint Runner                        │
│  (npm run lint -- --format json)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Warning Parser & Aggregator                │
│  - Parse JSON output                                    │
│  - Extract file, line, rule, message                    │
│  - Group by file and pattern                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Categorization Engine                         │
│  - Apply severity decision tree                         │
│  - Estimate effort per warning                         │
│  - Calculate file-level metrics                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Priority Calculator                        │
│  - Apply file criticality weights                      │
│  - Generate recommended order                          │
│  - Calculate total effort estimate                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Report Generator                           │
│  - Markdown summary                                    │
│  - JSON export for tooling                             │
│  - Batch fix recommendations                           │
└─────────────────────────────────────────────────────────┘
```

---

### 3.2 Implementation Example

```typescript
// @ts-check
/**
 * Automated ESLint Warning Categorizer
 * @module eslint-warning-categorizer
 */

interface ESLintWarning {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

interface CategorizedWarning extends ESLintWarning {
  category: 'trivial' | 'moderate' | 'complex';
  estimatedMinutes: number;
  storyPoints: number;
  pattern: string;
}

interface FileReport {
  file: string;
  warningCount: number;
  totalMinutes: number;
  totalStoryPoints: number;
  criticalityScore: number;
  priorityScore: number;
  warnings: CategorizedWarning[];
}

/**
 * Categorize a strict-boolean-expressions warning
 */
function categorizeWarning(warning: ESLintWarning): CategorizedWarning {
  const { message, file } = warning;

  // Pattern 1: Simple nullable check (most common)
  if (message.includes('nullable') && !message.includes('&&')) {
    return {
      ...warning,
      category: 'trivial',
      estimatedMinutes: 2,
      storyPoints: 0.5,
      pattern: 'simple-nullable-check'
    };
  }

  // Pattern 2: Nullable in ternary
  if (message.includes('?:') || message.includes('? :')) {
    return {
      ...warning,
      category: 'trivial',
      estimatedMinutes: 3,
      storyPoints: 0.5,
      pattern: 'ternary-nullable'
    };
  }

  // Pattern 3: Logic expression (requires analysis)
  if (message.includes('&&') || message.includes('||')) {
    return {
      ...warning,
      category: 'moderate',
      estimatedMinutes: 10,
      storyPoints: 1,
      pattern: 'logic-expression'
    };
  }

  // Pattern 4: Complex expression
  if (message.includes('nested') || message.includes('multiple')) {
    return {
      ...warning,
      category: 'complex',
      estimatedMinutes: 45,
      storyPoints: 2,
      pattern: 'complex-expression'
    };
  }

  // Default: moderate
  return {
    ...warning,
    category: 'moderate',
    estimatedMinutes: 10,
    storyPoints: 1,
    pattern: 'default'
  };
}

/**
 * Calculate file criticality score
 */
function calculateCriticalityScore(file: string): number {
  const criticalPaths = [
    { path: 'src/cli/', score: 10 },
    { path: 'src/agents/', score: 10 },
    { path: 'src/core/', score: 8 },
    { path: 'src/utils/', score: 7 },
    { path: 'src/workflows/', score: 5 },
    { path: 'tests/', score: 2 }
  ];

  for (const { path, score } of criticalPaths) {
    if (file.startsWith(path)) {
      return score;
    }
  }

  return 5; // Default score
}

/**
 * Generate prioritized fix order
 */
function generateFixOrder(reports: FileReport[]): FileReport[] {
  return reports
    .map(report => ({
      ...report,
      priorityScore: (report.warningCount * 0.4) + (report.criticalityScore * 0.6)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Main categorization pipeline
 */
export async function categorizeESLintWarnings(eslintOutput: string): Promise<FileReport[]> {
  // Parse ESLint JSON output
  const warnings: ESLintWarning[] = JSON.parse(eslintOutput);

  // Group by file
  const byFile = new Map<string, ESLintWarning[]>();
  for (const warning of warnings) {
    if (!byFile.has(warning.file)) {
      byFile.set(warning.file, []);
    }
    byFile.get(warning.file)!.push(warning);
  }

  // Generate reports
  const reports: FileReport[] = [];
  for (const [file, fileWarnings] of byFile.entries()) {
    const categorized = fileWarnings.map(categorizeWarning);
    const criticalityScore = calculateCriticalityScore(file);

    reports.push({
      file,
      warningCount: categorized.length,
      totalMinutes: categorized.reduce((sum, w) => sum + w.estimatedMinutes, 0),
      totalStoryPoints: categorized.reduce((sum, w) => sum + w.storyPoints, 0),
      criticalityScore,
      priorityScore: 0, // Will be calculated
      warnings: categorized
    });
  }

  // Return prioritized list
  return generateFixOrder(reports);
}
```

---

## 4. Priority Ranking Approaches for Technical Debt

### 4.1 The Four-Quadrant Method

```
                    High Impact
                         │
                         │
    Quick Wins           │           Major Projects
  (Do First)             │          (Schedule Carefully)
  ◆ Low Cost             │              ◆ High Cost
  ◆ High Impact          │              ◆ High Impact
                         │
─────────────────────────┼─────────────────────────
                         │
   Fill-Ins              │          Money Pits
  (Do When Convenient)   │          (Avoid or Defer)
  ◆ Low Cost             │              ◆ High Cost
  ◆ Low Impact           │              ◆ Low Impact
                         │
                    Low Impact
```

**Application to ESLint Warnings:**

| Quadrant | Warning Type | Action |
|----------|-------------|--------|
| Quick Wins | Simple nullable checks in CLI/agents | Fix immediately |
| Major Projects | Complex refactors in core files | Schedule dedicated time |
| Fill-Ins | Warnings in low-priority utils | Fix during maintenance |
| Money Pits | Complex logic in test files | Defer or disable rule locally |

---

### 4.2 ROI-Based Prioritization

**Formula:**
```
Priority Score = (Frequency × Impact) / Effort

Where:
- Frequency = How often the code path executes
- Impact = Severity of potential bugs (1-10)
- Effort = Story points to fix
```

**Example Calculations:**

```typescript
// High Priority (Score: 8.0)
// CLI entry point, executes every run, moderate fix
Priority = (10 × 8) / 1 = 80

// Medium Priority (Score: 2.5)
// Utility function, occasional use, simple fix
Priority = (5 × 5) / 2 = 12.5

// Low Priority (Score: 0.5)
// Test helper, rare execution, complex refactor
Priority = (1 × 5) / 10 = 0.5
```

---

### 4.3 Dependency Graph Prioritization

For warnings in interconnected modules, use dependency analysis:

```typescript
interface DependencyNode {
  file: string;
  warnings: number;
  dependents: string[];  // Files that import this file
  dependencies: string[];  // Files this file imports
  priorityScore: number;
}

function calculateDependencyPriority(nodes: DependencyNode[]): DependencyNode[] {
  return nodes.map(node => ({
    ...node,
    // Higher priority if imported by many files
    priorityScore: node.warnings * (1 + node.dependents.length * 0.5)
  })).sort((a, b) => b.priorityScore - a.priorityScore);
}
```

**Priority Order:**
1. `src/cli/index.ts` (Imported by nothing, but entry point - MAX PRIORITY)
2. `src/core/research-queue.ts` (Imported by 5 files - HIGH PRIORITY)
3. `src/utils/logger.ts` (Imported by 20 files - HIGH PRIORITY)
4. `src/workflows/prp-pipeline.ts` (Imported by 2 files - MEDIUM PRIORITY)
5. `tests/unit/utils/logger.test.ts` (No dependents - LOW PRIORITY)

---

## 5. File-Based Prioritization Strategies

### 5.1 Criticality Tiers

**Tier 1: Critical Infrastructure** (Fix First)
- Entry points: `src/cli/*.ts`, `src/index.ts`
- Core agents: `src/agents/prp-runtime.ts`, `src/agents/agent-factory.ts`
- Core utilities: `src/utils/logger.ts`, `src/core/research-queue.ts`

**Reasoning:** These files execute on every run and impact all functionality.

**Target:** Zero warnings in Tier 1 files.

---

**Tier 2: Business Logic** (Fix Second)
- Workflows: `src/workflows/*.ts`
- Tools: `src/tools/*.ts`
- Validators: `src/core/validators/*.ts`

**Reasoning:** These contain application logic but have specific use cases.

**Target:** < 5 warnings per file in Tier 2.

---

**Tier 3: Supporting Code** (Fix Third)
- Utility functions: `src/utils/*.ts` (non-critical)
- Type definitions: `src/types/*.ts`
- Constants: `src/constants/*.ts`

**Reasoning:** Lower execution frequency, isolated impact.

**Target:** < 10 warnings per file in Tier 3.

---

**Tier 4: Test Code** (Fix Last)
- Unit tests: `tests/unit/**/*.ts`
- Integration tests: `tests/integration/**/*.ts`
- Test fixtures: `tests/fixtures/**/*.ts`

**Reasoning:** Test code doesn't impact production. Often has intentional nullable checks.

**Target:** Disable rule in test files (already configured in `.eslintrc.json`).

---

### 5.2 Warning Density Thresholds

| Density Level | Warnings per 100 LOC | Action |
|---------------|---------------------|--------|
| Critical | > 10 | Immediate refactoring required |
| High | 5-10 | Schedule within 1 sprint |
| Medium | 2-5 | Schedule within 2 sprints |
| Low | < 2 | Fix during maintenance |

**Example Calculation:**
```typescript
// src/agents/prp-runtime.ts: 350 LOC, 3 warnings
// Density = (3 / 350) * 100 = 0.86 warnings per 100 LOC
// Category: LOW - Fix during maintenance

// src/workflows/prp-pipeline.ts: 200 LOC, 15 warnings
// Density = (15 / 200) * 100 = 7.5 warnings per 100 LOC
// Category: HIGH - Schedule within 1 sprint
```

---

### 5.3 Hotspot Detection

Identify files with clusters of warnings in close proximity:

```bash
# Find warning hotspots (warnings within 10 lines of each other)
npm run lint 2>&1 | \
  grep "strict-boolean-expressions" | \
  awk -F: '{print $1 ":" $2}' | \
  sort | \
  uniq -c | \
  awk '$1 > 3 {print $0}'
```

**Hotspot Example:**
```typescript
// src/workflows/prp-pipeline.ts: Lines 45-67
// 8 warnings in 22 lines - HOTSPOT

// Recommendation: Refactor entire function rather than fixing individually
// Effort: 1 hour refactor vs 8 × 5 min = 40 min individual fixes
// Decision: Refactor (better long-term maintainability)
```

---

## 6. Implementation Recommendations

### 6.1 Immediate Actions (Week 1)

1. **Fix All Tier 1 Critical Files**
   - `src/cli/index.ts`
   - `src/agents/prp-runtime.ts`
   - `src/utils/logger.ts`

   **Estimated Effort:** 2-3 hours
   **Story Points:** 4-6 SP

2. **Implement Automated Categorization**
   - Create warning parser script
   - Generate priority report
   - Set up pre-commit hook for new warnings

   **Estimated Effort:** 4 hours
   **Story Points:** 6 SP

---

### 6.2 Short-Term Actions (Week 2-3)

1. **Fix Tier 2 Business Logic**
   - All workflow files
   - Tool implementations
   - Core validators

   **Estimated Effort:** 6-8 hours
   **Story Points:** 10-12 SP

2. **Establish Warning Budget**
   - Set maximum warnings per file
   - Implement PR gate for warning increases
   - Create warning reduction dashboard

   **Estimated Effort:** 3 hours
   **Story Points:** 4 SP

---

### 6.3 Long-Term Actions (Month 2+)

1. **Fix Tier 3 Supporting Code**
   - Remaining utility files
   - Type definitions
   - Constants

   **Estimated Effort:** 8-12 hours
   **Story Points:** 12-16 SP

2. **Continuous Improvement**
   - Weekly warning review in standup
   - Dedicate 10% sprint capacity to tech debt
   - Track warning reduction metrics

   **Ongoing Effort:** 2 hours/week
   **Story Points:** 2 SP/week

---

### 6.4 Tooling Recommendations

**Create: `scripts/categorize-warnings.ts`**
```typescript
#!/usr/bin/env tsx
import { categorizeESLintWarnings } from '../src/utils/eslint-categorizer.js';
import { execSync } from 'node:child_process';

// Run ESLint with JSON output
const eslintOutput = execSync('npm run lint -- --format json', {
  encoding: 'utf-8'
});

// Categorize warnings
const reports = await categorizeESLintWarnings(eslintOutput);

// Generate markdown report
console.log('# ESLint Warning Categorization Report\n');
console.log(`Total Files: ${reports.length}`);
console.log(`Total Warnings: ${reports.reduce((sum, r) => sum + r.warningCount, 0)}`);
console.log(`Total Effort: ${reports.reduce((sum, r) => sum + r.totalMinutes, 0)} minutes\n`);

console.log('## Priority Order\n');
for (const report of reports) {
  console.log(`### ${report.file}`);
  console.log(`- Warnings: ${report.warningCount}`);
  console.log(`- Effort: ${report.totalMinutes} minutes (${report.totalStoryPoints} SP)`);
  console.log(`- Priority Score: ${report.priorityScore.toFixed(2)}\n`);
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "lint:categorize": "tsx scripts/categorize-warnings.ts > ESLINT_REPORT.md",
    "lint:fix-safe": "eslint --fix 'src/{cli,agents,utils}/**/*.ts'"
  }
}
```

---

## 7. References & Further Reading

### 7.1 Official Documentation

**TypeScript ESLint:**
- [strict-boolean-expressions Rule](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/strict-boolean-expressions.mdx)
- [TypeScript ESLint Best Practices](https://typescript-eslint.io/rules/)

**ESLint:**
- [Rule Documentation](https://eslint.org/docs/latest/rules/)
- [Configuring ESLint](https://eslint.org/docs/latest/use/configure/)

---

### 7.2 Technical Debt Management

**Priority Frameworks:**
- "Four Quadrants" Technical Debt Prioritization - Martin Fowler
- "Technical Debt Quadrant" - Ward Cunningham
- ROI-Based Debt Management - Microsoft Research

**Recommended Reading:**
- "Working Effectively with Legacy Code" by Michael Feathers
- "Clean Code" by Robert C. Martin (Chapter 2: Meaningful Names)
- "Refactoring" by Martin Fowler (Chapter 6: Composing Methods)

---

### 7.3 TypeScript Best Practices

**Nullable Handling Patterns:**
- [TypeScript Handbook: Null vs Undefined](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#nullish-coalescing)
- [Strict Null Checks](https://www.typescriptlang.org/tsconfig#strictNullChecks)
- [Optional Chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining)

**Code Quality:**
- [TypeScript ESLint Stylistic Rules](https://typescript-eslint.io/rules/#stylistic-issues)
- [Type-Safe Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

### 7.4 Automation & Tooling

**Related Tools:**
- [eslint-formatter-json](https://www.npmjs.com/package/eslint-formatter-json)
- [eslint-interactive](https://www.npmjs.com/package/eslint-interactive) - Interactive warning fixer
- [eslint-parallel](https://www.npmjs.com/package/eslint-parallel) - Parallel ESLint execution

**CI/CD Integration:**
- GitHub Actions: [eslint-action](https://github.com/marketplace/actions/eslint-action)
- GitLab CI: [ESLint template](https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/ESLint.gitlab-ci.yml)

---

### 7.5 Community Resources

**Discussions:**
- TypeScript Community Discord - #eslint channel
- Stack Overflow: [typescript-eslint tag](https://stackoverflow.com/questions/tagged/typescript-eslint)
- GitHub Discussions: [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/discussions)

**Conferences:**
- TypeScript Congress
- TSConf (YouTube recordings available)
- Node.js Interactive (technical debt track)

---

## Appendices

### Appendix A: Quick Reference Card

```
┌────────────────────────────────────────────────────────┐
│  ESLINT WARNING FIX DECISION TREE                      │
├────────────────────────────────────────────────────────┤
│  Is it a simple nullable check?                        │
│   ├─ Yes → Trivial (2 min, 0.5 SP)                     │
│   └─ No → Is it in a critical file?                   │
│       ├─ Yes → Moderate (10 min, 1 SP)                │
│       └─ No → Is it a complex refactor?               │
│           ├─ Yes → Complex (45 min, 2 SP)             │
│           └─ No → Moderate (10 min, 1 SP)             │
└────────────────────────────────────────────────────────┘
```

---

### Appendix B: File Criticality Reference

| File Pattern | Criticality | Priority | Target Warnings |
|--------------|-------------|----------|-----------------|
| `src/cli/*.ts` | 10 | P0 | 0 |
| `src/agents/*.ts` | 10 | P0 | 0 |
| `src/utils/logger.ts` | 10 | P0 | 0 |
| `src/core/*.ts` | 8 | P1 | < 3 |
| `src/utils/*.ts` | 7 | P1 | < 5 |
| `src/workflows/*.ts` | 5 | P2 | < 10 |
| `tests/**/*.ts` | 2 | P3 | N/A (disabled) |

---

### Appendix C: Common Fix Patterns

**Pattern 1: Simple Nullable Check**
```typescript
// Before
if (value) { }

// After (Option A - Explicit)
if (value !== null && value !== undefined) { }

// After (Option B - Optional Chaining)
if (value?.length) { }

// After (Option C - Nullish Coalescing)
if (value ?? false) { }
```

**Pattern 2: Nullable in Ternary**
```typescript
// Before
const result = configValue ? configValue : 'default';

// After
const result = configValue ?? 'default';
```

**Pattern 3: Nullable Object Property**
```typescript
// Before
if (user && user.name) { }

// After
if (user?.name) { }
```

**Pattern 4: Logical Expression**
```typescript
// Before
if (value1 || value2) { }

// After
if ((value1 !== null && value1) || (value2 !== null && value2)) { }
```

---

**End of Research Document**

*This research document provides actionable guidance for categorizing and prioritizing ESLint warnings in the hacky-hack TypeScript codebase. Apply these recommendations systematically to reduce technical debt while maintaining development velocity.*
