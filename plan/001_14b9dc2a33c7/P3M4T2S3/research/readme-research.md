# README.md Documentation Research for TypeScript Node.js CLI Projects

Research conducted: 2026-01-13
Focus: Best practices for developer tools/CLIs, particularly agentic/AI tools

---

## 1. Standard README Sections for CLI Tools

### Essential Sections (Priority Order)

#### A. Project Title and Badge Area

```markdown
# Project Name [![badge][badge-url]]

[![npm version](https://badge.fury.io/js/project-name.svg)](https://www.npmjs.com/package/project-name)
[![Build Status](https://github.com/user/project/actions/workflows/test.yml/badge.svg)](https://github.com/user/project/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
```

**Recommended Badges for TypeScript CLI Tools:**

- npm version/release status
- GitHub Actions build status
- License type
- TypeScript version
- Code coverage (if applicable)
- Node version support
- Downloads per month (npm)
- Dependabot/dependencies status
- Documentation status

#### B. Short Description (Elevator Pitch)

```markdown
> A concise one-liner describing what the tool does and its main benefit.

ProjectName is a powerful CLI tool that helps developers [solve specific problem]
by [providing unique value proposition]. Built with TypeScript for [key benefit].
```

#### C. Table of Contents (For READMEs > 200 lines)

```markdown
## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
```

#### D. Features Overview

```markdown
## Features

- ✨ **Feature 1**: Clear, action-oriented description
- 🚀 **Feature 2**: Performance or capability highlight
- 🔧 **Feature 3**: Configuration or extensibility
- 📦 **Feature 4**: Integration or compatibility
- 🛡️ **Feature 5**: Security or reliability
- 🎨 **Feature 6**: UX or DX improvement
```

**Best Practices:**

- Use emojis sparingly but consistently
- Group related features
- Focus on user benefits, not just technical capabilities
- Limit to 6-8 key features
- Link to detailed docs where appropriate

#### E. Installation Instructions

````markdown
## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn >= 1.22.0

### Install via npm (Recommended)

```bash
npm install -g project-name
```
````

### Install via yarn

```bash
yarn global add project-name
```

### Install via npx (Without Installation)

```bash
npx project-name [options]
```

### Verify Installation

```bash
project-name --version
```

````

**Best Practices:**
- Provide multiple installation methods
- Include prerequisites clearly
- Add version verification step
- Note any system requirements (OS, dependencies)
- Include troubleshooting tips for common issues

#### F. Quick Start Guide
```markdown
## Quick Start

Get started in less than 2 minutes:

```bash
# Initialize a new project
project-name init my-project

# Navigate to project
cd my-project

# Run the default command
project-name run
````

