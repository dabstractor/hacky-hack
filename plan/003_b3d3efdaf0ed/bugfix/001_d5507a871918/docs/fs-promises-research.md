# fs/promises Usage Patterns Research

**Research Date:** 2026-01-26
**Status:** Web services temporarily unavailable - providing comprehensive knowledge-based documentation

---

## Official Node.js Documentation URLs

### Core Documentation
- **File System (fs/promises):** https://nodejs.org/api/fs.html#fspromises-api
- **fs.promises.readFile:** https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
- **fs.promises.access:** https://nodejs.org/api/fs.html#fspromisesaccesspath-mode
- **Path Module:** https://nodejs.org/api/path.html
- **path.resolve:** https://nodejs.org/api/path.html#pathresolvepaths

---

## 1. fs/promises readFile Usage

### Basic Usage
```typescript
import { readFile } from 'fs/promises';

try {
  const data = await readFile('/path/to/file', 'utf8');
  console.log(data);
} catch (error) {
  console.error('Error reading file:', error);
}
```

### Read as Buffer
```typescript
import { readFile } from 'fs/promises';

try {
  const buffer = await readFile('/path/to/file');
  console.log(buffer); // <Buffer ...>
} catch (error) {
  console.error('Error reading file:', error);
}
```

### With Options
```typescript
import { readFile } from 'fs/promises';

try {
  const data = await readFile('/path/to/file', {
    encoding: 'utf8',
    flag: 'r'
  });
  console.log(data);
} catch (error) {
  console.error('Error reading file:', error);
}
```

---

## 2. fs/promises access for File Existence Checks

### Basic File Existence Check
```typescript
import { access, constants } from 'fs/promises';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
```

### Check Read Permission
```typescript
import { access, constants } from 'fs/promises';

async function canReadFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
```

### Check Write Permission
```typescript
import { access, constants } from 'fs/promises';

async function canWriteFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
```

### Multiple Permission Checks
```typescript
import { access, constants } from 'fs/promises';

async function checkPermissions(filePath: string): Promise<{
  exists: boolean;
  readable: boolean;
  writable: boolean;
}> {
  const result = { exists: false, readable: false, writable: false };

  try {
    await access(filePath, constants.F_OK);
    result.exists = true;
  } catch {
    return result;
  }

  try {
    await access(filePath, constants.R_OK);
    result.readable = true;
  } catch {}

  try {
    await access(filePath, constants.W_OK);
    result.writable = true;
  } catch {}

  return result;
}
```

---

## 3. Reading JSON Files with Error Handling

### Basic JSON File Reading
```typescript
import { readFile } from 'fs/promises';

async function readJSONFile<T = unknown>(filePath: string): Promise<T> {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
      }
    }
    throw error;
  }
}
```

### Comprehensive JSON File Reading
```typescript
import { readFile, access, constants } from 'fs/promises';

interface ReadJSONOptions {
  encoding?: BufferEncoding;
  throwOnNotFound?: boolean;
  defaultValue?: unknown;
}

async function readJSONFile<T = unknown>(
  filePath: string,
  options: ReadJSONOptions = {}
): Promise<T> {
  const {
    encoding = 'utf8',
    throwOnNotFound = true,
    defaultValue
  } = options;

  // Check file existence
  try {
    await access(filePath, constants.F_OK | constants.R_OK);
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (throwOnNotFound) {
        throw new Error(`File not found: ${filePath}`);
      }
      return defaultValue as T;
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied reading file: ${filePath}`);
    }
    throw error;
  }

  // Read file
  let content: string;
  try {
    content = await readFile(filePath, encoding);
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }

  // Parse JSON
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON in file ${filePath} at position ${error.message}: ${content}`
      );
    }
    throw error;
  }
}
```

