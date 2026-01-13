# Research Findings: Background/Parallel Processing for ResearchQueue Integration

**Research Date:** 2026-01-13
**Task:** P4M2T1S2
**Status:** Complete

---

## Quick Reference

This directory contains comprehensive research on TypeScript patterns for background/parallel processing, specifically for integrating a ResearchQueue with TaskOrchestrator.

### Documents

1. **[background-parallel-processing-research.md](./background-parallel-processing-research.md)**
   - Comprehensive research document (7 sections)
   - Fire-and-forget patterns
   - Promise.all vs Promise.allSettled
   - Anti-patterns to avoid
   - Research-ahead patterns
   - Metrics logging
   - Integration patterns

2. **[code-examples.md](./code-examples.md)**
   - Production-ready implementations
   - PromiseTracker class
   - ResearchCache class
   - OrchestratorMetricsCollector class
   - ResearchEnabledTaskOrchestrator class
   - Usage examples
   - Testing utilities

3. **[external-queue-patterns.md](./external-queue-patterns.md)**
   - External queue library research (P4M2T1S1)
   - Comparison with custom ResearchQueue
   - Best practices for queue selection

4. **[summary.md](./summary.md)**
   - Executive summary of research findings
   - Quick reference guide

---

## Key Findings

### 1. Fire-and-Forget Patterns

**Critical Pattern:** Always attach `.catch()` to background promises to prevent unhandled rejections.

```typescript
// GOOD: Fire-and-forget with error handling
function executeBackgroundTask(
  taskId: string,
  work: () => Promise<void>
): void {
  work().catch(error => {
    console.error(`[BackgroundTask] ${taskId} failed:`, error);
  });
}

// BAD: Unhandled promise rejection
function badBackgroundTask(work: () => Promise<void>): void {
  work(); // Will crash Node.js in future versions
}
```

**Key Insights:**

- Use PromiseTracker for deduplication of in-flight operations
- Always clean up promise maps to prevent memory leaks
- Implement global error handlers for unhandled rejections

### 2. Promise.all vs Promise.allSettled

| Feature         | Promise.all                            | Promise.allSettled                           |
| --------------- | -------------------------------------- | -------------------------------------------- |
| **Behavior**    | Fail-fast (rejects on first error)     | Waits for all (success or failure)           |
| **Use Case**    | Critical operations (all must succeed) | Independent operations (partial success OK)  |
| **Return Type** | `T[]` (array of results)               | `PromiseSettledResult<T>[]` (status objects) |

**Recommendation:** Use hybrid pattern - separate critical from non-critical operations.

```typescript
// Critical: Must succeed
await Promise.all(criticalOps);

// Non-critical: Can fail safely
await Promise.allSettled(nonCriticalOps);
```

### 3. Anti-Patterns to Avoid

| Anti-Pattern         | Consequence         | Solution                 |
| -------------------- | ------------------- | ------------------------ |
| Unhandled promises   | Node.js crashes     | Always attach `.catch()` |
| Unbounded maps       | Memory leaks        | Clean up in `.finally()` |
| Race conditions      | Duplicate work      | Atomic check-and-set     |
| Blocking event loop  | Poor performance    | Use async operations     |
| Over-parallelization | Resource exhaustion | Limit concurrency        |

### 4. Research-Ahead Patterns

**Pattern:** While executing task N, start background research for tasks N+1, N+2, etc.

```typescript
for (let i = 0; i < subtasks.length; i++) {
  const current = subtasks[i];

  // Start background research for upcoming tasks
  for (let j = 1; j <= lookAhead; j++) {
    const next = subtasks[i + j];
    if (next) {
      startBackgroundResearch(next); // Fire-and-forget
    }
  }

  // Execute current task (research may already be complete)
  await executeSubtask(current);
}
```

**Benefits:**

- Reduces overall execution time
- Hides research latency
- Improves user-perceived performance

### 5. Cache Metrics Logging

**Essential Metrics:**

- Hit rate (hits / total requests)
- Average latency
- Cache size
- Expiration rate

**Implementation:**

```typescript
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  averageLatency: number;
  totalRequests: number;
}
```

---

## Recommended Implementation Strategy

### Phase 1: Core Infrastructure (P4M2T1S2)

1. **Implement PromiseTracker**
   - Copy from `code-examples.md`
   - Add to `src/core/promise-tracker.ts`
   - Write unit tests

2. **Implement ResearchCache**
   - Copy from `code-examples.md`
   - Add to `src/core/research-cache.ts`
   - Write unit tests

3. **Implement OrchestratorMetricsCollector**
   - Copy from `code-examples.md`
   - Add to `src/core/orchestrator-metrics.ts`
   - Write unit tests

### Phase 2: Integration (P4M2T1S3)

1. **Extend TaskOrchestrator**
   - Copy ResearchEnabledTaskOrchestrator from `code-examples.md`
   - Add to `src/core/research-enabled-task-orchestrator.ts`
   - Integrate with existing TaskOrchestrator

2. **Implement Research Logic**
   - Override `performResearch()` method
   - Connect to actual research agent
   - Add error handling

3. **Add Metrics Logging**
   - Log cache hit/miss rates
   - Alert on low hit rates
   - Track research-ahead effectiveness

