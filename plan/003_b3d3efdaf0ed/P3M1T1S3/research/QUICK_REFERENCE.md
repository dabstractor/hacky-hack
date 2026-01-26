# Quick Reference: P3.M1.T1.S3 Implementation

## Files to Modify

| File                            | Lines    | Change                                         |
| ------------------------------- | -------- | ---------------------------------------------- |
| `src/cli/index.ts`              | ~56-95   | Add `parallelism: number` to CLIArgs interface |
| `src/cli/index.ts`              | ~168     | Add `.option('--parallelism <n>', ...)`        |
| `src/cli/index.ts`              | ~307     | Add validation logic with resource warnings    |
| `src/index.ts`                  | ~198-212 | Pass `args.parallelism` to PRPPipeline         |
| `src/workflows/prp-pipeline.ts` | ~230     | Add `#parallelism` private field               |
| `src/workflows/prp-pipeline.ts` | ~250-260 | Add `parallelism` parameter to constructor     |
| `src/workflows/prp-pipeline.ts` | Find     | Pass to `executeParallel()` call               |

## Files to Create

| File                                           | Purpose                          |
| ---------------------------------------------- | -------------------------------- |
| `tests/integration/parallelism-option.test.ts` | Integration tests for CLI option |

## Key Code Patterns

### CLI Option Definition

```typescript
.option('--parallelism <n>', 'Max concurrent subtasks (1-10, default: 2)', '2')
```

### Validation Pattern

```typescript
const num = parseInt(value, 10);
if (isNaN(num) || num < 1 || num > 10) {
  logger.error('--parallelism must be an integer between 1 and 10');
  process.exit(1);
}
```

### Resource Warning Pattern

```typescript
import * as os from 'node:os';

const cpuCores = os.cpus().length;
if (num > cpuCores) {
  logger.warn(`Parallelism (${num}) exceeds CPU cores (${cpuCores})`);
  logger.warn(`Recommended: --parallelism ${cpuCores - 1}`);
}
```

## Test Cases

| Test        | Input                        | Expected      |
| ----------- | ---------------------------- | ------------- |
| Default     | (no flag)                    | 2             |
| Minimum     | `--parallelism 1`            | 1             |
| Maximum     | `--parallelism 10`           | 10            |
| Too low     | `--parallelism 0`            | Error         |
| Too high    | `--parallelism 11`           | Error         |
| Invalid     | `--parallelism abc`          | Error         |
| CPU warning | `--parallelism 16` (8 cores) | Warning shown |

## Validation Commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint -- src/cli/index.ts src/index.ts src/workflows/prp-pipeline.ts

# Run integration tests
npm run test:run tests/integration/parallelism-option.test.ts

# All tests
npm run test:run
```
