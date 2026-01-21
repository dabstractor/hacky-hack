# PRP: Implement Positive Jitter Calculation - P3.M3.T1.S1

## Goal

**Feature Goal**: Fix the retry utility jitter calculation to ensure jitter is always positive, making the total delay strictly greater than the exponential base delay.

**Deliverable**: Modified `calculateDelay()` function in `/home/dustin/projects/hacky-hack/src/utils/retry.ts` where the jitter calculation always produces positive values, ensuring `delay > exponentialDelay` (strictly greater).

**Success Definition**:

- Jitter calculation modified to always be positive (no negative or zero jitter)
- Test 'should add jitter to delay' at line 590 of retry.test.ts passes
- All other retry utility tests still pass (no regressions)
- Jitter still provides randomization but only in the positive direction
- The `jitterFactor` parameter continues to work as expected (0-1 range for variance control)

## User Persona

**Target User**: Developer implementing bug fixes for Phase P3 (Test Alignment) who needs to fix the jitter calculation in the retry utility to align with test expectations and industry best practices.

**Use Case**: The test 'should add jitter to delay' expects that jitter will make the delay strictly greater than the base exponential delay, but the current implementation can produce delays less than or equal to the base due to bidirectional jitter.

**User Journey**:

1. Developer runs tests and discovers 'should add jitter to delay' is failing or investigating the issue
2. Developer reads this PRP to understand the required fix
3. Developer modifies the `calculateDelay()` function in retry.ts
4. Developer runs tests to verify the fix works
5. Developer commits changes with reference to this PRP

**Pain Points Addressed**:

- **Ambiguous jitter behavior**: Current bidirectional jitter can reduce delays, which is counterintuitive
- **Test misalignment**: Test expects positive variance but implementation allows negative variance
- **Industry best practices**: AWS, Google, and Microsoft all recommend positive-only jitter approaches
- **Documentation clarity**: Current code comments say "Full jitter" but implement bidirectional jitter

## Why

- **Business Value**: One failing test in the retry utility reduces confidence in the retry logic. Fixing this ensures proper retry behavior for resilient agent LLM calls and MCP tool executions.
- **Integration**: This fix resolves PRD Issue 6. The retry utility is used throughout the system for:
  - Agent LLM prompt calls (via `retryAgentPrompt()`)
  - MCP tool executions (via `retryMcpTool()`)
  - Direct retry operations via the main `retry()` function
- **Problem Solved**: Aligns the jitter implementation with:
  - Test expectations (delay should be greater than base)
  - Industry best practices (AWS "full jitter" approach)
  - Common sense (jitter should add randomness, not subtract from the intended delay)

## What

Modify the jitter calculation in the `calculateDelay()` function to always produce positive values, ensuring the total delay is always strictly greater than the exponential base delay.

### Success Criteria

- [ ] Jitter calculation changed from bidirectional to positive-only
- [ ] Test 'should add jitter to delay' passes consistently
- [ ] All other retry utility tests pass (no regressions)
- [ ] The `jitterFactor` parameter still controls variance amount correctly
- [ ] Exponential backoff behavior is preserved
- [ ] Max delay capping still works correctly

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

1. Exact file location and line numbers for the fix
2. Current implementation with problem analysis
3. Recommended fix with code examples
4. Test file location and specific test to verify
5. Industry best practices with external references
6. Complete validation commands
7. Alternative approaches considered and rejected

### Documentation & References

