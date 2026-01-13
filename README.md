# PRP Pipeline

[![node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Autonomous AI-powered development pipeline that transforms Product Requirement
Documents (PRDs) into implemented code through multi-agent orchestration.

## Quick Start

Get running in under 2 minutes:

```bash
# Install dependencies
npm install

# Run the pipeline with your PRD
npm run dev -- --prd ./PRD.md

# Run with dry-run to see what would happen
npm run dev -- --prd ./PRD.md --dry-run
```

That's it! The pipeline will decompose your PRD, generate PRPs for each task,
and execute them through AI agents.

## What is PRP Pipeline?

PRP Pipeline is an autonomous software development system that transforms
Product Requirement Documents (PRDs) into working code through AI agent
orchestration.

At its core is the **Product Requirement Prompt (PRP)** - a structured prompt
that provides AI agents with complete context, clear objectives, and
validation criteria for implementing work units correctly in a single pass.

```
PRD.md
  │
  ├─▶ [Architect Agent] ──▶ tasks.json (hierarchical backlog)
  │
  ├─▶ [Task Orchestrator] ──▶ Iterates through tasks
  │                             │
  │                             └─▶ [PRP Runtime] ──▶ Implement & Validate
  │
  └─▶ [QA Agent] ──▶ TEST_RESULTS.md
```

See [PROMPTS.md](PROMPTS.md) for the complete PRP concept definition.

## Features

- **Autonomous PRD-to-Code**: Transform requirements into working code
  automatically
- **Multi-Agent Architecture**: Specialized AI agents for Architecture,
  Research, Implementation, and QA
- **Hierarchical Task Decomposition**: Organize work into Phases → Milestones
  → Tasks → Subtasks
- **Resumable Sessions**: Pause and resume execution with state persistence
- **Scoped Execution**: Run specific phases, milestones, or tasks
- **4-Level Validation**: Syntax, unit tests, integration tests, and manual
  validation gates
- **Smart Git Integration**: Automatic commits with generated messages
- **Graceful Shutdown**: Ctrl+C preserves state for resumption

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/hacky-hack.git
cd hacky-hack

# Install dependencies
npm install

# Verify installation
npm run typecheck
```

## Usage

### Basic Command Structure

```bash
npm run dev -- [options]
```

### CLI Options

| Option       | Alias | Type    | Default    | Description                            |
| ------------ | ----- | ------- | ---------- | -------------------------------------- |
| `--prd`      | `-p`  | string  | `./PRD.md` | Path to PRD file                       |
| `--scope`    | `-s`  | string  | -          | Execute specific scope (e.g., `P3.M4`) |
| `--mode`     | `-m`  | string  | `normal`   | Execution mode: `normal` or `delta`    |
| `--continue` | `-c`  | boolean | `false`    | Continue from previous session         |
| `--dry-run`  | `-d`  | boolean | `false`    | Show what would be done                |
| `--verbose`  | `-v`  | boolean | `false`    | Enable verbose logging                 |

### Usage Examples

#### Basic Pipeline Execution

```bash
# Run full pipeline with default PRD
npm run dev -- --prd ./PRD.md

# Run with verbose output
npm run dev -- --prd ./PRD.md --verbose
```

#### Scoped Execution

```bash
# Run specific phase
npm run dev -- --prd ./PRD.md --scope P3

# Run specific milestone
npm run dev -- --prd ./PRD.md --scope P3.M4

# Run specific task
npm run dev -- --prd ./PRD.md --scope P3.M4.T2
```

#### Dry Run and Testing

```bash
# See what would happen without executing
npm run dev -- --prd ./PRD.md --dry-run

# Continue from previous session
npm run dev -- --prd ./PRD.md --continue
```

#### Development Mode

```bash
# Run with hot reload (development)
npm run dev:watch -- --prd ./PRD.md

# Run with debug inspector
npm run dev:debug -- --prd ./PRD.md
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRP Pipeline Architecture                     │
└─────────────────────────────────────────────────────────────────────┘

   ┌──────────┐      ┌──────────────┐      ┌─────────────┐
   │    PRD   │─────▶│    Architect │─────▶│   Backlog   │
   │  (Input) │      │    Agent     │      │  (JSON)     │
   └──────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                    Task Orchestrator                         │
   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
   │  │  Phase   │─▶│Milestone │─▶│   Task   │─▶│ Subtask  │   │
   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
   └──────────────────────────────────────────────────────────────┘
                            │
                            ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │ PRP Generator│─────▶│ PRP Runtime  │─────▶│    Build     │
   │  (Research)  │      │  (Execute)   │      │  (Output)    │
   └──────────────┘      └──────────────┘      └──────────────┘
```

### Key Components

- **CLI Interface** (`src/cli/`): Argument parsing and command handling
- **Session Manager** (`src/core/session-manager.ts`): State persistence and
  resumption
- **Task Orchestrator** (`src/core/task-orchestrator.ts`): Task traversal and
  execution
- **Agent Factory** (`src/agents/agent-factory.ts`): Creates specialized AI
  agents
- **PRP Runtime** (`src/agents/prp-runtime.ts`): Executes PRPs with validation
- **PRP Generator** (`src/agents/prp-generator.ts`): Creates PRPs from tasks

## AI Agent System

The PRP Pipeline uses specialized AI agents for each stage of development:

### Agent Roles

| Agent          | Purpose                  | Input           | Output          | Invoked When       |
| -------------- | ------------------------ | --------------- | --------------- | ------------------ |
| **Architect**  | Decompose PRD into tasks | PRD.md          | tasks.json      | New session        |
| **Researcher** | Generate PRPs            | Subtask context | PRP.md          | Subtask starts     |
| **Coder**      | Implement PRPs           | PRP.md          | Code changes    | PRP generated      |
| **QA**         | Find bugs                | Completed code  | TEST_RESULTS.md | All tasks complete |

### PRP Concept

A **Product Requirement Prompt (PRP)** is a structured prompt containing:

- **Goal**: What to build (feature goal, deliverable, success criteria)
- **Context**: Complete context (file paths, patterns, gotchas, docs)
- **How**: Step-by-step implementation tasks
- **Validation**: 4-level quality gate system

PRPs enable one-pass implementation by providing AI agents with everything
they need - no guessing, no missing context.

## Pipeline Workflow

### Phase 1: Session Initialization

Computes SHA-256 hash of PRD.md to detect new vs existing sessions:

- **New session**: Creates `plan/{sequence}_{hash}/` directory
- **Existing session**: Loads tasks.json and resumes execution

### Phase 2: PRD Decomposition

Architect Agent analyzes PRD and generates task hierarchy:

- Phase → Milestone → Task → Subtask (4 levels)
- Each Subtask includes context_scope, dependencies, and story_points
- Persists to `tasks.json`

### Phase 3: Backlog Execution

Task Orchestrator traverses hierarchy (depth-first, pre-order):

1. Check dependencies (wait if blocking)
2. Generate PRP (Product Requirement Prompt)
3. Execute PRP with Coder Agent
4. Validate through 4-level gate system
5. Commit changes to Git

Supports graceful shutdown (Ctrl+C preserves state).

### Phase 4: QA Cycle

Runs when all tasks are Complete:

- QA Agent performs bug hunt
- Generates TEST_RESULTS.md
- If bugs found: triggers bug-fix sub-pipeline
- If no bugs: pipeline succeeds

## Project Structure

```
hacky-hack/
├── src/
│   ├── agents/              # AI agent implementations
│   │   ├── prompts/         # Agent prompt templates
│   │   ├── agent-factory.ts # Agent creation factory
│   │   ├── prp-generator.ts # PRP Generator agent
│   │   ├── prp-executor.ts  # PRP Executor agent
│   │   └── prp-runtime.ts   # PRP Runtime orchestrator
│   ├── cli/                 # Command-line interface
│   │   └── index.ts         # CLI argument parser
│   ├── config/              # Configuration modules
│   │   ├── constants.ts     # Constants
│   │   ├── environment.ts   # Environment setup
│   │   └── types.ts         # Type definitions
│   ├── core/                # Core business logic
│   │   ├── index.ts         # Core module exports
│   │   ├── models.ts        # Task hierarchy types
│   │   ├── prd-differ.ts    # PRD diffing utilities
│   │   ├── scope-resolver.ts # Scope parsing
│   │   ├── session-manager.ts # Session state management
│   │   ├── session-utils.ts # Session utilities
│   │   └── task-orchestrator.ts # Task execution orchestrator
│   ├── tools/               # MCP tool integrations
│   │   ├── bash-mcp.ts      # Bash MCP tool
│   │   ├── filesystem-mcp.ts # Filesystem MCP tool
│   │   └── git-mcp.ts       # Git MCP tool
│   ├── utils/               # Utility functions
│   │   ├── git-commit.ts    # Smart commit utility
│   │   └── task-utils.ts    # Task utilities
│   ├── workflows/           # Pipeline orchestration
│   │   ├── hello-world.ts   # Placeholder workflow
│   │   └── prp-pipeline.ts  # Main PRP Pipeline workflow
│   └── scripts/             # Standalone scripts
│       └── validate-api.ts  # API validation script
├── plan/                    # Session directories
│   └── 001_14b9dc2a33c7/    # Example session
│       ├── PRP/             # Generated PRPs
│       ├── research/        # Research findings
│       ├── tasks.json       # Task hierarchy
│       └── prd_snapshot.md  # PRD snapshot
├── PRD.md                   # Master product requirements
├── PROMPTS.md               # System prompts
├── package.json             # npm configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Test configuration
├── .eslintrc.json           # ESLint configuration
└── .prettierrc              # Prettier configuration
```

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/hacky-hack.git
cd hacky-hack

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Available Scripts

| Script                  | Description                     |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Run pipeline with PRD           |
| `npm run dev:watch`     | Run with hot reload             |
| `npm run dev:debug`     | Run with debug inspector        |
| `npm run build`         | Build the project               |
| `npm run typecheck`     | Type check without compilation  |
| `npm test`              | Run tests in watch mode         |
| `npm run test:run`      | Run tests once                  |
| `npm run test:coverage` | Generate coverage report        |
| `npm run lint`          | Run ESLint                      |
| `npm run format`        | Format code with Prettier       |
| `npm run validate`      | Run all validation checks       |
| `npm run fix`           | Auto-fix linting and formatting |

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm test
```

### Building

```bash
# Type check
npm run typecheck

# Build for production
npm run build

# Build with watch mode
npm run build:watch
```

## License

MIT

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
