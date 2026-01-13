# Codebase Context for PRD Diffing

## Project Structure

```
/home/dustin/projects/hacky-hack/
├── src/
│   ├── core/
│   │   ├── models.ts           # Type definitions (RequirementChange, DeltaAnalysis)
│   │   ├── session-manager.ts  # Session lifecycle with delta support
│   │   ├── session-utils.ts    # PRD snapshot utilities
│   │   └── index.ts
│   ├── agents/
│   │   ├── prompts/
│   │   │   └── delta-analysis-prompt.ts  # Delta prompt generator
│   │   └── prompts.ts         # DELTA_ANALYSIS_PROMPT system prompt
│   └── utils/
│       └── prd-differ.ts      # [TO BE CREATED] PRD diffing implementation
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   │   └── prd-differ.test.ts  # [TO BE CREATED] Tests for diffing
│   │   └── agents/prompts/
│   │       └── delta-analysis-prompt.test.ts
│   └── fixtures/
│       └── mock-delta-data.ts
└── plan/001_14b9dc2a33c7/
    └── prd_snapshot.md
```

## Key Types from models.ts

### RequirementChange (lines 1361-1430)

```typescript
export interface RequirementChange {
  readonly itemId: string;
  readonly type: 'added' | 'modified' | 'removed';
  readonly description: string;
  readonly impact: string;
}
```

### DeltaAnalysis (lines 1462-1523)

```typescript
export interface DeltaAnalysis {
  readonly changes: RequirementChange[];
  readonly patchInstructions: string;
  readonly taskIds: string[];
}
```

### DeltaSession (lines 847-881)

```typescript
export interface DeltaSession extends SessionState {
  readonly oldPRD: string;
  readonly newPRD: string;
  readonly diffSummary: string;
}
```

## SessionManager Integration Points

### Current `#generateDiffSummary()` (lines 188-192)

```typescript
#generateDiffSummary(oldPRD: string, newPRD: string): string {
  const oldLines = oldPRD.split('\n').length;
  const newLines = newPRD.split('\n').length;
  return `PRD modified: ${oldLines} lines → ${newLines} lines. Full delta analysis required.`;
}
```

### Where to Integrate `diffPRDs()`

1. **In `createDeltaSession()` method** (line 338):
   Replace the simple `#generateDiffSummary()` call

2. **Add new method** after line 192:
   ```typescript
   async #diffPRDs(oldPRD: string, newPRD: string): Promise<DiffSummary>
   ```

## PRD Snapshot Pattern

From `session-utils.ts`:

```typescript
export async function snapshotPRD(
  sessionPath: string,
  prdPath: string
): Promise<void>;

export async function loadSnapshot(sessionPath: string): Promise<string>;
```

## Existing Delta Analysis Prompt

From `src/agents/prompts/delta-analysis-prompt.ts`:

```typescript
export function createDeltaAnalysisPrompt(
  oldPRD: string,
  newPRD: string,
  completedTaskIds?: string[]
): Prompt<DeltaAnalysis>;
```

## Testing Framework

- **Framework:** Vitest (configured in `vitest.config.ts`)
- **Test commands:** `npm test`, `npm run test:run`, `npm run test:coverage`
- **Coverage requirement:** 100%
- **Test file pattern:** `**/*.test.ts` under `tests/`

## Import Patterns

```typescript
// ES modules with .js extensions
import { diff } from 'fast-diff';
import type { RequirementChange } from './models.js';
```

## File Permissions

Use `mode: 0o644` for file writes (read/write owner, read others)
