# Authoritative Documentation Sources for EnvironmentError Implementation

This document compiles authoritative online documentation sources for implementing the `EnvironmentError` class with proper error handling, testing, and logging practices.

## 1. TypeScript Error Inheritance Best Practices

### Primary Source: TypeScript Official Handbook

**URL:** https://www.typescriptlang.org/docs/handbook/2/classes.html

**Relevance for EnvironmentError:**
- Provides official guidance on extending built-in classes like `Error`
- Essential for understanding proper prototype chain maintenance
- Critical for ensuring `instanceof` checks work correctly with custom errors

**Key Insights:**
1. **Proper Error Extension Pattern:**
   ```typescript
   class CustomError extends Error {
     constructor(message: string) {
       super(message);
       this.name = 'CustomError';
       // CRITICAL: Reset prototype chain for instanceof checks
       Object.setPrototypeOf(this, CustomError.prototype);
     }
   }
   ```

2. **Why `Object.setPrototypeOf()` is Required:**
   - TypeScript/JavaScript has special handling for `Error` objects
   - Without this, `instanceof CustomError` may return `false`
   - Ensures proper prototype chain inheritance

3. **TypeScript Compiler Target Considerations:**
   - ES5 target requires `Object.setPrototypeOf()`
   - ES2015+ target may work without it but best practice is to always include it
   - Use `tsconfig.json` target setting to determine requirements

**Specific Sections to Reference:**
- Section: "Extending Classes" - Understanding inheritance mechanics
- Section: "Constructor Functions" - Proper `super()` usage
- Section: "Static Members" - For error code constants

### Secondary Source: TypeScript Deep Dive

**URL:** https://basarat.gitbook.io/typescript/type-system/exceptions

**Relevance:**
- Community-standard patterns for custom error hierarchies
- Practical examples of error type guards
- Error serialization best practices

**Key Patterns:**
```typescript
// Type guard for custom errors
function isEnvironmentError(error: unknown): error is EnvironmentError {
  return error instanceof EnvironmentError;
}

// Safe error handling pattern
try {
  // ... code that might throw
} catch (error) {
  if (isEnvironmentError(error)) {
    console.log(error.environment); // TypeScript knows this is safe
  }
}
```

---

## 2. Vitest Testing Framework Documentation

### Primary Source: Vitest Official Docs

**URL:** https://vitest.dev/guide/

**Relevance for EnvironmentError:**
- Official testing framework for the project
- Provides patterns for testing error conditions
- Essential for TDD implementation of error classes

**Key Insights:**

