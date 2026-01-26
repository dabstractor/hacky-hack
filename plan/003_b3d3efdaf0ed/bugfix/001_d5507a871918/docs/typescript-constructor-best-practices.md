# TypeScript Constructor Best Practices Research Summary

**Research Date:** 2026-01-26
**Purpose:** Product Requirement Prompt (PRP) for Constructor Parameter Changes
**Status:** Limited external research available (web search at monthly limit)

---

## Executive Summary

This research summary compiles best practices for TypeScript constructor parameter changes, focusing on backwards compatibility, testing strategies, and common pitfalls. Due to web search limitations, this document is based on:

1. Analysis of the current codebase constructor patterns
2. TypeScript language specification knowledge
3. Established TypeScript community best practices
4. Common patterns observed in production TypeScript applications

---

## 1. TypeScript Constructor Best Practices

### 1.1 Default Parameter Patterns in TypeScript Constructors

#### Basic Syntax
```typescript
class Example {
  constructor(
    public requiredParam: string,
    public optionalParam: string = 'default',
    public optionalWithUndefined: string | undefined = undefined
  ) {}
}
```

#### Key Patterns Found in Your Codebase

**Pattern 1: Parameter Properties with Defaults**
```typescript
// From: src/agents/prp-runtime.ts
constructor(
  orchestrator: TaskOrchestrator,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard'
)
```

**Pattern 2: Optional Parameters Without Defaults**
```typescript
// From: src/core/task-orchestrator.ts
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

#### Best Practices

1. **Always put required parameters first**
   - Required parameters must come before optional parameters
   - TypeScript compiler enforces this at compile time

2. **Use meaningful default values**
   ```typescript
   // Good: Clear, meaningful default
   constructor(timeout: number = 5000) {}

   // Avoid: Unclear default
   constructor(timeout: number = 0) {}
   ```

3. **Consider using `undefined` for optional parameters without defaults**
   ```typescript
   // Explicitly undefined
   constructor(value?: string) {}

   // vs explicitly undefined with type
   constructor(value: string | undefined = undefined) {}
   ```

### 1.2 Optional vs Default Parameters in Constructors

#### Comparison Table

| Aspect | Optional Parameters (`?`) | Default Parameters (`= value`) |
|--------|---------------------------|-------------------------------|
| Syntax | `param?: Type` | `param: Type = defaultValue` |
| Type | `Type \| undefined` | `Type` |
| Can be omitted | Yes | Yes |
| Default value | `undefined` | Specified value |
| Backwards compatible | Yes (adding is safe) | Yes (adding is safe) |
| Compile-time detection | No error if omitted | No error if omitted |

#### When to Use Each

**Use Optional Parameters (`?`) when:**
- The parameter can legitimately be `undefined`
- You want to explicitly handle the `undefined` case
- The parameter is truly optional and has no sensible default

```typescript
class Database {
  constructor(
    public connectionString: string,
    public connectionTimeout?: number  // Optional: use default timeout
  ) {}
}
```

**Use Default Parameters when:**
- You have a sensible default value
- The parameter should rarely be overridden
- You want to simplify the API

```typescript
class APIClient {
  constructor(
    public baseURL: string,
    public timeout: number = 5000,  // Default: 5 seconds
    public retries: number = 3      // Default: 3 retries
  ) {}
}
```

### 1.3 Backwards Compatibility When Adding Constructor Parameters

#### Safe Changes (Non-Breaking)

1. **Adding optional parameters with defaults**
   ```typescript
   // Before
   class Service {
     constructor(id: string) {}
   }

   // After: Backwards compatible
   class Service {
     constructor(
       id: string,
       timeout: number = 5000  // NEW: safe addition
     ) {}
   }
   ```

2. **Adding optional parameters without defaults**
   ```typescript
   // Before
   class Service {
     constructor(id: string) {}
   }

   // After: Backwards compatible
   class Service {
     constructor(
       id: string,
       timeout?: number  // NEW: safe addition
     ) {}
   }
   ```

#### Breaking Changes

1. **Making an optional parameter required**
   ```typescript
   // Before
   class Service {
     constructor(id: string, timeout?: number) {}
   }

   // After: BREAKING CHANGE
   class Service {
     constructor(
       id: string,
       timeout: number  // BREAKING: now required
     ) {}
   }
   ```

2. **Changing parameter order**
   ```typescript
   // Before
   class Service {
     constructor(id: string, timeout: number) {}
   }

   // After: BREAKING CHANGE
   class Service {
     constructor(timeout: number, id: string)  // BREAKING: order changed
   }
   ```

3. **Removing parameters**
   ```typescript
   // Before
   class Service {
     constructor(id: string, timeout: number) {}
   }

   // After: BREAKING CHANGE
   class Service {
     constructor(id: string)  // BREAKING: timeout removed
   }
   ```

### 1.4 TypeScript Best Practices for Constructor Evolution

#### Strategy 1: Constructor Overloads

For complex constructor signatures, use overloads:

```typescript
class Service {
  // Overload signatures
  constructor(id: string);
  constructor(id: string, timeout: number);
  constructor(id: string, timeout: number, retries: number);

