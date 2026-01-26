# Cache Testing Patterns Research

## Executive Summary

This document captures the testing patterns used in the hacky-hack codebase for testing cache-related functionality.

## Key Test Files

| File                                           | Purpose                          |
| ---------------------------------------------- | -------------------------------- |
| `tests/unit/agents/prp-generator.test.ts`      | PRPGenerator cache functionality |
| `tests/unit/agents/cache-verification.test.ts` | Groundswell agent cache behavior |

## Test File Structure and Conventions

### File Naming

```bash
tests/unit/           # Unit tests
  agents/
    prp-generator.test.ts
    cache-verification.test.ts
  utils/
    cache-manager.test.ts  # To be created
```

### Standard Test Structure

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('CacheManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', () => {
      // Arrange, Act, Assert
    });
  });
});
```

## Mock Patterns for File Operations

### Mocking node:fs/promises

```typescript
// Mock the entire module BEFORE imports
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
}));

// Import and cast mocked functions
import {
  mkdir,
  writeFile,
  readFile,
  stat,
  readdir,
  unlink,
} from 'node:fs/promises';
const mockMkdir = vi.mocked(mkdir);
const mockWriteFile = vi.mocked(writeFile);
const mockReadFile = vi.mocked(readFile);
const mockStat = vi.mocked(stat);
const mockReaddir = vi.mocked(readdir);
const mockUnlink = vi.mocked(unlink);
```

### Mock Setup in beforeEach

```typescript
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Setup default mock behaviors
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockStat.mockResolvedValue({
    mtimeMs: Date.now(),
    isFile: () => true,
    size: 1024,
  } as any);
  mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
});
```

## Test Fixture Patterns

### Factory Functions for Test Data

```typescript
// Create mock cache metadata
const createMockCacheMetadata = (
  taskId: string,
  age: number
): PRPCacheMetadata => ({
  taskId,
  taskHash: 'abc123',
  createdAt: Date.now() - age,
  accessedAt: Date.now() - age,
  version: '1.0',
  prp: {
    taskId,
    objective: 'Test objective',
    context: 'Test context',
    implementationSteps: [],
    validationGates: [],
    successCriteria: [],
    references: [],
  },
});

// Create mock session manager
const createMockSessionManager = (sessionPath: string): SessionManager =>
  ({
    currentSession: {
      metadata: {
        id: '001_14b9dc2a33c7',
        hash: '14b9dc2a33c7',
        path: sessionPath,
        createdAt: new Date(),
        parentSession: null,
      },
      prdSnapshot: '# PRD',
      taskRegistry: { backlog: [] },
      currentItemId: null,
    },
  }) as SessionManager;
```

## Cache-Specific Testing Patterns

### Cache Hit/Miss Testing

```typescript
describe('Cache Statistics', () => {
  it('should record cache hit', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    mockReadFile.mockResolvedValue(
      JSON.stringify(createMockCacheMetadata('P1.M1.T1.S1', 1000))
    );
    mockStat.mockResolvedValue({
      mtimeMs: Date.now() - 1000,
      isFile: () => true,
    } as any);

    // Act
    await manager.get('P1.M1.T1.S1');

    // Assert
    const stats = manager.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
  });

  it('should record cache miss', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    // Act
    await manager.get('P1.M1.T1.S1');

    // Assert
    const stats = manager.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(1);
  });
});
```

### Cache Expiration Testing

```typescript
describe('Cache Expiration', () => {
  it('should identify expired cache entries', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path', 24 * 60 * 60 * 1000); // 24h TTL
    const expiredMetadata = createMockCacheMetadata(
      'P1.M1.T1.S1',
      25 * 60 * 60 * 1000
    ); // 25h old

    mockReadFile.mockResolvedValue(JSON.stringify(expiredMetadata));
    mockStat.mockResolvedValue({
      mtimeMs: Date.now() - 25 * 60 * 60 * 1000,
      isFile: () => true,
    } as any);

    // Act
    const isRecent = await manager.isCacheRecent('P1.M1.T1.S1');

    // Assert
    expect(isRecent).toBe(false);
  });

  it('should identify valid cache entries', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path', 24 * 60 * 60 * 1000);
    const validMetadata = createMockCacheMetadata('P1.M1.T1.S1', 1000); // 1 second old

    mockReadFile.mockResolvedValue(JSON.stringify(validMetadata));
    mockStat.mockResolvedValue({
      mtimeMs: Date.now() - 1000,
      isFile: () => true,
    } as any);

    // Act
    const isRecent = await manager.isCacheRecent('P1.M1.T1.S1');

    // Assert
    expect(isRecent).toBe(true);
  });
});
```

### Cache Cleanup Testing

```typescript
describe('Cache Cleanup', () => {
  it('should remove expired entries', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    const expiredEntries = [
      { taskId: 'P1.M1.T1.S1', path: '/test/prps/.cache/P1_M1_T1_S1.json' },
      { taskId: 'P1.M1.T1.S2', path: '/test/prps/.cache/P1_M1_T1_S2.json' },
    ];

    mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
    mockUnlink.mockResolvedValue(undefined);

    // Act
    await manager.cleanExpired();

    // Assert
    expect(mockUnlink).toHaveBeenCalledTimes(2);
    expect(mockUnlink).toHaveBeenCalledWith(
      '/test/prps/.cache/P1_M1_T1_S1.json'
    );
    expect(mockUnlink).toHaveBeenCalledWith(
      '/test/prps/.cache/P1_M1_T1_S2.json'
    );
  });

  it('should handle unlink errors gracefully', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json']);
    mockUnlink.mockRejectedValue(new Error('EACCES: permission denied'));

    // Act & Assert - should not throw
    await expect(manager.cleanExpired()).resolves.not.toThrow();

    // Should log error but continue
    expect(mockUnlink).toHaveBeenCalledTimes(1);
  });
});
```

### Cache Clear Testing

```typescript
describe('Cache Clear', () => {
  it('should remove all cache entries', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    mockReaddir.mockResolvedValue([
      'P1_M1_T1_S1.json',
      'P1_M1_T1_S2.json',
      'P1_M1_T1_S3.json',
    ]);
    mockUnlink.mockResolvedValue(undefined);

    // Act
    await manager.clear();

    // Assert
    expect(mockUnlink).toHaveBeenCalledTimes(3);
  });

  it('should reset statistics after clear', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    mockReaddir.mockResolvedValue([]);
    mockUnlink.mockResolvedValue(undefined);

    // Set some stats
    manager.recordHit();
    manager.recordHit();
    manager.recordMiss();

    // Act
    await manager.clear();

    // Assert
    const stats = manager.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});
