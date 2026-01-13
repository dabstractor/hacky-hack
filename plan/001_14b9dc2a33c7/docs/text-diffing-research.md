# Research: Text Diffing Best Practices for Structured Documents

**Research Date:** 2026-01-13
**Focus:** Markdown/PRD document diffing, semantic analysis, significant change detection

---

## 1. Line-by-Line Diffing vs Semantic Diffing

### Line-by-Line Diffing (Traditional)

**Algorithm:** Typically uses Myers' diff algorithm (O(ND) complexity)

**Pros:**

- Simple and predictable
- Fast for most cases
- Standard tool support (git diff, diff utilities)
- Language-agnostic
- Works without understanding document structure

**Cons:**

- Can produce noisy diffs with reformatting
- Doesn't understand code/document structure
- May show false positives (e.g., moving a section looks like deletion+addition)
- Whitespace changes appear as significant modifications

**Best For:**

- Plain text files
- Quick change detection
- Version control systems (git, svn)

**Implementation Example:**

```javascript
import { diffLines } from 'diff';
const changes = diffLines(oldText, newText);
```

### Semantic Diffing

**Approach:** Understands the structure and meaning of documents/code

**Algorithm:** Parses documents into AST (Abstract Syntax Trees) and compares structure

**Pros:**

- Ignores formatting/whitespace changes
- Understands content movement (refactoring)
- More meaningful, human-readable diffs
- Better for code reviews
- Can detect semantic changes (e.g., renamed header with same content)

**Cons:**

- Slower due to parsing overhead
- Language/format-specific implementations needed
- Less widely available in standard tools
- More complex to implement

**Best For:**

- Code reviews
- Document collaboration (PRDs, specs)
- Refactoring detection
- Automated change summaries

**Key Techniques:**

1. Parse to AST (Abstract Syntax Tree)
2. Normalize tree (remove insignificant nodes like whitespace)
3. Tree comparison algorithms
4. Map changes to original source positions

---

## 2. Approaches for Categorizing Changes

### Change Categories

#### Added Content

- New lines/sections present in new version
- Detection: Line exists in new but not in old
- Semantic: New AST nodes in new tree

#### Modified Content

- Lines/sections that changed
- Detection: Similar lines with differences
- Semantic: Same node path with different content

#### Removed Content

- Lines/sections deleted
- Detection: Line exists in old but not in new
- Semantic: AST nodes removed from tree

#### Moved Content

- Content relocated (semantic diffing only)
- Detection: Same content at different positions
- Semantic: Node moved to different parent/path

### Implementation Approaches

#### Approach 1: Unified Diff Format

```javascript
const diff = require('diff');
const changes = diff.diffLines(oldText, newText);

changes.forEach(part => {
  if (part.added) console.log('Added:', part.value);
  if (part.removed) console.log('Removed:', part.value);
});
```

#### Approach 2: Semantic Change Detection

```javascript
// Parse markdown to AST
import { parse } from 'markdown-parser';
import { compare } from 'ast-compare';

const oldAST = parse(oldText);
const newAST = parse(newText);

const changes = compare(oldAST, newAST, {
  matchBy: 'id', // For tracking moved content
  detectMoves: true,
});
```

#### Approach 3: Hybrid Approach (Recommended)

1. First pass: Quick line-by-line diff
2. Second pass: Semantic analysis on changed sections
3. Merge results for categorized output

```javascript
function hybridDiff(oldText, newText) {
  // Quick diff to find changed sections
  const lineChanges = diffLines(oldText, newText);

  // Parse only changed sections for semantic analysis
  const semanticChanges = lineChanges
    .filter(change => change.added || change.removed)
    .map(change => analyzeSemantically(change.value));

  return categorizeChanges(semanticChanges);
}
```

---

## 3. Filtering Out Whitespace/Minor Edits

### Techniques for Significant Change Detection

#### 1. Text Normalization

Normalize text before comparison to ignore insignificant differences:

```javascript
function normalizeText(text) {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces → single space
    .replace(/^\s+|\s+$/gm, '') // Trim lines
    .replace(/\n{3,}/g, '\n\n') // Multiple blank lines → max 2
    .trim(); // Trim entire document
}

const isSignificant = normalizeText(oldText) !== normalizeText(newText);
```

