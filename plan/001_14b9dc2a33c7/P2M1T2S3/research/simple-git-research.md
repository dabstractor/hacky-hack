# simple-git Library Research

## Overview

**simple-git** is a TypeScript-first Node.js library that provides a simple, promise-based API for running Git commands programmatically. It's maintained by Steve King and is widely used for Git automation in Node.js applications.

**Repository:** https://github.com/steveukx/git-js
**NPM Package:** https://www.npmjs.com/package/simple-git
**Type Definitions:** Built-in TypeScript definitions included

---

## 1. Installation

### npm

```bash
npm install simple-git
```

### yarn

```bash
yarn add simple-git
```

### pnpm

```bash
pnpm add simple-git
```

### TypeScript Types

The package includes TypeScript definitions out of the box. No need to install `@types/simple-git`.

---

## 2. Basic Setup

### Creating a Git Instance

```typescript
import { simpleGit, SimpleGit } from 'simple-git';

// Use current working directory
const git: SimpleGit = simpleGit();

// Use specific directory
const git: SimpleGit = simpleGit('/path/to/repo');

// Chain configuration
const git: SimpleGit = simpleGit({
  baseDir: '/path/to/repo',
  binary: 'git',
  maxConcurrentProcesses: 10,
  timeout: {
    block: 30000, // 30 seconds
  },
});
```

### Configuration Options

```typescript
interface SimpleGitOptions {
  baseDir?: string; // Base directory for git operations
  binary?: string; // Path to git binary (default: 'git')
  maxConcurrentProcesses?: number; // Max concurrent git processes
  timeout?: {
    block?: number; // Block timeout in milliseconds
  };
  config?: string[]; // Additional git config
  trimmed?: boolean; // Trim output whitespace
}
```

---

## 3. Common API Patterns

### 3.1 git.status() - Getting Changed Files

```typescript
import { simpleGit, StatusResult } from 'simple-git';

const git = simpleGit();

// Basic status check
const status: StatusResult = await git.status();
console.log(status);

// Access changed files
status.files.forEach(file => {
  console.log(`File: ${file.path}`);
  console.log(`  Index: ${file.index}`); // 'M', 'A', 'D', etc.
  console.log(`  Working: ${file.working_dir}`);
});

// Check if repository is clean
if (status.isClean()) {
  console.log('No changes detected');
}

// Get staged files
const staged = status.files.filter(f => f.index !== ' ');
console.log('Staged files:', staged);

// Get modified files (unstaged)
const modified = status.files.filter(f => f.working_dir !== ' ');
console.log('Modified files:', modified);

// Get untracked files
const untracked = status.files.filter(f => f.index === '?');
console.log('Untracked files:', untracked);

// Check current branch
console.log('Current branch:', status.current);
console.log('Tracking branch:', status.tracking);
```

**StatusResult Interface:**

```typescript
interface StatusResult {
  files: FileStatusResult[];
  branches: BranchSummary[];
  current: string; // Current branch name
  tracking: string | null; // Remote tracking branch
  ahead: number; // Commits ahead of remote
  behind: number; // Commits behind remote
  isClean(): boolean; // No changes?

  created: number; // Number of created files
  deleted: number; // Number of deleted files
  modified: number; // Number of modified files
  renamed: number; // Number of renamed files
  conflicted: number; // Number of conflicted files

  files: FileStatusResult[];
}

interface FileStatusResult {
  path: string; // File path relative to baseDir
  index: string; // Status in staging area
  working_dir: string; // Status in working directory
}
```

### 3.2 git.diff() - Getting Diff Output

```typescript
import { simpleGit, DiffResult } from 'simple-git';

const git = simpleGit();

// Diff between working directory and index (unstaged changes)
const diffStdout = await git.diff();
console.log(diffStdout);

// Diff between index and HEAD (staged changes)
const diffCached = await git.diffCached();
console.log(diffCached);

// Get structured diff result
const diffResult: DiffResult = await git.diff(['--name-only']);
console.log('Changed files:', diffResult.files);

// Diff specific file
const fileDiff = await git.diff(['--', 'src/file.ts']);

// Diff between branches
const branchDiff = await git.diff(['main...feature-branch']);

// Diff with options
const detailedDiff = await git.diff([
  '--unified=5', // Show 5 lines of context
  '--color-words', // Word-level diff
  'HEAD~1', // Compare with previous commit
]);

// Get summary of changes
const diffSummary = await git.diffSummary();
console.log('Changed files:', diffSummary.files);
diffSummary.files.forEach(file => {
  console.log(`${file.file}: +${file.changes} lines`);
});
```

**DiffResult Interface:**

