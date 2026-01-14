# npm Link Local Research

Research findings on npm link best practices for linking local packages into other projects, with focus on symlink verification, troubleshooting, and testing strategies.

**Research Date:** 2026-01-14
**Task:** P1M1T1S3 - Research npm link best practices

---

## 1. npm Link Local Workflow

### 1.1 The Complete Two-Step Process

The npm link workflow consists of two distinct phases:

#### Step 1: Create Global Link (in the package being linked)

```bash
# Navigate to the package source directory
cd /path/to/local-package

# Create a global symlink to this package
npm link
```

**What happens:**

- npm creates a symlink in the global `node_modules` directory
- The symlink points to your local package directory
- This makes the package available globally for linking

**Typical global locations:**

- **Linux/macOS:** `/usr/local/lib/node_modules/` or `~/.nvm/versions/node/vXX.X.X/lib/node_modules/`
- **Windows:** `C:\Users\<username>\AppData\Roaming\npm\node_modules\`

#### Step 2: Link Local Package (in the consuming project)

```bash
# Navigate to the consuming project
cd /path/to/consuming-project

# Link the globally linked package into this project
npm link package-name
```

**What happens:**

- npm creates a symlink from the project's `node_modules/package-name` to the global symlink
- Your local package is now available as if it were installed normally
- Changes in your local package are immediately reflected

### 1.2 Complete Workflow Example

```bash
# Terminal 1: Package to be linked
cd ~/projects/my-shared-library
npm link
# Output: /usr/local/lib/node_modules/my-shared-library -> ~/projects/my-shared-library

# Terminal 2: Consuming project
cd ~/projects/my-app
npm link my-shared-library
# Output: ~/projects/my-app/node_modules/my-shared-library -> /usr/local/lib/node_modules/my-shared-library
```

### 1.3 Cleanup Workflow

When done development, always unlink to restore normal dependencies:

```bash
# In the consuming project
npm unlink my-shared-library
npm install my-shared-library  # Restore normal version from registry

# Optionally, remove global link
cd ~/projects/my-shared-library
npm unlink -g my-shared-library
```

---

## 2. Symlink Verification in Node.js TypeScript

### 2.1 Using fs.promises.lstat (Recommended)

The `fs.lstat` method is essential for symlink verification because it returns information about the symlink itself, not the target file.

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Check if a path is a symbolic link
 */
async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    return stats.isSymbolicLink();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false; // Path doesn't exist
    }
    throw error;
  }
}

/**
 * Get symlink target path
 */
async function getSymlinkTarget(symlinkPath: string): Promise<string | null> {
  try {
    return await fs.readlink(symlinkPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Verify npm link global symlink exists
 */
async function verifyGlobalNpmLink(packageName: string): Promise<{
  exists: boolean;
  target?: string;
  error?: string;
}> {
  // Get global node_modules path
  const { execSync } = require('child_process');
  const globalPrefix = execSync('npm config get prefix', {
    encoding: 'utf-8',
  }).trim();
  const globalNodeModules = path.join(
    globalPrefix,
    'lib',
    'node_modules',
    packageName
  );

  try {
    const isLink = await isSymlink(globalNodeModules);
    if (!isLink) {
      return { exists: false, error: 'Path exists but is not a symlink' };
    }

    const target = await getSymlinkTarget(globalNodeModules);
    return { exists: true, target };
  } catch (error) {
    return { exists: false, error: (error as Error).message };
  }
}

/**
 * Verify npm link local symlink exists
 */
async function verifyLocalNpmLink(
  projectPath: string,
  packageName: string
): Promise<{
  exists: boolean;
  target?: string;
  error?: string;
}> {
  const localSymlink = path.join(projectPath, 'node_modules', packageName);

  try {
    const isLink = await isSymlink(localSymlink);
    if (!isLink) {
      return { exists: false, error: 'Path exists but is not a symlink' };
    }

    const target = await getSymlinkTarget(localSymlink);
    return { exists: true, target };
  } catch (error) {
    return { exists: false, error: (error as Error).message };
  }
}

/**
 * Complete npm link verification
 */
async function verifyNpmLinkSetup(
  packageName: string,
  projectPath: string
): Promise<{
  globalLink: boolean;
  localLink: boolean;
  globalTarget?: string;
  localTarget?: string;
}> {
  const global = await verifyGlobalNpmLink(packageName);
  const local = await verifyLocalNpmLink(projectPath, packageName);

  return {
    globalLink: global.exists,
    localLink: local.exists,
    globalTarget: global.target,
    localTarget: local.target,
  };
}
```

