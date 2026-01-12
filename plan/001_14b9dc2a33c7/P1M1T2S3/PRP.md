# Product Requirement Prompt (PRP): Validate z.ai API Compatibility

**PRP ID**: P1.M1.T2.S3
**Work Item Title**: Validate z.ai API compatibility
**Story Points**: 2
**Status**: Ready for Implementation
**Generated**: 2026-01-12

---

## Goal

**Feature Goal**: Create an executable TypeScript validation script that empirically tests z.ai API compatibility with the Anthropic API format, confirming endpoint availability, authentication, and basic message completion functionality.

**Deliverable**: `src/scripts/validate-api.ts` - An executable TypeScript script that:
- Tests GET endpoint availability at `/api/anthropic` (if exists)
- Tests POST `/api/anthropic/v1/messages` with minimal payload
- Verifies GLM-4.7 model accepts requests
- Logs response format and headers for analysis
- Exits with code 1 if any test fails

**Success Definition**:
- Script executes successfully with valid `ANTHROPIC_API_KEY` and `BASE_URL`
- All API endpoints respond with valid HTTP status codes
- GLM-4.7 model accepts and responds to message requests
- Response format is logged for analysis (JSON structure, headers)
- Script exits with code 0 on success, code 1 on any failure
- Output is human-readable with clear pass/fail indicators

---

## User Persona

**Target User**: Developer setting up the PRP pipeline who needs to verify that z.ai API credentials and endpoint configuration are working correctly before proceeding with agent implementation.

**Use Case**: After configuring environment variables (P1.M1.T2.S1), the developer needs to validate that:
1. The z.ai API endpoint is reachable
2. Authentication is working with the configured API key
3. The GLM-4.7 model responds to basic message requests
4. Response format matches Anthropic API expectations

**User Journey**:
1. Developer sets `ANTHROPIC_API_KEY` (via `ANTHROPIC_AUTH_TOKEN` mapping)
2. Developer runs `npx tsx src/scripts/validate-api.ts`
3. Script displays progress with colored output (blue info, green success, red error)
4. Script confirms API is working or provides detailed error output
5. Developer can proceed with confidence to Groundswell agent implementation

**Pain Points Addressed**:
- **Uncertain API compatibility**: z.ai is a proxy endpoint; actual compatibility is unknown until tested
- **Hard to debug auth failures**: Without detailed logging, authentication issues are opaque
- **No feedback on response format**: Need to see actual response structure to integrate correctly
- **Time-consuming manual testing**: Eliminates need for curl commands and manual JSON inspection

---

## Why

- **Blocks agent implementation**: All subsequent Groundswell agent creation (P2.M1.T1) depends on verified API connectivity
- **Prevents late-stage failures**: Catching API incompatibility early prevents wasting time on integration that won't work
- **Documents actual API behavior**: Response format logging reveals how z.ai differs from official Anthropic API
- **Enables confident progression**: Successful validation provides green light to proceed with pipeline development
- **Creates reusable tool**: Script can be run in CI/CD pipelines and for troubleshooting

---

## What

Create a TypeScript CLI script that performs the following validations:

### 1. Environment Configuration Validation
- Load and validate environment variables using existing `configureEnvironment()` and `validateEnvironment()`
- Display configured values (API key redacted, base URL, model)

### 2. Endpoint Availability Test
- Test GET request to `BASE_URL` (root endpoint)
- Test HEAD request to `BASE_URL/v1/messages` (endpoint existence check)
- Report HTTP status codes and response headers

### 3. Authentication Test
- Send minimal POST request to `BASE_URL/v1/messages`
- Verify authentication headers are accepted
- Detect and report 401/403 authentication failures

### 4. Message Completion Test
- Send minimal message payload to GLM-4.7 model
- Verify response structure (id, content, role, stop_reason)
- Log response format (headers, body, usage statistics)
- Measure and report response latency

### Success Criteria

