# PRP: P1.M1.T1.S2 - Verify PRD hash-based change detection

## Goal

**Feature Goal**: Create a unit test that validates PRD hash-based change detection using SHA-256 hash computation with proper verification of hash changes, determinism, case sensitivity, and the `hasSessionChanged()` method behavior.

**Deliverable**: Unit test file `tests/unit/core/session-hash-detection.test.ts` with comprehensive test coverage for hash computation and change detection logic.

**Success Definition**:
- All 4 validation requirements from CONTRACT DEFINITION are tested and passing
- Test file runs successfully with `npx vitest run tests/unit/core/session-hash-detection.test.ts`
- Tests validate: (a) hash is computed from PRD file content using SHA-256, (b) hash changes when PRD content changes, (c) `hasSessionChanged()` returns true when hash mismatch detected, (d) hash comparison is case-sensitive and deterministic
- Tests use real crypto operations (not mocks) for predictable hash values with known PRD content

## Why

**Business Value**: Validates the foundational hash-based change detection mechanism that enables delta session creation. Incorrect hash computation would break PRD modification detection across the entire system.

**Integration Points**:
- Validates `hashPRD()` from `src/core/session-utils.ts` (lines 229-255) for SHA-256 hash computation
- Validates `hasSessionChanged()` from `src/core/session-manager.ts` (lines 1162-1170) for hash comparison logic
- Validates `initialize()` hash caching behavior from `src/core/session-manager.ts` (lines 224-233)
- Uses test fixtures from `tests/fixtures/simple-prd.ts` and `tests/fixtures/simple-prd-v2.ts`

**Problems Solved**:
- Ensures SHA-256 hash computation produces correct 64-character hex strings
- Verifies first 12-character slice pattern used for session hashes
- Confirms hash-based change detection correctly identifies PRD modifications
- Validates case-sensitive and deterministic hash comparison behavior

## What

**User-Visible Behavior**: Test validates hash computation internals - no direct user-visible behavior, but ensures the pipeline correctly detects PRD modifications for delta session creation.

**Success Criteria**:
- [ ] Test verifies SHA-256 hash is computed from PRD file content (64-character hex string)
- [ ] Test verifies hash changes when PRD content changes (different content = different hash)
- [ ] Test verifies `hasSessionChanged()` returns true when hash mismatch detected
- [ ] Test verifies hash comparison is case-sensitive (different case = different hash)
- [ ] Test verifies hash computation is deterministic (same content = same hash)
- [ ] Test verifies first 12-character slice pattern for session hashes
- [ ] All tests pass with `npx vitest run tests/unit/core/session-hash-detection.test.ts`
- [ ] Tests use real crypto operations with known PRD content for predictable values

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Core implementation files

- file: src/core/session-utils.ts
  why: Contains hashPRD() function that computes SHA-256 hash of PRD content
  pattern: Look for `export async function hashPRD(prdPath: string): Promise<string>`
  gotcha: Returns full 64-character SHA-256 hash (caller slices to 12 chars)
  lines: 229-255

- file: src/core/session-manager.ts
  why: Contains hasSessionChanged() method and hash caching logic
  pattern: Look for `hasSessionChanged(): boolean` method and `#prdHash` caching
  gotcha: Compares cached `#prdHash` with `session.metadata.hash` for change detection
  lines: 106-107 (prdHash field), 1162-1170 (hasSessionChanged), 224-233 (hash caching in initialize)

- file: src/core/models.ts
  why: Type definitions for SessionMetadata and SessionState
  pattern: Look for `interface SessionMetadata` with `hash: string` field
  gotcha: SessionMetadata.hash is exactly 12 characters (first 12 of SHA-256)

- file: tests/unit/core/session-utils.test.ts
  why: Reference test patterns for hashPRD() unit tests
  pattern: Uses MockHash class for predictable test values, vi.mock for node:crypto
  gotcha: Unit tests use mocks - this test should use real crypto for determinism validation
  lines: 229-304

- file: tests/integration/core/session-manager.test.ts
  why: Reference integration test patterns for hash computation verification
  pattern: Uses `createHash('sha256').update(content).digest('hex').slice(0, 12)` for expected values
  gotcha: Integration tests use real filesystem and real crypto operations
  lines: 379-382, 1079-1082, 2295-2298

