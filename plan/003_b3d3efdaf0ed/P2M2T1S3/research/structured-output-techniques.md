# Structured Output and Schema-Based Prompting Techniques for LLMs

**Research Date**: 2026-01-23
**Focus**: JSON Schema Validation, Groundswell Framework, Few-Shot Examples, Error Recovery, Type Safety

---

## Table of Contents

1. [JSON Schema Validation Techniques](#1-json-schema-validation-techniques)
2. [Groundswell Framework Best Practices](#2-groundswell-framework-best-practices)
3. [Few-Shot Examples for Complex Output Formats](#3-few-shot-examples-for-complex-output-formats)
4. [Error Recovery with Reflection](#4-error-recovery-with-reflection)
5. [Type Safety in LLM Outputs](#5-type-safety-in-llm-outputs)
6. [References and Documentation Links](#references-and-documentation-links)

---

## 1. JSON Schema Validation Techniques

### 1.1 Zod Schema Definition

**Source**: `node_modules/zod/package.json` (v3.25.76)
**Docs**: https://zod.dev

Zod is a TypeScript-first schema validation library that enables:
- Static type inference
- Runtime validation
- Integration with LLM structured output

#### Basic Schema Patterns

```typescript
import { z } from 'zod';

// Simple object schema
const SimpleSchema = z.object({
  answer: z.string(),
  confidence: z.number(),
});

// With constraints
const StrictSchema = z.object({
  answer: z.string().min(10, 'Answer must be at least 10 characters'),
  confidence: z.number().min(0.8, 'Confidence must be at least 0.8'),
  reasoning: z.string().min(20, 'Reasoning must be detailed'),
});

// Enum types for controlled vocabulary
const CategorySchema = z.object({
  category: z.enum(['bug', 'feature', 'improvement']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

// Nested objects
const AnalysisSchema = z.object({
  analysis: z.object({
    issues: z.array(z.object({
      line: z.number(),
      message: z.string(),
      severity: z.enum(['error', 'warning', 'info']),
    })),
    summary: z.string(),
  }),
});
```

#### Recursive Schemas with `z.lazy()`

**Source**: `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 522-535)

```typescript
// For hierarchical data structures (task trees, ASTs, etc.)
const MilestoneSchema: z.ZodType<Milestone> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+$/, 'Invalid milestone ID format'),
    type: z.literal('Milestone'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1),
    tasks: z.array(z.lazy(() => TaskSchema)),  // Recursive reference
  })
);
```

#### Custom Validation with `superRefine()`

**Source**: `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 68-112)

```typescript
const ContextScopeSchema: z.ZodType<string> = z
  .string()
  .min(1, 'Context scope is required')
  .superRefine((value, ctx) => {
    // Check for CONTRACT DEFINITION prefix
    const prefix = 'CONTRACT DEFINITION:\n';
    if (!value.startsWith(prefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'context_scope must start with "CONTRACT DEFINITION:" followed by a newline',
      });
      return;
    }

    // Check for all 4 numbered sections in order
    const requiredSections = [
      { num: 1, name: 'RESEARCH NOTE', pattern: /1\.\s*RESEARCH\sNOTE:/m },
      { num: 2, name: 'INPUT', pattern: /2\.\s*INPUT:/m },
      { num: 3, name: 'LOGIC', pattern: /3\.\s*LOGIC:/m },
      { num: 4, name: 'OUTPUT', pattern: /4\.\s*OUTPUT:/m },
    ];

    let searchStartIndex = 0;
    for (const section of requiredSections) {
      const match = section.pattern.exec(content);
      if (!match || match.index < searchStartIndex) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing or incorrect section: "${section.num}. ${section.name}:"`,
        });
        return;
      }
      searchStartIndex = match.index + match[0].length;
    }
  });
```

### 1.2 Type Inference from Schemas

```typescript
// Define schema first
const LLMSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()),
});

// Infer TypeScript type
type LLMResponse = z.infer<typeof LLMSchema>;
// Result: { title: string; content: string; tags: string[] }

// Use with Groundswell
const prompt = createPrompt({
  user: 'Generate a summary',
  responseFormat: LLMSchema,  // Type-safe output
});

