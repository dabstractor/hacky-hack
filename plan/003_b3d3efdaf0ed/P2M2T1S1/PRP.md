# Product Requirement Prompt (PRP): Create Architecture Overview Documentation

> Transform PRD into working code with complete context, clear objectives, and validation criteria

**Status**: Ready for Implementation
**Last Updated**: 2026-01-23
**Work Item**: P2.M2.T1.S1 - Create architecture overview documentation

---

## Goal

**Feature Goal**: Create a comprehensive architecture overview document (`docs/ARCHITECTURE.md`) that explains the PRP Pipeline's high-level system design, including component diagrams, Groundswell framework usage, multi-agent architecture, state management, and task execution flow.

**Deliverable**: Documentation file `docs/ARCHITECTURE.md` containing:

- High-level system design with component diagram
- Groundswell framework usage (decorators, workflows, agents)
- Multi-agent architecture with roles
- State management and persistence
- Task hierarchy and execution flow
- ASCII art diagrams and component interaction descriptions

**Success Definition**:

- A new developer can understand the PRP Pipeline architecture from this document
- All four core processing engines are documented (Session Manager, Task Orchestrator, Agent Runtime, Pipeline Controller)
- Groundswell framework integration is clearly explained
- State management and persistence patterns are documented
- ASCII and Mermaid diagrams show component relationships
- The document follows the structure and style of `docs/api/media/architecture.md`

## User Persona

**Target User**: Developer, architect, or technical contributor who needs to:

- Understand the PRP Pipeline's architecture
- Contribute to the codebase
- Debug or extend the system
- Understand how the four engines work together

**Use Case**: User needs to understand:

- What are the main components and how do they interact?
- How does Groundswell framework power the pipeline?
- What are the four agent personas and their roles?
- How is state managed and persisted?
- How does the task hierarchy and execution flow work?

**User Journey**:

1. User opens docs/ARCHITECTURE.md to understand the system
2. User reads the system overview and component diagram
3. User studies the four core processing engines
4. User learns about the multi-agent architecture
5. User understands state management and persistence
6. User reviews the task execution flow
7. User has a complete mental model of the system

**Pain Points Addressed**:

- "What are the main components?" - System overview with diagram
- "How do the components interact?" - Component interaction descriptions
- "What's the Groundswell framework?" - Groundswell integration section
- "How does state work?" - State management section
- "What's the execution flow?" - Task execution flow section

## Why

- **Developer Onboarding**: New contributors need clear architecture documentation
- **System Understanding**: Complex multi-agent system requires comprehensive overview
- **Extensibility**: Understanding architecture enables adding new agents, tools, workflows
- **Maintenance**: Debugging and troubleshooting require architectural knowledge
- **Documentation Coverage**: Completes P2.M2 (Developer Documentation) milestone

## What

Create docs/ARCHITECTURE.md with comprehensive architecture overview:

### Success Criteria

- [ ] File created at docs/ARCHITECTURE.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents included with anchor links
- [ ] System Overview section with high-level design
- [ ] Four Core Processing Engines section (detailed for each)
- [ ] Groundswell Framework Integration section
- [ ] Multi-Agent Architecture section with roles
- [ ] State Management and Persistence section
- [ ] Task Hierarchy and Execution Flow section
- [ ] ASCII art and Mermaid diagrams
- [ ] Component interaction descriptions
- [ ] Cross-references to related documentation

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:

- Complete component architecture from codebase analysis
- Groundswell framework integration details
- Agent system patterns and roles
- State management and persistence patterns
- Documentation formatting patterns from existing docs
- Parallel work item context (P2.M1.T2.S3 PRD best practices guide)

### Documentation & References

