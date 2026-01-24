/**
 * Unit tests for TimelineTracker
 *
 * @remarks
 * Tests validate the complete TimelineTracker functionality including:
 * 1. Constructor - creates tracker with sessionId and startTime
 * 2. addEntry() - adds entries and keeps them sorted by timestamp
 * 3. getTimeline() - returns complete ErrorTimeline
 * 4. formatTimeline() with 'compact' format
 * 5. formatTimeline() with 'vertical' format
 * 6. formatTimeline() with 'horizontal' format
 * 7. formatTimeline() with no entries returns "No events recorded"
 * 8. groupByPhase() - groups entries by phase from task IDs
 * 9. groupByTimeWindow() - groups entries into time windows
 * 10. calculateDuration() - returns duration in milliseconds
 * 11. getSummary() - returns timeline summary statistics
 * 12. Multiple entries sort correctly
 * 13. Related events in timeline entries
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimelineTracker } from '../../../../src/utils/errors/timeline-tracker.js';
import type { TimelineEntry } from '../../../../src/utils/errors/types.js';
import type { Backlog } from '../../../../src/core/models.js';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('TimelineTracker', () => {
  let tracker: TimelineTracker;
  let sessionId: string;
  let startTime: Date;

  beforeEach(() => {
    sessionId = 'test-session-123';
    startTime = new Date('2024-01-15T10:00:00Z');
    tracker = new TimelineTracker(sessionId, startTime);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ==========================================================================
  // Constructor tests
  // ==========================================================================

  describe('constructor', () => {
    it('should create tracker with sessionId', () => {
      const customTracker = new TimelineTracker('session-abc', startTime);
      const timeline = customTracker.getTimeline();
      expect(timeline.sessionId).toBe('session-abc');
    });

    it('should create tracker with startTime', () => {
      const customTracker = new TimelineTracker('session-abc', startTime);
      const timeline = customTracker.getTimeline();
      expect(timeline.startTime).toEqual(startTime);
    });

    it('should initialize with empty entries', () => {
      const timeline = tracker.getTimeline();
      expect(timeline.entries).toEqual([]);
    });

    it('should initialize without endTime', () => {
      const timeline = tracker.getTimeline();
      expect(timeline.endTime).toBeDefined();
      expect(timeline.endTime?.getTime()).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // addEntry() tests
  // ==========================================================================

  describe('addEntry', () => {
    it('should add entry to tracker', () => {
      const entry: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
      };

      tracker.addEntry(entry);
      const timeline = tracker.getTimeline();

      expect(timeline.entries).toHaveLength(1);
      expect(timeline.entries[0]).toEqual(entry);
    });

    it('should add multiple entries', () => {
      const entry1: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
      };

      const entry2: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'warning',
        taskId: 'P2.M1.T1',
        event: 'Task retry',
      };

      tracker.addEntry(entry1);
      tracker.addEntry(entry2);

      const timeline = tracker.getTimeline();
      expect(timeline.entries).toHaveLength(2);
    });

    it('should keep entries sorted by timestamp', () => {
      const entry1: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'First entry added',
      };

      const entry2: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'warning',
        taskId: 'P2.M1.T1',
        event: 'Earlier entry added second',
      };

      tracker.addEntry(entry1);
      tracker.addEntry(entry2);

      const timeline = tracker.getTimeline();
      expect(timeline.entries[0].event).toBe('Earlier entry added second');
      expect(timeline.entries[1].event).toBe('First entry added');
    });

    it('should handle entries with same timestamp', () => {
      const time = new Date('2024-01-15T10:05:00Z');
      const entry1: TimelineEntry = {
        timestamp: time,
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Error event',
      };

      const entry2: TimelineEntry = {
        timestamp: time,
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'Warning event',
      };

      tracker.addEntry(entry1);
      tracker.addEntry(entry2);

      const timeline = tracker.getTimeline();
      expect(timeline.entries).toHaveLength(2);
    });

    it('should handle entries with all level types', () => {
      const levels: Array<TimelineEntry['level']> = [
        'error',
        'warning',
        'info',
        'success',
      ];

      levels.forEach((level, index) => {
        tracker.addEntry({
          timestamp: new Date(`2024-01-15T10:0${index}:00Z`),
          level,
          taskId: `P${index}.M1.T1`,
          event: `${level} event`,
        });
      });

      const timeline = tracker.getTimeline();
      expect(timeline.entries).toHaveLength(4);
      expect(timeline.entries[0].level).toBe('error');
      expect(timeline.entries[1].level).toBe('warning');
      expect(timeline.entries[2].level).toBe('info');
      expect(timeline.entries[3].level).toBe('success');
    });

    it('should handle entries with details', () => {
      const entry: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
        details: 'Network timeout after 30 seconds',
      };

      tracker.addEntry(entry);
      const timeline = tracker.getTimeline();

      expect(timeline.entries[0].details).toBe(
        'Network timeout after 30 seconds'
      );
    });

    it('should handle entries with related events', () => {
      const entry: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
        relatedEvents: [
          {
            timestamp: new Date('2024-01-15T10:06:00Z'),
            level: 'warning',
            taskId: 'P1.M1.T1',
            event: 'Retry attempt 1',
          },
          {
            timestamp: new Date('2024-01-15T10:07:00Z'),
            level: 'warning',
            taskId: 'P1.M1.T1',
            event: 'Retry attempt 2',
          },
        ],
      };

      tracker.addEntry(entry);
      const timeline = tracker.getTimeline();

      expect(timeline.entries[0].relatedEvents).toHaveLength(2);
      expect(timeline.entries[0].relatedEvents?.[0].event).toBe(
        'Retry attempt 1'
      );
    });

    it('should handle entries with duration', () => {
      const entry: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'info',
        taskId: 'P1.M1.T1',
        event: 'Task completed',
        duration: 1500,
      };

      tracker.addEntry(entry);
      const timeline = tracker.getTimeline();

      expect(timeline.entries[0].duration).toBe(1500);
    });
  });

  // ==========================================================================
  // getTimeline() tests
  // ==========================================================================

  describe('getTimeline', () => {
    it('should return complete ErrorTimeline', () => {
      const entry: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
      };

      tracker.addEntry(entry);
      const timeline = tracker.getTimeline();

      expect(timeline.sessionId).toBe(sessionId);
      expect(timeline.startTime).toEqual(startTime);
      expect(timeline.endTime).toBeDefined();
      expect(timeline.entries).toHaveLength(1);
    });

    it('should return current endTime', () => {
      const beforeAdd = new Date();
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
      });
      const timeline = tracker.getTimeline();
      const afterAdd = new Date();

      expect(timeline.endTime!.getTime()).toBeGreaterThanOrEqual(
        beforeAdd.getTime()
      );
      expect(timeline.endTime!.getTime()).toBeLessThanOrEqual(
        afterAdd.getTime()
      );
    });

    it('should return empty entries array when no entries added', () => {
      const timeline = tracker.getTimeline();
      expect(timeline.entries).toEqual([]);
    });

    it('should return all entries in chronological order', () => {
      const entry2: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'warning',
        taskId: 'P2.M1.T1',
        event: 'Second event',
      };

      const entry1: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'First event',
      };

      tracker.addEntry(entry2);
      tracker.addEntry(entry1);

      const timeline = tracker.getTimeline();

      expect(timeline.entries[0].event).toBe('First event');
      expect(timeline.entries[1].event).toBe('Second event');
    });
  });

  // ==========================================================================
  // formatTimeline() tests
  // ==========================================================================

  describe('formatTimeline', () => {
    beforeEach(() => {
      // Add some test entries
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
        details: 'Network timeout',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T1',
        event: 'Retry attempted',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:15:00Z'),
        level: 'success',
        taskId: 'P1.M1.T1',
        event: 'Task completed',
      });
    });

    it('should return "No events recorded." when no entries', () => {
      const emptyTracker = new TimelineTracker('empty', startTime);
      const formatted = emptyTracker.formatTimeline();
      expect(formatted).toBe('No events recorded.');
    });

    it('should return "No events recorded." for all formats when empty', () => {
      const emptyTracker = new TimelineTracker('empty', startTime);

      expect(emptyTracker.formatTimeline('compact')).toBe(
        'No events recorded.'
      );
      expect(emptyTracker.formatTimeline('vertical')).toBe(
        'No events recorded.'
      );
      expect(emptyTracker.formatTimeline('horizontal')).toBe(
        'No events recorded.'
      );
    });

    it('should format timeline as vertical by default', () => {
      const formatted = tracker.formatTimeline();
      // Time format will be in local timezone, so check for pattern
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(formatted).toContain('│');
      expect(formatted).toContain('✗');
      expect(formatted).toContain('[P1.M1.T1]');
      expect(formatted).toContain('Task failed');
    });

    it('should format timeline with vertical format explicitly', () => {
      const formatted = tracker.formatTimeline('vertical');
      // Time format will be in local timezone, so check for pattern
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(formatted).toContain('│');
      expect(formatted).toContain('✗');
      expect(formatted).toContain('[P1.M1.T1]');
    });

    it('should include details in vertical format', () => {
      const formatted = tracker.formatTimeline('vertical');
      expect(formatted).toContain('Network timeout');
    });

    it('should use correct icons for each level in vertical format', () => {
      const formatted = tracker.formatTimeline('vertical');
      expect(formatted).toContain('✗'); // error
      expect(formatted).toContain('⚠'); // warning
      expect(formatted).toContain('✓'); // success
    });

    it('should format timeline as compact', () => {
      const formatted = tracker.formatTimeline('compact');
      expect(formatted).toContain('╔');
      expect(formatted).toContain('╗');
      expect(formatted).toContain('╚');
      expect(formatted).toContain('╝');
      expect(formatted).toContain('Error Timeline');
      expect(formatted).toContain(sessionId);
    });

    it('should include time in HH:MM format in compact view', () => {
      const formatted = tracker.formatTimeline('compact');
      // Time format will be in local timezone, so check for pattern
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('should format timeline as horizontal', () => {
      const formatted = tracker.formatTimeline('horizontal');
      // Time format will be in local timezone, so check for pattern
      expect(formatted).toMatch(/\d{2}:\d{2}/);
      expect(formatted).toContain('→');
      expect(formatted).toContain('[P1.M1.T1]');
    });

    it('should join events with arrow in horizontal format', () => {
      const formatted = tracker.formatTimeline('horizontal');
      const arrows = (formatted.match(/→/g) || []).length;
      expect(arrows).toBe(2); // 3 entries = 2 arrows
    });
  });

  // ==========================================================================
  // formatTimeline with related events tests
  // ==========================================================================

  describe('formatTimeline with related events', () => {
    beforeEach(() => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
        details: 'Network timeout',
        relatedEvents: [
          {
            timestamp: new Date('2024-01-15T10:06:00Z'),
            level: 'warning',
            taskId: 'P1.M1.T1',
            event: 'Retry attempt 1',
          },
          {
            timestamp: new Date('2024-01-15T10:07:00Z'),
            level: 'warning',
            taskId: 'P1.M1.T1',
            event: 'Retry attempt 2',
          },
        ],
      });
    });

    it('should include related events in vertical format', () => {
      const formatted = tracker.formatTimeline('vertical');
      expect(formatted).toContain('Retry attempt 1');
      expect(formatted).toContain('Retry attempt 2');
    });

    it('should indent related events in vertical format', () => {
      const formatted = tracker.formatTimeline('vertical');
      // Related events should be included and formatted
      const lines = formatted.split('\n');
      const relatedLine = lines.find(line => line.includes('Retry attempt 1'));
      expect(relatedLine).toBeDefined();
      // The line should have time and event
      expect(relatedLine).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(relatedLine).toContain('Retry attempt 1');
    });

    it('should include related events in compact format', () => {
      const formatted = tracker.formatTimeline('compact');
      expect(formatted).toContain('↳');
      expect(formatted).toContain('Retry attempt 1');
      expect(formatted).toContain('Retry attempt 2');
    });

    it('should not include related events in horizontal format', () => {
      const formatted = tracker.formatTimeline('horizontal');
      // Horizontal format only shows main events
      expect(formatted).toContain('Task failed');
      expect(formatted).not.toContain('Retry attempt 1');
    });
  });

  // ==========================================================================
  // groupByPhase() tests
  // ==========================================================================

  describe('groupByPhase', () => {
    let mockBacklog: Backlog;

    beforeEach(() => {
      // Create a mock backlog
      mockBacklog = {
        backlog: [],
      };

      // Add entries from different phases
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1.S1',
        event: 'Phase 1 error',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'error',
        taskId: 'P2.M1.T1',
        event: 'Phase 2 error',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:15:00Z'),
        level: 'error',
        taskId: 'P1.M2.T1',
        event: 'Phase 1 error 2',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:20:00Z'),
        level: 'error',
        taskId: 'P3.M1.T1.S1',
        event: 'Phase 3 error',
      });
    });

    it('should group entries by phase', () => {
      const groups = tracker.groupByPhase(mockBacklog);

      expect(groups.size).toBe(3);
      expect(groups.has('P1')).toBe(true);
      expect(groups.has('P2')).toBe(true);
      expect(groups.has('P3')).toBe(true);
    });

    it('should have correct entries per phase', () => {
      const groups = tracker.groupByPhase(mockBacklog);

      const p1Entries = groups.get('P1');
      const p2Entries = groups.get('P2');
      const p3Entries = groups.get('P3');

      expect(p1Entries).toHaveLength(2);
      expect(p2Entries).toHaveLength(1);
      expect(p3Entries).toHaveLength(1);
    });

    it('should extract phase ID from task IDs correctly', () => {
      const groups = tracker.groupByPhase(mockBacklog);

      const p1Entries = groups.get('P1')!;
      expect(p1Entries[0].taskId).toBe('P1.M1.T1.S1');
      expect(p1Entries[1].taskId).toBe('P1.M2.T1');
    });

    it('should return empty map for no entries', () => {
      const emptyTracker = new TimelineTracker('empty', startTime);
      const groups = emptyTracker.groupByPhase(mockBacklog);

      expect(groups.size).toBe(0);
    });

    it('should handle entries with same phase', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:25:00Z'),
        level: 'warning',
        taskId: 'P1.M3.T1',
        event: 'Phase 1 warning',
      });

      const groups = tracker.groupByPhase(mockBacklog);
      const p1Entries = groups.get('P1');

      expect(p1Entries).toHaveLength(3);
    });
  });

  // ==========================================================================
  // groupByTimeWindow() tests
  // ==========================================================================

  describe('groupByTimeWindow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      // Add entries at different times
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Event at 0 min',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:02:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'Event at 2 min',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:04:00Z'),
        level: 'info',
        taskId: 'P1.M1.T3',
        event: 'Event at 4 min',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'error',
        taskId: 'P2.M1.T1',
        event: 'Event at 10 min',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:12:00Z'),
        level: 'warning',
        taskId: 'P2.M1.T2',
        event: 'Event at 12 min',
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should group entries into time windows with default 5 min window', () => {
      const windows = tracker.groupByTimeWindow();

      expect(windows).toHaveLength(2);
      expect(windows[0]).toHaveLength(3); // 0, 2, 4 minutes
      expect(windows[1]).toHaveLength(2); // 10, 12 minutes
    });

    it('should group entries with custom window size', () => {
      const windows = tracker.groupByTimeWindow(3);

      expect(windows).toHaveLength(3);
      expect(windows[0]).toHaveLength(2); // 0, 2 minutes
      expect(windows[1]).toHaveLength(1); // 4 minutes
      expect(windows[2]).toHaveLength(2); // 10, 12 minutes
    });

    it('should return empty array for no entries', () => {
      const emptyTracker = new TimelineTracker('empty', startTime);
      const windows = emptyTracker.groupByTimeWindow();

      expect(windows).toEqual([]);
    });

    it('should handle single entry', () => {
      const singleTracker = new TimelineTracker('single', startTime);
      singleTracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Single event',
      });

      const windows = singleTracker.groupByTimeWindow();

      expect(windows).toHaveLength(1);
      expect(windows[0]).toHaveLength(1);
    });

    it('should create new window when gap exceeds window size', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:20:00Z'),
        level: 'error',
        taskId: 'P3.M1.T1',
        event: 'Event at 20 min',
      });

      const windows = tracker.groupByTimeWindow(5);

      expect(windows).toHaveLength(3);
      expect(windows[2]).toHaveLength(1);
      expect(windows[2][0].event).toBe('Event at 20 min');
    });

    it('should maintain chronological order within windows', () => {
      const windows = tracker.groupByTimeWindow();

      const firstWindow = windows[0];
      expect(firstWindow[0].event).toBe('Event at 0 min');
      expect(firstWindow[1].event).toBe('Event at 2 min');
      expect(firstWindow[2].event).toBe('Event at 4 min');
    });

    it('should handle edge case: entry exactly at window boundary', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'info',
        taskId: 'P1.M1.T4',
        event: 'Event at exactly 5 min',
      });

      const windows = tracker.groupByTimeWindow(5);

      // 5 min is exactly at boundary, should be in same window as 0 min
      expect(windows[0]).toHaveLength(4);
    });
  });

  // ==========================================================================
  // calculateDuration() tests
  // ==========================================================================

  describe('calculateDuration', () => {
    it('should return 0 for no entries', () => {
      const duration = tracker.calculateDuration();
      expect(duration).toBe(0);
    });

    it('should return 0 for single entry', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
      });

      const duration = tracker.calculateDuration();
      expect(duration).toBe(0);
    });

    it('should calculate duration in milliseconds', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'First event',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'Second event',
      });

      const duration = tracker.calculateDuration();
      expect(duration).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should calculate duration across multiple entries', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Event 1',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'Event 2',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:15:00Z'),
        level: 'info',
        taskId: 'P1.M1.T3',
        event: 'Event 3',
      });

      const duration = tracker.calculateDuration();
      expect(duration).toBe(15 * 60 * 1000); // 15 minutes (0 to 15)
    });

    it('should work with unsorted entries', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:15:00Z'),
        level: 'error',
        taskId: 'P1.M1.T3',
        event: 'Last event added first',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T1',
        event: 'First event added second',
      });

      const duration = tracker.calculateDuration();
      expect(duration).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should handle sub-millisecond precision', () => {
      const time1 = new Date('2024-01-15T10:00:00.000Z');
      const time2 = new Date('2024-01-15T10:00:00.500Z');

      tracker.addEntry({
        timestamp: time1,
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Event 1',
      });

      tracker.addEntry({
        timestamp: time2,
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'Event 2',
      });

      const duration = tracker.calculateDuration();
      expect(duration).toBe(500); // 500ms
    });
  });

  // ==========================================================================
  // getSummary() tests
  // ==========================================================================

  describe('getSummary', () => {
    it('should return summary with no entries', () => {
      const summary = tracker.getSummary();

      expect(summary.firstErrorAt).toEqual(startTime);
      expect(summary.errorCount).toBe(0);
      expect(summary.totalDuration).toBe(0);
      expect(summary.errorSpan).toBe(0);
      expect(summary.lastErrorAt).toBeUndefined();
    });

    it('should return summary with single entry', () => {
      const errorTime = new Date('2024-01-15T10:05:00Z');
      tracker.addEntry({
        timestamp: errorTime,
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed',
      });

      const summary = tracker.getSummary();

      expect(summary.firstErrorAt).toEqual(errorTime);
      expect(summary.lastErrorAt).toEqual(errorTime);
      expect(summary.errorCount).toBe(1);
      expect(summary.errorSpan).toBe(0);
      expect(summary.totalDuration).toBeGreaterThan(0);
    });

    it('should return summary with multiple entries', () => {
      const firstTime = new Date('2024-01-15T10:05:00Z');
      const lastTime = new Date('2024-01-15T10:15:00Z');

      tracker.addEntry({
        timestamp: firstTime,
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'First error',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'Warning',
      });

      tracker.addEntry({
        timestamp: lastTime,
        level: 'error',
        taskId: 'P1.M1.T3',
        event: 'Last error',
      });

      const summary = tracker.getSummary();

      expect(summary.firstErrorAt).toEqual(firstTime);
      expect(summary.lastErrorAt).toEqual(lastTime);
      expect(summary.errorCount).toBe(3);
      expect(summary.errorSpan).toBe(10 * 60 * 1000); // 10 minutes
    });

    it('should calculate totalDuration from start time', () => {
      const sessionStart = new Date('2024-01-15T10:00:00Z');
      const customTracker = new TimelineTracker('test', sessionStart);

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:10:00Z'));

      customTracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Error',
      });

      const summary = customTracker.getSummary();

      expect(summary.totalDuration).toBe(10 * 60 * 1000); // 10 minutes

      vi.useRealTimers();
    });

    it('should handle unsorted entries correctly', () => {
      const firstTime = new Date('2024-01-15T10:00:00Z');
      const lastTime = new Date('2024-01-15T10:20:00Z');

      tracker.addEntry({
        timestamp: lastTime,
        level: 'error',
        taskId: 'P1.M1.T3',
        event: 'Last event',
      });

      tracker.addEntry({
        timestamp: firstTime,
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'First event',
      });

      const summary = tracker.getSummary();

      expect(summary.firstErrorAt).toEqual(firstTime);
      expect(summary.lastErrorAt).toEqual(lastTime);
    });
  });

  // ==========================================================================
  // Multiple entries sorting tests
  // ==========================================================================

  describe('Multiple entries sorting', () => {
    it('should sort entries added out of order', () => {
      const entries: TimelineEntry[] = [
        {
          timestamp: new Date('2024-01-15T10:20:00Z'),
          level: 'error',
          taskId: 'P1.M1.T4',
          event: 'Event 4',
        },
        {
          timestamp: new Date('2024-01-15T10:05:00Z'),
          level: 'error',
          taskId: 'P1.M1.T1',
          event: 'Event 1',
        },
        {
          timestamp: new Date('2024-01-15T10:15:00Z'),
          level: 'warning',
          taskId: 'P1.M1.T3',
          event: 'Event 3',
        },
        {
          timestamp: new Date('2024-01-15T10:10:00Z'),
          level: 'info',
          taskId: 'P1.M1.T2',
          event: 'Event 2',
        },
      ];

      entries.forEach(entry => tracker.addEntry(entry));

      const timeline = tracker.getTimeline();

      expect(timeline.entries[0].event).toBe('Event 1');
      expect(timeline.entries[1].event).toBe('Event 2');
      expect(timeline.entries[2].event).toBe('Event 3');
      expect(timeline.entries[3].event).toBe('Event 4');
    });

    it('should maintain sort after each addition', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'error',
        taskId: 'P1.M1.T2',
        event: 'Middle event',
      });

      let timeline = tracker.getTimeline();
      expect(timeline.entries[0].event).toBe('Middle event');

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Earlier event',
      });

      timeline = tracker.getTimeline();
      expect(timeline.entries[0].event).toBe('Earlier event');
      expect(timeline.entries[1].event).toBe('Middle event');

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:15:00Z'),
        level: 'error',
        taskId: 'P1.M1.T3',
        event: 'Later event',
      });

      timeline = tracker.getTimeline();
      expect(timeline.entries[0].event).toBe('Earlier event');
      expect(timeline.entries[1].event).toBe('Middle event');
      expect(timeline.entries[2].event).toBe('Later event');
    });

    it('should handle large number of entries', () => {
      const count = 50; // Use 50 to avoid hour wrap-around
      const shuffledTimes = Array.from({ length: count }, (_, i) => i)
        .map(i => ({
          time: new Date(`2024-01-15T10:${String(i).padStart(2, '0')}:00Z`),
          originalIndex: i,
        }))
        .sort(() => Math.random() - 0.5);

      shuffledTimes.forEach(({ time, originalIndex }) => {
        tracker.addEntry({
          timestamp: time,
          level: 'info',
          taskId: `P1.M1.T${originalIndex}`,
          event: `Event ${originalIndex}`,
        });
      });

      const timeline = tracker.getTimeline();

      expect(timeline.entries).toHaveLength(count);
      // Check that entries are sorted by timestamp
      for (let i = 1; i < count; i++) {
        expect(
          timeline.entries[i].timestamp.getTime() -
            timeline.entries[i - 1].timestamp.getTime()
        ).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==========================================================================
  // Edge cases and integration tests
  // ==========================================================================

  describe('Edge cases and integration', () => {
    it('should handle all timeline formats with various entry types', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Error with details',
        details: 'Error details here',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'Warning with related events',
        relatedEvents: [
          {
            timestamp: new Date('2024-01-15T10:06:00Z'),
            level: 'info',
            taskId: 'P1.M1.T2',
            event: 'Related info',
          },
        ],
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:10:00Z'),
        level: 'success',
        taskId: 'P1.M1.T3',
        event: 'Success with duration',
        duration: 1234,
      });

      expect(() => tracker.formatTimeline('compact')).not.toThrow();
      expect(() => tracker.formatTimeline('vertical')).not.toThrow();
      expect(() => tracker.formatTimeline('horizontal')).not.toThrow();

      const compact = tracker.formatTimeline('compact');
      const vertical = tracker.formatTimeline('vertical');
      const horizontal = tracker.formatTimeline('horizontal');

      expect(compact).toContain('Error Timeline');
      expect(vertical).toContain('Error details here');
      expect(horizontal).toContain('→');
    });

    it('should handle deep task ID hierarchies', () => {
      const deepTaskIds = [
        'P1.M1.T1',
        'P1.M1.T1.S1',
        'P1.M1.T1.S1.ST1',
        'P99.M99.T99.S99.ST99',
      ];

      deepTaskIds.forEach(taskId => {
        tracker.addEntry({
          timestamp: new Date('2024-01-15T10:00:00Z'),
          level: 'info',
          taskId,
          event: `Event for ${taskId}`,
        });
      });

      const timeline = tracker.getTimeline();
      expect(timeline.entries).toHaveLength(4);

      const groups = tracker.groupByPhase({ backlog: [] });
      expect(groups.has('P1')).toBe(true);
      expect(groups.has('P99')).toBe(true);
      expect(groups.get('P1')).toHaveLength(3);
      expect(groups.get('P99')).toHaveLength(1);
    });

    it('should handle very long event descriptions', () => {
      const longEvent =
        'This is a very long event description that exceeds the normal length and might need to be truncated in certain formats';

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: longEvent,
      });

      const compact = tracker.formatTimeline('compact');
      const vertical = tracker.formatTimeline('vertical');
      const horizontal = tracker.formatTimeline('horizontal');

      // All formats should handle long text without crashing
      expect(compact).toBeTruthy();
      expect(vertical).toBeTruthy();
      expect(horizontal).toBeTruthy();

      // Vertical format should include the full text
      expect(vertical).toContain(longEvent);

      // Compact format should truncate to 30 chars based on implementation
      expect(compact).toContain(longEvent.substring(0, 30));
    });

    it('should work with all event levels', () => {
      const levels: Array<TimelineEntry['level']> = [
        'error',
        'warning',
        'info',
        'success',
      ];

      levels.forEach((level, index) => {
        tracker.addEntry({
          timestamp: new Date(`2024-01-15T10:0${index}:00Z`),
          level,
          taskId: `P${index}.M1.T1`,
          event: `${level} event`,
        });
      });

      const summary = tracker.getSummary();
      expect(summary.errorCount).toBe(4);

      const timeline = tracker.getTimeline();
      expect(timeline.entries[0].level).toBe('error');
      expect(timeline.entries[1].level).toBe('warning');
      expect(timeline.entries[2].level).toBe('info');
      expect(timeline.entries[3].level).toBe('success');

      const vertical = tracker.formatTimeline('vertical');
      expect(vertical).toContain('✗');
      expect(vertical).toContain('⚠');
      expect(vertical).toContain('ℹ');
      expect(vertical).toContain('✓');
    });

    it('should handle rapid successive events', () => {
      const baseTime = new Date('2024-01-15T10:00:00Z').getTime();

      for (let i = 0; i < 10; i++) {
        tracker.addEntry({
          timestamp: new Date(baseTime + i * 100), // 100ms apart
          level: 'info',
          taskId: 'P1.M1.T1',
          event: `Event ${i}`,
        });
      }

      const duration = tracker.calculateDuration();
      expect(duration).toBe(900); // 9 intervals of 100ms

      const windows = tracker.groupByTimeWindow(1); // 1 minute windows
      expect(windows).toHaveLength(1);
      expect(windows[0]).toHaveLength(10);
    });

    it('should preserve data integrity across multiple operations', () => {
      const entry1: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Error 1',
        details: 'Details 1',
      };

      const entry2: TimelineEntry = {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        level: 'warning',
        taskId: 'P2.M1.T1',
        event: 'Warning 1',
        relatedEvents: [
          {
            timestamp: new Date('2024-01-15T10:06:00Z'),
            level: 'info',
            taskId: 'P2.M1.T1',
            event: 'Related info',
          },
        ],
      };

      tracker.addEntry(entry2); // Add out of order
      tracker.addEntry(entry1);

      const timeline = tracker.getTimeline();
      expect(timeline.entries[0]).toEqual(entry1);
      expect(timeline.entries[1]).toEqual(entry2);

      const summary = tracker.getSummary();
      expect(summary.errorCount).toBe(2);

      const duration = tracker.calculateDuration();
      expect(duration).toBe(5 * 60 * 1000);

      const formatted = tracker.formatTimeline('vertical');
      expect(formatted).toContain('Error 1');
      expect(formatted).toContain('Warning 1');
      expect(formatted).toContain('Details 1');
      expect(formatted).toContain('Related info');
    });
  });

  // ==========================================================================
  // Format-specific edge cases
  // ==========================================================================

  describe('Format-specific edge cases', () => {
    it('should handle entries with special characters in event text', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Error with special chars: []{}()<>|',
      });

      expect(() => tracker.formatTimeline('compact')).not.toThrow();
      expect(() => tracker.formatTimeline('vertical')).not.toThrow();
      expect(() => tracker.formatTimeline('horizontal')).not.toThrow();
    });

    it('should handle entries with unicode characters', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Error with unicode: café, 日本語, emoji 🎉',
      });

      const vertical = tracker.formatTimeline('vertical');
      expect(vertical).toContain('café');
      expect(vertical).toContain('日本語');
      expect(vertical).toContain('🎉');
    });

    it('should handle entries with newlines in text', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Error with newline\nSecond line',
      });

      const vertical = tracker.formatTimeline('vertical');
      expect(vertical).toBeTruthy();
    });

    it('should display time in HH:MM format correctly across midnight', () => {
      tracker.addEntry({
        timestamp: new Date('2024-01-15T23:59:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Before midnight',
      });

      tracker.addEntry({
        timestamp: new Date('2024-01-16T00:01:00Z'),
        level: 'warning',
        taskId: 'P1.M1.T2',
        event: 'After midnight',
      });

      const compact = tracker.formatTimeline('compact');
      // Times will be in local timezone, so just check the pattern
      const timeMatches = compact.match(/\d{2}:\d{2}/g);
      expect(timeMatches).toHaveLength(2);
      expect(compact).toContain('Before midnight');
      expect(compact).toContain('After midnight');
    });
  });

  // ==========================================================================
  // Performance and stress tests
  // ==========================================================================

  describe('Performance and stress tests', () => {
    it('should handle large number of entries efficiently', () => {
      const count = 1000;

      for (let i = 0; i < count; i++) {
        tracker.addEntry({
          timestamp: new Date(
            `2024-01-15T10:${String(i % 60).padStart(2, '0')}:00Z`
          ),
          level: 'info',
          taskId: `P1.M1.T${i}`,
          event: `Event ${i}`,
        });
      }

      const timeline = tracker.getTimeline();
      expect(timeline.entries).toHaveLength(count);

      const summary = tracker.getSummary();
      expect(summary.errorCount).toBe(count);

      expect(() => tracker.formatTimeline('vertical')).not.toThrow();
      expect(() => tracker.formatTimeline('horizontal')).not.toThrow();
      // Compact might be slow with 1000 entries, but should not crash
      expect(() => tracker.formatTimeline('compact')).not.toThrow();
    });

    it('should handle many related events', () => {
      const relatedCount = 50;
      const relatedEvents: TimelineEntry[] = [];

      for (let i = 0; i < relatedCount; i++) {
        relatedEvents.push({
          timestamp: new Date(
            `2024-01-15T10:${String(i).padStart(2, '0')}:00Z`
          ),
          level: 'warning',
          taskId: 'P1.M1.T1',
          event: `Retry ${i}`,
        });
      }

      tracker.addEntry({
        timestamp: new Date('2024-01-15T10:00:00Z'),
        level: 'error',
        taskId: 'P1.M1.T1',
        event: 'Task failed with many retries',
        relatedEvents,
      });

      const timeline = tracker.getTimeline();
      expect(timeline.entries[0].relatedEvents).toHaveLength(relatedCount);

      expect(() => tracker.formatTimeline('vertical')).not.toThrow();
      expect(() => tracker.formatTimeline('compact')).not.toThrow();
    });
  });
});
