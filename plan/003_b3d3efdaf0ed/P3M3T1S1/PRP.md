# Product Requirement Prompt (PRP): Make PRP cache TTL configurable

**PRP ID**: P3.M3.T1.S1
**Work Item Title**: Make PRP cache TTL configurable
**Generated**: 2025-01-25
**Status**: Ready for Implementation

---

## Goal

**Feature Goal**: Make PRP cache TTL (Time-To-Live) configurable via environment variable and CLI option with support for human-readable duration strings (e.g., "24h", "1d", "12h").

**Deliverable**:
1. Configurable cache TTL in `src/agents/prp-generator.ts` (constructor parameter)
2. CLI option `--cache-ttl` in `src/cli/index.ts` with duration parsing
3. Environment variable `HACKY_PRP_CACHE_TTL` support
4. Human-readable duration support using `ms` library
5. Tests in `tests/unit/prp-cache-ttl.test.ts`

**Success Definition**:
- PRP cache TTL is configurable (no longer hardcoded at 24 hours)
- `--cache-ttl <duration>` CLI option accepts formats like "24h", "1d", "12h", "30m"
- `HACKY_PRP_CACHE_TTL` environment variable provides default value
- CLI overrides environment variable, environment variable overrides default (24h)
- Duration parsing validates format and range (1 minute to 30 days)
- Cache expiration uses configured TTL value
- Tests verify custom TTL configuration and expiration behavior

---

## User Persona

**Target User**: Developer or operator using the PRD pipeline who needs to control PRP cache duration for different use cases.

**Use Case**:
- **Fast iteration**: Set short TTL (e.g., "30m") during active development to get fresh PRPs
- **Long-term caching**: Set extended TTL (e.g., "7d") for stable codebases to reduce LLM calls
- **CI/CD optimization**: Configure per-environment TTL (dev vs production)

**User Journey**:
1. User sets `HACKY_PRP_CACHE_TTL=12h` in environment
2. Or uses CLI flag: `prd-pipeline --cache-ttl 6h`
3. Pipeline generates PRPs with configured cache duration
4. Cached PRPs expire after the configured TTL

**Pain Points Addressed**:
- **Fixed 24-hour TTL**: From `system_context.md` - "PRP cache TTL fixed at 24 hours. Not configurable for different use cases"
- **No flexibility**: Can't adjust cache duration for development vs production
- **Unnecessary LLM calls**: Either too frequent (short TTL needed) or stale PRPs (long TTL needed)

---

## Why

- **Development flexibility**: Fast iteration requires shorter cache duration during active development
- **Cost optimization**: Longer cache duration for stable codebases reduces LLM API calls
- **Environment-specific configuration**: Different TTL needs for dev, staging, production
- **User control**: Allow users to tune cache behavior for their workflow

---

## What

Make PRP cache TTL configurable with CLI option and environment variable support.

### Success Criteria

- [ ] `--cache-ttl <duration>` CLI option added to `src/cli/index.ts`
- [ ] `HACKY_PRP_CACHE_TTL` environment variable supported
- [ ] Human-readable durations supported: "24h", "1d", "12h", "30m", "1h"
- [ ] Duration parsing validates format (using `ms` library)
- [ ] Range validation: minimum 1 minute, maximum 30 days
- [ ] PRPGenerator constructor accepts `cacheTtlMs` parameter
- [ ] Cache expiration uses configured TTL value
- [ ] CLI overrides environment variable overrides default (24h)
- [ ] Tests for TTL configuration and expiration
- [ ] Help text documents duration formats

---

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:
- Complete analysis of PRPGenerator class and cache implementation
- Existing CLI configuration patterns from `src/cli/index.ts`
- Test patterns from `tests/unit/agents/prp-generator.test.ts`
- Duration parsing research using `ms` library
- Environment variable naming conventions
- Specific file paths, line numbers, and code patterns

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# PRPGenerator Cache Implementation (MODIFY)
- file: src/agents/prp-generator.ts
  why: Target file for configurable TTL
  pattern:
    - Line 151: `readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;` - CHANGE to instance property
    - Lines 154-179: `constructor()` - ADD cacheTtlMs parameter
    - Line 267: `return age < this.CACHE_TTL_MS;` - CHANGE to `this.#cacheTtlMs`
  gotcha:
    - Current constant is `readonly`, need to change to private property `#cacheTtlMs`
    - Constructor signature change requires updating all call sites
    - Cache hit/miss logging uses fixed 24-hour reference in comments

