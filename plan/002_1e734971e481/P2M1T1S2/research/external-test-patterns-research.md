# External Research: Testing Patterns for Session State Loading and JSON Parsing with Zod Validation

**Research Date:** 2025-01-15
**Research Focus:** Testing patterns for session state persistence, JSON parsing, Zod validation, hierarchical data restoration, and batch operations

---

## Table of Contents

1. [Best Practices for Testing JSON File Loading and Parsing](#1-json-file-loading-and-parsing)
2. [Testing Patterns for Zod Schema Validation in Vitest](#2-zod-validation-testing)
3. [Patterns for Testing Hierarchical Data Restoration](#3-hierarchical-data-restoration)
4. [Testing Session State Persistence and Loading](#4-session-state-persistence)
5. [Best Practices for Integration Tests with Real Filesystem Operations](#5-filesystem-integration-tests)
6. [Testing Patterns for Parent-Child Session Relationships](#6-parent-child-relationships)
7. [Testing Batch Update Systems and Atomic Flush Operations](#7-batch-update-systems)
8. [Common Pitfalls to Avoid](#8-common-pitfalls)
9. [Additional Resources](#9-additional-resources)

---

## 1. Best Practices for Testing JSON File Loading and Parsing

### 1.1 Test File Structure Organization

```
tests/
├── fixtures/
│   ├── json/
│   │   ├── valid/
│   │   │   ├── simple-session.json
│   │   │   ├── complex-hierarchy.json
│   │   │   └── with-batch-updates.json
│   │   ├── invalid/
│   │   │   ├── malformed.json
│   │   │   ├── missing-required-fields.json
│   │   │   └── invalid-types.json
│   │   └── edge-cases/
│   │       ├── empty.json
│   │       ├── large-file.json
│   │       └── unicode-data.json
│   └── schemas/
│       └── expected-formats/
├── unit/
│   └── json-parser.test.ts
└── integration/
    └── session-loading.test.ts
```

### 1.2 Core Testing Patterns

#### Pattern 1: Successful Parsing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { loadAndValidateSession } from '@/session/loader';
import { promises as fs } from 'fs';
import path from 'path';

describe('JSON File Loading - Success Cases', () => {
  it('should successfully load and parse a valid simple session', async () => {
    const fixturePath = path.join(__dirname, 'fixtures/json/valid/simple-session.json');
    const result = await loadAndValidateSession(fixturePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
    }
  });

  it('should handle large JSON files efficiently', async () => {
    const largeFixturePath = path.join(__dirname, 'fixtures/json/edge-cases/large-file.json');
    const startTime = Date.now();

    const result = await loadAndValidateSession(largeFixturePath);

    const duration = Date.now() - startTime;
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1000); // Performance assertion
  });
});
```

#### Pattern 2: Error Handling Tests

```typescript
describe('JSON File Loading - Error Cases', () => {
  it('should handle malformed JSON gracefully', async () => {
    const malformedPath = path.join(__dirname, 'fixtures/json/invalid/malformed.json');
    const result = await loadAndValidateSession(malformedPath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('PARSE_ERROR');
    }
  });

  it('should provide detailed error messages for missing fields', async () => {
    const missingFieldsPath = path.join(__dirname, 'fixtures/json/invalid/missing-required-fields.json');
    const result = await loadAndValidateSession(missingFieldsPath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength.greaterThan(0);
      expect(result.error.issues[0].path).toBeDefined();
    }
  });

  it('should handle non-existent files', async () => {
    const nonExistentPath = path.join(__dirname, 'fixtures/json/does-not-exist.json');
    const result = await loadAndValidateSession(nonExistentPath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FILE_NOT_FOUND');
    }
  });
});
```

#### Pattern 3: Type Validation Tests

```typescript
describe('JSON Type Validation', () => {
  it('should validate complex nested types correctly', async () => {
    const complexPath = path.join(__dirname, 'fixtures/json/valid/complex-hierarchy.json');
    const result = await loadAndValidateSession(complexPath);

    expect(result.success).toBe(true);
    if (result.success) {
      // Verify nested structure types
      expect(Array.isArray(result.data.phases)).toBe(true);
      expect(typeof result.data.phases[0].milestones).toBe('object');
      expect(Array.isArray(result.data.phases[0].milestones[0].tasks)).toBe(true);
    }
  });

  it('should reject invalid type coercions', async () => {
    const invalidTypesPath = path.join(__dirname, 'fixtures/json/invalid/invalid-types.json');
    const result = await loadAndValidateSession(invalidTypesPath);

    expect(result.success).toBe(false);
    if (!result.success) {
      const typeErrors = result.error.issues.filter(
        issue => issue.code === 'invalid_type'
      );
      expect(typeErrors.length).toBe.greaterThan(0);
    }
  });
});
```

### 1.3 Best Practices

1. **Use `safeParse` instead of `parse`**: Always use Zod's `safeParse` in tests to catch validation errors without throwing
2. **Test both success and failure paths**: Ensure comprehensive coverage of valid and invalid inputs
3. **Use descriptive fixture names**: Make it clear what each fixture is testing
4. **Include performance assertions**: For large files, add reasonable timing constraints
5. **Test edge cases**: Empty files, unicode characters, very long strings, deeply nested structures
6. **Validate error messages**: Ensure error messages are helpful and include context

---

## 2. Testing Patterns for Zod Schema Validation in Vitest

### 2.1 Basic Schema Testing

```typescript
import { z } from 'zod';
import { describe, it, expect } from 'vitest';

// Example schema from your codebase
const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'blocked']);
const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: TaskStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

describe('Task Schema Validation', () => {
  describe('Valid Inputs', () => {
    const validTask = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Implement feature',
      description: 'Detailed description',
      status: 'pending',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    };

    it('should accept a valid task with all fields', () => {
      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should accept a valid task with optional fields omitted', () => {
      const taskWithoutDescription = { ...validTask, description: undefined };
      const result = TaskSchema.safeParse(taskWithoutDescription);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Inputs', () => {
    it('should reject invalid UUID format', () => {
      const invalidTask = {
        id: 'not-a-uuid',
        title: 'Test',
        status: 'pending',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };
      const result = TaskSchema.safeParse(invalidTask);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_string');
        expect(result.error.issues[0].validation).toBe('uuid');
      }
    });

    it('should reject invalid enum values', () => {
      const invalidTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test',
        status: 'invalid_status',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };
      const result = TaskSchema.safeParse(invalidTask);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
      }
    });

    it('should enforce string length constraints', () => {
      const emptyTitleTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '',
        status: 'pending',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      };
      const result = TaskSchema.safeParse(emptyTitleTask);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });
  });
});
```

### 2.2 Custom Refinement Testing

```typescript
const SessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  parentSessionId: z.string().uuid().optional(),
}).refine(
  (data) => !data.parentSessionId || data.parentSessionId !== data.id,
  {
    message: 'Parent session ID cannot be the same as the session ID',
    path: ['parentSessionId'],
  }
);

describe('Session Schema with Custom Refinements', () => {
  it('should allow valid parent-child relationships', () => {
    const validSession = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Child Session',
      parentSessionId: '987fcdeb-51a2-43f1-a456-426614174000',
    };
    const result = SessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
  });

  it('should reject sessions where parent equals self', () => {
    const invalidSession = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Invalid Session',
      parentSessionId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const result = SessionSchema.safeParse(invalidSession);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be the same');
    }
  });
});
```

### 2.3 Transform Testing

```typescript
const NormalizedStringSchema = z.string()
  .transform((val) => val.trim().toLowerCase());