const result = await agent.prompt(prompt);
// result is typed as LLMResponse
```

### 1.3 Validation Error Handling

**Source**: `/home/dustin/projects/groundswell/docs/prompt.md` (lines 231-275)

```typescript
// Throwing validation
try {
  const validated = prompt.validateResponse(parsed);
  // validated is T
} catch (error) {
  // error is ZodError with detailed validation info
  console.log(error.issues);
}

// Non-throwing validation
const result = prompt.safeValidateResponse(parsed);

if (result.success) {
  console.log(result.data);  // Type: T
} else {
  console.log(result.error.issues);  // Validation errors
}

// Detailed error reporting
if (!result.success) {
  for (const issue of result.error.issues) {
    console.log(`Path: ${issue.path.join('.')}`);
    console.log(`Message: ${issue.message}`);
    console.log(`Code: ${issue.code}`);
  }
}
```

---

## 2. Groundswell Framework Best Practices

### 2.1 Creating Prompts with Structured Output

**Source**: `/home/dustin/projects/groundswell/docs/prompt.md`
**Local**: `/home/dustin/projects/groundswell/README.md`

#### Basic createPrompt() Usage

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';

const prompt = createPrompt({
  user: 'Analyze this code for bugs',
  data: { code: 'function foo() { return 42; }' },
  responseFormat: z.object({
    bugs: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high']),
  }),
});

// Result is fully typed
const result = await agent.prompt(prompt);
// Type: { bugs: string[]; severity: 'low' | 'medium' | 'high' }
```

#### Prompt Configuration Interface

**Source**: `/home/dustin/projects/groundswell/docs/prompt.md` (lines 32-47)

```typescript
interface PromptConfig<T> {
  user: string;                           // Required: user message
  data?: Record<string, unknown>;         // Optional: structured data
  responseFormat: z.ZodType<T>;           // Required: response schema
  system?: string;                        // Optional: system prompt override
  tools?: Tool[];                         // Optional: tools override
  mcps?: MCPServer[];                     // Optional: MCPs override
  skills?: Skill[];                       // Optional: skills override
  hooks?: AgentHooks;                     // Optional: hooks override
  enableReflection?: boolean;             // Optional: enable reflection
}
```

### 2.2 Data Injection with XML-like Formatting

**Source**: `/home/dustin/projects/groundswell/docs/prompt.md` (lines 135-184)

```typescript
const prompt = createPrompt({
  user: 'Analyze the following code for security issues',
  data: {
    code: 'const x = eval(userInput);',
    language: 'javascript',
  },
  responseFormat: analysisSchema,
});

// Data is formatted as XML-like sections:
// Analyze the following code for security issues
//
// <code>
// "const x = eval(userInput);"
// </code>
//
// <language>
// "javascript"
// </language>
```

#### Immutable Variations with `withData()`

```typescript
const basePrompt = createPrompt({
  user: 'Classify this item',
  responseFormat: classificationSchema,
});

// Create variations
const applePrompt = basePrompt.withData({ item: 'apple' });
const bananaPrompt = basePrompt.withData({ item: 'banana' });

// Data is merged
const prompt = basePrompt
  .withData({ item: 'apple' })
  .withData({ context: 'grocery store' });
// Final data: { item: 'apple', context: 'grocery store' }
```

### 2.3 Configuration Priority Hierarchy

**Source**: `/home/dustin/projects/groundswell/docs/agent.md` (lines 62-86)

Groundswell follows a three-level override hierarchy:

1. **Prompt-level** (highest priority)
2. **Execution-level** (via `PromptOverrides`)
3. **Agent-level** (lowest priority)

```typescript
const agent = createAgent({
  system: 'Default system prompt',  // Agent-level
  model: 'claude-sonnet-4-20250514',
});

const prompt = createPrompt({
  user: 'Hello',
  system: 'Override system prompt',  // Prompt-level (wins)
  responseFormat: z.object({ response: z.string() }),
});

// Or override at execution time
const result = await agent.prompt(prompt, {
  model: 'claude-opus-4-5-20251101',  // Execution-level override
});
```

### 2.4 Real-World Examples from Codebase

**Source**: `/home/dustin/projects/hacky-hack/src/agents/prompts/architect-prompt.ts`

