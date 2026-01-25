# Token Optimization Quick Reference

**Last Updated:** 2026-01-25
**Purpose:** Quick lookup for common token optimization patterns

---

## 🚀 Quick Wins (5 minutes each)

### 1. Estimate Tokens Before API Calls

```typescript
import { Tiktoken } from 'tiktoken';

const encoder = new Tiktoken('cl100k_base');
const tokens = encoder.encode(yourText).length;
console.log(`Token count: ${tokens}`);
encoder.free();
```

### 2. Limit Parent Context Levels

```typescript
// In extractParentContext()
const maxLevels = 2; // Only include 2 most recent parents
for (let i = parts.length - 2; i >= Math.max(0, parts.length - 1 - maxLevels); i--) {
  // extract context
}
```

### 3. Truncate Long Descriptions

```typescript
function truncateDescription(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
}
```

### 4. Compress Markdown Whitespace

```typescript
function compressWhitespace(markdown: string): string {
  return markdown
    .replace(/\n{3,}/g, '\n\n') // Remove extra blank lines
    .replace(/[ \t]+$/gm, '') // Remove trailing spaces
    .replace(/^ +$/gm, ''); // Remove lines with only spaces
}
```

### 5. Limit Dependencies Display

```typescript
const maxDeps = 5;
const depDisplay = deps.slice(0, maxDeps);
const moreDeps = deps.length > maxDeps ? ` (+${deps.length - maxDeps} more)` : '';
```

---

## 📊 Token Budgeting

### GPT-4 Context Windows

| Model | Context Window | Safe Limit | Recommended |
|-------|---------------|------------|-------------|
| GPT-4 | 8,192 tokens | 6,000 | 5,000 |
| GPT-4-32K | 32,768 tokens | 25,000 | 20,000 |
| GPT-4 Turbo | 128,000 tokens | 100,000 | 80,000 |

### Token Allocation Strategy

```
System Prompt:      500-1,000 tokens  (fixed)
Task Context:       500-1,500 tokens  (variable)
Parent Context:     200-800 tokens    (compressible)
Codebase Info:      0-2,000 tokens    (optional)
Output Reserve:     1,000-2,000 tokens (for response)
─────────────────────────────────────────────
Total Safe Budget:  ~5,000-7,000 tokens
```

---

## 🎯 Compression Techniques

### Text Compression

| Technique | Savings | Trade-off |
|-----------|---------|-----------|
| Remove stop words | 10-15% | Readability |
| Truncate sentences | 20-40% | Completeness |
| First sentence only | 30-50% | Detail loss |
| Keyword extraction | 40-60% | Nuance loss |

### Code Compression

| Technique | Savings | Trade-off |
|-----------|---------|-----------|
| Remove comments | 10-20% | Documentation |
| Remove whitespace | 5-10% | Formatting |
| Shorten identifiers | 5-15% | Clarity |
| Template-based | 30-50% | Context |

### Markdown Compression

| Element | Original | Compressed | Savings |
|---------|----------|------------|---------|
| Headers | `## Implementation Steps` | `## Steps` | 40% |
| Links | `[Title](https://long-url.com/path)` | `Title: long-url.com` | 50% |
| Lists | `1. First item` | `• First item` | 20% |
| Bold | `**important text**` | `important text` | 2 chars |

---

## 💾 Caching Strategies

### Cache Key Design

```typescript
// Good: Specific and stable
const cacheKey = `prp:${taskId}:${hash(taskInputs)}`;

// Bad: Too broad
const cacheKey = `prp:${taskId}`;

// Also Bad: Too specific (cache misses on irrelevant changes)
const cacheKey = `prp:${taskId}:${hash(entireBacklog)}`;
```

### TTL Recommendations

| Content Type | TTL | Reasoning |
|--------------|-----|-----------|
| PRP content | 24-48 hours | Tasks rarely change |
| Parent context | 7 days | Hierarchies stable |
| System prompts | 30 days | Rarely changes |
| Codebase info | 1-4 hours | Files change often |

### Cache Eviction