# CLI Options Pattern (FOLLOW)
- file: src/cli/index.ts
  why: Reference for adding --cache-ttl option with environment variable support
  pattern:
    - Lines 57-117: CLIArgs and ValidatedCLIArgs interfaces - ADD cacheTtl property
    - Lines 230-234: --research-concurrency option - PATTERN for env var default
    - Lines 452-485: Validation pattern for integer options - ADAPT for duration parsing
  gotcha:
    - Use `process.env.HACKY_PRP_CACHE_TTL ?? '24h'` for default
    - Need to import `ms` library for duration parsing
    - Duration strings need validation, not just parseInt

# Duration Parsing (USE)
- file: package.json
  why: Verify ms library is available
  pattern:
    - Line ~: `"ms": "^2.1.3"` - Already installed as dependency
  gotcha:
    - ms library returns `undefined` for invalid formats (check for undefined!)
    - ms is case-insensitive: "1H", "1h" both work
    - "m" means minutes, not milliseconds (use "ms" for milliseconds)

# Environment Variable Naming (FOLLOW)
- file: src/cli/index.ts (lines 235-249)
  why: Reference for environment variable naming convention
  pattern:
    - `HACKY_TASK_RETRY_MAX_ATTEMPTS` for task retry config
    - `HACKY_FLUSH_RETRIES` for flush retry config
    - Use `HACKY_PRP_CACHE_TTL` for consistency
  gotcha:
    - HACKY_ prefix for application-specific configuration
    - Document env var in CLI help text: "(env: HACKY_PRP_CACHE_TTL)"

# Test Patterns (FOLLOW)
- file: tests/unit/agents/prp-generator.test.ts
  why: Reference for PRPGenerator testing patterns
  pattern:
    - Lines 171-198: Constructor tests
    - Lines 467-635: Cache tests
    - Lines 477-510: Cache hit/miss tests
    - Lines 572-594: Cache expiration tests
  gotcha:
    - Mock `node:fs/promises` for file operations
    - Use `vi.mocked()` for type-safe mocks
    - Mock `stat.mtimeMs` to control file age for expiration tests

# PRPGenerator Instantiation (MODIFY)
- file: src/core/task-orchestrator.ts
  why: Pass cacheTtlMs to PRPGenerator constructor
  pattern:
    - Find: `new PRPGenerator(this.sessionManager, noCache)`
    - Change to: `new PRPGenerator(this.sessionManager, noCache, cacheTtlMs)`
  gotcha:
    - May need to accept cacheTtlMs as constructor parameter
    - Default value: `24 * 60 * 60 * 1000` (24 hours)

# ms Library Documentation (REFERENCE)
- url: https://github.com/vercel/ms
  why: Duration parsing library already installed
  critical:
    - Returns `undefined` for invalid formats (must check!)
    - Supports: "30s", "5m", "1h", "1d", "1w" and long forms
    - Supports decimals: "1.5h"
    - Supports negative: "-1h" (but we reject negative values)
    - Case insensitive: "1H" == "1h"

# Research Documentation (REFERENCE)
- docfile: plan/003_b3d3efdaf0ed/P3M3T1S1/research/duration-parsing-research.md
  why: Complete duration parsing research with examples
- docfile: plan/003_b3d3efdaf0ed/P3M3T1S1/research/env-var-patterns.md
  why: Environment variable patterns used in codebase
- docfile: plan/003_b3d3efdaf0ed/P3M3T1S1/research/codebase-analysis.md
  why: Analysis of PRP cache implementation and required changes

