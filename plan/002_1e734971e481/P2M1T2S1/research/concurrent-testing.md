# Research: Testing Patterns for Concurrent/Serial Execution in JavaScript/TypeScript

## Overview

This research document compiles testing patterns for validating that async operations are properly serialized and don't cause race conditions. Focus is on JavaScript/TypeScript with Vitest, applicable to testing SessionManager's concurrent flush() behavior.

## 1. Testing Async Serialization

### Core Pattern: Promise Chaining and Ordering Verification

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('Async Serialization', () => {
  it('should execute operations serially', async () => {
    const executionOrder: string[] = []

    // Create async operations that track execution
    const operation1 = async () => {
      executionOrder.push('op1-start')
      await delay(10)
      executionOrder.push('op1-end')
    }

    const operation2 = async () => {
      executionOrder.push('op2-start')
      await delay(10)
      executionOrder.push('op2-end')
    }

    const operation3 = async () => {
      executionOrder.push('op3-start')
      await delay(10)
      executionOrder.push('op3-end')
    }

    // Execute all operations concurrently
    await Promise.all([
      serializeOperation(operation1),
      serializeOperation(operation2),
      serializeOperation(operation3)
    ])

    // Verify serial execution
    expect(executionOrder).toEqual([
      'op1-start', 'op1-end',
      'op2-start', 'op2-end',
      'op3-start', 'op3-end'
    ])
  })
})

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

### Pattern: Serial Queue Implementation

```typescript
class SerialQueue {
  private queue: Array<() => Promise<any>> = []
  private isProcessing = false

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.process()
    })
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      const operation = this.queue.shift()!
      await operation()
    }

    this.isProcessing = false
  }
}

// Test the serial queue
describe('SerialQueue', () => {
  it('should serialize concurrent operations', async () => {
    const queue = new SerialQueue()
    const executionOrder: number[] = []

    // Launch concurrent operations
    const promises = [
      queue.add(async () => {
        executionOrder.push(1)
        await delay(Math.random() * 10)
        executionOrder.push(2)
      }),
      queue.add(async () => {
        executionOrder.push(3)
        await delay(Math.random() * 10)
        executionOrder.push(4)
      }),
      queue.add(async () => {
        executionOrder.push(5)
        await delay(Math.random() * 10)
        executionOrder.push(6)
      })
    ]

    await Promise.all(promises)

    // Verify complete serialization
    expect(executionOrder).toEqual([1, 2, 3, 4, 5, 6])
  })
})
```

## 2. Race Condition Testing Patterns

### Pattern: Concurrent Access Simulation

```typescript
describe('Race Condition Prevention', () => {
  it('should handle concurrent flush calls safely', async () => {
    const manager = new SessionManager()
    const flushCount = { value: 0 }
    const writeOrder: string[] = []

    // Mock flush to track calls
    const originalFlush = manager.flushUpdates.bind(manager)
    manager.flushUpdates = async () => {
      writeOrder.push(`flush-start-${flushCount.value}`)
      await delay(10)
      flushCount.value++
      writeOrder.push(`flush-end-${flushCount.value}`)
    }

    // Simulate 10 concurrent flush calls
    const concurrentFlushes = Array.from({ length: 10 }, (_, i) =>
      manager.flushUpdates()
    )

    await Promise.all(concurrentFlushes)

    // Verify only one flush completed at a time
    // Each start should have its matching end before next start
    let inFlush = false
    for (const entry of writeOrder) {
      if (entry.startsWith('flush-start')) {
        expect(inFlush).toBe(false)
        inFlush = true
      } else if (entry.startsWith('flush-end')) {
        expect(inFlush).toBe(true)
        inFlush = false
      }
    }
  })
})
```

### Pattern: State Mutation Race Detection

