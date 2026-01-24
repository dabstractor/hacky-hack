/**
 * Type definitions for enhanced error reporting
 *
 * @module utils/errors/types
 *
 * @remarks
 * Provides comprehensive types for error reporting including timeline tracking,
 * impact analysis, fix suggestions, and resume command generation. These types
 * support the enhanced ERROR_REPORT.md generation in PRPPipeline.
 *
 * @example
 * ```typescript
 * import type { TimelineEntry, TaskImpact, SuggestedFix } from './types.js';
 *
 * const entry: TimelineEntry = {
 *   timestamp: new Date(),
 *   level: 'error',
 *   taskId: 'P1.M1.T1.S1',
 *   event: 'Task execution failed'
 * };
 * ```
 */

import type { Backlog } from '../../core/models.js';

/**
 * TaskFailure interface from PRPPipeline
 *
 * @remarks
 * This interface matches the structure used in PRPPipeline.#failedTasks Map.
 * It captures all information about a task failure including error details,
 * timestamp, and hierarchy context.
 */
export interface TaskFailure {
  /** Unique task identifier (e.g., 'P1.M1.T1.S1') */
  taskId: string;
  /** Human-readable task title */
  taskTitle: string;
  /** The error that caused the failure */
  error: Error;
  /** Optional error code for programmatic handling */
  errorCode?: string;
  /** When the failure occurred */
  timestamp: Date;
  /** Phase containing the failed task */
  phase?: string;
  /** Milestone containing the failed task */
  milestone?: string;
}

/**
 * Timeline entry for error chronology
 *
 * @remarks
 * Represents a single event in the error timeline. Events can be errors,
 * warnings, info messages, or successes. Related events (like retries) can
 * be nested within a parent event.
 */
export interface TimelineEntry {
  /** Timestamp of the event */
  timestamp: Date;
  /** Event severity level */
  level: 'error' | 'warning' | 'info' | 'success';
  /** Task ID associated with event */
  taskId: string;
  /** Event description */
  event: string;
  /** Optional additional details */
  details?: string;
  /** Related events (retries, resolutions) */
  relatedEvents?: TimelineEntry[];
  /** Duration of the event in milliseconds (if applicable) */
  duration?: number;
}

/**
 * Complete error timeline for a session
 *
 * @remarks
 * Contains all timeline entries for a session, sorted chronologically.
 * Provides context for understanding when errors occurred and their relationships.
 */
export interface ErrorTimeline {
  /** Session identifier */
  sessionId: string;
  /** Session start time */
  startTime: Date;
  /** Session end time (if completed) */
  endTime?: Date;
  /** All timeline entries in chronological order */
  entries: TimelineEntry[];
}

/**
 * Source code context around error location
 *
 * @remarks
 * Captures the source code lines surrounding an error for better debugging.
 * Shows 3-5 lines of code with the error line highlighted.
 */
export interface SourceContext {
  /** File path where error occurred */
  file: string;
  /** Line number */
  line: number;
  /** Column number */
  column?: number;
  /** Source code lines around error (3-5 lines) */
  codeLines: string[];
  /** The specific error line index in codeLines */
  errorLineIndex: number;
}

/**
 * Stack trace frame with relevance scoring
 *
 * @remarks
 * Represents a single frame in a stack trace with metadata for determining
 * relevance. User code frames are scored higher than library frames.
 */
export interface StackFrame {
  /** Function name */
  functionName: string;
  /** File path */
  filePath: string;
  /** Line number */
  line: number;
  /** Column number */
  column?: number;
  /** Whether this is user code (true) or library code (false) */
  isUserCode: boolean;
  /** Relevance score (0-1, higher is more relevant) */
  relevanceScore: number;
}

/**
 * Formatted stack trace with context
 *
 * @remarks
 * Contains a parsed and formatted stack trace with source context for the
 * most relevant frame. Frames are sorted by relevance score.
 */
export interface FormattedStackTrace {
  /** Error message */
  message: string;
  /** Error type/name */
  errorType: string;
  /** Stack frames sorted by relevance */
  frames: StackFrame[];
  /** Source context for most relevant frame */
  sourceContext?: SourceContext;
}

/**
 * Task impact level
 *
 * @remarks
 * Indicates the severity of impact from a task failure. Critical impact
 * means multiple phases are blocked, while none means no downstream effects.
 */
export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

/**
 * Suggested action based on impact analysis
 *
 * @remarks
 * Recommends what action to take based on the impact level and whether
 * the pipeline can continue with this failure.
 */
export type SuggestedAction = 'pause' | 'retry' | 'skip' | 'continue';

/**
 * Impact analysis for a failed task
 *
 * @remarks
 * Analyzes the downstream effects of a task failure, including which tasks
 * are blocked, what milestones are affected, and whether the pipeline can continue.
 */
