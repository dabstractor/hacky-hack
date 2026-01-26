# State Management and Persistence Analysis

## Session Directory Structure

### Naming Convention

**Pattern**: `{sequence}_{hash}/`

- **Sequence**: 3-digit zero-padded (001, 002, 003)
- **Hash**: First 12 chars of SHA-256

### Example Sessions

```
plan/
├── 001_14b9dc2a33c7/    # Initial session
├── 002_1e734971e481/    # Delta from 001
└── 003_b3d3efdaf0ed/    # Delta from 002
```

### Required Files Per Session

- `tasks.json` - Complete task hierarchy
- `prd_snapshot.md` - PRD at session start
- `delta_prd.md` - Changes summary (delta only)
- `delta_from.txt` - Parent reference (delta only)
- `prps/` - Generated PRP documents
- `artifacts/` - Execution artifacts

## tasks.json Structure

### 4-Level Hierarchy

```json
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P1",
      "title": "Phase title",
      "status": "Complete",
      "description": "Phase description",
      "milestones": [
        {
          "type": "Milestone",
          "id": "P1.M1",
          "title": "Milestone title",
          "status": "Complete",
          "tasks": [
            {
              "type": "Task",
              "id": "P1.M1.T1",
              "title": "Task title",
              "status": "Complete",
              "subtasks": [
                {
                  "type": "Subtask",
                  "id": "P1.M1.T1.S1",
                  "title": "Subtask title",
                  "status": "Complete",
                  "story_points": 3,
                  "dependencies": ["P1.M1.T1.S1"],
                  "context_scope": "CONTRACT DEFINITION:\n..."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Key Features

- Immutable readonly properties
- Status tracking at all levels
- Dependency management
- Contract format for subtasks

## PRD Hash-Based Change Detection

### Hash Computation

```typescript
const crypto = require('crypto');
const hash = crypto
  .createHash('sha256')
  .update(prdContent)
  .digest('hex')
  .substring(0, 12);
```

### Change Detection

- Hash change → New delta session
- No hash change → Resume existing
- Case-sensitive, deterministic

## Delta Session Creation

### Delta Session Workflow

1. Detect PRD changes (hash comparison)
2. Create new delta session
3. Compute PRD diff
4. Generate delta_prd.md
5. Write delta_from.txt

### Linkage Mechanism

- `delta_from.txt` contains parent path
- Example: `plan/002_1e734971e481`
- Enables change impact analysis

## State Persistence Patterns

### File System Operations

- Atomic writes (temp + rename)
- Custom SessionFileError
- JSON schema validation

### Persistence Hierarchy

1. **Session metadata** - Hash, sequence, timestamps
2. **Task hierarchy** - Complete JSON with status
3. **PRD snapshots** - Historical versions
4. **Delta tracking** - Change documentation
5. **Artifacts** - Generated documents

### Key Utilities

- `hashPRD()` - Compute PRD hash
- `createSessionDirectory()` - Create directories
- `readTasksJSON()` - Load hierarchy
- `writeTasksJSON()` - Save with atomic writes

## State Recovery

### Capabilities

- Resume from any point
- Delta sessions minimize re-execution
- Protected files prevent overwrites
- Session history provides audit trail

### Protected Files

- `tasks.json` - NEVER DELETE
- `prd_snapshot.md` - NEVER DELETE
- `delta_from.txt` - NEVER DELETE (if exists)
- `PRD.md` - NEVER DELETE
