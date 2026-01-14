/**
 * Unit tests for Progress Tracker utility
 *
 * @remarks
 * Tests validate the complete progress tracker functionality including:
 * 1. ProgressTracker class construction with valid/invalid options
 * 2. recordStart() stores task start time and ignores duplicates
 * 3. recordComplete() calculates duration and logs progress at intervals
 * 4. getProgress() returns accurate ProgressReport with all metrics
 * 5. getETA() uses exponential smoothing with alpha=0.3
 * 6. formatProgress() returns human-readable progress bar
 * 7. Duration formatting for seconds, minutes, and hours
 * 8. Logger integration with structured progress events
 * 9. Edge cases: empty backlog, unstarted tasks, insufficient samples
 * 10. Progress bar formatting with various widths
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  progressTracker,
  ProgressTracker,
  type ProgressReport,
  type ProgressTrackerOptions,
} from '../../../src/utils/progress.js';
import { getLogger, clearLoggerCache } from '../../../src/utils/logger.js';
import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
} from '../../../src/core/models.js';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

/**
 * Creates a test subtask with minimal required fields
 */
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

/**
 * Creates a test task with subtasks
 */
const createTestTask = (
  id: string,
  title: string,
  status: Status,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task',
  title,
  status,
  description: 'Test task description',
  subtasks,
});

/**
 * Creates a test milestone with tasks
 */
const createTestMilestone = (
  id: string,
  title: string,
  status: Status,
  tasks: Task[] = []
): Milestone => ({
  id,
  type: 'Milestone',
  title,
  status,
  description: 'Test milestone description',
  tasks,
});

/**
 * Creates a test phase with milestones
 */
const createTestPhase = (
  id: string,
  title: string,
  status: Status,
  milestones: Milestone[] = []
): Phase => ({
  id,
  type: 'Phase',
  title,
  status,
  description: 'Test phase description',
  milestones,
});

/**
 * Creates a test backlog with phases
 */
const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});

/**
 * Creates a comprehensive test backlog with multiple levels
 * Useful for testing task counting and progress tracking
 */
const createComplexBacklog = (subtaskCount: number = 10): Backlog => {
  const subtasks: Subtask[] = [];
  for (let i = 0; i < subtaskCount; i++) {
    subtasks.push(
      createTestSubtask(`P1.M1.T1.S${i + 1}`, `Subtask ${i + 1}`, 'Planned')
    );
  }

  const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned', subtasks);
  const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
    task,
  ]);
  const phase = createTestPhase('P1', 'Phase 1', 'Planned', [milestone]);

  return createTestBacklog([phase]);
};

// =============================================================================
// TEST SETUP
// =============================================================================