```typescript
interface DiffResult {
  files: DiffResultFile[];
  files?: DiffResultFile[]; // Array of changed files
  diff?: string; // Raw diff output
}

interface DiffResultFile {
  file: string; // File path
  changes: number; // Number of changed lines
  insertions: number; // Number of insertions
  deletions: number; // Number of deletions
  binary: boolean; // Is binary file
}
```

### 3.3 git.add() - Staging Files

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// Stage all changes
await git.add('.');
console.log('All changes staged');

// Stage specific files
await git.add(['src/file1.ts', 'src/file2.ts']);

// Stage all files in directory
await git.add('src/');

// Stage with glob patterns
await git.add('src/**/*.ts');

// Stage all modified files (not new files)
await git.add('-u');

// Stage all files including untracked
await git.add('-A');

// Update index (don't add new files)
await git.add('-u');

// Interactive patch staging
await git.add('-p');

// Stage with force (ignore .gitignore)
await git.add('-f', 'ignored-file.txt');

// Chain with commit
await git.add('.').commit('feat: Add new feature');
```

### 3.4 git.commit() - Creating Commits

```typescript
import { simpleGit, CommitResult } from 'simple-git';

const git = simpleGit();

// Basic commit
const commitResult: CommitResult = await git.commit('Initial commit');
console.log('Commit hash:', commitResult.commit);

// Commit with all changes (stage + commit)
await git.add('.').commit('feat: Add user authentication');

// Commit with author details
await git.commit('Fix critical bug', {
  '--author': '"John Doe <john@example.com>"',
});

// Commit with empty message (allowed with --allow-empty)
await git.commit('--allow-empty', '-m', 'Empty commit');

// Amend previous commit
await git.commit('--amend', '-m', 'Updated commit message');

// Allow empty commit (useful for CI/CD)
await git.commit('Trigger deployment', {
  '--allow-empty': null,
});

// Commit with specific files
await git.commit('Update config', ['config.json', '.env']);

// Sign commit with GPG
await git.commit('--gpg-sign', '-m', 'Signed commit');

// Commit with options
await git.commit('Message', null, {
  '--allow-empty': true,
  '--no-verify': true, // Skip pre-commit hooks
});

// Access commit details
const result = await git.commit('feat: Add feature');
console.log('Branch:', result.branch);
console.log('Commit:', result.commit);
console.log('Summary:', result.summary);
```

**CommitResult Interface:**

```typescript
interface CommitResult {
  author: null | {
    email: string;
    name: string;
  };
  branch: string;
  commit: string; // Commit hash (long)
  root: boolean;
  summary: {
    changes: number;
    insertions: number;
    deletions: number;
  };
}
```

---

## 4. Error Handling

### GitError Class

```typescript
import { GitError, simpleGit } from 'simple-git';

const git = simpleGit();

try {
  await git.clone('https://github.com/user/repo.git', './repo');
} catch (error) {
  if (error instanceof GitError) {
    console.error('Git error:', error.message);
    console.error('Error data:', error.data);
    console.error('Git command:', error.gitErrorCode);
  }
}
```

### Type-Safe Error Handling Pattern

```typescript
import { GitError, SimpleGit, simpleGit } from 'simple-git';

async function safeGitOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof GitError) {
      console.error(`Git ${operation} failed:`, error.message);

      // Handle specific error scenarios
      if (error.message.includes('not a git repository')) {
        throw new Error('Not a git repository, please initialize first');
      }

      if (error.message.includes('nothing to commit')) {
        console.log('No changes to commit');
        return null;
      }

      if (error.message.includes('merge conflict')) {
        throw new Error('Merge conflict detected, please resolve conflicts');
      }
    }
    throw error;
  }
}

// Usage
async function stageAndCommit() {
  const git = simpleGit();

  const result = await safeGitOperation('commit', async () => {
    await git.add('.');
    return await git.commit('Auto-commit');
  });

  return result;
}
```

### Common Error Scenarios

```typescript
// Not a git repository
try {
  await git.status();
} catch (error) {
  if (
    error instanceof Error &&
    error.message.includes('not a git repository')
  ) {
    // Initialize repository
    await git.init();
  }
}

// Nothing to commit
try {
  await git.commit('Changes');
} catch (error) {
  if (error instanceof Error && error.message.includes('nothing to commit')) {
    console.log('Working tree clean, nothing to commit');
  }
}

// Remote errors
try {
  await git.push();
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('authentication failed')) {
      console.error('Git authentication failed. Check credentials.');
    } else if (error.message.includes('remote already exists')) {
      console.error('Remote repository already exists');
    }
  }
}

