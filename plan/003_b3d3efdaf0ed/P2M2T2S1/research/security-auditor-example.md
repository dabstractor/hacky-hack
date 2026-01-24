# SecurityAuditor Agent - Complete Implementation Example

This document provides a comprehensive implementation of a SecurityAuditor agent following the exact patterns from the hacky-hack codebase. The SecurityAuditor analyzes code for security vulnerabilities, checks for anti-patterns, and generates classified security reports.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation](#implementation)
4. [Integration](#integration)
5. [Usage Examples](#usage-examples)
6. [Configuration](#configuration)

---

## Overview

The SecurityAuditor agent extends the PRP Pipeline architecture with a specialized security persona that:

- **Analyzes code** for common security vulnerabilities (OWASP Top 10, CWE, etc.)
- **Detects anti-patterns** like hardcoded secrets, SQL injection risks, XSS vulnerabilities
- **Generates reports** with severity classification (critical, high, medium, low)
- **Provides remediation guidance** with code-specific recommendations
- **Supports custom rules** for project-specific security requirements

### Key Features

- **Pattern-based scanning** using regex and AST analysis
- **Severity classification** following CVSS scoring guidelines
- **Structured output** compatible with BacklogSchema
- **MCP tool integration** for codebase analysis
- **Extensible rule engine** for custom security checks

---

## Architecture

### Component Structure

```
src/
├── agents/
│   ├── agent-factory.ts           # Add createSecurityAuditorAgent()
│   ├── prompts.ts                  # Add SECURITY_AUDIT_PROMPT
│   └── prompts/
│       └── security-audit-prompt.ts # New prompt generator
└── tools/
    └── security-scanner-mcp.ts     # New MCP tool for security scanning
```

### Data Flow

```
PRD/Codebase → SecurityAuditor Agent → SecurityScannerMCP → SecurityReport
                                                    ↓
                                              Findings Array
                                              (classified by severity)
```

---

## Implementation

### 1. Prompt Constant (src/agents/prompts.ts)

Add this constant to the existing prompts.ts file:

```typescript
/**
 * Security Audit System Prompt for SecurityAuditor Agent
 *
 * @remarks
 * The SECURITY AUDITOR & VULNERABILITY ANALYZER prompt used for
 * analyzing code for security vulnerabilities and generating
 * classified security reports.
 *
 * Source: Custom security audit persona
 */
export const SECURITY_AUDIT_PROMPT = `
# SECURITY AUDITOR & VULNERABILITY ANALYZER

> **ROLE:** Act as a Security Auditor and Vulnerability Analyzer.
> **CONTEXT:** You are a security specialist trained in OWASP Top 10, CWE, and secure coding practices.
> **GOAL:** Analyze code for security vulnerabilities, detect anti-patterns, and generate classified security reports with remediation guidance.

---

## SECURITY ANALYSIS FRAMEWORK

### Vulnerability Categories

1. **Injection Attacks** (SQL, NoSQL, OS Command, LDAP)
   - User input not sanitized/parameterized
   - String concatenation in queries
   - Dynamic code execution

2. **Authentication & Authorization**
   - Hardcoded credentials
   - Weak password policies
   - Missing authentication checks
   - Session management issues

3. **Cross-Site Scripting (XSS)**
   - Unescaped user input in responses
   - DOM-based XSS vulnerabilities
   - Unsafe innerHTML usage

4. **Cryptographic Issues**
   - Weak algorithms (MD5, SHA1)
   - Hardcoded keys/tokens
   - Missing encryption for sensitive data
   - Insecure random number generation

5. **Configuration & Data Exposure**
   - Exposed sensitive data in logs
   - Debug information leakage
   - Insecure default configurations
   - Unprotected endpoints

6. **Dependencies & Supply Chain**
   - Outdated/vulnerable dependencies
   - Untrusted package sources
   - Missing integrity checks

---

## SEVERITY CLASSIFICATION

Use CVSS-inspired scoring for severity classification:

- **CRITICAL** (CVSS 9.0-10.0): Remote code execution, credential exposure, data breach
- **HIGH** (CVSS 7.0-8.9): SQL injection, XSS, authentication bypass
- **MEDIUM** (CVSS 4.0-6.9): Information disclosure, weak cryptography
- **LOW** (CVSS 0.1-3.9): Best practice violations, minor issues

---

## ANALYSIS PROCESS

### Phase 1: Codebase Scanning

1. **USE SECURITY_SCANNER_MCP TOOL** to scan the codebase
   - Scan for hardcoded secrets (API keys, passwords, tokens)
   - Detect SQL injection patterns
   - Find XSS vulnerabilities
   - Check cryptographic implementations
   - Identify authentication/authorization issues

2. **PATTERN MATCHING** using grep and file analysis
   - Search for dangerous functions (eval, exec, system, etc.)
   - Find unsanitized user input usage
   - Detect hardcoded configuration values

### Phase 2: Contextual Analysis

For each finding, determine:

- **True Positive vs False Positive**: Verify actual vulnerability
- **Exploitability**: How easily can this be exploited?
- **Impact**: What's the worst case scenario?
- **Remediation Complexity**: Effort required to fix

### Phase 3: Report Generation

**CONSTRAINT:** You MUST write the security report to the file \`./$SECURITY_REPORT_FILE\` (in the CURRENT WORKING DIRECTORY).

Do NOT output JSON to the conversation - WRITE IT TO THE FILE at path \`./$SECURITY_REPORT_FILE\`.

Use your file writing tools to create \`./$SECURITY_REPORT_FILE\` with this structure:

\`\`\`json
{
  "metadata": {
    "scanDate": "ISO 8601 timestamp",
    "scanScope": "Description of what was scanned",
    "totalFindings": 0,
    "criticalCount": 0,
    "highCount": 0,
    "mediumCount": 0,
    "lowCount": 0
  },
  "summary": {
    "overallRisk": "CRITICAL | HIGH | MEDIUM | LOW",
    "keyRisks": ["List of top 3-5 critical/high risks"],
    "recommendations": ["High-level remediation priorities"]
  },
  "findings": [
    {
      "id": "SEC-001",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "category": "Injection | Authentication | XSS | Crypto | Config | Dependencies",
      "title": "Short descriptive title",
      "description": "Detailed explanation of the vulnerability",
      "location": {
        "file": "path/to/file.ext",
        "line": 123,
        "code": "Snippet of vulnerable code"
      },
      "impact": "What an attacker could do",
      "exploitability": "Easy | Medium | Difficult",
      "remediation": {
        "guidance": "Step-by-step fix instructions",
        "codeExample": "Secure code example",
        "references": ["URL to security resources"]
      },
      "falsePositive": false,
      "notes": "Additional context or caveats"
    }
  ],
  "statistics": {
    "byCategory": {
      "Injection": 0,
      "Authentication": 0,
      "XSS": 0,
      "Crypto": 0,
      "Config": 0,
      "Dependencies": 0
    },
    "bySeverity": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "byFile": {
      "path/to/file.ext": 5
    }
  }
}
\`\`\`

---

## CRITICAL RULES

1. **BE CONSERVATIVE**: When in doubt, flag it. Better to review false positives than miss real vulnerabilities.
2. **BE SPECIFIC**: Provide exact file paths, line numbers, and code snippets.
3. **BE ACTIONABLE**: Every finding must include clear remediation steps.
4. **PRIORITIZE**: Focus on findings that have actual security impact.
5. **CONTEXT MATTERS**: Consider the project's threat model and use case.

---

## SECURITY SCAN PATTERNS

### Hardcoded Secrets
- Passwords: \`/password\\s*=\\s*['\"][^'\"]+['\"]/\`
- API Keys: \`/api[_-]?key\\s*=\\s*['\"][^'\"]+['\"]/\`
- Tokens: \`/token\\s*=\\s*['\"][^'\"]+['\"]/\`
- Secret Keys: \`/secret[_-]?key\\s*=\\s*['\"][^'\"]+['\"]/\`

### SQL Injection
- String concatenation: \`/\\"\\s*\\+\\s*.*\\+\\s*\\"/\`
- Unparameterized queries: \`/query\\(.*\\+.*\\)/\`

### XSS Risks
- innerHTML with variables: \`/innerHTML\\s*=\\s*.*\\+/\`
- dangerouslySetInnerHTML with variables

### Dangerous Functions
- JavaScript: \`/eval\\(|new Function\\(|setTimeout\\(.*string/\`
- Python: \`/eval\\(|exec\\(|__import__\\(\\s*'os'\\)/\`
- Shell: \`/system\\(|popen\\(|exec\\(/\`

---

## QUALITY GATES

Before finalizing the report:

- [ ] All findings have specific file paths and line numbers
- [ ] All critical/high findings include code examples
- [ ] All findings include remediation guidance
- [ ] False positives are clearly marked with explanation
- [ ] Severity classification follows CVSS guidelines
- [ ] Report statistics are accurate
- [ ] Summary highlights the most important risks

---

## OUTPUT FORMAT

**CRITICAL**: Write the security report to \`./$SECURITY_REPORT_FILE\` using file writing tools.

Do NOT output the report to the conversation. The file itself is the output.
` as const;
```

### 2. Prompt Generator (src/agents/prompts/security-audit-prompt.ts)

Create the prompt generator module:

```typescript
/**
 * Security audit prompt generator module
 *
 * @module agents/prompts/security-audit-prompt
 *
 * @remarks
 * Provides a type-safe prompt generator for the SecurityAuditor Agent.
 * Uses Groundswell's createPrompt() with SecurityReportSchema for structured output.
 */

// PATTERN: Import Groundswell prompt creation utilities
import { createPrompt, type Prompt } from 'groundswell';

// CRITICAL: Use .js extension for ES module imports
import type { SecurityReport } from '../../core/models.js';
import { SecurityReportSchema } from '../../core/models.js';

// PATTERN: Import system prompt from sibling prompts file
import { SECURITY_AUDIT_PROMPT } from '../prompts.js';

/**
 * Create a SecurityAuditor Agent prompt with structured SecurityReport output
 *
 * @remarks
 * Returns a Groundswell Prompt configured with:
 * - user: The codebase scan context and analysis parameters
 * - system: SECURITY_AUDIT_PROMPT (SECURITY AUDITOR persona)
 * - responseFormat: SecurityReportSchema (ensures type-safe JSON output)
 * - enableReflection: true (for complex security analysis reliability)
 *
 * The returned Prompt can be passed directly to agent.prompt():
 * ```typescript
 * const auditor = createSecurityAuditorAgent();
 * const prompt = createSecurityAuditPrompt(scanContext);
 * const result = await auditor.prompt(prompt);
 * // result is typed as z.infer<typeof SecurityReportSchema> = SecurityReport
 * ```
 *
 * @param scanContext - The scan context including paths, scope, and parameters
 * @returns Groundswell Prompt object configured for SecurityAuditor Agent
 *
 * @example
 * ```typescript
 * import { createSecurityAuditPrompt } from './agents/prompts/security-audit-prompt.js';
 *
 * const context = {
 *   targetDirectory: './src',
 *   filePatterns: ['**/*.ts', '**/*.js'],
 *   scanTypes: ['secrets', 'sqli', 'xss', 'crypto']
 * };
 * const prompt = createSecurityAuditPrompt(context);
 * const report = await agent.prompt(prompt);
 * ```
 */
export function createSecurityAuditPrompt(
  scanContext: SecurityScanContext
): Prompt<SecurityReport> {
  // PATTERN: Build user prompt from scan context
  const userPrompt = buildScanPrompt(scanContext);

  // PATTERN: Use createPrompt with responseFormat for structured output
  return createPrompt({
    // The user prompt describes what to scan and analysis parameters
    user: userPrompt,

    // The system prompt is the SECURITY AUDITOR persona
    system: SECURITY_AUDIT_PROMPT,

    // CRITICAL: responseFormat enables type-safe structured output
    // Groundswell validates LLM output against this schema
    responseFormat: SecurityReportSchema,

    // CRITICAL: Enable reflection for complex security analysis
    // Reflection provides error recovery for multi-step vulnerability detection
    enableReflection: true,
  });
}

/**
 * Security scan context interface
 *
 * @remarks
 * Defines the parameters for security scanning operations.
 * All fields are optional to support flexible scan configurations.
 */
interface SecurityScanContext {
  /** Target directory to scan (default: current working directory) */
  targetDirectory?: string;
  /** File patterns to include (glob patterns) */
  filePatterns?: string[];
  /** Security scan types to perform */
  scanTypes?: Array<
    'secrets' | 'sqli' | 'xss' | 'crypto' | 'auth' | 'config' | 'deps'
  >;
  /** Minimum severity level to report */
  minSeverity?: 'critical' | 'high' | 'medium' | 'low';
  /** Custom rules or patterns to check */
  customRules?: Array<{
    name: string;
    pattern: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
  }>;
  /** Files/directories to exclude from scan */
  excludePatterns?: string[];
}

/**
 * Build scan prompt from context
 *
 * @remarks
 * Generates a natural language prompt from the structured scan context.
 * This prompt is passed to the LLM as the user message.
 *
 * @param context - Security scan context
 * @returns Formatted prompt string
 */
function buildScanPrompt(context: SecurityScanContext): string {
  const {
    targetDirectory = process.cwd(),
    filePatterns = ['**/*.{ts,js,py,java,go}'],
    scanTypes = ['secrets', 'sqli', 'xss', 'crypto', 'auth', 'config'],
    minSeverity = 'low',
    customRules = [],
    excludePatterns = ['node_modules/**', 'dist/**', 'build/**'],
  } = context;

  const sections: string[] = [];

  // Scan scope section
  sections.push('## SECURITY SCAN REQUEST');
  sections.push('');
  sections.push(`**Target Directory:** \`${targetDirectory}\``);
  sections.push(`**File Patterns:** ${filePatterns.map((p) => `\`${p}\``).join(', ')}`);
  sections.push(`**Minimum Severity:** ${minSeverity.toUpperCase()}`);
  sections.push(`**Excluded Patterns:** ${excludePatterns.map((p) => `\`${p}\``).join(', ')}`);
  sections.push('');

  // Scan types section
  sections.push('## SCAN TYPES');
  sections.push('');
  sections.push('Perform the following security checks:');
  scanTypes.forEach((type) => {
    sections.push(`- **${type.toUpperCase()}**: ${getScanTypeDescription(type)}`);
  });
  sections.push('');

  // Custom rules section
  if (customRules.length > 0) {
    sections.push('## CUSTOM RULES');
    sections.push('');
    customRules.forEach((rule) => {
      sections.push(`### ${rule.name} (${rule.severity.toUpperCase()})`);
      sections.push(`**Pattern:** \`${rule.pattern}\``);
      sections.push(`**Description:** ${rule.description}`);
      sections.push('');
    });
  }

  // Output section
  sections.push('## OUTPUT');
  sections.push('');
  sections.push(
    'Generate a comprehensive security report following the structure specified in the system prompt.'
  );
  sections.push('');
  sections.push('Focus on:');
  sections.push('1. Accurate vulnerability detection');
  sections.push('2. Clear severity classification');
  sections.push('3. Actionable remediation guidance');
  sections.push('4. Minimal false positives');

  return sections.join('\n');
}