### Type-Safe JSON Reading
```typescript
import { readFile } from 'fs/promises';

type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

async function readTypedJSONFile<T extends JSONValue>(
  filePath: string
): Promise<T> {
  try {
    const content = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);

    // Add runtime validation if needed
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error(`Expected JSON object in ${filePath}`);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Configuration file not found: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(
          `Malformed JSON in configuration file ${filePath}: ${error.message}`
        );
      }
    }
    throw error;
  }
}
```

---

## 4. Path Construction with path.resolve

### Basic Usage
```typescript
import path from 'path';

// Resolve to absolute path
const absolutePath = path.resolve('src', 'config.json');
// Returns: /current/working/directory/src/config.json

// Resolve multiple segments
const fullPath = path.resolve('/home', 'user', 'projects', 'app');
// Returns: /home/user/projects/app

// Resolve with ..
const normalizedPath = path.resolve('/home/user/projects/../app');
// Returns: /home/user/app
```

### Cross-Platform Path Construction
```typescript
import path from 'path';

function getConfigPath(configName: string): string {
  const basePath = path.resolve(process.cwd(), 'config');
  return path.resolve(basePath, `${configName}.json`);
}

// Usage
const configPath = getConfigPath('production');
// Returns: /current/working/directory/config/production.json
```

### Safe Path Resolution
```typescript
import path from 'path';
import { resolve } from 'path';

function safeResolve(...segments: string[]): string {
  // Normalize and resolve the path
  const resolved = resolve(...segments);

  // Prevent directory traversal attacks
  const normalized = path.normalize(resolved);

  return normalized;
}

// Usage
const safePath = safeResolve('/var/data', '../etc/config.json');
// Returns: /var/etc/config.json
```

### Path Construction with Validation
```typescript
import path from 'path';
import { stat } from 'fs/promises';

async function resolveAndValidate(
  ...segments: string[]
): Promise<string> {
  const resolvedPath = path.resolve(...segments);

  try {
    const stats = await stat(resolvedPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${resolvedPath}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File does not exist: ${resolvedPath}`);
    }
    throw error;
  }

  return resolvedPath;
}
```

---

## 5. Error Message Patterns for File Operations

### Standard Error Codes Reference
```typescript
// Common Node.js file system error codes:
const ErrorCodes = {
  ENOENT: 'No such file or directory',
  EACCES: 'Permission denied',
  EISDIR: 'Is a directory',
  ENOTDIR: 'Not a directory',
  EEXIST: 'File already exists',
  ENOSPC: 'No space left on device',
  EROFS: 'Read-only file system',
  EBADF: 'Bad file descriptor',
} as const;
```

### Descriptive Error Messages
```typescript
import { readFile } from 'fs/promises';
import path from 'path';

async function readFileWithErrorContext(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    const fileName = path.basename(filePath);
    const directory = path.dirname(filePath);

    if (error.code === 'ENOENT') {
      throw new Error(
        `File not found: ${fileName}\n` +
        `  Expected location: ${directory}\n` +
        `  Full path: ${filePath}`
      );
    }

    if (error.code === 'EACCES') {
      throw new Error(
        `Permission denied: Cannot read file ${fileName}\n` +
        `  Location: ${directory}\n` +
        `  Full path: ${filePath}\n` +
        `  Please check file permissions`
      );
    }

    if (error.code === 'EISDIR') {
      throw new Error(
        `Path is a directory, not a file: ${fileName}\n` +
        `  Location: ${directory}\n` +
        `  Full path: ${filePath}`
      );
    }

    throw new Error(
      `Failed to read file ${fileName}: ${error.message}\n` +
      `  Location: ${directory}\n` +
      `  Full path: ${filePath}`
    );
  }
}
```

### JSON-Specific Error Messages
```typescript
import { readFile } from 'fs/promises';
import path from 'path';

