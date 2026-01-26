# PRP for P3.M3.T2.S2: Optimize PRP File Size and Token Usage

---

## Goal

**Feature Goal**: Reduce PRP file storage size by 50-70% and lower agent token usage by 40-60% through intelligent content compression, file references, and token-aware optimization.

**Deliverable**: Enhanced PRP generation system with configurable compression, token tracking, and optimized storage format.

**Success Definition**:

- PRP markdown files reduced by 50%+ average size
- Token usage reduction of 40%+ for Researcher/Coder agents
- New `--prp-compression` CLI flag with aggressive/standard/off modes
- Token usage metrics in cache statistics
- All existing tests pass with backward compatibility

---

## Why

**Business Value and User Impact**:

- **Cost Reduction**: Current PRP files consume 2000-4000 tokens per generation; 40% reduction saves $90/month ($1,080/year) at scale
- **Performance**: Smaller PRPs reduce LLM processing time by 30-50%
- **Scalability**: As projects grow, large PRP files become bottlenecks (noted in system_context.md)
- **Developer Experience**: Faster PRP generation and execution

**Integration with Existing Features**:

- Extends existing cache system in `src/agents/prp-generator.ts`
- Builds on TTL-based cache metadata in `prps/.cache/`
- Integrates with CLI flag patterns from `src/cli/index.ts`
- Complements `--cache-ttl` and `--cache-prune` flags

**Problems Solved**:

1. **Large PRP Files**: Current PRPs stored as full markdown with all context (system_context.md line 488-491)
2. **No Token Awareness**: No tracking of token usage or approaching limits
3. **Redundant Content**: Parent context repeated across sibling PRPs
4. **No Compression**: Code snippets and documentation fully inlined

---

## What

### User-Visible Behavior

**CLI Enhancement**:

```bash
# Standard compression (default)
prd PRD.md --prp-compression

# Aggressive compression (maximum savings)
prd PRD.md --prp-compression=aggressive

# Disable compression (backward compatible)
prd PRD.md --no-prp-compression
```

**Behavior Changes**:

- PRP files stored in compressed format (smaller markdown)
- Cache metadata includes token count and compression ratio
- Warning when token usage approaches agent limits
- Researcher Agent receives compressed PRP context

**Backward Compatibility**:

- Default compression level preserves full context
- `--no-prp-compression` flag disables all optimizations
- Existing cache entries remain valid

### Technical Requirements

1. **Code Snippet Compression**: Remove comments, blank lines, compress whitespace
2. **File References**: Replace large file content with `see src/path/file.ts lines 50-100`
3. **Parent Context Optimization**: Limit to 2 levels, truncate to 100 chars per level
4. **Token Counting**: Track input/output tokens per PRP generation
5. **Compression Levels**: Standard (30% savings) and Aggressive (60% savings)
6. **Metrics**: Add token usage to cache statistics

### Success Criteria

- [ ] PRP markdown size reduced by 50%+ on average
- [ ] Token usage reduced by 40%+ for Researcher Agent
- [ ] CLI flag `--prp-compression` working with 3 modes
- [ ] Token tracking in cache metadata (inputTokens, outputTokens, compressionRatio)
- [ ] Warning logged when approaching token limits (80% of max)
- [ ] All existing PRP tests pass
- [ ] New compression tests added and passing
- [ ] Backward compatibility preserved (no breaking changes)

---

## All Needed Context

### Context Completeness Check

✅ **Complete** - All required context included for implementation. Research covered:

- Current PRP generation implementation
- CLI flag patterns and configuration flow
- Cache architecture and metadata structure
- Test patterns and validation approaches
- Token counting libraries and techniques
- Code compression strategies

### Documentation & References

