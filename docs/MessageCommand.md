# :icon-mail: MessageCommand

The `@MessageCommand` decorator defines a context menu command that appears when a user right-clicks on a **Message** in the Discord interface (under the "Apps" sub-menu).

!!! info "Context Menu"
Message commands do not take textual arguments. They are triggered by selecting a specific message as the target.
!!!

---

## :icon-pencil: Usage

To create a message command, apply the `@MessageCommand` decorator to a method within a class decorated with `@SlashCommandController`.

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** The display name of the command in the Discord context menu. |
| `contexts` | `InteractionContext[]` | (Optional) Restricts where the command is available (e.g., Guilds, DMs). |
| `integrationTypes` | `IntegrationType[]` | (Optional) Defines if it's a User or Guild install. |

=== :icon-code: Example
```typescript
import { SlashCommandController, MessageCommand, TargetMessage, CommandInteraction } from "@decorators/Interaction";
import { MessageContextMenuCommandInteraction, Message, MessageFlags } from "discord.js";

@SlashCommandController({ name: "Message Utils" })
export class MessageUtilsController {
    @MessageCommand({ name: "Raw Content" })
    async getRawContent(
        @CommandInteraction() interaction: MessageContextMenuCommandInteraction,
        @TargetMessage() message: Message
    ) {
        await interaction.reply({
            content: `Raw content of the message:\n\`\`\`${message.content || "No text content"}\`\`\``,
            flags: [MessageFlags.Ephemeral]
        });
    }
}
```
===

---

## :icon-sign-in: Specialized Injector

When handling a `@MessageCommand`, you can use the `@TargetMessage()` decorator to instantly retrieve the message that was right-clicked.

| Injector | Returns | Description |
| :--- | :--- | :--- |
| `@TargetMessage()` | `Message` | The Discord Message object targeted by the interaction. |
| `@CommandInteraction()` | `MessageContextMenuCommandInteraction` | The raw interaction object. |

---

## :icon-light-bulb: Key Features

*   **Automatic Registration**: Hivecord automatically handles the registration and synchronization of Message commands with Discord.
*   **Permissions**: Apply `@Permissions` to restrict usage to specific roles or administrative rights.
*   **Validation**: Useful for moderation tools (e.g., "Report Message", "Copy ID") or utility tools (e.g., "Translate Message").

---

[!ref text="Back to UserCommand" icon="arrow-left"](UserCommand.md)
[!ref text="Permissions" icon="arrow-right"](Permissions.md)