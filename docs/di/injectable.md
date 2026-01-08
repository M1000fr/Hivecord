---
order: 100
title: "Injectable"
icon: link
---

# :icon-link: Injectable

The `@Injectable` decorator marks a class as a "provider" that can be managed by Hivecord's Dependency Injection (DI) system. This allows you to easily share instances of services, repositories, or utilities across your modules.

!!! info "Dependency Injection"
DI is a design pattern where a class receives its dependencies from an external source rather than creating them itself. This makes your code more modular, testable, and easier to maintain.
!!!

---

## :icon-pencil: Usage

To make a class injectable, simply apply the `@Injectable` decorator to it. Once marked, Hivecord will automatically manage its lifecycle and provide it to other components that require it.

=== :icon-code: Service Example
```typescript
import { Injectable } from "@decorators/Injectable";

@Injectable()
export class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`);
    }
}
```
===

---

## :icon-sign-in: Constructor Injection

The most common way to use an injectable class is by requesting it in the constructor of another component (like a Controller or another Service). Hivecord uses TypeScript's reflection to automatically resolve and inject the correct instance.

```typescript
import { SlashCommandController, SlashCommand, CommandInteraction } from "@decorators/Interaction";
import { LoggerService } from "./services/LoggerService";

@SlashCommandController({ name: "test" })
export class TestCommand {
    // Hivecord automatically injects the LoggerService instance here
    constructor(private readonly logger: LoggerService) {}

    @SlashCommand()
    async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        this.logger.log("Executing test command...");
        await interaction.reply("Check the console!");
    }
}
```

---

## :icon-light-bulb: Tip
For most cases, you don't need manual decorators for injection. Simply typing your constructor parameter with the class is enough for Hivecord to find it.

---
