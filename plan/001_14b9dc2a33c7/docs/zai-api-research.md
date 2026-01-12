# z.ai API Compatibility Research Report

## Executive Summary

This document consolidates all known information about z.ai API compatibility with Anthropic's API, gathered from existing codebase documentation and configuration files. **Note:** Web search was unavailable due to monthly quota limits, so this research is based on local codebase analysis and documented assumptions.

---

## 1. Base URL Structure

### Official Endpoint
```
https://api.z.ai/api/anthropic
```

**Source:** `/home/dustin/projects/hacky-hack/src/config/constants.ts` (line 22)

**Comparison:**
- **Anthropic Official:** `https://api.anthropic.com`
- **z.ai Proxy:** `https://api.z.ai/api/anthropic`

### Implementation Details

The base URL path structure suggests z.ai implements an Anthropic-compatible API proxy:

```typescript
// From src/config/constants.ts
export const DEFAULT_BASE_URL = 'https://api.z.ai/api/anthropic' as const;
```

**Key Observation:** The `/api/anthropic` path component indicates this is a compatibility layer that mimics Anthropic's API structure.

---

## 2. Authentication Methods

### Required Headers

z.ai expects the same authentication headers as the Anthropic SDK:

```typescript
// Standard Anthropic-compatible authentication
ANTHROPIC_API_KEY: "<your-api-key>"
```

### Environment Variable Mapping

**Critical Implementation Detail:** Your shell environment uses `ANTHROPIC_AUTH_TOKEN`, but the Anthropic SDK expects `ANTHROPIC_API_KEY`.

**Mapping Implementation:**
```typescript
// From src/config/environment.ts (lines 55-64)
export function configureEnvironment(): void {
  // Map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if API_KEY is not already set
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL if not already provided
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
  }
}
```

**Environment Variables:**
| Shell Variable | SDK Variable | Purpose |
|----------------|--------------|---------|
| `ANTHROPIC_AUTH_TOKEN` | `ANTHROPIC_API_KEY` | API authentication token |
| - | `ANTHROPIC_BASE_URL` | API endpoint URL |

---

## 3. Endpoint Paths

### Full Message Endpoint URL

```
https://api.z.ai/api/anthropic/v1/messages
```

**Constructed as:** `BASE_URL` + `/v1/messages`

### Documented Test Commands

From `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/environment_config.md` (lines 115-123):

```bash
# Test endpoint availability
curl -I https://api.z.ai/api/anthropic

# Test authentication
curl -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"model":"GLM-4.7","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
     https://api.z.ai/api/anthropic/v1/messages
```

**Expected Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- Potentially: `anthropic-version: 2023-06-01` (standard Anthropic header, not yet verified for z.ai)

---

## 4. Compatible Models

### Documented Models

| Model Name | Tier | Use Case | Source |
|------------|------|----------|--------|
| `GLM-4.7` | Sonnet/Opus | Complex reasoning, Architect, Researcher | constants.ts:45-47 |
| `GLM-4.5-Air` | Haiku | Fast tasks, simple operations | constants.ts:49 |

### Model Configuration

```typescript
// From src/config/constants.ts (lines 43-50)
export const MODEL_NAMES = {
  /** Highest quality model for complex reasoning tasks */
  opus: 'GLM-4.7',
  /** Balanced model, default for most agents */
  sonnet: 'GLM-4.7',
  /** Fast model for simple operations */
  haiku: 'GLM-4.5-Air',
} as const;
```

### Model Selection Override

Models can be overridden via environment variables:

```typescript
export const MODEL_ENV_VARS = {
  opus: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
  sonnet: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
  haiku: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
} as const;
```

**Usage:**
```typescript
export function getModel(tier: ModelTier): string {
  const envVar = MODEL_ENV_VARS[tier];
  return process.env[envVar] ?? MODEL_NAMES[tier];
}
```

---

## 5. Request/Response Format

### Expected Anthropic-Compatible Format

Based on standard Anthropic Messages API structure (assumed compatible):

#### Request Format
```json
{
  "model": "GLM-4.7",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Your message here"
    }
  ],
  "temperature": 0.7,
  "top_p": 0.9,
  "stream": false
}
```

#### Response Format (Expected)
```json
{
  "id": "msg-<id>",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Response text here"
    }
  ],
  "model": "GLM-4.7",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20
  }
}
```

**Status:** This format is assumed based on Anthropic API compatibility. Actual z.ai response format needs validation.

---

## 6. Known Gotchas and Differences

### 6.1 Environment Variable Naming
**Issue:** Shell uses `ANTHROPIC_AUTH_TOKEN`, SDK expects `ANTHROPIC_API_KEY`

**Solution:** Must map in application code before initializing agents:
```typescript
configureEnvironment(); // Must call first
```

### 6.2 Base URL Differences
**Issue:** z.ai uses a different base URL than official Anthropic API

**Comparison:**
- Anthropic: `https://api.anthropic.com`
- z.ai: `https://api.z.ai/api/anthropic`

