---
paths:
  - "**/*.cs"
---

Optional overlay. AGENTS.md is the complete contract; this file only scopes the same rule to matching paths.

- **C#:** explicit types by default. `var` only for simple primitive locals where the type is obvious. Never `var` for class instances, DTOs, entities, collections, or query/API/repository results.

```csharp
// Bad
var order = await _orderRepository.GetByIdAsync(orderId);

// Good
Order order = await _orderRepository.GetByIdAsync(orderId);
```
