# Syntax Highlighting Research

## Source: External Research via General-Purpose Agent

## Recommended Libraries

### Primary: cli-highlight
- **Package**: `cli-highlight`
- **npm**: https://www.npmjs.com/package/cli-highlight
- **Description**: Dedicated CLI syntax highlighting library
- **Features**: 180+ languages, auto-detection, customizable themes
- **Install**: `npm install cli-highlight`

### For JSON: json-colorizer
- **Package**: `json-colorizer`
- **npm**: https://www.npmjs.com/package/json-colorizer
- **Description**: Simple, focused JSON coloring
- **Features**: Customizable color schemes, lightweight
- **Install**: `npm install json-colorizer`

### Foundation: chalk (already installed)
- **Package**: `chalk@^5.6.2` (already in project)
- **Usage**: Terminal string styling, colored output

## Code Examples

### JSON Highlighting with cli-highlight
```typescript
import { highlight } from 'cli-highlight';

const jsonData = {
  name: "Example",
  value: 42,
  nested: { key: "value" }
};

const highlightedJson = highlight(JSON.stringify(jsonData, null, 2), {
  language: 'json',
  theme: 'monokai' // or 'github', 'atom-one-dark', etc.
});

console.log(highlightedJson);
```

### JSON Highlighting with json-colorizer
```typescript
import colorize from 'json-colorizer';

const jsonData = { name: "Example", value: 42 };

console.log(colorize(JSON.stringify(jsonData, null, 2), {
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
    NUMBER_LITERAL: 'yellow',
    BOOLEAN_LITERAL: 'magenta',
    NULL_LITERAL: 'red'
  }
}));
```

### Markdown Highlighting with cli-highlight
```typescript
import { highlight } from 'cli-highlight';

const markdownContent = "# Title\n\nThis is **bold** text.";

const highlightedMd = highlight(markdownContent, {
  language: 'markdown',
  theme: 'github'
});

console.log(highlightedMd);
```

## Best Practices

### Color Accessibility
- Use high contrast colors
- Support light and dark terminal themes
- Consider color blindness
- Respect `NO_COLOR` environment variable
- Provide `--color` flags (auto/always/never)

### Performance
- Cache parsed syntax for repeated output
- Use lazy evaluation for large documents
- Implement streaming for very large files

### Complete Output Formatter Example
```typescript
import chalk from 'chalk';
import { highlight } from 'cli-highlight';

export class OutputFormatter {
  private useColor: boolean;

  constructor(colorMode: 'auto' | 'always' | 'never' = 'auto') {
    this.useColor =
      colorMode === 'always' ||
      (colorMode === 'auto' && process.stdout.isTTY && !process.env.NO_COLOR);
  }

  formatJSON(data: unknown): string {
    const json = JSON.stringify(data, null, 2);
    if (!this.useColor) return json;

    return highlight(json, {
      language: 'json',
      theme: 'monokai'
    });
  }

  formatMarkdown(markdown: string): string {
    if (!this.useColor) return markdown;

    return highlight(markdown, {
      language: 'markdown',
      theme: 'github'
    });
  }
}
```

## Terminal Color Scheme

Following existing patterns in `src/utils/display/status-colors.ts`:
- **Green**: Success, additions
- **Red**: Errors, deletions
- **Cyan/Blue**: Headers, info
- **Yellow**: Warnings
- **Gray**: Context, unchanged

## Documentation URLs

- cli-highlight: https://github.com/felixfbecker/cli-highlight
- json-colorizer: https://www.npmjs.com/package/json-colorizer
- chalk: https://github.com/chalk/chalk
- NO_COLOR standard: https://no-color.org/
