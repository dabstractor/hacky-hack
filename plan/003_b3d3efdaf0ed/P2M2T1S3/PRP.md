# Product Requirement Prompt (PRP): Create Agent Prompt Engineering Guide

> Transform PRD into working code with complete context, clear objectives, and validation criteria

**Status**: Ready for Implementation
**Last Updated**: 2026-01-23
**Work Item**: P2.M2.T1.S3 - Create agent prompt engineering guide

---

## Goal

**Feature Goal**: Create a comprehensive agent prompt engineering guide (`docs/PROMPT_ENGINEERING.md`) that documents the prompt design principles, patterns, and best practices used across the four critical agent prompts in the PRP Pipeline (Task Breakdown, PRP Creation, PRP Execution, Bug Finding), enabling developers to understand, modify, and extend agent prompts effectively.

**Deliverable**: Documentation file `docs/PROMPT_ENGINEERING.md` containing:
- Prompt structure and components (role/persona, task specification, process instructions, output format, constraints)
- Role definition and persona design patterns
- Process instruction patterns (sequential, conditional, parallel, hierarchical)
- Output format specification with JSON schema examples
- Quality enforcement techniques (reflection, validation gates, checklists)
- Prompt iteration and testing methodologies
- Examples from each of the four agent types in the codebase
- Cross-references to related documentation

**Success Definition**:
- A new developer can understand how agent prompts are structured in the PRP Pipeline
- All four agent prompt types are documented with real examples from PROMPTS.md
- Prompt components are explained with code references
- Quality enforcement patterns are clearly documented
- The guide follows the documentation structure and style of existing docs (CLI_REFERENCE.md, WORKFLOWS.md, ARCHITECTURE.md)
- Code examples are accurate and can be copied directly
- Cross-references link to related documentation appropriately

## User Persona

**Target User**: Developer or contributor who needs to:
- Understand the PRP Pipeline's agent prompt architecture
- Modify existing agent prompts for improved performance
- Create new agent personas with effective prompts
- Debug agent behavior through prompt analysis
- Extend the system with custom agent prompts

**Use Case**: User needs to understand:
- How are agent prompts structured in this project?
- What are the four critical prompts and what do they do?
- How do I write an effective agent persona?
- How do I specify JSON output formats?
- How do I enforce quality through prompts?
- How do I iterate and test prompts?

**User Journey**:
1. User opens docs/PROMPT_ENGINEERING.md to understand prompt design
2. User learns about prompt structure and components
3. User studies role definition and persona patterns
4. User understands process instruction patterns
5. User learns output format specification techniques
6. User studies quality enforcement methods
7. User reviews examples from all four agent types
8. User can now create or modify agent prompts effectively

**Pain Points Addressed**:
- "How do I structure an agent prompt?" - Prompt structure section
- "What makes a good persona?" - Role definition section
- "How do I get JSON output?" - Output format section
- "How do I ensure quality?" - Quality enforcement section
- "What are the patterns used in this codebase?" - Examples section

## Why

- **Developer Onboarding**: New contributors need clear prompt engineering documentation
- **Prompt Maintenance**: Understanding patterns enables effective prompt modification and debugging
- **Extensibility**: Understanding prompt design enables adding new agent personas
- **Knowledge Transfer**: Documents critical IP about prompt design decisions
- **Documentation Coverage**: Completes P2.M2.T1 (Architecture Documentation) milestone
- **Parallel Work**: Builds upon docs/ARCHITECTURE.md (multi-agent architecture) with prompt-specific guidance

## What

Create docs/PROMPT_ENGINEERING.md with comprehensive prompt engineering documentation:

### Success Criteria