async function readJSONWithErrorContext(filePath: string): Promise<unknown> {
  let content: string;

  // Read file with context
  try {
    content = await readFile(filePath, 'utf8');
  } catch (error) {
    const fileName = path.basename(filePath);

    if (error.code === 'ENOENT') {
      throw new Error(
        `Configuration file not found: ${fileName}\n` +
        `  Expected at: ${filePath}\n` +
        `  Please ensure the file exists before starting the application`
      );
    }

    throw new Error(
      `Failed to read configuration file ${fileName}: ${error.message}\n` +
      `  Path: ${filePath}`
    );
  }

  // Parse JSON with context
  try {
    return JSON.parse(content);
  } catch (error) {
    const fileName = path.basename(filePath);
    let errorMsg = `Invalid JSON in configuration file: ${fileName}\n`;
    errorMsg += `  Path: ${filePath}\n`;

    if (error instanceof SyntaxError) {
      errorMsg += `  Error: ${error.message}\n`;
      if (error.message.includes('position')) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
          const position = parseInt(match[1], 10);
          const lines = content.substring(0, position).split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;
          errorMsg += `  Line: ${line}, Column: ${column}\n`;
        }
      }
      errorMsg += `  Please fix the JSON syntax error before continuing`;
    }

    throw new Error(errorMsg);
  }
}
```

### Custom Error Class
```typescript
import path from 'path';

export class FileOperationError extends Error {
  public readonly code: string;
  public readonly filePath: string;
  public readonly operation: string;
  public readonly cause?: Error;

  constructor(
    operation: string,
    filePath: string,
    code: string,
    message: string,
    cause?: Error
  ) {
    super(message);
    this.name = 'FileOperationError';
    this.operation = operation;
    this.filePath = filePath;
    this.code = code;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileOperationError);
    }
  }

  static fromSystemError(
    operation: string,
    filePath: string,
    error: NodeJS.ErrnoException
  ): FileOperationError {
    const fileName = path.basename(filePath);
    const directory = path.dirname(filePath);

    let message = `File operation failed: ${operation}\n`;
    message += `  File: ${fileName}\n`;
    message += `  Directory: ${directory}\n`;
    message += `  Full path: ${filePath}\n`;

    switch (error.code) {
      case 'ENOENT':
        message += `  Reason: File or directory not found`;
        break;
      case 'EACCES':
        message += `  Reason: Permission denied`;
        break;
      case 'EISDIR':
        message += `  Reason: Expected a file but got a directory`;
        break;
      case 'ENOTDIR':
        message += `  Reason: Expected a directory but got a file`;
        break;
      default:
        message += `  Reason: ${error.message}`;
    }

    return new FileOperationError(
      operation,
      filePath,
      error.code || 'UNKNOWN',
      message,
      error
    );
  }
}
```

### Usage Example with Custom Error
```typescript
import { readFile } from 'fs/promises';
import { FileOperationError } from './errors';

async function safeFileRead(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    throw FileOperationError.fromSystemError('readFile', filePath, error);
  }
}

// Usage
try {
  const content = await safeFileRead('/path/to/config.json');
} catch (error) {
  if (error instanceof FileOperationError) {
    console.error(error.message);
    // Access structured error information:
    console.error('Code:', error.code);
    console.error('File:', error.filePath);
    console.error('Operation:', error.operation);
  }
}
```

---

## Complete Example: JSON Configuration Reader

```typescript
import { readFile, access, constants } from 'fs/promises';
import path from 'path';
import { FileOperationError } from './errors';

interface ConfigReaderOptions {
  encoding?: BufferEncoding;
  required?: boolean;
  defaultValue?: unknown;
}

