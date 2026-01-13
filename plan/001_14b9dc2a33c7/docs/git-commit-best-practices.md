# Git Commit Best Practices and Patterns for Automated Commit Workflows

This document compiles best practices for Git commit operations, with a focus on automated workflows, CI/CD integration, and tooling contexts.

## Table of Contents

1. [Commit Message Formatting](#1-commit-message-formatting)
2. [Git Aliases for Commits](#2-git-aliases-for-commits)
3. [Co-Authored-By Trailer Format](#3-co-authored-by-trailer-format)
4. [Excluding Files from Git Operations](#4-excluding-files-from-git-operations)
5. [Checking Staged Files Before Committing](#5-checking-staged-files-before-committing)
6. [Getting Commit Hash After Creation](#6-getting-commit-hash-after-creation)
7. [Automated Commits in CI/CD and Tooling](#7-automated-commits-in-cicd-and-tooling)

---

## 1. Commit Message Formatting

### Conventional Commits Specification

The Conventional Commits specification provides a standardized format for commit messages that enables automated parsing, changelog generation, and semantic versioning.

#### Format Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process, auxiliary tools, or dependencies
- **ci**: CI/CD configuration changes
- **build**: Build system or dependency changes
- **revert**: Reverts a previous commit

#### Examples

```
feat(api): add user authentication endpoint

Implement OAuth2 authentication with support for Google and GitHub
providers. This endpoint validates JWT tokens and returns user profiles.

Closes #123
```

```
fix(database): resolve connection pool exhaustion

Increase connection pool size from 10 to 50 to handle concurrent
requests during peak load. Add connection timeout validation.

Fixes #456
```

```
chore(deps): upgrade lodash from 4.17.20 to 4.17.21

Security advisory: https://github.com/advisories/GHSA-4xc9-xhr7-vjm4
```

#### Best Practices

1. **Use imperative mood**: "add feature" not "added feature" or "adds feature"
2. **Keep description concise**: Limit to 50 characters for the subject line
3. **Wrap body at 72 characters**: For readability in Git log output
4. **Explain what and why**: Not how (the code shows how)
5. **Reference issues**: Use issue/PR numbers for traceability
6. **Use breaking change footer**: For breaking changes, add `BREAKING CHANGE:` footer

#### Breaking Change Format

```
feat: remove deprecated API endpoint

The deprecated /api/v1/users endpoint has been removed. Migrate to
/api/v2/users before upgrading.

BREAKING CHANGE: /api/v1/users endpoint no longer available. Use
/api/v2/users instead.
```

### Additional Commit Message Standards

#### Emoji Commits (Optional)

Some projects use emoji prefixes for visual scanning:

```
✨ feat: add new feature
🐛 fix: fix bug
📝 docs: update documentation
♻️  refactor: refactor code
⚡ perf: improve performance
✅ test: add tests
🔧 chore: update configuration
```

#### Commitlint Integration

Install commitlint to enforce commit message standards:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
```

**Documentation:**

- Conventional Commits: https://www.conventionalcommits.org/
- Commitlint: https://commitlint.js.org/
- Angular Commit Convention: https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit

---

## 2. Git Aliases for Commits

Git aliases allow you to create custom shortcuts for common Git operations, improving workflow efficiency.

### Creating Git Aliases

Add aliases to your `~/.gitconfig` or use `git config`:

```bash
# Global alias configuration
git config --global alias.<alias-name> "<git-command>"
```

### Essential Commit Aliases

#### Basic Commit Aliases

```bash
# Add all and commit
git config --global alias.ac '!git add -A && git commit'
git config --global alias.acm '!git add -A && git commit -m'

# Commit with message
git config --global alias.cm 'commit -m'

# Amend last commit (keep message)
git config --global alias.amend 'commit --amend --no-edit'

# Amend last commit (edit message)
git config --global alias.amendm 'commit --amend -m'
```

#### Advanced Automation Aliases

```bash
# Conventional commits with type prompts
git config --global alias.feat '!f() { git add -A && git commit -m "feat: $1"; }; f'
git config --global alias.fix '!f() { git add -A && git commit -m "fix: $1"; }; f'
git config --global alias.docs '!f() { git add -A && git commit -m "docs: $1"; }; f'
git config --global alias.chore '!f() { git add -A && git commit -m "chore: $1"; }; f'

# Add all, commit, and push
git config --global alias.acp '!git add -A && git commit -m "$1" && git push'
git config --global alias.cmp '!git commit -m "$1" && git push'

# Undo last commit (keep changes)
git config --global alias.uncommit 'reset --soft HEAD~1'

# View staged changes
git config --global alias.diffs 'diff --staged'

# View log with graph
git config --global alias.lg "log --graph --oneline --decorate --all"
```

#### Claude-Specific Aliases

For automated commits with co-authorship:

```bash
# Alias for Claude Code commits
git config --global alias.commit-claude '!f() { \
  git add -A && \
  git commit -m "$(cat <<'"'"'EOF'"'"'
$1

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"; \
}; f'

# Usage: git commit-claude "feat: add new feature"
```

#### Workflow Aliases

```bash
# Quick status, diff, and commit
git config --global alias.review '!git status && echo "---" && git diff --staged'

# Commit with conventional commit template
git config --global alias.cc '!f() { \
  echo "Select type:"; \
  echo "1) feat  2) fix  3) docs  4) style  5) refactor"; \
  echo "6) test  7) chore  8) ci"; \
  read -p "Choice (1-8): " choice; \
  read -p "Description: " desc; \
  types=("feat" "fix" "docs" "style" "refactor" "test" "chore" "ci"); \
  git commit -m "${types[$((choice-1))]}: $desc"; \
}; f'
```

### Managing Aliases

#### View All Aliases

```bash
git config --global --get-regexp alias
```

#### Edit Git Config Directly

```bash
git config --global --edit
```

#### Remove an Alias

```bash
git config --global --unset alias.<alias-name>
```

**Documentation:**

- Git Aliases: https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases
- Git Alias Documentation: https://git-scm.com/docs/git-alias

---

## 3. Co-Authored-By Trailer Format

The Co-Authored-By trailer credits multiple contributors to a commit, commonly used in pair programming and AI-assisted development.

### Format Specification

```
Co-Authored-By: Name <email@example.com>
```

### Usage Examples

#### Single Co-Author

```git
Add user authentication feature

Implement OAuth2 authentication with Google provider integration.

Co-Authored-By: Jane Smith <jane@example.com>
```

#### Multiple Co-Authors

```git
Refactor database connection handling

Improve connection pool management and add proper error handling
for database timeouts.

Co-Authored-By: Alice Johnson <alice@example.com>
Co-Authored-By: Bob Williams <bob@example.com>
```

#### AI-Assisted Development (Claude)

```git
feat: add automated testing pipeline

Implement comprehensive CI/CD pipeline with automated testing,
linting, and deployment stages.

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Trailer Placement Rules

1. **Position**: At the end of the commit message
2. **Separator**: Blank line between body and trailers
3. **Format**: `Key: Value` with space after colon
4. **Case**: Standard capitalization (Co-Authored-By)
5. **Email**: Must use angle brackets format

### Scripting Co-Authored-By

#### Bash Script

```bash
#!/bin/bash

commit_message="$1"
co_authors=(
  "Co-Authored-By: Alice <alice@example.com>"
  "Co-Authored-By: Bob <bob@example.com>"
)

git commit -m "$(cat <<EOF
$commit_message

$(printf '%s\n' "${co_authors[@]}")
EOF
)"
```

#### Heredoc Format

```bash
git commit -m "$(cat <<'EOF'
feat: add new feature

Implementation description here.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Related Trailers

Other commit trailers that complement Co-Authored-By:

```
Reviewed-by: Name <email>
Acked-by: Name <email>
Signed-off-by: Name <email>
Helped-by: Name <email>
Reported-by: Name <email>
```

### GitHub Integration

GitHub automatically recognizes Co-Authored-By trailers and attributes commits to all listed authors in the contribution graph.

**Documentation:**

- GitHub Multiple Authors: https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors
- Git Trailer Documentation: https://git-scm.com/docs/git-interpret-trailers

---

## 4. Excluding Files from Git Operations

### .gitignore

Prevent files from being tracked by Git:

#### Syntax Examples

```gitignore
# Ignore specific files
config.local.env
secrets.json

# Ignore by pattern
*.log
*.tmp
*.swp

# Ignore directories
node_modules/
dist/
build/

# Ignore directory contents but keep directory
logs/*
!logs/.gitkeep

# Ignore all except specific files
temp/*
!temp/important.txt

# Comments start with #
# Use ! to negate (include exceptions)

# Ignore based on path
/local/config.json
**/production.env
```

#### Common Patterns

```gitignore
# Dependencies
node_modules/
vendor/
__pycache__/

# Build outputs
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.sublime-*

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
*.key
*.pem
```

### .gitattributes

Define file-specific attributes and behaviors:

```gitattributes
# Language detection
 linguist-language=Python
*.js linguist-language=JavaScript

# Line endings
* text=auto
*.sh text eol=lf
*.bat text eol=crlf

# Exclude from exports
tests/ export-ignore
docs/ export-ignore
.gitattributes export-ignore

# Exclude from diff
package-lock.json -diff

# LFS handling
*.psd filter=lfs diff=lfs merge=lfs -text
```

### Temporary Exclusion

#### Sparse Checkout

```bash
# Enable sparse checkout
git config core.sparseCheckout true

# Define files to include
echo "src/" > .git/info/sparse-checkout
echo "package.json" >> .git/info/sparse-checkout

# Checkout
git checkout
```

#### Assume Unchanged

```bash
# Stop tracking changes to a file (local only)
git update-index --assume-unchanged config.local.env

# Resume tracking
git update-index --no-assume-unchanged config.local.env
```

#### Skip Worktree

```bash
# More persistent than assume-unchanged
git update-index --skip-worktree config/secrets.json

# Undo
git update-index --no-skip-worktree config/secrets.json
```

### Exclude from Specific Operations

#### Exclude from git add

```bash
# Add everything except .env files
git add .

# Interactive add with exclusion
git add -i

# Add specific paths only
git add src/ lib/ package.json
```

#### Exclude from git status

```bash
# Show untracked files matching pattern
git status --untracked-files=all

# Exclude untracked files from status
git status -u  # or --untracked-files=normal
```

### Security Best Practices

```gitignore
# Never commit secrets
*.env
*.key
*.pem
secrets/
credentials.json
.id_rsa
.aws/credentials

# But keep example files
.env.example
secrets.example.json
```

**Documentation:**

- Gitignore: https://git-scm.com/docs/gitignore
- Gitattributes: https://git-scm.com/docs/gitattributes
- GitHub Gitignore: https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files

---

## 5. Checking Staged Files Before Committing

Always verify staged changes before committing to prevent accidental commits.

### Git Commands for Checking Staged Files

#### git status

Shows current state including staged files:

```bash
git status
```

**Output Example:**

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   src/index.js
        new file:   src/utils.js

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   README.md
```

#### git diff --staged

Shows actual changes in staged files:

```bash
git diff --staged
# or
git diff --cached
```

**Usage Example:**

```bash
# Check staged changes
git diff --staged

# Check staged changes for specific file
git diff --staged src/index.js

# Get statistics
git diff --staged --stat
```

#### git diff

Shows unstaged changes (not yet staged):

```bash
git diff
```

#### git diff HEAD

Shows all changes (staged and unstaged) vs last commit:

```bash
git diff HEAD
```

### Automated Pre-Commit Checks

#### Script to Verify Staged Files

```bash
#!/bin/bash

# Check if files are staged
if git diff --staged --quiet; then
  echo "No files are staged. Please stage files first."
  exit 1
fi

# Show staged changes
echo "Staged files:"
git diff --staged --name-only

# Show diff
echo "\nStaged changes:"
git diff --staged

# Prompt for confirmation
read -p "Continue with commit? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Commit cancelled."
  exit 1
fi
```

#### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check for secrets
if git diff --staged --name-only | grep -E "\.(env|key|pem)$"; then
  echo "Warning: Attempting to commit potentially sensitive files!"
  exit 1
fi

# Check for console.log
if git diff --staged | grep "^\+.*console\.log"; then
  echo "Warning: console.log detected in staged changes"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

#### Integration with Tools

```bash
# Using Husky for pre-commit hooks
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

### Comprehensive Pre-Commit Workflow

```bash
#!/bin/bash

# Comprehensive pre-commit check
echo "=== Pre-Commit Check ==="

# 1. Check if files are staged
echo "1. Checking for staged files..."
if git diff --staged --quiet; then
  echo "   No files staged. Exiting."
  exit 1
fi
echo "   ✓ Files are staged"

# 2. Show staged files
echo "2. Staged files:"
git diff --staged --name-status

# 3. Show diff statistics
echo "3. Change statistics:"
git diff --staged --stat

# 4. Run tests
echo "4. Running tests..."
if npm test; then
  echo "   ✓ Tests passed"
else
  echo "   ✗ Tests failed"
  exit 1
fi

# 5. Check for sensitive patterns
echo "5. Checking for sensitive patterns..."
if git diff --staged | grep -i "password\|secret\|api.*key"; then
  echo "   ⚠ Warning: Potentially sensitive content detected"
  read -p "   Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "=== Pre-Commit Check Complete ==="
```

**Documentation:**

- Git Status: https://git-scm.com/docs/git-status
- Git Diff: https://git-scm.com/docs/git-diff
- Git Hooks: https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks

---

## 6. Getting Commit Hash After Creation

Retrieve the commit hash (SHA-1) immediately after creating a commit.

### Methods to Get Commit Hash

#### Method 1: git rev-parse (Recommended)

```bash
# Get full commit hash
git rev-parse HEAD

# Get short commit hash (7 characters)
git rev-parse --short HEAD

# Get hash of specific commit
git rev-parse HEAD~1
```

#### Method 2: git log

```bash
# Full hash
git log -1 --format="%H"

# Short hash
git log -1 --format="%h"

# Custom format
git log -1 --format="%H - %an, %ar : %s"
```

#### Method 3: Parse git commit output

```bash
# Capture from git commit output
COMMIT_HASH=$(git commit -m "message" | grep -oP '\[\w+ \K[a-f0-9]+')
echo $COMMIT_HASH
```

#### Method 4: Using git commit with post-processing

```bash
# Commit and get hash
git commit -m "message" && git rev-parse HEAD

# Store in variable
COMMIT_HASH=$(git commit -m "message" && git rev-parse HEAD)
echo "Created commit: $COMMIT_HASH"
```

### Practical Examples

#### Bash Function for Commit with Hash

```bash
#!/bin/bash

commit_and_get_hash() {
  local message="$1"
  local commit_hash

  # Create commit
  git commit -m "$message"

  # Get the hash
  commit_hash=$(git rev-parse HEAD)

  echo "Commit created: $commit_hash"
  return 0
}

# Usage
commit_and_get_hash "feat: add new feature"
```

#### Complete Workflow Script

```bash
#!/bin/bash

commit_with_metadata() {
  local message="$1"
  local commit_hash
  local commit_date
  local commit_author

  # Commit
  git commit -m "$message" || {
    echo "Commit failed"
    return 1
  }

  # Get metadata
  commit_hash=$(git rev-parse HEAD)
  commit_date=$(git log -1 --format="%ci")
  commit_author=$(git log -1 --format="%an")

  # Output
  echo "=== Commit Details ==="
  echo "Hash: $commit_hash"
  echo "Author: $commit_author"
  echo "Date: $commit_date"
  echo "Message: $message"

  # Return hash for use in scripts
  echo "$commit_hash"
}

# Usage
hash=$(commit_with_metadata "feat: add user authentication")
echo "Created commit: $hash"
```

#### Automated Tagging with Hash

```bash
#!/bin/bash

commit_and_tag() {
  local message="$1"
  local tag_prefix="${2:-v}"

  # Commit
  git commit -m "$message"
  local hash=$(git rev-parse HEAD)

  # Create tag with hash
  local tag="${tag_prefix}${hash:0:7}"
  git tag "$tag"

  echo "Created commit $hash and tag $tag"
}

# Usage
commit_and_tag "release: version 2.0.0" "release-"
```

#### CI/CD Integration

```bash
#!/bin/bash

# In CI/CD pipeline
git commit -m "ci: automated build update"
COMMIT_HASH=$(git rev-parse HEAD)

# Use in environment
export BUILD_COMMIT=$COMMIT_HASH
export BUILD_TAG="build-${COMMIT_HASH:0:7}"

# Create artifacts
echo "Commit: $COMMIT_HASH" > build-info.txt
```

### Getting Hash from Remote

```bash
# After pushing
git push origin main
REMOTE_HASH=$(git ls-remote origin main | awk '{print $1}')

# Verify local and remote match
LOCAL_HASH=$(git rev-parse origin/main)
if [ "$REMOTE_HASH" = "$LOCAL_HASH" ]; then
  echo "Local and remote are in sync"
fi
```

### Additional Git Log Formats

```bash
# Various formats for getting commit info
git log -1 --format="%H"      # Full hash
git log -1 --format="%h"      # Short hash
git log -1 --format="%T"      # Tree hash
git log -1 --format="%P"      # Parent hash(es)
git log -1 --format="%an"     # Author name
git log -1 --format="%ae"     # Author email
git log -1 --format="%cn"     # Committer name
git log -1 --format="%ce"     # Committer email
git log -1 --format="%s"      # Subject
git log -1 --format="%b"      # Body
git log -1 --format="%ci"     # Commit date (ISO 8601)
git log -1 --format="%cr"     # Commit date (relative)
```

**Documentation:**

- Git Rev-Parse: https://git-scm.com/docs/git-rev-parse
- Git Log: https://git-scm.com/docs/git-log
- Git Commit: https://git-scm.com/docs/git-commit

---

## 7. Automated Commits in CI/CD and Tooling

Best practices for automated commits in CI/CD pipelines, bots, and development tools.

### Principles for Automated Commits

1. **Transparency**: Clearly identify automated commits
2. **Traceability**: Link to CI/CD runs or issues
3. **Consistency**: Use consistent message formats
4. **Safety**: Validate changes before committing
5. **Reversibility**: Ensure commits can be easily reverted

### Commit Message Patterns for Automation

#### CI/CD Generated Commits

```
ci: automated deployment to production [skip ci]

Build: #1234
Commit: abc123def
Built by: GitHub Actions
```

#### Dependency Update Bots

```
chore(deps): update lodash from 4.17.20 to 4.17.21

Security update by Dependabot
Link: https://github.com/advisories/GHSA-4xc9-xhr7-vjm4
```

#### Documentation Generation

```
docs: auto-generate API documentation

Generated from source code comments
Build: https://ci.example.com/build/456
```

#### Version Bumps

```
chore: bump version from 1.2.3 to 1.2.4

Automated version bump by release workflow
```

### GitHub Actions Examples

#### Automated Dependency Update

```yaml
name: Update Dependencies

on:
  schedule:
    - cron: '0 0 * * 0'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Update dependencies
        run: |
          npm update
          npm audit fix

      - name: Check for changes
        id: verify
        run: |
          if [[ -n $(git status --porcelain) ]]; then
            echo "changed=true" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi

      - name: Commit changes
        if: steps.verify.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package*.json
          git commit -m "chore(deps): update dependencies [skip ci]"
          git push
```

#### Automated Changelog

```yaml
name: Generate Changelog

on:
  push:
    branches:
      - main

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Generate changelog
        run: |
          git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s" > CHANGELOG.new
          echo -e "\n## $(date +'%Y-%m-%d')\n" | cat - CHANGELOG.new > CHANGELOG.md

      - name: Commit changelog
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add CHANGELOG.md
          git commit -m "docs: update changelog [skip ci]"
          git push
```

### GitLab CI Examples

```yaml
update_version:
  stage: deploy
  script:
    - |
      # Increment version
      NEW_VERSION=$(node -p "require('./package.json').version.split('.').map((n,i)=>i===2?++n:n).join('.')")
      npm version $NEW_VERSION --no-git-tag-version

      # Commit and push
      git config user.email "gitlab-ci@example.com"
      git config user.name "GitLab CI"
      git add package.json package-lock.json
      git commit -m "chore: bump version to $NEW_VERSION"
      git push origin main
  only:
    - main
```

### Bot-Specific Patterns

#### GitHub Bot Configuration

```bash
# Set bot identity
git config user.name "MyBot[bot]"
git config user.email "123456+MyBot[bot]@users.noreply.github.com"
```

#### Bot Commit Messages

```
bot: format code with prettier

Auto-formatted by MyBot
Commit: https://github.com/user/repo/commit/abc123
```

### Safety Checks for Automation

#### Pre-Commit Validation Script

```bash
#!/bin/bash

# Automated commit safety checks

# 1. Check for secrets
if git diff --staged | grep -i "password\|secret\|api_key\|token"; then
  echo "ERROR: Potential secrets detected in staged changes"
  exit 1
fi

# 2. Check for large files
while IFS= read -r file; do
  if [ -f "$file" ] && [ $(stat -f%z "$file") -gt 10485760 ]; then
    echo "ERROR: Large file detected: $file"
    exit 1
  fi
done < <(git diff --staged --name-only --diff-filter=ACM)

# 3. Verify branch
if [ "$(git rev-parse --abbrev-ref HEAD)" = "main" ]; then
  echo "WARNING: Committing directly to main branch"
fi

# 4. Check for merge conflicts
if git diff --staged | grep -E "^[\+\-]{7}"; then
  echo "ERROR: Merge conflict markers detected"
  exit 1
fi

echo "All safety checks passed"
```

### Rollback Automation

```bash
#!/bin/bash

# Automated rollback script

rollback_commit() {
  local commit_hash="$1"
  local reason="$2"

  # Revert commit
  git revert --no-commit "$commit_hash"

  # Create rollback commit
  git commit -m "ci: rollback $commit_hash

  Reason: $reason

  Rolled-back-by: $CI_PIPELINE_URL"

  # Push
  git push origin main
}

# Usage
rollback_commit "abc123def" "Production bug detected"
```

### Best Practices Summary

#### DO:

- Use `[skip ci]` or `[ci skip]` to prevent infinite loops
- Include CI/CD run URLs in commit messages
- Use consistent naming for bot accounts
- Validate changes before committing
- Use dry-run modes for testing
- Implement proper error handling
- Log all automated actions

#### DON'T:

- Commit secrets or sensitive data
- Push to protected branches without proper checks
- Create commits without clear purpose
- Ignore failed validation checks
- Commit large binary files
- Make destructive changes without confirmation

### Example Complete Automated Workflow

```bash
#!/bin/bash

set -e  # Exit on error

# Configuration
BOT_NAME="AutoDeploy[bot]"
BOT_EMAIL="bot@example.com"
BRANCH="main"

# Setup git identity
git config user.name "$BOT_NAME"
git config user.email "$BOT_EMAIL"

# Pull latest changes
git pull origin "$BRANCH"

# Make changes (example: update documentation)
npm run generate-docs

# Check for changes
if git diff --quiet; then
  echo "No changes to commit"
  exit 0
fi

# Validate changes
npm run lint
npm run test

# Stage changes
git add docs/

# Commit with detailed message
git commit -m "docs: auto-generate API documentation

Generated from: $(git rev-parse HEAD)
Build: $CI_PIPELINE_URL
Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

[skip ci]"

# Push changes
git push origin "$BRANCH"

echo "Documentation updated successfully"
```

### Monitoring and Alerting

```bash
#!/bin/bash

# Log commit for monitoring

log_commit() {
  local commit_hash="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Send to monitoring system
  curl -X POST \
    -H "Content-Type: application/json" \
    -d "{\"commit\":\"$commit_hash\",\"timestamp\":\"$timestamp\",\"type\":\"automated\"}" \
    https://monitoring.example.com/api/events
}

# Usage
COMMIT_HASH=$(git rev-parse HEAD)
log_commit "$COMMIT_HASH"
```

**Documentation:**

- GitHub Actions: https://docs.github.com/en/actions
- GitLab CI/CD: https://docs.gitlab.com/ee/ci/
- Automating with Git: https://git-scm.com/book/en/v2/Git-Tools-Automation
- Conventional Changelog: https://github.com/conventional-changelog/conventional-changelog

---

## Additional Resources

### Official Documentation

- Git Documentation: https://git-scm.com/doc
- GitHub Flow: https://docs.github.com/en/get-started/quickstart/github-flow
- GitLab Flow: https://docs.gitlab.com/ee/topics/gitlab_flow.html

### Tools and Libraries

- Commitlint: https://commitlint.js.org/
- Husky: https://typicode.github.io/husky/
- Lefthook: https://github.com/evilmartians/lefthook
- Conventional Changelog: https://github.com/conventional-changelog/conventional-changelog

### Community Standards

- Conventional Commits: https://www.conventionalcommits.org/
- Angular Commit Convention: https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit
- Semantic Versioning: https://semver.org/

---

## Conclusion

Following these best practices ensures:

1. **Consistent commit history** that's easy to read and understand
2. **Automated tooling compatibility** with changelog generators and versioning tools
3. **Collaboration clarity** through proper attribution and message formatting
4. **Safety and reliability** in automated workflows
5. **Maintainability** for long-term project health

When implementing automated commit workflows, always prioritize clarity, safety, and traceability to maintain a reliable and understandable commit history.
