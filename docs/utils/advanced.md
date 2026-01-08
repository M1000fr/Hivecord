---
order: 90
title: Advanced Decorators
icon: tools
---

# :icon-tools: Advanced Decorators

This section covers decorators used for specific features such as dynamic autocomplete management, database abstraction, and configuration interface automation.

---

## :icon-shield: Interceptors (`@UseInterceptors`)

Interceptors allow executing logic before or after command execution. Since this feature is very extensive, it has its own documentation page.

[!ref text="See detailed Interceptors documentation" icon="arrow-right"](../core/interceptors.md)

---

## :icon-list-unordered: Autocomplete (`@Autocomplete`)

The `@Autocomplete` decorator is a **method decorator** that links a specific method to a Slash command option to provide real-time suggestions. To receive the interaction object, use the `@AutocompleteInteraction()` **parameter decorator** on one of the method's arguments.

### :icon-gear: Configuration

Takes an `AutocompleteOptions` object containing the `optionName` (the name of the argument defined in the command options).

=== :icon-code: Example
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
===

---

## :icon-database: Data Repositories (`@Repository`)

The `@Repository` decorator is a specialized utility for data access classes. It marks a class as a repository provider that should be registered in a module.

### :icon-star: Benefits

- Automatically applies `@Injectable()`.
- Tags the provider as a repository for identification.
- Uses standard constructor injection for dependencies.
- Prepares the class to be used as a singleton in your services.

=== :icon-code: Example
```typescript
import { Repository } from "@decorators/Repository";
import { PrismaService } from "@modules/Shared/services/PrismaService";

@Repository()
export class UserRepository {
	// Dependencies are injected via standard constructor injection
	constructor(private prisma: PrismaService) {}

	async findUser(id: string) {
		return this.prisma.user.findUnique({ where: { id } });
	}
}
```
===

!!! info "Explicit Registration Required"
Repositories must be explicitly registered in a module's `providers` array to be available for injection.
!!!

---

## :icon-zap: Configuration Interface (`@ConfigInteraction`)

The `@ConfigInteraction` decorator is used for classes managing the user interface (buttons, selects) of the configuration system. It automates the injection of all services required for resolving and modifying configuration values.

### :icon-workflow: How it works

It automatically injects:
- `ConfigValueService`
- `ConfigUIBuilderService`
- `ConfigValueResolverService`
- `ConfigService`

This allows creating complex configuration interaction handlers with minimal repetitive code.

---