That's it! You're now ready to use ProjectName. Check out the [Usage](#usage) section for more details.

````

**Best Practices:**
- Keep it under 5 steps
- Show immediate results
- Provide copy-pasteable code blocks
- Link to detailed usage section
- Include expected output

#### G. Usage Examples with Common Commands
```markdown
## Usage

### Basic Command Structure

```bash
project-name <command> [options] <arguments>
````

### Available Commands

| Command  | Alias | Description              |
| -------- | ----- | ------------------------ |
| `init`   | `i`   | Initialize a new project |
| `build`  | `b`   | Build the project        |
| `run`    | `r`   | Run the project          |
| `deploy` | `d`   | Deploy to production     |

### Command Examples

#### Initialize a Project

```bash
# Interactive mode
project-name init

# With specific name and template
project-name init my-app --template typescript

# With all options
project-name init my-app --template typescript --git --install
```

#### Build Command

```bash
# Basic build
project-name build

# Build with watch mode
project-name build --watch

# Build with specific output
project-name build --output ./dist --minify
```

#### Run Command

```bash
# Run with default configuration
project-name run

# Run with environment
project-name run --env production

# Run with custom port
project-name run --port 3000
```

### Global Options

| Option      | Alias | Description             | Default                      |
| ----------- | ----- | ----------------------- | ---------------------------- |
| `--help`    | `-h`  | Show help message       | -                            |
| `--version` | `-v`  | Show version number     | -                            |
| `--verbose` | `-V`  | Enable verbose logging  | `false`                      |
| `--config`  | `-c`  | Path to config file     | `./project-name.config.json` |
| `--dry-run` | `-d`  | Show what would be done | `false`                      |

````

**Best Practices:**
- Group commands by functionality
- Show both long and short option forms
- Include default values in options table
- Provide realistic, copy-pasteable examples
- Show progressive complexity (basic → advanced)
- Include expected output where helpful

#### H. Configuration Options
```markdown
## Configuration

### Configuration File

ProjectName looks for configuration in the following order:

1. `project-name.config.ts` (TypeScript, recommended)
2. `project-name.config.js` (JavaScript)
3. `project-name.config.json` (JSON)
4. `.projectnamerc` (JSON/RC file)
5. `project-name` section in `package.json`

### Example Configuration

**project-name.config.ts**
```typescript
import { defineConfig } from 'project-name';

export default defineConfig({
  // Project settings
  name: 'my-project',
  version: '1.0.0',

  // Input/Output
  entry: './src/index.ts',
  outDir: './dist',

  // Build options
  target: 'node18',
  minify: true,
  sourcemap: true,

  // CLI behavior
  verbose: false,
  colors: true,

  // Plugins
  plugins: [
    '@project-name/plugin-typescript',
    '@project-name/plugin-eslint'
  ]
});
````

### Environment Variables

| Variable                   | Description           | Default       |
| -------------------------- | --------------------- | ------------- |
| `PROJECT_NAME_ENV`         | Environment to run in | `development` |
| `PROJECT_NAME_API_KEY`     | API key for services  | -             |
| `PROJECT_NAME_LOG_LEVEL`   | Logging level         | `info`        |
| `PROJECT_NAME_CONFIG_PATH` | Custom config path    | -             |

### CLI Override Priority

Configuration values are merged in the following order (later overrides earlier):

1. Default configuration
2. Config file values
3. Environment variables
4. CLI flags

````

**Best Practices:**
- Show multiple config file formats
- Provide TypeScript example with types
- Document all available options
- Explain configuration merge/override behavior
- Include validation rules
- Show common configuration patterns

#### I. Architecture Overview
```markdown
## Architecture

### High-Level Overview

````

┌─────────────────────────────────────────────────────────────┐
│ CLI Interface │
│ (Commander.js/Yargs + Inquirer.js + Chalk + Ora) │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Command Layer │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Init │ │ Build │ │ Run │ │ Deploy │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Core Services │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Config │ │ File System │ │ Logger │ │
│ │ Manager │ │ Operations │ │ │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Plugin │ │ Task │ │ AI Agent │ │
│ │ System │ │ Orchestrator │ │ Integration │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Data & Storage │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Local Files │ │ Cache │ │ State │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘

```

### Key Components

#### CLI Framework
Built on **Commander.js** for command parsing and **Inquirer.js** for interactive prompts.

#### Plugin System
Modular architecture allowing custom plugins to extend functionality.

#### Agent Orchestrator
Manages AI agent lifecycle, task distribution, and result aggregation.

#### State Management
Persistent state storage for resumable operations and crash recovery.

### Data Flow

1. User enters command
2. CLI parses arguments and options
3. Configuration is loaded and merged
4. Command handler is invoked
5. Core services process the request
6. Results are formatted and displayed
7. State is persisted for recovery
```

**Best Practices:**

- Use ASCII diagrams for high-level architecture
- Link to detailed architecture docs (ADR, docs folder)
- Explain key design decisions
- Show data flow
- Mention technologies used
- Keep it high-level (avoid implementation details)

#### J. Development Setup

````markdown
## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git >= 2.0

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/user/project-name.git
cd project-name

# Install dependencies
npm install

# Install development dependencies (including Husky)
npm run setup:dev

# Build the project
npm run build

# Run tests
npm test

# Link for local development
npm link
project-name --version
```
````

### Available Scripts

| Script                  | Description               |
| ----------------------- | ------------------------- |
| `npm run build`         | Build the project         |
| `npm run dev`           | Run in watch mode         |
| `npm run test`          | Run tests                 |
| `npm run test:watch`    | Run tests in watch mode   |
| `npm run test:coverage` | Generate coverage report  |
| `npm run lint`          | Run ESLint                |
| `npm run lint:fix`      | Fix linting issues        |
| `npm run format`        | Format code with Prettier |
| `npm run clean`         | Clean build artifacts     |
| `npm run docs`          | Generate documentation    |

### Project Structure

```
project-name/
├── src/
│   ├── cli/              # CLI commands and interface
│   ├── core/             # Core business logic
│   ├── services/         # Shared services
│   ├── plugins/          # Plugin system
│   ├── utils/            # Utility functions
│   └── index.ts          # Entry point
├── tests/                # Test files
├── docs/                 # Additional documentation
├── examples/             # Usage examples
└── package.json
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- init.test.ts

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

````

**Best Practices:**
- Include all setup steps
- Link to contributing guide for details
- Show project structure
- List all npm scripts
- Include testing instructions
- Note any special development considerations

#### K. Contributing Guidelines
```markdown
## Contributing

We love contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Summary

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
- Write tests for new features
- Ensure all tests pass (`npm test`)
- Follow the existing code style
- Update documentation as needed
````

**Best Practices:**

- Link to detailed CONTRIBUTING.md
- Provide quick summary for simple contributions
- Mention commit message conventions
- Include code of conduct link if applicable

#### L. License

```markdown
## License

MIT © [Your Name]

[View license file](LICENSE)
```

---

## 2. README Best Practices from Open-Source Projects

### General Best Practices

#### A. Scannability

- Use clear headings with consistent hierarchy
- Include a table of contents for longer READMEs
- Use bullet points and tables for easy scanning
- Limit line length to 80-100 characters for code blocks
- Use collapsible sections for optional details

#### B. Completeness

- Answer: What? Why? How? Who?
- Include installation and basic usage
- Provide examples for common use cases
- Link to further documentation
- Include troubleshooting section

#### C. Clarity

- Use simple, direct language
- Avoid jargon where possible
- Define technical terms when used
- Use present tense
- Write in active voice
- Be consistent with terminology

#### D. Visual Appeal

- Use appropriate emojis (consistent set)
- Include badges at the top
- Use ASCII art for diagrams (when appropriate)
- Add screenshots/GIFs for visual tools
- Use code blocks with syntax highlighting
- Maintain consistent formatting

#### E. Maintenance

- Keep documentation in sync with code
- Update examples with each release
- Review and update quarterly
- Remove outdated information
- Add "Last Updated" timestamp if frequently changing

#### F. Accessibility

- Use descriptive alt text for images
- Ensure good contrast for badges
- Use clear section headers
- Avoid color-only indicators
- Provide text alternatives for visual diagrams

---

## 3. How to Document CLI Arguments and Options Effectively

### Best Practices for CLI Documentation

#### A. Command Structure Template

````markdown
### Command Name

**Description**: Clear, concise description of what the command does.

**Usage**:

```bash
project-name <command> [required-arg] [optional-arg] [options]
```
````

**Aliases**: `cmd`, `c` (if applicable)

**Examples**:

```bash
# Basic usage
project-name command input.txt

# With options
project-name command input.txt --output result.txt --verbose

# All options
project-name command input.txt -o result.txt -v --format json
```

````

#### B. Options Documentation Template

**Table Format (Recommended for quick reference)**:
```markdown
| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--output` | `-o` | string | `./output` | Output directory path |
| `--format` | `-f` | string | `json` | Output format (json, yaml, xml) |
| `--verbose` | `-v` | boolean | `false` | Enable detailed logging |
| `--config` | `-c` | string | `./config.json` | Path to config file |
| `--force` | `-f` | boolean | `false` | Override existing files |
````

**List Format (For detailed documentation)**:

```markdown
#### Options

- `--output, -o <path>` (default: `./output`)
  - Specify the output directory path
  - Relative paths are resolved from current working directory
  - Example: `--output ./dist` or `-o ./dist`

- `--format, -f <type>` (default: `json`)
  - Set the output format
  - Available formats: `json`, `yaml`, `xml`, `csv`
  - Example: `--format yaml` or `-f yaml`

- `--verbose, -v` (default: `false`)
  - Enable verbose logging
  - Shows detailed execution information
  - Useful for debugging
```

#### C. Arguments Documentation Template

```markdown
#### Arguments

| Argument   | Type   | Required | Description                                              |
| ---------- | ------ | -------- | -------------------------------------------------------- |
| `<input>`  | string | Yes      | Input file path                                          |
| `<output>` | string | No       | Output file path (defaults to input with .out extension) |
| `[format]` | string | No       | Output format (json, yaml, xml)                          |

**Notes**:

- Arguments with `<>` are required
- Arguments with `[]` are optional
- Order matters for positional arguments
```

#### D. Examples by Use Case

````markdown
### Usage Examples

#### Basic Examples

**Single file processing**:

```bash
project-name process input.txt
```
````

**Multiple files**:

```bash
project-name process file1.txt file2.txt file3.txt
```

#### Intermediate Examples

**With custom output**:

```bash
project-name process input.txt --output ./results/result.json
```

**With specific format**:

```bash
project-name process input.txt --format yaml --output result.yaml
```

#### Advanced Examples

**Pipeline with multiple options**:

```bash
project-name process input.txt \
  --output ./results \
  --format json \
  --verbose \
  --force \
  --config ./custom-config.json
```

**Using glob patterns**:

```bash
project-name process "./src/**/*.ts" --output ./dist
```

**With environment variable**:

```bash
PROJECT_NAME_API_KEY=xxx project-name process input.txt
```

#### Expected Output

Show what the user should see:

```bash
$ project-name process input.txt

✓ Processing input.txt
✓ Generating output
✓ Writing to ./output/result.json

Done! Processed 1 file in 0.5s
```

````

#### E. Error Messages and Troubleshooting
```markdown
### Common Issues

**Error: "Input file not found"**
- Cause: The specified input file doesn't exist
- Solution: Check the file path and ensure it's correct
- Example: Use absolute path if relative path fails

**Error: "Permission denied"**
- Cause: Insufficient permissions to write to output directory
- Solution: Ensure write permissions or use a different output directory

**Error: "Invalid format"**
- Cause: Specified format is not supported
- Solution: Use one of: json, yaml, xml, csv

### Debug Mode

Enable verbose logging for troubleshooting:
```bash
project-name command --verbose
````

Or set environment variable:

```bash
PROJECT_NAME_DEBUG=1 project-name command
```

````

---

## 4. Examples of Excellent READMEs for Similar Projects

### Recommended Projects to Study

#### CLI Frameworks
1. **Oclif** (Heroku's CLI Framework)
   - URL: https://github.com/oclif/oclif
   - Why: Comprehensive multi-command CLI framework documentation
   - Key features: Clear command structure, plugin system docs, generator guides

2. **Commander.js**
   - URL: https://github.com/tj/commander.js
   - Why: Simple, well-documented CLI parser
   - Key features: Clean API examples, options documentation, TypeScript support

3. **Yargs**
   - URL: https://github.com/yargs/yargs
   - Why: Feature-rich argument parser with excellent docs
   - Key features: Complex options examples, middleware docs, plugin system

#### Developer Tools
4. **TS-Node**
   - URL: https://github.com/TypeStrong/ts-node
   - Why: TypeScript execution tool with great docs
   - Key features: Configuration options, usage examples, troubleshooting

5. **Nx** (Monorepo tool)
   - URL: https://github.com/nrwl/nx
   - Why: Complex CLI with extensive documentation
   - Key features: Plugin system, caching docs, performance guides

6. **Vite**
   - URL: https://github.com/vitejs/vite
   - Why: Modern build tool with excellent CLI docs
   - Key features: Quick start, configuration, plugin system

#### AI/Agentic Tools
7. **AutoGPT**
   - URL: https://github.com/Significant-Gravitas/AutoGPT
   - Why: Popular AI agent with good docs
   - Key features: Configuration, agent setup, mode documentation

8. **CrewAI**
   - URL: https://github.com/joaomdmoura/crewAI
   - Why: Multi-agent framework documentation
   - Key features: Agent creation, task orchestration, examples

9. **LangChain CLI**
   - URL: https://github.com/langchain-ai/langchain
   - Why: AI framework with CLI components
   - Key features: Quick start, examples, integration guides

#### TypeScript Projects
10. **TypeScript**
    - URL: https://github.com/microsoft/TypeScript
    - Why: Language with excellent CLI docs
    - Key features: Compiler options, tsc documentation, config reference

11. **TSX**
    - URL: https://github.com/privatenumber/tsx
    - Why: TypeScript execution tool
    - Key features: Simple README, clear options, usage examples

### What Makes These READMEs Excellent

#### Common Characteristics
- **Clear value proposition in first 3 lines**
- **Installation instructions visible without scrolling**
- **Quick start example within 10 seconds**
- **Code examples with syntax highlighting**
- **Links to further resources**
- **Visual elements (badges, diagrams, GIFs)**
- **Maintained and up-to-date**
- **Community contribution guidelines**

#### Standout Features
- Oclif: Generator walkthrough, plugin development guide
- Commander.js: Progressive examples (simple → complex)
- Yargs: Comprehensive options reference
- Nx: Architecture diagrams, decision records
- Vite: Migration guides, performance benchmarks
- CrewAI: Use case examples, video tutorials

---

## 5. Common Markdown Patterns for Code Blocks, Badges, Links

### Badges

#### Badge Sources
```markdown
# Build Status
[![Build Status](https://github.com/user/project/actions/workflows/test.yml/badge.svg)](https://github.com/user/project/actions/workflows/test.yml)

# npm Version
[![npm version](https://badge.fury.io/js/project-name.svg)](https://www.npmjs.com/package/project-name)

# npm Downloads
[![Downloads](https://img.shields.io/npm/dm/project-name.svg)](https://www.npmjs.com/package/project-name)

# License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# TypeScript
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

# Node Version
[![node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

# Code Coverage
[![Coverage Status](https://coveralls.io/repos/github/user/project/badge.svg?branch=main)](https://coveralls.io/github/user/project?branch=main)

# Dependencies
[![Known Vulnerabilities](https://snyk.io/test/github/user/project/badge.svg)](https://snyk.io/test/github/user/project)

# Gitter/Chat
[![Gitter chat](https://badges.gitter.im/user/project.png)](https://gitter.im/user/project)

# Documentation
[![Documentation](https://img.shields.io/badge/docs-latest-blue.svg)](https://user.github.io/project/)
````

#### Popular Badge Services

- **Shields.io**: https://shields.io/ (Most flexible)
- **Badge.fury.io**: https://badge.fury.io/ (npm packages)
- **Travis CI / GitHub Actions**: Built-in badges
- **Coveralls**: https://coveralls.io/ (Code coverage)
- **Snyk**: https://snyk.io/ (Security vulnerabilities)

### Code Blocks

#### Syntax Highlighting

````markdown
# JavaScript

```javascript
const greeting = 'Hello, World!';
console.log(greeting);
```
````

# TypeScript

```typescript
interface Greeting {
  message: string;
}

const greeting: Greeting = { message: 'Hello, World!' };
```

# Bash/Shell

```bash
npm install project-name
project-name --help
```

# JSON

```json
{
  "name": "project-name",
  "version": "1.0.0"
}
```

# YAML

```yaml
name: project-name
version: 1.0.0
```

````

#### Code Block Features
```markdown
# With filename (GitHub Flavored Markdown)
```typescript title="src/index.ts"
// Code here
````

# With line highlighting (some platforms)

```typescript {1,3-5}
const a = 1;
const b = 2;
const c = 3;
```

# Diff highlighting

```diff
- const oldName = 'old';
+ const newName = 'new';
```

````

#### Inline Code
```markdown
Use `backticks` for inline code.

For code within text: Use the `--verbose` flag to enable logging.

For file paths: Edit `src/config.ts` to change settings.

For commands: Run `npm install` to install dependencies.
````

### Links

#### Internal Links (Anchors)

```markdown
# Section header

## Installation Instructions

# Link to section

See the [Installation Instructions](#installation-instructions) section.

# Link with custom text

Jump to the [Configuration](#configuration-options) section.

# Link to subsection

Check out [Quick Start](#quick-start) for a brief introduction.
```

#### External Links

```markdown
# Basic link

[GitHub](https://github.com/user/project)

# Link with title attribute

[GitHub](https://github.com/user/project 'Visit GitHub')

# Reference-style links

[GitHub]: https://github.com/user/project

Visit [GitHub][GitHub] for more info.

# Auto-links (URLs as links)

https://github.com/user/project
```

#### Images

```markdown
# Basic image

![Alt text](image-url)

# With dimensions

![Alt text](image-url =300x200)

# Clickable image

[![Logo](logo.png)](https://github.com/user/project)

# With title

![Alt text](image-url 'Title text')
```

### Tables

#### Basic Tables

```markdown
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

#### Alignment

```markdown
| Left | Center | Right |
| :--- | :----: | ----: |
| L    |   C    |     R |
| Left | Center | Right |
```

#### Complex Tables

```markdown
| Feature      | Status        | Notes                 |
| ------------ | ------------- | --------------------- |
| ✨ Feature 1 | ✅ Stable     | Production ready      |
| 🚀 Feature 2 | 🚧 Beta       | Under development     |
| 🔧 Feature 3 | ❌ Deprecated | Use Feature 1 instead |

See [full feature list](#features) for details.
```

### Lists

#### Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
```

#### Nested Lists

```markdown
1. Item 1
   - Subitem 1.1
   - Subitem 1.2
2. Item 2
   1. Subitem 2.1
   2. Subitem 2.2
```

#### Definition Lists (GitHub Flavored Markdown)

```markdown
Term 1
: Definition 1

Term 2
: Definition 2
: Definition 2b
```

### Special Formatting

#### Emojis

```markdown
# Use emojis sparingly and consistently

✨ Feature 1
🚀 Feature 2
🔧 Feature 3

# Or use consistent emoji set

✅ Completed
❌ Failed
⚠️ Warning
ℹ️ Information
💡 Tip
📝 Note
```

#### Callouts/Alerts (GitHub Flavored Markdown)

```markdown
> **Note**
> This is an important note.

> **Warning**
> This is a warning message.

> **Tip**
> This is a helpful tip.

> **Important**
> This is critical information.
```

#### Horizontal Rules

```markdown
---

---

---
```

#### Collapsible Sections (HTML in Markdown)

```markdown
<details>
<summary>Click to expand</summary>

This content is hidden by default.

</details>
```

### Keyboard Shortcuts

```markdown
Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.

Use <kbd>npm install</kbd> to install.
```

---

## Key Recommendations Summary

### For Your Agentic CLI Tool README

#### Top Priority Sections

1. **Title with badges** (npm version, build status, license, TypeScript)
2. **One-line description** explaining what the tool does
3. **Quick Start** (3-5 steps to get running)
4. **Basic Usage** with common commands
5. **Installation** instructions (npm, yarn, npx)
6. **Configuration** file examples
7. **Features** overview (6-8 key features)

#### Medium Priority Sections

8. **Advanced Usage** examples
9. **Architecture** overview (diagram)
10. **Development** setup
11. **Contributing** guidelines link
12. **Troubleshooting** common issues
13. **License** information

#### Nice-to-Have Sections

14. Table of Contents (if README is long)
15. **Changelog** link
16. **Roadmap**
17. **FAQ**
18. **Community** links (Discord, discussions)
19. **Acknowledgments**
20. **Related Projects**

#### Documentation Tips

- Keep README under 400 lines if possible
- Move detailed docs to `/docs` folder
- Use consistent formatting throughout
- Include at least one complete working example
- Add GIFs/screenshots for visual tools
- Review and update monthly
- Get feedback from new users

#### CLI-Specific Tips

- Show command structure before examples
- Document both long and short option forms
- Include default values in options tables
- Provide examples for each major command
- Show expected output where helpful
- Document error messages and solutions
- Use version-specific examples (avoid breaking examples)

#### TypeScript-Specific Tips

- Show TypeScript config examples
- Document type definitions
- Include ts-node/tsx usage
- Show type checking commands
- Document type-safe configuration

#### Agentic/AI Tool Tips

- Explain agent capabilities clearly
- Document AI model requirements
- Show example agent configurations
- Include cost/usage estimates
- Document rate limiting
- Explain data handling/privacy
- Show troubleshooting for AI-specific issues

---

## URLs and Resources

### Documentation Best Practices

- https://www.writethedocs.org/
- https://documentation.divio.com/
- https://github.com/github/roadmap (GitHub's public roadmap)
- https://cli.github.com/manual/ (GitHub CLI documentation)

### README Examples (Study These)

- https://github.com/oclif/oclif
- https://github.com/tj/commander.js
- https://github.com/yargs/yargs
- https://github.com/vitejs/vite
- https://github.com/nrwl/nx
- https://github.com/microsoft/TypeScript

### Badge Services

- https://shields.io/ (Custom badges)
- https://badge.fury.io/ (npm badges)
- https://github.com/badges/shields (Shields.io repo)

### Markdown Resources

- https://github.github.com/gfm/ (GitHub Flavored Markdown)
- https://www.markdownguide.org/ (Markdown Guide)
- https://spec.commonmark.org/ (CommonMark spec)

### CLI-Specific Resources

- https://clig.dev/ (Command Line Interface Guidelines)
- https://github.com/awesome-cli/awesome-cli (Awesome CLI list)
- https://github.com/topics/cli (GitHub CLI topic)

### TypeScript Resources

- https://www.typescriptlang.org/docs/
- https://github.com/typescript-cheatsheets/react

### Open Source Guides

- https://opensource.guide/
- https://github.com/github/open-source-guide

---

**Research Summary**: This document provides a comprehensive foundation for creating an excellent README for TypeScript Node.js CLI projects, with special focus on agentic/AI tools. Follow the templates, study the examples, and iterate based on user feedback.
