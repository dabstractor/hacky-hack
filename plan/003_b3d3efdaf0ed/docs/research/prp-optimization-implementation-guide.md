# PRP Token Optimization Implementation Guide

**Date:** 2026-01-25
**Related:** [prp-token-optimization-research.md](./prp-token-optimization-research.md)
**Purpose:** Step-by-step implementation guide for token optimization techniques

---

## Quick Start: 5-Minute Implementation

### Step 1: Install Token Counting Library

```bash
npm install tiktoken
npm install --save-dev @types/tiktoken
```

### Step 2: Add Token Counting to PRPGenerator

**File:** `src/agents/prp-generator.ts`

```typescript
// Add import at top
import { Tiktoken } from 'tiktoken';

export class PRPGenerator {
  // Add property
  readonly #encoder: Tiktoken;

  constructor(
    sessionManager: SessionManager,
    noCache: boolean = false,
    cacheTtlMs: number = 24 * 60 * 60 * 1000
  ) {
    this.#logger = getLogger('PRPGenerator');
    this.sessionManager = sessionManager;
    this.#noCache = noCache;
    this.#cacheTtlMs = cacheTtlMs;

    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot create PRPGenerator: no active session');
    }
    this.sessionPath = currentSession.metadata.path;
    this.#researcherAgent = createResearcherAgent();

    // Initialize tokenizer
    this.#encoder = new Tiktoken('cl100k_base');
  }

  // Add utility method
  estimateTokens(text: string): number {
    if (!text) return 0;
    return this.#encoder.encode(text).length;
  }

  // Add cleanup method
  destroy(): void {
    this.#encoder.free();
  }
}
```

### Step 3: Log Token Usage

**File:** `src/agents/prp-generator.ts` - in `generate()` method

```typescript
async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
  // ... existing cache checking code ...

  // Step 1: Build prompt with task context
  const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());

  // NEW: Log token usage
  const systemTokens = this.estimateTokens(prompt.system || '');
  const userTokens = this.estimateTokens(prompt.user);
  const totalTokens = systemTokens + userTokens;

  this.#logger.info(
    {
      taskId: task.id,
      systemTokens,
      userTokens,
      totalTokens,
    },
    'Prompt token count'
  );

  // Warn if approaching context limit
  if (totalTokens > 6000) {
    this.#logger.warn(
      { taskId: task.id, totalTokens },
      'Prompt approaching GPT-4 context limit (8192 tokens)'
    );
  }

  // ... rest of method ...
}
```

### Step 4: Test Token Counting

```bash
# Run a PRP generation to see token counts
npm run pipeline -- create-prp --task P1.M1.T1

# Check logs for token information
tail -f logs/*.log | grep "token count"
```

---

## Implementation Phase 1: Context Compression

### 1.1 Compress Parent Context

**File:** `src/agents/prompts/prp-blueprint-prompt.ts`

```typescript
// Modify extractParentContext function
function extractParentContext(
  taskId: string,
  backlog: Backlog,
  options: {
    maxLevels?: number;
    maxDescriptionLength?: number;
  } = {}
): string {
  const {
    maxLevels = 2, // Only include 2 most recent parents
    maxDescriptionLength = 100, // Truncate descriptions to 100 chars
  } = options;

  const parts = taskId.split('.');
  const contexts: string[] = [];

  // Only extract maxLevels most recent parents
  for (
    let i = parts.length - 2;
    i >= Math.max(0, parts.length - 1 - maxLevels);
    i--
  ) {
    const parentId = parts.slice(0, i + 1).join('.');
    const parent = findItem(backlog, parentId);
    if (parent && hasDescription(parent)) {
      let description = parent.description;

      // Truncate long descriptions
      if (description.length > maxDescriptionLength) {
        description =
          description
            .slice(0, maxDescriptionLength)
            .split(' ')
            .slice(0, -1)
            .join(' ') + '...';
      }

      contexts.push(`${parent.type}: ${description}`);
    }
  }

  return contexts.join('\n');
}
```

**Usage:**

```typescript
// In constructUserPrompt
const parentContext = extractParentContext(task.id, backlog, {
  maxLevels: 2,
  maxDescriptionLength: 100,
});
```

**Expected Savings:** 200-400 tokens per request

