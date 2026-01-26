# TypeScript/Node.js Path Validation and Error Handling Research

This directory contains comprehensive research on TypeScript and Node.js best practices for path validation, custom error handling, JSDoc documentation, and testing validation functions.

## Research Documents

### 1. [TypeScript Path Validation Best Practices](./typescript-path-validation-best-practices.md)
**Focus:** Security, cross-platform compatibility, and validation patterns

**Key Topics:**
- Using Node.js `path` module effectively
- Security considerations (directory traversal, null bytes, path injection)
- Validation patterns and type guards
- Recommended libraries (Zod, Joi, express-validator)
- Common pitfalls and code examples

**Code Example:**
```typescript
function validatePathSecurity(basePath: string, userPath: string): string {
  const resolvedBase = path.resolve(basePath);
  const resolvedUser = path.resolve(basePath, userPath);

  if (!resolvedUser.startsWith(resolvedBase + path.sep)) {
    throw new Error('Path validation failed: attempts to escape base directory');
  }

  return resolvedUser;
}
```

---

### 2. [Custom Error Class Patterns in TypeScript](./typescript-custom-error-class-patterns.md)
**Focus:** Proper error extension, error codes, and error handling patterns

**Key Topics:**
- Properly extending Error class with `Object.setPrototypeOf`
- Error code patterns (string constants, enums)
- Adding structured context to errors
- Error factory and builder patterns
- Type-safe error handling with type guards
- Common mistakes and how to avoid them

**Code Example:**
```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

---

### 3. [JSDoc Patterns for Validation Functions](./jsdoc-patterns-validation-functions.md)
**Focus:** Documenting validation functions, error throwing, and type definitions

**Key Topics:**
- Basic JSDoc structure and tags
- Documenting validation functions
- Documenting functions that throw errors
- Type definitions with `@typedef` and `@template`
- Type guards and assertion functions
- Advanced patterns (cross-references, overloads)

**Code Example:**
```typescript
/**
 * Validates a session path format
 * @param {string} sessionPath - The session path to validate
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH' if format is invalid
 * @example
 * try {
 *   validateSessionPath('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Invalid session path format');
 *   }
 * }
 */
function validateSessionPath(sessionPath: string): void {
  // ...
}
```

---

### 4. [Testing Validation Functions](./testing-validation-functions.md)
**Focus:** Testing error throwing, edge cases, and comprehensive test coverage

**Key Topics:**
- Testing error throwing with Jest
- Testing validation functions (success and failure)
- Edge cases (boundary values, security, platform-specific)
- Testing type guards and assertion functions
- Async validation testing
- Test organization and helpers

**Code Example:**
```typescript
describe('validatePath', () => {
  it('should throw ValidationError for null bytes', () => {
    expect(() => validatePath('/path/\0file')).toThrow(ValidationError);
    expect(() => validatePath('/path/\0file')).toThrow('NULL_BYTE_DETECTED');
  });

  it.each([
    ['/valid/path', true],
    ['', false],
    ['/path/\0file', false],
  ])('validates %s correctly', (input, expected) => {
    expect(validatePath(input).isValid).toBe(expected);
  });
});
```

---

## Key Insights Across All Topics

### Path Validation
1. **Always use the `path` module** for cross-platform compatibility
2. **Normalize paths** before validation to handle `.` and `..`
3. **Check for null bytes** which can bypass security checks
4. **Validate against directory traversal** by checking resolved paths
5. **Use type guards** for runtime type checking

### Custom Error Classes
1. **Always use `Object.setPrototypeOf()`** when extending Error
2. **Set the `name` property** explicitly for better debugging
3. **Use error codes** for programmatic error handling
4. **Add context** to errors for debugging
5. **Preserve stack traces** with `Error.captureStackTrace()`

### JSDoc Documentation
1. **Document all parameters** with types and descriptions
2. **Use specific error types** in `@throws` tags with error codes
3. **Provide concrete examples** showing both success and failure
4. **Use `@typedef`** for complex object types
5. **Document type predicates** with `@returns {value is Type}`

### Testing
1. **Test both success and failure** cases comprehensively
2. **Use `it.each` for data-driven tests** to reduce duplication
3. **Test specific error types and codes** not just that errors are thrown
4. **Include edge cases**: boundary values, special characters, unicode
5. **Test security concerns**: null bytes, path traversal, injection
6. **Clean up test fixtures** in `afterEach` to avoid side effects

---

## Applying to Your Codebase

### Session Path Validation

Based on your codebase patterns, here's how to apply these practices:

```typescript
/**
 * Validates a session path format
 *
 * Session paths must follow the pattern: plan/XXX_<hash>/bugfix/XXX_<hash>
 * where XXX is a 3-digit number and <hash> is a 12-character hexadecimal string.
 *
 * @param {string} sessionPath - The session path to validate
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH' if format is invalid
 * @example
 * try {
 *   validateSessionPath('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 * } catch (error) {
 *   if (error instanceof ValidationError && error.code === 'INVALID_SESSION_PATH') {
 *     console.error('Invalid session path format');
 *   }
 * }
 */
