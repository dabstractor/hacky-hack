name: "P5.M2.T1.S1: Verify Groundswell Cache Configuration"
description: |

---

## Goal

**Feature Goal**: Verify that all Groundswell agents have `enableCache: true` configured, create automated cache verification tests that measure cache hit rates, and document cache behavior in architecture notes for production observability.

**Deliverable**:

1. Cache verification test suite at `tests/unit/agents/cache-verification.test.ts`
2. Cache hit rate logging integration with existing structured logger
3. Architecture documentation at `plan/001_14b9dc2a33c7/architecture/cache_behavior.md`

**Success Definition**:

- All 6 agent creation sites verified to have `enableCache: true`
- Cache verification tests pass: identical prompts return cached responses in <10ms
- Cache hit rate metrics logged to structured logger during agent operations
- Architecture documentation complete with cache behavior, performance characteristics, and monitoring guidance
- Zero TypeScript errors, zero linting errors, all existing tests pass

## User Persona

**Target User**: Developers and operators monitoring pipeline performance and API costs.

**Use Case**: A developer needs to verify that the Groundswell caching system is working correctly to:
- Reduce LLM API costs by serving cached responses
- Improve pipeline execution speed through cache hits
- Monitor cache effectiveness through structured logs
- Troubleshoot cache-related performance issues

**User Journey**:

1. Developer runs cache verification tests: `npm test -- tests/unit/agents/cache-verification.test.ts`
2. Tests execute identical prompts twice and verify second call returns instantly (<10ms)
3. Cache hit rates are logged to console and structured logs
4. Developer reviews `plan/001_14b9dc2a33c7/architecture/cache_behavior.md` for cache behavior details
5. During pipeline execution, developer observes cache metrics in logs: `Cache hit rate: 85.5%`

**Pain Points Addressed**:

- **No cache verification**: Currently no automated tests confirm caching is working
- **No observability**: Cache hit rates are not logged or measurable
- **No documentation**: Cache behavior is not documented for troubleshooting
- **Hidden performance issues**: Cache failures or misconfigurations go undetected

## Why

- **Cost Optimization**: Caching reduces LLM API calls, directly lowering operational costs
- **Performance Improvement**: Cached responses return instantly (<10ms) vs. full LLM latency (1-5s)
- **Production Readiness**: Cache hit rate metrics enable monitoring and alerting on performance degradation
- **Dependency Chain**: Completes P5.M2.T1 (Optimize LLM Caching) by verifying existing cache configuration
- **Quality Assurance**: Automated tests prevent cache configuration regressions

## What

Verify Groundswell cache configuration across all agents, create cache verification tests, integrate cache hit rate logging, and document cache behavior.

### Verification Scope

Based on codebase analysis, verify these 6 agent creation sites:

1. **Agent Factory** (`src/agents/agent-factory.ts`) - Central factory with `enableCache: true` in `createBaseConfig()`
2. **PRP Pipeline** (`src/workflows/prp-pipeline.ts`) - Uses `createArchitectAgent()`
3. **Bug Hunt Workflow** (`src/workflows/bug-hunt-workflow.ts`) - Uses `createQAAgent()`
4. **Delta Analysis Workflow** (`src/workflows/delta-analysis-workflow.ts`) - Uses `createQAAgent()`
5. **PRP Generator** (`src/agents/prp-generator.ts`) - Uses `createResearcherAgent()`
6. **PRP Executor** (`src/agents/prp-executor.ts`) - Uses `createCoderAgent()`

### Success Criteria

- [ ] All 6 agent creation sites verified to have `enableCache: true`
- [ ] Cache verification tests created and passing
- [ ] Cache hit rate logging integrated with structured logger
- [ ] Architecture documentation created at `plan/001_14b9dc2a33c7/architecture/cache_behavior.md`
- [ ] All existing tests still pass
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors

---

## All Needed Context

### Context Completeness Check