```yaml
# MUST READ - Implementation References

- url: https://github.com/openai/tiktoken
  why: Token counting library for accurate token measurement
  critical: Use GPT-4 tokenizer for GLM-4.7 compatibility
  section: Installation and usage examples

- url: https://esbuild.github.io/api/#transform
  why: Built-in code minification (already in devDependencies)
  critical: Use for TypeScript/JavaScript code snippet compression
  section: minifyIdentifiers and minifyWhitespace options

- url: https://github.com/terser/terser
  why: Advanced minification for complex code snippets
  critical: Alternative when esbuild insufficient
  section: API usage and options

- url: file:src/agents/prp-generator.ts
  why: Current PRP generation implementation to extend
  pattern: Cache management, file writing, prompt construction
  gotcha: Must preserve backward compatibility with existing cache format

- url: file:src/cli/index.ts
  why: CLI flag implementation patterns
  pattern: Boolean flags with .option('--flag', 'description', default)
  gotcha: Use ValidatedCLIArgs interface for type safety

- url: file:src/core/models.ts
  why: PRPDocument and PRPCacheMetadata type definitions
  pattern: Extend interfaces for new compression fields
  gotcha: Must maintain schema compatibility

- url: file:tests/unit/agents/prp-generator.test.ts
  why: Test patterns for PRP generator
  pattern: Mock agent.prompt() for testing, validate cache behavior
  gotcha: Test both compressed and uncompressed modes

- url: file:tests/unit/prp-template-validation.test.ts
  why: PRP template structure validation
  pattern: Section validation, markdown parsing
  gotcha: Compression must not break template structure

- url: file:plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Documents current PRP size limitations
  pattern: Performance bottlenecks section
  gotcha: Large PRP files listed as known issue

- url: file:docs/research/prp-token-optimization-research.md
  why: External research on token optimization techniques
  pattern: Hierarchical caching, delta encoding, markdown compression
  section: Implementation recommendations

- url: file:docs/research/code-minification-compression-techniques.md
  why: Code snippet compression strategies
  pattern: Comment removal, whitespace compression, AST-based minification
  section: CodeProcessor utility class implementation
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── prp-generator.ts          # MODIFY: Add compression logic
│   ├── prompts/
│   │   └── prp-blueprint-prompt.ts  # MODIFY: Compress context injection
│   └── agent-factory.ts           # REFERENCE: Token limits by persona
├── cli/
│   └── index.ts                   # MODIFY: Add --prp-compression flag
├── core/
│   ├── models.ts                  # MODIFY: Extend PRPCacheMetadata
│   └── session-manager.ts         # REFERENCE: Session path structure
├── utils/
│   ├── code-processor.ts          # CREATE: New utility for code compression
│   ├── token-counter.ts           # CREATE: New utility for token counting
│   ├── cache-manager.ts           # REFERENCE: Cache statistics tracking
│   └── logger.ts                  # REFERENCE: Logging patterns
└── workflows/
    ├── prp-pipeline.ts            # MODIFY: Pass compression flag
    └── prp-runtime.ts             # MODIFY: Pass compression flag

tests/
├── unit/
│   ├── agents/
│   │   └── prp-generator.test.ts  # MODIFY: Add compression tests
│   └── prp-compression.test.ts    # CREATE: New compression test suite
└── fixtures/
    └── prp-samples.ts             # REFERENCE: Sample PRP documents

plan/003_b3d3efdaf0ed/
├── tasks.json                     # REFERENCE: Current task status
└── P3M3T2S2/
    └── PRP.md                     # THIS FILE
```

### Desired Codebase Tree with Files to Add