### 1.2 Compress Task Context

**File:** `src/agents/prompts/prp-blueprint-prompt.ts`

```typescript
function extractTaskContext(
  task: Task | Subtask,
  backlog: Backlog,
  options: {
    maxDependencies?: number;
    compressContext?: boolean;
  } = {}
): string {
  const { maxDependencies = 5, compressContext = true } = options;

  if (isSubtask(task)) {
    const deps = getDependencies(task, backlog);

    // Limit dependencies shown
    const depDisplay = deps.slice(0, maxDependencies);
    const depIds = depDisplay.map(d => d.id).join(', ') || 'None';
    const moreDeps =
      deps.length > maxDependencies
        ? ` (+${deps.length - maxDependencies} more)`
        : '';

    // Compress context_scope
    let contextScope = task.context_scope;
    if (compressContext && contextScope.length > 200) {
      contextScope =
        contextScope.slice(0, 200).split(' ').slice(0, -1).join(' ') + '...';
    }

    return `Task: ${task.title}
Dependencies: ${depIds}${moreDeps}
Context: ${contextScope}`;
  }

  // For Task: compress description
  let description = task.description;
  if (compressContext && description.length > 200) {
    description =
      description.slice(0, 200).split(' ').slice(0, -1).join(' ') + '...';
  }

  return `Task: ${task.title}
Description: ${description}`;
}
```

**Expected Savings:** 100-300 tokens per request

---

## Implementation Phase 2: Enhanced Caching

### 2.1 Add Token Metrics to Cache

**File:** `src/utils/cache-manager.ts`

```typescript
export interface CacheStatistics {
  cacheId: string;
  hits: number;
  misses: number;
  hitRatio: number;
  totalEntries: number;
  totalBytes: number;
  expiredEntries: number;
  oldestEntry?: number;
  newestEntry?: number;
  collectedAt: number;

  // NEW: Token metrics
  totalTokensSaved?: number;
  averagePrpTokens?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
}
```

### 2.2 Track Token Savings

**File:** `src/agents/prp-generator.ts`

```typescript
export class PRPGenerator {
  #cacheHitsTokens: number = 0;
  #cacheMissesTokens: number = 0;

  async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
    // ... cache checking code ...

    if (cachedPRP && cachedMetadata?.taskHash === currentHash) {
      // CACHE HIT - track token savings
      const estimatedTokens = this.estimateTokens(
        prompt.user + (prompt.system || '')
      );
      this.#cacheHitsTokens += estimatedTokens;

      this.#cacheHits++;
      this.#logger.info(
        { taskId: task.id, savedTokens: estimatedTokens },
        'PRP cache HIT'
      );
      return cachedPRP;
    }

    // CACHE MISS - track tokens used
    const estimatedTokens = this.estimateTokens(
      prompt.user + (prompt.system || '')
    );
    this.#cacheMissesTokens += estimatedTokens;

    this.#cacheMisses++;
    this.#logger.debug(
      { taskId: task.id, usedTokens: estimatedTokens },
      'PRP cache MISS'
    );

    // ... rest of generation ...
  }

  // Add method to get token stats
  getTokenStats(): {
    hits: number;
    misses: number;
    savedTokens: number;
    usedTokens: number;
    savingsRatio: number;
  } {
    const total = this.#cacheHits + this.#cacheMisses;
    return {
      hits: this.#cacheHits,
      misses: this.#cacheMisses,
      savedTokens: this.#cacheHitsTokens,
      usedTokens: this.#cacheMissesTokens,
      savingsRatio:
        total > 0
          ? (this.#cacheHitsTokens /
              (this.#cacheHitsTokens + this.#cacheMissesTokens)) *
            100
          : 0,
    };
  }
}
```

### 2.3 Hierarchical Caching

**File:** `src/utils/cache/hierarchical-cache.ts` (new file)

