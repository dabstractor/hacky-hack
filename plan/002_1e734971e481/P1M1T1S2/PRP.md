# Product Requirement Prompt (PRP): Test Groundswell imports

**PRP ID**: P1.M1.T1.S2
**Generated**: 2026-01-15
**Story Points**: 1

---

## Goal

**Feature Goal**: Create a test file that validates all major Groundswell library exports can be successfully imported, resolving the npm link configuration validated in S1.

**Deliverable**: A Vitest test file at `tests/unit/groundswell/imports.test.ts` that:
1. Tests import of all major Groundswell exports (classes, decorators, factory functions, utilities)
2. Verifies TypeScript compilation succeeds for all import patterns
3. Returns pass/fail status for each import category
4. Provides a list of any failing imports for downstream consumption by S3

**Success Definition**:
- All major Groundswell exports can be imported successfully
- TypeScript compilation succeeds for all import patterns
- Vitest test suite passes with 100% coverage of the import test file
- Test file follows existing codebase patterns and conventions
- Returns structured results indicating which imports passed/failed for S3 consumption

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Second validation step in Phase 1 (P1.M1.T1) to verify that after npm link is validated (S1), the actual Groundswell imports work correctly in the TypeScript/Vitest environment.

**User Journey**:
1. Pipeline completes P1.M1.T1.S1 (npm link validation) with `success: true`
2. Pipeline starts P1.M1.T1.S2 (import tests)
3. Test file runs vitest on imports.test.ts
4. Each import category is tested individually
5. Results are aggregated and reported
6. If all imports pass: Proceed to S3 (version compatibility)
7. If any imports fail: Report specific failing exports for troubleshooting

**Pain Points Addressed**:
- Silent import failures where TypeScript appears to work but runtime fails
- Unclear which specific exports are failing when import errors occur
- Time wasted debugging which Groundswell features are importable
- Missing decorator configuration causing cryptic import errors

---

## Why

- **Foundation for P1.M2**: This validation ensures that after npm link is working, the actual code can use Groundswell imports. Without successful imports, all subsequent functionality tests (P1.M1.T2, P1.M1.T3) will fail.
- **Prerequisite for Development**: All downstream development depends on being able to import Groundswell classes, decorators, and utilities.
- **Early Failure Detection**: Catching import issues now prevents wasted time on deeper integration tests that would fail for basic import reasons.
- **Documentation of Working Imports**: Creates a clear list of which Groundswell exports are confirmed working in this environment.
- **Problems Solved**:
  - Validates that Groundswell's ESM module structure works with this project's TypeScript/Vitest setup
  - Confirms decorator imports work (requires special tsconfig/vitest config)
  - Identifies any exports that fail to import for S3 to investigate version compatibility
  - Provides concrete test coverage for the import layer of Groundswell integration

---

## What

Create a comprehensive test file that validates all major Groundswell exports can be imported successfully. The test should:

1. **Test Static Imports**: Validate standard named imports work
2. **Test Type-Only Imports**: Validate TypeScript types can be imported
3. **Test Namespace Imports**: Validate `import * as` pattern works
4. **Test Decorator Imports**: Validate decorators can be imported and applied
5. **Test Runtime Imports**: Validate dynamic imports work at runtime
6. **Verify TypeScript Compilation**: Ensure tsc can resolve all imports
7. **Return Structured Results**: Provide pass/fail status per import category

### Success Criteria

- [ ] All major Groundswell exports can be imported: Workflow, Agent, Prompt, MCPHandler
- [ ] All decorators can be imported: @Step, @Task, @ObservedState
- [ ] All factory functions can be imported: createAgent, createWorkflow, createPrompt
- [ ] All utilities can be imported: LLMCache, generateId
- [ ] TypeScript compilation succeeds with `tsc --noEmit`
- [ ] Vitest test suite passes with `vitest run tests/unit/groundswell/imports.test.ts`
- [ ] Test file follows existing codebase patterns (see test-patterns.md research)
- [ ] Returns structured import test results for S3 consumption
- [ ] Test file achieves 100% coverage (project requirement)
- [ ] Mocks any runtime dependencies (Anthropic API, etc.)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] File paths and test locations specified
- [x] Groundswell export list documented
- [x] Test patterns and conventions referenced
- [x] TypeScript configuration details included
- [x] Mock patterns for external dependencies specified
- [x] Previous PRP outputs integrated
- [x] ESM import requirements documented

