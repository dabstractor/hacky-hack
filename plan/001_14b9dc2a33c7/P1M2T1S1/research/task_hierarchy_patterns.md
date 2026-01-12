# Task Hierarchy Design Patterns Research

**Research Date:** 2026-01-12
**Researcher:** Claude Code Agent
**Purpose:** Investigate Phase > Milestone > Task > Subtask hierarchy patterns in open source project management systems

---

## Table of Contents

1. [Hierarchy Patterns Overview](#hierarchy-patterns-overview)
2. [Status Enum Patterns](#status-enum-patterns)
3. [Dependency Tracking Patterns](#dependency-tracking-patterns)
4. [Story Points & Estimation Patterns](#story-points--estimation-patterns)
5. [Open Source Repositories](#open-source-repositories)
6. [Code Pattern Examples](#code-pattern-examples)

---

## Hierarchy Patterns Overview

### Common Hierarchy Models

#### 1. Linear Hierarchy (Most Common)
```
Project/Epic
  └── Phase/Sprint
      └── Milestone
          └── Task/Story
              └── Subtask
                  └── Checklist Item
```

#### 2. Agile Hierarchy (Scrum/Kanban)
```
Project
  └── Epic
      └── User Story
          └── Task
              └── Subtask
```

#### 3. Phase-Based Hierarchy (Waterfall/Hybrid)
```
Project
  └── Phase (Planning, Execution, Delivery)
      └── Milestone
          └── Deliverable
              └── Task
                  └── Subtask
```

### Data Modeling Approaches

#### Adjacency List Model (Simple)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES tasks(id),
  title VARCHAR(255),
  -- other fields
);
```

**Pros:** Simple, flexible, easy to insert
**Cons:** Recursive queries for hierarchies, harder to enforce depth

#### Closure Table Model (Performance)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255)
);

CREATE TABLE task_closure (
  ancestor_id UUID REFERENCES tasks(id),
  descendant_id UUID REFERENCES tasks(id),
  depth INTEGER,
  PRIMARY KEY (ancestor_id, descendant_id)
);
```

**Pros:** Fast hierarchical queries, easy to get subtrees
**Cons:** More complex writes, extra storage

#### Nested Set Model (Read-Heavy)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  left INTEGER,
  right INTEGER,
  title VARCHAR(255)
);
```

**Pros:** Very fast reads, easy subtree queries
**Cons:** Complex writes, locking issues

#### Materialized Path (Hybrid)
```typescript
interface Task {
  id: string;
  path: string; // e.g., "/project-id/phase-id/milestone-id/task-id"
  level: number;
  title: string;
}
```

**Pros:** Simple queries, good read performance, easy ordering
**Cons:** Path updates on moves, fixed length considerations

---

## Status Enum Patterns

### Pattern 1: Basic Kanban (4 States)
```typescript
enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}
```

**Used by:** Simple Kanban boards, personal task managers

### Pattern 2: GitHub-Style (5 States)
```typescript
enum TaskStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  CLOSED = 'closed'
}
```

**Used by:** GitHub Issues, GitLab Issues

### Pattern 3: Extended Workflow (8 States)
```typescript
enum TaskStatus {
  BACKLOG = 'backlog',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}
```

**Used by:** Jira, Azure DevOps, complex project management tools

### Pattern 4: Full Lifecycle (10+ States)
```typescript
enum TaskStatus {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  BACKLOG = 'backlog',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  QA = 'qa',
  COMPLETED = 'completed',
  DEPLOYED = 'deployed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}
```

**Used by:** Enterprise systems, formal project management environments

### Pattern 5: State Machine Pattern (with transitions)
```typescript
enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  BLOCKED = 'blocked'
}

interface StatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  condition?: () => boolean;
}

const validTransitions: StatusTransition[] = [
  { from: TaskStatus.TODO, to: TaskStatus.IN_PROGRESS },
  { from: TaskStatus.TODO, to: TaskStatus.BLOCKED },
  { from: TaskStatus.IN_PROGRESS, to: TaskStatus.IN_REVIEW },
  { from: TaskStatus.IN_PROGRESS, to: TaskStatus.BLOCKED },
  { from: TaskStatus.IN_REVIEW, to: TaskStatus.DONE },
  { from: TaskStatus.IN_REVIEW, to: TaskStatus.IN_PROGRESS },
  { from: TaskStatus.BLOCKED, to: TaskStatus.TODO },
  { from: TaskStatus.BLOCKED, to: TaskStatus.IN_PROGRESS },
  { from: TaskStatus.DONE, to: TaskStatus.IN_PROGRESS } // Reopen
];
```

**Used by:** Systems requiring workflow validation, enterprise applications

### Status Metadata Pattern
```typescript
interface TaskStatusWithMetadata {
  status: TaskStatus;
  category: 'active' | 'inactive' | 'terminal';
  color: string;
  order: number;
  transitions: TaskStatus[];
}

const statusConfig: Record<TaskStatus, TaskStatusWithMetadata> = {
  [TaskStatus.TODO]: {
    status: TaskStatus.TODO,
    category: 'active',
    color: '#E3E4E6',
    order: 1,
    transitions: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED]
  },
  // ... more statuses
};
```

---

## Dependency Tracking Patterns

### Pattern 1: Simple Parent-Child (Hierarchy)
```typescript
interface Task {
  id: string;
  parentId?: string;
  parent?: Task;
  children: Task[];
}
```

### Pattern 2: Blocking/Blocked By (Predecessor-Successor)
```typescript
interface Task {
  id: string;
  blockedBy: Task[];      // Tasks that must complete first
  blocking: Task[];        // Tasks waiting on this one
}