describe('Schema Transformations', () => {
  it('should transform strings correctly', () => {
    const result = NormalizedStringSchema.safeParse('  HELLO WORLD  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('hello world');
    }
  });
});
```

### 2.4 Discriminated Union Testing

```typescript
const BatchUpdateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create'),
    entityType: z.enum(['task', 'milestone', 'phase']),
    data: z.any(),
  }),
  z.object({
    type: z.literal('update'),
    entityType: z.enum(['task', 'milestone', 'phase']),
    entityId: z.string().uuid(),
    changes: z.record(z.any()),
  }),
  z.object({
    type: z.literal('delete'),
    entityType: z.enum(['task', 'milestone', 'phase']),
    entityId: z.string().uuid(),
  }),
]);

describe('Discriminated Union Validation', () => {
  it('should validate create operations', () => {
    const createOp = {
      type: 'create' as const,
      entityType: 'task' as const,
      data: { title: 'New Task' },
    };
    const result = BatchUpdateSchema.safeParse(createOp);
    expect(result.success).toBe(true);
  });

  it('should require type-specific fields', () => {
    const invalidUpdate = {
      type: 'update' as const,
      entityType: 'task' as const,
      // Missing required entityId
      changes: { status: 'completed' },
    };
    const result = BatchUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});
```

### 2.5 Helper Functions for Testing

```typescript
/**
 * Helper to extract and format Zod error messages
 */
export function getZodErrors(result: z.ZodError): string[] {
  return result.issues.map(issue =>
    `${issue.path.join('.')}: ${issue.message}`
  );
}

/**
 * Helper to check if specific field has error
 */
export function hasFieldError(result: z.ZodError, fieldPath: string): boolean {
  return result.issues.some(issue =>
    issue.path.join('.') === fieldPath
  );
}

/**
 * Helper to validate schema with custom error messages
 */
export function expectZodSuccess<T>(result: z.SafeParseSuccess<T> | z.SafeParseError<any>): asserts result is z.SafeParseSuccess<T> {
  expect(result.success).toBe(true);
  if (!result.success) {
    throw new Error(`Expected success but got errors:\n${getZodErrors(result.error).join('\n')}`);
  }
}

/**
 * Helper to validate schema failure with specific error count
 */
export function expectZodFailure<T>(
  result: z.SafeParseSuccess<T> | z.SafeParseError<any>,
  expectedErrorCount?: number
): asserts result is z.SafeParseError<any> {
  expect(result.success).toBe(false);
  if (expectedErrorCount !== undefined) {
    expect(result.error.issues).toHaveLength(expectedErrorCount);
  }
}

// Usage in tests
describe('Using Helper Functions', () => {
  it('should use helper for cleaner assertions', () => {
    const result = TaskSchema.safeParse({ /* valid data */ });
    expectZodSuccess(result);
    expect(result.data.title).toBe('Expected Title');
  });

  it('should use helper for failure assertions', () => {
    const result = TaskSchema.safeParse({ /* invalid data */ });
    expectZodFailure(result, 2); // Expect exactly 2 validation errors
  });
});
```

---

## 3. Patterns for Testing Hierarchical Data Restoration

### 3.1 Testing Phase > Milestone > Task > Subtask Hierarchy

```typescript
import { describe, it, expect } from 'vitest';
import { loadHierarchicalSession } from '@/session/hierarchical-loader';

describe('Hierarchical Data Restoration', () => {
  describe('Complete Hierarchy Loading', () => {
    it('should restore full 4-level hierarchy', async () => {
      const fixturePath = path.join(__dirname, 'fixtures/json/valid/complete-hierarchy.json');
      const result = await loadHierarchicalSession(fixturePath);

      expect(result.success).toBe(true);
      if (result.success) {
        const { phases } = result.data;

        // Level 1: Phases
        expect(phases).toBeDefined();
        expect(phases.length).toBe.greaterThan(0);

        // Level 2: Milestones
        const firstPhase = phases[0];
        expect(firstPhase.milestones).toBeDefined();
        expect(firstPhase.milestones.length).toBe.greaterThan(0);

        // Level 3: Tasks
        const firstMilestone = firstPhase.milestones[0];
        expect(firstMilestone.tasks).toBeDefined();
        expect(firstMilestone.tasks.length).toBe.greaterThan(0);

        // Level 4: Subtasks
        const firstTask = firstMilestone.tasks[0];
        expect(firstTask.subtasks).toBeDefined();
        expect(Array.isArray(firstTask.subtasks)).toBe(true);
      }
    });

    it('should maintain parent-child relationships', async () => {
      const fixturePath = path.join(__dirname, 'fixtures/json/valid/complete-hierarchy.json');
      const result = await loadHierarchicalSession(fixturePath);

      expect(result.success).toBe(true);
      if (result.success) {
        const phase = result.data.phases[0];
        const milestone = phase.milestones[0];
        const task = milestone.tasks[0];

        // Verify references
        expect(milestone.phaseId).toBe(phase.id);
        expect(task.phaseId).toBe(phase.id);
        expect(task.milestoneId).toBe(milestone.id);

        if (task.subtasks && task.subtasks.length > 0) {
          const subtask = task.subtasks[0];
          expect(subtask.phaseId).toBe(phase.id);
          expect(subtask.milestoneId).toBe(milestone.id);
          expect(subtask.taskId).toBe(task.id);
        }
      }
    });
  });

  describe('Partial Hierarchy Loading', () => {
    it('should handle phases without milestones', async () => {
      const partialData = {
        id: 'session-1',
        phases: [
          {
            id: 'phase-1',
            name: 'Empty Phase',
            milestones: [],
          },
        ],
      };

      const result = await loadHierarchicalSession(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phases[0].milestones).toEqual([]);
      }
    });

    it('should handle milestones without tasks', async () => {
      const partialData = {
        id: 'session-1',
        phases: [
          {
            id: 'phase-1',
            name: 'Phase with Empty Milestone',
            milestones: [
              {
                id: 'milestone-1',
                name: 'Empty Milestone',
                tasks: [],
              },
            ],
          },
        ],
      };

      const result = await loadHierarchicalSession(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phases[0].milestones[0].tasks).toEqual([]);
      }
    });

    it('should handle tasks without subtasks', async () => {
      const partialData = {
        id: 'session-1',
        phases: [
          {
            id: 'phase-1',
            name: 'Phase',
            milestones: [
              {
                id: 'milestone-1',
                name: 'Milestone',
                tasks: [
                  {
                    id: 'task-1',
                    title: 'Task without subtasks',
                    subtasks: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = await loadHierarchicalSession(partialData);
      expect(result.success).toBe(true);
    });
  });

  describe('Hierarchy Validation', () => {
    it('should detect orphaned milestones', async () => {
      const invalidData = {
        id: 'session-1',
        phases: [
          {
            id: 'phase-1',
            name: 'Phase',
            milestones: [
              {
                id: 'milestone-1',
                name: 'Orphaned Milestone',
                phaseId: 'non-existent-phase', // Invalid reference
                tasks: [],
              },
            ],
          },
        ],
      };

      const result = await loadHierarchicalSession(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i =>
          i.message.includes('Invalid phaseId reference')
        )).toBe(true);
      }
    });

    it('should detect circular references', async () => {
      // Test for circular parent references if applicable
      const dataWithCircularRef = {
        id: 'session-1',
        phases: [
          {
            id: 'phase-1',
            name: 'Phase',
            parentPhaseId: 'phase-2', // Circular reference
            milestones: [],
          },
          {
            id: 'phase-2',
            name: 'Phase 2',
            parentPhaseId: 'phase-1', // Circular reference
            milestones: [],
          },
        ],
      };

      const result = await loadHierarchicalSession(dataWithCircularRef);
      expect(result.success).toBe(false);
    });
  });

  describe('Hierarchy Integrity Tests', () => {
    it('should verify all IDs are unique within their scope', async () => {
      const result = await loadHierarchicalSession(validFixturePath);

      expect(result.success).toBe(true);
      if (result.success) {
        const phaseIds = result.data.phases.map(p => p.id);
        const uniquePhaseIds = new Set(phaseIds);
        expect(phaseIds).toHaveLength(uniquePhaseIds.size);

        result.data.phases.forEach(phase => {
          const milestoneIds = phase.milestones.map(m => m.id);
          const uniqueMilestoneIds = new Set(milestoneIds);
          expect(milestoneIds).toHaveLength(uniqueMilestoneIds.size);
        });
      }
    });

    it('should verify hierarchy depth limits', async () => {
      // Test maximum depth constraints
      const result = await loadHierarchicalSession(validFixturePath);

      expect(result.success).toBe(true);
      if (result.success) {
        function getMaxDepth(phase: any): number {
          if (!phase.milestones || phase.milestones.length === 0) return 1;

          let maxMilestoneDepth = 0;
          phase.milestones.forEach((milestone: any) => {
            if (!milestone.tasks || milestone.tasks.length === 0) {
              maxMilestoneDepth = Math.max(maxMilestoneDepth, 2);
              return;
            }

            milestone.tasks.forEach((task: any) => {
              const depth = 3 + (task.subtasks?.length || 0);
              maxMilestoneDepth = Math.max(maxMilestoneDepth, depth);
            });
          });

          return maxMilestoneDepth;
        }

        result.data.phases.forEach(phase => {
          const depth = getMaxDepth(phase);
          expect(depth).toBe.lessThanOrEqual(10); // Max depth constraint
        });
      }
    });
  });
});
```

### 3.2 Hierarchy Traversal Testing

```typescript
describe('Hierarchy Traversal', () => {
  it('should traverse hierarchy in correct order', async () => {
    const result = await loadHierarchicalSession(validFixturePath);
    expect(result.success).toBe(true);

    if (result.success) {
      const traversalOrder: string[] = [];

      // BFS traversal
      const queue: any[] = [...result.data.phases];
      while (queue.length > 0) {
        const current = queue.shift();
        traversalOrder.push(current.id);

        if (current.milestones) {
          queue.push(...current.milestones);
        }
        if (current.tasks) {
          queue.push(...current.tasks);
        }
        if (current.subtasks) {
          queue.push(...current.subtasks);
        }
      }

      // Verify traversal properties
      expect(traversalOrder.length).toBe.greaterThan(0);
    }
  });

  it('should support filtering by hierarchy level', async () => {
    const result = await loadHierarchicalSession(validFixturePath);
    expect(result.success).toBe(true);

    if (result.success) {
      const getAllTasks = (session: any) => {
        const tasks: any[] = [];
        session.phases.forEach((phase: any) => {
          phase.milestones.forEach((milestone: any) => {
            tasks.push(...milestone.tasks);
          });
        });
        return tasks;
      };

      const tasks = getAllTasks(result.data);
      expect(tasks.length).toBe.greaterThan(0);
      tasks.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('status');
      });
    }
  });
});
```

---

## 4. Testing Session State Persistence and Loading

### 4.1 Round-Trip Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { saveSession, loadSession } from '@/session/persistence';

describe('Session State Persistence - Round Trip', () => {
  const tempDir = path.join(__dirname, 'temp-session-tests');

  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should persist and load session without data loss', async () => {
    const originalSession = {
      id: 'test-session-1',
      name: 'Test Session',
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          milestones: [
            {
              id: 'milestone-1',
              name: 'Milestone 1',
              tasks: [
                {
                  id: 'task-1',
                  title: 'Task 1',
                  status: 'pending',
                },
              ],
            },
          ],
        },
      ],
    };

    const sessionPath = path.join(tempDir, 'session.json');

    // Save
    await saveSession(sessionPath, originalSession);

    // Load
    const loadedResult = await loadSession(sessionPath);
    expect(loadedResult.success).toBe(true);

    if (loadedResult.success) {
      // Compare
      expect(loadedResult.data).toEqual(originalSession);

      // Verify deep equality
      expect(loadedResult.data.phases[0].milestones[0].tasks[0].title).toBe('Task 1');
    }
  });

  it('should handle complex nested structures', async () => {
    const complexSession = {
      id: 'complex-session',
      phases: [
        {
          id: 'phase-1',
          milestones: [
            {
              id: 'milestone-1',
              tasks: [
                {
                  id: 'task-1',
                  subtasks: [
                    { id: 'subtask-1', title: 'Subtask 1' },
                    { id: 'subtask-2', title: 'Subtask 2' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const sessionPath = path.join(tempDir, 'complex.json');
    await saveSession(sessionPath, complexSession);

    const loadedResult = await loadSession(sessionPath);
    expect(loadedResult.success).toBe(true);

    if (loadedResult.success) {
      expect(loadedResult.data.phases[0].milestones[0].tasks[0].subtasks).toHaveLength(2);
    }
  });
});
```

### 4.2 Concurrency and Race Condition Testing

```typescript
describe('Session State Persistence - Concurrency', () => {
  it('should handle concurrent read operations', async () => {
    const sessionPath = path.join(tempDir, 'concurrent-read.json');
    const testData = { id: 'test', data: 'value' };
    await saveSession(sessionPath, testData);

    // Perform multiple concurrent reads
    const readPromises = Array.from({ length: 10 }, () => loadSession(sessionPath));
    const results = await Promise.all(readPromises);

    results.forEach(result => {
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(testData);
      }
    });
  });

  it('should handle concurrent write operations with proper locking', async () => {
    const sessionPath = path.join(tempDir, 'concurrent-write.json');

    // Create multiple write operations
    const writePromises = Array.from({ length: 5 }, (_, i) =>
      saveSession(sessionPath, { id: `test-${i}`, counter: i })
    );

    await expect(Promise.all(writePromises)).resolves.not.toThrow();

    // Verify file exists and is valid
    const result = await loadSession(sessionPath);
    expect(result.success).toBe(true);
  });
});
```

### 4.3 Data Integrity Testing

```typescript
describe('Session State Persistence - Data Integrity', () => {
  it('should preserve all metadata', async () => {
    const sessionWithMetadata = {
      id: 'session-1',
      name: 'Test',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
      metadata: {
        version: '1.0.0',
        author: 'test-user',
        tags: ['important', 'feature'],
      },
      phases: [],
    };

    const sessionPath = path.join(tempDir, 'metadata.json');
    await saveSession(sessionPath, sessionWithMetadata);

    const result = await loadSession(sessionPath);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.metadata).toEqual(sessionWithMetadata.metadata);
      expect(result.data.createdAt).toBe(sessionWithMetadata.createdAt);
    }
  });

  it('should validate data after load', async () => {
    const sessionPath = path.join(tempDir, 'validate.json');

    // Write JSON manually (bypassing saveSession)
    await fs.writeFile(
      sessionPath,
      JSON.stringify({ id: 'invalid', phases: 'not-an-array' }),
      'utf-8'
    );

    const result = await loadSession(sessionPath);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength.greaterThan(0);
    }
  });
});
```

---

## 5. Best Practices for Integration Tests with Real Filesystem Operations

### 5.1 Using Temporary Directories

```typescript
import { tmpdir } from 'os';
import { join } from 'path';

describe('Filesystem Integration Tests', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create unique temporary directory for each test
    testDir = join(tmpdir(), `test-${Date.now()}-${Math.random()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should perform isolated filesystem operations', async () => {
    const testFile = join(testDir, 'test.json');
    await fs.writeFile(testFile, JSON.stringify({ test: true }), 'utf-8');

    const content = await fs.readFile(testFile, 'utf-8');
    expect(JSON.parse(content)).toEqual({ test: true });
  });
});
```

### 5.2 Using In-Memory Filesystems (memfs)

```typescript
import { fs } from 'memfs';
import { vol } from 'memfs';

