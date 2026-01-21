# Researcher Agent Research

## Overview

This document provides comprehensive research on the Researcher Agent implementation, PRP generation flow, and how to write integration tests for this component.

## Researcher Agent Implementation

### Location

- **File**: `src/agents/prp-generator.ts` (564 lines)
- **Agent Factory**: `src/agents/agent-factory.ts` (createResearcherAgent function)

### createResearcherAgent() Configuration

From `src/agents/agent-factory.ts` lines 223-235:

```typescript
export function createResearcherAgent(): Agent {
  const baseConfig = createBaseConfig('researcher');
  const config = {
    ...baseConfig,
    system: PRP_BLUEPRINT_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug(
    { persona: 'researcher', model: config.model },
    'Creating agent'
  );
  return createAgent(config);
}
```

**Configuration Details**:

- **Model**: GLM-4.7
- **Max Tokens**: 4096 (from PERSONA_TOKEN_LIMITS)
- **System Prompt**: PRP_BLUEPRINT_PROMPT
- **MCP Tools**: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP]
- **Enable Cache**: true (from baseConfig)
- **Enable Reflection**: false (default, not set for researcher)

### PRP Generation Flow

From `src/agents/prp-generator.ts` lines 403-456:

```typescript
async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
  // Step 1: Cache Check
  if (!this.#noCache) {
    const cachePath = this.getCachePath(task.id);
    const currentHash = this.#computeTaskHash(task, backlog);

    if (await this.#isCacheRecent(cachePath)) {
      const cachedPRP = await this.#loadCachedPRP(task.id);
      if (cachedPRP) {
        const cachedMetadata = await this.#loadCacheMetadata(task.id);
        if (cachedMetadata?.taskHash === currentHash) {
          // CACHE HIT
          this.#cacheHits++;
          return cachedPRP;
        }
      }
    }
    this.#cacheMisses++;
  }

  // Step 2: Build Prompt
  const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());

  // Step 3: Execute Researcher Agent with retry
  const result = await retryAgentPrompt(
    () => this.#researcherAgent.prompt(prompt),
    { agentType: 'Researcher', operation: 'generatePRP' }
  );

  // Step 4: Validate against schema
  const validated = PRPDocumentSchema.parse(result);

  // Step 5: Write PRP to file
  await this.#writePRPToFile(validated);

  // Step 6: Save cache metadata
  if (!this.#noCache) {
    const currentHash = this.#computeTaskHash(task, backlog);
    await this.#saveCacheMetadata(task.id, currentHash, validated);
  }

  return validated;
}
```

### Key Methods

#### Cache-Related Methods

1. **#computeTaskHash()** (Lines 225-250)
   - Creates SHA-256 hash of task inputs
   - Task fields: `id`, `title`, `description`
   - Subtask fields: `id`, `title`, `context_scope`
   - Excludes: `status`, `dependencies`, `story_points`