- [ ] File created at docs/PROMPT_ENGINEERING.md
- [ ] Document header follows pattern (Status, Last Updated, Version, See Also)
- [ ] Table of Contents included with anchor links
- [ ] Prompt structure and components section
- [ ] Role definition and persona design section
- [ ] Process instruction patterns section
- [ ] Output format specification section
- [ ] Quality enforcement techniques section
- [ ] Prompt iteration and testing section
- [ ] Four agent type examples with actual prompts from PROMPTS.md
- [ ] Cross-references to GROUNDSWELL_GUIDE.md (P2.M2.T1.S2) and ARCHITECTURE.md (P2.M2.T1.S1)
- [ ] See Also section with links to related documentation

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:
- Complete PROMPTS.md content with all four critical prompts
- Agent factory pattern with all four personas from codebase
- Prompt generator implementation patterns (architect-prompt.ts, prp-blueprint-prompt.ts, bug-hunt-prompt.ts, delta-analysis-prompt.ts)
- Documentation formatting conventions from existing docs
- Groundswell prompt creation patterns (createPrompt, responseFormat, enableReflection)
- Parallel work item context (P2.M2.T1.S2 Groundswell guide)
- External research on prompt engineering best practices (in research/ directory)

### Documentation & References

```yaml
# MUST READ - Source Prompts
- file: /home/dustin/projects/hacky-hack/PROMPTS.md
  why: Contains all four critical prompts (TASK_BREAKDOWN, PRP_BLUEPRINT, PRP_BUILDER, BUG_HUNT)
  section: Lines 54-169 (Task Breakdown), 189-638 (PRP Creation), 641-713 (PRP Execution), 1059-1174 (Bug Finding)
  gotcha: This is the authoritative source - prompts.ts exports these as TypeScript constants

# MUST READ - Prompt Implementations
- file: /home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: TypeScript export of all system prompts with detailed JSDoc comments
  pattern: TASK_BREAKDOWN_PROMPT, PRP_BLUEPRINT_PROMPT, PRP_BUILDER_PROMPT, BUG_HUNT_PROMPT constants

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/architect-prompt.ts
  why: Example prompt generator with createPrompt(), responseFormat, enableReflection
  pattern: createArchitectPrompt() function returning Prompt<Backlog>

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/prp-blueprint-prompt.ts
  why: Complex prompt generator with context extraction and placeholder replacement
  pattern: constructUserPrompt(), extractParentContext(), createPRPBlueprintPrompt()

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/bug-hunt-prompt.ts
  why: QA prompt generator with completed tasks context
  pattern: constructUserPrompt(), createBugHuntPrompt()

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/delta-analysis-prompt.ts
  why: Delta analysis prompt with PRD comparison
  pattern: createDeltaAnalysisPrompt() with few-shot examples

- file: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
  why: Agent factory showing all four personas with token limits and MCP tools
  pattern: createBaseConfig(), createArchitectAgent(), createResearcherAgent(), createCoderAgent(), createQAAgent()

# MUST READ - Research Documents (External Knowledge)
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S3/research/prompt-engineering-best-practices.md
  why: Comprehensive research on prompt structure, personas, process instructions, output formats, quality enforcement, testing
  section: All sections - use as reference for best practices to include

- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S3/research/structured-output-techniques.md
  why: Groundswell-specific patterns for JSON output, Zod schemas, reflection, type safety
  section: Groundswell Framework Best Practices, createPrompt() API

- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S3/research/agent-persona-patterns.md
  why: Multi-agent system patterns, persona components, specialization strategies
  section: Persona Components, Multi-Agent Systems, Case Studies

# MUST READ - Documentation Conventions
- file: /home/dustin/projects/hacky-hack/docs/ARCHITECTURE.md
  why: Follow this structure and style (header, TOC, section formatting, code examples)
  pattern: Status block, Table of Contents, section headers with anchor links, See Also section

- file: /home/dustin/projects/hacky-hack/docs/WORKFLOWS.md
  why: Follow documentation style for technical guides
  pattern: Overview sections, code examples, table formatting, cross-references

- file: /home/dustin/projects/hacky-hack/docs/CLI_REFERENCE.md
  why: Follow reference documentation style
  pattern: Quick Reference table, detailed sections, code blocks with syntax highlighting

# MUST READ - Groundswell Integration (Parallel Work)
- file: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S2/PRP.md
  why: Context for parallel work item - Groundswell guide (P2.M2.T1.S2)
  gotcha: Reference GROUNDSWELL_GUIDE.md (will be at docs/GROUNDSWELL_GUIDE.md) for prompt creation API details

# EXTERNAL RESOURCES - Use for reference only, do not copy
- url: https://docs.anthropic.com/claude/docs/prompt-engineering
  why: Anthropic's official prompt engineering guide for industry best practices
  section: System prompts, role definition, structured output

- url: https://platform.openai.com/docs/guides/prompt-engineering
  why: OpenAI's prompt engineering guide for additional patterns
  section: Prompt structure, examples, iteration

- url: ~/projects/groundswell/docs/prompt.md
  why: Groundswell prompt creation documentation
  section: createPrompt(), responseFormat, data injection, validation
```

