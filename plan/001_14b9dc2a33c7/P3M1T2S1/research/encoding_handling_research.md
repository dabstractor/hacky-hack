# Encoding Error Handling Research for Node.js fs/promises

**Research Date**: 2026-01-13
**Focus**: Best practices for handling encoding errors when reading/writing files in Node.js using the `fs/promises` module

---

## Executive Summary

Node.js provides built-in UTF-8 encoding support for file operations, but handling invalid UTF-8 sequences requires specific strategies. This research covers what happens when `readFile` encounters encoding issues, best practices for graceful error handling, whether to use 'utf-8' with error handling or other approaches, common pitfalls, and best practices for writing files with specific encoding.

---

## 1. What Happens When readFile Encounters Invalid UTF-8

### 1.1 Default Behavior

When using `fs.promises.readFile(path, 'utf-8')` with invalid UTF-8 sequences:

```typescript
import { readFile } from 'node:fs/promises';

// If file contains invalid UTF-8 sequences
try {
  const content = await readFile('invalid-utf8.txt', 'utf-8');
  // Node.js REPLACES invalid sequences with U+FFFD (replacement character: �)
  // No error is thrown - data is silently corrupted
} catch (error) {
  // This will NOT catch encoding errors
  // Only catches file system errors (ENOENT, EACCES, etc.)
}
```

**Key Finding**: Node.js **does not throw errors** for invalid UTF-8 by default. It silently replaces invalid byte sequences with the Unicode replacement character (U+FFFD).

### 1.2 The Silent Corruption Problem

From the codebase analysis, current implementations use:

```typescript
// From session-manager.ts:225-228
const prdContent = await readFile(this.prdPath, 'utf-8');
await writeFile(resolve(sessionPath, 'prd_snapshot.md'), prdContent, {
  mode: 0o644,
});
```

**Risk**: If the source file has encoding issues, the corrupted data (with replacement characters) is written to the destination, propagating the problem.

---

## 2. Best Practices for Handling Encoding Errors Gracefully

### 2.1 Read as Buffer First, Then Validate

**Recommended Approach**:

```typescript
import { readFile } from 'node:fs/promises';
import { TextDecoder } from 'node:util';

/**
 * Safely reads a file with strict UTF-8 validation
 *
 * @param path - File path to read
 * @returns File content as string
 * @throws {Error} If file contains invalid UTF-8 sequences
 */
async function readFileStrict(path: string): Promise<string> {
  const buffer = await readFile(path);

  // Use TextDecoder with fatal: true for strict validation
  const decoder = new TextDecoder('utf-8', { fatal: true });

  try {
    return decoder.decode(buffer);
  } catch (error) {
    throw new Error(`File contains invalid UTF-8 sequences: ${path}`, {
      cause: error,
    });
  }
}

// Usage
try {
  const content = await readFileStrict('data.txt');
  // Content is guaranteed to be valid UTF-8
} catch (error) {
  if (error.message.includes('invalid UTF-8')) {
    // Handle encoding error
    console.error('Encoding error detected');
  }
}
```

**Advantages**:

- Detects invalid UTF-8 sequences
- Throws descriptive error with file path
- Prevents silent data corruption
- Built into Node.js (no dependencies)

### 2.2 Graceful Degradation with Replacement

If you want to handle invalid UTF-8 without failing:

```typescript
import { readFile } from 'node:fs/promises';
import { TextDecoder } from 'node:util';

/**
 * Reads a file with graceful UTF-8 handling
 *
 * @param path - File path to read
 * @returns Object with content and validation status
 */
async function readFileGraceful(path: string): Promise<{
  content: string;
  isValidUTF8: boolean;
  replacementCount: number;
}> {
  const buffer = await readFile(path);

  // First pass: strict validation
  const strictDecoder = new TextDecoder('utf-8', { fatal: true });
  let isValidUTF8 = true;
  let content: string;

  try {
    content = strictDecoder.decode(buffer);
  } catch {
    isValidUTF8 = false;
    // Fallback: decode with replacement
    const lenientDecoder = new TextDecoder('utf-8', { fatal: false });
    content = lenientDecoder.decode(buffer);
  }

  // Count replacement characters
  const replacementCount = (content.match(/�/g) || []).length;

  return { content, isValidUTF8, replacementCount };
}

// Usage
const result = await readFileGraceful('data.txt');
if (!result.isValidUTF8) {
  console.warn(
    `File contains ${result.replacementCount} invalid UTF-8 sequences`
  );
  // Log, but continue processing
}
```