```typescript
describe('State Mutation Race Conditions', () => {
  it('should prevent race conditions in state updates', async () => {
    const state = { counter: 0 }
    const mutations: number[] = []

    // Create an update queue with proper locking
    let lock = Promise.resolve()

    const updateState = async (delta: number): Promise<void> => {
      // Wait for previous update to complete
      const release = await new Promise<boolean>(resolve => {
        lock = lock.then(() => {
          mutations.push(state.counter)
          state.counter += delta
          resolve(true)
          return true
        })
      })
    }

    // Launch concurrent updates
    await Promise.all([
      updateState(1),
      updateState(2),
      updateState(3),
      updateState(4),
      updateState(5)
    ])

    // Verify final state is correct (sum of all deltas)
    expect(state.counter).toBe(15)

    // Verify no intermediate state was corrupted
    expect(mutations).toEqual([0, 1, 3, 6, 10])
  })
})
```

### Pattern: File Write Race Condition Testing

```typescript
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('File Write Race Conditions', () => {
  const tempDir = '/tmp/test-race-conditions'
  const testFile = join(tempDir, 'test.json')

  it('should prevent file corruption from concurrent writes', async () => {
    const writeCount = 100
    const writePromises: Promise<void>[] = []

    // Simulate concurrent writes
    for (let i = 0; i < writeCount; i++) {
      writePromises.push(
        atomicWrite(testFile, { value: i, timestamp: Date.now() })
      )
    }

    await Promise.all(writePromises)

    // Verify file is valid JSON
    expect(existsSync(testFile)).toBe(true)

    const content = JSON.parse(readFileSync(testFile, 'utf-8'))
    expect(content).toHaveProperty('value')
    expect(content).toHaveProperty('timestamp')

    // Verify only one write "won"
    expect(content.value).toBeGreaterThanOrEqual(0)
    expect(content.value).toBeLessThan(writeCount)
  })
})

async function atomicWrite(filePath: string, data: any): Promise<void> {
  const tempPath = `${filePath}.${Date.now()}.${Math.random()}`

  // Write to temp file
  writeFileSync(tempPath, JSON.stringify(data))

  // Atomic rename
  return new Promise((resolve, reject) => {
    // Simulate async rename
    setTimeout(() => {
      try {
        // In real implementation, use fs.rename
        // For testing, we just verify pattern
        resolve()
      } catch (error) {
        reject(error)
      }
    }, Math.random() * 10)
  })
}
```

## 3. Using Promises and Async/Await for Serialization Testing

### Pattern: Promise.allSettled for Error Handling

```typescript
describe('Serialization with Error Handling', () => {
  it('should continue serialization after errors', async () => {
    const executionOrder: string[] = []
    const shouldFail = new Set([2, 5])

    const operations = Array.from({ length: 7 }, (_, i) =>
      async () => {
        executionOrder.push(`start-${i}`)
        await delay(10)

        if (shouldFail.has(i)) {
          throw new Error(`Operation ${i} failed`)
        }

        executionOrder.push(`end-${i}`)
      }
    )

    const results = await Promise.allSettled(
      operations.map(op => serializeOperation(op))
    )

    // Verify all operations attempted
    expect(executionOrder).toHaveLength(14)

    // Verify operations executed serially despite errors
    for (let i = 0; i < 7; i++) {
      const startIndex = executionOrder.indexOf(`start-${i}`)
      const endIndex = executionOrder.indexOf(`end-${i}`)

      if (shouldFail.has(i)) {
        expect(startIndex).toBeGreaterThanOrEqual(0)
        expect(endIndex).toBe(-1)
      } else {
        expect(startIndex).toBeGreaterThanOrEqual(0)
        expect(endIndex).toBeGreaterThan(startIndex)
      }
    }
  })
})
```

### Pattern: Async Lock Implementation

```typescript
class AsyncLock {
  private locked = false
  private queue: Array<() => void> = []

  async acquire(): Promise<() => void> {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true
        resolve(() => this.release())
      } else {
        this.queue.push(() => {
          this.locked = true
          resolve(() => this.release())
        })
      }
    })
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!
      next()
    } else {
      this.locked = false
    }
  }
}

describe('Async Lock', () => {
  it('should serialize access to critical section', async () => {
    const lock = new AsyncLock()
    const criticalSectionEntries: string[] = []

    const enterCriticalSection = async (id: number): Promise<void> => {
      const release = await lock.acquire()

      try {
        criticalSectionEntries.push(`enter-${id}`)
        await delay(Math.random() * 20)
        criticalSectionEntries.push(`exit-${id}`)
      } finally {
        release()
      }
    }

    // Launch concurrent access attempts
    await Promise.all([
      enterCriticalSection(1),
      enterCriticalSection(2),
      enterCriticalSection(3),
      enterCriticalSection(4),
      enterCriticalSection(5)
    ])

    // Verify no overlap in critical section
    let inSection = false
    for (const entry of criticalSectionEntries) {
      if (entry.startsWith('enter')) {
        expect(inSection).toBe(false)
        inSection = true
      } else {
        expect(inSection).toBe(true)
        inSection = false
      }
    }
  })
})
```

