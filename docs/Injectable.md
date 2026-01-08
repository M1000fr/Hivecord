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

## :icon-tools: Manual Injection (@Inject)

In some cases (like when using interfaces or specific tokens), automatic type-based injection might not be enough. You can use the `@Inject` decorator to manually specify what should be injected.

```typescript
import { Injectable, Inject } from "@decorators/Injectable";

@Injectable()
export class MyService {
    constructor(
        @Inject("DATABASE_CONNECTION") private readonly db: any
    ) {}
}
```

!!! tip "Standard Injection"
For most cases, you don't need `@Inject`. Simply typing your constructor parameter with the class is enough for Hivecord to find it.
!!!

---

## :icon-shield: Repositories

For data access with Prisma, Hivecord provides a specialized `@Repository` decorator. It works exactly like `@Injectable` but is semantically clearer for data layers.

```typescript
import { Repository } from "@decorators/Repository";
import { PrismaService } from "@src/prisma/PrismaService";

@Repository()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }
}
```

---

[!ref text="Back to Home" icon="arrow-left"](/)
[!ref text="Interceptors" icon="arrow-right"](Interceptors.md)