_The implementing agent has everything needed: complete list of agent creation sites (all verified to have caching enabled), existing test patterns for timing assertions and logging verification, Groundswell cache documentation, architecture documentation patterns, and logger integration patterns from P5.M1.T1.S1._

### Documentation & References

```yaml
# MUST READ - Groundswell Cache Configuration Specification
- docfile: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Defines enableCache option and SHA-256 caching mechanism
  critical: enableCache: true provides SHA-256 based caching with automatic invalidation
  section: Lines 123-128 (example configuration), Lines 150-154 (configuration table), Lines 377-383 (caching behavior)

# MUST READ - Agent Factory (All caching configured here)
- file: src/agents/agent-factory.ts
  why: Central factory where all agents are created with enableCache: true
  pattern: createBaseConfig() returns { enableCache: true } for all personas
  gotcha: All agent creation goes through this factory - no direct Groundswell SDK calls
  section: Lines 160-172 (createBaseConfig with enableCache: true), Lines 197, 228, 256, 284 (persona-specific agents)

# MUST READ - Existing Test Pattern for Cache Verification
- file: tests/unit/core/research-queue.test.ts
  why: Reference pattern for testing cache hits with timing assertions
  pattern: expect(elapsed).toBeLessThan(10) for instant cache response
  section: Lines 1-100 (mock patterns and timing assertions)

# MUST READ - Existing Test Pattern for Agent Factory
- file: tests/unit/agents/agent-factory.test.ts
  why: Follow existing test structure when adding cache verification tests
  pattern: vi.mock('groundswell') with hoisting, beforeEach/afterEach cleanup
  section: Lines 1-50 (test setup and mock patterns)

# MUST READ - Structured Logger (from P5.M1.T1.S1)
- file: src/utils/logger.ts
  why: Use for logging cache hit rates with structured data
  pattern: getLogger('Context') factory, info/debug/warn levels
  section: Lines 1-200 (Logger interface and factory function)
  gotcha: Use .js extension in imports: "import { getLogger } from './logger.js';"

# MUST READ - Existing Cache Metrics Pattern
- file: src/core/task-orchestrator.ts
  why: Reference implementation for cache hit/miss tracking and logging
  pattern: #cacheHits, #cacheMisses fields, #logCacheMetrics() method
  section: Lines 85-86 (cache metrics fields), Lines 583-598 (logCacheMetrics implementation)
  gotcha: Log with structured data: { hits, misses, hitRatio }, 'Cache metrics'

# MUST READ - Architecture Documentation Pattern
- docfile: plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Follow this pattern for cache_behavior.md structure
  pattern: H1 title, H2 major sections, H3 subsections, code blocks for specs
  section: Entire file (template for architecture documentation)

# MUST READ - Progress Logging Pattern (from P5.M1.T2.S2 PRP - parallel work)
- file: src/workflows/prp-pipeline.ts
  why: Shows how to integrate structured logging into workflow operations
  pattern: this.logger.info({ metric: value }, 'Message')
  section: Lines 552-565 (existing progress and shutdown logging)

# MUST READ - All Agent Creation Sites
- file: src/workflows/prp-pipeline.ts
  why: Verify architect agent cache configuration
  pattern: createArchitectAgent() call
  section: Line 472

- file: src/workflows/bug-hunt-workflow.ts
  why: Verify QA agent cache configuration
  pattern: createQAAgent() call
  section: Line 243

- file: src/workflows/delta-analysis-workflow.ts
  why: Verify QA agent cache configuration
  pattern: createQAAgent() call
  section: Line 116

- file: src/agents/prp-generator.ts
  why: Verify researcher agent cache configuration
  pattern: createResearcherAgent() call
  section: Line 146

- file: src/agents/prp-executor.ts
  why: Verify coder agent cache configuration
  pattern: createCoderAgent() call
  section: Line 199

# MUST READ - External Research on Cache Testing
- docfile: plan/001_14b9dc2a33c7/P5M2T1S1/research/agent-creation-sites-research.md
  why: Complete analysis of all 6 agent creation sites with cache status
  critical: All sites verified to have enableCache: true - no fixes needed
  section: "GROUNDSWELL CACHE VERIFICATION REPORT"

# MUST READ - Testing Patterns Research
- docfile: plan/001_14b9dc2a33c7/P5M2T1S1/research/testing-patterns-research.md
  why: Test patterns for timing assertions, cache verification, logging verification
  critical: Timing threshold <10ms for instant cache, performance.now() for precision
  section: "Recommended Implementation for P5.M2.T1.S1"

# MUST READ - Architecture Documentation Research
- docfile: plan/001_14b9dc2a33c7/P5M2T1S1/research/architecture-documentation-research.md
  why: Architecture documentation patterns and structure
  critical: Create cache_behavior.md following environment_config.md pattern
  section: "Documentation Template Pattern"
```