```yaml
# MUST READ - Existing architecture and documentation patterns
- file: docs/api/media/architecture.md
  why: Complete architecture documentation to follow as template - contains system overview, four core engines, data flow, component architecture, Groundswell integration, extensibility patterns, caching, session management, task orchestration, agent system, performance, security, API docs
  pattern: Header format, section organization, Mermaid diagrams, ASCII art, table formatting, cross-reference linking
  gotcha: This is a comprehensive reference - follow its structure closely for the new docs/ARCHITECTURE.md

- file: README.md
  why: High-level overview and Mermaid flowchart showing pipeline flow
  pattern: System flow diagram with PRD → Architect → tasks.json → Task Orchestrator → Researcher → Coder → Validation → QA
  gotcha: Contains the main system flow diagram to replicate

- file: PROMPTS.md
  why: System prompts and PRP concept definition
  pattern: PRP concept, agent personas, prompt templates, validation gates
  section: PRP_README, TASK_BREAKDOWN_SYSTEM_PROMPT, PRP_CREATE_PROMPT, PRP_EXECUTE_PROMPT

- file: src/core/session-manager.ts
  why: Session state management, PRD hashing, delta sessions
  pattern: SessionState interface, initialize(), createDeltaSession(), updateItemStatus(), flushUpdates()
  gotcha: Immutable state with batch updates

- file: src/core/task-orchestrator.ts
  why: DFS traversal, dependency resolution, scope execution
  pattern: processNextItem(), canExecute(), waitForDependencies()
  gotcha: Depth-first pre-order traversal

- file: src/agents/agent-factory.ts
  why: Agent creation patterns and configuration
  pattern: createAgent(), AgentConfig interface, persona-specific configs
  gotcha: All agents use GLM-4.7 model with persona-specific token limits

- file: src/agents/prp-runtime.ts
  why: PRP execution orchestration and validation gates
  pattern: PRP generation, PRP execution, 4-level validation
  gotcha: Progressive validation with fix-and-retry

- file: src/workflows/prp-pipeline.ts
  why: Main pipeline orchestration
  pattern: extends Workflow, @Step decorators, graceful shutdown
  gotcha: Groundswell workflow with @Step({ trackTiming: true })

- file: docs/INSTALLATION.md
  why: Documentation header format, section organization
  pattern: Status, Last Updated, Version; numbered sections; troubleshooting pattern
  gotcha: Uses ** for bold emphasis

- file: docs/CONFIGURATION.md
  why: Table formatting, quick reference section pattern
  pattern: Quick Reference table at top, detailed sections with tables
  gotcha: Environment variable names use ALL_CAPS with backticks

- docfile: plan/003_b3d3efdaf0ed/P2M2T1S1/research/01_core_components_analysis.md
  why: Core components analysis (Session Manager, Task Orchestrator, Agent Runtime, Pipeline Controller)
  section: Four Core Processing Engines, data structures, design patterns

- docfile: plan/003_b3d3efdaf0ed/P2M2T1S1/research/02_agent_system_analysis.md
  why: Agent system architecture (four personas, prompt templates, tool system, validation gates)
  section: Agent personas, prompt templates, MCP tools, 4-level validation

- docfile: plan/003_b3d3efdaf0ed/P2M2T1S1/research/03_workflow_analysis.md
  why: Workflow orchestration (main pipeline, delta sessions, bug hunt, fix cycle)
  section: Main pipeline flow, delta workflow, bug hunt phases

- docfile: plan/003_b3d3efdaf0ed/P2M2T1S1/research/04_documentation_patterns.md
  why: Documentation formatting patterns
  section: Header format, table of contents, section organization, table formatting, diagram styles, cross-reference linking

- docfile: plan/003_b3d3efdaf0ed/P2M2T1S1/research/05_groundswell_integration.md
  why: Groundswell framework integration details
  section: @Workflow, @Step, @ObservedState decorators, agent creation, tool registration, caching

- docfile: plan/003_b3d3efdaf0ed/P2M2T1S1/research/06_state_management_analysis.md
  why: State management and persistence patterns
  section: Session directory structure, tasks.json format, PRD hashing, delta sessions
```

### Current Codebase Tree (relevant subset)

