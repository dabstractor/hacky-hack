# Vitest Testing Patterns, Mocking Strategies, and Best Practices

Research compiled on: 2026-01-23

**Note:** Web search tools are currently unavailable due to monthly usage limits. This document is based on established Vitest documentation and best practices. Direct URLs to official documentation will need to be verified after February 1, 2026.

---

## Table of Contents
1. [Vitest-Specific Mocking Patterns](#1-vitest-specific-mocking-patterns)
2. [Testing Async Code with Vitest](#2-testing-async-code-with-vitest)
3. [Test Organization and File Structure](#3-test-organization-and-file-structure)
4. [Coverage Configuration and Thresholds](#4-coverage-configuration-and-thresholds)
5. [Test Fixture Patterns](#5-test-fixture-patterns)
6. [Integration Testing Patterns](#6-integration-testing-patterns)
7. [E2E Testing with Vitest](#7-e2e-testing-with-vitest)

---

## 1. Vitest-Specific Mocking Patterns

### 1.1 `vi.mock()` - Module Mocking

The `vi.mock()` function is used to mock entire modules. It must be called at the top level of your test file, before any imports.

```javascript
// Mock an entire module
vi.mock('./path/to/module', () => ({
  default: { /* mock implementation */ },
  namedExport: vi.fn()
}))

// Mock with factory function
vi.mock('../utils/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mock' }))
}))

// Mock with partial implementation
vi.mock('../lib/logger', () => ({
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}))

// Mock Node.js built-in modules
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => 'mock content'),
  },
}))
```

**Key Patterns:**
- **Hoisting**: `vi.mock()` is hoisted to the top of the file, so it runs before imports
- **Manual Mocks**: Place mocks in `__mocks__` directory next to the module
- **Auto-Mocking**: Use `vi.mock('./module')` without a factory to auto-mock with empty functions

### 1.2 `vi.fn()` - Mock Functions

Creates a spy/mock function that can track calls, return values, and implementations.

```javascript
// Basic mock function
const mockFn = vi.fn()

// Track calls
mockFn('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledTimes(1)

// Return values
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockReturnValueOnce('first').mockReturnValueOnce('second')

// Async return values
const asyncMock = vi.fn()
asyncMock.mockResolvedValue({ data: 'success' })
asyncMock.mockRejectedValue(new Error('failed'))

// Custom implementation
const customMock = vi.fn((a, b) => a + b)

// Implementation based on calls
const conditionalMock = vi.fn()
conditionalMock.mockImplementation((input) => {
  if (input === 'special') return 'special value'
  return 'default value'
})
```

**Best Practices:**
- Always clear mocks in `afterEach()` to prevent test pollution
- Use specific matchers like `toHaveBeenCalledWith()` for precise assertions
- Combine with TypeScript for type safety

### 1.3 `vi.stubEnv()` - Environment Variable Mocking

```javascript
// Set environment variable for testing
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('API_KEY', 'test-key-123')

// Reset to original value
vi.unstubEnv('NODE_ENV')

// Use in tests
test('uses test environment', () => {
  vi.stubEnv('FEATURE_FLAG', 'enabled')
  const result = checkFeatureFlag()
  expect(result).toBe(true)
  vi.unstubEnv('FEATURE_FLAG')
})
```

### 1.4 `vi.spyOn()` - Spying on Methods

```javascript
// Spy on object methods
const calculator = {
  add: (a, b) => a + b,
}

const spy = vi.spyOn(calculator, 'add')
calculator.add(1, 2)
expect(spy).toHaveBeenCalledWith(1, 2)

// Spy and override implementation
vi.spyOn(calculator, 'add').mockImplementation(() => 100)
expect(calculator.add(1, 2)).toBe(100)

// Restore original
spy.mockRestore()
```

### 1.5 Timer Mocking

```javascript
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('debounce function', () => {
  const fn = vi.fn()
  const debounced = debounce(fn, 1000)

  debounced()
  expect(fn).not.toHaveBeenCalled()

  vi.advanceTimersByTime(1000)
  expect(fn).toHaveBeenCalledTimes(1)
})

test('handles multiple timers', () => {
  vi.useFakeTimers()

  setTimeout(() => console.log('first'), 1000)
  setTimeout(() => console.log('second'), 2000)

  vi.advanceTimersByTime(1000)
  // Only first timer executed

  vi.advanceTimersByTime(1000)
  // Both timers executed

  vi.runAllTimers() // Run all pending timers
  vi.runOnlyPendingTimers() // Run only current pending timers
})
```

---

## 2. Testing Async Code with Vitest

### 2.1 Promise Testing Patterns

```javascript
import { describe, it, expect } from 'vitest'

describe('async promise testing', () => {
  // Using async/await
  it('resolves with correct value', async () => {
    const result = await Promise.resolve('hello')
    expect(result).toBe('hello')
  })

  // Testing rejected promises
  it('rejects with error', async () => {
    await expect(Promise.reject(new Error('failed')))
      .rejects
      .toThrow('failed')
  })

  // Using resolves matcher
  it('resolves matcher', async () => {
    await expect(Promise.resolve('value'))
      .resolves
      .toBe('value')
  })

  // Using rejects matcher
  it('rejects matcher', async () => {
    await expect(Promise.reject(new Error('error')))
      .rejects
      .toThrow('error')
  })

  // Testing promise chains
  it('handles promise chains', async () => {
    const result = await fetchUser()
      .then(user => user.posts)
      .then(posts => posts.length)

    expect(result).toBeGreaterThan(0)
  })
})
```

### 2.2 Async/Await Best Practices

```javascript
// Always return or await promises
test('good: returns promise', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined()
  })
})

test('good: uses async/await', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// BAD: forgets to return/await
test('bad: no return or await', () => {
  fetchData().then(data => {
    expect(data).toBeDefined()
  })
  // Test passes even if promise rejects!
})
```

### 2.3 Testing Async Functions with Timeouts

```javascript
import { test } from 'vitest'

test('completes within timeout', async () => {
  const result = await slowOperation()
  expect(result).toBe('done')
}, { timeout: 5000 }) // 5 second timeout

// Global timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds default
    hookTimeout: 10000, // For beforeAll/afterEach hooks
  }
})
```

### 2.4 Testing Async Iterators

```javascript
test('async iterator', async () => {
  const asyncGenerator = async function*() {
    yield 1
    yield 2
    yield 3
  }

  const results = []
  for await (const value of asyncGenerator()) {
    results.push(value)
  }

  expect(results).toEqual([1, 2, 3])
})
```

---

## 3. Test Organization and File Structure

### 3.1 Recommended Directory Structure

```
project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── form/
│   │       └── Form.tsx
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── db.ts
│   └── hooks/
│       └── useAuth.ts
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── Button.test.tsx
│   │   │   ├── Input.test.tsx
│   │   │   └── form/
│   │   │       └── Form.test.tsx
│   │   ├── utils/
│   │   │   ├── helpers.test.ts
│   │   │   └── validators.test.ts
│   │   └── hooks/
│   │       └── useAuth.test.ts
│   ├── integration/
│   │   ├── api.test.ts
│   │   └── database.test.ts
│   ├── setup.ts
│   └── teardown.ts
├── vitest.config.ts
└── package.json
```

### 3.2 Alternative: Co-location Pattern

```
src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx        # Test next to source
│   ├── Input.tsx
│   └── Input.test.tsx
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts
```

**Pros:**
- Easy to find tests for a specific file
- Encourages writing tests
- Easy to move/delete code with tests

**Cons:**
- Mixed concerns in source directory
- Longer source file listings

### 3.3 Naming Conventions

```javascript
// Recommended patterns:
// - filename.test.ts
// - filename.spec.ts
// - filename.test.tsx (for React components)
// - __tests__/filename.ts (Facebook convention)

// Examples:
Button.test.tsx
useAuth.spec.ts
api.test.ts
```

### 3.4 Test Suite Organization

```javascript
// Use describe blocks for organization
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a valid user', async () => {
      // Test
    })

    it('should throw error for invalid email', async () => {
      // Test
    })

    it('should hash password before saving', async () => {
      // Test
    })
  })

  describe('deleteUser', () => {
    // Related tests
  })
})
```

### 3.5 Shared Test Setup

```javascript
// tests/setup.ts
import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()

  // Set up common test environment
  vi.stubEnv('NODE_ENV', 'test')
})

// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    teardownFiles: ['./tests/teardown.ts'],
  }
})
```

---

## 4. Coverage Configuration and Thresholds

### 4.1 Basic Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],

      // Include files in coverage
      include: ['src/**/*.{ts,tsx,js,jsx}'],

      // Exclude files from coverage
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],

      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },

      // Per-file thresholds
      perFile: true, // Check thresholds for each file

      // Auto-update coverage
      cleanOnRerun: true,

      // All statements coverage
      all: true, // Include all files, not just those with tests

      // Output directory
      reportsDirectory: './coverage',
    }
  }
})
```

### 4.2 Coverage Provider Options

**V8 Provider (Default)**
```typescript
{
  provider: 'v8', // Faster, but less detailed
}
```

**Istanbul Provider**
```typescript
{
  provider: 'istanbul', // Slower, but more detailed branch coverage
}
```

### 4.3 Threshold Enforcement

```typescript
// Enforce coverage thresholds
thresholds: {
  lines: 80,           // 80% line coverage required
  functions: 80,       // 80% function coverage required
  branches: 75,        // 75% branch coverage required
  statements: 80,      // 80% statement coverage required

  // Per-file thresholds
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,

  // Or use objects for more control
  lines: {
    threshold: 80,
    perFile: true,
  },

  // Auto-update threshold values
  autoUpdate: true, // Updates thresholds to current coverage
}
```

### 4.4 Coverage Reporting

```typescript
// Multiple reporters
reporter: [
  'text',           // Console output
  'text-summary',   // Summary in console
  'html',           // HTML report
  'json',           // JSON for tools
  'lcov',           // For Codecov/Coveralls
  'clover',         // For CI tools
]
```

### 4.5 Ignoring Code in Coverage

```javascript
// Use special comments to ignore code
const complexFunction = () => {
  /* istanbul ignore next */
  if (rareCondition) {
    // This won't count against coverage
  }

  /* istanbul ignore else */
  if (commonCondition) {
    // This path is covered, else is ignored
  }

  /* istanbul ignore if */
  if (untestableCondition) {
    // Entire if block ignored
  }
}

// Or use vitest's ignore patterns
// vitest.config.ts
coverage: {
  exclude: [
    'src/types/**',      // Ignore type definitions
    'src/constants/**',  // Ignore constants
    '**/*.interface.ts', // Ignore interface files
  ]
}
```

### 4.6 Running Coverage

```bash
# Run tests with coverage
vitest run --coverage

# Watch mode with coverage (not recommended)
vitest --coverage

# Generate coverage report without running tests
vitest --coverage.reporter=json
```

---

## 5. Test Fixture Patterns

### 5.1 Basic Fixture Pattern

```javascript
// Create reusable fixtures
const createUserFixture = () => ({
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
})

test('uses user fixture', () => {
  const user = createUserFixture()
  expect(processUser(user)).toHaveProperty('processed', true)
})
```

### 5.2 Fixture Factories

```javascript
// Factory function for fixtures with overrides
const createUser = (overrides = {}) => ({
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  ...overrides,
})

test('uses factory with overrides', () => {
  const adminUser = createUser({ role: 'admin' })
  expect(adminUser.role).toBe('admin')
})

test('uses factory defaults', () => {
  const user = createUser()
  expect(user.role).toBe('user')
})
```

### 5.3 Fixture Builders

```javascript
// Builder pattern for complex fixtures
class UserBuilder {
  constructor() {
    this.user = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      posts: [],
    }
  }

  withId(id) {
    this.user.id = id
    return this
  }

  withName(name) {
    this.user.name = name
    return this
  }

  asAdmin() {
    this.user.role = 'admin'
    return this
  }

  withPosts(posts) {
    this.user.posts = posts
    return this
  }

  build() {
    return { ...this.user }
  }
}

