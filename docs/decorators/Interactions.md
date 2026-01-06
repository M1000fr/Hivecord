# Interactions (@Button, @SelectMenu, @Modal)

LeBot provides an automatic routing system for Discord component interactions (buttons, select menus, and modals). Instead of manually managing large `switch` or `if` structures within a global event, you can decorate methods to respond specifically to certain `customId`s.

## Interaction Decorators

Each decorator takes a `customId` as an argument. This `customId` can be an exact string or a pattern using wildcards (`*`).

| Decorator               | Component Type                                |
| :---------------------- | :-------------------------------------------- |
| `@Button(customId)`     | Button (`ButtonBuilder`)                      |
| `@SelectMenu(customId)` | Select Menu (`StringSelectMenuBuilder`, etc.) |
| `@Modal(customId)`      | Modal window (`ModalBuilder`)                 |

## Basic Usage

Decorated methods automatically receive the corresponding interaction. For these methods to be registered, the class must be included in a module's `providers`.

```typescript
import { Button } from "@decorators/Interaction";
import { ButtonInteraction } from "discord.js";

export class PingInteractions {
	@Button("ping_button")
	async handlePingButton(interaction: ButtonInteraction) {
		await interaction.reply({
			content: "You clicked the button!",
			ephemeral: true,
		});
	}
}
```

## Pattern Usage (Wildcards)

It is common to use dynamic `customId`s (for example: `user_kick:123456789`). You can use the asterisk `*` to capture these interactions.

```typescript
import { Button } from "@decorators/Interaction";
import { ButtonInteraction } from "discord.js";

export class UserInteractions {
	@Button("user_kick:*")
	async handleKick(interaction: ButtonInteraction) {
		// The full customId is available via interaction.customId
		const userId = interaction.customId.split(":")[1];
		await interaction.reply(`Kick action on user ${userId}`);
	}
}
```

## Parameter Injection

As with Slash commands, you can use parameter decorators to inject the client instance or other utilities:

```typescript
import { Modal } from "@decorators/Interaction";
import { Client } from "@decorators/params/index.ts";
import { ModalSubmitInteraction } from "discord.js";
import { LeBotClient } from "@src/class/LeBotClient";

export class ExampleModal {
	@Modal("my_modal_id")
	async onSubmit(
		interaction: ModalSubmitInteraction,
		@Client() client: LeBotClient,
	) {
		console.log(`Modal submitted by ${interaction.user.tag}`);
	}
}
```

---

[Back to table of contents](./README.md)
