# @Module

The `@Module` decorator is the cornerstone of LeBot's architecture. It allows grouping domain-related components (commands, services, events) and managing dependencies between different parts of the bot.

## Properties

The decorator accepts a configuration object with the following properties:

| Property    | Type     | Description                                                                     |
| :---------- | :------- | :------------------------------------------------------------------------------ |
| `name`      | `string` | The unique name of the module (used for logging and debugging).                 |
| `imports`   | `Array`  | List of other modules this module depends on.                                   |
| `providers` | `Array`  | List of classes (Services, Commands, Events) instantiated by the module.        |
| `config`    | `Class`  | (Optional) Configuration class associated with the module.                      |
| `exports`   | `Array`  | (Optional) List of providers to make available to modules that import this one. |

## Usage Example

```typescript/LeBot/src/modules/Example/ExampleModule.ts#L1-16
import { Module } from "@decorators/Module";
import { ExampleService } from "./services/ExampleService";
import { ExampleCommand } from "./commands/ExampleCommand";
import { DatabaseModule } from "@modules/Database/DatabaseModule";

@Module({
    name: "Example",
    imports: [DatabaseModule],
    providers: [
        ExampleService,
        ExampleCommand
    ],
    exports: [ExampleService]
})
export class ExampleModule {}
```

## @Global

The `@Global` decorator marks a module as global. When a module is global, its exported providers are available in all other modules without the need to import the global module in their `imports` array.

### Usage Example

```typescript/LeBot/src/modules/Shared/SharedModule.ts#L1-10
import { Module } from "@decorators/Module";
import { Global } from "@decorators/Global";
import { SharedService } from "./services/SharedService";

@Global()
@Module({
    name: "Shared",
    providers: [SharedService],
    exports: [SharedService]
})
export class SharedModule {}
```

## How it Works

When the bot starts via the `Bootstrap`, each module is analyzed:

1. `providers` instances are created via the dependency injection (DI) container.
2. Commands are registered with the command registry.
3. Event listeners are attached to the Discord client.
4. Configurations are loaded into the database if necessary.

---

[Back to table of contents](./README.md)
