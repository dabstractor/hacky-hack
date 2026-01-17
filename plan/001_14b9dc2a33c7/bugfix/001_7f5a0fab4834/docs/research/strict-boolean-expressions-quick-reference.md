# Quick Reference: strict-boolean-expressions Fix Patterns

**Last Updated:** 2026-01-15
**Purpose:** Quick lookup for common fix patterns

---

## Quick Fix Patterns by Type

### Nullable Strings (60% of warnings)

```typescript
// ❌ Before
if (configValue) {
}

// ✅ Fix 1: Explicit null check (most common)
if (configValue !== null && configValue !== undefined) {
}

// ✅ Fix 2: With content check
if (configValue !== null && configValue.length > 0) {
}

// ✅ Fix 3: Optional chaining
if (configValue?.length) {
}

// ✅ Fix 4: Nullish coalescing for defaults
const value = configValue ?? 'default';
```

### Nullable Numbers (20% of warnings)

```typescript
// ❌ Before
if (count > 0) {
} // count might be null

// ✅ Fix 1: Explicit null check
if (count !== null && count > 0) {
}

// ✅ Fix 2: Nullish coalescing
if ((count ?? 0) > 0) {
}

// ✅ Fix 3: For arithmetic
return (count ?? 0) * 2;
```

### Nullable Objects (15% of warnings)

```typescript
// ❌ Before
if (user) {
}
if (user && user.name) {
}

// ✅ Fix 1: Explicit null check
if (user !== null) {
}

// ✅ Fix 2: Optional chaining
if (user?.name) {
}

// ✅ Fix 3: With default
const name = user?.name ?? 'Unknown';
```

### Nullable Booleans (5% of warnings)

```typescript
// ❌ Before
if (flag) {
}
return flag ? true : false;

// ✅ Fix 1: Explicit true check
if (flag === true) {
}

// ✅ Fix 2: Nullish coalescing
return flag ?? false;
```

### Any Types (Complex - requires type review)

```typescript
// ❌ Before
if (value) {
}

// ✅ Fix: Type guard
if (typeof value === 'string' && value) {
}
if (Array.isArray(value) && value.length > 0) {
}
```

---

## Common Before/After Examples

### Example 1: Simple Null Check

```typescript
// ❌ Before
function process(value: string | null) {
  if (value) {
    console.log(value);
  }
}

// ✅ After
function process(value: string | null) {
  if (value !== null) {
    console.log(value);
  }
}
```

### Example 2: Default Value

```typescript
// ❌ Before
function getName(name: string | null): string {
  return name ? name : 'Anonymous';
}

// ✅ After
function getName(name: string | null): string {
  return name ?? 'Anonymous';
}
```

### Example 3: Nested Property Access

```typescript
// ❌ Before
if (config && config.server && config.server.host) {
  return config.server.host;
}

// ✅ After
return config?.server?.host ?? 'localhost';
```

### Example 4: Array Access

```typescript
// ❌ Before
if (items && items.length > 0) {
  return items[0];
}

// ✅ After
return items?.[0] ?? null;
```

### Example 5: Number Comparison

```typescript
// ❌ Before
if (age >= 18) {
} // age might be null

// ✅ After
if (age !== null && age >= 18) {
}
```

---

## Decision Tree

```
Is the value nullable?
├─ Yes → What type?
│   ├─ String →
│   │   Need default value? → value ?? "default"
│   │   Need null check? → value !== null
│   │   Need property access? → value?.length
│   ├─ Number →
│   │   Need comparison? → value !== null && value > 0
│   │   Need arithmetic? → (value ?? 0) * 2
│   ├─ Object →
│   │   Need property? → obj?.property ?? default
│   │   Need check? → obj !== null
│   ├─ Boolean →
│   │   Need check? → flag === true
│   │   Need default? → flag ?? false
│   └─ Any →
│       Add type guard → typeof value === 'string' && value
└─ No → Use standard boolean context
```

---

## Common Pitfalls to Avoid

### Pitfall 1: Using || instead of ??

```typescript
// ❌ Wrong: Treats "", 0, false as null
return value || 'default';

// ✅ Correct: Only null/undefined get default
return value ?? 'default';
```

### Pitfall 2: Forgetting optional chaining

```typescript
// ❌ Wrong: Crashes if user is null
return user.email;

// ✅ Correct: Safe property access
return user?.email;
```

### Pitfall 3: Double negation

```typescript
// ❌ Wrong: Obscure intent
return !!value;

// ✅ Correct: Explicit comparison
return value !== null;
```

---

## ESLint Configuration

```json
{
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": [
      "warn",
      {
        "allowString": false,
        "allowNumber": false,
        "allowNullableObject": false,
        "allowNullableBoolean": false,
        "allowNullableString": false,
        "allowNullableNumber": false,
        "allowAny": false
      }
    ]
  }
}
```

---

## Disable for Specific Lines

```typescript
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
if (legacyValue) {
  // Hard to fix right now
}
```

---

## Effort Estimation

| Pattern Type          | Frequency | Fix Time  | Complexity       |
| --------------------- | --------- | --------- | ---------------- |
| Simple nullable check | 60%       | 1-2 min   | Trivial (0.5 SP) |
| Optional chaining     | 15%       | 1-2 min   | Trivial (0.5 SP) |
| Nullish coalescing    | 10%       | 2-3 min   | Trivial (0.5 SP) |
| Logic refinement      | 10%       | 5-10 min  | Moderate (1 SP)  |
| Type refactoring      | 5%        | 30-45 min | Complex (2 SP)   |

---

## Resources

- **Full Guide**: `./strict-boolean-expressions-comprehensive-guide.md`
- **Official Docs**: https://typescript-eslint.io/rules/strict-boolean-expressions/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/

---

**Remember**: The goal is type safety and explicit intent. Always make your null checks clear and intentional.