  // Implementation signature
  constructor(
    id: string,
    timeout?: number,
    retries?: number
  ) {
    // Implementation
  }
}
```

#### Strategy 2: Configuration Object Pattern

For constructors with many parameters:

```typescript
interface ServiceConfig {
  id: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

class Service {
  constructor(config: ServiceConfig) {
    const {
      id,
      timeout = 5000,
      retries = 3,
      debug = false
    } = config;
  }
}

// Usage
const service = new Service({
  id: 'my-service',
  timeout: 10000  // Other params use defaults
});
```

**Advantages:**
- Easy to add new parameters without breaking existing code
- Self-documenting (parameter names are explicit)
- No parameter order issues

**Disadvantages:**
- More verbose
- Requires object creation
- Slightly more complex type checking

#### Strategy 3: Builder Pattern

For complex object construction:

```typescript
class Service {
  private constructor(
    private id: string,
    private timeout: number,
    private retries: number,
    private debug: boolean
  ) {}

  static Builder = class {
    private id: string = '';
    private timeout: number = 5000;
    private retries: number = 3;
    private debug: boolean = false;

    withId(id: string) {
      this.id = id;
      return this;
    }

    withTimeout(timeout: number) {
      this.timeout = timeout;
      return this;
    }

    withRetries(retries: number) {
      this.retries = retries;
      return this;
    }

    withDebug(debug: boolean) {
      this.debug = debug;
      return this;
    }

    build() {
      return new Service(this.id, this.timeout, this.retries, this.debug);
    }
  };
}

// Usage
const service = new Service.Builder()
  .withId('my-service')
  .withTimeout(10000)
  .build();
```

---

## 2. Testing Constructor Changes

### 2.1 How to Test Constructor Parameter Changes Safely

#### Testing Strategy: Backwards Compatibility Suite

When adding new constructor parameters, maintain a comprehensive test suite:

```typescript
describe('Service Constructor', () => {
  describe('backwards compatibility', () => {
    it('should work with original parameters', () => {
      // Old usage pattern - must continue to work
      const service = new Service('id-123');
      expect(service.id).toBe('id-123');
      expect(service.timeout).toBe(5000);  // Default
    });

    it('should work with new optional parameters', () => {
      // New usage pattern - with new parameter
      const service = new Service('id-123', 10000);
      expect(service.id).toBe('id-123');
      expect(service.timeout).toBe(10000);
    });

    it('should maintain behavior with all parameters', () => {
      // All parameters specified
      const service = new Service('id-123', 10000, 5);
      expect(service.id).toBe('id-123');
      expect(service.timeout).toBe(10000);
      expect(service.retries).toBe(5);
    });
  });
});
```

#### Testing Strategy: Gradual Rollout

1. **Phase 1: Add optional parameter with default**
   ```typescript
   constructor(id: string, newParam: number = 42)
   ```
   - Existing code continues to work
   - New code can use the parameter
   - Monitor for any issues

2. **Phase 2: Deprecate old usage (if needed)**
   ```typescript
   /**
    * @deprecated Use `withNewParam()` method instead
    */
   constructor(id: string, legacyParam?: number)
   ```

3. **Phase 3: Make required (breaking change)**
   - Only in major version updates
   - Update all internal usage first
   - Provide migration guide

### 2.2 Breaking vs Non-Breaking Constructor Changes

#### Non-Breaking Changes

1. **Adding optional parameters with defaults**
   - Existing calls work unchanged
   - New functionality available via new parameter

2. **Adding parameters after required parameters**
   ```typescript
   // Safe: new parameters at the end
   constructor(
     required: string,
     optional?: string,
     newOptional?: number  // Safe addition
   )
   ```

3. **Loosening type constraints**
   ```typescript
   // Before
   constructor(id: string) {}

