# Interceptors (@UseInterceptors)

Interceptors are a powerful concept inspired by Aspect-Oriented Programming (AOP). They allow you to group cross-cutting concerns such as validation, logging, error handling, or permission checks, and apply them declaratively to your commands or events.

## @UseInterceptors

The `@UseInterceptors` decorator allows binding one or more interceptors to a class or a specific method.

### Scope

- **On a class**: The interceptor will apply to all entry points (decorated methods) of the class.
- **On a method**: The interceptor will only apply to that specific method.

```typescript/LeBot/src/modules/General/commands/SecureCommand.ts#L1-15
import { UseInterceptors } from "@decorators/UseInterceptors";
import { CommandPermissionInterceptor } from "@interceptors/CommandPermissionInterceptor";

@SlashCommandController({ name: "admin", description: "Secure zone" })
export default class SecureCommand {
    @UseInterceptors(CommandPermissionInterceptor)
    @SlashCommand()
    async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Access granted!");
    }
}
```

## Creating an Interceptor

An interceptor is a class decorated with `@Injectable` (or simply managed by the DI system) that implements the `IInterceptor` interface.

### The IInterceptor Interface

It requires the implementation of the `intercept(context, next)` method:

- `context`: Contains information about the current execution (interaction, client, arguments).
- `next`: An asynchronous function that allows continuing the execution flow to the next interceptor or the final method.

### Example: LoggingInterceptor

```typescript/LeBot/src/interceptors/LoggingInterceptor.ts#L1-15
import { IInterceptor } from "@interfaces/IInterceptor";
import { IExecutionContext } from "@interfaces/IExecutionContext";

export class LoggingInterceptor implements IInterceptor {
    async intercept(context: IExecutionContext, next: () => Promise<void>) {
        const start = Date.now();
        console.log(`Before executing ${context.getHandler().name}...`);

        await next(); // Calls the next interceptor or the target method

        const duration = Date.now() - start;
        console.log(`Execution finished in ${duration}ms`);
    }
}
```

## The IExecutionContext Object

The context object passed to the interceptor provides methods to inspect the current call:

- `getHandler()`: Returns a reference to the method that is about to be executed.
- `getClass()`: Returns the constructor of the target class.
- `getArguments()`: Returns the list of arguments that will be passed to the method.
- `getInteraction()`: Returns the Discord interaction object (if applicable).

## Execution Flow

Interceptors work like an onion (similar to Koa or Express middleware):

1. Interceptor A (pre-processing)
2. Interceptor B (pre-processing)
3. Target Method (execution)
4. Interceptor B (post-processing)
5. Interceptor A (post-processing)

If an interceptor does not call `await next()`, command execution is interrupted. This is how permission checks are implemented.

---

[Back to table of contents](./README.md)
