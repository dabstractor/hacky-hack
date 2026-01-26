# CLI Error Reporting Research Summary

**Research Date:** 2025-01-24
**Session:** 003_b3d3efdaf0ed
**Phase:** P2
**Milestone:** M3
**Task:** T2
**Subtask:** S2

## Overview

This research document compiles best practices for error reporting in CLI tools and developer tools, with specific focus on enhancing the ERROR_REPORT.md generation for the hacky-hack project.

## Research Documents

### 1. [Error Formatting Best Practices](./01-error-formatting-best-practices.md)

**Focus:** CLI error message formatting, structure, and presentation

**Key Findings:**

- Three-level information hierarchy: What → Why → How
- Consistent error structure with categories and codes
- Real-world examples from kubectl, Docker, npm, Git, and AWS CLI
- Color palette standards for semantic meaning
- Error builder and formatter patterns

**Actionable Items:**

- Implement error categories (FILE_SYSTEM, NETWORK, VALIDATION, etc.)
- Create error builder class for consistent formatting
- Use structured sections (Context, Problem, Impact, Solution)
- Support verbose mode for detailed debugging

---

### 2. [Error Timeline Visualization](./02-error-timeline-visualization.md)

**Focus:** Visualizing when errors occurred in time

**Key Findings:**

- Three timeline patterns: horizontal, vertical, compact
- Chronological error log formats
- Time-based grouping (by phase, error type, time windows)
- Progress context integration with timelines
- Real-time timeline updates during execution

**Actionable Items:**

- Add timestamps to all error events
- Track retry attempts with timing
- Show cascade effects with wait times
- Integrate with progress bars for visual context
- Support timeline filtering and grouping

---

### 3. [Stack Trace Presentation](./03-stack-trace-presentation.md)

**Focus:** Stack trace formatting and presentation

**Key Findings:**

- Four presentation patterns: condensed, detailed, grouped, interactive
- Frame filtering strategies (user vs library code)
- Source code context display with syntax highlighting
- Error source highlighting with pointers
- Support for source maps

**Actionable Items:**

- Collapse library/internal frames by default
- Show source code context around error lines
- Implement frame filtering by relevance
- Add --verbose flag for full stack traces
- Support source map resolution for minified code

---

### 4. [Suggested Fixes and Documentation Linking](./04-suggested-fixes-and-documentation.md)

**Focus:** How to suggest fixes and link to documentation

**Key Findings:**

- Three-level suggestion system: immediate action, understanding, deep dive
- Smart error recommendations with pattern matching
- Context-aware recommendations based on environment
- Command generation for fixes
- Documentation link taxonomy

**Actionable Items:**

- Create error recommendation engine with pattern matching
- Generate exact commands for common fixes
- Link to relevant documentation sections
- Provide alternative solutions
- Include prevention tips

---

### 5. [Affected Tasks and Dependencies](./05-affected-tasks-and-dependencies.md)

**Focus:** Identifying and displaying affected tasks

**Key Findings:**

- Dependency graph analysis with traversal algorithms
- Task impact assessment with severity levels
- Three visualization patterns: tree, graph, cascade
- Cascade effect tracking with wait times
- Critical path identification

**Actionable Items:**

- Build dependency graph for all tasks
- Calculate impact level for each error
- Show blocked work in tree format
- Track cascade effects with timing
- Display affected phases, milestones, and tasks

---

### 6. [Resume Command Generation](./06-resume-command-generation.md)

**Focus:** Generating resume commands and skip strategies

**Key Findings:**

- Multiple resume patterns: direct, skip, retry, conditional
- Skip strategy decision tree
- Four recovery workflows
- Command builder patterns
- Smart command generator with alternatives

**Actionable Items:**

- Generate resume commands for each error scenario
- Provide skip alternatives when safe
- Support interactive mode for complex scenarios
- Include context in retry commands
- Show multiple recovery options

---

## Implementation Roadmap

### Phase 1: Core Error Structure (Week 1)

1. Implement error categories and codes
2. Create error builder class
3. Build error formatter with structured output
4. Add color palette and icon system

### Phase 2: Timeline and Tracking (Week 2)

1. Add timestamps to all error events
2. Track retry attempts and resolutions
3. Build dependency graph analyzer
4. Implement cascade tracking

