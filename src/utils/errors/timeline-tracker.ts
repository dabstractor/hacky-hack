/**
 * Timeline tracking and formatting for error events
 *
 * @module utils/errors/timeline-tracker
 *
 * @remarks
 * Tracks error events chronologically and formats them for display in reports.
 * Groups events by phase and time windows for analysis.
 *
 * @example
 * ```typescript
 * import { TimelineTracker } from './timeline-tracker.js';
 *
 * const tracker = new TimelineTracker('session123', new Date());
 * tracker.addEntry({
 *   timestamp: new Date(),
 *   level: 'error',
 *   taskId: 'P1.M1.T1.S1',
 *   event: 'Task failed'
 * });
 * console.log(tracker.formatTimeline('vertical'));
 * ```
 */

import type {
  TimelineEntry,
  ErrorTimeline,
  TimelineFormat,
  TimelineSummary,
} from './types.js';
import type { Backlog } from '../../core/models.js';

/**
 * Icon mappings for timeline event levels
 */
const TIMELINE_ICONS = {
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  success: '✓',
} as const;

/**
 * Timeline tracker for error chronology
 *
 * @remarks
 * Maintains a chronological list of error events and provides formatting
 * options for display in reports. Supports compact, vertical, and horizontal formats.
 */
export class TimelineTracker {
  #entries: TimelineEntry[] = [];
  #sessionId: string;
  #startTime: Date;

  /**
   * Create a new timeline tracker
   *
   * @param sessionId - Session identifier
   * @param startTime - Session start time
   */
  constructor(sessionId: string, startTime: Date) {
    this.#sessionId = sessionId;
    this.#startTime = startTime;
  }

