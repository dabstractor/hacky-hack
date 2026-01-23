/**
 * Integration test for PRP_EXECUTE_PROMPT (PRP_BUILDER_PROMPT)
 *
 * @remarks
 * Tests the complete PRP_BUILDER_PROMPT constant structure and content
 * to ensure the Coder Agent receives complete, validated prompt definitions
 * for executing PRPs.
 *
 * This integration test validates:
 * - Prompt export and loading
 * - All 5 Execution Process steps from the contract definition:
 *   (1) Load PRP (CRITICAL FIRST STEP) - Read tool usage
 *   (2) ULTRATHINK & Plan - TodoWrite tool usage
 *   (3) Execute Implementation - Follow PRP's Implementation Tasks
 *   (4) Progressive Validation - 4-level validation system
 *   (5) Completion Verification - Final Validation Checklist
 * - Failure Protocol instructions
 * - JSON output format specification
 * - $PRP_README placeholder
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link https://github.com/anthropics/claude-code | Claude Code}
 * @see {@link ../../PROMPTS.md} - PRP_EXECUTE_PROMPT definition (lines 641-714)
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRP_BUILDER_PROMPT } from '../../src/agents/prompts.js';

describe('integration/prp-execute-prompt', () => {
  // CLEANUP: Always restore mocks after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  // PATTERN: Test suite 1 - Verify prompt export and loading
  describe('prompt export and loading', () => {
    it('should export PRP_BUILDER_PROMPT as a string', () => {
      expect(typeof PRP_BUILDER_PROMPT).toBe('string');
      expect(PRP_BUILDER_PROMPT.length).toBeGreaterThan(100);
    });

    it('should be a non-empty template literal with markdown content', () => {
      expect(PRP_BUILDER_PROMPT).toBeTruthy();
      expect(PRP_BUILDER_PROMPT.trim()).not.toBe('');
      expect(PRP_BUILDER_PROMPT).toContain('# Execute BASE PRP');
    });

    it('should contain Mission statement with One-Pass Implementation Success', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        '## Mission: One-Pass Implementation Success'
      );
      expect(PRP_BUILDER_PROMPT).toContain(
        'PRPs enable working code on the first attempt'
      );
    });
  });

  // PATTERN: Test suite 2 - Execution Process Step 1 - Load PRP (CRITICAL FIRST STEP)
  describe('execution process step 1: Load PRP (CRITICAL FIRST STEP)', () => {
    it('should contain Load PRP section as critical first step', () => {
      expect(PRP_BUILDER_PROMPT).toContain('## Execution Process');
      expect(PRP_BUILDER_PROMPT).toContain(
        '1. **Load PRP (CRITICAL FIRST STEP)**'
      );
    });

    it('should instruct to use Read tool to read the PRP file', () => {
      expect(PRP_BUILDER_PROMPT).toContain('Use the `Read` tool');
      expect(PRP_BUILDER_PROMPT).toContain(
        'to read the PRP file at the path provided'
      );
    });

    it('should emphasize reading PRP before doing anything else', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'You MUST read this file before doing anything else'
      );
      expect(PRP_BUILDER_PROMPT).toContain('It contains your instructions');
    });

    it('should instruct to absorb all context and patterns', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Absorb all context, patterns, requirements'
      );
      expect(PRP_BUILDER_PROMPT).toContain('gather codebase intelligence');
    });

    it('should instruct to use provided documentation references', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Use the provided documentation references'
      );
      expect(PRP_BUILDER_PROMPT).toContain(
        'consume the right documentation before the appropriate todo/task'
      );
    });

    it('should instruct to trust the PRP context', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        "Trust the PRP's context and guidance"
      );
      expect(PRP_BUILDER_PROMPT).toContain(
        "it's designed for one-pass success"
      );
    });
  });

  // PATTERN: Test suite 3 - Execution Process Step 2 - ULTRATHINK & Plan
  describe('execution process step 2: ULTRATHINK & Plan', () => {
    it('should contain ULTRATHINK & Plan step as step 2', () => {
      expect(PRP_BUILDER_PROMPT).toContain('2. **ULTRATHINK & Plan**');
    });

    it('should instruct to create comprehensive implementation plan', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Create comprehensive implementation plan'
      );
      expect(PRP_BUILDER_PROMPT).toContain("following the PRP's task order");
    });

    it('should instruct to use TodoWrite tool for planning', () => {
      expect(PRP_BUILDER_PROMPT).toContain('TodoWrite');
      expect(PRP_BUILDER_PROMPT).toContain(
        'Break down into clear todos using TodoWrite tool'
      );
    });

    it('should instruct to use subagents for parallel work', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Use subagents for parallel work when beneficial'
      );
      expect(PRP_BUILDER_PROMPT).toContain(
        'always create prp inspired prompts for subagents'
      );
    });

    it('should instruct to follow patterns referenced in the PRP', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Follow the patterns referenced in the PRP'
      );
    });

    it('should instruct to use specific file paths and signatures from PRP', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Use specific file paths, class names, and method signatures'
      );
      expect(PRP_BUILDER_PROMPT).toContain('from PRP context');
    });

    it('should instruct to never guess and verify codebase patterns', () => {
      expect(PRP_BUILDER_PROMPT).toContain('Never guess');
      expect(PRP_BUILDER_PROMPT).toContain(
        'always verify the codebase patterns'
      );
    });
  });

  // PATTERN: Test suite 4 - Execution Process Step 3 - Execute Implementation
  describe('execution process step 3: Execute Implementation', () => {
    it('should contain Execute Implementation step as step 3', () => {
      expect(PRP_BUILDER_PROMPT).toContain('3. **Execute Implementation**');
    });

    it('should instruct to follow PRP Implementation Tasks sequence', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        "Follow the PRP's Implementation Tasks sequence"
      );
    });

    it('should instruct to use patterns and examples referenced in the PRP', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Use the patterns and examples referenced in the PRP'
      );
    });

    it('should instruct to create files in locations specified by codebase tree', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Create files in locations specified by the desired codebase tree'
      );
    });

    it('should instruct to apply naming conventions from task specifications', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Apply naming conventions from the task specifications'
      );
      expect(PRP_BUILDER_PROMPT).toContain('CLAUDE.md');
    });
  });

  // PATTERN: Test suite 5 - Execution Process Step 4 - Progressive Validation
  describe('execution process step 4: Progressive Validation', () => {
    it('should contain Progressive Validation step as step 4', () => {
      expect(PRP_BUILDER_PROMPT).toContain('4. **Progressive Validation**');
    });

    it('should define Level 1: syntax & style validation', () => {
      expect(PRP_BUILDER_PROMPT).toContain('**Level 1**');
      expect(PRP_BUILDER_PROMPT).toContain('syntax & style validation');
    });

    it('should define Level 2: unit test validation', () => {
      expect(PRP_BUILDER_PROMPT).toContain('**Level 2**');
      expect(PRP_BUILDER_PROMPT).toContain('unit test validation');
    });

    it('should define Level 3: integration testing', () => {
      expect(PRP_BUILDER_PROMPT).toContain('**Level 3**');
      expect(PRP_BUILDER_PROMPT).toContain('integration testing');
    });

    it('should define Level 4: specified validation', () => {
      expect(PRP_BUILDER_PROMPT).toContain('**Level 4**');
      expect(PRP_BUILDER_PROMPT).toContain(
        'Execute specified validation from PRP'
      );
    });

    it('should specify each level must pass before proceeding', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Each level must pass before proceeding to the next'
      );
    });
  });

  // PATTERN: Test suite 6 - Execution Process Step 5 - Completion Verification
  describe('execution process step 5: Completion Verification', () => {
    it('should contain Completion Verification step as step 5', () => {
      expect(PRP_BUILDER_PROMPT).toContain('5. **Completion Verification**');
    });

    it('should instruct to work through Final Validation Checklist', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Work through the Final Validation Checklist'
      );
      expect(PRP_BUILDER_PROMPT).toContain('in the PRP');
    });

    it('should instruct to verify all Success Criteria from What section', () => {
      expect(PRP_BUILDER_PROMPT).toContain('Verify all Success Criteria');
      expect(PRP_BUILDER_PROMPT).toContain('from the "What" section');
    });

    it('should instruct to confirm all Anti-Patterns were avoided', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Confirm all Anti-Patterns were avoided'
      );
    });

    it('should state implementation is ready and working', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Implementation is ready and working'
      );
    });
  });

  // PATTERN: Test suite 7 - Failure Protocol
  describe('failure protocol', () => {
    it('should contain Failure Protocol section', () => {
      expect(PRP_BUILDER_PROMPT).toContain('**Failure Protocol**');
    });

    it('should instruct to use patterns and gotchas from PRP to fix issues', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'use the patterns and gotchas from the PRP to fix issues'
      );
    });

    it('should instruct to re-run validation until passing', () => {
      expect(PRP_BUILDER_PROMPT).toContain('re-run validation until passing');
    });

    it('should instruct to halt on fundamental issues with thorough explanation', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'If a fundamental issue with the plan is found'
      );
      expect(PRP_BUILDER_PROMPT).toContain(
        'halt and produce a thorough explanation'
      );
    });

    it('should specify explanation at a 10th grade level', () => {
      expect(PRP_BUILDER_PROMPT).toContain('at a 10th grade level');
    });
  });

  // PATTERN: Test suite 8 - JSON Output Format
  describe('json output format', () => {
    it('should specify JSON output format', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        'Strictly output your results in this JSON format'
      );
    });

    it('should contain result field with success/error/issue values', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        '"result": "success" | "error" | "issue"'
      );
    });

    it('should contain message field for detailed explanation', () => {
      expect(PRP_BUILDER_PROMPT).toContain(
        '"message": "Detailed explanation of the issue"'
      );
    });

    it('should use markdown code block format for JSON', () => {
      expect(PRP_BUILDER_PROMPT).toContain('```json');
    });

    it('should include $PRP_README placeholder', () => {
      expect(PRP_BUILDER_PROMPT).toContain('$PRP_README');
      expect(PRP_BUILDER_PROMPT).toContain('<PRP-README>');
      expect(PRP_BUILDER_PROMPT).toContain('</PRP-README>');
    });
  });

  // PATTERN: Test suite 9 - Sample output logging
  describe('sample output logging', () => {
    it('should log sample prompt content for inspection', () => {
      console.log('\n=== PRP_BUILDER_PROMPT Sample Output ===');
      console.log('Prompt length:', PRP_BUILDER_PROMPT.length);
      console.log('\n=== Prompt (first 500 chars) ===');
      console.log(PRP_BUILDER_PROMPT.slice(0, 500) + '...');
      console.log('\n=== Key sections verification ===');
      console.log(
        '✓ Contains # Execute BASE PRP:',
        PRP_BUILDER_PROMPT.includes('# Execute BASE PRP')
      );
      console.log(
        '✓ Contains Mission: One-Pass Implementation Success:',
        PRP_BUILDER_PROMPT.includes('Mission: One-Pass Implementation Success')
      );
      console.log(
        '✓ Contains Execution Process:',
        PRP_BUILDER_PROMPT.includes('## Execution Process')
      );
      console.log(
        '✓ Contains Load PRP (CRITICAL FIRST STEP):',
        PRP_BUILDER_PROMPT.includes('Load PRP (CRITICAL FIRST STEP)')
      );
      console.log(
        '✓ Contains ULTRATHINK & Plan:',
        PRP_BUILDER_PROMPT.includes('ULTRATHINK & Plan')
      );
      console.log(
        '✓ Contains Execute Implementation:',
        PRP_BUILDER_PROMPT.includes('Execute Implementation')
      );
      console.log(
        '✓ Contains Progressive Validation:',
        PRP_BUILDER_PROMPT.includes('Progressive Validation')
      );
      console.log(
        '✓ Contains Completion Verification:',
        PRP_BUILDER_PROMPT.includes('Completion Verification')
      );
      console.log(
        '✓ Contains Failure Protocol:',
        PRP_BUILDER_PROMPT.includes('Failure Protocol')
      );
      console.log(
        '✓ Contains JSON output format:',
        PRP_BUILDER_PROMPT.includes('JSON format')
      );
      console.log(
        '✓ Contains $PRP_README placeholder:',
        PRP_BUILDER_PROMPT.includes('$PRP_README')
      );
      console.log(
        '✓ Contains Level 1:',
        PRP_BUILDER_PROMPT.includes('Level 1')
      );
      console.log(
        '✓ Contains Level 2:',
        PRP_BUILDER_PROMPT.includes('Level 2')
      );
      console.log(
        '✓ Contains Level 3:',
        PRP_BUILDER_PROMPT.includes('Level 3')
      );
      console.log(
        '✓ Contains Level 4:',
        PRP_BUILDER_PROMPT.includes('Level 4')
      );
      console.log(
        '✓ Contains TodoWrite:',
        PRP_BUILDER_PROMPT.includes('TodoWrite')
      );
      console.log(
        '✓ Contains Read tool:',
        PRP_BUILDER_PROMPT.includes('`Read` tool')
      );
      console.log(
        '✓ Contains 10th grade level:',
        PRP_BUILDER_PROMPT.includes('10th grade level')
      );

      // VERIFY: All assertions pass
      expect(PRP_BUILDER_PROMPT).toBeDefined();
      expect(PRP_BUILDER_PROMPT.length).toBeGreaterThan(100);
    });
  });
});
