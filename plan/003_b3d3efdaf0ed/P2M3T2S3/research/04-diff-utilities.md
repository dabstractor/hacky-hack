# Diff/Compare Utilities Research

## Source: External Research via General-Purpose Agent

## Recommended Libraries

### Primary: diff

- **Package**: `diff`
- **npm**: https://www.npmjs.com/package/diff
- **Description**: Most popular JavaScript diff library
- **Features**: Unified, colored, JSON diffs
- **Documentation**: https://github.com/kpdecker/jsdiff
- **Install**: `npm install diff`

### For JSON: jsondiffpatch

- **Package**: `jsondiffpatch`
- **npm**: https://www.npmjs.com/package/jsondiffpatch
- **Description**: Specialized JSON diffing with patch support
- **Features**: Colored delta output, semantic JSON comparison
- **Documentation**: https://github.com/benjamine/jsondiffpatch
- **Install**: `npm install jsondiffpatch`

### Existing in Project: fast-diff

- **Package**: `fast-diff` (already in dependencies via prettier-linter-helpers)
- **Current Usage**: `src/core/prd-differ.ts` for PRD diffing
- **Consideration**: Can extend usage for artifact diffing

## Code Examples

### Basic Text Diff with `diff` package

```typescript
import * as diff from 'diff';

const oldContent = 'line 1\nline 2\nline 3';
const newContent = 'line 1\nline 2 modified\nline 3';

const changes = diff.diffLines(oldContent, newContent);

for (const change of changes) {
  if (change.added) {
    console.log(chalk.green('+ ' + change.value));
  } else if (change.removed) {
    console.log(chalk.red('- ' + change.value));
  } else {
    console.log('  ' + change.value);
  }
}
```

### JSON Diff with `jsondiffpatch`

```typescript
import * as jsondiffpatch from 'jsondiffpatch';

const differ = jsondiffpatch.create({
  objectHash: (obj: any) => obj.id || obj._id || JSON.stringify(obj),
});

const oldJSON = { name: 'Test', value: 42 };
const newJSON = { name: 'Test', value: 43 };

const delta = differ.diff(oldJSON, newJSON);

// Format as colored output
const formatter = jsondiffpatch.formatters.console;
console.log(formatter.format(delta, oldJSON));
```

### Unified Diff Format

```typescript
import * as diff from 'diff';

const patch = diff.createTwoFilesPatch(
  'old.json',
  'new.json',
  oldContent,
  newContent,
  'Old header',
  'New header'
);

console.log(patch);
```

## Terminal-Friendly Display

### Following Existing Patterns

Use existing display utilities from `src/utils/display/`:

- `cli-table3` for summary tables
- `chalk` for colored output
- Unicode box-drawing characters for structure

### Color Scheme (matches existing)

- Green: Additions
- Red: Deletions
- Cyan: Headers
- Gray: Context/unchanged

### Side-by-Side Diff Example

```typescript
function formatSideBySideDiff(
  oldLines: string[],
  newLines: string[],
  width: number = 80
): string {
  const halfWidth = Math.floor((width - 5) / 2);
  const output: string[] = [];

  output.push(
    chalk.cyan('OLD'.padEnd(halfWidth)) +
      chalk.gray(' │ ') +
      chalk.cyan('NEW'.padEnd(halfWidth))
  );

  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : '';
    const newLine = i < newLines.length ? newLines[i] : '';

    const leftStr = oldLine.padEnd(halfWidth);
    const rightStr = newLine.padEnd(halfWidth);

    if (oldLine !== newLine) {
      output.push(
        chalk.red(leftStr) + chalk.gray(' │ ') + chalk.green(rightStr)
      );
    } else {
      output.push(leftStr + chalk.gray(' │ ') + rightStr);
    }
  }

  return output.join('\n');
}
```

## Performance Considerations

### Large Files

- Use streaming for large artifacts
- Detect binary files and skip
- Limit context lines (default: 3)

### TTY Detection

```typescript
function shouldUseColor(): boolean {
  return process.stdout.isTTY || !!process.env.FORCE_COLOR;
}

function getContextLines(): number {
  return process.env.CI ? 10 : 3; // More context in CI/CD
}
```

## Integration with Existing Code

### Extend `src/core/prd-differ.ts` Pattern

```typescript
// src/utils/artifact-differ.ts
import fastDiff from 'fast-diff';
import chalk from 'chalk';

export function diffArtifacts(
  oldContent: string,
  newContent: string,
  options: { color?: boolean } = {}
): string {
  const { color = true } = options;
  const changes: Array<[-1 | 0 | 1, string]> = fastDiff(oldContent, newContent);

  const lines: string[] = [];
  for (const [type, text] of changes) {
    if (type === -1) {
      lines.push(color ? chalk.red('- ' + text) : '- ' + text);
    } else if (type === 1) {
      lines.push(color ? chalk.green('+ ' + text) : '+ ' + text);
    } else {
      lines.push('  ' + text);
    }
  }

  return lines.join('');
}
```

## Installation Commands

```bash
# Core diff library
npm install diff

# For JSON-specific diffing
npm install jsondiffpatch

# Types
npm install --save-dev @types/diff
```

## Documentation URLs

- diff: https://github.com/kpdecker/jsdiff
- jsondiffpatch: https://github.com/benjamine/jsondiffpatch
- fast-diff (existing): https://github.com/johndias/fast-diff

## Key Implementation Decisions

1. **Use `diff` package** for general-purpose text diffing (unified format)
2. **Add `jsondiffpatch`** for sophisticated JSON delta operations
3. **Extend `fast-diff` usage** from existing `prd-differ.ts`
4. **Follow existing display patterns** for consistent UI
5. **Respect NO_COLOR** and TTY detection
