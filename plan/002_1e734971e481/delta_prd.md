# Delta PRD: Environment Configuration Enhancements

**Session ID:** 002_1e734971e481
**Parent Session:** 001_14b9dc2a33c7
**Date:** 2025-01-15
**Change Type:** Modification

## Executive Summary

This delta session addresses a modification to section 9.2 of the original PRD. The Environment Configuration requirements have been expanded to include a **layered configuration strategy** with explicit source priority and, critically, **API endpoint safeguards** to prevent accidental usage of Anthropic's production API.

## Change Summary

### Modified Requirement (Section 9.2: Environment Configuration)

**Original (Session 001):**
- Single-layer environment variable mapping
- Basic z.ai endpoint configuration
- No validation or safeguards against accidental API usage

**New (Session 002):**
- **Multi-layer configuration strategy** with explicit priority (Shell → .env → Runtime)
- **API endpoint safeguards** that block execution if Anthropic's production API is configured
- Explicit warnings for non-z.ai endpoints (excluding localhost/mock/test)
- Test infrastructure that enforces z.ai usage

**Business Rationale:**
During session 001, tests were accidentally configured to use Anthropic's official API (`https://api.anthropic.com`), causing massive usage spikes. This delta adds protective measures to prevent future occurrences.

## Detailed Changes

### 9.2.1 Configuration Source Priority (NEW)

Configuration is loaded in the following order (later sources override earlier ones):

1. **Shell Environment**: Inherited environment variables
2. **`.env` File**: Local project configuration (automatically loaded by test setup)
3. **Runtime Overrides**: Explicit environment variable settings

**Implementation Note:** The existing `configureEnvironment()` function in `src/config/environment.ts` must be updated to load `.env` files explicitly before processing environment variables.

### 9.2.4 API Endpoint Safeguards (NEW - CRITICAL)

**CRITICAL:** All tests and validation scripts must enforce z.ai API usage:

- Tests **must fail immediately** if `ANTHROPIC_BASE_URL` is set to `https://api.anthropic.com`
- Validation scripts **must block execution** to prevent accidental API usage
- **Warnings are issued** for non-z.ai endpoints (excluding localhost/mock/test)
- **Violation Example:** Using `https://api.anthropic.com` causes test failure with error message
- **Allowed Endpoints:**
  - `https://api.z.ai/api/anthropic` (production)
  - `http://localhost:*` (local testing)
  - `http://mock*` or `http://test*` (testing/mocking)

## Impact on Completed Work

### Files Requiring Updates

From Session 001 completed tasks, the following files must be modified:

1. **`src/config/environment.ts`** (from P1.M1.T2.S1 - Complete)
   - Add `.env` file loading logic
   - Add `validateAPIEndpoint()` function that checks `ANTHROPIC_BASE_URL`
   - Modify `configureEnvironment()` to call validation and throw if using Anthropic's official API
   - Add warning mechanism for non-z.ai endpoints

2. **`tests/unit/environment.test.ts`** (from P1.M1.T2.S2 - Complete)
   - Add test case: "validateEnvironment() throws when ANTHROPIC_BASE_URL is api.anthropic.com"
   - Add test case: "validateEnvironment() warns for non-z.ai endpoints (excluding localhost)"
   - Add test case: "configureEnvironment() loads .env file before shell env"
   - Add test case: "Runtime overrides take precedence over .env and shell"

3. **`src/scripts/validate-api.ts`** (from P1.M1.T2.S3 - Complete)
   - Add API endpoint validation check before any API calls
   - Exit with code 1 and descriptive error if `ANTHROPIC_BASE_URL` points to Anthropic's official API
   - Log warnings for non-z.ai endpoints

4. **Test Setup Infrastructure** (from P1.M1.T2.S2 - Complete)
   - Add test-specific `.env.test` file loading
   - Ensure test runner validates API endpoint before any LLM operations

### No Changes Required

The following areas remain unchanged:

- Environment variable mapping (`ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY`)
- Model selection logic (`GLM-4.7`, `GLM-4.5-Air`)
- Groundswell agent configuration patterns
- All other environment-related functionality

## Reference to Prior Research

From `plan/001_14b9dc2a33c7/architecture/`:

- **`environment_config.md`**: Contains the original environment mapping logic. Use this as the base for modifications.
- **`groundswell_api.md`**: Agent configuration patterns remain unchanged. Only add validation before agent creation.
- **`system_context.md`**: Session state management patterns remain unchanged.

## New Tasks for Delta Session

### Phase Delta.1: API Endpoint Safeguards

#### Milestone Delta.1.1: Environment Validation Enhancement

**Task Delta.1.1.T1: Update Environment Configuration Module**

**Subtask Delta.1.1.T1.S1: Add API endpoint validation**
- Implement `validateAPIEndpoint(url: string): { valid: boolean; warning?: string }`
- Return `{ valid: false }` for `https://api.anthropic.com`
- Return `{ valid: true, warning: string }` for non-z.ai, non-localhost endpoints
- Use in `configureEnvironment()` to throw on invalid endpoints
- Status: Pending

**Subtask Delta.1.1.T1.S2: Add .env file loading**
- Use `dotenv` package (add to dependencies)
- Load `.env` file before processing shell environment
- Document load order: Shell → .env → Runtime overrides
- Status: Pending

**Task Delta.1.1.T2: Update Environment Tests**

**Subtask Delta.1.1.T2.S1: Add API endpoint safeguard tests**
- Test that Anthropic official API URL is rejected
- Test that localhost URLs are accepted without warnings
- Test that non-z.ai production URLs generate warnings
- Test that .env loading takes precedence over shell environment
- Test that runtime overrides take precedence over .env
- Status: Pending

**Subtask Delta.1.1.T2.S2: Create .env.test fixture**
- Add `tests/fixtures/.env.test` with z.ai endpoint
- Configure test setup to load this file
- Ensure tests use test-specific API endpoint
- Status: Pending

**Task Delta.1.1.T3: Update API Validation Script**

**Subtask Delta.1.1.T3.S1: Add endpoint validation to validate-api.ts**
- Check API endpoint before making any test calls
- Exit with code 1 if using Anthropic's official API
- Log warnings for non-z.ai endpoints
- Status: Pending

## Dependencies

- Depends on: Session 001 completion (P1.M1.T2 - Environment Configuration)
- Blocks: Any testing or validation that makes API calls

## Success Criteria

1. All tests fail immediately if `ANTHROPIC_BASE_URL=https://api.anthropic.com`
2. Tests log warnings for non-z.ai endpoints (excluding localhost/mock/test)
3. `.env` file loading is documented and tested
4. Runtime override behavior is verified
5. No accidental calls to Anthropic's production API occur during testing

## Backward Compatibility

**Breaking Change:** Yes. Code that explicitly sets `ANTHROPIC_BASE_URL` to `https://api.anthropic.com` will now throw an error.

**Migration Path:** Any existing configuration using Anthropic's official API must be updated to use `https://api.z.ai/api/anthropic` or a localhost/mock endpoint for testing.

## Notes

- This is a defensive measure to prevent cost overruns from accidental API usage
- The safeguards are intentionally strict to catch misconfiguration early
- Local development can use localhost or mock endpoints without triggering warnings
- Test infrastructure must explicitly load z.ai configuration