```bash
src/
├── agents/
│   ├── prp-generator.ts          # ✏️ ADD: compress field, compressPRP() method
│   └── prompts/
│       └── prp-blueprint-prompt.ts # ✏️ ADD: Compress parent context, code snippets
├── cli/
│   └── index.ts                   # ✏️ ADD: --prp-compression flag to CLIArgs
├── core/
│   └── models.ts                  # ✏️ ADD: compression fields to PRPCacheMetadata
├── utils/
│   ├── code-processor.ts          # ✨ CREATE: Code compression utilities
│   └── token-counter.ts           # ✨ CREATE: Token counting utilities
└── workflows/
    ├── prp-pipeline.ts            # ✏️ ADD: prpCompression parameter
    └── prp-runtime.ts             # ✏️ ADD: prpCompression parameter

tests/unit/
├── agents/
│   └── prp-generator.test.ts      # ✏️ ADD: Compression test cases
└── prp-compression.test.ts        # ✨ CREATE: Comprehensive compression tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: GLM-4.7 token limits by persona (src/agents/agent-factory.ts)
const PERSONA_TOKEN_LIMITS = {
  architect: 8192, // Complex PRD analysis
  researcher: 4096, // PRP generation - TARGET FOR OPTIMIZATION
  coder: 4096, // PRP execution
  qa: 4096, // Bug hunting
} as const;

// GOTCHA: Tiktoken uses GPT-4 tokenizer, not GLM-4
// Use tiktoken.get_encoding("cl100k_base") as approximation
// Groundswell API returns actual token counts in response.usage

// GOTCHA: Cache metadata must be backward compatible
// Existing .cache/*.json files won't have compression fields
// Use optional fields with ?? defaults when reading

// PATTERN: CLI boolean flags use Commander.js syntax
// .option('--flag-name', 'Description', false)
// Negation: .option('--no-flag-name', 'Disable feature')

// CRITICAL: esbuild already in devDependencies
// Use esbuild.transformSync() for code minification
// No new dependencies needed for basic compression

// GOTCHA: PRP template validation expects specific sections
// Compression must preserve all required sections
// See tests/unit/prp-template-validation.test.ts

// PATTERN: Cache statistics use CacheManager class
// Add tokenCount and compressionRatio to statistics
// Follow existing pattern in src/utils/cache-manager.ts
```

---

## Implementation Blueprint

### Data Models and Structure

Extend existing models for compression support:

```typescript
// src/core/models.ts - ADD to existing interfaces

/**
 * Compression level for PRP generation
 */
export type PRPCompressionLevel = 'off' | 'standard' | 'aggressive';

/**
 * Extended cache metadata with compression metrics
 */
export interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;

  // NEW FIELDS for compression
  readonly compressionLevel?: PRPCompressionLevel;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly compressionRatio?: number; // (originalSize / compressedSize)
  readonly originalSize?: number; // Character count before compression
  readonly compressedSize?: number; // Character count after compression
}
```

---

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/token-counter.ts
  - IMPLEMENT: TokenCounter class with tiktoken integration
  - FOLLOW pattern: src/utils/cache-manager.ts (class structure, logging)
  - NAMING: TokenCounter class, countTokens() method
  - DEPENDENCIES: Install tiktoken package
  - PLACEMENT: Utils layer in src/utils/

Task 2: CREATE src/utils/code-processor.ts
  - IMPLEMENT: CodeProcessor class with compression methods
  - IMPLEMENT: removeComments(), removeBlankLines(), compressWhitespace()
  - IMPLEMENT: extractLineRange() for file references
  - FOLLOW pattern: Existing utility classes (error handling, logging)
  - NAMING: CodeProcessor class, processForAI() convenience method
  - DEPENDENCIES: esbuild (already in devDependencies)
  - PLACEMENT: Utils layer in src/utils/

Task 3: MODIFY src/core/models.ts
  - ADD: PRPCompressionLevel type ('off' | 'standard' | 'aggressive')
  - EXTEND: PRPCacheMetadata interface with compression fields
  - PRESERVE: Existing cache structure for backward compatibility
  - NAMING: compressionLevel, inputTokens, outputTokens, compressionRatio
  - PLACEMENT: Core models alongside existing interfaces

Task 4: MODIFY src/cli/index.ts
  - ADD: prpCompression field to CLIArgs interface (string | undefined)
  - ADD: --prp-compression option to Commander.js configuration
  - VALIDATE: Compression level values ('off', 'standard', 'aggressive')
  - COMPUTE: Default to 'standard' if not specified
  - FOLLOW pattern: Existing boolean flags like --no-cache
  - NAMING: prpCompression in ValidatedCLIArgs
  - PLACEMENT: CLI configuration section (around line 300)