2. **#isCacheRecent()** (Lines 263-272)
   - Checks if file is younger than CACHE_TTL_MS (24 hours)
   - Uses file mtime (modification time)
   - Returns false for any error (file doesn't exist, permission error)

3. **#loadCachedPRP()** (Lines 284-295)
   - Reads cache metadata JSON
   - Validates against PRPDocumentSchema
   - Returns null for any error

4. **#saveCacheMetadata()** (Lines 310-334)
   - Creates .cache directory if needed
   - Stores full PRPDocument with metadata
   - File permissions: 0o644

#### Path Methods

5. **getCachePath()** (Lines 191-194)
   - Returns: `{sessionPath}/prps/{sanitizedTaskId}.md`
   - Sanitization: replaces dots with underscores

6. **getCacheMetadataPath()** (Lines 206-209)
   - Returns: `{sessionPath}/prps/.cache/{sanitizedTaskId}.json`

## PRP_CREATE_PROMPT Structure

From `PROMPTS.md` lines 189-637:

### Required Sections for Testing

1. **Work Item Information** (Lines 194-199)
   - ITEM TITLE
   - ITEM DESCRIPTION
   - PRP Creation Mission

2. **Research Process** (Lines 215-244)
   - Codebase Analysis in depth
   - Internal Research at scale
   - External Research at scale
   - User Clarification

3. **PRP Generation Process** (Lines 246-282)
   - Step 1: Review Template
   - Step 2: Context Completeness Validation
   - Step 3: Research Integration
   - Step 4: Information Density Standards
   - Step 5: ULTRATHINK Before Writing

4. **PRP-README** (Lines 315-317)
   - Contains PRP concept explanation

5. **PRP-TEMPLATE** (Lines 319-637)
   - Goal
   - User Persona
   - Why
   - What
   - All Needed Context
   - Implementation Blueprint
   - Validation Loop
   - Final Validation Checklist
   - Anti-Patterns to Avoid

### Key Instructions for Testing

- Line 220: "Create clear todos and spawn subagents to search the codebase"
- Line 227: "Use relevant research and plan information in the plan/architecture/ directory"
- Line 232: "Library documentation (include specific URLs)"
- Line 234: "Store all research in the work item's research/ subdirectory"
- Line 254: "No Prior Knowledge" test
- Line 275: "ULTRATHINK Before Writing" with TodoWrite tool

## Subagent Spawning Patterns

### Current Implementation

**Important Finding**: The "subagent spawning" described in prompts is aspirational rather than implemented.

From codebase research:

- PRPGenerator caches a single Researcher Agent instance (line 178)
- No "batch tools" implementation exists
- Subagent spawning is mentioned in prompts but not in code
- Actual implementation uses single agent with caching

### Testing Implications

When testing Researcher Agent:

1. Mock the single agent.prompt() call (not multiple subagents)
2. Test the caching behavior (hash, TTL, metadata)
3. Verify prompt structure contains subagent instructions (even if not implemented)
4. Mock file operations for cache storage

## Internal Research: architecture/ Directory

### Structure

```
{sessionPath}/
├── architecture/
│   ├── system_context.md
│   ├── cache_behavior.md
│   └── research_summary.md
├── prps/
│   ├── P1M1T1S1.md
│   └── .cache/
│       ├── P1M1T1S1.json
│       └── ...
└── artifacts/
```

### Prompt References

From PROMPTS.md:

- Line 81: "You must store architectural findings in `$SESSION_DIR/architecture/`"
- Line 113: "Store findings in `$SESSION_DIR/architecture/` (e.g., `system_context.md`, `external_deps.md`)"
- Line 227: "Use relevant research and plan information in the plan/architecture/ directory"

### Testing Internal Research

To test that Researcher Agent checks architecture/:

1. Mock existence of architecture/ directory
2. Mock readFile for architecture files
3. Verify prompt includes instructions to read architecture/
4. Test with/without architecture/ directory

## External Research: Web Fetching

### Current State

**No WebFetch MCP tool exists** in current codebase.

Existing MCP tools:

- BASH_MCP (shell commands)
- FILESYSTEM_MCP (file operations)
- GIT_MCP (git operations)

### Prompt Instructions

From PROMPTS.md lines 231-240:

- "Library documentation (include specific URLs)"
- "Implementation examples (GitHub/StackOverflow/blogs)"
- "Use the batch tools to spawn subagents to search for similar features/patterns online"

### Testing External Research

Since web fetching is not implemented:

1. Test that prompt instructs external research
2. Mock any future web fetch calls
3. Verify prompt mentions URLs and online research
4. Test with mock web fetch responses

## PRPDocument Schema

From `src/core/models.ts`:

```typescript
interface PRPDocument {
  taskId: string;
  objective: string;
  context: string;
  implementationSteps: string[];
  validationGates: Array<{
    level: string;
    command: string | null;
  }>;
  successCriteria: Array<{
    description: string;
  }>;
  references: string[];
}
```

Validation: `PRPDocumentSchema.parse(result)` at line 444

## Error Handling

### Custom Errors

1. **PRPGenerationError** (Lines 34-56)
   - Thrown when agent fails after all retries
   - Includes: taskId, attempt number, original error

2. **PRPFileError** (Lines 65-87)
   - Thrown when PRP file cannot be written
   - Includes: taskId, filePath, original error

### Retry Logic

From `src/utils/retry.ts`:

```typescript
await retryAgentPrompt(() => this.#researcherAgent.prompt(prompt), {
  agentType: 'Researcher',
  operation: 'generatePRP',
});
```

Configuration:

- Max retries: 3
- Base delay: 1000ms
- Max delay: 30000ms
- Exponential backoff: 2^n

## Testing Summary

### Key Test Areas

1. **Agent Configuration**
   - Model: GLM-4.7
   - Max tokens: 4096
   - MCP tools: BASH, FILESYSTEM, GIT
   - System prompt: PRP_BLUEPRINT_PROMPT

2. **Cache Behavior**
   - SHA-256 hash computation
   - 24-hour TTL
   - Hash comparison
   - Cache hit/miss tracking

3. **PRP Template Compliance**
   - All required sections present
   - Goal, Why, What, Context, Blueprint, Validation
   - Anti-patterns included

4. **Prompt Research Instructions**
   - Codebase analysis instructions
   - Internal research (architecture/)
   - External research (URLs, web fetch)
   - TodoWrite tool usage

5. **File Operations**
   - PRP markdown file writing
   - Cache metadata JSON writing
   - Directory creation

6. **Error Handling**
   - PRPGenerationError for failures
   - PRPFileError for write failures
   - Retry logic behavior