- [ ] Script file exists at `src/scripts/validate-api.ts`
- [ ] Script is executable with shebang `#!/usr/bin/env tsx`
- [ ] All tests pass with valid environment configuration
- [ ] Script exits with code 0 on success, code 1 on failure
- [ ] Output uses colored terminal output (blue info, green success, red error, yellow warning)
- [ ] Response format is logged (JSON pretty-printed)
- [ ] Test failures produce detailed error output with HTTP status and response body

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file location and shebang pattern
- Complete script structure with logging utilities
- Specific API endpoint URLs and expected behavior
- Request/response format examples
- Error handling patterns
- Project-specific validation commands

### Documentation & References

```yaml
# MUST READ - Critical architecture documentation

- file: plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Defines environment variable mapping and base URL configuration
  critical: ANTHROPIC_AUTH_TOKEN maps to ANTHROPIC_API_KEY - must call configureEnvironment()
  section: Lines 10-32 (Environment Variables tables)

- file: src/config/environment.ts
  why: Existing module provides configureEnvironment(), validateEnvironment(), getModel()
  pattern: Use these functions for environment setup and model selection
  gotcha: Must call configureEnvironment() BEFORE accessing ANTHROPIC_API_KEY

- file: plan/001_14b9dc2a33c7/P1M1T2S2/PRP.md
  why: Shows test patterns used in this project (Vitest, AAA pattern, vi.stubEnv)
  pattern: Follow validation and error handling patterns from existing tests

- url: https://nodejs.org/api/globals.html#fetch
  why: Node.js 20+ native fetch API documentation
  critical: Use native fetch (no axios dependency needed)

- url: https://docs.anthropic.com/claude/reference/messages_post
  why: Official Anthropic Messages API reference for expected request/response format
  critical: Compare z.ai responses against this format to identify differences

- file: tests/manual/env-test.ts
  why: Example manual test script with ESM import pattern and console output
  pattern: Follow shebang, import, and execution patterns

# EXTERNAL RESEARCH - TypeScript CLI validation scripts

- url: https://nodejs.org/api/process.html#processexitcode
  why: Process exit codes for CLI scripts (0 = success, 1 = failure)
  critical: Must use process.exit(1) on failure to signal error to shell

- url: https://nodejs.org/api/process.html#event-unhandledrejection
  why: Unhandled rejection handler pattern for async operations
  critical: Catch unhandled promise rejections and exit with code 1

- url: https://tsx.is/
  why: tsx documentation for executing TypeScript directly
  critical: Shebang pattern: #!/usr/bin/env tsx

# EXISTING VALIDATION SCRIPTS (for reference - DO NOT copy directly)

- file: scripts/validate-zai-api.sh
  why: Bash validation script created during research - shows test sequence
  pattern: Use this as reference for test logic, NOT as source to copy

- file: tests/validation/zai-api-test.ts
  why: TypeScript validation script created during research
  pattern: Use this as reference for structure, NOT as source to copy
  gotcha: These scripts are in different locations - the deliverable is src/scripts/validate-api.ts
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── config/
│   │   ├── constants.ts       # DEFAULT_BASE_URL, MODEL_NAMES
│   │   ├── environment.ts     # configureEnvironment(), getModel(), validateEnvironment()
│   │   └── types.ts           # ModelTier, EnvironmentConfig, EnvironmentValidationError
│   ├── agents/                # (empty - future Groundswell agents)
│   ├── core/                  # (empty - future pipeline logic)
│   ├── utils/                 # (empty - future utilities)
│   ├── workflows/             # (empty - future workflows)
│   └── scripts/               # (empty - TARGET DIRECTORY for this PRP)
├── tests/
│   ├── unit/config/
│   │   └── environment.test.ts  # Vitest tests for environment module
│   ├── integration/
│   ├── manual/
│   │   └── env-test.ts        # Manual test script example
│   └── validation/
│       └── zai-api-test.ts    # Research artifact (NOT the deliverable)
├── scripts/
│   └── validate-zai-api.sh    # Bash research artifact (NOT the deliverable)
├── package.json               # TypeScript 5.2+, tsx 4.7+, vitest 1.6.1+
├── tsconfig.json              # ESM, NodeNext, strict mode
└── vitest.config.ts           # Test configuration
```