```typescript
// LRU (Least Recently Used)
evictEntriesWithAccessOlderThan(ttl);

// LFU (Least Frequently Used)
evictEntriesWithAccessCountBelow(threshold);

// Size-based
evictEntriesUntilTotalTokensBelow(maxTokens);
```

---

## 🔧 Common Patterns

### Pattern 1: Conditional Context Inclusion

```typescript
function buildPrompt(task: Task, options: {
  includeParentContext?: boolean;
  includeDependencies?: boolean;
  includeCodebaseInfo?: boolean;
}): string {
  let prompt = `Task: ${task.title}`;

  if (options.includeParentContext) {
    prompt += `\n\nParent:\n${getParentContext(task.id)}`;
  }

  if (options.includeDependencies && task.dependencies.length > 0) {
    prompt += `\n\nDeps: ${task.dependencies.slice(0, 5).join(', ')}`;
  }

  return prompt;
}
```

### Pattern 2: Progressive Elaboration

```typescript
// Start with minimal context
let prompt = `Task: ${task.title}`;

// Add context only if needed
if (await needsMoreContext(task)) {
  prompt += `\n\nContext: ${task.description}`;
}

if (await needsCodebase(task)) {
  prompt += `\n\nCodebase: ${codebasePath}`;
}
```

### Pattern 3: Reference-Based Loading

```typescript
const prompt = `
Task: ${task.title}
Context: See ${contextFilePath}
Dependencies: See ${depsFilePath}
`;

// Agent loads files on-demand
const context = await readFile(contextFilePath);
```

---

## 📈 Monitoring

### Key Metrics

```typescript
interface TokenMetrics {
  // Usage
  averageInputTokens: number;
  averageOutputTokens: number;
  peakInputTokens: number;

  // Cache
  cacheHitRate: number;
  cacheTokensSaved: number;
  cacheEvictionRate: number;

  // Cost
  totalCost: number;
  costPerPRP: number;
  savingsFromCache: number;
}
```

### Alert Thresholds

```typescript
const ALERTS = {
  // Warning: 75% of context window
  WARNING_THRESHOLD: 6000,

  // Critical: 85% of context window
  CRITICAL_THRESHOLD: 7000,

  // Low cache hit rate
  LOW_HIT_RATE: 0.5, // 50%

  // High average tokens
  HIGH_AVG_TOKENS: 3000,
};
```

### Logging Pattern

```typescript
logger.info({
  taskId: task.id,
  inputTokens,
  outputTokens,
  totalTokens: inputTokens + outputTokens,
  cacheHit: cached !== null,
  compressionRatio: originalTokens / compressedTokens,
}, 'PRP generation metrics');
```

---

## 🛠️ Utility Functions

### Token Counter

```typescript
export class TokenCounter {
  readonly #encoder = new Tiktoken('cl100k_base');

  count(text: string): number {
    return this.#encoder.encode(text).length;
  }

  countPrompt(prompt: { system?: string; user: string }): number {
    return this.count(prompt.system || '') + this.count(prompt.user);
  }

  destroy(): void {
    this.#encoder.free();
  }
}
```

### Context Compressor

```typescript
export function compressContext(
  context: string,
  options: {
    maxLength?: number;
    preserveFirstSentence?: boolean;
    truncateFromEnd?: boolean;
  } = {}
): string {
  const {
    maxLength = 200,
    preserveFirstSentence = true,
    truncateFromEnd = false,
  } = options;

  if (context.length <= maxLength) return context;

  if (preserveFirstSentence) {
    const firstSentence = context.split('.')[0] + '.';
    if (firstSentence.length <= maxLength) {
      return firstSentence;
    }
  }

  if (truncateFromEnd) {
    return '...' + context.slice(-maxLength);
  }

  return context.slice(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
}
```

### Markdown Minifier

```typescript
export function minifyMarkdown(markdown: string): string {
  return markdown
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Remove trailing whitespace
    .replace(/[ \t]+$/gm, '')
    // Compress headers (keep first 3 words)
    .replace(/^(#{1,6}) (.+)/gm, (_, hashes, header) => {
      const words = header.split(' ').slice(0, 3).join(' ');
      return `${hashes} ${words}`;
    })
    // Shorten links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const shortUrl = url.replace(/^https?:\/\/(?:www\.)?/, '');
      return `${text}: ${shortUrl}`;
    });
}
```