# System Context (SOURCE OF REQUIREMENT)
- docfile: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Original requirement source
  section: "Limitations & Pain Points" -> "PRP cache TTL fixed at 24 hours"
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── agents/
│   │   ├── prp-generator.ts              # MODIFY: Add cacheTtlMs parameter
│   │   └── agent-factory.ts
│   ├── cli/
│   │   └── index.ts                       # MODIFY: Add --cache-ttl option
│   ├── core/
│   │   ├── task-orchestrator.ts           # MODIFY: Pass cacheTtlMs to PRPGenerator
│   │   └── session-manager.ts
│   ├── workflows/
│   │   └── prp-pipeline.ts                # MODIFY: Pass cacheTtl through
│   └── utils/
│       ├── logger.ts
│       └── errors.ts
├── tests/
│   └── unit/
│       └── prp-cache-ttl.test.ts          # NEW: Create TTL tests
├── node_modules/
│   └── ms/                                # ALREADY INSTALLED: Duration parsing
├── plan/
│   └── 003_b3d3efdaf0ed/
│       ├── docs/
│       │   └── system_context.md
│       └── P3M3T1S1/
│           ├── PRP.md                     # THIS FILE
│           └── research/
│               ├── duration-parsing-research.md
│               ├── env-var-patterns.md
│               └── codebase-analysis.md
└── package.json                           # VERIFY: ms@^2.1.3 dependency
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── agents/
│   │   └── prp-generator.ts              # MODIFIED: Added cacheTtlMs parameter
│   ├── cli/
│   │   └── index.ts                       # MODIFIED: Added --cache-ttl option
│   ├── core/
│   │   └── task-orchestrator.ts           # MODIFIED: Pass cacheTtlMs parameter
│   └── workflows/
│       └── prp-pipeline.ts                # MODIFIED: Pass cacheTtlMs through
├── tests/
│   └── unit/
│       └── prp-cache-ttl.test.ts          # NEW: TTL configuration and expiration tests
└── plan/
    └── 003_b3d3efdaf0ed/
        └── P3M3T1S1/
            └── PRP.md                     # THIS FILE
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ms library returns undefined for invalid formats
// Don't assume numeric return - always check for undefined!
import ms from 'ms';

const parsed = ms('invalid');
if (parsed === undefined) {
  // Handle error - don't use parsed!
  throw new Error('Invalid duration format');
}

// GOTCHA: "m" means minutes, not milliseconds
ms('10m');   // 600000 (10 minutes)
ms('10ms');  // 10 (10 milliseconds)

// CRITICAL: Current CACHE_TTL_MS is readonly constant
// File: src/agents/prp-generator.ts (line 151)
// Must change to private instance property
// Before: readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// After: readonly #cacheTtlMs: number;

// GOTCHA: Constructor signature change affects all call sites
// Search for: `new PRPGenerator(`
// Update all to include cacheTtlMs parameter

// CRITICAL: Duration validation range
// Minimum: 1 minute (60000ms) - shorter values cause issues
// Maximum: 30 days (2592000000ms) - reasonable upper bound
// Use: 60000 to ms('30d') for validation

// GOTCHA: Environment variable naming
// Use HACKY_PRP_CACHE_TTL for consistency
// Not: PRP_CACHE_TTL, CACHE_TTL, or other variations

// CRITICAL: CLI option precedence
// 1. CLI flag (--cache-ttl 12h)
// 2. Environment variable (HACKY_PRP_CACHE_TTL=24h)
// 3. Default value (24h)
// Use: process.env.HACKY_PRP_CACHE_TTL ?? '24h'

// GOTCHA: Test setup for cache expiration
// Need to mock stat.mtimeMs to control file age
// mockStat.mockResolvedValue({
//   mtimeMs: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
//   isFile: () => true,
// });

// CRITICAL: Duration string formats supported by ms
// Short: "30s", "5m", "1h", "1d", "1w"
// Long: "30 seconds", "5 minutes", "1 hour", "1 day"
// Decimals: "1.5h"
// Case insensitive: "1H", "1h"
```

---

## Implementation Blueprint

### Data Models and Structure

**1. CLI Interface Extensions**

```typescript
// File: src/cli/index.ts

export interface CLIArgs {
  // ... existing properties ...

  /** PRP cache TTL duration (e.g., "24h", "1d", "12h") - may be string from commander */
  cacheTtl?: string;
}

export interface ValidatedCLIArgs extends Omit<CLIArgs, 'cacheTtl' | 'parallelism' | ...> {
  // ... existing validated properties ...

  /** PRP cache TTL in milliseconds - validated as number */
  cacheTtl: number;
}
```

**2. PRPGenerator Constructor Signature**

```typescript
// File: src/agents/prp-generator.ts

