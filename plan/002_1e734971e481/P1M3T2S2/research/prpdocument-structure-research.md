# PRPDocument Structure Research

## Overview

This research document summarizes findings about PRPDocument structure and related types for creating comprehensive tests.

## PRPDocument Interface (src/core/models.ts:1195-1268)

```typescript
export interface PRPDocument {
  readonly taskId: string; // Format: P1.M2.T2.S2
  readonly objective: string; // Feature Goal from PRP
  readonly context: string; // Complete "All Needed Context" as markdown
  readonly implementationSteps: string[]; // Array of implementation task descriptions
  readonly validationGates: ValidationGate[]; // Array of 4 validation gates
  readonly successCriteria: SuccessCriterion[]; // Array of success criteria
  readonly references: string[]; // Array of reference URLs and file paths
}
```

**Key Fields**:

- `taskId`: Work item ID in format P{phase}.M{milestone}.T{task}.S{subtask}
- `objective`: The Feature Goal from the Goal section
- `context`: Complete context section as markdown string
- `implementationSteps`: Ordered array of implementation tasks
- `validationGates`: Exactly 4 validation gates (one per level)
- `successCriteria`: Array of success criteria checkboxes
- `references`: URLs and file paths

## ValidationGate Interface (src/core/models.ts:999-1043)

```typescript
export interface ValidationGate {
  readonly level: 1 | 2 | 3 | 4; // Progressive validation levels
  readonly description: string; // Human-readable description
  readonly command: string | null; // Bash command (null for manual)
  readonly manual: boolean; // Whether manual validation required
}
```

**4 Levels of Validation**:

1. **Level 1**: Syntax & Style (linting, formatting, type checking)
2. **Level 2**: Unit Tests (component-level validation)
3. **Level 3**: Integration Testing (system-level validation)
4. **Level 4**: Manual/Creative (end-to-end workflows, domain-specific)

## SuccessCriterion Interface (src/core/models.ts:1099-1121)

```typescript
export interface SuccessCriterion {
  readonly description: string; // Criterion description
  readonly satisfied: boolean; // Whether met
}
```

## Zod Schemas

### PRPDocumentSchema (src/core/models.ts:1294-1304)

```typescript
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
```

### ValidationGateSchema (src/core/models.ts:1066-1071)

```typescript
export const ValidationGateSchema: z.ZodType<ValidationGate> = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  description: z.string().min(1, 'Description is required'),
  command: z.string().nullable(),
  manual: z.boolean(),
});
```

### SuccessCriterionSchema (src/core/models.ts:1141-1144)

```typescript
export const SuccessCriterionSchema: z.ZodType<SuccessCriterion> = z.object({
  description: z.string().min(1, 'Description is required'),
  satisfied: z.boolean(),
});
```

## PRPGenerator Markdown Format (src/agents/prp-generator.ts:509-559)

The `#formatPRPAsMarkdown()` method converts PRPDocument to markdown:

```typescript
# PRP for {taskId}

## Objective
{objective}

## Context
{context}

## Implementation Steps
1. {step1}
2. {step2}
...

## Validation Gates
### Level 1: {level}
{command or 'Manual validation required'}

### Level 2: {level}
...

## Success Criteria
- [ ] {criterion1}
- [ ] {criterion2}
...

## References
- {reference1}
- {reference2}
...
```

## Context Section Structure (from PROMPTS.md)

The YAML-based context structure in PRP templates:

```yaml
# Documentation & References
- url: [Complete URL with section anchor]
  why: [Specific methods/concepts needed]
  critical: [Key insights preventing errors]

- file: [exact/path/to/pattern/file.py]
  why: [Specific pattern to follow]
  pattern: [Brief description]
  gotcha: [Known constraints]

- docfile: [plan/002_1e734971e481/ai_docs/domain_specific.md]
  why: [Custom documentation]
  section: [Specific section]
```

## Implementation Task Structure (from PROMPTS.md)

```yaml
Task 1: CREATE src/models/{domain}_models.py
  - IMPLEMENT: {SpecificModel} models
  - FOLLOW pattern: src/models/existing_model.py
  - NAMING: CamelCase for classes
  - PLACEMENT: Domain-specific model file

Task 2: MODIFY src/main.py
  - INTEGRATE: Register new tool
  - FIND pattern: existing registrations
  - ADD: Import and register
  - DEPENDENCIES: Import from Task 1
```

## Existing Test Patterns (from models.test.ts:1566-1730)

### PRPDocumentSchema Tests

```typescript
describe('PRPDocumentSchema', () => {
  const validPRP: PRPDocument = {
    taskId: 'P1.M2.T2.S2',
    objective: 'Add PRP document interfaces',
    context: '# All Needed Context\n\n...',
    implementationSteps: ['Create ValidationGate interface'],
    validationGates: [
      {
        level: 1,
        description: 'Syntax & Style',
        command: 'npm run validate',
        manual: false,
      },
    ],
    successCriteria: [
      {
        description: 'All interfaces added',
        satisfied: false,
      },
    ],
    references: ['https://github.com/anthropics/claude-code'],
  };

  it('should parse valid PRP document', () => {
    const result = PRPDocumentSchema.safeParse(validPRP);
    expect(result.success).toBe(true);
  });

  it('should reject PRP with empty taskId', () => {
    const invalid = { ...validPRP, taskId: '' };
    const result = PRPDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

## Key Insights for Testing

1. **PRPDocument has 7 fields**, all required and readonly
2. **ValidationGate.level is a literal union** (1 | 2 | 3 | 4), not number
3. **ValidationGate.command can be null** (for manual validation)
4. **Arrays can be empty** (implementationSteps, validationGates, successCriteria, references)
5. **Strings must be non-empty** (min(1) validation)
6. **Markdown format** is generated by PRPGenerator.#formatPRPAsMarkdown()
7. **No ContextSection interface exists** - it's a YAML pattern in PRP templates
8. **No ImplementationTask interface exists** - it's a YAML pattern in PRP templates

## Test Requirements for P1.M3.T2.S2

Based on the work item description:

1. **Test 1**: Create valid PRPDocument with all required sections
2. **Test 2**: Test ContextSection variations (url, file, docfile) - Note: This tests the YAML pattern in context field
3. **Test 3**: Test ImplementationTask with all fields (ACTION, path, FOLLOW, NAMING, etc.) - Note: This tests the YAML pattern in implementationSteps field
4. **Test 4**: Test ValidationGate with 4 levels
5. **Test 5**: Verify PRPDocument can be serialized to markdown format (PRP.md)

## Critical Gotchas

- **ValidationGate.level** must be literal 1, 2, 3, or 4 - NOT generic numbers
- **ValidationGate.command** can be null (not undefined) for manual validation
- **Empty strings are invalid** for all string fields (min(1) validation)
- **Arrays can be empty** but individual elements have constraints
- **ContextSection and ImplementationTask are NOT TypeScript interfaces** - they are YAML documentation patterns in PRP templates
- **PRPDocument.context is a string** (markdown), not a structured object
- **PRPDocument.implementationSteps is string[]**, not structured objects
