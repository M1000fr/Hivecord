# :icon-diff: ContextMenu

Context menu commands allow users to interact with your bot by right-clicking on a **User** or a **Message** in Discord.

---

## :icon-person: User Commands

The `@UserCommand` decorator defines a command that appears when right-clicking a user.

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Display name in the context menu. |
| `contexts` | `InteractionContext[]` | (Optional) Defines where the command is available. |

=== :icon-code: Example
```typescript
import { UserCommand, TargetUser, Context } from "@decorators/Interaction";
import { UserContextMenuCommandInteraction, User } from "discord.js";

@SlashCommandController({ name: "User Utils" }) // Required container
export class UserUtils {
    @UserCommand({ name: "Get Avatar" })
    async getAvatar(
        @CommandInteraction() interaction: UserContextMenuCommandInteraction,
        @TargetUser() user: User
    ) {
        await interaction.reply(`${user.username}'s avatar: ${user.displayAvatarURL()}`);
    }
}
```
===

---

## :icon-mail: Message Commands

The `@MessageCommand` decorator defines a command that appears when right-clicking a message.

=== :icon-code: Example
```typescript
import { MessageCommand, TargetMessage } from "@decorators/Interaction";
import { MessageContextMenuCommandInteraction, Message } from "discord.js";

@SlashCommandController({ name: "Message Utils" })
export class MessageUtils {
    @MessageCommand({ name: "Raw Content" })
    async getRaw(
        @CommandInteraction() interaction: MessageContextMenuCommandInteraction,
        @TargetMessage() message: Message
    ) {
        await interaction.reply({
            content: `\`\`\`${message.content}\`\`\``,
            ephemeral: true
        });
    }
}
```
===

---

## :icon-sign-in: Specialized Injectors

When using Context Commands, you have access to specific parameter injectors:

| Injector | Description |
| :--- | :--- |
| `@TargetUser()` | Injects the `User` object that was right-clicked. |
| `@TargetMessage()` | Injects the `Message` object that was right-clicked. |
| `@CommandInteraction()` | Injects the interaction (automatically typed). |

---

[!ref text="Back to Home" icon="arrow-left"](/)
[!ref text="Permissions" icon="arrow-right"](Permissions.md)