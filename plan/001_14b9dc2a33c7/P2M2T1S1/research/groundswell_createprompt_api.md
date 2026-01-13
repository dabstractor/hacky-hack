# Groundswell createPrompt API Research

## Source

- **File**: `plan/001_14b9dc2a33c7/architecture/groundswell_api.md`

## API Signature

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';

const prompt = createPrompt({
  user: string;           // User prompt template
  system?: string;        // System prompt
  data?: object;          // Data to inject into template
  responseFormat?: ZodSchema; // Schema for structured output
  enableReflection?: boolean;  // Enable reflection for this prompt
});
```

## Key Features

### 1. Type-Safe Structured Output

The `responseFormat` option accepts a Zod schema for structured LLM output:

```typescript
const analysisPrompt = createPrompt({
  user: 'Analyze this codebase',
  responseFormat: z.object({
    vulnerabilities: z.array(
      z.object({
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        description: z.string(),
        location: z.string(),
      })
    ),
    score: z.number().min(0).max(100),
  }),
});

// Result is fully typed based on the schema
const result = await agent.prompt(analysisPrompt);
```

### 2. Reflection for Complex Operations

Reflection is a multi-level error recovery system:

1. Automatic retry of failed LLM calls
2. Error analysis
3. Corrective action
4. Verification

Enable at agent level or prompt level:

```typescript
enableReflection: true;
```

### 3. Data Injection

The `data` object is injected into the user prompt template:

```typescript
const prompt = createPrompt({
  user: 'Analyze {{codebasePath}} for {{focusAreas}}',
  data: {
    codebasePath: './src',
    focusAreas: ['auth', 'validation'],
  },
});
```

## Import Pattern

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';
```

## Gotchas

- The prompt result is fully typed based on the Zod schema
- Use `z.lazy()` for recursive schemas
- Reflection adds latency but improves reliability for complex tasks
