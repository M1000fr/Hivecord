# Custom Configuration Types (@ConfigType)

LeBot allows extending the configuration system by defining new custom data types. This is useful for managing complex structures or specific selections that are not covered by standard Discord types.

## @ConfigType

The `@ConfigType` decorator registers a class as a handler for a specific configuration type. This class is responsible for validation, transformation, and rendering the user interface for this type.

### Metadata

The decorator takes a `ConfigTypeMetadata` object:

- `id`: Unique identifier for the type (often a string or a number > 100).
- `name`: Human-readable name of the type.

### Implementation Base Classes

To function correctly within the configuration UI, a config handler must extend one of the following base classes depending on the interaction type desired:

- **`BaseSelectConfigHandler`**: For types using a dropdown selection (`StringSelectMenu`).
- **`BaseToggleConfigHandler`**: For boolean-like types using a simple toggle button.
- **`BaseModalConfigHandler`**: For types requiring text input via a Discord Modal.

### Example: Creating a Custom Modal Handler

```typescript
import { ConfigType } from "@decorators/ConfigType";
import { BaseModalConfigHandler } from "@src/class/BaseModalConfigHandler";

@ConfigType({
	id: "color_picker",
	name: "Color Picker",
})
export class ColorConfigHandler extends BaseModalConfigHandler {
	constructor(
		valueService: ConfigValueService,
		uiBuilder: ConfigUIBuilderService,
		resolverService: ConfigValueResolverService,
		configService: ConfigService,
	) {
		super(valueService, uiBuilder, resolverService, configService);
	}

	// CustomId prefix used for interaction routing
	get customIdPrefix(): string {
		return "config_color";
	}

	// You can override labels and styles
	protected override getModalTitle(t: TFunction): string {
		return "Select a Color";
	}

	// Customizing the display in the configuration list
	override async formatValue(
		guildId: string,
		value: string,
	): Promise<string> {
		return `\`${value}\``;
	}
}
```

### Customizing Value Formatting

You can override the `formatValue` method to control how the configuration value is displayed in the main configuration embed. This is useful for adding emojis, formatting IDs into names, or adding previews.

```typescript
override async formatValue(guildId: string, value: string): Promise<string> {
	if (value === "special") return "✨ **Special Value**";
	return `\`${value}\``;
}
```

## Using the custom type

Once the type is registered via `@ConfigType`, it can be used in any `@ModuleConfig` class by using its `id`.

```typescript
@ModuleConfig()
export class AppearanceConfig {
	@ConfigProperty({
		description: "Main color for embeds",
		type: "color_picker", // Uses the ID defined in the decorator
	})
	embedColor = configKey<string>("#5865F2");
}
```

## Key Points

1. **Global Injection**: Classes decorated with `@ConfigType` are automatically injected with a global scope (`scope: "global"`), meaning they are available throughout the application.
2. **Base Classes**: Always extend `BaseSelectConfigHandler`, `BaseToggleConfigHandler`, or `BaseModalConfigHandler`. These classes handle the complex logic of building Discord components, managing ephemeral messages, and routing interactions.
3. **Standardization**: Using custom types allows centralizing validation logic (e.g., checking that a string is a valid hex code) instead of repeating it in every service.
4. **Dynamic UI**: LeBot's configuration system uses these handlers to dynamically build interaction menus allowing administrators to modify settings without leaving Discord.

---

[Back to table of contents](./README.md)
