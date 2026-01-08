# Context Commands (@UserCommand & @MessageCommand)

Context commands are interactions that appear in the Discord context menu (right-click on a user or a message). Unlike Slash commands, they do not take textual arguments but act directly on the selected target.

## @UserCommand

This decorator defines a command that executes on a **user**.

### Configuration

- `name`: The name that will appear in the "Apps" menu of the user.
- `defaultMemberPermissions`: (Optional) Permissions required to use the command.

### Example

```typescript
import { UserCommand } from "@decorators/commands/UserCommand";
import { CommandInteraction } from "@decorators/Interaction";
import { TargetUser } from "@decorators/params/TargetUser";
import { UserContextMenuCommandInteraction, User } from "discord.js";

@UserCommand({
	name: "Get Avatar",
})
export default class GetAvatarCommand {
	async execute(
		@CommandInteraction() interaction: UserContextMenuCommandInteraction,
		@TargetUser() user: User,
	) {
		const avatarUrl = user.displayAvatarURL({ size: 1024 });
		await interaction.reply({
			content: `Avatar of ${user.username}: ${avatarUrl}`,
			flags: [MessageFlags.Ephemeral],
		});
	}
}
```

## @MessageCommand

This decorator defines a command that executes on a **message**.

### Example

```typescript
import { MessageCommand } from "@decorators/commands/MessageCommand";
import { CommandInteraction } from "@decorators/Interaction";
import { TargetMessage } from "@decorators/params/TargetMessage";
import { MessageContextMenuCommandInteraction, Message } from "discord.js";

@MessageCommand({
	name: "Copy Content",
})
export default class CopyMessageCommand {
	async execute(
		@CommandInteraction() interaction: MessageContextMenuCommandInteraction,
		@TargetMessage() message: Message,
	) {
		await interaction.reply({
			content: `Content copied: \`\`\`${message.content}\`\`\``,
			flags: [MessageFlags.Ephemeral],
		});
	}
}
```

## Key Points

1. **Specific Parameters**: Use `@TargetUser()` to retrieve the target user and `@TargetMessage()` for the target message.
2. **Interaction Types**: Ensure you use the correct Discord.js types (`UserContextMenuCommandInteraction` or `MessageContextMenuCommandInteraction`) to benefit from autocompletion.
3. **Registration**: As with Slash commands, these classes must be declared in the `providers` of a `@Module`.
4. **Shared Names**: You can have a `UserCommand` and a `MessageCommand` (and a Slash Command) with the same name. Hivecord automatically distinguishes them based on their interaction type.

---

[Back to table of contents]/)
