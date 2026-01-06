# Advanced Decorators (@Autocomplete, @Repository, @ConfigInteraction)

This section covers decorators used for specific features such as dynamic autocomplete management, database abstraction, and configuration interface automation.

## Interceptors (@UseInterceptors)

Interceptors allow executing logic before or after command execution. Since this feature is very extensive, it has its own documentation page.

👉 **[See detailed Interceptors documentation](./Interceptors.md)**

---

## Autocomplete (@Autocomplete)

The `@Autocomplete` decorator allows linking a specific method to a Slash command option to provide real-time suggestions to the user as they type.

### Configuration

Takes an `AutocompleteOptions` object containing the `optionName` (the name of the argument defined in the command options).

```typescript
import { Autocomplete } from "@decorators/commands/Autocomplete";
import { AutocompleteInteraction } from "@decorators/Interaction";

@SlashCommandController({ name: "search", description: "Search for an item" })
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
		// ... command logic with the "item" option
	}
}
```

---

## Data Repositories (@Repository)

The `@Repository` decorator is a specialized utility for data access classes. It simplifies Prisma usage by automatically handling database service injection.

### Benefits

- Automatically applies `@Injectable()`.
- Automatically injects `PrismaService` into the constructor.
- Prepares the class to be used as a singleton in your services.

```typescript
import { Repository } from "@decorators/Repository";
import { PrismaService } from "@modules/Core/services/PrismaService";

@Repository()
export class UserRepository {
	constructor(private prisma: PrismaService) {}

	async findUser(id: string) {
		return this.prisma.user.findUnique({ where: { id } });
	}
}
```

---

## Configuration Interface (@ConfigInteraction)

The `@ConfigInteraction` decorator is used for classes managing the user interface (buttons, selects) of the configuration system. It automates the injection of all services required for resolving and modifying configuration values.

### How it works

It automatically injects:

- `ConfigValueService`
- `ConfigUIBuilderService`
- `ConfigValueResolverService`
- `ConfigService`

This allows creating complex configuration interaction handlers with minimal repetitive code.

---

[Back to table of contents](./README.md)
