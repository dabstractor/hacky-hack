# Codebase Analysis: PRP Generation & Compression Opportunities

## Executive Summary

This document summarizes the deep analysis of the hacky-hack codebase to identify PRP compression opportunities and implementation patterns.

## 1. PRP Generator Implementation (`src/agents/prp-generator.ts`)

### Current Architecture

**File Location**: `/home/dustin/projects/hacky-hack/src/agents/prp-generator.ts` (570 lines)

**Key Classes**:
- `PRPGenerator`: Main orchestrator for PRP generation
- `PRPGenerationError`: Custom error for generation failures
- `PRPFileError`: Custom error for file write failures

**Cache Structure**:
```
{sessionPath}/prps/{taskId}.md          # Markdown PRP file
{sessionPath}/prps/.cache/{taskId}.json # Cache metadata
```

**Cache Metadata Interface**:
```typescript
export interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;      // SHA-256 of task inputs
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;
}
```

### Compression Opportunities

| Location | Current Behavior | Compression Opportunity |
|----------|-----------------|------------------------|
| `#formatPRPAsMarkdown()` | Full markdown with all content | Compress code blocks, truncate long sections |
| `createPRPBlueprintPrompt()` | Full parent hierarchy injected | Limit to 2 levels, 100 chars each |
| Cache metadata | No size tracking | Add originalSize, compressedSize, compressionRatio |

### Key Methods

1. **`generate()`** (lines 409-462): Main generation flow
   - Cache checking with TTL validation
   - Researcher Agent execution with retry
   - Schema validation
   - File writing
   - Cache metadata saving

2. **`#writePRPToFile()`** (lines 478-500): File persistence
   - Creates prps directory
   - Formats as markdown
   - Writes with 0o644 permissions

3. **`#formatPRPAsMarkdown()`** (lines 515-565): Markdown formatting
   - Implementation steps: numbered list
   - Validation gates: 4 levels with commands
   - Success criteria: checkbox list
   - References: bullet list

### Integration Points

**Parameter Flow**:
```
CLI → PRPPipeline → PRPRuntime → PRPGenerator
```

**Current Parameters**:
- `sessionManager: SessionManager`
- `noCache: boolean`
- `cacheTtlMs: number`

**New Parameter Needed**:
- `prpCompression: PRPCompressionLevel` ('off' | 'standard' | 'aggressive')

---

## 2. CLI Implementation Patterns (`src/cli/index.ts`)

### Current Architecture

**File Location**: `/home/dustin/projects/hacky-hack/src/cli/index.ts` (400+ lines)

**Library**: Commander.js for argument parsing

### Boolean Flag Pattern

```typescript
// Example from existing code
.option('--no-cache', 'Bypass cache and regenerate all PRPs', false)
.option('--verbose', 'Enable debug logging', false)
.option('--dry-run', 'Show plan without executing', false)
```

### Value Flag Pattern

```typescript
// Example from existing code
.option('--cache-ttl <duration>', 'PRP cache time-to-live', '24h')
.option('--parallelism <n>', 'Max concurrent subtasks (1-10)', '2')
```

### Choice Flag Pattern

```typescript
.addOption(program.createOption('--mode <mode>', 'Execution mode')
  .choices(['normal', 'bug-hunt', 'validate'])
  .default('normal'))
```

### Compression Flag Implementation

**Required Changes**:

1. **Add to CLIArgs interface**:
```typescript
export interface CLIArgs {
  // ... existing fields
  prpCompression?: string;  // 'off' | 'standard' | 'aggressive'
}
```

2. **Add to ValidatedCLIArgs interface**:
```typescript
export interface ValidatedCLIArgs extends Omit<CLIArgs, 'prpCompression'> {
  prpCompression: 'off' | 'standard' | 'aggressive';  // Validated
}
```

3. **Add Commander.js option**:
```typescript
.option(
  '--prp-compression <level>',
  'PRP compression level (off|standard|aggressive)',
  'standard'
)
```

4. **Add validation function**:
```typescript
function validateCompressionLevel(level: string): 'off' | 'standard' | 'aggressive' {
  const valid = ['off', 'standard', 'aggressive'];
  if (!valid.includes(level)) {
    logger.error(`Invalid compression level: ${level}`);
    process.exit(1);
  }
  return level as 'off' | 'standard' | 'aggressive';
}
```

---

## 3. Cache Architecture Analysis

### Current Cache System

**Location**: `src/utils/cache-manager.ts`