### 2.2 Synchronous Verification (fs.lstatSync)

For use cases where async/await is not available:

```typescript
import * as fs from 'fs';
import * as path from 'path';

/**
 * Synchronously check if a path is a symbolic link
 */
function isSymlinkSync(filePath: string): boolean {
  try {
    const stats = fs.lstatSync(filePath);
    return stats.isSymbolicLink();
  } catch (error) {
    return false;
  }
}

/**
 * Synchronously verify npm link
 */
function verifyNpmLinkSync(
  projectPath: string,
  packageName: string
): { exists: boolean; target?: string } {
  const symlinkPath = path.join(projectPath, 'node_modules', packageName);

  if (!isSymlinkSync(symlinkPath)) {
    return { exists: false };
  }

  const target = fs.readlinkSync(symlinkPath);
  return { exists: true, target };
}
```

### 2.3 Recursive Symlink Resolution

For cases where you need to resolve the final target (useful for npm link chains):

```typescript
/**
 * Recursively resolve symlink to final target
 */
async function resolveSymlink(symlinkPath: string): Promise<string> {
  let currentPath = symlinkPath;
  const maxDepth = 100; // Prevent infinite loops
  let depth = 0;

  while (depth < maxDepth) {
    try {
      const stats = await fs.lstat(currentPath);

      if (!stats.isSymbolicLink()) {
        // Found the actual file/directory
        return path.resolve(currentPath);
      }

      // Read the symlink target
      const target = await fs.readlink(currentPath);

      // Resolve relative paths against the symlink's directory
      currentPath = path.resolve(path.dirname(currentPath), target);
      depth++;
    } catch (error) {
      throw new Error(`Failed to resolve symlink: ${(error as Error).message}`);
    }
  }

  throw new Error('Maximum symlink depth reached, possible circular symlink');
}
```

---

## 3. Common Issues and Solutions

### 3.1 Permission Issues

#### Linux/macOS

**Problem:** EACCES permission errors when running `npm link`

```bash
npm ERR! Error: EACCES, symlink '../lib/node_modules/package-name'
```

**Solutions:**

1. **Fix npm directory permissions (recommended for system npm):**

```bash
sudo mkdir -p /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin
```

2. **Use Node Version Manager (nvm) - Best Practice:**

```bash
# Install nvm to avoid sudo requirements entirely
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc

# Reinstall npm packages without sudo
nvm install node
```

3. **Change npm's default directory:**

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### Windows

**Problem:** Access denied errors, UAC prompts

**Solutions:**

1. **Run as Administrator:**
   - Right-click Command Prompt or PowerShell
   - Select "Run as administrator"

2. **Configure npm permissions in PowerShell (as Administrator):**

```powershell
# Set execution policy
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Grant full control to npm directory
$npmPath = "$env:APPDATA\npm"
icacls $npmPath /grant $env:USERNAME:(OI)(CI)F
```

3. **Verify folder permissions:**

```powershell
# Check current permissions
icacls "$env:APPDATA\npm"
```

### 3.2 Path Issues

#### Issue: "Cannot find module" after linking

**Cause:** The symlink exists but Node.js module resolution fails

**Solutions:**

1. **Verify package name matches:**

```bash
# Check the name in package.json
cat package.json | grep '"name"'

# Link using the exact name from package.json
npm link actual-package-name
```

