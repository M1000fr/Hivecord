---
order: 100
title: Parameter Decorators
icon: mention
---

# :icon-mention: Parameter Decorators

Hivecord uses parameter decorators to automatically inject specific objects into your command or interaction methods. This avoids having to manually extract data from the base interaction object.

---

## :icon-zap: Interaction

### `@CommandInteraction()`

Injects the full interaction object for Slash commands or context menu commands.

=== :icon-code: Example
```typescript
async execute(@CommandInteraction() interaction: ChatInputCommandInteraction) {
    await interaction.reply("Hello!");
}
```
===

### `@AutocompleteInteraction()`

Injects the `AutocompleteInteraction` object for methods handling autocompletion. This is used in conjunction with the `@Autocomplete` method decorator.

=== :icon-code: Example
```typescript
@Autocomplete({ optionName: "item" })
async handleAutocomplete(@AutocompleteInteraction() interaction: AutocompleteInteraction) {
    // ...
}
```
===

### `@Context()`

Injects the raw arguments array of the event or interaction. This is particularly useful for events where you need to access Discord objects (like `Message`, `GuildMember`, etc.).

#### :icon-list-unordered: For Events
In an `@On` event handler, `@Context()` returns an array containing all arguments passed by `discord.js`.

```typescript
@On(BotEvents.MessageCreate)
async onMessage(@Context() [message]: ContextOf<"messageCreate">) {
    console.log(message.content);
}
```

#### :icon-terminal: For Commands & Interactions
In a command or a component interaction (`@Button`, `@SelectMenu`, `@Modal`), `@Context()` returns an array containing the interaction object.

```typescript
// Slash Command
async execute(@Context() [interaction]: [ChatInputCommandInteraction]) {
    await interaction.reply("Hello!");
}

// Button Interaction
@Button("my_button")
async onButtonClick(@Context() [interaction]: ButtonContext) {
    await interaction.reply("Button clicked!");
}
```

!!! info
Hivecord provides specific types for these contexts: `ButtonContext`, `SelectMenuContext`, and `ModalContext`.
!!!

---

## :icon-cross-reference: Target

Used exclusively with `@UserCommand` and `@MessageCommand`.

### `@TargetUser()`

Retrieves the user (`User`) on whom the action was performed via the context menu.

### `@TargetMessage()`

Retrieves the message (`Message`) on which the action was performed via the context menu.

=== :icon-code: Example
```typescript
@MessageCommand({ name: "Copy" })
export default class CopyCommand {
	async execute(
		@CommandInteraction() interaction: MessageContextMenuCommandInteraction,
		@TargetMessage() message: Message,
	) {
		await interaction.reply({ content: message.content, flags: [MessageFlags.Ephemeral] });
	}
}
```
===

---

## :icon-cpu: System

### `@Client()`

Injects the global `HivecordClient` instance. Useful for accessing global properties, cache, or client utility methods.

=== :icon-code: Example
```typescript
async doSomething(@Client() client: HivecordClient) {
    console.log(`The bot is logged in as ${client.user?.tag}`);
}
```
===

---

## :icon-light-bulb: Key Points

1. **Typing**: Always type your arguments with the corresponding `discord.js` classes to benefit from autocompletion.
2. **Order**: The order of decorated arguments does not matter to the injection system, but it is recommended to maintain a consistent structure (e.g., `interaction` first).
3. **Automation**: These decorators only work within classes registered as `providers` in a `@Module`.

---

[!ref text="Back to Advanced Decorators" icon="arrow-left"](advanced.md)