/**
 * Code Processor Tests
 *
 * Demonstration and tests for code processing utilities
 */

import { describe, it, expect } from 'vitest';
import {
  CodeProcessor,
  codeUtils,
  processForAI,
  minifyCode,
} from '../../src/utils/code-processor';

describe('CodeProcessor', () => {
  const processor = new CodeProcessor();

  const sampleCode = `
    // Sample function for testing
    /**
     * This is a multi-line comment
     * that should be removed
     */
    function add(a: number, b: number): number {
      // Add two numbers
      const result = a + b;
      return result;
    }

    // Another function
    function multiply(x: number, y: number): number {
      return x * y;
    }

    // Class definition
    class Calculator {
      private value: number;

      constructor(initialValue: number) {
        this.value = initialValue;
      }

      add(n: number): void {
        this.value += n;
      }

      getResult(): number {
        return this.value;
      }
    }
  `;

  describe('Comment Removal', () => {
    it('should remove single-line comments', () => {
      const code = `
        const x = 5; // This is a comment
        const y = 10;
      `;
      const result = processor.removeComments(code);
      expect(result).not.toContain('//');
      expect(result).toContain('const x = 5;');
      expect(result).toContain('const y = 10;');
    });

    it('should remove multi-line comments', () => {
      const code = `
        /* This is a
           multi-line comment */
        const x = 5;
      `;
      const result = processor.removeComments(code);
      expect(result).not.toContain('/*');
      expect(result).not.toContain('*/');
      expect(result).toContain('const x = 5;');
    });

    it('should preserve code with comment-like patterns in strings', () => {
      const code = `const str = "This is not a comment //";`;
      const result = processor.removeComments(code);
      expect(result).toContain('//');
    });
  });

  describe('Blank Line Removal', () => {
    it('should remove blank lines', () => {
      const code = `
        const x = 5;


        const y = 10;
      `;
      const result = processor.removeBlankLines(code);
      expect(result).not.toMatch(/\n\s*\n/);
    });
  });

  describe('Whitespace Compression', () => {
    it('should compress multiple spaces', () => {
      const code = 'const    x    =    5;';
      const result = processor.compressWhitespace(code);
      expect(result).toBe('const x = 5;');
    });

    it('should remove spaces around punctuation', () => {
      const code = 'const x = { a : 1 , b : 2 } ;';
      const result = processor.compressWhitespace(code);
      expect(result).toBe('const x={a:1,b:2};');
    });
  });

  describe('Line Extraction', () => {
    it('should extract line range', () => {
      const code = 'line1\nline2\nline3\nline4\nline5';
      const result = processor.extractLineRange(code, { start: 2, end: 4 });
      expect(result).toBe('line2\nline3\nline4');
    });
  });

  describe('Function Extraction', () => {
    it('should extract function by name', () => {
      const result = processor.extractFunction(sampleCode, 'add');
      expect(result).toContain('function add');
      expect(result).toContain('return');
      expect(result).not.toContain('function multiply');
    });

    it('should handle arrow functions', () => {
      const code = `
        const add = (a: number, b: number): number => {
          return a + b;
        };
      `;
      const result = processor.extractFunction(code, 'add');
      expect(result).toContain('const add');
      expect(result).toContain('=>');
    });
  });

  describe('Class Extraction', () => {
    it('should extract class by name', () => {
      const result = processor.extractClass(sampleCode, 'Calculator');
      expect(result).toContain('class Calculator');
      expect(result).toContain('constructor');
      expect(result).toContain('add');
      expect(result).not.toContain('function add');
    });
  });

  describe('Token Counting', () => {
    it('should count tokens approximately', () => {
      const code = 'function add(a, b) { return a + b; }';
      const tokens = processor.countTokens(code);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(code.length);
    });

    it('should check if code is too long', () => {
      const shortCode = 'const x = 5;';
      expect(codeUtils.isTooLong(shortCode, 100)).toBe(false);

      const longCode = 'x'.repeat(1000);
      expect(codeUtils.isTooLong(longCode, 100)).toBe(true);
    });
  });

  describe('Truncation', () => {
    it('should not truncate short code', () => {
      const code = 'const x = 5;';
      const result = processor.truncateToTokens(code, 100);
      expect(result).toBe(code);
    });

    it('should truncate long code with ellipsis', () => {
      const code = 'x'.repeat(200);
      const result = processor.truncateToTokens(code, 10);
      expect(result).toContain('...');
      expect(result.length).toBeLessThan(code.length);
    });
  });

  describe('Import Extraction', () => {
    it('should extract default imports', () => {
      const code = `
        import fs from 'fs';
        import path from 'path';
      `;
      const imports = processor.extractImports(code);
      expect(imports).toHaveLength(2);
      expect(imports[0]).toContain('import fs');
    });

    it('should extract named imports', () => {
      const code = `
        import { readFile, writeFile } from 'fs';
      `;
      const imports = processor.extractImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0]).toContain('{ readFile, writeFile }');
    });

    it('should extract wildcard imports', () => {
      const code = `
        import * as path from 'path';
      `;
      const imports = processor.extractImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0]).toContain('* as path');
    });
  });

  describe('Code Normalization', () => {
    it('should normalize code formatting', () => {
      const code = `
        const x=5;
        const y   =    10;


        const z = 15;
      `;
      const result = processor.normalizeCode(code);
      expect(result).toContain('const x=5;');
      expect(result).not.toContain('\n\n\n');
    });
  });

  describe('Full Processing Pipeline', () => {
    it('should process code for AI', async () => {
      const result = await processor.process(sampleCode, {
        forAI: true,
        maxTokens: 100,
        removeComments: true,
        removeBlankLines: true,
      });

      expect(result).not.toContain('//');
      expect(result.length).toBeLessThan(sampleCode.length);
    });

    it('should minify code', async () => {
      const result = await processor.process(sampleCode, {
        minify: true,
        mangle: false,
        removeComments: true,
        removeBlankLines: true,
      });

      expect(result).not.toContain('//');
      expect(result.length).toBeLessThan(sampleCode.length);
    });

    it('should make code readable', async () => {
      const minified = 'function add(a,b){return a+b;}';
      const result = await processor.process(minified, {
        format: 'readable',
      });

      expect(result).toContain('\n');
    });
  });

  describe('Code Block Extraction', () => {
    it('should extract code blocks', () => {
      const blocks = processor.extractCodeBlocks(sampleCode);

      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0]).toHaveProperty('code');
      expect(blocks[0]).toHaveProperty('startLine');
      expect(blocks[0]).toHaveProperty('endLine');
      expect(blocks[0]).toHaveProperty('language');
    });
  });
});

