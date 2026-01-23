# Installation Documentation Research for Node.js/TypeScript Projects

**Research Date:** 2026-01-23
**Focus:** Industry-standard patterns, best practices, troubleshooting, prerequisites, environment variables, and npm link documentation

---

## Table of Contents

1. [Industry-Standard Installation Documentation Patterns](#1-industry-standard-installation-documentation-patterns)
2. [Best Practices from Popular Open-Source Projects](#2-best-practices-from-popular-open-source-projects)
3. [Troubleshooting Section Patterns](#3-troubleshooting-section-patterns)
4. [Prerequisites Documentation Standards](#4-prerequisites-documentation-standards)
5. [Environment Variable Documentation Patterns](#5-environment-variable-documentation-patterns)
6. [npm Link Documentation for Local Dependencies](#6-npm-link-documentation-for-local-dependencies)
7. [Complete Installation Documentation Template](#7-complete-installation-documentation-template)
8. [Reference URLs](#8-reference-urls)

---

## 1. Industry-Standard Installation Documentation Patterns

### 1.1 Core Components of Installation Documentation

Based on research from leading Node.js/TypeScript projects, effective installation documentation should include:

#### A. Quick Installation (Above the Fold)
```markdown
## Quick Start

Get running in under 2 minutes:

```bash
# Clone the repository
git clone https://github.com/username/project.git
cd project

# Install dependencies
npm install

# Run the project
npm start
```
```

**Key Principles:**
- Visible without scrolling
- Under 5 steps
- Copy-pasteable code blocks
- Works for 80% of users
- Links to detailed installation for edge cases

#### B. Prerequisites Section
```markdown
### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0 (or **yarn** >= 1.22.0 / **pnpm** >= 8.0.0)
- **Git** >= 2.0.0

**Check your versions:**
```bash
node --version
npm --version
git --version
```
```

**Best Practices:**
- Use version badges in README
- Show exact minimum versions
- Provide version check commands
- Link to install guides for prerequisites
- Note any OS-specific requirements

#### C. Multiple Installation Methods
```markdown
## Installation

### Option 1: Install via npm (Recommended)

```bash
npm install -g project-name
```

### Option 2: Install via yarn

```bash
yarn global add project-name
```

### Option 3: Install via npx (No installation required)

```bash
npx project-name [options]
```

### Option 4: Clone and Build from Source

```bash
git clone https://github.com/username/project.git
cd project
npm install
npm run build
npm link
```
```

**Pattern:**
- Provide npm, yarn, pnpm options when applicable
- Include npx for CLI tools
- Always show from-source option for contributors
- Label recommended method clearly

#### D. Verification Step
```markdown
### Verify Installation

```bash
project-name --version
# Expected output: project-name v1.0.0

project-name --help
# Shows all available commands
```

**Common Issues:**
- If `command not found`, restart your terminal or verify PATH
- Windows users may need to run as Administrator
- See [Troubleshooting](#troubleshooting) for common issues
```

### 1.2 Progressive Disclosure Pattern

**Level 1: Quick Start** (Basic installation, 3 steps)
**Level 2: Standard Installation** (All methods, configuration)
**Level 3: Advanced Installation** (Custom builds, development setup)
**Level 4: Troubleshooting** (Common issues and solutions)

### 1.3 Platform-Specific Considerations

#### Windows
```markdown
### Windows Users

**PowerShell:**
```powershell
# Run as Administrator if prompted
npm install -g project-name
```

**Git Bash / WSL:**
```bash
npm install -g project-name
```

**Common Issues:**
- Run terminal as Administrator for global installs
- Use Windows PowerShell or Git Bash (not CMD)
- Enable Developer Mode for symlink permissions
```

#### macOS
```markdown
### macOS Users

**Using Homebrew Node.js:**
```bash
brew install node
npm install -g project-name
```

**Permission Issues:**
```bash
# Fix npm permissions (avoid sudo)
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**Or use nvm (Recommended):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
npm install -g project-name
```
```

#### Linux
```markdown
### Linux Users

**Debian/Ubuntu:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g project-name
```

**Fedora/RHEL:**
```bash
sudo dnf install nodejs npm
npm install -g project-name
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
npm install -g project-name
```
```

---

## 2. Best Practices from Popular Open-Source Projects

### 2.1 Analysis of Excellent Installation Documentation

#### Pattern 1: TypeScript (typescriptlang.org)

**Strengths:**
- Clear version requirements table
- Multiple installation methods (npm, VS Code extension, standalone)
- Platform-specific instructions
- Troubleshooting section with common errors

**Notable Pattern:**
```markdown
## Installation

### Via npm
```bash
npm install -g typescript
```

### Via Yarn
```bash
yarn global add typescript
```

### Via PKG Managers
- **Homebrew**: `brew install typescript`
- **Chocolatey**: `choco install typescript`
- **APT**: `sudo apt-get install -y typescript`
```

#### Pattern 2: tsx (TypeScript Executor)

**Strengths:**
- Minimal installation section (single command)
- Quick start with immediate usage
- Comparison with alternatives
- Migration guide from ts-node

**Notable Pattern:**
```markdown
## Installation

```bash
npm install tsx
```

## Usage

```bash
npx tsx src/index.ts
```

**Why tsx over ts-node?**
- 10-20x faster
- Uses esbuild for compilation
- Better ESM support
```

#### Pattern 3: Vite (Build Tool)

**Strengths:**
- Progressive complexity (basic → advanced)
- Scaffold command with template selection
- Configuration file examples
- Troubleshooting with environment-specific issues

**Notable Pattern:**
```markdown
## Quick Start

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

## What's Next?

As you build, check out [Features](features) and [Configuration](config) for more options.
```

#### Pattern 4: Vitest (Testing Framework)

**Strengths:**
- Installation with peer dependencies
- Configuration file examples
- CLI vs API usage
- Coverage setup instructions

**Notable Pattern:**
```markdown
## Installation

```bash
npm install -D vitest @vitest/ui
```

**Configuration:**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  }
});
```
```

### 2.2 Common Documentation Patterns

#### Pattern A: Command Structure Table
```markdown
| Command | Description | Usage |
|---------|-------------|-------|
| `npm install` | Install dependencies | First time setup |
| `npm run build` | Build for production | Before deployment |
| `npm test` | Run tests | During development |
| `npm run dev` | Start dev server | Active development |
```

#### Pattern B: Configuration File Hierarchy
```markdown
### Configuration Loading Order

1. Command-line flags (highest priority)
2. Environment variables
3. `.env` file
4. Config file (`project.config.json`)
5. `package.json` config
6. Default values (lowest priority)
```

#### Pattern C: Badge Standards
```markdown
# Standard README Badges

[![npm version](https://badge.fury.io/js/project-name.svg)](https://www.npmjs.com/package/project-name)
[![Build Status](https://github.com/user/project/actions/workflows/test.yml/badge.svg)](https://github.com/user/project/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
```

### 2.3 Installation Script Patterns

#### Pre-installation Checks
```bash
#!/bin/bash
# Pre-installation checks

echo "Checking prerequisites..."

# Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Error: Node.js 20+ required. Current: $(node -v)"
  exit 1
fi

# npm version
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 10 ]; then
  echo "Error: npm 10+ required. Current: $(npm -v)"
  exit 1
fi

# Git version
if ! command -v git &> /dev/null; then
  echo "Error: Git not found. Please install Git."
  exit 1
fi

echo "✓ All prerequisites met"
npm install
```

#### Post-installation Verification
```bash
#!/bin/bash
# Post-installation verification

echo "Verifying installation..."

# Check binary is available
if command -v project-name &> /dev/null; then
  echo "✓ Binary installed"
else
  echo "✗ Binary not found in PATH"
  echo "Add $(npm root -g)/.bin to your PATH"
fi

# Check version
project-name --version

# Run basic test
project-name --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ Installation verified"
else
  echo "✗ Installation may be incomplete"
fi
```

---

## 3. Troubleshooting Section Patterns

### 3.1 Troubleshooting Section Structure

#### Industry Standard Pattern
```markdown
## Troubleshooting

### Installation Issues

#### "EACCES: permission denied" Error

**Symptoms:**
```
npm ERR! Error: EACCES: permission denied
```

**Cause:** Attempting global install without proper permissions

**Solutions:**

**Option 1: Fix npm permissions (Recommended)**
```bash
# Get npm prefix
npm config get prefix

# Change ownership of npm directories
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

**Option 2: Use Node Version Manager**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js
nvm install 20
nvm use 20

# Install package (no sudo needed)
npm install -g project-name
```

**Option 3: Use sudo (Not Recommended)**
```bash
sudo npm install -g project-name
```

#### "Cannot find module" Error

**Symptoms:**
```
Error: Cannot find module 'project-name'
internal/modules/cjs/loader.js:888
  throw err;
```

**Cause:** Module not installed or not in NODE_PATH

**Solutions:**

**Check if installed:**
```bash
npm list -g project-name
npm root -g
```

**Reinstall:**
```bash
npm uninstall -g project-name
npm install -g project-name
```

**Verify PATH:**
```bash
echo $PATH | grep "$(npm root -g)/.bin"
```

#### "node:bad option" Error

**Symptoms:**
```
node: bad option: --loader
```

**Cause:** Using Node.js syntax incompatible with version

**Solutions:**

**Check Node.js version:**
```bash
node --version
# Must be >= 18.0.0 for ESM
```

**Upgrade Node.js:**
```bash
# Using nvm
nvm install 20
nvm use 20
```

### 3.2 Error-First Troubleshooting

**Pattern:** Organize by error message for quick lookup

```markdown
## Troubleshooting (By Error Message)

### "ENOSPC: system limit for number of file watchers reached"

**Cause:** Inotify limit too low for file watching

**Fix:**
```bash
# Increase limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### "gyp: No Xcode or CLT version detected"

**Cause:** Missing Xcode Command Line Tools (macOS)

**Fix:**
```bash
xcode-select --install
```

### "EPERM: operation not permitted, symlink"

**Cause:** Symlink creation permission issue (Windows)

**Fix:**
- Run terminal as Administrator
- Or enable Developer Mode in Settings
```

### 3.3 Platform-Specific Troubleshooting

#### Windows-Specific Issues
```markdown
### Windows-Specific Issues

#### PATH not updated after install

**Symptoms:** `command not found` after installation

**Fix:**
```powershell
# Restart PowerShell or run:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

#### Symlink creation fails

**Fix:**
```powershell
# Enable Developer Mode
Settings → Update & Security → For developers → Developer Mode

# Or run as Administrator
```
```

#### macOS-Specific Issues
```markdown
### macOS-Specific Issues

#### Gatekeeper prevents execution

**Symptoms:** "damaged and can't be opened"

**Fix:**
```bash
xattr -cr /path/to/project
```

#### Rosetta translation warning (Apple Silicon)

**Fix:**
```bash
softwareupdate --install-rosetta
arch -x86_64 zsh  # Use x86_64 shell if needed
```
```

#### Linux-Specific Issues
```markdown
### Linux-Specific Issues

#### Package manager conflicts

**Fix:**
```bash
# Unpackaged npm install
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### System Node.js conflicts

**Fix:**
```bash
# Use nvm instead of system Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```
```

### 3.4 Diagnostic Commands Section

```markdown
## Diagnostic Commands

Run these commands to gather information for issue reports:

```bash
# Environment information
echo "=== System Information ==="
echo "OS: $(uname -s)"
echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "Git: $(git --version)"

# Package information
echo -e "\n=== Package Information ==="
npm list -g project-name
npm config get prefix

# Path information
echo -e "\n=== PATH ==="
echo $PATH | tr ':' '\n' | grep node

# npm configuration
echo -e "\n=== npm Configuration ==="
npm config list

# Global modules location
echo -e "\n=== Global Modules ==="
npm root -g
npm bin -g
```

**Save output to file:**
```bash
npm diagnose > diagnostic-info.txt
```
```

---

## 4. Prerequisites Documentation Standards

### 4.1 Version Specification Best Practices

#### Semantic Versioning in Prerequisites
```markdown
### Prerequisites

**Required Versions:**

| Tool | Minimum | Recommended | Maximum Tested |
|------|---------|-------------|----------------|
| **Node.js** | 20.0.0 | 20.x LTS | 21.x |
| **npm** | 10.0.0 | 10.x | 10.x |
| **Git** | 2.30.0 | 2.x latest | 2.x latest |

**Check your versions:**
```bash
node --version  # Should be v20.0.0 or higher
npm --version   # Should be 10.0.0 or higher
git --version   # Should be 2.30.0 or higher
```
```

#### Version Range Syntax
```markdown
### Understanding Version Ranges

- `>=20.0.0` - Version 20.0.0 or higher (recommended for Node.js LTS)
- `^10.0.0` - Compatible with 10.x (does not include 11.0.0)
- `~10.0.0` - Approximately 10.0.x (patch updates only)
- `*` - Any version (not recommended)

**Example package.json:**
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```
```

### 4.2 Prerequisite Installation Guides

#### Node.js Installation
```markdown
### Installing Node.js

#### Option 1: Using nvm (Recommended)

**Linux/macOS:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or restart terminal
nvm install 20
nvm use 20
node --version
```

**Windows (nvm-windows):**
```powershell
# Download from: https://github.com/coreybutler/nvm-windows/releases
nvm install 20.0.0
nvm use 20.0.0
```

#### Option 2: Official Installer

Download from: https://nodejs.org/

- Select LTS version (recommended)
- Choose installer for your OS
- Verify installation: `node --version`

#### Option 3: Package Manager

**macOS (Homebrew):**
```bash
brew install node@20
brew link node@20
```

**Linux (Debian/Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows (Chocolatey):**
```powershell
choco install nodejs-lts
```
```

#### Git Installation
```markdown
### Installing Git

#### Windows
Download from: https://git-scm.com/download/win

Or using Chocolatey:
```powershell
choco install git
```

#### macOS
```bash
# Homebrew
brew install git

# Or install Xcode Command Line Tools
xcode-select --install
```

#### Linux
```bash
# Debian/Ubuntu
sudo apt-get install git

# Fedora
sudo dnf install git

# Arch Linux
sudo pacman -S git
```
```

### 4.3 System Requirements

#### Development vs Production
```markdown
### System Requirements

#### Development Environment
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 500MB for node_modules + project files
- **Network**: For npm package downloads

#### Production Environment
- **CPU**: Depends on workload
- **RAM**: Depends on workload (start with 512MB)
- **Disk**: 100MB for installed package
- **OS**: Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+)

#### Testing Environment
- Same as development
- Additional: CI/CD system requirements (GitHub Actions, GitLab CI, etc.)
```

#### Platform Compatibility Matrix
```markdown
### Platform Compatibility

| Platform | Node.js 20.x | Node.js 21.x | Notes |
|----------|--------------|--------------|-------|
| **Ubuntu** | ✅ Fully Supported | ✅ Fully Supported | Recommended for production |
| **Debian** | ✅ Fully Supported | ✅ Fully Supported | Stable |
| **macOS** | ✅ Fully Supported | ✅ Fully Supported | Intel & Apple Silicon |
| **Windows 10/11** | ✅ Fully Supported | ⚠️ Experimental | WSL2 recommended for dev |
| **Alpine Linux** | ✅ Fully Supported | ⚠️ May require musl | For Docker images |
| **CentOS/RHEL 8+** | ✅ Fully Supported | ✅ Fully Supported | Enterprise Linux |

**Note:** Node.js 20.x (LTS) is recommended for all platforms.
```

---

## 5. Environment Variable Documentation Patterns

### 5.1 Environment Variable Reference

#### Table Format (Best for Quick Reference)
```markdown
### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROJECT_NAME_ENV` | No | `development` | Environment to run in |
| `PROJECT_NAME_API_KEY` | Yes* | - | API key for external services |
| `PROJECT_NAME_PORT` | No | `3000` | Port number for server |
| `PROJECT_NAME_LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |
| `PROJECT_NAME_CONFIG_PATH` | No | `./config.json` | Path to configuration file |

*Required when using external API features
```

#### Detailed Format (For Configuration Files)
```markdown
### Environment Variables (Detailed)

#### PROJECT_NAME_ENV

**Description:** Environment to run the application in

**Possible Values:** `development`, `production`, `test`

**Default:** `development`

**Example:**
```bash
export PROJECT_NAME_ENV=production
```

**Behavior:**
- `development`: Enables debug logging, hot reload
- `production`: Optimized for performance, minimal logging
- `test`: Configured for testing environments

---

#### PROJECT_NAME_API_KEY

**Description:** API key for external service authentication

**Required:** Yes (when using API features)

**Format:** 32-character alphanumeric string

**How to Get:**
1. Sign up at https://api.example.com
2. Navigate to Settings → API Keys
3. Create new API key
4. Copy key to clipboard

**Example:**
```bash
export PROJECT_NAME_API_KEY=abc123def456ghi789jkl012mno345pqr
```

**Security Notes:**
- Never commit API keys to version control
- Use `.env` file for local development (add to `.gitignore`)
- Rotate keys regularly
- Use different keys for dev/prod

---

#### PROJECT_NAME_PORT

**Description:** Port number for the development server

**Possible Values:** 1024-65535

**Default:** `3000`

**Example:**
```bash
export PROJECT_NAME_PORT=8080
```

**Note:** Ports below 1024 may require elevated privileges
```

### 5.2 Configuration File Patterns

#### .env File Pattern
```markdown
### Using .env Files

**Step 1:** Create `.env` file in project root

```bash
# .env - Environment Configuration

# Environment
PROJECT_NAME_ENV=development

# API Configuration
PROJECT_NAME_API_KEY=your-api-key-here

# Server Configuration
PROJECT_NAME_PORT=3000
PROJECT_NAME_HOST=localhost

# Logging
PROJECT_NAME_LOG_LEVEL=info

# Optional: Feature Flags
PROJECT_NAME_FEATURE_X_ENABLED=true
```

**Step 2:** Add to `.gitignore`

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

**Step 3:** Load environment variables

**Using dotenv:**
```bash
npm install dotenv
```

```typescript
// src/index.ts
import dotenv from 'dotenv';

dotenv.config();

console.log(process.env.PROJECT_NAME_API_KEY);
```

**Example .env File Distribution**

Create `.env.example`:

```bash
# .env.example - Template for environment variables

# Required: API Key
PROJECT_NAME_API_KEY=

# Optional: Environment (default: development)
PROJECT_NAME_ENV=

# Optional: Port (default: 3000)
PROJECT_NAME_PORT=
```
```

### 5.3 Environment-Specific Configuration

#### Development Configuration
```markdown
### Development Environment (.env.development)

```bash
NODE_ENV=development
PROJECT_NAME_LOG_LEVEL=debug
PROJECT_NAME_API_KEY=dev-key-123
PROJECT_NAME_API_URL=https://dev-api.example.com
PROJECT_NAME_ENABLE_HOT_RELOAD=true
PROJECT_NAME_CACHE_ENABLED=false
```

**Used for:**
- Local development
- Feature testing
- Debugging

**Characteristics:**
- Verbose logging
- Hot reload enabled
- No caching
- Development API endpoints
```

#### Production Configuration
```markdown
### Production Environment (.env.production)

```bash
NODE_ENV=production
PROJECT_NAME_LOG_LEVEL=warn
PROJECT_NAME_API_KEY=prod-key-456
PROJECT_NAME_API_URL=https://api.example.com
PROJECT_NAME_ENABLE_HOT_RELOAD=false
PROJECT_NAME_CACHE_ENABLED=true
PROJECT_NAME_COMPRESSION_ENABLED=true
```

**Used for:**
- Production deployments
- Staging environments
- Performance testing

**Characteristics:**
- Minimal logging
- Optimized performance
- Caching enabled
- Production API endpoints
- Compression enabled
```

#### Test Configuration
```markdown
### Test Environment (.env.test)

```bash
NODE_ENV=test
PROJECT_NAME_LOG_LEVEL=error
PROJECT_NAME_API_KEY=test-key-789
PROJECT_NAME_API_URL=http://localhost:8080
PROJECT_NAME_DATABASE_URL=sqlite::memory:
PROJECT_NAME_MOCK_ENABLED=true
```

**Used for:**
- Unit tests
- Integration tests
- CI/CD pipelines

**Characteristics:**
- Error-only logging
- Mock services
- In-memory databases
- Local test endpoints
```

### 5.4 Security Best Practices

#### API Key Management
```markdown
### API Key Security Best Practices

#### 1. Never Commit API Keys

```gitignore
# .gitignore
.env
.env.local
.env.*.local
**/secrets/
*.key
*.pem
```

#### 2. Use .env.example Template

```bash
# .env.example
PROJECT_NAME_API_KEY=your-api-key-here

# Commit this file, but not .env
```

#### 3. Validation at Startup

```typescript
// src/config/validate-env.ts
const requiredEnvVars = [
  'PROJECT_NAME_API_KEY',
  'PROJECT_NAME_DATABASE_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('✓ All required environment variables are set');
```

#### 4. Rotation Strategy

```bash
# Rotate API keys quarterly
# Update .env file
# Restart application
# Invalidate old keys
```

#### 5. Different Keys per Environment

```bash
# Development
PROJECT_NAME_API_KEY=dev_abc123...

# Staging
PROJECT_NAME_API_KEY= staging_def456...

# Production
PROJECT_NAME_API_KEY=prod_ghi789...
```
```

---

## 6. npm Link Documentation for Local Dependencies

### 6.1 npm Link Quick Reference

#### Basic Workflow
```markdown
### npm Link for Local Development

**Use Case:** Develop a local package and test it in another project without publishing.

#### Step 1: Prepare Your Local Package

```bash
cd /path/to/my-package

# Ensure package.json has correct name
cat package.json | grep '"name"'

# Build the package (if TypeScript)
npm run build

# Create global symlink
npm link
```

**Expected Output:**
```
/home/user/.nvm/versions/v20.0.0/lib/node_modules/my-package -> /path/to/my-package
```

#### Step 2: Link to Target Project

```bash
cd /path/to/my-project

# Link the package
npm link my-package

# Verify the link
ls -la node_modules/my-package
```

**Expected Output:**
```
node_modules/my-package -> ../../../.nvm/versions/v20.0.0/lib/node_modules/my-package -> /path/to/my-package
```

#### Step 3: Use in Your Project

```typescript
// my-project/src/index.ts
import { myFunction } from 'my-package';

console.log(myFunction());
```

#### Step 4: Verify Installation

```bash
# Check that the package is linked
npm list my-package

# Test import
node -e "console.log(require('my-package'))"
```
```

### 6.2 TypeScript-Specific Considerations

#### Type Declarations
```markdown
### TypeScript Type Declarations

#### Ensure Types Are Generated

**package.json:**
```json
{
  "name": "my-package",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  }
}
```

**Build before linking:**
```bash
cd /path/to/my-package
npm run build
npm link
```
```

#### TypeScript Configuration
```markdown
### TypeScript Configuration for Linked Packages

#### In Consuming Project's tsconfig.json

```json
{
  "compilerOptions": {
    "preserveSymlinks": true,
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

#### Alternative: Use Project References

**Root tsconfig.json:**
```json
{
  "files": [],
  "references": [
    { "path": "../my-package" },
    { "path": "." }
  ]
}
```

**my-package/tsconfig.json:**
```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  }
}
```

**Build with project references:**
```bash
tsc --build
```
```

### 6.3 Common Issues with npm Link

#### Issue: Types Not Found
```markdown
### Issue: TypeScript Cannot Find Types

**Error:**
```
TS2307: Cannot find module 'my-package' or its corresponding type declarations.
```

**Solutions:**

1. **Ensure types field is set:**
```json
// my-package/package.json
{
  "types": "./dist/index.d.ts"
}
```

2. **Build before linking:**
```bash
cd my-package
npm run build
npm link
```

3. **Restart TypeScript server (VSCode):**
```
Command Palette → "TypeScript: Restart TS Server"
```

4. **Clear TypeScript cache:**
```bash
rm -rf node_modules/.cache
npx tsc --noCache
```
```

#### Issue: Changes Not Reflected
```markdown
### Issue: Changes in Linked Package Not Reflected

**Symptoms:**
- Edited code in my-package
- Changes don't appear in my-project
- Old code continues to run

**Solutions:**

1. **Rebuild after changes:**
```bash
cd my-package
npm run build
```

2. **Use watch mode:**
```bash
cd my-package
npm run build:watch
```

3. **Clear module cache:**
```bash
cd my-project
rm -rf node_modules/.cache
```

4. **Restart dev server:**
```bash
cd my-project
# Stop and restart npm run dev
```
```

### 6.4 Unlinking Workflow

#### Proper Cleanup
```markdown
### Unlinking Packages

#### Step 1: Unlink from Consuming Project

```bash
cd /path/to/my-project

# Remove the link
npm unlink my-package

# Verify it's removed
ls -la node_modules/ | grep my-package  # Should show nothing
```

#### Step 2: Unlink Global Package

```bash
cd /path/to/my-package

# Remove global link
npm unlink -g

# Verify it's removed
npm list -g --depth=0 | grep my-package  # Should show nothing
```

#### Step 3: Install from Registry (Optional)

```bash
cd /path/to/my-project

# Install published version
npm install my-package

# Or install from local tarball
npm install /path/to/my-package
```
```

---

## 7. Complete Installation Documentation Template

```markdown
# Installation Guide for [Project Name]

Complete guide to installing and setting up [Project Name] on your system.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Advanced Setup](#advanced-setup)
- [Uninstallation](#uninstallation)

---

## Quick Start

Get [Project Name] running in under 2 minutes:

```bash
# Clone the repository
git clone https://github.com/username/project.git
cd project

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run the project
npm start
```

**Expected Output:**
```
✓ Starting [Project Name]
✓ Listening on http://localhost:3000
```

That's it! You're ready to use [Project Name]. For detailed configuration, see [Configuration](#configuration).

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Check Command |
|----------|----------------|-------------|---------------|
| **Node.js** | 20.0.0 | 20.x LTS | `node --version` |
| **npm** | 10.0.0 | 10.x | `npm --version` |
| **Git** | 2.30.0 | Latest 2.x | `git --version` |

### Installing Prerequisites

#### Node.js & npm

**Option 1: Using nvm (Recommended)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20 LTS
nvm install 20
nvm use 20

# Verify installation
node --version
npm --version
```

**Option 2: Official Installer**
Download from [nodejs.org](https://nodejs.org/)

#### Git

**Windows:** Download from [git-scm.com](https://git-scm.com/download/win)

**macOS:**
```bash
brew install git
# or
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install git  # Debian/Ubuntu
sudo dnf install git      # Fedora
```

### Platform-Specific Notes

<details>
<summary>Windows Users</summary>

- Run PowerShell or Git Bash as Administrator for global installs
- Enable Developer Mode for symlink permissions
- Use Windows Terminal for best experience

</details>

<details>
<summary>macOS Users</summary>

- Install Xcode Command Line Tools: `xcode-select --install`
- Use Homebrew for easy package management
- Apple Silicon users may need Rosetta 2 for x86 packages

</details>

<details>
<summary>Linux Users</summary>

- Use your distribution's package manager
- Consider using `nvm` instead of system Node.js
- Add npm global bin to PATH if needed

</details>

---

## Installation Methods

### Method 1: Clone and Install (Recommended for Development)

```bash
# Clone the repository
git clone https://github.com/username/project.git
cd project

# Install dependencies
npm install

# Build the project (if applicable)
npm run build
```

### Method 2: Global Installation (CLI Tools)

```bash
npm install -g project-name

# Verify installation
project-name --version
```

**If you get a permission error:**
```bash
# Option 1: Fix npm permissions (recommended)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Option 2: Use nvm (recommended)
nvm install 20
nvm use 20
npm install -g project-name

# Option 3: Use sudo (not recommended)
sudo npm install -g project-name
```

### Method 3: Docker (Containerized)

```bash
# Pull the image
docker pull username/project-name:latest

# Run the container
docker run -p 3000:3000 username/project-name:latest
```

**Or build from source:**
```bash
git clone https://github.com/username/project.git
cd project
docker build -t project-name .
docker run -p 3000:3000 project-name
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROJECT_NAME_ENV` | No | `development` | Environment (development/production/test) |
| `PROJECT_NAME_PORT` | No | `3000` | Port number for server |
| `PROJECT_NAME_API_KEY` | Yes* | - | API key for external services |
| `PROJECT_NAME_LOG_LEVEL` | No | `info` | Logging level (debug/info/warn/error) |

*Required when using API features

**Example .env file:**
```bash
# Environment
PROJECT_NAME_ENV=development

# Server
PROJECT_NAME_PORT=3000

# API (required for API features)
PROJECT_NAME_API_KEY=your-api-key-here

# Logging
PROJECT_NAME_LOG_LEVEL=debug
```

**Security Note:** Never commit `.env` to version control. It's already in `.gitignore`.

### Configuration File

Optionally, create a configuration file:

**project.config.json:**
```json
{
  "port": 3000,
  "host": "localhost",
  "logging": {
    "level": "info",
    "format": "json"
  },
  "features": {
    "featureX": true,
    "featureY": false
  }
}
```

**TypeScript Configuration:**
```typescript
import { defineConfig } from 'project-name';

export default defineConfig({
  port: 3000,
  logLevel: 'info'
});
```

---

## Verification

### Verify Installation

```bash
# Check version
project-name --version
# Expected output: project-name v1.0.0

# Check help
project-name --help
# Expected output: List of all commands

# Run health check
project-name doctor
# Expected output: ✓ All systems operational
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Expected: All tests pass
```

### Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Expected output:
# ✓ Starting [Project Name]
# ✓ Listening on http://localhost:3000
```

**Verify it's running:**
```bash
curl http://localhost:3000/health
# Expected output: {"status":"ok"}
```

---

## Troubleshooting

### Common Installation Issues

#### "EACCES: permission denied" Error

**Symptoms:**
```
npm ERR! Error: EACCES: permission denied
```

**Solution:**
```bash
# Fix npm permissions (recommended)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### "Cannot find module" Error

**Symptoms:**
```
Error: Cannot find module 'project-name'
```

**Solution:**
```bash
# Reinstall the package
npm uninstall -g project-name
npm install -g project-name

# Verify it's installed
npm list -g project-name

# Check PATH
echo $PATH | grep "$(npm root -g)/.bin"
```

#### "node:bad option" Error

**Symptoms:**
```
node: bad option: --loader
```

**Solution:**
```bash
# Check Node.js version
node --version

# If below 20, upgrade Node.js
nvm install 20
nvm use 20
```

#### Types Not Found (TypeScript)

**Symptoms:**
```
TS2307: Cannot find module 'project-name' or its corresponding type declarations.
```

**Solution:**
```bash
# Rebuild the package
cd /path/to/project
npm run build

# Restart TypeScript server (VSCode)
# Command Palette → "TypeScript: Restart TS Server"

# Clear cache
rm -rf node_modules/.cache
npx tsc --noCache
```

### Platform-Specific Issues

<details>
<summary>Windows: "EPERM: operation not permitted, symlink"</summary>

**Solution:**
- Run terminal as Administrator
- Or enable Developer Mode in Settings

</details>

<details>
<summary>macOS: "gyp: No Xcode or CLT version detected"</summary>

**Solution:**
```bash
xcode-select --install
```

</details>

<details>
<summary>Linux: "ENOSPC: system limit for file watchers"</summary>

**Solution:**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

</details>

### Diagnostic Commands

Gather information for issue reports:

```bash
# System information
echo "=== System Information ==="
echo "OS: $(uname -s)"
echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "Git: $(git --version)"

# Package information
echo -e "\n=== Package Information ==="
npm list -g project-name
npm config get prefix

# Path information
echo -e "\n=== PATH ==="
echo $PATH | tr ':' '\n' | grep node

# npm configuration
echo -e "\n=== npm Configuration ==="
npm config list
```

### Getting Help

If you're still having trouble:

1. Check the [GitHub Issues](https://github.com/username/project/issues)
2. Search existing issues
3. Create a new issue with:
   - OS and version
   - Node.js and npm versions
   - Error message
   - Steps to reproduce
   - Diagnostic output

---

## Advanced Setup

### Development Setup

For contributors and advanced users:

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/project.git
cd project

# Install dependencies
npm install

# Install development dependencies
npm install --include=dev

# Run in development mode with hot reload
npm run dev:watch

# Run tests in watch mode
npm test -- --watch

# Run linter
npm run lint

# Format code
npm run format
```

### npm Link (Local Development)

Develop [Project Name] locally and test in another project:

```bash
# In the project directory
cd /path/to/project
npm run build
npm link

# In your test project
cd /path/to/test-project
npm link project-name

# Use it
import { something } from 'project-name';
```

### Docker Development

```bash
# Build the Docker image
docker build -t project-name:dev .

# Run with volume mount for live reload
docker run -v $(pwd):/app -p 3000:3000 project-name:dev

# Run with custom environment
docker run -e PROJECT_NAME_API_KEY=xxx -p 3000:3000 project-name:dev
```

### CI/CD Setup

**GitHub Actions:**
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run build
```

---

## Uninstallation

### Remove Global Installation

```bash
npm uninstall -g project-name

# Verify removal
npm list -g | grep project-name  # Should show nothing
```

### Remove Project Files

```bash
# Remove cloned repository
rm -rf /path/to/project

# Remove symlink (if created)
rm -f $(npm root -g)/project-name
```

### Clean npm Cache (Optional)

```bash
npm cache clean --force
```

### Remove Configuration

```bash
# Remove .env file
rm -f /path/to/project/.env

# Remove configuration file
rm -f ~/.config/project-name/config.json
```

---

## Next Steps

- Read the [Usage Guide](USAGE.md) for detailed usage instructions
- Check the [API Documentation](docs/api.md) for API reference
- See [Contributing](CONTRIBUTING.md) to contribute to the project
- Visit the [GitHub Repository](https://github.com/username/project) for updates

---

**Still having issues?** [Open an issue on GitHub](https://github.com/username/project/issues/new)
```

---

## 8. Reference URLs

### Official Documentation

#### npm Documentation
- npm install: https://docs.npmjs.com/cli/v10/commands/npm-install
- npm link: https://docs.npmjs.com/cli/v10/commands/npm-link
- npm scripts: https://docs.npmjs.com/cli/v10/using-npm/scripts
- package.json: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
- npm config: https://docs.npmjs.com/cli/v10/using-npm/config

#### Node.js Documentation
- Installation: https://nodejs.org/en/download/
- Environment variables: https://nodejs.org/api/cli.html#environment-variables
- Command line options: https://nodejs.org/api/cli.html

#### TypeScript Documentation
- Installation: https://www.typescriptlang.org/download
- tsconfig.json: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
- Module resolution: https://www.typescriptlang.org/docs/handbook/module-resolution.html

### Open-Source Projects to Study

#### CLI Tools
- **Commander.js**: https://github.com/tj/commander.js
- **Yargs**: https://github.com/yargs/yargs
- **Oclif**: https://github.com/oclif/oclif
- **tsx**: https://github.com/privatenumber/tsx
- **ts-node**: https://github.com/TypeStrong/ts-node

#### Build Tools
- **Vite**: https://github.com/vitejs/vite
- **Webpack**: https://github.com/webpack/webpack
- **esbuild**: https://github.com/evanw/esbuild

#### Testing Frameworks
- **Vitest**: https://github.com/vitest-dev/vitest
- **Jest**: https://github.com/jestjs/jest

#### Package Managers
- **npm**: https://github.com/npm/cli
- **Yarn**: https://github.com/yarnpkg/berry
- **pnpm**: https://github.com/pnpm/pnpm

### Best Practice Guides

#### Documentation
- Write the Docs: https://www.writethedocs.org/
- Divio Documentation System: https://documentation.divio.com/
- README Best Practices: https://github.com/README.md/README.md
- CLI Guidelines: https://clig.dev/

#### Node.js Best Practices
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Awesome Node.js: https://github.com/sindresorhus/awesome-nodejs

#### TypeScript Best Practices
- TypeScript Cheatsheets: https://github.com/typescript-cheatsheets/react
- TypeScript Deep Dive: https://basarat.gitbook.io/typescript/

### Installation Tools

#### Version Managers
- nvm: https://github.com/nvm-sh/nvm
- nvm-windows: https://github.com/coreybutler/nvm-windows
- fnm: https://github.com/Schniz/fnm

#### Environment Management
- dotenv: https://github.com/motdotla/dotenv
- cross-env: https://github.com/kentcdodds/cross-env

---

## Summary

This research document provides comprehensive patterns and best practices for writing installation documentation for Node.js/TypeScript projects. Key takeaways:

1. **Progressive Disclosure**: Quick Start → Standard Installation → Advanced Setup
2. **Multiple Installation Methods**: npm, yarn, pnpm, Docker, from source
3. **Clear Prerequisites**: Version requirements with check commands
4. **Comprehensive Troubleshooting**: Organized by error message
5. **Environment Variables**: Table format + detailed explanations
6. **Security Best Practices**: .env files, API key management
7. **npm Link Documentation**: Complete workflow with TypeScript considerations
8. **Platform-Specific Instructions**: Windows, macOS, Linux variations

Use the provided template as a starting point and customize it for your project's specific needs.

---

**Research compiled:** 2026-01-23
**Sources:** Existing project research, official documentation, and industry best practices