1. **Testing Error Throwing:**
   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('EnvironmentError', () => {
     it('should throw when environment variable is missing', () => {
       expect(() => {
         throw new EnvironmentError('API_KEY', 'development');
       }).toThrow(EnvironmentError);
     });
   });
   ```

2. **Testing Error Properties:**
   ```typescript
   it('should include environment name in error', () => {
     const error = new EnvironmentError('API_KEY', 'production');
     expect(error.environment).toBe('production');
     expect(error.variable).toBe('API_KEY');
     expect(error.code).toBe('ENV_VAR_NOT_SET');
   });
   ```

3. **Testing Error Messages:**
   ```typescript
   it('should format error message correctly', () => {
     const error = new EnvironmentError('DATABASE_URL', 'staging');
     expect(error.message).toContain('DATABASE_URL');
     expect(error.message).toContain('staging');
   });
   ```

4. **Type Guard Testing:**
   ```typescript
   it('should identify EnvironmentError instances', () => {
     const error = new EnvironmentError('PORT', 'test');
     expect(error instanceof EnvironmentError).toBe(true);
     expect(error instanceof Error).toBe(true);
   });
   ```

**Specific Sections to Reference:**
- Section: "Assertions" - `toThrow()`, `toThrowError()` methods
- Section: "Test Context" - Using `describe` blocks for error scenarios
- Section: "TypeScript" - Type-safe testing patterns

### Secondary Source: Vitest API Reference

**URL:** https://vitest.dev/api/

**Relevant Methods:**
- `expect().toThrow()` - Tests that function throws error
- `expect().toThrowError()` - Tests error message matching
- `expect().instanceOf()` - Tests prototype chain

---

## 3. Test-Driven Development Practices for Error Handling

### Primary Source: Martin Fowler's TDD Guide

**URL:** https://martinfowler.com/bliki/TestDrivenDevelopment.html

**Relevance for EnvironmentError:**
- Industry-standard TDD methodology
- Red-Green-Refactor cycle for error handling
- Guidelines for testing edge cases and error conditions

**Key Insights:**

1. **Red-Green-Refactor for Error Handling:**
   ```
   RED: Write failing test for missing environment variable
   GREEN: Implement minimal EnvironmentError class
   REFACTOR: Extract error codes, add type guards
   ```

2. **Test Error Conditions First:**
   ```typescript
   // Write this test FIRST (it will fail)
   it('should throw with correct error code for missing variable', () => {
     const error = new EnvironmentError('MISSING_VAR', 'test');
     expect(error.code).toBe('ENV_VAR_NOT_SET');
   });

   // Then implement to make test pass
   class EnvironmentError extends Error {
     code = 'ENV_VAR_NOT_SET';
     // ...
   }
   ```

3. **Test Edge Cases:**
   - Empty string environment names
   - Special characters in variable names
   - Null/undefined values
   - Very long variable names

4. **Test Error Recovery:**
   ```typescript
   it('should allow catching and handling EnvironmentError', () => {
     try {
       throw new EnvironmentError('PORT', 'production');
     } catch (error) {
       if (error instanceof EnvironmentError) {
         expect(error.statusCode).toBe(500);
       }
     }
   });
   ```

### Secondary Source: Test Double Blog - Testing Error Handling

**URL:** https://blog.testdouble.com/posts/2021-05-11-testing-error-cases/

**Relevance:**
- Practical patterns for testing error scenarios
- Strategies for mocking error conditions
- Testing error propagation

**Key Patterns:**
- Test error messages contain useful debugging info
- Test error codes are machine-readable
- Test error objects maintain proper prototype chain
- Test error serialization for logging

---

## 4. Structured Logging with Pino (Error Serialization)

### Primary Source: Pino Official Documentation

**URL:** https://getpino.io/#/

**Relevance for EnvironmentError:**
- Official logger for the project
- Handles error object serialization automatically
- Critical for production error monitoring

**Key Insights:**

1. **Automatic Error Serialization:**
   ```typescript
   import pino from 'pino';
   const logger = pino();

   // Pino automatically serializes Error objects
   try {
     throw new EnvironmentError('API_KEY', 'production');
   } catch (error) {
     logger.error(error, 'Failed to load environment variable');
     // Output includes: message, stack, name, and custom properties
   }
   ```

2. **Custom Error Serializers:**
   ```typescript
   const logger = pino({
     serializers: {
       err: pino.stdErrSerializers.err,
       environmentError: (error) => ({
         type: 'EnvironmentError',
         code: error.code,
         environment: error.environment,
         variable: error.variable,
         message: error.message,
         stack: error.stack,
       }),
     },
   });
   ```

3. **Error Context Binding:**
   ```typescript
   logger.info({
     err: new EnvironmentError('DATABASE_URL', 'staging'),
     environment: 'staging',
     service: 'api-gateway',
   }, 'Environment validation failed');
   ```

4. **Child Loggers for Error Context:**
   ```typescript
   const errorLogger = logger.child({ component: 'environment-validator' });
   errorLogger.error(new EnvironmentError('PORT', 'test'), 'Invalid port');
   ```

**Specific Sections to Reference:**
- Section: "Serializers" - Custom error serialization
- Section: "Error Handling" - How Pino handles Error objects
- Section: "Log Levels" - Appropriate levels for different error types
- Section: "Child Loggers" - Contextual error logging

### Secondary Source: Pino GitHub Repository

**URL:** https://github.com/pinojs/pino

**Relevant Documentation:**
- `/docs/api.md` - Full API reference
- `/docs/ecosystem.md` - Integration with error tracking tools
- `/docs/transports.md` - Logging destinations for errors

**Key Patterns:**
```typescript
// Error tracking integration
const pino = require('pino');
const transport = pino.transport({
  target: 'pino-sentry-transport',
  options: {
    dsn: process.env.SENTRY_DSN,
  },
});
const logger = pino(transport);