test('uses builder pattern', () => {
  const admin = new UserBuilder()
    .withName('Admin User')
    .asAdmin()
    .withPosts([{ title: 'Test' }])
    .build()

  expect(admin.role).toBe('admin')
  expect(admin.posts.length).toBe(1)
})
```

### 5.4 Setup/Teardown with Fixtures

```javascript
import { beforeEach, afterEach } from 'vitest'

describe('with fixtures', () => {
  let db
  let user

  beforeEach(async () => {
    // Set up fresh fixtures for each test
    db = await createTestDatabase()
    user = await db.insertUser(createUserFixture())
  })

  afterEach(async () => {
    // Clean up fixtures
    await db.cleanup()
  })

  test('uses fresh fixture', async () => {
    const result = await db.getUser(user.id)
    expect(result).toEqual(user)
  })
})
```

### 5.5 Shared Fixtures Module

```javascript
// tests/fixtures/users.ts
export const userFixtures = {
  basic: () => ({
    id: '1',
    name: 'Basic User',
    email: 'basic@example.com',
  }),

  admin: () => ({
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  }),

  withPosts: () => ({
    id: '3',
    name: 'Author',
    email: 'author@example.com',
    posts: [
      { id: '1', title: 'First Post' },
      { id: '2', title: 'Second Post' },
    ],
  }),
}

