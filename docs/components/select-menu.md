---
order: 80
title: "SelectMenu"
icon: list-unordered
---

# :icon-list-unordered: SelectMenu

The `@SelectMenu` decorator is used to handle interactions from Discord select menus (string, user, role, mentionable, and channel select menus). It automatically routes the interaction to the decorated method based on the component's `customId`.

---

## :icon-pencil: Usage

To handle a select menu interaction, apply the `@SelectMenu` decorator to a method. Like buttons, it supports both exact matches and wildcard patterns.

| Argument | Type | Description |
| :--- | :--- | :--- |
| `customId` | `string` | The ID of the select menu to listen for. Supports wildcards (`*`). |

=== :icon-code: String Select
```typescript
import { SelectMenu, Context } from "@decorators/Interaction";
import { StringSelectContext } from "@src/types/InteractionContexts";

@Injectable()
export class SettingsHandler {
    @SelectMenu("theme_selector")
    async onThemeSelect(@Context() [interaction]: StringSelectContext) {
        const selectedTheme = interaction.values[0];
        await interaction.reply({
            content: `Theme updated to: ${selectedTheme}`,
            ephemeral: true
        });
    }
}
```
===

---

## :icon-workflow: Wildcard Matching

Wildcards allow you to handle multiple menus with a single method, which is particularly useful for paginated lists or dynamically generated menus.

```typescript
// Matches "role_assign:1", "role_assign:2", etc.
@SelectMenu("role_assign:*")
async onRoleSelect(@Context() [interaction]: StringSelectContext) {
    const categoryId = interaction.customId.split(":")[1];
    const roles = interaction.values;
    
    await interaction.reply(`Updated roles for category ${categoryId}`);
}
```

---

## :icon-package: Supported Menu Types

Hivecord's `@SelectMenu` decorator works with all Discord.js select menu types. Ensure you use the correct context type for better TypeScript support:

| Menu Type | Context Type |
| :--- | :--- |
| **StringSelectMenu** | `StringSelectContext` |
| **UserSelectMenu** | `UserSelectContext` |
| **RoleSelectMenu** | `RoleSelectContext` |
| **MentionableSelectMenu** | `MentionableSelectContext` |
| **ChannelSelectMenu** | `ChannelSelectContext` |

---

## :icon-sign-in: Parameter Injection

Select menu handlers support the full injection system to access the interaction and services.

| Injector | Description |
| :--- | :--- |
| `@Context()` | Injects the interaction and any parsed wildcard arguments. |
| `@Client()` | Injects the `HivecordClient` instance. |
| `@Inject(Service)` | Injects a registered service to handle business logic. |

---

## :icon-light-bulb: Key Points

1. **Values**: Unlike buttons, select menus provide an `interaction.values` array containing the user's selection(s).
2. **Detection**: For your handlers to be active, the class must be listed in the `providers` array of a registered `@Module`.
3. **Multi-select**: If your menu allows multiple selections, `interaction.values` will contain all selected items.

---

[!ref text="Back to Button" icon="arrow-left"](button.md)
[!ref text="Modal" icon="arrow-right"](modal.md)
