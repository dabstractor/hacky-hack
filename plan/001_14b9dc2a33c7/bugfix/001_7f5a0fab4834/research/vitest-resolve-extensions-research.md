# Vitest resolve.extensions Research Summary

**Research Date:** 2025-01-15
**Research Context:** Phase 2 Milestone 3 - Vitest Configuration Improvements
**Related Task:** P2.M3.T1 - Fix module resolution in vitest.config.ts

---

## Executive Summary

This research document provides comprehensive information about Vitest's `resolve.extensions` configuration, best practices for TypeScript projects, and specific considerations for the hacky-hack project.

**Key Finding:** The current vitest.config.ts has `extensions: ['.ts', '.js']` but is **missing `.tsx`**, which could cause module resolution issues if JSX/TSX files are added to the project in the future.

---

## 1. Official Documentation References

### Vitest Documentation
- **Main Config Reference:** https://vitest.dev/config/
- **resolve.extensions:** https://vitest.dev/config/#resolve-extensions
  - Vitest inherits resolve configuration from Vite
  - Controls file extensions that are automatically resolved when importing modules

### Vite Documentation (Parent Project)
- **Shared Options:** https://vitejs.dev/config/shared-options.html#resolve-extensions
- **Default Extensions:** Vite's default is `['.mjs', '.js', '.mts', '.cjs', '.cts', '.jsx', '.tsx', '.ts', '.json']`

### TypeScript Documentation
- **Module Resolution:** https://www.typescriptlang.org/tsconfig#moduleResolution
- **NodeNext Strategy:** https://www.typescriptlang.org/docs/handbook/modules/reference.html#modulenext

---

## 2. Extension Order Best Practices for TypeScript Projects

### Recommended Order (Priority-Based)

The extensions array should be ordered from **most specific to least specific** to prevent ambiguity:

```typescript
// Recommended for TypeScript + Vitest projects
extensions: [
  '.tsx',   // TypeScript + JSX (React components, UI files)
  '.ts',    // TypeScript (main source files)
  '.jsx',   // JavaScript + JSX (if you have mixed JS/TSX)
  '.js',    // JavaScript (legacy or compiled files)
  '.json'   // JSON configuration files
]
```

### Why This Order Matters

1. **Prevents Ambiguity:** If you have both `App.tsx` and `App.js`, the order determines which gets imported
2. **TypeScript First:** TypeScript files should be resolved before JavaScript for type safety
3. **JSX Before Non-JSX:** `.tsx` should come before `.ts` because it's more specific
4. **JSON Last:** `.json` should always be last to avoid conflicts with code files

### Alternative Order (If No JSX Used)

```typescript
// For pure TypeScript projects without JSX
extensions: ['.ts', '.js', '.json']
```

---

## 3. The .tsx Extension Specific Considerations

### What is .tsx?
- **File Extension:** TypeScript + JSX (JavaScript XML)
- **Use Case:** React components, Vue JSX components, or any JSX syntax in TypeScript
- **Key Difference:** Enables JSX syntax parsing while maintaining TypeScript type checking

### Current Project Status
```bash
# Analysis of hacky-hack project:
- .tsx files found: 0
- .jsx files found: 0
- Current extensions: ['.ts', '.js']
- .tsx is MISSING from configuration
```

### Should You Add .tsx?

**Yes, add it proactively** because:
1. **Future-Proofing:** If UI components or React-like files are added later
2. **Consistency:** Matches Vite's default behavior
3. **No Downside:** Including unused extensions doesn't hurt performance
4. **Best Practice:** Follows Vite's recommended defaults

### If You Add .tsx, Where Should It Go?

```typescript
// Current: ['.ts', '.js']
// Recommended: ['.tsx', '.ts', '.js', '.json']
//              ^^^^^ Add here, BEFORE .ts

extensions: ['.tsx', '.ts', '.js', '.json']
```

**Why before .ts?**
- `.tsx` is more specific (includes JSX capability)
- If you have `Component.tsx` and `Component.ts`, `.tsx` should take priority
- Prevents accidentally importing the non-JSX version

---

## 4. Common Pitfalls When Configuring Extensions

### Pitfall 1: Missing .tsx Extension
**Problem:** Project adds JSX components but forgets to update extensions
**Symptom:** "Cannot find module" errors for .tsx files
**Solution:** Add `.tsx` to extensions array proactively

### Pitfall 2: Wrong Order Leading to Wrong File Resolution
**Problem:** Extensions in wrong order cause wrong file to be imported
**Example:**
```typescript
// BAD: ['.js', '.ts', '.tsx']
// If you have utils.js and utils.ts, it will import utils.js

// GOOD: ['.tsx', '.ts', '.js']
// Resolves TypeScript files first
```

