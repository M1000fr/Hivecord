---
order: 80
title: "Subcommand"
icon: stack
---

# :icon-stack: Subcommand

The `@Subcommand` decorator allows you to organize complex commands into logical groups. Instead of having a single flat command, you can create a hierarchy (e.g., `/config view` and `/config edit`).

!!! info "Discord Limits"
Discord allows up to two levels of nesting:
1. `command subcommand`
2. `command subcommand-group subcommand`
!!!

---

## :icon-pencil: Usage

Subcommands are defined as methods within a class decorated with `@SlashCommandController`. Each subcommand requires its own name and description.

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | (Optional) The subcommand name. If not provided, uses the method name. |
| `group` | `string` | (Optional) The subcommand group name for nested commands. |

=== :icon-code: Example
```typescript
import { SlashCommandController, Subcommand, CommandInteraction } from "@decorators/Interaction";
import { ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";

@SlashCommandController({
    name: "user",
    description: "User management commands",
    options: [
        {
            name: "info",
            description: "Show information about a user",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "avatar",
            description: "Show a user's avatar",
            type: ApplicationCommandOptionType.Subcommand
        }
    ]
})
export class UserController {
    @Subcommand({ name: "info" })
    async info(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        // Logic for /user info
    }

    @Subcommand({ name: "avatar" })
    async avatar(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        // Logic for /user avatar
    }
}
```
===

---

## :icon-workflow: Subcommand Groups

If you need deeper organization, you can use **Subcommand Groups**. These are defined in the `@SlashCommandController` options, and the subcommands then reference the group name.

```typescript
@SlashCommandController({
    name: "config",
    description: "Bot configuration",
    options: [
        {
            name: "admin",
            description: "Admin-only settings",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "setup",
                    description: "Initial bot setup",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        }
    ]
})
export class ConfigController {
    @Subcommand({ name: "setup", group: "admin" })
    async setup(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        // Executed for: /config admin setup
    }
}
```

---

## :icon-light-bulb: Key Benefits

*   **Cleaner UX**: Users can easily find related actions under a single main command.
*   **Method Routing**: Hivecord automatically routes the interaction to the correct method, so you don't have to check `interaction.options.getSubcommand()`.
*   **Parameters**: Each subcommand method can have its own specific [Parameters Injection](../utils/params.md).

---