2. **Check for main entry point:**

```json
// package.json must have correct main field
{
  "name": "my-package",
  "main": "dist/index.js", // or "index.js"
  "types": "dist/index.d.ts"
}
```

3. **Clear npm and Node.js cache:**

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 3.3 TypeScript Type Issues

**Problem:** Type definitions not resolving after npm link

**Solutions:**

1. **Build the package before linking:**

```bash
cd /path/to/package
npm run build
npm link
```

2. **Verify tsconfig.json includes the package:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "linked-package": ["node_modules/linked-package"]
    }
  }
}
```

3. **Restart TypeScript Language Server:**
   - VS Code: Command Palette → "TypeScript: Restart TS Server"

### 3.4 Platform-Specific Issues

#### Windows Junction Points vs Symbolic Links

Windows has two types of links:

- **Symbolic links:** Require developer mode or admin privileges
- **Junction points:** Work without special permissions (directory-only)

npm on Windows will use junction points automatically when possible.

**Enable Developer Mode (Windows 10/11):**

```
Settings → Update & Security → For developers → Developer mode
```

#### macOS Case Sensitivity

**Problem:** Package name case mismatch causes issues on case-sensitive filesystems

```bash
# package.json has: "name": "myPackage"
# But you link with: npm link mypackage  (wrong case)
```

**Solution:** Always use the exact case from package.json

### 3.5 npm Link Chain Issues

**Problem:** Multiple linked packages causing resolution issues

**Solution:** Verify the link chain:

```bash
# Check what the symlink points to
ls -la node_modules/package-name
# Output: package-name -> /usr/local/lib/node_modules/package-name

# Check the global link
ls -la /usr/local/lib/node_modules/package-name
# Output: /usr/local/lib/node_modules/package-name -> /path/to/original
```

### 3.6 Circular Dependencies

**Problem:** Package A links to Package B, but Package B depends on Package A

**Symptoms:**

- Module not found errors
- Version conflicts
- Infinite loops in module resolution

**Solutions:**

1. **Use peer dependencies instead of regular dependencies:**

```json
// In package B
{
  "peerDependencies": {
    "package-a": "*"
  }
}
```

2. **Build packages first:**

```bash
cd package-a && npm run build && npm link
cd package-b && npm run build && npm link
cd app && npm link package-a && npm link package-b
```

---

## 4. Testing Strategies for npm Link Commands

### 4.1 Mocking child_process.spawn in Jest

```typescript
// npm-link.test.ts
import { spawn } from 'child_process';
import { npmLinkGlobal, npmLinkLocal } from './npm-link';

// Mock child_process
jest.mock('child_process');

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('npm link commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('npmLinkGlobal', () => {
    it('should spawn npm link command', async () => {
      // Setup mock
      const mockChildProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('global link created');
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0); // Exit code 0 = success
          }
        }),
      };

      mockSpawn.mockReturnValue(mockChildProcess as any);

      // Execute
      await npmLinkGlobal('/path/to/package');

      // Verify
      expect(mockSpawn).toHaveBeenCalledWith(
        'npm',
        ['link'],
        expect.objectContaining({
          cwd: '/path/to/package',
          stdio: 'pipe',
        })
      );
    });

    it('should handle npm link errors', async () => {
      const mockChildProcess = {
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('EACCES: permission denied');
            }
          }),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Exit code 1 = error
          }
        }),
      };

      mockSpawn.mockReturnValue(mockChildProcess as any);

      await expect(npmLinkGlobal('/path/to/package')).rejects.toThrow(
        'npm link failed with exit code 1'
      );
    });
  });
});
```

### 4.2 Mocking with Vitest

```typescript
// npm-link.test.ts (Vitest)
import { vi } from 'vitest';
import { spawn } from 'child_process';
import { npmLinkLocal } from './npm-link';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('npm link local (Vitest)', () => {
  const mockSpawn = vi.mocked(spawn);

  it('should link package to local project', async () => {
    const mockStdout = {
      on: vi.fn(),
    };
    const mockStderr = {
      on: vi.fn(),
    };
    const mockProcess = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          callback(0);
        }
      }),
    };

    mockSpawn.mockReturnValue(mockProcess as any);

    await npmLinkLocal('/path/to/project', 'my-package');

    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['link', 'my-package'],
      expect.objectContaining({
        cwd: '/path/to/project',
      })
    );
  });
});
```

### 4.3 Mock Helper Factory

Create a reusable mock factory for cleaner tests:

```typescript
// test-utils/mocks/spawn.mock.ts
import { ChildProcess } from 'child_process';

