---
paths:
  - "**/*.cs"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.py"
---

Optional overlay. AGENTS.md is the complete contract; this file only scopes the same rule to matching paths.

- **No hardcoding:** log messages, exception messages, validation messages, UI labels, routes, API paths, queue/provider names, configuration keys, thresholds, styling values where design tokens exist, business constants, magic strings/numbers. Stable internal values → the project's constants structure (`Constants.cs` / `constants.ts`). Environment-varying values → configuration. User-facing text → localization when the project supports it. Visual values → design tokens.

```csharp
// Bad
throw new ValidationException("Order quantity must be between 1 and 100.");

// Good
throw new ValidationException(Constants.Validation.OrderQuantityOutOfRange);
```
