# Interactions (@Button, @SelectMenu, @Modal)

Hivecord provides an automatic routing system for Discord component interactions (buttons, select menus, and modals). Instead of manually managing large `switch` or `if` structures within a global event, you can decorate methods to respond specifically to certain `customId`s.

!!! tip
This system works seamlessly with Discord's `customId` limit (100 characters). You can use compact naming conventions and Hivecord will still route them correctly.
!!!

---

## Interaction Decorators

Each decorator takes a `customId` as an argument. This `customId` can be an exact string or a pattern using wildcards (`*`).

| Decorator | Component Type | Icon |
| :--- | :--- | :---: |
| `@Button(customId)` | Button (`ButtonBuilder`) | :icon-zap: |
| `@SelectMenu(customId)` | Select Menu (`StringSelectMenuBuilder`, etc.) | :icon-list-unordered: |
| `@Modal(customId)` | Modal window (`ModalBuilder`) | :icon-Columns: |

---

## Basic Usage

Decorated methods automatically receive the corresponding interaction. For these methods to be registered, the class must be included in a module's `providers`.

=== :icon-code: Standard Example
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
=== :icon-info: Dependency Injection
Remember that the class containing these decorators must be decorated with `@Injectable()` or registered in a `@Module()` to be detected by the loader.
===

---

## Pattern Usage (Wildcards)

It is common to use dynamic `customId`s (for example: `user_kick:123456789`). You can use the asterisk `*` to capture these interactions.

```typescript
@Button("user_kick:*")
async handleKick(@Context() [interaction]: ButtonContext) {
    // The full customId is available via interaction.customId
    const userId = interaction.customId.split(":")[1];
    await interaction.reply(`Kick action on user ${userId}`);
}
```

!!! warning "Pattern Matching"
Patterns are matched in the order they are loaded. Specific IDs should generally be defined before wildcard patterns if they overlap.
!!!

---

## Modal Usage

Creating and handling modals uses `ModalBuilder` and `LabelBuilder` (modern Discord.js syntax).

=== :icon-rocket: Implementation
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
            .setLabel("What is your favorite color?")
            .setStyle(TextInputStyle.Short);

        // Hivecord supports adding components directly or via rows
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

        await interaction.showModal(modal);
    }

    @Modal("my_modal_id")
    async onSubmit(@Context() [interaction]: ModalContext) {
        const color = interaction.fields.getTextInputValue("favorite_color");
        await interaction.reply(`You chose: ${color}`);
    }
}
```
=== :icon-light-bulb: Tip
Use unique prefixes for your modal IDs to avoid collisions with other modules.
===

---

## Parameter Injection

As with Slash commands, you can use parameter decorators to inject the client instance or other utilities.

| Decorator | Description |
| :--- | :--- |
| `@Context()` | Injects the Interaction Context array (interaction, args, etc). |
| `@Client()` | Injects the `HivecordClient` instance. |
| `@Inject()` | Injects any other registered service or repository. |

```typescript
@Modal("my_modal_id")
async onSubmit(
    @Context() [interaction]: ModalContext,
    @Client() client: HivecordClient,
) {
    console.log(`Modal submitted by ${interaction.user.tag}`);
}
```

---

[!ref text="Back to table of contents" icon="arrow-left"]/)