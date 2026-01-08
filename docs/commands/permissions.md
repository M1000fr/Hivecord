---
order: 60
title: "Permissions"
icon: lock
---

# :icon-lock: Permissions

The `@Permissions` decorator is used to restrict access to commands based on Discord member permissions. It can be applied at both the class (Controller) and method level.

!!! info "Discord Native Permissions"
Hivecord uses Discord's native permission system. This means restricted commands won't even be visible to users who don't have the required permissions.
!!!

---

## :icon-pencil: Usage

Apply `@Permissions()` and pass an array of permission strings (matching Discord.js `PermissionResolvable`).

### :icon-gear: Controller Level
When applied to a `@SlashCommandController`, all commands, subcommands, and context menus within that class will inherit the permission requirement.

```typescript
import { SlashCommandController, Permissions } from "@decorators/Interaction";

@SlashCommandController({
    name: "admin",
    description: "Administrative tools"
})
@Permissions(["Administrator", "ManageGuild"])
export class AdminController {
    // All methods here require Admin + Manage Guild permissions
}
```

### :icon-terminal: Method Level
You can also apply it to specific commands or subcommands for more granular control.

```typescript
@SlashCommand({ name: "ban", description: "Ban a user" })
@Permissions(["BanMembers"])
async banUser(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    // Logic...
}
```

---

## :icon-workflow: Key Features

*   **Logic Inheritance**: If a class has `@Permissions` and a method also has `@Permissions`, the user must satisfy **both** requirements.
*   **Context Menus**: Works seamlessly with `@UserCommand` and `@MessageCommand`.
*   **Type Safety**: The decorator accepts a list of valid Discord permission strings, providing autocompletion in most IDEs.

---

## :icon-light-bulb: Common Permissions

| Permission | Typical Use Case |
| :--- | :--- |
| `Administrator` | Full bot configuration and dangerous commands. |
| `ManageMessages` | Moderation tools (clearing chat, pinning). |
| `KickMembers` / `BanMembers` | Basic moderation (punishments). |
| `ManageRoles` | Role assignment or server setup. |

---