### Current Codebase Tree (Prompt-Related Files)

```bash
src/agents/
├── prompts.ts                          # All system prompt constants (TASK_BREAKDOWN, PRP_BLUEPRINT, etc.)
├── prompts/
│   ├── architect-prompt.ts             # Task Breakdown prompt generator
│   ├── prp-blueprint-prompt.ts         # PRP Creation prompt generator
│   ├── bug-hunt-prompt.ts              # Bug Finding prompt generator
│   ├── delta-analysis-prompt.ts        # Delta Analysis prompt generator
│   └── index.ts                        # Prompt re-exports
├── agent-factory.ts                    # Agent creation with all four personas
├── prp-generator.ts                    # Researcher agent using PRP_BLUEPRINT_PROMPT
├── prp-runtime.ts                      # Coder agent using PRP_BUILDER_PROMPT
└── prp-executor.ts                     # PRP execution workflow

PROMPTS.md                              # Original source document for all prompts
docs/
├── ARCHITECTURE.md                     # Multi-agent architecture overview (P2.M2.T1.S1)
├── GROUNDSWELL_GUIDE.md                # Groundswell integration (P2.M2.T1.S2) - being created in parallel
├── WORKFLOWS.md                        # Workflow documentation
└── CLI_REFERENCE.md                    # CLI reference documentation
```

### Desired Codebase Tree

```bash
docs/
├── ARCHITECTURE.md                     # Multi-agent architecture overview (P2.M2.T1.S1) - Existing
├── GROUNDSWELL_GUIDE.md                # Groundswell integration (P2.M2.T1.S2) - Being created in parallel
├── PROMPT_ENGINEERING.md               # Agent prompt engineering guide (P2.M2.T1.S3) - TO BE CREATED
├── WORKFLOWS.md                        # Workflow documentation - Existing
└── CLI_REFERENCE.md                    # CLI reference documentation - Existing
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Prompts are defined in PROMPTS.md as markdown, then exported as TypeScript string constants in src/agents/prompts.ts
// When updating prompts, edit PROMPTS.md first, then copy to src/agents/prompts.ts

// CRITICAL: Groundswell's createPrompt() requires responseFormat for structured output
// The responseFormat is a Zod schema that validates the LLM output
// Enable enableReflection for complex prompts to improve reliability

// PATTERN: All prompt generators follow this structure:
// 1. Import createPrompt and Prompt from 'groundswell'
// 2. Import the system prompt constant from '../prompts.js'
// 3. Define a constructUserPrompt() function to build dynamic content
// 4. Export a create{Agent}Prompt() function that returns Prompt<OutputType>

// GOTCHA: Use .js extension for ES module imports in TypeScript (e.g., './prompts.js')

// GOTCHA: Agent personas use PascalCase naming: "ArchitectAgent", "ResearcherAgent", etc.
// Token limits: architect=8192, researcher/coder/qa=4096

// CRITICAL: The four critical prompts are:
// 1. TASK_BREAKDOWN_PROMPT - Architect Agent for PRD analysis and task breakdown
// 2. PRP_BLUEPRINT_PROMPT - Researcher Agent for PRP generation and research
// 3. PRP_BUILDER_PROMPT - Coder Agent for PRP execution and code implementation
// 4. BUG_HUNT_PROMPT - QA Agent for validation and bug hunting
```

