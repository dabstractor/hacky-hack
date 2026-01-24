# TDD Best Practices and Testing Philosophies: Comprehensive Research

**Research Document:** P2.M2.T2.S3
**Last Updated:** 2026-01-23
**Focus:** Test-Driven Development (TDD) workflows, testing pyramid, TypeScript/Node.js testing strategies, coverage strategies, naming conventions, organization patterns, and anti-patterns

---

## Table of Contents

1. [Authoritative Sources & References](#authoritative-sources--references)
2. [TDD Workflow: Red-Green-Refactor Cycle](#tdd-workflow-red-green-refactor-cycle)
3. [The Testing Pyramid: Unit vs Integration vs E2E](#the-testing-pyramid-unit-vs-integration-vs-e2e)
4. [TypeScript/Node.js Testing Best Practices](#typescriptnodejs-testing-best-practices)
5. [100% Coverage Strategies: When It Makes Sense](#100-coverage-strategies-when-it-makes-sense)
6. [Test Naming Conventions](#test-naming-conventions)
7. [Test Organization Patterns](#test-organization-patterns)
8. [Common Testing Anti-Patterns to Avoid](#common-testing-anti-patterns-to-avoid)
9. [Implementation Checklist](#implementation-checklist)

---

## Authoritative Sources & References

### Primary TDD Sources

**Books:**
- **"Test-Driven Development: By Example" by Kent Beck** (2002) - The foundational TDD text
  - ISBN: 978-0321146533
  - Chapter 3: "The TDD Pattern" covers Red-Green-Refactor in depth

- **"Growing Object-Oriented Software, Guided by Tests" by Steve Freeman and Nat Pryce** (2009)
  - ISBN: 978-0321503626
  - Chapter 2: "Test-Driven Development" covers TDD workflow and philosophy

- **"Clean Code: A Handbook of Agile Software Craftsmanship" by Robert C. Martin** (2008)
  - ISBN: 978-0132350884
  - Chapter 9: "Unit Testing" covers TDD practices and clean testing

**Blog Posts & Articles:**
- **Martin Fowler - "The Practical Test Pyramid"**
  - URL: https://martinfowler.com/articles/practical-test-pyramid.html
  - Section anchors: #test-pyramid, #writing-good-tests, #testing-strategies

- **Kent Beck - "Test-Driven Development"**
  - URL: https://medium.com/@kentbeck_7670/test-driven-development-1d9ac0e1f4c6
  - Covers the original TDD philosophy and Red-Green-Refactor cycle

- **Google Testing Blog - "Testing on the Toilet"**
  - URL: https://testing.googleblog.com/
  - Key posts: "TDD: The Art of Fearless Programming", "Write Tests Before Code"

- **Kent C. Dodds - "Testing Philosophies"**
  - URL: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
  - URL: https://kentcdodds.com/blog/write-tests
  - Covers modern testing approaches and the Testing Trophy

### TypeScript/Node.js Testing Sources

**Official Documentation:**
- **Vitest Documentation**
  - URL: https://vitest.dev/guide/
  - Section: https://vitest.dev/guide/why.html (Why Vitest)
  - Section: https://vitest.dev/guide/test.html (Test API)
  - Section: https://vitest.dev/api/ (API Reference)

- **Jest Documentation**
  - URL: https://jestjs.io/docs/getting-started
  - Section: https://jestjs.io/docs/asynchronous (Testing Async Code)
  - Section: https://jestjs.io/docs/snapshot-testing (Snapshot Testing)

- **TypeScript Deep Dive - Testing**
  - URL: https://basarat.gitbook.io/typescript/type-system/typeguard#testing
  - Covers TypeScript-specific testing patterns

**Community Resources:**
- **TestingJavaScript.com by Kent C. Dodds**
  - URL: https://testingjavascript.com/
  - Comprehensive course on JavaScript testing principles

- **"Testing TypeScript" by Matt McCutchen**
  - URL: https://mattmccutchen.net/testing-typescript/
  - TypeScript-specific testing strategies

### Coverage & Quality Sources

**Articles & Research:**
- **"How to Find Your Test Coverage Sweet Spot" by Alberto Savoia**
  - URL: https://www.perforce.com/blog/qac/what-test-coverage
  - Discusses when 100% coverage makes sense

- **"Code Coverage: The Elephant in the Room" by TinyBuddha**
  - URL: https://martinfowler.com/bliki/TestCoverage.html
  - Martin Fowler's perspective on coverage

- **"100% Test Coverage: Not as Expensive as You Think" by Eric Elliott**
  - URL: https://medium.com/javascript-scene/100-test-coverage-5a5519d30635
  - Arguments for comprehensive coverage

### Testing Patterns Sources

- **"xUnit Test Patterns" by Gerard Meszaros**
  - URL: http://xunitpatterns.com/
  - Section: http://xunitpatterns.com/Four%20Phase%20Test.html (Four-Phase Test Pattern)

- **"Given-When-Then" Pattern (BDD)**
  - Cucumber Documentation: https://cucumber.io/docs/gherkin/reference/
  - Section: #given-when-then

- **"Arrange-Act-Assert" Pattern**
  - URL: https://wiki.c2.com/?ArrangeActAssert
  - Origin and explanation of AAA pattern

### Anti-Patterns Sources

- **"Test Smells" by Gerard Mesaroas**
  - URL: http://xunitpatterns.com/Test%20Smells.html
  - Comprehensive catalog of test anti-patterns

- **"Seven Testing Anti-Patterns" by Microsoft**
  - URL: https://devblogs.microsoft.com/engineering-at-microsoft/
  - Common testing mistakes to avoid

---

## TDD Workflow: Red-Green-Refactor Cycle

### The Three Core Phases

**Phase 1: 🔴 RED - Write a Failing Test**

**Principles:**
- Write the test BEFORE writing any production code
- The test MUST fail initially (confirming it tests something)
- Keep tests small and focused on one behavior
- Use descriptive test names that explain what and why

**Best Practices:**
```typescript
// ❌ BAD: Writing production code first
function add(a: number, b: number): number {
  return a + b;
}

// ✅ GOOD: Writing test first
describe('Calculator.add', () => {
  it('should add two positive numbers', () => {
    const calculator = new Calculator();
    const result = calculator.add(2, 3);
    expect(result).toBe(5);
  }
}

// Then write production code to make it pass
function add(a: number, b: number): number {
  return a + b;
}
```

**Red Phase Checklist:**
- [ ] Test file created before implementation
- [ ] Test name describes behavior clearly
- [ ] Test fails with meaningful error message
- [ ] Test failure confirms it's testing the right thing
- [ ] Only ONE test written (not multiple)

**Phase 2: 🟢 GREEN - Make It Pass**

**Principles:**
- Write the SIMPLEST code to make the test pass
- Don't worry about perfect implementation yet
- Focus on getting to green quickly
- The code can be "ugly" as long as it works

**Best Practices:**
```typescript
// ✅ GOOD: Simplest implementation first
function add(a: number, b: number): number {
  return a + b; // Simple, direct
}

// ❌ BAD: Over-engineering in green phase
function add(a: number, b: number): number {
  // Premature optimization
  const result = Number((a + b).toPrecision(15));
  if (isNaN(result)) {
    throw new Error('Invalid result');
  }
  return result;
}
```

**Green Phase Checklist:**
- [ ] Minimal changes made to production code
- [ ] Test passes
- [ ] No additional features added beyond test requirements
- [ ] Code is simple and direct
- [ ] No refactoring done yet (that's next phase)

**Phase 3: ♻️ REFACTOR - Improve the Code**

**Principles:**
- Clean up the code while keeping tests green
- Improve design, remove duplication, enhance readability
- Apply design patterns and principles
- Ensure no functionality changes

**Best Practices:**
```typescript
// After green phase, refactor while keeping tests passing

// ❌ BEFORE: Duplicated logic
function calculateTotal(price: number, quantity: number, tax: number): number {
  const subtotal = price * quantity;
  const taxAmount = subtotal * (tax / 100);
  return subtotal + taxAmount;
}

function calculateDiscountTotal(price: number, quantity: number, tax: number, discount: number): number {
  const subtotal = price * quantity;
  const taxAmount = subtotal * (tax / 100);
  const discountAmount = subtotal * (discount / 100);
  return subtotal + taxAmount - discountAmount;
}

// ✅ AFTER: Refactored with extracted logic
function calculateSubtotal(price: number, quantity: number): number {
  return price * quantity;
}

function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

function calculateTotal(price: number, quantity: number, tax: number): number {
  const subtotal = calculateSubtotal(price, quantity);
  return subtotal + calculateTax(subtotal, tax);
}

function calculateDiscountTotal(price: number, quantity: number, tax: number, discount: number): number {
  const subtotal = calculateSubtotal(price, quantity);
  return subtotal + calculateTax(subtotal, tax) - (subtotal * discount / 100);
}
```

**Refactor Phase Checklist:**
- [ ] All tests still pass (green maintained)
- [ ] Code is cleaner and more maintainable
- [ ] Duplication removed
- [ ] Meaningful names used
- [ ] No behavior changes
- [ ] Performance considerations addressed (if needed)

### TDD Cycle Timing and Rhythm

**Optimal Cycle Duration:**
- **Target:** 2-5 minutes per cycle
- **Maximum:** 10-15 minutes for complex features
- **Warning Sign:** If cycle takes >30 minutes, test is too large

**Keeping Cycles Short:**
```typescript
// ❌ BAD: Too much logic in one cycle
it('should process payment with multiple items, discounts, tax, and shipping', () => {
  // 50+ lines of test setup
  // Testing too much at once
})

// ✅ GOOD: Small, focused tests
it('should calculate subtotal for multiple items', () => {
  // 5-10 lines, focused
})

it('should apply percentage discount', () => {
  // 5-10 lines, focused
})

it('should calculate tax based on location', () => {
  // 5-10 lines, focused
})
```

### TDD Variations

**Classic TDD:**
1. Write test
2. Write implementation
3. Refactor

**Test-First Development (simplified):**
1. Write test
2. Write implementation
3. (Refactor later or implicitly)

**Test-Last Development (NOT TDD):**
1. Write implementation
2. Write tests
3. (Rarely refactor)

**Recommended:** Classic TDD for new features, Test-First for critical paths.

---

## The Testing Pyramid: Unit vs Integration vs E2E

### The Testing Pyramid Model

**Source:** Martin Fowler - "The Practical Test Pyramid"
https://martinfowler.com/articles/practical-test-pyramid.html#test-pyramid

```
         ▲
        /E\        E2E Tests (few, slow, expensive)
       /E2E\
      /-----\
     /Integ\      Integration Tests (moderate, medium speed)
    /ration \
   /---------\
  /   Unit   \    Unit Tests (many, fast, cheap)
 /-----------\
```

### Recommended Test Ratios

**Ideal Pyramid Distribution:**
- **Unit Tests:** 70-80% of total tests
- **Integration Tests:** 15-20% of total tests
- **E2E Tests:** 5-10% of total tests

**Google's Testing Approach (from "How Google Tests Software"):**
- **Small Tests (Unit):** ~70% - Focus on single functions/classes
- **Medium Tests (Integration):** ~20% - Focus on interactions between components
- **Large Tests (E2E):** ~10% - Focus on critical user paths

**Performance Characteristics:**
| Test Type | Execution Time | Cost to Maintain | Feedback Speed | Failure Isolation |
|-----------|---------------|------------------|----------------|-------------------|
| Unit      | milliseconds  | Low              | Immediate      | Easy              |
| Integration| seconds      | Medium           | Slow           | Medium            |
| E2E       | minutes       | High             | Very Slow      | Hard              |

### Unit Tests: Foundation of the Pyramid

**Purpose:** Test individual functions and classes in isolation

**Characteristics:**
- Fast (milliseconds)
- No external dependencies (mocked)
- Focus on business logic
- Test edge cases and boundary conditions

**TypeScript/Node.js Example:**
```typescript
// src/utils/calculator.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}

// tests/unit/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { Calculator } from '@/utils/calculator';

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      const calculator = new Calculator();
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      const calculator = new Calculator();
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    it('should handle zero', () => {
      const calculator = new Calculator();
      expect(calculator.add(5, 0)).toBe(5);
    });

    it('should handle decimal numbers', () => {
      const calculator = new Calculator();
      expect(calculator.add(0.1, 0.2)).toBeCloseTo(0.3, 1);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      const calculator = new Calculator();
      expect(calculator.divide(10, 2)).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      const calculator = new Calculator();
      expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
    });
  });
});
```

**Unit Test Best Practices:**
- [ ] Test one thing at a time
- [ ] Use descriptive names that explain behavior
- [ ] Mock external dependencies
- [ ] Test edge cases (null, undefined, empty, boundaries)
- [ ] Keep tests fast (<100ms each)
- [ ] Run tests on every save (watch mode)

### Integration Tests: Middle Layer

**Purpose:** Test interactions between components

**Characteristics:**
- Medium speed (seconds)
- Real dependencies (database, API, file system)
- Focus on integration points
- Test contracts and protocols

**TypeScript/Node.js Example:**
```typescript
// tests/integration/session-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '@/core/session-manager';
import { rmSync, existsSync } from 'node:fs';

describe('SessionManager Integration', () => {
  let sessionManager: SessionManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = `/tmp/test-session-${Date.now()}`;
    sessionManager = new SessionManager(tempDir);
  });

  afterEach(() => {
    // Clean up real file system
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create session directory structure', async () => {
    const session = await sessionManager.createSession('/path/to/prd.md');

    // Verify real file system operations
    expect(existsSync(`${session.path}/architecture`)).toBe(true);
    expect(existsSync(`${session.path}/prps`)).toBe(true);
    expect(existsSync(`${session.path}/prd_snapshot.md`)).toBe(true);
  });

  it('should persist and load session state', async () => {
    const created = await sessionManager.createSession('/path/to/prd.md');

    // Create new instance to test persistence
    const newManager = new SessionManager(tempDir);
    const loaded = await newManager.loadSession(created.id);

    expect(loaded.id).toBe(created.id);
    expect(loaded.prdHash).toBe(created.prdHash);
  });
});
```

**Integration Test Best Practices:**
- [ ] Test real interactions between components
- [ ] Use real databases/services (or test containers)
- [ ] Clean up resources in afterEach
- [ ] Test error scenarios (database failures, network timeouts)
- [ ] Run before commit (not on every save)
- [ ] Keep execution time under 10 seconds

### E2E Tests: Top of Pyramid

**Purpose:** Test critical user journeys through the entire system

**Characteristics:**
- Slow (minutes)
- Real application and real infrastructure
- Focus on user workflows
- Test "happy paths" and critical business flows

**When to Write E2E Tests:**
- Critical business workflows (checkout, authentication)
- Complex multi-system interactions
- User acceptance testing
- Regression prevention for high-risk areas

**E2E Test Example (Playwright):**
```typescript
// tests/e2e/user-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration and Login Flow', () => {
  test('should allow user to register and login', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3000');

    // Click register
    await page.click('text=Register');

    // Fill registration form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verify successful registration
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Logout
    await page.click('text=Logout');

    // Login with credentials
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

**E2E Test Best Practices:**
- [ ] Test only critical user journeys
- [ ] Keep tests independent
- [ ] Use Page Object Model for maintainability
- [ ] Run in CI/CD pipeline (not locally)
- [ ] Keep tests stable (avoid flakiness)
- [ ] Limit to <20 E2E tests for most applications

### The Testing Trophy (Kent C. Dodds)

**Source:** https://kentcdodds.com/blog/write-tests

```
         🏆
        /E\        End-to-End (smallest portion)
       /E2E\
      /-----\
     /Integ\      Integration (medium portion)
    /ration \
   /---------\
  /   Unit   \    Unit (largest portion, but more selective)
 /-----------\
```

**Key Differences from Traditional Pyramid:**
- Fewer unit tests (only test complex logic, not simple components)
- More integration tests (test user interactions)
- Minimal E2E tests (only critical paths)

---

## TypeScript/Node.js Testing Best Practices

### Framework Selection

**Vitest (Recommended for New Projects):**
- Native ESM support
- Faster than Jest (using Vite)
- Jest-compatible API
- Better TypeScript support
- Watch mode with instant feedback

**Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
```

**Jest (Legacy Projects):**
- Mature ecosystem
- Wide community adoption
- Good migration path from Vitest

### TypeScript-Specific Testing Patterns

**1. Type-Safe Test Factories**

```typescript
// tests/factories/session-factory.ts
import type { Session } from '@/core/models';

export function createSession(overrides?: Partial<Session>): Session {
  return {
    id: 'test-session-id',
    path: '/tmp/test-session',
    prdPath: '/tmp/test-session/prd.md',
    prdHash: 'abc123def456',
    createdAt: Date.now(),
    status: 'Planned',
    ...overrides,
  };
}

// tests/unit/session.test.ts
import { createSession } from '../factories/session-factory';

describe('Session', () => {
  it('should accept custom overrides', () => {
    const session = createSession({ status: 'InProgress' });
    expect(session.status).toBe('InProgress');
  });
});
```

**2. Type Guards in Tests**

```typescript
// tests/utils/type-guards.ts
export function isSession(obj: unknown): obj is Session {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'path' in obj &&
    'prdHash' in obj
  );
}

// tests/unit/session.test.ts
import { isSession } from '../utils/type-guards';

it('should create valid session', () => {
  const session = createSession();
  expect(isSession(session)).toBe(true);
});
```

**3. Generic Test Helpers**

```typescript
// tests/utils/test-helpers.ts
export function testAsyncError<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<void> {
  return expect(fn).rejects.toThrow(errorMessage);
}

// tests/unit/session.test.ts
import { testAsyncError } from '../utils/test-helpers';

it('should throw on invalid session ID', async () => {
  await testAsyncError(
    () => sessionManager.loadSession(''),
    'Session ID cannot be empty'
  );
});
```

### Async Testing Patterns

**Testing Promises:**
```typescript
// ✅ GOOD: Use async/await
it('should load session asynchronously', async () => {
  const session = await sessionManager.loadSession('session-id');
  expect(session).toBeDefined();
});

// ✅ GOOD: Test promise rejection
it('should throw error for invalid session', async () => {
  await expect(
    sessionManager.loadSession('invalid-id')
  ).rejects.toThrow('Session not found');
});

// ❌ BAD: Not using async/await
it('should load session', () => {
  sessionManager.loadSession('session-id').then(session => {
    expect(session).toBeDefined(); // Test might finish before this runs
  });
});
```

**Testing Callbacks:**
```typescript
it('should call callback when session is created', (done) => {
  const callback = (session: Session) => {
    expect(session.id).toBeDefined();
    done(); // Signal test completion
  };

  sessionManager.onCreate(callback);
  sessionManager.createSession('/path/to/prd.md');
});
```

**Testing Event Emitters:**
```typescript
it('should emit event when session changes', async () => {
  const eventPromise = new Promise<Session>(resolve => {
    sessionManager.once('updated', resolve);
  });

  await sessionManager.updateSession('session-id', { status: 'InProgress' });

  const updatedSession = await eventPromise;
  expect(updatedSession.status).toBe('InProgress');
});
```

### Mocking External Dependencies

**Mocking File System:**
```typescript
import { vi } from 'vitest';
import { promises as fs } from 'node:fs';

vi.mock('node:fs/promises');

describe('SessionManager with mocked file system', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read PRD file', async () => {
    const mockContent = '# Test PRD';
    vi.mocked(fs.readFile).mockResolvedValue(mockContent);

    const content = await fs.readFile('/path/to/prd.md', 'utf-8');
    expect(content).toBe(mockContent);
    expect(fs.readFile).toHaveBeenCalledWith('/path/to/prd.md', 'utf-8');
  });
});
```

**Mocking HTTP Requests:**
```typescript
import { vi } from 'vitest';

vi.mock('node:https');

describe('API Client', () => {
  it('should fetch data from API', async () => {
    const mockData = { result: 'success' };

    // Mock the https.get function
    vi.mocked(https.get).mockImplementation((url, callback) => {
      const mockResponse = {
        on: vi.fn(),
        statusCode: 200,
      } as any;

      callback(mockResponse);
      return {} as any;
    });

    const result = await apiClient.fetchData('/endpoint');
    expect(result).toEqual(mockData);
  });
});
```

**Mocking Environment Variables:**
```typescript
import { vi } from 'vitest';

describe('Config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should use production API URL', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(config.apiUrl).toBe('https://api.example.com');
  });

  it('should use development API URL', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(config.apiUrl).toBe('http://localhost:3000');
  });
});
```

### Testing with Test Containers (Database)

```typescript
import { GenericContainer } from 'testcontainers';
import { describe, it, beforeAll, afterAll } from 'vitest';

describe('Database Integration Tests', () => {
  let container: GenericContainer;
  let connectionString: string;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new GenericContainer('postgres:15')
      .withExposedPorts(5432)
      .withEnvironment({
        POSTGRES_DB: 'testdb',
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpass',
      })
      .start();

    const port = container.getMappedPort(5432);
    connectionString = `postgresql://testuser:testpass@localhost:${port}/testdb`;
  }, 30000);

  afterAll(async () => {
    await container.stop();
  });

  it('should save session to database', async () => {
    const db = new Database(connectionString);
    const session = createSession();

    await db.saveSession(session);
    const loaded = await db.loadSession(session.id);

    expect(loaded).toEqual(session);
  });
});
```

---

## 100% Coverage Strategies: When It Makes Sense

### Understanding Code Coverage

**Types of Coverage:**
- **Statement Coverage:** Percentage of statements executed
- **Branch Coverage:** Percentage of decision branches executed
- **Function Coverage:** Percentage of functions called
- **Line Coverage:** Percentage of lines executed (similar to statement)

**What 100% Coverage Means:**
- Every line of code is executed at least once
- Every branch (if/else) is tested in both directions
- Every function is called with some input

**What 100% Coverage Does NOT Mean:**
- No bugs
- Good tests
- Correct logic
- User scenarios covered

### When 100% Coverage Makes Sense

**✅ Good Candidates for 100% Coverage:**

1. **Critical Business Logic**
   ```typescript
   // Financial calculations - 100% coverage essential
   export function calculateInterest(
     principal: number,
     rate: number,
     term: number
   ): number {
     if (principal <= 0) throw new Error('Principal must be positive');
     if (rate < 0) throw new Error('Rate cannot be negative');
     if (term <= 0) throw new Error('Term must be positive');

     return principal * Math.pow(1 + rate / 100, term);
   }
   ```

2. **Security-Critical Code**
   ```typescript
   // Authentication - 100% coverage essential
   export function validatePassword(password: string): boolean {
     if (password.length < 8) return false;
     if (!/[A-Z]/.test(password)) return false;
     if (!/[a-z]/.test(password)) return false;
     if (!/[0-9]/.test(password)) return false;
     return true;
   }
   ```

3. **Data Transformation Utilities**
   ```typescript
   // Data parsers - 100% coverage helpful
   export function parseCSV(csv: string): string[][] {
     return csv
       .trim()
       .split('\n')
       .map(line => line.split(','));
   }
   ```

4. **Well-Defined, Stable Modules**
   - Core libraries
   - Utility functions
   - Data structures

**❌ Poor Candidates for 100% Coverage:**

1. **UI Components with Many Variants**
   ```typescript
   // Not worth 100% coverage - high maintenance cost
   export function Button({ variant, size, disabled, children }) {
     // Many combinations of variant/size/disabled
     // Test key paths, not every permutation
   }
   ```

2. **Error Handling for Unlikely Events**
   ```typescript
   // Not worth testing - failure scenario is extremely rare
   export function processData(data: string) {
     try {
       // ... main logic
     } catch (error) {
       // Log and continue - acceptable to have low coverage here
       logger.error(error);
     }
   }
   ```

3. **Third-Party Integration Points**
   ```typescript
   // Not worth 100% coverage - tests become integration tests
   export async function uploadToS3(file: File) {
     const s3 = new AWS.S3();
     // Testing every AWS error scenario is expensive
   }
   ```

### Realistic Coverage Targets

**Industry Standards:**
- **Critical Systems (Medical, Financial):** 90-100%
- **Enterprise Applications:** 80-90%
- **Consumer Web Apps:** 70-80%
- **Startups/MVPs:** 60-70%
- **Prototypes/Proof of Concepts:** 40-60%

**Tiered Coverage Strategy:**
```
src/
├── core/              → 90-100% coverage (critical logic)
├── utils/             → 80-90% coverage (utilities)
├── services/          → 70-80% coverage (business logic)
├── api/               → 70-80% coverage (endpoints)
└── ui/                → 50-70% coverage (presentation)
```

### Coverage Anti-Patterns

**❌ Anti-Pattern 1: Coverage-Driven Development**

```typescript
// Bad: Writing tests just to increase coverage
it('should increase coverage', () => {
  const result = someFunction();
  expect(result).toBeDefined(); // No actual verification
});
```

**❌ Anti-Pattern 2: Coverage Without Quality**

```typescript
// Bad: High coverage, low value
it('should test all branches', () => {
  expect(isValid('')).toBe(false);
  expect(isValid('a')).toBe(false);
  expect(isValid('ab')).toBe(false);
  expect(isValid('abc')).toBe(true);
  // Tests implementation, not behavior
});
```

**✅ Good: Behavior-Driven Coverage**

```typescript
// Good: Tests actual behavior
describe('Password Validation', () => {
  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('short')).toBe(false);
  });

  it('should require uppercase letters', () => {
    expect(validatePassword('lowercase123')).toBe(false);
  });

  it('should accept valid passwords', () => {
    expect(validatePassword('ValidPass123')).toBe(true);
  });
});
```

### Measuring Coverage Effectiveness

**Mutation Testing:**
- Use tools like `stryker-js` or `istanbul-mutation`
- Mutates code and checks if tests catch the bugs
- Better measure than raw coverage

```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core

# Run mutation testing
npx stryker run
```

**Coverage Quality Metrics:**
- **Mutation Score:** Percentage of mutations killed
- **Assertion Density:** Number of assertions per test
- **Test Complexity:** Cyclomatic complexity of test code

---

## Test Naming Conventions

### The "Should" Convention

**Format:** `should <expected outcome> when <state/condition>`

```typescript
describe('SessionManager', () => {
  describe('createSession', () => {
    it('should create session with unique ID when called with valid PRD path', () => {
      // Test implementation
    });

    it('should throw error when PRD path does not exist', () => {
      // Test implementation
    });

    it('should initialize session status to "Planned" when session is created', () => {
      // Test implementation
    });
  });
});
```

### BDD: Given-When-Then Pattern

**Gherkin Syntax:**
```gherkin
GIVEN a user is logged in
WHEN they click the logout button
THEN they should be redirected to the login page
```

**Translated to Tests:**
```typescript
describe('User Authentication', () => {
  describe('Logout', () => {
    it('given user is logged in, when they click logout, then redirect to login page', () => {
      // GIVEN
      const user = createLoggedInUser();

      // WHEN
      auth.logout();

      // THEN
      expect(window.location.href).toBe('/login');
    });
  });
});
```

### AAA: Arrange-Act-Assert Pattern

**Explicit Comments (recommended for beginners):**
```typescript
it('should calculate total with tax', () => {
  // Arrange
  const calculator = new Calculator();
  const price = 100;
  const taxRate = 0.1;

  // Act
  const total = calculator.calculateTotal(price, taxRate);

  // Assert
  expect(total).toBe(110);
});
```

**Implicit (experienced teams):**
```typescript
it('should calculate total with tax', () => {
  const calculator = new Calculator();
  const total = calculator.calculateTotal(100, 0.1);
  expect(total).toBe(110);
});
```

### Naming Comparison Table

| Pattern | Example | Pros | Cons |
|---------|---------|------|------|
| Should | `should add two numbers` | Clear, readable | Can get long |
| Given-When-Then | `given valid input when adding then return sum` | BDD-friendly | Very long |
| AAA | `add_two_numbers_returns_sum` | Structured | Less descriptive |
| Unit Test | `testAddition` | Concise | Lacks clarity |

**Recommended:** Use "should" convention with descriptive context in `describe` blocks.

### Test Structure Best Practices

**Descriptive Test Names:**
```typescript
// ❌ BAD: Vague
it('should work', () => {});
it('test session', () => {});
it('does the thing', () => {});

// ✅ GOOD: Descriptive
it('should create session with unique ID', () => {});
it('should throw error when PRD path is invalid', () => {});
it('should persist session state to disk', () => {});
```

**Nested Describe Blocks:**
```typescript
describe('SessionManager', () => {
  describe('createSession', () => {
    describe('when PRD path is valid', () => {
      it('should create session directory structure', () => {});
      it('should generate unique session ID', () => {});
      it('should calculate PRD hash', () => {});
    });

    describe('when PRD path is invalid', () => {
      it('should throw error with clear message', () => {});
    });

    describe('when session already exists', () => {
      it('should throw error', () => {});
    });
  });
});
```

---

## Test Organization Patterns

### Directory Structure

**Option 1: Co-Location (Recommended)**
```
src/
├── core/
│   ├── session-manager.ts
│   └── session-manager.test.ts
├── utils/
│   ├── calculator.ts
│   └── calculator.test.ts
└── services/
    ├── auth.service.ts
    └── auth.service.test.ts
```

**Option 2: Separate Test Directory**
```
src/
├── core/
│   └── session-manager.ts
├── utils/
│   └── calculator.ts
└── services/
    └── auth.service.ts

tests/
├── unit/
│   ├── core/
│   │   └── session-manager.test.ts
│   ├── utils/
│   │   └── calculator.test.ts
│   └── services/
│       └── auth.service.test.ts
├── integration/
│   └── session-workflow.test.ts
└── e2e/
    └── user-registration.spec.ts
```

**Recommendation:** Co-location for small projects, separate directory for large projects.

### Test File Naming

**Conventions:**
- `*.test.ts` - Vitest/Jest standard
- `*.spec.ts` - Alternative common convention
- `test.ts` - For single test files

**Consistency is Key:**
```typescript
// Choose one and stick with it
calculator.test.ts  // ✅ GOOD
calculator.spec.ts  // ✅ GOOD
calculator_tests.ts // ❌ BAD (unconventional)
```

### Test Organization Patterns

**Pattern 1: One Suite Per Feature**

```typescript
// session-manager.test.ts
describe('SessionManager', () => {
  // All SessionManager tests in one file
  describe('createSession', () => {});
  describe('loadSession', () => {});
  describe('deleteSession', () => {});
});
```

**Pattern 2: Separate Suites for Operations**

```typescript
// session-manager-create.test.ts
describe('SessionManager.createSession', () => {
  // Only creation tests
});

// session-manager-load.test.ts
describe('SessionManager.loadSession', () => {
  // Only loading tests
});
```

**Pattern 3: Context-Based Organization**

```typescript
describe('SessionManager', () => {
  describe('with valid PRD', () => {
    describe('createSession', () => {});
    describe('loadSession', () => {});
  });

  describe('with invalid PRD', () => {
    describe('createSession', () => {});
    describe('loadSession', () => {});
  });
});
```

**Recommendation:** Pattern 1 for simple modules, Pattern 3 for complex stateful systems.

### Shared Test Fixtures

**Fixture Factory Pattern:**
```typescript
// tests/fixtures/session-fixture.ts
export class SessionFixture {
  private static sessions: Map<string, Session> = new Map();

  static create(overrides?: Partial<Session>): Session {
    const session: Session = {
      id: `session-${this.sessions.size + 1}`,
      path: `/tmp/session-${this.sessions.size + 1}`,
      prdPath: '/path/to/prd.md',
      prdHash: 'abc123',
      createdAt: Date.now(),
      status: 'Planned',
      ...overrides,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  static reset() {
    this.sessions.clear();
  }
}

// tests/session.test.ts
import { SessionFixture } from './fixtures/session-fixture';

afterEach(() => {
  SessionFixture.reset();
});

it('should create session', () => {
  const session = SessionFixture.create();
  expect(session.id).toBeDefined();
});
```

### Test Data Builders

```typescript
// tests/builders/session.builder.ts
export class SessionBuilder {
  private session: Partial<Session> = {
    status: 'Planned',
    createdAt: Date.now(),
  };

  withId(id: string): SessionBuilder {
    this.session.id = id;
    return this;
  }

  withPath(path: string): SessionBuilder {
    this.session.path = path;
    return this;
  }

  withStatus(status: SessionStatus): SessionBuilder {
    this.session.status = status;
    return this;
  }

  build(): Session {
    return {
      id: this.session.id || 'default-id',
      path: this.session.path || '/default/path',
      prdPath: this.session.prdPath || '/default/prd.md',
      prdHash: this.session.prdHash || 'default-hash',
      createdAt: this.session.createdAt || Date.now(),
      status: this.session.status || 'Planned',
    };
  }
}

// Usage
const session = new SessionBuilder()
  .withId('test-id')
  .withStatus('InProgress')
  .build();
```

---

## Common Testing Anti-Patterns to Avoid

### Anti-Pattern 1: Testing Implementation Details

**❌ Bad:**
```typescript
it('should set internal property', () => {
  const session = new Session();
  session['internalProperty'] = 'value';
  expect(session['internalProperty']).toBe('value');
});

it('should call private method', () => {
  const manager = new SessionManager();
  const spy = vi.spyOn(manager, 'privateMethod' as any);
  manager.publicMethod();
  expect(spy).toHaveBeenCalled();
});
```

**✅ Good:**
```typescript
it('should expose computed value through public API', () => {
  const session = new Session();
  const value = session.getComputedValue();
  expect(value).toBe('expected');
});

it('should update state when public method is called', () => {
  const manager = new SessionManager();
  manager.publicMethod();
  expect(manager.getState()).toEqual(expectedState);
});
```

**Why:** Implementation details change; behavior should remain stable.

### Anti-Pattern 2: Over-Mocking

**❌ Bad:**
```typescript
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  // ... 20 more mocks
}));
```

**✅ Good:**
```typescript
// Mock only what you need to control
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('test content'),
}));

