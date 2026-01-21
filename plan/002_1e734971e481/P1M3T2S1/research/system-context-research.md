# System Context Documentation Research

## File Location

**Absolute Path:** `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/system_context.md`

## Section 6.3: Session State (Lines 325-343)

```markdown
### 6.3 Session State

**Session Directory Structure:**
```

plan/
{sequence}\_{hash}/
tasks.json # Single source of truth
prd_snapshot.md # PRD snapshot
delta_from.txt # Link to previous session (if delta)
delta_prd.md # Delta PRD (if delta session)
bug_hunt_tasks.json # Bug fix pipeline state
TEST_RESULTS.md # Bug report
architecture/ # Architectural research
docs/ # Implementation documentation
prp/ # Product Requirement Prompts
{task_id}/
PRP.md # Implementation contract
research/ # Research materials

```

```

## Section 6.4: Protected Files (Lines 345-354)

```markdown
### 6.4 Protected Files

**NEVER DELETE:**

- `tasks.json` - Pipeline state
- `bug_hunt_tasks.json` - Bug fix state
- `prd_snapshot.md` - PRD snapshot
- `delta_from.txt` - Delta linkage
- `PRD.md` - Product requirements (project root)
- `TEST_RESULTS.md` - Bug report
```

## Serialization Requirements

### Single Source of Truth

- `tasks.json` contains the complete task hierarchy state
- Session Isolation: Each session has its own directory with unique `{sequence}_{hash}` identifier
- Delta Sessions: Linked via `delta_from.txt` containing path to previous session
- Immutable Snapshots: PRD snapshots preserve requirements at session creation time

### Session Persistence Patterns

1. **Atomic Updates:** Session Manager uses batch updates
2. **Delta Workflow:** New sessions link to previous sessions for change tracking
3. **State Preservation:** All protected files must be preserved across pipeline operations
4. **Task-Based Organization:** PRPs organized by task_id for granular state management

### Constraints on File Operations

1. **Protected Files:** MUST NEVER be deleted during pipeline operations
2. **Single Source of Truth:** tasks.json is authoritative for pipeline state
3. **Session Linkage:** delta_from.txt must be preserved for delta session chains
4. **Immutable Artifacts:** PRD snapshots and test results are permanent records

## Task Hierarchy Structure

**From Section 6.1:** Defines the four-level structure stored in tasks.json:

- Phase → Milestone → Task → Subtask

**From Section 6.2:** Defines status values for tasks:

- 'Planned', 'Researching', 'Ready', 'Implementing', 'Complete', 'Failed', 'Obsolete'