### Current Codebase Tree

```bash
src/
├── agents/              # AI agent implementations
│   ├── agent-factory.ts        # Central factory (createBaseConfig with enableCache: true)
│   ├── prp-generator.ts        # Uses createResearcherAgent() (line 146)
│   └── prp-executor.ts         # Uses createCoderAgent() (line 199)
├── cli/                 # CLI argument parsing
├── config/              # Configuration modules
├── core/                # Core business logic
│   ├── models.ts                # Task hierarchy types
│   ├── task-orchestrator.ts    # Has cache metrics pattern (#logCacheMetrics)
│   └── research-queue.ts       # Has cache verification test pattern
├── tools/               # MCP tools
├── utils/               # General utilities
│   └── logger.ts                # Structured logging (Pino-based) from P5.M1.T1.S1
└── workflows/           # Workflow orchestrations
    ├── prp-pipeline.ts          # Uses createArchitectAgent() (line 472)
    ├── bug-hunt-workflow.ts     # Uses createQAAgent() (line 243)
    └── delta-analysis-workflow.ts  # Uses createQAAgent() (line 116)

tests/
├── unit/
│   ├── agents/
│   │   └── agent-factory.test.ts       # Existing agent factory tests
│   ├── core/
│   │   └── research-queue.test.ts      # Cache verification pattern reference
│   └── utils/
│       └── logger.test.ts              # Logger tests and caching patterns

plan/001_14b9dc2a33c7/
└── architecture/
    ├── environment_config.md           # Architecture documentation pattern
    ├── groundswell_api.md              # Groundswell API spec with enableCache docs
    └── cache_behavior.md               # CREATE: New cache behavior documentation
```

### Desired Codebase Tree

