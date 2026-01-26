# Commander.js CLI Option Research

## Official Documentation

- **GitHub:** https://github.com/tj/commander.js
- **Official Docs:** https://tj.github.io/commander.js/
- **Options API:** https://tj.github.io/commander.js/#/options
- **Custom Processing:** https://tj.github.io/commander.js/#/options?id=custom-option-processing

## Numeric Option with Range Validation (1-10)

### Recommended Pattern

```typescript
import { Command } from 'commander';

// Pattern 1: Inline validator function
program.option(
  '--parallelism <number>',
  'Max concurrent subtasks (1-10, default: 2)',
  value => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Parallelism must be a valid integer: ${value}`);
    }
    if (num < 1 || num > 10) {
      throw new Error(
        `Parallelism must be between 1 and 10 (received: ${num})`
      );
    }
    return num;
  },
  2
); // Default value
```

### Reusable Validator Factory

```typescript
// Create reusable range validator
function createRangeValidator(
  min: number,
  max: number,
  paramName: string = 'value'
) {
  return (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`${paramName} must be a valid integer: ${value}`);
    }
    if (num < min || num > max) {
      throw new Error(
        `${paramName} must be between ${min} and ${max} (received: ${num})`
      );
    }
    return num;
  };
}

// Usage
program.option(
  '--parallelism <n>',
  'Max concurrent subtasks (1-10, default: 2)',
  createRangeValidator(1, 10, 'parallelism'),
  2
);
```

## System Resource Validation

### CPU Core Detection

```typescript
import * as os from 'node:os';

function validateWorkerCount(value: string): number {
  const workers = parseInt(value, 10);
  if (isNaN(workers) || workers < 1) {
    throw new Error('Worker count must be a positive integer');
  }

  const availableCores = os.cpus().length;

  if (workers > availableCores) {
    throw new Error(
      `Cannot use ${workers} workers - only ${availableCores} CPU cores available.\n` +
        `Recommended: ${Math.max(1, availableCores - 1)}`
    );
  }

  // Warning for using all cores
  if (workers === availableCores) {
    console.warn(
      `⚠️  Warning: Using all ${availableCores} CPU cores may affect system responsiveness`
    );
  }

  return workers;
}
```

### Memory Validation with Warning

```typescript
function validateWithResourceWarning(value: string): number {
  const parallelism = parseInt(value, 10);

  if (isNaN(parallelism) || parallelism < 1 || parallelism > 10) {
    throw new Error('Parallelism must be between 1 and 10');
  }

  const systemInfo = getSystemResources();

  // CPU warning
  if (parallelism > systemInfo.cpuCores) {
    console.warn(
      `⚠️  Warning: Parallelism (${parallelism}) exceeds CPU cores (${systemInfo.cpuCores})`
    );
    console.warn(`   Recommended: --parallelism ${systemInfo.cpuCores - 1}`);
  }

  // Memory warning
  const estimatedMemory = parallelism * 500; // MB per worker
  const availableMemoryGB = (os.freemem() / 1024 ** 3).toFixed(1);

  if (estimatedMemory > parseFloat(availableMemoryGB) * 1024) {
    console.warn(
      `⚠️  Warning: High parallelism may exhaust free memory (${availableMemoryGB}GB available)`
    );
  }

  return parallelism;
}

function getSystemResources() {
  return {
    cpuCores: os.cpus().length,
    totalMemoryGB: os.totalmem() / 1024 ** 3,
    freeMemoryGB: os.freemem() / 1024 ** 3,
  };
}
```

## Help Text Patterns

```typescript
// Standard pattern with range and default
.option('--parallelism <1-10>', 'Max concurrent subtasks (default: 2, range: 1-10)', '2')

// Or simpler
.option('--parallelism <n>', 'Max concurrent subtasks (1-10, default: 2)', '2')
```

## Commander.js Examples

```typescript
// Boolean flag with explicit default
.option('--verbose', 'Enable debug logging', false)

// Numeric option with default
.option('--port <number>', 'Server port (default: 3000)', '3000')

// Choice validation
.addOption(
  program
    .createOption('--mode <mode>', 'Execution mode')
    .choices(['normal', 'bug-hunt', 'validate'])
    .default('normal')
)
```

## Key Takeaways

1. **Use `parseInt()` with radix 10** for numeric parsing
2. **Check for `isNaN`** before range validation
3. **Throw descriptive errors** with received value shown
4. **Use `process.exit(1)`** after logging error
5. **Include default and range** in help text
6. **Log warnings** (don't throw) for resource concerns