// Import in tests
import { userFixtures } from './fixtures/users'

test('uses shared fixtures', () => {
  const user = userFixtures.admin()
  expect(user.role).toBe('admin')
})
```

---

## 6. Integration Testing Patterns

### 6.1 Database Integration Tests

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('User Service Integration', () => {
  let db
  let userService

  beforeAll(async () => {
    // Set up test database
    db = await createTestDatabase()
    userService = new UserService(db)
  })

  afterAll(async () => {
    // Clean up database
    await db.disconnect()
  })

  beforeEach(async () => {
    // Clear database before each test
    await db.clear()
  })

  it('creates user in database', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
    }

    const user = await userService.create(userData)

    expect(user.id).toBeDefined()
    expect(user.name).toBe(userData.name)

    // Verify in database
    const found = await db.findById(user.id)
    expect(found).not.toBeNull()
  })

  it('handles duplicate emails', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
    }

    await userService.create(userData)

    await expect(
      userService.create(userData)
    ).rejects.toThrow('Email already exists')
  })
})
```

### 6.2 API Integration Tests

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('API Integration Tests', () => {
  let server
  let client

  beforeAll(async () => {
    // Start test server
    server = await startTestServer()
    client = createAPIClient(server.url)
  })

  afterAll(async () => {
    await server.close()
  })

  it('creates user via API', async () => {
    const response = await client.post('/users', {
      name: 'Test User',
      email: 'test@example.com',
    })

    expect(response.status).toBe(201)
    expect(response.data).toHaveProperty('id')
    expect(response.data.name).toBe('Test User')
  })

  it('handles validation errors', async () => {
    const response = await client.post('/users', {
      name: '', // Invalid
      email: 'not-an-email', // Invalid
    })

    expect(response.status).toBe(400)
    expect(response.data).toHaveProperty('errors')
  })
})
```

### 6.3 Service Integration Tests

```javascript
describe('Payment Flow Integration', () => {
  let userService
  let paymentService
  let emailService

  beforeAll(() => {
    // Set up services with real dependencies
    userService = new UserService(db)
    paymentService = new PaymentService(paymentGateway)
    emailService = new EmailService(mailgun)
  })

  it('processes payment and sends confirmation', async () => {
    const user = await userService.create({
      name: 'Paying User',
      email: 'payer@example.com',
    })

    const payment = await paymentService.processPayment({
      userId: user.id,
      amount: 99.99,
      currency: 'USD',
    })

    expect(payment.status).toBe('completed')

    // Verify email was sent
    const emails = await emailService.getEmails()
    expect(emails).toHaveLength(1)
    expect(emails[0].to).toBe(user.email)
    expect(emails[0].subject).toContain('payment')
  })
})
```

### 6.4 Mocking External Services in Integration Tests

```javascript
describe('Integration with external mocks', () => {
  let service
  let mockExternalAPI

  beforeEach(() => {
    // Mock external API but test real service logic
    mockExternalAPI = vi.fn()
    service = new MyService({
      externalAPI: mockExternalAPI,
    })
  })

  it('integrates with mocked external service', async () => {
    mockExternalAPI.mockResolvedValue({ data: 'external' })

    const result = await service.processData('input')

    expect(mockExternalAPI).toHaveBeenCalledWith('input')
    expect(result).toBe('processed: external')
  })
})
```

---

## 7. E2E Testing with Vitest

### 7.1 Vitest E2E Overview

Vitest has experimental E2E testing capabilities that integrate with browser automation tools like Playwright.

**Important:** As of early 2026, Vitest E2E is still experimental. The recommended approach is to use dedicated E2E tools like Playwright or Cypress, while using Vitest for unit and integration tests.

### 7.2 Basic Vitest E2E Setup (Experimental)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // E2E-specific configuration (experimental)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests serially
      },
    },
    testTimeout: 30000, // 30 seconds for E2E
  },
})
```