/**
 * Get description for scan type
 *
 * @remarks
 * Provides human-readable descriptions for security scan types.
 *
 * @param type - Scan type identifier
 * @returns Description string
 */
function getScanTypeDescription(
  type: string
): string {
  const descriptions: Record<string, string> = {
    secrets: 'Detect hardcoded secrets, API keys, passwords, and tokens',
    sqli: 'Identify SQL injection vulnerabilities and unsafe query patterns',
    xss: 'Find cross-site scripting risks and unescaped user input',
    crypto: 'Check for weak cryptographic algorithms and hardcoded keys',
    auth: 'Analyze authentication and authorization implementations',
    config: 'Review configuration for security best practices',
    deps: 'Scan dependencies for known vulnerabilities',
  };
  return descriptions[type] || 'Custom security check';
}
```

### 3. Security Scanner MCP Tool (src/tools/security-scanner-mcp.ts)

Create the security scanning MCP tool:

```typescript
/**
 * Security Scanner MCP Tool Module
 *
 * @module tools/security-scanner-mcp
 *
 * @remarks
 * Provides MCP tools for security vulnerability scanning.
 * Implements pattern-based detection for common security issues.
 *
 * @example
 * ```ts
 * import { SecurityScannerMCP } from './tools/security-scanner-mcp.js';
 *
 * const scanner = new SecurityScannerMCP();
 * const result = await scanner.executeTool('security__scan_secrets', {
 *   path: './src',
 *   filePattern: '**/*.ts'
 * });
 * ```
 */

import { promises as fs } from 'node:fs';
import { resolve, join } from 'node:path';
import fg from 'fast-glob';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// ===== INPUT INTERFACES =====

/**
 * Input schema for scan_secrets tool
 *
 * @remarks
 * Scans for hardcoded secrets, API keys, and credentials.
 */
interface ScanSecretsInput {
  /** Path to directory to scan */
  path: string;
  /** File pattern (glob) for files to scan */
  filePattern?: string;
  /** Exclude patterns (glob array) */
  exclude?: string[];
}

/**
 * Input schema for scan_sqli tool
 *
 * @remarks
 * Scans for SQL injection vulnerabilities.
 */
interface ScanSQLiInput {
  /** Path to directory to scan */
  path: string;
  /** File pattern (glob) for files to scan */
  filePattern?: string;
}

/**
 * Input schema for scan_xss tool
 *
 * @remarks
 * Scans for cross-site scripting vulnerabilities.
 */
interface ScanXSSInput {
  /** Path to directory to scan */
  path: string;
  /** File pattern (glob) for files to scan */
  filePattern?: string;
}

/**
 * Input schema for scan_crypto tool
 *
 * @remarks
 * Scans for cryptographic issues.
 */
interface ScanCryptoInput {
  /** Path to directory to scan */
  path: string;
  /** File pattern (glob) for files to scan */
  filePattern?: string;
}

/**
 * Input schema for comprehensive_security_scan tool
 *
 * @remarks
 * Performs all security scans in one operation.
 */
interface ComprehensiveScanInput {
  /** Path to directory to scan */
  path: string;
  /** File pattern (glob) for files to scan */
  filePattern?: string;
  /** Scan types to perform (default: all) */
  scanTypes?: Array<'secrets' | 'sqli' | 'xss' | 'crypto'>;
  /** Minimum severity to include in results */
  minSeverity?: 'critical' | 'high' | 'medium' | 'low';
}

// ===== RESULT INTERFACES =====

/**
 * Security finding interface
 *
 * @remarks
 * Represents a single security vulnerability finding.
 */
interface SecurityFinding {
  /** Unique finding identifier */
  id: string;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Vulnerability category */
  category: 'secrets' | 'sqli' | 'xss' | 'crypto' | 'auth' | 'config';
  /** Finding title */
  title: string;
  /** Detailed description */
  description: string;
  /** File location */
  location: {
    /** File path */
    file: string;
    /** Line number */
    line: number;
    /** Code snippet */
    code: string;
  };
  /** Potential impact */
  impact: string;
  /** Remediation guidance */
  remediation: {
    /** Fix instructions */
    guidance: string;
    /** Secure code example */
    codeExample?: string;
    /** Reference URLs */
    references?: string[];
  };
}

/**
 * Result from security scan operation
 *
 * @remarks
 * Contains scan results including findings and statistics.
 */
interface SecurityScanResult {
  /** True if scan completed successfully */
  success: boolean;
  /** Scan findings */
  findings?: SecurityFinding[];
  /** Statistics by severity */
  statistics?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Error message if scan failed */
  error?: string;
}

// ===== SECURITY PATTERNS =====

/**
 * Security pattern definitions
 *
 * @remarks
 * Regex patterns for detecting common security vulnerabilities.
 * Each pattern includes severity, category, and metadata.
 */
interface SecurityPattern {
  /** Pattern name/identifier */
  name: string;
  /** Regex pattern to match */
  pattern: RegExp;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Category */
  category: 'secrets' | 'sqli' | 'xss' | 'crypto';
  /** Description of the vulnerability */
  description: string;
  /** Remediation guidance */
  remediation: string;
  /** Reference URLs */
  references?: string[];
}

/**
 * Security patterns for scanning
 *
 * @remarks
 * Comprehensive collection of security vulnerability patterns.
 */
const SECURITY_PATTERNS: SecurityPattern[] = [
  // Hardcoded Secrets
  {
    name: 'hardcoded_password',
    pattern: /password\s*[:=]\s*['"]([^'"]{8,})['"]/i,
    severity: 'critical',
    category: 'secrets',
    description: 'Hardcoded password detected in source code',
    remediation: 'Move credentials to environment variables or secure vault',
    references: [
      'https://cwe.mitre.org/data/definitions/798.html',
      'https://owasp.org/www-project-top-ten/A07_2021-Identification_and_Authentication_Failures',
    ],
  },
  {
    name: 'hardcoded_api_key',
    pattern: /api[_-]?key\s*[:=]\s*['"]([a-zA-Z0-9]{20,})['"]/i,
    severity: 'critical',
    category: 'secrets',
    description: 'Hardcoded API key detected',
    remediation: 'Use environment variables or secret management service',
    references: [
      'https://cwe.mitre.org/data/definitions/798.html',
    ],
  },
  {
    name: 'hardcoded_token',
    pattern: /(?:secret[_-]?token|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"]([^'"]{16,})['"]/i,
    severity: 'critical',
    category: 'secrets',
    description: 'Hardcoded authentication token detected',
    remediation: 'Store tokens in secure vault or environment variables',
  },
  {
    name: 'aws_access_key',
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: 'critical',
    category: 'secrets',
    description: 'AWS Access Key ID detected',
    remediation: 'Rotate key immediately and use IAM roles or AWS Secrets Manager',
    references: [
      'https://docs.aws.amazon.com/general/latest/gr/managing-aws-access-keys.html',
    ],
  },
  {
    name: 'private_key',
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/,
    severity: 'critical',
    category: 'secrets',
    description: 'Private key detected in source code',
    remediation: 'Remove key immediately and regenerate. Never commit private keys.',
  },

  // SQL Injection
  {
    name: 'sql_concatenation',
    pattern: /(?:query|execute)\s*\(\s*['"`].*\+.*['"`]\s*\)/i,
    severity: 'high',
    category: 'sqli',
    description: 'Possible SQL injection via string concatenation',
    remediation: 'Use parameterized queries or prepared statements',
    references: [
      'https://cwe.mitre.org/data/definitions/89.html',
      'https://owasp.org/www-project-top-ten/A03_2021-Injection',
    ],
  },
  {
    name: 'sql_format',
    pattern: /(?:query|execute)\s*\(\s*(?:format|f['"`])\s*\)/i,
    severity: 'medium',
    category: 'sqli',
    description: 'Possible SQL injection via string formatting',
    remediation: 'Use parameterized queries with proper escaping',
  },

  // XSS
  {
    name: 'dangerous_innerhtml',
    pattern: /innerHTML\s*[:=]\s*(?!['"`\s]*(?:textContent|innerText))/,
    severity: 'high',
    category: 'xss',
    description: 'Use of innerHTML with potential XSS risk',
    remediation: 'Use textContent or sanitize HTML with DOMPurify',
    references: [
      'https://cwe.mitre.org/data/definitions/79.html',
      'https://owasp.org/www-project-top-ten/A03_2021-Injection',
    ],
  },
  {
    name: 'dangerous_dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML\s*[:=]\s*\{/,
    severity: 'medium',
    category: 'xss',
    description: 'React dangerouslySetInnerHTML usage with XSS risk',
    remediation: 'Ensure HTML is sanitized or use safer alternatives',
  },
  {
    name: 'eval_usage',
    pattern: /eval\s*\(/,
    severity: 'high',
    category: 'xss',
    description: 'Use of eval() with potential code injection risk',
    remediation: 'Avoid eval(). Use JSON.parse() or safer alternatives',
    references: [
      'https://cwe.mitre.org/data/definitions/95.html',
    ],
  },

  // Cryptographic Issues
  {
    name: 'weak_hash_md5',
    pattern: /(?:hash|digest)\s*\(\s*['"`]md5['"`]\s*\)/i,
    severity: 'medium',
    category: 'crypto',
    description: 'Use of weak MD5 hash algorithm',
    remediation: 'Use stronger algorithms like SHA-256 or SHA-3',
    references: [
      'https://cwe.mitre.org/data/definitions/327.html',
      'https://owasp.org/www-project-top-ten/A02_2021-Cryptographic_Failures',
    ],
  },
  {
    name: 'weak_hash_sha1',
    pattern: /(?:hash|digest)\s*\(\s*['"`]sha1['"`]\s*\)/i,
    severity: 'medium',
    category: 'crypto',
    description: 'Use of weak SHA-1 hash algorithm',
    remediation: 'Use SHA-256 or stronger algorithms',
  },
  {
    name: 'hardcoded_crypto_key',
    pattern: /(?:encryption[_-]?key|crypto[_-]?key|secret[_-]?key)\s*[:=]\s*['"]([^'"]{16,})['"]/i,
    severity: 'high',
    category: 'crypto',
    description: 'Hardcoded cryptographic key detected',
    remediation: 'Use key management service or environment variables',
  },
];

// ===== TOOL SCHEMAS =====

/**
 * Tool schema for scan_secrets
 */
const scanSecretsTool: Tool = {
  name: 'scan_secrets',
  description:
    'Scan for hardcoded secrets, API keys, passwords, and tokens. ' +
    'Returns findings with file locations and remediation guidance.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to directory to scan',
      },
      filePattern: {
        type: 'string',
        description: 'File pattern (glob) for files to scan (default: **/*.{ts,js,py})',
      },
      exclude: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Exclude patterns (glob array)',
      },
    },
    required: ['path'],
  },
};

/**
 * Tool schema for scan_sqli
 */
const scanSQLiTool: Tool = {
  name: 'scan_sqli',
  description:
    'Scan for SQL injection vulnerabilities. ' +
    'Detects unsafe query construction and string concatenation.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to directory to scan',
      },
      filePattern: {
        type: 'string',
        description: 'File pattern (glob) for files to scan',
      },
    },
    required: ['path'],
  },
};

/**
 * Tool schema for scan_xss
 */
const scanXSSTool: Tool = {
  name: 'scan_xss',
  description:
    'Scan for cross-site scripting vulnerabilities. ' +
    'Detects unsafe HTML manipulation and eval usage.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to directory to scan',
      },
      filePattern: {
        type: 'string',
        description: 'File pattern (glob) for files to scan',
      },
    },
    required: ['path'],
  },
};