### Desired Codebase Tree with Files to be Added

```bash
src/
└── scripts/
    └── validate-api.ts        # NEW: API validation script (this PRP)
        # Shebang: #!/usr/bin/env tsx
        # Imports: configureEnvironment, validateEnvironment, getModel from ../config/environment.js
        # Exports: None (CLI script)
        # Entry point: main() function with error handlers
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Must call configureEnvironment() BEFORE accessing ANTHROPIC_API_KEY
// Shell uses ANTHROPIC_AUTH_TOKEN, but SDK expects ANTHROPIC_API_KEY
// Without calling configureEnvironment(), API key validation will fail

// CRITICAL: Import paths must use .js extension (ESM requirement)
// import { configureEnvironment } from '../config/environment.js';  // CORRECT
// import { configureEnvironment } from '../config/environment';    // WRONG - runtime error

// CRITICAL: Native fetch API in Node.js 20+ has subtle differences from browser fetch
// - Response timeout: Node.js fetch has no built-in timeout (use AbortController)
// - Response body: Must check response.ok before calling response.json()
// - Error handling: fetch() doesn't throw on HTTP errors, only network errors

// GOTCHA: z.ai API base URL includes /api/anthropic path component
// Official Anthropic: https://api.anthropic.com/v1/messages
// z.ai: https://api.z.ai/api/anthropic/v1/messages
// The /api/anthropic is part of the base URL, not the endpoint path

// GOTCHA: anthropic-version header behavior is UNKNOWN for z.ai
// Official Anthropic requires: anthropic-version: 2023-06-01
// z.ai may ignore or reject this header - test both scenarios

// GOTCHA: Model names are different from Anthropic
// Anthropic: claude-opus-4-20250514, claude-sonnet-4-20250514
// z.ai: GLM-4.7, GLM-4.5-Air
// Must use getModel() to get correct model names

// GOTCHA: TypeScript strict mode requires explicit error types in catch blocks
// catch (error) {  // Type is 'unknown'
//   if (error instanceof Error) {  // Must narrow type first
//     console.error(error.message);
//   }
// }

// GOTCHA: Process exit with async operations
// Always await all promises before calling process.exit()
// Use try/catch at top level of main() to handle errors

// GOTCHA: Shebang with tsx requires file to be executable or run via npx tsx
// #!/usr/bin/env tsx works when file is executable (chmod +x)
// Otherwise use: npx tsx src/scripts/validate-api.ts

// GOTCHA: Response format may differ from Anthropic official API
// Log full response to identify differences in structure
// Key fields to verify: id, type, role, content, stop_reason, usage, model
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Validation result interface for individual tests
 */
interface ValidationResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  data?: unknown;
}

/**
 * API response structure (based on Anthropic format)
 * Actual structure from z.ai may differ - this is for reference
 */
interface MessageResponse {
  id: string;
  type: string;
  role: 'assistant';
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/scripts/validate-api.ts file with shebang and imports
  - SHEBANG: #!/usr/bin/env tsx
  - IMPORTS:
    - configureEnvironment, validateEnvironment, getModel from '../config/environment.js'
  - NAMING: kebab-case for file name (validate-api.ts)
  - PLACEMENT: src/scripts/ directory
  - DEPENDENCIES: None

Task 2: IMPLEMENT logging utilities with colored output
  - CREATE: log object with info, success, error, warn, section methods
  - PATTERN: Use ANSI color codes (\x1b[31m for red, \x1b[32m for green, etc.)
  - ICONS: Use Unicode symbols (✓, ✗, ℹ, ⚠)
  - PLACEMENT: Top of validate-api.ts file
  - DEPENDENCIES: Task 1

Task 3: IMPLEMENT test endpoint availability function
  - SIGNATURE: async function testEndpointAvailability(): Promise<void>
  - LOGIC:
    1. GET request to BASE_URL (root)
    2. HEAD request to BASE_URL/v1/messages
    3. Report status codes and response headers
  - ERROR HANDLING: Throw descriptive error on network failures
  - PLACEMENT: In validate-api.ts
  - DEPENDENCIES: Task 1, Task 2

Task 4: IMPLEMENT test authentication function
  - SIGNATURE: async function testAuthentication(): Promise<void>
  - LOGIC:
    1. Send minimal POST to /v1/messages
    2. Check for 401/403 status codes
    3. Throw error if authentication fails
  - PAYLOAD: Use getModel('sonnet') with minimal message
  - TIMEOUT: Use AbortController with 30 second timeout
  - PLACEMENT: In validate-api.ts
  - DEPENDENCIES: Task 1, Task 2

Task 5: IMPLEMENT test message completion function
  - SIGNATURE: async function testMessageCompletion(): Promise<void>
  - LOGIC:
    1. Send message with "Respond with just 'OK'" prompt
    2. Parse and validate response structure
    3. Log response format (headers, body, usage)
    4. Measure and report latency
  - VALIDATION: Check id, content array, role, stop_reason fields
  - PLACEMENT: In validate-api.ts
  - DEPENDENCIES: Task 1, Task 2

Task 6: IMPLEMENT main function with orchestration
  - SIGNATURE: async function main(): Promise<void>
  - LOGIC:
    1. Call configureEnvironment()
    2. Call validateEnvironment()
    3. Run test functions in sequence (availability, auth, completion)
    4. Log success summary
    5. Exit with code 0
  - ERROR HANDLING: Catch all errors, log, exit with code 1
  - PLACEMENT: In validate-api.ts
  - DEPENDENCIES: Task 3, Task 4, Task 5

Task 7: ADD process error handlers
  - HANDLERS: unhandledRejection, uncaughtException, SIGINT
  - LOGIC: Log error and exit with code 1 (or 130 for SIGINT)
  - PLACEMENT: After main() function
  - DEPENDENCIES: Task 6

Task 8: INVOKE main function at bottom of file
  - INVOKE: main() with await (top-level await in ESM)
  - ERROR HANDLING: Catch top-level errors
  - PLACEMENT: Bottom of validate-api.ts
  - DEPENDENCIES: Task 6, Task 7

Task 9: VERIFY TypeScript compilation
  - RUN: npx tsc --noEmit src/scripts/validate-api.ts
  - EXPECTED: No errors
  - IF ERRORS: Fix type annotations, add missing imports
  - VALIDATION: All types are correctly inferred

Task 10: MANUAL TEST with valid API key
  - RUN: npx tsx src/scripts/validate-api.ts
  - EXPECTED: All tests pass, exit code 0
  - VERIFY: Check response format output
  - DEPENDENCIES: Task 8
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL PATTERNS - Follow these for consistency
// ============================================================================

// PATTERN 1: Shebang and file header
#!/usr/bin/env tsx
/**
 * z.ai API Validation Script
 *
 * Validates API configuration and connectivity for z.ai/Anthropic API
 *
 * @example
 * ```bash
 * npx tsx src/scripts/validate-api.ts
 * ```
 *
 * @exitcode 0 All validations passed
 * @exitcode 1 Validation failed
 */

// PATTERN 2: Colored logging utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
} as const;

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

// PATTERN 3: Environment configuration (MUST BE FIRST)
import { configureEnvironment, validateEnvironment, getModel } from '../config/environment.js';

// CRITICAL: Call this before accessing ANTHROPIC_API_KEY
configureEnvironment();
validateEnvironment(); // Throws if missing required vars

const apiKey = process.env.ANTHROPIC_API_KEY;
const baseURL = process.env.ANTHROPIC_BASE_URL;

// PATTERN 4: Fetch with timeout using AbortController
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// PATTERN 5: Request headers for Anthropic-compatible API
const headers = {
  'x-api-key': apiKey!,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
};

// GOTCHA: anthropic-version header may cause issues with z.ai
// If tests fail, try removing this header

// PATTERN 6: Minimal message payload
const payload = {
  model: getModel('sonnet'), // Returns 'GLM-4.7'
  max_tokens: 10,
  messages: [{
    role: 'user',
    content: 'Respond with just "OK"',
  }],
};

// PATTERN 7: Response validation
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`HTTP ${response.status}: ${errorText}`);
}

const data = await response.json();

// Validate expected fields
if (!data.id) throw new Error('Response missing id field');
if (!data.content || !Array.isArray(data.content)) throw new Error('Response missing content array');
if (data.role !== 'assistant') throw new Error(`Unexpected role: ${data.role}`);

// PATTERN 8: Error handling with type narrowing
try {
  await someOperation();
} catch (error) {
  if (error instanceof Error) {
    log.error(error.message);
  } else {
    log.error('Unknown error occurred');
  }
  process.exit(1);
}

// PATTERN 9: Main function orchestration
async function main(): Promise<void> {
  try {
    log.section('=== z.ai API Validation ===\n');

    // Step 1: Environment
    log.info('Validating environment configuration...');
    // ... environment validation
    log.success('Environment configured');

    // Step 2: Endpoint availability
    log.info('Testing endpoint availability...');
    await testEndpointAvailability();
    log.success('Endpoint available');

    // Step 3: Authentication
    log.info('Testing authentication...');
    await testAuthentication();
    log.success('Authentication successful');

    // Step 4: Message completion
    log.info('Testing message completion...');
    await testMessageCompletion();
    log.success('Message completion working');

    log.section('\n=== All Validations Passed ===');
    process.exit(0);

  } catch (error) {
    log.section('\n=== Validation Failed ===');
    if (error instanceof Error) {
      log.error(error.message);
    }
    process.exit(1);
  }
}

// PATTERN 10: Process error handlers
process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.warn('\nReceived SIGINT, exiting...');
  process.exit(130); // 128 + 2 (SIGINT)
});

// PATTERN 11: Top-level await to run main
await main();
```