// Merge conflicts
try {
  await git.pull();
} catch (error) {
  if (error instanceof Error && error.message.includes('conflict')) {
    console.error('Merge conflict detected');
    const status = await git.status();
    console.log('Conflicted files:', status.conflicted);
  }
}
```

### Custom Error Wrapper

```typescript
class GitOperationError extends Error {
  constructor(
    public operation: string,
    message: string,
    public originalError?: unknown
  ) {
    super(`Git ${operation} failed: ${message}`);
    this.name = 'GitOperationError';
  }

  static from(error: unknown, operation: string): GitOperationError {
    return new GitOperationError(
      operation,
      error instanceof Error ? error.message : 'Unknown error',
      error
    );
  }
}

async function robustClone(url: string, path: string) {
  const git = simpleGit();
  try {
    await git.clone(url, path);
  } catch (error) {
    throw GitOperationError.from(error, 'clone');
  }
}
```

---

## 5. Working with Specific Paths/Directories

### Base Directory Configuration

```typescript
import { simpleGit, SimpleGit } from 'simple-git';

// Method 1: Specify baseDir in constructor
const git: SimpleGit = simpleGit('/custom/path/to/repo');

// Method 2: Use cwd() to change directory
const git = simpleGit();
await git.cwd('/custom/path/to/repo');

// Method 3: Temporarily change directory for one operation
const git = simpleGit();
await git.cwd('/path/1', async () => {
  await git.status(); // Runs in /path/1
});
await git.status(); // Runs in original directory
```

### Relative Path Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit('/project/root');

// Stage specific file (relative to baseDir)
await git.add('src/index.ts');

// Stage multiple files
await git.add(['src/components/Button.tsx', 'src/utils/helpers.ts']);

// Diff specific file
await git.diff(['--', 'src/index.ts']);

// Commit specific files
await git.commit('Update core files', [
  'src/core/index.ts',
  'src/core/types.ts',
]);

// Get status for specific paths
const status = await git.status(['src/']);
```

### Working with Multiple Repositories

```typescript
import { simpleGit, SimpleGit } from 'simple-git';

interface GitManager {
  [key: string]: SimpleGit;
}

const repos: GitManager = {
  frontend: simpleGit('/path/to/frontend'),
  backend: simpleGit('/path/to/backend'),
  shared: simpleGit('/path/to/shared'),
};

// Get status for all repos
async function getAllStatuses() {
  const results = await Promise.all(
    Object.entries(repos).map(async ([name, git]) => {
      const status = await git.status();
      return { name, status };
    })
  );

  results.forEach(({ name, status }) => {
    console.log(`${name}: ${status.isClean() ? 'Clean' : 'Dirty'}`);
  });
}

// Pull all repos
async function pullAllRepos() {
  for (const [name, git] of Object.entries(repos)) {
    try {
      await git.pull();
      console.log(`${name}: Pulled successfully`);
    } catch (error) {
      console.error(`${name}: Pull failed`, error);
    }
  }
}
```

### Nested Repository Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// Clone with nested path
await git.clone(
  'https://github.com/user/repo.git',
  '/path/to/nested/directory/repo'
);

// Initialize in nested directory
await git.init('/path/to/new/repo');

// Work with nested repo
const nestedGit = simpleGit('/path/to/nested/repo');
await nestedGit.status();
```

---

## 6. Type Definitions for TypeScript

### Main Interfaces

```typescript
import {
  simpleGit,
  SimpleGit,
  SimpleGitOptions,
  StatusResult,
  FileStatusResult,
  DiffResult,
  CommitResult,
  LogResult,
  BranchSummary,
  RemoteWithRefs,
  GitError,
  GitResponseError,
} from 'simple-git';

// SimpleGit - Main interface
interface SimpleGit {
  // Repository operations
  init(path?: string): Promise<InitResult>;
  clone(repoPath: string, localPath: string, options?: string[]): Promise<void>;
  status(paths?: string[]): Promise<StatusResult>;

  // Staging operations
  add(files: string | string[]): Promise<any>;
  diff(options?: string | string[]): Promise<string>;
  diffSummary(options?: string[]): Promise<DiffResult>;

  // Commit operations
  commit(
    message: string,
    files?: string[] | null,
    options?: Object
  ): Promise<CommitResult>;

  // Branch operations
  branch(branch?: string): Promise<BranchSummary>;
  checkout(branch: string, options?: string[]): Promise<void>;
  checkoutBranch(branchName: string, startPoint: string): Promise<void>;
  deleteLocalBranch(branch: string, force?: boolean): Promise<void>;

  // History operations
  log(options?: LogOptions): Promise<LogResult>;
  show(options?: string | string[]): Promise<string>;

