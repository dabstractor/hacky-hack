/**
 * Unit tests for Promise Handling Validator
 *
 * @remarks
 * Tests validate the promise handling validator utility from
 * src/utils/promise-handling-validator.ts with comprehensive coverage.
 * Tests follow the Setup/Execute/Verify pattern.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  verifyPromiseHandling,
  type CatchBlockAnalysis,
  type PromiseHandlingInput,
} from '../../../src/utils/promise-handling-validator.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Read actual research-queue.ts content for integration tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const actualResearchQueuePath = join(
  __dirname,
  '../../../src/core/research-queue.ts'
);
let ACTUAL_RESEARCH_QUEUE_CONTENT = '';

try {
  ACTUAL_RESEARCH_QUEUE_CONTENT = readFileSync(
    actualResearchQueuePath,
    'utf-8'
  );
} catch {
  // File not found - will use mock content
  ACTUAL_RESEARCH_QUEUE_CONTENT = '';
}

// Mock the fs module for testing
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

// Cast mocked functions
const mockExistsSync = existsSync as ReturnType<typeof vi.fn>;
const mockReadFile = readFile as ReturnType<typeof vi.fn>;

// Sample file content matching research-queue.ts
const SAMPLE_RESEARCH_QUEUE_CONTENT = `/**
 * Research Queue for parallel PRP generation
 */

import { PRPGenerator } from '../agents/prp-generator.js';
import { getLogger } from '../utils/logger.js';

export class ResearchQueue {
  readonly #logger: Logger;