### Integration Points

```yaml
ENVIRONMENT_MODULE:
  - import: configureEnvironment, validateEnvironment, getModel from ../config/environment.js
  - call: configureEnvironment() MUST be called before accessing ANTHROPIC_API_KEY
  - call: validateEnvironment() to throw if required vars missing

PROCESS_ENV:
  - read: ANTHROPIC_API_KEY (after configureEnvironment mapping)
  - read: ANTHROPIC_BASE_URL (with default from configureEnvironment)
  - read: ANTHROPIC_AUTH_TOKEN (source of API key mapping)

ZAI_API:
  - endpoint: https://api.z.ai/api/anthropic (BASE_URL)
  - endpoint: https://api.z.ai/api/anthropic/v1/messages (messages endpoint)
  - header: x-api-key with ANTHROPIC_API_KEY value
  - header: anthropic-version: 2023-06-01 (may be ignored by z.ai)
  - model: GLM-4.7 (via getModel('sonnet'))

PACKAGE_JSON:
  - add_script: "validate:api": "tsx src/scripts/validate-api.ts"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit src/scripts/validate-api.ts
# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
# Common errors:
# - TS2307: Cannot find module -> Check import paths include .js extension
# - TS7006: Parameter implicitly has 'any' type -> Add explicit type annotation
# - TS2322: Type 'unknown' is not assignable -> Add type narrowing

# Check file exists and is readable
test -f src/scripts/validate-api.ts && echo "File exists" || echo "ERROR: File not found"

# Verify shebang is present
head -1 src/scripts/validate-api.ts
# Expected: #!/usr/bin/env tsx
```