```bash
hacky-hack/
├── docs/
│   ├── api/
│   │   └── media/
│   │       └── architecture.md     # EXISTING - comprehensive architecture to use as template
│   ├── INSTALLATION.md             # Header format reference
│   ├── CONFIGURATION.md            # Table formatting reference
│   ├── CLI_REFERENCE.md            # Linking pattern reference
│   ├── WORKFLOWS.md                # Section organization reference
│   └── ARCHITECTURE.md             # TARGET FILE - TO BE CREATED
├── src/
│   ├── core/                       # Core processing engines
│   │   ├── session-manager.ts      # State management
│   │   ├── task-orchestrator.ts    # Backlog processing
│   │   ├── models.ts               # Type definitions
│   │   ├── prd-differ.ts           # PRD diffing
│   │   ├── research-queue.ts       # Parallel PRP generation
│   │   └── scope-resolver.ts       # Scope parsing
│   ├── agents/                     # Agent system
│   │   ├── agent-factory.ts        # Agent creation
│   │   ├── prp-runtime.ts          # PRP execution
│   │   ├── prp-generator.ts        # PRP generation
│   │   ├── prp-executor.ts         # PRP execution
│   │   └── prompts/
│   │       ├── architect-prompt.ts
│   │       ├── prp-blueprint-prompt.ts
│   │       └── bug-hunt-prompt.ts
│   ├── workflows/                  # Workflow orchestration
│   │   ├── prp-pipeline.ts         # Main pipeline
│   │   ├── delta-analysis-workflow.ts
│   │   ├── bug-hunt-workflow.ts
│   │   └── fix-cycle-workflow.ts
│   └── tools/                      # MCP tools
│       ├── bash-mcp.ts
│       ├── filesystem-mcp.ts
│       └── git-mcp.ts
└── PROMPTS.md                       # System prompts reference
```

### Desired Codebase Tree with Files to be Added

```bash
hacky-hack/
├── docs/
│   ├── api/
│   │   └── media/
│   │       └── architecture.md     # (existing - comprehensive reference)
│   ├── INSTALLATION.md             # (existing)
│   ├── CONFIGURATION.md            # (existing)
│   ├── CLI_REFERENCE.md            # (existing)
│   ├── WORKFLOWS.md                # (existing)
│   └── ARCHITECTURE.md             # NEW FILE - High-level architecture overview
│       ├── Overview
│       │   ├── High-Level System Design
│       │   ├── Design Philosophy
│       │   └── Main System Flow Diagram
│       ├── Four Core Processing Engines
│       │   ├── Session Manager
│       │   ├── Task Orchestrator
│       │   ├── Agent Runtime
│       │   └── Pipeline Controller
│       ├── Groundswell Framework Integration
│       │   ├── @Workflow Decorator
│       │   ├── @Step Decorator
│       │   ├── @ObservedState Pattern
│       │   ├── Agent Creation
│       │   └── Tool Registration
│       ├── Multi-Agent Architecture
│       │   ├── Agent Personas
│       │   ├── Prompt Engineering
│       │   ├── Tool System (MCP)
│       │   └── Validation Gates
│       ├── State Management and Persistence
│       │   ├── Session Directory Structure
│       │   ├── tasks.json Format
│       │   ├── PRD Hash-Based Change Detection
│       │   ├── Delta Sessions
│       │   └── State Persistence Patterns
│       └── Task Hierarchy and Execution Flow
│           ├── Four-Level Hierarchy
│           ├── DFS Traversal
│           ├── Dependency Resolution
│           └── Execution Flow Diagram
```

### Known Gotchas of Our Codebase & Library Quirks

```bash
# CRITICAL: The existing docs/api/media/architecture.md is VERY comprehensive
# Use it as the primary template for structure and style
# It contains detailed sections on all aspects of the architecture

# CRITICAL: The README.md contains the main system flow diagram
# Replicate this Mermaid diagram in the new ARCHITECTURE.md

# CRITICAL: Groundswell framework provides @Workflow, @Step, @ObservedState decorators
# All workflows extend the Workflow class from 'groundswell'

# CRITICAL: All agents use GLM-4.7 model with persona-specific token limits
# Architect: 8192 tokens, others: 4096 tokens

# CRITICAL: The task hierarchy is Phase > Milestone > Task > Subtask (4 levels)
# Subtasks are the atomic unit of work

# CRITICAL: State is immutable with readonly properties
# Batch updates are flushed atomically

# CRITICAL: Delta sessions are linked via delta_from.txt file
# Contains parent session path for reference

# CRITICAL: MCP tools are singleton instances shared across all agents
# BashMCP, FilesystemMCP, GitMCP

# CRITICAL: Documentation header format is consistent
# Must include: Status, Last Updated, Version

# CRITICAL: Use both Mermaid diagrams and ASCII art
# Mermaid for flowcharts, ASCII for directory structures

# CRITICAL: Cross-reference links use relative paths
# Use [CLI Reference](./CLI_REFERENCE.md) format

# CRITICAL: Table formatting follows established patterns
# Left-aligned columns, consistent spacing
```

