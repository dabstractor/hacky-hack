# MCP Protocol Research

**Research Date:** 2026-01-23
**Purpose:** Research MCP protocol basics and official documentation

## MCP Official Resources

### 1. MCP Specification
- **URL:** https://spec.modelcontextprotocol.io/specification/
- **What:** Core protocol documentation for Model Context Protocol
- **Key Concepts:**
  - MCP is an open protocol for AI assistants to interact with external tools
  - Three main components: Tools, Resources, Prompts
  - Standardized tool definitions using JSON Schema
  - Consistent execution patterns across tools

### 2. MCP Tools Guide
- **URL:** https://spec.modelcontextprotocol.io/specification/tools/
- **What:** Tool schema definitions and implementation guide
- **Key Concepts:**
  - Tools use JSON Schema for input validation
  - Tool names use snake_case convention
  - Input/output structures are standardized
  - Return values must be serializable

### 3. TypeScript SDK
- **URL:** https://github.com/modelcontextprotocol/typescript-sdk
- **What:** Official TypeScript implementation of MCP
- **Key Concepts:**
  - Type-safe interfaces for tool development
  - ToolExecutor type: `(input: unknown) => Promise<ToolResult>`
  - Server registration patterns
  - Transport types: 'inprocess' | 'stdio' | 'http'

### 4. Official MCP Servers
- **URL:** https://github.com/modelcontextprotocol/servers
- **What:** Reference implementations of MCP servers
- **Key Examples:**
  - Filesystem server (file operations)
  - Git server (version control)
  - Bash server (command execution)
  - Database servers (SQLite, PostgreSQL)

## Groundswell Framework Integration

### MCPHandler Pattern
This codebase uses Groundswell's custom `MCPHandler` implementation (not FastMCP):

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

export class CustomMCP extends MCPHandler {
  public readonly name = 'custom';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [toolSchema];

  constructor() {
    super();
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });
    this.registerToolExecutor('custom', 'tool_name', executor as ToolExecutor);
  }
}
```

### Key Differences from Standard MCP
- **Base Class:** Uses `MCPHandler` instead of `FastMCP`
- **Registration:** Constructor-based instead of decorator-based
- **Transport:** Primarily uses `'inprocess'` for local execution
- **Tool Naming:** Automatic `server__tool` prefix (e.g., `filesystem__file_read`)

## Tool Schema Format

### Basic Structure
```typescript
const toolSchema: Tool = {
  name: 'tool_name',              // snake_case identifier
  description: 'Clear description',
  input_schema: {
    type: 'object',
    properties: {
      requiredParam: { type: 'string' },
      optionalParam: { type: 'boolean' },
    },
    required: ['requiredParam'],
  },
};
```

### JSON Schema Types
- **string:** Text values with optional minLength, maxLength, pattern, enum
- **number:** Numeric values with minimum, maximum, default
- **boolean:** True/false values
- **array:** Lists with items, minItems, maxItems, uniqueItems
- **object:** Nested structures with properties, required, additionalProperties

## Tool Execution Flow

```
1. Agent calls tool with input
   ↓
2. Groundswell validates input against JSON Schema
   ↓
3. Tool executor receives validated input
   ↓
4. Executor performs operation
   ↓
5. Executor returns ToolResult
   ↓
6. Agent receives result
```

## Best Practices Summary

1. **Input Validation:** Always validate inputs before processing
2. **Error Handling:** Return structured results with `success: boolean`
3. **Security:** Prevent path traversal and command injection
4. **Documentation:** Use JSDoc comments for all public interfaces
5. **Testing:** Test all error paths with proper mocking
6. **Type Safety:** Use TypeScript interfaces for inputs/outputs
7. **Resource Limits:** Enforce timeouts and size limits
8. **Naming:** Use snake_case for tool names with descriptive verbs