### Level 2: Unit Tests (Component Validation)

```bash
# NOTE: This is a manual validation script, not a unit test module
# For testing, run the script with different environment states:

# Test 1: Missing environment variables (should fail gracefully)
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN
npx tsx src/scripts/validate-api.ts
# Expected: Error message about missing API key, exit code 1

# Test 2: Valid environment but invalid API key (should fail auth)
export ANTHROPIC_AUTH_TOKEN="invalid-key-12345"
npx tsx src/scripts/validate-api.ts
# Expected: Authentication error (401 or 403), exit code 1

# Test 3: Verify import paths work (dry run)
npx tsx --print src/scripts/validate-api.ts 2>&1 | head -5
# Expected: No import errors

# Expected: Script handles error cases appropriately
```

### Level 3: Integration Testing (System Validation)

```bash
# Test with valid API key (requires actual credentials)
export ANTHROPIC_AUTH_TOKEN="your-actual-api-key"
npx tsx src/scripts/validate-api.ts

# Expected output pattern:
# === z.ai API Validation ===
# ℹ Validating environment configuration...
# ✓ Environment configured
# ℹ Testing endpoint availability...
# ✓ Endpoint available
# ℹ Testing authentication...
# ✓ Authentication successful
# ℹ Testing message completion...
# ✓ Message completion working
# === All Validations Passed ===

# Verify exit code on success
npx tsx src/scripts/validate-api.ts; echo "Exit code: $?"
# Expected: Exit code: 0

# Verify exit code on failure (with bad credentials)
export ANTHROPIC_AUTH_TOKEN="bad-key"
npx tsx src/scripts/validate-api.ts; echo "Exit code: $?"
# Expected: Exit code: 1

# Expected: All integrations working, proper API responses
```