```typescript
export function createArchitectPrompt(prdContent: string): Prompt<Backlog> {
  return createPrompt({
    // The user prompt is the PRD content to analyze
    user: prdContent,

    // The system prompt is the LEAD TECHNICAL ARCHITECT persona
    system: TASK_BREAKDOWN_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against this schema
    responseFormat: BacklogSchema,

    // CRITICAL: Enable reflection for complex task decomposition
    // Reflection provides error recovery for multi-level JSON generation
    enableReflection: true,
  });
}
```

**Source**: `/home/dustin/projects/hacky-hack/src/agents/prompts/prp-blueprint-prompt.ts`

```typescript
export function createPRPBlueprintPrompt(
  task: Task | Subtask,
  backlog: Backlog,
  codebasePath?: string
): Prompt<PRPDocument> {
  return createPrompt({
    // The user prompt contains the task context with placeholders replaced
    user: constructUserPrompt(task, backlog, codebasePath),

    // The system prompt is the PRP_BLUEPRINT_PROMPT (Researcher persona)
    system: PRP_BLUEPRINT_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against this schema
    responseFormat: PRPDocumentSchema,

    // CRITICAL: Enable reflection for complex PRP generation
    // Reflection provides error recovery for structured output
    enableReflection: true,
  });
}
```

---

## 3. Few-Shot Examples for Complex Output Formats

### 3.1 Including Examples in Prompts

Few-shot examples dramatically improve structured output accuracy by showing the LLM exactly what format is expected.

#### Pattern: Include Examples in System Prompt

```typescript
const FEW_SHOT_SYSTEM_PROMPT = `
You are a code analyzer. Output must match the exact format shown below.

Example 1:
Input: "function add(a, b) { return a + b; }"
Output:
{
  "bugs": [],
  "complexity": "low",
  "suggestions": ["Consider adding input validation"]
}

Example 2:
Input: "var x = eval(data);"
Output:
{
  "bugs": ["Use of eval() is a security risk"],
  "complexity": "high",
  "suggestions": ["Use JSON.parse() instead", "Validate input before parsing"]
}

Now analyze the provided code following this exact format.
`;

const prompt = createPrompt({
  user: codeToAnalyze,
  system: FEW_SHOT_SYSTEM_PROMPT,
  responseFormat: z.object({
    bugs: z.array(z.string()),
    complexity: z.enum(['low', 'medium', 'high']),
    suggestions: z.array(z.string()),
  }),
});
```

### 3.2 Data Injection for Examples

Use the `data` property to inject examples without cluttering the system prompt:

```typescript
const prompt = createPrompt({
  user: 'Analyze this code following the examples in <examples>',
  data: {
    code: codeToAnalyze,
    examples: [
      {
        input: 'function add(a, b) { return a + b; }',
        output: {
          bugs: [],
          complexity: 'low',
          suggestions: ['Add input validation']
        }
      },
      {
        input: 'var x = eval(data);',
        output: {
          bugs: ['Use of eval() is a security risk'],
          complexity: 'high',
          suggestions: ['Use JSON.parse() instead']
        }
      }
    ]
  },
  responseFormat: AnalysisSchema,
});
```

### 3.3 Example Best Practices

1. **Show 2-4 examples**: More examples can confuse the LLM, fewer may not demonstrate patterns
2. **Cover edge cases**: Include examples that show handling of empty arrays, null values, etc.
3. **Use realistic data**: Examples should match the complexity of real inputs
4. **Label examples clearly**: Use "Example 1", "Example 2" for clarity
5. **Maintain consistency**: All examples should follow the same format

### 3.4 Example from Groundswell Agent Loops

**Source**: `/home/dustin/projects/groundswell/examples/examples/07-agent-loops.ts` (lines 28-51)

```typescript
const ClassificationSchema = z.object({
  item: z.string(),
  category: z.enum(['fruit', 'vegetable', 'grain', 'protein', 'dairy']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

// In practice, add examples to the system prompt:
const systemPrompt = `
Classify food items into categories.