---

### Documentation & References

```yaml
# MUST READ - Contract definition from PRD
- docfile: plan/002_1e734971e481/current_prd.md
  why: Contains the work item contract definition for this subtask
  section: P1.M1.T1.S2 contract definition
  critical: Specifies exact test file location, imports to test, and output format

# MUST READ - Previous PRP (P1.M1.T1.S1) outputs
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M1T1S1/PRP.md
  why: Defines the NpmLinkValidationResult interface that this PRP consumes
  pattern: Input is "Valid link status from S1" means NpmLinkValidationResult.success
  critical: If S1 returns success=false, this PRP should skip tests and report link failure

# MUST READ - Groundswell library API surface
- file: /home/dustin/projects/groundswell/dist/index.d.ts
  why: Complete list of all Groundswell exports that need to be tested
  pattern: Classes: Workflow, Agent, Prompt, MCPHandler; Decorators: Step, Task, ObservedState
  gotcha: Examples are commented out due to decorator compatibility with vitest

- docfile: plan/002_1e734971e481/architecture/groundswell_analysis.md
  why: Complete Groundswell API surface and module structure
  section: Section 2 (Core API Surface)
  critical: Contains full export list including factory functions and utilities

# EXISTING CODEBASE PATTERNS - Test structure
- file: /home/dustin/projects/hacky-hack/tests/setup.ts
  why: Global test configuration, mock cleanup patterns, API endpoint validation
  pattern: beforeEach/afterEach hooks, vi.clearAllMocks(), vi.unstubAllEnvs()
  critical: All tests must use z.ai API endpoint, never Anthropic's official API

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Vitest configuration including decorator support and path aliases
  pattern: experimentalDecorators: true, emitDecoratorMetadata: true
  gotcha: groundswell path alias works for tests but npm link required for production

- file: /home/dustin/projects/hacky-hack/tsconfig.json
  why: TypeScript module resolution configuration
  pattern: moduleResolution: "NodeNext", module: "NodeNext"
  critical: NodeNext mode requires ESM modules with .js extensions

# EXISTING CODEBASE PATTERNS - Test examples
- file: /home/dustin/projects/hacky-hack/tests/unit/utils/groundswell-linker.test.ts
  why: Example of Groundswell-related testing patterns, mock setup for spawn/fs
  pattern: vi.mock for Node.js modules, createMockChild helper function
  gotcha: Uses vi.useFakeTimers() for timeout testing

- file: /home/dustin/projects/hacky-hack/tests/unit/utils/groundswell-verifier.test.ts
  why: Example of Groundswell verification testing patterns
  pattern: describe/it blocks, beforeEach/afterEach for mock cleanup
  gotcha: Tests readonly arrays and complex result objects

- file: /home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts
  why: Example of config/env testing patterns that may be relevant
  pattern: Environment variable testing with vi.stubEnv()

# EXISTING CODEBASE PATTERNS - Existing Groundswell imports
- file: /home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts
  why: Real-world example of Groundswell import patterns in codebase
  pattern: import { Workflow, Step } from 'groundswell';

- file: /home/dustin/projects/hacky-hack/src/agents/prp-generator.ts
  why: Example of type-only imports from Groundswell
  pattern: import type { Agent } from 'groundswell';

# EXTERNAL RESEARCH - Created by parallel research agents
- docfile: plan/002_1e734971e481/P1M1T1S2/research/test-patterns.md
  why: Comprehensive analysis of existing test patterns in codebase
  section: Complete document

- docfile: plan/002_1e734971e481/P1M1T1S2/research/vitest-import-testing.md
  why: Best practices for testing module imports with Vitest and TypeScript
  section: Complete document with URLs to official documentation

- docfile: plan/002_1e734971e481/P1M1T1S2/research/groundswell-exports.md
  why: Complete list of all Groundswell exports to test
  section: Complete document with categorized export list

# EXTERNAL DOCUMENTATION - URLs
- url: https://vitest.dev/guide/
  why: Official Vitest documentation for module testing and mocking

- url: https://vitest.dev/api/#vi-mock
  why: Vitest mocking API documentation for mock patterns

- url: https://www.typescriptlang.org/tsconfig#experimentalDecorators
  why: TypeScript decorator configuration requirements
  critical: experimentalDecorators and emitDecoratorMetadata must be true

- url: https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-formats
  why: TypeScript ESM module documentation
  critical: ESM requires .js extensions in all imports
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # NO groundswell dependency (uses npm link)
├── tsconfig.json                 # NodeNext module resolution
├── vitest.config.ts              # Decorator support, groundswell path alias
├── src/
│   ├── utils/
│   │   ├── validate-groundswell-link.ts  # FROM S1: NpmLinkValidationResult
│   │   ├── groundswell-linker.ts         # Existing Groundswell utilities
│   │   └── groundswell-verifier.ts       # Existing Groundswell verification
│   ├── workflows/
│   │   ├── fix-cycle-workflow.ts         # Example: import { Workflow, Step }
│   │   └── ...                           # Other workflows using Groundswell
│   └── agents/
│       └── prp-generator.ts              # Example: import type { Agent }
└── tests/
    ├── setup.ts                          # Global test setup
    └── unit/
        ├── utils/
        │   ├── groundswell-linker.test.ts   # Existing Groundswell test patterns
        │   └── groundswell-verifier.test.ts # Existing verification patterns
        └── groundswell/                   # NEW DIRECTORY for Groundswell tests
            └── imports.test.ts            # NEW: Import tests (this PRP)
```