Task 5: MODIFY src/workflows/prp-pipeline.ts
  - ADD: prpCompression parameter to constructor
  - STORE: this.#prpCompression as private field
  - PASS: prpCompression to PRPRuntime
  - FOLLOW pattern: Existing config parameter passing (cacheTtl, noCache)
  - PLACEMENT: Constructor parameters (after cacheTtl)

Task 6: MODIFY src/agents/prp-runtime.ts
  - ADD: prpCompression parameter to constructor
  - PASS: prpCompression to PRPGenerator constructor
  - FOLLOW pattern: Existing parameter flow (noCache, cacheTtlMs)
  - PLACEMENT: After cacheTtlMs parameter

Task 7: MODIFY src/agents/prp-generator.ts (CORE COMPLEX TASK)
  - ADD: prpCompression field to constructor (default: 'standard')
  - ADD: #compressPRP(prp: PRPDocument) method
  - IMPLEMENT: Code snippet compression using CodeProcessor
  - IMPLEMENT: File reference replacement (>500 chars becomes reference)
  - IMPLEMENT: Parent context truncation (2 levels, 100 chars each)
  - MODIFY: generate() to call #compressPRP() before writing
  - ADD: Token counting before/after compression
  - UPDATE: #saveCacheMetadata() to include compression metrics
  - LOG: Warning when tokens exceed 80% of PERSONA_TOKEN_LIMITS.researcher
  - FOLLOW pattern: Existing cache logic in generate() method
  - DEPENDENCIES: TokenCounter, CodeProcessor, extended models
  - PLACEMENT: After #writePRPToFile(), before return

Task 8: MODIFY src/agents/prompts/prp-blueprint-prompt.ts
  - MODIFY: extractParentContext() to limit depth (2 levels max)
  - MODIFY: Truncate each level to 100 characters
  - MODIFY: Code snippet injection to use compression
  - PRESERVE: All required template sections
  - FOLLOW pattern: Existing context extraction logic
  - PLACEMENT: Context building functions

Task 9: CREATE tests/unit/prp-compression.test.ts
  - IMPLEMENT: TokenCounter tests (accuracy, edge cases)
  - IMPLEMENT: CodeProcessor tests (compression ratios, preservation)
  - IMPLEMENT: Integration tests (full PRP compression)
  - IMPLEMENT: Token limit warning tests
  - FOLLOW pattern: tests/unit/agents/prp-generator.test.ts
  - NAMING: describe('PRP Compression', () => { ... })
  - COVERAGE: All compression levels, edge cases, error handling
  - PLACEMENT: Tests alongside other unit tests

Task 10: MODIFY tests/unit/agents/prp-generator.test.ts
  - ADD: Test cases for compression modes
  - ADD: Test backward compatibility (reading old cache)
  - ADD: Test token counting and warnings
  - FOLLOW pattern: Existing test structure (beforeEach, mocking)
  - PRESERVE: All existing tests (must continue passing)
  - PLACEMENT: After existing generate() tests