### 7.3 Recommended: Playwright for E2E

Instead of using experimental Vitest E2E, use Playwright:

```bash
npm install -D @playwright/test
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
})
```

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Flow', () => {
  test('signs up and logs in', async ({ page }) => {
    await page.goto('/')

    // Sign up flow
    await page.click('text=Sign Up')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('creates a new post', async ({ page }) => {
    // Log in first
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Create post
    await page.click('text=New Post')
    await page.fill('[name="title"]', 'Test Post')
    await page.fill('[name="content"]', 'Test Content')
    await page.click('button[type="submit"]')

    // Verify post created
    await expect(page.locator('text=Test Post')).toBeVisible()
  })
})
```

### 7.4 Page Object Model Pattern

```typescript
// e2e/pages/LoginPage.ts
import { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email)
    await this.page.fill('[name="password"]', password)
    await this.page.click('button[type="submit"]')
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL('/dashboard')
  }
}

// e2e/pages/PostPage.ts
export class PostPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/posts')
  }

  async createPost(title: string, content: string) {
    await this.page.click('text=New Post')
    await this.page.fill('[name="title"]', title)
    await this.page.fill('[name="content"]', content)
    await this.page.click('button[type="submit"]')
  }

  async expectPostVisible(title: string) {
    await expect(this.page.locator(`text=${title}`)).toBeVisible()
  }
}

