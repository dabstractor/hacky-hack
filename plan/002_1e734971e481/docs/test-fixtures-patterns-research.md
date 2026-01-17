# Session Manager Test Patterns and Fixtures Research

## 1. Existing Test Patterns for loadSession()

### From `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts`

#### Setup/Execute/Verify Pattern

All loadSession tests follow this pattern:

```typescript
describe('loadSession', () => {
  beforeEach(() => {
    mockStatSync.mockReturnValue({ isFile: () => true });
  });

  it('should...', async () => {
    // SETUP: Configure all mocks
    mockReadTasksJSON.mockResolvedValue(testData);
    mockReadFile.mockResolvedValue(prdContent);
    mockStat.mockResolvedValue({ mtime: new Date() });

    // EXECUTE: Call the method
    const manager = new SessionManager('/test/PRD.md');
    const session = await manager.loadSession('/plan/001_14b9dc2a33c7');

    // VERIFY: Check expectations
    expect(mockReadTasksJSON).toHaveBeenCalledWith('/plan/001_14b9dc2a33c7');
    expect(session.taskRegistry.backlog).toHaveLength(1);
  });
});
```

#### Key loadSession Test Patterns:

1. **JSON Reading Test Pattern**

   ```typescript
   it('should read tasks.json using readTasksJSON()', async () => {
     const testBacklog = createTestBacklog([
       createTestPhase('P1', 'Phase 1', 'Planned'),
     ]);
     mockReadTasksJSON.mockResolvedValue(testBacklog);
     // ... execute and verify
   });
   ```

2. **PRD Snapshot Reading Test Pattern**

   ```typescript
   it('should read prd_snapshot.md from session directory', async () => {
     mockReadTasksJSON.mockResolvedValue({ backlog: [] });
     mockReadFile.mockResolvedValue(prdContent);
     // ... execute and verify
   });
   ```

3. **Metadata Parsing Test Pattern**

   ```typescript
   it('should parse metadata from directory name', async () => {
     // ... setup
     const session = await manager.loadSession('/plan/001_14b9dc2a33c7');
     expect(session.metadata.id).toBe('001_14b9dc2a33c7');
     expect(session.metadata.hash).toBe('14b9dc2a33c7');
   });
   ```

4. **Parent Session Loading Test Pattern**

   ```typescript
   it('should check for parent_session.txt file', async () => {
     mockReadFile
       .mockResolvedValueOnce('# PRD')
       .mockResolvedValueOnce('000_parenthash'); // parent_session.txt
     // ... execute
     expect(session.metadata.parentSession).toBe('000_parenthash');
   });

   it('should set parentSession to null when no parent file exists', async () => {
     const error = new Error('ENOENT') as NodeJS.ErrnoException;
     error.code = 'ENOENT';
     mockReadFile.mockRejectedValueOnce(error);
     // ... execute
     expect(session.metadata.parentSession).toBeNull();
   });
   ```

5. **Filesystem Stat Test Pattern**

   ```typescript
   it('should get directory creation time from stat()', async () => {
     const mtime = new Date('2024-01-15T10:30:00Z');
     mockStat.mockResolvedValue({ mtime });
     // ... execute
     expect(session.metadata.createdAt).toEqual(mtime);
   });
   ```

6. **Complete Hierarchy Restoration Test Pattern**

   ```typescript
   it('should reconstruct complete SessionState from disk', async () => {
     const testBacklog = createTestBacklog([
       createTestPhase('P1', 'Phase 1', 'Planned', [
         createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [
           createTestTask('P1.M1.T1', 'Task 1', 'Planned', [
             createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned'),
           ]),
         ]),
       ]),
     ]);
     // ... execute
     expect(
       session.taskRegistry.backlog[0].milestones[0].tasks[0].subtasks[0].id
     ).toBe('P1.M1.T1.S1');
   });
   ```

7. **Error Propagation Test Pattern**
   ```typescript
   it('should propagate SessionFileError from readTasksJSON()', async () => {
     const error = new SessionFileError(
       '/plan/001_14b9dc2a33c7/tasks.json',
       'read tasks.json'
     );
     mockReadTasksJSON.mockRejectedValue(error);
     // ... execute and verify
     await expect(manager.loadSession(sessionPath)).rejects.toThrow(
       SessionFileError
     );
   });
   ```