```typescript
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import type { Backlog, HierarchyItem } from '../../core/models.js';
import { findItem, hasDescription } from '../../utils/task-utils.js';

interface SharedContext {
  parentId: string;
  context: string;
  timestamp: number;
}

export class HierarchicalCacheManager {
  readonly #sessionPath: string;
  readonly #cacheTtlMs: number;
  readonly #sharedCacheDir: string;

  constructor(sessionPath: string, cacheTtlMs: number = 24 * 60 * 60 * 1000) {
    this.#sessionPath = sessionPath;
    this.#cacheTtlMs = cacheTtlMs;
    this.#sharedCacheDir = join(sessionPath, 'prps', '.cache', 'shared');
  }

  async getParentContext(taskId: string, backlog: Backlog): Promise<string> {
    const parts = taskId.split('.');
    const contexts: string[] = [];

    // Build context hierarchy
    for (let i = 0; i < parts.length - 1; i++) {
      const parentId = parts.slice(0, i + 1).join('.');

      // Check cache
      const cached = await this.#loadSharedContext(parentId);
      if (cached) {
        contexts.push(cached);
        continue;
      }

      // Generate and cache
      const parent = findItem(backlog, parentId);
      if (parent && hasDescription(parent)) {
        const context = `${parent.type}: ${parent.description}`;
        await this.#saveSharedContext(parentId, context);
        contexts.push(context);
      }
    }

    return contexts.join('\n');
  }

  async #loadSharedContext(parentId: string): Promise<string | null> {
    const cachePath = join(
      this.#sharedCacheDir,
      `${parentId.replace(/\./g, '_')}.json`
    );

    try {
      const content = await readFile(cachePath, 'utf-8');
      const data: SharedContext = JSON.parse(content);
      const age = Date.now() - data.timestamp;

      if (age < this.#cacheTtlMs) {
        return data.context;
      }
    } catch {
      // Cache miss
    }

    return null;
  }

  async #saveSharedContext(parentId: string, context: string): Promise<void> {
    const cachePath = join(
      this.#sharedCacheDir,
      `${parentId.replace(/\./g, '_')}.json`
    );

    try {
      await mkdir(this.#sharedCacheDir, { recursive: true });

      const data: SharedContext = {
        parentId,
        context,
        timestamp: Date.now(),
      };

      await writeFile(cachePath, JSON.stringify(data, null, 2), {
        mode: 0o644,
      });
    } catch (error) {
      console.error('Failed to save shared context:', error);
    }
  }

  async clearSharedCache(): Promise<void> {
    // Implementation for clearing shared cache
    // Can be called when session ends or periodically
  }
}
```

---

## Implementation Phase 3: Delta Encoding

### 3.1 Delta Encoding for Changed Tasks

**File:** `src/agents/prp-generator.ts`

```typescript
interface TaskDelta {
  taskId: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

async #generateWithDelta(
  task: Task | Subtask,
  backlog: Backlog,
  cachedPRP: PRPDocument
): Promise<PRPDocument> {
  const currentHash = this.#computeTaskHash(task, backlog);
  const cachedMetadata = await this.#loadCacheMetadata(task.id);

  if (!cachedMetadata || cachedMetadata.taskHash === currentHash) {
    return cachedPRP;
  }

  // Compute delta
  const delta = this.#computeTaskDelta(cachedPRP, task);

  this.#logger.info(
    { taskId: task.id, changes: delta.changes.length },
    'Generating PRP with delta encoding'
  );

  const deltaPrompt = this.#createDeltaPrompt(cachedPRP, delta);

  const result = await retryAgentPrompt(
    () => this.#researcherAgent.prompt(deltaPrompt),
    { agentType: 'Researcher', operation: 'updatePRP' }
  );

  return PRPDocumentSchema.parse(result);
}

#computeTaskDelta(
  cachedPRP: PRPDocument,
  task: Task | Subtask
): TaskDelta {
  const changes: TaskDelta['changes'] = [];

  // Compare task fields
  if (cachedPRP.objective !== task.title) {
    changes.push({
      field: 'title',
      oldValue: cachedPRP.objective,
      newValue: task.title,
    });
  }

  if (isSubtask(task)) {
    const contextChanged = !cachedPRP.context.includes(
      task.context_scope.slice(0, 50)
    );
    if (contextChanged) {
      changes.push({
        field: 'context',
        oldValue: cachedPRP.context,
        newValue: task.context_scope,
      });
    }
  }

  return {
    taskId: task.id,
    changes,
  };
}

#createDeltaPrompt(cachedPRP: PRPDocument, delta: TaskDelta): any {
  const changesDescription = delta.changes
    .map((c) => `- ${c.field}: Changed to "${c.newValue}"`)
    .join('\n');

  return createPrompt({
    user: `Update the following PRP based on these changes:

${changesDescription}

Current PRP:
${JSON.stringify(cachedPRP, null, 2)}

Return the complete updated PRP.`,
    system: PRP_BLUEPRINT_PROMPT,
    responseFormat: PRPDocumentSchema,
    enableReflection: true,
  });
}
```

---

## Implementation Phase 4: Markdown Compression

### 4.1 Markdown Compression Utility

**File:** `src/utils/markdown-compressor.ts` (new file)

```typescript
export interface CompressionOptions {
  aggressive?: boolean;
  removeHeaders?: boolean[];
  compressLinks?: boolean;
  compressLists?: boolean;
  normalizeWhitespace?: boolean;
}

export function compressMarkdown(
  markdown: string,
  options: CompressionOptions = {}
): string {
  const {
    aggressive = false,
    removeHeaders = [],
    compressLinks = true,
    compressLists = true,
    normalizeWhitespace = true,
  } = options;

  let compressed = markdown;

  // Remove specified headers
  if (removeHeaders.length > 0) {
    const headerPattern = removeHeaders
      .map(h => `##+ ${h}\\n[\\s\\S]*?\\n\\n`)
      .join('|');
    compressed = compressed.replace(new RegExp(headerPattern, 'g'), '');
  }

  // Compress links
  if (compressLinks) {
    compressed = compressed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, text, url) => {
        // Keep text, shorten URL if it's a GitHub link
        if (url.includes('github.com')) {
          const parts = url.split('/');
          const shortUrl = `${parts[2]}/${parts[3]}/${parts[5]}`;
          return `${text}: ${shortUrl}`;
        }
        return `${text}: ${url}`;
      }
    );
  }

  // Compress lists
  if (compressLists) {
    compressed = compressed
      .replace(/^(\s*)-\s+/gm, '$1- ') // Remove extra spaces after bullets
      .replace(/^(\s*)\d+\.\s+/gm, '$1• '); // Replace numbered lists with bullets
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    compressed = compressed
      .replace(/\n{3,}/g, '\n\n') // Remove extra blank lines
      .replace(/[ \t]+$/gm, '') // Remove trailing spaces
      .replace(/^ +$/gm, ''); // Remove lines with only spaces
  }

  // Aggressive mode
  if (aggressive) {
    compressed = compressed
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1'); // Remove inline code (careful!)
  }

  return compressed;
}
```

### 4.2 Integrate into PRP Formatting

**File:** `src/agents/prp-generator.ts`

```typescript
import { compressMarkdown } from '../utils/markdown-compressor.js';

async #writePRPToFile(prp: PRPDocument): Promise<void> {
  // ... existing code ...

  try {
    await mkdir(prpsDir, { recursive: true });

    // Format PRP as markdown
    const markdown = this.#formatPRPAsMarkdown(prp);

    // NEW: Compress if large
    const tokens = this.estimateTokens(markdown);
    const compressed =
      tokens > 1000
        ? compressMarkdown(markdown, {
            compressLinks: true,
            compressLists: true,
            normalizeWhitespace: true,
          })
        : markdown;

    await writeFile(filePath, compressed, { mode: 0o644 });

    this.#logger.info(
      {
        taskId: prp.taskId,
        filePath,
        originalTokens: tokens,
        compressedTokens: this.estimateTokens(compressed),
      },
      'PRP written'
    );
  } catch (error) {
    throw new PRPFileError(prp.taskId, filePath, error);
  }
}
```

---

## Implementation Phase 5: CLI Integration

### 5.1 Token Statistics Command

**File:** `src/cli/commands/token-stats.ts` (new file)

```typescript
import { Command } from 'commander';
import { PRPGenerator } from '../../agents/prp-generator.js';
import type { SessionManager } from '../../core/session-manager.js';