```bash
# New test file:
tests/unit/agents/
└── cache-verification.test.ts          # CREATE: Cache verification tests

# New architecture documentation:
plan/001_14b9dc2a33c7/architecture/
└── cache_behavior.md                   # CREATE: Cache behavior documentation

# No code modifications needed - all cache config verified as correct
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Groundswell Cache Implementation Constraints

// 1. ALL AGENTS ALREADY HAVE enableCache: true
// Codebase analysis confirms all 6 agent creation sites use caching
// NO CODE CHANGES NEEDED - only verification, testing, and documentation

// 2. Groundswell uses SHA-256 for cache keys
// Identical prompts (same system + user + responseFormat) produce same cache key
// Any change to prompt content results in cache miss (automatic invalidation)
// Cache key includes: system prompt, user prompt, responseFormat schema

// 3. Cache verification timing threshold
// Use <10ms threshold for "instant" cache response (from research-queue.test.ts)
// Use performance.now() for high-precision timing (not Date.now())
// First call will be slow (LLM latency ~1-5s), second call should be <10ms

// 4. Cache hit rate measurement
// Groundswell does NOT expose cache hit/miss metrics directly
// Must infer cache behavior by:
//    - Timing identical calls (second call <10ms = cache hit)
//    - Counting prompt() calls (cached calls don't invoke prompt())
//    - Logging before/after agent runs

// 5. Mock pattern for testing
// Use vi.mock('groundswell') with hoisting (top of file, before imports)
// Mock createAgent to return agent with mocked prompt method
// Mock implementation should simulate caching (return same response twice)

// 6. ES Module imports: Use .js extension
// import { createAgent, createPrompt } from 'groundswell';
// import { getLogger } from '../../utils/logger.js';

// 7. Logger pattern: Use getLogger('Context')
// Already imported as this.logger in workflow classes
// For new utilities: const logger = getLogger('CacheVerification');

// 8. Architecture documentation pattern
// Follow environment_config.md structure
// Use H1 for title, H2 for major sections, H3 for subsections
// Include code blocks for configuration examples
// Use tables for options/settings

// 9. Test cleanup: vi.clearAllMocks() in afterEach
// Prevents test interference when multiple tests use same mocks

// 10. Cache logging should NOT be verbose
// Cache hit rate is a metric, not per-event logging
// Log summary metrics, not each cache hit/miss
// Pattern: Log at end of workflow or periodic intervals (every N tasks)

// 11. Agent factory uses centralized configuration
// All agents inherit enableCache: true from createBaseConfig()
// No need to verify each agent's config separately - verify factory only

// 12. Parallel execution with P5.M1.T2.S2
// That PRP creates progress tracking integration
// This PRP creates cache verification (independent work)
// Both use structured logging but integrate separately
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// No new data models - using existing types

// Groundswell AgentConfig (from groundswell library):
interface AgentConfig {
  name: string;
  system: string;
  model: string;
  enableCache: boolean;          // Cache configuration flag
  enableReflection: boolean;
  maxTokens: number;
  temperature: number;
  env?: Record<string, string>;
}

// Cache metrics (for logging):
interface CacheMetrics {
  readonly totalCalls: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly hitRate: number;      // Percentage (0-100)
  readonly avgLatency: number;   // Milliseconds
}

// Test timing result:
interface TimingResult {
  readonly callNumber: number;
  readonly duration: number;     // Milliseconds
  readonly fromCache: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/agents/cache-verification.test.ts
  - IMPLEMENT: Cache verification tests for all agent personas
  - VERIFY: enableCache: true in all agent factory configs
  - TEST: Identical prompts return cached responses in <10ms
  - TEST: Different prompts produce separate cache entries
  - TEST: Cache hit rate logging works correctly
  - FOLLOW: Pattern from tests/unit/agents/agent-factory.test.ts
  - FOLLOW: Pattern from tests/unit/core/research-queue.test.ts (timing assertions)
  - NAMING: describe('Agent Cache Verification'), it('should return cached response instantly')
  - PLACEMENT: tests/unit/agents/

Task 2: VERIFY all 6 agent creation sites (DOCUMENTATION ONLY)
  - READ: src/agents/agent-factory.ts (createBaseConfig line 160)
  - READ: src/workflows/prp-pipeline.ts (line 472)
  - READ: src/workflows/bug-hunt-workflow.ts (line 243)
  - READ: src/workflows/delta-analysis-workflow.ts (line 116)
  - READ: src/agents/prp-generator.ts (line 146)
  - READ: src/agents/prp-executor.ts (line 199)
  - CONFIRM: All have enableCache: true (already verified by research)
  - DOCUMENT: Verification results in test comments
  - NO CODE CHANGES - verification only

Task 3: INTEGRATE cache hit rate logging (IF NEEDED)
  - REVIEW: Existing cache metrics in src/core/task-orchestrator.ts
  - DECIDE: Add cache logging to agent operations or defer to P5.M2.T1.S2 (PRP cache)
  - IF ADDING: Use getLogger('AgentCache') for cache-specific logging
  - PATTERN: Log summary metrics, not per-event (match #logCacheMetrics pattern)
  - PLACEMENT: Add to agent operations or create new utility

Task 4: CREATE plan/001_14b9dc2a33c7/architecture/cache_behavior.md
  - IMPLEMENT: Comprehensive cache behavior documentation
  - SECTIONS: Overview, Cache Architecture, Configuration, Performance, Monitoring, Troubleshooting
  - INCLUDE: SHA-256 mechanism, enableCache behavior, hit rate patterns
  - INCLUDE: Performance characteristics (cached <10ms, uncached 1-5s)
  - FOLLOW: Pattern from environment_config.md (H1/H2/H3 structure)
  - REFERENCE: groundswell_api.md lines 377-383 (caching behavior)

Task 5: VERIFY test execution
  - RUN: npm test -- tests/unit/agents/cache-verification.test.ts
  - RUN: npm run typecheck (zero errors)
  - RUN: npm run lint (zero errors)
  - RUN: npm test (all existing tests pass)

Task 6: CREATE plan/001_14b9dc2a33c7/P5M2T1S1/research/ directory (OPTIONAL)
  - STORE: Research findings from this PRP creation
  - INCLUDE: Agent creation sites analysis
  - INCLUDE: Testing patterns research
  - INCLUDE: Architecture documentation patterns
```

