# Node.js child_process Best Practices for MCP Tools

## Summary

This research document covers Node.js child_process best practices for executing shell commands safely in the context of MCP tool implementation.

## Key Findings

### 1. Use spawn() for MCP Tools

**Recommendation**: Use `spawn()` for most MCP tool cases.

**Why**:

- Streams output, handles large data without buffering
- No shell buffering issues
- Better for long-running commands
- More control over process lifecycle

**Quick Reference**:

- **spawn()**: Best for MCP tools - streams output, handles large data
- **exec()**: Only if you need shell features (pipes, redirects) - buffers entire output
- **execSync()**: Avoid for MCP tools - blocks event loop
- **execFile()**: Alternative to spawn when you don't need shell

### 2. Proper Timeout Handling

```typescript
import { spawn } from 'child_process';

interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

async function spawnWithTimeout(
  command: string,
  args: string[],
  timeout: number = 30000
): Promise<SpawnResult> {
  return new Promise(resolve => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');

      // Force kill if SIGTERM doesn't work
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    child.stdout?.on('data', data => {
      stdout += data.toString();
    });

    child.stderr?.on('data', data => {
      stderr += data.toString();
    });

    child.on('close', code => {
      clearTimeout(timeoutId);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });

    child.on('error', error => {
      clearTimeout(timeoutId);
      resolve({ stdout: '', stderr: '', exitCode: null, timedOut: false });
    });
  });
}
```

### 3. Capturing stdout, stderr, and exitCode

```typescript
interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  success: boolean;
}

async function executeCommandSafely(
  command: string,
  args: string[],
  options = {}
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', data => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', data => {
        stderr += data.toString();
      });
    }

    child.on('close', exitCode => {
      resolve({
        stdout,
        stderr,
        exitCode,
        success: exitCode === 0,
      });
    });

    child.on('error', error => {
      reject({
        stdout,
        stderr,
        exitCode: null,
        success: false,
        error: error.message,
      });
    });
  });
}
```

### 4. Security Considerations - CRITICAL FOR MCP TOOLS

```typescript
// ❌ DANGEROUS - Shell Injection Vulnerability
function dangerousExecute(userInput: string) {
  const { exec } = require('child_process');
  exec(`git status ${userInput}`, callback);
}

// ✅ SAFE - Uses argument array
function safeExecute(userInput: string) {
  return spawn('git', ['status', userInput], {
    shell: false, // Explicitly disable shell
  });
}

// ✅ SAFE WITH VALIDATION
function validateAndExecute(command: string, args: string[]) {
  const allowedCommands = ['git', 'npm', 'node', 'ls'];

  if (!allowedCommands.includes(command)) {
    throw new Error(`Command not allowed: ${command}`);
  }

  const sanitizedArgs = args.map(arg => {
    if (!/^[a-zA-Z0-9._/-]+$/.test(arg)) {
      throw new Error(`Invalid argument: ${arg}`);
    }
    return arg;
  });

  return spawn(command, sanitizedArgs, {
    shell: false,
    cwd: process.cwd(),
    env: { ...process.env },
  });
}
```

### 5. Working Directory (cwd) Option Handling

```typescript
import { existsSync, realpathSync } from 'fs';
import { resolve } from 'path';

function executeWithCwd(command: string, args: string[], cwd: string) {
  const absoluteCwd = resolve(cwd);
  if (!existsSync(absoluteCwd)) {
    throw new Error(`Working directory does not exist: ${absoluteCwd}`);
  }

  const realCwd = realpathSync(absoluteCwd);

  return spawn(command, args, {
    cwd: realCwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
```

### 6. Complete Error Handling Pattern for MCP Tools

```typescript
interface McpCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
  timedOut?: boolean;
}

interface McpCommandOptions {
  timeout?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  maxSize?: number;
}

export async function executeMcpCommand(
  command: string,
  args: string[],
  options: McpCommandOptions = {}
): Promise<McpCommandResult> {
  const {
    timeout = 30000,
    cwd,
    env = { ...process.env },
    maxSize = 10 * 1024 * 1024,
  } = options;

  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let stdoutSize = 0;
    let stderrSize = 0;
    let timedOut = false;
    let killed = false;

    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    if (child.stdout) {
      child.stdout.on('data', data => {
        if (killed) return;

        stdoutSize += data.length;
        if (stdoutSize > maxSize) {
          killed = true;
          child.kill();
          return;
        }
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', data => {
        if (killed) return;

        stderrSize += data.length;
        if (stderrSize > maxSize) {
          killed = true;
          child.kill();
          return;
        }
        stderr += data.toString();
      });
    }

    child.on('close', exitCode => {
      clearTimeout(timeoutId);

      const result: McpCommandResult = {
        success: exitCode === 0 && !timedOut && !killed,
        stdout,
        stderr,
        exitCode,
        timedOut,
      };

      if (timedOut) {
        result.error = `Command timed out after ${timeout}ms`;
      } else if (killed) {
        result.error = `Command output exceeded maximum size of ${maxSize} bytes`;
      } else if (exitCode !== 0) {
        result.error = `Command failed with exit code ${exitCode}`;
      }

      resolve(result);
    });

    child.on('error', error => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}
```

### 7. Additional Security Gotchas

```typescript
// ❌ GOTCHA 1: Shell option with user input
spawn('command', [userInput], { shell: true }); // DANGEROUS!

// ✅ SOLUTION: Never use shell: true with user input
spawn('command', [userInput], { shell: false });

// ❌ GOTCHA 2: Environment variable injection
spawn('command', [], {
  env: { PATH: userInput }, // DANGEROUS!
});

// ✅ SOLUTION: Sanitize environment variables
const safeEnv = {
  ...process.env,
  PATH: process.env.PATH,
};

// ❌ GOTCHA 3: Working directory traversal
spawn('ls', [], { cwd: '../../../etc' });

// ✅ SOLUTION: Validate and resolve working directory
import { resolve, normalize } from 'path';
const safeCwd = normalize(resolve(userInput));
if (!safeCwd.startsWith('/allowed/base/path')) {
  throw new Error('Directory not allowed');
}
```

## Key Takeaways for MCP Tools

1. **Always use spawn()** with argument arrays (never exec() with user input)
2. **Set explicit timeouts** and handle cleanup properly
3. **Capture and return both stdout and stderr** with exit codes
4. **Never use shell: true** with user input
5. **Validate working directories** to prevent path traversal
6. **Implement size limits** to prevent memory exhaustion
7. **Handle both spawn errors** and non-zero exit codes explicitly

## Sources

- [Node.js child_process documentation](https://nodejs.org/api/child_process.html)
- [OWASP Node.js Security Guidelines](https://owasp.org/www-project-node-js-security-top-ten/)
- [Common patterns from production MCP tool implementations](https://github.com/modelcontextprotocol)
