import { Events, MessageFlags } from "discord.js";
import { EventBuilder } from "../../class/EventBuilder";
import { PermissionService } from "../../services/PermissionService";

export default new EventBuilder(Events.InteractionCreate).setHandler(
	async (client, interaction) => {
		if (!interaction.isChatInputCommand()) return;

		const command = client.commands.get(interaction.commandName);

		if (!command) {
			console.error(
				`No command matching ${interaction.commandName} was found.`,
			);
			return;
		}

		if (command.options.permission) {
			let roleIds: string[] = [];
			if (interaction.member) {
				if (Array.isArray(interaction.member.roles)) {
					roleIds = interaction.member.roles;
				} else {
					roleIds = interaction.member.roles.cache.map((r) => r.id);
				}
			}

			const hasPermission = await PermissionService.hasPermission(
				roleIds,
				command.options.permission,
			);
			if (!hasPermission) {
				await interaction.reply({
					content: "You do not have permission to use this command.",
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}
		}

		try {
			await command.instance.execute(client, interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: "There was an error while executing this command!",
					flags: [MessageFlags.Ephemeral],
				});
			} else {
				await interaction.reply({
					content: "There was an error while executing this command!",
					flags: [MessageFlags.Ephemeral],
				});
			}
		}
	},
);
