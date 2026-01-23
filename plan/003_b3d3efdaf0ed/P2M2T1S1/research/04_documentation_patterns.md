# Documentation Patterns Analysis

## Header Format (Consistent Across All Files)

```markdown
# Document Title

**Version**: 0.1.0
**Last Updated**: 2026-01-23
**Status**: Published
```

**Pattern**: Main title followed by three metadata fields in bold.

## Table of Contents Structure

```markdown
## Table of Contents

- [Section One](#section-one)
- [Section Two](#section-two)
- [Section Three](#section-three)
```

**Pattern**:
- Hyphen-bullet format (`- [Text](#anchor)`)
- Anchor links use lowercase with hyphens
- Semicolons separate multi-word anchors

## Section Organization

### Primary Sections (H2)
- Always followed by `---` separator
- Begin with bold headings
- Include anchor links

### Subsections (H3)
- No separator
- Indented under primary sections

### Code Examples
```typescript
// Always with language identifier
async processNextItem(): Promise<boolean> {
  // Implementation
}
```

## Table Formatting

```markdown
| Column One | Column Two | Column Three |
|------------|------------|--------------|
| **Bold**   | Normal     | Italic       |
```

**Pattern**:
- Pipes (`|`) for column separation
- Header row with separator row (`---`)
- Bold for emphasis

## Diagram Styles

### Mermaid Diagrams
```markdown
\`\`\`mermaid
flowchart LR
    A[PRD.md] --> B[Architect Agent]
    B --> C[tasks.json]
\`\`\`
```

### ASCII Art (Directory Structures)
```
plan/
├── 001_14b9dc2a33c7/
│   ├── prd_snapshot.md
│   └── tasks.json
```

## Cross-Reference Linking

### Internal Links
```markdown
**Location**: [`src/core/session-manager.ts`](../src/core/session-manager.md)
```

**Pattern**:
- Relative paths for internal links
- Descriptive link text

### Navigation Links
```markdown
| Module | Description | Link |
|--------|-------------|------|
| **SessionManager** | State management | [API](./api/classes/...) |
```

## Tone and Style

- Clear, concise language
- Active voice preferred
- No jargon without explanation
- Consistent terminology

## Footer Pattern

```markdown
---
**Document Version**: 1.0.0
**Last Modified**: 2026-01-23
**Maintainer**: PRP Pipeline Team
```

## Existing Architecture.md Structure

The existing `docs/api/media/architecture.md` follows this comprehensive structure:

1. System Overview
2. Four Core Processing Engines (detailed sections for each)
3. Data Flow & Execution Model
4. Component Architecture
5. Groundswell Framework Integration
6. Extensibility Patterns
7. Caching Strategy
8. Session Management
9. Task Orchestration
10. Agent System
11. Performance Considerations
12. Security Considerations
13. API Documentation
14. Additional Resources

This structure should be followed for the new `docs/ARCHITECTURE.md`.
