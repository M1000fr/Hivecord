import { Events, type Interaction } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';
import { GroupService } from '@services/GroupService';
import { EPermission } from '@enums/EPermission';

@Event({
	name: Events.InteractionCreate,
})
export default class AutocompleteHandlerEvent extends BaseEvent<Events.InteractionCreate> {
	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (!interaction.isAutocomplete()) return;

		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			// Handle autocomplete for modules command
			if (interaction.commandName === "modules") {
				const focusedValue = interaction.options.getFocused().toLowerCase();

				const modules = Array.from(client.modules.values())
					.filter((m) => m.options.config) // Only show modules with config
					.filter((m) =>
						m.options.name.toLowerCase().includes(focusedValue),
					)
					.map((m) => ({
						name: m.options.name,
						value: m.options.name.toLowerCase(),
					}))
					.slice(0, 25); // Discord limit

				await interaction.respond(modules);
			}

			// Handle autocomplete for group command
			if (interaction.commandName === "group") {
				const focusedOption = interaction.options.getFocused(true);
				
				if (focusedOption.name === "name" || focusedOption.name === "group") {
					const focusedValue = focusedOption.value.toLowerCase();
					const groups = await GroupService.listGroups();
					
					const filtered = groups
						.filter(g => g.name.toLowerCase().includes(focusedValue))
						.map(g => ({
							name: g.name,
							value: g.name
						}))
						.slice(0, 25);
						
					await interaction.respond(filtered);
				}

				if (focusedOption.name === "permission") {
					const focusedValue = focusedOption.value.toLowerCase();
					const subcommandGroup = interaction.options.getSubcommandGroup();
					const subcommand = interaction.options.getSubcommand();
					const groupName = interaction.options.getString("group");

					let permissions: string[] = [];

					if (subcommandGroup === "permissions") {
						if (groupName) {
							const group = await GroupService.getGroup(groupName);
							if (group) {
								const groupPermissions = group.Permissions.map(
									(p) => p.Permissions.name,
								);

								if (subcommand === "add") {
									permissions = Object.values(EPermission).filter(
										(p) => !groupPermissions.includes(p),
									);
								} else if (subcommand === "remove") {
									permissions = groupPermissions;
								}
							} else if (subcommand === "add") {
								permissions = Object.values(EPermission);
							}
						} else if (subcommand === "add") {
							permissions = Object.values(EPermission);
						}
					}

					const filtered = permissions
						.filter((p) => p.toLowerCase().includes(focusedValue))
						.map((p) => ({
							name: p,
							value: p,
						}))
						.slice(0, 25);

					await interaction.respond(filtered);
				}
			}
		} catch (error) {
			console.error(error);
		}
	}
}