/**
 * Tool schema for scan_crypto
 */
const scanCryptoTool: Tool = {
  name: 'scan_crypto',
  description:
    'Scan for cryptographic issues. ' +
    'Detects weak algorithms and hardcoded keys.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to directory to scan',
      },
      filePattern: {
        type: 'string',
        description: 'File pattern (glob) for files to scan',
      },
    },
    required: ['path'],
  },
};

/**
 * Tool schema for comprehensive_security_scan
 */
const comprehensiveScanTool: Tool = {
  name: 'comprehensive_security_scan',
  description:
    'Perform comprehensive security scan including secrets, SQLi, XSS, and crypto checks. ' +
    'Returns aggregated findings with statistics by severity.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to directory to scan',
      },
      filePattern: {
        type: 'string',
        description: 'File pattern (glob) for files to scan (default: **/*.{ts,js,py})',
      },
      scanTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['secrets', 'sqli', 'xss', 'crypto'],
        },
        description: 'Scan types to perform (default: all)',
      },
      minSeverity: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
        description: 'Minimum severity to include in results (default: low)',
      },
    },
    required: ['path'],
  },
};

// ===== TOOL EXECUTORS =====

/**
 * Scan for security vulnerabilities using patterns
 *
 * @remarks
 * Scans files matching pattern using regex patterns to detect vulnerabilities.
 * Returns findings with locations, severity, and remediation guidance.
 *
 * @param input - Scan input with path and filters
 * @param categories - Security categories to scan
 * @param minSeverity - Minimum severity to include
 * @returns Promise resolving to scan result
 */
