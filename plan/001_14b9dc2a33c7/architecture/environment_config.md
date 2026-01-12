# Environment Configuration Guide

## Shell Environment

**Configuration File:** `~/.config/zsh/functions.zsh`
**Relevant Function:** `_glm_config()` (lines 202-210)

## Environment Variables

### Authentication

| Variable Name          | Value                      | Purpose                                  |
| ---------------------- | -------------------------- | ---------------------------------------- |
| `ANTHROPIC_AUTH_TOKEN` | _[Token exists]_           | Authentication token (shell environment) |
| `ANTHROPIC_API_KEY`    | _[Mapped from AUTH_TOKEN]_ | Expected by Anthropic SDK                |

**CRITICAL:** The shell uses `ANTHROPIC_AUTH_TOKEN`, but the Anthropic SDK expects `ANTHROPIC_API_KEY`. The application must map between these.

### API Configuration

| Variable Name        | Value                            | Purpose                      |
| -------------------- | -------------------------------- | ---------------------------- |
| `ANTHROPIC_BASE_URL` | `https://api.z.ai/api/anthropic` | z.ai API endpoint            |
| `API_TIMEOUT_MS`     | `3000000`                        | Request timeout (50 minutes) |

### Model Selection

| Variable Name                    | Value         | Purpose                  |
| -------------------------------- | ------------- | ------------------------ |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | `GLM-4.7`     | Highest quality model    |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | `GLM-4.7`     | Balanced model (default) |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | `GLM-4.5-Air` | Fast/lightweight model   |

### Shell Functions

| Function   | Purpose                                    |
| ---------- | ------------------------------------------ |
| `gle()`    | Exports GLM configuration to current shell |
| `glaude()` | Runs claude with GLM environment variables |

## Runtime Requirements

### Node.js

- **Minimum Version:** 20+
- **Current Status:** Not yet verified in project
- **Action Required:** Verify installation with `node --version`

### TypeScript

- **Minimum Version:** 5.2+
- **Current Status:** Not yet verified in project
- **Action Required:** Verify installation with `tsc --version`

### Dependencies

- **Groundswell:** Local library at `~/projects/groundswell`
- **Installation Method:** `npm link ~/projects/groundswell`

## Configuration Implementation

### Environment Variable Mapping

```typescript
// config/environment.ts
export function configureEnvironment(): void {
  // Map from shell environment to SDK expectations
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set defaults if not provided
  process.env.ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic';
}

export function getModel tier(): string {
  return {
    opus: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || 'GLM-4.7',
    sonnet: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'GLM-4.7',
    haiku: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'GLM-4.5-Air',
  };
}
```

### Groundswell Agent Configuration

```typescript
import { createAgent } from 'groundswell';

// Configure environment before creating agents
configureEnvironment();

const architectAgent = createAgent({
  name: 'ArchitectAgent',
  system: ARCHITECT_SYSTEM_PROMPT,
  model: getModel().sonnet, // Uses GLM-4.7
  enableCache: true,
  enableReflection: true,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
});
```

## z.ai API Compatibility

### Expected Behavior

- **Endpoint:** `https://api.z.ai/api/anthropic`
- **Path Structure:** `/api/anthropic` suggests Anthropic API compatibility
- **Authentication:** Bearer token via `ANTHROPIC_AUTH_TOKEN`

### Compatibility Validation Required

**Action Item:** Verify z.ai API compatibility with Anthropic API v1 specification

```bash
# Test endpoint availability
curl -I https://api.z.ai/api/anthropic

# Test authentication
curl -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"model":"GLM-4.7","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
     https://api.z.ai/api/anthropic/v1/messages
```

### Known Models

| Model Name    | Tier        | Use Case                                 |
| ------------- | ----------- | ---------------------------------------- |
| `GLM-4.7`     | Sonnet/Opus | Complex reasoning, Architect, Researcher |
| `GLM-4.5-Air` | Haiku       | Fast tasks, simple operations            |

## Development Workflow

### 1. Environment Setup

```bash
# Ensure shell configuration is loaded
source ~/.config/zsh/functions.zsh

# Export GLM configuration
gle

# Verify environment variables
echo $ANTHROPIC_AUTH_TOKEN
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_DEFAULT_SONNET_MODEL
```

### 2. Project Initialization

```bash
# Initialize Node.js project
npm init -y

# Install dependencies
npm install --save-dev typescript@^5.2.0 @types/node
npm install zod  # For schema validation

# Link Groundswell
npm link ~/projects/groundswell
```

### 3. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Application Entry Point

```typescript
// src/index.ts
import { configureEnvironment, PRPPipeline } from './pipeline';

async function main() {
  // Configure environment from shell
  configureEnvironment();

  // Create and run pipeline
  const pipeline = new PRPPipeline('./PRD.md');
  await pipeline.run();
}

main().catch(console.error);
```

## Validation Checklist

### Pre-Implementation Validation

- [ ] Verify Node.js 20+ is installed (`node --version`)
- [ ] Verify TypeScript 5.2+ is installed (`tsc --version`)
- [ ] Test z.ai API endpoint availability
- [ ] Test z.ai API authentication
- [ ] Verify Groundswell library is accessible (`ls ~/projects/groundswell`)
- [ ] Verify shell configuration contains `_glm_config()` function

### Runtime Validation

- [ ] Confirm `ANTHROPIC_AUTH_TOKEN` is mapped to `ANTHROPIC_API_KEY`
- [ ] Confirm `ANTHROPIC_BASE_URL` is set correctly
- [ ] Confirm model names resolve correctly (GLM-4.7, GLM-4.5-Air)
- [ ] Test agent creation with configured environment
- [ ] Test simple prompt execution with z.ai API

### Post-Implementation Validation

- [ ] Verify session directories are created correctly
- [ ] Verify `tasks.json` is written atomically
- [ ] Verify git commits are created successfully
- [ ] Verify graceful shutdown on SIGINT
- [ ] Verify environment variables are not exposed in logs

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not found"

**Solution:** Ensure environment mapping is called before creating agents:

```typescript
configureEnvironment(); // Must be called first
```

### Issue: "z.ai API timeout"

**Solution:** The configured timeout is 50 minutes (3000000ms). If requests timeout earlier, check:

- Network connectivity to `https://api.z.ai`
- Firewall/proxy settings
- API token validity

### Issue: "Model not found: GLM-4.7"

**Solution:** Verify z.ai supports the model names defined in shell configuration. Check z.ai documentation for available models.

### Issue: "Groundswell module not found"

**Solution:** Ensure the library is linked:

```bash
cd ~/projects/groundswell
npm link
cd ~/projects/hacky-hack
npm link groundswell
```

## Security Considerations

### Token Exposure

- **CRITICAL:** Never log or expose `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY`
- Use `@ObservedState({ redact: true })` for any stored credentials
- Ensure `tasks.json` does not contain sensitive data

### Environment Variable Handling

```typescript
// GOOD - Redacted in state snapshots
@ObservedState({ redact: true })
apiKey: string = process.env.ANTHROPIC_API_KEY;

// BAD - Exposed in logs and state
apiKey: string = process.env.ANTHROPIC_API_KEY;  // No redaction
```

### Git Ignore Patterns

```
# .gitignore
.env
.env.local
*.key
plan//**/tokens.json
```

## Next Actions

1. **Immediate:** Run validation checklist to confirm environment setup
2. **High Priority:** Test z.ai API compatibility with Anthropic SDK
3. **High Priority:** Implement environment mapping function
4. **Medium Priority:** Set up TypeScript project structure
5. **Medium Priority:** Link Groundswell library
