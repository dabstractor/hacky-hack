# P5.M2.T1.S2 Research: Codebase Analysis for PRP Caching

## Summary

This document consolidates codebase analysis for implementing PRP caching in the PRPGenerator class.

**Research Date:** 2025-01-13
**Status:** Complete

---

## 1. PRPGenerator Current Implementation

### Location
**File:** `/home/dustin/projects/hacky-hack/src/agents/prp-generator.ts`

### Key Methods

#### `generate()` Method (Lines 175-233)
```typescript
async generate(task: Task | Subtask, backlog: Backlog): Promise<PRPDocument> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());
      const result = await this.#researcherAgent.prompt(prompt);
      const validated = PRPDocumentSchema.parse(result);
      await this.#writePRPToFile(validated);
      return validated;
    } catch (error) {
      // Retry logic...
    }
  }
}
```

**Cache Integration Point:** Add cache check at the start of this method, before `createPRPBlueprintPrompt()`.

#### `#writePRPToFile()` Method (Lines 249-271)
```typescript
async #writePRPToFile(prp: PRPDocument): Promise<void> {
  const filename = prp.taskId.replace(/\./g, '_') + '.md';
  const prpsDir = join(this.sessionPath, 'prps');
  const filePath = join(prpsDir, filename);

  await mkdir(prpsDir, { recursive: true });
  const markdown = this.#formatPRPAsMarkdown(prp);
  await writeFile(filePath, markdown, { mode: 0o644 });

  this.#logger.info({ taskId: prp.taskId, filePath }, 'PRP written');
}
```

**Key Insight:** PRP files are stored at `{sessionPath}/prps/{taskId-sanitized}.md`

---

## 2. Session Manager Integration

### Current Session Path Access
**File:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`

```typescript
export class SessionManager {
  readonly #currentSession: SessionState | null = null;

  get currentSession(): SessionState | null {
    return this.#currentSession;
  }
}
```

**Usage in PRPGenerator:**
```typescript
constructor(sessionManager: SessionManager) {
  this.sessionManager = sessionManager;
  const currentSession = sessionManager.currentSession;
  this.sessionPath = currentSession.metadata.path;
}
```

---

## 3. File System Hashing Patterns

### PRD Hash Function (Reference)
**File:** `/home/dustin/projects/hacky-hack/src/core/session-utils.ts` (Lines 161-168)

```typescript
export async function hashPRD(prdPath: string): Promise<string> {
  try {
    const content = await readFile(prdPath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    throw new SessionFileError(prdPath, 'read PRD', error as Error);
  }
}
```

**Pattern for PRP Cache Key:**
```typescript
import { createHash } from 'node:crypto';

function hashTaskInputs(task: Task | Subtask, backlog: Backlog): string {
  const inputString = JSON.stringify({
    id: task.id,
    title: task.title,
    description: task.description,
    acceptanceCriteria: task.acceptanceCriteria,
  }, null, 0); // No whitespace for determinism

  return createHash('sha256').update(inputString).digest('hex');
}
```

---

## 4. File Modification Time Checking

### Using stat() for mtime
**File:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts` (Lines 283-284)

```typescript
const stats = await stat(sessionPath);
const createdAt = stats.mtime; // Use modification time as creation time
```

**Pattern for PRP Cache Age Check:**
```typescript
import { stat } from 'node:fs/promises';

async function isCacheRecent(filePath: string, maxAgeMs: number): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < maxAgeMs;
  } catch {
    return false; // File doesn't exist
  }
}
```

---

## 5. Session Directory Structure

### Directory Layout
```
plan/
└── 001_14b9dc2a33c7/
    ├── architecture/
    ├── prps/              # PRP files stored here
    │   ├── P1M1T1S1.md
    │   ├── P1M1T1S2.md
    │   └── ...
    ├── artifacts/
    ├── tasks.json
    └── prd_snapshot.md
```

**PRP File Path:** `{sessionPath}/prps/{taskId}.md` (with dots replaced by underscores)

---

## 6. PRPDocument Schema

**File:** `/home/dustin/projects/hacky-hack/src/core/models.ts`

```typescript
export interface PRPDocument {
  readonly taskId: string;
  readonly objective: string;
  readonly context: string;
  readonly implementationSteps: string[];
  readonly validationGates: ValidationGate[];
  readonly successCriteria: SuccessCriterion[];
  readonly references: string[];
}
```

**Cache Storage:** Store the full PRPDocument as JSON alongside the markdown file.

---

## 7. Cache Metadata Format

**Recommended Structure:**
```typescript
interface PRPCacheEntry {
  taskId: string;
  prp: PRPDocument;
  metadata: {
    createdAt: number;
    accessedAt: number;
    taskHash: string;
    version: string;
  };
}
```

**Storage Location:** `{sessionPath}/prps/.cache/{taskId}.json`

---

## 8. Logger Integration

**File:** `/home/dustin/projects/hacky-hack/src/utils/logger.ts`

```typescript
const logger = getLogger('PRPGenerator');

// Cache hit logging
logger.info({ taskId: task.id, cacheHit: true }, 'PRP cache HIT');

// Cache miss logging
logger.debug({ taskId: task.id, cacheHit: false }, 'PRP cache MISS');

// Cache metrics
logger.info(
  { hits, misses, hitRatio: ((hits / total) * 100).toFixed(1) },
  'PRP cache metrics'
);
```

---

## 9. CLI Integration Points

**File:** `/home/dustin/projects/hacky-hack/src/cli/index.ts`

**Add noCache option:**
```typescript
export interface CLIArgs {
  // ... existing fields
  noCache: boolean; // NEW
}

export function parseCLIArgs(): CLIArgs {
  const program = new Command();
  program
    // ... existing options
    .option('--no-cache', 'Bypass cache and regenerate all PRPs', false)
    .parse(process.argv);

  return program.opts<CLIArgs>();
}
```

**Pass to PRPPipeline:**
```typescript
const pipeline = new PRPPipeline(args, sessionManager);
```

---

## 10. Existing Cache Patterns in Codebase

### Research Queue Cache (Lines 73-77)
**File:** `/home/dustin/projects/hacky-hack/src/core/research-queue.ts`

```typescript
readonly researching: Map<string, Promise<PRPDocument>> = new Map();
readonly results: Map<string, PRPDocument> = new Map();
```

**Pattern:** Use Map for in-memory cache with separate Promise tracking.

### Task Orchestrator Cache Metrics (Lines 85-86, 584-598)
**File:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`

```typescript
#cacheHits: number = 0;
#cacheMisses: number = 0;

#logCacheMetrics(): void {
  const total = this.#cacheHits + this.#cacheMisses;
  const hitRatio = total > 0 ? (this.#cacheHits / total) * 100 : 0;

  this.#logger.debug(
    { hits: this.#cacheHits, misses: this.#cacheMisses, hitRatio: hitRatio.toFixed(1) },
    'Cache metrics'
  );
}
```

---

## 11. Key Implementation Requirements

### 1. Cache Path Method
```typescript
getCachePath(taskId: string): string {
  return join(this.sessionPath, 'prps', `${taskId.replace(/\./g, '_')}.md`);
}
```

### 2. Cache Metadata Path
```typescript
getCacheMetadataPath(taskId: string): string {
  return join(this.sessionPath, 'prps', '.cache', `${taskId.replace(/\./g, '_')}.json`);
}
```

### 3. Task Input Hash
```typescript
#computeTaskHash(task: Task | Subtask, backlog: Backlog): string {
  const input = {
    id: task.id,
    title: task.title,
    description: task.description,
    acceptanceCriteria: task.acceptanceCriteria,
  };
  return createHash('sha256').update(JSON.stringify(input, null, 0)).digest('hex');
}
```

### 4. Cache Entry Structure
```typescript
interface PRPCacheMetadata {
  readonly taskId: string;
  readonly taskHash: string;
  readonly createdAt: number;
  readonly accessedAt: number;
  readonly version: string;
}
```

---

## 12. Testing Patterns

### File System Mock Pattern
```typescript
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
}));