  async processNext(backlog: Backlog): Promise<void> {
    const task = this.queue.shift();
    if (!task) {
      return;
    }

    const promise = this.#prpGenerator
      .generate(task, backlog)
      .then(prp => {
        this.results.set(task.id, prp);
        return prp;
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.#logger.warn(
          { taskId: task.id, error: errorMessage },
          'PRP generation failed (non-critical)'
        );
        throw error;
      })
      .finally(() => {
        this.researching.delete(task.id);
        this.processNext(backlog).catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.#logger.error(
            {
              taskId: task.id,
              error: errorMessage,
              ...(error instanceof Error && { stack: error.stack }),
            },
            'Background task failed'
          );
        });
      });

    this.researching.set(task.id, promise);
  }
}
`;

describe('Promise Handling Validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: file exists and returns sample content
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(SAMPLE_RESEARCH_QUEUE_CONTENT);
  });

  describe('verifyPromiseHandling', () => {
    it('should find catch blocks in research-queue.ts', async () => {
      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.catchBlocks).toBeGreaterThanOrEqual(1);
      expect(result.analysis.length).toBe(result.catchBlocks);
    });

    it('should return structured analysis for each catch block', async () => {
      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      result.analysis.forEach((analysis: CatchBlockAnalysis) => {
        expect(analysis).toHaveProperty('lineNumber');
        expect(analysis).toHaveProperty('isValid');
        expect(analysis).toHaveProperty('hasLogging');
        expect(analysis).toHaveProperty('hasErrorPropagation');
        expect(analysis).toHaveProperty('isEmpty');
        expect(analysis).toHaveProperty('context');
        expect(analysis).toHaveProperty('code');
        expect(typeof analysis.lineNumber).toBe('number');
        expect(typeof analysis.isValid).toBe('boolean');
        expect(typeof analysis.hasLogging).toBe('boolean');
        expect(typeof analysis.hasErrorPropagation).toBe('boolean');
        expect(typeof analysis.isEmpty).toBe('boolean');
        expect(typeof analysis.context).toBe('string');
        expect(typeof analysis.code).toBe('string');
      });
    });

    it('should identify logging in catch blocks with logger calls', async () => {
      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      // The sample content has two catch blocks with logging
      const catchBlocksWithLogging = result.analysis.filter(
        (a: CatchBlockAnalysis) => a.hasLogging
      );
      expect(catchBlocksWithLogging.length).toBeGreaterThanOrEqual(1);
    });

    it('should identify error propagation in catch blocks with throw', async () => {
      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      // The first catch block re-throws the error
      const catchBlocksWithPropagation = result.analysis.filter(
        (a: CatchBlockAnalysis) => a.hasErrorPropagation
      );
      expect(catchBlocksWithPropagation.length).toBeGreaterThanOrEqual(1);
    });

    it('should mark empty catch blocks as invalid', async () => {
      // SETUP: Create content with empty catch block
      const contentWithEmptyCatch = `
        const promise = something.catch((error: unknown) => {
        });
      `;
      mockReadFile.mockResolvedValue(contentWithEmptyCatch);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.allHandled).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Empty catch'))).toBe(true);
    });

    it('should mark catch blocks without logging or propagation as invalid', async () => {
      // SETUP: Create content with catch block that has no handling
      const contentWithNoHandling = `
        const promise = something.catch((error: unknown) => {
          const x = 1;
        });
      `;
      mockReadFile.mockResolvedValue(contentWithNoHandling);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.allHandled).toBe(false);
      expect(result.warnings.some(w => w.includes('No error handling'))).toBe(
        true
      );
    });

    it('should mark catch with logging as valid', async () => {
      // SETUP: Create content with catch block that only logs
      const contentWithLogging = `
        const promise = something.catch((error: unknown) => {
          this.#logger.error({ error }, 'Something failed');
        });
      `;
      mockReadFile.mockResolvedValue(contentWithLogging);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].isValid).toBe(true);
      expect(result.analysis[0].hasLogging).toBe(true);
    });

    it('should mark catch with error propagation as valid', async () => {
      // SETUP: Create content with catch block that only throws
      const contentWithPropagation = `
        const promise = something.catch((error: unknown) => {
          throw error;
        });
      `;
      mockReadFile.mockResolvedValue(contentWithPropagation);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].isValid).toBe(true);
      expect(result.analysis[0].hasErrorPropagation).toBe(true);
    });

    it('should detect PRP generation failure context', async () => {
      // SETUP: Create content with PRP generation failure message
      const contentWithPRPContext = `
        .catch((error: unknown) => {
          this.#logger.warn({ taskId: task.id }, 'PRP generation failed');
          throw error;
        })
      `;
      mockReadFile.mockResolvedValue(contentWithPRPContext);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].context).toBe(
        'PRP generation failure handler'
      );
    });

    it('should detect background task context', async () => {
      // SETUP: Create content with background task message
      const contentWithBackgroundContext = `
        .catch((error: unknown) => {
          this.#logger.error({ taskId: task.id }, 'Background task failed');
        })
      `;
      mockReadFile.mockResolvedValue(contentWithBackgroundContext);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].context).toBe(
        'Background task chaining handler'
      );
    });

    it('should return warnings array for invalid catches', async () => {
      // SETUP: Create content with invalid catch block
      const contentWithInvalidCatch = `
        .catch((error: unknown) => {
          // Empty catch with only comment
        })
      `;
      mockReadFile.mockResolvedValue(contentWithInvalidCatch);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should return empty warnings when all catches are valid', async () => {
      // SETUP: Create content with valid catch block
      const contentWithValidCatch = `
        .catch((error: unknown) => {
          this.#logger.error({ error }, 'Failed');
          throw error;
        })
      `;
      mockReadFile.mockResolvedValue(contentWithValidCatch);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.warnings).toEqual([]);
    });

    it('should handle file not found error', async () => {
      // SETUP
      mockExistsSync.mockReturnValue(false);

      // EXECUTE & VERIFY
      await expect(verifyPromiseHandling()).rejects.toThrow('File not found');
    });

    it('should accept optional input parameter from S2', async () => {
      // SETUP
      const input: PromiseHandlingInput = {
        updated: true,
        newCode: SAMPLE_RESEARCH_QUEUE_CONTENT,
      };

      // EXECUTE
      const result = await verifyPromiseHandling(input);

      // VERIFY
      expect(result).toBeDefined();
      expect(result.catchBlocks).toBeGreaterThan(0);
    });

    it('should verify S2 input contains taskId logging', async () => {
      // SETUP: Input without taskId logging
      const input: PromiseHandlingInput = {
        updated: true,
        newCode: `.catch((error: unknown) => {
          this.#logger.error({ error }, 'Failed');
        })`,
      };

      // EXECUTE
      const result = await verifyPromiseHandling(input);

      // VERIFY
      expect(result.warnings.some(w => w.includes('taskId'))).toBe(true);
    });

    it('should verify S2 input contains stack logging', async () => {
      // SETUP: Input without stack logging
      const input: PromiseHandlingInput = {
        updated: true,
        newCode: `.catch((error: unknown) => {
          this.#logger.error({ taskId: 'abc', error }, 'Failed');
        })`,
      };

      // EXECUTE
      const result = await verifyPromiseHandling(input);

      // VERIFY
      expect(result.warnings.some(w => w.includes('stack'))).toBe(true);
    });

    it('should handle empty file (no catch blocks)', async () => {
      // SETUP
      mockReadFile.mockResolvedValue('// Empty file\n');

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.catchBlocks).toBe(0);
      expect(result.allHandled).toBe(true);
      expect(result.analysis).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should use default file path when none provided', async () => {
      // EXECUTE
      await verifyPromiseHandling();

      // VERIFY
      expect(mockReadFile).toHaveBeenCalledWith(
        'src/core/research-queue.ts',
        'utf-8'
      );
    });

    it('should use custom file path when provided', async () => {
      // SETUP
      const customPath = 'src/custom/path.ts';

      // EXECUTE
      await verifyPromiseHandling(undefined, customPath);

      // VERIFY
      expect(mockReadFile).toHaveBeenCalledWith(customPath, 'utf-8');
    });

    it('should handle private logger syntax (#logger)', async () => {
      // SETUP: Content with private logger
      const contentWithPrivateLogger = `
        .catch((error: unknown) => {
          this.#logger.error({ error }, 'Failed');
        })
      `;
      mockReadFile.mockResolvedValue(contentWithPrivateLogger);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].hasLogging).toBe(true);
    });

    it('should handle public logger syntax (logger)', async () => {
      // SETUP: Content with public logger
      const contentWithPublicLogger = `
        .catch((error: unknown) => => {
          this.logger.error({ error }, 'Failed');
        })
      `;
      mockReadFile.mockResolvedValue(contentWithPublicLogger);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].hasLogging).toBe(true);
    });

    it('should handle all three logger levels (error, warn, info)', async () => {
      // SETUP: Content with all logger levels
      const contentWithAllLevels = `
        .catch((error: unknown) => {
          this.#logger.info({ error }, 'Info');
        })
        .catch((error: unknown) => {
          this.#logger.warn({ error }, 'Warn');
        })
        .catch((error: unknown) => {
          this.#logger.error({ error }, 'Error');
        })
      `;
      mockReadFile.mockResolvedValue(contentWithAllLevels);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY: All three should be detected as having logging
      expect(result.analysis.length).toBe(3);
      result.analysis.forEach((analysis: CatchBlockAnalysis) => {
        expect(analysis.hasLogging).toBe(true);
      });
    });

    it('should strip block comments when checking for empty catch', async () => {
      // SETUP: Catch block with only block comments
      const contentWithBlockComments = `
        .catch((error: unknown) => {
          /* This is a comment */
          /* Multi-line comment */
        })
      `;
      mockReadFile.mockResolvedValue(contentWithBlockComments);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].isEmpty).toBe(true);
      expect(result.analysis[0].isValid).toBe(false);
    });

    it('should strip line comments when checking for empty catch', async () => {
      // SETUP: Catch block with only line comments
      const contentWithLineComments = `
        .catch((error: unknown) => {
          // This is a comment
          // Another comment
        })
      `;
      mockReadFile.mockResolvedValue(contentWithLineComments);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].isEmpty).toBe(true);
      expect(result.analysis[0].isValid).toBe(false);
    });

    it('should handle multiline catch blocks', async () => {
      // SETUP: Content with multiline catch block
      const contentWithMultilineCatch = `
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.#logger.error(
            {
              taskId: task.id,
              error: errorMessage,
              ...(error instanceof Error && { stack: error.stack }),
            },
            'Background task failed'
          );
        })
      `;
      mockReadFile.mockResolvedValue(contentWithMultilineCatch);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].isValid).toBe(true);
      expect(result.analysis[0].hasLogging).toBe(true);
      expect(result.analysis[0].code.length).toBeGreaterThan(0);
    });

    it('should include actual code in analysis for debugging', async () => {
      // SETUP
      const testContent = `.catch((error: unknown) => {
        this.#logger.error({ error }, 'Test');
      })`;
      mockReadFile.mockResolvedValue(testContent);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].code).toContain('.catch');
      expect(result.analysis[0].code.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Test with research-queue.ts', () => {
    it('should validate actual research-queue.ts file', async () => {
      // SETUP: Use actual file content (read at module level)
      if (ACTUAL_RESEARCH_QUEUE_CONTENT) {
        mockExistsSync.mockReturnValue(true);
        mockReadFile.mockResolvedValue(ACTUAL_RESEARCH_QUEUE_CONTENT);
      } else {
        // Skip test if file not found
        return;
      }

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY: Based on the actual file, we expect specific results
      expect(result.catchBlocks).toBe(2);
      expect(result.allHandled).toBe(true);
      expect(result.analysis.length).toBe(2);

      // Line 166: Main chain catch with warn and throw
      const line166Catch = result.analysis.find(a => a.lineNumber === 166);
      expect(line166Catch).toBeDefined();
      expect(line166Catch?.isValid).toBe(true);
      expect(line166Catch?.hasLogging).toBe(true);
      expect(line166Catch?.hasErrorPropagation).toBe(true);
      expect(line166Catch?.isEmpty).toBe(false);

      // Line 181: Nested catch in finally with error
      const line181Catch = result.analysis.find(a => a.lineNumber === 181);
      expect(line181Catch).toBeDefined();
      expect(line181Catch?.isValid).toBe(true);
      expect(line181Catch?.hasLogging).toBe(true);
      expect(line181Catch?.isEmpty).toBe(false);

      // No warnings expected for properly handled code
      expect(result.warnings).toEqual([]);
    });

    it('should detect both catch blocks at correct line numbers', async () => {
      // SETUP: Use actual file content (read at module level)
      if (ACTUAL_RESEARCH_QUEUE_CONTENT) {
        mockExistsSync.mockReturnValue(true);
        mockReadFile.mockResolvedValue(ACTUAL_RESEARCH_QUEUE_CONTENT);
      } else {
        // Skip test if file not found
        return;
      }

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY: Both catch blocks should be found
      const lineNumbers = result.analysis
        .map(a => a.lineNumber)
        .sort((a, b) => a - b);
      expect(lineNumbers).toEqual([166, 181]);
    });
  });

  describe('PromiseRejectionHandledWarning Detection', () => {
    let unhandledRejections: unknown[] = [];

    beforeEach(() => {
      unhandledRejections = [];

      // Set up listener before each test
      process.on('unhandledRejection', reason => {
        unhandledRejections.push(reason);
      });
    });

    afterEach(() => {
      // Clean up listener after each test
      process.removeAllListeners('unhandledRejection');
    });

    it('should not emit unhandled rejections during validation', async () => {
      // SETUP: Use actual file content
      if (ACTUAL_RESEARCH_QUEUE_CONTENT) {
        mockExistsSync.mockReturnValue(true);
        mockReadFile.mockResolvedValue(ACTUAL_RESEARCH_QUEUE_CONTENT);
      } else {
        // Skip test if file not found
        return;
      }

      // EXECUTE
      await verifyPromiseHandling();

      // VERIFY: No unhandled rejections should have occurred
      expect(unhandledRejections).toHaveLength(0);
    });

    it('should not emit warnings for properly handled catches', async () => {
      // SETUP: Create content with properly handled catch
      const contentWithProperHandling = `
        const promise = something.catch((error: unknown) => {
          this.#logger.error({ error }, 'Handled error');
        });
      `;
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(contentWithProperHandling);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.allHandled).toBe(true);
      expect(unhandledRejections).toHaveLength(0);
    });

    it('should track if validation completes without errors', async () => {
      // SETUP: Use actual file content
      if (ACTUAL_RESEARCH_QUEUE_CONTENT) {
        mockExistsSync.mockReturnValue(true);
        mockReadFile.mockResolvedValue(ACTUAL_RESEARCH_QUEUE_CONTENT);
      } else {
        // Skip test if file not found
        return;
      }

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY: Validation should complete successfully
      expect(result).toBeDefined();
      expect(result.catchBlocks).toBeGreaterThan(0);
      expect(unhandledRejections).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle catch block with both logging and propagation', async () => {
      // SETUP
      const contentWithBoth = `
        .catch((error: unknown) => {
          this.#logger.error({ error }, 'Failed');
          throw error;
        })
      `;
      mockReadFile.mockResolvedValue(contentWithBoth);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].hasLogging).toBe(true);
      expect(result.analysis[0].hasErrorPropagation).toBe(true);
      expect(result.analysis[0].isValid).toBe(true);
    });

    it('should handle catch block with complex error handling', async () => {
      // SETUP
      const complexContent = `
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.#logger.error(
            {
              taskId: task.id,
              error: errorMessage,
              ...(error instanceof Error && { stack: error.stack }),
            },
            'Complex error handling'
          );
        })
      `;
      mockReadFile.mockResolvedValue(complexContent);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].isValid).toBe(true);
      expect(result.analysis[0].hasLogging).toBe(true);
    });

    it('should handle nested promise chains with multiple catches', async () => {
      // SETUP
      const nestedContent = `
        const promise = something
          .then(result => result)
          .catch((error: unknown) => {
            this.#logger.warn({ error }, 'First catch');
            throw error;
          })
          .finally(() => {
            anotherThing.catch((error: unknown) => {
              this.#logger.error({ error }, 'Second catch');
            });
          });
      `;
      mockReadFile.mockResolvedValue(nestedContent);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.catchBlocks).toBe(2);
      expect(result.analysis.every(a => a.isValid)).toBe(true);
    });

    it('should handle file with only comments', async () => {
      // SETUP
      const commentOnlyFile = `
        // This is a comment
        /* Block comment */
        /// Another comment
      `;
      mockReadFile.mockResolvedValue(commentOnlyFile);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.catchBlocks).toBe(0);
      expect(result.allHandled).toBe(true);
    });

    it('should handle very long catch blocks', async () => {
      // SETUP: Create a long catch block
      let longCatchBlock = `.catch((error: unknown) => {\n`;
      for (let i = 0; i < 50; i++) {
        longCatchBlock += `  this.#logger.debug({ step: ${i} }, 'Processing step ${i}');\n`;
      }
      longCatchBlock += `  this.#logger.error({ error }, 'Finally failed');\n`;
      longCatchBlock += `})`;

      mockReadFile.mockResolvedValue(longCatchBlock);

      // EXECUTE
      const result = await verifyPromiseHandling();

      // VERIFY
      expect(result.analysis[0].isValid).toBe(true);
      expect(result.analysis[0].code.length).toBeGreaterThan(0);
    });
  });
});
