# Comprehensive Guide: ESLint @typescript-eslint/strict-boolean-expressions

**Research Date:** 2026-01-15
**Rule:** @typescript-eslint/strict-boolean-expressions
**Context:** TypeScript nullable type handling and fix patterns

---

## Table of Contents

1. [Understanding the Rule](#1-understanding-the-rule)
2. [What the Rule Checks For](#2-what-the-rule-checks-for)
3. [Common Fix Patterns by Type](#3-common-fix-patterns-by-type)
4. [Before/After Code Examples](#4-beforeafter-code-examples)
5. [TypeScript Best Practices](#5-typescript-best-practices)
6. [Common Pitfalls and Anti-Patterns](#6-common-pitfalls-and-anti-patterns)
7. [Configuration Options](#7-configuration-options)
8. [References and Resources](#8-references-and-resources)

---

## 1. Understanding the Rule

### 1.1 What is strict-boolean-expressions?

The `@typescript-eslint/strict-boolean-expressions` rule is designed to catch potential bugs where non-boolean values are used in boolean contexts (like `if`, `while`, `||`, `&&`, `!`, etc.) in TypeScript.

### 1.2 Why This Rule Matters

**Problem Statement:**
In JavaScript and TypeScript, values like `null`, `undefined`, `0`, `""`, `false`, and `NaN` are "falsy", while all other values are "truthy". This can lead to subtle bugs:

```typescript
// Bug: Empty string is falsy, but what if we want to treat it differently?
function greet(name: string | null) {
  if (name) {  // ❌ Won't execute for name = ""
    console.log(`Hello ${name}`);
  }
}

greet("");  // Silent failure - no greeting printed
greet(null); // Expected behavior
```

**Solution:**
The rule forces explicit checks, making intent clear:

```typescript
function greet(name: string | null) {
  if (name !== null) {  // ✅ Explicit null check
    console.log(`Hello ${name}`);
  }
}

greet("");  // ✅ Prints "Hello "
greet(null); // ✅ Skips greeting
```

### 1.3 Official Documentation

**Primary Source:**
- **typescript-eslint strict-boolean-expressions rule**: https://typescript-eslint.io/rules/strict-boolean-expressions/
- **GitHub Repository**: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/docs/rules/strict-boolean-expressions.mdx

---

## 2. What the Rule Checks For

### 2.1 Detected Patterns

The rule checks for the following patterns in boolean contexts:

#### 2.1.1 Nullable Types
```typescript
// Nullable string
let value: string | null;
if (value) { } // ❌ Warning

// Nullable number
let count: number | undefined;
if (count > 0) { } // ❌ Warning

// Nullable object
let user: User | null;
if (user) { } // ❌ Warning
```

#### 2.1.2 Non-Boolean Literal Types
```typescript
// String type in boolean context
let name: string;
if (name) { } // ❌ Warning (allowString can override)

// Number type in boolean context
let length: number;
if (length) { } // ❌ Warning (allowNumber can override)

// Object type in boolean context
let config: Config;
if (config) { } // ❌ Warning (allowObject can override)
```

#### 2.1.3 Any Types
```typescript
// Any type loses type safety
let value: any;
if (value) { } // ❌ Warning (allowAny can override)
```

#### 2.1.4 Mixed Boolean Expressions
```typescript
// Mixed types in boolean expressions
let a: string | null;
let b: number | undefined;
if (a || b) { } // ❌ Warning
```

### 2.2 Boolean Contexts Checked

The rule checks these contexts:
- `if` statements
- `while` loops
- `do-while` loops
- `for` loop conditions
- Ternary operators (`? :`)
- Logical operators (`&&`, `||`, `!`)
- `case` statements (when comparing to boolean)

---

## 3. Common Fix Patterns by Type

### 3.1 Nullable String Patterns

#### Pattern 1: Null Check with Content Validation
**Use Case:** Check if string exists AND has meaningful content

```typescript
// ❌ Before
function process(value: string | null) {
  if (value) {
    console.log(value.toUpperCase());
  }
}

// ✅ After - Option 1: Explicit null check
function process(value: string | null) {
  if (value !== null && value !== undefined) {
    console.log(value.toUpperCase());
  }
}

// ✅ After - Option 2: Null check with length
function process(value: string | null) {
  if (value !== null && value.length > 0) {
    console.log(value.toUpperCase());
  }
}

// ✅ After - Option 3: Optional chaining with length
function process(value: string | null) {
  if (value?.length > 0) {
    console.log(value.toUpperCase());
  }
}
```

#### Pattern 2: Default Value with Nullish Coalescing
**Use Case:** Provide default value when string is null/undefined

```typescript
// ❌ Before
function getName(name: string | null): string {
  return name ? name : "Anonymous";
}

// ✅ After - Nullish coalescing
function getName(name: string | null): string {
  return name ?? "Anonymous";
}
```

#### Pattern 3: Truthy Check with Null Exclusion
**Use Case:** Check if string has content, treating empty string as valid

```typescript
// ❌ Before
function log(value: string | null) {
  if (value) {
    console.log(value);
  }
}

// ✅ After - Explicit null check only
function log(value: string | null) {
  if (value !== null) {
    console.log(value);
  }
}
```

### 3.2 Nullable Number Patterns

#### Pattern 1: Comparison with Null Check
**Use Case:** Compare numbers that might be null

```typescript
// ❌ Before
function isPositive(count: number | null): boolean {
  return count > 0;
}

// ✅ After - Explicit null check
function isPositive(count: number | null): boolean {
  return count !== null && count > 0;
}

// ✅ After - Optional chaining
function isPositive(count: number | null): boolean {
  return (count ?? -1) > 0; // Assumes -1 as "not positive"
}
```

#### Pattern 2: Range Check with Null
**Use Case:** Check if number is within valid range

```typescript
// ❌ Before
function isValidAge(age: number | null): boolean {
  return age >= 18 && age <= 120;
}

// ✅ After - Null check with comparison
function isValidAge(age: number | null): boolean {
  return age !== null && age >= 18 && age <= 120;
}
```

#### Pattern 3: Arithmetic Operations
**Use Case:** Perform arithmetic only if number exists

```typescript
// ❌ Before
function double(value: number | null): number {
  if (value) {
    return value * 2;
  }
  return 0;
}

// ✅ After - Explicit null check
function double(value: number | null): number {
  if (value !== null) {
    return value * 2;
  }
  return 0;
}

// ✅ After - Nullish coalescing for default
function double(value: number | null): number {
  return (value ?? 0) * 2;
}
```

### 3.3 Nullable Object Patterns

#### Pattern 1: Property Access with Null Check
**Use Case:** Access object properties safely

```typescript
interface User {
  name: string;
  email: string;
}

// ❌ Before
function getUserName(user: User | null): string {
  if (user) {
    return user.name;
  }
  return "Unknown";
}

// ✅ After - Explicit null check
function getUserName(user: User | null): string {
  if (user !== null && user !== undefined) {
    return user.name;
  }
  return "Unknown";
}

// ✅ After - Optional chaining
function getUserName(user: User | null): string {
  return user?.name ?? "Unknown";
}
```

#### Pattern 2: Nested Property Access
**Use Case:** Access deeply nested properties

```typescript
interface Config {
  server?: {
    host?: string;
    port?: number;
  };
}

// ❌ Before
function getServerUrl(config: Config | null): string {
  if (config && config.server && config.server.host) {
    return config.server.host;
  }
  return "localhost";
}

// ✅ After - Optional chaining
function getServerUrl(config: Config | null): string {
  return config?.server?.host ?? "localhost";
}
```

#### Pattern 3: Array/Object Methods
**Use Case:** Call methods on nullable objects

```typescript
// ❌ Before
function processItems(items: string[] | null) {
  if (items) {
    return items.map(i => i.toUpperCase());
  }
  return [];
}

// ✅ After - Explicit null check
function processItems(items: string[] | null) {
  if (items !== null) {
    return items.map(i => i.toUpperCase());
  }
  return [];
}

// ✅ After - Nullish coalescing
function processItems(items: string[] | null) {
  return (items ?? []).map(i => i.toUpperCase());
}
```

### 3.4 Nullable Boolean Patterns

#### Pattern 1: Explicit Boolean Check
**Use Case:** Check boolean that might be null

```typescript
// ❌ Before
function isEnabled(flag: boolean | null): boolean {
  return flag ? true : false;
}

// ✅ After - Explicit null check
function isEnabled(flag: boolean | null): boolean {
  return flag === true;
}

// ✅ After - Nullish coalescing
function isEnabled(flag: boolean | null): boolean {
  return flag ?? false;
}
```

#### Pattern 2: Boolean Logic with Null
**Use Case:** Combine nullable boolean with other conditions

```typescript
// ❌ Before
function shouldProcess(enabled: boolean | null, hasData: boolean): boolean {
  return enabled && hasData;
}

// ✅ After - Explicit null handling
function shouldProcess(enabled: boolean | null, hasData: boolean): boolean {
  return (enabled ?? false) && hasData;
}
```

### 3.5 Any Type Patterns

#### Pattern 1: Type Guard for Any
**Use Case:** Add type safety when dealing with any

```typescript
// ❌ Before
function process(value: any) {
  if (value) {
    console.log(value.toString());
  }
}

// ✅ After - Type guard
function process(value: any) {
  if (typeof value === 'string' && value) {
    console.log(value.toUpperCase());
  } else if (typeof value === 'number' && value !== null) {
    console.log(value * 2);
  }
}
```

#### Pattern 2: Type Assertion with Check
**Use Case:** Assert to specific type with validation

```typescript
// ❌ Before
function getValueLength(value: any): number {
  if (value) {
    return value.length;
  }
  return 0;
}

// ✅ After - Type guard
function getValueLength(value: any): number {
  if (typeof value === 'string' && value !== null) {
    return value.length;
  }
  if (Array.isArray(value) && value !== null) {
    return value.length;
  }
  return 0;
}
```

---

## 4. Before/After Code Examples

### 4.1 String Examples

#### Example 1: String Trimming and Validation
```typescript
// ❌ Before
function sanitize(input: string | null): string {
  if (input) {
    return input.trim();
  }
  return "";
}

// ✅ After
function sanitize(input: string | null): string {
  if (input !== null) {
    return input.trim();
  }
  return "";
}

// ✅ After - More concise
function sanitize(input: string | null): string {
  return input?.trim() ?? "";
}
```

#### Example 2: String Concatenation
```typescript
// ❌ Before
function buildName(first: string | null, last: string | null): string {
  let result = "";
  if (first) result += first;
  if (last) result += " " + last;
  return result.trim();
}

// ✅ After
function buildName(first: string | null, last: string | null): string {
  const parts = [first, last].filter((part): part is string => part !== null);
  return parts.join(" ");
}
```

### 4.2 Number Examples

#### Example 1: Sum with Null Handling
```typescript
// ❌ Before
function sum(a: number | null, b: number | null): number {
  if (a && b) {
    return a + b;
  }
  return a ? a : b ? b : 0;
}

// ✅ After
function sum(a: number | null, b: number | null): number {
  return (a ?? 0) + (b ?? 0);
}
```

#### Example 2: Percentage Calculation
```typescript
// ❌ Before
function getPercentage(value: number | null, total: number | null): number {
  if (value && total) {
    return (value / total) * 100;
  }
  return 0;
}

// ✅ After
function getPercentage(value: number | null, total: number | null): number {
  if (value !== null && total !== null && total !== 0) {
    return (value / total) * 100;
  }
  return 0;
}
```

### 4.3 Object Examples

#### Example 1: Configuration Access
```typescript
interface Config {
  debug?: boolean;
  logLevel?: string;
}

// ❌ Before
function getLogLevel(config: Config | null): string {
  if (config && config.logLevel) {
    return config.logLevel;
  }
  return "info";
}

// ✅ After
function getLogLevel(config: Config | null): string {
  return config?.logLevel ?? "info";
}
```

#### Example 2: Nested Object Access
```typescript
interface Response {
  data?: {
    user?: {
      profile?: {
        avatar?: string;
      };
    };
  };
}

// ❌ Before
function getAvatar(response: Response | null): string {
  if (response && response.data && response.data.user && response.data.user.profile) {
    return response.data.user.profile.avatar;
  }
  return "default.png";
}

// ✅ After
function getAvatar(response: Response | null): string {
  return response?.data?.user?.profile?.avatar ?? "default.png";
}
```

### 4.4 Array Examples

#### Example 1: Array Operations
```typescript
// ❌ Before
function processList(items: string[] | null): string[] {
  if (items) {
    return items.filter(i => i.length > 0);
  }
  return [];
}

// ✅ After
function processList(items: string[] | null): string[] {
  return (items ?? []).filter(i => i.length > 0);
}
```

#### Example 2: Array Access
```typescript
// ❌ Before
function getFirstItem(items: string[] | null): string | null {
  if (items && items.length > 0) {
    return items[0];
  }
  return null;
}

// ✅ After
function getFirstItem(items: string[] | null): string | null {
  return items?.[0] ?? null;
}

// ✅ After - Using optional chaining with array access
function getFirstItem(items: string[] | null): string | null {
  return items && items[0] !== undefined ? items[0] : null;
}
```

### 4.5 Complex Boolean Expressions

#### Example 1: Multiple Conditions
```typescript
// ❌ Before
function isValid(user: User | null, config: Config | null): boolean {
  return user && config && config.enabled;
}

// ✅ After
function isValid(user: User | null, config: Config | null): boolean {
  return user !== null && config !== null && config.enabled === true;
}
```

#### Example 2: Short-Circuit Evaluation
```typescript
// ❌ Before
function getValue(source: Source | null): string {
  return source && source.value || "default";
}

// ✅ After
function getValue(source: Source | null): string {
  return source?.value ?? "default";
}
```

---

## 5. TypeScript Best Practices

### 5.1 Nullish Coalescing (??)

**When to Use:**
- Providing default values for null/undefined
- Differentiating between null/undefined and other falsy values

**Best Practice:**
```typescript
// ✅ Use nullish coalescing for null/undefined defaults
function getName(name: string | null): string {
  return name ?? "Anonymous";
}

// ❌ Don't use || for null checks (treats "" as falsy)
function getName(name: string | null): string {
  return name || "Anonymous"; // Wrong: "" becomes "Anonymous"
}
```

### 5.2 Optional Chaining (?.)

**When to Use:**
- Accessing properties on potentially null/undefined objects
- Calling methods on potentially null/undefined objects
- Nested property access

**Best Practice:**
```typescript
// ✅ Use optional chaining for safe property access
const email = user?.profile?.email ?? "not provided";

// ✅ Combine with nullish coalescing
const value = config?.settings?.theme ?? "light";
```

### 5.3 Type Guards

**When to Use:**
- Narrowing types in conditional blocks
- Working with union types
- Validating data from external sources

**Best Practice:**
```typescript
// ✅ Use type guards for runtime validation
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: unknown) {
  if (isString(value)) {
    // TypeScript knows value is string here
    console.log(value.toUpperCase());
  }
}
```

### 5.4 Non-Null Assertion (!)

**When to Use:**
- Only when you're certain the value is not null
- After proper validation checks
- In test code (with caution)

**Best Practice:**
```typescript
// ✅ OK: After validation
function process(value: string | null) {
  if (value !== null) {
    // We've validated value is not null
    console.log(value!.toUpperCase());
  }
}

// ❌ AVOID: Without validation
function process(value: string | null) {
  console.log(value!.toUpperCase()); // Runtime error if value is null
}
```

### 5.5 Type Narrowing

**Best Practice:**
```typescript
// ✅ Proper type narrowing
function process(value: string | number | null) {
  if (value === null) {
    return "null";
  }
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    return value * 2;
  }
  // TypeScript exhaustiveness check
  const _exhaustive: never = value;
  return _exhaustive;
}
```

### 5.6 Discriminated Unions

**Best Practice:**
```typescript
type Result =
  | { success: true; data: string }
  | { success: false; error: string };

function handleResult(result: Result) {
  // ✅ Type narrowing with discriminant
  if (result.success) {
    console.log(result.data); // TypeScript knows this exists
  } else {
    console.error(result.error); // TypeScript knows this exists
  }
}
```

---

## 6. Common Pitfalls and Anti-Patterns

### 6.1 Pitfall 1: Using || Instead of ??

**Problem:**
```typescript
// ❌ Wrong: Treats "", 0, false as null
function getPort(port: number | null): number {
  return port || 3000; // Port 0 becomes 3000!
}

// ✅ Correct: Only null/undefined get default
function getPort(port: number | null): number {
  return port ?? 3000;
}
```

### 6.2 Pitfall 2: Forgetting Optional Chaining

**Problem:**
```typescript
// ❌ Wrong: Potential runtime error
function getEmail(user: User | null): string {
  return user.email ?? "none"; // Error if user is null
}

// ✅ Correct: Safe property access
function getEmail(user: User | null): string {
  return user?.email ?? "none";
}
```

### 6.3 Pitfall 3: Overusing Non-Null Assertions

**Problem:**
```typescript
// ❌ Wrong: Dangerous assertion
function process(value: string | null) {
  console.log(value!.toUpperCase()); // Crashes if null
}

// ✅ Correct: Proper validation
function process(value: string | null) {
  if (value !== null) {
    console.log(value.toUpperCase());
  }
}
```

### 6.4 Pitfall 4: Inconsistent Null Checks

**Problem:**
```typescript
// ❌ Wrong: Inconsistent checking
if (value !== null) {
  // Do something
}
if (value !== undefined) {
  // Do something else - what if value is null?
}

// ✅ Correct: Consistent checking
if (value !== null && value !== undefined) {
  // Do something
}
```

### 6.5 Pitfall 5: Neglecting Empty Collections

**Problem:**
```typescript
// ❌ Wrong: Empty array is falsy in some contexts
function hasItems(items: string[] | null): boolean {
  return !!items; // [] is truthy, but intent unclear
}

// ✅ Correct: Explicit length check
function hasItems(items: string[] | null): boolean {
  return items !== null && items.length > 0;
}
```

### 6.6 Anti-Pattern 1: Double Negation for Type Checking

**Problem:**
```typescript
// ❌ Wrong: Obscure intent
function isValid(value: string | null): boolean {
  return !!value;
}

// ✅ Correct: Explicit comparison
function isValid(value: string | null): boolean {
  return value !== null;
}
```

### 6.7 Anti-Pattern 2: Ternary for Simple Defaults

**Problem:**
```typescript
// ❌ Wrong: Verbose ternary
function getName(name: string | null): string {
  return name ? name : "Anonymous";
}

// ✅ Correct: Concise nullish coalescing
function getName(name: string | null): string {
  return name ?? "Anonymous";
}
```

### 6.8 Anti-Pattern 3: Nested Conditionals

**Problem:**
```typescript
// ❌ Wrong: Deeply nested
function process(user: User | null, config: Config | null) {
  if (user) {
    if (config) {
      if (config.enabled) {
        // Do something
      }
    }
  }
}

// ✅ Correct: Early return
function process(user: User | null, config: Config | null) {
  if (user === null || config === null) {
    return;
  }
  if (!config.enabled) {
    return;
  }
  // Do something
}
```

---

## 7. Configuration Options

### 7.1 Rule Configuration

**Default Configuration:**
```json
{
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": ["warn", {
      "allowString": false,
      "allowNumber": false,
      "allowNullableObject": false,
      "allowNullableBoolean": false,
      "allowNullableString": false,
      "allowNullableNumber": false,
      "allowAny": false
    }]
  }
}
```

### 7.2 Option Explanations

#### allowString (default: false)
Allows string types in boolean contexts.
```typescript
// ❌ Warning when allowString: false
let name: string;
if (name) { }

// ✅ No warning when allowString: true
let name: string;
if (name) { }
```

#### allowNumber (default: false)
Allows number types in boolean contexts.
```typescript
// ❌ Warning when allowNumber: false
let count: number;
if (count) { }

// ✅ No warning when allowNumber: true
let count: number;
if (count) { }
```

#### allowNullableObject (default: false)
Allows nullable object types in boolean contexts.
```typescript
// ❌ Warning when allowNullableObject: false
let user: User | null;
if (user) { }

// ✅ No warning when allowNullableObject: true
let user: User | null;
if (user) { }
```

#### allowNullableBoolean (default: false)
Allows nullable boolean types in boolean contexts.
```typescript
// ❌ Warning when allowNullableBoolean: false
let flag: boolean | null;
if (flag) { }

// ✅ No warning when allowNullableBoolean: true
let flag: boolean | null;
if (flag) { }
```

#### allowNullableString (default: false)
Allows nullable string types in boolean contexts.
```typescript
// ❌ Warning when allowNullableString: false
let name: string | null;
if (name) { }

// ✅ No warning when allowNullableString: true
let name: string | null;
if (name) { }
```

#### allowNullableNumber (default: false)
Allows nullable number types in boolean contexts.
```typescript
// ❌ Warning when allowNullableNumber: false
let count: number | null;
if (count) { }

// ✅ No warning when allowNullableNumber: true
let count: number | null;
if (count) { }
```

#### allowAny (default: false)
Allows any type in boolean contexts.
```typescript
// ❌ Warning when allowAny: false
let value: any;
if (value) { }

// ✅ No warning when allowAny: true
let value: any;
if (value) { }
```

### 7.3 Recommended Configurations

#### Strict (Recommended)
```json
{
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": ["error", {
      "allowString": false,
      "allowNumber": false,
      "allowNullableObject": false,
      "allowNullableBoolean": false,
      "allowNullableString": false,
      "allowNullableNumber": false,
      "allowAny": false
    }]
  }
}
```

#### Balanced
```json
{
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": ["warn", {
      "allowString": true,
      "allowNumber": true,
      "allowNullableObject": false,
      "allowNullableBoolean": false,
      "allowNullableString": false,
      "allowNullableNumber": false,
      "allowAny": false
    }]
  }
}
```

#### Permissive
```json
{
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": ["warn", {
      "allowString": true,
      "allowNumber": true,
      "allowNullableObject": true,
      "allowNullableBoolean": false,
      "allowNullableString": true,
      "allowNullableNumber": true,
      "allowAny": false
    }]
  }
}
```

### 7.4 Disabling the Rule for Specific Lines

```typescript
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
if (legacyValue) {
  // Legacy code that's hard to fix right now
}

// Or for a block
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
if (legacyValue) {
  // Multiple legacy lines
}
/* eslint-enable @typescript-eslint/strict-boolean-expressions */
```

---

## 8. References and Resources

### 8.1 Official Documentation

**Primary Sources:**
- **TypeScript ESLint strict-boolean-expressions Rule**: https://typescript-eslint.io/rules/strict-boolean-expressions/
- **GitHub Source Code**: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/src/rules/strict-boolean-expressions
- **Rule Tests**: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/tests/rules/strict-boolean-expressions.test.ts

### 8.2 TypeScript Documentation

**Language Features:**
- **TypeScript Handbook - Nullish Coalescing**: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing
- **TypeScript Handbook - Optional Chaining**: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining
- **TypeScript Handbook - Type Narrowing**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **TypeScript Handbook - Type Guards**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates

### 8.3 Best Practices & Style Guides

**Community Standards:**
- **TypeScript ESLint Recommended Rules**: https://typescript-eslint.io/users/configs/#recommended
- **Google TypeScript Style Guide**: https://google.github.io/styleguide/tsguide.html
- **Airbnb TypeScript Style Guide**: https://github.com/airbnb/javascript/tree/master/packages/typescript

### 8.4 Related Tools

**Linting & Formatting:**
- **ESLint**: https://eslint.org/
- **TypeScript ESLint**: https://typescript-eslint.io/
- **Prettier**: https://prettier.io/

### 8.5 Code Examples & Tutorials

**Learning Resources:**
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **Effective TypeScript**: https://effectivetypescript.com/
- **TypeScript Evolution**: https://devblogs.microsoft.com/typescript/

### 8.6 Community Discussions

**Forums & Q&A:**
- **Stack Overflow - typescript-eslint tag**: https://stackoverflow.com/questions/tagged/typescript-eslint
- **GitHub Discussions - typescript-eslint**: https://github.com/typescript-eslint/typescript-eslint/discussions
- **TypeScript Community Discord**: https://discord.gg/typescript

---

## Summary

### Key Takeaways

1. **Always be explicit** about null/undefined checks in boolean contexts
2. **Use `??` (nullish coalescing)** instead of `||` for default values when you want to distinguish between null/undefined and other falsy values
3. **Use `?.` (optional chaining)** for safe property access on potentially null/undefined objects
4. **Avoid `any`** - use proper type guards and type narrowing instead
5. **Prefer early returns** over nested conditionals for better readability
6. **Be consistent** with your null checking patterns throughout the codebase

### Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  STRICT-BOOLEAN-EXPRESSIONS FIX PATTERNS                     │
├─────────────────────────────────────────────────────────────┤
│  Nullable String:                                            │
│   if (value !== null) { }                                    │
│   value ?? "default"                                         │
│   value?.trim() ?? ""                                        │
├─────────────────────────────────────────────────────────────┤
│  Nullable Number:                                            │
│   if (value !== null && value > 0) { }                       │
│   (value ?? 0) * 2                                           │
├─────────────────────────────────────────────────────────────┤
│  Nullable Object:                                            │
│   if (obj !== null) { }                                      │
│   obj?.property ?? default                                   │
├─────────────────────────────────────────────────────────────┤
│  Nullable Boolean:                                           │
│   if (flag === true) { }                                     │
│   flag ?? false                                              │
├─────────────────────────────────────────────────────────────┤
│  Any Type:                                                   │
│   typeof value === 'string' && value                         │
│   Array.isArray(value) && value                              │
└─────────────────────────────────────────────────────────────┘
```

---

**End of Comprehensive Guide**

*This guide provides detailed information about the @typescript-eslint/strict-boolean-expressions rule, including common patterns, best practices, and code examples for handling nullable types in TypeScript.*
