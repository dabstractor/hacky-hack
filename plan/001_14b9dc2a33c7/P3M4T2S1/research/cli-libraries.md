# CLI Argument Parsing Libraries Research: Commander.js vs Yargs

**Research Date:** 2026-01-13
**Researcher:** Claude Code Agent
**Purpose:** Evaluate CLI argument parsing libraries for the PRP CLI implementation

## Table of Contents

1. [Commander.js Research](#commanderjs-research)
2. [Yargs Research](#yargs-research)
3. [Comparison](#comparison)
4. [Code Examples](#code-examples)
5. [Recommendation](#recommendation)
6. [References](#references)

---

## Commander.js Research

### Current Version and TypeScript Support

**Version:** 14.0.2 (released 2025-10-25)
**Node.js Requirement:** >= 20
**TypeScript Support:** Native (built in TypeScript since v9)
**Repository:** https://github.com/tj/commander.js
**Documentation:** https://github.com/tj/commander.js/blob/master/Readme.md

**Type Definitions Location:** `typings/index.d.ts` (included in package)

### Basic Usage Patterns

Commander.js uses a fluent, chainable API for defining commands and options:

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('my-cli')
  .description('My CLI application')
  .version('1.0.0')
  .option('-d, --debug', 'enable debug mode')
  .parse();
```

### Setting Default Values

Default values are set using the `defaultValue` property in the option configuration:

```typescript
program.option('-p, --port <number>', 'port number', '3000');
// or with full options object
program.option('--config <path>', 'config file path', '/etc/config.json');
```

### Defining Choices/Modes

Commander.js provides built-in choice validation:

```typescript
program.option(
  '-m, --mode <mode>',
  'execution mode',
  value => {
    if (!['normal', 'bug-hunt', 'validate'].includes(value)) {
      throw new Error(`Invalid mode: ${value}`);
    }
    return value;
  },
  'normal'
);
```

Using `choices` (simpler approach):

```typescript
program
  .option('-m, --mode <mode>', 'execution mode')
  .choices(['normal', 'bug-hunt', 'validate'])
  .default('normal');
```

### Handling Boolean Flags

Boolean flags are straightforward - presence of the flag sets the value to `true`:

```typescript
program
  .option('-c, --continue', 'continue from previous state')
  .option('--dry-run', 'perform a dry run')
  .option('-v, --verbose', 'enable verbose output');

// Access values
const options = program.opts();
if (options.continue) {
  // handle continue mode
}
```

### TypeScript Type Safety

Commander.js provides excellent TypeScript support with generic types:

```typescript
interface CliOptions {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  dryRun: boolean;
  verbose: boolean;
}

const program = new Command();

program
  .option('--prd <path>', 'PRD file path', './PRD.md')
  .option('--scope <scope>', 'scope ID')
  .option('--mode <mode>', 'execution mode')
  .option('--continue', 'continue from previous state')
  .option('--dry-run', 'perform a dry run')
  .option('--verbose', 'enable verbose output');

const options = program.opts<CliOptions>();
// options is now fully typed with CliOptions interface
```

### Advanced TypeScript Integration

For even better type safety, Commander.js supports type inference:

```typescript
import { Command } from 'commander';

const program = new Command()
  .option('--prd <path>')
  .option('--scope <scope>')
  .option('--mode <mode>')
  .configureHelp({ sortSubcommands: true });

type GlobalOptions = {
  prd?: string;
  scope?: string;
  mode?: string;
};

const options = program.opts<GlobalOptions>();
```

---

## Yargs Research

### Current Version and TypeScript Support

**Version:** 18.0.0 (released 2025-05-27)
**Node.js Requirement:** ^20.19.0 || ^22.12.0 || >=23
**TypeScript Support:** Native (built in TypeScript since v17)
**Repository:** https://github.com/yargs/yargs
**Documentation:** https://yargs.js.org/

**Type Definitions Location:** Included in package (native TypeScript)

### Basic Usage Patterns

Yargs uses a parser builder pattern:

```typescript
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('debug', {
    type: 'boolean',
    description: 'enable debug mode',
    alias: 'd',
  })
  .parse();
```

### Setting Default Values

Default values are set using the `default` property:

```typescript
yargs(hideBin(process.argv))
  .option('config', {
    type: 'string',
    description: 'config file path',
    default: '/etc/config.json',
  })
  .option('port', {
    type: 'number',
    description: 'port number',
    default: 3000,
  })
  .parse();
```

### Defining Choices/Modes

Yargs provides built-in choice validation through the `choices` property:

```typescript
yargs(hideBin(process.argv))
  .option('mode', {
    type: 'string',
    description: 'execution mode',
    choices: ['normal', 'bug-hunt', 'validate'] as const,
    default: 'normal',
  })
  .parse();
```

### Handling Boolean Flags

Boolean flags use the `type: 'boolean'` configuration:

```typescript
yargs(hideBin(process.argv))
  .option('continue', {
    type: 'boolean',
    description: 'continue from previous state',
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'perform a dry run',
  })
  .option('verbose', {
    type: 'boolean',
    description: 'enable verbose output',
    alias: 'v',
  })
  .parse();
```

### TypeScript Type Safety

Yargs provides strong TypeScript support through type inference:

```typescript
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface CliOptions {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  dryRun: boolean;
  verbose: boolean;
}

const argv = yargs(hideBin(process.argv))
  .options({
    prd: {
      type: 'string',
      default: './PRD.md',
      description: 'PRD file path',
    },
    scope: {
      type: 'string',
      description: 'scope ID',
    },
    mode: {
      type: 'string',
      choices: ['normal', 'bug-hunt', 'validate'] as const,
      default: 'normal',
      description: 'execution mode',
    },
    continue: {
      type: 'boolean',
      description: 'continue from previous state',
    },
    'dry-run': {
      type: 'boolean',
      description: 'perform a dry run',
    },
    verbose: {
      type: 'boolean',
      description: 'enable verbose output',
    },
  })
  .parseSync();

// Type inference works, but argv is any by default
// Use type assertion or interface
const options = argv as unknown as CliOptions;
```

### Advanced TypeScript Integration

For better type safety, Yargs recommends using the `InferArguments` type:

```typescript
import yargs, { Arguments } from 'yargs';

type Options = {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  'dry-run': boolean;
  verbose: boolean;
};

const parser = yargs(hideBin(process.argv)).options({
  prd: { type: 'string', default: './PRD.md' },
  scope: { type: 'string' },
  mode: {
    type: 'string',
    choices: ['normal', 'bug-hunt', 'validate'] as const,
    default: 'normal',
  },
  continue: { type: 'boolean' },
  'dry-run': { type: 'boolean' },
  verbose: { type: 'boolean' },
});

const argv = parser.parseSync() as Arguments<Options>;
```

---

## Comparison

### TypeScript Support

| Feature               | Commander.js                    | Yargs                      |
| --------------------- | ------------------------------- | -------------------------- |
| **Native TypeScript** | Yes (v9+)                       | Yes (v17+)                 |
| **Type Definitions**  | Included (typings/index.d.ts)   | Included (native)          |
| **Generic Types**     | Excellent (`program.opts<T>()`) | Good, requires assertions  |
| **Type Inference**    | Good with interface             | Available but more verbose |
| **Strict Mode**       | Full support                    | Full support               |

**Winner:** Commander.js has slightly cleaner TypeScript integration with the generic `opts<T>()` method.

### Common Usage in Similar Projects

Based on npm download trends and GitHub usage:

- **Commander.js**: ~24 million weekly downloads
  - Used by: Vue CLI, Cordova, ESLint (legacy), mocha
  - Better for: Simple to medium complexity CLIs
  - Popular in developer tools and build tools

- **Yargs**: ~18 million weekly downloads
  - Used by: webpack, nodemon, serve, http-server
  - Better for: Complex CLIs with many options
  - Popular in server tools and development servers

**Winner:** Commander.js is slightly more popular overall.

### API Simplicity

**Commander.js:**

```typescript
// Simple, chainable API
program
  .option('--prd <path>', 'PRD path', './PRD.md')
  .option('--mode <mode>', 'mode')
  .choices(['normal', 'bug-hunt', 'validate'])
  .parse();

const options = program.opts<CliOptions>();
```

**Yargs:**

```typescript
// More verbose but more explicit
const argv = yargs(hideBin(process.argv))
  .options({
    prd: {
      type: 'string',
      default: './PRD.md',
      description: 'PRD path',
    },
    mode: {
      type: 'string',
      choices: ['normal', 'bug-hunt', 'validate'],
      default: 'normal',
      description: 'mode',
    },
  })
  .parseSync();

const options = argv as unknown as CliOptions;
```

**Winner:** Commander.js has a simpler, more concise API for basic use cases.

### Feature Comparison

| Feature                 | Commander.js     | Yargs                        |
| ----------------------- | ---------------- | ---------------------------- |
| **Subcommands**         | Built-in         | Built-in                     |
| **Nested Commands**     | Yes              | Yes                          |
| **Validation**          | Custom functions | Built-in validators          |
| **Help Generation**     | Built-in         | Built-in (more customizable) |
| **Auto-complete**       | No               | Yes (bash completion)        |
| **Config Files**        | Manual           | Built-in support             |
| **Middleware**          | Yes              | Yes                          |
| **Locale Support**      | Limited          | Extensive                    |
| **Parsing Positionals** | Basic            | Advanced                     |
| **Coercion**            | Custom functions | Built-in                     |

**Winner:** Yargs has more features for complex scenarios.

### Known Issues and Gotchas

#### Commander.js

- **Boolean flags with defaults**: Setting a default for a boolean flag can be confusing
  ```typescript
  // This might not work as expected
  program.option('--verbose', 'verbose output', false);
  // Use explicit boolean check instead
  ```
- **Option naming with dashes**: TypeScript interfaces need camelCase
  ```typescript
  interface Options {
    dryRun: boolean; // not 'dry-run'
  }
  program.option('--dry-run', 'dry run');
  const opts = program.opts<Options>();
  ```
- **Type coercion**: Options are always strings by default, need explicit types
  ```typescript
  program.option('--count <n>', 'count', parseInt); // Need to coerce to number
  ```

#### Yargs

- **Type assertions required**: The `parseSync()` return type is `any`
  ```typescript
  // Requires type assertion
  const argv = yargs(...).parseSync() as Arguments<Options>;
  ```
- **Hidden options API**: Some advanced features have less documented APIs
- **Middleware ordering**: Middleware execution order can be surprising
- **Camel case conversion**: Automatically converts kebab-case to camelCase
  ```typescript
  // --dry-run becomes argv.dryRun
  ```

---

## Code Examples

### Commander.js Implementation

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

interface CliOptions {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  dryRun: boolean;
  verbose: boolean;
}

const program = new Command();

program
  .name('prp-cli')
  .description('PRD to PRP Pipeline CLI')
  .version('1.0.0')
  // Required options
  .option('--prd <path>', 'Path to PRD file', './PRD.md')
  // Optional options
  .option('--scope <scope>', 'Scope identifier (milestone/task/subtask ID)')
  // Choices with default
  .addOption(
    program
      .createOption('--mode <mode>', 'Execution mode')
      .choices(['normal', 'bug-hunt', 'validate'])
      .default('normal')
  )
  // Boolean flags
  .option('--continue', 'Continue from previous state')
  .option('--dry-run', 'Perform a dry run without making changes')
  .option('--verbose', 'Enable verbose output')
  .parse(process.argv);

const options = program.opts<CliOptions>();

// Validation
if (!options.prd) {
  console.error('Error: --prd option is required');
  process.exit(1);
}

// Usage
if (options.verbose) {
  console.log('CLI Options:', options);
}

if (options.continue) {
  console.log('Continuing from previous state...');
}

if (options.dryRun) {
  console.log('DRY RUN: No changes will be made');
}

console.log(`PRD: ${options.prd}`);
console.log(`Mode: ${options.mode}`);
if (options.scope) {
  console.log(`Scope: ${options.scope}`);
}
```

### Yargs Implementation

```typescript
#!/usr/bin/env node
import yargs, { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';

interface CliOptions {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  'dry-run': boolean;
  verbose: boolean;
}

const argv = yargs(hideBin(process.argv))
  .options({
    prd: {
      type: 'string',
      description: 'Path to PRD file',
      default: './PRD.md',
      demandOption: false, // because we have a default
    },
    scope: {
      type: 'string',
      description: 'Scope identifier (milestone/task/subtask ID)',
    },
    mode: {
      type: 'string',
      description: 'Execution mode',
      choices: ['normal', 'bug-hunt', 'validate'] as const,
      default: 'normal',
    },
    continue: {
      type: 'boolean',
      description: 'Continue from previous state',
      default: false,
    },
    'dry-run': {
      type: 'boolean',
      description: 'Perform a dry run without making changes',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    },
  })
  .help()
  .alias('help', 'h')
  .version('1.0.0')
  .alias('version', 'v')
  .parseSync() as Arguments<CliOptions>;

// Access options (note: yargs converts --dry-run to argv.dryRun)
const options: CliOptions = {
  prd: argv.prd as string,
  scope: argv.scope,
  mode: argv.mode as 'normal' | 'bug-hunt' | 'validate',
  continue: argv.continue as boolean,
  'dry-run': argv['dry-run'] as boolean,
  verbose: argv.verbose as boolean,
};

// Validation
if (!options.prd) {
  console.error('Error: --prd option is required');
  process.exit(1);
}

// Usage
if (options.verbose) {
  console.log('CLI Options:', options);
}

if (options.continue) {
  console.log('Continuing from previous state...');
}

if (options['dry-run']) {
  console.log('DRY RUN: No changes will be made');
}

console.log(`PRD: ${options.prd}`);
console.log(`Mode: ${options.mode}`);
if (options.scope) {
  console.log(`Scope: ${options.scope}`);
}
```

### Commander.js with Commands

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

interface CommonOptions {
  prd: string;
  verbose: boolean;
  dryRun: boolean;
}

interface RunOptions extends CommonOptions {
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
}

const program = new Command();

program.name('prp-cli').description('PRD to PRP Pipeline CLI').version('1.0.0');

// Common options function
function addCommonOptions(command: Command): Command {
  return command
    .option('--prd <path>', 'Path to PRD file', './PRD.md')
    .option('--verbose', 'Enable verbose output')
    .option('--dry-run', 'Perform a dry run');
}

// Run command
addCommonOptions(program.command('run').description('Run the PRP pipeline'))
  .option('--scope <scope>', 'Scope identifier')
  .option('--mode <mode>', 'Execution mode')
  .choices(['normal', 'bug-hunt', 'validate'])
  .default('normal')
  .option('--continue', 'Continue from previous state')
  .action(options => {
    const opts = options as RunOptions;

    if (opts.verbose) {
      console.log('Running PRP pipeline with options:', opts);
    }

    if (opts.dryRun) {
      console.log('DRY RUN: Pipeline execution simulated');
      return;
    }

    // Actual pipeline logic here
    console.log(`Running PRD: ${opts.prd}`);
    console.log(`Mode: ${opts.mode}`);
  });

// Status command
addCommonOptions(
  program.command('status').description('Show pipeline status')
).action(options => {
  const opts = options as CommonOptions;
  console.log('Pipeline status:');
  console.log(`PRD: ${opts.prd}`);
});

program.parse();
```

### Yargs with Commands

```typescript
#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .command(
    'run',
    'Run the PRP pipeline',
    yargs => {
      return yargs
        .option('scope', {
          type: 'string',
          description: 'Scope identifier',
        })
        .option('mode', {
          type: 'string',
          description: 'Execution mode',
          choices: ['normal', 'bug-hunt', 'validate'] as const,
          default: 'normal',
        })
        .option('continue', {
          type: 'boolean',
          description: 'Continue from previous state',
          default: false,
        });
    },
    argv => {
      console.log('Running PRP pipeline');
      console.log('Options:', argv);
    }
  )
  .command(
    'status',
    'Show pipeline status',
    yargs => yargs,
    argv => {
      console.log('Pipeline status: Active');
    }
  )
  .option('prd', {
    type: 'string',
    description: 'Path to PRD file',
    default: './PRD.md',
    global: true, // Available to all commands
  })
  .option('verbose', {
    type: 'boolean',
    description: 'Enable verbose output',
    global: true,
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'Perform a dry run',
    global: true,
  })
  .demandCommand(1, 'You need at least one command')
  .help()
  .alias('help', 'h')
  .parse();
```

---

## Recommendation

### Recommended Library: Commander.js

**Reasons:**

1. **Simpler API**: The chainable API is more intuitive and requires less boilerplate
2. **Better TypeScript Integration**: The generic `opts<T>()` method provides cleaner type safety
3. **Better Fit for Use Case**: The PRP CLI has straightforward requirements that don't need Yargs' advanced features
4. **More Popular**: Wider adoption means better community support and more examples
5. **Cleaner Boolean Flag Handling**: Boolean flags work more intuitively without special configuration
6. **Better Documentation**: The README is comprehensive and easy to follow

### Implementation Plan

1. **Install Commander.js**:

   ```bash
   npm install commander
   npm install --save-dev @types/node
   ```

2. **Create CLI Entry Point** (`src/cli/index.ts`):
   - Define `CliOptions` interface
   - Configure all options
   - Add validation logic
   - Route to appropriate handlers

3. **Structure**:

   ```
   src/cli/
   ├── index.ts           # Main CLI entry point
   ├── commands/          # Command handlers
   │   ├── run.ts
   │   ├── status.ts
   │   └── validate.ts
   └── utils/
       └── options.ts     # Option validation utilities
   ```

4. **Testing Strategy**:
   - Unit tests for option parsing
   - Integration tests for command execution
   - Use `commander`'s testing utilities

### Alternative: Use Yargs If

Consider Yargs instead if:

- You need shell auto-completion (tab completion)
- You want built-in config file support
- You have complex nested commands
- You need advanced validation/coercion
- You want locale/i18n support

---

## References

### Commander.js

- **Official Repository**: https://github.com/tj/commander.js
- **NPM Package**: https://www.npmjs.com/package/commander
- **Documentation**: https://github.com/tj/commander.js/blob/master/Readme.md
- **TypeScript Examples**: https://github.com/tj/commander.js/tree/master/examples/typescript
- **Current Version**: 14.0.2 (as of 2026-01-13)

### Yargs

- **Official Repository**: https://github.com/yargs/yargs
- **NPM Package**: https://www.npmjs.com/package/yargs
- **Documentation**: https://yargs.js.org/
- **TypeScript Guide**: https://yargs.js.org/docs/#api-reference-typescript
- **Current Version**: 18.0.0 (as of 2026-01-13)

### Additional Resources

- **Commander.js API Reference**: https://github.com/tj/commander.js/blob/master/Readme.md#commanderoptions
- **Yargs API Reference**: https://yargs.js.org/docs/api/
- **CLI Best Practices**: https://clig.dev/

---

## Appendix: Quick Reference

### Commander.js Quick Reference

```typescript
// Basic setup
import { Command } from 'commander';
const program = new Command();

// Options
program.option('-f, --flag', 'description');
program.option('-v, --value <value>', 'description', 'default');
program.option('--mode <mode>', 'description', val => {
  if (!['a', 'b'].includes(val)) throw new Error('Invalid');
  return val;
});

// Choices
program.createOption('--mode <mode>').choices(['a', 'b', 'c']).default('a');

// Parsing
program.parse();
const opts = program.opts<Options>();

// Commands
program
  .command('run')
  .option('-v, --verbose', 'verbose')
  .action(options => {
    /* handler */
  });
```

### Yargs Quick Reference

```typescript
// Basic setup
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Options
yargs(hideBin(process.argv))
  .option('flag', { type: 'boolean', description: 'desc' })
  .option('value', {
    type: 'string',
    description: 'desc',
    default: 'default'
  })
  .option('mode', {
    type: 'string',
    choices: ['a', 'b', 'c'] as const,
    default: 'a'
  });

// Commands
.command('run', 'description', (yargs) => {
  return yargs.option('verbose', { type: 'boolean' });
}, (argv) => { /* handler */ })

// Parsing
.parse();
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-13
**Next Review:** Before P3M4T2 implementation begins