describe('Filesystem Tests with memfs', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should use in-memory filesystem for faster tests', () => {
    vol.fromJSON({
      '/test/session.json': JSON.stringify({ id: 'test' }),
    });

    const content = fs.readFileSync('/test/session.json', 'utf-8');
    expect(JSON.parse(content)).toEqual({ id: 'test' });
  });
});
```

### 5.3 Testing File Permissions and Edge Cases

```typescript
describe('Filesystem Edge Cases', () => {
  it('should handle read-only files', async () => {
    const testFile = join(testDir, 'readonly.json');
    await fs.writeFile(testFile, '{}', 'utf-8');
    await fs.chmod(testFile, 0o444); // Read-only

    const result = await saveSession(testFile, { new: 'data' });
    expect(result.success).toBe(false);
  });

  it('should handle file system errors gracefully', async () => {
    const invalidPath = '/non-existent-directory/session.json';
    const result = await loadSession(invalidPath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FILE_NOT_FOUND');
    }
  });
});
```

### 5.4 Atomic Write Testing

```typescript
describe('Atomic Write Operations', () => {
  it('should write files atomically using temp file pattern', async () => {
    const targetPath = join(testDir, 'atomic.json');

    // Implementation should use temp file + rename pattern
    await atomicWrite(targetPath, { id: 'test' });

    // Verify file exists and is complete
    const exists = await fs.access(targetPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    const result = await loadSession(targetPath);
    expect(result.success).toBe(true);
  });

  it('should not corrupt files if write fails mid-operation', async () => {
    const targetPath = join(testDir, 'corruption-test.json');

    // Write initial valid data
    await atomicWrite(targetPath, { id: 'initial' });

    // Simulate failed write
    const tempPath = `${targetPath}.tmp`;
    await fs.writeFile(tempPath, '{incomplete json', 'utf-8');

    // Original file should still be valid
    const result = await loadSession(targetPath);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('initial');
    }
  });
});
```

---

## 6. Testing Patterns for Parent-Child Session Relationships

### 6.1 Parent-Child Validation

```typescript
import { describe, it, expect } from 'vitest';
import { SessionManager } from '@/session/manager';

