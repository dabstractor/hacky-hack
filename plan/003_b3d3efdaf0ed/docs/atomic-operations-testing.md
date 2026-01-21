# Atomic File Operation Testing Patterns for Node.js/TypeScript

## 1. Best Practices for Testing Atomic Writes (Temp File + Rename Pattern)

### 1.1 Mocking fs.promises Operations in Vitest

```typescript
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import { writeFile, rename, unlink } from './atomic-operations';

// Mock fs.promises
vi.mock('fs', async importOriginal => {
  const actualFs = await importOriginal<typeof import('fs')>();
  return {
    ...actualFs,
    promises: {
      ...actualFs.promises,
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    },
  };
});

describe('Atomic File Operations', () => {
  const mockWriteFile = vi.spyOn(fs, 'writeFile');
  const mockRename = vi.spyOn(fs, 'rename');
  const mockUnlink = vi.spyOn(fs, 'unlink');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write to temp file and then rename', async () => {
    // Arrange
    const content = 'test content';
    const filePath = '/path/to/file.json';

    // Act
    await writeFile(filePath, content);

    // Assert
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.tmp$/),
      content
    );
    expect(mockRename).toHaveBeenCalled();
  });
});
```

### 1.2 Testing Temp File Creation

```typescript
it('should create temp file before final write', async () => {
  const filePath = '/data/state.json';
  const content = '{"version": 1}';

  // Track call order
  const mockWriteFile = vi.spyOn(fs, 'writeFile');
  const mockRename = vi.spyOn(fs, 'rename');

  // Act
  await writeFile(filePath, content);

  // Verify temp file created first
  expect(mockWriteFile).toHaveBeenCalledBefore(mockRename);
  expect(mockWriteFile.mock.calls[0][0]).toMatch(/\.tmp$/);
  expect(mockRename.mock.calls[0][1]).toMatch(/\.tmp$/);
});
```

### 1.3 Testing Atomic Rename Operation

```typescript
it('should perform atomic rename operation', async () => {
  const filePath = '/data/state.json';
  const tempPath = '/data/state.json.tmp';

  mockRename.mockImplementation((from, to) => {
    // Verify rename is called with temp file as source
    expect(from).toBe(tempPath);
    expect(to).toBe(filePath);
    return Promise.resolve();
  });

  await writeFile(filePath, 'test content');

  // Verify rename operation
  expect(mockRename).toHaveBeenCalledWith(tempPath, filePath);
});
```

### 1.4 Simulating Failure Scenarios

```typescript
describe('Failure Scenarios', () => {
  it('should cleanup temp file if write fails', async () => {
    // Arrange
    mockWriteFile.mockRejectedValue(new Error('ENOSPC: no space left on device'))

    // Act & Assert
    await expect(writeFile('/test.json', 'content')).rejects.toThrow()
    expect(mockUnlink).toHaveBeenCalled()
  })

  it('should cleanup temp file if rename fails', async () => {
    // Arrange
    mockWriteFile.mockResolvedValue()
    mockRename.mockRejectedValue(new Error('EIO: I/O error'))

    // Act & Assert
    await expect(writeFile('/test.json', 'content')).rejects.toThrow('EIO')
    expect(mockUnlink).toHaveBeenCalled()
  })

  it('should not leave temp files on any error', async () => {
    const errorCases = [
      { error: new Error('ENOSPC'), name: 'ENOSPC' },
      { error: new Error('EIO'), name: 'EIO' },
      { error: new Error('EACCES'), name: 'EACCES' }
    ]

    for (const { error, name } of errorCases) {
      mockWriteFile.mockResolvedValueOnce()
      mockRename.mockRejectedValueOnce(error)

      await expect(writeFile('/test.json', 'content')).rejects.toThrow(name)
      expect(mockUnlink).toHaveBeenCalled()
    }
  }
})
```

## 2. Testing Batching Patterns

### 2.1 Verifying Multiple Updates are Batched in Memory

```typescript
import { StateManager } from './state-manager';

describe('Batching Operations', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager('/tmp/test.json');
  });

  it('should batch multiple updates in memory', () => {
    // Act
    stateManager.update('key1', 'value1');
    stateManager.update('key2', 'value2');
    stateManager.update('key3', 'value3');

    // Assert
    expect(stateManager['dirty']).toBe(true);
    expect(Object.keys(stateManager['pendingUpdates']).length).toBe(3);
    expect(stateManager['pendingUpdates']).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    });
  });

  it('should track dirty state', () => {
    expect(stateManager['dirty']).toBe(false);

    stateManager.update('key', 'value');
    expect(stateManager['dirty']).toBe(true);

    stateManager.clearUpdates();
    expect(stateManager['dirty']).toBe(false);
  });
});
```

### 2.2 Testing Single Operation Flush

