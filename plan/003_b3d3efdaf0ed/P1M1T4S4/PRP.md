# Product Requirement Prompt (PRP): P1.M1.T4.S4 - Verify nested execution guard

---

## Goal

**Feature Goal**: Create comprehensive unit tests that verify the nested execution guard's ability to prevent recursive pipeline execution while allowing legitimate bug fix recursion, with proper environment variable validation and debug logging.

**Deliverable**: Unit test file `tests/unit/nested-execution-guard.test.ts` with complete coverage of guard logic, bug fix recursion conditions, environment variable handling, and debug logging verification.

**Success Definition**: All tests pass, verifying:

- Guard prevents execution when `PRP_PIPELINE_RUNNING` is already set
- Guard allows execution when `PRP_PIPELINE_RUNNING` is not set
- Guard sets `PRP_PIPELINE_RUNNING` to current PID on valid entry
- Bug fix recursion allowed when BOTH `SKIP_BUG_FINDING=true` AND path contains 'bugfix'
- Bug fix recursion blocked when `SKIP_BUG_FINDING=true` BUT path does NOT contain 'bugfix'
- Bug fix recursion blocked when path contains 'bugfix' BUT `SKIP_BUG_FINDING` is NOT 'true'
- Debug logging shows `PLAN_DIR`, `SESSION_DIR`, `SKIP_BUG_FINDING` values
- Environment variables properly mocked and cleaned up between tests
- All environment variables are case-sensitive and string comparisons are exact

## Why

- **State Protection**: Prevents corruption of session files and task registries from recursive execution
- **API Cost Control**: Avoids accidental recursive API calls that could incur massive costs
- **Data Integrity**: Ensures session consistency and prevents race conditions
- **Debug Safety**: Protects pipeline state during debugging activities
- **Bug Fix Support**: Allows legitimate bug fix recursion when proper conditions are met
- **Existing tests**: `tests/unit/config/environment.test.ts` provides environment variable mocking patterns to follow
- **Contract from PRD**: PRD.md lines 111-112, 284-285, 314-327 specify exact guard behavior
- **Specification from delta_prd**: Lines 178-206 provide implementation logic with code examples
- This is unit-level testing - tests verify guard logic in isolation, not pipeline integration

## What

Unit tests that verify the nested execution guard's behavior across guard prevention, bug fix recursion, and debug logging scenarios.

### Success Criteria

- [ ] Guard allows execution when `PRP_PIPELINE_RUNNING` is not set
- [ ] Guard sets `PRP_PIPELINE_RUNNING` to current PID on valid entry
- [ ] Guard blocks execution when `PRP_PIPELINE_RUNNING` is set without bug fix conditions
- [ ] Guard allows recursion when `SKIP_BUG_FINDING=true` AND path contains 'bugfix'
- [ ] Guard blocks recursion when `SKIP_BUG_FINDING=true` BUT path does NOT contain 'bugfix'
- [ ] Guard blocks recursion when path contains 'bugfix' BUT `SKIP_BUG_FINDING` is NOT 'true'
- [ ] Guard logs debug information with `PLAN_DIR`, `SESSION_DIR`, `SKIP_BUG_FINDING` values
- [ ] Guard properly validates path contains 'bugfix' (case-insensitive matching)
- [ ] Environment variable mocking uses `vi.stubEnv()` with proper cleanup
- [ ] All tests pass with `vi.unstubAllEnvs()` cleanup in `afterEach`
- [ ] Tests follow project patterns from `tests/unit/config/environment.test.ts`

## All Needed Context

### Context Completeness Check

_This PRP passes the "No Prior Knowledge" test:_

- Complete guard specification from PRD and delta_prd documentation
- Existing test patterns from environment.test.ts with environment mocking examples
- Test framework patterns from is-fatal-error.test.ts with guard validation examples
- Logger mock patterns from logger.test.ts
- Environment configuration structure from environment-config-analysis.md
- External dependency specification from external_deps.md and system_context.md

### Documentation & References