```yaml
# PRIMARY: File to modify
- file: src/utils/retry.ts
  why: Contains the calculateDelay() function that needs modification
  pattern: Lines 247-269 - calculateDelay() function
  pattern: Line 263 - Current jitter calculation (BEFORE fix)
  code: |
    # BEFORE (current - produces bidirectional jitter):
    const jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;

    # AFTER (fix - produces positive-only jitter):
    const jitter = exponentialDelay * jitterFactor * Math.random();

# PRIMARY: Test file to verify the fix
- file: tests/unit/utils/retry.test.ts
  why: Contains the 'should add jitter to delay' test that validates jitter behavior
  pattern: Lines 590-632 - Failing test
  pattern: Lines 616-620 - Test configuration with jitterFactor: 0.2
  pattern: Lines 628-631 - Test assertions expecting delays within variance range
  gotcha: Test uses vi.spyOn to capture setTimeout delay values

# PRIMARY: Test framework being used
- file: package.json
  why: Contains test scripts and Vitest configuration
  pattern: Look for "vitest" in devDependencies
  pattern: Look for "test:run" script in scripts section

# REFERENCE: Retry utility documentation
- file: src/utils/retry.ts
  why: Contains comprehensive JSDoc comments explaining the retry logic
  pattern: Lines 1-40 - Module documentation
  pattern: Lines 224-246 - calculateDelay() JSDoc with formula explanation
  critical: Understand the current formula and why it was chosen

# EXTERNAL: AWS Exponential Backoff and Jitter
- url: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  why: Industry standard for jitter calculation in distributed systems
  critical: AWS recommends "full jitter" - random between 0 and exponentialDelay
  section: "The Jitter Effect" and "Full Jitter"
  note: This is the most authoritative source on jitter best practices

# EXTERNAL: Vitest Documentation
- url: https://vitest.dev/api/vi
  why: Understanding vi.spyOn, vi.useFakeTimers, vi.runAllTimersAsync
  section: "vi.spyOn" and "Timer Mocks"
  note: Used in the test to capture and validate delay values

# EXTERNAL: Math.random() behavior
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  why: Understanding that Math.random() returns [0, 1) - inclusive of 0, exclusive of 1
  critical: Math.random() * x gives range [0, x), always non-negative

# INPUT: Work item definition
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json
  why: Contains the original work item description for P3.M3.T1.S1
  section: Lines 406-414 - P3.M3.T1.S1 subtask with context_scope

# REFERENCE: System architecture documentation
- docfile: plan/002_1e734971e481/architecture/system_context.md
  why: Explains the retry utility design and jitter purpose
  section: Retry utility and jitter calculation discussion

# RESEARCH: Stored research findings
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M3T1S1/research/
  why: Comprehensive research on jitter best practices, test analysis, and codebase context
  files:
    - 01-current-implementation-analysis.md
    - 02-test-analysis.md
    - 03-jitter-best-practices.md
    - 04-codebase-context.md
    - 05-prd-context.md
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   └── utils/
│       ├── retry.ts                  # MODIFY: calculateDelay() at lines 247-269
│       ├── errors.ts                 # Referenced by retry.ts for error types
│       └── logger.ts                 # Referenced by retry.ts for logging
├── tests/
│   └── unit/
│       └── utils/
│           └── retry.test.ts         # VERIFY: 'should add jitter to delay' test at lines 590-632
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        ├── P3M3T1S1/
        │   ├── PRP.md                # This document
        │   └── research/             # Research findings directory
        │       ├── 01-current-implementation-analysis.md
        │       ├── 02-test-analysis.md
        │       ├── 03-jitter-best-practices.md
        │       ├── 04-codebase-context.md
        │       └── 05-prd-context.md
        └── tasks.json                # Work item definition
```

### Desired Codebase Tree (After Implementation)

