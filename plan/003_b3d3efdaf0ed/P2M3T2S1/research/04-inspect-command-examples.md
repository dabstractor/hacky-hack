# Inspect Command Examples from Popular CLIs

**Research Date:** 2025-01-23
**Purpose:** Analyze inspect/status commands from popular CLI tools for patterns and best practices

---

## Table of Contents

1. [Command Categories](#command-categories)
2. [kubectl Examples](#kubectl-examples)
3. [Docker Examples](#docker-examples)
4. [Git Examples](#git-examples)
5. [npm Examples](#npm-examples)
6. [AWS CLI Examples](#aws-cli-examples)
7. [Common Patterns](#common-patterns)
8. [Implementation Examples](#implementation-examples)

---

## Command Categories

### Type 1: List Commands
Display collections of resources
- `kubectl get pods`
- `docker ps`
- `git branch`
- `npm list`

### Type 2: Get Commands
Retrieve specific resource
- `kubectl get pod <name>`
- `docker inspect <container>`
- `git show <commit>`
- `npm view <package>`

### Type 3: Describe/Detail Commands
Detailed information about resource
- `kubectl describe pod <name>`
- `docker inspect <container>`
- `git log -p`
- `npm info <package>`

### Type 4: Status Commands
Current state/status
- `git status`
- `kubectl top pods`
- `docker stats`
- `npm outdated`

---

## kubectl Examples

### get - List Resources

```bash
# Basic list
$ kubectl get pods
NAME          READY   STATUS    RESTARTS   AGE
my-app-1      1/1     Running   0          5d
my-app-2      1/1     Running   0          5d
my-app-3      0/1     Pending   0          1m

# Wide format (more columns)
$ kubectl get pods -o wide
NAME          READY   STATUS    RESTARTS   AGE   IP            NODE
my-app-1      1/1     Running   0          5d    10.244.1.5    node-1
my-app-2      1/1     Running   0          5d    10.244.2.5    node-2

# Watch mode (real-time updates)
$ kubectl get pods -w

# JSON output
$ kubectl get pods -o json
{
  "apiVersion": "v1",
  "kind": "PodList",
  "items": [...]
}

# YAML output
$ kubectl get pods -o yaml

# Custom columns
$ kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
NAME          STATUS
my-app-1      Running
my-app-2      Running

# Sort by field
$ kubectl get pods --sort-by=.metadata.name

# Filter by label
$ kubectl get pods -l app=nginx

# Filter by field
$ kubectl get pods --field-selector=status.phase=Running
```

### describe - Detailed Information

```bash
# Describe single resource
$ kubectl describe pod my-app-1

Name:         my-app-1
Namespace:    default
Priority:     0
Node:         node-1/10.0.0.1
Start Time:   Mon, 15 Jan 2025 10:00:00 +0000
Labels:       app=myapp
              version=v1
Annotations:  <none>
Status:       Running
IP:           10.244.1.5

Containers:
  my-app:
    Container ID:   docker://abcd1234...
    Image:          nginx:latest
    Image ID:       docker-pullable://nginx@sha256:...
    Port:           80/TCP
    State:          Running
      Started:      Mon, 15 Jan 2025 10:00:10 +0000
    Ready:          True
    Restart Count:  0
    Limits:
      cpu:      500m
      memory:   512Mi
    Requests:
      cpu:      250m
      memory:   256Mi

Conditions:
  Type              Status
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True

Events:
  Type    Reason   Age   From    Message
  Normal  Pulling  5d    kubelet  Pulling image "nginx:latest"
  Normal  Pulled   5d    kubelet  Successfully pulled image
  Normal  Created  5d    kubelet  Created container my-app
  Normal  Started  5d    kubelet  Started container my-app
```

### top - Resource Usage

```bash
$ kubectl top pods
NAME          CPU(cores)   MEMORY(bytes)
my-app-1      100m         256Mi
my-app-2      150m         512Mi

# Watch mode
$ kubectl top pods -w
```

### Key Patterns

1. **Multiple output formats**: `table`, `wide`, `json`, `yaml`, `custom-columns`, `jsonpath`
2. **Filtering**: `-l` (labels), `--field-selector`
3. **Sorting**: `--sort-by`
4. **Watch mode**: `-w`
5. **Wide format**: `-o wide` (extended table)
6. **Events section**: Shows history
7. **Conditions section**: Current state conditions

---

## Docker Examples

### ps - List Containers

```bash
# Basic list
$ docker ps
CONTAINER ID   IMAGE     COMMAND                  STATUS        NAMES
abcd1234      nginx     "/docker-entrypoint..."   Up 5 days     my-app-1
efgh5678      redis     "redis-server"           Up 1 day      my-app-2

# All containers (including stopped)
$ docker ps -a

# No truncation (full IDs and commands)
$ docker ps --no-trunc

# Quiet (only IDs)
$ docker ps -q

# Custom format (Go template)
$ docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
CONTAINER ID   NAMES        STATUS
abcd1234      my-app-1     Up 5 days

# JSON format
$ docker ps --format json

# Last created
$ docker ps -l

# Filter
$ docker ps --filter "status=running"
$ docker ps --filter "name=my-app"
$ docker ps --filter "label=version=v1"

# Size
$ docker ps -s
```

### inspect - Detailed Information

```bash
$ docker inspect my-app-1

[
  {
    "Id": "abcd1234...",
    "Created": "2025-01-10T10:00:00.000000000Z",
    "Path": "/docker-entrypoint.sh",
    "Args": [
      "nginx",
      "-g",
      "daemon off;"
    ],
    "State": {
      "Status": "running",
      "Running": true,
      "Paused": false,
      "Restarting": false,
      "OOMKilled": false,
      "Dead": false,
      "Pid": 1234,
      "ExitCode": 0,
      "Error": "",
      "StartedAt": "2025-01-10T10:00:10.000000000Z",
      "FinishedAt": "0001-01-01T00:00:00Z"
    },
    "Image": "sha256:...",
    "ResolvConfPath": "/var/lib/docker/containers/.../resolv.conf",
    "HostnamePath": "/var/lib/docker/containers/.../hostname",
    "HostsPath": "/var/lib/docker/containers/.../hosts",
    "LogPath": "/var/lib/docker/containers/.../...-json.log",
    "Name": "/my-app-1",
    "RestartCount": 0,
    "Driver": "overlay2",
    "Platform": "linux",
    "Mounts": [
      {
        "Type": "volume",
        "Name": "my-volume",
        "Source": "/var/lib/docker/volumes/my-volume/_data",
        "Destination": "/data",
        "Driver": "local"
      }
    ],
    "NetworkSettings": {
      "Bridge": "",
      "SandboxID": "...",
      "HairpinMode": false,
      "LinkLocalIPv6Address": "",
      "LinkLocalIPv6PrefixLen": 0,
      "Ports": {
        "80/tcp": [
          {
            "HostIp": "0.0.0.0",
            "HostPort": "8080"
          }
        ]
      },
      "Gateway": "172.17.0.1",
      "IPAddress": "172.17.0.2",
      "IPPrefixLen": 16,
      "IPv6Gateway": "",
      "GlobalIPv6Address": "",
      "GlobalIPv6PrefixLen": 0,
      "MacAddress": "02:42:ac:11:00:02",
      "Networks": {
        "bridge": {
          "IPAMConfig": null,
          "Links": null,
          "Aliases": null,
          "NetworkID": "...",
          "EndpointID": "...",
          "Gateway": "172.17.0.1",
          "IPAddress": "172.17.0.2",
          "IPPrefixLen": 16,
          "IPv6Gateway": "",
          "GlobalIPv6Address": "",
          "GlobalIPv6PrefixLen": 0,
          "MacAddress": "02:42:ac:11:00:02",
          "DriverOpts": null
        }
      }
    },
    "Config": {
      "Hostname": "abcd1234",
      "Domainname": "",
      "User": "",
      "AttachStdin": false,
      "AttachStdout": true,
      "AttachStderr": true,
      "ExposedPorts": {
        "80/tcp": {}
      },
      "Tty": false,
      "OpenStdin": false,
      "StdinOnce": false,
      "Env": [
        "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "NGINX_VERSION=1.25.3"
      ],
      "Cmd": [
        "nginx",
        "-g",
        "daemon off;"
      ],
      "Image": "nginx:latest",
      "Volumes": null,
      "WorkingDir": "",
      "Entrypoint": [
        "/docker-entrypoint.sh"
      ],
      "OnBuild": null,
      "Labels": {
        "com.docker.compose.project": "my-app",
        "version": "v1"
      }
    }
  }
]

# Format specific field
$ docker inspect --format='{{.State.Status}}' my-app-1
running

# Format multiple fields
$ docker inspect --format='{{.Name}}: {{.State.Status}}' my-app-1
/my-app-1: running

# JSON output for specific section
$ docker inspect --format='{{json .NetworkSettings}}' my-app-1 | jq
```

### stats - Live Resource Usage

```bash
$ docker stats
CONTAINER ID   NAME      CPU %     MEM USAGE / LIMIT   MEM %     NET I/O     BLOCK I/O   PIDS
abcd1234      my-app-1  0.50%     256MiB / 1GiB       25.00%    1.2kB / 0B  0B / 0B     10
efgh5678      my-app-2  1.20%     512MiB / 1GiB       50.00%    2.4kB / 0B  0B / 0B     15

# All containers (including stopped)
$ docker stats -a

# No stream (single output)
$ docker stats --no-stream

# Custom format
$ docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Key Patterns

1. **Go template formatting**: `--format` with Go templates
2. **JSON output**: Native JSON for all commands
3. **Filter options**: `--filter` flag
4. **Quiet mode**: `-q` for IDs only
5. **Size information**: `-s` flag
6. **No truncation**: `--no-trunc` flag
7. **Last created**: `-l` flag
8. **Live stats**: `docker stats` with auto-refresh

---

## Git Examples

### status - Working Tree Status

```bash
# Basic status
$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   file.ts
  modified:   package.json

Untracked files:
  new-file.ts

no changes added to commit (use "git add" and/or "git commit -a")

# Short format
$ git status -s
M file.ts
M package.json
?? new-file.ts

# Branch info
$ git status -sb
## main...origin/main
M file.ts

# Show ignored files
$ git status --ignored

# Verbose (shows diffs)
$ git status -v
```

### log - Commit History

```bash
# Basic log
$ git log
commit abc123 (HEAD -> main)
Author: John <john@example.com>
Date:   Mon Jan 15 10:00:00 2025

    Add new feature

commit def456
Author: John <john@example.com>
Date:   Sun Jan 14 15:00:00 2025

    Fix bug

# One line format
$ git log --oneline
abc123 Add new feature
def456 Fix bug

# Graph with branches
$ git log --graph --oneline --all
* abc123 Add new feature (main)
* def456 Fix bug
| * ghi789 Other branch (feature)
|/

# Custom format
$ git log --format="%h %an %s"
abc123 John Add new feature
def456 John Fix bug

# Pretty formats
$ git log --pretty=medium
$ git log --pretty=full
$ git log --pretty=fuller
$ git log --pretty=email

# With diff
$ git log -p

# Stats
$ git log --stat

# Limit
$ git log -5
$ git log --since="1 week ago"
```

### show - Show Objects

```bash
# Show commit
$ git show abc123

commit abc123...
Author: John <john@example.com>
Date:   Mon Jan 15 10:00:00 2025

    Add new feature

diff --git a/file.ts b/file.ts
index 123..456 789
--- a/file.ts
+++ b/file.ts
@@ -1,1 +1,2 @@
 old line
+new line

# Show file
$ git show HEAD:file.ts

# Show specific commit stat
$ git show --stat abc123
```

### branch - List Branches

```bash
# List branches
$ git branch
  feature-1
* main
  feature-2

# With tracking info
$ git branch -vv
  feature-1 abc123 [origin/feature-1] Add feature
* main      def456 [origin/main] Latest
  feature-2 ghi789 [origin/feature-2] Work in progress

# Remote branches
$ git branch -r
  origin/feature-1
  origin/main
  origin/feature-2

# All branches
$ git branch -a
```

### Key Patterns

1. **Porcelain vs. Plumbing**: User-friendly vs. script-friendly
2. **Multiple formats**: `--oneline`, `--pretty=<format>`
3. **Graph visualization**: `--graph`
4. **Short format**: `-s`, `--short`
5. **Verbose mode**: `-v`, `--verbose`
6. **Branch info**: `-sb`, `-vv`
7. **Diff output**: `-p` flag
8. **Stat output**: `--stat` flag

---

## npm Examples

### list - Dependency Tree

```bash
# Top level dependencies
$ npm list --depth=0
hacky-hack@0.1.0 /home/dustin/project
├── cli-progress@3.12.0
├── commander@14.0.2
├── fast-glob@3.3.3
├── pino@9.14.0
└── zod@3.22.4

# Full dependency tree
$ npm list
hacky-hack@0.1.0 /home/dustin/project
├─┬ cli-progress@3.12.0
│ └── └── supports-color@8.1.1
├─┬ commander@14.0.2
└── └── ...

# JSON output
$ npm list --json
{
  "dependencies": {
    "cli-progress": {
      "version": "3.12.0",
      "from": "cli-progress",
      "resolved": "https://registry.npmjs.org/cli-progress/-/cli-progress-3.12.0.tgz"
    }
  }
}

# Parseable output
$ npm list --parseable
/home/dustin/project/node_modules/cli-progress
/home/dustin/project/node_modules/commander

# Long format
$ npm list --long
```

### view - Package Information

```bash
$ npm view cli-progress
cli-progress@3.12.0 | MIT | deps: 1 | versions: 25
The Reliable, Fast and Easy to use Progress Bar for NodeJS

https://github.com/npkgz/cli-progress#readme

keywords: cli, progress, bar, terminal, console
dist:
.tarball: https://registry.npmjs.org/cli-progress/-/cli-progress-3.12.0.tgz
.shasum: abc123...
.integrity: sha512-...
.unpackedSize: 45.2 kB

dependencies:
supports-color ^8.1.0 8.1.1

dist-tags:
latest: 3.12.0
next: 3.13.0-beta.1

maintainers:
- npkgz <email@example.com>

# View specific field
$ npm view cli-progress version
3.12.0

# View multiple fields
$ npm view cli-progress versions dependencies
[ '1.0.0', '1.0.1', ..., '3.12.0' ]
{ supports-color: '^8.1.0' }
```

### outdated - Outdated Packages

```bash
$ npm outdated
Package      Current  Wanted  Latest  Location
cli-progress  3.11.0   3.11.0  3.12.0  hacky-hack
commander     13.0.0   14.0.2  14.0.2  hacky-hack

# JSON output
$ npm outdated --json
{
  "cli-progress": {
    "current": "3.11.0",
    "wanted": "3.11.0",
    "latest": "3.12.0",
    "location": "hacky-hack"
  }
}

# Long format
$ npm outdated --long
```

### Key Patterns

1. **Tree visualization**: ASCII tree for dependencies
2. **Depth control**: `--depth` flag
3. **Multiple formats**: `--json`, `--parseable`
4. **Field selection**: `npm view <field>`
5. **Long format**: `--long` flag
6. **Color-coded versions**: Update indicators

---

## AWS CLI Examples

### describe - Detailed Information

```bash
# Basic describe
$ aws ec2 describe-instances
{
  "Reservations": [
    {
      "Instances": [
        {
          "InstanceId": "i-123456",
          "InstanceType": "t2.micro",
          "State": {
            "Name": "running"
          },
          "Tags": [
            {
              "Key": "Name",
              "Value": "my-instance"
            }
          ]
        }
      ]
    }
  ]
}

# Query (JMESPath)
$ aws ec2 describe-instances --query "Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,State:State.Name}"
[
  {
    "ID": "i-123456",
    "Type": "t2.micro",
    "State": "running"
  }
]

# Output formats
$ aws ec2 describe-instances --output json    # JSON (default)
$ aws ec2 describe-instances --output yaml    # YAML
$ aws ec2 describe-instances --output yaml-stream  # YAML streaming
$ aws ec2 describe-instances --output text   # Text-based
$ aws ec2 describe-instances --output table  # Table format

# Table output
$ aws ec2 describe-instances --output table --query "Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,State:State.Name}"
--------------------------------------------------------------
|              DescribeInstances                |
+------------+-----------+----------------------+
|     ID     |   Type    |        State         |
+------------+-----------+----------------------+
|  i-123456  |  t2.micro |  running             |
+------------+-----------+----------------------+
```

### Key Patterns

1. **JMESPath queries**: `--query` for filtering/formatting
2. **Multiple output formats**: `json`, `yaml`, `text`, `table`
3. **Table output**: Auto-formatted tables with `--output table`
4. **Query language**: JMESPath for JSON querying
5. **Pagination**: Built-in pagination support
6. **Color control**: `--color on|off`

---

## Common Patterns

### Pattern 1: Multiple Output Formats

```bash
command get <resource>              # Table (default)
command get <resource> -o json      # JSON
command get <resource> -o yaml      # YAML
command get <resource> -o wide      # Wide table
```

### Pattern 2: Filtering

```bash
# By label/selector
command get --label app=nginx
command get -l app=nginx

# By field
command get --field-selector status=running
command get --filter status=running

# By name pattern
command get "my-*"
```

### Pattern 3: Sorting

```bash
command get --sort-by=name
command get --sort-by=.metadata.created
command ls -lt  # Sort by time
```

### Pattern 4: Watch Mode

```bash
command get -w              # Watch for changes
command get --watch         # Explicit
command top                 # Auto-refresh
```

### Pattern 5: Wide Format

```bash
command get -o wide         # Extended table
command ps --format "table {{.ID}}\t{{.Image}}\t{{.Status}}"
```

### Pattern 6: Detail Levels

```bash
command get                 # Basic info
command get -o wide         # More columns
command describe            # Full details
command inspect             # JSON details
```

### Pattern 7: Custom Columns/Fields

```bash
# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase

# Go template
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"

# JMESPath
aws ec2 describe-instances --query "Reservations[].Instances[].{ID:InstanceId}"
```

---

## Implementation Examples

### Example 1: Task List Command

```typescript
import { Command } from 'commander';
import Table from 'cli-table3';
import chalk from 'chalk';

interface Task {
  id: string;
  title: string;
  status: string;
  phase: string;
  created: Date;
}

const program = new Command();

program
  .command('list')
  .description('List tasks')
  .option('-o, --output <format>', 'Output format (table|wide|json)', 'table')
  .option('--filter <status>', 'Filter by status')
  .option('--sort <field>', 'Sort by field')
  .option('-w, --watch', 'Watch for changes')
  .action(async (options) => {
    const tasks: Task[] = await loadTasks();

    // Filter
    let filtered = tasks;
    if (options.filter) {
      filtered = tasks.filter(t => t.status === options.filter);
    }

    // Sort
    if (options.sort) {
      filtered.sort((a, b) => {
        if (options.sort === 'created') {
          return b.created.getTime() - a.created.getTime();
        }
        return a.id.localeCompare(b.id);
      });
    }

    // Output
    switch (options.output) {
      case 'json':
        console.log(JSON.stringify(filtered, null, 2));
        break;

      case 'wide':
        displayWideTable(filtered);
        break;

      case 'table':
      default:
        displayTable(filtered);
        break;
    }

    // Watch mode
    if (options.watch) {
      watchTasks();
    }
  });

function displayTable(tasks: Task[]): void {
  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('Status'),
      chalk.cyan('Phase'),
    ],
    colWidths: [15, 15, 15],
  });

  tasks.forEach(task => {
    table.push([
      task.id,
      formatStatus(task.status),
      task.phase,
    ]);
  });

  console.log(table.toString());
}

function displayWideTable(tasks: Task[]): void {
  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('Title'),
      chalk.cyan('Status'),
      chalk.cyan('Phase'),
      chalk.cyan('Created'),
    ],
    colWidths: [15, 30, 15, 15, 20],
  });

  tasks.forEach(task => {
    table.push([
      task.id,
      task.title,
      formatStatus(task.status),
      task.phase,
      task.created.toLocaleString(),
    ]);
  });

  console.log(table.toString());
}

function formatStatus(status: string): string {
  switch (status) {
    case 'Complete':
      return chalk.green(status);
    case 'Active':
    case 'In Progress':
      return chalk.blue(status);
    case 'Blocked':
      return chalk.red(status);
    default:
      return chalk.gray(status);
  }
}
```

### Example 2: Task Describe Command

```typescript
program
  .command('describe <taskId>')
  .description('Describe task in detail')
  .option('-o, --output <format>', 'Output format (text|json|yaml)', 'text')
  .action(async (taskId, options) => {
    const task = await getTask(taskId);

    switch (options.output) {
      case 'json':
        console.log(JSON.stringify(task, null, 2));
        break;

      case 'yaml':
        console.log(yaml.dump(task));
        break;

      case 'text':
      default:
        displayTaskDetails(task);
        break;
    }
  });

function displayTaskDetails(task: Task): void {
  console.log(chalk.bold('Name:         '), task.id);
  console.log(chalk.bold('Title:        '), task.title);
  console.log(chalk.bold('Status:       '), formatStatus(task.status));
  console.log(chalk.bold('Phase:        '), task.phase);
  console.log(chalk.bold('Created:      '), task.created.toLocaleString());
  console.log(chalk.bold('Message:      '), task.message || 'None');
  console.log();

  if (task.subtasks?.length > 0) {
    console.log(chalk.bold('Subtasks:'));
    task.subtasks.forEach(sub => {
      console.log(`  ${chalk.cyan(sub.id)} ${formatStatus(sub.status)} ${sub.title}`);
    });
    console.log();
  }

  if (task.events?.length > 0) {
    console.log(chalk.bold('Events:'));
    task.events.forEach(event => {
      const time = event.time.toLocaleString();
      console.log(`  ${chalk.gray(time)} ${chalk.bold(event.type)} ${event.message}`);
    });
  }
}
```

### Example 3: Task Status Command

```typescript
program
  .command('status')
  .description('Show overall status')
  .option('-o, --output <format>', 'Output format (text|json)', 'text')
  .action(async (options) => {
    const summary = await getStatusSummary();

    switch (options.output) {
      case 'json':
        console.log(JSON.stringify(summary, null, 2));
        break;

      case 'text':
      default:
        displayStatusSummary(summary);
        break;
    }
  });

function displayStatusSummary(summary: StatusSummary): void {
  console.log(chalk.bold('Overall Status:    '), formatStatus(summary.status));
  console.log(chalk.bold('Active Tasks:      '), chalk.cyan(summary.active.toString()));
  console.log(chalk.bold('Complete Tasks:    '), chalk.green(summary.complete.toString()));
  console.log(chalk.bold('Blocked Tasks:     '), chalk.red(summary.blocked.toString()));
  console.log();

  if (summary.currentTask) {
    console.log(chalk.bold('Current Task:      '), chalk.cyan(summary.currentTask.id));
    console.log(chalk.bold('Current Phase:     '), chalk.blue(summary.currentPhase));
    console.log(chalk.bold('Started:           '), summary.currentTask.started.toLocaleString());
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
