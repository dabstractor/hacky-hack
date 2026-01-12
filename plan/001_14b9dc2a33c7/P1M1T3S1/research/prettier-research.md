# Prettier Configuration Research for TypeScript Projects

_Research Date: 2025-01-12_

## Official Documentation URLs

### Primary Documentation

- **Main Prettier Documentation**: https://prettier.io/docs/en/
- **Configuration Options**: https://prettier.io/docs/en/options.html
- **Configuration File**: https://prettier.io/docs/en/configuration.html
- **Install & Usage**: https://prettier.io/docs/en/install.html
- **Integrating with Linters**: https://prettier.io/docs/en/integrating-with-linters.html
- **Ignoring Code**: https://prettier.io/docs/en/ignore.html
- **CLI**: https://prettier.io/docs/en/cli.html

### TypeScript-Specific Resources

- **Prettier GitHub Repository**: https://github.com/prettier/prettier
- **TypeScript Parser Support**: Built into Prettier (no additional parser needed)
- **Prettier Playground**: https://prettier.io/playground/

### ESLint Integration

- **eslint-config-prettier**: https://github.com/prettier/eslint-config-prettier
- **eslint-plugin-prettier**: https://github.com/prettier/eslint-plugin-prettier
- **Prettier ESLint Integration Guide**: https://prettier.io/docs/en/integrating-with-linters.html

---

## Recommended Configuration Examples

### Basic .prettierrc Configuration for TypeScript

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Alternative .prettierrc Configuration (Stricter)

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
```

### JavaScript Configuration (prettier.config.js)

```javascript
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
};
```

### TypeScript-Specific Override Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "overrides": [
    {
      "files": "*.ts",
      "options": {
        "parser": "typescript"
      }
    },
    {
      "files": "*.tsx",
      "options": {
        "parser": "typescript",
        "jsxSingleQuote": false
      }
    },
    {
      "files": ["*.json", "*.jsonc"],
      "options": {
        "trailingComma": "none"
      }
    }
  ]
}
```

### Minimal Configuration (Prettier Defaults)

```json
{
  "singleQuote": true,
  "semi": true
}
```

---

## Configuration Options Explained

### Semicolons (`semi`)

**Options**: `true` (default) | `false`

**Recommendation for TypeScript**: `true`

TypeScript generally benefits from explicit semicolons to:

- Avoid ASI (Automatic Semicolon Insertion) issues
- Maintain consistency with TypeScript compiler output
- Align with most TypeScript style guides

```typescript
// With "semi": true
const foo = 'bar';
function baz() {
  return true;
}

// With "semi": false
const foo = 'bar';
function baz() {
  return true;
}
```

### Trailing Commas (`trailingComma`)

**Options**: `"es5"` | `"all"` | `"none"`

**Recommendation for TypeScript**:

- **`"es5"`** - Best for Node.js and modern browser projects
- **`"all"`** - For projects targeting very modern environments (ES2017+)

```typescript
// "trailingComma": "es5"
const obj = {
  foo: 'bar',
  baz: 'qux',
};

const arr = [1, 2, 3];

// "trailingComma": "all"
function foo(param1: string, param2: number) {
  // ...
}
```

**Note**: `trailingComma: "all"` adds trailing commas to function parameters and function calls, which requires ES2017+ support.

### Single Quotes (`singleQuote`)

**Options**: `true` | `false` (default)

**Recommendation**: Depends on team preference, but `true` is popular in TypeScript/React communities.

```typescript
// "singleQuote": true
const message = 'Hello, world!';
const template = `This is a template string`;

// "singleQuote": false (double quotes)
const message = 'Hello, world!';
```

### Print Width (`printWidth`)

**Options**: Number (default: `80`)

**Recommendation**: `80` or `100`

This is the line length that Prettier will try to maintain. It's a soft limit - Prettier may exceed it in some cases.

### Tab Width (`tabWidth`)

**Options**: Number (default: `2`)

**Recommendation**: `2` for TypeScript projects

This defines the number of spaces per indentation level.

### Arrow Function Parentheses (`arrowParens`)

