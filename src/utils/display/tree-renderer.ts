/**
 * Tree visualization utilities for CLI display
 *
 * @module utils/display/tree-renderer
 *
 * @remarks
 * Provides tree rendering for task hierarchy display using ASCII
 * box-drawing characters. Handles 4-level nesting (Phase > Milestone > Task > Subtask).
 *
 * @example
 * ```typescript
 * import { renderTaskTree } from './utils/display/tree-renderer.js';
 * import type { Phase } from '../core/models.js';
 *
 * console.log(renderTaskTree(phases, 'P1.M1.T1.S1'));
 * ```
 */

import chalk from 'chalk';
import type { Phase, Status } from '../../core/models.js';
import { getStatusIndicator } from './status-colors.js';

/**
 * Tree node interface for rendering
 *
 * @remarks
 * Internal structure used to build the renderable tree from the Phase hierarchy.
 */
interface TreeNode {
  /** Node identifier */
  id: string;
  /** Node display title */
  title: string;
  /** Node status for coloring */
  status: Status;
  /** Child nodes */
  children: TreeNode[];
  /** Whether this is the current executing node */
  isCurrent?: boolean;
}

/**
 * Builds a tree structure from phases
 *
 * @param phases - Array of phases to build tree from
 * @param currentId - Optional ID of currently executing task
 * @returns Array of root tree nodes
 *
 * @remarks
 * Converts the Phase > Milestone > Task > Subtask hierarchy into
 * a flat tree structure suitable for recursive rendering.
 *
 * @internal
 */
function buildTree(phases: Phase[], currentId?: string): TreeNode[] {
  const nodes: TreeNode[] = [];

  for (const phase of phases) {
    const phaseNode: TreeNode = {
      id: phase.id,
      title: phase.title,
      status: phase.status,
      isCurrent: phase.id === currentId,
      children: [],
    };

    for (const milestone of phase.milestones) {
      const milestoneNode: TreeNode = {
        id: milestone.id,
        title: milestone.title,
        status: milestone.status,
        isCurrent: milestone.id === currentId,
        children: [],
      };

      for (const task of milestone.tasks) {
        const taskNode: TreeNode = {
          id: task.id,
          title: task.title,
          status: task.status,
          isCurrent: task.id === currentId,
          children: [],
        };

        for (const subtask of task.subtasks) {
          taskNode.children.push({
            id: subtask.id,
            title: subtask.title,
            status: subtask.status,
            isCurrent: subtask.id === currentId,
            children: [],
          });
        }

        milestoneNode.children.push(taskNode);
      }

      phaseNode.children.push(milestoneNode);
    }

    nodes.push(phaseNode);
  }

  return nodes;
}

/**
 * Renders a single tree node recursively
 *
 * @param node - Tree node to render
 * @param prefix - Prefix string for indentation
 * @param isLast - Whether this is the last child of its parent
 * @returns Rendered tree string
 *
 * @internal
 */
function renderNode(
  node: TreeNode,
  prefix: string = '',
  isLast: boolean = true
): string {
  const connector = isLast ? '└── ' : '├── ';
  const currentMarker = node.isCurrent ? chalk.bold.cyan('→ ') : '';
  const statusIndicator = getStatusIndicator(node.status);

  // Format the node line
  const line =
    prefix +
    connector +
    currentMarker +
    statusIndicator +
    ' ' +
    chalk.bold(node.id) +
    ': ' +
    node.title;

  let result: string[] = [line];

  // Render children
  if (node.children && node.children.length > 0) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    result = result.concat(
      node.children.map((child, i) =>
        renderNode(child, childPrefix, i === node.children!.length - 1)
      )
    );
  }

  return result.join('\n');
}

/**
 * Renders task hierarchy as an ASCII tree
 *
 * @param phases - Array of phases to render
 * @param currentId - Optional ID of currently executing task to highlight
 * @returns Rendered tree string
 *
 * @remarks
 * Creates a visual tree representation using ASCII box-drawing characters.
 * Each node shows its status indicator and title. The current task (if provided)
 * is highlighted with a cyan arrow.
 *
 * Output format:
 * ```
 * └── P1: Phase 1
 *     ├── P1.M1: Milestone 1
 *     │   ├── P1.M1.T1: Task 1
 *     │   │   ├── P1.M1.T1.S1: Subtask 1
 *     │   │   └── P1.M1.T1.S2: Subtask 2
 *     │   └── P1.M1.T2: Task 2
 *     └── P1.M2: Milestone 2
 * ```
 *
 * @example
 * ```typescript
 * const tree = renderTaskTree(phases, 'P1.M1.T1.S1');
 * console.log(tree);
 * ```
 */