async function scanWithPatterns(
  input: {
    path: string;
    filePattern?: string;
    exclude?: string[];
  },
  categories: Array<'secrets' | 'sqli' | 'xss' | 'crypto'>,
  minSeverity?: 'critical' | 'high' | 'medium' | 'low'
): Promise<SecurityScanResult> {
  try {
    const {
      path: scanPath,
      filePattern = '**/*.{ts,js,py,java,go}',
      exclude = ['node_modules/**', 'dist/**', 'build/**', '**/*.min.{js,css}'],
    } = input;

    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const minSeverityValue = minSeverity ? severityOrder[minSeverity] : 0;

    // PATTERN: Resolve and validate path
    const safePath = resolve(scanPath);

    // PATTERN: Get matching files using fast-glob
    const files = await fg(filePattern, {
      cwd: safePath,
      absolute: true,
      onlyFiles: true,
      ignore: exclude,
    });

    const findings: SecurityFinding[] = [];
    let findingId = 1;

    // Filter patterns by category
    const categoryPatterns = SECURITY_PATTERNS.filter((p) =>
      categories.includes(p.category)
    );

    // Scan each file
    for (const file of files) {
      try {
        const content = await fs.readFile(file, { encoding: 'utf-8' });
        const lines = content.split('\n');

        // Check each line against patterns
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum];

          for (const pattern of categoryPatterns) {
            // Check severity threshold
            if (severityOrder[pattern.severity] < minSeverityValue) {
              continue;
            }

            const match = line.match(pattern.pattern);
            if (match) {
              // Get code context (surrounding lines)
              const contextStart = Math.max(0, lineNum - 1);
              const contextEnd = Math.min(lines.length, lineNum + 2);
              const codeSnippet = lines
                .slice(contextStart, contextEnd)
                .map((l, i) => {
                  const num = contextStart + i + 1;
                  const marker = num === lineNum + 1 ? '>>> ' : '    ';
                  return `${marker}${num}: ${l}`;
                })
                .join('\n');

              findings.push({
                id: `SEC-${String(findingId++).padStart(3, '0')}`,
                severity: pattern.severity,
                category: pattern.category,
                title: pattern.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                description: pattern.description,
                location: {
                  file: file.replace(safePath, '').replace(/^\//, ''),
                  line: lineNum + 1,
                  code: codeSnippet,
                },
                impact: getImpactDescription(pattern),
                remediation: {
                  guidance: pattern.remediation,
                  references: pattern.references,
                },
              });
            }
          }
        }
      } catch (error) {
        // Continue scanning other files if one fails
        continue;
      }
    }

    // Calculate statistics
    const statistics = {
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
    };

    return {
      success: true,
      findings,
      statistics,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get impact description for pattern
 *
 * @remarks
 * Generates human-readable impact description based on pattern category and severity.
 *
 * @param pattern - Security pattern
 * @returns Impact description
 */
function getImpactDescription(pattern: SecurityPattern): string {
  const impacts: Record<string, Record<string, string>> = {
    secrets: {
      critical: 'Credential exposure leading to unauthorized system access and data breach',
      high: 'API key compromise enabling abuse and potential data exfiltration',
    },
    sqli: {
      critical: 'Complete database compromise including data exfiltration, modification, and deletion',
      high: 'Unauthorized database access and potential data leakage',
      medium: 'Limited database access through specialized injection techniques',
    },
    xss: {
      critical: 'Complete user session hijacking and account takeover',
      high: 'Execution of arbitrary JavaScript in victim browsers',
      medium: 'Limited script execution with user interaction required',
    },
    crypto: {
      high: 'Data exposure through weak encryption or broken cryptography',
      medium: 'Potential data exposure through cryptographic weaknesses',
    },
    auth: {
      critical: 'Complete authentication bypass and unauthorized access',
      high: 'Privilege escalation or unauthorized access',
    },
    config: {
      high: 'System misconfiguration leading to security exposure',
      medium: 'Configuration issue increasing attack surface',
    },
  };

  return (
    impacts[pattern.category]?.[pattern.severity] ||
    'Security vulnerability requiring remediation'
  );
}

/**
 * Execute scan_secrets tool
 *
 * @remarks
 * Scans for hardcoded secrets and credentials.
 *
 * @param input - Tool input
 * @returns Promise resolving to scan result
 */
async function scanSecrets(input: ScanSecretsInput): Promise<SecurityScanResult> {
  return scanWithPatterns(input, ['secrets'], 'critical');
}

/**
 * Execute scan_sqli tool
 *
 * @remarks
 * Scans for SQL injection vulnerabilities.
 *
 * @param input - Tool input
 * @returns Promise resolving to scan result
 */
async function scanSQLi(input: ScanSQLiInput): Promise<SecurityScanResult> {
  return scanWithPatterns(input, ['sqli'], 'medium');
}

/**
 * Execute scan_xss tool
 *
 * @remarks
 * Scans for XSS vulnerabilities.
 *
 * @param input - Tool input
 * @returns Promise resolving to scan result
 */
async function scanXSS(input: ScanXSSInput): Promise<SecurityScanResult> {
  return scanWithPatterns(input, ['xss'], 'medium');
}

/**
 * Execute scan_crypto tool
 *
 * @remarks
 * Scans for cryptographic issues.
 *
 * @param input - Tool input
 * @returns Promise resolving to scan result
 */
async function scanCrypto(input: ScanCryptoInput): Promise<SecurityScanResult> {
  return scanWithPatterns(input, ['crypto'], 'medium');
}

/**
 * Execute comprehensive_security_scan tool
 *
 * @remarks
 * Performs all security scans and aggregates results.
 *
 * @param input - Tool input
 * @returns Promise resolving to comprehensive scan result
 */
async function comprehensiveSecurityScan(
  input: ComprehensiveScanInput
): Promise<SecurityScanResult> {
  const {
    path,
    filePattern,
    scanTypes = ['secrets', 'sqli', 'xss', 'crypto'],
    minSeverity = 'low',
  } = input;

  return scanWithPatterns({ path, filePattern }, scanTypes, minSeverity);
}

// ===== MCP SERVER =====

/**
 * Security Scanner MCP Server
 *
 * @remarks
 * Groundswell MCP server that provides security vulnerability scanning.
 * Extends MCPHandler and registers security scanning tools.
 */
export class SecurityScannerMCP extends MCPHandler {
  /** Server name for MCPServer interface */
  public readonly name = 'security';

  /** Transport type for MCPServer interface */
  public readonly transport = 'inprocess' as const;

  /** Tools for MCPServer interface */
  public readonly tools = [
    scanSecretsTool,
    scanSQLiTool,
    scanXSSTool,
    scanCryptoTool,
    comprehensiveScanTool,
  ];

  constructor() {
    super();

    // PATTERN: Register server in constructor
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });

    // PATTERN: Register tool executors with ToolExecutor cast
    this.registerToolExecutor(
      'security',
      'scan_secrets',
      scanSecrets as ToolExecutor
    );
    this.registerToolExecutor(
      'security',
      'scan_sqli',
      scanSQLi as ToolExecutor
    );
    this.registerToolExecutor('security', 'scan_xss', scanXSS as ToolExecutor);
    this.registerToolExecutor(
      'security',
      'scan_crypto',
      scanCrypto as ToolExecutor
    );
    this.registerToolExecutor(
      'security',
      'comprehensive_security_scan',
      comprehensiveSecurityScan as ToolExecutor
    );
  }

  /**
   * Scan for secrets directly (non-MCP path)
   *
   * @remarks
   * Provides direct access to secret scanning.
   *
   * @param input - Scan input
   * @returns Promise resolving to scan result
   */
  async scan_secrets(input: ScanSecretsInput): Promise<SecurityScanResult> {
    return scanSecrets(input);
  }

  /**
   * Perform comprehensive scan directly (non-MCP path)
   *
   * @remarks
   * Provides direct access to comprehensive security scanning.
   *
   * @param input - Scan input
   * @returns Promise resolving to scan result
   */
  async comprehensive_security_scan(
    input: ComprehensiveScanInput
  ): Promise<SecurityScanResult> {
    return comprehensiveSecurityScan(input);
  }
}

