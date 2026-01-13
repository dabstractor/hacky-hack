/**
 * PRD diffing utilities for delta session initialization
 *
 * @module core/prd-differ
 *
 * @remarks
 * Provides structured diffing for PRD markdown documents, detecting section-level
 * changes between old and new PRD versions. Enables delta session initialization
 * with precise change detection for selective task re-execution.
 *
 * Uses fast-diff library for efficient character-based diffing with custom
 * section-aware logic for meaningful change categorization.
 *
 * @example
 * ```typescript
 * import { diffPRDs, hasSignificantChanges } from './core/prd-differ.js';
 *
 * const oldPRD = '# Features\n- User auth';
 * const newPRD = '# Features\n- User authentication\n- Real-time sync';
 *
 * const diffResult = diffPRDs(oldPRD, newPRD);
 * const isSignificant = hasSignificantChanges(diffResult);
 * // diffResult.changes contains categorized section changes
 * // isSignificant === true if >5% word change or >=3 sections affected
 * ```
 */

import fastDiff from 'fast-diff';

/**
 * Represents a parsed markdown section from PRD
 *
 * @remarks
 * Extracted by parsing markdown headers (#, ##, ###).
 * Used for section-aware diffing rather than plain text comparison.
 * Content before the first header is treated as implicit "Introduction" section.
 *
 * @example
 * ```typescript
 * const section: PRDSection = {
 *   level: 2,
 *   title: 'Features',
 *   content: '- User authentication\n- Data export',
 *   lineNumber: 5
 * };
 * ```
 */
export interface PRDSection {
  /** Header level (1-6), or 0 for content before first header */
  readonly level: number;

  /** Section title (e.g., "Features", "User Authentication") */
  readonly title: string;

  /** Full section content (excluding the header line itself) */
  readonly content: string;

  /** Starting line in PRD (1-indexed) */
  readonly lineNumber: number;
}

/**
 * Represents a detected change between PRD versions
 *
 * @remarks
 * Categorized at section level (not word/line level for noise reduction).
 * Impact level helps prioritize which changes require task re-execution.
 *
 * Impact assessment is based on:
 * - high: Code blocks, tables, or >200 words
 * - medium: 50-200 words
 * - low: <50 words
 */
export interface SectionChange {
  /** Type of change: section was added, modified, or removed */
  readonly type: 'added' | 'modified' | 'removed';

  /** Title of the section that changed */
  readonly sectionTitle: string;

  /** Line number where the section appears (new PRD for added/modified, old PRD for removed) */
  readonly lineNumber: number;

  /** Previous content (present for modified and removed changes) */
  readonly oldContent?: string;

  /** New content (present for added and modified changes) */
  readonly newContent?: string;

  /** Impact level based on content complexity and size */
  readonly impact: 'low' | 'medium' | 'high';
}

/**
 * Complete diff result from PRD comparison
 *
 * @remarks
 * Contains all detected changes with statistics and human-readable summary.
 * Used by SessionManager to populate DeltaSession.diffSummary.
 *
 * @example
 * ```typescript
 * const result: DiffSummary = {
 *   changes: [
 *     { type: 'added', sectionTitle: 'Real-time Sync', lineNumber: 15, newContent: '...', impact: 'high' }
 *   ],
 *   summaryText: '1 section added, 1 modified',
 *   stats: { totalAdded: 1, totalModified: 1, totalRemoved: 0, sectionsAffected: ['Real-time Sync', 'Features'] }
 * };
 * ```
 */
export interface DiffSummary {
  /** Array of all detected changes at section level */
  readonly changes: SectionChange[];

  /** Human-readable summary of changes for logging/debugging */
  readonly summaryText: string;

  /** Statistical summary of changes */
  readonly stats: {
    /** Number of sections added in new PRD */
    readonly totalAdded: number;

    /** Number of sections with content changes */
    readonly totalModified: number;

    /** Number of sections removed from old PRD */
    readonly totalRemoved: number;

    /** List of unique section titles affected by changes */
    readonly sectionsAffected: readonly string[];
  };
}

/**
 * Word change threshold for considering changes significant (5%)
 *
 * @remarks
 * Changes below this threshold are considered minor edits (formatting, typos)
 * and may not require task re-execution.
 */
const SIGNIFICANCE_WORD_THRESHOLD = 0.05;

/**
 * Minimum number of sections affected for automatic significance
 *
 * @remarks
 * Even with small word changes, if 3+ sections are affected, consider significant.
 */
const MIN_SECTIONS_FOR_SIGNIFICANCE = 3;