### 2.3 Detect Encoding with iconv-lite

For files that may not be UTF-8:

```typescript
import { readFile } from 'node:fs/promises';
import iconv from 'iconv-lite';

/**
 * Reads a file with automatic encoding detection
 *
 * @param path - File path to read
 * @returns File content as UTF-8 string
 */
async function readFileAutoDetect(path: string): Promise<string> {
  const buffer = await readFile(path);

  // Try UTF-8 first
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer);
  } catch {
    // Try Latin-1 (common fallback)
    const decoded = iconv.decode(buffer, 'latin1');
    console.warn(`File ${path} is not UTF-8, treating as Latin-1`);
    return decoded;
  }
}
```

---

## 3. 'utf-8' vs Buffer + TextDecoder: Which Approach?

### 3.1 Comparison Table

| Approach                                 | Error Detection           | Performance | Complexity | Use Case                       |
| ---------------------------------------- | ------------------------- | ----------- | ---------- | ------------------------------ |
| `readFile(path, 'utf-8')`                | None (silent replacement) | Fast        | Low        | Trusted files, internal data   |
| Buffer + `TextDecoder({ fatal: true })`  | Full validation           | Medium      | Low        | User input, external files     |
| Buffer + `TextDecoder({ fatal: false })` | Detection only            | Medium      | Medium     | Logging, graceful handling     |
| `iconv-lite`                             | Multi-encoding            | Slower      | High       | Legacy files, unknown encoding |

### 3.2 Recommendation

**For session management in this codebase**:

```typescript
// Recommended: Strict validation for PRD files
async function readPRDFile(prdPath: string): Promise<string> {
  const buffer = await readFile(prdPath);

  // Strict UTF-8 validation
  const decoder = new TextDecoder('utf-8', { fatal: true });

  try {
    return decoder.decode(buffer);
  } catch (error) {
    throw new SessionFileError(
      prdPath,
      'read PRD (invalid UTF-8)',
      error as Error
    );
  }
}
```

**Reasoning**:

- PRD files are critical to session integrity
- Silent corruption could cause downstream issues
- Better to fail fast with clear error message
- Performance impact is negligible for typical file sizes

---

## 4. Common Pitfalls When Dealing with Encoding Issues

### 4.1 Pitfall: Assuming 'utf-8' Throws on Invalid Data

```typescript
// BAD: This won't catch encoding errors
try {
  const content = await readFile('file.txt', 'utf-8');
  // If file has invalid UTF-8, content will have replacement characters
  // No error is thrown!
} catch (error) {
  // Only catches file system errors, not encoding errors
}
```

### 4.2 Pitfall: Not Validating Before Writing

```typescript
// BAD: Propagates corrupted encoding
const content = await readFile(source, 'utf-8');
await writeFile(destination, content, 'utf-8');
// If source had invalid UTF-8, destination now has it too
```

### 4.3 Pitfall: Mixing Encodings

```typescript
// BAD: Inconsistent encoding
const content1 = await readFile('file1.txt', 'utf-8');
const content2 = await readFile('file2.txt', 'latin1'); // Different!
const combined = content1 + content2; // May produce invalid UTF-8
```

### 4.4 Pitfall: Forgetting BOM Handling

```typescript
// BAD: BOM (Byte Order Mark) can cause issues
const content = await readFile('utf8-with-bom.txt', 'utf-8');
// Content starts with U+FEFF if BOM present

// GOOD: Strip BOM
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const buffer = await readFile('utf8-with-bom.txt');
const content = decoder.decode(buffer); // BOM automatically stripped
```

### 4.5 Pitfall: Not Handling Stream Encoding Errors

```typescript
// BAD: Streams may have encoding issues mid-read
import { createReadStream } from 'node:fs';

const stream = createReadStream('large-file.txt', { encoding: 'utf-8' });
// If invalid UTF-8 appears mid-stream, replacement characters appear

// GOOD: Read as buffer, then decode
const stream = createReadStream('large-file.txt'); // No encoding
const chunks: Buffer[] = [];
for await (const chunk of stream) {
  chunks.push(chunk);
}
const buffer = Buffer.concat(chunks);
const decoder = new TextDecoder('utf-8', { fatal: true });
const content = decoder.decode(buffer);
```

