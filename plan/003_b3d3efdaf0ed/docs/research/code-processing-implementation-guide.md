# Code Processing Implementation Guide

Complete guide to implementing and using code minification, compression, and normalization utilities in your TypeScript project.

---

## Quick Start

### Installation

You already have `esbuild` in your project. For advanced features, install additional dependencies:

```bash
npm install terser
```

### Basic Usage

```typescript
import { CodeProcessor, processForAI, minifyCode } from './utils/code-processor';

// Optimize code for AI prompts
const aiOptimized = await processForAI(code, 4000);

// Minify for production
const minified = await minifyCode(code);

// Advanced processing
const processor = new CodeProcessor();
const result = await processor.process(code, {
  forAI: true,
  maxTokens: 4000,
  removeComments: true,
  removeBlankLines: true
});
```

### CLI Usage

```bash
# Process code for AI prompts
tsx src/commands/process-code.command.ts input.ts --method ai

# Minify code
tsx src/commands/process-code.command.ts input.ts --method minify -o output.js

# Extract lines 10-20
tsx src/commands/process-code.command.ts input.ts --method extract-lines --extract-lines 10-20

# Extract function by name
tsx src/commands/process-code.command.ts input.ts --method extract-function --extract-function myFunction

# Show statistics
tsx src/commands/process-code.command.ts input.ts --stats
```

---

## API Reference

### CodeProcessor Class

#### `process(code: string, options: ProcessingOptions): Promise<string>`

Main method for processing code with various options.

**Options:**

```typescript
interface ProcessingOptions {
  // Minification options
  minify?: boolean;              // Enable full minification
  removeComments?: boolean;      // Remove comments
  removeBlankLines?: boolean;    // Remove blank lines
  mangle?: boolean;              // Mangle variable names

  // Extraction options
  extractLines?: { start: number; end: number };  // Extract line range
  extractFunction?: string;      // Extract function by name
  extractClass?: string;         // Extract class by name

  // AI optimization
  forAI?: boolean;               // Optimize for AI prompts
  maxTokens?: number;            // Maximum token limit

  // Output format
  format?: 'minified' | 'readable' | 'compressed';
}
```

**Examples:**

```typescript
// Remove comments only
const result = await processor.process(code, {
  removeComments: true
});

// Extract function and minify
const result = await processor.process(code, {
  extractFunction: 'myFunction',
  minify: true,
  mangle: false
});

// Optimize for AI with token limit
const result = await processor.process(code, {
  forAI: true,
  maxTokens: 2000
});
```

#### `removeComments(code: string): string`

Remove all comment types from code.

```typescript
const noComments = processor.removeComments(code);
```

#### `removeBlankLines(code: string): string`

Remove blank lines from code.

```typescript
const noBlanks = processor.removeBlankLines(code);
```

#### `compressWhitespace(code: string): string`

Compress whitespace to minimize size.

```typescript
const compressed = processor.compressWhitespace(code);
```

#### `extractLineRange(code: string, range: { start: number; end: number }): string`

Extract a range of lines (1-indexed).

```typescript
const lines = processor.extractLineRange(code, { start: 10, end: 20 });
```

#### `extractFunction(code: string, functionName: string): string`

Extract a function by name.

```typescript
const func = processor.extractFunction(code, 'myFunction');
```

#### `extractClass(code: string, className: string): string`

Extract a class by name.

```typescript
const cls = processor.extractClass(code, 'MyClass');
```

#### `countTokens(code: string): number`

Count approximate tokens (rough estimate: 1 token ≈ 4 characters).

```typescript
const tokens = processor.countTokens(code);
```

#### `truncateToTokens(code: string, maxTokens: number): string`

Truncate code to fit within token limit.

```typescript
const truncated = processor.truncateToTokens(code, 4000);
```

#### `extractImports(code: string): string[]`

Extract all import statements.

```typescript
const imports = processor.extractImports(code);
```

#### `normalizeCode(code: string): string`

Normalize code formatting.

```typescript
const normalized = processor.normalizeCode(code);
```

---

### Convenience Functions

#### `processForAI(code: string, maxTokens?: number): Promise<string>`

Optimize code for AI prompts.

```typescript
const aiReady = await processForAI(code, 4000);
```

#### `minifyCode(code: string): Promise<string>`

Minify code for production.

```typescript
const minified = await minifyCode(code);
```

---

### Utility Functions

