# TypeScript Error Handling Research

## Research Summary

This directory contains comprehensive research on TypeScript error handling best practices for 2024-2025, compiled for enterprise Node.js applications.

## Files Included

### 1. `typescript-error-best-practices.md`

**Main research document** covering:

- Error class inheritance patterns
- Custom error classes with proper prototype chain
- Error codes and programmatic error handling
- Structured logging with error context
- Enterprise error handling patterns
- Integration with logging libraries (Winston, Pino)
- Common pitfalls to avoid
- Open source examples and references

### 2. `error-examples.ts`

**Production-ready TypeScript code** containing:

- Complete base error class implementation
- HTTP error classes (400, 401, 403, 404, 409, 422, 429, 500, 503)
- Domain-specific error classes
- Error code constants
- Error serialization utilities
- Result type pattern implementation
- Async error handlers
- Error context builder pattern
- Express middleware examples
- Service layer examples

### 3. `quick-reference.md`

**Quick reference guide** with:

- Essential error class pattern
- Common error class templates
- Error handler middleware
- Async route wrapper
- Result type pattern
- Logger setup examples
- Implementation checklist

## Key Findings

### Critical Requirements

1. **Prototype Chain Maintenance**

   ```typescript
   Object.setPrototypeOf(this, CustomError.prototype);
   ```

   This is critical for `instanceof` checks to work correctly.

2. **Stack Trace Preservation**

   ```typescript
   Error.captureStackTrace(this, this.constructor);
   ```

   Required for proper debugging in V8/Node.js environments.

3. **Structured Logging**
   - Implement `toJSON()` method on error classes
   - Use error serializers for logging libraries
   - Include correlation IDs for distributed tracing

### Error Code Convention

Format: `{DOMAIN}_{SPECIFIC_ERROR}`

Examples:

- `AUTH_INVALID_TOKEN`
- `RESOURCE_NOT_FOUND`
- `DATABASE_QUERY_ERROR`
- `VALIDATION_INVALID_INPUT`

### Operational vs Programming Errors

- **Operational Errors**: Expected failures (not found, validation failed)
  - Should be caught and handled gracefully
  - Include user-friendly messages
  - Log with info/warn level

- **Programming Errors**: Bugs (undefined is not a function)
  - Should crash the process (in development) or be logged (in production)
  - Include stack traces
  - Log with error level

## Open Source References

### Error Handling Libraries

- **@ts-stack/error**: https://github.com/ts-stack/error
- **common-errors**: https://github.com/nickbalestra/common-errors
- **http-errors**: https://github.com/jshttp/http-errors

### Real-World Examples

- **NestJS**: https://github.com/nestjs/nest (excellent error handling)
- **TypeORM**: https://github.com/typeorm/typeorm (database errors)
- **Prisma**: https://github.com/prisma/prisma (error patterns)
- **tRPC**: https://github.com/trpc/trpc (type-safe errors)

### Official Documentation

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/2/classes.html
- Node.js Error API: https://nodejs.org/api/errors.html
- MDN Error Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

## Recommended Tools

### Error Serialization

- **serialize-error**: https://github.com/sindresorhus/serialize-error
- **fast-safe-stringify**: https://github.com/EvanOxfeld/node-fast-safe-stringify

### Logging Libraries

- **Winston**: https://github.com/winstonjs/winston
- **Pino**: https://github.com/pinojs/pino

### Error Monitoring

- **Sentry**: https://github.com/getsentry/sentry
- **DataDog**: https://www.datadoghq.com/

## Best Practices Summary

### DO:

- ✅ Always call `Object.setPrototypeOf()` when extending Error
- ✅ Always call `Error.captureStackTrace()` for proper stack traces
- ✅ Define error codes for programmatic handling
- ✅ Implement `toJSON()` for structured logging
- ✅ Distinguish operational vs programming errors
- ✅ Use async error wrappers in Express routes
- ✅ Include correlation IDs for distributed tracing
- ✅ Serialize errors properly for logging libraries
- ✅ Use Result types for operations that can fail
- ✅ Implement proper HTTP status codes

### DON'T:

- ❌ Rely on instanceof without setting prototype
- ❌ Throw plain Error objects
- ❌ Use string matching for error detection
- ❌ Log errors without handling them
- ❌ Lose original error context when re-throwing
- ❌ Include sensitive data in error context
- ❌ Expose stack traces in production

## Implementation Roadmap

1. **Phase 1: Foundation**
   - Create base `AppError` class
   - Define error code constants
   - Implement error serializer

2. **Phase 2: HTTP Errors**
   - Create HTTP error classes (400-500)
   - Implement Express error handler middleware
   - Add async route wrapper

3. **Phase 3: Domain Errors**
   - Create domain-specific error classes
   - Implement Result type pattern
   - Add error context builder

4. **Phase 4: Logging Integration**
   - Set up Winston/Pino logger
   - Implement error serializers
   - Add correlation ID middleware

5. **Phase 5: Testing**
   - Write unit tests for error classes
   - Test instanceof checks
   - Verify error serialization
   - Test middleware integration

## Usage Example

```typescript
// 1. Create an error
const error = new NotFoundError('User not found', {
  userId: '123',
  operation: 'findById',
});

// 2. instanceof works correctly
if (error instanceof NotFoundError) {
  console.log(error.code); // 'NOT_FOUND'
  console.log(error.statusCode); // 404
}

// 3. Serialize for logging
logger.error('User not found', { error: error.toJSON() });

// 4. Return in API response
res.status(error.statusCode).json({
  error: {
    code: error.code,
    message: error.message,
  },
});
```

## Research Date

**Compiled:** January 13, 2025
**Focus:** TypeScript 5.0+ and Node.js 20+
**Target:** Enterprise applications with high reliability requirements

## Notes

- All code examples use TypeScript 5.0+ syntax
- Patterns tested with Node.js 20 LTS
- Compatible with Express.js, Fastify, and NestJS
- Examples follow TypeScript strict mode best practices