export const tokenStatsCommand = new Command('token-stats')
  .description('Show token usage statistics')
  .option('-s, --session <path>', 'Session path')
  .action(async options => {
    console.log('\n=== Token Usage Statistics ===\n');

    // Get generator instance (you'll need to adapt this based on your setup)
    const generator = new PRPGenerator(sessionManager);

    const stats = generator.getTokenStats();

    console.log(`Cache Hits: ${stats.hits}`);
    console.log(`Cache Misses: ${stats.misses}`);
    console.log(
      `Hit Ratio: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`
    );
    console.log(
      `\nTokens Saved (Cache Hits): ${stats.savedTokens.toLocaleString()}`
    );
    console.log(
      `Tokens Used (Cache Misses): ${stats.usedTokens.toLocaleString()}`
    );
    console.log(
      `Total Tokens: ${(stats.savedTokens + stats.usedTokens).toLocaleString()}`
    );
    console.log(`Savings Ratio: ${stats.savingsRatio.toFixed(1)}%`);

    // Cost estimation (GPT-4 pricing: $0.03/1K input tokens)
    const inputCost = (stats.usedTokens / 1000) * 0.03;
    const savedCost = (stats.savedTokens / 1000) * 0.03;

    console.log('\n=== Cost Estimates ===');
    console.log(`Input Cost (Misses): $${inputCost.toFixed(2)}`);
    console.log(`Cost Saved (Hits): $${savedCost.toFixed(2)}`);
    console.log(
      `Total Cost Without Cache: $${(inputCost + savedCost).toFixed(2)}`
    );
    console.log(`Actual Cost: $${inputCost.toFixed(2)}`);

    console.log('\n=== Optimization Recommendations ===');
    if (stats.savingsRatio < 30) {
      console.log(
        '⚠️  Low cache savings - consider increasing TTL or optimizing cache keys'
      );
    }
    if (stats.usedTokens / stats.misses > 3000) {
      console.log('⚠️  High average tokens - enable context compression');
    }
    if (stats.hits < stats.misses) {
      console.log('⚠️  More misses than hits - review cache strategy');
    }

    console.log('\n');
  });
```

### 5.2 Add to CLI

**File:** `src/cli/index.ts`

```typescript
import { tokenStatsCommand } from './commands/token-stats.js';

// In your CLI setup
program.addCommand(tokenStatsCommand);
```

---

## Testing Your Optimizations

### Unit Tests

**File:** `tests/unit/optimization/token-counting.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PRPGenerator } from '../../../src/agents/prp-generator.js';
import type { SessionManager } from '../../../src/core/session-manager.js';

describe('Token Counting', () => {
  it('should estimate tokens for simple text', () => {
    const generator = new PRPGenerator(sessionManager);

    const text = 'This is a simple prompt for testing.';
    const tokens = generator.estimateTokens(text);

    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(100);
  });

  it('should warn on large prompts', async () => {
    const generator = new PRPGenerator(sessionManager);

    // Create a large task
    const largeTask = {
      id: 'P1.M1.T1',
      type: 'Task',
      title: 'A'.repeat(1000),
      description: 'B'.repeat(1000),
      status: 'pending',
      dependencies: [],
    };

    const prompt = createPRPBlueprintPrompt(largeTask, backlog);
    const tokens = generator.estimateTokens(prompt.user);

    expect(tokens).toBeGreaterThan(6000);
  });

  it('should track token stats', async () => {
    const generator = new PRPGenerator(sessionManager);

    await generator.generate(task1, backlog); // Cache miss
    await generator.generate(task1, backlog); // Cache hit

    const stats = generator.getTokenStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.savedTokens).toBeGreaterThan(0);
  });
});
```

### Integration Tests

**File:** `tests/integration/optimization/context-compression.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  extractParentContext,
  extractTaskContext,
} from '../../../src/agents/prompts/prp-blueprint-prompt.js';