export function validateSessionPath(sessionPath: string): void {
  const SESSION_PATH_PATTERN = /^plan\/\d{3}_[a-f0-9]{12}\/bugfix\/\d{3}_[a-f0-9]{12}$/;

  if (!SESSION_PATH_PATTERN.test(sessionPath)) {
    throw new ValidationError(
      `Invalid session path format: ${sessionPath}`,
      'INVALID_SESSION_PATH',
      { path: sessionPath, pattern: SESSION_PATH_PATTERN.toString() }
    );
  }
}
```

### Test Suite

```typescript
describe('validateSessionPath', () => {
  const validPaths = [
    'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918',
    'plan/001_000000000000/bugfix/001_000000000000',
  ];

  it.each(validPaths)('should accept valid path: %s', (path) => {
    expect(() => validateSessionPath(path)).not.toThrow();
  });

  it('should throw ValidationError for invalid format', () => {
    expect(() => validateSessionPath('invalid/path')).toThrow(ValidationError);
    expect(() => validateSessionPath('invalid/path')).toThrow('INVALID_SESSION_PATH');
  });
});
```

---

## Additional Resources

While web search services were rate-limited during this research, these documents are based on established best practices from:

- **Node.js Documentation:** https://nodejs.org/api/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **JSDoc Documentation:** https://jsdoc.app/
- **Jest Documentation:** https://jestjs.io/docs/
- **OWASP Security Guidelines:** Path traversal prevention
- **Community Best Practices:** From open-source TypeScript projects

---

## Quick Reference

### Common Error Codes
```typescript
export const ErrorCode = {
  // Validation errors
  INVALID_SESSION_PATH: 'INVALID_SESSION_PATH',
  NULL_BYTE_DETECTED: 'NULL_BYTE_DETECTED',
  PATH_TRAVERSAL_DETECTED: 'PATH_TRAVERSAL_DETECTED',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
} as const;
```

### Common JSDoc Tags
```typescript
/**
 * @param {Type} name - Description
 * @returns {Type} Description
 * @throws {ErrorType} Description
 * @example
 * // Usage example
 * @see {@link otherFunction}
 * @deprecated Use alternative instead
 */
```

### Common Jest Matchers
```typescript
// Error throwing
expect(() => func()).toThrow(ErrorType);
expect(() => func()).toThrow('message');

// Type guards
if (isType(value)) { /* value is narrowed */ }

// Async
await expect(asyncFunc()).rejects.toThrow(Error);
await expect(asyncFunc()).resolves.toBe(value);

// Data-driven
it.each([['input1', true], ['input2', false]])('%s', (input, expected) => {
  expect(func(input)).toBe(expected);
});
```

---

## Summary

This research provides a comprehensive guide to implementing robust validation and error handling in TypeScript/Node.js applications. The documents cover:

1. **Path validation** with security best practices
2. **Custom error classes** with proper TypeScript patterns
3. **JSDoc documentation** for validation functions
4. **Testing strategies** for comprehensive coverage

Apply these patterns to your codebase to improve:
- **Security:** Prevent path traversal and injection attacks
- **Type Safety:** Use TypeScript's type system effectively
- **Developer Experience:** Clear error messages and documentation
- **Maintainability:** Comprehensive test coverage and consistent patterns