#### 2. Whitespace-Aware Diffing

Git-style whitespace ignoring:

```javascript
// Using diff library with whitespace option
const changes = diffLines(oldText, newText, {
  ignoreWhitespace: true,
  ignoreBlankLines: true,
});
```

#### 3. Token-Based Comparison

For code blocks or structured content:

```javascript
function tokenize(content) {
  return content
    .split(/(\s+|[(){}\[\],;])/) // Split on whitespace and punctuation
    .filter(t => t.trim().length > 0); // Remove pure whitespace
}

function significantChanges(oldTokens, newTokens) {
  const diff = diffArrays(oldTokens, newTokens);
  return diff.filter(part => !part.value.every(t => /^\s+$/.test(t)));
}
```

#### 4. AST-Based Comparison (Best for Structured Documents)

```javascript
import { parse } from 'remark-parse';
import { unified } from 'unified';

function parseMarkdown(text) {
  return unified().use(parse).parse(text);
}

function compareMarkdownAST(oldText, newText) {
  const oldAST = parseMarkdown(oldText);
  const newAST = parseMarkdown(newText);

  // Remove whitespace text nodes
  function cleanAST(node) {
    if (node.type === 'text' && !node.value.trim()) {
      return null; // Remove insignificant text
    }
    if (node.children) {
      node.children = node.children.map(cleanAST).filter(Boolean);
    }
    return node;
  }

  return cleanAST(oldAST) === cleanAST(newAST);
}
```

#### 5. Change Significance Metrics

Define thresholds for what constitutes "significant":

```javascript
function calculateSignificance(oldText, newText) {
  const diff = diffWords(oldText, newText);

  const metrics = {
    totalWords: newText.split(/\s+/).length,
    wordsChanged: diff.filter(d => d.added || d.removed).length,
    linesChanged: diffLines(oldText, newText).length,
    characterDistance: levenshteinDistance(oldText, newText),
  };

  // Define thresholds
  const thresholds = {
    wordChangePercentage: 0.05, // 5% of total words
    minLineChanges: 3, // At least 3 lines
    charDistancePer100: 10, // 10 edits per 100 chars
  };

  return {
    isSignificant:
      metrics.wordsChanged / metrics.totalWords >
        thresholds.wordChangePercentage ||
      metrics.linesChanged >= thresholds.minLineChanges ||
      metrics.characterDistance / (newText.length / 100) >
        thresholds.charDistancePer100,
    metrics,
  };
}
```

#### 6. Edit Distance Thresholds

Use Levenshtein distance with percentage threshold:

```javascript
function levenshteinDistance(a, b) {
  const matrix = [];
  // Implementation...
  return matrix[a.length][b.length];
}

function isSignificantEdit(oldText, newText, threshold = 0.1) {
  const distance = levenshteinDistance(oldText, newText);
  const maxLength = Math.max(oldText.length, newText.length);
  const changeRatio = distance / maxLength;

  return changeRatio > threshold; // More than 10% changed
}
```

---

## 4. Handling Markdown Diffing Specifically

### Markdown Structure Awareness

Markdown has hierarchical structure that should be preserved in diffs:

```
# Header 1
## Header 1.1
Content...
## Header 1.2
Content...
```

#### Key Markdown Elements to Handle

1. **Headers** (h1-h6) - Track changes by level
2. **Lists** - Ordered and unordered
3. **Code blocks** - Preserve whitespace, ignore formatting
4. **Links** - Detect URL vs text changes
5. **Tables** - Cell-level changes
6. **Blockquotes** - Nested structure
7. **Task lists** - Checkbox state changes

### Markdown-Specific Diffing Strategies

#### Strategy 1: Section-Based Diffing

Break document into sections by headers, diff each section:

