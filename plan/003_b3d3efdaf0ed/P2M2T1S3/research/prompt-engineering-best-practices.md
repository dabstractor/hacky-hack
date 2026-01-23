# Prompt Engineering Best Practices for AI Agent Development

**Research Date:** 2025-01-23
**Focus:** Comprehensive guide for designing effective prompts for AI agent systems
**Sources:** Industry leaders (OpenAI, Anthropic, Google DeepMind), codebase analysis, and established patterns

---

## Table of Contents

1. [Prompt Structure and Components](#1-prompt-structure-and-components)
2. [Role Definition and Persona](#2-role-definition-and-persona)
3. [Process Instruction Patterns](#3-process-instruction-patterns)
4. [Output Format Specification](#4-output-format-specification)
5. [Quality Enforcement Techniques](#5-quality-enforcement-techniques)
6. [Prompt Iteration and Testing](#6-prompt-iteration-and-testing)
7. [Common Pitfalls to Avoid](#7-common-pitfalls-to-avoid)
8. [Code Examples from Production](#8-code-examples-from-production)

---

## 1. Prompt Structure and Components

### 1.1 Key Components of Effective Prompts

Based on analysis of production systems and industry best practices, effective prompts for AI agents should include these essential components:

#### **A. Role/Persona Definition**
**Purpose:** Establish the agent's identity, expertise level, and behavioral boundaries

**Best Practices:**
- Use clear, descriptive role titles (e.g., "Lead Technical Architect" not "Helper")
- Specify expertise level (senior, expert, specialist)
- Define the scope of authority and knowledge
- Set behavioral expectations (tone, decision-making approach)

**Example from Production:**
```markdown
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy.
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L54-61`

#### **B. Context and Background Information**
**Purpose:** Provide necessary background without overwhelming the context window

**Best Practices:**
- Include only relevant, actionable context
- Use structured formats (YAML, JSON) for complex data
- Provide specific file paths, not generic references
- Include "gotchas" and known constraints

**Example Pattern:**
```markdown
## Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Documentation & References

\`\`\`yaml
# MUST READ - Include these in your context window
- url: [Complete URL with section anchor]
  why: [Specific methods/concepts needed for implementation]
  critical: [Key insights that prevent common implementation errors]

- file: [exact/path/to/pattern/file.py]
  why: [Specific pattern to follow - class structure, error handling, etc.]
  pattern: [Brief description of what pattern to extract]
  gotcha: [Known constraints or limitations to avoid]
\`\`\`
```

#### **C. Task Specification**
**Purpose:** Clearly define what needs to be accomplished

**Best Practices:**
- Use imperative mood ("Analyze", "Create", "Implement")
- Break complex tasks into numbered steps
- Specify dependencies and prerequisites
- Define completion criteria

**Example Pattern:**
```markdown
## Process

ULTRATHINK & PLAN

1. **ANALYZE** the attached or referenced PRD.
2. **RESEARCH (SPAWN & VALIDATE):**
   - **Spawn** subagents to map the codebase and verify PRD feasibility.
   - **Spawn** subagents to find external documentation for new tech.
   - **Store** findings in `$SESSION_DIR/architecture/`.
3. **DETERMINE** the highest level of scope (Phase, Milestone, or Task).
4. **DECOMPOSE** strictly downwards to the Subtask level.
```

#### **D. Output Format Specification**
**Purpose:** Define exactly how the response should be structured

**Best Practices:**
- Provide concrete examples of expected output
- Use JSON schemas for structured data
- Specify file paths when output should be written
- Include validation criteria

**Example Pattern:**
```markdown
## Output Format

**CONSTRAINT:** You MUST write the JSON to the file `./$TASKS_FILE`.

Use your file writing tools to create `./$TASKS_FILE` with this structure:

\`\`\`json
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P[#]",
      "title": "Phase Title",
      "status": "Planned | Researching | Ready | Implementing | Complete | Failed"
    }
  ]
}
\`\`\`
```

#### **E. Constraints and Boundaries**
**Purpose:** Define what the agent should NOT do

**Best Practices:**
- List explicit prohibitions
- Define scope boundaries clearly
- Specify resource constraints (time, tokens, files)
- Include anti-patterns to avoid

**Example Pattern:**
```markdown
## CRITICAL CONSTRAINTS & STANDARD OF WORK (SOW)

### 1. RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)
- **VALIDATE BEFORE BREAKING DOWN:** You cannot plan what you do not understand.
- **SPAWN SUBAGENTS:** Use your tools to spawn agents to research the codebase.
- **REALITY CHECK:** Verify that the PRD's requests match the current codebase state.
```

#### **F. Examples and Few-Shot Learning**
**Purpose:** Demonstrate expected behavior through concrete examples

**Best Practices:**
- Provide 2-5 diverse examples
- Show edge cases and error conditions
- Include "negative examples" (what NOT to do)
- Explain why each example is good/bad

**Example Pattern:**
```markdown
## Few-Shot Examples

### Example 1: Added Requirement
**Old PRD:** `## P1.M2.T3: User Authentication\nImplement login.`
**New PRD:** `## P1.M2.T3: User Authentication\nImplement login with OAuth2 support.`

**Output:**
\`\`\`json
{
  "changes": [{
    "itemId": "P1.M2.T3",
    "type": "modified",
    "description": "Added OAuth2 authentication requirement"
  }]
}
\`\`\`
```

#### **G. Quality Gates and Validation**
**Purpose:** Ensure output meets standards before completion

**Best Practices:**
- Define specific validation criteria
- Include automated checks
- Specify manual review steps
- Provide feedback mechanisms

**Example Pattern:**
```markdown
## Final Validation Checklist

### Technical Validation
- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `uv run pytest src/ -v`
- [ ] No linting errors: `uv run ruff check src/`
- [ ] No type errors: `uv run mypy src/`
```

---

## 2. Role Definition and Persona

### 2.1 Crafting Effective Agent Personas

#### **Core Persona Elements**

**1. Professional Identity**
- **Job Title:** Specific, not generic
  - ✅ "Senior Software Architect specializing in distributed systems"
  - ❌ "Code Helper"

- **Expertise Level:** Define experience and capability
  - Years of experience (e.g., "15+ years in production systems")
  - Domain expertise (e.g., "expert in Rust async/await patterns")
  - Decision-making authority (e.g., "can make architectural trade-offs")

**2. Behavioral Characteristics**
- **Communication Style:** How the agent expresses itself
  - Tone: Professional, direct, conversational
  - Verbosity: Concise vs. detailed
  - Format: Structured, bulleted, narrative

- **Decision-Making Approach:** How choices are made
  - Analytical vs. intuitive
  - Conservative vs. aggressive
  - Speed vs. accuracy trade-offs

**3. Scope and Boundaries**
- **Domain of Expertise:** What the agent knows
- **Limitations:** What the agent doesn't know or shouldn't do
- **Resources Available:** Tools, documentation, external systems

#### **Production Persona Example**

**The Architect Persona:**
```markdown
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy: Phase > Milestone > Task > Subtask.

## Characteristics
- **Authority:** Can make architectural decisions and trade-offs
- **Thoroughness:** Researches deeply before committing to decisions
- **Standards:** Enforces best practices across all domains
- **Communication:** Structured, hierarchical, precise
- **Validation:** Verifies feasibility before planning

## Constraints
- Cannot plan without understanding current codebase state
- Must validate assumptions through research
- Must preserve coherence across task boundaries
- Must respect story point limits (max 2 SP per subtask)
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L54-116`

#### **The Researcher Persona:**
```markdown
# Create PRP for Work Item

## Mission
Create a comprehensive PRP that enables **one-pass implementation success** through systematic research and context curation.

**Critical Understanding:**
The executing AI agent only receives:
- The PRP content you create
- Its training data knowledge
- Access to codebase files (but needs guidance on which ones)

**Therefore:** Your research and context curation directly determines implementation success. Incomplete context = implementation failure.

## Research Approach
> During the research process, create clear tasks and spawn as many agents and subagents as needed using the batch tools. The deeper research we do here the better the PRP will be. We optimize for chance of success, not for speed.

## Characteristics
- **Thoroughness:** Explores multiple research paths in parallel
- **Validation:** Cross-references findings across sources
- **Specificity:** Finds exact URLs, file paths, code examples
- **Documentation:** Stores all findings for reference
- **Quality Standards:** Applies "No Prior Knowledge" test to all research
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L189-244`

#### **The QA/Tester Persona:**
```markdown
# Creative Bug Finding - End-to-End PRD Validation

You are a creative QA engineer and bug hunter. Your mission is to rigorously test the implementation against the original PRD scope and find any issues that the standard validation might have missed.

## Characteristics
- **Adversarial Thinking:** Thinks like a user, then like an attacker
- **Creativity:** Explores edge cases and unexpected scenarios
- **Thoroughness:** Tests everything, documents everything
- **User-Centric:** Focuses on real-world usage patterns
- **Constructive:** Frames issues as improvements, not criticisms

## Testing Approach
1. **Happy Path Testing:** Primary use cases
2. **Edge Case Testing:** Boundaries, empty inputs, special characters
3. **Workflow Testing:** Complete user journeys
4. **Integration Testing:** All pieces working together
5. **Error Handling:** Graceful failure modes
6. **State Testing:** State transitions
7. **Concurrency Testing:** Parallel operations
8. **Regression Testing:** Did fixing one thing break another?
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L1059-1105`

### 2.2 Persona Design Principles

#### **Principle 1: Specificity Over Generality**
```markdown
❌ Bad: "You are a helpful coding assistant."
✅ Good: "You are a Senior Software Architect with 15+ years of experience in distributed systems, specializing in Rust async/await patterns and microservices architecture."
```

#### **Principle 2: Define Decision-Making Framework**
```markdown
## Decision-Making Approach

**When faced with trade-offs:**
1. Prioritize long-term maintainability over short-term speed
2. Choose established patterns over novel approaches
3. Favor simplicity over cleverness
4. Consider security, performance, and testability equally
5. Document rationale for significant decisions
```

#### **Principle 3: Set Behavioral Boundaries**
```markdown
## What You Should Do
- Research thoroughly before planning
- Validate assumptions with evidence
- Follow existing codebase patterns
- Ask for clarification when uncertain

## What You Should NOT Do
- Don't guess or make assumptions
- Don't create new patterns when existing ones work
- Don't skip validation because "it should work"
- Don't ignore failing tests
```

#### **Principle 4: Match Persona to Task Complexity**
```typescript
// Persona complexity should match task requirements
const PERSONA_COMPLEXITY = {
  SIMPLE: "Code Reviewer with 5 years experience",
  MODERATE: "Senior Developer with 10 years experience",
  COMPLEX: "Lead Architect with 15+ years experience across domains"
};
```

**Source:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts#L118-123`

---

## 3. Process Instruction Patterns

### 3.1 Writing Clear Step-by-Step Instructions

#### **Pattern 1: Numbered Sequential Steps**

**Best for:** Linear processes where order matters

```markdown
## Execution Process

1. **Load PRP (CRITICAL FIRST STEP)**
   - **ACTION**: Use the `Read` tool to read the PRP file at the path provided.
   - You MUST read this file before doing anything else.
   - Absorb all context, patterns, requirements and gather codebase intelligence
   - Use the provided documentation references and file patterns

2. **ULTRATHINK & Plan**
   - Create comprehensive implementation plan following the PRP's task order
   - Break down into clear todos using TodoWrite tool
   - Use subagents for parallel work when beneficial
   - Follow the patterns referenced in the PRP
   - Use specific file paths, class names, and method signatures from PRP context

3. **Execute Implementation**
   - Follow the PRP's Implementation Tasks sequence
   - Use the patterns and examples referenced in the PRP
   - Create files in locations specified by the desired codebase tree
   - Apply naming conventions from the task specifications

4. **Progressive Validation**
   - **Level 1**: Run syntax & style validation commands from PRP
   - **Level 2**: Execute unit test validation from PRP
   - **Level 3**: Run integration testing commands from PRP
   - **Level 4**: Execute specified validation from PRP
   - **Each level must pass before proceeding to the next.**

5. **Completion Verification**
   - Work through the Final Validation Checklist in the PRP
   - Verify all Success Criteria from the "What" section are met
   - Confirm all Anti-Patterns were avoided
   - Implementation is ready and working
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L659-698`

**Key Elements:**
- **Bold action verbs** for emphasis (LOAD, PLAN, EXECUTE)
- **Capitalized critical warnings** (CRITICAL FIRST STEP)
- **Nested sub-steps** with bullet points
- **Clear transition criteria** between steps
- **Completion criteria** for each phase

#### **Pattern 2: Conditional Branching**

**Best for:** Processes with decision points

```markdown
## Research Process

### If codebase analysis is needed:
1. Create clear todos and spawn subagents to search the codebase
2. Identify all necessary files to reference in the PRP
3. Note all existing conventions to follow
4. Check existing test patterns for validation approach
   - **IF** patterns found → Document and reference them
   - **IF** no patterns found → Plan to find new approach and ask user for confirmation

### If external research is needed:
1. Spawn subagents with instructions to do deep research online
2. Include URLs to documentation and examples
3. Store all research in the work item's research/ subdirectory
4. Reference critical pieces in the PRP with clear reasoning

### If clarification is needed:
- Ask the user for clarification
- If no testing framework is found, ask if they would like to set one up
- If fundamental misalignment detected, halt and produce thorough explanation
```

**Key Elements:**
- **Clear conditionals** (IF/THEN structure)
- **Explicit fallback paths**
- **User interaction points**
- **Error handling for ambiguous cases**

#### **Pattern 3: Parallel Work Distribution**

**Best for:** Tasks that can be done simultaneously

```markdown
## Research Phase (Execute in Parallel)

> Create clear tasks and spawn as many agents and subagents as needed using the batch tools. The deeper research we do here the better the PRP will be. We optimize for chance of success, not for speed.

**Parallel Work Streams:**

**Stream 1: Codebase Pattern Analysis**
- Search for similar features/patterns
- Identify files to reference in PRP
- Document existing conventions
- Find test patterns

**Stream 2: External Documentation Research**
- Library documentation (specific URLs)
- Implementation examples (GitHub/StackOverflow/blogs)
- Best practices and common pitfalls
- New validation approaches if needed

**Stream 3: Internal Documentation Review**
- Plan directory for architectural context
- Previous research documents
- Design documents and specs

**After all streams complete:**
- Synthesize findings into PRP
- Resolve any conflicts between sources
- Validate completeness with "No Prior Knowledge" test
```

**Key Elements:**
- **Explicit parallel structure**
- **Independent work streams**
- **Synchronization points**
- **Synthesis step** at the end

#### **Pattern 4: Hierarchical Decomposition**

**Best for:** Complex tasks with nested structure

```markdown
## Hierarchy Definitions

- **PHASE:** Project-scope goals (e.g., MVP, V1.0). _Weeks to months._
- **MILESTONE:** Key objectives within a Phase. _1 to 12 weeks._
- **TASK:** Complete features within a Milestone. _Days to weeks._
- **SUBTASK:** Atomic implementation steps. **0.5, 1, or 2 Story Points (SP).** (Max 2 SP, do not break subtasks down further than 2 SP unless required).

## Decomposition Process

**Level 1: Phase → Milestone**
- Break project into major time-bound goals
- Each phase should be independently valuable
- Phases are ordered by dependency

**Level 2: Milestone → Task**
- Identify complete features within each milestone
- Tasks should be deliverable units of work
- Tasks have clear success criteria

**Level 3: Task → Subtask**
- Break tasks into atomic implementation steps
- Each subtask is 0.5-2 story points
- Subtasks must have explicit dependencies
- Subtasks must include context_scope for isolation

**Context Scope Rule:**
For every Subtask, the `context_scope` must be a **strict set of instructions** for a developer who cannot see the rest of the project. It must define:
- **INPUT:** What specific data/interfaces are available from previous subtasks?
- **OUTPUT:** What exact interface does this subtask expose?
- **MOCKING:** What external services must be mocked to keep this subtask isolated?
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L65-102`

**Key Elements:**
- **Clear level definitions** with time estimates
- **Decomposition rules** for each level
- **Atomicity constraints** (story point limits)
- **Context boundaries** at each level

### 3.2 Instruction Following Best Practices

#### **1. Use Imperative Mood**
```markdown
❌ Bad: "The agent should analyze the PRD."
✅ Good: "Analyze the PRD above."

❌ Bad: "It would be good if you could research the codebase."
✅ Good: "Research the codebase for similar patterns."
```

#### **2. Be Specific and Concrete**
```markdown
❌ Bad: "Find information about the authentication system."
✅ Good: "Search the codebase for authentication-related files:
- Look in src/auth/ for authentication logic
- Check middleware/ for auth middleware
- Review models/user.ts for user schema
- Document the authentication flow you find"
```

#### **3. Use Formatting for Emphasis**
```markdown
**CRITICAL:** You MUST read this file before doing anything else.

> **IMPORTANT:** The presence or absence of the bug report file controls the entire bugfix pipeline.

**DO NOT** create subtasks for "Write Tests."

**IMPLIED WORKFLOW:** Assume every subtask implies: "Write the failing test → Implement the code → Pass the test."
```

#### **4. Provide Clear Success Criteria**
```markdown
## Success Metrics

**Confidence Score:** Rate 1-10 for one-pass implementation success likelihood

**Validation:** The completed PRP should enable an AI agent unfamiliar with the codebase to implement the feature successfully using only the PRP content and codebase access.

## Completion Checklist
- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `uv run pytest src/ -v`
- [ ] No linting errors: `uv run ruff check src/`
- [ ] No type errors: `uv run mypy src/`
```

#### **5. Include Error Handling Instructions**
```markdown
## Failure Protocol

**If validation fails:**
1. Use the patterns and gotchas from the PRP to fix issues
2. Re-run validation until passing
3. Document any changes made to the plan

**If fundamental issue found:**
1. Halt implementation immediately
2. Produce thorough explanation of the problem at a 10th grade level
3. Suggest alternative approaches if available

**If clarification needed:**
1. State clearly what information is missing
2. Explain why it's needed for successful completion
3. Provide options for how to proceed
```

---

## 4. Output Format Specification

### 4.1 JSON Schema for Structured Output

#### **Best Practices for JSON Output**

**1. Provide Complete Schema Examples**
```markdown
## Output Format

You MUST output valid JSON matching this schema:

\`\`\`typescript
{
  "changes": [
    {
      "itemId": "P1.M2.T3.S1",
      "type": "added" | "modified" | "removed",
      "description": "What changed (human-readable)",
      "impact": "Implementation impact explanation"
    }
  ],
  "patchInstructions": "Natural language guide for task patching",
  "taskIds": ["P1.M2.T3.S1", "P1.M2.T3.S2"]
}
\`\`\`
```

**Source:** `/home/dustin/projects/hacky-hack/src/agents/prompts.ts#L780-796`

**2. Specify File Output Location**
```markdown
## Output Format

**CONSTRAINT:** You MUST write the JSON to the file `./$TASKS_FILE` (in the CURRENT WORKING DIRECTORY - do NOT search for or use any other tasks.json files from other projects/directories).

Do NOT output JSON to the conversation - WRITE IT TO THE FILE at path `./$TASKS_FILE`.

Use your file writing tools to create `./$TASKS_FILE` with this structure:
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L119-126`

**3. Include Validation Criteria**
```markdown
## JSON Schema Validation

**Required Fields:**
- `backlog`: Array of Phase objects
- Each Phase must have: `type`, `id`, `title`, `status`, `description`
- Each Milestone must have: `type`, `id`, `title`, `status`, `description`
- Each Task must have: `type`, `id`, `title`, `status`, `description`, `subtasks`
- Each Subtask must have: `type`, `id`, `title`, `status`, `story_points`, `dependencies`, `context_scope`

**Valid Status Values:**
- "Planned" | "Researching" | "Ready" | "Implementing" | "Complete" | "Failed" | "Obsolete"

**ID Format:**
- Phase: "P[#]"
- Milestone: "P[#].M[#]"
- Task: "P[#].M[#].T[#]"
- Subtask: "P[#].M[#].T[#].S[#]"
```

**4. Provide Field Descriptions**
```markdown
### Field Descriptions

**context_scope** (string, required):
- A strict set of instructions for a developer who cannot see the rest of the project
- Must define INPUT, OUTPUT, and MOCKING requirements
- Should reference specific files, variables, or APIs from prior work
- Example: "INPUT: UserService from P1.M1.T2.S1. OUTPUT: AuthenticatedUserDTO. MOCK: External email service."

**dependencies** (array of strings, optional):
- Array of task IDs that must complete before this task
- Format: ["P1.M1.T2.S1", "P1.M1.T2.S2"]
- If no dependencies, omit field or use empty array

**story_points** (number, required for Subtasks only):
- Must be 0.5, 1, or 2
- Max 2 SP per subtask
- Represents complexity and time estimate
```

#### **Complex Nested Structure Example**

```json
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P1",
      "title": "Phase Title",
      "status": "Planned | Researching | Ready | Implementing | Complete | Failed",
      "description": "High level goal.",
      "milestones": [
        {
          "type": "Milestone",
          "id": "P1.M1",
          "title": "Milestone Title",
          "status": "Planned",
          "description": "Key objective.",
          "tasks": [
            {
              "type": "Task",
              "id": "P1.M1.T1",
              "title": "Task Title",
              "status": "Planned",
              "description": "Feature definition.",
              "subtasks": [
                {
                  "type": "Subtask",
                  "id": "P1.M1.T1.S1",
                  "title": "Subtask Title",
                  "status": "Planned",
                  "story_points": 1,
                  "dependencies": ["P1.M1.T1.S0"],
                  "context_scope": "CONTRACT DEFINITION:\n1. RESEARCH NOTE: [Finding from architecture/].\n2. INPUT: [Specific data structure] from [Dependency ID].\n3. LOGIC: Implement [PRD Section X] logic.\n4. OUTPUT: Return [Result Object] for [Next Subtask ID]."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L127-168`

### 4.2 Markdown Output Specifications

#### **Structured Documentation Format**
```markdown
## Output Specification

Write a structured bug report to `./$BUG_RESULTS_FILE` that can be used as a PRD for fixes:

\`\`\`markdown
# Bug Fix Requirements

## Overview

Brief summary of testing performed and overall quality assessment.

## Critical Issues (Must Fix)

Issues that prevent core functionality from working.

### Issue 1: [Title]

**Severity**: Critical
**PRD Reference**: [Which section/requirement]
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Steps to Reproduce**: How to see the bug
**Suggested Fix**: Brief guidance on resolution

## Major Issues (Should Fix)

Issues that significantly impact user experience or functionality.

### Issue N: [Title]

[Same format as above]

## Minor Issues (Nice to Fix)

Small improvements or polish items.

### Issue N: [Title]

[Same format as above]

## Testing Summary

- Total tests performed: X
- Passing: X
- Failing: X
- Areas with good coverage: [list]
- Areas needing more attention: [list]
\`\`\`
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L1107-1153`

### 4.3 Conditional Output Specifications

#### **Presence-Based Signaling**
```markdown
## Output - IMPORTANT

**It is IMPORTANT that you follow these rules exactly:**

- **If you find Critical or Major bugs**: You MUST write the bug report to `./$BUG_RESULTS_FILE`. It is imperative that actionable bugs are documented.
- **If you find NO Critical or Major bugs**: Do NOT write any file. Do NOT create `./$BUG_RESULTS_FILE`. Leave no trace. The absence of the file signals success.

**This is imperative.** The presence or absence of the bug report file controls the entire bugfix pipeline. Writing an empty or "no bugs found" file will cause unnecessary work. Not writing the file when there ARE bugs will cause bugs to be missed.
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L1165-1173`

**Key Pattern:** Use file presence/absence as a binary signal for downstream systems.

#### **Conditional Content Structure**
```markdown
## Conditional Output Requirements

**IF validation passes:**
```json
{
  "result": "success",
  "message": "All validation checks passed successfully"
}
```

**IF validation fails with recoverable error:**
```json
{
  "result": "error",
  "message": "Specific error description",
  "suggestions": ["Option 1", "Option 2"],
  "canRetry": true
}
```

**IF validation fails with critical error:**
```json
{
  "result": "issue",
  "message": "Thorough explanation at 10th grade level",
  "blocked": true,
  "requiresHumanIntervention": true
}
```
```

### 4.4 Output Validation Gates

#### **Automated Validation Criteria**
```markdown
## Output Validation

Your output MUST pass these checks before being considered complete:

### JSON Structure Validation
- [ ] Valid JSON syntax (no trailing commas, proper quoting)
- [ ] All required fields present
- [ ] All field values match specified types
- [ ] All enum values are from allowed sets
- [ ] All IDs follow correct format patterns

### Content Validation
- [ ] All dependencies reference valid task IDs
- [ ] Story points are 0.5, 1, or 2 only
- [ ] Context scopes include INPUT, OUTPUT, MOCKING
- [ ] Status values are from allowed set
- [ ] Descriptions are specific and actionable

### Semantic Validation
- [ ] Task hierarchy is coherent (no circular dependencies)
- [ ] Story points total matches task complexity
- [ ] Context scopes provide sufficient isolation
- [ ] Success criteria are measurable

**If any validation fails:**
1. Fix the issue
2. Re-validate
3. Do not proceed until all checks pass
```

---

## 5. Quality Enforcement Techniques

### 5.1 Reflection and Self-Correction

#### **Built-in Reflection Steps**
```markdown
## Reflection Phase

After completing your analysis, but before finalizing output:

### Self-Correction Checklist

1. **Verify Understanding:**
   - Did I correctly interpret the PRD requirements?
   - Are there any ambiguities I should resolve?
   - Did I make any assumptions that need validation?

2. **Validate Completeness:**
   - Have I addressed all requirements from the PRD?
   - Are there any missing edge cases?
   - Is the context sufficient for implementation?

3. **Check Coherence:**
   - Do all tasks logically connect?
   - Are dependencies correctly specified?
   - Will the context_scope for each subtask work in isolation?

4. **Quality Assessment:**
   - Rate confidence: 1-10 for one-pass implementation success
   - If confidence < 8, identify what's missing and add it
   - Document any remaining uncertainties

### Output Validation

Before writing final output:
- Apply the "No Prior Knowledge" test
- Verify all references are specific and accessible
- Confirm all validation commands are executable
- Check that all examples are accurate and relevant
```

#### **Progressive Validation Gates**

The **4-Level Validation System** from production:

```markdown
## Progressive Validation

**Execute the level validation system from the PRP:**

### Level 1: Syntax & Style (Immediate Feedback)
\`\`\`bash
# Run after each file creation - fix before proceeding
ruff check src/{new_files} --fix     # Auto-format and fix linting issues
mypy src/{new_files}                 # Type checking with specific files
ruff format src/{new_files}          # Ensure consistent formatting

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
\`\`\`

### Level 2: Unit Tests (Component Validation)
\`\`\`bash
# Test each component as it's created
uv run pytest src/services/tests/test_{domain}_service.py -v
uv run pytest src/tools/tests/test_{action}_{resource}.py -v

# Expected: All tests pass. If failing, debug root cause and fix implementation.
\`\`\`

### Level 3: Integration Testing (System Validation)
\`\`\`bash
# Service startup validation
uv run python main.py &
sleep 3  # Allow startup time

# Health check validation
curl -f http://localhost:8000/health || echo "Service health check failed"

# Expected: All integrations working, proper responses, no connection errors
\`\`\`

### Level 4: Creative & Domain-Specific Validation
\`\`\`bash
# MCP Server Validation Examples:
playwright-mcp --url http://localhost:8000 --test-user-journey
docker-mcp --build --test --cleanup
database-mcp --validate-schema --test-queries --check-performance

# Expected: All creative validations pass, performance meets requirements
\`\`\`

**Each level must pass before proceeding to the next.**
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L500-593`

**Key Principles:**
1. **Fail Fast:** Catch errors at the lowest level possible
2. **Fix Before Proceeding:** Don't accumulate errors
3. **Specific Error Messages:** Read output and fix specific issues
4. **Progressive Complexity:** Start with syntax, end with integration

### 5.2 Quality Checklists

#### **Comprehensive Validation Checklist**

```markdown
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

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L595-626`

#### **Context Completeness Check**

The **"No Prior Knowledge" Test** from production:

```markdown
## Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Documentation & References

\`\`\`yaml
# MUST READ - Include these in your context window
- url: [Complete URL with section anchor]
  why: [Specific methods/concepts needed for implementation]
  critical: [Key insights that prevent common implementation errors]

- file: [exact/path/to/pattern/file.py]
  why: [Specific pattern to follow - class structure, error handling, etc.]
  pattern: [Brief description of what pattern to extract]
  gotcha: [Known constraints or limitations to avoid]
\`\`\`

### Information Density Standards

Ensure every reference is **specific and actionable**:

- URLs include section anchors, not just domain names
- File references include specific patterns to follow, not generic mentions
- Task specifications include exact naming conventions and placement
- Validation commands are project-specific and executable
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L252-274`

### 5.3 Quality Gates

#### **PRP Quality Gates**

```markdown
## PRP Quality Gates

### Context Completeness Check
- [ ] Passes "No Prior Knowledge" test from template
- [ ] All YAML references are specific and accessible
- [ ] Implementation tasks include exact naming and placement guidance
- [ ] Validation commands are project-specific and verified working

### Template Structure Compliance
- [ ] All required template sections completed
- [ ] Goal section has specific Feature Goal, Deliverable, Success Definition
- [ ] Implementation Tasks follow dependency ordering
- [ ] Final Validation Checklist is comprehensive

### Information Density Standards
- [ ] No generic references - all are specific and actionable
- [ ] File patterns point at specific examples to follow
- [ ] URLs include section anchors for exact guidance
- [ ] Task specifications use information-dense keywords from codebase

## Success Metrics

**Confidence Score**: Rate 1-10 for one-pass implementation success likelihood

**Validation**: The completed PRP should enable an AI agent unfamiliar with the codebase to implement the feature successfully using only the PRP content and codebase access.
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L287-314`

### 5.4 Anti-Patterns Enforcement

#### **Explicit Anti-Patterns List**

```markdown
## Anti-Patterns to Avoid

- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them
- ❌ Don't use sync functions in async context
- ❌ Don't hardcode values that should be config
- ❌ Don't catch all exceptions - be specific
```

**Source:** `/home/dustin/projects/hacky-hack/PROMPTS.md#L629-637`

#### **Pre-Validation Checks**

```markdown
## Pre-Validation Checks

Before you begin implementation, verify:

### Codebase Reality Check
- [ ] Verify technologies in PRD match actual codebase
  - Example: Don't plan React hooks if project is vanilla JS
  - Example: Don't plan TypeScript if project is JavaScript
- [ ] Check if required dependencies are installed
- [ ] Verify existing patterns match planned approach

### Feasibility Validation
- [ ] Are all requirements technically feasible?
- [ ] Are there any conflicting requirements?
- [ ] Is the scope achievable within story point limits?

### Dependency Verification
- [ ] Are all external dependencies available?
- [ ] Are version constraints specified?
- [ ] Are fallback options documented?

### If Any Check Fails:
1. Halt implementation
2. Document the issue clearly
3. Suggest alternatives if available
4. Ask for clarification if needed
```

---

## 6. Prompt Iteration and Testing

### 6.1 Iterative Improvement Process

#### **Prompt Development Lifecycle**

```markdown
## Prompt Iteration Framework

### Phase 1: Initial Design
1. **Define Objectives:** What should the prompt achieve?
2. **Identify Components:** Role, context, task, output, constraints
3. **Draft Initial Prompt:** Use best practices from this guide
4. **Add Examples:** Include few-shot examples

### Phase 2: Initial Testing
1. **Test on Diverse Inputs:**
   - Simple cases
   - Complex cases
   - Edge cases
   - Error conditions
2. **Evaluate Outputs:**
   - Accuracy (does it produce correct results?)
   - Completeness (are all requirements met?)
   - Format (does output match schema?)
   - Quality (is the output well-structured?)

### Phase 3: Analysis and Refinement
1. **Identify Failure Modes:**
   - Where does the prompt fail?
   - What patterns cause errors?
   - Which instructions are ignored?
2. **Refine Prompt:**
   - Clarify ambiguous instructions
   - Add more examples for failure cases
   - Strengthen constraints
   - Improve context

### Phase 4: Validation Testing
1. **A/B Testing:** Compare old vs new prompt
2. **Metrics Tracking:**
   - Success rate (pass/fail validation gates)
   - Output quality scores
   - Token efficiency
   - Latency
3. **Iterate:** Based on metrics

### Phase 5: Production Deployment
1. **Gradual Rollout:** Test on subset of tasks
2. **Monitoring:** Track production performance
3. **Feedback Loops:** Collect issues and edge cases
4. **Continuous Improvement:** Regular updates based on data
```

#### **Version Control for Prompts**

```bash
# Prompt versioning strategy
prompts/
├── v1.0.0/
│   ├── architect-system-prompt.md
│   ├── researcher-system-prompt.md
│   └── coder-system-prompt.md
├── v1.1.0/
│   ├── architect-system-prompt.md
│   ├── researcher-system-prompt.md
│   └── coder-system-prompt.md
└── CHANGELOG.md
```

**Changelog Format:**
```markdown
# Prompt Changelog

## [v1.1.0] - 2025-01-15
### Added
- Added "No Prior Knowledge" test to researcher prompt
- Added reflection phase to architect prompt

### Changed
- Improved context_scope specification in task breakdown
- Clarified validation gate requirements

### Fixed
- Fixed ambiguous output format specification
- Fixed missing dependency validation

## [v1.0.0] - 2025-01-01
### Added
- Initial prompt set for architect, researcher, coder, qa personas
- 4-level validation system
- Task breakdown hierarchy definitions
```

### 6.2 Testing Methodologies

#### **A/B Testing Framework**

```typescript
// A/B testing structure for prompts
interface PromptTest {
  name: string;
  promptA: string; // Control prompt
  promptB: string; // Test prompt
  testCases: TestCase[];
  metrics: Metric[];
}

interface TestCase {
  input: any;
  expectedOutput: any;
  category: 'simple' | 'complex' | 'edge-case' | 'error';
}

interface Metric {
  name: string;
  measure: (output: any) => number | boolean;
}

// Example metrics
const QUALITY_METRICS: Metric[] = [
  {
    name: 'Schema Validation',
    measure: (output) => validateJSONSchema(output, expectedSchema)
  },
  {
    name: 'Completeness',
    measure: (output) => checkAllFieldsPresent(output, requiredFields)
  },
  {
    name: 'Token Efficiency',
    measure: (output) => output.tokens / output.fieldsCount
  },
  {
    name: 'Success Rate',
    measure: (output) => output.passedValidationGates === 4
  }
];
```

#### **Test Case Design**

```markdown
## Prompt Test Suite

### Test Categories

**1. Happy Path Tests**
- Typical usage scenarios
- Well-formed inputs
- Straightforward requirements

**2. Edge Case Tests**
- Minimal inputs
- Maximum complexity inputs
- Ambiguous requirements
- Conflicting constraints

**3. Error Condition Tests**
- Invalid input formats
- Missing required fields
- Impossible constraints
- Resource limitations

**4. Performance Tests**
- Large context windows
- Deep nesting levels
- Many parallel tasks
- Complex dependencies

### Example Test Cases

**Test Case 1: Simple Feature**
- **Input:** Basic feature with clear requirements
- **Expected:** Single task with 2-3 subtasks
- **Validation:** All subtasks have context_scope, valid dependencies

**Test Case 2: Complex Feature**
- **Input:** Multi-component feature with integration points
- **Expected:** Task hierarchy with milestones
- **Validation:** Coherent context_scope chain, no circular deps

**Test Case 3: Edge Case - Missing Context**
- **Input:** Feature with unclear requirements
- **Expected:** Agent asks for clarification
- **Validation:** Clarification request is specific and actionable

**Test Case 4: Error Condition - Impossible Constraints**
- **Input:** Story point budget < actual complexity
- **Expected:** Agent flags issue, suggests alternatives
- **Validation:** Clear explanation, constructive suggestions
```

#### **Evaluation Framework**

```typescript
// Prompt evaluation framework
interface PromptEvaluation {
  promptName: string;
  version: string;
  testResults: TestResult[];
  overallMetrics: OverallMetrics;
}

interface TestResult {
  testCase: string;
  passed: boolean;
  output: any;
  errors: string[];
  metrics: {
    accuracy: number;    // 0-1
    completeness: number; // 0-1
    format: number;      // 0-1
    quality: number;     // 0-1
  };
}

interface OverallMetrics {
  successRate: number;      // % of tests passed
  avgAccuracy: number;      // Average accuracy score
  avgCompleteness: number;  // Average completeness score
  avgTokenUsage: number;    // Average tokens per output
  avgLatency: number;       // Average processing time
}

// Evaluation function
async function evaluatePrompt(
  prompt: string,
  testCases: TestCase[]
): Promise<PromptEvaluation> {
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const output = await executePrompt(prompt, testCase.input);
    const metrics = calculateMetrics(output, testCase.expectedOutput);

    results.push({
      testCase: testCase.name,
      passed: metrics.accuracy === 1 && metrics.completeness === 1,
      output,
      errors: validateOutput(output, testCase.expectedOutput),
      metrics
    });
  }

  return {
    promptName: extractPromptName(prompt),
    version: extractVersion(prompt),
    testResults: results,
    overallMetrics: calculateOverallMetrics(results)
  };
}
```

### 6.3 Performance Metrics

#### **Key Performance Indicators (KPIs)**

```markdown
## Prompt Performance Metrics

### 1. Effectiveness Metrics
- **Success Rate:** % of tasks that pass all validation gates
- **Accuracy:** % of outputs that match expected format and content
- **Completeness:** % of required fields/values present in output
- **First-Pass Success:** % of tasks that succeed on first attempt

### 2. Efficiency Metrics
- **Token Usage:** Average tokens per output
- **Token Efficiency:** Information density (tokens per meaningful unit)
- **Latency:** Average processing time per request
- **Cost:** Cost per successful output

### 3. Quality Metrics
- **Coherence Score:** How well do parts of output relate to each other?
- **Specificity Score:** How specific are references (vs. generic)?
- **Validation Pass Rate:** % of outputs that pass automated validation
- **Human Approval Rate:** % of outputs approved without modification

### 4. Reliability Metrics
- **Consistency:** How similar are outputs for similar inputs?
- **Error Rate:** % of outputs that fail validation
- **Retry Success Rate:** % of failed outputs that succeed on retry
- **Escalation Rate:** % of tasks requiring human intervention

### Target Benchmarks

| Metric | Minimum | Target | Excellent |
|--------|---------|--------|-----------|
| Success Rate | 70% | 85% | 95% |
| Accuracy | 80% | 90% | 98% |
| Completeness | 85% | 95% | 99% |
| First-Pass Success | 60% | 75% | 90% |
| Token Efficiency | 0.5 | 0.7 | 0.9 |
| Validation Pass Rate | 75% | 90% | 98% |
```

### 6.4 Continuous Improvement

#### **Feedback Loop Structure**

```markdown
## Continuous Improvement Process

### Data Collection
1. **Log All Prompt Executions:**
   - Input parameters
   - Generated outputs
   - Validation results
   - Error messages
   - Human feedback

2. **Categorize Results:**
   - Success vs. failure
   - Failure mode (if failed)
   - Complexity level
   - Task type

### Analysis
1. **Weekly Review:**
   - Success rate trends
   - Common failure modes
   - Performance changes
   - Cost analysis

2. **Root Cause Analysis:**
   - For each failure mode
   - Identify root cause in prompt
   - Design specific improvement

3. **Prioritize Improvements:**
   - Impact (how many failures will it fix?)
   - Effort (how complex is the change?)
   - Risk (could it break existing success cases?)

### Implementation
1. **Design Prompt Changes:**
   - Specific modifications
   - Rationale for each change
   - Expected improvement

2. **Test Changes:**
   - Run full test suite
   - Compare against baseline
   - Validate no regression

3. **Gradual Rollout:**
   - Start with 10% of traffic
   - Monitor metrics closely
   - Roll back if issues detected

4. **Full Rollout:**
   - Deploy to 100% of traffic
   - Continue monitoring
   - Document results

### Documentation
- Maintain changelog of all prompt changes
- Document rationale for major changes
- Track performance over time
- Share learnings across team
```

#### **Automated Monitoring**

```typescript
// Automated monitoring system
interface PromptMonitor {
  promptName: string;
  version: string;
  metrics: Metrics;
  alerts: Alert[];
}

interface Metrics {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  avgTokenUsage: number;
  avgLatency: number;
  currentSuccessRate: number;
  rollingSuccessRate: number; // Last 100 executions
}

interface Alert {
  type: 'success_rate_drop' | 'error_spike' | 'latency_increase' | 'quality_degradation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
}

// Monitoring function
function monitorPrompt(prompt: PromptConfig): PromptMonitor {
  const metrics = collectMetrics(prompt);
  const alerts = generateAlerts(metrics);

  return {
    promptName: prompt.name,
    version: prompt.version,
    metrics,
    alerts
  };
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  successRate: {
    warning: 0.80,  // Alert if success rate drops below 80%
    critical: 0.70  // Alert if success rate drops below 70%
  },
  errorRate: {
    warning: 0.15,  // Alert if error rate exceeds 15%
    critical: 0.25  // Alert if error rate exceeds 25%
  },
  latency: {
    warning: 1.5,   // Alert if latency increases by 50%
    critical: 2.0   // Alert if latency doubles
  }
};
```

---

## 7. Common Pitfalls to Avoid

### 7.1 Prompt Design Pitfalls

#### **Pitfall 1: Vague Instructions**

**Problem:**
```markdown
❌ Bad: "Analyze the codebase and create a plan."
```

**Why it fails:**
- No clear scope for analysis
- No format for the plan
- No success criteria
- Agent may guess wrong approach

**Solution:**
```markdown
✅ Good: "Analyze the codebase for authentication-related patterns:
1. Search src/auth/ for authentication logic
2. Check middleware/ for auth middleware
3. Review models/user.ts for user schema
4. Document the authentication flow in a markdown file
5. Include file paths, function names, and data flow"
```

#### **Pitfall 2: Missing Context**

**Problem:**
```markdown
❌ Bad: "Implement user login."
```

**Why it fails:**
- No information about existing patterns
- No specification of authentication method
- No integration points specified
- Agent must guess or ask

**Solution:**
```markdown
✅ Good: "Implement user login following these patterns:
- Follow: src/auth/existing_auth.py for JWT handling
- Use: middleware/authentication.py for session management
- Integrate with: models/user.py (already exists)
- Validation: Use validators/ from src/utils/
- Output: Return UserDTO from src/models/dtos.py"
```

#### **Pitfall 3: Ambiguous Output Format**

**Problem:**
```markdown
❌ Bad: "Return a JSON with the task breakdown."
```

**Why it fails:**
- No schema specified
- No field definitions
- No validation criteria
- Output may not match expectations

**Solution:**
```markdown
✅ Good: "Return JSON matching this exact schema:

\`\`\`json
{
  "backlog": [{
    "type": "Phase",
    "id": "P1",
    "title": "string",
    "status": "Planned|Researching|Ready|Implementing|Complete|Failed",
    "milestones": [...]
  }]
}
\`\`\`

Required fields: type, id, title, status
Valid status values: 'Planned', 'Researching', 'Ready', 'Implementing', 'Complete', 'Failed'
ID format: P[#] for phases, P[#].M[#] for milestones, etc."
```

#### **Pitfall 4: Ignoring Edge Cases**

**Problem:**
```markdown
❌ Bad: "Create a user registration endpoint."
```

**Why it fails:**
- No error handling specified
- No validation requirements
- No duplicate handling
- No edge cases considered

**Solution:**
```markdown
✅ Good: "Create a user registration endpoint with:
1. Input validation (email format, password strength)
2. Duplicate detection (email uniqueness check)
3. Error handling (specific error messages for each failure mode)
4. Edge cases:
   - Duplicate email registration
   - Invalid email format
   - Weak password
   - Database connection failure
   - Malformed input
5. Success response: UserDTO with user ID
6. Error responses: { error: "specific message", code: "ERROR_CODE" }"
```

#### **Pitfall 5: Over-constraining**

**Problem:**
```markdown
❌ Bad: "Create exactly 5 tasks with exactly 3 subtasks each. Each subtask must be exactly 1 story point. Use exactly these words in descriptions: [list of 100 words]."
```

**Why it fails:**
- Arbitrary constraints
- May prevent optimal solution
- Agent focuses on constraints, not quality
- May miss important variations

**Solution:**
```markdown
✅ Good: "Create tasks following these guidelines:
- Break down to subtasks of 0.5-2 story points
- Ensure each subtask can be implemented in isolation
- Focus on coherence and completeness over exact counts
- Let the complexity guide the breakdown, not arbitrary limits
- If story points exceed 2, consider further breakdown"
```

### 7.2 Process Instruction Pitfalls

#### **Pitfall 6: Implicit Dependencies**

**Problem:**
```markdown
❌ Bad: "1. Create the user model. 2. Create the auth service. 3. Create the endpoint."
```

**Why it fails:**
- Doesn't specify what the auth service needs from the model
- Doesn't specify what the endpoint needs from the service
- No explicit data flow
- May result in incompatible interfaces

**Solution:**
```markdown
✅ Good: "1. Create User model in models/user.ts:
   - Export User interface with email, passwordHash, id
   - Export createUser() function

2. Create Auth service in services/auth.ts:
   - INPUT: User interface from models/user.ts
   - IMPLEMENT: register() function that calls createUser()
   - OUTPUT: AuthTokenDTO

3. Create endpoint in routes/auth.ts:
   - INPUT: Auth service from services/auth.ts
   - IMPLEMENT: POST /register endpoint
   - OUTPUT: JSON with user data and token"
```

#### **Pitfall 7: Missing Validation Gates**

**Problem:**
```markdown
❌ Bad: "Implement the feature and return the result."
```

**Why it fails:**
- No quality checks
- Errors may propagate
- No verification of success
- May produce non-working code

**Solution:**
```markdown
✅ Good: "Implement the feature with progressive validation:

**Level 1: After each file**
- Run linter: ruff check src/new_file --fix
- Run type checker: mypy src/new_file
- Fix all errors before proceeding

**Level 2: After implementation**
- Run unit tests: pytest tests/test_new_feature -v
- All tests must pass before considering complete

**Level 3: Integration validation**
- Test the full workflow
- Verify all integrations work

**If any level fails:**
1. Stop and analyze the error
2. Fix the root cause
3. Re-run validation
4. Only proceed when all checks pass"
```

### 7.3 Persona Design Pitfalls

#### **Pitfall 8: Generic Persona**

**Problem:**
```markdown
❌ Bad: "You are a helpful AI assistant."
```

**Why it fails:**
- No expertise level specified
- No behavioral guidance
- No decision-making framework
- No scope boundaries

**Solution:**
```markdown
✅ Good: "You are a Senior Software Architect with 15+ years of experience in distributed systems.

**Expertise:**
- Expert in microservices architecture
- Specialized in async/await patterns
- Deep knowledge of system design trade-offs

**Behavior:**
- Analytical and thorough
- Researches before committing to decisions
- Considers security, performance, and maintainability
- Documents rationale for significant decisions

**Scope:**
- Architectural decisions and system design
- Technology stack recommendations
- Integration patterns and best practices
- NOT: Writing low-level implementation code"
```

#### **Pitfall 9: Conflicting Constraints**

**Problem:**
```markdown
❌ Bad: "You are a thorough architect who researches deeply. Also, you must work extremely fast and skip research to save time."
```

**Why it fails:**
- Direct contradiction
- Agent can't satisfy both
- Unpredictable behavior
- Quality vs. speed trade-off unclear

**Solution:**
```markdown
✅ Good: "You are a thorough architect who prioritizes quality over speed.

**Primary Goal:** One-pass implementation success through thorough research

**Trade-offs:**
- Quality > Speed
- Correctness > Cleverness
- Long-term maintainability > Short-term convenience
- Research before planning > Quick decisions

**When to optimize for speed:**
- Only after quality gates are satisfied
- Only for non-critical iterations
- Only when explicitly requested"
```

### 7.4 Output Format Pitfalls

#### **Pitfall 10: Inconsistent Schema**

**Problem:**
```markdown
❌ Bad: "Return JSON with tasks. Each task has an id (sometimes number, sometimes string like 'P1'), title, status (varies by task type)."
```

**Why it fails:**
- Type ambiguity
- Parsing errors
- Validation failures
- Downstream systems break

**Solution:**
```markdown
✅ Good: "Return JSON with this consistent schema:

\`\`\`typescript
interface Task {
  id: string;        // Always string format: "P1", "P1.M1", "P1.M1.T1", "P1.M1.T1.S1"
  type: "Phase" | "Milestone" | "Task" | "Subtask";
  title: string;
  status: "Planned" | "Researching" | "Ready" | "Implementing" | "Complete" | "Failed" | "Obsolete";
  description: string;
  story_points?: number;  // Only for Subtasks, must be 0.5, 1, or 2
  dependencies?: string[]; // Array of task IDs
  context_scope?: string;  // Only for Subtasks
}
\`\`\`

**Strict Rules:**
- id is ALWAYS string, never number
- status is ALWAYS from the enum, never custom values
- story_points is ONLY present for Subtasks
- Empty array for dependencies, not null"
```

---

## 8. Code Examples from Production

### 8.1 Complete Production Prompt Examples

#### **Example 1: Task Breakdown System Prompt**

**Location:** `/home/dustin/projects/hacky-hack/src/agents/prompts.ts#L33-146`

**Key Components:**
1. **Role Definition:** Clear persona with specific expertise
2. **Hierarchy Definitions:** Precise scope definitions
3. **Critical Constraints:** 4 main constraint categories
4. **Process Instructions:** Numbered steps with sub-steps
5. **Output Format:** Complete JSON schema with examples
6. **Quality Gates:** Validation requirements embedded

```typescript
export const TASK_BREAKDOWN_PROMPT = `
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy: \`Phase\` > \`Milestone\` > \`Task\` > \`Subtask\`.

---

## HIERARCHY DEFINITIONS

- **PHASE:** Project-scope goals (e.g., MVP, V1.0). _Weeks to months._
- **MILESTONE:** Key objectives within a Phase. _1 to 12 weeks._
- **TASK:** Complete features within a Milestone. _Days to weeks._
- **SUBTASK:** Atomic implementation steps. **0.5, 1, or 2 Story Points (SP).** (Max 2 SP, do not break subtasks down further than 2 SP unless required).

---

## CRITICAL CONSTRAINTS & STANDARD OF WORK (SOW)

### 1. RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)

- **VALIDATE BEFORE BREAKING DOWN:** You cannot plan what you do not understand.
- **SPAWN SUBAGENTS:** Use your tools to spawn agents to research the codebase and external documentation _before_ defining the hierarchy.
- **REALITY CHECK:** Verify that the PRD's requests match the current codebase state (e.g., don't plan a React hook if the project is vanilla JS).
- **PERSISTENCE:** You must store architectural findings in \`$SESSION_DIR/architecture/\` so the downstream PRP (Product Requirement Prompt) agents have access to them.

### 2. COHERENCE & CONTINUITY

- **NO VACUUMS:** You must ensure architectural flow. Subtasks must not exist in isolation.
- **EXPLICIT HANDOFFS:** If \`Subtask A\` defines a schema, \`Subtask B\` must be explicitly instructed to consume that schema.
- **STRICT REFERENCES:** Reference specific file paths, variable names, or API endpoints confirmed during your **Research Phase**.

### 3. IMPLICIT TDD & QUALITY

- **DO NOT** create subtasks for "Write Tests."
- **IMPLIED WORKFLOW:** Assume every subtask implies: _"Write the failing test -> Implement the code -> Pass the test."_
- **DEFINITION OF DONE:** Code is not complete without tests.

### 4. THE "CONTEXT SCOPE" BLINDER

For every Subtask, the \`context_scope\` must be a **strict set of instructions** for a developer who cannot see the rest of the project. It must define:

- **INPUT:** What specific data/interfaces are available from previous subtasks?
- **OUTPUT:** What exact interface does this subtask expose?
- **MOCKING:** What external services must be mocked to keep this subtask isolated?

---

## PROCESS

ULTRATHINK & PLAN

1.  **ANALYZE** the attached or referenced PRD.
2.  **RESEARCH (SPAWN & VALIDATE):**
    - **Spawn** subagents to map the codebase and verify PRD feasibility.
    - **Spawn** subagents to find external documentation for new tech.
    - **Store** findings in \`$SESSION_DIR/architecture/\` (e.g., \`system_context.md\`, \`external_deps.md\`).
3.  **DETERMINE** the highest level of scope (Phase, Milestone, or Task).
4.  **DECOMPOSE** strictly downwards to the Subtask level, using your research to populate the \`context_scope\`.

---

## OUTPUT FORMAT

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
      "milestones": [
        {
          "type": "Milestone",
          "id": "P[#].M[#]",
          "title": "Milestone Title",
          "status": "Planned",
          "description": "Key objective.",
          "tasks": [
            {
              "type": "Task",
              "id": "P[#].M[#].T[#]",
              "title": "Task Title",
              "status": "Planned",
              "description": "Feature definition.",
              "subtasks": [
                {
                  "type": "Subtask",
                  "id": "P[#].M[#].T[#].S[#]",
                  "title": "Subtask Title",
                  "status": "Planned",
                  "story_points": 1,
                  "dependencies": ["ID of prerequisite subtask"],
                  "context_scope": "CONTRACT DEFINITION:\\n1. RESEARCH NOTE: [Finding from $SESSION_DIR/architecture/ regarding this feature].\\n2. INPUT: [Specific data structure/variable] from [Dependency ID].\\n3. LOGIC: Implement [PRD Section X] logic. Mock [Service Y] for isolation.\\n4. OUTPUT: Return [Result Object/Interface] for consumption by [Next Subtask ID]."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`
` as const;
```

#### **Example 2: PRP Blueprint System Prompt**

**Location:** `/home/dustin/projects/hacky-hack/src/agents/prompts.ts#L157-603`

**Key Components:**
1. **Mission Statement:** Clear "one-pass success" goal
2. **Critical Understanding:** Explicit agent limitations
3. **Research Process:** Detailed, multi-step research approach
4. **Quality Gates:** Multiple validation checkpoints
5. **Template Integration:** Complete template structure embedded
6. **Success Metrics:** Measurable outcomes defined

```typescript
export const PRP_BLUEPRINT_PROMPT = `
# Create PRP for Work Item

## Work Item Information

**ITEM TITLE**: <item_title>
**ITEM DESCRIPTION**: <item_description>

You are creating a PRP (Product Requirement Prompt) for this specific work item.

## PRP Creation Mission

Create a comprehensive PRP that enables **one-pass implementation success** through systematic research and context curation.

**Critical Understanding**:
You must start by reading and understanding the prp concepts in the attached readme
Be aware that the executing AI agent only receives:

- The PRP content you create
- Its training data knowledge
- Access to codebase files (but needs guidance on which ones)

**Therefore**: Your research and context curation directly determines implementation success. Incomplete context = implementation failure.

## Research Process

> During the research process, create clear tasks and spawn as many agents and subagents as needed using the batch tools. The deeper research we do here the better the PRP will be. We optimize for chance of success, not for speed.

1. **Codebase Analysis in depth**
   - Create clear todos and spawn subagents to search the codebase for similar features/patterns. Think hard and plan your approach
   - Identify all the necessary files to reference in the PRP
   - Note all existing conventions to follow
   - Check existing test patterns for validation approach, if none are found plan to find a new one
   - Use the batch tools to spawn subagents to search the codebase for similar features/patterns

2. **Internal Research at scale**
   - Use relevant research and plan information in the plan/architecture directory
   - Consider the scope of this work item within the overall PRD. Respect the boundaries of scope of implementation. Ensure cohesion across
     previously completed work items and guard against harming future work items in your plan

3. **External Research at scale**
   - Create clear todos and spawn subagents with instructions to do deep research for similar features/patterns online and include urls to documentation and examples
   - Library documentation (include specific URLs)
   - Store all research in the work item's research/ subdirectory and reference critical pieces of documentation in the PRP with clear
     reasoning and instructions
   - Implementation examples (GitHub/StackOverflow/blogs)
   - New validation approach none found in existing codebase and user confirms they would like one added
   - Best practices and common pitfalls found during research
   - Use the batch tools to spawn subagents to search for similar features/patterns online and include urls to documentation and examples

4. **User Clarification**
   - Ask for clarification if you need it
   - If no testing framework is found, ask the user if they would like to set one up
   - If a fundamental misalignemnt of objectives across work items is detected, halt and produce a thorough explanation of the problem at a 10th grade level

## PRP Generation Process

### Step 1: Review Template

Use the attached template structure - it contains all necessary sections and formatting.

### Step 2: Context Completeness Validation

Before writing, apply the **"No Prior Knowledge" test** from the template:
_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Step 3: Research Integration

Transform your research findings into the template sections:

**Goal Section**: Use research to define specific, measurable Feature Goal and concrete Deliverable based on the work item title and description
**Context Section**: Populate YAML structure with your research findings - specific URLs, file patterns, gotchas
**Implementation Tasks**: Create dependency-ordered tasks using information-dense keywords from codebase analysis
**Validation Gates**: Use project-specific validation commands that you've verified work in this codebase

### Step 4: Information Density Standards

Ensure every reference is **specific and actionable**:

- URLs include section anchors, not just domain names
- File references include specific patterns to follow, not generic mentions
- Task specifications include exact naming conventions and placement
- Validation commands are project-specific and executable

### Step 5: ULTRATHINK Before Writing

After research completion, create comprehensive PRP writing plan using TodoWrite tool:

- Plan how to structure each template section with your research findings
- Identify gaps that need additional research
- Create systematic approach to filling template with actionable context

## Output

Store the PRP and documentation at the path specified in your instructions.

## PRP Quality Gates

### Context Completeness Check

- [ ] Passes "No Prior Knowledge" test from template
- [ ] All YAML references are specific and accessible
- [ ] Implementation tasks include exact naming and placement guidance
- [ ] Validation commands are project-specific and verified working

### Template Structure Compliance

- [ ] All required template sections completed
- [ ] Goal section has specific Feature Goal, Deliverable, Success Definition
- [ ] Implementation Tasks follow dependency ordering
- [ ] Final Validation Checklist is comprehensive

### Information Density Standards

- [ ] No generic references - all are specific and actionable
- [ ] File patterns point at specific examples to follow
- [ ] URLs include section anchors for exact guidance
- [ ] Task specifications use information-dense keywords from codebase

## Success Metrics

**Confidence Score**: Rate 1-10 for one-pass implementation success likelihood

**Validation**: The completed PRP should enable an AI agent unfamiliar with the codebase to implement the feature successfully using only the PRP content and codebase access.
<PRP-README>
$PRP_README
</PRP-README>

<PRP-TEMPLATE>
[name: "Base PRP Template - Implementation-Focused with Precision Standards"
description: |

---

## Goal

**Feature Goal**: [Specific, measurable end state of what needs to be built]

**Deliverable**: [Concrete artifact - API endpoint, service class, integration, etc.]

**Success Definition**: [How you'll know this is complete and working]

## User Persona (if applicable)

**Target User**: [Specific user type - developer, end user, admin, etc.]

**Use Case**: [Primary scenario when this feature will be used]

**User Journey**: [Step-by-step flow of how user interacts with this feature]

**Pain Points Addressed**: [Specific user frustrations this feature solves]

## Why

- [Business value and user impact]
- [Integration with existing features]
- [Problems this solves and for whom]

## What

[User-visible behavior and technical requirements]

### Success Criteria

- [ ] [Specific measurable outcomes]

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Documentation & References

\`\`\`yaml
# MUST READ - Include these in your context window
- url: [Complete URL with section anchor]
  why: [Specific methods/concepts needed for implementation]
  critical: [Key insights that prevent common implementation errors]

- file: [exact/path/to/pattern/file.py]
  why: [Specific pattern to follow - class structure, error handling, etc.]
  pattern: [Brief description of what pattern to extract]
  gotcha: [Known constraints or limitations to avoid]

- docfile: [$SESSION_DIR/ai_docs/domain_specific.md]
  why: [Custom documentation for complex library/integration patterns]
  section: [Specific section if document is large]
\`\`\`

### Current Codebase tree (run \`tree\` in the root of the project) to get an overview of the codebase

\`\`\`bash

\`\`\`

### Desired Codebase tree with files to be added and responsibility of file

\`\`\`bash

\`\`\`

### Known Gotchas of our codebase & Library Quirks

\`\`\`python
# CRITICAL: [Library name] requires [specific setup]
# Example: FastAPI requires async functions for endpoints
# Example: This ORM doesn't support batch inserts over 1000 records
\`\`\`

## Implementation Blueprint

### Data models and structure

Create the core data models, we ensure type safety and consistency.

\`\`\`python
Examples:
 - orm models
 - pydantic models
 - pydantic schemas
 - pydantic validators

\`\`\`

### Implementation Tasks (ordered by dependencies)

\`\`\`yaml
Task 1: CREATE src/models/{domain}_models.py
  - IMPLEMENT: {SpecificModel}Request, {SpecificModel}Response Pydantic models
  - FOLLOW pattern: src/models/existing_model.py (field validation approach)
  - NAMING: CamelCase for classes, snake_case for fields
  - PLACEMENT: Domain-specific model file in src/models/

Task 2: CREATE src/services/{domain}_service.py
  - IMPLEMENT: {Domain}Service class with async methods
  - FOLLOW pattern: src/services/database_service.py (service structure, error handling)
  - NAMING: {Domain}Service class, async def create_*, get_*, update_*, delete_* methods
  - DEPENDENCIES: Import models from Task 1
  - PLACEMENT: Service layer in src/services/

Task 3: CREATE src/tools/{action}_{resource}.py
  - IMPLEMENT: MCP tool wrapper calling service methods
  - FOLLOW pattern: src/tools/existing_tool.py (FastMCP tool structure)
  - NAMING: snake_case file name, descriptive tool function name
  - DEPENDENCIES: Import service from Task 2
  - PLACEMENT: Tool layer in src/tools/

Task 4: MODIFY src/main.py or src/server.py
  - INTEGRATE: Register new tool with MCP server
  - FIND pattern: existing tool registrations
  - ADD: Import and register new tool following existing pattern
  - PRESERVE: Existing tool registrations and server configuration

Task 5: CREATE src/services/tests/test_{domain}_service.py
  - IMPLEMENT: Unit tests for all service methods (happy path, edge cases, error handling)
  - FOLLOW pattern: src/services/tests/test_existing_service.py (fixture usage, assertion patterns)
  - NAMING: test_{method}_{scenario} function naming
  - COVERAGE: All public methods with positive and negative test cases
  - PLACEMENT: Tests alongside the code they test

Task 6: CREATE src/tools/tests/test_{action}_{resource}.py
  - IMPLEMENT: Unit tests for MCP tool functionality
  - FOLLOW pattern: src/tools/tests/test_existing_tool.py (MCP tool testing approach)
  - MOCK: External service dependencies
  - COVERAGE: Tool input validation, success responses, error handling
  - PLACEMENT: Tool tests in src/tools/tests/
\`\`\`

### Implementation Patterns & Key Details

\`\`\`python
# Show critical patterns and gotchas - keep concise, focus on non-obvious details

# Example: Service method pattern
async def {domain}_operation(self, request: {Domain}Request) -> {Domain}Response:
    # PATTERN: Input validation first (follow src/services/existing_service.py)
    validated = self.validate_request(request)

    # GOTCHA: [Library-specific constraint or requirement]
    # PATTERN: Error handling approach (reference existing service pattern)
    # CRITICAL: [Non-obvious requirement or configuration detail]

    return {Domain}Response(status="success", data=result)

# Example: MCP tool pattern
@app.tool()
async def {tool_name}({parameters}) -> str:
    # PATTERN: Tool validation and service delegation (see src/tools/existing_tool.py)
    # RETURN: JSON string with standardized response format
\`\`\`

### Integration Points

\`\`\`yaml
DATABASE:
  - migration: "Add column 'feature_enabled' to users table"
  - index: 'CREATE INDEX idx_feature_lookup ON users(feature_id)'

CONFIG:
  - add to: config/settings.py
  - pattern: "FEATURE_TIMEOUT = int(os.getenv('FEATURE_TIMEOUT', '30'))"

ROUTES:
  - add to: src/api/routes.py
  - pattern: "router.include_router(feature_router, prefix='/feature')"
\`\`\`

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

\`\`\`bash
# Run after each file creation - fix before proceeding
ruff check src/{new_files} --fix     # Auto-format and fix linting issues
mypy src/{new_files}                 # Type checking with specific files
ruff format src/{new_files}          # Ensure consistent formatting

# Project-wide validation
ruff check src/ --fix
mypy src/
ruff format src/

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
\`\`\`

### Level 2: Unit Tests (Component Validation)

\`\`\`bash
# Test each component as it's created
uv run pytest src/services/tests/test_{domain}_service.py -v
uv run pytest src/tools/tests/test_{action}_{resource}.py -v

# Full test suite for affected areas
uv run pytest src/services/tests/ -v
uv run pytest src/tools/tests/ -v

# Coverage validation (if coverage tools available)
uv run pytest src/ --cov=src --cov-report=term-missing

# Expected: All tests pass. If failing, debug root cause and fix implementation.
\`\`\`

### Level 3: Integration Testing (System Validation)

\`\`\`bash
# Service startup validation
uv run python main.py &
sleep 3  # Allow startup time

# Health check validation
curl -f http://localhost:8000/health || echo "Service health check failed"

# Feature-specific endpoint testing
curl -X POST http://localhost:8000/{your_endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"test": "data"}' \\
  | jq .  # Pretty print JSON response

# MCP server validation (if MCP-based)
# Test MCP tool functionality
echo '{"method": "tools/call", "params": {"name": "{tool_name}", "arguments": {}}}' | \\
  uv run python -m src.main

# Database validation (if database integration)
# Verify database schema, connections, migrations
psql $DATABASE_URL -c "SELECT 1;" || echo "Database connection failed"

# Expected: All integrations working, proper responses, no connection errors
\`\`\`

### Level 4: Creative & Domain-Specific Validation

\`\`\`bash
# MCP Server Validation Examples:

# Playwright MCP (for web interfaces)
playwright-mcp --url http://localhost:8000 --test-user-journey

# Docker MCP (for containerized services)
docker-mcp --build --test --cleanup

# Database MCP (for data operations)
database-mcp --validate-schema --test-queries --check-performance

# Custom Business Logic Validation
# [Add domain-specific validation commands here]

# Performance Testing (if performance requirements)
ab -n 100 -c 10 http://localhost:8000/{endpoint}

# Security Scanning (if security requirements)
bandit -r src/

# Load Testing (if scalability requirements)
# wrk -t12 -c400 -d30s http://localhost:8000/{endpoint}

# API Documentation Validation (if API endpoints)
# swagger-codegen validate -i openapi.json

# Expected: All creative validations pass, performance meets requirements
\`\`\`

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: \`uv run pytest src/ -v\`
- [ ] No linting errors: \`uv run ruff check src/\`
- [ ] No type errors: \`uv run mypy src/\`
- [ ] No formatting issues: \`uv run ruff format src/ --check\`

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

---

## Anti-Patterns to Avoid

- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them
- ❌ Don't use sync functions in async context
- ❌ Don't hardcode values that should be config
- ❌ Don't catch all exceptions - be specific
  </PRP-TEMPLATE>
` as const;
```

### 8.2 Agent Factory Implementation

**Location:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

**Key Patterns:**
1. **Persona-based configuration:** Different token limits per role
2. **Environment configuration:** Proper API key mapping
3. **Tool integration:** MCP servers for all agents
4. **Type safety:** Strong typing for all configurations

```typescript
/**
 * Persona-specific token limits
 *
 * @remarks
 * Architect agents need more tokens for complex task breakdown analysis.
 * Other agents use standard token limits for their specific tasks.
 */
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;

/**
 * Create base agent configuration for a specific persona
 *
 * @remarks
 * Generates a Groundswell-compatible agent configuration optimized for
 * the specified persona. All personas use the sonnet model tier (GLM-4.7)
 * with caching and reflection enabled for optimal performance.
 *
 * Environment variables are mapped from shell conventions (ANTHROPIC_AUTH_TOKEN)
 * to SDK expectations (ANTHROPIC_API_KEY) via configureEnvironment().
 */
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  const model = getModel('sonnet'); // All personas use sonnet → GLM-4.7
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;
  const system = `You are a ${persona} agent.`;

  return {
    name,
    system,
    model,
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}
```

---

## 9. Industry-Leading Resources

### 9.1 Official Documentation

#### **Anthropic Claude**
- **Prompt Engineering Guide:** https://docs.anthropic.com/claude/docs/prompt-engineering
  - Sections: Structure, clarity, examples, format, constraints
  - Best practices: Role definition, task specification, output format

- **System Prompts:** https://docs.anthropic.com/claude/docs/system-prompts
  - How to craft effective system prompts
  - Persona design patterns
  - Constraint specification

- **Tool Use:** https://docs.anthropic.com/claude/docs/tool-use
  - Structured output for tools
  - Function calling patterns
  - Error handling

#### **OpenAI**
- **Prompt Engineering Guide:** https://platform.openai.com/docs/guides/prompt-engineering
  - Six strategies for better results
  - Examples and best practices
  - Common pitfalls

- **Function Calling:** https://platform.openai.com/docs/guides/function-calling
  - JSON schema specification
  - Structured output
  - Multi-function calling

- **Chat Completion:** https://platform.openai.com/docs/api-reference/chat/create
  - Message format and structure
  - System message optimization
  - Response format options

#### **Google DeepMind**
- **Gemini Prompt Design:** https://ai.google.dev/docs/prompt_best_practices
  - Prompt structure guidelines
  - Few-shot learning patterns
  - Safety and constraints

### 9.2 Research Papers

#### **Prompt Engineering Research**
1. **"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"** (Wei et al., 2022)
   - arXiv: https://arxiv.org/abs/2201.11903
   - Key insight: Intermediate reasoning steps improve performance

2. **"ReAct: Synergizing Reasoning and Acting in Language Models"** (Yao et al., 2022)
   - arXiv: https://arxiv.org/abs/2210.03629
   - Key insight: Interleave reasoning and acting for complex tasks

3. **"Reflexion: Language Agents with Verbal Reinforcement Learning"** (Shinn et al., 2023)
   - arXiv: https://arxiv.org/abs/2303.11366
   - Key insight: Self-reflection improves task performance

4. **"Large Language Models as Zero-Shot Planners"** (Huang et al., 2022)
   - arXiv: https://arxiv.org/abs/2205.11991
   - Key insight: LLMs can plan without training for planning

#### **Agent System Research**
1. **"Communicative Agents for Software Development"** (Chen et al., 2023)
   - arXiv: https://arxiv.org/abs/2307.02452
   - Key insight: Multi-agent collaboration improves code generation

2. **"CAMEL: Communicative Agents for "Mind" Exploration of Large Scale Language Model Society"** (Li et al., 2023)
   - arXiv: https://arxiv.org/abs/2303.17760
   - Key insight: Role-playing agents for complex tasks

### 9.3 Community Resources

#### **Prompt Engineering Libraries**
1. **Promptfoo:** https://promptfoo.dev/
   - Prompt testing and evaluation framework
   - A/B testing capabilities
   - Regression testing for prompts

2. **PromptLayer:** https://promptlayer.com/
   - Prompt version control
   - Analytics and monitoring
   - Collaboration features

3. **LangChain Prompts:** https://python.langchain.com/docs/modules/model_io/prompts/
   - Prompt templates
   - Few-shot examples
   - Output parsers

#### **Blogs and Guides**
1. **OpenAI Cookbook:** https://github.com/openai/openai-cookbook
   - Code examples
   - Best practices
   - Common patterns

2. **Anthropic Examples:** https://github.com/anthropics/anthropic-cookbook
   - Prompt examples
   - Tool use patterns
   - System prompt templates

3. **"Prompt Engineering for LLMs"** (Learning Guide): https://www.promptingguide.ai/
   - Comprehensive prompt engineering guide
   - Techniques and patterns
   - Examples across domains

### 9.4 Tools and Frameworks

#### **Prompt Testing**
- **Promptfoo:** https://www.promptfoo.dev/
  - Local prompt testing
  - Evaluation metrics
  - CI/CD integration

- **PromptLayer:** https://promptlayer.com/
  - Prompt monitoring
  - Version control
  - Analytics

#### **Agent Frameworks**
- **LangChain:** https://python.langchain.com/
  - Agent templates
  - Tool integrations
  - Prompt management

- **Groundswell:** https://github.com/modelcontextprotocol/servers
  - MCP server patterns
  - Agent creation
  - Tool management

- **AutoGPT:** https://github.com/Significant-Gravitas/AutoGPT
  - Autonomous agent patterns
  - Task decomposition
  - Self-reflection loops

---

## 10. Summary and Quick Reference

### 10.1 Prompt Structure Checklist

```markdown
## Essential Components

□ **Role Definition**
  - Clear persona with expertise level
  - Behavioral characteristics
  - Scope and boundaries

□ **Context Information**
  - Relevant background
  - Specific file paths and references
  - Known constraints and gotchas

□ **Task Specification**
  - Clear, imperative instructions
  - Numbered steps for complex tasks
  - Dependencies and prerequisites

□ **Output Format**
  - Complete schema specification
  - Examples of expected output
  - File paths if output should be written

□ **Constraints**
  - Explicit prohibitions
  - Resource limits
  - Anti-patterns to avoid

□ **Quality Gates**
  - Validation criteria
  - Success metrics
  - Error handling instructions

□ **Examples**
  - Few-shot examples (2-5)
  - Edge cases
  - Negative examples
```

### 10.2 Role Definition Template

```markdown
# [ROLE NAME]

> **ROLE:** Act as a [Specific Role] with [X] years of experience in [Domain].
> **CONTEXT:** [Context about role's position and perspective]
> **GOAL:** [Primary objective]

## Expertise
- [Specific domain knowledge areas]
- [Technical skills and capabilities]
- [Decision-making authority]

## Behavioral Characteristics
- **Communication Style:** [How the agent expresses itself]
- **Decision-Making:** [How choices are made]
- **Work Style:** [Thorough vs. fast, analytical vs. intuitive]

## Scope
- **In Scope:** [What the agent handles]
- **Out of Scope:** [What the agent doesn't handle]

## Constraints
- [Specific behavioral constraints]
- [Resource limitations]
- [Quality standards]
```

### 10.3 Output Format Template

```markdown
## Output Format

**CONSTRAINT:** You MUST [specific constraint about output]

**Format:** [JSON/Markdown/Text]

### Schema
\`\`\`[typescript/json]
[Complete schema specification]
\`\`\`

### Field Definitions
- **fieldName:** [Type] - [Description]
  - Required/Optional
  - Valid values (if enum)
  - Constraints (if any)

### Examples
**Example 1:** [Description]
\`\`\`
[Example output]
\`\`\`

### Validation
- [ ] Schema validation passed
- [ ] All required fields present
- [ ] All values within constraints
- [ ] Format matches specification
```

### 10.4 Quality Enforcement Checklist

```markdown
## Pre-Execution Validation
□ Input requirements are clear
□ Context is complete and specific
□ Constraints are well-defined
□ Examples cover main cases

## During Execution
□ Follow steps in order
□ Validate each step before proceeding
□ Check for ambiguous conditions
□ Handle errors appropriately

## Post-Execution Validation
□ Output matches specified format
□ All required fields present
□ Quality criteria met
□ No validation errors

## Continuous Improvement
□ Log all executions
□ Track success metrics
□ Analyze failure modes
□ Iterate and refine
```

---

## Conclusion

This research document compiles best practices for prompt engineering in AI agent development from multiple authoritative sources, including production codebase analysis, official documentation from industry leaders (OpenAI, Anthropic, Google DeepMind), and established research patterns.

**Key Takeaways:**

1. **Structure Matters:** Effective prompts have clear, consistent structure with role, context, task, output, and constraints
2. **Specificity Wins:** Specific, actionable instructions outperform vague guidance
3. **Quality Enforcement:** Built-in validation gates and reflection steps significantly improve output quality
4. **Iterate and Test:** Continuous improvement through testing and iteration is essential
5. **Learn from Production:** Real-world patterns from production systems provide valuable templates

**Next Steps:**

1. Apply these patterns to your agent system
2. Implement the testing framework
3. Set up monitoring and metrics
4. Establish iteration processes
5. Document learnings and improvements

**Resources:**

- Production Examples: `/home/dustin/projects/hacky-hack/src/agents/`
- Raw Prompts: `/home/dustin/projects/hacky-hack/PROMPTS.md`
- Agent Factory: `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-23
**Author:** Research synthesis from multiple authoritative sources
**License:** Internal documentation for hacky-hack project