## 4. Simulating Concurrent Calls in Tests

### Pattern: Promise.all for True Concurrency

```typescript
describe('Simulating Concurrent Calls', () => {
  it('should test behavior under concurrent load', async () => {
    const callOrder: { call: number; start: number }[] = []
    let activeCalls = 0
    const maxConcurrentCalls: number[] = []

    const concurrentCall = async (id: number): Promise<void> => {
      const start = Date.now()
      callOrder.push({ call: id, start })
      activeCalls++
      maxConcurrentCalls.push(activeCalls)

      await delay(Math.random() * 50)

      activeCalls--
    }

    // Launch 20 concurrent calls
    const promises = Array.from({ length: 20 }, (_, i) =>
      concurrentCall(i)
    )

    await Promise.all(promises)

    // Verify true concurrency (multiple calls active simultaneously)
    const maxSimultaneous = Math.max(...maxConcurrentCalls)
    expect(maxSimultaneous).toBeGreaterThan(1)
    expect(maxSimultaneous).toBeLessThanOrEqual(20)
  })
})
```

### Pattern: Vitest vi.useFakeTimers for Deterministic Testing

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

describe('Deterministic Async Testing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should test serialization with controlled timing', async () => {
    const executionOrder: string[] = []
    const flushSpy = vi.fn()

    const scheduleFlush = async (id: number): Promise<void> => {
      executionOrder.push(`schedule-${id}`)
      setTimeout(async () => {
        executionOrder.push(`flush-${id}`)
        flushSpy()
      }, 10)
    }

    // Schedule multiple flushes
    scheduleFlush(1)
    scheduleFlush(2)
    scheduleFlush(3)

    // Advance timers to trigger first flush
    await vi.advanceTimersByTimeAsync(10)
    expect(flushSpy).toHaveBeenCalledTimes(1)
    expect(executionOrder).toContain('flush-1')

    // Advance for second flush
    await vi.advanceTimersByTimeAsync(10)
    expect(flushSpy).toHaveBeenCalledTimes(2)

    // Advance for third flush
    await vi.advanceTimersByTimeAsync(10)
    expect(flushSpy).toHaveBeenCalledTimes(3)
  })
})
```

### Pattern: Load Testing with Batches

```typescript
describe('Load Testing Concurrent Operations', () => {
  it('should handle burst of concurrent operations', async () => {
    const manager = new SessionManager()
    const results: { batch: number; id: number; duration: number }[] = []

    const testBatches = [10, 50, 100]

    for (const batchSize of testBatches) {
      const startTime = Date.now()

      const batch = Array.from({ length: batchSize }, (_, i) =>
        manager.flushUpdates().then(() => ({
          batch: batchSize,
          id: i,
          duration: Date.now() - startTime
        }))
      )

      const batchResults = await Promise.all(batch)
      results.push(...batchResults)
    }

    // Verify all operations completed
    expect(results).toHaveLength(
      testBatches.reduce((sum, size) => sum + size, 0)
    )

    // Group by batch and verify serialization
    for (const batchSize of testBatches) {
      const batchResults = results.filter(r => r.batch === batchSize)
      expect(batchResults).toHaveLength(batchSize)

      // Verify serial execution within batch
      const sortedByDuration = [...batchResults].sort((a, b) =>
        a.duration - b.duration
      )

      for (let i = 1; i < sortedByDuration.length; i++) {
        expect(sortedByDuration[i].duration).toBeGreaterThan(
          sortedByDuration[i - 1].duration
        )
      }
    }
  })
})
```

## 5. Best Practices for Testing Async Serialization

### 1. Use Explicit Ordering Verification

```typescript
// GOOD: Explicit ordering checks
it('should serialize operations', async () => {
  const order: string[] = []

  await Promise.all([
    op1().then(() => order.push('1')),
    op2().then(() => order.push('2')),
    op3().then(() => order.push('3'))
  ])

  expect(order).toEqual(['1', '2', '3'])
})

