# Observable State Patterns - Research & Best Practices

## Overview

Research findings on decorator-based state observation patterns for TypeScript, including MobX, RxJS, and custom decorator implementations for reactive state management.

---

## Key Resources & Documentation

### Observable Libraries
- **MobX** - https://mobx.js.org/the-gist-of-mobx.html
  - Observable state management
  - Decorators for reactive programming
  - Computed values and reactions
  - Fine-grained reactivity

- **RxJS** - https://rxjs.dev/guide/overview
  - Reactive extensions for JavaScript
  - Observable streams and operators
  - Event handling and async patterns
  - Powerful composition

- **Solid.js** - https://www.solidjs.com/guides/reactivity
  - Fine-grained reactivity
  - Signal-based state
  - No virtual DOM
  - Excellent performance

- **S.js** - https://github.com/adamhaile/S
  - Minimal reactive library
  - Automatic dependency tracking
  - Deterministic execution
  - Tiny bundle size

- **Nano Signals** - https://github.com/nanostores/nanostores
  - Tiny (1kb) state library
  - TS/JS/Deno support
  - RxJS-like API
  - Modular architecture

### TypeScript Decorators
- **TC39 Decorators Proposal** - https://github.com/tc39/proposal-decorators
  - Official decorators specification
  - Stage 3 proposal (2024)
  - TypeScript 5.0+ support
  - Standard syntax

- **TypeScript Decorators** - https://www.typescriptlang.org/docs/handbook/decorators.html
  - TypeScript implementation
  - Experimental flags
  - Class and method decorators
  - Parameter decorators

---

## Best Practices for Observable State

### 1. MobX Observable State Pattern

Use decorators for reactive state management:

```typescript
import { makeObservable, observable, action, computed } from 'mobx';

// Pattern: Observable class with decorators
class WorkflowState {
  @observable
  status: 'pending' | 'running' | 'complete' | 'failed' = 'pending';

  @observable
  currentStep = 0;

  @observable
  totalSteps = 0;

  @observable
  error?: Error;

  @observable
  startTime?: Date;

  @observable
  endTime?: Date;

  constructor() {
    makeObservable(this);
  }

  @computed
  get progress(): number {
    if (this.totalSteps === 0) return 0;
    return (this.currentStep / this.totalSteps) * 100;
  }

  @computed
  get duration(): number | undefined {
    if (!this.startTime || !this.endTime) return undefined;
    return this.endTime.getTime() - this.startTime.getTime();
  }

  @action
  setStatus(status: typeof this.status) {
    this.status = status;
    if (status === 'running' && !this.startTime) {
      this.startTime = new Date();
    }
    if (status === 'complete' || status === 'failed') {
      this.endTime = new Date();
    }
  }

  @action
  advanceStep() {
    this.currentStep++;
  }

  @action
  reset() {
    this.status = 'pending';
    this.currentStep = 0;
    this.error = undefined;
    this.startTime = undefined;
    this.endTime = undefined;
  }
}
```

**Benefits:**
- Declarative reactivity
- Automatic dependency tracking
- Computed values cache
- Minimal boilerplate

### 2. RxJS Observable Pattern

Use observables for event streams and async workflows:

```typescript
import { Observable, Subject, BehaviorSubject, from } from 'rxjs';
import { map, filter, scan, tap, catchError } from 'rxjs/operators';

// Pattern: Observable workflow state
interface WorkflowEvent {
  type: 'start' | 'step' | 'complete' | 'error';
  step?: number;
  error?: Error;
  timestamp: Date;
}

class ObservableWorkflow {
  private events = new Subject<WorkflowEvent>();
  private state = new BehaviorSubject<{
    status: 'idle' | 'running' | 'complete' | 'error';
    currentStep: number;
    lastError?: Error;
  }>({
    status: 'idle',
    currentStep: 0,
  });

  // Event stream
  readonly events$ = this.events.asObservable();

  // State stream
  readonly state$ = this.state.asObservable();

  // Progress stream
  readonly progress$ = this.state$.pipe(
    map(state => state.currentStep),
    scan((acc, step) => [...acc, step], [] as number[])
  );

  // Errors only stream
  readonly errors$ = this.events$.pipe(
    filter(event => event.type === 'error'),
    map(event => event.error!)
  );

  async execute(steps: Array<() => Promise<void>>): Promise<void> {
    this.events.next({
      type: 'start',
      timestamp: new Date(),
    });

    this.state.next({
      status: 'running',
      currentStep: 0,
    });

    try {
      for (let i = 0; i < steps.length; i++) {
        await steps[i]();

        this.events.next({
          type: 'step',
          step: i + 1,
          timestamp: new Date(),
        });

        this.state.next({
          status: 'running',
          currentStep: i + 1,
        });
      }

      this.events.next({
        type: 'complete',
        timestamp: new Date(),
      });

      this.state.next({
        status: 'complete',
        currentStep: steps.length,
      });
    } catch (error) {
      this.events.next({
        type: 'error',
        error: error as Error,
        timestamp: new Date(),
      });

      this.state.next({
        status: 'error',
        currentStep: this.state.value.currentStep,
        lastError: error as Error,
      });

      throw error;
    }
  }
}
```

**Advantages:**
- Stream-based architecture
- Powerful operators
- Time-travel debugging
- Easy testing

### 3. Custom Decorator Pattern

Implement custom decorators for state observation:

```typescript
// Pattern: Custom observable decorator
function observable(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const original = descriptor.value;

  // Create Set for tracking subscribers
  const subscribers = new Set<(value: unknown) => void>();

  // Modify getter to add subscription
  return {
    get() {
      // Return observable wrapper
      return {
        value: original.call(this),
        subscribe(callback: (value: unknown) => void) {
          subscribers.add(callback);
          callback(original.call(this)); // Initial value

          // Return unsubscribe function
          return () => subscribers.delete(callback);
        },
      };
    },
  };
}

// Decorator for auto-notifying on change
function notifier<T>(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const original = descriptor.value;

  return {
    ...descriptor,
    async value(...args: unknown[]) {
      const result = await original.apply(this, args);

      // Notify subscribers
      const instance = this as { notify?: () => void };
      instance.notify?.();

      return result;
    },
  };
}

// Usage
class ObservableWorkflow {
  private _subscribers = new Set<() => void>();

  @observable
  get status() {
    return this._status;
  }

  @notifier
  setStatus(status: string) {
    this._status = status;
  }

  subscribe(callback: () => void) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  private notify() {
    this._subscribers.forEach(cb => cb());
  }
}
```

**Benefits:**
- Full control over behavior
- No external dependencies
- Custom notification logic
- Lightweight implementation

### 4. Proxy-Based Observation Pattern

Use ES6 Proxy for automatic observation:

```typescript
// Pattern: Proxy-based observable
type Listener = (path: string, value: unknown) => void;

function makeObservable<T extends object>(
  obj: T,
  onChange: Listener
): T {
  return new Proxy(obj, {
    set(target, property, value) {
      const oldValue = (target as Record<string, unknown>)[
        property as string
      ];

      // Only notify on actual change
      if (oldValue !== value) {
        (target as Record<string, unknown>)[property as string] = value;
        onChange(property as string, value);
      }

      return true;
    },
  });
}

// Usage
const state = makeObservable(
  {
    status: 'pending',
    step: 0,
    error: null as Error | null,
  },
  (path, value) => {
    console.log(`State changed: ${path} = ${value}`);
  }
);

state.status = 'running'; // Logs: "State changed: status = running"
state.step = 1; // Logs: "State changed: step = 1"
```

**Advantages:**
- No decorators needed
- Works with any object
- Automatic tracking
- Minimal boilerplate

### 5. Signal-Based Pattern

Use signals for fine-grained reactivity (modern approach):

