/**
 * Unit tests for Module Resolution Verifier
 *
 * @remarks
 * Tests validate module-not-found verification functionality including:
 * 1. Early return when hasErrors is false (S1 had success: true)
 * 2. Returning resolved: false when module-not-found > 0
 * 3. File sampling verification path
 * 4. Import statement checking with regex patterns
 * 5. Message generation for different scenarios
 * 6. Edge cases (empty files, no imports, read errors)
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// MOCK SETUP
// ============================================================================

// Mock node:fs for file reading
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

// Import mocked modules
import { readFileSync } from 'node:fs';
import {
  verifyNoModuleErrors,
  type ModuleErrorVerifyResult,
} from '../../../src/utils/module-resolution-verifier.js';
import type {
  ErrorAnalysisResult,
  ErrorCategories,
} from '../../../src/utils/typescript-error-analyzer.js';

// =============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Creates a mock ErrorAnalysisResult for testing
 */
function createMockErrorAnalysis(
  options: {
    hasErrors?: boolean;
    moduleNotFoundCount?: number;
    files?: string[];
    typeMismatchCount?: number;
    otherCount?: number;
  } = {}
): ErrorAnalysisResult {
  const {
    hasErrors = true,
    moduleNotFoundCount = 0,
    files = [],
    typeMismatchCount = 0,
    otherCount = 0,
  } = options;

  const categories: ErrorCategories = {
    'module-not-found': moduleNotFoundCount,
    'type-mismatch': typeMismatchCount,
    other: otherCount,
  };

  return {
    hasErrors,
    categories,
    files,
    errorsByFile: {},
    summary: {
      total: moduleNotFoundCount + typeMismatchCount + otherCount,
      fileCount: files.length,
      mostCommonCode: moduleNotFoundCount > 0 ? 'TS2307' : null,
      fileWithMostErrors: files.length > 0 ? files[0] : null,
    },
  };
}

// =============================================================================
// TEST SUITE
// ============================================================================