## Implementation Blueprint

### Document Structure

Create docs/ARCHITECTURE.md following the structure of docs/api/media/architecture.md:

```markdown
# Architecture Overview

> Comprehensive overview of the PRP Pipeline architecture, including system design, component interactions, Groundswell framework integration, multi-agent system, state management, and task execution flow.

**Status**: Published
**Last Updated**: [DATE]
**Version**: 1.0.0

## Table of Contents

## System Overview

### Design Philosophy

### High-Level Architecture

## Four Core Processing Engines

### 1. Session Manager

### 2. Task Orchestrator

### 3. Agent Runtime

### 4. Pipeline Controller

## Groundswell Framework Integration

### Workflow Decorators

### Agent System

### Tool Registration

## Multi-Agent Architecture

### Agent Personas

### Prompt Engineering

### Tool System

### Validation Gates

## State Management and Persistence

### Session Directory Structure

### tasks.json Format

### PRD Hash-Based Change Detection

### Delta Sessions

## Task Hierarchy and Execution Flow

### Four-Level Hierarchy

### DFS Traversal Algorithm

### Dependency Resolution

## See Also
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: PREPARE - Review existing architecture documentation
  - READ: docs/api/media/architecture.md in its entirety
  - READ: README.md for main system flow diagram
  - READ: PROMPTS.md for PRP concept and agent personas
  - EXTRACT: Document header template (Status, Last Updated, Version)
  - EXTRACT: Section organization and structure
  - EXTRACT: Mermaid diagram patterns
  - EXTRACT: ASCII art patterns for directory structures

Task 2: CREATE - Document header and Table of Contents
  - CREATE: File docs/ARCHITECTURE.md
  - ADD: Document header (Status: Published, Last Updated, Version: 1.0.0)
  - ADD: Brief description of the document
  - ADD: Table of Contents with all sections and anchor links
  - FOLLOW: Pattern from docs/api/media/architecture.md

Task 3: WRITE - System Overview section
  - ADD: Design Philosophy (4 core principles)
  - INCLUDE: High-Level Architecture with Mermaid diagram (from README.md)
  - INCLUDE: System flow description
  - FORMAT: Numbered subsections, clear descriptions

Task 4: WRITE - Four Core Processing Engines section
  - ADD: Session Manager (state management, PRD hashing, delta sessions)
  - ADD: Task Orchestrator (DFS traversal, dependency resolution)
  - ADD: Agent Runtime (agent creation, tool registration, PRP execution)
  - ADD: Pipeline Controller (workflow orchestration, graceful shutdown)
  - INCLUDE: ASCII diagrams for component relationships
  - INCLUDE: Key methods and responsibilities
  - FORMAT: Consistent subsections for each engine

Task 5: WRITE - Groundswell Framework Integration section
  - ADD: @Workflow Decorator explanation
  - ADD: @Step Decorator explanation
  - ADD: @ObservedState Pattern
  - ADD: Agent Creation with createAgent()
  - ADD: Tool Registration (MCP servers)
  - INCLUDE: Code examples from research
  - FORMAT: Code blocks with TypeScript syntax highlighting

Task 6: WRITE - Multi-Agent Architecture section
  - ADD: Agent Personas table (Architect, Researcher, Coder, QA)
  - ADD: Prompt Engineering approach
  - ADD: Tool System (BashMCP, FilesystemMCP, GitMCP)
  - ADD: Validation Gates (4-level system)
  - INCLUDE: Agent responsibilities table
  - INCLUDE: Validation gate commands
  - FORMAT: Tables for personas, code blocks for examples

Task 7: WRITE - State Management and Persistence section
  - ADD: Session Directory Structure with ASCII art
  - ADD: tasks.json Format with JSON example
  - ADD: PRD Hash-Based Change Detection
  - ADD: Delta Sessions explanation
  - ADD: State Persistence Patterns
  - INCLUDE: Directory tree ASCII diagram
  - INCLUDE: JSON schema example
  - FORMAT: ASCII art for directories, code blocks for JSON

Task 8: WRITE - Task Hierarchy and Execution Flow section
  - ADD: Four-Level Hierarchy (Phase > Milestone > Task > Subtask)
  - ADD: DFS Traversal Algorithm
  - ADD: Dependency Resolution
  - ADD: Execution Flow Diagram (Mermaid)
  - INCLUDE: Hierarchy diagram
  - INCLUDE: Flow diagram showing execution
  - FORMAT: Mermaid diagrams, numbered steps

Task 9: WRITE - See Also section
  - ADD: Cross-references to related documentation
  - INCLUDE: README.md (project overview)
  - INCLUDE: docs/api/media/architecture.md (detailed architecture)
  - INCLUDE: docs/CLI_REFERENCE.md (CLI documentation)
  - INCLUDE: docs/WORKFLOWS.md (workflow documentation)
  - INCLUDE: PROMPTS.md (system prompts)
  - FORMAT: Unordered list with descriptive links

Task 10: VALIDATE - Review against success criteria
  - CHECK: Document header follows pattern
  - CHECK: All sections from architecture.md template covered
  - CHECK: Four core engines documented
  - CHECK: Groundswell integration explained
  - CHECK: Multi-agent architecture documented
  - CHECK: State management section present
  - CHECK: Task hierarchy and execution flow documented
  - CHECK: ASCII and Mermaid diagrams included
  - CHECK: Cross-references link appropriately
  - CHECK: File created at docs/ARCHITECTURE.md
```

