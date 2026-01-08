---
order: 90
title: "Button"
icon: zap
---

# :icon-zap: Button

The `@Button` decorator allows you to handle interactions from Discord buttons. Instead of managing a global `interactionCreate` event, you can route specific button clicks directly to your methods.

---

## :icon-pencil: Usage

To handle a button click, apply the `@Button` decorator to a method. The decorator takes the button's `customId` as its primary argument.

| Argument | Type | Description |
| :--- | :--- | :--- |
| `customId` | `string` | The ID of the button to listen for. Supports wildcards (`*`). |

=== :icon-code: Exact Match
```typescript
import { Button, Context } from "@decorators/Interaction";
import { ButtonContext } from "@src/types/InteractionContexts";

@Injectable()
export class MyHandler {
    @Button("my_unique_button")
    async onClick(@Context() [interaction]: ButtonContext) {
        await interaction.reply("Button clicked!");
    }
}
```
===

---

## :icon-workflow: Wildcard Matching

You can use the asterisk (`*`) as a wildcard to handle dynamic IDs. This is useful when you include data (like a user ID) in the button's `customId`.

```typescript
// Matches "user_profile:12345", "user_profile:67890", etc.
@Button("user_profile:*")
async onProfileClick(@Context() [interaction]: ButtonContext) {
    const userId = interaction.customId.split(":")[1];
    await interaction.reply(`Opening profile for user ${userId}`);
}
```

!!! tip "ID Naming"
Using a colon (`:`) or dash (`-`) as a separator in your `customId` makes it easy to parse dynamic data in your handlers.
!!!

---

## :icon-sign-in: Parameter Injection

Button handlers support automatic parameter injection.

| Injector | Returns | Description |
| :--- | :--- | :--- |
| `@Context()` | `ButtonContext` | An array containing the `ButtonInteraction` and parsed arguments. |
| `@Client()` | `HivecordClient` | The instance of the bot client. |
| `@Inject()` | `any` | Any other registered service or repository. |

---

## :icon-light-bulb: Key Points

1. **Provider Registration**: The class containing `@Button` must be registered in a module's `providers` array.
2. **Persistence**: Buttons are ephemeral by nature (they expire when the message does), but your handlers are global and permanent.
3. **Response**: You must respond to the interaction (reply, defer, or edit) within 3 seconds.

---

[!ref text="Back to Overview" icon="arrow-left"](overview.md)
[!ref text="SelectMenu" icon="arrow-right"](select-menu.md)