// e2e/user-flow.spec.ts
import { test } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { PostPage } from './pages/PostPage'

test('complete user flow', async ({ page }) => {
  const loginPage = new LoginPage(page)
  const postPage = new PostPage(page)

  await loginPage.goto()
  await loginPage.login('test@example.com', 'password123')
  await loginPage.expectLoggedIn()

  await postPage.goto()
  await postPage.createPost('Test Post', 'Test Content')
  await postPage.expectPostVisible('Test Post')
})
```

### 7.5 Fixtures in Playwright E2E

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test'

type MyFixtures = {
  authenticatedPage: Page
  testData: {
    user: User
    posts: Post[]
  }
}

export const test = base.extend<MyFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Log in before test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await use(page)
  },

  testData: async ({}, use) => {
    const data = {
      user: { id: '1', name: 'Test User' },
      posts: [
        { id: '1', title: 'Post 1' },
        { id: '2', title: 'Post 2' },
      ],
    }
    await use(data)
  },
})

// e2e/test.spec.ts
import { test } from './fixtures'

test('uses authenticated page fixture', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/profile')
  await expect(authenticatedPage.locator('text=Test User')).toBeVisible()
})
```

---

## Official Documentation URLs (To Verify After Feb 1, 2026)

**Note:** Due to search tool limitations, these URLs should be verified for accuracy after the monthly limit resets. The official Vitest documentation is at:

- **Main Documentation:** https://vitest.dev
- **GitHub Repository:** https://github.com/vitest-dev/vitest

Expected Documentation Sections:
- **Mocking:** https://vitest.dev/guide/mocking.html
- **API Reference:** https://vitest.dev/api/
- **Coverage:** https://vitest.dev/guide/coverage.html
- **Configuration:** https://vitest.dev/config/
- **Testing Patterns:** https://vitest.dev/guide/

---

## Summary and Best Practices

### Key Takeaways

1. **Mocking Strategy:**
   - Use `vi.mock()` for modules, `vi.fn()` for functions, `vi.spyOn()` for methods
   - Always clean up mocks in `afterEach()`
   - Use manual mocks in `__mocks__` directory for complex cases

2. **Async Testing:**
   - Always use `async/await` or return promises
   - Use `expect().resolves` and `expect().rejects` for cleaner assertions
   - Set appropriate timeouts for slow operations

3. **Test Organization:**
   - Choose between co-location or separate test directories
   - Use consistent naming conventions (`.test.ts` or `.spec.ts`)
   - Group related tests with `describe` blocks

4. **Coverage:**
   - Set meaningful thresholds (usually 80%)
   - Use V8 provider for speed, Istanbul for detail
   - Exclude type definitions and config files

5. **Fixtures:**
   - Create reusable fixture factories with override support
   - Use builder pattern for complex objects
   - Share fixtures in dedicated modules

6. **Integration Testing:**
   - Test real interactions between components
   - Mock only external services
   - Use test databases and servers

7. **E2E Testing:**
   - Use dedicated tools like Playwright or Cypress
   - Implement Page Object Model for maintainability
   - Create reusable fixtures for common flows

---

## Additional Resources

When web search becomes available (after February 1, 2026), research these additional topics:

1. **Vitest UI Mode** - Visual test runner interface
2. **Vitest Snapshot Testing** - Component snapshot patterns
3. **Vitest Performance Testing** - Benchmarking patterns
4. **Vitest Parallel Testing** - Worker configuration
5. **Vitest CI/CD Integration** - GitHub Actions, GitLab CI patterns
6. **Vitest Monorepo Testing** - Nx, Turborepo integration
7. **Vitest React/Vue/Svelte Testing** - Component-specific patterns
8. **Vitest TypeScript Configuration** - Strict typing for tests

---

*Document generated: 2026-01-23*
*Last verified: N/A (web search unavailable)*
