# TypeScript Refactoring Patterns Research

## Source: General-Purpose Agent Research

### Key Patterns for Replacing Private Methods with Imported Utilities

#### When to Extract
- **Pure Functions**: Methods that don't rely on `this` context or class state
- **Reusable Logic**: Operations used across multiple classes
- **Complex Logic**: Algorithms or validation that benefit from isolated testing
- **Domain Logic**: Business rules that should be independent of class implementation

#### Common Pitfalls

**Pitfall 1: Loss of Instance Context**
```typescript
// ❌ Problem: Losing access to instance properties
class MyClass {
  #config = { retries: 3 };

  process(data: string) {
    // Before: this.#privateMethod(data) had access to this.#config
    // After: importedFunction(data) cannot access this.#config
  }
}

// ✅ Solution: Pass required context explicitly
export function importedFunction(data: string, config: Config) {
  // Use config parameter instead of this.#config
}
```

**Pitfall 2: Breaking Type Narrowing**
```typescript
// ✅ Solution: Use type guards in utility functions
export function processValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return String(value);
}
```

**Pitfall 3: Overlooking Parameter Dependencies**
```typescript
// ✅ Solution: Explicitly pass all parameters
export function handleError(
  error: Error,
  continueOnError: boolean,
  logger?: (error: Error) => void
): void {
  if (continueOnError) {
    logger?.(error);
  }
}
```

#### Parameter Forwarding Best Practices

1. **Use explicit parameters** rather than relying on closure over `this`
2. **Document default values** clearly in utility function signatures
3. **Consider options objects** for multiple parameters

#### Type Guard Integration

Type guards in utility functions preserve type narrowing:
```typescript
export function isNetworkError(error: Error): error is NetworkError {
  return 'statusCode' in error;
}

// Usage with type narrowing
export function handleError(error: Error) {
  if (isNetworkError(error)) {
    console.log(`Status: ${error.statusCode}`);
  }
}
```

## Documentation Sources

- [TypeScript Handbook - Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [TypeScript Handbook - Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript Deep Dive - Type Guards](https://basarat.gitbook.io/typescript/type-system/typeguard)