export function renderTaskTree(phases: Phase[], currentId?: string): string {
  const tree = buildTree(phases, currentId);
  return tree
    .map((root, i) => renderNode(root, '', i === tree.length - 1))
    .join('\n\n');
}

/**
 * Renders a simplified tree showing only pending/in-progress items
 *
 * @param phases - Array of phases to filter and render
 * @param currentId - Optional ID of currently executing task to highlight
 * @returns Rendered tree string
 *
 * @remarks
 * Similar to renderTaskTree but filters out Complete and Obsolete items
 * for a focused view of remaining work.
 *
 * @example
 * ```typescript
 * const tree = renderPendingTree(phases, 'P1.M1.T1.S1');
 * console.log(tree);
 * ```
 */
export function renderPendingTree(phases: Phase[], currentId?: string): string {
  const pendingStatuses: Status[] = [
    'Planned',
    'Researching',
    'Implementing',
    'Retrying',
    'Failed',
  ];

  /**
   * Filters tree nodes recursively
   */
  function filterNodes(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];

    for (const node of nodes) {
      // Check if this node or any descendants are pending
      const isPending = pendingStatuses.includes(node.status);
      const hasPendingChildren =
        node.children && filterNodes(node.children).length > 0;

      if (isPending || hasPendingChildren) {
        result.push({
          ...node,
          children: node.children ? filterNodes(node.children) : [],
        });
      }
    }

    return result;
  }

  const tree = buildTree(phases, currentId);
  const filtered = filterNodes(tree);

  if (filtered.length === 0) {
    return chalk.gray('No pending tasks.');
  }

  return filtered
    .map((root, i) => renderNode(root, '', i === filtered.length - 1))
    .join('\n\n');
}

/**
 * Renders a compact single-line tree
 *
 * @param phases - Array of phases to render
 * @param currentId - Optional ID of currently executing task to highlight
 * @returns Rendered tree string
 *
 * @remarks
 * Creates a compact tree representation with each level on a single line.
 * Useful for quick overview when terminal space is limited.
 *
 * Output format:
 * ```
 * P1 (Complete)
 *   P1.M1 (Complete)
 *     P1.M1.T1 (Complete)
 *       P1.M1.T1.S1 (Complete)
 *       P1.M1.T1.S2 (Planned)
 * ```
 *
 * @example
 * ```typescript
 * const tree = renderCompactTree(phases);
 * console.log(tree);
 * ```
 */
export function renderCompactTree(phases: Phase[], currentId?: string): string {
  const lines: string[] = [];

  function visitNode(
    id: string,
    title: string,
    status: Status,
    indent: number,
    isLast: boolean
  ): void {
    const indentStr = '  '.repeat(indent);
    const prefix = isLast ? '└── ' : '├── ';
    const currentMarker = id === currentId ? chalk.bold.cyan('→ ') : '';
    const statusText = chalk.gray(`(${status})`);

    lines.push(
      indentStr + prefix + currentMarker + id + ': ' + statusText + ' ' + title
    );
  }

  for (let pIdx = 0; pIdx < phases.length; pIdx++) {
    const phase = phases[pIdx];
    visitNode(
      phase.id,
      phase.title,
      phase.status,
      0,
      pIdx === phases.length - 1
    );

    for (let mIdx = 0; mIdx < phase.milestones.length; mIdx++) {
      const milestone = phase.milestones[mIdx];
      visitNode(
        milestone.id,
        milestone.title,
        milestone.status,
        1,
        mIdx === phase.milestones.length - 1
      );

      for (let tIdx = 0; tIdx < milestone.tasks.length; tIdx++) {
        const task = milestone.tasks[tIdx];
        visitNode(
          task.id,
          task.title,
          task.status,
          2,
          tIdx === milestone.tasks.length - 1
        );

        for (let sIdx = 0; sIdx < task.subtasks.length; sIdx++) {
          const subtask = task.subtasks[sIdx];
          visitNode(
            subtask.id,
            subtask.title,
            subtask.status,
            3,
            sIdx === task.subtasks.length - 1
          );
        }
      }
    }
  }

  return lines.join('\n');
}
