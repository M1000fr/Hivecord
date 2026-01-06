# Decorators Documentation

LeBot uses a decorator-based architecture to simplify component declaration, dependency injection, and Discord interaction management. This approach keeps the code clean, modular, and highly typed.

## Table of Contents

### Structure and Injection

- [**@Module**](./Module.md): Defines a module, its providers, imports, and configuration.
- [**@Injectable**](./Injectable.md): Marks a class as injectable by the DI (Dependency Injection) system.
- [**@Inject**](./Injectable.md#inject): Allows manual injection of a dependency into a constructor.

### Commands and Permissions

- [**@SlashCommandController**](./SlashCommand.md): Defines a class as a Slash command controller.
- [**@SlashCommand / @Subcommand**](./SlashCommand.md): Marks a method as an entry point for a command or sub-command.
- [**@UserCommand / @MessageCommand**](./ContextCommands.md): Creates context menu commands (right-click on user or message).
- [**@CommandPermission**](./Permissions.md): Restricts access to a command via the bot's permission system.

### Events and Interactions

- [**@EventController**](./Events.md): Groups event listeners within a class.
- [**@On**](./Events.md#on): Listens for a Discord event (e.g., `messageCreate`, `ready`).
- [**@Button / @SelectMenu / @Modal**](./Interactions.md): Handles interactions with components via their `customId` (supports wildcards).

### Method Parameters (Injection)

- [**@CommandInteraction / @AutocompleteInteraction**](./Params.md#interaction): Injects the corresponding Discord interaction.
- [**@Client**](./Params.md#client): Injects the `LeBotClient` instance.
- [**@TargetUser / @TargetMessage**](./Params.md#cible): Retrieves the target of a context command.

### Configuration and Advanced

- [**@ModuleConfig / @ConfigProperty**](./Configuration.md): Defines the dynamic configuration schema for a module.
- [**@ConfigContext**](./Configuration.md#configcontext): Defines the context variables (placeholders) available for an option.
- [**@OnConfigUpdate**](./Configuration.md#onconfigupdate): Reacts in real-time to configuration changes.
- [**@ConfigType**](./ConfigTypes.md): Registers a custom configuration type.
- [**@UseInterceptors**](./Interceptors.md): Applies interceptors (validation, logs, etc.) to a class or method.
- [**@Autocomplete**](./Advanced.md#autocomplétion-autocomplete): Links a method to a command's autocomplete logic.
- [**@Repository**](./Advanced.md#dépôts-de-données-repository): Specialization of `@Injectable` for data access with Prisma.
- [**@ConfigInteraction**](./Advanced.md#interface-de-configuration-configinteraction): Automates injection for configuration UI handlers.

---

[Back to main README](../../README.md)