### Implementation Patterns & Key Details

```markdown
<!-- Header Pattern (from docs/api/media/architecture.md) -->

# Architecture Overview

> Comprehensive overview of the PRP Pipeline architecture...

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

---

<!-- Table of Contents Pattern -->

## Table of Contents

- [System Overview](#system-overview)
- [Four Core Processing Engines](#four-core-processing-engines)
- [Groundswell Framework Integration](#groundswell-framework-integration)
- [Multi-Agent Architecture](#multi-agent-architecture)
- [State Management and Persistence](#state-management-and-persistence)
- [Task Hierarchy and Execution Flow](#task-hierarchy-and-execution-flow)
- [See Also](#see-also)

---

<!-- Mermaid Diagram Pattern (from README.md) -->

## High-Level Architecture

\`\`\`mermaid
flowchart LR
A[PRD.md] --> B[Architect Agent]
B --> C[tasks.json<br/>Backlog]
C --> D[Task Orchestrator]
D --> E[Researcher Agent<br/>PRP Generator]
E --> F[Coder Agent<br/>PRP Executor]
F --> G[4-Level Validation]
G --> H{All Complete?}
H -->|No| D
H -->|Yes| I[QA Agent<br/>Bug Hunt]
\`\`\`

<!-- ASCII Art Pattern (for directory structures) -->

## Session Directory Structure

\`\`\`
plan/
├── 001_14b9dc2a33c7/
│ ├── prd_snapshot.md # Original PRD content
│ ├── tasks.json # Task backlog registry
│ └── parent_session.txt # Parent reference (delta sessions)
├── 002_a1b2c3d4e5f6/
│ └── ...
\`\`\`

<!-- Table Formatting Pattern -->

## Agent Personas

| Agent          | Persona               | Responsibility                  | Token Limit |
| -------------- | --------------------- | ------------------------------- | ----------- |
| **Architect**  | System Designer       | Generates task backlog from PRD | 8192        |
| **Researcher** | Context Gatherer      | Generates PRPs for subtasks     | 4096        |
| **Coder**      | Implementation Expert | Executes PRPs to produce code   | 4096        |
| **QA**         | Quality Assurance     | Finds and fixes bugs            | 4096        |

<!-- Code Block Pattern -->

## Agent Creation

\`\`\`typescript
import { createAgent } from 'groundswell';

function createArchitectAgent(): Agent {
return createAgent({
apiKey: process.env.ANTHROPIC_API_KEY!,
model: 'claude-opus-4-5-20251101',
systemPrompt: TASK_BREAKDOWN_PROMPT,
maxTokens: 8192
});
}
\`\`\`

<!-- Cross-Reference Pattern -->

## See Also

- **[README.md](../README.md)** - Project overview and quick start
- **[Detailed Architecture](./api/media/architecture.md)** - Complete architecture documentation
- **[CLI Reference](./CLI_REFERENCE.md)** - Command-line interface documentation
- **[Workflows](./WORKFLOWS.md)** - Pipeline workflow documentation
- **[PROMPTS.md](../PROMPTS.md)** - System prompts and PRP concepts
```

