# Configuration Documentation Best Practices

**Research Date:** 2026-01-23
**Document Version:** 1.0

## Table of Contents

1. [Environment Variable Documentation Standards](#environment-variable-documentation-standards)
2. [CLI Options Documentation](#cli-options-documentation)
3. [Industry Examples](#industry-examples)
4. [Document Structure](#document-structure)
5. [Templates and Patterns](#templates-and-patterns)

---

## Environment Variable Documentation Standards

### 1. Required vs Optional Variables

**Best Practice:** Clearly distinguish between required and optional configuration using visual indicators.

**Common Patterns:**

#### Pattern 1: Badge/Tag System

```markdown
| Variable    | Required | Type   | Default | Description                 |
| ----------- | -------- | ------ | ------- | --------------------------- |
| `API_KEY`   | Yes      | string | -       | Your API authentication key |
| `LOG_LEVEL` | No       | string | `info`  | Logging verbosity level     |
```

#### Pattern 2: Inline Markers

```markdown
### Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
- `API_SECRET_KEY` - Secret key for API authentication

**Optional:**

- `LOG_LEVEL` (default: `info`) - Logging level (debug, info, warn, error)
- `PORT` (default: `3000`) - Server port number
```

#### Pattern 3: YAML/Structured Format

```yaml
environment:
  required:
    - name: DATABASE_URL
      description: PostgreSQL connection string
      type: string
      example: 'postgresql://user:pass@host:5432/db'

  optional:
    - name: LOG_LEVEL
      description: Logging verbosity level
      type: string
      default: 'info'
      allowed_values: [debug, info, warn, error]
```

**Key Principles:**

- Always explicitly mark required variables
- Group required and optional variables separately for clarity
- Use visual formatting (tables, badges, headers) to make scannable
- Consider alphabetical ordering within groups

---

### 2. Documenting Default Values

**Best Practice:** Always show default values for optional variables to help users understand behavior without configuration.

**Documentation Patterns:**

#### Pattern 1: Inline Documentation

```markdown
- `TIMEOUT` (default: `30`) - Request timeout in seconds
- `MAX_RETRIES` (default: `3`) - Maximum retry attempts
- `ENABLE_CACHE` (default: `true`) - Enable response caching
```

#### Pattern 2: Table Format

```markdown
| Variable  | Default     | Description                |
| --------- | ----------- | -------------------------- |
| `HOST`    | `0.0.0.0`   | Bind address for server    |
| `PORT`    | `8080`      | Server port                |
| `WORKERS` | `CPU_COUNT` | Number of worker processes |
```

#### Pattern 3: Code Block with Comments

```bash
# .env.example

# Server Configuration
HOST=0.0.0.0          # Default: 0.0.0.0
PORT=8080             # Default: 8080
DEBUG=false           # Default: false

# Database Configuration
DB_HOST=localhost     # Default: localhost
DB_PORT=5432          # Default: 5432
DB_NAME=myapp         # Required: No default
```

**Key Principles:**

- Show the default value directly in the variable description
- For computed defaults (like `CPU_COUNT`), explain the logic
- If there's no default, explicitly state "Required" or "No default"
- Consider linking to the code that sets defaults for transparency

---

### 3. Security Best Practices for API Keys

**Best Practice:** Never expose actual secrets in documentation while still providing clear guidance on security requirements.

**Documentation Patterns:**

#### Pattern 1: Placeholder Values

```markdown
### Authentication

| Variable         | Required | Description                                                    |
| ---------------- | -------- | -------------------------------------------------------------- |
| `API_KEY`        | Yes      | Your API key from [developer portal](https://example.com/keys) |
| `WEBHOOK_SECRET` | Yes      | Secret for webhook signature verification                      |

**Getting Your API Key:**

1. Visit the [Developer Portal](https://example.com/developer)
2. Create a new application
3. Copy the API Key from the dashboard

**Security Notes:**

- Never commit `.env` files to version control
- Rotate keys regularly (recommended: every 90 days)
- Use different keys for development and production
- Add `.env` to your `.gitignore` file
```

#### Pattern 2: .env.example Approach

```bash
# .env.example - Copy this to .env and fill in values

# NEVER commit the actual .env file with real values!

# API Configuration
API_KEY=your_api_key_here              # Get from: https://example.com/api-keys
API_SECRET=your_api_secret_here        # Generate in account settings
WEBHOOK_SECRET=generate_random_string  # Use: openssl rand -base64 32

# Database Credentials
DB_PASSWORD=                          # Generate strong password (min 16 chars)
```

#### Pattern 3: Security Section

````markdown
## Security Configuration

### Sensitive Environment Variables

The following variables contain sensitive information:

- `API_SECRET_KEY` - HMAC signing secret
- `DATABASE_URL` - Contains credentials
- `REDIS_PASSWORD` - Redis authentication
- `OAUTH_CLIENT_SECRET` - OAuth provider secret

**Best Practices:**

1. **File Permissions**
   ```bash
   chmod 600 .env  # Only owner can read/write
   ```
````

2. **Git Protection**

   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

3. **Pre-commit Hooks**

   ```bash
   # Detect secrets before commit
   pip install pre-commit
   # Add hook to detect .env files
   ```

4. **Secrets Management (Production)**
   - Use AWS Secrets Manager / Azure Key Vault / HashiCorp Vault
   - Inject secrets via CI/CD pipeline
   - Consider using sealed secrets for Kubernetes

**Generating Secure Secrets:**

```bash
# Generate API secret (32 bytes)
openssl rand -base64 32

# Generate webhook signing secret
openssl rand -hex 32

# Generate database password
openssl rand -base64 24
```

````

**Key Principles:**
- Always use `.env.example` files with placeholder values
- Never commit actual secrets to documentation
- Include security setup instructions (file permissions, gitignore)
- Provide commands/methods for generating secure values
- Link to official documentation for obtaining credentials
- Document where to find keys (e.g., developer portal URLs)
- Include rotation recommendations

---

### 4. Configuration Priority Documentation

**Best Practice:** Explicitly document the precedence order when multiple configuration sources exist.

**Documentation Patterns:**

#### Pattern 1: Cascade Diagram
```markdown
## Configuration Priority

Configuration values are loaded in the following order (highest priority first):

````

1. Command-line flags (e.g., --port=9000)
   ↓
2. Shell environment variables (e.g., APP_PORT=9000)
   ↓
3. .env files (e.g., .env.local)
   ↓
4. Configuration files (e.g., config/app.yml)
   ↓
5. Built-in defaults

```

**Example:** If `PORT` is set in both an environment variable and config file, the environment variable takes precedence.
```

#### Pattern 2: Detailed Breakdown

````markdown
## Configuration Sources

### Priority Order (Highest to Lowest)

1. **Command-line Arguments**
   ```bash
   myapp --port=9000 --debug
   ```
````

- Takes precedence over all other sources
- Useful for one-time overrides

2. **Environment Variables**

   ```bash
   export APP_PORT=9000
   export APP_DEBUG=true
   ```

   - Overrides config files
   - Ideal for containerized deployments
   - Prefix: `APP_` (configurable)

3. **Environment Files**
   - `.env.local` - Local overrides (gitignored)
   - `.env.production` - Production settings
   - `.env` - Default configuration
   - `.env.test` - Test environment
   - Files are loaded in order above

4. **Configuration Files**
   - `config/app.json` - JSON format
   - `config/app.yml` - YAML format
   - `config/app.toml` - TOML format

5. **Built-in Defaults**
   - Hardcoded in application
   - Used only if no other source provides value

### Example Scenarios

**Scenario 1:** Setting production database URL

```bash
# Highest priority method
myapp --db-url=postgresql://prod-host/db

# Environment variable (recommended)
export APP_DB_URL=postgresql://prod-host/db

# Config file
# In config/app.yml: database.url: postgresql://prod-host/db
```

**Scenario 2:** Local development override

```bash
# .env.local (gitignored) overrides .env
# .env:        DEBUG=false
# .env.local:  DEBUG=true
# Result: DEBUG=true (highest priority .env file)
```

````

#### Pattern 3: Decision Tree
```markdown
## Configuration Loading

The application determines configuration values using this decision tree:

````

Is a CLI flag provided?
├── Yes: Use CLI flag value
└── No: Is an environment variable set?
├── Yes: Use environment variable value
└── No: Does a .env file exist?
├── Yes: Use .env file value
└── No: Does a config file exist?
├── Yes: Use config file value
└── No: Use built-in default

````

**Practical Example:**

```bash
# All three sources define PORT
myapp --port=8000        # CLI flag
export APP_PORT=7000     # Environment variable
# .env: PORT=6000        # Env file

# Result: Port 8000 (CLI flag wins)
````

````

**Key Principles:**
- Always document the complete priority chain
- Provide concrete examples showing conflicts and resolution
- Use visual aids (diagrams, trees, tables) for clarity
- Explain WHY certain sources have higher priority
- Document any prefix requirements (e.g., `APP_` prefix)
- Include common scenarios and their outcomes

---

## CLI Options Documentation

### 1. Standard Formats for CLI Reference Documentation

**Best Practice:** Follow POSIX/GNU conventions and structure documentation consistently.

**Documentation Structure Template:**

```markdown
# Command Name

## Synopsis

```bash
command-name [OPTIONS] <argument> [another-argument]
````

## Description

A brief description of what the command does and when to use it.

## Options

### Short and Long Forms

| Short | Long              | Default                    | Description                       |
| ----- | ----------------- | -------------------------- | --------------------------------- |
| `-h`  | `--help`          | -                          | Display help information          |
| `-v`  | `--version`       | -                          | Display version number            |
| `-V`  | `--verbose`       | `false`                    | Enable verbose output             |
| `-q`  | `--quiet`         | `false`                    | Suppress non-error output         |
| `-c`  | `--config=FILE`   | `~/.config/app/config.yml` | Path to configuration file        |
| `-o`  | `--output=FORMAT` | `json`                     | Output format (json, yaml, table) |
| `-d`  | `--debug`         | `false`                    | Enable debug mode                 |
|       | `--no-color`      | `false`                    | Disable colored output            |

### Flags (Boolean Options)

**`--verbose, -V`**
Enable verbose logging. Provides detailed information about operations.

**`--quiet, -q`**
Suppress all output except errors.

### Options with Values

**`--config=FILE, -c FILE`**
Specify a custom configuration file path.

- **Type:** File path
- **Default:** `~/.config/app/config.yml`
- **Example:** `--config=/etc/app/production.yml`

**`--output=FORMAT, -o FORMAT`**
Set the output format for command results.

- **Type:** Enumeration
- **Default:** `json`
- **Allowed Values:**
  - `json` - JSON output
  - `yaml` - YAML output
  - `table` - Human-readable table
- **Example:** `--output=table`

## Arguments

### Positional Arguments

**`<source>`**
The source file or directory to process.

- **Required:** Yes
- **Type:** Path
- **Example:** `/path/to/source`

**`[destination]`**
Optional destination path.

- **Required:** No
- **Type:** Path
- **Default:** Current directory
- **Example:** `/path/to/destination`

## Examples

### Basic Usage

```bash
# Show help
myapp --help

# Run with default settings
myapp input.txt
```

### Common Options

```bash
# Enable verbose output
myapp --verbose input.txt

# Use custom config
myapp --config=/etc/app/prod.conf input.txt

# Set output format
myapp --output=table input.txt

# Combine multiple flags
myapp -V -o yaml input.txt output.txt
```

### Advanced Usage

```bash
# Using all options
myapp --verbose --config=/etc/app/prod.conf --output=json --timeout=30 input.txt

# Quiet mode with custom timeout
myapp --quiet --timeout=60 input.txt
```

## Environment Variables

- `MYAPP_CONFIG` - Path to configuration file (overrides `--config`)
- `MYAPP_VERBOSE` - Enable verbose mode (overrides `--verbose`)
- `MYAPP_TIMEOUT` - Request timeout in seconds

## Exit Codes

| Code | Meaning            |
| ---- | ------------------ |
| 0    | Success            |
| 1    | General error      |
| 2    | Invalid user input |
| 3    | Network error      |
| 4    | File not found     |
| 5    | Permission denied  |

## See Also

- `myapp-config(5)` - Configuration file format
- `myapp-init(1)` - Initialize a new project

````

---

### 2. Presenting Flags, Options, and Arguments

**Best Practice:** Use consistent terminology and formatting for different parameter types.

**Terminology Standards:**

| Term | Definition | Example |
|------|------------|---------|
| **Flag** | Boolean option (on/off) | `--verbose`, `-v` |
| **Option** | Parameter that requires a value | `--output=json`, `-o json` |
| **Argument** | Positional parameter | `input.txt`, `output.txt` |

**Visual Presentation Patterns:**

#### Pattern 1: Grouped by Type
```markdown
## Command Options

### Output Options

- `--output=FORMAT, -o FORMAT` - Output format (json, yaml, table)
- `--pretty` - Pretty-print output (default: true)
- `--no-pretty` - Disable pretty printing
- `--color=WHEN` - Colorize output (always, never, auto)

### Connection Options

- `--timeout=SECONDS` - Request timeout (default: 30)
- `--retries=COUNT` - Retry attempts (default: 3)
- `--connect-timeout=SECONDS` - Connection timeout (default: 10)

### Authentication Options

- `--api-key=KEY` - API authentication key
- `--token=TOKEN` - Bearer token for authentication
- `--auth-file=PATH` - Path to auth credentials file
````

#### Pattern 2: Table Format (Reference Style)

```markdown
## Options Reference

| Option                | Type   | Default             | Description               |
| --------------------- | ------ | ------------------- | ------------------------- |
| **General**           |
| `-h, --help`          | flag   | -                   | Show help message         |
| `-V, --version`       | flag   | -                   | Show version              |
| `-v, --verbose`       | flag   | `false`             | Verbose output            |
| **Configuration**     |
| `-c, --config=FILE`   | path   | `~/.app/config.yml` | Config file location      |
| `--env=ENV`           | string | `production`        | Environment name          |
| **Output**            |
| `-o, --output=FORMAT` | enum   | `json`              | Output: json, yaml, table |
| `--pretty`            | flag   | `true`              | Pretty print output       |
| `--no-pretty`         | flag   | -                   | Disable pretty print      |
| **Network**           |
| `--timeout=SECS`      | int    | `30`                | Request timeout           |
| `--retries=COUNT`     | int    | `3`                 | Max retry attempts        |
```

#### Pattern 3: Man Page Style

```markdown
## OPTIONS

**-h, --help**
Display this help message and exit.

**-V, --version**
Output version information and exit.

**-v, --verbose**
Increase verbosity. Can be used multiple times for more verbosity.
(e.g., -v, -vv, -vvv)

**-q, --quiet**
Decrease verbosity. Suppress all output except errors.

**-c, --config=FILE**
Specify configuration file to use.
Default: ~/.config/app/config.yml

**-o, --output=FORMAT**
Set output format. FORMAT can be:
json - JSON output (default)
yaml - YAML output
table - Human-readable table

**--timeout=SECONDS**
Set request timeout in seconds.
Default: 30
Minimum: 1
Maximum: 300

**--dry-run**
Show what would be done without actually doing it.
```

**Key Principles:**

- Distinguish clearly between flags (boolean) and options (value-required)
- Always show both short and long forms when available
- Document data types (string, int, path, enum, etc.)
- Show default values explicitly
- Group related options together
- Cross-reference related commands
- Provide examples for complex options

---

### 3. Examples and Use Cases

**Best Practice:** Provide progressive examples from basic to advanced, covering common real-world scenarios.

**Example Documentation Template:**

````markdown
## Examples

### Quick Start

**Basic command usage:**

```bash
$ myapp
Welcome to MyApp v1.0.0!
```
````

### Common Operations

**Run with verbose output:**

```bash
$ myapp --verbose
[INFO] Starting application...
[DEBUG] Loading configuration from /home/user/.config/app/config.yml
[INFO] Application started successfully
```

**Specify custom configuration:**

```bash
$ myapp --config=/etc/app/production.yml
Using production configuration
Server started on port 8080
```

**Format output as table:**

```bash
$ myapp --output=table list
+------+----------+------------+
| ID   | Name     | Status     |
+------+----------+------------+
| 001  | Service1 | Running    |
| 002  | Service2 | Stopped    |
+------+----------+------------+
```

### Real-World Scenarios

**Scenario 1: Production Deployment**

```bash
# Using environment file with verbose logging
myapp --config=prod.conf --verbose --output=json
```

**Scenario 2: Local Development**

```bash
# Enable debug mode and pretty output
myapp --debug --pretty --config=dev.conf
```

**Scenario 3: Automation/CI/CD**

```bash
# Quiet mode for scripts, exit with code on error
myapp --quiet --timeout=10 && echo "Success"
```

**Scenario 4: Debugging Connection Issues**

```bash
# Maximum verbosity with timeout
myapp -vvv --timeout=60 --debug
```

### Combining Multiple Options

**Short options can be combined:**

```bash
# All these are equivalent:
myapp --verbose --quiet
myapp -v -q
myapp -vq
```

**Long options require equals sign or space:**

```bash
myapp --output=json
myapp --output json
```

### Using with Pipes and Redirection

**Save output to file:**

```bash
myapp --output=json > results.json
```

**Process with jq:**

```bash
myapp --output=json | jq '.data[] | select(.status == "active")'
```

**Filter with grep:**

```bash
myapp --verbose 2>&1 | grep ERROR
```

````

**Key Principles:**
- Start with simplest example
- Progress to realistic use cases
- Show output examples where helpful
- Include common gotchas/pitfalls
- Demonstrate option combinations
- Show integration with other tools (pipes, jq, etc.)
- Label examples with use cases

---

## Industry Examples

### 1. Docker CLI Documentation

**Source:** https://docs.docker.com/engine/reference/commandline/cli/

**Patterns Used:**

#### Structure
```markdown
# docker

## Description

The base command for the Docker CLI.

## Usage

docker [OPTIONS] COMMAND

## Options

| Option            | Default | Description |
|-------------------|---------|-------------|
| --config string   | ~\.docker\ | Location of config files |
| -c, --context string | | Name of context to use |
| -D, --debug       | false   | Enable debug mode |
| -H, --host list   | | Daemon socket to connect to |
| -l, --log-level string | info | Logging level |
| -v, --version     | false   | Print version information |
````

#### Key Patterns Identified:

1. **Table format** for quick reference
2. **Short + Long** options always shown together
3. **Default values** in separate column
4. **Type indication** (string, list, boolean)
5. **Global options** separated from command-specific options

#### Command Structure Pattern:

```markdown
# docker run

## Description

Run a command in a new container

## Usage

docker run [OPTIONS] IMAGE [COMMAND] [ARG...]

## Options

| Option             | Default | Description                 |
| ------------------ | ------- | --------------------------- |
| -d, --detach       | false   | Run container in background |
| --name string      |         | Assign name to container    |
| -p, --publish list |         | Publish port to host        |
| -v, --volume list  |         | Bind mount a volume         |
| -e, --env list     |         | Set environment variables   |
```

---

### 2. Kubernetes Documentation

**Source:** https://kubectl.docs.kubernetes.io/

**Patterns Used:**

#### Command Help Output Style:

```markdown
# kubectl

kubectl controls the Kubernetes cluster manager.

## Basic Commands (Beginner)

create Create a resource from a file
expose Take a replication controller, service, deployment and expose it
run Run a particular image on the cluster
set Set specific features on objects

## Intermediate Commands

explain Documentation of resources
get Display one or many resources
edit Edit a resource on the server
delete Delete resources by filenames, stdin, resources and names
```

#### Option Grouping Pattern:

```markdown
## Options

--add-dir-header
If true, adds the file directory to the header

--alsologtostderr
log to standard error as well as files

--as string
Username to impersonate for the operation

--as-group stringarray
Group to impersonate for the operation

--certificate-authority string
Path to a cert file for the certificate authority

--client-certificate string
Path to a client certificate file for TLS

--client-key string
Path to a client key file for TLS

--cluster string
The name of the kubeconfig cluster to use

--context string
The name of the kubeconfig context to use

## See Also

- kubectl-config(1) - kubeconfig documentation
- kubectl-options(1) - global options
```

#### Key Patterns Identified:

1. **Grouped by complexity** (beginner, intermediate, advanced)
2. **Detailed per-option descriptions** with line breaks
3. **Related command cross-references** at bottom
4. **Verbosity level categorization**
5. **Man page style** for options (long description format)

---

### 3. AWS CLI Documentation

**Source:** https://docs.aws.amazon.com/cli/

**Patterns Used:**

#### Command Reference Structure:

```markdown
# aws

## Description

The AWS Command Line Interface is a unified tool to manage your AWS services.

## Synopsis

aws [options] <command> <subcommand> [parameters]

## Options

| Option           | Description                                             |
| ---------------- | ------------------------------------------------------- |
| --debug          | Turn on debug logging                                   |
| --profile string | Use a specific profile from your credential file        |
| --region string  | The region to use (overrides config/env vars)           |
| --output string  | Formatting style for command output (json, text, table) |
| --query string   | JMESPath query string to filter output                  |
| --color string   | Colorize output (on, off, auto)                         |
```

#### Configuration Documentation Pattern:

```markdown
## Configuration

The AWS CLI uses two configuration files:

### Credentials File (~/.aws/credentials)
```

[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[user1]
aws_access_key_id = AKIAI44QH8DHBEXAMPLE
aws_secret_access_key = je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY

```

### Config File (~/.aws/config)

```

[default]
region = us-west-2
output = json

[profile user1]
region = us-east-1
output = table

```

### Precedence Rules

1. Command line options
2. Environment variables
3. Credentials file
4. Configuration file
5. Instance profile credentials
```

#### Key Patterns Identified:

1. **Profile-based configuration** documentation
2. **Multiple configuration sources** clearly documented
3. **Precedence rules** explicitly stated
4. **Example configs** with realistic values (no actual secrets)
5. **Cross-file references** (credentials vs config)

---

### 4. GitHub CLI (gh)

**Source:** https://cli.github.com/manual/

**Patterns Used:**

#### Command Manual Page Format:

```markdown
# gh(1)

## NAME

gh - GitHub CLI

## SYNOPSIS

gh [command] [flags]

## DESCRIPTION

gh is a tool for scripting GitHub interactions.

## COMMANDS

- pr
  Work with pull requests
- issue
  Work with issues
- repo
  Work with repositories
- release
  Work with releases
- auth
  Authenticate gh and git credentials
- config
  Update configuration

## FLAGS

--help
Show help for command
-R, --repo OWNER/REPO
Select another repository using the OWNER/REPO format
--version
Show gh version

## INHERITED FLAGS

These flags are available on all commands.

--help
Show help for command
--version
Show gh version

## ENVIRONMENT VARIABLES

GH_TOKEN
Authentication token (overrides config file)

GH_CONFIG_DIR
Location of config directory (default: ~/.config/gh)

GH_HOST
GitHub hostname (default: github.com)

## EXIT CODES

0
Successful execution
1
Generic error
```

#### Key Patterns Identified:

1. **Man page format** with standard sections (NAME, SYNOPSIS, DESCRIPTION)
2. **Inherited flags** documented separately
3. **Environment variables** grouped at end
4. **Exit codes** explicitly documented
5. **Command hierarchy** shown in Commands section

---

### 5. Anti-Patterns to Avoid

#### Anti-Pattern 1: No Default Values

```markdown
### DON'T DO THIS:

| Variable | Description     |
| -------- | --------------- |
| TIMEOUT  | Request timeout |
| PORT     | Server port     |

User doesn't know what happens if not set!
```

#### Anti-Pattern 2: Required Not Marked

```markdown
### DON'T DO THIS:

- API_KEY - Your API key
- SECRET_KEY - Your secret key
- LOG_LEVEL - Logging level

User can't tell which are required vs optional!
```

#### Anti-Pattern 3: No Type Information

```markdown
### DON'T DO THIS:

- MAX_RETRIES - Maximum retries
- ENABLE_DEBUG - Enable debugging
- PORT - Port number

What type is each? String, int, boolean?
```

#### Anti-Pattern 4: Examples Only, No Reference

```markdown
### DON'T DO THIS:

## Examples

myapp --flag1 value1 --flag2 value2
myapp --flag3 value3

No complete option reference!
```

#### Anti-Pattern 5: Mixed Terminology

```markdown
### DON'T DO THIS:

- Use "parameter", "option", "flag", "argument" inconsistently
- Sometimes "enable", sometimes "set", sometimes "configure"

Be consistent with terminology!
```

---

## Document Structure

### 1. Overall Organization Best Practices

**Best Practice:** Organize configuration documentation to serve different user needs (quick reference vs. detailed understanding).

#### Recommended Document Structure:

```markdown
# Configuration Guide

[TOC]

## Quick Reference

- Environment variables table
- CLI options table
- Common examples

## Environment Variables

### Required Variables

### Optional Variables

### Security & Secrets

### Priority/Precedence

## CLI Options

### Global Options

### Command-Specific Options

### Option Reference Table

## Configuration Files

### File Locations

### File Formats

### Example Configurations

## Examples

### Quick Start

### Common Use Cases

### Advanced Scenarios

## Troubleshooting

### Common Issues

### Debug Mode

### Getting Help
```

---

### 2. Separating Environment Variables, CLI Options, and Config Files

**Decision:** Should you separate or combine?

**Recommendation:** Use a **hybrid approach** - separate sections with clear cross-references.

#### Option A: Separate Documents

```
/docs
  ├── configuration.md       # Overview
  ├── environment-vars.md    # Detailed env var reference
  ├── cli-reference.md       # Detailed CLI reference
  └── config-files.md        # Detailed config file reference
```

**Pros:**

- Focused, scannable documents
- Easy to link to specific sections
- Smaller file sizes

**Cons:**

- Users may not know where to look
- More navigation required
- Risk of duplication

#### Option B: Single Comprehensive Document

```
/docs
  └── configuration.md       # All configuration in one place
```

**Pros:**

- Everything in one place
- Easier to search
- Better for print/PDF

**Cons:**

- Can become overwhelming
- Harder to navigate
- Slower to load for large docs

#### Option C: Hybrid (Recommended)

```
/docs
  ├── configuration.md              # Main doc with quick reference
  │   ├── Quick Reference Tables
  │   ├── Environment Variables (summary + detailed sections)
  │   ├── CLI Options (summary + detailed sections)
  │   ├── Configuration Files (summary + detailed sections)
  │   └── Examples
  │
  └── advanced/
      ├── env-var-reference.md      # Complete reference (linked from main)
      └── cli-reference.md          # Complete reference (linked from main)
```

**Implementation Template:**

```markdown
# Configuration

## Quick Reference

### Environment Variables

| Variable  | Required | Default | Description            |
| --------- | -------- | ------- | ---------------------- |
| `API_KEY` | Yes      | -       | API authentication key |
| `PORT`    | No       | `3000`  | Server port            |

[See complete environment variable reference →](advanced/env-var-reference.md)

### CLI Options

| Option     | Default | Description |
| ---------- | ------- | ----------- |
| `--help`   | -       | Show help   |
| `--port=N` | `3000`  | Server port |

[See complete CLI reference →](advanced/cli-reference.md)

---

## Environment Variables

### Required Variables

#### API_KEY

Your API authentication key.

**Get your key:** [Developer Portal](https://example.com/keys)

**Security:** Never commit to version control.

[More details →](advanced/env-var-reference.md#api_key)

---

## CLI Options

### Global Options

#### --help, -h

Display help information.

[More details →](advanced/cli-reference.md#help)
```

---

### 3. Cross-References Between Sections

**Best Practice:** Use cross-references to connect related configuration options across different sources.

#### Cross-Reference Patterns:

**Pattern 1: Configuration Equivalencies**

```markdown
## Environment Variable: APP_PORT

Sets the server port number.

**Equivalent CLI option:** `--port`
**Equivalent config file:** `server.port`

[See: CLI Options →](#cli-options)
[See: Configuration Files →](#configuration-files)
```

**Pattern 2: Configuration Hierarchy**

````markdown
## Setting the Database URL

You can configure the database connection in three ways:

### Priority Order

1. **CLI Flag** (highest priority)
   ```bash
   myapp --db-url=postgresql://...
   ```
````

[See: CLI Options →](#cli-options)

2. **Environment Variable**

   ```bash
   export APP_DB_URL=postgresql://...
   ```

   [See: Environment Variables →](#environment-variables)

3. **Configuration File** (lowest priority)
   ```yaml
   database:
     url: postgresql://...
   ```
   [See: Configuration Files →](#configuration-files)

### Recommendation

- **Development:** Use configuration file
- **Production:** Use environment variables
- **One-time override:** Use CLI flag

````

**Pattern 3: Related Options**
```markdown
### --timeout SECONDS

Set request timeout in seconds.

**Default:** `30`
**Range:** 1-300

**Related Options:**
- `--connect-timeout` - Connection timeout only
- `--read-timeout` - Read timeout only
- `--retries` - Number of retry attempts

**Related Environment Variable:** `APP_TIMEOUT`

**Example:**
```bash
# Set all timeouts
myapp --timeout=30 --connect-timeout=5 --read-timeout=20

# Or use environment variable
export APP_TIMEOUT=30
````

````

**Pattern 4: Navigation Links**
```markdown
## Configuration Priority

This option can be set in multiple ways:

1. [CLI Option: `--port`](#cli-options---port)
2. [Environment Variable: `APP_PORT`](#environment-variables-app_port)
3. [Config File: `server.port`](#configuration-files-serverport)

See: [Configuration Priority](#configuration-priority) for details.
````

---

### 4. Quick Reference vs. Detailed Documentation

**Best Practice:** Provide both quick reference (for experienced users) and detailed documentation (for new users).

#### Quick Reference Template:

````markdown
## Quick Reference

### Environment Variables

```bash
# Required
API_KEY=your_key_here
DATABASE_URL=postgresql://host/db

# Optional
PORT=3000                # Default: 3000
DEBUG=false              # Default: false
LOG_LEVEL=info           # Default: info (debug|info|warn|error)
TIMEOUT=30               # Default: 30 seconds
```
````

### CLI Options

```bash
myapp [OPTIONS]

Options:
  -h, --help              Show help
  -v, --version           Show version
  -p, --port=PORT         Server port (default: 3000)
  -d, --debug             Enable debug mode
  -c, --config=FILE       Config file path
  -o, --output=FORMAT     Output: json, yaml, table
```

[For detailed documentation, see below →](#detailed-documentation)

````

#### Detailed Documentation Template:

```markdown
## Detailed Documentation

### Environment Variables

#### API_KEY (Required)

Your API authentication key for accessing the service.

**Where to get it:**
1. Visit the [Developer Portal](https://example.com/developer)
2. Create a new application
3. Copy the API Key from the dashboard

**Format:** 32-character alphanumeric string

**Example:**
```bash
export API_KEY=abc123def456ghi789jkl012mno345pq
````

**Security Notes:**

- Never commit `.env` files with real API keys
- Rotate keys every 90 days
- Use different keys for dev/prod
- [See: Security Best Practices](#security-best-practices)

**Validation:**

- Must be exactly 32 characters
- Must contain only alphanumeric characters

[Back to Quick Reference →](#quick-reference)

````

---

## Templates and Patterns

### Template 1: Environment Variable Reference (Complete)

```markdown
# Environment Variables Reference

## Overview

This application uses environment variables for configuration. Variables can be set in:

1. Shell environment: `export VAR=value`
2. `.env` file: `VAR=value`
3. Docker: `-e VAR=value` or `--env-file`
4. Kubernetes: ConfigMaps/Secrets

[See: Configuration Priority](#configuration-priority)

---

## Quick Reference Table

| Variable | Required | Type | Default | Description |
|----------|----------|------|---------|-------------|
| `API_KEY` | Yes | string | - | API authentication key |
| `API_SECRET` | Yes | string | - | API secret key |
| `DATABASE_URL` | Yes | string | - | PostgreSQL connection string |
| `REDIS_URL` | No | string | `redis://localhost:6379` | Redis connection URL |
| `PORT` | No | integer | `3000` | Server port number |
| `HOST` | No | string | `0.0.0.0` | Server bind address |
| `LOG_LEVEL` | No | enum | `info` | Logging level |
| `NODE_ENV` | No | enum | `development` | Environment mode |
| `TIMEOUT` | No | integer | `30` | Request timeout (seconds) |
| `MAX_CONNECTIONS` | No | integer | `100` | Max database connections |

---

## Required Variables

### API_KEY

Your API authentication key.

**Type:** string (32 characters)
**Format:** Alphanumeric
**Required:** Yes

**How to obtain:**
1. Visit [Developer Portal](https://example.com/developer)
2. Navigate to API Keys section
3. Generate new key or copy existing

**Example:**
```bash
export API_KEY=abc123def456ghi789jkl012mno345pq
````

**Validation:**

- Length: Exactly 32 characters
- Characters: Alphanumeric only (a-z, A-Z, 0-9)

**Security:**

- Never commit to version control
- Rotate every 90 days
- Use different keys per environment
- [See: Security Best Practices](#security)

---

### API_SECRET

Your API secret for signing requests.

**Type:** string (64 characters)
**Format:** Base64-encoded
**Required:** Yes

**Example:**

```bash
export API_SECRET=dGVzdHNlY3JldGtleWJhc2U2NGVuY29kZWQzMnNoYXJlZA==
```

**Generation:**

```bash
# Generate secure secret
openssl rand -base64 32
```

**Security Warning:** This secret has elevated permissions. Keep it secure!

---

### DATABASE_URL

PostgreSQL connection string.

**Type:** connection URI
**Required:** Yes

**Format:**

```
postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
```

**Examples:**

```bash
# Standard
export DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# With SSL
export DATABASE_URL="postgresql://user:pass@db.example.com:5432/mydb?sslmode=require"

# Unix socket
export DATABASE_URL=postgresql:///mydb?host=/var/run/postgresql
```

**Connection Parameters:**

- `sslmode` - SSL mode (disable, allow, prefer, require, verify-ca, verify-full)
- `connect_timeout` - Connection timeout in seconds
- `statement_timeout` - Query timeout in seconds
- `pool_max_conns` - Maximum connections (default: from MAX_CONNECTIONS)

---

## Optional Variables

### PORT

Server port number.

**Type:** integer
**Default:** `3000`
**Range:** 1024-65535

**Example:**

```bash
export PORT=8080
```

**Notes:**

- Ports below 1024 require root privileges
- Ensure port is not blocked by firewall
- Check for conflicts with other services

---

### LOG_LEVEL

Logging verbosity level.

**Type:** enum
**Default:** `info`
**Allowed Values:**

- `error` - Errors only
- `warn` - Warnings and errors
- `info` - Normal information (default)
- `debug` - Detailed debugging info
- `trace` - Very detailed tracing

**Example:**

```bash
export LOG_LEVEL=debug
```

**Recommendations:**

- Development: `debug` or `trace`
- Production: `info` or `warn`
- Debugging: Enable `debug` temporarily

---

### TIMEOUT

Request timeout in seconds.

**Type:** integer
**Default:** `30`
**Range:** 1-300

**Example:**

```bash
export TIMEOUT=60
```

**Notes:**

- Applies to HTTP requests
- Database queries may have separate timeout
- Set higher than expected maximum processing time

---

## Configuration Priority

Configuration is loaded in this order (highest to lowest):

1. **Shell environment variables** (runtime export)
2. **`.env` files** (in order: `.env.local`, `.env.production`, `.env`)
3. **Built-in defaults**

### Example

```bash
# .env file
PORT=3000
LOG_LEVEL=info

# Shell overrides
export PORT=8080

# Result: PORT=8080 (shell wins), LOG_LEVEL=info (from .env)
```

---

## Environment Files

### File Locations

Files are searched in this order:

1. `.env.local` - Local overrides (gitignored)
2. `.env.[NODE_ENV]` - Environment-specific (e.g., `.env.production`)
3. `.env` - Default configuration
4. `/etc/app/default.env` - System-wide defaults

### Example .env File

```bash
# .env.example - Copy to .env and fill in values

# Application
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# API
API_KEY=your_api_key_here
API_SECRET=your_api_secret_here

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# Optional
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
TIMEOUT=30
```

**Security:** Never commit `.env` or `.env.local` to version control.

````

---

### Template 2: CLI Options Reference (Complete)

```markdown
# CLI Options Reference

## Usage

```bash
myapp [GLOBAL OPTIONS] <command> [COMMAND OPTIONS] [ARGUMENTS]
````

## Global Options

These options are available for all commands.

| Option              | Type | Default                    | Description                        |
| ------------------- | ---- | -------------------------- | ---------------------------------- |
| `-h, --help`        | flag | -                          | Show help message                  |
| `-V, --version`     | flag | -                          | Show version information           |
| `-v, --verbose`     | flag | `false`                    | Enable verbose output              |
| `-q, --quiet`       | flag | `false`                    | Suppress non-error output          |
| `-c, --config=FILE` | path | `~/.config/app/config.yml` | Config file path                   |
| `--color=WHEN`      | enum | `auto`                     | Color output (always, never, auto) |
| `--no-color`        | flag | -                          | Disable colored output             |

### --help, -h

Display help information for the command.

**Type:** flag
**Aliases:** `-h`

**Example:**

```bash
myapp --help
myapp --help <command>  # Command-specific help
```

---

### --verbose, -v

Enable verbose output for debugging.

**Type:** flag
**Aliases:** `-v`
**Default:** `false`

Can be used multiple times for increased verbosity:

- `-v` - Verbose
- `-vv` - More verbose
- `-vvv` - Maximum verbosity

**Example:**

```bash
myapp --verbose
myapp -vv
```

---

### --config=FILE, -c FILE

Specify path to configuration file.

**Type:** file path
**Aliases:** `-c`
**Default:** `~/.config/app/config.yml`

**Example:**

```bash
myapp --config=/etc/app/production.yml
myapp -c ./my-config.yml
```

**Supported formats:**

- YAML (`.yml`, `.yaml`)
- JSON (`.json`)
- TOML (`.toml`)

---

## Commands

### init

Initialize a new project.

```bash
myapp init [OPTIONS] [PROJECT_NAME]
```

**Options:**

| Option            | Type   | Default          | Description              |
| ----------------- | ------ | ---------------- | ------------------------ |
| `--template=NAME` | string | `default`        | Project template         |
| `--force`         | flag   | `false`          | Overwrite existing files |
| `--dir=PATH`      | path   | `./PROJECT_NAME` | Output directory         |

**Arguments:**

- `PROJECT_NAME` - Name of the project to create (optional)

**Examples:**

```bash
# Create new project with default template
myapp init myproject

# Use specific template
myapp init --template=react myproject

# Force overwrite
myapp init --force myproject

# Custom output directory
myapp init --dir=/path/to/output myproject
```

---

### run

Run the application.

```bash
myapp run [OPTIONS]
```

**Options:**

| Option            | Type   | Default   | Description            |
| ----------------- | ------ | --------- | ---------------------- |
| `-p, --port=PORT` | int    | `3000`    | Server port            |
| `-H, --host=HOST` | string | `0.0.0.0` | Server host            |
| `--watch`         | flag   | `false`   | Watch for file changes |
| `--inspect`       | flag   | `false`   | Enable inspector       |

**Examples:**

```bash
# Run on default port
myapp run

# Run on custom port
myapp run --port=8080

# Run with file watching
myapp run --watch

# Run with inspector
myapp run --inspect
```

---

### config

Manage configuration.

```bash
myapp config <subcommand> [OPTIONS]
```

**Subcommands:**

- `list` - List all configuration values
- `get <key>` - Get a configuration value
- `set <key> <value>` - Set a configuration value
- `unset <key>` - Remove a configuration value

**Examples:**

```bash
# List all config
myapp config list

# Get specific value
myapp config get server.port

# Set value
myapp config set server.port 8080

# Remove value
myapp config unset server.port
```

---

## Exit Codes

| Code | Meaning              |
| ---- | -------------------- |
| `0`  | Success              |
| `1`  | General error        |
| `2`  | Invalid user input   |
| `3`  | Network error        |
| `4`  | File not found       |
| `5`  | Permission denied    |
| `6`  | Configuration error  |
| `7`  | Authentication error |

## Environment Variables

The following environment variables affect CLI behavior:

- `MYAPP_CONFIG` - Path to configuration file (overrides `--config`)
- `MYAPP_VERBOSE` - Enable verbose mode (overrides `--verbose`)
- `MYAPP_COLOR` - Color output (always, never, auto)
- `NO_COLOR` - Disable colors (when set to any value)

## See Also

- [Configuration Guide](configuration.md)
- [Environment Variables](environment-variables.md)

````

---

### Template 3: Configuration File Reference

```markdown
# Configuration File Reference

## File Locations

Configuration files are searched in the following order:

1. `./app.yml` - Current directory
2. `~/.config/app/config.yml` - User directory
3. `/etc/app/config.yml` - System-wide

You can specify a custom location with:
```bash
myapp --config=/path/to/config.yml
````

---

## File Formats

### YAML Format (Recommended)

**File:** `config.yml`

```yaml
# Server Configuration
server:
  host: 0.0.0.0
  port: 3000
  workers: 4

# Logging
logging:
  level: info
  format: json
  output: stdout

# Database
database:
  url: postgresql://user:pass@localhost:5432/mydb
  pool:
    min: 2
    max: 10

# API Configuration
api:
  key: ${API_KEY}
  secret: ${API_SECRET}
  timeout: 30
  retries: 3

# Features
features:
  cache: true
  compression: true
  rate_limit: true
```

### JSON Format

**File:** `config.json`

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 3000,
    "workers": 4
  },
  "logging": {
    "level": "info",
    "format": "json"
  },
  "database": {
    "url": "postgresql://user:pass@localhost:5432/mydb",
    "pool": {
      "min": 2,
      "max": 10
    }
  }
}
```

---

## Configuration Options

### Server Section

#### host

Server bind address.

**Type:** string
**Default:** `0.0.0.0`

**Example:**

```yaml
server:
  host: 127.0.0.1
```

---

#### port

Server port number.

**Type:** integer
**Default:** `3000`
**Range:** 1024-65535

**Example:**

```yaml
server:
  port: 8080
```

**Environment Variable:** `PORT`

---

#### workers

Number of worker processes.

**Type:** integer
**Default:** Number of CPU cores
**Minimum:** 1

**Example:**

```yaml
server:
  workers: 8
```

---

### Logging Section

#### level

Logging verbosity.

**Type:** enum
**Default:** `info`
**Allowed Values:** `debug`, `info`, `warn`, `error`, `fatal`

**Example:**

```yaml
logging:
  level: debug
```

**Environment Variable:** `LOG_LEVEL`

---

#### format

Log output format.

**Type:** enum
**Default:** `json`
**Allowed Values:**

- `json` - Structured JSON logs
- `text` - Human-readable text
- `pretty` - Colored, formatted text

**Example:**

```yaml
logging:
  format: text
```

---

### Database Section

#### url

Database connection string.

**Type:** string
**Required:** Yes

**Example:**

```yaml
database:
  url: postgresql://user:pass@localhost:5432/mydb
```

**Environment Variable:** `DATABASE_URL`

---

#### pool.min

Minimum number of database connections.

**Type:** integer
**Default:** `2`

**Example:**

```yaml
database:
  pool:
    min: 5
```

---

#### pool.max

Maximum number of database connections.

**Type:** integer
**Default:** `10`

**Example:**

```yaml
database:
  pool:
    max: 20
```

---

### API Section

#### key

API authentication key.

**Type:** string
**Required:** Yes

**Supports environment variable expansion:**

```yaml
api:
  key: ${API_KEY}
```

---

#### secret

API secret key.

**Type:** string
**Required:** Yes

**Example:**

```yaml
api:
  secret: ${API_SECRET}
```

---

#### timeout

API request timeout.

**Type:** integer
**Default:** `30`
**Unit:** seconds

**Example:**

```yaml
api:
  timeout: 60
```

---

## Environment Variable Expansion

Configuration values can reference environment variables:

```yaml
api:
  key: ${API_KEY} # Simple expansion
  secret: ${API_SECRET:default} # With default value
  url: ${API_URL:-https://api.example.com} # POSIX-style default
```

**Priority:** Environment variables override config file values.

```

---

## Key Principles Summary

Based on research across Docker, Kubernetes, AWS CLI, GitHub CLI, and industry standards:

### 1. Clarity First
- Use tables for quick reference
- Provide examples for every option
- Show types and defaults explicitly

### 2. Consistency Matters
- Use consistent terminology (flag/option/argument)
- Follow established conventions (POSIX/GNU)
- Maintain formatting patterns

### 3. Security Conscious
- Never document real secrets
- Provide `.env.example` files
- Document security best practices

### 4. Multiple Access Points
- Quick reference for experienced users
- Detailed docs for new users
- Examples for practical use

### 5. Explicit Documentation
- Always mark required vs optional
- Always show default values
- Always document configuration priority
- Always provide validation rules

### 6. Cross-Reference Everything
- Link between env vars, CLI, and config files
- Show equivalencies between sources
- Reference related options

### 7. Progressive Examples
- Start simple
- Build complexity gradually
- Show real-world scenarios

### 8. Visual Hierarchy
- Use headings, tables, lists
- Group related options
- Highlight important information

---

## URLs and Resources

**Official Documentation Referenced:**
- Docker CLI: https://docs.docker.com/engine/reference/commandline/cli/
- AWS CLI: https://docs.aws.amazon.com/cli/
- Kubernetes kubectl: https://kubectl.docs.kubernetes.io/
- GitHub CLI: https://cli.github.com/manual/
- Python argparse: https://docs.python.org/3/library/argparse.html
- GNU Coding Standards: https://www.gnu.org/prep/standards/

**Related Standards:**
- POSIX Utility Conventions: https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html
- Man Page Guidelines: https://man7.org/linux/man-pages/man7/man-pages.7.html

---

**Document End**
```
