# TypeScript Module Resolution Research

This directory contains comprehensive research and tools for TypeScript module resolution, specifically focused on:

- **NodeNext mode** - Modern ES module resolution for Node.js 16+
- **Local packages** - TypeScript path mapping and workspace configuration
- **npm linked packages** - Development-time package linking
- **Verification tools** - Testing and validating import resolution

## 📚 Documentation Files

### [typescript-module-resolution-research.md](../typescript-module-resolution-research.md)
**Comprehensive research documentation** covering:
- Official TypeScript documentation links
- NodeNext module resolution details
- TypeScript paths configuration
- npm link integration
- Common issues and solutions
- Configuration examples
- Best practices

**Use this for:** Deep understanding of TypeScript module resolution concepts and troubleshooting.

### [typescript-resolution-quick-reference.md](../typescript-resolution-quick-reference.md)
**Quick reference guide** for common tasks:
- Fast verification commands
- Common error codes and fixes
- Quick checklist for npm link setup
- Troubleshooting flow
- Essential commands

**Use this for:** Quick lookup when solving module resolution issues.

### [research-summary.md](../research-summary.md)
**Executive summary** of research findings:
- Key findings overview
- Configuration examples
- Best practices
- Tool descriptions

**Use this for:** Understanding the research outcomes at a glance.

## 🛠️ Tools

### [verify-module-resolution.ts](../../scripts/verify-module-resolution.ts)
**TypeScript module resolution verifier**

```bash
# Basic verification
npx tsx scripts/verify-module-resolution.ts

# Verbose mode (shows all resolved modules)
npx tsx scripts/verify-module-resolution.ts --verbose

# Check specific project
npx tsx scripts/verify-module-resolution.ts --project=./packages/app
```

**What it does:**
- Checks all imports can be resolved
- Reports module resolution errors
- Shows detailed resolution information in verbose mode
- Compatible with any TypeScript project

**Use this for:** Verifying TypeScript can resolve all imports in your project.

### [test-import-resolution.ts](../../scripts/test-import-resolution.ts)
**Comprehensive test suite for module resolution**

```bash
# Run all tests
npx tsx scripts/test-import-resolution.ts
```

**What it tests:**
- TypeScript compilation (tsc --noEmit)
- Configuration existence
- npm linked packages detection
- package.json exports configuration
- Import resolution with sample code
- TypeScript version compatibility

**Use this for:** Validating your entire module resolution setup.

## 🚀 Quick Start

### 1. Verify Your Current Setup

```bash
# Quick check
npx tsc --noEmit

# Detailed check
npx tsx scripts/verify-module-resolution.ts
```

### 2. Set Up npm Link

```bash
# Build the package to link
cd ../local-package
npm run build

# Create global link
npm link

# Link into your project
cd ../your-project
npm link local-package

# Verify
npx tsc --noEmit
```

### 3. Troubleshoot Issues

```bash
# Check configuration
npx tsx scripts/test-import-resolution.ts

# Trace resolution
npx tsc --noEmit --traceResolution

# Check symlink
ls -la node_modules/linked-package
```

## 📖 Common Scenarios

### Scenario 1: "Cannot find module" Error

```bash
# 1. Build the package
cd ../local-package && npm run build

# 2. Verify link exists
ls -la node_modules/local-package

# 3. Check type declarations
ls ../local-package/dist/*.d.ts

# 4. Verify resolution
npx tsc --noEmit
```

### Scenario 2: Setting Up Local Package Development

```bash
# 1. Configure tsconfig paths
# Add to tsconfig.json:
# {
#   "compilerOptions": {
#     "baseUrl": ".",
#     "paths": {
#       "@local-pkg": ["../local-pkg/src"]
#     }
#   }
# }

# 2. Use in code
import { foo } from '@local-pkg';

# 3. Verify
npx tsc --noEmit
```

### Scenario 3: Monorepo Setup

```bash
# 1. Use project references
# In root tsconfig.json:
# {
#   "files": [],
#   "references": [
#     { "path": "./packages/shared" },
#     { "path": "./packages/app" }
#   ]
# }

# 2. Build in order
cd packages/shared && npm run build
cd ../app && npm run build

# 3. Verify
npx tsc --noEmit --build
```

## 🔍 Key Concepts

### NodeNext Module Resolution

Modern TypeScript resolution strategy for Node.js ES modules:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

**Key features:**
- Requires `.js` extensions for ES module imports
- Respects `package.json` `type` field
- Supports conditional exports
- Handles both ESM and CommonJS

### TypeScript Paths

Compile-time path mapping for local packages:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared": ["../shared/src"]
    }
  }
}
```

**Important:** Paths are compile-time only. Runtime requires npm link or bundler configuration.

### npm Link

Development-time package linking:

```bash
cd ../package && npm link
cd . && npm link package
```

**Requirements:**
- Package must be built (`.d.ts` files generated)
- `types` field in package.json
- Matching `module` settings

## 📚 Additional Resources

### Official Documentation
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [tsconfig Reference](https://www.typescriptlang.org/tsconfig)
- [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

### Community
- [TypeScript GitHub Issues](https://github.com/microsoft/TypeScript/issues)
- [Stack Overflow - TypeScript](https://stackoverflow.com/questions/tagged/typescript)

## 🎯 Best Practices

1. **Always build before linking**
   ```bash
   cd ../pkg && npm run build && npm link
   ```

2. **Use consistent module settings**
   All packages should use the same `module` and `moduleResolution`.

3. **Enable declaration generation**
   ```json
   {
     "compilerOptions": {
       "declaration": true,
       "composite": true
     }
   }
   ```

4. **Verify regularly**
   ```bash
   npx tsc --noEmit
   ```

5. **Use project references for monorepos**
   ```json
   {
     "references": [
       { "path": "../shared" }
     ]
   }
   ```

## 📝 File Structure

```
docs/
├── typescript-module-resolution-research.md    # Comprehensive research
├── typescript-resolution-quick-reference.md    # Quick reference guide
├── research-summary.md                          # Executive summary
└── research/
    └── README.md                               # This file

scripts/
├── verify-module-resolution.ts                 # Verification tool
└── test-import-resolution.ts                   # Test suite
```

## 🤝 Contributing

When adding new research or tools:

1. Update the appropriate documentation file
2. Add examples to the quick reference
3. Update this README with new tools
4. Test tools in real-world scenarios

## 📅 Maintenance

- **Last Updated:** 2026-01-15
- **TypeScript Version:** 5.2.0+
- **Node.js Version:** 20.0.0+

Review and update when:
- New TypeScript versions are released
- New module resolution patterns emerge
- Common issues are discovered

---

**Need help?** Start with the [quick reference guide](../typescript-resolution-quick-reference.md) or run the [verification tool](../../scripts/verify-module-resolution.ts).