Example classifications:
- "apple" → { category: "fruit", confidence: 0.95, reasoning: "Grows on trees, sweet taste" }
- "carrot" → { category: "vegetable", confidence: 0.92, reasoning: "Root vegetable, orange color" }
- "chicken" → { category: "protein", confidence: 0.98, reasoning: "Meat source, high protein content" }
`;
```

---

## 4. Error Recovery with Reflection

### 4.1 Understanding Groundswell's Reflection System

**Source**: `/home/dustin/projects/groundswell/docs/agent.md` (lines 128-168)
**Example**: `/home/dustin/projects/groundswell/examples/examples/09-reflection.ts`

Reflection is a multi-level error recovery system that:
1. Analyzes failed LLM responses
2. Identifies validation errors
3. Retries with corrective guidance
4. Improves output reliability

#### Reflection System Prompt

When `enableReflection: true`, Groundswell prepends this to the system prompt:

```
Before answering, reflect on your reasoning step by step.
Consider alternative approaches and potential errors.
Then provide your final answer.
```

### 4.2 Three Levels of Reflection

**Source**: `/home/dustin/projects/groundswell/examples/examples/09-reflection.ts`

#### Level 1: Prompt-Level Reflection

```typescript
const prompt = createPrompt({
  user: 'Complex analysis task',
  enableReflection: true,  // Auto-retry on validation failure
  responseFormat: StrictAnswerSchema,
});

// If schema validation fails, Groundswell:
// 1. Captures validation errors
// 2. Retries with error feedback
// 3. Continues until max attempts reached
```

**Implementation Example** (lines 122-154):

```typescript
@Step({ trackTiming: true, snapshotState: true })
async executeWithSchemaValidation(): Promise<StrictAnswer> {
  // Simulate multiple attempts until schema validates
  for (let attempt = 1; attempt <= 3; attempt++) {
    this.attemptCount = attempt;
    this.logger.info(`Attempt ${attempt}/3`);

    const response = await simulateStrictResponse(attempt);

    // Validate against schema
    const result = StrictAnswerSchema.safeParse(response);

    if (result.success) {
      this.logger.info('Schema validation passed!');
      this.finalResult = result.data;
      return result.data;
    }

    // Collect validation errors
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    this.validationErrors.push(...errors);
    this.logger.warn(`Validation failed: ${errors.join(', ')}`);

    if (attempt < 3) {
      this.logger.info('Reflecting on error and retrying...');
      await sleep(100); // Reflection delay
    }
  }

  throw new Error('Max reflection attempts exceeded - schema validation failed');
}
```

#### Level 2: Agent-Level Reflection

```typescript
const agent = createAgent({
  name: 'ReflectiveAgent',
  enableReflection: true,
});

const result = await agent.reflect(prompt);
```

**Behavior** (lines 175-252):
- Step 1: Initial reasoning
- Step 2: Self-correction (identifies potential bias)
- Step 3: Revised approach with broader perspective

#### Level 3: Workflow-Level Reflection

```typescript
import { executeWithReflection, ReflectionManager } from 'groundswell';

const reflectionManager = new ReflectionManager(
  createReflectionConfig({ enabled: true, maxAttempts: 3 })
);

await executeWithReflection(
  () => unreliableStep(),
  reflectionManager,
  (error, attempt, history) => ({
    level: 'workflow',
    failedNode: mockNode,
    error,
    attemptNumber: attempt,
    previousAttempts: history,
  })
);
```

### 4.3 Reflection Configuration

**Source**: `/home/dustin/projects/groundswell/examples/examples/09-reflection.ts` (lines 555-559)

```typescript
import { DEFAULT_REFLECTION_CONFIG, createReflectionConfig } from 'groundswell';

// Default configuration
console.log('Reflection configuration defaults:');
console.log(`  Enabled: ${DEFAULT_REFLECTION_CONFIG.enabled}`);
console.log(`  Max attempts: ${DEFAULT_REFLECTION_CONFIG.maxAttempts}`);
console.log(`  Retry delay: ${DEFAULT_REFLECTION_CONFIG.retryDelayMs}ms`);

// Custom configuration
const customConfig = createReflectionConfig({
  enabled: true,
  maxAttempts: 5,
  retryDelayMs: 200
});
```

### 4.4 When to Use Reflection

