# z.ai API Quick Reference

**Quick reference guide for z.ai API usage with the PRP Pipeline project.**

---

## Configuration

### Environment Variables

```bash
# Required (set by shell: gle)
export ANTHROPIC_AUTH_TOKEN="your-api-key"

# Optional (set by application)
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export ANTHROPIC_API_KEY="$ANTHROPIC_AUTH_TOKEN"

# Model overrides (optional)
export ANTHROPIC_DEFAULT_OPUS_MODEL="GLM-4.7"
export ANTHROPIC_DEFAULT_SONNET_MODEL="GLM-4.7"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="GLM-4.5-Air"
```

### TypeScript Configuration

```typescript
import { configureEnvironment, getModel, validateEnvironment } from './config/environment.js';

// Step 1: Configure environment
configureEnvironment();

// Step 2: Validate
validateEnvironment();

// Step 3: Get model name
const model = getModel('sonnet'); // Returns 'GLM-4.7'
```

---

## API Endpoints

### Base URL
```
https://api.z.ai/api/anthropic
```

### Messages Endpoint
```
POST https://api.z.ai/api/anthropic/v1/messages
```

---

## Request Format

```bash
curl -X POST https://api.z.ai/api/anthropic/v1/messages \
  -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "GLM-4.7",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Your message here"
      }
    ]
  }'
```

### TypeScript Example

```typescript
const response = await fetch('https://api.z.ai/api/anthropic/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'GLM-4.7',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Your message here' }
    ]
  })
});

const data = await response.json();
```

---

## Available Models

| Model | Tier | Use Case |
|-------|------|----------|
| `GLM-4.7` | Opus/Sonnet | Complex reasoning, default |
| `GLM-4.5-Air` | Haiku | Fast tasks, simple operations |

---

## Groundswell Agent Creation

```typescript
import { createAgent } from 'groundswell';
import { configureEnvironment, getModel } from './config/environment.js';

// Configure environment
configureEnvironment();

// Create agent
const agent = createAgent({
  name: 'MyAgent',
  system: 'You are a helpful assistant.',
  model: getModel('sonnet'), // 'GLM-4.7'
  enableCache: true,
  enableReflection: true,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
});
```

---

## Validation

### Quick Test (Bash)
```bash
./scripts/validate-zai-api.sh
```

### Full Test (TypeScript)
```bash
npx tsx tests/validation/zai-api-test.ts
```

### Manual Test
```bash
# Test endpoint
curl -I https://api.z.ai/api/anthropic

# Test message API
curl -X POST https://api.z.ai/api/anthropic/v1/messages \
  -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"GLM-4.7","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

---

## Troubleshooting

### "ANTHROPIC_API_KEY not found"
**Solution:** Call `configureEnvironment()` before creating agents

### "Model not found: GLM-4.7"
**Solution:** Verify model name, check z.ai documentation for available models

### "API timeout"
**Solution:** Check network connectivity, verify API key, check firewall/proxy

### "Response format unexpected"
**Solution:** Log response and compare with Anthropic API documentation

---

## File Locations

| File | Purpose |
|------|---------|
| `src/config/constants.ts` | Base URL, model names, env var names |
| `src/config/environment.ts` | Environment mapping, model selection |
| `src/config/types.ts` | TypeScript interfaces |
| `docs/zai-api-research.md` | Detailed research documentation |
| `scripts/validate-zai-api.sh` | Bash validation script |
| `tests/validation/zai-api-test.ts` | TypeScript validation script |
| `tests/manual/env-test.ts` | Manual environment test |

---

## Differences from Anthropic API

| Aspect | Anthropic | z.ai |
|--------|-----------|------|
| Base URL | `https://api.anthropic.com` | `https://api.z.ai/api/anthropic` |
| Models | `claude-opus-4-*`, `claude-sonnet-4-*` | `GLM-4.7`, `GLM-4.5-Air` |
| Shell Env Var | `ANTHROPIC_API_KEY` | `ANTHROPIC_AUTH_TOKEN` (mapped to `API_KEY`) |

---

## Additional Resources

- **Full Research:** `docs/zai-api-research.md`
- **Environment Config:** `plan/001_14b9dc2a33c7/architecture/environment_config.md`
- **Groundswell API:** `plan/001_14b9dc2a33c7/architecture/groundswell_api.md`
- **Project PRD:** `PRD.md`

---

**Last Updated:** 2026-01-12