describe('Parent-Child Session Relationships', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  it('should validate parent session exists', async () => {
    const parentSession = await manager.createSession({
      id: 'parent-1',
      name: 'Parent Session',
    });

    const childSession = await manager.createSession({
      id: 'child-1',
      name: 'Child Session',
      parentSessionId: 'parent-1',
    });

    expect(childSession.parentSessionId).toBe('parent-1');
    expect(childSession.parent).toBeDefined();
    expect(childSession.parent?.id).toBe('parent-1');
  });

  it('should reject child with non-existent parent', async () => {
    const result = await manager.createSession({
      id: 'orphan-1',
      name: 'Orphan Session',
      parentSessionId: 'non-existent-parent',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Parent session not found');
    }
  });

  it('should prevent circular parent references', async () => {
    const session1 = await manager.createSession({
      id: 'session-1',
      name: 'Session 1',
    });

    const session2 = await manager.createSession({
      id: 'session-2',
      name: 'Session 2',
      parentSessionId: 'session-1',
    });

    // Try to make session-1 a child of session-2
    const result = await manager.updateSession('session-1', {
      parentSessionId: 'session-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('circular reference');
    }
  });
});
```

### 6.2 Cascade Operations Testing

```typescript
describe('Cascade Operations', () => {
  it('should cascade deletes to child sessions', async () => {
    const parent = await manager.createSession({
      id: 'parent-1',
      name: 'Parent',
    });

    await manager.createSession({
      id: 'child-1',
      name: 'Child 1',
      parentSessionId: 'parent-1',
    });

    await manager.createSession({
      id: 'child-2',
      name: 'Child 2',
      parentSessionId: 'parent-1',
    });

    // Delete parent
    await manager.deleteSession('parent-1', { cascade: true });

    // Verify children are deleted
    const child1 = await manager.getSession('child-1');
    const child2 = await manager.getSession('child-2');

    expect(child1).toBeNull();
    expect(child2).toBeNull();
  });

  it('should prevent delete with children unless cascade is true', async () => {
    const parent = await manager.createSession({
      id: 'parent-1',
      name: 'Parent',
    });

    await manager.createSession({
      id: 'child-1',
      name: 'Child',
      parentSessionId: 'parent-1',
    });

    const result = await manager.deleteSession('parent-1', { cascade: false });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Cannot delete session with children');
    }
  });
});
```

### 6.3 Hierarchy Traversal Testing

```typescript
describe('Session Hierarchy Traversal', () => {
  it('should retrieve all ancestors', async () => {
    const root = await manager.createSession({ id: 'root', name: 'Root' });
    const child1 = await manager.createSession({
      id: 'child1',
      name: 'Child 1',
      parentSessionId: 'root',
    });
    const child2 = await manager.createSession({
      id: 'child2',
      name: 'Child 2',
      parentSessionId: 'child1',
    });

    const ancestors = await manager.getAncestors('child2');

    expect(ancestors).toHaveLength(2);
    expect(ancestors[0].id).toBe('child1');
    expect(ancestors[1].id).toBe('root');
  });

  it('should retrieve all descendants', async () => {
    const root = await manager.createSession({ id: 'root', name: 'Root' });

    await manager.createSession({
      id: 'child1',
      name: 'Child 1',
      parentSessionId: 'root',
    });
    await manager.createSession({
      id: 'child2',
      name: 'Child 2',
      parentSessionId: 'root',
    });
    await manager.createSession({
      id: 'grandchild1',
      name: 'Grandchild 1',
      parentSessionId: 'child1',
    });

    const descendants = await manager.getDescendants('root');

    expect(descendants).toHaveLength(3);
    const ids = descendants.map(d => d.id);
    expect(ids).toContain('child1');
    expect(ids).toContain('child2');
    expect(ids).toContain('grandchild1');
  });

  it('should calculate hierarchy depth correctly', async () => {
    const root = await manager.createSession({ id: 'root', name: 'Root' });
    const child1 = await manager.createSession({
      id: 'child1',
      parentSessionId: 'root',
    });
    const child2 = await manager.createSession({
      id: 'child2',
      parentSessionId: 'child1',
    });

    expect(await manager.getDepth('root')).toBe(0);
    expect(await manager.getDepth('child1')).toBe(1);
    expect(await manager.getDepth('child2')).toBe(2);
  });
});
```

---

## 7. Testing Batch Update Systems and Atomic Flush Operations

### 7.1 Batch Update Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BatchUpdateManager } from '@/batch/manager';

describe('Batch Update System', () => {
  let manager: BatchUpdateManager;

  beforeEach(() => {
    manager = new BatchUpdateManager();
  });

  it('should accumulate updates before flush', async () => {
    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-1',
      changes: { status: 'in_progress' },
    });

    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-2',
      changes: { status: 'completed' },
    });

    expect(manager.getPendingUpdates()).toHaveLength(2);
    expect(manager.getFlushedUpdates()).toHaveLength(0);
  });

  it('should flush all updates atomically', async () => {
    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-1',
      changes: { status: 'in_progress' },
    });

    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-2',
      changes: { status: 'completed' },
    });

    const flushResult = await manager.flush();

    expect(flushResult.success).toBe(true);
    expect(manager.getPendingUpdates()).toHaveLength(0);
    expect(manager.getFlushedUpdates()).toHaveLength(2);
  });

  it('should handle mixed operation types', async () => {
    await manager.queueUpdate({
      type: 'create',
      entityType: 'task',
      data: { id: 'task-3', title: 'New Task' },
    });

    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-1',
      changes: { status: 'completed' },
    });

    await manager.queueUpdate({
      type: 'delete',
      entityType: 'task',
      entityId: 'task-2',
    });

    const flushResult = await manager.flush();

    expect(flushResult.success).toBe(true);
    expect(flushResult.data).toHaveLength(3);
  });
});
```

