# Product Requirement Prompt (PRP): Create Groundswell Integration Guide

> Transform PRD into working code with complete context, clear objectives, and validation criteria

**Status**: Ready for Implementation
**Last Updated**: 2026-01-23
**Work Item**: P2.M2.T1.S2 - Create Groundswell integration guide

---

## Goal

**Feature Goal**: Create a comprehensive Groundswell framework integration guide (`docs/GROUNDSWELL_GUIDE.md`) that documents how the PRP Pipeline uses Groundswell for workflow orchestration, agent management, and tool integration, enabling developers to understand and extend the system.

**Deliverable**: Documentation file `docs/GROUNDSWELL_GUIDE.md` containing:
- Groundswell framework overview and integration points
- Workflow class extension and decorator patterns (@Step, @Task, @ObservedState)
- Agent creation and configuration patterns
- MCP tool registration and implementation
- Caching and reflection usage
- Observability features (WorkflowTreeDebugger, observers)
- Code examples from the codebase for each pattern
- Cross-references to related documentation

**Success Definition**:
- A new developer can understand how Groundswell powers the PRP Pipeline
- All four agent personas are documented with their configurations
- Workflow patterns are clearly explained with code examples
- MCP tool implementation is documented with examples
- The guide follows the documentation structure and style of existing docs
- Code examples are accurate and can be copied directly
- Cross-references link to related documentation appropriately

## User Persona

**Target User**: Developer or contributor who needs to:
- Understand the PRP Pipeline's Groundswell integration
- Extend the system with new agents, tools, or workflows
- Debug or modify existing workflow behavior
- Implement new features using Groundswell patterns

**Use Case**: User needs to understand:
- What is Groundswell and how is it used in this project?
- How do I create a new workflow?
- How do I add a new agent persona?
- How do I implement a new MCP tool?
- What are the decorator patterns and when do I use them?
- How does caching and reflection work?

**User Journey**:
1. User opens docs/GROUNDSWELL_GUIDE.md to understand Groundswell
2. User reads the overview and core concepts
3. User studies the workflow patterns with examples
4. User learns about agent creation and configuration
5. User understands MCP tool implementation
6. User reviews observability and debugging features
7. User has a complete understanding of how to extend the system

**Pain Points Addressed**:
- "What is Groundswell?" - Overview section
- "How do workflows work?" - Workflow patterns section
- "How do I add a tool?" - MCP tool registration section
- "What are all these decorators?" - Decorator reference section
- "How does caching work?" - Caching section
- "How do I debug workflows?" - Observability section

## Why

- **Developer Onboarding**: New contributors need clear Groundswell documentation
- **System Understanding**: Complex multi-agent workflow system requires comprehensive guide
- **Extensibility**: Understanding patterns enables adding new agents, tools, workflows
- **Maintenance**: Debugging and troubleshooting require architectural knowledge
- **Documentation Coverage**: Completes P2.M2.T1 (Architecture Documentation) milestone
- **Parallel Work**: Builds upon docs/ARCHITECTURE.md (high-level) with detailed technical guide

## What

Create docs/GROUNDSWELL_GUIDE.md with comprehensive Groundswell integration documentation:

### Success Criteria

