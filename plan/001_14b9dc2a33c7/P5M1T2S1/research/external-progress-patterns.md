# External Progress Tracking Patterns and Best Practices

**Research Date:** 2026-01-13
**Purpose:** Research progress tracking patterns for CLI tools and long-running processes

---

## Table of Contents

1. [Progress Bar Patterns](#1-progress-bar-patterns)
2. [ETA Calculation Algorithms](#2-eta-calculation-algorithms)
3. [Progress Reporting Formats](#3-progress-reporting-formats)
4. [Best Practices for Logging Progress](#4-best-practices-for-logging-progress)
5. [Library Recommendations](#5-library-recommendations)
6. [Code Examples](#6-code-examples)

---

## 1. Progress Bar Patterns

### 1.1 cli-progress

**NPM:** https://www.npmjs.com/package/cli-progress
**GitHub:** https://github.com/npkgz/cli-progress
**TypeScript:** Native TypeScript support

#### Installation

```bash
npm install cli-progress
```

#### API Overview

```typescript
import cliProgress from 'cli-progress';

// Create single progress bar
const bar = new cliProgress.SingleBar({
  format: 'CLI Progress |{bar}| {percentage}% | {value}/{total}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
});

// Start
bar.start(100, 0);

// Update
bar.update(50);

// Increment
bar.increment();

// Stop
bar.stop();
```

#### Features

- Single and multi-bar progress indicators
- Customizable format strings with placeholders
- ETA calculation (built-in)
- Preset themes
- Live progress updates
- Terminal width detection

#### Multi-Bar Example

```typescript
import cliProgress from 'cli-progress';

// Create multi-progress container
const multiBar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {percentage}% | {value}/{total} | {eta_formatted}',
  },
  cliProgress.Presets.shades_classic
);

// Create multiple bars
const bar1 = multiBar.create(100, 0, 'Task 1');
const bar2 = multiBar.create(200, 0, 'Task 2');
const bar3 = multiBar.create(50, 0, 'Task 3');

// Update independently
bar1.update(50);
bar2.update(100);
bar3.update(25);

// Stop all
multiBar.stop();
```

#### Format Placeholders

| Placeholder            | Description             | Example               |
| ---------------------- | ----------------------- | --------------------- |
| `{bar}`                | Progress bar characters | `████████░░░░░░░░░░░` |
| `{percentage}`         | Completion percentage   | `50%`                 |
| `{value}`              | Current value           | `50`                  |
| `{total}`              | Total value             | `100`                 |
| `{eta}`                | ETA in seconds          | `120`                 |
| `{eta_formatted}`      | Formatted ETA           | `00:02:00`            |
| `{duration}`           | Elapsed time in seconds | `60`                  |
| `{duration_formatted}` | Formatted duration      | `00:01:00`            |

#### Pros

- Feature-rich with extensive customization
- Multi-bar support for concurrent operations
- Built-in ETA calculation
- Active maintenance
- Good TypeScript support
- Preset themes for quick setup

#### Cons

- Larger bundle size (~120KB)
- Can be overkill for simple use cases
- Terminal width detection can be buggy in some terminals

---

### 1.2 ora

**NPM:** https://www.npmjs.com/package/ora
**GitHub:** https://github.com/sindresorhus/ora
**TypeScript:** Native TypeScript support

#### Installation

```bash
npm install ora
```

#### API Overview

```typescript
import ora from 'ora';

// Start spinner
const spinner = ora('Loading...').start();

// Update text
spinner.text = 'Processing data...';

// Stop with success
spinner.succeed('Completed successfully!');

// Stop with failure
spinner.fail('Something went wrong');

// Stop with info
spinner.info('Information message');

// Stop with warning
spinner.warn('Warning message');
```

#### Spinner Options

```typescript
const spinner = ora({
  text: 'Loading unicorns',
  spinner: 'dots', // or custom spinner
  color: 'yellow',
  hideCursor: true,
  interval: 100, // Frame interval
  isEnabled: true, // Enable/disable spinner
}).start();
```

#### Built-in Spinners

Ora includes 60+ spinner patterns. Common ones:

```typescript
// Simple dots
spinner: 'dots' // ⋮⋯⋱⋯⋮

// Arrow
spinner: 'arrow' // ↖↑↗→

// Bouncing bar
spinner: 'bouncingBar' // [=====     ]

// Dots flow
spinner: 'dotsFlow' // ⠁⠂⠄⡀⢀⠠⠐⠈

// Custom unicode
spinner: {
  interval: 80,
  frames: ['▖', '▘', '▝', '▗']
}
```

#### Usage Patterns

```typescript
// Pattern 1: Sequential tasks
const spinner = ora('Initializing').start();
await init();
spinner.succeed('Initialized');

spinner.start('Processing data');
await processData();
spinner.succeed('Data processed');

spinner.start('Saving results');
await saveResults();
spinner.succeed('Results saved');

// Pattern 2: Progress percentage
const spinner = ora({
  text: 'Processing: 0%',
  spinner: 'bouncingBar',
}).start();

for (let i = 0; i <= 100; i += 10) {
  spinner.text = `Processing: ${i}%`;
  await processChunk(i);
}

spinner.succeed('Processing complete!');

// Pattern 3: Indeterminate progress
const spinner = ora('Downloading large file...').start();
await downloadLargeFile();
spinner.succeed('Download complete!');
```

#### Pros

- Simple and elegant API
- Excellent TypeScript support
- Rich spinner options
- Small bundle size (~20KB)
- Cross-platform support
- Success/fail/info/warning states
- Handles cursor hiding automatically

#### Cons

- No built-in progress bar (spinners only)
- No ETA calculation
- Not suitable for progress with known totals
- Less suitable for concurrent operations

---

### 1.3 progress-stream

**NPM:** https://www.npmjs.com/package/progress-stream
**GitHub:** https://github.com/freeall/progress-stream

#### Installation

```bash
npm install progress-stream
```

#### API Overview

```typescript
import progress from 'progress-stream';
import fs from 'fs';

// Create progress stream
const progressStream = progress({
  length: 1000000, // Total size in bytes
  time: 100, // Update frequency in milliseconds
});

// Listen to progress events
progressStream.on('progress', progress => {
  console.log(`Progress: ${progress.percentage}%`);
  console.log(`Transferred: ${progress.transferred} bytes`);
  console.log(`Speed: ${progress.speed} bytes/sec`);
  console.log(`ETA: ${progress.eta} seconds`);
});

// Use with streams
fs.createReadStream('large-file.txt')
  .pipe(progressStream)
  .pipe(fs.createWriteStream('output.txt'));
```

#### Progress Event Data

```typescript
interface ProgressData {
  percentage: number; // 0-100
  transferred: number; // Bytes transferred
  length: number; // Total bytes
  remaining: number; // Bytes remaining
  eta: number; // Estimated seconds remaining
  runtime: number; // Elapsed seconds
  delta: number; // Bytes transferred since last update
  speed: number; // Bytes per second
}
```

#### HTTP Download Example

```typescript
import https from 'https';
import progress from 'progress-stream';
import fs from 'fs';

const file = fs.createWriteStream('downloaded-file.zip');

https.get('https://example.com/large-file.zip', response => {
  const totalSize = parseInt(response.headers['content-length'], 10);

  const progressStream = progress({
    length: totalSize,
    time: 100,
  });

  progressStream.on('progress', p => {
    console.log(`Downloaded: ${p.percentage.toFixed(2)}%`);
    console.log(`Speed: ${(p.speed / 1024 / 1024).toFixed(2)} MB/s`);
    console.log(`ETA: ${Math.floor(p.eta)}s`);
  });

  response.pipe(progressStream).pipe(file);
});
```

#### Pros

- Perfect for stream-based operations
- Real-time speed calculation
- ETA calculation included
- Event-driven architecture
- Works with any Node.js stream

#### Cons

- Stream-specific (not for general progress)
- No visual progress bar
- Requires manual display formatting
- Less active maintenance

---

### 1.4 node-progress

**NPM:** https://www.npmjs.com/package/progress
**GitHub:** https://github.com/visionmedia/node-progress

#### Installation

```bash
npm install progress
```

#### API Overview

```typescript
import ProgressBar from 'progress';

const bar = new ProgressBar(':bar :current/:total :percent :etas', {
  complete: '=',
  incomplete: '-',
  width: 40,
  total: 100,
});

// Tick one unit
bar.tick();

// Tick multiple units
bar.tick(10);

// Update with message
bar.tick({ message: 'Processing file.txt' });
```

#### Format Tokens

| Token      | Description              | Example         |
| ---------- | ------------------------ | --------------- |
| `:bar`     | Progress bar             | `==========---` |
| `:current` | Current progress         | `50`            |
| `:total`   | Total progress           | `100`           |
| `:percent` | Percentage complete      | `50%`           |
| `:eta`     | Estimated time remaining | `00:01:30`      |
| `:etas`    | ETA in seconds           | `90`            |
| `:elapsed` | Elapsed time             | `00:00:30`      |
| `:rate`    | Items per second         | `1.5`           |

#### Pros

- Simple and lightweight
- Classic, well-tested library
- Good ETA calculation
- Customizable format

#### Cons

- Older API (less modern)
- No multi-bar support
- Less active maintenance
- No TypeScript types (needs @types)

---

## 2. ETA Calculation Algorithms

### 2.1 Simple Moving Average (SMA)

#### Algorithm

```typescript
class SimpleMovingAverageETA {
  private samples: number[] = [];
  private windowSize: number;

  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  // Add speed sample (items per second)
  addSample(speed: number): void {
    this.samples.push(speed);
    if (this.samples.length > this.windowSize) {
      this.samples.shift();
    }
  }

  // Calculate ETA based on average speed
  calculateETA(remainingItems: number): number {
    if (this.samples.length === 0) {
      return Infinity;
    }

    const avgSpeed =
      this.samples.reduce((a, b) => a + b, 0) / this.samples.length;

    if (avgSpeed === 0) {
      return Infinity;
    }

    return remainingItems / avgSpeed;
  }
}
```

#### Usage Example

```typescript
const eta = new SimpleMovingAverageETA(10);

// During progress updates
for (let i = 0; i < totalItems; i++) {
  const startTime = Date.now();
  await processItem(i);
  const elapsed = Date.now() - startTime;

  // Calculate current speed (items per second)
  const speed = 1000 / elapsed;
  eta.addSample(speed);

  // Get ETA
  const estimatedSeconds = eta.calculateETA(totalItems - i - 1);
  console.log(`ETA: ${formatTime(estimatedSeconds)}`);
}
```

#### Pros

- Simple to implement
- Smooths out short-term fluctuations
- Easy to understand

#### Cons

- Equal weight to all samples (older data less relevant)
- Slower to adapt to changing conditions
- Can be inaccurate with variable speeds

---

### 2.2 Exponential Smoothing (ETS)

#### Algorithm

```typescript
class ExponentialSmoothingETA {
  private avgSpeed: number | null = null;
  private alpha: number; // Smoothing factor (0-1)

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  addSample(speed: number): void {
    if (this.avgSpeed === null) {
      this.avgSpeed = speed;
    } else {
      // Apply exponential smoothing
      this.avgSpeed = this.alpha * speed + (1 - this.alpha) * this.avgSpeed;
    }
  }

  calculateETA(remainingItems: number): number {
    if (this.avgSpeed === null || this.avgSpeed === 0) {
      return Infinity;
    }

    return remainingItems / this.avgSpeed;
  }

  // Adaptive alpha based on variance
  addSampleAdaptive(speed: number): void {
    if (this.avgSpeed === null) {
      this.avgSpeed = speed;
    } else {
      // Calculate variance-based alpha
      const variance = Math.abs(speed - this.avgSpeed) / this.avgSpeed;
      const adaptiveAlpha = Math.min(0.5, variance * 2);

      this.avgSpeed =
        adaptiveAlpha * speed + (1 - adaptiveAlpha) * this.avgSpeed;
    }
  }
}
```

#### Usage Example

```typescript
const eta = new ExponentialSmoothingETA(0.3);

// During progress updates
for (let i = 0; i < totalItems; i++) {
  const startTime = Date.now();
  await processItem(i);
  const elapsed = Date.now() - startTime;

  const speed = 1000 / elapsed;
  eta.addSample(speed);

  const estimatedSeconds = eta.calculateETA(totalItems - i - 1);
  console.log(`ETA: ${formatTime(estimatedSeconds)}`);
}
```

#### Alpha Values

| Alpha | Behavior             | Use Case                   |
| ----- | -------------------- | -------------------------- |
| 0.1   | Very slow adaptation | Stable, predictable speeds |
| 0.3   | Moderate adaptation  | General purpose (default)  |
| 0.5   | Balanced adaptation  | Variable speeds            |
| 0.7+  | Rapid adaptation     | Highly variable speeds     |

#### Pros

- More responsive to recent changes
- Weights recent data more heavily
- Smooths out noise while staying responsive
- Well-suited for variable processing speeds

#### Cons

- More complex than SMA
- Requires tuning alpha parameter
- Can overreact to outliers if alpha too high

---

### 2.3 Weighted Moving Average (WMA)

#### Algorithm

```typescript
class WeightedMovingAverageETA {
  private samples: number[] = [];
  private weights: number[];

  constructor(windowSize: number = 10) {
    // Create linear weights (most recent = highest weight)
    this.weights = Array.from(
      { length: windowSize },
      (_, i) => (i + 1) / ((windowSize * (windowSize + 1)) / 2)
    ).reverse();
  }

  addSample(speed: number): void {
    this.samples.push(speed);
    if (this.samples.length > this.weights.length) {
      this.samples.shift();
    }
  }

  calculateETA(remainingItems: number): number {
    if (this.samples.length === 0) {
      return Infinity;
    }

    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < this.samples.length; i++) {
      const weight =
        this.weights[i - (this.weights.length - this.samples.length)];
      weightedSum += this.samples[i] * weight;
      totalWeight += weight;
    }

    const avgSpeed = weightedSum / totalWeight;

    if (avgSpeed === 0) {
      return Infinity;
    }

    return remainingItems / avgSpeed;
  }
}
```

#### Pros

- More weight to recent samples
- Smoother than exponential smoothing
- Predictable behavior

#### Cons

- More complex than SMA
- Fixed weight distribution
- Requires choosing window size

---

### 2.4 Outlier Handling

#### Median-Based Outlier Rejection

```typescript
class OutlierResistantETA {
  private samples: number[] = [];
  private windowSize: number;

  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  addSample(speed: number): void {
    this.samples.push(speed);
    if (this.samples.length > this.windowSize) {
      this.samples.shift();
    }
  }

  // Calculate median-based average (rejects outliers)
  calculateETA(remainingItems: number): number {
    if (this.samples.length === 0) {
      return Infinity;
    }

    // Sort samples
    const sorted = [...this.samples].sort((a, b) => a - b);

    // Calculate interquartile range (IQR)
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    // Filter outliers (outside 1.5 * IQR)
    const filtered = sorted.filter(
      s => s >= q1 - 1.5 * iqr && s <= q3 + 1.5 * iqr
    );

    // Use median of filtered values
    const median = filtered[Math.floor(filtered.length / 2)];

    if (median === 0) {
      return Infinity;
    }

    return remainingItems / median;
  }
}
```

#### Standard Deviation Rejection

```typescript
class StdDevOutlierETA {
  private samples: number[] = [];

  addSample(speed: number): void {
    this.samples.push(speed);
    if (this.samples.length > 10) {
      this.samples.shift();
    }
  }

  calculateETA(remainingItems: number): number {
    if (this.samples.length < 3) {
      return Infinity;
    }

    // Calculate mean
    const mean = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;

    // Calculate standard deviation
    const variance =
      this.samples.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      this.samples.length;
    const stdDev = Math.sqrt(variance);

    // Filter samples within 2 standard deviations
    const filtered = this.samples.filter(s => Math.abs(s - mean) <= 2 * stdDev);

    if (filtered.length === 0) {
      return remainingItems / mean;
    }

    const avgSpeed = filtered.reduce((a, b) => a + b, 0) / filtered.length;

    if (avgSpeed === 0) {
      return Infinity;
    }

    return remainingItems / avgSpeed;
  }
}
```

---

### 2.5 Best Practices for ETA Calculation

#### Cold Start Handling

```typescript
class ETAWithColdStart {
  private samples: number[] = [];
  private minSamples: number = 3;

  calculateETA(remainingItems: number): number | null {
    // Don't show ETA until we have enough data
    if (this.samples.length < this.minSamples) {
      return null; // Don't display ETA yet
    }

    // Normal ETA calculation
    // ...
  }
}
```

#### Confidence Intervals

```typescript
interface ETAWithConfidence {
  eta: number; // Estimated seconds
  confidence: 'low' | 'medium' | 'high';
  minEta: number; // Lower bound
  maxEta: number; // Upper bound
}

function calculateETAWithConfidence(
  samples: number[],
  remaining: number
): ETAWithConfidence {
  if (samples.length < 3) {
    return {
      eta: Infinity,
      confidence: 'low',
      minEta: Infinity,
      maxEta: Infinity,
    };
  }

  const avgSpeed = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance =
    samples.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) /
    samples.length;
  const stdDev = Math.sqrt(variance);

  const eta = remaining / avgSpeed;
  const margin = (stdDev / avgSpeed) * eta;

  // Determine confidence based on sample size and variance
  let confidence: 'low' | 'medium' | 'high';
  if (samples.length < 5 || stdDev / avgSpeed > 0.5) {
    confidence = 'low';
  } else if (samples.length < 10 || stdDev / avgSpeed > 0.3) {
    confidence = 'medium';
  } else {
    confidence = 'high';
  }

  return {
    eta,
    confidence,
    minEta: Math.max(0, eta - margin),
    maxEta: eta + margin,
  };
}
```

#### Time-Based Sampling

```typescript
class TimeBasedETA {
  private lastUpdate: number = Date.now();
  private samples: number[] = [];
  private sampleInterval: number = 1000; // Sample every second

  shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastUpdate >= this.sampleInterval) {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }

  addSample(speed: number): void {
    if (this.shouldUpdate()) {
      this.samples.push(speed);
      if (this.samples.length > 10) {
        this.samples.shift();
      }
    }
  }
}
```

---

## 3. Progress Reporting Formats

### 3.1 Progress Bar Visualizations

#### ASCII Progress Bar

```typescript
function createASCIIProgress(
  percentage: number,
  width: number = 40,
  completeChar: string = '=',
  incompleteChar: string = '-'
): string {
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;

  return '[' + completeChar.repeat(filled) + incompleteChar.repeat(empty) + ']';
}

// Examples
console.log(createASCIIProgress(0, 20)); // [--------------------]
console.log(createASCIIProgress(25, 20)); // [=====---------------]
console.log(createASCIIProgress(50, 20)); // [==========----------]
console.log(createASCIIProgress(75, 20)); // [===============-----]
console.log(createASCIIProgress(100, 20)); // [====================]
```

#### Unicode Progress Bar

```typescript
function createUnicodeProgress(percentage: number, width: number = 20): string {
  // Use 8-block characters for smooth progress
  const blockChars = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

  const filledFloat = (percentage / 100) * width;
  const filled = Math.floor(filledFloat);
  const partial = Math.floor((filledFloat - filled) * 8);

  let bar = '█'.repeat(filled);
  if (filled < width) {
    bar += blockChars[partial];
    bar += ' '.repeat(width - filled - 1);
  }

  return `[${bar}]`;
}

// Examples
console.log(createUnicodeProgress(0, 20)); // [                    ]
console.log(createUnicodeProgress(12.5, 20)); // [█▎                  ]
console.log(createUnicodeProgress(50, 20)); // [████████████████████]
console.log(createUnicodeProgress(87.5, 20)); // [████████████████████▊]
```

#### Animated Progress Bar

```typescript
function createAnimatedProgress(
  percentage: number,
  width: number = 30,
  frame: number = 0
): string {
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;

  // Animated spinner at the end
  const spinners = ['|', '/', '-', '\\'];
  const spinner = spinners[frame % 4];

  return '[' + '='.repeat(filled) + spinner + ' '.repeat(empty - 1) + ']';
}

// Usage with frame counter
let frame = 0;
setInterval(() => {
  console.clear();
  console.log(createAnimatedProgress(50, 30, frame++));
}, 100);
```

#### Multi-Line Progress

```typescript
function renderMultiLineProgress(
  tasks: Array<{ name: string; progress: number }>
): string {
  const lines = tasks.map(task => {
    const bar = createASCIIProgress(task.progress, 20);
    return `${task.name.padEnd(20)} ${bar} ${task.progress.toFixed(0)}%`;
  });

  return lines.join('\n');
}

// Example
console.log(
  renderMultiLineProgress([
    { name: 'Task 1', progress: 100 },
    { name: 'Task 2', progress: 75 },
    { name: 'Task 3', progress: 50 },
    { name: 'Task 4', progress: 25 },
  ])
);

// Output:
// Task 1               [====================] 100%
// Task 2               [===============---] 75%
// Task 3               [==========----------] 50%
// Task 4               [=====---------------] 25%
```

---

### 3.2 Percentage Display Patterns

#### Fixed Width Percentage

```typescript
function formatPercentage(percentage: number, width: number = 3): string {
  return percentage.toFixed(0).padStart(width) + '%';
}

// Examples
console.log(formatPercentage(0)); // "  0%"
console.log(formatPercentage(50)); // " 50%"
console.log(formatPercentage(100)); // "100%"
```

#### Decimal Precision

```typescript
function formatPercentagePrecise(
  percentage: number,
  decimals: number = 1
): string {
  return percentage.toFixed(decimals).padStart(decimals + 4) + '%';
}

// Examples
console.log(formatPercentagePrecise(0, 1)); // "  0.0%"
console.log(formatPercentagePrecise(50.5, 1)); // " 50.5%"
console.log(formatPercentagePrecise(99.99, 2)); // " 99.99%"
```

#### Fractional Progress

```typescript
function formatFraction(current: number, total: number): string {
  const currentStr = current.toString().padStart(total.toString().length);
  return `${currentStr}/${total}`;
}

// Examples
console.log(formatFraction(0, 100)); // "  0/100"
console.log(formatFraction(50, 100)); // " 50/100"
console.log(formatFraction(100, 100)); // "100/100"
```

#### Combined Display

```typescript
function formatProgressCompact(
  current: number,
  total: number,
  percentage: number
): string {
  return `${current}/${total} (${percentage.toFixed(0)}%)`;
}

// Examples
console.log(formatProgressCompact(0, 100, 0)); // "0/100 (0%)"
console.log(formatProgressCompact(50, 100, 50)); // "50/100 (50%)"
console.log(formatProgressCompact(100, 100, 100)); // "100/100 (100%)"
```

---

### 3.3 Time Remaining Formatting

#### Seconds to Human-Readable

```typescript
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  }
}

// Examples
console.log(formatDuration(0)); // "0s"
console.log(formatDuration(30)); // "30s"
console.log(formatDuration(90)); // "1m 30s"
console.log(formatDuration(3661)); // "1h 01m"
```

#### Compact Time Format

```typescript
function formatDurationCompact(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

// Examples
console.log(formatDurationCompact(30)); // "30s"
console.log(formatDurationCompact(90)); // "1m"
console.log(formatDurationCompact(3661)); // "1h 1m"
```

#### ISO 8601 Duration Format

```typescript
function formatDurationISO8601(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let parts = [];
  if (hours > 0) parts.push(`${hours}H`);
  if (mins > 0) parts.push(`${mins}M`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}S`);

  return `PT${parts.join('')}`;
}

// Examples
console.log(formatDurationISO8601(30)); // "PT30S"
console.log(formatDurationISO8601(90)); // "PT1M30S"
console.log(formatDurationISO8601(3661)); // "PT1H1M1S"
```

#### ETA Display with Uncertainty

```typescript
function formatETAWithConfidence(
  eta: number,
  confidence: 'low' | 'medium' | 'high'
): string {
  const time = formatDuration(eta);

  if (confidence === 'low') {
    return `~${time} (estimating...)`;
  } else if (confidence === 'medium') {
    return `~${time}`;
  } else {
    return time;
  }
}

// Examples
console.log(formatETAWithConfidence(90, 'low')); // "~1m 30s (estimating...)"
console.log(formatETAWithConfidence(90, 'medium')); // "~1m 30s"
console.log(formatETAWithConfidence(90, 'high')); // "1m 30s"
```

---

### 3.4 Task Count Display Patterns

#### Simple Counter

```typescript
function formatTaskCounter(completed: number, total: number): string {
  return `${completed}/${total} tasks complete`;
}

// Examples
console.log(formatTaskCounter(0, 10)); // "0/10 tasks complete"
console.log(formatTaskCounter(5, 10)); // "5/10 tasks complete"
console.log(formatTaskCounter(10, 10)); // "10/10 tasks complete"
```

#### With Percentage

```typescript
function formatTaskWithPercentage(completed: number, total: number): string {
  const percentage = (completed / total) * 100;
  return `${completed}/${total} tasks (${percentage.toFixed(0)}%)`;
}

// Examples
console.log(formatTaskWithPercentage(5, 10)); // "5/10 tasks (50%)"
console.log(formatTaskWithPercentage(7, 10)); // "7/10 tasks (70%)"
```

#### With Progress Bar

```typescript
function formatTaskWithBar(
  completed: number,
  total: number,
  barWidth: number = 20
): string {
  const percentage = (completed / total) * 100;
  const bar = createASCIIProgress(percentage, barWidth);

  return `${completed}/${total} ${bar} ${percentage.toFixed(0)}%`;
}

// Examples
console.log(formatTaskWithBar(5, 10, 15));
// "5/10 [=======        ] 50%"
```

#### Multi-Stage Progress

```typescript
interface MultiStageProgress {
  stage: string;
  completedStages: number;
  totalStages: number;
  completedTasks: number;
  totalTasks: number;
}

function formatMultiStageProgress(progress: MultiStageProgress): string {
  const stagePercent = (progress.completedStages / progress.totalStages) * 100;
  const taskPercent = (progress.completedTasks / progress.totalTasks) * 100;

  return (
    `[${progress.stage}] ` +
    `Stage ${progress.completedStages}/${progress.totalStages} ` +
    `(${stagePercent.toFixed(0)}%) | ` +
    `Task ${progress.completedTasks}/${progress.totalTasks} ` +
    `(${taskPercent.toFixed(0)}%)`
  );
}

// Example
console.log(
  formatMultiStageProgress({
    stage: 'Build',
    completedStages: 1,
    totalStages: 3,
    completedTasks: 5,
    totalTasks: 10,
  })
);
// "[Build] Stage 1/3 (33%) | Task 5/10 (50%)"
```

---

### 3.5 Complete Progress Line Format

#### Standard Format

```typescript
function formatProgressLine(
  task: string,
  completed: number,
  total: number,
  percentage: number,
  eta: number
): string {
  const bar = createASCIIProgress(percentage, 20);
  const etaStr = formatDuration(eta);

  return `${task.padEnd(30)} ${bar} ${percentage.toFixed(0).padStart(3)}% ETA: ${etaStr}`;
}

// Example
console.log(formatProgressLine('Processing files', 50, 100, 50, 90));
// "Processing files              [==========----------]  50% ETA: 1m 30s"
```

#### Compact Format

```typescript
function formatProgressCompact(
  task: string,
  completed: number,
  total: number,
  percentage: number
): string {
  return `${task}: ${completed}/${total} (${percentage.toFixed(0)}%)`;
}

// Example
console.log(formatProgressCompact('Build', 50, 100, 50));
// "Build: 50/100 (50%)"
```

#### Verbose Format

```typescript
function formatProgressVerbose(
  task: string,
  completed: number,
  total: number,
  percentage: number,
  eta: number,
  speed: number
): string {
  const lines = [
    `${task}`,
    `  Progress: ${completed}/${total} (${percentage.toFixed(1)}%)`,
    `  Speed: ${speed.toFixed(2)} items/sec`,
    `  ETA: ${formatDuration(eta)}`,
  ];

  return lines.join('\n');
}

// Example
console.log(formatProgressVerbose('Building project', 50, 100, 50, 90, 0.56));
// "Building project
//   Progress: 50/100 (50.0%)
//   Speed: 0.56 items/sec
//   ETA: 1m 30s"
```

---

## 4. Best Practices for Logging Progress

### 4.1 Update Frequency

#### Task-Based Updates

```typescript
// Update after every N tasks
class TaskBasedProgress {
  private updateInterval: number;
  private completed: number = 0;

  constructor(updateInterval: number = 10) {
    this.updateInterval = updateInterval;
  }

  update(): boolean {
    this.completed++;
    return this.completed % this.updateInterval === 0;
  }
}
```

#### Time-Based Updates

```typescript
// Update every N milliseconds
class TimeBasedProgress {
  private updateInterval: number;
  private lastUpdate: number;

  constructor(updateInterval: number = 1000) {
    this.updateInterval = updateInterval;
    this.lastUpdate = Date.now();
  }

  update(): boolean {
    const now = Date.now();
    if (now - this.lastUpdate >= this.updateInterval) {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }
}
```

#### Hybrid Updates (Recommended)

```typescript
// Update on time OR task threshold
class HybridProgress {
  private updateInterval: number;
  private taskThreshold: number;
  private lastUpdate: number;
  private completed: number = 0;

  constructor(updateInterval: number = 1000, taskThreshold: number = 10) {
    this.updateInterval = updateInterval;
    this.taskThreshold = taskThreshold;
    this.lastUpdate = Date.now();
  }

  update(): boolean {
    this.completed++;
    const now = Date.now();

    // Update if time threshold reached OR task threshold reached
    const shouldUpdate =
      now - this.lastUpdate >= this.updateInterval ||
      this.completed % this.taskThreshold === 0;

    if (shouldUpdate) {
      this.lastUpdate = now;
      return true;
    }

    return false;
  }
}
```

---

### 4.2 Machine-Readable Progress Data

#### JSON Log Format

```typescript
interface ProgressLog {
  timestamp: string; // ISO 8601
  type: 'progress';
  task: string;
  completed: number;
  total: number;
  percentage: number;
  eta?: number;
  speed?: number;
}

function logProgress(data: ProgressLog): void {
  console.log(JSON.stringify(data));
}

// Example
logProgress({
  timestamp: new Date().toISOString(),
  type: 'progress',
  task: 'Processing files',
  completed: 50,
  total: 100,
  percentage: 50,
  eta: 90,
  speed: 0.56,
});

// Output:
// {"timestamp":"2026-01-13T10:30:45.123Z","type":"progress","task":"Processing files","completed":50,"total":100,"percentage":50,"eta":90,"speed":0.56}
```

#### Structured Logging with Pino

```typescript
import pino from 'pino';

const logger = pino({
  level: 'info',
  formatters: {
    level: label => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Log progress
logger.info(
  {
    type: 'progress',
    task: 'Processing files',
    completed: 50,
    total: 100,
    percentage: 50,
    eta: 90,
    speed: 0.56,
  },
  'Processing progress'
);

// Output (JSON):
// {"level":"info","time":169...,"type":"progress","task":"Processing files","completed":50,"total":100,"percentage":50,"eta":90,"speed":0.56,"msg":"Processing progress"}
```

#### Machine-Parseable Format

```typescript
// Format: PROGRESS|timestamp|task|completed|total|percentage|eta|speed
function formatMachineReadableProgress(
  task: string,
  completed: number,
  total: number,
  percentage: number,
  eta?: number,
  speed?: number
): string {
  const fields = [
    'PROGRESS',
    Date.now(),
    task,
    completed,
    total,
    percentage.toFixed(2),
    eta?.toFixed(2) || '',
    speed?.toFixed(4) || '',
  ];

  return fields.join('|');
}

// Example
console.log(formatMachineReadableProgress('Build', 50, 100, 50, 90, 0.56));
// "PROGRESS|169...|Build|50|100|50.00|90.00|0.5600"
```

---

### 4.3 Progress Event Emitters

#### Event-Based Progress

```typescript
import { EventEmitter } from 'events';

interface ProgressEvents {
  progress: (data: ProgressData) => void;
  complete: () => void;
  error: (error: Error) => void;
}

interface ProgressData {
  task: string;
  completed: number;
  total: number;
  percentage: number;
  eta?: number;
}

class ProgressTracker extends EventEmitter {
  private task: string;
  private total: number;
  private completed: number = 0;
  private startTime: number;

  constructor(task: string, total: number) {
    super();
    this.task = task;
    this.total = total;
    this.startTime = Date.now();
  }

  update(increment: number = 1): void {
    this.completed += increment;
    const percentage = (this.completed / this.total) * 100;

    this.emit('progress', {
      task: this.task,
      completed: this.completed,
      total: this.total,
      percentage,
    });

    if (this.completed >= this.total) {
      this.emit('complete');
    }
  }
}

// Usage
const tracker = new ProgressTracker('Build', 100);

tracker.on('progress', data => {
  console.log(
    `${data.task}: ${data.completed}/${data.total} (${data.percentage.toFixed(0)}%)`
  );
});

tracker.on('complete', () => {
  console.log('Build complete!');
});

// Simulate progress
for (let i = 0; i < 100; i += 10) {
  tracker.update(10);
}
```

---

### 4.4 Integration with Structured Logging

#### Pino Integration

```typescript
import pino from 'pino';

class PinoProgressTracker {
  private logger: pino.Logger;
  private task: string;
  private total: number;
  private completed: number = 0;
  private startTime: number;

  constructor(logger: pino.Logger, task: string, total: number) {
    this.logger = logger;
    this.task = task;
    this.total = total;
    this.startTime = Date.now();
  }

  update(increment: number = 1): void {
    this.completed += increment;
    const percentage = (this.completed / this.total) * 100;
    const elapsed = Date.now() - this.startTime;

    this.logger.info(
      {
        type: 'progress',
        task: this.task,
        completed: this.completed,
        total: this.total,
        percentage,
        elapsed,
      },
      'Progress update'
    );

    if (this.completed >= this.total) {
      this.logger.info(
        {
          type: 'complete',
          task: this.task,
          total: this.total,
          duration: Date.now() - this.startTime,
        },
        'Task complete'
      );
    }
  }
}

// Usage
const logger = pino({
  level: 'info',
  formatters: {
    level: label => ({ level: label }),
  },
});

const tracker = new PinoProgressTracker(logger, 'Build', 100);
tracker.update(10);
tracker.update(20);
```

#### Dual Output (Human + Machine)

```typescript
class DualOutputProgress {
  private task: string;
  private total: number;
  private completed: number = 0;

  constructor(task: string, total: number) {
    this.task = task;
    this.total = total;
  }

  update(increment: number = 1): void {
    this.completed += increment;
    const percentage = (this.completed / this.total) * 100;

    // Human-readable output (with carriage return for in-place updates)
    process.stdout.write(
      `\r${this.task}: ${this.completed}/${this.total} (${percentage.toFixed(0)}%)`
    );

    // Machine-readable output (separate line)
    console.error(
      JSON.stringify({
        type: 'progress',
        task: this.task,
        completed: this.completed,
        total: this.total,
        percentage,
        timestamp: new Date().toISOString(),
      })
    );

    if (this.completed >= this.total) {
      console.log(); // New line after completion
    }
  }
}
```

---

## 5. Library Recommendations

### 5.1 Comparison Table

| Library             | Best For                           | Complexity | Bundle Size | ETA | Multi-Bar |
| ------------------- | ---------------------------------- | ---------- | ----------- | --- | --------- |
| **cli-progress**    | Complex progress with many options | High       | ~120KB      | Yes | Yes       |
| **ora**             | Indeterminate progress/spinners    | Low        | ~20KB       | No  | No        |
| **progress**        | Simple progress bars               | Low        | ~15KB       | Yes | No        |
| **progress-stream** | Stream-based operations            | Medium     | ~10KB       | Yes | No        |

### 5.2 Recommendation Matrix

#### Use cli-progress when:

- You need multi-bar support
- You want built-in ETA calculation
- You need extensive customization
- You have concurrent operations
- You want preset themes

#### Use ora when:

- You have indeterminate progress
- You want elegant spinners
- You need success/fail states
- You want a simple API
- Bundle size matters

#### Use progress when:

- You need a simple, classic progress bar
- You want ETA calculation
- You need minimal dependencies
- You have a single operation

#### Use progress-stream when:

- You're working with Node.js streams
- You need speed tracking
- You're downloading/uploading files
- You want real-time progress

### 5.3 Integration with Pino

#### Custom Progress Reporter

```typescript
import pino from 'pino';

interface ProgressReporterOptions {
  logger: pino.Logger;
  task: string;
  total: number;
  updateInterval?: number; // milliseconds
  enableBar?: boolean; // Show progress bar
}

class ProgressReporter {
  private logger: pino.Logger;
  private task: string;
  private total: number;
  private completed: number = 0;
  private startTime: number;
  private lastUpdate: number;
  private updateInterval: number;
  private enableBar: boolean;

  constructor(options: ProgressReporterOptions) {
    this.logger = options.logger;
    this.task = options.task;
    this.total = options.total;
    this.updateInterval = options.updateInterval || 1000;
    this.enableBar = options.enableBar !== false;
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
  }

  update(increment: number = 1): void {
    this.completed += increment;
    const now = Date.now();

    // Only update at interval (or on completion)
    if (
      now - this.lastUpdate < this.updateInterval &&
      this.completed < this.total
    ) {
      return;
    }

    this.lastUpdate = now;
    const percentage = (this.completed / this.total) * 100;
    const elapsed = now - this.startTime;
    const speed = this.completed / (elapsed / 1000);
    const eta = speed > 0 ? (this.total - this.completed) / speed : Infinity;

    // Structured log
    this.logger.info(
      {
        type: 'progress',
        task: this.task,
        completed: this.completed,
        total: this.total,
        percentage,
        elapsed,
        speed: speed.toFixed(2),
        eta: eta === Infinity ? null : eta.toFixed(0),
      },
      'Progress update'
    );

    // Optional progress bar
    if (this.enableBar) {
      const bar = this.createBar(percentage, 20);
      const etaStr = eta === Infinity ? 'calculating...' : formatDuration(eta);
      process.stdout.write(
        `\r${this.task}: ${bar} ${percentage.toFixed(0)}% ETA: ${etaStr}`
      );
    }

    // Completion
    if (this.completed >= this.total) {
      const duration = now - this.startTime;

      this.logger.info(
        {
          type: 'complete',
          task: this.task,
          total: this.total,
          duration,
        },
        'Task complete'
      );

      if (this.enableBar) {
        console.log(); // New line
      }
    }
  }

  private createBar(percentage: number, width: number): string {
    const filled = Math.floor((percentage / 100) * width);
    return '[' + '='.repeat(filled) + '-'.repeat(width - filled) + ']';
  }
}

// Usage
const logger = pino({ level: 'info' });

const reporter = new ProgressReporter({
  logger,
  task: 'Building project',
  total: 100,
  updateInterval: 500,
  enableBar: true,
});

// Simulate work
for (let i = 0; i < 100; i++) {
  await doWork();
  reporter.update();
}
```

---

## 6. Code Examples

### 6.1 Complete Progress Tracker with ETA

```typescript
interface CompleteProgressTrackerOptions {
  task: string;
  total: number;
  updateInterval?: number;
  enableBar?: boolean;
  logger?: pino.Logger;
}

class CompleteProgressTracker {
  private task: string;
  private total: number;
  private completed: number = 0;
  private startTime: number;
  private lastUpdate: number;
  private updateInterval: number;
  private enableBar: boolean;
  private logger?: pino.Logger;

  private eta: ExponentialSmoothingETA;

  constructor(options: CompleteProgressTrackerOptions) {
    this.task = options.task;
    this.total = options.total;
    this.updateInterval = options.updateInterval || 1000;
    this.enableBar = options.enableBar !== false;
    this.logger = options.logger;

    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
    this.eta = new ExponentialSmoothingETA(0.3);
  }

  update(increment: number = 1): void {
    const now = Date.now();
    const elapsed = now - this.lastUpdate;

    this.completed += increment;

    // Calculate speed
    const speed = increment / (elapsed / 1000);
    this.eta.addSample(speed);

    // Only update UI at interval (or on completion)
    if (elapsed < this.updateInterval && this.completed < this.total) {
      return;
    }

    this.lastUpdate = now;
    this.render();
  }

  private render(): void {
    const percentage = (this.completed / this.total) * 100;
    const elapsed = Date.now() - this.startTime;
    const speed = this.completed / (elapsed / 1000);
    const estimatedSeconds = this.eta.calculateETA(this.total - this.completed);

    // Structured log
    if (this.logger) {
      this.logger.info(
        {
          type: 'progress',
          task: this.task,
          completed: this.completed,
          total: this.total,
          percentage: percentage.toFixed(2),
          elapsed,
          speed: speed.toFixed(2),
          eta:
            estimatedSeconds === Infinity ? null : estimatedSeconds.toFixed(0),
        },
        'Progress update'
      );
    }

    // Progress bar
    if (this.enableBar) {
      const bar = this.createBar(percentage, 30);
      const etaStr =
        estimatedSeconds === Infinity
          ? 'calculating...'
          : formatDuration(estimatedSeconds);

      process.stdout.write(
        `\r${this.task.padEnd(30)} ${bar} ${percentage.toFixed(0).padStart(3)}% ` +
          `(${this.completed}/${this.total}) ETA: ${etaStr}`
      );
    }

    // Completion
    if (this.completed >= this.total) {
      const duration = Date.now() - this.startTime;

      if (this.logger) {
        this.logger.info(
          {
            type: 'complete',
            task: this.task,
            total: this.total,
            duration,
          },
          'Task complete'
        );
      }

      if (this.enableBar) {
        console.log(
          `\n${this.task} complete in ${formatDuration(duration / 1000)}`
        );
      }
    }
  }

  private createBar(percentage: number, width: number): string {
    const filled = Math.floor((percentage / 100) * width);
    return '[' + '='.repeat(filled) + '-'.repeat(width - filled) + ']';
  }
}

// Usage
const tracker = new CompleteProgressTracker({
  task: 'Processing files',
  total: 1000,
  updateInterval: 500,
  enableBar: true,
});

for (let i = 0; i < 1000; i++) {
  await processFile(i);
  tracker.update();
}
```

### 6.2 Multi-Progress Example

```typescript
import cliProgress from 'cli-progress';

// Create multi-progress container
const multiBar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format:
      ' {name} |{bar}| {percentage}% | {value}/{total} | ETA: {eta_formatted}',
  },
  cliProgress.Presets.shades_classic
);

// Create bars
const bars = [
  multiBar.create(100, 0, { name: 'Download' }),
  multiBar.create(100, 0, { name: 'Process' }),
  multiBar.create(100, 0, { name: 'Upload' }),
];

// Update bars independently
async function runPipeline() {
  // Stage 1: Download
  for (let i = 0; i <= 100; i += 10) {
    bars[0].update(i);
    await sleep(100);
  }

  // Stage 2: Process
  for (let i = 0; i <= 100; i += 10) {
    bars[1].update(i);
    await sleep(100);
  }

  // Stage 3: Upload
  for (let i = 0; i <= 100; i += 10) {
    bars[2].update(i);
    await sleep(100);
  }

  multiBar.stop();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runPipeline();
```

### 6.3 Spinner with Progress

```typescript
import ora from 'ora';

async function processWithSpinner() {
  const spinner = ora({
    text: 'Initializing...',
    spinner: 'dots',
  }).start();

  // Phase 1
  spinner.text = 'Downloading files...';
  await downloadFiles();

  // Phase 2
  spinner.text = 'Processing data...';
  await processData();

  // Phase 3
  spinner.text = 'Saving results...';
  await saveResults();

  spinner.succeed('All tasks completed!');
}

processWithSpinner();
```

---

## 7. Additional Resources

### 7.1 Documentation URLs

| Resource            | URL                                           |
| ------------------- | --------------------------------------------- |
| **cli-progress**    | https://www.npmjs.com/package/cli-progress    |
| **ora**             | https://www.npmjs.com/package/ora             |
| **progress-stream** | https://www.npmjs.com/package/progress-stream |
| **node-progress**   | https://www.npmjs.com/package/progress        |
| **Pino**            | https://getpino.io/                           |
| **Winston**         | https://github.com/winstonjs/winston          |

### 7.2 Best Practice References

- **Twelve-Factor App Logging:** https://12factor.net/logs
- **Structured Logging Best Practices:** https://www.loggly.com/use-cases/log-best-practices/
- **CLI Design Guidelines:** https://clig.dev/
- **Terminal Progress Bars:** https://www.reddit.com/r/commandline/comments/5tqglk/what_are_some_progress_bar_styles_you_like/

---

**End of Research Document**

**Last Updated:** 2026-01-13
**Researcher:** Claude Code Agent
**For:** P5M1T2S1 - External Progress Tracking Patterns Research
