# Node.js PromiseRejectionHandledWarning Research

## What Is PromiseRejectionHandledWarning?

`PromiseRejectionHandledWarning` is a warning issued by Node.js when:

1. A Promise rejection occurs without an attached handler
2. A rejection handler is attached **after** the rejection has happened

This is fundamentally a **race condition detection** mechanism - Node.js is warning that the rejection was initially unhandled, even though it was eventually caught.

## When It Appears

### Example 1: Delayed Handler Attachment

```typescript
// CAUSES PromiseRejectionHandledWarning:
const promise = Promise.reject(new Error('Test error'));

// Handler attached in next tick - too late!
process.nextTick(() => {
  promise.catch(err => console.log('Caught:', err));
});
```

### Example 2: Async Function Without Await

```typescript
// CAUSES PromiseRejectionHandledWarning:
async function processData() {
  throw new Error('Processing failed');
}
processData(); // No await, no .catch()

// Handler attached later
process.on('unhandledRejection', () => {}); // Still too late
```

### Example 3: Promise Chain Without Final .catch()

```typescript
// CAUSES PromiseRejectionHandledWarning:
fetch('/api/data')
  .then(response => response.json())
  .then(data => processData(data))
  .then(result => saveResult(result));
// No final .catch() - if any promise rejects, it's unhandled
```

## Best Practices for Test Environments

### 1. Immediate Handler Attachment

**ALWAYS** attach `.catch()` immediately when creating promises:

```typescript
// ✅ GOOD - Immediate handler
const promise = Promise.reject(new Error('Test')).catch(err =>
  console.log('Handled:', err.message)
);

// ❌ BAD - Delayed handler
const promise = Promise.reject(new Error('Test'));
setTimeout(() => {
  promise.catch(err => console.log('Handled:', err.message));
}, 100);
```

### 2. Global Rejection Handlers in Tests

Set up global handlers in test setup to catch unhandled rejections:

```typescript
// tests/setup.ts
import { beforeEach, afterEach } from 'vitest';

let unhandledRejections: unknown[] = [];

beforeEach(() => {
  unhandledRejections = [];

  const handler = (reason: unknown) => {
    unhandledRejections.push(reason);
  };

  process.on('unhandledRejection', handler);
  (globalThis as any).__unhandledRejectionHandler = handler;
});

afterEach(() => {
  const handler = (globalThis as any).__unhandledRejectionHandler;
  if (handler) {
    process.removeListener('unhandledRejection', handler);
    delete (globalThis as any).__unhandledRejectionHandler;
  }

  // Fail test if there were unhandled rejections
  if (unhandledRejections.length > 0) {
    throw new Error(
      `Test had ${unhandledRejections.length} unhandled rejection(s): ` +
        unhandledRejections.map(String).join(', ')
    );
  }
});
```

### 3. Async Test Hooks

Always handle errors in async test hooks:

```typescript
// ✅ GOOD - Async hook with error handling
beforeEach(async () => {
  await setupTestData().catch(err => {
    console.error('Setup failed:', err);
    throw err;
  });
});

// ❌ BAD - Async hook without error handling
beforeEach(async () => {
  await setupTestData(); // If this rejects, test fails poorly
});
```

### 4. Cleanup of Async Operations

Ensure all async operations complete before test ends:

```typescript
// ✅ GOOD - Wait for async operations
afterEach(async () => {
  // Allow pending promises to settle
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  // Clean up
  vi.clearAllMocks();
});

// ❌ BAD - Cleanup may interrupt pending operations
afterEach(() => {
  vi.clearAllMocks(); // May clear mocks before promises resolve
});
```

### 5. Promise.all vs Promise.allSettled

Use `Promise.allSettled` when you need to handle individual failures:

```typescript
// ✅ GOOD - Use allSettled for better error handling
const results = await Promise.allSettled(operations);
const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) {
  console.error(`${failures.length} operations failed`);
}

// ❌ BAD - all() fails fast, losing other results
const results = await Promise.all(operations); // One failure loses all
```

## Common Patterns Causing Issues

### Pattern 1: Fire-and-Forget

```typescript
// ❌ BAD - Unhandled rejection
async function processData() {
  const result = await fetch('/api/data');
  processResult(result);
}
processData(); // No .catch()

// ✅ GOOD - Always attach .catch()
async function processData() {
  const result = await fetch('/api/data');
  processResult(result);
}
processData().catch(err => {
  console.error('Processing failed:', err);
});
```

### Pattern 2: Mock Timers with Real Callbacks

```typescript
// ❌ BAD - setTimeout may create dangling promises
vi.mock('./module', () => ({
  doSomething: vi.fn(() => {
    setTimeout(() => asyncOperation(), 100);
  }),
}));

// ✅ GOOD - Clean up timers
let mockTimeouts: NodeJS.Timeout[] = [];
beforeEach(() => {
  mockTimeouts = [];
});

afterEach(() => {
  mockTimeouts.forEach(clearTimeout);
  mockTimeouts = [];
});

vi.mock('./module', () => ({
  doSomething: vi.fn(() => {
    const id = setTimeout(() => asyncOperation(), 100);
    mockTimeouts.push(id);
  }),
}));
```

### Pattern 3: Process Signal Handlers

```typescript
// ❌ BAD - Signal may trigger async operations without cleanup
process.emit('SIGTERM');

// ✅ GOOD - Wait for handlers to complete
process.emit('SIGTERM');
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));
```

## Stack Trace Preservation

To preserve stack traces through error wrapping:

```typescript
// ✅ GOOD - Proper error wrapping with cause preservation
class PipelineError extends Error {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, options);
    this.name = 'PipelineError';

    // Restore prototype chain
    Object.setPrototypeOf(this, PipelineError.prototype);

    // Ensure cause is preserved
    if (options.cause && options.cause instanceof Error) {
      this.cause = options.cause;
    }
  }
}
```

## URLs and Resources

### Official Documentation

- **Node.js unhandledRejection**: https://nodejs.org/api/process.html#event-unhandledrejection
- **Node.js rejectionHandled**: https://nodejs.org/api/process.html#event-rejectionhandled
- **Vitest Async Testing**: https://vitest.dev/guide/advanced/
- **MDN Promise Guide**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises

### Community Resources

- **StackOverflow - Promise Rejection**: https://stackoverflow.com/questions/tagged/unhandled-rejection
- **Node.js Event Loop**: https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/
- **Promise Best Practices**: https://javascript.info/promise-error-handling

## Key Takeaways

1. **Always** attach `.catch()` immediately when creating promises
2. **Set up** global rejection handlers in test environments
3. **Clean up** async operations properly in afterEach hooks
4. **Use** `Promise.allSettled` for better error diagnostics
5. **Preserve** error prototype chains with `Object.setPrototypeOf`
6. **Handle** errors in all async test hooks
7. **Mock** timers carefully to avoid dangling promises
8. **Wait** for async operations to complete before cleanup