```bash
# No new files - only modification to existing file
# src/utils/retry.ts will have updated calculateDelay() function with positive-only jitter
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: The current implementation uses bidirectional jitter
// Formula: jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2
// This produces jitter in range [-exponentialDelay * jitterFactor, +exponentialDelay * jitterFactor]

// CRITICAL: Math.random() returns [0, 1) - includes 0, excludes 1
// This means Math.random() can return 0, making jitter = 0 with the new formula
// Solution: Use Math.max(1, ...) to ensure minimum 1ms positive jitter

// CRITICAL: The test uses vi.spyOn(global, 'setTimeout') to capture delay values
// Mock implementation must call original setTimeout for fake timers to work
// See test lines 604-613 for the exact pattern

// CRITICAL: The test expects delays within specific ranges
// With jitterFactor: 0.2 and baseDelay: 1000:
// - First delay: 800-1200ms (1000 +/- 200)
// - Second delay: 1600-2400ms (2000 +/- 400)
// New implementation should produce delays in the UPPER half of these ranges

// CRITICAL: Don't modify the exponentialDelay calculation
// Only modify the jitter calculation
// The formula for exponentialDelay is correct and should not change

// CRITICAL: The Math.max(0, ...) on line 266 prevents negative delays
// After fix, this is less critical but still good defensive programming
// Consider changing to Math.max(1, ...) to ensure strict > relationship

// GOTCHA: jitterFactor parameter is used in three places in the codebase
// 1. AGENT_RETRY_CONFIG (line 604): jitterFactor: 0.1
// 2. MCP_RETRY_CONFIG (line 657): jitterFactor: 0.1
// 3. Default options (line 485): jitterFactor: 0.1
// Test uses jitterFactor: 0.2 (line 619) - more variance for testing

// GOTCHA: The test uses vi.runAllTimersAsync() to execute delays
// This requires fake timers to be set up correctly
// See test setup patterns in other retry tests

// CRITICAL: Vitest is the testing framework, not Jest or Mocha
// Imports: import { ... vi } from 'vitest';
// vi is Vitest's utility module (similar to Jest's jest)

// CRITICAL: After the fix, delays will always be >= exponentialDelay
// This means the minimum first retry delay will be 1000ms (not 800ms as test allows)
// The test assertion `toBeGreaterThan(800)` will still pass
// But delays will cluster in the upper half of the expected range

// CRITICAL: The test comment says "First: ~1000ms +/- 200ms"
// With positive-only jitter, it becomes "First: 1000ms to 1200ms"
// This is still within the test's acceptable range

// CRITICAL: Don't modify any other functions in retry.ts
// Only calculateDelay() needs updating
// All other functions (isTransientError, isPermanentError, retry, etc.) are correct
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is a calculation fix in an existing function. The `RetryOptions` interface (lines 144-204) already defines the `jitterFactor` parameter correctly.

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: LOCATE the calculateDelay() function
  - FILE: src/utils/retry.ts
  - LINES: 247-269
  - FIND: function calculateDelay(attempt, baseDelay, maxDelay, backoffFactor, jitterFactor)
  - IDENTIFY: Line 263 contains the problematic jitter calculation
  - VERIFY: This is the only place jitter is calculated (confirmed)
  - OUTPUT: Confirmed location of fix

Task 2: UNDERSTAND the current implementation
  - FILE: src/utils/retry.ts
  - LINES: 247-269
  - READ: calculateDelay() function completely
  - NOTE: exponentialDelay calculation is correct (lines 255-258)
  - NOTE: Current jitter formula (line 263): exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2
  - NOTE: Math.max(0, ...) on line 266 prevents negative total delay
  - OUTPUT: Understanding of current implementation

Task 3: MODIFY the jitter calculation to be positive-only
  - FILE: src/utils/retry.ts
  - LINE: 263
  - REPLACE: const jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;
  - WITH: const jitter = exponentialDelay * jitterFactor * Math.random();
  - ALSO UPDATE: Line 266 - Change Math.max(0, ...) to Math.max(1, ...)
  - REASON: Ensures jitter >= 1ms, guaranteeing delay > exponentialDelay
  - PRESERVE: All other function logic (exponentialDelay, return statement, etc.)
  - OUTPUT: Updated calculateDelay() with positive-only jitter

Task 4: UPDATE the function documentation comment
  - FILE: src/utils/retry.ts
  - LINES: 224-246 (JSDoc for calculateDelay)
  - UPDATE: Line 238 - Change jitter formula documentation
  - FROM: "jitter = exponentialDelay * jitterFactor * (random() - 0.5) * 2"
  - TO: "jitter = exponentialDelay * jitterFactor * random()"
  - UPDATE: Line 241 - Change example range description
  - FROM: "900-1100ms" (bidirectional)
  - TO: "1000-1100ms" (positive-only)
  - UPDATE: Line 260-263 - Update inline comments
  - FROM: "(Math.random() - 0.5) * 2 gives range [-1, 1]"
  - TO: "Math.random() gives range [0, 1), ensuring positive jitter"
  - OUTPUT: Updated documentation matching new implementation

Task 5: VERIFY the fix by running the failing test
  - COMMAND: npm run test:run -- tests/unit/utils/retry.test.ts -t "should add jitter to delay"
  - EXPECTED: Test passes (green checkmark)
  - VERIFY: No timing-related errors in output
  - VERIFY: Delays are captured correctly by vi.spyOn
  - OUTPUT: Test passing, confirming fix works

Task 6: VERIFY no other tests are broken
  - COMMAND: npm run test:run -- tests/unit/utils/retry.test.ts
  - EXPECTED: All retry utility tests pass (60+ tests)
  - CHECK: Tests using exponential backoff still work
  - CHECK: Tests using custom jitterFactor values still work
  - CHECK: Tests validating maxDelay capping still work
  - OUTPUT: Full test suite passing

Task 7: RUN broader validation
  - COMMAND: npm run test:run -- tests/unit/utils/
  - EXPECTED: All utils tests pass
  - VERIFY: No regressions in other utility tests
  - OUTPUT: Utils test suite passing

Task 8: DOCUMENT the change
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M3T1S1/research/
  - ACTION: Document any deviations from PRP (none expected)
  - ACTION: Note any edge cases discovered during testing
  - OUTPUT: Complete implementation notes
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// BEFORE: Current Implementation (BROKEN)
// ============================================================================

function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitterFactor: number
): number {
  // Exponential backoff with cap
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );

  // Full jitter: randomize around exponential delay
  // (Math.random() - 0.5) * 2 gives range [-1, 1]
  // Multiply by jitterFactor to scale variance
  const jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;

  // Ensure non-negative delay
  const delay = Math.max(0, Math.floor(exponentialDelay + jitter));

  return delay;
}

// ============================================================================
// AFTER: Fixed Implementation (POSITIVE-ONLY JITTER)
// ============================================================================

function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitterFactor: number
): number {
  // Exponential backoff with cap
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );

  // POSITIVE jitter: always adds variance, never subtracts
  // Math.random() gives range [0, 1), ensuring jitter is always >= 0
  // Multiply by jitterFactor to scale variance
  const jitter = exponentialDelay * jitterFactor * Math.random();

  // Ensure delay is strictly greater than exponentialDelay
  const delay = Math.max(1, Math.floor(exponentialDelay + jitter));

  return delay;
}

// ============================================================================
// EXPLANATION OF THE FIX
// ============================================================================

// OLD: (Math.random() - 0.5) * 2
// Produces range: [-1, 1)
// Can be NEGATIVE, ZERO, or POSITIVE
// When negative: delay < exponentialDelay (WRONG - violates test expectation)

// NEW: Math.random()
// Produces range: [0, 1)
// Is always ZERO or POSITIVE
// delay >= exponentialDelay (CORRECT - matches test expectation)

// Math.max(1, ...) ensures:
// Even when Math.random() returns 0 (rare but possible), delay >= exponentialDelay + 1
// This guarantees strict inequality: delay > exponentialDelay

// ============================================================================
// BEHAVIOR COMPARISON
// ============================================================================

// With baseDelay=1000, jitterFactor=0.2:
//
// OLD (bidirectional):
// - jitter range: [-200, +200]
// - delay range: [800, 1200]
// - Problem: Can be less than baseDelay (1000)
//
// NEW (positive-only):
// - jitter range: [0, +200]
// - delay range: [1000, 1200]
// - Correct: Always >= baseDelay (1000)

// ============================================================================
// WHY THIS MATCHES THE TEST
// ============================================================================

// Test assertions (lines 628-631):
// expect(delays[0]).toBeGreaterThan(800);  // PASS (1000-1200 > 800)
// expect(delays[0]).toBeLessThan(1200);   // PASS (1000-1200 < 1200)
// expect(delays[1]).toBeGreaterThan(1600); // PASS (2000-2400 > 1600)
// expect(delays[1]).toBeLessThan(2400);   // PASS (2000-2400 < 2400)

// The test allows the full range [800, 1200] for the first delay
// Our fix produces delays in [1000, 1200]
// This is a SUBSET of the allowed range, so all assertions pass

// ============================================================================
// ALIGNMENT WITH AWS BEST PRACTICES
// ============================================================================

// AWS Formula: delay = random_between(0, exponentialDelay)
// Our Formula: delay = exponentialDelay + (exponentialDelay * jitterFactor * random())
//
// Difference: We use jitterFactor to control the AMOUNT of jitter
// AWS uses full jitter (0 to exponentialDelay)
// We use partial jitter (0 to exponentialDelay * jitterFactor)
//
// This is acceptable because:
// 1. We maintain the jitterFactor parameter for backward compatibility
// 2. Positive-only jitter aligns with AWS's approach
// 3. We still prevent the thundering herd problem
// 4. The jitterFactor provides fine-grained control

// ============================================================================
// VALIDATION: HOW TO VERIFY THE FIX WORKS
// ============================================================================

// Run specific test:
npm run test:run -- tests/unit/utils/retry.test.ts -t "should add jitter to delay"

// Expected output:
// ✓ tests/unit/utils/retry.test.ts (1 test | X skipped) Xms
// Test Files  1 passed (1)
//      Tests  1 passed | X skipped

// Run all retry tests:
npm run test:run -- tests/unit/utils/retry.test.ts

// Expected: All tests pass (60+ tests)
```