export class PRPGenerator {
  readonly #logger: Logger;
  readonly sessionManager: SessionManager;
  readonly sessionPath: string;
  #researcherAgent: Agent;
  readonly #noCache: boolean;
  #cacheHits: number = 0;
  #cacheMisses: number = 0;

  /** Cache TTL in milliseconds (configurable, default 24 hours) */
  readonly #cacheTtlMs: number;

  constructor(
    sessionManager: SessionManager,
    noCache: boolean = false,
    cacheTtlMs: number = 24 * 60 * 60 * 1000
  ) {
    this.#logger = getLogger('PRPGenerator');
    this.sessionManager = sessionManager;
    this.#noCache = noCache;
    this.#cacheTtlMs = cacheTtlMs;
    // ... rest of constructor
  }

  // Update cache age check to use instance property
  async #isCacheRecent(filePath: string): Promise<boolean> {
    try {
      const stats = await stat(filePath);
      const age = Date.now() - stats.mtimeMs;
      return age < this.#cacheTtlMs; // Use instance property
    } catch {
      return false;
    }
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/agents/prp-generator.ts - Add cacheTtlMs parameter
  DEPENDENCIES: None (first task)
  MODIFY:
    - Line 151: Change `readonly CACHE_TTL_MS = ...` to private property
    - Lines 154-179: Add cacheTtlMs parameter to constructor
    - Line 267: Update to use `this.#cacheTtlMs`
    - Line 152: Add JSDoc for configurable TTL
  PATTERN:
    - Change constant to instance property
    - Use readonly #cacheTtlMs: number
    - Provide default value: 24 * 60 * 60 * 1000
  NAMING: camelCase for parameter, # for private property
  GOTCHA:
    - Must update all call sites with new parameter
    - Use default value for backward compatibility

Task 2: MODIFY src/cli/index.ts - Add CLI option and types
  DEPENDENCIES: Task 1 (PRPGenerator must accept cacheTtlMs)
  ADD:
    - Import ms library: `import ms from 'ms';`
    - Line ~60: Add `cacheTtl?: string;` to CLIArgs interface
    - Line ~130: Add `cacheTtl: number;` to ValidatedCLIArgs interface
    - Line ~260: Add .option() for --cache-ttl
    - Line ~500: Add duration parsing validation
  IMPLEMENT:
    - CLI option with env var default:
      .option(
        '--cache-ttl <duration>',
        'PRP cache time-to-live (e.g., 24h, 1d, 12h, env: HACKY_PRP_CACHE_TTL)',
        process.env.HACKY_PRP_CACHE_TTL ?? '24h'
      )
    - Duration parsing and validation:
      const cacheTtlStr = String(options.cacheTtl);
      const cacheTtlMs = ms(cacheTtlStr);
      if (cacheTtlMs === undefined) {
        logger.error(`Invalid duration format: "${cacheTtlStr}"`);
        logger.error('Expected formats: 30s, 5m, 1h, 1d, etc.');
        process.exit(1);
      }
      if (cacheTtlMs < 60000) {
        logger.error('--cache-ttl must be at least 1 minute');
        process.exit(1);
      }
      if (cacheTtlMs > ms('30d')) {
        logger.error('--cache-ttl cannot exceed 30 days');
        process.exit(1);
      }
      options.cacheTtl = cacheTtlMs;
  PATTERN: Follow existing CLI option pattern (lines 230-249)
  GOTCHA:
    - ms returns undefined for invalid formats (must check!)
    - Use '24h' as default, not 86400000
    - Document env var in help text

Task 3: MODIFY src/core/task-orchestrator.ts - Pass cacheTtlMs to PRPGenerator
  DEPENDENCIES: Task 1 (PRPGenerator signature changed)
  MODIFY:
    - Find: `new PRPGenerator(this.sessionManager, noCache)`
    - Change to: `new PRPGenerator(this.sessionManager, noCache, cacheTtlMs)`
    - Add cacheTtlMs parameter to method/class
  PATTERN: Follow existing parameter passing pattern
  GOTCHA:
    - May need to accept cacheTtlMs from constructor
    - Default value if not provided

Task 4: MODIFY src/workflows/prp-pipeline.ts - Pass cacheTtlMs through
  DEPENDENCIES: Task 2 (CLI option validated), Task 3 (TaskOrchestrator ready)
  MODIFY:
    - Accept cacheTtl from CLI args
    - Pass to TaskOrchestrator/PRPGenerator
  PATTERN: Follow existing option passing pattern
  GOTCHA:
    - ValidatedCLIArgs.cacheTtl is number, not string
    - Pass through any existing call chain

Task 5: CREATE tests/unit/prp-cache-ttl.test.ts - TTL tests
  DEPENDENCIES: Task 1, Task 2, Task 3, Task 4 (implementation complete)
  IMPLEMENT:
    - describe('PRP Cache TTL Configuration')
    - test('should use default 24h TTL when not specified')
    - test('should use custom TTL when provided')
    - test('should expire cache after custom TTL duration')
    - test('should validate minimum TTL (1 minute)')
    - test('should validate maximum TTL (30 days)')
    - test('should reject invalid duration formats')
    - test('should parse various duration formats')
  MOCK:
    - Mock node:fs/promises (stat, readFile)
    - Mock file age with mtimeMs
    - Mock ms library for format validation
  FOLLOW pattern: tests/unit/agents/prp-generator.test.ts
  PLACEMENT: tests/unit/prp-cache-ttl.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ================================================================
// PATTERN 1: Duration Parsing with Validation
// ================================================================
// File: src/cli/index.ts

import ms from 'ms';

// In parseCLIArgs() function, after other option validations
// Around line 500 (after flush-retries validation)

// Validate cache-ttl duration option
if (options.cacheTtl !== undefined) {
  const cacheTtlStr = String(options.cacheTtl);
  const cacheTtlMs = ms(cacheTtlStr);

  // CRITICAL: ms returns undefined for invalid formats
  if (cacheTtlMs === undefined) {
    logger.error(`Invalid duration format: "${cacheTtlStr}"`);
    logger.error('Expected formats: 30s, 5m, 1h, 1d, etc.');
    process.exit(1);
  }

  // Validate minimum (1 minute)
  if (cacheTtlMs < 60000) {
    logger.error('--cache-ttl must be at least 1 minute');
    process.exit(1);
  }

  // Validate maximum (30 days)
  const maxTtl = ms('30d');
  if (cacheTtlMs > maxTtl) {
    logger.error('--cache-ttl cannot exceed 30 days');
    process.exit(1);
  }

  // Convert to number
  options.cacheTtl = cacheTtlMs;
} else {
  // Set default if not provided (24 hours)
  options.cacheTtl = ms('24h')!;
}

// ================================================================
// PATTERN 2: PRPGenerator with Configurable TTL
// ================================================================
// File: src/agents/prp-generator.ts

export class PRPGenerator {
  // ... other properties ...