- file: tests/fixtures/simple-prd.ts
  why: Mock PRD content for predictable hash values
  pattern: Minimal valid PRD with known content
  gotcha: Export as string, not function - use directly in tests
  hash: b8c07e8b7d2 (first 12 chars of SHA-256 for this content)

- file: tests/fixtures/simple-prd-v2.ts
  why: Modified PRD content for testing hash change detection
  pattern: Same structure as simple-prd.ts with content modifications
  gotcha: Different hash from v1 - use for change detection tests
  hash: 7a3f91e4c8f (first 12 chars of SHA-256 for this content)

# CRITICAL PATTERNS - Hash computation and change detection

- docfile: src/core/session-utils.ts
  section: Lines 229-255 - hashPRD function
  why: Shows exact hash computation pattern using createHash('sha256')
  pattern: `createHash('sha256').update(content).digest('hex')` returns 64-char hex string

- docfile: src/core/session-manager.ts
  section: Lines 224-233 - Hash caching in initialize()
  why: Shows how PRD hash is computed and cached for change detection
  pattern: `const fullHash = await hashPRD(this.prdPath); const sessionHash = fullHash.slice(0, 12); this.#prdHash = sessionHash;`

- docfile: src/core/session-manager.ts
  section: Lines 1162-1170 - hasSessionChanged method
  why: Shows hash comparison logic for change detection
  pattern: `return this.#prdHash !== this.#currentSession.metadata.hash;`
  gotcha: Compares cached hash (from current PRD file) with session hash (from when session was loaded)

- docfile: tests/unit/core/session-utils.test.ts
  section: Lines 164-179 - MockHash class
  why: Example mock implementation for testing (reference only - use real crypto)
  pattern: Implements update() and digest() methods matching crypto Hash interface
```

### Current Codebase Tree

```bash
tests/
├── unit/
│   └── core/
│       ├── session-manager.test.ts      # Reference for SessionManager unit tests
│       ├── session-utils.test.ts        # Reference for hashPRD() unit tests
│       └── [existing test files...]
├── fixtures/
│   ├── simple-prd.ts                    # Mock PRD with known hash (b8c07e8b7d2)
│   └── simple-prd-v2.ts                 # Mock PRD v2 with different hash (7a3f91e4c8f)
└── setup.ts                             # Global test setup

src/
└── core/
    ├── session-manager.ts               # hasSessionChanged() at lines 1162-1170
    ├── session-utils.ts                 # hashPRD() at lines 229-255
    └── models.ts                        # SessionMetadata interface
```

### Desired Codebase Tree with Files to be Added

```bash
tests/
├── unit/
│   └── core/
│       ├── session-manager.test.ts      # (existing - reference)
│       ├── session-utils.test.ts        # (existing - reference)
│       └── session-hash-detection.test.ts  # NEW - Unit test for hash change detection
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: hashPRD() returns FULL 64-character SHA-256 hash
// The CALLER (SessionManager.initialize()) slices to 12 characters
const fullHash = await hashPRD(prdPath); // Returns 64 chars
const sessionHash = fullHash.slice(0, 12); // First 12 chars only

// CRITICAL: hasSessionChanged() uses CACHED hash from initialize()
// Must call initialize() to recompute hash after PRD modification
await manager.initialize(); // Computes and caches #prdHash
// Modify PRD...
manager.hasSessionChanged(); // Still compares with OLD cached hash!
// Need to call initialize() again to recompute

// CRITICAL: Hash computation is CASE-SENSITIVE
createHash('sha256').update('Content').digest('hex') !==
createHash('sha256').update('content').digest('hex')

// CRITICAL: Hash computation is DETERMINISTIC
createHash('sha256').update('same content').digest('hex') ===
createHash('sha256').update('same content').digest('hex')

// CRITICAL: Hash changes with ANY content difference (including whitespace)
createHash('sha256').update('content').digest('hex') !==
createHash('sha256').update('content ').digest('hex') // Extra space

// CRITICAL: Use REAL crypto for deterministic tests (not mocks)
import { createHash } from 'node:crypto';
const expectedHash = createHash('sha256').update(knownContent).digest('hex');

