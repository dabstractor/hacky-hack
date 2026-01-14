# User Guide Research: Best Practices for CLI Tools and Developer Documentation

**Research Date:** 2026-01-13
**Purpose:** Research compilation for creating PRP for docs/user-guide.md

---

## Table of Contents

1. [User Guide Structure Best Practices](#1-user-guide-structure-best-practices)
2. [Section Ordering Recommendations](#2-section-ordering-recommendations)
3. [Writing Style Guidelines](#3-writing-style-guidelines)
4. [Code Example Formatting](#4-code-example-formatting)
5. [Troubleshooting Guide Best Practices](#5-troubleshooting-guide-best-practices)
6. [Migration Guide Patterns](#6-migration-guide-patterns)
7. [Excellent Examples & References](#7-excellent-examples--references)

---

## 1. User Guide Structure Best Practices

### 1.1 Progressive Disclosure Model

**Core Principle:** Start simple, gradually introduce complexity

```
Level 1: Quick Start (5 minutes)
    ↓
Level 2: Basic Usage (30 minutes)
    ↓
Level 3: Intermediate Features (1-2 hours)
    ↓
Level 4: Advanced Workflows (Reference material)
```

**Implementation:**
- **Quick Start**: One-page, get running immediately
- **Basic Usage**: Core commands and concepts
- **Intermediate**: Real-world workflows
- **Advanced**: Configuration, optimization, integration

### 1.2 The "Three-Click Rule"

Users should find any information within:
- Maximum 3 clicks from the home page
- Or maximum 3 seconds of scanning

**Navigation Structure:**
```
Home
├── Quick Start (immediate access)
├── Guides (organized by task)
│   ├── Installation
│   ├── Basic Usage
│   └── Advanced Workflows
├── Reference (organized by component)
│   ├── Commands
│   ├── Configuration
│   └── API
└── Support
    ├── Troubleshooting
    ├── FAQ
    └── Community
```

### 1.3 Documentation Types Pyramid

From Diátaxis Framework (widely adopted in 2024-2025):

```
        ┌─────────────┐
        │  Reference  │  ← Structured, searchable, code-centric
        ├─────────────┤
        │  Tutorials  │  ← Lesson-oriented, learning-focused
        ├─────────────┤
        │   How-To    │  ← Problem-oriented, goal-focused
        ├─────────────┤
        │ Explanation │  ← Discussion-oriented, understanding-focused
        └─────────────┘
```

**Balance:**
- **Tutorials**: 20% - Learning-oriented
- **How-To Guides**: 30% - Problem-solving
- **Explanation**: 20% - Background context
- **Reference Material**: 30% - Technical reference

---

## 2. Section Ordering Recommendations

### 2.1 Recommended User Guide Outline

```markdown
# [Tool Name] User Guide

## 1. Introduction
- What is [Tool Name]?
- Key benefits (3-5 bullet points)
- What you'll learn
- Prerequisites
- Installation

## 2. Quick Start (5-minute setup)
- First command example
- Expected output
- Verify installation
- Next steps link

## 3. Core Concepts
- Architecture overview
- Key terminology
- Mental model
- Simple diagram

## 4. Basic Usage
- Common workflows
- Essential commands
- Configuration basics
- First project example

## 5. Advanced Features
- Customization
- Performance optimization
- Integration patterns
- Plugins/extensions

## 6. Workflows & Use Cases
- Real-world scenarios
- Industry-specific examples
- Best practices
- Anti-patterns

## 7. Configuration
- Configuration file reference
- Environment variables
- Command-line options
- Profile management

## 8. Troubleshooting
- Common issues
- Error messages
- Debug mode
- Getting help

## 9. Migration Guide
- Upgrading between versions
- Breaking changes
- Migration checklist
- Rollback procedures

## 10. Reference
- Command reference
- API documentation
- Glossary
- Changelog
```

### 2.2 Section Length Guidelines

| Section | Ideal Length | Content Type |
|---------|--------------|--------------|
| Quick Start | 1 page | Action-oriented |
| Introduction | 2-3 paragraphs | Context |
| Core Concepts | 1-2 pages | Conceptual |
| Basic Usage | 3-5 pages | Tutorial + How-To |
| Advanced Features | 5-10 pages | How-To + Explanation |
| Workflows | 5-15 pages | Scenario-based |
| Configuration | Variable | Reference |
| Troubleshooting | Variable | Problem-solving |
| Migration | Variable | Procedural |

### 2.3 Front-Loading Key Information

**Above the Fold (First Screen):**
- Tool name and one-line description
- Current version
- Installation command (copy-paste ready)
- Quick Start link
- What's new in this version

**First Section Priority:**
1. Installation (make it work)
2. First example (see it work)
3. Basic customization (make it yours)
4. Next steps (keep going)

---

## 3. Writing Style Guidelines

### 3.1 Voice and Tone

**Characteristics:**
- **Direct**: "Run this command" not "You should run this command"
- **Active**: "The tool processes files" not "Files are processed by the tool"
- **Concise**: Delete every word that doesn't add value
- **Empathetic**: Anticipate user questions and confusion

**Voice Examples:**

| Poor | Better | Why |
|------|--------|-----|
| "It is recommended that you run the following command" | "Run this command:" | Direct, actionable |
| "The configuration file, which is located in your home directory..." | "The config file in ~/.config/tool..." | Shorter, precise |
| "In order to install..." | "To install..." | Concise |

### 3.2 Addressing the User

**Second Person (You):**
```markdown
# Good
You can run the tool in any directory. Your configuration is stored in ~/.config/tool.

# Avoid
The tool can be run in any directory. Configuration is stored in ~/.config/tool.
```

**Imperative Mood:**
```markdown
# Good
Install the tool using npm:
npm install -g toolname

# Avoid
The tool should be installed using npm:
npm install -g toolname
```

### 3.3 Clarity Principles

**1. One Idea Per Sentence**
```markdown
# Poor
The tool processes files and can handle multiple formats including JSON, YAML, and XML while also supporting compression.

# Better
The tool processes files in multiple formats: JSON, YAML, and XML. It also supports compression.
```

**2. Put Conditions First**
```markdown
# Poor
Run the command with --verbose to see detailed output.

# Better
To see detailed output, run:
command --verbose

# Alternative (for side notes)
**Note:** Use --verbose for detailed output.
```

**3. Use Familiar Words**
```markdown
# Avoid
Utilize the aforementioned mechanism to instantiate the configuration.

# Prefer
Use the config command to set up your environment.
```

### 3.4 Consistency Standards

**Terminology:**
- Create a glossary of technical terms
- Use terms consistently (never "command", "cmd", "instruction" interchangeably)
- Capitalize defined terms on first use

**Code/Command Formatting:**
- Commands: `command-name` (inline, backticks)
- Filenames: `filename.ext` (inline, backticks)
- Configuration keys: `"keyName"` (inline, backticks, quotes)
- User input: Bold in examples
- Placeholders: `<placeholder>` (angle brackets)

**UI Element References:**
- Buttons: **Click Save**
- Menu items: **File → Save As**
- Tabs: **In the Configuration tab...**
- Fields: **In the Hostname field...**

---

## 4. Code Example Formatting

### 4.1 Code Block Standards

**Language Specification:**
```markdown
\```bash
# Always specify language for syntax highlighting
npm install toolname
\```

\```javascript
// JavaScript examples get highlighting
const config = require('./config');
\```
```

**Command Examples:**
```markdown
# Include prompt to show this is a command
$ toolname command --option value

# Show expected output
Output: Success!

# For multi-step examples
$ step1
$ step2
Output: Result
```

### 4.2 Code Block Annotation

**Line Numbers (for long examples):**
```markdown
\```bash {1-3}
# Lines 1-3 are highlighted
npm install -g toolname    # Install globally
toolname init              # Initialize project
toolname build             # Build project
\```
```

**Inline Comments:**
```markdown
\```bash
toolname run \
  --port 8080 \           # Port number
  --host localhost \      # Host address
  --verbose               # Enable debug output
\```
```

### 4.3 Example Quality Checklist

Every code example should:
- [ ] Be copy-paste runnable
- [ ] Include expected output
- [ ] Show prerequisites if any
- [ ] Explain what it does
- [ ] Use realistic values (not "foo", "bar")
- [ ] Handle errors (show what happens on failure)
- [ ] Follow project style guidelines

### 4.4 Example Patterns

**1. Basic Command Pattern:**
```markdown
### Running a Build

Build your project with:

\```bash
$ toolname build
Building...
✓ Compiled successfully
Output: dist/app.js (42 KB)
\```

**Options:**
- `--watch` - Watch for changes and rebuild
- `--minify` - Minify output
- `--sourcemap` - Generate source maps
```

**2. Workflow Pattern:**
```markdown
### Deploying to Production

1. **Build the application:**
   \```bash
   $ toolname build --production
   \```

2. **Run tests:**
   \```bash
   $ toolname test --coverage
   ✓ All tests passed (45/45)
   Coverage: 94%
   \```

3. **Deploy:**
   \```bash
   $ toolname deploy --env production
   Deploying to production...
   ✓ Deployed to https://app.example.com
   \```

**Troubleshooting:** If deployment fails, check your [configuration](#configuration).
```

**3. Configuration Pattern:**
```markdown
### Configuration File

Create `toolname.config.json`:

\```json
{
  "port": 8080,
  "host": "localhost",
  "logging": {
    "level": "info",
    "format": "json"
  },
  "features": {
    "cache": true,
    "compression": true
  }
}
\```

**Required fields:**
- `port` - Port number (1-65535)
- `host` - Bind address

**Optional fields:**
- `logging` - Log configuration
- `features` - Feature flags
```

**4. Error Handling Pattern:**
```markdown
### Common Errors

**Permission Denied:**

\```bash
$ toolname install
Error: EACCES: permission denied
\```

**Solution:** Run with elevated privileges or install locally:
\```bash
# Option 1: Use sudo (not recommended)
$ sudo toolname install

# Option 2: Install in user directory (recommended)
$ toolname install --user
\```
```

### 4.5 Interactive Examples

**2025 Trend: Runnable Code Blocks**

Modern documentation tools (like CodeSandbox, StackBlitz) allow:
- Live editing in the browser
- Immediate feedback
- "Try it yourself" buttons

**Implementation:**
```markdown
<!-- Example for web-based tools -->
[Try it yourself](https://stackblitz.com/edit/example?embed=1)

\```js runnable
// This code runs in the embedded environment
const tool = require('toolname');
tool.run();
\```
```

---

## 5. Troubleshooting Guide Best Practices

### 5.1 Troubleshooting Section Structure

```markdown
## Troubleshooting

### Quick Diagnostics
Run the health check:
\```bash
$ toolname doctor
\```

### Common Issues

#### Issue Title
**Symptom:** What the user sees

**Cause:** Why it happens

**Solution:** Step-by-step fix

---

### Error Messages

#### Error: [error text]
**What it means:** Explanation

**How to fix:** Actionable steps

---

### Getting More Help
- Enable debug mode: `--debug` flag
- Check logs: `~/.toolname/logs/`
- Community forum: [link]
- Bug report: [link]
```

### 5.2 Problem Statement Format

**Use the "What → Why → How" Pattern:**

```markdown
### "Command Not Found" Error

**What you see:**
\```bash
$ toolname
command not found: toolname
\```

**Why it happens:**
The tool isn't in your PATH or isn't installed. This is common after fresh installation.

**How to fix:**

1. **Verify installation:**
   \```bash
   $ ls ~/.local/bin/toolname
   \```

2. **Add to PATH (if needed):**
   \```bash
   # Add to your ~/.bashrc or ~/.zshrc
   export PATH="$HOME/.local/bin:$PATH"
   \```

3. **Reload your shell:**
   \```bash
   $ source ~/.bashrc  # or ~/.zshrc
   \```

**Still having issues?** See [Installation](#installation) for alternative methods.
```

### 5.3 Troubleshooting by Symptom

**Organize by what users SEE, not what's wrong internally:**

| Good Organization | Poor Organization |
|-------------------|-------------------|
| "Slow performance" | "Memory leak in worker thread" |
| "Can't connect to server" | "TCP handshake timeout" |
| "Build fails on Windows" | "Path separator issue" |

### 5.4 Debug Mode Documentation

**Always include debug instructions:**

```markdown
### Enabling Debug Mode

**For one-time debugging:**
\```bash
$ toolname command --debug
[DEBUG] Loading config from ~/.config/tool/config.json
[DEBUG] Connecting to localhost:8080
[DEBUG] Request timeout: 5000ms
\```

**For persistent debugging:**
\```bash
# Set environment variable
export TOOLNAME_DEBUG=1
toolname command
\```

**Log files:**
\```bash
# View recent logs
$ tail -f ~/.toolname/logs/latest.log

# All log files
$ ls ~/.toolname/logs/
\```
```

### 5.5 Diagnostic Commands

**Provide self-diagnosis tools:**

```markdown
### Health Check

Run the built-in diagnostics:

\```bash
$ toolname doctor
✓ Configuration: Valid
✓ Dependencies: Installed
✓ Network: Connected (45ms)
✗ Cache: Corrupted

Run 'toolname cache clean' to fix.
\```

### Verbose Mode

See exactly what's happening:

\```bash
$ toolname command --verbose
→ Reading config
→ Loading plugins (3 found)
→ Connecting to server
→ Requesting data
→ Processing response
→ Done
\```
```

### 5.6 When to Contact Support

**Clear escalation criteria:**

```markdown
### When to Ask for Help

**Try these first:**
1. Run `toolname doctor`
2. Search existing issues: [GitHub Issues]
3. Check the forum: [Discourse]

**Create a support ticket if:**
- The `doctor` command shows errors
- You've found a bug (not a configuration issue)
- The documentation is unclear

**Include in your report:**
\```bash
# Generate diagnostic info
$ toolname info --json > diag.txt

# Attach diag.txt to your issue
\```
```

---

## 6. Migration Guide Patterns

### 6.1 Migration Guide Structure

```markdown
# Migrating from v1 to v2

## Overview
What's changed and why

## Breaking Changes
List of all breaking changes

## Migration Steps
Step-by-step migration process

## Automatic Migration
Using the migration tool

## Manual Migration
Hand-migration steps

## Testing Your Migration
Verification steps

## Rollback Plan
How to revert if needed

## Release Notes
Detailed changelog
```

### 6.2 Breaking Changes Format

**Standard Pattern:**

```markdown
### Breaking Change: [Feature Name]

**Before (v1):**
\```javascript
tool.method({param: 'value'});
\```

**After (v2):**
\```javascript
tool.method({
  param: 'value',
  required: true  // ← New required field
});
\```

**Why:** Improved validation prevents configuration errors.

**Migration:** Add the `required` field to all calls.

**Impact:** High - affects all users
```

### 6.3 Migration Checklist

**Provide a pre-flight checklist:**

```markdown
## Pre-Migration Checklist

Before migrating, ensure:

- [ ] Backup your configuration: `cp -r ~/.toolname ~/.toolname.backup`
- [ ] Note your current version: `toolname --version`
- [ ] Check compatibility: [compatibility matrix]
- [ ] Review breaking changes: [list]
- [ ] Allocate maintenance window: ___ minutes

**Estimated time:** 15-30 minutes for most projects
```

### 6.4 Automated Migration Scripts

**Provide migration tools when possible:**

```markdown
## Automatic Migration

We provide a migration tool:

\```bash
# Check what will change (dry-run)
$ toolname migrate --dry-run

# Preview changes
Would update 5 files:
  - config.json
  - src/index.js
  - src/utils.js
  - tests/main.test.js
  - package.json

# Apply migration
$ toolname migrate
✓ Backed up to .toolname-migration-backup/
✓ Updated 5 files
✓ Migration complete!

# Review changes
$ git diff
\```

**Manual review recommended:** Always review changes before committing.
```

### 6.5 Side-by-Side Comparison

**Visual diff for configuration:**

```markdown
### Configuration Changes

**Removed options:**
\```diff
- "oldOption": true
- "deprecatedMethod": "value"
\```

**New options:**
\```diff
+ "newOption": {
+   "enabled": true,
+   "config": {}
+ }
+ "improvedMethod": {
+   "strategy": "value"
+ }
\```

**Changed defaults:**
\```diff
- "timeout": 30000
+ "timeout": 60000  # Increased for better reliability
\```
```

### 6.6 Version-Specific Guides

**Link migrations sequentially:**

```markdown
# Migration Paths

**From v1 → v2:** [Migrating to v2](/docs/migrate-v1-to-v2)
**From v2 → v3:** [Migrating to v3](/docs/migrate-v2-to-v3)
**From v3 → v4:** [Migrating to v4](/docs/migrate-v3-to-v4)

**Skipping versions?** See [multi-version migration](/docs/migrate-multi-version).
```

### 6.7 Rollback Procedures

**Always provide a way back:**

```markdown
## Rolling Back

### Automatic Rollback

If you used the migration tool:

\```bash
$ toolname migrate --rollback
✓ Restored from .toolname-migration-backup/
✓ Rollback complete
\```

### Manual Rollback

If you migrated manually:

1. **Restore from backup:**
   \```bash
   $ rm -rf ~/.toolname
   $ mv ~/.toolname.backup ~/.toolname
   \```

2. **Reinstall previous version:**
   \```bash
   $ npm install -g toolname@1.x
   \```

3. **Verify:**
   \```bash
   $ toolname --version
   1.23.45
   \```

### Data Migration

Rolling back doesn't revert data changes. If data was migrated:

- Databases: Restore from backup
- Files: Use version control
- External services: Manual reconciliation required
```

---

## 7. Excellent Examples & References

### 7.1 CLI Tools with Exceptional Documentation

#### **Docker Documentation**
**URL:** https://docs.docker.com/

**Strengths:**
- Excellent "Get Started" tutorial (15 minutes to first container)
- Clear separation: Concepts vs. How-to vs. Reference
- Extensive troubleshooting section organized by symptom
- Multi-language support
- Interactive tutorials (Play with Docker)

**Notable Sections:**
- Getting Started: https://docs.docker.com/get-started/
- Troubleshooting: https://docs.docker.com/engine/troubleshooting/
- Command Reference: https://docs.docker.com/engine/reference/commandline/cli/

**Patterns to Emulate:**
1. **Progressive tutorial:** Build complexity gradually
2. **Visual hierarchy:** Use tabs for different operating systems
3. **Copy-paste examples:** Every code block is runnable
4. **Diagrams:** Architecture diagrams explain concepts visually

#### **Git Documentation**
**URL:** https://git-scm.com/doc

**Strengths:**
- Prose book-style documentation (Git Pro book)
- Separate video tutorials
- Community translations
- Reference manual built from source
- FAQ section

**Notable Sections:**
- Git Pro Book: https://git-scm.com/book/en/v2
- Reference Manual: https://git-scm.com/docs
- Videos: https://git-scm.com/videos

**Patterns to Emulate:**
1. **Book format for concepts:** Detailed explanation
2. **Quick reference for commands:** Fast lookup
3. **Video tutorials:** Alternative learning style
4. **Glossary:** Define Git terminology

#### **GitHub CLI (gh)**
**URL:** https://cli.github.com/manual/

**Strengths:**
- Comprehensive manual page
- Example-driven
- Clear command structure
- Environment variable reference

**Notable Sections:**
- Manual: https://cli.github.com/manual/
- Getting Started: https://docs.github.com/en/github-cli

**Patterns to Emulate:**
1. **Man page format:** Traditional but effective
2. **Every command has examples:** No exceptions
3. **Clear option descriptions:** Explain what each flag does

#### **kubectl (Kubernetes)**
**URL:** https://kubernetes.io/docs/reference/kubectl/

**Strengths:**
- Organized by task
- Extensive examples
- Cheat sheet available
- Clear explanation of flags

**Notable Sections:**
- Overview: https://kubernetes.io/docs/reference/kubectl/overview/
- Cheat Sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Examples: https://kubernetes.io/docs/tasks/

**Patterns to Emulate:**
1. **Cheat sheet:** One-page reference
2. **Task-based organization:** "How to..." structure
3. **JSONPath examples:** Advanced querying explained

### 7.2 Developer Framework Documentation

#### **Next.js Documentation**
**URL:** https://nextjs.org/docs

**Strengths:**
- Dark mode UI
- Search functionality
- Version selector
- Clear "Get Started" path
- API reference separate from guides

**Notable Sections:**
- Getting Started: https://nextjs.org/docs/getting-started/installation
- Learn: https://nextjs.org/learn
- API Reference: https://nextjs.org/docs/api-reference

**Patterns to Emulate:**
1. **Learn vs. Docs:** Separate tutorials from reference
2. **Version dropdown:** Easy access to different versions
3. **Quick navigation:** Sidebar with clear hierarchy
4. **Interactive examples:** Live code blocks

#### **Vue.js Documentation**
**URL:** https://vuejs.org/guide/

**Strengths:**
- Multiple learning paths
- Interactive examples
- Style guide included
- Migration guides prominent

**Notable Sections:**
- Getting Started: https://vuejs.org/guide/introduction.html
- Style Guide: https://vuejs.org/style-guide/
- Migration from Vue 2: https://v3-migration.vuejs.org/

**Patterns to Emulate:**
1. **Style guide:** Best practices separate from technical docs
2. **Escalation badges:** Mark advanced content clearly
3. **Migration site:** Dedicated subdomain for migration
4. **API quick search:** Instant API lookup

#### **React Documentation (New)**
**URL:** https://react.dev/

**Strengths:**
- Completely rewritten for better learning
- Interactive examples
- "Learn React" path vs. "API Reference"
- Diagrams and visuals
- Dark mode

**Notable Sections:**
- Installation: https://react.dev/learn/installation
- Tutorial: https://react.dev/learn/thinking-in-react
- API Reference: https://react.dev/reference/react

**Patterns to Emulate:**
1. **Interactive playgrounds:** Code in browser
2. **Thinking in React:** Mental model guide
3. **Challenge problems:** Test your knowledge
4. **Wishlist:** Show planned docs

### 7.3 AI/ML Tools Documentation

#### **LangChain Documentation**
**URL:** https://python.langchain.com/docs/

**Strengths:**
- Clear use case organization
- Quick start for different use cases
- Expression language guide
- Cookbook with examples

**Notable Sections:**
- Quick Start: https://python.langchain.com/docs/get_started/introduction
- Use Cases: https://python.langchain.com/docs/use_cases/
- Expression Language: https://python.langchain.com/docs/expression_language/

**Patterns to Emulate:**
1. **Use case organization:** By problem, not by feature
2. **Cookbook:** Recipe-style examples
3. **Integrations:** Clear section on third-party tools

### 7.4 Documentation Frameworks & Tools

#### **Docusaurus**
**URL:** https://docusaurus.io/docs

**Strengths:**
- Dogfooding (built with itself)
- Clear versioning strategy
- i18n support
- Good search

**Notable Sections:**
- Docs: https://docusaurus.io/docs
- Migration Guides: https://docusaurus.io/docs/migration

**Patterns to Emulate:**
1. **Sidebar navigation:** Auto-generated from file structure
2. **Versioned docs:** Easy multi-version support
3. **Blog integration:** News/changelog in same site

#### **Mintlify**
**URL:** https://mintlify.com/docs

**Strengths:**
- Modern UI
- API-first design
- Search prominence
- Component library

**Notable Sections:**
- Best Practices: https://mintlify.com/docs/best-practices
- API Reference: https://mintlify.com/docs/api-reference

**Patterns to Emulate:**
1. **Search-first:** Big search bar, instant results
2. **Card-based UI:** Visual navigation
3. **Page grouping:** Clear hierarchy
4. **Dark mode by default:** Developer-friendly

### 7.5 Style Guides and Writing Resources

#### **Google Developer Documentation Style Guide**
**URL:** https://developers.google.com/tech-writing/one

**Key Insights:**
- Write for your audience
- Use active voice
- Present information in order of use
- Be concise but complete
- Use consistent terminology

#### **Divio Documentation System**
**URL:** https://documentation.divio.com/

**Key Framework: Diátaxis Framework**
- Tutorials: Learning-oriented
- How-to guides: Problem-oriented
- Explanation: Understanding-oriented
- Reference: Information-oriented

#### **Write the Docs**
**URL:** https://www.writethedocs.org/

**Resources:**
- Guides: https://www.writethedocs.org/guides/
- Conference videos: https://www.writethedocs.org/videos/
- Slack community: Active discussion

### 7.6 Specific Section Examples

#### **Getting Started Examples**
- Docker: https://docs.docker.com/get-started/
- Next.js: https://nextjs.org/docs/getting-started/installation
- Create React App: https://create-react-app.dev/docs/getting-started/

**Common Pattern:**
1. Prerequisites
2. Installation (one command)
3. Verification
4. First project
5. Next steps link

#### **Migration Guide Examples**
- Vue 2 → Vue 3: https://v3-migration.vuejs.org/
- React 18: https://react.dev/blog/2022/03/29/react-v18#migrating-to-react-18
- Docusaurus v1 → v2: https://docusaurus.io/docs/migration/v2

**Common Pattern:**
1. Why migrate? (benefits)
2. Breaking changes overview
3. Step-by-step migration
4. Code comparisons
5. Testing
6. Rollback

#### **Troubleshooting Examples**
- Docker Engine: https://docs.docker.com/engine/troubleshooting/
- Kubernetes: https://kubernetes.io/docs/tasks/debug/
- Git: https://git-scm.com/docs/gitfaq

**Common Pattern:**
1. Quick diagnostics
2. Organized by symptom
3. Debug mode instructions
4. Log file location
5. Community resources

---

## 8. Key Takeaways for docs/user-guide.md

Based on this research, the PRP for docs/user-guide.md should:

### 8.1 Structure
1. **Start with Quick Start** (5 minutes to success)
2. **Follow with Core Concepts** (mental model)
3. **Progressive Complexity** (basic → advanced)
4. **Reference Section** (searchable, skimmable)

### 8.2 Writing Style
1. **Direct, active voice** ("Run this command")
2. **Second person** ("You can...")
3. **One idea per sentence**
4. **Consistent terminology**

### 8.3 Code Examples
1. **Copy-paste runnable**
2. **Include expected output**
3. **Show prerequisites**
4. **Explain what it does**

### 8.4 Troubleshooting
1. **Organize by symptom** (not by internal cause)
2. **Provide diagnostic tools**
3. **Debug mode instructions**
4. **Clear escalation criteria**

### 8.5 Migration Guides
1. **Breaking changes first**
2. **Automated migration when possible**
3. **Side-by-side comparisons**
4. **Rollback procedures**

### 8.6 Navigation
1. **Three-click rule**
2. **Clear section hierarchy**
3. **Multiple entry points**
4. **Searchable reference**

---

## 9. URLs Summary

**CLI Tools:**
- Docker Docs: https://docs.docker.com/
- Git Documentation: https://git-scm.com/doc
- GitHub CLI: https://cli.github.com/manual/
- kubectl Reference: https://kubernetes.io/docs/reference/kubectl/
- npm Docs: https://docs.npmjs.com/

**Developer Frameworks:**
- Next.js: https://nextjs.org/docs
- React: https://react.dev/
- Vue.js: https://vuejs.org/guide/
- Docusaurus: https://docusaurus.io/docs

**Style Guides:**
- Google Tech Writing: https://developers.google.com/tech-writing/one
- Diátaxis Framework: https://documentation.divio.com/
- Write the Docs: https://www.writethedocs.org/

**Examples to Study:**
- Docker Getting Started: https://docs.docker.com/get-started/
- Vue 3 Migration: https://v3-migration.vuejs.org/
- Next.js Learn: https://nextjs.org/learn
- Kubernetes Troubleshooting: https://kubernetes.io/docs/tasks/debug/

---

## 10. Recommended Reading Order for Implementation

1. **Diátaxis Framework** (documentation structure)
2. **Google Developer Documentation Style Guide** (writing style)
3. **Docker Getting Started** (progressive disclosure example)
4. **Vue 3 Migration Guide** (migration pattern example)
5. **Kubernetes Troubleshooting** (debugging documentation)

---

**End of Research Document**

*This research was compiled from industry best practices, documentation standards, and analysis of successful open-source documentation sites as of January 2025.*