### Phase 3: Smart Recommendations (Week 3)

1. Create error pattern matching engine
2. Build recommendation system
3. Generate fix commands automatically
4. Link to documentation

### Phase 4: Visualization (Week 4)

1. Implement timeline visualization
2. Add stack trace presentation
3. Create impact display system
4. Build resume command generator

### Phase 5: Integration (Week 5)

1. Integrate into ERROR_REPORT.md generation
2. Add CLI output modes (auto/always/never)
3. Test with real error scenarios
4. Document and refine

---

## Key Principles Summary

### 1. **Actionability First**

- Always provide exact commands to fix issues
- Show the most important information first
- Use plain language before technical details

### 2. **Consistent Structure**

- Use standard error format across all errors
- Maintain consistent color and icon semantics
- Follow established CLI patterns

### 3. **Progressive Disclosure**

- Show concise errors by default
- Use --verbose for detailed information
- Collapse library/internal code frames

### 4. **Contextual Awareness**

- Include task and session information
- Show impact on dependent tasks
- Provide timeline context

### 5. **Multiple Recovery Paths**

- Offer primary recommendation first
- Provide alternative approaches
- Support skip, retry, and continue options

---

## Recommended Libraries

### Core Display

- `chalk` - Terminal string styling
- `cli-table3` - Table formatting
- `cli-progress` - Progress bars (already in use)

### Enhanced Features

- `figures` - Unicode symbols
- `ora` - Terminal spinners
- `boxen` - Box formatting for emphasis
- `prompts` or `inquirer` - Interactive prompts

### Graph & Timeline

- `graphlib` - Graph algorithms
- `date-fns` - Date formatting
- `asciitree` - ASCII tree generation

---

## Real-World Examples Studied

1. **kubectl**
   - Error codes in parentheses
   - Suggests --help flag
   - Verbose mode for debugging

2. **Docker**
   - Full error paths shown
   - Multiple possible causes listed
   - Always references help command

3. **npm**
   - Error codes for parsing (ELIFECYCLE)
   - Exit status codes
   - Log file locations

4. **Git**
   - `fatal:` prefix for critical errors
   - Exact commands provided
   - Hint system for alternatives

5. **AWS CLI**
   - Error codes in parentheses
   - Operation names shown
   - Debug mode with full HTTP exchange

---

## Success Criteria

The ERROR_REPORT.md generation should be considered successful when:

- [ ] All errors follow consistent format
- [ ] Each error includes at least one suggested fix
- [ ] Timeline shows when errors occurred
- [ ] Stack traces are collapsed by default
- [ ] Affected tasks are clearly listed
- [ ] Resume commands are generated
- [ ] Documentation links are included
- [ ] Multiple recovery options are shown
- [ ] Impact severity is assessed
- [ ] Cascade effects are tracked

---

## Next Steps

1. **Review and Approval**: Have research reviewed by team
2. **Design Validation**: Create mockups of error reports
3. **Prototype Implementation**: Build proof of concept
4. **Integration Planning**: Plan integration with existing codebase
5. **Documentation**: Update development guides with new patterns

---

## References

### External Resources

- **clig.dev**: https://clig.dev/ - Command-Line Interface Guidelines
- **GNU Coding Standards**: CLI interface best practices
- **Node.js Error Handling**: https://nodejs.org/api/errors.html
- **V8 Stack Trace API**: https://v8.dev/docs/stack-trace-api

### Internal Resources

- `/home/dustin/projects/hacky-hack/src/utils/display/status-colors.ts` - Current color system
- `/home/dustin/projects/hacky-hack/src/utils/display/table-formatter.ts` - Table formatting
- `/home/dustin/projects/hacky-hack/package.json` - Current dependencies

### Related Tools

- kubectl: https://kubernetes.io/docs/reference/kubectl/
- Docker CLI: https://docs.docker.com/engine/reference/commandline/cli/
- npm CLI: https://docs.npmjs.com/cli/
- Git: https://git-scm.com/docs/git
- AWS CLI: https://docs.aws.amazon.com/cli/

---

**Document Version:** 1.0
**Last Updated:** 2025-01-24
**Status:** Complete