**Enable reflection for:**
- Complex schema validation (nested objects, strict constraints)
- Multi-step reasoning tasks
- High-stakes outputs where accuracy is critical
- Tasks with potential for hallucination

**Disable reflection for:**
- Simple classification tasks
- High-volume, low-latency requirements
- Idempotent operations where retry is wasteful

### 4.5 Reflection Best Practices from Codebase

**Source**: `/home/dustin/projects/hacky-hack/src/agents/prompts/bug-hunt-prompt.ts` (line 141)

```typescript
export function createBugHuntPrompt(testResults: string): Prompt<TestResults> {
  return createPrompt({
    user: constructUserPrompt(testResults),
    system: BUG_HUNT_SYSTEM_PROMPT,
    responseFormat: TestResultsSchema,
    enableReflection: true,  // Enable for thorough analysis reliability
  });
}
```

**Source**: `/home/dustin/projects/hacky-hack/src/agents/prompts/delta-analysis-prompt.ts` (line 142)

```typescript
export function createDeltaAnalysisPrompt(
  oldPRD: string,
  newPRD: string
): Prompt<DeltaAnalysis> {
  return createPrompt({
    user: constructUserPrompt(oldPRD, newPRD),
    system: DELTA_ANALYSIS_SYSTEM_PROMPT,
    responseFormat: DeltaAnalysisSchema,
    enableReflection: true,  // Enable for complex delta analysis reliability
  });
}
```

---

## 5. Type Safety in LLM Outputs

### 5.1 Type Inference with Zod

Groundswell automatically infers TypeScript types from Zod schemas:

```typescript
// Schema definition
const BugReportSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'major', 'minor', 'cosmetic']),
  title: z.string().min(1).max(200),
  description: z.string(),
  reproduction: z.string(),
  location: z.string().optional(),
});

// Inferred type
type BugReport = z.infer<typeof BugReportSchema>;
// Result: { id: string; severity: 'critical' | 'major' | 'minor' | 'cosmetic'; title: string; description: string; reproduction: string; location?: string }

// Prompt with type safety
const prompt = createPrompt({
  user: 'Generate a bug report',
  responseFormat: BugReportSchema,
});

// Result is fully typed
const bugReport: BugReport = await agent.prompt(prompt);
// TypeScript knows bugReport.severity is one of the four enum values
```

### 5.2 Type-Safe Prompt Factory Pattern

**Source**: `/home/dustin/projects/hacky-hack/src/agents/prompts/architect-prompt.ts` (lines 51-67)

```typescript
/**
 * Create an Architect Agent prompt with structured Backlog output
 *
 * @param prdContent - The PRD markdown content to analyze
 * @returns Groundswell Prompt object configured for Architect Agent
 */
export function createArchitectPrompt(prdContent: string): Prompt<Backlog> {
  return createPrompt({
    user: prdContent,
    system: TASK_BREAKDOWN_PROMPT,
    responseFormat: BacklogSchema,  // Type: z.ZodType<Backlog>
    enableReflection: true,
  });
  // Return type is Prompt<Backlog>, fully typed
}

// Usage
const prompt = createArchitectPrompt(prdContent);
const { backlog } = await agent.prompt(prompt);
// backlog is typed as Phase[] (inferred from Backlog interface)
```

### 5.3 Schema Reusability and Type Safety

**Source**: `/home/dustin/projects/hacky-hack/src/core/models.ts` (lines 1295-1305)

```typescript
/**
 * Zod schema for PRPDocument interface validation
 *
 * @remarks
 * Validates that an object conforms to the PRPDocument interface structure.
 * Ensures all required fields are present and properly typed.
 */
export const PRPDocumentSchema: z.ZodType<PRPDocument> = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  objective: z.string().min(1, 'Objective is required'),
  context: z.string().min(1, 'Context is required'),
  implementationSteps: z.array(
    z.string().min(1, 'Implementation step cannot be empty')
  ),
  validationGates: z.array(ValidationGateSchema),
  successCriteria: z.array(SuccessCriterionSchema),
  references: z.array(z.string()),
});

// Type-safe usage
type PRPDoc = z.infer<typeof PRPDocumentSchema>;
// PRPDoc is equivalent to PRPDocument interface

const prompt = createPrompt({
  user: 'Generate a PRP',
  responseFormat: PRPDocumentSchema,
});

const prp: PRPDoc = await agent.prompt(prompt);
// prp.implementationSteps is string[]
// prp.validationGates is ValidationGate[]
// All types are automatically inferred
```

