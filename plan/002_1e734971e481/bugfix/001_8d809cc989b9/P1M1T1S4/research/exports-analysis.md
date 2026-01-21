# Exports Analysis Research

## Summary of Research Findings

### Core Index Export Pattern

The `src/core/index.ts` file serves as the public API entry point for the core module. Key findings:

1. **Error Exports**: Only `SessionFileError` is currently exported from the core index (line 24)
2. **Pattern**: Error exports are grouped with their functional domains, not in a separate error section
3. **Syntax**: Uses named re-exports: `export { Symbol } from './module.js';`
4. **Extensions**: All imports use `.js` extension (TypeScript ES Module requirement)

### Error Class Locations

- **SessionFileError**: Defined in `src/core/session-utils.ts`, exported via core index
- **SessionError, TaskError, AgentError, ValidationError**: Defined in `src/utils/errors.ts`, NOT exported via core index
- **EnvironmentError**: Defined in `src/utils/errors.ts`, needs to be added to core index exports

### Import Patterns in Codebase

Current imports throughout the codebase use direct paths:

- `import { ValidationError } from '../utils/errors.js';` (direct import)
- Tests import directly: `import { EnvironmentError } from '../../../src/utils/errors.js';`

After this change, developers can choose either:

- Direct import: `import { EnvironmentError } from '../utils/errors.js';`
- Core index import: `import { EnvironmentError } from './core/index.js';`

### Why Other Errors Are Not Exported

The research indicates that `SessionError`, `TaskError`, `AgentError`, and `ValidationError` are intentionally internal to the utils module. Only errors that are part of the public API surface are exported through the core index.

### EnvironmentError Context

From git history and PRD analysis:

- EnvironmentError was implemented in P1.M1.T1.S3
- It's used for environment configuration validation
- It follows the same pattern as other PipelineError subclasses
- The isEnvironmentError type guard was implemented alongside the class

## Conclusion

The PRP should add `EnvironmentError` and `isEnvironmentError` to `src/core/index.ts` following the SessionFileError pattern, creating a new "Environment errors" section after the session management exports.
