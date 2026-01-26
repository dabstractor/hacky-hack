# Vitest Testing Resources

## Official Documentation

| Resource | URL | Key Sections |
|----------|-----|--------------|
| Getting Started | https://vitest.dev/guide/ | Installation, configuration, first test |
| Mocking Guide | https://vitest.dev/guide/mocking.html | vi.mock(), vi.fn(), vi.stubEnv(), timer mocking |
| Test Organization | https://vitest.dev/guide/organizing-tests.html | Test files, test suites, describe() blocks |
| Coverage Guide | https://vitest.dev/guide/coverage.html | Configuration, thresholds, reporters |
| Configuration Reference | https://vitest.dev/config/ | Complete vitest.config.ts reference |
| API Reference | https://vitest.dev/api/ | All vi.* functions and globals |

## Key Documentation Anchors

### Mocking Patterns
- https://vitest.dev/guide/mocking.html#vi-mock - Module mocking
- https://vitest.dev/guide/mocking.html#vi-fn - Function mocking
- https://vitest.dev/guide/mocking.html#stubbing-env - Environment variables
- https://vitest.dev/guide/mocking.html#mocking-partials - Partial module mocking

### Coverage Configuration
- https://vitest.dev/guide/coverage.html#configuration - Coverage provider setup
- https://vitest.dev/guide/coverage.html#thresholds - Coverage thresholds
- https://vitest.dev/guide/coverage.html#reporters - Report formats (text, json, html)

### Test Structure
- https://vitest.dev/guide/organizing-tests.html#test-file-location - File naming conventions
- https://vitest.dev/guide/organizing-tests.html#test-helpers - beforeEach, afterEach
- https://vitest.dev/guide/organizing-tests.html#test-context - Context sharing

## Example Repositories

1. **Vitest Official Examples**: https://github.com/vitest-dev/vitest/tree/main/examples
   - Mock-testing examples
   - Coverage setup examples
   - Test organization patterns

2. **Nuxt 3**: https://github.com/nuxt/nuxt
   - Large-scale Vitest implementation
   - Test fixtures in test/fixtures/
   - Advanced mocking patterns

3. **Vitest Self-Tests**: https://github.com/vitest-dev/vitest
   - Vitest tests itself with Vitest
   - Complex mocking scenarios
   - Performance testing patterns