### Level 4: Creative & Domain-Specific Validation

```bash
# API Response Format Validation
# The script should log the actual response structure for analysis

# Run with valid credentials and capture output
export ANTHROPIC_AUTH_TOKEN="your-actual-api-key"
npx tsx src/scripts/validate-api.ts 2>&1 | tee /tmp/validation-output.txt

# Verify response format contains expected fields
grep -q '"id"' /tmp/validation-output.txt && echo "✓ id field present"
grep -q '"role"' /tmp/validation-output.txt && echo "✓ role field present"
grep -q '"content"' /tmp/validation-output.txt && echo "✓ content field present"
grep -q '"stop_reason"' /tmp/validation-output.txt && echo "✓ stop_reason field present"

# Test response time measurement
# The script should report latency for API calls
grep -E "([0-9]+ms|[0-9]+\.?[0-9]*s)" /tmp/validation-output.txt

# Test colored output (if terminal supports it)
# Run in a terminal to verify colors are displayed correctly

# Test signal handling (SIGINT)
# Run the script and press Ctrl+C to verify graceful shutdown
npx tsx src/scripts/validate-api.ts
# Press Ctrl+C, expect: "⚠ Received SIGINT, exiting..." and exit code 130

# Expected: All creative validations pass, response format is documented
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Script file exists at `src/scripts/validate-api.ts`
- [ ] Shebang `#!/usr/bin/env tsx` is present on first line
- [ ] TypeScript compiles without errors: `npx tsc --noEmit src/scripts/validate-api.ts`
- [ ] Imports use `.js` extension for ESM compatibility
- [ ] All functions have proper TypeScript type annotations
- [ ] Error handling uses type narrowing for `unknown` error type
- [ ] Process exit codes are correct (0 for success, 1 for failure)
- [ ] AbortController is used for fetch timeout (30 seconds recommended)

### Feature Validation

