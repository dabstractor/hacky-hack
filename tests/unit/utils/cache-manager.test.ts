/**
 * Unit tests for CacheManager class
 *
 * @remarks
 * Tests validate CacheManager class from src/utils/cache-manager.ts with comprehensive
 * coverage of statistics, cleanup, and error handling scenarios.
 *
 * Mocks are used for all external dependencies - no real I/O operations are performed.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CacheManager,
  type CacheStatistics,
  type CleanupResult,
} from '@/utils/cache-manager.js';

// Mock the node:fs module (since cache-manager imports promises as fs)
vi.mock('node:fs', () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn(),
    stat: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
  },
}));

// Import mocked modules
import { promises as fs } from 'node:fs';

// Cast mocked functions
const mockReaddir = fs.readdir as any;
const mockReadFile = fs.readFile as any;
const mockStat = fs.stat as any;
const mockRename = fs.rename as any;
const mockUnlink = fs.unlink as any;

// Factory functions for test data
const createMockCacheMetadata = (taskId: string, age: number) => ({
  taskId,
  taskHash: 'abc123',
  createdAt: Date.now() - age,
  accessedAt: Date.now() - age,
  version: '1.0',
  prp: {
    taskId,
    objective: 'Test objective',
    context: 'Test context',
    implementationSteps: ['Step 1'],
    validationGates: [],
    successCriteria: [],
    references: [],
  },
});

const createMockStat = (size: number) => ({
  size,
  mtimeMs: Date.now(),
  isFile: () => true,
});

describe('utils/cache-manager', () => {
  const sessionPath = '/tmp/test-session';
  const cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours
  let manager: CacheManager;

  beforeEach(() => {
    manager = new CacheManager(sessionPath, cacheTtlMs);

    // Default: no cache files
    mockReaddir.mockResolvedValue([]);

    // Default: file doesn't exist for stat
    mockStat.mockRejectedValue(new Error('ENOENT'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create CacheManager with session path and TTL', () => {
      // EXECUTE
      const manager = new CacheManager(sessionPath, cacheTtlMs);

      // VERIFY: Manager is created
      expect(manager).toBeInstanceOf(CacheManager);
    });

    it('should use default TTL when not provided', () => {
      // EXECUTE
      const manager = new CacheManager(sessionPath);

      // VERIFY: Manager is created with default TTL
      expect(manager).toBeInstanceOf(CacheManager);
    });
  });

  describe('getStats()', () => {
    it('should return empty statistics when no cache entries exist', async () => {
      // SETUP
      mockReaddir.mockResolvedValue([]);

      // EXECUTE
      const stats = await manager.getStats();

      // VERIFY: Empty statistics
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalBytes).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.cacheId).toBe(sessionPath);
    });

    it('should return statistics for valid cache entries', async () => {
      // SETUP
      const mockMetadata1 = createMockCacheMetadata('P1.M1.T1.S1', 1000);
      const mockMetadata2 = createMockCacheMetadata('P1.M1.T1.S2', 2000);

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
      mockReadFile.mockImplementation((path: string) => {
        if (path.includes('P1_M1_T1_S1')) {
          return Promise.resolve(JSON.stringify(mockMetadata1));
        }
        if (path.includes('P1_M1_T1_S2')) {
          return Promise.resolve(JSON.stringify(mockMetadata2));
        }
        return Promise.reject(new Error('File not found'));
      });
      mockStat.mockImplementation((path: string) => {
        if (path.includes('P1_M1_T1_S1')) {
          return Promise.resolve(createMockStat(1024));
        }
        if (path.includes('P1_M1_T1_S2')) {
          return Promise.resolve(createMockStat(2048));
        }
        return Promise.reject(new Error('File not found'));
      });

      // EXECUTE
      const stats = await manager.getStats();

      // VERIFY: Statistics calculated correctly
      expect(stats.totalEntries).toBe(2);
      expect(stats.totalBytes).toBe(3072); // 1024 + 2048
      expect(stats.expiredEntries).toBe(0); // Both are recent
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
    });

    it('should count expired entries correctly', async () => {
      // SETUP
      const now = Date.now();
      const expiredMetadata = createMockCacheMetadata(
        'P1.M1.T1.S1',
        cacheTtlMs + 1000
      ); // Older than TTL
      const validMetadata = createMockCacheMetadata('P1.M1.T1.S2', 1000); // Recent

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(expiredMetadata))
        .mockResolvedValueOnce(JSON.stringify(validMetadata));
      mockStat
        .mockResolvedValueOnce(createMockStat(1024))
        .mockResolvedValueOnce(createMockStat(2048));

      // EXECUTE
      const stats = await manager.getStats();

      // VERIFY: Expired entry counted
      expect(stats.totalEntries).toBe(2);
      expect(stats.expiredEntries).toBe(1);
    });

    it('should handle cache directory not existing gracefully', async () => {
      // SETUP
      mockReaddir.mockRejectedValue({ code: 'ENOENT' });

      // EXECUTE
      const stats = await manager.getStats();

      // VERIFY: Empty statistics returned
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalBytes).toBe(0);
    });

    it('should handle individual file read errors gracefully', async () => {
      // SETUP
      const validMetadata = createMockCacheMetadata('P1.M1.T1.S2', 1000);

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
      mockReadFile
        .mockRejectedValueOnce(new Error('Read error'))
        .mockResolvedValueOnce(JSON.stringify(validMetadata));
      mockStat.mockResolvedValue(createMockStat(1024));

      // EXECUTE
      const stats = await manager.getStats();

      // VERIFY: Only valid entry counted
      expect(stats.totalEntries).toBe(1);
    });
  });

  describe('cleanExpired()', () => {
    it('should remove expired entries and return cleanup result', async () => {
      // SETUP
      const now = Date.now();
      const expiredMetadata = createMockCacheMetadata(
        'P1.M1.T1.S1',
        cacheTtlMs + 1000
      );

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json']);
      mockReadFile.mockResolvedValue(JSON.stringify(expiredMetadata));
      mockStat.mockResolvedValue(createMockStat(1024));
      mockRename.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      // EXECUTE
      const result = await manager.cleanExpired();

      // VERIFY: Cleanup result
      expect(result.removed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.reason).toBe('expired');
      expect(result.removedEntries).toContain('P1.M1.T1.S1');
      expect(result.duration).toBeGreaterThanOrEqual(0);

      // VERIFY: Atomic rename-then-unlink pattern was used
      expect(mockRename).toHaveBeenCalledTimes(1);
      expect(mockUnlink).toHaveBeenCalledTimes(1);
    });

    it('should return empty result when no expired entries exist', async () => {
      // SETUP
      const validMetadata = createMockCacheMetadata('P1.M1.T1.S1', 1000);

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json']);
      mockReadFile.mockResolvedValue(JSON.stringify(validMetadata));
      mockStat.mockResolvedValue(createMockStat(1024));

      // EXECUTE
      const result = await manager.cleanExpired();

      // VERIFY: Nothing removed
      expect(result.removed).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockRename).not.toHaveBeenCalled();
    });

    it('should continue on individual file removal failures', async () => {
      // SETUP
      const expiredMetadata1 = createMockCacheMetadata(
        'P1.M1.T1.S1',
        cacheTtlMs + 1000
      );
      const expiredMetadata2 = createMockCacheMetadata(
        'P1.M1.T1.S2',
        cacheTtlMs + 2000
      );

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(expiredMetadata1))
        .mockResolvedValueOnce(JSON.stringify(expiredMetadata2));
      mockStat
        .mockResolvedValueOnce(createMockStat(1024))
        .mockResolvedValueOnce(createMockStat(2048));

      // First removal succeeds, second fails
      mockRename
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Permission denied'));

      // EXECUTE
      const result = await manager.cleanExpired();

      // VERIFY: Partial success
      expect(result.removed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.removedEntries).toContain('P1.M1.T1.S1');
      expect(result.failedEntries).toHaveLength(1);
      expect(result.failedEntries?.[0].taskId).toBe('P1.M1.T1.S2');
    });
  });

  describe('clear()', () => {
    it('should remove all cache entries and return cleanup result', async () => {
      // SETUP
      const metadata1 = createMockCacheMetadata('P1.M1.T1.S1', 1000);
      const metadata2 = createMockCacheMetadata('P1.M1.T1.S2', 2000);

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(metadata1))
        .mockResolvedValueOnce(JSON.stringify(metadata2));
      mockStat
        .mockResolvedValueOnce(createMockStat(1024))
        .mockResolvedValueOnce(createMockStat(2048));
      mockRename.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      // EXECUTE
      const result = await manager.clear();

      // VERIFY: All entries removed
      expect(result.removed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.reason).toBe('manual');
      expect(result.removedEntries).toContain('P1.M1.T1.S1');
      expect(result.removedEntries).toContain('P1.M1.T1.S2');

      // VERIFY: Atomic rename-then-unlink pattern was used for both
      expect(mockRename).toHaveBeenCalledTimes(2);
      expect(mockUnlink).toHaveBeenCalledTimes(2);
    });

    it('should return empty result when no cache entries exist', async () => {
      // SETUP
      mockReaddir.mockResolvedValue([]);

      // EXECUTE
      const result = await manager.clear();

      // VERIFY: Nothing removed
      expect(result.removed).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockRename).not.toHaveBeenCalled();
    });

    it('should continue on individual file removal failures', async () => {
      // SETUP
      const metadata1 = createMockCacheMetadata('P1.M1.T1.S1', 1000);
      const metadata2 = createMockCacheMetadata('P1.M1.T1.S2', 2000);

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json', 'P1_M1_T1_S2.json']);
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(metadata1))
        .mockResolvedValueOnce(JSON.stringify(metadata2));
      mockStat
        .mockResolvedValueOnce(createMockStat(1024))
        .mockResolvedValueOnce(createMockStat(2048));

      // First removal succeeds, second fails
      mockRename
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Permission denied'));

      // EXECUTE
      const result = await manager.clear();

      // VERIFY: Partial success
      expect(result.removed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.removedEntries).toContain('P1.M1.T1.S1');
      expect(result.failedEntries).toHaveLength(1);
    });
  });

  describe('atomic file operations', () => {
    it('should use atomic rename-then-unlink pattern for removal', async () => {
      // SETUP
      const expiredMetadata = createMockCacheMetadata(
        'P1.M1.T1.S1',
        cacheTtlMs + 1000
      );

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json']);
      mockReadFile.mockResolvedValue(JSON.stringify(expiredMetadata));
      mockStat.mockResolvedValue(createMockStat(1024));
      mockRename.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      // EXECUTE
      await manager.cleanExpired();

      // VERIFY: Rename called with temp path
      expect(mockRename).toHaveBeenCalledWith(
        expect.stringContaining('P1_M1_T1_S1.json'),
        expect.stringMatching(/P1_M1_T1_S1\.json\.tmp$/)
      );

      // VERIFY: Unlink called with temp path
      expect(mockUnlink).toHaveBeenCalledWith(
        expect.stringMatching(/P1_M1_T1_S1\.json\.tmp$/)
      );
    });

    it('should not unlink if rename fails', async () => {
      // SETUP
      const expiredMetadata = createMockCacheMetadata(
        'P1.M1.T1.S1',
        cacheTtlMs + 1000
      );

      mockReaddir.mockResolvedValue(['P1_M1_T1_S1.json']);
      mockReadFile.mockResolvedValue(JSON.stringify(expiredMetadata));
      mockStat.mockResolvedValue(createMockStat(1024));
      mockRename.mockRejectedValue(new Error('Rename failed'));

      // EXECUTE
      const result = await manager.cleanExpired();

      // VERIFY: Entry not removed, unlink not called
      expect(result.removed).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockUnlink).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle cache directory scan errors gracefully', async () => {
      // SETUP
      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      // EXECUTE
      const stats = await manager.getStats();

      // VERIFY: Empty statistics returned
      expect(stats.totalEntries).toBe(0);
    });

    it('should handle non-ENOENT errors during directory scan', async () => {
      // SETUP
      mockReaddir.mockRejectedValue(new Error('EACCES: Permission denied'));

      // EXECUTE
      const stats = await manager.getStats();

      // VERIFY: Empty statistics returned (error logged but not thrown)
      expect(stats.totalEntries).toBe(0);
    });
  });
});