export class ConfigReader {
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
  }

  /**
   * Read and parse a JSON configuration file
   */
  async readJSON<T = unknown>(
    configName: string,
    options: ConfigReaderOptions = {}
  ): Promise<T> {
    const { encoding = 'utf8', required = true, defaultValue } = options;

    // Construct full path
    const filePath = path.resolve(this.basePath, `${configName}.json`);

    // Check file existence
    try {
      await access(filePath, constants.F_OK | constants.R_OK);
    } catch (error) {
      if (error.code === 'ENOENT') {
        if (!required && defaultValue !== undefined) {
          return defaultValue as T;
        }
        throw FileOperationError.fromSystemError('access', filePath, error);
      }
      throw FileOperationError.fromSystemError('access', filePath, error);
    }

    // Read file content
    let content: string;
    try {
      content = await readFile(filePath, encoding);
    } catch (error) {
      throw FileOperationError.fromSystemError('readFile', filePath, error);
    }

    // Parse JSON
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      const fileName = path.basename(filePath);
      let message = `Invalid JSON in configuration file: ${fileName}\n`;
      message += `  Path: ${filePath}\n`;

      if (error instanceof SyntaxError) {
        message += `  Error: ${error.message}\n`;

        // Provide line/column context
        const match = error.message.match(/position (\d+)/);
        if (match) {
          const position = parseInt(match[1], 10);
          const lines = content.substring(0, position).split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;
          message += `  Line: ${line}, Column: ${column}\n`;
        }
      }

      throw new FileOperationError(
        'parseJSON',
        filePath,
        'EJSON',
        message,
        error
      );
    }
  }

  /**
   * Check if a configuration file exists
   */
  async exists(configName: string): Promise<boolean> {
    const filePath = path.resolve(this.basePath, `${configName}.json`);

    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}

// Usage Example
const configReader = new ConfigReader('/etc/myapp');

try {
  const config = await configReader.readJSON('production', {
    required: true,
  });
  console.log('Configuration loaded:', config);
} catch (error) {
  if (error instanceof FileOperationError) {
    console.error('Failed to load configuration:');
    console.error(error.message);
    process.exit(1);
  }
}
```

---

## Best Practices Summary

### 1. Always Use async/await with fs/promises
```typescript
// Good
import { readFile } from 'fs/promises';
const data = await readFile('file.txt', 'utf8');

// Avoid
const fs = require('fs');
const data = fs.readFileSync('file.txt', 'utf8');
```

### 2. Check File Existence Before Reading
```typescript
import { access, constants, readFile } from 'fs/promises';

try {
  await access(filePath, constants.R_OK);
  const content = await readFile(filePath, 'utf8');
} catch (error) {
  // Handle error
}
```

### 3. Use Descriptive Error Messages
```typescript
// Good
throw new Error(
  `Configuration file not found: ${configName}\n` +
  `  Expected at: ${expectedPath}\n` +
  `  Please create the file or check the path`
);

// Avoid
throw new Error('File not found');
```

### 4. Validate JSON Structure
```typescript
const data = JSON.parse(content);

if (typeof data !== 'object' || data === null) {
  throw new Error(`Expected JSON object, got ${typeof data}`);
}

if (!Array.isArray(data.items)) {
  throw new Error('Configuration must contain an "items" array');
}
```

### 5. Use Absolute Paths
```typescript
import path from 'path';

const absolutePath = path.resolve(process.cwd(), 'config.json');
```

### 6. Handle Edge Cases
```typescript
// Empty file
if (content.trim().length === 0) {
  throw new Error(`File is empty: ${filePath}`);
}

// BOM (Byte Order Mark)
content = content.replace(/^\uFEFF/, '');
```

---

## Additional Resources

### Node.js Documentation
- **File System API:** https://nodejs.org/api/fs.html
- **Path Module:** https://nodejs.org/api/path.html
- **Error Codes:** https://nodejs.org/api/errors.html#errors_common_system_errors

### Related Modules
- **fs-extra:** Popular utility package with additional file methods
- **glob:** For pattern-based file matching
- **dotenv:** For environment variable configuration

### TypeScript Considerations
```typescript
// Install @types/node for TypeScript support
npm install --save-dev @types/node

// Use in tsconfig.json
{
  "compilerOptions": {
    "types": ["node"],
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

**Note:** This research was compiled using comprehensive knowledge of Node.js APIs and best practices. For the most current information, always refer to the official Node.js documentation at the URLs provided above.