### 5.4 Type Guards and Discriminated Unions

Use discriminated unions for type-safe handling of multiple output formats:

```typescript
const AnalysisResultSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('success'),
    data: z.object({
      summary: z.string(),
      score: z.number(),
    }),
  }),
  z.object({
    type: z.literal('error'),
    error: z.string(),
    details: z.string().optional(),
  }),
]);

type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const prompt = createPrompt({
  user: 'Analyze this code',
  responseFormat: AnalysisResultSchema,
});

const result = await agent.prompt(prompt);

// Type-safe handling with discriminator
if (result.type === 'success') {
  console.log(result.data.summary);  // TypeScript knows this exists
  console.log(result.data.score);
} else {
  console.log(result.error);  // TypeScript knows this is an error
  console.log(result.details ?? 'No details');
}
```

### 5.5 Compile-Time Type Safety Patterns

#### Pattern 1: Schema Libraries

**Source**: `/home/dustin/projects/groundswell/docs/prompt.md` (lines 378-402)

```typescript
// schemas.ts
export const AnalysisSchema = z.object({
  summary: z.string(),
  issues: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
  })),
});

export const ClassificationSchema = z.object({
  category: z.string(),
  confidence: z.number().min(0).max(1),
});

// usage.ts
import { AnalysisSchema, ClassificationSchema } from './schemas';

const analysisPrompt = createPrompt({
  user: 'Analyze',
  responseFormat: AnalysisSchema,
});
```

#### Pattern 2: Conditional Prompt Creation

```typescript
function createAnalysisPrompt(options: { detailed: boolean }) {
  return createPrompt({
    user: options.detailed
      ? 'Provide a detailed analysis with examples'
      : 'Provide a brief analysis',
    responseFormat: options.detailed
      ? DetailedAnalysisSchema
      : BriefAnalysisSchema,
  });
}

// Usage
const detailedPrompt = createAnalysisPrompt({ detailed: true });
const briefPrompt = createAnalysisPrompt({ detailed: false });

// Both are type-safe based on their schema
const detailed: DetailedAnalysis = await agent.prompt(detailedPrompt);
const brief: BriefAnalysis = await agent.prompt(briefPrompt);
```

### 5.6 Type Safety in Workflow Integration

**Source**: `/home/dustin/projects/groundswell/examples/examples/07-agent-loops.ts` (lines 42-51)

```typescript
const TextAnalysisSchema = z.object({
  input: z.string(),
  wordCount: z.number(),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  keyWords: z.array(z.string()),
});

type TextAnalysis = z.infer<typeof TextAnalysisSchema>;

// In workflow
@Step({ trackTiming: true, snapshotState: true, name: 'analyze-text' })
async analyzeText(input: string): Promise<TextAnalysis> {
  this.logger.info(`TextAgent analyzing: "${input}"`);
  const result = await simulateTextAnalysis(input);
  this.textResults.push(result);  // Type-safe array
  this.processedCount++;
  return result;  // Return type is enforced
}
```

---

## 6. Best Practices Summary

### 6.1 JSON Schema Validation

✅ **DO:**
- Define schemas first, then infer types with `z.infer<>`
- Use `.min()`, `.max()`, `.regex()` for constraints
- Use `z.lazy()` for recursive structures
- Use `z.enum()` for controlled vocabularies
- Use `superRefine()` for custom validation logic
- Provide descriptive error messages

❌ **DON'T:**
- Use `any` instead of proper Zod types
- Skip validation for "simple" schemas
- Use overly permissive types (e.g., `z.any()`)
- Forget to handle validation errors

### 6.2 Groundswell Framework

✅ **DO:**
- Use `createPrompt()` for all prompts
- Enable `enableReflection` for complex schemas
- Use `withData()` for prompt variations
- Follow configuration priority hierarchy
- Define reusable schema libraries