interface TaskDependency {
  predecessorId: string;
  successorId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag?: number; // days/minutes
}
```

### Pattern 3: Related Links (General Relationships)
```typescript
enum DependencyType {
  BLOCKED_BY = 'blocked_by',
  BLOCKING = 'blocking',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
  IS_DUPLICATED_BY = 'is_duplicated_by',
  DEPENDS_ON = 'depends_on',
  CHILD_OF = 'child_of',
  PARENT_OF = 'parent_of'
}

interface TaskLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: DependencyType;
  createdAt: Date;
  createdBy: string;
}
```

### Pattern 4: Dependency Graph (Directed Acyclic Graph)
```typescript
interface TaskNode {
  id: string;
  dependencies: string[];  // Array of task IDs
  dependents: string[];    // Array of task IDs
}

class DependencyGraph {
  private nodes: Map<string, TaskNode>;

  addDependency(taskId: string, dependsOnId: string): void {
    // Check for cycles
    if (this.wouldCreateCycle(taskId, dependsOnId)) {
      throw new Error('Cannot add dependency: would create a cycle');
    }
    // Add dependency
  }

  private wouldCreateCycle(from: string, to: string): boolean {
    // DFS or Union-Find to detect cycles
  }

  getCriticalPath(): string[] {
    // Calculate longest path through DAG
  }

  getTasksReadyToStart(): string[] {
    // Return tasks with all dependencies satisfied
  }
}
```

### Pattern 5: Database Schema for Dependencies
```sql
-- Simple junction table
CREATE TABLE task_dependencies (
  predecessor_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  successor_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (predecessor_id, successor_id),
  CHECK (predecessor_id != successor_id)
);

-- With metadata
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  successor_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) NOT NULL,
  lag_hours INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(predecessor_id, successor_id)
);

-- Indexes for performance
CREATE INDEX idx_task_deps_pred ON task_dependencies(predecessor_id);
CREATE INDEX idx_task_deps_succ ON task_dependencies(successor_id);
```

### Cycle Detection Algorithms

#### Topological Sort (Kahn's Algorithm)
```typescript
function detectCycles(graph: Map<string, string[]>): string[] | null {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  const visited: string[] = [];

  // Calculate in-degrees
  for (const [node, deps] of graph.entries()) {
    inDegree.set(node, 0);
  }
  for (const [node, deps] of graph.entries()) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }

  // Find nodes with no incoming edges
  for (const [node, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(node);
  }

  // Process nodes
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited.push(node);

    for (const neighbor of (graph.get(node) || [])) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // If not all nodes visited, cycle exists
  return visited.length === graph.size ? null : visited;
}
```

---

## Story Points & Estimation Patterns

### Pattern 1: Fibonacci Sequence
```typescript
enum StoryPoints {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FIVE = 5,
  EIGHT = 8,
  THIRTEEN = 13,
  TWENTY_ONE = 21,
  THIRTY_FOUR = 34,
  ONE_HUNDRED = 100 // Epic/unknown large tasks
}
```

**Rationale:** Reflects increasing uncertainty in larger estimates

### Pattern 2: Powers of Two
```typescript
enum StoryPoints {
  ONE = 1,
  TWO = 2,
  FOUR = 4,
  EIGHT = 8,
  SIXTEEN = 16,
  THIRTY_TWO = 32
}
```

**Rationale:** Simpler than Fibonacci, still exponential

### Pattern 3: T-Shirt Sizing
```typescript
enum TShirtSize {
  EXTRA_SMALL = 'xs', // < 2 hours
  SMALL = 's',        // 2-4 hours
  MEDIUM = 'm',       // 4-8 hours
  LARGE = 'l',        // 1-2 days
  EXTRA_LARGE = 'xl', // 2-3 days
  DOUBLE_XL = 'xxl'   // > 3 days (break down)
}