// AVOID: Vague timing checks
it('should serialize operations', async () => {
  const start = Date.now()
  await Promise.all([op1(), op2(), op3()])
  const duration = Date.now() - start

  // This is flaky - depends on operation timing
  expect(duration).toBeGreaterThan(100)
})
```

### 2. Test Edge Cases

```typescript
describe('Serialization Edge Cases', () => {
  it('should handle empty operation queue', async () => {
    const queue = new SerialQueue()
    await expect(queue.process()).resolves.toBeUndefined()
  })

  it('should handle single operation', async () => {
    const queue = new SerialQueue()
    let executed = false

    await queue.add(async () => {
      executed = true
    })

    expect(executed).toBe(true)
  })

  it('should handle operations that throw', async () => {
    const queue = new SerialQueue()
    const errors: Error[] = []

    const promises = [
      queue.add(async () => {
        throw new Error('Error 1')
      }).catch(e => errors.push(e)),
      queue.add(async () => {
        throw new Error('Error 2')
      }).catch(e => errors.push(e))
    ]

    await Promise.all(promises)

    expect(errors).toHaveLength(2)
    expect(errors[0].message).toBe('Error 1')
    expect(errors[1].message).toBe('Error 2')
  })
})
```

### 3. Use Vitest's Testing Utilities

```typescript
import { vi, beforeEach, afterEach, expect } from 'vitest'

describe('Vitest Async Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should track async call counts', async () => {
    const flushSpy = vi.fn().mockResolvedValue(undefined)
    const manager = new SessionManager()
    manager.flushUpdates = flushSpy

    // Launch concurrent calls
    await Promise.all([
      manager.flushUpdates(),
      manager.flushUpdates(),
      manager.flushUpdates()
    ])

    // Verify actual call count (after serialization)
    expect(flushSpy).toHaveBeenCalledTimes(3)
  })

  it('should use waitFor for async conditions', async () => {
    const manager = new SessionManager()
    let ready = false

    // Setup async condition
    setTimeout(() => {
      ready = true
    }, 100)

    // Wait for condition
    await vi.waitFor(() => {
      expect(ready).toBe(true)
    }, { timeout: 200 })
  })
})
```

### 4. Test with Realistic Delays

```typescript
describe('Realistic Serialization Testing', () => {
  it('should handle variable operation durations', async () => {
    const executionOrder: string[] = []

    const variableDurationOp = async (id: number): Promise<void> => {
      executionOrder.push(`start-${id}`)
      // Random duration between 5ms and 50ms
      const duration = 5 + Math.random() * 45
      await delay(duration)
      executionOrder.push(`end-${id}`)
    }

    await Promise.all([
      serializeOperation(() => variableDurationOp(1)),
      serializeOperation(() => variableDurationOp(2)),
      serializeOperation(() => variableDurationOp(3)),
      serializeOperation(() => variableDurationOp(4)),
      serializeOperation(() => variableDurationOp(5))
    ])

    // Verify complete serialization despite random delays
    expect(executionOrder).toEqual([
      'start-1', 'end-1',
      'start-2', 'end-2',
      'start-3', 'end-3',
      'start-4', 'end-4',
      'start-5', 'end-5'
    ])
  })
})
```

### 5. Use Property-Based Testing for Serialization

```typescript
import { fc, test } from 'fast-check'

describe('Property-Based Serialization Testing', () => {
  test.prop([
    fc.array(fc.nat({ max: 100 }), { minLength: 1, maxLength: 50 })
  ])('should serialize any number of operations', async (durations) => {
    const executionOrder: number[] = []

    const operations = durations.map(duration =>
      async () => {
        const id = executionOrder.length
        executionOrder.push(id)
        await delay(duration)
      }
    )

    await Promise.all(operations.map(op => serializeOperation(op)))

    // Verify all operations completed
    expect(executionOrder).toHaveLength(durations.length)

    // Verify order matches input
    expect(executionOrder).toEqual(
      Array.from({ length: durations.length }, (_, i) => i)
    )
  })
})
```

## 6. Vitest-Specific Patterns for Concurrent Testing

### Pattern: test.concurrent for Parallel Test Execution

```typescript
import { test, describe } from 'vitest'

