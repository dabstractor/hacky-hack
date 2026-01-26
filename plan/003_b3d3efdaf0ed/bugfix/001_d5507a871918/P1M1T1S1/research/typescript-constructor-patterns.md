# TypeScript Constructor Best Practices Reference

## Default Parameter Patterns

### Optional vs Default Parameters

**Optional Parameters (`?`)**:
```typescript
constructor(
  id: string,
  timeout?: number  // Can be undefined
)
```
- Use when parameter can be `undefined` and has no sensible default
- Caller can omit or pass `undefined`

**Default Parameters (`= value`)**:
```typescript
constructor(
  id: string,
  timeout: number = 5000  // Defaults to 5000
)
```
- Use when you have a sensible default value
- Caller can omit, and the default is used
- **Preferred for backwards compatibility**

### Parameter Ordering Rules

```typescript
// CORRECT: Required first, then optional with defaults
constructor(
  required: string,      // Required - no default
  optional1: number = 1, // Optional with default
  optional2: boolean = false,
  optional3?: string     // Optional without default
)

// INCORRECT: Optional before required
constructor(
  optional: number = 1,  // ERROR: Optional before required
  required: string       // Required parameter
)
```

## Backwards Compatibility

### Safe Changes (Non-Breaking)

```typescript
// Adding optional parameter with default - SAFE
class Service {
  constructor(
    id: string,
    timeout: number = 5000  // New parameter with default
  )
}
// Old code still works: new Service('id123')
// New code can use: new Service('id123', 10000)
```

```typescript
// Adding optional parameter without default - SAFE
class Service {
  constructor(
    id: string,
    config?: Config  // New optional parameter
  )
}
// Old code still works: new Service('id123')
// New code can use: new Service('id123', config)
```

### Breaking Changes

```typescript
// Making optional parameter required - BREAKING
class Service {
  constructor(
    id: string,
    timeout: number  // Was: timeout: number = 5000
  )
}
// Old code breaks: new Service('id123')  // ERROR: Missing timeout
```

```typescript
// Changing parameter order - BREAKING
class Service {
  constructor(
    timeout: number = 5000,  // Was: id: string
    id: string               // Was: timeout: number
  )
}
// Old code breaks at runtime: new Service('id123')
// Now 'id123' is passed to timeout (wrong type!)
```

## Testing Constructor Changes

### Backwards Compatibility Test Pattern

```typescript
describe('Constructor backwards compatibility', () => {
  it('should work with original parameters', () => {
    const service = new Service('id-123');
    expect(service.timeout).toBe(5000);  // Default value used
  });

  it('should work with new parameters', () => {
    const service = new Service('id-123', 10000);
    expect(service.timeout).toBe(10000);
  });

  it('should handle undefined for optional parameters', () => {
    const service = new Service('id-123', undefined);
    expect(service.timeout).toBe(5000);  // Default value used
  });
});
```

### Constructor Parameter Validation Test

```typescript
describe('Constructor parameter validation', () => {
  it('should throw on invalid required parameter', () => {
    expect(() => new Service(null))
      .toThrow('id is required');
  });

  it('should validate parameter ranges', () => {
    expect(() => new Service('id', -1))
      .toThrow('timeout must be positive');
  });
});
```

## Common Pitfalls

### 1. Missing Default Values

```typescript
// WRONG: No default for optional parameter
constructor(
  id: string,
  config?: Config  // What if config is undefined?
) {
  this.config = config.cacheTimeout;  // ERROR: config might be undefined
}

// CORRECT: Provide default or check for undefined
constructor(
  id: string,
  config?: Config
) {
  this.config = config?.cacheTimeout ?? 3000;  // Safe access with default
}
```

### 2. Wrong Parameter Order

```typescript
// WRONG: Changing parameter order breaks calling code
class Service {
  constructor(timeout: number, id: string)  // Order changed!
}

// CORRECT: Keep parameter order stable
class Service {
  constructor(id: string, timeout: number = 5000)  // Stable order
}
```

### 3. Too Many Parameters