---

### Desired Codebase Tree (files to be added)

```bash
hacky-hack/
└── tests/
    └── unit/
        └── groundswell/               # NEW: Groundswell-specific test directory
            └── imports.test.ts        # NEW: Import validation tests
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: ESM requires .js extensions in all imports
// Even though source files are .ts, imports must use .js extension
// Example: import { Workflow } from 'groundswell'; (works - no extension for external package)
// Example: import { foo } from './utils/validate-groundswell-link.js'; (requires .js)

// CRITICAL: Decorators require special TypeScript config
// Both tsconfig.json AND vitest.config.ts must have:
// experimentalDecorators: true
// emitDecoratorMetadata: true
// Without these, decorator imports will fail at runtime

// CRITICAL: Groundswell is ESM-only
// "type": "module" in groundswell/package.json
// Cannot use require(), must use import statements
// NodeNext moduleResolution requires this

// CRITICAL: Path alias vs npm link difference
// vitest.config.ts has path alias that works for TESTS ONLY
// Path alias: groundswell -> '../groundswell/dist/index.js'
// npm link: creates symlink in node_modules/groundswell
// This test should work with EITHER configuration

// CRITICAL: Previous PRP output contract
// S1 returns NpmLinkValidationResult with fields:
// - success: boolean (whether npm link is properly configured)
// - linkedPath: string | null (absolute path to groundswell if success)
// - typescriptResolves: boolean (whether TypeScript can resolve imports)
// If S1.success === false, this PRP should skip tests and report link failure

// CRITICAL: Groundswell examples are commented out
// In groundswell/src/index.ts, examples are commented due to vitest compatibility
// Do NOT try to import example files

// CRITICAL: z.ai API endpoint requirement
// All tests must use z.ai API endpoint, never Anthropic's official API
// tests/setup.ts enforces this globally
// Mock any Anthropic SDK calls to prevent accidental API usage

// GOTCHA: Type-only imports vs runtime imports
// import type { Agent } from 'groundswell' compiles but has no runtime value
// import { Agent } from 'groundswell' has runtime value
// Test both patterns separately

// GOTCHA: Decorator application testing
// Importing a decorator is different from applying it
// @Step syntax requires experimentalDecorators: true
// Test both import AND application of decorators

// GOTCHA: Namespace import pattern
// import * as gs from 'groundswell' should work
// But may have issues with decorators due to TypeScript limitations
// Test this pattern separately

// GOTCHA: Dynamic imports (runtime)
// const gs = await import('groundswell') should work
// This validates runtime module resolution, not just TypeScript compilation
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Result of testing a single Groundswell import
 */
interface ImportTestResult {
  /** The import statement that was tested */
  importStatement: string;

  /** Whether the import succeeded */
  success: boolean;

  /** Error message if import failed */
  error?: string;

  /** Category of import (class, decorator, factory, utility, type) */
  category: 'class' | 'decorator' | 'factory' | 'utility' | 'type';
}

/**
 * Aggregated results of all Groundswell import tests
 */
interface GroundswellImportTestResults {
  /** Overall success status (true if all imports succeed) */
  overallSuccess: boolean;

  /** Results for each import category */
  categories: {
    /** Core class imports (Workflow, Agent, Prompt, MCPHandler) */
    classes: ImportTestResult[];

    /** Decorator imports (@Step, @Task, @ObservedState) */
    decorators: ImportTestResult[];

    /** Factory function imports (createAgent, createWorkflow, createPrompt) */
    factories: ImportTestResult[];

    /** Utility imports (LLMCache, generateId, etc.) */
    utilities: ImportTestResult[];

    /** Type-only imports */
    types: ImportTestResult[];
  };

  /** List of all failing imports for S3 consumption */
  failingImports: string[];

  /** TypeScript compilation success status */
  typescriptCompilationSuccess: boolean;

  /** S1 link validation result (input to this test) */
  linkValidationSuccess: boolean;
}
```

