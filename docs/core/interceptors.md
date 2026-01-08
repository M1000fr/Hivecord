---
order: 80
title: "UseInterceptors"
icon: shield
---

# :icon-shield: Interceptors

Interceptors are powerful tools that allow you to inject logic before or after the execution of a command or interaction. They are ideal for handling permissions, logging, or data validation in a reusable way.

!!! info "Middleware Pattern"
If you are familiar with web frameworks like Express or NestJS, interceptors work very similarly to middleware or guards.
!!!

---

## :icon-pencil: Usage

To apply an interceptor, use the `@UseInterceptors()` decorator. You can apply it to an entire class (all methods will be intercepted) or to a specific method.

=== :icon-code: Class Level
```typescript
@SlashCommandController({ name: "admin", description: "Admin tools" })
@UseInterceptors(AdminLogInterceptor)
export class AdminController {
    // All commands in this class will trigger the interceptor
}
```
=== :icon-info: Method Level
```typescript
@SlashCommand()
@UseInterceptors(CooldownInterceptor)
async spammyCommand(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    await interaction.reply("You can only do this once every 30 seconds!");
}
```
===

---

## :icon-tools: Creating an Interceptor

An interceptor is a class that implements the `IInterceptor` interface. It must define an `intercept` method.

```typescript
import { IInterceptor, ExecutionContext, CallHandler } from "@interfaces/Interceptors";

@Injectable()
export class LoggingInterceptor implements IInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler) {
        console.log(`Before command: ${context.getHandler().name}`);
        
        const result = await next.handle();
        
        console.log(`After command execution`);
        return result;
    }
}
```

---

## :icon-workflow: Lifecycle

1. **Trigger**: An interaction (Slash Command, Button, etc.) is received.
2. **Pre-intercept**: The interceptor's code before `next.handle()` is executed.
3. **Execution**: The actual command method is called.
4. **Post-intercept**: The code after `next.handle()` is executed.

---

## :icon-light-bulb: Common Use Cases

| Use Case | Description |
| :--- | :--- |
| **Logging** | Track who is using which command and when. |
| **Cooldowns** | Limit how often a user can trigger a specific action. |
| **Maintenance** | Globally disable certain features for maintenance. |
| **Validation** | Check if the guild has enough "Gold" before allowing a purchase command. |

---