   // After: Safe (string is assignable to string | number)
   constructor(id: string | number) {}
   ```

#### Breaking Changes

1. **Making optional parameters required**
   - All existing calls must be updated
   - Requires major version bump

2. **Reordering parameters**
   - Positional arguments break
   - All existing calls must be updated

3. **Removing parameters**
   - Existing calls with that parameter fail
   - Requires major version bump

4. **Tightening type constraints**
   ```typescript
   // Before
   constructor(id: string | number) {}

   // After: BREAKING
   constructor(id: string) {}
   ```

### 2.3 Strategies for Maintaining Backwards Compatibility

#### Strategy 1: Parameter Aliasing

```typescript
class Service {
  constructor(
    public id: string,
    timeout?: number,  // Old parameter name
    connectionTimeout?: number  // New parameter name
  ) {
    // Use new parameter if provided, fall back to old
    this.timeout = connectionTimeout ?? timeout ?? 5000;
  }
}
```

#### Strategy 2: Static Factory Methods

```typescript
class Service {
  private constructor(
    private id: string,
    private timeout: number,
    private retries: number
  ) {}

  // Legacy factory method
  static withDefaults(id: string): Service {
    return new Service(id, 5000, 3);
  }

  // New factory method
  static withConfig(id: string, timeout: number, retries: number): Service {
    return new Service(id, timeout, retries);
  }
}
```

#### Strategy 3: Inheritance with Extended Constructors

```typescript
class BaseService {
  constructor(
    protected id: string,
    protected timeout: number = 5000
  ) {}
}

class ExtendedService extends BaseService {
  constructor(
    id: string,
    timeout: number,
    protected retries: number = 3
  ) {
    super(id, timeout);
  }
}
```

---

## 3. Common Pitfalls

### 3.1 What Happens When Calling Code Doesn't Pass New Parameters

#### Scenario 1: Optional Parameter with Default

```typescript
class Service {
  constructor(
    public id: string,
    public timeout: number = 5000  // New parameter
  ) {}
}

// Old code (still works)
const service = new Service('abc');
console.log(service.timeout);  // Output: 5000 (default used)
```

**Result:** No error, default value is used

#### Scenario 2: Required Parameter Added (Breaking)

```typescript
class Service {
  constructor(
    public id: string,
    public timeout: number  // New required parameter
  ) {}
}

// Old code (BREAKS)
const service = new Service('abc');  // TypeScript Error: Expected 2 arguments, but got 1
```

**Result:** TypeScript compile-time error (if strict mode enabled)

#### Scenario 3: Parameter Order Changed

```typescript
// Before
class Service {
  constructor(id: string, timeout: number) {}
}

// After
class Service {
  constructor(timeout: number, id: string) {}  // Order swapped
}

// Old code (compiles but runtime behavior changes)
const service = new Service('abc', 5000);
// 'abc' is now interpreted as timeout (number)
// 5000 is now interpreted as id (string)
```

**Result:** May compile but causes runtime type errors

### 3.2 How to Detect Missing Constructor Parameters at Compile Time

#### TypeScript Compiler Configuration

Ensure your `tsconfig.json` has strict checking enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

**Your current configuration (`/home/dustin/projects/hacky-hack/tsconfig.json`):**
```json
{
  "compilerOptions": {
    "strict": true,  // ✓ Enabled
    "target": "ES2022",
    "module": "NodeNext"
  }
}
```

#### Compile-Time Detection Examples

**Example 1: Missing Required Parameter**
```typescript
class Service {
  constructor(id: string, timeout: number) {}
}

// Compile-time error (with strict mode)
const service = new Service('abc');
// Error: Expected 2 arguments, but got 1.
```

**Example 2: Type Mismatch**
```typescript
class Service {
  constructor(id: string, timeout: number) {}
}

// Compile-time error
const service = new Service('abc', '5000');
// Error: Argument of type 'string' is not assignable to parameter of type 'number'.
```

**Example 3: Undefined for Required Parameter**
```typescript
class Service {
  constructor(id: string, timeout: number) {}
}

// Compile-time error (with strictNullChecks)
const service = new Service('abc', undefined);
// Error: Argument of type 'undefined' is not assignable to parameter of type 'number'.
```

#### ESLint Rules for Constructor Validation

Add to your `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-parameter-properties': 'off',  // If using parameter properties
    'no-undef': 'error'
  }
}
```

### 3.3 Runtime Errors from Missing Constructor Parameters

#### Scenario 1: No Strict Mode (Unsafe)

```typescript
// tsconfig.json: { "strict": false }