  /** Cache TTL in milliseconds (configurable, default 24 hours) */
  readonly #cacheTtlMs: number;

  /**
   * Creates a new PRPGenerator instance
   *
   * @param sessionManager - Session state manager
   * @param noCache - Whether to bypass cache (default: false)
   * @param cacheTtlMs - Cache TTL in milliseconds (default: 24 hours)
   * @throws {Error} If no session is currently loaded
   */
  constructor(
    sessionManager: SessionManager,
    noCache: boolean = false,
    cacheTtlMs: number = 24 * 60 * 60 * 1000
  ) {
    this.#logger = getLogger('PRPGenerator');
    this.sessionManager = sessionManager;
    this.#noCache = noCache;
    this.#cacheTtlMs = cacheTtlMs;

    // Extract session path from current session
    const currentSession = sessionManager.currentSession;
    if (!currentSession) {
      throw new Error('Cannot create PRPGenerator: no active session');
    }
    this.sessionPath = currentSession.metadata.path;

    // Cache Researcher Agent for reuse
    this.#researcherAgent = createResearcherAgent();
  }

  /**
   * Checks if a cache file is recent enough to use
   *
   * @param filePath - Path to the cache file
   * @returns true if file exists and is younger than TTL, false otherwise
   */
  async #isCacheRecent(filePath: string): Promise<boolean> {
    try {
      const stats = await stat(filePath);
      const age = Date.now() - stats.mtimeMs;
      return age < this.#cacheTtlMs; // Use instance property
    } catch {
      // File doesn't exist or can't be read
      return false;
    }
  }
}