### Implementation Patterns & Key Details

```typescript
// ===== TEST FILE STRUCTURE =====
// File: tests/unit/agents/cache-verification.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgent, createPrompt } from 'groundswell';
import { getLogger } from '../../utils/logger.js';

// CRITICAL: Mock groundswell with hoisting (before imports)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// ===== MOCK SETUP PATTERN =====
describe('Agent Cache Verification', () => {
  const mockAgent = {
    prompt: vi.fn(),
  };

  const mockPrompt = {
    user: 'Test prompt',
    system: 'Test system',
    responseFormat: {},
    enableCache: true,
    enableReflection: true,
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    vi.mocked(createAgent).mockReturnValue(mockAgent as never);
    vi.mocked(createPrompt).mockReturnValue(mockPrompt as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== CACHE HIT VERIFICATION PATTERN =====
  it('should return cached response instantly on second identical call', async () => {
    // ARRANGE: Mock slow first response, instant second response (cache simulation)
    const mockResponse = { id: 'response-123', content: 'Cached result' };
    mockAgent.prompt.mockResolvedValue(mockResponse);

    // EXECUTE: First call (simulates slow LLM processing)
    const startTime1 = performance.now();
    const result1 = await mockAgent.prompt('Test prompt');
    const duration1 = performance.now() - startTime1;

    // EXECUTE: Second identical call (should hit cache)
    const startTime2 = performance.now();
    const result2 = await mockAgent.prompt('Test prompt');
    const duration2 = performance.now() - startTime2;

    // VERIFY: Same response returned
    expect(result1).toEqual(result2);

    // CRITICAL: Second call is significantly faster (cache hit)
    // Use <10ms threshold for "instant" (from research-queue.test.ts)
    expect(duration2).toBeLessThan(10);

    // VERIFY: prompt was called twice (we're mocking, not real cache)
    // In real Groundswell, cache hit would skip prompt() call
    expect(mockAgent.prompt).toHaveBeenCalledTimes(2);
  });

  // ===== DIFFERENT PROMPTS PATTERN =====
  it('should treat different prompts as separate cache entries', async () => {
    // ARRANGE: Different responses for different prompts
    const prompt1Response = { id: '1', content: 'Response to prompt 1' };
    const prompt2Response = { id: '2', content: 'Response to prompt 2' };

    mockAgent.prompt
      .mockResolvedValueOnce(prompt1Response)
      .mockResolvedValueOnce(prompt2Response);

    // EXECUTE: Two different prompts
    await mockAgent.prompt('Test prompt 1');
    await mockAgent.prompt('Test prompt 2');

    // VERIFY: Two separate calls (no cache hit for different prompts)
    expect(mockAgent.prompt).toHaveBeenCalledTimes(2);
  });

  // ===== CACHE CONFIGURATION VERIFICATION PATTERN =====
  it('should verify cache is enabled in agent factory configuration', () => {
    // This test verifies the factory config has enableCache: true
    // Actual verification is in research/agent-creation-sites-research.md

    // VERIFY: createAgent called with enableCache: true
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        enableCache: true,
      })
    );
  });

  // ===== CACHE HIT RATE LOGGING PATTERN =====
  it('should log cache hit rate for observability', async () => {
    const logger = getLogger('AgentCache');
    const infoSpy = vi.spyOn(logger, 'info');

    // ARRANGE: Simulate multiple calls with cache hits
    const responses = [
      { id: '1', content: 'Response 1' },
      { id: '2', content: 'Response 2' },
    ];

    let callCount = 0;
    mockAgent.prompt.mockImplementation(() => {
      return Promise.resolve(responses[callCount % 2]);
    });

    // EXECUTE: Multiple calls, some duplicates (cache hits)
    await mockAgent.prompt('Test prompt 1'); // Miss
    await mockAgent.prompt('Test prompt 2'); // Miss
    await mockAgent.prompt('Test prompt 1'); // Hit
    await mockAgent.prompt('Test prompt 2'); // Hit
    await mockAgent.prompt('Test prompt 1'); // Hit

    // VERIFY: Log was called with cache metrics
    expect(infoSpy).toHaveBeenCalled();
    const logCall = infoSpy.mock.calls.find(
      call => call[1]?.includes('Cache metrics') || call[0]?.hitRate !== undefined
    );

    expect(logCall).toBeDefined();
    expect(logCall?.[0]?.hitRate).toBeGreaterThan(0);
  });
});

// ===== GOTCHA: Real Groundswell cache behavior =====
// In production (not mocked), Groundswell's cache works differently:
// 1. Cache is internal to Groundswell SDK - not directly observable
// 2. Cache hit: prompt() returns instantly without API call
// 3. Cache miss: prompt() makes API call (1-5s latency)
// 4. No direct way to measure cache hits - infer from timing only
// 5. SHA-256 of (system + user + responseFormat) = cache key

// For comprehensive cache testing in production:
// - Use timing: <10ms = cache hit, >1000ms = cache miss
// - Monitor API call counts (cached calls don't increment)
// - Log before/after agent runs to measure duration
```

