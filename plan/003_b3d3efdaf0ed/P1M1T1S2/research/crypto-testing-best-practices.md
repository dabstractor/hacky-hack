# Crypto Testing Best Practices for TypeScript/Vitest

## Summary

Research findings on best practices for testing Node.js crypto operations (SHA-256 hashing) in TypeScript/Vitest projects.

## Node.js Crypto API Reference

### Official Documentation

- **Primary URL**: https://nodejs.org/api/crypto.html#crypto_createhash_algorithm_options
- **Hash Class**: https://nodejs.org/api/crypto.html#class-hash

### Key API Methods

```typescript
import { createHash } from 'crypto';

// Create hash object
const hash = createHash('sha256');

// Update with data
hash.update(data); // data: string | Buffer | TypedArray | DataView

// Get digest
hash.digest('hex'); // Returns 64-character hex string
```

### Supported Encodings

- `'hex'` - 64 hex characters (0-9, a-f)
- `'base64'` - Base64 encoded string
- `'latin1` - Binary string
- Default: Buffer object

## Testing Patterns

### Pattern 1: Real Crypto (Integration Tests)

**Use Case**: Testing actual hash computation behavior

```typescript
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';

describe('SHA-256 Hash Computation', () => {
  it('should compute SHA-256 hash correctly', () => {
    const input = 'test data';
    const hash = createHash('sha256').update(input).digest('hex');

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce deterministic hashes', () => {
    const input = 'deterministic test';
    const hash1 = createHash('sha256').update(input).digest('hex');
    const hash2 = createHash('sha256').update(input).digest('hex');
    const hash3 = createHash('sha256').update(input).digest('hex');

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it('should detect different inputs', () => {
    const hash1 = createHash('sha256').update('input-1').digest('hex');
    const hash2 = createHash('sha256').update('input-2').digest('hex');

    expect(hash1).not.toBe(hash2);
  });

  it('should use first 12 characters for session hash', () => {
    const input = 'test data for session';
    const fullHash = createHash('sha256').update(input).digest('hex');
    const sessionHash = fullHash.slice(0, 12);

    expect(sessionHash).toHaveLength(12);
    expect(sessionHash).toMatch(/^[a-f0-9]{12}$/);
    expect(fullHash).toHaveLength(64);
  });
});
```

### Pattern 2: Full Module Mocking (Unit Tests)

**Use Case**: Unit tests where you want predictable hash values

```typescript
import { vi, describe, it, expect } from 'vitest';

// Mock at top level
vi.mock('node:crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(
        () => '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123'
      ),
    })),
  })),
}));

import { createHash } from 'node:crypto';

describe('Hash Computation with Mocks', () => {
  it('should use mocked hash value', () => {
    const hash = createHash('sha256').update('test').digest('hex');

    expect(hash).toBe(
      '14b9dc2a33c7a1234567890abcdef1234567890abcdef1234567890abcdef123'
    );
    expect(createHash).toHaveBeenCalledWith('sha256');
  });

  it('should chain mock methods correctly', () => {
    const hashObj = createHash('sha256');
    const updated = hashObj.update('data');
    const result = updated.digest('hex');

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
```

### Pattern 3: Spy on Real Implementation

**Use Case**: Verify crypto API usage without mocking behavior

```typescript
import { spyOn } from 'vitest';
import { createHash } from 'node:crypto';

describe('Hash with Spies', () => {
  it('should call createHash with sha256', () => {
    const spy = spyOn(createHash);

    // Call your function that uses createHash
    const hash = createHash('sha256').update('test').digest('hex');

    expect(spy).toHaveBeenCalledWith('sha256');
  });
});
```

### Pattern 4: Hash Change Detection Tests

**Use Case**: Testing hash-based change detection logic

```typescript
describe('Hash-based Change Detection', () => {
  it('should detect content change', () => {
    const originalContent = '# Original PRD';
    const modifiedContent = '# Modified PRD';

    const hash1 = createHash('sha256')
      .update(originalContent)
      .digest('hex')
      .slice(0, 12);
    const hash2 = createHash('sha256')
      .update(modifiedContent)
      .digest('hex')
      .slice(0, 12);

    expect(hash1).not.toBe(hash2);
  });

  it('should not detect change for identical content', () => {
    const content = '# Test PRD';

    const hash1 = createHash('sha256')
      .update(content)
      .digest('hex')
      .slice(0, 12);
    const hash2 = createHash('sha256')
      .update(content)
      .digest('hex')
      .slice(0, 12);

    expect(hash1).toBe(hash2);
  });

  it('should be case-sensitive', () => {
    const hash1 = createHash('sha256')
      .update('Content')
      .digest('hex')
      .slice(0, 12);
    const hash2 = createHash('sha256')
      .update('content')
      .digest('hex')
      .slice(0, 12);

    expect(hash1).not.toBe(hash2);
  });

  it('should detect whitespace changes', () => {
    const hash1 = createHash('sha256')
      .update('content')
      .digest('hex')
      .slice(0, 12);
    const hash2 = createHash('sha256')
      .update('content ')
      .digest('hex')
      .slice(0, 12);

    expect(hash1).not.toBe(hash2);
  });
});
```