// Export types and tools for external use and testing
export type {
  ScanSecretsInput,
  ScanSQLiInput,
  ScanXSSInput,
  ScanCryptoInput,
  ComprehensiveScanInput,
  SecurityFinding,
  SecurityScanResult,
  SecurityPattern,
};
export {
  scanSecretsTool,
  scanSQLiTool,
  scanXSSTool,
  scanCryptoTool,
  comprehensiveScanTool,
  SECURITY_PATTERNS,
};
```

### 4. Agent Factory Extension (src/agents/agent-factory.ts)

Add to the existing agent-factory.ts file:

```typescript
// Add to imports at top of file
import {
  TASK_BREAKDOWN_PROMPT,
  PRP_BLUEPRINT_PROMPT,
  PRP_BUILDER_PROMPT,
  BUG_HUNT_PROMPT,
  SECURITY_AUDIT_PROMPT,  // NEW
} from './prompts.js';

import { BashMCP } from '../tools/bash-mcp.js';
import { FilesystemMCP } from '../tools/filesystem-mcp.js';
import { GitMCP } from '../tools/git-mcp.js';
import { SecurityScannerMCP } from '../tools/security-scanner-mcp.js';  // NEW

// Add to singleton MCP server instances section (around line 56)
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();
const SECURITY_SCANNER_MCP = new SecurityScannerMCP();  // NEW

