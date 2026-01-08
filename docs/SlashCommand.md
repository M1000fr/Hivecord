# :icon-terminal: SlashCommand

Hivecord simplifies the creation of Discord slash commands using class and method decorators. This system automatically handles command registration with the Discord API and interaction routing.

!!! success "Auto-Registration"
Hivecord automatically handles Global vs Guild commands registration based on your bot's configuration. No manual API calls needed.
!!!

---

## :icon-gear: Controller

The `@SlashCommandController` decorator is placed on a class to define it as a command container.

### Configuration

It accepts an object of type `CommandOptions`:

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Command name (lowercase, no spaces). |
| `description` | `string` | **Required.** Description displayed in Discord. |
| `contexts` | `InteractionContext[]` | (Optional) Defines where the command is available (DMs, Guilds). |

```ts
@SlashCommandController({
  name: "ping",
  description: "Responds with Pong!",
})
export default class PingCommand {
  @SlashCommand()
  async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
      await interaction.reply("Pong! :ping_pong:");
  }
}
```

---

## :icon-stack: Subcommands

To create subcommands (e.g., `/config set` and `/config view`), use the `@Subcommand` decorator.

```ts
@SlashCommandController({
  name: "config",
  description: "Manages the configuration",
})
export default class ConfigCommand {
  @Subcommand({ name: "view", description: "View current configuration" })
  async view(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    // Logic to view
  }

  @Subcommand({ name: "set", description: "Modify an option" })
  async set(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    // Logic to modify
  }
}
```

---

## :icon-list-unordered: Autocomplete

The `@Autocomplete` decorator allows you to provide real-time suggestions for a specific option.

```ts
@Autocomplete({ optionName: "item" })
async handleSearch(
  @AutocompleteInteraction() interaction: AutocompleteInteraction,
) {
  const focusedValue = interaction.options.getFocused();
  const choices = ["apple", "banana", "orange"];
  const filtered = choices.filter(c => c.startsWith(focusedValue));

  await interaction.respond(
    filtered.map(c => ({ name: c, value: c })),
  );
}
```

---

## :icon-sign-in: Parameter Injection

Command methods support automatic parameter injection to facilitate access to Discord objects.

| Decorator | Description |
| :--- | :--- |
| `@CommandInteraction()` | The current `ChatInputCommandInteraction`. |
| `@Context()` | The `IExecutionContext` (i18n, guild config). |
| `@Client()` | The `HivecordClient` instance. |

!!! tip
Check the [Parameters Injection guide](Params.md) for the full list.
!!!

---

[!ref text="Back to Home" icon="arrow-left"](/)
[!ref text="Interactions" icon="arrow-right"](Interactions.md)