---
order: 100
title: "Overview"
icon: zap
---

# :icon-zap: Interactions Overview

Hivecord provides an automatic routing system for Discord component interactions (buttons, select menus, and modals). Instead of manually managing a global interaction event and writing complex `switch` or `if/else` logic, you can decorate methods to respond specifically to certain `customId`s.

!!! tip "Pattern Matching"
All component decorators support wildcards (`*`) in their `customId`s, allowing you to route dynamic IDs (like `user_kick:12345` or `page:2`) to a single method.
!!!

---

## :icon-gear: Component Decorators

Hivecord supports the three main types of Discord UI components. Each has its own specialized decorator and context.

| Decorator | Component Type | Documentation |
| :--- | :--- | :--- |
| [`@Button`](button.md) | Standard buttons and link buttons | [Learn more](button.md) |
| [`@SelectMenu`](select-menu.md) | String, User, Role, Channel, and Mentionable menus | [Learn more](select-menu.md) |
| [`@Modal`](modal.md) | Pop-up text input windows | [Learn more](modal.md) |

---

## :icon-pencil: Quick Example

Interactions are typically handled within classes marked as `providers` in your modules.

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

    @Button("cancel_action:*")
    async onCancel(@Context() [interaction]: ButtonContext) {
        const actionId = interaction.customId.split(":")[1];
        await interaction.reply(`Action ${actionId} was cancelled.`);
    }
}
```

---

## :icon-workflow: Key Features

*   **Decoupled Logic**: Keep your UI logic separate from your command logic.
*   **Automatic Injection**: Use the same [Parameter Injection](../utils/params.md) system available in Slash Commands.
*   **Wildcard Routing**: Effortlessly handle dynamic components without manual parsing loops.
*   **Type Safety**: Specialized context types for each component (e.g., `StringSelectContext`, `ModalContext`).

---
