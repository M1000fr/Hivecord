# Slash Commands (@SlashCommandController & @SlashCommand)

Hivecord simplifies the creation of Discord slash commands using class and method decorators. This system automatically handles command registration with the Discord API and interaction routing.

!!! success
Hivecord automatically handles Global vs Guild commands registration based on your bot's configuration.
!!!

## @SlashCommandController

This decorator is placed on a class to define it as a command container.

### Configuration

It accepts an object of type `CommandOptions`:

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Command name (lowercase, no spaces). |
| `description` | `string` | **Required.** Description displayed in the Discord interface. |
| `contexts` | `InteractionContext[]` | (Optional) Defines whether the command is available in DMs, Guilds, etc. |

```ts
@SlashCommandController({
  name: "ping",
  description: "Responds with Pong!",
})
export default class PingCommand {
  // ...
}
```

---

## @SlashCommand

This decorator is placed on a method of the class to define the command entry point. By default, the `execute` method (or any method decorated without a specific name) is called when the base command is executed.

=== :icon-terminal: Code
```ts
    @SlashCommand()
    async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong! :ping_pong:");
    }
```
=== :icon-info: Note
If you have subcommands, a method decorated with `@SlashCommand()` without a specific name will only be called if the user runs the base command without subcommands (if allowed by Discord).
===

---

## Subcommands & Routing

Retype allows multiple ways to organize complex commands.

### @Subcommand

To create subcommands (e.g., `/config set` and `/config view`), use the `@Subcommand` decorator.

```ts
@SlashCommandController({
  name: "config",
  description: "Manages the configuration",
})
export default class ConfigCommand {
  @Subcommand({
    name: "view",
    description: "View current configuration",
  })
  async view(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    // Logic to view
  }

  @Subcommand({
    name: "set",
    description: "Modify an option",
  })
  async set(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    // Logic to modify
  }
}
```

### @OptionRoute

The `@OptionRoute` decorator allows you to route an interaction to different methods based on the value of a specific option. This is particularly useful for commands that use a "type" or "action" option to determine their behavior without using full subcommands.

[!ref target="danger" text="Caution: OptionRoute is strictly for String/Integer choice routing."]

```ts
@SlashCommandController({
  name: "manage",
  description: "Manage items",
  options: [
    {
      name: "action",
      type: "STRING",
      description: "Action to perform",
      required: true,
      choices: [
        { name: "Add", value: "add" },
        { name: "Remove", value: "remove" },
      ],
    },
  ],
})
export default class ManageCommand {
  @SlashCommand()
  @OptionRoute({ option: "action", value: "add" })
  async add(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    // Executed if the "action" option is "add"
  }

  @SlashCommand()
  @OptionRoute({ option: "action", value: "remove" })
  async remove(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    // Executed if the "action" option is "remove"
  }
}
```

---

## @Autocomplete

The `@Autocomplete` decorator allows you to provide real-time suggestions for a specific option in your Slash command.

```ts
@SlashCommandController({
  name: "search",
  description: "Search for an item",
})
export default class SearchCommand {
  @Autocomplete({ optionName: "item" })
  async handleSearch(
    @AutocompleteInteraction() interaction: AutocompleteInteraction,
  ) {
    const focusedValue = interaction.options.getFocused();
    const choices = ["apple", "banana", "orange"];
    const filtered = choices.filter((choice) =>
      choice.startsWith(focusedValue),
    );

    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice })),
    );
  }

  @SlashCommand()
  async execute(
    @CommandInteraction() interaction: ChatInputCommandInteraction,
  ) {
    const item = interaction.options.getString("item");
    await interaction.reply(`You selected: ${item}`);
  }
}
```

---

## Parameter Injection

Command methods support automatic parameter injection to facilitate access to Discord objects.

| Decorator | Description |
| :--- | :--- |
| `@CommandInteraction()` | The `ChatInputCommandInteraction` interaction. |
| `@Context()` | The `IExecutionContext` (i18n, guild config). |
| `@Client()` | The `HivecordClient` instance. |

!!! info
Check the [Params Injection guide](./Params.md) for a full list of available injectors.
!!!

---

[!ref text="Back to table of contents" icon="arrow-left"](./README.md)