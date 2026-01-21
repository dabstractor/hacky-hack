# Constant Testing Pattern - Code Examples

**Supplementary Research:** Practical code examples from real-world scenarios

**Date:** 2026-01-15

---

## Table of Contents

1. [Before & After Comparisons](#before--after-comparisons)
2. [Common Testing Scenarios](#common-testing-scenarios)
3. [Framework-Specific Examples](#framework-specific-examples)
4. [Advanced Patterns](#advanced-patterns)

---

## Before & After Comparisons

### Scenario 1: Environment Configuration

#### ❌ Before: Magic Strings

```typescript
// tests/config.test.ts
import { describe, it, expect, vi } from 'vitest';
import { configureEnvironment } from '../src/config.js';

describe('environment configuration', () => {
  it('should set default BASE_URL', () => {
    delete process.env.API_BASE_URL;
    configureEnvironment();

    // ❌ BAD: Magic string that can drift from constant
    expect(process.env.API_BASE_URL).toBe('https://api.example.com');
  });

  it('should return default model', () => {
    expect(getDefaultModel()).toBe('gpt-4'); // ❌ BAD: Magic string
  });
});
```

**Problems:**

- If constant changes, test still passes (false positive)
- No clear relationship to source code
- Hard to refactor
- Violates DRY principle

---

#### ✅ After: Import Constants

```typescript
// tests/config.test.ts
import { describe, it, expect, vi } from 'vitest';
import { configureEnvironment } from '../src/config.js';
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from '../src/constants.js';

describe('environment configuration', () => {
  it('should set BASE_URL to match DEFAULT_BASE_URL constant', () => {
    delete process.env.API_BASE_URL;
    configureEnvironment();

    // ✅ GOOD: Imports constant, single source of truth
    expect(process.env.API_BASE_URL).toBe(DEFAULT_BASE_URL);
  });

  it('should return model matching DEFAULT_MODEL constant', () => {
    // ✅ GOOD: Test fails if constant changes, forcing review
    expect(getDefaultModel()).toBe(DEFAULT_MODEL);
  });
});
```

**Benefits:**

- Test fails if constant changes (catches drift)
- Clear relationship to source code
- Refactor-friendly
- Type-safe with TypeScript
- Self-documenting

---

### Scenario 2: Feature Flag Configuration

#### ❌ Before: Duplicate Literal Values

```typescript
// tests/feature-flags.test.ts
describe('feature flags', () => {
  it('should enable new dashboard by default', () => {
    const config = getConfig();
    expect(config.features.newDashboard).toBe(true); // ❌ BAD
  });

  it('should have beta features disabled', () => {
    const config = getConfig();
    expect(config.features.betaMode).toBe(false); // ❌ BAD
  });

  it('should use correct API version', () => {
    const config = getConfig();
    expect(config.apiVersion).toBe('v2'); // ❌ BAD
  });
});
```

---

#### ✅ After: Import Feature Constants

```typescript
// tests/feature-flags.test.ts
import {
  FEATURE_FLAGS,
  DEFAULT_API_VERSION,
} from '../src/feature-constants.js';

describe('feature flags', () => {
  it('should enable new dashboard matching feature constant', () => {
    const config = getConfig();
    expect(config.features.newDashboard).toBe(FEATURE_FLAGS.NEW_DASHBOARD);
  });

  it('should have beta features matching constant', () => {
    const config = getConfig();
    expect(config.features.betaMode).toBe(FEATURE_FLAGS.BETA_MODE);
  });

  it('should use API version matching constant', () => {
    const config = getConfig();
    expect(config.apiVersion).toBe(DEFAULT_API_VERSION);
  });
});
```

---

### Scenario 3: Timeout and Retry Configuration

#### ❌ Before: Hardcoded Values

```typescript
// tests/api-client.test.ts
describe('API client', () => {
  it('should use correct timeout', () => {
    const client = new ApiClient();
    expect(client.timeout).toBe(5000); // ❌ BAD: Magic number
  });

  it('should retry correct number of times', () => {
    const client = new ApiClient();
    expect(client.maxRetries).toBe(3); // ❌ BAD: Magic number
  });

  it('should use correct backoff delay', () => {
    const client = new ApiClient();
    expect(client.backoffDelay).toBe(1000); // ❌ BAD: Magic number
  });
});
```

---

#### ✅ After: Configuration Constants

```typescript
// tests/api-client.test.ts
import {
  DEFAULT_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_BACKOFF_DELAY,
} from '../src/api/constants.js';

describe('API client', () => {
  it('should use timeout matching DEFAULT_TIMEOUT constant', () => {
    const client = new ApiClient();
    expect(client.timeout).toBe(DEFAULT_TIMEOUT);
  });

  it('should retry count matching DEFAULT_MAX_RETRIES constant', () => {
    const client = new ApiClient();
    expect(client.maxRetries).toBe(DEFAULT_MAX_RETRIES);
  });

  it('should use backoff delay matching constant', () => {
    const client = new ApiClient();
    expect(client.backoffDelay).toBe(DEFAULT_BACKOFF_DELAY);
  });
});
```

---

## Common Testing Scenarios

### Scenario 1: Testing Default Values with Overrides

```typescript
// src/config/constants.ts
export const MODEL_CONFIG = {
  default: 'gpt-4',
  fallback: 'gpt-3.5-turbo',
  maxTokens: 4096,
} as const;

export const ENV_VARS = {
  MODEL_OVERRIDE: 'AI_MODEL_OVERRIDE',
  TOKEN_LIMIT: 'AI_MAX_TOKENS',
} as const;

// tests/config.test.ts
import { MODEL_CONFIG, ENV_VARS } from '../src/config/constants.js';
import { getModelConfig } from '../src/config.js';

describe('model configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('default values', () => {
    it('should use default model from MODEL_CONFIG', () => {
      delete process.env[ENV_VARS.MODEL_OVERRIDE];

      const config = getModelConfig();

      expect(config.model).toBe(MODEL_CONFIG.default);
      expect(config.model).toBe('gpt-4'); // ✅ Also OK to be explicit
    });

    it('should use max tokens from MODEL_CONFIG', () => {
      delete process.env[ENV_VARS.TOKEN_LIMIT];

      const config = getModelConfig();

      expect(config.maxTokens).toBe(MODEL_CONFIG.maxTokens);
    });
  });

  describe('environment overrides', () => {
    it('should use env override when set', () => {
      vi.stubEnv(ENV_VARS.MODEL_OVERRIDE, 'custom-model');

      const config = getModelConfig();

      expect(config.model).toBe('custom-model');
    });

    it('should use token limit from env when set', () => {
      vi.stubEnv(ENV_VARS.TOKEN_LIMIT, '8192');

      const config = getModelConfig();

      expect(config.maxTokens).toBe(8192);
    });
  });
});
```

---

### Scenario 2: Array/Object Constant Validation

```typescript
// src/constants/errors.ts
export const ERROR_CODES = {
  INVALID_INPUT: 'ERR_001',
  NOT_FOUND: 'ERR_002',
  UNAUTHORIZED: 'ERR_003',
  SERVER_ERROR: 'ERR_500',
} as const;

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

// tests/errors.test.ts
import { ERROR_CODES, HTTP_STATUS_CODES } from '../src/constants/errors.js';
import { AppError } from '../src/errors.js';

describe('error constants', () => {
  describe('ERROR_CODES', () => {
    it('should have correct error code values', () => {
      expect(ERROR_CODES.INVALID_INPUT).toBe('ERR_001');
      expect(ERROR_CODES.NOT_FOUND).toBe('ERR_002');
      expect(ERROR_CODES.UNAUTHORIZED).toBe('ERR_003');
      expect(ERROR_CODES.SERVER_ERROR).toBe('ERR_500');
    });

    it('should map error types to correct codes', () => {
      const invalidInputError = new AppError('InvalidInput');
      expect(invalidInputError.code).toBe(ERROR_CODES.INVALID_INPUT);

      const notFoundError = new AppError('NotFound');
      expect(notFoundError.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('HTTP_STATUS_CODES', () => {
    it('should have correct HTTP status values', () => {
      expect(HTTP_STATUS_CODES.OK).toBe(200);
      expect(HTTP_STATUS_CODES.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS_CODES.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS_CODES.SERVER_ERROR).toBe(500);
    });

    it('should map errors to correct HTTP status', () => {
      const notFoundError = new AppError('NotFound');
      expect(notFoundError.httpStatus).toBe(HTTP_STATUS_CODES.NOT_FOUND);

      const unauthorizedError = new AppError('Unauthorized');
      expect(unauthorizedError.httpStatus).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
    });
  });
});
```

---

### Scenario 3: Multi-Environment Configuration

```typescript
// src/config/environments.ts
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

export const ENVIRONMENT_CONFIGS = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    apiUrl: 'http://localhost:3000',
    debug: true,
    logLevel: 'debug',
  },
  [ENVIRONMENTS.STAGING]: {
    apiUrl: 'https://staging.example.com',
    debug: true,
    logLevel: 'info',
  },
  [ENVIRONMENTS.PRODUCTION]: {
    apiUrl: 'https://api.example.com',
    debug: false,
    logLevel: 'warn',
  },
  [ENVIRONMENTS.TEST]: {
    apiUrl: 'http://test.local',
    debug: false,
    logLevel: 'error',
  },
} as const;

// tests/environments.test.ts
import {
  ENVIRONMENTS,
  ENVIRONMENT_CONFIGS,
} from '../src/config/environments.js';
import { getConfigForEnvironment } from '../src/config.js';

describe('environment configuration', () => {
  it('should return development config matching constant', () => {
    const config = getConfigForEnvironment(ENVIRONMENTS.DEVELOPMENT);

    expect(config).toEqual(ENVIRONMENT_CONFIGS[ENVIRONMENTS.DEVELOPMENT]);
    expect(config.apiUrl).toBe('http://localhost:3000');
    expect(config.debug).toBe(true);
  });

  it('should return production config matching constant', () => {
    const config = getConfigForEnvironment(ENVIRONMENTS.PRODUCTION);

    expect(config).toEqual(ENVIRONMENT_CONFIGS[ENVIRONMENTS.PRODUCTION]);
    expect(config.apiUrl).toBe('https://api.example.com');
    expect(config.debug).toBe(false);
  });

  it('should detect current environment from NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', ENVIRONMENTS.PRODUCTION);

    const currentEnv = detectEnvironment();

    expect(currentEnv).toBe(ENVIRONMENTS.PRODUCTION);
    expect(currentEnv).toBe('production');
  });
});
```

---

## Framework-Specific Examples

### Vitest Examples

```typescript
// tests/vitest-example.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { API_CONFIG, TIMEOUT_CONFIG } from '../src/constants.js';
import { ApiClient } from '../src/api-client.js';

describe('ApiClient with constant synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('should initialize with timeout from TIMEOUT_CONFIG', () => {
    const client = new ApiClient();

    expect(client.timeout).toBe(TIMEOUT_CONFIG.DEFAULT);
  });

  it('should use API URL from API_CONFIG', () => {
    delete process.env.API_URL;

    const client = new ApiClient();

    expect(client.baseUrl).toBe(API_CONFIG.DEFAULT_URL);
  });

  it('should override timeout from env var when set', () => {
    vi.stubEnv('API_TIMEOUT', '10000');

    const client = new ApiClient();

    expect(client.timeout).toBe(10000);
  });
});
```

---

### Jest Examples

```typescript
// tests/jest-example.test.ts
import { API_CONFIG, TIMEOUT_CONFIG } from '../src/constants';

describe('ApiClient with constant synchronization', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should initialize with timeout from TIMEOUT_CONFIG', () => {
    const client = new ApiClient();

    expect(client.timeout).toBe(TIMEOUT_CONFIG.DEFAULT);
  });

  it('should use API URL from API_CONFIG', () => {
    delete process.env.API_URL;

    const client = new ApiClient();

    expect(client.baseUrl).toBe(API_CONFIG.DEFAULT_URL);
  });
});
```

---

### React Testing Library Examples

```typescript
// tests/components/Header.test.tsx
import { render, screen } from '@testing-library/react';
import { HEADER_TEXT, LOGO_ALT } from '../src/constants/ui.js';
import { Header } from '../src/components/Header.js';

describe('Header component', () => {
  it('should render title matching HEADER_TEXT constant', () => {
    render(<Header />);

    expect(screen.getByRole('heading')).toHaveTextContent(HEADER_TEXT);
    expect(screen.getByRole('heading')).toHaveTextContent('My App'); // ✅ Also OK
  });

  it('should render logo with alt text matching constant', () => {
    render(<Header />);

    const logo = screen.getByRole('img');
    expect(logo).toHaveAttribute('alt', LOGO_ALT);
  });
});
```

---

## Advanced Patterns

### Pattern 1: Property-Based Testing with Constants

```typescript
import { test } from 'vitest';
import { MODEL_NAMES, MODEL_TIERS } from '../src/constants.js';
import { getModelForTier } from '../src/models.js';

test.each([
  [MODEL_TIERS.OPUS, MODEL_NAMES.OPUS],
  [MODEL_TIERS.SONNET, MODEL_NAMES.SONNET],
  [MODEL_TIERS.HAIKU, MODEL_NAMES.HAIKU],
])(
  'getModelForTier(%s) should return matching constant',
  (tier, expectedModel) => {
    expect(getModelForTier(tier)).toBe(expectedModel);
  }
);
```

---

### Pattern 2: Constant Validation Helper

```typescript
// test/helpers/constant-validator.ts
export function assertMatchesConstant<T>(
  actual: T,
  constant: T,
  constantName: string
): void {
  expect(actual).toBe(constant);
  // Optionally log for debugging
  if (actual !== constant) {
    console.error(
      `Constant mismatch: expected ${constantName} to be ${constant}, got ${actual}`
    );
  }
}

// Usage in tests
import { assertMatchesConstant } from '../test/helpers/constant-validator.js';
import { DEFAULT_TIMEOUT } from '../src/constants.js';

it('should use correct timeout', () => {
  const client = new ApiClient();
  assertMatchesConstant(client.timeout, DEFAULT_TIMEOUT, 'DEFAULT_TIMEOUT');
});
```

---

### Pattern 3: Snapshot + Constant Validation

```typescript
import { CONFIG_DEFAULTS } from '../src/constants.js';
import { getConfig } from '../src/config.js';

describe('configuration', () => {
  it('should match snapshot and constant values', () => {
    const config = getConfig();

    // Snapshot catches unexpected changes
    expect(config).toMatchSnapshot();

    // Constants verify specific critical values
    expect(config.apiUrl).toBe(CONFIG_DEFAULTS.API_URL);
    expect(config.timeout).toBe(CONFIG_DEFAULTS.TIMEOUT);
    expect(config.retryCount).toBe(CONFIG_DEFAULTS.RETRY_COUNT);
  });
});
```

---

### Pattern 4: Enum-Like Constant Testing

```typescript
// src/constants/status.ts
export const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

// tests/status.test.ts
import { STATUS } from '../src/constants/status.js';
import { Task } from '../src/task.js';

describe('Task status constants', () => {
  it('should initialize with PENDING status', () => {
    const task = new Task();

    expect(task.status).toBe(STATUS.PENDING);
    expect(task.status).toBe('pending');
  });

  it('should transition to IN_PROGRESS', () => {
    const task = new Task();
    task.start();

    expect(task.status).toBe(STATUS.IN_PROGRESS);
  });

  it('should complete with COMPLETED status', () => {
    const task = new Task();
    task.start();
    task.complete();

    expect(task.status).toBe(STATUS.COMPLETED);
  });

  it('should fail with FAILED status', () => {
    const task = new Task();
    task.start();
    task.fail(new Error('Test error'));

    expect(task.status).toBe(STATUS.FAILED);
  });
});
```

---

### Pattern 5: Dynamic Constant Validation

```typescript
// test/helpers/validate-constants.ts
import { REQUIRED_ENV_VARS } from '../src/constants.js';

export function validateRequiredEnvVars(): void {
  describe('required environment variables', () => {
    it.each(Object.entries(REQUIRED_ENV_VARS))(
      'should have %s set',
      (_key, envVarName) => {
        expect(process.env[envVarName]).toBeDefined();
        expect(process.env[envVarName]).not.toBe('');
      }
    );
  });
}

// Usage in test suite
import { validateRequiredEnvVars } from '../test/helpers/validate-constants.js';

describe('environment validation', () => {
  validateRequiredEnvVars();
});
```

---

## Summary

### Key Takeaways

1. **Always import constants** in tests rather than using magic strings
2. **Test both defaults and overrides** to ensure comprehensive coverage
3. **Use `as const`** for type-safe constant definitions
4. **Add descriptive test names** that explain the constant relationship
5. **Document with comments** why constant synchronization matters
6. **Use property-based testing** for multiple constant values
7. **Combine with snapshots** for catching unexpected changes
8. **Create test helpers** for common constant validation patterns

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Related:** `constant-testing-patterns.md`
