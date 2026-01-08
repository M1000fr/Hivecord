# :icon-globe: Global

The `@Global` decorator marks a module as globally available across the entire application.

By default, Hivecord modules are encapsulated. To use a provider from another module, you must import that module. However, some services (like Database, Logging, or Core configurations) are needed everywhere.

!!! warning "Use with Caution"
While `@Global` is convenient, overusing it can make your dependency graph harder to understand. Use it only for truly universal services.
!!!

---

## :icon-pencil: Usage

Apply `@Global()` above the `@Module()` decorator. Any provider listed in the `exports` array will now be available in every other module without needing to import this module.

```typescript
import { Module, Global } from "@decorators/Module";
import { PrismaService } from "./services/PrismaService";

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService], // Must be exported to be globally accessible
})
export class CoreModule {}
```

---

## :icon-info: Key Rules

1. **Exports are Mandatory**: Only the classes listed in the `exports` array of a `@Global` module become globally available.
2. **One-time declaration**: You only need to define a module as global once.
3. **Registration**: The global module must still be registered in the main `Bootstrap` or imported once in the root module to be initialized.

---

[!ref text="Back to Module" icon="arrow-left"](Module.md)
[!ref text="Injectable" icon="arrow-right"](Injectable.md)