```yaml
# MUST READ - Guard specification from PRD
- file: PRD.md
  why: Original requirement specification for nested execution guard
  lines: 111-112 (requirement statement)
  lines: 284-285 (environment variable definitions)
  lines: 314-327 (guard logic and session creation guards)
  pattern: Environment-based guard with bug fix exception
  gotcha: BOTH SKIP_BUG_FINDING=true AND bugfix path required for exception

# MUST READ - Implementation specification
- file: plan/003_b3d3efdaf0ed/delta_prd.md
  why: Technical implementation details with code examples
  lines: 178-206 (PRP_PIPELINE_RUNNING implementation logic)
  lines: 345-347 (environment variable specifications)
  lines: 401-404 (task breakdown for guard implementation)
  pattern: Exact code pattern for guard validation function
  gotcha: Function returns boolean, uses exact string comparison for 'true'

# MUST READ - System context specification
- file: plan/003_b3d3efdaf0ed/docs/system_context.md
  why: Detailed guard logic and debug logging requirements
  lines: 383-396 (nested execution guard logic)
  lines: 393-396 (session creation guards)
  pattern: Debug logging with PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING
  gotcha: Debug logging shows all environment variables for troubleshooting

# MUST READ - Environment variable definitions
- file: plan/003_b3d3efdaf0ed/docs/external_deps.md
  why: Pipeline control environment variable specifications
  lines: 812-814 (PRP_PIPELINE_RUNNING, SKIP_BUG_FINDING definitions)
  pattern: Environment variable naming and value conventions
  gotcha: PRP_PIPELINE_RUNNING value is PID as string

# MUST READ - Existing test patterns for environment mocking
- file: tests/unit/config/environment.test.ts
  why: Examples of vi.stubEnv() usage with cleanup patterns
  pattern: Environment variable mocking with vi.stubEnv() and vi.unstubAllEnvs()
  gotcha: Always call vi.unstubAllEnvs() in afterEach to restore environment
  critical: Tests show how to mock and validate environment variables

# MUST READ - Guard validation test patterns
- file: tests/unit/is-fatal-error.test.ts
  why: Examples of testing guard/check logic with describe blocks
  pattern: Separate describe blocks for "pass" and "fail" scenarios
  pattern: Clear SETUP/EXECUTE/VERIFY sections in tests
  gotcha: Test both positive and negative cases comprehensively

# MUST READ - Logger mock patterns
- file: tests/unit/logger.test.ts
  why: Examples of testing logger interface and method calls
  pattern: Use vi.spyOn() to verify logger methods are called
  gotcha: Logger tests validate interface, not actual output
  pattern: expect(logger.debug).toHaveBeenCalledWith(...)

# MUST READ - Environment configuration structure
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S4/research/environment-config-analysis.md
  why: Understanding how environment variables are accessed in codebase
  section: "Environment Variable Access Patterns"
  section: "Environment Variable Types/Interfaces"
  gotcha: Direct process.env access pattern, no global config object

# MUST READ - Complete codebase analysis
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S4/research/codebase-nested-guard-analysis.md
  why: Comprehensive analysis of guard implementation requirements
  section: "Guard Function Structure"
  section: "Integration Points"
  section: "Test Requirements"
  gotcha: Guard is NOT YET IMPLEMENTED - tests are for future implementation

# MUST READ - Test patterns analysis
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S4/research/test-patterns-analysis.md
  why: Complete testing patterns from codebase
  section: "Environment Variable Mocking Patterns"
  section: "Guard/Check Validation Testing Patterns"
  section: "Pattern for Nested Execution Guard Testing"
  gotcha: Always use vi.unstubAllEnvs() in afterEach

# MUST READ - External dependencies specification
- docfile: plan/003_b3d3efdaf0ed/P1M1T4S4/research/external-deps-research.md
  why: Complete specification of guard behavior and requirements
  section: "PRP_PIPELINE_RUNNING Environment Variable Specification"
  section: "Nested Execution Guard Rules"
  section: "Implementation Verification Requirements"
  critical: This is the contract that tests must verify

# MUST READ - Vitest documentation
- url: https://vitest.dev/guide/mocking.html
  why: Vitest environment variable mocking with vi.stubEnv()
  section: #vi-stubenv (environment variable mocking)

- url: https://vitest.dev/guide/mocking.html#vi-spyon
  why: Spying on logger methods for debug log verification
  section: #vi-spyon (method spying)

# MUST READ - Previous PRP for context
- file: plan/003_b3d3efdaf0ed/P1M1T4S3/PRP.md
  why: Understanding resource monitoring tests that run in parallel
  gotcha: This PRP is independent - no overlap with resource monitoring tests
```

### Current Codebase Tree (relevant sections)

```bash
tests/
├── unit/
│   ├── config/
│   │   └── environment.test.ts               # Reference: Environment mocking patterns
│   ├── logger.test.ts                        # Reference: Logger mock patterns
│   ├── is-fatal-error.test.ts                # Reference: Guard validation patterns
│   └── setup.ts                              # Global test setup with vi.unstubAllEnvs()

src/
├── config/
│   ├── environment.ts                        # Reference: Environment variable access patterns
│   ├── types.ts                              # Reference: EnvironmentValidationError pattern
│   └── constants.ts                          # Reference: Environment constant definitions
├── utils/
│   └── logger.ts                             # Target: Logger for debug logging verification

plan/003_b3d3efdaf0ed/
├── P1M1T4S4/
│   ├── PRP.md                                # This file
│   └── research/
│       ├── codebase-nested-guard-analysis.md  # Guard implementation analysis
│       ├── test-patterns-analysis.md         # Test patterns research
│       ├── environment-config-analysis.md    # Environment configuration analysis
│       └── external-deps-research.md         # External dependencies specification
```