/**
 * Parses a PRD markdown document into structured sections
 *
 * @remarks
 * Extracts sections by finding markdown headers (#, ##, ###, ####, #####, ######).
 * Content before the first header is treated as an implicit "Introduction" section
 * with level 0. Content excludes the header line itself.
 *
 * @param prd - The PRD markdown content as a string
 * @returns Array of parsed sections with level, title, content, and line numbers
 *
 * @example
 * ```typescript
 * const prd = `# Project Overview
 * This is a test project.
 *
 * ## Features
 * - User auth
 * - Data export`;
 *
 * const sections = parsePRDSections(prd);
 * // [
 * //   { level: 1, title: 'Project Overview', content: '\nThis is a test project.\n\n', lineNumber: 1 },
 * //   { level: 2, title: 'Features', content: '- User auth\n- Data export', lineNumber: 4 }
 * // ]
 * ```
 */
export function parsePRDSections(prd: string): PRDSection[] {
  // Handle empty PRD
  if (!prd || prd.trim().length === 0) {
    return [];
  }

  const lines = prd.split('\n');
  const sections: PRDSection[] = [];
  let currentSection: PRDSection | null = null;
  let contentBuffer: string[] = [];
  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    const headerMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      headerFound = true;

      // If this is the first header and we have buffered content,
      // create an implicit Introduction section first
      if (!currentSection && contentBuffer.length > 0) {
        sections.push({
          level: 0,
          title: 'Introduction',
          content: contentBuffer.join('\n'),
          lineNumber: 1,
        });
        contentBuffer = [];
      }

      // Save previous section if exists
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: contentBuffer.join('\n'),
        });
      }

      // Start new section
      currentSection = {
        level: headerMatch[1].length,
        title: headerMatch[2].trim(),
        content: '',
        lineNumber: i + 1, // 1-indexed
      };
      contentBuffer = [];
    } else if (currentSection) {
      // Accumulate content for current section
      contentBuffer.push(lines[i]);
    } else {
      // Content before first header - add to buffer
      contentBuffer.push(lines[i]);
    }
  }

  // Handle content before first header (implicit Introduction)
  if (!headerFound && contentBuffer.length > 0) {
    sections.push({
      level: 0,
      title: 'Introduction',
      content: contentBuffer.join('\n'),
      lineNumber: 1,
    });
  }

  // Don't forget last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      content: contentBuffer.join('\n'),
    });
  }

  return sections;
}

/**
 * Normalizes markdown text for fair comparison
 *
 * @remarks
 * Removes formatting noise while preserving semantic content:
 * - Normalizes line endings (\r\n → \n)
 * - Removes trailing spaces from lines
 * - Collapses multiple spaces to single space (outside code blocks)
 * - Preserves whitespace inside ``` code blocks
 *
 * This prevents formatting-only changes from appearing as content changes.
 *
 * @param text - Raw markdown text to normalize
 * @returns Normalized text ready for comparison
 *
 * @example
 * ```typescript
 * const raw = 'Hello  world\n```code  spacing```\n';
 * const normalized = normalizeMarkdown(raw);
 * // 'Hello world\n```code  spacing```\n'
 * // Note: spaces inside code block are preserved
 * ```
 */
export function normalizeMarkdown(text: string): string {
  const lines = text.split('\n');
  const normalized: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      normalized.push(line);
    } else if (inCodeBlock) {
      // Preserve whitespace in code blocks exactly
      normalized.push(line);
    } else {
      // Normalize outside code blocks
      normalized.push(
        line
          .trimEnd() // Remove trailing spaces
          .replace(/  +/g, ' ') // Collapse multiple spaces
      );
    }
  }

  return normalized.join('\n').replace(/\r\n/g, '\n'); // Normalize line endings
}

/**
 * Assesses impact level based on content characteristics
 *
 * @remarks
 * Determines impact level for prioritizing change handling:
 * - high: Contains code blocks (```), tables (|), or >200 words
 * - medium: 50-200 words without code blocks/tables
 * - low: <50 words without code blocks/tables
 *
 * @param content - Section content to assess
 * @returns Impact level for prioritization
 *
 * @example
 * ```typescript
 * assessImpact('Small change') // 'low'
 * assessImpact('Medium sized content with some detail here') // 'medium'
 * assessImpact('```typescript\nconst code = true;\n```') // 'high'
 * ```
 */