  // Remote operations
  addRemote(name: string, url: string): Promise<void>;
  getRemotes(verbose?: boolean): Promise<RemoteWithRefs[]>;
  push(remote?: string, branch?: string, options?: Object): Promise<PushResult>;
  pull(remote?: string, branch?: string, options?: Object): Promise<PullResult>;
  fetch(
    remote?: string,
    branch?: string,
    options?: Object
  ): Promise<FetchResult>;

  // Configuration
  raw(commands: string | string[]): Promise<string>;
  env(variable: string, value: string): SimpleGit;
  cwd(path: string): SimpleGit;
  customBinary(bin: string): SimpleGit;
}
```

### Generic Result Types

```typescript
// Status Result
interface StatusResult {
  files: FileStatusResult[];
  branches: BranchSummary[];
  current: string;
  tracking: string | null;
  ahead: number;
  behind: number;
  isClean(): boolean;

  created: number;
  deleted: number;
  modified: number;
  renamed: number;
  conflicted: number;
}

interface FileStatusResult {
  path: string;
  index: string; // ' ', 'M', 'A', 'D', 'R', 'C', '?', etc.
  working_dir: string;
}

// Diff Result
interface DiffResult {
  files: DiffResultFile[];
  files?: DiffResultFile[];
  diff?: string;
}

interface DiffResultFile {
  file: string;
  changes: number;
  insertions: number;
  deletions: number;
  binary: boolean;
}

// Commit Result
interface CommitResult {
  author: {
    email: string;
    name: string;
  } | null;
  branch: string;
  commit: string; // Full commit hash
  root: boolean;
  summary: {
    changes: number;
    insertions: number;
    deletions: number;
  };
}

// Log Result
interface LogResult {
  all: LogEntry[];
  total: number;
  latest: LogEntry;
}

interface LogEntry {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
  refs: string[];
  diff: DiffResult;
}

// Branch Summary
interface BranchSummary {
  all: string[];
  branches: {
    [name: string]: {
      current: boolean;
      name: string;
      commit: string;
      label: string;
    };
  };
  current: string;
  detached: boolean;
}

// Push/Pull Results
interface PushResult {
  pushed: string[];
  branch: {
    local: string;
    remote: string;
    remoteName: string;
  };
  update: {
    from?: {
      hash: string;
      label: string;
    };
    to?: {
      hash: string;
      label: string;
    };
  };
}

interface PullResult {
  files: string[];
  insertions: number;
  deletions: number;
  summary: {
    changes: number;
    insertions: number;
    deletions: number;
  };
}
```

### Error Types

```typescript
// GitError - Base error class
class GitError extends Error {
  constructor(
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'GitError';
  }
}

// GitResponseError - Response parsing error
class GitResponseError<T> extends GitError {
  constructor(
    public git: T,
    message: string
  ) {
    super(message);
    this.name = 'GitResponseError';
  }
}

// Task Configuration Error
class TaskConfigurationError extends GitError {
  constructor(message: string) {
    super(message);
    this.name = 'TaskConfigurationError';
  }
}
```

---

## 7. Async/Await Patterns

### Sequential Operations

```typescript
import { simpleGit } from 'simple-git';

async function sequentialWorkflow() {
  const git = simpleGit();

  // Sequential operations
  await git.init();
  await git.addRemote('origin', 'https://github.com/user/repo.git');
  await git.fetch();
  await git.checkout('main');

  console.log('Repository initialized and configured');
}
```

### Parallel Operations

```typescript
import { simpleGit, SimpleGit } from 'simple-git';

async function parallelStatusCheck() {
  const repos = [
    simpleGit('/path/to/repo1'),
    simpleGit('/path/to/repo2'),
    simpleGit('/path/to/repo3'),
  ];

  // Parallel status checks
  const statuses = await Promise.all(repos.map(git => git.status()));

  statuses.forEach((status, i) => {
    console.log(`Repo ${i + 1}: ${status.isClean() ? 'Clean' : 'Dirty'}`);
  });
}

// Parallel with error handling
async function parallelWithErrors() {
  const repos = [
    simpleGit('/path/to/repo1'),
    simpleGit('/path/to/repo2'),
    simpleGit('/path/to/repo3'),
  ];

  const results = await Promise.allSettled(repos.map(git => git.status()));

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`Repo ${i + 1}: OK`);
    } else {
      console.error(`Repo ${i + 1}:`, result.reason);
    }
  });
}
```

### Chained Operations

```typescript
import { simpleGit } from 'simple-git';

