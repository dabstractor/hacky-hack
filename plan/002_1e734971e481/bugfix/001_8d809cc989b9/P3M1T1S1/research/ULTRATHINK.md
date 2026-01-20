# ULTRATHINK Plan: PRP for P3.M1.T1.S1

## PRP Structure Planning

### Goal Section Strategy
- **Feature Goal**: Analyze test expectations vs implementation logging to determine fix strategy
- **Deliverable**: Analysis document with recommendation
- **Success Definition**: Clear recommendation on whether to fix tests or implementation

### Context Section Strategy

#### YAML Structure to Populate:
```yaml
Documentation & References:
  # PRIMARY FILES
  - file: tests/unit/core/task-orchestrator.test.ts
    why: Contains 21 failing tests with console.log expectations
    pattern: Lines 298-876 contain all logging test assertions
    gotcha: Tests use vi.spyOn(console, 'log') but implementation uses Pino

  - file: src/core/task-orchestrator.ts
    why: Implementation using Pino structured logging
    pattern: Lines 112, 484-491, 505-517, 531-562, 584-750
    gotcha: Uses getLogger('TaskOrchestrator') not console.log

  - file: src/utils/logger.ts
    why: Defines Pino logger interface and factory
    pattern: Logger interface with debug/info/warn/error methods
    gotcha: Pino uses structured logging (obj + msg) not formatted strings

  # RESEARCH DOCUMENTATION
  - docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M1T1S1/research/logging-test-analysis.md
    why: Complete analysis of test vs implementation mismatch
    section: "Complete List of 21 Failing Tests"

  - docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M1T1S1/research/external-research.md
    why: Best practices for testing Pino logger
    section: "Application to Task Orchestrator Tests"

  # EXISTING MOCK SETUP
  - file: tests/unit/core/task-orchestrator.test.ts
    why: Lines 22-34 show correct mock setup using vi.hoisted()
    pattern: mockLogger with info/error/warn/debug methods
    gotcha: Mock is correct but tests don't use it!

  # CODEBASE PATTERNS
  - file: tests/unit/logger.test.ts
    why: Example of correct logger testing patterns
    pattern: Uses mockLogger directly for assertions

  - file: plan/002_1e734971e481/bugfix/001_8d809cc989b9/TEST_RESULTS.md
    why: Documents Issue 4: Task Orchestrator Logging Failures
    section: "Issue 4: Task Orchestrator Logging Failures"
```

### Implementation Tasks Strategy

Since this is a RESEARCH task (not implementation), tasks should be:

```yaml
Task 1: READ and analyze test file
  - FILE: tests/unit/core/task-orchestrator.test.ts
  - FOCUS: Lines 298-876 (all logging test assertions)
  - IDENTIFY: All console.log expectations
  - DOCUMENT: Expected message format patterns

Task 2: READ and analyze implementation
  - FILE: src/core/task-orchestrator.ts
  - FOCUS: All this.#logger.* calls
  - MAP: Each test expectation to actual implementation
  - DOCUMENT: Structured logging patterns used

Task 3: COMPARE test vs implementation
  - ANALYZE: Mock setup (lines 22-34)
  - DETERMINE: Are tests using wrong mock expectations?
  - DETERMINE: Should implementation change to console.log?
  - DETERMINE: Should wrapper be added?

Task 4: IDENTIFY all 21 failing tests
  - EXTRACT: Test names from test file
  - CATEGORIZE: By type (executePhase, executeMilestone, etc.)
  - DOCUMENT: In research/logging-test-analysis.md

Task 5: RESEARCH best practices
  - SEARCH: Codebase for similar logger testing patterns
  - REVIEW: tests/unit/logger.test.ts for correct patterns
  - EXTERNAL: Pino testing best practices

Task 6: CREATE analysis document
  - FILE: plan/.../P3M1T1S1/architecture/logging-test-analysis.md
  - CONTENT: Detailed comparison of test vs implementation
  - RECOMMENDATION: Fix tests or fix implementation (with rationale)
```