// Log EnvironmentError with full context
logger.error({
  err: new EnvironmentError('REDIS_URL', 'production'),
  environment: 'production',
  severity: 'critical',
}, 'Required environment variable missing');
```

---

## 5. Error Code Patterns and Conventions

### Primary Source: Node.js Error Documentation

**URL:** https://nodejs.org/api/errors.html

**Relevance for EnvironmentError:**
- Official Node.js error patterns
- Standard error code conventions
- Error creation best practices

**Key Insights:**

1. **Error Code Format:**
   ```typescript
   // Node.js uses uppercase, underscore-separated codes
   const ERROR_CODES = {
     ERR_ENV_VAR_NOT_SET: 'ERR_ENV_VAR_NOT_SET',
     ERR_ENV_VAR_INVALID: 'ERR_ENV_VAR_INVALID',
     ERR_ENV_VAR_REQUIRED: 'ERR_ENV_VAR_REQUIRED',
   } as const;
   ```

2. **Standard Error Properties:**
   ```typescript
   class EnvironmentError extends Error {
     constructor(
       public variable: string,
       public environment: string,
       message?: string
     ) {
       super(message || `Environment variable ${variable} not set in ${environment}`);

       // Standard Node.js error properties
       this.name = 'EnvironmentError';
       this.code = 'ERR_ENV_VAR_NOT_SET';

       // Custom properties
       this.statusCode = 500;

       // Maintain prototype chain
       Object.setPrototypeOf(this, EnvironmentError.prototype);
     }

     // Standard error properties
     code: string;
     statusCode: number;
   }
   ```

3. **Error Code Hierarchy:**
   ```
   ERR_ENV_VAR_NOT_SET      - Variable missing
   ERR_ENV_VAR_INVALID      - Variable present but invalid format
   ERR_ENV_VAR_REQUIRED     - Required variable in production
   ERR_ENV_VAR_TYPE_MISMATCH - Wrong type (number vs string)
   ```

**Specific Sections to Reference:**
- Section: "Class: Error" - Base error class behavior
- Section: "Error Codes" - Standard error code conventions
- Section: "System Errors" - Node.js error patterns
- Section: "Creating Custom Errors" - Best practices

### Secondary Source: RFC 7807 - Problem Details for HTTP APIs

**URL:** https://datatracker.ietf.org/doc/html/rfc7807

**Relevance:**
- Industry standard for error response format
- Defines error type and code conventions
- Useful for API error responses

**Key Patterns:**
```typescript
interface ProblemDetails {
  type: string;      // URI reference to error type
  title: string;     // Short human-readable title
  status: number;    // HTTP status code
  detail: string;    // Detailed explanation
  instance?: string; // URI to specific occurrence
}

// EnvironmentError as Problem Details
class EnvironmentError extends Error {
  toProblemDetails(): ProblemDetails {
    return {
      type: 'https://example.com/errors/env-var-not-set',
      title: 'Environment Variable Not Set',
      status: 500,
      detail: `Required environment variable '${this.variable}' is not set in ${this.environment}`,
      instance: `urn:uuid:${generateUUID()}`,
    };
  }
}
```

### Tertiary Source: Google API Design Guide - Errors

**URL:** https://cloud.google.com/apis/design/errors

**Relevance:**
- Industry-standard error code patterns
- Error message conventions
- Error metadata structure

**Key Patterns:**
```typescript
// Google-style error codes
const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  FAILED_PRECONDITION: 'FAILED_PRECONDITION',
  INTERNAL: 'INTERNAL',
} as const;

// Error details structure
interface ErrorDetail {
  code: string;
  message: string;
  details: Array<{
    '@type': string;
    [key: string]: unknown;
  }>;
}