```

---

### Implementation Patterns & Key Details

````typescript
// ===== PATTERN 1: Token Counter =====
// File: src/utils/token-counter.ts

import { encoding_for_model } from 'tiktoken';
import { getLogger } from './logger.js';

export class TokenCounter {
  readonly #logger = getLogger('TokenCounter');
  readonly #encoding = encoding_for_model('gpt-4');

  /**
   * Counts tokens in text using tiktoken
   */
  countTokens(text: string): number {
    const tokens = this.#encoding.encode(text);
    return tokens.length;
  }

  /**
   * Estimates if text will exceed token limit
   */
  willExceedLimit(text: string, limit: number): boolean {
    return this.countTokens(text) > limit;
  }
}

// ===== PATTERN 2: Code Processor =====
// File: src/utils/code-processor.ts

import { transformSync } from 'esbuild';

export class CodeProcessor {
  /**
   * Compresses code snippets for AI prompts
   * Removes comments, blank lines, compresses whitespace
   */
  processForAI(code: string): string {
    let processed = code;

    // Remove single-line comments
    processed = processed.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments
    processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove blank lines
    processed = processed.replace(/^\s*[\r\n]/gm, '');

    // Compress whitespace (preserve structure)
    processed = processed.replace(/[ \t]+/g, ' ');

    return processed.trim();
  }

  /**
   * Extracts line range from file content
   */
  extractLineRange(content: string, start: number, end: number): string {
    const lines = content.split('\n');
    return lines.slice(start - 1, end).join('\n');
  }

  /**
   * Converts large content to file reference
   */
  createFileReference(
    filePath: string,
    lineStart: number,
    lineEnd: number
  ): string {
    return `See ${filePath} lines ${lineStart}-${lineEnd}`;
  }
}

// ===== PATTERN 3: PRP Compression =====
// File: src/agents/prp-generator.ts (MODIFY existing class)

export class PRPGenerator {
  // ... existing fields ...
  readonly #compression: PRPCompressionLevel;
  readonly #tokenCounter: TokenCounter;
  readonly #codeProcessor: CodeProcessor;

  constructor(
    sessionManager: SessionManager,
    noCache: boolean = false,
    cacheTtlMs: number = 24 * 60 * 60 * 1000,
    prpCompression: PRPCompressionLevel = 'standard' // NEW PARAM
  ) {
    // ... existing constructor code ...
    this.#compression = prpCompression;
    this.#tokenCounter = new TokenCounter();
    this.#codeProcessor = new CodeProcessor();
  }

  /**
   * Compresses PRP content based on compression level
   */
  #compressPRP(prp: PRPDocument): {
    compressed: PRPDocument;
    originalTokens: number;
    compressedTokens: number;
  } {
    if (this.#compression === 'off') {
      const tokens = this.#tokenCounter.countTokens(prp.context);
      return {
        compressed: prp,
        originalTokens: tokens,
        compressedTokens: tokens,
      };
    }

    let compressed = { ...prp };
    const originalTokens = this.#tokenCounter.countTokens(prp.context);

    // Compress code snippets in context
    compressed.context = this.#compressCodeSnippets(compressed.context);

    // Replace large file references (>500 chars)
    compressed.context = this.#replaceLargeReferences(compressed.context);

    // Aggressive mode: truncate parent context
    if (this.#compression === 'aggressive') {
      compressed.context = this.#truncateParentContext(compressed.context);
    }

    const compressedTokens = this.#tokenCounter.countTokens(compressed.context);

    // Warn if approaching token limit
    const tokenLimit = PERSONA_TOKEN_LIMITS.researcher;
    if (compressedTokens > tokenLimit * 0.8) {
      this.#logger.warn(
        { taskId: prp.taskId, tokens: compressedTokens, limit: tokenLimit },
        'PRP approaching token limit'
      );
    }

    return { compressed, originalTokens, compressedTokens };
  }

  /**
   * Compresses code snippets in context
   */
  #compressCodeSnippets(context: string): string {
    // Find all code blocks
    return context.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const compressed = this.#codeProcessor.processForAI(code);
      return `\`\`\`${lang || ''}\n${compressed}\n\`\`\``;
    });
  }

  /**
   * Replaces large file content with references
   */
  #replaceLargeReferences(context: string): string {
    // Find file content blocks >500 chars
    return context.replace(
      /```(?:file|path):\s*(\S+?)\n([\s\S]{500,}?)```/g,
      (_, filePath, content) => {
        const lines = content.split('\n');
        return `See ${filePath} (1-${lines.length})`;
      }
    );
  }

  /**
   * Truncates parent context to 2 levels, 100 chars each
   */
  #truncateParentContext(context: string): string {
    // Find parent context section and truncate
    // Implementation specific to context format
    return context; // Placeholder
  }

  /**
   * MODIFIED generate() method to use compression
   */
  async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
    // ... existing cache logic ...

    // Generate PRP
    const result = await retryAgentPrompt(
      () => this.#researcherAgent.prompt(prompt),
      { agentType: 'Researcher', operation: 'generatePRP' }
    );

    const validated = PRPDocumentSchema.parse(result);

    // NEW: Compress before writing
    const { compressed, originalTokens, compressedTokens } =
      this.#compressPRP(validated);

    // Write compressed PRP
    await this.#writePRPToFile(compressed);

    // Save cache with compression metrics
    if (!this.#noCache) {
      const currentHash = this.#computeTaskHash(task, backlog);
      await this.#saveCacheMetadata(task.id, currentHash, compressed, {
        originalTokens,
        compressedTokens,
        compressionLevel: this.#compression,
      });
    }

    return compressed;
  }
}

