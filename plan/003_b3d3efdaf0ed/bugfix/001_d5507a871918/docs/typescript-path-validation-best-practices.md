# TypeScript Path Validation Best Practices

## Overview

This document covers best practices for validating file paths in TypeScript/Node.js applications, focusing on security, cross-platform compatibility, and type safety.

## Table of Contents

1. [Core Path Module Usage](#core-path-module-usage)
2. [Security Considerations](#security-considerations)
3. [Validation Patterns](#validation-patterns)
4. [Common Pitfalls](#common-pitfalls)
5. [Recommended Libraries](#recommended-libraries)
6. [Code Examples](#code-examples)

## Core Path Module Usage

### Always Use Node.js `path` Module

```typescript
import * as path from 'path';
import { join, normalize, resolve, dirname, extname, basename } from 'path';

// ✅ GOOD: Use path module for cross-platform compatibility
const fullPath = path.join('src', 'utils', 'helpers.ts');
const normalized = path.normalize('../utils/file.ts');

// ❌ BAD: Manual string concatenation breaks on Windows
const badPath = 'src/utils/helpers.ts';
```

### Key Path Functions

- **`path.join(...segments)`**: Join path segments (platform-specific separator)
- **`path.normalize(path)`**: Normalize path, resolving `.` and `..`
- **`path.resolve(...segments)`**: Resolve to absolute path
- **`path.isAbsolute(path)`**: Check if path is absolute
- **`path.dirname(path)`**: Get directory name
- **`path.basename(path, ext?)`**: Get file name (with optional extension removal)
- **`path.extname(path)`**: Get file extension

## Security Considerations

### Prevent Directory Traversal Attacks

Directory traversal attacks occur when malicious paths like `../../../etc/passwd` are used to access files outside the intended directory.

```typescript
/**
 * Validates that a path doesn't escape the base directory
 * @param basePath - The root directory that paths should be restricted to
 * @param userPath - The user-provided path to validate
 * @returns Safe, resolved path within base directory
 * @throws {Error} If path attempts to escape base directory
 */
function validatePathSecurity(basePath: string, userPath: string): string {
  const resolvedBase = path.resolve(basePath);
  const resolvedUser = path.resolve(basePath, userPath);

  // Check if resolved path is within base directory
  if (!resolvedUser.startsWith(resolvedBase + path.sep)) {
    throw new Error(
      `Path validation failed: ${userPath} attempts to escape base directory`
    );
  }

  return resolvedUser;
}
```

### Sanitize Path Input

```typescript
/**
 * Sanitizes user-provided path input
 * @param inputPath - Raw user input path
 * @returns Sanitized path string
 */
function sanitizePath(inputPath: string): string {
  // Remove null bytes (can cause security issues)
  let sanitized = inputPath.replace(/\0/g, '');

  // Remove excessive whitespace
  sanitized = sanitized.trim();

  return sanitized;
}
```

### Prevent Path Injection

```typescript
import { statSync } from 'fs';

/**
 * Validates path and checks if it's a file (not a directory)
 * @param filePath - Path to validate
 * @throws {ValidationError} If path is invalid or is a directory
 */
function validateFilePath(filePath: string): void {
  const normalized = path.normalize(filePath);

  // Check for null bytes
  if (normalized.includes('\0')) {
    throw new ValidationError('Path contains null bytes', 'NULL_BYTE_DETECTED');
  }

  // Check if path exists
  try {
    const stats = statSync(normalized);
    if (stats.isDirectory()) {
      throw new ValidationError('Expected file but got directory', 'IS_DIRECTORY');
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Path does not exist', 'PATH_NOT_FOUND');
  }
}
```

## Validation Patterns

### Pattern 1: Type-Safe Path Validator

```typescript
interface PathValidationResult {
  isValid: boolean;
  normalizedPath?: string;
  error?: string;
}

/**
 * Validates and normalizes a file path
 * @param inputPath - Path to validate
 * @param options - Validation options
 * @returns Validation result with normalized path or error
 */
function validatePath(
  inputPath: string,
  options: {
    mustExist?: boolean;
    mustBeFile?: boolean;
    mustBeAbsolute?: boolean;
    allowedExtensions?: string[];
  } = {}
): PathValidationResult {
  try {
    // Sanitize input
    const sanitized = sanitizePath(inputPath);

    // Normalize path
    const normalized = path.normalize(sanitized);

    // Check if absolute (if required)
    if (options.mustBeAbsolute && !path.isAbsolute(normalized)) {
      return {
        isValid: false,
        error: 'Path must be absolute'
      };
    }

    // Check extension (if specified)
    if (options.allowedExtensions) {
      const ext = path.extname(normalized).toLowerCase();
      if (!options.allowedExtensions.includes(ext)) {
        return {
          isValid: false,
          error: `Extension ${ext} not allowed. Allowed: ${options.allowedExtensions.join(', ')}`
        };
      }
    }

    // Check existence (if required)
    if (options.mustExist) {
      if (!existsSync(normalized)) {
        return {
          isValid: false,
          error: 'Path does not exist'
        };
      }

      // Check if file (if required)
      if (options.mustBeFile) {
        const stats = statSync(normalized);
        if (stats.isDirectory()) {
          return {
            isValid: false,
            error: 'Path is a directory, not a file'
          };
        }
      }
    }

    return {
      isValid: true,
      normalizedPath: normalized
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Pattern 2: Path Type Guard

```typescript
/**
 * Type guard for valid file paths
 * @param value - Value to check
 * @returns True if value is a valid path string
 */
function isValidPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  // Check for empty string
  if (value.trim().length === 0) return false;

  // Check for null bytes
  if (value.includes('\0')) return false;

  // Check length limits (common filesystem limit)
  if (value.length > 260) return false; // Windows MAX_PATH

  // Check for invalid characters (Windows)
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(value)) return false;

  return true;
}
```

### Pattern 3: Session Path Pattern

Based on your codebase, here's a pattern for validating session paths:

```typescript
const SESSION_PATH_PATTERN = /^plan\/\d{3}_[a-f0-9]{12}\/bugfix\/\d{3}_[a-f0-9]{12}$/;

/**
 * Validates a session path format
 * @param sessionPath - Path to validate
 * @throws {ValidationError} If path format is invalid
 * @example
 * validateSessionPath('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 */
function validateSessionPath(sessionPath: string): void {
  if (!SESSION_PATH_PATTERN.test(sessionPath)) {
    throw new ValidationError(
      `Invalid session path format: ${sessionPath}. ` +
      `Expected format: plan/XXX_<hash>/bugfix/XXX_<hash>`,
      'INVALID_SESSION_PATH'
    );
  }
}
```

## Common Pitfalls

### ❌ Pitfall 1: Not Normalizing Paths

```typescript
// BAD: Doesn't handle relative paths
function badValidation(userPath: string) {
  return userPath === 'allowed/path.txt';
}

// GOOD: Normalizes first
function goodValidation(userPath: string) {
  return path.normalize(userPath) === path.normalize('allowed/path.txt');
}
```

### ❌ Pitfall 2: Platform-Specific Separators

```typescript
// BAD: Hard-coded forward slash
const badPath = 'src/utils/file.ts';

// GOOD: Use path module
const goodPath = path.join('src', 'utils', 'file.ts');
```

### ❌ Pitfall 3: Trusting User Input

```typescript
// BAD: No validation
const badFunc = (userPath: string) => {
  return fs.readFileSync(userPath);
};

// GOOD: Validate and sanitize
const goodFunc = (userPath: string, baseDir: string) => {
  const safePath = validatePathSecurity(baseDir, userPath);
  return fs.readFileSync(safePath);
};
```

## Recommended Libraries

### 1. `zod` - Schema Validation

```typescript
import { z } from 'zod';

const PathSchema = z.string().refine(
  (val) => !val.includes('..'),
  { message: "Path cannot contain '..'" }
).refine(
  (val) => !val.includes('\0'),
  { message: "Path cannot contain null bytes" }
);

const result = PathSchema.safeParse(userPath);
if (!result.success) {
  throw new ValidationError(result.error.message, 'INVALID_PATH');
}
```

### 2. `joi` - Object Schema Validation

```typescript
import Joi from 'joi';

const pathSchema = Joi.string()
  .regex(/^[a-zA-Z0-9_\-\/.]+$/)
  .max(260)
  .error(new Error('Invalid path format'));

const { error, value } = pathSchema.validate(userPath);
if (error) {
  throw new ValidationError(error.message, 'INVALID_PATH');
}
```

### 3. `express-validator` - For Express Apps

```typescript
import { body, validationResult } from 'express-validator';

app.post('/upload', [
  body('path')
    .trim()
    .notEmpty()
    .custom((value) => !value.includes('..'))
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process valid path
});
```

## Code Examples

### Complete Path Validator Class

```typescript
import * as path from 'path';
import { existsSync, statSync } from 'fs';
import { ValidationError } from './errors';

/**
 * Comprehensive path validation utility
 */
export class PathValidator {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  /**
   * Validates and resolves a path within the base directory
   * @param userPath - User-provided path
   * @returns Resolved, safe path
   * @throws {ValidationError} If validation fails
   */
  validate(userPath: string): string {
    const sanitized = this.sanitize(userPath);
    const resolved = this.resolve(sanitized);
    this.checkSecurity(resolved);
    this.checkExistence(resolved);
    return resolved;
  }

  private sanitize(inputPath: string): string {
    return inputPath.replace(/\0/g, '').trim();
  }

  private resolve(inputPath: string): string {
    return path.resolve(this.basePath, inputPath);
  }

  private checkSecurity(resolvedPath: string): void {
    if (!resolvedPath.startsWith(this.basePath + path.sep) &&
        resolvedPath !== this.basePath) {
      throw new ValidationError(
        'Path attempts to escape base directory',
        'PATH_TRAVERSAL_DETECTED'
      );
    }
  }

  private checkExistence(resolvedPath: string): void {
    if (!existsSync(resolvedPath)) {
      throw new ValidationError(
        'Path does not exist',
        'PATH_NOT_FOUND'
      );
    }
  }
}
```

## Key Takeaways

1. **Always use the `path` module** for cross-platform compatibility
2. **Normalize paths** before validation to handle `.` and `..`
3. **Sanitize input** to remove null bytes and trim whitespace
4. **Validate against directory traversal** by checking resolved paths stay within base directory
5. **Use type guards** for runtime type checking
6. **Throw custom errors** with clear error codes
7. **Check for null bytes** which can bypass security checks
8. **Use validation libraries** like Zod for complex validation logic
9. **Test edge cases** including empty strings, very long paths, and special characters
10. **Document validation rules** clearly with JSDoc comments

## Sources

While web search services are currently rate-limited, this research is based on:

- Node.js Official Documentation: https://nodejs.org/api/path.html
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- OWASP Path Traversal Security Guidelines
- Node.js Security Best Practices
- TypeScript Deep Dive by Basarat Ali Syed
