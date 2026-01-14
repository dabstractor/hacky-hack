# Node.js Resource Monitoring Research

## Overview

This document provides comprehensive research on monitoring system resources (file handles and memory) in Node.js for the PRP Pipeline, with implementation guidance and platform-specific considerations.

## File Handle Monitoring

### Getting Current File Handle Count

#### Method 1: Internal API (Primary)
```typescript
const handles = (process as any)._getActiveHandles();
if (handles && Array.isArray(handles)) {
  return handles.length;
}
```
- **Pros**: Fast, no external commands, accurate
- **Cons**: Internal API, may change between Node.js versions
- **Status**: Works on all platforms (Linux, macOS, Windows)

#### Method 2: Linux (Fastest)
```typescript
import { existsSync, readdirSync } from 'node:fs';

const fdPath = `/proc/${process.pid}/fd`;
if (existsSync(fdPath)) {
  return readdirSync(fdPath).length;
}
```
- **Pros**: Extremely fast, highly accurate
- **Cons**: Linux only, relies on /proc filesystem
- **Use**: Primary method on Linux when internal API fails

#### Method 3: macOS (Slow)
```typescript
import { execSync } from 'node:child_process';

const result = execSync(`lsof -p ${process.pid} | wc -l`, {
  encoding: 'utf-8',
  stdio: ['ignore', 'pipe', 'ignore']
});
return parseInt(result.trim(), 10) - 1; // Subtract header
```
- **Pros**: Accurate on macOS
- **Cons**: Slow (spawns process), requires lsof installed
- **Use**: Fallback on macOS when internal API fails

## Memory Usage Monitoring

### V8 Heap Memory
```typescript
const mem = process.memoryUsage();
// Returns: rss, heapTotal, heapUsed, external, arrayBuffers
```

### System Memory
```typescript
import { totalmem, freemem } from 'node:os';
const sysTotal = totalmem();
const sysFree = freemem();
const usage = (sysTotal - sysFree) / sysTotal;
```

## Best Practices

- **Polling Frequency**: 30 seconds for production
- **File Handle Thresholds**: Warn at 70%, Critical at 85%
- **Memory Thresholds**: Warn at 80%, Critical at 90%
- **Leak Detection**: Alert on >20% growth over 10-15 minutes

## Official Documentation

- [Node.js Process API](https://nodejs.org/api/process.html)
- [Node.js V8 API](https://nodejs.org/api/v8.html)
- [Node.js OS Module](https://nodejs.org/api/os.html)
