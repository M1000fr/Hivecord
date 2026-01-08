# Interactions (@Button, @SelectMenu, @Modal)

Hivecord provides an automatic routing system for Discord component interactions (buttons, select menus, and modals). Instead of manually managing large `switch` or `if` structures within a global event, you can decorate methods to respond specifically to certain `customId`s.

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
import { Button, Context } from "@decorators/Interaction";
import { ButtonContext } from "@src/types/InteractionContexts";

export class PingInteractions {
	@Button("ping_button")
	async handlePingButton(
		@Context() [interaction]: ButtonContext,
	) {
		await interaction.reply({
			content: "You clicked the button!",
			flags: [MessageFlags.Ephemeral],
		});
	}
}
```

## Pattern Usage (Wildcards)

It is common to use dynamic `customId`s (for example: `user_kick:123456789`). You can use the asterisk `*` to capture these interactions.

```typescript
import { Button, Context } from "@decorators/Interaction";
import { ButtonContext } from "@src/types/InteractionContexts";

export class UserInteractions {
	@Button("user_kick:*")
	async handleKick(@Context() [interaction]: ButtonContext) {
		// The full customId is available via interaction.customId
		const userId = interaction.customId.split(":")[1];
		await interaction.reply(`Kick action on user ${userId}`);
	}
}
```

## Modal Usage

Creating and handling modals uses `ModalBuilder` and `LabelBuilder` (modern Discord.js syntax).

```typescript
import { Button, Modal, Context } from "@decorators/Interaction";
import { ButtonContext, ModalContext } from "@src/types/InteractionContexts";
import { ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export class ExampleModal {
	@Button("open_modal")
	async openModal(@Context() [interaction]: ButtonContext) {
		const modal = new ModalBuilder()
			.setCustomId("my_modal_id")
			.setTitle("Example Modal");

		const input = new TextInputBuilder()
			.setCustomId("favorite_color")
			.setStyle(TextInputStyle.Short);

		const label = new LabelBuilder()
			.setLabel("What is your favorite color?")
			.setDescription("This will be shown as a header")
			.setTextInputComponent(input);

		modal.addLabelComponents(label);

		await interaction.showModal(modal);
	}

	@Modal("my_modal_id")
	async onSubmit(@Context() [interaction]: ModalContext) {
		const color = interaction.fields.getTextInputValue("favorite_color");
		await interaction.reply(`You chose: ${color}`);
	}
}
```

## Parameter Injection

As with Slash commands, you can use parameter decorators to inject the client instance or other utilities:

```typescript
import { Modal, Context } from "@decorators/Interaction";
import { ModalContext } from "@src/types/InteractionContexts";
import { Client } from "@decorators/params/index.ts";
import { HivecordClient } from "@src/class/HivecordClient";

export class ExampleModalHandler {
	@Modal("my_modal_id")
	async onSubmit(
		@Context() [interaction]: ModalContext,
		@Client() client: HivecordClient,
	) {
		console.log(`Modal submitted by ${interaction.user.tag}`);
	}
}
```

---

[Back to table of contents](./README.md)