## 2. Fixture File Locations and Contents

### Test Fixtures Directory: `/home/dustin/projects/hacky-hack/tests/fixtures/`

#### 1. `/tests/fixtures/simple-prd.ts`

- **Purpose**: Minimal PRD for fast E2E pipeline testing
- **Structure**:
  - 1 Phase: P1 (Test Phase)
  - 1 Milestone: P1.M1 (Test Milestone)
  - 1 Task: P1.M1.T1 (Create Hello World)
  - 3 Subtasks: Write function, Write test, Run test
- **Usage**: Used for rapid validation of pipeline functionality

#### 2. `/tests/fixtures/simple-prd-v2.ts`

- **Purpose**: Modified PRD for delta session E2E testing
- **Changes from v1**:
  - Added P1.M1.T2: Add Calculator Functions (new task with 1 subtask)
  - Modified P1.M1.T1.S1 story_points from 1 to 2
- **Usage**: Testing delta detection and session management

#### 3. `/tests/fixtures/mock-delta-data.ts`

- **Purpose**: Mock data for delta analysis testing (content not shown in research)

### Real tasks.json Fixtures

The project contains actual tasks.json files created by running sessions:

#### 1. `/plan/001_14b9dc2a33c7/tasks.json`

- **Session**: First session with comprehensive project structure
- **Structure**: Complete backlog with phases, milestones, tasks, and subtasks
- **Status**: Most items marked as "Complete"
- **Size**: Large file (25,038 tokens) with detailed implementation scope

#### 2. `/plan/002_1e734971e481/tasks.json`

- **Session**: Second session (delta session)
- **Purpose**: Bootstrap core infrastructure with Groundswell integration
- **Structure**: Similar hierarchical structure but different content

## 3. Test Helper Functions

### Factory Functions from Unit Tests

```typescript
// Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
) => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

const createTestTask = (
  id: string,
  title: string,
  status: Status,
  subtasks: any[] = []
) => ({
  id,
  type: 'Task' as const,
  title,
  status,
  description: 'Test task description',
  subtasks,
});

const createTestMilestone = (
  id: string,
  title: string,
  status: Status,
  tasks: any[] = []
) => ({
  id,
  type: 'Milestone' as const,
  title,
  status,
  description: 'Test milestone description',
  tasks,
});

const createTestPhase = (
  id: string,
  title: string,
  status: Status,
  milestones: any[] = []
) => ({
  id,
  type: 'Phase' as const,
  title,
  status,
  description: 'Test phase description',
  milestones,
});

const createTestBacklog = (phases: any[]): Backlog => ({
  backlog: phases,
});
```

### Integration Test Setup Pattern

```typescript
describe('SessionManager.initialize()', () => {
  let tempDir: string;
  let planDir: string;
  let prdPath: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'session-manager-test-'));
    planDir = join(tempDir, 'plan');
    prdPath = join(tempDir, 'PRD.md');

    // Create initial PRD file
    writeFileSync(
      prdPath,
      '# Test PRD\n\nThis is a test PRD for session creation.'
    );
  });

  afterEach(() => {
    // Cleanup temp directory (force: true ignores ENOENT)
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
```

## 4. Mock Patterns Used

### Mock Setup Pattern

```typescript
// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}));

// Mock the session-utils module
vi.mock('../../../src/core/session-utils.js', () => ({
  hashPRD: vi.fn(),
  createSessionDirectory: vi.fn(),
  readTasksJSON: vi.fn(),
  writeTasksJSON: vi.fn(),
  SessionFileError: class extends Error {
    // ... implementation
  },
}));

// Cast mocked functions
const mockReadFile = readFile as any;
const mockReadTasksJSON = readTasksJSON as any;
```

### Error Mocking Pattern

```typescript
// Mock ENOENT error
const error = new Error('ENOENT: no such file') as NodeJS.ErrnoException;
error.code = 'ENOENT';
mockStatSync.mockImplementation(() => {
  throw error;
});
```

### Multiple Value Mocking Pattern

```typescript
// Mock readFile to return different values
mockReadFile
  .mockResolvedValueOnce('# PRD')
  .mockResolvedValueOnce('000_parenthash'); // parent_session.txt
```