// CRITICAL: Test fixtures are STRING exports, not functions
import { mockSimplePRD } from '../../fixtures/simple-prd.js'; // Contains string
// Don't call as function: mockSimplePRD() - WRONG

// CRITICAL: SessionManager requires VALID PRD to exist before instantiation
// Use writeFileSync(prdPath, mockSimplePRD, { mode: 0o644 }) before new SessionManager()

// CRITICAL: Vitest requires vi.mock() calls at TOP LEVEL before imports
// For this test file, use REAL crypto (no mocking needed)

// CRITICAL: hasSessionChanged() throws if no session loaded
// Must call initialize() before calling hasSessionChanged()

// GOTCHA: SessionMetadata.hash is exactly 12 characters
// Full SHA-256 is 64 chars, but session metadata stores first 12 only

// GOTCHA: Hash caching means hasSessionChanged() won't detect changes
// until initialize() is called again to recompute #prdHash

// GOTCHA: For unit tests, can use temp directories or mock PRD paths
// But hashPRD() requires actual file to exist (reads from filesystem)
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Import core dependencies
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { createHash } from 'node:crypto';
import {
  writeFileSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Import SessionManager and types
import { SessionManager } from '../../../src/core/session-manager.js';
import { hashPRD } from '../../../src/core/session-utils.js';
import type { SessionState } from '../../../src/core/models.js';

// Import test fixtures
import { mockSimplePRD } from '../../fixtures/simple-prd.js';
import { mockSimplePRDv2 } from '../../fixtures/simple-prd-v2.js';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/unit/core/session-hash-detection.test.ts
  - IMPLEMENT: Unit test file with describe block for hash computation and change detection
  - FOLLOW pattern: tests/unit/core/session-utils.test.ts (test structure, mock patterns)
  - NAMING: session-hash-detection.test.ts (unit test naming convention)
  - PLACEMENT: tests/unit/core/ directory (alongside other core unit tests)

Task 2: IMPLEMENT test file setup and teardown utilities
  - IMPLEMENT: beforeEach() creating temp dir with mkdtempSync(join(tmpdir(), 'hash-detection-test-'))
  - IMPLEMENT: afterEach() cleaning up with rmSync(tempDir, { recursive: true, force: true })
  - IMPLEMENT: Helper function `createTestPRD(path, content)` for writing PRD files
  - IMPLEMENT: Helper function `computeExpectedHash(content)` for deterministic hash computation
  - FOLLOW pattern: tests/integration/core/session-manager.test.ts (temp directory management)
  - VARIABLE: let tempDir: string at describe block scope

Task 3: IMPLEMENT SHA-256 hash computation test (CONTRACT a)
  - IMPLEMENT: it('should compute SHA-256 hash from PRD file content')
  - CREATE: Test PRD file with known content using createTestPRD()
  - EXECUTE: const hash = await hashPRD(prdPath)
  - VERIFY: hash is 64-character hex string (/^[a-f0-9]{64}$/)
  - VERIFY: hash matches expected hash from computeExpectedHash()
  - VERIFY: hash uses createHash('sha256').update(content).digest('hex') pattern

Task 4: IMPLEMENT hash change detection test (CONTRACT b)
  - IMPLEMENT: it('should detect hash change when PRD content changes')
  - SETUP: Create PRD with mockSimplePRD content
  - EXECUTE: Compute hash1 = await hashPRD(prdPath)
  - MODIFY: Write mockSimplePRDv2 content to same path
  - EXECUTE: Compute hash2 = await hashPRD(prdPath)
  - VERIFY: hash1 !== hash2 (hashes differ)
  - VERIFY: Both hashes are valid 64-character hex strings

Task 5: IMPLEMENT hasSessionChanged() method test (CONTRACT c)
  - IMPLEMENT: it('should return true when hash mismatch detected')
  - SETUP: Create PRD with mockSimplePRD content
  - EXECUTE: const manager = new SessionManager(prdPath, planDir); await manager.initialize()
  - VERIFY: manager.hasSessionChanged() returns false (no change yet)
  - MODIFY: Write mockSimplePRDv2 content to PRD path (different hash)
  - RECOMPUTE: Create new SessionManager instance and call initialize() to recompute hash
  - VERIFY: New manager's currentSession.metadata.hash differs from original
  - VERIFY: Demonstrate hash mismatch detection logic

Task 6: IMPLEMENT case-sensitive hash comparison test (CONTRACT d)
  - IMPLEMENT: it('should be case-sensitive in hash comparison')
  - SETUP: Create two PRD contents with different case: 'Content' vs 'content'
  - EXECUTE: Compute hash1 and hash2 from different-case contents
  - VERIFY: hash1 !== hash2 (case-sensitive)
  - VERIFY: Both are valid 64-character hex strings

Task 7: IMPLEMENT deterministic hash computation test (CONTRACT d)
  - IMPLEMENT: it('should compute deterministic hashes for identical content')
  - SETUP: Create PRD with fixed content
  - EXECUTE: Compute hash1, hash2, hash3 from same content
  - VERIFY: hash1 === hash2 === hash3 (deterministic)
  - VERIFY: All hashes are identical 64-character hex strings

Task 8: IMPLEMENT first 12-character slice pattern test
  - IMPLEMENT: it('should use first 12 characters for session hash')
  - SETUP: Create PRD with known content
  - EXECUTE: const fullHash = await hashPRD(prdPath); const sessionHash = fullHash.slice(0, 12)
  - VERIFY: fullHash.length === 64
  - VERIFY: sessionHash.length === 12
  - VERIFY: sessionHash matches /^[a-f0-9]{12}$/
  - VERIFY: SessionManager.initialize() uses 12-char hash in session ID

Task 9: IMPLEMENT hash caching behavior test
  - IMPLEMENT: it('should cache PRD hash during initialize')
  - SETUP: Create PRD and SessionManager
  - EXECUTE: await manager.initialize()
  - VERIFY: Internal #prdHash is set (check via hash computation before/after)
  - MODIFY: PRD content
  - VERIFY: hasSessionChanged() still uses old cached hash
  - EXECUTE: await manager.initialize() again
  - VERIFY: Cached hash is updated to new value

Task 10: IMPLEMENT edge cases test suite
  - IMPLEMENT: it('should handle empty PRD content')
  - VERIFY: Empty string produces valid SHA-256 hash (e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855)
  - IMPLEMENT: it('should handle unicode characters')
  - VERIFY: Unicode content produces valid 64-character hex hash
  - IMPLEMENT: it('should handle whitespace differences')
  - VERIFY: Different whitespace produces different hashes
  - IMPLEMENT: it('should handle special characters')
  - VERIFY: Special characters (\n\t\r) produce valid hash
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Test file setup with temp directory
describe('PRD Hash-based Change Detection', () => {
  let tempDir: string;
  let planDir: string;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'hash-detection-test-'));
    planDir = join(tempDir, 'plan');
    mkdirSync(planDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory after test
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Helper function to create test PRD
  function createTestPRD(path: string, content: string): void {
    writeFileSync(path, content, { mode: 0o644 });
  }

  // Helper function to compute expected hash
  function computeExpectedHash(content: string): string {
    return createHash('sha256').update(content, 'utf-8').digest('hex');
  }
});