### 7.2 Atomic Flush Testing

```typescript
describe('Atomic Flush Operations', () => {
  it('should not apply any updates if one fails', async () => {
    // Create valid updates
    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-1',
      changes: { status: 'completed' },
    });

    // Create invalid update (non-existent entity)
    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'non-existent-task',
      changes: { status: 'in_progress' },
    });

    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-2',
      changes: { status: 'completed' },
    });

    const flushResult = await manager.flush();

    expect(flushResult.success).toBe(false);

    // Verify no updates were applied
    const task1 = await entityManager.getTask('task-1');
    const task2 = await entityManager.getTask('task-2');
    expect(task1.status).not.toBe('completed');
    expect(task2.status).not.toBe('completed');
  });

  it('should provide detailed error information on failure', async () => {
    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'invalid-task',
      changes: { status: 'invalid' },
    });

    const flushResult = await manager.flush();

    expect(flushResult.success).toBe(false);
    if (!flushResult.success) {
      expect(flushResult.error.failedOperation).toBeDefined();
      expect(flushResult.error.reason).toBeDefined();
    }
  });

  it('should support retry logic for transient failures', async () => {
    let attempts = 0;

    // Mock a transient failure
    manager.onFlush(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Transient error');
      }
      return { success: true };
    });

    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-1',
      changes: { status: 'completed' },
    });

    const flushResult = await manager.flush({ retries: 3 });

    expect(flushResult.success).toBe(true);
    expect(attempts).toBe(3);
  });
});
```