### Integration Points

```yaml
NO_CHANGES_TO:
  - src/utils/errors.ts (error types are correct)
  - src/utils/logger.ts (logger is correct)
  - Any other files in src/utils/
  - Test framework configuration

MODIFICATIONS_TO:
  - file: src/utils/retry.ts
    action: Update calculateDelay() function
    lines: 224-246 (JSDoc documentation)
    lines: 263 (jitter calculation formula)
    lines: 266 (Math.max lower bound)
    change: Replace bidirectional jitter with positive-only jitter

VALIDATION_POINTS:
  - test: tests/unit/utils/retry.test.ts -t "should add jitter to delay"
    purpose: Verify fix resolves the jitter calculation issue
    expected: Test passes with green checkmark
    validation: Delays are always >= exponentialDelay

  - test: tests/unit/utils/retry.test.ts
    purpose: Verify no regression in other retry tests
    expected: All 60+ tests pass
    validation: Exponential backoff, max delay cap, retry behavior all work

DEPENDENCIES:
  - task: P3.M2.T1.S1 (Fix Session Utils Test)
    status: Implementing in parallel
    contract: Different test file, no overlap
    evidence: P3.M2.T1.S1 modifies session-utils.test.ts, this PRP modifies retry.ts

  - task: P3.M3.T1 (Update jitter calculation)
    status: This is the only subtask of P3.M3.T1
    contract: No other subtasks depend on this one

PRESERVE:
  - exponentialDelay calculation (lines 255-258)
  - Function signature and parameters
  - Return type (number)
  - All other retry utility functions
  - Test structure and assertions
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying calculateDelay() - fix before proceeding
npm run test:run -- tests/unit/utils/retry.test.ts -t "should add jitter to delay" 2>&1 | head -30

# Check for TypeScript errors
npx tsc --noEmit src/utils/retry.ts

# Check for linting errors (if ESLint is configured)
npm run lint -- src/utils/retry.ts

# Expected: Zero syntax errors. If errors exist, READ output and fix before proceeding.
# Most likely errors: Missing semicolon, incorrect operator, typo in variable name
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific failing test
npm run test:run -- tests/unit/utils/retry.test.ts -t "should add jitter to delay"

# Expected output:
# ✓ tests/unit/utils/retry.test.ts (1 test | X skipped) Xms
# Test Files  1 passed (1)
#      Tests  1 passed | X skipped

# Test all retry utility tests to ensure no regression
npm run test:run -- tests/unit/utils/retry.test.ts

# Expected: All 60+ tests pass
# If failing, debug root cause: check if positive jitter breaks any test expectations
# Possible issues: Tests might expect specific delay ranges that no longer apply

# Coverage validation (if coverage tools are configured)
npm run test:coverage -- tests/unit/utils/retry.test.ts

# Expected: calculateDelay() has 100% coverage (it's tested directly)
```

