/**
 * Unit tests for PRD diffing utilities
 *
 * @remarks
 * Tests validate all functions in src/core/prd-differ.ts with 100% coverage.
 * Tests follow the Setup/Execute/Verify pattern with comprehensive edge case coverage.
 *
 * Pure functions with no external dependencies (fast-diff is used directly, no mocking needed).
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, expect, it } from 'vitest';
import {
  parsePRDSections,
  normalizeMarkdown,
  diffPRDs,
  hasSignificantChanges,
  type DiffSummary,
} from '../../../src/core/prd-differ.js';

describe('prd-differ', () => {
  describe('parsePRDSections()', () => {
    describe('GIVEN a PRD with multiple markdown headers', () => {
      it('SHOULD parse all sections with correct levels and content', () => {
        // SETUP
        const prd = `# Project Overview

This is a test project.

## Features

- User authentication
- Data export

### API Endpoints

GET /api/users
POST /api/login`;

        // EXECUTE
        const sections = parsePRDSections(prd);

        // VERIFY
        expect(sections).toHaveLength(3);

        expect(sections[0]).toEqual({
          level: 1,
          title: 'Project Overview',
          content: '\nThis is a test project.\n',
          lineNumber: 1,
        });

        expect(sections[1]).toEqual({
          level: 2,
          title: 'Features',
          content: '\n- User authentication\n- Data export\n',
          lineNumber: 5,
        });

        expect(sections[2]).toEqual({
          level: 3,
          title: 'API Endpoints',
          content: '\nGET /api/users\nPOST /api/login',
          lineNumber: 10,
        });
      });
    });

    describe('GIVEN a PRD with content before first header', () => {
      it('SHOULD treat content as implicit Introduction section', () => {
        // SETUP
        const prd = `This is project intro text.

# Main Content

Some content here.`;

        // EXECUTE
        const sections = parsePRDSections(prd);

        // VERIFY
        expect(sections).toHaveLength(2);

        expect(sections[0]).toEqual({
          level: 0,
          title: 'Introduction',
          content: 'This is project intro text.\n',
          lineNumber: 1,
        });

        expect(sections[1]).toEqual({
          level: 1,
          title: 'Main Content',
          content: '\nSome content here.',
          lineNumber: 3,
        });
      });
    });

    describe('GIVEN a PRD with no headers', () => {
      it('SHOULD create single Introduction section', () => {
        // SETUP
        const prd = 'Just some content\nwithout any headers.\nMultiple lines.';

        // EXECUTE
        const sections = parsePRDSections(prd);

        // VERIFY
        expect(sections).toHaveLength(1);
        expect(sections[0]).toEqual({
          level: 0,
          title: 'Introduction',
          content: prd,
          lineNumber: 1,
        });
      });
    });

    describe('GIVEN a PRD with headers level 4-6', () => {
      it('SHOULD correctly parse deep header levels', () => {
        // SETUP
        const prd = `#### Level 4
Content
##### Level 5
More content
###### Level 6
Deepest level`;

        // EXECUTE
        const sections = parsePRDSections(prd);

        // VERIFY
        expect(sections).toHaveLength(3);
        expect(sections[0].level).toBe(4);
        expect(sections[1].level).toBe(5);
        expect(sections[2].level).toBe(6);
      });
    });

    describe('GIVEN a PRD with headers with extra spaces', () => {
      it('SHOULD trim spaces from title', () => {
        // SETUP
        const prd = `##   Features

Content here.`;

        // EXECUTE
        const sections = parsePRDSections(prd);

        // VERIFY
        expect(sections[0].title).toBe('Features');
      });
    });

    describe('GIVEN an empty PRD', () => {
      it('SHOULD return empty array', () => {
        // SETUP
        const prd = '';

        // EXECUTE
        const sections = parsePRDSections(prd);

        // VERIFY
        expect(sections).toHaveLength(0);
      });
    });

    describe('GIVEN a PRD with empty sections', () => {
      it('SHOULD include sections with empty content', () => {
        // SETUP
        const prd = `# Section 1

# Section 2

# Section 3`;

        // EXECUTE
        const sections = parsePRDSections(prd);

        // VERIFY
        expect(sections).toHaveLength(3);
        // Consecutive headers result in empty content (no newline characters preserved)
        expect(sections[0].content).toBe('');
        expect(sections[1].content).toBe('');
        expect(sections[2].content).toBe('');
      });
    });
  });

  describe('normalizeMarkdown()', () => {
    describe('GIVEN text with Windows line endings', () => {
      it('SHOULD normalize to Unix line endings', () => {
        // SETUP
        const text = 'Line 1\r\nLine 2\r\nLine 3';

        // EXECUTE
        const normalized = normalizeMarkdown(text);

        // VERIFY
        expect(normalized).toBe('Line 1\nLine 2\nLine 3');
      });
    });

    describe('GIVEN text with trailing spaces', () => {
      it('SHOULD remove trailing spaces from lines', () => {
        // SETUP
        const text = 'Line 1  \nLine 2   \nLine 3';

        // EXECUTE
        const normalized = normalizeMarkdown(text);

        // VERIFY
        expect(normalized).toBe('Line 1\nLine 2\nLine 3');
      });
    });

    describe('GIVEN text with multiple spaces', () => {
      it('SHOULD collapse multiple spaces to single space', () => {
        // SETUP
        const text = 'Word1    Word2     Word3';

        // EXECUTE
        const normalized = normalizeMarkdown(text);

        // VERIFY
        expect(normalized).toBe('Word1 Word2 Word3');
      });
    });

    describe('GIVEN text with code blocks', () => {
      it('SHOULD preserve whitespace inside code blocks', () => {
        // SETUP
        const text =
          '```typescript\nconst x  =  1;\n  const y = 2;\n```\nText after  block';

        // EXECUTE
        const normalized = normalizeMarkdown(text);

        // VERIFY
        expect(normalized).toContain('const x  =  1;');
        expect(normalized).toContain('  const y = 2;');
        expect(normalized).toContain('Text after block');
      });
    });

    describe('GIVEN text with multiple code blocks', () => {
      it('SHOULD toggle code block state correctly', () => {
        // SETUP
        const text =
          '```first\ncode  one\n```\nBetween\n```second\ncode  two\n```';

        // EXECUTE
        const normalized = normalizeMarkdown(text);

        // VERIFY
        expect(normalized).toContain('code  one');
        expect(normalized).toContain('code  two');
        expect(normalized).toContain('Between');
      });
    });

    describe('GIVEN text with inline code (not code block)', () => {
      it('SHOULD normalize inline code', () => {
        // SETUP
        const text = 'Text with `inline  code` and more  text';

        // EXECUTE
        const normalized = normalizeMarkdown(text);

        // VERIFY
        // Inline code (single backtick) not treated as code block
        expect(normalized).toContain('`inline code`');
      });
    });

    describe('GIVEN empty string', () => {
      it('SHOULD return empty string', () => {
        // SETUP
        const text = '';

        // EXECUTE
        const normalized = normalizeMarkdown(text);

        // VERIFY
        expect(normalized).toBe('');
      });
    });
  });

  describe('diffPRDs()', () => {
    describe('GIVEN identical PRDs', () => {
      it('SHOULD return empty changes array', () => {
        // SETUP
        const prd = `# Features

- User authentication
- Data export`;

        // EXECUTE
        const result = diffPRDs(prd, prd);

        // VERIFY
        expect(result.changes).toHaveLength(0);
        expect(result.stats.totalAdded).toBe(0);
        expect(result.stats.totalModified).toBe(0);
        expect(result.stats.totalRemoved).toBe(0);
        expect(result.stats.sectionsAffected).toHaveLength(0);
        expect(result.summaryText).toContain('No changes');
      });
    });

    describe('GIVEN PRD with new section added', () => {
      it('SHOULD detect added section', () => {
        // SETUP
        const oldPRD = `# Features

- User auth`;

        const newPRD = `# Features

- User auth

# API

REST API endpoints`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].type).toBe('added');
        expect(result.changes[0].sectionTitle).toBe('API');
        expect(result.changes[0].newContent).toContain('REST API endpoints');
        expect(result.stats.totalAdded).toBe(1);
        expect(result.stats.sectionsAffected).toContain('API');
      });
    });

    describe('GIVEN PRD with section removed', () => {
      it('SHOULD detect removed section', () => {
        // SETUP
        const oldPRD = `# Features

- User auth

# API

REST API endpoints`;

        const newPRD = `# Features

- User auth`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].type).toBe('removed');
        expect(result.changes[0].sectionTitle).toBe('API');
        expect(result.changes[0].oldContent).toContain('REST API endpoints');
        expect(result.stats.totalRemoved).toBe(1);
        expect(result.stats.sectionsAffected).toContain('API');
      });
    });

    describe('GIVEN PRD with modified section content', () => {
      it('SHOULD detect modified section', () => {
        // SETUP
        const oldPRD = `# Features

- User auth
- Data export`;

        const newPRD = `# Features

- User authentication with OAuth
- Real-time notifications
- Data export`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].type).toBe('modified');
        expect(result.changes[0].sectionTitle).toBe('Features');
        expect(result.changes[0].oldContent).toContain('User auth');
        expect(result.changes[0].newContent).toContain(
          'User authentication with OAuth'
        );
        expect(result.stats.totalModified).toBe(1);
      });
    });

    describe('GIVEN PRD with minor changes below 5% threshold', () => {
      it('SHOULD filter out insignificant changes', () => {
        // SETUP
        const oldPRD = `# Features

This is a very long feature description with lots of content that should exceed the threshold for minor edits. This description continues on and on with many many words to ensure that a tiny change will be below the five percent threshold for detection.

- Feature one
- Feature two
- Feature three
- Feature four
- Feature five
- Feature six
- Feature seven
- Feature eight
- Feature nine
- Feature ten`;

        const newPRD = `# Features

This is a very long feature description with lots of content that should exceed the threshold for minor edits. This description continues on and on with many many words to ensure that a tiny change will be below the five percent threshold for detection plus.

- Feature one
- Feature two
- Feature three
- Feature four
- Feature five
- Feature six
- Feature seven
- Feature eight
- Feature nine
- Feature ten`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        // Small change (1 word) in large content should be filtered out
        expect(result.changes).toHaveLength(0);
      });
    });

    describe('GIVEN PRD with code block changes', () => {
      it('SHOULD detect as high impact change', () => {
        // SETUP
        const oldPRD = `# Implementation

Basic implementation plan.`;

        const newPRD = `# Implementation

\`\`\`typescript
const x = 1;
\`\`\`

Basic implementation plan.`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].impact).toBe('high');
      });
    });

    describe('GIVEN PRD with table changes', () => {
      it('SHOULD detect as high impact change', () => {
        // SETUP
        const oldPRD = `# Data Model

User profile system.`;

        const newPRD = `# Data Model

| Field | Type | Required |
|-------|------|----------|
| id | UUID | yes |
| name | string | yes |`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].impact).toBe('high');
      });
    });

    describe('GIVEN PRD with multiple changes', () => {
      it('SHOULD detect all changes and generate correct stats', () => {
        // SETUP
        const oldPRD = `# Overview

Project details.

# Features

- Feature A

# API

REST API`;

        const newPRD = `# Overview

Updated project details.

# Features

- Feature A
- Feature B

# Implementation

Technical details.`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.stats.totalAdded).toBe(1); // Implementation
        expect(result.stats.totalModified).toBe(2); // Overview and Features
        expect(result.stats.totalRemoved).toBe(1); // API
        expect(result.stats.sectionsAffected).toHaveLength(4); // Overview, Features, API, Implementation
      });
    });

    describe('GIVEN PRDs with different case section titles', () => {
      it('SHOULD treat as different sections (case-sensitive)', () => {
        // SETUP
        const oldPRD = `# Features

Content`;

        const newPRD = `# features

Different content`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        // Case-sensitive: "Features" != "features"
        expect(result.stats.totalRemoved).toBe(1);
        expect(result.stats.totalAdded).toBe(1);
      });
    });

    describe('GIVEN empty old PRD with new content', () => {
      it('SHOULD detect all sections as added', () => {
        // SETUP
        const oldPRD = '';
        const newPRD = `# Features

- Feature A`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.stats.totalAdded).toBe(1);
      });
    });

    describe('GIVEN new PRD is empty', () => {
      it('SHOULD detect all sections as removed', () => {
        // SETUP
        const oldPRD = `# Features

- Feature A`;
        const newPRD = '';

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        expect(result.stats.totalRemoved).toBe(1);
      });
    });

    describe('GIVEN PRD with whitespace-only changes', () => {
      it('SHOULD filter out after normalization', () => {
        // SETUP
        const oldPRD = `# Features

- Feature A
- Feature B`;

        const newPRD = `# Features


- Feature A
- Feature B`;

        // EXECUTE
        const result = diffPRDs(oldPRD, newPRD);

        // VERIFY
        // Extra blank line should be normalized out
        expect(result.changes).toHaveLength(0);
      });
    });
  });

  describe('hasSignificantChanges()', () => {
    describe('GIVEN diff with no changes', () => {
      it('SHOULD return false', () => {
        // SETUP
        const diff: DiffSummary = {
          changes: [],
          summaryText: 'No changes',
          stats: {
            totalAdded: 0,
            totalModified: 0,
            totalRemoved: 0,
            sectionsAffected: [],
          },
        };

        // EXECUTE
        const result = hasSignificantChanges(diff);

        // VERIFY
        expect(result).toBe(false);
      });
    });

    describe('GIVEN diff with 3+ sections affected', () => {
      it('SHOULD return true regardless of word count', () => {
        // SETUP
        const diff: DiffSummary = {
          changes: [
            {
              type: 'added',
              sectionTitle: 'Section 1',
              lineNumber: 1,
              newContent: 'Small',
              impact: 'low',
            },
            {
              type: 'added',
              sectionTitle: 'Section 2',
              lineNumber: 2,
              newContent: 'Small',
              impact: 'low',
            },
            {
              type: 'added',
              sectionTitle: 'Section 3',
              lineNumber: 3,
              newContent: 'Small',
              impact: 'low',
            },
          ],
          summaryText: '3 sections added',
          stats: {
            totalAdded: 3,
            totalModified: 0,
            totalRemoved: 0,
            sectionsAffected: ['Section 1', 'Section 2', 'Section 3'],
          },
        };

        // EXECUTE
        const result = hasSignificantChanges(diff);

        // VERIFY
        expect(result).toBe(true);
      });
    });

    describe('GIVEN diff with high impact changes', () => {
      it('SHOULD return true (30% word change)', () => {
        // SETUP
        const diff: DiffSummary = {
          changes: [
            {
              type: 'modified',
              sectionTitle: 'API',
              lineNumber: 1,
              oldContent: 'old content',
              newContent:
                'new content with code block ```typescript``` and more text here',
              impact: 'high',
            },
          ],
          summaryText: '1 section modified',
          stats: {
            totalAdded: 0,
            totalModified: 1,
            totalRemoved: 0,
            sectionsAffected: ['API'],
          },
        };

        // EXECUTE
        const result = hasSignificantChanges(diff);

        // VERIFY
        // High impact = 30% word change multiplier, should exceed 5%
        expect(result).toBe(true);
      });
    });

    describe('GIVEN diff with only low impact changes', () => {
      it('SHOULD return false for minor edits', () => {
        // SETUP
        // Create a diff where word change is <= 5%
        const largeText =
          'This is a very long description with many many words to ensure that a tiny change will be below the five percent threshold for detection purposes. This text continues on and on and on with many more words to make sure any small edit is insignificant. ';
        const diff: DiffSummary = {
          changes: [
            {
              type: 'modified',
              sectionTitle: 'Notes',
              lineNumber: 1,
              oldContent: largeText + 'end here',
              newContent: largeText + 'end now', // 1 word changed
              impact: 'low',
            },
          ],
          summaryText: '1 section modified',
          stats: {
            totalAdded: 0,
            totalModified: 1,
            totalRemoved: 0,
            sectionsAffected: ['Notes'],
          },
        };

        // EXECUTE
        const result = hasSignificantChanges(diff);

        // VERIFY
        // Small word change in large content should be below threshold
        expect(result).toBe(false);
      });
    });

    describe('GIVEN diff with medium impact changes', () => {
      it('SHOULD calculate significance based on 15% multiplier', () => {
        // SETUP
        const diff: DiffSummary = {
          changes: [
            {
              type: 'modified',
              sectionTitle: 'Description',
              lineNumber: 1,
              oldContent:
                'Old description that goes on for a while with some details',
              newContent:
                'New description that goes on for a while with some more details here',
              impact: 'medium',
            },
          ],
          summaryText: '1 section modified',
          stats: {
            totalAdded: 0,
            totalModified: 1,
            totalRemoved: 0,
            sectionsAffected: ['Description'],
          },
        };

        // EXECUTE
        const result = hasSignificantChanges(diff);

        // VERIFY
        // Medium impact = 15% word change
        expect(result).toBe(true);
      });
    });

    describe('GIVEN diff with empty newContent', () => {
      it('SHOULD still detect as significant if changes exist', () => {
        // SETUP
        const diff: DiffSummary = {
          changes: [
            {
              type: 'removed',
              sectionTitle: 'Deleted Section',
              lineNumber: 1,
              oldContent: 'Some content here',
              impact: 'low',
            },
          ],
          summaryText: '1 section removed',
          stats: {
            totalAdded: 0,
            totalModified: 0,
            totalRemoved: 1,
            sectionsAffected: ['Deleted Section'],
          },
        };

        // EXECUTE
        const result = hasSignificantChanges(diff);

        // VERIFY
        // Removed sections are significant
        expect(result).toBe(true);
      });
    });

    describe('GIVEN diff with mixed impact changes', () => {
      it('SHOULD aggregate all changes for significance calculation', () => {
        // SETUP
        const largeText =
          'This is a very long description with many many words to ensure that changes will be calculated properly across multiple sections. This content continues on and on with lots of additional text to make sure the percentage change remains well below the five percent threshold required for significance detection. Here is more text to increase the word count substantially and ensure any small modifications are considered insignificant. ';
        const diff: DiffSummary = {
          changes: [
            {
              type: 'modified',
              sectionTitle: 'Section 1',
              lineNumber: 1,
              oldContent: largeText + 'end one',
              newContent: largeText + 'end two', // 1 word changed
              impact: 'low',
            },
            {
              type: 'modified',
              sectionTitle: 'Section 2',
              lineNumber: 2,
              oldContent: largeText + 'end three',
              newContent: largeText + 'end four', // 1 word changed
              impact: 'low',
            },
          ],
          summaryText: '2 modified',
          stats: {
            totalAdded: 0,
            totalModified: 2,
            totalRemoved: 0,
            sectionsAffected: ['Section 1', 'Section 2'],
          },
        };

        // EXECUTE
        const result = hasSignificantChanges(diff);

        // VERIFY
        // Two small changes in large content should be below threshold
        expect(result).toBe(false);
      });
    });
  });

  describe('Integration Tests', () => {
    describe('GIVEN complete PRD diff workflow', () => {
      it('SHOULD produce valid DiffSummary with all components', () => {
        // SETUP
        const oldPRD = `# E-Commerce Platform

## Features

- User authentication
- Product catalog
- Shopping cart

## API

RESTful API for all operations`;

        const newPRD = `# E-Commerce Platform

## Features

- User authentication with OAuth2
- Product catalog with search
- Shopping cart with persistence
- Real-time notifications

## API

RESTful API for all operations

## Admin Panel

Content management system`;

        // EXECUTE
        const diffResult = diffPRDs(oldPRD, newPRD);
        const isSignificant = hasSignificantChanges(diffResult);

        // VERIFY
        expect(diffResult.changes.length).toBeGreaterThan(0);
        expect(diffResult.summaryText).toBeDefined();
        expect(diffResult.stats.totalModified).toBe(1); // Features
        expect(diffResult.stats.totalAdded).toBe(1); // Admin Panel
        expect(diffResult.stats.sectionsAffected).toContain('Features');
        expect(diffResult.stats.sectionsAffected).toContain('Admin Panel');
        expect(isSignificant).toBe(true);
      });
    });

    describe('GIVEN PRD with only formatting changes', () => {
      it('SHOULD NOT be significant', () => {
        // SETUP
        const oldPRD = `# Features


- Feature A


- Feature B`;
        // Extra blank lines
        const newPRD = `# Features
- Feature A
- Feature B`;

        // EXECUTE
        const diffResult = diffPRDs(oldPRD, newPRD);
        const isSignificant = hasSignificantChanges(diffResult);

        // VERIFY
        expect(diffResult.changes).toHaveLength(0);
        expect(isSignificant).toBe(false);
      });
    });
  });
});
