/**
 * Code Processing CLI Command
 *
 * Command-line interface for code minification, compression, and normalization
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import {
  CodeProcessor,
  processForAI,
  minifyCode,
} from '../utils/code-processor.js';

export const processCodeCommand = new Command('process-code')
  .description('Process JavaScript/TypeScript code for various purposes')
  .argument('<input>', 'Input file path')
  .option('-o, --output <file>', 'Output file path')
  .option('--method <method>', 'Processing method', 'ai')
  .option('--max-tokens <number>', 'Maximum tokens for AI', '4000')
  .option('--extract-lines <range>', 'Extract line range (e.g., 10-20)')
  .option('--extract-function <name>', 'Extract function by name')
  .option('--extract-class <name>', 'Extract class by name')
  .option('--remove-comments', 'Remove comments')
  .option('--remove-blank-lines', 'Remove blank lines')
  .option('--mangle', 'Mangle variable names')
  .option('--stats', 'Show statistics about the code')
  .action(async (input, options) => {
    try {
      // Read input file
      const code = readFileSync(input, 'utf-8');

      // Show statistics if requested
      if (options.stats) {
        showStats(code);
        console.log('\n');
      }

      let result: string;

      // Process based on method
      switch (options.method) {
        case 'ai':
          result = await processForAI(code, parseInt(options.maxTokens));
          break;

        case 'minify':
          result = await minifyCode(code);
          break;

        case 'extract-lines':
          if (!options.extractLines) {
            console.error(
              'Error: --extract-lines required for method "extract-lines"'
            );
            process.exit(1);
          }
          const [start, end] = options.extractLines.split('-').map(Number);
          const processor = new CodeProcessor();
          result = processor.extractLineRange(code, { start, end });
          break;

        case 'extract-function':
          if (!options.extractFunction) {
            console.error(
              'Error: --extract-function required for method "extract-function"'
            );
            process.exit(1);
          }
          const funcProcessor = new CodeProcessor();
          result = funcProcessor.extractFunction(code, options.extractFunction);
          break;

        case 'extract-class':
          if (!options.extractClass) {
            console.error(
              'Error: --extract-class required for method "extract-class"'
            );
            process.exit(1);
          }
          const classProcessor = new CodeProcessor();
          result = classProcessor.extractClass(code, options.extractClass);
          break;

        case 'comments-only':
          const commentProcessor = new CodeProcessor();
          result = commentProcessor.removeComments(code);
          break;

        case 'blank-lines-only':
          const blankProcessor = new CodeProcessor();
          result = blankProcessor.removeBlankLines(code);
          break;

        case 'compress':
          const compressProcessor = new CodeProcessor();
          result = await compressProcessor.process(code, {
            removeComments: true,
            removeBlankLines: true,
            mangle: false,
          });
          break;

        default:
          console.error(`Error: Unknown method "${options.method}"`);
          console.error(
            'Available methods: ai, minify, extract-lines, extract-function, extract-class, comments-only, blank-lines-only, compress'
          );
          process.exit(1);
      }

      // Output result
      if (options.output) {
        writeFileSync(options.output, result, 'utf-8');
        console.log(`✓ Processed code written to ${options.output}`);

        // Show comparison
        const originalSize = code.length;
        const newSize = result.length;
        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

        console.log(`  Original: ${originalSize} characters`);
        console.log(`  Result:   ${newSize} characters`);
        console.log(`  Reduction: ${reduction}%`);
      } else {
        console.log(result);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

/**
 * Show statistics about code
 */
function showStats(code: string): void {
  const lines = code.split('\n');
  const processor = new CodeProcessor();

  const originalLines = lines.length;
  const nonEmptyLines = lines.filter(line => line.trim().length > 0).length;
  const commentLines = lines.filter(line => /^\s*\/\//.test(line)).length;
  const imports = processor.extractImports(code);
  const tokens = processor.countTokens(code);

  console.log('Code Statistics:');
  console.log(`  Total lines:      ${originalLines}`);
  console.log(`  Non-empty lines:  ${nonEmptyLines}`);
  console.log(`  Comment lines:    ${commentLines}`);
  console.log(`  Imports:          ${imports.length}`);
  console.log(`  Estimated tokens: ~${tokens}`);
  console.log(`  Character count:  ${code.length}`);

  // Show import details
  if (imports.length > 0) {
    console.log('\nImports:');
    imports.forEach(imp => console.log(`  ${imp.trim()}`));
  }
}
