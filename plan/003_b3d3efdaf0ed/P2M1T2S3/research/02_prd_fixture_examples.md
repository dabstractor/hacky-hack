# PRD Fixture Examples Analysis

## Source: tests/fixtures/simple-prd.ts

### Minimal Valid PRD Structure

```typescript
export const mockSimplePRD = `
# Test Project

A minimal project for fast E2E pipeline testing.

## P1: Test Phase

Validate pipeline functionality with minimal complexity.

### P1.M1: Test Milestone

Create a simple hello world implementation.

#### P1.M1.T1: Create Hello World

Implement a basic hello world function with tests.

##### P1.M1.T1.S1: Write Hello World Function

Create a simple hello world function.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Simple function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!"
4. OUTPUT: src/hello.ts with exported hello function
`;
```

### Key Patterns

1. **Hierarchical Structure**: Phase > Milestone > Task > Subtask
2. **Subtask Context Scope**: Each subtask has a `context_scope` with CONTRACT DEFINITION
3. **Contract Definition Format**:
   - RESEARCH NOTE: What to research
   - INPUT: What inputs are available
   - LOGIC: Implementation logic
   - OUTPUT: Expected output

### Example: Main PRD.md Structure

The main PRD.md demonstrates comprehensive PRD structure:

- Executive Summary with clear goals
- Core Philosophy & Concepts explaining the "why"
- System Architecture with components
- Functional Requirements with detailed specifications
- User Workflows with step-by-step flows
- Critical Prompts & Personas for agent requirements

### Subtask Best Practices

From `simple-prd.ts`, each subtask includes:

- Clear description
- Story points estimate
- Dependencies list
- Status field
- Context scope with contract definition