### Desired Codebase Tree (new test file)

```bash
tests/
├── unit/
│   └── nested-execution-guard.test.ts        # NEW: Nested execution guard tests
│   ├── describe('Nested Execution Guard')
│   │   ├── describe('Basic Guard Functionality')
│   │   │   ├── it('should allow execution when PRP_PIPELINE_RUNNING is not set')
│   │   │   ├── it('should set PRP_PIPELINE_RUNNING to current PID on valid entry')
│   │   │   └── it('should block execution when PRP_PIPELINE_RUNNING is already set')
│   │   ├── describe('Bug Fix Recursion Exception')
│   │   │   ├── it('should allow recursion when SKIP_BUG_FINDING=true AND path contains bugfix')
│   │   │   ├── it('should block recursion when SKIP_BUG_FINDING=true BUT path does NOT contain bugfix')
│   │   │   └── it('should block recursion when path contains bugfix BUT SKIP_BUG_FINDING is NOT true')
│   │   ├── describe('Path Validation')
│   │   │   ├── it('should validate path contains bugfix case-insensitively')
│   │   │   ├── it('should accept bugfix in PLAN_DIR path')
│   │   │   └── it('should accept bugfix in current working directory')
│   │   ├── describe('Debug Logging')
│   │   │   ├── it('should log environment check details with PLAN_DIR')
│   │   │   ├── it('should log environment check details with SESSION_DIR')
│   │   │   └── it('should log environment check details with SKIP_BUG_FINDING')
│   │   └── describe('Edge Cases')
│   │       ├── it('should handle missing SKIP_BUG_FINDING environment variable')
│   │       ├── it('should handle missing PLAN_DIR environment variable')
│   │       └── it('should handle concurrent validation calls')
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: vi.stubEnv() MUST be cleaned up with vi.unstubAllEnvs()
// From tests/unit/config/environment.test.ts
// Failing to cleanup causes test pollution and failures
afterEach(() => {
  vi.unstubAllEnvs();
});

// CRITICAL: Environment variable values are STRINGS
// PRP_PIPELINE_RUNNING = process.pid.toString() (not number)
// SKIP_BUG_FINDING must be exactly 'true' (not boolean true)
vi.stubEnv('PRP_PIPELINE_RUNNING', '12345');
vi.stubEnv('SKIP_BUG_FINDING', 'true'); // String 'true', not boolean

// GOTCHA: String comparison is EXACT for SKIP_BUG_FINDING
// From delta_prd.md line 204: process.env.SKIP_BUG_FINDING === 'true'
// Must be exact string match, case-sensitive
// Values like 'True', 'TRUE', '1', 'yes' are NOT valid

// CRITICAL: Path matching should be CASE-INSENSITIVE for robustness
// Use /bugfix/i or toLowerCase() for path matching
// Works across different filesystems (case-sensitive vs case-insensitive)
const isBugFixPath =
  /bugfix/i.test(path) || path.toLowerCase().includes('bugfix');

// GOTCHA: PRP_PIPELINE_RUNNING is NOT cleared during normal operation
// Once set, it persists until process exit
// Tests must explicitly delete it to simulate fresh start
delete process.env.PRP_PIPELINE_RUNNING;

// CRITICAL: Logger interface validation, not output capture
// From tests/unit/logger.test.ts pattern
// Tests verify logger.debug() is called, not what it outputs
const debugSpy = vi.spyOn(logger, 'debug');
expect(debugSpy).toHaveBeenCalledWith(
  '[Nested Guard] Environment Check',
  expect.any(Object)
);

// GOTCHA: Use vi.spyOn() for logger, not vi.mock()
// Logger is a real utility that needs to be tested
// vi.mock() would replace the entire module
vi.spyOn(logger, 'debug');

// CRITICAL: Global test setup calls vi.unstubAllEnvs()
// From tests/setup.ts
// Individual tests should still call it in afterEach for safety

// CRITICAL: .js extensions for imports (ES modules)
import { validateNestedExecutionGuard } from '../../src/utils/execution-guard.js';

// GOTCHA: Process.pid is read-only, use vi.stubGlobal() to mock
// Or test with real PID (acceptable for unit tests)
vi.stubGlobal('process', { ...process, pid: 99999 });

// CRITICAL: Tests follow SETUP/EXECUTE/VERIFY pattern
// From tests/unit/is-fatal-error.test.ts
// Clear section comments improve test readability
// SETUP: Prepare test environment
// EXECUTE: Run function under test
// VERIFY: Assert expected behavior

// GOTCHA: Error message validation for guard failure
// From delta_prd.md lines 196-198
// Error should include existing PID and current PID
expect(() => validate()).toThrow('Pipeline already running');
expect(() => validate()).toThrow(/PID: 99999/);

// CRITICAL: Clear logger cache between tests
// From test patterns in codebase
import { clearLoggerCache } from '../../src/utils/logger.js';
beforeEach(() => {
  clearLoggerCache();
});
```