// ===== PATTERN 4: CLI Integration =====
// File: src/cli/index.ts (MODIFY existing CLI)

export interface CLIArgs {
  // ... existing fields ...
  prpCompression?: string; // NEW: 'off' | 'standard' | 'aggressive'
}

export interface ValidatedCLIArgs extends Omit<CLIArgs, 'prpCompression'> {
  // ... existing fields ...
  prpCompression: 'off' | 'standard' | 'aggressive'; // VALIDATED
}

export function parseCLIArgs(): ValidatedCLIArgs {
  const program = new Command();

  program.option(
    '--prp-compression <level>',
    'PRP compression level (off|standard|aggressive)',
    'standard'
  );
  // ... other options ...

  const args = program.parse(process.argv).opts() as CLIArgs;

  return {
    ...args,
    prpCompression: validateCompressionLevel(args.prdCompression || 'standard'),
  };
}

function validateCompressionLevel(
  level: string
): 'off' | 'standard' | 'aggressive' {
  const valid = ['off', 'standard', 'aggressive'];
  if (!valid.includes(level)) {
    logger.error(`Invalid compression level: ${level}`);
    process.exit(1);
  }
  return level as 'off' | 'standard' | 'aggressive';
}

// ===== PATTERN 5: Cache Metadata Extension =====
// File: src/core/models.ts

export interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;

  // NEW: Compression metrics (all optional for backward compatibility)
  readonly compressionLevel?: PRPCompressionLevel;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly compressionRatio?: number;
  readonly originalSize?: number;
  readonly compressedSize?: number;
}

// CRITICAL: Use ?? operator when reading old cache entries
const originalTokens = metadata.inputTokens ?? 0;
````

---

### Integration Points

