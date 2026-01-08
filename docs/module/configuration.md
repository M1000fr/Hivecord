---
order: 90
title: Configuration
icon: diff
---

# :icon-diff: Configuration

Hivecord features a dynamic per-server (Guild) configuration system. This system allows defining typed parameters that are automatically persisted in the database and modifiable via an interface (usually a configuration command).

---

## :icon-gear: @ModuleConfig

The `@ModuleConfig` decorator marks a class as a configuration schema for a module. This class defines the data structure that will be managed for each server.

### :icon-code: Configuration Class Example

```typescript
import { ModuleConfig } from "@decorators/ModuleConfig";
import {
	ConfigProperty,
	EConfigType,
	configKey,
} from "@decorators/ConfigProperty";

@ModuleConfig()
export class GeneralConfig {
	@ConfigProperty({
		description: "The channel where welcome messages are sent",
		type: EConfigType.Channel,
	})
	welcomeChannelId = configKey<string | null>(null);

	@ConfigProperty({
		description: "The welcome message",
		type: EConfigType.String,
	})
	welcomeMessage = configKey<string>("Welcome to the server {user}!");
}
```

---

## :icon-list-unordered: @ConfigProperty

This decorator defines an individual property within a configuration class.

### :icon-info: Decorator Options

| Property      | Type          | Description                                                    |
| :------------ | :------------ | :------------------------------------------------------------- |
| `description` | `string`      | Description of the option (used in config commands).           |
| `type`        | `EConfigType` | The data type (String, Integer, Boolean, Role, Channel, etc.). |
| `displayName` | `string`      | (Optional) Human-readable name of the option.                  |
| `choices`     | `Array`       | (Optional) List of fixed choices for `StringChoice` types.     |
| `required`    | `boolean`     | (Optional) Whether the option is mandatory.                    |

### :icon-stack: EConfigType

The system supports standard Discord types as well as custom types:

- `String`, `Integer`, `Boolean`, `User`, `Channel`, `Role`, `Number`.
- `RoleArray`, `ChannelArray`, `StringArray`: For storing lists of items.
- `StringChoice`: To limit values to a predefined list.

---

## :icon-mention: @ConfigContext

The `@ConfigContext` decorator allows defining which context variables (placeholders) are available for a given configuration property. This is particularly useful for customizable messages.

```typescript
import { ConfigContext } from "@decorators/ConfigContext";
import { ConfigContextVariable } from "@enums/ConfigContextVariable";

@ModuleConfig()
export class WelcomeConfig {
	@ConfigProperty({
		description: "Welcome message",
		type: EConfigType.String,
	})
	@ConfigContext([
		ConfigContextVariable.User,
		ConfigContextVariable.GuildName,
	])
	welcomeMessage = configKey<string>("Welcome {user} to {guild}!");
}
```

---

## :icon-package: Usage in a Module

To enable configuration, bind the class to the module via the `config` property of the `@Module` decorator.

```typescript
@Module({
    name: "General",
    config: GeneralConfig,
    providers: [...]
})
export class GeneralModule {}
```

---

## :icon-terminal: Accessing Values

Once configured, you can access values via the `guild.config` object (if injected or extended) or via the `ConfigService`.

```typescript
// Example in a command
const channelId = await interaction.guild.config.general.welcomeChannelId;
```

---

## :icon-zap: @OnConfigUpdate

This decorator allows reacting in real-time to configuration changes. When an option is modified by an administrator, the decorated method is automatically called.

### :icon-pencil: Usage and Injection

The method can inject several parameters via dedicated parameter decorators:

- `@Client()`: The bot instance.

```typescript
import { OnConfigUpdate } from "@decorators/OnConfigUpdate";
import { Client } from "@decorators/params";

@Injectable()
export class WelcomeService {
	@OnConfigUpdate("general.welcomeChannelId")
	async onWelcomeChannelChange(@Client() client: HivecordClient) {
		console.log(`The welcome channel configuration has changed.`);
		// Refresh logic, logs, etc.
	}
}
```

---

## :icon-package: @ConfigInteraction

The `@ConfigInteraction` decorator is used to mark classes that handle configuration-related interactions (buttons, select menus, modals). It automatically applies `@Injectable()` and injects the required services for configuration management.

!!! info "Automatic Injection"
Classes decorated with `@ConfigInteraction` automatically receive four essential services without needing to manually specify them in the constructor.
!!!

### :icon-pencil: Usage

Apply `@ConfigInteraction()` to classes that extend configuration handler base classes like `BaseModalConfigHandler`, `BaseSelectConfigHandler`, or `BaseToggleConfigHandler`.

```typescript
import { ConfigInteraction } from "@decorators/ConfigInteraction";
import { BaseModalConfigHandler } from "@class/BaseModalConfigHandler";
import { ConfigValueService } from "@utils/ConfigValueService";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigService } from "@modules/Configuration/services/ConfigService";

@ConfigInteraction()
export class MyConfigHandler extends BaseModalConfigHandler {
    constructor(
        valueService: ConfigValueService,
        uiBuilder: ConfigUIBuilderService,
        resolverService: ConfigValueResolverService,
        configService: ConfigService,
    ) {
        super(valueService, uiBuilder, resolverService, configService);
    }

    // Your implementation...
}
```

### :icon-zap: Injected Services

The decorator automatically provides the following services in the constructor:

| Service | Description |
| :--- | :--- |
| `ConfigValueService` | Manages reading and writing configuration values to the database. |
| `ConfigUIBuilderService` | Builds Discord UI components for configuration interfaces. |
| `ConfigValueResolverService` | Resolves and formats configuration values for display. |
| `ConfigService` | Core service for configuration system operations. |

### :icon-info: Key Points

1. **Extends Base Classes**: Typically used with `BaseModalConfigHandler`, `BaseSelectConfigHandler`, or `BaseToggleConfigHandler`.
2. **Automatic Registration**: Classes are automatically injectable and can be used in custom configuration types.
3. **Standard Order**: The four injected services must appear in the constructor in the exact order shown above.

---