export interface TaskImpact {
  /** Impact severity level */
  level: ImpactLevel;
  /** Tasks directly affected by this failure */
  affectedTasks: string[];
  /** Phases blocked by this failure */
  blockedPhases: string[];
  /** Milestones blocked by this failure */
  blockedMilestones: string[];
  /** Tasks blocked by this failure */
  blockedTasks: string[];
  /** Whether pipeline can continue with this failure */
  canContinue: boolean;
  /** Suggested action based on impact */
  suggestedAction: SuggestedAction;
  /** Cascade depth (how many tiers of dependents) */
  cascadeDepth: number;
}

/**
 * Suggested fix with command
 *
 * @remarks
 * Represents a single suggested fix for an error, including a description,
 * an optional command to run, an explanation, and optional documentation link.
 */
export interface SuggestedFix {
  /** Fix priority (1=highest) */
  priority: number;
  /** Fix description */
  description: string;
  /** Exact command to run (if applicable) */
  command?: string;
  /** Explanation of why this fix works */
  explanation?: string;
  /** Documentation link */
  docsUrl?: string;
}

/**
 * Resume command strategy
 *
 * @remarks
 * Determines how to resume pipeline execution after a failure.
 */
export type ResumeStrategy = 'retry' | 'skip' | 'continue' | 'interactive';

/**
 * Resume command options
 *
 * @remarks
 * Configuration options for generating resume commands. Specifies the session,
 * failed task, strategy, and any additional flags.
 */
export interface ResumeCommandOptions {
  /** Session ID */
  sessionId: string;
  /** Failed task ID */
  taskId: string;
  /** Resume strategy */
  strategy: ResumeStrategy;
  /** Additional flags */
  flags?: string[];
  /** Context for the resume */
  context?: string;
}

/**
 * Complete enhanced error report
 *
 * @remarks
 * Contains all data needed to generate the enhanced ERROR_REPORT.md including
 * timeline, failures, impact analysis, suggested fixes, and resume commands.
 */
export interface EnhancedErrorReport {
  /** Report generation timestamp */
  generatedAt: Date;
  /** Pipeline mode */
  pipelineMode: string;
  /** Continue-on-error flag */
  continueOnError: boolean;
  /** Session metadata */
  sessionId: string;
  /** Task statistics */
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    successRate: number;
  };
  /** Error timeline */
  timeline: ErrorTimeline;
  /** Detailed failure information */
  failures: TaskFailure[];
  /** Error categories breakdown */
  errorCategories: Record<string, number>;
  /** Impact analysis for each failure */
  impactAnalysis: Map<string, TaskImpact>;
  /** Suggested fixes for each failure */
  suggestedFixes: Map<string, SuggestedFix[]>;
  /** Resume commands for each failure */
  resumeCommands: Map<string, string[]>;
}

/**
 * Context for error report generation
 *
 * @remarks
 * Provides all context needed by ErrorReportBuilder to generate the report.
 * Includes session info, backlog, statistics, and pipeline configuration.
 */
export interface ReportContext {
  /** Path to session directory */
  sessionPath: string;
  /** Session identifier */
  sessionId: string;
  /** Task hierarchy */
  backlog: Backlog;
  /** Total task count */
  totalTasks: number;
  /** Completed task count */
  completedTasks: number;
  /** Pipeline execution mode */
  pipelineMode: string;
  /** Continue-on-error flag */
  continueOnError: boolean;
  /** Pipeline start time */
  startTime: Date;
}

/**
 * Error category for reporting
 *
 * @remarks
 * Categories for grouping errors by type in the error report.
 */
export type ErrorCategory =
  | 'TaskError'
  | 'AgentError'
  | 'ValidationError'
  | 'SessionError'
  | 'EnvironmentError'
  | 'Other';

/**
 * Error category statistics
 *
 * @remarks
 * Counts of errors by category, used for the error categories section
 * of the ERROR_REPORT.md.
 */
export interface ErrorCategoryStats {
  /** Count of TaskError instances */
  taskError: number;
  /** Count of AgentError instances */
  agentError: number;
  /** Count of ValidationError instances */
  validationError: number;
  /** Count of SessionError instances */
  sessionError: number;
  /** Count of EnvironmentError instances */
  environmentError: number;
  /** Count of other error types */
  other: number;
}

/**
 * Timeline format option
 *
 * @remarks
 * Determines how the timeline should be formatted in the report.
 */
export type TimelineFormat = 'compact' | 'vertical' | 'horizontal';

/**
 * Timeline summary statistics
 *
 * @remarks
 * Aggregated statistics about the error timeline for quick overview.
 */
export interface TimelineSummary {
  /** First error timestamp */
  firstErrorAt: Date;
  /** Last error timestamp */
  lastErrorAt?: Date;
  /** Total number of errors */
  errorCount: number;
  /** Total duration of session */
  totalDuration: number;
  /** Time between first and last error */
  errorSpan: number;
}

// Re-export Backlog type from core/models for convenience
export type { Backlog } from '../../core/models.js';