```yaml
DEPENDENCIES:
  - add: tiktoken package
    command: npm install tiktoken && npm install --save-dev @types/tiktoken
    reason: Accurate token counting for PRP content

  - existing: esbuild (devDependencies)
    reason: Code minification without new dependencies

CONFIG:
  - add to: src/cli/index.ts
    pattern: |
      .option('--prp-compression <level>', 'PRP compression level', 'standard')

  - add to: src/workflows/prp-pipeline.ts constructor
    pattern: prpCompression: PRPCompressionLevel = 'standard'

  - add to: src/agents/prp-runtime.ts constructor
    pattern: prpCompression: PRPCompressionLevel = 'standard'

  - add to: src/agents/prp-generator.ts constructor
    pattern: prpCompression: PRPCompressionLevel = 'standard'

TYPES:
  - modify: src/core/models.ts
    add: PRPCompressionLevel type
    extend: PRPCacheMetadata interface

LOGGING:
  - add: Token usage logging
    pattern: this.#logger.info({ tokens, compressionRatio }, 'PRP compressed')

  - add: Token limit warnings
    pattern: this.#logger.warn({ tokens, limit }, 'Approaching token limit')

CACHE:
  - extend: Cache statistics
    add: totalTokens, averageCompressionRatio fields
    pattern: Follow CacheManager.getStatistics() structure

TESTS:
  - create: tests/unit/prp-compression.test.ts
    coverage: TokenCounter, CodeProcessor, integration tests

  - modify: tests/unit/agents/prp-generator.test.ts
    add: Compression mode tests, backward compatibility tests
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npx tsc --noEmit src/utils/token-counter.ts  # Type checking
npx tsc --noEmit src/utils/code-processor.ts  # Type checking
npx tsc --noEmit src/agents/prp-generator.ts  # Type checking
npx tsc --noEmit src/cli/index.ts             # Type checking

# Lint new files
npm run lint -- src/utils/token-counter.ts
npm run lint -- src/utils/code-processor.ts

# Format new files
npm run format -- src/utils/*.ts

# Project-wide validation
npm run lint
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm test -- tests/unit/prp-compression.test.ts
npm test -- tests/unit/agents/prp-generator.test.ts

# Test TokenCounter accuracy
npm test -- --grep "TokenCounter"

# Test CodeProcessor compression ratios
npm test -- --grep "CodeProcessor"

# Test integration with PRPGenerator
npm test -- --grep "PRP compression"

# Full test suite for affected areas
npm test -- tests/unit/

# Coverage validation
npm run test:coverage

# Expected: All tests pass. Check compression ratios are 30-60%.
```

### Level 3: Integration Testing (System Validation)

```bash
# Generate PRP with compression
prd PRD.md --prp-compression=standard --scope P3.M3.T2.S2

# Check PRP file was created and is smaller
ls -lh plan/003_b3d3efdaf0ed/prps/P3M3T2S2.md

# Verify compression metrics in cache
cat plan/003_b3d3efdaf0ed/prps/.cache/P3M3T2S2.json | jq '.compressionRatio'

# Test aggressive compression
prd PRD.md --prp-compression=aggressive --scope P3.M3.T2.S2

# Verify file is even smaller
ls -lh plan/003_b3d3efdaf0ed/prps/P3M3T2S2.md

# Test backward compatibility (no compression)
prd PRD.md --no-prp-compression --scope P3.M3.T2.S2

# Verify larger file size
ls -lh plan/003_b3d3efdaf0ed/prps/P3M3T2S2.md

# Test token limit warning
# Create a PRP with very large context
# Verify warning appears in logs

# Expected: Compression works, files are smaller, no breaking changes.
```

### Level 4: Creative & Domain-Specific Validation

````bash
# PRP Compression Validation:

# 1. Compression Ratio Validation
node -e "
const fs = require('fs');
const prp = fs.readFileSync('plan/003_b3d3efdaf0ed/prps/P3M3T2S2.md', 'utf8');
console.log('PRP size:', prp.length, 'chars');
const cache = JSON.parse(fs.readFileSync('plan/003_b3d3efdaf0ed/prps/.cache/P3M3T2S2.json', 'utf8'));
console.log('Compression ratio:', cache.compressionRatio);
console.log('Expected: 0.4-0.7 (30-60% reduction)');
"

# 2. Token Counting Validation
node -e "
const { TokenCounter } = require('./src/utils/token-counter.ts');
const counter = new TokenCounter();
const prp = fs.readFileSync('plan/003_b3d3efdaf0ed/prps/P3M3T2S2.md', 'utf8');
console.log('Tokens:', counter.countTokens(prp));
console.log('Expected: < 3200 (4096 limit with 20% buffer)');
"

# 3. Code Snippet Preservation Test
grep -A 5 '```typescript' plan/003_b3d3efdaf0ed/prps/P3M3T2S2.md
# Verify code is still readable and functional

# 4. File Reference Test
grep 'See.*lines' plan/003_b3d3efdaf0ed/prps/P3M3T2S2.md
# Verify large files replaced with references