```javascript
function parseMarkdownSections(markdown) {
  const sections = [];
  const lines = markdown.split('\n');
  let currentSection = { header: null, content: [] };

  lines.forEach(line => {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      if (currentSection.header || currentSection.content.length) {
        sections.push(currentSection);
      }
      currentSection = {
        level: headerMatch[1].length,
        header: headerMatch[2],
        content: [],
      };
    } else {
      currentSection.content.push(line);
    }
  });

  if (currentSection.header || currentSection.content.length) {
    sections.push(currentSection);
  }

  return sections;
}

function diffMarkdownSections(oldMD, newMD) {
  const oldSections = parseMarkdownSections(oldMD);
  const newSections = parseMarkdownSections(newMD);

  // Match sections by header similarity
  return oldSections.map((oldSection, i) => {
    const newSection = newSections[i];

    if (!newSection) {
      return { type: 'removed', section: oldSection };
    }

    if (oldSection.header !== newSection.header) {
      return { type: 'header-changed', old: oldSection, new: newSection };
    }

    const contentDiff = diffLines(
      oldSection.content.join('\n'),
      newSection.content.join('\n')
    );

    return {
      type: 'content-changed',
      section: oldSection,
      changes: contentDiff,
    };
  });
}
```

#### Strategy 2: AST-Based Markdown Diffing

Use unified/remark to parse and compare:

```javascript
import { unified } from 'unified';
import parse from 'remark-parse';
import stringify from 'remark-stringify';
import diff from 'unist-util-diff';

function diffMarkdownAST(oldMD, newMD) {
  const processor = unified().use(parse).use(stringify);

  const oldAST = processor.parse(oldMD);
  const newAST = processor.parse(newMD);

  return diff(oldAST, newAST, {
    // Compare nodes by position
    compare: (a, b) => {
      if (a.type !== b.type) return false;
      if (a.value && b.value && a.value !== b.value) return false;
      return true;
    },
  });
}
```

#### Strategy 3: Hybrid Line + Semantic for Markdown

```javascript
function smartMarkdownDiff(oldMD, newMD) {
  const changes = {
    headerChanges: [],
    contentChanges: [],
    formattingChanges: [],
  };

  // Parse to identify code blocks (preserve exact whitespace)
  const oldBlocks = extractCodeBlocks(oldMD);
  const newBlocks = extractCodeBlocks(newMD);

  // Diff code blocks separately
  oldBlocks.forEach((block, i) => {
    if (!newBlocks[i]) {
      changes.contentChanges.push({ type: 'removed', block });
    } else if (block.content !== newBlocks[i].content) {
      changes.contentChanges.push({
        type: 'code-block-changed',
        old: block,
        new: newBlocks[i],
      });
    }
  });

  // For non-code content, use semantic diffing
  const oldContent = removeCodeBlocks(oldMD);
  const newContent = removeCodeBlocks(newMD);

  const astDiff = diffMarkdownAST(oldContent, newContent);

  // Categorize changes
  astDiff.forEach(change => {
    if (change.node.type === 'heading') {
      changes.headerChanges.push(change);
    } else if (isFormattingChange(change)) {
      changes.formattingChanges.push(change);
    } else {
      changes.contentChanges.push(change);
    }
  });

  return changes;
}

function isFormattingChange(change) {
  // Detect formatting-only changes (bold, italic, links with same text)
  const formatting = ['strong', 'emphasis', 'link', 'linkReference'];
  return formatting.includes(change.node?.type);
}
```

### Special Handling for Markdown Elements

#### Headers

```javascript
function detectHeaderChanges(oldMD, newMD) {
  const oldHeaders = extractHeaders(oldMD);
  const newHeaders = extractHeaders(newMD);

  return oldHeaders
    .map((oldH, i) => {
      const newH = newHeaders[i];

      if (!newH) return { type: 'removed', header: oldH };
      if (oldH.level !== newH.level) {
        return { type: 'level-changed', old: oldH, new: newH };
      }
      if (oldH.text !== newH.text) {
        return { type: 'renamed', old: oldH, new: newH };
      }
      return null;
    })
    .filter(Boolean);
}

function extractHeaders(markdown) {
  const headers = [];
  markdown.split('\n').forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headers.push({
        level: match[1].length,
        text: match[2],
        line: line,
      });
    }
  });
  return headers;
}
```

#### Lists

```javascript
function diffLists(oldList, newList) {
  const oldItems = oldList.split('\n').filter(l => l.match(/^\s*[-*+]\s/));
  const newItems = newList.split('\n').filter(l => l.match(/^\s*[-*+]\s/));

  return diffArrays(oldItems, newItems).map(change => {
    if (change.added) return { type: 'added', item: change.value };
    if (change.removed) return { type: 'removed', item: change.value };
    return { type: 'unchanged', item: change.value };
  });
}
```

