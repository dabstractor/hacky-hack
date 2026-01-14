# External Dependencies Analysis

## Groundswell Library

### Current State
- **Status**: MISSING - Not installed/linked
- **Expected Location**: `~/projects/groundswell`
- **Import Path**: `import { ... } from 'groundswell'`
- **Type Definition**: Included in library distribution

### Groundswell API Surface

**Core Exports**:
```typescript
// Workflow System
export class Workflow { /* ... */ }
export class Step { /* ... */ }

// Agent System
export function createAgent(config: AgentConfig): Agent { /* ... */ }
export type Agent = { /* ... */ };

// Prompt System
export function createPrompt(template: string): Prompt { /* ... */ }
export type Prompt = { /* ... */ };

// MCP Tool System
export class MCPHandler implements ToolExecutor { /* ... */ }
export type Tool = { /* ... */ };
export type ToolExecutor = { /* ... */ };
```

### Integration Points

**Files Using Groundswell** (97 total):

**Workflow Definitions** (6 files):
1. `src/workflows/prp-pipeline.ts` - Main pipeline
2. `src/workflows/fix-cycle-workflow.ts` - Cycle detection
3. `src/workflows/bug-hunt-workflow.ts` - Bug detection
4. `src/workflows/delta-analysis-workflow.ts` - Delta analysis
5. `src/workflows/hello-world.ts` - Demo
6. `vitest.config.ts` - Alias configuration

**Agent Implementations** (3 files):
1. `src/agents/agent-factory.ts` - Factory pattern
2. `src/agents/prp-generator.ts` - PRP generation
3. `src/agents/prp-executor.ts` - PRP execution

**Prompt Definitions** (4 files):
1. `src/agents/prompts/architect-prompt.ts`
2. `src/agents/prompts/prp-blueprint-prompt.ts`
3. `src/agents/prompts/bug-hunt-prompt.ts`
4. `src/agents/prompts/delta-analysis-prompt.ts`

**MCP Tools** (3 files):
1. `src/tools/bash-mcp.ts`
2. `src/tools/git-mcp.ts`
3. `src/tools/filesystem-mcp.ts`

### Installation Strategy

**Option 1: npm link (RECOMMENDED)**
```bash
# From groundswell directory
cd ~/projects/groundswell
npm link

# From hacky-hack directory
cd ~/projects/hacky-hack
npm link groundswell
```

**Verification**:
```bash
ls -la node_modules/groundswell  # Should show symlink
npm list groundswell              # Should show linked version
npm run typecheck                 # Should compile without errors
```

**Option 2: Package Reference**
```json
{
  "dependencies": {
    "groundswell": "file:../groundswell"
  }
}
```

**Option 3: Development Dependency**
```bash
npm install ~/projects/groundswell --save-dev
```

---

## Development Dependencies

### TypeScript & Build Tools

**TypeScript**: 5.7.3
- Target: ES2022
- Module: ESNext
- Strict mode enabled

**tsx**: ^4.19.2
- TypeScript execution layer
- Used for development and testing

**Vitest**: 1.6.1
- Test framework
- Coverage provider: v8
- Environment: Node

**ESLint**: ^9.18.0
- Linter for code quality
- TypeScript plugin: @typescript-eslint/eslint-plugin

### npm Scripts Configuration

**Current Scripts** (from package.json):
```json
{
  "dev": "tsx watch src/index.ts",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:run": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "lint": "eslint src tests --ext .ts"
}
```

**Required Updates** (Memory Issues):
```json
{
  "test": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest",
  "test:run": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest run",
  "test:watch": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest",
  "test:coverage": "NODE_OPTIONS=\"--max-old-space-size=4096\" vitest run --coverage"
}
```

---

## Runtime Dependencies

### Core Libraries

**Pino**: ^9.6.0
- Structured logging
- Pretty-print transport for development
- Used by: `src/utils/logger.ts`

**Commander**: ^12.1.0
- CLI argument parsing
- Used by: `src/cli/index.ts`

**Other Dependencies**:
- Various utilities for file operations, validation, etc.

---

## Test Dependencies

### Vitest Ecosystem

**@vitest/coverage-v8**: ^1.6.1
- Coverage provider
- 100% coverage threshold required

**Test Helpers**:
- `vi` from vitest for mocking
- `beforeEach`, `afterEach` for setup/teardown
- Fake timers for time-based tests

### Test Utilities

**Factory Functions**:
- `createTestBacklog()` - Test data creation
- `createMockSession()` - Session mocking
- `createTestPRP()` - PRP document mocking

**Mock Patterns**:
- `vi.mock()` for module mocking
- `vi.fn()` for function spying
- `vi.clearAllMocks()` for cleanup

---

## Environment Constraints

### Node.js Requirements

**Minimum Version**: v20.0.0
**Tested Version**: v25.2.1
**Architecture**: Linux/macOS/Windows

### Memory Requirements

**Default**: 512MB - 2GB (Node.js default)
**Required**: 4GB (due to test suite size)
**Recommended**: 8GB (for development comfort)

### File System

**Working Directory**: Must be within a git repository
**Temp Directory**: Used for test file operations
**Plan Output**: `plan/` directory structure

---

## Platform-Specific Considerations

### Linux
- Resource monitoring: Full support (file handles, memory)
- Groundswell link: Standard npm link works

### macOS
- Resource monitoring: Full support
- Groundswell link: Standard npm link works

### Windows
- Resource monitoring: Limited support (file handle monitoring may not work)
- Groundswell link: May require administrator privileges