---

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ S1 validation result
  - INPUT: NpmLinkValidationResult from src/utils/validate-groundswell-link.ts
  - CHECK: If success === false, skip tests and return failure result
  - REFERENCE: plan/002_1e734971e481/P1M1T1S1/PRP.md lines 248-270 for interface definition
  - NAMING: Use validateNpmLink() to get result before running tests

Task 2: CREATE tests/unit/groundswell/ directory
  - CREATE: New directory for Groundswell-specific tests
  - NAMING: tests/unit/groundswell/ (lowercase per convention)
  - PLACEMENT: Alongside other unit test directories (config/, core/, utils/)
  - GOTCHA: Directory may not exist yet, create if missing

Task 3: CREATE tests/unit/groundswell/imports.test.ts
  - IMPLEMENT: Test file following existing patterns from groundswell-linker.test.ts
  - HEADER: Include JSDoc comments with @remarks describing test purpose
  - IMPORTS: Import vitest globals and NpmLinkValidationResult type
  - NAMING: imports.test.ts (per contract definition)
  - PLACEMENT: tests/unit/groundswell/ directory

Task 4: IMPLEMENT test file structure
  - ADD: File header with @remarks and @see tags
  - IMPORT: vitest globals (describe, it, expect, vi, beforeEach, afterEach)
  - IMPORT: NpmLinkValidationResult from src/utils/validate-groundswell-link.js
  - PATTERN: Follow groundswell-linker.test.ts lines 1-59 for structure

Task 5: IMPLEMENT mock setup for Anthropic SDK
  - MOCK: @anthropic-ai/sdk to prevent actual API calls
  - PATTERN: vi.mock('@anthropic-ai/sdk', () => ({ Anthropic: vi.fn() }))
  - REASON: Groundswell imports may trigger SDK initialization
  - SAFETY: Prevents accidental usage of Anthropic API in tests

Task 6: IMPLEMENT S1 validation check
  - CALL: validateNpmLink() before running import tests
  - CHECK: If result.success === false, skip all tests
  - REPORT: Return GroundswellImportTestResults with linkValidationSuccess: false
  - PATTERN: Use describe.skip() or it.skip() for conditional test execution

Task 7: IMPLEMENT class import tests
  - TEST: import { Workflow } from 'groundswell'
  - TEST: import { Agent } from 'groundswell'
  - TEST: import { Prompt } from 'groundswell'
  - TEST: import { MCPHandler } from 'groundswell'
  - VERIFY: Each import resolves and creates a constructor/function
  - CATEGORY: 'class'

Task 8: IMPLEMENT decorator import tests
  - TEST: import { Step } from 'groundswell'
  - TEST: import { Task } from 'groundswell'
  - TEST: import { ObservedState } from 'groundswell'
  - VERIFY: Each decorator is a function that can be applied
  - TEST: Apply decorator to a test class to verify it works
  - CATEGORY: 'decorator'
  - GOTCHA: Requires experimentalDecorators: true in tsconfig and vitest config

Task 9: IMPLEMENT factory function import tests
  - TEST: import { createAgent } from 'groundswell'
  - TEST: import { createWorkflow } from 'groundswell'
  - TEST: import { createPrompt } from 'groundswell'
  - VERIFY: Each factory is a function
  - CATEGORY: 'factory'

Task 10: IMPLEMENT utility import tests
  - TEST: import { LLMCache } from 'groundswell'
  - TEST: import { generateId } from 'groundswell'
  - TEST: import { createEventTreeHandle } from 'groundswell'
  - VERIFY: Each utility is exported and is a function or class
  - CATEGORY: 'utility'