#### Code Blocks

````javascript
function extractCodeBlocks(markdown) {
  const blocks = [];
  let inBlock = false;
  let currentBlock = { language: null, content: [], startLine: 0 };

  markdown.split('\n').forEach((line, i) => {
    if (line.match(/^```(\w+)?/)) {
      if (!inBlock) {
        inBlock = true;
        currentBlock = {
          language: line.match(/^```(\w+)/)?.[1] || null,
          content: [],
          startLine: i,
        };
      } else {
        inBlock = false;
        currentBlock.endLine = i;
        blocks.push(currentBlock);
      }
    } else if (inBlock) {
      currentBlock.content.push(line);
    }
  });

  return blocks;
}
````

---

## 5. Open-Source Examples and Resources

### GitHub Repositories

#### 1. **diff-so-fancy**

- **URL:** https://github.com/so-fancy/diff-so-fancy
- **Description:** Enhanced diff viewer for git with human-readable output
- **Key Features:**
  - Color-coded changes
  - Improved character-level highlighting
  - Clean, readable formatting
  - Diff categorization
- **Techniques Used:**
  - Post-processing unified diff output
  - Character-level change detection
  - Removal of diff noise
- **Best For:** Inspiration on presentation and readability

#### 2. **unified / remark / rehype ecosystem**

- **URL:** https://github.com/unifiedjs/unified
- **Description:** Unified processing framework for markdown/HTML
- **Related Repos:**
  - https://github.com/syntax-tree/mdast - Markdown AST specification
  - https://github.com/syntax-tree/unist - Universal Syntax Tree
  - https://github.com/remarkjs/remark - Markdown processor
- **Key Features:**
  - AST-based parsing
  - Plugin architecture
  - Language-agnostic tree format
- **Techniques Used:**
  - Parse to AST
  - Tree manipulation
  - Semantic analysis
- **Best For:** Building semantic markdown diff tools

#### 3. **Delta**

- **URL:** https://github.com/dandavison/delta
- **Description:** Modern diff viewer with syntax highlighting
- **Key Features:**
  - Syntax highlighting for code diffs
  - Side-by-side view
  - Line decorations and emblems
  - Commit graph integration
- **Techniques Used:**
  - Syntax highlighting integration (bat)
  - Diff parsing and rendering
  - Feature detection for terminal capabilities
- **Best For:** Modern terminal-based diff viewing

#### 4. **diff2html**

- **URL:** https://github.com/rtfpessoa/diff2html
- **Description:** Diff to HTML generator
- **Key Features:**
  - Line-by-line and side-by-side diffs
  - Multiple output formats
  - Color coding
  - File selection UI
- **Techniques Used:**
  - Unified diff parsing
  - HTML generation with CSS
  - Line matching algorithm
- **Best For:** Web-based diff viewers

#### 5. **Micromark**

- **URL:** https://github.com/micromark/micromark
- **Description:** Low-level markdown tokenizer
- **Key Features:**
  - CommonMark compliant
  - Token-level parsing
  - Extensible architecture
- **Techniques Used:**
  - Tokenization
  - State machine parsing
  - Character-level analysis
- **Best For:** Custom markdown parsing and diffing

#### 6. **jsondiffpatch**

- **URL:** https://github.com/benjamine/jsondiffpatch
- **Description:** Diff and patch for JavaScript objects
- **Key Features:**
  - JSON/object diffing
  - Array change detection
  - Delta format for patches
- **Techniques Used:**
  - Object comparison
  - Array indexing
  - Change delta generation
- **Best For:** AST comparison and diffing

### Blog Posts and Resources

#### 1. **"Myers Diff Algorithm"**

- **Topic:** Classic diff algorithm explanation
- **Key Concepts:**
  - O(ND) complexity
  - Edit graph shortest path
  - LCS (Longest Common Subsequence)
- **Best For:** Understanding fundamental diff algorithms

#### 2. **"Semantic Differencing"**

- **Topic:** Semantic vs syntactic diffing
- **Key Concepts:**
  - AST-based comparison
  - Language-specific analysis
  - Refactoring detection