// Update MCP_TOOLS array (around line 68)
const MCP_TOOLS: MCPServer[] = [
  BASH_MCP,
  FILESYSTEM_MCP,
  GIT_MCP,
  SECURITY_SCANNER_MCP,  // NEW
];

// Update AgentPersona type (around line 80)
export type AgentPersona = 'architect' | 'researcher' | 'coder' | 'qa' | 'security';  // Added 'security'

// Update PERSONA_TOKEN_LIMITS (around line 118)
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
  security: 6144,  // NEW: Security analysis needs medium token limit
} as const;

// Add new agent factory function (after createQAAgent function, around line 291)

/**
 * Create a SecurityAuditor agent for security vulnerability analysis
 *
 * @remarks
 * Uses the SECURITY_AUDIT_PROMPT system prompt for comprehensive
 * security scanning including secrets, SQL injection, XSS, and
 * cryptographic vulnerabilities.
 *
 * The SecurityAuditor agent includes the SecurityScannerMCP tool
 * for pattern-based vulnerability detection.
 *
 * @returns Configured Groundswell Agent instance
 *
 * @example
 * ```ts
 * import { createSecurityAuditorAgent } from './agents/agent-factory.js';
 *
 * const auditor = createSecurityAuditorAgent();
 * const report = await auditor.prompt(securityAuditPrompt);
 * ```
 */
