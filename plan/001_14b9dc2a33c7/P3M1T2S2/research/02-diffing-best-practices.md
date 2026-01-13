# Best Practices for PRD/Markdown Diffing

## 1. Line-by-Line vs Semantic Diffing

### Line-by-Line Diffing

- **Pros:** Fast, simple to implement
- **Cons:** Noisy - shows formatting/refactoring as major changes

### Semantic Diffing

- **Pros:** Understands structure, ignores formatting noise
- **Cons:** Slower, requires AST parsing

### Recommendation: Hybrid Approach

- Use semantic diffing for structure (sections)
- Use line-by-line for content within sections

---

## 2. Section-Aware Diffing Strategy

PRDs have hierarchical structure with headers. Parse by sections for meaningful diffs:

```typescript
interface PRDSection {
  level: number; // Header level (1-6)
  title: string; // Section title
  content: string; // Section content
  lineNumber: number; // Starting line number
}
```

### Algorithm

1. Parse both PRDs into sections by headers
2. Match sections by title
3. Diff unmatched sections as added/removed
4. Diff matched section contents for modifications

---

## 3. Change Categorization

Categories: `added`, `modified`, `removed`

### Added

- Section exists in new PRD but not old PRD
- Content appended to existing sections

### Modified

- Section exists in both with content changes
- Word-level diff shows what changed

### Removed

- Section exists in old PRD but not new PRD
- Content deleted from sections

---

## 4. Filtering Whitespace/Minor Edits

### Significance Metrics

- **Word change percentage:** 5% threshold
- **Minimum line changes:** 3 lines
- **Character edit distance:** 10% per 100 chars

### Normalization Before Diffing

```typescript
function normalizeMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/  +/g, ' ') // Normalize multiple spaces
    .replace(/^[\s•\-*]\s+/gm, '- ') // Normalize bullet points
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}
```

---

## 5. Markdown-Specific Handling

### Code Blocks

- Preserve whitespace in code blocks (`...`)
- Don't normalize content inside code blocks

### Headers

- Track header renames as section changes
- Header level changes are significant

### Lists

- Normalize bullet points (-, \*, +) before diffing
- Track list item additions/removals

---

## 6. Implementation Example

```typescript
import diff from 'fast-diff';

function hasSignificantChanges(
  oldContent: string,
  newContent: string
): boolean {
  const changes = diff(oldContent, newContent);
  const significant = changes.filter(
    ([type, text]) => type !== 0 && text.trim().length > 0
  );

  // Filter out whitespace-only changes
  const nonWhitespace = significant.filter(([_, text]) => /\S/.test(text));

  // 5% word change threshold
  const totalWords = newContent.split(/\s+/).length;
  const changedWords = nonWhitespace.reduce(
    (sum, [_, text]) => sum + text.split(/\s+/).length,
    0
  );

  return changedWords / totalWords > 0.05;
}
```

---

## Sources

- [diff-so-fancy](https://github.com/so-fancy/diff-so-fancy) - Enhanced diff presentation
- [unifiedjs/unified](https://github.com/unifiedjs/unified) - AST-based markdown processing
- [dandavison/delta](https://github.com/dandavison/delta) - Modern diff viewer
- [rtfpessoa/diff2html](https://github.com/rtfpessoa/diff2html) - Diff to HTML generation