const mockStat = stat as any;
mockStat.mockResolvedValue({
  mtimeMs: Date.now() - 1000, // 1 second ago
  isFile: () => true,
});
```

### Cache Verification Pattern
```typescript
it('should use cached PRP when hash matches and file is recent', async () => {
  const cachedPRP = createTestPRPDocument('P1.M1.T1.S1');
  mockReadFile.mockResolvedValueOnce(JSON.stringify(cachedPRP));
  mockStat.mockResolvedValue({ mtimeMs: Date.now() }); // Recent

  const result = await generator.generate(task, backlog);

  expect(result).toEqual(cachedPRP);
  expect(mockResearcherAgent.prompt).not.toHaveBeenCalled();
});
```

---

## Implementation Checklist

- [ ] Add `noCache` option to CLIArgs interface
- [ ] Add `--no-cache` flag to CLI parser
- [ ] Add `#noCache` field to PRPGenerator
- [ ] Implement `getCachePath(taskId: string): string`
- [ ] Implement `#computeTaskHash(task: Task | Subtask, backlog: Backlog): string`
- [ ] Implement `#isCacheRecent(filePath: string): Promise<boolean>`
- [ ] Implement `#loadCachedPRP(taskId: string): Promise<PRPDocument | null>`
- [ ] Implement `#saveCacheMetadata(taskId: string, taskHash: string): Promise<void>`
- [ ] Modify `generate()` to check cache before calling agent
- [ ] Add cache hit/miss logging
- [ ] Add cache metrics tracking (hits, misses, hitRatio)
- [ ] Create unit tests for cache functionality
- [ ] Update PRPPipeline to pass noCache flag

---

## References

- **PRPGenerator:** `/home/dustin/projects/hacky-hack/src/agents/prp-generator.ts`
- **SessionManager:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
- **SessionUtils:** `/home/dustin/projects/hacky-hack/src/core/session-utils.ts`
- **Models:** `/home/dustin/projects/hacky-hack/src/core/models.ts`
- **CLI:** `/home/dustin/projects/hacky-hack/src/cli/index.ts`
- **ResearchQueue:** `/home/dustin/projects/hacky-hack/src/core/research-queue.ts`
- **TaskOrchestrator:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