describe('module-resolution-verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Happy path tests
  // ========================================================================

  describe('Successful verification - early return path', () => {
    it('should return resolved: true when hasErrors is false', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: false,
        files: [],
      });

      const result = verifyNoModuleErrors(analysis);

      expect(result.resolved).toBe(true);
      expect(result.remainingCount).toBe(0);
      expect(result.verifiedFiles).toEqual([]);
      expect(result.importCount).toBe(0);
      expect(result.message).toContain('No TypeScript errors found');
    });

    it('should skip file reading when hasErrors is false', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: false,
        files: [],
      });

      verifyNoModuleErrors(analysis);

      // readFileSync should not be called
      expect(readFileSync).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Module errors present tests
  // ========================================================================

  describe('Module-not-found errors present', () => {
    it('should return resolved: false when module-not-found count > 0', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 3,
        files: ['src/index.ts', 'src/utils/test.ts'],
      });

      const result = verifyNoModuleErrors(analysis);

      expect(result.resolved).toBe(false);
      expect(result.remainingCount).toBe(3);
      expect(result.verifiedFiles).toEqual([]);
      expect(result.importCount).toBe(0);
      expect(result.message).toContain('Found 3 module-not-found error(s)');
    });

    it('should return remainingCount equal to module-not-found error count', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 7,
        files: ['src/a.ts'],
      });

      const result = verifyNoModuleErrors(analysis);

      expect(result.remainingCount).toBe(7);
    });

    it('should skip file sampling when module errors exist', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 1,
        files: ['src/index.ts'],
      });

      verifyNoModuleErrors(analysis);

      // readFileSync should not be called when module errors exist
      expect(readFileSync).not.toHaveBeenCalled();
    });

    it('should return milestone incomplete message when module errors exist', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 5,
        files: [],
      });

      const result = verifyNoModuleErrors(analysis);

      expect(result.message).toContain('milestone incomplete');
    });
  });

  // ========================================================================
  // File sampling verification tests
  // ========================================================================

  describe('File sampling verification', () => {
    it('should sample critical files when module-not-found count is 0', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        typeMismatchCount: 2,
        files: [
          'src/workflows/prp-pipeline.ts',
          'src/agents/agent-factory.ts',
          'src/index.ts',
        ],
      });

      // Mock successful file reading with Groundswell imports
      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow, Step } from 'groundswell';
        import { readFile } from 'node:fs/promises';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.verifiedFiles.length).toBeGreaterThan(0);
      expect(readFileSync).toHaveBeenCalled();
    });

    it('should detect Groundswell imports in sampled files', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/workflows/prp-pipeline.ts'],
      });

      // Mock file with Groundswell imports
      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow, Step } from 'groundswell';
        import { readFile } from 'node:fs/promises';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(1);
      expect(result.resolved).toBe(true);
    });

    it('should return resolved: true when imports are found', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/agents/agent-factory.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { createAgent, type Agent } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.resolved).toBe(true);
    });

    it('should return resolved: false when no imports found in sampled files', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/utils/test.ts'],
      });

      // Mock file without Groundswell imports
      vi.mocked(readFileSync).mockReturnValue(`
        import { readFile } from 'node:fs/promises';
        export function test() { return 'hello'; }
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.resolved).toBe(false);
      expect(result.importCount).toBe(0);
    });

    it('should count multiple files with imports', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: [
          'src/workflows/prp-pipeline.ts',
          'src/agents/agent-factory.ts',
          'src/index.ts',
        ],
      });

      // Mock all files with imports
      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(3);
      expect(result.resolved).toBe(true);
    });
  });

  // ========================================================================
  // Import statement pattern tests
  // ========================================================================

  describe('Import statement pattern matching', () => {
    it('should detect regular named imports from groundswell', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow, Step } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(1);
    });

    it('should detect type-only imports from groundswell', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import type { Agent } from 'groundswell/types';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(1);
    });

    it('should detect namespace imports from groundswell', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import * as groundswell from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(1);
    });

    it('should detect submodule imports from groundswell/types', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { MCPHandler } from 'groundswell/tools';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(1);
    });

    it('should not detect non-groundswell imports', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { readFile } from 'node:fs/promises';
        import express from 'express';
        import { lodash } from 'lodash';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(0);
      expect(result.resolved).toBe(false);
    });
  });

  // ========================================================================
  // Message generation tests
  // ========================================================================

  describe('Message generation', () => {
    it('should generate success message with import counts', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/workflows/prp-pipeline.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.message).toContain('No module-not-found errors found');
      expect(result.message).toContain('Verified 1/1');
      expect(result.message).toContain(
        'critical files have Groundswell imports'
      );
    });

    it('should generate failure message when no imports found', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/utils/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { readFile } from 'node:fs/promises';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.message).toContain('No module-not-found errors found');
      expect(result.message).toContain(
        'but could not verify Groundswell imports'
      );
    });

    it('should generate message for multiple sampled files', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { X } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.message).toMatch(/\d+\/\d+/); // Should contain count pattern
    });
  });

  // ========================================================================
  // Edge case tests
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle empty files list gracefully', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: [],
      });

      const result = verifyNoModuleErrors(analysis);

      expect(result.verifiedFiles).toEqual([]);
      expect(result.importCount).toBe(0);
      expect(result.resolved).toBe(false);
    });

    it('should handle file read errors gracefully', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/nonexistent.ts'],
      });

      // Mock readFileSync to throw an error
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file');
      });

      const result = verifyNoModuleErrors(analysis);

      // Should not throw, should return gracefully
      expect(result.importCount).toBe(0);
      expect(result.resolved).toBe(false);
    });

    it('should handle mixed import patterns in same file', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow, Step } from 'groundswell';
        import type { Agent } from 'groundswell/types';
        import { readFile } from 'node:fs/promises';
        import * as gs from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.importCount).toBe(1); // Still counts as 1 file
      expect(result.resolved).toBe(true);
    });

    it('should handle zero module errors with no type mismatches', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        typeMismatchCount: 0,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.resolved).toBe(true);
    });

    it('should prioritize critical files when available', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: [
          'src/workflows/prp-pipeline.ts',
          'src/agents/agent-factory.ts',
          'src/utils/helper.ts',
        ],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { X } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      // Should include critical files
      expect(result.verifiedFiles).toContain('src/workflows/prp-pipeline.ts');
      expect(result.verifiedFiles).toContain('src/agents/agent-factory.ts');
    });

    it('should limit sampled files to 5 maximum', () => {
      const manyFiles = [
        'src/workflows/prp-pipeline.ts',
        'src/agents/agent-factory.ts',
        'src/index.ts',
        'src/agents/prp-runtime.ts',
        'src/core/session-manager.ts',
        'src/utils/extra.ts',
        'src/utils/another.ts',
      ];

      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: manyFiles,
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { X } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      // Should sample at most 5 files (critical ones)
      expect(result.verifiedFiles.length).toBeLessThanOrEqual(5);
    });

    it('should sample first 3 files when no critical files found', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        files: [
          'src/utils/a.ts',
          'src/utils/b.ts',
          'src/utils/c.ts',
          'src/utils/d.ts',
          'src/utils/e.ts',
        ],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { readFile } from 'node:fs/promises';
      `);

      const result = verifyNoModuleErrors(analysis);

      // Should sample first 3 files
      expect(result.verifiedFiles.length).toBe(3);
      expect(result.verifiedFiles[0]).toBe('src/utils/a.ts');
    });
  });

  // ========================================================================
  // Integration tests
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should complete happy path with no errors', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: false,
        files: [],
      });

      const result = verifyNoModuleErrors(analysis);

      expect(result.resolved).toBe(true);
      expect(result.remainingCount).toBe(0);
      expect(result.verifiedFiles).toEqual([]);
      expect(result.importCount).toBe(0);
    });

    it('should handle type mismatches without module errors', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        typeMismatchCount: 5,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { Workflow } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      // Should still verify imports (module resolution is working)
      expect(result.resolved).toBe(true);
      expect(result.remainingCount).toBe(0);
    });

    it('should handle other error types without module errors', () => {
      const analysis = createMockErrorAnalysis({
        hasErrors: true,
        moduleNotFoundCount: 0,
        otherCount: 10,
        files: ['src/test.ts'],
      });

      vi.mocked(readFileSync).mockReturnValue(`
        import { X } from 'groundswell';
      `);

      const result = verifyNoModuleErrors(analysis);

      expect(result.resolved).toBe(true);
      expect(result.remainingCount).toBe(0);
    });
  });
});