### 7.3 Concurrency Testing

```typescript
describe('Batch Update Concurrency', () => {
  it('should handle concurrent flush operations', async () => {
    // Queue updates
    for (let i = 0; i < 10; i++) {
      await manager.queueUpdate({
        type: 'update',
        entityType: 'task',
        entityId: `task-${i}`,
        changes: { status: 'completed' },
      });
    }

    // Trigger concurrent flushes
    const flushPromises = [
      manager.flush(),
      manager.flush(),
      manager.flush(),
    ];

    const results = await Promise.all(flushPromises);

    // Only one should succeed, others should see no pending updates
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBe(1);
  });

  it('should maintain order of operations within a batch', async () => {
    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-1',
      changes: { status: 'in_progress', step: 1 },
    });

    await manager.queueUpdate({
      type: 'update',
      entityType: 'task',
      entityId: 'task-1',
      changes: { status: 'completed', step: 2 },
    });

    await manager.flush();

    const task = await entityManager.getTask('task-1');
    expect(task.step).toBe(2); // Last update should win
  });
});
```

### 7.4 Performance and Scaling Testing

```typescript
describe('Batch Update Performance', () => {
  it('should handle large batches efficiently', async () => {
    const startTime = Date.now();

    // Queue 1000 updates
    for (let i = 0; i < 1000; i++) {
      await manager.queueUpdate({
        type: 'update',
        entityType: 'task',
        entityId: `task-${i}`,
        changes: { status: 'completed' },
      });
    }

    const flushResult = await manager.flush();
    const duration = Date.now() - startTime;

    expect(flushResult.success).toBe(true);
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  it('should provide batch progress feedback', async () => {
    const progressUpdates: number[] = [];

    manager.onProgress((progress) => {
      progressUpdates.push(progress);
    });

    for (let i = 0; i < 100; i++) {
      await manager.queueUpdate({
        type: 'update',
        entityType: 'task',
        entityId: `task-${i}`,
        changes: { status: 'completed' },
      });
    }

    await manager.flush();

    expect(progressUpdates.length).toBe.greaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });
});
```

