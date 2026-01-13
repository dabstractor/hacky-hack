# TypeScript Diff Libraries Research

## 1. fast-diff (RECOMMENDED)

**NPM:** https://www.npmjs.com/package/fast-diff
**GitHub:** https://github.com/jhchen/fast-diff
**Status:** Already installed in project (v1.3.0)

### Installation

```bash
npm install fast-diff
```

### API

```typescript
import diff from 'fast-diff';

type Diff = [-1 | 0 | 1, string];
// -1: DELETE
//  0: EQUAL
//  1: INSERT

function diff(
  text1: string,
  text2: string,
  cursorPos?: number | CursorInfo,
  cleanup?: boolean
): Diff[];
```

### Example

```typescript
import diff from 'fast-diff';

const oldPRD = '# Features\n- User auth\n- Data export';
const newPRD =
  '# Features\n- User authentication\n- Real-time notifications\n- Data export';

const changes = diff(oldPRD, newPRD);
// Output: [[0, "# Features\n- User "], [-1, "auth"], [1, "authentication"], ...]
```

### Pros

- Best performance (optimized Myers algorithm)
- Native TypeScript support
- Already installed
- Small bundle (~52KB)
- Active maintenance

### Cons

- Character-based diffs (requires manual line splitting)
- No semantic cleanup options

---

## 2. diff-match-patch

**NPM:** https://www.npmjs.com/package/diff-match-patch
**GitHub:** https://github.com/JackuB/diff-match-patch
**Types:** https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/diff-match-patch

### Installation

```bash
npm install diff-match-patch
npm install --save-dev @types/diff-match-patch
```

### API

```typescript
import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();
dmp.diff_main(text1: string, text2: string): Array<[number, string]>;
dmp.diff_cleanupSemantic(diffs): void;
dmp.patch_make(text1: string, text2: string): Array<Patch>;
```

### Pros

- Google's battle-tested algorithm
- Semantic cleanup capabilities
- Character-level precision

### Cons

- Last updated May 2020
- Larger bundle (~97KB)
- Steeper learning curve

---

## 3. diff (jsdiff)

**NPM:** https://www.npmjs.com/package/diff
**GitHub:** https://github.com/kpdecker/jsdiff

### Installation

```bash
npm install diff
```

### API

```typescript
import { diffLines, diffWords, diffChars, diffJson } from 'diff';

const changes = diffLines(oldStr, newStr, {
  oneChangePerToken?: boolean,
  ignoreWhitespace?: boolean
});
```

### Pros

- Feature-rich (lines, words, chars, JSON, patches)
- Battle-tested (used by Jest)
- Multiple granularities

### Cons

- Larger bundle (~150KB)
- Slower performance
- Not installed yet

---

## Recommendation

**Use `fast-diff`** because:

1. Already installed in the project
2. Best performance for large PRDs
3. Native TypeScript support
4. Sufficient for custom section-aware diffing
