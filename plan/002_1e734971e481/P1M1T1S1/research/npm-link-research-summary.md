# npm Link Configuration Research Summary

## Research Date: 2026-01-15
## Subtask: P1.M1.T1.S1 - Validate npm link configuration

---

## Key Findings

### Critical Discovery: Contract Definition Discrepancy

**Contract Definition States:**
> "Existing package.json has dependency on 'groundswell' with local linking via npm link."

**Reality:**
- `package.json` does NOT contain groundswell dependency
- `npm list groundswell` returns empty (no link exists)
- Project uses path alias in `vitest.config.ts` instead:
  ```typescript
  groundswell: new URL('../groundswell/dist/index.js', import.meta.url).pathname
  ```

**Implication:** This PRP must address the validation of npm link configuration as a CHECK operation, not an assumption of existing state.

---

## Groundswell Library Details

**Location:** `~/projects/groundswell`

**Package Information:**
```json
{
  "name": "groundswell",
  "version": "0.0.3",
  "main": "./dist/index.js",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

**Module Format:** ESM (ES Modules)

**Requirements:** Node.js 18+, TypeScript 5.2+

---

## npm Link Verification Commands

### 1. Check Link Status
```bash
npm list groundswell
# Expected output: Either shows version or empty (if not linked)
```

### 2. Check Symlink (Linux/Mac)
```bash
ls -la node_modules/groundswell
# Should show symlink if linked: groundswell -> ~/projects/groundswell
readlink -f node_modules/groundswell
# Should resolve to absolute path
```

### 3. Check Global Links
```bash
npm list -g --depth=0 --link=true
# Shows globally linked packages
```

---

## npm Link Creation/Repair Workflow

### If Link is Broken or Missing:
```bash
# Step 1: Build Groundswell (ensure dist/ is current)
cd ~/projects/groundswell
npm run build

# Step 2: Create global link
cd ~/projects/groundswell
npm link

# Step 3: Link into hacky-hack
cd /home/dustin/projects/hacky-hack
npm link groundswell

# Step 4: Verify
npm list groundswell
ls -la node_modules/groundswell
```

---

## TypeScript Import Resolution

### Current Configuration (vitest.config.ts)
```typescript
resolve: {
  alias: {
    groundswell: new URL('../groundswell/dist/index.js', import.meta.url).pathname
  }
}
```

### TypeScript Module Resolution (tsconfig.json)
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### Verification Command
```bash
npx tsc --noEmit
# Should complete without module resolution errors
```

---

## Common Gotchas

1. **Build First**: Always run `npm run build` in groundswell before linking
2. **ESM Only**: Groundswell is ESM-only, won't work with `require()`
3. **Path Alias vs npm link**: Current setup uses vitest path alias, npm link is for runtime
4. **Type Definitions**: Ensure `dist/index.d.ts` exists for TypeScript resolution
5. **Permission Issues**: May need sudo for global link on some systems

---

## Validation Output Format

```typescript
interface NpmLinkValidationResult {
  success: boolean;
  linkedPath: string | null;
  errorMessage?: string;
  isSymlink: boolean;
  symlinkTarget?: string;
  typescriptResolves: boolean;
  packageJsonEntry?: string;
}
```

---

## References

### External Documentation
- npm link: https://docs.npmjs.com/cli/v10/commands/npm-link
- Node.js module resolution: https://nodejs.org/api/modules.html
- TypeScript moduleResolution: https://www.typescriptlang.org/tsconfig#moduleResolution

### Internal Documentation
- `plan/002_1e734971e481/architecture/groundswell_analysis.md` - Full API surface
- `plan/002_1e734971e481/architecture/system_context.md` - System context
- `vitest.config.ts` - Current path alias configuration
- `tests/unit/utils/groundswell-linker.test.ts` - Existing link test patterns

---

## Research Notes

1. The project currently works WITHOUT npm link due to vitest path alias
2. npm link is primarily needed for:
   - Runtime import resolution (when running compiled code)
   - Consistent import behavior across test and runtime
   - Proper package.json dependency tracking
3. The vitest path alias ONLY works for test environment, not production builds