### Validation Strategy

Since this is research:

```yaml
Level 1: Completeness Check
  - VERIFY: All 21 failing tests identified
  - VERIFY: Each test's expectation documented
  - VERIFY: Each implementation call documented

Level 2: Analysis Quality
  - VERIFY: Root cause identified correctly
  - VERIFY: Recommendation has clear rationale
  - VERIFY: Options considered (test fix vs impl fix)

Level 3: Documentation
  - VERIFY: Analysis document exists
  - VERIFY: Research notes saved
  - VERIFY: Recommendation is actionable
```

## Key Decisions Made

### Decision 1: Research Scope
- **Include**: All 21 failing tests
- **Include**: Complete implementation logging analysis
- **Include**: Best practices research
- **Exclude**: Actual fix implementation (that's P3.M1.T1.S2)

### Decision 2: Output Format
- **Primary**: Analysis document at architecture/logging-test-analysis.md
- **Secondary**: Research notes in research/ subdirectory
- **Recommendation**: Clear statement on whether to fix tests or implementation

### Decision 3: Recommendation Criteria
- Factor 1: Architectural alignment (Pino vs console.log)
- Factor 2: Test coverage impact
- Factor 3: Implementation effort
- Factor 4: Best practices alignment

## Template Section Mapping

### Goal Section
- Feature Goal: Analyze test expectations vs implementation logging
- Deliverable: Analysis document with recommendation
- Success Definition: Clear, actionable recommendation

### Why Section
- Business value: 21 failing tests block deployment
- Integration: Enables P3.M1.T1.S2 (actual fix)
- Problem: Test-implementation misalignment needs resolution

### What Section
- Analyze 21 failing Task Orchestrator logging tests
- Compare test expectations with implementation
- Research best practices for Pino logger testing
- Provide actionable recommendation

### Context Section
- Populate with specific file references
- Include line numbers for all failing tests
- Document mock setup analysis
- Include research documentation references

### Implementation Blueprint
- Tasks for reading/analyzing files
- Tasks for comparison and categorization
- Tasks for research and documentation
- NO implementation tasks (that's next subtask)

### Validation Section
- Completeness checks
- Analysis quality validation
- Documentation verification

## Anti-Patterns to Avoid

- ❌ Don't implement the fix in this task (that's P3.M1.T1.S2)
- ❌ Don't make assumptions without reading actual code
- ❌ Don't skip analyzing all 21 tests
- ❌ Don't ignore best practices research
- ❌ Don't provide vague recommendations

## Information Density Checklist

- [ ] Specific file paths with line numbers
- [ ] Exact test names for all 21 failures
- [ ] Complete implementation logging patterns
- [ ] Mock setup analysis with code examples
- [ ] Best practices with URLs
- [ ] Clear recommendation with rationale
- [ ] Actionable next steps

## Confidence Score Estimation

**Expected Confidence**: 10/10

**Rationale**:
- Clear task boundaries (research only)
- Comprehensive research already conducted
- All source files identified and accessible
- Best practices research complete
- Template structure clear
- No implementation ambiguity

**Potential Risks**:
- Risk 1: May find edge cases not covered in initial analysis (Low - research task allows discovery)
- Risk 2: Recommendation may depend on architectural decisions not yet made (Low - can provide options)

## Success Metrics

**Research Completeness**:
- [ ] All 21 tests analyzed
- [ ] All implementation logging mapped
- [ ] Best practices documented
- [ ] Recommendation provided

**Documentation Quality**:
- [ ] Analysis document is comprehensive
- [ ] Research notes are organized
- [ ] Recommendation is actionable
- [ ] Next steps are clear

**Template Compliance**:
- [ ] All required sections complete
- [ ] Context YAML is specific and actionable
- [ ] Implementation tasks are ordered correctly
- [ ] Validation gates are comprehensive