```typescript
// Pattern: Signal-based state
class Signal<T> {
  private _value: T;
  private _subscribers = new Set<(value: T) => void>();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this._subscribers.forEach(sub => sub(newValue));
    }
  }

  subscribe(callback: (value: T) => void): () => void {
    callback(this._value); // Initial value
    this._subscribers.add(callback);

    // Return unsubscribe function
    return () => this._subscribers.delete(callback);
  }

  map<U>(fn: (value: T) => U): Signal<U> {
    const derived = new Signal(fn(this._value));
    this.subscribe(v => {
      derived.value = fn(v);
    });
    return derived;
  }
}

// Usage
const status = new Signal('pending');
const step = new Signal(0);
const isRunning = status.map(s => s === 'running');

// Subscribe to changes
const unsubscribe = isRunning.subscribe(running => {
  console.log(`Is running: ${running}`);
});

status.value = 'running'; // Logs: "Is running: true"
status.value = 'complete'; // Logs: "Is running: false"

unsubscribe(); // Cleanup
```

**Benefits:**
- Modern and lightweight
- Fine-grained reactivity
- No dependencies
- Easy to understand

---

## Common Pitfalls to Avoid

### 1. Circular Dependencies in Computed Values

```typescript
// BAD: Circular dependency
class BadState {
  @observable a = 1;
  @observable b = 2;

  @computed
  get doubleA() {
    return this.a * 2;
  }

  @computed
  get sum() {
    return this.doubleA + this.b; // Depends on computed
  }
}

// GOOD: Clear dependency chain
class GoodState {
  @observable a = 1;
  @observable b = 2;

  @computed
  get sum() {
    return this.a * 2 + this.b; // Direct dependencies only
  }
}
```

### 2. Memory Leaks from Unsubscribed Observables

```typescript
// BAD: Never unsubscribes
class BadComponent {
  ngOnInit() {
    this.state$.subscribe(state => {
      this.updateUI(state);
    });
    // Subscription never cleaned up
  }
}

// GOOD: Always unsubscribe
class GoodComponent {
  private subscriptions: Array<() => void> = [];

  ngOnInit() {
    const unsub = this.state$.subscribe(state => {
      this.updateUI(state);
    });
    this.subscriptions.push(unsub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(unsub => unsub());
  }
}
```

### 3. Mixing Sync and Async State Updates

```typescript
// BAD: Unpredictable state
class BadState {
  @observable status = 'pending';

  async start() {
    this.status = 'running'; // Sync
    await this.init(); // Async
    this.status = 'complete'; // Sync
  }
}

// GOOD: Clear async boundaries
class GoodState {
  @observable status = 'pending';

  async start() {
    await this.init();
    this.status = 'complete'; // All async work done
  }
}
```

### 4. Overusing Observables

```typescript
// BAD: Everything is observable
class BadState {
  @observable config = { apiKey: 'xxx' }; // Never changes
  @observable constants = { maxRetries: 3 }; // Never changes
  @observable data = []; // Changes frequently
}

// GOOD: Only observe what changes
class GoodState {
  readonly config = { apiKey: 'xxx' }; // Static
  readonly constants = { maxRetries: 3 }; // Static
  @observable data = []; // Dynamic
}
```

### 5. Ignoring Error States in Observables

```typescript
// BAD: Errors swallowed
const data$ = from(fetch('/api/data')).pipe(
  map(response => response.json())
);

// GOOD: Error handling
const data$ = from(fetch('/api/data')).pipe(
  map(response => response.json()),
  catchError(error => {
    console.error('Fetch failed:', error);
    return of({ error: true, message: error.message });
  })
);
```

---

## Integration Examples

### Adding Observation to TaskOrchestrator

Based on your `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`:

```typescript
import { makeObservable, observable, action, computed } from 'mobx';

export class ObservableTaskOrchestrator extends TaskOrchestrator {
  @observable
  private _executionHistory: Array<{
    itemId: string;
    oldStatus: string;
    newStatus: string;
    timestamp: Date;
  }> = [];

  @observable
  private _currentItem: HierarchyItem | null = null;

  constructor(sessionManager: SessionManager, scope?: Scope) {
    super(sessionManager, scope);
    makeObservable(this);
  }

  @computed
  get executionHistory() {
    return this._executionHistory.slice();
  }

  @computed
  get currentItem() {
    return this._currentItem;
  }

  @computed
  get progress() {
    if (!this.#executionQueue.length) return 0;
    const completed = this._executionHistory.length;
    return (completed / this.#executionQueue.length) * 100;
  }

  @action
  public async setStatus(
    itemId: string,
    status: string,
    reason?: string
  ): Promise<void> {
    const { findItem } = await import('../utils/task-utils.js');
    const currentItem = findItem(this.#backlog, itemId);
    const oldStatus = currentItem?.status ?? 'Unknown';
    const timestamp = new Date();

    // Record history
    this._executionHistory.push({
      itemId,
      oldStatus,
      newStatus: status,
      timestamp,
    });

    // Call parent method
    await super.setStatus(itemId, status, reason);
  }

  @action
  async processNextItem(): Promise<boolean> {
    const nextItem = this.#executionQueue[0];
    if (nextItem) {
      this._currentItem = nextItem;
    }

    const result = await super.processNextItem();

    if (!result) {
      this._currentItem = null;
    }

    return result;
  }

  // Subscribe to progress updates
  onProgress(callback: (progress: number) => void): () => void {
    return observe(this, 'progress', () => {
      callback(this.progress);
    });
  }
}
```

### Adding Observation to PRPExecutor

Based on your `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts`:

```typescript
import { Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export class ObservablePRPExecutor extends PRPExecutor {
  private executionEvents = new Subject<{
    type: 'start' | 'step' | 'validation' | 'retry' | 'complete' | 'error';
    taskId: string;
    timestamp: Date;
    data?: unknown;
  }>();

  readonly events$ = this.executionEvents.asObservable();

  async execute(prp: PRPDocument, prpPath: string): Promise<ExecutionResult> {
    this.executionEvents.next({
      type: 'start',
      taskId: prp.taskId,
      timestamp: new Date(),
    });

    return super.execute(prp, prpPath).pipe(
      tap(result => {
        this.executionEvents.next({
          type: 'complete',
          taskId: prp.taskId,
          timestamp: new Date(),
          data: result,
        });
      }),
      catchError(error => {
        this.executionEvents.next({
          type: 'error',
          taskId: prp.taskId,
          timestamp: new Date(),
          data: error,
        });
        throw error;
      })
    ).toPromise();
  }

  async #runValidationGates(prp: PRPDocument): Promise<ValidationGateResult[]> {
    const results = await super.#runValidationGates(prp);

    for (const result of results) {
      this.executionEvents.next({
        type: 'validation',
        taskId: prp.taskId,
        timestamp: new Date(),
        data: result,
      });
    }

    return results;
  }
}
```

---

## Recommended Next Steps

1. **Evaluate MobX vs RxJS**
   - MobX: Better for complex state graphs
   - RxJS: Better for event streams and async
   - Consider hybrid approach

2. **Add Progress Observation**
   - Emit progress events
   - Support progress callbacks
   - Enable UI progress bars

3. **Add State History**
   - Track all state changes
   - Enable time-travel debugging
   - Support undo/redo

4. **Add Performance Monitoring**
   - Track execution time
   - Monitor memory usage
   - Alert on anomalies

5. **Add Debugging Tools**
   - State inspector
   - Event logger
   - Dependency graph

---

## Additional Resources

- [MobX Documentation](https://mobx.js.org/intro.html)
- [RxJS Tutorial](https://rxjs.dev/guide/overview)
- [Reactive Programming with RxJS](https://www.learnrxjs.io/)
- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators)
- [Solid.js Reactivity](https://www.solidjs.com/guides/reactivity)
- [Signals Overview](https://github.com/proposal-signals/proposal-signals)
- [Nano Stores](https://github.com/nanostores/nanostores)
