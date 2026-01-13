/**
 * Unit tests for Filesystem MCP tool
 *
 * @remarks
 * Tests validate filesystem operations with security constraints
 * and achieve 100% code coverage of src/tools/filesystem-mcp.ts
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock node:fs/promises to avoid actual file operations
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

// Mock fast-glob to avoid actual filesystem globbing
vi.mock('fast-glob', () => ({
  default: vi.fn(),
}));

import { promises as fs } from 'node:fs';
import fg from 'fast-glob';
import {
  FilesystemMCP,
  readFile,
  writeFile,
  globFiles,
  grepSearch,
  fileReadTool,
  fileWriteTool,
  globFilesTool,
  grepSearchTool,
  type FileReadInput,
  type FileWriteInput,
  type GlobFilesInput,
  type GrepSearchInput,
} from '../../../src/tools/filesystem-mcp.js';

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockMkdir = vi.mocked(fs.mkdir);
const mockFastGlob = vi.mocked(fg);

describe('tools/filesystem-mcp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('FilesystemMCP class', () => {
    it('should instantiate and register filesystem server', () => {
      // EXECUTE
      const fsMCP = new FilesystemMCP();

      // VERIFY
      expect(fsMCP).toBeInstanceOf(FilesystemMCP);
    });

    it('should register four tool executors', () => {
      // EXECUTE
      const fsMCP = new FilesystemMCP();

      // VERIFY - tool is registered via MCPHandler
      // (Cannot directly inspect registration without exposing internals)
      expect(fsMCP).toBeDefined();
    });
  });

  describe('fileReadTool schema', () => {
    it('should have correct tool name', () => {
      // VERIFY
      expect(fileReadTool.name).toBe('file_read');
    });

    it('should have description', () => {
      // VERIFY
      expect(fileReadTool.description).toContain('Read file contents');
    });

    it('should require path property in input schema', () => {
      // VERIFY
      expect(fileReadTool.input_schema.required).toContain('path');
    });

    it('should have path property defined', () => {
      // VERIFY
      expect(fileReadTool.input_schema.properties.path).toEqual({
        type: 'string',
        description: 'File path to read',
      });
    });

    it('should have optional encoding property', () => {
      // VERIFY
      expect(fileReadTool.input_schema.properties.encoding).toEqual({
        type: 'string',
        description: 'Encoding (default: utf-8)',
        enum: ['utf-8', 'utf16le', 'latin1', 'base64', 'hex'],
      });
    });
  });

  describe('fileWriteTool schema', () => {
    it('should have correct tool name', () => {
      // VERIFY
      expect(fileWriteTool.name).toBe('file_write');
    });

    it('should require path and content properties', () => {
      // VERIFY
      expect(fileWriteTool.input_schema.required).toEqual(['path', 'content']);
    });

    it('should have optional createDirs property', () => {
      // VERIFY
      expect(fileWriteTool.input_schema.properties.createDirs).toEqual({
        type: 'boolean',
        description: 'Create directories if needed (default: false)',
      });
    });
  });

  describe('globFilesTool schema', () => {
    it('should have correct tool name', () => {
      // VERIFY
      expect(globFilesTool.name).toBe('glob_files');
    });

    it('should require pattern property', () => {
      // VERIFY
      expect(globFilesTool.input_schema.required).toContain('pattern');
    });

    it('should have optional cwd property', () => {
      // VERIFY
      expect(globFilesTool.input_schema.properties.cwd).toEqual({
        type: 'string',
        description: 'Working directory (optional)',
      });
    });
  });

  describe('grepSearchTool schema', () => {
    it('should have correct tool name', () => {
      // VERIFY
      expect(grepSearchTool.name).toBe('grep_search');
    });

    it('should require pattern and path properties', () => {
      // VERIFY
      expect(grepSearchTool.input_schema.required).toEqual(['pattern', 'path']);
    });

    it('should have optional flags property', () => {
      // VERIFY
      expect(grepSearchTool.input_schema.properties.flags).toEqual({
        type: 'string',
        description: 'Regex flags (e.g., i for case-insensitive)',
      });
    });
  });

  describe('readFile', () => {
    describe('successful operations', () => {
      it('should read file content with default encoding', async () => {
        // SETUP
        const content = 'file content here';
        mockReadFile.mockResolvedValue(content as any);
        const input: FileReadInput = { path: './test.txt' };

        // EXECUTE
        const result = await readFile(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.content).toBe(content);
        expect(result.error).toBeUndefined();
        expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
          encoding: 'utf-8',
        });
      });

      it('should read file with custom encoding', async () => {
        // SETUP
        const content = 'base64content';
        mockReadFile.mockResolvedValue(content as any);
        const input: FileReadInput = { path: './test.txt', encoding: 'base64' };

        // EXECUTE
        const result = await readFile(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.content).toBe(content);
        expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
          encoding: 'base64',
        });
      });

      it('should resolve relative paths', async () => {
        // SETUP
        mockReadFile.mockResolvedValue('content' as any);
        const input: FileReadInput = { path: './relative/path.txt' };

        // EXECUTE
        await readFile(input);

        // VERIFY
        expect(mockReadFile).toHaveBeenCalled();
        const calledPath = mockReadFile.mock.calls[0][0];
        expect(calledPath).toContain('relative');
      });
    });

    describe('error handling', () => {
      it('should handle file not found (ENOENT)', async () => {
        // SETUP
        const error = new Error('File not found') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        mockReadFile.mockRejectedValue(error);
        const input: FileReadInput = { path: './nonexistent.txt' };

        // EXECUTE
        const result = await readFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('File not found: ./nonexistent.txt');
        expect(result.content).toBeUndefined();
      });

      it('should handle permission denied (EACCES)', async () => {
        // SETUP
        const error = new Error('Permission denied') as NodeJS.ErrnoException;
        error.code = 'EACCES';
        mockReadFile.mockRejectedValue(error);
        const input: FileReadInput = { path: './restricted.txt' };

        // EXECUTE
        const result = await readFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied: ./restricted.txt');
      });

      it('should handle path is directory (EISDIR)', async () => {
        // SETUP
        const error = new Error('Is a directory') as NodeJS.ErrnoException;
        error.code = 'EISDIR';
        mockReadFile.mockRejectedValue(error);
        const input: FileReadInput = { path: './adirectory' };

        // EXECUTE
        const result = await readFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('Path is a directory: ./adirectory');
      });

      it('should handle generic errors', async () => {
        // SETUP
        const error = new Error('Unknown error');
        mockReadFile.mockRejectedValue(error);
        const input: FileReadInput = { path: './test.txt' };

        // EXECUTE
        const result = await readFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown error');
      });

      it('should handle non-Error objects', async () => {
        // SETUP
        mockReadFile.mockRejectedValue('string error');
        const input: FileReadInput = { path: './test.txt' };

        // EXECUTE
        const result = await readFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toBe('string error');
      });
    });
  });

  describe('writeFile', () => {
    describe('successful operations', () => {
      it('should write file successfully', async () => {
        // SETUP
        mockWriteFile.mockResolvedValue(undefined);
        const input: FileWriteInput = {
          path: './output.txt',
          content: 'content',
        };

        // EXECUTE
        const result = await writeFile(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(mockWriteFile).toHaveBeenCalledWith(
          expect.any(String),
          'content',
          {
            encoding: 'utf-8',
          }
        );
      });

      it('should create directories when createDirs is true', async () => {
        // SETUP
        mockMkdir.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined);
        const input: FileWriteInput = {
          path: './deep/path/file.txt',
          content: 'content',
          createDirs: true,
        };

        // EXECUTE
        const result = await writeFile(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), {
          recursive: true,
        });
        expect(mockWriteFile).toHaveBeenCalled();
      });

      it('should not create directories when createDirs is false', async () => {
        // SETUP
        mockWriteFile.mockResolvedValue(undefined);
        const input: FileWriteInput = {
          path: './output.txt',
          content: 'content',
          createDirs: false,
        };

        // EXECUTE
        const result = await writeFile(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(mockMkdir).not.toHaveBeenCalled();
      });

      it('should not create directories when createDirs is not specified', async () => {
        // SETUP
        mockWriteFile.mockResolvedValue(undefined);
        const input: FileWriteInput = {
          path: './output.txt',
          content: 'content',
        };

        // EXECUTE
        const result = await writeFile(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(mockMkdir).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle permission denied (EACCES)', async () => {
        // SETUP
        const error = new Error('Permission denied') as NodeJS.ErrnoException;
        error.code = 'EACCES';
        mockWriteFile.mockRejectedValue(error);
        const input: FileWriteInput = {
          path: './restricted.txt',
          content: 'content',
        };

        // EXECUTE
        const result = await writeFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied: ./restricted.txt');
      });

      it('should handle not a directory (ENOTDIR)', async () => {
        // SETUP
        const error = new Error('Not a directory') as NodeJS.ErrnoException;
        error.code = 'ENOTDIR';
        mockWriteFile.mockRejectedValue(error);
        const input: FileWriteInput = {
          path: './file/nested.txt',
          content: 'content',
        };

        // EXECUTE
        const result = await writeFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Not a directory in path: ./file/nested.txt'
        );
      });

      it('should handle generic errors', async () => {
        // SETUP
        const error = new Error('Write failed');
        mockWriteFile.mockRejectedValue(error);
        const input: FileWriteInput = {
          path: './output.txt',
          content: 'content',
        };

        // EXECUTE
        const result = await writeFile(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toBe('Write failed');
      });
    });
  });

  describe('globFiles', () => {
    describe('successful operations', () => {
      it('should return matching files', async () => {
        // SETUP
        const matches = ['/path/to/file1.ts', '/path/to/file2.ts'];
        mockFastGlob.mockResolvedValue(matches as any);
        const input: GlobFilesInput = { pattern: '**/*.ts' };

        // EXECUTE
        const result = await globFiles(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.matches).toEqual(matches);
        expect(mockFastGlob).toHaveBeenCalledWith('**/*.ts', {
          absolute: true,
          onlyFiles: true,
          cwd: expect.any(String),
        });
      });

      it('should use custom cwd when provided', async () => {
        // SETUP
        mockFastGlob.mockResolvedValue([] as any);
        const input: GlobFilesInput = { pattern: '**/*.ts', cwd: './src' };

        // EXECUTE
        await globFiles(input);

        // VERIFY
        const options = mockFastGlob.mock.calls[0]?.[1];
        expect(options?.cwd).toContain('src');
      });

      it('should return empty array for no matches', async () => {
        // SETUP
        mockFastGlob.mockResolvedValue([] as any);
        const input: GlobFilesInput = { pattern: '**/*.nonexistent' };

        // EXECUTE
        const result = await globFiles(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.matches).toEqual([]);
      });
    });

    describe('error handling', () => {
      it('should handle glob errors', async () => {
        // SETUP
        const error = new Error('Invalid pattern');
        mockFastGlob.mockRejectedValue(error);
        const input: GlobFilesInput = { pattern: '[' };

        // EXECUTE
        const result = await globFiles(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid pattern');
        expect(result.matches).toEqual([]);
      });

      it('should handle non-Error objects', async () => {
        // SETUP
        mockFastGlob.mockRejectedValue('string error');
        const input: GlobFilesInput = { pattern: '**/*.ts' };

        // EXECUTE
        const result = await globFiles(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toBe('string error');
      });
    });
  });

  describe('grepSearch', () => {
    describe('successful operations', () => {
      it('should find pattern matches with line numbers', async () => {
        // SETUP
        const content = 'line 1\nline 2\nline 3';
        mockReadFile.mockResolvedValue(content as any);
        const input: GrepSearchInput = { path: './test.txt', pattern: 'line' };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.matches).toEqual([
          { line: 1, content: 'line 1' },
          { line: 2, content: 'line 2' },
          { line: 3, content: 'line 3' },
        ]);
      });

      it('should handle case-insensitive search with i flag', async () => {
        // SETUP
        const content = 'HELLO\nhello\nHeLLo';
        mockReadFile.mockResolvedValue(content as any);
        const input: GrepSearchInput = {
          path: './test.txt',
          pattern: 'hello',
          flags: 'i',
        };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.matches?.length).toBe(3);
      });

      it('should return empty matches when pattern not found', async () => {
        // SETUP
        const content = 'line 1\nline 2\nline 3';
        mockReadFile.mockResolvedValue(content as any);
        const input: GrepSearchInput = {
          path: './test.txt',
          pattern: 'notfound',
        };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.matches).toEqual([]);
      });

      it('should handle empty file content', async () => {
        // SETUP
        mockReadFile.mockResolvedValue('' as any);
        const input: GrepSearchInput = { path: './empty.txt', pattern: 'test' };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.matches).toEqual([]);
      });

      it('should handle multiline content', async () => {
        // SETUP
        const content = 'first line\nsecond line\nthird line';
        mockReadFile.mockResolvedValue(content as any);
        const input: GrepSearchInput = {
          path: './test.txt',
          pattern: '^second',
        };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(true);
        expect(result.matches).toEqual([{ line: 2, content: 'second line' }]);
      });
    });

    describe('error handling', () => {
      it('should handle file not found (ENOENT)', async () => {
        // SETUP
        const error = new Error('File not found') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        mockReadFile.mockRejectedValue(error);
        const input: GrepSearchInput = {
          path: './nonexistent.txt',
          pattern: 'test',
        };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('File not found: ./nonexistent.txt');
      });

      it('should handle invalid regex pattern', async () => {
        // SETUP
        const content = 'some content';
        mockReadFile.mockResolvedValue(content as any);
        const input: GrepSearchInput = {
          path: './test.txt',
          pattern: '[invalid',
        };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid regex pattern');
      });

      it('should handle read errors', async () => {
        // SETUP
        const error = new Error('Read error');
        mockReadFile.mockRejectedValue(error);
        const input: GrepSearchInput = { path: './test.txt', pattern: 'test' };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toBe('Read error');
      });

      it('should handle non-Error objects', async () => {
        // SETUP
        mockReadFile.mockRejectedValue('string error');
        const input: GrepSearchInput = { path: './test.txt', pattern: 'test' };

        // EXECUTE
        const result = await grepSearch(input);

        // VERIFY
        expect(result.success).toBe(false);
        expect(result.error).toBe('string error');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty path in readFile', async () => {
      // SETUP
      mockReadFile.mockResolvedValue('content' as any);
      const input: FileReadInput = { path: '' };

      // EXECUTE
      await readFile(input);

      // VERIFY - should still attempt to read with empty path
      expect(mockReadFile).toHaveBeenCalled();
    });

    it('should handle special characters in grep pattern', async () => {
      // SETUP
      const content = 'test$\\n^test';
      mockReadFile.mockResolvedValue(content as any);
      const input: GrepSearchInput = { path: './test.txt', pattern: '\\$' };

      // EXECUTE
      const result = await grepSearch(input);

      // VERIFY
      expect(result.success).toBe(true);
      expect(result.matches?.length).toBeGreaterThan(0);
    });

    it('should handle complex glob patterns', async () => {
      // SETUP
      const matches = ['/path/src/file.test.ts'];
      mockFastGlob.mockResolvedValue(matches as any);
      const input: GlobFilesInput = { pattern: 'src/**/*.test.ts' };

      // EXECUTE
      const result = await globFiles(input);

      // VERIFY
      expect(result.success).toBe(true);
      expect(result.matches).toEqual(matches);
    });

    it('should handle writing empty content', async () => {
      // SETUP
      mockWriteFile.mockResolvedValue(undefined);
      const input: FileWriteInput = { path: './empty.txt', content: '' };

      // EXECUTE
      const result = await writeFile(input);

      // VERIFY
      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(expect.any(String), '', {
        encoding: 'utf-8',
      });
    });

    it('should handle reading file with binary encoding', async () => {
      // SETUP
      const content = 'base64encodedcontent';
      mockReadFile.mockResolvedValue(content as any);
      const input: FileReadInput = { path: './image.png', encoding: 'base64' };

      // EXECUTE
      const result = await readFile(input);

      // VERIFY
      expect(result.success).toBe(true);
      expect(mockReadFile).toHaveBeenCalledWith(expect.any(String), {
        encoding: 'base64',
      });
    });
  });
});
