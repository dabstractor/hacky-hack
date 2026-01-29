# JSDoc Patterns for Validation Functions

## Overview

This document covers best practices for documenting validation functions in TypeScript using JSDoc, including how to document functions that throw errors, type definitions, return types, and reference documentation patterns.

## Table of Contents

1. [Basic JSDoc Structure](#basic-jsdoc-structure)
2. [Documenting Validation Functions](#documenting-validation-functions)
3. [Documenting Functions That Throw](#documenting-functions-that-throw)
4. [Type Definitions in JSDoc](#type-definitions-in-jsdoc)
5. [Advanced JSDoc Patterns](#advanced-jsdoc-patterns)
6. [Best Practices](#best-practices)
7. [Examples from Your Codebase](#examples-from-your-codebase)

## Basic JSDoc Structure

### Essential JSDoc Tags

```typescript
/**
 * Brief description of the function
 *
 * Longer description if needed. Can span multiple lines.
 *
 * @param {Type} paramName - Description of parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 * @example
 * // Example usage
 * const result = functionName('input');
 */
function functionName(paramName: string): Type {
  // ...
}
```

### Complete Tag Reference

| Tag           | Purpose                | Example                                         |
| ------------- | ---------------------- | ----------------------------------------------- |
| `@param`      | Document parameters    | `@param {string} name - The user name`          |
| `@returns`    | Document return value  | `@returns {boolean} True if valid`              |
| `@throws`     | Document thrown errors | `@throws {ValidationError} If validation fails` |
| `@example`    | Provide usage examples | `@example validatePath('/path')`                |
| `@see`        | Reference other docs   | `@see {@link validatePath}`                     |
| `@deprecated` | Mark as deprecated     | `@deprecated Use validatePathV2 instead`        |
| `@todo`       | Document TODOs         | `@todo Add more validation`                     |
| `@template`   | Document generics      | `@template T`                                   |
| `@typedef`    | Define custom types    | `@typedef {Object} ValidationResult`            |

## Documenting Validation Functions

### Pattern 1: Simple Validation Function

```typescript
/**
 * Validates if a string is a valid email address
 *
 * Checks for basic email format including @ symbol and domain extension.
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email is valid, false otherwise
 * @example
 * // Returns true
 * isValidEmail('user@example.com')
 * @example
 * // Returns false
 * isValidEmail('invalid-email')
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Pattern 2: Validation with Result Object

```typescript
/**
 * Result type for path validation operations
 * @typedef {Object} PathValidationResult
 * @property {boolean} isValid - Whether the path passed validation
 * @property {string} [normalizedPath] - The normalized path if validation succeeded
 * @property {string} [error] - Error message if validation failed
 */

/**
 * Validates and normalizes a file path
 *
 * Performs security checks including null byte detection and path traversal prevention.
 *
 * @param {string} inputPath - The path to validate
 * @param {Object} [options] - Optional validation settings
 * @param {boolean} [options.mustExist=false] - Whether the path must exist on the filesystem
 * @param {boolean} [options.mustBeFile=false] - Whether the path must be a file (not directory)
 * @param {string[]} [options.allowedExtensions] - List of allowed file extensions (e.g., ['.ts', '.js'])
 * @returns {PathValidationResult} Validation result with status and data
 * @example
 * const result = validatePath('./src/index.ts', {
 *   mustExist: true,
 *   mustBeFile: true,
 *   allowedExtensions: ['.ts', '.js']
 * });
 * if (result.isValid) {
 *   console.log('Valid path:', result.normalizedPath);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export function validatePath(
  inputPath: string,
  options?: {
    mustExist?: boolean;
    mustBeFile?: boolean;
    allowedExtensions?: string[];
  }
): PathValidationResult {
  // Implementation...
  return { isValid: false };
}
```

### Pattern 3: Type Guard Validation

```typescript
/**
 * Type guard to check if a value is a valid path string
 *
 * Performs runtime checks to verify the value is a string and meets
 * basic path validation criteria (length, characters, etc.)
 *
 * @param {unknown} value - The value to check
 * @returns {value is string} Type predicate that narrows type to string if valid
 * @example
 * const value: unknown = getUserInput();
 * if (isValidPath(value)) {
 *   // TypeScript knows value is string here
 *   console.log(value.toUpperCase());
 * }
 */
export function isValidPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.trim().length === 0) return false;
  if (value.includes('\0')) return false;
  if (value.length > 260) return false; // Windows MAX_PATH
  return true;
}
```

## Documenting Functions That Throw

### Pattern 1: Single Error Type

```typescript
/**
 * Validates a session path format
 *
 * Checks that the session path matches the expected pattern:
 * `plan/XXX_<hash>/bugfix/XXX_<hash>` where XXX is a 3-digit number
 * and <hash> is a 12-character hexadecimal string.
 *
 * @param {string} sessionPath - The session path to validate
 * @throws {ValidationError} If the path format is invalid
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH' when pattern doesn't match
 * @example
 * try {
 *   validateSessionPath('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 *   console.log('Valid session path');
 * } catch (error) {
 *   if (error instanceof ValidationError && error.code === 'INVALID_SESSION_PATH') {
 *     console.error('Invalid session path format');
 *   }
 * }
 */
export function validateSessionPath(sessionPath: string): void {
  const SESSION_PATH_PATTERN =
    /^plan\/\d{3}_[a-f0-9]{12}\/bugfix\/\d{3}_[a-f0-9]{12}$/;

  if (!SESSION_PATH_PATTERN.test(sessionPath)) {
    throw new ValidationError(
      `Invalid session path format: ${sessionPath}. ` +
        `Expected format: plan/XXX_<hash>/bugfix/XXX_<hash>`,
      'INVALID_SESSION_PATH'
    );
  }
}
```

### Pattern 2: Multiple Error Types

```typescript
/**
 * Loads and validates a bug report from a session directory
 *
 * This function performs multiple validations and can throw different
 * errors depending on what fails. Always check the error code to handle
 * different failure scenarios appropriately.
 *
 * @param {string} sessionPath - The session path containing TEST_RESULTS.md
 * @returns {Promise<BugReport>} The loaded and validated bug report
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH' if path format is invalid
 * @throws {ValidationError} With code 'PATH_NOT_FOUND' if TEST_RESULTS.md doesn't exist
 * @throws {ValidationError} With code 'INVALID_JSON' if JSON parsing fails
 * @throws {ValidationError} With code 'MISSING_REQUIRED_FIELD' if required fields are missing
 * @throws {Error} For unexpected errors (filesystem issues, etc.)
 * @example
 * try {
 *   const bugReport = await loadBugReport(sessionPath);
 *   console.log('Loaded bug report:', bugReport);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     switch (error.code) {
 *       case 'INVALID_SESSION_PATH':
 *         console.error('Session path format is invalid');
 *         break;
 *       case 'PATH_NOT_FOUND':
 *         console.error('TEST_RESULTS.md not found');
 *         break;
 *       case 'INVALID_JSON':
 *         console.error('Failed to parse JSON');
 *         break;
 *       default:
 *         console.error('Unknown validation error:', error.message);
 *     }
 *   } else {
 *     console.error('Unexpected error:', error);
 *   }
 * }
 */
export async function loadBugReport(sessionPath: string): Promise<BugReport> {
  // Implementation...
  throw new Error('Not implemented');
}
```

### Pattern 3: Conditional Throws Documentation

```typescript
/**
 * Validates a file path with comprehensive security checks
 *
 * @param {string} path - The file path to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.checkTraversal=true] - Check for directory traversal attacks
 * @param {boolean} [options.checkNullBytes=true] - Check for null bytes
 * @param {boolean} [options.checkExists=false] - Check if path exists
 * @throws {ValidationError} With code 'NULL_BYTE_DETECTED' if null bytes found (when checkNullBytes is true)
 * @throws {ValidationError} With code 'PATH_TRAVERSAL_DETECTED' if path traversal detected (when checkTraversal is true)
 * @throws {ValidationError} With code 'PATH_NOT_FOUND' if path doesn't exist (when checkExists is true)
 * @throws {ValidationError} With code 'INVALID_PATH' if path is empty or invalid
 * @returns {void}
 * @example
 * // Basic validation
 * validatePath('/path/to/file');
 * @example
 * // With all checks enabled
 * validatePath('/path/to/file', {
 *   checkTraversal: true,
 *   checkNullBytes: true,
 *   checkExists: true
 * });
 */
export function validatePath(
  path: string,
  options: {
    checkTraversal?: boolean;
    checkNullBytes?: boolean;
    checkExists?: boolean;
  } = {}
): void {
  // Implementation...
}
```

## Type Definitions in JSDoc

### Pattern 1: Typedef for Complex Objects

```typescript
/**
 * @typedef {Object} ValidationErrorContext
 * @property {string} [path] - The path that failed validation
 * @property {string} [pattern] - The expected pattern (if applicable)
 * @property {number} [timestamp] - When the error occurred
 * @property {string} [operation] - The operation being performed
 */

/**
 * Creates a validation error with context
 *
 * @param {string} message - Human-readable error message
 * @param {string} code - Machine-readable error code
 * @param {ValidationErrorContext} [context] - Additional error context
 * @returns {ValidationError} A new validation error instance
 * @example
 * throw createValidationError(
 *   'Path validation failed',
 *   'INVALID_PATH',
 *   {
 *     path: userInput,
 *     operation: 'loadBugReport',
 *     timestamp: Date.now()
 *   }
 * );
 */
export function createValidationError(
  message: string,
  code: string,
  context?: ValidationErrorContext
): ValidationError {
  return new ValidationError(message, code, context);
}
```

### Pattern 2: Union Types in JSDoc

```typescript
/**
 * Possible error codes for path validation
 * @typedef {'NULL_BYTE_DETECTED' | 'PATH_TRAVERSAL_DETECTED' | 'PATH_NOT_FOUND' | 'INVALID_SESSION_PATH'} PathErrorCode
 */

/**
 * Validates a path and returns a detailed result
 *
 * @param {string} path - Path to validate
 * @returns {Object} Validation result
 * @property {boolean} return.isValid - Whether validation passed
 * @property {PathErrorCode | null} return.errorCode - Error code if validation failed
 * @property {string} return.message - Human-readable message
 * @throws {never} This function does not throw, it returns error information
 */
export function validatePathSafe(path: string): {
  isValid: boolean;
  errorCode: PathErrorCode | null;
  message: string;
} {
  // Implementation...
  return { isValid: false, errorCode: null, message: '' };
}
```

### Pattern 3: Generic Type Documentation

```typescript
/**
 * Validates an array of items
 *
 * @template T - The type of items to validate
 * @param {T[]} items - Array of items to validate
 * @param {(item: T) => boolean} validator - Validation function
 * @returns {item is T[]} Type guard for array
 * @throws {ValidationError} If any item fails validation
 * @example
 * // Validate array of paths
 * const paths: string[] = ['/path1', '/path2'];
 * validateArray(paths, isValidPath);
 * @example
 * // Validate array of numbers
 * const numbers: unknown[] = [1, 2, 3];
 * validateArray(numbers, (n): n is number => typeof n === 'number');
 */
export function validateArray<T>(
  items: T[],
  validator: (item: T) => boolean
): asserts items is T[] {
  const invalid = items.filter(item => !validator(item));
  if (invalid.length > 0) {
    throw new ValidationError(
      `Array validation failed: ${invalid.length} invalid items`,
      'ARRAY_VALIDATION_FAILED'
    );
  }
}
```

### Pattern 4: Asserts Type Predicate

```typescript
/**
 * Validates that a value is a non-empty string
 *
 * @param {unknown} value - Value to validate
 * @param {string} [fieldName='value'] - Name of the field for error messages
 * @asserts {value is string} Type assertion - narrows type if validation passes
 * @throws {ValidationError} If value is not a non-empty string
 * @example
 * function processInput(input: unknown) {
 *   assertNonEmptyString(input, 'username');
 *   // TypeScript knows input is string here
 *   console.log(input.toUpperCase());
 * }
 */
export function assertNonEmptyString(
  value: unknown,
  fieldName: string = 'value'
): asserts value is string {
  if (typeof value !== 'string') {
    throw new ValidationError(
      `${fieldName} must be a string, got ${typeof value}`,
      'INVALID_TYPE'
    );
  }
  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, 'EMPTY_STRING');
  }
}
```

## Advanced JSDoc Patterns

### Pattern 1: Cross-References

```typescript
/**
 * Validates a bug report structure
 *
 * Performs comprehensive validation including required fields, data types,
 * and value constraints. See {@link BugReport} for the expected structure.
 *
 * For path validation within the bug report, this function uses
 * {@link validatePath} internally.
 *
 * @param {unknown} data - The data to validate
 * @returns {data is BugReport} Type predicate for BugReport
 * @throws {ValidationError} With code 'INVALID_STRUCTURE' if structure is invalid
 * @throws {ValidationError} With code 'MISSING_REQUIRED_FIELD' if required fields are missing
 * @see {@link validatePath} for path validation logic
 * @see {@link BugReport} interface definition
 * @example
 * const data = JSON.parse(jsonString);
 * if (isValidBugReport(data)) {
 *   // TypeScript knows data is BugReport here
 *   console.log(data.description);
 * }
 */
export function isValidBugReport(data: unknown): data is BugReport {
  // Implementation...
  return false;
}
```

### Pattern 2: Deprecated Documentation

```typescript
/**
 * Validates a session path
 *
 * @deprecated Use {@link validateSessionPath} instead. This function will be removed in v2.0.0.
 * @param {string} path - Path to validate
 * @returns {boolean} True if valid
 * @todo Remove this function in version 2.0.0
 */
export function checkSessionPath(path: string): boolean {
  console.warn(
    'checkSessionPath is deprecated. Use validateSessionPath instead.'
  );
  return validateSessionPath(path);
}
```

### Pattern 3: Detailed Examples with Multiple Scenarios

```typescript
/**
 * Comprehensive session path validation
 *
 * Validates session paths against multiple criteria:
 * - Format: plan/XXX_<hash>/bugfix/XXX_<hash>
 * - Hash: 12 character hexadecimal string
 * - Number: 3-digit number
 *
 * @param {string} sessionPath - The session path to validate
 * @throws {ValidationError} With detailed error information
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH' - General format error
 * @throws {ValidationError} With code 'INVALID_HASH_FORMAT' - Hash is not 12 hex chars
 * @throws {ValidationError} With code 'INVALID_NUMBER_FORMAT' - Number is not 3 digits
 * @returns {void}
 * @example
 * // Valid session path
 * try {
 *   validateSessionPath('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 *   console.log('Path is valid');
 * } catch (error) {
 *   // Should not throw for valid path
 * }
 * @example
 * // Invalid session path - wrong format
 * try {
 *   validateSessionPath('invalid/path');
 * } catch (error) {
 *   console.log(error.code); // 'INVALID_SESSION_PATH'
 * }
 * @example
 * // Invalid session path - bad hash
 * try {
 *   validateSessionPath('plan/003_INVALID_HASH/bugfix/001_d5507a871918');
 * } catch (error) {
 *   console.log(error.code); // 'INVALID_HASH_FORMAT'
 * }
 */
export function validateSessionPath(sessionPath: string): void {
  // Implementation...
}
```

### Pattern 4: Documenting Overloaded Functions

```typescript
/**
 * Loads bug report data from various sources
 *
 * This function supports multiple input formats for loading bug reports.
 *
 * @overload
 * @param {string} sessionPath - Session path to load TEST_RESULTS.md from
 * @returns {Promise<BugReport>} Loaded bug report
 * @throws {ValidationError} If session path is invalid
 * @throws {ValidationError} If TEST_RESULTS.md is not found
 *
 * @overload
 * @param {BugReportData} data - Direct bug report data object
 * @returns {BugReport} Validated bug report
 * @throws {ValidationError} If data structure is invalid
 *
 * @param {string | BugReportData} input - Session path or data object
 * @returns {BugReport | Promise<BugReport>} Validated bug report
 * @example
 * // Load from session path
 * const report1 = await loadBugReport('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 * @example
 * // Load from data object
 * const report2 = loadBugReport({ description: 'Bug', steps: [] });
 */
export function loadBugReport(
  input: string | BugReportData
): BugReport | Promise<BugReport> {
  // Implementation...
  throw new Error('Not implemented');
}
```

## Best Practices

### 1. Always Document Parameters and Return Types

```typescript
// ✅ GOOD: Complete documentation
/**
 * Validates a path
 * @param {string} path - Path to validate
 * @returns {boolean} True if valid
 */
function validate(path: string): boolean { ... }

// ❌ BAD: Missing documentation
function validate(path: string) { ... }
```

### 2. Use Specific Error Types in @throws

```typescript
// ✅ GOOD: Specific error types and conditions
/**
 * @throws {ValidationError} With code 'PATH_NOT_FOUND' if file doesn't exist
 * @throws {ValidationError} With code 'INVALID_PATH' if format is invalid
 */

// ❌ BAD: Generic error
/**
 * @throws {Error} If validation fails
 */
```

### 3. Provide Concrete Examples

```typescript
// ✅ GOOD: Multiple examples showing different scenarios
/**
 * @example
 * // Valid path
 * validatePath('/src/index.ts'); // Returns true
 * @example
 * // Invalid path - contains null bytes
 * validatePath('/src/\0index.ts'); // Throws ValidationError
 */

// ❌ BAD: No examples or unclear examples
/**
 * @example
 * validatePath('path');
 */
```

### 4. Document Type Guards and Asserts

```typescript
// ✅ GOOD: Clear type guard documentation
/**
 * Type guard for string values
 * @param {unknown} value - Value to check
 * @returns {value is string} Type predicate
 * @example
 * if (isString(value)) {
 *   // TypeScript knows value is string here
 * }
 */

// ❌ BAD: Missing type predicate documentation
/**
 * Check if value is string
 * @param {*} value - Value
 * @returns {boolean} True if string
 */
```

### 5. Use @see for Related Functions

```typescript
// ✅ GOOD: References to related documentation
/**
 * Validates session path
 * @throws {ValidationError} If path is invalid
 * @see {@link validatePath} for general path validation
 * @see {@link SESSION_PATH_PATTERN} for the regex pattern
 */

// ❌ BAD: No cross-references
/**
 * Validates session path
 * @throws {ValidationError} If path is invalid
 */
```

### 6. Document Complex Objects with @typedef

```typescript
// ✅ GOOD: Structured type definition
/**
 * @typedef {Object} ValidationOptions
 * @property {boolean} [mustExist] - Whether path must exist
 * @property {boolean} [mustBeFile] - Whether path must be a file
 * @property {string[]} [allowedExtensions] - Allowed file extensions
 */

/**
 * @param {string} path - Path to validate
 * @param {ValidationOptions} [options] - Validation options
 */

// ❌ BAD: Embedded object documentation
/**
 * @param {string} path - Path to validate
 * @param {Object} [options] - Options object
 * @param {boolean} [options.mustExist] - Whether path must exist
 * @param {boolean} [options.mustBeFile] - Whether path must be a file
 * @param {string[]} [options.allowedExtensions] - Allowed extensions
 */
```

## Examples from Your Codebase

### Example 1: Session Path Validation

```typescript
/**
 * Validates the format of a session path
 *
 * Session paths must follow the pattern: plan/XXX_<hash>/bugfix/XXX_<hash>
 * where XXX is a 3-digit number and <hash> is a 12-character hexadecimal string.
 *
 * @param {string} sessionPath - The session path to validate
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH' if the format is invalid
 * @returns {void}
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
  const SESSION_PATH_PATTERN =
    /^plan\/\d{3}_[a-f0-9]{12}\/bugfix\/\d{3}_[a-f0-9]{12}$/;

  if (!SESSION_PATH_PATTERN.test(sessionPath)) {
    throw new ValidationError(
      `Invalid session path format: ${sessionPath}`,
      'INVALID_SESSION_PATH'
    );
  }
}
```

### Example 2: Bug Report Loading

```typescript
/**
 * Loads a bug report from TEST_RESULTS.md in a session directory
 *
 * This function performs comprehensive validation including:
 * - Session path format validation
 * - File existence check
 * - JSON parsing
 * - Schema validation
 *
 * @param {string} sessionPath - The session path containing TEST_RESULTS.md
 * @returns {Promise<BugReport>} The loaded and validated bug report
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH' if path format is invalid
 * @throws {ValidationError} With code 'PATH_NOT_FOUND' if TEST_RESULTS.md doesn't exist
 * @throws {ValidationError} With code 'INVALID_JSON' if JSON parsing fails
 * @throws {ValidationError} With code 'MISSING_REQUIRED_FIELD' if required fields are missing
 * @throws {Error} For unexpected filesystem or system errors
 * @example
 * const bugReport = await loadBugReport('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 * console.log('Bug description:', bugReport.description);
 */
export async function loadBugReport(sessionPath: string): Promise<BugReport> {
  validateSessionPath(sessionPath);

  const testResultsPath = path.join(sessionPath, 'TEST_RESULTS.md');

  if (!fs.existsSync(testResultsPath)) {
    throw new ValidationError(
      `TEST_RESULTS.md not found in session: ${sessionPath}`,
      'PATH_NOT_FOUND'
    );
  }

  // ... rest of implementation
}
```

### Example 3: Path Validation with Options

```typescript
/**
 * Path validation options
 * @typedef {Object} PathValidationOptions
 * @property {boolean} [checkNullBytes=true] - Check for null bytes in path
 * @property {boolean} [checkTraversal=true] - Check for directory traversal
 * @property {boolean} [mustExist=false] - Require path to exist
 * @property {boolean} [mustBeFile=false] - Require path to be a file (not directory)
 * @property {string[]} [allowedExtensions] - Allowed file extensions (e.g., ['.ts', '.js'])
 */

/**
 * Validates a file path with configurable security checks
 *
 * @param {string} path - The path to validate
 * @param {PathValidationOptions} [options={}] - Validation options
 * @returns {string} The normalized path if validation passes
 * @throws {ValidationError} With code 'NULL_BYTE_DETECTED' if null bytes found
 * @throws {ValidationError} With code 'PATH_TRAVERSAL_DETECTED' if traversal detected
 * @throws {ValidationError} With code 'PATH_NOT_FOUND' if path doesn't exist and mustExist is true
 * @throws {ValidationError} With code 'IS_DIRECTORY' if path is directory and mustBeFile is true
 * @throws {ValidationError} With code 'INVALID_EXTENSION' if extension not in allowedExtensions
 * @example
 * // Basic validation
 * const normalized = validatePath('./src/index.ts');
 * @example
 * // Strict validation
 * const normalized = validatePath('./src/index.ts', {
 *   mustExist: true,
 *   mustBeFile: true,
 *   allowedExtensions: ['.ts', '.tsx']
 * });
 */
export function validatePath(
  path: string,
  options: PathValidationOptions = {}
): string {
  // Implementation...
  return path;
}
```

## Key Takeaways

1. **Document all parameters** with types and descriptions
2. **Use specific error types** in `@throws` tags with error codes
3. **Provide concrete examples** showing both success and failure cases
4. **Use `@typedef`** for complex object types
5. **Document type predicates** with `@returns {value is Type}` syntax
6. **Use `@asserts`** for assertion functions
7. **Add cross-references** with `@see` to related documentation
8. **Include `@template`** for generic functions
9. **Use `@overload`** for function overloads
10. **Document thrown errors with codes** for better error handling

## Sources

While web search services are currently rate-limited, this research is based on:

- JSDoc Official Documentation: https://jsdoc.app/
- TypeScript JSDoc Reference: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- Google TypeScript Style Guide: https://google.github.io/styleguide/tsguide.html
- AirBnB JavaScript Style Guide: https://github.com/airbnb/javascript
- "Documentation-Driven Development" best practices