// EnvironmentError with structured details
class EnvironmentError extends Error {
  code: string = 'FAILED_PRECONDITION';
  details = {
    '@type': 'type.googleapis.com/google.rpc.PreconditionFailure',
    violations: [
      {
        type: 'ENV_VAR_NOT_SET',
        subject: this.variable,
        description: `Required in ${this.environment}`,
      },
    ],
  };
}
```

---

## Implementation Checklist for EnvironmentError

Based on these authoritative sources, ensure the `EnvironmentError` class:

### TypeScript Best Practices
- [ ] Extends `Error` class properly
- [ ] Calls `super(message)` in constructor
- [ ] Sets `this.name` to 'EnvironmentError'
- [ ] Uses `Object.setPrototypeOf()` for prototype chain
- [ ] Includes type-safe type guard function
- [ ] Has readonly properties for immutability

### Error Code Standards
- [ ] Uses uppercase, underscore-separated codes (e.g., `ERR_ENV_VAR_NOT_SET`)
- [ ] Follows Node.js error code conventions
- [ ] Includes machine-readable `code` property
- [ ] Maps to appropriate HTTP status codes
- [ ] Defines code constants in enum/object

### Error Properties
- [ ] `variable: string` - Name of missing environment variable
- [ ] `environment: string` - Environment name (production/development/etc)
- [ ] `code: string` - Machine-readable error code
- [ ] `statusCode?: number` - Optional HTTP status code
- [ ] `timestamp?: string` - When error occurred
- [ ] `remediation?: string` - How to fix the error

### Testing Requirements (Vitest)
- [ ] Test constructor with valid inputs
- [ ] Test error message format
- [ ] Test `instanceof EnvironmentError` checks
- [ ] Test `instanceof Error` checks
- [ ] Test type guard function
- [ ] Test error code correctness
- [ ] Test error serialization for logging
- [ ] Test edge cases (empty strings, special chars)
- [ ] Test prototype chain maintenance

### Logging Integration (Pino)
- [ ] Automatic error serialization works
- [ ] Custom serializer for EnvironmentError properties
- [ ] Log level appropriate for severity
- [ ] Include environment context in logs
- [ ] Stack trace preserved in logs
- [ ] Structured logging format

### Error Recovery
- [ ] Catchable with try/catch
- [ ] Type-safe error checking possible
- [ ] Error information sufficient for debugging
- [ ] Remediation information included
- [ ] No sensitive data leakage

---

## Quick Reference Code Template

```typescript
/**
 * EnvironmentError - Thrown when required environment variables are missing
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/classes.html
 * @see https://nodejs.org/api/errors.html
 */
export class EnvironmentError extends Error {
  /**
   * Error code following Node.js conventions
   * @see https://nodejs.org/api/errors.html#errorcodes
   */
  readonly code: string;

  /**
   * Environment where error occurred
   */
  readonly environment: string;

  /**
   * Name of missing environment variable
   */
  readonly variable: string;

  /**
   * HTTP status code for API responses
   */
  readonly statusCode: number;

  /**
   * Timestamp when error occurred
   */
  readonly timestamp: string;

  constructor(
    variable: string,
    environment: string,
    message?: string
  ) {
    super(message || `Environment variable '${variable}' is required in ${environment} environment`);

    this.name = 'EnvironmentError';
    this.code = 'ERR_ENV_VAR_NOT_SET';
    this.environment = environment;
    this.variable = variable;
    this.statusCode = 500;
    this.timestamp = new Date().toISOString();

    // CRITICAL: Maintain prototype chain
    Object.setPrototypeOf(this, EnvironmentError.prototype);
  }

  /**
   * Type guard for EnvironmentError
   */
  static isEnvironmentError(error: unknown): error is EnvironmentError {
    return error instanceof EnvironmentError;
  }

  /**
   * Convert to structured log format for Pino
   * @see https://getpino.io/#/docs/api
   */
  toLogObject() {
    return {
      type: this.name,
      code: this.code,
      environment: this.environment,
      variable: this.variable,
      message: this.message,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Error code constants
export const ENV_ERROR_CODES = {
  NOT_SET: 'ERR_ENV_VAR_NOT_SET',
  INVALID: 'ERR_ENV_VAR_INVALID',
  REQUIRED: 'ERR_ENV_VAR_REQUIRED',
  TYPE_MISMATCH: 'ERR_ENV_VAR_TYPE_MISMATCH',
} as const;
```

---

## Additional Resources

### TypeScript Error Handling
- TypeScript Compiler Options: https://www.typescriptlang.org/tsconfig#useDefineForClassFields
- TS2559 Error Extension: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work

### Testing Resources
- Vitest GitHub: https://github.com/vitest-dev/vitest
- Testing Library: https://testing-library.com/docs/

### Logging Resources
- Pino Benchmarks: https://getpino.io/#/docs/benchmarks
- Pino Extreme: https://github.com/pinojs/pino/blob/master/docs/benchmarks.md

### Error Tracking
- Sentry TypeScript: https://docs.sentry.io/platforms/javascript/guides/typescript/
- Error Monitoring Best Practices: https://martinfowler.com/articles/monitoring.html

---

## Document Metadata

**Created:** 2026-01-15
**Purpose:** Research for EnvironmentError class implementation
**Related Task:** P1.M1.T1.S1 - Research error handling best practices
**Bug Report:** 001_8d809cc989b9

**Next Steps:**
1. Review these sources before implementing EnvironmentError
2. Create test cases based on Vitest patterns
3. Configure Pino serializers for EnvironmentError
4. Implement error code constants following Node.js conventions
5. Validate prototype chain with TypeScript compiler settings
