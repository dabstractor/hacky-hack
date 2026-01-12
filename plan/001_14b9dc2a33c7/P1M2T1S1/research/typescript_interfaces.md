# TypeScript Interface Best Practices for Hierarchical Task Models

> Research compiled: January 12, 2026
> Focus: TypeScript 5.2+, hierarchical task models, union types, immutability, documentation patterns, and naming conventions

---

## Table of Contents

1. [TypeScript 5.2+ Interface Best Practices](#typescript-52-interface-best-practices)
2. [Union Types and Discriminated Unions for Task Hierarchies](#union-types-and-discriminated-unions)
3. [Readonly Properties and Immutability Patterns](#readonly-properties-and-immutability)
4. [JSDoc Documentation Patterns](#jsdoc-documentation-patterns)
5. [Naming Conventions](#naming-conventions)
6. [Example: Complete Hierarchical Task Model](#complete-example)
7. [References and Resources](#references)

---

## TypeScript 5.2+ Interface Best Practices

### Core Interface Design Principles

**1. Prefer Interfaces for Object Shapes That May Be Extended**

```typescript
// ✅ Good: Use interface for shapes that may be extended
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

// Can be extended
interface RecurringTask extends Task {
  recurrence: RecurrencePattern;
}

// ✅ Good: Use type for unions and computed types
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
type TaskWithMetadata = Task & { createdAt: Date; updatedAt: Date };
```

**2. Use Strict Property Declaration Order**

Organize interface properties in this order:
1. Required primitive properties
2. Optional primitive properties
3. Required object/array properties
4. Optional object/array properties
5. Methods

```typescript
interface Task {
  // Required primitives
  id: string;
  title: string;
  priority: number;

  // Optional primitives
  description?: string;
  estimatedHours?: number;

  // Required objects
  assignee: User;
  tags: readonly string[];

  // Optional objects
  dependencies?: readonly Task[];
  subtasks?: readonly SubTask[];

  // Methods
  clone(): Task;
  isDependentOn(taskId: string): boolean;
}
```

**3. Leverage TypeScript 5.2+ Features**

```typescript
// using declaration for resource management (TypeScript 5.2+)
interface TaskRepository {
  dispose(): void;
}

function withTaskRepository<T>(
  repo: TaskRepository,
  callback: () => T
): T {
  try {
    return callback();
  } finally {
    repo.dispose();
  }
}

// Improved type inference in method signatures
interface TaskManager {
  // TypeScript 5.2+ better inference for generic methods
  create<T extends Task>(type: TaskType, config: Omit<T, 'id'>): T;
  find<T extends Task>(id: string): T | undefined;
}
```

**4. Use Utility Types for Interface Composition**

```typescript
interface CreateTaskDto {
  title: string;
  description: string;
  priority: number;
  assigneeId: string;
}

// Use Omit to exclude derived fields
type TaskInput = Omit<CreateTaskDto, 'assigneeId'> & { assignee: User };

// Use Partial for updates
type TaskUpdate = Partial<Omit<Task, 'id'>>;

// Use Required to enforce all optional properties
type CompleteTask = Required<Task>;

// Use Readonly for immutability
type ImmutableTask = Readonly<Task>;
```

---

## Union Types and Discriminated Unions

### Discriminated Unions for Task Hierarchies

Discriminated unions (also called tagged unions) are the most powerful pattern for modeling hierarchical task structures.

**Basic Pattern:**

```typescript
// Discriminator field - usually 'kind', 'type', or 'tag'
type Task =
  | { kind: 'simple'; id: string; title: string; status: TaskStatus }
  | { kind: 'recurring'; id: string; title: string; recurrence: RecurrencePattern }
  | { kind: 'grouped'; id: string; title: string; subtasks: readonly Task[] };

// Type narrowing works automatically
function processTask(task: Task): void {
  switch (task.kind) {
    case 'simple':
      // TypeScript knows task has 'status' property
      console.log(task.status);
      break;
    case 'recurring':
      // TypeScript knows task has 'recurrence' property
      console.log(task.recurrence.frequency);
      break;
    case 'grouped':
      // TypeScript knows task has 'subtasks' property
      task.subtasks.forEach(t => processTask(t));
      break;
  }
}
```

**Advanced Pattern with Shared Properties:**

```typescript
// Base interface with shared properties
interface BaseTask {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
  readonly priority: number;
}

// Discriminated union with base
type Task =
  | BaseTask & { kind: 'one-time'; dueDate: Date; completedAt?: Date }
  | BaseTask & { kind: 'recurring'; recurrence: RecurrencePattern; nextOccurrence: Date }
  | BaseTask & { kind: 'milestone'; targetDate: Date; dependencies: readonly string[] }
  | BaseTask & { kind: 'parent'; children: readonly Task[]; completionThreshold: number };

// Helper type for extracting specific task kinds
type OneTimeTask = Extract<Task, { kind: 'one-time' }>;
type RecurringTask = Extract<Task, { kind: 'recurring' }>;

// Helper type for removing specific kinds
type NonParentTask = Exclude<Task, { kind: 'parent' }>;
```

**Generic Task Wrapper Pattern:**

```typescript
interface TaskData<T extends TaskKind = TaskKind> {
  readonly kind: T;
  readonly id: string;
  readonly title: string;
  readonly data: TaskDataByKind[T];
}

type TaskKind = 'simple' | 'recurring' | 'milestone' | 'parent';

interface TaskDataByKind {
  simple: {
    dueDate?: Date;
    completedAt?: Date;
  };
  recurring: {
    recurrence: RecurrencePattern;
    nextOccurrence: Date;
    occurrenceCount: number;
  };
  milestone: {
    targetDate: Date;
    dependencies: readonly string[];
  };
  parent: {
    children: readonly string[];
    completionThreshold: number;
  };
}

// Usage
const simpleTask: TaskData<'simple'> = {
  kind: 'simple',
  id: 't1',
  title: 'Complete documentation',
  data: {
    dueDate: new Date('2026-01-15'),
    completedAt: undefined,
  },
};
```

**Exhaustive Checking Pattern:**

```typescript
function getTaskColor(task: Task): string {
  switch (task.kind) {
    case 'one-time':
      return task.completedAt ? 'green' : 'blue';
    case 'recurring':
      return 'purple';
    case 'milestone':
      return 'orange';
    case 'parent':
      return 'gray';
    default:
      // TypeScript enforces exhaustiveness at compile time
      const _exhaustiveCheck: never = task;
      return _exhaustiveCheck;
  }
}

// Or use assertion function
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function processTaskExhaustively(task: Task): void {
  switch (task.kind) {
    case 'one-time':
      // handle one-time
      break;
    case 'recurring':
      // handle recurring
      break;
    case 'milestone':
      // handle milestone
      break;
    case 'parent':
      // handle parent
      break;
    default:
      assertNever(task);
  }
}
```

**Recursive Task Hierarchy Pattern:**

```typescript
interface LeafTask {
  type: 'leaf';
  id: string;
  title: string;
  completed: boolean;
}

interface ParentTask {
  type: 'parent';
  id: string;
  title: string;
  children: readonly TaskNode[];
  allCompleted: boolean;
}

type TaskNode = LeafTask | ParentTask;

// Type-safe recursive processing
function countIncompleteTasks(node: TaskNode): number {
  switch (node.type) {
    case 'leaf':
      return node.completed ? 0 : 1;
    case 'parent':
      return node.children.reduce(
        (sum, child) => sum + countIncompleteTasks(child),
        0
      );
  }
}

// Type-safe recursive transformation
function mapTaskIds(node: TaskNode): string[] {
  switch (node.type) {
    case 'leaf':
      return [node.id];
    case 'parent':
      return [node.id, ...node.children.flatMap(mapTaskIds)];
  }
}
```

---

## Readonly Properties and Immutability

### Core Immutability Patterns

**1. Interface-Level Readonly Properties**

```typescript
interface Task {
  // Always readonly - identity never changes
  readonly id: string;
  readonly createdAt: Date;

  // Mutable - can change over lifecycle
  title: string;
  status: TaskStatus;

  // Conditionally readonly
  readonly createdBy: User;
  assignedTo?: User;
}

// Immutability enforcement
function updateTaskTitle(task: Task, newTitle: string): Task {
  return {
    ...task,
    title: newTitle,
    // ✅ spread preserves readonly properties
  };
}

// ❌ Compile error - cannot reassign readonly property
task.id = 'new-id'; // Error: Cannot assign to 'id' because it is a read-only property
```

**2. Shallow Readonly with Utility Types**

```typescript
interface Task {
  id: string;
  title: string;
  subtasks: SubTask[];
  metadata: Metadata;
}

// All properties become readonly
type ImmutableTask = Readonly<Task>;

// Equivalent to:
interface ImmutableTask {
  readonly id: string;
  readonly title: string;
  readonly subtasks: SubTask[];  // ⚠️ Array contents still mutable
  readonly metadata: Metadata;    // ⚠️ Object properties still mutable
}
```

**3. Deep Immutability Patterns**

```typescript
// Deeply readonly pattern
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

interface Task {
  id: string;
  title: string;
  subtasks: SubTask[];
  metadata: {
    tags: string[];
    customFields: Record<string, unknown>;
  };
}

type CompletelyImmutableTask = DeepReadonly<Task>;

// Now nested objects/arrays are also readonly
const task: CompletelyImmutableTask = {
  id: 't1',
  title: 'Task',
  subtasks: [],
  metadata: {
    tags: [],
    customFields: {},
  },
};

// ❌ All of these are compile errors
task.id = 'new-id';
task.subtasks.push({});
task.metadata.tags.push('tag');
```

**4. Readonly Arrays and Collections**

```typescript
interface TaskList {
  readonly tasks: readonly Task[];  // Preferred syntax
  // or
  readonly tasks: ReadonlyArray<Task>;
}

// Methods that preserve readonly
function addTask(list: TaskList, task: Task): TaskList {
  return {
    ...list,
    tasks: [...list.tasks, task],  // ✅ Creates new array
  };
}

// Type narrowing for mutable arrays
function processTasks(tasks: readonly Task[]): void {
  // ❌ Cannot mutate
  tasks.push({});  // Error: Property 'push' does not exist on type 'readonly Task[]'

  // ✅ Can read
  tasks.forEach(t => console.log(t.title));

  // ✅ Can create mutable copy if needed
  const mutableCopy = [...tasks];
  mutableCopy.push({});
}
```

**5. Immutability in Method Signatures**

```typescript
interface TaskRepository {
  // Return readonly to prevent mutation
  findAll(): readonly Task[];
  findById(id: string): Readonly<Task> | undefined;

  // Accept readonly input, return new instance
  update(task: Readonly<Task>, updates: Partial<Task>): Task;

  // Readonly as signal of no modification
  validate(task: Readonly<Task>): ValidationResult;
}

interface TaskService {
  // Chain operations with immutable returns
  withStatus(status: TaskStatus): Task;
  withAssignee(user: User): Task;
  withPriority(priority: number): Task;
}

// Usage
const updatedTask = task
  .withStatus('in-progress')
  .withAssignee(currentUser)
  .withPriority(1);
```

**6. Builder Pattern with Immutable Transitions**

```typescript
interface TaskBuilder {
  readonly state: Partial<Readonly<Task>>;

  withId(id: string): TaskBuilder;
  withTitle(title: string): TaskBuilder;
  withDescription(description: string): TaskBuilder;
  build(): Task;
}

class ImmutableTaskBuilder implements TaskBuilder {
  constructor(public readonly state: Partial<Readonly<Task>> = {}) {}

  withId(id: string): TaskBuilder {
    return new ImmutableTaskBuilder({ ...this.state, id });
  }

  withTitle(title: string): TaskBuilder {
    return new ImmutableTaskBuilder({ ...this.state, title });
  }

  withDescription(description: string): TaskBuilder {
    return new ImmutableTaskBuilder({ ...this.state, description });
  }

  build(): Task {
    if (!this.state.id || !this.state.title) {
      throw new Error('Required fields missing');
    }
    return {
      id: this.state.id,
      title: this.state.title,
      description: this.state.description ?? '',
      createdAt: new Date(),
    };
  }
}

// Usage
const task = new ImmutableTaskBuilder()
  .withId('t1')
  .withTitle('New Task')
  .withDescription('Description')
  .build();
```

---

## JSDoc Documentation Patterns

### Interface and Type Documentation

**1. Basic Interface Documentation**

```typescript
/**
 * Represents a task in the task management system.
 *
 * @example
 * ```typescript
 * const task: Task = {
 *   id: 't1',
 *   title: 'Complete documentation',
 *   status: 'in-progress',
 *   createdAt: new Date(),
 * };
 * ```
 */
interface Task {
  /**
   * Unique identifier for the task.
   * Generated by the system and should never be modified.
   *
   * @format uuid
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  readonly id: string;

  /**
   * Human-readable title of the task.
   * Should be concise but descriptive.
   *
   * @minLength 1
   * @maxLength 200
   * @example 'Complete project documentation'
   */
  title: string;

  /**
   * Detailed description of the task requirements.
   * Supports markdown formatting.
   *
   * @optional
   */
  description?: string;

  /**
   * Current status of the task in its lifecycle.
   *
   * @default 'pending'
   */
  status: TaskStatus;
}
```

**2. Enum and Union Type Documentation**

```typescript
/**
 * Possible states for a task in its lifecycle.
 *
 * - `pending`: Task is not yet started
 * - `in-progress`: Task is actively being worked on
 * - `completed`: Task has been finished
 * - `blocked`: Task cannot proceed due to dependencies
 * - `cancelled`: Task was cancelled and will not be completed
 *
 * @example
 * ```typescript
 * const status: TaskStatus = 'in-progress';
 * ```
 */
type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'blocked'
  | 'cancelled';

/**
 * Priority levels for task ordering and importance.
 *
 * @remarks
 * Lower numeric values indicate higher priority.
 * Priority 1 is the highest, Priority 5 is the lowest.
 *
 * @example
 * ```typescript
 * const urgentTask: Task = { priority: 1 };
 * const lowPriorityTask: Task = { priority: 5 };
 * ```
 */
type TaskPriority = 1 | 2 | 3 | 4 | 5;
```

**3. Generic Type Documentation**

```typescript
/**
 * Base interface for all repository types.
 *
 * @template T - The entity type this repository manages.
 *   Must have a readonly `id` property of type string.
 *
 * @example
 * ```typescript
 * interface TaskRepository extends Repository<Task> {
 *   findByStatus(status: TaskStatus): Task[];
 * }
 * ```
 */
interface Repository<T extends { readonly id: string }> {
  /**
   * Finds an entity by its unique identifier.
   *
   * @param id - The unique identifier of the entity.
   * @returns The entity if found, otherwise undefined.
   *
   * @example
   * ```typescript
   * const task = await taskRepository.findById('t1');
   * if (task) {
   *   console.log(task.title);
   * }
   * ```
   */
  findById(id: string): Promise<T | undefined>;

  /**
   * Retrieves all entities from the repository.
   *
   * @returns A readonly array of all entities.
   * The array is shallow readonly to prevent accidental mutations.
   */
  findAll(): Promise<readonly T[]>;

  /**
   * Saves an entity to the repository.
   *
   * @param entity - The entity to save. Must be a complete entity definition.
   * @returns The saved entity, potentially with generated fields populated.
   * @throws {ValidationError} If the entity fails validation.
   *
   * @example
   * ```typescript
   * const newTask = await taskRepository.save({
   *   id: generateId(),
   *   title: 'New task',
   *   status: 'pending',
   * });
   * ```
   */
  save(entity: T): Promise<T>;

  /**
   * Updates specific fields of an entity.
   *
   * @template K - Tuple of property names to update.
   * @param id - The entity's unique identifier.
   * @param updates - Partial updates to apply to the entity.
   * @returns The updated entity.
   * @throws {NotFoundError} If no entity exists with the given ID.
   */
  update<K extends keyof T>(
    id: string,
    updates: Pick<T, K>
  ): Promise<T>;
}
```

**4. Method and Parameter Documentation**

```typescript
interface TaskService {
  /**
   * Creates a new task with the provided configuration.
   *
   * @param config - Configuration for the new task.
   * @param config.title - The task title (required).
   * @param config.description - Optional detailed description.
   * @param config.priority - Task priority from 1-5 (default: 3).
   * @param config.assigneeId - ID of the user assigned to this task.
   * @param options - Additional options for task creation.
   * @param options.validateOnly - If true, only validate without creating.
   * @param options.notifyAssignee - If true, send notification to assignee.
   *
   * @returns The created task with generated ID and timestamps.
   *
   * @throws {ValidationError} If configuration is invalid.
   * @throws {AuthError} If user lacks permission to create tasks.
   *
   * @example
   * ```typescript
   * const task = await taskService.create({
   *   title: 'Review PR #123',
   *   description: 'Check for proper error handling',
   *   priority: 2,
   *   assigneeId: 'user-456',
   * }, {
   *   notifyAssignee: true,
   * });
   * ```
   */
  create(
    config: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      assigneeId: string;
    },
    options?: {
      validateOnly?: boolean;
      notifyAssignee?: boolean;
    }
  ): Promise<Task>;

  /**
   * Finds tasks matching the specified criteria.
   *
   * @param criteria - Filter criteria for the search.
   * All properties are optional - omitting a property means "any value".
   *
   * @returns Array of matching tasks, ordered by creation date (newest first).
   * Returns empty array if no matches found.
   *
   * @remarks
   * This method performs a case-insensitive search on string fields.
   * Date ranges are inclusive of both start and end dates.
   *
   * @example
   * ```typescript
   * // Find all high-priority in-progress tasks assigned to user
   * const tasks = await taskService.find({
   *   status: 'in-progress',
   *   priority: [1, 2],
   *   assigneeId: 'user-123',
   * });
   *
   * // Find all tasks due this week
   * const thisWeek = await taskService.find({
   *   dueDate: {
   *     start: startOfWeek(new Date()),
   *     end: endOfWeek(new Date()),
   *   },
   * });
   * ```
   */
  find(criteria: TaskSearchCriteria): Promise<readonly Task[]>;
}
```

**5. Type Guards and Predicate Documentation**

```typescript
/**
 * Checks if a task is completable based on its current state.
 *
 * A task is completable if:
 * - It is not already completed
 * - It is not blocked
 * - All its dependencies are satisfied
 *
 * @param task - The task to check.
 * @returns `true` if the task can be completed, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isTaskCompletable(task)) {
 *   await completeTask(task.id);
 * }
 * ```
 */
function isTaskCompletable(task: Task): task is CompletableTask {
  return (
    task.status !== 'completed' &&
    task.status !== 'blocked' &&
    areDependenciesSatisfied(task)
  );
}

/**
 * Type guard to check if a task is a parent task with subtasks.
 *
 * @param task - The task to check.
 * @returns `true` if the task has subtasks, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isParentTask(task)) {
 *   // TypeScript knows task has `subtasks` property
 *   const totalProgress = calculateParentProgress(task.subtasks);
 * }
 * ```
 */
function isParentTask(task: Task): task is ParentTask {
  return 'subtasks' in task && task.subtasks.length > 0;
}
```

**6. Callback and Event Documentation**

```typescript
/**
 * Callback function invoked when a task changes status.
 *
 * @param event - Details about the status change event.
 * @param event.taskId - ID of the task that changed.
 * @param event.oldStatus - The previous status.
 * @param event.newStatus - The new status.
 * @param event.changedAt - Timestamp when the change occurred.
 * @param event.changedBy - User who made the change.
 *
 * @returns Optionally returns a promise that resolves when callback processing is complete.
 *
 * @example
 * ```typescript
 * function handleStatusChange(event: StatusChangeEvent): void {
 *   console.log(`Task ${event.taskId} changed from ${event.oldStatus} to ${event.newStatus}`);
 *   sendNotification(event);
 * }
 *
 * taskService.onStatusChange(handleStatusChange);
 * ```
 */
type StatusChangeCallback = (
  event: Readonly<{
    taskId: string;
    oldStatus: TaskStatus;
    newStatus: TaskStatus;
    changedAt: Date;
    changedBy: User;
  }>
) => void | Promise<void>;

/**
 * Registers a callback to be invoked when tasks are modified.
 *
 * @param event - The type of event to listen for.
 * @param callback - The function to call when the event occurs.
 * @returns A function that, when called, unsubscribes the callback.
 *
 * @example
 * ```typescript
 * const unsubscribe = taskService.on(
 *   'status-change',
 *   async (event) => {
 *     await analytics.track('task_status_changed', event);
 *   }
 * );
 *
 * // Later, to unsubscribe:
 * unsubscribe();
 * ```
 */
on(event: 'status-change', callback: StatusChangeCallback): () => void;
```

**7. @see and @deprecated Tags**

```typescript
/**
 * @deprecated Use {@link TaskService.create} instead.
 * This method will be removed in version 3.0.
 *
 * @remarks
 * The old method had issues with transaction handling.
 * Migrate to the new API which provides better error handling.
 *
 * @example
 * ```typescript
 * // Old way (deprecated):
 * const task = await createTask(config);
 *
 * // New way:
 * const task = await taskService.create(config);
 * ```
 */
function createTask(config: TaskConfig): Promise<Task> {
  // Implementation...
}

/**
 * Gets all tasks assigned to a specific user.
 *
 * @param userId - The ID of the user.
 * @returns Array of tasks assigned to the user.
 *
 * @see {@link getTasksByStatus} for filtering by status.
 * @see {@link getTasksByProject} for filtering by project.
 *
 * @example
 * ```typescript
 * // Get user's tasks
 * const userTasks = await getTasksByUser('user-123');
 *
 * // Combine with other filters:
 * const myCompletedTasks = await getTasksByStatus('completed')
 *   .then(tasks => tasks.filter(t => t.assigneeId === 'user-123'));
 * ```
 */
function getTasksByUser(userId: string): Promise<readonly Task[]>;
```

---

## Naming Conventions

### Interface Naming

**1. PascalCase for All Types**

```typescript
// ✅ Good - PascalCase for interfaces
interface Task {}
interface TaskRepository {}
interface UserProfile {}
interface HttpResponse {}

// ❌ Bad - camelCase or other
interface task {}
interface task_repository {}
interface TASK {}
```

**2. The Interface "I" Prefix Debate**

```typescript
// ❌ NOT RECOMMENDED in modern TypeScript
interface IUser {}
interface ITaskRepository {}
interface IHttpResponse {}

// ✅ RECOMMENDED - No prefix, cleaner code
interface User {}
interface TaskRepository {}
interface HttpResponse {}

// If you need to differentiate from implementation:
interface TaskRepository {
  findAll(): readonly Task[];
}

class InMemoryTaskRepository implements TaskRepository {
  findAll(): readonly Task[] {
    return [];
  }
}

class DatabaseTaskRepository implements TaskRepository {
  findAll(): readonly Task[] {
    return db.query('SELECT * FROM tasks');
  }
}
```

**Rationale against "I" prefix:**
- TypeScript has structural typing, not nominal typing
- The prefix doesn't provide additional type safety
- Makes code more verbose without adding clarity
- Not aligned with modern TypeScript community standards

**Exception:** Some teams adopt the "I" prefix when working in polyglot environments where C# or Java conventions dominate.

**3. Descriptive, Domain-Specific Names**

```typescript
// ✅ Good - Descriptive and domain-specific
interface ProjectMilestone {}
interface SprintBurndown {}
interface UserStory {}
interface AcceptanceCriteria {}

// ❌ Bad - Generic or vague
interface Item {}
interface Data {}
interface Thing {}
interface Manager {}
```

**4. Operation-Based Naming Patterns**

```typescript
// ✅ Noun-based for data structures
interface Task {}
interface User {}
interface Project {}

// ✅ Verb-based for operations and actions
interface TaskCreator {}
interface TaskValidator {}
interface TaskTransformer {}

// ❌ Don't use verbs for data structures
interface CreateTask {}  // Confusing - is this the action or the result?
interface ValidateTask  // Better: TaskValidation or ValidationResult
```

**5. Type Alias Naming**

```typescript
// ✅ PascalCase for type aliases
type TaskStatus = 'pending' | 'in-progress' | 'completed';
type TaskPriority = 1 | 2 | 3 | 4 | 5;
type TaskId = string;
type Timestamp = number;

// ✅ Descriptive names for union types
type Task = OneTimeTask | RecurringTask | MilestoneTask;
type TaskEvent = TaskCreatedEvent | TaskUpdatedEvent | TaskDeletedEvent;

// ✅ Use 'T' prefix for generic type parameters when meaningful
type TaskMap<T extends Task> = Map<string, T>;
type TaskResult<T, E = Error> = Result<T, E>;

// ✅ Or use descriptive generic parameter names
type Repository<Entity extends { id: string }> = { /* ... */ };
type Response<Data, ErrorType = Error> = { /* ... */ };

// ❌ Avoid single-letter generics unless very conventional
type Map<K, V>  // Acceptable - very conventional
type TaskMap<T>  // Good - domain-specific
type M<A, B, C>  // Bad - unclear what these represent
```

**6. Enum Naming**

```typescript
// ✅ PascalCase for enum types
enum TaskStatus {
  Pending,
  InProgress,
  Completed,
  Blocked,
  Cancelled,
}

// ✅ camelCase for enum values (common pattern)
enum NotificationType {
  email = 'email',
  sms = 'sms',
  push = 'push',
  inApp = 'in-app',
}

// Alternative: SCREAMING_CASE for string enums
enum TaskPriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// ❌ Avoid mixing conventions
enum taskStatus {}  // Bad - interface should be PascalCase
enum TaskStatus {
  pending  // Bad - inconsistent with PascalCase type
}
```

**7. Function and Method Naming (in Interfaces)**

```typescript
interface TaskService {
  // ✅ camelCase for all methods
  createTask(dto: CreateTaskDto): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // ✅ Prefix with appropriate verb
  getTaskById(id: string): Task | undefined;
  findTasksByStatus(status: TaskStatus): readonly Task[];
  isTaskCompletable(task: Task): boolean;
  hasDependencies(task: Task): boolean;

  // ✅ Use 'on' prefix for event handlers
  onTaskCreated(callback: (task: Task) => void): UnsubscribeFn;
  onStatusChanged(callback: (event: StatusChangeEvent) => void): UnsubscribeFn;

  // ✅ Use 'to' prefix for conversions
  toDto(): TaskDto;
  toEntity(): TaskEntity;
  toViewModel(): TaskViewModel;

  // ✅ Use 'from' prefix for factory methods
  static fromDto(dto: TaskDto): Task;
  static fromEntity(entity: TaskEntity): Task;
}
```

**8. Property Naming**

```typescript
interface Task {
  // ✅ camelCase for all properties
  readonly id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // ✅ Boolean prefix patterns
  isCompleted: boolean;
  isBlocked: boolean;
  hasDependencies: boolean;
  canStart: boolean;

  // ✅ Array and object properties
  subtasks: readonly SubTask[];
  dependencies: readonly Dependency[];
  metadata: TaskMetadata;
  customFields: Record<string, unknown>;

  // ✅ Callback and function properties
  onStatusChange: ((newStatus: TaskStatus) => void) | undefined;
  validator: (task: Task) => ValidationResult;

  // ❌ Avoid these patterns
  Id: string;  // Don't use PascalCase for properties
  _id: string;  // Don't use underscore prefix (unless private field)
  completed: boolean;  // Prefer 'isCompleted' for clarity
  deps: Dependency[];  // Don't abbreviate unnecessarily
}
```

**9. Domain-Specific Naming Conventions**

```typescript
// DDD-style naming for domain entities
interface AggregateRoot {
  readonly id: string;
  version: number;
}

interface Entity {
  readonly id: string;
}

interface ValueObject {
  equals(other: this): boolean;
}

// Event sourcing naming
interface Event {
  readonly aggregateId: string;
  readonly version: number;
  readonly occurredAt: Date;
}

interface TaskCreatedEvent extends Event {
  readonly type: 'TaskCreated';
  readonly title: string;
  readonly assigneeId: string;
}

// CQRS-style naming
interface Command {
  readonly aggregateId: string;
}

interface CreateTaskCommand extends Command {
  readonly title: string;
  readonly description?: string;
}

interface Query<T> {
  execute(): Promise<readonly T[]>;
}

interface GetTasksByAssigneeQuery extends Query<Task> {
  assigneeId: string;
}
```

**10. Consistency Within the Codebase**

```typescript
// ✅ Choose a pattern and apply consistently

// Pattern 1: Full words
interface TaskRepository {
  find(): readonly Task[];
  create(): Task;
  update(): Task;
  delete(): void;
}

// Pattern 2: Abbreviations (be consistent)
interface TaskRepo {
  find(): readonly Task[];
  create(): Task;
  update(): Task;
  delete(): void;
}

// ❌ Don't mix patterns
interface TaskRepo {
  find(): readonly Task[];       // abbreviated
  createTask(): Task;            // full word
  updateTask(): Task;            // inconsistent with create
  rem(): void;                   // abbreviated
}

// ✅ Consistent naming across related types
interface Task {}
interface TaskDto {}
interface TaskEntity {}
interface TaskViewModel {}
interface TaskRepository {}
interface TaskService {}
interface TaskValidator {}
interface TaskTransformer {}

// All related to Task, all using Task prefix
```

---

## Complete Example: Hierarchical Task Model

Here's a comprehensive example bringing together all the best practices:

```typescript
/**
 * Type definitions and interfaces for the Task Management System.
 * Demonstrates TypeScript best practices for hierarchical models.
 *
 * @module task-model
 */

/**
 * Unique identifier for any entity in the system.
 *
 * @format uuid
 */
type EntityId = string;

/**
 * Unix timestamp in milliseconds.
 */
type Timestamp = number;

/**
 * Available states for a task in its lifecycle.
 */
type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'blocked'
  | 'cancelled';

/**
 * Priority levels for task ordering.
 * Lower values indicate higher priority.
 */
type TaskPriority = 1 | 2 | 3 | 4 | 5;

/**
 * Type discriminator for different task kinds.
 */
type TaskKind = 'simple' | 'recurring' | 'milestone' | 'parent';

/**
 * User reference (lightweight, for embedding in tasks).
 */
interface TaskUser {
  readonly id: EntityId;
  readonly name: string;
  readonly email: string;
}

/**
 * Recurrence pattern for recurring tasks.
 */
interface RecurrencePattern {
  readonly frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  readonly interval: number;
  readonly endDate?: Timestamp;
}

/**
 * Base interface with shared task properties.
 * All task types include these properties.
 */
interface BaseTask {
  /**
   * Unique identifier - never changes after creation.
   */
  readonly id: EntityId;

  /**
   * Human-readable title.
   * @minLength 1
   * @maxLength 200
   */
  title: string;

  /**
   * Optional detailed description.
   */
  description?: string;

  /**
   * Current status in the task lifecycle.
   */
  status: TaskStatus;

  /**
   * Priority level (1=highest, 5=lowest).
   * @default 3
   */
  priority: TaskPriority;

  /**
   * User who created this task.
   */
  readonly createdBy: TaskUser;

  /**
   * User currently assigned to this task.
   */
  assignedTo?: TaskUser;

  /**
   * Tags for categorization and filtering.
   */
  readonly tags: readonly string[];

  /**
   * Task creation timestamp.
   */
  readonly createdAt: Timestamp;

  /**
   * Last update timestamp.
   */
  updatedAt: Timestamp;
}

/**
 * A one-time task with optional due date.
 */
interface SimpleTask extends BaseTask {
  readonly kind: 'simple';
  dueDate?: Timestamp;
  completedAt?: Timestamp;
}

/**
 * A task that repeats according to a recurrence pattern.
 */
interface RecurringTask extends BaseTask {
  readonly kind: 'recurring';
  readonly recurrence: RecurrencePattern;
  nextOccurrence: Timestamp;
  occurrenceCount: number;
  maxOccurrences?: number;
}

/**
 * A significant project milestone with dependencies.
 */
interface MilestoneTask extends BaseTask {
  readonly kind: 'milestone';
  readonly targetDate: Timestamp;
  readonly dependencies: readonly EntityId[];
  progressPercentage: number;
}

/**
 * A parent task containing subtasks.
 */
interface ParentTask extends BaseTask {
  readonly kind: 'parent';
  readonly children: readonly EntityId[];
  completionThreshold: number; // Percentage required to mark parent complete
  calculatedProgress: number;
}

/**
 * Discriminated union of all task types.
 * Use the `kind` property for type narrowing.
 */
type Task = SimpleTask | RecurringTask | MilestoneTask | ParentTask;

/**
 * Type guard to check if a task is a parent task.
 *
 * @param task - The task to check.
 * @returns True if the task is a parent task.
 *
 * @example
 * ```typescript
 * if (isParentTask(task)) {
 *   // TypeScript knows task has `children` and `calculatedProgress`
 *   console.log(`Parent task has ${task.children.length} subtasks`);
 * }
 * ```
 */
function isParentTask(task: Task): task is ParentTask {
  return task.kind === 'parent';
}

/**
 * Type guard to check if a task is recurring.
 */
function isRecurringTask(task: Task): task is RecurringTask {
  return task.kind === 'recurring';
}

/**
 * Type guard to check if a task is a milestone.
 */
function isMilestoneTask(task: Task): task is MilestoneTask {
  return task.kind === 'milestone';
}

/**
 * Immutable view of a task.
 * Used for read operations to prevent accidental mutations.
 */
type ImmutableTask = Readonly<Task>;

/**
 * Deeply immutable task (including nested objects/arrays).
 */
type DeepImmutableTask = DeepReadonly<Task>;

/**
 * Partial update DTO for tasks.
 * All properties are optional.
 */
type TaskUpdate = Partial<
  Omit<BaseTask, 'id' | 'createdAt' | 'createdBy' | 'tags'>
>;

/**
 * Search criteria for finding tasks.
 * All properties are optional - omit for "any value".
 */
interface TaskSearchCriteria {
  status?: TaskStatus | readonly TaskStatus[];
  priority?: TaskPriority | readonly TaskPriority[];
  assignedToId?: EntityId;
  createdById?: EntityId;
  tags?: readonly string[];
  dueBefore?: Timestamp;
  dueAfter?: Timestamp;
  createdAfter?: Timestamp;
  createdBefore?: Timestamp;
  search?: string; // Full-text search on title/description
}

/**
 * Result of a task validation.
 */
interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
}

/**
 * A validation error with location and message.
 */
interface ValidationError {
  readonly path: readonly string[];
  readonly message: string;
  readonly code: string;
}

/**
 * Repository interface for task persistence.
 *
 * @template T - The task type (defaults to Task).
 */
interface TaskRepository<T extends Task = Task> {
  /**
   * Finds a task by its unique identifier.
   *
   * @param id - The task ID.
   * @returns The task if found, otherwise undefined.
   */
  findById(id: EntityId): Promise<Readonly<T> | undefined>;

  /**
   * Finds all tasks matching the criteria.
   *
   * @param criteria - Search criteria (optional, returns all if omitted).
   * @returns Array of matching tasks.
   */
  find(criteria?: TaskSearchCriteria): Promise<readonly T[]>;

  /**
   * Saves a new or updated task.
   *
   * @param task - The complete task to save.
   * @returns The saved task (may have updated timestamps).
   * @throws {ValidationError} If validation fails.
   */
  save(task: T): Promise<T>;

  /**
   * Deletes a task by ID.
   *
   * @param id - The task ID to delete.
   * @throws {NotFoundError} If task doesn't exist.
   */
  delete(id: EntityId): Promise<void>;
}

/**
 * Service interface for task business logic.
 */
interface TaskService {
  readonly repository: TaskRepository;

  /**
   * Creates a new task with the given configuration.
   *
   * @param config - Task creation configuration.
   * @returns The created task with generated ID and timestamps.
   * @throws {ValidationError} If configuration is invalid.
   */
  create(config: CreateTaskConfig): Promise<Task>;

  /**
   * Updates specific fields of an existing task.
   *
   * @param id - The task ID.
   * @param updates - Fields to update.
   * @returns The updated task.
   * @throws {NotFoundError} If task doesn't exist.
   */
  update(id: EntityId, updates: TaskUpdate): Promise<Task>;

  /**
   * Deletes a task (soft delete by default).
   *
   * @param id - The task ID.
   * @param options - Delete options.
   * @throws {NotFoundError} If task doesn't exist.
   */
  delete(
    id: EntityId,
    options?: { permanent?: boolean }
  ): Promise<void>;

  /**
   * Changes the status of a task.
   *
   * @param id - The task ID.
   * @param newStatus - The new status.
   * @param userId - ID of user making the change.
   * @returns The updated task.
   */
  changeStatus(
    id: EntityId,
    newStatus: TaskStatus,
    userId: EntityId
  ): Promise<Task>;

  /**
   * Calculates the progress percentage for a task.
   *
   * @param task - The task to calculate progress for.
   * @returns Progress from 0-100.
   */
  calculateProgress(task: Task): number;

  /**
   * Checks if a task can transition to a new status.
   *
   * @param task - The task to check.
   * @param newStatus - The desired status.
   * @returns True if the transition is allowed.
   */
  canTransitionTo(task: Task, newStatus: TaskStatus): boolean;
}

/**
 * Configuration for creating a new task.
 */
interface CreateTaskConfig {
  readonly kind: TaskKind;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedToId?: EntityId;
  tags?: readonly string[];
  dueDate?: Timestamp;
  recurrence?: RecurrencePattern;
  targetDate?: Timestamp;
  dependencies?: readonly EntityId[];
}

/**
 * Deep readonly utility type.
 * Makes all properties recursively readonly.
 */
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

/**
 * Extract utility for discriminated unions.
 * Extracts members of T that have a kind property equal to K.
 */
type ExtractByKind<T, K extends T['kind']> = Extract<T, { kind: K }>;

// Convenience type aliases
type AnySimpleTask = ExtractByKind<Task, 'simple'>;
type AnyRecurringTask = ExtractByKind<Task, 'recurring'>;
type AnyMilestoneTask = ExtractByKind<Task, 'milestone'>;
type AnyParentTask = ExtractByKind<Task, 'parent'>;
```

---

## References and Resources

### Official TypeScript Documentation

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **Interfaces**: https://www.typescriptlang.org/docs/handbook/2/objects.html
- **Type Aliases**: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases
- **Unions and Intersections**: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
- **Discriminated Unions**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
- **Readonly Modifier**: https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties
- **Utility Types**: https://www.typescriptlang.org/docs/handbook/utility-types.html
- **Generics**: https://www.typescriptlang.org/docs/handbook/2/generics.html
- **Type Narrowing**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **Type Guards**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates

### TypeScript 5.2+ Release Notes

- **TypeScript 5.2**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/
- **TypeScript 5.3**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-3/
- **TypeScript 5.4**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
- **TypeScript 5.5**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/
- **TypeScript 5.6**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/
- **TypeScript 5.7**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/
- **TypeScript 5.8**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/

### JSDoc Documentation

- **JSDoc Official Documentation**: https://jsdoc.app/
- **TypeScript JSDoc Reference**: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- **@types Documentation**: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

### Community Best Practices

#### Blogs and Articles

1. **"Effective TypeScript" by Dan Vanderkam**
   - Blog: https://effectivetypescript.com/
   - Book: https://www.oreilly.com/library/view/effective-typescript/9781492053736/

2. **"TypeScript Deep Dive" by Basarat Ali Syed**
   - https://basarat.gitbook.io/typescript/

3. **"React TypeScript Cheatsheet"**
   - https://react-typescript-cheatsheet.netlify.app/

4. **"TypeScript ESLint Recommended Rules"**
   - https://typescript-eslint.io/rules/

#### Style Guides

1. **Airbnb TypeScript Style Guide**
   - https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb-typescript

2. **Google TypeScript Style Guide**
   - https://google.github.io/styleguide/tsguide.html

3. **Microsoft TypeScript Coding Guidelines**
   - https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines

4. **Clean Code TypeScript**
   - https://github.com/labs42io/clean-code-typescript

### GitHub Repository Examples

1. **DefinitelyTyped** - High-quality type definitions:
   - https://github.com/DefinitelyTyped/DefinitelyTyped

2. **TypeScript-Node-Starter** - Best practices for Node.js:
   - https://github.com/Microsoft/TypeScript-Node-Starter

3. **Prisma** - Modern TypeScript ORM:
   - https://github.com/prisma/prisma

4. **tRPC** - End-to-end typesafe APIs:
   - https://github.com/trpc/trpc

5. **Effect-TS** - Functional programming in TypeScript:
   - https://github.com/Effect-TS/effect

6. **Zod** - Schema validation with TypeScript inference:
   - https://github.com/colinhacks/zod

### Additional Resources

- **TypeScript Discord Server**: https://discord.com/invite/typescript
- **Reddit r/typescript**: https://reddit.com/r/typescript
- **Stack Overflow TypeScript Tag**: https://stackoverflow.com/questions/tagged/typescript
- **Total TypeScript**: https://totaltypescript.com/
- **Matt Pocock's TypeScript Tips**: https://www.youtube.com/@mattpocockuk

---

## Summary of Key Best Practices

1. **Use interfaces** for object shapes that may be extended
2. **Use type aliases** for unions, intersections, and utility types
3. **Leverage discriminated unions** for hierarchical task models
4. **Apply readonly modifiers** for immutable properties
5. **Document thoroughly** with JSDoc for better developer experience
6. **Follow consistent naming** conventions across your codebase
7. **Use utility types** (Readonly, Partial, Omit, Extract, etc.) effectively
8. **Prefer structural typing** over nominal typing patterns
9. **Write type-safe code** by leveraging TypeScript's type inference
10. **Keep interfaces focused** and single-purpose

---

*This research document was compiled to inform the design of hierarchical task models for the hacky-hack project, focusing on TypeScript 5.2+ features and modern best practices.*
