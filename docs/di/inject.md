---
order: 90
title: "Inject"
icon: link-external
---

# :icon-link-external: Inject

The `@Inject` decorator is used for manual dependency injection when the automatic type-based resolution is not sufficient or when you need to inject a specific token.

While Hivecord usually resolves dependencies automatically using TypeScript types, `@Inject` gives you explicit control over what gets passed to your class constructor.

---

## :icon-pencil: Usage

Use `@Inject()` before a constructor parameter to specify exactly which provider should be injected.

### :icon-key: Token Injection
This is useful when you have a value or service registered with a string or symbol token rather than a class.

```typescript
import { Injectable, Inject } from "@decorators/Injectable";

@Injectable()
export class ConfigService {
    constructor(
        @Inject("API_KEY") private readonly apiKey: string
    ) {}
}
```

### :icon-sync: Resolving Circular Dependencies
If two services depend on each other, automatic injection might fail. `@Inject` used with a forward reference can help resolve these situations.

```typescript
@Injectable()
export class ServiceA {
    constructor(
        @Inject(() => ServiceB) private readonly serviceB: any
    ) {}
}
```

---

## :icon-info: When to use @Inject?

| Scenario | Use @Inject? |
| :--- | :--- |
| Injecting a standard class | **No** (Auto-injection is preferred) |
| Injecting via String/Symbol token | **Yes** |
| Injecting a constant value | **Yes** |
| Circular dependencies | **Yes** |

---

## :icon-light-bulb: Tip
For 90% of use cases, you don't need `@Inject`. Simply declaring the type in your constructor is the cleanest way to handle dependencies:

```typescript
// Prefer this:
constructor(private readonly myService: MyService) {}

// Over this (unless necessary):
constructor(@Inject(MyService) private readonly myService: MyService) {}
```

---

[!ref text="Back to Injectable" icon="arrow-left"](injectable.md)
[!ref text="Repository" icon="arrow-right"](repository.md)