async function chainedOperations() {
  const git = simpleGit();

  // Chain multiple operations
  await git
    .init()
    .addRemote('origin', 'https://github.com/user/repo.git')
    .fetch('origin', 'main')
    .checkout(['-b', 'feature/new-feature'])
    .add('src/*')
    .commit('feat: Initial commit')
    .push('origin', 'feature/new-feature');

  console.log('Feature branch created and pushed');
}
```

### Retry Pattern

```typescript
import { simpleGit, GitError } from 'simple-git';

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof GitError) {
        if (error.message.includes('authentication failed')) {
          throw error; // Don't retry auth errors
        }
      }

      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

// Usage
async function robustPull() {
  const git = simpleGit();

  return withRetry(() => git.pull(), 3, 1000);
}
```

### Timeout Pattern

```typescript
import { simpleGit } from 'simple-git';

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

// Usage
async function safeClone() {
  const git = simpleGit();

  try {
    await withTimeout(
      git.clone('https://github.com/user/repo.git', './repo'),
      60000, // 60 second timeout
      'Clone operation timed out after 60 seconds'
    );
    console.log('Clone successful');
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      console.error('Clone took too long, aborting');
    }
    throw error;
  }
}
```

### Async Generator Pattern

```typescript
import { simpleGit, LogEntry } from 'simple-git';

async function* getCommitsBatched(repoPath: string, batchSize = 50) {
  const git = simpleGit(repoPath);
  let skip = 0;

  while (true) {
    const log = await git.log({
      maxCount: batchSize,
      from: skip,
    });

    if (log.total === 0) break;

    for (const commit of log.all) {
      yield commit;
    }

    if (log.all.length < batchSize) break;

    skip += batchSize;
  }
}

// Usage
async function processAllCommits() {
  for await (const commit of getCommitsBatched('/path/to/repo')) {
    console.log(`${commit.hash.substring(0, 7)}: ${commit.message}`);
  }
}
```

---

## 8. Common Gotchas and Best Practices

### Gotchas

#### 1. Working Directory Assumptions

```typescript
// ❌ BAD - Assumes current working directory
const git = simpleGit();
await git.status(); // May fail if not in git repo

// ✅ GOOD - Explicit base directory
const git = simpleGit(process.cwd());
await git.status();

// ✅ BETTER - Verify it's a git repo first
const git = simpleGit(process.cwd());
try {
  await git.status();
} catch (error) {
  await git.init(); // Initialize if needed
}
```

#### 2. Async Chain Returns

```typescript
// ❌ BAD - Chain doesn't wait for completion
git.add('.').commit('Changes');
console.log('Done'); // Runs before commit

// ✅ GOOD - Explicit await
await git.add('.').commit('Changes');
console.log('Done'); // Runs after commit
```

#### 3. Empty Commit Handling

```typescript
// ❌ BAD - Throws error when nothing to commit
try {
  await git.add('.').commit('Changes');
} catch (error) {
  // Error: "nothing to commit"
}

// ✅ GOOD - Handle empty working tree
await git.add('.');
const status = await git.status();
if (!status.isClean()) {
  await git.commit('Changes');
}

// ✅ ALTERNATIVE - Use --allow-empty
await git.commit('Changes', null, { '--allow-empty': true });
```

#### 4. Path Separators

```typescript
// ❌ BAD - Windows path separators
await git.add('src\\components\\Button.tsx'); // Fails on Linux

// ✅ GOOD - Use forward slashes (cross-platform)
await git.add('src/components/Button.tsx');

// ✅ BEST - Use path module
import path from 'path';
await git.add(path.join('src', 'components', 'Button.tsx'));
```

#### 5. Binary File Handling

```typescript
// ❌ BAD - Tries to diff binary files
const diff = await git.diff('image.png'); // Returns binary data

// ✅ GOOD - Check if binary
const summary = await git.diffSummary();
summary.files.forEach(file => {
  if (file.binary) {
    console.log(`${file.file} is a binary file`);
  }
});
```

#### 6. Concurrent Process Limits

```typescript
// ❌ BAD - Too many concurrent git operations
const promises = Array(100)
  .fill(null)
  .map((_, i) =>
    git.clone(`https://github.com/user/repo${i}.git`, `./repo${i}`)
  );
await Promise.all(promises); // May fail due to process limits

// ✅ GOOD - Configure max concurrent processes
const git = simpleGit({ maxConcurrentProcesses: 5 });

// ✅ BETTER - Use p-limit or similar
import pLimit from 'p-limit';
const limit = pLimit(5);
const promises = repos.map(repo => limit(() => git.clone(repo.url, repo.path)));
await Promise.all(promises);
```

#### 7. Shell Injection

```typescript
// ❌ BAD - User input directly in commands
const userInput = '; rm -rf /';
await git.raw(`checkout ${userInput}`); // DANGEROUS!

// ✅ GOOD - Use array arguments
await git.raw(['checkout', userInput]);