---

## 8. Common Pitfalls to Avoid

### 8.1 Testing Pitfalls

#### Pitfall 1: Not Cleaning Up Test Artifacts
```typescript
// BAD: Tests leave files behind
it('should save session', async () => {
  await saveSession('/tmp/test.json', data);
  // No cleanup - test files accumulate
});

// GOOD: Always clean up
it('should save session', async () => {
  const testFile = path.join(testDir, 'test.json');
  await saveSession(testFile, data);
  // Cleanup in afterEach
});
```

#### Pitfall 2: Testing Implementation Details
```typescript
// BAD: Testing internal structure
it('should have internal _cache property', () => {
  expect(loader._cache).toBeDefined();
});

// GOOD: Testing behavior
it('should cache loaded sessions', async () => {
  await loader.load('session-1');
  await loader.load('session-1');
  expect(loader.loadCallCount).toBe(1); // Only called once
});
```

#### Pitfall 3: Not Testing Error Paths
```typescript
// BAD: Only testing success
it('should load session', async () => {
  const result = await loadSession('valid.json');
  expect(result.success).toBe(true);
});

// GOOD: Testing both success and failure
it('should load valid session', async () => {
  const result = await loadSession('valid.json');
  expect(result.success).toBe(true);
});

it('should handle invalid session', async () => {
  const result = await loadSession('invalid.json');
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

#### Pitfall 4: Brittle Test Data
```typescript
// BAD: Hardcoded values throughout
it('should validate session', () => {
  expect(validate('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
});

// GOOD: Using fixtures and helpers
it('should validate session', () => {
  const validId = generateValidUUID();
  expect(validate(validId)).toBe(true);
});
```

### 8.2 Zod-Specific Pitfalls

#### Pitfall 1: Not Using `safeParse` in Tests
```typescript
// BAD: Will throw and crash test
it('should validate', () => {
  const result = schema.parse(data);
  expect(result).toBeDefined();
});

// GOOD: Use safeParse for proper error handling
it('should validate', () => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
});
```

#### Pitfall 2: Ignoring Error Context
```typescript
// BAD: Not checking what failed
it('should fail validation', () => {
  const result = schema.safeParse(invalidData);
  expect(result.success).toBe(false);
});

// GOOD: Verify specific errors
it('should fail validation for missing field', () => {
  const result = schema.safeParse(invalidData);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toContain('requiredField');
  }
});
```

### 8.3 Filesystem Testing Pitfalls

#### Pitfall 1: Testing Against Real Project Files
```typescript
// BAD: Tests modify actual project files
it('should save session', async () => {
  await saveSession('./sessions/session.json', data);
});

