# Vitest State Machine Testing Patterns

**Research Date:** 2026-01-21
**Task:** P1M2T3S1 - Research Vitest testing patterns for state machines and status transitions

---

## Executive Summary

This document compiles best practices, patterns, and examples for testing state machines and status transitions using Vitest and TypeScript. While web search tools were unavailable during research, this document synthesizes established testing patterns from the Vitest ecosystem, TypeScript best practices, and real-world implementations.

**Note:** URLs to official documentation will need to be added when web access is available. The patterns documented here are based on industry best practices and the existing codebase structure.

---

## Table of Contents

1. [Testing State Transitions in TypeScript/Vitest](#1-testing-state-transitions-in-typescriptvitest)
2. [Testing Enum-Based Status Values](#2-testing-enum-based-status-values)
3. [Testing Invalid State Transitions](#3-testing-invalid-state-transitions)
4. [Mock Patterns for State Machine Testing](#4-mock-patterns-for-state-machine-testing)
5. [Coverage Patterns for State Transition Logic](#5-coverage-patterns-for-state-transition-logic)
6. [Common Pitfalls and Anti-Patterns](#6-common-pitfalls-and-anti-patterns)
7. [Real-World Examples](#7-real-world-examples)
8. [Additional Resources](#8-additional-resources)

---

## 1. Testing State Transitions in TypeScript/Vitest

### 1.1 Basic State Transition Testing Pattern

**Best Practice:** Test each valid state transition individually with clear preconditions and assertions.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import type { Status } from '@/core/models.js';

/**
 * Example: Testing a simple state machine
 * Based on the Status type from the project:
 * type Status = 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed'
 */

describe('Task Status Transitions', () => {
  let taskStatus: Status;

  beforeEach(() => {
    taskStatus = 'Planned';
  });

  describe('Valid transitions from Planned', () => {
    it('should transition from Planned to Researching', () => {
      taskStatus = transitionStatus(taskStatus, 'Researching');
      expect(taskStatus).toBe('Researching');
    });

    it('should transition from Planned to Failed', () => {
      taskStatus = transitionStatus(taskStatus, 'Failed');
      expect(taskStatus).toBe('Failed');
    });
  });

  describe('Valid transitions from Researching', () => {
    beforeEach(() => {
      taskStatus = 'Researching';
    });

    it('should transition from Researching to Implementing', () => {
      taskStatus = transitionStatus(taskStatus, 'Implementing');
      expect(taskStatus).toBe('Implementing');
    });

    it('should transition from Researching to Failed', () => {
      taskStatus = transitionStatus(taskStatus, 'Failed');
      expect(taskStatus).toBe('Failed');
    });
  });

  describe('Valid transitions from Implementing', () => {
    beforeEach(() => {
      taskStatus = 'Implementing';
    });

    it('should transition from Implementing to Complete', () => {
      taskStatus = transitionStatus(taskStatus, 'Complete');
      expect(taskStatus).toBe('Complete');
    });

    it('should transition from Implementing to Failed', () => {
      taskStatus = transitionStatus(taskStatus, 'Failed');
      expect(taskStatus).toBe('Failed');
    });
  });
});
```

### 1.2 State Transition Table Pattern

**Best Practice:** Use data-driven tests to cover all valid state transitions systematically.

```typescript
describe('State transition table', () => {
  const validTransitions: Array<{
    from: Status;
    to: Status;
    description: string;
  }> = [
    { from: 'Planned', to: 'Researching', description: 'start research' },
    { from: 'Planned', to: 'Failed', description: 'fail before starting' },
    {
      from: 'Researching',
      to: 'Implementing',
      description: 'complete research',
    },
    { from: 'Researching', to: 'Failed', description: 'fail during research' },
    {
      from: 'Implementing',
      to: 'Complete',
      description: 'complete implementation',
    },
    {
      from: 'Implementing',
      to: 'Failed',
      description: 'fail during implementation',
    },
    // Failed can transition back to Planned for retry
    { from: 'Failed', to: 'Planned', description: 'retry task' },
  ];

  validTransitions.forEach(({ from, to, description }) => {
    it(`should allow transition from ${from} to ${to} (${description})`, () => {
      const stateMachine = createTaskStateMachine(from);
      stateMachine.transition(to);
      expect(stateMachine.currentStatus).toBe(to);
    });
  });
});
```

### 1.3 State Machine Integration Testing

**Best Practice:** Test the complete state machine lifecycle with realistic scenarios.

```typescript
describe('Complete task lifecycle', () => {
  it('should follow full happy path: Planned -> Researching -> Implementing -> Complete', () => {
    const task = createTask({ id: 'T1', status: 'Planned' });

    task.startResearch();
    expect(task.status).toBe('Researching');

    task.completeResearch();
    expect(task.status).toBe('Implementing');

    task.completeImplementation();
    expect(task.status).toBe('Complete');
  });

  it('should handle failure at any stage', () => {
    // Test failure during research
    const task1 = createTask({ id: 'T1', status: 'Researching' });
    task1.fail();
    expect(task1.status).toBe('Failed');

    // Test failure during implementation
    const task2 = createTask({ id: 'T2', status: 'Implementing' });
    task2.fail();
    expect(task2.status).toBe('Failed');
  });
});
```

---

## 2. Testing Enum-Based Status Values

### 2.1 String Union Type Status Pattern

The project uses string union types (not enums), which requires different testing approaches.

```typescript
// From the project: src/core/models.ts
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed';
```

### 2.2 Exhaustive Status Value Testing

**Best Practice:** Ensure all status values are covered in tests using TypeScript's type checking.

```typescript
describe('Status type coverage', () => {
  const allStatuses: Status[] = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',
    'Failed',
  ];

  it('should define all expected status values', () => {
    // This ensures we've covered all status values in tests
    // If a new status is added to the type, TypeScript will error here
    const exhaustiveCheck: Status[] = allStatuses;
    expect(exhaustiveCheck.length).toBeGreaterThan(0);
  });

  it('should handle creating tasks with each status', () => {
    allStatuses.forEach(status => {
      const task = createTask({ id: 'T1', status });
      expect(task.status).toBe(status);
    });
  });

  it('should serialize all status values correctly', () => {
    allStatuses.forEach(status => {
      const serialized = JSON.stringify({ status });
      expect(serialized).toContain(`"status":"${status}"`);
    });
  });
});
```

### 2.3 Status-Specific Behavior Testing

**Best Practice:** Test behaviors that vary based on status values.

```typescript
describe('Status-specific behaviors', () => {
  describe('Planned status', () => {
    it('should not allow completion without starting', () => {
      const task = createTask({ id: 'T1', status: 'Planned' });
      expect(() => task.complete()).toThrow('Cannot complete planned task');
    });

    it('should allow starting research', () => {
      const task = createTask({ id: 'T1', status: 'Planned' });
      expect(() => task.startResearch()).not.toThrow();
    });
  });

  describe('Complete status', () => {
    it('should not allow further transitions', () => {
      const task = createTask({ id: 'T1', status: 'Complete' });
      expect(() => task.startResearch()).toThrow(
        'Cannot modify completed task'
      );
      expect(() => task.fail()).toThrow('Cannot modify completed task');
    });

    it('should be a terminal state', () => {
      const task = createTask({ id: 'T1', status: 'Complete' });
      const isTerminal = task.isTerminal();
      expect(isTerminal).toBe(true);
    });
  });

  describe('Failed status', () => {
    it('should allow retry from Planned', () => {
      const task = createTask({ id: 'T1', status: 'Failed' });
      task.retry();
      expect(task.status).toBe('Planned');
    });

    it('should track failure reason', () => {
      const task = createTask({
        id: 'T1',
        status: 'Failed',
        failureReason: 'Timeout',
      });
      expect(task.failureReason).toBe('Timeout');
    });
  });
});
```

### 2.4 Status Comparison and Equality Testing

```typescript
describe('Status comparisons', () => {
  it('should correctly identify active statuses', () => {
    const activeStatuses: Status[] = ['Researching', 'Implementing'];
    const inactiveStatuses: Status[] = ['Planned', 'Complete', 'Failed'];

    activeStatuses.forEach(status => {
      expect(isActiveStatus(status)).toBe(true);
    });

    inactiveStatuses.forEach(status => {
      expect(isActiveStatus(status)).toBe(false);
    });
  });

  it('should correctly identify terminal statuses', () => {
    const terminalStatuses: Status[] = ['Complete', 'Failed'];
    const nonTerminalStatuses: Status[] = [
      'Planned',
      'Researching',
      'Implementing',
    ];

    terminalStatuses.forEach(status => {
      expect(isTerminalStatus(status)).toBe(true);
    });

    nonTerminalStatuses.forEach(status => {
      expect(isTerminalStatus(status)).toBe(false);
    });
  });

  it('should support status progression checks', () => {
    expect(canProgressTo('Planned', 'Researching')).toBe(true);
    expect(canProgressTo('Researching', 'Implementing')).toBe(true);
    expect(canProgressTo('Implementing', 'Complete')).toBe(true);
    expect(canProgressTo('Complete', 'Planned')).toBe(false); // Cannot go back
  });
});
```

---

## 3. Testing Invalid State Transitions

### 3.1 Invalid Transition Detection Pattern

**Best Practice:** Explicitly test that invalid transitions throw appropriate errors.

```typescript
describe('Invalid state transitions', () => {
  const invalidTransitions: Array<{
    from: Status;
    to: Status;
    reason: string;
  }> = [
    { from: 'Complete', to: 'Planned', reason: 'complete to planned' },
    { from: 'Complete', to: 'Researching', reason: 'complete to researching' },
    {
      from: 'Complete',
      to: 'Implementing',
      reason: 'complete to implementing',
    },
    {
      from: 'Researching',
      to: 'Planned',
      reason: 'researching to planned (no going back)',
    },
    {
      from: 'Implementing',
      to: 'Researching',
      reason: 'implementing to researching (no going back)',
    },
  ];

  invalidTransitions.forEach(({ from, to, reason }) => {
    it(`should prevent transition from ${from} to ${to} (${reason})`, () => {
      const stateMachine = createTaskStateMachine(from);
      expect(() => stateMachine.transition(to)).toThrow();
    });
  });
});
```

### 3.2 Error Message Validation

**Best Practice:** Verify that error messages are informative and consistent.

```typescript
describe('Invalid transition error messages', () => {
  it('should include current and target status in error', () => {
    const stateMachine = createTaskStateMachine('Complete');

    try {
      stateMachine.transition('Planned');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).toContain('Complete');
      expect(String(error)).toContain('Planned');
      expect(String(error)).toContain('Invalid transition');
    }
  });

  it('should provide actionable error message', () => {
    const stateMachine = createTaskStateMachine('Implementing');

    try {
      stateMachine.transition('Planned');
      expect.fail('Should have thrown an error');
    } catch (error) {
      const message = String(error);
      expect(message).toMatch(/cannot|invalid|not allowed/i);
    }
  });
});
```

### 3.3 Guard Function Testing

**Best Practice:** Test state transition guard functions independently.

```typescript
describe('State transition guards', () => {
  describe('canTransitionTo()', () => {
    it('should return true for valid transitions', () => {
      expect(canTransitionTo('Planned', 'Researching')).toBe(true);
      expect(canTransitionTo('Researching', 'Implementing')).toBe(true);
      expect(canTransitionTo('Implementing', 'Complete')).toBe(true);
      expect(canTransitionTo('Implementing', 'Failed')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(canTransitionTo('Complete', 'Planned')).toBe(false);
      expect(canTransitionTo('Complete', 'Researching')).toBe(false);
      expect(canTransitionTo('Complete', 'Implementing')).toBe(false);
      expect(canTransitionTo('Researching', 'Planned')).toBe(false);
    });

    it('should handle all status combinations', () => {
      const allStatuses: Status[] = [
        'Planned',
        'Researching',
        'Implementing',
        'Complete',
        'Failed',
      ];

      allStatuses.forEach(from => {
        allStatuses.forEach(to => {
          const result = canTransitionTo(from, to);
          expect(typeof result).toBe('boolean');
        });
      });
    });
  });

  describe('validateTransition()', () => {
    it('should throw for invalid transitions', () => {
      expect(() => validateTransition('Complete', 'Planned')).toThrow();
    });

    it('should not throw for valid transitions', () => {
      expect(() => validateTransition('Planned', 'Researching')).not.toThrow();
    });

    it('should return validation result', () => {
      const valid = validateTransition('Planned', 'Researching');
      const invalid = validateTransition('Complete', 'Planned');

      expect(valid.valid).toBe(true);
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toBeDefined();
    });
  });
});
```

### 3.4 Boundary State Testing

**Best Practice:** Test transitions at state boundaries and edge cases.

```typescript
describe('Boundary state transitions', () => {
  it('should handle rapid state changes', () => {
    const stateMachine = createTaskStateMachine('Planned');

    stateMachine.transition('Researching');
    stateMachine.transition('Implementing');
    stateMachine.transition('Complete');

    expect(stateMachine.currentStatus).toBe('Complete');
  });

  it('should handle state transition after failure', () => {
    const stateMachine = createTaskStateMachine('Implementing');

    stateMachine.transition('Failed');
    stateMachine.transition('Planned'); // Retry
    stateMachine.transition('Researching');

    expect(stateMachine.currentStatus).toBe('Researching');
  });

  it('should prevent state skipping', () => {
    const stateMachine = createTaskStateMachine('Planned');

    // Should not be able to skip directly to Complete
    expect(() => stateMachine.transition('Complete')).toThrow();
  });
});
```

---

## 4. Mock Patterns for State Machine Testing

### 4.1 Mocking State Machine Dependencies

**Best Practice:** Use `vi.fn()` to mock external dependencies and isolate state machine logic.

```typescript
import { vi } from 'vitest';

describe('State machine with mocked dependencies', () => {
  it('should log state transitions', () => {
    const mockLogger = vi.fn();
    const stateMachine = createTaskStateMachine('Planned', {
      logger: mockLogger,
    });

    stateMachine.transition('Researching');

    expect(mockLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Planned',
        to: 'Researching',
        timestamp: expect.any(Number),
      }),
      'State transition'
    );
  });

  it('should persist state on transition', () => {
    const mockPersist = vi.fn().mockResolvedValue(undefined);
    const stateMachine = createTaskStateMachine('Planned', {
      persist: mockPersist,
    });

    stateMachine.transition('Researching');

    expect(mockPersist).toHaveBeenCalledWith('Researching');
  });

  it('should trigger events on state change', () => {
    const mockOnEnter = vi.fn();
    const mockOnExit = vi.fn();

    const stateMachine = createTaskStateMachine('Planned', {
      onEnterResearching: mockOnEnter,
      onExitPlanned: mockOnExit,
    });

    stateMachine.transition('Researching');

    expect(mockOnExit).toHaveBeenCalledWith('Planned');
    expect(mockOnEnter).toHaveBeenCalledWith('Researching');
  });
});
```

### 4.2 Timer Mocking for Async State Machines

**Best Practice:** Use `vi.useFakeTimers()` to test time-based state transitions.

```typescript
describe('Async state transitions with timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-transition after timeout', () => {
    const stateMachine = createTaskStateMachine('Researching', {
      timeout: 5000,
      onTimeout: () => stateMachine.transition('Failed'),
    });

    expect(stateMachine.currentStatus).toBe('Researching');

    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);

    expect(stateMachine.currentStatus).toBe('Failed');
  });

  it('should not auto-transition if completed before timeout', () => {
    const onTimeout = vi.fn();
    const stateMachine = createTaskStateMachine('Researching', {
      timeout: 5000,
      onTimeout,
    });

    // Complete before timeout
    vi.advanceTimersByTime(1000);
    stateMachine.transition('Implementing');

    // Fast-forward past timeout
    vi.advanceTimersByTime(5000);

    expect(stateMachine.currentStatus).toBe('Implementing');
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('should handle multiple timer-based transitions', () => {
    const stateMachine = createTaskStateMachine('Planned', {
      phaseTimeouts: {
        Planned: 1000,
        Researching: 2000,
        Implementing: 3000,
      },
    });

    // Progress through all states
    stateMachine.transition('Researching');
    vi.advanceTimersByTime(1000);

    stateMachine.transition('Implementing');
    vi.advanceTimersByTime(2000);

    stateMachine.transition('Complete');

    expect(stateMachine.currentStatus).toBe('Complete');
  });
});
```

### 4.3 Module Mocking for State Machine Context

**Best Practice:** Use `vi.mock()` to mock entire modules that state machines depend on.

```typescript
// Mock a dependency module
vi.mock('@/utils/persistence.js', () => ({
  saveState: vi.fn().mockResolvedValue(undefined),
  loadState: vi.fn().mockResolvedValue('Planned'),
  clearState: vi.fn().mockResolvedValue(undefined),
}));

describe('State machine with module mocks', () => {
  it('should persist state on transition', async () => {
    const { saveState } = await import('@/utils/persistence.js');
    const stateMachine = await createPersistedStateMachine('T1');

    await stateMachine.transition('Researching');

    expect(saveState).toHaveBeenCalledWith('T1', 'Researching');
  });

  it('should load initial state from persistence', async () => {
    const { loadState } = await import('@/utils/persistence.js');
    vi.mocked(loadState).mockResolvedValueOnce('Implementing');

    const stateMachine = await createPersistedStateMachine('T1');

    expect(stateMachine.currentStatus).toBe('Implementing');
  });
});
```

### 4.4 Spy Patterns for State Change Observers

**Best Practice:** Use spies to verify that state change callbacks are invoked correctly.

```typescript
describe('State change observers', () => {
  it('should notify all observers on state change', () => {
    const observer1 = vi.fn();
    const observer2 = vi.fn();
    const observer3 = vi.fn();

    const stateMachine = createTaskStateMachine('Planned');
    stateMachine.subscribe(observer1);
    stateMachine.subscribe(observer2);
    stateMachine.subscribe(observer3);

    stateMachine.transition('Researching');

    expect(observer1).toHaveBeenCalledWith('Researching', 'Planned');
    expect(observer2).toHaveBeenCalledWith('Researching', 'Planned');
    expect(observer3).toHaveBeenCalledWith('Researching', 'Planned');
  });

  it('should unsubscribe observers', () => {
    const observer = vi.fn();
    const stateMachine = createTaskStateMachine('Planned');

    const unsubscribe = stateMachine.subscribe(observer);
    unsubscribe();

    stateMachine.transition('Researching');

    expect(observer).not.toHaveBeenCalled();
  });

  it('should filter notifications by status', () => {
    const researchObserver = vi.fn();
    const implementObserver = vi.fn();

    const stateMachine = createTaskStateMachine('Planned');
    stateMachine.subscribeWhen('Researching', researchObserver);
    stateMachine.subscribeWhen('Implementing', implementObserver);

    stateMachine.transition('Researching');
    expect(researchObserver).toHaveBeenCalled();
    expect(implementObserver).not.toHaveBeenCalled();

    stateMachine.transition('Implementing');
    expect(implementObserver).toHaveBeenCalled();
  });
});
```

### 4.5 Mock Return Values for Guard Functions

```typescript
describe('State machine with conditional guards', () => {
  it('should use guard function to allow/deny transitions', () => {
    const guard = vi
      .fn()
      .mockReturnValueOnce(true) // Allow first transition
      .mockReturnValueOnce(false); // Deny second transition

    const stateMachine = createTaskStateMachine('Planned', { guard });

    expect(() => stateMachine.transition('Researching')).not.toThrow();
    expect(() => stateMachine.transition('Implementing')).toThrow();

    expect(guard).toHaveBeenCalledTimes(2);
  });

  it('should pass context to guard function', () => {
    const guard = vi.fn((from, to, context) => {
      return context.userRole === 'admin';
    });

    const stateMachine = createTaskStateMachine('Planned', { guard });

    // Should fail without admin role
    expect(() => stateMachine.transition('Researching')).toThrow();

    // Should succeed with admin role
    stateMachine.setContext({ userRole: 'admin' });
    expect(() => stateMachine.transition('Researching')).not.toThrow();
  });
});
```

---

## 5. Coverage Patterns for State Transition Logic

### 5.1 Branch Coverage for State Transitions

**Best Practice:** Ensure all conditional branches in state transition logic are covered.

```typescript
describe('Complete state transition coverage', () => {
  it('should cover all status branches in transition logic', () => {
    const allStatuses: Status[] = [
      'Planned',
      'Researching',
      'Implementing',
      'Complete',
      'Failed',
    ];

    allStatuses.forEach(fromStatus => {
      allStatuses.forEach(toStatus => {
        const stateMachine = createTaskStateMachine(fromStatus);
        const canTransition = canTransitionTo(fromStatus, toStatus);

        if (canTransition) {
          expect(() => stateMachine.transition(toStatus)).not.toThrow();
        } else {
          expect(() => stateMachine.transition(toStatus)).toThrow();
        }
      });
    });
  });
});
```

### 5.2 Path Coverage for Complex State Machines

**Best Practice:** Test all valid paths through the state machine.

```typescript
describe('State machine path coverage', () => {
  const validPaths: Status[][] = [
    ['Planned', 'Researching', 'Implementing', 'Complete'],
    [
      'Planned',
      'Researching',
      'Implementing',
      'Failed',
      'Planned',
      'Researching',
    ],
    [
      'Planned',
      'Researching',
      'Failed',
      'Planned',
      'Researching',
      'Implementing',
      'Complete',
    ],
    ['Planned', 'Failed', 'Planned', 'Researching', 'Implementing', 'Complete'],
  ];

  validPaths.forEach((path, index) => {
    it(`should follow valid path ${index + 1}: ${path.join(' -> ')}`, () => {
      const stateMachine = createTaskStateMachine(path[0]);

      for (let i = 1; i < path.length; i++) {
        stateMachine.transition(path[i]);
        expect(stateMachine.currentStatus).toBe(path[i]);
      }
    });
  });
});
```

### 5.3 Coverage Configuration

**From the project's vitest.config.ts:**

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  thresholds: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
},
```

**Best Practice:** Maintain 100% coverage for state machine logic due to its critical nature.

### 5.4 Measuring State Transition Coverage

```typescript
describe('State transition coverage verification', () => {
  it('should have tests for all defined status transitions', () => {
    const allStatuses: Status[] = [
      'Planned',
      'Researching',
      'Implementing',
      'Complete',
      'Failed',
    ];
    const testedTransitions = new Set<string>();

    // This test verifies we have comprehensive coverage
    // In practice, track which transitions are tested elsewhere
    allStatuses.forEach(from => {
      allStatuses.forEach(to => {
        const transitionKey = `${from}->${to}`;
        const isValid = canTransitionTo(from, to);

        // Verify we have a test for this transition
        if (isValid) {
          expect(
            testedTransitions.has(transitionKey) ||
              hasTestForTransition(from, to)
          ).toBeTruthy();
        }
      });
    });
  });

  it('should document all unreachable transitions', () => {
    const unreachableTransitions = [
      'Complete->Planned',
      'Complete->Researching',
      'Complete->Implementing',
      'Researching->Planned',
      'Implementing->Planned',
      'Implementing->Researching',
    ];

    unreachableTransitions.forEach(transition => {
      const [from, to] = transition.split('->') as [Status, Status];
      expect(canTransitionTo(from, to)).toBe(false);
    });
  });
});
```

### 5.5 Mutation Testing for State Machines

**Best Practice:** Consider mutation testing to verify state transition logic is properly tested.

```typescript
describe('State machine mutation testing', () => {
  it('should catch missing transition validation', () => {
    // Simulate a mutation: always return true for transition validation
    const originalCanTransition = canTransitionTo;
    let mutationDetected = false;

    // Mutated version (for testing test quality)
    const mutatedCanTransition = () => true;

    // Replace temporarily
    globalThis.canTransitionTo = mutatedCanTransition;

    try {
      const stateMachine = createTaskStateMachine('Complete');

      // This should throw with the real implementation
      // But the mutation allows it
      stateMachine.transition('Planned');

      // If we reach here, our tests didn't catch the mutation
      mutationDetected = true;
    } catch {
      // Expected - the real implementation caught it
    } finally {
      globalThis.canTransitionTo = originalCanTransition;
    }

    // In a real mutation test framework, this would be automated
    expect(mutationDetected).toBe(false);
  });
});
```

---

## 6. Common Pitfalls and Anti-Patterns

### 6.1 Pitfall: Incomplete State Transition Testing

**Anti-Pattern:** Only testing the happy path.

```typescript
// BAD: Only tests successful transitions
describe('State transitions', () => {
  it('should transition to Complete', () => {
    const task = createTask({ status: 'Planned' });
    task.transitionTo('Complete'); // May pass but skip validation
    expect(task.status).toBe('Complete');
  });
});

// GOOD: Tests both valid and invalid transitions
describe('State transitions', () => {
  it('should follow required sequence to reach Complete', () => {
    const task = createTask({ status: 'Planned' });

    expect(() => task.transitionTo('Complete')).toThrow();

    task.transitionTo('Researching');
    task.transitionTo('Implementing');
    task.transitionTo('Complete');

    expect(task.status).toBe('Complete');
  });
});
```

### 6.2 Pitfall: Not Testing State Immutability

**Anti-Pattern:** Mutating state directly without validation.

```typescript
// BAD: Direct mutation bypasses state machine
describe('State changes', () => {
  it('should change status', () => {
    const task = createTask({ status: 'Planned' });
    (task as any).status = 'Complete'; // Direct mutation
    expect(task.status).toBe('Complete');
  });
});

// GOOD: Use proper state transition methods
describe('State changes', () => {
  it('should enforce state transition rules', () => {
    const task = createTask({ status: 'Planned' });

    // Direct mutation should be prevented
    expect(() => {
      'use strict';
      task.status = 'Complete';
    }).toThrow();

    // Proper transition should work
    task.transitionTo('Researching');
    expect(task.status).toBe('Researching');
  });
});
```

### 6.3 Pitfall: Missing Async State Handling

**Anti-Pattern:** Not testing async state transitions properly.

```typescript
// BAD: Not awaiting async transitions
describe('Async state transitions', () => {
  it('should transition asynchronously', () => {
    const task = createTask({ status: 'Planned' });
    task.transitionAsync('Researching'); // Not awaited
    expect(task.status).toBe('Researching'); // May fail
  });
});

// GOOD: Properly await async transitions
describe('Async state transitions', () => {
  it('should transition asynchronously', async () => {
    const task = createTask({ status: 'Planned' });
    await task.transitionAsync('Researching');
    expect(task.status).toBe('Researching');
  });

  it('should handle transition rejection', async () => {
    const task = createTask({ status: 'Complete' });

    await expect(task.transitionAsync('Planned')).rejects.toThrow();
  });
});
```

### 6.4 Pitfall: Overly Complex State Machines

**Anti-Pattern:** Too many states making testing difficult.

```typescript
// BAD: Too many fine-grained states
type OverlySpecificStatus =
  | 'Planned'
  | 'ResearchStarted'
  | 'ResearchInProgress'
  | 'ResearchNearlyDone'
  | 'ResearchComplete'
  | 'ImplementationStarted'
  | 'ImplementationInProgress'
  | 'ImplementationNearlyDone'
  | 'ImplementationComplete'
  | 'TestingStarted'
  | 'TestingInProgress'
  | 'TestingComplete';

// GOOD: Coarse-grained, clear states
type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Testing'
  | 'Complete'
  | 'Failed';
```

### 6.5 Pitfall: Not Testing State Persistence

**Anti-Pattern:** State machine doesn't handle persistence/resumption.

```typescript
// BAD: No persistence consideration
describe('State machine', () => {
  it('should transition states', () => {
    const sm = createStateMachine('Planned');
    sm.transition('Researching');
    expect(sm.state).toBe('Researching');
  });
});

// GOOD: Tests persistence and restoration
describe('State machine with persistence', () => {
  it('should persist state on transition', async () => {
    const sm = await createPersistedStateMachine('T1', 'Planned');
    await sm.transition('Researching');

    const restored = await loadStateMachine('T1');
    expect(restored.state).toBe('Researching');
  });

  it('should resume from persisted state', async () => {
    const sm1 = await createPersistedStateMachine('T1', 'Planned');
    await sm1.transition('Researching');

    const sm2 = await loadStateMachine('T1');
    expect(sm2.state).toBe('Researching');

    // Should continue from Researching
    await sm2.transition('Implementing');
    expect(sm2.state).toBe('Implementing');
  });
});
```

### 6.6 Pitfall: Tightly Coupled State Machines

**Anti-Pattern:** State machines are coupled to specific implementations.

```typescript
// BAD: Tightly coupled to Task implementation
describe('Task state machine', () => {
  it('should transition', () => {
    const task = new Task(/* many dependencies */);
    task.transition('Researching');
    expect(task.status).toBe('Researching');
  });
});

// GOOD: State machine is independent
describe('State machine', () => {
  it('should work with any implementation', () => {
    class MockStateful implements Stateful {
      public state: Status = 'Planned';
      setState(newState: Status) {
        this.state = newState;
      }
    }

    const mock = new MockStateful();
    const sm = createStateMachine(mock);

    sm.transition('Researching');
    expect(mock.state).toBe('Researching');
  });
});
```

---

## 7. Real-World Examples

### 7.1 Task Progress Tracking State Machine

Based on the project's progress tracking:

```typescript
/**
 * Example: Task Progress State Machine
 * Based on tests/unit/utils/progress.test.ts
 */

describe('Task progress state machine', () => {
  it('should track task lifecycle through states', () => {
    const tracker = new ProgressTracker({ backlog: createComplexBacklog(10) });

    // Initial state
    const progress1 = tracker.getProgress();
    expect(progress1.completed).toBe(0);
    expect(progress1.percentage).toBe(0);

    // Tasks in progress
    tracker.recordStart('P1.M1.T1.S1');
    tracker.recordStart('P1.M1.T1.S2');
    const progress2 = tracker.getProgress();
    expect(progress2.completed).toBe(0);
    expect(progress2.elapsed).toBeGreaterThan(0);

    // Tasks completing
    tracker.recordComplete('P1.M1.T1.S1');
    tracker.recordComplete('P1.M1.T1.S2');
    const progress3 = tracker.getProgress();
    expect(progress3.completed).toBe(2);
    expect(progress3.percentage).toBe(20);

    // All complete
    for (let i = 3; i <= 10; i++) {
      tracker.recordStart(`P1.M1.T1.S${i}`);
      tracker.recordComplete(`P1.M1.T1.S${i}`);
    }
    const progress4 = tracker.getProgress();
    expect(progress4.completed).toBe(10);
    expect(progress4.percentage).toBe(100);
  });
});
```

### 7.2 Multi-Level Task Hierarchy State Machine

```typescript
/**
 * Example: Hierarchical State Machine
 * Based on the project's Phase > Milestone > Task > Subtask hierarchy
 */

describe('Hierarchical task state machine', () => {
  it('should propagate state changes upward', () => {
    const backlog = createComplexBacklog(5);
    const machine = createHierarchicalStateMachine(backlog);

    // Subtask status change
    machine.setSubtaskStatus('P1.M1.T1.S1', 'Complete');

    // Task should reflect subtask completion
    expect(machine.getTaskStatus('P1.M1.T1')).toBe('Complete');

    // Milestone should reflect task completion
    expect(machine.getMilestoneStatus('P1.M1')).toBe('Complete');

    // Phase should reflect milestone completion
    expect(machine.getPhaseStatus('P1')).toBe('Complete');
  });

  it('should aggregate status from children', () => {
    const backlog = createComplexBacklog(3);
    const machine = createHierarchicalStateMachine(backlog);

    // Set different statuses for subtasks
    machine.setSubtaskStatus('P1.M1.T1.S1', 'Complete');
    machine.setSubtaskStatus('P1.M1.T1.S2', 'Implementing');
    machine.setSubtaskStatus('P1.M1.T1.S3', 'Planned');

    // Task status should be most "active" child status
    const taskStatus = machine.getTaskStatus('P1.M1.T1');
    expect(['Implementing', 'In Progress']).toContain(taskStatus);
  });

  it('should prevent parent state when children are incomplete', () => {
    const backlog = createComplexBacklog(3);
    const machine = createHierarchicalStateMachine(backlog);

    // Only complete first subtask
    machine.setSubtaskStatus('P1.M1.T1.S1', 'Complete');

    // Cannot complete task until all subtasks are complete
    expect(() => {
      machine.setTaskStatus('P1.M1.T1', 'Complete');
    }).toThrow(/Cannot complete task with incomplete subtasks/);
  });
});
```

### 7.3 Session State Machine

Based on the project's session management:

```typescript
/**
 * Example: Session State Machine
 * Managing complex session lifecycle
 */

describe('Session state machine', () => {
  it('should follow session lifecycle', () => {
    const session = createSession();

    // Initial state
    expect(session.state).toBe('initialized');

    // Activate session
    session.activate();
    expect(session.state).toBe('active');

    // Pause session
    session.pause();
    expect(session.state).toBe('paused');

    // Resume session
    session.resume();
    expect(session.state).toBe('active');

    // Complete session
    session.complete();
    expect(session.state).toBe('completed');
  });

  it('should prevent state-specific operations', () => {
    const session = createSession();

    // Cannot pause inactive session
    expect(() => session.pause()).toThrow();

    session.activate();
    session.pause();

    // Cannot activate paused session (must resume)
    expect(() => session.activate()).toThrow();

    session.resume();
    session.complete();

    // Cannot perform operations on completed session
    expect(() => session.pause()).toThrow();
    expect(() => session.resume()).toThrow();
  });

  it('should handle session restoration', async () => {
    const session1 = createSession();
    session1.activate();
    await session1.persist();

    const session2 = await loadSession(session1.id);
    expect(session2.state).toBe('active');

    // Should resume operations
    session2.pause();
    expect(session2.state).toBe('paused');
  });
});
```

---

## 8. Additional Resources

### 8.1 Official Documentation

**Note:** The following URLs should be verified and added when web access is available:

- **Vitest Official Documentation:** https://vitest.dev/
  - Testing Guide: `/guide/`
  - API Reference: `/api/`
  - Mocking: `/guide/mocking.html`
  - Coverage: `/guide/coverage.html`
  - Assertions: `/guide/expect.html`

- **TypeScript Handbook:**
  - Union Types: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
  - Type Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - Discriminated Unions: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html#discriminated-unions

### 8.2 State Machine Libraries

- **XState:** https://xstate.js.org/
  - Official docs with testing patterns
  - Vitest integration examples
  - State machine testing best practices

- **Robot:** https://robot.v3.js.org/
  - Lightweight functional state machines
  - Testing patterns and examples

### 8.3 Testing Best Practices

**To be researched when web access is available:**

- State machine testing patterns from industry leaders
- Blog posts on testing status transitions
- StackOverflow Q&A on Vitest state testing
- GitHub repositories with exemplary state machine tests

### 8.4 Related Patterns

- **State Pattern (GoF):** Object-oriented state management
- **State Monad:** Functional programming approach
- **Redux State Machines:** Testing Redux reducers
- **React State Machines:** Testing state machines in React components

---

## Appendix: Quick Reference

### A.1 Common Assertion Patterns

```typescript
// State equality
expect(stateMachine.currentStatus).toBe('Researching');

// State change
expect(() => stateMachine.transition('Complete')).not.toThrow();

// Invalid transition
expect(() => stateMachine.transition('Invalid')).toThrow();

// State transition history
expect(stateMachine.history).toEqual([
  { from: 'Planned', to: 'Researching', timestamp: 1234567890 },
  { from: 'Researching', to: 'Implementing', timestamp: 1234567891 },
]);

// State-specific behavior
expect(stateMachine.canTransitionTo('Complete')).toBe(true);
```

### A.2 Test Structure Template

```typescript
describe('FeatureName State Machine', () => {
  describe('Valid transitions', () => {
    // Test each valid transition
  });

  describe('Invalid transitions', () => {
    // Test error cases
  });

  describe('State-specific behavior', () => {
    // Test behaviors unique to each state
  });

  describe('Edge cases', () => {
    // Test boundary conditions
  });

  describe('Integration scenarios', () => {
    // Test complete workflows
  });
});
```

### A.3 Mock Template

```typescript
describe('FeatureName with mocks', () => {
  const mockLogger = vi.fn();
  const mockPersist = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call mock on transition', () => {
    // Test with mocks
  });
});
```

---

## Research Notes

### Limitations

- Web search tools were unavailable during this research due to monthly usage limits
- URLs to official documentation need to be verified and added
- Some examples are based on general best practices rather than official documentation

### Next Steps

1. **Verify URLs:** Check and add official Vitest documentation links
2. **Community Resources:** Search for blog posts and StackOverflow examples
3. **Real Examples:** Find open-source projects using Vitest for state machine testing
4. **Update Examples:** Refine examples based on official documentation

### Project Context

This research was conducted for the hacky-hack project, which uses:

- **Vitest** as the testing framework
- **TypeScript** with strict type checking
- **100% code coverage** requirement
- **String union types** for status values (not enums)
- **Hierarchical task model**: Phase > Milestone > Task > Subtask

### Relevant Project Files

- `/home/dustin/projects/hacky-hack/vitest.config.ts` - Vitest configuration with coverage settings
- `/home/dustin/projects/hacky-hack/src/core/models.ts` - Status type definitions
- `/home/dustin/projects/hacky-hack/tests/unit/utils/progress.test.ts` - Example of state-related testing
- `/home/dustin/projects/hacky-hack/tests/unit/core/` - Core model and state testing examples

---

**End of Research Document**
**Last Updated:** 2026-01-21
**Status:** Initial research complete, URLs to be added when web access available
