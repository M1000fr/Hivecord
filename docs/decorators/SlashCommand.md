# Slash Commands (@SlashCommandController & @SlashCommand)

LeBot simplifies the creation of Discord slash commands using class and method decorators. This system automatically handles command registration with the Discord API and interaction routing.

## @SlashCommandController

This decorator is placed on a class to define it as a command container.

### Configuration
It accepts an object of type `CommandOptions`:
- `name`: Command name (lowercase, no spaces).
- `description`: Description displayed in the Discord interface.
- `contexts`: (Optional) Defines whether the command is available in DMs, Guilds, etc.

```LeBot/src/modules/General/commands/PingCommand.ts#L1-8
@SlashCommandController({
    name: "ping",
    description: "Responds with Pong!"
})
export default class PingCommand {
    // ...
}
```

## @SlashCommand

This decorator is placed on a method of the class to define the command entry point. By default, the `execute` method (or any method decorated without a specific name) is called when the base command is executed.

```LeBot/src/modules/General/commands/PingCommand.ts#L10-15
    @SlashCommand()
    async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong! 🏓");
    }
```

## @Subcommand

To create subcommands (e.g., `/config set` and `/config view`), use the `@Subcommand` decorator.

```LeBot/src/modules/Configuration/commands/ConfigCommand.ts#L1-20
@SlashCommandController({
    name: "config",
    description: "Manages the configuration"
})
export default class ConfigCommand {
    @Subcommand({
        name: "view",
        description: "View current configuration"
    })
    async view(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        // Logic to view
    }

    @Subcommand({
        name: "set",
        description: "Modify an option"
    })
    async set(@CommandInteraction() interaction: ChatInputCommandInteraction) {
        // Logic to modify
    }
}
```

## Parameter Injection

Command methods support automatic parameter injection to facilitate access to Discord objects:
- `@CommandInteraction()`: The `ChatInputCommandInteraction` interaction.
- `@Client()`: The `LeBotClient` instance.

---
[Back to table of contents](./README.md)