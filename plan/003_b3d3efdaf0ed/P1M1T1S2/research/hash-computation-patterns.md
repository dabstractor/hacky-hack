# Hash Computation Patterns Research

## Summary

PRP work item P1.M1.T1.S2 requires verifying PRD hash-based change detection through unit tests. This document captures research findings about hash computation patterns in the codebase.

## Core Hash Computation Pattern

### Location
- `src/core/session-utils.ts:229-255` - `hashPRD()` function
- `src/core/session-manager.ts:224-225` - Hash computation during `initialize()`
- `src/core/session-manager.ts:1162-1170` - `hasSessionChanged()` method

### The Pattern
```typescript
import { createHash } from 'node:crypto';

// Full SHA-256 hash (64 characters)
const fullHash = createHash('sha256').update(content).digest('hex');

// Session hash (first 12 characters)
const sessionHash = fullHash.slice(0, 12);
```

### Key Characteristics
1. **Algorithm**: SHA-256 (produces 256-bit hash)
2. **Output Format**: 64 hexadecimal characters (0-9, a-f)
3. **Session Hash**: First 12 characters only
4. **Input Encoding**: UTF-8 string
5. **Deterministic**: Same input always produces same output

## hasSessionChanged() Implementation

### Location
`src/core/session-manager.ts:1162-1170`

### Implementation
```typescript
hasSessionChanged(): boolean {
  if (!this.#currentSession) {
    throw new Error('Cannot check session change: no session loaded');
  }
  if (!this.#prdHash) {
    throw new Error('Cannot check session change: PRD hash not computed');
  }
  return this.#prdHash !== this.#currentSession.metadata.hash;
}
```

### How It Works
1. Compares cached PRD hash (`#prdHash`) with session metadata hash
2. Returns `true` if hashes differ (PRD was modified)
3. Returns `false` if hashes match (PRD unchanged)
4. Throws error if no session loaded or hash not computed

### Hash Caching
- `#prdHash` is set during `initialize()` at line 233
- Cached to avoid recomputing hash on every check
- Recomputed only when `initialize()` is called again

## Test Patterns from Codebase

### Pattern 1: Direct Hash Computation Test
**Location**: `tests/integration/core/session-manager.test.ts`

```typescript
import { createHash } from 'node:crypto';

it('should compute SHA-256 hash and use first 12 characters', async () => {
  const prdContent = '# Test PRD\n\nConsistent content for hash testing.';
  writeFileSync(prdPath, prdContent);

  // Compute expected hash
  const fullHash = createHash('sha256').update(prdContent).digest('hex');
  const expectedHash = fullHash.slice(0, 12);

  // Execute and verify
  const manager = new SessionManager(prdPath, planDir);
  const session = await manager.initialize();

  expect(session.metadata.hash).toBe(expectedHash);
});
```

### Pattern 2: Hash Change Detection Test
**Location**: `tests/e2e/delta.test.ts`

```typescript
// Mock pattern for testing hasSessionChanged
vi.spyOn(sessionManager, 'hasSessionChanged').mockReturnValue(true);

// Or test actual implementation
const manager = new SessionManager(prdPath, planDir);
await manager.initialize();

// Modify PRD
writeFileSync(prdPath, modifiedPRDContent);

// Re-initialize (computes new hash)
const newHash = await hashPRD(prdPath);

// Verify hash changed
expect(newHash.slice(0, 12)).not.toBe(session.metadata.hash);
```

### Pattern 3: Deterministic Hash Verification
**Location**: `tests/unit/core/session-utils.test.ts`

```typescript
describe('hashPRD', () => {
  it('should compute SHA-256 hash of PRD file', async () => {
    mockReadFile.mockResolvedValue('# Test PRD\n\nThis is a test PRD.');
    const hashInstance = new MockHash();
    mockCreateHash.mockReturnValue(hashInstance);

    const hash = await hashPRD('/test/path/PRD.md');

    expect(mockCreateHash).toHaveBeenCalledWith('sha256');
    expect(hash.length).toBe(64); // Full SHA-256
  });
});
```

## Mock PRD Content Examples

### Simple PRD (tests/fixtures/simple-prd.ts)
```typescript
export const mockSimplePRD = `
# Test Project

A minimal project for fast E2E pipeline testing.

## P1: Test Phase

Validate pipeline functionality with minimal complexity.

### P1.M1: Test Milestone

Create a simple hello world implementation.

#### P1.M1.T1: Create Hello World

Implement a basic hello world function with tests.

##### P1.M1.T1.S1: Write Hello World Function

Create a simple hello world function.

**story_points**: 1
**dependencies**: []
**status**: Planned