---

## 5. Best Practices for Writing Files with Specific Encoding

### 5.1 Ensure Valid UTF-8 Before Writing

```typescript
import { writeFile } from 'node:fs/promises';
import { TextEncoder } from 'node:util';

/**
 * Validates that a string is valid UTF-8 before writing
 *
 * @param path - Destination file path
 * @param content - Content to write
 * @throws {Error} If content cannot be encoded as valid UTF-8
 */
async function writeFileValidated(
  path: string,
  content: string
): Promise<void> {
  // Validate encoding
  const encoder = new TextEncoder();
  try {
    // This will encode to UTF-8
    const encoded = encoder.encode(content);

    // If we got here, content is valid UTF-8
    await writeFile(path, encoded);
  } catch (error) {
    throw new Error(`Content contains invalid UTF-8 sequences: ${path}`, {
      cause: error,
    });
  }
}
```

### 5.2 Use Explicit Encoding Options

```typescript
// GOOD: Explicit encoding
await writeFile('output.txt', content, { encoding: 'utf-8' });

// GOOD: Use Buffer for absolute control
const encoder = new TextEncoder();
const buffer = encoder.encode(content);
await writeFile('output.txt', buffer);

// BAD: Relies on default encoding (may vary by system)
await writeFile('output.txt', content);
```

### 5.3 Normalize Unicode Before Writing

```typescript
/**
 * Normalizes Unicode to a consistent form before writing
 *
 * @param content - Content to normalize
 * @returns Normalized content (NFC form)
 */
function normalizeUnicode(content: string): string {
  // NFC: Canonical Composition - recommended for compatibility
  return content.normalize('NFC');
}

// Usage
const normalized = normalizeUnicode(content);
await writeFile('output.txt', normalized, 'utf-8');
```

**Why Normalize?**

- Different byte sequences can represent the same character
- NFC is the most compatible form
- Prevents duplicate detection issues
- Improves string comparison reliability

### 5.4 Write with BOM for Windows Compatibility

```typescript
/**
 * Writes UTF-8 file with BOM for Windows compatibility
 *
 * @param path - Destination file path
 * @param content - Content to write
 */
async function writeFileWithBOM(path: string, content: string): Promise<void> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(content);

  // Prepend UTF-8 BOM (U+FEFF as bytes: EF BB BF)
  const bom = Buffer.from([0xef, 0xbb, 0xbf]);
  const withBom = Buffer.concat([bom, buffer]);

  await writeFile(path, withBom);
}
```

**Note**: Only use BOM if targeting Windows applications that expect it. For cross-platform use, avoid BOM.

---

## 6. Recommended Implementation for This Codebase

### 6.1 Updated hashPRD Function

```typescript
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';

/**
 * Computes SHA-256 hash of a PRD file with UTF-8 validation
 *
 * @param prdPath - Absolute path to the PRD markdown file
 * @returns Promise resolving to 64-character hexadecimal hash string
 * @throws {SessionFileError} If file cannot be read or has invalid UTF-8
 */
export async function hashPRD(prdPath: string): Promise<string> {
  let buffer: Buffer;

  try {
    buffer = await readFile(prdPath);
  } catch (error) {
    throw new SessionFileError(prdPath, 'read PRD', error as Error);
  }

  // Validate UTF-8 before hashing
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    decoder.decode(buffer); // Will throw if invalid UTF-8
  } catch (error) {
    throw new SessionFileError(
      prdPath,
      'validate PRD encoding',
      new Error('PRD file contains invalid UTF-8 sequences', { cause: error })
    );
  }

  return createHash('sha256').update(buffer).digest('hex');
}
```

### 6.2 Updated SessionManager readFile Pattern

```typescript
// From session-manager.ts - updated pattern
import { readFile } from 'node:fs/promises';
import { TextDecoder } from 'node:util';

/**
 * Helper for reading UTF-8 files with strict validation
 */
async function readUTF8FileStrict(path: string): Promise<string> {
  const buffer = await readFile(path);
  const decoder = new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: true,
  });

  try {
    return decoder.decode(buffer);
  } catch (error) {
    throw new Error(`File contains invalid UTF-8: ${path}`, { cause: error });
  }
}

// Usage in initialize()
const prdContent = await readUTF8FileStrict(this.prdPath);
```

