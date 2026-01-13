# Sensitive Data Redaction in Logging Libraries

## Pino Log Redaction

Pino has built-in redaction capabilities:

```javascript
const pino = require('pino');

const logger = pino({
  redact: [
    'password', // Exact field names to redact
    'token',
    'api_key',
    'secret',
    'authorization',
    'credit_card',
    '*.password', // Object paths (wildcard)
    'request.headers.*', // Nested wildcards
  ],
  level: 'info',
});
```

### Redaction Behavior

- Redaction happens **before serialization**
- Redacted values appear as `{ value: '[Redacted]' }`
- Supports wildcard patterns: `*` matches any single path segment
- Case-sensitive by default

## Sensitive Patterns to Redact

### Common Field Names

- `password` - User passwords
- `token` - Authentication tokens
- `api_key` - API keys
- `secret` - Secret values
- `authorization` - Authorization headers
- `credit_card` - Credit card numbers
- `cvv` - CVV codes
- `ssn` - Social security numbers

### Pattern-Based Redaction

For complex redaction needs, combine field-based and pattern-based:

```javascript
const logger = pino({
  redact: [
    // Exact field names
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',

    // Nested fields
    '*.password',
    '*.token',
    'user.password',
    'request.headers.authorization',

    // Request/response patterns
    'request.body.password',
    'response.data.token',
  ],
});
```

## Custom Redaction (Advanced)

For custom redaction logic:

```javascript
const redactor = value => {
  if (typeof value === 'string') {
    // Redact API keys matching pattern
    if (value.match(/sk-[a-zA-Z0-9]{20,}/)) {
      return '[API_KEY]';
    }
    // Redact JWT tokens
    if (
      value.match(/Bearer\s+[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)
    ) {
      return '[BEARER_TOKEN]';
    }
  }
  return value;
};

const logger = pino({
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    // Custom serializer for specific fields
    data: value => redactor(value),
  },
});
```

## Testing Redaction

Always test redaction to ensure sensitive data is not leaked:

```javascript
// Test: Verify password is redacted
logger.info({
  user: 'john',
  password: 'secret123',
});
// Output: {"user":"john","password":"[Redacted]"}

// Test: Verify nested password is redacted
logger.info({
  user: {
    name: 'john',
    password: 'secret123',
  },
});
// Output: {"user":{"name":"john","password":"[Redacted]"}}

// Test: Verify non-sensitive fields are not redacted
logger.info({
  user: 'john',
  email: 'john@example.com',
});
// Output: {"user":"john","email":"john@example.com"}
```

## Security Considerations

1. **Redact at the source**: Don't rely on post-processing
2. **Use redaction consistently**: Apply the same rules across all log statements
3. **Test thoroughly**: Ensure sensitive data never appears in logs
4. **Environment-specific configs**: Different redaction rules for dev/staging/prod
5. **Log level management**: Higher log levels increase risk of data exposure
6. **Avoid logging complete objects**: Use selective field logging

## Recommended Redaction Configuration

For this project, use:

```typescript
const redact = [
  // Standard sensitive fields
  'password',
  'token',
  'api_key',
  'secret',
  'authorization',

  // Nested sensitive fields
  '*.password',
  '*.token',
  '*.api_key',
  '*.secret',

  // HTTP-related
  'request.headers.authorization',
  'response.data.token',
];
```

## References

- Pino Redaction Documentation: https://getpino.io/#/docs/api?id=redaction
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