interface SizeMapping {
  size: TShirtSize;
  hoursRange: [number, number];
  storyPoints?: number;
}
```

### Pattern 4: Time-Based Estimation
```typescript
interface TimeEstimate {
  minutes?: number;
  hours?: number;
  days?: number;
  weeks?: number;
}

interface TaskWithEstimate {
  id: string;
  estimate: TimeEstimate;
  confidence: 'low' | 'medium' | 'high';
}

// Or using a single unit
interface TaskEstimate {
  id: string;
  estimatedMinutes: number;
  bestCase: number;
  likelyCase: number;
  worstCase: number;
  // PERT formula: (best + 4*likely + worst) / 6
}
```

### Pattern 5: Velocity Tracking
```typescript
interface SprintEstimate {
  sprintId: string;
  totalStoryPoints: number;
  totalHours: number;
  completedStoryPoints: number;
  completedHours: number;
  velocity: number;
  efficiency: number; // actual / estimated
}

interface TeamVelocity {
  teamId: string;
  historicalVelocities: SprintEstimate[];
  averageVelocity: number;
  predictedCapacity: number;
}
```

### Pattern 6: Complex Estimation with Uncertainty
```typescript
interface Estimation {
  storyPoints?: number;
  timeEstimate?: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  uncertainty: 'low' | 'medium' | 'high';
  size?: TShirtSize;
  tags: string[]; // e.g., 'research', 'spike', 'technical-debt'
}

// PERT calculation
function calculatePERT(est: TimeEstimate): number {
  return (est.optimistic + 4 * est.realistic + est.pessimistic) / 6;
}
```

### Pattern 7: Database Schema for Estimations
```sql
CREATE TABLE task_estimations (
  task_id UUID PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  story_points INTEGER CHECK (story_points >= 0),
  estimated_minutes INTEGER CHECK (estimated_minutes >= 0),
  optimistic_minutes INTEGER,
  realistic_minutes INTEGER,
  pessimistic_minutes INTEGER,
  complexity VARCHAR(20) CHECK (complexity IN ('low', 'medium', 'high', 'very-high')),
  tshirt_size VARCHAR(10) CHECK (tshirt_size IN ('xs', 's', 'm', 'l', 'xl', 'xxl')),
  estimated_by UUID REFERENCES users(id),
  estimated_at TIMESTAMP DEFAULT NOW(),
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high'))
);

-- Tracking velocity
CREATE TABLE sprint_velocities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID REFERENCES sprints(id),
  team_id UUID REFERENCES teams(id),
  committed_story_points INTEGER,
  completed_story_points INTEGER,
  committed_hours INTEGER,
  completed_hours INTEGER,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Open Source Repositories

### Modern TypeScript/JavaScript Project Management Tools

#### 1. Plane
- **URL:** https://github.com/makeplane/plane
- **Description:** Modern open-source project management tool with GitHub-like issues
- **Tech Stack:** TypeScript, Next.js, Django, PostgreSQL
- **Features:**
  - Issues, Projects, Modules (Epic-like), Cycles (Sprints)
  - GitHub/GitLab integration
  - Multiple views: List, Board, Calendar, Gantt
  - Status workflows with customizable states
  - Dependencies between issues
  - Time tracking
  - Estimations support