---

## 📝 Checklist: Before Optimizing

### ✅ Pre-Optimization Checklist

- [ ] Baseline metrics established (avg tokens, hit rate, cost)
- [ ] Quality metrics defined (PRP quality score, user satisfaction)
- [ ] Rollback plan documented
- [ ] Testing strategy in place
- [ ] Monitoring configured
- [ ] Team aligned on priorities

### ✅ Post-Optimization Checklist

- [ ] Compare metrics to baseline
- [ ] Verify quality maintained
- [ ] Check error rates unchanged
- [ ] Review user feedback
- [ ] Document lessons learned
- [ ] Plan next iteration

---

## 🎓 Learning Resources

### Token Counting
- **OpenAI Tiktoken:** https://github.com/openai/tiktoken
- **Tokenizer Playground:** https://platform.openai.com/tokenizer

### Prompt Engineering
- **OpenAI Guide:** https://platform.openai.com/docs/guides/prompt-engineering
- **Anthropic Library:** https://docs.anthropic.com/claude/prompt-library

### Caching Strategies
- **Redis Best Practices:** https://redis.io/docs/manual/patterns/caching/
- **Semantic Caching Paper:** https://arxiv.org/abs/2206.10389

---

## 🚨 Troubleshooting

### Problem: High Token Count

**Diagnosis:**
```typescript
const tokens = encoder.count(prompt.user);
console.log(`User prompt: ${tokens} tokens`);

// Break down by section
const sections = {
  task: encoder.count(taskSection),
  parent: encoder.count(parentSection),
  context: encoder.count(contextSection),
  deps: encoder.count(depsSection),
};
console.table(sections);
```

**Solutions:**
1. Enable context compression (reduce maxLevels, truncate descriptions)
2. Limit dependencies shown (maxDependencies: 5)
3. Remove non-essential sections
4. Use file references for large content

### Problem: Low Cache Hit Rate

**Diagnosis:**
```typescript
const stats = await cacheManager.getStats();
console.log(`Hit rate: ${stats.hitRatio}%`);

// Check cache age distribution
const entries = await cacheManager.getEntries();
const ages = entries.map(e => Date.now() - e.createdAt);
console.log(`Average age: ${average(ages)}ms`);
```

**Solutions:**
1. Increase cache TTL (24h → 48h)
2. Review cache key logic (include only relevant fields)
3. Implement hierarchical caching (share parent context)
4. Check for cache invalidation bugs

### Problem: Quality Degradation

**Diagnosis:**
```typescript
// Compare PRP quality before/after
const baselinePRP = await generateWithBaseline(task);
const optimizedPRP = await generateOptimized(task);

const qualityDiff = compareQuality(baselinePRP, optimizedPRP);
console.log(`Quality delta: ${qualityDiff}`);
```

**Solutions:**
1. Reduce compression aggressiveness
2. Add quality gate (reject if quality drops below threshold)
3. Use selective compression (compress only safe sections)
4. Implement A/B testing to find optimal settings

---

## 📦 Quick Install

```bash
# Install dependencies
npm install tiktoken

# Add type definitions
npm install --save-dev @types/tiktoken

# Run tests
npm run test -- tests/unit/optimization/

# Run benchmarks
npm run test -- tests/benchmark/optimization.bench.test.ts
```

---

## 🔗 Related Documents

- **Full Research:** [prp-token-optimization-research.md](./prp-token-optimization-research.md)
- **Implementation Guide:** [prp-optimization-implementation-guide.md](./prp-optimization-implementation-guide.md)
- **Project README:** /home/dustin/projects/hacky-hack/README.md
- **PRP Generator:** /home/dustin/projects/hacky-hack/src/agents/prp-generator.ts

---

**Version:** 1.0
**Last Updated:** 2026-01-25
**Maintainer:** PRP Optimization Team