# 5. Template Structure Validation
npm test -- tests/unit/prp-template-validation.test.ts
# Verify all required sections still present

# 6. Cache Statistics Validation
prd PRD.md cache stats
# Verify token usage and compression ratio in stats output

# 7. Performance Testing
time prd PRD.md --prp-compression=standard --scope P3.M3.T2.S2
# Compare with: time prd PRD.md --no-prp-compression --scope P3.M3.T2.S2
# Expected: Faster generation with compression (smaller prompts)

# 8. Backward Compatibility Test
# Load old cache entry (without compression fields)
# Verify it works correctly with ?? defaults

# Expected: All creative validations pass with expected improvements.
````

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] Compression ratio 30-60% achieved (measured in tests)
- [ ] Token reduction 40%+ achieved (measured in integration tests)
- [ ] CLI flag `--prp-compression` working with all 3 modes
- [ ] Token warnings logged when approaching limits
- [ ] Cache metadata includes compression metrics
- [ ] Backward compatibility preserved (old cache entries work)

### Code Quality Validation

- [ ] Follows existing CLI flag patterns (Commander.js syntax)
- [ ] Follows existing cache structure (PRPCacheMetadata)
- [ ] Follows existing test patterns (mocking, assertions)
- [ ] File placement matches desired codebase tree
- [ ] Dependencies properly managed (tiktoken added, esbuild used)
- [ ] Error handling follows existing patterns (PRPGenerationError)

### Performance Validation

- [ ] PRP generation time reduced by 20-30% (smaller prompts)
- [ ] Cache size reduced by 40-60% (compressed markdown)
- [ ] Token usage reduced by 40%+ (measured in tests)
- [ ] No performance regression in --no-prp-compression mode

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Token compression is logged with metrics
- [ ] CLI help text includes compression flag
- [ ] README updated with compression usage examples
- [ ] Migration guide for existing cache (backward compatibility)

---

## Anti-Patterns to Avoid

- ❌ Don't break backward compatibility with existing cache entries
- ❌ Don't remove required PRP template sections during compression
- ❌ Don't compress validation commands (must remain executable)
- ❌ Don't use sync operations for file I/O in async context
- ❌ Don't hardcode token limits (use PERSONA_TOKEN_LIMITS constant)
- ❌ Don't skip token counting (essential for metrics)
- ❌ Don't compress user-facing descriptions (only technical context)
- ❌ Don't ignore compression ratio < 0.3 (indicates over-compression)
- ❌ Don't forget to handle ???operator for old cache entries
- ❌ Don't use aggressive compression by default (standard is safer)

---

## Success Metrics & Confidence Score

**Confidence Score: 9/10**

**Validation**: This PRP provides comprehensive context including:

- Complete current implementation analysis (PRPGenerator, CLI, Cache)
- External research documentation with specific URLs
- Code compression utility patterns (esbuild, tiktoken)
- Test patterns for validation
- Detailed implementation tasks with dependencies
- All integration points and gotchas documented

**Expected Outcomes**:

- 50% reduction in PRP file size
- 40% reduction in agent token usage
- $90/month cost savings at scale
- 20-30% faster PRP generation
- Zero breaking changes to existing functionality

**Risk Mitigation**:

- Backward compatibility preserved with optional fields
- Three compression levels allow gradual rollout
- Comprehensive test coverage ensures correctness
- CLI flag allows disabling if issues arise

---

## Research Artifacts

Research stored in: `plan/003_b3d3efdaf0ed/P3M3T2S2/research/`

1. **codebase-analysis.md**: Deep analysis of PRP generation, CLI patterns, cache architecture
2. **external-research.md**: Token optimization techniques, compression libraries, best practices
3. **implementation-patterns.md**: Code samples for TokenCounter, CodeProcessor, CLI integration
4. **test-strategies.md**: Test patterns for compression validation, backward compatibility

---

**PRP Version**: 1.0
**Generated**: 2025-01-25
**Compression**: Standard (30-50% size reduction expected)