export interface MockChildProcessOptions {
  stdout?: string[];
  stderr?: string[];
  exitCode?: number;
  error?: Error;
}

export function createMockChildProcess(
  options: MockChildProcessOptions = {}
): Partial<ChildProcess> {
  const { stdout = [], stderr = [], exitCode = 0, error } = options;

  return {
    stdout: {
      on: jest.fn((event: string, callback: (data: string) => void) => {
        if (event === 'data') {
          stdout.forEach(callback);
        }
      }),
    } as any,
    stderr: {
      on: jest.fn((event: string, callback: (data: string) => void) => {
        if (event === 'data') {
          stderr.forEach(callback);
        }
      }),
    } as any,
    on: jest.fn((event: string, callback: (code: number | Error) => void) => {
      if (event === 'close') {
        setTimeout(() => callback(error || exitCode), 0);
      }
    }),
  };
}

// Usage in tests
import { createMockChildProcess } from './test-utils/mocks/spawn.mock';

describe('npm link with factory', () => {
  it('handles successful link', async () => {
    mockSpawn.mockReturnValue(
      createMockChildProcess({
        stdout: ['linked successfully'],
        exitCode: 0,
      }) as any
    );

    await npmLinkGlobal('/path/to/package');
  });
});
```

### 4.4 Integration Testing with Real File System

For end-to-end tests, create temporary directories:

```typescript
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

describe('npm link integration tests', () => {
  let tempDir: string;
  let packageDir: string;
  let projectDir: string;

  beforeEach(async () => {
    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'npm-link-test-'));
    packageDir = path.join(tempDir, 'package');
    projectDir = path.join(tempDir, 'project');

    // Create package structure
    await fs.mkdir(packageDir, { recursive: true });
    await fs.mkdir(projectDir, { recursive: true });

    // Create minimal package.json
    await fs.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
        main: 'index.js',
      })
    );

    await fs.writeFile(
      path.join(packageDir, 'index.js'),
      'module.exports = { hello: () => "world" };'
    );

    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {},
      })
    );
  });

  afterEach(async () => {
    // Cleanup
    try {
      execSync(`npm unlink -g test-package`, {
        cwd: packageDir,
        stdio: 'ignore',
      });
    } catch {
      // Ignore errors during cleanup
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should create working npm link', async () => {
    // Create global link
    execSync('npm link', { cwd: packageDir });

    // Verify global link exists
    const globalLinkExists = await isSymlink(
      path.join(
        execSync('npm config get prefix', { encoding: 'utf-8' }).trim(),
        'lib/node_modules/test-package'
      )
    );
    expect(globalLinkExists).toBe(true);

    // Create local link
    execSync('npm link test-package', { cwd: projectDir });

    // Verify local link exists
    const localLinkExists = await isSymlink(
      path.join(projectDir, 'node_modules/test-package')
    );
    expect(localLinkExists).toBe(true);
  });
});
```

### 4.5 Testing Symlink Verification Functions

```typescript
import * as fs from 'fs/promises';
import { isSymlink, getSymlinkTarget } from './symlink-utils';