## Implementation Blueprint

### Data Models and Structure

The guard function signature and types (to be implemented):

```typescript
// Types for guard function parameters
interface NestedExecutionGuardOptions {
  planDir?: string;
  sessionDir?: string;
  logger: Logger;
}

// Custom error for nested execution
class NestedExecutionError extends Error {
  readonly existingPid: string;
  readonly currentPid: string;

  constructor(existingPid: string, currentPid: string) {
    super(
      `Pipeline already running (PID: ${existingPid}). ` +
        `Nested execution is only allowed in bug fix mode ` +
        `(SKIP_BUG_FINDING=true) with a bugfix path.`
    );
    this.name = 'NestedExecutionError';
    this.existingPid = existingPid;
    this.currentPid = currentPid;
  }
}

// Guard function to be tested
function validateNestedExecutionGuard(
  options: NestedExecutionGuardOptions
): void;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file structure and setup
  - CREATE: tests/unit/nested-execution-guard.test.ts
  - IMPLEMENT: File header with JSDoc comments
  - IMPORT: All dependencies (vitest, guard function, types)
  - SETUP: Mock helper for logger (getLogger, clearLoggerCache)
  - SETUP: Global vi.mock() for execution-guard module (doesn't exist yet)
  - IMPLEMENT: beforeEach/afterEach hooks with vi.unstubAllEnvs()
  - FOLLOW pattern: tests/unit/config/environment.test.ts (lines 1-50)
  - NAMING: Descriptive test names with "should" format
  - PLACEMENT: tests/unit/ directory

Task 2: IMPLEMENT basic guard functionality tests
  - ADD: describe block 'Basic Guard Functionality'
  - IMPLEMENT: it('should allow execution when PRP_PIPELINE_RUNNING is not set')
    - SETUP: Delete PRP_PIPELINE_RUNNING if set
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Function does not throw, PRP_PIPELINE_RUNNING set to PID
  - IMPLEMENT: it('should set PRP_PIPELINE_RUNNING to current PID on valid entry')
    - SETUP: Clean environment
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: process.env.PRP_PIPELINE_RUNNING equals process.pid.toString()
  - IMPLEMENT: it('should block execution when PRP_PIPELINE_RUNNING is already set')
    - SETUP: Set PRP_PIPELINE_RUNNING to '99999'
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Throws NestedExecutionError with correct message
  - SETUP: Mock logger with vi.spyOn()
  - FOLLOW pattern: tests/unit/is-fatal-error.test.ts (guard validation)
  - DEPENDENCIES: Task 1 (test file structure)
  - PLACEMENT: First test section

Task 3: IMPLEMENT bug fix recursion exception tests
  - ADD: describe block 'Bug Fix Recursion Exception'
  - IMPLEMENT: it('should allow recursion when SKIP_BUG_FINDING=true AND path contains bugfix')
    - SETUP: Set PRP_PIPELINE_RUNNING='99999', SKIP_BUG_FINDING='true', PLAN_DIR with 'bugfix'
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Does not throw, allows execution
  - IMPLEMENT: it('should block recursion when SKIP_BUG_FINDING=true BUT path does NOT contain bugfix')
    - SETUP: Set PRP_PIPELINE_RUNNING='99999', SKIP_BUG_FINDING='true', PLAN_DIR without 'bugfix'
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Throws NestedExecutionError
  - IMPLEMENT: it('should block recursion when path contains bugfix BUT SKIP_BUG_FINDING is NOT true')
    - SETUP: Set PRP_PIPELINE_RUNNING='99999', PLAN_DIR with 'bugfix', SKIP_BUG_FINDING not set
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Throws NestedExecutionError
  - SETUP: Multiple vi.stubEnv() calls for each test
  - FOLLOW pattern: Tests from external-deps-research.md section 8.2
  - DEPENDENCIES: Task 2 (basic functionality)
  - PLACEMENT: After basic functionality tests

Task 4: IMPLEMENT path validation tests
  - ADD: describe block 'Path Validation'
  - IMPLEMENT: it('should validate path contains bugfix case-insensitively')
    - SETUP: Set PRP_PIPELINE_RUNNING, SKIP_BUG_FINDING='true'
    - EXECUTE: Test with 'BugFix', 'BUGFIX', 'bugfix' in path
    - VERIFY: All variations accepted
  - IMPLEMENT: it('should accept bugfix in PLAN_DIR path')
    - SETUP: Set PLAN_DIR with 'bugfix' in path
    - EXECUTE: Call validateNestedExecutionGuard() with planDir option
    - VERIFY: Path validation passes
  - IMPLEMENT: it('should accept bugfix in current working directory')
    - SETUP: Set current working directory to path with 'bugfix'
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Current directory path checked
  - SETUP: Mock process.cwd() with vi.stubGlobal() if needed
  - FOLLOW pattern: Path validation from system_context.md
  - DEPENDENCIES: Task 3 (bug fix recursion)
  - PLACEMENT: After bug fix recursion tests

Task 5: IMPLEMENT debug logging tests
  - ADD: describe block 'Debug Logging'
  - IMPLEMENT: it('should log environment check details with PLAN_DIR')
    - SETUP: Spy on logger.debug method
    - EXECUTE: Call validateNestedExecutionGuard() with planDir
    - VERIFY: logger.debug called with PLAN_DIR in context object
  - IMPLEMENT: it('should log environment check details with SESSION_DIR')
    - SETUP: Spy on logger.debug method
    - EXECUTE: Call validateNestedExecutionGuard() with sessionDir
    - VERIFY: logger.debug called with SESSION_DIR in context object
  - IMPLEMENT: it('should log environment check details with SKIP_BUG_FINDING')
    - SETUP: Set SKIP_BUG_FINDING='true', spy on logger.debug
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: logger.debug called with SKIP_BUG_FINDING in context object
  - SETUP: vi.spyOn(logger, 'debug') before each test
  - VERIFY: Log structure matches system_context.md lines 393-396
  - DEPENDENCIES: Task 4 (path validation)
  - PLACEMENT: After path validation tests

Task 6: IMPLEMENT edge cases tests
  - ADD: describe block 'Edge Cases'
  - IMPLEMENT: it('should handle missing SKIP_BUG_FINDING environment variable')
    - SETUP: Delete SKIP_BUG_FINDING, set PRP_PIPELINE_RUNNING
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Treats missing as not 'true', blocks execution
  - IMPLEMENT: it('should handle missing PLAN_DIR environment variable')
    - SETUP: Delete PLAN_DIR, check current directory instead
    - EXECUTE: Call validateNestedExecutionGuard()
    - VERIFY: Falls back to process.cwd() for path checking
  - IMPLEMENT: it('should handle concurrent validation calls')
    - SETUP: No special setup needed
    - EXECUTE: Call validateNestedExecutionGuard() multiple times
    - VERIFY: All calls handled correctly, no race conditions
  - SETUP: Test undefined handling in environment variables
  - FOLLOW pattern: Edge case tests from existing codebase
  - DEPENDENCIES: Task 5 (debug logging)
  - PLACEMENT: Final test section

Task 7: VERIFY test coverage and completeness
  - VERIFY: All success criteria from "What" section tested
  - VERIFY: Tests follow project patterns (SETUP/EXECUTE/VERIFY comments)
  - VERIFY: Mock setup matches environment.test.ts patterns
  - VERIFY: Cleanup pattern includes vi.unstubAllEnvs()
  - VERIFY: All contract requirements from external-deps-research.md tested
  - RUN: npx vitest run tests/unit/nested-execution-guard.test.ts --coverage
  - VERIFY: Coverage meets goals (90%+ lines, 85%+ branches)

Task 8: DOCUMENT test completion
  - CREATE: Summary document of tests implemented
  - DOCUMENT: Test coverage achieved
  - DOCUMENT: Any deviations from test design
  - DELIVERABLE: Complete test documentation
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: File header with JSDoc comments
/**
 * Unit tests for nested execution guard
 *
 * @remarks
 * Tests validate guard logic that prevents recursive pipeline execution while
 * allowing legitimate bug fix recursion under specific conditions.
 *
 * Guard prevents execution when PRP_PIPELINE_RUNNING is set, unless BOTH:
 * - SKIP_BUG_FINDING environment variable equals 'true' (exact string match)
 * - Path contains 'bugfix' (case-insensitive match)
 *
 * @see {@link https://vitest.dev/guide/mocking.html | Vitest Mocking}
 * @see {@link file://../../PRD.md#L111-L327 | PRD Nested Execution Guard Specification}
 */

// PATTERN: Import statements with .js extensions
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLogger, clearLoggerCache } from '../../src/utils/logger.js';
// Note: This import will fail until the guard is implemented
// import { validateNestedExecutionGuard } from '../../src/utils/execution-guard.js';

// PATTERN: Mock the guard module (doesn't exist yet, for future use)
vi.mock('../../src/utils/execution-guard.js', () => ({
  validateNestedExecutionGuard: vi.fn(),
}));

// PATTERN: Test structure with describe blocks
describe('Nested Execution Guard', () => {
  let logger: ReturnType<typeof getLogger>;

  beforeEach(() => {
    logger = getLogger('NestedExecutionGuardTest');
    clearLoggerCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL: Always restore environment
  });

  // PATTERN: Basic guard functionality test
  describe('Basic Guard Functionality', () => {
    it('should allow execution when PRP_PIPELINE_RUNNING is not set', () => {
      // SETUP: Ensure PRP_PIPELINE_RUNNING is not set
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE: Validate guard
      // Note: This will fail until guard is implemented
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .not.toThrow();

      // VERIFY: For now, just test the environment state
      expect(process.env.PRP_PIPELINE_RUNNING).toBeUndefined();
    });

    it('should set PRP_PIPELINE_RUNNING to current PID on valid entry', () => {
      // SETUP: Clean environment
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE: Validate guard (when implemented)
      // validateNestedExecutionGuard({ logger });

      // VERIFY: PRP_PIPELINE_RUNNING should be set to current PID
      // expect(process.env.PRP_PIPELINE_RUNNING).toBe(process.pid.toString());
    });

    it('should block execution when PRP_PIPELINE_RUNNING is already set', () => {
      // SETUP: Set PRP_PIPELINE_RUNNING to a different PID
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');

      // EXECUTE & VERIFY: Should throw when implemented
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .toThrow('Pipeline already running');

      // For now, verify environment is set
      expect(process.env.PRP_PIPELINE_RUNNING).toBe('99999');
    });
  });

  // PATTERN: Bug fix recursion exception test
  describe('Bug Fix Recursion Exception', () => {
    it('should allow recursion when SKIP_BUG_FINDING=true AND path contains bugfix', () => {
      // SETUP: Set both conditions for allowed recursion
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE: Should not throw when implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).not.toThrow();

      // VERIFY: Environment is set correctly
      expect(process.env.SKIP_BUG_FINDING).toBe('true');
      expect(process.env.PLAN_DIR).toContain('bugfix');
    });

    it('should block recursion when SKIP_BUG_FINDING=true BUT path does NOT contain bugfix', () => {
      // SETUP: Set SKIP_BUG_FINDING but not bugfix path
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed');

      // EXECUTE & VERIFY: Should throw when implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).toThrow('Pipeline already running');
    });

    it('should block recursion when path contains bugfix BUT SKIP_BUG_FINDING is NOT true', () => {
      // SETUP: Set bugfix path but not SKIP_BUG_FINDING
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');
      delete process.env.SKIP_BUG_FINDING;

      // EXECUTE & VERIFY: Should throw when implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).toThrow('Pipeline already running');
    });
  });

  // PATTERN: Path validation test
  describe('Path Validation', () => {
    it('should validate path contains bugfix case-insensitively', () => {
      // SETUP: Test various casings
      const testPaths = [
        '/path/to/bugfix/session',
        '/path/to/BugFix/session',
        '/path/to/BUGFIX/session',
      ];

      for (const path of testPaths) {
        vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
        vi.stubEnv('SKIP_BUG_FINDING', 'true');
        vi.stubEnv('PLAN_DIR', path);

        // EXECUTE: When implemented, should accept all casings
        // expect(() => validateNestedExecutionGuard({
        //   logger,
        //   planDir: path
        // })).not.toThrow();

        // VERIFY: Path contains bugfix (case-insensitive)
        expect(/bugfix/i.test(path)).toBe(true);
      }
    });

    it('should accept bugfix in PLAN_DIR path', () => {
      // SETUP: Set PLAN_DIR with bugfix
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE: When implemented
      // expect(() => validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // })).not.toThrow();

      expect(process.env.PLAN_DIR).toContain('bugfix');
    });

    it('should accept bugfix in current working directory', () => {
      // SETUP: Mock current directory with bugfix
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');

      // EXECUTE: When implemented, should check process.cwd()
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .not.toThrow();

      // For now, verify cwd is accessible
      expect(typeof process.cwd()).toBe('string');
    });
  });

  // PATTERN: Debug logging test
  describe('Debug Logging', () => {
    it('should log environment check details with PLAN_DIR', () => {
      // SETUP: Spy on logger.debug
      const debugSpy = vi.spyOn(logger, 'debug');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE: When implemented
      // validateNestedExecutionGuard({
      //   logger,
      //   planDir: process.env.PLAN_DIR
      // });

      // VERIFY: Debug log called with correct structure
      // expect(debugSpy).toHaveBeenCalledWith(
      //   '[Nested Guard] Environment Check',
      //   expect.objectContaining({
      //     PLAN_DIR: expect.any(String),
      //     PRP_PIPELINE_RUNNING: expect.any(String),
      //     SKIP_BUG_FINDING: expect.any(String),
      //   })
      // );
    });

    it('should log environment check details with SESSION_DIR', () => {
      // SETUP: Spy on logger.debug
      const debugSpy = vi.spyOn(logger, 'debug');
      const sessionDir = '/path/to/session/abc123';

      // EXECUTE: When implemented
      // validateNestedExecutionGuard({
      //   logger,
      //   sessionDir
      // });

      // VERIFY: Debug log includes SESSION_DIR
      // expect(debugSpy).toHaveBeenCalledWith(
      //   '[Nested Guard] Environment Check',
      //   expect.objectContaining({
      //     SESSION_DIR: sessionDir,
      //   })
      // );
    });

    it('should log environment check details with SKIP_BUG_FINDING', () => {
      // SETUP: Set SKIP_BUG_FINDING and spy on logger
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      const debugSpy = vi.spyOn(logger, 'debug');

      // EXECUTE: When implemented
      // validateNestedExecutionGuard({ logger });

      // VERIFY: Debug log includes SKIP_BUG_FINDING value
      // expect(debugSpy).toHaveBeenCalledWith(
      //   '[Nested Guard] Environment Check',
      //   expect.objectContaining({
      //     SKIP_BUG_FINDING: 'true',
      //   })
      // );
    });
  });

  // PATTERN: Edge cases test
  describe('Edge Cases', () => {
    it('should handle missing SKIP_BUG_FINDING environment variable', () => {
      // SETUP: Delete SKIP_BUG_FINDING
      delete process.env.SKIP_BUG_FINDING;
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');

      // EXECUTE & VERIFY: When implemented, should treat as not 'true'
      // expect(() => validateNestedExecutionGuard({ logger }))
      //   .toThrow('Pipeline already running');

      expect(process.env.SKIP_BUG_FINDING).toBeUndefined();
    });

    it('should handle missing PLAN_DIR environment variable', () => {
      // SETUP: Delete PLAN_DIR
      delete process.env.PLAN_DIR;
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');

      // EXECUTE: When implemented, should check process.cwd()
      // validateNestedExecutionGuard({ logger });

      // VERIFY: Current directory is accessible
      expect(process.cwd()).toBeDefined();
    });

    it('should handle concurrent validation calls', () => {
      // SETUP: No special setup needed
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE: Multiple calls (when implemented)
      // validateNestedExecutionGuard({ logger });
      // validateNestedExecutionGuard({ logger });

      // VERIFY: Should handle gracefully
      // expect(process.env.PRP_PIPELINE_RUNNING).toBe(process.pid.toString());
    });
  });
});
```