class Service {
  constructor(id: string, timeout: number) {
    console.log(timeout);  // Might be undefined at runtime
  }
}

const service = new Service('abc' as any);
// No compile-time error, but timeout is undefined at runtime
```

#### Scenario 2: Using `any` Type (Unsafe)

```typescript
class Service {
  constructor(id: string, timeout: number) {}
}

const id: any = 'abc';
const service = new Service(id);  // Missing timeout
// No compile-time error due to `any` type
// Runtime: timeout is undefined
```

#### Scenario 3: Incorrect Type Assertions

```typescript
class Service {
  constructor(id: string, timeout: number) {}
}

const args = ['abc'] as any;  // Unsafe type assertion
const service = new Service(...args);
// No compile-time error
// Runtime: timeout is undefined
```

### 3.4 Prevention Strategies

#### Strategy 1: Runtime Validation

```typescript
class Service {
  constructor(id: string, timeout: number) {
    if (timeout === undefined || timeout === null) {
      throw new TypeError('timeout is required');
    }
    this.id = id;
    this.timeout = timeout;
  }
}
```

#### Strategy 2: Default Values for Safety

```typescript
class Service {
  constructor(
    id: string,
    timeout: number = 5000  // Prevents undefined
  ) {
    this.id = id;
    this.timeout = timeout;
  }
}
```

#### Strategy 3: Readonly Properties

```typescript
class Service {
  constructor(
    public readonly id: string,
    public readonly timeout: number = 5000
  ) {}
}
```

---

## 4. Codebase Analysis: Current Constructor Patterns

### 4.1 SessionManager Constructor

**Location:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```

**Analysis:**
- ✓ Good: Required parameter first
- ✓ Good: Optional parameters with sensible defaults
- ✓ Good: Clear parameter names
- ✓ Backwards compatible: Adding new optional parameters would be safe

**Recommended Improvement:**
Consider adding parameter validation:

```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
) {
  if (flushRetries < 0) {
    throw new RangeError('flushRetries must be non-negative');
  }
  // ... rest of constructor
}
```

### 4.2 TaskOrchestrator Constructor

**Location:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`

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

**Analysis:**
- ⚠️ Concern: Many parameters (7 total)
- ✓ Good: All optional parameters have defaults
- ✓ Good: Required parameter first
- ⚠️ Concern: Hard to remember parameter order

**Recommended Improvement:**
Consider using a configuration object pattern:

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
  const {
    scope,
    noCache = false,
    researchQueueConcurrency = 3,
    cacheTtlMs = 24 * 60 * 60 * 1000,
    prpCompression = 'standard',
    retryConfig
  } = config;

  // ... rest of constructor
}
```

### 4.3 PRPRuntime Constructor

**Location:** `/home/dustin/projects/hacky-hack/src/agents/prp-runtime.ts`

```typescript
constructor(
  orchestrator: TaskOrchestrator,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard'
)
```

**Analysis:**
- ✓ Good: Simple, clear constructor
- ✓ Good: Required parameter first
- ✓ Good: Optional parameters with defaults
- ✓ Good: Manageable number of parameters (3 total)

**No changes needed.**

---

## 5. Recommendations for PRP Implementation

### 5.1 When Adding New Constructor Parameters

1. **Always use default values for new optional parameters**
   ```typescript
   constructor(
     existingParam: string,
     newParam: number = 42  // Always provide default
   )
   ```