**Impact:** Must explicitly set `ANTHROPIC_BASE_URL` environment variable or configure in code.

### 6.3 Model Name Differences
**Issue:** z.ai uses GLM model names, not Claude model names

**Comparison:**
- Anthropic: `claude-opus-4-20250514`, `claude-sonnet-4-20250514`
- z.ai: `GLM-4.7`, `GLM-4.5-Air`

**Impact:** Cannot use standard Anthropic model names. Must use z.ai specific model identifiers.

### 6.4 Unknown Headers
**Status Uncertain:** Whether z.ai requires the `anthropic-version` header

**Standard Anthropic:** `anthropic-version: 2023-06-01`
**z.ai:** Not documented - needs testing

### 6.5 Streaming Behavior
**Status Unknown:** Whether z.ai supports streaming responses (SSE) and the exact format

**Action Required:** Test streaming endpoint if needed for your application.

### 6.6 Timeout Configuration
Your environment configures a 50-minute timeout:
```bash
API_TIMEOUT_MS=3000000  # 50 minutes
```

**Consideration:** Verify z.ai supports long-running requests or implement retry logic.

---

## 7. Code Examples

### 7.1 Environment Configuration

```typescript
// Import configuration module
import { configureEnvironment, getModel, validateEnvironment } from './config/environment.js';

// Step 1: Configure environment (maps AUTH_TOKEN -> API_KEY)
configureEnvironment();

// Step 2: Validate all required variables are set
try {
  validateEnvironment();
  console.log('Environment configured successfully');
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error('Missing variables:', error.missing);
  }
}

// Step 3: Get model name for agent creation
const model = getModel('sonnet'); // Returns 'GLM-4.7'
```

### 7.2 Creating Groundswell Agent with z.ai

```typescript
import { createAgent } from 'groundswell';
import { configureEnvironment, getModel } from './config/environment.js';

// Configure environment first
configureEnvironment();

// Create agent with z.ai configuration
const architectAgent = createAgent({
  name: 'ArchitectAgent',
  system: ARCHITECT_SYSTEM_PROMPT,
  model: getModel('sonnet'),  // Uses GLM-4.7
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  temperature: 0.1,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
});
```

### 7.3 Direct HTTP Request (fetch)

```typescript
async function testZAiAPI() {
  const response = await fetch('https://api.z.ai/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      'Content-Type': 'application/json',
      // Optionally add:
      // 'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'GLM-4.7',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Hello, z.ai!'
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
```

### 7.4 Validation Script (Bash)

```bash
#!/bin/bash
# validate-zai-api.sh

echo "=== z.ai API Validation Script ==="
echo ""

# Load environment
source ~/.config/zsh/functions.zsh
gle  # Export GLM configuration

# Check environment variables
echo "1. Checking environment variables..."
if [ -z "$ANTHROPIC_AUTH_TOKEN" ]; then
    echo "❌ ANTHROPIC_AUTH_TOKEN not set"
    exit 1
else
    echo "✓ ANTHROPIC_AUTH_TOKEN is set"
fi

if [ -z "$ANTHROPIC_BASE_URL" ]; then
    echo "❌ ANTHROPIC_BASE_URL not set"
    exit 1
else
    echo "✓ ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
fi

echo ""

# Test endpoint availability
echo "2. Testing endpoint availability..."
curl -I -s "$ANTHROPIC_BASE_URL" | head -1
echo ""

# Test authentication and message API
echo "3. Testing /v1/messages endpoint..."
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "GLM-4.7",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }' \
  "$ANTHROPIC_BASE_URL/v1/messages")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check for errors
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ API returned an error"
    exit 1
else
    echo "✓ API request successful"
fi

echo ""
echo "=== Validation Complete ==="
```

---

## 8. Validation Checklist

### Pre-Flight Checks
- [ ] Node.js 20+ installed (`node --version`)
- [ ] TypeScript 5.2+ installed (`tsc --version`)
- [ ] Groundswell library linked (`npm link ~/projects/groundswell`)

### Environment Validation
- [ ] `ANTHROPIC_AUTH_TOKEN` is set in shell
- [ ] `ANTHROPIC_API_KEY` is mapped (via `configureEnvironment()`)
- [ ] `ANTHROPIC_BASE_URL` is set to `https://api.z.ai/api/anthropic`
- [ ] Model names resolve: `GLM-4.7`, `GLM-4.5-Air`

### API Validation
- [ ] Test endpoint availability: `curl -I https://api.z.ai/api/anthropic`
- [ ] Test authentication with curl command (above)
- [ ] Test message completion with GLM-4.7
- [ ] Test message completion with GLM-4.5-Air
- [ ] Verify response format matches Anthropic API
- [ ] Test streaming endpoint (if needed)
- [ ] Test error handling (invalid API key, invalid model)

### Integration Validation
- [ ] Test Groundswell agent creation with z.ai
- [ ] Test simple prompt execution
- [ ] Test complex multi-turn conversation
- [ ] Verify caching works with z.ai
- [ ] Verify reflection/error recovery works
- [ ] Test timeout behavior (50-minute configured timeout)

