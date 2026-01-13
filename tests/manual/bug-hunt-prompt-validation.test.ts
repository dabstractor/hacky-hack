/**
 * Manual validation script for bug-hunt-prompt
 *
 * @remarks
 * Verifies prompt generation with sample data.
 * Run with: npm test -- run tests/manual/bug-hunt-prompt-validation.test.ts
 */

import { describe, expect, it } from 'vitest';
import { createBugHuntPrompt } from '#/prompts/index.js';
import type { Task } from '../../src/core/models.js';

describe('Bug Hunt Prompt - Manual Validation', () => {
  it('should generate valid prompt with sample data', () => {
    const prd = `# Test PRD

## Requirements

Build a feature.

## Success Criteria

- Feature works as specified
`;

    const tasks: Task[] = [
      {
        id: 'P1.M1.T1',
        type: 'Task',
        title: 'Initialize Project',
        status: 'Complete',
        description: 'Setup',
        subtasks: [],
      },
    ];

    const prompt = createBugHuntPrompt(prd, tasks);

    console.log('=== Bug Hunt Prompt Validation ===');
    console.log(
      'User prompt contains PRD:',
      prompt.user.includes('# Test PRD')
    );
    console.log(
      'User prompt contains tasks:',
      prompt.user.includes('P1.M1.T1')
    );
    console.log('Reflection enabled:', prompt.enableReflection);
    console.log('Response format defined:', !!prompt.responseFormat);
    console.log('System prompt length:', prompt.systemOverride?.length || 0);
    console.log('User prompt length:', prompt.user.length);

    expect(prompt.user).toContain('# Test PRD');
    expect(prompt.user).toContain('P1.M1.T1');
    expect(prompt.enableReflection).toBe(true);
    expect(prompt.responseFormat).toBeDefined();
  });
});