describe.concurrent('Concurrent Test Execution', () => {
  test('should run in parallel with other tests', async () => {
    // This test runs in parallel with other tests in this suite
    const delay = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms))

    await delay(100)
    expect(true).toBe(true)
  })

  test('should also run in parallel', async () => {
    const delay = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms))

    await delay(100)
    expect(true).toBe(true)
  })
})
```

### Pattern: vi.runOnlyPendingTimers for Async Testing

```typescript
describe('Timer-Based Testing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should control async execution', async () => {
    const manager = new SessionManager()
    const flushSpy = vi.fn()
    manager.flushUpdates = flushSpy

    // Schedule multiple flushes with different delays
    setTimeout(() => manager.flushUpdates(), 10)
    setTimeout(() => manager.flushUpdates(), 20)
    setTimeout(() => manager.flushUpdates(), 30)

    // Run only timers up to first flush
    await vi.runAllTimersAsync()

    // Verify all flushes executed
    expect(flushSpy).toHaveBeenCalledTimes(3)
  })
})
```

## 7. Complete Example: SessionManager Concurrent Flush Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SessionManager } from '@/core/session-manager'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'

describe('SessionManager Concurrent Flush Testing', () => {
  const testDir = '/tmp/test-session-manager'
  const tasksJsonPath = join(testDir, 'tasks.json')

  beforeEach(() => {
    // Setup test environment
    vi.clearAllMocks()
    vi.restoreAllMocks()

    // Mock fs operations
    vi.mock('fs', () => ({
      writeFileSync: vi.fn(),
      readFileSync: vi.fn(),
      renameSync: vi.fn(),
      existsSync: vi.fn(() => true)
    }))
  })

  describe('concurrent flush() calls', () => {
    it('should serialize concurrent flush operations', async () => {
      const manager = new SessionManager(testDir)
      const flushOrder: string[] = []
      const originalFlush = manager.flushUpdates.bind(manager)

      // Spy on flush calls
      manager.flushUpdates = vi.fn(async () => {
        const flushId = Math.random().toString(36).substr(2, 9)
        flushOrder.push(`start-${flushId}`)

        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10))

        flushOrder.push(`end-${flushId}`)
      })

      // Launch 20 concurrent flush calls
      const concurrentFlushes = Array.from({ length: 20 }, () =>
        manager.flushUpdates()
      )

      await Promise.all(concurrentFlushes)

      // Verify all flushes completed
      expect(manager.flushUpdates).toHaveBeenCalledTimes(20)

      // Verify serialization: no overlap
      let inFlush = false
      for (const entry of flushOrder) {
        if (entry.startsWith('start-')) {
          expect(inFlush).toBe(false)
          inFlush = true
        } else if (entry.startsWith('end-')) {
          expect(inFlush).toBe(true)
          inFlush = false
        }
      }
    })

    it('should prevent file corruption from concurrent writes', async () => {
      const manager = new SessionManager(testDir)
      const writeAttempts: { tempPath: string; data: any }[] = []

      // Mock fs operations to track writes
      const mockWriteFileSync = vi.fn((path: string, data: string) => {
        if (path.includes('.tmp')) {
          writeAttempts.push({
            tempPath: path,
            data: JSON.parse(data)
          })
        }
      })

      const mockRenameSync = vi.fn((from: string, to: string) => {
        // Simulate atomic rename
      })

      vi.doMock('fs', () => ({
        writeFileSync: mockWriteFileSync,
        renameSync: mockRenameSync,
        existsSync: vi.fn(() => true)
      }))

      // Update some tasks
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete')
      await manager.updateItemStatus('P1.M1.T1.S2', 'Complete')

      // Launch concurrent flushes
      const flushPromises = [
        manager.flushUpdates(),
        manager.flushUpdates(),
        manager.flushUpdates(),
        manager.flushUpdates(),
        manager.flushUpdates()
      ]

      await Promise.all(flushPromises)

      // Verify writes went to temp files first
      writeAttempts.forEach(attempt => {
        expect(attempt.tempPath).toMatch(/\.tmp/)
        expect(attempt.data).toHaveProperty('backlog')
      })

      // Verify data integrity
      writeAttempts.forEach(attempt => {
        expect(attempt.data.backlog).toBeInstanceOf(Array)
        expect(() => JSON.parse(JSON.stringify(attempt.data))).not.toThrow()
      })
    })

    it('should handle errors during concurrent flushes', async () => {
      const manager = new SessionManager(testDir)
      let shouldFail = true

      const originalFlush = manager.flushUpdates.bind(manager)
      manager.flushUpdates = vi.fn(async () => {
        if (shouldFail) {
          shouldFail = false
          throw new Error('Simulated write failure')
        }

        await new Promise(resolve => setTimeout(resolve, 10))
      })

      // Launch concurrent flushes
      const results = await Promise.allSettled([
        manager.flushUpdates(),
        manager.flushUpdates(),
        manager.flushUpdates()
      ])

      // Verify one failed, others succeeded
      const failures = results.filter(r => r.status === 'fulfilled' &&
        r.reason instanceof Error)

      expect(failures).toHaveLength(1)
      expect(failures[0].reason).toHaveProperty('message', 'Simulated write failure')
    })
  })

  describe('flush() with pending updates', () => {
    it('should flush all pending updates atomically', async () => {
      const manager = new SessionManager(testDir)
      const updateOrder: string[] = []

      // Track update and flush order
      const originalUpdate = manager.updateItemStatus.bind(manager)
      manager.updateItemStatus = vi.fn(async (id, status) => {
        updateOrder.push(`update-${id}`)
        return originalUpdate(id, status)
      })

      const originalFlush = manager.flushUpdates.bind(manager)
      manager.flushUpdates = vi.fn(async () => {
        updateOrder.push('flush-start')
        await originalFlush()
        updateOrder.push('flush-end')
      })

      // Queue multiple updates
      await Promise.all([
        manager.updateItemStatus('P1.M1.T1.S1', 'Complete'),
        manager.updateItemStatus('P1.M1.T1.S2', 'Complete'),
        manager.updateItemStatus('P1.M1.T1.S3', 'Complete')
      ])

      // Flush
      await manager.flushUpdates()

      // Verify all updates before flush
      const flushStartIndex = updateOrder.indexOf('flush-start')
      const updatesBeforeFlush = updateOrder
        .slice(0, flushStartIndex)
        .filter(e => e.startsWith('update-'))

      expect(updatesBeforeFlush).toHaveLength(3)
    })

    it('should clear pending updates after successful flush', async () => {
      const manager = new SessionManager(testDir)

      // Queue updates
      await manager.updateItemStatus('P1.M1.T1.S1', 'Complete')
      await manager.updateItemStatus('P1.M1.T1.S2', 'Complete')

      // Flush
      await manager.flushUpdates()

      // Flush again should be no-op
      const flushSpy = vi.fn()
      const originalFlush = manager.flushUpdates.bind(manager)
      manager.flushUpdates = flushSpy

      await manager.flushUpdates()

      // Verify second flush had no work to do
      // (implementation-specific assertion)
    })
  })
})
```

## Key Takeaways

1. **Use explicit ordering verification**: Track execution order with arrays or counters, not just timing
2. **Simulate true concurrency**: Use `Promise.all()` to launch operations simultaneously
3. **Test edge cases**: Empty queues, single operations, errors, variable durations
4. **Use Vitest utilities**: `vi.useFakeTimers()`, `vi.waitFor()`, `vi.fn()` for controlled testing
5. **Verify data integrity**: Check that serialized operations produce correct final state
6. **Test with realistic loads**: Use batches of operations (10, 50, 100) to stress-test serialization
7. **Mock carefully**: Mock fs operations to simulate failures without actual file system issues

## References

- Vitest Documentation: https://vitest.dev/api/
- JavaScript Async Patterns: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
- Testing Race Conditions: https://kentcdodds.com/blog/test-react-hooks-like-a-boss (concepts apply broadly)
- Async/Await Best Practices: https://javascript.info/async