## Known Test Vectors

### NIST SHA-256 Test Vectors

Use these for validating hash computation:

```typescript
describe('SHA-256 Test Vectors', () => {
  it('should hash empty string correctly', () => {
    const hash = createHash('sha256').update('').digest('hex');
    expect(hash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('should hash "abc" correctly', () => {
    const hash = createHash('sha256').update('abc').digest('hex');
    expect(hash).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('should hash long message correctly', () => {
    const message = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
    const hash = createHash('sha256').update(message).digest('hex');
    expect(hash).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
    );
  });
});
```

## Common Pitfalls

### Pitfall 1: Not Cleaning Up Mocks

**Problem**: Mocks persist between tests

```typescript
// BAD: No cleanup
describe('Tests', () => {
  vi.mock('crypto', () => ({
    /* mock */
  }));

  it('test 1', () => {
    /* uses mock */
  });
  it('test 2', () => {
    /* still uses mock! */
  });
});

// GOOD: Proper cleanup
describe('Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test 1', () => {
    /* uses mock */
  });
  it('test 2', () => {
    /* restored to real */
  });
});
```

### Pitfall 2: Inconsistent Mock Chaining

**Problem**: Mock doesn't match real API chaining

```typescript
// BAD: Wrong chaining pattern
vi.mock('crypto', () => ({
  createHash: vi.fn().mockReturnValue({
    digest: vi.fn(() => 'hash'), // Missing update()
  }),
}));

// GOOD: Correct chaining pattern
vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'hash'),
    })),
  })),
}));
```

### Pitfall 3: Testing Exact Timing

**Problem**: Timing-dependent tests are flaky

```typescript
// BAD: Exact timing
it('should hash in 5ms', async () => {
  const start = performance.now();
  await hashPRD('test');
  expect(performance.now() - start).toBe(5); // Flaky!
});

// GOOD: Reasonable bounds
it('should hash quickly', async () => {
  const start = performance.now();
  await hashPRD('test');
  expect(performance.now() - start).toBeLessThan(100);
});
```

### Pitfall 4: Ignoring Encoding

**Problem**: Not specifying encoding leads to inconsistent hashes

```typescript
// BAD: No encoding specified
const content = await readFile(prdPath);
const hash = createHash('sha256').update(content).digest('hex');

// GOOD: Explicit UTF-8 encoding
const content = await readFile(prdPath, 'utf-8');
const hash = createHash('sha256').update(content).digest('hex');
```

### Pitfall 5: Only Testing Happy Paths

**Problem**: Missing edge case coverage

```typescript
// GOOD: Comprehensive edge cases
describe('Hash edge cases', () => {
  it('should handle empty string', () => {
    const hash = createHash('sha256').update('').digest('hex');
    expect(hash).toHaveLength(64);
  });

  it('should handle unicode', () => {
    const hash = createHash('sha256').update('你好世界').digest('hex');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle special characters', () => {
    const hash = createHash('sha256').update('\n\t\r').digest('hex');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(1000000);
    const hash = createHash('sha256').update(longString).digest('hex');
    expect(hash).toHaveLength(64);
  });
});
```

## Vitest Configuration

### Mock Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    mock: {
      'node:crypto': {
        createHash: vi.fn(() => ({
          update: vi.fn(() => ({
            digest: vi.fn(() => 'mock-hash-64-chars...'),
          })),
        })),
      },
    },
  },
});
```

### Test Timeout for Crypto Operations

```typescript
describe('Performance Tests', () => {
  it('should hash large file quickly', async () => {
    const largeData = 'x'.repeat(1_000_000);
    const start = Date.now();
    const hash = createHash('sha256').update(largeData).digest('hex');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // 1 second threshold
  }, 10000); // 10 second test timeout
});
```

## Summary of Best Practices

1. **Use Real Crypto**: For integration tests and validation
2. **Mock Crypto**: For unit tests with predictable values
3. **Test Determinism**: Verify same input produces same output
4. **Test Change Detection**: Verify different inputs produce different outputs
5. **Test Edge Cases**: Empty strings, unicode, special characters, large inputs
6. **Clean Up Mocks**: Use `beforeEach`/`afterEach` with `restoreAllMocks`
7. **Specify Encoding**: Always use explicit encoding ('utf-8')
8. **Use Test Vectors**: Validate with known NIST test vectors
9. **Avoid Timing Tests**: Use reasonable bounds instead of exact timing
10. **Document Patterns**: Comment on why certain testing approaches are used

## References

- **Node.js Crypto**: https://nodejs.org/api/crypto.html
- **Vitest Mocking**: https://vitest.dev/api/mock.html
- **Vitest Expect**: https://vitest.dev/api/expect.html
- **SHA-256 Standard**: https://csrc.nist.gov/projects/hash-functions#sha-256