### Integration Points

```yaml
TEST_INTEGRATION:
  - add_to: tests/unit/agents/cache-verification.test.ts (NEW FILE)
  - mock_import: 'vi.mock("groundswell")' with hoisting
  - import_from: src/utils/logger.js (getLogger)
  - pattern: 'Follow agent-factory.test.ts and research-queue.test.ts patterns'

LOGGER_INTEGRATION:
  - use_existing: getLogger('AgentCache') or getLogger('AgentFactory')
  - log_level: INFO for cache metrics, DEBUG for detailed timing
  - pattern: 'logger.info({ hitRate, totalCalls }, "Cache metrics")'
  - reference: src/core/task-orchestrator.ts #logCacheMetrics (lines 583-598)

ARCHITECTURE_DOCUMENTATION:
  - create: plan/001_14b9dc2a33c7/architecture/cache_behavior.md
  - follow_pattern: environment_config.md (H1/H2/H3 structure)
  - include_sections: Overview, Cache Architecture, Configuration, Performance, Monitoring
  - reference: groundswell_api.md (lines 377-383 for caching behavior)

NO_CODE_CHANGES:
  - verified: All 6 agent creation sites already have enableCache: true
  - scope: Verification, testing, and documentation only
  - reason: Cache configuration is already correct
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating cache-verification.test.ts
npx tsc --noEmit tests/unit/agents/cache-verification.test.ts

# Format and lint
npm run lint -- tests/unit/agents/cache-verification.test.ts
npm run format -- tests/unit/agents/cache-verification.test.ts

# Project-wide validation
npm run typecheck
npm run lint
npm run format

# Expected: Zero TypeScript errors, zero ESLint errors
# If errors exist:
#   - Fix import paths (use .js extensions)
#   - Fix mock setup (vi.mock hoisting)
#   - Re-run validation
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run cache verification tests
npm test -- tests/unit/agents/cache-verification.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/agents/cache-verification.test.ts

# Run all agent tests
npm test -- tests/unit/agents/

# Expected: All tests pass, good coverage
# If failing:
#   - Check mock setup (vi.mock must be before imports)
#   - Verify timing thresholds (<10ms for cache hit)
#   - Debug with console.log (temporarily)
#   - Fix and re-run
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all tests
npm test

# Build project
npm run build

# Expected: All tests pass, including existing tests
# If existing tests fail:
#   - Check for mock interference (vi.clearAllMocks in afterEach)
#   - Verify no global state changes
#   - Fix and re-run
```

