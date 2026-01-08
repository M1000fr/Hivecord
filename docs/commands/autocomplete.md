---
order: 70
title: "Autocomplete"
icon: list-unordered
---

# :icon-list-unordered: Autocomplete

The `@Autocomplete` decorator allows you to provide real-time suggestions to users as they type an option in a Slash command. This is essential for providing a great user experience when dealing with dynamic lists (like a database of items or a list of server roles).

!!! tip "User Experience"
Autocomplete allows you to bypass the fixed choice limit of 25 items in Discord by filtering results dynamically based on user input.
!!!

---

## :icon-pencil: Usage

To use autocomplete, you need two things:
1. An option in your `@SlashCommandController` with `autocomplete: true`.
2. A method decorated with `@Autocomplete` to handle the logic.

=== :icon-code: Example
```typescript
@SlashCommandController({
    name: "search",
    description: "Search for an item",
    options: [
        {
            name: "item",
            description: "The item to search for",
            type: ApplicationCommandOptionType.String,
            autocomplete: true // Mandatory
        }
    ]
})
export class SearchController {
    @Autocomplete({ optionName: "item" })
    async handleSearch(
        @AutocompleteInteraction() interaction: AutocompleteInteraction
    ) {
        const focusedValue = interaction.options.getFocused();
        const choices = ["apple", "banana", "orange", "pear", "pineapple"];
        
        // Filter choices based on what the user has typed so far
        const filtered = choices.filter(choice => 
            choice.toLowerCase().startsWith(focusedValue.toLowerCase())
        );

        // Respond with up to 25 suggestions
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25)
        );
    }

    @SlashCommand()
    async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        const item = interaction.options.getString("item");
        await interaction.reply(`You selected: ${item}`);
    }
}
```
===

---

## :icon-workflow: How it works

1. **Trigger**: When the user clicks on the "item" field or types a character, Discord sends an `AutocompleteInteraction` to your bot.
2. **Detection**: Hivecord identifies the controller and the specific `@Autocomplete` method linked to that `optionName`.
3. **Execution**: Your method runs, usually performing a quick search in an array or a database.
4. **Response**: You must call `interaction.respond()` with an array of choices (`name` and `value`).

---

## :icon-info: Key Constraints

| Limit | Description |
| :--- | :--- |
| **25 Choices** | You can return a maximum of 25 suggestions at a time. |
| **3 Seconds** | You must respond within 3 seconds, or the UI will show "Load failed". |
| **No Deferred** | You cannot "defer" an autocomplete interaction. It must be a direct response. |

---

## :icon-sign-in: Specialized Injector

Use the `@AutocompleteInteraction()` decorator to inject the interaction object with the correct TypeScript typing.

```typescript
async handleSearch(
    @AutocompleteInteraction() interaction: AutocompleteInteraction
) { ... }
```

---