### Phase 3: Optimization (P4M2T1S4)

1. **Implement Research-Ahead**
   - Modify `processNextItem()` to start background research
   - Tune `lookAhead` parameter
   - Monitor performance improvements

2. **Add Graceful Shutdown**
   - Implement `waitForBackgroundResearch()`
   - Add shutdown hooks
   - Ensure all research completes before exit

3. **Production Monitoring**
   - Add metrics dashboards
   - Set up alerts
   - Optimize cache TTL

---

## Documentation URLs

### Official Documentation

**TypeScript/JavaScript:**

- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [MDN: Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [MDN: Async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

**Node.js:**

- [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Node.js Async Context Tracking](https://nodejs.org/api/async_context.html)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)

### Best Practices

- [Node.js Async Patterns](https://nodejs.dev/learn/asynchronous-workflow-and-control-flow-in-nodejs/)
- [JavaScript Promise Patterns](https://javascript.info/async)
- [TypeScript Promise Patterns](https://basarat.gitbook.io/typescript/type-system/promise)

---

## Code Locations

### Current Implementation

- **Task Orchestrator:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- **Session Manager:** `/home/dustin/projects/hacky-hack/src/core/session-manager.ts`
- **Type Models:** `/home/dustin/projects/hacky-hack/src/core/models.ts`

### New Files to Create

1. `src/core/promise-tracker.ts` - PromiseTracker class
2. `src/core/research-cache.ts` - ResearchCache class
3. `src/core/orchestrator-metrics.ts` - OrchestratorMetricsCollector class
4. `src/core/research-enabled-task-orchestrator.ts` - ResearchEnabledTaskOrchestrator class

### Related Research

- **External Queue Patterns:** [./external-queue-patterns.md](./external-queue-patterns.md)
- **Async Error Handling:** `/plan/001_14b9dc2a33c7/P3M2T1S3/research/async_error_handling_research.md`
- **Summary:** [./summary.md](./summary.md)

---

## Key Insights Summary

### 1. Background Processing

- **Fire-and-forget requires error handling** - Always attach `.catch()`
- **PromiseTracker prevents duplicate work** - Deduplicate by key
- **Clean up promises** - Use `.finally()` to prevent memory leaks

### 2. Parallel Processing

- **Promise.all for critical** - All operations must succeed
- **Promise.allSettled for resilient** - Partial success is acceptable
- **Limit concurrency** - Avoid overwhelming resources

### 3. Research-Ahead

- **Start research early** - While executing current task
- **Look ahead 3-5 tasks** - Tune based on workload
- **Cache results** - Reuse across multiple calls

### 4. Metrics

- **Track hit rate** - Target >50%
- **Monitor latency** - Should be <10ms
- **Alert on degradation** - Automated monitoring

### 5. Integration

- **Extend TaskOrchestrator** - Don't modify existing code
- **Override key methods** - `performResearch()`, `executeImplementation()`
- **Graceful shutdown** - Wait for background research

---

## Testing Checklist

- [ ] PromiseTracker deduplication works correctly
- [ ] PromiseTracker cleanup prevents memory leaks
- [ ] ResearchCache hits/misses are tracked accurately
- [ ] ResearchCache expiration works correctly
- [ ] OrchestratorMetricsCollector aggregates metrics properly
- [ ] ResearchEnabledTaskOrchestrator starts background research
- [ ] Research-ahead improves performance
- [ ] Graceful shutdown waits for background research
- [ ] Cache hit rate is >50% in realistic workload
- [ ] No unhandled promise rejections

---

## Performance Targets

Based on research findings, target these metrics:

| Metric                           | Target     | Current |
| -------------------------------- | ---------- | ------- |
| Cache Hit Rate                   | >50%       | N/A     |
| Cache Latency                    | <10ms      | N/A     |
| Research Deduplication           | >30%       | N/A     |
| Background Research Success Rate | >95%       | N/A     |
| Memory Leak Growth               | 0 bytes/hr | N/A     |

---

## Next Actions

1. ✅ **Research Complete** - All patterns documented
2. ⏳ **Create Files** - Copy implementations from code-examples.md
3. ⏳ **Write Tests** - Unit tests for all new classes
4. ⏳ **Integrate** - Extend TaskOrchestrator
5. ⏳ **Implement Research** - Connect to actual research agent
6. ⏳ **Measure Performance** - Validate targets

---

## Questions & Answers

**Q: Should I use Promise.all or Promise.allSettled for research?**
A: Use Promise.allSettled - research operations are independent and partial success is acceptable.

**Q: How do I prevent memory leaks with PromiseTracker?**
A: Always clean up promises in `.finally()` block. The provided implementation handles this automatically.

**Q: What's the optimal lookAhead value?**
A: Start with 3-5, tune based on workload characteristics. Monitor metrics to find optimal value.

**Q: How do I handle research failures in background tasks?**
A: Always attach `.catch()` to background promises. Log errors but don't let them block main execution.

**Q: Should I use a library or implement from scratch?**
A: For this use case, implement from scratch using the provided examples. Libraries like p-limit or p-queue are overkill for simple deduplication.

---

**Document Status:** Complete
**Ready for Implementation:** Yes
**Estimated Implementation Time:** 4-6 hours