- [ ] File created at docs/GROUNDSWELL_GUIDE.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents included with anchor links
- [ ] Groundswell overview section with link to official docs
- [ ] Core concepts section (Workflow, Agent, Prompt, MCP)
- [ ] Workflow patterns section (@Step, @Task, @ObservedState)
- [ ] Agent system section (four personas, configuration, prompts)
- [ ] MCP tool registration section (MCPHandler pattern, examples)
- [ ] Caching section (custom PRP cache, not defaultCache)
- [ ] Observability section (WorkflowTreeDebugger, observers)
- [ ] Code examples from actual codebase for each pattern
- [ ] See Also section with cross-references

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:
- Complete Groundswell library documentation from official sources
- All workflow patterns found in the codebase with file references
- Agent factory patterns with all four personas
- MCP tool implementations (BashMCP, FilesystemMCP, GitMCP)
- Custom caching implementation (NOT Groundswell's defaultCache)
- Observability patterns and debugging tools
- Documentation formatting patterns from existing docs
- Parallel work item context (P2.M2.T1.S1 architecture doc)

### Documentation & References

```yaml
# MUST READ - Groundswell Library Documentation
- url: ~/projects/groundswell/README.md
  why: Complete Groundswell library overview with quick start, decorators, caching, reflection
  critical: Local project path, contains all API exports and examples

- url: ~/projects/groundswell/docs/workflow.md
  why: Detailed Workflow class documentation with decorators, parent-child, observers, debugging
  section: @Step, @Task, @ObservedState decorators, WorkflowTreeDebugger

- url: ~/projects/groundswell/docs/agent.md
  why: Agent creation, configuration, tools, MCP, hooks, caching
  section: createAgent(), AgentConfig, prompt execution, reflection

- url: ~/projects/groundswell/docs/prompt.md
  why: Prompt creation with Zod schemas, data injection, validation
  section: createPrompt(), responseFormat, validation patterns

- url: ~/projects/groundswell/examples/examples/
  why: 11 comprehensive example files showing all Groundswell patterns
  critical: 01-basic-workflow.ts, 02-decorator-options.ts, 03-parent-child.ts, 04-observers-debugger.ts, 08-sdk-features.ts

# MUST READ - Codebase Patterns
- file: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts
  why: Agent factory pattern with all four personas (Architect, Researcher, Coder, QA)
  pattern: createBaseConfig(), createArchitectAgent(), createResearcherAgent(), createCoderAgent(), createQAAgent()
  gotcha: All agents use GLM-4.7 model, enableCache and enableReflection are true

- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Main pipeline workflow showing all production patterns
  pattern: Workflow extension, @Step decorator, signal handlers, graceful shutdown
  section: Constructor, run() method, cleanup() step

- file: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts
  why: MCP tool implementation example
  pattern: Extend MCPHandler, registerServer(), registerToolExecutor()
  section: BashMCP class, executeBashCommand, tool schema

- file: /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts
  why: Multi-tool MCP implementation example
  pattern: Multiple tools in one MCP (file_read, file_write, glob_files, grep_search)
  section: FilesystemMCP class, tool registration

- file: /home/dustin/projects/hacky-hack/src/tools/git-mcp.ts
  why: Git operations MCP implementation
  pattern: Git tools (git_status, git_diff, git_add, git_commit)
  section: GitMCP class, git operations

- file: /home/dustin/projects/hacky-hack/src/agents/prp-generator.ts
  why: Custom PRP cache implementation (NOT Groundswell's defaultCache)
  pattern: Filesystem-based cache with SHA-256 hash keys, 24-hour TTL
  section: CACHE_TTL_MS, #computeTaskHash(), getCachePath()

- file: /home/dustin/projects/hacky-hack/src/utils/retry.ts
  why: Custom retry wrapper (NOT Groundswell's executeWithReflection)
  pattern: retryAgentPrompt() with exponential backoff
  section: AGENT_RETRY_CONFIG, retryAgentPrompt()

# MUST READ - System Prompts and Context
- file: /home/dustin/projects/hacky-hack/src/agents/prompts.ts
  why: System prompt constants for all agent personas
  section: TASK_BREAKDOWN_PROMPT (Architect), PRP_BLUEPRINT_PROMPT (Researcher), PRP_BUILDER_PROMPT (Coder), BUG_HUNT_PROMPT (QA)

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/architect-prompt.ts
  why: Architect prompt pattern with createPrompt and BacklogSchema
  pattern: createArchitectPrompt(), enableReflection: true

- file: /home/dustin/projects/hacky-hack/src/agents/prompts/prp-blueprint-prompt.ts
  why: Researcher prompt pattern for PRP generation
  pattern: createPRPBlueprintPrompt(), hierarchical context extraction

- file: /home/dustin/projects/hacky-hack/src/core/models.ts
  why: Zod schemas for validation (BacklogSchema, PRPDocumentSchema, TestResultsSchema)
  pattern: Schema definitions with custom validation

# MUST READ - External Dependencies Documentation
- file: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/external_deps.md
  why: Complete Groundswell API reference with examples
  section: Workflow, Agent, Prompt, Decorators, MCP, Caching, Reflection, Observability

# MUST READ - Documentation Patterns
- file: /home/dustin/projects/hacky-hack/docs/INSTALLATION.md
  why: Documentation header format, section organization
  pattern: Status, Last Updated, Version; numbered sections

- file: /home/dustin/projects/hacky-hack/docs/CONFIGURATION.md
  why: Table formatting, quick reference section pattern
  pattern: Quick Reference table at top, detailed sections with tables

- file: /home/dustin/projects/hacky-hack/docs/CLI_REFERENCE.md
  why: Linking pattern reference, subsection organization
  pattern: Cross-reference links, descriptive section headers

- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S1/research/04_documentation_patterns.md
  why: Complete documentation formatting patterns
  section: Header format, TOC, code blocks, tables, diagrams, cross-references

# Parallel Work Item Context
- file: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S1/PRP.md
  why: Previous PRP for architecture overview documentation
  critical: Produces docs/ARCHITECTURE.md - this PRP builds upon that with detailed Groundswell guide
  section: Use docs/ARCHITECTURE.md as high-level reference, this guide provides technical details

# Research Notes
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S2/research/01_groundswell_library_research.md
  why: Complete Groundswell library research from official docs
  section: All exports, decorators, examples, best practices

- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S2/research/02_codebase_patterns_research.md
  why: All Groundswell usage patterns found in codebase
  section: Workflows, agents, MCP tools, caching, retry, observability

- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P2M2T1S2/research/03_documentation_structure_research.md
  why: Documentation formatting and structure patterns
  section: Header, TOC, sections, code blocks, tables, diagrams, cross-references
```

### Current Codebase Tree (relevant subset)

```bash
hacky-hack/
├── docs/
│   ├── INSTALLATION.md             # Header format reference
│   ├── CONFIGURATION.md            # Table formatting reference
│   ├── CLI_REFERENCE.md            # Linking pattern reference
│   ├── WORKFLOWS.md                # Section organization reference
│   ├── user-guide.md               # User guide pattern reference
│   └── GROUNDSWELL_GUIDE.md        # TARGET FILE - TO BE CREATED
├── src/
│   ├── agents/
│   │   ├── agent-factory.ts        # Agent creation patterns (4 personas)
│   │   ├── prp-generator.ts        # Custom PRP cache implementation
│   │   ├── prp-executor.ts         # PRP execution patterns
│   │   └── prompts/
│   │       ├── architect-prompt.ts     # Architect prompt pattern
│   │       ├── prp-blueprint-prompt.ts  # Researcher prompt pattern
│   │       ├── bug-hunt-prompt.ts       # QA prompt pattern
│   │       └── delta-analysis-prompt.ts # Delta analysis prompt
│   ├── tools/
│   │   ├── bash-mcp.ts             # Bash MCP implementation
│   │   ├── filesystem-mcp.ts       # Filesystem MCP (4 tools)
│   │   └── git-mcp.ts              # Git MCP (4 tools)
│   ├── workflows/
│   │   ├── prp-pipeline.ts         # Main pipeline (1846 lines)
│   │   ├── bug-hunt-workflow.ts    # QA bug testing workflow
│   │   ├── delta-analysis-workflow.ts  # PRD comparison workflow
│   │   └── fix-cycle-workflow.ts   # Bug fix iteration workflow
│   └── core/
│       └── models.ts               # Zod schemas (BacklogSchema, PRPDocumentSchema, etc.)
└── groundswell/                    # Local Groundswell project (~/projects/groundswell)
    ├── README.md                   # Main library documentation
    ├── docs/
    │   ├── workflow.md             # Workflow detailed docs
    │   ├── agent.md                # Agent detailed docs
    │   └── prompt.md               # Prompt detailed docs
    └── examples/
        └── examples/               # 11 comprehensive example files
```

### Desired Codebase Tree with Files to be Added

```bash
hacky-hack/
├── docs/
│   ├── INSTALLATION.md             # (existing)
│   ├── CONFIGURATION.md            # (existing)
│   ├── CLI_REFERENCE.md            # (existing)
│   ├── WORKFLOWS.md                # (existing)
│   ├── user-guide.md               # (existing)
│   ├── ARCHITECTURE.md             # (created by P2.M2.T1.S1)
│   └── GROUNDSWELL_GUIDE.md        # NEW FILE - Groundswell integration guide
│       ├── Overview
│       │   ├── What is Groundswell?
│       │   ├── Installation and Setup
│       │   └── Integration Points
│       ├── Core Concepts
│       │   ├── Workflow
│       │   ├── Agent
│       │   ├── Prompt
│       │   └── MCP (Model Context Protocol)
│       ├── Workflow Patterns
│       │   ├── Extending Workflow
│       │   ├── @Step Decorator
│       │   ├── @Task Decorator
│       │   ├── @ObservedState Decorator
│       │   └── Parent-Child Workflows
│       ├── Agent System
│       │   ├── Agent Factory Pattern
│       │   ├── Four Agent Personas
│       │   ├── Agent Configuration
│       │   └── Prompt Creation
│       ├── MCP Tool Registration
│       │   ├── MCPHandler Pattern
│       │   ├── Tool Schema Definition
│       │   ├── Tool Executor
│       │   └── Examples (Bash, Filesystem, Git)
│       ├── Caching
│       │   ├── Custom PRP Cache
│       │   ├── SHA-256 Key Generation
│       │   └── Cache Metrics
│       ├── Observability
│       │   ├── WorkflowTreeDebugger
│       │   ├── Observer Pattern
│       │   └── Logging
│       ├── Examples
│       │   ├── Creating a Workflow
│       │   ├── Adding an Agent
│       │   └── Implementing an MCP Tool
│       └── See Also
```

### Known Gotchas of Our Codebase & Library Quirks

```bash
# CRITICAL: Groundswell is linked locally via npm link
# Path: ~/projects/groundswell
# Installation: cd ~/projects/groundswell && npm link && cd ~/projects/hacky-hack && npm link groundswell

# CRITICAL: @ObservedState decorator is NOT used in production code
# Reason: Test environment compatibility issues
# Production Pattern: Use public state fields instead (no decorator)

# CRITICAL: @Task decorator is NOT used in production code
# Reason: Sequential execution preferred, simpler pattern
# Production Pattern: Direct workflow instantiation without decorator

# CRITICAL: Custom cache implementation, NOT Groundswell's defaultCache
# Reason: Need persistent cache across runs (filesystem vs memory)
# Implementation: Filesystem-based cache with SHA-256 hash keys, 24-hour TTL
# Location: /src/agents/prp-generator.ts

# CRITICAL: Custom retry wrapper, NOT Groundswell's executeWithReflection
# Reason: Custom retry logic with exponential backoff
# Implementation: /src/utils/retry.ts - retryAgentPrompt()

# CRITICAL: INTROSPECTION_TOOLS not used in production
# Reason: Agent doesn't need workflow hierarchy inspection
# Status: Only tested for import availability

# CRITICAL: All agents use GLM-4.7 model (z.ai API)
# Architect: 8192 tokens, others: 4096 tokens
# enableCache: true, enableReflection: true for all agents

# CRITICAL: MCP tool naming convention: serverName__toolName (double underscore)
# Example: bash__execute_bash, filesystem__file_read

# CRITICAL: Documentation header format is consistent
# Must include: Status, Last Updated, Version

# CRITICAL: Use both Mermaid diagrams and ASCII art
# Mermaid for flowcharts, ASCII for directory structures

# CRITICAL: Cross-reference links use relative paths
# Use [Architecture](./ARCHITECTURE.md) format

# CRITICAL: Groundswell requires Node.js 18+, TypeScript 5.2+

# CRITICAL: All @Step decorators in production use trackTiming: true
# Only one step uses custom name: @Step({ trackTiming: true, name: 'handleDelta' })

# CRITICAL: Parent-child workflow relationship: new ChildWorkflow('name', parent)
# Pass parent (this) as second parameter to constructor

# CRITICAL: Status lifecycle: idle -> running -> completed/failed/cancelled

# CRITICAL: Graceful shutdown: SIGINT/SIGTERM handlers with cleanup in finally block

# CRITICAL: Correlation logging: getLogger('Context').child({ correlationId })

# CRITICAL: Progress tracking: Every 5 tasks, progress bar with 40 width
```

---

## Implementation Blueprint

### Document Structure

Create docs/GROUNDSWELL_GUIDE.md following the structure of existing documentation:

```markdown
# Groundswell Framework Guide

> Comprehensive guide to the Groundswell framework integration in the PRP Pipeline...

**Status**: Published
**Last Updated**: [DATE]
**Version**: 1.0.0

## Table of Contents

## Quick Reference

## Overview

### What is Groundswell?

### Installation and Setup

### Integration Points

## Core Concepts

### Workflow

### Agent

### Prompt

### MCP (Model Context Protocol)

## Workflow Patterns

### Extending the Workflow Class

### @Step Decorator

### @Task Decorator

### @ObservedState Decorator

### Parent-Child Workflows

### Graceful Shutdown

## Agent System

### Agent Factory Pattern

### Four Agent Personas

### Agent Configuration

### Prompt Creation with Zod Schemas

### Reflection and Retry

## MCP Tool Registration

### MCPHandler Pattern

### Tool Schema Definition

### Tool Executor Implementation

### Tool Examples

### Tool Naming Convention

## Caching

### Custom PRP Cache (Filesystem-Based)

### SHA-256 Cache Key Generation

### Cache Metrics and Monitoring

### Cache TTL and Expiration

## Observability

### WorkflowTreeDebugger

### Observer Pattern

### Logging and Correlation IDs

### Progress Tracking

## Examples

### Creating a New Workflow

### Adding a New Agent Persona

### Implementing a New MCP Tool

### Adding Caching to a Workflow

## See Also
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: PREPARE - Review Groundswell library documentation
  - READ: ~/projects/groundswell/README.md for overview
  - READ: ~/projects/groundswell/docs/workflow.md for workflow patterns
  - READ: ~/projects/groundswell/docs/agent.md for agent patterns
  - READ: ~/projects/groundswell/docs/prompt.md for prompt patterns
  - REVIEW: ~/projects/groundswell/examples/examples/ for code examples
  - EXTRACT: Key concepts, API exports, decorator options

Task 2: PREPARE - Review codebase Groundswell usage
  - READ: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts for agent patterns
  - READ: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts for workflow patterns
  - READ: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts for MCP patterns
  - READ: /home/dustin/projects/hacky-hack/src/agents/prp-generator.ts for cache patterns
  - EXTRACT: All production patterns with file paths and line numbers

Task 3: PREPARE - Review documentation structure and patterns
  - READ: /home/dustin/projects/hacky-hack/docs/INSTALLATION.md for header format
  - READ: /home/dustin/projects/hacky-hack/docs/CONFIGURATION.md for table patterns
  - READ: /home/dustin/projects/hacky-hack/docs/CLI_REFERENCE.md for linking patterns
  - EXTRACT: Documentation formatting patterns (header, TOC, sections, code blocks, tables)

Task 4: CREATE - Document header and Table of Contents
  - CREATE: File docs/GROUNDSWELL_GUIDE.md
  - ADD: Document header (Status: Published, Last Updated, Version: 1.0.0)
  - ADD: Brief description of the guide
  - ADD: Table of Contents with all sections and anchor links
  - FOLLOW: Pattern from docs/INSTALLATION.md

Task 5: WRITE - Quick Reference section
  - ADD: Quick reference table with key Groundswell exports
  - INCLUDE: Workflow, Agent, Prompt, MCPHandler, decorators
  - ADD: Common patterns table (@Step, @Task, @ObservedState)
  - FORMAT: Table with concise descriptions

Task 6: WRITE - Overview section
  - ADD: What is Groundswell? (hierarchical workflow orchestration engine)
  - INCLUDE: Installation and setup (npm link from ~/projects/groundswell)
  - ADD: Integration points (where it's used in PRP Pipeline)
  - ADD: Link to official Groundswell documentation

Task 7: WRITE - Core Concepts section
  - ADD: Workflow (hierarchical task containers)
  - ADD: Agent (LLM wrappers with tool integration)
  - ADD: Prompt (immutable value objects with Zod validation)
  - ADD: MCP (Model Context Protocol for tools)
  - INCLUDE: Brief code examples for each

Task 8: WRITE - Workflow Patterns section
  - ADD: Extending Workflow class (constructor patterns from prp-pipeline.ts)
  - ADD: @Step decorator (all steps use trackTiming: true)
  - ADD: @Task decorator (note: not used in production)
  - ADD: @ObservedState decorator (note: not used in production, public fields instead)
  - ADD: Parent-child workflows (new ChildWorkflow('name', parent))
  - ADD: Graceful shutdown pattern (signal handlers, cleanup in finally)
  - INCLUDE: Code examples from /src/workflows/prp-pipeline.ts

Task 9: WRITE - Agent System section
  - ADD: Agent factory pattern (createBaseConfig, createAgent)
  - ADD: Four agent personas table (Architect, Researcher, Coder, QA)
  - ADD: Agent configuration (model, enableCache, enableReflection, maxTokens, mcps)
  - ADD: Prompt creation with createPrompt and Zod schemas
  - ADD: Reflection and retry (enableReflection: true, retryAgentPrompt wrapper)
  - INCLUDE: Code examples from /src/agents/agent-factory.ts

Task 10: WRITE - MCP Tool Registration section
  - ADD: MCPHandler pattern (extend MCPHandler, registerServer, registerToolExecutor)
  - ADD: Tool schema definition (JSON Schema input validation)
  - ADD: Tool executor implementation (async function with input/output)
  - ADD: Tool examples (BashMCP, FilesystemMCP, GitMCP)
  - ADD: Tool naming convention (serverName__toolName)
  - INCLUDE: Code examples from /src/tools/bash-mcp.ts, filesystem-mcp.ts, git-mcp.ts

Task 11: WRITE - Caching section
  - ADD: Custom PRP cache (filesystem-based, NOT defaultCache)
  - ADD: SHA-256 cache key generation (#computeTaskHash)
  - ADD: Cache metrics (hits, misses, hit ratio)
  - ADD: Cache TTL (24 hours)
  - INCLUDE: Code examples from /src/agents/prp-generator.ts

Task 12: WRITE - Observability section
  - ADD: WorkflowTreeDebugger (ASCII tree visualization)
  - ADD: Observer pattern (onLog, onEvent, onStateUpdated, onTreeChanged)
  - ADD: Logging and correlation IDs (getLogger().child())
  - ADD: Progress tracking (every 5 tasks, progress bar)
  - INCLUDE: Code examples for debugging

Task 13: WRITE - Examples section
  - ADD: Creating a new workflow (extend Workflow, @Step, run())
  - ADD: Adding a new agent persona (agent-factory pattern)
  - ADD: Implementing a new MCP tool (extend MCPHandler)
  - ADD: Adding caching to a workflow (custom cache pattern)
  - INCLUDE: Complete, runnable code examples

Task 14: WRITE - See Also section
  - ADD: Cross-references to related documentation
  - INCLUDE: [Architecture Overview](./ARCHITECTURE.md)
  - INCLUDE: [CLI Reference](./CLI_REFERENCE.md)
  - INCLUDE: [Configuration](./CONFIGURATION.md)
  - INCLUDE: [Workflows](./WORKFLOWS.md)
  - INCLUDE: [Groundswell Docs](~/projects/groundswell/README.md)
  - FORMAT: Unordered list with descriptive links

Task 15: VALIDATE - Review against success criteria
  - CHECK: Document header follows pattern
  - CHECK: All sections present (Overview, Core Concepts, Patterns, Agent, MCP, Caching, Observability, Examples)
  - CHECK: Code examples are accurate and from codebase
  - CHECK: Cross-references link appropriately
  - CHECK: File created at docs/GROUNDSWELL_GUIDE.md
```

### Implementation Patterns & Key Details

```markdown
<!-- Header Pattern (from docs/INSTALLATION.md) -->
# Groundswell Framework Guide

> Comprehensive guide to the Groundswell framework integration in the PRP Pipeline, covering workflow patterns, agent systems, and extensibility.

**Status**: Published
**Last Updated**: 2026-01-23
**Version**: 1.0.0

---

<!-- Table of Contents Pattern -->
## Table of Contents

- [Quick Reference](#quick-reference)
- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Workflow Patterns](#workflow-patterns)
- [Agent System](#agent-system)
- [MCP Tool Registration](#mcp-tool-registration)
- [Caching](#caching)
- [Observability](#observability)
- [Examples](#examples)
- [See Also](#see-also)

---

<!-- Quick Reference Table Pattern -->
## Quick Reference

| Export | Purpose | Usage |
|--------|---------|-------|
| `Workflow` | Base class for workflows | `class MyWorkflow extends Workflow` |
| `createAgent` | Agent factory | `createAgent({ name, system })` |
| `createPrompt` | Prompt factory | `createPrompt({ user, responseFormat })` |
| `@Step` | Step decorator | `@Step({ trackTiming: true })` |
| `MCPHandler` | MCP tool handler | `class MyMCP extends MCPHandler` |

---

<!-- Code Example Pattern -->
## Extending the Workflow Class

```typescript
import { Workflow, Step } from 'groundswell';

class MyWorkflow extends Workflow {
  // Public state fields (NOT @ObservedState - compatibility issues)
  currentPhase: string = 'init';
  completedTasks: number = 0;

  constructor(data: string) {
    super('MyWorkflow');

    // Input validation
    if (typeof data !== 'string') {
      throw new Error('data must be a string');
    }

    this.data = data;
  }

  @Step({ trackTiming: true })
  async processStep(): Promise<void> {
    this.currentPhase = 'processing';
    // Step logic here
  }

  async run(): Promise<void> {
    this.setStatus('running');

    try {
      await this.processStep();
      this.setStatus('completed');
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Key Points**:
- All workflows extend `Workflow` and call `super(name)`
- Use public fields for state (not `@ObservedState`)
- All `@Step` decorators use `trackTiming: true`
- Status lifecycle: `idle → running → completed/failed`

---

<!-- Agent Factory Pattern -->
## Agent Factory Pattern

```typescript
import { createAgent } from 'groundswell';

// Persona token limits
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
} as const;

// Base configuration
function createBaseConfig(persona: string) {
  return {
    name: `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`,
    system: `You are a ${persona} agent.`,
    model: 'GLM-4.7',
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}

// Create agent
const config = createBaseConfig('architect');
const agent = createAgent({
  ...config,
  system: TASK_BREAKDOWN_PROMPT,
  mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP],
});
```

---

<!-- MCP Tool Pattern -->
## MCP Tool Implementation

```typescript
import { MCPHandler } from 'groundswell';

class MyMCP extends MCPHandler {
  readonly name = 'my-mcp';
  readonly transport = 'inprocess' as const;
  readonly tools = [myTool];

  constructor() {
    super();

    // Register server
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // Register tool executor
    this.registerToolExecutor('my-mcp', 'my_tool', async (input) => {
      const { param1 } = input;
      return { result: `processed: ${param1}` };
    });
  }
}

// Tool schema
const myTool: Tool = {
  name: 'my_tool',
  description: 'Performs an operation',
  input_schema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'A parameter' },
    },
    required: ['param1'],
  },
};
```

**Tool Naming**: `serverName__toolName` (double underscore)

---

<!-- Cross-Reference Pattern -->
## See Also

- **[Architecture Overview](./ARCHITECTURE.md)** - High-level system architecture
- **[CLI Reference](./CLI_REFERENCE.md)** - Command-line interface documentation
- **[Configuration](./CONFIGURATION.md)** - Environment variables and settings
- **[Workflows](./WORKFLOWS.md)** - Pipeline workflow documentation
- **[Groundswell Documentation](~/projects/groundswell/README.md)** - Official Groundswell library docs
```

### Integration Points

```yaml
docs/ARCHITECTURE.md:
  - reference: "For high-level architecture, see [Architecture Overview](./ARCHITECTURE.md)"
  - assume: User wants system overview before technical details
  - link: Groundswell Framework Integration section

docs/CLI_REFERENCE.md:
  - reference: "For CLI documentation, see [CLI Reference](./CLI_REFERENCE.md)"
  - placement: See Also section
  - context: Command-line usage

docs/WORKFLOWS.md:
  - reference: "For workflow documentation, see [Workflows](./WORKFLOWS.md)"
  - placement: See Also section
  - context: Detailed workflow explanations

~/projects/groundswell/:
  - reference: "Groundswell library at [~/projects/groundswell](~/projects/groundswell/)"
  - placement: Overview section, See Also section
  - context: Official library documentation and examples

src/agents/agent-factory.ts:
  - reference: "Agent factory implementation in [src/agents/agent-factory.ts](../src/agents/agent-factory.ts)"
  - placement: Agent System section
  - context: Code examples from actual implementation

src/workflows/prp-pipeline.ts:
  - reference: "Main pipeline in [src/workflows/prp-pipeline.ts](../src/workflows/prp-pipeline.ts)"
  - placement: Workflow Patterns section
  - context: Production workflow patterns

src/tools/:
  - reference: "MCP tools in [src/tools/](../src/tools/)"
  - placement: MCP Tool Registration section
  - context: Tool implementations (BashMCP, FilesystemMCP, GitMCP)
```

---

## Validation Loop

### Level 1: File Existence and Structure

```bash
# Check that file was created
ls -la docs/GROUNDSWELL_GUIDE.md

# Verify markdown syntax
npx markdownlint docs/GROUNDSWELL_GUIDE.md 2>/dev/null || echo "Verify markdown syntax is valid"

# Manual validation checklist
- [ ] File exists at docs/GROUNDSWELL_GUIDE.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents with all sections
- [ ] All code blocks have language tags (typescript, bash, mermaid)
- [ ] All internal links use correct relative paths (./)
- [ ] All external links are valid

# Expected: File exists, valid markdown structure
```

### Level 2: Content Completeness

```bash
# Manual content review checklist
- [ ] Quick Reference section with key exports table
- [ ] Overview section (What is Groundswell, Installation, Integration)
- [ ] Core Concepts section (Workflow, Agent, Prompt, MCP)
- [ ] Workflow Patterns section (extend, @Step, @Task, @ObservedState, parent-child, shutdown)
- [ ] Agent System section (factory, 4 personas, config, prompts, reflection)
- [ ] MCP Tool Registration section (MCPHandler, schema, executor, examples, naming)
- [ ] Caching section (custom cache, SHA-256, metrics, TTL)
- [ ] Observability section (debugger, observers, logging, progress)
- [ ] Examples section (workflow, agent, tool, caching)
- [ ] See Also section with cross-references

# Verify section count
grep -c "^## " docs/GROUNDSWELL_GUIDE.md  # Should be 10+ top-level sections

# Expected: All content validation checks pass
```

### Level 3: Documentation Quality

```bash
# Manual quality review checklist
- [ ] Content is accurate based on Groundswell library documentation
- [ ] Code examples are from actual codebase (file paths provided)
- [ ] Gotchas are documented (@ObservedState, @Task, custom cache, custom retry)
- [ ] Agent personas match agent-factory.ts (Architect, Researcher, Coder, QA)
- [ ] MCP tools match tools/ directory (BashMCP, FilesystemMCP, GitMCP)
- [ ] Cache implementation matches prp-generator.ts (custom, not defaultCache)
- [ ] Cross-references link to existing files
- [ ] Document follows style of existing documentation
- [ ] Code examples use correct syntax (typescript, bash)
- [ ] Tool naming convention documented (serverName__toolName)

# Expected: All quality validation checks pass
```

### Level 4: Usability Validation

```bash
# Manual usability review checklist
- [ ] New developer can understand Groundswell from this document
- [ ] Overview provides clear introduction
- [ ] Core concepts are well explained
- [ ] Workflow patterns are understandable with examples
- [ ] Agent system is clear
- [ ] MCP tool registration is accessible
- [ ] Caching is understandable
- [ ] Observability features are documented
- [ ] Examples are practical and runnable
- [ ] See Also section provides helpful next steps

# Test readability
# Can someone unfamiliar with Groundswell understand it from this guide?

# Expected: All usability validation checks pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] File created at docs/GROUNDSWELL_GUIDE.md
- [ ] Document header follows pattern (Status, Last Updated, Version)
- [ ] Table of Contents with all sections and anchors
- [ ] All code blocks have syntax highlighting (typescript, bash, mermaid)
- [ ] All internal links use correct relative paths (./)
- [ ] All external links are valid (~/projects/groundswell/, ../src/)
- [ ] Markdown syntax is valid (tables, lists, code blocks)
- [ ] All internal anchors (#section-name) exist

### Content Validation

- [ ] Quick Reference section with key exports table
- [ ] Overview section (What is Groundswell, Installation, Integration Points)
- [ ] Core Concepts section (Workflow, Agent, Prompt, MCP)
- [ ] Workflow Patterns section (extend Workflow, @Step, @Task, @ObservedState, parent-child, shutdown)
- [ ] Agent System section (factory, 4 personas, configuration, prompts, reflection)
- [ ] MCP Tool Registration section (MCPHandler, schema, executor, examples, naming)
- [ ] Caching section (custom cache, SHA-256, metrics, TTL)
- [ ] Observability section (WorkflowTreeDebugger, observers, logging, progress)
- [ ] Examples section (workflow, agent, tool, caching examples)
- [ ] See Also section with cross-references

### Documentation Pattern Compliance

- [ ] Header matches docs/INSTALLATION.md format
- [ ] Section organization follows established patterns
- [ ] Table formatting matches existing documentation
- [ ] Code block language tags match content type
- [ ] Cross-references use consistent link format
- [ ] Tone matches existing documentation (professional, technical)
- [ ] Content is accurate based on codebase research
- [ ] Code examples are from actual codebase with file paths

### Codebase Pattern Accuracy

- [ ] Workflow patterns match /src/workflows/prp-pipeline.ts
- [ ] Agent patterns match /src/agents/agent-factory.ts
- [ ] MCP patterns match /src/tools/bash-mcp.ts, filesystem-mcp.ts, git-mcp.ts
- [ ] Cache pattern matches /src/agents/prp-generator.ts (custom, not defaultCache)
- [ ] Retry pattern matches /src/utils/retry.ts (custom wrapper)
- [ ] Prompt patterns match /src/agents/prompts/*.ts
- [ ] Gotchas are documented (@ObservedState, @Task not used in production)
- [ ] GLM-4.7 model documented for all agents
- [ ] Token limits documented (Architect: 8192, others: 4096)

### Usability Validation

- [ ] New developer can understand Groundswell from this document
- [ ] Overview provides clear mental model
- [ ] Core concepts are accessible
- [ ] Workflow patterns are clear with examples
- [ ] Agent system is understandable
- [ ] MCP tool registration is documented with examples
- [ ] Caching is explained (custom vs defaultCache)
- [ ] Observability features are clear
- [ ] Examples are practical
- [ ] See Also section provides helpful next steps

---

## Anti-Patterns to Avoid

- [ ] Don't create new documentation patterns when existing ones work
- [ ] Don't skip the Quick Reference section (essential for quick lookup)
- [ ] Don't omit the gotchas (@ObservedState, @Task, custom cache)
- [ ] Don't use Groundswell's defaultCache in examples (we use custom cache)
- [ ] Don't use @Task decorator in examples (not used in production)
- [ ] Don't use @ObservedState in examples (public fields instead)
- [ ] Don't forget to document the custom retry wrapper (not executeWithReflection)
- [ ] Don't use incorrect relative paths (use ./ for same directory, ../ for parent)
- [ ] Don't skip the See Also section (important for navigation)
- [ ] Don't use codebase-agnostic examples (use PRP Pipeline-specific patterns)
- [ ] Don't forget to document tool naming convention (serverName__toolName)
- [ ] Don't skip agent persona differences (token limits, system prompts)
- [ ] Don't omit the local Groundswell path (~/projects/groundswell)
- [ ] Don't forget to document GLM-4.7 model usage
- [ ] Don't ignore the parallel context with P2.M2.T1.S1 (architecture doc)
