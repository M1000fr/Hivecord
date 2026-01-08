# :icon-zap: Interactions

Hivecord provides an automatic routing system for Discord component interactions (buttons, select menus, and modals). Instead of manually managing a global interaction event, you can decorate methods to respond specifically to certain `customId`s.

!!! tip "Pattern Matching"
Hivecord supports wildcards (`*`) in `customId`s, allowing you to route dynamic IDs (like `user_kick:12345`) to a single method.
!!!

---

## :icon-gear: Decorators

Each decorator links a method to a specific component type and its `customId`.

| Decorator | Component Type | Icon |
| :--- | :--- | :---: |
| `@Button(id)` | Button (`ButtonBuilder`) | :icon-zap: |
| `@SelectMenu(id)` | Select Menu (`StringSelectMenuBuilder`, etc.) | :icon-list-unordered: |
| `@Modal(id)` | Modal window (`ModalBuilder`) | :icon-columns: |

---

## :icon-pencil: Usage

To handle an interaction, create a method in a provider class and decorate it.

=== :icon-code: Button Example
```typescript
import { Button, Context } from "@decorators/Interaction";
import { ButtonContext } from "@src/types/InteractionContexts";

export class ActionHandler {
    @Button("confirm_action")
    async onConfirm(@Context() [interaction]: ButtonContext) {
        await interaction.reply({
            content: "Action confirmed!",
            ephemeral: true
        });
    }
}
```
=== :icon-info: Pattern Example
```typescript
// Matches "user:123", "user:456", etc.
@Button("user:*")
async onUserAction(@Context() [interaction]: ButtonContext) {
    const userId = interaction.customId.split(":")[1];
    await interaction.reply(`Interacting with user ${userId}`);
}
```
===

---

## :icon-rocket: Modals

Handling modals is a two-step process: showing the modal and receiving the submission.

```typescript
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

@Button("open_settings")
async showSettings(@Context() [interaction]: ButtonContext) {
    const modal = new ModalBuilder()
        .setCustomId("settings_modal")
        .setTitle("Bot Settings");

    const input = new TextInputBuilder()
        .setCustomId("nickname")
        .setLabel("New Nickname")
        .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
}

@Modal("settings_modal")
async onSettingsSubmit(@Context() [interaction]: ModalContext) {
    const nickname = interaction.fields.getTextInputValue("nickname");
    await interaction.reply(`Nickname updated to: ${nickname}`);
}
```

---

## :icon-sign-in: Parameter Injection

Interaction methods support the same injection system as Slash Commands.

| Decorator | Description |
| :--- | :--- |
| `@Context()` | Injects the Interaction Context (interaction + parsed args). |
| `@Client()` | Injects the `HivecordClient` instance. |
| `@Inject()` | Injects any registered service or repository. |

---

[!ref text="Back to Home" icon="arrow-left"](/)
[!ref text="Events" icon="arrow-right"](Events.md)