// ✅ BETTER - Validate input
if (!/^[a-zA-Z0-9-_]+$/.test(branchName)) {
  throw new Error('Invalid branch name');
}
await git.checkout(branchName);
```

### Best Practices

#### 1. Always Specify Base Directory

```typescript
import { simpleGit } from 'simple-git';
import path from 'path';

const repoPath = path.resolve(process.cwd(), 'my-repo');
const git = simpleGit(repoPath);
```

#### 2. Use Type-Safe Patterns

```typescript
import { simpleGit, StatusResult } from 'simple-git';

const git = simpleGit();

const status: StatusResult = await git.status();

// Type-safe access to status
const changedFiles = status.files.filter(
  file => file.index !== ' ' || file.working_dir !== ' '
);
```

#### 3. Implement Proper Error Handling

```typescript
import { GitError, simpleGit } from 'simple-git';

async function safeOperation() {
  const git = simpleGit();

  try {
    return await git.pull();
  } catch (error) {
    if (error instanceof GitError) {
      // Handle git-specific errors
      if (error.message.includes('merge conflict')) {
        const status = await git.status();
        throw new Error(`Merge conflict in: ${status.conflicted.join(', ')}`);
      }
    }
    throw error;
  }
}
```

#### 4. Use Configuration for Performance

```typescript
const git = simpleGit({
  baseDir: '/path/to/repo',
  maxConcurrentProcesses: 10, // Limit concurrent git processes
  timeout: {
    block: 30000, // 30 second timeout
  },
  trimmed: true, // Trim whitespace from output
});
```

#### 5. Check Repository State Before Operations

```typescript
async function smartCommit(message: string) {
  const git = simpleGit();

  const status = await git.status();

  // Check if there's anything to commit
  if (status.isClean()) {
    console.log('Nothing to commit');
    return null;
  }

  // Stage and commit
  await git.add('.');
  return await git.commit(message);
}
```

#### 6. Use Specific Options for Better Control

```typescript
// Instead of raw commands
await git.raw('config', 'user.name', 'Bot');

// Use built-in methods when available
await git.addConfig('user.name', 'Bot');

// Or use proper options
await git.commit('Message', null, {
  '--author': '"Bot <bot@example.com>"',
  '--allow-empty': true,
});
```

#### 7. Log Important Operations

```typescript
import { simpleGit } from 'simple-git';

function createLogger(repoPath: string) {
  const git = simpleGit(repoPath);

  const originalCommit = git.commit.bind(git);

  git.commit = async function (message: string, ...args: any[]) {
    console.log(`[${repoPath}] Committing: ${message}`);
    const result = await originalCommit(message, ...args);
    console.log(`[${repoPath}] Committed: ${result.commit}`);
    return result;
  };

  return git;
}

// Usage
const git = createLogger('/path/to/repo');
await git.add('.');
await git.commit('feat: Add feature');
```

#### 8. Use Git Hooks for Validation

```typescript
import { simpleGit } from 'simple-git';

async function commitWithValidation(message: string, files: string[]) {
  const git = simpleGit();

  // Pre-commit validation
  const status = await git.status();
  const hasConflicts = status.conflicted.length > 0;

  if (hasConflicts) {
    throw new Error('Cannot commit with unresolved conflicts');
  }

  // Stage files
  await git.add(files);

  // Commit
  return await git.commit(message);
}
```

---

## 9. Additional Useful APIs

### Git Log

```typescript
import { simpleGit, LogOptions } from 'simple-git';

const git = simpleGit();

// Get recent commits
const log = await git.log();
console.log(log.all.slice(0, 10));

// Get commits with options
const logOptions: LogOptions = {
  from: 'HEAD~10',
  to: 'HEAD',
  maxCount: 20,
  format: { hash: '%H', message: '%s', date: '%ai' },
};
const detailedLog = await git.log(logOptions);

// Get file history
const fileLog = await git.log({ file: 'src/index.ts' });

// Get commits since date
const recentLog = await git.log({
  from: '2024-01-01',
});
```

### Branch Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// List branches
const branches = await git.branch();
console.log('All branches:', branches.all);
console.log('Current branch:', branches.current);

// Create new branch
await git.checkoutLocalBranch('feature/new-feature');

// Switch branch
await git.checkout('develop');

// Delete branch
await git.deleteLocalBranch('old-feature');

// Delete with force
await git.deleteLocalBranch('feature/unwanted', true);
```

### Tag Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// List tags
const tags = await git.tags();
console.log('All tags:', tags.all);

// Create tag
await git.addTag('v1.0.0');
await git.addAnnotatedTag('v1.0.0', 'Release version 1.0.0');

// Checkout tag
await git.checkout('v1.0.0');