// Use real file system for the rest
```

**Why:** Over-mocked tests are brittle and don't test real interactions.

### Anti-Pattern 3: Brittle Assertions

**❌ Bad:**
```typescript
it('should have exactly 5 sessions', () => {
  expect(sessions.length).toBe(5); // Breaks when adding tests
});

it('should match exact object', () => {
  expect(result).toEqual({
    id: '123',
    name: 'Test',
    createdAt: 1234567890, // Changes every run
  });
});
```

**✅ Good:**
```typescript
it('should have at least one session', () => {
  expect(sessions.length).toBeGreaterThanOrEqual(1);
});

it('should have expected structure', () => {
  expect(result).toMatchObject({
    id: expect.any(String),
    name: 'Test',
    createdAt: expect.any(Number),
  });
});
```

**Why:** Tests should be resilient to unrelated changes.

### Anti-Pattern 4: Testing Multiple Behaviors

**❌ Bad:**
```typescript
it('should create session, update status, and add artifacts', async () => {
  const session = await createSession();
  await updateStatus(session.id);
  await addArtifact(session.id);
  // What are we actually testing?
});
```

**✅ Good:**
```typescript
it('should create session with valid structure', async () => {
  const session = await createSession();
  expect(session).toHaveProperty('id');
});

it('should update session status', async () => {
  const session = await createSession();
  await updateStatus(session.id);
  const updated = await loadSession(session.id);
  expect(updated.status).toBe('Updated');
});
```

**Why:** One behavior per test makes failures clear and debugging easy.

### Anti-Pattern 5: Ignoring Async Errors

**❌ Bad:**
```typescript
it('should handle error', async () => {
  await sessionManager.loadSession('invalid');
  // Missing await/expect for error
});

