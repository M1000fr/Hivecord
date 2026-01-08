---
order: 70
title: "Modal"
icon: columns
---

# :icon-columns: Modal

The `@Modal` decorator is used to handle submissions from Discord modals. Modals are pop-up windows containing text inputs, allowing you to collect structured information from users.

---

## :icon-pencil: Usage

Handling a modal is a two-step process:
1.  **Triggering**: Showing the modal to the user (usually via a button or slash command).
2.  **Handling**: Receiving the submission using the `@Modal` decorator.

### 1. Showing the Modal
You must use Discord.js builders to create and show the modal.

```typescript
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

@Button("open_survey")
async showSurvey(@Context() [interaction]: ButtonContext) {
    const modal = new ModalBuilder()
        .setCustomId("user_survey")
        .setTitle("Quick Survey");

    const favoriteFood = new TextInputBuilder()
        .setCustomId("food_input")
        .setLabel("What is your favorite food?")
        .setStyle(TextInputStyle.Short);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(favoriteFood);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
}
```

### 2. Handling the Submission
Use the `@Modal` decorator with the matching `customId`.

```typescript
import { Modal, Context } from "@decorators/Interaction";
import { ModalContext } from "@src/types/InteractionContexts";

@Injectable()
export class SurveyHandler {
    @Modal("user_survey")
    async onSurveySubmit(@Context() [interaction]: ModalContext) {
        const food = interaction.fields.getTextInputValue("food_input");
        await interaction.reply(`Thank you! We've noted that you like ${food}.`);
    }
}
```

---

## :icon-workflow: Wildcard Matching

Just like buttons and select menus, modals support wildcards (`*`) for dynamic IDs.

```typescript
// Matches "report_user:123", "report_user:456", etc.
@Modal("report_user:*")
async onReportSubmit(@Context() [interaction]: ModalContext) {
    const targetUserId = interaction.customId.split(":")[1];
    const reason = interaction.fields.getTextInputValue("reason_input");
    
    // Process report...
    await interaction.reply({ content: "Report submitted.", ephemeral: true });
}
```

---

## :icon-sign-in: Parameter Injection

Modal handlers support the standard injection system.

| Injector | Returns | Description |
| :--- | :--- | :--- |
| `@Context()` | `ModalContext` | Array containing the `ModalSubmitInteraction` and wildcard args. |
| `@Client()` | `HivecordClient` | The bot client instance. |
| `@Inject()` | `any` | Any service needed to process the modal data. |

---

## :icon-light-bulb: Key Points

1.  **Interaction Limit**: Modals can only be shown in response to an interaction (Button, Slash Command, etc.). They cannot be sent "randomly".
2.  **Components**: Modals only support `TextInput` components arranged in `ActionRow`s.
3.  **Response**: You must acknowledge the modal submission (reply or defer) within 3 seconds.

---