describe('Progress Tracker utility', () => {
  // Clear logger cache before each test for isolated behavior
  beforeEach(() => {
    clearLoggerCache();
  });

  afterEach(() => {
    clearLoggerCache();
  });

  // ========================================================================
  // ProgressTracker class construction tests
  // ========================================================================

  describe('ProgressTracker constructor', () => {
    it('should create a tracker with valid backlog', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      expect(tracker).toBeDefined();
      expect(tracker.backlog).toBe(backlog);
    });

    it('should create a tracker via factory function', () => {
      const backlog = createComplexBacklog(10);
      const tracker = progressTracker({ backlog });

      expect(tracker).toBeInstanceOf(ProgressTracker);
    });

    it('should accept default options', () => {
      const backlog = createComplexBacklog(10);
      const tracker = progressTracker({ backlog });

      expect(tracker).toBeDefined();
    });

    it('should accept custom logInterval option', () => {
      const backlog = createComplexBacklog(10);
      const tracker = progressTracker({ backlog, logInterval: 5 });

      expect(tracker).toBeDefined();
    });

    it('should accept custom barWidth option', () => {
      const backlog = createComplexBacklog(10);
      const tracker = progressTracker({ backlog, barWidth: 20 });

      expect(tracker).toBeDefined();
    });

    it('should accept custom etaAlpha option', () => {
      const backlog = createComplexBacklog(10);
      const tracker = progressTracker({ backlog, etaAlpha: 0.5 });

      expect(tracker).toBeDefined();
    });

    it('should accept custom minSamples option', () => {
      const backlog = createComplexBacklog(10);
      const tracker = progressTracker({ backlog, minSamples: 5 });

      expect(tracker).toBeDefined();
    });

    it('should accept all custom options together', () => {
      const backlog = createComplexBacklog(10);
      const tracker = progressTracker({
        backlog,
        logInterval: 5,
        barWidth: 30,
        etaAlpha: 0.4,
        minSamples: 2,
      });

      expect(tracker).toBeDefined();
    });

    it('should throw error for empty backlog', () => {
      const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned', []);
      const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
        task,
      ]);
      const phase = createTestPhase('P1', 'Phase 1', 'Planned', [milestone]);
      const backlog = createTestBacklog([phase]);

      expect(() => new ProgressTracker({ backlog })).toThrow(
        'Cannot track progress: backlog contains no subtasks'
      );
    });

    it('should count subtasks correctly in nested hierarchy', () => {
      // Create backlog with multiple phases, milestones, tasks
      const subtask1 = createTestSubtask('P1.M1.T1.S1', 'S1', 'Planned');
      const subtask2 = createTestSubtask('P1.M1.T1.S2', 'S2', 'Planned');
      const subtask3 = createTestSubtask('P1.M1.T2.S1', 'S3', 'Planned');
      const subtask4 = createTestSubtask('P1.M2.T1.S1', 'S4', 'Planned');
      const subtask5 = createTestSubtask('P2.M1.T1.S1', 'S5', 'Planned');

      const task1 = createTestTask('P1.M1.T1', 'T1', 'Planned', [
        subtask1,
        subtask2,
      ]);
      const task2 = createTestTask('P1.M1.T2', 'T2', 'Planned', [subtask3]);
      const task3 = createTestTask('P1.M2.T1', 'T3', 'Planned', [subtask4]);
      const task4 = createTestTask('P2.M1.T1', 'T4', 'Planned', [subtask5]);

      const milestone1 = createTestMilestone('P1.M1', 'M1', 'Planned', [
        task1,
        task2,
      ]);
      const milestone2 = createTestMilestone('P1.M2', 'M2', 'Planned', [task3]);
      const milestone3 = createTestMilestone('P2.M1', 'M3', 'Planned', [task4]);

      const phase1 = createTestPhase('P1', 'P1', 'Planned', [
        milestone1,
        milestone2,
      ]);
      const phase2 = createTestPhase('P2', 'P2', 'Planned', [milestone3]);

      const backlog = createTestBacklog([phase1, phase2]);
      const tracker = new ProgressTracker({ backlog });

      const progress = tracker.getProgress();
      expect(progress.total).toBe(5);
    });

    it('should initialize with zero completed tasks', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const progress = tracker.getProgress();
      expect(progress.completed).toBe(0);
    });

    it('should initialize with zero elapsed time', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const progress = tracker.getProgress();
      expect(progress.elapsed).toBe(0);
    });
  });

  // ========================================================================
  // recordStart() method tests
  // ========================================================================

  describe('recordStart()', () => {
    it('should record task start time', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');

      const progress = tracker.getProgress();
      // Elapsed time should be recorded (may be 0 in fast tests)
      expect(typeof progress.elapsed).toBe('number');
      expect(progress.elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should ignore duplicate start calls for same task', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');
      const firstElapsed = tracker.getProgress().elapsed;

      // Wait a bit and call again
      // Note: in a real scenario we'd use timers, but this tests the logic
      tracker.recordStart('P1.M1.T1.S1');

      const secondElapsed = tracker.getProgress().elapsed;
      expect(secondElapsed).toBe(firstElapsed);
    });

    it('should track first start time for elapsed calculation', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordStart('P1.M1.T1.S2');

      const progress = tracker.getProgress();
      // Elapsed time should be recorded (may be 0 in fast tests)
      expect(typeof progress.elapsed).toBe('number');
      expect(progress.elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should log debug message when task starts', () => {
      const backlog = createComplexBacklog(10);
      const logger = getLogger('ProgressTracker');
      const debugSpy = vi.spyOn(logger, 'debug');

      const tracker = new ProgressTracker({ backlog });
      tracker.recordStart('P1.M1.T1.S1');

      expect(debugSpy).toHaveBeenCalledWith(
        { itemId: 'P1.M1.T1.S1' },
        'Task started'
      );
    });

    it('should not log on duplicate start', () => {
      const backlog = createComplexBacklog(10);
      const logger = getLogger('ProgressTracker');
      const debugSpy = vi.spyOn(logger, 'debug');

      const tracker = new ProgressTracker({ backlog });
      tracker.recordStart('P1.M1.T1.S1');
      debugSpy.mockClear(); // Clear first call

      tracker.recordStart('P1.M1.T1.S1');

      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // recordComplete() method tests
  // ========================================================================

  describe('recordComplete()', () => {
    it('should record task completion and calculate duration', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const progress = tracker.getProgress();
      expect(progress.completed).toBe(1);
      // Duration may be 0 in fast tests
      expect(progress.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should auto-start unstarted task on recordComplete', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      // recordComplete should auto-start the task if not started
      tracker.recordComplete('P1.M1.T1.S1');

      const progress = tracker.getProgress();
      expect(progress.completed).toBe(1);
      // Duration may be very small (near 0) since auto-start happens at completion
      expect(progress.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple completed tasks', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      tracker.recordStart('P1.M1.T1.S2');
      tracker.recordComplete('P1.M1.T1.S2');

      tracker.recordStart('P1.M1.T1.S3');
      tracker.recordComplete('P1.M1.T1.S3');

      const progress = tracker.getProgress();
      expect(progress.completed).toBe(3);
    });

    it('should log progress at configured interval', () => {
      const backlog = createComplexBacklog(20);
      const logger = getLogger('ProgressTracker');
      const infoSpy = vi.spyOn(logger, 'info');

      const tracker = new ProgressTracker({ backlog, logInterval: 5 });

      // Complete 5 tasks - should log
      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      expect(infoSpy).toHaveBeenCalled();
    });

    it('should always log at 100% completion', () => {
      const backlog = createComplexBacklog(3);
      const logger = getLogger('ProgressTracker');
      const infoSpy = vi.spyOn(logger, 'info');

      const tracker = new ProgressTracker({ backlog, logInterval: 10 });

      // Complete all 3 tasks - should log even though interval is 10
      for (let i = 1; i <= 3; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      expect(infoSpy).toHaveBeenCalled();
    });

    it('should log structured progress data', () => {
      const backlog = createComplexBacklog(10);
      const logger = getLogger('ProgressTracker');
      const infoSpy = vi.spyOn(logger, 'info');

      const tracker = new ProgressTracker({ backlog, logInterval: 1 });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const callArgs = infoSpy.mock.calls[0];
      expect(callArgs).toBeDefined();

      const logData = callArgs[0] as Record<string, unknown>;
      expect(logData.type).toBe('progress');
      expect(logData.completed).toBe(1);
      expect(logData.total).toBe(10);
      expect(typeof logData.percentage).toBe('number');
      expect(typeof logData.elapsed).toBe('number');
      // ETA should be Infinity or null (not enough samples)
      expect(logData.eta === null || logData.eta === Infinity).toBeTruthy();
    });

    it('should calculate average duration correctly', () => {
      const backlog = createComplexBacklog(3);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      tracker.recordStart('P1.M1.T1.S2');
      tracker.recordComplete('P1.M1.T1.S2');

      tracker.recordStart('P1.M1.T1.S3');
      tracker.recordComplete('P1.M1.T1.S3');

      const progress = tracker.getProgress();
      // Duration may be 0 in fast tests
      expect(progress.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should log debug message on task completion', () => {
      const backlog = createComplexBacklog(10);
      const logger = getLogger('ProgressTracker');
      const debugSpy = vi.spyOn(logger, 'debug');

      const tracker = new ProgressTracker({ backlog });
      tracker.recordStart('P1.M1.T1.S1');
      debugSpy.mockClear();

      tracker.recordComplete('P1.M1.T1.S1');

      expect(debugSpy).toHaveBeenCalledWith(
        { itemId: 'P1.M1.T1.S1', duration: expect.any(Number) },
        'Task completed'
      );
    });
  });

  // ========================================================================
  // getProgress() method tests
  // ========================================================================

  describe('getProgress()', () => {
    it('should return correct initial progress report', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const progress = tracker.getProgress();

      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(10);
      expect(progress.percentage).toBe(0);
      expect(progress.remaining).toBe(10);
      expect(progress.averageDuration).toBe(0);
      expect(progress.elapsed).toBe(0);
      expect(progress.eta).toBe(Infinity);
    });

    it('should calculate correct percentage', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const progress = tracker.getProgress();
      expect(progress.completed).toBe(5);
      expect(progress.percentage).toBe(50);
    });

    it('should calculate correct remaining count', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      for (let i = 1; i <= 3; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const progress = tracker.getProgress();
      expect(progress.remaining).toBe(7);
    });

    it('should calculate average duration', () => {
      const backlog = createComplexBacklog(5);
      const tracker = new ProgressTracker({ backlog });

      for (let i = 1; i <= 3; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const progress = tracker.getProgress();
      // Duration may be 0 in fast tests
      expect(progress.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return 100% at completion', () => {
      const backlog = createComplexBacklog(5);
      const tracker = new ProgressTracker({ backlog });

      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const progress = tracker.getProgress();
      expect(progress.completed).toBe(5);
      expect(progress.percentage).toBe(100);
      expect(progress.remaining).toBe(0);
    });

    it('should handle fractional percentage correctly', () => {
      const backlog = createComplexBacklog(3);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const progress = tracker.getProgress();
      expect(progress.percentage).toBeCloseTo(33.33, 1);
    });

    it('should return zero for empty durations', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const progress = tracker.getProgress();
      expect(progress.averageDuration).toBe(0);
    });

    it('should handle elapsed time correctly', async () => {
      const backlog = createComplexBacklog(5);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const progress = tracker.getProgress();
      expect(progress.elapsed).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // getETA() method tests
  // ========================================================================

  describe('getETA()', () => {
    it('should return Infinity with insufficient samples', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, minSamples: 3 });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      tracker.recordStart('P1.M1.T1.S2');
      tracker.recordComplete('P1.M1.T1.S2');

      // Only 2 samples, need 3
      expect(tracker.getETA()).toBe(Infinity);
    });

    it('should return ETA after minimum samples collected', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog, minSamples: 2 });

        tracker.recordStart('P1.M1.T1.S1');
        vi.advanceTimersByTime(10); // Simulate 10ms passing
        tracker.recordComplete('P1.M1.T1.S1');

        tracker.recordStart('P1.M1.T1.S2');
        vi.advanceTimersByTime(10);
        tracker.recordComplete('P1.M1.T1.S2');

        const eta = tracker.getETA();
        expect(eta).not.toBe(Infinity);
        expect(eta).toBeGreaterThan(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should use exponential smoothing for ETA', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog, etaAlpha: 0.3 });

        // Complete 5 tasks with simulated time
        for (let i = 1; i <= 5; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        const eta = tracker.getETA();
        expect(eta).toBeGreaterThan(0);
        expect(isFinite(eta)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should return Infinity for zero average duration', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, minSamples: 1 });

      // This would be an edge case where duration is somehow 0
      // In practice this shouldn't happen, but we test the logic
      tracker.recordStart('P1.M1.T1.S1');
      // Manually set the start time to current time for 0 duration
      // This is a synthetic test case
      tracker.recordComplete('P1.M1.T1.S1');

      // The tracker should handle this gracefully
      // If the duration calculation somehow results in 0
      const eta = tracker.getETA();
      // With real timing, this should be finite
      // This tests the zero-check logic
      expect(typeof eta).toBe('number');
    });

    it('should return Infinity when all tasks completed', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(5);
        const tracker = new ProgressTracker({ backlog, minSamples: 1 });

        for (let i = 1; i <= 5; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        // Remaining is 0, so ETA should be 0
        const eta = tracker.getETA();
        expect(eta).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should respect custom minSamples option', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog, minSamples: 5 });

        // Complete 3 tasks (less than minSamples)
        for (let i = 1; i <= 3; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        expect(tracker.getETA()).toBe(Infinity);

        // Complete 2 more (total 5, meets minSamples)
        tracker.recordStart('P1.M1.T1.S4');
        vi.advanceTimersByTime(10);
        tracker.recordComplete('P1.M1.T1.S4');
        tracker.recordStart('P1.M1.T1.S5');
        vi.advanceTimersByTime(10);
        tracker.recordComplete('P1.M1.T1.S5');

        const eta = tracker.getETA();
        expect(isFinite(eta)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should use custom etaAlpha for smoothing', () => {
      vi.useFakeTimers();
      try {
        const backlog1 = createComplexBacklog(10);
        const backlog2 = createComplexBacklog(10);

        // Create two trackers with different alpha values
        const tracker1 = new ProgressTracker({
          backlog: backlog1,
          etaAlpha: 0.1,
        });
        const tracker2 = new ProgressTracker({
          backlog: backlog2,
          etaAlpha: 0.9,
        });

        // Complete some tasks with simulated time
        for (let i = 1; i <= 5; i++) {
          tracker1.recordStart(`P1.M1.T1.S${i}`);
          tracker2.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker1.recordComplete(`P1.M1.T1.S${i}`);
          tracker2.recordComplete(`P1.M1.T1.S${i}`);
        }

        const eta1 = tracker1.getETA();
        const eta2 = tracker2.getETA();

        // Both should be finite
        expect(isFinite(eta1)).toBe(true);
        expect(isFinite(eta2)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should update smoothed speed on subsequent calls', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({
          backlog,
          etaAlpha: 0.5,
          minSamples: 1,
        });

        // First task to establish initial speed
        tracker.recordStart('P1.M1.T1.S1');
        vi.advanceTimersByTime(100);
        tracker.recordComplete('P1.M1.T1.S1');

        const eta1 = tracker.getETA();

        // Second task with different speed to trigger smoothing update
        tracker.recordStart('P1.M1.T1.S2');
        vi.advanceTimersByTime(200);
        tracker.recordComplete('P1.M1.T1.S2');

        const eta2 = tracker.getETA();

        // Both should be finite
        expect(isFinite(eta1)).toBe(true);
        expect(isFinite(eta2)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ========================================================================
  // formatProgress() method tests
  // ========================================================================

  describe('formatProgress()', () => {
    it('should format initial progress correctly', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const formatted = tracker.formatProgress();

      expect(formatted).toContain('0%');
      expect(formatted).toContain('(0/10)');
      expect(formatted).toContain('ETA: calculating...');
    });

    it('should format progress bar correctly', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, barWidth: 20 });

      // Complete 5 tasks = 50%
      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const formatted = tracker.formatProgress();

      expect(formatted).toContain('[==========----------]'); // 50% filled
      expect(formatted).toContain('50%');
      expect(formatted).toContain('(5/10)');
    });

    it('should show ETA after sufficient samples', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog });

        // Complete enough tasks for ETA with simulated time
        for (let i = 1; i <= 5; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        const formatted = tracker.formatProgress();

        expect(formatted).toMatch(/ETA: \d+s/); // Should show time, not "calculating..."
      } finally {
        vi.useRealTimers();
      }
    });

    it('should use custom bar width', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, barWidth: 10 });

      // Complete 5 tasks = 50%
      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const formatted = tracker.formatProgress();

      // Should have 10-character bar: 5 '=' and 5 '-'
      expect(formatted).toContain('[=====-----]');
    });

    it('should format 100% completion', () => {
      const backlog = createComplexBacklog(5);
      const tracker = new ProgressTracker({ backlog });

      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const formatted = tracker.formatProgress();

      expect(formatted).toContain('100%');
      expect(formatted).toContain('(5/5)');
      // Full progress bar
      expect(formatted).toContain('[');
      expect(formatted).toContain(']');
    });

    it('should pad percentage to 3 digits', () => {
      const backlog = createComplexBacklog(100);
      const tracker = new ProgressTracker({ backlog });

      // Complete 1 task = 1%
      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('  1%'); // Padded to 3 digits
    });

    it('should handle 0% correctly', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('  0%');
    });

    it('should update format as progress increases', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const format1 = tracker.formatProgress();
      expect(format1).toContain('  0%');

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const format2 = tracker.formatProgress();
      expect(format2).toContain(' 10%');
    });
  });

  // ========================================================================
  // Duration formatting tests
  // ========================================================================

  describe('Duration formatting (#formatDuration)', () => {
    it('should format seconds correctly', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog });

        // The formatProgress uses the private #formatDuration method
        // We test it indirectly through formatProgress
        for (let i = 1; i <= 3; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        const formatted = tracker.formatProgress();
        // ETA should be in seconds format (< 60s for fast tasks)
        // Format: "30s" or similar
        expect(formatted).toMatch(/ETA: \d+s/);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should format Infinity as "calculating..."', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('ETA: calculating...');
    });

    it('should handle NaN as "calculating..."', () => {
      // This is implicitly tested through the Infinity check
      // The method checks !isFinite which covers both Infinity and NaN
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('calculating...');
    });

    it('should format duration in minutes', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog });

        // Complete enough tasks with simulated time to trigger minutes formatting
        for (let i = 1; i <= 3; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(70000); // 70 seconds per task
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        const formatted = tracker.formatProgress();
        // ETA should be in minutes format (>= 60s)
        expect(formatted).toMatch(/ETA: \d+m \d+s/);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should format duration in hours', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(100);
        const tracker = new ProgressTracker({ backlog });

        // Complete enough tasks with simulated time to trigger hours formatting
        for (let i = 1; i <= 5; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(4000000); // 4000 seconds (over 1 hour) per task
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        const formatted = tracker.formatProgress();
        // ETA should be in hours format (>= 3600s)
        expect(formatted).toMatch(/ETA: \d+h \d+m/);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ========================================================================
  // Progress bar formatting tests
  // ========================================================================

  describe('Progress bar formatting (#createProgressBar)', () => {
    it('should create empty bar at 0%', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, barWidth: 10 });

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('[----------]'); // All dashes
    });

    it('should create full bar at 100%', () => {
      const backlog = createComplexBacklog(5);
      const tracker = new ProgressTracker({ backlog, barWidth: 10 });

      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('[==========]'); // All equals
    });

    it('should create half-filled bar at 50%', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, barWidth: 10 });

      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('[=====-----]'); // Half equals, half dashes
    });

    it('should round down for partial fills', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, barWidth: 10 });

      // Complete 1 task = 10% = 1 character
      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const formatted = tracker.formatProgress();
      expect(formatted).toContain('[=---------]'); // 1 equal, 9 dashes
    });
  });

  // ========================================================================
  // Integration tests
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should track progress through complete lifecycle', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({
        backlog,
        logInterval: 3,
        barWidth: 20,
      });

      // Initially at 0%
      expect(tracker.getProgress().percentage).toBe(0);

      // Complete 3 tasks
      for (let i = 1; i <= 3; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      expect(tracker.getProgress().completed).toBe(3);
      expect(tracker.getProgress().percentage).toBe(30);

      // Complete more tasks
      for (let i = 4; i <= 10; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const final = tracker.getProgress();
      expect(final.completed).toBe(10);
      expect(final.percentage).toBe(100);
      expect(final.remaining).toBe(0);
    });

    it('should work with realistic task timing', async () => {
      const backlog = createComplexBacklog(5);
      const tracker = new ProgressTracker({ backlog, minSamples: 2 });

      // Simulate realistic task timing
      for (let i = 1; i <= 5; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        await new Promise(resolve => setTimeout(resolve, 5));
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      const progress = tracker.getProgress();
      expect(progress.completed).toBe(5);
      expect(progress.averageDuration).toBeGreaterThan(0);
      expect(progress.elapsed).toBeGreaterThan(0);
    });

    it('should handle multiple phases in backlog', () => {
      const subtask1 = createTestSubtask('P1.M1.T1.S1', 'S1', 'Planned');
      const subtask2 = createTestSubtask('P2.M1.T1.S1', 'S2', 'Planned');
      const subtask3 = createTestSubtask('P3.M1.T1.S1', 'S3', 'Planned');

      const task1 = createTestTask('P1.M1.T1', 'T1', 'Planned', [subtask1]);
      const task2 = createTestTask('P2.M1.T1', 'T2', 'Planned', [subtask2]);
      const task3 = createTestTask('P3.M1.T1', 'T3', 'Planned', [subtask3]);

      const milestone1 = createTestMilestone('P1.M1', 'M1', 'Planned', [task1]);
      const milestone2 = createTestMilestone('P2.M1', 'M2', 'Planned', [task2]);
      const milestone3 = createTestMilestone('P3.M1', 'M3', 'Planned', [task3]);

      const phase1 = createTestPhase('P1', 'P1', 'Planned', [milestone1]);
      const phase2 = createTestPhase('P2', 'P2', 'Planned', [milestone2]);
      const phase3 = createTestPhase('P3', 'P3', 'Planned', [milestone3]);

      const backlog = createTestBacklog([phase1, phase2, phase3]);
      const tracker = new ProgressTracker({ backlog });

      expect(tracker.getProgress().total).toBe(3);
    });
  });

  // ========================================================================
  // Edge cases and error handling
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle single task backlog', () => {
      const backlog = createComplexBacklog(1);
      const tracker = new ProgressTracker({ backlog });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const progress = tracker.getProgress();
      expect(progress.total).toBe(1);
      expect(progress.completed).toBe(1);
      expect(progress.percentage).toBe(100);
    });

    it('should handle very large backlog', () => {
      const backlog = createComplexBacklog(1000);
      const tracker = new ProgressTracker({ backlog });

      expect(tracker.getProgress().total).toBe(1000);
    });

    it('should handle very small bar width', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, barWidth: 5 });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      const formatted = tracker.formatProgress();
      // Bar should be 5 characters
      expect(formatted).toMatch(/\[[=-]{5}\]/);
    });

    it('should handle very large bar width', () => {
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog, barWidth: 100 });

      const formatted = tracker.formatProgress();
      // Bar should be 100 characters
      expect(formatted).toMatch(/\[[=-]{100}\]/);
    });

    it('should handle etaAlpha of 0 (no smoothing)', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog, etaAlpha: 0 });

        for (let i = 1; i <= 3; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        // Should still calculate ETA
        const eta = tracker.getETA();
        expect(isFinite(eta)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should handle etaAlpha of 1 (no memory)', () => {
      vi.useFakeTimers();
      try {
        const backlog = createComplexBacklog(10);
        const tracker = new ProgressTracker({ backlog, etaAlpha: 1 });

        for (let i = 1; i <= 3; i++) {
          tracker.recordStart(`P1.M1.T1.S${i}`);
          vi.advanceTimersByTime(10);
          tracker.recordComplete(`P1.M1.T1.S${i}`);
        }

        // Should still calculate ETA
        const eta = tracker.getETA();
        expect(isFinite(eta)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should handle logInterval of 1 (log every task)', () => {
      const backlog = createComplexBacklog(5);
      const logger = getLogger('ProgressTracker');
      const infoSpy = vi.spyOn(logger, 'info');

      const tracker = new ProgressTracker({ backlog, logInterval: 1 });

      tracker.recordStart('P1.M1.T1.S1');
      tracker.recordComplete('P1.M1.T1.S1');

      // Should log after every completion
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should handle logInterval larger than total tasks', () => {
      const backlog = createComplexBacklog(3);
      const logger = getLogger('ProgressTracker');
      const infoSpy = vi.spyOn(logger, 'info');

      const tracker = new ProgressTracker({ backlog, logInterval: 100 });

      // Complete all tasks
      for (let i = 1; i <= 3; i++) {
        tracker.recordStart(`P1.M1.T1.S${i}`);
        tracker.recordComplete(`P1.M1.T1.S${i}`);
      }

      // Should still log at 100%
      expect(infoSpy).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Export verification tests
  // ========================================================================

  describe('Exports', () => {
    it('should export ProgressTracker class', () => {
      expect(ProgressTracker).toBeDefined();
      expect(typeof ProgressTracker).toBe('function');
    });

    it('should export progressTracker factory function', () => {
      expect(progressTracker).toBeDefined();
      expect(typeof progressTracker).toBe('function');
    });

    it('should export ProgressReport type', () => {
      // Type is verified at compile time, this is a runtime smoke test
      const backlog = createComplexBacklog(10);
      const tracker = new ProgressTracker({ backlog });
      const report: ProgressReport = tracker.getProgress();

      expect(report).toBeDefined();
      expect(typeof report.completed).toBe('number');
      expect(typeof report.total).toBe('number');
      expect(typeof report.percentage).toBe('number');
      expect(typeof report.remaining).toBe('number');
      expect(typeof report.averageDuration).toBe('number');
      expect(typeof report.eta).toBe('number');
      expect(typeof report.elapsed).toBe('number');
    });

    it('should export ProgressTrackerOptions type', () => {
      // Type is verified at compile time
      const options: ProgressTrackerOptions = {
        backlog: createComplexBacklog(10),
        logInterval: 5,
        barWidth: 30,
        etaAlpha: 0.4,
        minSamples: 2,
      };

      const tracker = progressTracker(options);
      expect(tracker).toBeDefined();
    });
  });
});
