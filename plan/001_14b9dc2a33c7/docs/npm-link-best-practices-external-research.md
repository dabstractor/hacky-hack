# npm Link Best Practices - External Research Compilation

**Research Date:** 2026-01-15
**Focus:** External documentation and community best practices for npm link, local package development, symlink verification, TypeScript considerations, and monorepo patterns
**Compiled from:** Official npm docs, Node.js docs, TypeScript docs, and community resources

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Official npm Documentation](#official-npm-documentation)
3. [Local Package Development Best Practices](#local-package-development-best-practices)
4. [Common npm Link Pitfalls](#common-npm-link-pitfalls)
5. [Symlink Verification Commands](#symlink-verification-commands)
6. [TypeScript-Specific Considerations](#typescript-specific-considerations)
7. [Monorepo vs npm Link Patterns](#monorepo-vs-npm-link-patterns)
8. [Cross-Platform Considerations](#cross-platform-considerations)
9. [Testing and Debugging](#testing-and-debugging)
10. [Alternative Approaches](#alternative-approaches)
11. [Quick Reference](#quick-reference)

---

## Executive Summary

This document compiles external research on npm link best practices from official documentation and community resources. Key findings:

- **npm link workflow**: Two-step process (global link, then local link)
- **Verification**: Combine npm commands with filesystem checks using `fs.lstat()`
- **TypeScript**: Requires special handling for declaration files and compiler options
- **Alternatives**: npm workspaces, pnpm, and Yarn workspaces provide better developer experience
- **Pitfalls**: Permission issues, path resolution, and TypeScript compilation are common pain points

---

## Official npm Documentation

### 1. npm link Command Reference

**URL:** https://docs.npmjs.com/cli/v10/commands/npm-link

**Why Relevant:** Official documentation for npm link command with syntax, options, and examples

**Key Insights:**

```bash
# Basic syntax
npm link (in package folder)
npm link [<package-spec>] (in project folder)

# With flags
npm link --global
npm link --prefix <path>
```

**Best Practices from Official Docs:**

1. **Always build before linking:**

   ```bash
   npm run build && npm link
   ```

2. **Use exact package name from package.json:**

   ```bash
   # Check package.json for exact name
   cat package.json | grep '"name"'
   # Link using exact name
   npm link exact-package-name
   ```

3. **Unlink when done:**
   ```bash
   npm unlink <package-spec>
   npm install <package-spec>  # Restore normal version
   ```

**Implementation Patterns:**

```typescript
// Execute npm link from package directory
import { spawn } from 'child_process';

function linkPackage(packagePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['link'], {
      cwd: packagePath,
      stdio: 'inherit',
    });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`npm link failed with exit code ${code}`));
    });
  });
}
```

---

### 2. npm Folders Structure

**URL:** https://docs.npmjs.com/cli/v10/configuring-npm/folders

**Why Relevant:** Explains where npm creates global symlinks and how to locate them

**Key Insights:**

**Global Node Modules Locations:**

| Platform    | Default Location                                        |
| ----------- | ------------------------------------------------------- |
| **Linux**   | `/usr/local/lib/node_modules` (system npm)              |
|             | `~/.nvm/versions/node/vXX.X.X/lib/node_modules` (nvm)   |
| **macOS**   | `/usr/local/lib/node_modules`                           |
|             | `/opt/homebrew/lib/node_modules` (Homebrew)             |
| **Windows** | `C:\Users\<username>\AppData\Roaming\npm\node_modules\` |

**Getting Global Prefix:**

```bash
# Check global prefix
npm config get prefix

# Get global node_modules path
node -e "console.log(path.resolve(process.execPath, '..', '..', 'lib', 'node_modules'))"
```

**Implementation Pattern:**

```typescript
import { execSync } from 'child_process';
import path from 'path';

function getGlobalNodeModulesPath(): string {
  const prefix = execSync('npm config get prefix', {
    encoding: 'utf-8',
  }).trim();
  return path.join(prefix, 'lib', 'node_modules');
}
```

---

### 3. npm Developers Guide

**URL:** https://docs.npmjs.com/cli/v10/using-npm/developers

**Why Relevant:** Best practices for package development and local testing

**Key Insights:**

**Package.json Requirements:**

```json
{
  "name": "my-package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"]
}
```

**Best Practices:**

1. **Include `files` field** to control what gets published
2. **Use `prepublishOnly` script** to build before publishing:
   ```json
   {
     "scripts": {
       "prepublishOnly": "npm run build"
     }
   }
   ```
3. **Verify package before linking:**
   ```bash
   npm pack --dry-run
   ```

---

## Local Package Development Best Practices

### Development Workflow

**Recommended Workflow:**

```bash
# Terminal 1: Package development
cd ~/projects/my-package
npm run build
npm link

# Terminal 2: Consuming project
cd ~/projects/my-app
npm link my-package
npm run dev  # Hot reload should pick up changes
```

**Best Practices:**

1. **Use watch mode in package:**

   ```json
   {
     "scripts": {
       "dev": "npm run build -- --watch"
     }
   }
   ```

2. **Incremental compilation for TypeScript:**

   ```json
   {
     "compilerOptions": {
       "incremental": true,
       "tsBuildInfoFile": ".tsbuildinfo"
     }
   }
   ```

3. **Clean up before committing:**
   ```bash
   # In project
   npm unlink my-package
   npm install my-package
   git add package.json package-lock.json
   ```

---

### Package Structure for Linking

**Recommended Structure:**

```
my-package/
├── src/
│   └── index.ts
├── dist/
│   ├── index.js
│   └── index.d.ts
├── package.json
├── tsconfig.json
└── README.md
```

**package.json Configuration:**

```json
{
  "name": "my-package",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build",
    "prelink": "npm run build"
  }
}
```

---

### File System Best Practices

**Symlink Verification:**

```typescript
import { lstat, readlink } from 'fs/promises';
import path from 'path';

async function verifySymlink(
  packagePath: string,
  packageName: string
): Promise<{
  exists: boolean;
  isSymlink: boolean;
  target?: string;
}> {
  const symlinkPath = path.join(packagePath, 'node_modules', packageName);

  try {
    const stats = await lstat(symlinkPath);

    if (!stats.isSymbolicLink()) {
      return { exists: true, isSymlink: false };
    }

    const target = await readlink(symlinkPath);
    return { exists: true, isSymlink: true, target };
  } catch (error) {
    return { exists: false, isSymlink: false };
  }
}
```

**Critical: Use `lstat()` not `stat()`**

- `fs.stat()` follows symlinks → always returns `isSymbolicLink() === false`
- `fs.lstat()` doesn't follow symlinks → correctly detects symlinks

---

## Common npm Link Pitfalls

### Pitfall 1: Permission Issues

**Symptoms:**

```
npm ERR! Error: EACCES, symlink '../lib/node_modules/package-name'
```

**Solutions:**

1. **Use nvm instead of system npm (Recommended):**

   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
   source ~/.bashrc

   # Install Node.js with nvm
   nvm install node
   nvm use node
   ```

2. **Fix npm directory permissions (Linux/macOS):**

   ```bash
   sudo mkdir -p /usr/local/lib/node_modules
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   sudo chown -R $(whoami) /usr/local/bin
   ```

3. **Change npm prefix (Alternative):**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

**Windows Solutions:**

1. **Run as Administrator:**
   - Right-click Command Prompt/PowerShell
   - Select "Run as administrator"

2. **Enable Developer Mode (Windows 10/11):**

   ```
   Settings → Update & Security → For developers → Developer mode
   ```

3. **Configure permissions (PowerShell as Administrator):**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
   $npmPath = "$env:APPDATA\npm"
   icacls $npmPath /grant $env:USERNAME:(OI)(CI)F
   ```

---

### Pitfall 2: "Cannot Find Module" After Linking

**Causes:**

1. Package name mismatch
2. Missing entry point file
3. Not built before linking
4. TypeScript path resolution issues

**Solutions:**

1. **Verify package name:**

   ```bash
   # Check exact name in package.json
   cat package.json | grep '"name"'
   # Link using exact name (case-sensitive!)
   npm link ExactPackageName
   ```

2. **Verify entry point exists:**

   ```bash
   # Check for main file
   ls -la dist/index.js
   # Or index.js in root
   ls -la index.js
   ```

3. **Build before linking:**

   ```bash
   npm run build
   npm link
   ```

4. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "linked-package": ["node_modules/linked-package"]
       },
       "preserveSymlinks": true
     }
   }
   ```

---

### Pitfall 3: TypeScript Type Definitions Not Resolving

**Symptoms:**

```
TS2307: Cannot find module 'linked-package' or its corresponding type declarations
```

**Solutions:**

1. **Generate declaration files:**

   ```json
   {
     "compilerOptions": {
       "declaration": true,
       "declarationMap": true,
       "outDir": "./dist"
     }
   }
   ```

2. **Include types in package.json:**

   ```json
   {
     "types": "./dist/index.d.ts",
     "main": "./dist/index.js"
   }
   ```

3. **Verify .d.ts files are built:**

   ```bash
   ls -la dist/*.d.ts
   ```

4. **Restart TypeScript Language Server:**
   - VS Code: Command Palette → "TypeScript: Restart TS Server"

5. **Add preserveSymlinks:**
   ```json
   {
     "compilerOptions": {
       "preserveSymlinks": true
     }
   }
   ```

---

### Pitfall 4: Circular Dependencies

**Symptoms:**

- Package A depends on Package B
- Package B linked to Package A
- Module resolution fails or infinite loops

**Solutions:**

1. **Use peer dependencies:**

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

3. **Use npm workspaces instead (see below)**

---

### Pitfall 5: Stale Cached Modules

**Symptoms:**

- Changes not reflected after linking
- Old version still being used

**Solutions:**

1. **Clear npm cache:**

   ```bash
   npm cache clean --force
   ```

2. **Remove node_modules and reinstall:**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm link package-name
   ```

3. **Verify symlink target:**
   ```bash
   ls -la node_modules/package-name
   # Should show: package-name -> /path/to/package
   ```

---

### Pitfall 6: Path Issues on Windows

**Symptoms:**

- Path too long errors
- Backslash vs forward slash issues

**Solutions:**

1. **Enable long path support (Windows 10+):**

   ```powershell
   # Run as Administrator
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

2. **Use path normalization:**

   ```typescript
   import path from 'path';

   function normalizePath(p: string): string {
     return path.normalize(p).split('\\').join('/');
   }
   ```

---

## Symlink Verification Commands

### Command-Line Verification

**1. Check global link:**

```bash
# List global packages
npm ls -g --depth=0

# Check specific package
npm ls -g <package-name>

# Verify symlink
ls -la $(npm config get prefix)/lib/node_modules/<package-name>
```

**2. Check local link:**

```bash
# Check in project
npm ls <package-name>

# Verify symlink in node_modules
ls -la node_modules/<package-name>

# Read symlink target
readlink node_modules/<package-name>
```

**3. Check npm resolution:**

```bash
# JSON output for parsing
npm ls <package-name> --json

# Check if linked
npm ls --link
npm ls --link --json
```

**4. Verify with readlink:**

```bash
# Get symlink target
readlink node_modules/<package-name>

# Resolve to absolute path
readlink -f node_modules/<package-name>

# Check if symlink is broken
test -e node_modules/<package-name> && echo "OK" || echo "BROKEN"
```

---

### Node.js Verification Functions

**Complete Symlink Verifier:**

```typescript
import { lstat, readlink } from 'fs/promises';
import { resolve, dirname } from 'path';

export interface SymlinkInfo {
  exists: boolean;
  isSymlink: boolean;
  target?: string;
  resolvedTarget?: string;
  targetExists: boolean;
  broken: boolean;
  error?: string;
}

export async function verifySymlink(symlinkPath: string): Promise<SymlinkInfo> {
  try {
    const stats = await lstat(symlinkPath);

    if (!stats.isSymbolicLink()) {
      return {
        exists: true,
        isSymlink: false,
        targetExists: false,
        broken: false,
      };
    }

    const target = await readlink(symlinkPath);
    const resolvedTarget = resolve(dirname(symlinkPath), target);

    // Check if target exists
    let targetExists = false;
    try {
      await lstat(resolvedTarget);
      targetExists = true;
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      if (errno.code !== 'ENOENT') throw error;
    }

    return {
      exists: true,
      isSymlink: true,
      target,
      resolvedTarget,
      targetExists,
      broken: !targetExists,
    };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    return {
      exists: false,
      isSymlink: false,
      targetExists: false,
      broken: false,
      error: `[${errno.code}] ${errno.message}`,
    };
  }
}
```

---

**npm Link Chain Verifier:**

```typescript
import { execSync } from 'child_process';
import path from 'path';

export interface NpmLinkChain {
  packagePath: string;
  globalLinkPath: string;
  localLinkPath: string;
  globalLinkExists: boolean;
  localLinkExists: boolean;
  globalLinkTarget?: string;
  localLinkTarget?: string;
}

export async function verifyNpmLinkChain(
  packageName: string,
  projectPath: string
): Promise<NpmLinkChain> {
  const globalPrefix = execSync('npm config get prefix', {
    encoding: 'utf-8',
  }).trim();
  const globalNodeModules = path.join(globalPrefix, 'lib', 'node_modules');
  const globalLinkPath = path.join(globalNodeModules, packageName);
  const localLinkPath = path.join(projectPath, 'node_modules', packageName);

  const globalInfo = await verifySymlink(globalLinkPath);
  const localInfo = await verifySymlink(localLinkPath);

  return {
    packagePath: globalInfo.resolvedTarget || '',
    globalLinkPath,
    localLinkPath,
    globalLinkExists: globalInfo.isSymlink,
    localLinkExists: localInfo.isSymlink,
    globalLinkTarget: globalInfo.target,
    localLinkTarget: localInfo.target,
  };
}
```

---

## TypeScript-Specific Considerations

### Compiler Options for Linked Packages

**tsconfig.json for Consuming Project:**

```json
{
  "compilerOptions": {
    // CRITICAL: Preserve symlink structure
    "preserveSymlinks": true,

    // Module resolution
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "linked-package": ["node_modules/linked-package"]
    },

    // Type declarations
    "declaration": true,
    "declarationMap": true,

    // Ensure type checking includes node_modules
    "types": ["node"]
  }
}
```

**Why `preserveSymlinks: true`?**

- Without it, TypeScript resolves symlinks to their targets
- This can cause issues with linked packages that reference local files
- Preserves the symlink structure for proper module resolution

---

### Declaration File Generation

**tsconfig.json for Linked Package:**

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",

    // Ensure all types are exported
    "declarationDir": "./dist",

    // Include type information in JS files (JSDoc)
    "allowJs": true,

    // Strict type checking
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**package.json Entry Points:**

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

---

### TypeScript Module Resolution

**Node.js Module Resolution with symlinks:**

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "preserveSymlinks": true,
    "esModuleInterop": true
  }
}
```

**Verification Script:**

```typescript
import { resolve } from 'path';
import { existsSync } from 'fs';

function verifyTypeScriptResolution(
  packageName: string,
  projectPath: string
): boolean {
  const typePath = resolve(
    projectPath,
    'node_modules',
    packageName,
    'index.d.ts'
  );

  return existsSync(typePath);
}
```

---

### Common TypeScript Issues and Solutions

**Issue 1: "Cannot find module" error**

```typescript
// Solution: Add paths mapping
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "linked-package": ["./node_modules/linked-package"]
    }
  }
}
```

**Issue 2: Type definitions not found**

```bash
# Rebuild linked package with declarations
cd linked-package
npm run build

# Verify .d.ts files exist
ls -la dist/*.d.ts

# Restart TypeScript server
# VS Code: Command Palette → "TypeScript: Restart TS Server"
```

**Issue 3: Duplicate type declarations**

```json
// Exclude linked package from type checking
{
  "exclude": ["node_modules/linked-package/node_modules"]
}
```

---

## Monorepo vs npm Link Patterns

### Comparison Table

| Feature                 | npm link        | npm workspaces         | pnpm workspaces    | Yarn workspaces  |
| ----------------------- | --------------- | ---------------------- | ------------------ | ---------------- |
| **Setup complexity**    | Low (manual)    | Low (config)           | Low (config)       | Low (config)     |
| **Link management**     | Manual (unlink) | Automatic              | Automatic          | Automatic        |
| **Symlinks**            | Global + local  | Local only             | Local (hard links) | Local only       |
| **Disk usage**          | Duplication     | Duplication            | **Efficient**      | Duplication      |
| **Type safety**         | Manual setup    | Built-in               | Built-in           | Built-in         |
| **Build orchestration** | Manual          | Requires tools         | Built-in           | Requires tools   |
| **Best for**            | Ad-hoc testing  | Small-medium monorepos | Large monorepos    | Medium monorepos |

---

### npm workspaces (npm 7+)

**Setup:**

```json
// Root package.json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspaces --if-present"
  }
}
```

**Directory Structure:**

```
my-monorepo/
├── package.json
├── packages/
│   ├── package-a/
│   │   ├── package.json
│   │   └── src/
│   └── package-b/
│       ├── package.json
│       └── src/
└── node_modules/ (symlinks to packages created automatically)
```

**Advantages over npm link:**

1. Automatic symlink management
2. Single `npm install` for all packages
3. Shared dependency hoisting
4. Built-in workspace commands (`--workspaces` flag)

**Migration from npm link:**

```bash
# Before: npm link
cd packages/package-a
npm link
cd apps/my-app
npm link package-a

# After: workspaces
npm install  # Automatically creates symlinks
```

---

### pnpm workspaces

**Setup:**

```json
// pnpm-workspace.yaml
packages:
  - 'packages/*'
```

**Advantages:**

1. **Efficient disk usage:** Uses hard links instead of duplicating files
2. **Strict dependency management:** Prevents phantom dependencies
3. **Fast:** Much faster than npm/yarn for large projects
4. **Workspace commands:**
   ```bash
   pnpm --filter package-a dev
   pnpm -r build  # Recursive build
   ```

**Comparison to npm link:**

| Feature    | npm link                      | pnpm workspaces                  |
| ---------- | ----------------------------- | -------------------------------- |
| Setup      | Manual per package            | One-time config                  |
| Updates    | Rebuild + relink              | Instant (hard links)             |
| Disk usage | Duplicates in node_modules    | Shared content-addressable store |
| Speed      | Slow (full install each time) | Fast (hard links)                |

---

### Turborepo and Nx

**For advanced build orchestration:**

**Turborepo:**

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

**Nx:**

```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  }
}
```

**When to use:**

- More than 5-10 packages
- Complex build dependencies
- Need for build caching
- CI/CD optimization

---

## Cross-Platform Considerations

### Platform Differences

| Aspect           | Linux/macOS               | Windows                                  |
| ---------------- | ------------------------- | ---------------------------------------- |
| Symlink type     | Native symlinks           | Symlinks (dev mode) or Junctions         |
| Permissions      | Standard file permissions | Administrator or Developer Mode required |
| Path separator   | `/`                       | `\` or `/`                               |
| Drive letters    | None                      | `C:`, `D:`, etc.                         |
| Case sensitivity | Yes (Linux), No (macOS)   | No (case-insensitive, case-preserving)   |
| Max path length  | Very long                 | 260 chars (unless long paths enabled)    |

---

### Cross-Platform Symlink Detection

```typescript
import { lstat } from 'fs/promises';
import { platform } from 'os';

export interface PlatformSymlinkInfo {
  exists: boolean;
  isSymlink: boolean;
  isJunction: boolean; // Windows only
  platform: string;
}

export async function detectSymlinkCrossPlatform(
  filePath: string
): Promise<PlatformSymlinkInfo> {
  const currentPlatform = platform();

  try {
    const stats = await lstat(filePath);
    const isSymlink = stats.isSymbolicLink();

    // Windows junction points are reported as symlinks by Node.js
    const isJunction = currentPlatform === 'win32' && isSymlink;

    return {
      exists: true,
      isSymlink,
      isJunction,
      platform: currentPlatform,
    };
  } catch (error) {
    return {
      exists: false,
      isSymlink: false,
      isJunction: false,
      platform: currentPlatform,
    };
  }
}
```

---

### Path Normalization

```typescript
import { normalize, sep, isAbsolute } from 'path';

export function normalizePathCrossPlatform(filePath: string): string {
  // Normalize to current platform's separator
  return normalize(filePath).split(/[\\/]/).join(sep);
}

export function resolveSymlinkTargetCrossPlatform(
  symlinkPath: string,
  target: string
): string {
  // Convert all separators to current platform
  const normalizedTarget = target.split(/[\\/]/).join(sep);

  // Resolve to absolute path
  if (isAbsolute(normalizedTarget)) {
    return normalize(normalizedTarget);
  }

  return normalize(dirname(symlinkPath), normalizedTarget);
}
```

---

## Testing and Debugging

### Testing Strategies

**1. Mock child_process.spawn:**

```typescript
// npm-link.test.ts
import { spawn } from 'child_process';
import { linkPackage } from './npm-link';

jest.mock('child_process');

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('npm link', () => {
  it('should create global link', async () => {
    mockSpawn.mockReturnValue({
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') callback(0);
      }),
    } as any);

    await linkPackage('/path/to/package');

    expect(mockSpawn).toHaveBeenCalledWith('npm', ['link'], {
      cwd: '/path/to/package',
      stdio: 'pipe',
    });
  });
});
```

**2. Integration testing with temp directories:**

```typescript
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

describe('npm link integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp('/tmp/npm-link-test-');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should create working symlink', async () => {
    const pkgDir = join(tempDir, 'package');
    await writeFile(
      join(pkgDir, 'package.json'),
      JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
      })
    );

    execSync('npm link', { cwd: pkgDir });

    const globalNodeModules = execSync('npm config get prefix', {
      encoding: 'utf-8',
    }).trim();
    const linkPath = join(
      globalNodeModules,
      'lib',
      'node_modules',
      'test-package'
    );

    const stats = await lstat(linkPath);
    expect(stats.isSymbolicLink()).toBe(true);
  });
});
```

---

### Debugging Commands

**Enable npm debug logging:**

```bash
# Set log level
npm config set loglevel verbose

# Run with debug output
npm link --verbose

# Reset to default
npm config set loglevel notice
```

**Check environment variables:**

```bash
# Check npm prefix
npm config get prefix
npm config get userconfig

# Check Node.js version
node -v
npm -v

# Check global modules location
npm root -g
```

**Verify symlink chain:**

```bash
# Check local symlink
ls -la node_modules/package-name

# Check global symlink
ls -la $(npm root -g)/package-name

# Resolve symlink chain
readlink node_modules/package-name
readlink $(npm root -g)/package-name
```

---

## Alternative Approaches

### 1. npm workspaces (Recommended for small monorepos)

**When to use:**

- 2-10 related packages
- Simple build dependencies
- Want automatic symlink management

**Setup:**

```json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspaces --if-present"
  }
}
```

---

### 2. pnpm (Recommended for large monorepos)

**When to use:**

- More than 10 packages
- Need disk efficiency
- Want strict dependency management

**Setup:**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Benefits:**

- Hard links instead of file copies
- Faster installation
- Prevents phantom dependencies

---

### 3. Yarn Workspaces

**When to use:**

- Already using Yarn
- Need Plug'n'Play (PnP)
- Want zero-installs (Yarn 3+)

**Setup:**

```json
{
  "workspaces": ["packages/*"],
  "private": true
}
```

---

### 4. Turborepo (Build orchestration)

**When to use:**

- Complex build pipelines
- Need build caching
- CI/CD optimization

**Setup:**

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

---

### 5. Nx (Advanced build orchestration)

**When to use:**

- Large enterprise monorepos
- Need intelligent caching
- Want generated workspace tools

**Setup:**

```bash
npm init nx-workspace@latest
```

---

## Quick Reference

### Common Commands

```bash
# npm link workflow
cd /path/to/package
npm link

cd /path/to/project
npm link package-name

# Verification
npm ls package-name
ls -la node_modules/package-name
readlink node_modules/package-name

# Cleanup
npm unlink package-name
npm install package-name
cd /path/to/package
npm unlink -g package-name
```

---

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "preserveSymlinks": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true
  }
}
```

---

### Package.json for Linked Packages

```json
{
  "name": "my-package",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "prelink": "npm run build",
    "prepublishOnly": "npm run build"
  }
}
```

---

### Troubleshooting Checklist

- [ ] Run `npm run build` before linking
- [ ] Check package name matches exactly (case-sensitive)
- [ ] Verify entry point file exists (dist/index.js or index.js)
- [ ] Check TypeScript has `preserveSymlinks: true`
- [ ] Restart TypeScript Language Server
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Check permissions (use nvm instead of system npm)
- [ ] Verify symlink with `ls -la node_modules/package-name`
- [ ] Check npm resolution with `npm ls package-name --json`
- [ ] On Windows: Enable Developer Mode or run as Administrator

---

## References

### Official Documentation

1. **npm link command**
   - URL: https://docs.npmjs.com/cli/v10/commands/npm-link
   - Coverage: Command syntax, options, examples

2. **npm folders**
   - URL: https://docs.npmjs.com/cli/v10/configuring-npm/folders
   - Coverage: Global node_modules location, directory structure

3. **npm developers guide**
   - URL: https://docs.npmjs.com/cli/v10/using-npm/developers
   - Coverage: Package development, local testing

4. **npm workspaces**
   - URL: https://docs.npmjs.com/cli/v10/using-npm/workspaces
   - Coverage: Workspace configuration, automatic linking

5. **Node.js fs module**
   - URL: https://nodejs.org/api/fs.html
   - Coverage: lstat(), readlink(), symlink detection

6. **Node.js CLI flags**
   - URL: https://nodejs.org/api/cli.html#--preserve-symlinks
   - Coverage: Symbolic link preservation

7. **TypeScript compiler options**
   - URL: https://www.typescriptlang.org/docs/handbook/compiler-options.html
   - Coverage: preserveSymlinks, moduleResolution, paths

8. **TypeScript module resolution**
   - URL: https://www.typescriptlang.org/docs/handbook/module-resolution.html
   - Coverage: Node.js module resolution, symlinks

### Community Resources

9. **Node.js best practices**
   - URL: https://github.com/goldbergyoni/nodebestpractices
   - Coverage: File system handling, error management

10. **npm link troubleshooting**
    - URL: https://github.com/npm/npm/issues
    - Coverage: Common issues, community solutions

11. **pnpm documentation**
    - URL: https://pnpm.io/workspaces
    - Coverage: Workspace configuration, efficient linking

12. **Turborepo documentation**
    - URL: https://turbo.build/repo/docs
    - Coverage: Build orchestration, caching

13. **Nx documentation**
    - URL: https://nx.dev
    - Coverage: Monorepo management, build pipelines

---

**End of External Research Document**