### Pitfall 3: Forgetting .json Extension
**Problem:** Cannot import JSON files in tests
**Symptom:** "Cannot find module './config.json'"
**Solution:** Always include `.json` at the end of extensions array

### Pitfall 4: Not Matching TypeScript Configuration
**Problem:** Vitest extensions don't match tsconfig.json settings
**Impact:** Inconsistent resolution between build and test
**Solution:** Ensure Vitest and TypeScript configurations align

### Pitfall 5: Case Sensitivity Issues
**Problem:** Extensions are case-sensitive on some systems
**Example:** `.TS` vs `.ts` on Linux
**Solution:** Always use lowercase extensions

### Pitfall 6: Overriding Vite Defaults Without Careful Consideration
**Problem:** Custom extensions replace Vite's sensible defaults
**Impact:** May break resolution for common file types
**Solution:** Only override if necessary, and include all needed extensions

---

## 5. Should .json Be Included?

### Short Answer: **YES**

### Why Include .json?
1. **Configuration Files:** Tests often import JSON config files
2. **Mock Data:** Test fixtures are commonly stored as JSON
3. **Package.json:** May need to import package metadata in tests
4. **TypeScript Support:** tsconfig.json has `"resolveJsonModule": true` (your project has this)
5. **Vite Default:** Vite includes `.json` by default

### Example Use Case:
```typescript
// In your test file
import config from './fixtures/test-config.json';
import packageInfo from '../../../package.json';

// This only works if '.json' is in extensions
```

### Recommended Configuration:
```typescript
extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
//                                                    ^^^^^^ Always include
```

---

## 6. Specific Gotchas with .tsx in Vitest

### Gotcha 1: JSX Transformer Configuration
**Issue:** `.tsx` files require JSX transformer configuration
**Solution Needed:** Configure esbuild options in vitest.config.ts

```typescript
// Your current config has this (GOOD!):
esbuild: {
  target: 'esnext',
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
  },
}
```

**Additional Requirement for .tsx:**
```typescript
// If you add .tsx files, you may need:
esbuild: {
  jsx: 'automatic', // or 'preserve' or 'react'
  // ... other options
}
```

### Gotcha 2: Type Definition Files
**Issue:** `.d.ts` files don't need to be in extensions
**Reason:** TypeScript automatically finds declaration files
**Best Practice:** Don't include `.d.ts` in extensions array

### Gotcha 3: Test File Extensions
**Issue:** Test file patterns must match extensions
**Your Current Config:**
```typescript
include: ['tests/**/*.{test,spec}.ts']
//                                      ^^ Only .ts files
```

**If You Add .tsx Tests:**
```typescript
include: ['tests/**/*.{test,spec}.{ts,tsx}']
//                                ^^^^^^^^^^ Add .tsx here too
```

### Gotcha 4: Coverage Configuration
**Issue:** Coverage must include all source file types
**Your Current Config:**
```typescript
coverage: {
  include: ['src/**/*.ts'],
  //               ^^^^ Only .ts files
}
```

**If You Add .tsx Source Files:**
```typescript
coverage: {
  include: ['src/**/*.{ts,tsx}'],
  //                  ^^^^^^^^^^ Add .tsx here too
}
```

### Gotcha 5: Alias Resolution with .tsx
**Issue:** Path aliases must work with .tsx files
**Your Current Aliases:**
```typescript
alias: {
  '@': new URL('./src', import.meta.url).pathname,
  '#': new URL('./src/agents', import.meta.url).pathname,
  groundswell: new URL('../groundswell/dist/index.js', import.meta.url).pathname,
}
```

**Verification Needed:** Ensure aliases resolve correctly when importing .tsx files
```typescript
// This should work with your current aliases:
import { MyComponent } from '@/components/Button.tsx';
import { Agent } from '#/agent-factory.tsx';
```

### Gotcha 6: Module Resolution Mode
**Issue:** tsconfig.json `"moduleResolution": "NodeNext"` affects .tsx resolution
**Your Config:** You're using `NodeNext` (GOOD - modern resolution)
**Consideration:** Ensure Vitest and TypeScript agree on resolution strategy

---

## 7. Recommended Configuration for hacky-hack

### Current Configuration Analysis
```typescript
// File: vitest.config.ts (lines 49-57)
resolve: {
  alias: {
    '@': new URL('./src', import.meta.url).pathname,
    '#': new URL('./src/agents', import.meta.url).pathname,
    groundswell: new URL('../groundswell/dist/index.js').pathname,
  },
  extensions: ['.ts', '.js'],  // ← MISSING .tsx and .json
}
```

### Recommended Update