function assessImpact(content: string): 'low' | 'medium' | 'high' {
  const hasCodeBlocks = /```/.test(content);
  const hasTables = /\|.*\|/.test(content);
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  if (hasCodeBlocks || hasTables || wordCount > 200) {
    return 'high';
  } else if (wordCount > 50) {
    return 'medium';
  }
  return 'low';
}

/**
 * Compares section content to detect changes and calculate word change percentage
 *
 * @remarks
 * Uses fast-diff to perform character-level diffing, then aggregates to word-level
 * statistics. Filters out whitespace-only changes to reduce noise.
 *
 * @param oldContent - Previous section content
 * @param newContent - New section content
 * @returns Object indicating if changes exist and word change percentage
 *
 * @example
 * ```typescript
 * const result = compareSectionContent(
 *   'User auth',
 *   'User authentication and real-time sync'
 * );
 * // { hasChanges: true, wordChangePercent: ~150 }
 * ```
 */
function compareSectionContent(
  oldContent: string,
  newContent: string
): {
  hasChanges: boolean;
  wordChangePercent: number;
} {
  const normalizedOld = normalizeMarkdown(oldContent);
  const normalizedNew = normalizeMarkdown(newContent);

  // Identical after normalization
  if (normalizedOld === normalizedNew) {
    return { hasChanges: false, wordChangePercent: 0 };
  }

  const changes: Array<[-1 | 0 | 1, string]> = fastDiff(
    normalizedOld,
    normalizedNew
  );
  const significantChanges = changes.filter(
    ([type, text]) => type !== 0 && text.trim().length > 0
  );

  if (significantChanges.length === 0) {
    return { hasChanges: false, wordChangePercent: 0 };
  }

  // Calculate word change percentage
  const totalWords = normalizedNew
    .split(/\s+/)
    .filter(w => w.length > 0).length;
  const changedWords = significantChanges.reduce(
    (sum, [_, text]) =>
      sum + text.split(/\s+/).filter(w => w.length > 0).length,
    0
  );

  const wordChangePercent =
    totalWords > 0 ? (changedWords / totalWords) * 100 : 100;

  return {
    hasChanges: true,
    wordChangePercent,
  };
}

/**
 * Generates human-readable summary text from detected changes
 *
 * @remarks
 * Creates a concise summary of the diff for logging and debugging.
 * Format: "X section(s) added, Y modified, Z removed. Affected: A, B, C"
 *
 * @param changes - Array of detected section changes
 * @param sectionsAffected - Set of unique section titles affected
 * @returns Human-readable summary string
 */
function generateSummaryText(
  changes: SectionChange[],
  sectionsAffected: Set<string>
): string {
  const added = changes.filter(c => c.type === 'added').length;
  const modified = changes.filter(c => c.type === 'modified').length;
  const removed = changes.filter(c => c.type === 'removed').length;

  const parts: string[] = [];
  if (added > 0) parts.push(`${added} added`);
  if (modified > 0) parts.push(`${modified} modified`);
  if (removed > 0) parts.push(`${removed} removed`);

  const changeSummary = parts.length > 0 ? parts.join(', ') : 'No changes';
  const affectedList = Array.from(sectionsAffected).slice(0, 5).join(', ');
  const affectedText =
    sectionsAffected.size > 5
      ? `${affectedList}... (+${sectionsAffected.size - 5} more)`
      : affectedList;

  return `PRD changes: ${changeSummary}.${affectedText ? ` Affected: ${affectedText}.` : ''}`;
}

/**
 * Diffs two PRD documents and returns structured change data
 *
 * @remarks
 * Performs section-aware diffing by:
 * 1. Parsing both PRDs into sections by markdown headers
 * 2. Matching sections by title (exact match, case-sensitive)
 * 3. Categorizing unmatched sections as added/removed
 * 4. Diffing matched section contents using fast-diff
 * 5. Filtering changes below 5% word change threshold
 *
 * The result includes all detected changes with impact assessment and statistics.
 *
 * @param oldPRD - Previous PRD content
 * @param newPRD - New PRD content
 * @returns Structured diff summary with categorized changes
 *
 * @example
 * ```typescript
 * const oldPRD = `# Features\n- User auth\n- Data export`;
 * const newPRD = `# Features\n- User authentication\n- Real-time notifications\n- Data export`;
 *
 * const result = diffPRDs(oldPRD, newPRD);
 * // result.changes = [{
 * //   type: 'modified',
 * //   sectionTitle: 'Features',
 * //   lineNumber: 1,
 * //   oldContent: '- User auth\n- Data export',
 * //   newContent: '- User authentication\n- Real-time notifications\n- Data export',
 * //   impact: 'low'
 * // }]
 * ```
 */
export function diffPRDs(oldPRD: string, newPRD: string): DiffSummary {
  const oldSections = parsePRDSections(oldPRD);
  const newSections = parsePRDSections(newPRD);
  const changes: SectionChange[] = [];
  const sectionsAffected = new Set<string>();

  // Find added and modified sections
  for (const newSection of newSections) {
    const oldSection = oldSections.find(s => s.title === newSection.title);

    if (!oldSection) {
      // Section was added
      changes.push({
        type: 'added',
        sectionTitle: newSection.title,
        lineNumber: newSection.lineNumber,
        newContent: newSection.content,
        impact: assessImpact(newSection.content),
      });
      sectionsAffected.add(newSection.title);
    } else {
      // Check if content changed
      const comparison = compareSectionContent(
        oldSection.content,
        newSection.content
      );

      if (comparison.hasChanges && comparison.wordChangePercent > 5) {
        changes.push({
          type: 'modified',
          sectionTitle: newSection.title,
          lineNumber: newSection.lineNumber,
          oldContent: oldSection.content,
          newContent: newSection.content,
          impact: assessImpact(newSection.content),
        });
        sectionsAffected.add(newSection.title);
      }
    }
  }

  // Find removed sections
  for (const oldSection of oldSections) {
    const stillExists = newSections.some(s => s.title === oldSection.title);

    if (!stillExists) {
      changes.push({
        type: 'removed',
        sectionTitle: oldSection.title,
        lineNumber: oldSection.lineNumber,
        oldContent: oldSection.content,
        impact: assessImpact(oldSection.content),
      });
      sectionsAffected.add(oldSection.title);
    }
  }

  // Generate summary
  const summaryText = generateSummaryText(changes, sectionsAffected);

  return {
    changes,
    summaryText,
    stats: {
      totalAdded: changes.filter(c => c.type === 'added').length,
      totalModified: changes.filter(c => c.type === 'modified').length,
      totalRemoved: changes.filter(c => c.type === 'removed').length,
      sectionsAffected: Array.from(sectionsAffected),
    },
  };
}

/**
 * Determines if diff result represents significant changes
 *
 * @remarks
 * Filters whitespace/minor edits using configurable thresholds:
 * - Returns true if word change percentage > 5%
 * - Returns true if 3+ sections are affected
 * - Returns false for formatting-only changes
 *
 * This prevents delta session creation for trivial edits like typos or whitespace.
 *
 * @param diff - DiffSummary result from diffPRDs()
 * @returns True if changes are significant enough to warrant task re-execution
 *
 * @example
 * ```typescript
 * const result = diffPRDs(oldPRD, newPRD);
 * if (hasSignificantChanges(result)) {
 *   // Create delta session and re-execute affected tasks
 * } else {
 *   // Skip delta session - changes too minor
 * }
 * ```
 */
export function hasSignificantChanges(diff: DiffSummary): boolean {
  // Empty changes means no significance
  if (diff.changes.length === 0) {
    return false;
  }

  // If 3+ sections affected, consider significant regardless of word count
  if (diff.stats.sectionsAffected.length >= MIN_SECTIONS_FOR_SIGNIFICANCE) {
    return true;
  }

  // Calculate actual word changes using diff for modified sections
  // For added/removed sections, all words count as changed
  let totalWords = 0;
  let changedWords = 0;

  for (const change of diff.changes) {
    if (change.type === 'added' || change.type === 'removed') {
      // For added/removed, all words in the section count as changed
      const wordCount = (change.newContent ?? change.oldContent ?? '')
        .split(/\s+/)
        .filter(w => w.length > 0).length;
      totalWords += wordCount;
      changedWords += wordCount;
    } else if (change.type === 'modified') {
      // For modified, calculate actual word diff
      const oldContent = change.oldContent ?? '';
      const newContent = change.newContent ?? '';

      const oldWords = oldContent.split(/\s+/).filter(w => w.length > 0).length;
      const newWords = newContent.split(/\s+/).filter(w => w.length > 0).length;
      totalWords += Math.max(oldWords, newWords);

      // Use diff to find actual word changes
      const changes: Array<[-1 | 0 | 1, string]> = fastDiff(
        normalizeMarkdown(oldContent),
        normalizeMarkdown(newContent)
      );

      for (const [type, text] of changes) {
        if (type !== 0) {
          // Count words in insertions and deletions
          changedWords += text.split(/\s+/).filter(w => w.length > 0).length;
        }
      }
    }
  }

  if (totalWords === 0) {
    return diff.changes.length > 0;
  }

  const wordChangePercent = (changedWords / totalWords) * 100;
  return wordChangePercent > SIGNIFICANCE_WORD_THRESHOLD * 100;
}