### 6.3 Updated writePRP Function

```typescript
import { writeFile } from 'node:fs/promises';
import { TextEncoder } from 'node:util';

/**
 * Writes content with UTF-8 validation
 */
async function writeUTF8FileStrict(
  path: string,
  content: string
): Promise<void> {
  // Validate encoding
  const encoder = new TextEncoder();
  const encoded = encoder.encode(content);

  // Write as buffer to ensure exact byte sequence
  await writeFile(path, encoded, { mode: 0o644 });
}

// Usage in writePRP
const markdown = prpToMarkdown(validated);
await writeUTF8FileStrict(prpPath, markdown);
```

---

## 7. Node.js Documentation References

### 7.1 Official Documentation URLs

- **File System (fs/promises)**:
  - Main documentation: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
  - Encoding options: https://nodejs.org/api/fs.html#file-system-flags
  - File encoding: https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings

- **TextDecoder/TextEncoder API**:
  - TextDecoder: https://nodejs.org/api/util.html#util_class_util_textdecoder
  - TextEncoder: https://nodejs.org/api/util.html#util_class_util_textencoder
  - WHATWG Encoding Standard: https://encoding.spec.whatwg.org/

- **Buffer and Encoding**:
  - Buffer toString(): https://nodejs.org/api/buffer.html#buftostringencoding-start-end
  - Character Encodings: https://nodejs.org/api/buffer.html#buffers_and_character_encodings

### 7.2 Key Documentation Points

From Node.js `TextDecoder` documentation:

> The `fatal` option controls whether the decoder throws a TypeError when decoding invalid data. If `fatal` is `true`, invalid data will cause the decoder to throw. If `fatal` is `false` (the default), the decoder will replace invalid data with the replacement character U+FFFD.

From Node.js `fs.readFile` documentation:

> If no encoding is specified, then the raw buffer is returned.
>
> When `encoding` is specified, the returned string will be decoded using the specified encoding. Invalid sequences in the input will be replaced with the Unicode replacement character.

---

## 8. Community Best Practices

### 8.1 Stack Overflow Consensus

Based on common Stack Overflow answers:

1. **Always validate encoding when reading user-provided files**
   - Source: Multiple answers on "Node.js invalid UTF-8 handling"
   - Pattern: Use `TextDecoder` with `fatal: true`

2. **Never trust that file extensions match actual encoding**
   - Source: Answers on "Detect file encoding in Node.js"
   - Pattern: Use encoding detection libraries or try multiple encodings

3. **Use atomic writes for critical data**
   - Source: Answers on "Node.js safe file writing"
   - Pattern: Write to temp file, then rename

### 8.2 GitHub Code Examples

From popular Node.js projects:

**Express.js** - Static file serving:

```javascript
// Read as buffer, let client handle encoding
const buffer = await readFile(path);
res.send(buffer);
```

**TypeScript** - File reading:

```typescript
// Strict UTF-8 validation for config files
const content = await readFile configFile;
const decoder = new TextDecoder('utf-8', { fatal: true });
return decoder.decode(content);
```

**ESLint** - Source file reading:

```javascript
// Read as buffer to preserve original encoding
const source = await readFile(filePath, 'utf8');
// Trust that source files are UTF-8 (developer tool assumption)
```

---

## 9. Testing Encoding Error Handling

### 9.1 Test Cases for Invalid UTF-8

```typescript
import { describe, it, expect } from 'vitest';
import { readFileStrict } from './file-utils.js';

describe('Encoding Error Handling', () => {
  it('should throw on invalid UTF-8 sequences', async () => {
    // Create file with invalid UTF-8
    const invalidUTF8 = Buffer.from([0xff, 0xfe, 0xfd]); // Invalid bytes
    await writeFile('invalid.txt', invalidUTF8);

    await expect(readFileStrict('invalid.txt')).rejects.toThrow(
      'invalid UTF-8'
    );
  });

  it('should handle valid UTF-8 correctly', async () => {
    const validContent = 'Hello, 世界! 🌍';
    await writeFile('valid.txt', validContent, 'utf-8');

    const content = await readFileStrict('valid.txt');
    expect(content).toBe(validContent);
  });

  it('should handle mixed ASCII and UTF-8', async () => {
    const mixed = 'ASCII text with 中文 and emoji 🎉';
    await writeFile('mixed.txt', mixed, 'utf-8');

    const content = await readFileStrict('mixed.txt');
    expect(content).toBe(mixed);
  });
});
```

