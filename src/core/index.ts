/**
 * Core module exports
 *
 * @module core
 *
 * @remarks
 * Exports all core classes and utilities for the PRP Pipeline.
 */

// Session management
export { SessionManager } from './session-manager.js';
export {
  hashPRD,
  createSessionDirectory,
  writeTasksJSON,
  readTasksJSON,
  writePRP,
  snapshotPRD,
  loadSnapshot,
  SessionFileError,
} from './session-utils.js';

// PRD diffing utilities
export {
  diffPRDs,
  hasSignificantChanges,
  parsePRDSections,
  normalizeMarkdown,
} from './prd-differ.js';

// Type definitions and models
export type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  Status,
  ItemType,
  SessionState,
  SessionMetadata,
  DeltaSession,
  ValidationGate,
  SuccessCriterion,
  PRPDocument,
  PRPArtifact,
  RequirementChange,
  DeltaAnalysis,
  BugSeverity,
  Bug,
  TestResults,
} from './models.js';

// PRD diffing types
export type { PRDSection, SectionChange, DiffSummary } from './prd-differ.js';

export {
  StatusEnum,
  ItemTypeEnum,
  BacklogSchema,
  PhaseSchema,
  MilestoneSchema,
  TaskSchema,
  SubtaskSchema,
  ValidationGateSchema,
  SuccessCriterionSchema,
  PRPDocumentSchema,
  PRPArtifactSchema,
  RequirementChangeSchema,
  DeltaAnalysisSchema,
  BugSeverityEnum,
  BugSchema,
  TestResultsSchema,
} from './models.js';