```typescript
resolve: {
  alias: {
    '@': new URL('./src', import.meta.url).pathname,
    '#': new URL('./src/agents', import.meta.url).pathname,
    groundswell: new URL('../groundswell/dist/index.js').pathname,
  },
  extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  //             ^^^^^^ Add .tsx first for future-proofing
  //                           ^^^^^ Add .jsx if you might use JSX in .js files
  //                                     ^^^^^^ Add .json for config imports
}
```

### Minimal Update (If Only Fixing Immediate Issue)

```typescript
extensions: ['.ts', '.js', '.json'],  // At least add .json
```

### Full Update (Recommended - Future-Proof)

```typescript
extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
```

---

## 8. Validation Checklist

After updating extensions, verify:

- [ ] All existing tests still pass
- [ ] Can import JSON files in tests (if you have any)
- [ ] Path aliases work with all configured extensions
- [ ] TypeScript compilation still works (`npm run typecheck`)
- [ ] Coverage reporting includes all file types
- [ ] No "Cannot find module" errors in test output
- [ ] Test file patterns match all test extensions used

---

## 9. Migration Steps

If updating the configuration:

1. **Update vitest.config.ts:**
   ```bash
   # Edit line 56 in vitest.config.ts
   # Change: extensions: ['.ts', '.js'],
   # To: extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
   ```

2. **Update test include pattern (if using .tsx tests):**
   ```typescript
   include: ['tests/**/*.{test,spec}.{ts,tsx}'],
   ```

3. **Update coverage include pattern (if using .tsx source):**
   ```typescript
   coverage: {
     include: ['src/**/*.{ts,tsx}'],
   }
   ```

4. **Run tests to verify:**
   ```bash
   npm run test:run
   ```

5. **Check TypeScript compilation:**
   ```bash
   npm run typecheck
   ```

---

## 10. Additional Resources

### Official Documentation
- **Vite Resolve Options:** https://vitejs.dev/config/shared-options.html#resolve-extensions
- **Vitest Config:** https://vitest.dev/config/
- **TypeScript Module Resolution:** https://www.typescriptlang.org/docs/handbook/modules/reference.html

### Community Best Practices
- **Vite Plugin Guide:** https://vitejs.dev/guide/#plugin-recipes
- **Testing Best Practices:** https://vitest.dev/guide/
- **TypeScript with Vite:** https://vitejs.dev/guide/features.html#typescript

### Related Articles
- "Understanding Vite's Module Resolution"
- "Vitest Configuration for TypeScript Projects"
- "JSX and TSX in Modern Build Tools"

---

## 11. Quick Reference

### Extension Order Decision Tree

```
Do you use JSX/TSX files?
├─ Yes → Add .tsx (and .jsx if using JS+JSX)
│   └─ Order: ['.tsx', '.ts', '.jsx', '.js', '.json']
└─ No → Pure TypeScript
    └─ Order: ['.ts', '.js', '.json']

Do you import JSON files in tests?
├─ Yes → MUST include .json
└─ No → Still recommended to include .json
```

### Configuration Template

```typescript
// Full-featured TypeScript + Vitest configuration
resolve: {
  extensions: [
    '.tsx',   // React/UI components with TypeScript
    '.ts',    // Regular TypeScript files
    '.jsx',   // React/UI components with JavaScript (optional)
    '.js',    // Regular JavaScript files
    '.json',  // JSON configuration and data files
  ],
}
```

---

## 12. Conclusion

### Key Takeaways

1. **Current State:** Your vitest.config.ts is missing `.tsx` and `.json` extensions
2. **Immediate Action:** Add `.json` to support config file imports
3. **Future-Proofing:** Add `.tsx` even if you don't use it yet
4. **Order Matters:** Most specific extensions first
5. **No Performance Impact:** Including unused extensions doesn't hurt
6. **Best Practice:** Follow Vite's default extension list

### Recommended Next Steps

1. **Immediate:** Add `.json` to extensions array
2. **Proactive:** Add `.tsx` to extensions array for future-proofing
3. **Verify:** Run test suite to ensure no regressions
4. **Document:** Update this research document if project adds JSX files

### Final Recommended Configuration

```typescript
// vitest.config.ts - Line 56
extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
```

This configuration:
- ✅ Supports all current .ts and .js files
- ✅ Ready for future .tsx/.jsx files
- ✅ Allows importing JSON configs in tests
- ✅ Matches Vite's default behavior
- ✅ Follows best practices for extension ordering
- ✅ Prevents future "Cannot find module" errors

---

**Document Status:** Complete
**Last Updated:** 2025-01-15
**Next Review:** When project adds .tsx/.jsx files or encounters module resolution issues