```typescript
it('should write all changes in single operation', async () => {
  // Arrange
  stateManager.update('key1', 'value1');
  stateManager.update('key2', 'value2');

  const mockWriteFile = vi.spyOn(fs, 'writeFile');

  // Act
  await stateManager.flush();

  // Assert
  expect(mockWriteFile).toHaveBeenCalledTimes(1);
  expect(mockWriteFile).toHaveBeenCalledWith(
    expect.stringMatching(/\.tmp$/),
    expect.stringContaining('"key1":"value1"')
  );
  expect(mockWriteFile).toHaveBeenCalledWith(
    expect.stringMatching(/\.tmp$/),
    expect.stringContaining('"key2":"value2"')
  );
  expect(stateManager['dirty']).toBe(false);
});
```

### 2.3 Verifying Dirty State on Flush Failure

```typescript
it('should preserve dirty state on flush failure', async () => {
  // Arrange
  stateManager.update('key1', 'value1');
  expect(stateManager['dirty']).toBe(true);

  mockWriteFile.mockRejectedValue(new Error('Disk full'));

  // Act & Assert
  await expect(stateManager.flush()).rejects.toThrow('Disk full');
  expect(stateManager['dirty']).toBe(true); // Should remain dirty
  expect(stateManager['pendingUpdates']).toEqual({ key1: 'value1' });
});
```

### 2.4 Mock Strategies for Tracking Pending Updates

```typescript
describe('Tracking Pending Updates', () => {
  it('should track exact pending updates', () => {
    const spy = vi.spyOn(stateManager, 'flush');

    stateManager.update('a', 1);
    stateManager.update('b', 2);
    stateManager.delete('c');

    const flushSpy = vi.fn().mockResolvedValue();
    vi.spyOn(fs, 'writeFile').mockImplementation((path, data) => {
      expect(data).toContain('"a":1');
      expect(data).toContain('"b":2');
      expect(data).not.toContain('"c"');
      return Promise.resolve();
    });

    return stateManager.flush();
  });
});
```

## 3. External Examples and Documentation

### 3.1 GitHub Repositories

- **Vitest Mock Examples**: https://github.com/vitest-dev/vitest/tree/main/examples/mocking
- **Atomic Write Utilities**: https://github.com/iarna/atomic-write
- **State Management Patterns**: https://github.com/pmndrs/zustand/tree/master/tests
- **File System Testing Patterns**: https://github.com/facebook/jest/tree/main/packages/jest-mock

### 3.2 Stack Overflow Questions

