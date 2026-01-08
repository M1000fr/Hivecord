# Configuration (@ModuleConfig & @ConfigProperty)

Hivecord features a dynamic per-server (Guild) configuration system. This system allows defining typed parameters that are automatically persisted in the database and modifiable via an interface (usually a configuration command).

## @ModuleConfig

The `@ModuleConfig` decorator marks a class as a configuration schema for a module. This class defines the data structure that will be managed for each server.

### Configuration Class Example

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

## @ConfigProperty

This decorator defines an individual property within a configuration class.

### Decorator Options

| Property      | Type          | Description                                                    |
| :------------ | :------------ | :------------------------------------------------------------- |
| `description` | `string`      | Description of the option (used in config commands).           |
| `type`        | `EConfigType` | The data type (String, Integer, Boolean, Role, Channel, etc.). |
| `displayName` | `string`      | (Optional) Human-readable name of the option.                  |
| `choices`     | `Array`       | (Optional) List of fixed choices for `StringChoice` types.     |
| `required`    | `boolean`     | (Optional) Whether the option is mandatory.                    |

### EConfigType

The system supports standard Discord types as well as custom types:

- `String`, `Integer`, `Boolean`, `User`, `Channel`, `Role`, `Number`.
- `RoleArray`, `ChannelArray`, `StringArray`: For storing lists of items.
- `StringChoice`: To limit values to a predefined list.

## @ConfigContext

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

## Usage in a Module

To enable configuration, bind the class to the module via the `config` property of the `@Module` decorator.

```typescript
@Module({
    name: "General",
    config: GeneralConfig,
    providers: [...]
})
export class GeneralModule {}
```

## Accessing Values

Once configured, you can access values via the `guild.config` object (if injected or extended) or via the `ConfigService`.

```typescript
// Example in a command
const channelId = await interaction.guild.config.general.welcomeChannelId;
```

## @OnConfigUpdate

This decorator allows reacting in real-time to configuration changes. When an option is modified by an administrator, the decorated method is automatically called.

### Usage and Injection

The method can inject several parameters via dedicated parameter decorators:

- `@Client()`: The bot instance.

```typescript
import { OnConfigUpdate } from "@decorators/OnConfigUpdate";
import { Client } from "@decorators/params";

export class WelcomeService {
	@OnConfigUpdate("general.welcomeChannelId")
	async onWelcomeChannelChange(@Client() client: HivecordClient) {
		console.log(`The welcome channel configuration has changed.`);
		// Refresh logic, logs, etc.
	}
}
```

---

[Back to table of contents]/)