// PATTERN: SHA-256 hash computation test (CONTRACT a)
it('should compute SHA-256 hash from PRD file content', async () => {
  // SETUP: Create test PRD with known content
  const prdPath = join(tempDir, 'PRD.md');
  const prdContent = '# Test PRD\n\nKnown content for hash testing.';
  createTestPRD(prdPath, prdContent);

  // EXECUTE: Compute hash using hashPRD function
  const hash = await hashPRD(prdPath);

  // VERIFY: Hash is 64-character hex string
  expect(hash).toHaveLength(64);
  expect(hash).toMatch(/^[a-f0-9]{64}$/);

  // VERIFY: Hash matches expected value from real crypto
  const expectedHash = computeExpectedHash(prdContent);
  expect(hash).toBe(expectedHash);

  // VERIFY: Uses SHA-256 algorithm
  const manualHash = createHash('sha256').update(prdContent, 'utf-8').digest('hex');
  expect(hash).toBe(manualHash);
});

// PATTERN: Hash change detection test (CONTRACT b)
it('should detect hash change when PRD content changes', async () => {
  // SETUP: Create PRD with v1 content
  const prdPath = join(tempDir, 'PRD.md');
  createTestPRD(prdPath, mockSimplePRD);

  // EXECUTE: Compute initial hash
  const hash1 = await hashPRD(prdPath);

  // MODIFY: Update PRD with v2 content
  createTestPRD(prdPath, mockSimplePRDv2);

  // EXECUTE: Compute new hash
  const hash2 = await hashPRD(prdPath);

  // VERIFY: Hashes differ (change detected)
  expect(hash1).not.toBe(hash2);

  // VERIFY: Both are valid hashes
  expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  expect(hash2).toMatch(/^[a-f0-9]{64}$/);

  // VERIFY: Can verify with real crypto
  const expectedHash1 = computeExpectedHash(mockSimplePRD);
  const expectedHash2 = computeExpectedHash(mockSimplePRDv2);
  expect(hash1).toBe(expectedHash1);
  expect(hash2).toBe(expectedHash2);
});

