/**
 * Mock delta data fixtures for testing delta analysis prompt generator
 *
 * @remarks
 * Provides sample PRD data for testing the createDeltaAnalysisPrompt function.
 * Includes realistic PRD snippets showing added, modified, and removed requirements.
 */

/**
 * Mock previous PRD content (baseline version)
 *
 * @remarks
 * Represents the initial PRD with basic requirements. Used as the "old PRD"
 * input for delta analysis testing.
 */
export const mockOldPRD = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure.

## P1.M2.T1: Define Models
Create data models.

# Phase 2: Core System

## P2.M1.T1: Implement Agent System
Build the agent framework.
`;

/**
 * Mock current PRD content (modified version)
 *
 * @remarks
 * Represents the updated PRD with changes. Used as the "new PRD"
 * input for delta analysis testing.
 *
 * Changes from mockOldPRD:
 * - P1.M1.T1: Added "with TypeScript" specification
 * - P1.M2.T1: Added "with Zod validation" specification
 * - P2.M1.T1: New phase added (Agent System requirement)
 */
export const mockNewPRD = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure with TypeScript.

## P1.M2.T1: Define Models
Create data models with Zod validation.

# Phase 2: Core System

## P2.M1.T1: Implement Agent System
Build the agent framework.
`;

/**
 * Mock completed task IDs
 *
 * @remarks
 * Represents tasks that have been completed in a previous session.
 * Used to test that the delta analysis preserves completed work.
 */
export const mockCompletedTaskIds = ['P1.M1.T1', 'P1.M2.T1'];

/**
 * Mock old PRD with removed requirement
 *
 * @remarks
 * Used for testing removal detection in delta analysis.
 */
export const mockOldPRDWithRemoved = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure.

# Phase 2: Notifications

## P2.M3.T2: Email Notifications
Send emails to users on events.
`;

/**
 * Mock new PRD with requirement removed
 *
 * @remarks
 * The email notifications requirement has been removed from this version.
 * Used for testing removal detection in delta analysis.
 */
export const mockNewPRDWithRemoved = `
# Phase 1: Foundation

## P1.M1.T1: Initialize Project
Set up the project structure.
`;

/**
 * Mock completed tasks including the removed task
 *
 * @remarks
 * Includes P2.M3.T2 which was removed in the new PRD. Used to test
 * that removed requirements are properly flagged.
 */
export const mockCompletedTasksIncludingRemoved = ['P1.M1.T1', 'P2.M3.T2'];

/**
 * Empty PRD for edge case testing
 *
 * @remarks
 * Used for testing how the prompt generator handles empty inputs.
 */
export const mockEmptyPRD = '';

/**
 * Minimal PRD for basic testing
 *
 * @remarks
 * Smallest valid PRD content for lightweight tests.
 */
export const mockMinimalPRD = `
# Phase 1

## P1.T1: Basic Task
A simple task.
`;