2. **Add new parameters at the end**
   ```typescript
   // Good
   constructor(
     required: string,
     optional1?: string,
     optional2?: number  // New parameter at end
   )

   // Bad
   constructor(
     required: string,
     newParam?: number,  // Breaks existing calls
     optional1?: string
   )
   ```

3. **Update JSDoc comments**
   ```typescript
   /**
    * Creates a new Service instance
    *
    * @param id - Unique identifier
    * @param timeout - Request timeout in milliseconds (default: 5000)
    * @param retries - Number of retry attempts (default: 3)
    * @param debug - Enable debug logging (default: false)
    */
   constructor(
     id: string,
     timeout: number = 5000,
     retries: number = 3,
     debug: boolean = false
   )
   ```

### 5.2 Testing Checklist

Before merging constructor changes:

- [ ] All existing tests pass without modification
- [ ] New tests added for new functionality
- [ ] Backwards compatibility tests pass
- [ ] TypeScript compilation succeeds with `strict` mode
- [ ] ESLint passes without errors
- [ ] JSDoc comments updated
- [ ] Migration guide created (if breaking change)

### 5.3 Migration Pattern for Breaking Changes

If a breaking change is unavoidable:

1. **Add deprecation warning**
   ```typescript
   /**
    * @deprecated Use `new Service({ id, timeout })` instead
    * @removedIn 2.0.0
    */
   constructor(id: string, timeout?: number) {
     console.warn('Deprecated constructor signature. Use config object pattern.');
     // ... implementation
   }

   static withConfig(config: ServiceConfig): Service {
     return new Service(config.id, config.timeout);
   }
   ```

2. **Provide migration script**
   ```typescript
   // Migration helper
   function migrateService(oldInstance: OldService): NewService {
     return new NewService({
       id: oldInstance.id,
       timeout: oldInstance.timeout ?? 5000
     });
   }
   ```

3. **Update documentation**
   - Migration guide
   - Changelog entry
   - Breaking change notice in README

---

## 6. Summary and Action Items

### Key Takeaways

1. **Default parameters are safe** to add for backwards compatibility
2. **Required parameters are breaking changes** - require major version bump
3. **Parameter order matters** - never reorder parameters
4. **TypeScript strict mode** catches many constructor errors at compile time
5. **Configuration object pattern** is best for constructors with many parameters

### Immediate Actions for Your Codebase

1. **Audit existing constructors** for parameter count (> 5 parameters)
2. **Consider refactoring** to configuration object pattern for complex constructors
3. **Add runtime validation** for critical parameters
4. **Ensure `strict: true`** in tsconfig.json (already done ✓)
5. **Add backwards compatibility tests** for any constructor changes

### Long-Term Strategy

1. **Document constructor evolution policy**
2. **Automate backwards compatibility testing**
3. **Use semantic versioning** for breaking changes
4. **Provide deprecation warnings** before removing features
5. **Maintain migration guides** for major version updates

---

## Appendix: TypeScript Constructor Reference

### A.1 Parameter Properties

```typescript
// Shorthand (parameter properties)
class Example {
  constructor(
    public name: string,
    private age: number,
    readonly id: string
  ) {}
}

// Equivalent to:
class Example {
  public name: string;
  private age: number;
  readonly id: string;

  constructor(name: string, age: number, id: string) {
    this.name = name;
    this.age = age;
    this.id = id;
  }
}
```

### A.2 Constructor Overloads

```typescript
class Example {
  // Overload signatures
  constructor(name: string);
  constructor(name: string, age: number);
  constructor(name: string, age: number, id: string);

  // Implementation signature
  constructor(
    name: string,
    age?: number,
    id?: string
  ) {
    // Implementation
  }
}
```

### A.3 Abstract Class Constructors

```typescript
abstract class Base {
  constructor(protected value: string) {}
}

class Derived extends Base {
  constructor(value: string) {
    super(value);  // Must call super()
  }
}
```

### A.4 Constructor Type Inference

```typescript
class Example {
  constructor(public value: string) {}
}

// Type inferred correctly
const example = new Example('test');
example.value;  // string

// Type error
example.value = 123;  // Error: Type 'number' is not assignable to type 'string'
```

---

**End of Research Summary**

**Next Steps:**
1. Review this summary with the team
2. Identify specific constructor changes needed
3. Create implementation plan following best practices
4. Update coding standards with constructor guidelines