#### 2. Focalboard
- **URL:** https://github.com/mattermost/focalboard
- **Description:** Kanban-style project management by Mattermost
- **Tech Stack:** TypeScript, React, Go
- **Features:**
  - Boards, Lists, Cards (Trello-like)
  - Templates for different workflows
  - Multiple views: Board, Table, Calendar, Gantt
  - Custom fields
  - Due dates and task relationships

#### 3. AppFlowy
- **URL:** https://github.com/AppFlowy-IO/AppFlowy
- **Description:** Open-source Notion alternative
- **Tech Stack:** Rust, Flutter, Dart
- **Features:**
  - Kanban boards, tables, calendars
  - Database functionality
  - Flexible hierarchy
  - Relations between database entries

#### 4. Vikunja
- **URL:** https://github.com/go-vikunja/vikunja
- **Description:** Todo-app style task management
- **Tech Stack:** Go, Vue.js
- **Features:**
  - Projects, Tasks, Subtasks
  - Labels, priorities, due dates
  - Teams and sharing
  - Reminders and repeating tasks

### Established Project Management Systems

#### 5. Taiga
- **URL:** https://github.com/kaleidos-ventures/taiga
- **Description:** Agile project management for Scrum and Kanban
- **Tech Stack:** Python, Django, AngularJS, PostgreSQL
- **Features:**
  - Epics, User Stories, Tasks, Issues
  - Sprints (Scrum) and Kanban boards
  - Status workflows
  - Wiki and documentation
  - GitHub integration

#### 6. Redmine
- **URL:** https://github.com/redmine/redmine
- **Description:** Classic project management with issue tracking
- **Tech Stack:** Ruby on Rails, MySQL/PostgreSQL
- **Features:**
  - Projects, Issues, Sub-issues
  - Multiple issue trackers per project
  - Custom workflows
  - Gantt charts
  - Time tracking
  - Wiki, forums, documents

#### 7. OpenProject
- **URL:** https://github.com/opf/openproject
- **Description:** Comprehensive project management suite
- **Tech Stack:** Ruby on Rails, Angular, PostgreSQL
- **Features:**
  - Work Packages (tasks) with hierarchy
  - Time tracking, costs, budgets
  - Gantt charts and roadmaps
  - Agile boards (Scrum/Kanban)
  - Bug tracking
  - Git integration

#### 8. Tuleap
- **URL:** https://github.com/Enalean/tuleap
- **Description:** Enterprise-grade project management
- **Tech Stack:** PHP, PHPSymfony, Node.js
- **Features:**
  - Agile dashboards
  - Trackers with custom semantics
  - Git integration
  - Document management
  - Test management

### Modern Issue Trackers

#### 9. Linear
- **URL:** https://github.com/linear-org/linear
- **Description:** Modern issue tracking (SaaS, but open-source SDKs)
- **Tech Stack:** React, TypeScript
- **Features:**
  - Issues, Projects, Cycles
  - Status workflows
  - Issue dependencies
  - Sprint management
  - Labels and priorities

#### 10. Chisel
- **URL:** https://github.com/chiselstrike/chisel
- **Description:** GitHub-like project management
- **Tech Stack:** TypeScript
- **Features:**
  - GitHub-native
  - Issue tracking
  - Project organization

### Specialized Tools

#### 11. Leantime
- **URL:** https://github.com/Leantime/leantime
- **Description:** Strategic project management with idea management
- **Tech Stack:** PHP, MySQL, Bootstrap
- **Features:**
  - Projects, Tasks, Timesheets
  - Roadmaps and Gantt
  - Idea management
  - Research boards

#### 12. Pagure
- **URL:** https://github.com/pagure/pagure
- **Description:** Git-centered forge with issue tracking
- **Tech Stack:** Python, Flask
- **Features:**
  - Issues with priorities
  - Projects and groups
  - Pull requests
  - Tags and milestones

---

## Code Pattern Examples

### Type Definitions (TypeScript)