## 5. JSON Parsing with Zod Patterns

### From `/src/core/session-utils.ts`

```typescript
export async function readTasksJSON(sessionPath: string): Promise<Backlog> {
  try {
    const tasksPath = resolve(sessionPath, 'tasks.json');
    const content = await readFile(tasksPath, 'utf-8');
    const parsed = JSON.parse(content);
    return BacklogSchema.parse(parsed);
  } catch (error) {
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'read tasks.json',
      error as Error
    );
  }
}
```

### Key Schema Validation Patterns

1. **BacklogSchema** (top-level validation):

   ```typescript
   export const BacklogSchema: z.ZodType<Backlog> = z.object({
     backlog: z.array(PhaseSchema),
   });
   ```

2. **Hierarchical Schema Pattern** with lazy evaluation:

   ```typescript
   export const PhaseSchema: z.ZodType<Phase> = z.lazy(() =>
     z.object({
       id: z
         .string()
         .regex(/^P\d+$/, 'Invalid phase ID format (expected P{N})'),
       type: z.literal('Phase'),
       // ... other fields
       milestones: z.array(z.lazy(() => MilestoneSchema)),
     })
   );
   ```

3. **Complex Field Validation** (ContextScopeSchema):
   ```typescript
   export const ContextScopeSchema: z.ZodType<string> = z
     .string()
     .min(1, 'Context scope is required')
     .superRefine((value, ctx) => {
       const prefix = 'CONTRACT DEFINITION:\n';
       if (!value.startsWith(prefix)) {
         ctx.addIssue({
           code: z.ZodIssueCode.custom,
           message:
             'context_scope must start with "CONTRACT DEFINITION:" followed by a newline',
         });
         return;
       }
       // Additional validation...
     });
   ```

## 6. Test Helper Functions from Integration Tests

### From Various Integration Test Files

```typescript
// From prp-generator-integration.test.ts
const createTestBacklog = (): Backlog => ({
  backlog: [
    {
      id: 'P3',
      type: 'Phase',
      title: 'Phase 3: PRP Pipeline',
      status: 'Planned',
      // ... complete structure
    },
  ],
});

// From bug-hunt-workflow-integration.test.ts
const createTestTask = (
  id: string,
  title: string,
  description?: string
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Complete',
  description: description ?? `Description for ${title}`,
  subtasks: [],
});
```

## 7. Real Filesystem Test Patterns

### Integration Test Pattern with Real Files

```typescript
it('should create new session with unique PRD hash', async () => {
  // SETUP: PRD created in beforeEach

  // EXECUTE: Initialize session manager
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();

  // VERIFY: Real filesystem operations
  expect(existsSync(planDir)).toBe(true);
  const sessionDirs = readdirSync(planDir).filter(d =>
    /^\d{3}_[a-f0-9]{12}$/.test(d)
  );
  expect(sessionDirs).toHaveLength(1);

  expect(session.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
});
```

### Atomic Write Pattern Testing

The integration tests don't directly test the atomic write pattern, but they verify that:

1. Session directories are created correctly
2. tasks.json files contain valid JSON
3. PRD snapshots are identical to source
4. Hash-based session detection works

## Key Findings for Testing loadSession()

1. **Mock-Driven Unit Tests**: Unit tests completely mock all filesystem operations
2. **Real Filesystem Integration Tests**: Integration tests use actual temp directories and files
3. **Factory Pattern**: Extensive use of factory functions for test data creation
4. **Error Testing**: Comprehensive error propagation testing for all failure modes
5. **Schema Validation**: Zod schemas are tested indirectly through readTasksJSON calls
6. **Hierarchical Structure**: Tests validate complete task hierarchy restoration
7. **Metadata Parsing**: Tests for directory name parsing and file-based metadata
8. **Parent Session Handling**: Tests for parent_session.txt file reading and error handling

## Recommended Test Patterns for New Tests

1. **Follow the Setup/Execute/Verify pattern**
2. **Use factory functions for test data creation**
3. **Mock all external dependencies (fs, session-utils)**
4. **Test both success and error cases**
5. **Verify complete object structure, not just shallow properties**
6. **Use integration tests to validate real filesystem behavior**
7. **Include tests for edge cases (ENOENT, invalid JSON, malformed data)**