❌ **DON'T:**
- Mutate prompt objects (they're frozen)
- Ignore reflection for nested objects
- Put large examples in system prompt (use `data`)
- Override configuration unpredictably

### 6.3 Few-Shot Examples

✅ **DO:**
- Include 2-4 realistic examples
- Cover edge cases (empty arrays, null values)
- Use the `data` property for examples
- Label examples clearly
- Maintain format consistency

❌ **DON'T:**
- Use too many examples (>5)
- Show unrealistic or toy examples
- Mix inconsistent formats
- Put examples directly in user prompt

### 6.4 Error Recovery

✅ **DO:**
- Enable reflection for complex outputs
- Configure max attempts appropriately
- Log validation errors for debugging
- Use workflow-level reflection for critical steps
- Handle `ZodError` gracefully

❌ **DON'T:**
- Leave reflection enabled for simple tasks
- Ignore reflection logs
- Set max attempts too low (<2) or too high (>5)
- Forget to propagate validation errors

### 6.5 Type Safety

✅ **DO:**
- Always infer types from schemas
- Use discriminated unions for variant types
- Create type-safe prompt factories
- Export reusable schema libraries
- Use type guards for runtime checks

❌ **DON'T:**
- Define types separately from schemas
- Use type assertions (`as Type`)
- Skip type inference for "convenience"
- Duplicate type definitions

---

## References and Documentation Links

### Groundswell Framework

**Local Documentation**: `/home/dustin/projects/groundswell/`
- **README**: `/home/dustin/projects/groundswell/README.md`
  - Quick start guide
  - Core concepts
  - Decorators reference
  - Installation: `npm install groundswell`

- **Prompts Guide**: `/home/dustin/projects/groundswell/docs/prompt.md`
  - [`#basic-usage`](https://github.com/groundswell-ai/groundswell/blob/main/docs/prompt.md#basic-usage) - Basic prompt creation
  - [`#response-format`](https://github.com/groundswell-ai/groundswell/blob/main/docs/prompt.md#response-format) - Schema integration
  - [`#validation`](https://github.com/groundswell-ai/groundswell/blob/main/docs/prompt.md#validation) - Error handling

- **Agents Guide**: `/home/dustin/projects/groundswell/docs/agent.md`
  - [`#reflection`](https://github.com/groundswell-ai/groundswell/blob/main/docs/agent.md#reflection) - Reflection system
  - [`#executing-prompts`](https://github.com/groundswell-ai/groundswell/blob/main/docs/agent.md#executing-prompts) - Prompt execution

- **Examples**: `/home/dustin/projects/groundswell/examples/examples/`
  - `09-reflection.ts` - Multi-level reflection demonstrations
  - `08-sdk-features.ts` - Tools, MCPs, and hooks
  - `07-agent-loops.ts` - Agent loops with structured output

### Zod Documentation

**Official**: https://zod.dev
- **API Reference**: https://zod.dev/api
- **GitHub**: https://github.com/colinhacks/zod
- **Version**: 3.25.76 (installed in `node_modules/zod`)

### Codebase Examples

**Schema Definitions**: `/home/dustin/projects/hacky-hack/src/core/models.ts`
- `BacklogSchema` (lines 709-711)
- `PRPDocumentSchema` (lines 1295-1305)
- `ContextScopeSchema` (lines 68-112) - Custom validation with `superRefine()`
- `MilestoneSchema` (lines 522-535) - Recursive schema with `z.lazy()`

**Prompt Factories**: `/home/dustin/projects/hacky-hack/src/agents/prompts/`
- `architect-prompt.ts` - Task breakdown with `BacklogSchema`
- `prp-blueprint-prompt.ts` - PRP generation with `PRPDocumentSchema`
- `bug-hunt-prompt.ts` - QA testing with `TestResultsSchema`
- `delta-analysis-prompt.ts` - Delta analysis with `DeltaAnalysisSchema`

### Additional Resources

**Type Safety**:
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
- Discriminated Unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates

**LLM Best Practices**:
- Anthropic Prompt Engineering: https://docs.anthropic.com/claude/docs/prompt-engineering
- OpenAI Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs

---

**Document Generated**: 2026-01-23
**Research Focus**: Structured output techniques for Groundswell + Zod integration
**Status**: Complete