```

## Logger Mocking Pattern

```typescript
// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    child: vi.fn(function (this: any) {
      return this;
    }),
  })),
}));

// Use in tests
import { getLogger } from '../../src/utils/logger.js';
const logger = getLogger('CacheManager');
const infoSpy = vi.spyOn(logger, 'info');

// Verify logging
expect(infoSpy).toHaveBeenCalledWith(
  expect.objectContaining({
    taskId: 'P1.M1.T1.S1',
  }),
  'Cache HIT'
);
```

## Error Handling Tests

```typescript
describe('Error Handling', () => {
  it('should handle ENOENT errors gracefully', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    const enoentError: NodeJS.ErrnoException = new Error('File not found');
    enoentError.code = 'ENOENT';
    mockReadFile.mockRejectedValue(enoentError);

    // Act & Assert
    const result = await manager.get('P1.M1.T1.S1');
    expect(result).toBeNull();
  });

  it('should handle EACCES errors gracefully', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    const eaccesError: NodeJS.ErrnoException = new Error('Permission denied');
    eaccesError.code = 'EACCES';
    mockUnlink.mockRejectedValue(eaccesError);

    // Act & Assert - should log and continue
    await expect(manager.cleanExpired()).resolves.not.toThrow();
  });

  it('should throw on unexpected errors', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    mockStat.mockRejectedValue(new Error('Unexpected error'));

    // Act & Assert
    await expect(manager.isCacheRecent('P1.M1.T1.S1')).rejects.toThrow(
      'Unexpected error'
    );
  });
});
```

## Integration Testing Patterns

```typescript
describe('Integration: Complete Cache Lifecycle', () => {
  it('should track complete cache lifecycle', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    const taskData = { title: 'Test Task', description: 'Test' };

    // Initial state
    expect(manager.getStats().hits).toBe(0);
    expect(manager.getStats().misses).toBe(0);

    // Cache miss
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    await manager.get('P1.M1.T1.S1');
    expect(manager.getStats().misses).toBe(1);

    // Cache hit
    mockReadFile.mockResolvedValue(
      JSON.stringify(createMockCacheMetadata('P1.M1.T1.S1', 1000))
    );
    mockStat.mockResolvedValue({
      mtimeMs: Date.now() - 1000,
      isFile: () => true,
    } as any);
    await manager.get('P1.M1.T1.S1');
    expect(manager.getStats().hits).toBe(1);

    // Hit ratio
    const stats = manager.getStats();
    expect(stats.hitRatio).toBe(50); // 1 hit out of 2 total requests
  });
});
```

## Performance Testing Patterns

```typescript
describe('Performance', () => {
  it('should complete cleanup quickly for large cache', async () => {
    // Arrange
    const manager = new CacheManager('/test/session/path');
    const largeCache = Array.from(
      { length: 1000 },
      (_, i) => `P1_M1_T1_S${i}.json`
    );
    mockReaddir.mockResolvedValue(largeCache);
    mockUnlink.mockResolvedValue(undefined);

    // Act
    const startTime = performance.now();
    await manager.clear();
    const duration = performance.now() - startTime;

    // Assert
    expect(duration).toBeLessThan(1000); // Should complete in < 1 second
  });
});
```

## Best Practices Summary

1. **Mock all external dependencies** - Use `vi.mock()` before imports
2. **Reset mocks between tests** - Use `vi.clearAllMocks()` in `afterEach`
3. **Test both happy path and error cases** - Include ENOENT, EACCES, etc.
4. **Use factory functions** - Create test data with factory functions
5. **Verify logging** - Spy on logger methods
6. **Test timing-sensitive operations** - Use `performance.now()`
7. **Follow Arrange-Act-Assert** - Clearly separate test phases
8. **Test edge cases** - Empty cache, large cache, corrupted data
9. **Verify error types and codes** - Ensure proper error handling
10. **Test atomic operations** - Verify rollback on failure
