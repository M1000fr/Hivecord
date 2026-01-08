---
order: 100
title: "SlashCommandController"
icon: gear
---

# :icon-gear: SlashCommandController

The `@SlashCommandController` decorator is the cornerstone of Hivecord's command system. It defines a class as a container for Discord Slash commands, subcommands, and context menus.

!!! info "Class-Based Commands"
Instead of writing long `if/else` chains in a single event, Hivecord encourages grouping related commands within a Controller class.
!!!

---

## :icon-pencil: Usage

To define a command, apply `@SlashCommandController` to a class. For the controller to be active, the class must be registered in a module's `controllers` array.

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** The primary command name (lowercase, no spaces). |
| `description` | `string` | **Required.** Brief description shown in the Discord UI. |
| `contexts` | `InteractionContext[]` | (Optional) Restricts where the command can be used (e.g., Guilds only, DMs). |
| `integrationTypes` | `IntegrationType[]` | (Optional) Defines if the command is a User Install or Guild Install. |

=== :icon-code: Example
```typescript
import { SlashCommandController, SlashCommand } from "@decorators/Interaction";
import { ChatInputCommandInteraction } from "discord.js";

@SlashCommandController({
    name: "ping",
    description: "Basic connectivity test"
})
export class PingController {
    @SlashCommand()
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong! :ping_pong:");
    }
}
```
===

---

## :icon-workflow: How it works

1. **Detection**: During bootstrap, Hivecord scans modules for `controllers`.
2. **Parsing**: It reads the `@SlashCommandController` metadata to build the Discord JSON command structure.
3. **Registration**: The framework automatically synchronizes these definitions with Discord (handling Global vs Guild commands).
4. **Routing**: When a user runs `/name`, Hivecord identifies the controller and calls the appropriate method.

---
