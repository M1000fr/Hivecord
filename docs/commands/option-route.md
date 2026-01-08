---
order: 75
title: "OptionRoute"
icon: git-branch
---

# :icon-git-branch: OptionRoute

The `@OptionRoute` decorator allows you to route different command executions based on the value of a specific option. This is particularly useful when you want to handle multiple actions within a single command without creating separate subcommands.

!!! tip "Alternative to Subcommands"
Use `@OptionRoute` when you want a single flat command with different behaviors based on option values, instead of creating multiple subcommands.
!!!

---

## :icon-pencil: Usage

Apply `@OptionRoute` to methods within a class decorated with `@SlashCommandController`. Each method handles a specific value of a given option.

| Property | Type | Description |
| :--- | :--- | :--- |
| `option` | `string` | **Required.** The name of the option to route on. |
| `value` | `string \| number \| boolean` | **Required.** The specific value that triggers this method. |

=== :icon-code: Example
```typescript
import { SlashCommandController, OptionRoute, CommandInteraction } from "@decorators/Interaction";
import { ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";

@SlashCommandController({
    name: "manage",
    description: "Manage server settings",
    options: [
        {
            name: "action",
            description: "The action to perform",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
                { name: "Reset", value: "reset" }
            ]
        }
    ]
})
export class ManageController {
    @OptionRoute({ option: "action", value: "enable" })
    async handleEnable(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Feature enabled!");
    }

    @OptionRoute({ option: "action", value: "disable" })
    async handleDisable(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Feature disabled!");
    }

    @OptionRoute({ option: "action", value: "reset" })
    async handleReset(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Settings reset to defaults!");
    }
}
```
===

---

## :icon-workflow: How it works

1. **User Action**: User runs `/manage action:enable`
2. **Route Detection**: Hivecord reads the value of the `action` option
3. **Method Selection**: The framework calls the method decorated with `@OptionRoute({ option: "action", value: "enable" })`
4. **Execution**: Your specific handler runs with full access to the interaction

---

## :icon-zap: Multiple Options

You can route on different options by using different option names. This allows for complex routing logic.

```typescript
@SlashCommandController({
    name: "filter",
    description: "Apply filters",
    options: [
        {
            name: "type",
            description: "Filter type",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Users", value: "users" },
                { name: "Messages", value: "messages" }
            ]
        },
        {
            name: "severity",
            description: "Filter severity",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Low", value: "low" },
                { name: "High", value: "high" }
            ]
        }
    ]
})
export class FilterController {
    @OptionRoute({ option: "type", value: "users" })
    async filterUsers(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Filtering users...");
    }

    @OptionRoute({ option: "type", value: "messages" })
    async filterMessages(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Filtering messages...");
    }
}
```

---

## :icon-sign-in: Parameter Injection

Option route handlers support the full [Parameter Injection](../utils/params.md) system.

| Injector | Description |
| :--- | :--- |
| `@CommandInteraction()` | Injects the current `ChatInputCommandInteraction`. |
| `@Context()` | Injects the execution context. |
| `@Client()` | Injects the `HivecordClient` instance. |

---

## :icon-info: When to use @OptionRoute vs @Subcommand

| Use Case | Recommended Decorator |
| :--- | :--- |
| Different actions within the same conceptual command | `@OptionRoute` |
| Logically distinct commands that share a prefix | `@Subcommand` |
| Need to support nested groups | `@Subcommand` |
| Want to keep command list flat but with variants | `@OptionRoute` |

---

## :icon-light-bulb: Key Points

1. **Choices**: Works best with options that have defined `choices` to ensure valid routing.
2. **Type Safety**: The `value` parameter supports strings, numbers, and booleans to match Discord's option types.
3. **Fallback**: If no route matches the provided value, the interaction will not be handled automatically. Consider implementing a default handler with `@SlashCommand()`.
4. **Clean Code**: Keeps your command logic organized by separating different actions into distinct methods.

---