it('should handle rejection', () => {
  sessionManager.loadSession('invalid').catch(() => {
    // Test might pass even if no error thrown
  });
});
```

**✅ Good:**
```typescript
it('should throw error for invalid session', async () => {
  await expect(
    sessionManager.loadSession('invalid')
  ).rejects.toThrow('Session not found');
});
```

**Why:** Unhandled rejections cause flaky tests and hidden bugs.

### Anti-Pattern 6: Test Interdependence

**❌ Bad:**
```typescript
let sharedSession: Session;

it('should create session', async () => {
  sharedSession = await createSession();
});

it('should update session', async () => {
  // Depends on previous test
  await updateStatus(sharedSession.id);
});
```

**✅ Good:**
```typescript
it('should update session', async () => {
  const session = await createSession(); // Independent
  await updateStatus(session.id);
  const updated = await loadSession(session.id);
  expect(updated.status).toBe('Updated');
});
```

**Why:** Tests should run in any order and be independent.

### Anti-Pattern 7: Sleeps and Waits

**❌ Bad:**
```typescript
it('should process data', async () => {
  await processData();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Flaky!
  expect(result).toBe('done');
});
```

**✅ Good:**
```typescript
it('should process data', async () => {
  const promise = processData();
  await promise; // Wait for actual completion
  expect(result).toBe('done');
});
```

**Why:** Sleeps make tests slow and flaky.

### Anti-Pattern 8: Testing Framework or Library Code

**❌ Bad:**
```typescript
it('should call array.map', () => {
  const numbers = [1, 2, 3];
  const mapSpy = vi.spyOn(Array.prototype, 'map');
  numbers.map(x => x * 2);
  expect(mapSpy).toHaveBeenCalled();
});
```

**✅ Good:**
```typescript
it('should double all numbers', () => {
  const numbers = [1, 2, 3];
  const result = doubleAll(numbers);
  expect(result).toEqual([2, 4, 6]);
});
```

**Why:** Don't test well-tested libraries; focus on your code.

---

## Implementation Checklist

### Phase 1: Foundation Setup

- [ ] **Framework Selection**
  - [ ] Choose Vitest (recommended) or Jest
  - [ ] Install and configure test runner
  - [ ] Set up TypeScript configuration
  - [ ] Configure coverage thresholds

- [ ] **Environment Setup**
  - [ ] Create test configuration file
  - [ ] Set up test environment (node/jsdom)
  - [ ] Configure global test utilities
  - [ ] Set up test database/containers (if needed)

- [ ] **CI/CD Integration**
  - [ ] Add test scripts to package.json
  - [ ] Configure GitHub Actions / CI pipeline
  - [ ] Set up coverage reporting
  - [ ] Configure test result notifications

### Phase 2: TDD Workflow Adoption

- [ ] **Red-Green-Refactor Cycle**
  - [ ] Write failing test before implementation
  - [ ] Confirm test fails meaningfully
  - [ ] Write minimal passing code
  - [ ] Refactor while tests pass
  - [ ] Keep cycles under 5 minutes

- [ ] **Team Training**
  - [ ] Train team on TDD principles
  - [ ] Establish pair programming practices
  - [ ] Create TDD coding standards
  - [ ] Set up code review guidelines

### Phase 3: Testing Pyramid Implementation

- [ ] **Unit Tests (70-80%)**
  - [ ] Test all business logic
  - [ ] Test edge cases and boundaries
  - [ ] Mock external dependencies
  - [ ] Keep tests fast (<100ms each)

- [ ] **Integration Tests (15-20%)**
  - [ ] Test component interactions
  - [ ] Test database operations
  - [ ] Test API integrations
  - [ ] Use test containers for services

- [ ] **E2E Tests (5-10%)**
  - [ ] Test critical user paths
  - [ ] Test authentication flows
  - [ ] Test payment/checkout flows
  - [ ] Limit to essential scenarios

### Phase 4: Code Coverage Strategy

- [ ] **Coverage Targets**
  - [ ] Set tiered coverage goals (core vs ui)
  - [ ] Focus on critical business logic
  - [ ] Prioritize security-sensitive code
  - [ ] Document coverage exceptions

- [ ] **Quality Metrics**
  - [ ] Set up mutation testing
  - [ ] Monitor assertion density
  - [ ] Track test complexity
  - [ ] Measure defect escape rate

### Phase 5: Test Organization

- [ ] **Directory Structure**
  - [ ] Choose co-location or separate directory
  - [ ] Organize by layer (unit/integration/e2e)
  - [ ] Set up shared fixtures
  - [ ] Create test data builders

- [ ] **Naming Conventions**
  - [ ] Standardize on "should" convention
  - [ ] Use nested describe blocks
  - [ ] Apply AAA pattern consistently
  - [ ] Document naming guidelines

### Phase 6: Anti-Pattern Prevention

- [ ] **Code Review Guidelines**
  - [ ] Check for implementation testing
  - [ ] Identify over-mocking
  - [ ] Catch brittle assertions
  - [ ] Flag test interdependence

- [ ] **Regular Audits**
  - [ ] Review slow tests quarterly
  - [ ] Remove flaky tests immediately
  - [ ] Consolidate duplicate tests
  - [ ] Update test documentation

---

## Quick Reference

### TDD Cycle Summary
```
🔴 RED   → Write failing test (2-5 min)
🟢 GREEN → Write minimal code to pass (2-5 min)
♻️ REFACTOR → Clean up code (2-5 min)
```

### Testing Pyramid Ratios
```
Unit:         ████████████████████████████████████████████ 70-80%
Integration:  ██████████████ 15-20%
E2E:          ███ 5-10%
```

### Coverage Targets by Layer
```
Core/Business Logic: 90-100%
Utilities:           80-90%
Services:            70-80%
API:                 70-80%
UI/Components:       50-70%
```

### Test Naming Template
```
it('should <expected outcome> when <condition>', () => {
  // Arrange
  // Act
  // Assert
});
```

### Common Anti-Patterns to Avoid
1. Testing implementation details
2. Over-mocking dependencies
3. Brittle assertions
4. Multiple behaviors per test
5. Ignoring async errors
6. Test interdependence
7. Sleeps and arbitrary waits
8. Testing framework code

---

**Document Status:** Complete
**Next Review:** 2026-02-01
**Maintained By:** P2.M2.T2.S3 Research Team

---

## Authoritative Source URLs (for Reference)

**TDD Fundamentals:**
- Martin Fowler - Test Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
- Kent Beck - TDD Origin: https://medium.com/@kentbeck_7670/test-driven-development-1d9ac0e1f4c6
- Google Testing Blog: https://testing.googleblog.com/

**TypeScript/Node.js Testing:**
- Vitest Documentation: https://vitest.dev/guide/
- Jest Documentation: https://jestjs.io/docs/getting-started
- Testing JavaScript: https://testingjavascript.com/

**Coverage & Quality:**
- Martin Fowler on Coverage: https://martinfowler.com/bliki/TestCoverage.html
- 100% Coverage Debate: https://medium.com/javascript-scene/100-test-coverage-5a5519d30635

**Testing Patterns:**
- xUnit Test Patterns: http://xunitpatterns.com/
- Given-When-Then (Cucumber): https://cucumber.io/docs/gherkin/reference/
- Arrange-Act-Assert: https://wiki.c2.com/?ArrangeActAssert

**Anti-Patterns:**
- Test Smells: http://xunitpatterns.com/Test%20Smells.html
- Kent C. Dodds on Testing Mistakes: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