- **Best For:** Understanding semantic approaches

#### 3. **"Understanding Git Diff"**

- **Topic:** How git implements diffing
- **Key Concepts:**
  - Blob comparison
  - Rename detection
  - Binary file handling
  - Whitespace options (-w, --ignore-space-at-eol)
- **Best For:** Production-grade diff implementation

### StackOverflow Discussions

#### 1. **"How to compare two markdown files semantically?"**

- **Key Answers:**
  - Parse to AST with remark/unified
  - Compare tree structures
  - Ignore formatting differences
- **Best Practices:**
  - Use AST for structure awareness
  - Normalize before comparison
  - Handle special cases (code blocks, links)

#### 2. **"Algorithm to detect significant changes in text"**

- **Key Answers:**
  - Levenshtein distance with thresholds
  - Token-based comparison
  - Statistical analysis (percentage changed)
- **Best Practices:**
  - Define significance thresholds
  - Consider document size
  - Use multiple metrics

#### 3. **"Ignore whitespace in diff"**

- **Key Answers:**
  - Normalize whitespace before diff
  - Use diff libraries with ignore options
  - Post-process diff to remove whitespace-only changes
- **Best Practices:**
  - Preserve whitespace in code blocks
  - Remove trailing whitespace
  - Normalize line endings

### Implementation Libraries

#### JavaScript/TypeScript