---

## Implementation Blueprint

### Data Models and Structure

No data models needed - this is a documentation-only task. The documentation structure should follow:

```markdown
# Agent Prompt Engineering Guide

> Brief description

**Status**: Published
**Last Updated**: [date]
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
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE docs/PROMPT_ENGINEERING.md with header and structure
  - IMPLEMENT: File header with Status, Last Updated, Version
  - IMPLEMENT: Table of Contents with anchor links
  - IMPLEMENT: Overview section explaining the four critical prompts
  - FOLLOW pattern: docs/ARCHITECTURE.md (header format, TOC style)
  - NAMING: PROMPT_ENGINEERING.md (all caps, underscore separator)
  - PLACEMENT: docs/ directory alongside other documentation

Task 2: WRITE "Prompt Structure and Components" section
  - IMPLEMENT: Explanation of prompt components (role/persona, context, task, output format, constraints)
  - IMPLEMENT: Visual diagram or code example showing prompt structure
  - IMPLEMENT: Reference to TASK_BREAKDOWN_PROMPT as primary example
  - FOLLOW pattern: research/prompt-engineering-best-practices.md section 1
  - CODE EXAMPLE: Use TASK_BREAKDOWN_PROMPT from src/agents/prompts.ts lines 33-146
  - PLACEMENT: After Table of Contents

Task 3: WRITE "Role Definition and Persona" section
  - IMPLEMENT: Core persona elements (Professional Identity, Expertise, Tone, Constraints, Motivation)
  - IMPLEMENT: Four persona examples from codebase (Architect, Researcher, Coder, QA)
  - IMPLEMENT: Persona design principles
  - FOLLOW pattern: research/agent-persona-patterns.md section 1
  - CODE EXAMPLE: Use createBaseConfig() and persona constants from src/agents/agent-factory.ts
  - PLACEMENT: After Prompt Structure section

Task 4: WRITE "Process Instruction Patterns" section
  - IMPLEMENT: Four patterns (Sequential Steps, Conditional Branching, Parallel Work, Hierarchical Decomposition)
  - IMPLEMENT: Code examples from TASK_BREAKDOWN_PROMPT and PRP_BLUEPRINT_PROMPT
  - IMPLEMENT: Best practices for instruction following
  - FOLLOW pattern: research/prompt-engineering-best-practices.md section 3
  - CODE EXAMPLE: Use "ULTRATHINK & PLAN" and "RESEARCH PROCESS" sections from PROMPTS.md
  - PLACEMENT: After Role Definition section

Task 5: WRITE "Output Format Specification" section
  - IMPLEMENT: JSON schema best practices with examples
  - IMPLEMENT: Groundswell responseFormat usage
  - IMPLEMENT: File output specifications (critical for bug report signaling)
  - FOLLOW pattern: research/structured-output-techniques.md sections 1-2
  - CODE EXAMPLE: Use BacklogSchema, PRPDocumentSchema, TestResultsSchema references
  - PLACEMENT: After Process Instruction section

Task 6: WRITE "Quality Enforcement Techniques" section
  - IMPLEMENT: Reflection and self-correction patterns
  - IMPLEMENT: 4-Level Progressive Validation System
  - IMPLEMENT: "No Prior Knowledge" test methodology
  - IMPLEMENT: Comprehensive validation checklists
  - FOLLOW pattern: research/prompt-engineering-best-practices.md section 5
  - CODE EXAMPLE: Use enableReflection from prompt generators, validation from PRP template
  - PLACEMENT: After Output Format section

Task 7: WRITE "Prompt Iteration and Testing" section
  - IMPLEMENT: Iterative improvement process
  - IMPLEMENT: A/B testing framework concepts
  - IMPLEMENT: Test case design (happy path, edge cases, errors)
  - IMPLEMENT: Performance metrics and success criteria
  - FOLLOW pattern: research/prompt-engineering-best-practices.md section 6
  - PLACEMENT: After Quality Enforcement section

Task 8: WRITE "Four Critical Prompts" section
  - IMPLEMENT: Task Breakdown Prompt (Architect) - full example with explanation
  - IMPLEMENT: PRP Creation Prompt (Researcher) - full example with explanation
  - IMPLEMENT: PRP Execution Prompt (Coder) - full example with explanation
  - IMPLEMENT: Bug Finding Prompt (QA) - full example with explanation
  - IMPLEMENT: For each prompt: role, task, output format, key techniques used
  - USE ACTUAL CONTENT: PROMPTS.md lines 54-169, 189-638, 641-713, 1059-1174
  - REFERENCE: Corresponding prompt generator files (architect-prompt.ts, prp-blueprint-prompt.ts, etc.)
  - PLACEMENT: After Prompt Iteration section

Task 9: WRITE "See Also" section
  - IMPLEMENT: Links to ARCHITECTURE.md (multi-agent architecture)
  - IMPLEMENT: Links to GROUNDSWELL_GUIDE.md (prompt creation API)
  - IMPLEMENT: Links to WORKFLOWS.md (workflow orchestration)
  - IMPLEMENT: Links to external resources (Anthropic, OpenAI docs)
  - FOLLOW pattern: docs/ARCHITECTURE.md See Also section
  - PLACEMENT: End of document

Task 10: VALIDATE documentation quality
  - VERIFY: All code examples are accurate and can be copied
  - VERIFY: All links work (TOC anchors, cross-references, external URLs)
  - VERIFY: Document follows existing doc conventions
  - VERIFY: Content is complete and actionable
  - VERIFY: Parallel work item (GROUNDSWELL_GUIDE.md) is referenced appropriately
```