describe('symlink verification', () => {
  let tempDir: string;
  let realFile: string;
  let symlink: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp('/tmp/symlink-test-');
    realFile = path.join(tempDir, 'real-file.txt');
    symlink = path.join(tempDir, 'symlink');

    await fs.writeFile(realFile, 'content');
    await fs.symlink(realFile, symlink);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('isSymlink', () => {
    it('should return true for symlinks', async () => {
      const result = await isSymlink(symlink);
      expect(result).toBe(true);
    });

    it('should return false for regular files', async () => {
      const result = await isSymlink(realFile);
      expect(result).toBe(false);
    });

    it('should return false for non-existent paths', async () => {
      const result = await isSymlink('/nonexistent/path');
      expect(result).toBe(false);
    });
  });

  describe('getSymlinkTarget', () => {
    it('should return the symlink target', async () => {
      const target = await getSymlinkTarget(symlink);
      expect(target).toBe(realFile);
    });

    it('should return null for non-existent paths', async () => {
      const target = await getSymlinkTarget('/nonexistent/path');
      expect(target).toBeNull();
    });
  });
});
```

---

## 5. Best Practices Summary

### 5.1 Development Workflow

1. **Always build before linking:**

   ```bash
   npm run build && npm link
   ```

2. **Use absolute paths for verification:**

   ```typescript
   const absolutePath = path.resolve(process.cwd(), 'node_modules', 'package');
   ```

3. **Clean up links before committing:**
   ```bash
   npm unlink package-name
   npm install package-name
   ```

### 5.2 Project Structure

```json
// package.json
{
  "scripts": {
    "link": "npm run build && npm link",
    "unlink": "npm unlink -g $npm_package_name"
  }
}
```

### 5.3 Monorepo Alternatives (2025)

For better local development, consider using:

1. **npm workspaces** (npm 7+):

   ```json
   {
     "workspaces": ["packages/*"]
   }
   ```

2. **pnpm** (most efficient for large monorepos):

   ```bash
   pnpm install
   pnpm --filter @my/app link --global
   ```

3. **Yarn Workspaces** or **Yarn 3+** with zero-installs

4. **Turborepo** or **Nx** for advanced build orchestration

---

## 6. Official Documentation and Resources

### npm Documentation

- **npm link official docs:** https://docs.npmjs.com/cli/v10/commands/npm-link
- **npm folders:** https://docs.npmjs.com/cli/v10/configuring-npm/folders
- **npm developers guide:** https://docs.npmjs.com/cli/v10/using-npm/developers

### Node.js Documentation

- **fs.lstat:** https://nodejs.org/api/fs.html#fslstatpath-options-callback
- **fs.promises.lstat:** https://nodejs.org/api/fs.html#fspromiseslstatpath-options
- **fs.Stats.isSymbolicLink:** https://nodejs.org/api/fs.html#statsissymboliclink
- **fs.readlink:** https://nodejs.org/api/fs.html#fsreadlinkpath-options-callback

### Testing Documentation

- **Jest mocking:** https://jestjs.io/docs/mock-functions
- **Vitest mocking:** https://vitest.dev/guide/mocking.html
- **Testing library docs:** https://testing-library.com/docs/

### Community Resources

- **npm link troubleshooting:** https://github.com/npm/npm/issues
- **Node.js symlink best practices:** https://nodejs.org/en/docs/guides/
- **TypeScript module resolution:** https://www.typescriptlang.org/docs/handbook/module-resolution.html

---

## 7. Quick Reference

### Common npm link commands

```bash
# Create global link
npm link

# Link to local project
npm link <package-name>

# Unlink from local project
npm unlink <package-name>

# Remove global link
npm unlink -g <package-name>

# List globally linked packages
npm ls -g --depth=0

# Verify global prefix
npm config get prefix
```

### TypeScript verification

```typescript
// Import types
import * as fs from 'fs/promises';
import { Stats } from 'fs';

// Check if path is symlink
const isLink = (await fs.lstat(path)).isSymbolicLink();

// Get symlink target
const target = await fs.readlink(path);

// Resolve real path
const realPath = await fs.realpath(path);
```

---

_Research compiled for task P1M1T1S3 - npm link local package development best practices_