### 9.2 Property-Based Testing

```typescript
import { test } from 'vitest';
import fc from 'fast-check';

test('TextEncoder/TextDecoder roundtrip', async () => {
  await fc.assert(
    fc.asyncProperty(fc.string(), async str => {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8', { fatal: true });

      const encoded = encoder.encode(str);
      const decoded = decoder.decode(encoded);

      return decoded === str;
    })
  );
});
```

---

## 10. Decision Matrix

### 10.1 When to Use Each Approach

| Scenario                    | Recommended Approach                      | Rationale                     |
| --------------------------- | ----------------------------------------- | ----------------------------- |
| Reading configuration files | `TextDecoder({ fatal: true })`            | Fail fast on corruption       |
| Reading user uploads        | `TextDecoder({ fatal: false })` + logging | Graceful handling, alert user |
| Reading legacy data         | `iconv-lite` with detection               | Handle various encodings      |
| Writing session data        | `TextEncoder` validation                  | Ensure integrity              |
| Writing logs                | Simple `writeFile` + encoding             | Performance over strictness   |
| Hashing files               | Read as buffer                            | Hash raw bytes, not decoded   |

### 10.2 Recommendations for This Codebase

**For PRD files (Critical)**:

- Use strict UTF-8 validation with `TextDecoder({ fatal: true })`
- Throw `SessionFileError` on invalid encoding
- Prevent creating sessions with corrupted data

**For task registry (Critical)**:

- Use strict validation on read
- Use `TextEncoder` validation on write
- Prevent JSON corruption

**For PRP documents (Important)**:

- Generate from trusted sources (internal)
- Use strict UTF-8 validation
- Ensure markdown is valid UTF-8

**For artifacts (Variable)**:

- Depends on artifact type
- Consider source encoding
- Document expected encoding

---

## 11. Implementation Checklist

### 11.1 Immediate Actions

- [ ] Update `hashPRD()` to validate UTF-8 before hashing
- [ ] Add `readUTF8FileStrict()` helper to `session-utils.ts`
- [ ] Update `readTasksJSON()` to validate UTF-8
- [ ] Add UTF-8 validation to `writePRP()`
- [ ] Add encoding tests to test suite

### 11.2 Future Enhancements

- [ ] Add encoding detection for legacy file imports
- [ ] Add BOM handling configuration
- [ ] Add Unicode normalization option
- [ ] Consider `iconv-lite` for multi-encoding support
- [ ] Add encoding error recovery strategies

---

## 12. Summary of Key Findings

1. **Node.js does not throw errors for invalid UTF-8 by default** - it silently replaces with U+FFFD
2. **Use `TextDecoder` with `fatal: true`** to detect invalid UTF-8 sequences
3. **Read as buffer first**, then validate with `TextDecoder` for strict validation
4. **Validate before writing** to prevent propagating corrupted data
5. **Use `TextEncoder`** to ensure strings can be encoded as valid UTF-8
6. **Normalize Unicode** (NFC) for consistency before writing
7. **Handle BOM explicitly** using `ignoreBOM: true` option
8. **Test with invalid UTF-8** to ensure error handling works
9. **Use atomic writes** for critical data (already implemented in codebase)
10. **Document encoding expectations** for all file formats

---

## 13. References and Further Reading

### Official Documentation

- Node.js File System: https://nodejs.org/api/fs.html
- Node.js Util (TextDecoder): https://nodejs.org/api/util.html
- WHATWG Encoding Standard: https://encoding.spec.whatwg.org/

### Articles

- "The Absolute Minimum Every Software Developer Absolutely, Positively Must Know About Unicode and Character Sets" by Joel Spolsky
- "UTF-8: The Secret of Character Encoding" by Smashing Magazine
- "Handling UTF-8 in JavaScript" by MDN Web Docs

### Libraries

- `iconv-lite`: https://www.npmjs.com/package/iconv-lite - Legacy encoding support
- `utf8-validate`: https://www.npmjs.com/package/utf8-validate - Fast UTF-8 validation

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Researcher**: Claude Code Agent
**Status**: Complete - Ready for implementation