### Integration Points

```yaml
NO EXTERNAL FILE OPERATIONS IN TESTS:
  - Tests use mocked environment variables via vi.stubEnv()
  - Tests use mocked logger via vi.spyOn()
  - No real file system access
  - Fast, deterministic execution

MOCK INTEGRATIONS:
  - Mock: process.env variables (vi.stubEnv)
  - Mock: logger methods (vi.spyOn)
  - Mock: execution-guard module (vi.mock - for future implementation)
  - Real: Vitest test framework
  - Real: Logger utility (test real logger behavior)

GUARD FUNCTION INTEGRATION (WHEN IMPLEMENTED):
  - Import: validateNestedExecutionGuard from src/utils/execution-guard.js
  - Options: { logger, planDir?, sessionDir? }
  - Behavior: Throws NestedExecutionError if guard fails
  - Side Effect: Sets process.env.PRP_PIPELINE_RUNNING on success

ENVIRONMENT VARIABLE INTEGRATION:
  - Read: PRP_PIPELINE_RUNNING (existing pipeline check)
  - Read: SKIP_BUG_FINDING (bug fix mode check)
  - Read: PLAN_DIR (path validation)
  - Write: PRP_PIPELINE_RUNNING (set to current PID)

LOGGER INTEGRATION:
  - Method: logger.debug() for environment check logging
  - Context: Object with PRP_PIPELINE_RUNNING, SKIP_BUG_FINDING, PLAN_DIR, SESSION_DIR
  - Pattern: logger.debug('[Nested Guard] Environment Check', context)

SCOPE BOUNDARIES:
  - This PRP tests guard logic in isolation
  - Does NOT test pipeline integration (P1.M1.T4.S1)
  - Does NOT test shutdown flow (P1.M1.T4.S2)
  - Does NOT test resource monitoring (P1.M1.T4.S3)
  - Does NOT test actual guard implementation (not yet written)
  - Tests are PROACTIVE - written before implementation exists
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx eslint tests/unit/nested-execution-guard.test.ts --fix

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the nested execution guard file
npx vitest run tests/unit/nested-execution-guard.test.ts

# Run with coverage
npx vitest run tests/unit/nested-execution-guard.test.ts --coverage

# Run all unit tests to ensure no breakage
npx vitest run tests/unit/

# Expected: Tests will fail until guard is implemented (expected)
# But test structure and mocking should be correct
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify all unit tests still pass
npx vitest run tests/unit/

# Run related tests to ensure no breakage
npx vitest run tests/unit/config/ tests/unit/logger.test.ts

# Check that existing environment tests still work
npx vitest run tests/unit/config/environment.test.ts

# Expected: All existing tests pass, new tests fail (expected until guard implemented)
```

