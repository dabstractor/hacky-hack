# README.md Best Practices Research for Open Source TypeScript Projects

Research conducted: 2026-01-13
Project context: TypeScript CLI tool / Agentic system

---

## Executive Summary

This document compiles best practices for writing professional README.md files for open source TypeScript projects, with specific focus on CLI tools, developer tools, and agentic systems. Research includes analysis of leading projects like TypeScript, Prettier, Vite, oclif, Pixi, and Copilot.vim.

---

## Table of Contents

1. [Modern README Structure Standards](#modern-readme-structure-standards)
2. [Badge Standards and Services](#badge-standards-and-services)
3. [Quick Start Guide Best Practices](#quick-start-guide-best-practices)
4. [Usage Examples Documentation](#usage-examples-documentation)
5. [Configuration Documentation](#configuration-documentation)
6. [Architecture Overview Patterns](#architecture-overview-patterns)
7. [Contributing Guidelines](#contributing-guidelines)
8. [Example READMEs Analyzed](#example-readmes-analyzed)
9. [Specific Recommendations for This Project](#specific-recommendations-for-this-project)

---

## Modern README Structure Standards

### Essential Sections (In Order)

1. **Project Header**
   - Logo/banner image (optional but recommended)
   - Project name
   - Tagline (one-line description)

2. **Badge Cluster** (see [Badge Standards](#badge-standards-and-services))

3. **Project Description**
   - 2-3 sentence overview
   - What problem does it solve?
   - Who is it for?
   - Key features (bullet points)

4. **Quick Start / Getting Started**
   - Minimal steps to first success
   - Prerequisites clearly listed
   - Installation commands
   - Basic "Hello World" example

5. **Usage Examples**
   - Common use cases
   - Code snippets with syntax highlighting
   - Expected outputs

6. **Documentation Links**
   - API docs
   - Configuration reference
   - Architecture overview
   - Changelog

7. **Contributing Guidelines**
   - How to contribute
   - Development setup
   - Code of conduct

8. **License Information**

### Modern Trends (2025-2026)

- **Emoji Usage**: Sparingly, primarily for section headers
- **Visual Assets**: GIFs, screenshots, diagrams for CLI tools
- **Dark Mode Support**: Using picture tags with source sets
- **Table of Contents**: Auto-generated or manual, critical for longer READMEs
- **Accessibility**: Alt text on images, proper heading hierarchy
- **Security Badges**: OpenSSF Scorecard, security scanning results
- **AI/ML Model Cards**: If applicable

### Example Header Patterns

**From Vite:**
```markdown
<p align="center">
  <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://vite.dev/vite-light.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://vite.dev/vite-dark.svg">
      <img alt="vite logo" src="https://vite.dev/vite-dark.svg" height="60">
    </picture>
  </a>
</p>

# Vite ⚡

> Next Generation Frontend Tooling
```

**From Pixi:**
```markdown
<h1>
  <a href="https://github.com/prefix-dev/pixi/">
    <picture>
      <source srcset="..." type="image/png">
      <source srcset="..." type="image/webp">
      <img srcset="..." alt="banner">
    </picture>
  </a>
</h1>

# Pixi: Package Management Made Easy
```

---

## Badge Standards and Services

### Essential Badges for TypeScript Projects

#### Build & Quality
```markdown
[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)
[![Tests](https://github.com/USER/REPO/actions/workflows/test.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/test.yml)
```

**Source**: GitHub Actions
- Shows build/test status
- Links to workflow runs
- Standard format: `github.com/USER/REPO/actions/workflows/WORKFLOW.yml/badge.svg`

#### Version & Downloads
```markdown
[![npm version](https://badge.fury.io/js/PACKAGE.svg)](https://www.npmjs.com/package/PACKAGE)
[![npm downloads](https://img.shields.io/npm/dm/PACKAGE.svg)](https://www.npmjs.com/package/PACKAGE)
```

**Sources**:
- https://badge.fury.io/ - npm version badges
- https://img.shields.io - Generic badge service

#### Code Coverage
```markdown
[![codecov](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/REPO)
```

**Source**: https://codecov.io
- Shows code coverage percentage
- Links to detailed coverage reports

#### Security
```markdown
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/USER/REPO/badge)](https://securityscorecards.dev/viewer/?uri=github.com/USER/REPO)
```

**Source**: https://securityscorecards.dev
- Shows security best practices score
- Important for 2025 security standards

#### Node Version Compatibility
```markdown
[![node version](https://img.shields.io/node/v/PACKAGE.svg)](https://nodejs.org/en/about/previous-releases)
```

**Source**: https://img.shields.io

#### License
```markdown
[![License](https://img.shields.io/npm/l/PACKAGE.svg)](https://github.com/USER/REPO/blob/main/LICENSE)
```

#### Community
```markdown
[![Discord](https://img.shields.io/discord/SERVER_ID.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/INVITE_LINK)
[![Twitter](https://img.shields.io/twitter/follow/ACCOUNT.svg?style=social)](https://twitter.com/ACCOUNT)
```

### Badge Organization Best Practices

**From Prettier (Good Example):**
```markdown
<p align="center">
  <a href="..."><img alt="CI Status" src="..."></a>
  <a href="..."><img alt="Coverage Status" src="..."></a>
  <a href="..."><img alt="Blazing Fast" src="..."></a>
  <br/>
  <a href="..."><img alt="npm version" src="..."></a>
  <a href="..."><img alt="weekly downloads" src="..."></a>
  <a href="..."><img alt="code style: prettier" src="..."></a>
</p>
```

**Key Principles**:
- Group related badges (CI, quality, popularity, community)
- Use `<br/>` to create logical rows
- All badges should link to relevant pages
- Keep badge count reasonable (5-10 max)
- Use flat-square style for modern look
- Ensure alt text for accessibility

### Badge Services Reference

| Service | URL | Use Case |
|---------|-----|----------|
| Shields.io | https://img.shields.io | Generic badges (npm, license, etc.) |
| Badge Fury | https://badge.fury.io | npm package version badges |
| Codecov | https://codecov.io | Code coverage badges |
| GitHub Actions | Built-in | CI/CD status badges |
| OpenSSF Scorecard | https://securityscorecards.dev | Security scoring |
| Fossa | https://fossa.com | License/compliance badges |

---

## Quick Start Guide Best Practices

### Principles

1. **Time to First Success**: User should accomplish something meaningful in < 5 minutes
2. **Minimal Prerequisites**: Only what's absolutely necessary
3. **Copy-Paste Ready**: Commands should be ready to run
4. **Progressive Disclosure**: Start simple, add complexity gradually
5. **Verification Step**: Show how to confirm installation worked

### Structure Template

```markdown
## Quick Start

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm or yarn package manager

### Installation

\`\`\`bash
# Install via npm
npm install -g your-package

# Or using npx (no installation needed)
npx your-package init
\`\`\`

### Your First Project

\`\`\`bash
# Create a new project
your-package init my-project

# Navigate into the project
cd my-project

# Run the tool
your-package run
\`\`\`

### Verify Installation

\`\`\`bash
your-package --version
# Expected output: your-package v1.0.0
\`\`\`

**Next Steps**: Check out the [Usage Examples](#usage-examples) or [Configuration](#configuration) docs.
```

### Excellent Examples

**From TypeScript:**
```markdown
## Installing

For the latest stable version:

```bash
npm install -D typescript
```

For our nightly builds:

```bash
npm install -D typescript@next
```
```
*Analysis: Simple, direct, addresses both stable and bleeding-edge users*

**From Pixi:**
```markdown
## Getting Started

- ⚡ [Installation](#installation)
- ⚙️ [Examples](/examples)
- 📚 [Documentation](https://pixi.sh/)
- 😍 [Contributing](#contributing)
```
*Analysis: Provides clear navigation path for different user needs*

**From Copilot.vim:**
```markdown
## Getting started

1. Install Neovim or the latest patch of Vim (9.0.0185 or newer).
2. Install Node.js.
3. Install github/copilot.vim using vim-plug, lazy.nvim, or any other plugin manager.
4. Start Vim/Neovim and invoke `:Copilot setup`.
```
*Analysis: Numbered steps, specific versions, clear action items*

### Common Mistakes to Avoid

1. **Too many installation options**: Pick 1-2 most common methods
2. **Missing prerequisites**: Users discover missing deps mid-install
3. **No verification step**: Users unsure if install worked
4. **Outdated version info**: Always use dynamic badges or latest version
5. **Complex first example**: Save advanced features for later sections

---

## Usage Examples Documentation

### Best Practices

1. **Progressive Complexity**: Start simple, build to advanced
2. **Real-World Scenarios**: Solve actual problems users face
3. **Copy-Paste Ready**: Complete, runnable examples
4. **Show Output**: Include expected results
5. **Language-Specific**: Show TypeScript types clearly
6. **Error Handling**: Show how to handle common errors

### Structure Template

```markdown
## Usage Examples

### Basic Example

Minimal example to get you started:

\`\`\`typescript
import { YourTool } from 'your-package';

const tool = new YourTool();
const result = await tool.run();

console.log(result);
// Output: { success: true, data: [...] }
\`\`\`

### Common Use Cases

#### Example 1: Common Pattern

\`\`\`typescript
// Show a realistic use case
\`\`\`

#### Example 2: Advanced Configuration

\`\`\`typescript
// Show more complex usage
\`\`\`

### CLI Usage

If your package provides a CLI:

\`\`\`bash
# Basic usage
your-package command [options]

# With options
your-package process --input file.txt --output result.json

# Help
your-package --help
\`\`\`

### Error Handling

\`\`\`typescript
try {
  const result = await tool.run();
} catch (error) {
  if (error instanceof YourToolError) {
    console.error('Specific error:', error.message);
  }
}
\`\`\`
```

### Excellent Examples

**From Prettier:**
```markdown
### Input

```js
foo(reallyLongArg(), omgSoManyParameters(), IShouldRefactorThis(), isThereSeriouslyAnotherOne());
```

### Output

```js
foo(
  reallyLongArg(),
  omgSoManyParameters(),
  IShouldRefactorThis(),
  isThereSeriouslyAnotherOne(),
);
```
```
*Analysis: Shows before/after, clearly demonstrates value proposition*

**From oclif:**
```markdown
## Usage

Creating a CLI:

```sh-session
$ npx oclif generate mynewcli
? npm package name (mynewcli): mynewcli
$ cd mynewcli
$ ./bin/run.js --version
mynewcli/0.0.0 darwin-x64 node-v9.5.0
$ ./bin/run.js --help
USAGE
  $ mynewcli [COMMAND]

COMMANDS
  hello
  help   display help for mynewcli

$ ./bin/run.js hello world
hello world! (./src/commands/hello/world.ts)
```
```
*Analysis: Shows interactive terminal session, includes prompts and output*

**From Pixi:**
```markdown
[![Real-time pixi_demo](https://github.com/prefix-dev/pixi/assets/12893423/0fc8f8c8-ac13-4c14-891b-dc613f25475b)](https://asciinema.org/a/636482)
```
*Analysis: Uses asciinema recording for CLI tools, shows real usage*

### Advanced Patterns

#### Interactive Examples with Syntax Highlighting

```markdown
\`\`\`typescript title="src/example.ts"
// Your code here
\`\`\`
```

#### Multi-File Examples

```markdown
### Example Project Structure

\`\`\`
my-project/
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
\`\`\`

**src/index.ts**:
\`\`\`typescript
// File content
\`\`\`

**package.json**:
\`\`\`json
// File content
\`\`\`
```

#### GIF/Video Examples for CLI Tools

```markdown
## Demo

![CLI Demo](https://github.com/user/repo/assets/demo.gif)

Or link to asciinema:
[![asciinema](https://asciinema.org/a/636482.svg)](https://asciinema.org/a/636482)
```

---

## Configuration Documentation

### Best Practices

1. **Default Values**: Always show what the default is
2. **Environment Variables**: Document all env vars
3. **Config Files**: Show file format and location
4. **Type Definitions**: Include TypeScript interfaces
5. **Priority Order**: Explain config precedence (CLI args > env vars > config file)
6. **Migration Guides**: For breaking changes

### Structure Template

```markdown
## Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | - | Your API key (required) |
| `timeout` | `number` | `5000` | Request timeout in ms |
| `debug` | `boolean` | `false` | Enable debug logging |

### Environment Variables

\`\`\`bash
export YOUR_PACKAGE_API_KEY="your-key"
export YOUR_PACKAGE_TIMEOUT=10000
\`\`\`

### Config File

Create a \`.your-package.json\` file in your project root:

\`\`\`json
{
  "apiKey": "your-key",
  "timeout": 10000,
  "debug": true
}
\`\`\`

### TypeScript Configuration

\`\`\`typescript
import { YourToolOptions } from 'your-package';

const config: YourToolOptions = {
  apiKey: process.env.API_KEY,
  timeout: 10000,
  debug: true,
};
\`\`\`

### Configuration Precedence

1. CLI arguments (highest priority)
2. Environment variables
3. Config file
4. Default values (lowest priority)
```

### Example from Real Projects

**Most CLI tools follow this pattern**:
- Environment variables for secrets
- Config file for project-specific settings
- CLI flags for one-off overrides
- Clear documentation of precedence

---

## Architecture Overview Patterns

### When to Include

- For complex systems (multiple modules/services)
- For libraries with extension points
- For projects with plugins/add-ons
- For agentic systems or multi-component tools

### Best Practices

1. **High-Level Diagram**: Show system architecture visually
2. **Key Components**: List and explain main modules
3. **Data Flow**: Show how data moves through the system
4. **Extension Points**: Document plugin/extension APIs
5. **Design Decisions**: Explain why certain choices were made

### Structure Template

```markdown
## Architecture

### System Overview

[Diagram showing high-level architecture]

### Core Components

#### Component A

Description of what it does and its responsibilities.

\`\`\`typescript
interface ComponentA {
  // Key methods/types
}
\`\`\`

#### Component B

Description...

### Data Flow

1. User input → Parser → Validator → Processor → Output
2. Each step transforms the data...

### Extension Points

Your package can be extended via:

\`\`\`typescript
import { Plugin } from 'your-package';

class MyPlugin implements Plugin {
  // Implementation
}
\`\`\`

### Performance Considerations

- Uses caching for [specific case]
- Parallel processing for [specific case]
- Memory-efficient streaming for [specific case]

### Design Decisions

- **Why TypeScript**: Type safety and better DX
- **Why [Library]**: Chosen for [specific reason]
```

### Visual Diagrams

**Tools for Creating Diagrams**:
- Mermaid.js (supported in GitHub markdown)
- Draw.io / diagrams.net
- Excalidraw
- Architecture Decision Records (ADRs)

**Mermaid Example**:
```markdown
\`\`\`mermaid
graph TD
    A[CLI Input] --> B[Parser]
    B --> C{Validator}
    C -->|Valid| D[Processor]
    C -->|Invalid| E[Error Handler]
    D --> F[Output Generator]
    F --> G[User]
\`\`\`
```

---

## Contributing Guidelines

### Essential Sections

1. **How to Contribute**
2. **Development Setup**
3. **Code Style**
4. **Testing Guidelines**
5. **Commit Message Format**
6. **Pull Request Process**
7. **Code of Conduct**

### Structure Template

```markdown
## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

\`\`\`bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/your-package.git
cd your-package

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Build the project
npm run build
\`\`\`

### Development

\`\`\`bash
# Watch mode for development
npm run dev

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck
\`\`\`

### Pull Request Process

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Code Style

- Follow the [TypeScript Style Guide](https://typescript-eslint.io/rules/)
- Use Prettier for formatting
- 100 character line limit
- Use ES modules

### Testing

Write tests for all new features. We use [Vitest/Jest].

\`\`\`typescript
describe('MyFeature', () => {
  it('should do something', () => {
    // Test code
  });
});
\`\`\`

### Reporting Bugs

Use the [issue tracker](https://github.com/USER/REPO/issues) and include:
- Clear description of the problem
- Minimal reproduction
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

### Feature Requests

We welcome feature requests! Please:
- Check existing issues first
- Describe the use case clearly
- Explain why the current solution is insufficient

### Code of Conduct

By participating, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
```

### Excellent Examples

**From TypeScript:**
```markdown
## Contribute

There are many ways to [contribute](https://github.com/microsoft/TypeScript/blob/main/CONTRIBUTING.md) to TypeScript.
* [Submit bugs](https://github.com/microsoft/TypeScript/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/microsoft/TypeScript/pulls).
* Engage with other TypeScript users and developers on [StackOverflow](https://stackoverflow.com/questions/tagged/typescript).
* Help each other in the [TypeScript Community Discord](https://discord.gg/typescript).
* Join the [#typescript](https://twitter.com/search?q=%23TypeScript) discussion on Twitter.
* [Contribute bug fixes](https://github.com/microsoft/TypeScript/blob/main/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
```
*Analysis: Multiple contribution paths, explicit CoC link*

---

## Example READMEs Analyzed

### 1. TypeScript
**URL**: https://github.com/microsoft/TypeScript

**Key Features**:
- Minimal badge cluster (CI, npm version, downloads, OpenSSF)
- Clear one-paragraph description
- Multiple installation methods (stable vs nightly)
- Links to community resources
- Multiple contribution paths

**Strengths**:
- Concise but comprehensive
- Strong community links
- Clear documentation hierarchy
- Security badge (OpenSSF)

**Applicable to This Project**:
- OpenSSF badge for security
- Community resources section
- Multiple contribution methods

### 2. Prettier
**URL**: https://github.com/prettier/prettier

**Key Features**:
- Banner with logo
- Centered layout with badges
- Supported languages listed clearly
- Before/after code example
- Custom badge for users to display
- Clear navigation links (Install, Options, CLI, API)

**Strengths**:
- Visual appeal (banner, centered layout)
- Immediate value demonstration (before/after)
- Excellent badge organization
- Clear documentation structure
- "User badge" creates community

**Applicable to This Project**:
- Before/after examples for agentic workflows
- Custom badge for users
- Clear navigation section
- Visual organization

### 3. Vite
**URL**: https://github.com/vitejs/vite

**Key Features**:
- Dark/light mode logo support (picture tag)
- Feature list with emoji
- Package version table with changelog links
- Clear project description
- Links to docs (external)

**Strengths**:
- Modern design (dark mode support)
- Clear feature highlights
- Package version tracking
- External documentation structure

**Applicable to This Project**:
- Dark mode support for logo
- Feature list with emoji
- Package version tracking if multi-package

### 4. oclif
**URL**: https://github.com/oclif/oclif

**Key Features**:
- Logo image at top
- Three badges (version, downloads, license)
- Table of contents (auto-generated)
- Clear section headers with emoji
- Migration guide (breaking changes section)
- Usage examples with terminal prompts
- Command topics section
- Related repositories section

**Strengths**:
- Comprehensive TOC
- Migration guide shows version management
- Terminal session examples (sh-session)
- Related repositories context
- Clear command structure

**Applicable to This Project**:
- Table of contents (if long README)
- Migration guides for breaking changes
- Terminal session examples for CLI
- Related repositories if applicable

### 5. Pixi
**URL**: https://github.com/prefix-dev/pixi

**Key Features**:
- Large banner image (picture tag with fallbacks)
- License badge, Discord badge, custom badge
- Feature highlights with bullet points
- Asciinema demo recording
- Multiple installation methods (curl, brew, winget)
- Shell-specific autocompletion setup
- Production readiness statement
- Future roadmap

**Strengths**:
- Visual banner (webp with png fallback)
- Shell-specific instructions
- Asciinema demo (excellent for CLI tools)
- Production readiness status
- Roadmap transparency

**Applicable to This Project**:
- Asciinema demo for CLI
- Shell-specific installation
- Production status section
- Roadmap section
- Multiple installation methods

### 6. Copilot.vim
**URL**: https://github.com/github/copilot.vim

**Key Features**:
- Clear description paragraph
- Access requirements (subscription)
- Platform-specific installation (Vim vs Neovim)
- OS-specific commands (Linux/macOS vs Windows)
- PowerShell-specific Windows instructions
- Inline link references for cleaner markdown

**Strengths**:
- Clear access requirements upfront
- Platform-specific installation paths
- OS-specific commands
- Clean link references

**Applicable to This Project**:
- Platform/OS-specific instructions if applicable
- Clear requirements section
- Clean link references

---

## Specific Recommendations for This Project

Based on the research and the context that this is a TypeScript CLI tool in the agentic/PRP (Prompt Response Processing) space, here are specific recommendations:

### README Structure

```markdown
# [Project Name]

[Badge cluster]

## Overview

[2-3 sentences describing what the tool does]

### Features

- [Feature 1]
- [Feature 2]
- [Feature 3]

## Quick Start

[Installation and first-use instructions]

## Usage

[Common usage patterns with examples]

## Configuration

[Configuration options]

## Architecture

[High-level overview - important for agentic systems]

## Contributing

[How to contribute]

## License

[License information]
```

### Badge Recommendations

**Essential (5 badges)**:
```markdown
[![CI](https://github.com/dustin/hacky-hack/actions/workflows/ci.yml/badge.svg)](https://github.com/dustin/hacky-hack/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/hacky-hack.svg)](https://www.npmjs.com/package/hacky-hack)
[![codecov](https://codecov.io/gh/dustin/hacky-hack/branch/main/graph/badge.svg)](https://codecov.io/gh/dustin/hacky-hack)
[![node version](https://img.shields.io/node/v/hacky-hack.svg)](https://nodejs.org/en/about/previous-releases)
[![License](https://img.shields.io/npm/l/hacky-hack.svg)](https://github.com/dustin/hacky-hack/blob/main/LICENSE)
```

**Optional (if applicable)**:
```markdown
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/dustin/hacky-hack/badge)](https://securityscorecards.dev/viewer/?uri=github.com/dustin/hacky-hack)
[![npm downloads](https://img.shields.io/npm/dm/hacky-hack.svg)](https://www.npmjs.com/package/hacky-hack)
```

### Quick Start Structure

Given this is a CLI tool with caching and PRP features:

```markdown
## Quick Start

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm or yarn

### Installation

\`\`\`bash
# Install globally
npm install -g hacky-hack

# Or use npx (no installation)
npx hacky-hack init
\`\`\`

### Initialize a Project

\`\`\`bash
# Create a new project
hacky-hack init my-project

# Navigate into the project
cd my-project

# Run your first prompt
hacky-hack run "Hello, world!"
\`\`\`

### Verify Installation

\`\`\`bash
hacky-hack --version
# Output: hacky-hack v1.0.0
\`\`\`
```

### Usage Examples Pattern

For an agentic/PRP system, show:

```markdown
## Usage Examples

### Basic Prompt Processing

\`\`\`bash
hacky-hack run "Explain quantum computing"
\`\`\`

### Using Cache

\`\`\`bash
# First call - caches the response
hacky-hack run "What is TypeScript?"

# Second call - returns from cache (instant)
hacky-hack run "What is TypeScript?"
\`\`\`

### Custom Configuration

\`\`\`typescript
import { HackyHack } from 'hacky-hack';

const agent = new HackyHack({
  cache: true,
  cacheDir: './.hh-cache',
  model: 'gpt-4',
});

const response = await agent.run('Your prompt here');
\`\`\`

### CLI Options

\`\`\`bash
hacky-hack run [prompt] [options]

Options:
  --cache          Enable caching (default: true)
  --cache-dir      Cache directory path
  --model          Model to use
  --debug          Enable debug logging
  --help           Show help
\`\`\`
```

### Configuration Documentation

```markdown
## Configuration

### Options

| Option | CLI Flag | Env Var | Default | Description |
|--------|----------|---------|---------|-------------|
| Cache | `--cache` | `HH_CACHE` | `true` | Enable disk caching |
| Cache Dir | `--cache-dir` | `HH_CACHE_DIR` | `.hh-cache` | Cache directory |
| Model | `--model` | `HH_MODEL` | `gpt-4` | AI model to use |

### Config File

Create a \`hacky-hack.config.json\`:

\`\`\`json
{
  "cache": true,
  "cacheDir": ".hh-cache",
  "model": "gpt-4",
  "debug": false
}
\`\`\`

### TypeScript API

\`\`\`typescript
import { HackyHackOptions } from 'hacky-hack';

const config: HackyHackOptions = {
  cache: true,
  cacheDir: '.hh-cache',
  model: 'gpt-4',
  debug: false,
};
\`\`\`
```

### Architecture Overview

For an agentic system, architecture is particularly important:

```markdown
## Architecture

### System Overview

\`\`\`mermaid
graph LR
    A[User Prompt] --> B[CLI Parser]
    B --> C[Cache Layer]
    C -->|Hit| D[Return Cached]
    C -->|Miss| E[PRP Engine]
    E --> F[AI Model]
    F --> G[Response Parser]
    G --> H[Cache Writer]
    H --> I[Output Formatter]
    I --> J[User]
\`\`\`

### Core Components

#### Cache Layer
Disk-based caching system with automatic invalidation...

#### PRP Engine
Prompt Response Processing engine that handles...

#### Response Parser
Parses and structures AI responses...

### Extension Points

Plugins can extend functionality via:

\`\`\`typescript
import { Plugin } from 'hacky-hack';

class CustomPlugin implements Plugin {
  name = 'custom-plugin';
  execute(context: Context): Promise<void> {
    // Custom logic
  }
}
\`\`\`
```

### Additional Recommendations

1. **Include an Asciinema Demo**
   - Record a terminal session showing the tool in action
   - Embed in README with link to asciinema.org
   - Shows actual usage better than static examples

2. **Performance Benchmarks**
   - If caching provides speed improvements, show metrics
   - Before/after timing comparisons
   - Cache hit rate statistics

3. **Status Indicators**
   - Add section about project status (Alpha/Beta/Production)
   - Roadmap for planned features
   - Known limitations

4. **Related Projects**
   - If this integrates with other tools, list them
   - Mention alternatives and why this is different

5. **Visual Assets**
   - Create a simple logo/banner
   - Use dark/light mode support
   - Add asciinema demo for CLI

---

## Resources and References

### Badge Services
- **Shields.io**: https://img.shields.io - Generic badge generator
- **Badge Fury**: https://badge.fury.io - npm package badges
- **Codecov**: https://codecov.io - Code coverage badges
- **OpenSSF Scorecard**: https://securityscorecards.dev - Security scoring

### README Tools
- **readme.so**: https://readme.so - README editor with templates
- **makeareadme.com**: https://www.makeareadme.com - README generator

### Documentation Tools
- **TypeDoc**: https://typedoc.org - API documentation for TypeScript
- **VitePress**: https://vitepress.dev - Documentation site generator
- **Docusaurus**: https://docusaurus.io - Facebook's documentation platform

### Diagram Tools
- **Mermaid.js**: https://mermaid.js.org - Diagrams in markdown (supported on GitHub)
- **Draw.io**: https://app.diagrams.net - Free diagram tool
- **Excalidraw**: https://excalidraw.com - Hand-drawn style diagrams

### CLI Demo Tools
- **Asciinema**: https://asciinema.org - Terminal session recording
- **Terminalizer**: https://terminalizer.com - Terminal recording tool
- **svg-term**: https://github.com/marionebl/svg-term - Terminal to SVG

### Example READMEs Referenced
- TypeScript: https://github.com/microsoft/TypeScript
- Prettier: https://github.com/prettier/prettier
- Vite: https://github.com/vitejs/vite
- oclif: https://github.com/oclif/oclif
- Pixi: https://github.com/prefix-dev/pixi
- Copilot.vim: https://github.com/github/copilot.vim

---

## Conclusion

The key to a great README is:

1. **Start with the user**: What do they need to know first?
2. **Be concise**: Respect the reader's time
3. **Show, don't just tell**: Use examples, demos, diagrams
4. **Keep it updated**: Documentation should match current code
5. **Make it scannable**: Use headings, lists, badges effectively
6. **Link to deeper docs**: Don't put everything in README

For a TypeScript CLI tool in the agentic/PRP space, prioritize:
- Clear Quick Start (< 5 minutes to first success)
- Working usage examples (with cache demonstration)
- Architecture overview (agentic systems are complex)
- Performance metrics (caching benefits)
- CLI demo (asciinema or GIF)

---

*Research compiled by Claude Code*
*Date: 2026-01-13*