// ================================================================
// PATTERN 3: CLI Option Definition
// ================================================================
// File: src/cli/index.ts

// Add to program options (around line 260, after --flush-retries)
program
  .option(
    '--cache-ttl <duration>',
    'PRP cache time-to-live (e.g., 24h, 1d, 12h, env: HACKY_PRP_CACHE_TTL)',
    process.env.HACKY_PRP_CACHE_TTL ?? '24h'
  )

// ================================================================
// PATTERN 4: TaskOrchestrator Parameter Passing
// ================================================================
// File: src/core/task-orchestrator.ts

// In class or method that creates PRPGenerator
// Add cacheTtlMs parameter

export class TaskOrchestrator {
  // ... existing code ...

  // Example method that creates PRPGenerator
  async #createPRPGenerator(noCache: boolean, cacheTtlMs: number): Promise<PRPGenerator> {
    return new PRPGenerator(
      this.sessionManager,
      noCache,
      cacheTtlMs
    );
  }
}

// ================================================================
// PATTERN 5: Test for Custom TTL Configuration
// ================================================================
// File: tests/unit/prp-cache-ttl.test.ts

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PRPGenerator } from '../../../src/agents/prp-generator.js';
import type { SessionManager } from '../../../src/core/session-manager.js';
import ms from 'ms';

// Mock the agent-factory module
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createResearcherAgent: vi.fn(),
}));

// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
}));

import { stat } from 'node:fs/promises';
const mockStat = vi.mocked(stat);

describe('PRP Cache TTL Configuration', () => {
  it('should use default 24h TTL when not specified', () => {
    const mockSessionManager = {
      currentSession: {
        metadata: { path: '/test/session' },
      },
    } as SessionManager;

    const generator = new PRPGenerator(mockSessionManager);
    expect(generator.sessionPath).toBe('/test/session');
    // TTL is private, but behavior is tested via cache expiration
  });

  it('should accept custom TTL in constructor', () => {
    const mockSessionManager = {
      currentSession: {
        metadata: { path: '/test/session' },
      },
    } as SessionManager;

    const customTtl = ms('6h')!;
    const generator = new PRPGenerator(mockSessionManager, false, customTtl);
    expect(generator.sessionPath).toBe('/test/session');
  });

  it('should expire cache after custom TTL duration', async () => {
    const mockSessionManager = {
      currentSession: {
        metadata: { path: '/test/session' },
      },
    } as SessionManager;

    const customTtl = ms('1h')!; // 1 hour TTL
    const generator = new PRPGenerator(mockSessionManager, false, customTtl);

    // Mock stat to return file that's 2 hours old (expired)
    mockStat.mockResolvedValue({
      mtimeMs: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      isFile: () => true,
    } as any);

    const isRecent = await generator['#isCacheRecent']('/test/cache.json');
    expect(isRecent).toBe(false); // Should be expired
  });

  it('should consider cache recent when within TTL', async () => {
    const mockSessionManager = {
      currentSession: {
        metadata: { path: '/test/session' },
      },
    } as SessionManager;

    const customTtl = ms('24h')!; // 24 hour TTL
    const generator = new PRPGenerator(mockSessionManager, false, customTtl);

    // Mock stat to return file that's 12 hours old (recent)
    mockStat.mockResolvedValue({
      mtimeMs: Date.now() - (12 * 60 * 60 * 1000), // 12 hours ago
      isFile: () => true,
    } as any);

    const isRecent = await generator['#isCacheRecent']('/test/cache.json');
    expect(isRecent).toBe(true); // Should be recent
  });
});

// ================================================================
// PATTERN 6: CLI Duration Parsing Tests
// ================================================================
// File: tests/unit/cli/cache-ttl-option.test.ts (optional)

import { describe, expect, it } from 'vitest';
import ms from 'ms';