// Delete tag
await git.deleteTag('v0.9.0');
```

### Remote Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// Add remote
await git.addRemote('origin', 'https://github.com/user/repo.git');

// List remotes
const remotes = await git.getRemotes(true);
console.log(remotes);

// Fetch from remote
await git.fetch('origin');

// Pull changes
await git.pull('origin', 'main');

// Push changes
await git.push('origin', 'feature-branch');

// Push with tags
await git.pushTags('origin');

// Remove remote
await git.removeRemote('upstream');
```

### Stash Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// Stash changes
await git.stash(['push', '-m', 'WIP: Work in progress']);

// List stashes
const stashList = await git.raw(['stash', 'list']);

// Apply stash
await git.raw(['stash', 'apply']);

// Pop stash (apply and remove)
await git.raw(['stash', 'pop']);

// Drop stash
await git.raw(['stash', 'drop']);
```

### Submodule Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// Add submodule
await git.submoduleAdd('https://github.com/user/repo.git', 'lib/repo');

// Update submodules
await git.submoduleUpdate(['--init', '--recursive']);

// List submodules
const submodules = await git.raw(['submodule', 'status']);
```

### Clean Operations

```typescript
import { simple-git } from 'simple-git';

const git = simpleGit();

// Dry run to see what would be removed
const toRemove = await git.clean(['-d', '-n']);
console.log('Files that would be removed:', toRemove);

// Remove untracked files
await git.clean(['-d', '-f']);

// Remove ignored files too
await git.clean(['-d', '-f', '-x']);
```

### Reset Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// Soft reset (keep changes)
await git.reset(['--soft', 'HEAD~1']);

// Mixed reset (default)
await git.reset(['--mixed', 'HEAD~1']);

// Hard reset (discard changes)
await git.reset(['--hard', 'HEAD~1']);

// Reset specific file
await git.reset(['--', 'src/file.ts']);
```

### Show Operations

```typescript
import { simpleGit } from 'simple-git';

const git = simpleGit();

// Show commit details
const commitDetails = await git.show(['HEAD']);

// Show file at specific commit
const fileContent = await git.show(['HEAD~1:src/index.ts']);

// Show with format
const formatted = await git.show(['--format=%H%n%s%n%b', '--no-patch']);
```

---

## 10. Complete Example: Git Automation Script

```typescript
import { simpleGit, GitError, StatusResult } from 'simple-git';
import path from 'path';

interface RepoConfig {
  name: string;
  path: string;
  remote: string;
  branch: string;
}

class GitAutomation {
  private repos: Map<string, RepoConfig> = new Map();

  addRepo(config: RepoConfig) {
    this.repos.set(config.name, config);
  }

  async updateAllRepos() {
    const results = await Promise.allSettled(
      Array.from(this.repos.values()).map(repo => this.updateRepo(repo))
    );

    results.forEach((result, i) => {
      const repoName = Array.from(this.repos.keys())[i];
      if (result.status === 'fulfilled') {
        console.log(`✓ ${repoName}: Updated successfully`);
      } else {
        console.error(`✗ ${repoName}: ${result.reason.message}`);
      }
    });
  }

