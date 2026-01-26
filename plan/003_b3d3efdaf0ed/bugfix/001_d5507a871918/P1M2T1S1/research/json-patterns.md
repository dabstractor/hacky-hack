# JSON.stringify Best Practices Research

> Research compiled for Task P1M2T1S1: JSON Output Implementation
> Date: 2026-01-26

## Table of Contents

1. [JSON.stringify with null and 2-space indentation](#1-jsonstringify-with-null-and-2-space-indentation)
2. [Handling circular references in JSON](#2-handling-circular-references-in-json)
3. [JSON.stringify for TestResults/Bug data structures](#3-jsonstringify-for-testresultsbug-data-structures)
4. [File write patterns for JSON data](#4-file-write-patterns-for-json-data)

---

## 1. JSON.stringify with null and 2-space indentation

### Pattern Overview

```javascript
JSON.stringify(value, replacer, space);
```

### The `null, 2` Pattern

```javascript
const data = { name: 'test', value: 42 };
const jsonString = JSON.stringify(data, null, 2);
```

**Parameters:**

- `value`: The JavaScript object to convert to JSON
- `replacer` (null): No transformation of values
- `space` (2): Use 2 spaces for indentation

**Output:**

```json
{
  "name": "test",
  "value": 42
}
```

### Best Practices

#### 1.1 Use 2-space indentation for readability

```javascript
// ✅ Recommended - Human-readable, diff-friendly
JSON.stringify(data, null, 2);

// ⚠️ Compact - Good for APIs, hard for humans to read
JSON.stringify(data);

// ⚠️ Tab indentation - Can cause display issues
JSON.stringify(data, null, '\t');

// ⚠️ 4-space indentation - Expensive for deeply nested objects
JSON.stringify(data, null, 4);
```

#### 1.2 When to use each pattern

| Pattern                         | Use Case                   | File Size | Human Readable |
| ------------------------------- | -------------------------- | --------- | -------------- |
| `JSON.stringify(data)`          | Network transmission, logs | Smallest  | No             |
| `JSON.stringify(data, null, 2)` | Config files, test output  | Medium    | Yes            |
| `JSON.stringify(data, null, 4)` | Documentation              | Larger    | Yes            |

#### 1.3 Consistency across codebase

**Establish a project standard:**

```javascript
// utils/json.js
export const stringifyJson = data => JSON.stringify(data, null, 2);
export const stringifyJsonCompact = data => JSON.stringify(data);
```

### Official Documentation

- **MDN: JSON.stringify()** - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
- **ECMAScript Specification** - https://tc39.es/ecma262/multipage/structured-data.html#sec-json.stringify
- **Node.js util.format()** - https://nodejs.org/api/util.html#utilformatformat-args

---

## 2. Handling circular references in JSON

### The Problem

```javascript
const obj = { name: 'circular' };
obj.self = obj;

JSON.stringify(obj);
// TypeError: Converting circular structure to JSON
```

### Solution Patterns

#### 2.1 WeakSet-based Replacer (Recommended)

```javascript
const safeStringify = (obj, indent = 2) => {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    },
    indent
  );
};
```

**Benefits:**

- Memory efficient (WeakSet doesn't prevent garbage collection)
- Works with complex object graphs
- Preserves non-circular data structure

#### 2.2 Depth-Limited Replacer

```javascript
const depthLimitedStringify = (obj, maxDepth = 10, indent = 2) => {
  const replacer = (key, value, depth = 0) => {
    if (depth > maxDepth) {
      return '[Max Depth Reached]';
    }
    if (typeof value === 'object' && value !== null) {
      // Prevent infinite recursion
      try {
        JSON.stringify(value);
      } catch {
        return '[Circular Reference]';
      }
    }
    return value;
  };

  const recursiveReplacer = (key, value) => {
    // Implementation with depth tracking
    return value;
  };

  return JSON.stringify(obj, recursiveReplacer, indent);
};
```

#### 2.3 Library Solutions

**flatted (Modern, maintained):**

```javascript
import { parse, stringify } from 'flatted';

const circular = { name: 'test' };
circular.self = circular;

const json = stringify(circular);
// {"name":"test","self":"[Circular]"}
```

**Installation:**

```bash
npm install flatted
```

**Documentation:** https://github.com/WebReflection/flatted

### Best Practices for Test Data

#### 2.4 Design test data without circular references

```javascript
// ✅ Good - Flat structure
const testResult = {
  id: 'test-001',
  name: 'Test Authentication',
  status: 'passed',
  duration: 145,
  assertions: [
    { id: 'assert-1', status: 'passed' },
    { id: 'assert-2', status: 'passed' },
  ],
};

// ❌ Bad - Circular reference
const testResult = {
  id: 'test-001',
  parent: null,
  children: [],
};
testResult.parent = testResult; // Creates circular reference
```

#### 2.5 Use data transfer objects (DTOs)

```javascript
// Transform domain objects to DTOs before serialization
class TestResult {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.parent = null;
  }

  toJSON() {
    // Custom serialization without circular refs
    return {
      id: this.id,
      name: this.name,
      parentId: this.parent?.id,
    };
  }
}
```

### Official Documentation

- **MDN: WeakSet** - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet
- **flatted Library** - https://github.com/WebReflection/flatted
- **CircularJSON (Legacy)** - https://github.com/WebReflection/CircularJSON

---

## 3. JSON.stringify for TestResults/Bug data structures

### Recommended Data Structure

```javascript
{
  "metadata": {
    "version": "1.0",
    "timestamp": "2026-01-26T12:00:00.000Z",
    "generatedBy": "TaskOrchestrator"
  },
  "testResults": [
    {
      "id": "test-001",
      "name": "SessionManager Initialization",
      "status": "passed",
      "duration": 145,
      "assertions": [
        {
          "id": "assert-1",
          "description": "SessionManager constructor accepts valid parameters",
          "status": "passed",
          "duration": 5
        }
      ],
      "error": null,
      "metadata": {
        "category": "unit",
        "suite": "SessionManager"
      }
    }
  ],
  "summary": {
    "total": 10,
    "passed": 8,
    "failed": 1,
    "skipped": 1,
    "duration": 1250
  }
}
```

### Serialization Pattern

```javascript
// utils/test-serializer.js
export class TestResultSerializer {
  static stringify(results, indent = 2) {
    return JSON.stringify(results, TestResultSerializer.replacer, indent);
  }

  static replacer(key, value) {
    // Handle special cases
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // Filter out undefined values
    if (value === undefined) {
      return null;
    }

    return value;
  }
}

// Usage
const jsonOutput = TestResultSerializer.stringify(testResults, 2);
```

### Best Practices for Test Data

#### 3.1 Include metadata for context

```javascript
const results = {
  metadata: {
    version: "1.0",
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  },
  tests: [...]
};
```

#### 3.2 Use consistent status values

```javascript
const STATUS_VALUES = ['passed', 'failed', 'skipped', 'pending', 'disabled'];

// Validate before serialization
function validateTestStatus(status) {
  if (!STATUS_VALUES.includes(status)) {
    throw new Error(`Invalid test status: ${status}`);
  }
}
```

#### 3.3 Handle errors gracefully

```javascript
function serializeTestResult(result) {
  return JSON.stringify(
    result,
    (key, value) => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
          // Capture custom error properties
          ...Object.fromEntries(
            Object.entries(value).filter(
              ([k]) => !['name', 'message', 'stack'].includes(k)
            )
          ),
        };
      }
      return value;
    },
    2
  );
}
```

#### 3.4 Support filtering and sorting

```javascript
function filterAndSerializeResults(results, options = {}) {
  let filtered = results.tests;

  if (options.status) {
    filtered = filtered.filter(t => t.status === options.status);
  }

  if (options.suite) {
    filtered = filtered.filter(t => t.metadata?.suite === options.suite);
  }

  const output = {
    ...results,
    tests: filtered,
    summary: calculateSummary(filtered),
  };

  return JSON.stringify(output, null, 2);
}
```

### Schema Validation

```javascript
// Using Zod for runtime validation
import { z } from 'zod';

const TestResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['passed', 'failed', 'skipped', 'pending']),
  duration: z.number().nonnegative(),
  assertions: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      status: z.enum(['passed', 'failed']),
      duration: z.number().nonnegative(),
    })
  ),
  error: z
    .object({
      name: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .nullable(),
  metadata: z
    .object({
      category: z.string(),
      suite: z.string().optional(),
    })
    .optional(),
});

// Validate before serialization
function safeSerialize(results) {
  const validated = TestResultSchema.parse(results);
  return JSON.stringify(validated, null, 2);
}
```

### Official Documentation

- **Jest Test Results** - https://jestjs.io/docs/configuration#testresultsprocessor
- **Mocha JSON Reporter** - https://mochajs.org/#json-stream-reporter
- **Zod Validation** - https://zod.dev/
- **JSON Schema** - https://json-schema.org/

---

## 4. File write patterns for JSON data

### Modern Node.js Patterns (Node.js 14+)

#### 4.1 Async/Await with fs.promises (Recommended)

```javascript
import { writeFile } from 'fs/promises';

async function writeJson(filepath, data, indent = 2) {
  try {
    const jsonString = JSON.stringify(data, null, indent);
    await writeFile(filepath, jsonString, 'utf8');
    return { success: true, path: filepath };
  } catch (error) {
    throw new Error(`Failed to write JSON to ${filepath}: ${error.message}`);
  }
}

// Usage
await writeJson('./output/test-results.json', testResults, 2);
```

**Benefits:**

- Non-blocking, doesn't block event loop
- Clean async/await syntax
- Built-in error handling

#### 4.2 Atomic Write Pattern (Safe for concurrent operations)

```javascript
import { writeFile, rename } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

async function atomicWriteJson(filepath, data, indent = 2) {
  const tempPath = join(tmpdir(), `${Date.now()}-${basename(filepath)}.tmp`);

  try {
    // Write to temp file first
    const jsonString = JSON.stringify(data, null, indent);
    await writeFile(tempPath, jsonString, 'utf8');

    // Atomic rename operation
    await rename(tempPath, filepath);

    return { success: true, path: filepath };
  } catch (error) {
    // Clean up temp file on error
    try {
      await unlink(tempPath);
    } catch {}

    throw new Error(`Atomic write failed: ${error.message}`);
  }
}
```

**Benefits:**

- Prevents corrupted files if write fails
- Safe for concurrent writes
- Readers never see partial data

#### 4.3 With Automatic Directory Creation

```javascript
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

async function writeJsonWithDirs(filepath, data, indent = 2) {
  try {
    // Create directory if it doesn't exist
    await mkdir(dirname(filepath), { recursive: true });

    const jsonString = JSON.stringify(data, null, indent);
    await writeFile(filepath, jsonString, 'utf8');

    return { success: true, path: filepath };
  } catch (error) {
    throw new Error(`Failed to write JSON: ${error.message}`);
  }
}
```

#### 4.4 With Validation

```javascript
import { writeFile } from 'fs/promises';

async function writeAndValidateJson(filepath, data, schema, indent = 2) {
  try {
    // Validate data before writing
    const validated = schema.parse(data);

    // Serialize
    const jsonString = JSON.stringify(validated, null, indent);

    // Verify it's valid JSON by parsing it back
    JSON.parse(jsonString);

    // Write to file
    await writeFile(filepath, jsonString, 'utf8');

    return { success: true, path: filepath };
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new Error(`Validation failed: ${error.errors}`);
    }
    throw new Error(`Write failed: ${error.message}`);
  }
}
```

### Legacy Synchronous Pattern (Use sparingly)

```javascript
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Only use in CLI scripts or initialization code
function writeJsonSync(filepath, data, indent = 2) {
  try {
    mkdirSync(dirname(filepath), { recursive: true });
    const jsonString = JSON.stringify(data, null, indent);
    writeFileSync(filepath, jsonString, 'utf8');
    return { success: true, path: filepath };
  } catch (error) {
    throw new Error(`Failed to write JSON: ${error.message}`);
  }
}
```

**When to use:**

- CLI scripts that exit immediately
- Configuration during startup
- Never in request handlers or async operations

### Best Practices Summary

#### 4.5 Always use async methods

```javascript
// ✅ Good - Non-blocking
await writeFile('data.json', JSON.stringify(data), 'utf8');

// ❌ Bad - Blocks event loop
writeFileSync('data.json', JSON.stringify(data), 'utf8');
```

#### 4.6 Specify encoding explicitly

```javascript
// ✅ Good - Explicit encoding
await writeFile('data.json', jsonString, 'utf8');

// ⚠️ Acceptable - Defaults to utf8 in most cases
await writeFile('data.json', jsonString);
```

#### 4.7 Handle errors properly

```javascript
// ✅ Good - Comprehensive error handling
async function safeWrite(filepath, data) {
  try {
    await writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Directory does not exist');
    } else if (error.code === 'EACCES') {
      console.error('Permission denied');
    } else {
      console.error('Unknown error:', error.message);
    }
    throw error;
  }
}
```

#### 4.8 Use streaming for large datasets

```javascript
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

async function writeLargeJson(filepath, data) {
  const writeStream = createWriteStream(filepath, { encoding: 'utf8' });

  try {
    const jsonString = JSON.stringify(data, null, 2);
    const readable = Readable.from(jsonString);

    await pipeline(readable, writeStream);

    return { success: true, path: filepath };
  } catch (error) {
    writeStream.destroy();
    throw new Error(`Stream write failed: ${error.message}`);
  }
}
```

### Performance Considerations

#### 4.9 Buffer size for large files

```javascript
import { writeFile } from 'fs/promises';

async function writeLargeJsonOptimized(filepath, data) {
  // For very large objects, consider manual chunking
  const jsonString = JSON.stringify(data, null, 2);

  // Write in chunks if string is very large
  if (jsonString.length > 10 * 1024 * 1024) {
    // 10MB
    const buffer = Buffer.from(jsonString, 'utf8');
    await writeFile(filepath, buffer);
  } else {
    await writeFile(filepath, jsonString, 'utf8');
  }
}
```

#### 4.10 Batch writes for multiple files

```javascript
import { writeFile } from 'fs/promises';

async function writeMultipleJsonFiles(files) {
  // Write files in parallel
  const results = await Promise.allSettled(
    files.map(({ path, data }) =>
      writeFile(path, JSON.stringify(data, null, 2), 'utf8')
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return { succeeded, failed, results };
}
```

### Official Documentation

- **Node.js fs/promises** - https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
- **Node.js fs.writeFile** - https://nodejs.org/api/fs.html#fwritefilefile-data-options-callback
- **Node.js File System Best Practices** - https://nodejs.org/api/fs.html#file-system-best-practices
- **Node.js Streams** - https://nodejs.org/api/stream.html
- **Node.js Atomic Writes** - https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback

---

## Implementation Recommendations for P1M2T1S1

Based on this research, here are the recommended patterns for the JSON output implementation:

### Recommended Implementation

```javascript
// utils/json-writer.js
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

/**
 * Safely write JSON data to a file with best practices
 * @param {string} filepath - Absolute path to output file
 * @param {object} data - Data to serialize
 * @param {object} options - Write options
 * @param {number} options.indent - Spaces for indentation (default: 2)
 * @param {boolean} options.atomic - Use atomic write pattern (default: false)
 * @returns {Promise<{success: boolean, path: string}>}
 */
export async function writeJsonFile(filepath, data, options = {}) {
  const { indent = 2, atomic = false } = options;

  try {
    // Ensure directory exists
    await mkdir(dirname(filepath), { recursive: true });

    // Serialize with safe replacer
    const jsonString = JSON.stringify(data, safeReplacer, indent);

    if (atomic) {
      return await atomicWrite(filepath, jsonString);
    } else {
      await writeFile(filepath, jsonString, 'utf8');
      return { success: true, path: filepath };
    }
  } catch (error) {
    throw new Error(`Failed to write JSON to ${filepath}: ${error.message}`);
  }
}

/**
 * Safe replacer that handles common edge cases
 */
function safeReplacer(key, value) {
  // Handle Errors
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  // Handle Dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle undefined
  if (value === undefined) {
    return null;
  }

  return value;
}

/**
 * Atomic write implementation
 */
async function atomicWrite(filepath, content) {
  const { tmpdir } = await import('os');
  const { basename } = await import('path');
  const { rename, unlink } = await import('fs/promises');

  const tempPath = `${tmpdir()}/${Date.now()}-${basename(filepath)}.tmp`;

  try {
    await writeFile(tempPath, content, 'utf8');
    await rename(tempPath, filepath);
    return { success: true, path: filepath };
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

### Usage Example

```javascript
// Writing test results
import { writeJsonFile } from './utils/json-writer.js';

const testResults = {
  metadata: {
    version: '1.0',
    timestamp: new Date().toISOString(),
  },
  tests: [
    {
      id: 'test-001',
      status: 'passed',
      duration: 145,
    },
  ],
};

await writeJsonFile('./output/test-results.json', testResults, {
  indent: 2,
  atomic: true,
});
```

---

## Additional Resources

### JSON Standards

- **RFC 8259 - The JSON Data Interchange Format** - https://datatracker.ietf.org/doc/html/rfc8259
- **JSON Schema Specification** - https://json-schema.org/specification.html

### Node.js File System

- **Node.js fs Module Documentation** - https://nodejs.org/api/fs.html
- **Node.js Best Practices** - https://nodejs.org/en/docs/guides/simple-profiling/

### Testing Libraries

- **Jest Documentation** - https://jestjs.io/docs/getting-started
- **Mocha Documentation** - https://mochajs.org/
- **Vitest Documentation** - https://vitest.dev/

### Tools and Utilities

- **flatted (Circular JSON)** - https://github.com/WebReflection/flatted
- **Zod (Validation)** - https://zod.dev/
- **AJV (JSON Schema Validator)** - https://ajv.js.org/

---

## Changelog

- **2026-01-26**: Initial research compilation