---

## Git Integration

### Repository State
- **Current Branch**: (detected dynamically)
- **Working Tree**: Clean state required for some operations
- **Base Branch**: Usually `main` or `master`

### Git Operations
- **Diff Generation**: `git diff` for delta analysis
- **Status Checking**: `git status` for repository state
- **Commit Reading**: `git log` for commit history

---

## External Services

### MCP (Model Context Protocol) Servers

**Bash MCP Server**:
- Protocol: stdio
- Purpose: Execute shell commands
- Tool Wrapper: `src/tools/bash-mcp.ts`

**Git MCP Server**:
- Protocol: stdio
- Purpose: Execute git operations
- Tool Wrapper: `src/tools/git-mcp.ts`

**Filesystem MCP Server**:
- Protocol: stdio
- Purpose: File system operations
- Tool Wrapper: `src/tools/filesystem-mcp.ts`

### MCP Handler Pattern
```typescript
import { MCPHandler } from 'groundswell';

const handler = new MCPHandler({
  name: 'bash',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-bash']
});
```

---

## Configuration Files

### TypeScript Configuration
**File**: `tsconfig.json`
- Strict mode enabled
- Path aliases: `@/`, `#/`
- Module resolution: Node

### Vitest Configuration
**File**: `vitest.config.ts`
- Environment: Node
- Coverage: 100% threshold
- Aliases: `groundswell` → `../groundswell/dist/index.js`

### ESLint Configuration
**File**: `eslint.config.js`
- TypeScript parser
- Strict boolean expressions: warn
- No console: warn (except warn/error)

---

## Dependency Version Constraints

### Critical Versions
- **Node.js**: >= v20.0.0
- **TypeScript**: ^5.7.3
- **Vitest**: ^1.6.1

### Compatible Versions
- **tsx**: ^4.19.2
- **Pino**: ^9.6.0
- **Commander**: ^12.1.0

### Breaking Changes to Monitor
- **Groundswell**: Local library - version must match API surface
- **Vitest**: Major version changes may affect test configuration
- **TypeScript**: Version changes may affect type checking

---

## Installation & Setup Instructions

### Initial Setup
```bash
# Clone repository (if not already done)
git clone <repository-url>
cd hacky-hack

# Install npm dependencies
npm install

# Link Groundswell (CRITICAL)
cd ~/projects/groundswell && npm link
cd ~/projects/hacky-hack && npm link groundswell

# Verify installation
npm run typecheck  # Should pass with no errors
npm run test:run   # Should run all tests
```

### Development Workflow
```bash
# Start development server
npm run dev -- --prd PRD.md --validate-prd

# Run tests
npm run test:run

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Troubleshooting

**Issue**: Cannot find module 'groundswell'
- **Solution**: Run `npm link groundswell` from groundswell directory first

**Issue**: Worker terminated due to memory limit
- **Solution**: Add `NODE_OPTIONS="--max-old-space-size=4096"` to test scripts

**Issue**: TypeScript compilation fails
- **Solution**: Ensure groundswell is linked and dist/index.js exists

---

## Security Considerations

### Dependency Sources
- **npm registry**: Public packages
- **Local development**: Groundswell from trusted source

### Sensitive Data
- **Logging**: Pino redacts sensitive information
- **Git operations**: No credentials stored
- **File operations**: Respect .gitignore

### Code Execution
- **MCP servers**: Execute commands in user environment
- **Bash commands**: Run with current user permissions
- **File operations**: Respect file system permissions

---

## Performance Considerations

### Memory Usage
- **Test suite**: Requires 4GB+ due to 1688 tests
- **Development**: 2GB recommended
- **Production**: 512MB - 1GB (no tests)

### CPU Usage
- **TypeScript compilation**: Moderate (single-threaded)
- **Test execution**: High (parallel workers)
- **Development server**: Low (watch mode)

### I/O Operations
- **File reading**: Lazy loading for large PRDs
- **Test file operations**: Temp directory usage
- **Git operations**: Spawns git processes

---

## Future Dependency Updates

### Planned Updates
- **Groundswell**: Monitor for API changes
- **Vitest**: Update to v2 when stable
- **TypeScript**: Follow latest stable releases

### Deprecated Dependencies
- None currently identified

### Alternative Libraries
- **Logging**: Pino (current) - alternatives: Winston, Bunyan
- **Testing**: Vitest (current) - alternatives: Jest, Mocha
- **Validation**: Custom implementation - alternatives: Zod, Joi

---

## Dependency Health Monitoring

### Indicators to Monitor
- **npm audit**: Run weekly
- **Outdated packages**: Run `npm outdated` monthly
- **Security advisories**: Subscribe to npm security alerts

### Maintenance Tasks
- **Weekly**: Update devDependencies (test compatibility)
- **Monthly**: Review dependency changelogs
- **Quarterly**: Major version updates with testing

---

## Integration Testing

### Groundswell Integration Tests
```bash
# After linking groundswell
npm run test:run -- tests/integration/

# Verify workflow execution
npm run dev -- --prd PRD.md --validate-prd
```

### MCP Integration Tests
```bash
# Test MCP tool connectivity
npm run test:run -- tests/integration/mcp/

# Verify tool execution
npm run dev -- --prd PRD.md --help
```

---

## Documentation References

**Groundswell Documentation**: `~/projects/groundswell/README.md`
**Vitest Documentation**: https://vitest.dev
**TypeScript Documentation**: https://www.typescriptlang.org/docs
**Pino Documentation**: https://getpino.io
