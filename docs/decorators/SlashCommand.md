# Slash Commands (@SlashCommandController & @SlashCommand)

Hivecord simplifies the creation of Discord slash commands using class and method decorators. This system automatically handles command registration with the Discord API and interaction routing.

## @SlashCommandController

This decorator is placed on a class to define it as a command container.

### Configuration

It accepts an object of type `CommandOptions`:

- `name`: Command name (lowercase, no spaces).
- `description`: Description displayed in the Discord interface.
- `contexts`: (Optional) Defines whether the command is available in DMs, Guilds, etc.

```ts
@SlashCommandController({
  name: "ping",
  description: "Responds with Pong!",
})
export default class PingCommand {
  // ...
}
```

## @SlashCommand

This decorator is placed on a method of the class to define the command entry point. By default, the `execute` method (or any method decorated without a specific name) is called when the base command is executed.

```ts
    @SlashCommand()
    async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong! 🏓");
    }
```

## @Subcommand

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

## @OptionRoute

The `@OptionRoute` decorator allows you to route an interaction to different methods based on the value of a specific option. This is particularly useful for commands that use a "type" or "action" option to determine their behavior without using full subcommands.

```ts
@SlashCommandController({
  name: "manage",
  description: "Manage items",
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

## @Autocomplete

The `@Autocomplete` decorator allows you to provide real-time suggestions for a specific option in your Slash command. It is a method decorator that links a handler to an option name.

To receive the autocomplete interaction, use the `@AutocompleteInteraction()` parameter decorator.

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

## Parameter Injection

Command methods support automatic parameter injection to facilitate access to Discord objects:

- `@CommandInteraction()`: The `ChatInputCommandInteraction` interaction.
- `@Context()`: The `IExecutionContext` (i18n, guild config).
- `@Client()`: The `HivecordClient` instance.

---

[Back to table of contents](./README.md)