```typescript
import { codeUtils } from './utils/code-processor';

// Remove comments
const noComments = codeUtils.removeComments(code);

// Remove blank lines
const noBlanks = codeUtils.removeBlankLines(code);

// Compress whitespace
const compressed = codeUtils.compressWhitespace(code);

// Extract lines
const lines = codeUtils.extractLines(code, 1, 10);

// Count lines
const lineCount = codeUtils.countLines(code);

// Count tokens
const tokens = codeUtils.countTokens(code);

// Check if too long
const tooLong = codeUtils.isTooLong(code, 4000);

// Truncate
const truncated = codeUtils.truncate(code, 1000);
```

---

## Common Use Cases

### 1. Preparing Code for AI Prompts

```typescript
import { processForAI } from './utils/code-processor';

const code = `
  // This is a large file
  function complexFunction() {
    // Lots of code
    return result;
  }
`;

// Optimize for AI with token limit
const aiReady = await processForAI(code, 4000);

console.log(aiReady);
// Output: Code without comments, blank lines, and truncated if needed
```

### 2. Extracting Relevant Code

```typescript
import { CodeProcessor } from './utils/code-processor';

const processor = new CodeProcessor();

// Extract specific function
const functionCode = processor.extractFunction(code, 'myFunction');

// Extract specific class
const classCode = processor.extractClass(code, 'MyClass');

// Extract line range
const lines = processor.extractLineRange(code, { start: 10, end: 50 });
```

### 3. Minifying for Production

```typescript
import { minifyCode } from './utils/code-processor';

const productionReady = await minifyCode(sourceCode);
```

### 4. Normalizing Code Format

```typescript
import { CodeProcessor } from './utils/code-processor';

const processor = new CodeProcessor();

const normalized = processor.normalizeCode(messyCode);
```

### 5. Token Management

```typescript
import { codeUtils } from './utils/code-processor';

// Count tokens
const tokens = codeUtils.countTokens(code);

// Check if fits in context
if (codeUtils.isTooLong(code, 4000)) {
  // Truncate to fit
  const truncated = codeUtils.truncate(code, 4000 * 4);
}
```

---

## Integration Patterns

### Pattern 1: AI Prompt Optimization

```typescript
async function prepareForAI(code: string, context: string): Promise<string> {
  const processor = new CodeProcessor();

  // Optimize main code
  const optimizedCode = await processor.process(code, {
    forAI: true,
    maxTokens: 3000,
    removeComments: true,
    removeBlankLines: true
  });

  // Combine with context
  return `${context}\n\n\`\`\`typescript\n${optimizedCode}\n\`\`\``;
}
```

### Pattern 2: Smart Code Extraction

```typescript
async function extractRelevantCode(
  fullCode: string,
  focusFunction: string,
  includeContext: boolean = true
): Promise<string> {
  const processor = new CodeProcessor();

  // Extract function
  let code = processor.extractFunction(fullCode, focusFunction);

  // Add context if requested
  if (includeContext) {
    const imports = processor.extractImports(fullCode);
    code = [...imports, '', code].join('\n');
  }

  return code;
}
```

### Pattern 3: Multi-Stage Processing

```typescript
async function processCodePipeline(code: string): Promise<string> {
  const processor = new CodeProcessor();

  // Stage 1: Extract relevant sections
  code = processor.extractFunction(code, 'mainFunction');

  // Stage 2: Remove noise
  code = processor.removeComments(code);
  code = processor.removeBlankLines(code);

  // Stage 3: Optimize for target
  if (processor.countTokens(code) > 4000) {
    code = processor.truncateToTokens(code, 4000);
  }

  return code;
}
```

### Pattern 4: Batch Processing

```typescript
import { glob } from 'fast-glob';

async function batchProcessFiles(pattern: string): Promise<void> {
  const files = await glob(pattern);
  const processor = new CodeProcessor();

  for (const file of files) {
    const code = readFileSync(file, 'utf-8');
    const processed = await processor.process(code, {
      forAI: true,
      maxTokens: 4000
    });

    // Save processed version
    const outputPath = file.replace('.ts', '.processed.ts');
    writeFileSync(outputPath, processed, 'utf-8');
  }
}
```

---

## Testing

Run the test suite:

```bash
npm test -- code-processor.test.ts
```

Run tests with coverage:

```bash
npm run test:coverage -- code-processor.test.ts
```

---

## Performance Considerations

### esbuild vs Terser

- **esbuild**: Faster (10-100x), good for development
- **Terser**: More optimization options, better for production

### Memory Usage

For large files:

```typescript
// Process in chunks
async function processLargeFile(code: string): Promise<string> {
  const chunks = code.split('\n\n'); // Split by blank lines
  const processor = new CodeProcessor();

  const processed = [];
  for (const chunk of chunks) {
    const result = await processor.process(chunk, {
      removeComments: true,
      removeBlankLines: true
    });
    processed.push(result);
  }

  return processed.join('\n\n');
}
```

### Caching

Cache processed results:

```typescript
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';