describe('codeUtils', () => {
  describe('removeComments', () => {
    it('should remove comments using utility function', () => {
      const code = '// comment\nconst x = 5;';
      const result = codeUtils.removeComments(code);
      expect(result).not.toContain('//');
    });
  });

  describe('removeBlankLines', () => {
    it('should remove blank lines using utility function', () => {
      const code = 'const x = 5;\n\nconst y = 10;';
      const result = codeUtils.removeBlankLines(code);
      expect(result).not.toContain('\n\n');
    });
  });

  describe('compressWhitespace', () => {
    it('should compress whitespace using utility function', () => {
      const code = 'const    x    =    5;';
      const result = codeUtils.compressWhitespace(code);
      expect(result).toBe('const x = 5;');
    });
  });

  describe('extractLines', () => {
    it('should extract lines using utility function', () => {
      const code = 'line1\nline2\nline3';
      const result = codeUtils.extractLines(code, 1, 2);
      expect(result).toBe('line1\nline2');
    });
  });

  describe('countLines', () => {
    it('should count lines using utility function', () => {
      const code = 'line1\nline2\nline3';
      const count = codeUtils.countLines(code);
      expect(count).toBe(3);
    });
  });

  describe('countTokens', () => {
    it('should count tokens using utility function', () => {
      const code = 'const x = 5;';
      const tokens = codeUtils.countTokens(code);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('truncate', () => {
    it('should truncate using utility function', () => {
      const code = 'x'.repeat(100);
      const result = codeUtils.truncate(code, 20);
      expect(result.length).toBeLessThan(100);
      expect(result).toContain('...');
    });
  });
});

describe('Convenience Functions', () => {
  const sampleCode = `
    // Sample code
    function add(a: number, b: number): number {
      return a + b;
    }
  `;

  it('should process code for AI', async () => {
    const result = await processForAI(sampleCode, 1000);
    expect(result).not.toContain('//');
    expect(result.length).toBeLessThanOrEqual(sampleCode.length);
  });

  it('should minify code for production', async () => {
    const result = await minifyCode(sampleCode);
    expect(result).not.toContain('//');
    expect(result.length).toBeLessThan(sampleCode.length);
  });
});

// Example usage demonstration
describe('Example Usage', () => {
  it('should demonstrate common use cases', async () => {
    const code = `
      // Example function
      function calculateTotal(price: number, quantity: number, tax: number): number {
        const subtotal = price * quantity;
        const total = subtotal + (subtotal * tax);
        return total;
      }
    `;

    // Use case 1: Optimize for AI prompts
    const aiOptimized = await processForAI(code, 500);
    console.log('AI Optimized:', aiOptimized);

    // Use case 2: Minify for production
    const minified = await minifyCode(code);
    console.log('Minified:', minified);

    // Use case 3: Extract specific function
    const processor = new CodeProcessor();
    const extracted = processor.extractFunction(code, 'calculateTotal');
    console.log('Extracted:', extracted);

    // Use case 4: Count tokens
    const tokens = codeUtils.countTokens(code);
    console.log('Token count:', tokens);

    // Use case 5: Remove comments only
    const noComments = codeUtils.removeComments(code);
    console.log('No comments:', noComments);

    expect(aiOptimized).toBeDefined();
    expect(minified).toBeDefined();
    expect(extracted).toBeDefined();
  });
});