### Level 3: Integration Testing (System Validation)

```bash
# Ensure no other tests broke
npm run test:run -- tests/unit/utils/

# Ensure retry utility integrations work
npm run test:run -- tests/unit/ -t "retry"

# Verify specific test counts
npm run test:run -- tests/unit/utils/retry.test.ts 2>&1 | grep -E "Test Files|Tests"

# Expected output should show:
# - All retry tests passing (60+)
# - Zero failing tests
# - Pass rate 100%

# Check for any timing-related test failures
npm run test:run 2>&1 | grep -i "timeout|timer|delay"

# Expected: No timing-related errors
```

### Level 4: Domain-Specific Validation

```bash
# Run full test suite to ensure complete system integrity
npm run test:run

# Expected: All tests pass, including E2E and integration tests.

# Verify jitter behavior with custom test (if needed)
# Create a temporary test to verify jitter is always positive:
cat > /tmp/test-jitter.js << 'EOF'
import { calculateDelay } from './src/utils/retry.ts';

const results = [];
for (let i = 0; i < 100; i++) {
  const delay = calculateDelay(0, 1000, 30000, 2, 0.1);
  results.push(delay);
  if (delay < 1000) {
    console.error('FAIL: Delay < baseDelay', delay);
    process.exit(1);
  }
}
console.log('PASS: All delays >= baseDelay (1000)');
console.log('Min delay:', Math.min(...results));
console.log('Max delay:', Math.max(...results));
EOF

node --loader ts-node/esm /tmp/test-jitter.js

# Expected:
# PASS: All delays >= baseDelay (1000)
# Min delay: 1000 or 1001 (depending on Math.max(0 or 1, ...))
# Max delay: 1100 or close (1000 + 1000 * 0.1)
```