**Features**:
- TTL-based expiration
- SHA-256 hash-based change detection
- Hit/miss metrics tracking
- Atomic file operations

**Cache Statistics Interface**:
```typescript
interface CacheStatistics {
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
}
```

### Compression Integration

**New Statistics Fields**:
```typescript
interface CacheStatistics {
  // ... existing fields
  totalTokens?: number;           // Total tokens across all PRPs
  averageCompressionRatio?: number;  // Average compression ratio
  compressedEntries?: number;     // Count of compressed PRPs
}
```

### Cache Metadata Extension

**Current PRPCacheMetadata** (from `src/core/models.ts`):
```typescript
export interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;
}
```

**Extended Version** (add all fields as optional for backward compatibility):
```typescript
export interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
  readonly prp: PRPDocument;

  // NEW: Compression metrics (all optional)
  readonly compressionLevel?: 'off' | 'standard' | 'aggressive';
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly compressionRatio?: number;
  readonly originalSize?: number;
  readonly compressedSize?: number;
}
```

**Critical Pattern**: Use `??` operator when reading old cache entries:
```typescript
const compressionRatio = metadata.compressionRatio ?? 1.0;
```

---

## 4. Token Limits in System

### Persona-Specific Token Limits

**Location**: `src/agents/agent-factory.ts`

```typescript
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,  // Complex PRD analysis and task breakdown
  researcher: 4096, // PRP generation - PRIMARY TARGET
  coder: 4096,      // PRP execution
  qa: 4096,        // Bug hunting
} as const;
```

### Token Limit Warnings

**Current**: No warnings when approaching limits

**Proposed**: Log warning at 80% of limit
```typescript
const tokenLimit = PERSONA_TOKEN_LIMITS.researcher;
if (currentTokens > tokenLimit * 0.8) {
  logger.warn(
    { taskId, currentTokens, tokenLimit },
    'PRP approaching token limit'
  );
}
```

---

## 5. Test Patterns Analysis

### PRP Generator Tests

**Location**: `tests/unit/agents/prp-generator.test.ts`

**Test Structure**:
```typescript
describe('PRPGenerator', () => {
  let mockSessionManager: SessionManager;
  let mockAgent: Agent;

  beforeEach(() => {
    mockSessionManager = createMockSessionManager();
    mockAgent = { prompt: vi.fn() };
  });

  describe('generate()', () => {
    it('should generate PRP on cache miss', async () => {
      // Test implementation
    });

    it('should return cached PRP on cache hit', async () => {
      // Test implementation
    });
  });
});
```

### New Test Cases Needed

1. **Compression Mode Tests**:
   - Test 'off' mode (no compression)
   - Test 'standard' mode (30-50% reduction)
   - Test 'aggressive' mode (50-70% reduction)

2. **Backward Compatibility Tests**:
   - Test reading old cache entries (without compression fields)
   - Test default values when fields missing

3. **Token Counting Tests**:
   - Test accurate token counting
   - Test token limit warnings

4. **Compression Ratio Tests**:
   - Test minimum 30% reduction for standard mode
   - Test maximum 70% reduction for aggressive mode

---

## 6. PRP Blueprint Prompt Analysis

### Current Prompt Structure

**Location**: `src/agents/prompts/prp-blueprint-prompt.ts`

**Key Sections**:
1. Header and Mission
2. Research Process
3. PRP Generation Process
4. Quality Gates
5. PRP Template (embedded)

### Large Content Blocks

1. **Implementation Tasks Template** (6 ordered tasks)
2. **Validation Loop Templates** (4 levels with 25+ bash commands)
3. **Documentation & References YAML**
4. **Implementation Patterns Code Blocks**

### Compression Opportunities

| Section | Current Size | Compression Strategy |
|---------|-------------|---------------------|
| Validation Commands | ~200 chars | Replace with command templates |
| Implementation Tasks | ~150 chars | Create task generator |
| Documentation YAML | ~100 chars | Simplify to key-value pairs |
| Parent Context | Variable | Limit to 2 levels, 100 chars each |

---

## 7. File Reference Patterns

### Current Patterns

The codebase uses several patterns for file references:

1. **Direct File References with Line Numbers**:
   - Pattern: `"see src/core/models.ts lines 50-100"`
   - Used in: Task descriptions and documentation

2. **Path-Based References**:
   - Pattern: `src/core/models.ts`
   - Used in: Error messages, logging

### File Reading Utilities

**Location**: `src/utils/errors/stack-trace-formatter.ts`

