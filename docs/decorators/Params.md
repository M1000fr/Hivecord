# Parameter Decorators

LeBot uses parameter decorators to automatically inject specific objects into your command or interaction methods. This avoids having to manually extract data from the base interaction object.

## Interaction

### @CommandInteraction()

Injects the full interaction object for Slash commands or context menu commands.

```typescript
async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    await interaction.reply("Hello!");
}
```

### @AutocompleteInteraction()

Injects the `AutocompleteInteraction` object for methods handling autocompletion.

```typescript
async handleAutocomplete(@AutocompleteInteraction() interaction: AutocompleteInteraction) {
    // ...
}
```

### @Context()

Injects the execution context (`IExecutionContext`), which contains utility methods for internationalization (`i18n`) and access to the guild's configuration.

```typescript
async execute(@Context() context: IExecutionContext) {
    const text = context.i18n("WELCOME");
}
```

## Target

Used exclusively with `@UserCommand` and `@MessageCommand`.

### @TargetUser()

Retrieves the user (`User`) on whom the action was performed via the context menu.

### @TargetMessage()

Retrieves the message (`Message`) on which the action was performed via the context menu.

```typescript
@MessageCommand({ name: "Copy" })
export default class CopyCommand {
	async execute(
		@CommandInteraction() interaction: MessageContextMenuCommandInteraction,
		@TargetMessage() message: Message,
	) {
		await interaction.reply({ content: message.content, ephemeral: true });
	}
}
```

## System

### @Client()

Injects the global `LeBotClient` instance. Useful for accessing global properties, cache, or client utility methods.

```typescript
async doSomething(@Client() client: LeBotClient) {
    console.log(`The bot is logged in as ${client.user?.tag}`);
}
```

## Key Points

1. **Typing**: Always type your arguments with the corresponding `discord.js` classes to benefit from autocompletion.
2. **Order**: The order of decorated arguments does not matter to the injection system, but it is recommended to maintain a consistent structure (e.g., `interaction` first).
3. **Automation**: These decorators only work within classes registered as `providers` in a `@Module`.

---

[Back to table of contents](./README.md)
