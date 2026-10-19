---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

Optional overlay. AGENTS.md is the complete contract; this file only scopes the same rule to matching paths.

- **TypeScript:** no `any`. Explicit types for API responses, DTOs, domain objects, props, and state.

```ts
// Bad
const response: any = await api.get(`/orders/${orderId}`);

// Good
const response: ApiResponse<OrderDto> = await api.get<OrderDto>(`/orders/${orderId}`);
```