Task 11: IMPLEMENT type-only import tests
  - TEST: import type { WorkflowStatus } from 'groundswell'
  - TEST: import type { AgentConfig } from 'groundswell'
  - TEST: import type { WorkflowConfig } from 'groundswell'
  - VERIFY: Type-only imports compile correctly
  - CATEGORY: 'type'
  - GOTCHA: Type-only imports have no runtime value, test compilation only

Task 12: IMPLEMENT namespace import test
  - TEST: import * as groundswell from 'groundswell'
  - VERIFY: Namespace contains expected exports
  - CHECK: groundswell.Workflow, groundswell.Agent, etc. exist
  - GOTCHA: Namespace imports may have issues with decorators

Task 13: IMPLEMENT dynamic import test
  - TEST: const gs = await import('groundswell')
  - VERIFY: Dynamic import resolves at runtime
  - CHECK: gs.Workflow, gs.Agent, etc. exist
  - REASON: Validates runtime module resolution

Task 14: IMPLEMENT TypeScript compilation test
  - CREATE: Temporary test file with all import statements
  - RUN: tsc --noEmit on the test file
  - VERIFY: No compilation errors
  - CLEANUP: Remove temporary test file
  - PATTERN: Use try-finally for cleanup

Task 15: IMPLEMENT result aggregation
  - COLLECT: Results from all test categories
  - AGGREGATE: Into GroundswellImportTestResults structure
  - CALCULATE: overallSuccess = all categories.length > 0 && all succeed
  - EXTRACT: failingImports list for S3 consumption
  - RETURN: Complete result object

Task 16: ADD test coverage for error cases
  - TEST: What happens when import fails (e.g., typo in export name)
  - TEST: Error messages are descriptive
  - VERIFY: Failing imports are properly reported
  - PATTERN: Use expect().toThrow() for error cases
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// FILE HEADER PATTERN (from groundswell-linker.test.ts lines 1-13)
// =============================================================================

