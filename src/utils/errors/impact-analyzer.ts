/**
 * Dependency impact analysis for failed tasks
 *
 * @module utils/errors/impact-analyzer
 *
 * @remarks
 * Analyzes the downstream impact of task failures by traversing the
 * dependency graph. Identifies blocked tasks, milestones, and phases.
 *
 * @example
 * ```typescript
 * import { ImpactAnalyzer } from './impact-analyzer.js';
 *
 * const analyzer = new ImpactAnalyzer(backlog);
 * const impact = analyzer.analyzeImpact('P1.M1.T1.S1');
 * console.log(impact.level); // 'high'
 * console.log(impact.affectedTasks); // ['P1.M1.T1.S2', 'P1.M1.T2.S1']
 * ```
 */

import { getAllSubtasks, findItem, isSubtask } from '../task-utils.js';
import type { Backlog } from '../../core/models.js';
import type { TaskImpact, ImpactLevel, SuggestedAction } from './types.js';

/**
 * Impact analyzer for task failure consequences
 *
 * @remarks
 * Traverses the dependency graph to find all tasks affected by a failure.
 * Calculates impact level based on blocked phases, milestones, and tasks.
 */
export class ImpactAnalyzer {
  #backlog: Backlog;

  /**
   * Create a new impact analyzer
   *
   * @param backlog - Task hierarchy to analyze
   */
  constructor(backlog: Backlog) {
    this.#backlog = backlog;
  }

  /**
   * Analyze the impact of a task failure
   *
   * @param failedTaskId - ID of the failed task
   * @returns Complete impact analysis
   *
   * @remarks
   * Finds all downstream tasks, groups by hierarchy level, determines
   * impact severity, and suggests recovery action.
   */
  analyzeImpact(failedTaskId: string): TaskImpact {
    // Find downstream tasks (dependents)
    const downstream = this.findDownstream(failedTaskId);

    // Group by hierarchy level
    const blockedPhases = new Set<string>();
    const blockedMilestones = new Set<string>();
    const blockedTasks = new Set<string>();

    for (const taskId of downstream) {
      const parts = taskId.split('.');

      // Phase level
      blockedPhases.add(parts[0]);

      // Milestone level
      if (parts.length >= 2) {
        blockedMilestones.add(`${parts[0]}.${parts[1]}`);
      }

      // Task level
      blockedTasks.add(taskId);
    }

    // Determine impact level
    const level = this.determineImpactLevel(
      blockedPhases.size,
      blockedMilestones.size,
      blockedTasks.size
    );

    // Calculate cascade depth
    const cascadeDepth = this.calculateCascadeDepth(failedTaskId);

    // Determine if pipeline can continue
    const canContinue = this.canContinueWithFailure(failedTaskId);

    // Suggest action based on impact
    const suggestedAction = this.suggestAction(level, canContinue);

    return {
      level,
      affectedTasks: downstream,
      blockedPhases: Array.from(blockedPhases),
      blockedMilestones: Array.from(blockedMilestones),
      blockedTasks: Array.from(blockedTasks),
      canContinue,
      suggestedAction,
      cascadeDepth,
    };
  }

  /**
   * Find all downstream tasks that depend on the given task
   *
   * @param taskId - Task ID to find dependents for
   * @returns Array of dependent task IDs
   *
   * @remarks
   * Uses DFS to traverse the dependency graph forward from the failed task.
   */
  findDownstream(taskId: string): string[] {
    const visited = new Set<string>();
    const downstream: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      // Find the item
      const item = findItem(this.#backlog, id);
      if (!item || !isSubtask(item)) return;

      // Find tasks that depend on this one
      const allSubtasks = getAllSubtasks(this.#backlog);
      for (const subtask of allSubtasks) {
        if (subtask.dependencies.includes(id) && !visited.has(subtask.id)) {
          downstream.push(subtask.id);
          traverse(subtask.id);
        }
      }
    };

    traverse(taskId);
    return downstream;
  }

  /**
   * Find all upstream tasks that the given task depends on
   *
   * @param taskId - Task ID to find dependencies for
   * @returns Array of dependency task IDs
   *
   * @remarks
   * Returns the direct dependencies of the given task.
   */
  findUpstream(taskId: string): string[] {
    const item = findItem(this.#backlog, taskId);
    if (!item || !isSubtask(item)) return [];

    return [...item.dependencies];
  }

  /**
   * Calculate the cascade depth of dependencies
   *
   * @param taskId - Task ID to analyze
   * @returns Maximum depth of dependent tasks
   *
   * @remarks
   * Measures how many layers of tasks are affected. A depth of 0 means
   * no dependents, depth of 1 means direct dependents only, etc.
   */
  calculateCascadeDepth(taskId: string): number {
    let maxDepth = 0;

    const traverse = (id: string, currentDepth: number) => {
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }

      const allSubtasks = getAllSubtasks(this.#backlog);
      for (const subtask of allSubtasks) {
        if (subtask.dependencies.includes(id)) {
          traverse(subtask.id, currentDepth + 1);
        }
      }
    };

    traverse(taskId, 0);
    return maxDepth;
  }

  /**
   * Determine impact level from blocked counts
   *
   * @param blockedPhases - Number of blocked phases
   * @param blockedMilestones - Number of blocked milestones
   * @param blockedTasks - Number of blocked tasks
   * @returns Impact level
   *
   * @remarks
   * Impact criteria:
   * - critical: 2+ phases blocked
   * - high: 1 phase or 3+ milestones blocked
   * - medium: 1+ milestone or 5+ tasks blocked
   * - low: 1+ tasks blocked
   * - none: no tasks blocked
   */
  determineImpactLevel(
    blockedPhases: number,
    blockedMilestones: number,
    blockedTasks: number
  ): ImpactLevel {
    if (blockedPhases >= 2) return 'critical';
    if (blockedPhases === 1 || blockedMilestones >= 3) return 'high';
    if (blockedMilestones >= 1 || blockedTasks >= 5) return 'medium';
    if (blockedTasks >= 1) return 'low';
    return 'none';
  }

  /**
   * Check if pipeline can continue with this failure
   *
   * @param taskId - Failed task ID
   * @returns True if pipeline can continue
   *
   * @remarks
   * Pipeline can continue if there are tasks that don't depend on the
   * failed task. If all remaining tasks depend on this one, the pipeline
   * cannot continue.
   */
  canContinueWithFailure(taskId: string): boolean {
    const allSubtasks = getAllSubtasks(this.#backlog);
    for (const subtask of allSubtasks) {
      if (subtask.id === taskId) continue;

      // Check if this task's dependencies include the failed task
      if (!subtask.dependencies.includes(taskId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Suggest action based on impact level and continuation possibility
   *
   * @param level - Impact level
   * @param canContinue - Whether pipeline can continue
   * @returns Suggested action
   *
   * @remarks
   * Action recommendations:
   * - critical/high: pause execution
   * - medium/low with continuation: continue
   * - medium/low without continuation: retry
   */
  suggestAction(level: ImpactLevel, canContinue: boolean): SuggestedAction {
    if (level === 'critical' || level === 'high') return 'pause';
    if (canContinue) return 'continue';
    return 'retry';
  }

  /**
   * Get impact level icon for display
   *
   * @param level - Impact level
   * @returns Unicode icon character
   */
  static getImpactIcon(level: ImpactLevel): string {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      none: '⚪',
    };
    return icons[level];
  }

  /**
   * Format impact level as capitalized string
   *
   * @param level - Impact level
   * @returns Capitalized level name
   */
  static formatImpactLevel(level: ImpactLevel): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }
}