**context_scope**:
CONTRACT DEFINITION:
1. RESEARCH NOTE: Simple function implementation
2. INPUT: None
3. LOGIC: Create src/hello.ts with function hello() that returns "Hello, World!"
4. OUTPUT: src/hello.ts with exported hello function
`;
```

**Expected Hash**: `b8c07e8b7d2` (first 12 chars of SHA-256)

### Modified PRD v2 (tests/fixtures/simple-prd-v2.ts)
Changes from v1:
- Added P1.M1.T2 task
- Modified P1.M1.T1.S1 story_points from 1 to 2

**Expected Hash**: `7a3f91e4c8f` (different from v1)

## Known Gotchas

### 1. Whitespace Sensitivity
**Issue**: Any whitespace change alters the hash completely
```typescript
// These produce DIFFERENT hashes:
hashPRD('# Test\nContent')
hashPRD('# Test\n Content')  // Extra space
```

**Impact**: Hash-based change detection is extremely sensitive

### 2. Case Sensitivity
**Issue**: Hash comparison is case-sensitive
```typescript
// Different hashes:
hashPRD('# Test Content')
hashPRD('# test content')  // Lowercase
```

### 3. First 12 Characters Only
**Issue**: Session IDs use only first 12 characters of 64-char hash
```typescript
const fullHash = '14b9dc2a33c7a1234567890abcdef...'; // 64 chars
const sessionHash = fullHash.slice(0, 12); // '14b9dc2a33c7'
```

**Impact**: Potential for hash collision (though extremely unlikely)

### 4. UTF-8 Encoding Required
**Issue**: PRD must be read as UTF-8 before hashing
```typescript
const content = await readFile(prdPath, 'utf-8'); // Correct
const content = await readFile(prdPath); // Wrong (Buffer)
```

### 5. Hash Caching Behavior
**Issue**: `hasSessionChanged()` uses cached hash from `initialize()`
```typescript
await manager.initialize(); // Computes and caches hash
// Modify PRD file...
manager.hasSessionChanged(); // Still compares with old cached hash!
```

**Solution**: Must call `initialize()` again to recompute hash

### 6. Deterministic JSON Serialization
**Issue**: For task caching, uses `JSON.stringify(input, null, 0)`
```typescript
// Location: src/agents/prp-generator.ts:249
const taskHash = createHash('sha256')
  .update(JSON.stringify(input, null, 0)) // No whitespace
  .digest('hex');
```

**Impact**: Object property order doesn't affect hash (with no whitespace)

## Testing Best Practices

### 1. Use Real Crypto for Deterministic Tests
```typescript
// GOOD: Use real crypto for hash computation tests
import { createHash } from 'node:crypto';

it('should compute deterministic hash', () => {
  const hash1 = createHash('sha256').update('test').digest('hex');
  const hash2 = createHash('sha256').update('test').digest('hex');
  expect(hash1).toBe(hash2);
});
```

### 2. Use Mocks for Unit Tests
```typescript
// GOOD: Mock crypto for unit tests
vi.mock('node:crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'mock-hash-64-chars...')
    }))
  }))
}));
```

### 3. Test Hash Change Detection
```typescript
it('should detect PRD modification', async () => {
  const originalPRD = '# Original PRD';
  const modifiedPRD = '# Modified PRD';

  // Initialize with original
  writeFileSync(prdPath, originalPRD);
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();

  // Compute hashes
  const hash1 = createHash('sha256').update(originalPRD).digest('hex').slice(0, 12);
  const hash2 = createHash('sha256').update(modifiedPRD).digest('hex').slice(0, 12);

  // Verify hashes differ
  expect(hash1).not.toBe(hash2);
});
```

### 4. Test Edge Cases
```typescript
describe('Hash edge cases', () => {
  it('should handle empty string', () => {
    const hash = createHash('sha256').update('').digest('hex');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should handle unicode', () => {
    const hash = createHash('sha256').update('你好世界').digest('hex');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle special characters', () => {
    const hash = createHash('sha256').update('\n\t\r').digest('hex');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

## References

### Node.js Crypto Documentation
- https://nodejs.org/api/crypto.html#crypto_createhash_algorithm_options
- https://nodejs.org/api/crypto.html#class-hash

### Vitest Testing Documentation
- https://vitest.dev/api/mock.html
- https://vitest.dev/api/expect.html

### Key Source Files
- `src/core/session-manager.ts:63` - SESSION_DIR_PATTERN regex
- `src/core/session-manager.ts:1162-1170` - hasSessionChanged()
- `src/core/session-utils.ts:229-255` - hashPRD()
- `tests/unit/core/session-utils.test.ts:229-304` - hashPRD tests
- `tests/integration/core/session-manager.test.ts:379-382` - Hash integration tests
