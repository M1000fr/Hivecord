# Custom Configuration Types (@ConfigType)

LeBot allows extending the configuration system by defining new custom data types. This is useful for managing complex structures or specific selections that are not covered by standard Discord types.

## @ConfigType

The `@ConfigType` decorator registers a class as a handler for a specific configuration type. This class is responsible for validation, transformation, and rendering the user interface for this type.

### Metadata

The decorator takes a `ConfigTypeMetadata` object:

- `id`: Unique identifier for the type (often a string or a number > 100).
- `name`: Human-readable name of the type.

### Example of creating a custom type

```typescript
import { ConfigType } from "@decorators/ConfigType";

@ConfigType({
	id: "color_picker",
	name: "Color Picker",
})
export class ColorConfigHandler {
	// The class must implement the type management logic
	// (Button generation, modals, data validation)
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
2. **Standardization**: Using custom types allows centralizing validation logic (e.g., checking that a string is a valid hex code) instead of repeating it in every service.
3. **Dynamic UI**: LeBot's configuration system uses these handlers to dynamically build interaction menus (SelectMenus, Modals) allowing administrators to modify settings.

---

[Back to table of contents](./README.md)