const cacheDir = '.cache/code-processor';

function getCacheKey(code: string, options: any): string {
  return createHash('sha256')
    .update(code)
    .update(JSON.stringify(options))
    .digest('hex');
}

async function cachedProcess(
  code: string,
  options: any
): Promise<string> {
  const key = getCacheKey(code, options);
  const cachePath = `${cacheDir}/${key}`;

  // Check cache
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, 'utf-8');
  }

  // Process
  const processor = new CodeProcessor();
  const result = await processor.process(code, options);

  // Cache result
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cachePath, result, 'utf-8');

  return result;
}
```

---

## Troubleshooting

### Issue: esbuild transform fails

**Solution**: The code might have syntax errors. Check your TypeScript syntax first.

```typescript
try {
  const result = await esbuild.transform(code, { minify: true });
} catch (error) {
  console.error('Syntax error in code:', error);
}
```

### Issue: Function extraction doesn't work

**Solution**: Check the function name and ensure it matches exactly.

```typescript
// Case-sensitive
processor.extractFunction(code, 'myFunction'); // ✓
processor.extractFunction(code, 'MyFunction'); // ✗ (if function is lowercase)
```

### Issue: Token count is inaccurate

**Solution**: Token count is an approximation. For accurate counts, use a dedicated tokenizer.

```typescript
// Rough estimate (used here)
const tokens = Math.ceil(code.length / 4);

// More accurate (requires additional library)
import { encode } from 'gpt-tokenizer';
const accurateTokens = encode(code).length;
```

---

## Best Practices

1. **Always remove comments for AI prompts** - They add noise without value
2. **Keep type annotations when optimizing for AI** - They help understanding
3. **Don't mangle when processing for AI** - Readability matters more than size
4. **Use line-based extraction for focused context** - Better than processing entire files
5. **Set reasonable token limits** - Leave room for prompt and response
6. **Cache processed results** - Save processing time for repeated operations
7. **Validate processed code** - Ensure it still compiles/syntax-checks

---

## Examples

### Example 1: Complete AI Prompt Preparation

```typescript
import { CodeProcessor } from './utils/code-processor';

async function prepareAIPrompt(
  filePath: string,
  focusFunction: string
): Promise<string> {
  const code = readFileSync(filePath, 'utf-8');
  const processor = new CodeProcessor();

  // Extract function
  const functionCode = processor.extractFunction(code, focusFunction);

  // Extract relevant imports
  const allImports = processor.extractImports(code);
  const usedImports = filterUsedImports(allImports, functionCode);

  // Build optimized snippet
  let snippet = [...usedImports, '', functionCode].join('\n');

  // Optimize for AI
  snippet = await processor.process(snippet, {
    forAI: true,
    maxTokens: 3000
  });

  // Count tokens
  const tokens = processor.countTokens(snippet);

  return `I have ${tokens} tokens of code. Please help me understand:\n\n\`\`\`typescript\n${snippet}\n\`\`\``;
}

function filterUsedImports(imports: string[], code: string): string[] {
  return imports.filter(imp => {
    const importNames = imp.match(/\{([^}]+)\}/)?.[1] || '';
    const names = importNames.split(',').map(s => s.trim());
    return names.some(name => code.includes(name));
  });
}
```

### Example 2: Code Review Automation

```typescript
import { CodeProcessor } from './utils/code-processor';

async function prepareForReview(code: string): Promise<{
  summary: string;
  functions: string[];
  classes: string[];
}> {
  const processor = new CodeProcessor();

  // Extract code blocks
  const blocks = processor.extractCodeBlocks(code);

  // Categorize
  const functions = blocks
    .filter(b => b.code.includes('function'))
    .map(b => b.code);

  const classes = blocks
    .filter(b => b.code.includes('class'))
    .map(b => b.code);

  // Generate summary
  const stats = {
    lines: codeUtils.countLines(code),
    functions: functions.length,
    classes: classes.length,
    tokens: processor.countTokens(code)
  };

  const summary = `Code Review Summary:
- Lines: ${stats.lines}
- Functions: ${stats.functions}
- Classes: ${stats.classes}
- Estimated tokens: ${stats.tokens}
`;

  return {
    summary,
    functions,
    classes
  };
}
```

---

## Additional Resources

- [Terser Documentation](https://github.com/terser/terser)
- [esbuild Documentation](https://esbuild.github.io/)
- [SWC Documentation](https://swc.rs/)
- [Vercel ncc](https://github.com/vercel/ncc)

---

## License

MIT

---

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