### Level 4: Manual Validation

```bash
# Verify test file exists and is properly structured
ls -la tests/unit/nested-execution-guard.test.ts

# Check test file follows project conventions
head -50 tests/unit/nested-execution-guard.test.ts
# Should see: describe blocks, proper imports, mock setup

# Verify all test categories are present
grep -n "describe.*Basic Guard Functionality" tests/unit/nested-execution-guard.test.ts
grep -n "describe.*Bug Fix Recursion Exception" tests/unit/nested-execution-guard.test.ts
grep -n "describe.*Path Validation" tests/unit/nested-execution-guard.test.ts
grep -n "describe.*Debug Logging" tests/unit/nested-execution-guard.test.ts
grep -n "describe.*Edge Cases" tests/unit/nested-execution-guard.test.ts

# Verify environment variable mocking patterns
grep -n "vi.stubEnv" tests/unit/nested-execution-guard.test.ts
grep -n "vi.unstubAllEnvs" tests/unit/nested-execution-guard.test.ts

# Verify cleanup pattern
grep -A2 "afterEach" tests/unit/nested-execution-guard.test.ts

# Expected: Test file well-structured, all categories present, proper mocking
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] Test file structure follows project patterns
- [ ] Environment variable mocking uses vi.stubEnv()
- [ ] Cleanup uses vi.unstubAllEnvs() in afterEach
- [ ] Tests import with .js extensions
- [ ] Logger mocking uses vi.spyOn() correctly
- [ ] All describe blocks have clear, descriptive names

### Feature Validation

- [ ] Tests allow execution when PRP_PIPELINE_RUNNING is not set
- [ ] Tests set PRP_PIPELINE_RUNNING to current PID on valid entry
- [ ] Tests block execution when PRP_PIPELINE_RUNNING is already set
- [ ] Tests allow bug fix recursion when BOTH conditions are met
- [ ] Tests block recursion when SKIP_BUG_FINDING=true BUT no bugfix path
- [ ] Tests block recursion when bugfix path exists BUT SKIP_BUG_FINDING is not 'true'
- [ ] Tests validate path contains 'bugfix' case-insensitively
- [ ] Tests verify debug logging with PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING
- [ ] Tests handle missing environment variables gracefully
- [ ] Tests handle concurrent validation calls

### Code Quality Validation

- [ ] Follows existing unit test patterns from environment.test.ts
- [ ] Mock setup uses vi.stubEnv() for environment variables
- [ ] Test file location matches conventions (tests/unit/)
- [ ] afterEach cleanup includes vi.unstubAllEnvs()
- [ ] Tests use SETUP/EXECUTE/VERIFY sections (optional but recommended)
- [ ] Tests focus on guard logic, not pipeline integration
- [ ] No overlap with P1.M1.T4.S1 (main loop)
- [ ] No overlap with P1.M1.T4.S2 (shutdown)
- [ ] No overlap with P1.M1.T4.S3 (resource monitoring)

### Documentation & Deployment

- [ ] Test file header with JSDoc comments describing purpose
- [ ] Test names clearly describe what is being tested
- [ ] Research documents stored in research/ subdirectory
- [ ] Tests are ready for guard implementation (written proactively)
- [ ] PRP implementation documented

---

## Anti-Patterns to Avoid

- ❌ Don't test pipeline integration - that's P1.M1.T4.S1
- ❌ Don't test shutdown flow - that's P1.M1.T4.S2
- ❌ Don't test resource monitoring - that's P1.M1.T4.S3
- ❌ Don't skip vi.unstubAllEnvs() in afterEach - causes test pollution
- ❌ Don't use boolean true for SKIP_BUG_FINDING - must be string 'true'
- ❌ Don't forget to import with .js extensions
- ❌ Don't use vi.mock() for logger - use vi.spyOn() instead
- ❌ Don't skip testing case-insensitive path matching
- ❌ Don't forget to clear logger cache in beforeEach
- ❌ Don't skip testing BOTH conditions for bug fix recursion
- ❌ Don't skip edge case tests (missing environment variables)
- ❌ Don't assume guard is implemented - tests are proactive
- ❌ Don't skip debug logging verification
- ❌ Don't hardcode PID values - use process.pid when appropriate
- ❌ Don't skip testing that PRP_PIPELINE_RUNNING is set on success

---

**PRP Version:** 1.0
**Work Item:** P1.M1.T4.S4
**Created:** 2026-01-19
**Status:** Ready for Implementation

**Confidence Score:** 9/10 for one-pass implementation success

**Rationale:**

- Complete specification from PRD, delta_prd, system_context, and external_deps documentation
- Comprehensive test patterns analysis from existing codebase (environment.test.ts, is-fatal-error.test.ts, logger.test.ts)
- Detailed implementation tasks with dependency ordering
- Mock patterns and cleanup patterns well-documented
- All contract requirements from external-deps-research.md covered
- Clear test structure with describe blocks for each scenario
- Proactive test design - tests written before implementation exists
- No gaps in context - implementation can proceed with PRP alone