### Integration Points

```yaml
docs/api/media/architecture.md:
  - reference: 'For complete architecture details, see [Detailed Architecture](./api/media/architecture.md)'
  - assume: User wants deeper technical details after reading overview
  - link: All sections (processing engines, data flow, component architecture, etc.)

README.md:
  - reference: 'For project overview and quick start, see [README.md](../README.md)'
  - placement: See Also section
  - context: High-level project information

docs/CLI_REFERENCE.md:
  - reference: 'For CLI documentation, see [CLI Reference](./CLI_REFERENCE.md)'
  - placement: See Also section
  - context: Command-line usage

docs/WORKFLOWS.md:
  - reference: 'For workflow documentation, see [Workflows](./WORKFLOWS.md)'
  - placement: See Also section
  - context: Detailed workflow explanations

PROMPTS.md:
  - reference: 'For system prompts and PRP concepts, see [PROMPTS.md](../PROMPTS.md)'
  - placement: See Also section
  - context: Agent prompts and validation logic
```

## Validation Loop

### Level 1: File Existence and Syntax

````bash
# Check that file was created
ls -la docs/ARCHITECTURE.md

# Check markdown syntax
npx markdownlint docs/ARCHITECTURE.md 2>/dev/null || echo "Verify markdown syntax is valid"

