# Contributing Guide Research

## Best Practices from Open Source Projects

Based on research of TypeScript/Node.js projects (TypeScript, Prisma, LangChain.js, Vite, Node.js):

### Universal Sections (100% of excellent guides have these)

1. **Prerequisites & Setup**
   - Node.js version requirements
   - Package manager instructions
   - Environment variable setup

2. **Development Workflow**
   - Forking and cloning
   - Branch naming conventions
   - Commit message format

3. **Testing**
   - How to run tests locally
   - Test framework documentation
   - Coverage requirements

4. **Code Style**
   - Linting rules and commands
   - Formatting (Prettier)
   - TypeScript-specific guidelines

5. **PR Process**
   - PR template requirements
   - Code review expectations
   - CI/CD checks that must pass

6. **"Adding New Features"** (70% of guides)
   - Feature proposal process
   - Implementation guidelines
   - Documentation requirements

7. **"Adding Tests"** (60% of guides)
   - Test file location conventions
   - Writing unit vs integration tests
   - Mocking external dependencies
   - Test coverage expectations

### Structural Best Practices

1. **Table of Contents** at the top
2. **Quick Start Section** (5-minute setup)
3. **Progressive Disclosure** (basic first, advanced later)
4. **Visual Aids** (code blocks, diagrams)

### Content Best Practices

1. **Be Specific, Not Generic**
   - Exact commands to run (`npm run test:unit`, not "run tests")
   - Expected output examples
   - Common errors and solutions

2. **Explain "Why" Not Just "How"**
   - Why certain patterns are used
   - Why tests are required
   - Why code style matters

3. **Provide Examples**
   - Good pull request examples
   - Good test examples
   - Good commit message examples

### Recommended Sections for This Project

#### Essential Sections

1. **Quick Start** (5 commands or less to start contributing)
2. **Development Setup** (detailed, with troubleshooting)
3. **Project Structure** (how the codebase is organized)
4. **Adding New Features** (step-by-step workflow)
5. **Adding Tests** (testing patterns and examples)
6. **Code Style** (linting, formatting, TypeScript rules)
7. **PR Process** (from branch to merge)
8. **Getting Help** (where to ask questions)

#### Nice-to-Have Sections

1. **Architecture Overview** (diagrams or high-level explanation)
2. **Adding Agent Personas** (project-specific)
3. **Adding MCP Tools** (project-specific)
4. **Release Process** (how versions work)

### Key URLs for Reference

- [TypeScript Contributing Guide](https://github.com/microsoft/TypeScript/blob/main/CONTRIBUTING.md)
- [Prisma Contributing Guide](https://github.com/prisma/prisma/blob/main/CONTRIBUTING.md)
- [Vite Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md)
- [Vitest Testing Guide](https://vitest.dev/guide/)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