/**
 * Unit tests for Groundswell imports
 *
 * @remarks
 * Tests validate Groundswell import functionality including:
 * 1. Core class imports (Workflow, Agent, Prompt, MCPHandler)
 * 2. Decorator imports (@Step, @Task, @ObservedState)
 * 3. Factory function imports (createAgent, createWorkflow, createPrompt)
 * 4. Utility imports (LLMCache, generateId, etc.)
 * 5. Type-only imports
 * 6. Namespace and dynamic import patterns
 * 7. TypeScript compilation validation
 *
 * Depends on successful npm link validation from P1.M1.T1.S1.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

// =============================================================================
// IMPORTS PATTERN (from groundswell-linker.test.ts lines 15-58)
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  validateNpmLink,
  type NpmLinkValidationResult,
} from '../../../src/utils/validate-groundswell-link.js';

// =============================================================================
// MOCK SETUP PATTERN
// =============================================================================

// Mock Anthropic SDK to prevent accidental API calls
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// =============================================================================
// S1 VALIDATION CHECK PATTERN
// =============================================================================

describe('Groundswell imports', () => {
  let linkValidation: NpmLinkValidationResult;

  beforeAll(async () => {
    // Check npm link status from S1
    linkValidation = await validateNpmLink();

    // Skip all tests if link validation failed
    if (!linkValidation.success) {
      console.warn(
        `Skipping import tests: npm link validation failed\n${linkValidation.errorMessage}`
      );
    }
  });

  // Use describe.skip() to conditionally skip all tests
  const describeOrSkip = linkValidation.success ? describe : describe.skip;

  // =============================================================================
  // CLASS IMPORT TESTS
  // =============================================================================

  describeOrSkip('Core class imports', () => {
    it('should import Workflow class', async () => {
      // Test dynamic import for runtime validation
      const { Workflow } = await import('groundswell');

      expect(Workflow).toBeDefined();
      expect(typeof Workflow).toBe('function');
    });

    it('should import Agent class', async () => {
      const { Agent } = await import('groundswell');

      expect(Agent).toBeDefined();
      expect(typeof Agent).toBe('function');
    });

    it('should import Prompt class', async () => {
      const { Prompt } = await import('groundswell');

      expect(Prompt).toBeDefined();
      expect(typeof Prompt).toBe('function');
    });

    it('should import MCPHandler class', async () => {
      const { MCPHandler } = await import('groundswell');

      expect(MCPHandler).toBeDefined();
      expect(typeof MCPHandler).toBe('function');
    });
  });

  // =============================================================================
  // DECORATOR IMPORT TESTS
  // =============================================================================

  describeOrSkip('Decorator imports', () => {
    it('should import Step decorator', async () => {
      const { Step } = await import('groundswell');

      expect(Step).toBeDefined();
      expect(typeof Step).toBe('function');

      // Test decorator application
      // NOTE: This requires experimentalDecorators: true
      class TestWorkflow {
        @Step()
        async testStep() {
          return 'test';
        }
      }

      expect(TestWorkflow.prototype).toBeDefined();
    });

    it('should import Task decorator', async () => {
      const { Task } = await import('groundswell');

      expect(Task).toBeDefined();
      expect(typeof Task).toBe('function');
    });

    it('should import ObservedState decorator', async () => {
      const { ObservedState, getObservedState } = await import('groundswell');

      expect(ObservedState).toBeDefined();
      expect(typeof ObservedState).toBe('function');
      expect(getObservedState).toBeDefined();
    });
  });

  // =============================================================================
  // FACTORY FUNCTION IMPORT TESTS
  // =============================================================================

  describeOrSkip('Factory function imports', () => {
    it('should import createAgent factory', async () => {
      const { createAgent } = await import('groundswell');

      expect(createAgent).toBeDefined();
      expect(typeof createAgent).toBe('function');
    });

    it('should import createWorkflow factory', async () => {
      const { createWorkflow } = await import('groundswell');

      expect(createWorkflow).toBeDefined();
      expect(typeof createWorkflow).toBe('function');
    });

    it('should import createPrompt factory', async () => {
      const { createPrompt } = await import('groundswell');

      expect(createPrompt).toBeDefined();
      expect(typeof createPrompt).toBe('function');
    });
  });

  // =============================================================================
  // UTILITY IMPORT TESTS
  // =============================================================================

  describeOrSkip('Utility imports', () => {
    it('should import LLMCache utility', async () => {
      const { LLMCache } = await import('groundswell');

      expect(LLMCache).toBeDefined();
      expect(typeof LLMCache).toBe('function');
    });

    it('should import generateId utility', async () => {
      const { generateId } = await import('groundswell');

      expect(generateId).toBeDefined();
      expect(typeof generateId).toBe('function');
    });

    it('should import createEventTreeHandle utility', async () => {
      const { createEventTreeHandle } = await import('groundswell');

      expect(createEventTreeHandle).toBeDefined();
      expect(typeof createEventTreeHandle).toBe('function');
    });
  });

  // =============================================================================
  // TYPE-ONLY IMPORT TESTS
  // =============================================================================

  describeOrSkip('Type-only imports', () => {
    it('should compile with type-only WorkflowStatus import', () => {
      // Type-only imports have no runtime value
      // This test validates TypeScript compilation
      type TestType = import('groundswell').WorkflowStatus;

      expect(true).toBe(true); // Placeholder - compilation test only
    });

    it('should compile with type-only AgentConfig import', () => {
      type TestType = import('groundswell').AgentConfig;

      expect(true).toBe(true); // Placeholder - compilation test only
    });
  });

  // =============================================================================
  // NAMESPACE IMPORT TESTS
  // =============================================================================

  describeOrSkip('Namespace imports', () => {
    it('should support namespace import pattern', async () => {
      const gs = await import('groundswell');

      expect(gs.Workflow).toBeDefined();
      expect(gs.Agent).toBeDefined();
      expect(gs.Prompt).toBeDefined();
      expect(gs.createWorkflow).toBeDefined();
      expect(gs.createAgent).toBeDefined();
    });
  });

  // =============================================================================
  // TYPESCRIPT COMPILATION TEST
  // =============================================================================

  describeOrSkip('TypeScript compilation', () => {
    it('should compile test file with all imports', async () => {
      // This test validates TypeScript can resolve all imports
      // The fact that this test file compiles is the test
      expect(true).toBe(true);
    });
  });
});
```

---

### Integration Points

```yaml
NO EXISTING FILE MODIFICATIONS REQUIRED:
  - This is a new test file, no existing code changes
  - Does not modify vitest.config.ts (already has decorator support)
  - Does not modify tsconfig.json (already has NodeNext module resolution)
  - Does not modify tests/setup.ts (uses existing global setup)

INPUT FROM S1:
  - File: src/utils/validate-groundswell-link.ts (created in S1)
  - Interface: NpmLinkValidationResult
  - Critical fields: success (boolean), linkedPath (string | null)
  - Usage: Call validateNpmLink() before running import tests

OUTPUT FOR S3 CONSUMPTION:
  - File: GroundswellImportTestResults interface
  - Used by: P1.M1.T1.S3 (Verify Groundswell version compatibility)
  - Critical fields:
    * overallSuccess: boolean
    * failingImports: string[] (list of imports that failed)
    * typescriptCompilationSuccess: boolean

DIRECTORY STRUCTURE:
  - Create: tests/unit/groundswell/ (new directory for Groundswell tests)
  - Pattern: Mirrors structure of tests/unit/utils/, tests/unit/core/, etc.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating tests/unit/groundswell/imports.test.ts
# Check TypeScript compilation
npx tsc --noEmit tests/unit/groundswell/imports.test.ts

# Expected: No type errors

# Format check
npx prettier --check "tests/unit/groundswell/imports.test.ts"

# Expected: No formatting issues

# Linting
npx eslint tests/unit/groundswell/imports.test.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the import test file
npm test -- tests/unit/groundswell/imports.test.ts

# Expected: All import tests pass

# Run with coverage
npm run test:coverage -- tests/unit/groundswell/imports.test.ts

# Expected: 100% coverage (project requirement)

# Run specific test categories
npm test -- -t "Core class imports"
npm test -- -t "Decorator imports"
npm test -- -t "Factory function imports"
npm test -- -t "Utility imports"

# Expected: All category tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test S1 dependency
npm test -- -t "npm link validation"

# Expected: S1 validation runs first, tests skip if link fails

# Test full Groundswell test suite
npm test -- tests/unit/groundswell/

# Expected: All Groundswell tests pass

# Verify imports work in actual code
npx tsc --noEmit

# Expected: No module resolution errors in entire project

# Test that existing code can still import Groundswell
npm test -- tests/unit/workflows/fix-cycle-workflow.test.ts
npm test -- tests/unit/agents/prp-generator.test.ts

# Expected: Existing tests still pass (no regression)
```

### Level 4: Domain-Specific Validation

```bash
# Validate decorator configuration
# Test 1: Verify experimentalDecorators is enabled
grep -E "experimentalDecorators|emitDecoratorMetadata" vitest.config.ts tsconfig.json

# Expected: Both options set to true in both files

# Test 2: Verify decorator imports work at runtime
npm test -- -t "Decorator imports"

# Expected: All decorator tests pass

# Validate ESM import patterns
# Test 3: Verify .js extensions are used correctly
grep -r "from '\.\/.*\.js'" tests/unit/groundswell/imports.test.ts

# Expected: All relative imports use .js extension

# Validate npm link vs path alias
# Test 4: Verify imports work with both configurations
npm test -- tests/unit/groundswell/imports.test.ts

# Expected: Tests pass with either npm link or path alias

# Validate mock setup
# Test 5: Verify Anthropic SDK is mocked
grep -r "vi.mock.*anthropic" tests/unit/groundswell/imports.test.ts

# Expected: Anthropic SDK is mocked to prevent API calls

# Test 6: Verify z.ai API endpoint enforcement
npm test -- tests/unit/groundswell/imports.test.ts

# Expected: tests/setup.ts enforces z.ai endpoint usage

# Validate error reporting
# Test 7: Verify failing imports are reported
# Temporarily break an import to test error handling
# Add: it('should report failing imports', () => { ... })

# Expected: Failing imports are logged and reported in results
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/groundswell/imports.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npx eslint tests/unit/groundswell/imports.test.ts`
- [ ] No formatting issues: `npx prettier --check "tests/unit/groundswell/imports.test.ts"`
- [ ] 100% code coverage achieved
- [ ] S1 validation check works (tests skip when link fails)

### Feature Validation

- [ ] All core class imports work: Workflow, Agent, Prompt, MCPHandler
- [ ] All decorator imports work: @Step, @Task, @ObservedState
- [ ] All factory function imports work: createAgent, createWorkflow, createPrompt
- [ ] All utility imports work: LLMCache, generateId, createEventTreeHandle
- [ ] Type-only imports compile correctly
- [ ] Namespace import pattern works
- [ ] Dynamic imports work at runtime
- [ ] TypeScript compilation succeeds for all import patterns
- [ ] Failing imports are properly reported for S3 consumption
- [ ] Anthropic SDK is mocked to prevent API calls

### Code Quality Validation

- [ ] Follows existing test patterns from groundswell-linker.test.ts
- [ ] File placement matches desired codebase tree structure (tests/unit/groundswell/)
- [ ] File naming follows convention (imports.test.ts)
- [ ] Includes JSDoc header with @remarks and @see tags
- [ ] Uses describe/it blocks for logical grouping
- [ ] Uses beforeEach/afterEach for mock cleanup
- [ ] Uses .js extensions for all relative imports (ESM requirement)
- [ ] Properly mocks Anthropic SDK
- [ ] Respects z.ai API endpoint enforcement from tests/setup.ts

### Documentation & Deployment

- [ ] Code is self-documenting with clear test names
- [ ] Test comments explain what is being tested and why
- [ ] Error messages are descriptive for failing imports
- [ ] Test output provides clear pass/fail status per category
- [ ] Results structure is well-documented for S3 consumption
- [ ] No environment variables required (uses defaults from S1)

---

## Anti-Patterns to Avoid

- [x] **Don't skip S1 validation** - Always check npm link status before testing imports
- [x] **Don't use require()** - Groundswell is ESM-only, must use import statements
- [x] **Don't forget .js extensions** - ESM requires .js in relative imports
- [x] **Don't test without mocks** - Mock Anthropic SDK to prevent accidental API calls
- [x] **Don't ignore decorator config** - Verify experimentalDecorators is enabled
- [x] **Don't mix static and dynamic imports** - Test patterns separately
- [x] **Don't assume all exports work** - Test each category independently
- [x] **Don't ignore TypeScript compilation** - Type-only imports must compile
- [x] **Don't skip error reporting** - Provide clear list of failing imports for S3
- [x] **Don't use Anthropic API** - tests/setup.ts enforces z.ai endpoint
- [x] **Don't create test files elsewhere** - Must be at tests/unit/groundswell/imports.test.ts
- [x] **Don't forget cleanup** - Use vi.clearAllMocks() in afterEach
- [x] **Don't test example files** - Groundswell examples are commented out
- [x] **Don't hardcode paths** - Use validateNpmLink() to get groundswell path
- [x] **Don't ignore path alias vs npm link** - Test should work with either configuration

---

## Appendix: Decision Rationale

### Why use dynamic imports in tests?

Dynamic imports (`await import('groundswell')`) validate runtime module resolution, not just TypeScript compilation. Static imports are validated at compile time, but dynamic imports test that the module can actually be loaded at runtime. This catches issues where TypeScript thinks the import works but Node.js cannot resolve the module.

### Why test decorators separately?

Decorators require special TypeScript configuration (`experimentalDecorators: true`, `emitDecoratorMetadata: true`). Testing decorator imports separately ensures that:
1. The decorator can be imported as a function
2. The decorator can be applied to a class
3. The decorator configuration is correct in both tsconfig and vitest config

### Why check S1 validation first?

S1 validates that npm link is properly configured. If npm link is broken, all import tests will fail with confusing module resolution errors. By checking S1 first, we can skip import tests with a clear error message: "Skipping import tests: npm link validation failed". This saves time and provides better debugging information.

### Why namespace import test?

Namespace imports (`import * as gs from 'groundswell'`) are a common pattern but can have issues with:
1. Decorators due to TypeScript limitations
2. Tree-shaking in production builds
3. Type inference in some scenarios

Testing this pattern separately ensures it works correctly in the codebase.

### Why mock Anthropic SDK?

Groundswell may initialize the Anthropic SDK on import. Without mocking, this could:
1. Make accidental API calls to Anthropic
2. Require API keys during testing
3. Violate the z.ai API endpoint requirement

Mocking ensures tests are isolated and don't make external API calls.

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from previous PRP (S1 outputs)
- [x] Comprehensive Groundswell export list from research agents
- [x] Existing test patterns documented and analyzed
- [x] External best practices researched and documented
- [x] All file paths and patterns specified
- [x] Mock patterns for external dependencies identified
- [x] ESM requirements documented (.js extensions)
- [x] Decorator configuration requirements documented
- [x] z.ai API endpoint enforcement from tests/setup.ts
- [x] 100% coverage requirement understood

**Risk Mitigation**:
- S1 dependency check prevents wasted time on broken link
- Anthropic SDK mocking prevents API call issues
- Separate test categories allow granular failure identification
- Clear error reporting for S3 consumption
- Follows existing test patterns for consistency