**Options**: `"avoid"` | `"always"`

**Recommendation**: `"avoid"` for cleaner code, `"always"` for consistency

```typescript
// "arrowParens": "avoid"
arr.map(x => x * 2);

// "arrowParens": "always"
arr.map(x => x * 2);
```

### End of Line (`endOfLine`)

**Options**: `"auto"` | `"lf"` | `"crlf"` | `"cr"`

**Recommendation**: `"lf"` for consistency across platforms, especially for projects on Git

---

## Integration with ESLint

### Recommended Packages

```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### ESLint Configuration (.eslintrc.json)

#### Option 1: Basic Integration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  }
}
```

#### Option 2: With Prettier Plugin

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "prettier/prettier": "error"
  }
}
```

**Important**: The `plugin:prettier/recommended` extension automatically:

- Includes `eslint-config-prettier` (disables conflicting ESLint rules)
- Includes `eslint-plugin-prettier` (runs Prettier as an ESLint rule)

#### Option 3: Manual Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/semi": "off",
    "@typescript-eslint/quotes": "off"
  }
}
```

### Key ESLint Rules to Disable

When using Prettier, these ESLint formatting rules should be disabled (automatically done by `eslint-config-prettier`):

- `indent`
- `quotes`
- `semi`
- `comma-dangle`
- `max-len`
- `arrow-parens`
- `arrow-body-style`
- `object-curly-spacing`
- `array-bracket-spacing`
- `space-before-function-paren`
- All other formatting rules

### Package.json Scripts

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "lint": "eslint \"src/**/*.ts\"",
    "lint:fix": "eslint \"src/**/*.ts\" --fix"
  }
}
```

### VS Code Settings (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Common Gotchas and Pitfalls

### 1. ESLint and Prettier Conflicts

**Problem**: ESLint and Prettier try to format the same code, causing conflicts and inconsistent formatting.

**Solution**: Always use `eslint-config-prettier` to disable conflicting ESLint rules.

```json
{
  "extends": ["plugin:prettier/recommended"]
}
```

### 2. Prettier Not Recognizing TypeScript Files

**Problem**: Prettier doesn't format `.ts` or `.tsx` files.

**Solution**: Prettier automatically recognizes TypeScript files by extension. If you have issues, check:

1. File extensions are `.ts` or `.tsx`
2. Prettier is properly installed
3. No `.prettierignore` rule is excluding the files

### 3. Trailing Commas in Older JavaScript Environments

**Problem**: Using `trailingComma: "all"` breaks code in older browsers/Node.js versions.

**Solution**: Use `trailingComma: "es5"` for better compatibility, or ensure your build target supports ES2017+.

```json
{
  "trailingComma": "es5"
}
```

### 4. Inconsistent Line Endings

**Problem**: Git shows files as entirely changed due to line ending differences (`CRLF` vs `LF`).

**Solution**: Set `endOfLine: "lf"` and configure Git:

```json
{
  "endOfLine": "lf"
}
```

```bash
# .gitattributes
* text=auto eol=lf
```

### 5. Prettier Cache Issues

**Problem**: Prettier doesn't apply new configuration changes after updating `.prettierrc`.

**Solution**: Clear Prettier cache:

```bash
# Delete .prettiercache
rm .prettiercache

# Or run with --no-cache
prettier --write --no-cache "src/**/*.ts"
```

### 6. Overriding Prettier for Specific Files

**Problem**: Need different formatting rules for specific file types (e.g., JSON vs TypeScript).

**Solution**: Use `overrides` in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "trailingComma": "none"
      }
    },
    {
      "files": "*.md",
      "options": {
        "proseWrap": "preserve"
      }
    }
  ]
}
```

### 7. Prettier vs. TypeScript Compiler Formatting

**Problem**: TypeScript's compiler has some formatting preferences that differ from Prettier.