describe('CLI Cache TTL Duration Parsing', () => {
  const validFormats = [
    { input: '30s', expected: 30000 },
    { input: '5m', expected: 300000 },
    { input: '1h', expected: 3600000 },
    { input: '12h', expected: 43200000 },
    { input: '1d', expected: 86400000 },
    { input: '24h', expected: 86400000 },
    { input: '1w', expected: 604800000 },
  ];

  validFormats.forEach(({ input, expected }) => {
    it(`should parse "${input}" as ${expected}ms`, () => {
      const parsed = ms(input);
      expect(parsed).toBe(expected);
    });
  });

  const invalidFormats = [
    'invalid',
    'abc',
    '123',
    '1x',
    '',
  ];

  invalidFormats.forEach((input) => {
    it(`should reject "${input}" as invalid format`, () => {
      const parsed = ms(input);
      expect(parsed).toBeUndefined();
    });
  });

  it('should reject duration less than 1 minute', () => {
    const parsed = ms('30s');
    expect(parsed).toBe(30000); // Valid
    expect(parsed).toBeLessThan(60000); // But less than min

    // Validation should reject this
    expect(parsed).toBeLessThan(60000);
  });

  it('should reject duration greater than 30 days', () => {
    const parsed = ms('31d');
    const maxTtl = ms('30d')!;

    expect(parsed).toBeDefined();
    expect(parsed!).toBeGreaterThan(maxTtl);
  });
});
```

### Integration Points

```yaml
PRP_GENERATOR:
  - modify: src/agents/prp-generator.ts
  - change: CACHE_TTL_MS constant to #cacheTtlMs instance property
  - add: cacheTtlMs parameter to constructor
  - default: 24 * 60 * 60 * 1000 (24 hours)

CLI_OPTIONS:
  - modify: src/cli/index.ts
  - add: --cache-ttl <duration> option
  - env: HACKY_PRP_CACHE_TTL
  - default: '24h'
  - parse: ms library for duration string parsing

TASK_ORCHESTRATOR:
  - modify: src/core/task-orchestrator.ts
  - add: cacheTtlMs parameter
  - pass: to PRPGenerator constructor

PRP_PIPELINE:
  - modify: src/workflows/prp-pipeline.ts
  - pass: cacheTtl from CLI to TaskOrchestrator

TESTS:
  - create: tests/unit/prp-cache-ttl.test.ts
  - test: TTL configuration, expiration, validation
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Type checking
npx tsc --noEmit src/agents/prp-generator.ts
npx tsc --noEmit src/cli/index.ts
npx tsc --noEmit src/core/task-orchestrator.ts
npx tsc --noEmit src/workflows/prp-pipeline.ts

# Format
npx prettier --write src/agents/prp-generator.ts
npx prettier --write src/cli/index.ts

# Expected: Zero type errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test TTL configuration
vitest run tests/unit/prp-cache-ttl.test.ts

# Test existing PRPGenerator functionality still works
vitest run tests/unit/agents/prp-generator.test.ts

# Full unit test suite
vitest run tests/unit/

# Coverage
vitest run tests/unit/ --coverage

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI option parsing
prd-pipeline --help | grep -A 2 'cache-ttl'

# Test with default TTL (should use 24h)
prd-pipeline --dry-run

# Test with custom TTL
prd-pipeline --cache-ttl 6h --dry-run

# Test with environment variable
HACKY_PRP_CACHE_TTL=12h prd-pipeline --dry-run

# Test invalid format (should error)
prd-pipeline --cache-ttl invalid 2>&1 | grep 'Invalid duration format'

# Test too short duration (should error)
prd-pipeline --cache-ttl 30s 2>&1 | grep 'at least 1 minute'

# Test too long duration (should error)
prd-pipeline --cache-ttl 31d 2>&1 | grep 'cannot exceed 30 days'

# Expected: Commands execute, validation works correctly
```

### Level 4: Manual Validation

```bash
# 1. Test cache expiration with short TTL
# Set TTL to 1 minute
prd-pipeline --cache-ttl 1m --dry-run

# Generate a PRP (will be cached)
# Wait 2 minutes
# Run again - should regenerate PRP (cache expired)

# 2. Test cache hit with long TTL
# Set TTL to 7 days
prd-pipeline --cache-ttl 7d --dry-run

# Generate a PRP (will be cached)
# Run immediately - should use cached PRP

