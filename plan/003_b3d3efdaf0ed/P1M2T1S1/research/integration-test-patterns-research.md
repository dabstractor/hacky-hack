# Integration Test Patterns Research Report

## Summary

Comprehensive research on existing integration test patterns in the codebase to inform the creation of `tests/integration/tasks-json-authority.test.ts`.

## 1. Testing Framework and Structure

### Vitest Framework

The codebase uses **Vitest** as the testing framework:

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
```

### Test File Pattern

```typescript
/**
 * Integration tests for [Feature Name]
 *
 * @remarks
 * [Description of what tests validate]
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 * @see {@link ../../src/core/session-manager.ts | Implementation Reference}
 */

describe('Feature Name', () => {
  let tempDir: string;

  beforeEach(() => {
    // Setup temporary directory and test data
    tempDir = mkdtempSync(join(tmpdir(), 'test-prefix-'));
  });

  afterEach(() => {
    // Cleanup temp directory
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('should perform specific behavior', async () => {
    // SETUP: Arrange test conditions
    // EXECUTE: Call the function being tested
    // VERIFY: Assert expected outcomes
  });
});
```

## 2. Test Fixtures and Helper Patterns

### File: `tests/integration/core/session-structure.test.ts`

#### Helper Function to Create Test PRD Content

```typescript
function generateValidPRD(uniqueSuffix: string): string {
  return `# Test Project ${uniqueSuffix}

A minimal project for session structure testing.

## P1: Test Phase

Validate session directory structure and naming conventions.

### P1.M1: Test Milestone

Create session structure validation tests.

#### P1.M1.T1: Create Session Tests

Implement integration tests for session management.

##### P1.M1.T1.S1: Write Session Structure Tests

Create tests for session directory structure validation.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Session structure validation ${uniqueSuffix}
2. INPUT: SessionManager implementation
3. LOGIC: Create integration tests validating session directory structure
4. OUTPUT: Passing integration tests for session structure
`;
}
```

#### Helper to Create Minimal Backlog

```typescript
function createMinimalBacklog(): Backlog {
  return {
    backlog: [
      {
        type: 'Phase',
        id: 'P1',
        title: 'Test Phase',
        status: 'Planned',
        description: 'Test phase description',
        milestones: [
          {
            type: 'Milestone',
            id: 'P1.M1',
            title: 'Test Milestone',
            status: 'Planned',
            description: 'Test milestone description',
            tasks: [
              {
                type: 'Task',
                id: 'P1.M1.T1',
                title: 'Test Task',
                status: 'Planned',
                description: 'Test task description',
                subtasks: [
                  {
                    type: 'Subtask',
                    id: 'P1.M1.T1.S1',
                    title: 'Test Subtask',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope:
                      'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: None\n3. LOGIC: None\n4. OUTPUT: None',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
```

## 3. File System Testing Patterns

### Pattern 1: Temporary Directory Setup

```typescript
describe('Feature Name', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'unique-test-prefix-'));
    planDir = join(tempDir, 'plan');
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
```

### Pattern 2: File State Verification

```typescript
// Check file existence
expect(existsSync(filePath)).toBe(true);

// Read and verify file content
const content = readFileSync(filePath, 'utf-8');
expect(content).toContain('expected text');

// Verify file permissions
const stats = statSync(filePath);
expect(stats.mode).toBe(0o644); // Files should have rw-r--r--
```

### Pattern 3: Directory Verification

```typescript
// Verify subdirectories exist
const requiredSubdirs = ['architecture', 'prps', 'artifacts'];
for (const subdir of requiredSubdirs) {
  const subdirPath = join(sessionPath, subdir);
  expect(existsSync(subdirPath)).toBe(true);

  // Verify it's actually a directory
  const stats = statSync(subdirPath);
  expect(stats.isDirectory()).toBe(true);
}
```

## 4. State Management Testing Patterns

### From `tests/integration/core/session-structure.test.ts`

#### State Verification Pattern

```typescript
it('should create tasks.json when backlog is saved', async () => {
  // SETUP: Create session and save backlog
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, generateValidPRD('test-tasks'));
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();
  const sessionPath = session.metadata.path;

  // EXECUTE: Save backlog (this creates tasks.json)
  const backlog = createMinimalBacklog();
  await manager.saveBacklog(backlog);

  // VERIFY: tasks.json exists and contains valid JSON
  const tasksPath = join(sessionPath, 'tasks.json');
  expect(existsSync(tasksPath)).toBe(true);
  const tasksContent = readFileSync(tasksPath, 'utf-8');
  const tasksData = JSON.parse(tasksContent) as Backlog;
  expect(tasksData).toHaveProperty('backlog');
  expect(Array.isArray(tasksData.backlog)).toBe(true);
  expect(tasksData.backlog).toHaveLength(1);
  expect(tasksData.backlog[0].id).toBe('P1');
});
```

## 5. Authority Testing Patterns for tasks.json

### Test File Creation and Content

```typescript
it('should create tasks.json with correct authority structure', async () => {
  // SETUP: Create session with PRD
  createTestPRD(prdPath, testPRDContent);

  // EXECUTE: Initialize session
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();

  // VERIFY: tasks.json exists with correct structure
  const tasksPath = join(session.metadata.path, 'tasks.json');
  expect(existsSync(tasksPath)).toBe(true);

  // VERIFY: JSON content validates against schema
  const tasksContent = readFileSync(tasksPath, 'utf-8');
  const tasksData = JSON.parse(tasksContent);
  expect(tasksData).toHaveProperty('backlog');
  expect(Array.isArray(tasksData.backlog)).toBe(true);
});
```

### Authority Verification Pattern

```typescript
it('should enforce tasks.json authority patterns', () => {
  // Test file permissions (0o644)
  const stats = statSync(tasksPath);
  expect(stats.mode & 0o644).toBe(0o644);

  // Test content authority (valid JSON structure)
  const tasks = JSON.parse(readFileSync(tasksPath, 'utf-8'));
  const task = tasks.backlog[0];
  expect(task.type).toBe('Phase');
});
```

### State Authority Pattern

```typescript
it('should maintain state authority through updates', async () => {
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();

  // Test atomic updates
  await manager.updateItemStatus('P1.M1.T1.S1', 'Complete');

  // Flush updates to persist
  await manager.flushUpdates();

  // Verify state persisted atomically
  const reloaded = await manager.loadBacklog();
  const item = findItem(reloaded, 'P1.M1.T1.S1');
  expect(item?.status).toBe('Complete');
});
```

## 6. Error Handling and Edge Cases

```typescript
it('should handle authority violations gracefully', async () => {
  // Test file permission errors
  // Test corrupted JSON scenarios
  // Test concurrent access patterns
  // Test rollback mechanisms
});
```

## 7. Test Organization Structure

Based on existing test patterns, organize tests into logical suites:

```typescript
// tasks-json-authority.test.ts structure:
describe('integration/tasks-json-authority > tasks.json authority enforcement', () => {
  // File creation and structure tests
  describe('tasks.json file authority', () => { ... });

  // Content validation tests
  describe('tasks.json content authority', () => { ... });

  // State transition tests
  describe('state update authority', () => { ... });

  // Error handling tests
  describe('authority violation handling', () => { ... });

  // Schema validation tests
  describe('schema validation enforcement', () => { ... });

  // Cleanup and temp file tests
  describe('temp file cleanup', () => { ... });
});
```

## 8. Key File Paths to Reference

### Implementation Files

- **Session Manager**: `/src/core/session-manager.ts`
- **Session Utils**: `/src/core/session-utils.ts`
- **Models**: `/src/core/models.ts`
- **Task Utils**: `/src/core/task-utils.ts`

### Test Reference Files

- **Session Structure Test**: `/tests/integration/core/session-structure.test.ts`
- **Session Manager Test**: `/tests/integration/core/session-manager.test.ts`
- **Delta Session Test**: `/tests/integration/core/delta-session.test.ts`

## 9. SETUP/EXECUTE/VERIFY Pattern

From `tests/integration/core/session-structure.test.ts`:

```typescript
it('should compute SHA-256 hash and use first 12 characters', async () => {
  // SETUP: Create PRD with known content
  const prdPath = join(tempDir, 'PRD.md');
  const prdContent = generateValidPRD('test-hash');
  writeFileSync(prdPath, prdContent);

  // COMPUTE: Expected hash
  const fullHash = createHash('sha256').update(prdContent).digest('hex');
  const expectedHash = fullHash.slice(0, 12);

  // EXECUTE: Initialize session
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();

  // VERIFY: Hash matches expected (first 12 chars of SHA-256)
  expect(session.metadata.hash).toBe(expectedHash);
  expect(session.metadata.hash).toHaveLength(12);
  expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
});
```

## 10. Atomic Write Pattern Testing

From `tests/integration/core/session-structure.test.ts`:

```typescript
it('should use atomic write pattern for tasks.json', async () => {
  // SETUP: Create session
  const prdPath = join(tempDir, 'PRD.md');
  writeFileSync(prdPath, generateValidPRD('test-atomic'));
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();
  const sessionPath = session.metadata.path;

  // EXECUTE: Save backlog (this uses atomic write internally)
  const backlog = createMinimalBacklog();
  await manager.saveBacklog(backlog);

  // VERIFY: tasks.json exists (atomic write completed successfully)
  const tasksPath = join(sessionPath, 'tasks.json');
  expect(existsSync(tasksPath)).toBe(true);

  // VERIFY: tasks.json contains correct data
  const tasksContent = readFileSync(tasksPath, 'utf-8');
  const tasksData = JSON.parse(tasksContent) as Backlog;
  expect(tasksData.backlog).toHaveLength(1);
  expect(tasksData.backlog[0].id).toBe('P1');
});
```

## 11. Mocking Strategy

### Unit Tests (Mocked)

```typescript
vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
});

const mockReadFile = vi.mocked(readFile);
mockReadFile.mockResolvedValue(Buffer.from('content'));
```

### Integration Tests (Real FS)

```typescript
it('should handle real file operations', async () => {
  const testFile = join(tempDir, 'test.txt');
  writeFileSync(testFile, 'content');

  const result = await myFunction(testFile);
  expect(result).toBeDefined();
});
```

## 12. Test Isolation

- Use unique temp directories per test
- Clean up even on test failure
- Use `beforeEach`/`afterEach` hooks
- Clear mocks between tests

```typescript
beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'unique-test-prefix-'));
});

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
  vi.clearAllMocks();
});
```
