# Agent Prompt Engineering Guide

> Comprehensive guide to designing, implementing, and iterating effective prompts for AI agents in the PRP Pipeline, covering prompt structure, persona design, process instructions, output formats, and quality enforcement.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

## Table of Contents

- [Overview](#overview)
- [Prompt Structure and Components](#prompt-structure-and-components)
- [Role Definition and Persona](#role-definition-and-persona)
- [Process Instruction Patterns](#process-instruction-patterns)
- [Output Format Specification](#output-format-specification)
- [Quality Enforcement Techniques](#quality-enforcement-techniques)
- [Prompt Iteration and Testing](#prompt-iteration-and-testing)
- [Four Critical Prompts](#four-critical-prompts)
- [See Also](#see-also)

---

## Overview

The PRP Pipeline uses a multi-agent system where each agent has a specialized persona defined by a system prompt. Effective prompt engineering is critical to the pipeline's success, as prompts directly determine agent behavior, output quality, and the overall reliability of the autonomous development process.

This guide documents the prompt design principles, patterns, and best practices used across the four critical agent personas in the PRP Pipeline:

1. **Architect Agent** (`TASK_BREAKDOWN_PROMPT`) - Analyzes PRDs and generates task hierarchies
2. **Researcher Agent** (`PRP_BLUEPRINT_PROMPT`) - Generates Product Requirement Prompts for subtasks
3. **Coder Agent** (`PRP_BUILDER_PROMPT`) - Executes PRPs to implement code
4. **QA Agent** (`BUG_HUNT_PROMPT`) - Performs creative bug hunting and validation

**Key Philosophy**: Prompts in the PRP Pipeline follow the principle of "Context Completeness" - every prompt contains all necessary information for the agent to succeed, with explicit constraints, clear success criteria, and structured output formats.

---

## Prompt Structure and Components

### Core Prompt Components

Effective prompts in the PRP Pipeline consist of five essential components:

#### 1. Role/Persona Definition

Defines the agent's identity, expertise level, and behavioral boundaries.

```typescript
// src/agents/prompts.ts (lines 33-39)
export const TASK_BREAKDOWN_PROMPT = `
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy: \`Phase\` > \`Milestone\` > \`Task\` > \`Subtask\`.
`;
```

**Best Practices**:
- Use specific professional titles (e.g., "Lead Technical Architect" not "Helper")
- Specify expertise level (senior, expert, specialist)
- Define the scope of authority and knowledge
- Set behavioral expectations (tone, decision-making approach)

#### 2. Context Injection

Provides the agent with relevant information about the current task, codebase state, and environmental factors.

```typescript
// src/agents/prompts/prp-blueprint-prompt.ts (lines 142-201)
function constructUserPrompt(
  task: Task | Subtask,
  backlog: Backlog,
  codebasePath?: string
): string {
  const itemDescription = isSubtask(task)
    ? task.context_scope
    : task.description.length > 0 ? task.description : task.title;

  const parentContext = extractParentContext(task.id, backlog);
  const taskContext = extractTaskContext(task, backlog);

  return `
# Work Item Context

## Task Information
**Title**: ${task.title}
**Description**: ${itemDescription}
${taskContext}

## Parent Context
${parentContext}

${codebaseSection}

---

${PRP_BLUEPRINT_PROMPT}
`;
}
```

**Context Types**:
- **Task Context**: Title, description, dependencies, context_scope
- **Parent Context**: Phase, Milestone, and Task descriptions
- **Codebase Context**: File paths, patterns, conventions
- **External Context**: Library documentation URLs, examples

#### 3. Task Specification

Clearly defines what the agent should accomplish.

```typescript
// From PRP_BUILDER_PROMPT (src/agents/prompts.ts lines 614-629)
## Mission: One-Pass Implementation Success

PRPs enable working code on the first attempt through:
- **Context Completeness**: Everything needed, nothing guessed
- **Progressive Validation**: 4-level gates catch errors early
- **Pattern Consistency**: Follow existing codebase approaches

**Your Goal**: Transform the PRP into working code that passes all validation gates.
```

**Task Specification Elements**:
- **Goal**: Clear statement of the desired outcome
- **Constraints**: Limitations on what the agent can do
- **Success Criteria**: Measurable definition of completion
- **Process**: Step-by-step approach to follow

#### 4. Output Format

Specifies the expected structure of the agent's response, typically using JSON schemas.

```typescript
// src/agents/prompts/architect-prompt.ts (lines 51-67)
export function createArchitectPrompt(prdContent: string): Prompt<Backlog> {
  return createPrompt({
    user: prdContent,
    system: TASK_BREAKDOWN_PROMPT,
    responseFormat: BacklogSchema,  // Type-safe JSON output
    enableReflection: true,
  });
}
```

**Output Format Elements**:
- **Schema Definition**: Zod schema for type-safe validation
- **File Output**: Path where output should be written
- **Format Requirements**: JSON structure, field naming, etc.

#### 5. Constraints and Quality Gates

Defines quality standards and validation requirements.

```typescript
// From TASK_BREAKDOWN_PROMPT (lines 52-81)
## CRITICAL CONSTRAINTS & STANDARD OF WORK (SOW)

### 1. RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)
- **VALIDATE BEFORE BREAKING DOWN:** You cannot plan what you do not understand.
- **SPAWN SUBAGENTS:** Use your tools to spawn agents to research the codebase and external documentation _before_ defining the hierarchy.

### 2. COHERENCE & CONTINUITY
- **NO VACUUMS:** You must ensure architectural flow. Subtasks must not exist in isolation.
- **EXPLICIT HANDOFFS:** If \`Subtask A\` defines a schema, \`Subtask B\` must be explicitly instructed to consume that schema.

### 3. IMPLICIT TDD & QUALITY
- **DO NOT** create subtasks for "Write Tests."
- **IMPLIED WORKFLOW:** Assume every subtask implies: _"Write the failing test -> Implement the code -> Pass the test."_
```

**Constraint Types**:
- **Process Constraints**: Workflow rules, step ordering
- **Scope Constraints**: What's in/out of scope
- **Output Constraints**: Required format and completeness
- **Quality Constraints**: Standards of work, validation requirements

---

## Role Definition and Persona

### Core Persona Elements

An effective agent persona consists of five essential components:

#### 1. Professional Identity

The persona's professional title and primary responsibility.

```typescript
// src/agents/prompts.ts
export const TASK_BREAKDOWN_PROMPT = `
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy: Phase > Milestone > Task > Subtask.
`;
```

**Best Practices**:
- Use specific professional titles (not generic "assistant")
- Define the expertise level (senior, principal, lead)
- Specify the domain scope (software architecture, QA, research)
- Include decision-making authority level

#### 2. Expertise Domain

The knowledge domain and capabilities the persona can draw upon.

**Architect Agent Expertise**:
- System design and architecture patterns
- Technology stack evaluation and selection
- Feasibility analysis and risk assessment
- Hierarchical task decomposition
- Cross-domain coordination (Security, DevOps, Backend, Frontend, QA)

**Researcher Agent Expertise**:
- Codebase pattern recognition
- External documentation research
- Library and framework analysis
- Context curation and documentation
- Dependency analysis

**Coder Agent Expertise**:
- Implementation and coding
- Pattern following and code style adherence
- Test writing and validation
- Debugging and error resolution
- Git workflow and version control

**QA Agent Expertise**:
- Creative bug hunting and adversarial testing
- End-to-end workflow validation
- Edge case identification
- User experience assessment
- Bug report generation

#### 3. Tone and Communication Style

How the persona expresses itself and interacts with users/other agents.

| Persona   | Tone                           | Characteristics                                           |
|-----------|--------------------------------|-----------------------------------------------------------|
| Architect | Authoritative, structured       | Uses hierarchical language, precise terminology            |
| Researcher| Thorough, methodical            | Explains reasoning, cites sources, detail-oriented        |
| Coder     | Pragmatic, implementation-focused| Direct, code-centric, pattern-following                   |
| QA        | Creative, adversarial           | Questioning, exploratory, bug-hunting mindset             |

**Example: QA Agent Tone**

```typescript
// src/agents/prompts.ts (lines 868-905)
export const BUG_HUNT_PROMPT = `
You are a creative QA engineer and bug hunter. Your mission is to rigorously test the implementation against the original PRD scope and find any issues that the standard validation might have missed.

### Phase 2: Creative End-to-End Testing
Think like a user, then think like an adversary. Test the implementation:
1. **Happy Path Testing**: Does the primary use case work as specified?
2. **Edge Case Testing**: What happens at boundaries? (empty inputs, max values, unicode, special chars)
3. **Adversarial Testing**: What could go wrong?
`;
```

#### 4. Constraints and Boundaries

Explicit limitations on what the persona can and cannot do.

```typescript
// Architect Agent Constraints
## CRITICAL CONSTRAINTS & STANDARD OF WORK (SOW)

### 1. RESEARCH-DRIVEN ARCHITECTURE
- **VALIDATE BEFORE BREAKING DOWN:** You cannot plan what you do not understand.
- **SPAWN SUBAGENTS:** Use tools to spawn agents for research before defining hierarchy.

### 2. COHERENCE & CONTINUITY
- **NO VACUUMS:** Subtasks must not exist in isolation.
- **EXPLICIT HANDOFFS:** If Subtask A defines a schema, Subtask B must consume it.

### 3. IMPLICIT TDD
- **DO NOT** create subtasks for "Write Tests."
- **IMPLIED WORKFLOW:** Assume every subtask implies TDD approach.

### 4. CONTEXT SCOPE BLINDER
- For every Subtask, define strict instructions for isolated development.
```

**Constraint Categories**:
- **Process Constraints**: Workflow rules, step ordering, validation gates
- **Scope Constraints**: What's in/out of scope for the persona
- **Output Constraints**: Required format, structure, completeness criteria
- **Interaction Constraints**: When to ask for help, when to delegate

#### 5. Motivation and Success Criteria

What drives the persona and how it measures success.

```typescript
// Researcher Agent Motivation
## PRP Creation Mission
Create a comprehensive PRP that enables **one-pass implementation success**
through systematic research and context curation.

**Critical Understanding**: Incomplete context = implementation failure.
Therefore: Your research directly determines implementation success.

// Coder Agent Motivation
## Mission: One-Pass Implementation Success
**Your Goal**: Transform the PRP into working code that passes all validation gates.

// QA Agent Motivation
## Your Mission
Rigorously test the implementation against the original PRD scope and find
issues that standard validation might have missed.
```

**Success Metrics**:
- **Architect**: Hierarchical decomposition completeness, feasibility validation
- **Researcher**: PRP enabling one-pass implementation success
- **Coder**: Code passing all 4 validation levels on first attempt
- **QA**: Critical bugs found before production, coverage completeness

### Persona Configuration

The PRP Pipeline uses the agent factory pattern to create personas with consistent configuration:

```typescript
// src/agents/agent-factory.ts (lines 150-176)
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  const model = getModel('sonnet'); // All personas use sonnet → GLM-4.7

  // PATTERN: Persona-specific naming (PascalCase with "Agent" suffix)
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;

  // PATTERN: Readonly configuration object for immutability
  return {
    name,
    system: `You are a ${persona} agent.`,
    model,
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      // CRITICAL: Map environment variables for SDK compatibility
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}
```

**Persona Token Limits**:

```typescript
// src/agents/agent-factory.ts (lines 118-123)
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,  // Higher limit for complex strategic reasoning
  researcher: 4096,  // Medium for contextual research
  coder: 4096,       // Medium for tactical implementation
  qa: 4096,          // Medium for validation testing
} as const;
```

---

## Process Instruction Patterns

### Four Instruction Patterns

The PRP Pipeline uses four primary process instruction patterns:

#### 1. Sequential Steps

Linear step-by-step instructions where each step depends on the previous one.

**Example: PRP Execution Process**

```typescript
// From PRP_BUILDER_PROMPT (src/agents/prompts.ts lines 630-669)
## Execution Process

1. **Load PRP (CRITICAL FIRST STEP)**
   - **ACTION**: Use the \`Read\` tool to read the PRP file at the path provided
   - You MUST read this file before doing anything else
   - Absorb all context, patterns, requirements

2. **ULTRATHINK & Plan**
   - Create comprehensive implementation plan following the PRP's task order
   - Break down into clear todos using TodoWrite tool
   - Follow the patterns referenced in the PRP

3. **Execute Implementation**
   - Follow the PRP's Implementation Tasks sequence
   - Use the patterns and examples referenced in the PRP
   - Create files in locations specified by the desired codebase tree

4. **Progressive Validation**
   - Execute the level validation system from the PRP
   - Each level must pass before proceeding to the next

5. **Completion Verification**
   - Work through the Final Validation Checklist in the PRP
   - Verify all Success Criteria from the "What" section are met
```

**Best Practices for Sequential Instructions**:
- Number steps clearly (1, 2, 3...)
- Make dependencies explicit ("Each level must pass before proceeding")
- Use imperative mood ("Load", "Create", "Verify")
- Include completion criteria for each step

#### 2. Conditional Branching

Instructions that include decision points and alternative paths.

**Example: PRP Research Process with User Clarification**

```typescript
// From PRP_BLUEPRINT_PROMPT (src/agents/prompts.ts lines 241-253)
### Step 4: User Clarification
   - **Ask for clarification if you need it**
   - **If no testing framework is found, ask the user if they would like to set one up**
   - If a fundamental misalignment of objectives across work items is detected, halt and produce a thorough explanation of the problem at a 10th grade level

### Step 5: ULTRATHINK Before Writing
After research completion, create comprehensive PRP writing plan using TodoWrite tool:
- Plan how to structure each template section with your research findings
- Identify gaps that need additional research
```

**Best Practices for Conditional Instructions**:
- Use explicit conditions ("If X, then Y")
- Define fallback behavior
- Include escalation criteria ("halt and produce explanation")
- Provide guidance for decision-making

#### 3. Parallel Work

Instructions for spawning subagents to work on tasks concurrently.

**Example: Architect Agent Research Instructions**

```typescript
// From TASK_BREAKDOWN_PROMPT (src/agents/prompts.ts lines 84-92)
## PROCESS

ULTRATHINK & PLAN

1. **ANALYZE** the attached or referenced PRD.
2. **RESEARCH (SPAWN & VALIDATE):**
   - **Spawn** subagents to map the codebase and verify PRD feasibility.
   - **Spawn** subagents to find external documentation for new tech.
   - **Store** findings in \`$SESSION_DIR/architecture/\` (e.g., \`system_context.md\`, \`external_deps.md\`).
3. **DETERMINE** the highest level of scope (Phase, Milestone, or Task).
4. **DECOMPOSE** strictly downwards to the Subtask level, using your research to populate the \`context_scope\`.
```

**Example: Researcher Agent Parallel Research**

```typescript
// From PRP_BLUEPRINT_PROMPT (lines 217-244)
## Research Process

> During the research process, create clear tasks and spawn as many agents and subagents as needed using the batch tools. The deeper research we do here the better the PRP will be.

1. **Codebase Analysis in depth**
   - Create clear todos and spawn subagents to search the codebase for similar features/patterns
   - Use the batch tools to spawn subagents to search the codebase

2. **External Research at scale**
   - Create clear todos and spawn subagents with instructions to do deep research online
   - Include urls to documentation and examples
```

**Best Practices for Parallel Instructions**:
- Use batch tools for efficiency
- Define clear task boundaries for each subagent
- Specify aggregation method for results
- Set expectations for coordination

#### 4. Hierarchical Decomposition

Instructions for breaking down complex tasks into sub-components.

**Example: Task Hierarchy Decomposition**

```typescript
// From TASK_BREAKDOWN_PROMPT (lines 42-47)
## HIERARCHY DEFINITIONS

- **PHASE:** Project-scope goals (e.g., MVP, V1.0). _Weeks to months._
- **MILESTONE:** Key objectives within a Phase. _1 to 12 weeks._
- **TASK:** Complete features within a Milestone. _Days to weeks._
- **SUBTASK:** Atomic implementation steps. **0.5, 1, or 2 Story Points (SP).** (Max 2 SP, do not break subtasks down further than 2 SP unless required).
```

**Best Practices for Hierarchical Instructions**:
- Define level boundaries clearly
- Specify story point guidelines
- Include decomposition criteria
- Set limits on depth (e.g., "Max 2 SP")

### Process Instruction Best Practices

**DO**:

```typescript
// 1. Clear Step Numbering
## Execution Process
1. Load PRP (CRITICAL FIRST STEP)
2. ULTRATHINK & Plan
3. Execute Implementation

// 2. Explicit Dependencies
// Each level must pass before proceeding to the next

// 3. Actionable Verbs
- ANALYZE the PRD
- SPAWN subagents for research
- DECOMPOSE into hierarchy

// 4. Completion Criteria
- [ ] All validation levels completed successfully
- [ ] All tests pass
```

**DON'T**:

```typescript
// 1. Vague Instructions
// ❌ "Do some research and then implement"
// ✅ "Step 1: Codebase Analysis → Step 2: External Research → Step 3: PRP Generation"

// 2. Missing Dependencies
// ❌ "Validate the code"
// ✅ "Run ruff check, mypy, pytest, and integration tests before completion"

// 3. No Success Criteria
// ❌ "Implement this feature"
// ✅ "Transform the PRP into working code that passes all 4 validation levels"
```

---

## Output Format Specification

### JSON Schema with Zod

The PRP Pipeline uses Zod schemas for type-safe structured output. This ensures LLM responses conform to expected formats and enables compile-time type checking.

**Schema Definition Pattern**:

```typescript
// src/core/models.ts (lines 709-711)
export const BacklogSchema: z.ZodType<Backlog> = z.array(
  z.lazy(() => PhaseSchema)
);
```

**Type Inference**:

```typescript
// Define schema first
const LLMSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()),
});

// Infer TypeScript type
type LLMResponse = z.infer<typeof LLMSchema>;
// Result: { title: string; content: string; tags: string[] }
```

### Groundswell Prompt Creation

The PRP Pipeline uses Groundswell's `createPrompt()` API for structured output:

```typescript
// src/agents/prompts/architect-prompt.ts (lines 51-67)
export function createArchitectPrompt(prdContent: string): Prompt<Backlog> {
  return createPrompt({
    // The user prompt is the PRD content to analyze
    user: prdContent,

    // The system prompt is the LEAD TECHNICAL ARCHITECT persona
    system: TASK_BREAKDOWN_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against this schema
    responseFormat: BacklogSchema,

    // CRITICAL: Enable reflection for complex task decomposition
    // Reflection provides error recovery for multi-level JSON generation
    enableReflection: true,
  });
}
```

**Groundswell Prompt Configuration**:

```typescript
interface PromptConfig<T> {
  user: string;                           // Required: user message
  data?: Record<string, unknown>;         // Optional: structured data
  responseFormat: z.ZodType<T>;           // Required: response schema
  system?: string;                        // Optional: system prompt override
  tools?: Tool[];                         // Optional: tools override
  mcps?: MCPServer[];                     // Optional: MCPs override
  enableReflection?: boolean;             // Optional: enable reflection
}
```

### File Output Specifications

Some prompts require writing output to specific files rather than returning structured data.

**Example: Architect Agent File Output**

```typescript
// From TASK_BREAKDOWN_PROMPT (lines 119-145)
**CONSTRAINT:** You MUST write the JSON to the file \`./$TASKS_FILE\` (in the CURRENT WORKING DIRECTORY - do NOT search for or use any other tasks.json files from other projects/directories).

Do NOT output JSON to the conversation - WRITE IT TO THE FILE at path \`./$TASKS_FILE\`.

Use your file writing tools to create \`./$TASKS_FILE\` with this structure:

\`\`\`json
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P[#]",
      "title": "Phase Title",
      "status": "Planned | Researching | Ready | Implementing | Complete | Failed",
      "description": "High level goal.",
      "milestones": [...]
    }
  ]
}
\`\`\`
```

**File Output Pattern**:
1. **Explicit Path**: Specify exact file path
2. **Format Requirement**: Define expected format (JSON, markdown, etc.)
3. **Constraints**: Limit what should be written (e.g., "Do NOT output to conversation")
4. **Validation**: Include schema or structure requirements

### Few-Shot Examples

Including examples in prompts dramatically improves structured output accuracy.

**Pattern: Include Examples in System Prompt**

```typescript
// From DELTA_ANALYSIS_PROMPT (src/agents/prompts.ts lines 805-854)
## Few-Shot Examples

### Example 1: Added Requirement
**Old PRD:** \`## P1.M2.T3: User Authentication\nImplement login.\`
**New PRD:** \`## P1.M2.T3: User Authentication\nImplement login with OAuth2 support.\`

**Output:**
\`\`\`json
{
  "changes": [{
    "itemId": "P1.M2.T3",
    "type": "modified",
    "description": "Added OAuth2 authentication requirement",
    "impact": "Must expand authentication system to support OAuth2 providers"
  }],
  "patchInstructions": "Re-execute P1.M2.T3 and subtasks for OAuth2 integration",
  "taskIds": ["P1.M2.T3", "P1.M2.T3.S1", "P1.M2.T3.S2"]
}
\`\`\`
```

**Few-Shot Best Practices**:
1. **Show 2-4 examples**: More examples can confuse the LLM, fewer may not demonstrate patterns
2. **Cover edge cases**: Include examples that show handling of empty arrays, null values, etc.
3. **Use realistic data**: Examples should match the complexity of real inputs
4. **Label examples clearly**: Use "Example 1", "Example 2" for clarity
5. **Maintain consistency**: All examples should follow the same format

### Data Injection with XML-like Formatting

Groundswell supports structured data injection using XML-like formatting:

```typescript
const prompt = createPrompt({
  user: 'Analyze the following code for security issues',
  data: {
    code: 'const x = eval(userInput);',
    language: 'javascript',
  },
  responseFormat: analysisSchema,
});

// Data is formatted as XML-like sections:
// Analyze the following code for security issues
//
// <code>
// "const x = eval(userInput);"
// </code>
//
// <language>
// "javascript"
// </language>
```

**Data Injection Best Practices**:
- Use `data` property for structured context
- Keep user prompt focused on instructions
- Separate configuration from instructions
- Use immutable variations with `withData()`

---

## Quality Enforcement Techniques

### Reflection and Self-Correction

Groundswell provides a multi-level reflection system for error recovery:

#### Level 1: Prompt-Level Reflection

```typescript
const prompt = createPrompt({
  user: 'Complex analysis task',
  enableReflection: true,  // Auto-retry on validation failure
  responseFormat: StrictAnswerSchema,
});

// If schema validation fails, Groundswell:
// 1. Captures validation errors
// 2. Retries with error feedback
// 3. Continues until max attempts reached
```

**When to Use Reflection**:
- Complex schema validation (nested objects, strict constraints)
- Multi-step reasoning tasks
- High-stakes outputs where accuracy is critical
- Tasks with potential for hallucination

**When NOT to Use Reflection**:
- Simple classification tasks
- High-volume, low-latency requirements
- Idempotent operations where retry is wasteful

#### Level 2: Agent-Level Reflection

```typescript
const agent = createAgent({
  name: 'ReflectiveAgent',
  enableReflection: true,
});

const result = await agent.reflect(prompt);
```

#### Level 3: Workflow-Level Reflection

```typescript
import { executeWithReflection, ReflectionManager } from 'groundswell';

const reflectionManager = new ReflectionManager(
  createReflectionConfig({ enabled: true, maxAttempts: 3 })
);

await executeWithReflection(
  () => unreliableStep(),
  reflectionManager,
  (error, attempt, history) => ({
    level: 'workflow',
    failedNode: mockNode,
    error,
    attemptNumber: attempt,
    previousAttempts: history
  })
);
```

### 4-Level Progressive Validation System

The PRP Pipeline uses a progressive validation system with increasing strictness:

**Level 1: Syntax & Style (Immediate Feedback)**

```bash
# Run after each file creation - fix before proceeding
ruff check src/{new_files} --fix     # Auto-format and fix linting issues
mypy src/{new_files}                 # Type checking with specific files
ruff format src/{new_files}          # Ensure consistent formatting

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

**Level 2: Unit Tests (Component Validation)**

```bash
# Test each component as it's created
uv run pytest src/services/tests/test_{domain}_service.py -v

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

**Level 3: Integration Testing (System Validation)**

```bash
# Service startup validation
uv run python main.py &
sleep 3  # Allow startup time

# Health check validation
curl -f http://localhost:8000/health || echo "Service health check failed"

# Expected: All integrations working, proper responses, no connection errors
```

**Level 4: Creative & Domain-Specific Validation**

```bash
# MCP Server Validation
playwright-mcp --url http://localhost:8000 --test-user-journey

# Performance Testing
ab -n 100 -c 10 http://localhost:8000/{endpoint}

# Security Scanning
bandit -r src/

# Expected: All creative validations pass, performance meets requirements
```

### "No Prior Knowledge" Test Methodology

The "No Prior Knowledge" test validates that a prompt contains all necessary context for someone unfamiliar with the codebase to implement successfully.

**Test Application**:

```typescript
// From PRP Blueprint Template
### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_
```

**Test Criteria**:
- [ ] Passes "No Prior Knowledge" test from template
- [ ] All YAML references are specific and accessible
- [ ] Implementation tasks include exact naming and placement guidance
- [ ] Validation commands are project-specific and verified working

### Comprehensive Validation Checklists

Each prompt includes a final validation checklist to ensure quality:

**Example: PRP Builder Validation Checklist**

```typescript
// From PRP Template (lines 560-592)
## Final Validation Checklist

### Technical Validation
- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `uv run pytest src/ -v`
- [ ] No linting errors: `uv run ruff check src/`
- [ ] No type errors: `uv run mypy src/`
- [ ] No formatting issues: `uv run ruff format src/ --check`

### Feature Validation
- [ ] All success criteria from "What" section met
- [ ] Manual testing successful: [specific commands from Level 3]
- [ ] Error cases handled gracefully with proper error messages
- [ ] Integration points work as specified
- [ ] User persona requirements satisfied (if applicable)

### Code Quality Validation
- [ ] Follows existing codebase patterns and naming conventions
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (check against Anti-Patterns section)
- [ ] Dependencies properly managed and imported
- [ ] Configuration changes properly integrated

### Documentation & Deployment
- [ ] Code is self-documenting with clear variable/function names
- [ ] Logs are informative but not verbose
- [ ] Environment variables documented if new ones added
```

---

## Prompt Iteration and Testing

### Iterative Improvement Process

Prompt development follows an iterative cycle:

```
Draft Prompt → Test with Examples → Analyze Failures → Refine → Retest
```

**Iteration Process**:

1. **Draft Initial Prompt**: Based on requirements and patterns
2. **Test with Examples**: Run with sample inputs
3. **Analyze Failures**: Identify where prompt fails
4. **Refine**: Add constraints, examples, or clarification
5. **Retest**: Validate improvements

### A/B Testing Framework Concepts

When comparing prompt variations:

**Control Variables**:
- Same test inputs
- Same model and temperature
- Same evaluation criteria

**Test Variables**:
- Different prompt wording
- Different example sets
- Different constraint structures

**Metrics**:
- Success rate (output passes validation)
- Quality score (human-rated)
- Token usage (efficiency)
- Latency (time to generate)

### Test Case Design

**Test Case Categories**:

**1. Happy Path Tests**: Typical expected inputs

```typescript
// Test: Normal PRD that generates standard task hierarchy
const testPRD = `
# Feature: User Authentication
Implement OAuth2 login with Google and GitHub providers.
`;
```

**2. Edge Cases**: Boundary conditions and unusual inputs

```typescript
// Test: PRD with minimal information
const minimalPRD = `
# Feature: Login
Add login.
`;
```

**3. Error Cases**: Invalid or problematic inputs

```typescript
// Test: PRD with contradictory requirements
const contradictoryPRD = `
# Feature: Instant Login
Login must be instant but also have 2FA with email verification.
`;
```

### Performance Metrics and Success Criteria

**Quantitative Metrics**:

| Metric        | Target                     | Measurement Method         |
|---------------|----------------------------|----------------------------|
| **Success Rate** | >95% (pass validation)   | Automated test suite       |
| **Quality Score** | >4/5 (human-rated)       | Human evaluation sample    |
| **Token Efficiency** | <5000 tokens avg     | Token usage tracking       |
| **Latency** | <30s average             | Execution time monitoring  |

**Qualitative Criteria**:

- Output follows expected format exactly
- Content is accurate and complete
- Edge cases handled appropriately
- Tone matches persona expectations
- Instructions followed precisely

---

## Four Critical Prompts

### 1. Task Breakdown Prompt (Architect Agent)

**Purpose**: Analyzes PRDs and generates hierarchical task backlogs

**Location**: `src/agents/prompts.ts` (lines 33-146)

**Role**: LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

**Key Characteristics**:
- Research-driven architecture validation
- Hierarchical decomposition (Phase > Milestone > Task > Subtask)
- Strict context_scope requirements for subtasks
- Implicit TDD (no separate "write tests" tasks)

**Prompt Generator**: `src/agents/prompts/architect-prompt.ts`

```typescript
export function createArchitectPrompt(prdContent: string): Prompt<Backlog> {
  return createPrompt({
    user: prdContent,
    system: TASK_BREAKDOWN_PROMPT,
    responseFormat: BacklogSchema,
    enableReflection: true,
  });
}
```

**Output Schema**: `BacklogSchema` (array of Phase objects with nested milestones, tasks, subtasks)

**Critical Constraints**:
1. Research-driven: Must validate PRD through codebase research before planning
2. Coherence: Subtasks must not exist in isolation, explicit handoffs required
3. Implicit TDD: Testing assumed in every subtask
4. Context scope: Strict instructions for isolated development

**Key Process Instructions**:

```markdown
## PROCESS
ULTRATHINK & PLAN

1. **ANALYZE** the attached or referenced PRD.
2. **RESEARCH (SPAWN & VALIDATE):**
   - **Spawn** subagents to map the codebase and verify PRD feasibility.
   - **Spawn** subagents to find external documentation for new tech.
   - **Store** findings in `$SESSION_DIR/architecture/`
3. **DETERMINE** the highest level of scope (Phase, Milestone, or Task).
4. **DECOMPOSE** strictly downwards to the Subtask level.
```

---

### 2. PRP Creation Prompt (Researcher Agent)

**Purpose**: Generates comprehensive Product Requirement Prompts for subtasks

**Location**: `src/agents/prompts.ts` (lines 157-603)

**Role**: Context Curation Specialist

**Key Characteristics**:
- Systematic research (codebase + internal + external)
- PRP template-based generation
- Context completeness validation
- Information density optimization

**Prompt Generator**: `src/agents/prompts/prp-blueprint-prompt.ts`

```typescript
export function createPRPBlueprintPrompt(
  task: Task | Subtask,
  backlog: Backlog,
  codebasePath?: string
): Prompt<PRPDocument> {
  return createPrompt({
    user: constructUserPrompt(task, backlog, codebasePath),
    system: PRP_BLUEPRINT_PROMPT,
    responseFormat: PRPDocumentSchema,
    enableReflection: true,
  });
}
```

**Context Injection**:
- Task information (title, description, dependencies)
- Parent context (Phase, Milestone, Task descriptions)
- Codebase path for analysis
- PRP template structure

**Output Schema**: `PRPDocumentSchema` (structured PRP with goal, context, implementation tasks, validation gates)

**Critical Constraints**:
1. One-pass implementation success goal
2. "No Prior Knowledge" test requirement
3. Specific URLs with section anchors (not just domains)
4. Project-specific validation commands

**Key Process Instructions**:

```markdown
## Research Process

1. **Codebase Analysis in depth**
   - Spawn subagents to search codebase for similar features/patterns
   - Use batch tools for parallel research

2. **Internal Research at scale**
   - Use plan/architecture directory documentation
   - Respect scope boundaries

3. **External Research at scale**
   - Library documentation with specific URLs
   - Implementation examples from GitHub/StackOverflow
   - Best practices and common pitfalls

4. **User Clarification**
   - Ask if no testing framework found
   - Halt if fundamental misalignment detected
```

---

### 3. PRP Execution Prompt (Coder Agent)

**Purpose**: Executes PRPs to implement code changes

**Location**: `src/agents/prompts.ts` (lines 614-685)

**Role**: Implementation Specialist

**Key Characteristics**:
- One-pass implementation success focus
- Progressive validation (4-level gates)
- Pattern-following approach
- Failure protocol with fix guidance

**System Prompt**: `PRP_BUILDER_PROMPT` (used directly in PRP execution)

**Key Instructions**:

```markdown
## Mission: One-Pass Implementation Success

PRPs enable working code on the first attempt through:
- **Context Completeness**: Everything needed, nothing guessed
- **Progressive Validation**: 4-level gates catch errors early
- **Pattern Consistency**: Follow existing codebase approaches

## Execution Process

1. **Load PRP (CRITICAL FIRST STEP)**
   - Use Read tool to read PRP file
   - Absorb all context, patterns, requirements

2. **ULTRATHINK & Plan**
   - Create comprehensive implementation plan
   - Use TodoWrite tool for task breakdown

3. **Execute Implementation**
   - Follow PRP's Implementation Tasks sequence
   - Use patterns and examples from PRP

4. **Progressive Validation**
   - Execute 4-level validation system
   - Each level must pass before proceeding

5. **Completion Verification**
   - Work through Final Validation Checklist
   - Verify all Success Criteria are met

**Failure Protocol**: When validation fails, use patterns and gotchas from PRP to fix issues, then re-run validation.
```

**Output Format**: JSON result object

```json
{
   "result": "success" | "error" | "issue",
   "message": "Detailed explanation of the issue"
}
```

---

### 4. Bug Finding Prompt (QA Agent)

**Purpose**: Performs creative bug hunting and comprehensive validation

**Location**: `src/agents/prompts.ts` (lines 868-979)

**Role**: Creative QA Engineer and Bug Hunter

**Key Characteristics**:
- Adversarial testing mindset
- 4-phase testing process (scope, E2E, adversarial, report)
- Bug severity classification
- File-based signaling (TEST_RESULTS.md presence/absence)

**Prompt Generator**: `src/agents/prompts/bug-hunt-prompt.ts`

```typescript
export function createBugHuntPrompt(
  prd: string,
  completedTasks: Task[]
): Prompt<TestResults> {
  return createPrompt({
    user: constructUserPrompt(prd, completedTasks),
    system: BUG_HUNT_PROMPT,
    responseFormat: TestResultsSchema,
    enableReflection: true,
  });
}
```

**Context Injection**:
- Original PRD content
- Completed tasks list (for context)

**Testing Phases**:

```markdown
### Phase 1: PRD Scope Analysis
1. Read and deeply understand the original PRD requirements
2. Map each requirement to what should have been implemented
3. Identify expected user journeys and workflows
4. Note edge cases or corner cases implied by requirements

### Phase 2: Creative End-to-End Testing
Think like a user, then think like an adversary:
1. **Happy Path Testing**: Primary use case
2. **Edge Case Testing**: Boundaries, empty inputs, unicode
3. **Workflow Testing**: Complete user journey
4. **Integration Testing**: Component interactions
5. **Error Handling**: Graceful failures
6. **State Testing**: State transitions
7. **Concurrency Testing**: Parallel operations
8. **Regression Testing**: Did fixing break anything?

### Phase 3: Adversarial Testing
Think creatively about what could go wrong:
1. **Unexpected Inputs**: Undefined scenarios
2. **Missing Features**: PRD requirements not implemented
3. **Incomplete Features**: Partial implementations
4. **Implicit Requirements**: Obvious but unstated
5. **User Experience Issues**: Usability problems

### Phase 4: Documentation as Bug Report
Write structured bug report to `./$BUG_RESULTS_FILE`
```

**Critical File Signaling**:

```markdown
## Output - IMPORTANT

- **If you find Critical or Major bugs**: You MUST write the bug report to `./$BUG_RESULTS_FILE`
- **If you find NO Critical or Major bugs**: Do NOT write any file. Leave no trace.

This is imperative. The presence or absence of the bug report file controls the entire bugfix pipeline.
```

---

## See Also

### Project Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Multi-agent architecture overview and system design
- **[GROUNDSWELL_GUIDE.md](./GROUNDSWELL_GUIDE.md)** - Groundswell framework integration and prompt creation API
- **[WORKFLOWS.md](./WORKFLOWS.md)** - Pipeline workflow documentation and lifecycle
- **[CLI_REFERENCE.md](./CLI_REFERENCE.md)** - Command-line interface reference

### System Prompts and Source Files

- **[PROMPTS.md](../PROMPTS.md)** - Complete prompt definitions used by workflows (authoritative source)
- **[src/agents/prompts.ts](../src/agents/prompts.ts)** - TypeScript export of all system prompts
- **[src/agents/agent-factory.ts](../src/agents/agent-factory.ts)** - Agent factory with persona configurations

### Prompt Generator Implementations

- **[src/agents/prompts/architect-prompt.ts](../src/agents/prompts/architect-prompt.ts)** - Task Breakdown prompt generator
- **[src/agents/prompts/prp-blueprint-prompt.ts](../src/agents/prompts/prp-blueprint-prompt.ts)** - PRP Creation prompt generator
- **[src/agents/prompts/bug-hunt-prompt.ts](../src/agents/prompts/bug-hunt-prompt.ts)** - Bug Finding prompt generator
- **[src/agents/prompts/delta-analysis-prompt.ts](../src/agents/prompts/delta-analysis-prompt.ts)** - Delta Analysis prompt generator

### External Resources

- **[Anthropic Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)** - Official prompt engineering best practices
- **[OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)** - Prompt structure and examples
- **[Groundswell Framework](https://github.com/anthropics/groundswell)** - Agentic workflow primitives and prompt utilities

### Research Documents (Internal)

These research documents were consulted during the creation of this guide and contain additional depth on specific topics:

- **[prompt-engineering-best-practices.md](../plan/003_b3d3efdaf0ed/P2M2T1S3/research/prompt-engineering-best-practices.md)** - Comprehensive research on prompt structure, personas, and patterns
- **[structured-output-techniques.md](../plan/003_b3d3efdaf0ed/P2M2T1S3/research/structured-output-techniques.md)** - Groundswell-specific patterns for JSON output and reflection
- **[agent-persona-patterns.md](../plan/003_b3d3efdaf0ed/P2M2T1S3/research/agent-persona-patterns.md)** - Multi-agent systems and persona design patterns

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-23
**Maintainer**: PRP Pipeline Team