- [Testing atomic file operations in Node.js](https://stackoverflow.com/questions/55756972/testing-atomic-file-operations-in-node-js)
- [How to mock fs.readFile in Vitest?](https://stackoverflow.com/questions/68737738/how-to-mock-fs-readfile-in-vitest)
- [Temp file + rename pattern testing](https://stackoverflow.com/questions/68737738/how-to-mock-fs-readfile-in-vitest)

### 3.3 Library Documentation

- **Vitest Mocking Guide**: https://vitest.dev/api/mock.html
- **Node.js File System**: https://nodejs.org/api/fs.html
- **Vitest Cookbook**: https://vitest.dev/guide/extending-matchers.html

### 3.4 Similar Projects Examples

- **Electron State Management**: https://github.com/electron/electron/tree/main/spec-main/api/browser-window
- **VS Code State Storage**: https://github.com/microsoft/vscode/tree/main/src/vs/workbench/services/storage
- **Config Store Patterns**: https://github.com/yeoman/configstore/tree/main/test

## 4. Mock Patterns for File System Failures

### 4.1 Simulating ENOSPC (No Space Left)

```typescript
it('should handle ENOSPC error', async () => {
  const enospcError = new Error('ENOSPC: no space left on device');
  enospcError.code = 'ENOSPC';

  mockWriteFile.mockRejectedValue(enospcError);

  await expect(writeFile('/test.json', 'content')).rejects.toThrow('ENOSPC');
  expect(mockUnlink).toHaveBeenCalled();
});
```

### 4.2 Simulating EIO (I/O Error)

```typescript
it('should handle EIO error during rename', async () => {
  const eioError = new Error('EIO: I/O error');
  eioError.code = 'EIO';

  mockWriteFile.mockResolvedValue();
  mockRename.mockRejectedValue(eioError);

  await expect(writeFile('/test.json', 'content')).rejects.toThrow('EIO');
  expect(mockUnlink).toHaveBeenCalled();
});
```

### 4.3 Simulating EACCES (Permission Denied)

```typescript
it('should handle EACCES error', async () => {
  const eaccessError = new Error('EACCES: permission denied');
  eaccessError.code = 'EACCES';

  mockWriteFile.mockResolvedValue();
  mockRename.mockRejectedValue(eaccessError);

  await expect(writeFile('/test.json', 'content')).rejects.toThrow('EACCES');
  expect(mockUnlink).toHaveBeenCalled();
});
```

### 4.4 Comprehensive Error Testing

```typescript
describe('All Error Codes', () => {
  const errorCodes = [
    { code: 'ENOSPC', name: 'No space left' },
    { code: 'EIO', name: 'I/O error' },
    { code: 'EACCES', name: 'Permission denied' },
    { code: 'EPERM', name: 'Operation not permitted' },
    { code: 'EBUSY', name: 'Resource busy' },
  ];

  errorCodes.forEach(({ code, name }) => {
    it(`should handle ${code} error`, async () => {
      const error = new Error(name);
      error.code = code;

      mockWriteFile.mockResolvedValue();
      mockRename.mockRejectedValue(error);

      await expect(writeFile('/test.json', 'content')).rejects.toThrow(code);
      expect(mockUnlink).toHaveBeenCalled();
    });
  });
});
```

## 5. Common Pitfalls and How to Avoid Them

### 5.1 Common Pitfalls

1. **Not cleaning up temp files** - Always ensure temp files are deleted on failure
2. **Race condition testing** - Don't forget to test concurrent operations
3. **Mock scope issues** - Use `vi.clearAllMocks()` in beforeEach
4. **Missing error codes** - Test all relevant Node.js error codes
5. **Not testing call order** - Use `toHaveBeenCalledBefore()` for critical sequences

### 5.2 Best Practices

```typescript
describe('Best Practices Examples', () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();

    // Reset timers if using setTimeout/setInterval
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
  });

  it('should test concurrent atomic operations', async () => {
    const writeFilePromises = [
      writeFile('/test1.json', 'content1'),
      writeFile('/test2.json', 'content2'),
      writeFile('/test3.json', 'content3'),
    ];

    await Promise.all(writeFilePromises);

    // Verify each operation completed successfully
    expect(mockWriteFile).toHaveBeenCalledTimes(3);
    expect(mockRename).toHaveBeenCalledTimes(3);
  });

  it('should test memory batching with large datasets', () => {
    const iterations = 1000;
    const updates: Record<string, any> = {};

    for (let i = 0; i < iterations; i++) {
      stateManager.update(`key${i}`, `value${i}`);
      updates[`key${i}`] = `value${i}`;
    }

    expect(Object.keys(stateManager['pendingUpdates']).length).toBe(iterations);
    expect(stateManager['pendingUpdates']).toEqual(updates);
  });
});
```

### 5.3 Complete Test Suite Template

```typescript
// atomic-operations.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { AtomicFileOperations } from './atomic-operations';

vi.mock('fs');

describe('AtomicFileOperations', () => {
  let atomicOps: AtomicFileOperations;
  let mockWriteFile: any;
  let mockRename: any;
  let mockUnlink: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteFile = vi.spyOn(fs, 'writeFile');
    mockRename = vi.spyOn(fs, 'rename');
    mockUnlink = vi.spyOn(fs, 'unlink');
    atomicOps = new AtomicFileOperations('/test');
  });

  describe('Atomic Write', () => {
    it('writes content atomically', async () => {
      // ... test implementation
    });

    it('cleans up on error', async () => {
      // ... test implementation
    });
  });

  describe('Batching', () => {
    it('batches operations', async () => {
      // ... test implementation
    });

    it('persists state on failure', async () => {
      // ... test implementation
    });
  });

  describe('Error Handling', () => {
    it('handles all relevant error codes', async () => {
      // ... test implementation
    });
  });
});
```

## 6. Advanced Patterns

### 6.1 Using Mock Implementations

```typescript
describe('Mock Implementations', () => {
  it('should use mock implementations for better control', () => {
    const mockWriteFile = vi.fn();
    const mockRename = vi.fn();
    const mockUnlink = vi.fn();

    vi.spyOn(fs, 'writeFile').mockImplementation(mockWriteFile);
    vi.spyOn(fs, 'rename').mockImplementation(mockRename);
    vi.spyOn(fs, 'unlink').mockImplementation(mockUnlink);

    // Now we can control each mock independently
    mockWriteFile.mockImplementation((path, data) => {
      if (path.includes('.tmp')) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Invalid path'));
    });
  });
});
```

### 6.2 Integration with Test Utilities

```typescript
import { createSnapshot, matchSnapshot } from '@vitest/expect';

describe('Snapshot Testing', () => {
  it('should match expected state snapshot', () => {
    stateManager.update('key1', { nested: { value: 1 } });
    stateManager.update('key2', [1, 2, 3]);

    expect(stateManager['pendingUpdates']).toMatchSnapshot();
  });
});
```

### 6.3 Performance Testing

```typescript
describe('Performance', () => {
  it('should handle large file operations efficiently', async () => {
    const largeData = JSON.stringify(
      Array(10000)
        .fill(0)
        .map((_, i) => ({
          id: i,
          data: 'x'.repeat(100),
        }))
    );

    const startTime = performance.now();

    await writeFile('/large.json', largeData);

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1s
  });
});
```

This comprehensive guide covers all aspects of testing atomic file operations in Node.js/TypeScript using Vitest, including mocking patterns, error handling, batching strategies, and best practices.