### Implementation Patterns & Key Details

```markdown
# Documentation Style Guidelines (follow existing patterns)

# Header Pattern
> Brief one-sentence description

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

# Section Headers
## Section Name
### Subsection Name

# Code Examples
```typescript
// Include file path comment
// src/agents/prompts.ts

export const TASK_BREAKDOWN_PROMPT = `...`
```

# Cross-References
See [Architect Prompt Generator](../src/agents/prompts/architect-prompt.ts) for implementation details.

# Tables
| Prompt | Agent | Purpose | Output Schema |
|--------|-------|---------|---------------|
| TASK_BREAKDOWN | Architect | PRD analysis | BacklogSchema |

# Callouts
> **Note**: Critical information uses blockquote format.

**CRITICAL**: Use emphasis for critical implementation details.

**GOTCHA**: Highlight common pitfalls.

# External Links
[Anthropic Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
```

### Integration Points

```yaml
DOCUMENTATION:
  - add to: docs/PROMPT_ENGINEERING.md
  - reference: docs/ARCHITECTURE.md (multi-agent overview)
  - reference: docs/GROUNDSWELL_GUIDE.md (prompt creation API) - being created in parallel
  - reference: docs/WORKFLOWS.md (workflow orchestration)

CROSS-REFERENCES:
  - Link to src/agents/prompts.ts for source prompts
  - Link to src/agents/prompts/*.ts for generator implementations
  - Link to src/agents/agent-factory.ts for persona configurations
  - Link to PROMPTS.md for original prompt definitions
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# No code to validate - documentation only
# Verify file was created
test -f docs/PROMPT_ENGINEERING.md && echo "File exists" || echo "File not found"

# Check markdown syntax (if tools available)
npx markdownlint docs/PROMPT_ENGINEERING.md 2>/dev/null || echo "markdownlint not available"

# Expected: File exists, no critical markdown syntax errors
```

### Level 2: Content Validation (Completeness Check)