**Solution**: Let Prettier handle formatting and disable TypeScript's formatting options in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "noEmitHelpers": true
  }
}
```

### 8. Single vs Double Quotes in JSX/TSX

**Problem**: Inconsistent quote usage in JSX attributes.

**Solution**: Use the `jsxSingleQuote` option:

```json
{
  "singleQuote": true,
  "jsxSingleQuote": false
}
```

This uses single quotes in TypeScript/JavaScript but double quotes in JSX attributes.

### 9. Formatting in Monorepos

**Problem**: Different packages in a monorepo have different Prettier configurations.

**Solution**: Use a single Prettier configuration at the root and share it:

```json
{
  "overrides": [
    {
      "files": ["packages/**/*"],
      "options": {
        "semi": true,
        "singleQuote": true
      }
    }
  ]
}
```

Or use a shared config file:

```javascript
// prettier.config.js
module.exports = require('@my-org/prettier-config');
```

### 10. Prettier Slowing Down the Build

**Problem**: Running Prettier on large codebases is slow.

**Solutions**:

- Use `.prettierignore` to exclude build artifacts and dependencies
- Use `--write` only on changed files in CI
- Consider using `prettier --cache` (available in newer versions)
- Run Prettier in parallel using tools like `npm-run-all` or `concurrently`

### 11. Type-Only Imports Formatting

**Problem**: Prettier doesn't preserve the grouping of type-only imports.

**Solution**: This is a known limitation. Consider using a plugin like `prettier-plugin-organize-imports`:

```bash
npm install --save-dev prettier-plugin-organize-imports
```

```javascript
// prettier.config.js
module.exports = {
  plugins: ['prettier-plugin-organize-imports'],
  // ... other options
};
```

### 12. Ignoring Files

**Problem**: Need to exclude certain files from Prettier formatting.

**Solution**: Use `.prettierignore`:

```
# .prettierignore
node_modules
dist
build
coverage
.min.js
.min.css
package-lock.json
pnpm-lock.yaml
```

### 13. Formatting with Git Hooks

**Problem**: Want to automatically format files before commits.

**Solution**: Use lint-staged with Husky:

```bash
npm install --save-dev husky lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["prettier --write", "eslint --fix"]
  }
}
```

### 14. Preserving Formatting in Specific Sections

**Problem**: Want to preserve manual formatting in certain sections (e.g., aligned tables).

**Solution**: Use Prettier ignore comments:

```typescript
// prettier-ignore
const table = {
  name:      "John",
  age:       30,
  location: "NYC"
};
```

Or for a block:

```typescript
/* prettier-ignore-start */
const manuallyFormatted = {
  foo: 'bar',
  baz: 'qux',
};
/* prettier-ignore-end */
```

### 15. Prettier Removing Parentheses

**Problem**: Prettier removes parentheses around arrow function returns, affecting code clarity.

**Solution**: This is intentional Prettier behavior. If you need parentheses, use `arrowParens: "always"`:

```json
{
  "arrowParens": "always"
}
```

---

## Best Practices Summary

1. **Always use `eslint-config-prettier`** when integrating with ESLint
2. **Set `endOfLine: "lf"`** for consistent line endings across platforms
3. **Use `.prettierignore`** to exclude build artifacts and dependencies
4. **Leverage `overrides`** for file-type-specific formatting rules
5. **Use Prettier in CI** with `--check` to catch unformatted code
6. **Format on save** in your IDE for consistent formatting
7. **Share configuration** across teams and projects
8. **Use semantic versioning** for Prettier updates
9. **Clear cache** when troubleshooting configuration issues
10. **Test configuration** in the Prettier Playground before applying

---

## Additional Resources

### Prettier Plugins

- **prettier-plugin-organize-imports**: https://github.com/simonhaenisch/prettier-plugin-organize-imports
- **prettier-plugin-packagejson**: https://github.com/matzkoh/prettier-plugin-packagejson

### Community Configurations

- **@github/prettier-config**: GitHub's Prettier configuration
- **@tsconfig/prettier**: TypeScript team's Prettier configuration
- **eslint-config-airbnb-typescript**: Airbnb's TypeScript ESLint config with Prettier

### Tools

- **Prettier VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
- **prettier CLI**: Command-line interface for Prettier

---

_Note: This research is based on Prettier 3.x and TypeScript 5.x. Always refer to the official documentation for the most up-to-date information._
