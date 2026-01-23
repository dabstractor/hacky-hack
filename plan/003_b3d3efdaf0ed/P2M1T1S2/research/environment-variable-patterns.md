# Environment Variable Documentation Patterns in Node.js/TypeScript Projects

**Research Date:** 2026-01-23
**Purpose:** Comprehensive analysis of how modern Node.js/TypeScript projects document environment variables

---

## Table of Contents

1. [Popular npm Packages Documentation Styles](#1-popular-npm-packages-documentation-styles)
2. [Configuration Loading Order Best Practices](#2-configuration-loading-order-best-practices)
3. [Security Documentation Patterns](#3-security-documentation-patterns)
4. [Model Selection Configuration Patterns](#4-model-selection-configuration-patterns)
5. [Documentation Templates](#5-documentation-templates)

---

## 1. Popular npm Packages Documentation Styles

### 1.1 dotenv Package

**Source:** [github.com/motdotla/dotenv](https://github.com/motdotla/dotenv)

**Documentation Pattern:**

The dotenv package uses a minimalist, practical approach:

````markdown
## Usage

Create a `.env` file in the root of your project:

```dosini
S3_BUCKET="YOURS3BUCKET"
SECRET_KEY="YOURSECRETKEYGOESHERE"
```
````

As early as possible in your application, import and configure dotenv:

```javascript
require('dotenv').config();
```

That's it. `process.env` now has the keys and values you defined in your `.env` file.

````

**Key Characteristics:**
- **Inline comments** for configuration values
- **Dosini syntax highlighting** in code examples
- **Simple copy-paste examples** (no abstraction)
- **Separates installation from usage**
- **Links to Twelve-Factor App methodology**

**Example .env with comments:**

```dosini
# This is a comment
SECRET_KEY=YOURSECRETKEYGOESHERE # inline comments work too
SECRET_HASH="something-with-a-#-hash" # quote values with #
````

---

### 1.2 Framework Documentation Patterns

#### NestJS (@nestjs/config)

**Source:** [docs.nestjs.com/techniques/configuration](https://docs.nestjs.com/techniques/configuration)

**Documentation Pattern:**

````markdown
## Configuration

The `@nestjs/config` package provides a convenient approach to application configuration.

### Installation

```bash
npm install @nestjs/config
```
````

### Basic Usage

```typescript
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}
```

### Schema Validation

```typescript
import * as Joi from 'joi';

ConfigModule.forRoot({
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(3000),
  }),
}),
```

````

**Key Characteristics:**
- **TypeScript-first** examples
- **Schema validation** as a first-class concept
- **Environment-specific configuration** files
- **Custom configuration paths**
- **Validation schemas** documented inline

#### Fastify (@fastify/env)

**Documentation Pattern:**

```typescript
import * as fastify from 'fastify'
import * as fastifyEnv from '@fastify/env'

const schema = {
  type: 'object',
  required: ['PORT'],
  properties: {
    PORT: {
      type: 'integer',
      default: 3000
    }
  }
}

const fastify = fastify()

fastify.register(fastifyEnv, {
  schema,
  dotenv: true // will read .env file
})
````

**Key Characteristics:**

- **JSON Schema** for validation
- **Plugin-based** architecture
- **Default values** in schema
- **Explicit required fields**

---

### 1.3 CLI Tools Documentation

#### Commander.js

**Source:** [github.com/tj/commander.js](https://github.com/tj/commander.js)

**Pattern for Environment Variables:**

```typescript
#!/usr/bin/env node

import { Command, Option } from 'commander';

const program = new Command();

program
  .addOption(new Option('-p, --port <number>', 'port number').env('PORT'))
  .addOption(new Option('--debug', 'enable debug mode').env('DEBUG'));

program.parse();

// Usage shown in help output:
// -p, --port <number>    port number (env: PORT)
```

**Key Characteristics:**

- **Dual-source configuration** (CLI flags AND env vars)
- **Help output** shows env var sources
- **Consistent naming** between flags and env vars
- **Explicit mapping** with `.env('VAR_NAME')`

---

### 1.4 Build Tools (Vite, webpack)

#### Vite

**Source:** [vitejs.dev/guide/env-and-mode](https://vitejs.dev/guide/env-and-mode.html)

**Documentation Pattern:**

```markdown
## Environment Variables

### Env Files

Vite loads the following env files:
```

.env # loaded in all cases
.env.local # loaded in all cases, ignored by git
.env.[mode] # only loaded in specified mode
.env.[mode].local # only loaded in specified mode, ignored by git

```

### Exposing Env Variables

Only env variables starting with `VITE_` are exposed to your client code:

```

VITE_SOME_KEY=123

````

```js
console.log(import.meta.env.VITE_SOME_KEY) // 123
````

### Built-in Variables

- `import.meta.env.MODE`: {string} - The mode
- `import.meta.env.PROD`: {boolean} - True if in production
- `import.meta.env.DEV`: {boolean} - True if in development
- `import.meta.env.SSR`: {boolean} - True if in SSR

````

**Key Characteristics:**
- **File naming conventions** documented clearly
- **Prefix requirements** (`VITE_`) explicitly stated
- **Built-in variables** listed with types
- **Mode-specific** loading patterns
- **Git ignore** guidance included

#### webpack

**Documentation Pattern:**

```markdown
## Environment Variables

webpack supports environment variables via:

1. **shell variables** (passed during build)
2. **webpack DefinePlugin** (compile-time constants)
3. **.env files** (with dotenv-webpack)

Example with DefinePlugin:

```js
const webpack = require('webpack');

module.exports = {
  // ...
  plugins: [
    new webpack.DefinePlugin({
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
    })
  ]
};
````

````

**Key Characteristics:**
- **Multiple mechanisms** explained
- **Compile-time vs runtime** distinction
- **JSON.stringify** pattern documented (gotcha)
- **Plugin-based** approach

---

### 1.5 Testing Frameworks (Vitest)

**Source:** [vitest.dev](https://vitest.dev)

**Documentation Pattern:**

```markdown
## Environment Variables

Vitest supports `.env` files:

````

.test.env # only loaded in test mode
.test.local.env # only in test mode, git-ignored

````

### Access in Tests

```ts
import { describe, it, expect } from 'vitest';

describe('environment', () => {
  it('reads env vars', () => {
    expect(process.env.TEST_VAR).toBeDefined();
  });
});
````

### Mocking Environment Variables

```ts
import { beforeEach } from 'vitest';

beforeEach(() => {
  process.env.CUSTOM_VAR = 'test';
});
```

**Key Characteristics:**

- **Test-specific** env files
- **Mocking patterns** documented
- **Access patterns** shown with examples

---

## 2. Configuration Loading Order Best Practices

### 2.1 Documenting Priority Order

**Common Pattern: Explicit Hierarchy Table**

```markdown
## Configuration Loading Order

Configuration is loaded in the following order (highest priority last):

| Priority | Source             | Example                     |
| -------- | ------------------ | --------------------------- |
| 1        | Default values     | Built into code             |
| 2        | `.env` file        | `API_KEY=xxx`               |
| 3        | `.env.local` file  | `API_KEY=yyy` (git-ignored) |
| 4        | Shell environment  | `export API_KEY=zzz`        |
| 5        | Command-line flags | `--api-key=aaa`             |

**Later sources override earlier sources.**

Example: If you set `API_KEY` in both `.env` and your shell, the shell value wins.
```

### 2.2 Explaining Shell vs .env vs Runtime

**Clear Explanation Template:**

````markdown
## Configuration Sources

### 1. Shell Environment (Runtime)

Set environment variables in your shell before running the application:

```bash
export ANTHROPIC_API_KEY="sk-ant-xxx"
npm start
```
````

**Use when:**

- Deploying to production
- CI/CD environments
- Docker containers

### 2. .env Files (Development)

Create a `.env` file in your project root:

```bash
ANTHROPIC_API_KEY=sk-ant-xxx
```

**Use when:**

- Local development
- Different configurations per environment
- Team development (use `.env.example` as template)

### 3. Runtime Overrides (CLI)

Pass directly when running the application:

```bash
API_KEY=sk-ant-xxx npm start
```

**Use when:**

- One-off testing
- Overriding defaults temporarily

````

### 2.3 Common Gotchas to Document

**Template:**

```markdown
## Common Gotchas

### Quotes in .env Files

❌ **Don't use quotes unless needed:**
```bash
API_URL="https://api.example.com"  # Includes quotes in value
````

✅ **Use quotes only for values with spaces or special characters:**

```bash
API_URL=https://api.example.com
MESSAGE="Hello World"  # Quotes needed here
```

### Multiline Values

For multiline values (like private keys), use:

```bash
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
line1
line2
-----END RSA PRIVATE KEY-----"
```

Or use `\n` escapes:

```bash
PRIVATE_KEY="line1\nline2\nline3"
```

### Empty Values

To explicitly set an empty value:

```bash
OPTIONAL_VALUE=""
```

### Variable Expansion

dotenv does NOT expand variables by default:

❌ **This won't work:**

```bash
BASE_URL=https://api.example.com
FULL_URL=${BASE_URL}/v1  # Literal string, not expanded
```

✅ **Use dotenv-expand for expansion:**

```bash
BASE_URL=https://api.example.com
FULL_URL=${BASE_URL}/v1  # Expands to https://api.example.com/v1
```

### Case Sensitivity

Environment variables are case-sensitive:

```bash
api_key=xxx     # process.env.api_key
API_KEY=yyy     # process.env.API_KEY (different!)
```

### Leading/Tailing Whitespace

dotenv trims whitespace:

```bash
NAME=  John  Doe  # Becomes "John  Doe"
```

To preserve leading/trailing spaces, use quotes:

```bash
NAME="  John Doe  "  # Preserves spaces
```

### .gitignore Not Working

If your `.env` file keeps being committed, check:

1. `.gitignore` is in the repository root
2. The file isn't already tracked (run `git rm --cached .env`)
3. No trailing spaces in `.gitignore`
4. File is named `.env` (not `.env.txt`)

### Windows Line Endings

On Windows, `.env` files may use CRLF (`\r\n`) which can cause issues.

**Solution:** Configure Git to use LF:

```bash
git config core.autocrlf input
```

````

---

## 3. Security Documentation Patterns

### 3.1 API Key Security Warnings

**Warning Template:**

```markdown
## ⚠️ Security Warning

### NEVER Commit API Keys to Version Control

❌ **Don't do this:**
```bash
git add .env
git commit -m "Add API keys"
````

✅ **Do this instead:**

```bash
# Add .env to .gitignore
echo ".env" >> .gitignore

# Commit .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

### Why This Matters

Committed API keys are:

- **Permanent:** Even if you remove them later, they exist in git history
- **Public:** Anyone with repository access can find them
- **Dangerous:** Keys can be used to make unauthorized API calls
- **Expensive:** You may be charged for others' usage

### What If I Already Committed Keys?

1. **Immediately revoke** the compromised keys
2. **Rotate to new keys**
3. **Remove from git history** (advanced):

```bash
# Use git filter-repo or BFG Repo-Cleaner
# WARNING: This rewrites history - coordinate with team first!

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

4. **Force push** (if absolutely necessary)
5. **Rotate all exposed keys**

### Best Practices

✅ **DO:**

- Use `.env.example` as a template
- Document required variables
- Use secrets management in production (Vault, AWS Secrets Manager)
- Rotate keys regularly
- Use different keys for dev/staging/prod

❌ **DON'T:**

- Commit `.env` files
- Share keys via email/chat
- Use the same key across projects
- Debug logs that print keys

````

### 3.2 .gitignore Patterns

**Template:**

```gitignore
# =============================================================================
# ENVIRONMENT FILES
# =============================================================================

# All .env files should be ignored
.env
.env.local
.env.*.local
.envrc

# Allow .env.example (template)
!.env.example

# Environment-specific files
.env.development
.env.test
.env.production

# But allow examples
!.env*.example
!.env.example.*

# Direnv
.envrc

# Python
venv/
.venv/

# =============================================================================
# SECURITY CRITICAL: Never commit actual credentials
# =============================================================================
````

**Explanation to Include:**

````markdown
## .gitignore Patterns for Environment Files

### Standard Pattern

```gitignore
# Environment files
.env
.env.local
.env.*.local
```
````

This ignores:

- `.env` - Main environment file
- `.env.local` - Local overrides (highest priority)
- `.env.development.local` - Local dev overrides
- `.env.production.local` - Local prod overrides

### Exception Pattern

```gitignore
.env
!.env.example
```

The `!` negates the ignore for `.env.example`, allowing it to be committed.

### Why Multiple Files?

- **`.env`**: Base configuration (committed if no secrets)
- **`.env.local`**: Local overrides (never committed)
- **`.env.development`**: Dev environment (may be committed)
- **`.env.development.local`**: Local dev overrides (never committed)

### Verification

Check if a file is ignored:

```bash
git check-ignore -v .env
# Output: .env  .gitignore:2:/.env
```

````

### 3.3 .env.example Best Practices

**Template:**

```bash
# =============================================================================
# APPLICATION CONFIGURATION TEMPLATE
# =============================================================================
#
# Copy this file to .env and fill in your actual values:
#
#   cp .env.example .env
#
# IMPORTANT:
#   - Never commit .env to version control
#   - Keep .env file secure and private
#   - Use strong, unique values for secrets
#   - Rotate keys regularly
#
# =============================================================================

# -----------------------------------------------------------------------------
# API AUTHENTICATION
# -----------------------------------------------------------------------------

# Your API authentication token
# Get your token from: https://platform.example.com/settings/tokens
# Required: Yes
# Format: Bearer token (sk-ant-...)
# Example: sk-ant-api03-...
ANTHROPIC_AUTH_TOKEN=your-api-token-here

# Alternative: Direct API key (AUTH_TOKEN takes precedence)
# Get your key from: https://console.anthropic.com/settings/keys
# Required: Yes (if AUTH_TOKEN not set)
# Format: API key (sk-ant-...)
# ANTHROPIC_API_KEY=your-api-key-here

# -----------------------------------------------------------------------------
# API ENDPOINT CONFIGURATION
# -----------------------------------------------------------------------------

# Base URL for API requests
# Required: No (uses default if not set)
# Default: https://api.anthropic.com
# WARNING: Some endpoints may be blocked by safeguards
# ANTHROPIC_BASE_URL=https://api.anthropic.com

# -----------------------------------------------------------------------------
# MODEL CONFIGURATION
# -----------------------------------------------------------------------------

# Default model for Architect agent (highest quality, complex reasoning)
# Required: No
# Default: claude-3-opus-20240229
# Options: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
# ANTHROPIC_DEFAULT_OPUS_MODEL=claude-3-opus-20240229

# Default model for Researcher/Coder agents (balanced, default)
# Required: No
# Default: claude-3-sonnet-20240229
# Options: claude-3-sonnet-20240229, claude-3-haiku-20240307
# ANTHROPIC_DEFAULT_SONNET_MODEL=claude-3-sonnet-20240229

# Default model for simple operations (fastest, lowest cost)
# Required: No
# Default: claude-3-haiku-20240307
# Options: claude-3-haiku-20240307
# ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-3-haiku-20240307

# -----------------------------------------------------------------------------
# PERFORMANCE CONFIGURATION
# -----------------------------------------------------------------------------

# Request timeout in milliseconds
# Required: No
# Default: 60000 (60 seconds)
# Min: 1000 (1 second)
# Max: 600000 (10 minutes)
# API_TIMEOUT_MS=60000

# Maximum number of concurrent requests
# Required: No
# Default: 5
# Min: 1
# Max: 20
# MAX_CONCURRENT_REQUESTS=5

# -----------------------------------------------------------------------------
# LOGGING CONFIGURATION
# -----------------------------------------------------------------------------

# Log level for application logs
# Required: No
# Default: info
# Options: trace, debug, info, warn, error, silent
# LOG_LEVEL=info

# Enable verbose debugging output
# Required: No
# Default: false
# DEBUG=false

# -----------------------------------------------------------------------------
# DEVELOPMENT SETTINGS
# -----------------------------------------------------------------------------

# Node environment
# Required: No
# Default: development
# Options: development, production, test
# NODE_ENV=development

# Port for development server
# Required: No
# Default: 3000
# PORT=3000

# Enable hot module replacement
# Required: No
# Default: true (development), false (production)
# HMR=true

# -----------------------------------------------------------------------------
# SECURITY SETTINGS
# -----------------------------------------------------------------------------

# Enable additional security checks
# Required: No
# Default: true
# ENABLE_SECURITY_CHECKS=true

# Allowed origins for CORS (comma-separated)
# Required: No (allows all if not set)
# Example: https://example.com,https://app.example.com
# ALLOWED_ORIGINS=

# -----------------------------------------------------------------------------
# FEATURE FLAGS
# -----------------------------------------------------------------------------

# Enable experimental features
# Required: No
# Default: false
# ENABLE_EXPERIMENTAL=false

# Enable beta features
# Required: No
# Default: false
# ENABLE_BETA=false
````

**Best Practices for .env.example:**

1. **Comprehensive comments** - Every variable explained
2. **Required/Optional status** - Clearly labeled
3. **Default values** - Documented
4. **Validation constraints** - Min/max values, formats
5. **Options lists** - Enumerated choices
6. **Links to documentation** - Where to get values
7. **Security warnings** - When relevant
8. **Grouping** - Logical sections with headers
9. **Examples** - Commented-out examples
10. **Copy instructions** - At the top of file

---

## 4. Model Selection Configuration Patterns

### 4.1 AI/ML Projects Model Selection

**Pattern from Modern AI Projects:**

````markdown
## Model Selection

This application supports multiple AI models with different capabilities and costs.

### Available Models

| Model ID                   | Tier   | Use Case                    | Cost | Speed  |
| -------------------------- | ------ | --------------------------- | ---- | ------ |
| `claude-3-opus-20240229`   | Opus   | Complex reasoning, analysis | $$$$ | Slow   |
| `claude-3-sonnet-20240229` | Sonnet | Balanced performance        | $$$  | Medium |
| `claude-3-haiku-20240307`  | Haiku  | Fast, simple tasks          | $    | Fast   |

### Agent-Specific Models

Different agents use different models by default:

**Architect Agent** (high-quality planning):

```bash
# Environment variable
ARCHITECT_MODEL=claude-3-opus-20240229

# Default: claude-3-opus-20240229
```
````

**Researcher Agent** (balanced research):

```bash
RESEARCHER_MODEL=claude-3-sonnet-20240229
# Default: claude-3-sonnet-20240229
```

**Coder Agent** (code generation):

```bash
CODER_MODEL=claude-3-sonnet-20240229
# Default: claude-3-sonnet-20240229
```

### Override Patterns

**Override specific agent:**

```bash
ARCHITECT_MODEL=claude-3-haiku-20240307  # Downgrade for speed
```

**Override all agents:**

```bash
DEFAULT_MODEL=claude-3-sonnet-20240229  # All agents use this
```

**Override for single command:**

```bash
MODEL=claude-3-opus-20240229 npm run agent
```

### Validation

Models are validated on startup:

```typescript
const VALID_MODELS = [
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
] as const;

function validateModel(model: string): void {
  if (!VALID_MODELS.includes(model as any)) {
    throw new Error(
      `Invalid model: ${model}. Must be one of: ${VALID_MODELS.join(', ')}`
    );
  }
}
```

### Fallback Chain

If a model is not available, the system falls back:

```
Specified Model → Default Model for Tier → Base Default
```

Example:

```bash
# If ARCHITECT_MODEL is invalid or unavailable:
ARCHITECT_MODEL → DEFAULT_MODEL → claude-3-opus-20240229
```

````

---

### 4.2 Environment Variable Override Patterns

**Pattern 1: Hierarchical Overrides**

```bash
# Level 1: Global default
DEFAULT_MODEL=claude-3-sonnet-20240229

# Level 2: Tier defaults
MODEL_OPUS=claude-3-opus-20240229
MODEL_SONNET=claude-3-sonnet-20240229
MODEL_HAIKU=claude-3-haiku-20240307

# Level 3: Agent-specific
ARCHITECT_MODEL=claude-3-opus-20240229
RESEARCHER_MODEL=claude-3-sonnet-20240229

# Level 4: Runtime override
MODEL=claude-3-haiku-20240307 npm run task  # Wins
````

**Pattern 2: Unified Prefix**

```bash
# All model config uses same prefix
MODEL_ARCHITECT=claude-3-opus-20240229
MODEL_RESEARCHER=claude-3-sonnet-20240229
MODEL_CODER=claude-3-sonnet-20240229
MODEL_TESTER=claude-3-haiku-20240307
```

**Pattern 3: Alias Support**

```bash
# Support both short and long names
MODEL_OPUS=claude-3-opus-20240229
# or
MODEL_HIGH_QUALITY=claude-3-opus-20240229

# Aliases in code:
const MODEL_ALIASES = {
  'opus': 'claude-3-opus-20240229',
  'sonnet': 'claude-3-sonnet-20240229',
  'haiku': 'claude-3-haiku-20240307',
  'high-quality': 'claude-3-opus-20240229',
  'balanced': 'claude-3-sonnet-20240229',
  'fast': 'claude-3-haiku-20240307',
};
```

---

### 4.3 Default Value Documentation

**Template:**

````markdown
## Default Values

### How Defaults Work

1. **Code defaults** - Built into application
2. **.env defaults** - Set in .env.example
3. **User overrides** - Set in user's .env
4. **Runtime overrides** - Passed via CLI

### Default Value Hierarchy

```typescript
// 1. Code default (lowest priority)
const DEFAULT_CONFIG = {
  model: 'claude-3-sonnet-20240229',
  timeout: 60000,
};

// 2. .env file (medium priority)
// MODEL=claude-3-opus-20240229
// TIMEOUT=120000

// 3. Runtime override (highest priority)
// MODEL=claude-3-haiku-20240307 npm start

// Final value: MODEL=claude-3-haiku-20240307
```
````

### Documenting Defaults

**Option 1: In .env.example**

```bash
# Model to use for API requests
# Default: claude-3-sonnet-20240229
# MODEL=claude-3-sonnet-20240229
```

**Option 2: In table**

| Variable      | Default                    | Description          |
| ------------- | -------------------------- | -------------------- |
| `MODEL`       | `claude-3-sonnet-20240229` | Default model        |
| `TIMEOUT`     | `60000`                    | Request timeout (ms) |
| `MAX_RETRIES` | `3`                        | Max retry attempts   |

**Option 3: In code with Zod**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  MODEL: z.string().default('claude-3-sonnet-20240229'),
  TIMEOUT: z.coerce.number().default(60000),
  MAX_RETRIES: z.coerce.number().default(3),
});

// Parse and provide defaults automatically
const env = envSchema.parse(process.env);
```

### Default Value Gotchas

**Gotcha 1: Empty strings vs unset**

```bash
# In .env:
MODEL=

# In code:
process.env.MODEL  // "" (empty string, not undefined)
```

**Solution:**

```typescript
const model = process.env.MODEL || DEFAULT_MODEL; // Fallback for empty
```

**Gotcha 2: Number parsing**

```bash
# In .env:
TIMEOUT=60000

# In code:
process.env.TIMEOUT  // "60000" (string!)
Number(process.env.TIMEOUT)  // 60000 (number)
```

**Solution with Zod:**

```typescript
const schema = z.object({
  TIMEOUT: z.coerce.number().default(60000), // Auto-converts
});
```

**Gotcha 3: Boolean parsing**

```bash
# In .env:
DEBUG=true

# In code:
process.env.DEBUG  // "true" (string!)
process.env.DEBUG === 'true'  // true (correct)
```

**Solution:**

```typescript
const schema = z.object({
  DEBUG: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .default('false'),
});
```

````

---

## 5. Documentation Templates

### 5.1 Complete README Section Template

```markdown
## Configuration

### Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
````

2. Edit `.env` with your configuration:

   ```bash
   # Required: API authentication
   API_KEY=your-api-key-here

   # Optional: Model selection
   MODEL=claude-3-sonnet-20240229
   ```

3. Start the application:
   ```bash
   npm start
   ```

### Environment Variables

#### Required Variables

| Variable  | Description                 | Example      |
| --------- | --------------------------- | ------------ |
| `API_KEY` | Your API authentication key | `sk-ant-...` |

#### Optional Variables

| Variable     | Default                    | Description          |
| ------------ | -------------------------- | -------------------- |
| `MODEL`      | `claude-3-sonnet-20240229` | Default model        |
| `TIMEOUT_MS` | `60000`                    | Request timeout (ms) |
| `DEBUG`      | `false`                    | Enable debug logging |

### Configuration Files

The application loads configuration from multiple sources (highest priority last):

1. **Built-in defaults** - Code defaults
2. **`.env`** - Environment file (git-ignored)
3. **Shell environment** - Exported variables
4. **Command-line flags** - Runtime overrides

### Security

⚠️ **NEVER commit `.env` to version control**

- `.env` is in `.gitignore`
- Use `.env.example` as a template
- Rotate keys if accidentally exposed

See [SECURITY.md](SECURITY.md) for details.

````

---

### 5.2 CONTRIBUTING.md Section Template

```markdown
## Configuration for Development

### Setting Up Your Environment

1. **Copy the example file:**
   ```bash
   cp .env.example .env
````

2. **Add your credentials:**

   ```bash
   # Get your API key from: https://platform.example.com
   API_KEY=sk-ant-your-key-here
   ```

3. **Verify configuration:**
   ```bash
   npm run validate:config  # Checks .env is valid
   ```

### Testing Environment Variables

Test without committing credentials:

```bash
# One-off test
API_KEY=test-key npm test

# Or use test env file
cp .env.test .env
npm test
```

### Multiple Environments

The application supports multiple environments:

```bash
# Development
npm run dev           # Uses .env.development

# Testing
npm test              # Uses .env.test

# Production
npm run build         # Uses .env.production
```

### Debugging Configuration

To see what values are being used:

```bash
DEBUG=* npm start     # Verbose logging
DEBUG=config:* npm start  # Config-specific logging
```

### Common Issues

**"Missing required variable" error:**

- Ensure `.env` file exists
- Check variable names match exactly
- Restart your shell after editing `.env`

**"Invalid API key" error:**

- Verify key is correct (no extra spaces)
- Check key hasn't expired
- Ensure you're using the right environment key

**Configuration not updating:**

- Restart the application after editing `.env`
- Clear any caches: `npm run clean`
- Check for shell environment overrides: `env | grep API`

````

---

### 5.3 API Documentation Section Template

```markdown
## Configuration API

### Loading Configuration

```typescript
import { loadConfig } from './config';

// Load from .env file
const config = await loadConfig();

// Load with custom path
const config = await loadConfig({ path: '.env.production' });

// Load with overrides
const config = await loadConfig({
  overrides: {
    MODEL: 'claude-3-opus-20240229',
  },
});
````

### Configuration Schema

```typescript
interface Config {
  // API Configuration
  readonly apiKey: string;
  readonly baseUrl: string;

  // Model Configuration
  readonly model: ModelId;
  readonly architectModel: ModelId;
  readonly researcherModel: ModelId;

  // Performance
  readonly timeout: number;
  readonly maxRetries: number;
  readonly maxConcurrent: number;

  // Features
  readonly debug: boolean;
  readonly experimental: boolean;
}
```

### Environment Variable Reference

#### Authentication

**`API_KEY`** (string, required)

- Your API authentication key
- Format: `sk-ant-...`
- Get from: https://platform.example.com/keys
- Example: `sk-ant-api03-...`

**`BASE_URL`** (string, optional)

- API base URL
- Default: `https://api.anthropic.com`
- Example: `https://api.example.com`

#### Model Selection

**`MODEL`** (string, optional)

- Default model for all agents
- Default: `claude-3-sonnet-20240229`
- Options: See [Models](#models)

**`ARCHITECT_MODEL`** (string, optional)

- Model for Architect agent
- Default: `claude-3-opus-20240229`
- Options: See [Models](#models)

**`RESEARCHER_MODEL`** (string, optional)

- Model for Researcher agent
- Default: `claude-3-sonnet-20240229`
- Options: See [Models](#models)

#### Performance

**`TIMEOUT_MS`** (number, optional)

- Request timeout in milliseconds
- Default: `60000` (60 seconds)
- Min: `1000` (1 second)
- Max: `600000` (10 minutes)

**`MAX_RETRIES`** (number, optional)

- Maximum retry attempts for failed requests
- Default: `3`
- Min: `0`
- Max: `10`

**`MAX_CONCURRENT`** (number, optional)

- Maximum concurrent requests
- Default: `5`
- Min: `1`
- Max: `20`

#### Features

**`DEBUG`** (boolean, optional)

- Enable debug logging
- Default: `false`
- Values: `true`, `false`, `1`, `0`

**`EXPERIMENTAL`** (boolean, optional)

- Enable experimental features
- Default: `false`
- Values: `true`, `false`, `1`, `0`

### Validation

Configuration is validated on startup. Invalid values will cause the application to fail with an error message.

**Example error:**

```
Error: Invalid configuration
  - TIMEOUT_MS must be between 1000 and 600000 (got: 100)
  - MODEL must be one of: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307 (got: invalid-model)
```

### Examples

**Basic usage:**

```bash
# .env
API_KEY=sk-ant-api03-...
MODEL=claude-3-sonnet-20240229
```

**With all options:**

```bash
# .env
API_KEY=sk-ant-api03-...
BASE_URL=https://api.example.com
MODEL=claude-3-sonnet-20240229
TIMEOUT_MS=120000
MAX_RETRIES=5
MAX_CONCURRENT=10
DEBUG=true
EXPERIMENTAL=true
```

**Agent-specific models:**

```bash
# .env
API_KEY=sk-ant-api03-...
ARCHITECT_MODEL=claude-3-opus-20240229    # Best quality
RESEARCHER_MODEL=claude-3-sonnet-20240229  # Balanced
CODER_MODEL=claude-3-haiku-20240307        # Fast
TESTER_MODEL=claude-3-haiku-20240307       # Fast
```

````

---

### 5.4 Security Documentation Template

```markdown
# Security Guide

## Environment Variables

### ⚠️ Critical Security Rules

1. **NEVER commit `.env` files**
   - `.env` is in `.gitignore`
   - Use `.env.example` as a template
   - Never include real credentials in examples

2. **Rotate compromised keys immediately**
   - If you accidentally commit a key, revoke it
   - Generate a new key
   - Remove from git history (see below)

3. **Use environment-specific keys**
   - Development: Separate dev key
   - Staging: Separate staging key
   - Production: Separate production key

4. **Limit key permissions**
   - Only grant necessary scopes
   - Set usage limits where possible
   - Monitor usage regularly

### What To Do If You Commit a Key

1. **Revoke the key immediately**
````

Go to: https://platform.example.com/keys
Click: Revoke next to the compromised key

```

2. **Generate a new key**
```

Create a new key with the same permissions
Add it to your .env file

````

3. **Remove from git history**
```bash
# Option 1: git filter-repo (recommended)
pip install git-filter-repo
git filter-repo --invert-paths --path .env

# Option 2: BFG Repo-Cleaner
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
````

4. **Force push** (coordinate with team first!)

   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

5. **Notify your team**
   - Everyone must rotate their local keys
   - Update all deployed applications
   - Check API logs for unauthorized usage

### Production Deployment

**Never use .env files in production.** Instead:

**Option 1: Secrets Management Service**

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name myapp/api-key \
  --secret-string "sk-ant-..."

# HashiCorp Vault
vault kv put secret/myapp api-key=sk-ant-...
```

**Option 2: Container Orchestration**

```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: api-keys
data:
  API_KEY: c2stYW50Li4u # Base64 encoded
```

**Option 3: CI/CD Environment Variables**

```yaml
# GitHub Actions
env:
  API_KEY: ${{ secrets.API_KEY }}

# GitLab CI
variables:
  API_KEY: $API_KEY
```

### Auditing

**Regularly audit your configuration:**

```bash
# Check for committed .env files
git log --all --full-history -- "*.env"

# Check for secrets in history
git log --all --full-history -S "sk-ant-" --source --all

# Use truffleHog to scan
trufflehog --regex --entropy=False /path/to/repo
```

### Monitoring

**Monitor API key usage:**

- Set up usage alerts
- Check logs for unusual patterns
- Review access regularly
- Implement rate limiting

### Best Practices Checklist

- [ ] `.env` in `.gitignore`
- [ ] `.env.example` committed (without secrets)
- [ ] Separate keys for dev/staging/prod
- [ ] Keys have expiration dates
- [ ] Keys have usage limits
- [ ] Regular key rotation schedule
- [ ] Monitoring and alerting configured
- [ ] Team trained on security practices
- [ ] Incident response plan documented
- [ ] Secrets audit scheduled quarterly

```

---

## Summary of Key Patterns

### Documentation Structure

1. **Quick Start** - Get users running in < 5 minutes
2. **Complete Reference** - All variables documented
3. **Examples** - Real-world configurations
4. **Gotchas** - Common pitfalls to avoid
5. **Security** - Critical warnings upfront
6. **Troubleshooting** - Help when things go wrong

### File Organization

```

project/
├── .env # Actual config (git-ignored)
├── .env.example # Template (committed)
├── .env.development # Dev config (optional)
├── .env.test # Test config (optional)
├── .env.production # Prod config (optional)
├── .gitignore # Includes .env
├── README.md # Quick start
├── docs/
│ ├── configuration.md # Detailed config docs
│ └── security.md # Security guide
└── src/
└── config.ts # Config loading & validation

````

### Code Patterns

**TypeScript + Zod:**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Required
  API_KEY: z.string().min(1),

  // Optional with defaults
  MODEL: z.string().default('claude-3-sonnet-20240229'),
  TIMEOUT_MS: z.coerce.number().default(60000),
  DEBUG: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('false'),

  // Enums
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),
});

export const env = envSchema.parse(process.env);
````

**Validation:**

```typescript
// Validate on startup
try {
  const env = envSchema.parse(process.env);
} catch (error) {
  console.error('Invalid configuration:');
  console.error(error.errors);
  process.exit(1);
}
```

### Documentation Anti-Patterns to Avoid

❌ **Don't:**

- Bury important info in long paragraphs
- Use vague examples like "YOUR_KEY_HERE"
- Assume users know about .gitignore
- Hide security warnings at the bottom
- Use inconsistent variable naming
- Forget to document default values
- Mix multiple concepts in one section
- Use screenshots (they become outdated)

✅ **Do:**

- Use tables for quick reference
- Provide real, working examples
- Include copy-paste ready templates
- Put security warnings first
- Use consistent naming conventions
- Document all defaults clearly
- Separate concerns into sections
- Use code examples (never screenshots)

````

---

## URLs and References

### Official Documentation

- **dotenv**: https://github.com/motdotla/dotenv
- **NestJS Config**: https://docs.nestjs.com/techniques/configuration
- **Vite Env vars**: https://vitejs.dev/guide/env-and-mode.html
- **Commander.js**: https://github.com/tj/commander.js/blob/master/Readme.md
- **Zod Validation**: https://zod.dev/

### Related Resources

- **The Twelve-Factor App - Config**: https://12factor.net/config
- **OWASP Environment Variables**: https://cheatsheetseries.owasp.org/cheatsheets/Environment_Variables_Cheat_Sheet.html
- **dotenv-expand**: https://github.com/motdotla/dotenv-expand

### Security Tools

- **truffleHog**: https://github.com/trufflesecurity/trufflehog
- **git-secrets**: https://github.com/awslabs/git-secrets
- **BFG Repo-Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/

---

## Document Metadata

**Version:** 1.0.0
**Last Updated:** 2026-01-23
**Maintainer:** Development Team
**Status:** Active

---

## Appendix: Quick Reference

### Common Environment Variable Patterns

| Pattern | Example | Use Case |
|---------|---------|----------|
| Prefix grouping | `API_*` | Group related vars |
| Tier naming | `*_OPUS`, `*_SONNET` | Model tiers |
| Environment suffix | `DB_HOST_DEV` | Environment-specific |
| Feature flags | `FEATURE_*` | Enable/disable features |
| Debug vars | `DEBUG_*` | Debugging controls |

### Variable Naming Conventions

**SCREAMING_SNAKE_CASE:**
```bash
API_KEY=xxx
DATABASE_URL=xxx
MAX_CONNECTIONS=xxx
````

**Prefix conventions:**

```bash
# Application namespace
MYAPP_API_KEY=xxx
MYAPP_DATABASE_URL=xxx

# Component namespace
AUTH_SECRET_KEY=xxx
AUTH_TOKEN_EXPIRY=xxx

# Feature namespace
FEATURE_EXPERIMENTAL=xxx
FEATURE_BETA=xxx
```

### Validation Patterns

**Required:**

```typescript
API_KEY: z.string().min(1);
```

**Optional with default:**

```typescript
TIMEOUT: z.coerce.number().default(60000);
```

**Enum:**

```typescript
LEVEL: z.enum(['debug', 'info', 'warn', 'error']);
```

**URL:**

```typescript
BASE_URL: z.string().url();
```

**Email:**

```typescript
ADMIN_EMAIL: z.string().email();
```

**Boolean:**

```typescript
DEBUG: z.enum(['true', 'false']).transform(v => v === 'true');
```

---

_End of Research Document_