  /**
   * Add a timeline entry
   *
   * @param entry - Timeline entry to add
   *
   * @remarks
   * Entries are automatically sorted by timestamp after addition.
   */
  addEntry(entry: TimelineEntry): void {
    this.#entries.push(entry);
    // Keep entries sorted by timestamp
    this.#entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get the complete error timeline
   *
   * @returns Complete timeline with all entries
   */
  getTimeline(): ErrorTimeline {
    return {
      sessionId: this.#sessionId,
      startTime: this.#startTime,
      endTime: new Date(),
      entries: this.#entries,
    };
  }

  /**
   * Format timeline for display
   *
   * @param format - Format style (compact, vertical, horizontal)
   * @returns Formatted timeline string
   *
   * @remarks
   * - compact: Boxed format with width constraints
   * - vertical: Vertical timeline with indentation for related events (default)
   * - horizontal: Single-line format
   */
  formatTimeline(format: TimelineFormat = 'vertical'): string {
    if (this.#entries.length === 0) {
      return 'No events recorded.';
    }

    switch (format) {
      case 'compact':
        return this.#formatCompact();
      case 'horizontal':
        return this.#formatHorizontal();
      case 'vertical':
      default:
        return this.#formatVertical();
    }
  }

  /**
   * Group entries by phase
   *
   * @param backlog - Task hierarchy for phase lookup
   * @returns Map of phase ID to entries
   *
   * @remarks
   * Groups timeline entries by their parent phase based on task ID prefix.
   */
  groupByPhase(_backlog: Backlog): Map<string, TimelineEntry[]> {
    const groups = new Map<string, TimelineEntry[]>();

    for (const entry of this.#entries) {
      const phaseId = entry.taskId.split('.')[0];
      if (!groups.has(phaseId)) {
        groups.set(phaseId, []);
      }
      groups.get(phaseId)!.push(entry);
    }

    return groups;
  }

  /**
   * Group entries by time window
   *
   * @param windowMinutes - Window size in minutes (default: 5)
   * @returns Array of entry groups
   *
   * @remarks
   * Groups entries into time windows for pattern analysis. Useful for
   * identifying error clusters.
   */
  groupByTimeWindow(windowMinutes: number = 5): TimelineEntry[][] {
    if (this.#entries.length === 0) return [];

    const windows: TimelineEntry[][] = [];
    const windowMs = windowMinutes * 60 * 1000;

    let currentWindow: TimelineEntry[] = [this.#entries[0]];
    let windowStart = this.#entries[0].timestamp.getTime();

    for (let i = 1; i < this.#entries.length; i++) {
      const entry = this.#entries[i];
      const entryTime = entry.timestamp.getTime();

      if (entryTime - windowStart <= windowMs) {
        currentWindow.push(entry);
      } else {
        windows.push(currentWindow);
        currentWindow = [entry];
        windowStart = entryTime;
      }
    }

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  /**
   * Calculate total timeline duration
   *
   * @returns Duration in milliseconds
   */
  calculateDuration(): number {
    if (this.#entries.length === 0) return 0;

    const first = this.#entries[0].timestamp.getTime();
    const last = this.#entries[this.#entries.length - 1].timestamp.getTime();
    return last - first;
  }

  /**
   * Get timeline summary statistics
   *
   * @returns Summary of timeline data
   */
  getSummary(): TimelineSummary {
    if (this.#entries.length === 0) {
      return {
        firstErrorAt: this.#startTime,
        errorCount: 0,
        totalDuration: 0,
        errorSpan: 0,
      };
    }

    const firstError = this.#entries[0].timestamp;
    const lastError = this.#entries[this.#entries.length - 1].timestamp;

    return {
      firstErrorAt: firstError,
      lastErrorAt: lastError,
      errorCount: this.#entries.length,
      totalDuration: new Date().getTime() - this.#startTime.getTime(),
      errorSpan: lastError.getTime() - firstError.getTime(),
    };
  }

  /**
   * Format timeline as vertical with indentation
   */
  #formatVertical(): string {
    const lines: string[] = [];

    for (const entry of this.#entries) {
      const time = entry.timestamp.toTimeString().split(' ')[0];
      const icon = this.#getIcon(entry.level);

      lines.push(`${time}  │  ${icon}  [${entry.taskId}] ${entry.event}`);

      if (entry.details) {
        lines.push(`          │     ${entry.details}`);
      }

      if (entry.relatedEvents && entry.relatedEvents.length > 0) {
        for (const related of entry.relatedEvents) {
          const relTime = related.timestamp.toTimeString().split(' ')[0];
          const relIcon = this.#getIcon(related.level);
          lines.push(`          │     ${relTime} ${relIcon} ${related.event}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format timeline as compact boxed format
   */
  #formatCompact(): string {
    const lines: string[] = [];
    const width = 63;

    lines.push('╔' + '═'.repeat(width) + '╗');
    lines.push(
      '║ ' +
        `Error Timeline: Session ${this.#sessionId}`.padEnd(width - 1) +
        '║'
    );
    lines.push('╠' + '═'.repeat(width) + '╣');
    lines.push('║' + ' '.repeat(width) + '║');

    for (const entry of this.#entries) {
      const time = this.#formatTime(entry.timestamp);
      const icon = this.#getIcon(entry.level);
      const taskId = entry.taskId.padEnd(18);
      const event = entry.event.substring(0, 30);

      lines.push(`║ ${time} ${icon}  [${taskId}] ${event.padEnd(30)} ║`);

      if (entry.relatedEvents && entry.relatedEvents.length > 0) {
        for (const related of entry.relatedEvents) {
          const relTime = this.#formatTime(related.timestamp);
          const relIcon = this.#getIcon(related.level);
          const relEvent = related.event.substring(0, 35);
          lines.push(
            `║         ↳ ${relTime} ${relIcon} ${relEvent.padEnd(48)} ║`
          );
        }
      }
    }

    lines.push('║' + ' '.repeat(width) + '║');
    lines.push('╚' + '═'.repeat(width) + '╝');

    return lines.join('\n');
  }

  /**
   * Format timeline as horizontal single-line
   */
  #formatHorizontal(): string {
    const parts: string[] = [];

    for (const entry of this.#entries) {
      const time = this.#formatTime(entry.timestamp);
      const icon = this.#getIcon(entry.level);
      parts.push(`${time} ${icon} [${entry.taskId}] ${entry.event}`);
    }

    return parts.join(' → ');
  }

  /**
   * Format time as HH:MM
   */
  #formatTime(timestamp: Date): string {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Get icon for event level
   */
  #getIcon(level: TimelineEntry['level']): string {
    return TIMELINE_ICONS[level] || '•';
  }
}