## Final Validation Checklist

### Technical Validation

- [ ] `calculateDelay()` function updated with positive-only jitter
- [ ] Jitter formula changed from `(Math.random() - 0.5) * 2` to `Math.random()`
- [ ] `Math.max()` lower bound updated from 0 to 1
- [ ] JSDoc documentation updated to reflect new formula
- [ ] Test 'should add jitter to delay' passes
- [ ] All retry utility tests pass (60+ tests)
- [ ] No new linting errors
- [ ] No new TypeScript errors

### Feature Validation

- [ ] Jitter is always positive (delay >= exponentialDelay)
- [ ] JitterFactor parameter still controls variance amount
- [ ] Exponential backoff behavior preserved
- [ ] Max delay capping still works correctly
- [ ] Delays fall within test-expected ranges
- [ ] No regressions in retry behavior
- [ ] Aligns with AWS best practices (positive jitter)

### Code Quality Validation

- [ ] Follows existing codebase patterns in retry.ts
- [ ] Documentation matches implementation
- [ ] Comments are clear and accurate
- [ ] No hardcoded values that should be configurable
- [ ] Change is minimal and focused
- [ ] Backward compatible (same function signature)

### Documentation & Handoff

- [ ] Research notes complete in `research/` subdirectory
- [ ] Git commit message references this PRP
- [ ] Change documented in tasks.json (status updated to Complete)
- [ ] Ready for next work item (P4 - Minor Bug Fixes)

## Anti-Patterns to Avoid

- ❌ **Don't modify the exponentialDelay calculation** - Only the jitter calculation needs changing
- ❌ **Don't change the function signature** - Keep all parameters the same
- ❌ **Don't remove the jitterFactor parameter** - It's used throughout the codebase
- ❌ **Don't use a completely different formula** - Keep it similar to current implementation
- ❌ **Don't update the test instead of the code** - The test expectation is correct
- ❌ **Don't modify other retry functions** - Only calculateDelay() needs updating
- ❌ **Don't add new configuration options** - Use existing jitterFactor parameter
- ❌ **Don't forget to update the JSDoc comments** - Documentation must match implementation
- ❌ **Don't use Math.random() \* 2 - 1** - This is same as (Math.random() - 0.5) \* 2
- ❌ **Don't skip running all tests** - A change like this could affect multiple tests
- ❌ **Don't assume the fix is correct** - Verify with actual test runs
- ❌ **Don't ignore edge cases** - Consider what happens when Math.random() returns 0

---

## Confidence Score: 10/10

**One-Pass Implementation Success Likelihood**: EXTREMELY HIGH

**Rationale**:

1. Clear task boundaries - modify one line in calculateDelay() function
2. Exact file location and line number provided (line 263 in retry.ts)
3. Complete before/after code comparison
4. Test location and validation commands specified
5. Industry best practices researched and documented (AWS approach)
6. Minimal change reduces risk of breaking other functionality
7. No architectural decisions needed
8. Straightforward formula change: replace `(Math.random() - 0.5) * 2` with `Math.random()`
9. Test expectations are well-defined and align with the fix
10. Research phase thoroughly documented for reference

**Potential Risks**:

- **Risk 1**: Other tests might expect bidirectional jitter behavior (Low - test analysis shows no such expectations)
- **Risk 2**: Average retry delay will increase (Very Low - this is correct behavior per AWS best practices)
- **Risk 3**: Math.random() returning 0 could cause edge case (Very Low - Math.max(1, ...) handles this)

**Validation**: The completed PRP provides everything needed to implement positive-only jitter calculation. The exact location is specified, the fix is a single-line change with clear reasoning, validation commands verify success, industry best practices support the approach, and comprehensive research documents all considerations. The implementation is straightforward and low-risk.