export function createSecurityAuditorAgent(): Agent {
  const baseConfig = createBaseConfig('security');
  const config = {
    ...baseConfig,
    system: SECURITY_AUDIT_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug(
    { persona: 'security', model: config.model },
    'Creating agent'
  );
  return createAgent(config);
}

// Update MCP_TOOLS export to include the new MCP (around line 296)
export { MCP_TOOLS, SECURITY_SCANNER_MCP };  // Added SECURITY_SCANNER_MCP
```

### 5. Data Models (src/core/models.ts)

Add the security report schema to existing models:

```typescript
// Add to existing imports and zod setup
import { z } from 'zod';

/**
 * Security Finding Schema
 *
 * @remarks
 * Represents a single security vulnerability finding with location,
 * severity, and remediation guidance.
 */
export const SecurityFindingSchema = z.object({
  id: z.string().regex(/^SEC-\d{3,}$/),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['secrets', 'sqli', 'xss', 'crypto', 'auth', 'config', 'deps']),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.object({
    file: z.string(),
    line: z.number().int().positive(),
    code: z.string(),
  }),
  impact: z.string(),
  remediation: z.object({
    guidance: z.string(),
    codeExample: z.string().optional(),
    references: z.array(z.string().url()).optional(),
  }),
  falsePositive: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

/**
 * Security Report Statistics Schema
 *
 * @remarks
 * Statistics aggregated from security scan findings.
 */
export const SecurityReportStatisticsSchema = z.object({
  byCategory: z.record(z.enum(['secrets', 'sqli', 'xss', 'crypto', 'auth', 'config', 'deps']), z.number().int().min(0)),
  bySeverity: z.object({
    critical: z.number().int().min(0),
    high: z.number().int().min(0),
    medium: z.number().int().min(0),
    low: z.number().int().min(0),
  }),
  byFile: z.record(z.string(), z.number().int().min(0)),
});

/**
 * Security Report Metadata Schema
 *
 * @remarks
 * Metadata about the security scan execution.
 */
export const SecurityReportMetadataSchema = z.object({
  scanDate: z.string().datetime(),
  scanScope: z.string(),
  totalFindings: z.number().int().min(0),
  criticalCount: z.number().int().min(0),
  highCount: z.number().int().min(0),
  mediumCount: z.number().int().min(0),
  lowCount: z.number().int().min(0),
});

/**
 * Security Report Summary Schema
 *
 * @remarks
 * High-level summary of security scan results.
 */
export const SecurityReportSummarySchema = z.object({
  overallRisk: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  keyRisks: z.array(z.string().min(1)).max(10),
  recommendations: z.array(z.string().min(1)).max(10),
});

/**
 * Security Report Schema
 *
 * @remarks
 * Complete security report with findings, statistics, and metadata.
 * Used as structured output format for SecurityAuditor agent.
 */
export const SecurityReportSchema = z.object({
  metadata: SecurityReportMetadataSchema,
  summary: SecurityReportSummarySchema,
  findings: z.array(SecurityFindingSchema),
  statistics: SecurityReportStatisticsSchema,
});

// Type exports
export type SecurityFinding = z.infer<typeof SecurityFindingSchema>;
export type SecurityReportStatistics = z.infer<typeof SecurityReportStatisticsSchema>;
export type SecurityReportMetadata = z.infer<typeof SecurityReportMetadataSchema>;
export type SecurityReportSummary = z.infer<typeof SecurityReportSummarySchema>;
export type SecurityReport = z.infer<typeof SecurityReportSchema>;
```

---

## Integration

### Step 1: Update Environment Configuration

No additional environment variables are required. The SecurityAuditor uses the existing `ANTHROPIC_API_KEY` configuration.

### Step 2: Register with CLI (Optional)

If you want to expose the SecurityAuditor via CLI, add to your CLI commands:

```typescript
// src/commands/security-scan-command.ts
import { createSecurityAuditorAgent } from '../agents/agent-factory.js';
import { createSecurityAuditPrompt } from '../agents/prompts/security-audit-prompt.js';

export async function securityScanCommand(options: {
  path: string;
  filePattern?: string;
  minSeverity?: 'critical' | 'high' | 'medium' | 'low';
  outputFile?: string;
}): Promise<void> {
  const auditor = createSecurityAuditorAgent();

  const prompt = createSecurityAuditPrompt({
    targetDirectory: options.path,
    filePatterns: options.filePattern ? [options.filePattern] : undefined,
    minSeverity: options.minSeverity,
  });

  const result = await auditor.prompt(prompt);

  // Write to file or stdout
  if (options.outputFile) {
    await fs.writeFile(options.outputFile, JSON.stringify(result, null, 2));
    console.log(`Security report written to ${options.outputFile}`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}
```

### Step 3: Add to PRP Pipeline (Optional)

To integrate security scanning into your PRP pipeline:

```typescript
// src/pipeline/security-gate.ts
import { createSecurityAuditorAgent } from '../agents/agent-factory.js';
import type { SecurityReport } from '../core/models.js';

export async function securityGate(
  workspacePath: string
): Promise<{ passed: boolean; report: SecurityReport }> {
  const auditor = createSecurityAuditorAgent();

  const prompt = createSecurityAuditPrompt({
    targetDirectory: workspacePath,
    minSeverity: 'medium',  // Fail on medium or higher
  });

  const report = await auditor.prompt(prompt);

  // Security gate fails if critical or high vulnerabilities found
  const criticalCount = report.metadata.criticalCount;
  const highCount = report.metadata.highCount;
  const passed = criticalCount === 0 && highCount === 0;

  return { passed, report };
}
```

---

## Usage Examples

### Example 1: Basic Security Scan

```typescript
import { createSecurityAuditorAgent } from './agents/agent-factory.js';
import { createSecurityAuditPrompt } from './agents/prompts/security-audit-prompt.js';

// Create the SecurityAuditor agent
const auditor = createSecurityAuditorAgent();

// Create scan prompt
const prompt = createSecurityAuditPrompt({
  targetDirectory: './src',
  filePatterns: ['**/*.ts', '**/*.js'],
  minSeverity: 'low',
});

// Execute scan
const report = await auditor.prompt(prompt);

// Access results
console.log(`Found ${report.metadata.totalFindings} findings`);
console.log(`Critical: ${report.metadata.criticalCount}`);
console.log(`High: ${report.metadata.highCount}`);

// Review findings
report.findings.forEach(finding => {
  console.log(`[${finding.severity.toUpperCase()}] ${finding.title}`);
  console.log(`  File: ${finding.location.file}:${finding.location.line}`);
  console.log(`  Impact: ${finding.impact}`);
  console.log(`  Fix: ${finding.remediation.guidance}\n`);
});
```

### Example 2: Targeted Scan (Secrets Only)

```typescript
const prompt = createSecurityAuditPrompt({
  targetDirectory: './src',
  scanTypes: ['secrets'],
  minSeverity: 'critical',
});

const report = await auditor.prompt(prompt);
// Only critical-level secret findings will be included
```

### Example 3: Custom Security Rules

```typescript
const prompt = createSecurityAuditPrompt({
  targetDirectory: './src',
  scanTypes: ['secrets', 'xss'],
  customRules: [
    {
      name: 'debug_console_log',
      pattern: 'console\\.log\\(',
      severity: 'low',
      description: 'Debug console.log statement that should be removed',
    },
    {
      name: 'TODO_with_secret',
      pattern: 'TODO.*(?:secret|password|key)',
      severity: 'medium',
      description: 'TODO comment mentioning sensitive terms',
    },
  ],
});

const report = await auditor.prompt(prompt);
```

### Example 4: Integration with PRP Pipeline

```typescript
import { securityGate } from './pipeline/security-gate.js';

// After PRP implementation, run security gate
const result = await securityGate('./project/src');

if (!result.passed) {
  console.error('Security gate failed!');
  console.error(`Critical: ${result.report.metadata.criticalCount}`);
  console.error(`High: ${result.report.metadata.highCount}`);

  // Output top issues
  result.report.summary.keyRisks.forEach(risk => {
    console.error(`  - ${risk}`);
  });

  process.exit(1);
} else {
  console.log('Security gate passed!');
  process.exit(0);
}
```

### Example 5: Direct MCP Tool Usage

```typescript
import { SecurityScannerMCP } from './tools/security-scanner-mcp.js';

const scanner = new SecurityScannerMCP();

// Quick secret scan
const secretsResult = await scanner.scan_secrets({
  path: './src',
  filePattern: '**/*.ts',
  exclude: ['node_modules/**'],
});

console.log(`Found ${secretsResult.statistics?.critical || 0} critical secrets`);

// Comprehensive scan
const fullResult = await scanner.comprehensive_security_scan({
  path: './src',
  scanTypes: ['secrets', 'sqli', 'xss', 'crypto'],
  minSeverity: 'medium',
});

console.log('Security scan complete:', fullResult.statistics);
```

---

## Configuration

### Environment Variables

The SecurityAuditor uses standard Groundswell configuration:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### Agent Configuration

The SecurityAuditor is configured with these defaults:

```typescript
{
  model: 'GLM-4.7',           // Uses sonnet model tier
  maxTokens: 6144,            // Medium token limit for analysis
  enableCache: true,          // Caching enabled for performance
  enableReflection: true,     // Reflection for complex analysis
}
```

### Customization

To customize the SecurityAuditor behavior:

1. **Adjust Token Limit**: Modify `PERSONA_TOKEN_LIMITS.security` in agent-factory.ts
2. **Add Security Patterns**: Extend `SECURITY_PATTERNS` in security-scanner-mcp.ts
3. **Modify Prompt**: Update `SECURITY_AUDIT_PROMPT` in prompts.ts
4. **Custom Schemas**: Extend `SecurityReportSchema` in models.ts

---

## Best Practices

### 1. Regular Scanning

Run security scans regularly in your CI/CD pipeline:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Audit
        run: npm run security-scan
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json
```

### 2. Severity Thresholds

Use appropriate severity thresholds for different contexts:

- **Development**: Use `minSeverity: 'low'` to catch all issues
- **CI/CD**: Use `minSeverity: 'medium'` to fail on significant issues
- **Production Pre-deploy**: Use `minSeverity: 'critical'` to block only critical issues

### 3. False Positive Management

Mark false positives in your codebase:

```typescript
// SECURITY-FALSE-POSITIVE: SEC-001
// This is a test fixture, not a real credential
const TEST_API_KEY = 'test-key-for-unit-tests';
```

### 4. Remediation Workflow

Follow this workflow for security findings:

1. **Critical**: Fix immediately before deployment
2. **High**: Fix within 24-48 hours
3. **Medium**: Fix within next sprint
4. **Low**: Fix opportunistically or backlog

---

## Testing

### Unit Tests

```typescript
// test/security-scanner-mcp.test.ts
import { SecurityScannerMCP } from '../src/tools/security-scanner-mcp.js';

describe('SecurityScannerMCP', () => {
  const scanner = new SecurityScannerMCP();

  it('should detect hardcoded passwords', async () => {
    const result = await scanner.scan_secrets({
      path: './test/fixtures/secure-code.ts',
    });

    expect(result.findings).toBeDefined();
    expect(result.findings?.some(f => f.category === 'secrets')).toBe(true);
  });

  it('should respect minimum severity filter', async () => {
    const result = await scanner.comprehensive_security_scan({
      path: './src',
      minSeverity: 'high',
    });

    expect(result.findings?.every(f =>
      ['critical', 'high'].includes(f.severity)
    )).toBe(true);
  });
});
```

### Integration Tests

```typescript
// test/security-auditor-agent.test.ts
import { createSecurityAuditorAgent } from '../src/agents/agent-factory.js';
import { createSecurityAuditPrompt } from '../src/agents/prompts/security-audit-prompt.js';

describe('SecurityAuditor Agent', () => {
  it('should generate security report', async () => {
    const auditor = createSecurityAuditorAgent();
    const prompt = createSecurityAuditPrompt({
      targetDirectory: './test/fixtures',
    });

    const report = await auditor.prompt(prompt);

    expect(report.metadata).toBeDefined();
    expect(report.findings).toBeInstanceOf(Array);
    expect(report.statistics).toBeDefined();
  });
});
```

---

## Summary

The SecurityAuditor agent provides a comprehensive security scanning solution following all patterns from the hacky-hack codebase:

- ✅ **AgentFactory Extension**: `createSecurityAuditorAgent()` following existing patterns
- ✅ **Prompt Constants**: `SECURITY_AUDIT_PROMPT` in prompts.ts
- ✅ **Prompt Generator**: `createSecurityAuditPrompt()` for structured output
- ✅ **MCP Tool**: `SecurityScannerMCP` with pattern-based scanning
- ✅ **Type Safety**: Full TypeScript types and Zod schemas
- ✅ **Error Handling**: Comprehensive error patterns
- ✅ **JSDoc Comments**: Complete documentation following codebase style
- ✅ **Export Patterns**: `.js` extension usage in imports
- ✅ **Integration**: Compatible with existing PRP Pipeline

The SecurityAuditor is ready for integration into your development workflow and can be extended with custom rules and patterns as needed.