```typescript
// Core hierarchy types
type TaskId = string;

interface BaseTask {
  id: TaskId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
  tags: string[];
  attachments: Attachment[];
}

interface Task extends BaseTask {
  type: 'task';
  parentId?: TaskId;
  projectId: string;
  milestoneId?: string;
  phaseId?: string;

  // Dependencies
  blockedBy: TaskId[];
  blocking: TaskId[];
  relatedTo: TaskId[];

  // Estimation
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;

  // Timing
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;

  // Metadata
  position: number; // For ordering
  depth: number; // Hierarchy depth
}

interface Milestone extends BaseTask {
  type: 'milestone';
  projectId: string;
  phaseId?: string;
  targetDate: Date;
  progress: number; // 0-100
  tasks: Task[];
}

interface Phase extends BaseTask {
  type: 'phase';
  projectId: string;
  startDate: Date;
  endDate: Date;
  status: PhaseStatus;
  milestones: Milestone[];
  tasks: Task[];
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  phases: Phase[];
  members: ProjectMember[];
  settings: ProjectSettings;
}

// Enums
enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  DONE = 'done',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

enum TaskPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NO_PRIORITY = 'none'
}

enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Dependency type
interface TaskDependency {
  id: string;
  predecessorId: TaskId;
  successorId: TaskId;
  type: DependencyType;
  createdAt: Date;
}

enum DependencyType {
  FINISH_TO_START = 'finish_to_start', // Predecessor must finish before successor starts
  START_TO_START = 'start_to_start',   // Predecessor must start before successor starts
  FINISH_TO_FINISH = 'finish_to_finish', // Predecessor must finish before successor finishes
  START_TO_FINISH = 'start_to_finish'  // Predecessor must start before successor finishes
}
```

### Database Schema (PostgreSQL)

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- Phases table
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'not_started',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Milestones table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'not_started',
  target_date TIMESTAMP,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',

  -- People
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),

  -- Estimation
  story_points INTEGER CHECK (story_points >= 0),
  estimated_hours INTEGER CHECK (estimated_hours >= 0),
  actual_hours INTEGER CHECK (actual_hours >= 0),

  -- Dates
  start_date TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,

  -- Hierarchy
  position INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[],
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Task dependencies table
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) NOT NULL DEFAULT 'finish_to_start',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(predecessor_id, successor_id),
  CHECK (predecessor_id != successor_id)
);

