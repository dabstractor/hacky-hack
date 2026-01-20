# Signal Handling Test Research - Quick Reference

## Overview

This directory contains research on testing graceful shutdown and signal handling in TypeScript/Node.js applications.

## Main Document

**[signal-handling-test-research.md](./signal-handling-test-research.md)** - Comprehensive research guide covering:

1. How to properly mock process.signal emission (SIGINT, SIGTERM) in Vitest tests
2. How to test that current task completes before shutdown
3. How to verify state persistence during shutdown
4. How to test signal listener cleanup
5. Common pitfalls when testing signal handlers
6. Testing patterns for --continue flag functionality after interruption
7. How to verify no state corruption occurs during shutdown

## Key Findings

### 1. Mocking Signals in Vitest

```typescript
// Direct signal emission
process.emit('SIGINT');
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));
expect(pipeline.shutdownRequested).toBe(true);
```

### 2. Testing Task Completion

```typescript
// Verify current task completes before shutdown
let callCount = 0;
const mockOrchestrator: any = {
  processNextItem: vi.fn().mockImplementation(async () => {
    callCount++;
    if (callCount === 1) {
      (pipeline as any).shutdownRequested = true;
    }
    return callCount <= 1;
  }),
};
expect(callCount).toBeGreaterThan(0); // Task completed
```

### 3. Listener Cleanup Pattern

```typescript
beforeEach(() => {
  originalProcessListeners = {
    SIGINT: (process as any)._events?.SIGINT?.slice() || [],
    SIGTERM: (process as any)._events?.SIGTERM?.slice() || [],
  };
});

afterEach(() => {
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalProcessListeners.SIGINT.forEach(l => process.on('SIGINT', l));
  originalProcessListeners.SIGTERM.forEach(l => process.on('SIGTERM', l));
});
```

### 4. Critical Patterns

- **Always use `setImmediate()`** after `process.emit()` to allow async handlers to complete
- **Store handler references** (`#sigintHandler`) to enable cleanup
- **Use `finally` blocks** for cleanup to ensure it runs on error
- **Test duplicate signals** to verify no state corruption
- **Verify state persistence** in all scenarios (success, error, shutdown)

## Existing Test Examples

The codebase already contains comprehensive signal handling tests:

- **Integration Tests**: `/home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-shutdown.test.ts`
  - 884 lines of comprehensive shutdown testing
  - Tests for SIGINT, SIGTERM, duplicate signals, state persistence, listener cleanup
  - Real examples of all patterns described in research

- **Unit Tests**: `/home/dustin/projects/hacky-hack/tests/unit/workflows/prp-pipeline.test.ts`
  - 1183 lines covering unit-level signal handling
  - Graceful shutdown state management
  - Cleanup behavior verification

- **Implementation**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`
  - 1848 lines with complete signal handling implementation
  - Handler registration, cleanup, state preservation
  - Resource limit handling

## Common Pitfalls

1. **Not allowing async handlers to complete**: Always use `setImmediate()` after signal emission
2. **Not cleaning up listeners**: Causes memory leaks and test pollution
3. **Calling process.exit()**: Terminates test runner; use flags instead
4. **Not testing error paths**: Cleanup must work even when errors occur
5. **Assuming signal order**: Test various signal combinations

## Testing Checklist

- [ ] SIGINT sets shutdown flags correctly
- [ ] SIGTERM sets shutdown flags correctly
- [ ] Duplicate signals log warnings
- [ ] Current task completes before shutdown
- [ ] State is saved in cleanup (even on error)
- [ ] Signal listeners are removed
- [ ] --continue flag resumes from correct state
- [ ] No state corruption with multiple signals
- [ ] Finally block always executes cleanup

## Application to PRPPipeline

All patterns in the research document are directly applicable to PRPPipeline testing:

- **Signal Handler Setup**: Lines 321-355 in `prp-pipeline.ts`
- **Cleanup Method**: Lines 1247-1331 in `prp-pipeline.ts`
- **Graceful Shutdown Loop**: Lines 769-870 in `prp-pipeline.ts`
- **Integration Tests**: Complete coverage in `prp-pipeline-shutdown.test.ts`

## Next Steps

1. Review the comprehensive research document
2. Examine existing test examples in the codebase
3. Apply patterns to new test scenarios
4. Ensure all checklist items are covered
5. Add tests for any edge cases not covered

---

**Document**: signal-handling-test-research.md (1,357 lines)
**Date**: 2026-01-19
**Focus**: Vitest signal handling testing for TypeScript/Node.js applications