// PATTERN: hasSessionChanged() method test (CONTRACT c)
it('should return true when hash mismatch detected via hasSessionChanged', async () => {
  // SETUP: Create PRD with initial content
  const prdPath = join(tempDir, 'PRD.md');
  createTestPRD(prdPath, mockSimplePRD);

  // EXECUTE: Initialize session with initial PRD
  const manager1 = new SessionManager(prdPath, planDir);
  await manager1.initialize();
  const session1 = manager1.currentSession;

  // VERIFY: No change detected initially
  expect(manager1.hasSessionChanged()).toBe(false);

  // MODIFY: Update PRD with different content
  createTestPRD(prdPath, mockSimplePRDv2);

  // EXECUTE: Initialize new session manager (recomputes hash)
  const manager2 = new SessionManager(prdPath, planDir);
  await manager2.initialize();
  const session2 = manager2.currentSession;

  // VERIFY: Session hashes differ
  expect(session1.metadata.hash).not.toBe(session2.metadata.hash);

  // VERIFY: Both are valid 12-character session hashes
  expect(session1.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
  expect(session2.metadata.hash).toMatch(/^[a-f0-9]{12}$/);
});

// PATTERN: Case-sensitive hash comparison test (CONTRACT d)
it('should be case-sensitive in hash comparison', async () => {
  // SETUP: Create two PRDs with different case
  const prdPath1 = join(tempDir, 'PRD1.md');
  const prdPath2 = join(tempDir, 'PRD2.md');

  createTestPRD(prdPath1, '# Test PRD\nContent with uppercase');
  createTestPRD(prdPath2, '# Test PRD\ncontent with lowercase');

  // EXECUTE: Compute hashes
  const hash1 = await hashPRD(prdPath1);
  const hash2 = await hashPRD(prdPath2);

  // VERIFY: Hashes differ (case-sensitive)
  expect(hash1).not.toBe(hash2);

  // VERIFY: Can verify with real crypto
  const expectedHash1 = computeExpectedHash('# Test PRD\nContent with uppercase');
  const expectedHash2 = computeExpectedHash('# Test PRD\ncontent with lowercase');
  expect(hash1).toBe(expectedHash1);
  expect(hash2).toBe(expectedHash2);
  expect(expectedHash1).not.toBe(expectedHash2);
});

// PATTERN: Deterministic hash computation test (CONTRACT d)
it('should compute deterministic hashes for identical content', async () => {
  // SETUP: Create PRD with fixed content
  const prdPath = join(tempDir, 'PRD.md');
  const prdContent = '# Test PRD\n\nDeterministic content for testing.';
  createTestPRD(prdPath, prdContent);

  // EXECUTE: Compute hash multiple times
  const hash1 = await hashPRD(prdPath);
  const hash2 = await hashPRD(prdPath);
  const hash3 = await hashPRD(prdPath);

  // VERIFY: All hashes are identical (deterministic)
  expect(hash1).toBe(hash2);
  expect(hash2).toBe(hash3);
  expect(hash1).toBe(hash3);

  // VERIFY: All match expected value from real crypto
  const expectedHash = computeExpectedHash(prdContent);
  expect(hash1).toBe(expectedHash);
  expect(hash2).toBe(expectedHash);
  expect(hash3).toBe(expectedHash);
});

// PATTERN: First 12-character slice pattern test
it('should use first 12 characters for session hash', async () => {
  // SETUP: Create PRD with known content
  const prdPath = join(tempDir, 'PRD.md');
  const prdContent = '# Test PRD\n\nContent for hash slice testing.';
  createTestPRD(prdPath, prdContent);

  // EXECUTE: Compute full hash and session hash
  const fullHash = await hashPRD(prdPath);
  const sessionHash = fullHash.slice(0, 12);

  // VERIFY: Full hash is 64 characters
  expect(fullHash).toHaveLength(64);

  // VERIFY: Session hash is 12 characters
  expect(sessionHash).toHaveLength(12);

  // VERIFY: Session hash is lowercase hex
  expect(sessionHash).toMatch(/^[a-f0-9]{12}$/);

  // VERIFY: SessionManager uses 12-char hash in session ID
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();
  const session = manager.currentSession;
  expect(session.metadata.hash).toBe(sessionHash);
  expect(session.metadata.id).toContain(`_${sessionHash}`);
});

// PATTERN: Hash caching behavior test
it('should cache PRD hash during initialize', async () => {
  // SETUP: Create PRD with initial content
  const prdPath = join(tempDir, 'PRD.md');
  const initialContent = '# Initial PRD\n\nInitial content.';
  createTestPRD(prdPath, initialContent);

  // EXECUTE: Initialize session
  const manager = new SessionManager(prdPath, planDir);
  await manager.initialize();

  // VERIFY: No change detected initially
  expect(manager.hasSessionChanged()).toBe(false);

  // MODIFY: Update PRD content
  const modifiedContent = '# Modified PRD\n\nModified content.';
  createTestPRD(prdPath, modifiedContent);

  // VERIFY: Still no change detected (uses cached hash)
  expect(manager.hasSessionChanged()).toBe(false);

  // EXECUTE: Re-initialize to recompute hash
  await manager.initialize();

  // VERIFY: Hash is updated to new value
  const newHash = await hashPRD(prdPath);
  const newSessionHash = newHash.slice(0, 12);
  expect(manager.currentSession.metadata.hash).toBe(newSessionHash);
});

// PATTERN: Edge cases test suite
describe('Hash computation edge cases', () => {
  it('should handle empty PRD content', async () => {
    const prdPath = join(tempDir, 'PRD.md');
    createTestPRD(prdPath, '');

    const hash = await hashPRD(prdPath);

    // Known SHA-256 hash of empty string
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should handle unicode characters', async () => {
    const prdPath = join(tempDir, 'PRD.md');
    const unicodeContent = '# Test\n你好世界\n🚀 Rocket';
    createTestPRD(prdPath, unicodeContent);

    const hash = await hashPRD(prdPath);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle whitespace differences', async () => {
    const prdPath1 = join(tempDir, 'PRD1.md');
    const prdPath2 = join(tempDir, 'PRD2.md');

    createTestPRD(prdPath1, 'content');
    createTestPRD(prdPath2, 'content '); // Extra space

    const hash1 = await hashPRD(prdPath1);
    const hash2 = await hashPRD(prdPath2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle special characters', async () => {
    const prdPath = join(tempDir, 'PRD.md');
    const specialContent = '# Test\n\n\t\r\nNewlines and tabs';
    createTestPRD(prdPath, specialContent);

    const hash = await hashPRD(prdPath);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

### Integration Points

```yaml
SESSION_MANAGER:
  - class: SessionManager from src/core/session-manager.ts
  - method: async initialize(): Promise<SessionState>
  - method: hasSessionChanged(): boolean
  - field: #prdHash (cached PRD hash)

SESSION_UTILS:
  - function: hashPRD(prdPath: string): Promise<string>
  - returns: Full 64-character SHA-256 hex string

MODELS:
  - interface: SessionMetadata { id, hash (12 chars), path, createdAt, parentSession }

TEST_FRAMEWORK:
  - runner: Vitest (configured in vitest.config.ts)
  - environment: node (from vitest.config.ts)
  - coverage: v8 provider with 100% threshold

NODE_CRYPTO:
  - module: node:crypto
  - function: createHash('sha256')
  - methods: update(content), digest('hex')
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit tests/unit/core/session-hash-detection.test.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Run ESLint to check code style
npx eslint tests/unit/core/session-hash-detection.test.ts --fix

# Expected: Zero linting errors. Auto-fix should handle formatting issues.

# Run Prettier for consistent formatting
npx prettier --write tests/unit/core/session-hash-detection.test.ts

# Expected: File formatted successfully.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the new unit test file
npx vitest run tests/unit/core/session-hash-detection.test.ts

# Expected: All tests pass. Check output for any failures.

# Run all core unit tests to ensure no regressions
npx vitest run tests/unit/core/

# Expected: All core unit tests pass.

# Run with coverage report
npx vitest run tests/unit/core/session-hash-detection.test.ts --coverage

# Expected: Coverage shows tested code paths (hashPRD, hasSessionChanged, etc.)
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite execution
npm test

# Expected: All tests pass (unit + integration).

# Verify no regressions in existing tests
npx vitest run tests/unit/core/session-utils.test.ts
npx vitest run tests/integration/core/session-manager.test.ts

# Expected: Existing hash-related tests still pass.

# Test project-wide validation
npm run validate

# Expected: All validation checks pass (linting, typecheck, formatting).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual verification: Run test and inspect hash values
# Add temporary logging to see actual hash computations

# Domain-specific: Verify hash matches known test vectors
# Test empty string hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
# Test "abc" hash: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad

# Test edge cases:
# - Empty PRD content
# - Unicode characters (Chinese, emoji)
# - Special characters (\n\t\r)
# - Whitespace differences
# - Case sensitivity
# - Very large PRD files
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npx vitest run tests/unit/core/session-hash-detection.test.ts`
- [ ] No type errors: `npx tsc --noEmit tests/unit/core/session-hash-detection.test.ts`
- [ ] No linting errors: `npx eslint tests/unit/core/session-hash-detection.test.ts`
- [ ] No formatting issues: `npx prettier --check tests/unit/core/session-hash-detection.test.ts`

### Feature Validation

- [ ] SHA-256 hash computed from PRD file content (64-char hex string)
- [ ] Hash changes when PRD content changes (different content = different hash)
- [ ] hasSessionChanged() returns true when hash mismatch detected
- [ ] Hash comparison is case-sensitive (different case = different hash)
- [ ] Hash computation is deterministic (same content = same hash)
- [ ] First 12-character slice pattern verified for session hashes
- [ ] Hash caching behavior validated (initialize() recomputes hash)
- [ ] Edge cases handled: empty string, unicode, special characters, whitespace

### Code Quality Validation

- [ ] Follows existing test patterns from session-utils.test.ts and session-manager.test.ts
- [ ] Test isolation: beforeEach/afterEach properly implemented
- [ ] Descriptive test names following "should..." convention
- [ ] Proper assertions with clear failure messages
- [ ] Real crypto operations used (not mocks) for deterministic validation
- [ ] Helper functions for common operations (createTestPRD, computeExpectedHash)
- [ ] Temp directory cleanup works: rmSync with recursive: true, force: true

### Documentation & Deployment

- [ ] Test file has JSDoc comments explaining purpose
- [ ] Complex test logic has inline comments
- [ ] Test follows Setup/Execute/Verify pattern consistently
- [ ] All CONTRACT requirements from work item description are tested

## Anti-Patterns to Avoid

- ❌ Don't use mocks for crypto operations in deterministic tests (use real createHash)
- ❌ Don't skip temp directory cleanup (always use afterEach with rmSync)
- ❌ Don't hardcode hash values (compute with createHash for predictability)
- ❌ Don't forget to verify hash length (64 for full, 12 for session)
- ❌ Don't forget to verify hash format (lowercase hex: /^[a-f0-9]+$/)
- ❌ Don't forget to test case sensitivity (Content vs content)
- ❌ Don't forget to test determinism (same content = same hash)
- ❌ Don't forget hasSessionChanged() requires initialize() first
- ❌ Don't forget hash caching behavior (must reinitialize to recompute)
- ❌ Don't test hasSessionChanged() without loading a session first
- ❌ Don't assume hashPRD() returns 12 characters (returns 64, caller slices)
- ❌ Don't use relative paths without resolve (always use absolute paths in tests)
- ❌ Don't create test PRDs with invalid markdown (SessionManager validates PRD structure)
- ❌ Don't forget to verify both full hash (64 chars) and session hash (12 chars)
- ❌ Don't skip edge case testing (empty, unicode, special characters)