---

## 9. Critical Implementation Details

### 9.1 Required for All Agents

```typescript
// MUST be called before any agent creation
configureEnvironment();

// MUST validate before proceeding
validateEnvironment();
```

### 9.2 Model Selection Strategy

```typescript
// For complex reasoning tasks (Architect, Researcher)
const opusModel = getModel('opus');    // GLM-4.7

// For standard agent tasks (default)
const sonnetModel = getModel('sonnet'); // GLM-4.7

// For quick, simple tasks
const haikuModel = getModel('haiku');  // GLM-4.5-Air
```

### 9.3 Security Considerations

**CRITICAL:** Never log or expose API keys:

```typescript
// GOOD - Redacted in state snapshots
@ObservedState({ redact: true })
apiKey: string = process.env.ANTHROPIC_API_KEY;

// BAD - Exposed in logs and state
apiKey: string = process.env.ANTHROPIC_API_KEY;
```

### 9.4 Error Handling

```typescript
try {
  validateEnvironment();
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error('Missing required variables:', error.missing);
    // Handle missing configuration
  }
}
```

---

## 10. Unknowns Requiring Validation

The following aspects of z.ai API compatibility are **NOT YET VERIFIED** and require testing:

1. **anthropic-version Header**: Does z.ai require or ignore this header?
2. **Streaming Support**: Does z.ai support SSE streaming for responses?
3. **Exact Response Format**: Does z.ai return Anthropic-compatible JSON structure?
4. **Error Response Format**: Do errors match Anthropic's error structure?
5. **Rate Limits**: What are z.ai's rate limits compared to Anthropic?
6. **Token Counting**: Does z.ai use the same tokenization as Anthropic?
7. **Tool Use**: Does z.ai support Anthropic's tool/function calling API?
8. **Image Support**: Does z.ai support vision/image inputs?
9. **System Prompts**: Are there differences in system prompt handling?
10. **Timeout Behavior**: How does z.ai handle long-running requests?

---

## 11. Recommended Next Steps

1. **Immediate**: Run the validation script (Section 7.4) to verify basic connectivity
2. **High Priority**: Create a TypeScript validation script that tests all model endpoints
3. **High Priority**: Document actual response format from z.ai for comparison
4. **Medium Priority**: Test streaming endpoint if required by your application
5. **Medium Priority**: Create integration tests for error scenarios
6. **Low Priority**: Benchmark performance differences between z.ai and official Anthropic API

---

## 12. Troubleshooting Guide

### Issue: "ANTHROPIC_API_KEY not found"
**Solution:** Ensure `configureEnvironment()` is called before creating agents

### Issue: "Model not found: GLM-4.7"
**Solution:** Verify z.ai supports this model name, check documentation for current model list

### Issue: "z.ai API timeout"
**Solution:**
- Check network connectivity to `https://api.z.ai`
- Verify API token validity
- Consider reducing `API_TIMEOUT_MS` if requests hang

### Issue: "Response format unexpected"
**Solution:** Log actual response from z.ai and compare with Anthropic documentation

### Issue: "Groundswell module not found"
**Solution:**
```bash
cd ~/projects/groundswell
npm link
cd ~/projects/hacky-hack
npm link groundswell
```

---

## 13. References

### Internal Documentation
- **Environment Config:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/environment_config.md`
- **Groundswell API:** `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/groundswell_api.md`
- **PRD:** `/home/dustin/projects/hacky-hack/PRD.md`

### Source Files
- **Constants:** `/home/dustin/projects/hacky-hack/src/config/constants.ts`
- **Environment Module:** `/home/dustin/projects/hacky-hack/src/config/environment.ts`
- **Types:** `/home/dustin/projects/hacky-hack/src/config/types.ts`

### Test Files
- **Unit Tests:** `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`
- **Integration Tests:** `/home/dustin/projects/hacky-hack/tests/integration/mapping-test.ts`
- **Manual Tests:** `/home/dustin/projects/hacky-hack/tests/manual/env-test.ts`

### External Documentation (To Be Verified)
- **Anthropic API Docs:** https://docs.anthropic.com/
- **z.ai Documentation:** (URL to be determined - requires web search)
- **Groundswell:** Local library at `~/projects/groundswell`

---

## Conclusion

This research document consolidates all currently known information about z.ai API compatibility from your codebase. The configuration is well-structured for Anthropic compatibility, with proper environment variable mapping and model selection.

**Key Takeaway:** Your existing configuration module (`src/config/environment.ts`) handles the critical mapping between shell environment (`ANTHROPIC_AUTH_TOKEN`) and SDK expectations (`ANTHROPIC_API_KEY`), while setting the correct base URL for z.ai.

**Critical Action Item:** Run the validation script to verify actual z.ai API behavior, as many compatibility assumptions are based on Anthropic API standards and require empirical validation.
