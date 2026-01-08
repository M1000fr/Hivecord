---
order: 85
title: "UserCommand"
icon: person
---

# :icon-person: UserCommand

The `@UserCommand` decorator defines a context menu command that appears when a user right-clicks on a **User** in the Discord interface (under the "Apps" sub-menu).

!!! info "Context Menu"
User commands do not take textual arguments. They are triggered by selecting a target user directly.
!!!

---

## :icon-pencil: Usage

To create a user command, apply the `@UserCommand` decorator to a method within a class decorated with `@SlashCommandController`.

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** The display name of the command in the Discord context menu. |
| `contexts` | `InteractionContext[]` | (Optional) Restricts where the command is available (e.g., Guilds, DMs). |
| `integrationTypes` | `IntegrationType[]` | (Optional) Defines if it's a User or Guild install. |

=== :icon-code: Example
```typescript
import { SlashCommandController, UserCommand, TargetUser, CommandInteraction } from "@decorators/Interaction";
import { UserContextMenuCommandInteraction, User, MessageFlags } from "discord.js";

@SlashCommandController({ name: "User Utils" })
export class UserUtilsController {
    @UserCommand({ name: "Get Joined Date" })
    async getJoinedDate(
        @CommandInteraction() interaction: UserContextMenuCommandInteraction,
        @TargetUser() user: User
    ) {
        const member = await interaction.guild?.members.fetch(user.id);
        
        await interaction.reply({
            content: `${user.username} joined at: ${member?.joinedAt?.toLocaleDateString()}`,
            flags: [MessageFlags.Ephemeral]
        });
    }
}
```
===

---

## :icon-sign-in: Specialized Injector

When handling a `@UserCommand`, you can use the `@TargetUser()` decorator to instantly retrieve the user that was right-clicked.

| Injector | Returns | Description |
| :--- | :--- | :--- |
| `@TargetUser()` | `User` | The Discord User object targeted by the interaction. |
| `@CommandInteraction()` | `UserContextMenuCommandInteraction` | The raw interaction object. |

---

## :icon-light-bulb: Key Features

*   **Automatic Registration**: Like Slash commands, User commands are automatically synced with Discord by Hivecord.
*   **Permissions**: You can apply [`@Permissions`](permissions.md) to the method to restrict who can use this context menu action.
*   **Global/Guild**: Supports both global registration and guild-specific registration.

---