1. **diff** (https://github.com/kpdecker/jsdiff)
   - Text diff library
   - Multiple diff modes (words, chars, lines, json)
   - Whitespace ignoring options

2. **fast-diff** (https://github.com/johannes-codes/fast-diff)
   - Fast implementation of Myers diff
   - Character-level diffing
   - Good for real-time applications

3. **remark** (https://github.com/remarkjs/remark)
   - Markdown processor
   - AST-based
   - Plugin ecosystem

4. **unist-util-diff** (https://github.com/syntax-tree/unist-util-diff)
   - Diff utility for unist trees
   - Semantic comparison
   - Works with mdast

#### Python

1. **difflib** (Standard Library)
   - Built-in Python diff utilities
   - Multiple diff algorithms
   - HTML generation

2. **markdown-it-py** (https://github.com/executablebooks/markdown-it-py)
   - Markdown parser
   - Token-based
   - AST generation

3. **tree-sitter** (https://github.com/tree-sitter/tree-sitter)
   - Multi-language parser
   - AST generation
   - Incremental parsing

#### Rust

1. **similar** (https://github.com/mitsuhiko/similar)
   - Fast diff library
   - Multiple algorithms
   - Used by ripgrep and bat

2. **pulldown-cmark** (https://github.com/raphlinus/pulldown-cmark)
   - Markdown parser
   - Event-based
   - CommonMark compliant

---

## 6. Best Practice Summary

### Recommended Implementation Approach

For PRD/Markdown document diffing, use a **hybrid approach**:

1. **Parse to AST** for structure awareness
   - Use unified/remark for markdown
   - Extract document structure (headers, sections)

2. **Normalize content** to filter noise
   - Remove insignificant whitespace
   - Normalize line endings
   - Normalize multiple blank lines

3. **Section-based comparison** for hierarchical diffs
   - Group content by headers
   - Compare sections independently
   - Track moved content by header similarity

4. **Change categorization** for meaningful output
   - Added sections
   - Modified sections (with word-level diff)
   - Removed sections
   - Formatting changes (separate category)

5. **Significance filtering** to reduce noise
   - Ignore changes below percentage threshold
   - Separate formatting from content changes
   - Preserve whitespace in code blocks

### Implementation Checklist

- [ ] Parse markdown to AST (unified/remark)
- [ ] Extract document structure (headers, sections)
- [ ] Normalize text (whitespace, line endings)
- [ ] Implement section-based diffing
- [ ] Add change categorization (added/modified/removed)
- [ ] Implement significance thresholds
- [ ] Handle code blocks specially (preserve whitespace)
- [ ] Generate human-readable diff output
- [ ] Add change summary statistics

### Key Performance Considerations

1. **Caching:** Parse results can be cached
2. **Incremental diffing:** Only re-parse changed files
3. **Lazy parsing:** Parse sections on-demand
4. **Parallel processing:** Process independent sections in parallel
5. **Early exit:** Skip unchanged sections

### Change Significance Thresholds (Recommended)

| Metric                  | Threshold         | Rationale                            |
| ----------------------- | ----------------- | ------------------------------------ |
| Word change percentage  | 5%                | Filters minor edits                  |
| Minimum line changes    | 3 lines           | Avoids single-line noise             |
| Character edit distance | 10% per 100 chars | Catches substantive changes          |
| Section changes         | 1 section         | Any structural change is significant |

### Handling Edge Cases

1. **Code blocks:** Preserve exact whitespace, use line-by-line diff
2. **Tables:** Cell-level comparison, track structure changes
3. **Links:** Separate URL changes from text changes
4. **Images:** Track URL/alt changes
5. **HTML in markdown:** Parse as HTML entities
6. **Frontmatter:** Separate handling for YAML/TOML metadata

---

## 7. Sample Implementation

### Complete Example: Semantic Markdown Differ

```javascript
import { unified } from 'unified';
import parse from 'remark-parse';
import { diffWords } from 'diff';

class MarkdownDiffer {
  constructor(options = {}) {
    this.significanceThreshold = options.significanceThreshold || 0.05;
    this.preserveCodeBlocks = options.preserveCodeBlocks !== false;
  }

  diff(oldMarkdown, newMarkdown) {
    const oldAST = this._parse(oldMarkdown);
    const newAST = this._parse(newMarkdown);

    const oldSections = this._extractSections(oldAST);
    const newSections = this._extractSections(newAST);

    return this._compareSections(oldSections, newSections);
  }

  _parse(markdown) {
    return unified().use(parse).parse(markdown);
  }

  _extractSections(ast) {
    const sections = [];
    let currentSection = { header: null, content: [] };

    const visit = node => {
      if (node.type === 'heading') {
        if (currentSection.header || currentSection.content.length) {
          sections.push(currentSection);
        }
        currentSection = {
          level: node.depth,
          header: this._extractText(node),
          content: [],
        };
      } else if (node.type === 'code' && this.preserveCodeBlocks) {
        currentSection.content.push({
          type: 'code',
          lang: node.lang,
          value: node.value,
        });
      } else if (node.type !== 'root') {
        currentSection.content.push(node);
      }

      if (node.children) {
        node.children.forEach(visit);
      }
    };

    visit(ast);
    if (currentSection.header || currentSection.content.length) {
      sections.push(currentSection);
    }

    return sections;
  }

  _extractText(node) {
    if (node.value) return node.value;
    if (node.children) {
      return node.children.map(c => this._extractText(c)).join('');
    }
    return '';
  }

  _compareSections(oldSections, newSections) {
    const changes = [];

    oldSections.forEach((oldSection, i) => {
      const newSection = newSections[i];

      if (!newSection) {
        changes.push({
          type: 'removed',
          header: oldSection.header,
          level: oldSection.level,
        });
        return;
      }

      if (oldSection.header !== newSection.header) {
        changes.push({
          type: 'header-changed',
          oldHeader: oldSection.header,
          newHeader: newSection.header,
          level: newSection.level,
        });
      }

      const contentDiff = this._diffContent(
        oldSection.content,
        newSection.content
      );

      if (contentDiff.length > 0) {
        changes.push({
          type: 'content-changed',
          header: newSection.header || '(Root)',
          changes: contentDiff,
          significance: this._calculateSignificance(contentDiff),
        });
      }
    });

    // Check for added sections
    for (let i = oldSections.length; i < newSections.length; i++) {
      changes.push({
        type: 'added',
        header: newSections[i].header,
        level: newSections[i].level,
      });
    }

    return changes.filter(
      c =>
        c.type === 'added' ||
        c.type === 'removed' ||
        c.significance > this.significanceThreshold
    );
  }

  _diffContent(oldContent, newContent) {
    const changes = [];

    oldContent.forEach((oldNode, i) => {
      const newNode = newContent[i];

      if (!newNode) {
        changes.push({ type: 'removed', content: oldNode });
        return;
      }

      if (oldNode.type === 'code' && newNode.type === 'code') {
        if (oldNode.value !== newNode.value) {
          changes.push({
            type: 'code-changed',
            old: oldNode,
            new: newNode,
          });
        }
      } else {
        const oldText = this._extractText(oldNode);
        const newText = this._extractText(newNode);

        if (oldText !== newText) {
          const wordDiff = diffWords(oldText, newText);
          changes.push({
            type: 'text-changed',
            diff: wordDiff,
          });
        }
      }
    });

    // Check for added content
    for (let i = oldContent.length; i < newContent.length; i++) {
      changes.push({ type: 'added', content: newContent[i] });
    }

    return changes;
  }

  _calculateSignificance(changes) {
    if (changes.length === 0) return 0;

    let totalWords = 0;
    let changedWords = 0;

    changes.forEach(change => {
      if (change.type === 'text-changed') {
        change.diff.forEach(part => {
          const words = part.value.split(/\s+/).length;
          totalWords += words;
          if (part.added || part.removed) {
            changedWords += words;
          }
        });
      } else {
        changedWords += 10; // Weight for structure changes
      }
    });

    return totalWords > 0 ? changedWords / totalWords : 0;
  }
}

// Usage
const differ = new MarkdownDiffer({
  significanceThreshold: 0.05,
  preserveCodeBlocks: true,
});

const oldPRD = `# Features
## Authentication
User login and registration.

## Dashboard
Main user dashboard.`;

const newPRD = `# Features
## Authentication
Secure user login and registration with 2FA.

## Settings
User settings page.

## Dashboard
Main user dashboard with widgets.`;

const changes = differ.diff(oldPRD, newPRD);
console.log(changes);
// Output:
// [
//   {
//     type: 'content-changed',
//     header: 'Authentication',
//     changes: [...],
//     significance: 0.3
//   },
//   { type: 'added', header: 'Settings', level: 2 },
//   {
//     type: 'content-changed',
//     header: 'Dashboard',
//     changes: [...],
//     significance: 0.2
//   }
// ]
```

---

## 8. Testing Strategy

### Test Cases for Markdown Diffing

1. **Header Changes**
   - Rename header (same level)
   - Change header level
   - Add/remove headers
   - Reorder sections

2. **Content Changes**
   - Word-level edits
   - Line additions/removals
   - Paragraph reformatting

3. **Structure Changes**
   - Add/remove list items
   - Change list types (ordered/unordered)
   - Table modifications
   - Code block changes

4. **Whitespace Handling**
   - Trailing whitespace
   - Multiple blank lines
   - Indentation changes
   - Line ending differences (CRLF vs LF)

5. **Edge Cases**
   - Empty documents
   - Only whitespace changes
   - Code blocks with significant whitespace
   - Mixed languages (text + code)

---

## 9. Additional Resources

### Research Papers

1. **"An O(ND) Difference Algorithm and Its Variations"** - Eugene Myers
   - Foundation of modern diff algorithms
   - Most implementations use this

2. **"A Formal Investigation of Diff3"** - Sanjeev Khanna et al.
   - Three-way merging
   - Conflict detection strategies

### Standards and Specifications

1. **CommonMark Spec** - https://spec.commonmark.org/
   - Markdown standard
   - Parsing rules

2. **Unified Diff Format** - POSIX standard
   - Standard diff output format
   - Patch file format

### Tools for Inspiration

1. **GitHub PR diff viewer**
   - Side-by-side view
   - File-by-file changes
   - Commit grouping

2. **Google Docs "Suggesting" mode**
   - Inline suggestions
   - Accept/reject workflow
   - Change attribution

3. **Notion page history**
   - Visual timeline
   - Section-level changes
   - Rollback capability

---

## Conclusion

For implementing text diffing for structured documents like PRDs and markdown files:

1. **Use semantic diffing** (AST-based) for meaningful change detection
2. **Implement section-based comparison** to handle document hierarchy
3. **Filter whitespace noise** through normalization and significance thresholds
4. **Categorize changes** (added/modified/removed/moved) for clear output
5. **Handle code blocks specially** to preserve whitespace significance
6. **Provide multiple views** (summary + detailed diff) for different use cases

The hybrid approach combining AST parsing with smart diffing algorithms provides the best balance of accuracy, performance, and readability for document collaboration workflows.