// GOOD: Use isolated test directories
it('should save session', async () => {
  await saveSession(path.join(testDir, 'session.json'), data);
});
```

#### Pitfall 2: Race Conditions in Cleanup
```typescript
// BAD: Cleanup doesn't wait for async operations
afterEach(() => {
  fs.rm(testDir); // Not awaited!
});

// GOOD: Properly await cleanup
afterEach(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});
```

### 8.4 Hierarchical Data Pitfalls

#### Pitfall 1: Not Testing Deep Nesting
```typescript
// BAD: Only testing shallow structures
it('should validate hierarchy', () => {
  const result = validate({ phases: [{ milestones: [] }] });
  expect(result.success).toBe(true);
});

// GOOD: Testing full depth
it('should validate deep hierarchy', () => {
  const result = validate({
    phases: [{
      milestones: [{
        tasks: [{
          subtasks: [{ id: 'subtask-1' }]
        }]
      }]
    }]
  });
  expect(result.success).toBe(true);
});
```

#### Pitfall 2: Not Testing Orphan Detection
```typescript
// GOOD: Always verify referential integrity
it('should detect orphaned tasks', async () => {
  const data = {
    phases: [],
    tasks: [{ id: 'task-1', milestoneId: 'non-existent' }]
  };

  const result = await validate(data);
  expect(result.success).toBe(false);
});
```

---

## 9. Additional Resources

### 9.1 Official Documentation

- **Zod Documentation**: https://zod.dev/
  - Comprehensive guide to schema validation
  - Error handling best practices
  - Custom refinement examples

- **Vitest Documentation**: https://vitest.dev/
  - Testing framework features
  - Mocking and spying
  - Filesystem testing utilities

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
  - Type system best practices
  - Generic type testing patterns

### 9.2 Community Resources

- **Testing Library**: https://testing-library.com/
  - User-centric testing patterns
  - Async testing utilities

- **Mock Filesystems**:
  - `memfs`: https://github.com/streamich/memfs
  - In-memory filesystem for faster tests

### 9.3 Recommended Reading

#### Books:
- "Working Effectively with Legacy Code" by Michael Feathers
- "Test-Driven Development" by Kent Beck
- "The Art of Unit Testing" by Roy Osherove

#### Blog Posts & Articles:
- "Testing Asynchronous Code with Vitest"
- "Best Practices for Schema Validation Testing"
- "Integration Testing with Real Filesystems"
- "Testing Hierarchical Data Structures"

### 9.4 Code Examples Repositories

- **Zod Examples**: Search GitHub for "zod schema validation examples"
- **Vitest Examples**: https://github.com/vitest-dev/vitest/tree/main/examples
- **Testing Patterns**: https://github.com/goldbergyoni/javascript-testing-best-practices

---

## Summary

This research document provides comprehensive patterns and best practices for testing:

1. **JSON file loading and parsing** - Focus on both success and failure cases, proper error handling, and edge cases
2. **Zod validation in Vitest** - Use `safeParse`, test refinements and transforms, validate error messages
3. **Hierarchical data restoration** - Test complete hierarchies, parent-child relationships, and referential integrity
4. **Session state persistence** - Round-trip testing, concurrency handling, data integrity
5. **Filesystem integration tests** - Use temporary directories, test permissions, implement atomic writes
6. **Parent-child relationships** - Validate references, prevent circular dependencies, test cascade operations
7. **Batch update systems** - Test atomicity, handle failures, verify ordering, measure performance

### Key Takeaways:

- **Always test both success and failure paths**
- **Use helper functions to reduce test code duplication**
- **Test edge cases and boundary conditions**
- **Clean up test artifacts properly**
- **Use in-memory filesystems when possible for faster tests**
- **Verify referential integrity in hierarchical data**
- **Test concurrency and race conditions**
- **Provide detailed error information for failures**
- **Measure and assert on performance characteristics**
- **Avoid testing implementation details, focus on behavior**

### Next Steps:

1. Review existing test coverage and identify gaps
2. Implement recommended patterns for missing test scenarios
3. Add helper functions for common test operations
4. Create comprehensive fixture files for edge cases
5. Set up proper test cleanup and isolation
6. Add performance benchmarks for critical operations
7. Implement integration tests with real filesystem operations
8. Add concurrent operation tests for session management
9. Create test utilities for batch operation testing
10. Document testing patterns in team guidelines

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Maintained By:** Development Team
