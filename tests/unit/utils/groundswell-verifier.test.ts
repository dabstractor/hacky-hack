/**
 * Unit tests for Groundswell Verifier
 *
 * @remarks
 * Tests validate Groundswell verification functionality including:
 * 1. Directory existence checking at ~/projects/groundswell
 * 2. Tilde expansion to home directory
 * 3. Required files validation (package.json, entry points)
 * 4. Structured result with actionable error messages
 * 5. Integration with npm link workflow
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  verifyGroundswellExists,
  type GroundswellVerifyResult,
} from '../../../src/utils/groundswell-verifier.js';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock node:os module
vi.mock('node:os', () => ({
  homedir: vi.fn(),
}));

// Mock node:fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// Import mocked modules
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('verifyGroundswellExists', () => {
  const mockHomeDir = '/home/testuser';
  const expectedGroundswellPath = '/home/testuser/projects/groundswell';

  beforeEach(() => {
    // Reset mocks before each test
    vi.mocked(homedir).mockReturnValue(mockHomeDir);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Directory existence validation tests
  // ========================================================================

  describe('Directory existence validation', () => {
    it('should return exists: false when directory not found', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(false);
      expect(result.path).toBe(expectedGroundswellPath);
      expect(result.missingFiles).toHaveLength(0);
      expect(result.message).toContain('not found');
      expect(result.message).toContain(expectedGroundswellPath);
    });

    it('should return exists: true when directory exists', () => {
      // Directory exists, package.json exists, entry point exists
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.path).toBe(expectedGroundswellPath);
      expect(result.missingFiles).toHaveLength(0);
    });

    it('should check directory existence first before checking files', () => {
      // Directory does not exist - should not check for files
      vi.mocked(existsSync).mockReturnValue(false);

      const result = verifyGroundswellExists();

      // existsSync should only be called once (for directory check)
      expect(existsSync).toHaveBeenCalledTimes(1);
      expect(existsSync).toHaveBeenCalledWith(expectedGroundswellPath);
      expect(result.exists).toBe(false);
    });
  });

  // ========================================================================
  // Tilde expansion tests
  // ========================================================================

  describe('Tilde expansion', () => {
    it('should expand ~ to home directory in returned path', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = verifyGroundswellExists();

      expect(result.path).toBe(expectedGroundswellPath);
      expect(result.path).not.toContain('~');
      expect(result.path).toContain(mockHomeDir);
    });

    it('should call homedir() to resolve home directory', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      verifyGroundswellExists();

      expect(homedir).toHaveBeenCalledTimes(1);
    });

    it('should return correct path with custom home directory', () => {
      const customHomeDir = '/custom/home/path';
      const expectedPath = '/custom/home/path/projects/groundswell';

      vi.mocked(homedir).mockReturnValue(customHomeDir);
      vi.mocked(existsSync).mockReturnValue(false);

      const result = verifyGroundswellExists();

      expect(result.path).toBe(expectedPath);
      expect(result.path).toContain(customHomeDir);
    });
  });

  // ========================================================================
  // Required files validation tests
  // ========================================================================

  describe('Required files validation', () => {
    it('should return exists: true with no missing files when all present', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.missingFiles).toHaveLength(0);
      expect(result.message).toContain('verified');
    });

    it('should return missing package.json when directory exists but package.json missing', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        // package.json does not exist
        if (path === `${expectedGroundswellPath}/package.json`) return false;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.missingFiles).toContain('package.json');
      expect(result.message).toContain('missing');
      expect(result.message).toContain('package.json');
    });

    it('should return missing entry point when no entry point files exist', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        // No entry point files exist
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.missingFiles).toContain(
        'entry point (dist/index.js, index.js, or src/index.ts)'
      );
      expect(result.message).toContain('missing');
    });

    it('should return missing both package.json and entry point when both missing', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        // Neither package.json nor entry points exist
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.missingFiles).toContain('package.json');
      expect(result.missingFiles).toContain(
        'entry point (dist/index.js, index.js, or src/index.ts)'
      );
      expect(result.missingFiles).toHaveLength(2);
    });

    it('should accept index.js as valid entry point', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/index.js`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.missingFiles).toHaveLength(0);
    });

    it('should accept src/index.ts as valid entry point', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/src/index.ts`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.missingFiles).toHaveLength(0);
    });

    it('should accept dist/index.js as valid entry point', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.exists).toBe(true);
      expect(result.missingFiles).toHaveLength(0);
    });
  });

  // ========================================================================
  // Result structure tests
  // ========================================================================

  describe('GroundswellVerifyResult structure', () => {
    it('should return complete GroundswellVerifyResult object', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result: GroundswellVerifyResult = verifyGroundswellExists();

      // Check result structure
      expect(result).toHaveProperty('exists');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('missingFiles');
      expect(result).toHaveProperty('message');

      // Check types
      expect(typeof result.exists).toBe('boolean');
      expect(typeof result.path).toBe('string');
      expect(Array.isArray(result.missingFiles)).toBe(true);
      expect(typeof result.message).toBe('string');
    });

    it('should return readonly missingFiles array', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      // missingFiles should be readonly (as const in interface)
      expect(result.missingFiles).toEqual([]);
    });

    it('should include absolute path in result', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = verifyGroundswellExists();

      expect(result.path).toBe(expectedGroundswellPath);
      expect(result.path).toMatch(/^\/.+/); // Absolute path starts with /
    });

    it('should provide descriptive message for successful verification', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.message).toContain('verified');
      expect(result.message).toContain(expectedGroundswellPath);
    });

    it('should provide descriptive message for missing directory', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = verifyGroundswellExists();

      expect(result.message).toContain('not found');
      expect(result.message).toContain(expectedGroundswellPath);
    });

    it('should provide descriptive message for missing files', () => {
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        // Entry points missing
        return false;
      });

      const result = verifyGroundswellExists();

      expect(result.message).toContain('missing');
      expect(result.message).toContain('entry point');
    });
  });

  // ========================================================================
  // Integration tests
  // ========================================================================

  describe('Integration tests', () => {
    it('should support conditional flow for npm link decision', () => {
      // Case 1: Directory doesn't exist
      vi.mocked(existsSync).mockReturnValue(false);
      let result = verifyGroundswellExists();
      let shouldProceed = result.exists && result.missingFiles.length === 0;
      expect(shouldProceed).toBe(false);

      // Case 2: Directory exists but incomplete
      vi.clearAllMocks();
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        return false;
      });
      result = verifyGroundswellExists();
      shouldProceed = result.exists && result.missingFiles.length === 0;
      expect(shouldProceed).toBe(false);

      // Case 3: Directory exists and complete
      vi.clearAllMocks();
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });
      result = verifyGroundswellExists();
      shouldProceed = result.exists && result.missingFiles.length === 0;
      expect(shouldProceed).toBe(true);
    });

    it('should handle all three entry point options', () => {
      // Test dist/index.js
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/dist/index.js`) return true;
        return false;
      });

      let result = verifyGroundswellExists();
      expect(result.missingFiles).toHaveLength(0);

      // Test index.js
      vi.clearAllMocks();
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/index.js`) return true;
        return false;
      });

      result = verifyGroundswellExists();
      expect(result.missingFiles).toHaveLength(0);

      // Test src/index.ts
      vi.clearAllMocks();
      vi.mocked(existsSync).mockImplementation(path => {
        if (path === expectedGroundswellPath) return true;
        if (path === `${expectedGroundswellPath}/package.json`) return true;
        if (path === `${expectedGroundswellPath}/src/index.ts`) return true;
        return false;
      });

      result = verifyGroundswellExists();
      expect(result.missingFiles).toHaveLength(0);
    });
  });
});