# 3. Verify cache metadata
# Check prps/.cache/ directory for cache metadata
ls -la plan/*/prps/.cache/

# Expected: Cache behavior matches configured TTL
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `src/agents/prp-generator.ts` modified with `cacheTtlMs` parameter
- [ ] `CACHE_TTL_MS` constant changed to `#cacheTtlMs` instance property
- [ ] Constructor accepts `cacheTtlMs` with default value
- [ ] `#isCacheRecent()` uses `this.#cacheTtlMs`
- [ ] `src/cli/index.ts` has `--cache-ttl` option
- [ ] `HACKY_PRP_CACHE_TTL` environment variable supported
- [ ] Duration parsing uses `ms` library
- [ ] Validation checks for undefined return value
- [ ] Range validation: 1 minute to 30 days
- [ ] Error messages are clear and actionable
- [ ] `src/core/task-orchestrator.ts` passes `cacheTtlMs`
- [ ] `src/workflows/prp-pipeline.ts` passes `cacheTtl` through
- [ ] All 4 validation levels completed successfully
- [ ] No type errors: `npx tsc --noEmit`

### Feature Validation

- [ ] `--cache-ttl 24h` sets TTL to 24 hours
- [ ] `--cache-ttl 1d` sets TTL to 24 hours
- [ ] `--cache-ttl 12h` sets TTL to 12 hours
- [ ] `--cache-ttl 30m` sets TTL to 30 minutes
- [ ] `HACKY_PRP_CACHE_TTL=6h` sets default to 6 hours
- [ ] CLI flag overrides environment variable
- [ ] Environment variable overrides default (24h)
- [ ] Invalid formats rejected with clear error
- [ ] Durations < 1 minute rejected
- [ ] Durations > 30 days rejected
- [ ] Cache expires after configured TTL
- [ ] Cache valid when within TTL

### Code Quality Validation

- [ ] Follows existing CLI option patterns
- [ ] Uses `ms` library for duration parsing
- [ ] Checks for `undefined` return from `ms()`
- [ ] Error handling is comprehensive
- [ ] JSDoc comments added for new parameters
- [ ] Private property uses `#` prefix
- [ ] Anti-patterns avoided (see below)

### Documentation & Deployment

- [ ] Help text is clear (`--help` shows `--cache-ttl`)
- [ ] Environment variable documented in help text
- [ ] Duration formats documented in error messages
- [ ] Code is self-documenting with clear names

---

## Anti-Patterns to Avoid

- **Don't** forget to check for `undefined` return from `ms()`
- **Don't** use numeric literals for duration parsing - use `ms()` library
- **Don't** allow zero or negative TTL values
- **Don't** allow unlimited duration - set reasonable max (30 days)
- **Don't** use string comparison for duration validation
- **Don't** forget to update all PRPGenerator call sites
- **Don't** use public property for `cacheTtlMs` - keep it private (`#`)
- **Don't** hardcode "24 hours" in comments - use configurable value
- **Don't** assume "m" means milliseconds - it means minutes
- **Don't** skip range validation - min 1 minute, max 30 days
- **Don't** use different env var name - use `HACKY_PRP_CACHE_TTL`
- **Don't** forget to mock `stat.mtimeMs` in tests for cache expiration

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:
- Complete analysis of PRPGenerator cache implementation
- Existing CLI configuration patterns are clear and consistent
- `ms` library is already installed and well-documented
- Test patterns are well-established in the codebase
- Comprehensive research with code examples
- Specific file paths, line numbers, and patterns provided
- Clear validation requirements

**Risk Areas**:
- Must check for `undefined` return from `ms()` (common pitfall)
- Need to update all PRPGenerator call sites
- Private property access in tests requires bracket notation
- Cache expiration tests need careful mocking

**Mitigation**:
- Always check `ms() === undefined` before using result
- Search for all `new PRPGenerator(` occurrences
- Use `generator['#isCacheRecent']()` for testing private methods
- Mock `stat.mtimeMs` with appropriate timestamps

---

**Document Version**: 1.0
**Last Updated**: 2025-01-25
**Related Documents**:
- Duration Parsing Research: `plan/003_b3d3efdaf0ed/P3M3T1S1/research/duration-parsing-research.md`
- Environment Variable Patterns: `plan/003_b3d3efdaf0ed/P3M3T1S1/research/env-var-patterns.md`
- Codebase Analysis: `plan/003_b3d3efdaf0ed/P3M3T1S1/research/codebase-analysis.md`
- System Context: `plan/003_b3d3efdaf0ed/docs/system_context.md`