describe('Context Compression', () => {
  it('should limit parent context levels', () => {
    const context = extractParentContext('P1.M1.T1.S1', backlog, {
      maxLevels: 2,
    });

    const lines = context.split('\n').length;
    expect(lines).toBeLessThanOrEqual(2);
  });

  it('should truncate long descriptions', () => {
    const task = {
      id: 'P1.M1.T1',
      type: 'Task',
      title: 'Test Task',
      description: 'A'.repeat(500),
      status: 'pending',
      dependencies: [],
    };

    const context = extractTaskContext(task, backlog, {
      compressContext: true,
    });

    expect(context.length).toBeLessThan(300);
  });

  it('should limit dependencies', () => {
    const subtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      context_scope: 'Test context',
      status: 'pending',
      dependencies: Array.from({ length: 10 }, (_, i) => `P1.M1.T1.S${i}`),
    };

    const context = extractTaskContext(subtask, backlog, {
      maxDependencies: 5,
    });

    expect(context).toContain('(+5 more)');
  });
});
```

---

## Performance Benchmarks

### Benchmark Script

**File:** `tests/benchmark/optimization.bench.test.ts`

```typescript
import { describe, bench } from 'vitest';
import { PRPGenerator } from '../../src/agents/prp-generator.js';

describe('Optimization Benchmarks', () => {
  const generator = new PRPGenerator(sessionManager);

  bench('Baseline: Full context', async () => {
    const prompt = createPRPBlueprintPrompt(task, backlog);
    return generator.estimateTokens(prompt.user);
  });

  bench('Optimized: Compressed context (2 levels)', async () => {
    const prompt = createPRPBlueprintPrompt(task, backlog, undefined, {
      maxLevels: 2,
    });
    return generator.estimateTokens(prompt.user);
  });

  bench('Optimized: Compressed context + truncated descriptions', async () => {
    const prompt = createPRPBlueprintPrompt(task, backlog, undefined, {
      maxLevels: 2,
      maxDescriptionLength: 100,
    });
    return generator.estimateTokens(prompt.user);
  });
});
```

### Run Benchmarks

```bash
npm run test:bail -- tests/benchmark/optimization.bench.test.ts
```

---

## Rollback Plan

If optimizations cause issues, quickly revert:

```typescript
// Disable all optimizations via environment variable
const ENABLE_OPTIMIZATIONS = process.env.ENABLE_PRP_OPTIMIZATIONS !== 'false';

function extractParentContext(
  taskId: string,
  backlog: Backlog,
  options?: {
    maxLevels?: number;
    maxDescriptionLength?: number;
  }
): string {
  if (!ENABLE_OPTIMIZATIONS) {
    // Use original implementation
    return extractParentContextOriginal(taskId, backlog);
  }

  // Use optimized implementation
  return extractParentContextOptimized(taskId, backlog, options);
}
```

Disable via environment:

```bash
export ENABLE_PRP_OPTIMIZATIONS=false
npm run pipeline
```

---

## Monitoring and Alerts

### Add Metrics Logging

**File:** `src/agents/prp-generator.ts`

```typescript
async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
  // ... token counting ...

  // Log to monitoring system
  if (process.env.ENABLE_METRICS === 'true') {
    await this.#logMetrics({
      taskId: task.id,
      totalTokens,
      cacheHit: cachedPRP !== null,
      timestamp: Date.now(),
    });
  }
}

async #logMetrics(metrics: Record<string, unknown>): Promise<void> {
  // Write to metrics file or send to monitoring service
  const metricsPath = join(this.sessionPath, 'metrics', 'tokens.jsonl');
  await appendFile(metricsPath, JSON.stringify(metrics) + '\n');
}
```

### Set Up Alerts

```typescript
// In generate() method
if (totalTokens > 7000) {
  this.#logger.error(
    { taskId: task.id, totalTokens },
    'CRITICAL: Prompt very close to context limit!'
  );

  // Send alert (implement based on your alerting system)
  if (process.env.ENABLE_ALERTS === 'true') {
    await this.#sendAlert({
      level: 'critical',
      message: `PRP prompt for ${task.id} using ${totalTokens} tokens`,
      taskId: task.id,
    });
  }
}
```

---

## Next Steps

1. **Week 1:** Implement token counting and logging
2. **Week 2:** Add context compression (parent limits, description truncation)
3. **Week 3:** Implement hierarchical caching
4. **Week 4:** Add delta encoding and markdown compression
5. **Week 5+:** Monitor metrics, iterate on optimizations

**Success Metrics:**

- 30% reduction in average tokens per PRP
- 50% increase in cache hit ratio
- No degradation in PRP quality
- Positive user feedback

---

**Document Version:** 1.0
**Last Updated:** 2026-01-25
**Status:** Ready for Implementation
