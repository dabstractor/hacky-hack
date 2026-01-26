# CLI Command Patterns Research

## Source: Codebase Analysis via Explore Agent

## CLI Command Structure

### Framework: Commander.js
- Location: `src/cli/index.ts`
- Main command: `prp-pipeline`
- Subcommands: `inspect` (already exists)
- Pattern: Class-based command handlers

### Command Handler Pattern
```typescript
// File: src/cli/commands/inspect.ts
export class InspectCommand {
  constructor(planDir?: string, prdPath?: string) {}
  async execute(options: InspectOptions): Promise<void> {
    // Command implementation
  }
  #privateHelperMethod() {}
}
```

### Command Registration Pattern
```typescript
// src/cli/index.ts
program
  .command('inspect')
  .description('Inspect pipeline state')
  .option('--output <format>', 'Output format', 'table')
  .action(async (options) => {
    const command = new InspectCommand(planDir, prdPath);
    await command.execute(options);
  });
```

## Session/Artifact Access Patterns

### SessionManager Methods
- `loadSession(sessionPath)`: Load session from directory
- `findLatestSession(planDir)`: Find most recent session
- `listSessions(planDir)`: List all sessions
- `getCurrentItem()`: Get currently executing task

### Artifact Locations
- PRPs: `session/prps/{taskId}.md`
- Artifacts: `session/artifacts/{taskId}/`
- Session discovery: `{sequence}_{hash}` naming (e.g., `001_14b9dc2a33c7`)

## Display Utilities (Existing)

### Table Formatter (`src/utils/display/table-formatter.ts`)
- Uses `cli-table3` with custom ASCII box-drawing
- Pre-formatted tables for sessions, tasks, artifacts, errors

### Tree Renderer (`src/utils/display/tree-renderer.ts`)
- ASCII tree visualization for task hierarchy
- Supports full and filtered views

### Status Colors (`src/utils/display/status-colors.ts`)
- Color-coded status with chalk
- Unicode symbols: ✓, ◐, ○, ✗, ⊘

## Output Formats
1. **Table**: Structured tables with colored status
2. **Tree**: ASCII tree visualization
3. **JSON**: Machine-readable output
4. **YAML**: Not fully implemented (uses JSON)

## Implementation Recommendations

### Command Class Template
```typescript
export class ArtifactsCommand {
  #sessionManager: SessionManager;
  #planDir: string;

  constructor(planDir?: string, prdPath?: string) {
    this.#planDir = planDir || getDefaultPlanDir();
    this.#sessionManager = new SessionManager();
  }

  async execute(options: ArtifactsOptions): Promise<void> {
    // Implementation
  }
}
```

### Using Existing Display Utilities
```typescript
import { formatSessionTable, formatTaskHierarchyTable } from '../utils/display/table-formatter.js';
import { getStatusIndicator } from '../utils/display/status-colors.js';
```

### CLI Integration Pattern
```typescript
program
  .command('artifacts')
  .description('View pipeline artifacts')
  .argument('[action]', 'Action: list, view, diff', 'list')
  .option('--session <id>', 'Session ID')
  .option('--output <format>', 'Output format', 'table')
  .action(async (action, options) => {
    const command = new ArtifactsCommand(planDir, prdPath);
    await command.execute(action, options);
  });
```
