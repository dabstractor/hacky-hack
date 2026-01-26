# Terminal Progress Display Research - P2.M3.T1.S3

## Quick Reference Links

### cli-progress Library
- **NPM**: https://www.npmjs.com/package/cli-progress
- **GitHub**: https://github.com/npkgz/cli-progress
- **Type Definitions**: https://www.npmjs.com/package/@types/cli-progress
- **Documentation**: https://github.com/npkgz/cli-progress#single-bar-mode
- **Multi-Bar Examples**: https://github.com/npkgz/cli-progress#multi-bar-mode

### Codebase References
- **Existing ProgressTracker**: `/home/dustin/projects/hacky-hack/src/utils/progress.ts`
- **ProgressTracker Tests**: `/home/dustin/projects/hacky-hack/tests/unit/utils/progress.test.ts`
- **PRPPipeline (integration point)**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` (lines 231, 753-761, 783, 790-795)
- **TaskOrchestrator**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` (lines 91-92 for currentItemId)
- **CLI Options Pattern**: `/home/dustin/projects/hacky-hack/src/cli/index.ts` (lines 114-195)

### Installation Commands
```bash
npm install cli-progress
npm install @types/cli-progress --save-dev
```

## Key Implementation Patterns from Codebase

### 1. ProgressTracker Pattern (existing)
File: `src/utils/progress.ts`
- Factory function: `progressTracker({ backlog, logInterval, barWidth })`
- Methods: `recordStart()`, `recordComplete()`, `getProgress()`, `formatProgress()`, `getETA()`
- Exponential smoothing for ETA (alpha=0.3)
- Structured logging via Pino logger

### 2. CLI Option Pattern (to follow)
File: `src/cli/index.ts`
```typescript
.option('--progress-mode <mode>', 'Progress display mode')
  .choices(['auto', 'always', 'never'])
  .default('auto')
```

### 3. Test Pattern (to follow)
File: `tests/unit/utils/progress.test.ts`
- Use Vitest: `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';`
- Mock logger: `const logger = getLogger('ProgressTracker'); vi.spyOn(logger, 'info');`
- Fake timers: `vi.useFakeTimers(); vi.advanceTimersByTime(10);`
- Test data factories for Backlog, Phase, Milestone, Task, Subtask

## Critical Implementation Details

### File: src/workflows/prp-pipeline.ts
- Line 231: `#progressTracker?: ProgressTracker;` - existing private field
- Lines 753-761: ProgressTracker initialization in `executeBacklog()`
- Lines 783, 790-795: Current progress logging (console-based)

### Integration Requirements
1. Install cli-progress dependency
2. Create ProgressDisplay class alongside existing ProgressTracker
3. Add --progress-mode CLI option (auto, always, never)
4. Integrate with PRPPipeline.executeBacklog() for real-time updates
5. Detect TTY environment for 'auto' mode (process.stdout.isTTY)

## TypeScript Types from cli-progress

```typescript
import cliProgress from 'cli-progress';

// SingleBar for main progress
class SingleBar {
  start(total: number, start: number, payload?: object): void;
  update(current: number, payload?: object): void;
  increment(delta?: number, payload?: object): void;
  stop(): void;
}

// MultiBar for hierarchical progress
class MultiBar {
  create(total: number, start: number, payload?: any, barOptions?: Options): SingleBar;
  remove(bar: SingleBar): boolean;
  log(data: string): void;  // CRITICAL: newline required!
  stop(): void;
}

// Options interface
interface Options {
  format?: string;
  barsize?: number;
  fps?: number;
  stopOnComplete?: boolean;
  clearOnComplete?: boolean;
  hideCursor?: boolean;
  gracefulExit?: boolean;
  barCompleteChar?: string;
  barIncompleteChar?: string;
}
```

## Common Gotchas

1. **Multi-bar logging always requires newline**: `multiBar.log('message\n')`
2. **Always stop bars in finally block**: prevents cursor hiding issues
3. **Use gracefulExit: true** for production to handle SIGINT/SIGTERM
4. **format string placeholders**: `{bar}`, `{percentage}`, `{value}`, `{total}`, `{eta}`, `{eta_formatted}`
