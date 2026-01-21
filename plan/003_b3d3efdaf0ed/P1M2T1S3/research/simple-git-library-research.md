# Simple-Git Library Research

## Introduction

Simple-git is a lightweight, promise-based JavaScript wrapper for the Git command line interface. It provides a clean, modern API for performing Git operations programmatically.

## Main Documentation Resources

**Primary Documentation Source:**

- [simple-git on npm](https://www.npmjs.com/package/simple-git)
- [simple-git GitHub Repository](https://github.com/steveukx/git-js/tree/main/simple-git)

---

## 1. Git Status Operations

### Basic Usage

```javascript
const simpleGit = require('simple-git');

const git = simpleGit();

// Get current status
const status = await git.status();
console.log(status.files); // Array of files with their status
console.log(status.staged); // Staged files
console.log(status.modified); // Modified files
console.log(status.not_added); // Untracked files
```

### Status Response Structure

The status operation returns an object with:

- `files`: Array of file objects with properties like:
  - `path`: File path
  - `index`: Status in staging area
  - `working_dir`: Status in working directory
  - `type`: File type
- `staged`: Array of staged file paths
- `modified`: Array of modified file paths
- `not_added`: Array of untracked file paths
- `ahead`, `behind`: Count of commits ahead/behind

### Example Status Check

```javascript
const status = await git.status();
if (status.isClean()) {
  console.log('Working directory is clean');
} else {
  console.log('Files to commit:', status.modified);
}
```

---

## 2. Git Add Operations

### Basic Add Operations

```javascript
// Add all files
await git.add('.');

// Add specific file
await git.add('src/file.js');

// Add multiple files
await git.add(['src/*.js', 'test/*.js']);

// Add files with wildcards
await git.add('src/**/*.js');
```

### Advanced Add Options

```javascript
// Add with options
await git.add(['file.js'], { '--all': true });
```

---

## 3. Git Commit Operations

### Basic Commit

```javascript
// Simple commit
await git.commit('Initial commit');

// Commit with options
await git.commit({
  '--message': 'Fix bug in authentication',
  '--author': 'John Doe <john@example.com>',
});

// Multiple commits
await git.commit(['Add new feature', 'Fix test cases', 'Update documentation']);
```

### Commit Response

The commit operation returns an object with:

- `author`: Commit author
- `branch`: Branch name
- `commit`: Commit hash
- `summary`: Commit message
- `body`: Commit body

---

## 4. Working with Commits and Commit Hashes

### Getting Commit Information

```javascript
// Get latest commit
const latestCommit = await git.log(['-1']);

// Get specific commit by hash
const commit = await git.show('abc123');

// Get commit history
const history = await git.log(['--since', '1 week ago']);

// Get commit count
const count = await git.revList(['--count', 'HEAD']);

// Get commit diff
const diff = await git.diff('abc123', 'def456');
```

### Commit Hash Operations

```javascript
// Get current HEAD hash
const headHash = await git.revparse(['HEAD']);

// Get short hash
const shortHash = await git.revparse(['--short', 'HEAD']);

// Check if commit exists
const exists = await git.revparse(['--verify', 'abc123']);
```

### Branch Operations

```javascript
// Create branch
await git.checkoutLocalBranch('feature-branch');

// Switch branch
await git.checkout('main');

// Get branch info
const branches = await git.branch();
console.log(branches.current); // Current branch name
console.log(branches.all); // All branches
```

---

## 5. Error Handling Patterns

### Basic Error Handling

```javascript
try {
  await git.status();
} catch (error) {
  console.error('Git operation failed:', error.message);
}
```

### Common Error Types

- **GitError**: General Git operation errors
- **GitConstructError**: Repository not found or invalid
- **GitCommandError**: Command execution failures

### Retry Pattern

```javascript
const retryGitOperation = async (operation, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError;
};

// Usage
const status = await retryGitOperation(() => git.status());
```

### Validation Before Operations

```javascript
const canCommit = async () => {
  const status = await git.status();
  return !status.isClean();
};

if (await canCommit()) {
  await git.commit('Update files');
}
```

---

## 6. Testing Patterns with Simple-Git

### Unit Testing Strategy

```javascript
const simpleGit = require('simple-git');
const mock = require('mock-require');

describe('Git operations', () => {
  let gitSpy;

  beforeEach(() => {
    gitSpy = {
      status: jest.fn().mockResolvedValue({
        isClean: jest.fn().mockReturnValue(true),
        files: [],
      }),
      add: jest.fn().mockResolvedValue({}),
      commit: jest.fn().mockResolvedValue({
        commit: 'abc123',
        author: 'Test User',
      }),
    };

    mock('simple-git', () => gitSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  test('should handle clean working directory', async () => {
    const git = require('simple-git')();
    const status = await git.status();
    expect(status.isClean()).toBe(true);
  });
});
```

### Integration Testing Setup

```javascript
const path = require('path');
const fs = require('fs').promises;
const simpleGit = require('simple-git');
const { exec } = require('child_process');

describe('Git integration tests', () => {
  let testRepoPath;

  beforeAll(async () => {
    testRepoPath = path.join(__dirname, 'test-repo');
    await fs.mkdir(testRepoPath, { recursive: true });

    // Initialize git repository
    await exec(`git init ${testRepoPath}`);

    const git = simpleGit(testRepoPath);
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');
  });

  afterAll(async () => {
    // Cleanup
    await fs.rmdir(testRepoPath, { recursive: true });
  });

  test('should commit new file', async () => {
    const git = simpleGit(testRepoPath);
    const testFile = path.join(testRepoPath, 'test.txt');

    await fs.writeFile(testFile, 'test content');
    await git.add('test.txt');
    const result = await git.commit('Add test file');

    expect(result.commit).toBeDefined();
  });
});
```

---

## 7. Integration Testing Examples

### Repository State Testing

```javascript
describe('Repository state management', () => {
  let git;

  beforeEach(async () => {
    git = simpleGit(testRepoPath);
    await git.raw('reset', '--hard', 'HEAD~1'); // Reset to previous commit
  });

  test('should detect uncommitted changes', async () => {
    const testFile = path.join(testRepoPath, 'new-file.txt');
    await fs.writeFile(testFile, 'uncommitted changes');

    const status = await git.status();
    expect(status.modified).toContain('new-file.txt');
  });

  test('should commit changes', async () => {
    const testFile = path.join(testRepoPath, 'feature.txt');
    await fs.writeFile(testFile, 'feature implementation');

    await git.add('feature.txt');
    const result = await git.commit('Add feature');

    expect(result.commit).toMatch(/[a-f0-9]{40}/);
  });
});
```

### Branch Testing

```javascript
describe('Branch operations', () => {
  let git;

  beforeEach(async () => {
    git = simpleGit(testRepoPath);
    await git.raw('checkout', '-b', 'test-branch');
  });

  test('should create and switch branches', async () => {
    const branches = await git.branch();
    expect(branches.current).toBe('test-branch');

    await git.checkout('main');
    const mainBranches = await git.branch();
    expect(mainBranches.current).toBe('main');
  });

  test('should merge branches', async () => {
    // Create file on test branch
    const testFile = path.join(testRepoPath, 'branch-file.txt');
    await fs.writeFile(testFile, 'branch content');
    await git.add('branch-file.txt');
    await git.commit('Add branch file');

    // Switch to main and merge
    await git.checkout('main');
    await git.merge(['test-branch']);

    const status = await git.status();
    expect(status.modified).not.toContain('branch-file.txt');
  });
});
```

---

## 8. Best Practices for Mocking Git Operations

### Mock Library Options

1. **mock-require**: For Node.js environment
2. **jest.mock**: With Jest testing framework
3. **sinon**: For general purpose mocking

### Mock Implementation Example

```javascript
const simpleGit = require('simple-git');
const { GitError } = require('simple-git/dist/cjs/errors');

const createGitMock = (options = {}) => {
  const mock = {
    status: jest.fn(),
    add: jest.fn(),
    commit: jest.fn(),
    log: jest.fn(),
    checkout: jest.fn(),
    branch: jest.fn(),
    raw: jest.fn(),
    revparse: jest.fn(),
  };

  // Configure default responses
  mock.status.mockResolvedValue({
    isClean: jest.fn().mockReturnValue(options.isClean ?? true),
    files: options.files ?? [],
    modified: options.modified ?? [],
    staged: options.staged ?? [],
  });

  mock.commit.mockResolvedValue({
    commit: 'abc123def456',
    author: 'Test Author',
    summary: options.commitMessage ?? 'Test commit',
  });

  if (options.throwError) {
    mock.status.mockRejectedValue(new GitError('Test error'));
  }

  return mock;
};
```

### Mock Usage in Tests

```javascript
describe('Git service', () => {
  let gitService;
  let gitMock;

  beforeEach(() => {
    gitMock = createGitMock({
      isClean: false,
      modified: ['src/app.js'],
      commitMessage: 'Feature implementation',
    });

    mock('simple-git', () => gitMock);
    gitService = require('./git-service');
  });

  test('should handle clean repository', async () => {
    gitMock.status.mockResolvedValue({
      isClean: jest.fn().mockReturnValue(true),
    });

    const canCommit = await gitService.canCommit();
    expect(canCommit).toBe(false);
  });

  test('should handle git errors gracefully', async () => {
    gitMock.status.mockRejectedValue(new GitError('Repository not found'));

    await expect(gitService.getStatus()).rejects.toThrow(
      'Repository not found'
    );
  });
});
```

### Mock Configuration Patterns

```javascript
// Configuration for different test scenarios
const mockScenarios = {
  cleanRepo: {
    status: {
      isClean: () => true,
      files: [],
      modified: [],
      staged: [],
    },
  },

  dirtyRepo: {
    status: {
      isClean: () => false,
      modified: ['src/app.js', 'src/utils.js'],
      staged: ['README.md'],
    },
  },

  gitError: {
    status: jest.fn().mockRejectedValue(new GitError('Permission denied')),
  },
};

// Usage in test
describe.each(Object.entries(mockScenarios))(
  'Git scenarios',
  (name, scenario) => {
    test(`should handle ${name}`, async () => {
      gitMock.status.mockResolvedValue(scenario.status);

      const result = await gitService.handleScenario(name);
      expect(result).toMatchSnapshot();
    });
  }
);
```

### Async Testing Patterns

```javascript
describe('Async git operations', () => {
  test('should retry on conflict', async () => {
    const gitMock = createGitMock();

    // First call fails (conflict), second succeeds
    gitMock.commit
      .mockRejectedValueOnce(new GitError('merge conflict'))
      .mockResolvedValueOnce({ commit: 'def456' });

    await gitService.retryCommit('message', { maxRetries: 2 });

    expect(gitMock.commit).toHaveBeenCalledTimes(2);
  });

  test('should timeout after max retries', async () => {
    gitMock.commit.mockRejectedValue(new GitError('conflict'));

    await expect(
      gitService.retryCommit('message', { maxRetries: 3, delay: 10 })
    ).rejects.toThrow('conflict');

    expect(gitMock.commit).toHaveBeenCalledTimes(3);
  });
});
```

---

## Key Insights

1. **Promise-based API**: Simple-git returns promises, making it ideal for async/await patterns

2. **Comprehensive Status**: The status operation provides detailed information about repository state

3. **Flexible Options**: Most operations accept various options and can handle multiple files at once

4. **Error Handling**: Proper error handling is crucial, especially for network operations and large repositories

5. **Testing Strategy**: Mocking is essential for unit testing, while integration tests verify actual Git operations

6. **Retry Logic**: Implement retry logic for transient failures like merge conflicts

7. **Repository Management**: Always clean up test repositories to avoid interference between tests

---

## Additional Resources

- [Simple-Git API Documentation](https://github.com/steveukx/git-js/blob/main/simple-git/README.md)
- [Git Command Reference](https://git-scm.com/docs)
- [Node.js Testing Patterns](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)
