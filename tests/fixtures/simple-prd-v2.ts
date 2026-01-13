/**
 * Mock modified PRD for delta session E2E testing
 *
 * @remarks
 * Modified version of mockSimplePRD that adds new functionality to test
 * delta detection and session management.
 *
 * **Changes from v1**:
 * - Added P1.M1.T2: Add Calculator Functions (new task with 1 subtask)
 * - Modified P1.M1.T1.S1 story_points from 1 to 2
 *
 * **Usage**:
 * ```typescript
 * import { mockSimplePRDv2 } from '../fixtures/simple-prd-v2.js';
 *
 * // Write to file for delta testing
 * writeFileSync(prdPath, mockSimplePRDv2);
 * ```
 */
export const mockSimplePRDv2 = `
# Test Project

A minimal project for fast E2E pipeline testing.

## P1: Test Phase

Validate pipeline functionality with minimal complexity.

### P1.M1: Test Milestone

Create a simple hello world implementation.

#### P1.M1.T1: Create Hello World

Implement a basic hello world function with tests.

##### P1.M1.T1.S1: Write Hello World Function

Create a simple hello world function with enhanced features.

**story_points**: 2
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Enhanced function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!" with type annotations
4. OUTPUT: src/hello.ts with exported hello function

##### P1.M1.T1.S2: Write Test for Hello World

Create a test for the hello world function.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S1"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic unit test
2. INPUT: hello function from P1.M1.T1.S1
3. LOGIC: Create tests/hello.test.ts that tests hello() returns "Hello, World!"
4. OUTPUT: tests/hello.test.ts with passing test

##### P1.M1.T1.S3: Run Test

Validate the implementation works.

**story_points**: 1
**dependencies**: ["P1.M1.T1.S2"]
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Test execution validation
2. INPUT: hello function and test from previous subtasks
3. LOGIC: Run npm test to verify test passes
4. OUTPUT: Passing test result

#### P1.M1.T2: Add Calculator Functions

Implement basic calculator operations for additional functionality.

**story_points**: 3
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Calculator implementation
2. INPUT: None
3. LOGIC: Create src/calculator.ts with add(), subtract(), multiply(), divide() functions
4. OUTPUT: src/calculator.ts with exported calculator functions
`;