```bash
# Verify all required sections exist
grep -q "## Prompt Structure and Components" docs/PROMPT_ENGINEERING.md && echo "Section 1 OK" || echo "Missing Section 1"
grep -q "## Role Definition and Persona" docs/PROMPT_ENGINEERING.md && echo "Section 2 OK" || echo "Missing Section 2"
grep -q "## Process Instruction Patterns" docs/PROMPT_ENGINEERING.md && echo "Section 3 OK" || echo "Missing Section 3"
grep -q "## Output Format Specification" docs/PROMPT_ENGINEERING.md && echo "Section 4 OK" || echo "Missing Section 4"
grep -q "## Quality Enforcement Techniques" docs/PROMPT_ENGINEERING.md && echo "Section 5 OK" || echo "Missing Section 5"
grep -q "## Prompt Iteration and Testing" docs/PROMPT_ENGINEERING.md && echo "Section 6 OK" || echo "Missing Section 6"
grep -q "## Four Critical Prompts" docs/PROMPT_ENGINEERING.md && echo "Section 7 OK" || echo "Missing Section 7"
grep -q "## See Also" docs/PROMPT_ENGINEERING.md && echo "See Also OK" || echo "Missing See Also"

# Expected: All sections present
```

### Level 3: Link Validation (Reference Check)

```bash
# Check TOC anchor links work (manual verification required)
echo "Manual check: Click each TOC link and verify it navigates correctly"

# Check cross-references to existing files
grep -q "src/agents/prompts.ts" docs/PROMPT_ENGINEERING.md && echo "prompts.ts ref OK" || echo "Missing prompts.ts ref"
grep -q "ARCHITECTURE.md" docs/PROMPT_ENGINEERING.md && echo "ARCHITECTURE ref OK" || echo "Missing ARCHITECTURE ref"
grep -q "GROUNDSWELL_GUIDE.md" docs/PROMPT_ENGINEERING.md && echo "GROUNDSWELL ref OK" || echo "Missing GROUNDSWELL ref"

# Check code examples are accurate (manual verification)
echo "Manual check: Verify code examples match actual source files"

# Expected: All references point to valid files
```

### Level 4: Documentation Quality (Manual Review)

```bash
# Manual validation checklist
echo "Manual Validation Checklist:"
echo "1. Read the document start to finish - does it make sense?"
echo "2. Check code examples against source files - are they accurate?"
echo "3. Verify TOC links work - do they navigate correctly?"
echo "4. Check cross-references - do they point to valid locations?"
echo "5. Verify external links - do they work?"
echo "6. Compare to existing docs style - is it consistent?"
echo "7. Ask: Can a new developer understand prompt engineering from this?"

# Expected: All manual checks pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] File created at docs/PROMPT_ENGINEERING.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents included with anchor links
- [ ] All required sections present (7 sections + See Also)
- [ ] No markdown syntax errors

### Content Validation

- [ ] Prompt structure and components explained clearly
- [ ] Role definition and persona patterns documented
- [ ] Process instruction patterns with examples
- [ ] Output format specification with JSON schema examples
- [ ] Quality enforcement techniques documented
- [ ] Prompt iteration and testing methodologies
- [ ] All four agent prompts documented with examples

### Code Quality Validation

- [ ] All code examples are accurate (verified against source files)
- [ ] Code examples include file path references
- [ ] Code examples use proper syntax highlighting
- [ ] TypeScript examples follow codebase conventions

### Documentation & Deployment

- [ ] Follows existing documentation style (ARCHITECTURE.md, WORKFLOWS.md)
- [ ] Cross-references link to valid locations
- [ ] External links work (test them)
- [ ] See Also section includes all related docs
- [ ] Parallel work item (GROUNDSWELL_GUIDE.md) referenced appropriately

---

## Anti-Patterns to Avoid

- Don't copy-paste entire prompts - use excerpts and link to source
- Don't include outdated information - verify against current codebase
- Don't use generic examples - use real examples from the codebase
- Don't skip the "why" - explain the reasoning behind prompt patterns
- Don't forget cross-references - link to related documentation
- Don't make the document too long - be comprehensive but concise
- Don't use external links as primary content - reference them for additional reading
