# :icon-package: Module

The `@Module` decorator is the heart of Hivecord's architecture. It defines a logical unit of your bot, grouping together commands, events, services, and configuration.

!!! success "Modular by Design"
A modular structure makes your bot easier to maintain, test, and scale. Each feature should generally reside in its own module.
!!!

---

## :icon-gear: Configuration

To create a module, apply the `@Module` decorator to a class. This class acts as the entry point and registry for all components belonging to that module.

| Property | Type | Description |
| :--- | :--- | :--- |
| `controllers` | `Class[]` | Classes decorated with `@SlashCommandController` or `@EventController`. |
| `providers` | `Class[]` | Services decorated with `@Injectable` or Interaction handlers. |
| `imports` | `Module[]` | Other modules whose exported providers you want to use. |
| `exports` | `Class[]` | Providers that should be available to modules importing this one. |

=== :icon-code: Example
```typescript
import { Module } from "@decorators/Module";
import { PingCommand } from "./commands/ping";
import { PingService } from "./services/pingService";

@Module({
    controllers: [PingCommand],
    providers: [PingService],
})
export class GeneralModule {}
```
===

---

## :icon-globe: Global Modules

By default, modules are scoped. If you want a module's providers to be available everywhere without importing the module in every other module, use the `@Global()` decorator.

```typescript
@Global()
@Module({
    providers: [SharedService],
    exports: [SharedService],
})
export class CoreModule {}
```

!!! warning "Use Sparingly"
Overusing global modules can make dependency tracking difficult. Reserve this for truly universal services like Database or Logging.
!!!

---

## :icon-workflow: Lifecycle

Modules can hook into the bot's lifecycle. If your module class implements `OnModuleInit`, the `onModuleInit` method will be called when the bot starts and the module is loaded.

```typescript
@Module({...})
export class MyModule implements OnModuleInit {
    onModuleInit() {
        console.log("MyModule has been initialized!");
    }
}
```

---

[!ref text="Back to Home" icon="arrow-left"](/)
[!ref text="Slash Commands" icon="arrow-right"](SlashCommand.md)