```typescript
// Extracts specific line ranges
extractLineRange(content: string, startLine: number, endLine: number): string {
  const lines = content.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}
```

### Compression Strategy

Replace large inline content (>500 chars) with file references:

```typescript
// Before (large inline content)
```file:src/services/database-service.ts
[500+ lines of code]
```

// After (file reference)
See src/services/database-service.ts (1-500)
```

---

## 8. Existing Dependencies

### esbuild (Already Available)

**Location**: `devDependencies` in `package.json`

**Usage for Code Minification**:
```typescript
import { transformSync } from 'esbuild';

const result = transformSync(code, {
  minifyIdentifiers: true,
  minifyWhitespace: true,
  minifySyntax: false,  // Preserve syntax for readability
});

console.log(result.code);
```

### New Dependencies Needed

**tiktoken** for token counting:
```bash
npm install tiktoken
npm install --save-dev @types/tiktoken
```

**Usage**:
```typescript
import { encoding_for_model } from 'tiktoken';

const encoding = encoding_for_model('gpt-4');
const tokens = encoding.encode(text);
console.log(tokens.length);
```

---

## 9. Configuration Flow

### Current Flow

```
CLI Args → ValidatedCLIArgs → PRPPipeline → PRPRuntime → PRPGenerator
```

### New Flow with Compression

```
CLI Args (prpCompression)
    ↓
ValidatedCLIArgs (prpCompression: 'off' | 'standard' | 'aggressive')
    ↓
PRPPipeline (constructor parameter)
    ↓
PRPRuntime (constructor parameter)
    ↓
PRPGenerator (constructor parameter)
    ↓
PRP Generation with compression
```

### Required Constructor Changes

**PRPPipeline** (`src/workflows/prp-pipeline.ts`):
```typescript
constructor(
  // ... existing parameters
  prpCompression: PRPCompressionLevel = 'standard'
) {
  this.#prpCompression = prpCompression;
  // Pass to PRPRuntime
}
```

**PRPRuntime** (`src/agents/prp-runtime.ts`):
```typescript
constructor(
  orchestrator: TaskOrchestrator,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  noCache: boolean = false,
  prpCompression: PRPCompressionLevel = 'standard'
) {
  this.#prpCompression = prpCompression;
  // Pass to PRPGenerator
}
```

**PRPGenerator** (`src/agents/prp-generator.ts`):
```typescript
constructor(
  sessionManager: SessionManager,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard'
) {
  this.#compression = prpCompression;
  // Use in generate() method
}
```

---

## 10. Key Implementation Gotchas

### 1. Backward Compatibility

**Issue**: Old cache entries won't have compression fields

**Solution**: Use optional fields with `??` defaults
```typescript
const compressionRatio = metadata.compressionRatio ?? 1.0;
```

### 2. Token Counting Accuracy

**Issue**: tiktoken uses GPT-4 tokenizer, not GLM-4

**Solution**: Use as approximation, Groundswell API returns actual counts
```typescript
// tiktoken for estimation
const estimatedTokens = tokenCounter.countTokens(text);

// Actual from Groundswell API
const actualTokens = response.usage?.input_tokens ?? estimatedTokens;
```

### 3. Template Structure Preservation

**Issue**: Compression must not break PRP template validation

**Solution**: Only compress content within sections, preserve section headers
```typescript
// Compress only section content, not headers
const compressed = context.replace(
  /##\s+\n([\s\S]*?)(?=\n##|\n*$)/g,
  (_, content) => compressContent(content)
);
```

### 4. Validation Commands

**Issue**: Validation commands must remain executable

**Solution**: Don't compress validation commands, only compress context sections
```typescript
// Don't compress this
validationGates: [
  { level: 1, command: 'npm run lint' }
]

// Compress this instead
context: '## Context\n[large compressed content]'
```

---

## Summary

The codebase analysis reveals:

1. **Well-structured cache system** ready for compression metrics
2. **Clear CLI patterns** for adding the `--prp-compression` flag
3. **Established test patterns** for comprehensive validation
4. **Existing esbuild dependency** for code minification
5. **Clear configuration flow** from CLI to PRPGenerator
6. **Backward compatibility requirements** for old cache entries

**Confidence in Implementation**: 9/10

All necessary patterns and infrastructure are in place. The main risks are:
- Ensuring backward compatibility with old cache
- Maintaining PRP template structure during compression
- Accurate token counting across different models

These are mitigated by:
- Optional fields with `??` defaults
- Comprehensive test coverage
- Using tiktoken as approximation, Groundswell for actual counts