# Manual validation checklist
- [ ] File exists at docs/ARCHITECTURE.md
- [ ] Markdown syntax is valid (no malformed tables, lists)
- [ ] All code blocks have language tags (```typescript, ```bash, ```mermaid)
- [ ] All links use correct relative paths (./, ../)
- [ ] All internal anchors (#section-name) exist

# Expected: File exists, valid markdown syntax
````

### Level 2: Content Completeness

````bash
# Manual content review checklist
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents with all sections
- [ ] System Overview section with design philosophy
- [ ] High-Level Architecture with Mermaid diagram
- [ ] Four Core Processing Engines section (all 4 engines)
- [ ] Groundswell Framework Integration section
- [ ] Multi-Agent Architecture section
- [ ] State Management and Persistence section
- [ ] Task Hierarchy and Execution Flow section
- [ ] See Also section with cross-references

# Verify section count
grep -c "^## " docs/ARCHITECTURE.md  # Should be 7-10 top-level sections

# Verify diagrams present
grep -c "^```mermaid" docs/ARCHITECTURE.md  # Should have 2-3 Mermaid diagrams

# Expected: All content validation checks pass
````

### Level 3: Documentation Quality

```bash
# Manual quality review checklist
- [ ] Content is accurate based on codebase analysis
- [ ] Four core engines are correctly described
- [ ] Groundswell integration is accurately explained
- [ ] Agent personas match PROMPTS.md
- [ ] State management patterns are correct
- [ ] Task hierarchy is accurate (Phase > Milestone > Task > Subtask)
- [ ] Diagrams are clear and accurate
- [ ] Code examples are valid TypeScript
- [ ] Cross-references link to existing files
- [ ] Document follows style of docs/api/media/architecture.md

# Test internal links
# Verify all ./ links point to existing files in docs/

# Expected: All quality validation checks pass
```

### Level 4: Usability Validation

```bash
# Manual usability review checklist
- [ ] New developer can understand the architecture from this document
- [ ] System overview provides clear high-level picture
- [ ] Component interactions are well explained
- [ ] Groundswell framework is accessible to newcomers
- [ ] Multi-agent architecture is clear
- [ ] State management is understandable
- [ ] Task execution flow is logical
- [ ] Diagrams aid understanding
- [ ] See Also section provides helpful next steps
- [ ] Document is well-organized and easy to navigate

# Test readability
# Can someone unfamiliar with the codebase understand the architecture?

# Expected: All usability validation checks pass
```

## Final Validation Checklist

### Technical Validation

- [ ] File created at docs/ARCHITECTURE.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents with all sections and anchors
- [ ] All code blocks have syntax highlighting (`typescript, `bash, ```mermaid)
- [ ] All internal links use correct relative paths (./, ../)
- [ ] All external links are valid URLs
- [ ] Markdown syntax is valid (tables, lists, code blocks)
- [ ] All Mermaid diagrams are properly formatted
- [ ] All internal anchors (#section-name) exist

### Content Validation

- [ ] System Overview section with design philosophy and high-level diagram
- [ ] Four Core Processing Engines section (Session Manager, Task Orchestrator, Agent Runtime, Pipeline Controller)
- [ ] Groundswell Framework Integration section (@Workflow, @Step, @ObservedState, agent creation, tool registration)
- [ ] Multi-Agent Architecture section (agent personas, prompt engineering, tool system, validation gates)
- [ ] State Management and Persistence section (session directory, tasks.json, PRD hashing, delta sessions)
- [ ] Task Hierarchy and Execution Flow section (4-level hierarchy, DFS traversal, dependency resolution)
- [ ] See Also section with cross-references
- [ ] Mermaid diagrams for system flow and execution flow
- [ ] ASCII art for directory structures
- [ ] Code examples with TypeScript syntax highlighting

### Documentation Pattern Compliance

- [ ] Header matches docs/api/media/architecture.md format
- [ ] Section organization follows established patterns
- [ ] Table formatting matches existing documentation
- [ ] Code block language tags match content type
- [ ] Cross-references use consistent link format
- [ ] Tone matches existing documentation (professional, technical)
- [ ] Overview provides high-level introduction
- [ ] Content is accurate based on codebase research

### Usability Validation

- [ ] New developer can understand the architecture from this document
- [ ] System overview provides clear mental model
- [ ] Component interactions are well explained
- [ ] Groundswell integration is accessible
- [ ] Multi-agent architecture is clear
- [ ] State management is understandable
- [ ] Task execution flow is logical
- [ ] Diagrams aid understanding
- [ ] See Also section provides helpful next steps
- [ ] Document is well-organized and navigable

---

## Anti-Patterns to Avoid

- [ ] Don't create new documentation patterns when existing ones work (follow docs/api/media/architecture.md)
- [ ] Don't skip the Mermaid diagrams (essential for visual understanding)
- [ ] Don't omit the Four Core Processing Engines section (central to architecture)
- [ ] Don't forget to explain Groundswell framework integration (critical foundation)
- [ ] Don't use inconsistent header format (follow existing docs exactly)
- [ ] Don't create broken internal links (verify all ./ and ../ paths)
- [ ] Don't skip the See Also section (important for navigation)
- [ ] Don't use codebase-agnostic examples (use PRP Pipeline-specific patterns)
- [ ] Don't forget the ASCII art diagrams (helpful for directory structures)
- [ ] Don't omit agent personas table (essential for multi-agent understanding)
- [ ] Don't skip state management section (critical for understanding persistence)
- [ ] Don't forget task hierarchy explanation (core to pipeline operation)
- [ ] Don't use vague descriptions (be specific about components and interactions)
- [ ] Don't duplicate docs/api/media/architecture.md - this is an overview, that is detailed
- [ ] Don't ignore the parallel context with P2.M1.T2.S3 (PRD best practices guide)
