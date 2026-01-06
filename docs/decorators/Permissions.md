# Permissions (@CommandPermission)

LeBot uses a granular permission system to restrict access to commands. Unlike native Discord permissions which are often limited, the `@CommandPermission` decorator allows linking a command to a specific permission defined in the `EPermission` enum.

## @CommandPermission

This decorator can be applied either to a **class** (to protect all methods inside) or to a **specific method** of a command.

### Usage on a method

This is the most common use to protect the entry point of a Slash command.

```typescript
import {
	SlashCommandController,
	SlashCommand,
} from "@decorators/commands/SlashCommand";
import { CommandPermission } from "@decorators/commands/CommandPermission";
import { EPermission } from "@enums/EPermission";

@SlashCommandController({
	name: "admin",
	description: "Administration commands",
})
export default class AdminCommand {
	@CommandPermission(EPermission.Admin) // Requires 'Admin' permission
	@SlashCommand()
	async execute(
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.reply("Access granted to administration.");
	}
}
```

### Usage on a class

If you apply the decorator to the class, all commands and subcommands within that class will inherit the restriction.

```typescript
@CommandPermission(EPermission.Moderator)
@SlashCommandController({ name: "mod", description: "Moderation tools" })
export default class ModCommand {
	// All methods here require Moderator permission
}
```

## Internal Working

1. **Verification**: When a command is called, an interceptor (`CommandPermissionInterceptor`) checks if the user possesses the required permission in the database or through their Discord roles.
2. **Denial**: If the user does not have the permission, execution is halted and an error message (often translated via i18n) is sent automatically.
3. **EPermission**: Available permissions are centralized in `src/enums/EPermission.ts`.

## Key Points

- **Cumulative**: If a permission is defined on both the class AND the method, the method's permission generally prevails or is added depending on the interceptor's configuration.
- **Hierarchy**: The permission system is independent of Discord's native permissions (ManageMessages, etc.), allowing for much more flexible management through the bot's Configuration module.

---

[Back to table of contents](./README.md)