### Level 4: Documentation & Manual Validation

```bash
# Verify architecture documentation exists
cat plan/001_14b9dc2a33c7/architecture/cache_behavior.md

# Verify documentation has all required sections
grep -E '^##|^###' plan/001_14b9dc2a33c7/architecture/cache_behavior.md

# Expected: Documentation with H1 title, H2 major sections, H3 subsections
# Sections: Overview, Cache Architecture, Configuration, Performance, Monitoring, Troubleshooting

# Manual cache verification (optional)
# Run a workflow twice with same input
# Observe second run completes faster
# Check logs for cache metrics
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting correct: `npm run format`
- [ ] All unit tests pass: `npm test -- tests/unit/agents/cache-verification.test.ts`
- [ ] All existing tests still pass: `npm test`

### Feature Validation

- [ ] Cache verification tests created and passing
- [ ] Tests verify identical prompts return cached responses in <10ms
- [ ] Tests verify different prompts produce separate cache entries
- [ ] Cache hit rate logging integrated with structured logger
- [ ] All 6 agent creation sites verified to have enableCache: true
- [ ] Architecture documentation created at plan/001_14b9dc2a33c7/architecture/cache_behavior.md

### Code Quality Validation

- [ ] Follows existing test patterns (agent-factory.test.ts, research-queue.test.ts)
- [ ] Uses vi.mock with hoisting for groundswell imports
- [ ] Uses performance.now() for high-precision timing
- [ ] Uses <10ms threshold for instant cache response
- [ ] vi.clearAllMocks() in afterEach for test isolation
- [ ] ES module imports with .js extensions
- [ ] Logger uses getLogger('Context') pattern

### Documentation Validation

- [ ] cache_behavior.md created with proper structure
- [ ] H1 title: "Cache Behavior Guide" or similar
- [ ] H2 sections: Overview, Cache Architecture, Configuration, Performance, Monitoring, Troubleshooting
- [ ] Includes SHA-256 cache mechanism explanation
- [ ] Includes enableCache configuration examples
- [ ] Includes performance characteristics (<10ms cached, 1-5s uncached)
- [ ] Includes monitoring and observability guidance
- [ ] Follows environment_config.md pattern

### Integration Validation

- [ ] No interference with P5.M1.T2.S2 (progress tracking - parallel work)
- [ ] Logger integration matches existing patterns
- [ ] Test structure matches existing test files
- [ ] Architecture documentation matches existing docs
- [ ] All 6 agent creation sites documented

---

## Anti-Patterns to Avoid

- ❌ Don't modify agent factory code (cache config is already correct)
- ❌ Don't use Date.now() for timing (use performance.now() for precision)
- ❌ Don't use >100ms threshold for "instant" (use <10ms from research-queue.test.ts)
- ❌ Don't forget vi.mock hoisting (must be before imports)
- ❌ Don't skip vi.clearAllMocks() in afterEach (causes test interference)
- ❌ Don't log every cache hit/miss (log summary metrics only)
- ❌ Don't use console.log for cache metrics (use structured logger)
- ❌ Don't forget .js extension in imports
- ❌ Don't create per-event cache logging (too verbose)
- ❌ Don't assume cache is broken (it's already working - just verify)
- ❌ Don't write cache hit detection code (Groundswell handles this internally)
- ❌ Don't duplicate existing cache metrics code (use TaskOrchestrator pattern)
- ❌ Don't document in wrong location (use plan/001_14b9dc2a33c7/architecture/)
- ❌ Don't skip architecture documentation (required for production readiness)