```typescript
// PROBLEMATIC: Too many positional parameters
constructor(
  id: string,
  timeout: number = 5000,
  retries: number = 3,
  cache: boolean = true,
  compression: string = 'gzip',
  logLevel: string = 'info',
  debug: boolean = false
)

// BETTER: Use configuration object
interface ServiceConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  compression?: string;
  logLevel?: string;
  debug?: boolean;
}

constructor(id: string, config: ServiceConfig = {}) {
  this.id = id;
  this.timeout = config.timeout ?? 5000;
  this.retries = config.retries ?? 3;
  // ... etc
}
```

## Compile-Time vs Runtime Detection

### TypeScript Compile-Time Detection

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,  // Enables strict null checks
    "noImplicitAny": true  // Error on implicit any types
  }
}
```

With `strict: true`, TypeScript catches:
- Missing required parameters
- Wrong parameter types
- Invalid parameter order (type mismatch)

### Runtime Errors

Runtime errors can occur when:
1. Using `any` types bypasses TypeScript checks
2. Type assertions override TypeScript
3. JavaScript code calls TypeScript without type checking

```typescript
// Runtime error example
class Service {
  constructor(id: string, timeout: number = 5000) {
    if (timeout < 0) {
      throw new RangeError('timeout must be positive');  // Runtime validation
    }
    this.timeout = timeout;
  }
}

// If JavaScript code calls: new Service('id', 'invalid')
// TypeScript won't catch it, but runtime will fail
```

## Best Practices Summary

### When Adding Constructor Parameters

1. **Always use default values** for new optional parameters
2. **Add new parameters at the end** - never reorder existing parameters
3. **Update JSDoc comments** to document new parameters
4. **Add backwards compatibility tests** to ensure old code still works
5. **Consider using configuration objects** for more than 4 parameters

### Constructor Parameter Guidelines

| Parameter Count | Approach |
|----------------|----------|
| 1-3 | Positional parameters |
| 4-5 | Positional with defaults, or consider config object |
| 6+ | Configuration object (recommended) |

### Testing Checklist

- [ ] All existing tests pass without modification
- [ ] New tests added for new functionality
- [ ] Backwards compatibility tests pass
- [ ] TypeScript compilation succeeds with strict mode
- [ ] JSDoc comments updated
- [ ] Runtime validation added for critical parameters

## Codebase-Specific Examples

### SessionManager Constructor

**Current State** - Good pattern:
```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```
- Required parameter first
- Optional parameters with defaults
- Clear parameter names
- Manageable parameter count (3)

### TaskOrchestrator Constructor

**Current State** - Consider refactoring (7 parameters):
```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard',
  retryConfig?: Partial<TaskRetryConfig>
)
```

**Suggested Refactoring**:
```typescript
interface TaskOrchestratorConfig {
  scope?: Scope;
  noCache?: boolean;
  researchQueueConcurrency?: number;
  cacheTtlMs?: number;
  prpCompression?: PRPCompressionLevel;
  retryConfig?: Partial<TaskRetryConfig>;
}

constructor(
  sessionManager: SessionManager,
  config: TaskOrchestratorConfig = {}
) {
  this.sessionManager = sessionManager;
  this.#scope = config.scope;
  this.#noCache = config.noCache ?? false;
  this.#researchQueueConcurrency = config.researchQueueConcurrency ?? 3;
  this.#cacheTtlMs = config.cacheTtlMs ?? 24 * 60 * 60 * 1000;
  this.#prpCompression = config.prpCompression ?? 'standard';
  this.#retryManager = new TaskRetryManager(config.retryConfig);
}
```

### PRPRuntime Constructor

**Current State** - Excellent:
```typescript
constructor(
  orchestrator: TaskOrchestrator,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard'
)
```
- Required parameter first (orchestrator dependency)
- Optional parameters with defaults
- Simple and clear
- Manageable parameter count (3)

## References

- [TypeScript Handbook: Constructor Parameters](https://www.typescriptlang.org/docs/handbook/2/classes.html#constructor-parameters)
- [TypeScript Deep Dive: Default Parameters](https://basarat.gitbook.io/typescript/type-system/constructors#default-values)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb TypeScript Style Guide](https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-typescript/README.md)