  private async updateRepo(config: RepoConfig) {
    const git = simpleGit(config.path);

    try {
      // Check if repo exists
      try {
        await git.status();
      } catch {
        // Clone if doesn't exist
        await git.clone(config.remote, config.path);
      }

      // Fetch latest
      await git.fetch();

      // Check status
      const status: StatusResult = await git.status();

      // Warn if there are uncommitted changes
      if (!status.isClean()) {
        console.warn(`Warning: ${config.name} has uncommitted changes`);
      }

      // Pull latest changes
      await git.pull(config.remote, config.branch);

      return { updated: true };
    } catch (error) {
      throw new Error(
        `Failed to update ${config.name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async getStatusReport() {
    const report: {
      [name: string]: {
        clean: boolean;
        branch: string;
        changes: number;
      };
    } = {};

    for (const [name, config] of this.repos) {
      const git = simpleGit(config.path);
      try {
        const status: StatusResult = await git.status();
        report[name] = {
          clean: status.isClean(),
          branch: status.current,
          changes: status.files.length,
        };
      } catch {
        report[name] = {
          clean: false,
          branch: 'unknown',
          changes: -1,
        };
      }
    }

    return report;
  }
}

// Usage
async function main() {
  const automation = new GitAutomation();

  automation.addRepo({
    name: 'backend',
    path: path.resolve(process.cwd(), 'backend'),
    remote: 'https://github.com/company/backend.git',
    branch: 'main',
  });

  automation.addRepo({
    name: 'frontend',
    path: path.resolve(process.cwd(), 'frontend'),
    remote: 'https://github.com/company/frontend.git',
    branch: 'main',
  });

  // Get status report
  console.log('Repository Status:');
  const report = await automation.getStatusReport();
  console.log(JSON.stringify(report, null, 2));

  // Update all repos
  console.log('\nUpdating repositories...');
  await automation.updateAllRepos();
}

main().catch(console.error);
```

---

## 11. Testing with simple-git

```typescript
import { simpleGit, SimpleGit } from 'simple-git';
import { jest } from '@jest/globals';

// Mock simple-git
jest.mock('simple-git', () => ({
  simpleGit: jest.fn(() => ({
    status: jest.fn().mockResolvedValue({
      isClean: () => true,
      files: [],
    }),
    add: jest.fn().mockResolvedValue(null),
    commit: jest.fn().mockResolvedValue({
      commit: 'abc123',
    }),
    push: jest.fn().mockResolvedValue(null),
  })),
}));

describe('Git Operations', () => {
  it('should commit changes', async () => {
    const git: SimpleGit = simpleGit();

    await git.add('.');
    await git.commit('Test commit');

    expect(git.add).toHaveBeenCalledWith('.');
    expect(git.commit).toHaveBeenCalledWith('Test commit');
  });
});

// Integration test pattern
describe('Git Integration', () => {
  const testRepo = '/tmp/test-repo-' + Date.now();
  const git = simpleGit(testRepo);

  beforeAll(async () => {
    await git.init();
  });

  afterAll(async () => {
    // Cleanup
    await require('fs').promises.rm(testRepo, {
      recursive: true,
      force: true,
    });
  });

  it('should handle empty commit', async () => {
    const status = await git.status();

    if (!status.isClean()) {
      await git.add('.');
      await git.commit('Test commit');
    }
  });
});
```

---

## 12. Performance Tips

```typescript
// 1. Use single instance
const git = simpleGit('/path/to/repo');

// ❌ BAD - Creates new instance each time
for (const file of files) {
  const git = simpleGit('/path/to/repo');
  await git.add(file);
}

// ✅ GOOD - Reuse instance
const git = simpleGit('/path/to/repo');
for (const file of files) {
  await git.raw(['add', file]);
}

// 2. Batch operations
// ❌ BAD - Multiple status calls
const file1Status = await git.status(['file1']);
const file2Status = await git.status(['file2']);

// ✅ GOOD - Single status call
const status = await git.status();
const file1Status = status.files.find(f => f.path === 'file1');

// 3. Limit concurrent operations
import pLimit from 'p-limit';

const git = simpleGit();
const limit = pLimit(5); // Max 5 concurrent operations

const operations = repos.map(repo =>
  limit(() => git.pull(repo.remote, repo.branch))
);

await Promise.all(operations);

// 4. Cache expensive operations
class GitCache {
  private cache = new Map<string, any>();

  async getStatus(git: SimpleGit) {
    const cacheKey = 'status';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const status = await git.status();
    this.cache.set(cacheKey, status);

    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, 5000); // Invalidate after 5 seconds

    return status;
  }
}
```

---

## References

### Official Resources

- **GitHub Repository:** https://github.com/steveukx/git-js
  - Source code
  - Issue tracker
  - Contributing guidelines

- **NPM Package:** https://www.npmjs.com/package/simple-git
  - Latest version information
  - Installation commands
  - Dependency information

- **TypeScript Definitions:** Included in package
  - Full type definitions included
  - No additional `@types` package needed

### Key Documentation Sections

- **API Reference:** https://github.com/steveukx/git-js/tree/main/docs/api.md
- **Getting Started:** https://github.com/steveukx/git-js/tree/main/docs/getting-started.md
- **Error Handling:** https://github.com/steveukx/git-js/tree/main/docs/errors.md
- **TypeScript Usage:** https://github.com/steveukx/git-js/tree/main/docs/typescript.md

### Related Libraries

- **git-js:** https://github.com/steveukx/git-js (same project, different name)
- **nodegit:** Native Node.js bindings to libgit2 (lower-level alternative)
- **isomorphic-git:** Pure JavaScript Git implementation (browser-compatible)

---

## Summary

The **simple-git** library is a robust, TypeScript-first solution for Git automation in Node.js applications. Key takeaways:

1. **Promise-based API** with full TypeScript support
2. **Comprehensive Git coverage** - supports most Git commands
3. **Easy error handling** with `GitError` class
4. **Flexible configuration** for base directories and options
5. **Chainable operations** for fluent workflows
6. **Production-ready** with proper error handling and testing patterns

Common use cases include:

- CI/CD automation
- Git workflow tools
- Multi-repo management
- Deployment scripts
- Version control utilities
