# Zod + Groundswell Best Practices

## External Resources

### Zod Documentation

- **Official**: https://zod.dev
- **API Reference**: https://zod.dev/api
- **GitHub**: https://github.com/colinhacks/zod

### Groundswell Documentation

- **GitHub**: https://github.com/groundswell-ai/groundswell
- **Prompts**: https://github.com/groundswell-ai/groundswell/blob/main/docs/prompt.md

## Key Best Practices

### 1. Schema-First Approach

```typescript
// Define schema first
const LLMSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()),
});

// Infer TypeScript type
type LLMResponse = z.infer<typeof LLMSchema>;
```

### 2. Recursive Schemas for Hierarchical Data

Use `z.lazy()` for recursive structures like task hierarchies:

```typescript
const TaskSchema: z.ZodType<Task> = z.lazy(() =>
  z.object({
    subtasks: z.array(z.lazy(() => SubtaskSchema)),
  })
);
```

### 3. Safe Error Handling

```typescript
const result = LLMSchema.safeParse(llmOutput);

if (!result.success) {
  console.log('Validation failed:');
  result.error.issues.forEach(issue => {
    console.log(`- ${issue.path.join('.')}: ${issue.message}`);
  });
}
```

### 4. Groundswell Integration Pattern

```typescript
const architectPrompt = createPrompt({
  user: prdContent,
  system: ARCHITECT_SYSTEM_PROMPT,
  responseFormat: z.object({
    backlog: z.array(TaskSchema),
  }),
  enableReflection: true,
});

const { backlog } = await agent.prompt(architectPrompt);
```

## Local Resources

- `plan/001_14b9dc2a33c7/P1M2T1S1/research/zod_patterns.md`
- `plan/001_14b9dc2a33c7/P1M1T3S2/research/groundswell_docs.md`
- `plan/001_14b9dc2a33c7/architecture/groundswell_api.md`
