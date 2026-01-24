/**
 * Unit tests for ResumeCommandBuilder
 *
 * @remarks
 * Tests validate the complete resume command builder functionality including:
 * 1. buildCommand() - routes to correct builder based on strategy
 * 2. buildRetryCommand() - generates: npm run prp -- --task <taskId> --retry
 * 3. buildSkipCommand() - generates: npm run prp -- --skip <taskId> [--skip-dependents]
 * 4. buildContinueCommand() - generates: npm run prp -- --continue
 * 5. buildInteractiveCommand() - generates: npm run prp -- --interactive
 * 6. buildVerboseRetryCommand() - adds --verbose flag
 * 7. buildDryRunCommand() - adds --dry-run flag
 * 8. buildForceCommand() - adds --force flag
 * 9. getCommandDescription() - returns human-readable descriptions
 * 10. buildAllCommands() - returns array of all command options
 * 11. formatAsMarkdown() - formats commands as markdown code block
 * 12. FluentResumeBuilder fluent API with task(), session(), retry(), skip(), continue(), verbose(), dryRun(), force(), flag(), get(), reset()
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ResumeCommandBuilder,
  FluentResumeBuilder,
} from '../../../../src/utils/errors/resume-command-builder.js';
import type {
  ResumeCommandOptions,
  ResumeStrategy,
} from '../../../../src/utils/errors/types.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ResumeCommandBuilder', () => {
  let builder: ResumeCommandBuilder;

  beforeEach(() => {
    builder = new ResumeCommandBuilder();
  });

  afterEach(() => {
    // No cleanup needed
  });

  // ========================================================================
  // buildCommand() tests
  // ========================================================================

  describe('buildCommand()', () => {
    it('should route to retry builder for retry strategy', () => {
      const options: ResumeCommandOptions = {
        strategy: 'retry',
        taskId: 'P1.M1.T1.S1',
        sessionId: 'session123',
      };

      const result = builder.buildCommand(options);
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --retry');
    });

    it('should route to skip builder for skip strategy', () => {
      const options: ResumeCommandOptions = {
        strategy: 'skip',
        taskId: 'P1.M1.T1.S1',
        sessionId: 'session123',
      };

      const result = builder.buildCommand(options);
      expect(result).toBe('npm run prp -- --skip P1.M1.T1.S1');
    });

    it('should route to continue builder for continue strategy', () => {
      const options: ResumeCommandOptions = {
        strategy: 'continue',
        taskId: 'P1.M1.T1.S1',
        sessionId: 'session123',
      };

      const result = builder.buildCommand(options);
      expect(result).toBe('npm run prp -- --continue');
    });

    it('should route to interactive builder for interactive strategy', () => {
      const options: ResumeCommandOptions = {
        strategy: 'interactive',
        taskId: 'P1.M1.T1.S1',
        sessionId: 'session123',
      };

      const result = builder.buildCommand(options);
      expect(result).toBe('npm run prp -- --interactive');
    });

    it('should support flags parameter for retry strategy', () => {
      const options: ResumeCommandOptions = {
        strategy: 'retry',
        taskId: 'P1.M1.T1.S1',
        sessionId: 'session123',
        flags: ['--verbose', '--force'],
      };

      const result = builder.buildCommand(options);
      expect(result).toBe(
        'npm run prp -- --task P1.M1.T1.S1 --retry --verbose --force'
      );
    });

    it('should default to retry for unknown strategy', () => {
      const options = {
        strategy: 'unknown' as ResumeStrategy,
        taskId: 'P1.M1.T1.S1',
        sessionId: 'session123',
      };

      const result = builder.buildCommand(options);
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --retry');
    });

    it('should handle empty flags array', () => {
      const options: ResumeCommandOptions = {
        strategy: 'retry',
        taskId: 'P1.M1.T1.S1',
        sessionId: 'session123',
        flags: [],
      };

      const result = builder.buildCommand(options);
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --retry');
    });
  });

  // ========================================================================
  // buildRetryCommand() tests
  // ========================================================================

  describe('buildRetryCommand()', () => {
    it('should generate basic retry command', () => {
      const result = builder.buildRetryCommand('P1.M1.T1.S1', 'session123');
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --retry');
    });

    it('should include taskId in command', () => {
      const result = builder.buildRetryCommand('P2.M3.T4.S5', 'session456');
      expect(result).toContain('--task P2.M3.T4.S5');
    });

    it('should include --retry flag', () => {
      const result = builder.buildRetryCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('--retry');
    });

    it('should include base npm command', () => {
      const result = builder.buildRetryCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('npm run prp --');
    });

    it('should append flags when provided', () => {
      const result = builder.buildRetryCommand('P1.M1.T1.S1', 'session123', [
        '--verbose',
      ]);
      expect(result).toBe(
        'npm run prp -- --task P1.M1.T1.S1 --retry --verbose'
      );
    });

    it('should append multiple flags when provided', () => {
      const result = builder.buildRetryCommand('P1.M1.T1.S1', 'session123', [
        '--verbose',
        '--force',
      ]);
      expect(result).toBe(
        'npm run prp -- --task P1.M1.T1.S1 --retry --verbose --force'
      );
    });

    it('should handle flags with values', () => {
      const result = builder.buildRetryCommand('P1.M1.T1.S1', 'session123', [
        '--timeout',
        '30000',
      ]);
      expect(result).toBe(
        'npm run prp -- --task P1.M1.T1.S1 --retry --timeout 30000'
      );
    });

    it('should not include flags when undefined', () => {
      const result = builder.buildRetryCommand(
        'P1.M1.T1.S1',
        'session123',
        undefined
      );
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --retry');
    });

    it('should not include flags when empty array', () => {
      const result = builder.buildRetryCommand('P1.M1.T1.S1', 'session123', []);
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --retry');
    });

    it('should handle complex task IDs', () => {
      const result = builder.buildRetryCommand(
        'Phase1.Milestone2.Task3.Subtask4',
        'session789'
      );
      expect(result).toContain('--task Phase1.Milestone2.Task3.Subtask4');
    });
  });

  // ========================================================================
  // buildSkipCommand() tests
  // ========================================================================

  describe('buildSkipCommand()', () => {
    it('should generate basic skip command', () => {
      const result = builder.buildSkipCommand('P1.M1.T1.S1', 'session123');
      expect(result).toBe('npm run prp -- --skip P1.M1.T1.S1');
    });

    it('should include taskId in command', () => {
      const result = builder.buildSkipCommand('P2.M3.T4', 'session456');
      expect(result).toContain('--skip P2.M3.T4');
    });

    it('should include --skip flag', () => {
      const result = builder.buildSkipCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('--skip');
    });

    it('should include base npm command', () => {
      const result = builder.buildSkipCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('npm run prp --');
    });

    it('should append --skip-dependents when true', () => {
      const result = builder.buildSkipCommand(
        'P1.M1.T1.S1',
        'session123',
        true
      );
      expect(result).toBe(
        'npm run prp -- --skip P1.M1.T1.S1 --skip-dependents'
      );
    });

    it('should not append --skip-dependents when false', () => {
      const result = builder.buildSkipCommand(
        'P1.M1.T1.S1',
        'session123',
        false
      );
      expect(result).toBe('npm run prp -- --skip P1.M1.T1.S1');
    });

    it('should default skipDependents to false', () => {
      const result = builder.buildSkipCommand('P1.M1.T1.S1', 'session123');
      expect(result).not.toContain('--skip-dependents');
    });

    it('should handle complex task IDs with skip-dependents', () => {
      const result = builder.buildSkipCommand(
        'Phase1.Milestone2.Task3',
        'session789',
        true
      );
      expect(result).toBe(
        'npm run prp -- --skip Phase1.Milestone2.Task3 --skip-dependents'
      );
    });
  });

  // ========================================================================
  // buildContinueCommand() tests
  // ========================================================================

  describe('buildContinueCommand()', () => {
    it('should generate basic continue command', () => {
      const result = builder.buildContinueCommand('session123');
      expect(result).toBe('npm run prp -- --continue');
    });

    it('should include --continue flag', () => {
      const result = builder.buildContinueCommand('session456');
      expect(result).toContain('--continue');
    });

    it('should include base npm command', () => {
      const result = builder.buildContinueCommand('session789');
      expect(result).toContain('npm run prp --');
    });

    it('should not include taskId or sessionId in output', () => {
      const result = builder.buildContinueCommand('session123');
      expect(result).not.toContain('--task');
      expect(result).not.toContain('session123');
    });

    it('should be consistent regardless of sessionId', () => {
      const result1 = builder.buildContinueCommand('session1');
      const result2 = builder.buildContinueCommand('session2');
      const result3 = builder.buildContinueCommand('session3');
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  // ========================================================================
  // buildInteractiveCommand() tests
  // ========================================================================

  describe('buildInteractiveCommand()', () => {
    it('should generate basic interactive command', () => {
      const result = builder.buildInteractiveCommand('session123');
      expect(result).toBe('npm run prp -- --interactive');
    });

    it('should include --interactive flag', () => {
      const result = builder.buildInteractiveCommand('session456');
      expect(result).toContain('--interactive');
    });

    it('should include base npm command', () => {
      const result = builder.buildInteractiveCommand('session789');
      expect(result).toContain('npm run prp --');
    });

    it('should not include taskId or sessionId in output', () => {
      const result = builder.buildInteractiveCommand('session123');
      expect(result).not.toContain('--task');
      expect(result).not.toContain('session123');
    });

    it('should be consistent regardless of sessionId', () => {
      const result1 = builder.buildInteractiveCommand('session1');
      const result2 = builder.buildInteractiveCommand('session2');
      const result3 = builder.buildInteractiveCommand('session3');
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  // ========================================================================
  // buildVerboseRetryCommand() tests
  // ========================================================================

  describe('buildVerboseRetryCommand()', () => {
    it('should generate verbose retry command', () => {
      const result = builder.buildVerboseRetryCommand(
        'P1.M1.T1.S1',
        'session123'
      );
      expect(result).toBe(
        'npm run prp -- --task P1.M1.T1.S1 --retry --verbose'
      );
    });

    it('should include --verbose flag', () => {
      const result = builder.buildVerboseRetryCommand(
        'P1.M1.T1.S1',
        'session123'
      );
      expect(result).toContain('--verbose');
    });

    it('should include --retry flag', () => {
      const result = builder.buildVerboseRetryCommand(
        'P1.M1.T1.S1',
        'session123'
      );
      expect(result).toContain('--retry');
    });

    it('should include taskId', () => {
      const result = builder.buildVerboseRetryCommand('P2.M3.T4', 'session456');
      expect(result).toContain('--task P2.M3.T4');
    });

    it('should include base npm command', () => {
      const result = builder.buildVerboseRetryCommand(
        'P1.M1.T1.S1',
        'session123'
      );
      expect(result).toContain('npm run prp --');
    });

    it('should place --verbose after --retry', () => {
      const result = builder.buildVerboseRetryCommand(
        'P1.M1.T1.S1',
        'session123'
      );
      const retryIndex = result.indexOf('--retry');
      const verboseIndex = result.indexOf('--verbose');
      expect(verboseIndex).toBeGreaterThan(retryIndex);
    });
  });

  // ========================================================================
  // buildDryRunCommand() tests
  // ========================================================================

  describe('buildDryRunCommand()', () => {
    it('should generate dry-run command', () => {
      const result = builder.buildDryRunCommand('P1.M1.T1.S1', 'session123');
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --dry-run');
    });

    it('should include --dry-run flag', () => {
      const result = builder.buildDryRunCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('--dry-run');
    });

    it('should include taskId', () => {
      const result = builder.buildDryRunCommand('P2.M3.T4', 'session456');
      expect(result).toContain('--task P2.M3.T4');
    });

    it('should include base npm command', () => {
      const result = builder.buildDryRunCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('npm run prp --');
    });

    it('should not include --retry flag', () => {
      const result = builder.buildDryRunCommand('P1.M1.T1.S1', 'session123');
      expect(result).not.toContain('--retry');
    });

    it('should place --dry-run after taskId', () => {
      const result = builder.buildDryRunCommand('P1.M1.T1.S1', 'session123');
      const taskIndex = result.indexOf('--task');
      const dryRunIndex = result.indexOf('--dry-run');
      expect(dryRunIndex).toBeGreaterThan(taskIndex);
    });
  });

  // ========================================================================
  // buildForceCommand() tests
  // ========================================================================

  describe('buildForceCommand()', () => {
    it('should generate force command', () => {
      const result = builder.buildForceCommand('P1.M1.T1.S1', 'session123');
      expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --force');
    });

    it('should include --force flag', () => {
      const result = builder.buildForceCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('--force');
    });

    it('should include taskId', () => {
      const result = builder.buildForceCommand('P2.M3.T4', 'session456');
      expect(result).toContain('--task P2.M3.T4');
    });

    it('should include base npm command', () => {
      const result = builder.buildForceCommand('P1.M1.T1.S1', 'session123');
      expect(result).toContain('npm run prp --');
    });

    it('should not include --retry flag', () => {
      const result = builder.buildForceCommand('P1.M1.T1.S1', 'session123');
      expect(result).not.toContain('--retry');
    });

    it('should place --force after taskId', () => {
      const result = builder.buildForceCommand('P1.M1.T1.S1', 'session123');
      const taskIndex = result.indexOf('--task');
      const forceIndex = result.indexOf('--force');
      expect(forceIndex).toBeGreaterThan(taskIndex);
    });
  });

  // ========================================================================
  // getCommandDescription() tests
  // ========================================================================

  describe('getCommandDescription()', () => {
    it('should return "Skip this task and continue" for --skip', () => {
      const command = 'npm run prp -- --skip P1.M1.T1.S1';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Skip this task and continue');
    });

    it('should return "Retry this task" for --retry', () => {
      const command = 'npm run prp -- --task P1.M1.T1.S1 --retry';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Retry this task');
    });

    it('should return "Continue from this point" for --continue', () => {
      const command = 'npm run prp -- --continue';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Continue from this point');
    });

    it('should return "Enter interactive recovery mode" for --interactive', () => {
      const command = 'npm run prp -- --interactive';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Enter interactive recovery mode');
    });

    it('should return "Preview without executing" for --dry-run', () => {
      const command = 'npm run prp -- --task P1.M1.T1.S1 --dry-run';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Preview without executing');
    });

    it('should return "Force execution (bypasses validation)" for --force', () => {
      const command = 'npm run prp -- --task P1.M1.T1.S1 --force';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Force execution (bypasses validation)');
    });

    it('should return "Run command" for unrecognized commands', () => {
      const command = 'npm run prp -- --unknown-flag';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Run command');
    });

    it('should return "Run command" for empty string', () => {
      const result = builder.getCommandDescription('');
      expect(result).toBe('Run command');
    });

    it('should prioritize --skip over other flags', () => {
      const command = 'npm run prp -- --skip P1.M1.T1.S1 --verbose';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Skip this task and continue');
    });

    it('should handle commands with multiple flags', () => {
      const command =
        'npm run prp -- --task P1.M1.T1.S1 --retry --verbose --force';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Retry this task');
    });

    it('should be case-sensitive for flags', () => {
      const command = 'npm run prp -- --SKIP P1.M1.T1.S1';
      const result = builder.getCommandDescription(command);
      expect(result).toBe('Run command');
    });
  });

  // ========================================================================
  // buildAllCommands() tests
  // ========================================================================

  describe('buildAllCommands()', () => {
    it('should return array of all command options', () => {
      const result = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
    });

    it('should include retry command', () => {
      const result = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      expect(result).toContain('npm run prp -- --task P1.M1.T1.S1 --retry');
    });

    it('should include skip command', () => {
      const result = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      expect(result).toContain('npm run prp -- --skip P1.M1.T1.S1');
    });

    it('should include verbose retry command', () => {
      const result = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      expect(result).toContain(
        'npm run prp -- --task P1.M1.T1.S1 --retry --verbose'
      );
    });

    it('should include dry-run command', () => {
      const result = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      expect(result).toContain('npm run prp -- --task P1.M1.T1.S1 --dry-run');
    });

    it('should use provided taskId in all commands', () => {
      const result = builder.buildAllCommands('P2.M3.T4', 'session456');
      for (const command of result) {
        if (command.includes('--task') || command.includes('--skip')) {
          expect(command).toContain('P2.M3.T4');
        }
      }
    });

    it('should maintain consistent command order', () => {
      const result1 = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      const result2 = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      expect(result1).toEqual(result2);
    });

    it('should not include continue command', () => {
      const result = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      for (const command of result) {
        expect(command).not.toContain('--continue');
      }
    });

    it('should not include interactive command', () => {
      const result = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      for (const command of result) {
        expect(command).not.toContain('--interactive');
      }
    });
  });

  // ========================================================================
  // formatAsMarkdown() tests
  // ========================================================================

  describe('formatAsMarkdown()', () => {
    it('should format single command as markdown', () => {
      const commands = ['npm run prp -- --task P1.M1.T1.S1 --retry'];
      const result = builder.formatAsMarkdown(commands);
      expect(result).toContain('# Retry this task');
      expect(result).toContain('$ npm run prp -- --task P1.M1.T1.S1 --retry');
    });

    it('should format multiple commands as markdown', () => {
      const commands = [
        'npm run prp -- --task P1.M1.T1.S1 --retry',
        'npm run prp -- --skip P1.M1.T1.S1',
      ];
      const result = builder.formatAsMarkdown(commands);
      expect(result).toContain('# Retry this task');
      expect(result).toContain('# Skip this task and continue');
      expect(result).toContain('$ npm run prp -- --task P1.M1.T1.S1 --retry');
      expect(result).toContain('$ npm run prp -- --skip P1.M1.T1.S1');
    });

    it('should use custom descriptions when provided', () => {
      const commands = ['npm run prp -- --task P1.M1.T1.S1 --retry'];
      const descriptions = ['Custom retry description'];
      const result = builder.formatAsMarkdown(commands, descriptions);
      expect(result).toContain('# Custom retry description');
      expect(result).not.toContain('# Retry this task');
    });

    it('should add blank lines between commands', () => {
      const commands = [
        'npm run prp -- --task P1.M1.T1.S1 --retry',
        'npm run prp -- --skip P1.M1.T1.S1',
      ];
      const result = builder.formatAsMarkdown(commands);
      const lines = result.split('\n');
      // Should have blank line (empty string) between command blocks
      const emptyLineIndex = lines.findIndex(
        (line, i) => line === '' && i > 0 && i < lines.length - 1
      );
      expect(emptyLineIndex).toBeGreaterThanOrEqual(0);
    });

    it('should not add trailing blank line', () => {
      const commands = ['npm run prp -- --task P1.M1.T1.S1 --retry'];
      const result = builder.formatAsMarkdown(commands);
      expect(result.endsWith('\n')).toBe(false);
    });

    it('should handle empty commands array', () => {
      const result = builder.formatAsMarkdown([]);
      expect(result).toBe('');
    });

    it('should use default description when descriptions array is shorter', () => {
      const commands = [
        'npm run prp -- --task P1.M1.T1.S1 --retry',
        'npm run prp -- --skip P1.M1.T1.S1',
      ];
      const descriptions = ['Custom retry']; // Only one description for two commands
      const result = builder.formatAsMarkdown(commands, descriptions);
      expect(result).toContain('# Custom retry');
      expect(result).toContain('# Skip this task and continue'); // Default description
    });

    it('should ignore extra descriptions', () => {
      const commands = ['npm run prp -- --task P1.M1.T1.S1 --retry'];
      const descriptions = ['Custom retry', 'Extra description'];
      const result = builder.formatAsMarkdown(commands, descriptions);
      expect(result).toContain('# Custom retry');
      expect(result).not.toContain('# Extra description');
    });

    it('should handle undefined descriptions', () => {
      const commands = ['npm run prp -- --task P1.M1.T1.S1 --retry'];
      const result = builder.formatAsMarkdown(commands, undefined);
      expect(result).toContain('# Retry this task');
    });

    it('should format all command types correctly', () => {
      const commands = [
        'npm run prp -- --task P1.M1.T1.S1 --retry',
        'npm run prp -- --skip P1.M1.T1.S1',
        'npm run prp -- --continue',
        'npm run prp -- --interactive',
        'npm run prp -- --task P1.M1.T1.S1 --dry-run',
        'npm run prp -- --task P1.M1.T1.S1 --force',
      ];
      const result = builder.formatAsMarkdown(commands);
      expect(result).toContain('# Retry this task');
      expect(result).toContain('# Skip this task and continue');
      expect(result).toContain('# Continue from this point');
      expect(result).toContain('# Enter interactive recovery mode');
      expect(result).toContain('# Preview without executing');
      expect(result).toContain('# Force execution (bypasses validation)');
    });
  });

  // ========================================================================
  // build() fluent API factory tests
  // ========================================================================

  describe('build() fluent API factory', () => {
    it('should return FluentResumeBuilder instance', () => {
      const fluent = builder.build();
      expect(fluent).toBeInstanceOf(FluentResumeBuilder);
    });

    it('should create new instance each time', () => {
      const fluent1 = builder.build();
      const fluent2 = builder.build();
      expect(fluent1).not.toBe(fluent2);
    });
  });

  // ========================================================================
  // FluentResumeBuilder fluent API tests
  // ========================================================================

  describe('FluentResumeBuilder', () => {
    let fluent: FluentResumeBuilder;

    beforeEach(() => {
      fluent = builder.build();
    });

    // ------------------------ task() method ------------------------

    describe('task()', () => {
      it('should add task flag to command', () => {
        fluent.task('P1.M1.T1.S1');
        const result = fluent.get();
        expect(result).toContain('--task P1.M1.T1.S1');
      });

      it('should return this for chaining', () => {
        const result = fluent.task('P1.M1.T1.S1');
        expect(result).toBe(fluent);
      });

      it('should handle complex task IDs', () => {
        fluent.task('Phase1.Milestone2.Task3.Subtask4');
        const result = fluent.get();
        expect(result).toContain('--task Phase1.Milestone2.Task3.Subtask4');
      });

      it('should append task flags (does not override)', () => {
        fluent.task('P1.M1.T1.S1').task('P2.M2.T2.S2');
        const result = fluent.get();
        // The FluentResumeBuilder appends rather than replaces
        expect(result).toContain('--task P1.M1.T1.S1');
        expect(result).toContain('--task P2.M2.T2.S2');
      });
    });

    // ------------------------ session() method ------------------------

    describe('session()', () => {
      it('should return this for chaining', () => {
        const result = fluent.session('session123');
        expect(result).toBe(fluent);
      });

      it('should not add anything to command', () => {
        fluent.session('session123');
        const result = fluent.get();
        expect(result).not.toContain('session123');
      });

      it('should be chainable with other methods', () => {
        const result = fluent.session('session123').task('P1.M1.T1.S1');
        expect(result).toBe(fluent);
      });
    });

    // ------------------------ retry() method ------------------------

    describe('retry()', () => {
      it('should add retry flag to command', () => {
        fluent.retry();
        const result = fluent.get();
        expect(result).toContain('--retry');
      });

      it('should return this for chaining', () => {
        const result = fluent.retry();
        expect(result).toBe(fluent);
      });

      it('should work with task method', () => {
        fluent.task('P1.M1.T1.S1').retry();
        const result = fluent.get();
        expect(result).toContain('--task P1.M1.T1.S1');
        expect(result).toContain('--retry');
      });

      it('should allow multiple retry calls', () => {
        fluent.retry().retry();
        const result = fluent.get();
        const retryCount = (result.match(/--retry/g) || []).length;
        expect(retryCount).toBe(2);
      });
    });

    // ------------------------ skip() method ------------------------

    describe('skip()', () => {
      it('should add skip flag to command', () => {
        fluent.skip();
        const result = fluent.get();
        expect(result).toContain('--skip');
      });

      it('should return this for chaining', () => {
        const result = fluent.skip();
        expect(result).toBe(fluent);
      });

      it('should work with task method', () => {
        fluent.task('P1.M1.T1.S1').skip();
        const result = fluent.get();
        expect(result).toContain('--task P1.M1.T1.S1');
        expect(result).toContain('--skip');
      });

      it('should allow multiple skip calls', () => {
        fluent.skip().skip();
        const result = fluent.get();
        const skipCount = (result.match(/--skip/g) || []).length;
        expect(skipCount).toBe(2);
      });
    });

    // ------------------------ continue() method ------------------------

    describe('continue()', () => {
      it('should add continue flag to command', () => {
        fluent.continue();
        const result = fluent.get();
        expect(result).toContain('--continue');
      });

      it('should return this for chaining', () => {
        const result = fluent.continue();
        expect(result).toBe(fluent);
      });

      it('should work alone', () => {
        fluent.continue();
        const result = fluent.get();
        expect(result).toBe('npm run prp -- --continue');
      });

      it('should allow multiple continue calls', () => {
        fluent.continue().continue();
        const result = fluent.get();
        const continueCount = (result.match(/--continue/g) || []).length;
        expect(continueCount).toBe(2);
      });
    });

    // ------------------------ verbose() method ------------------------

    describe('verbose()', () => {
      it('should add verbose flag to command', () => {
        fluent.verbose();
        const result = fluent.get();
        expect(result).toContain('--verbose');
      });

      it('should return this for chaining', () => {
        const result = fluent.verbose();
        expect(result).toBe(fluent);
      });

      it('should work with other flags', () => {
        fluent.task('P1.M1.T1.S1').retry().verbose();
        const result = fluent.get();
        expect(result).toContain('--verbose');
        expect(result).toContain('--retry');
      });

      it('should allow multiple verbose calls', () => {
        fluent.verbose().verbose();
        const result = fluent.get();
        const verboseCount = (result.match(/--verbose/g) || []).length;
        expect(verboseCount).toBe(2);
      });
    });

    // ------------------------ dryRun() method ------------------------

    describe('dryRun()', () => {
      it('should add dry-run flag to command', () => {
        fluent.dryRun();
        const result = fluent.get();
        expect(result).toContain('--dry-run');
      });

      it('should return this for chaining', () => {
        const result = fluent.dryRun();
        expect(result).toBe(fluent);
      });

      it('should work with task method', () => {
        fluent.task('P1.M1.T1.S1').dryRun();
        const result = fluent.get();
        expect(result).toContain('--task P1.M1.T1.S1');
        expect(result).toContain('--dry-run');
      });

      it('should allow multiple dryRun calls', () => {
        fluent.dryRun().dryRun();
        const result = fluent.get();
        const dryRunCount = (result.match(/--dry-run/g) || []).length;
        expect(dryRunCount).toBe(2);
      });
    });

    // ------------------------ force() method ------------------------

    describe('force()', () => {
      it('should add force flag to command', () => {
        fluent.force();
        const result = fluent.get();
        expect(result).toContain('--force');
      });

      it('should return this for chaining', () => {
        const result = fluent.force();
        expect(result).toBe(fluent);
      });

      it('should work with task method', () => {
        fluent.task('P1.M1.T1.S1').force();
        const result = fluent.get();
        expect(result).toContain('--task P1.M1.T1.S1');
        expect(result).toContain('--force');
      });

      it('should allow multiple force calls', () => {
        fluent.force().force();
        const result = fluent.get();
        const forceCount = (result.match(/--force/g) || []).length;
        expect(forceCount).toBe(2);
      });
    });

    // ------------------------ flag() method ------------------------

    describe('flag()', () => {
      it('should add custom flag to command', () => {
        fluent.flag('--custom-flag');
        const result = fluent.get();
        expect(result).toContain('--custom-flag');
      });

      it('should return this for chaining', () => {
        const result = fluent.flag('--custom');
        expect(result).toBe(fluent);
      });

      it('should work with other methods', () => {
        fluent.task('P1.M1.T1.S1').flag('--custom-flag');
        const result = fluent.get();
        expect(result).toContain('--task P1.M1.T1.S1');
        expect(result).toContain('--custom-flag');
      });

      it('should allow multiple custom flags', () => {
        fluent.flag('--flag1').flag('--flag2').flag('--flag3');
        const result = fluent.get();
        expect(result).toContain('--flag1');
        expect(result).toContain('--flag2');
        expect(result).toContain('--flag3');
      });

      it('should handle flags with values', () => {
        fluent.flag('--timeout 30000');
        const result = fluent.get();
        expect(result).toContain('--timeout 30000');
      });

      it('should handle short flags', () => {
        fluent.flag('-v');
        const result = fluent.get();
        expect(result).toContain('-v');
      });
    });

    // ------------------------ get() method ------------------------

    describe('get()', () => {
      it('should return command string', () => {
        fluent.task('P1.M1.T1.S1').retry();
        const result = fluent.get();
        expect(typeof result).toBe('string');
      });

      it('should include base command', () => {
        const result = fluent.get();
        expect(result).toContain('npm run prp --');
      });

      it('should build complete command', () => {
        const result = fluent.task('P1.M1.T1.S1').retry().verbose().get();
        expect(result).toBe(
          'npm run prp -- --task P1.M1.T1.S1 --retry --verbose'
        );
      });

      it('should return same result on multiple calls', () => {
        fluent.task('P1.M1.T1.S1').retry();
        const result1 = fluent.get();
        const result2 = fluent.get();
        expect(result1).toBe(result2);
      });

      it('should return base command when no methods called', () => {
        const result = fluent.get();
        expect(result).toBe('npm run prp --');
      });
    });

    // ------------------------ reset() method ------------------------

    describe('reset()', () => {
      it('should clear builder state', () => {
        fluent.task('P1.M1.T1.S1').retry().verbose();
        fluent.reset();
        const result = fluent.get();
        expect(result).toBe('npm run prp --');
      });

      it('should return this for chaining', () => {
        fluent.task('P1.M1.T1.S1');
        const result = fluent.reset();
        expect(result).toBe(fluent);
      });

      it('should allow building new command after reset', () => {
        fluent.task('P1.M1.T1.S1').retry();
        fluent.reset();
        fluent.task('P2.M2.T2.S2').skip();
        const result = fluent.get();
        expect(result).toBe('npm run prp -- --task P2.M2.T2.S2 --skip');
      });

      it('should preserve base command after reset', () => {
        fluent.task('P1.M1.T1.S1').retry().verbose();
        fluent.reset();
        const result = fluent.get();
        expect(result).toContain('npm run prp --');
      });
    });

    // ------------------------ Complex chaining scenarios ------------------------

    describe('complex chaining scenarios', () => {
      it('should build verbose retry command', () => {
        const result = fluent.task('P1.M1.T1.S1').retry().verbose().get();
        expect(result).toBe(
          'npm run prp -- --task P1.M1.T1.S1 --retry --verbose'
        );
      });

      it('should build force retry command', () => {
        const result = fluent.task('P1.M1.T1.S1').retry().force().get();
        expect(result).toBe(
          'npm run prp -- --task P1.M1.T1.S1 --retry --force'
        );
      });

      it('should build skip with dependents command', () => {
        const result = fluent
          .task('P1.M1.T1.S1')
          .skip()
          .flag('--skip-dependents')
          .get();
        expect(result).toBe(
          'npm run prp -- --task P1.M1.T1.S1 --skip --skip-dependents'
        );
      });

      it('should build dry-run with task', () => {
        const result = fluent.task('P1.M1.T1.S1').dryRun().get();
        expect(result).toBe('npm run prp -- --task P1.M1.T1.S1 --dry-run');
      });

      it('should build continue command', () => {
        const result = fluent.continue().get();
        expect(result).toBe('npm run prp -- --continue');
      });

      it('should build interactive command', () => {
        const result = fluent.flag('--interactive').get();
        expect(result).toBe('npm run prp -- --interactive');
      });

      it('should build complex multi-flag command', () => {
        const result = fluent
          .task('P1.M1.T1.S1')
          .retry()
          .verbose()
          .force()
          .flag('--timeout 30000')
          .get();
        expect(result).toBe(
          'npm run prp -- --task P1.M1.T1.S1 --retry --verbose --force --timeout 30000'
        );
      });

      it('should handle method order correctly', () => {
        const result1 = fluent.task('P1.M1.T1.S1').retry().verbose().get();
        fluent.reset();
        const result2 = fluent.retry().verbose().task('P1.M1.T1.S1').get();
        expect(result1).toBe(
          'npm run prp -- --task P1.M1.T1.S1 --retry --verbose'
        );
        expect(result2).toBe(
          'npm run prp -- --retry --verbose --task P1.M1.T1.S1'
        );
        expect(result1).not.toBe(result2);
      });

      it('should support reusing builder with reset', () => {
        const result1 = fluent.task('P1.M1.T1.S1').retry().get();
        fluent.reset();
        const result2 = fluent.task('P2.M2.T2.S2').skip().get();
        expect(result1).toBe('npm run prp -- --task P1.M1.T1.S1 --retry');
        expect(result2).toBe('npm run prp -- --task P2.M2.T2.S2 --skip');
      });
    });
  });

  // ========================================================================
  // Integration scenario tests
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should support typical error recovery workflow', () => {
      const taskId = 'P1.M1.T1.S1';
      const sessionId = 'session123';

      // Build all available commands
      const commands = builder.buildAllCommands(taskId, sessionId);

      // Format as markdown for display
      const markdown = builder.formatAsMarkdown(commands);

      // Verify all commands are present
      expect(markdown).toContain('--retry');
      expect(markdown).toContain('--skip');
      expect(markdown).toContain('--verbose');
      expect(markdown).toContain('--dry-run');

      // Verify descriptions are present
      expect(markdown).toContain('Retry this task');
      expect(markdown).toContain('Skip this task and continue');
    });

    it('should support fluent API for custom commands', () => {
      const customCommand = builder
        .build()
        .task('P1.M1.T1.S1')
        .retry()
        .verbose()
        .flag('--max-retries 3')
        .get();

      expect(customCommand).toBe(
        'npm run prp -- --task P1.M1.T1.S1 --retry --verbose --max-retries 3'
      );
    });

    it('should support building commands for multiple strategies', () => {
      const taskId = 'P1.M1.T1.S1';
      const sessionId = 'session123';

      const retryCmd = builder.buildCommand({
        strategy: 'retry',
        taskId,
        sessionId,
      });
      const skipCmd = builder.buildCommand({
        strategy: 'skip',
        taskId,
        sessionId,
      });
      const continueCmd = builder.buildCommand({
        strategy: 'continue',
        taskId,
        sessionId,
      });
      const interactiveCmd = builder.buildCommand({
        strategy: 'interactive',
        taskId,
        sessionId,
      });

      expect(retryCmd).toContain('--retry');
      expect(skipCmd).toContain('--skip');
      expect(continueCmd).toContain('--continue');
      expect(interactiveCmd).toContain('--interactive');
    });

    it('should support descriptive error messages with commands', () => {
      const commands = builder.buildAllCommands('P1.M1.T1.S1', 'session123');
      const descriptions = commands.map(cmd =>
        builder.getCommandDescription(cmd)
      );

      expect(descriptions[0]).toBe('Retry this task');
      expect(descriptions[1]).toBe('Skip this task and continue');
      expect(descriptions[2]).toBe('Retry this task'); // verbose retry
      expect(descriptions[3]).toBe('Preview without executing');
    });
  });
});
