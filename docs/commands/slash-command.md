---
order: 90
title: "SlashCommand"
icon: terminal
---

# :icon-terminal: SlashCommand

The `@SlashCommand` decorator defines the primary entry point for a Discord Slash command. It is used on methods within a class decorated with `@SlashCommandController`.

!!! success "Auto-Routing"
Hivecord automatically routes the incoming interaction to the correct method. No need for complex `if/else` checks or manual event listening.
!!!

---

## :icon-pencil: Usage

In its simplest form, apply `@SlashCommand()` to a method. By default, this method will be called when the base command defined in the controller is executed.

=== :icon-code: Example
```typescript
import { SlashCommandController, SlashCommand, CommandInteraction } from "@decorators/Interaction";
import { ChatInputCommandInteraction } from "discord.js";

@SlashCommandController({
    name: "ping",
    description: "Simple ping command"
})
export class PingController {
    @SlashCommand()
    async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong! :ping_pong:");
    }
}
```
===

---

## :icon-sign-in: Parameter Injection

Command methods support automatic parameter injection to facilitate access to Discord objects and bot services.

| Decorator | Description |
| :--- | :--- |
| `@CommandInteraction()` | Injects the current `ChatInputCommandInteraction`. |
| `@Context()` | Injects the `IExecutionContext` (translations, guild config). |
| `@Client()` | Injects the `HivecordClient` instance. |

!!! tip
Check the [Parameters Injection](../utils/params.md) guide for the full list of available injectors.
!!!

---

## :icon-workflow: Execution Flow

1. **Trigger**: User types `/ping` in Discord.
2. **Reception**: Hivecord's command handler receives the interaction.
3. **Interception**: Any [Interceptors](../core/interceptors.md) defined on the class or method are executed.
4. **Execution**: The `@SlashCommand` method is called with its injected parameters.
5. **Response**: Your code handles the interaction (reply, defer, edit, etc.).

---
