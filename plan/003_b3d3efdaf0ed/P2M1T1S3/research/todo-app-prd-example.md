# TODO App PRD Example for Quick Start Tutorial

## Simple TODO App PRD

This is a complete but simple PRD suitable for a quick start tutorial. It demonstrates:

- Basic CRUD operations (Create, Read, Update, Delete tasks)
- Task properties (title, description, completed status)
- Simple filtering (all, active, completed)
- Command-line interface

```markdown
# Simple TODO App

A command-line task management application for tracking daily tasks.

## Executive Summary

Build a simple TODO CLI application that allows users to:

- Add new tasks with descriptions
- List all tasks
- Mark tasks as complete
- Delete tasks
- Filter tasks by completion status

## P1: Core Features

Implement basic task management functionality.

### P1.M1: Task Data Model

Define the task data structure and storage.

#### P1.M1.T1: Create Task Model

Define TypeScript interfaces for task data.

##### P1.M1.T1.S1: Define Task Interface

Create TypeScript interface with id, title, description, completed, createdAt.

##### P1.M1.T1.S2: Create Task Manager Class

Implement class with methods for CRUD operations.

### P1.M1.T2: CLI Commands

Implement command-line interface.

#### P1.M1.T2.S1: Add Command

Implement `add` command to create new tasks.

#### P1.M1.T2.S2: List Command

Implement `list` command to display all tasks.

#### P1.M1.T2.S3: Complete Command

Implement `complete` command to mark tasks done.

#### P1.M1.T2.S4: Delete Command

Implement `delete` command to remove tasks.

### P1.M1.T3: Storage

Implement file-based task storage.

#### P1.M1.T3.S1: Save Tasks

Implement JSON file persistence.

#### P1.M1.T3.S2: Load Tasks

Implement JSON file loading on startup.
```

## Why This PRD Works for Quick Start

1. **Familiar Concept**: Everyone understands a TODO list
2. **Clear Scope**: Limited to essential features
3. **Progressive Complexity**: Data model → CLI → Storage
4. **Measurable Results**: Users can see tasks being created and managed
5. **Realistic**: Demonstrates actual software patterns (CRUD, CLI, storage)

## Expected Output After Running Pipeline

```
todo-app/
├── src/
│   ├── models/
│   │   └── task.ts          # Task interface and manager
│   ├── commands/
│   │   ├── add.ts           # Add task command
│   │   ├── list.ts          # List tasks command
│   │   ├── complete.ts      # Complete task command
│   │   └── delete.ts        # Delete task command
│   ├── storage/
│   │   └── file-store.ts    # JSON file storage
│   └── index.ts             # Main CLI entry point
├── tests/
│   ├── task.test.ts         # Task model tests
│   └── commands.test.ts     # CLI command tests
├── package.json
└── tsconfig.json
```

## Key Demonstration Points

1. **AI Agent Coordination**: Shows Architect → Researcher → Coder → QA flow
2. **Task Breakdown**: Demonstrates hierarchical task organization
3. **Code Generation**: Shows complete, working code output
4. **Testing**: Shows automatic test generation and validation
5. **Session Structure**: Shows `plan/{hash}/` directory with artifacts

## Alternative: Even Simpler PRD

For maximum simplicity, consider a "Hello World" style PRD:

```markdown
# Hello World App

A simple application that displays a greeting message.

## P1: Implementation

### P1.M1: Create Greeting

#### P1.M1.T1: Implement Greeting Function

Create a function that returns "Hello, World!"

##### P1.M1.T1.S1: Write Function

Create `src/greet.ts` with `greet()` function.

##### P1.M1.T1.S2: Write Test

Create test that verifies greeting output.

##### P1.M1.T1.S3: Create CLI

Create command-line interface that calls greet().
```

This completes in under 2 minutes and demonstrates the full pipeline flow.
