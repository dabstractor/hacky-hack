# Suggested Fixes and Documentation Linking

**Research Date:** 2025-01-24
**Focus:** How to suggest fixes, link to documentation, and provide actionable guidance

## Table of Contents

1. [Fix Suggestion Framework](#fix-suggestion-framework)
2. [Documentation Linking Strategies](#documentation-linking-strategies)
3. [Smart Error Recommendations](#smart-error-recommendations)
4. [Command Generation Patterns](#command-generation-patterns)
5. [Real-World Examples](#real-world-examples)
6. [Implementation Examples](#implementation-examples)

---

## Fix Suggestion Framework

### The Three-Level Suggestion System

```
Level 1: Immediate Action
  └─ What to do right now (exact command)

Level 2: Understanding
  └─ Why this happened and how to prevent it

Level 3: Deep Dive
  └─ Full documentation and troubleshooting
```

### Template Structure

```typescript
interface ErrorSuggestion {
  // Level 1: Immediate Action
  quickFix?: {
    command: string;
    explanation: string;
  };

  // Level 2: Understanding
  diagnosis: {
    cause: string;
    implications: string[];
  };

  // Level 3: Deep Dive
  documentation?: {
    url: string;
    section?: string;
    relatedTopics?: string[];
  };

  // Additional options
  alternatives?: Array<{
    command: string;
    whenToUse: string;
  }>;

  prevention?: {
    tips: string[];
    configChanges?: Array<{
      file: string;
      setting: string;
      value: string;
    }>;
  };
}
```

---

## Documentation Linking Strategies

### Link Taxonomy

```
Direct Links
  ├─ Error-specific guides
  ├─ API documentation
  └─ Troubleshooting pages

Contextual Links
  ├─ Concept explanations
  ├─ Related errors
  └─ Best practices

Interactive Links
  ├─ Step-by-step wizards
  ├─ Video tutorials
  └─ Community forums
```

### URL Structure Patterns

```typescript
// Error-specific documentation
const errorDocUrl = (code: string) =>
  `https://docs.hacky-hack.dev/errors/${code.toLowerCase()}`;

// Concept documentation
const conceptDocUrl = (concept: string) =>
  `https://docs.hacky-hack.dev/concepts/${concept.toLowerCase()}`;

// API documentation
const apiDocUrl = (module: string, method: string) =>
  `https://docs.hacky-hack.dev/api/${module}/${method}`;

// Troubleshooting guides
const troubleshootUrl = (topic: string) =>
  `https://docs.hacky-hack.dev/troubleshooting#${topic.toLowerCase()}`;
```

### Documentation Metadata

```typescript
interface DocumentationLink {
  url: string;
  title: string;
  type: 'guide' | 'api' | 'troubleshoot' | 'reference';
  severity: 'critical' | 'important' | 'helpful' | 'optional';
  estimatedReadTime?: string;
  sections?: Array<{
    anchor: string;
    title: string;
  }>;
  relatedLinks?: DocumentationLink[];
}
```

---

## Smart Error Recommendations

### Error Pattern Matching

```typescript
class ErrorRecommendationEngine {
  private patterns: Array<{
    matcher: RegExp | ((error: Error) => boolean);
    recommendations: ErrorSuggestion;
  }> = [
    {
      matcher: /EACCES|permission denied/i,
      recommendations: {
        quickFix: {
          command: 'sudo chmod +x <file>',
          explanation: 'Grant execute permissions to the file',
        },
        diagnosis: {
          cause: 'Insufficient permissions to access the file or directory',
          implications: [
            'Cannot read/write the specified file',
            'Operation will fail until permissions are fixed',
          ],
        },
        documentation: {
          url: 'https://docs.hacky-hack.dev/troubleshooting/permissions',
          section: 'File Permission Errors',
        },
      },
    },
    {
      matcher: /ENOENT|no such file/i,
      recommendations: {
        quickFix: {
          command: 'hack init',
          explanation: 'Initialize the project structure',
        },
        diagnosis: {
          cause: 'Required file or directory does not exist',
          implications: [
            'Cannot proceed without this resource',
            'May indicate incomplete setup',
          ],
        },
        documentation: {
          url: 'https://docs.hacky-hack.dev/getting-started/setup',
        },
        alternatives: [
          {
            command: 'ls -la',
            whenToUse: 'To check what files exist in the directory',
          },
          {
            command: 'pwd',
            whenToUse: 'To verify your current directory',
          },
        ],
      },
    },
    {
      matcher: (error: Error) =>
        error.message.includes('Cannot find module') &&
        error.message.includes('typescript'),
      recommendations: {
        quickFix: {
          command: 'npm install --save-dev typescript',
          explanation: 'Install TypeScript as a dev dependency',
        },
        diagnosis: {
          cause: 'TypeScript is not installed in the project',
          implications: [
            'Cannot compile TypeScript files',
            'Type checking will fail',
          ],
        },
        documentation: {
          url: 'https://docs.hacky-hack.dev/languages/typescript',
        },
        prevention: {
          tips: [
            'Run `npm install` after cloning the repository',
            'Check package.json for required dependencies',
            'Use `npm ci` for clean installs',
          ],
        },
      },
    },
  ];

  getRecommendations(error: Error): ErrorSuggestion | null {
    for (const pattern of this.patterns) {
      const matches =
        pattern.matcher instanceof RegExp
          ? pattern.matcher.test(error.message)
          : pattern.matcher(error);

      if (matches) {
        return pattern.recommendations;
      }
    }
    return null;
  }
}
```

### Context-Aware Recommendations

```typescript
class ContextualRecommender {
  getRecommendations(
    error: Error,
    context: {
      command?: string;
      cwd?: string;
      env?: Record<string, string>;
      gitStatus?: string;
    }
  ): ErrorSuggestion[] {
    const recommendations: ErrorSuggestion[] = [];

    // Git-specific recommendations
    if (context.gitStatus?.includes('detached')) {
      recommendations.push({
        quickFix: {
          command: 'git checkout main',
          explanation: 'Return to the main branch',
        },
        diagnosis: {
          cause: 'You are in a detached HEAD state',
          implications: [
            'Commits will not be associated with a branch',
            'Changes may be lost',
          ],
        },
        documentation: {
          url: 'https://docs.hacky-hack.dev/git/detached-head',
        },
      });
    }

    // Environment-specific recommendations
    if (
      context.env?.NODE_ENV === 'production' &&
      error.message.includes('DEBUG')
    ) {
      recommendations.push({
        diagnosis: {
          cause: 'Debug mode is not recommended in production',
          implications: [
            'Performance degradation',
            'Potential security exposure',
          ],
        },
        prevention: {
          tips: [
            'Use NODE_ENV=production for production deployments',
            'Disable debug logging in production',
          ],
          configChanges: [
            {
              file: '.env',
              setting: 'DEBUG',
              value: 'false',
            },
          ],
        },
      });
    }

    return recommendations;
  }
}
```

---

## Command Generation Patterns

### Pattern 1: Exact Command Replacement

```typescript
// Original failing command
// $ hack session create --name invalid-name

// Suggested fix
// $ hack session create --name valid-session-name
```

### Pattern 2: Pre-flight Commands

```typescript
interface CommandSequence {
  preFlight?: string[];
  mainCommand: string;
  postFlight?: string[];
}

const fixSequence: CommandSequence = {
  preFlight: ['git stash', 'git pull --rebase'],
  mainCommand: 'hack session create --name new-session',
  postFlight: ['git stash pop'],
};
```

### Pattern 3: Conditional Commands

```typescript
class ConditionalCommandGenerator {
  generate(error: Error, condition: () => boolean): string | null {
    if (condition()) {
      return this.generateFix(error);
    }
    return null;
  }

  private generateFix(error: Error): string {
    if (error.message.includes('port in use')) {
      const match = error.message.match(/port (\d+)/);
      if (match) {
        const port = match[1];
        return `lsof -ti:${port} | xargs kill -9`;
      }
    }
    return '';
  }
}
```

### Pattern 4: Interactive Fix Prompts

```typescript
import prompt from 'prompts';

class InteractiveFixer {
  async suggestAndExecute(error: Error): Promise<boolean> {
    const suggestion = this.getRecommendation(error);

    if (!suggestion) {
      return false;
    }

    console.log(`\n${chalk.yellow('Suggested Fix:')}`);
    console.log(`  ${suggestion.explanation}\n`);
    console.log(`${chalk.cyan('Command:')}`);
    console.log(`  $ ${suggestion.command}\n`);

    const { shouldExecute } = await prompt({
      type: 'confirm',
      name: 'shouldExecute',
      message: 'Execute this command?',
      initial: false,
    });

    if (shouldExecute) {
      const { exec } = require('child_process');
      return new Promise(resolve => {
        exec(suggestion.command, (error: any) => {
          resolve(!error);
        });
      });
    }

    return false;
  }
}
```

---

## Real-World Examples

### Example 1: Docker Permission Error

```bash
$ docker ps
Got permission denied while trying to connect to the Docker daemon socket
at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json":
dial unix /var/run/docker.sock: connect: permission denied

═══════════════════════════════════════════════════════════════════════════
  Quick Fix
───────────────────────────────────────────────────────────────────────────
  Add your user to the docker group:

    $ sudo usermod -aG docker $USER
    $ newgrp docker

  Explanation: Your user doesn't have permission to access the Docker daemon.
  By adding your user to the 'docker' group, you can run Docker without sudo.

═══════════════════════════════════════════════════════════════════════════
  Why This Happened
───────────────────────────────────────────────────────────────────────────
  Cause: The Docker daemon socket is owned by root and requires root access.
  Implications:
    • Cannot manage Docker containers or images
    • All Docker commands will fail with permission errors
    • Automation scripts will be blocked

═══════════════════════════════════════════════════════════════════════════
  Documentation
───────────────────────────────────────────────────────────────────────────
  🔧 Post-installation steps for Linux:
     https://docs.docker.com/engine/install/linux-postinstall/

  📚 Managing Docker as a non-root user:
     https://docs.docker.com/engine/security/rootless/

═══════════════════════════════════════════════════════════════════════════
  Prevention
───────────────────────────────────────────────────────────────────────────
  Tips:
    • Log out and back in after adding yourself to the docker group
    • Verify with: groups $USER | grep docker
    • Consider using rootless mode for improved security

  Alternatives:
    • Run Docker with sudo (not recommended for development)
    • Use rootless Docker daemon (better security)
```

### Example 2: npm Dependency Conflict

```bash
$ npm install
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR!
npm ERR! While resolving: hacky-hack@0.1.0
npm ERR! Found: typescript@5.2.0
npm ERR! node_modules/typescript
npm ERR!   typescript@"^5.2.0" from the root project
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peerDependency typescript@">=4.7 <5.0" from @types/node@20.10.0

═══════════════════════════════════════════════════════════════════════════
  Quick Fix
───────────────────────────────────────────────────────────────────────────
  Use the --legacy-peer-deps flag:

    $ npm install --legacy-peer-deps

  Or force the resolution:

    $ npm install --force

  Explanation: The dependency tree has conflicting TypeScript version
  requirements. Using --legacy-peer-deps tells npm to ignore peer conflicts.

═══════════════════════════════════════════════════════════════════════════
  Why This Happened
───────────────────────────────────────────────────────────────────────────
  Cause: Two packages require different versions of TypeScript.
  Implications:
    • npm's strict peer dependency resolution prevents installation
    • Your project may not work with incompatible type definitions
    • Development workflow is blocked

═══════════════════════════════════════════════════════════════════════════
  Documentation
───────────────────────────────────────────────────────────────────────────
  📚 Peer dependency conflicts:
     https://docs.npmjs.com/cli/v8/using-npm/resolving-peer-dependency-conflicts

  🔧 Managing dependency conflicts:
     https://docs.hacky-hack.dev/troubleshooting/dependencies

═══════════════════════════════════════════════════════════════════════════
  Alternatives
───────────────────────────────────────────────────────────────────────────
  Option 1: Override the version
    $ npm install typescript@4.9.5 --save-exact

  Option 2: Use npm overrides (package.json)
    {
      "overrides": {
        "@types/node": {
          "typescript": "^5.2.0"
        }
      }
    }

  Option 3: Update the conflicting package
    $ npm update @types/node

═══════════════════════════════════════════════════════════════════════════
  Prevention
───────────────────────────────────────────────────────────────────────────
  Tips:
    • Keep dependencies updated regularly
    • Use npm-check-updates to check for conflicts
    • Test dependency updates in a separate branch first
    • Consider using a lockfile (package-lock.json)

  Recommended Workflow:
    1. Run: ncu -u (check for updates)
    2. Review: git diff package.json
    3. Test: npm install && npm test
    4. Commit: git add package.json package-lock.json
```

### Example 3: Git Merge Conflict

```bash
$ git pull
Auto-merging src/core/session.ts
CONFLICT (content): Merge conflict in src/core/session.ts
Automatic merge failed; fix conflicts and then commit the result.

═══════════════════════════════════════════════════════════════════════════
  Quick Fix
───────────────────────────────────────────────────────────────────────────
  Step 1: Review the conflicts
    $ git status

  Step 2: Open the conflicting file in your editor
    $ code src/core/session.ts

  Step 3: Look for conflict markers:
    <<<<<<< HEAD
    Your changes
    =======
    Their changes
    >>>>>>> main

  Step 4: Resolve conflicts by choosing or merging code

  Step 5: Mark the file as resolved
    $ git add src/core/session.ts

  Step 6: Complete the merge
    $ git commit

  Explanation: Merge conflicts occur when Git cannot automatically reconcile
  changes between branches. You must manually decide which code to keep.

═══════════════════════════════════════════════════════════════════════════
  Why This Happened
───────────────────────────────────────────────────────────────────────────
  Cause: Both branches modified the same lines of the same file.
  Implications:
    • Git cannot automatically determine which changes to keep
    • Manual intervention is required to complete the merge
    • The merge is paused until conflicts are resolved

═══════════════════════════════════════════════════════════════════════════
  Documentation
───────────────────────────────────────────────────────────────────────────
  📚 Resolving merge conflicts:
     https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line

  🔧 Git conflict resolution strategies:
     https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts

═══════════════════════════════════════════════════════════════════════════
  Alternatives
───────────────────────────────────────────────────────────────────────────
  Option 1: Accept all your changes
    $ git checkout --ours src/core/session.ts
    $ git add src/core/session.ts

  Option 2: Accept all their changes
    $ git checkout --theirs src/core/session.ts
    $ git add src/core/session.ts

  Option 3: Use a merge tool
    $ git mergetool
    $ git commit

  Option 4: Abort the merge
    $ git merge --abort

═══════════════════════════════════════════════════════════════════════════
  Prevention
───────────────────────────────────────────────────────────────────────────
  Tips:
    • Pull changes frequently to reduce conflict scope
    • Communicate with teammates about large changes
    • Use feature branches instead of committing directly to main
    • Consider using rebase instead of merge for linear history

  Recommended Workflow:
    1. Before starting work: git pull
    2. During work: git pull --rebase (occasionally)
    3. Before committing: git status
    4. After resolving: git push
```

---

## Implementation Examples

### Complete Suggestion System

```typescript
import chalk from 'chalk';
import { execSync } from 'child_process';

interface SuggestionFormatterOptions {
  showQuickFix?: boolean;
  showDiagnosis?: boolean;
  showDocumentation?: boolean;
  showAlternatives?: boolean;
  showPrevention?: boolean;
}

class SuggestionFormatter {
  format(
    suggestion: ErrorSuggestion,
    options: SuggestionFormatterOptions = {}
  ): string {
    const lines: string[] = [];

    const {
      showQuickFix = true,
      showDiagnosis = true,
      showDocumentation = true,
      showAlternatives = true,
      showPrevention = true,
    } = options;

    // Quick Fix section
    if (showQuickFix && suggestion.quickFix) {
      lines.push(this.formatQuickFix(suggestion.quickFix));
    }

    // Diagnosis section
    if (showDiagnosis) {
      lines.push(this.formatDiagnosis(suggestion.diagnosis));
    }

    // Documentation section
    if (showDocumentation && suggestion.documentation) {
      lines.push(this.formatDocumentation(suggestion.documentation));
    }

    // Alternatives section
    if (showAlternatives && suggestion.alternatives) {
      lines.push(this.formatAlternatives(suggestion.alternatives));
    }

    // Prevention section
    if (showPrevention && suggestion.prevention) {
      lines.push(this.formatPrevention(suggestion.prevention));
    }

    return lines.join('\n\n');
  }

  private formatQuickFix(fix: {
    command: string;
    explanation: string;
  }): string {
    const header = chalk.bold.yellow('Quick Fix');
    const separator = chalk.gray('─'.repeat(80));

    return [
      separator,
      header,
      separator,
      '',
      chalk.cyan('  ' + fix.explanation),
      '',
      chalk.bold('  $ ' + fix.command),
      '',
    ].join('\n');
  }

  private formatDiagnosis(diagnosis: {
    cause: string;
    implications: string[];
  }): string {
    const header = chalk.bold.yellow('Why This Happened');
    const separator = chalk.gray('─'.repeat(80));

    const lines = [
      separator,
      header,
      separator,
      '',
      chalk.cyan(`  Cause: ${diagnosis.cause}`),
      '',
      chalk.cyan('  Implications:'),
    ];

    for (const implication of diagnosis.implications) {
      lines.push(`    • ${implication}`);
    }

    lines.push('');

    return lines.join('\n');
  }

  private formatDocumentation(docs: DocumentationLink): string {
    const header = chalk.bold.yellow('Documentation');
    const separator = chalk.gray('─'.repeat(80));

    const lines = [separator, header, separator, ''];

    const icons = {
      guide: '📚',
      api: '🔧',
      troubleshoot: '🔨',
      reference: '📖',
    };

    const icon = icons[docs.type] || '📄';
    lines.push(`  ${icon} ${chalk.blue.underline(docs.title || docs.url)}`);
    lines.push(`     ${chalk.dim(docs.url)}`);

    if (docs.sections) {
      lines.push('');
      lines.push(chalk.cyan('  Sections:'));
      for (const section of docs.sections) {
        const url = `${docs.url}#${section.anchor}`;
        lines.push(`    • ${chalk.blue.underline(section.title)}`);
        lines.push(`      ${chalk.dim(url)}`);
      }
    }

    if (docs.relatedLinks && docs.relatedLinks.length > 0) {
      lines.push('');
      lines.push(chalk.cyan('  Related:'));
      for (const related of docs.relatedLinks) {
        const relIcon = icons[related.type] || '📄';
        lines.push(`    ${relIcon} ${chalk.blue.underline(related.url)}`);
      }
    }

    lines.push('');

    return lines.join('\n');
  }

  private formatAlternatives(
    alternatives: Array<{
      command: string;
      whenToUse: string;
    }>
  ): string {
    const header = chalk.bold.yellow('Alternatives');
    const separator = chalk.gray('─'.repeat(80));

    const lines = [separator, header, separator, ''];

    for (let i = 0; i < alternatives.length; i++) {
      const alt = alternatives[i];
      lines.push(`  ${chalk.bold(`Option ${i + 1}:`)} ${alt.whenToUse}`);
      lines.push(`    ${chalk.cyan('$ ' + alt.command)}`);
      if (i < alternatives.length - 1) {
        lines.push('');
      }
    }

    lines.push('');

    return lines.join('\n');
  }

  private formatPrevention(prevention: {
    tips: string[];
    configChanges?: Array<{
      file: string;
      setting: string;
      value: string;
    }>;
  }): string {
    const header = chalk.bold.yellow('Prevention');
    const separator = chalk.gray('─'.repeat(80));

    const lines = [separator, header, separator, ''];

    if (prevention.tips.length > 0) {
      lines.push(chalk.cyan('  Tips:'));
      for (const tip of prevention.tips) {
        lines.push(`    • ${tip}`);
      }
      lines.push('');
    }

    if (prevention.configChanges && prevention.configChanges.length > 0) {
      lines.push(chalk.cyan('  Configuration Changes:'));
      for (const change of prevention.configChanges) {
        lines.push(`    • ${chalk.bold(change.file)}`);
        lines.push(`      ${change.setting} = ${chalk.green(change.value)}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// Usage
const formatter = new SuggestionFormatter();

const suggestion: ErrorSuggestion = {
  quickFix: {
    command: 'npm install --legacy-peer-deps',
    explanation: 'Install dependencies ignoring peer dependency conflicts',
  },
  diagnosis: {
    cause: 'Conflicting dependency version requirements',
    implications: [
      'Cannot install dependencies',
      'Development workflow blocked',
    ],
  },
  documentation: {
    url: 'https://docs.hacky-hack.dev/troubleshooting/dependencies',
    title: 'Managing Dependency Conflicts',
    type: 'troubleshoot',
  },
  alternatives: [
    {
      command: 'npm install --force',
      whenToUse: 'When you want to force the installation',
    },
    {
      command: 'npm update',
      whenToUse: 'To update all dependencies to latest versions',
    },
  ],
  prevention: {
    tips: [
      'Keep dependencies updated',
      'Use lockfiles',
      'Test dependency updates in a separate branch',
    ],
  },
};

console.log(formatter.format(suggestion));
```

---

## Best Practices

### DO:

- Provide exact, copy-pasteable commands
- Explain why each step is necessary
- Link to official documentation
- Offer multiple solution approaches
- Show how to prevent the issue
- Include verification steps
- Consider skill level of audience
- Test suggested commands before showing

### DON'T:

- Provide vague suggestions
- Skip explanations
- Link to broken or irrelevant docs
- Suggest destructive operations without warnings
- Assume user context (paths, env vars)
- Overwhelm with too many options
- Forget about security implications
- Use deprecated commands or APIs

---

## Related Libraries

- `prompts` - Interactive command-line prompts
- `inquirer` - Alternative interactive CLI interface
- `chalk` - Terminal colors
- `cli-table3` - Formatted tables
- `ora` - Loading spinners for long operations

---

## References

- **npm Error Documentation**: https://docs.npmjs.com/cli/v8/using-npm/errors
- **Docker Troubleshooting**: https://docs.docker.com/engine/troubleshooting/
- **Git Error Messages**: https://git-scm.com/docs/git
- **AWS CLI Error Codes**: https://docs.aws.amazon.com/cli/latest/topic/return-codes.html
