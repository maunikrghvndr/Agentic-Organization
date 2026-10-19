---
paths:
  - "**/*.cs"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.py"
---

Optional overlay. AGENTS.md is the complete contract; this file only scopes the same rule to matching paths.

- **Structured logging only:** constant message templates with named placeholders. Never string interpolation or concatenation for logs. Never log secrets, tokens, passwords, connection strings, or sensitive payloads.

```csharp
// Bad
_logger.LogInformation($"Order {order.Id} shipped to {order.CustomerId}");

// Good
_logger.LogInformation("Order {OrderId} shipped to customer {CustomerId}", order.Id, order.CustomerId);
```
