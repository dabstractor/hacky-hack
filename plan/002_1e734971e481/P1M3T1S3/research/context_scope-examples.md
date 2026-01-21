# context_scope Contract Format Research

## Format Specification

The `context_scope` field follows a strict CONTRACT DEFINITION format with 4 numbered sections:

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: [Research findings and background information]
2. INPUT: [What data/dependencies are available from previous subtasks]
3. LOGIC: [Step-by-step implementation instructions]
4. OUTPUT: [What exact interface/result should be produced]
```

## Complete Examples from Codebase

### Example 1: Groundswell Library Link Validation

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: Groundswell library analysis confirms location at ~/projects/groundswell with dist/ output at dist/index.js. Existing package.json has dependency on 'groundswell' with local linking via npm link.
2. INPUT: Current package.json and node_modules/groundswell symlink status.
3. LOGIC: Run 'npm list groundswell' to verify link. Check if symlink points to ~/projects/groundswell. If broken, re-run 'npm link ~/projects/groundswell'. Verify TypeScript can resolve imports by attempting to compile a test file importing from 'groundswell'.
4. OUTPUT: Boolean success status and linked path for consumption by S2.
```

### Example 2: Environment Configuration Testing

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: Default BASE_URL is 'https://api.z.ai/api/anthropic' defined in /src/config/constants.ts as DEFAULT_BASE_URL. configureEnvironment() sets this if ANTHROPIC_BASE_URL is not already defined. This ensures all API calls route through z.ai proxy by default. Constants.ts also defines MODEL_NAMES mapping for opus/sonnet/haiku tiers. Refer to environment_setup.md Section 5.1 and 5.3.
2. INPUT: Environment mapping tests passing from S1.
3. LOGIC: Extend tests/unit/config/environment.test.ts. Test 1: Clear ANTHROPIC_BASE_URL, call configureEnvironment(), verify process.env.ANTHROPIC_BASE_URL === 'https://api.z.ai/api/anthropic'. Test 2: Set custom BASE_URL before configureEnvironment(), verify it's preserved (not overridden). Test 3: Verify default matches constant DEFAULT_BASE_URL from constants.ts. Use vi.stubGlobalEnv() for isolation.
4. OUTPUT: Confirmation that default z.ai endpoint is correctly set. Test coverage ensuring custom endpoints are respected.
```

### Example 3: Simple Hello World Implementation

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: Enhanced function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!" with type annotations
4. OUTPUT: src/hello.ts with exported hello function
```

### Example 4: Unit Test Creation

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: Basic unit test
2. INPUT: hello function from P1.M1.T1.S1
3. LOGIC: Create tests/hello.test.ts that tests hello() returns "Hello, World!"
4. OUTPUT: tests/hello.test.ts with passing test
```

### Example 5: Workflow Lifecycle Testing

```
CONTRACT DEFINITION:
1. RESEARCH NOTE: Groundswell Workflow supports class-based (extends Workflow) and functional (createWorkflow) patterns. Key methods: run(), attachChild(), detachChild(), setStatus(), snapshotState(). Decorators: @Step for lifecycle events, @Task for spawning children, @ObservedState for state tracking. Refer to groundswell_analysis.md Section 2.1 and Section 3.
2. INPUT: Verified Groundswell imports from S3.
3. LOGIC: Implement test file at tests/integration/groundswell/workflow.test.ts. Test 1: Create simple Workflow extending base class, override run() method, call run() and verify execution. Test 2: Use @Step decorator with trackTiming option, verify stepStart/stepEnd events. Test 3: Create parent-child workflows with @Task decorator, verify child attachment. Test 4: Mark field with @ObservedState, call snapshotState(), verify state captured. Use vi.mock() to prevent actual LLM calls. Follow existing test patterns from tests/workflows/.
4. OUTPUT: Comprehensive test coverage of Workflow lifecycle. Pass status indicating all lifecycle methods work correctly. Any issues with event propagation or state snapshots documented.
```

## Section Content Patterns

### 1. RESEARCH NOTE Section

- References specific documentation files (e.g., `groundswell_analysis.md`, `environment_setup.md`)
- Includes version information and technical specifications
- Cites specific sections of research documents
- Provides background context for the implementation

### 2. INPUT Section

- Always references dependencies by ID (e.g., "from S1", "from S2")
- Specifies what data/interfaces are available
- Notes when input is "None" for standalone tasks

### 3. LOGIC Section

- Very specific implementation steps
- Includes file paths and naming conventions
- Mentions mocking strategies for isolation
- References existing test patterns and frameworks
- Mentions TypeScript compilation requirements

### 4. OUTPUT Section

- Specifies exact file paths and interfaces
- Indicates success criteria (pass/fail status)
- Notes what should be documented or returned
- Often references "consumption by" next subtask

## Validation Requirements

The context_scope must:

1. Start with "CONTRACT DEFINITION:"
2. Have exactly 4 numbered sections (1-4)
3. Each section must have a header (RESEARCH NOTE, INPUT, LOGIC, OUTPUT)
4. Section headers must be in the correct order
5. Each section must have content after the colon

## References

- Format defined in: PROMPTS.md (line 158)
- System context: plan/002_1e734971e481/architecture/system_context.md
- Task examples: plan/002_1e734971e481/tasks.json