- [ ] `configureEnvironment()` is called before accessing environment variables
- [ ] `validateEnvironment()` is called to verify required variables
- [ ] Endpoint availability test includes both GET and HEAD requests
- [ ] Authentication test detects 401/403 status codes
- [ ] Message completion test validates response structure
- [ ] Response format is logged (headers, body, usage statistics)
- [ ] Colored output works in terminal (blue info, green success, red error)
- [ ] Script provides detailed error output on failure

### Code Quality Validation

- [ ] Follows existing codebase patterns (ESM imports, TypeScript strict mode)
- [ ] File placement matches desired structure: `src/scripts/validate-api.ts`
- [ ] JSDoc comments include `@example` and `@exitcode` documentation
- [ ] Error messages are descriptive and actionable
- [ ] No hardcoded values (uses `getModel()`, environment variables)
- [ ] No logging of sensitive values (API key is redacted)
- [ ] Process error handlers are registered (unhandledRejection, uncaughtException, SIGINT)

### Documentation & Deployment

- [ ] Script is executable: `chmod +x src/scripts/validate-api.ts` (optional)
- [ ] Can be run via: `npx tsx src/scripts/validate-api.ts`
- [ ] Add to package.json: `"validate:api": "tsx src/scripts/validate-api.ts"`
- [ ] Script output is human-readable with clear pass/fail indicators
- [ ] Response format is documented in script output or comments
- [ ] Unknown behaviors are noted (e.g., anthropic-version header handling)

---

## Anti-Patterns to Avoid

- **Don't** skip calling `configureEnvironment()` - API key mapping will be missing
- **Don't** use axios - native fetch API is sufficient and has no dependency
- **Don't** forget the `.js` extension in imports - ESM requires it
- **Don't** log the full API key - always redact sensitive values
- **Don't** ignore fetch errors - check `response.ok` before parsing JSON
- **Don't** forget timeout handling - API requests can hang indefinitely
- **Don't** use `process.exit()` without proper cleanup - await all promises first
- **Don't** hardcode model names - use `getModel()` function
- **Don't** assume response format - validate actual structure from z.ai
- **Don't** skip error type narrowing - catch blocks receive `unknown` type

---

## Next Steps (After This Task)

**P1.M1.T3.S1**: Configure ESLint and Prettier
- Use validation script patterns for consistent code style
- Add linting for the new `src/scripts/` directory

**P2.M1.T1**: Create Agent Factory
- Verified API compatibility enables Groundswell agent creation
- Use `getModel()` function for agent model selection

**P3.M4.T2**: Create CLI Entry Point
- Validation script can be integrated as a pre-flight check
- Add `validate:api` to npm scripts for easy access

---

## Additional Research References

**Stored Research Documents** (for further reading):
- `/home/dustin/projects/hacky-hack/docs/zai-api-research.md` - Comprehensive z.ai API research
- `/home/dustin/projects/hacky-hack/docs/zai-quick-reference.md` - Quick reference guide
- `/home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/docs/nodejs_typescript_research.md` - Node.js 20+ considerations

**Quick Reference URLs**:
- [Node.js Fetch API](https://nodejs.org/api/globals.html#fetch)
- [Anthropic Messages API](https://docs.anthropic.com/claude/reference/messages_post)
- [tsx documentation](https://tsx.is/)
- [TypeScript ESM](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

---

**PRP Version**: 1.0
**Confidence Score**: 9/10 (One-pass implementation success likelihood)
**Estimated Complexity**: Low-Medium (straightforward validation script with well-defined requirements)

**Confidence Rationale**:
- Complete implementation specification with code examples
- Specific API endpoints and expected behavior documented
- Error handling patterns clearly defined
- Existing environment module provides required utilities
- Only uncertainty is actual z.ai API response format (which the script will reveal)

**Risk Mitigation**:
- Log full response format to identify any z.ai-specific differences
- Test with minimal payload first before complex requests
- Provide clear error messages for each failure mode
- Use AbortController for timeout handling to prevent hangs