-- Indexes for performance
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_phase ON tasks(phase_id);
CREATE INDEX idx_tasks_milestone ON tasks(milestone_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_depth ON tasks(depth);

CREATE INDEX idx_task_deps_pred ON task_dependencies(predecessor_id);
CREATE INDEX idx_task_deps_succ ON task_dependencies(successor_id);

-- Hierarchical query using recursive CTE
CREATE OR REPLACE FUNCTION get_task_tree(task_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  depth INTEGER,
  path VARCHAR(255)[]
) AS $$
WITH RECURSIVE task_tree AS (
  -- Base case: the root task
  SELECT
    t.id,
    t.title,
    0 as depth,
    ARRAY[t.title] as path
  FROM tasks t
  WHERE t.id = task_id

  UNION ALL

  -- Recursive case: children
  SELECT
    t.id,
    t.title,
    tt.depth + 1,
    tt.path || t.title
  FROM tasks t
  INNER JOIN task_tree tt ON t.parent_id = tt.id
)
SELECT * FROM task_tree
ORDER BY depth, title;
$$ LANGUAGE SQL;

-- Function to detect circular dependencies
CREATE OR REPLACE FUNCTION detect_circular_dependency(
  p_predecessor_id UUID,
  p_successor_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_cycle BOOLEAN := FALSE;
BEGIN
  WITH RECURSIVE dependency_path AS (
    -- Start with successor
    SELECT p_successor_id as task_id, 1 as depth

    UNION ALL

    -- Follow all dependencies
    SELECT
      td.predecessor_id,
      dp.depth + 1
    FROM task_dependencies td
    INNER JOIN dependency_path dp ON td.successor_id = dp.task_id
    WHERE dp.depth < 100 -- Prevent infinite loops
  )
  SELECT EXISTS(
    SELECT 1 FROM dependency_path WHERE task_id = p_predecessor_id
  ) INTO v_has_cycle;

  RETURN v_has_cycle;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent circular dependencies
CREATE OR REPLACE FUNCTION prevent_circular_dependencies()
RETURNS TRIGGER AS $$
BEGIN
  IF detect_circular_dependency(NEW.predecessor_id, NEW.successor_id) THEN
    RAISE EXCEPTION 'Circular dependency detected';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_circular_dependencies
BEFORE INSERT OR UPDATE ON task_dependencies
FOR EACH ROW
EXECUTE FUNCTION prevent_circular_dependencies();
```

### React Component Pattern Example

```typescript
import React, { useState } from 'react';
import { Task, TaskStatus } from './types';

interface TaskItemProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onStatusChange,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = (newStatus: TaskStatus) => {
    onStatusChange(task.id, newStatus);
  };

  const getProgressColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.DONE: return 'bg-green-500';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-500';
      case TaskStatus.BLOCKED: return 'bg-red-500';
      case TaskStatus.IN_REVIEW: return 'bg-purple-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="task-item border rounded p-4 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? '▼' : '▶'}
          </button>

          <div className={`w-3 h-3 rounded-full ${getProgressColor(task.status)}`} />

          <div>
            <h3 className="font-semibold">{task.title}</h3>
            <div className="text-sm text-gray-500">
              #{task.id.slice(0, 8)} • {task.status}
              {task.storyPoints && ` • ${task.storyPoints} pts`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            className="border rounded px-2 py-1"
          >
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          <button
            onClick={() => onDelete(task.id)}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-gray-700">{task.description}</p>

          {task.blockedBy.length > 0 && (
            <div className="mt-2 text-sm text-orange-600">
              Blocked by: {task.blockedBy.join(', ')}
            </div>
          )}

          {task.blocking.length > 0 && (
            <div className="mt-2 text-sm text-blue-600">
              Blocking: {task.blocking.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## Key Findings Summary

### Hierarchy Best Practices

1. **Use a flexible depth approach** - Most modern tools support unlimited depth rather than fixed levels
2. **Separate concepts** - Milestones (time-based) vs Phases (categorical) vs Initiatives (organizational)
3. **Multiple parents support** - Some systems allow tasks to belong to multiple milestones/projects
4. **Materialized path pattern** is most common for performance

### Status Workflow Best Practices

1. **Keep it simple** - 4-6 statuses is optimal for most teams
2. **Use state machine validation** - Prevent invalid status transitions
3. **Support workflow customization** - Allow teams to define their own workflows
4. **Status categories** - Group statuses as active/inactive/terminal for filtering

### Dependency Management Best Practices

1. **Prevent circular dependencies** - Use DAG validation on all dependency changes
2. **Support multiple dependency types** - At minimum: blocking, related, parent/child
3. **Visualize dependencies** - Gantt charts and dependency graphs
4. **Cascade status updates** - Option to auto-update dependent tasks
5. **Critical path calculation** - Identify bottlenecks

### Estimation Best Practices

1. **Fibonacci sequence** is most popular for story points
2. **Support multiple estimation methods** - Story points AND time estimates
3. **Track velocity** - Calculate team capacity from historical data
4. **Confidence levels** - Allow teams to express uncertainty
5. **Sprint capacity planning** - Use velocity for sprint commitment

---

## Recommended Implementation Strategy

Based on research findings, for the Groundswell task system:

1. **Hierarchy:** Use materialized path with optional milestone association
2. **Status:** Implement GitHub-style 5-state workflow with customization
3. **Dependencies:** Support blocking/blocked-by with cycle detection
4. **Estimation:** Support both Fibonacci story points and time estimates
5. **Database:** Use PostgreSQL with recursive CTEs for hierarchy queries

---

## References & URLs

### Modern Tools
- **Plane:** https://github.com/makeplane/plane
- **Focalboard:** https://github.com/mattermost/focalboard
- **AppFlowy:** https://github.com/AppFlowy-IO/AppFlowy
- **Vikunja:** https://github.com/go-vikunja/vikunja

### Established Systems
- **Taiga:** https://github.com/kaleidos-ventures/taiga
- **Redmine:** https://github.com/redmine/redmine
- **OpenProject:** https://github.com/opf/openproject
- **Tuleap:** https://github.com/Enalean/tuleap

### Specialized Tools
- **Leantime:** https://github.com/Leantime/leantime
- **Pagure:** https://github.com/pagure/pagure
- **Trac (Classic):** https://github.com/edgewall/trac

### Research Resources
- **GitHub Issue Architecture:** https://github.blog/engineering/architecture/
- **Jira REST API Docs:** https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/
- **Project Management Patterns:** https://martinfowler.com/tags/project%20management.html

---

**End of Research Document**
